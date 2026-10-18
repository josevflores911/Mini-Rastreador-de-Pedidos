# 🤖 AGENTS.md — Directrices para Agentes de IA en Chegô Monolith

Este documento contiene las reglas, directrices arquitectónicas y restricciones operativas que cualquier **Agente de IA** (como Antigravity, Gemini, Claude o GitHub Copilot) debe seguir al inspeccionar, modificar, depurar o extender este repositorio.

---

## 1. Visión General del Repositorio

- **Tipo**: Monolito Modular Maven (`chego-monolith`)
- **Backend**: Spring Boot 3.3.3 (`security-server`), Java 17, Spring Data JPA, SQLite, Flyway, JJWT 0.12.6.
- **Frontend**: React 18 (`frontend`), Vite, TypeScript, TailwindCSS, React Router DOM 6, Axios.
- **Contenedorización**: `Dockerfile` multi-etapa que compila el frontend en Node 22, empaqueta el backend en Maven 3.9 y genera una imagen liviana con Temurin JRE 17 sobre Jammy.

---

## 2. Reglas de Arquitectura y Monorepo

1. **Mantener la Integridad del Monolito**:
   - El módulo `frontend` debe poder compilarse de forma autónoma con `npm run build` Y a través de `frontend-maven-plugin`.
   - El artefacto generado en `frontend/dist` es consumido por `security-server` y servido como recursos estáticos (`/static` o `META-INF/resources`).
   - Nunca rompas la configuración del `pom.xml` raíz ni la relación padre-hijo de los subdirectorios.

2. **Rutas SPA y Servidor**:
   - Todo nuevo path agregado a las rutas de React en `frontend/src/routes/` debe contemplarse también en `SpaForwardController.java` o en las reglas de seguridad de Spring Security para garantizar que el recargo directo (F5) no devuelva un error 404 del backend.

3. **Comunicación API**:
   - En el frontend, jamás hagas llamadas `fetch` directas ni concatenes la URL base manualmente. Utiliza siempre la instancia `api` de `frontend/src/services/api.ts`, la cual gestiona automáticamente los tokens JWT y el ciclo de vida de la sesión.

---

## 3. Directrices de Backend (Spring Boot / Java 17)

1. **Uso de Java Moderno**:
   - Utiliza características de Java 17 (records, text blocks, pattern matching para `instanceof`, `List.of()`, `Map.of()`).
2. **Controladores y DTOs**:
   - Nunca expongas entidades JPA con referencias circulares directamente en controladores públicos. Utiliza objetos de transferencia de datos (DTOs) ubicados en `com.clon.security.entity.dto`.
   - Documenta los endpoints nuevos utilizando anotaciones de OpenAPI 3 (`@Operation`, `@ApiResponse`, `@Tag`).
3. **Transaccionalidad y Servicios**:
   - Métodos de modificación en `OrderService` o `AuthService` deben estar anotados con `@Transactional`.
   - Valida siempre las transiciones de estado contra el mapa `VALID_TRANSITIONS`.
   - Respeta la regla de inmutabilidad: un pedido en `ENTREGUE` o `CANCELADO` nunca debe poder ser reactivado.
4. **Base de Datos y Migraciones con Flyway**:
   - **NUNCA** modifiques scripts de migración existentes que ya hayan sido ejecutados (`V1__init_schema.sql` o `V2__seed_data.sql`).
   - Para cualquier cambio en la estructura de tablas o datos maestros, crea un nuevo archivo de migración versionado incrementalmente: `V3__<descripcion>.sql` en `security-server/src/main/resources/db/migration/`.
   - Asegúrate de que las sentencias SQL sean estrictamente compatibles con la sintaxis de **SQLite**.
5. **Seguridad**:
   - Toda nueva ruta que maneje datos sensibles o modifique pedidos debe estar explícitamente declarada y protegida en `SecurityConfig.java`.
   - Las contraseñas de usuarios deben crearse exclusivamente mediante `passwordEncoder.encode(rawPassword)`.

---

## 4. Directrices de Frontend (React / TypeScript / Tailwind)

1. **TypeScript Estricto**:
   - No utilices tipos `any` implícitos. Declara interfaces o tipos en `src/types/` o en el propio módulo de servicio.
   - Ejecuta `npm run typecheck` tras realizar cambios para verificar que no existan errores de compilación estática.
2. **Estilizado con Tailwind CSS**:
   - No crees archivos CSS aislados a menos que sea estrictamente indispensable. Usa las clases utilitarias de Tailwind siguiendo el diseño visual establecido (paleta de colores gastronómica: `brand`, `amber`, `emerald`, `stone`).
3. **Manejo de Errores y Feedback al Usuario**:
   - Utiliza el hook `useToast` del contexto de la aplicación para mostrar notificaciones de éxito o error al realizar operaciones asíncronas (creación de pedidos, login, cancelaciones).

---

## 5. Protocolo de Verificación para Agentes

Antes de dar por finalizada cualquier tarea o proponer un commit en este proyecto, ejecuta y valida lo siguiente:

1. **Validación de Compilación Frontend**:
   ```bash
   cd frontend
   npm run build
   ```
2. **Validación de Pruebas Unitarias del Backend**:
   ```bash
   # Desde la raíz del repositorio:
   ./mvnw test -pl security-server -am
   # En Windows:
   .\mvnw.cmd test -pl security-server -am
   ```
3. **Revisión de Archivos Afectados**:
   - Verifica `git status` para asegurar que no se hayan generado archivos temporales, logs o volcados innecesarios de bases de datos.
