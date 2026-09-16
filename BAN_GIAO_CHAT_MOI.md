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
| Commit mới của vòng 7 | `0fa1fee` — mục 11 và 3.1 |

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

### ⬜ Còn lại — chín nhóm việc

Đây là danh sách việc đã chia sẵn, theo đúng thứ tự phụ thuộc. **Làm từ trên xuống.**

| # | Việc | Mục trong đề bài |
|---|---|---|
| 21 | **Lịch test theo kỹ năng** — một đợt test có lịch, phạm vi yêu cầu, trạng thái thi và hạn chấm **riêng từng kỹ năng**; điểm vẫn thuộc một đợt duy nhất. Hạn chấm FT hết thứ Tư sau tuần thi của chính kỹ năng đó, Normal hết Chủ nhật tuần thi | 10.1 · 10.4 · 10.5 · 10.7 · 18.1 |
| 22 | **SOS chỉ sinh tín hiệu** — bỏ hẳn việc tự sinh case hoàn chỉnh và phương án; tín hiệu phải được giáo viên xác minh trong **3 ngày** | 6.1 · 6.2 · 9.4 |
| 23 | **Case: form, phân loại, mức độ, gộp đợt Ý thức/Khác** — tên và mô tả bắt buộc, mức độ chỉ còn **Cần chú ý / Gấp**, phân loại bắt buộc; Ý thức/Khác gộp theo **cửa sổ 4 ngày** | 6.3 · 6.4 · 7 |
| 24 | **Phương án hỗ trợ** — danh mục theo nhóm, form mới, **bảng hạn**, cập nhật hai tab, một nút hoàn thành case | 8 · 9 |
| 25 | **Dời lịch, vắng, duyệt, khôi phục** — bộ đếm dời theo **kỹ năng trong từng đợt**, lần đầu GVCN, lần hai cần Quản lý duyệt | 10.2 · 10.3 · 10.6 |
| 26 | **Overhaul hồ sơ học viên** ⭐ *ưu tiên cao nhất* — bảng tiến độ theo kỹ năng, **bấm hàng mở ngay bên dưới**, menu FT đúng bốn mục | 4 · 5 |
| 27 | **Trang Học viên, nhập danh sách, tạo lớp, hồ sơ lớp** | 12 · 13 |
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
| Chạy kiểm thử | `npm test` — hiện **235 phép kiểm**, phải đạt hết |
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

Bắt đầu từ việc số 21 trong danh sách còn lại.
```

### Bước 3 — Kiểm tra chat mới đã hiểu đúng

Hỏi nó ba câu, nếu trả lời đúng cả ba thì yên tâm giao việc:

1. *"Ngưỡng đạt của lớp Normal bây giờ là bao nhiêu?"* → phải trả lời **70%**
2. *"Vai trò Admin chi nhánh còn không?"* → phải trả lời **đã bỏ**, vẫn giữ để đọc lịch sử
3. *"Việc tiếp theo là gì?"* → phải nói về **lịch test tách theo từng kỹ năng**

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

*Cập nhật lần cuối: sau commit `0fa1fee`, ngày demo 14/09/2026, 235 phép kiểm đạt.*
