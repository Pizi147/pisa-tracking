# Bàn giao sang chat mới — PISA Progress, vòng 7 (overhaul sau PR15)

Mở file này khi bắt đầu một cuộc trò chuyện mới. Nó chứa **mọi thứ** người tiếp theo cần biết.

> **Cách dùng nhanh:** đọc mục 1, làm theo mục 7 (dán đúng một đoạn vào chat mới), xong.
> Các mục còn lại là để tra khi cần.

---

## 1. Dự án này là gì

**PISA Progress** — hệ thống quản lý học vụ nội bộ của trung tâm IELTS PISA, đang ở giai
đoạn **bản demo chạy trên máy** để chủ sản phẩm bấm thử trước khi xây bản thật.

Năm chi nhánh: Monbay (MB) · Bãi Cháy (BC) · Cẩm Phả (CP) · Hải Dương (HD) · Uông Bí (UB).

Hai chương trình: **Fast Track** (Mock Test, band IELTS) và **Normal** (Foundation ·
Beginner · Elementary, chấm theo điểm đạt/tổng điểm).

Trọng tâm của sản phẩm là **hồ sơ học viên**: mở ra phải hiểu em đang ở đâu trong hành
trình, đang vướng gì, ai đang xử lý, phương án nào đang chạy, kết quả ra sao, tiếp theo
làm gì.

**Repo:** `Pizi147/pisa-tracking` · **Nhánh làm việc:** `claude/pisa-progress-local-demo-42ct9j`

---

## 2. BA RÀNG BUỘC KHÔNG ĐƯỢC QUÊN

Chủ sản phẩm đã nói rõ và không muốn nhắc lại:

1. **Chủ sản phẩm KHÔNG BIẾT CODE.** Giải thích mọi thứ bằng **tiếng Việt**, nói cái gì
   **thay đổi trên màn hình**, tuyệt đối không nói tên hàm, tên bảng dữ liệu hay thuật ngữ
   kỹ thuật. Giải thích như đang nói với người chưa từng lập trình.
2. **ĐỪNG để máy chủ chạy ngầm.** Chỉ bật khi cần chụp màn hình hoặc chạy thử, xong thì tắt
   và kiểm cổng 5173/4000 đã trống. Chạy suốt rất tốn.
3. **ĐỪNG merge, đừng deploy, đừng gửi thông báo ra ngoài nếu không được bảo.** Đẩy code lên
   nhánh riêng thì được (đã có tiền lệ), nhưng gộp vào bản chính thì phải hỏi.

---

## 3. Việc đang làm: overhaul sau PR15

### 3.1. Đề bài gốc

Nằm ở **[`vong7/BRIEF_OVERHAUL_SAU_PR15.md`](vong7/BRIEF_OVERHAUL_SAU_PR15.md)** — 762 dòng,
20 mục, là **đặc tả hiện hành**. Đọc hết trước khi sửa bất cứ thứ gì.

Nguyên tắc xuyên suốt: **LOGICAL — SIMPLE — PRACTICAL — USER-FRIENDLY — INTUITIVE.**

Đề bài cho phép chủ động overhaul bố cục, cấu trúc component, wording và cách triển khai
mà **không cần xin lại**; chỉ hỏi khi gặp mâu thuẫn nghiệp vụ thật sự chưa được đặc tả giải
quyết. Không dừng ở kế hoạch hay mockup.

### 3.2. Mốc đối chiếu

| | |
|---|---|
| PR15 | đã merge — https://github.com/Pizi147/pisa-tracking/pull/15 |
| `main` sau khi merge | `718f81f` (đúng mốc đề bài nêu) |
| Nhánh làm việc hiện tại | `claude/pisa-progress-local-demo-42ct9j`, đã fast-forward lên `718f81f` |
| Commit mới của vòng 7 | `0fa1fee` mục 11 và 3.1 · `b6e46e6` việc 21 (lịch theo kỹ năng) · việc 22 (tín hiệu) |

