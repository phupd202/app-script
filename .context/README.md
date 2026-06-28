# Hướng Dẫn Triển Khai Hệ Thống Quản Lý Văn Bản & Công Việc (TaskDoc)

Dự án này là một ứng dụng Web (Web Application) được xây dựng hoàn toàn trên nền tảng **Google Apps Script (GAS)**, sử dụng **Google Sheets** làm cơ sở dữ liệu và **Gmail** để gửi thông báo nhắc việc tự động hàng ngày.

---

## 🛠️ Các Bước Cài Đặt Chi Tiết

### Bước 1: Tạo Google Spreadsheet mới
1. Truy cập vào [Google Drive](https://drive.google.com/) của bạn.
2. Nhấn nút **Mới (New)** -> Chọn **Google Trang tính (Google Sheets)** để tạo một trang tính trống.
3. Đặt tên cho trang tính (Ví dụ: `Cơ sở dữ liệu Quản lý Văn bản`).
*Lưu ý: Bạn KHÔNG cần phải tạo thủ công các trang hoặc cột dữ liệu. Mã nguồn trong ứng dụng sẽ tự động khởi tạo cơ sở dữ liệu gồm 4 bảng (`Documents`, `SubTasks`, `Employees`, `Settings`) ngay trong lần chạy đầu tiên.*

---

### Bước 2: Truy cập Trình soạn thảo Apps Script

Bạn có thể mở trình soạn thảo bằng 1 trong 2 cách dưới đây:

*   **Cách 1: Tạo Script liên kết trực tiếp (Khuyến nghị)**
    1. Trong Google Sheet bạn vừa tạo ở Bước 1, tìm thanh menu ở phía trên cùng.
    2. Chọn **Tiện ích mở rộng (Extensions)** -> **Apps Script** (Nếu dùng giao diện cũ hơn, nó có thể nằm ở mục **Công cụ (Tools)** -> **Trình soạn thảo mã (Script editor)**).
    
*   **Cách 2: Tạo Script độc lập (Nếu menu trong Google Sheet bị ẩn/khóa bởi admin)**
    1. Truy cập trực tiếp vào trang web: [script.google.com](https://script.google.com/) (đăng nhập bằng tài khoản Google của bạn).
    2. Nhấn nút **Dự án mới (New Project)** ở góc trên bên trái.
    3. Khi dùng cách này, bạn cần lấy **ID của Google Sheet** của mình (ID là chuỗi ký tự dài nằm giữa `d/` và `/edit` trên đường link URL của Sheet. Ví dụ link là `https://docs.google.com/spreadsheets/d/1abc123XYZ/edit` thì ID là `1abc123XYZ`).
    4. Bạn mở file [Code.gs](file:///d:/app-script/Code.gs) vừa tạo ở Bước 3 và thay thế ID đó vào biến `SPREADSHEET_ID` ở dòng số 35.

---

### Bước 3: Sao chép các file mã nguồn vào dự án
Bạn cần tạo và dán nội dung của 4 file mã nguồn vào trình soạn thảo Apps Script theo đúng tên gọi (lưu ý chữ hoa/chữ thường):

1. **File `Code.gs` (Mã máy chủ):**
   * Trong trình soạn thảo, đã có sẵn file mặc định tên là `Code.gs`.
   * Hãy xóa toàn bộ mã mặc định trong đó và dán nội dung từ file [Code.gs](file:///d:/app-script/Code.gs) của dự án này vào.
   * *Nếu dùng Cách 2 ở trên:* Hãy thay ID Google Sheet của bạn vào biến `SPREADSHEET_ID` ở dòng 35.
   * Nhấn nút Lưu (biểu tượng đĩa mềm hoặc bấm `Ctrl + S`).

2. **File `Index.html` (Giao diện chính):**
   * Nhấn vào dấu **`+`** (bên cạnh chữ "Tệp" hoặc "Files") -> Chọn **HTML**.
   * Đặt tên file là `Index` (Google sẽ tự động tạo file `Index.html`).
   * Xóa toàn bộ nội dung mặc định và dán nội dung từ file [Index.html](file:///d:/app-script/Index.html) vào.
   * Nhấn nút Lưu.

3. **File `Styles.html` (Định dạng CSS):**
   * Nhấn vào dấu **`+`** -> Chọn **HTML**.
   * Đặt tên file là `Styles`.
   * Xóa toàn bộ nội dung mặc định và dán nội dung từ file [Styles.html](file:///d:/app-script/Styles.html) vào.
   * Nhấn nút Lưu.

4. **File `JavaScript.html` (Xử lý Logic Giao diện):**
   * Nhấn vào dấu **`+`** -> Chọn **HTML**.
   * Đặt tên file là `JavaScript`.
   * Xóa toàn bộ nội dung mặc định và dán nội dung từ file [JavaScript.html](file:///d:/app-script/JavaScript.html) vào.
   * Nhấn nút Lưu.

---

### Bước 4: Triển khai Ứng dụng Web (Deploy as Web App)
1. Ở góc trên bên phải của màn hình Apps Script, nhấn nút **Triển khai (Deploy)** -> Chọn **Triển khai mới (New deployment)**.
2. Nhấn vào biểu tượng **Bánh răng cài đặt (⚙️)** ở mục "Chọn kiểu" -> Chọn **Ứng dụng web (Web app)**.
3. Cấu hình các thông số như sau:
   * **Mô tả (Description):** Nhập mô tả bất kỳ (ví dụ: `Triển khai TaskDoc v1.0`).
   * **Thực thi dưới dạng (Execute as):** Chọn **Tôi (Me / email của bạn)**. Điều này rất quan trọng để ứng dụng có quyền đọc ghi Sheet và gửi mail từ chính tài khoản của bạn.
   * **Ai có quyền truy cập (Who has access):** Chọn **Bất kỳ ai (Anyone)** hoặc **Chỉ mình tôi (Only myself)** tùy thuộc vào nhu cầu sử dụng bảo mật của bạn. Khuyến nghị chọn **Bất kỳ ai** để dễ dàng mở trên nhiều thiết bị di động hoặc máy tính mà không gặp lỗi phân quyền.
4. Nhấn nút **Triển khai (Deploy)**.

---

### Bước 5: Cấp quyền bảo mật cho Ứng dụng (Authorization)
1. Google sẽ hiển thị một hộp thoại yêu cầu cấp quyền truy cập (**Ủy quyền truy cập / Authorize access**). Nhấn nút **Ủy quyền truy cập**.
2. Chọn tài khoản Google của bạn.
3. Google sẽ hiện cảnh báo bảo mật vì ứng dụng này do bạn tự viết (chưa xác minh). Hãy nhấn vào liên kết **Nâng nâng cao (Advanced)** ở góc dưới bên trái.
4. Nhấn chọn **Đi tới [Tên dự án] (không an toàn) / Go to [Project Name] (unsafe)**.
5. Xem danh sách quyền cần cấp (truy cập Trang tính và gửi Email của Gmail) và nhấn nút **Cho phép (Allow)**.
6. Sau khi hoàn thành, Google sẽ cung cấp cho bạn một **URL ứng dụng web** (Web app URL). Hãy **sao chép URL này** – đây chính là địa chỉ để bạn truy cập và sử dụng phần mềm TaskDoc!

---

## 🔔 Cấu hình Nhắc Nhở Hàng Ngày Tự Động
Hệ thống hỗ trợ gửi email nhắc việc tự động vào một khung giờ cố định hàng ngày (ví dụ 8:00 sáng) cho các công việc quá hạn hoặc sắp đến hạn chót.

Để kích hoạt tính năng này:
1. Mở Web App bằng đường dẫn URL bạn vừa sao chép ở Bước 5.
2. Chuyển sang tab **Cài đặt** trên thanh Menu bên trái.
3. Chọn tích vào **"Bật thông báo email hàng ngày"**.
4. Chọn **Thời gian gửi email** (ví dụ: 08:00) và **Số ngày nhắc nhở trước hạn chót** (ví dụ: 3 ngày).
5. Nhấn **Lưu cấu hình**. Hệ thống sẽ tự động đăng ký một tác vụ chạy ngầm (Time-driven Trigger) trên hệ thống đám mây của Google mà bạn không cần phải cấu hình gì thêm.
6. Bạn có thể nhấn nút **Gửi email test** để kiểm tra ngay lập tức xem Gmail của mình có nhận được email thông báo có định dạng đẹp mắt không.

---

## 💡 Hướng Dẫn Sử Dụng
* **Dashboard (Tổng quan):** Nơi thống kê nhanh số lượng văn bản theo trạng thái và hiển thị lập tức các công việc đang bị trễ hạn hoặc cận kề ngày hoàn thành.
* **Văn bản:** Cho phép bạn quản lý vòng đời của văn bản (Thêm, Sửa, Xóa). Nhấp vào biểu tượng **"Chi tiết & Phân việc"** ở cột thao tác của mỗi dòng văn bản để:
  * Xem toàn bộ nội dung chỉ đạo.
  * Thêm các Công việc con (Sub-tasks) phát sinh và giao cụ thể cho từng nhân viên với ngày hoàn thành riêng.
  * Tích chọn hoàn thành nhanh hoặc thay đổi trạng thái từng công việc con để hệ thống tự động cập nhật phần trăm tiến độ của văn bản tương ứng về Google Sheets.
* **Theo dõi tiến độ:** Gom nhóm tất cả công việc theo từng nhân viên dưới dạng các thẻ (Workload cards) trực quan, giúp người quản lý biết ngay ai đang làm công việc gì, thuộc văn bản nào và tiến độ ra sao.
* **Nhân viên:** Quản lý danh sách nhân sự của phòng ban để phục vụ cho việc chọn nhanh người thực hiện khi phân chia công việc con.
