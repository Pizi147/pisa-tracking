# PR OV-11g — Học viên & Lớp · hồ sơ lớp (một cách đếm, không em nào "biến mất")

Nguồn: đặc tả `docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md` (mục 3 Q3, Q4, Q11) · bước tái hiện: phụ lục `2026-10-14-ra-soat/hoc-vien-lop.md` (HL-*),
`critique-A2-hoc-vien-lop.md` (CA2-*). Đợt 3 (sau OV-11d, e, f), **song song với OV-11h, OV-11i**. Rà: mặc định; **sâu** cho mục 9 (quyền ghi điểm lớp đã kết thúc).
Mockup: không cần — em kết thúc học hiện mờ theo mẫu `row-muted` (như lưới chấm OV-1d / bảng TVV), không màn mới.

## Đầu ra
1. **[HL-1] Seed demo đúng trạng thái lớp kết thúc.** `server/src/seed/journeys.ts:250,256` + `seed.ts:177`: `status = 'finished'` + `finished_at` (ngày cuối khoá). Chụp lại băm phép kiểm nếu đổi (DL-2).
2. **[HL-2 · Q3 chủ SP chốt] "Thiếu thông tin" một hàm, tính cả ngày sinh và email.** `server/src/classes/schedule.ts:764` `missingForStudent` thêm **ngày sinh + email**; chip, badge dòng,
   ô Tổng quan TVV / CX (`server/src/worklist/hvCuaToi.ts:102-106`) cùng hàm. **Thêm học viên** (một em, lưới, dán Excel) và **Sửa cả lớp**: ngày sinh, email **không bắt buộc**
   (gõ thì kiểm dạng) — không chặn nhập danh sách ban đầu. TVV thấy em thiếu ở ô "Thiếu thông tin" (Tổng quan TVV, chip Học viên & Lớp) — **việc không hạn**, không thẻ, không nhắc.
3. **[HL-19 · Q11] Em "Đã kết thúc học" chưa Lưu trữ không biến mất.** Học viên & Lớp (`server/src/classes/hocVienLop.ts:154`) hiện em đó **mờ** ở cuối lớp cuối, chip "Đã kết thúc học",
   ⋯ Lưu trữ · Học lại; không đếm vào chip việc; "Tất cả" của QL = CX trên cùng chi nhánh. Sau Chọn nhiều › Kết thúc học (hết Hoàn tác) em vẫn thấy ở đó.
4. **[HL-9]** Lọc một lớp (badge "n HV quá hạn việc", "Thiếu n thông tin"): số trên chip đếm theo lớp đang lọc (`web/src/modules/students/StudentsPage.tsx:128` lọc `chiLop` trước `demLoc`).
5. **[HL-4]** Đầu hồ sơ lớp thường "Final Test: a/b em có đủ điểm" dùng cùng `duDiem / coLich` của `danhSachLuot` (khối điểm cuối trang) — một mẫu số.
6. **[HL-3]** Mọi "Nhập điểm" của một lớp (⋯ dòng em, ⋯ hàng lớp, hàng "Cả lớp", Việc tiếp theo) mở **Điểm theo lớp** `/test/diem-lop?lop={id}&luot={mã}` (`vietMaLuot`)
   như nút đầu hồ sơ lớp (`thaoTacDongHocVien.tsx:36` `nhapDiemCua`, `StudentsPage.tsx:363`). Route cũ `/nhap-diem`, `/bang-diem-thuong` giữ chạy (không chuyển hướng).
