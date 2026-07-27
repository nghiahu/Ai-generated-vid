# SQLite Migration Design

## Mục tiêu

Thay thế PostgreSQL bằng SQLite để dự án có thể chạy standalone — không cần cài bất kỳ dịch vụ nào ngoài Node.js.

## Bối cảnh

Dự án hiện dùng PostgreSQL (`pg`) làm database. Người nhận dự án không rành kỹ thuật nên không thể tự cài PostgreSQL. SQLite lưu toàn bộ dữ liệu trong 1 file `.db` ngay trong thư mục dự án, không cần setup.

## Phạm vi thay đổi

**Chỉ 1 file thay đổi:** `backend/services/db.js`  
**Tất cả API public giữ nguyên** — các file route và service khác không cần chỉnh.

## Quyết định kỹ thuật

- **Thư viện**: `better-sqlite3` (synchronous, native binding, nhanh nhất cho Node.js)
- **DB file path**: `backend/database.sqlite` (tự tạo lần đầu khởi động)
- **JSONB → TEXT**: SQLite không có JSONB — tất cả JSON column lưu dạng TEXT, parse khi đọc
- **Transactions**: `better-sqlite3` hỗ trợ transaction đồng bộ với `.transaction(fn)()`
- **Auto-increment**: Dùng `INTEGER PRIMARY KEY AUTOINCREMENT` thay `BIGSERIAL`
- **Upsert**: `INSERT OR REPLACE` / `INSERT OR IGNORE` thay `ON CONFLICT`

## Mapping SQL → SQLite

| PostgreSQL | SQLite |
|---|---|
| `JSONB` | `TEXT` (JSON.stringify/parse) |
| `BIGSERIAL PRIMARY KEY` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
| `ON CONFLICT (x) DO NOTHING` | `INSERT OR IGNORE` |
| `ON CONFLICT (id) DO UPDATE SET ...` | `INSERT OR REPLACE INTO` |
| `RETURNING *` | `db.prepare().run()` rồi `db.prepare('SELECT ...').get()` |
| `pool.connect()` / `client.query('BEGIN')` | `db.transaction(fn)()` |
| `NOW()` | `datetime('now')` |
| `$1, $2, ...` placeholders | `?` positional params |
| `res.rowCount` | `.changes` hoặc kiểm tra `.get()` |
| `res.rows[0]` | Kết quả trực tiếp từ `.get()` / `.all()` |

## Cấu trúc file

```
backend/
├── services/
│   └── db.js          ← Toàn bộ thay đổi ở đây
├── database.sqlite    ← Tự tạo khi chạy lần đầu (gitignore)
└── package.json       ← Thêm better-sqlite3, xóa pg
```

## Kết quả

Sau migration, người nhận dự án chỉ cần:
1. `cd backend && npm install`
2. Điền API keys vào `.env`
3. `npm run dev` → SQLite file tự tạo và seed dữ liệu lần đầu
