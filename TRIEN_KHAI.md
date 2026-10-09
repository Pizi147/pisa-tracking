# PISA Tracking — đưa bản chính lên mạng, hướng dẫn từng bước

Viết 21/09/2026 cho chủ sản phẩm — **không cần biết code**. Làm đúng thứ tự, mỗi bước chỉ làm một việc.
Kế hoạch kỹ thuật phía sau (đã xong, xem lại bằng git): `git show 575e898d:docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md`.

> **Lần này (reset bản chính, 10/2026): làm đúng mục 1a** — mười bước, theo thứ tự. Các mục còn lại là chi tiết mà 1a trỏ tới.

---

## 0. Đọc trước — sáu điều cơ bản

### 0.1. Mở PowerShell **đúng thư mục dự án**

1. Mở **File Explorer**, đi tới thư mục dự án:
   `D:\Github\Pisa-tracking`
2. Bấm vào **thanh địa chỉ** ở trên cùng (chỗ hiện đường dẫn), xoá hết, gõ `powershell`, bấm **Enter**.
3. Một cửa sổ xanh/đen hiện ra, dòng cuối có chữ `...pisa-tracking>` — đúng thư mục rồi.

### 0.2. Dán và chạy một lệnh

- **Copy** lệnh trong khung xám ở file này → sang PowerShell **bấm chuột phải** (tự dán) → bấm **Enter**.
- Chờ tới khi dòng cuối lại hiện `...pisa-tracking>` mới dán lệnh tiếp theo.
- Chữ đỏ = có lỗi → **chụp màn hình gửi session thiết kế**, đừng thử lung tung.

### 0.3. Chỗ nào phải tự thay

Trong lệnh, phần nằm trong dấu `<...>` là **chỗ bạn thay bằng giá trị của mình**, và **xoá luôn cả dấu `<` `>`**.

> Ví dụ: `netlify env:set BAN_CHINH <giá trị>` → gõ thành `netlify env:set BAN_CHINH 1`

Những chỗ nằm trong dấu **nháy đơn** `'...'` thì **giữ dấu nháy đơn**, chỉ thay phần bên trong. **Luôn dùng ngoặc đơn;
nếu giá trị có dấu `'` thì gõ nó hai lần `''`.**

