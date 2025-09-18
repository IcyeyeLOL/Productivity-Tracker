# Productivity Tracker

A comprehensive full-stack productivity tracking application built with modern technologies.

## 🚀 Features

- **Project Management**: Create and manage projects with tasks and deadlines
- **Time Tracking**: Track time spent on different tasks and projects
- **Goal Setting**: Set and monitor personal and professional goals
- **File Management**: Upload and organize project-related files
- **Analytics**: Visualize productivity patterns and insights
- **User Authentication**: Secure JWT-based authentication system

## 🛠 Technology Stack

### Frontend
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- React hooks for state management

### Backend
- **Main API**: Spring Boot 3.x (Java 17)
- **Microservices**: Node.js with Express
- **Database**: PostgreSQL 15
- **File Storage**: AWS S3
- **Authentication**: JWT tokens

### DevOps
- Docker & Docker Compose
- Environment-based configuration

## 📁 Project Structure

```
productivity-tracker/
├── frontend/                 # Next.js frontend application
├── backend/
│   ├── springboot-api/      # Main Spring Boot API
│   └── nodejs-microservices/ # Node.js microservices
├── database/                # Database schema and migrations
├── docker/                  # Docker configuration
├── docs/                    # Documentation
└── docker-compose.yml       # Multi-container setup
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Java 17+ (for local development)
- PostgreSQL 15+ (for local development)

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/IcyeyeLOL/Productivity-Tracker.git
cd Productivity-Tracker
```

2. Start all services:
```bash
docker-compose up --build
```

3. Access the applications:
- Frontend: http://localhost:3000
- Spring Boot API: http://localhost:8080/api/health
- Node.js Microservices: http://localhost:3001/api/v1/health
- PostgreSQL: localhost:5432

### Local Development

#### Frontend (Next.js)
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

#### Spring Boot API
```bash
cd backend/springboot-api
./mvnw spring-boot:run
```

#### Node.js Microservices
```bash
cd backend/nodejs-microservices
npm install
cp .env.example .env
npm run dev
```

#### Database Setup
```bash
# Using Docker
docker run --name postgres-dev -e POSTGRES_DB=productivity_tracker -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15-alpine

# Import schema
psql -h localhost -U postgres -d productivity_tracker -f database/schema.sql
```

## 📚 API Documentation

### Health Checks
- **Frontend**: http://localhost:3000
- **Spring Boot API**: http://localhost:8080/api/health
- **Node.js Microservices**: http://localhost:3001/api/v1/health

### Main API Endpoints (Spring Boot)
- `GET /api/health` - API health status
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/users/profile` - Get user profile
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project

### Microservices Endpoints (Node.js)
- `GET /api/v1/health` - Service health status
- `POST /api/v1/files/upload` - File upload
- `GET /api/v1/analytics/dashboard` - Analytics data

## 🔒 Environment Configuration

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_MICROSERVICES_URL=http://localhost:3001/api/v1
```

### Spring Boot (application.properties)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/productivity_tracker
spring.datasource.username=postgres
spring.datasource.password=password
jwt.secret=your-secret-key
```

### Node.js (.env)
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## 🧪 Testing

```bash
# Frontend tests
cd frontend && npm test

# Spring Boot tests
cd backend/springboot-api && ./mvnw test

# Node.js tests
cd backend/nodejs-microservices && npm test
```

## 📖 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md) (to be created)
- [Deployment Guide](docs/DEPLOYMENT.md) (to be created)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Development Status

This project is currently in active development. The following phases are planned:

- [x] **Phase 1**: Project setup and architecture planning
- [x] **Phase 2**: Database design and setup
- [x] **Phase 3**: Backend development (Spring Boot + Node.js)
- [ ] **Phase 4**: Frontend development (Next.js)
- [ ] **Phase 5**: AWS S3 integration
- [ ] **Phase 6**: Authentication and security
- [ ] **Phase 7**: Testing and deployment
- [ ] **Phase 8**: Monitoring and analytics