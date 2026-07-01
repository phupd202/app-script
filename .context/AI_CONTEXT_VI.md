# TaskDoc — Hướng Dẫn Ngữ Cảnh Cho AI

> **Đọc file này TRƯỚC TIÊN** khi làm việc với bất kỳ đoạn mã nào trong dự án.
> Sau đó đọc [SPEC_VI.md](file:///d:/app-script/.context/SPEC_VI.md) để xem đặc tả kỹ thuật đầy đủ tiếng Việt,
> hoặc [SPEC.md](file:///d:/app-script/.context/SPEC.md) cho phiên bản tiếng Anh.

---

## Dự án này là gì?

**TaskDoc** là ứng dụng web đơn trang được xây dựng hoàn toàn trên nền tảng **Google Apps Script** (GAS). Ứng dụng giúp người quản lý trong cơ quan nhà nước/doanh nghiệp Việt Nam theo dõi văn bản chính thức và các công việc phát sinh từ văn bản đó. **Không có server bên ngoài** — Google Sheets là cơ sở dữ liệu, Gmail gửi nhắc nhở, và Google Calendar cung cấp thông báo đẩy.

## Quy Tắc Bắt Buộc Cho AI

### 1. Ràng buộc nền tảng — KHÔNG ĐƯỢC VI PHẠM

- ❌ **Không dùng npm, không Node.js modules, không `import`/`require`/`export`**. GAS dùng V8 nhưng không có hệ thống module.
- ❌ **Không dùng `<script src="local.js">`** trong file HTML. Phải dùng `<?!= include('TênFile'); ?>` để nhúng template.
- ❌ **Không dùng async/await trong Code.gs** (hàm phía server). GAS server-side là đồng bộ.
- ❌ **Không gọi API bên ngoài** mà không có sự cho phép rõ ràng. Tất cả dịch vụ phải dùng qua các lớp tích hợp sẵn của GAS (`SpreadsheetApp`, `MailApp`, `CalendarApp`, `UrlFetchApp`).
- ✅ **JS phía client** (trong `JavaScript.html`) CÓ THỂ dùng async/await, Promise, cú pháp ES6+ hiện đại.
- ✅ **Script từ CDN** được phép trong thẻ `<head>` của `Index.html`.

### 2. Vai trò từng file — Đặt code ở đâu

| File | Vai trò | Ngôn ngữ |
|---|---|---|
| `Code.gs` | TOÀN BỘ logic phía server (backend) | GAS JavaScript (V8) |
| `Index.html` | TOÀN BỘ cấu trúc HTML (bố cục, view, modal) | HTML với thẻ template `<?!= ?>` |
| `Styles.html` | TOÀN BỘ CSS (bọc trong thẻ `<style>`) | Chỉ CSS |
| `JavaScript.html` | TOÀN BỘ logic phía client (bọc trong thẻ `<script>`) | JavaScript trình duyệt |

> **KHÔNG tạo thêm file `.gs` hoặc `.html` mới** trừ khi được yêu cầu rõ ràng. Dự án GAS hoạt động tốt nhất với số lượng file tối thiểu.

### 3. Mô hình dữ liệu — Dữ liệu chảy như thế nào

```
Client gọi:    google.script.run.hàmBackend(thamSố)
                    ↓
Server thực hiện: Đọc/Ghi Google Sheets → trả về getInitialData()
                    ↓
Client nhận:   Bộ dữ liệu hoàn chỉnh {documents, subTasks, employees, settings}
                    ↓
Client xử lý:  appData = result; renderAll();
```

**Mỗi thao tác thay đổi đều trả về toàn bộ bộ dữ liệu.** Không cố trả về dữ liệu bán phần hoặc diff.

### 4. Định dạng ID

- Văn bản: `DOC-{Date.now()}{Math.floor(Math.random()*100)}`
- Công việc con: `TSK-{Date.now()}{Math.floor(Math.random()*100)}`
- Nhân viên: `EMP-{Date.now()}`

### 5. Quy ước ngôn ngữ

- **Mã nguồn**: Tiếng Anh (tên biến, tên hàm, comment)
- **Chuỗi giao diện**: Tiếng Việt
- **Tiêu đề Sheet**: Tiếng Anh
- **Giá trị trạng thái**: Hỗn hợp — Văn bản dùng tiếng Việt (`Mới tạo`, `Đang xử lý`, `Hoàn thành`, `Quá hạn`), Công việc con dùng tiếng Anh (`Todo`, `Doing`, `Done`)

### 6. Những lỗi thường gặp (Cần tránh)

1. **Xử lý ngày tháng từ Sheets**: Ngày từ Sheets trả về dạng đối tượng `Date`. Hàm trợ giúp `formatDateString()` chuyển sang `YYYY-MM-DD` hoặc `YYYY-MM-DD HH:mm`. Luôn dùng `parseDateTime()` để chuyển chuỗi thành Date.

2. **Người giao trong SubTask là chuỗi tên**, không phải ID Nhân viên. Cần biết đây là thiết kế phi chuẩn hóa (denormalized).

3. **Tiến độ/Trạng thái của Văn bản được tự tính** bởi `recalculateDocProgress()`. Không bao giờ đặt thủ công — chúng sẽ bị ghi đè.

4. **Đồng bộ lịch là tùy chọn** và có thể thất bại âm thầm (mọi lệnh gọi lịch đều được bọc try-catch). Không bao giờ để lỗi lịch chặn các thao tác CRUD.

5. **Giới hạn thực thi GAS**: Tối đa 6 phút. Giữ các thao tác hiệu quả.

6. **`getRange(row, col)`**: Đánh số từ 1 (1-indexed) trong API GAS Sheets.

### 7. Kiểm thử sau khi thay đổi

Sau khi thay đổi code:
1. Lưu tất cả file trong trình soạn thảo Apps Script
2. Với thay đổi **Code.gs**: kiểm thử qua web app (không có test runner riêng)
3. Với thay đổi **HTML/CSS/JS**: BẮT BUỘC phải tạo **deployment mới** hoặc cập nhật deployment hiện tại để thấy thay đổi trên URL đã triển khai. Khi phát triển, dùng URL "Test deployments" → "Head deployment".
4. Kiểm tra **Nhật ký thực thi** (trong trình soạn thảo Apps Script → Executions) để xem lỗi phía server.

## Tham chiếu File

| File | Số dòng | Mục đích |
|---|---|---|
| [Code.gs](file:///d:/app-script/Code.gs) | ~930 | Backend: CRUD, trigger, email, lịch |
| [Index.html](file:///d:/app-script/Index.html) | ~781 | Cấu trúc HTML: tất cả view & modal |
| [Styles.html](file:///d:/app-script/Styles.html) | ~1200+ | CSS: hệ thống thiết kế, theme, responsive |
| [JavaScript.html](file:///d:/app-script/JavaScript.html) | ~2000+ | JS phía client: render, sự kiện, quản lý trạng thái |
| [SPEC_VI.md](file:///d:/app-script/.context/SPEC_VI.md) | — | Đặc tả kỹ thuật đầy đủ (tiếng Việt) |
| [SPEC.md](file:///d:/app-script/.context/SPEC.md) | — | Đặc tả kỹ thuật đầy đủ (tiếng Anh) |
| [README.md](file:///d:/app-script/.context/README.md) | — | Hướng dẫn triển khai cho người dùng |
