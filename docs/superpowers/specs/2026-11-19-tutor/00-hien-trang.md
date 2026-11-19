# 00 — Hiện trạng Tutor (19/11/2026)

Session PTA Tutor. Mã: `main` 86de3f427. Số liệu thật: bản chép bản chính `pisa-pisatracking-261107…2026-11-12-0112.sqlite` (chỉ đọc).
Nhãn: **[MÃ]** đã kiểm trong mã · **[SỐ]** đo trên bản chép · **[ĐT]** đặc tả 20/10 (`2026-10-19-tutor-head-tutor-design.md`) · **[ĐX]** đề xuất (chưa duyệt).

## 1. Tóm tắt một màn hình

1. **Trang Tutor đang ẩn với mọi vai** từ 22/10 (AN-TUTOR): menu không có mục Tutor, `/tutor/*` chuyển về `/` — [MÃ] `shared/domain/dieuHuong.ts:59`, `web/src/App.tsx:424-425`. Máy chủ `/tutors*` + 5 tệp `web/src/modules/tutor/*` còn nguyên nhưng không ai tới được.
2. **PA Tutor là PA nhiều nhất hệ thống**: 536 PA (294 đang chạy · 133 chờ xác nhận · 21 xong · 88 huỷ), của **121 em**; phần lớn em có **3–5 PA Tutor cùng lúc** (mỗi kỹ năng một Case một PA) — [SỐ].
3. **Buổi gần như không được ghi**: 294 PA đang chạy, chỉ 73 PA có lần ghi kết quả; 122 lần ghi (56 trễ), 46 lần là "0 buổi"; cả hệ thống **59 buổi** trong ~6 tuần — [SỐ].
4. **Phần Head tutor chưa từng chạy**: bảng `tutors` 0 dòng, `tutor_nhan_xet` 0 dòng, 0 tài khoản vai `head_tutor`; 59 buổi đều là tên gõ tay (26 tên khác nhau, 12 buổi tên trùng chính người ghi) — [SỐ].
5. **GV đang bị bắt nhập thứ không ai đọc**: mỗi buổi bắt 3 ô Có / Không (chuẩn bị · tài liệu · feedback) — chỉ trang Tutor (đang ẩn) dùng; Hiệu quả PA không dùng — [MÃ] `server/src/cases/cases.ts:4394-4415`, `server/src/cases/effectiveness.ts:225-235`. Thực tế 42 / 52 buổi chọn cả 3 "Có", sao dùng 1 / 59 — [SỐ].

## 2. Tutor làm được gì hôm nay

### 2.1 PA Tutor sinh từ ba nguồn [MÃ]

| Nguồn | Điều kiện | Trạng thái đầu | Số buổi | Người dạy mặc định |
|---|---|---|---|---|
| Quy chế SOS (FT) | MT1–2 + SOS 3 → "Tutor · đến MT kế"; MT3+ mọi SOS → "Tutor · đến lúc thi" (`shared/domain/sos.ts:52-65`; Quản trị đổi được ở Cấu hình Case & SOS) | **chờ xác nhận** (`server/src/cases/sosAuto.ts:78-92`) | trống | GV bộ môn kỹ năng đó, không có thì GVCN (`server/src/cases/owner.ts:27-44`) |
| Kỳ vọng đầu ra lớp thường → FT, nguyên nhân "Trung tâm" (N17) | Head chốt, chọn ≥ 1 kỹ năng | **chạy ngay** (`server/src/normal/kyVong.ts:226-288`) | 10 / kỹ năng (cấu hình) | GV cũ dạy kỹ năng đó ở lớp thường |
| GV tự thêm | — (không cần duyệt, `shared/domain/cases.ts:677`) | chạy ngay | tuỳ chọn | tuỳ chọn |

[SỐ] PA Tutor đang mở: quy chế "đến lúc thi" 176 · "đến MT kế" 194 · kỳ vọng 15 · còn lại GV thêm / PA GV mang dấu quy chế.

### 2.2 Vòng đời một PA Tutor [MÃ]

