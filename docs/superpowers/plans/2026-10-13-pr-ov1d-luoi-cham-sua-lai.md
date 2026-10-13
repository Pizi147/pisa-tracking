# PR OV-1d — Lưới chấm FT: ô đã dời vì vắng bấm được (Bỏ vắng tại chỗ) · em đã Kết thúc học / Lưu trữ không còn báo chờ

Nguồn: **chủ SP 13/10** (ảnh lưới chấm CP FT 140 MT2 — "W3 OCT không sửa lại được"; CP FT 131 MT3 em Lê Hà Vy đã Lưu trữ vẫn hiện "Chờ 4 kỹ năng").
Planning rà main 13/10: luật "-" chốt ngay + dời (OV-1b) và nút **Bỏ vắng** (hộp nhập điểm OV-4b) đã có và có phép kiểm (`prBv` V1–V16, `prOv1b`); còn **2 lỗi** dưới.
Không mockup mới (ô / hàng theo mẫu sẵn có: nút ô "Vắng → W3 OCT", `row-muted` của lưới lớp thường). Rà: **sâu** (đảo dữ liệu điểm).

## Hiện trạng (planning đọc mã main 387c64dd, session code kiểm lại)
1. Xem lưới **đúng tuần gốc** (Lịch Test theo tuần): ô đã dời vì vắng vẽ bằng `oKhacTuan` — chữ "W3 OCT", **không bấm được** (`web/src/modules/cham/LuoiFT.tsx:51, 263-266, 311`:
   `khacTuanFt` xét trước, `noShow` null vì khác tuần). Nút Bỏ vắng chỉ tới được từ Điểm theo lớp (không lọc tuần) hoặc tuần đích.
2. Em **Kết thúc học / Lưu trữ** vẫn có hàng ở lưới chấm FT: `classScoreSheet` chỉ lọc `a.status != 'cancelled'` (`server/src/fasttrack/attempts.ts:2104`),
   ô vẫn sửa được (`editableSkills`/`luotQuyen` `:203, :328`), Kết quả "Chờ n kỹ năng". Số đếm (Chờ bạn chấm, n/m bài, nợ) **đã** loại em (`HV_DANG_HOC_SQL`,
   `cham/canCham.ts:470`, `worklist/scoreDebt.ts:52`, phép kiểm `S6F-a (2b)`). Lưới lớp thường đã làm mờ (`LuoiThuong.tsx:441`), lưới FT chưa.

## Đầu ra
1. Ô đã dời vì vắng ở lưới tuần gốc: hiện nút ô **"Vắng → W3 OCT"** (cùng mẫu ô `daChot` ở Điểm theo lớp), bấm mở **hộp nhập điểm** có **Bỏ vắng** / Lưu điểm — đúng
   quyền `duocGoDau` hiện có (GV đúng kỹ năng / GVCN / QL; vắng lần 2 chỉ QL "Khôi phục phần thi"). Người không có quyền: ô chỉ đọc kèm chữ "Đã dời sang W3 OCT".
   Ô dời vì lý do khác (dời tay, đổi lịch) giữ như nay.
2. Em không còn đang học (`HV_DANG_HOC_SQL` — **cùng một điều kiện** với số đếm): hàng **mờ**, ô **chỉ đọc**, cột Kết quả **"Đã kết thúc học"** / **"Lưu trữ"**
   (không "Chờ n kỹ năng", không SOS tạm). Máy chủ chặn ghi điểm cho em này (400 câu rõ: "Em đã kết thúc học — Học lại / Bỏ lưu trữ trước khi nhập điểm").
   Em Học lại / Bỏ lưu trữ → hàng trở lại bình thường. Không huỷ lượt, không xoá điểm cũ.
3. Không đổi luật "-" (OV-1b), không đổi số đếm.

## Ranh giới
- Vùng: `web/src/modules/cham/LuoiFT.tsx`, `web/src/modules/fasttrack/HopNhapDiem.tsx` (chỉ nhận mở từ ô dời), `server/src/fasttrack/attempts.ts`
  (`classScoreSheet` trả cờ em không còn học; `saveScore` chặn), `server/src/fasttrack/absence.ts` **không đổi luật**.
- KHÔNG sửa: luật vắng / dời (`absence.ts`), số đếm (`canCham.ts`, `scoreDebt.ts`), vùng OV-9 / OV-10a / OV-10c.
- Chung tất yếu: `tests/run.ts`, `tocDoDuong.ts` (nếu thêm câu đọc), `CODE_MAP.md`, `plan.md`.

## Kiểm
- `server/src/tests/prOv1d.tests.ts` (đỏ trước): lưới tuần gốc trả ô dời có đủ dữ liệu để mở hộp (`daChot`, `doiSang`, quyền gỡ) → Bỏ vắng từ đó về tuần gốc, lần vắng −1;
  GV kỹ năng khác → không có nút / 403; em Kết thúc học + em Lưu trữ: hàng có cờ, ô chỉ đọc, Kết quả "Đã kết thúc học" / "Lưu trữ", ghi điểm → 400; Học lại → ghi được;
  số đếm Chờ bạn chấm không đổi (khớp `S6F-a (2b)`).
- `npm run check` xanh. Bấm thử một lần: GV 1440 tối (lưới tuần gốc: bấm "Vắng → W3 OCT" → Bỏ vắng), QL 375 sáng (hàng em đã Lưu trữ mờ). Ảnh `thiet-ke/anh/pr-ov1d/`.

## Prompt (Opus 5.5 · High; B: Sonnet 5.5 · High)

```
Session CODE cho PR OV-1d (lưới chấm FT: ô đã dời vì vắng bấm được để Bỏ vắng tại chỗ; em đã Kết thúc học / Lưu trữ: hàng mờ, chỉ đọc, không báo "Chờ n kỹ năng"),
repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất. Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b và 9.0, rồi docs/superpowers/plans/2026-10-13-pr-ov1d-luoi-cham-sua-lai.md (làm ĐỦ Đầu ra). Không mockup mới. Không đổi luật vắng / dời.
PORT/WEB_PORT 4280/5453; `npm run check` tối đa 3 máy cùng lúc. Tuân thủ "Ranh giới". test-driven-development (prOv1d.tests.ts đỏ trước).
impeccable (skill có sẵn trong repo): `clarify`, `harden` trong phạm vi PR, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần (GV 1440 tối, QL 375 sáng), ảnh vào thiet-ke/anh/pr-ov1d/ và mô tả PR. Không deploy, không chạm Turso/Netlify.
Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP.
Báo cáo tiếng Việt, ngắn.
```

## Tự quyết (planning, báo chủ SP)
- Em đã thôi học / lưu trữ: **giữ hàng mờ** (không ẩn) để QL còn thấy điểm cũ; nhập điểm phải Học lại / Bỏ lưu trữ trước.
