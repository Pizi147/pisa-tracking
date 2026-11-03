# 12 — AUDIT-Y-THUC: Ý thức / vi phạm + task Báo PH (đợt 0)

Session AUDIT-Y-THUC · main `4e1c0ed83` (03/11) · nguồn `00` mục 1.2, 1.3, 5, 6, F03, F04, X04, X05, X08, U10, Ảnh 1.
Cách kiểm đợt này: **đọc mã** trên main (máy chủ + web) và đối chiếu Ảnh 1. **Chưa bấm thử trình duyệt, chưa gọi API thật**; khi có, cột "Cách kiểm" sẽ được bổ sung.
Ảnh U10 (`y thuc vi pham.jpg`) có ở `D:/Download/Pisa tracking web/`, cùng màn với Ảnh 1.

## 1. Chủ SP chốt 03/11 (trả lời trong session, cả 4 câu chọn khuyến nghị)

| # | Câu | Chốt |
|---|---|---|
| 17.1 | Ai sửa hạn Báo PH | **TVV của em · TVV cùng chi nhánh · GVCN lớp em đang học · QL** trong phạm vi em. GV bộ môn không. Quyền sửa hạn **tách** quyền ghi kết quả (GVCN sửa hạn được, vẫn không ghi kết quả báo PH) |
| 17.2 | Loại việc nào sửa hạn | Việc **có hạn**: (1) Báo PH sau xử lý vi phạm · (2) Meeting CX/GĐCN (sau Mock), cả hai loại HV và HV / PH. Cùng ô sửa hạn, cùng cách hiện. Việc không hạn (Trao đổi với gia đình, Báo phụ huynh qua TVV lớp thường) **giữ không hạn** |
| 17.3 | "Báo PH đúng hạn" sau khi sửa hạn | So với **hạn hiệu lực** (đã sửa nếu có). Lịch sử giữ hạn gốc + ai sửa, lúc nào. Mọi nơi (Công việc, hồ sơ, tab lớp, chuông, Tổng quan TVV) dùng **một hàm** hạn |
| chữ | Nút "Ghi nhận" | Đổi thành **"Đã xem"**: nút "Đã xem", trạng thái "Đã xem", nhóm "Mới, chưa xem"; ⓘ "không cần biện pháp, không lên bậc". Luật giữ nguyên: vẫn tính vào 3 vi phạm / 2 tuần, bắt buộc xử lý thì không có nút này. Sau khi bấm: hàng ở lại báo "Đã xem" + lối Xem lại |

Đã có sẵn trong `00` / 01, không hỏi lại: hạn đã chọn **không trượt** theo Tạm dừng / Quay lại (việc vẫn ẩn khi em tạm dừng) · sửa lại nhiều lần, không trần, không xin duyệt, không bắt lý do · có "Về hạn mặc định" · đổi TVV không reset hạn · việc xong / bỏ / nguồn thu hồi: sửa hạn không mở lại việc.

## 2. Bảng việc "báo phụ huynh" (`00` 5.1)