---

## 4. Đã làm được gì (tính tới lúc bàn giao)

### ✅ Xong — mục 11 và mục 3.1/3.2 (commit `0fa1fee`)

**Ngưỡng đạt lớp Normal nâng từ 60% lên 70%.**
- Một con số duy nhất cho toàn hệ thống; mọi màn hình, báo cáo, bộ demo và kiểm thử đọc chung.
- Vẫn xét trên **tỷ lệ gốc**, không làm tròn phần trăm rồi mới so. Ví dụ 23/33 hiện ra "70%"
  nhưng thực tế 69,7% nên vẫn là **chưa đạt**.
- Bước nâng cấp database **không sửa một điểm nào**, không xoá kết luận cũ, không sinh nợ quá
  hạn ngược về quá khứ — chỉ ghi lại mốc đổi luật để sau này ai đối chiếu với biên bản cũ
  còn biết vì sao hai bên lệch.

**Vai trò "Admin chi nhánh" đã bỏ.**
- Không còn giao mới được; màn tài khoản không bày ra nữa.
- Vai cũ vẫn giữ trong hệ thống ở trạng thái **đã bỏ**, để lịch sử "ai đã làm gì" còn đọc được.
- Bước nâng cấp tự thu hồi quyền của vai đó, ghi từng lần thu hồi kèm tên người, và **nêu tên**
  những tài khoản sau đó không còn vai nào để người có thẩm quyền phân công lại — không tự
  biến ai thành Quản lý.
- Nhiệm vụ chuyển đúng người: **GVCN** được sửa hồ sơ học viên **của chính lớp mình chủ nhiệm**
  (GVBM thì không); việc **gọi phụ huynh** về Quản lý/GVCN thay vì văn phòng.
- Bộ demo bỏ năm tài khoản văn phòng — còn **16 tài khoản**.

**Kiểm chứng:** 235 phép kiểm tự động đạt hết; hai lượt kiểm lỗi kiểu dữ liệu sạch; bước nâng
cấp chạy sạch trên database đang có.

### ✅ Xong — mục 10.1 / 10.4 / 10.5 / 10.7 và 18.1 (việc 21)

**Lịch thi tách ra theo TỪNG KỸ NĂNG.**

- Một đợt kiểm tra không còn buộc phải thi gọn trong một tuần. Mỗi kỹ năng có **tuần thi,
  phạm vi yêu cầu, trạng thái thi và hạn chấm riêng**. Điểm vẫn thuộc **một đợt duy nhất**:
  một bảng điểm, một kết luận, không sinh thêm MT nào.
- **Hạn chấm tính từ tuần thi của chính môn đó.** Fast Track: hết thứ Tư của tuần kế tiếp.
  Normal: hết Chủ nhật của chính tuần thi. Nên **dời Speaking chỉ đổi hạn Speaking** — ba môn
  đã thi tuần trước giữ nguyên hạn cũ. Trước đây cả đợt dùng chung một hạn, nên dời một môn
  là vô tình gia hạn cho cả đợt.
- **Môn chưa đến tuần thi thì chưa nợ điểm** và không bao giờ bị tô đỏ quá hạn.
- Một đợt có **tuần hoàn tất theo kế hoạch** = tuần của môn thi muộn nhất. Mọi bảng theo tuần
  vẫn đếm mỗi đợt đúng một lần, ở tuần đó.
- Đổi lịch một môn bị **chặn** nếu nó vượt qua đợt MT kế tiếp, và **cảnh báo** (cho xác nhận
  lại) nếu hai đợt chỉ cách nhau một tuần. R/L/W và Speaking của cùng một đợt không bao giờ
  bị gọi là "hai MT quá gần". Phần đã thi hoặc đã có điểm thì không dời được.
- **Trạng thái thi là một xác nhận của người**, không suy từ ô điểm: ô trống có thể là chưa
  chấm, không được đọc thành "em vắng". Và không nhập được điểm vào phần đã vắng hoặc đã huỷ.
