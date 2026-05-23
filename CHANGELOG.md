# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [1.0.0-beta.1] — 2025

> Versão inicial de produção do sistema **ClubLink** em Angular 19.
> Contém todas as funcionalidades da plataforma de gerenciamento de pontuação
> do Clube de Desbravadores.

---

### ✨ Adicionado

#### 🔐 Autenticação

- Login com **e-mail e senha** via Firebase Authentication
- Login com **conta Google** (`signInWithPopup`) — aceito somente se a conta
  estiver vinculada a um cadastro existente no Firestore
- **Recuperação de senha** via link enviado por e-mail (`sendPasswordResetEmail`):
  - Link "Esqueci minha senha" no label do campo de senha
  - Campo de e-mail pré-preenchido com o valor já digitado
  - Tela de sucesso com confirmação do endereço e validade do link (1 hora)
  - Segurança por design: `auth/user-not-found` não revela se o e-mail existe
- **Vinculação de conta Google** na página de Perfil (`linkWithPopup`) para
  usuários já cadastrados via e-mail/senha
- **Alteração de senha** com reautenticação (`reauthenticateWithCredential`)
- Logout com limpeza de estado em memória
- Guards de rota: `authGuard`, `roleGuard`, `permissionGuard`
- Observer `onAuthStateChanged` que hidrata o perfil do Firestore após o login

---

#### 👥 Gerenciamento de Membros

- **Cadastro** de desbravadores e membros da diretoria com:
  - Nome completo, unidade/classe, cargo no clube (`position`), e-mail,
    senha inicial, pontos iniciais (desbravadores), foto (base64)
- **Listagem** separada por tipo (Desbravadores / Diretoria) com busca em
  tempo real por nome, unidade ou cargo
- **Edição** de qualquer membro pela diretoria com permissão `members.edit`:
  - Campos editáveis: nome, unidade, cargo, foto
  - E-mail e senha **não são editáveis** (gerenciados pelo Firebase Auth)
  - Apenas admins podem editar `isAdmin` e `permissions` de outros diretores
- **Remoção** de membros (com confirmação) e limpeza do histórico associado
  em batch via Firestore
- Foto armazenada como **base64** no Firestore — sem custo de Storage
- Campo **`position`** (cargo) exibido em cards, ranking e perfil

---

#### 🔑 Sistema de Permissões (RBAC)

- Três níveis de acesso:
  - `desbravador` → somente próprias informações e ranking
  - `diretoria` → acesso conforme `permissions[]`
  - `diretoria` + `isAdmin: true` → acesso total irrestrito

- **9 permissões granulares** agrupadas por feature:

  | Chave | Ação |
  |---|---|
  | `podium.view` | Ver ranking Monte Everest |
  | `members.view` | Listar membros e ver histórico |
  | `members.edit` | Editar perfil de membros |
  | `members.delete` | Remover membros |
  | `appointments.view` | Acessar tela de apontamentos |
  | `appointments.edit` | Realizar apontamentos |
  | `register.view` | Acessar tela de cadastro |
  | `register.edit` | Criar novos cadastros |
  | `admin.view` | Gerenciar permissões / Console |

- `PermissionService` centraliza verificações (`can()`, `isAdmin`, `isDirector`)
- `permissionGuard(key)` protege rotas individualmente
- Navbar exibe somente os links para os quais o usuário tem permissão
- Botões de ação controlados por `permSvc.can()` nos templates
- Apenas admins podem editar permissões de outros diretores
- Regras server-side no Firestore espelham as permissões do frontend

- **`PermissionEditorComponent`** reutilizável:
  - Chips clicáveis agrupados por feature
  - Botão "Selecionar todas / Desmarcar todas"
  - Toggle **Administrador** com limpeza automática das permissões individuais
  - Usado no cadastro e na edição de membros da diretoria

---

#### 🏔 Ranking — Monte Everest

- SVG renderizado nativamente no template Angular (sem `innerHTML`)
- Cada desbravador representado por um **marcador com foto circular**:
  - `<image>` SVG + `<clipPath>` por UID para recorte circular
  - Fallback com inicial do nome quando não há foto
- Posicionamento vertical proporcional à pontuação (líderes mais próximos ao cume)
- Alternância esquerda/direita para evitar sobreposição de marcadores
- Gradientes SVG para céu, montanha e neve renderizados com `<defs>` Angular
- Lista de ranking abaixo do SVG com medalhas 🥇🥈🥉, cargo e unidade
- Atualização em tempo real via listener Firestore (`onSnapshot`)

---

#### ✏️ Apontamentos de Pontos

