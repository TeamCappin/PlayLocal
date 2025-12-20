# Web Portal - Quick Start Guide

This directory contains the full-stack web application for PlayLocal, featuring both SpringBoot and React implementations.

## Architecture

### Backend Options
1. **SpringBoot Backend** (Java) - `/springboot-backend/`
   - Modern Java-based REST API
   - Spring Boot 3.2.1 with Spring Data JPA
   - H2 in-memory database for development
   - PostgreSQL support for production

2. **Django Backend** (Python) - `/backend/`
   - Django REST Framework
   - Alternative backend implementation

### Frontend
- **Next.js/React Frontend** - `/frontend/`
  - Modern React 19 with Next.js 15
  - TypeScript support
  - TailwindCSS for styling
  - Internationalization (i18n) support

## Quick Start with Docker Compose

The easiest way to run the full stack is using Docker Compose:

```bash
cd "Web Portal"
docker-compose up --build
```

This will start:
- SpringBoot backend on http://localhost:8080
- React frontend on http://localhost:3000

## Manual Setup

### 1. SpringBoot Backend

```bash
cd "Web Portal/springboot-backend"

# Build with Maven
mvn clean package

# Run the application
java -jar target/playlocal-backend-0.0.1-SNAPSHOT.jar

# Or use Maven directly
mvn spring-boot:run
```

Backend will be available at http://localhost:8080

**API Endpoints:**
- Health Check: `GET /api/health`
- List Projects: `GET /api/projects`
- Get Project: `GET /api/projects/{id}`
- Create Project: `POST /api/projects`
- Update Project: `PUT /api/projects/{id}`
- Delete Project: `DELETE /api/projects/{id}`

### 2. React Frontend

```bash
cd "Web Portal/frontend"

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env to point to your backend:
# NEXT_PUBLIC_API_URL=http://localhost:8080/api/

# Run development server
npm run dev
```

Frontend will be available at http://localhost:3000

## Configuration

### Backend Configuration

The SpringBoot backend can be configured via:
- Environment variables (see `.env.example`)
- Application properties files:
  - `application.properties` (development)
  - `application-prod.properties` (production)

Key configurations:
- `server.port` - Server port (default: 8080)
- `spring.datasource.url` - Database URL
- Database credentials and other settings

### Frontend Configuration

Configure the frontend via `.env` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/
```

## Testing

### Backend Tests
```bash
cd "Web Portal/springboot-backend"
mvn test
```

### Frontend Tests
```bash
cd "Web Portal/frontend"
npm test
```

## Development

### SpringBoot Backend Development
- Uses H2 in-memory database by default
- Hot reload enabled with spring-boot-devtools
- H2 Console available at: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:playlocal`
  - Username: `sa`
  - Password: (empty)

### React Frontend Development
- Hot module replacement (HMR) enabled
- Auto-refresh on file changes
- TypeScript type checking

## Production Deployment

### SpringBoot Backend
```bash
cd "Web Portal/springboot-backend"
mvn clean package -DskipTests
java -jar target/playlocal-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

### React Frontend
```bash
cd "Web Portal/frontend"
npm run build
npm start
```

## Technology Stack

### Backend (SpringBoot)
- **Framework:** Spring Boot 3.2.1
- **Language:** Java 17
- **Build Tool:** Maven
- **Database:** H2 (dev) / PostgreSQL (prod)
- **ORM:** Spring Data JPA / Hibernate

### Frontend (React)
- **Framework:** Next.js 15
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** TailwindCSS 4
- **HTTP Client:** Axios
- **Internationalization:** i18next

## Directory Structure

```
Web Portal/
├── springboot-backend/     # Spring Boot REST API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/       # Java source code
│   │   │   └── resources/  # Configuration files
│   │   └── test/           # Test files
│   ├── pom.xml             # Maven configuration
│   ├── Dockerfile          # Docker image definition
│   └── README.md           # Detailed backend docs
│
├── frontend/               # Next.js React application
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   ├── services/           # API services
│   ├── package.json        # NPM dependencies
│   ├── Dockerfile          # Docker image definition
│   └── README.md           # Detailed frontend docs
│
├── backend/                # Django REST alternative
│   └── ...                 # Django application files
│
├── docker-compose.yml      # Multi-container setup
└── README.md               # This file
```

## Troubleshooting

### Port Already in Use
If port 8080 or 3000 is already in use:

**Backend:**
```bash
# Change port in application.properties
server.port=8081
```

**Frontend:**
```bash
# Run on different port
PORT=3001 npm run dev
```

### Database Connection Issues
Ensure database credentials are correct in `.env` or `application.properties`

### CORS Issues
CORS is configured in `WebConfig.java` to allow:
- http://localhost:3000
- http://localhost:3001

Add additional origins as needed.

## Additional Resources

- [SpringBoot Backend Documentation](./springboot-backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [Django Backend Documentation](./backend/README.md)

## Contributing

Follow the project's coding standards and ensure all tests pass before submitting changes.

## License

See the main project LICENSE file.