| Loại việc | Bảng / mã | Người giữ | Ghi kết quả | Sửa hạn (chốt 17.1–17.2) | Hạn mặc định | Màn mở |
|---|---|---|---|---|---|---|
| Báo PH sau xử lý vi phạm | `viec_bao_ph` · nhóm `bao_ph_yt` · `server/src/yThuc/baoPhTvv.ts` | TVV của em; em không có TVV → QL chi nhánh | TVV của em · TVV cùng chi nhánh · QL (`coTheGhi` :100) | TVV + GVCN lớp em + QL | ngày lưu xử lý + 4 (5 ngày lịch) · Quay lại học → ngày quay lại + 4 (`hanBaoPhHieuLuc`) | Công việc (`PanelBaoPhTvv`) · hồ sơ HV tab Ý thức (khối Báo PH) · tab Ý thức lớp (cột Báo PH) · chuông `bao_ph_xu_ly` |
| Meeting CX/GĐCN (sau Mock) · HV và · HV / PH | `sos_coordination_actions` kind `cx_meeting_student` / `cx_meeting_family` · `hanPhoiHop` `shared/domain/sos.ts:125` | GVCN lớp em (dòng "Phối hợp SOS" mỗi lớp) | GVCN + QL (`canManageDiscipline`) | GVCN + QL (TVV không ở luồng này) | ngày tạo (giờ VN) + 5 | Công việc nhóm `phoi_hop_sos` · hồ sơ HV / lớp khối Phối hợp SOS |
| Trao đổi với gia đình (FT, SOS) | `sos_coordination_actions` `talk_family` | GVCN | GVCN + QL | — không hạn (P10) | — | khối Phối hợp SOS |
| Báo phụ huynh qua TVV (Giữa khoá / Cuối khoá < 50 % lớp thường) | `sos_coordination_actions` `bao_ph_tvv` · `mywork.ts` 3c ~1146 | Giữa khoá: GVCN lớp em · Cuối khoá: QL | GVCN / QL | — không hạn (M-05) | — | Công việc nhóm `phoi_hop` → hồ sơ HV `?tab=y-thuc&sub=phoi-hop` |
| Biện pháp "Report cho gia đình" (Report 1…7) | `discipline_measures` | — là biện pháp xử lý, không phải việc | — | — | — | — |

## 3. Bảng xác minh

Mức: P1 = sai / mất dấu việc · P2 = khó dùng, lệch số · P3 = tối ưu.