- Modal com **3 abas**:
  - **➕ Adicionar** — valores positivos com preview do resultado
  - **➖ Subtrair** — valores positivos (sem negativos), com aviso de zeramento
  - **🔄 Redefinir** — substitui a pontuação pelo valor informado
- **Preview em tempo real** do resultado final antes de confirmar
- Valores negativos **não são permitidos** em nenhuma aba
- Campo de **descrição/motivo** opcional em todas as abas
- Histórico salvo na sub-collection `users/{uid}/history` com:
  `type`, `delta`, `finalPoints`, `description`, `updatedBy`, `timestamp`
- Histórico **imutável** — entradas não podem ser editadas após criação

---

#### 📋 Histórico de Pontos

- **Visão do desbravador** (`/my-points`): últimas 20 entradas com tipo,
  delta colorido (verde/vermelho/dourado), valor final e responsável
- **Visão da diretoria** (`/members`): botão 📋 nos cards de desbravadores
  abre modal com últimas 30 entradas, cabeçalho com avatar e pontuação atual,
  ícone colorido por tipo de operação

---

#### 👤 Página de Perfil

- Card de identidade com avatar, nome, unidade, cargo, e-mail e badge de role/admin
- Seção **Vincular conta Google** com estado (vinculado / não vinculado)
- Seção **Alterar senha** com toggle de visibilidade e reautenticação
- Rota `/profile` (redireciona `/password` para compatibilidade)

---

#### ⚙️ Console — Administradores

Aba exclusiva para `isAdmin: true`, acessível via navbar.

##### 🚦 Status da Aplicação

- Três estados: **Em Produção** ✅ · **Em Manutenção** 🔧 · **Fora do Ar** 🚫
- Campos: mensagem personalizada, data de início (automática), previsão de retorno
  (data/hora específica ou **Indeterminada**)
- Apenas o estado atual é salvo — sem histórico de alterações
- Estados diferentes de "Em Produção" **bloqueiam a aplicação** para não-admins:
  - Tela de bloqueio dedicada (`AppStatusComponent`) sobrepõe o `<router-outlet>`
    inteiro — bloqueia inclusive a tela de login
  - Fundo com orbs animados com cor contextual por status
  - Exibe: ícone, label, mensagem, data de início, previsão de retorno, responsável
  - Admins **não são bloqueados**
- Status carregado **antes da autenticação** (leitura pública no Firestore)

##### 📤 Exportação de Base de Dados

- Exportação seletiva: **Usuários** e/ou **Histórico**
- Formato JSON proprietário versionado `clublink-app-export`:

  ```json
  {
    "_format":    "clublink-app-export",
    "_version":   "2.1.0",
    "exportedAt": "<ISO string>",
    "exportedBy": "<uid>",
    "collections": {
      "users":   [ /* ExportedUser[] */ ],
      "history": { "<uid>": [ /* ExportedHistoryEntry[] */ ] }
    }
  }
  ```

- Nome do arquivo gerado automaticamente: `clublink-app_<coleções>_<data>.json`
- Download via `Blob + URL.createObjectURL` — sem backend
- Resultado exibe contagem por coleção

##### 📥 Importação de Base de Dados

- Upload por clique ou **drag-and-drop**
- **Validação estrita do schema** antes de qualquer escrita:
  - `_format`, `_version`, `exportedAt`, `exportedBy` obrigatórios
  - Cada `User`: campos obrigatórios, `role` válido, `points >= 0`
  - Cada `HistoryEntry`: `type in ['add','reset']`, `finalPoints >= 0`, `id` obrigatório
  - Erro retorna **mensagem com o caminho exato do campo inválido**
- Prévia do arquivo com contagem de registros antes de importar
- Seleção de quais coleções importar (pré-selecionadas pelas disponíveis no arquivo)
- Importação via **batch Firestore** com `merge: true` (sobrescreve por ID)
- Batches de 490 ops (abaixo do limite de 500 do Firestore)
- Suporte a **importação parcial** — erros individuais não interrompem os demais

---

#### 🦶 Footer Global

- Componente reutilizável `FooterComponent` com input `version`
- Presente em todas as páginas autenticadas, ausente no login
- Seções: identidade (logo + nome), redes sociais (WhatsApp, Instagram, Facebook),
  suporte técnico (WhatsApp), GitHub, copyright com ano dinâmico, versão da app

---

#### 🎨 Design System

