# LICH-THI-NOI-THI — Nơi thi + lọc trên URL ở tab Lịch thi (Việc để sau GD-13b)

Mockup `thiet-ke/v21/hoc-vien-lop.html` ⑥ K4 (khối Kỳ thi "Nơi thi IDP / BC"), K8b (375). Việc để sau ghi ở `docs/anh/gd13b-lich-thi/khop-khac.md` KHÁC 1, 3.
Ảnh seed demo, tài khoản demo TVV (vai 23), phông Be Vietnam Pro + Inter đã nạp. Công cụ `scripts/anh-cap.mjs`.

## Ảnh cặp (mockup │ web)
| Ảnh | Khung | Nội dung |
|---|---|---|
| `k4-co-kq-noi-thi-1440-toi.png` | K4 | mở em có KQ: khối **Kỳ thi** — Ngày thi · **Nơi thi BC** · Ghi KQ; Lịch sử có dòng đổi nơi thi |
| `k4-hop-ngay-noi-thi-1440-toi.png` | K4 | hộp sửa lịch thi, đoạn **Ngày thi**: ô ngày · **Nơi thi [IDP / BC]** · Ghi chú · Đóng · Chốt ngày |
| `k8b-hop-noi-thi-375-sang.png` | K8b | 375 sáng: hộp xếp dọc — ô ngày · nhãn Nơi thi + ô 44 px · Ghi chú · Đóng / nút chính |
| `k4-loc-url-1440-toi.png` | K4 | mở thẳng `…&locThi=chua-chot` → lọc "Chưa chốt ngày" đã chọn (F5 / Quay lại giữ) |

## Bảng truy vết
| Khung | Thành phần | Sau PR | Ảnh | Đánh giá |
|---|---|---|---|---|
| K4 | Khối Kỳ thi · Nơi thi | hiện khi đã ghi (lời 40: không có thì không hiện); chữ ngắn | k4-co-kq | KHỚP |
| K4 | Hộp sửa · Nơi thi | ô chữ cạnh Ngày thi (chỉ ở đoạn Ngày thi — tháng dự kiến chưa có nơi thi); tuỳ chọn; Enter lưu | k4-hop | KHÁC nhỏ — mockup không vẽ ô nhập (chỉ vẽ giá trị); vị trí theo lệnh PTA "cạnh Ngày thi" |
| K4 | Lịch sử · n | dòng lưu có "nơi thi BC" / "bỏ nơi thi" | k4-co-kq | KHỚP |
| K4 | "Có KQ khoảng 21/09" | **KHÔNG làm** — cần luật số ngày có KQ theo loại kỳ thi (luật nghiệp vụ) → chờ chủ SP | — | BỎ (chờ chủ SP) |
| K4 | Lọc trạng thái thi + Mọi TVV | lên URL (`locThi`, `tvv` — cùng khoá `tvv` với tab Tất cả), ghi bằng replace | k4-loc-url | KHỚP |
| K8b | 375 hộp sửa | ô Nơi thi 44 px, nhãn trên | k8b | KHỚP dáng hộp đã có |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Ghi nơi thi | không có | hộp sửa lịch thi › Ngày thi › ô Nơi thi → Chốt ngày / Lưu ngày |
| Hoàn tác sau khi lưu | trả ngày / tháng / ghi chú cũ | + trả nơi thi cũ |
| Lọc trạng thái thi · Mọi TVV | state trang — đổi tab / Quay lại là mất | trên URL: F5, Quay lại, link chia sẻ giữ; `tvv` đi theo khi đổi tab Tất cả ↔ Lịch thi |
| Mọi thao tác khác (Tháng dự kiến / Ngày thi, Ghi chú, Ghi KQ, Chọn bước tiếp, Lịch sử) | có | như cũ |

Không thao tác nào bị bỏ.

## Máy chủ · dữ liệu
- Migrate `prNoiThi`: CHỈ thêm `learning_cycles.noi_thi TEXT NULL` (khớp `schema.sql`), chạy lặp không làm gì. **Bản chép thật 12/11** (sao lưu mới nhất): thêm cột, 980 lộ trình giữ nguyên (0 có nơi thi), chạy lần hai không đổi.
- `PUT /hoc-vien-lop/lich-thi/:cycleId` nhận `noiThi`: gộp khoảng trắng, tối đa 40 ký tự (400), "" = bỏ; cùng quyền sửa ngày thi (`coTheSua` — QL chi nhánh khác 403); ghi trong dòng nhật ký `lich_thi.luu` (before / after có `noiThi`). Phép kiểm `prNoiThi` (lưu, bỏ, Hoàn tác, quá dài, quyền, migrate).

## Turso (đo `tocDo.run`, dữ liệu ×3, trước → sau)
| Đường | Câu | Dòng |
|---|---|---|
| `/hoc-vien-lop/lich-thi?thang=…` mọi vai (QL · QT · GVCN · GVBM · TVV · CX) | 22 → 22 | không đổi (vd QL 2 712 → 2 712) |
| `/hoc-vien-lop/lich-thi/:id/lich-su` | không đổi | không đổi |

Cột mới đọc chung câu danh sách có sẵn — 0 câu, 0 dòng thêm. Trần cũ giữ.

## Rà trước PR
- impeccable `audit`: detector 0 phát hiện; ô Nơi thi có `aria-label`, `maxLength` khớp máy chủ, `autoComplete="off"`, 375 cao 44; không chữ bị cắt "…" (đo DOM 1440 + 375: 0).
- `web-design-guidelines`: nhãn + ô cùng nhóm; lỗi máy chủ (quá dài) hiện ở hàng lỗi có sẵn của hộp, chữ đang gõ giữ.
- `/ponytail-review`: không có gì cắt — một cột, một nhánh trong `luuLichThi`, một ô.
