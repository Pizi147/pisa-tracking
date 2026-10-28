# V8 — mockup ĐỀ XUẤT bố cục (đêm 29/10, chờ chủ SP duyệt)

PTA Plan giao 29/10: các màn điểm critique thấp nhất sau đợt sửa hình ảnh RA-UI (#676–#687 — sửa nhỏ chỉ nâng trung bình 28,3 → 28,9 vì phần còn lại là BỐ CỤC). **Chưa code** — chủ SP duyệt mockup trước. Mỗi tệp: khung 1440 TỐI + 375 SÁNG cạnh nhau, đủ trạng thái; ghi chú vàng nằm ngoài khung web. Tệp `-ghi-chu.md` cạnh mỗi mockup: điểm hiện tại, vấn đề bố cục, phương án, bảng thao tác TRƯỚC → SAU (không mất thao tác), câu hỏi.

| Mockup | Web hiện tại (/40) | Mockup (/40, critique tự chấm Nielsen) | Phương án chính |
|---|---:|---:|---|
| [ho-so-lop.html](ho-so-lop.html) | 25 | 30 → 32 → **33** | đầu trang 4 hàng ~170 px (web ~370): nhận diện + nút · GV bộ môn · số + badge "›" · "Việc của tôi" một hàng; MỘT hàng công cụ trên bảng (Cách xem │ lọc │ lượt · Chọn nhiều); 375 thẻ em đủ L R W S Overall thẳng cột |
| [tong-quan.html](tong-quan.html) | QL 28 · GV 27 · TVV 29 | 31 → 32 → **33** | GV 1440 hai bảng xếp chồng (hết cắt chữ); SOS một kiểu mọi màn; thẻ 375 nhãn trên / số dưới thẳng lưới; TVV hết thẻ mồ côi |
| [cong-viec-ql.html](cong-viec-ql.html) | 26 | 30 → **35** | "Chờ bạn duyệt" là nhóm đầu CỘT TRÁI (khung c1 đã duyệt); panel phải cao hết cột; một "Tất cả" (phạm vi), khung thành ô chọn "Mọi khung ▾"; duyệt nhiều bằng ô tích + thanh chọn dính chân cột |
| [phan-tich.html](phan-tich.html) | 26–30 | 29 → **35** | một hàng lọc thẳng (ô cao 36, Xếp theo + chip GV lên hàng này, Xuất / In / ⋯ cuối hàng mọi tab); thẻ chỉ số đầu mọi tab; ⓘ ra khỏi đầu cột; 375 bảng nhiều cột thành thẻ |

Hai mockup Hồ sơ lớp / Tổng quan dừng ở 33 (đã quá 30 + 2 vòng, không còn P0 / P1 — luật cổng chất lượng 28/10); còn lại: trang 375 dài (33 thẻ em), TVV 1440 nhiều khoảng trống.

## Câu hỏi cho chủ SP (gộp — chi tiết trong từng `-ghi-chu.md`)
1. **Công việc QL** mặc định "Tất cả" (như web) hay "Của tôi" (luật "việc của tôi ở trang đầu vai")?
2. Khung FT / Lớp thường ở Công việc thành ô chọn "Mọi khung ▾" (bỏ hai "✓ Tất cả" cạnh nhau)?
3. Bấm dòng duyệt mở panel duyệt; "Từ chối…" nhập lý do trong panel; sau duyệt có "Hoàn tác" + "Yêu cầu tiếp ›"?
4. **Phân tích › Kết quả Test** chứa tab con "Thi thật" — luật G2: Thi = thi thật (IELTS…), Test = MT / Progress / Final. Đổi tên "Kết quả thi", tách tab, hay giữ? (mockup chưa đổi)
5. Kết quả Test: gộp "Case / PA" + "Việc tiếp" thành cột "Xử lý"; giữ "⚠ quá hạn" trong báo cáo hay bỏ theo G8 (báo cáo thuần)?
6. Số trong chip Đạt / SOS không gạch chân — ngoại lệ dáng ô số?
7. Thẻ chỉ số đầu tab trùng số với dòng Tổng của bảng — giữ cả hai?
8. SOS: số NGOÀI chip (quyết định 23/10, mockup đang vẽ) hay TRONG chip ("SOS 2 · 1")?
9. Hồ sơ lớp: bỏ nút "Sửa thông tin" ở hàng công cụ, chỉ còn trong ⋯ đầu trang (mục này đã có sẵn ở ⋯)?
10. Đầu Hồ sơ lớp thêm "chương trình · số HV · tuần · khai giảng" (dữ liệu đã có)?
11. 375: ba ô "Việc của tôi" đầu Hồ sơ lớp cao ~480 px — giữ hay gập "Việc của tôi · 28 ▾"?
12. Tổng quan GV: hai bảng xếp chồng — khối chủ nhiệm phải cuộn mới thấy, đồng ý?
13. Dòng "Thi thật" của TVV: mockup V5 có tên em + hạn, web chưa có dữ liệu — thêm dữ liệu máy chủ?