| ID | Mức | file:dòng | Vai / lối vào | Cách tái hiện (đọc mã) | Kết quả | Tác động |
|---|---|---|---|---|---|---|
| F03 | P1 | `web/src/modules/yThuc/StudentYThucSection.tsx:23–26, 89–98, 121–128` · `ClassYThucCard.tsx:150–157` | GVCN, QL · hồ sơ HV / tab lớp | Ghi nhận → `toast.hoanTac` + tải lại; khối "Vi phạm chưa xong" chỉ lấy `moi/can_xu_ly/qua_han/cho_duyet`; Nhật ký gập khi còn việc khác (`nhatKyMo`); bộ lọc `xong` chỉ nhận `da_xu_ly` | **Tái hiện** (mã) | Vi phạm "biến mất", chỉ tìm lại được ở Nhật ký gập, lọc "Tất cả" |
| F04 | P1 | `server/src/yThuc/baoPhTvv.ts:46–53, 146–172` · `routes/index.ts` (đường `/y-thuc/bao-ph/*`) · `PanelBaoPhTvv.tsx` | TVV, GVCN, QL | Không có cột / đường sửa hạn; panel chỉ đọc hạn | **Tái hiện** (khoảng trống chức năng) | Yêu cầu mới 03/11 |
| HAN-3-NOI | P2 | `baoPhTvv.ts:151` (`khoangTamDung` đủ) · `baoPhTvv.ts:275–292` (một lần Quay lại trong SQL) · `board.ts:222` · `tongQuanV5.ts:108–116` (`v.han` thô) | TVV Tổng quan, Công việc, hồ sơ | Ba cách tính hạn hiệu lực; "Báo PH đúng hạn" so `ngayBao ≤ v.han` bỏ qua Tạm dừng | **Tái hiện** (mã) · em tạm dừng rồi quay lại: Công việc báo đúng hạn, Tổng quan TVV báo trễ | Lệch số giữa các màn (luật "một số liệu một hàm"); sửa cùng PR hạn (17.3) |
| X04 | P2 | `baoPhTvv.ts:180–205` · `PanelBaoPhTvv.tsx:89–96` | TVV / QL ghi kết quả | Lưu thành công ở máy chủ, mất response → web `tt='loi'`, bấm Lưu lại → `INSERT viec_bao_ph_lan` lần hai (việc `xong` vẫn cho ghi) | **Tái hiện** (mã) | Lịch sử liên hệ nhân đôi; số "lần thử" sai. Sửa: khoá gửi (`khoa`, UNIQUE) do web tạo mỗi ý định ghi, gửi lại cùng khoá → trả bản đã lưu; hai lần liên hệ thật (khoá khác) vẫn lưu |
| X05 | P3 | `baoPhTvv.ts:268–291` · cùng kiểu `mywork.ts:805–813` (`bao_ph_tvv`) | QL Công việc | Nhánh QL không lọc chi nhánh trong SQL, đọc mọi việc mở rồi lọc JS | **Tái hiện** (mã); số dòng nhỏ (việc mở toàn trung tâm, ước vài chục) | Dòng đọc Turso tăng theo số chi nhánh; đẩy lọc chi nhánh vào SQL khi sửa tệp (PR hạn) |
| X08 | P2 | `StudentYThucSection.tsx:53–54` · `phoiHop.ts:409–418` | Mọi vai · hồ sơ HV | `phamVi` chỉ gửi `/y-thuc`; `/phoi-hop-sos` luôn trả **mọi** lượt mọi lộ trình | **Đúng thiết kế khác phạm vi** (không lỗi API) — nhưng không có nhãn | Người xem tưởng nút "Cả lịch sử" áp cả Phối hợp. Đưa vào mockup: nhãn phạm vi riêng hoặc tách Phối hợp thành phân đoạn (U10.9) |
| U10-BAOPH-CU | P1 | `board.ts:206–229` (`baoPhMoiNhat` = việc mới nhất của em, không gắn lần xử lý) | Tab lớp, hồ sơ HV | Ảnh 1 hàng Hà Trần Phúc: nhóm "Mới, chưa ghi nhận" cạnh "✓ Đã báo PH · 29/10 · WL 1" | **Tái hiện** (ảnh + mã) | Tưởng vi phạm mới đã báo PH. Mockup: viên Báo PH ghi rõ lần xử lý ("Báo PH lần WL 1 · đã báo 29/10"), tách khỏi vi phạm mới |
| U10-NUT-COT | P2 | `ClassYThucCard.tsx:350–360, 309` | GVCN · tab lớp | Nút "Xác nhận xử lý" / "Ghi nhận n vi phạm" nằm dưới tiêu đề cột "Báo PH (TVV)" | **Tái hiện** (ảnh + mã) | Vị trí nút gợi sai hậu quả; mockup đặt nút ở vùng "Việc cần làm" |
| U10-HAI-HAN | P2 | Ảnh 1: "Chưa xem · hạn 05/11" và "Hạn 05/11" | GVCN | Hạn xem (Mới) và hạn xử lý (bắt buộc) cùng kiểu chữ vàng; Báo PH không thấy hạn ở hàng | **Tái hiện** (ảnh) | Mockup: tên hạn đúng nghĩa (`00` mục 21 "Hạn") |
| U10-CHIP | P2 | `ThangYThuc.tsx` · `ClassYThucCard.tsx` cột Bậc | Mọi vai | Chuỗi chip ✓ WL 1 › Report 4 + Meeting… lần này › Report 5 › … ở mỗi hàng + thang đủ khi mở | **Tái hiện** (ảnh) | Mockup: hai thông tin ngắn "đã tới WL 1 · lần này Report 4 + Meeting"; thang đủ mở khi cần (U10.2) |
| U10-BANG-CHUNG | P3 | `ChiTietViPham.tsx` | GVCN | Khung bằng chứng trống cao + câu hướng dẫn dưới mỗi vi phạm mở | **Tái hiện** (ảnh) | Mockup: dòng gọn "+ Tệp / liên kết", mở khi đính kèm (U10.8) |
| U10-MT | P2 | Hồ sơ lớp tab Ý thức: "Điểm Mock Test của lớp" dưới tab | GVCN | Bảng điểm MT đầy đủ nằm dưới tab Ý thức | **Tái hiện** (ảnh) | Đề xuất chuyển (22.1) — **hỏi chủ SP khi duyệt mockup**, chưa bỏ |
| GHI-NHAN-LUAT | — | `xuLy.ts:99–110` | GVCN | Ghi nhận khi em bắt buộc → 400 "dùng Xác nhận xử lý"; không đẩy bậc | **Đúng luật** (`00` 3.5) | Giữ |
| BAO-PH-SINH | — | `xuLy.ts` (`luuXuLy`, `guiDeXuat` gọi `sinhViecBaoPh`) | GVCN lưu xử lý | Sinh ngay kể cả chờ QL duyệt; UNIQUE `measure_id` | **Đúng luật** (N1) | Giữ |
| BAO-PH-THU-HOI | — | `baoPhTvv.ts:59–81` | QL duyệt thu hồi / từ chối / GVCN rút | Việc mở → "Đã bỏ" lý do hệ thống; việc xong giữ + chuông để biết; huỷ thu hồi → mở lại | **Đúng luật** (N5, `00` 6.4) | Giữ; sửa hạn không mở lại việc đã bỏ |

