# SportHub

Nền tảng quản lý giải đấu thể thao trực tuyến, hỗ trợ **bóng đá**, **bóng chuyền** và **cầu lông**.

Từ tạo giải đấu, đăng ký đội, lên lịch thi đấu, check-in QR, cập nhật tỷ số trực tiếp đến xếp hạng và thanh toán — tất cả trong một nền tảng duy nhất.

## Tính năng

### Quản lý giải đấu
- Tạo giải đấu với 4 thể thức: Vòng tròn, Loại trực tiếp (đơn/kép), Vòng bảng + Loại trực tiếp
- Quản lý trạng thái: Nháp → Đăng ký → Đang diễn ra → Hoàn thành
- Hướng dẫn "Bước tiếp theo" cho người tổ chức
- Trang công khai với SEO để chia sẻ giải đấu

### Đăng ký & Quản lý đội
- Trang đăng ký công khai cho các đội (không cần vào dashboard)
- Quản lý đội hình với form riêng theo từng môn
- Bốc thăm chia bảng tự động (thể thức vòng bảng)
- Tự động nâng vai trò player → team_manager khi đăng ký đội

### Thi đấu
- Tự động tạo lịch thi đấu theo thể thức
- Bracket view cho loại trực tiếp
- Tỷ số đơn (bóng đá) hoặc theo set (bóng chuyền/cầu lông)
- Sự kiện riêng theo môn (bàn thắng/thẻ phạt cho bóng đá, ace/chắn bóng cho bóng chuyền...)
- Bracket tự động cập nhật đội thắng vào vòng tiếp theo

### Check-in QR
- Mở check-in theo từng trận đấu
- QR code encode URL — VĐV quét bằng điện thoại
- Bắt buộc đăng nhập, chỉ check-in được cho chính mình
- Organizer check-in thủ công cho VĐV
- Chọn đội hình xuất phát (lineup)

### Bảng xếp hạng
- Tự động tính điểm từ kết quả trận đấu
- Tiebreaker: điểm → hiệu số → bàn thắng → đối đầu trực tiếp
- Thống kê cá nhân (bàn thắng, kiến tạo, thẻ phạt)
- Xem theo bảng cho thể thức vòng bảng

### Thanh toán
- Tích hợp MoMo, VNPay, VietQR
- Kế hoạch thanh toán với giá ưu đãi sớm (early bird)
- Mã giảm giá (promo code)
- Báo cáo tài chính cho người tổ chức

### Phân quyền (5 vai trò)
| Vai trò | Quyền |
|---------|--------|
| **Admin** | Quản lý toàn bộ hệ thống, quản lý người dùng, đổi vai trò |
| **Organizer** | Tạo/quản lý giải đấu, lên lịch, nhập kết quả, bốc thăm |
| **Team Manager** | Quản lý đội, đội hình, check-in lineup (tự động gán khi đăng ký đội) |
| **Player** | Đăng ký tài khoản, xem giải đấu, check-in QR |
| **Referee** | Hỗ trợ check-in, quản lý trận đấu |

## Công nghệ

| Tầng | Công nghệ |
|------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS v4, shadcn/ui |
| GraphQL Client | Apollo Client + @apollo/experimental-nextjs-app-support |
| API | Apollo Server v4 + Express, GraphQL schema-first |
| Database | PostgreSQL 16, Kysely (type-safe query builder) |
| Cache & Realtime | Redis 7 (caching, pub/sub, sessions) |
| Xác thực | JWT (access 15 phút + refresh 7 ngày, rotation) |
| Validation | Zod |
| Monorepo | Yarn 4 workspaces |
| Container | Docker + Docker Compose |
| Testing | Vitest (unit + integration), Playwright (E2E) |

## Cấu trúc thư mục

