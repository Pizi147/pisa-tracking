> ⚠️ **TÀI LIỆU LỊCH SỬ — KHÔNG PHẢI LUẬT.** Bàn giao hiện hành là `BAN_GIAO.md`; kế hoạch
> đang chạy là `plan.md`. File này chép lại *thứ đã code ở vòng đó*, không phải *thứ đã
> chốt* — đã có một lần tin nó và đi sai (xem `BAN_GIAO.md` mục 5). Chỉ dùng để tra lịch sử.

# Bàn giao sang chat mới — PISA Progress

> Viết ngày **18/09/2026**. Chat trước hết ngân sách giữa chừng, nên file này gói lại
> **đúng những gì đã xong, những gì còn dở, và cách làm tiếp**. Đọc hết file này là đủ để
> bắt tay vào việc, không cần đọc lại lịch sử chat.

---

## 0. Ba ràng buộc của chủ sản phẩm — KHÔNG ĐƯỢC QUÊN

1. **Chủ sản phẩm KHÔNG BIẾT CODE.** Giải thích bằng tiếng Việt, nói *cái gì đổi trên màn
   hình*, đừng nói tên hàm hay tên bảng dữ liệu.
2. **Đừng để máy chủ chạy ngầm.** Xong việc thì tắt, kiểm cổng 5173 và 4000 đã trống.
3. **Đừng merge, đừng deploy, đừng gửi gì ra ngoài** nếu chủ sản phẩm không bảo.

Thêm một câu chủ sản phẩm nhấn mạnh ở đợt cuối:
**LOGICAL · SIMPLE · PRACTICAL · USER-FRIENDLY · INTUITIVE — không mở rộng sang overhaul
toàn hệ thống.**

---

## 1. Dự án là gì

**PISA Progress** — hệ quản lý học vụ nội bộ của trung tâm IELTS PISA, bản demo chạy local.

| | |
|---|---|
| Repo | `Pizi147/pisa-tracking` |
| Nhánh làm việc | `claude/pisa-progress-local-demo-42ct9j` |
| Đề bài đang theo | `vong7/BRIEF_OVERHAUL_SAU_PR15.md` |
| Ngày demo cố định | **14/09/2026** (không lấy ngày thật của máy) |
| Quy ước tuần | Thứ Hai → Chủ nhật; tuần thuộc tháng chứa ngày thứ Năm của nó |

### Tài liệu nên đọc theo thứ tự

1. `vong7/BRIEF_OVERHAUL_SAU_PR15.md` — đề bài gốc, đầy đủ.
2. `BAN_GIAO_CHAT_MOI.md` — bàn giao của các vòng trước (việc 21–29 đã xong).
3. **File này** — trạng thái mới nhất, việc đang dở.
4. `CODE_MAP.md` — muốn sửa chỗ nào thì mở file nào.
5. `DEMO_SCENARIOS.md` — mở hồ sơ nào để xem tình huống nào.

---

## 2. Trạng thái lúc bàn giao

| | |
|---|---|
| `npm test` | **319 phép kiểm — ĐẠT HẾT** |
| `npx tsc -p tsconfig.build.json --noEmit` | sạch |
| `npx tsc -p tsconfig.web.json --noEmit` | sạch |
| Nhánh | `claude/pisa-progress-local-demo-42ct9j`, đã đẩy lên |
| PR đang mở | **#17** — việc 27 · 28 · 29 (chưa merge) |
| Commit cuối | "Hồ sơ học viên bản mới…" (đợt này) |

**Đã bấm thử thật trên trình duyệt** hồ sơ học viên và tab Hành trình — không có lỗi ở bảng
điều khiển trình duyệt.

---

## 3. ĐỢT NÀY LÀM GÌ (đã xong, đã kiểm)

Chủ sản phẩm gửi một ảnh thiết kế ("phương án A") và yêu cầu làm lại hồ sơ học viên theo đó.

### 3.1. Hồ sơ học viên — bố cục mới

