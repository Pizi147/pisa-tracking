# OV-15 — Overhaul 6 PR chạy song song (19/10/2026)

Nguồn duy nhất cho các session code OV-15a…f. Quyết định: `docs/superpowers/specs/2026-10-18-ov14-thiet-ke-tong-the-design.md`
(mục 0–5 + **mục 6 chốt 19/10** + mục 7 dưới) · yêu cầu gốc chủ SP `docs/superpowers/specs/nguon/2026-10-18-ov14-prompt-tong-hop.md` (C01–C31) ·
mockup ĐÃ DUYỆT `thiet-ke/mockup-ov14-{1..6}-*.html` (mockup 6 = các sửa 19/10, thắng mockup 1–5 khi khác nhau).

## 0. Luật chung (mọi PR)

- Model Opus 5.5 (KHÔNG Fable). Một PR một session. Nhánh từ `origin/main` mới nhất. Không deploy, không chạm Turso / netlify.
- CLAUDE.md + plan.md mục 1.2, 1.4, 9.0 (nhất là **dòng đọc Turso**: không `SELECT *` thừa, không subquery tương quan mỗi dòng, cột lọc mới có chỉ mục,
  mô tả PR ghi số câu + dòng đọc trước → sau của đường chạm — `tocDo.run.ts`).
- `/ponytail lite` (có giao diện), impeccable `clarify` / `harden` / `adapt` trong phạm vi, `/impeccable audit` + `/ponytail-review` trước PR.
- test-driven-development: phép kiểm `server/src/tests/prOv15<x>.tests.ts` gọi cuối `run.ts`, đỏ trước. Logic web khó kiểm → tách hàm thuần ở `shared/`.
- Chữ trên màn = chữ mockup (nhãn 1–3 từ, không câu giải thích dưới nút). Bản EN đủ (`shared/i18n/en/ov15<x>.ts`). Sửa Hướng dẫn của màn chạm.
- **Hạn chỉ ghi ngày** (`hạn 18/09`, không thứ) — OV-15a đổi hàm chung; PR khác dùng hàm đó, không tự định dạng.
- 6 PR chạy CÙNG LÚC: chỉ sửa file trong phạm vi mình; cần đổi file chung (index.css, ui.tsx, run.ts, en.ts, schema.sql, migrate.ts, plan.md, CODE_MAP.md)
  thì chỉ THÊM, không sắp lại. Trước `npm run check` cuối: `git merge origin/main`, xung đột giữ cả hai.
- `npm run check` xanh MỘT lần cuối (exit 139 / 0xC0000005 = sập libsql → chạy lại). Bấm thử MỘT lần màn chạm: 1440 tối + 375 sáng, vai chạm;
  ảnh `docs/anh/pr-ov15<x>/`. Session cloud: Playwright `npx playwright install chromium` nếu chưa có Chrome; demo `npm run seed`, đăng nhập
  `POST /api/demo/session {userId}` (admin 1, QL 2, GVCN 7, GVBM 9, GV Writing 10, TVV 23, CX 24).
- Mô tả PR ≤ 30 dòng: làm gì, phép kiểm, dòng đọc trước → sau, ảnh, `ponytail:`, điểm còn mở. Một dòng mục 11 plan.md. CODE_MAP.md nếu thêm file.
  Session cloud KHÔNG nhắn được về planning: cuối mô tả PR ghi "Sẵn sàng rà — PTA Plan".

## 7. Quyết định thêm 19/10 (sau mockup 6)

- **Màu trang đậm hơn như mockup**: các lớp nền tách rõ (nền trang tối hơn, thẻ / bảng sáng hơn một bậc, viền rõ hơn), chữ phụ ≥ 7 : 1 cả sáng lẫn tối.
- **Báo cáo = tab đầu của Phân tích**: Báo cáo · Test + SOS · Kết quả thi · Hiệu quả PA · Phân tích GV · Ý thức; Tổng quan QL có nút "Báo cáo ›" mở thẳng.
- Mockup 6 duyệt cả 4 điểm tự chọn: bằng kỳ vọng không mũi tên (hộp điểm lẻ ghi "Kỳ vọng MT1 5.5"), nút thoát ghi "Đóng", Kết quả thi nổi OVR + Kỳ vọng / Target
  (thi thật không ✓ / ✗ ở L R W S), ô Bước tiếp "Chưa chọn" mở menu 4 mục.

