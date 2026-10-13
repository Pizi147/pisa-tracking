# PR OV-11h — Phân tích · PET / KET (Checkpoint có mặt ở mọi nơi, một tên một số)

Nguồn: đặc tả `docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md` · bước tái hiện: phụ lục `2026-10-14-ra-soat/phan-tich.md` (PT-*), `ho-so-hv.md` (HV-5),
`critique-A1-khung-tong-quan.md` (CA1-1), `impeccable-B-audit.md` (P2-2). Đợt 3, **song song với OV-11g, OV-11i**. Rà: mặc định. Mockup: không cần.

## Đầu ra
1. **[PT-1] PET / KET Checkpoint có mặt ở mọi nơi.** `server/src/classes/phanTichLop.ts:107,137` (`danhGiaMon` nhận `checkpoint`; cột theo số Checkpoint đã có, không rơi về "Progress · Final"),
   hồ sơ GV "Kết quả gần nhất", Phân tích › Giáo viên cột Kết quả môn (cùng `danhGiaMon`), Xuất kết quả từng lượt (`server/src/phanTich/xuatMt.ts:180` thêm `checkpoint`),
   Tổng hợp Test xếp dưới nhóm **"Checkpoint"** (không "Progress Test"). Nhãn môn **L+S / R+W** (tên môn chương trình; `shared/domain/cases.ts:198` `caseCategoryLabel`, `ClassIssueBoard.tsx:30`) — hết mã `listening_speaking`.
2. **[HV-5]** Hồ sơ HV PET / KET: bảng "Tiến độ theo kỹ năng" theo **2 môn** của chương trình (`shared/domain/cases.ts:114-117` `caseCategoriesFor` trả `listening_speaking`, `reading_writing` cho PET / KET);
   + Case và Hành trình cùng nguồn. PET vẫn chỉ chip SOS, không tự tạo Case (luật 11/10 giữ).
3. **[PT-2 · CA1-1]** Tổng hợp vấn đề HV: dòng "15 Case chờ xác nhận nguyên nhân" đổi chữ **"Case chưa phân nhóm nguyên nhân"** (giữ số; Σ hàng + dòng = số Case)
   (`web/src/modules/phanTich/TongHopVanDeHv.tsx:153-157`). Tên "Case chờ xác nhận nguyên nhân" chỉ dùng cho số theo `trangThaiCaseV4` (= Tổng quan 9).
4. **[PT-5]** `server/src/phanTich/vanDeHv.ts:91-104` loại Case đóng vì huỷ lượt (`system_close_reason = 'luot_da_huy'` / lượt `cancelled`) — như mọi nơi khác (OV-4a).
5. **[PT-8]** Đơn vị ngăn danh sách: "lượt MT" (FT) / "bài" (lớp thường), không "đợt Test"; "Case" viết hoa (`shared/domain/metrics.ts:284` `METRIC_UNIT_LABEL`).
6. **[PT-9]** Chú giải cột "Thiếu điểm" ghi "gồm SOS tạm (chưa chốt)".
7. **[PT-10]** Ô chọn Lớp của Phân tích có lớp đã kết thúc có lượt trong khoảng (nhóm "Đã kết thúc") (`PhanTich.tsx:97-100`, `/ref/classes`).
8. **[PT-12]** Link thẳng `/phan-tich?theo=lop` mở sẵn hàng đầu như bấm nút (hai `setParams` không đè nhau — `PhanTich.tsx:69-77`, `TongHopTestSos.tsx:96-101`).
9. **[PT-11 câu]** Hồ sơ GV với vai không xem được (TVV / CX): câu "Hồ sơ giáo viên dành cho Quản lý." (`server/src/giaoVien/phamVi.ts:20` theo vai). (Bỏ "Thử lại" khi 403 làm chung ở OV-11i.)
10. **[P2-2]** 375: số bấm được ở bảng Phân tích (`web/src/modules/phanTich/dungChung.tsx:47` `NutMoDanhSach`) vùng chạm 44 px cả ngang (`max-sm:min-w-[44px]` / `max-sm:px-3 max-sm:-mx-3`), không đổi hình.

## Ranh giới
- Vùng: `server/src/phanTich/*`, `server/src/classes/phanTichLop.ts`, `server/src/giaoVien/phamVi.ts`, `shared/domain/{metrics,cases(:114-117,:198)}.ts`, web `phanTich/*`, `classes/{ClassIssueBoard,PhanTichLopTab}.tsx`,
  `giaoVien/*` (chỉ khối Kết quả gần nhất), `cases/SkillBoard.tsx` nếu cần cho bảng 2 môn. Phép kiểm `server/src/tests/prOv11h.tests.ts`.
- KHÔNG đụng: `classes/*` khác, `StudentsPage` (OV-11g) · `index.css`, `App.tsx`, `ui/*` chung (OV-11i).
- Luật không đổi: PET / KET chỉ chip SOS; CX không phần GV; lượt huỷ không tính; SOS tạm không Case.

## Kiểm
- `prOv11h.tests.ts` (đỏ trước): (1) lớp MB PET 01: Phân tích lớp có cột Checkpoint 1 với 2 bài; `danhGiaMon` checkpoint ≠ null; xuất từng lượt lớp PET > 0 lượt; Tổng hợp không xếp PET dưới Progress;
  (2) `caseCategoriesFor` PET → 2 môn; skill-board em PET có điểm Checkpoint; (3) `vanDeHv` bỏ Case `luot_da_huy` (huỷ lượt → số giảm, khôi phục → như cũ); (4) nhãn đơn vị không còn "đợt Test".
- `npm run check` xanh MỘT lần cuối. Bấm thử MỘT lần (QL, CX; 1440 tối + 375 sáng): Phân tích 5 góc, Phân tích lớp PET, hồ sơ HV PET, hồ sơ GV. Ảnh đính PR.

## Prompt (Opus 5.5 · High; B: Sonnet 5.5 · High)
```
Session CODE cho PR OV-11h (Phân tích · PET/KET), repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất. Không dùng Fable.
Gọi skill karpathy-guidelines. Gõ /ponytail lite (có giao diện). Đọc CLAUDE.md, plan.md mục 1.2, 1.3b, 3, rồi
docs/superpowers/plans/2026-10-14-pr-ov11h-phan-tich-pet.md (làm ĐỦ 10 mục Đầu ra) + phụ lục docs/superpowers/specs/2026-10-14-ra-soat/{phan-tich,ho-so-hv}.md (bước tái hiện).
PORT/WEB_PORT 4327/5500; npm run check tối đa 3 máy cùng lúc. Task ngay trong session (executing-plans, KHÔNG subagent), test-driven-development (đỏ trước), systematic-debugging khi lỗi lạ.
Chạy song song với OV-11g, OV-11i: chỉ sửa file trong mục Ranh giới. Chữ trên web ngắn (nhãn 1–3 từ, không câu giải thích dưới nút/ô).
impeccable: clarify · harden · adapt trong phạm vi PR; /impeccable audit cuối. Bấm thử MỘT lần theo mục Kiểm, ảnh đính PR. /ponytail-review trước khi mở PR.
Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md nếu thêm/xoá file.
Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ≤ 15 dòng.
```
