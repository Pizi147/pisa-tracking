# CHAN-ROI-NHAP-2 — áp hỏi-khi-rời cho Cuối khoá, Lịch Test, panel đang sửa, đổi tài khoản / đăng xuất

Loại PR: **sửa nhỏ** (không đổi bố cục, chỉ dùng lại hộp sẵn có: `HopBoChu` chung, hộp "Bỏ chữ đang gõ?" của `KhungPanel`, chân "Bỏ · Gõ tiếp" của hộp điểm).
Nguồn: `plan.md` dòng [XM] PR-C Góc Phân công GV ("màn nên áp tiếp").

## Vì sao đổi cách gắn (một bộ chặn cho cả app)
Router chỉ giữ MỘT blocker (cái đăng ký sau thắng, hai cái là cảnh báo + cái trước bị bỏ qua). Gắn `useBlocker` riêng ở từng màn thì trang + panel
cùng lúc sẽ hỏng. Nên: `useChanRoiNhap` nay chỉ GHI nguồn nháp vào kho thuần `taoKhoRoiNhap` (`shared/domain/roiNhap.ts`); `ChanRoiNhapGoc`
(vẽ một lần trong `App`) là bộ chặn duy nhất. Góc Phân công GV (#785) dùng y như cũ — chỉ bỏ `{hopRoi}` vì hộp nay vẽ ở gốc.

## Từng nơi
| Nơi | "Nháp" là gì | Hỏi khi | Hộp |
|---|---|---|---|
| Cuối khoá lớp thường (`?xem=cuoi-khoa`) | số em có Hướng / Lớp / Kỳ vọng / nhận xét đổi chưa lưu (`soDoi` sẵn có) | ‹ hồ sơ lớp, link, menu, Back, đổi tài khoản, đăng xuất, đổi góc nhìn | chung: "Thay đổi lộ trình của n em chưa lưu — rời đi sẽ mất." |
| Lịch Test — ô lưới lớp thường lưu hỏng | tổng "n ô chưa lưu" sẵn có (`chuaLuu`) | link, Back, đổi tuần / chi nhánh / phạm vi / lớp (đổi dữ liệu lưới) | chung: "Còn n ô chưa lưu — rời đi sẽ mất." |
| Lịch Test / Chấm Test — hộp điểm đã gõ (`KhungHop`) | `daGo` sẵn có | Back / tiến của trình duyệt, đổi tài khoản / đăng xuất bằng phím (bấm link / nút ngoài hộp thì hộp đã tự chặn từ trước) | CHÍNH chân hộp: "Bỏ điểm Listening · em? · Bỏ · Gõ tiếp" |
| Panel đang sửa (`KhungPanel`) | chữ chỉ ở state (`chan.daSua`, `daSua`, form con báo) → rời trang là mất | link sang trang khác, Back / tiến (kể cả cùng trang — đóng panel `?viec=`) | CHÍNH hộp panel: "Bỏ chữ đang gõ? · Bỏ chữ, rời đi · Ở lại" |
| Panel có chữ ở nháp máy (`useNhap`) | rời trang KHÔNG mất (mở lại việc là còn) | chỉ đổi tài khoản / đăng xuất / đổi góc nhìn (đổi chủ xoá mọi nháp) | hộp panel |
| Đổi tài khoản demo · Đăng xuất · Đổi góc nhìn | mọi nguồn trên | hỏi TRƯỚC khi gọi máy chủ; Ở lại = không đổi gì | hộp của nguồn mở sau cùng |

Không hỏi hai lần: panel / hộp điểm đã trả lời "Bỏ" thì điều hướng vừa bấm đi thẳng; ✕ panel vẫn hỏi riêng như cũ (một lần), đổi việc
trong cùng trang (PUSH / REPLACE) vẫn do `boChuRoi` lo. Lưu xong (nguồn gỡ) → không hỏi; lưu xong lúc hộp đang mở → tự đi tiếp.

Bỏ (không có trạng thái nháp rõ): Lịch Test — "lịch đang sửa" (xếp lịch nằm ở Kế hoạch Test, panel → đã phủ qua `KhungPanel`); ô lưới FT gõ thẳng tự lưu ngay, chỉ ô lưu hỏng mới là nháp.

## Ảnh (nền tối)
`ql-1440-cuoi-khoa-link.jpg` · `ql-1440-cuoi-khoa-back.jpg` · `ql-1440-cuoi-khoa-doi-tai-khoan.jpg` · `ql-375-cuoi-khoa-link.jpg` ·
`gv-1440-panel-link.jpg` · `gv-1440-panel-back.jpg` · `gv-1440-panel-dang-xuat.jpg` · `gv-375-panel-back.jpg` · `gv-1440-lich-test-back.jpg`

## Bấm thử (QL Monbay NV-002, GV Trần Ngọc Hà NV-007)
| # | Vai · cỡ | Thao tác | Kết quả |
|---|---|---|---|
| 1 | QL 1440 | Cuối khoá MB FOU 12, chọn Học lại 1 em → menu Tổng quan | hộp "1 em"; Ở lại giữ URL + giá trị |
| 2 | QL 1440 | "‹ MB FOU 12" | hộp (thay `window.confirm` cũ); Bỏ nháp → về hồ sơ lớp |
| 3 | QL 1440 | 2 em → Back trình duyệt | hộp "2 em"; Ở lại giữ URL + 2 giá trị |
| 4 | QL 1440 | Đổi tài khoản demo → chọn GV | hộp trước khi đổi; Ở lại: vẫn QL, nháp còn; Bỏ nháp: thành GV, về Tổng quan, không hỏi lần hai |
| 5 | QL 1440 | Lưu nháp → menu | không hỏi |
| 6 | QL 375 | Sửa dòng (thẻ) → menu dưới | hộp, nút 44 px |
| 7 | GV 1440 | Công việc › Xác nhận Case, gõ Mô tả → menu | hộp panel "Bỏ chữ, rời đi"; Ở lại giữ chữ |
| 8 | GV 1440 | ✕ panel | hộp panel "Bỏ chữ, đóng" MỘT lần; Bỏ chữ → đóng, không hỏi thêm |
| 9 | GV 1440 | gõ → Back (đóng panel `?viec=`) | hộp panel; Bỏ chữ → rời, không hỏi thêm |
| 10 | GV 1440 | gõ → Đăng xuất | hộp panel; Ở lại: vẫn đăng nhập, chữ còn; Bỏ chữ → đăng xuất |
| 11 | GV 375 | gõ → Back · Tài khoản → chọn GV khác | hộp panel cả hai; Ở lại giữ phiên + chữ |
| 12 | GV 1440 | Lịch Test, ô L gõ 30 → Back | chân hộp "Bỏ điểm Listening · em?"; Gõ tiếp giữ 30; Back lại → Bỏ → rời, không hỏi thêm |


Chưa bấm thử trên trình duyệt (chỉ có phép kiểm CRN-4 / CRN-6): ô lưới LỚP THƯỜNG lưu hỏng ở Lịch Test (seed demo khó tạo lỗi lưu ô gõ thẳng);
bấm link khi hộp điểm đang mở bằng chuột thật (hộp tự chặn từ trước — PR này không đổi đường đó).

Hộp trình duyệt khi tải lại / đóng tab: như cũ (`beforeunload` ở Cuối khoá, Lịch Test, Phân công GV); panel không thêm.

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Cuối khoá: ‹ khi còn đổi | `window.confirm` trình duyệt | hộp app, nêu số em |
| Cuối khoá: link / menu / Back khi còn đổi | rời ngay, mất đổi | hỏi |
| Lịch Test: link / Back / đổi tuần khi còn ô lưu hỏng | rời ngay | hỏi |
| Hộp điểm đã gõ: Back | hộp mất, chữ mất | chân hộp hỏi Bỏ · Gõ tiếp |
| Panel đang sửa: link / Back | panel mất, chữ mất | hộp panel hỏi |
| Đổi tài khoản / đăng xuất / đổi góc nhìn khi còn nháp | đổi ngay, mọi nháp bị xoá | hỏi trước |
| ✕ panel, đổi việc, lưu, lọc, tìm | như cũ | như cũ |

Không mất thao tác nào. Hàm `switchAccount` / `signOut` / `doiGocNhin` trả `boolean` (false = Ở lại) — DemoBar chỉ báo "Đang dùng tài khoản" khi đã đổi.

## Kiểm
`prChanRoiNhap` CRN-4 (kho + `conTrongCuoiKhoa` / `conTrongLichTest` + POP của panel) · CRN-5 (đổi tài khoản: hỏi trước, Ở lại không làm, Bỏ làm và không bị giữ lại) · CRN-6 (nguồn: các màn qua một đường hỏi, một `useBlocker`).
web-design-guidelines: không có lỗi mới (hộp dùng lại `Modal`: focus "Ở lại", Esc = Ở lại, nút 44 px ở 375, router guard + beforeunload).
Turso: không thêm request (kho chạy ở máy).

## Giới hạn đã biết
- `ponytail:` không có. Panel "đã Bỏ chữ" (`daBo`) thôi hỏi tới khi panel hết sửa hoặc gỡ — panel ở lại sau "Bỏ chữ, quay lại" mà vẫn còn đổi thì rời trang không hỏi lần nữa (hiếm).
- Menu tài khoản vẫn mở phía sau hộp khi bấm Đăng xuất (Ở lại = về menu).