```
SportHub/
├── apps/
│   ├── api/                  # GraphQL API server
│   │   └── src/
│   │       ├── schema/       # Modules: auth, user, tournament, team, player,
│   │       │                 #   match, standing, checkin, payment, notification, public
│   │       ├── middleware/    # auth.guard, role.guard, rate-limit
│   │       └── lib/          # jwt, password, qr, payment gateways, redis pubsub
│   └── web/                  # Next.js frontend
│       └── src/
│           ├── app/
│           │   ├── (auth)/       # Đăng nhập, đăng ký, quên/đặt lại mật khẩu
│           │   ├── (dashboard)/  # Trang quản lý (có sidebar, cần đăng nhập)
│           │   └── (public)/     # Trang công khai (SSR, SEO)
│           ├── components/       # UI components theo tính năng
│           ├── graphql/          # Queries, mutations, subscriptions, fragments
│           └── lib/              # Apollo client, auth context, utilities
├── packages/
│   ├── db/                   # Kysely, migrations, seeds, generated types
│   └── shared/               # Constants (luật thể thao), utilities (bracket, round-robin, standings)
├── e2e/                      # Playwright E2E tests
└── scripts/                  # CLI: migrate, seed, codegen, reset-db
```

## Cài đặt và chạy

### Yêu cầu
- Node.js >= 18
- Docker & Docker Compose
- Yarn 4

### Bước 1: Clone và cài đặt

```bash
git clone <repo-url>
cd SportHub
yarn install
```

### Bước 2: Khởi động infrastructure

```bash
docker compose up -d    # PostgreSQL 16 + Redis 7
```

### Bước 3: Khởi tạo database

```bash
yarn workspace @sporthub/db migrate   # Chạy migrations
yarn workspace @sporthub/db seed      # Tạo dữ liệu mẫu
```

### Bước 4: Cấu hình environment

Tạo file `apps/web/.env.local`:
```env
NEXT_PUBLIC_GRAPHQL_HTTP=http://localhost:4000/graphql
NEXT_PUBLIC_GRAPHQL_WS=ws://localhost:4000/graphql
```

File `.env` ở root đã có sẵn cấu hình mặc định cho development.

### Bước 5: Chạy servers

```bash
# Terminal 1 — API server
yarn workspace @sporthub/api dev      # http://localhost:4000/graphql

# Terminal 2 — Web frontend
yarn workspace @sporthub/web dev      # http://localhost:3000
```

### Tài khoản demo

Tất cả tài khoản đều dùng mật khẩu: **`Password@123`**

| Email | Vai trò | Mô tả |
|-------|---------|-------|
| admin@sporthub.vn | Admin | Quản trị viên hệ thống |
| btc.nam@sporthub.vn | Organizer | Người tổ chức giải bóng đá & bóng chuyền |
| btc.linh@sporthub.vn | Organizer | Người tổ chức giải cầu lông |
| ql.hung@sporthub.vn | Team Manager | Quản lý đội FC Phượng Hoàng |
| ql.thao@sporthub.vn | Team Manager | Quản lý đội CLB Sao Vàng |
| ql.duc@sporthub.vn | Team Manager | Quản lý đội Rồng Xanh |
| ql.mai@sporthub.vn | Team Manager | Quản lý đội FC Đại Bàng |
| trongtai@sporthub.vn | Referee | Trọng tài |
| player1@sporthub.vn | Player | Vận động viên |

### Dữ liệu demo

Sau khi seed, hệ thống có sẵn:

| Giải đấu | Môn | Thể thức | Trạng thái | Số đội |
|-----------|-----|----------|------------|--------|
| Giải Bóng Đá Mùa Hè 2026 | Bóng đá | Vòng tròn | Đang diễn ra | 4 đội (28 VĐV) |
| Giải Bóng Chuyền Liên Quận 2026 | Bóng chuyền | Loại trực tiếp | Đang đăng ký | 4 đội (24 VĐV) |
| Giải Cầu Lông Đôi Nam Nữ 2026 | Cầu lông | Loại trực tiếp | Đang đăng ký | 4 đội (8 VĐV) |

3 địa điểm thi đấu tại TP.HCM và các bài viết thông báo mẫu.

## Quy trình tổ chức giải đấu

