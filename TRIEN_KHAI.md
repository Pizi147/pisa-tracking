# Đưa bản chính lên mạng — miễn phí

Viết 21/09/2026 cho chủ sản phẩm (không cần biết code). Dùng **sau khi** ba PR `PR-T`, `PR-Z`, `PR-K` đã merge.
Các lệnh `npm run build` · `npm run init-ban-chinh` · `npm start` · `npm run sao-luu` do `PR-Z` tạo ra.

---

## 1. Vì sao không dùng Netlify

Netlify (và Vercel) **chỉ chứa trang web tĩnh**. Web của mình có **máy chủ chạy liên tục** và lưu dữ liệu vào
**một file trên ổ đĩa** (SQLite) cùng các tệp giáo viên tải lên. Trên Netlify không có ổ đĩa giữ lâu dài →
mỗi lần khởi động lại là **mất sạch dữ liệu**. Muốn dùng Netlify phải viết lại cả phần máy chủ và đổi sang
cơ sở dữ liệu khác — nhiều ngày công, không làm đêm nay được.

Quy mô của bạn (1–2 chi nhánh, 300 học viên, 40 tài khoản) **rất nhỏ** — một máy tính văn phòng bình thường
chạy dư sức, file dữ liệu cả năm chỉ vài chục MB.

## 2. Hai cách miễn phí thật

| | **A. Máy ở trung tâm + Tailscale Funnel** *(khuyến nghị đêm nay)* | **B. Oracle Cloud Always Free** |
|---|---|---|
| Chi phí | 0 đồng | 0 đồng (cần thẻ Visa/Master để xác minh, **không** trừ tiền) |
| Địa chỉ web | `https://<tên-máy>.<tên-mạng>.ts.net` — cố định, có https | Địa chỉ IP, muốn tên đẹp + https cần làm thêm |
| Truy cập từ nhà | Được | Được |
| Điều kiện | Một máy tính **luôn bật, luôn có mạng** | Tài khoản Oracle (đăng ký hay bị từ chối, phải thử lại) |
| Thời gian cài | ~30–45 phút | ~1,5–2 giờ, nhiều thao tác dòng lệnh |
| Rủi ro chính | Mất điện / tắt máy = web tạm ngừng (dữ liệu **không** mất) | Oracle có thể thu hồi máy ảo không dùng |

**Khuyến nghị: dùng A đêm nay**, khi có ngân sách thì chuyển sang máy chủ trả phí (Railway/Render có ổ đĩa,
~5–7 USD/tháng). Chuyển chỉ là chép **một thư mục `data`** sang chỗ mới.

---

## 3. Cách A — từng bước (máy Windows)

### Bước 1 — Chuẩn bị máy (một lần)

1. Chọn một máy **luôn bật**. Trong *Settings → System → Power*: đặt **Sleep = Never** khi cắm điện.
2. Cài **Node.js 20 LTS**: <https://nodejs.org> → nút LTS → Next đến hết.
3. Cài **Git**: <https://git-scm.com/download/win> → Next đến hết.

### Bước 2 — Lấy mã nguồn và dựng bản chính

Mở **PowerShell**, chạy lần lượt:

```bash
cd C:\
git clone https://github.com/Pizi147/pisa-tracking.git pisa-ban-chinh
cd C:\pisa-ban-chinh
npm install
npm run build
```

Tạo thư mục dữ liệu **ngoài** thư mục mã nguồn (để cập nhật mã không đụng dữ liệu):

```bash
mkdir C:\pisa-data
```

Khởi tạo cơ sở dữ liệu rỗng + tài khoản quản trị (**đổi mật khẩu** thành mật khẩu mạnh của riêng bạn):

```bash
$env:DATA_DIR="C:\pisa-data"; $env:ADMIN_EMAIL="dovutuanphong95.pisa@gmail.com"; $env:ADMIN_PASSWORD="doi-mat-khau-nay"; npm run init-ban-chinh
```

Lệnh này **từ chối chạy** nếu đã có dữ liệu — không bao giờ xoá dữ liệu thật.

### Bước 3 — Chạy thử

```bash
$env:NODE_ENV="production"; $env:DATA_DIR="C:\pisa-data"; $env:PORT="4000"; npm start
```

Mở trình duyệt trên chính máy đó: <http://localhost:4000> → đăng nhập bằng tài khoản quản trị vừa tạo.
Thấy được thì bấm `Ctrl + C` để dừng, sang bước 4.