---

## OV-15a — Nền: màu, chữ, ký hiệu, chip SOS, hàng, thanh trên, hạn

Phạm vi file: `web/src/index.css`, `tailwind.config.js`, `DESIGN.md`, `web/src/ui/ui.tsx` (Level / SCORE_CHIP / Nhan), `web/src/ui/Nhan.tsx`, `web/src/lib/format.ts`
(sosTone), `shared/domain/hienThiNgay.ts` + hàm hạn (`deadlineView`…), thanh trên trong `web/src/App.tsx` + menu tài khoản, `ODiemLon.tsx` (DauKyVong).
1. Token (mockup 1 mục 1a + mục 7): nền tách lớp; chữ phụ ≥ 7 : 1; 5 nghĩa; tách `--sos1/2/3-*` khỏi `soon/late/bad`; thêm `--da-thi-*`; bỏ `wait` (tím) và `chon-*` (teal)
   — mọi nơi dùng chuyển sang token mới (phép kiểm `prSang` S4–S6 cập nhật). Chạy validator màu (đã đo trong mockup 1: tối `#d6b828 · #e8702a · #e64aa0`,
   sáng `#8a6a00 · #e06a10 · #b5125e`).
2. Chip SOS MỘT component: chỉ viền vàng / cam / đỏ, dày 1 / 1,5 / 2,5 px, SOS 3 viền đôi, SOS tạm viền đứt, kèm kỹ năng ("SOS 2 · R, W"). Bấm chip = hộp giải thích
   (tiêu đề → kết luận đậm → số → việc), KHÔNG nút `?` cạnh. Thay mọi chỗ (~20: ui.tsx, LuoiFT, LuoiThuong, ClassRoster, BangHocVienLop, BangSos, HocVienTheoVai,
   PanelMotEm, StudentDetailPage, CasePanel, WorkList, BangCanHoTro, SkillBoard, ChuongLop, HanhTrinh, DauHoSo, TongHopTestSos, TabHocVienLop, KetLuanKhoa) — chỉ đổi cách gọi.
3. Ký hiệu điểm: ✓ / ✗ SVG trơn (không vòng tròn); bằng kỳ vọng ✓ xanh dương, vượt ✓ xanh lá, dưới ✗ đỏ; "Chưa đủ điểm" chỉ chữ. Bỏ "thiếu / vượt" và "=".
   Chỗ không có cột kỳ vọng (hộp nhập điểm lẻ): ▲ / ▼ cạnh điểm + "Kỳ vọng MT1 5.5" một lần. Xu hướng (Hành trình): chữ "Tăng 0.5 / Giảm 0.5 / Không đổi".
4. Quá hạn chỉ chữ cam + ⚠ (không chip); bỏ chip "Quá hạn" / "Cần làm" lặp trên dòng việc.
5. Hàng: đã thi = nền `--da-thi` cả hàng + vạch trái 3 px + chip "Đã thi · chờ KQ" / "Có KQ · chờ bước tiếp" (cùng `trangThaiSauThi`); đang chọn = viền khung 2 px accent
   (thắng mọi nền); hàng mờ giữ.
6. Chữ: thang 12 / 13 / 14 / 16 / 20; đầu cột 12 không in hoa; ô bảng 13; số căn giữa + `tabular-nums`, chữ dài căn trái. Sửa DESIGN.md (frontmatter + mục Colors / Typography).
7. Thanh trên: Giao diện (Theo máy / Sáng / Tối — mặc định theo `prefers-color-scheme` khi chưa chọn), Ngôn ngữ, Hướng dẫn vào menu tài khoản.
8. Hạn chỉ ngày ở hàm chung → mọi nơi.
Kiểm: phép kiểm tương phản (nenGiaoDien.tests) cho token mới; do-khung mọi kịch bản không thêm lỗi.

