# Chegô Rastreio — Playbooks e Habilidades (SKILLS.md)

Este arquivo documenta os fluxos operacionais, guias de execução passo a passo e procedimentos práticos recomendados para desenvolvedores e agentes de IA que atuam no repositório **Chegô Rastreio**.

---

## Skill 1: Configuração e Diagnóstico do Google Maps

### Quando usar
Ao configurar um novo ambiente, alterar chaves de API ou diagnosticar falhas no carregamento de mapas.

### Procedimento
1. **Configuração local:**
   * Certifique-se de que o arquivo `.env.local` contém:
     ```env
     VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
     VITE_GOOGLE_MAPS_MAP_ID=DEMO_MAP_ID
     ```
2. **Requisitos no Google Cloud Console:**
   * O projeto precisa ter uma conta de faturamento ativa vinculada.
   * Em **APIs & Services > Library**, habilitar:
     * `Maps JavaScript API` (obrigatória para o mapa interativo).
     * `Places API (New)` (autocompletar endereço em Novo pedido).
     * `Geocoding API` (usada caso os pedidos venham sem coordenadas e ao arrastar o marcador).
   * Em **APIs & Services > Credentials > API Key**:
     * Em *Application restrictions*, se usar restrição por domínio, incluir `http://localhost:*/*`.
     * Em *API restrictions*, incluir `Maps JavaScript API`, `Places API (New)` e `Geocoding API`.
3. **Diagnóstico de Erros Comuns:**
   * `403 / "This API is not activated on your API project"`: Ative a Maps JavaScript API no Google Cloud Console.
   * `RefererNotAllowedMapError`: Domínio localhost não autorizado nas restrições da chave.
   * `BillingNotEnabledMapError`: Projeto sem faturamento ativo no Google Cloud.
   * `ApiTargetBlockedMapError`: Restrição de API da chave não inclui a Maps JavaScript API.