```
1. TẠO GIẢI ĐẤU (Nháp)
   └─ Organizer tạo giải, cài đặt thể thức, luật, lệ phí

2. MỞ ĐĂNG KÝ
   └─ Chia sẻ link /t/{slug} → người chơi tự đăng ký đội

3. CÁC ĐỘI ĐĂNG KÝ
   └─ User đăng nhập → vào /t/{slug}/register → nhập tên đội
   └─ Team manager thêm vận động viên vào đội hình

4. BẮT ĐẦU GIẢI ĐẤU
   └─ Organizer bấm "Bắt đầu giải đấu"
   └─ Vào tab Lịch thi đấu → "Tạo lịch thi đấu"

5. CHECK-IN & THI ĐẤU
   └─ Mở check-in → VĐV quét QR code bằng điện thoại
   └─ Chọn đội hình xuất phát → bắt đầu trận đấu

6. CẬP NHẬT KẾT QUẢ
   └─ Nhập tỷ số (bóng đá) hoặc điểm từng set (bóng chuyền/cầu lông)
   └─ Ghi nhận sự kiện (bàn thắng, thẻ phạt, thay người...)
   └─ Bracket tự động cập nhật cho loại trực tiếp

7. BẢNG XẾP HẠNG
   └─ Tự động tính điểm, xếp hạng
   └─ Thống kê cá nhân VĐV

8. HOÀN THÀNH
   └─ Organizer bấm "Hoàn thành giải đấu"
```

## Quy tắc thể thao

| Môn | Min VĐV | Max VĐV | Cách tính điểm |
|-----|---------|---------|----------------|
| Bóng đá | 5 | 25 | Tỷ số trận đấu |
| Bóng chuyền | 6 | 14 | Best-of-5 set (25 điểm, set 5: 15 điểm, chênh 2 điểm) |
| Cầu lông | 1-2 | 2-4 | Best-of-3 set (21 điểm, chênh 2 điểm, max 30) |

### Sự kiện theo môn

| Bóng đá | Bóng chuyền | Cầu lông |
|---------|-------------|----------|
| Bàn thắng | Ghi điểm | Ghi điểm |
| Kiến tạo | Ace | Nghỉ giữa set |
| Thẻ vàng / Thẻ đỏ | Chắn bóng | |
| Thay người | Thay người | |
| Phạt đền | Hội ý (timeout) | |
| Phản lưới nhà | | |

## Các lệnh thường dùng

```bash
# Database
yarn workspace @sporthub/db migrate        # Chạy migrations
yarn workspace @sporthub/db seed           # Seed dữ liệu demo
yarn workspace @sporthub/db generate       # Regenerate Kysely types
yarn workspace @sporthub/db reset          # Xóa và tạo lại DB + migrations

# API server
yarn workspace @sporthub/api dev           # Dev server (http://localhost:4000/graphql)
yarn workspace @sporthub/api build         # Build production
yarn workspace @sporthub/api test          # Chạy unit + integration tests

# Web frontend
yarn workspace @sporthub/web dev           # Dev server (http://localhost:3000)
yarn workspace @sporthub/web build         # Build production

# E2E tests
npx playwright test                        # Chạy E2E tests (cần servers đang chạy)

# Infrastructure
docker compose up -d                       # Khởi động PostgreSQL + Redis
docker compose down                        # Dừng
```

## Testing

### Unit & Integration Tests (Vitest)
```bash
# Tất cả tests
yarn workspace @sporthub/api test
yarn workspace @sporthub/shared test

# Chạy test cụ thể
DATABASE_URL="..." JWT_SECRET="..." yarn workspace @sporthub/api exec vitest run tests/integration/sport-flows.test.ts
```

**Bao gồm:**
- Full lifecycle cho cả 3 môn (bóng đá, bóng chuyền, cầu lông)
- Team registration, player management
- Status transitions, match generation
- Set-based scoring (volleyball/badminton)
- Role-based access control
- Standings calculation

### E2E Tests (Playwright)
```bash
npx playwright test --reporter=list
```

**Bao gồm 37 tests:**
- Auth flow (login, register, redirect)
- Dashboard navigation (tất cả trang)
- Tournament tabs (overview, teams, schedule, standings, checkin, settings, payments, posts)
- Public pages (tournament list, overview, register, schedule, standings)
- Admin pages (users, reports)
- Smoke test: không có trang nào bị lỗi 500

## Bảo mật

- JWT với secret riêng cho access token và refresh token (>= 32 ký tự)
- Rate limiting: 1000 req/15min (dev), 100 req/15min (production)
- Auth rate limiting riêng: 200 req/15min (dev), 20 req/15min (production)
- Bcrypt 12 rounds cho mật khẩu
- Zod validation cho tất cả input
- Kysely parameterized queries (chống SQL injection)
- QR check-in bắt buộc đăng nhập, chỉ check-in cho chính mình
- Payment callback yêu cầu admin role
- Notification subscription kiểm tra ownership

## License

MIT
