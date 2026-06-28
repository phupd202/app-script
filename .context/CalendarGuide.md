# Hướng dẫn triển khai tích hợp Google Calendar (Dành cho Quản lý)

Tính năng tích hợp Google Calendar (Lịch Google) sẽ tự động đồng bộ tất cả các công việc (SubTasks) vào Lịch Google của **người quản lý**. Người quản lý sẽ nhận được thông báo nhắc nhở (Push Notification) từ ứng dụng Calendar trên điện thoại/máy tính khi công việc đến hạn, từ đó chủ động đốc thúc nhân sự.

## 1. Nguyên lý hoạt động
1. Khi có một công việc mới được giao, hệ thống sẽ tự động tạo một sự kiện trên **Lịch Google mặc định của Quản lý**.
2. Tiêu đề sự kiện trên lịch sẽ ghi rõ tên công việc và tên nhân sự phụ trách. Ví dụ: `[Nguyễn Văn A] - Nộp báo cáo tài chính`.
3. Nếu Quản lý có cài đặt Email nhận thông báo (`emailRecipient`), hệ thống sẽ tự động mời (addGuest) email đó vào sự kiện để đảm bảo Lịch hiển thị thông báo.

## 2. Các thay đổi về cấu trúc cơ sở dữ liệu (Google Sheets)
*   **Bảng `SubTasks`**: Thêm cột `Event ID`. Khi tạo xong sự kiện trên lịch, Google trả về một ID sự kiện. Cần lưu ID này lại để sau này khi công việc bị sửa hạn chót (Deadline) hoặc bị xóa, hệ thống sẽ tìm đúng sự kiện đó trên Lịch để cập nhật/xóa theo.
*   *(Không cần thay đổi bảng `Employees` vì không cần mời nhân viên vào Lịch).*

## 3. Các bước triển khai kỹ thuật

### Bước 1: Cập nhật cài đặt (Settings)
*   Thêm tính năng Checkbox Bật/Tắt tích hợp Lịch Google trong tab Cài đặt để Quản lý có thể tùy ý sử dụng.

### Bước 2: Cập nhật Backend (`Code.gs`)
1.  **Hàm tạo việc (`addSubTask`)**:
    *   Kiểm tra nếu chức năng Lịch đang bật.
    *   Dùng `CalendarApp.getDefaultCalendar().createAllDayEvent(title, date)` để tạo sự kiện cả ngày vào ngày hạn chót.
    *   Thêm email Quản lý làm Khách mời (nếu có).
    *   Lưu `event.getId()` vào cột `Event ID` của công việc.

2.  **Hàm sửa việc (`updateSubTask`)**:
    *   Lấy `Event ID` của công việc.
    *   Dùng `CalendarApp.getDefaultCalendar().getEventById(eventId)`.
    *   Cập nhật lại tiêu đề (Title) hoặc thời gian (Date) nếu có sự thay đổi.

3.  **Hàm xóa việc (`deleteSubTask`)**:
    *   Tìm `Event ID` tương ứng.
    *   Dùng `event.deleteEvent()` để gỡ sự kiện khỏi lịch.
    
4.  **Hàm cập nhật trạng thái (`toggleSubTaskStatus`)**:
    *   Nếu công việc chuyển sang trạng thái "Done" (Hoàn thành), tự động đổi màu sự kiện trên lịch sang màu Xanh (`CalendarApp.EventColor.PALE_GREEN`) để biểu thị việc đã xong.
