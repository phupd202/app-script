# Document Task Management System - Specification

# 1. Project Overview

## 1.1 Background

Trong công việc hàng ngày, người dùng thường xuyên nhận được nhiều văn bản từ cấp trên hoặc các phòng ban khác.

Mỗi văn bản sẽ phát sinh nhiều công việc nhỏ cần giao cho các thành viên trong phòng thực hiện và cần theo dõi tiến độ hoàn thành.

Hiện tại việc quản lý chủ yếu bằng Excel hoặc iWork chưa thực sự thuận tiện:

* Khó theo dõi tiến độ.
* Khó biết ai đang thực hiện công việc nào.
* Dễ quên deadline.
* Khó tổng hợp báo cáo.
* Chưa có cơ chế nhắc việc tự động.

Mục tiêu là xây dựng một Web Application sử dụng **Google Apps Script** nhằm hỗ trợ quản lý các văn bản và các công việc phát sinh từ văn bản.

---

# 2. Technical Stack

* Google Apps Script
* HTML Service
* JavaScript
* Bootstrap hoặc Material Design
* Google Sheets làm Database
* Gmail Service
* Time Trigger
* Spreadsheet Service

Không sử dụng server riêng.

Không cần Database độc lập.

Không cần triển khai VPS.

---

# 3. Business Model

## Một Văn bản

Một văn bản bao gồm:

* Ngày nhận văn bản
* Tên văn bản
* Mã / Số văn bản
* Nội dung công việc
* Deadline
* Danh sách Sub Task

Quan hệ:

Document

↓

Sub Task

↓

Employee

Một Document có nhiều Sub Task.

Mỗi Sub Task chỉ được giao cho một nhân viên.

---

# 4. Functional Requirements

## FR01 - Quản lý Văn bản

Cho phép:

* Tạo văn bản
* Chỉnh sửa
* Xóa
* Xem chi tiết

Thông tin bao gồm:

* Ngày nhận
* Tên văn bản
* Mã văn bản
* Nội dung
* Deadline
* Trạng thái

Trạng thái:

* Mới tạo
* Đang xử lý
* Hoàn thành
* Quá hạn
---

## FR02 - Quản lý Sub Task

Cho phép tạo nhiều Sub Task cho một văn bản.

Mỗi Sub Task gồm:

* Tiêu đề
* Người được giao
* Deadline
* Trạng thái

Trạng thái:

* Todo
* Doing
* Done

Cho phép:

* Thêm
* Sửa
* Xóa
* Đánh dấu hoàn thành

---

## FR03 - Quản lý Nhân viên

Danh sách nhân viên được lưu riêng.

Cho phép chọn nhanh khi tạo Sub Task.

Không cần đăng nhập.

---

## FR04 - Theo dõi tiến độ

Hiển thị:

* Tổng số văn bản
* Đang xử lý
* Hoàn thành
* Quá hạn

Hiển thị Progress:

Ví dụ

60%

(3 / 5 Sub Task hoàn thành)

---

## FR05 - Liên kết Google Sheet

Hệ thống tự động đồng bộ dữ liệu sang Google Sheet.

Google Sheet gồm các cột:

* Ngày nhận văn bản
* Tên văn bản
* Mã văn bản
* Nội dung công việc
* Deadline
* Mức độ hoàn thành

Mức độ hoàn thành sẽ được người quản lý tự cập nhật sau khi rà soát.

Không cần nhập lại dữ liệu.

---

## FR06 - Tìm kiếm

Cho phép tìm kiếm theo:

* Tên văn bản
* Mã văn bản
* Nội dung

Search dạng LIKE.

---

## FR07 - Bộ lọc

Cho phép lọc theo:

* Ngày nhận
* Deadline
* Trạng thái
* Người được giao

Ví dụ:

Chọn nhân viên "Nguyễn Văn A"

Hiển thị:

* Văn bản A
* Văn bản B

Các Sub Task đang thực hiện.

---

## FR08 - Dashboard

Hiển thị:

* Tổng số văn bản
* Văn bản quá hạn
* Văn bản sắp đến hạn
* Văn bản hoàn thành
* Văn bản đang xử lý

