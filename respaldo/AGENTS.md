# Chegô Rastreio — Diretrizes para Agentes de IA (AGENTS.md)

Este documento estabelece as diretrizes de operação, restrições comportamentais, padrões de engenharia e boas práticas para qualquer agente autônomo ou assistente de IA atuando neste repositório.

---

## 1. Princípios Operacionais e Eficiência de Tokens

* **Trabalho por Etapas e Foco Cirúrgico:**
  * Não execute auditorias completas ou leituras de arquivos em lote sem solicitação explícita.
  * Localize primeiro o componente ou serviço alvo antes de inspecionar dependências.
  * Nunca inspecione `node_modules/`, `dist/`, arquivos `.lock` ou diretórios de build.
* **Reutilização de Contexto:**
  * Consulte sempre [PROJECT.md](file:///c:/Users/user/Desktop/challe/chego/PROJECT.md), [SKILLS.md](file:///c:/Users/user/Desktop/challe/chego/SKILLS.md) e [README.md](file:///c:/Users/user/Desktop/challe/chego/README.md) antes de pesquisar do zero.
* **Preservação de Integridade:**
  * Não altere arquivos não relacionados à tarefa ativa.
  * Preserve comentários explicativos e contratos pré-existentes.

---

## 2. Segurança, Segredos e Variáveis de Ambiente

* **Política de Segredos Estrita:**
  * **NUNCA** exponha chaves de API, senhas, tokens de autenticação ou URLs privadas em logs, respostas de chat ou commits.
  * **NUNCA** versione o arquivo `.env.local` (certifique-se de que ele esteja sempre listado no `.gitignore`).
  * Sempre que adicionar uma nova variável de ambiente ao projeto:
    1. Declare um valor de exemplo ou placeholder em [.env.example](file:///c:/Users/user/Desktop/challe/chego/.env.example).
    2. Documente a variável em [PROJECT.md](file:///c:/Users/user/Desktop/challe/chego/PROJECT.md) e [README.md](file:///c:/Users/user/Desktop/challe/chego/README.md).
    3. Nunca solicite a chave completa ao usuário; oriente-o a configurá-la localmente no `.env.local`.

---

## 3. Padrões de Código e Arquitetura

### TypeScript e Tipagem
* Mantenha o projeto 100% livre de erros de tipagem (`npm run typecheck`).
* Evite o uso de `any`. Utilize tipos explícitos de domínio localizados em `src/types/order.ts`.
* Se o backend retornar estruturas flexíveis, utilize `unknown` e refine os tipos dentro de [src/services/orderMapper.ts](file:///c:/Users/user/Desktop/challe/chego/src/services/orderMapper.ts).

### Componentes React
* Utilize componentes funcionais com hooks nativos.
* Separe a lógica de apresentação da lógica de comunicação HTTP:
  * Camada visual: `src/components/` e `src/pages/`.
  * Requisições e manipulação de rede: `src/services/` e `src/hooks/`.
* Estilização: Utilize as classes de utilitário do **Tailwind CSS**, respeitando os tokens de cor semânticos definidos em `tailwind.config.js` (`paper-*`, `ink-*`, `brand-*`, `status-*`).

### Resiliência e Fallbacks (Google Maps)
* **Princípio do Fallback Elegante:** A aplicação deve continuar plenamente funcional mesmo se `VITE_GOOGLE_MAPS_API_KEY` for inválida, ausente ou atingir cota de faturamento.
* Qualquer novo componente que consuma o mapa deve verificar o status via [useGoogleMaps()](file:///c:/Users/user/Desktop/challe/chego/src/hooks/useGoogleMaps.ts) e apresentar o endereço textual caso o mapa não esteja disponível.

---

## 4. Fluxo de Validação Obrigatório

Antes de concluir qualquer tarefa ou entregar alterações, o agente deve executar obrigatoriamente:

1. **Checagem de Tipos:**
   ```bash
   npm run typecheck
   ```
2. **Checagem de Build:**
   ```bash
   npm run build
   ```
3. Se qualquer um dos comandos falhar, corrija a causa raiz imediatamente antes de finalizar a interação.
