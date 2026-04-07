# SportHub

Nen tang quan ly giai dau the thao truc tuyen, ho tro bong da, bong chuyen va cau long. Tu tao giai dau, dang ky doi, len lich thi dau, check-in QR, cap nhat ty so truc tiep den xep hang va thanh toan.

## Tinh nang chinh

- **Quan ly giai dau** — Tao va dieu hanh giai dau voi cac the thuc: vong tron, loai truc tiep (don/kep), vong bang + loai truc tiep
- **Dang ky doi** — Trang cong khai de cac doi tu dang ky, organizer quan ly danh sach doi, boc tham chia bang
- **Lich thi dau** — Tu dong tao lich theo the thuc, hien thi bracket cho loai truc tiep
- **Check-in QR** — Mo check-in theo tung tran, quet QR xac nhan cau thu, chon doi hinh xuat phat
- **Ty so truc tiep** — Cap nhat ket qua theo thoi gian thuc voi GraphQL subscriptions, ghi nhan su kien tran dau (ban thang, the phat, thay nguoi)
- **Bang xep hang** — Tu dong tinh diem, xep hang voi cac quy tac tiebreaker rieng theo mon
- **Thanh toan** — Tich hop MoMo, VNPay, VietQR, ho tro ma giam gia va ke hoach thanh toan
- **Thong bao** — Realtime qua GraphQL subscriptions
- **Quan ly dia diem** — Them, sua, xoa dia diem thi dau
- **Phan quyen** — 5 vai tro: admin, organizer, team_manager, player, referee

## Cong nghe

| Tang | Cong nghe |
|------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS v4, shadcn/ui |
| GraphQL Client | Apollo Client + @apollo/experimental-nextjs-app-support |
| API | Apollo Server v4 + Express, GraphQL schema-first |
| Database | PostgreSQL 16, Kysely (type-safe query builder) |
| Cache & Realtime | Redis 7 (caching, pub/sub, sessions) |
| Auth | JWT (access 15min + refresh 7d rotation) |
| Validation | Zod |
| Monorepo | Yarn 4 workspaces |
| Containerization | Docker + Docker Compose |

## Cau truc thu muc

```
SportHub/
├── apps/
│   ├── api/          # GraphQL API server
│   │   └── src/
│   │       ├── schema/       # Modules: auth, user, tournament, team, player,
│   │       │                 #   match, standing, checkin, payment, notification, public
│   │       ├── middleware/    # auth.guard, role.guard
│   │       └── lib/          # payment gateways, redis pubsub
│   └── web/          # Next.js frontend
│       └── src/
│           ├── app/
│           │   ├── (auth)/       # Login, register, forgot/reset password
│           │   ├── (dashboard)/  # Authenticated pages (sidebar layout)
│           │   └── (public)/     # Public tournament pages (SSR)
│           ├── components/       # UI components by feature
│           ├── graphql/          # Queries, mutations, subscriptions, fragments
│           └── lib/              # Apollo client, auth context, utilities
├── packages/
│   ├── db/           # Kysely instance, migrations, seeds, generated types
│   └── shared/       # Constants (sport rules), utilities (bracket, round-robin, standings)
└── scripts/          # CLI: migrate, seed, codegen, reset-db
```

## Cai dat va chay

### Yeu cau

- Node.js >= 18
- Docker & Docker Compose
- Yarn 4

### Buoc 1: Clone va cai dat dependencies

```bash
git clone <repo-url>
cd SportHub
yarn install
```

### Buoc 2: Khoi dong infrastructure

```bash
docker compose up -d    # PostgreSQL 16 + Redis 7
```

### Buoc 3: Khoi tao database

```bash
yarn workspace @sporthub/db migrate   # Chay migrations
yarn workspace @sporthub/db seed      # Tao du lieu mau (admin account)
```

### Buoc 4: Cau hinh environment

Tao file `apps/web/.env.local`:

```env
NEXT_PUBLIC_GRAPHQL_HTTP=http://localhost:4000/graphql
NEXT_PUBLIC_GRAPHQL_WS=ws://localhost:4000/graphql
```

