# TaskDoc — AI Context Instructions

> **Read this file FIRST** before working on any code in this project.
> Then read [SPEC.md](file:///d:/app-script/.context/SPEC.md) for the full technical specification.

---

## What is this project?

**TaskDoc** is a single-page web application built entirely on **Google Apps Script** (GAS). It helps Vietnamese government/corporate managers track official documents and the sub-tasks those documents generate. There is **no external server** — Google Sheets is the database, Gmail sends reminders, and Google Calendar provides push notifications.

## Critical Rules for AI Agents

### 1. Platform Constraints — DO NOT VIOLATE

- ❌ **No npm, no Node.js modules, no `import`/`require`/`export`**. GAS uses V8 but has no module system.
- ❌ **No `<script src="local.js">`** in HTML files. Use `<?!= include('Filename'); ?>` for template inclusion.
- ❌ **No async/await in Code.gs** server functions. GAS server-side is synchronous.
- ❌ **No external APIs** without explicit user permission. All services must go through GAS built-in classes (`SpreadsheetApp`, `MailApp`, `CalendarApp`, `UrlFetchApp`).
- ✅ **Client-side JS** (in `JavaScript.html`) CAN use async/await, Promises, modern ES6+ syntax.
- ✅ **CDN scripts** are allowed in `Index.html` `<head>`.

### 2. File Roles — Where to put code

| File | Role | Language |
|---|---|---|
| `Code.gs` | ALL server-side logic (backend) | GAS JavaScript (V8) |
| `Index.html` | ALL HTML structure (layout, views, modals) | HTML with `<?!= ?>` template tags |
| `Styles.html` | ALL CSS (wrapped in `<style>` tags) | CSS only |
| `JavaScript.html` | ALL client-side logic (wrapped in `<script>` tags) | Browser JavaScript |

> **Do NOT create new `.gs` or `.html` files** unless explicitly requested. GAS projects work best with minimal file count.

### 3. Data Patterns — How data flows

```
Client calls:  google.script.run.backendFunction(params)
                    ↓
Server does:   Read/Write Google Sheets → return getInitialData()
                    ↓
Client gets:   Full refreshed {documents, subTasks, employees, settings}
                    ↓
Client does:   appData = result; renderAll();
```

**Every mutation returns the complete dataset.** Do not try to return partial data or diffs.

### 4. ID Format

- Documents: `DOC-{Date.now()}{Math.floor(Math.random()*100)}`
- SubTasks: `TSK-{Date.now()}{Math.floor(Math.random()*100)}`
- Employees: `EMP-{Date.now()}`

### 5. Language Convention

- **Code**: English (variable names, function names, comments)
- **UI strings**: Vietnamese
- **Sheet headers**: English
- **Status values**: Mixed — Documents use Vietnamese (`Mới tạo`, `Đang xử lý`, `Hoàn thành`, `Quá hạn`), SubTasks use English (`Todo`, `Doing`, `Done`)

### 6. Common Pitfalls

1. **Spreadsheet date handling**: Dates from Sheets come as `Date` objects. The `formatDateString()` helper converts them to `YYYY-MM-DD` or `YYYY-MM-DD HH:mm`. Always use `parseDateTime()` for string-to-Date conversion.
2. **SubTask assignee is a name string**, not an Employee ID. Be aware this is denormalized.
3. **Progress/Status of Documents are auto-computed** by `recalculateDocProgress()`. Never set them manually — they'll be overwritten.
4. **Calendar sync is optional** and can fail silently (all calendar calls are try-caught). Never let calendar errors block CRUD operations.
5. **GAS execution limit**: 6 minutes max. Keep operations efficient.
6. **`getRange(row, col)`**: 1-indexed in GAS Sheets API.

### 7. Testing Changes

After making changes:
1. Save all files in Apps Script editor
2. For **Code.gs** changes: test via the web app (no separate test runner)
3. For **HTML/CSS/JS** changes: you MUST create a **new deployment** or update the existing one to see changes in the deployed URL. During development, use the "Test deployments" → "Head deployment" URL.
4. Check the **Execution log** (in Apps Script editor → Executions) for server-side errors.

## File Reference

| File | Lines | Purpose |
|---|---|---|
| [Code.gs](file:///d:/app-script/Code.gs) | ~930 | Backend: CRUD, triggers, email, calendar |
| [Index.html](file:///d:/app-script/Index.html) | ~781 | HTML structure: all views & modals |
| [Styles.html](file:///d:/app-script/Styles.html) | ~1200+ | CSS: design system, themes, responsive |
| [JavaScript.html](file:///d:/app-script/JavaScript.html) | ~2000+ | Client JS: rendering, events, state management |
| [SPEC.md](file:///d:/app-script/.context/SPEC.md) | — | Full technical specification |
| [README.md](file:///d:/app-script/.context/README.md) | — | User-facing deployment guide |
