# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [1.0.0-beta.2] — 2025

### ✨ Adicionado

#### 📅 Agenda

- Nova aba **Agenda** acessível a todos os usuários autenticados, renderizada com
  **FullCalendar v6** (`@fullcalendar/angular`) com os plugins:
  `dayGrid`, `timeGrid`, `list` e `interaction`
- Três visualizações: **Mês**, **Semana** e **Lista**, com locale `pt-BR`
- Criação de eventos por clique em data ou botão **➕ Novo Evento**, com:
  - Título, data/hora de início e fim, opção de dia inteiro
  - Descrição, local, cor (8 opções) e marcação como **🔒 Privado**
- Edição e exclusão de qualquer evento (manual, importado ou aniversário)
- Eventos privados visíveis **apenas para diretoria**; demais usuários não os veem
- Permissões `agenda.view` e `agenda.edit` no sistema RBAC

##### 📥 Importação de `.ics` (Google Agenda / iCalendar)
- Upload por clique ou **drag-and-drop** de arquivo `.ics`
- Parse completo de `VEVENT` com suporte a:
  - `DTSTART` / `DTEND` com datas all-day e datetime com timezone
  - `SUMMARY`, `DESCRIPTION`, `LOCATION`, `CLASS` (PRIVATE/CONFIDENTIAL → privado)
  - Line-folding (RFC 5545)
- Ao importar um novo arquivo, **todos os eventos de importação e aniversário são
  deletados e recriados** — eventos criados manualmente são preservados
- Hash **SHA-256** gerado do conteúdo do arquivo a cada importação
- Registro de **log de importação** na coleção `import_log`:
  `filename`, `hash`, `importedAt`, `importedBy`, `importedByName`, `eventCount`
- **Aniversários** gerados automaticamente para todos os membros com `birth`
  preenchido (ano corrente e seguinte), como eventos `birthday` com cor rosa

##### 📤 Exportação de `.ics`
- Exporta todos os eventos visíveis para o usuário atual como arquivo `.ics`
  compatível com Google Agenda, Apple Calendar e Outlook
- Eventos privados exportados com `CLASS:PRIVATE`
- Nome do arquivo gerado: `clublink_agenda_<data>.ics`

##### 🎂 Data de Nascimento (`birth`)
- Novo campo `birth: string` (formato `YYYY-MM-DD`) em todos os membros
- Campo **Data de Nascimento** adicionado ao formulário de cadastro (`/register`)
  e ao modal de edição (`EditMemberComponent`)
- Exibido no card de identidade da página Perfil

---

#### 📊 Pontuações Padrão

- Nova aba **Pontuações** (`/scoring`), acessível para quem tem `scoring.edit`
- CRUD completo de itens de pontuação com:
  - **Nome**, descrição, categoria e valor de pontos
  - Seletor visual **Positivo / Negativo** — valores positivos somam, negativos subtraem
  - Preview do valor final antes de salvar
- Itens separados visualmente em **Positivas** e **Negativas** com borda colorida
- Permissões `scoring.view` e `scoring.edit` adicionadas ao sistema RBAC e ao
  `PermissionEditorComponent`

##### 📊 Modal "Tabela de Pontuações" (`ScoringLegendComponent`)
- Modal reutilizável com lista completa de pontuações padrão separadas por tipo
- Disponível em **três telas**: Apontamentos, Ranking (Monte Everest) e Meus Pontos
- Exibe nome, descrição, categoria e valor com cor verde (positivo) / vermelho (negativo)

---

#### ✏️ Melhorias em Apontamentos

##### Checkboxes de Pontuações Padrão
- Modal de apontamento agora lista as pontuações padrão como **chips clicáveis**:
  - Aba **Adicionar** → exibe pontuações positivas
  - Aba **Subtrair** → exibe pontuações negativas
- Seleção acumula automaticamente o valor total
- Campo de pontos adicionais mantido para valores fora da lista padrão
- **Preview em tempo real** do total a adicionar/subtrair e do resultado final
- Descrição preenchida automaticamente com os nomes dos itens selecionados

##### Atualização Local Imediata
- Após confirmar um apontamento com sucesso, a pontuação exibida nos cards é
  **atualizada imediatamente** via signal `localPoints` — sem aguardar o listener
  do Firestore

##### Apontamento por Grupo
- Botão **👥 Apontar por Grupo** no cabeçalho da tela de Apontamentos
- Fluxo em **3 steps**:
  1. **Escolha de escopo**: Por Unidade (radio buttons com contador) ou Clube Todo
  2. **Formulário**: mesmo formulário com tabs, checkboxes e preview
  3. **Resultado**: confirmação com nome do escopo e contagem de afetados
- Preview dos membros afetados antes de confirmar (chips com avatar + nome)
- Executa todos os apontamentos em `Promise.all` (paralelo)
- Atualiza `localPoints` para todos os membros de uma vez

---

### 🔧 Modificado

- `models/index.ts` — `PermissionKey` expandido com `scoring.view`, `scoring.edit`,
  `agenda.view`, `agenda.edit`; campo `birth` adicionado a `User`,
  `CreateUserPayload` e `UpdateProfilePayload`