### Buoc 5: Chay dev servers

```bash
# Terminal 1 — API server
yarn workspace @sporthub/api dev      # http://localhost:4000/graphql

# Terminal 2 — Web frontend
yarn workspace @sporthub/web dev      # http://localhost:3000
```

### Tai khoan mac dinh

| Email | Mat khau | Vai tro |
|-------|----------|---------|
| admin@sporthub.vn | Admin@123 | admin |

## Quy trinh to chuc giai dau

Duoi day la quy trinh day du tu tao den hoan thanh giai dau:

### 1. Tao giai dau (Nhap)
- Dang nhap voi tai khoan organizer hoac admin
- Vao **Giai dau** > **Tao giai dau**
- Dien thong tin: ten, mon the thao, the thuc, so doi, ngay, le phi, dieu le

### 2. Mo dang ky
- Tai trang Overview cua giai dau, nhan **"Mo dang ky"**
- Trang thai chuyen tu `Nhap` → `Dang dang ky`
- Chia se link cong khai (`/t/{slug}`) de cac doi dang ky

### 3. Cac doi dang ky
- Nguoi dung vao trang cong khai cua giai dau
- Nhan **"Dang ky tham gia"** → Dang nhap (neu chua) → Nhap ten doi
- Organizer co the xem danh sach doi tai tab **Teams**
- Voi the thuc vong bang: nhan **"Boc tham chia bang"** de chia ngau nhien

### 4. Bat dau giai dau
- Tai trang Overview, nhan **"Bat dau giai dau"**
- Trang thai chuyen tu `Dang dang ky` → `Dang dien ra`
- Vao tab **Lich thi dau** > **"Tao lich thi dau"** de tu dong tao cac tran

### 5. Check-in truoc tran dau
- Vao tab **Check-in**
- Mo check-in cho tung tran, cau thu quet QR hoac organizer xac nhan thu cong
- Chon doi hinh xuat phat (lineup)

### 6. Cap nhat ket qua
- Nhan vao tran dau trong lich thi dau
- Nhap ty so (bong da) hoac diem tung set (bong chuyen/cau long)
- Ghi nhan su kien: ban thang, the vang/do, thay nguoi, penalty
- Bracket tu dong cap nhat doi thang vao vong tiep theo

### 7. Xem bang xep hang
- Tab **Bang xep hang** tu dong tinh diem tu ket qua tran dau
- Ho tro tiebreaker: diem > hieu so > ban thang > doi dau truc tiep
- Hien thi thong ke cau thu (ban thang, kien tao, the phat)

### 8. Hoan thanh giai dau
- Khi tat ca tran dau ket thuc, nhan **"Hoan thanh giai dau"**
- Trang thai chuyen sang `Hoan thanh`, ket qua cuoi cung duoc luu tru

## Cac lenh thuong dung

```bash
# Database
yarn workspace @sporthub/db migrate        # Chay migrations
yarn workspace @sporthub/db seed           # Seed du lieu
yarn workspace @sporthub/db generate       # Regenerate Kysely types
yarn workspace @sporthub/db reset          # Drop & recreate DB

# API
yarn workspace @sporthub/api dev           # Dev server
yarn workspace @sporthub/api build         # Build production
yarn workspace @sporthub/api test          # Chay tests

# Web
yarn workspace @sporthub/web dev           # Dev server
yarn workspace @sporthub/web build         # Build production

# Infrastructure
docker compose up -d                       # Start PostgreSQL + Redis
docker compose down                        # Stop
```

## Quy tac the thao

| Mon | Min cau thu | Max cau thu | Ghi diem |
|-----|-------------|-------------|----------|
| Bong da | 5 | 25 | Ty so don |
| Bong chuyen | 6 | 14 | Best-of-3/5 set (25 diem, set 5: 15 diem, chenh 2 diem) |
| Cau long | 1-2 | 2-4 | Best-of-3 set (21 diem, chenh 2 diem, max 30) |

## License

MIT
