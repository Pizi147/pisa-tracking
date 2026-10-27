# UI-HO-SO-HV-2 (M5 PR ②) — truy vết + KHỚP / KHÁC + thao tác TRƯỚC → SAU (ảnh cặp `*.png`, trái mockup | phải web)

Nguồn: `thiet-ke/v7/ho-so-hv.html` (chủ SP duyệt 27/10, #604) khu Đang học · Đã thi · Tiến độ / Case (①–⑧) · 375 + kế hoạch
`docs/superpowers/plans/2026-10-27-m5-code.md` (Global Constraints + PR ②). Dùng lại: máy chủ tiến độ + `gopY` + Hoàn tác Thêm PA (#623), chart D + Bảng + Overall (#627),
khối Case A + form tại chỗ (#632), "Mô tả Case" N8 (#626). Ảnh: `node docs/anh/ui-ho-so-hv-2/chup.cjs` (app cục bộ 5521).

Bộ demo cục bộ (seed nguyên, ngày demo 14/09/2026; số khác số demo của mockup — so khung, thứ tự, tên, kiểu chữ):
Trần Thu Hà (id 2) xem bằng GV Phạm Thu Trang (id 9, phụ trách Case S) · Đinh Ngọc Quyên (id 21) đã thi 12/09 có KQ, xem bằng TVV (id 23) ·
Trương Ngọc Bích (id 36) chỉnh `thi_that_ngay` = 12/09 (chờ KQ) · Ngô Hải Yến (id 23) chỉnh `mon_dang_ky` bỏ W1 (P8).

| Ảnh | Trạng thái |
|---|---|
| `dang-hoc-1440-toi.png` | Đang học · Speaking · Việc của tôi · hai cột |
| `da-thi-1440-toi.png` | Đã thi có KQ (TVV, việc "Chọn bước tiếp") |
| `da-thi-cho-kq-1440-toi.png` | Đã thi · chờ kết quả |
| `p8-khong-hoc-1440-toi.png` | P8: W1 "không học từ MT4" |
| `tien-do-diem-1440-toi.png` | ① form kiểu Điểm (x / y) |
| `tien-do-loi-1440-toi.png` | ③ Không có kết quả + thiếu nhận xét → lỗi tại ô (lỗi máy chủ: chữ giữ, nút "Thử lại") |
| `tien-do-vua-luu-1440-toi.png` | ④ vừa lưu · viền nhấn + "✓ Đã lưu · Hoàn tác" |
| `them-pa-1440-toi.png` | ⑤ + Thêm PA trong cột Case |
| `ghi-ket-qua-1440-toi.png` | ⑥ Việc của tôi "Kết quả" → form Ghi kết quả trong cột |
| `tvv-chi-xem-1440-toi.png` | ⑦ TVV chỉ xem (Phan Mai, TVV của em 2 — không nút ghi, câu "ai làm được") |
| `dang-hoc-375-sang.png` · `da-thi-375-sang.png` | 375 |

## Truy vết khung → thành phần

| # | Khung mockup → thành phần | Kết quả |
|---|---|---|
| K1 | Sáu ô điểm, dòng phụ MỘT mẫu "MT3 6.5 · ▲ 0.5" / "MT2 5.5 · =" → `DiemDau` / `ODiemTo` (`soMoc`) | KHỚP |
| K2 | Ô Overall: góc "MT4 · W4 SEP"; thiếu môn: "—" + "không đủ bộ môn" (375 "thiếu môn") | KHỚP |
| K3 | Ô môn đã bỏ (P8): "—" + "không học từ MT4" | KHỚP |
| K4 | Đã thi có KQ: ô Thi thật IELTS thay Overall (màu lịch thi, ngày ở góc, "Target 6.5 · −0.5"), bốn ô L · R · W · S góc "thi thật", dòng phụ = MT cuối để so | KHỚP |
| K5 | Đã thi chờ KQ: ô "Chờ kết quả", ô kỹ năng giữ điểm MT, góc ghi nguồn "MT4" | KHỚP |
| K6 | Đã chọn bước tiếp: nhãn trạng thái cạnh tên, không còn việc | KHỚP (nhãn sẵn có `NhanSauThi`, ô như K4) |
| K7 | Việc của tôi: chỉ việc người xem, ẩn khi rỗng, bỏ "n việc của người khác" → `ThanhViec` | KHỚP |
| K8 | Bấm việc Case → làm ngay trong cột Case (form trong khối Case, không panel) → `moCase` | KHỚP |
| K9 | Hai cột dưới Hành trình: Tiến độ trên lớp \| Case & PA của kỹ năng đang chọn; 375 xếp dọc | KHỚP |
| K10 | Dòng tiến độ: tuần · người ghi (+ mã lớp khi khác lớp) / "Part 2 · 6/10" · "Band 6.0" + nhận xét → `TienDoTrenLop` | KHỚP (nhận xét qua `ChuDich`) |
| K11 | Góp ý tuần cũ: nhãn khoá "Góp ý tuần", chỉ đọc | KHỚP (`gopY` của #623) |
| K12 | "+ Ghi tiến độ" → form tại chỗ: Kỹ năng · Tuần (`ONgay`) · Kết quả Không có \| Điểm \| Band · Tên bài · Nhận xét | KHỚP |
| K13 | Nhận xét * bắt buộc (mockup) | KHÁC — theo Global Constraints (chủ SP 27/10 tối): cần ít nhất một trong nhận xét / x/y / band; "Không có" kết quả → Nhận xét thành bắt buộc |
| K14 | Lưu → "Đang lưu…" → form đóng, dòng mới viền nhấn + "✓ Đã lưu · Hoàn tác" | KHỚP (Hoàn tác 10 s = xoá dòng vừa thêm / PUT bản cũ / thêm lại dòng vừa xoá) |
| K15 | Lỗi lưu: ở lại, giữ chữ, "Thử lại" | KHỚP |
| K16 | Bấm dòng mình sửa được → sửa / xoá tại chỗ | KHỚP (xoá không hỏi lại, có Hoàn tác — "không khoá cứng") |
| K17 | Rê dòng Tiến độ → tô cột tuần trên chart | KHỚP (`BieuDoD toTuan`; cả focus bàn phím) |
| K18 | Case & PA: khối Case A (đầu Case → PA → kết quả → lịch sử gập) → `CotCaseHv` + `NganCase` trong `KhungTrongCot` | KHỚP |
| K19 | + Thêm PA / Ghi kết quả mở NGAY TRONG cột; lưu xong về Case, viền nhấn + Hoàn tác (V20) | KHÁC nhỏ — form THAY thân Case trong khối (‹ Case Speaking về), không chen giữa mục Phương án như mockup; dùng lại nguyên form Thêm PA / Ghi kết quả của Ngăn Case |
| K20 | TVV / người không quyền: không nút, câu "Thêm PA: X (phụ trách) hoặc Quản lý" | KHỚP (`chuAiLamDuoc`; trong cột không dùng bản "chỉ đọc gọn" của Ngăn Case) |
| K21 | Rỗng: "Chưa có ghi nhận nào." · "Không có Case {kỹ năng}." | KHỚP (+ nút "+ Case cho {kỹ năng}" giữ từ main) |
| K22 | 375: ô điểm lưới 3 × 2, form toàn bề rộng, nút 44 px | KHỚP |
| — | BỎ: panel Ghi tiến độ cũ, bảng Tiến độ rộng (bắt buộc tên bài + điểm / thang), dòng phụ "GV ghi tuỳ ý · không vào MT" (→ ⓘ), bảng "Case · Phương án" cũ, "n việc của người khác", chip "MT3 · Không đủ bộ môn" cạnh tên (ô Overall đã nói — không lặp) | BỎ |

**Đếm:** 22 dòng — KHỚP 20 · KHÁC 2 (K13 theo luật đã chốt, K19 nhỏ) → **20 / 22 = 91 %** (K13 theo quyết định chủ SP → 21 / 22 = 95 %).

## Thao tác TRƯỚC → SAU (bấm thật, Playwright, 1440 + 375)

| Thao tác (main) | Sau PR | Ghi chú |
|---|---|---|
| Ghi tiến độ: "+ Ghi tiến độ" → panel → bắt buộc tên bài + điểm / thang | Form ngay trong cột; chỉ nhận xét / chỉ band / x/y đều lưu được; Hoàn tác | 0 panel |
| Sửa / xoá dòng tiến độ: bấm dòng → panel → Xoá → hộp hỏi lại | Bấm dòng → form tại chỗ → Lưu / Xoá → "✓ … · Hoàn tác" | bỏ hộp hỏi (có Hoàn tác) |
| Việc cần làm: bấm → Ngăn Case (panel phải) | Bấm → khối Case trong cột, đúng form (Kết quả / Thêm PA / Xác nhận…); Case không thuộc kỹ năng (Ý thức…) → Ngăn Case như cũ | |
| Case & PA: bảng hàng Case / PA + nút Mở Case / + Thêm PA / Kết quả → Ngăn Case | Khối Case A trong cột: mọi việc của Ngăn Case (Thêm PA, Kết quả, Xác nhận, Mô tả Case, Sửa, Đổi người…, ⋯ PA, Duyệt, Hoàn thành, Bằng chứng) tại chỗ | không mất việc nào |
| Chart: Enter / "Mở Case" trên thanh Case / PA → Ngăn Case | → cuộn tới khối Case trong cột, viền PA 2 s | |
| "+ Case" · ⋯ · Trước / Sau · ba tab · dải Tạm dừng / Chuyển lớp / Xét lại / Chờ duyệt · `?case=` · `?dot=` · `?kn=` | GIỮ | `?case=` (thông báo) vẫn mở Ngăn Case |
| Ô điểm: bấm đổi kỹ năng | GIỮ; đã thi: ô Thi thật → Overall (bảng Mock Test + hàng Thi thật), ô W → Writing | |
| "+ Case cho {kỹ năng}" (kỹ năng không có Case) | GIỮ (cột Case rỗng) | |
| TVV / CX / Admin: khối "Đang xử lý" | GIỮ | |

Không mất thao tác nào.

## Máy chủ (nhỏ, chỉ đọc)

- `NGUON_DICH` thêm `bai_tren_lop.nhan_xet` và `gop_y_tuan.noi_dung` — quyền như `GET /students/:id/bai-tren-lop` (xem hồ sơ em); `gopY[]` trả thêm `id`.
- Phép kiểm `DICH-4b` (dịch được khi xem được em; GV ngoài phạm vi → 403, không gọi OpenAI) + `DICH-W` thêm `TienDoTrenLop.tsx`. Không migration.

## [XM] cần PTA Plan / chủ SP

- **[XM-1]** K13: mockup vẽ "Nhận xét *"; làm theo Global Constraints (không bắt buộc, cần một trong ba). Nhãn * chỉ hiện khi chọn "Không có" kết quả.
- **[XM-2]** K19: Thêm PA / Ghi kết quả thay thân Case trong khối (dùng nguyên form Ngăn Case, cùng luật V20) thay vì chen form giữa mục Phương án. Chen giữa = viết lại form, để PR sau nếu chủ SP muốn.
- **[XM-3]** TVV có việc riêng với em thì không còn thấy việc của người khác ở hồ sơ (mockup "chỉ việc của người xem"); TVV không có việc vẫn có khối "Đang xử lý".
- **[XM-4]** Xoá dòng tiến độ không hỏi lại (có Hoàn tác 10 s, thêm lại đúng nội dung; người ghi / giờ ghi thành người hoàn tác). Muốn giữ hộp hỏi thì thêm lại một chỗ.

## Critique (impeccable, MỘT lần, A + B hai agent độc lập): **29 / 40**, không P0

- A (thiết kế): P1 ① cột trái ngắn hơn cột phải nhiều (theo khung mockup — hai cột `items-start`, không ép cao; giữ) · ② 375 ô điểm cắt "Overall M…", "MT1 5.0 ▲…" → **đã sửa** (375 bỏ chữ góc ô kỹ năng / Overall, dòng phụ chỉ xuống dòng ở " · ").
  P2: nhãn "(không bắt buộc)" lặp → **đã bỏ** ở Nhận xét (dấu * chỉ khi chọn "Không có"); hai tầng tiêu đề khi form trong cột (giữ — ‹ Case Speaking là đường về, [XM-2]).
- B (detector + trình duyệt): 375 không tràn ngang; vùng chạm cột mới ≥ 44 px. Lỗi thật: hộp ⓘ (`NutLuat`) neo trái tràn mép phải ở 375 →
  **sửa gốc ở `NutLuat`** (đo khi mở, lùi vào trong 8 px — mọi nơi dùng chung đều được). Còn lại: `text-[14px]` / `[17px]` advisory (14 · 17 có trong thang G13), `side-tab` thanh việc là code cũ.
- web-design-guidelines: bấm Lưu khi thiếu → focus ô lỗi đầu; Esc chỉ đóng form khi chưa gõ gì (không mất chữ vì một phím).
