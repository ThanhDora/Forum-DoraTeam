# DoraTeam Objective

Đây là dự án hệ thống diễn đàn (forum), bảng tin và chia sẻ kiến thức dành cho cộng đồng DoraTeam. Project chia làm hai phần chính: Client-side dùng Next.js (App Router) và Server-side dùng Node.js/Express kết hợp Prisma ORM (MariaDB/MySQL).

Dự án được thiết kế với giao diện Dark Mode chủ đạo, tone màu Xanh Ngọc (Emerald) mang hướng công nghệ/cyber.

---

## 1. Yêu cầu hệ thống

Trước khi cài đặt, máy tính hoặc server của bạn cần có sẵn:
- Node.js (phiên bản 18.x trở lên)
- Nối mạng ổn định để pull package từ npm
- Cơ sở dữ liệu MariaDB hoặc MySQL đang chạy (hoặc dùng Docker)
- Git để clone code

---

## 2. Cấu trúc thư mục

- `FrontEnd/`: Chứa mã nguồn giao diện (Next.js 14+, Tailwind CSS, Framer Motion)
- `Server/`: Chứa mã nguồn backend API (Express, Prisma, Socket.io)

---

## 3. Hướng dẫn thiết lập Backend (Server)

**Bước 1:** Di chuyển vào thư mục Server và cài đặt thư viện
```bash
cd Server
npm install
```

**Bước 2:** Cấu hình file môi trường (.env)
Tạo file `.env` trong thư mục `Server` (hoặc copy từ `.env.example` nếu có) và điền các thông tin sau. Chú ý thay đổi thông tin kết nối database cho đúng với máy của bạn.

Mẫu `.env` cho Server:
```env
# Mặc định server chạy ở port 3001
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Tuỳ chọn kết nối DB bằng Prisma (MySQL/MariaDB)
DATABASE_URL=mysql://user:password@localhost:5000/database_name

# ──── MongoDB (Mongoose) ────
MONGODB_URI=mongodb://user:password@localhost:27017/database_name?authSource=database_name


# Khóa bí mật dùng để mã hoá Token (nên thay đổi khi deploy thực tế)
JWT_SECRET=change-me-to-a-strong-secret-key
ACCESS_TOKEN_SECRET=change-me-to-a-strong-access-secret

# Tài khoản Admin mặc định sẽ được tạo lần đầu chạy app
ADMIN=thanhdora
ADMIN_EMAIL=admin@dora.team
ADMIN_PASSWORD=Thanhdora@2026
```

**Bước 3:** Khởi tạo Database với Prisma
Chạy lệnh sau để Prisma tự động tạo các bảng trong database dựa trên schema:
```bash
npx prisma db push
```
*(Nếu bạn muốn tạo file migration để dễ quản lý sau này, dùng lệnh `npx prisma migrate dev` thay thế).*

**Bước 4:** Chạy Backend
Môi trường dev (có tự động reload code):
```bash
npm run dev
```

Môi trường production:
```bash
npm run build
npm start
```

---

## 4. Hướng dẫn thiết lập Frontend

**Bước 1:** Di chuyển vào thư mục FrontEnd và cài đặt thư viện
Mở một tab terminal mới và chạy:
```bash
cd FrontEnd
npm install
```

**Bước 2:** Cấu hình file môi trường (.env)
Tạo file `.env` trong thư mục `FrontEnd`.

Mẫu `.env` cho Frontend:
```env
# Địa chỉ trỏ về Backend API của bạn
# Chú ý: Next.js proxy các request /api qua backend nên API_URL cần thiết để proxy hoạt động.
API_URL=http://localhost:3001
```

**Bước 3:** Chạy Frontend
Môi trường dev:
```bash
npm run dev
```
Sau đó truy cập vào trang web tại: `http://localhost:3000`

Môi trường production:
```bash
npm run build
npm start
```

---

## 5. Các tính năng chính của hệ thống

- **Landing Page & Authentication:** Đăng nhập, đăng ký với giao diện cyber bắt mắt.
- **Hệ thống phân quyền (Role & Permissions):** Quản lý chi tiết việc ai được xem, sửa, xoá, quản lý kênh, người dùng...
- **Forum & Channels:** Thảo luận theo từng danh mục và kênh riêng biệt. Hỗ trợ tạo kênh dạng text bình thường và dạng nhóm.
- **Knowledge Base (Tutorials):** Chuyên trang lưu trữ các bài viết hướng dẫn, chia sẻ thủ thuật (với trình soạn thảo Rich Text).
- **Hồ sơ thành viên:** Theo dõi trạng thái Online/Offline, cấp bậc role và kho hoạt động cá nhân.
- **Upload & Quản lý ảnh:** Hỗ trợ nhúng thẳng hình ảnh vào form chat forum và comment.

---

## 6. Ghi chú thêm
- Khi vào web lần đầu, nếu chưa có dữ liệu, hãy đăng nhập bằng tài khoản `ADMIN` đã cấu hình ở bước 3 để bắt đầu tạo các danh mục (Categories) và kênh (Channels) cho diễn đàn.
- Frontend dùng Next.js App Router và gọi qua proxy API routes (`app/api/...`), điều này giúp ẩn URL backend thực sự ở phía client để tăng bảo mật. Tức là Frontend fetch đến `/api/abc` thì Next.js tự ngầm chuyển tiếp sang `http://localhost:3001/api/abc`.