- **Không bỏ một môn khỏi phạm vi sau khi đã xác nhận em vắng môn đó** — đường lách để biến
  một đợt thiếu kết quả thành "hoàn tất" đã bị chặn. Lớp Normal luôn phải đủ bốn môn.
- Bộ đếm dời do vắng đếm **riêng từng kỹ năng trong từng đợt**; dời chủ động của Quản lý không
  làm tăng nó. (Luồng duyệt dời là việc 25.)

**Trên màn hình:** màn một lượt MT có thêm thẻ **"Lịch thi theo kỹ năng"** — bốn hàng, mỗi
hàng nói tuần thi, tình trạng, hạn chấm và các nút thao tác của riêng môn đó. Bảng điểm cả lớp
(cả FT và Normal) hiện hạn theo từng môn thay vì một hạn chung.

**Kiểm chứng:** 250 phép kiểm tự động đạt hết; hai lượt kiểm lỗi kiểu dữ liệu sạch; bước nâng
cấp chạy sạch trên database đang có — dựng 460 dòng lịch cho 115 đợt, **không đợt nào bị đổi
tuần**, không dòng vắng nào bị bịa ra, chạy lại lần hai là no-op. Đã bấm thử thật trên trình
duyệt: đổi tuần Speaking chỉ đổi hạn Speaking, Writing giữ nguyên hạn 23/09.

### ✅ Xong — mục 6.1 / 6.2 / 9.4 (việc 22)

**Điểm dưới kỳ vọng sinh TÍN HIỆU, không tự mở case và không tự sinh phương án.**

- Trước đây một môn dưới kỳ vọng tự mở case hoàn chỉnh kèm một phương án ("xếp tự học",
  "học tutor"). Đã bỏ hẳn. Lý do: máy đọc được con số nhưng **không biết vì sao**, và
  **không xếp được tutor thay người** — hai thứ đó làm bảng tổng hợp đầy số mà không có việc
  thật nào đứng sau.
- Nay nó sinh một **tín hiệu**, giao cho đúng một người: giáo viên bộ môn xác minh môn mình,
  GVCN nhận tín hiệu Ý thức/Khác để xem tình hình chung.
- **Hạn xác minh ba ngày, tính cả ngày đầu.** Đếm từ lúc tín hiệu được ghi nhận, không phải
  thứ Hai của tuần thi — điểm nhập muộn không làm giáo viên quá hạn ngay lúc điểm vừa công bố.
- **Tín hiệu không phải case** và không bị đếm chung. Nó có chỗ riêng ở hồ sơ học viên, ở
  hàng việc (nhóm mới "Xác minh tín hiệu") và ở một tổng hợp riêng.
- Nhập bổ sung môn khác, chấm lại hay lưu lại nhiều lần **không nhân tín hiệu và không đặt
  lại hạn**.
- Hạng mục đã có case đang mở thì tín hiệu **tự nối vào case đó** (thêm một mốc), không mở
  case thứ hai. Case đã đóng mà tái diễn thì tín hiệu nằm chờ — mở case mới nối vào case cũ
  là quyết định của người dạy, và kết luận cũ giữ nguyên.
- Mốc Ý thức/Khác **không tự kết luận em thiếu ý thức**. GVCN được ghi nhận "đã xem, không mở
  case" — nhưng phải viết nhận định, không bấm cho xong.
- **Sửa điểm (mục 9.4):** tín hiệu còn chờ mà điểm đã sửa thành đạt thì bị thu hồi với lý do
  "Không còn hợp lệ do sửa điểm". Case chỉ sống nhờ con số vừa sửa thì rút khỏi danh sách
  đang xử lý, phương án chưa ai làm bị huỷ và **không tính thành công hay thất bại**. Case
  còn căn cứ khác thì **giữ nguyên**, chỉ báo người phụ trách xem lại. Không ghi mốc "đã tiến
  bộ" giả — sửa một con số nhập sai không phải một lần thi thứ hai.