- Paleta: **Azul Marinho** `#0a1628` · **Branco Neve** `#f8faff` · **Ouro Dourado** `#c9a84c`
- Tipografia: **Cinzel** (display/títulos) + **Raleway** (corpo) via Google Fonts
- Logo SVG do triângulo dos Desbravadores em componente Angular reutilizável
- Animação **shimmer dourado** em títulos de destaque
- CSS separado por componente com `styleUrl`
- Partials globais `_variables.scss` e `_mixins.scss` como source of truth de tokens
- Totalmente responsivo (mobile-first, breakpoints 768 px e 480 px)
- Scrollbar personalizada com tom dourado

---

#### 🏗 Arquitetura e Infraestrutura

##### Angular 19 — 100% Standalone
- Sem `NgModule` — todos os componentes usam `standalone: true`
- Diretivas de control flow nativas: `@if`, `@for`, `@switch`
- Signals: `signal()`, `computed()`, `model()`, `input()`, `output()`
- `ChangeDetectionStrategy.OnPush` em todos os componentes de feature
- Lazy loading via `loadComponent` em todas as rotas

##### Clean Architecture
```
core/           → modelos, contratos, use-cases, guards
infrastructure/ → implementações concretas (Firebase)
shared/         → componentes reutilizáveis de UI
features/       → páginas/telas da aplicação
```

##### SOLID
- **S** — cada service tem responsabilidade única
- **O/D** — componentes dependem de abstrações (`IUserRepository`, `IHistoryRepository`);
  trocar Firebase por REST = alterar apenas `app.config.ts`

##### Firebase / Firestore
- Listener em tempo real via `collectionData()` e `onSnapshot`
- Sub-collection `users/{uid}/history` para histórico de apontamentos
- `serverTimestamp()` em todos os campos de data
- App Firebase secundário para criação de usuários sem deslogar o admin
- Índices: `history.timestamp` (desc), `users.googleUid`

##### CI/CD — GitHub Actions
- Pipeline `.github/workflows/release.yml` disparada por **tag anotada** (`git tag -a`)
- Tags leves abortadas no Job 1 via `git cat-file -t`
- **Job 1 — Segurança:** `npm audit --audit-level=high`
- **Job 2 — Release:** extrai notas do `CHANGELOG.md` via `awk`, cria GitHub Release
- **Job 3 — Deploy:** gera `environment.prod.ts` a partir de Secrets,
  `ng build --base-href=/clublink-app/`,
  `npx angular-cli-ghpages --dir=dist/clublink-app/browser`

---

### 🔒 Segurança — Firestore Rules

```
app_config/status   → leitura pública; escrita apenas admin + validação de enum
users/{uid}         → leitura: autenticados; criar: register.edit;
                       atualizar próprio perfil: campos seguros apenas;
                       atualizar outros: members.edit; deletar: members.delete
users/{uid}/history → leitura: dono ou appointments.view;
                       criar: appointments.edit + validação de campos;
                       update: bloqueado (imutável);
                       deletar: members.delete (batch ao remover membro)
/**                 → deny all (catch-all)
```

---

### 📁 Estrutura de Arquivos

```
src/app/
├── core/
│   ├── models/             # User, HistoryEntry, PermissionKey, AppStatus…
│   ├── repositories/       # IUserRepository, IHistoryRepository
│   ├── services/           # Auth, User, Appointment, Permission,
│   │                       # Toast, AppStatus, DatabaseIO
│   └── guards/             # authGuard, roleGuard, permissionGuard
├── infrastructure/firebase/ # FirebaseUserRepository, FirebaseHistoryRepository
├── shared/components/
│   ├── shell/              # Navbar + layout
│   ├── footer/             # Footer reutilizável
│   ├── avatar/             # Avatar com fallback de iniciais
│   ├── modal/              # Modal reutilizável
│   ├── spinner/            # Loading spinner
│   ├── toast/              # Notificações
│   ├── pathfinder-logo/    # Logo SVG
│   ├── permission-editor/  # Editor de permissões (chips)
│   └── edit-member/        # Modal de edição de perfil
└── features/
    ├── auth/               # Login (e-mail + Google + recuperação)
    ├── podium/             # Monte Everest com fotos
    ├── members/            # Lista + editar + remover + histórico
    ├── appointments/       # Apontamentos (add / subtract / reset)
    ├── register/           # Cadastro com permissões
    ├── my-points/          # Pontos do desbravador
    ├── profile/            # Perfil (Google + senha)
    ├── console/            # Console admin (status + export + import)
    └── app-status/         # Tela de bloqueio por status
```

---

[1.0.0-beta.1]: https://github.com/Camply-Labs/clublink-app/releases/tag/v1.0.0-beta.1
