# Đợt sau deploy 30/10 — Tốc độ / dòng đọc Turso · Panel có thông tin · dọn tồn

Ngày: 30/10/2026 · Người soạn: PTA Plan · Nguồn: hỏi đáp với chủ SP 30/10 + 3 báo cáo rà (tốc độ, panel, việc còn sót — tóm ở mục 7).
Chủ SP: "cứ thong thả, còn lâu mới deploy" — không có hạn, nhưng giữ thứ tự ưu tiên dưới đây.

## 1. Vì sao làm đợt này

- **Turso:** gói Free, mốc 500 triệu dòng đọc / tháng. Tháng 10 đã ~800 triệu (phải trả phí); ngày thường cũ ~7–8 triệu, đỉnh 28/10 92 triệu;
  sau deploy 30/10 chỉ lướt vài trang đã 3,4 triệu. **Giữ < 450 triệu / tháng** (chủ SP) → PTA nhắm **< 8 triệu / ngày**.
- **Chậm:** mỗi trang 1,5–5,6 s (log Netlify): `/my-work` 1,7–5,6 s · 72–80 câu; `/hoc-vien-lop` 4,0 s · 74 câu; `/classes/:id/viec-theo-em` 3,9 s · 78 câu;
  `/notifications` 1,9–3,0 s · 27–29 câu · 7 464 dòng; `/tong-quan/v5` 1,5–2,0 s · 68 câu; `/phan-tich/bao-cao` 1,8 s · 70 câu; `/classes/:id/overview` 2,9 s · 57 câu.
  Chủ SP: "ở đâu chậm cũng khó chịu"; trang dùng nhiều nhất là **Học viên & Lớp và các trang con** (hồ sơ lớp, việc theo em, điểm theo lượt, hồ sơ HV).
- **Panel:** nhiều panel chỉ hiện tên HV, không có lý do em nằm trong danh sách; vài panel thừa chữ.

## 2. Mục tiêu · không làm · coi là hỏng

Mục tiêu (đo được):
- Mỗi GET thường ≤ 30 câu, ≤ 2 000 dòng trả về, ≤ 1 s trên Netlify; `/notifications` ≤ 15 câu, ≤ 500 dòng; `/classes/:id/*` không chạy `myWork` của cả chi nhánh.
- QL mở 6 trang (Tổng quan, Học viên & Lớp, hồ sơ lớp, Công việc, Phân tích, Kế hoạch Test) ≤ 100 nghìn dòng Turso đọc (đo trên Turso Top Queries sau deploy).
- Mọi đường đã sửa có trần câu + dòng trong `server/src/tests/tocDoDuong.ts` (không tăng lại được).
- Panel: **mỗi dòng cho thấy chính lý do em đó nằm trong danh sách** (chủ SP "đúng ý"); bỏ chữ giải thích dài, chỉ giữ ⓘ khi cần.

Không làm: Tutor · deploy (chủ SP tự bảo) · gộp các tệp migrate cũ vào schema gốc (rủi ro: bản sao lưu cũ không nâng cấp được — chủ SP 30/10 "rủi ro thì thôi") ·
mốc Test tiếp ở thẻ lớp hồ sơ GV · lưới Case đầu hồ sơ HV · bảng Overall 375 · sổ tay PDF (bỏ hẳn, chỉ giữ Hướng dẫn web).

Coi là hỏng dù chạy đúng: số ở hai nơi lệch nhau (một nguồn, một hàm tính) · việc đã xong còn báo chờ / quá hạn ở đâu đó vì không tải lại ·
panel có thông tin mới mà làm tăng đọc Turso đáng kể khi chỉ vẽ ô số · mất thao tác cũ.

## 3. Luật mới (chủ SP 30/10, đã ghi CLAUDE.md + plan.md 1.4 / 9.0)

Mọi kế hoạch, mockup, code, rà PR: hỏi "đọc bao nhiêu dòng / câu mỗi lần mở trang"; đọc đúng phạm vi (lớp / em / kỳ), không đọc cả chi nhánh rồi lọc,
không gọi trùng, lưu xong chỉ tải lại phần đổi; đường > ~30 câu / ~2 000 dòng hoặc tính năng tăng đọc → cảnh báo chủ SP kèm ước số dòng / ngày + cách nhẹ hơn.

## 4. Các khối việc (thứ tự ưu tiên; chủ SP: "cái nào trước cũng được")