## OV-15b — Lưới điểm, hồ sơ lớp, cột điểm, dán Excel, đường Nhập điểm

Phạm vi: `web/src/modules/cham/*`, `fasttrack/LuoiFT*`, `HopNhapDiem.tsx`, `ScoreEntry.tsx`, `students/ClassRoster.tsx`, `students/BangHocVienLop.tsx`, `test/TabDiemLop.tsx`,
`test/TestPage.tsx`, `test/LichTestTab.tsx`, `students/StudentsPage.tsx` (menu ⋯ hàng lớp), server `cham/*`, `classes/classes.ts` (roster).
1. Lưới một component cho panel việc / hồ sơ lớp / trang nhập (mockup 2): mở từ việc → chỉ cột của việc + Kết quả, con trỏ ô trống đầu; "Cả lớp" mở đủ; 4 dáng ô
   (cần nhập = khung rỗng · có điểm · của người khác chưa có · "-"/Vắng); cột Kỳ vọng + Overall nổi bật; W đậm, W1 / W2 ô nhập.
2. **Dán từ Excel** (C15): nút + `?` 6 bước; cặp `Tên | điểm | nhận xét | …` (FT L · R · W1 · W2 · S; một kỹ năng: Tên · điểm · nhận xét); có / không hàng tiêu đề;
   chọn Số câu / Band cho cả lô; khớp tên bỏ dấu, trùng → chọn em; xem trước trong panel (mới / ghi đè trước→sau / lỗi); nhóm nguyên nhân dưới kỳ vọng chọn tại chỗ;
   lưu dòng hợp lệ (một lần lưu = một mục lịch sử), dòng chưa đủ là nháp; trống ≠ 0 ≠ "-". Máy chủ: endpoint lô dùng lại kiểm ô hiện có (band, nhận xét bắt buộc MT).
3. Hồ sơ lớp (C12 + mockup 6 khung 2): OVR · L · R · W1 · W2 · S, KHÔNG W tổng; cột "Đợt"; hàng MT cũ mờ hẳn + chữ nhỏ hơn; một hàng = một lượt.
4. Học viên & Lớp mở lớp FT (C13): OVR · L · R · W · S (W1 · W2 dòng phụ mờ), căn giữa.
5. Bỏ tab "Điểm theo lớp" (C16): ⋯ hàng lớp → "Nhập điểm" mở panel nhập tại chỗ (chọn lượt / môn trong panel); hồ sơ lớp nút Nhập điểm; link cũ `/test/diem-lop?lop=` → panel lớp đó.
6. Lịch Test (C14): mặc định khung có bài của người xem; cả hai khung có bài → hiện cả hai (không giấu lớp thường sau công tắc).
7. **"Nhập bởi … / Marked by …"** chỉ hiện khi ô ĐÃ có điểm — chủ SP thấy chữ này trên web thật khi chưa ai chấm: tìm mọi nguồn (người chấm mặc định `gvMacDinh`,
   ô chỉ có nhận xét, "GV chấm chéo", Lịch Test, hộp chấm, Chấm Speaking) và sửa; phép kiểm.

## OV-15c — Kế hoạch Test: Xóa, năm, tìm, ghi chú, xuất

