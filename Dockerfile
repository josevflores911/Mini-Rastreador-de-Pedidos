# ==============================================================================
# STAGE 1: Build del Frontend React + Vite
# ==============================================================================
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Copiar manifiestos de dependencias
COPY frontend/package.json frontend/package-lock.json ./

# Instalar dependencias respetando el lockfile
RUN npm ci

# Copiar código fuente y compilar React
COPY frontend/ ./

RUN npm run build


# ==============================================================================
# STAGE 2: Build del Backend y empaquetado del JAR
# ==============================================================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS backend-builder

WORKDIR /app

# Archivos Maven del proyecto raíz y módulos
COPY pom.xml ./
COPY security-server/pom.xml ./security-server/
COPY frontend/ ./frontend/

# Copiar el código fuente del backend
COPY security-server/src ./security-server/src

# Integrar los archivos estáticos del frontend en Spring Boot
COPY --from=frontend-builder /app/frontend/dist/ \
    ./security-server/src/main/resources/static/

# Compilar el proyecto y sus módulos requeridos
RUN mvn clean package -pl security-server -am -DskipTests


# ==============================================================================
# STAGE 3: Imagen final de ejecución
# ==============================================================================
FROM eclipse-temurin:17-jre-jammy AS runtime

WORKDIR /app

# Crear usuario no privilegiado
RUN groupadd --system chego \
    && useradd --system --gid chego --no-create-home chego

# Copiar el JAR generado
COPY --from=backend-builder \
    --chown=chego:chego \
    /app/security-server/target/security-server-*.jar \
    /app/app.jar

# Puerto configurable por el entorno (por ejemplo, Render)
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

USER chego

ENTRYPOINT ["sh", "-c", "exec java -Djava.security.egd=file:/dev/./urandom -Dserver.port=${PORT} -jar /app/app.jar"]