### Bước 4 — Cho chạy tự động khi bật máy

```bash
npm install -g pm2 pm2-windows-startup
pm2-startup install
```

Tạo file `C:\pisa-ban-chinh\chay.cmd` với nội dung:

```bat
@echo off
set NODE_ENV=production
set DATA_DIR=C:\pisa-data
set PORT=4000
set COOKIE_SECURE=1
cd /d C:\pisa-ban-chinh
npm start
```

Rồi:

```bash
pm2 start C:\pisa-ban-chinh\chay.cmd --name pisa
pm2 save
```

Từ giờ máy khởi động lại là web tự chạy. Xem tình trạng: `pm2 status`. Xem lỗi: `pm2 logs pisa`.

### Bước 5 — Đưa lên mạng bằng Tailscale Funnel (miễn phí, có https)

1. Tải **Tailscale**: <https://tailscale.com/download/windows> → cài → đăng nhập bằng Google.
2. Trong trang quản trị Tailscale (<https://login.tailscale.com/admin>):
   - *DNS* → bật **MagicDNS** và **HTTPS Certificates**.
   - *Access controls* → bấm nút gợi ý bật **Funnel** (Tailscale tự thêm dòng cấu hình).
3. Trong PowerShell (**Run as administrator**):

```bash
tailscale funnel --bg 4000
tailscale funnel status
```

Dòng `https://....ts.net` in ra chính là **địa chỉ web** gửi cho giáo viên. Giáo viên **không cần** cài
Tailscale — mở bằng trình duyệt thường là được.

### Bước 6 — Sao lưu tự động hằng ngày (bắt buộc)

1. Cài **Google Drive for desktop**, tạo thư mục `G:\My Drive\pisa-sao-luu` (chữ `G:` tuỳ máy).
2. Mở **Task Scheduler** → *Create Basic Task* → tên `PISA sao lưu` → *Daily* 23:00 → *Start a program*:
   - Program: `cmd`
   - Arguments: `/c cd /d C:\pisa-ban-chinh && set DATA_DIR=C:\pisa-data&& set BACKUP_DIR=G:\My Drive\pisa-sao-luu&& npm run sao-luu`
3. Bấm chuột phải task → *Run* một lần, kiểm tra thư mục Drive có file `pisa-....sqlite`.

> **Không** đặt `C:\pisa-data` vào thư mục Google Drive. File dữ liệu đang chạy mà bị đồng bộ giữa chừng
> dễ hỏng. Chỉ thư mục **sao lưu** nằm trên Drive.

### Bước 7 — Cập nhật khi có PR mới

```bash
pm2 stop pisa
cd C:\pisa-ban-chinh
git pull
npm install
npm run build
$env:DATA_DIR="C:\pisa-data"; npm run migrate
pm2 start pisa
```

`migrate` nâng cấp cơ sở dữ liệu **mà không xoá dữ liệu**. Chạy `npm run sao-luu` trước cho chắc.

---

## 4. Việc đầu tiên sau khi lên mạng

1. Đăng nhập quản trị → **đổi mật khẩu** ngay nếu còn dùng mật khẩu tạm.
2. Tạo **chi nhánh** → tạo tài khoản **Quản lý** và **Giáo viên** (hoặc để GV tự đăng ký rồi duyệt).
   Email phải có đuôi `.pisa@gmail.com` theo luật hiện tại của hệ thống.
3. Tạo **lớp** + phân công GVBM/GVCN → **thêm học viên** (dán từ Excel) → xếp lịch MT.
4. Gửi địa chỉ `https://....ts.net` cho giáo viên.

## 5. Khi có sự cố

| Triệu chứng | Làm gì |
|---|---|
| Giáo viên báo không vào được | Kiểm máy còn bật, còn mạng; `pm2 status` phải thấy `pisa  online` |
| `pisa` báo `errored` | `pm2 logs pisa` → chụp màn hình gửi cho session thiết kế |
| Lỡ tay làm hỏng dữ liệu | `pm2 stop pisa` → chép file sao lưu mới nhất từ Drive đè lên `C:\pisa-data\pisa-demo.sqlite` (tên file thật do PR-Z quyết, xem README) → `pm2 start pisa` |
| Muốn chuyển sang máy chủ trả phí | Chép nguyên thư mục `C:\pisa-data` sang máy mới, làm lại Bước 2 (bỏ `init-ban-chinh`) và Bước 3 |
