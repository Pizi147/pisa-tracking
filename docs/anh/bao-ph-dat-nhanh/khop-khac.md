# BAO-PH-DAT-NHANH — nút "Đặt nhanh" ở tab Báo cáo PH (chủ SP 15/11 sáng: "Có, thêm nút")

Không mockup mới: thêm nút theo mẫu sẵn có (`btn btn-sm` của thanh công cụ tab, như "+ Đợt báo cáo") và hộp theo mẫu `KhungPanel rong="hep"` (như hộp "Đợt báo cáo mới" cùng tab) — plan.md 1.3b.
Dữ liệu demo: GV Trần Ngọc Hà (vai 7, GVCN + L + R) · lớp MB FOU 15 (6 em) · đợt Progress W2 SEP.

## 1. Ảnh

| Ảnh | Nội dung |
|---|---|
| `truoc-1-tab-1440-toi.png` · `sau-1-tab-1440-toi.png` | Thanh công cụ: thêm **Đặt nhanh** sau "Cả lớp đủ 0 / 6 em" (không trong tiêu đề bảng — V5) |
| `truoc-1-tab-375-sang.png` · `sau-1-tab-375-sang.png` · `sau-1b-thanh-cong-cu-375-sang.png` | 375: nút xuống hàng riêng dưới "bạn còn · Cả lớp đủ", cao 44 |
| `truoc-2-panel-viet-1440-toi.png` | Trước: chấm từng em trong panel viết (7 mức + nhận xét) — vẫn giữ nguyên |
| `sau-2-hop-1440-toi.png` · `sau-2-hop-375-sang.png` | Hộp: Phần · Mức (mặc định Tốt) · "42 ô trống · 6 em chưa đủ" · "6 em còn thiếu nhận xét chung — viết từng em sau" · **Áp cho 42 ô trống** |
| `sau-3-da-dat-1440-toi.png` · `sau-3-da-dat-375-sang.png` | Sau áp: ô Chung đổi "nháp" tại chỗ, toast "Đã đặt Tốt cho 42 ô · 6 em còn thiếu nhận xét chung · Hoàn tác" |
| `sau-4-hoan-tac-1440-toi.png` | Sau Hoàn tác: về "–" như trước (dòng mới rỗng đã xoá) |
| `sau-5-zoom-x-hop-1440-toi.png` · `sau-7-zoom-x-hop-375-sang.png` · `sau-6-zoom-nut-1440-toi.png` | Zoom ✕ đầu hộp (khuôn chung `NUT_DONG`, cùng hàng tiêu đề) · nút; không chữ bị cắt "…" |

## 2. Thao tác TRƯỚC → SAU (6 em)

| Việc | TRƯỚC | SAU |
|---|---|---|
| Chấm phần Chung 6 em (7 tiêu chí, cùng mức) + nhận xét | mở panel 1 + mỗi em 7 mức + ô chữ + "Lưu · em tiếp" = 9 → **55 bấm**, ~48 PUT | Đặt nhanh 1 + Áp 1 (mức Tốt sẵn) → mở panel 1 + mỗi em ô chữ + "Lưu · em tiếp" = 2 → **15 bấm**, 1 POST + 6 PUT |
| Ba phần của GVCN Hà (Chung 7 · L 4 · R 4) + chữ | mức 90 + chữ 36 + mở 3 ≈ **129 bấm**, ~126 PUT | 3 × (Đặt nhanh + chọn phần + Áp) ≈ 8 + chữ 36 + mở 3 ≈ **47 bấm**, 3 POST + 18 PUT |
| Em ngoại lệ (Khá thay Tốt) | — | +1 bấm mỗi tiêu chí trong panel (như cũ) |
| Chấm từng ô, Viết hộ, Xuất, đợt (+ / bỏ / sửa / xoá / khôi phục) | có | **giữ nguyên** |
| Sửa sai sau Đặt nhanh | — | Hoàn tác ở toast: trả về trống đúng các ô vừa đặt; ô ai sửa sau giữ ("n ô đã có người sửa — giữ nguyên") |

Không mất thao tác nào.

## 3. Luật / hành vi

- Chỉ điền tiêu chí CÒN TRỐNG của em chưa đủ (`tieuChiTrong`, một hàm cho hộp và máy chủ); mức "đặt sẵn như đợt trước" tính là đã có (như panel viết); ô chữ / điểm không đụng.
- Phần chọn được = phần người xem viết được (GV đúng phần · QL viết hộ, nhãn "· viết hộ") có tiêu chí (FOU "P" không có tiêu chí → không hiện).
- Một request, một giao dịch; máy chủ kiểm quyền phần, kiểm từng em có trong đợt, từng tiêu chí thuộc phần; ô vừa có người chấm giữa lúc mở hộp và Áp → bỏ qua, báo số. Em không còn trong đợt → báo tên em, em khác vẫn lưu. Lỗi cả lần (mạng / máy chủ) → ở lại hộp, "Chưa ô nào được lưu", bấm lại được.
- Nhật ký: một dòng mỗi em (`bao_cao_ph.dat_nhanh` / `bao_cao_ph.hoan_dat_nhanh`, một câu ghi). Lớp vừa đủ → tin Admin như lưu một ô (LG-3).
- KHÔNG đổi mức, luật hạn, quyền.

## 4. Turso

- `POST /classes/:id/bao-cao-ph/dat-nhanh`: đo 14 câu · 50 dòng (MB FT 101, 33 em, gồm 2 câu báo Admin) — trần `TRAN_GHI_LO.datNhanhBaoCaoPh` 24. Thay ~7 PUT mức mỗi em (mỗi PUT ~6 câu, ước) → một phần × 33 em: ~1 400 câu → 14.
- Hộp đếm ô bằng đường GET panel một phần sẵn có (`/bao-cao-ph/phan`, đã có trần) — chỉ khi bấm Đặt nhanh; mở tab không thêm câu.

## 5. Bỏ / để sau

- **P2-7 gộp PUT khi chấm từng ô: KHÔNG làm** (rủi ro: panel có nhiều lối chặn rời — chờ 1 s sẽ hiện hộp "Bỏ chữ, đóng" hoặc mất mức khi đóng tab). Ghi plan.md "15/11 BAO-PH-DAT-NHANH — Việc để sau".
- Hướng dẫn "?": thêm bước Đặt nhanh cho GV (`gv.ts` bao-cao-ph) và QL (`ql.ts` bao-cao-ph), có EN.