> **Đừng đổi sang ngoặc kép `"..."`.** Trong ngoặc kép, PowerShell tự "ăn" ký tự `$` và dấu huyền `` ` `` cùng chữ theo
> sau — mật khẩu `QuangNinh$2026abc` sẽ bị lưu thành `QuangNinh` (đã thử trên máy này). Nếu mật khẩu có dấu nháy đơn
> `'` thì gõ nó **hai lần** `''`, hoặc chọn mật khẩu không có dấu `'`.

### 0.4. Luôn cập nhật mã mới nhất trước khi làm gì

Mỗi lần bắt đầu, chạy hai lệnh này (lấy bản mới nhất đã merge trên GitHub về máy):

```powershell
git checkout main
git pull
```

Dòng cuối có chữ `Already up to date.` hoặc danh sách file thay đổi là được.

### 0.5. Hai loại "mật khẩu máy" — giữ kín

| Thứ | Là gì | Giữ ở đâu |
|---|---|---|
| **Token Turso** | Chìa khoá vào database | Một file ghi chú **trên máy bạn**, không gửi nhóm chat, không dán lên GitHub |
| **Mật khẩu quản trị** | Mật khẩu bạn đăng nhập web | Trong đầu hoặc trình quản lý mật khẩu. **Không** đưa cho session Claude nào |

Token của database **thử** thì được đưa cho session coding (nó cần để kiểm). Token của database **bản chính** thì
**chỉ bạn** dùng.

### 0.6. Trước khi dán token hoặc mật khẩu — tắt lưu lịch sử

PowerShell trên máy này **ghi mọi dòng bạn đã dán vào một file lịch sử trên ổ đĩa** — kể cả token và mật khẩu — và file
đó **vẫn còn sau khi đóng cửa sổ**. Vì vậy mọi khối lệnh có token/mật khẩu trong file này đều **bắt đầu bằng dòng**:

```powershell
Set-PSReadLineOption -HistorySaveStyle SaveNothing
```

Nó chỉ có tác dụng cho cửa sổ đang mở (mở cửa sổ mới là phải chạy lại) — nên cứ copy **cả khối**, đừng bỏ dòng đầu.

> Đã từng dán token/mật khẩu trước khi có dòng này? Xoá file lịch sử cũ (chỉ mất danh sách lệnh đã gõ, không mất gì
> khác): `Remove-Item (Get-PSReadLineOption).HistorySavePath`

---

## 1. Toàn cảnh — ba dịch vụ, và làm mục nào lúc nào

| Mảnh | Dịch vụ | Chứa gì | Chi phí |
|---|---|---|---|
| Giao diện + máy chủ | **Netlify** | Các trang web và phần xử lý (chỉ chạy khi có người bấm) | Miễn phí |
| Dữ liệu | **Turso** | Học viên, điểm, case, vi phạm… | Miễn phí |
| Tệp tải lên | **Netlify Blobs** | Ảnh, thư cảnh cáo, bằng chứng | Miễn phí, nằm sẵn trong Netlify |

**Bạn deploy thủ công** bằng một lệnh từ thư mục trên máy (mục 8). Merge PR trên GitHub **không** tự làm web thay đổi.

> **Vì sao không kéo-thả thư mục lên Netlify?** Kéo-thả chỉ đưa lên các trang giao diện, **bỏ lại phần máy chủ** —
> web sẽ hiện màn đăng nhập nhưng bấm gì cũng lỗi. Lệnh ở mục 8 đưa lên **cả hai**.

| Khi nào | Làm mục nào |
|---|---|
| **Lần này** — reset bản chính, sau khi PR-DEPLOY merge | **Mục 1a** (một lần) |
| Mỗi lần có PR mới đã merge | Mục 8 (bản nháp rồi chính thức) |
| Mỗi tuần | Mục 10 (sao lưu) |
| Khi session code nói "bản này cần chạy migrate" | Mục 11.1 — database THỬ trước, database CHÍNH sau |
| Sự cố (web lỗi, dữ liệu hỏng, chữ đỏ) | Mục 11 · 11.2 khôi phục — **chỉ khi session code hướng dẫn** |

---

## 1a. Reset bản chính — làm một lần, khi session PR-DEPLOY báo xong

Làm **sau khi PR-DEPLOY đã merge**. Reset = **xoá sạch** database bản chính `pisatracking` và kho tệp của nó, khởi tạo lại từ đầu — mọi tài
khoản, lớp, học viên cũ **mất hẳn** (tạo lại ở bước 9). **Báo trước** cho người đang có tài khoản. Không tạo database mới, không giữ database cũ
(chủ sản phẩm chốt 02/10). Database THỬ `pisatracking-demo` **giữ nguyên** (bản nháp dùng). Một buổi, khoảng 1–2 giờ.

Mỗi khối lệnh có token: dòng đầu `Set-PSReadLineOption -HistorySaveStyle SaveNothing` (mục 0.6); xong **ĐÓNG cửa sổ PowerShell**.

**Trước bước 1 — tập dượt khởi tạo.** Mở thân PR-DEPLOY trên GitHub, tìm dòng bắt đầu `Tập dượt init:`. Ghi `chưa tập dượt` → làm **mục 7a**
(database tạm `pisatracking-demo-thu-init`) trước, ghi lại số giây; tập dượt báo lỗi → dừng, gửi session.

| # | Việc | Lệnh / thao tác | Đúng khi | Hỏng thì |
|---|---|---|---|---|
| 1 | Lấy mã mới nhất | `git checkout main` · `git pull` · `npm install` | không có chữ đỏ `ERR!` | chụp gửi session, dừng |
| 2 | DB THỬ lên schema mới | mục 11.1 bước 2–3 với URL/token/tên máy chủ database **THỬ** `pisatracking-demo-…` (PR-DEPLOY **có** migrate: hai cột lớp gốc của Case) | `Hoàn tất` hoặc `Không có gì để nâng cấp` | chụp gửi session; chưa làm bước 3 |
| 3 | **Xoá database bản chính cũ** | <https://app.turso.tech> › database **`pisatracking`** (không phải `pisatracking-demo`!) › **Settings** › **Delete** › gõ tên để xác nhận | `pisatracking` biến khỏi danh sách; `pisatracking-demo` vẫn còn | nhìn kỹ tên trước khi xoá; không chắc → hỏi session |
| 4 | **Tạo lại đúng tên** | **Create Database**, tên **`pisatracking`**, vùng **Ohio** (mục 2 bước 3–7); copy URL + tạo **token mới**, ghi `CHÍNH (mới)` | URL dạng `libsql://pisatracking-pizi147.aws-us-east-2.turso.io` — **không** có `-demo` | tên bị chiếm → chờ vài phút tạo lại; vẫn lỗi → gửi session |
| 5 | **Xoá sạch kho tệp cũ** | khối **5** dưới bảng; `npm run xoa-kho-tep`; gõ lại đúng tên kho khi được hỏi | dòng cuối `[xoa-kho-tep] Xong. Đã xoá n tệp — kho còn 0 tệp.` | tên kho có chữ `demo` → **dừng**, sai URL · `TỪ CHỐI` → đọc lý do, gửi session |
| 6 | **Khởi tạo** | khối **6** dưới bảng (`npm run init-ban-chinh`) | dòng đầu `Đích: database BẢN CHÍNH — dữ liệu thật (pisatracking-…)`; dòng `Kho tệp …: trống.`; dòng cuối `Xong. Đã tạo tài khoản quản trị … và 5 chi nhánh`; độ dài mật khẩu khớp | dòng đầu có `THỬ`/`KHÔNG RÕ` → **Ctrl+C**, kiểm URL · `CẢNH BÁO: kho tệp … còn n tệp` → làm lại bước 5 · lỗi mạng → chạy lại đúng lệnh (đã ghi xong thì nó báo "đã có dữ liệu") |
| 7 | Kiểm database | cùng cửa sổ: `npm run kiem-sau-init`, rồi **ĐÓNG cửa sổ** | dòng cuối `[kiem-sau-init] Đạt.`; thấy 5 chi nhánh (tên có dấu), 1 tài khoản | `CÓ VẤN ĐỀ: …` → chụp gửi session, chưa làm bước 8 |
| 8 | Netlify dùng token mới | cửa sổ mới, mục 6 với URL + **token mới** (`netlify env:set … --context production`, hỏi overwrite gõ `y`); rồi hai lệnh `netlify env:get` của mục 6 | production in `libsql://pisatracking-pizi147…`; deploy-preview in `libsql://pisatracking-demo-…` | sai một trong hai → **dừng**, chụp gửi session |
| 9 | Lên chính thức + kiểm + nhập dữ liệu | `netlify deploy --build` (bản nháp, đăng nhập **tài khoản demo**, bấm thử vài trang) rồi `netlify deploy --build --prod`; mở `https://<tên-site>.netlify.app`, đăng nhập quản trị mới; mở `https://<tên-site>.netlify.app/api/demo/accounts`; rồi mục 9 | **không** có nút "Vào nhanh"; ngày là **hôm nay**; `/api/demo/accounts` báo `Không tìm thấy endpoint`; Quản trị thấy 5 chi nhánh. Tạo tài khoản QL/GV → lớp + phân công → học viên (email bắt buộc) | lỗi → chụp gửi session (**không còn bản cũ để quay lại** — dữ liệu cũ đã xoá ở bước 3) |
| 10 | **Thứ Hai đầu tiên** xem cron | Netlify › site › **Logs** › **Functions** › **chot-vang** | dòng `[chot-vang] {"ngay":"<Thứ Hai đó>","daChot":…,"daChuyen":…,"boQua":null,…}` lúc ~00:05 và ~06:05 | không có dòng nào / `"boQua":"chua-khoi-tao"` / `[chot-vang] lỗi` → chụp gửi session |

**Khối 5 — xoá kho tệp** (Site ID và Personal access token: bảng cuối mục 10):

```powershell
Set-PSReadLineOption -HistorySaveStyle SaveNothing
$env:TURSO_DATABASE_URL='<URL database CHÍNH mới>'
$env:TURSO_AUTH_TOKEN='<Token database CHÍNH mới>'
$env:NETLIFY_SITE_ID='<Site ID>'
$env:NETLIFY_AUTH_TOKEN='<Personal access token>'
npm run xoa-kho-tep
```

Lệnh in tên kho (`bang-chung-pisatracking-…`) và số tệp, rồi hỏi: **gõ lại đúng tên kho** rồi Enter. Gõ khác là thoát, không xoá gì. Kho của
database THỬ (`…-demo-…`) luôn bị từ chối. Giữ cửa sổ này cho bước 6.

**Khối 6 — khởi tạo** (cùng cửa sổ khối 5; năm chỗ thay như bảng ở mục 7.2):