Có màu sắc trực quan:

* Xanh
* Vàng
* Đỏ

---

## FR09 - Reminder

Cho phép thiết lập nhắc việc.

Ví dụ:

08:00 mỗi sáng.

Thông báo:

* Công việc đến hạn hôm nay
* Công việc còn 3 ngày
* Công việc đã quá hạn

Có thể sử dụng:

* Popup
* Gmail
* Google Chat (Future)

---

# 5. User Interface

## Navbar

* Dashboard
* Văn bản
* Theo dõi tiến độ
* Cài đặt

---

## Màn hình Văn bản

Thanh tìm kiếm

Filter:

* Ngày nhận
* Deadline
* Trạng thái

Bảng dữ liệu:

* Số văn bản
* Tên văn bản
* Ngày nhận
* Deadline
* Tiến độ
* Trạng thái
* Action

Action:

* Xem
* Sửa
* Xóa

---

## Chi tiết Văn bản

Thông tin chung.

Danh sách Sub Task.

Nút:

* Thêm Sub Task

Hiển thị Progress.

---

## Màn hình Theo dõi Tiến độ

Filter:

Nhân viên

Hiển thị:

Tên nhân viên

↓

Danh sách các Sub Task

↓

Thuộc văn bản nào

↓

Deadline

↓

Trạng thái

Ví dụ

Nguyễn Văn A

• Báo cáo tháng 6

* Tổng hợp số liệu

* Đang thực hiện

Deadline: 30/06

---

## Dashboard

Hiển thị:

Card thống kê

Biểu đồ tiến độ

Danh sách:

* Quá hạn
* Sắp đến hạn
* Hôm nay cần làm

---

## Màn hình Cài đặt

Thiết lập:

* Giờ nhắc việc

* Số ngày nhắc trước

Ví dụ

7 ngày

3 ngày

1 ngày

Bật/Tắt:

* Popup

* Gmail Notification

---

# 6. Google Sheet Structure

## Sheet: Documents

Columns

* ID
* Receive Date
* Document Number
* Document Name
* Description
* Deadline
* Progress
* Status

---

## Sheet: SubTasks

Columns

* ID
* Document ID
* Title
* Assignee
* Deadline
* Status

---

## Sheet: Employees

Columns

* ID
* Name
* Department

---

# 7. Suggested Future Features

* Calendar View
* Duplicate Document
* Template Sub Task
* Upload File
* Attachment
* Comment
* Activity Timeline
* Dashboard theo tháng
* Dashboard theo nhân viên
* AI sinh Sub Task từ nội dung văn bản
* AI tóm tắt văn bản
* AI gợi ý Deadline
* Google Chat Notification
* Telegram Notification

---

# 8. Design Principles

* Giao diện đơn giản.
* Thao tác ít nhất có thể.
* Dữ liệu đồng bộ với Google Sheet.
* Tối ưu cho người dùng không có kiến thức CNTT.
* Dễ mở rộng trong tương lai.

---

# 9. Success Criteria

Ứng dụng được coi là thành công khi:

* Người dùng có thể tạo và quản lý toàn bộ văn bản trong một nơi.
* Không bỏ sót deadline.
* Dễ dàng biết nhân viên nào đang thực hiện công việc gì.
* Có thể xuất báo cáo bất cứ lúc nào.
* Tiết kiệm thời gian tổng hợp báo cáo so với Excel hoặc iWork.
* Có thể mở rộng thêm các chức năng mới mà không cần thay đổi kiến trúc lớn.
* Phong cách giao diện: Warm neutral palette, clean typography, minimal sidebar, soft cards, Optimistic UI

Redesign theo phong cách Claude
Thay toàn bộ Styles.html:

Màu sắc: Warm cream/beige (#faf9f6) thay slate-gray lạnh
Primary: Cam đất ấm (#d97757) thay tím indigo
Loại bỏ: glassmorphism, backdrop-filter, gradient rực
Dark mode: Nền nâu ấm tối (#1a1814) thay blue-black lạnh
Font: Thêm serif (Crimson Pro) cho tiêu đề, giữ Inter cho body
