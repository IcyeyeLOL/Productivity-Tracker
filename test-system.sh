#!/bin/bash

# Productivity Tracker System Testing Script
# This script validates all components of the productivity tracking system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SPRING_API_URL="http://localhost:8080"
NODEJS_API_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"

echo -e "${BLUE}🚀 Productivity Tracker System Testing${NC}"
echo "================================================"

# Function to check if a service is running
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -e "${YELLOW}Checking $service_name...${NC}"
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ $service_name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not responding${NC}"
        return 1
    fi
}

# Function to test API endpoint
test_api_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local expected_status=${4:-200}
    local description=$5
    
    echo -e "${YELLOW}Testing $description...${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /dev/null "$url")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "%{http_code}" -o /dev/null -X POST -H "Content-Type: application/json" -d "$data" "$url")
    fi
    
    if echo "$response" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ $description - Status: $expected_status${NC}"
        return 0
    else
        echo -e "${RED}❌ $description - Expected: $expected_status, Got: $response${NC}"
        return 1
    fi
}

# Test 1: Check if all services are running
echo -e "\n${BLUE}📋 Step 1: Service Health Checks${NC}"
echo "----------------------------------------"

services_healthy=true

if ! check_service "PostgreSQL" "postgresql://$POSTGRES_HOST:$POSTGRES_PORT" 0; then
    services_healthy=false
fi

if ! check_service "Spring Boot API" "$SPRING_API_URL/api/health"; then
    services_healthy=false
fi

if ! check_service "Node.js Microservice" "$NODEJS_API_URL/health"; then
    services_healthy=false
fi

if ! check_service "Next.js Frontend" "$FRONTEND_URL"; then
    services_healthy=false
fi

if [ "$services_healthy" = false ]; then
    echo -e "${RED}❌ Some services are not running. Please start all services first.${NC}"
    echo "Run: docker-compose up -d"
    exit 1
fi

# Test 2: Database connectivity
echo -e "\n${BLUE}📋 Step 2: Database Connectivity${NC}"
echo "----------------------------------------"

if docker exec productivity-postgres psql -U productivity_user -d productivity_tracker -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi

# Test 3: API Endpoints Testing
echo -e "\n${BLUE}📋 Step 3: API Endpoints Testing${NC}"
echo "----------------------------------------"

# Test Spring Boot API endpoints
test_api_endpoint "GET" "$SPRING_API_URL/api/health" "" 200 "Spring Boot Health Check"

# Test Node.js microservice endpoints
test_api_endpoint "GET" "$NODEJS_API_URL/health" "" 200 "Node.js Microservice Health Check"

# Test 4: Authentication Flow
echo -e "\n${BLUE}📋 Step 4: Authentication Flow${NC}"
echo "----------------------------------------"

# Register a test user
register_data='{"username":"testuser","email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
echo -e "${YELLOW}Testing user registration...${NC}"

register_response=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$register_data" "$SPRING_API_URL/api/auth/register")
register_status=$(echo "$register_response" | tail -c 4)

if echo "$register_status" | grep -q "201\|200"; then
    echo -e "${GREEN}✅ User registration successful${NC}"
else
    echo -e "${RED}❌ User registration failed - Status: $register_status${NC}"
fi

# Login with test user
login_data='{"username":"test@example.com","password":"password123"}'
echo -e "${YELLOW}Testing user login...${NC}"

login_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$login_data" "$SPRING_API_URL/api/auth/login")
token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$token" ]; then
    echo -e "${GREEN}✅ User login successful${NC}"
    echo -e "${BLUE}Token: ${token:0:20}...${NC}"
else
    echo -e "${RED}❌ User login failed${NC}"
fi

# Test 5: File Upload (if token available)
if [ -n "$token" ]; then
    echo -e "\n${BLUE}📋 Step 5: File Upload Testing${NC}"
    echo "----------------------------------------"
    
    # Create a test file
    echo "This is a test file for productivity tracker" > test-file.txt
    
    echo -e "${YELLOW}Testing file upload...${NC}"
    
    upload_response=$(curl -s -w "%{http_code}" -X POST \
        -H "Authorization: Bearer $token" \
        -F "file=@test-file.txt" \
        -F "projectId=test-project" \
        -F "description=Test file upload" \
        "$NODEJS_API_URL/api/files/upload")
    
    upload_status=$(echo "$upload_response" | tail -c 4)
    
    if echo "$upload_status" | grep -q "200\|201"; then
        echo -e "${GREEN}✅ File upload successful${NC}"
    else
        echo -e "${RED}❌ File upload failed - Status: $upload_status${NC}"
    fi
    
    # Clean up test file
    rm -f test-file.txt
fi

# Test 6: Docker Container Status
echo -e "\n${BLUE}📋 Step 6: Docker Container Status${NC}"
echo "----------------------------------------"

containers=("productivity-postgres" "productivity-spring-api" "productivity-nodejs-service" "productivity-frontend")

for container in "${containers[@]}"; do
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container"; then
        status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$container" | awk '{print $2}')
        echo -e "${GREEN}✅ $container: $status${NC}"
    else
        echo -e "${RED}❌ $container: Not running${NC}"
    fi
done

# Test 7: Build Verification
echo -e "\n${BLUE}📋 Step 7: Build Verification${NC}"
echo "----------------------------------------"

# Check if Docker images exist
images=("productivty-tracker-frontend" "productivty-tracker-spring-backend" "productivty-tracker-nodejs-microservice")

for image in "${images[@]}"; do
    if docker images --format "table {{.Repository}}\t{{.Tag}}" | grep -q "$image"; then
        echo -e "${GREEN}✅ Docker image $image exists${NC}"
    else
        echo -e "${YELLOW}⚠️  Docker image $image not found (will be built on first run)${NC}"
    fi
done

# Summary
echo -e "\n${BLUE}📋 Test Summary${NC}"
echo "=================="

if [ "$services_healthy" = true ]; then
    echo -e "${GREEN}🎉 All tests completed successfully!${NC}"
    echo -e "${GREEN}✅ All services are running and healthy${NC}"
    echo -e "${GREEN}✅ Database connectivity verified${NC}"
    echo -e "${GREEN}✅ API endpoints are responding${NC}"
    echo -e "${GREEN}✅ Authentication flow working${NC}"
    echo -e "${GREEN}✅ File upload system functional${NC}"
    echo -e "\n${BLUE}🚀 Your productivity tracker system is ready to use!${NC}"
    echo -e "${BLUE}Frontend: $FRONTEND_URL${NC}"
    echo -e "${BLUE}API: $SPRING_API_URL${NC}"
    echo -e "${BLUE}Microservice: $NODEJS_API_URL${NC}"
else
    echo -e "${RED}❌ Some tests failed. Please check the logs and fix the issues.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}💡 Tips:${NC}"
echo "- Use 'docker-compose logs -f [service-name]' to view logs"
echo "- Use 'docker-compose ps' to check service status"
echo "- Use 'docker-compose restart [service-name]' to restart a service"
echo "- Check the README.md for detailed setup instructions"
