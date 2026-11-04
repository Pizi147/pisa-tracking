# U08 · Phân tích (audit 03/11, mockup `thiet-ke/v11/phan-tich.html` — chủ SP duyệt vòng 2)

Bảng ý: `14-ra-ux-b.md` mục 11.4 (U08-1 … U08-8) + 10.5 #1. Luật chung `30-pr-giao-dien.md`. Dữ liệu web: demo Mỹ Đình, vai QL 2, kỳ W1 SEP – W2 SEP. Phông kiểm `document.fonts` trước khi chụp.

## Ảnh cặp (mockup | web)
| Tệp | Khung |
|---|---|
| `b1-bao-cao-1440-toi.png` | B1 V11 · Báo cáo HV (U08-1, 10.5 #1) |
| `a2-panel-sos-1440-toi.png` | A2 · Test + SOS · bấm "SOS 2" → panel 720 có điểm (U08-2) |
| `a3-mock-1440-toi.png` | A3 · Kết quả Test · Mock (U08-3, 5, 6) |
| `a3p-panel-case-1440-toi.png` | A3 V11 · bấm SOS → panel Case theo kỹ năng (U08-4) |
| `a4-thi-that-1440-toi.png` | A4 · Thi thật (U08-7, 8) — demo không có kết quả thi thật nào nên web là trạng thái rỗng; bỏ cột / "Chưa chọn" kiểm bằng mã + test |
| `c2-mock-375-sang.png` | C2 · Kết quả Test 375 |

## Truy vết
| Ý | Thành phần | Kết quả | Ghi chú |
|---|---|---|---|
| 10.5 #1 | Dải chỉ số hai nhóm: "Trong kỳ W1 SEP – W2 SEP" (Đạt MT · Đạt Target thi thật · Thi trong kỳ · PA cải thiện) │ "Hiện tại" (Case có PA), 4 : 1; bỏ "· trong kỳ" lặp | KHỚP | ⓘ Đạt MT / PA cải thiện GIỮ cạnh tên |
| B01 | Đạt MT "2/3 HV · **8** chưa đủ dữ liệu" | KHỚP | cùng `mauDatMt` của Tổng quan |
| B1 | Đạt Target thi thật rỗng "– chưa có dữ liệu" chữ mờ 17 | KHỚP | trước: viên viền đứt |
| U08-1 | Kết quả MT: Đạt Target xanh · Thiếu 0.5 vàng · Thiếu 1.0 cam · ≥ 1.5 đỏ · Chưa đủ xám; số 0 mờ; tiêu đề cột giữ chữ | KHỚP | token `ok / soon / late / bad` |
| U08-1 | Tiến bộ: ↑ Tăng xanh · ↓ Giảm đỏ · Giữ trung tính; số 0 mờ; "L 6 lượt" một dòng | KHỚP | |
| U08-1 | So lượt trước "↑ 1 · = 2 · ↓ 0" (↑ xanh đậm, ↓ đỏ đậm, 0 mờ); tiêu đề "So lượt trước · HV" | KHỚP | B17 |
| B16/B25 | Phụ đề "· % trên HV đủ dữ liệu"; dòng phụ "8 HV · 3 đủ dữ liệu" | KHỚP | |
| B1 | Bảng 1.75 : 1 | KHỚP | |
| B1 | Hàng MT0 · Thi thật trong Kết quả MT | KHÁC (dữ liệu) | GIỮ — hàng có sẵn (V4), mockup chỉ vẽ MT1–MT3+ |
| U08-2 | Panel SOS 720 px, mỗi lượt có điểm L R W S + Overall / KV | KHỚP về rộng + điểm | KHÁC dáng: dùng `DongDiem` chung của MỌI panel số (một mẫu dòng điểm), không bảng riêng chỉ cho panel này. Tên không xuống dòng |
| U08-3 | Bỏ cột "Xử lý" | KHỚP | nội dung → panel U08-4; Xuất Excel GIỮ cột Case / PA · Việc tiếp |
| U08-4 | Chip SOS = nút → panel "CASE · KẾT QUẢ TEST", "{tên} · MT2 · SOS 2", "lớp · tuần · n kỹ năng dưới kỳ vọng"; mỗi kỹ năng dưới kỳ vọng một khối mở rộng, khối đầu mở sẵn: Case · Phụ trách + hạn · PA · Kết quả PA; không Case → "Chưa có Case" | KHỚP | chỉ đọc (G8); tên HV, lớp là link |
| U08-5 | "MT2" 15 / 600 màu chữ (hồ sơ lượt) + "W1 SEP" 13 mờ | KHỚP | |
| U08-6 | Tên HV · lớp · MT: chữ thường, không gạch; rê / focus-visible → accent + gạch + vòng focus | KHỚP | `LINK_CHU`; lớp → hồ sơ lớp (mới) |
| U08-7 | Thi thật bỏ cột "Người chọn" | KHỚP | Xuất Excel GIỮ Người chọn · Ngày chọn |
| U08-8 | Chưa chọn = "Chưa chọn" mờ, bỏ "· Hồ sơ HV ›" | KHỚP | xử lý → bấm tên HV |
| A3 | "Chưa đủ điểm" ghi "không vào tỷ lệ" (mockup 47 %), Đạt / Chưa đạt % trên lượt có kết quả | KHÁC (luật số) | GIỮ cách tính đã chốt (`ketQuaThi.ts`) |

Về hình: 15 / 16 dòng KHỚP (94 %) — dòng KHÁC hình duy nhất là panel A2 dùng mẫu dòng điểm chung (có lý do: một mẫu cho mọi panel số). Hai dòng KHÁC còn lại là dữ liệu / luật số.

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | Vì sao |
|---|---|---|---|
| Xem Case / PA / việc tiếp của lượt Mock | cột "Xử lý" (bấm mở Case) | bấm chip SOS → panel Case theo kỹ năng (chỉ đọc); mở hồ sơ qua tên HV | U08-3, 4 |
| Bấm chip SOS | hộp "Vì sao SOS" | panel Case theo kỹ năng (đầu panel có số kỹ năng dưới kỳ vọng) | U08-4 |
| Tên lớp | chữ, không bấm | link hồ sơ lớp | U08-6 |
| Thi thật "Người chọn" | cột | bỏ (Xuất Excel giữ) | U08-7 |
| Thi thật chưa chọn "· Hồ sơ HV ›" | link | bỏ — bấm tên HV | U08-8 |
| Panel SOS (Test + SOS) | 480, chỉ tên | 720, kèm điểm lượt | U08-2 |
| Xuất Excel · In · lọc · panel số mọi ô | có | có | GIỮ |

## Turso
- Mở trang: **+0**.
- Bấm chip SOS (Kết quả Test): **1** `GET /hoc-vien-lop/em/:id` (đường sẵn có của panel một em; một em).
- Mở panel số Test + SOS (FT, cột theo lượt): thêm điểm lượt — 1 câu lượt theo id + điểm / lịch của chính các lượt đó (`mockTrongKhoang` với `luot` sẵn, không Case); chỉ khi MỞ panel.

## Chú thích `ponytail:`
Không có.