7. **[HL-8]** Admin ở Học viên & Lớp và đầu hồ sơ lớp: bỏ chip / badge việc của QL / GV (Cần làm, Chờ duyệt, quá hạn việc, xếp lớp) như TVV / CX (`StudentsPage.tsx:130,345-352`, `DauTrangLop.tsx:103-104`).
8. **[HL-5 · CA2-6]** Dải "Lộ trình tiếp theo" quá hạn dùng `<Han>` (⚠ quá hạn n ngày, không chỉ màu) + nút **"Chốt lộ trình"**; ẩn dải khi đang ở cách xem Lộ trình tiếp theo (`DaiChuyenLop.tsx:43`).
9. **[HL-10 · Q4] Lớp đã kết thúc.** Bảng điểm cuối trang chỉ đọc với GV; **QL sửa được** (nhật ký như sửa điểm thường); máy chủ chặn GV ghi điểm lớp `finished` (`saveScore` lớp thường + FT);
   dải ghi "Lớp đã kết thúc {tuần}" (bỏ "chỉ xem" khi người xem là QL) (`ClassOverviewPage.tsx:142`, `KhoiDiemLop`).
10. **[HL-12]** Hộp Lộ trình lớp thường: điền sẵn tuần sau tuần Final; ô trống → "Chọn tuần bắt đầu."; lớp cùng chi nhánh lên đầu ô Lớp (`BangLoTrinhTiep.tsx:370`, `shared/domain/chuyenLop.ts:167`).
11. **[HL-13]** Cột Progress bảng Lộ trình: "3/4 môn có điểm" (`BangLoTrinhTiep.tsx:157`).
12. **[HL-14]** Nút "+ Học viên" không phụ thuộc kết quả tìm (cờ trang `coTheThemHocVien`, `StudentsPage.tsx:186`); khung rỗng có "Xoá tìm".
13. **[HL-17]** Mở lại lớp: bỏ `tab=tong-ket` khỏi URL trước khi tải lại (hết 404 nền).
14. **[HL-7]** Thông tin lớp › Lịch Test: câu tuần học ngắn, không lẫn với nút "Tuần này" (`ClassProgressPanel.tsx:148`).
15. **[CA2-12 lớp]** Kết thúc lớp bị chặn (còn em đang học): nút **"Chuyển tiếp lớp"** (FT) / **"Lộ trình tiếp theo"** (lớp thường) — đóng panel này, mở panel kia (không lồng).
16. **[CA2-4 chữ]** Badge lớp thường "n HV chưa chốt lộ trình"; Kết thúc lớp "Còn n em chưa chốt Lộ trình tiếp theo" (`shared/domain/hocVienLop.ts:264` `CHU_CHUYEN_LOP`).
17. **[CA2-7]** Dòng tên em gọn: "Thiếu n" thành chữ mờ không viền (vẫn bấm); chip Ý thức ghi "Ý thức · quá hạn 1 ngày" / "Ý thức · cần xử lý"; bỏ chip "Chưa có kết quả" khi cột Mốc đã "chưa có điểm";
    QL và CX một kiểu chip Thiếu (`MissingBadge.tsx`, `classes/CanhBaoYThuc.tsx:16-17`).
18. **[CA2-8]** `web/src/ui/ViecTiep.tsx:21-23`: mã tuần không ngắt dòng ("W2 SEP" một khối), chip `whitespace-nowrap`.
19. **[CA2-10 lớp]** Bỏ câu giải thích dưới ô / nút (plan.md 1.1): Thêm học viên (5 câu), Chuyển tiếp lớp (2 câu), "Bấm một hàng để mở…", "bấm để thu gọn", "Điểm của 2 mốc gần nhất…";
    chỗ thật cần thì dời vào ⓘ.
20. **[HL-18 · CA2-11]** 375: "+k" GV bộ môn (`DauTrangLop.tsx:223`), badge lớp (là nút), badge "Thiếu n", ô "Chỉ ô còn trống" vùng chạm 44 px. (⋯ làm chung ở OV-11i.)
21. **[ONgay]** Thêm học viên: ô Ngày sinh là `ONgay` (gõ + nút lịch, quyết định 06/10) như Sửa cả lớp.
22. **[audit P2-3 · P3-1 lớp]** 375: link tên GV đầu hồ sơ lớp, link "MT3 / MT1" trong thẻ em dùng mẫu K3 (`max-sm:py-3 max-sm:-my-3`); dấu "—" mang nghĩa "không có" ở `ClassRoster.tsx:349`,
    `BangDiemLopThuong.tsx:241` dùng `text-faint` (≥ 4.5:1), dấu ngăn giữ màu mờ (phụ lục `impeccable-B-audit.md`).