### Khối 1 — TOC-DO (4 PR, chỉ máy chủ + web, không đổi giao diện)
Nguyên nhân đã kiểm trong mã (báo cáo tốc độ): số câu (mỗi câu một lượt mạng ~25 ms) và đọc cả phạm vi rồi lọc.
1. **CHUONG-NHE** — `/notifications`: `dongBoKhiMoChuong` (`server/src/.../thongBaoTuDong.ts:131`) → `viecMuon` → `myWork` nạp mọi lượt trong phạm vi xem (Quản trị = cả hệ thống) chỉ để lấy việc `mine`.
   Sửa: `myWork` cho thông báo chỉ đọc lớp người xem được phân công (`teacher_assignments`); QL / Quản trị không dạy → không đọc lượt.
   Mốc chặn 5 phút đang giữ trong bộ nhớ tiến trình (Netlify mở tiến trình mới) → nếu còn vượt trần, lưu mốc vào DB.
2. **LOP-1-LOP** — `viecTheoEmCuaLop` (`viecTheoEm.ts:47`) chạy `myWork(nguoi:'tat-ca')` cả chi nhánh rồi lọc một lớp; route bỏ qua `?chi=toi`.
   Sửa: truyền `classId` xuống `myWork` → `listAttempts({classId})`, tôn trọng `?chi=toi`. `DauTrangLop.tsx:105` gọi thêm `/my-work?nguoi=tat-ca&branchId` chỉ để ra badge
   → lấy từ dữ liệu viec-theo-em (cùng hàm đếm). Việc không gắn lớp (`classId null`) phải giữ đúng.
3. **VO-HIEU-HEP** — sau lưu điểm `LuoiThuong.tsx:169`, `ScoreEntry.tsx:187` (và các `invalidate` tiền tố rộng khác) tải lại cả `/classes` + `/my-work` (~250 câu / đợt lưu).
   Sửa: chỉ vô hiệu đường của đúng lớp / lượt vừa đổi. **Ràng buộc:** số đầu trang (đếm việc, quá hạn) vẫn phải đúng sau lưu — tải lại phần đếm nhẹ của đúng lớp, không để "việc đã xong còn báo chờ".
4. **QUET-THEO-KY** — `listAttempts` (`attempts.ts:766–787`): vế `OR (planned_period_id IS NULL …)` của `kemChuaTuan` làm bỏ chỉ mục `idx_attempt_o_cho_lop` → tách `UNION ALL` (giữ thứ tự, không trùng).
   `/phan-tich/giao-vien` `napBai` (`giaoVien.ts:128`): `class_id IN (cả chi nhánh)` + `EXISTS` từng lượt → đi từ `attempt_skills` theo kỳ (`idx_attempt_skills_period`).
   Báo cáo (`BaoCao.tsx:49-50`) gọi cả `/tong-quan/v5` lẫn `/phan-tich/bao-cao` → một request. Cũng xét `/hoc-vien-lop`, `/tong-quan/v5` (`diemCuaLuot` cả phạm vi), `/classes/:id/overview` (chưa đo riêng).
   Đo EXPLAIN QUERY PLAN trước / sau trên DB thử.
- Mỗi PR: trần mới trong `tocDoDuong.ts` (câu + dòng, vai QL và Quản trị), mô tả PR ghi số câu / dòng trước → sau của từng đường. Rà sâu `/code-review high` (logic máy chủ).
- `luuPhanCong` ~23–29 câu / lớp (ghi chú `ponytail:` TRAN_GHI_LO) và `suggestCaseOwner` / `huyNhieuLenh` nhiều câu mỗi em: gộp vào khối này nếu cùng tệp, không thì ghi backlog.

### Khối 2 — PANEL có thông tin + BANG-EM-GON (mockup trước, chủ SP duyệt rồi mới code)
Gốc (đã kiểm): hầu hết ô số (`OSo`, `PhanTram`, `SoLieu`) mở panel chung `NganDanhSach` (`web/src/ui/SoLieu.tsx:159`); dòng HV do `rowsFor('hoc-vien')` (`server/src/worklist/metrics.ts:208`) dựng, chỉ trả "tên · lớp".
- **Mẫu dòng HV có điểm** (đề xuất PTA, chủ SP duyệt nguyên tắc): `Tên · MT3 · W2 OCT · L 6.0 · R ▼5.0 · W ▼5.5 · S 6.5 · Overall ✗ 5.5 / KV 6.5` — chỉ tô kỹ năng hụt + dấu ▼ (không chỉ màu),
  chữ "tạm" nếu lượt chưa chốt; ẩn lớp khi tiêu đề panel đã ghi lớp. Dùng lại `DiemDong` (`SoLieu.tsx:60`, panel "Đạt Test · lớp" hồ sơ GV — mẫu đang ổn).
