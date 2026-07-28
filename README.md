# Vitalis Essence — Vida em Funcionamento

Aplicativo (super-app) de **estilo de vida e bem-estar**: reúne saúde, finanças, viagens,
compras, tarefas, encontros, controle de vícios, área feminina, astrologia e vida
profissional — tudo num só lugar.

> Este README é o **mapa do projeto**. A ideia é que, lendo daqui, você entenda o que é
> cada parte, onde ela fica e como as coisas se conectam. Os arquivos de código também
> estão sendo comentados em português, bloco a bloco.

---

## 1. Visão geral (o que é cada coisa)

| Camada | Tecnologia | Para que serve |
|---|---|---|
| **Front-end** (a tela) | React + TypeScript + Vite | Tudo que o usuário vê e clica |
| **Estilo visual** | Tailwind CSS + shadcn/ui | Cores, botões, layout, componentes prontos |
| **Animações** | framer-motion | Transições e movimentos suaves |
| **Back-end** (o servidor) | Supabase | Banco de dados, login, arquivos e funções |
| **Banco de dados** | PostgreSQL (no Supabase) | Onde ficam guardados TODOS os dados |
| **Funções de servidor** | Supabase Edge Functions (Deno) | Código que roda no servidor (Stripe, IA, push) |
| **Pagamentos** | Stripe | Assinaturas dos módulos pagos |
| **Inteligência Artificial** | OpenAI (GPT-4o) | Análise de exames, horóscopo, dicas de viagem |
| **Notificações** | Web Push (PWA) + VAPID | Lembretes de remédio, água, refeição |

É um **PWA** (Progressive Web App): funciona no navegador e pode ser "instalado" na tela
inicial do celular. A versão **nativa** para Google Play / App Store (via Capacitor) é uma
etapa futura.

---

## 2. Como rodar o projeto no seu computador

Pré-requisitos: **Node.js** instalado (versão 18+).

```sh
# 1. Instalar as dependências (baixa as bibliotecas na pasta node_modules)
npm install

# 2. Criar o arquivo .env com as chaves (copie do modelo)
#    Renomeie ".env.example" para ".env" e preencha a chave anon do Supabase.

# 3. Rodar em modo desenvolvimento (abre em http://localhost:8080)
npm run dev

# Outros comandos úteis:
npm run build     # gera a versão de produção (pasta dist/)
npm run preview   # testa a versão de produção localmente
npm run lint      # verifica erros de padrão no código
npm test          # roda os testes automatizados
```

---

## 3. Estrutura de pastas (onde fica cada coisa)

```
vitalis-essence/
├─ public/              → arquivos estáticos (ícones, service worker de push, robots.txt)
├─ src/                 → TODO o código do front-end (o app em si)
│  ├─ assets/           → imagens (heróis, cartas de tarô, ícones dos módulos)
│  ├─ components/       → peças reutilizáveis de tela (cards, diálogos, botões)
│  │  ├─ ui/            → componentes base do shadcn (button, input, dialog...)
│  │  ├─ admin/         → painel de administrador (gestão de vitalício)
│  │  ├─ arena/         → telas do módulo Arena (grupos/social)
│  │  ├─ astral/        → telas do módulo Astral (astrologia/tarô)
│  │  └─ travel/        → telas do módulo Viagens
│  ├─ contexts/         → estado global (login e assinatura) — ver seção 6
│  ├─ hooks/            → "ganchos" que buscam/salvam dados (ver seção 5)
│  ├─ integrations/
│  │  └─ supabase/      → conexão com o Supabase (client.ts) e tipos do banco (types.ts)
│  ├─ lib/              → utilidades (funções auxiliares, base de alimentos)
│  ├─ pages/            → cada TELA/rota do app (ver seção 4)
│  ├─ App.tsx           → o "mapa de rotas": liga cada endereço (/saude) a uma tela
│  └─ main.tsx          → ponto de entrada: onde o React começa a rodar
├─ supabase/
│  ├─ functions/        → as 10 Edge Functions (código que roda no servidor)
│  └─ migrations/       → histórico do banco (cada arquivo cria/altera tabelas)
├─ .env                 → suas chaves locais (NÃO vai pro GitHub)
├─ .env.example         → modelo do .env (vai pro GitHub, sem segredos)
└─ package.json         → lista de dependências e comandos (scripts)
```

---

## 4. Módulos e telas (pasta `src/pages`)

