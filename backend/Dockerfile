# Build stage
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

# Cache maven dependencies first
COPY pom.xml .
RUN mvn -B dependency:go-offline -DskipTests || true

# Copy source code and build production jar
COPY src ./src
RUN mvn -B clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy executable jar from builder stage
COPY --from=builder /build/target/*.jar app.jar

# Active profile: production
ENV SPRING_PROFILES_ACTIVE=prod

# Low-memory JVM optimization for Render 512 MB container (automatically picked up by JVM)
ENV JAVA_TOOL_OPTIONS="-XX:+UseSerialGC -Xmx320m -XX:MaxMetaspaceSize=128m"

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
