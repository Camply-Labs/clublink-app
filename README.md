# 🦅 ClubLink — Sistema de Pontuação

> Plataforma de gerenciamento de pontuação para o **Clube de Desbravadores Garras de Águia**.
> Construída com Angular 19, Firebase Auth e Cloud Firestore.

[![Release](https://img.shields.io/badge/release-v1.0.0--beta.2-gold)](https://github.com/Camply-Labs/clublink-app/releases)
[![Angular](https://img.shields.io/badge/Angular-19-red)](https://angular.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)](https://firebase.google.com)

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

---

## ✨ Funcionalidades

| Recurso | Admin | Diretoria | Desbravador |
|---|:---:|:---:|:---:|
| Ver ranking Monte Everest | ✅ | ✅ | ✅ |
| Ver tabela de pontuações padrão | ✅ | ✅ | ✅ |
| Ver agenda do clube | ✅ | ✅ | ✅ |
| Ver próprios pontos e histórico | — | — | ✅ |
| Listar membros | ✅ | ✅ (perm) | — |
| Ver histórico de qualquer membro | ✅ | ✅ (perm) | — |
| Editar / remover membros | ✅ | ✅ (perm) | — |
| Realizar apontamentos (individual) | ✅ | ✅ (perm) | — |
| Apontamento por unidade / clube todo | ✅ | ✅ (perm) | — |
| Gerenciar pontuações padrão | ✅ | ✅ (perm) | — |
| Criar / editar / excluir eventos | ✅ | ✅ (perm) | — |
| Importar / exportar agenda `.ics` | ✅ | ✅ (perm) | — |
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
| Calendário | FullCalendar v6 (`@fullcalendar/angular`) |
| Autenticação | Firebase Authentication |
| Banco de dados | Cloud Firestore |
| Estilização | SCSS com design tokens |
| CI/CD | GitHub Actions |
| Hospedagem | GitHub Pages |
| Fontes | Google Fonts (Cinzel + Raleway) |

---

## 🏗 Arquitetura

```
src/app/
├── core/              # Domínio puro — sem dependência de framework ou Firebase
│   ├── models/        # User, AgendaEvent, ScoringItem, AppStatus…
│   ├── repositories/  # Contratos abstratos
│   ├── services/      # Use-cases (Auth, User, Appointment, Event, Scoring…)
│   └── guards/        # authGuard, roleGuard, permissionGuard
├── infrastructure/    # Implementações concretas (Firebase)
│   └── firebase/
├── shared/            # Componentes reutilizáveis de UI
└── features/          # Páginas/telas da aplicação
```

Para migrar de Firebase para REST: troque os providers em `app.config.ts`.
Nenhum componente, service ou guard precisa ser alterado.

---

## 📦 Pré-requisitos

- **Node.js** ≥ 20 · **npm** ≥ 10
- **Angular CLI** ≥ 19 — `npm install -g @angular/cli`
- Conta no [Firebase](https://firebase.google.com)
- Conta no [GitHub](https://github.com) (para CI/CD e Pages)

---

## 🔧 Instalação

```bash
git clone https://camply-labs.github.io/clublink-app.git
cd clublink-app
npm install
```

---

## 🔥 Configuração do Firebase

### 1. Criar o projeto

1. [console.firebase.google.com](https://console.firebase.google.com) → **Adicionar projeto**

### 2. Ativar serviços

| Serviço | Caminho |
|---|---|
| E-mail/Senha | Authentication → Sign-in method → E-mail/Senha |
| Google Auth | Authentication → Sign-in method → Google |
| Firestore | Firestore Database → Criar → Modo produção |

### 3. Preencher environments


Edite `src/environments/environment.ts` (e `.prod.ts` e `.development.ts`):
```ts
// src/environments/environment.ts
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

### 4. Criar o primeiro usuário Admin

**Authentication → Adicionar usuário** → anote o UID.

**Firestore → Dados** → crie o documento:

```
Coleção: users / Documento: [UID]

name:        "Nome do Admin"
email:       "admin@exemplo.com"
unit:        "Diretoria"
position:    "Diretor"
role:        "diretoria"
isAdmin:     true
permissions: []
points:      0
photoUrl:    ""
birth:       ""
createdAt:   (timestamp)
```

---

## ▶️ Executar localmente

```bash
npm start
# → http://localhost:4200
```

---

## 📦 Build e Deploy

```bash
# Build de produção
npm run build:prod

# Deploy no GitHub Pages
ng build --base-href=/clublink-app/
npx angular-cli-ghpages --dir=dist/clublink-app/browser
```

---

## 🤖 CI/CD — GitHub Actions

Pipeline disparada por **tag anotada**:

```bash
git tag -a v1.0.0-beta.2 -m "Release v1.0.0-beta.2 — Agenda e Pontuações"
git push origin v1.0.0-beta.2
```

| Job | O que faz |
|---|---|
| 🔒 Segurança | Valida tag anotada + `npm audit --audit-level=high` |
| 📦 Release | Extrai notas do `CHANGELOG.md` + cria GitHub Release |
| 🚀 Deploy | Build Angular + deploy no GitHub Pages via `angular-cli-ghpages` |

### Secrets necessários

| Secret | Valor |
|---|---|
| `FIREBASE_API_KEY` | `apiKey` |
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
| `desbravador` | Próprias informações, ranking, agenda (públicos), tabela de pontuações |
| `diretoria` | Acesso conforme `permissions[]` |
| `diretoria + isAdmin: true` | Acesso total irrestrito |

### Permissões disponíveis

| Grupo | Chave | Ação |
|---|---|---|
| Ranking | `podium.view` | Ver ranking |
| Membros | `members.view` | Listar + ver histórico |
| Membros | `members.edit` | Editar perfil |
| Membros | `members.delete` | Remover |
| Apontamentos | `appointments.view` | Ver tela |
| Apontamentos | `appointments.edit` | Realizar apontamentos |
| Pontuações | `scoring.view` | Ver pontuações padrão |
| Pontuações | `scoring.edit` | Gerenciar pontuações padrão |
| Agenda | `agenda.view` | Ver agenda |
| Agenda | `agenda.edit` | Criar/editar/excluir eventos, importar/exportar |
| Cadastro | `register.view` | Ver tela de cadastro |
| Cadastro | `register.edit` | Criar cadastros |
| Admin | `admin.view` | Console + gerenciar permissões |

---

## 📁 Estrutura do Projeto

```
clublink-app/
├── .github/workflows/release.yml
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/           # index.ts, event.model.ts, scoring.model.ts, app-status.model.ts
│   │   │   ├── repositories/     # IUserRepository, IHistoryRepository,
│   │   │   │                     # IEventRepository, IScoringRepository
│   │   │   ├── services/         # Auth, User, Appointment, Event, Scoring,
│   │   │   │                     # ICS, Permission, Toast, AppStatus, DatabaseIO
│   │   │   └── guards/           # authGuard, roleGuard, permissionGuard
│   │   ├── infrastructure/firebase/
│   │   │   ├── firebase-user.repository.ts
│   │   │   ├── firebase-history.repository.ts
│   │   │   ├── firebase-event.repository.ts
│   │   │   └── firebase-scoring.repository.ts
│   │   ├── shared/components/
│   │   │   ├── shell/            # Navbar + layout
│   │   │   ├── footer/           # Footer reutilizável
│   │   │   ├── avatar/           # Avatar com fallback
│   │   │   ├── modal/            # Modal genérico
│   │   │   ├── spinner/          # Loading spinner
│   │   │   ├── toast/            # Notificações
│   │   │   ├── pathfinder-logo/  # Logo SVG
│   │   │   ├── permission-editor/
│   │   │   ├── edit-member/
│   │   │   └── scoring-legend/   # Modal tabela de pontuações
│   │   └── features/
│   │       ├── auth/             # Login + recuperação
│   │       ├── podium/           # Ranking Monte Everest
│   │       ├── agenda/           # Calendário FullCalendar
│   │       ├── scoring/          # CRUD pontuações padrão
│   │       ├── members/          # Listagem + histórico
│   │       ├── appointments/     # Apontamentos individual e por grupo
│   │       ├── register/         # Cadastro
│   │       ├── my-points/        # Pontos do desbravador
│   │       ├── profile/          # Perfil
│   │       ├── console/          # Console admin
│   │       ├── app-status/       # Tela de bloqueio
│   │       └── admin-override/   # Rota de emergência
│   ├── environments/
│   └── styles/
│       ├── _variables.scss
│       └── _mixins.scss
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── CHANGELOG.md
└── README.md
```

---

## 🔄 Migrar para outro backend

Em `src/app/app.config.ts`, troque:

```ts
{ provide: IUserRepository,    useClass: HttpUserRepository },
{ provide: IHistoryRepository, useClass: HttpHistoryRepository },
{ provide: IEventRepository,   useClass: HttpEventRepository },
{ provide: IScoringRepository, useClass: HttpScoringRepository },
```

Nenhum componente, service ou guard precisa ser alterado.

---

## 📄 Versão

**v1.0.0-beta.2** · Angular 19 · Firebase · FullCalendar 6

*ClubLink* 🦅
