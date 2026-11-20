# VIEC-XONG-AN — việc vừa xong ở Công việc: dải ngắn rồi ẩn, thứ tự không nhảy (chủ SP 21/11)

Lời chủ SP (ảnh nhóm "Kết quả PA 4 việc"): "Hiển thị thế này rất buồn cười, công việc nhảy liên tục vị trí khi có cái hoàn thành và không ẩn đi khi hoàn thiện xong".

Ảnh: tài khoản demo GV Trần Ngọc Hà (vai 7), ngày demo 20/09/2026 (Công cụ demo), giao diện tối, phông Be Vietnam Pro đã tải (`document.fonts.check` = true).
Mỗi lượt chụp chạy trên cùng bản CSDL demo (chép lại trước mỗi lượt) — TRƯỚC = `origin/main`, SAU = nhánh này.

## Nguyên nhân (đã kiểm)
1. **Không ẩn**: cố ý từ OV-5a / U01 #7 — `HoTroHocVienTab` giữ bản dòng lúc lưu (`giu`) và vẽ lại mọi dòng xong (mờ + gạch, "✓ Đã lưu · Xem lại")
   tới khi đổi nguồn xem; không có hạn giờ. Số đầu nhóm đếm từ máy chủ (đúng) nên "2 việc" mà thấy 3 dòng.
2. **Nhảy chỗ**: (a) dòng xong được nối CUỐI danh sách rồi xếp lại theo hạn — cùng hạn thì rơi xuống sau các dòng khác; (b) thứ tự chỉ "đóng băng"
   khi panel đang mở — đóng panel là sắp lại cả danh sách; (c) lưu một phần lưới Kết quả PA: dòng gộp "2 em" tan thành dòng lẻ của em còn lại
   (khoá mới) → em đó chen lên, dòng gộp cũ bị coi là "xong" và tụt xuống, gạch ngang dù còn việc (kèm đếm nhầm "1 xong hôm nay").
Không do máy chủ: `/my-work` đã không trả việc xong. Không đổi máy chủ, luật, quyền.

## Sửa
| Đích | Cách | Ảnh |
|---|---|---|
| Việc vừa xong: giữ chỗ ngắn rồi ẩn | Dải "✓ Đã lưu · {lớp · việc} · {em}" (+ "Hoàn tác" khi panel có đường đảo) phủ ĐÚNG chỗ dòng — dòng vẫn vẽ ẩn bên dưới nên cao bằng dòng, không đẩy dòng khác. 4 giây; có Hoàn tác thì 10 giây (= thời gian Hoàn tác của panel). Hết giờ dòng rời danh sách. | `cap-1440-2-ngay-sau-luu.png`, `cap-1440-3-sau-11-giay.png`, `cap-375-2…`, `cap-375-3…`, `sau-1440-dai-hoan-tac.png` |
| Thứ tự không nhảy | Trong CÙNG bộ lọc (nguồn · khung · hạn · tab · loại) mỗi dòng giữ vị trí lần đầu thấy — lưu, làm một phần, tải lại sau lưu, đóng panel đều không sắp lại. Dòng mới chen ngay sau dòng đứng trước nó theo thứ tự hạn; em còn lại của dòng gộp vừa tan đứng đúng chỗ dòng gộp. Đổi bộ lọc / tải lại trang thì sắp lại. | `cap-1440-4-dong-panel.png`, `cap-1440-luoi-2-dong-luoi.png` |
| Dòng gộp tan ≠ xong | Khoá dòng gộp còn việc máy chủ trả (em còn lại) thì không tính "xong": không dải, không vào "Xong hôm nay". | `cap-1440-luoi-2…`, `cap-375-luoi-2…` |
| Số đầu nhóm / tab / badge | Vẫn một nguồn (`/my-work`, #1840). Dòng vẽ = dòng đếm (+ dải vài giây). Tab còn hiện khi panel đang mở việc vừa xong (không biến mất dưới panel). | mọi ảnh |
| Hoàn tác ở dải | Cùng đường đảo panel đã báo (context `BaoHoanTac` ở `useHoanTac` — chân "✓ Đã lưu", dải việc vừa lưu — và `DaiVuaDoi` của Case). Bấm: dải "↺ Đã hoàn tác" đứng tới khi máy chủ trả lại dòng → dòng về đúng chỗ cũ; panel đang mở việc đó về form. Panel không có đường đảo (vd Ghi kết quả PA đơn, chỉ "Sửa") → dải chỉ "✓ Đã lưu". | `sau-1440-dai-hoan-tac.png` |

Áp đồng bộ: dải thay dòng ở MỌI kiểu dòng của danh sách Công việc — `DongViec`, `DongLop`, `DongGon` và em trong khay (`DongCon`), mọi tab
(Chấm điểm, Chấm Speaking, Case học thuật, Ý thức & Phối hợp, Vận hành; TVV cùng component).

GIỮ (không đổi): lưới Kết quả PA (`LuoiKetQuaPa`), Nhập điểm, Xác nhận PA lô — đó là FORM nhập theo lô, dòng đã lưu xuống cuối với giá trị đã ghi + "Sửa"
(chân "✓ Đã lưu n · m dòng chưa xong"); không phải danh sách việc cần làm, ẩn dòng đã lưu ở đó sẽ mất chỗ xem / sửa điều vừa nhập.

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Xem lại việc vừa xong | "Xem lại" trên dòng gạch ở lại trong danh sách | Chip "✓ n xong hôm nay" ở đầu trang (sẵn có, U01 #7) → danh sách việc xong trong phiên, bấm dòng = mở lại panel. Panel vừa lưu vẫn đứng nguyên ở cột phải. Không mất thao tác. |
| Hoàn tác | Chỉ ở panel (chân "✓ Đã lưu · Hoàn tác", dải việc vừa lưu) | Như cũ + ở dải dòng (cùng đường đảo, cùng 10 giây) |
| Việc tiếp › / Lưu · việc tiếp › / Hết việc | — | Như cũ (bỏ qua việc đã xong như trước) |
| Bỏ qua · Gia hạn · Xuất lớp · + Task · lọc | — | Như cũ |

## Đo
- Lời gọi: KHÔNG thêm. Lưu → 1 GET `/my-work` (như cũ). Hoàn tác ở dải → 1 GET (của chính đường đảo; dải chỉ gọi tải lại khi đường đảo chưa tự
  tải — so `theHe('/my-work')`). Đo bằng Playwright đếm request trên trang. Không đổi máy chủ → dòng đọc Turso không đổi.
- Kịch bản kiểm (Playwright, `/cong-viec?nhom=case-hoc-thuat`): Ghi kết quả PA đơn (action:14) · lưới 1/2 em (MB FT 101) · Thêm PA rồi Hoàn tác ở dải (support:48: dải → dòng về đúng vị trí 4/7).
- 375: dải hiện khi về danh sách ("‹ Công việc"); không tràn ngang.

## Tệp
`web/src/modules/congViec/HoTroHocVienTab.tsx` (giữ chỗ có hạn giờ, thứ tự, Hoàn tác) · `web/src/modules/congViec/DanhSachViec.tsx` (`VeDong`, `DaiXongDong`) ·
`web/src/ui/KhuonViec.tsx` (`BaoHoanTac`) · `web/src/modules/cases/CasePanel.tsx` (`DaiVuaDoi` báo đường đảo).