- Sửa một chỗ được nhiều panel: `rowsFor('hoc-vien')` thêm cờ kèm điểm (dùng `latestAttempts` / `standingFor` đã nạp — **không thêm câu khi chỉ vẽ ô số**; mở panel ở trang khác Tổng quan được ≤ ~4 câu) ·
  `NganDanhSach.veDong` (`SoLieu.tsx:345-372`): không bỏ `sub` khi dòng có `em` (lỗi mất "Tăng / Giảm / Cải thiện"), không lặp tên em, ẩn lớp trùng tiêu đề ·
  `metricResponse` (`metrics.ts:450`) đưa `chiTiet` (người, hạn) vào dòng · `ChipSos` nhận `soLieu` để hộp "Vì sao SOS" có số.
- Panel cụ thể (top 10, báo cáo panel): SOS 1/2/3 · lớp / SOS hiện tại · Đạt MT (`baoCao.ts:337` — dữ liệu 4 kỹ năng có sẵn) · Dưới kỳ vọng · Bài quá hạn nhập điểm
  ("MT2 · R · thi W2 OCT · ⚠ quá 6 ngày · Hà chấm", bỏ lặp) · Tiến bộ kỹ năng / PA cải thiện (chip ▲ / ▼ / Cải thiện) · Kết quả MT · HV cần chú ý (hồ sơ GV, Phân tích GV) ·
  Panel một em (thêm "▼ R 5.0 · W 5.5 · Overall 5.5 / 6.5") · Cần bổ sung đánh giá ("n PA chưa có kết quả ⓘ", dòng không còn cả dòng là link) · Xét lại lộ trình (khối "Khi lưu, web sẽ" 4 dòng → 1 dòng + ⓘ) ·
  Thi tháng này · lớp (thêm ngày thi) · nhãn Bàn giao ngắn lại.
- **Panel duyệt Công việc QL** (v8, quyết định 3): chân Lưu / Duyệt dính, "Lịch sử · n", chip SOS ở "Chờ bạn duyệt" — cần máy chủ gửi thêm; tính dòng đọc trước.
- **BANG-EM-GON** (hồ sơ lớp, bảng em): quá nhiều ô màu (SOS đỏ, từng ô điểm kỹ năng đỏ, hạn đỏ, WL, Dự kiến). Hướng: chỉ việc cần làm có màu; điểm kỹ năng chữ thường, chỉ tô kỹ năng dưới Target; chip SOS nhỏ lại. Cùng mẫu với dòng panel.
- Mockup: một tệp `thiet-ke/v10/` (1440 + 375, tối + sáng, đủ trạng thái: đủ điểm, thiếu kỹ năng, lượt tạm, rỗng, lỗi) gồm mẫu dòng panel + 4–5 panel tiêu biểu + bảng em. Cổng critique ≥ 35 (bộ nhớ "Cổng chất lượng mockup").

