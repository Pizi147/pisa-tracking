# TQ-SOS-CN — ô "SOS 2–3" theo chi nhánh bấm được (backlog GD-14)

Mockup `thiet-ke/v21/tong-quan.html` (⑧ T3, T7b) + `tong-quan-ghi-chu.md` (rà vòng 2: "SOS 2–3 … trong bảng chi nhánh bấm được"). Plan `plan.md` 14/11 17:54 ("máy chủ chưa có tập").
Ảnh seed demo, tài khoản demo Quản trị (vai 1), phông Be Vietnam Pro + Inter đã nạp. Công cụ `scripts/anh-cap.mjs`.

## Ảnh cặp (mockup │ web)
| Ảnh | Khung | Nội dung |
|---|---|---|
| `t3-qt-1440-toi.png` | T3 | QT 1440 tối: cột SOS 2–3 là hộp số (0 = chữ thường), cùng dáng Đạt MT / Case chưa có PA |
| `t3-qt-panel-sos-1440-toi.png` | T3 | bấm "12" hàng Monbay → panel tại chỗ "SOS 2–3 · Monbay · 12 học viên" (dòng em + điểm lượt mới nhất) |
| `t7b-qt-375-sang.png` | T7b | 375 sáng: thẻ chi nhánh, SOS 2–3 là hộp số |

## Bảng truy vết
| Khung | Thành phần | Sau PR | Ảnh | Đánh giá |
|---|---|---|---|---|
| T3 | Ô SOS 2–3 mỗi chi nhánh | chữ → hộp số `OSo` (0 không bấm), panel chỉ đọc `DanhSachNguon` | t3 | KHỚP |
| T3 | Hàng Toàn hệ thống · SOS 2–3 | hộp số, panel gộp em mọi chi nhánh | t3 | KHỚP |
| T3 | Panel SOS 2–3 | em SOS 3 trước, rồi SOS 2, rồi id; dòng em có lớp + điểm lượt mới nhất (dòng chuẩn panel số) | t3-panel | KHỚP (mockup không vẽ panel này — dùng panel số chuẩn T2) |
| T7b | 375 thẻ chi nhánh | SOS 2–3 hộp số | t7b | KHÁC nhỏ — mockup T7b vẽ "12" chữ, T3 (1440) vẽ hộp; theo rà vòng 2 "bấm được" → hộp ở cả hai |
| T7b | "+ 3 chi nhánh" gập chi nhánh rỗng | chưa làm | t7b | để PR kế TQ-375-GAP |
| — | Báo cáo HV (Phân tích) dùng cùng bảng | giữ chữ như cũ (chỉ Tổng quan đổi) | — | GIỮ |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Xem em SOS 2–3 một chi nhánh | không có (số chữ) — phải sang Học viên & Lớp › Đang SOS rồi lọc chi nhánh | bấm số → panel tại chỗ, ‹ / Back / F5 như mọi panel số |
| Bấm dòng chi nhánh / ô khác / Báo cáo › | có | như cũ |

Không thao tác nào bị bỏ.

## Máy chủ + Turso
- Bảng "Theo chi nhánh" gửi kèm `sos23Ids` (id em của ô — tập đã có trong bộ nhớ khi tính số): **0 câu, 0 dòng thêm khi mở trang** (đo `/tong-quan/v5` trước → sau không đổi).
- Đường mới `GET /tong-quan/chi-nhanh/sos23?branchId&ids` — chỉ khi bấm: giữ em trong phạm vi người xem (+ đúng chi nhánh) bằng MỘT câu theo đúng các em, đánh giá lượt mới nhất CỦA các em đó, giữ SOS ≥ 2; thứ tự khoá (SOS 3 → 2 → id). Không tính lại cả chi nhánh.
- Quyền: QL chi nhánh khác → 403; id em ngoài phạm vi bị bỏ; GVBM → 403; Quản trị / CX mọi chi nhánh. Phép kiểm `prTqSosCn` (số panel = ô bảng mọi chi nhánh, hai khung; thứ tự; quyền).

| Đo | Câu | Dòng |
|---|---|---|
| Seed ×3 · một chi nhánh (36 em) | 9 | 477 |
| Seed ×3 · Toàn hệ thống | 8 | 476 |
| Cách đầu tiên (tính lại cả chi nhánh) · seed ×3 | 10 | 3 358 |
| **Bản chép thật 12/11** · QT một chi nhánh (Cẩm Phả, 52 em) | 10 | 807 |
| **Bản chép thật** · QL Uông Bí (43 em) | 8 | 616 |
| **Bản chép thật** · QT Toàn hệ thống (175 em) | 7 | **2 576** ⚠ |
| Bản chép thật · trang `/tong-quan/v5?ct=ft` (để so) | 41 | 22 412 |

⚠ Panel Toàn hệ thống vượt ~2 000 dòng (đánh giá lượt mới nhất của 175 em). Chỉ đọc khi Quản trị / CX bấm ô tổng; ước ~5 lần bấm / ngày → ~13 000 dòng / ngày (≈ 0,1 % ngân sách 15 triệu / ngày). Trần `TRAN` / `TRAN_DONG` thêm cho ba đường.

## Rà trước PR
- impeccable `audit`: detector 0 phát hiện; dùng lại `OSo` + `DanhSachNguon` có sẵn (không thành phần mới) — a11y / theming / responsive như ô số khác.
- `web-design-guidelines`: ô là `button` có nhãn số, panel chuẩn có ✕ + Esc; không chữ bị cắt mới.
- `/ponytail-review`: không có gì cắt.