```powershell
$env:ADMIN_EMAIL='<email quản trị thật, đuôi .pisa@gmail.com>'
$env:ADMIN_PASSWORD='<mật khẩu mới, ≥ 10 ký tự, chưa từng gửi ai>'
$env:CHI_NHANH='MB=Monbay;BC=Bãi Cháy;CP=Cẩm Phả;UB=Uông Bí;HD=Hải Dương'
npm run init-ban-chinh
npm run kiem-sau-init
```

Sửa `CHI_NHANH` nếu danh sách chi nhánh đã đổi. Xong bước 7 → **ĐÓNG cửa sổ PowerShell**.

**Sau khi nhập dữ liệu ngày đầu:** chạy một lần mục 10 (`npm run sao-luu`, kèm hai dòng `NETLIFY_…`) với URL + token **mới** — để có bản sao lưu
đầu tiên của database mới.

---

## 2. Tạo database trên Turso

Làm **hai lần**: lần đầu tên `pisatracking-demo` (thử), lần sau tên `pisatracking` (bản chính). Cách làm giống hệt.

> **Hai tên gần giống nhau — khi dán URL, nhìn kỹ có chữ `-demo` hay không.** Có `-demo` = database **thử**. Không có
> `-demo` = database **bản chính** (dữ liệu thật).

1. Vào <https://app.turso.tech> → **Sign up / Log in** → chọn **Continue with GitHub** → cho phép.
2. Lần đầu vào có thể phải đặt tên tổ chức (organization) — gõ `pisa` là được.
3. Bấm nút **Create Database** (hoặc **New Database**).
4. Ô **Name**: gõ `pisatracking-demo` (lần sau: `pisatracking`).
5. Ô **Location / Region / Group**: chọn vùng **AWS US East (Ohio)** — thường ghi `aws-us-east-2` hoặc có chữ
   **Ohio**. Không có Ohio thì chọn **US East (Virginia)** / `aws-us-east-1`.
   *Lý do:* máy chủ Netlify mặc định đặt ở Ohio; database ở gần thì web nhanh hơn nhiều. **Hai database chọn cùng
   một vùng.**
6. Bấm **Create**. Chờ vài giây tới khi database hiện trong danh sách.
7. Bấm vào tên database vừa tạo. Tìm và **copy hai thứ** vào một file ghi chú trên máy:

   | Thứ | Trông như thế nào | Ở đâu trên trang |
   |---|---|---|
   | **URL** | `libsql://pisatracking-demo-<tên-bạn>.aws-us-east-2.turso.io` | Dòng có chữ **URL** hoặc **Database URL** ở đầu trang |
   | **Token** | Một chuỗi rất dài, bắt đầu bằng `eyJ...` | Bấm **Create Token** (hoặc **Generate Token**) → quyền **Read & Write** (đọc và ghi) → thời hạn **Never** (không hết hạn) → **Create** → copy **ngay** (token chỉ hiện một lần) |

8. Ghi rõ trong file ghi chú token nào của database nào, ví dụ:
   ```text
   THỬ   URL:   libsql://pisatracking-demo-xxx.aws-us-east-2.turso.io
   THỬ   Token: eyJ...
   CHÍNH URL:   libsql://pisatracking-xxx.aws-us-east-2.turso.io
   CHÍNH Token: eyJ...
   ```

---

## 3. Cài và đăng nhập Netlify CLI (một lần duy nhất)

"Netlify CLI" là công cụ gõ lệnh để gửi web từ máy bạn lên Netlify.

1. Nếu chưa có tài khoản: vào <https://app.netlify.com> → **Sign up** → **GitHub** hoặc **Email**.
2. Mở PowerShell đúng thư mục (mục 0.1), chạy:
   ```powershell
   npm install -g netlify-cli
   ```
   Chờ 1–3 phút. Kiểm lại:
   ```powershell
   netlify --version
   ```
   Hiện ra một dòng có số phiên bản là được.
3. Đăng nhập:
   ```powershell
   netlify login
   ```
   Trình duyệt tự mở trang Netlify → bấm **Authorize**. Quay lại PowerShell thấy chữ `You are now logged into your
   Netlify account!` là xong.

---

## 4. Tạo site Netlify (một lần duy nhất)

Vẫn trong PowerShell đúng thư mục:

```powershell
netlify sites:create --name pisa-progress
```

- Nếu nó hỏi chọn **team** → dùng mũi tên lên/xuống chọn team của bạn → **Enter**.
- Nếu báo tên `pisa-progress` **đã có người dùng** → chạy lại lệnh với tên khác, ví dụ `pisa-progress-qn`.
  **Ghi lại tên đã dùng** — gọi là `<tên-site>` ở các bước sau.

Rồi nối thư mục này với site vừa tạo:

```powershell
netlify link --name <tên-site>
```

Thấy chữ `linked` hoặc `already linked` là được. Địa chỉ web của bạn sẽ là `https://<tên-site>.netlify.app`.

> **Không** bấm nối site với GitHub trên trang Netlify — bạn đã chọn deploy thủ công.

---

## 5. Đặt biến môi trường cho site — dùng database **thử**

"Biến môi trường" là mấy thông tin cài sẵn trên Netlify để web biết nối vào database nào. Chạy **ba lệnh**, thay
`<...>` bằng URL và token của database **THỬ** (mục 2, bước 8):

```powershell
Set-PSReadLineOption -HistorySaveStyle SaveNothing
netlify env:set TURSO_DATABASE_URL '<URL database THỬ>'
netlify env:set TURSO_AUTH_TOKEN '<Token database THỬ>'
netlify env:set BAN_CHINH 1
```

Mỗi lệnh thấy chữ `Set environment variable` là được. Kiểm lại:

```powershell
netlify env:list
```

Phải thấy đủ ba tên `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BAN_CHINH`.

Các biến này hiện áp cho **mọi** loại deploy (bản nháp lẫn bản chính thức); mục 6 sẽ tách riêng database cho bản
chính thức.

Xong mục này → báo session Z2a: **"đã xong mục 3-4-5 với database thử"**.

---

## 6. Đặt database **bản chính** — CHỈ cho bản chính thức (mục 1a bước 8)

Bản **chính thức** (địa chỉ giáo viên dùng) nối database **CHÍNH**. Mọi bản **nháp** vẫn nối database **THỬ** như mục
5 — nên thử bản nháp không bao giờ đụng dữ liệu thật.

Chạy **hai lệnh**, dùng URL và token của database **CHÍNH** — chú ý chữ `--context production` ở cuối, **không được bỏ**:

```powershell
Set-PSReadLineOption -HistorySaveStyle SaveNothing
netlify env:set TURSO_DATABASE_URL '<URL database CHÍNH>' --context production
```