## Ranh giới
- Vùng: `server/src/classes/*` (trừ `phanTichLop.ts`), `server/src/classes/schedule.ts:764`, `server/src/worklist/hvCuaToi.ts`, `server/src/normal/regular.ts` + `fasttrack/attempts.ts` (chỉ chặn ghi lớp `finished`),
  `server/src/seed/{seed,journeys}.ts`, `shared/domain/{hocVienLop,chuyenLop}.ts`, web `students/{StudentsPage,MissingBadge,ThemHocVien*}.tsx`, `classes/*` (trừ `ClassIssueBoard`, `PhanTichLopTab`),
  `ui/ViecTiep.tsx`. Phép kiểm `server/src/tests/prOv11g.tests.ts`.
- KHÔNG đụng: `phanTich/*`, `classes/phanTichLop.ts`, `ClassIssueBoard` (OV-11h) · `index.css`, `App.tsx`, `ui/{ui,MenuDong}.tsx` (OV-11i).
- Luật không đổi: thứ tự badge lớp QL (B4/T53 — đề xuất CA2-5 chưa làm); quyền Sửa cả lớp; T9 chi nhánh mặc định.

## Kiểm
- `prOv11g.tests.ts` (đỏ trước): (1) em thiếu ngày sinh hoặc email vào "Thiếu thông tin" ở chip + ô TVV/CX (cùng số); Thêm HV / Sửa cả lớp thiếu ngày sinh, email → lưu được; (2) em `finished` chưa lưu trữ có trong `/hoc-vien-lop` (cờ mờ), không vào chip việc;
  (3) GV ghi điểm lớp `finished` → 403, QL → 200 + nhật ký; (4) đầu hồ sơ lớp và khối điểm cùng mẫu số; (5) seed: lớp 1, 2 `finished`, Lưu trữ có 2 lớp.
- `npm run check` xanh MỘT lần cuối. Bấm thử MỘT lần (QL, GVCN, Admin, CX; 1440 tối + 375 sáng): Học viên & Lớp (lọc lớp, em kết thúc học), hồ sơ lớp thường + FT + đã kết thúc, Thêm HV, hộp Lộ trình. Ảnh đính PR.

## Prompt (Opus 5.5 · High; B: Sonnet 5.5 · High)
```
Session CODE cho PR OV-11g (Học viên & Lớp · hồ sơ lớp), repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất. Không dùng Fable.
Gọi skill karpathy-guidelines. Gõ /ponytail lite (có giao diện). Đọc CLAUDE.md, plan.md mục 1.2, 1.3b, 3, rồi
docs/superpowers/plans/2026-10-14-pr-ov11g-hoc-vien-lop.md (làm ĐỦ 21 mục Đầu ra) + đặc tả docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md mục 3
+ phụ lục docs/superpowers/specs/2026-10-14-ra-soat/{hoc-vien-lop,critique-A2-hoc-vien-lop}.md (bước tái hiện).
PORT/WEB_PORT 4326/5499; npm run check tối đa 3 máy cùng lúc. Task ngay trong session (executing-plans, KHÔNG subagent), test-driven-development (đỏ trước), systematic-debugging khi lỗi lạ.
Chạy song song với OV-11h, OV-11i: chỉ sửa file trong mục Ranh giới. Chữ trên web ngắn (nhãn 1–3 từ, không câu giải thích dưới nút/ô).
impeccable: clarify · harden · adapt trong phạm vi PR; /impeccable audit cuối. Bấm thử MỘT lần theo mục Kiểm, ảnh đính PR. /ponytail-review trước khi mở PR.
Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md nếu thêm/xoá file.
Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ≤ 15 dòng.
```
