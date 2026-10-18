# Chegô — Frontend de Pedidos e Rastreio

Frontend em **React + Vite + TypeScript** para escolher um restaurante, **criar pedidos** e **acompanhar o status** das entregas. Integra com um backend **Java + Spring Boot**.

> O acesso é protegido por **login com JWT** (telas `/login` e `/cadastro`). Veja [Autenticação (JWT)](#autenticação-jwt).

## Fluxo de uso

0. Sem sessão, qualquer rota leva ao **login** (`/login`); depois de entrar, o usuário volta à página que tentou abrir.
1. A página inicial (`/pedidos`) tem duas abas: **Meus pedidos** (status das entregas) e **Restaurantes**.
2. Na aba **Restaurantes**, ao tocar em um card o usuário vai para **Novo pedido** daquele restaurante (`/restaurantes/:id/novo-pedido`).
3. Ao confirmar, o pedido é enviado ao backend (`POST /orders`) e o usuário volta para **Meus pedidos**, onde o novo pedido aparece com o status atual (`RECEBIDO`).
4. Em **Ver detalhes** (`/pedidos/:id`): itens, endereço, linha de progresso e mapa do local de entrega.

A aba ativa fica na URL (`/pedidos?aba=restaurantes`), então o botão "voltar" do navegador e os links diretos funcionam.

## Instalação e execução

```bash
npm install
cp .env.example .env.local   # edite os valores
npm run server               # API mock local (porta 8080), com /auth e dados
npm run dev
```

Com o servidor mock, crie sua conta em **Criar conta** (`/cadastro`) e depois entre em `/login`. Não há usuário padrão.

Acesse http://localhost:5173.

```bash
npm run typecheck   # checagem de tipos
npm run build       # typecheck + build em dist/
npm run preview     # serve o build localmente
```

Publique `dist/` em um servidor estático com *fallback* para `index.html` (SPA).

## Variáveis de ambiente

Veja `.env.example`. Nunca versione chaves reais (`.env.local` está no `.gitignore`).

| Variável | Descrição |
|---|---|
| `VITE_API_BASE_URL` | URL base da API (ex.: `http://localhost:8080/api`) |
| `VITE_AUTH_API_URL` | URL base da API de autenticação (ex.: `http://localhost:8080/auth`) |
| `VITE_AUTH_TOKEN_STORAGE_KEY` / `VITE_AUTH_TOKEN_STORAGE` | Chave e storage (`local` ou `session`) onde o JWT é guardado |
| `VITE_LOGIN_PATH` | Rota da tela de login (padrão `/login`) |
| `VITE_STATUS_UPDATE_ROLES` | Perfis que veem os botões de atualizar status (vazio = todos; o backend responde 403 se não permitir) |
| `VITE_GOOGLE_MAPS_API_KEY` | Chave do Google Maps |
| `VITE_GOOGLE_MAPS_MAP_ID` | (Opcional) Map ID; sem ele usa `DEMO_MAP_ID` |
| `VITE_SEND_COORDINATES` | `true` envia `latitude`/`longitude` no `POST /orders`; use `false` se o DTO for estrito |
| `VITE_USE_MOCKS` | `true` usa dados fictícios **apenas em `npm run dev`** |

## Restaurantes

Não existe endpoint de restaurantes na API; o catálogo fica isolado em **`src/data/restaurants.ts`** (tipo em `src/types/restaurant.ts`). Para adicionar ou remover restaurantes, edite essa lista. Quando houver um endpoint (ex.: `GET /restaurants`), substitua a lista por uma chamada em `src/services/`, mantendo o tipo `Restaurant`.

## Contrato da API e Documentação Interativa

A documentação interativa completa OpenAPI v3 / Swagger UI pode ser acessada em:
* **Swagger UI:** `http://localhost:8080/swagger-ui/index.html`
* **OpenAPI Docs:** `http://localhost:8080/v3/api-docs`

| Método | Rota | Autenticação | Uso |
|---|---|---|---|
| POST | `/auth/login` | Pública | Login com `{ username, password }` gerando JWT |
| POST | `/auth/register` | Pública | Cadastro com `{ username, email, password }` |
| GET | `/auth/verify` | Bearer JWT | Verificação de token e sessão |
| GET | `/restaurants` | Bearer JWT | Listagem de restaurantes disponíveis |
| GET | `/restaurants/{id}/menu` | Bearer JWT | Cardápio oficial categorizado |
| GET | `/orders` | Bearer JWT | Lista de pedidos do usuário |
| GET | `/orders/{id}` | Bearer JWT | Detalhes do pedido e histórico de status |
| POST | `/orders` | Bearer JWT | Criação de novo pedido |
| POST | `/orders/{id}/cancel` | Bearer JWT | Cancelamento de pedido com validação |
| PATCH | `/orders/{id}/status` | Role ADMIN | Transição de status (Admin / Sistema de entrega) |

Status válidos: `RECEBIDO`, `CONFIRMADO`, `EM_PREPARO`, `PRONTO_PARA_RETIRADA`, `SAIU_PARA_ENTREGA`, `ENTREGUE`, `CANCELADO`.

### Criação (`POST /orders`)

```json
{
  "client": "João Silva",
  "clientEmail": "joao@example.com",
  "items": [
    { "name": "Hambúrguer", "quantity": 2, "unitPrice": 28.9 },
    { "name": "Refrigerante", "quantity": 1 }
  ],
  "deliveryAddress": "Av. Paulista, 1578 - Bela Vista, São Paulo - SP",
  "restaurantId": "burger-brasa",
  "restaurantName": "Burger Brasa",
  "latitude": -23.5613,
  "longitude": -46.6559
}
```

`clientEmail`, `unitPrice`, `latitude` e `longitude` só são enviados quando preenchidos. `restaurantId` e `restaurantName` identificam o restaurante escolhido; se o DTO do backend não os aceitar, remova-os em `toCreatePayload()` (`src/services/orderMapper.ts`).

### Resposta de um pedido

```json
{
  "id": "1001",
  "client": "João Silva",
  "items": [{ "name": "Hambúrguer", "quantity": 2, "unitPrice": 28.9 }],
  "deliveryAddress": "Av. Paulista, 1578 ...",
  "restaurantName": "Burger Brasa",
  "latitude": -23.5613,
  "longitude": -46.6559,
  "status": "EM_PREPARO",
  "total": 57.8,
  "createdAt": "2025-01-10T14:32:00Z"
}
```

Opcionais: `clientEmail`, `unitPrice`, `restaurantId`, `restaurantName`, `latitude`, `longitude`, `total`, `createdAt`. Sem `total`, ele é calculado pelos preços dos itens (se existirem). Sem coordenadas, o mapa tenta localizar o endereço em texto (apenas visual).

### Se os seus DTOs forem diferentes

Todo o mapeamento está em **`src/services/orderMapper.ts`** (aceita nomes alternativos como `customerName`, `cliente`, `dataCriacao`). Ajuste só esse arquivo.

### CORS (Spring Boot)

Libere a origem do frontend (ex.: `http://localhost:5173`), os métodos `POST` e `PATCH` e o header `Authorization`. Não são usados cookies: não é preciso `allowCredentials`.

### Comportamento

- **401** → a sessão local é encerrada e o usuário vai para `VITE_LOGIN_PATH` com o aviso "Sua sessão expirou". **403** → "Você não tem permissão para realizar esta ação."
- O status só muda na tela **depois que o backend confirma** o `PATCH`. Sem avanço automático e sem GPS simulado.
- Se o `POST` falhar, nada é "salvo" localmente: o formulário é mantido e o erro é exibido. O botão de confirmar é bloqueado durante o envio.
- O mapa mostra apenas o **local de entrega**; a posição do entregador não é exibida porque o backend não a fornece.

## Configurar o Google Maps

1. No [Google Cloud Console](https://console.cloud.google.com/), crie/selecione um projeto e **ative o faturamento**.
2. Em **APIs e serviços → Biblioteca**, habilite: **Maps JavaScript API**, **Places API (New)** e **Geocoding API**.
3. Em **Credenciais**, crie uma **chave de API** e restrinja:
   - *Aplicativo*: **Referenciadores HTTP** (`http://localhost:5173/*` e `https://seu-dominio.com/*`).
   - *API*: apenas as três acima.
4. Em `.env.local`: `VITE_GOOGLE_MAPS_API_KEY=sua_chave`
5. (Opcional) Crie um **Map ID** e informe em `VITE_GOOGLE_MAPS_MAP_ID`.

Sem chave, o app continua funcionando: o mapa mostra um aviso e o endereço é digitado manualmente. Se a Places API não estiver habilitada, o campo também cai para o modo manual.

## Autenticação (JWT)

Login e cadastro seguem o desenho do projeto de referência (cartão centralizado, ícone de exibir senha, medidor de força), adaptados à marca Chegô. A sessão **não usa cookies**: o backend devolve um JWT e o frontend o envia em `Authorization: Bearer <token>`.

### Contrato esperado (`VITE_AUTH_API_URL`)

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/login` | `{ "username": "<e-mail>", "password": "..." }` | `200` `{ "token": "<jwt>", "username"?: "...", "role"?: "..." }` |
| POST | `/register` | `{ "username": "<e-mail>", "email": "<e-mail>", "password": "..." }` | `2xx` (não inicia sessão) |

- O token precisa ser um JWT legível (`header.payload.signature`). Aceita também `accessToken`/`access_token`. O `exp` (se existir) controla a expiração no cliente.
- O `role` pode ser texto (`ADMIN`) ou numérico do projeto de referência (`1` = ADMIN, `2` = READER). Se não vier no corpo, é lido do claim `role` do token.
- As demais rotas (`/orders`, `/restaurants`…) devem responder **401** sem token válido.
- Nome e sobrenome do cadastro são validados na tela, mas **não são enviados** (o contrato de referência só recebe e-mail e senha). Para enviá-los, ajuste `register()` em `src/services/authService.ts`.

### Como funciona

- **Sessão:** `src/auth/authAdapter.ts` guarda o token no storage configurado e considera a sessão válida enquanto o JWT for legível e não expirado. `AuthContext` expõe `useAuth()` e encerra a sessão sozinho no instante do `exp` (e em outras abas).
- **Rotas:** `ProtectedRoute` exige sessão (senão vai ao login e guarda a página pedida); `PublicOnlyRoute` leva quem já entrou de `/login` e `/cadastro` para `/pedidos`.
- **401 da API:** o interceptor de `src/services/api.ts` encerra a sessão local. O login usa um cliente Axios separado, então credenciais erradas **não** derrubam sessão nem redirecionam.
- **Logout:** botão **Sair** (menu lateral / cabeçalho móvel) limpa o token. Como o JWT é stateless, não há chamada ao servidor; revogação e *refresh token* não estão incluídos.
- **Segurança:** erro de login sempre genérico (sem revelar se o e-mail existe); senhas e tokens nunca são registrados no console. Guardar JWT em `localStorage` o expõe a XSS; para reduzir o risco use `VITE_AUTH_TOKEN_STORAGE=session` (a sessão acaba ao fechar a aba) e mantenha `exp` curto no backend.

### Servidor mock (apenas desenvolvimento)

`server/auth.js` implementa `/auth/register`, `/auth/login` e `/auth/verify` com JWT HS256 (módulo `crypto` nativo, sem dependências extras) e exige Bearer em `/orders` e `/restaurants`. Os usuários ficam em `server/users.json` (ignorado pelo git; senhas com scrypt). Variáveis opcionais do servidor: `JWT_SECRET` (sem ela o segredo é aleatório e as sessões caem ao reiniciar), `JWT_EXPIRES_IN` (segundos, padrão 3600) e `MOCK_USER_ROLE` (padrão `ADMIN`). **Não use em produção.**

## Dados fictícios (apenas desenvolvimento)

`VITE_USE_MOCKS=true` + `npm run dev` usa `src/services/mockOrders.ts` (em memória, inclui criação). Nunca é usado em build de produção. Desative com `VITE_USE_MOCKS=false` (padrão).

## Estrutura

```
src/
  auth/         authAdapter.ts (sessão JWT), AuthContext.tsx (useAuth), jwt.ts
  components/   Layout, Brand, auth/ (AuthLayout, AuthField, PasswordStrength), OrderCard, RestaurantCard, OrderStatusBadge, OrderProgress,
                StatusActions, StatusSummary, GoogleMap, AddressAutocomplete, Loading, EmptyState
  context/      ToastContext
  data/         restaurants.ts (catálogo de restaurantes)
  hooks/        useOrders, useGoogleMaps
  pages/        LoginPage, RegisterPage, OrdersPage (abas), CreateOrderPage, OrderDetailsPage, NotFoundPage
  routes/       authRoutes, orderRoutes, ProtectedRoute, PublicOnlyRoute
  services/     api (Axios), authService, orderService, orderMapper, mockOrders (dev)
  types/        order.ts, restaurant.ts
  utils/        status, format, errors, password
```
