# LPB-2b · Báo PH · Chuyển lớp, "Sau khi lưu · việc tự giao", chữ ô tích — khớp / khác với mockup v28 (L1a–L1d · L2a–L2e)

Ảnh cặp cả màn (trái mockup · phải web, dữ liệu demo; web tối ở 1440 / 1280, sáng ở 375) — `docs/anh/lpb-2b/`:
- `tvv-{1440,1280,375}.png` — TVV (Lê Thu, MB) · Công việc › Báo PH · dòng "MB FT 101 · 2 em · Chuyển lớp · vào W4 SEP" mở panel nhiều em, em đầu mở (mockup L2a · L2e · L2b)
- `chuyen-lop-{1440,1280,375}.png` — Head · panel Chuyển lớp (1440 / 1280: "Từ tuần"; 375: "Ngay hôm nay") (mockup L1a · L1b)
- `phan-cong-{1440,1280,375}.png` — Head · hộp Lưu phân công, một cặp đổi GV (mockup L1c · L1d)

Mã tuần demo "W4 SEP" thay "W3 SEP" của mockup (ngày demo 14/09/2026, tuần vào 21/09).

## Bảng truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|
| L1a khối "Sau khi lưu · việc tự giao" (3 hàng việc · người nhận · hạn) | `SeGiao` ở `ChuyenLopPanel` (thẻ nền `surface-2`, viền); người nhận do máy chủ trả trong `GET /students/:id/chuyen-lop` (`seGiao`) | chuyen-lop-1440 / 1280 | KHỚP |
| L1a hạn Bàn giao | `hanBanGiaoLenh` sẵn có của panel (luật: 5 ngày FT · hết tuần Final lớp thường) — số khác mockup vì dữ liệu khác | chuyen-lop-1440 | KHỚP (cùng luật) |
| L1b "Ngay hôm nay" → còn hàng Bàn giao + một câu "không giao việc Báo PH và Nhận thông tin" | `SeGiao ngayNay` | chuyen-lop-375 | KHỚP |
| L1c / L1d ô tích "Tạo việc bàn giao · báo BPXL" + dòng phụ hai việc và hạn | `HopLuuPhanCong` (chữ ô tích, hai dòng `.ct`, `hanBanGiaoGv` · `hanChuNhat`) | phan-cong-1440 / 1280 / 375 | KHỚP |
| L1d cặp bỏ tích "Không tạo việc nào cho cặp này" | `HopLuuPhanCong` (`boTao`) | — (bấm bỏ tích trên demo) | KHỚP theo mã |
| L1c hộp dạng cửa sổ giữa màn | hộp nổi neo sẵn có (`NoiNeo`, tấm dưới đáy ở 375) | phan-cong-1440 | GIỮ (ghi chú v28 mục 1: "hộp sẵn có của web; chỉ đổi chữ") |
| L2a dòng danh sách "MB FT 101 · n em · Chuyển lớp · vào W3 SEP · hạn" | `chiTiet` (DanhSachViec) + `nhomChuyenLop.vao` (máy chủ) | tvv-1440 / 1280 | KHỚP (chỉ ghi "vào …" khi cả lô cùng một tuần) |
| L2c dòng em "Lên MB ELE 02" · "Lên FT · MB FT 112" | `nhomChuyenLop.chiTiet` (hướng · lớp mới) ở dòng em | tvv-1440 (dòng em mở) | KHỚP |
| L2a đầu panel "Báo PH · Chuyển lớp · lớp · n em · vào W3 SEP" | `PanelBaoPhNhieu` (`dauViec` + `tuanVao` từ `bao-ph-lo`) | tvv-1440 / 1280 / 375 | KHỚP |
| L2a bảng em: Học viên (+ "TVV tên") · Tuyến · Lớp mới · Ghi | `PanelBaoPhNhieu` (cột 3 = Lớp mới · tuần; `lopMoi`, `tuan`, `tvv` thêm vào `GET /y-thuc/bao-ph-lo`, không request mới) | tvv-1440 / 1280 | KHỚP |
| L2a khay em: Phụ trách · Hạn · Theo dõi · Tuyến · Việc con | `PanelBaoPhTvv nhung` sẵn có | tvv-1440 | KHỚP (+ "Mô tả việc" của khối sẵn có — GIỮ) |
| L2a / L2b khối "Chuyển lớp · máy điền sẵn" (Lớp · Bắt đầu · Hướng · Lý do) | `KhoiChuyenLop` (đọc `chuyenLop` của `GET /y-thuc/bao-ph/:id`, máy chủ đã có từ LPB-0) | tvv-1440 / 375 | KHỚP |
| L2b việc gộp: hai khối bối cảnh (Final + Chuyển lớp) | khối Final = hàng "Máy điền sẵn" của `BoiCanh` (sẵn có) + `KhoiChuyenLop` | (demo: chưa có em gộp) | KHÁC nhỏ — khối Final không có tiêu đề riêng "Kết quả Final · máy điền sẵn"; chưa có ảnh dữ liệu thật |
| L2a / L2c lệnh huỷ → "Báo lại · Huỷ chuyển lớp", khối "Huỷ chuyển lớp · máy điền sẵn" | `KhoiChuyenLop` (`loai` huỷ / `lenhDaHuy`) | — | KHỚP theo mã (chưa có ảnh dữ liệu thật) |
| L2a tên bước Tuyến "Lệnh chuyển lớp" | tuyến LPB-0 đặt tên "Quyết định chuyển lớp" (máy chủ, PR trước) | tvv-1440 | KHÁC nhỏ — [XM] 1 |
| L2d em chưa có TVV → việc ở Head, dòng "… · chưa có TVV" | `chiTiet` máy chủ thêm "· chưa có TVV" | — (Head: việc ở tab Ý thức & Phối hợp, chưa chụp) | KHỚP theo mã |
| L2a đầu panel ⓘ · ⋯ | — | — | **BỎ** — ⓘ cần mục trợ giúp `hd` mới (như LPB-2a); ⋯ "Bỏ việc" đã ở ⋯ từng khay em |
| L2a chân "Lưu · Lưu · việc tiếp ›" | chân panel nhiều em: "Việc tiếp ›"; nút Lưu ở cuối khay từng em (TUYEN-2) | tvv-1440 | GIỮ |

