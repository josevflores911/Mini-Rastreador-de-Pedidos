# ==============================================================================
# ESTÁGIO 1: Build do Frontend React (Node.js 20)
# ==============================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==============================================================================
# ESTÁGIO 2: Build do Backend e Empacotamento do JAR Único (Maven + Temurin 17)
# ==============================================================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS backend-builder
WORKDIR /app

COPY pom.xml ./
COPY security-server/pom.xml ./security-server/
COPY frontend/pom.xml ./frontend/

# Copia os arquivos compilados do frontend para os recursos estáticos do Spring Boot
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./security-server/src/main/resources/static

COPY security-server/src ./security-server/src

# Empacota o JAR executável único ignorando testes para build rápido em container
RUN mvn clean package -pl security-server -am -DskipTests

# ==============================================================================
# ESTÁGIO 3: Imagem Final de Execução (Minimal JRE 17) Otimizada para Render Free
# ==============================================================================
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Criação de usuário e grupo não-root por boas práticas de segurança
RUN groupadd -r chego && useradd -r -g chego chego
RUN chown -R chego:chego /app

# Copia o JAR único executável
COPY --from=backend-builder --chown=chego:chego /app/security-server/target/security-server-*.jar app.jar

# Render injeta a porta dinamicamente na variável de ambiente $PORT
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

USER chego

ENTRYPOINT ["sh", "-c", "java -Djava.security.egd=file:/dev/./urandom -Dserver.port=${PORT} -jar app.jar"]
