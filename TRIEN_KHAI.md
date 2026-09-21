# Đưa bản chính lên mạng — Netlify + Turso (miễn phí)

Viết 21/09/2026 cho chủ sản phẩm (không cần biết code). Kế hoạch kỹ thuật: `plan.md` mục 24 (PR-Z2).

> **Thay bản cũ** hướng dẫn "máy ở trung tâm + Tailscale" — bản chính nay chạy trên Netlify, **không cần máy
> nào luôn bật**. Các lệnh `init-ban-chinh` · `sao-luu` và tên biến môi trường do PR-Z2 tạo ra; nếu PR-Z2 đổi
> tên nào thì nó sửa luôn file này.

---

## 1. Ba mảnh ghép

| Mảnh | Dịch vụ | Chứa gì | Chi phí |
|---|---|---|---|
| Giao diện + máy chủ | **Netlify** | Các trang web và phần xử lý (chạy khi có người bấm) | Miễn phí |
| Dữ liệu | **Turso** | Học viên, điểm, case, vi phạm… — cùng loại database với bản đang chạy | Miễn phí |
| Tệp tải lên | **Netlify Blobs** | Ảnh, thư cảnh cáo, bằng chứng | Miễn phí, nằm sẵn trong Netlify |

Mỗi lần merge PR vào `main` → Netlify **tự deploy** bản mới trong vài phút. Không cần làm gì thêm.

> Hạn mức miễn phí của Netlify và Turso thay đổi theo thời gian — **xem lại trang giá lúc tạo tài khoản**.
> Với 1–2 chi nhánh, ~300 học viên, ~40 tài khoản thì dư sức.

---

## 2. Việc của bạn tối nay (làm trong lúc session Opus chạy Z0–Z5)

### 2.1. Turso — tạo database

1. Vào <https://turso.tech> → đăng ký bằng **GitHub**.
2. Tạo database tên `pisa-ban-chinh`. Chọn **vùng (location)** mà session coding báo ở bước Z0
   (nó sẽ chọn vùng gần máy chủ Netlify nhất để trang tải nhanh).
3. Mở database vừa tạo, lấy **hai thứ** và dán cho session coding (hoặc giữ để bước 2.2):
   - **Database URL** — dạng `libsql://pisa-ban-chinh-<tên>.turso.io`
   - **Token** — bấm *Create Token*, chọn quyền đọc + ghi, không hết hạn.

> Token như mật khẩu database. **Không** dán vào GitHub, không gửi qua chat nhóm.

### 2.2. Netlify — nối với GitHub

1. Vào <https://app.netlify.com> → *Add new site* → *Import an existing project* → **GitHub** → chọn repo
   `Pizi147/pisa-tracking`, nhánh `main`. Cấu hình build để nguyên (đọc từ `netlify.toml`).
2. *Site configuration → Environment variables* → thêm:

| Tên | Giá trị |
|---|---|
| `TURSO_DATABASE_URL` | URL ở bước 2.1 |
| `TURSO_AUTH_TOKEN` | Token ở bước 2.1 |
| `BAN_CHINH` | `1` |

3. *Site configuration → Change site name* → đặt tên dễ nhớ, ví dụ `pisa-progress` →
   địa chỉ thành `https://pisa-progress.netlify.app`.
4. Bấm *Deploy*. Chờ chữ **Published** xanh.

### 2.3. Khởi tạo dữ liệu rỗng + tài khoản quản trị (một lần duy nhất)

Chạy **trên máy của bạn**, trong thư mục dự án, PowerShell:

```bash
git pull
npm install
$env:TURSO_DATABASE_URL="libsql://..."; $env:TURSO_AUTH_TOKEN="..."; $env:ADMIN_EMAIL="dovutuanphong95.pisa@gmail.com"; $env:ADMIN_PASSWORD="mat-khau-manh-cua-ban"; $env:CHI_NHANH="MB=Monbay;BC=Bãi Cháy"; npm run init-ban-chinh
```

Lệnh này **từ chối chạy** nếu database đã có dữ liệu — không bao giờ xoá dữ liệu thật.

`CHI_NHANH` là danh sách chi nhánh thật, dạng `MÃ=Tên` cách nhau bằng dấu `;`. **Hệ thống chưa có màn tạo chi nhánh**,
nên chi nhánh được tạo ở bước này. Sau này thêm chi nhánh:

```bash
$env:TURSO_DATABASE_URL="libsql://..."; $env:TURSO_AUTH_TOKEN="..."; npm run them-chi-nhanh -- UB "Uông Bí"
```

> **Tuyệt đối không chạy `npm run seed` khi đang đặt biến Turso bản chính** — lệnh đó xoá sạch database. Mã đã chặn
> việc này, nhưng đừng thử.

### 2.4. Vào thử

Mở `https://pisa-progress.netlify.app` → đăng nhập bằng email/mật khẩu vừa đặt. Không còn nút
"Vào nhanh bằng tài khoản demo" — đúng như vậy.

---

## 3. Việc đầu tiên sau khi lên mạng

1. Tạo **chi nhánh** → tạo tài khoản **Quản lý** và **Giáo viên** (hoặc để GV tự đăng ký rồi duyệt).
   Email phải có đuôi `.pisa@gmail.com` theo luật hiện tại.
2. Tạo **lớp** + phân công GVBM/GVCN → **thêm học viên** (dán từ Excel) → xếp lịch MT.
3. Gửi địa chỉ web cho giáo viên.

## 4. Sao lưu — mỗi tuần một lần (hoặc hằng ngày nếu muốn)

Turso tự giữ dữ liệu, nhưng vẫn nên có **bản sao của riêng mình**:

```bash
$env:TURSO_DATABASE_URL="libsql://..."; $env:TURSO_AUTH_TOKEN="..."; $env:BACKUP_DIR="G:\My Drive\pisa-sao-luu"; npm run sao-luu
```

Tạo ra file `pisa-YYYY-MM-DD-HHmm.sqlite` trong thư mục Google Drive, giữ 14 bản gần nhất.

Muốn sao lưu cả **tệp bằng chứng** (ảnh, thư cảnh cáo) thì thêm hai biến:
`$env:NETLIFY_SITE_ID="..."` (Netlify → Site configuration → General → **Site ID**) và
`$env:NETLIFY_AUTH_TOKEN="..."` (Netlify → User settings → Applications → **Personal access tokens**).
Không có hai biến này thì chỉ sao lưu dữ liệu, không sao lưu tệp. Muốn tự động:
*Task Scheduler → Create Basic Task → Weekly* chạy đúng lệnh trên.

## 5. Khi có sự cố

| Triệu chứng | Làm gì |
|---|---|
| Web báo lỗi sau một lần cập nhật | Netlify → *Deploys* → chọn bản trước → **Publish deploy** (quay lại bản cũ trong 1 phút) |
| Trang tải chậm (> 3–5 giây) | Ghi lại trang nào, vai nào → gửi session thiết kế |
| Tải tệp báo lỗi | Tệp tối đa **4 MB** — nén ảnh hoặc gửi link Google Drive thay tệp |
| Lỡ tay làm hỏng dữ liệu | Gửi session thiết kế tên file sao lưu gần nhất — có lệnh đưa dữ liệu từ bản sao lưu về Turso |
| Hết hạn mức miễn phí | Netlify/Turso gửi email báo trước. Chuyển sang gói trả phí là đổi gói, **không** phải chuyển dữ liệu |