```powershell
netlify env:set TURSO_AUTH_TOKEN '<Token database CHÍNH>' --context production
```

Nếu lệnh hỏi `Warning: The environment variable … already exists! … Do you want to overwrite it? (y/N)` thì gõ **`y`** rồi
Enter — biến đã có từ mục 5 (database thử); nhờ chữ `--context production`, lệnh chỉ ghi đè giá trị của **bản chính thức**,
bản nháp vẫn giữ database thử. Mỗi lệnh thấy dòng `Set environment variable ... in the production branch` là được. (Dòng đó in lại cả giá trị vừa
đặt — xong mục này **đóng cửa sổ PowerShell** để token không còn nằm trên màn hình.)

Rồi kiểm lại (hai lệnh này chỉ in **URL**, không in token):

```powershell
netlify env:get TURSO_DATABASE_URL --context production
```

```powershell
netlify env:get TURSO_DATABASE_URL --context deploy-preview
```

| Lệnh | Phải in ra |
|---|---|
| `--context production` | `libsql://pisatracking-<...>` — **không** có chữ `-demo` |
| `--context deploy-preview` | `libsql://pisatracking-demo-<...>` — **có** chữ `-demo` |

Sai một trong hai → **dừng**, chụp màn hình gửi session code. `BAN_CHINH` giữ nguyên `1` cho mọi deploy, không cần đặt lại.

---

## 7. Khởi tạo dữ liệu bản chính (một lần cho mỗi database mới — lần này: mục 1a bước 6)

Bước này tạo trong database chính: các bảng, các vai trò và quyền, **chi nhánh thật**, và **một tài khoản quản trị**
của bạn. Chạy trên máy bạn, PowerShell đúng thư mục, sau khi đã làm mục 0.4.

**Bước 7.1 — chuẩn bị (chỉ cần làm một lần sau mỗi lần cập nhật mã):**

```powershell
npm install
```

**Bước 7.2 — điền năm giá trị.** Copy khối dưới vào Notepad, thay đủ năm chỗ `<...>`, rồi mới dán sang PowerShell:

```powershell
Set-PSReadLineOption -HistorySaveStyle SaveNothing
$env:TURSO_DATABASE_URL='<URL database CHÍNH>'
$env:TURSO_AUTH_TOKEN='<Token database CHÍNH>'
$env:ADMIN_EMAIL='<email quản trị của bạn>'
$env:ADMIN_PASSWORD='<mật khẩu quản trị mới>'
$env:CHI_NHANH='<danh sách chi nhánh>'
npm run init-ban-chinh
```

| Chỗ thay | Điền gì | Ví dụ |
|---|---|---|
| `URL database CHÍNH` | URL ở mục 2 (dòng CHÍNH) — **không** có chữ `-demo` | `libsql://pisatracking-xxx.aws-us-east-2.turso.io` |
| `Token database CHÍNH` | Token ở mục 2 (dòng CHÍNH) | `eyJ...` |
| `email quản trị của bạn` | Email bạn dùng đăng nhập web. **Phải có đuôi `.pisa@gmail.com`** | `dovutuanphong95.pisa@gmail.com` |
| `mật khẩu quản trị mới` | Mật khẩu **mạnh, mới** — dài ít nhất 10 ký tự, có cả chữ và số. **Không** dùng `pisa2026` (lệnh sẽ từ chối) | `PisaQN-2026-an-toan` |
| `danh sách chi nhánh` | Mỗi chi nhánh viết `MÃ=Tên`, cách nhau bằng dấu `;`. Mã viết liền, không dấu. Không dùng mã `TUTOR` (đã dành cho Tutor part-time) | `MB=Monbay;BC=Bãi Cháy` |

Dòng đầu tiên lệnh in ra cho biết **đích**: `Đích: database BẢN CHÍNH — dữ liệu thật (pisatracking-…)`. Thấy chữ
`THỬ` hay `KHÔNG RÕ` mà bạn đang định khởi tạo bản chính → bấm **Ctrl+C** ngay (mọi thứ nằm trong một giao dịch chưa
chốt, dừng giữa chừng là không có gì được ghi) rồi kiểm lại URL.

Chờ vài phút (database ở Mỹ, mỗi lượt đi về mất nửa giây) — **đừng đóng cửa sổ** giữa chừng.

> Tên chi nhánh có chữ **ẩ, ả, ư, ơ** có thể hiện thành **ô vuông** trong PowerShell (phông chữ của cửa sổ không vẽ được) —
> **không sao**, dữ liệu vẫn đúng (đã kiểm 24/09: trên web hiện đủ "Cẩm Phả", "Hải Dương").

**Kết quả đúng:** dòng cuối có dạng
`[init-ban-chinh] Xong. Đã tạo tài khoản quản trị <email của bạn> (userId 1) và 2 chi nhánh: MB (Monbay), BC (Bãi Cháy).`
Dòng ngay trên nó: `Kiểm lại: mật khẩu quản trị dài N ký tự` — **đếm lại** mật khẩu bạn đã gõ; số lệch thì dừng, báo
session code ngay (mật khẩu đã bị lưu sai, đăng nhập sẽ không được).
Lệnh này **tự từ chối** nếu database đã có dữ liệu — không bao giờ xoá dữ liệu thật, nên chạy nhầm lần hai cũng không
sao: nó hiện chữ đỏ `TỪ CHỐI: Database đã có dữ liệu …` và không ghi gì cả.

Ngay sau đó, cùng cửa sổ: `npm run kiem-sau-init` (CHỈ ĐỌC) — dòng cuối phải là `[kiem-sau-init] Đạt.` (không dữ liệu demo, không tài khoản
mang mật khẩu demo, khoá ngoại 0). `CÓ VẤN ĐỀ: …` → chụp màn hình gửi session.

**Làm xong thì ĐÓNG cửa sổ PowerShell này.** Cửa sổ còn biến Turso của database CHÍNH: lệnh nào chạy tiếp trong đó —
kể cả `npm run dev` — đều chạm dữ liệu thật. Đóng đi thì mật khẩu và token cũng không còn trong cửa sổ.

> **Tuyệt đối không chạy `npm run seed`** khi đang có biến Turso — lệnh đó dành cho máy dev và **xoá sạch database**.
> Mã đã chặn việc này, nhưng đừng thử.

**Thêm chi nhánh sau này** (hệ thống chưa có màn tạo chi nhánh):

```powershell
Set-PSReadLineOption -HistorySaveStyle SaveNothing
$env:TURSO_DATABASE_URL='<URL database CHÍNH>'
$env:TURSO_AUTH_TOKEN='<Token database CHÍNH>'
npm run them-chi-nhanh -- <MÃ> '<Tên chi nhánh>'
```

