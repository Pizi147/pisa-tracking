# GD-4b — Dòng quy chế cho mọi panel việc · chân panel việc (lời 36) · mục Báo PH sau Phối hợp SOS

Plan: `09-plan-giao-dien-dot-2.md` GD-4 ý **(c)**; bảng 83 câu `thiet-ke/v21/bang-mau-ghi-chu.md` mục 2 (bản trên main sau #1607: Q9, Q72 sửa theo LG-9 / LG-10); `04-thiet-ke.md` 12–15; `10-ra-dong-bo.md` B (chân panel); `dong-bo-ghi-chu.md` dòng 25–29, 40c, [XM-⓪1] (lời 36). Nâng tiếp thành phần GD-3 (`shared/domain/quyChe.ts` + `DongQuyChe` trong `KhungPanel`), không dựng bản thứ hai.

Ảnh cặp (trái mockup · phải web; seed demo 14/09; 1440 tối, 375 sáng; phông Be Vietnam Pro đã nạp — chữ "phông OK" trên ảnh):

| Ảnh | Mockup | Web |
|---|---|---|
| `cap-1440-xu-ly.png` | ⑤ D1a | vai 7 · Công việc › Ý thức › Xử lý vi phạm › một em |
| `cap-375-xu-ly.png` | ⑤ D4 | như trên, 375 |
| `cap-1440-bao-ph-tvv.png` | ④ K2a | vai 23 TVV · Công việc › Báo PH |
| `cap-1440-ket-qua-pa.png` | ③ K2a | vai 7 · Công việc › Case › Ghi kết quả PA |
| `cap-1440-mo-ta-case.png` | ③ K3a | vai 7 · Công việc › Case › Mô tả Case |
| `zoom-x-ba-cham.png` | ⑤ F2, D1 · ③ | góc ✕ / ⋯ phóng to |

## 1. Truy vết câu → panel (Q1–Q83)

Câu ở `shared/domain/quyChe.ts` (GD-3) + `quyCheCase.ts` · `quyCheYThuc.ts` · `quyCheVanHanh.ts` (mới, mỗi hàm ghi số Q + nguồn); EN ở `shared/i18n/en/quyChe*.ts`. Mọi giá trị `{…}` lấy từ dữ liệu panel đã nạp.

| Q | Panel (tệp) | Biến thể đã gắn | Kết quả |
|---|---|---|---|
| Q1 Q2 Q5 Q6 Q7 Q9 Q58 | Nhập điểm một lượt / theo tuần (`congViec/PanelViec.tsx`) | MT cũ › tuần Test qua ≥ 2 tuần › chưa tới tuần Test › quá hạn từ {ngày} › mặc định Mock / lớp thường "Đạt từ {n} %" / MT0 | KHỚP |
| Q3 Q4 Q8 Q11 | ô từng em trong hộp nhập điểm | — | BỎ: câu theo ô, hộp nhập không có dòng quy chế (⑤ E giữ chân "Lưu · bài tiếp ›" + Vắng + ⋯) |
| Q10 Q12 | Chấm Speaking (`PanelChamSpeaking.tsx`) | mặc định / QL nhập hộ (xem hàng đợi GV khác) | KHỚP |
| Q13 | Mô tả Case (`cases/CasePanel.tsx`) | hạn việc nếu có | KHỚP |
| Q14 Q15 | Xác nhận PA (`yThuc/CaseSosControls.tsx`, `congViec/XacNhanPaLo.tsx`) · Không cần theo dõi | "chạy từ hôm nay / từ {ngày}" · n ngày `hanDuyetNgay()` | KHỚP |
| Q16 Q17 | Chọn PA (GD-3) | giữ | KHỚP |
| Q18 Q19 | Thêm PA (`cases/ThaoTacCase.tsx`) | loại GV tự làm / loại cần QL duyệt | KHỚP |
| Q20–Q26 | Ghi kết quả PA · Mini Test (`cases/CapNhatTuan.tsx`) | Mini Test › kỳ cuối › Xin hỗ trợ QL › Kết thúc › Điều chỉnh / Thay › PA quy chế › mặc định | KHỚP |
| Q27 | Xác nhận Case lớp thường | hạn `sos.dueOn` — câu theo mã "lưu xong PA Bổ trợ chạy" ([XM-10] ⑤) | KHỚP (chữ theo mã) |
| Q28 Q29 | Xác nhận Case Speaking (`CasePanel.tsx`) | dùng nhận xét người chấm / viết khác | KHỚP |
| Q30 Q31 | Hoàn thành Case (`ThaoTacCase.tsx`) | còn PA đang chạy | KHỚP |
| Q32 Q33 | + Task › Case (`cases/QuickReport.tsx`) | mặc định / Gấp | KHỚP |
| Q34 Q35 | Ghi vi phạm (GD-3) | giữ | KHỚP |
| Q36 Q63 Q52 | Tình hình học tập (`yThuc/TinhHinh.tsx`) | GV báo / TVV hỏi / GVCN trả lời (hạn thật) | KHỚP |
| Q37–Q40 | Viết Báo cáo PH (`classes/TabBaoCaoPh.tsx`) | quá hạn › phần Chung › FT › lớp thường | KHỚP |
| Q41 Q57 | Bàn giao môn / GVCN n em (`classes/BanGiaoPanel.tsx`) | hạn thật | KHỚP |
| Q42 | Bàn giao đổi GV (`BanGiaoGvPanel.tsx`) | phiếu còn mở | KHỚP |
| Q43 | Việc được giao (`worklist/MgmtTasksPage.tsx`) | mặc định | KHỚP |
| Q44 | Xem vi phạm mới (`yThuc/PanelXemViPham.tsx`) | có vi phạm mới | KHỚP |
| Q45 Q46 Q47 | Xác nhận xử lý (`yThuc/XacNhanXuLyPanel.tsx`) + lô (`LoYThucPanel.tsx`) | Nâng 1 bậc (TVV + hạn) / Không nâng · Vượt bậc / Ngoài thang | KHỚP |
| Q48 Q49 | Đã thực hiện (`DaThucHienPanel.tsx`) | Meeting PH dự / mặc định | KHỚP |
| Q50 | Thu hồi xử lý (`XemXuLyPanel.tsx`, hộp hỏi) | GVCN gửi QL / QL thu hồi; quá hạn tự chốt theo GVCN (mã đã theo LG-10) | KHỚP |
| Q51 | Khai cấp bậc (`KhaiBacPanel.tsx`, `KhaiBacLoPanel.tsx`) | mặc định | KHỚP |
| Q53 Q54 Q55 Q62 | Phối hợp SOS (`PanelViec.tsx` PanelPhoiHop) | dòng Meeting → Q54 · khác → Q53 · "Bỏ" (chọn ở từng em) vào ⓘ · TVV Q62 | KHỚP |
| Q56 | Báo PH kết quả Test (PanelBaoPh) | mặc định | KHỚP |
| Q59 Q78 Q79 | Đề xuất chuyển lớp / Chuyển lớp (`students/ChuyenLopPanel.tsx`) | đề xuất / Ngay hôm nay / "Bắt đầu {tuần đã chọn}" | KHỚP |
| Q60 Q61 | Báo PH TVV (`congViec/PanelBaoPhTvv.tsx`) | Đã báo / Chưa liên hệ được (hạn thật) | KHỚP |
| Q64 Q65 Q67 | Chốt ngày thi · Cập nhật KQ thi thật · Tạm dừng / Kết thúc (`congViec/PanelSauThi.tsx`) | theo bước | KHỚP |
| Q66 | Lộ trình mới (`students/PanelLoTrinhMoi.tsx`) | mặc định | KHỚP |
| Q68 | Bổ sung hồ sơ (`students/StudentManagePanel.tsx` khi đi từ việc) | mặc định | KHỚP |
| Q69–Q73 | Hộp duyệt QL (`duyet/HopChoDuyet.tsx`) | theo loại thẻ, "Còn {n} ngày"; Q72 theo LG-10 (bảng main) | KHỚP |
| Q76 | Xét lại lộ trình (`classes/PanelXetLai.tsx`) | còn em | KHỚP |
| Q81 | Phân công Case chưa có người (PanelViec) | mặc định | KHỚP |
| Q74 Q75 Q77 | Chốt lộ trình · Kỳ vọng đầu ra | — | BỎ: việc mở TRANG Cuối khoá (`CuoiKhoaLop.tsx`), không phải panel; trang đã có "⚠ Ghi lý do ngắn" (Q75) — đưa vào khi trang đó làm lại |
| Q80 | Xếp lịch MTn | — | BỎ: `NganXepLichMt` là ngăn xếp lịch chung, không biết "PA chờ mốc"; mã không có "Bỏ qua" → câu sẽ sai |
| Q82 | Nhập hộ điểm | — | BỎ: vai / lượt nằm trong `DiemTheoLop`, panel không có dữ liệu — cần đưa dữ liệu lên (PR sau) |
| Q83 | Xuất báo cáo PH | — | BỎ: nút trong tab, không có panel |

**KHỚP 37 / 37 dòng gắn được** (BỎ có lý do: 4 dòng câu theo ô, 5 dòng không có panel / thiếu dữ liệu — không tính).

## 2. Chân panel việc (lời 36, dòng 40c ⓪ — thắng ⑤ D2 cũ)
- `DongKhungPanel` (context mới trong `ui/KhungPanel.tsx`) đưa hàm đóng của panel (cùng đường ✕ / Esc: đang gõ dở thì hỏi "Bỏ chữ, đóng") xuống; `NutDongPanel` (`ui/KhuonViec.tsx`) vẽ "Đóng"; `NutVaTiep` tự có "Đóng" trước nút việc → Xác nhận Case, Xác nhận PA, Thêm PA, Ghi kết quả PA: "Đóng · nút việc · {việc} · việc tiếp ›" (còn việc kế) / "Đóng · nút việc" (lẻ). Panel lồng trong Case (đã có "Đóng" ở chân ngoài) không vẽ lần hai.
- Báo PH TVV: "Đóng · Lưu · Lưu · việc tiếp ›" (④ K2a).
- 375: "Đóng" ẩn ở chân dính đáy (⓪ dòng 26, ⑤ D4) — đóng bằng ✕ / ‹.
- Dòng quy chế: chân thường → nằm TRONG chân (dính đáy ở 375, ⑤ D4); chân v3 / không chân → ngay trên chân như GD-3.

## 3. KHÁC / [XM]
- **[XM-A] Chân chưa có "Lưu · việc tiếp ›"** ở các panel mở từ danh sách còn việc kế nhưng chưa có đường "việc kế": Xác nhận xử lý, Đã thực hiện, Khai cấp bậc, Xem vi phạm, Bàn giao, Phối hợp SOS (lưu từng dòng em). Lời 36 = "GIỮ nút gộp đang có" — PR này không thêm đường việc kế mới (đụng luồng `onTiep` từng panel). Đề xuất PR riêng nếu PTA Plan muốn mọi panel có nút gộp.
- **[XM-B] Q27** câu theo mã "lưu xong PA Bổ trợ chạy" (bảng ghi "PA Bổ trợ đã chạy"); vế "quá hạn báo QL" giữ chữ bảng.
- **[XM-C] Q29** bảng "tối thiểu 10 ký tự" — mã `CHU_TOI_THIEU_CASE = 8` (chủ SP 14/11) → câu lấy hằng (8).
- **[XM-D] Q9 MT0** web: FT "MT0: "-" = vắng: lần 1 dời sang tuần sau · lần 2 huỷ" (khớp bảng main trừ chữ "như Mock"); lớp thường "dời sang tuần sau, không huỷ" (chủ SP 14/11; ⋯ › Huỷ của GV là #1601 — khi merge thêm vào ⓘ).
- **[XM-E] Câu thêm không có trong bảng** (biến thể thiếu dữ liệu / lựa chọn bảng chưa có): "Lưu xong PA chạy" (Q18 Case đã có PA) · Q64 "Dời tháng dự kiến" · Q48 lần ngoài thang · các câu không ngày khi panel không có hạn.
- **Bỏ dòng trùng:** thân Xác nhận xử lý "Lưu xong: TVV {ten} nhận việc báo PH · hạn …" (nay ở dòng quy chế Q45); KhongTheoDoiForm "Gửi Quản lý duyệt · trả lời trong n ngày · xem ở Yêu cầu của tôi" (nay Q15, "Kết quả xem ở Yêu cầu của tôi." vào ⓘ).
- **Mục Báo PH (GVCN)** ở tab Ý thức & Phối hợp đứng SAU Phối hợp SOS (mục riêng `bao-ph-test`, cùng tên "Báo PH"); TVV giữ mục `bao-ph` trước Phối hợp như cũ (phép kiểm `prLt2a` (7)).

## 4. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| Đọc "lưu xong thì sao" ở panel việc | 4 panel có dòng quy chế (GD-3) | mọi panel việc gắn được (37 nhóm câu) | THÊM |
| Đóng panel Case (Xác nhận Case / PA, Thêm PA, Ghi kết quả) | ✕ / Esc | + nút "Đóng" ở hàng nút (≥ 640) | THÊM (lời 36) |
| Đóng panel Báo PH TVV khi đang ghi | ✕ / Esc | + "Đóng" trước "Lưu" (≥ 640) | THÊM (lời 36) |
| Xem chi tiết luật | ⓘ một số panel | ⓘ ở dòng quy chế khi có chi tiết | GIỮ / THÊM |
| Tìm Báo PH kết quả Test trong tab Ý thức | mục đầu tab | mục sau Phối hợp SOS | ĐỔI chỗ (PTA Plan 15/11) |
| Mọi nút lưu / gộp / ⋯ / Hoàn tác đang có | có | có | GIỮ |

Không thao tác nào bị mất.

## 5. Đo ✕ / ⋯ / ⓘ (`getBoundingClientRect` + `Range`; ≤ 1 px)

| Chỗ | 1440 | 375 |
|---|---|---|
| ✕ panel việc · Case (so với dòng loại) | 36×36, lệch 0 | 44×44, lệch 0 |
| ✕ panel Xem vi phạm | 36×36, lệch 0 | 44×44, lệch 0 |
| ✕ hộp chọn em (so với tiêu đề) | 36×36, lệch 0,3 | 44×44, lệch 0,3 |
| ⋯ đầu hồ sơ HV (so với "+ Case") | 36×36, lệch 0 | 44×44, lệch 0 |
| ⓘ dòng quy chế (so với dòng chữ câu) | 14×14, lệch 0,9 | 44×44 vùng bấm; câu hai dòng → ⓘ căn giữa khối (như ⑤ D4) |

## 6. Hướng dẫn "?"
`shared/huongDan/gv.ts` Công việc thêm mục `cv-quy-che` (dòng quy chế + chân panel) — EN ở `shared/i18n/en/quyCheVanHanh.ts`.

## 7. Turso
Chỉ đổi hiển thị — 0 câu, 0 request thêm (mọi giá trị trong câu từ dữ liệu panel đã nạp).