**Trên màn hình:** hồ sơ học viên có thêm thẻ **"Tín hiệu chờ xác minh"** đặt trước bảng tiến
độ, với hai nút "Mở case" và "Đã xem, không mở case". Hàng việc có nhóm mới **"Xác minh tín
hiệu"** đứng đầu. Bấm "Mở case" mở form đã điền sẵn đầu mục và kỹ năng — tên và mô tả do người
dạy viết.

**Kiểm chứng:** 257 phép kiểm tự động đạt hết; hai lượt kiểm lỗi kiểu dữ liệu sạch; bước nâng
cấp chạy sạch trên database đang có — dựng tín hiệu ngược từ lịch sử (đều ở trạng thái "đã
thành case"), vô hiệu hoá phương án tự sinh **chưa ai thực hiện**, giữ nguyên phương án đã bắt
đầu hoặc đã xong, không case nào bị đóng hay xoá, chạy lại lần hai là no-op. Đã bấm thử thật
trên trình duyệt cả ba lối ra của một tín hiệu.

### ✅ Xong — mục 12 và mục 13 (việc 27)

**Trang lớp trả lời được hai câu khác nhau, và bảng phân tích không còn chia chéo hai đơn vị.**

- **Hai dạng xem danh sách học viên.** Ngay cạnh chữ "Học viên" có hai nút **Học thuật** và
  **Ý thức**. Học thuật giữ nguyên bảng điểm cũ; Ý thức đổi sang bảng: mỗi hàng là một em,
  mỗi cột là **số đợt** BTVN · Chuyên cần · Tham gia trên lớp · Khác, cộng hai cột hành động
  thật — **đã report gia đình mấy lần**, **đã gửi thư cảnh cáo mấy lần**. Bấm vào số mở hồ sơ
  em để xem các bản ghi tạo ra nó.
- Bảng Ý thức mặc định đếm **từ lúc em vào lớp này**; có nút chuyển sang **toàn hành trình**
  và câu chữ ngay trên bảng nói rõ mình đang nhìn khoảng nào. Chuyển lớp không biến việc của
  lớp cũ thành việc của lớp mới.
- Đếm **đợt**, không đếm từng lần giáo viên báo: nhiều lần báo trong bốn ngày là một đợt.
  Hai cột hành động đếm **lần đã làm thật** — một cuộc gọi nói cả hai chuyện vẫn là một lần,
  và phương án mới dự kiến thì chưa tính.
- **Bảng phân tích vấn đề của lớp** nằm ngay dưới box lớp, **mặc định thu gọn** để không đẩy
  danh sách học viên xuống dưới màn hình. Tab kỹ năng cố định theo chương trình: lớp Normal
  bốn tab L/R/W/S, lớp Fast Track năm tab có cả W1 và W2 — kỹ năng chưa có case vẫn còn tab
  và nói "chưa có case", không lặng lẽ biến mất.
- Mỗi hàng là một **phân loại vấn đề**, kèm năm con số: Case · Phương án · Đang theo dõi ·
  Thành công · Không thành công. Chúng là **năm đơn vị khác nhau** nên bảng không chia chúng
  cho nhau — một case có thể có ba phương án. Tỷ lệ chỉ xuất hiện ở phần mở rộng, theo
  **loại phương án**, luôn hiện n/N trước phần trăm, và mẫu dưới năm thì ghi rõ "mẫu nhỏ".
- **"Chưa đủ dữ liệu" không bị tính là thất bại** và không vào mẫu số. Cách đếm này nằm ở
  đúng một chỗ, dùng chung cho bảng của lớp và cho trang Thực trạng sau này.
- Case **chưa phân loại** có hàng riêng, không dồn vào "Khác" — đó là một tập cần người xử lý.
- Bộ demo nay **có phân loại cho mọi case**. Trước đó 54 case đều trống phân loại, nên bảng
  phân tích chỉ hiện đúng một hàng "Chưa phân loại" — tức là không nói gì cả.
- Danh sách bên ngoài: chưa có kế hoạch thi thì cột **Dự kiến thi** hiện một gạch ngang, không
  phải một nhãn vàng. Nhãn đó trước đây nằm ở gần hết các hàng, và một cảnh báo xuất hiện ở
  mọi hàng thì không còn là cảnh báo.

**Kiểm chứng:** 294 phép kiểm tự động đạt hết, trong đó 8 phép mới cho mục 13.3 và 13.4; hai
lượt kiểm lỗi kiểu dữ liệu sạch; đã bấm thử thật trên trình duyệt cả hai dạng xem và bảng
phân tích của lớp CP-FT 110.

### ⬜ Còn lại — hai nhóm việc

Đây là danh sách việc đã chia sẵn, theo đúng thứ tự phụ thuộc. **Làm từ trên xuống.**

| # | Việc | Mục trong đề bài |
|---|---|---|
| 28 | **Tiến độ công việc, báo cáo kỳ họp, Thực trạng, Toàn cảnh** | 14 · 15 · 16 |
| 29 | **Demo 14 tình huống, kiểm thử, bàn giao** | 18.2 · 20 |

> Mục **19** của đề bài liệt kê sẵn những chỗ code đã phát hiện có vấn đề, kèm tên file.
> Đọc nó trước khi bắt tay vào từng nhóm việc — nhưng **đối chiếu, không vá mù**.

---

## 5. Những điều kỹ thuật dễ vấp

Ghi ở đây để người tiếp theo không mất một buổi mò lại.

| Chuyện | Phải làm thế nào |
|---|---|
| Biên dịch | Dùng **`tsc`**. **TUYỆT ĐỐI KHÔNG** dùng `tsx` hay `esbuild` — cả hai đã từng làm hỏng máy của chủ sản phẩm (Windows) |
| Đường dẫn khi nhập file | Bắt buộc có đuôi `.ts` / `.tsx` trong câu lệnh nhập. Thiếu là gãy |
| Sau khi sửa phần máy chủ | **Bắt buộc** chạy `npm run build:server`, nếu không thì thay đổi không có tác dụng |
| Kiểm lỗi kiểu dữ liệu | `npx tsc -p tsconfig.build.json --noEmit` và `npx tsc -p tsconfig.web.json --noEmit` |
| Chạy kiểm thử | `npm test` — hiện **294 phép kiểm**, phải đạt hết |
| Dựng lại bộ demo | `npm run seed` (xoá sạch rồi dựng lại) · nâng cấp database đang có: `npm run migrate` |
| Bật thử | `npm run dev` → http://localhost:5173 |
| Tắt máy chủ | `for p in 5173 4000; do pid=$(fuser -n tcp $p 2>/dev/null \| tr -d ' '); [ -n "$pid" ] && kill -9 $pid; done` |
| Chụp màn hình | Playwright **không** nằm trong dự án. Cài tạm: `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i -D --no-save playwright`, xong thì `git checkout -- package.json package-lock.json`. Trình duyệt ở `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, phải chỉ đường dẫn này rõ ràng |
| Ngày demo | **14/09/2026** cố định, không lấy ngày thật của máy |
| Quy ước tuần | Thứ Hai → Chủ nhật. Một tuần thuộc về tháng chứa ngày thứ Năm của nó |

---

## 6. Bản đồ tài liệu trong repo

| File | Dùng khi |
|---|---|
| `vong7/BRIEF_OVERHAUL_SAU_PR15.md` | **Đề bài đang làm.** Đọc đầu tiên |
| `BAN_GIAO_VONG6.md` | Báo cáo bàn giao vòng trước — biết hệ thống vừa đổi những gì |
| `CODE_MAP.md` | "Muốn sửa chức năng X thì mở file nào" |
| `DEMO_SCENARIOS.md` | Bấm vào đâu, đăng nhập bằng ai, cần thấy gì |
| `DEMO_ASSUMPTIONS.md` | Những giả định còn chờ chủ sản phẩm chốt |
| `README.md` | Cách chạy, cách dựng lại dữ liệu, danh sách tài khoản |
| `vong4/` | Bộ tài liệu bàn giao cũ, tra khi cần gốc tích một quyết định |

**Tài khoản mở thử nhanh:** `dang.tran.pisa@gmail.com` (Quản lý Bãi Cháy) — mật khẩu
`pisa2026`. Màn Tổng quan của người này đầy đủ nhất. Tài khoản quản trị của chủ sản phẩm:
`dovutuanphong95.pisa@gmail.com`.

---

## 7. Cách chuyển giao — làm đúng ba bước

### Bước 1 — Đảm bảo code đã lên mạng

Việc đang làm phải được đẩy lên nhánh `claude/pisa-progress-local-demo-42ct9j` **trước khi**
đóng chat cũ. Máy ảo chạy chat cũ là máy tạm, nghỉ lâu là bị thu hồi và mất hết.

### Bước 2 — Mở chat mới, dán đúng đoạn này

```
Tiếp tục dự án PISA Progress, repo Pizi147/pisa-tracking.

Trước khi làm gì, đọc hai file này trong repo:
  1. BAN_GIAO_CHAT_MOI.md          — tình trạng hiện tại và việc còn lại
  2. vong7/BRIEF_OVERHAUL_SAU_PR15.md — đề bài đang làm

Nhánh làm việc: claude/pisa-progress-local-demo-42ct9j

Ba ràng buộc của tôi:
1. Tôi KHÔNG BIẾT CODE. Giải thích bằng tiếng Việt, nói cái gì thay đổi trên
   màn hình, đừng nói tên hàm hay tên bảng dữ liệu.
2. Đừng để máy chủ chạy ngầm. Xong việc thì tắt, kiểm cổng 5173/4000 đã trống.
3. Đừng merge, đừng deploy, đừng gửi gì ra ngoài nếu tôi không bảo.

Bắt đầu từ việc số 23 trong danh sách còn lại.
```

### Bước 3 — Kiểm tra chat mới đã hiểu đúng

Hỏi nó ba câu, nếu trả lời đúng cả ba thì yên tâm giao việc:

1. *"Ngưỡng đạt của lớp Normal bây giờ là bao nhiêu?"* → phải trả lời **70%**
2. *"Vai trò Admin chi nhánh còn không?"* → phải trả lời **đã bỏ**, vẫn giữ để đọc lịch sử
3. *"Việc tiếp theo là gì?"* → phải nói về **form case: tên và mô tả bắt buộc, mức độ chỉ còn Cần chú ý / Gấp**

Nếu nó trả lời sai bất kỳ câu nào, bảo nó đọc lại `BAN_GIAO_CHAT_MOI.md` trước khi làm.

---

## 8. Lời khuyên cho chủ sản phẩm

**Đừng giao cả 20 mục một lượt.** Đề bài rất dài; giao từng nhóm việc một, xem kết quả, rồi
mới đi tiếp. Vòng 6 làm theo cách đó và ra được bản dùng được.

**Sau mỗi nhóm việc, bảo nó ba thứ:** chạy kiểm thử, dựng lại bộ demo, và **nói bằng tiếng
Việt** cái gì đổi trên màn hình. Nếu không nói được thành lời thì thường là chưa xong.

**Nhắc nó đừng vá từng màn.** Đề bài nói rõ: một quy tắc chỉ có một nơi sở hữu. Sửa riêng con
số trên một màn hình là cách chắc chắn nhất để hai màn nói hai kết luận khác nhau.

**Giữ nguyên nhánh làm việc.** Đừng để nó tự tạo nhánh mới — lịch sử sẽ vỡ thành nhiều mảnh.

---

*Cập nhật lần cuối: sau việc 22 (tín hiệu thay cho case tự sinh), ngày demo 14/09/2026, 257 phép kiểm đạt.*
