# PR OV-4a — Huỷ cả lượt MT giữ điểm ẩn + Khôi phục lượt (gồm ca MT4 Nguyễn Minh Ngọc · CP FT 131)

Nguồn: đặc tả OV mục 3.4, 6.5 (câu "Huỷ lượt giữ điểm ẩn…"); mockup đã duyệt `thiet-ke/mockup-overhaul-1-cong-viec-diem-mt-2026-10-11.html`
**§5** (dòng ~567–639: ô "MT2 · Đã huỷ", hộp "Huỷ MT2?", hộp Khôi phục, câu chặn, dòng Admin). OV-4 của đặc tả tách hai PR:
**OV-4a** (này — dữ liệu, rà **sâu**) và **OV-4b** (hộp nhập điểm). Chạy sau OV-1b (#323). Song song được với **OV-4b**, **OV-6b1**.

## Hiện trạng (planning đọc mã 12/10, session code kiểm lại)
- `huyLuot` (`server/src/fasttrack/attempts.ts:1429-1459`, `POST /attempts/:id/cancel`, quyền `ATTEMPT_CANCEL` — Admin không có, phép kiểm
  `prOv2a.tests.ts:186`): `xoaDiemLuot` (`:1306-1340`) **xoá trắng** mọi ô (chỉ nhật ký giữ) → lượt `cancelled` → Phối hợp chờ `removed` →
  Case sinh riêng từ lượt (`caseSinhRieng` `:1415`) đóng `closeCasesBySystem('luot_da_huy')` — bản chụp `chup` trả về **bị bỏ**, không mở lại được.
- "Mở lại lượt" (`reopenAttempt` `:1465-1488`) = về planned, điểm trống. Xếp lại cùng số dùng **lại đúng dòng** (`hoiSinhLuot` `:1183-1208`,
  `UNIQUE(cycle_id, attempt_no)` `schema.sql:538`) và **xoá** `ket_qua_huy` chưa khôi phục (`:1192-1197`).
- Đã có cơ chế cất điểm: `ket_qua_huy` (`schema.sql:1918-1929`: `diem_json`, `lich_json`) + `khoiPhucKetQua` (`fasttrack/ketQuaHuy.ts:29-84`, từ chối
  lượt `cancelled` `:41`); mở lại Case theo bản chụp: `moLaiCaseHeThongDong` (`cases/systemClose.ts:193-225`, lý do nhật ký viết cứng
  "Hoàn tác Kết thúc học"); mẫu lưu bản chụp vào `after_json` nhật ký: `students/students.ts:312-338`.
- Ca **Nguyễn Minh Ngọc · CP FT 131 · MT4** = nhóm 3 `kiem-du-lieu-mt` (`ops/kiemDuLieuMt.ts:85-95`): `ket_qua_huy` (do "dời vượt" PR-MTa) chưa khôi phục
  mà lượt đã huỷ / lượt tạo sau bản chụp → hiện **không đường nào** đưa điểm về; xếp lại MT4 sẽ xoá luôn bản chụp.
- Giao diện: `HopKyNang.tsx:271-272` hiện "Huỷ MT{n}" cho cả Admin; `MockDetailPage.tsx:211` mở "Khôi phục kết quả" theo `canPlanWeek` (Admin bấm → 403);
  lưới Kế hoạch Test **không vẽ** lượt đã huỷ (`keHoach/keHoachTest.ts:306-313`).

## Đầu ra
1. **Huỷ cả lượt MT** (chỉ QL + Quản trị — giữ `ATTEMPT_CANCEL`): điểm **không xoá** mà **cất** vào `ket_qua_huy` (cùng mẫu `diem_json` + `lich_json`)
   → mọi chỗ đọc `assessment_scores` tự không thấy (Overall, SOS, Phân tích, Xuất Excel, hồ sơ HV, Điểm theo lớp) — không lọc từng nơi.
   Lượt `cancelled`. Đóng: Case sinh riêng từ lượt **chưa có kết quả PA** (như nay, kèm PA của nó) · **PA có kết quả gần nhất "Chưa đủ dữ liệu"** (mới) ·
   Phối hợp còn chờ. PA có kết quả khác giữ nguyên. **Ghi danh sách đã đóng** (bản chụp `chup` + id PA + id Phối hợp) vào bản ghi huỷ.
   Lớp thường (`xoaDiemBaiThuong`) không đổi.
2. **Hộp "Huỷ MT2?"** (mockup §5, thay câu một dòng của `HopHuyMt.tsx`): gạch đầu dòng đúng số thật — lịch n kỹ năng tuần … bỏ khỏi Lịch Test và việc chấm ·
   n điểm đã nhập (L 14 · R 16) ẩn đi, không tính Overall, SOS, Phân tích · n Case … đóng ("lượt đã huỷ") · PA … "Chưa đủ dữ liệu" đóng cùng lượt ·
   PA … đang chạy có kết quả giữ nguyên · "Khôi phục được: lịch, điểm và Case trở lại như trước." · Lý do (không bắt buộc) · Thôi | **Huỷ MT2** (đỏ).
3. **Khôi phục lượt** (chỉ QL + Quản trị; đường mới, quyền `ATTEMPT_CANCEL`): lượt, lịch, điểm và **đúng những gì lần huỷ đã đóng** trở lại; nhật ký
   ghi "Khôi phục MT{n}" (sửa lý do viết cứng của `moLaiCaseHeThongDong` thành tham số). Hộp "MT2 · Đã huỷ": "{em} · {lớp} · huỷ 10/10 bởi {người}" ·
   "Khôi phục: lịch W2 OCT, 4 điểm, 1 Case, 1 PA trở lại." · Đóng | **Khôi phục MT2**.
   - **Chặn** khi dòng lượt đã được xếp lại (MT{n} mới đang chạy): "Chưa khôi phục được: đã xếp MT2 mới tuần W4 OCT. Huỷ MT2 mới trước, rồi khôi phục MT2 cũ."
     + link "Mở MT2 mới ↗". Huỷ MT{n} mới xong → hộp Khôi phục cho chọn **bản huỷ nào** khi có > 1 (dòng "huỷ {ngày} bởi {người} · n điểm").
   - Tuần cũ nay vướng thứ tự lượt → vẫn khôi phục điểm, lượt về **"Chưa xếp lịch"** kèm câu nói rõ (như `reopenAttempt`; không để kẹt).
   - Case không mở lại được vì đã có Case mới cùng kỹ năng → khôi phục phần còn lại, hộp nói rõ "1 Case không mở lại: đã có Case Reading mới".
4. **Một đường khôi phục cho mọi bản cất**: Khôi phục lượt đưa lại cả bản `ket_qua_huy` cũ do "dời vượt" còn treo (ca MT4 Nguyễn Minh Ngọc).
   `hoiSinhLuot` **thôi xoá** bản cất khi xếp lại. Nhóm 3 `kiem-du-lieu-mt` chỉ báo bản cất **mồ côi thật** (không báo bản cất do huỷ lượt cố ý).
5. **Kế hoạch Test / hồ sơ lượt / Lộ trình**: ô lượt đã huỷ hiện "MT2 · Đã huỷ" (chữ, không chỉ màu); QL bấm → hộp Khôi phục. **Admin**: không có nút Huỷ
   (`HopKyNang.tsx`), không có Khôi phục (`MockDetailPage.tsx`, `HangLichMt.tsx`); thấy dòng "Chỉ Quản lý khôi phục được lượt đã huỷ."
   Máy chủ vẫn chặn Admin (403) cả hai đường.

## Migrate
`server/src/migrate/prOv4.ts` (tự kiểm, chạy lại không đổi gì; đăng ký như `migrate.ts:281`; cập nhật `schema.sql`): `ket_qua_huy` thêm cột ghi loại bản cất
(`huy_luot` / `doi_vuot`) + `dong_json` (danh sách đã đóng). Dòng cũ = `doi_vuot`. Không đụng dữ liệu khác. Lượt đã huỷ TRƯỚC PR này: điểm đã bị xoá
(chỉ còn nhật ký) — **không dựng lại** từ nhật ký; Khôi phục ra lượt trống như "Mở lại lượt" hiện nay, hộp nói "Lượt huỷ trước 10/2026: không còn điểm để khôi phục".

## Ranh giới (song song OV-4b, OV-6b1)
- Vùng PR này: `fasttrack/attempts.ts` (chỉ `huyLuot`, `xoaDiemLuot`, `heQuaHuyLuot`, `caseSinhRieng`, `reopenAttempt`, `hoiSinhLuot` + hàm mới),
  `fasttrack/ketQuaHuy.ts`, `cases/systemClose.ts`, `keHoach/keHoachTest.ts`, `shared/domain/keHoachTest.ts`, `ops/kiemDuLieuMt.ts`, migrate;
  web `fasttrack/HopHuyMt.tsx`, `test/keHoach/{HopKyNang,HopKhoiPhucKetQua,LuoiKeHoach}.tsx`, `students/HangLichMt.tsx`, phần nút lượt của `MockDetailPage.tsx`.
- KHÔNG sửa (của OV-4b): `cham/LuoiFT.tsx`, `cham/MotKyNang.tsx`, `fasttrack/ODiemLon.tsx`, `ScoreEntry.tsx`, `NhanXet.tsx`, `saveScore` trong `attempts.ts`.
  (của OV-6b1): `lichMt.ts`, `schedule.ts`, `intake.ts`, `platform/*`. KHÔNG làm SOS tạm / chốt (OV-1c).
- Chung tất yếu: `routes/index.ts`, `tests/run.ts`, `tocDoDuong.ts`, `migrate.ts`, `schema.sql`, `CODE_MAP.md`, `plan.md`; `MockDetailPage.tsx` chung với OV-4b → gộp main trước khi mở PR.

## Kiểm
- `server/src/tests/prOv4a.tests.ts` (đỏ trước, đăng ký cuối `run.ts`):
  - Huỷ lượt có L R + 1 Case Reading chờ xác nhận + PA "Chưa đủ dữ liệu" + PA kết quả khác + Phối hợp chờ: điểm biến khỏi Overall, SOS, Phân tích, Xuất Excel,
    Điểm theo lớp, hồ sơ HV; Case + PA "Chưa đủ dữ liệu" + Phối hợp đóng; PA kết quả khác giữ; `ket_qua_huy` có điểm + danh sách đóng.
  - Khôi phục: điểm, lịch, Case, PA, Phối hợp trở lại **đúng như trước** (so bản chụp trước huỷ); làm hai lần lần hai báo đã khôi phục, không nhân đôi.
  - Đã xếp MT{n} mới → chặn đúng câu; huỷ MT{n} mới → khôi phục chọn bản cũ được; tuần cũ vướng thứ tự → lượt "Chưa xếp lịch", điểm vẫn về.
  - Ca nhóm 3 dựng lại (lượt huỷ + bản cất dời vượt treo) → Khôi phục đưa điểm về; `kiem-du-lieu-mt` nhóm 3 không còn báo; xếp lại lượt không xoá bản cất.
  - Admin: 403 huỷ + 403 khôi phục; GV 403. Migrate chạy hai lần không đổi gì.
- Phép kiểm cũ đổi đúng ý (dự kiến `prVn4` VN4-1/2/2b, `prMt:405-460,583-600`, `prMtGon` MTG-3a/b/c, `prMta:139-144`, `prHsm:166`, `prOv1a:76`, `prVn5`,
  `run.ts:721,8542`, `prKiemDuLieuMt:43-58`), KHÔNG xoá cho xanh; mỗi chỗ một dòng lý do trong mô tả PR.
- Turso: giữ trần `TRAN_GHI_LO.huyCaLuot` (120) hoặc nói rõ con số mới; thêm trần cho khôi phục (`tocDoDuong.ts:757`).
- `npm run check` xanh. Bấm thử một lần: QL (1440 tối: huỷ → Kế hoạch Test ô "Đã huỷ" → khôi phục; câu chặn), Admin (375 sáng: không nút). Ảnh `thiet-ke/anh/pr-ov4a/`.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)