Ví dụ dòng cuối: `npm run them-chi-nhanh -- UB 'Uông Bí'`. Kết quả đúng:
`[them-chi-nhanh] Xong. Đã thêm chi nhánh UB (Uông Bí), id <số>.` Mã đã có → chữ đỏ `TỪ CHỐI`, không thêm, không sửa gì.
**Làm xong thì ĐÓNG cửa sổ PowerShell này.**

---

## 7a. Tập dượt khởi tạo — làm TRƯỚC mục 7, trên một database TẠM

Lệnh ở mục 7 đã chạy trên Turso rỗng thật ngày 23/09 (60 s); schema đã lớn hơn nhiều từ đó. PR-DEPLOY (02/10) chạy trên cloud nên
**chưa tập dượt lại** — làm một lần trên database **tạm** trước mục 1a để chắc nó chạy, biết nó mất bao lâu, và thử đăng nhập — rồi
xoá database tạm. Làm sau mục 0.4.

**Bước 1 — tạo database tạm trên Turso.** Làm như mục 2 bước 3–7, nhưng ô **Name** gõ `pisatracking-demo-thu-init`
(phải bắt đầu bằng `pisatracking-demo-`). Cùng vùng Ohio. Copy URL và token của nó vào file ghi chú, ghi rõ `TẠM`.

**Bước 2 — khởi tạo database tạm.** Mở PowerShell đúng thư mục (mục 0.1), copy khối dưới vào Notepad, thay `<...>`:

```powershell
Set-PSReadLineOption -HistorySaveStyle SaveNothing
$env:TURSO_DATABASE_URL='<URL database TẠM>'
$env:TURSO_AUTH_TOKEN='<Token database TẠM>'
$env:ADMIN_EMAIL='<email quản trị của bạn>'
$env:ADMIN_PASSWORD='<một mật khẩu TẬP DƯỢT — khác mật khẩu thật>'
$env:CHI_NHANH='<danh sách chi nhánh, như mục 7>'
npm run init-ban-chinh
```

**Kết quả đúng:** dòng đầu `Đích: database THỬ (pisatracking-demo-thu-init-…)`, dòng cuối `[init-ban-chinh] Xong. …`.
**Ghi lại lệnh chạy mất mấy phút.** Báo lỗi → dừng, chụp màn hình gửi session code, **không** làm mục 1a.

Cùng cửa sổ, kiểm thêm ba lệnh (ghi thời gian từng lệnh):

```powershell
npm run init-ban-chinh
$env:PISA_CHO_PHEP_MIGRATE_TURSO='<URL database TẠM, bỏ libsql:// ở đầu>'
npm run migrate
npm run kiem-sau-init
```

Đúng: lần init thứ hai báo `TỪ CHỐI: Database đã có dữ liệu`; `migrate` báo `Không có gì để nâng cấp`; `kiem-sau-init` báo `Đạt.`.

**Bước 3 — thử đăng nhập** bằng cách chạy web **trên máy bạn**, nối vào database tạm. Vẫn **trong cửa sổ đó**, chạy:

```powershell
$env:VITE_BAN_CHINH='1'
npm run dev
```

Chờ tới khi thấy dòng có `http://localhost:5173`. Mở trình duyệt — **dùng Chrome hoặc Edge** (Safari không nhận phiên
an toàn ở localhost, sẽ không đăng nhập được) — vào <http://localhost:5173> → đăng nhập bằng email ở
bước 2 và **mật khẩu tập dượt**. Phải vào được trang chính (chưa có dữ liệu), **không** có tab "Vào nhanh", ngày là
**hôm nay**. Trang tải chậm vài giây là bình thường (database ở Mỹ). Nếu có cửa sổ khác đang chạy `npm run dev` thì tắt
nó trước. Xong: quay lại PowerShell bấm **Ctrl+C** (hỏi `Terminate batch job (Y/N)?` thì gõ `Y`, Enter).

**Bước 4 — Làm xong thì ĐÓNG cửa sổ PowerShell này.**

**Bước 5 — xoá database tạm** trên <https://app.turso.tech>: bấm vào `pisatracking-demo-thu-init` → **Settings** (hoặc
nút `⋯`) → **Delete** → gõ tên để xác nhận. Nhìn kỹ đúng tên có `-thu-init` rồi mới xoá.

**Bước 6 —** ghi lại: *"tập dượt xong: init … s, migrate … s, kiem-sau-init đạt, đăng nhập được"*. Rồi mới làm mục 1a.

---

## 8. Deploy — đưa bản mới lên mạng (mỗi lần có PR mới đã merge)

**8.0 — luôn làm trước:**

```powershell
git checkout main
git pull
npm install
```

**8.1 — gửi bản NHÁP (an toàn, không ảnh hưởng người đang dùng):**

```powershell
netlify deploy --build
```

> Bản mới **cần migrate** (session code nói) → database THỬ phải lên schema mới (mục 11.1, làm trên database THỬ) **trước** lệnh này —
> không thì bản nháp báo "Có lỗi · mã …".

Chờ 2–5 phút (lần build đầu cần mạng để tải thư viện cho Linux). Cuối cùng hiện dòng **`Website draft URL: https://<mã>--<tên-site>.netlify.app`**
(bản CLI mới ghi `Draft URL:`). **Từ 24/09 bản nháp được khoá** (Netlify › Visitor access › Deploy Preview visibility =
**Private**): mở địa chỉ nháp bằng trình duyệt **đã đăng nhập** <https://app.netlify.com>, nếu không sẽ bị đòi đăng nhập Netlify.
Bản chính thức vẫn **Public** — đừng đổi dòng Production, giáo viên sẽ không vào được. Mở địa chỉ nháp, đăng
nhập, bấm thử vài trang. Bản nháp luôn dùng database **thử** — thoải mái bấm thử; chỉ bản chính thức (`--prod`) mới có
dữ liệu thật. Vì vậy ở bản nháp, đăng nhập bằng **tài khoản demo** (email và mật khẩu trong `README.md`), không phải
tài khoản quản trị thật của bạn.

> **Đăng nhập tài khoản demo trên bản nháp THẤT BẠI → DỪNG**, đừng thử tài khoản quản trị thật (bản nháp có thể đang
> nối nhầm database chính). Chụp màn hình gửi session code.

**8.2 — đưa lên CHÍNH THỨC** (chỉ khi bản nháp chạy tốt):

```powershell
netlify deploy --build --prod
```

Dòng cuối hiện **`Website URL: https://<tên-site>.netlify.app`** — giáo viên vào địa chỉ này sẽ thấy bản mới.

