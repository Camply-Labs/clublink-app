# 🦅 ClubLink — Sistema de Pontuação

> Plataforma de gerenciamento de pontuação para **Clubes de Desbravadores** (Use Case para o Clube Garras de Águia)
> Construída com Angular 19, Firebase Auth e Cloud Firestore.

---

## 🚀 Demo

**[https://camply-labs.github.io/clublink-app](https://camply-labs.github.io/clublink-app)**

---

## 📋 Sumário

- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração do Firebase](#-configuração-do-firebase)
- [Executar localmente](#-executar-localmente)
- [Build e Deploy](#-build-e-deploy)
- [CI/CD](#-cicd---github-actions)
- [Permissões](#-sistema-de-permissões)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Migrar para outro backend](#-migrar-para-outro-backend)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)

---

## ✨ Funcionalidades

| Recurso | Admin | Diretoria | Desbravador |
|---|:---:|:---:|:---:|
| Ver ranking Monte Everest | ✅ | ✅ (perm) | ✅ |
| Ver próprios pontos e histórico | — | — | ✅ |
| Listar membros | ✅ | ✅ (perm) | — |
| Ver histórico de qualquer membro | ✅ | ✅ (perm) | — |
| Editar perfil de membros | ✅ | ✅ (perm) | — |
| Remover membros | ✅ | ✅ (perm) | — |
| Realizar apontamentos | ✅ | ✅ (perm) | — |
| Cadastrar membros | ✅ | ✅ (perm) | — |
| Gerenciar permissões de diretores | ✅ | — | — |
| Console (status, export, import) | ✅ | — | — |
| Alterar própria senha | ✅ | ✅ | ✅ |
| Vincular conta Google | ✅ | ✅ | ✅ |
| Login com Google | ✅ | ✅ | ✅ |
| Recuperação de senha por e-mail | ✅ | ✅ | ✅ |

---

## 🛠 Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | Angular 19 (standalone, signals, OnPush) |
| Autenticação | Firebase Authentication |
| Banco de dados | Cloud Firestore |
| Estilização | SCSS com design tokens |
| CI/CD | GitHub Actions |
| Hospedagem | GitHub Pages |
| Fontes | Google Fonts (Cinzel + Raleway) |

---

## 🏗 Arquitetura

O projeto segue **Clean Architecture** com inversão de dependência (SOLID):

```
src/app/
├── core/              # Domínio puro — sem dependência de framework ou Firebase
│   ├── models/        # Interfaces e tipos de domínio
│   ├── repositories/  # Contratos abstratos (IUserRepository, IHistoryRepository)
│   ├── services/      # Use-cases de aplicação
│   └── guards/        # Guards de rota
├── infrastructure/    # Implementações concretas (Firebase)
│   └── firebase/
├── shared/            # Componentes reutilizáveis de UI
│   └── components/
└── features/          # Páginas/telas (uma por feature)
```

Para migrar de Firebase para REST: troque somente os providers em `app.config.ts`.
Nenhum componente ou service de aplicação precisa ser alterado.

---

## 📦 Pré-requisitos

- **Node.js** ≥ 20
- **npm** ≥ 10
- **Angular CLI** ≥ 19 (`npm install -g @angular/cli`)
- Conta no [Firebase](https://firebase.google.com)
- Conta no [GitHub](https://github.com) (para CI/CD e Pages)

---

## 🔧 Instalação

```bash
# Clone o repositório
git clone https://github.com/Camply-Labs/clublink-app.git
cd clublink-app

# Instale as dependências
npm install
```

---

## 🔥 Configuração do Firebase

### 1. Criar o projeto

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. **Adicionar projeto** → nome → avançar
3. Desative Google Analytics (opcional) → **Criar projeto**

### 2. Ativar serviços

| Serviço | Caminho |
|---|---|
| E-mail/Senha | Authentication → Sign-in method → E-mail/Senha → Ativar |
| Google Auth | Authentication → Sign-in method → Google → Ativar |
| Firestore | Firestore Database → Criar → Modo produção → Região |

### 3. Preencher os environments

Edite `src/environments/environment.ts` (e `.prod.ts`):

```ts
export const environment = {
  production: false,
  firebase: {
    apiKey:            'SUA_API_KEY',
    authDomain:        'seu-projeto.firebaseapp.com',
    projectId:         'seu-projeto',
    storageBucket:     'seu-projeto.appspot.com',
    messagingSenderId: '123456789',
    appId:             '1:123:web:abc',
  },
};
```

### 4. Aplicar regras e índices Firestore

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # usa firestore.rules e firestore.indexes.json existentes
firebase deploy --only firestore
```

### 5. Criar o primeiro usuário Admin

**Authentication → Usuários → Adicionar usuário** — anote o UID gerado.

**Firestore → Dados** — crie o documento:

```
Coleção: users
Documento: [UID]
Campos:
  name:        "Nome do Admin"
  email:       "admin@exemplo.com"
  unit:        "Diretoria"
  position:    "Diretor"
  role:        "diretoria"
  isAdmin:     true
  permissions: []
  points:      0
  photoUrl:    ""
  createdAt:   (timestamp)
```

---

## ▶️ Executar localmente

```bash
npm start
# → http://localhost:4200
```

> ⚠️ Não abra `index.html` diretamente via `file://` — o Firebase Auth exige um servidor HTTP.

---

## 📦 Build e Deploy

### Build de produção

```bash
npm run build:prod
# Artefatos em dist/clublink-app/browser/
```

### Deploy manual no GitHub Pages

```bash
ng build --base-href=/clublink-app/
npx angular-cli-ghpages --dir=dist/clublink-app/browser
```

### Deploy via Firebase Hosting

```bash
firebase deploy --only hosting
```

---

## 🤖 CI/CD — GitHub Actions

O pipeline `.github/workflows/release.yml` é disparado **somente por tags anotadas**:

```bash
# Criar e publicar uma release
git tag -a v1.0.0-beta.1 -m "Release v1.0.0-beta.1"
git push origin v1.0.0-beta.1
```

> Tags leves (`git tag v1.0.0-beta.1`) são detectadas e **abortadas** no primeiro job.

### Jobs

| # | Job | O que faz |
|---|---|---|
| 1 | 🔒 Segurança | Valida tag anotada + `npm audit --audit-level=high` |
| 2 | 📦 Release | Extrai notas do `CHANGELOG.md` + cria GitHub Release |
| 3 | 🚀 Deploy | Build Angular + deploy no GitHub Pages |

### Secrets necessários

Configure em **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Valor |
|---|---|
| `FIREBASE_API_KEY` | `apiKey` do projeto |
| `FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `FIREBASE_PROJECT_ID` | `projectId` |
| `FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `FIREBASE_APP_ID` | `appId` |

---

## 🔑 Sistema de Permissões

### Roles

| Role | Descrição |
|---|---|
| `desbravador` | Acesso somente às próprias informações e ranking |
| `diretoria` | Acesso conforme `permissions[]` |
| `diretoria` + `isAdmin: true` | Acesso total irrestrito |

### Como definir permissões

Permissões são configuradas em dois lugares:
1. **Cadastro** (`/register`) → ao criar um novo membro da diretoria
2. **Membros → ✏️ Editar** → modal de edição com `PermissionEditorComponent`

Somente administradores podem editar permissões de outros diretores.

### Guards de rota

```ts
// Protege por autenticação
canActivate: [authGuard]

// Protege por role
canActivate: [roleGuard('diretoria')]

// Protege por permissão específica
canActivate: [permissionGuard('appointments.view')]
```

---

## 📁 Estrutura do Projeto

```
clublink-app/
├── .github/workflows/
│   └── release.yml              # Pipeline CI/CD
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/          # User, HistoryEntry, PermissionKey, AppStatus
│   │   │   ├── repositories/    # IUserRepository, IHistoryRepository
│   │   │   ├── services/        # Auth, User, Appointment, Permission,
│   │   │   │                    # Toast, AppStatus, DatabaseIO
│   │   │   └── guards/          # authGuard, roleGuard, permissionGuard
│   │   ├── infrastructure/
│   │   │   └── firebase/        # FirebaseUserRepository, FirebaseHistoryRepository
│   │   ├── shared/components/
│   │   │   ├── shell/           # Navbar + layout principal
│   │   │   ├── footer/          # Footer reutilizável
│   │   │   ├── avatar/          # Avatar com fallback
│   │   │   ├── modal/           # Modal genérico
│   │   │   ├── spinner/         # Loading spinner
│   │   │   ├── toast/           # Notificações
│   │   │   ├── pathfinder-logo/ # Logo SVG
│   │   │   ├── permission-editor/ # Editor de permissões
│   │   │   └── edit-member/     # Modal de edição de membro
│   │   └── features/
│   │       ├── auth/            # Login + recuperação de senha
│   │       ├── podium/          # Ranking Monte Everest
│   │       ├── members/         # Listagem, edição, remoção, histórico
│   │       ├── appointments/    # Apontamentos de pontos
│   │       ├── register/        # Cadastro de membros
│   │       ├── my-points/       # Pontos do desbravador
│   │       ├── profile/         # Perfil, Google, senha
│   │       ├── console/         # Console admin
│   │       └── app-status/      # Tela de bloqueio por status
│   ├── environments/
│   │   ├── environment.ts       # ⚠️ Configure aqui (dev)
│   │   └── environment.prod.ts  # ⚠️ Configure aqui (prod)
│   └── styles/
│       ├── _variables.scss      # Design tokens
│       └── _mixins.scss         # Mixins reutilizáveis
├── firestore.rules              # Regras de segurança do Firestore
├── firestore.indexes.json       # Índices compostos
├── firebase.json                # Configuração de deploy
├── CHANGELOG.md                 # Histórico de versões
└── README.md                    # Este arquivo
```

---

## 🔄 Migrar para outro backend

A arquitetura usa inversão de dependência. Para trocar Firebase por uma API REST:

1. Crie `src/app/infrastructure/http/http-user.repository.ts` implementando `IUserRepository`
2. Crie `src/app/infrastructure/http/http-history.repository.ts` implementando `IHistoryRepository`
3. Em `src/app/app.config.ts`, troque os providers:

```ts
// Antes:
{ provide: IUserRepository,    useClass: FirebaseUserRepository },
{ provide: IHistoryRepository, useClass: FirebaseHistoryRepository },

// Depois:
{ provide: IUserRepository,    useClass: HttpUserRepository },
{ provide: IHistoryRepository, useClass: HttpHistoryRepository },
```

Nenhum componente, service ou guard precisa ser alterado.

---

## 🌐 Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `firebase.apiKey` | Chave da API do projeto Firebase |
| `firebase.authDomain` | Domínio de autenticação |
| `firebase.projectId` | ID do projeto Firestore |
| `firebase.storageBucket` | Bucket de storage |
| `firebase.messagingSenderId` | ID do sender de mensagens |
| `firebase.appId` | ID do app web registrado |

Em produção via CI/CD, as variáveis são injetadas como **GitHub Secrets** e nunca ficam no repositório.

---

## 📄 Licença

[AGPLv3](https://www.gnu.org/licenses/agpl-3.0.txt)

---

*Copyright © 2026 Camply Labs.* 🦅 · Angular 19 · Firebase · v1.0.0-beta.1
