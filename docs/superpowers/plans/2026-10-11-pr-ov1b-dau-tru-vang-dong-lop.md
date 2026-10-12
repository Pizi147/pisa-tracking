# [x] PR OV-1b — Lỗi 5.2 (dữ liệu thật CP FT RF 01), dấu "-" = Vắng chốt ngay + Bỏ vắng, dòng lớp "phần của bạn"

Nguồn: đặc tả OV mục 3.3, 3.5, 6.5 (`docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md`); mockup đã duyệt
`thiet-ke/mockup-overhaul-1-cong-viec-diem-mt-2026-10-11.html` (phần Lịch Test "phần của bạn", Vắng / Bỏ vắng). Rà: **sâu** (luồng chính, dữ liệu).
Log chủ SP 11/10 (bản chính, chỉ đọc): `kiem-o-lop "CP FT RF 01"` + `kiem-du-lieu-mt` — tóm tắt ở mục 1.

## 1. Nguyên nhân 5.2 (planning đọc log, session code KIỂM LẠI trên mã trước khi sửa)
| Em (lượt) | Log thấy | Nguyên nhân | Biểu hiện chủ SP thấy |
|---|---|---|---|
| Đặng Thị Thảo (MT1) | 5 ô "-" tuần W1 OCT, `no_show_late`=1, đã chốt 08/10, vắng = 1, nhưng `sit_status`=scheduled và tuần vẫn W1 OCT; lịch sử: cả lượt dời **W2 OCT → W1 OCT** lúc 08/10 13:52 | "-" nhập bù được chốt + tự dời sang W2 OCT, rồi người dùng dời lượt về W1 OCT → ô lại `scheduled` ở tuần đã qua, dấu "-" đã chốt không còn tác dụng | đủ "-" vẫn **quá hạn** |
| Nguyễn Công Phượng (MT1) | L, R `sit_status`=**sat** (09/10 12:50), có "-" W1 OCT `late`=1, **chưa chốt**, không điểm | Ô đã thành `sat` (nhập điểm rồi đổi sang "-"?) → `settleNoShows` chỉ chốt ô `scheduled` → "-" kẹt mãi | ô **trống** sau Enter |
| Nguyễn Trâm Anh (MT1 ·LS) | mọi phần thi `cancelled`, lượt vẫn `planned` (kiem-du-lieu-mt nhóm 1 "xác sống") | trạng thái lượt không theo phần thi | "Đã huỷ phần thi" mà hiện **"Đã lên lịch"** |
| dòng lớp vs ô đếm | — | hai hàm đếm khác nhau (`hangLopTuan` vs `oFtXong`, `server/src/cham/canCham.ts`) | dòng "Quá hạn" khi ô đếm 0 |
Ghi thêm: MT cũ (`·LS`) còn W/S `scheduled` không điểm ở tuần đã qua (Bùi Xuân Thành, Hoàng Lương Bằng, Nguyễn Sơn Tùng) — kiểm có bị tính quá hạn không;
nếu có → MT cũ không bao giờ quá hạn (chỉ "chưa nhập"). Nhóm 3 kiem-du-lieu-mt (Nguyễn Minh Ngọc · CP FT 131 · MT4) để **OV-4** (khôi phục lượt).

## 2. Đầu ra
1. **Luật "-" mới** (đặc tả 3.3, chủ SP chốt): gõ "-" hoặc bấm **Vắng** khi tuần thi **chưa hết** → chốt ngay: lần 1 dời tuần sau tuần thi, lần 2 huỷ phần thi.
   "-" **sau khi tuần thi đã hết** (nhập bù) hoặc ở **MT cũ** → **"Không dự thi"**: trạng thái cuối, không dời, không tính lần vắng, không Case, không quá hạn.
   Bỏ đường chờ hết Chủ nhật (`settleNoShows`) và đường "chờ QL hiệu chỉnh" (`flagLateNoShow` / `resolveLateNoShow`) cho dấu mới.
2. **"-" luôn có tác dụng**: gõ "-" vào ô đã `sat` (có điểm trước đó) vẫn ra đúng kết quả mục 1 — không còn ô kẹt / trống sau Enter.
3. **Bỏ vắng** (GV đúng kỹ năng, GVCN, QL; khi ô ở tuần mới chưa có điểm): về tuần cũ, bộ đếm −1. "Không dự thi" gỡ được bằng xoá "-" (luật `duocGoDau` hiện có).
   Đã huỷ phần thi → chỉ QL "Khôi phục phần thi" (đã có).
4. **Dời lượt về tuần có "-" đã chốt** (ca Thảo): dời lượt / dời kỹ năng tới một tuần thì dấu "-" cũ của tuần khác không làm ô thành quá hạn; ô ở tuần mới là ô
   cần nhập bình thường. Không còn trạng thái "scheduled ở tuần đã qua + '-' đã chốt".
5. **Lượt mọi phần thi đã huỷ / không bắt buộc** hiện "Đã huỷ phần thi" (không "Đã lên lịch"), không vào đếm, không chiếm chỗ lộ trình. KHÔNG tự huỷ lượt (huỷ cả lượt là OV-4).
6. **Lịch Test / Chấm Test — dòng lớp "phần của bạn"** (3.5): nhãn đỏ "Quá hạn" chỉ khi ô **của người xem** quá hạn; phần người khác
   "W, S: GV khác · ⚠ quá hạn n ngày" (nhạt). QL / Admin / Quản trị thấy toàn bộ. Số đếm ô trên cùng và nhãn dòng dùng **MỘT hàm** (luật `oFtXong`).