Chưa kiểm (để đợt bấm thử): luồng Ghi vi phạm → Sửa / Xoá mềm theo vai trên trình duyệt; Đề xuất / duyệt / từ chối của QL; 375 px; GVBM thấy gì ở tab Ý thức (theo mã: xem, không có nút quản lý — `canManage` false).

## 4. Kế hoạch PR (sau chốt 03/11)

1. **PR-HAN-BAO-PH (máy chủ, làm ngay, trước mockup):**
   - Dữ liệu: `viec_bao_ph.han_chon` (NULL = mặc định) + bảng lịch sử `viec_han_lan` dùng chung hai loại việc (loại, id việc, hạn cũ → mới, người, lúc). Meeting CX: `sos_coordination_actions.han_chon`. Migrate chỉ thêm cột / bảng; dữ liệu cũ dùng mặc định.
   - Một hàm `hanHieuLuc(macDinh, hanChon, khoangTamDung)` ở `shared/domain`: có `han_chon` → dùng đúng ngày đó (không trượt Tạm dừng); không có → như nay. Thay ba nơi tính hạn + `tongQuanV5` (đúng hạn = so hạn hiệu lực).
   - Đường `POST /y-thuc/bao-ph/:id/han` và `POST /phoi-hop-sos/:id/han` { han | null (= về mặc định), phienBan } — quyền `coTheSuaHan` (17.1) kiểm máy chủ, 409 khi phiên bản cũ, việc đã xong / bỏ → 400 không mở lại. DTO trả `hanMacDinh`, `hanChon`, `coTheSuaHan`, lịch sử hạn.
   - X04: cột `viec_bao_ph_lan.khoa` UNIQUE, web gửi khoá mỗi ý định ghi. X05: lọc chi nhánh vào SQL.
   - Trần câu + dòng ở `tocDoDuong.ts`. Ước Turso: đọc thêm ~1 câu mỗi lần mở panel (lịch sử hạn), không thêm câu ở danh sách.
2. **Mockup Ý thức** (hồ sơ lớp + hồ sơ HV + mở từ Công việc; 4 vai; mới / đã xem / bắt buộc / chờ duyệt / đã xử lý / thu hồi; sau "Đã xem" ở lại + Xem lại; Phối hợp SOS + bảng điểm MT: đề xuất chỗ, hỏi trước khi chuyển) + **mockup task Báo PH** (mặc định / tuỳ chỉnh / quá hạn / sau lưu / lịch sử). Chủ SP duyệt → PR giao diện từng màn (đổi chữ "Ghi nhận" → "Đã xem" đi cùng PR giao diện).

## 5. Để PTA
- `mywork.ts` 3c (`bao_ph_tvv`) đọc mọi chi nhánh rồi lọc JS — cùng kiểu X05; sửa cùng PR-HAN nếu chạm tệp, không thì backlog.