**Quay lại bản cũ khi bản mới lỗi** (1 phút, không cần lệnh): vào <https://app.netlify.com> → chọn site → mục
**Deploys** → bấm vào **bản deploy trước đó** (bản còn chạy tốt) → nút **Publish deploy**.

---

## 9. Việc đầu tiên sau khi lên mạng

1. Mở `https://<tên-site>.netlify.app` → đăng nhập bằng email và mật khẩu ở mục 7.
2. Kiểm: **không** có nút "Vào nhanh bằng tài khoản demo", ngày hiển thị là **hôm nay** — đúng như vậy.
3. **Quản trị → Tài khoản:** tạo tài khoản **Quản lý** và **Giáo viên** (hoặc để GV tự đăng ký rồi duyệt). Email của
   mọi người phải có đuôi `.pisa@gmail.com`. Chi nhánh đã có sẵn từ mục 7.
4. Tạo **lớp** → phân công GVBM từng môn + GVCN → **thêm học viên** (dán từ Excel). Lịch MT **tự tạo** khi thêm học viên — không cần
   xếp tay. Bảng dán phải có **dòng tiêu đề**; **email học viên bắt buộc**; ngày gõ `dd/mm/yyyy`.
5. Gửi địa chỉ web cho giáo viên. Dặn thêm: **30 ngày không mở web thì phải đăng nhập lại** (phiên đăng nhập tự hết hạn).

---

## 10. Sao lưu — mỗi tuần một lần

Turso tự giữ dữ liệu, nhưng vẫn nên có **bản sao của riêng mình** trên Google Drive.

1. Cài **Google Drive for desktop** (<https://www.google.com/drive/download/>) nếu chưa có. Trong ổ Drive (thường là
   `G:`), tạo thư mục `pisa-sao-luu`.
2. Mỗi tuần: mở PowerShell đúng thư mục, làm mục 0.4, rồi (copy vào Notepad, thay `<...>`, dán sang):

```powershell
Set-PSReadLineOption -HistorySaveStyle SaveNothing
$env:TURSO_DATABASE_URL='<URL database CHÍNH>'
$env:TURSO_AUTH_TOKEN='<Token database CHÍNH>'
$env:BACKUP_DIR='G:\My Drive\pisa-sao-luu'
npm run sao-luu
```

Chờ khoảng 2–3 phút. Nên chạy lúc không ai đang nhập liệu. Lệnh chỉ **đọc** database, không sửa gì.

Kết quả: một file mang **tên database** và ngày giờ, ví dụ `pisa-pisatracking-xxx-2026-09-28-2030.sqlite`, trong thư
mục Drive; dòng cuối `[sao-luu] Xong. Bản sao lưu của database libsql://pisatracking-xxx…: …` — **nhìn kỹ đúng database
CHÍNH** (không có chữ `-demo`). Máy tự giữ 14 bản mới nhất **của từng database** (chỉ xoá bản sao lưu cũ của chính
database đó, không đụng bản của database khác hay file khác trong thư mục). Dòng `Chưa sao lưu tệp bằng chứng` là bình
thường nếu bạn chưa thêm hai dòng ở dưới. Lệnh **từ chối** nếu có `BACKUP_DIR` mà quên hai dòng Turso.
**Làm xong thì ĐÓNG cửa sổ PowerShell này** (cửa sổ còn biến Turso của database chính; đóng đi thì token cũng không
còn trong cửa sổ).

- Bản sao lưu **không chứa mã đăng nhập** của ai (bảng phiên đăng nhập luôn trống có chủ đích) — lỡ để lộ một file sao
  lưu thì người khác cũng không đăng nhập được bằng nó. Vẫn nên giữ file kín: trong đó có dữ liệu học viên.
- File sao lưu **kiểu tên cũ** (`pisa-NĂM-THÁNG-NGÀY-GIỜPHÚT.sqlite`, không có tên database — chỉ có nếu bạn đã chạy
  lệnh trước 22/09/2026) **không được tự dọn**. Muốn thì xoá tay, vô hại.

**Muốn sao lưu cả ảnh / thư cảnh cáo đã tải lên** (vào thư mục cùng tên, thêm đuôi `-tep`, cạnh file), thêm hai
dòng này **trước** dòng `npm run sao-luu`:

```powershell
$env:NETLIFY_SITE_ID='<Site ID>'
$env:NETLIFY_AUTH_TOKEN='<Personal access token>'
```

| Chỗ thay | Lấy ở đâu |
|---|---|
| `Site ID` | <https://app.netlify.com> → chọn site → **Site configuration** → **General** → dòng **Site ID** → copy |
| `Personal access token` | <https://app.netlify.com> → ảnh đại diện góc trên → **User settings** → **Applications** → **Personal access tokens** → **New access token** → đặt tên `sao-luu` → **Generate** → copy ngay |

---

## 11. Khi có sự cố

| Triệu chứng | Làm gì |
|---|---|
| Web báo lỗi sau một lần deploy | Quay lại bản cũ — cuối mục 8 |
| Lệnh báo chữ đỏ | Chụp màn hình cả cửa sổ PowerShell → gửi session thiết kế |
| `netlify` báo "not logged in" | Chạy lại `netlify login` (mục 3 bước 3) |
| `netlify` báo "site not linked" | Chạy lại `netlify link --name <tên-site>` (mục 4) |
| Trang tải chậm (> 3–5 giây) | Ghi lại trang nào, vai nào → gửi session thiết kế |
| Tải tệp báo lỗi | Tệp tối đa **4 MB** — nén ảnh, hoặc dán link Google Drive thay cho tệp |
| Lỡ tay làm hỏng dữ liệu | **Đừng làm gì thêm.** Gửi session thiết kế tên file sao lưu gần nhất ở Drive. Lấy lại dữ liệu theo mục 11.2 **khi session hướng dẫn** |
| Netlify / Turso gửi email "sắp hết hạn mức miễn phí" | Gửi session thiết kế. Nâng gói là đổi gói, **không** phải chuyển dữ liệu |
| Web báo **"Có lỗi · mã …"** | Ghi lại mã (8 chữ/số) và việc đang làm → gửi session thiết kế. Mã giúp tìm đúng dòng trong nhật ký máy chủ |
| Web báo **"Máy chủ đang bận, chưa lưu gì"** | Bấm lại sau ít phút — dữ liệu chưa bị đổi. Lặp lại nhiều lần ở cùng một trang → gửi session thiết kế tên trang |
| `npm run kiem-sau-init` báo **`CÓ VẤN ĐỀ`** | Chụp màn hình cả cửa sổ → gửi session code. Chưa cho mọi người dùng |
| Giáo viên báo **"Đăng nhập sai quá nhiều lần"** | Chờ tối đa 15 phút rồi thử lại (hệ thống tự mở). Quên mật khẩu thì Quản trị hệ thống đặt lại, nhưng vẫn phải chờ hết 15 phút |