```
Session CODE cho PR OV-4a (Huỷ cả lượt MT giữ điểm ẩn + Khôi phục lượt, gồm ca MT4 Nguyễn Minh Ngọc · CP FT 131), repo Pizi147/pisa-tracking,
nhánh mới từ origin/main mới nhất. Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b và 9.0, đặc tả docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md mục 3.4, 6.5, rồi
docs/superpowers/plans/2026-10-12-pr-ov4a-huy-khoi-phuc-luot.md (làm ĐỦ Đầu ra + Migrate) và mockup thiet-ke/mockup-overhaul-1-cong-viec-diem-mt-2026-10-11.html §5.
PR này chạy SONG SONG với OV-4b và OV-6b1: tuân thủ mục "Ranh giới"; PORT/WEB_PORT 4120/5293; `npm run check` tối đa 3 máy cùng lúc.
test-driven-development (prOv4a.tests.ts đỏ trước); systematic-debugging khi lỗi lạ. Đây là luồng dữ liệu: không mất điểm trong mọi nhánh lỗi
(huỷ / khôi phục là MỘT giao dịch). impeccable: `clarify`, `harden`, `adapt` trong phạm vi PR, sau đó `audit` trước khi mở PR.
`/ponytail-review` trước khi mở PR. `npm run check` xanh, bấm thử một lần trên demo (QL 1440 tối, Admin 375 sáng), ảnh vào thiet-ke/anh/pr-ov4a/ và mô tả PR.
Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR.
Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ngắn.
```

## Tự quyết (planning, báo chủ SP)
- **Cất điểm vào `ket_qua_huy`** thay vì lọc từng chỗ đọc (mã có > 10 chỗ đọc theo lượt, số MT kế tiếp tính sai nếu điểm còn nằm trong lượt huỷ).
- Mockup §5 ghi đóng cả PA "chưa có kết quả": làm theo đặc tả — PA chưa có kết quả đóng **cùng Case của nó** (Case chưa có kết quả PA nào); Case đã có
  kết quả PA thì giữ Case, chỉ đóng PA có kết quả gần nhất "Chưa đủ dữ liệu".
- Tuần cũ vướng thứ tự → khôi phục vẫn chạy, lượt về "Chưa xếp lịch" (không chặn). Lượt huỷ trước PR này không dựng lại điểm từ nhật ký.
