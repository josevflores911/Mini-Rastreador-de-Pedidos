# Chegô Rastreio — Documentação do Projeto (PROJECT.md)

## 1. Visão Geral

O **Chegô Rastreio** é uma aplicação frontend Single Page Application (SPA) desenvolvida em **React 18 + TypeScript + Vite** voltada para **escolha de restaurante, criação de pedidos, acompanhamento e atualização de status**.

### Escopo e Não-Escopo
* **Dentro do Escopo:**
  * Página inicial com duas abas (`/pedidos?aba=restaurantes`): **Meus pedidos** e **Restaurantes**.
  * Cards de restaurantes que levam à tela **Novo pedido** do restaurante escolhido (`/restaurantes/:restaurantId/novo-pedido`).
  * Criação de pedido (cliente, itens, endereço com Places + mapa) via `POST /orders`; ao concluir, o usuário volta à aba de pedidos, onde o novo pedido aparece com o status atual.
  * Listagem de pedidos com filtros por status e busca por texto (cliente/ID), com painel de resumo.
  * Tela de detalhes do pedido com itens, endereço, progresso e mapa de entrega.
  * Ação de transição de status com controle de perfil e confirmação.
  * **Autenticação JWT:** telas de login (`/login`) e cadastro (`/cadastro`), sessão por token, rotas protegidas e logout (ver seção 5.1).
* **Fora do Escopo:**
  * Refresh token e revogação de sessão no servidor (o JWT é stateless; expira pelo `exp`).
  * Endpoint de restaurantes: o catálogo é local (`src/data/restaurants.ts`) até que a API o forneça.

---

## 2. Arquitetura e Fluxo de Integração

O projeto é estruturado como um **Monolito Modular com Maven Multi-módulo**:
* **`pom.xml` (Raiz):** Orquestrador com `packaging=pom`.
* **`frontend/` (`chego-frontend`):** Módulo com React 18 + Vite + TypeScript. Compilado via `frontend-maven-plugin` e empacotado como JAR com recursos em `META-INF/resources`.
* **`security-server/` (`security-server`):** Módulo Spring Boot 3.3.3. Integra os arquivos estáticos compilados em `classes/static`, expõe a API REST, documentação Swagger UI e roteia a SPA pelo mesmo host e porta.

```
Navegador (Usuário) ──HTTP (Porta dinâmica / 8080)──▶ [Monolito Spring Boot]
                                                          │
          ┌───────────────────────────────────────────────┴───────────────────────────────────────────────┐
          ▼                                                                                               ▼
[SPA React (index.html, JS, CSS)]                                                          [Endpoints REST API]
- /                                                                                        - /auth/* (JWT)
- /login, /cadastro                                                                        - /restaurants/* (Catálogo)
- /pedidos, /pedidos/:id (Roteamento React)                                                - /orders/* (Ciclo de Vida)
                                                                                           - /swagger-ui/* (OpenAPI 3)
```

---

## 3. Stack Tecnológica

| Camada | Tecnologia | Detalhes |
|---|---|---|
| **Arquitetura Geral** | Monolito Modular Maven | Multi-módulo: `chego-monolith`, `chego-frontend` e `security-server` |
| **Backend & Runtime** | Java 17 + Spring Boot 3.3.3 | REST API, Spring Security 6 stateless com JWT e Flyway |
| **Frontend UI** | React 18.3 + TypeScript + Vite | SPA com React Router v6, Tailwind CSS e Lucide Icons |
| **Integração de Build** | `frontend-maven-plugin` | Compilação automatizada do React durante o ciclo de build do Maven |
| **Documentação API** | Springdoc OpenAPI 3 + Swagger UI | Especificação e interface interativa em `/swagger-ui/index.html` |
| **Containerização** | Docker Multi-Stage | Imagem leve (`eclipse-temurin:17-jre-jammy`) para Render Free com `$PORT` |

---

## 4. Estrutura de Diretórios Multi-Módulo

```
chego-auth/
├── pom.xml                     # POM Raiz agregador (packaging=pom)
├── mvnw / mvnw.cmd / .mvn/     # Maven Wrapper universal
├── Dockerfile                  # Multi-stage Dockerfile otimizado para Render
├── .dockerignore               # Regras de exclusão para Docker
├── .env.example                # Template de variáveis de ambiente com valores fictícios
├── frontend/                   # Módulo Frontend (chego-frontend)
│   ├── pom.xml                 # Build Maven com frontend-maven-plugin
│   ├── package.json            # Scripts e dependências do Vite/React
│   ├── vite.config.ts          # Configuração do Vite
│   ├── index.html              # Shell HTML da SPA
│   ├── src/                    # Código-fonte React (páginas, componentes, hooks, auth)
│   └── public/                 # Assets estáticos
├── security-server/            # Módulo Backend Spring Boot (security-server)
│   ├── pom.xml                 # Dependência de chego-frontend e Spring Boot plugin
│   └── src/
│       ├── main/java/          # Controllers, Services, Entidades, DTOs e Segurança
│       │   └── .../SpaForwardController.java # Encaminhamento de rotas SPA
│       └── main/resources/     # application.properties, db/migration (Flyway)
└── target/                     # Diretórios de build de cada módulo
```