### 11.1. Nâng cấp database bản chính khi có bản mới cần

**Chỉ làm khi session code yêu cầu** (nó sẽ nói rõ "bản này cần chạy migrate"). Bình thường deploy **không** cần bước này.
Lệnh nâng cấp **giữ nguyên dữ liệu**, nhưng vẫn phải sao lưu trước. Mở PowerShell đúng thư mục, làm mục 0.4, rồi làm
đúng ba bước (copy vào Notepad, thay `<...>`, dán sang):

> **Database THỬ cũng phải nâng cấp — và phải làm TRƯỚC khi deploy nháp.** Khi bản mới cần migrate (session code sẽ nói,
> ví dụ các PR Ra, LT), làm ba bước dưới **hai lần**: lần đầu với URL, token, tên máy chủ của database **THỬ**
> (`pisatracking-demo-…`) — **trước** `netlify deploy --build` (mục 8.1); không làm thì bản nháp báo "Có lỗi · mã …" vì
> thiếu bảng mới. Lần sau với database **CHÍNH** — trước `--prod` (mục 8.2).
>
> **Lệnh chạy khoảng 3 phút** (database ở Mỹ, mỗi bước kiểm là một lượt đi về) — kể cả khi cuối cùng báo `Không có gì để
> nâng cấp`. Đừng đóng cửa sổ giữa chừng. Chạy lại lần hai cũng không sao.

**Bước 1 — sao lưu trước** (như mục 10):

```powershell
Set-PSReadLineOption -HistorySaveStyle SaveNothing
$env:TURSO_DATABASE_URL='<URL database CHÍNH>'
$env:TURSO_AUTH_TOKEN='<Token database CHÍNH>'
$env:BACKUP_DIR='G:\My Drive\pisa-sao-luu'
npm run sao-luu
```

Chờ tới dòng `[sao-luu] Xong. Bản sao lưu: …`. Báo lỗi → **dừng**, không làm bước 2.

**Bước 2 — xác nhận đúng database** (gõ tên máy chủ = URL database CHÍNH **bỏ chữ `libsql://` ở đầu**):

```powershell
$env:PISA_CHO_PHEP_MIGRATE_TURSO='<URL database CHÍNH, bỏ libsql:// ở đầu>'
```

> Ví dụ: URL là `libsql://pisatracking-xxx.aws-us-east-2.turso.io` → gõ `pisatracking-xxx.aws-us-east-2.turso.io`.

**Bước 3 — nâng cấp:**

```powershell
npm run migrate
```

**Kết quả đúng:** có dòng `Turso: bỏ qua tài khoản/mật khẩu mặc định của bản demo` và dòng cuối `Hoàn tất` hoặc
`Không có gì để nâng cấp`. Lệnh báo `TỪ CHỐI` → bước 2 gõ chưa đúng tên. **Làm xong thì ĐÓNG cửa sổ PowerShell này.**

### 11.2. Khôi phục từ bản sao lưu

**Chỉ làm khi session code hướng dẫn** (dữ liệu bản chính bị hỏng hoặc mất). Lệnh `npm run khoi-phuc` chép một file
sao lưu (mục 10) vào một database **MỚI, hoàn toàn trống** — nó **từ chối** ghi vào database đã có dữ liệu, nên không bao
giờ đè lên gì. Database cũ (bị hỏng) được **giữ nguyên**, đừng xoá vội.

**Bước 1 — chọn file sao lưu.** Trong thư mục Drive `pisa-sao-luu`, chọn file của database **CHÍNH** (tên có
`pisatracking-` mà **không** có `-demo`), thường là file mới nhất **trước** lúc dữ liệu bị hỏng. Chép lại đường dẫn đầy
đủ của nó, ví dụ `G:\My Drive\pisa-sao-luu\pisa-pisatracking-xxx-2026-09-28-2030.sqlite`.

**Bước 2 — tạo database MỚI trên Turso** như mục 2 bước 3–7, ô **Name** gõ `pisatracking-kp` rồi ngày hôm nay, ví dụ
`pisatracking-kp0928` (phải bắt đầu bằng `pisatracking-`, **không** có `-demo`). Copy URL và token của nó.

**Bước 3 — khôi phục.** Mở PowerShell đúng thư mục, làm mục 0.4, copy khối dưới vào Notepad, thay `<...>`:

```powershell
Set-PSReadLineOption -HistorySaveStyle SaveNothing
$env:FILE_SAO_LUU='<đường dẫn file sao lưu ở bước 1>'
$env:TURSO_DATABASE_URL='<URL database MỚI>'
$env:TURSO_AUTH_TOKEN='<Token database MỚI>'
$env:PISA_CHO_PHEP_KHOI_PHUC='<URL database MỚI, bỏ libsql:// ở đầu>'
npm run khoi-phuc
```

**Kết quả đúng:** dòng đầu `Đích: database BẢN CHÍNH — dữ liệu thật (pisatracking-kp…)`; dòng cuối
`[khoi-phuc] Xong. Đã khôi phục <số> bảng, <số> dòng vào …`. Có thể mất nhiều phút — **đừng đóng cửa sổ** giữa chừng
(mọi thứ trong một giao dịch: bị ngắt thì database mới vẫn trống, chạy lại được). Báo `TỪ CHỐI` → đọc dòng lý do:
`chưa xác nhận` = dòng `PISA_CHO_PHEP_KHOI_PHUC` gõ chưa đúng; `đã có dữ liệu`/`đã có bảng` = database đích không phải
database mới. **Làm xong thì ĐÓNG cửa sổ PowerShell này.**

**Bước 4 — cho bản chính thức dùng database mới:** trước tiên làm mục 11.1 **một lần** trên database **MỚI** (URL, token,
tên máy chủ của database MỚI): bản sao lưu cũ giữ cấu trúc cũ, có thể thiếu bảng mà bản mới cần; lệnh chỉ thêm phần còn
thiếu, không thiếu gì thì báo `Không có gì để nâng cấp`. Sau đó làm lại mục 6 với URL và token của database **MỚI** (hai lệnh
`--context production` và hai lệnh kiểm `env:get`), rồi `netlify deploy --build --prod` (mục 8.2) — biến mới chỉ có tác
dụng sau lần deploy này. Mở web, đăng nhập quản trị, xem dữ liệu đúng như lúc sao lưu. **Sau khi khôi phục, mọi người
đăng nhập lại** (bản sao lưu không mang theo mã đăng nhập) — báo trước cho giáo viên.

