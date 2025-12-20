# SpringBoot Backend

A RESTful API backend built with Spring Boot for the PlayLocal data visualization platform.

## Overview

This Spring Boot application provides REST APIs for managing project data. It supports filtering by city and status, and includes full CRUD operations for projects.

## Features

- **RESTful API** with Spring Boot
- **JPA/Hibernate** for database operations
- **H2 Database** for development (in-memory)
- **PostgreSQL** support for production
- **CORS** configuration for React frontend
- **Lombok** for reducing boilerplate code
- **Health Check** endpoint

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- (Optional) PostgreSQL for production

## Project Structure

```
springboot-backend/
├── src/
│   ├── main/
│   │   ├── java/com/playlocal/backend/
│   │   │   ├── PlayLocalBackendApplication.java  # Main application class
│   │   │   ├── controller/                        # REST controllers
│   │   │   │   ├── ProjectController.java         # Project API endpoints
│   │   │   │   └── HealthController.java          # Health check endpoint
│   │   │   ├── service/                           # Business logic
│   │   │   │   └── ProjectService.java
│   │   │   ├── model/                             # Entity models
│   │   │   │   └── Project.java
│   │   │   ├── repository/                        # Data access layer
│   │   │   │   └── ProjectRepository.java
│   │   │   └── config/                            # Configuration classes
│   │   │       └── WebConfig.java                 # CORS configuration
│   │   └── resources/
│   │       ├── application.properties             # Development config
│   │       └── application-prod.properties        # Production config
│   └── test/
│       └── java/com/playlocal/backend/            # Test files
├── pom.xml                                         # Maven dependencies
└── README.md
```

## Getting Started

### 1. Build the Project

```bash
mvn clean install
```

### 2. Run the Application (Development Mode)

```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

### 3. Access the API

#### Health Check
```bash
curl http://localhost:8080/api/health
```

#### Get All Projects
```bash
curl http://localhost:8080/api/projects
```

#### Get Project by ID
```bash
curl http://localhost:8080/api/projects/1
```

#### Create a Project
```bash
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Construction Project",
    "description": "A new building project",
    "address": "123 Main St",
    "city": "Montreal",
    "status": "Active",
    "projectType": "Residential",
    "latitude": 45.5017,
    "longitude": -73.5673
  }'
```

### 4. H2 Console (Development Only)

Access the H2 database console at: `http://localhost:8080/h2-console`

- JDBC URL: `jdbc:h2:mem:playlocal`
- Username: `sa`
- Password: (leave empty)

## API Endpoints

### Health Check
- `GET /api/health` - Check if the service is running

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects?city={city}` - Filter projects by city
- `GET /api/projects?status={status}` - Filter projects by status
- `GET /api/projects/{id}` - Get a specific project
- `POST /api/projects` - Create a new project
- `PUT /api/projects/{id}` - Update a project
- `DELETE /api/projects/{id}` - Delete a project

## Configuration

### Development
The application uses H2 in-memory database by default. Configuration is in `application.properties`.

### Production
For production deployment, use the `prod` profile:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

Set the following environment variables:
- `DATABASE_URL` - PostgreSQL connection URL
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `PORT` - Server port (default: 8080)

## CORS Configuration

The application is configured to allow requests from:
- `http://localhost:3000` (Next.js development)
- `http://localhost:3001` (Alternative port)

To add more origins, edit `src/main/java/com/playlocal/backend/config/WebConfig.java`

## Testing

Run the test suite:

```bash
mvn test
```

Run tests with coverage:

```bash
mvn test jacoco:report
```

## Building for Production

Create a production-ready JAR file:

```bash
mvn clean package -DskipTests
```

The JAR file will be created in the `target/` directory.

Run the JAR:

```bash
java -jar target/playlocal-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

## Docker Support

A Dockerfile will be added in future updates for containerized deployment.

## Integration with React Frontend

This backend is designed to work with the Next.js React frontend located in the `frontend/` directory.

The frontend should configure its API base URL to point to:
- Development: `http://localhost:8080/api`
- Production: Your deployed backend URL

## Technologies Used

- **Spring Boot 3.2.1** - Framework
- **Spring Data JPA** - Data persistence
- **H2 Database** - In-memory database for development
- **PostgreSQL** - Production database
- **Lombok** - Reduce boilerplate code
- **Maven** - Build tool
- **JUnit 5** - Testing framework

## Future Enhancements

- JWT authentication
- API documentation with Swagger/OpenAPI
- Rate limiting
- Caching with Redis
- Docker containerization
- CI/CD pipeline integration

## Contributing

Follow the project's coding standards and ensure all tests pass before submitting changes.

## License

See the main project LICENSE file.