Phạm vi: `web/src/modules/test/keHoach/*`, `KeHoachTestTab.tsx`, `HopKyNang.tsx`, `HangLichMt.tsx`, server `keHoachTest.ts`, `fasttrack/skillSchedule.ts`,
`fasttrack/attempts.ts` (chỉ `huyLuot` + nơi gọi), `migrate/prOv15c.ts`, `ops/kiemTruocOv15c.ts`.
1. **Huỷ = Xóa** (mục 6): nút **Xóa** ở chân hộp lịch ngay phải "Đóng" = `boTuanLuot` (về Chưa xếp, lịch sử giữ); QL **và Admin** làm được (mở quyền cho Admin);
   đã có điểm / đã thi → mờ + "Đã có điểm — không xóa được"; hộp hỏi "Xóa lịch MT4 của Đỗ Trọng Tiến? Đợt về Chưa xếp, lịch sử vẫn xem được."; nút thoát "Đóng".
   **Bỏ "Huỷ MT{n}"** ở mọi nơi web (⋯ hộp, panel Lộ trình). Ngoại lệ: huỷ vì **vắng 2 lần** giữ, menu "Khôi phục → Chưa xếp" / "Giữ huỷ".
   Trước khi sửa: liệt kê mọi luật đọc `status = 'cancelled'` / `huy_vang` (Case, PA, nợ điểm, SOS, số MT, MT0, xuất, phân tích) trong mô tả PR; không để hai luật
   chọi nhau. Dữ liệu cũ: KHÔNG đổi (lượt đã huỷ trước đây giữ như lịch sử); lệnh chỉ đọc `npm run kiem-truoc-ov15c` đếm lượt huỷ cũ theo loại để chủ SP xem.
2. Năm cạnh tuần ở Kế hoạch Test, hộp lịch, xuất: `W4 AUG/2026` (C20).
3. Ô "Tìm lớp, học viên hoặc email…" (C18): kết quả chia Lớp / Học viên (tên · lớp · email), chọn em → mở lớp + cuộn tới hàng; có / không dấu.
4. Ghi chú lịch thi (C21): bảng mới (học viên × lượt MT; tác giả, lúc, lịch sử), migrate CHỈ THÊM bảng `prOv15c`; một dòng dưới chip, sửa tại chỗ; ô trong hộp lịch;
   ghi chú lớp dưới bảng. Không là lệnh dời.
5. Xuất Excel Kế hoạch Test 13 cột (C17, mockup 4) + **Xuất điểm Test** (mockup 6 khung 9): "Điểm + nhận xét" / "Chỉ điểm"; theo tuần / theo lớp (nhiều MT) /
   lớp + khoảng tuần; em học 2 lớp = một hàng, cột Lớp ghi cả hai. Dùng thư viện `xlsx` có sẵn; ô chữ người nhập ghi dạng văn bản (chống công thức).

## OV-15d — Công việc, Tổng quan, thông báo

Phạm vi: `web/src/modules/congViec/*` (trừ PanelChamSpeaking chỉ đổi theo token), `web/src/modules/tongQuan*` / `KhoiCanXuLy.tsx`, `worklist/*` server,
`platform/audit.ts` (notify), `HangTab.tsx`.
1. Công việc một danh sách (mockup 2 mục 3): bỏ 4 tab; "Chờ bạn duyệt" đầu khi có; nhóm theo loại, xếp theo hạn; lọc người (Của tôi · Của GV ▾ · Tất cả) + chip "Quá hạn";
   việc chưa có người phụ trách lộ rõ + "Phân công…"; KHÔNG nút Nhắc nào (bỏ "Đã nhắc" ở HangTab).
2. Hàng đợi GV: GV vào thẳng Công việc (bỏ Tổng quan của GV); lưu xong tự sang việc kế (chỉ sau lưu thành công, lỗi giữ nháp, có "‹ việc vừa xong"); hết việc "Xong hết hôm nay ✓".
3. Tổng quan QL A (mockup 3): dải tóm tắt nhỏ dẫn tới việc · Cần bạn quyết (Chờ duyệt, Case chưa chốt PA quá hạn, Bước tiếp sau thi, **Chốt lộ trình** khi có) ·
   Lớp cần chú ý · Tuần này; nhãn chốt (Lớp cần chú ý, HV cần chú ý, Case chưa chốt PA / Case trống PA, "21 HV / 34 Case" hai vùng bấm); bấm số → panel làm việc
   (C02, cùng hàm đếm); nút "Báo cáo ›" mở Phân tích tab Báo cáo.
