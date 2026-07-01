# TaskDoc — Project Specification (AI-Ready)

> **Purpose of this document**: Provide a complete, self-contained technical specification of the TaskDoc project so that *any* AI coding assistant can understand the full system context, architecture, constraints, data models, APIs, UI structure, business logic, and extension points — without needing to read every source file.
>
> **Last updated**: 2026-07-01 — Version 2.0.0

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack & Constraints](#3-technology-stack--constraints)
4. [File Structure](#4-file-structure)
5. [Data Model (Google Sheets as Database)](#5-data-model-google-sheets-as-database)
6. [Backend API Surface (Code.gs)](#6-backend-api-surface-codegs)
7. [Frontend Architecture](#7-frontend-architecture)
8. [UI Views & Screens](#8-ui-views--screens)
9. [Business Rules & Validation](#9-business-rules--validation)
10. [Integrations](#10-integrations)
11. [Design System & Styling](#11-design-system--styling)
12. [Deployment & Configuration](#12-deployment--configuration)
13. [Known Limitations & Technical Debt](#13-known-limitations--technical-debt)
14. [Future Features Roadmap](#14-future-features-roadmap)
15. [Glossary](#15-glossary)

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Name** | TaskDoc (Quản lý Văn bản & Công việc) |
| **Type** | Single-Page Web Application |
| **Platform** | Google Apps Script (GAS) Web App |
| **Database** | Google Sheets (no external DB) |
| **Authentication** | Google Account (GAS built-in, no custom auth) |
| **Language** | Vietnamese UI, English codebase |
| **Version** | 2.0.0 |
| **Users** | Government/corporate managers tracking document-based tasks |

### Problem Statement

Managers receive official documents (văn bản) from superiors or other departments. Each document spawns multiple sub-tasks assigned to team members. Current tracking via Excel/iWork is inefficient: hard to track progress, easy to miss deadlines, no automated reminders, difficult to generate reports.

### Solution

A zero-infrastructure web app running entirely on Google's ecosystem (Apps Script + Sheets + Gmail + Calendar) that provides:
- Full CRUD for documents, sub-tasks, and employees
- Automatic progress calculation
- Daily email reminders for overdue/upcoming deadlines
- Google Calendar integration for push notifications
- Excel export capability
- Calendar view for visual task planning

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │Index.html│  │ Styles.html  │  │  JavaScript.html │   │
│  │(Layout)  │  │(CSS)         │  │  (Client Logic)  │   │
│  └──────────┘  └──────────────┘  └──────────────────┘   │
│         │               │                │               │
│         └───────────────┼────────────────┘               │
│                         │                                │
│              google.script.run.*()                        │
│            (Async RPC, Promise-based)                    │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS (GAS Web App)
┌─────────────────────────┴───────────────────────────────┐
│                   SERVER (Code.gs)                        │
│                Google Apps Script Runtime                 │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  CRUD    │  │  Triggers &  │  │   Calendar &     │   │
│  │Functions │  │  Reminders   │  │   Email Service  │   │
│  └─────┬────┘  └──────┬───────┘  └────────┬─────────┘   │
│        │              │                    │              │
│        └──────────────┼────────────────────┘              │
│                       │                                   │
│            SpreadsheetApp / MailApp /                     │
│            CalendarApp / ScriptApp                        │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────┴──────────────────────────────────┐
│              GOOGLE SHEETS (Database)                     │
│  ┌───────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐  │
│  │ Documents │ │ SubTasks │ │ Employees │ │ Settings │  │
│  └───────────┘ └──────────┘ └───────────┘ └──────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

1. **Single-Page Application (SPA)**: All views rendered in one HTML page; navigation via sidebar toggles CSS `display` on `<section>` elements.
2. **Server-Client RPC**: Frontend calls backend via `google.script.run.functionName()` — asynchronous, Promise-wrapped.
3. **Bulk Data Fetch**: `getInitialData()` returns ALL data (documents, subtasks, employees, settings) in one call. Client caches data in memory. Every mutation (add/update/delete) returns refreshed full dataset.
4. **Optimistic UI**: Client updates DOM immediately, then syncs with server.
5. **Spreadsheet as Relational DB**: Sheets act as tables; rows are records; first row is header (column names). Relationships via foreign keys (e.g., `SubTasks.Document ID` → `Documents.ID`).

---

## 3. Technology Stack & Constraints

| Layer | Technology | Notes |
|---|---|---|
| Server Runtime | Google Apps Script (V8) | No Node.js, no npm, no modules |
| Database | Google Sheets | Max ~10M cells per spreadsheet |
| Frontend | Vanilla HTML + CSS + JS | No framework (React/Vue/etc.) |
| Icons | Material Icons (Google Fonts CDN) | `material-icons` class |
| Fonts | Inter (body) + Crimson Pro (headings) | Google Fonts |
| Excel Export | xlsx-js-style v1.2.0 (CDN) | Client-side XLSX generation |
| Email | GAS `MailApp.sendEmail()` | Daily quota: 100 emails/day |
| Calendar | GAS `CalendarApp` | Manager's default calendar |
| Triggers | GAS `ScriptApp.newTrigger()` | Time-based, daily |

### Hard Constraints

- **No npm / no bundler**: All code must be plain GAS-compatible JavaScript (ES6 features via V8 engine).
- **No external server**: Everything runs inside Google's infrastructure.
- **6-minute execution limit**: Each GAS function must complete within 6 minutes.
- **HTML Service limitations**: No `<script src="local.js">` — all JS/CSS must be inlined via `<?!= include('filename'); ?>` template tags.
- **No client-side routing**: Views are toggled by showing/hiding `<section>` elements.
- **Synchronous Sheets API**: All SpreadsheetApp calls are synchronous server-side.

---

## 4. File Structure

```
d:\app-script\
├── .context\                    # Project documentation (NOT deployed)
│   ├── README.md                # Deployment guide (Vietnamese)
│   ├── Context.md               # Original feature spec (Vietnamese)
│   ├── ImplementPlan.md         # Calendar integration plan
│   ├── CalendarGuide.md         # Calendar feature guide
│   └── SPEC.md                  # THIS FILE — comprehensive spec
│
├── Code.gs                      # Server-side: all backend logic (~930 lines)
│   ├── doGet()                  #   Web app entry point
│   ├── initDatabase()           #   Auto-creates sheets & headers
│   ├── getInitialData()         #   Bulk data fetch
│   ├── CRUD functions           #   add/update/delete for Documents, SubTasks, Employees
│   ├── recalculateDocProgress() #   Auto-compute progress % & status
│   ├── syncToCalendar()         #   Google Calendar CRUD
│   ├── saveSettings()           #   Persist settings & manage triggers
│   ├── sendDailyReminders()     #   Cron-triggered email function
│   └── buildHtmlEmail()         #   Email template builder
│
├── Index.html                   # Main HTML layout (~781 lines)
│   ├── Sidebar navigation
│   ├── Dashboard view
│   ├── Documents view (table + filters)
│   ├── Calendar view (month/week grid)
│   ├── Progress tracking view (employee workload cards)
│   ├── Employees view (CRUD table)
│   ├── Settings view
│   └── Modal dialogs (document form, detail, employee form, calendar task)
│
├── Styles.html                  # All CSS (~42KB, wrapped in <style> tags)
│   ├── CSS Custom Properties (design tokens)
│   ├── Light & Dark mode themes
│   ├── Layout (sidebar, main content, grid)
│   ├── Components (cards, tables, badges, modals, forms, calendar)
│   └── Animations & transitions
│
├── JavaScript.html              # All client-side JS (~75KB, wrapped in <script> tags)
│   ├── State management (appData object)
│   ├── Navigation & view switching
│   ├── DOM rendering functions
│   ├── CRUD form handlers
│   ├── Filter & search logic
│   ├── Calendar rendering engine
│   ├── Excel export (XLSX)
│   ├── Dark mode toggle
│   └── Event listeners
│
└── Context.md                   # Duplicate of .context/Context.md (root level)
```

---

## 5. Data Model (Google Sheets as Database)

### 5.1 Sheet: `Documents`

| Column Index | Header | Type | Description | Example |
|---|---|---|---|---|
| 1 | `ID` | String | Auto-generated: `DOC-{timestamp}{random}` | `DOC-171975283542` |
| 2 | `Receive Date` | Date/String | Date document was received (YYYY-MM-DD) | `2026-06-15` |
| 3 | `Document Number` | String | Official document code/number | `12/BC-VP` |
| 4 | `Document Name` | String | Title of the document | `Báo cáo tháng 6` |
| 5 | `Description` | String | Detailed instructions/content | Free text |
| 6 | `Deadline` | Date/String | Due date (YYYY-MM-DD or YYYY-MM-DD HH:mm) | `2026-07-15 17:00` |
| 7 | `Progress` | String | Auto-calculated: `X%` format | `60%` |
| 8 | `Status` | String (enum) | Auto-calculated from subtasks | See below |

**Document Status Values** (auto-computed by `recalculateDocProgress()`):

| Status | Vietnamese | Condition |
|---|---|---|
| `Mới tạo` | Newly created | No subtasks exist |
| `Đã phân công` | Assigned | Subtasks exist, none started or completed |
| `Đang xử lý` | In progress | At least one subtask is Doing or Done (but not all Done) |
| `Hoàn thành` | Completed | All subtasks are Done |
| `Quá hạn` | Overdue | Any non-Done subtask has passed its deadline |

### 5.2 Sheet: `SubTasks`

| Column Index | Header | Type | Description | Example |
|---|---|---|---|---|
| 1 | `ID` | String | Auto-generated: `TSK-{timestamp}{random}` | `TSK-171975290015` |
| 2 | `Document ID` | String (FK) | References `Documents.ID` | `DOC-171975283542` |
| 3 | `Title` | String | Task description | `Soạn thảo tờ trình` |
| 4 | `Assignee` | String | Employee name (denormalized) | `Nguyễn Văn A` |
| 5 | `Deadline` | Date/String | Task due date | `2026-07-10` |
| 6 | `Status` | String (enum) | Task status | `Todo` / `Doing` / `Done` |
| 7 | `Event ID` | String | Google Calendar event ID (nullable) | `abc123@google.com` |

**SubTask Status Values**:

| Status | Description |
|---|---|
| `Todo` | Not started |
| `Doing` | In progress |
| `Done` | Completed |

### 5.3 Sheet: `Employees`

| Column Index | Header | Type | Description | Example |
|---|---|---|---|---|
| 1 | `ID` | String | Auto-generated: `EMP-{timestamp}` | `EMP-1719752900` |
| 2 | `Name` | String | Full name | `Nguyễn Văn A` |
| 3 | `Department` | String | Department name | `Phòng Kỹ thuật` |

### 5.4 Sheet: `Settings`

Key-value store structure:

| Key | Type | Default | Description |
|---|---|---|---|
| `reminderTime` | String (HH:mm) | `08:00` | Daily email send time |
| `warningDays` | Number | `3` | Days before deadline to start warning |
| `emailEnabled` | Boolean | `true` | Enable daily email reminders |
| `popupEnabled` | Boolean | `true` | (Reserved, not fully implemented) |
| `calendarEnabled` | Boolean | `false` | Enable Google Calendar sync |
| `calendarReminderMinutes` | Number | `60` | Calendar event reminder lead time (minutes) |
| `emailRecipient` | String (email) | (empty) | Custom email recipient; falls back to script owner |

### 5.5 Entity Relationship Diagram

```
┌──────────────┐       1:N        ┌──────────────┐
│  Documents   │─────────────────▶│   SubTasks   │
│              │                  │              │
│ ID (PK)      │                  │ ID (PK)      │
│ Receive Date │                  │ Document ID  │──FK──▶ Documents.ID
│ Doc Number   │                  │ Title        │
│ Doc Name     │                  │ Assignee     │──(denormalized name)
│ Description  │                  │ Deadline     │
│ Deadline     │                  │ Status       │
│ Progress     │◀─── computed ────│ Event ID     │
│ Status       │◀─── computed ────│              │
└──────────────┘                  └──────────────┘

┌──────────────┐                  ┌──────────────┐
│  Employees   │                  │   Settings   │
│              │                  │              │
│ ID (PK)      │                  │ Key (PK)     │
│ Name         │                  │ Value        │
│ Department   │                  │              │
└──────────────┘                  └──────────────┘
```

> **Important**: `SubTasks.Assignee` stores the employee **name** (String), NOT `Employees.ID`. This is a denormalized design — renaming an employee does NOT auto-update existing subtask assignments.

---

## 6. Backend API Surface (Code.gs)

All functions below are callable from the client via `google.script.run.functionName(args)`.

### 6.1 Entry Points

| Function | Params | Returns | Description |
|---|---|---|---|
| `doGet(e)` | `e`: event object | `HtmlOutput` | Web app entry point. Handles cron webhook (`?action=cron&token=...`) or serves the SPA |
| `include(filename)` | `filename`: String | HTML string | Template include utility for CSS/JS files |

### 6.2 Data Retrieval

| Function | Params | Returns | Description |
|---|---|---|---|
| `getInitialData(ss?)` | optional spreadsheet | `{documents, subTasks, employees, settings}` | Bulk fetch ALL data in one call |
| `getDocumentsList(ss)` | spreadsheet | `Array<Object>` | All documents as JSON array |
| `getSubTasksList(ss)` | spreadsheet | `Array<Object>` | All subtasks as JSON array |
| `getEmployeesList(ss)` | spreadsheet | `Array<Object>` | All employees as JSON array |
| `getSettingsData(ss)` | spreadsheet | `Object` | Settings as key-value object |

### 6.3 Document CRUD

| Function | Params | Returns | Description |
|---|---|---|---|
| `addDocument(doc)` | `{receiveDate, docNumber, docName, description, deadline}` | `InitialData` | Creates document, returns refreshed data |
| `updateDocument(doc)` | `{id, receiveDate, docNumber, docName, description, deadline}` | `InitialData` | Updates document fields (not Progress/Status) |
| `deleteDocument(docId)` | `docId`: String | `InitialData` | Deletes document AND all associated subtasks + calendar events |

### 6.4 SubTask CRUD

| Function | Params | Returns | Description |
|---|---|---|---|
| `addSubTask(task)` | `{docId, title, assignee, deadline}` | `InitialData` | Creates subtask with status "Todo", syncs to calendar |
| `updateSubTask(task)` | `{id, docId, title, assignee, deadline, status}` | `InitialData` | Updates subtask fields, syncs to calendar |
| `deleteSubTask(taskId, docId)` | `taskId, docId`: Strings | `InitialData` | Deletes subtask, removes calendar event |
| `toggleSubTaskStatus(taskId, docId, status)` | Strings | `InitialData` | Quick-toggle status (typically Todo↔Done), updates calendar color |

### 6.5 Employee CRUD

| Function | Params | Returns | Description |
|---|---|---|---|
| `addEmployee(emp)` | `{name, department}` | `InitialData` | Creates employee |
| `updateEmployee(emp)` | `{id, name, department}` | `InitialData` | Updates employee |
| `deleteEmployee(empId)` | `empId`: String | `InitialData` | Deletes employee (does NOT cascade to subtask assignments) |

### 6.6 Settings & Triggers

| Function | Params | Returns | Description |
|---|---|---|---|
| `saveSettings(settings)` | Object with all key-value pairs | `InitialData` | Saves all settings, re-creates time trigger |
| `setupTrigger(timeStr, emailEnabled)` | String, Boolean | void | Internal: manages GAS time-driven triggers |

### 6.7 Email & Reminders

| Function | Params | Returns | Description |
|---|---|---|---|
| `sendDailyReminders()` | (none) | void | Triggered by cron/timer: sends email with overdue/today/upcoming tasks |
| `testEmail()` | (none) | String (success/error message) | Sends a test email with mock data |
| `buildHtmlEmail(overdue, today, warning)` | Arrays of task objects | HTML string | Builds formatted email body |

### 6.8 Calendar Sync

| Function | Params | Returns | Description |
|---|---|---|---|
| `syncToCalendar(action, taskData, oldEventId)` | action: `'CREATE'/'UPDATE'/'DELETE'/'COMPLETE'/'INCOMPLETE'`, taskData: Object, oldEventId: String | eventId or null | Manages Google Calendar events for subtasks |

### 6.9 Cron Webhook

**URL Pattern**: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action=cron&token=mbf_taskdoc_secret_token_123`

- Method: GET
- Auth: Token-based (hardcoded token in `Code.gs`)
- Response: JSON `{status: 'success'|'error', message: '...'}`

---

## 7. Frontend Architecture

### 7.1 State Management

```javascript
// Global state object (in-memory, re-fetched on each mutation)
var appData = {
  documents: [],   // Array of document objects
  subTasks: [],    // Array of subtask objects
  employees: [],   // Array of employee objects
  settings: {}     // Key-value settings object
};
```

### 7.2 Client-Server Communication Pattern

```javascript
// Typical pattern for all CRUD operations:
google.script.run
  .withSuccessHandler(function(result) {
    appData = result;  // Replace entire state with fresh data
    renderAll();       // Re-render all views
  })
  .withFailureHandler(function(err) {
    showToast('Error: ' + err.message, 'error');
  })
  .backendFunction(params);
```

### 7.3 Navigation System

- Sidebar `<li>` elements with `data-target` attribute pointing to `<section>` IDs
- Click handler: hides all `.section-view`, shows target section, updates `active` class
- No URL routing — purely DOM-based view switching

### 7.4 Key Rendering Functions

| Function | Description |
|---|---|
| `renderAll()` | Master render: calls all individual renderers |
| `renderDashboard()` | Updates stat cards + overdue/urgent task lists |
| `renderDocuments()` | Populates documents table with filters applied |
| `renderEmployees()` | Populates employees table |
| `renderProgressView()` | Generates employee workload cards with task grouping |
| `renderCalendar()` | Renders month/week calendar grid with task dots |
| `renderSettings()` | Populates settings form with current values |
| `renderDocumentDetail(docId)` | Populates detail modal with subtask list |

---

## 8. UI Views & Screens

### 8.1 Dashboard (`#dashboard-view`)

- **4 stat cards**: Total docs, In Progress, Completed, Overdue
- **Overdue tasks list**: Tasks past deadline, sorted by urgency
- **Upcoming tasks list**: Due today or within warning period

### 8.2 Documents (`#documents-view`)

- **Action buttons**: "Export Excel" + "Add Document"
- **Filter bar (2 rows)**:
  - Row 1: Search (text), Status (dropdown), Employee (dropdown)
  - Row 2: Receive Date range, Deadline range, Clear filters button
- **Data table**: Columns = Doc Number | Name | Receive Date | Deadline | Progress (bar) | Status (badge) | Actions (view/edit/delete icons)
- **Active filter indicator bar**: Shows count of active filters + result count

### 8.3 Calendar (`#calendar-view`)

- **View mode toggle**: Week / Month
- **Navigation**: Previous/Next buttons + "Today" button
- **Month label**: Current month/year display
- **Grid**: 7-column (Sun-Sat) calendar with task dots per day
- **Click behavior**: Clicking a task dot opens Calendar Task Modal

### 8.4 Progress Tracking (`#progress-view`)

- **Summary stats chips**: Per-employee task counts
- **Filter bar**: Employee dropdown, Status dropdown, Deadline date range
- **Workload grid**: Card per employee showing:
  - Employee name + department
  - List of assigned subtasks grouped by parent document
  - Each subtask: title, deadline, status badge
  - Overall completion percentage per employee

### 8.5 Employees (`#employees-view`)

- **Action button**: "Add Employee"
- **Data table**: Columns = Employee ID | Name | Department | Actions (edit/delete)

### 8.6 Settings (`#settings-view`)

- **Email reminder config**:
  - Checkbox: Enable daily email
  - Checkbox: Enable Google Calendar sync
  - Dropdown: Calendar reminder lead time
  - Input: Custom email recipient
  - Input: Send time (HH:mm)
  - Input: Warning days before deadline
  - Buttons: Save + Send Test Email
- **App info card**: Version, tech stack info

### 8.7 Modals

| Modal ID | Purpose | Trigger |
|---|---|---|
| `document-modal` | Add/Edit document form | "Add" button or edit icon |
| `document-detail-modal` | View document + manage subtasks | Detail/view icon on document row |
| `employee-modal` | Add/Edit employee form | "Add" button or edit icon |
| `calendar-task-modal` | View task detail from calendar | Click task dot in calendar view |

---

## 9. Business Rules & Validation

### 9.1 Deadline Validation (Cascading)

```
Rule: SubTask.Deadline ≤ Document.Deadline (parent)

- When ADDING a subtask: backend validates subtask deadline ≤ parent doc deadline
- When UPDATING a subtask: same validation
- When UPDATING a document deadline to an earlier date: backend validates
  it is not earlier than any existing subtask deadline
- Violation throws: "Hạn chót công việc con không được vượt quá hạn chót của văn bản cha!"
- Violation throws: "Hạn chót văn bản không được sớm hơn hạn chót của các công việc con hiện có!"
```

### 9.2 Progress Auto-Calculation

```
Progress = (Done SubTasks / Total SubTasks) × 100%
- Stored as string with "%" suffix in Documents sheet
- Recalculated on every subtask add/update/delete/toggle
```

### 9.3 Status Auto-Determination (Documents)

Priority order (highest to lowest):
1. **Quá hạn** (Overdue): Any non-Done subtask has passed deadline → overrides everything
2. **Hoàn thành** (Completed): All subtasks are Done
3. **Đang xử lý** (In Progress): At least one subtask is Done or Doing
4. **Đã phân công** (Assigned): Subtasks exist but all are Todo
5. **Mới tạo** (New): No subtasks exist

### 9.4 Delete Cascading

- Deleting a **Document**: deletes all associated SubTasks AND their Calendar events
- Deleting an **Employee**: does NOT update existing SubTask assignments (orphaned assignee names remain)
- Deleting a **SubTask**: removes its Calendar event, recalculates parent doc progress

### 9.5 ID Generation

```javascript
// Documents
'DOC-' + Date.now() + Math.floor(Math.random() * 100)

// SubTasks
'TSK-' + Date.now() + Math.floor(Math.random() * 100)

// Employees
'EMP-' + Date.now()
```

> **Warning**: This approach can produce collisions if two records are created within the same millisecond. For scale, consider UUID v4 or sequential counters.

---

## 10. Integrations

### 10.1 Google Calendar Sync

**Trigger**: Enabled via `calendarEnabled` setting.

| SubTask Action | Calendar Action | Details |
|---|---|---|
| Create subtask | `CREATE` event | All-day event on deadline date; Title: `{task title}_{assignee} [{doc name}]` |
| Update subtask | `UPDATE` event | Updates title, date; re-creates if event not found |
| Delete subtask | `DELETE` event | Removes event from calendar |
| Mark as Done | `COMPLETE` event | Sets color to PALE_GREEN, prepends ✅ to title |
| Mark as undone | `INCOMPLETE` event | Resets color, removes ✅ prefix |

- Calendar events are created on the **manager's default calendar**
- If `emailRecipient` is set and differs from script owner, that email is added as a guest
- Event IDs are stored in `SubTasks.Event ID` column for later lookup
- All calendar operations are wrapped in try-catch — failures are logged but don't block the main operation

### 10.2 Gmail Email Reminders

**Trigger**: Daily time-driven GAS trigger at configured hour.

**Email Content Categories**:
1. 🚨 **Overdue** (Quá hạn): Subtasks past deadline
2. ⏳ **Due Today** (Hôm nay): Subtasks due today
3. 📅 **Upcoming** (Sắp đến hạn): Subtasks due within `warningDays`

**Email Format**: HTML table with task name, assignee, parent document, deadline — styled with inline CSS for email client compatibility.

### 10.3 External Cron Webhook

URL: `GET /exec?action=cron&token=mbf_taskdoc_secret_token_123`

Purpose: Allow external cron services (e.g., cron-job.org) to trigger `sendDailyReminders()` as a backup to GAS time-driven triggers (which can be unreliable).

### 10.4 Excel Export

Client-side export using `xlsx-js-style` library:
- Exports current (filtered) document data as `.xlsx` file
- Includes formatted headers, column widths, and styling
- No server-side processing needed

---

## 11. Design System & Styling

### 11.1 Design Philosophy

- **Warm neutral palette**: Cream/beige backgrounds, earth-tone accents
- **Clean typography**: Serif headings (Crimson Pro), sans-serif body (Inter)
- **Minimal sidebar**: Collapsed icons on mobile, expanded with text on desktop
- **Soft cards**: Subtle borders, no harsh shadows
- **Optimistic UI**: Instant visual feedback before server confirmation

### 11.2 Color Palette

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--bg-main` | `#faf9f6` (warm cream) | `#1a1814` (warm dark brown) | Page background |
| `--primary` | `#d97757` (warm terracotta) | `#d97757` | Primary accent, buttons, links |
| `--primary-hover` | `#c4603f` | `#e8926e` | Button hover states |
| `--bg-card` | `#ffffff` | `#242019` | Card backgrounds |
| `--text-main` | `#1a1814` | `#e8e4df` | Primary text |
| `--text-muted` | `#6b6560` | `#a39e97` | Secondary text |
| `--border-color` | `#e8e4df` | `#3d3730` | Borders, dividers |

### 11.3 Status Badge Colors

| Status | CSS Class | Color Scheme |
|---|---|---|
| Mới tạo | `badge-new` | Blue |
| Đã phân công | `badge-assigned` | Purple |
| Đang xử lý | `badge-doing` | Amber/Yellow |
| Hoàn thành | `badge-done` | Green |
| Quá hạn | `badge-overdue` | Red |
| Todo | `badge-todo` | Gray |
| Doing | `badge-doing` | Amber |
| Done | `badge-done` | Green |

### 11.4 Responsive Breakpoints

- **Desktop** (>1024px): Full sidebar + spacious content area
- **Tablet** (768–1024px): Collapsed sidebar (icon-only)
- **Mobile** (<768px): Hidden sidebar with hamburger toggle, stacked layouts

---

## 12. Deployment & Configuration

### 12.1 Deployment Steps

1. Create a Google Spreadsheet (database will auto-initialize)
2. Open Apps Script editor (Extensions → Apps Script)
3. Create 4 files: `Code.gs`, `Index.html`, `Styles.html`, `JavaScript.html`
4. If standalone script: set `SPREADSHEET_ID` in `Code.gs` line 68
5. Deploy as Web App:
   - Execute as: `Me` (script owner's permissions)
   - Who has access: `Anyone` (for cross-device access)
6. Authorize Google permissions (Sheets, Gmail, Calendar)
7. Configure settings in the web app's Settings tab

### 12.2 Required Google Permissions

- `https://www.googleapis.com/auth/spreadsheets` — Read/write Google Sheets
- `https://www.googleapis.com/auth/gmail.send` — Send emails via Gmail
- `https://www.googleapis.com/auth/calendar` — Create/update/delete Calendar events
- `https://www.googleapis.com/auth/script.scriptapp` — Manage triggers

### 12.3 Environment Variables

| Variable | Location | Description |
|---|---|---|
| `SPREADSHEET_ID` | `Code.gs` line 68 | Google Sheets ID (only for standalone scripts) |
| `EXPECTED_TOKEN` | `Code.gs` line 15 | Webhook auth token (`mbf_taskdoc_secret_token_123`) |

---

## 13. Known Limitations & Technical Debt

### Performance

- **Full data refresh on every mutation**: Each CRUD operation re-reads all sheets and returns the complete dataset. This works for small teams (<100 docs, <500 tasks) but will degrade with scale.
- **No pagination**: All documents/tasks loaded at once into the client.
- **No caching strategy**: Spreadsheet reads on every server function call (except within same execution via `cachedSpreadsheet`).

### Data Integrity

- **Denormalized assignee names**: SubTasks store employee names, not IDs. Renaming an employee orphans existing assignments.
- **No unique constraints**: Duplicate document numbers possible.
- **ID collision risk**: Timestamp-based IDs can theoretically collide under concurrent writes.
- **No row locking**: Concurrent edits to the same spreadsheet can cause data corruption.

### Architecture

- **Monolithic Code.gs**: All server logic in one ~930-line file. Should be split into modules for maintainability.
- **No error boundaries on client**: Some error paths may silently fail.
- **No unit tests**: Zero test coverage.
- **Hardcoded cron token**: Security weakness for the webhook endpoint.
- **No i18n framework**: All UI strings are hardcoded in Vietnamese.

### UI

- **No offline support**: Requires constant internet connection.
- **No undo/redo**: Destructive operations (delete) are immediate.
- **Calendar view**: Client-rendered only (no interaction for creating tasks from calendar).

---

## 14. Future Features Roadmap

| Priority | Feature | Description |
|---|---|---|
| High | Calendar View Interactions | Click-to-create tasks from calendar cells |
| High | Duplicate Document | Clone a document with its subtask structure |
| High | Template SubTasks | Predefined subtask templates for common document types |
| Medium | File Upload / Attachments | Attach files to documents (via Google Drive) |
| Medium | Comments / Activity Timeline | Comment thread on documents/subtasks |
| Medium | Monthly Dashboard | Dashboard filtered by month |
| Medium | Per-Employee Dashboard | Dashboard view focused on individual employee |
| Low | AI: Auto-generate SubTasks | Parse document description and suggest subtasks |
| Low | AI: Summarize Documents | Auto-summarize long document descriptions |
| Low | AI: Suggest Deadlines | Estimate deadlines based on historical data |
| Low | Google Chat Notification | Send reminders via Google Chat |
| Low | Telegram Notification | Send reminders via Telegram bot |

---

## 15. Glossary

| Term (Vietnamese) | Term (English) | Definition |
|---|---|---|
| Văn bản | Document | An official document received from superiors that spawns work tasks |
| Công việc con / Sub Task | SubTask | A specific task derived from a document, assigned to one employee |
| Nhân viên / Nhân sự | Employee | A team member who can be assigned subtasks |
| Hạn chót | Deadline | Due date for a document or subtask |
| Tiến độ | Progress | Completion percentage of a document (based on subtask completion) |
| Trạng thái | Status | Current state of a document or subtask |
| Mới tạo | Newly Created | Initial state of a document with no subtasks |
| Đã phân công | Assigned | Document has subtasks but none have started |
| Đang xử lý | In Progress | Document has subtasks that are being worked on |
| Hoàn thành | Completed | All subtasks of a document are done |
| Quá hạn | Overdue | One or more non-completed subtasks have passed their deadline |
| Phòng ban | Department | Organizational unit an employee belongs to |
| Nhắc nhở | Reminder | Automated notification about upcoming/overdue tasks |
| Cài đặt | Settings | System configuration (email, calendar, reminder preferences) |
| Lịch công việc | Task Calendar | Calendar view showing subtask deadlines |
| Theo dõi tiến độ | Progress Tracking | View showing workload distribution per employee |
| Xuất Excel | Export Excel | Download document data as XLSX file |
