# Quick Start Guide

## Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Java 17+ (for local development)

## 🚀 Start the Application

### Option 1: Docker Compose (Recommended)
Start all services with one command:
```bash
docker compose up --build
```

Access the services:
- **Frontend**: http://localhost:3000
- **Spring Boot API**: http://localhost:8080/api/health
- **Node.js Microservices**: http://localhost:3001/api/v1/health
- **Database**: localhost:5432

### Option 2: Local Development

1. **Start PostgreSQL**:
```bash
docker run --name postgres-dev \
  -e POSTGRES_DB=productivity_tracker \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 -d postgres:15-alpine

# Import schema
psql -h localhost -U postgres -d productivity_tracker -f database/schema.sql
```

2. **Start Spring Boot API**:
```bash
cd backend/springboot-api
./mvnw spring-boot:run
```

3. **Start Node.js Microservices**:
```bash
cd backend/nodejs-microservices
cp .env.example .env
npm install
npm run dev
```

4. **Start Frontend**:
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

## 🧪 Test the Setup
Run the validation script:
```bash
./test-setup.sh
```

## 📝 Environment Configuration

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_MICROSERVICES_URL=http://localhost:3001/api/v1
```

### Node.js Microservices (.env)
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## 🔗 API Endpoints

### Health Checks
- Spring Boot: `GET /api/health`
- Node.js: `GET /api/v1/health`

### Future API Endpoints
- Authentication: `/api/auth/login`, `/api/auth/register`
- Users: `/api/users/profile`
- Projects: `/api/projects`
- Tasks: `/api/tasks`
- Files: `/api/v1/files/upload`

## 🛠 Development Commands

### Frontend
```bash
cd frontend
npm run dev        # Development server
npm run build      # Production build
npm run lint       # Linting
```

### Spring Boot
```bash
cd backend/springboot-api
./mvnw spring-boot:run    # Development server
./mvnw test              # Run tests
./mvnw package           # Build JAR
```

### Node.js Microservices
```bash
cd backend/nodejs-microservices
npm run dev        # Development server
npm test          # Run tests
npm run build     # Build TypeScript
```

## 🚧 Next Steps
1. Implement authentication endpoints
2. Create project and task management APIs
3. Build frontend UI components
4. Add comprehensive testing
5. Setup CI/CD pipeline