### Khối 3 — Phân công GV (đã có đặc tả + kế hoạch duyệt)
`docs/superpowers/plans/2026-10-30-phan-cong-gv.md`: PR-A đã merge (#714). PR-B (bàn giao đổi GV + luật chủ SP 30/10 "kỹ năng cùng GV thì không cần bàn giao") ‖ PR-C (góc web) → PR-D.
Thêm vào mỗi PR: luật dòng đọc (mục 3) — góc tải một lần theo chi nhánh đã có trong kế hoạch; `luuPhanCong` gom câu theo lô nếu chưa làm ở khối 1.

### Khối 4 — SUA-NHO (một PR nhỏ, ảnh cặp)
- (a) giữ nút "Xếp nhiều MT…" như web (D4) · (b) công tắc "Fast Track 4" theo mockup, 375 "Lọc ▾" cùng hàng · (c) `HopKyNang`: "Xóa" vào ⋯ ·
  (d) `ErrorState` chung → dải `.bao-loi` mockup v8 (nền đỏ nhạt, ⚠, chữ trái, Thử lại phải) — mọi màn.
- Quyết định 2: tên trang / tab "Kết quả Test" ở Phân tích → **"Kết quả Test / Thi"** (chứa cả MT và tab Thi thật) + bản Anh.
- Quyết định 4: Quản trị "Chưa có kỹ năng" tính cả người đang được phân công dạy (QL không vai GV).
- Quyết định 5: cho sửa thông tin liên hệ em tạm dừng ở Lưu trữ.
- Quyết định 6: `ChonLop` hiện lớp sai loại **mờ + lý do ngắn**, không chọn được (thay vì ẩn).
- Nhãn nhật ký "Mở lại" ↔ nút "Khôi phục" (lượt lớp thường) thống nhất một tên.
- Nếu cùng tệp: tồn critique-sau (`HanPhu` hạn xa ở Công việc TVV; tiêu đề dòng Chấm Test 375 gãy), `DeadlinePill` ở cột Trạng thái.

### Khối 5 — Dọn
- **CHECK-NHANH** (quyết định 1): (a) phép kiểm tự dựng dữ liệu nhỏ, (b) dọn dữ liệu phình sau các tệp kiểm, (c) gỡ phép kiểm cũ trùng (chỉ khi có phép khác phủ). **Không** (d).
  Mục tiêu check đầy đủ ≤ ~50 % thời gian hiện nay (~19 phút). Nguồn `docs/superpowers/specs/2026-10-29-ra-soat-dem/gon-ma.md` mục 3.
- Mã chết: `SkillBoard`, `BangSos`, `DeleteViolationConfirm` trùng, `?mo-viec=`, `moveableSkills` web không đọc.
- Backlog v8: dòng Overall FT ở tab Phân tích hồ sơ lớp (máy chủ) · V8-PT: thẻ "Thời gian thường mất", số thẻ chỉ số bấm được, "Xem Toàn bộ" khi rỗng, ⋯ 375, thẻ 375 Ý thức · token `--text-dim/--text-faint` lệch mockup 3–6 đơn vị.
- ra-ui-5 / ra-ui-6 còn mở (cần kiểm lại trên web trước khi làm): ô S hồ sơ lượt 375 lệch cột, "vắng W2 SEP" lặp, cột L·R·W·S ở HV & Lớp, Target "— · KCK" gãy…
- ra-luong để sau: K6 lưới vắng (chỉ mục + migrate), K8, K14, K20, K21, K23, K39, K42a chuông 50 dòng; [XM] tên nhóm "Bài thi Speaking tuần này" chứa cả bài chấm chéo quá hạn.
- `prEn` đỏ khi chạy riêng (thứ tự phép kiểm).
- **plan.md:** chép luật 30/10 vào 1.6 (panel Lịch thi một danh sách thi gần nhất trước #706 · thùng rác 30 ngày · luật Phân công GV); gạch ~30 mục mục 4 đã xong (danh sách trong báo cáo rà sót).
- Việc chủ SP tự làm: xoá DB `pisatracking-261027`, `261028` (~06/11); gỡ ứng dụng ~14 GB.

## 5. Quyết định chủ SP 30/10 (giữ nguyên chữ)
1. CHECK-NHANH: a, b, c làm; d "có rủi ro quá không? nếu có thì thôi" → không làm. · 2. "Sửa lại thành kết quả Test / Thi là ok". · 3–10. "như bạn khuyên" (mục 4 khối 2, 4, 2 không-làm).
Luật dòng đọc (mục 3). Nguyên tắc panel (mục 2). Thứ tự: "cái nào trước cũng được, cứ thong thả".

## 5b. PTA tự quyết sau khi người làm đọc thử (30/10 — chủ SP xem khi duyệt)
1. **Trần áp cho mọi đường trong log mục 1**, không chỉ đường 4 PR chạm: thêm PR thứ 5 **TRANG-LON** cho `/my-work` (Công việc), `/hoc-vien-lop`, `/tong-quan/v5`,
   `/classes/:id/overview` nếu sau 4 PR vẫn vượt trần. Đo: trần câu trong `tocDoDuong.ts` trên bộ demo (như hiện nay — số câu không phụ thuộc cỡ dữ liệu khi đọc đúng phạm vi);
   dòng: so `[cham]` trước / sau trên DB thử; mốc 100 nghìn dòng Turso chỉ đo sau khi chủ SP deploy (ảnh Turso 2–3 ngày).
2. **Kỹ năng hụt** = dưới kỳ vọng TỪNG KỸ NĂNG của chính lượt đó (cùng hàm SOS / `danhGia` đang dùng); thi thật so Target. Ví dụ mục 4 khối 2 là minh hoạ, không phải số thật.
   Lớp thường: hiện % từng môn, ▼ môn trượt (cùng hàm kết quả lớp thường). BANG-EM-GON dùng cùng luật.
3. **Badge đầu hồ sơ lớp giữ nghĩa cũ** (QL thấy số quá hạn của cả lớp, mọi GV) — không đổi con số người dùng thấy; máy chủ trả số đếm toàn lớp nhẹ trong đường của lớp (một lớp, không cả chi nhánh), cùng hàm đếm với Công việc.
4. **Dòng điểm trong panel lấy đúng lượt làm em vào con số** (Đạt MT → lượt MT trong kỳ đã dùng để tính %; bài quá hạn → lượt đó; SOS → lượt đang tạo SOS). Dùng dữ liệu hàm tính con số đã nạp;
   không có sẵn thì nạp khi MỞ panel (≤ ~4 câu), không khi vẽ ô số.
5. Danh sách dọn: mục 4 plan.md đã xong → phụ lục A dưới đây; ra-ui còn mở → đọc `docs/superpowers/specs/2026-10-29-ra-soat-dem/ra-ui*.md` + `critique-sau.md`, kiểm trên web trước khi làm (nhiều mục đã xong ở v8 / #676 / #681 / #685).
6. "Mở lại" ↔ "Khôi phục": dùng **"Khôi phục"** (đúng tên nút; một khái niệm một tên) ở nhật ký + bản Anh.

## 6. Để người làm kế hoạch tự quyết
- Chia PR trong khối 2 và 5 (một màn một PR với PR đổi bố cục; sửa ở thành phần chung có thể một PR).
- Có lưu mốc đồng bộ chuông vào DB hay không (chỉ khi CHUONG-NHE chưa đạt trần).
- Cách đo trước / sau (EXPLAIN trên DB thử, log `[cham]`).

## 7. Nguồn
- Báo cáo tốc độ, panel, việc còn sót: tóm vào các mục trên (agent chỉ đọc, 30/10). Script EXPLAIN đã dùng trong scratchpad phiên PTA (tạm).
- `plan.md` mục 4 khối "30/10 — chủ SP chốt", `docs/superpowers/plans/2026-10-29-ban-giao-pta-dem.md`, `docs/superpowers/plans/2026-10-30-phan-cong-gv.md`.

## Phụ lục A — mục plan.md mục 4 đã xong, gạch khi dọn (rà sót 30/10, đã kiểm bằng PR / mã)
- Khối "30/10 — chủ SP chốt": mục 5 (tồn ra-ui 375) xong ở #676, #681; mục 7 Q-RL4 xong #695, Q-RL5 chủ SP giữ — còn văng 401.
- SÁNG 27/10, ĐÊM 27/10, DEPLOY-UX R1: M4 / M5 / M6 → #638 #643 #644 #653; "Để sau" P8 / NO-CU / do-khung → #633 #642 #651.
- V5: SUA-NO-RA #562 (gồm phần để lại CV-LOI #499, LUAT-5 #495) · CHAM-LAI #564 · SUA-CHAM-LAI #567 · UI-HV-LOP-TVV #566 · TEN-CHI-SO #609.
- OV · OV-13 (13q #436) · ĐÁNH GIÁ 20/10 · OV-14 (OV-15g #480, 15h #481 #482).
- Sau deploy: PR-TD4 → TD4 #399 + S1–S5 + khối 1 đợt này. Sau OV: PR-EN → #590 #599 #608.
- Ghi chú không chặn: HOP1 → #686 · SL1 `case_giao` → #686 (`?lop=`, badge cố ý — K43, K44) · MT0 W1 + W2, "Nhắc tất cả" (K43) · lớp thường "Không dự thi" → #695 ·
  `prefers-color-scheme` (`CongTacGiaoDien.tsx`) · "Sổ tay lỗi thời" (bỏ sổ tay, quyết định 9) · KCK / `prOv11e` · libsql song song → #702 #703.
- OV-12: "góp ý tuần rời trang" hết ý nghĩa (D14 góp ý tuần chỉ đọc). Bàn giao 27/10 mục 5: 7 việc xong (#658 #660 #661 #667 #668). Bàn giao 29/10: Q-RL2 → #700 #701 #705; XL-2 → #702.
- Còn mở trong ghi chú OV-11 (plan.md ~452–458, [đoán] — kiểm khi PR chạm vùng đó): hai thanh chip panel Nhập điểm · dòng gộp "1 em" · tiêu đề PanelViec · Khôi phục xoá dấu "-" ·
  Kế hoạch Test lọc theo em · đánh dấu đã đọc lô 20 · chương trình QT tự tạo · Xuất "theo đợt" lớp thường · `api.ts` nhận 403 theo câu chữ.
