# Bối cảnh kỹ thuật — đọc trước khi gõ dòng code đầu tiên

Cập nhật 13/09/2026, sau khi vòng 3b đã merge (`main` = PR #10).

---

## 1. Dự án là gì

Demo nội bộ hệ thống quản lý học vụ + vận hành cho trung tâm IELTS PISA, **5 chi nhánh**:
Monbay (MB) · Bãi Cháy (BC) · Cẩm Phả (CP) · Hải Dương (HD) · Uông Bí (UB).

Chạy hoàn toàn trên máy, không internet, dữ liệu giả.

| Lớp | Bảng điểm |
|---|---|
| **FT** (Fulltime IELTS) | Band IELTS, có lộ trình LT1/LT2, có Mock Test MT1, MT2, MT3… |
| **Normal** = FOU · BE · ELE | Không dùng band. Chấm `đúng/tổng`, đạt từ **60%** |

---

## 2. Công nghệ và lệnh

| | |
|---|---|
| Web | React 18 + TypeScript + Vite 5 (SPA) |
| API | Express 4 |
| Dữ liệu | SQLite qua `better-sqlite3`, file `data/pisa-demo.sqlite` |
| Biên dịch | **`tsc`** với `rewriteRelativeImportExtensions` |

```bash
npm run dev          # build server rồi chạy cả API (4000) và web (5173)
npm run build:server # BẮT BUỘC sau mỗi lần sửa code phía server
npm run seed         # tạo lại toàn bộ dữ liệu demo
npm run migrate      # chạy migration trên database đang có
npm run test         # 161 kiểm tra nghiệp vụ (vòng 3b)
npm run typecheck    # kiểm kiểu cả web và server
```

### Ba cái bẫy đã mất thời gian, đừng vấp lại

1. **KHÔNG dùng `tsx` hay `esbuild`.** Cả hai từng được thử và đều hỏng trên máy Windows của
   owner. Dự án cố ý dùng `tsc`, và vì thế **import phải ghi đuôi `.ts`** (`import { x } from './y.ts'`).
2. **Server chạy JavaScript đã biên dịch trong `dist-server/`.** Sửa code server mà không
   `npm run build:server` thì **không có gì thay đổi cả** — rất dễ tưởng mình sửa sai. Vite tự
   nạp lại phần web, server thì không.
3. **`nowIso()` trả về giờ thật, `demoToday()` trả về ngày demo.** Dùng nhầm thì mọi mốc hạn
   lệch. Ngày demo lưu trong bảng `demo_config`, vòng 4 đặt là **14/09/2026** (thứ Hai).

### Bật / tắt server thủ công

```bash
# bật
nohup node dist-server/server/src/index.js > /tmp/api.log 2>&1 &
nohup npx vite > /tmp/vite.log 2>&1 &

# tắt — cách này chắc chắn, pkill từng thất bại
for p in 5173 4000; do pid=$(fuser -n tcp $p 2>/dev/null | tr -d ' '); [ -n "$pid" ] && kill -9 $pid; done
```

**Owner đã yêu cầu rõ: không để server chạy ngầm.** Chỉ bật khi cần chụp màn hình hoặc chạy thử
một luồng, xong thì tắt và kiểm hai cổng đã trống.

Chromium cho Playwright có sẵn tại `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
Đừng chạy `playwright install`.

---

## 3. Quy tắc nghiệp vụ đã cài trong code

```
Quyền = permission của vai  ×  phạm vi chi nhánh của CHÍNH grant đó  ×  phân công lớp/kỹ năng
```

Chỉ grant có `branch_id = NULL` mới là toàn hệ thống. Bốn vai:
`system_admin` · `branch_admin` · `manager` · `teacher`.

| Quy tắc | Chi tiết |
|---|---|
| Kỳ vọng theo lượt | `expectationDelta(n)`: MT1 = target − 1.0 · MT2 = target − 0.5 · từ MT3 = target |
| Làm tròn | `roundToHalf = Math.round(v * 2 + 1e-9) / 2` |
| Band Writing | `roundToHalf((W1 + W2 × 2) / 3)` |
| Tuần | Thứ Hai → Chủ nhật. Tháng sở hữu tuần = tháng chứa thứ Năm |
| Tuần của một kết quả | **tuần kế hoạch** (`planned_period_id`), không phải tuần làm bài |
| Lớp Normal đạt | `điểm/tổng ≥ 0.6` xét trên **tỷ lệ chính xác**; `25/42` hiện "60%" nhưng **trượt** |

---

## 4. Bản đồ mã nguồn

```
shared/domain.ts            từ vựng trung tâm: kỹ năng, hạng mục, nhãn, hằng số nghiệp vụ
                            → sửa ở đây là chạm vào cả server lẫn web

server/src/
  schema.sql                toàn bộ cấu trúc dữ liệu
  migrate.ts                các bước di trú, chạy được nhiều lần không đổi kết quả
  seed/data.ts              dữ liệu mẫu thô
  seed/seed.ts              dựng database từ dữ liệu mẫu
  routes/index.ts           toàn bộ endpoint. Thứ tự khai báo có ý nghĩa:
                            /attempts/no-plan phải đứng TRƯỚC /attempts/:id
  services/
    sos.ts                  sinh case sau MT, phương án mặc định   ← phase 1 sửa nhiều
    cases.ts                đọc/ghi case                            ← phase 1 sửa nhiều
    contacts.ts             hai việc trao đổi                       ← phase 1 XOÁ
    checkins.ts             "Ghi nhận của GV"                       ← phase 1 XOÁ
    scoring.ts              tính band, kỳ vọng, kỹ năng trượt       ← phase 1 sửa
    summary.ts              bảng tổng hợp                           ← phase 1 sửa (lỗi đếm SOS)
    mywork.ts               hàng đợi "việc của tôi"
    regular.ts              lớp Normal, chấm theo tỷ lệ
    planning.ts             hàng đợi xếp lịch MT
    meeting.ts              việc Quản lý giao, cơ chế toả ra học viên
  tests/run.ts              161 kiểm tra nghiệp vụ

web/src/
  pages/       Overview · Students · StudentDetail · Academic · ClassOverview · ScoreSheet …
  components/  CasePanel · ContactPanel(xoá) · CheckinPanel(xoá) · MockPlanPanel · SummaryTable …
  index.css    .page · .prose-col · .table-scroll · .box-scroll
```

---

## 5. Bẫy SQLite đã gặp

- **Chỉ mục duy nhất một phần** (`CREATE UNIQUE INDEX … WHERE …`) thì câu `ON CONFLICT` **phải
  lặp lại đúng mệnh đề WHERE**, nếu không SQLite báo *"ON CONFLICT clause does not match any
  PRIMARY KEY or UNIQUE constraint"*.
- Đổi cấu trúc bảng thì tạo bảng `_v2` → chép dữ liệu → đổi tên, chứ đừng `ALTER TABLE` liên tiếp.
- Sau mỗi migration: chạy trên **bản sao database thật**, kiểm `PRAGMA foreign_key_check`,
  đếm lại số bản ghi trước/sau, và **chạy lần hai phải không đổi gì thêm**.

## 6. Bẫy khi sửa file bằng lệnh thay chuỗi

Đã có lần một lệnh thay chuỗi **âm thầm không khớp** (số dấu gạch ngang của tiêu đề khác nhau)
nên đoạn code mới không được chèn vào, mà không có lỗi nào báo ra. Sau mỗi lần sửa kiểu đó,
**kiểm lại file đã biên dịch trong `dist-server/`** xem đoạn mới có thật sự ở đó không.

## 7. Kiểm chứng trước khi push

1. `npm run test` — phải xanh.
2. `npm run typecheck` — phải sạch.
3. Chạy thật trên trình duyệt theo **từng vai** (GV · Admin CN · Quản lý · Quản trị hệ thống),
   không chỉ đọc code. Bốn lỗi im lặng của vòng D chỉ lộ ra khi bấm thật.
4. Quét màn hẹp ở **360 · 414 · 820 · 1280 · 1920px**. Kiểm **hai** thứ: trang có trượt ngang
   không, **và** có phần tử nào tự nó rộng hơn khung nhìn mà không nằm trong hộp cuộn không.
5. Tắt server, kiểm cổng 5173 và 4000 đã trống.

## 8. Lịch sử vòng làm việc

| Vòng | PR | Nội dung |
|---|---|---|
| A–D | #5, #6, #7 | Nền tảng, lớp thường, hồ sơ học viên, vấn đề học vụ |
| 2 | #8 | Việc của chính người đang xem; đề xuất–duyệt phương án; phân công GV |
| 3a | #9 | Case gắn với một kỹ năng; hai việc trao đổi ra bảng riêng ← **vòng 4 đảo ngược** |
| 3b | #10 | Giao diện theo vai; bảng tổng hợp; việc Quản lý giao |
| **4** | — | **Đang bắt đầu.** Xem `vong4/02_KE_HOACH_PHASE.md` |