| Rota (endereço) | Arquivo | Módulo / o que faz |
|---|---|---|
| `/` | `Index.tsx` | Página inicial / hub principal |
| `/saude` | `Dashboard.tsx` | **Saúde**: peso, remédios, exames, treinos, refeições, água (grátis) |
| `/financeiro` | `Finance.tsx` | **Financeiro**: contas, reservas, investimentos, cripto, trades |
| `/viagens` | `Viagens.tsx` | **Viagens**: planejamento, membros, gastos, IA de recomendações |
| `/lista-compras` | `Shopping.tsx` | **Compras**: catálogo, preços, listas colaborativas |
| `/tarefas` | `Tasks.tsx` | **Tarefas / Vida Pessoal**: metas e afazeres por área da vida |
| `/encontros` | `Encontros.tsx` | **Encontros**: eventos e rateio de despesas em grupo |
| `/arena` | `Arena.tsx` | **Arena**: grupos sociais, ranking, check-ins de saúde |
| `/libertacao` | `Liberation.tsx` | **Libertação**: controle de vícios e gatilhos |
| `/feminino` | `FeminineArea.tsx` | **Área Feminina**: ciclo menstrual, contracepção, intimidade |
| `/astral` | `Astral.tsx` | **Astral**: mapa astral, tarô, horóscopo diário (IA) |
| `/profissional` | `Professional.tsx` | **Profissional**: carreira, skills, metas, estudos |
| `/planos` | `Plans.tsx` | Tela de assinaturas (Stripe) |
| `/conta` | `Account.tsx` | Conta do usuário e configurações |
| `/auth` | `Auth.tsx` | Login e cadastro |

---

## 5. Hooks (pasta `src/hooks`) — como os dados entram e saem

No React, um **hook** é uma função reutilizável. Aqui, cada `useAlgumaCoisa` cuida de
**buscar e salvar** um tipo de dado no Supabase. Exemplos:

- `useDailyTracking` → o acompanhamento diário (água, refeições, treino do dia)
- `useWeightHistory` → o histórico de peso
- `useUserMedications` / `useMedicationIntake` → remédios e o registro de quando tomou
- `useFinancialFlow`, `useInvestments`, `useCryptoStrategies` → dados financeiros
- `useTrips`, `useTripItems` → viagens e seus itens
- `useAstral` → dados de astrologia
- `usePushNotifications` → permissão e inscrição de notificações

Padrão geral de um hook: ele usa o `supabase` (de `integrations/supabase/client.ts`) para
ler/gravar numa tabela, e devolve os dados + funções para a tela usar.

---

## 6. Login e Assinatura (pasta `src/contexts`)

- **`AuthContext.tsx`** → guarda quem está logado. Qualquer tela pode perguntar "quem é o
  usuário atual?" através do hook `useAuth()`.
- **`SubscriptionContext.tsx`** → sabe **quais módulos o usuário pode acessar**. Ele chama a
  Edge Function `check-subscription` e expõe `hasModuleAccess("financeiro")`, etc.
  - Módulo `saude` é **sempre grátis**.
  - Acesso pode vir de: **assinatura Stripe**, **trial de 14 dias**, ou **premium vitalício**.

---

## 7. Banco de dados (Supabase / PostgreSQL)

- São **113 tabelas** na pasta `supabase/migrations` (cada arquivo é uma alteração no banco,
  em ordem de data).
- Todas as tabelas têm **RLS (Row Level Security)** ligado: cada usuário só enxerga os
  próprios dados. As regras (policies) garantem isso no nível do banco.
- Tabelas de controle importantes:
  - `profiles` → perfil de cada usuário (criado automaticamente no cadastro)
  - `platform_admins` → quem é administrador da plataforma
  - `lifetime_premium_users` → quem tem acesso vitalício
  - `user_subscriptions` / `module_trials` → assinaturas e períodos de teste

---

## 8. Edge Functions (pasta `supabase/functions`) — código no servidor

São 10 funções que rodam no servidor do Supabase (não no navegador), usadas para tarefas
que exigem segredos ou segurança:

| Função | O que faz |
|---|---|
| `check-subscription` | Diz quais módulos o usuário tem acesso (vitalício/trial/Stripe) |
| `create-checkout` | Cria a página de pagamento do Stripe |
| `customer-portal` | Abre o portal do cliente Stripe (gerenciar assinatura) |
| `analyze-exam` | **IA**: lê uma imagem/PDF de exame e extrai os biomarcadores |
| `generate-horoscope` | **IA**: gera o horóscopo diário personalizado |
| `trip-recommendations` | **IA**: sugere restaurantes/passeios do destino |
| `get-vapid-key` | Entrega a chave pública de push ao navegador |
| `send-push` | Envia uma notificação push para um usuário |
| `notification-cron` | Roda a cada minuto e dispara os lembretes do dia |
| `cryptoingest` | Recebe dados de cripto de fora e grava no banco |

> As chaves secretas (Stripe, OpenAI, VAPID) NÃO ficam no código — ficam nos **Secrets**
> das Edge Functions, no painel do Supabase.

---

## 9. Segurança — o que nunca vai para o GitHub

Estão protegidos no `.gitignore`:
- `.env` (suas variáveis locais)
- `VAPID_KEYS_SECRETS.txt` (chave privada de push)
- `node_modules/` e `dist/` (geradas automaticamente)

**Regra de ouro:** chave secreta nunca entra no código nem no repositório. Sempre nos
Secrets do Supabase.

---

## 10. Próximos passos do projeto

- [ ] Adicionar os 3 secrets VAPID no Supabase (para o push funcionar)
- [ ] Testar de ponta a ponta: IA (exame/horóscopo) e checkout Stripe
- [ ] Empacotar como app nativo (Capacitor) para Android e iOS
- [ ] (Comentando o código módulo a módulo, em português)
