# Build Stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run Stage
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

# wget for Docker healthcheck
RUN apk --no-cache add wget

# Create non-root user for security
RUN addgroup --system --gid 1001 spring && \
    adduser --system --uid 1001 --ingroup spring spring

# Copy jar with restricted permissions (read-only for app user)
COPY --from=build /app/target/*.jar app.jar
RUN chown spring:spring app.jar && chmod 444 app.jar

USER spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
