# Deploy client full-stack lên Vercel

Client là một ứng dụng Next.js App Router độc lập:

- Giao diện gọi các route tương đối `/api/public/*`.
- Route Handlers dùng Prisma đọc/ghi trực tiếp PostgreSQL.
- Admin và client nhìn thấy cùng Product, Lead, LeadItem, SiteSetting và PreviewRequest vì dùng chung `DATABASE_URL`.
- Client không gọi API admin và không cần biến URL backend cũ.

## Cấu hình project Vercel

- Root Directory: `client`
- Framework Preset: Next.js
- Build Command: `npm run build`
- Install Command: `npm install`

## Environment Variables

```env
DATABASE_URL=postgresql://USER:PASSWORD@PUBLIC_DB_HOST:5432/rental_fashion?sslmode=require
NEXT_PUBLIC_SITE_URL=https://your-storefront.vercel.app
PUBLIC_BOOKING_CREATED_BY_ID=
AI_PROVIDER_API_KEY=
UPLOAD_PROVIDER_KEY={"cloudName":"...","apiKey":"...","apiSecret":"..."}
```

`PUBLIC_BOOKING_CREATED_BY_ID` là ID nhân viên được ghi nhận là người tiếp nhận đơn website.
Nếu bỏ trống, Client tự chọn một tài khoản đang hoạt động thuộc nhóm quản trị/bán hàng.

`DATABASE_URL` phải trỏ tới PostgreSQL mà Vercel truy cập được. PostgreSQL chỉ chạy trong
MacBook/LAN sẽ không thể được Vercel truy cập nếu không có tunnel hoặc database public.

`UPLOAD_PROVIDER_KEY` hiện dùng Cloudinary. Có thể đặt theo JSON như trên hoặc chuỗi
`cloudName:apiKey:apiSecret`. Ảnh production không được lưu vào filesystem của Vercel.

## Prisma

`postinstall` tự chạy `prisma generate`. Client chỉ chứa các model public cần dùng và
không chạy migration khi build/deploy, vì database schema vẫn do hệ thống backend quản lý.

## Hình sản phẩm cũ

Các URL `/uploads/...` từng trỏ vào ổ đĩa MacBook không dùng được trên Vercel. Trước khi
deploy production, upload hình sản phẩm lên cloud storage và cập nhật cột `products.image`
thành URL HTTPS. Client không proxy file từ backend/admin.

## Kiểm tra

```bash
npm install
npm run build
```

Sau deploy, kiểm tra:

- `GET /api/public/products`
- `GET /api/public/client-settings`
- `POST /api/public/leads`
- `POST /api/public/bookings`
- `POST /api/public/ai-preview`
