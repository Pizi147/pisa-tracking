# PR OV-4c — W / S: ô Band (OVR) tự tính từ 4 tiêu chí; nhập Band thẳng CHỈ ở MT cũ

Nguồn: **chủ SP 13/10** "nhập S và W: gõ tiêu chí thì ô OVR hiện điểm ngay, không bị chặn kiểu vừa nhập 4 tiêu chí vừa nhập OVR; OVR chỉ được nhập ở các MT cũ".
Không mockup mới (ô Band của hộp nhập điểm OV-4b đổi thành ô chỉ đọc theo mẫu đang có). Rà: **mặc định**.

## Hiện trạng (planning đọc main 13/10, session code kiểm lại)
- Hộp nhập điểm (OV-4b, `web/src/modules/fasttrack/HopNhapDiem.tsx:245, 288-294`): **đã** tự hiện Band tính từ tiêu chí khi có ô tiêu chí có chữ (`coTieuChi`);
  bốn ô trống thì ô Band là ô **nhập** (T10, mọi lượt). Bản chính #285 chưa có hộp này (lỗi chặn chủ SP gặp là bản cũ).
- Máy chủ (`server/src/fasttrack/attempts.ts:1928-1933`): nhận `band` thẳng cho W1 / W2 / S ở mọi lượt; band + tiêu chí cùng lúc → 400 "Nhập band hoặc 4 tiêu chí".
- "MT cũ" = lượt `assessment_attempts.lich_su = 1` (`laMtCu`, `shared/domain/lichMt.ts:45`; tạo lượt tuần đã qua).

## Đầu ra
1. W1 / W2 / S ở lượt **không** phải MT cũ: ô Band **luôn chỉ đọc**, hiện Band tự tính ngay khi gõ (đủ 4 tiêu chí → số; thiếu → "—"); không có ô nhập Band.
   Ô đang có band nhập thẳng từ trước (không tiêu chí): vẫn hiện band đó; gõ tiêu chí thì tiêu chí thay band (như nay), xoá được như nay.
2. MT cũ (`lich_su = 1`): giữ như nay — Band nhập thẳng **hoặc** 4 tiêu chí (gõ tiêu chí thì Band tự tính, không chặn).
3. Máy chủ đi cùng: `band` thẳng cho W1 / W2 / S ở lượt không phải MT cũ → 400 câu rõ ("Writing / Speaking: nhập 4 tiêu chí — Band tự tính. Band nhập thẳng chỉ cho MT cũ.");
   `band: null` (xoá band cũ) vẫn nhận. L / R (số câu hoặc band) **không đổi**.
4. Mọi chỗ nhập W / S đi cùng luật (hộp nhập điểm ở lưới lớp, Một kỹ năng, hồ sơ lượt MT, Kế hoạch Test nếu có) — một hàm quyết định "được nhập Band thẳng" dùng chung.

## Ranh giới
- Vùng: `web/src/modules/fasttrack/HopNhapDiem.tsx` (+ chỗ khác nhập W / S nếu có), `shared/domain/chamDiem.ts` (`criteriaPatchFrom` nhận cờ MT cũ),
  `server/src/fasttrack/attempts.ts` (`saveScore` nhánh band). Chạy **sau OV-1d merge** (chung `attempts.ts` `saveScore`, `ScoreEntry.tsx`).
- KHÔNG đổi: L / R, luật "-" / vắng, Mini Test, lớp thường.
- Chung tất yếu: `tests/run.ts`, `CODE_MAP.md`, `plan.md`.

## Kiểm
- `server/src/tests/prOv4c.tests.ts` (đỏ trước): lượt thường W1 band thẳng → 400; 4 tiêu chí → band tự tính lưu đúng; MT cũ band thẳng → lưu; MT cũ 4 tiêu chí → lưu;
  ô có band cũ (lượt thường) gửi tiêu chí → tiêu chí thay band; `band: null` → xoá; L / R band "6.5" vẫn nhận; `criteriaPatchFrom` lượt thường + `bandText` → không gửi band.
- Phép kiểm cũ T10 band thẳng W / S ở lượt thường (`prMta`…) đổi đúng ý — ghi lý do, KHÔNG xoá cho xanh.
- `npm run check` xanh. Bấm thử một lần (GV 1440 tối: hộp W1 gõ 4 tiêu chí thấy Band hiện ngay; MT cũ 375 sáng: nhập Band thẳng). Ảnh `thiet-ke/anh/pr-ov4c/`.

## Prompt (Sonnet 5.5 · High; B: Opus 5.5 · High)

```
Session CODE cho PR OV-4c (W / S: ô Band tự tính từ 4 tiêu chí, chỉ đọc; nhập Band thẳng chỉ ở MT cũ — máy chủ đi cùng), repo Pizi147/pisa-tracking,
nhánh mới từ origin/main mới nhất (đã có OV-1d). Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b và 9.0, rồi docs/superpowers/plans/2026-10-13-pr-ov4c-ovr-chi-mt-cu.md (làm ĐỦ Đầu ra). Không mockup mới. L / R không đổi.
PORT/WEB_PORT 4290/5463; `npm run check` tối đa 3 máy cùng lúc. Tuân thủ "Ranh giới". test-driven-development (prOv4c.tests.ts đỏ trước).
impeccable (skill có sẵn trong repo): `clarify`, `harden` trong phạm vi PR, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần (GV 1440 tối, 375 sáng), ảnh vào thiet-ke/anh/pr-ov4c/ và mô tả PR. Không deploy, không chạm Turso/Netlify.
Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP.
Báo cáo tiếng Việt, ngắn.
```
