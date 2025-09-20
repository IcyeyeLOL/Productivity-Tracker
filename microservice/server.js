const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const multer = require('multer');
const winston = require('winston');
const Joi = require('joi');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Configure AWS S3
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.error('JWT verification failed:', err);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Validation schemas
const fileUploadSchema = Joi.object({
  projectId: Joi.string().required(),
  taskId: Joi.string().optional(),
  description: Joi.string().max(500).optional()
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'productivity-microservice',
    version: '1.0.0'
  });
});

// File upload endpoint
app.post('/api/files/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate request body
    const { error, value } = fileUploadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { projectId, taskId, description } = value;
    const file = req.file;

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${req.user.userId}/${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    // Upload to S3
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        userId: req.user.userId.toString(),
        projectId: projectId,
        taskId: taskId || '',
        description: description || '',
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      }
    };

    const result = await s3.upload(uploadParams).promise();

    logger.info('File uploaded successfully', {
      userId: req.user.userId,
      projectId,
      taskId,
      fileName: file.originalname,
      s3Key: fileName
    });

    res.json({
      success: true,
      file: {
        id: fileName,
        originalName: file.originalname,
        url: result.Location,
        size: file.size,
        type: file.mimetype,
        projectId,
        taskId,
        description,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get file endpoint
app.get('/api/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileId
    };

    const result = await s3.getObject(params).promise();

    res.set({
      'Content-Type': result.ContentType,
      'Content-Length': result.ContentLength,
      'Content-Disposition': `attachment; filename="${result.Metadata.originalname}"`
    });

    res.send(result.Body);

  } catch (error) {
    logger.error('File retrieval error:', error);
    if (error.code === 'NoSuchKey') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: 'Failed to retrieve file' });
    }
  }
});

// Delete file endpoint
app.delete('/api/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileId
    };

    await s3.deleteObject(params).promise();

    logger.info('File deleted successfully', {
      userId: req.user.userId,
      fileId
    });

    res.json({ success: true, message: 'File deleted successfully' });

  } catch (error) {
    logger.error('File deletion error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// List files for a project
app.get('/api/files/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: `${req.user.userId}/${projectId}/`
    };

    const result = await s3.listObjectsV2(params).promise();

    const files = result.Contents.map(obj => ({
      id: obj.Key,
      name: obj.Key.split('/').pop(),
      size: obj.Size,
      lastModified: obj.LastModified,
      url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${obj.Key}`
    }));

    res.json({ files });

  } catch (error) {
    logger.error('File listing error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Productivity microservice running on port ${PORT}`);
  console.log(`🚀 Microservice server running on http://localhost:${PORT}`);
});

module.exports = app;