1. **Xác nhận PA** (chỉ PA quy chế; việc của GV bộ môn, hạn theo SOS): bắt **"Số buổi / 2 tuần"** — thiếu thì 400 (`sosAuto.ts:708`), chặn cả ghi kết quả (`web/src/modules/cases/CasePanel.tsx:815`). [SỐ] **133 PA đang kẹt ở bước này**.
2. **Ghi kết quả 2 tuần / lần**, hạn hết thứ Ba (việc "Kết quả PA" của **GV bộ môn kỹ năng ở lớp hiện tại** — không phải người dạy; `server/src/cases/giuKetQua.ts:37-56`): Tiến triển · Quyết định · **Số buổi kỳ này** (bắt buộc, 0–60) · mỗi buổi một dòng: Tutor \* · Hình thức · Nhận xét buổi \* · 3 ô Có / Không \* · (gập) sao + nhận xét về tutor (`web/src/modules/cases/CapNhatTuan.tsx`, `BuoiTutorO.tsx`).
3. **Kết thúc**: PA quy chế tự khép khi chạm mốc (MT kế / thi); kết thúc sớm chỉ GVCN / Head + lý do. PA khác: GV tự chọn Kết thúc; đủ / vượt số buổi chỉ gợi ý.
4. Sửa lần ghi: người ghi hoặc Head; lần ghi cũ chỉ sửa chữ. Sửa PA: Số buổi ≥ đã dạy.

### 2.3 Dữ liệu [MÃ]

- `case_followup_buoi` (buổi nằm **trong** một lần ghi kết quả): tên tutor, nhận xét, `tutor_id`, hình thức, 3 ô, sao, nhận xét tutor, `lop_id`, `ghi_luc` — **không có ngày của buổi** (`server/src/schema.sql:1349-1370`).
- `tutors` (danh bạ, không phải tài khoản) · `tutor_nhan_xet` (kết luận Ổn · Cần cải thiện · Ngừng).
- Không có: lịch buổi, em vắng, nhiều em một buổi, đếm buổi theo người dạy / tháng.

### 2.4 Vai và quyền [MÃ]