- `app.config.ts` — providers `IScoringRepository` e `IEventRepository` adicionados
- `app.routes.ts` — rotas `/scoring` e `/agenda` adicionadas
- `shell.component.ts` — links **📅 Agenda** e **📊 Pontuações** na navbar
- `register.component.ts` — campo Data de Nascimento
- `edit-member.component.ts` — campo Data de Nascimento
- `firebase-user.repository.ts` — leitura/escrita do campo `birth`
- `podium.component.ts` — botão 📊 Tabela de Pontuações + `ScoringLegendComponent`
- `my-points.component.ts` — botão 📊 Tabela de Pontuações + `ScoringLegendComponent`
- `package.json` — dependências `@fullcalendar/angular`, `@fullcalendar/core`,
  `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/list`,
  `@fullcalendar/interaction`

---

### 🔒 Segurança — Firestore Rules

```
scorings/{id}    → leitura: autenticados; escrita: scoring.edit
events/{id}      → leitura: autenticados (privados só para diretoria);
                   criar: agenda.edit + campos obrigatórios;
                   editar/excluir: agenda.edit (qualquer source)
import_log/{id}  → leitura/criação: agenda.edit; update/delete: bloqueado
```

---

### 📦 Novos Arquivos

| Arquivo | Descrição |
|---|---|
| `core/models/event.model.ts` | `AgendaEvent`, `ImportLog`, `AgendaEventPayload`, `EVENT_COLORS` |
| `core/models/scoring.model.ts` | `ScoringItem`, `ScoringItemPayload` |
| `core/repositories/event.repository.ts` | `IEventRepository` (contrato) |
| `core/repositories/scoring.repository.ts` | `IScoringRepository` (contrato) |
| `core/services/event.service.ts` | Use-cases da agenda (CRUD, import, export, birthdays) |
| `core/services/scoring.service.ts` | Use-cases de pontuações padrão |
| `core/services/ics.service.ts` | Parse e geração de arquivos `.ics` (RFC 5545, sem deps externas) |
| `infrastructure/firebase/firebase-event.repository.ts` | Implementação Firestore da agenda |
| `infrastructure/firebase/firebase-scoring.repository.ts` | Implementação Firestore das pontuações |
| `features/agenda/agenda.component.ts` | Tela de agenda com FullCalendar |
| `features/agenda/agenda.component.scss` | Estilos do calendário (override do FullCalendar) |
| `features/scoring/scoring.component.ts` | CRUD de pontuações padrão |
| `features/scoring/scoring.component.scss` | Cards com borda colorida por tipo |
| `shared/components/scoring-legend/scoring-legend.component.ts` | Modal reutilizável |
| `shared/components/scoring-legend/scoring-legend.component.scss` | Estilos do modal |

---

## [1.0.0-beta.1] — 2025

> Versão inicial de produção do sistema **ClubLink** em Angular 19.
> Contém todas as funcionalidades base da plataforma.

### ✨ Adicionado

#### 🔐 Autenticação
- Login com e-mail/senha e Google (`signInWithPopup`)
- Recuperação de senha por e-mail (`sendPasswordResetEmail`)
- Vinculação de conta Google no Perfil
- Alteração de senha com reautenticação
- Guards: `authGuard`, `roleGuard`, `permissionGuard`

#### 👥 Membros
- Cadastro, listagem, edição e remoção de desbravadores e diretoria
- Foto (base64), nome, unidade, cargo, e-mail, senha, pontos iniciais
- Campo `birth` para data de nascimento

#### 🔑 Sistema de Permissões (RBAC)
- Roles: `desbravador`, `diretoria`, `diretoria + isAdmin`
- 9 permissões granulares por feature
- `PermissionService`, `permissionGuard`, `PermissionEditorComponent`

#### 🏔 Ranking — Monte Everest
- SVG Angular nativo com fotos circulares (`<image>` + `<clipPath>`)
- Posicionamento proporcional à pontuação

#### ✏️ Apontamentos
- Abas: Adicionar, Subtrair, Redefinir
- Histórico na sub-collection `users/{uid}/history`

#### 👤 Perfil
- Card de identidade, vinculação Google, alteração de senha

#### ⚙️ Console (Admin)
- Status da aplicação (produção / manutenção / offline) com tela de bloqueio
- Exportação/importação da base em JSON proprietário com validação estrita
- Rota `/admin-override` para restaurar status sem acesso ao Firebase Console

#### 🦶 Footer
- `FooterComponent` reutilizável com redes sociais, suporte, GitHub e versão

#### 🤖 CI/CD
- Pipeline GitHub Actions disparada por tag anotada
- Jobs: segurança (`npm audit`), release (notas do CHANGELOG), deploy (GitHub Pages)

---

## Histórico de Versões

| Versão | Data | Destaque |
|---|---|---|
| **1.0.0-beta.2** | 2025 | Agenda, Pontuações padrão, Apontamento por grupo |
| **1.0.0-beta.1** | 2025 | Versão base Angular 19 + Firebase |

---

[1.0.0-beta.2]: https://camply-labs.github.io/clublink-app/releases/tag/v1.0.0-beta.2
[1.0.0-beta.1]: https://camply-labs.github.io/clublink-app/releases/tag/v1.0.0-beta.1
