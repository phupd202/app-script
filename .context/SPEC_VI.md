# TaskDoc — Đặc Tả Kỹ Thuật Dự Án (Dành cho AI & Lập trình viên)

> **Mục đích tài liệu này**: Cung cấp đặc tả kỹ thuật đầy đủ, khép kín về dự án TaskDoc để *bất kỳ* trợ lý AI lập trình hoặc lập trình viên nào cũng có thể hiểu toàn bộ ngữ cảnh hệ thống, kiến trúc, ràng buộc, mô hình dữ liệu, API, cấu trúc giao diện, logic nghiệp vụ và các điểm mở rộng — mà không cần đọc từng file mã nguồn.
>
> **Cập nhật lần cuối**: 01/07/2026 — Phiên bản 2.0.0

---

## Mục Lục

1. [Thông tin dự án](#1-thông-tin-dự-án)
2. [Tổng quan kiến trúc](#2-tổng-quan-kiến-trúc)
3. [Công nghệ sử dụng & Ràng buộc](#3-công-nghệ-sử-dụng--ràng-buộc)
4. [Cấu trúc thư mục & File](#4-cấu-trúc-thư-mục--file)
5. [Mô hình dữ liệu (Google Sheets làm Database)](#5-mô-hình-dữ-liệu-google-sheets-làm-database)
6. [API phía Backend (Code.gs)](#6-api-phía-backend-codegs)
7. [Kiến trúc Frontend](#7-kiến-trúc-frontend)
8. [Các màn hình giao diện](#8-các-màn-hình-giao-diện)
9. [Quy tắc nghiệp vụ & Validation](#9-quy-tắc-nghiệp-vụ--validation)
10. [Tích hợp bên ngoài](#10-tích-hợp-bên-ngoài)
11. [Hệ thống thiết kế & Giao diện](#11-hệ-thống-thiết-kế--giao-diện)
12. [Triển khai & Cấu hình](#12-triển-khai--cấu-hình)
13. [Hạn chế đã biết & Nợ kỹ thuật](#13-hạn-chế-đã-biết--nợ-kỹ-thuật)
14. [Lộ trình tính năng tương lai](#14-lộ-trình-tính-năng-tương-lai)
15. [Bảng thuật ngữ](#15-bảng-thuật-ngữ)

---

## 1. Thông tin dự án

| Trường | Giá trị |
|---|---|
| **Tên** | TaskDoc (Quản lý Văn bản & Công việc) |
| **Loại** | Ứng dụng web đơn trang (SPA) |
| **Nền tảng** | Google Apps Script (GAS) Web App |
| **Cơ sở dữ liệu** | Google Sheets (không có CSDL bên ngoài) |
| **Xác thực** | Tài khoản Google (tích hợp sẵn trong GAS, không có auth tùy chỉnh) |
| **Ngôn ngữ giao diện** | Tiếng Việt |
| **Phiên bản** | 2.0.0 |
| **Đối tượng sử dụng** | Quản lý phòng ban trong cơ quan nhà nước / doanh nghiệp |

### Bài toán cần giải quyết

Người quản lý thường xuyên nhận văn bản từ cấp trên hoặc các phòng ban khác. Mỗi văn bản phát sinh nhiều công việc con cần giao cho nhân viên. Quản lý hiện tại bằng Excel/iWork gặp nhiều bất cập: khó theo dõi tiến độ, dễ quên deadline, không có nhắc nhở tự động, khó tổng hợp báo cáo.

### Giải pháp

Ứng dụng web không cần hạ tầng riêng, chạy hoàn toàn trên hệ sinh thái Google (Apps Script + Sheets + Gmail + Calendar):
- CRUD đầy đủ cho văn bản, công việc con, nhân viên
- Tự động tính tiến độ hoàn thành
- Nhắc việc hàng ngày qua email cho công việc quá hạn / sắp đến hạn
- Tích hợp Google Calendar để nhận thông báo đẩy
- Xuất Excel
- Lịch công việc dạng tháng/tuần

---

## 2. Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│               TRÌNH DUYỆT (Client)                       │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │Index.html│  │ Styles.html  │  │  JavaScript.html │   │
│  │(Bố cục)  │  │(CSS)         │  │  (Logic phía     │   │
│  │          │  │              │  │   trình duyệt)   │   │
│  └──────────┘  └──────────────┘  └──────────────────┘   │
│         │               │                │               │
│         └───────────────┼────────────────┘               │
│                         │                                │
│              google.script.run.*()                        │
│         (Gọi hàm bất đồng bộ, dạng Promise)             │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS (GAS Web App)
┌─────────────────────────┴───────────────────────────────┐
│                   MÁY CHỦ (Code.gs)                      │
│             Google Apps Script Runtime                    │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Hàm     │  │  Trigger &   │  │   Lịch Google &  │   │
│  │  CRUD    │  │  Nhắc nhở    │  │   Email Service  │   │
│  └─────┬────┘  └──────┬───────┘  └────────┬─────────┘   │
│        │              │                    │              │
│        └──────────────┼────────────────────┘              │
│                       │                                   │
│            SpreadsheetApp / MailApp /                     │
│            CalendarApp / ScriptApp                        │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────┴──────────────────────────────────┐
│            GOOGLE SHEETS (Cơ sở dữ liệu)                │
│  ┌───────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐  │
│  │ Documents │ │ SubTasks │ │ Employees │ │ Settings │  │
│  │(Văn bản) │ │(Công việc│ │(Nhân viên)│ │(Cài đặt) │  │
│  └───────────┘ └──────────┘ └───────────┘ └──────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Các mô hình kiến trúc chính

1. **Ứng dụng đơn trang (SPA)**: Tất cả các màn hình được render trong 1 file HTML duy nhất; điều hướng bằng sidebar bật/tắt thuộc tính `display` CSS trên các thẻ `<section>`.
2. **RPC Client-Server**: Frontend gọi backend qua `google.script.run.tênHàm()` — bất đồng bộ, được bọc Promise.
3. **Tải dữ liệu hàng loạt**: `getInitialData()` trả về TOÀN BỘ dữ liệu (văn bản, công việc, nhân viên, cài đặt) trong 1 lần gọi. Client lưu dữ liệu trong bộ nhớ. Mọi thao tác thay đổi (thêm/sửa/xóa) đều trả về bộ dữ liệu mới hoàn chỉnh.
4. **Optimistic UI (Giao diện lạc quan)**: Client cập nhật DOM ngay lập tức, sau đó mới đồng bộ với server.
5. **Bảng tính làm CSDL quan hệ**: Các Sheet hoạt động như bảng; các dòng là bản ghi; dòng đầu tiên là tiêu đề (tên cột). Quan hệ thông qua khóa ngoại (ví dụ: `SubTasks.Document ID` → `Documents.ID`).

---

## 3. Công nghệ sử dụng & Ràng buộc

| Tầng | Công nghệ | Ghi chú |
|---|---|---|
| Server Runtime | Google Apps Script (V8) | Không dùng Node.js, không npm, không module |
| Cơ sở dữ liệu | Google Sheets | Tối đa ~10 triệu ô mỗi bảng tính |
| Frontend | Vanilla HTML + CSS + JS | Không dùng framework (React/Vue/...) |
| Biểu tượng | Material Icons (Google Fonts CDN) | Class `material-icons` |
| Phông chữ | Inter (nội dung) + Crimson Pro (tiêu đề) | Google Fonts |
| Xuất Excel | xlsx-js-style v1.2.0 (CDN) | Tạo file XLSX phía client |
| Email | GAS `MailApp.sendEmail()` | Hạn mức: 100 email/ngày |
| Lịch | GAS `CalendarApp` | Lịch mặc định của quản lý |
| Trigger | GAS `ScriptApp.newTrigger()` | Dạng hẹn giờ, chạy hàng ngày |

### Ràng buộc cứng (KHÔNG ĐƯỢC VI PHẠM)

- **Không có npm / không bundler**: Tất cả mã phải là JavaScript thuần, tương thích GAS (hỗ trợ ES6 qua V8).
- **Không server bên ngoài**: Mọi thứ chạy trong hạ tầng Google.
- **Giới hạn thực thi 6 phút**: Mỗi hàm GAS phải hoàn thành trong 6 phút.
- **Giới hạn HTML Service**: Không thể dùng `<script src="local.js">` — tất cả JS/CSS phải được nhúng qua thẻ template `<?!= include('tênFile'); ?>`.
- **Không có routing phía client**: Các view được chuyển đổi bằng ẩn/hiện các thẻ `<section>`.
- **API Sheets đồng bộ**: Mọi lệnh gọi SpreadsheetApp đều đồng bộ phía server.

---

## 4. Cấu trúc thư mục & File

```
d:\app-script\
├── .context\                    # Tài liệu dự án (KHÔNG triển khai)
│   ├── README.md                # Hướng dẫn triển khai
│   ├── Context.md               # Đặc tả tính năng gốc
│   ├── ImplementPlan.md         # Kế hoạch tích hợp Calendar
│   ├── CalendarGuide.md         # Hướng dẫn tính năng Calendar
│   ├── SPEC.md                  # Đặc tả tiếng Anh
│   ├── SPEC_VI.md               # FILE NÀY — Đặc tả tiếng Việt
│   ├── AI_CONTEXT.md            # Hướng dẫn nhanh cho AI (tiếng Anh)
│   └── AI_CONTEXT_VI.md         # Hướng dẫn nhanh cho AI (tiếng Việt)
│
├── Code.gs                      # Phía server: toàn bộ logic backend (~930 dòng)
│   ├── doGet()                  #   Điểm vào ứng dụng web
│   ├── initDatabase()           #   Tự tạo sheet & tiêu đề
│   ├── getInitialData()         #   Tải dữ liệu hàng loạt
│   ├── Các hàm CRUD             #   thêm/sửa/xóa cho Văn bản, Công việc, Nhân viên
│   ├── recalculateDocProgress() #   Tự tính tiến độ % & trạng thái
│   ├── syncToCalendar()         #   CRUD Google Calendar
│   ├── saveSettings()           #   Lưu cài đặt & quản lý trigger
│   ├── sendDailyReminders()     #   Hàm gửi email định kỳ
│   └── buildHtmlEmail()         #   Xây dựng template email
│
├── Index.html                   # Bố cục HTML chính (~781 dòng)
│   ├── Thanh điều hướng bên (Sidebar)
│   ├── Màn hình Dashboard
│   ├── Màn hình Văn bản (bảng + bộ lọc)
│   ├── Màn hình Lịch công việc (lưới tháng/tuần)
│   ├── Màn hình Theo dõi tiến độ (thẻ khối lượng công việc nhân viên)
│   ├── Màn hình Nhân viên (bảng CRUD)
│   ├── Màn hình Cài đặt
│   └── Các hộp thoại Modal (form văn bản, chi tiết, form nhân viên, chi tiết lịch)
│
├── Styles.html                  # Toàn bộ CSS (~42KB, bọc trong thẻ <style>)
│   ├── CSS Custom Properties (biến thiết kế)
│   ├── Giao diện Sáng & Tối
│   ├── Bố cục (sidebar, nội dung chính, grid)
│   ├── Thành phần (thẻ, bảng, badge, modal, form, lịch)
│   └── Hiệu ứng động & chuyển tiếp
│
├── JavaScript.html              # Toàn bộ JS phía client (~75KB, bọc trong thẻ <script>)
│   ├── Quản lý trạng thái (đối tượng appData)
│   ├── Điều hướng & chuyển đổi view
│   ├── Các hàm render DOM
│   ├── Xử lý form CRUD
│   ├── Logic lọc & tìm kiếm
│   ├── Engine render lịch
│   ├── Xuất Excel (XLSX)
│   ├── Chuyển đổi giao diện tối
│   └── Đăng ký sự kiện (event listeners)
│
└── Context.md                   # Bản sao Context.md ở thư mục gốc
```

---

## 5. Mô hình dữ liệu (Google Sheets làm Database)

### 5.1 Bảng: `Documents` (Văn bản)

| Chỉ mục cột | Tên cột | Kiểu | Mô tả | Ví dụ |
|---|---|---|---|---|
| 1 | `ID` | Chuỗi | Tự sinh: `DOC-{timestamp}{random}` | `DOC-171975283542` |
| 2 | `Receive Date` | Ngày/Chuỗi | Ngày nhận văn bản (YYYY-MM-DD) | `2026-06-15` |
| 3 | `Document Number` | Chuỗi | Số/ký hiệu văn bản chính thức | `12/BC-VP` |
| 4 | `Document Name` | Chuỗi | Tên văn bản | `Báo cáo tháng 6` |
| 5 | `Description` | Chuỗi | Nội dung chỉ đạo chi tiết | Văn bản tự do |
| 6 | `Deadline` | Ngày/Chuỗi | Hạn chót (YYYY-MM-DD hoặc YYYY-MM-DD HH:mm) | `2026-07-15 17:00` |
| 7 | `Progress` | Chuỗi | Tự tính: định dạng `X%` | `60%` |
| 8 | `Status` | Chuỗi (enum) | Tự tính từ các công việc con | Xem bên dưới |

**Các giá trị Trạng thái Văn bản** (tự tính bởi `recalculateDocProgress()`):

| Trạng thái | Điều kiện |
|---|---|
| `Mới tạo` | Chưa có công việc con nào |
| `Đã phân công` | Có công việc con nhưng chưa bắt đầu hoặc hoàn thành |
| `Đang xử lý` | Ít nhất 1 công việc đang làm (Doing) hoặc đã xong (Done), nhưng chưa xong hết |
| `Hoàn thành` | Tất cả công việc con đều Done |
| `Quá hạn` | Có bất kỳ công việc con chưa xong nào đã qua hạn chót |

### 5.2 Bảng: `SubTasks` (Công việc con)

| Chỉ mục cột | Tên cột | Kiểu | Mô tả | Ví dụ |
|---|---|---|---|---|
| 1 | `ID` | Chuỗi | Tự sinh: `TSK-{timestamp}{random}` | `TSK-171975290015` |
| 2 | `Document ID` | Chuỗi (FK) | Tham chiếu tới `Documents.ID` | `DOC-171975283542` |
| 3 | `Title` | Chuỗi | Tên công việc | `Soạn thảo tờ trình` |
| 4 | `Assignee` | Chuỗi | Tên nhân viên (phi chuẩn hóa) | `Nguyễn Văn A` |
| 5 | `Deadline` | Ngày/Chuỗi | Hạn chót công việc | `2026-07-10` |
| 6 | `Status` | Chuỗi (enum) | Trạng thái công việc | `Todo` / `Doing` / `Done` |
| 7 | `Event ID` | Chuỗi | ID sự kiện Google Calendar (có thể null) | `abc123@google.com` |

**Các giá trị Trạng thái Công việc con**:

| Trạng thái | Mô tả |
|---|---|
| `Todo` | Chưa bắt đầu |
| `Doing` | Đang thực hiện |
| `Done` | Đã hoàn thành |

### 5.3 Bảng: `Employees` (Nhân viên)

| Chỉ mục cột | Tên cột | Kiểu | Mô tả | Ví dụ |
|---|---|---|---|---|
| 1 | `ID` | Chuỗi | Tự sinh: `EMP-{timestamp}` | `EMP-1719752900` |
| 2 | `Name` | Chuỗi | Họ và tên | `Nguyễn Văn A` |
| 3 | `Department` | Chuỗi | Tên phòng ban | `Phòng Kỹ thuật` |

### 5.4 Bảng: `Settings` (Cài đặt)

Cấu trúc lưu trữ dạng key-value:

| Key | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `reminderTime` | Chuỗi (HH:mm) | `08:00` | Giờ gửi email hàng ngày |
| `warningDays` | Số | `3` | Số ngày cảnh báo trước hạn chót |
| `emailEnabled` | Boolean | `true` | Bật nhắc nhở email hàng ngày |
| `popupEnabled` | Boolean | `true` | (Dự phòng, chưa triển khai đầy đủ) |
| `calendarEnabled` | Boolean | `false` | Bật đồng bộ Google Calendar |
| `calendarReminderMinutes` | Số | `60` | Thời gian nhắc trước của sự kiện lịch (phút) |
| `emailRecipient` | Chuỗi (email) | (trống) | Email nhận thông báo; mặc định là email chủ script |

### 5.5 Sơ đồ quan hệ thực thể (ERD)

```
┌──────────────┐       1:N        ┌──────────────┐
│  Documents   │─────────────────▶│   SubTasks   │
│  (Văn bản)   │                  │ (Công việc)  │
│              │                  │              │
│ ID (PK)      │                  │ ID (PK)      │
│ Receive Date │                  │ Document ID  │──FK──▶ Documents.ID
│ Doc Number   │                  │ Title        │
│ Doc Name     │                  │ Assignee     │──(tên, phi chuẩn hóa)
│ Description  │                  │ Deadline     │
│ Deadline     │                  │ Status       │
│ Progress     │◀── tự tính ──────│ Event ID     │
│ Status       │◀── tự tính ──────│              │
└──────────────┘                  └──────────────┘

┌──────────────┐                  ┌──────────────┐
│  Employees   │                  │   Settings   │
│ (Nhân viên)  │                  │  (Cài đặt)   │
│              │                  │              │
│ ID (PK)      │                  │ Key (PK)     │
│ Name         │                  │ Value        │
│ Department   │                  │              │
└──────────────┘                  └──────────────┘
```

> **Lưu ý quan trọng**: `SubTasks.Assignee` lưu **tên** nhân viên (dạng chuỗi), KHÔNG phải `Employees.ID`. Đây là thiết kế phi chuẩn hóa (denormalized) — đổi tên nhân viên sẽ KHÔNG tự động cập nhật các công việc đã giao trước đó.

---

## 6. API phía Backend (Code.gs)

Tất cả các hàm bên dưới đều có thể gọi từ client qua `google.script.run.tênHàm(thamSố)`.

### 6.1 Điểm vào ứng dụng

| Hàm | Tham số | Trả về | Mô tả |
|---|---|---|---|
| `doGet(e)` | `e`: đối tượng sự kiện | `HtmlOutput` | Điểm vào web app. Xử lý webhook cron (`?action=cron&token=...`) hoặc phục vụ SPA |
| `include(filename)` | `filename`: Chuỗi | Chuỗi HTML | Tiện ích nhúng template cho file CSS/JS |

### 6.2 Truy xuất dữ liệu

| Hàm | Tham số | Trả về | Mô tả |
|---|---|---|---|
| `getInitialData(ss?)` | spreadsheet (tùy chọn) | `{documents, subTasks, employees, settings}` | Tải TOÀN BỘ dữ liệu trong 1 lần gọi |
| `getDocumentsList(ss)` | spreadsheet | `Array<Object>` | Tất cả văn bản dạng mảng JSON |
| `getSubTasksList(ss)` | spreadsheet | `Array<Object>` | Tất cả công việc con dạng mảng JSON |
| `getEmployeesList(ss)` | spreadsheet | `Array<Object>` | Tất cả nhân viên dạng mảng JSON |
| `getSettingsData(ss)` | spreadsheet | `Object` | Cài đặt dạng key-value |

### 6.3 CRUD Văn bản

| Hàm | Tham số | Trả về | Mô tả |
|---|---|---|---|
| `addDocument(doc)` | `{receiveDate, docNumber, docName, description, deadline}` | `InitialData` | Tạo văn bản, trả về dữ liệu mới |
| `updateDocument(doc)` | `{id, receiveDate, docNumber, docName, description, deadline}` | `InitialData` | Cập nhật các trường văn bản (không phải Progress/Status) |
| `deleteDocument(docId)` | `docId`: Chuỗi | `InitialData` | Xóa văn bản VÀ tất cả công việc con liên quan + sự kiện lịch |

### 6.4 CRUD Công việc con

| Hàm | Tham số | Trả về | Mô tả |
|---|---|---|---|
| `addSubTask(task)` | `{docId, title, assignee, deadline}` | `InitialData` | Tạo công việc với trạng thái "Todo", đồng bộ lịch |
| `updateSubTask(task)` | `{id, docId, title, assignee, deadline, status}` | `InitialData` | Cập nhật công việc, đồng bộ lịch |
| `deleteSubTask(taskId, docId)` | `taskId, docId`: Chuỗi | `InitialData` | Xóa công việc, xóa sự kiện lịch |
| `toggleSubTaskStatus(taskId, docId, status)` | Các chuỗi | `InitialData` | Chuyển nhanh trạng thái (thường Todo↔Done), cập nhật màu lịch |

### 6.5 CRUD Nhân viên

| Hàm | Tham số | Trả về | Mô tả |
|---|---|---|---|
| `addEmployee(emp)` | `{name, department}` | `InitialData` | Tạo nhân viên |
| `updateEmployee(emp)` | `{id, name, department}` | `InitialData` | Cập nhật nhân viên |
| `deleteEmployee(empId)` | `empId`: Chuỗi | `InitialData` | Xóa nhân viên (KHÔNG liên hoàn sang các công việc đã giao) |

### 6.6 Cài đặt & Trigger

| Hàm | Tham số | Trả về | Mô tả |
|---|---|---|---|
| `saveSettings(settings)` | Object với tất cả key-value | `InitialData` | Lưu cài đặt, tạo lại trigger hẹn giờ |
| `setupTrigger(timeStr, emailEnabled)` | Chuỗi, Boolean | void | Nội bộ: quản lý trigger hẹn giờ GAS |

### 6.7 Email & Nhắc nhở

| Hàm | Tham số | Trả về | Mô tả |
|---|---|---|---|
| `sendDailyReminders()` | (không) | void | Được kích hoạt bởi cron/timer: gửi email với các công việc quá hạn/hôm nay/sắp tới |
| `testEmail()` | (không) | Chuỗi (thành công/lỗi) | Gửi email test với dữ liệu mẫu |
| `buildHtmlEmail(overdue, today, warning)` | Các mảng đối tượng công việc | Chuỗi HTML | Xây dựng nội dung email định dạng đẹp |

### 6.8 Đồng bộ Lịch

| Hàm | Tham số | Trả về | Mô tả |
|---|---|---|---|
| `syncToCalendar(action, taskData, oldEventId)` | action: `'CREATE'/'UPDATE'/'DELETE'/'COMPLETE'/'INCOMPLETE'`, taskData: Object, oldEventId: Chuỗi | eventId hoặc null | Quản lý sự kiện Google Calendar cho công việc con |

### 6.9 Webhook Cron

**Mẫu URL**: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action=cron&token=mbf_taskdoc_secret_token_123`

- Phương thức: GET
- Xác thực: Dựa trên token (token cố định trong `Code.gs`)
- Phản hồi: JSON `{status: 'success'|'error', message: '...'}`

---

## 7. Kiến trúc Frontend

### 7.1 Quản lý trạng thái

```javascript
// Đối tượng trạng thái toàn cục (lưu trong bộ nhớ, tải lại mỗi khi có thay đổi)
var appData = {
  documents: [],   // Mảng đối tượng văn bản
  subTasks: [],    // Mảng đối tượng công việc con
  employees: [],   // Mảng đối tượng nhân viên
  settings: {}     // Đối tượng cài đặt dạng key-value
};
```

### 7.2 Mẫu giao tiếp Client-Server

```javascript
// Mẫu chung cho tất cả thao tác CRUD:
google.script.run
  .withSuccessHandler(function(result) {
    appData = result;  // Thay thế toàn bộ trạng thái bằng dữ liệu mới
    renderAll();       // Render lại tất cả các view
  })
  .withFailureHandler(function(err) {
    showToast('Lỗi: ' + err.message, 'error');
  })
  .hàmBackend(thamSố);
```

### 7.3 Hệ thống điều hướng

- Các phần tử `<li>` trong sidebar có thuộc tính `data-target` trỏ đến ID của `<section>`
- Xử lý click: ẩn tất cả `.section-view`, hiện section đích, cập nhật class `active`
- Không có URL routing — chuyển đổi view hoàn toàn qua DOM

### 7.4 Các hàm render chính

| Hàm | Mô tả |
|---|---|
| `renderAll()` | Hàm render tổng: gọi tất cả các hàm render con |
| `renderDashboard()` | Cập nhật thẻ thống kê + danh sách công việc quá hạn/khẩn cấp |
| `renderDocuments()` | Điền bảng văn bản với bộ lọc đã áp dụng |
| `renderEmployees()` | Điền bảng nhân viên |
| `renderProgressView()` | Tạo thẻ khối lượng công việc theo nhân viên |
| `renderCalendar()` | Render lưới lịch tháng/tuần với chấm công việc |
| `renderSettings()` | Điền form cài đặt với giá trị hiện tại |
| `renderDocumentDetail(docId)` | Điền modal chi tiết với danh sách công việc con |

---

## 8. Các màn hình giao diện

### 8.1 Dashboard — Tổng quan (`#dashboard-view`)

- **4 thẻ thống kê**: Tổng văn bản, Đang xử lý, Hoàn thành, Quá hạn
- **Danh sách công việc quá hạn**: Các công việc đã qua deadline, sắp xếp theo mức độ khẩn cấp
- **Danh sách công việc sắp tới**: Đến hạn hôm nay hoặc trong khoảng cảnh báo

### 8.2 Văn bản (`#documents-view`)

- **Nút hành động**: "Xuất Excel" + "Thêm văn bản"
- **Thanh lọc (2 hàng)**:
  - Hàng 1: Tìm kiếm (text), Trạng thái (dropdown), Nhân viên (dropdown)
  - Hàng 2: Khoảng ngày nhận, Khoảng hạn chót, Nút xóa bộ lọc
- **Bảng dữ liệu**: Cột = Số VB | Tên | Ngày nhận | Hạn chót | Tiến độ (thanh) | Trạng thái (badge) | Thao tác (biểu tượng xem/sửa/xóa)
- **Thanh chỉ báo bộ lọc**: Hiện số bộ lọc đang áp dụng + số kết quả

### 8.3 Lịch công việc (`#calendar-view`)

- **Chuyển chế độ xem**: Tuần / Tháng
- **Điều hướng**: Nút Trước/Sau + nút "Hôm nay"
- **Nhãn tháng**: Hiển thị tháng/năm hiện tại
- **Lưới**: 7 cột (CN-T7) với chấm công việc trên mỗi ngày
- **Hành vi click**: Nhấp vào chấm công việc mở Modal Chi tiết Lịch

### 8.4 Theo dõi tiến độ (`#progress-view`)

- **Thẻ thống kê tóm tắt**: Số công việc theo từng nhân viên
- **Thanh lọc**: Dropdown nhân viên, Dropdown trạng thái, Khoảng hạn chót
- **Lưới khối lượng công việc**: Thẻ cho mỗi nhân viên hiển thị:
  - Tên nhân viên + phòng ban
  - Danh sách công việc được giao nhóm theo văn bản cha
  - Mỗi công việc: tên, hạn chót, badge trạng thái
  - Phần trăm hoàn thành tổng thể của nhân viên

### 8.5 Nhân viên (`#employees-view`)

- **Nút hành động**: "Thêm nhân viên"
- **Bảng dữ liệu**: Cột = Mã NV | Tên | Phòng ban | Thao tác (sửa/xóa)

### 8.6 Cài đặt (`#settings-view`)

- **Cấu hình nhắc nhở email**:
  - Checkbox: Bật email hàng ngày
  - Checkbox: Bật đồng bộ Google Calendar
  - Dropdown: Thời gian nhắc trước của lịch
  - Input: Email nhận thông báo tùy chỉnh
  - Input: Giờ gửi (HH:mm)
  - Input: Số ngày cảnh báo trước hạn chót
  - Nút: Lưu + Gửi email test
- **Thẻ thông tin ứng dụng**: Phiên bản, thông tin công nghệ

### 8.7 Các hộp thoại Modal

| ID Modal | Mục đích | Kích hoạt bởi |
|---|---|---|
| `document-modal` | Form thêm/sửa văn bản | Nút "Thêm" hoặc biểu tượng sửa |
| `document-detail-modal` | Xem văn bản + quản lý công việc con | Biểu tượng chi tiết/xem trên dòng văn bản |
| `employee-modal` | Form thêm/sửa nhân viên | Nút "Thêm" hoặc biểu tượng sửa |
| `calendar-task-modal` | Xem chi tiết công việc từ lịch | Nhấp chấm công việc trong view lịch |

---

## 9. Quy tắc nghiệp vụ & Validation

### 9.1 Kiểm tra hạn chót theo tầng (Cascading Deadline)

```
Quy tắc: Hạn chót Công việc con ≤ Hạn chót Văn bản (cha)

- Khi THÊM công việc con: backend kiểm tra hạn chót công việc ≤ hạn chót văn bản cha
- Khi SỬA công việc con: kiểm tra tương tự
- Khi SỬA hạn chót văn bản sang ngày sớm hơn: backend kiểm tra
  không được sớm hơn bất kỳ hạn chót công việc con nào
- Vi phạm ném lỗi: "Hạn chót công việc con không được vượt quá hạn chót của văn bản cha!"
- Vi phạm ném lỗi: "Hạn chót văn bản không được sớm hơn hạn chót của các công việc con hiện có!"
```

### 9.2 Tự tính tiến độ

```
Tiến độ = (Số công việc Done / Tổng số công việc) × 100%
- Lưu dạng chuỗi có hậu tố "%" trong sheet Documents
- Được tính lại mỗi khi thêm/sửa/xóa/chuyển trạng thái công việc con
```

### 9.3 Tự xác định trạng thái (Văn bản)

Thứ tự ưu tiên (cao nhất đến thấp nhất):
1. **Quá hạn**: Bất kỳ công việc chưa Done nào đã qua hạn → ghi đè mọi thứ
2. **Hoàn thành**: Tất cả công việc con đều Done
3. **Đang xử lý**: Ít nhất 1 công việc Done hoặc Doing
4. **Đã phân công**: Có công việc con nhưng tất cả đều Todo
5. **Mới tạo**: Chưa có công việc con

### 9.4 Xóa liên hoàn (Cascade Delete)

- Xóa **Văn bản**: xóa tất cả Công việc con liên quan VÀ sự kiện Calendar của chúng
- Xóa **Nhân viên**: KHÔNG cập nhật các công việc đã giao (tên người giao bị mồ côi)
- Xóa **Công việc con**: xóa sự kiện Calendar, tính lại tiến độ văn bản cha

### 9.5 Sinh ID

```javascript
// Văn bản
'DOC-' + Date.now() + Math.floor(Math.random() * 100)

// Công việc con
'TSK-' + Date.now() + Math.floor(Math.random() * 100)

// Nhân viên
'EMP-' + Date.now()
```

> **Cảnh báo**: Cách này có thể tạo ID trùng nếu 2 bản ghi được tạo trong cùng 1 mili-giây. Để mở rộng, cần xem xét UUID v4 hoặc bộ đếm tuần tự.

---

## 10. Tích hợp bên ngoài

### 10.1 Đồng bộ Google Calendar

**Điều kiện**: Bật qua cài đặt `calendarEnabled`.

| Thao tác Công việc | Thao tác Calendar | Chi tiết |
|---|---|---|
| Tạo công việc | `CREATE` sự kiện | Sự kiện cả ngày vào ngày hạn chót; Tiêu đề: `{tên CV}_{người giao} [{tên VB}]` |
| Sửa công việc | `UPDATE` sự kiện | Cập nhật tiêu đề, ngày; tạo mới nếu không tìm thấy |
| Xóa công việc | `DELETE` sự kiện | Xóa sự kiện khỏi lịch |
| Đánh dấu Xong | `COMPLETE` sự kiện | Đổi màu PALE_GREEN, thêm ✅ vào tiêu đề |
| Bỏ đánh dấu Xong | `INCOMPLETE` sự kiện | Đặt lại màu, bỏ ✅ |

- Sự kiện được tạo trên **lịch mặc định của quản lý**
- Nếu `emailRecipient` được đặt và khác email chủ script, email đó được thêm làm khách mời
- ID sự kiện lưu trong cột `SubTasks.Event ID` để tra cứu sau này
- Mọi thao tác lịch đều bọc try-catch — lỗi được ghi log nhưng KHÔNG chặn thao tác CRUD chính

### 10.2 Nhắc nhở qua Gmail

**Kích hoạt**: Trigger hẹn giờ GAS chạy hàng ngày vào giờ đã cấu hình.

**Các danh mục nội dung email**:
1. 🚨 **Quá hạn**: Công việc đã qua deadline
2. ⏳ **Hôm nay**: Công việc đến hạn hôm nay
3. 📅 **Sắp đến hạn**: Công việc đến hạn trong `warningDays` ngày

**Định dạng email**: Bảng HTML với tên công việc, người giao, văn bản cha, hạn chót — thiết kế với CSS inline để tương thích mọi ứng dụng email.

### 10.3 Webhook Cron bên ngoài

URL: `GET /exec?action=cron&token=mbf_taskdoc_secret_token_123`

Mục đích: Cho phép dịch vụ cron bên ngoài (ví dụ: cron-job.org) kích hoạt `sendDailyReminders()` làm backup cho trigger hẹn giờ GAS (có thể không ổn định).

### 10.4 Xuất Excel

Xuất phía client sử dụng thư viện `xlsx-js-style`:
- Xuất dữ liệu văn bản hiện tại (đã lọc) thành file `.xlsx`
- Bao gồm tiêu đề định dạng, độ rộng cột, và kiểu dáng
- Không cần xử lý phía server

---

## 11. Hệ thống thiết kế & Giao diện

### 11.1 Triết lý thiết kế

- **Bảng màu trung tính ấm**: Nền kem/be, điểm nhấn tông đất
- **Typography sạch**: Tiêu đề serif (Crimson Pro), nội dung sans-serif (Inter)
- **Sidebar tối giản**: Icon thu gọn trên mobile, mở rộng có text trên desktop
- **Thẻ mềm**: Viền nhẹ, không đổ bóng nặng
- **Optimistic UI**: Phản hồi trực quan ngay lập tức trước khi server xác nhận

### 11.2 Bảng màu

| Biến CSS | Chế độ Sáng | Chế độ Tối | Công dụng |
|---|---|---|---|
| `--bg-main` | `#faf9f6` (kem ấm) | `#1a1814` (nâu tối ấm) | Nền trang |
| `--primary` | `#d97757` (cam đất ấm) | `#d97757` | Điểm nhấn chính, nút, liên kết |
| `--primary-hover` | `#c4603f` | `#e8926e` | Trạng thái hover của nút |
| `--bg-card` | `#ffffff` | `#242019` | Nền thẻ |
| `--text-main` | `#1a1814` | `#e8e4df` | Văn bản chính |
| `--text-muted` | `#6b6560` | `#a39e97` | Văn bản phụ |
| `--border-color` | `#e8e4df` | `#3d3730` | Viền, đường phân cách |

### 11.3 Màu sắc Badge trạng thái

| Trạng thái | CSS Class | Bảng màu |
|---|---|---|
| Mới tạo | `badge-new` | Xanh dương |
| Đã phân công | `badge-assigned` | Tím |
| Đang xử lý | `badge-doing` | Vàng hổ phách |
| Hoàn thành | `badge-done` | Xanh lá |
| Quá hạn | `badge-overdue` | Đỏ |
| Todo | `badge-todo` | Xám |
| Doing | `badge-doing` | Vàng hổ phách |
| Done | `badge-done` | Xanh lá |

### 11.4 Breakpoint responsive

- **Desktop** (>1024px): Sidebar đầy đủ + vùng nội dung rộng rãi
- **Tablet** (768–1024px): Sidebar thu gọn (chỉ icon)
- **Mobile** (<768px): Sidebar ẩn với nút hamburger, bố cục xếp chồng

---

## 12. Triển khai & Cấu hình

### 12.1 Các bước triển khai

1. Tạo Google Spreadsheet (CSDL sẽ tự khởi tạo)
2. Mở trình soạn thảo Apps Script (Tiện ích mở rộng → Apps Script)
3. Tạo 4 file: `Code.gs`, `Index.html`, `Styles.html`, `JavaScript.html`
4. Nếu script độc lập: đặt `SPREADSHEET_ID` tại dòng 68 trong `Code.gs`
5. Triển khai dạng Web App:
   - Thực thi dưới dạng: `Tôi (Me)` (quyền của chủ script)
   - Ai có quyền truy cập: `Bất kỳ ai (Anyone)` (để truy cập đa thiết bị)
6. Cấp quyền Google (Sheets, Gmail, Calendar)
7. Cấu hình trong tab Cài đặt của web app

### 12.2 Quyền Google cần thiết

- `https://www.googleapis.com/auth/spreadsheets` — Đọc/ghi Google Sheets
- `https://www.googleapis.com/auth/gmail.send` — Gửi email qua Gmail
- `https://www.googleapis.com/auth/calendar` — Tạo/sửa/xóa sự kiện Calendar
- `https://www.googleapis.com/auth/script.scriptapp` — Quản lý trigger

### 12.3 Biến môi trường

| Biến | Vị trí | Mô tả |
|---|---|---|
| `SPREADSHEET_ID` | `Code.gs` dòng 68 | ID Google Sheets (chỉ cho script độc lập) |
| `EXPECTED_TOKEN` | `Code.gs` dòng 15 | Token xác thực webhook (`mbf_taskdoc_secret_token_123`) |

---

## 13. Hạn chế đã biết & Nợ kỹ thuật

### Hiệu năng

- **Tải lại toàn bộ dữ liệu mỗi lần thay đổi**: Mỗi thao tác CRUD đọc lại tất cả sheet và trả về bộ dữ liệu hoàn chỉnh. Hoạt động tốt với quy mô nhỏ (<100 văn bản, <500 công việc) nhưng sẽ chậm dần khi mở rộng.
- **Không phân trang**: Tất cả văn bản/công việc được tải cùng lúc vào client.
- **Không có chiến lược cache**: Đọc bảng tính mỗi lần gọi hàm server (ngoại trừ trong cùng phiên thực thi qua `cachedSpreadsheet`).

### Toàn vẹn dữ liệu

- **Tên người giao phi chuẩn hóa**: Công việc con lưu tên nhân viên, không phải ID. Đổi tên nhân viên làm mồ côi các giao việc hiện có.
- **Không có ràng buộc duy nhất**: Có thể tạo số văn bản trùng.
- **Nguy cơ trùng ID**: ID dựa trên timestamp có thể trùng khi ghi đồng thời.
- **Không khóa dòng**: Sửa đồng thời trên cùng bảng tính có thể gây hỏng dữ liệu.

### Kiến trúc

- **Code.gs nguyên khối**: Toàn bộ logic server trong 1 file ~930 dòng. Nên tách module cho dễ bảo trì.
- **Không có error boundary phía client**: Một số đường lỗi có thể âm thầm thất bại.
- **Không có unit test**: Không có test coverage.
- **Token cron cố định**: Điểm yếu bảo mật cho webhook endpoint.
- **Không có framework đa ngôn ngữ (i18n)**: Tất cả chuỗi giao diện cố định bằng tiếng Việt.

### Giao diện

- **Không hỗ trợ offline**: Yêu cầu kết nối internet liên tục.
- **Không có undo/redo**: Các thao tác phá hủy (xóa) có hiệu lực ngay lập tức.
- **View lịch**: Chỉ hiển thị (không thể tạo công việc từ ô lịch).

---

## 14. Lộ trình tính năng tương lai

| Ưu tiên | Tính năng | Mô tả |
|---|---|---|
| Cao | Tương tác trên Lịch | Nhấp vào ô lịch để tạo công việc |
| Cao | Nhân bản Văn bản | Sao chép văn bản kèm cấu trúc công việc con |
| Cao | Mẫu Công việc con | Mẫu công việc định sẵn cho các loại văn bản thường gặp |
| Trung bình | Tải file / Đính kèm | Đính kèm file vào văn bản (qua Google Drive) |
| Trung bình | Bình luận / Dòng thời gian | Chuỗi bình luận trên văn bản/công việc |
| Trung bình | Dashboard theo tháng | Dashboard lọc theo tháng |
| Trung bình | Dashboard theo nhân viên | View dashboard tập trung vào cá nhân |
| Thấp | AI: Tự sinh Công việc con | Phân tích mô tả văn bản và gợi ý công việc |
| Thấp | AI: Tóm tắt Văn bản | Tự tóm tắt mô tả văn bản dài |
| Thấp | AI: Gợi ý Deadline | Ước tính deadline dựa trên dữ liệu lịch sử |
| Thấp | Thông báo Google Chat | Gửi nhắc nhở qua Google Chat |
| Thấp | Thông báo Telegram | Gửi nhắc nhở qua bot Telegram |

---

## 15. Bảng thuật ngữ

| Thuật ngữ Tiếng Việt | Thuật ngữ Tiếng Anh | Định nghĩa |
|---|---|---|
| Văn bản | Document | Văn bản chính thức nhận từ cấp trên, phát sinh công việc |
| Công việc con | SubTask | Công việc cụ thể phát sinh từ văn bản, giao cho 1 nhân viên |
| Nhân viên / Nhân sự | Employee | Thành viên nhóm được giao công việc |
| Hạn chót | Deadline | Ngày hạn hoàn thành cho văn bản hoặc công việc |
| Tiến độ | Progress | Phần trăm hoàn thành của văn bản (dựa trên công việc con) |
| Trạng thái | Status | Trạng thái hiện tại của văn bản hoặc công việc |
| Mới tạo | Newly Created | Trạng thái ban đầu của văn bản chưa có công việc con |
| Đã phân công | Assigned | Văn bản có công việc con nhưng chưa bắt đầu |
| Đang xử lý | In Progress | Văn bản có công việc đang được thực hiện |
| Hoàn thành | Completed | Tất cả công việc con đã xong |
| Quá hạn | Overdue | Có công việc chưa xong đã qua hạn chót |
| Phòng ban | Department | Đơn vị tổ chức mà nhân viên thuộc về |
| Nhắc nhở | Reminder | Thông báo tự động về công việc sắp/quá hạn |
| Cài đặt | Settings | Cấu hình hệ thống (email, lịch, nhắc nhở) |
| Lịch công việc | Task Calendar | View lịch hiển thị hạn chót công việc |
| Theo dõi tiến độ | Progress Tracking | View hiển thị phân bổ công việc theo nhân viên |
| Xuất Excel | Export Excel | Tải dữ liệu văn bản dạng file XLSX |