---

## 5. Contratos de API e Modelo de Dados

### Endpoints Principais
* `GET /orders` — Recupera lista de pedidos (aceita formato lista `[...]` ou paginado Spring `{ "content": [...] }`).
* `GET /orders/:id` — Recupera os detalhes de um pedido específico.
* `POST /orders` — Cria um pedido (`client`, `items`, `deliveryAddress`, `restaurantId`, `restaurantName` e, opcionalmente, `clientEmail`, `latitude`, `longitude`).
* `POST /orders/:id/cancel` — Cancela um pedido com validação de status e propriedade (consumidor ou admin).
* `PATCH /orders/:id/status` — Atualiza o status do pedido enviando `{ "status": "NOVO_STATUS" }` (restrito a ADMIN / sistema de rastreamento parceiro).
* `GET /swagger-ui/index.html` — Interface interativa Swagger UI para testes e documentação dos endpoints.
* `GET /v3/api-docs` — Especificação JSON OpenAPI v3.0 da API.

### 5.1 Autenticação JWT
Base: `VITE_AUTH_API_URL` (padrão `http://localhost:8080/auth`).
* `POST /login` — `{ "username": "<e-mail>", "password": "..." }` → `{ "token": "<jwt>", "username"?, "role"? }`.
* `POST /register` — `{ "username", "email", "password" }` → `201 Created` com `UserResponse` sanitizado (sem hash de senha).
* `GET /verify` — Retorna dados do usuário autenticado a partir do token ativo.
* Demais rotas exigem `Authorization: Bearer <jwt>` e respondem `401` sem token válido.

Regras do frontend:
1. O token é guardado só em `authAdapter.ts` (`VITE_AUTH_TOKEN_STORAGE_KEY`, storage `local` ou `session`); senhas nunca são armazenadas.
2. A sessão é válida enquanto o JWT for legível e não expirado (`exp`); `AuthContext` encerra a sessão no instante do `exp`.
3. `ProtectedRoute` redireciona ao login guardando a página pedida; `PublicOnlyRoute` evita mostrar login a quem já entrou.
4. `401` em `api.ts` encerra a sessão local. O login usa um cliente Axios separado (`authService.ts`) para que credenciais erradas não disparem esse fluxo.
5. Erros de login são genéricos (sem enumeração de usuários); nunca registrar senha ou token no console.
6. O perfil (`role`) alimenta `canUpdateOrderStatus()` (`VITE_STATUS_UPDATE_ROLES`).

### Estados do Pedido (`OrderStatus`)
1. `RECEBIDO` — Pedido confirmado pelo sistema e aguardando preparo.
2. `EM_PREPARO` — Pedido sendo separado ou produzido.
3. `SAIU_PARA_ENTREGA` — Pedido em trânsito com entregador.
4. `ENTREGUE` — Entrega finalizada com sucesso.
5. `CANCELADO` — Pedido cancelado.

### Camada Anti-Corrupção (`orderMapper.ts`)
Para garantir tolerância a variações de contratos e DTOs de diferentes backends, todas as respostas passam por `mapOrderDtoToOrder()` (e `toCreatePayload()` para o envio). O mapper aceita automaticamente sinônimos como `cliente` / `customerName` / `client`, e normaliza status legados.

---

## 6. Oportunidades de Melhoria Arquitetural

1. **Camada de Caching e Polling (TanStack Query / SWR):**
   * *Diagnóstico:* Atualmente as requisições utilizam `useEffect` simples em hooks próprios.
   * *Oportunidade:* Integrar TanStack Query para fornecer cache em memória, refetching em foco de aba e retry inteligente de requisições de status.
2. **Atualizações em Tempo Real (WebSockets / SSE):**
   * *Diagnóstico:* Mudanças de status exigem recarregar a tela ou navegar entre páginas.
   * *Oportunidade:* Suporte a Server-Sent Events (SSE) ou WebSockets para refletir atualizações de entrega instantaneamente no painel.
3. **Automação de Testes (Vitest + Testing Library):**
   * *Diagnóstico:* O projeto possui TypeScript rigoroso, mas ainda não inclui suíte de testes unitários ou de integração.
   * *Oportunidade:* Configurar Vitest + `@testing-library/react` para validar fluxos críticos (`orderMapper`, `StatusActions`, `useGoogleMaps`).
4. **Padronização de Linter e Formatador (ESLint + Prettier):**
   * *Diagnóstico:* O projeto não conta com `.eslintrc` configurado na raiz.
   * *Oportunidade:* Adicionar configuração com regras para React Hooks e padrões de acessibilidade (a11y).
