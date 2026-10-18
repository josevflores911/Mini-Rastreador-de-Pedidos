---
name: chego-backend-dev
description: >-
  Workflows, procedures and commands for developing, testing, migrating and maintaining the Chegô
  Spring Boot 3 backend (security-server), including SQLite database operations and Flyway migrations.
  Use this skill whenever the user asks to modify the backend, run Java tests, add REST endpoints,
  update database schemas, or troubleshoot Spring Boot issues.
---

# Chegô Backend Development Skill

This skill guides the agent through common development, testing, and maintenance workflows for the `security-server` Spring Boot 3 module.

---

## 1. Module Overview & Location

- **Path**: `security-server/`
- **Main Class**: `com.clon.security.SecurityApplication`
- **Configuration**: `security-server/src/main/resources/application.properties`
- **Database Migrations**: `security-server/src/main/resources/db/migration/`
- **Build Tool**: Maven Wrapper (`mvnw` / `mvnw.cmd`)

---

## 2. Common Development Commands

> **Important**: Because `security-server` depends on the `chego-frontend` module, always run Maven commands from the **root directory** with the `-pl security-server -am` (also-make) flag, or install `chego-frontend` first.

### Running Backend Tests
```powershell
# From root directory
.\mvnw.cmd test -pl security-server -am
```

### Running a Specific Test Class
```powershell
# From root directory
.\mvnw.cmd test -pl security-server -am -Dtest=OrderCancellationAndTrackingTests
```

### Running the Backend Locally
```powershell
# Option 1: From root
.\mvnw.cmd spring-boot:run -pl security-server

# Option 2: After installing frontend (mvn install -pl frontend), from security-server/
cd security-server
.\mvnw.cmd spring-boot:run
```

### Packaging the Full Monolithic Fat JAR
```powershell
# From root directory
.\mvnw.cmd clean package -pl security-server -am -DskipTests
```

---

## 3. Database & Flyway Migration Procedures

The application uses **SQLite** (`chego.db`) with Hibernate Community Dialect and **Flyway** for migrations.

### Rules for Schema Changes:
1. **Never edit existing migration files**: `V1__init_schema.sql` and `V2__seed_data.sql` must remain unchanged.
2. **Naming convention**: Create a new file in `security-server/src/main/resources/db/migration/`:
   `V<NextNumber>__<short_description>.sql` (e.g. `V3__add_payment_methods.sql`).
3. **SQLite Syntax Constraints**:
   - SQLite does not support standard `ALTER TABLE ... DROP COLUMN` in older engines.
   - Use `VARCHAR`, `INTEGER`, `REAL`, `BOOLEAN`, `TEXT`.
   - SQLite handles dates as text (ISO 8601 strings, e.g. `datetime('now')`).

---

## 4. Adding a New REST Endpoint

Follow the established layered architecture:
1. **Entity**: Place JPA entity in `com.clon.security.entity`.
2. **DTOs**: Place request and response DTOs in `com.clon.security.entity.dto`. Use Lombok (`@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`).
3. **Repository**: Extend `JpaRepository<Entity, IdType>` in `com.clon.security.repositories`.
4. **Service**: Implement business logic in `com.clon.security.service`. Annotate mutating methods with `@Transactional`.
5. **Controller**: Place REST controller in `com.clon.security.controller`. Annotate with:
   - `@RestController`
   - `@RequestMapping("/your-path")`
   - `@Tag(name = "...", description = "...")`
   - `@Operation` and `@ApiResponses` for OpenAPI documentation.
6. **Security Configuration**: If the endpoint needs authentication or role protection, declare it in `com.clon.security.config.SecurityConfig`.
