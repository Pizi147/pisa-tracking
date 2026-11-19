# 03 — Workflow Tutor (bản 2, 19/11/2026)

Theo lời chủ SP 19/11 (6 ý — `plan.md` mục 4) và `02-luat.md` bản 2. Phần ghi **[C…]** còn chờ `04-cau-hoi.md`. Bản 1 đã bỏ (git #1848).

## 1. Dòng chảy — không thêm bước nào

```
① Có PA Tutor ──► ② (tuỳ ý) Lưu nháp trong kỳ ──► ③ Ghi kết quả 2 tuần / lần, hạn thứ Ba ──► PA khép (mốc quy chế / Kết thúc)
   như nay            GV, lúc nào cũng được              GV bộ môn — như nay, form gọn hơn
```

Chỉ còn **một nơi nhập** về Tutor: form **Ghi kết quả PA**. Không giao người dạy, không lịch, không vắng.

## 2. Sáu câu

| | ② Lưu nháp (tuỳ ý) | ③ Ghi kết quả |
|---|---|---|
| Phát sinh từ đâu | GV vừa biết tin một buổi (tutor báo, em kể) | hết kỳ 2 tuần (giữ) |
| Ai làm · ai chốt | GV bộ môn giữ việc Kết quả PA; Head làm thay như nay | GV bộ môn (giữ) |
| Ai cần biết | — (nháp chỉ người có quyền xem Case thấy) | GVCN, Head, TVV, CX xem ở Case; Head tutor xem ở trang Tutor [C2] |
| Thông tin để làm ngay | PA, kỳ, nháp trước (ai lưu, lúc nào) | nháp điền sẵn; tutor kỳ trước điền sẵn; b điền sẵn [C1] |
| Đầu ra · xong khi | nháp đã lưu (không đổi việc / hạn) | lần ghi có Tiến triển + Quyết định + Số buổi a / b (+ Tutor, Nội dung khi a ≥ 1) |
| Bắt buộc | không ô nào | Tiến triển · Quyết định · a / b · a ≥ 1: một Tutor + một Nội dung ≥ 8 ký tự |
| Gộp / bỏ | — | **bỏ** mỗi buổi một dòng · **bỏ** bắt 3 nút · **bỏ** "Người dạy kỳ này" · Hình thức không hỏi |
| Sửa · huỷ · khôi phục | lưu lại = đè nháp cũ; xoá hết chữ = bỏ nháp | bấm Sửa trên kết quả đã ghi (mọi ô phần Tutor); xoá lần ghi → Thùng rác (đã có) |

## 3. Form Ghi kết quả PA Tutor (sửa trên form đang có — `CapNhatTuan` + `BuoiTutorO`)

```
Tiến triển *      [5 mức như nay]
Quyết định *      [Giữ nguyên · Điều chỉnh · Kết thúc PA]            ← như nay
Số buổi *         [ 1 ] / [ 2 ]                                      ← đã học / dự kiến kỳ này
Tutor *           [ Tìm GV, tutor…                    ▾ ]            ← hiện khi a ≥ 1; gồm GV
Nội dung *        [ Em học được gì, còn yếu gì…            0/300 ]
                  ┌ hiện SAU khi có tên Tutor, không bắt ───────────┐
                  │ Chuẩn bị bài        [Có] [Không]                │
                  │ Tài liệu đúng hạn   [Có] [Không]                │
                  │ Gửi feedback cho GV [Có] [Không]                │
                  │ ▸ Đánh giá thêm                                 │  ← gập như nay (sao + nhận xét về tutor)
                  └─────────────────────────────────────────────────┘
+ Tutor khác                                                         ← thêm một dòng: số buổi · Tutor · Nội dung · 3 nút
                                              [Lưu nháp]  [Lưu]
```

- a = 0 → ẩn Tutor, Nội dung, 3 nút; chỉ còn Tiến triển + Quyết định.
- "+ Tutor khác": dòng 1 và dòng mới mỗi dòng có ô số buổi nhỏ; tổng phải = a (lỗi tại ô, không mất chữ).
- 3 nút: bấm lại nút đang chọn = bỏ chọn. Không có "n ô còn thiếu".
- Ô Tutor: nhóm gợi ý (cùng chi nhánh + đúng kỹ năng) → GV → Tutor → "Dùng tên: …" (gõ tay).

## 4. Công việc của GV — khối "PA đang chạy"

```
Kết quả PA                                   5 việc        ← như nay: chỉ việc tới hạn (hạn − 2 ngày), tính vào số việc
  CP FT 131 · Kết quả PA      hạn 24/11      7 em ▾
  …
PA đang chạy                                 12 PA         ← MỚI: chưa tới hạn; KHÔNG tính số việc / badge / chuông
  Ngô Gia Huy    Writing Task 2 · Học Tutor    hạn 01/12    nháp 1 / 2 · 20/11
  Trần Quốc Huy  Listening · Tự học            hạn 01/12    —
```

- Bấm dòng = mở đúng form mục 3 (hoặc lưới Kết quả PA khi chọn cả lớp) → **Lưu nháp**. Muốn chốt sớm cũng được (như nay: ghi sớm khép kỳ).
- Mặc định gập khi > 10 dòng; gom theo lớp như nhóm trên. Thay dải "Sắp tới · Kết quả PA n" (GD-21) — phần "Sắp tới · Test" giữ.
- Lưới Kết quả PA (dòng gộp "7 em ▾" — GD-20c): PA Tutor ghi được ngay trong lưới (thêm cột Số buổi a / b + Tutor), nay phải "Mở đầy đủ" từng em.
- Hồ sơ HV / hồ sơ lớp: thẻ PA hiện "nháp 1 / 2 · 20/11" khi có nháp (cùng nguồn).

## 5. Tình huống thật

| Tình huống | Hôm nay | Bản 2 |
|---|---|---|
| Em SOS 3, 3 PA Tutor (R, W1, W2), 2 tuần học 2 buổi mỗi kỹ năng | mỗi PA: 2 dòng × (Tutor + Nhận xét + 3 nút bắt buộc) = 10 ô bắt buộc / PA | mỗi PA: "2 / 2" + 1 Tutor (điền sẵn kỳ trước) + 1 Nội dung = 3 ô |
| Em vắng 1 trong 2 buổi | ghi 1 buổi (không ai biết dự kiến 2) | "1 / 2" |
| Em không học buổi nào | "0 buổi" (không rõ dự kiến mấy) | "0 / 2", không cần gì thêm |
| Chưa biết ai dạy lúc lập PA | ô Người dạy máy điền GV bộ môn (sai nghĩa) | không có ô đó; tutor ghi khi có buổi |
| GV trung tâm dạy tutor | không chọn được ở ô Tutor (chỉ danh bạ / gõ tay) | chọn GV ngay trong ô Tutor |
| Hai tutor trong một kỳ | 2 dòng (bắt buộc dù cùng tutor) | cùng tutor: 1 dòng; khác tutor: "+ Tutor khác" |
| GV nghe tin buổi tuần 1, sợ quên | chờ tới hạn − 2 ngày mới có việc; nháp máy chủ chỉ giữ mức + nhận xét | mở "PA đang chạy" → ghi "1 / 2", tutor, nội dung → Lưu nháp |
| Tới hạn, đã có nháp | — | mở ra sẵn; thêm Tiến triển → Lưu |
| Hai GV cùng mở nháp một PA | 409 "Có bản nháp mới hơn" (đã có) | giữ |
| Không muốn đánh giá tutor | không lưu được | bỏ trống 3 nút, lưu bình thường |
| Lô lỗi một phần (lưới 7 em, 2 dòng lỗi) | lưu từng dòng, dòng lỗi báo tại dòng + Thử lại (đã có) | giữ |
| Head tutor kiêm GV | như GV | như GV + trang Tutor [C2] |
| Em chi nhánh khác | — | không đổi: kết quả thuộc lớp em lúc ghi (20/10) |
| Đổi GV bộ môn (N29) | PA + nháp theo GV mới | giữ |
| Em có KQ thi thật (N46) / Tạm dừng | việc ẩn | PA cũng rời khối "PA đang chạy"; Học tiếp (N51) → hiện lại |
| 133 PA quy chế chờ xác nhận vì thiếu "Số buổi / 2 tuần" | kẹt | [C1] |

## 6. Dòng đọc Turso (ước — đo thật ở kế hoạch PR)

| Chỗ | Đổi gì | Ước |
|---|---|---|
| `/my-work` vai GV | khối "PA đang chạy": cùng câu `cauPaGhiKetQua` đang chạy cho "Sắp tới", nới cửa sổ 7 ngày → mọi PA đang chạy của GV, trả danh sách thay vì con số | ± 0 câu · + ≤ 40 dòng / GV (PA của lớp mình dạy; đi chỉ mục `idx_iv_ghi_kq`) |
| Form / lưới Ghi kết quả | nháp nằm trong cột `nhap_ket_qua` đã đọc | ± 0 |
| Ô Tutor | thêm GV: dùng danh sách người đã nạp của `ChonNguoi` (cùng chi nhánh trước) | + 0–1 câu khi mở ô |
| Trang Tutor [C2] | như nay 17–19 câu · < 100 dòng seed; chỉ vài người mở | < 5 000 dòng / ngày |

`/my-work` là đường nặng nhất hệ thống (~42 % dòng đọc) → PR phải đo trước / sau trên bản chép; trần: không tăng câu, tăng ≤ 3 % dòng vai GV. Không chỗ nào vượt 30 câu / 2 000 dòng.