7. **Migrate dọn dữ liệu cũ** `server/src/migrate/prOv1b.ts` (tự kiểm, chạy lại không đổi gì; chạy cùng lần deploy cuối OV):
   - "-" chưa chốt: chốt MỘT lần theo luật mới (trong tuần thi → vắng; nhập bù / MT cũ → Không dự thi).
   - "-" nhập bù đã chốt theo luật cũ (`no_show_late`=1) → Không dự thi; lần vắng do chính dấu đó sinh ra bị trừ lại; lịch không dời thêm.
   - Ô `sat` không điểm mà có "-" (ca Phượng) → như "-" chưa chốt.
   - In danh sách từng ô đổi (em · mã · lớp · lượt · ô · trước → sau). Thêm **lệnh chỉ đọc** `kiem-truoc-ov1b` in đúng danh sách đó mà không ghi,
     để chủ SP chạy trên bản chính trước deploy.
8. `kiem-o-lop`: sửa dòng lịch sử in "undefined" (cột `action` đọc sai); ghi chú cách chạy trên Windows bằng
   `node dist-server/server/src/ops/kiemOLop.js "CP FT RF 01"` (qua `npm run … --` PowerShell chèn `^` vào tên lớp) — cả CODE_MAP và TRIEN_KHAI.

## 3. Ranh giới (song song OV-2a, OV-3a)
- Vùng của PR này: `server/src/fasttrack/absence.ts`, `fasttrack/scoring.ts` (đường lưu "-"), `fasttrack/attempts.ts` (dời lượt), `server/src/cham/canCham.ts`,
  `web/src/modules/test/LichTestTab.tsx`, lưới chấm `web/src/modules/cham/*` (nút Vắng / Bỏ vắng), `server/src/ops/kiemOLop.ts`, migrate mới.
- KHÔNG sửa `shared/domain/people.ts`, `permissions.ts`, `auth.ts`, `App.tsx`, `platform/*` (OV-2a) và `web/src/modules/classes/*`, `ClassRoster.tsx`,
  `BangDiemLopThuong.tsx`, `TabHocVienLop.tsx` (OV-3a). Chung tất yếu: `run.ts` (một dòng), `plan.md`, `migrate.ts` (một dòng đăng ký).
- Không làm OV-1c (SOS tạm → chốt) và OV-4 (hộp nhập điểm, huỷ/khôi phục lượt).

## 4. Kiểm
- `server/src/tests/prOv1b.tests.ts` (đỏ trước), dựng lại **đúng 4 ca thật** ở mục 1 trên DB test + các luật mục 2:
  "-" trong tuần lần 1 dời / lần 2 huỷ phần thi; "-" nhập bù và MT cũ = Không dự thi (không dời, không đếm, không Case, không quá hạn);
  "-" trên ô `sat`; Bỏ vắng về tuần cũ −1; dời lượt về tuần có "-" đã chốt; lượt xác sống không "Đã lên lịch"; dòng lớp = ô đếm cho GV, QL;
  migrate prOv1b trên DB dựng 4 ca → đúng trạng thái sau, chạy lần hai không đổi; `kiem-truoc-ov1b` không ghi gì.
- Phép kiểm cũ về `settleNoShows`, `flagLateNoShow`, `resolveLateNoShow` đổi theo luật mới — đổi đúng ý, KHÔNG xoá cho xanh; mỗi chỗ một dòng lý do trong mô tả PR.
- `npm run check` xanh. Bấm thử demo 1440 + 375 tối: GV và QL, gõ "-" trong tuần / nhập bù / MT cũ, Bỏ vắng, dòng lớp. Ảnh `thiet-ke/anh/pr-ov1b/`.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)

```
Session CODE cho PR OV-1b (lỗi 5.2 + dấu "-" = Vắng + dòng lớp "phần của bạn"), repo Pizi147/pisa-tracking, nhánh mới từ main.
Không dùng Fable. Đọc CLAUDE.md, plan.md mục 1.2–1.3b, rồi docs/superpowers/plans/2026-10-11-pr-ov1b-dau-tru-vang-dong-lop.md
(làm đủ Đầu ra; mục 1 là chẩn đoán của planning từ log thật — kiểm lại trên mã trước khi sửa, lệch thì ghi vào báo cáo),
đặc tả OV mục 3.3, 3.5 và mockup overhaul-1 (Lịch Test phần của bạn, Vắng / Bỏ vắng). Dùng superpowers:systematic-debugging cho 4 ca thật,
viết prOv1b đỏ trước. Code logic: ponytail full; phần web: `/ponytail lite` trước khi sửa.
Chạy song song với OV-2a và OV-3a: tuân thủ mục "Ranh giới"; PORT/WEB_PORT riêng (vd 4090/5263); `npm run check` tối đa 3 máy cùng lúc.
impeccable: `clarify`, `harden`, `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần trên demo (1440 + 375, tối), ảnh vào thiet-ke/anh/pr-ov1b/ và mô tả PR. Không deploy, không chạm Turso/Netlify,
không chạy migrate trên bản chính. Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ngắn.
```
