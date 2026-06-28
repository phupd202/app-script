# Kế hoạch tích hợp Google Calendar (Chỉ cho Quản lý)

Mục tiêu: Tự động đồng bộ các công việc (Task) lên Google Calendar của Quản lý để quản lý tự động nhận nhắc nhở và đôn đốc nhân viên. Không cần lấy Email của nhân viên.

## Các thay đổi dự kiến

### 1. Database (Google Sheets) & Backend (`Code.gs`)
#### [MODIFY] [Code.gs](file:///d:/app-script/Code.gs)
- `initDatabase()`:
  - Bảng `SubTasks`: Đã thêm `Event ID`.
  - Phục hồi lại code bảng `Employees` (không cần cột Email).
- Sửa hàm `addEmployee`, `updateEmployee`: Bỏ trường Email (Phục hồi như cũ).
- Viết lại hàm trợ giúp `syncToCalendar`:
  - Không dò tìm Email nhân sự.
  - Tiêu đề Calendar: `[Tên Nhân Sự] - Tên Công việc`
  - Khách mời: Chỉ add `settings.emailRecipient` (Email quản lý) nếu có.
- Các hàm `addSubTask`, `updateSubTask`, `deleteSubTask`, `toggleSubTaskStatus` giữ nguyên việc truyền dữ liệu cho `syncToCalendar`.

### 2. Frontend (UI)
#### [MODIFY] [Index.html](file:///d:/app-script/Index.html)
- Tab Cài đặt: Thêm Checkbox "Đồng bộ nhắc việc qua Lịch Google".
- Bảng Nhân sự & Form Nhân sự: Không thay đổi gì (giữ nguyên không có trường Email).

#### [MODIFY] [JavaScript.html](file:///d:/app-script/JavaScript.html)
- Xóa các xử lý logic về Email cho Nhân sự.
- Hàm `saveSettings()` lưu thêm `calendarEnabled`.

## Kế hoạch kiểm thử (Verification)
1. Bật đồng bộ Lịch trong Cài đặt.
2. Tạo 1 công việc con -> Kiểm tra Lịch Google của Quản lý.
3. Sửa hạn chót (Deadline) / Đổi tên / Đổi người phụ trách -> Lịch cập nhật theo.
4. Đánh dấu Hoàn thành -> Lịch chuyển màu xanh.
5. Xóa việc -> Việc biến mất trên Lịch.