| Vai | Quyền Tutor | Thực tế trên web |
|---|---|---|
| Head tutor | `tutor.view` + `tutor.manage`, toàn hệ thống; không quyền nào khác (`server/src/seed/data.ts:113`) | trang đầu = khung "Lớp của tôi" rỗng + câu "nhờ Quản trị cấp thêm vai Giáo viên"; kèm vai GV thì y hệt GV (N43, #1582). **Không có việc Tutor nào** — Hướng dẫn ghi "Trang Tutor tạm ẩn" |
| Quản trị | cả hai | không lối vào |
| Head (`manager`) | `tutor.view` theo chi nhánh | không lối vào |
| CX | **không có** `tutor.view` (phép kiểm `prCxN52.tests.ts:38-39` còn khẳng định) — lệch N52 "xem mọi thứ" | 403 |
| Admin, TVV, GV | không | GV chỉ dùng ô chọn tutor `GET /tutors/chon` khi ghi kết quả |

## 3. Chỗ lệch / chưa làm / trái luật mới

| # | Vấn đề | Loại | Nguồn |
|---|---|---|---|
| H1 | Trang Tutor ẩn → dữ liệu 3 ô, sao, kết luận không ai đọc, nhưng GV vẫn bị bắt nhập | trái luật cứng 08/10 | [MÃ] |
| H2 | "Số buổi" hai nghĩa: màn Xác nhận ghi "/ 2 tuần", cùng cột lại được đếm như **tổng** ("Đã dạy 3 / 10", kỳ vọng 10 buổi) | lỗi logic | [MÃ] `paDongBo.ts:36,47`, `sosAuto.ts:708`, `kyVong.ts:218` |
| H3 | 133 PA quy chế kẹt "chờ xác nhận" vì bắt Số buổi; có nhánh (Head từ chối "Giữ PA của tôi") chạy được mà không cần Số buổi | chặn cứng + không nhất quán | [MÃ] `sosAuto.ts:262-265` · [SỐ] |
| H4 | Ba ô "ai dạy" chồng nhau: Người dạy của PA · Người dạy kỳ này · Tutor từng buổi; ô đầu mặc định là GV bộ môn nên không nói ai dạy thật | rối | [MÃ] |
| H5 | Người dạy không ghi được buổi; GV bộ môn gõ lại; em 4 kỹ năng = 4 form; không ghi được "em vắng", nhiều em một buổi | workflow | [MÃ] |
| H6 | Buổi không có ngày riêng → không biết em lâu chưa học; chỉ lộ khi GV ghi "0 buổi" | thiếu | [MÃ] |
| H7 | CX chưa xem được Tutor (N52) | lệch luật mới | [MÃ] |
| H8 | Head tutor không thấy em nào cần tutor (Q2 19/10 cấm mở hồ sơ HV / Case) → không giao được người dạy | lệch vai thật (N43: Head tutor là GV) | [ĐT] |
| H9 | Head chỉ xem trang Tutor (Q9 19/10), trong khi Head là người lo lớp / em của chi nhánh | lệch | [ĐT] |
| H10 | Mockup F1 + B1 (22/10) cho trang Tutor chưa code; bảng tự viết `<table>`, ngoài chuẩn `Bang` | chưa làm | [MÃ] `prBang0.tests.ts:52-54,78` |
| H11 | Một Case có thể có 2 PA Tutor song song (thêm tay không kiểm trùng) | lỗi nhỏ | [MÃ] `cases.ts:971-1195` |
| H12 | Ghi chú mã cũ: "Head" trong `nhomQuyen.ts:71` chỉ Head tutor (nay Head = manager); `PanelTutor.tsx:27` ghi "24 giờ" (đã nới) | dọn | [MÃ] |

Đã đúng, giữ: bảng quy chế SOS → PA · mốc tự khép · Hiệu quả PA · N46 (ẩn việc khi có KQ thi thật) · N51 (Học tiếp) · bộ đếm việc một nguồn #1840 (việc "Xác nhận PA", "Kết quả PA" đi qua `/my-work`) · `GET /tutors/chon` (3 số cuối SĐT) · Tải danh sách / Gộp tên gõ tay.

## 4. Bổ sung 19/11 chiều (sau lời chủ SP)

- **Hạn Kết quả PA "21/11" là thứ Bảy — không phải lỗi công thức.** [MÃ] `hanKyGhiKetQua` / `hanKe` (`shared/domain/week.ts:42-56`) luôn ra thứ Ba. [SỐ] bản chép 12/11: 420 PA đang chạy có hạn — **290 PA hạn 21/11**, còn lại đều thứ Ba (17/11 · 24/11 · 01/12 · 08/12). Nguồn: migrate một lần `prResetHanCase` lúc deploy 07/11 (RESET-HAN-CASE #1127, lời chủ SP 06/11 "Kết quả PA này thôi reset hết cho đến 2 tuần tới đi") đặt hạn = 07/11 + 14 = 21/11. Ghi xong kỳ này, `hanKe` trả hạn kế về thứ Ba. Hệ quả phụ: 290 việc cùng tới hạn một ngày — đúng cảnh "một đống việc" trong ảnh chủ SP.
- **Nháp máy chủ đã có trong `main` (chưa deploy):** NHAP-KQ-PA (chủ SP 13/11) — `PUT /interventions/:id/nhap`, cột `case_interventions.nhap_ket_qua` (JSON mức + nhận xét; **chưa** giữ số buổi / tutor / 3 nút) — [MÃ] `server/src/cases/cases.ts:4301-4357`, `server/src/schema.sql:1265`.
- **Dải "Sắp tới" đã có trong `main` (chưa deploy):** GD-21 / LG-13 — trên "Lớp của tôi", cụm "Ghi kết quả PA · {ngày}" chỉ là **một con số** PA tới kỳ trong 7 ngày, chưa có danh sách em / PA — [MÃ] `web/src/modules/congViec/SapToi.tsx:19-21`, `server/src/worklist/mywork.ts:754-780`.
- **Lưới Kết quả PA đã có:** GD-20c — dòng gộp cùng lớp + cùng kỳ mở lưới ghi nhiều em (`GET /interventions/luoi-ket-qua`, `web/src/modules/congViec/LuoiKetQuaPa.tsx`); PA Tutor không ghi nhanh được, phải mở panel đầy đủ — [MÃ] `shared/domain/paDongBo.ts:72-73`.
- Việc "Kết quả PA" chỉ hiện từ **hạn − 2 ngày** — [MÃ] `mywork.ts:780, 1004`.

## 5. Dòng đọc hiện tại [MÃ] `server/src/tests/tocDoDuong.ts`

`/tutors` 17–18 câu · 65 dòng (seed) · `/tutors/:id` 18–19 câu · `/tutors/chon` 15–21 câu · 60–95 dòng. Chưa có trần cho vai Head tutor.
