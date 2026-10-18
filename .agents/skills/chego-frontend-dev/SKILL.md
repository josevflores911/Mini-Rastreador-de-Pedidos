---
name: chego-frontend-dev
description: >-
  Workflows, procedures and commands for developing, testing, styling, and building the Chegô React SPA
  frontend (React 18 + TypeScript + Vite + TailwindCSS). Use this skill whenever the user asks to modify
  frontend pages, create UI components, manage routes, update Tailwind styles, or troubleshoot client-side logic.
---

# Chegô Frontend Development Skill

This skill guides the agent through developing, styling, and building the `frontend` module.

---

## 1. Module Overview & Location

- **Path**: `frontend/`
- **Entry Points**: `src/main.tsx`, `src/App.tsx`, `index.html`
- **Routing**: `src/routes/` (`authRoutes.tsx`, `orderRoutes.tsx`, `ProtectedRoute.tsx`)
- **API Client**: `src/services/api.ts` (Axios with Bearer token interceptor)
- **Styling**: `tailwind.config.js`, `src/index.css`

---

## 2. Common Development Commands

All commands should be executed from the `frontend/` directory.

### Installing Dependencies
```powershell
cd "frontend"
npm install
```

### Starting the Vite Dev Server
```powershell
cd "frontend"
npm run dev
```
*Runs on `http://localhost:5173`. Automatically points API requests to `http://localhost:8080/` during development.*

### Typechecking TypeScript
```powershell
cd "frontend"
npm run typecheck
```

### Production Build
```powershell
cd "frontend"
npm run build
```
*Compiles the production bundle into `frontend/dist/`.*

---

## 3. Adding New Pages and Routes

1. **Create the Page Component**:
   - Add the component in `src/pages/` (e.g. `NewFeaturePage.tsx`).
2. **Register the Route**:
   - In `src/routes/orderRoutes.tsx` or `src/routes/authRoutes.tsx`, use lazy loading:
     ```tsx
     const NewFeaturePage = lazy(() => import('../pages/NewFeaturePage'));
     ```
   - Add the route inside the appropriate wrapper (e.g. `ProtectedRoute` for authenticated views).
3. **Synchronize Backend SpaForwardController**:
   - If the new route path has a new top-level segment (e.g., `/promocoes`), ensure `security-server/src/main/java/com/clon/security/controller/SpaForwardController.java` includes it in the `@GetMapping` array so direct URL refreshes don't 404.

---

## 4. API Consumption Best Practices

- Always use the pre-configured Axios instance from `src/services/api.ts`.
- Encapsulate service calls inside `src/services/` (e.g. `orderService.ts`, `restaurantService.ts`).
- Handle errors gracefully and notify the user via the `useToast` hook from `src/context/ToastContext`.