4. Thông báo tự động thay Nhắc (C03): bài quá hạn chấm của chính GV (một thông báo / lớp · đợt), Case chưa chốt PA quá hạn (GVCN), Chốt lộ trình tới hạn (QL);
   dedup theo đối tượng, tự hết khi việc xong, bấm mở đúng việc. Không email / push.

## OV-15e — Phân tích + Báo cáo + Kết quả thi + Phân tích GV + phân trang

Phạm vi: `web/src/modules/phanTich/*`, server `phanTich/*`, component phân trang mới `web/src/ui/PhanTrang.tsx`, `dieuHuong.ts` (mục Phân tích trên thanh trên).
1. Phân tích thành mục thanh trên; tab: **Báo cáo** · Test + SOS · Kết quả thi · Hiệu quả PA · Phân tích GV · Ý thức; tối đa 2 tầng.
2. Bộ chọn thời gian chung (C29): `2 tuần vừa qua · Theo tuần (Từ–Đến) · Theo tháng · Tùy chọn`, có năm, giữ khi đổi tab, URL ngày đầu–cuối; ô "Xếp theo" riêng (Q6b).
3. Báo cáo (mockup 3): mặc định 2 tuần hoàn chỉnh vừa qua; khối Test · SOS theo lớp (đổi ± chữ trung tính) · Kết quả Mock Test · HV cần chú ý · Case / PA;
   bấm số → panel kết quả cụ thể (C26); in / chiếu nền sáng một trang A4 ngang; không khung Đã thi – Chờ KQ.
4. Kết quả thi (mục 6 + mockup 6 khung 6): tab Mock Test / Thi thật; Mock xếp theo Lớp / Mức SOS; thi thật theo lớp; cột như mục 6; đếm theo lượt ("n lượt · m HV").
5. Phân tích GV (mục 9.1 prompt nguồn, mockup 3): giữ chiều sâu bảng cũ; bấm chỉ số → panel đúng GV + thời gian; `0/20` vẫn mở 20 mục.
6. **Phân trang** component: mặc định 10, chọn 20 / 50, thanh ở đầu + cuối bảng; áp ở mọi bảng Phân tích + panel số liệu. (Học viên & Lớp / Case dùng ở OV-15f.)

## OV-15f — Lịch thi (rà soát thi thật) + Xuất danh sách HV + phân trang danh sách

Phạm vi: `web/src/modules/students/*` MỚI (`GocLichThi.tsx`, `NganXuatDs.tsx`) + chỗ gắn ở `StudentsPage.tsx` (chỉ thêm góc / nút), server `classes/hocVienLop.ts`
(chỉ thêm), `fasttrack/cycles.ts` (sửa dự kiến thi — dùng hàm có sẵn), `cases` danh sách (phân trang). Chờ OV-15e có `PhanTrang.tsx` thì dùng; chưa có thì tạo cùng
API (tên, props) như mục OV-15e 6 rồi gộp khi merge.
1. Học viên & Lớp › **Lịch thi** (mockup 5, phương án D): chọn Tháng dự kiến thi (một / nhiều); em có tháng đó + em chưa có dự kiến; cột Kết luận (Giữ tháng · Chốt ngày ·
   Chuyển tháng · Cần xác nhận) sửa tại hàng → lưu `learning_cycles` qua hàm có sẵn (quyền như cột Dự kiến thi, lịch sử như cũ); "Đã chuyển sang 12/2026" giữ tới khi rời trang;
   dải đếm đầu bảng; chỉ thi thật; "Cần xác nhận" không tạo việc; lối "Lịch thi thật ›" từ Test › Lịch Test.