Tỉ lệ khớp (KHỚP + KHÁC nhỏ + GIỮ trên tổng; BỎ không tính): 13 KHỚP / GIỮ · 2 KHÁC nhỏ · 1 BỎ → **≈ 94 %**.

## Thao tác TRƯỚC → SAU PR

| Thao tác | Trước | Sau |
|---|---|---|
| Mở panel Báo PH · Chuyển lớp (một em / cả lô) | mở được nhưng không thấy lớp mới · tuần · lý do (chỉ tuyến) | thấy khối "Chuyển lớp · máy điền sẵn"; bảng lô có cột Lớp mới · tuần + TVV của em |
| Đọc dòng Công việc | "Chuyển lớp" — không biết vào tuần nào, em sang lớp nào | "Chuyển lớp · vào W…"; dòng em "Lên MB ELE 02" |
| Ra lệnh Chuyển lớp (Head) | không biết việc nào sẽ giao cho ai | thấy "Sau khi lưu · việc tự giao" (người · hạn); "Ngay hôm nay" nói rõ không giao Báo PH / Nhận thông tin |
| Lưu phân công — ô tích | "Tạo việc bàn giao" (chỉ nói việc Bàn giao) | "Tạo việc bàn giao · báo BPXL" + hạn hai việc; bỏ tích nói không việc nào |
| Mọi thao tác cũ (Ghi kết quả, Chưa liên hệ được, ⋯ Bỏ việc, Trả lại, đổi người / hạn, Việc con, Sửa / Huỷ lệnh, Hoàn tác, Luôn chuyển sang …) | có | GIỮ nguyên |

Không mất thao tác nào.

## Máy chủ (không đường mới)

- `GET /y-thuc/bao-ph-lo`: thêm việc nguồn Chuyển lớp (`lopMoi`, `tuan`, `tvv`, chuỗi chấm tuyến) — hai câu cho cả lô (tên lệnh + tuyến theo lô); đo ở `tocDo.run.ts` (`TRAN_BAO_PH_LO_CL`).
- `GET /students/:id/chuyen-lop?toClassId=…`: thêm `seGiao` (người nhận Báo PH · Nhận thông tin, hạn) — dùng bộ chọn người của LPB-0 (`boChonNhanTin`); trần câu của đường này nâng theo số đo (`tocDoDuong.ts`).
- `/my-work`: `nhomChuyenLop` thêm `vao`, `chiTiet` (thêm cột vào câu sẵn có, không câu mới).

## [XM]

1. Tên bước Tuyến Chuyển lớp: mockup "Lệnh chuyển lớp", máy chủ LPB-0 "Quyết định chuyển lớp" — đổi chữ ở `dungChuyenLop` (PR riêng, đụng phép kiểm tuyến) hay sửa mockup?
2. ⓘ + ⋯ ở đầu panel nhiều em (như [XM] của LPB-2a).

## Chú thích `ponytail:`

Không thêm.