- **Đầu hồ sơ gọn lại**: một dòng "Hồ sơ học viên · mã", tên em, rồi một dòng
  "lớp · chương trình · GVCN · mục tiêu". Nút **Lộ trình** (mở dải chọn lộ trình khi cần),
  **+ Case**, và menu **⋮**. **Đầu hồ sơ KHÔNG dính khi cuộn.**
- **Bốn ô số** ngay dưới: *MT gần nhất · Hiện tại · Case đang mở · Việc tiếp theo*.
  Bốn câu hỏi khác nhau, cố ý không cộng thành gì.
- **Bảng kỹ năng** mỗi hàng bốn cột: hạng mục · ô điểm · vấn đề đang theo dõi · việc tiếp theo.
- **Bấm một hàng → case mở ra ngay bên dưới**, mỗi case là **một thẻ đóng mở riêng**.
  Case đang xử lý mở sẵn; case đã hoàn thành gập lại và xếp xuống dưới.

### 3.2. Trong một thẻ case

Giữ đúng cách bày của ảnh thiết kế:

- dòng phân loại vấn đề + ngày mở;
- câu mô tả của người dạy;
- **mỗi phương án MỘT KHỐI BA CỘT**: *phương án là gì · kết quả gần nhất · việc tiếp theo*.
  Nhiều phương án song song thì nhiều khối — đã kiểm với case có 2 PA hạn khác nhau.
- Hạn **làm** và hạn **dự kiến xong** là hai mốc khác nhau, đứng tách dòng.
- Chip ở chân thẻ: các mốc MT, hạn báo kết quả, **Mở lịch sử hỗ trợ**, **Mở trang riêng**.
- **Nhóm Ý thức/Khác có khối riêng cùng phong cách**: hiện **báo cáo nguồn** (ai báo, ngày
  nào, thấy gì) và các hành động đã làm. **Không** áp thang tiến bộ học thuật lên nhóm này.

### 3.3. Ô điểm

- Điểm + kỳ vọng của **chính đợt đó** + chênh lệch ↑ / ↓ / → so với lượt trước.
- **Bốn màu, bốn câu**: dưới kỳ vọng **đỏ** · bằng kỳ vọng **xanh dương** · vượt **xanh lá** ·
  thiếu dữ liệu **xám**.
- **Điểm tăng mà vẫn chưa đạt thì VẪN ĐỎ** — mũi tên nói hướng đi, màu nói đã đạt hay chưa.
- Đường đi qua các lượt (5.0 → 5.5) dùng cùng bốn màu, mỗi mốc so với kỳ vọng của chính nó.

### 3.4. Hành trình — dòng thời gian ngang

Tab **Hành trình học tập** nay là một dòng thời gian ngang, **không còn lặp lại biểu đồ điểm**:

- Trục theo **tuần**, ghi đúng mã tuần của hệ thống: `W2 JUL`, `W3 AUG`… (có năm ở dòng tiêu đề).
- Tầng **Mốc thi**: MT1, MT2 kèm ngày (cố ý **không** gắn điểm của một kỹ năng vào mốc chung).
- **Mỗi case một nhóm**, **mỗi phương án một làn con** với thanh bo góc.
- Vạch tuần nhẹ, có vạch **tuần này**.
- **Mỗi lần ghi kết quả là một mốc ◆ CÓ NGÀY** (rê chuột ra kết quả + người ghi) — không còn
  chấm trắng vô nghĩa.
- Phần sau "tuần này" vẽ **nét đứt** và ghi thẳng chữ **dự kiến**.
- **Hành động Ý thức là một MỐC có tên và ngày** ("Gửi thư cảnh cáo · 08/09"), không vẽ thành
  một khoảng dài — gọi cho gia đình là việc của một buổi.

### 3.5. Sửa nhỏ đã làm

| Việc | Trạng thái |
|---|---|
| Đổi nhãn "Cần nhập điểm MT" → **"Cần nhập điểm Test"** | ✅ xong (cả bộ lọc, trang lớp, trang học viên) |
| Bỏ chữ **"chưa ăn thua"** khỏi màn hình | ✅ xong (chỉ còn trong chú thích code, không hiện ra) |