2. **Xuất Excel danh sách** (C31, mockup 5): nút "Xuất Excel · n HV" ở Học viên & Lớp + panel danh sách; kế thừa bộ lọc (SOS · Cơ sở · Lớp; Bộ lọc thêm);
   "Toàn bộ đang lọc" / "Đã chọn"; mẫu Cơ bản · Theo dõi SOS · Kết quả thi + Chọn cột; cùng truy vấn danh sách (không logic SOS riêng); sheet "Thông tin xuất";
   một hàng một em (2 lớp → cột Lớp ghi cả hai); 0 em → không tải file.
3. Phân trang 10 / 20 / 50 (đầu + cuối) cho Học viên & Lớp (theo em trong góc phẳng, theo lớp ở góc nhóm) và danh sách Case.

---

## Prompt (dán vào session cloud — mỗi PR một session, chạy song song)

| PR | Model | Effort | Vì sao |
|---|---|---|---|
| OV-15a nền | Opus 5.5 | **High** | ~20 chỗ chip + token dùng chung; lỗi ở đây lan mọi màn |
| OV-15b lưới + Excel | Opus 5.5 | **XHigh** | dán Excel ghi điểm hàng loạt (không gán nhầm em, trống ≠ 0), luật nhận xét MT |
| OV-15c Kế hoạch Test | Opus 5.5 | **XHigh** | đổi luật Huỷ = Xóa (nhiều luật đọc `cancelled`), migrate bảng ghi chú |
| OV-15d Công việc + Tổng quan | Opus 5.5 | **High** | luồng chính, số đếm cùng hàm, thông báo tự động |
| OV-15e Phân tích + Báo cáo | Opus 5.5 | **High** | nhiều chỉ số tử / mẫu, dòng đọc Turso |
| OV-15f Lịch thi + Xuất DS | Opus 5.5 | **High** | sửa dự kiến thi tại hàng, xuất theo quyền |

Không dùng Fable. Phương án B khi thiếu lượt: Sonnet 5.5 cùng effort (ghi model thật vào mô tả PR); không chạy model nhỏ hơn.

Mẫu chung (thay `<X>` = a…f):

```
Repo Pizi147/pisa-tracking. Bạn làm PR OV-15<X> theo kế hoạch docs/superpowers/plans/2026-10-19-ov15-overhaul-6-pr.md — đọc mục 0, mục 7 và mục "OV-15<X>" (làm đủ mọi ý, không tự bớt; ý nào xung đột luật / mã thì dừng ý đó, ghi rõ trong mô tả PR).
KHÔNG dùng Fable (Opus 5.5). Đầu phiên nói model đang chạy; gõ /ponytail lite.
Đọc trước: CLAUDE.md, plan.md mục 1 + 9.0, docs/superpowers/specs/2026-10-18-ov14-thiet-ke-tong-the-design.md (mục 0–6), mockup đã duyệt thiet-ke/mockup-ov14-{1..6}-*.html (mockup 6 thắng khi khác).
Nhánh mới từ origin/main mới nhất. Có 5 PR OV-15 khác chạy song song: chỉ sửa file trong phạm vi của bạn; file chung chỉ thêm dòng; trước npm run check cuối git merge origin/main, xung đột giữ cả hai.
Làm theo plan.md 1.2: Task ngay trong session (superpowers:executing-plans, KHÔNG subagent), superpowers:test-driven-development (đỏ trước), superpowers:systematic-debugging khi lỗi lạ.
npm ci; npm run check xanh MỘT lần cuối. Bấm thử MỘT lần màn chạm (npm run seed; API + Vite cổng riêng; Playwright — npx playwright install chromium nếu cần; đăng nhập POST /api/demo/session {userId}); ảnh 1440 tối + 375 sáng vào docs/anh/pr-ov15<X>/.
/impeccable audit → /ponytail-review → mở PR vào main, KHÔNG merge, KHÔNG deploy. Mô tả PR ≤ 30 dòng theo mục 0 (ghi dòng đọc trước → sau); dòng cuối "Sẵn sàng rà — PTA Plan".
```