4. **Verificação no Código:**
   * Inspecione [src/hooks/useGoogleMaps.ts](file:///c:/Users/user/Desktop/challe/chego/src/hooks/useGoogleMaps.ts) e [src/components/GoogleMap.tsx](file:///c:/Users/user/Desktop/challe/chego/src/components/GoogleMap.tsx).
   * Verifique se o fallback visual para endereço em texto está ativo quando o status for `'disabled'` ou `'error'`.

---

## Skill 2: Adaptação de DTOs e Novos Campos de Pedido

### Quando usar
Quando o backend de rastreio (Spring Boot ou outro) alterar a nomenclatura dos campos ou incluir novas informações no pedido.

### Procedimento
1. **Adicionar o campo na interface de domínio:**
   * Abra [src/types/order.ts](file:///c:/Users/user/Desktop/challe/chego/src/types/order.ts).
   * Adicione o novo campo opcional ou obrigatório em `Order` e `OrderDto`.
2. **Ajustar o mapeador de dados:**
   * Abra [src/services/orderMapper.ts](file:///c:/Users/user/Desktop/challe/chego/src/services/orderMapper.ts).
   * Mapeie o campo dentro de `mapOrderDtoToOrder()`, prevendo sinônimos com coalescência nula (`??`):
     ```typescript
     novoCampo: raw.novoCampo ?? raw.custom_field_name ?? undefined,
     ```
3. **Exibir o campo na interface:**
   * Na listagem: edite [src/components/OrderCard.tsx](file:///c:/Users/user/Desktop/challe/chego/src/components/OrderCard.tsx).
   * Nos detalhes: edite [src/pages/OrderDetailsPage.tsx](file:///c:/Users/user/Desktop/challe/chego/src/pages/OrderDetailsPage.tsx).
4. **Validar:**
   ```bash
   npm run typecheck
   ```

---

## Skill 3: Autenticação JWT e Perfis de Acesso

### Quando usar
Ao ajustar login/cadastro, o formato do token, a expiração de sessão ou as permissões por perfil.

### Procedimento
1. **Configurar em `.env.local`:**
   ```env
   VITE_AUTH_API_URL=http://localhost:8080/auth
   VITE_AUTH_TOKEN_STORAGE_KEY=token
   VITE_AUTH_TOKEN_STORAGE=local   # ou 'session' (a sessão acaba ao fechar a aba)
   VITE_LOGIN_PATH=/login
   ```
2. **Contrato da API de auth:** altere apenas [src/services/authService.ts](file:///c:/Users/user/Desktop/challe/chego/src/services/authService.ts) (rotas, nomes de campos, mapeamento de `role`). O token precisa ser um JWT legível.
3. **Sessão e storage:** [src/auth/authAdapter.ts](file:///c:/Users/user/Desktop/challe/chego/src/auth/authAdapter.ts) (leitura, expiração, `subscribe`) e [src/auth/AuthContext.tsx](file:///c:/Users/user/Desktop/challe/chego/src/auth/AuthContext.tsx) (`useAuth`). Não crie outro ponto de acesso ao token.
4. **Rotas:** públicas em [src/routes/authRoutes.tsx](file:///c:/Users/user/Desktop/challe/chego/src/routes/authRoutes.tsx); protegidas via `ProtectedRoute` em `orderRoutes.tsx`.
5. **Restrição de ações por perfil:** `VITE_STATUS_UPDATE_ROLES=ADMIN,OPERADOR` controla os botões de transição de status (compara com o `role` da resposta e com os claims `roles`/`authorities`/`role` do JWT, sem diferenciar maiúsculas).
6. **Regras de segurança:** erro de login sempre genérico; nunca logar senha/token; tela de login não pode redirecionar em 401.
7. **Validar:**
   ```bash
   npm run typecheck && npm run build
   ```

---

## Skill 4: Alternância de Ambientes (Mock vs Backend Real)

### Quando usar
Durante testes locais, desenvolvimento offline ou homologação com o backend Spring Boot.

### Procedimento
* **Opção A — servidor mock local (porta 8080, inclui `/auth` JWT):**
  * Inicie o servidor mock na pasta `server/`:
    ```bash
    cd server
    npm start   # ou, na raiz: npm run server
    ```
  * No `.env.local`: `VITE_API_BASE_URL=http://localhost:8080/`, `VITE_AUTH_API_URL=http://localhost:8080/auth` e `VITE_USE_MOCKS=false`.
  * Crie um usuário em `/cadastro` (não há usuário padrão). Os usuários ficam em `server/users.json` (ignorado pelo git).
* **Opção B — Mock em Memória (Rápido, sem servidor externo):**
  * No `.env.local`: `VITE_USE_MOCKS=true`.
  * O login continua exigindo a API de autenticação (Opção A ou C): `VITE_USE_MOCKS` só substitui os dados de pedidos.
  * Os pedidos usam os dados de [src/services/mockOrders.ts](file:///c:/Users/user/Desktop/challe/chego/src/services/mockOrders.ts).
* **Opção C — Backend Spring Boot Real:**
  * No `.env.local`: `VITE_API_BASE_URL=http://seu-servidor:8080/api` e `VITE_USE_MOCKS=false`.

---

## Skill 5: Manutenção das Transições de Status

### Quando usar
Ao adicionar um novo status de entrega ou alterar as regras de transição permitidas.

### Procedimento
1. **Adicionar o status ao tipo:**
   * Edite `OrderStatus` em [src/types/order.ts](file:///c:/Users/user/Desktop/challe/chego/src/types/order.ts).
2. **Atualizar configuração de labels e cores:**
   * Edite [src/utils/status.ts](file:///c:/Users/user/Desktop/challe/chego/src/utils/status.ts) nas matrizes `STATUS_CONFIG` e nas regras de fluxo `NEXT_STATUS`.
3. **Ajustar as etapas visuais de progresso:**
   * Edite a lista de passos em [src/components/OrderProgress.tsx](file:///c:/Users/user/Desktop/challe/chego/src/components/OrderProgress.tsx).
4. **Executar checagens de integridade:**
   ```bash
   npm run typecheck && npm run build
   ```

---

## Skill 6: Gestão do Catálogo de Restaurantes

### Quando usar
Ao adicionar, remover ou alterar restaurantes exibidos na aba **Restaurantes**, ou ao integrar um endpoint real.

### Procedimento
1. **Editar o catálogo:**
   * Abra [src/data/restaurants.ts](file:///c:/Users/user/Desktop/challe/chego/src/data/restaurants.ts) e ajuste `RESTAURANTS` (`id` único em *kebab-case*, `name`, `cuisine`, `eta`, `tone`).
   * O `id` compõe a rota `/restaurantes/:restaurantId/novo-pedido` e é enviado como `restaurantId` no `POST /orders`.
2. **Integrar um endpoint real (`GET /restaurants`):**
   * Crie a chamada em `src/services/` e mantenha o tipo `Restaurant` de [src/types/restaurant.ts](file:///c:/Users/user/Desktop/challe/chego/src/types/restaurant.ts).
   * Substitua o uso de `RESTAURANTS`/`getRestaurant()` em `OrdersPage` e `CreateOrderPage`; não duplique a lista.
3. **Se o DTO do backend não aceitar o restaurante:**
   * Remova `restaurantId`/`restaurantName` em `toCreatePayload()` ([src/services/orderMapper.ts](file:///c:/Users/user/Desktop/challe/chego/src/services/orderMapper.ts)).
4. **Validar:**
   ```bash
   npm run typecheck && npm run build
   ```
