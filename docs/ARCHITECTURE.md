# Productivity Tracker Architecture

## Overview
The Productivity Tracker is a comprehensive full-stack application designed to help users track their productivity, manage projects, and achieve their goals.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API / Redux Toolkit (to be implemented)
- **Authentication**: JWT with secure HTTP-only cookies

### Backend
- **Main API**: Spring Boot 3.x with Java 17
- **Microservices**: Node.js with Express
- **Database**: PostgreSQL 15
- **Authentication**: JWT tokens
- **File Storage**: AWS S3
- **Caching**: Redis (optional)

### DevOps & Deployment
- **Containerization**: Docker & Docker Compose
- **Container Orchestration**: Docker Swarm/Kubernetes (future)
- **CI/CD**: GitHub Actions (to be implemented)
- **Monitoring**: Prometheus + Grafana (future)

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   SpringBoot    │    │  Node.js        │
│   (Next.js)     │◄──►│   Main API      │◄──►│  Microservices  │
│   Port: 3000    │    │   Port: 8080    │    │  Port: 3001     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   PostgreSQL    │              │
         │              │   Database      │              │
         │              │   Port: 5432    │              │
         │              └─────────────────┘              │
         │                                               │
         └───────────────────┐                 ┌─────────┘
                             ▼                 ▼
                    ┌─────────────────┐ ┌─────────────────┐
                    │     AWS S3      │ │     Redis       │
                    │  File Storage   │ │   (Optional)    │
                    └─────────────────┘ └─────────────────┘
```

## Database Schema

### Core Tables
- **users**: User accounts and profiles
- **projects**: Project management
- **tasks**: Task tracking within projects
- **time_sessions**: Time tracking for tasks
- **goals**: User goals and objectives
- **file_uploads**: File storage metadata

## API Endpoints

### SpringBoot Main API
- `/api/health` - Health check
- `/api/auth/**` - Authentication endpoints
- `/api/users/**` - User management
- `/api/projects/**` - Project management
- `/api/tasks/**` - Task management

### Node.js Microservices
- `/api/v1/health` - Health check
- `/api/v1/files/**` - File upload/download
- `/api/v1/analytics/**` - Analytics and reporting
- `/api/v1/notifications/**` - Notification services

## Security Features
- JWT-based authentication
- Password hashing with BCrypt
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

## Development Workflow
1. Local development with Docker Compose
2. Feature branches with pull requests
3. Automated testing (unit, integration, e2e)
4. Code quality checks (ESLint, SonarQube)
5. Containerized deployment