---

## 4. CÒN DỞ — LÀM TIẾP TỪ ĐÂY

Hai việc trong danh sách sửa nhỏ **chưa kịp làm**. Cả hai đều nhỏ và độc lập.

### 4.1. Nối "Tình hình đơn vị" vào Tiến độ công việc

**Yêu cầu:** trang *Tình hình đơn vị* đã có sẵn (đang nằm trong `/tien-trinh`), cần **nối vào**
trang *Tiến độ công việc* (`/tien-do-cong-viec`).

**Gợi ý cách làm (đơn giản nhất, không nhân bản màn hình):**

- Mở `web/src/modules/worklist/MgmtTasksPage.tsx`.
- Thêm một thanh hai tab ở đầu trang: **Công việc** | **Tình hình đơn vị**.
- Tab thứ hai render lại đúng component đã có: `MeetingBoard` trong
  `web/src/modules/worklist/MeetingPage.tsx` (nó đã được export sẵn, dùng được ngay).
- Giữ nguyên `/tien-trinh` như cũ để đường dẫn cũ không gãy.

### 4.2. Bảng chấm tự chọn tuần xa nhất

**Lỗi:** mở bảng chấm điểm thì nó tự nhảy sang tuần xa nhất thay vì tuần hiện tại.

**Yêu cầu:**
1. Có tham số tuần trên đường dẫn → **giữ nguyên tuần đó**.
2. Không có → chọn **tuần hiện tại**.
3. Bảo đảm tuần đó **luôn nằm trong danh sách chọn được** (đừng để chọn xong lại không có
   trong danh sách rồi rơi về tuần khác).

**Gợi ý chỗ sửa:** `web/src/modules/fasttrack/ScoreSheetPage.tsx` (và bảng lớp Normal
`RegularSheetPage.tsx` nếu nó cũng tự chọn tuần). Tìm đoạn `useEffect` đặt `periodId` lần đầu
— hiện nó lấy phần tử đầu/cuối của danh sách tuần thay vì tuần chứa ngày demo. Ô chọn tuần
dùng `WeekPicker` / `usePeriodWindow` trong `web/src/ui/Filters.tsx`; cửa sổ tuần trượt theo
tuần đang xem nên phải **bơm tuần đang chọn vào danh sách** nếu nó chưa có.

### 4.3. Việc còn lại của cả dự án (từ bàn giao trước)

- Rà các màn phụ theo **mục 17** của đề bài (tiêu chuẩn UI) — đề bài xếp sau cùng.
- Bấm thật bằng tay trên **máy tính bảng và điện thoại**; hiện mới kiểm bằng ảnh ở khổ 390px.

---

## 5. Những điều kỹ thuật dễ vấp

| Chuyện | Phải làm thế nào |
|---|---|
| Biên dịch | Dùng **`tsc`**. **TUYỆT ĐỐI KHÔNG** dùng `tsx` hay `esbuild` — cả hai đã từng làm hỏng máy của chủ sản phẩm (Windows) |
| Đường dẫn khi nhập file | Bắt buộc có đuôi `.ts` / `.tsx`. Thiếu là gãy |
| Sau khi sửa phần máy chủ | **Bắt buộc** `npm run build:server`, nếu không thì thay đổi không có tác dụng (`npm run dev` KHÔNG tự dựng lại máy chủ) |
| Kiểm lỗi kiểu dữ liệu | `npx tsc -p tsconfig.build.json --noEmit` và `npx tsc -p tsconfig.web.json --noEmit` |
| Chạy kiểm thử | `npm test` — hiện **319 phép kiểm**, phải đạt hết |
| Dựng lại bộ demo | `npm run seed` · nâng cấp database đang có: `npm run migrate` |
| Bật thử | `npm run dev` → http://localhost:5173 |
| Tắt máy chủ | `pkill -f concurrently` rồi kiểm `curl localhost:5173` đã tắt |
| Chụp màn hình | Playwright **không** nằm trong dự án. Cài tạm: `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i -D --no-save playwright`, xong thì gỡ và `git checkout -- package.json package-lock.json`. Trình duyệt ở `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` |
| **Sao chép database để thử migrate** | Phải chép **cả ba file** `.sqlite`, `.sqlite-wal`, `.sqlite-shm`. Chép mỗi file `.sqlite` sẽ ra một bản CŨ và bạn sẽ tưởng migrate làm mất dữ liệu |
| Đăng nhập demo | `dovutuanphong95.pisa@gmail.com` (quản trị) · mật khẩu `pisa2026`. Nút "Đăng nhập" ở form là nút **cuối cùng** trên trang (nút đầu là tab) |