**Bước 5 — tệp bằng chứng (ảnh, thư cảnh cáo): KHÔNG tự chép — việc tay, làm cùng session code.** Kho tệp trên Netlify
đi theo tên database: database mới thì kho tệp mới, đang trống. Tệp cũ **không mất** — vẫn nằm ở kho của database cũ,
và có bản chép trong thư mục `…-tep` cạnh file sao lưu (nếu bạn đã sao lưu kèm tệp). Trong lúc chờ chép, các dòng bằng
chứng vẫn hiện nhưng bấm tải tệp sẽ báo không còn tệp. Báo session code: *"đã khôi phục sang database mới, cần chép kho
tệp"*.

> **Tập dượt khôi phục — BẮT BUỘC một lần, TRƯỚC khi khởi tạo bản chính (mục 7), đã làm 23/09 — làm lại khi session code yêu cầu:**
> 1. Sao lưu database **THỬ** như mục 10, nhưng hai dòng Turso là URL và token của database **THỬ**.
> 2. Tạo database tạm tên `pisatracking-demo-thu-kp` (mục 2 bước 3–7).
> 3. Làm bước 3 ở trên với file vừa sao lưu và database tạm — dòng đầu phải là `Đích: database THỬ`, dòng cuối
>    `Xong. Đã khôi phục …`. **Ghi lại mất mấy phút.**
> 4. Đóng cửa sổ PowerShell, xoá database tạm như mục 7a bước 5. Bỏ qua bước 4–5 ở trên khi tập dượt.
>
> Báo lỗi ở bước nào → dừng, chụp màn hình gửi session code, **chưa** làm mục 7.

### 11.3. Chốt dấu "-" tự động mỗi sáng thứ Hai

Bạn **không cần làm gì**. Mỗi sáng thứ Hai lúc 00:05 và 06:05, máy chủ tự chốt các bài còn dấu "-" của tuần trước thành
"Không dự thi" — kể cả khi không ai mở web. Muốn xem nó có chạy không: trang Netlify của site › **Logs** › **Functions** ›
**chot-vang** — mỗi lần chạy có một dòng bắt đầu bằng `[chot-vang]`. Không thấy dòng nào sau một sáng thứ Hai → gửi session thiết kế.

Cùng lượt sáng thứ Hai này, web **tự chuyển lớp** cho các lệnh chuyển lớp của Quản lý có tuần bắt đầu là hôm đó (trường `daChuyen` trong dòng log). Lượt nào lỡ thì lần mở web đầu tiên trong tuần cũng chuyển nốt, với ngày hiệu lực vẫn là thứ Hai.

### 11.4. Kiểm dữ liệu Mock Test (CHỈ ĐỌC)

Nạp `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` như mục 7.2 (database cần xem), rồi chạy `npm run kiem-du-lieu-mt`. Lệnh chỉ đọc, không sửa gì.
Nó in 5 bảng (lượt "xác sống", tuần ngược / trùng, kết quả huỷ mồ côi, điểm huỷ mất dấu, tuần lượt lệch kỹ năng); dòng cuối `Không thấy vấn đề.` là sạch.
Có dòng nào → chụp cả cửa sổ gửi session code, đừng tự sửa.

---

## 12. Bảng tra — mọi tên biến dùng trong file này

| Tên | Đặt ở đâu | Áp cho | Giá trị | Mục |
|---|---|---|---|---|
| `TURSO_DATABASE_URL` | Netlify (lệnh `netlify env:set`) **và** PowerShell khi chạy lệnh init/sao lưu | Netlify: **mọi deploy** = database thử (mục 5); **chỉ bản chính thức** (`--context production`) = database chính (mục 6) | URL database Turso | 5, 6, 7, 10 |
| `TURSO_AUTH_TOKEN` | Như trên | Như trên | Token database Turso | 5, 6, 7, 10 |
| `BAN_CHINH` | Netlify | Mọi deploy | `1` | 5 |
| `ADMIN_EMAIL` | PowerShell, chỉ khi chạy `init-ban-chinh` | Chỉ cửa sổ PowerShell đó | Email quản trị, đuôi `.pisa@gmail.com` | 1a, 7 |
| `ADMIN_PASSWORD` | PowerShell, chỉ khi chạy `init-ban-chinh` | Chỉ cửa sổ PowerShell đó | Mật khẩu quản trị mới | 1a, 7 |
| `CHI_NHANH` | PowerShell, chỉ khi chạy `init-ban-chinh` | Chỉ cửa sổ PowerShell đó | `MÃ=Tên;MÃ=Tên` | 1a, 7 |
| `BACKUP_DIR` | PowerShell, khi sao lưu | Chỉ cửa sổ PowerShell đó | Thư mục Drive | 10 |
| `NETLIFY_SITE_ID` | PowerShell, khi sao lưu (tuỳ chọn), `xoa-kho-tep` (bắt buộc), `init-ban-chinh` (để kiểm kho tệp) | Chỉ cửa sổ PowerShell đó | Site ID | 1a, 10 |
| `NETLIFY_AUTH_TOKEN` | Như `NETLIFY_SITE_ID` | Chỉ cửa sổ PowerShell đó | Personal access token | 1a, 10 |
| `PISA_CHO_PHEP_MIGRATE_TURSO` | PowerShell, chỉ khi session code yêu cầu nâng cấp database | Chỉ cửa sổ PowerShell đó | Tên máy chủ database (URL bỏ `libsql://`) | 11.1 |
| `PISA_CHO_PHEP_SEED_TURSO` | Chỉ máy dev / database THỬ, khi session code yêu cầu seed lại database thử | Chỉ cửa sổ PowerShell đó | Tên máy chủ database THỬ. **Bản chính luôn bị từ chối**, có biến cũng vậy | — |
| `FILE_SAO_LUU` | PowerShell, chỉ khi khôi phục | Chỉ cửa sổ PowerShell đó | Đường dẫn file sao lưu `.sqlite` | 11.2 |
| `PISA_CHO_PHEP_KHOI_PHUC` | PowerShell, chỉ khi khôi phục | Chỉ cửa sổ PowerShell đó | Tên máy chủ database ĐÍCH (URL bỏ `libsql://`) | 11.2 |
| `VITE_BAN_CHINH` | Đã có sẵn trong file `netlify.toml` — **bạn không cần đặt**; chỉ tự đặt khi tập dượt trên máy (mục 7a) | Mọi deploy | `1` | 7a |
