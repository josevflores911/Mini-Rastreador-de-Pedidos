---
name: chego-docker-deploy
description: >-
  Workflows, procedures and commands for building, containerizing, testing and deploying the Chegô
  monolith using the multi-stage Dockerfile and cloud PaaS environments (Render, Railway, Fly.io, AWS).
  Use this skill whenever the user asks to build the Docker image, run the container, troubleshoot container
  builds, or prepare deployment configurations.
---

# Chegô Docker & Deployment Skill

This skill guides the agent through building, running, and deploying the unified Chegô Docker container.

---

## 1. Dockerfile Architecture

The root `Dockerfile` uses a 3-stage multi-stage build:
1. **Stage 1 (`frontend-builder`)**:
   - Base image: `node:22-alpine`
   - Installs frontend dependencies with `npm ci` and runs `npm run build` to generate `dist/`.
2. **Stage 2 (`backend-builder`)**:
   - Base image: `maven:3.9.6-eclipse-temurin-17-alpine`
   - Copies frontend build into `security-server/src/main/resources/static/`.
   - Compiles and packages Spring Boot JAR using `mvn clean package -pl security-server -am -DskipTests`.
3. **Stage 3 (`runtime`)**:
   - Base image: `eclipse-temurin:17-jre-jammy`
   - Creates a dedicated non-root user `chego`.
   - Exposes port `8080` (or dynamic `$PORT`).
   - Runs `java -jar /app/app.jar`.

---

## 2. Docker Operations

### Building the Image
From the repository root:
```bash
docker build -t chego-app:latest .
```

### Running the Container Locally
```bash
docker run --rm -p 8080:8080 -e PORT=8080 chego-app:latest
```

### Verifying Container Health
```bash
curl -I http://localhost:8080
# Check Swagger UI:
curl -I http://localhost:8080/swagger-ui.html
```

---

## 3. Cloud Deployment Considerations

- **Dynamic PORT**: Services like Render inject a `$PORT` environment variable (e.g. `PORT=10000`). The Dockerfile ENTRYPOINT uses `exec java ... -Dserver.port=${PORT} -jar /app/app.jar`, ensuring seamless port binding.
- **Persistent Storage for SQLite**: If running in a stateful environment with SQLite, mount a persistent volume to `/app/` or specify `SPRING_DATASOURCE_URL=jdbc:sqlite:/data/chego.db` with a volume mounted at `/data`.
- **JWT Secret**: Ensure `JWT_SECRET` is set in production to a secure random string (minimum 256 bits).