---

## 6. Bản đồ code của đợt này

| Muốn sửa | Mở file |
|---|---|
| Bố cục hồ sơ, bốn ô số, hai tab dưới | `web/src/modules/students/StudentDetailPage.tsx` |
| Bảng kỹ năng, thẻ case, khối phương án, ô điểm | `web/src/modules/cases/SkillBoard.tsx` |
| Dòng thời gian ngang của Hành trình | `web/src/modules/students/JourneyTimeline.tsx` |
| Dữ liệu cho thẻ case (phương án, báo cáo nguồn, mốc MT) | `server/src/cases/cases.ts` → `caseCardOf` |
| Quy ước mã tuần `W1 SEP 2026` | `shared/domain/week.ts` (máy chủ gọi lại chính chỗ này) |
| Cách đếm hiệu quả phương án | `server/src/cases/effectiveness.ts` |

**Đã xoá:** `web/src/modules/students/ProgressChart.tsx` — biểu đồ cũ. Điểm nay nằm ở ô điểm
của từng hàng kỹ năng, còn diễn biến theo thời gian nằm ở dòng thời gian Hành trình. Giữ cả
hai là lặp cùng một hình trên một trang.

---

## 7. Cách mở lại và xem nhanh

```bash
npm run dev                 # rồi mở http://localhost:5173
```

Đăng nhập rồi mở **Học viên → MB-FT 101 → Lê Quang Huy**. Đây là hồ sơ dày nhất của bộ demo,
dựng riêng để xem một em nhiều case thì màn hình ra sao:

- **Listening** — case đang xử lý, **hai phương án** (một đang làm quá hạn, một đã xong
  "Tiến bộ một phần"). Đây là ca kiểm "một case có hai PA hạn khác nhau".
- **Reading** — case đã kết thúc, có tiến bộ.
- **Writing Task 2** — phương án cũ thất bại rồi bị thay; kết quả thất bại cũ vẫn còn.
- **Speaking** — case đã đóng rồi **tái diễn**, case mới chưa có phương án.
- **Ý thức/Khác** — hai đợt, có cả report gia đình lẫn thư cảnh cáo.

Bấm tab **Hành trình học tập** để xem dòng thời gian ngang.

Hai case song song cùng một kỹ năng: xem **Đinh Ngọc Quyên** (CP-FT 110) → Writing Task 2.

---

## 8. Lời khuyên cho người làm tiếp

- Đợt này chủ sản phẩm nói rõ: **sửa ít, ưu tiên hồ sơ học viên, không overhaul**. Giữ đúng
  tinh thần đó — hai việc còn dở ở mục 4 là việc nhỏ, đừng biến chúng thành một vòng lớn.
- Mọi thay đổi phải **dùng dữ liệu và backend hiện có**, không reset demo, không đổi luật
  nghiệp vụ.
- Trước khi báo xong: chạy `npm test`, hai lệnh kiểm kiểu dữ liệu, **và bấm thử thật trên
  trình duyệt** — chủ sản phẩm đọc bằng mắt chứ không đọc số phép kiểm.
- Xong việc thì **tắt máy chủ, gỡ Playwright, kiểm cổng 5173/4000 đã trống**, rồi mới báo.
