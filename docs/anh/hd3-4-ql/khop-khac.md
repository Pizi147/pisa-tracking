# HD3-4 NỘI DUNG QL — khớp / khác

Đặc tả: `docs/superpowers/specs/2026-11-13-overhaul-v6/15-huong-dan-v3.md` (mục 4, 6, 8; mục 8 thắng mục 4). PR xếp chồng sau HD3-5 (#1761) và HD3-3 (#1758).
Sự thật đọc từ mã main 15/11 (sau GD-19 chuông + vi phạm, GD-21 panel Case theo bước).

## Đã làm

- **Thẻ việc QL khuôn bảy dòng (`shared/huongDan/ql.ts`)**, viết theo người giữ việc:
  - Chờ bạn duyệt: ba thẻ chia theo cách quyết, panel `duyet` mở thẻ chung.
    - **Duyệt yêu cầu**: chung cho Đề xuất PA, Xin ý kiến, Đề xuất sửa, Đề xuất chuyển lớp, Xin xoá, Không cần theo dõi, Dời lịch Test lần 2.
    - **Duyệt xử lý Ý thức, thu hồi**: quá hạn thì máy chốt theo GVCN.
    - **Duyệt PA khác quy chế**: quá hạn thì máy chốt theo PA của GV.
  - Thẻ có `viecWeb`:
    - **Cuối khoá lớp thường: chốt lộ trình** (`chot_len_ft`).
    - **Xét lại lộ trình sau Final** (`xet_lai_lo_trinh`; panel `xet-lai` mở thẻ này).
    - **Chốt Kết quả đầu ra** (`ky_vong_dau_ra`).
    - **Phân công người phụ trách Case** (`no_owner`).
    - **Xếp lịch MT, nhập ngày thi cho PA** (`missing_data`, dòng `moc:`).
  - Panel `ngan-case` (Case mở từ hồ sơ, không có dòng việc) mở thẻ "Xác nhận PA, ghi kết quả thay GV".
- **Danh sách chờ đã hết**: `CHO_DU_VIEC`, `CHO_DU_PANEL`, `CHO_CAM` đều rỗng. Từ nay loại việc mới, panel mới hay nhãn đã bỏ mà không có thẻ thì kiểm đỏ ngay.
- **Tab Trường hợp của QL** (8 trường hợp): GV chấm quá hạn · Thẻ chờ duyệt quá hạn · Case chưa có người phụ trách · Em chưa có TVV · Em chuyển lớp, lên lớp · Final khác hướng đã chốt · Em thi thật xong · Duyệt nhầm, xoá nhầm.
- **Tên tab**: `tenTab: { 'van-hanh': 'Việc quản lý' }`, đúng tên trang (`HoTroHocVienTab.tsx:225`).
  - Thêm `tab` cho các thẻ Chốt ngày thi, Báo PH, Bước tiếp, Bàn giao (Việc quản lý) và Xử lý vi phạm, Phối hợp SOS (Ý thức & Phối hợp).
  - Nhờ vậy "?" ở từng tab liệt kê đúng thẻ của tab đó.
- **Sửa 20 câu sai / cũ** (bảng dưới).
- Mỗi thẻ ≤ 90 chữ. Hạn đều lấy từ mã chèn `{han:…}`. 139 khoá EN mới ở `shared/i18n/en/hd3Ql.ts`.
- Turso: 0 câu đọc thêm (chữ tĩnh trong gói; dải lấy từ dòng việc đã nạp).

## Bảng câu → nguồn luật / mã

Viết tắt:
- Mã: `mw` = `server/src/worklist/mywork.ts` · `HT` = `web/src/modules/congViec/HoTroHocVienTab.tsx` · `PV` = `web/src/modules/congViec/PanelViec.tsx` · `yc` = `shared/domain/yeuCauDuyet.ts` · `qcV` = `shared/domain/quyCheVanHanh.ts` · `qcY` = `shared/domain/quyCheYThuc.ts` · `han` = `shared/domain/hanMacDinh.ts`.
- Luật: `L` = `plan.md` 1.6 / `docs/superpowers/specs/2026-11-13-overhaul-v6/luat/`.

| Thẻ · dòng | Câu | Nguồn |
|---|---|---|
| Duyệt yêu cầu · Khi nào có | GV, GVCN gửi đề xuất, xin ý kiến, xin xoá | `yc:52-77` (loại, người gửi) |
| · Làm | Tab Chờ bạn duyệt / khối Chờ duyệt Tổng quan; "Nếu duyệt"; Duyệt / Từ chối… kèm lý do; Xin ý kiến: Trả lời… | `HopChoDuyet.tsx` ('Nếu duyệt: {neuDuyet}', 'Duyệt', 'Duyệt…', 'Từ chối…', 'Lý do từ chối (người gửi sẽ đọc)', 'Trả lời…'); `TongQuanV5.tsx:208-252` |
| · Hạn | {han:ql_duyet_pa}, tính cả ngày gửi; quá hạn vẫn chờ | `yc:52-75` (`theoCauHinh`), `hanDuyetMacDinh`; `qcV:136-138` |
| · Làm sai | Hoàn tác; Đã xử lý · 30 ngày → Huỷ quyết định | `HopChoDuyet.tsx` ('Hoàn tác', 'Huỷ quyết định', 'Đã xử lý · 30 ngày') |
| · Không làm được | Báo QL chỉ để biết | `yc:114-121` (`nhomCuaLoai` = 'de-biet', kieuNut 'nhac') |
| · Sau đó | Duyệt Đề xuất PA: PA mới chạy từ ngày duyệt | luật "Đề xuất PA khác" (`ql.ts` luật `ql-de-xuat-pa`), `server/src/duyet/loaiYeuCau.ts` (khiDuyet de_xuat_pa) |
| Duyệt Ý thức · Khi nào có | GVCN chọn cách khác Nâng 1 bậc, hoặc xin thu hồi | `XacNhanXuLyPanel.tsx:316-330` ('Gửi Quản lý duyệt'); `yc:60, 73`; luật 5 (21/10) |
| · Hạn | {han:ql_duyet_pa}; quá hạn máy chốt theo GVCN | `qcV:133-134`; `qcY:31-34` |
| · Sau đó | GVCN ghi Đã thực hiện; thu hồi thì bậc tính lại | `qcY:31-34, 44-53`; `server/src/yThuc/xuLy.ts:852-870` |
| PA khác quy chế · Khi nào có | Case SOS chốt PA quy chế mà GV chọn Giữ PA của tôi | `CaseSosControls.tsx:68, 222`; chủ SP 11/11 (SOS-TAM-PA) |
| · Hạn | {han:giu_pa_gv} sau ngày gửi; quá hạn máy chốt theo PA của GV | `yc:77`, `hanGiuPaGvNgay`; `server/src/cases/sosAuto.ts:269-272` (`quetGiuPaGv`) |
| · Sau đó | Duyệt: PA của GV chạy; từ chối: PA quy chế chạy ngay | `sosAuto.ts:247-266` (`apDungGiuPaGv`: duyet → PA quy chế đóng `doi_pa`; tu_choi → `thayPaGvBangQuyChe` + started hôm nay) |
| · Làm sai | Huỷ quyết định trong ngày quyết | `loaiYeuCau.ts:958-968` (`dao` — "Huỷ quyết định trong ngày") |
| Chốt lộ trình · Khi nào có | Lớp thường, từ thứ Hai tuần trước tuần Final | `mw:1067-1072` |
| · Làm | Cuối khoá ›; Lên FT / Học lại…; Chọn tất cả; Chốt · n em; Lưu nháp | `mw` actionLabel 'Cuối khoá ›'; `CuoiKhoaLop.tsx` ('Lên FT', 'Học lại', 'Chọn tất cả', 'Chốt · {n} em', 'Lưu nháp', 'Nháp — chỉ QL thấy') |
| · Hạn | {han:chot_lo_trinh} tuần Final (= thứ Năm tuần trước); quá hạn vẫn làm | `han:29`; `mw:312-315` |
| · Làm sai | Huỷ quyết định tới khi chuyển lớp; chuyển ngay không hoàn tác | `CuoiKhoaLop.tsx` ('Huỷ quyết định', 'Chuyển ngay, không hoàn tác') |
| · Sau đó | Thứ Hai tuần bắt đầu máy chuyển lớp; Final lệch → Xét lại lộ trình | `qcV:104-111`; `CuoiKhoaLop.tsx` ('Bổ trợ Final và Xét lại lộ trình tự sinh khi có Final') |
| Xét lại · Khi nào có | Final lệch hướng đã chốt, hoặc Mini Test chưa đạt | `shared/domain/cuoiKhoa.ts:57-75`; `server/src/normal/xetLai.ts:228-244` |
| · Làm | Xét lại › → panel ở hồ sơ lớp; Tiếp tục FT, Học lại, Tạm dừng / Kết thúc học; Lưu | `mw` 'Xét lại ›'; `PanelXetLai.tsx:50-56, 204` |
| · Hạn | {han:xet_lai} tuần bắt đầu lớp mới; hết hạn = Tiếp tục | `han:36`; `cuoiKhoa.ts:81-88`; `qcV:96-97` |
| · Làm sai | Sửa / Hoàn tác tới khi chuyển lớp | `xetLai.ts:19-24`; `PanelXetLai.tsx` ('Sửa', 'Hoàn tác') |
| · Sau đó | Học lại / Lên đi đường Chuyển lớp, có bàn giao | `xetLai.ts:19-24`; `PanelXetLai.tsx` ('Phiếu bàn giao GVCN {lop}') |
| Kết quả đầu ra · Khi nào có | Lớp FOU, BE, ELE có em lên FT chưa kết luận | `mw:1632-1645` |
| · Làm | Kết quả đầu ra › / Cuối khoá ›; Chốt… → Đạt / Không đạt · Trung tâm / Không đạt · Học viên; Lưu | `mw:1632-1645`; `BangKqdrLopFt.tsx:81, 248-252` |
| · Không làm được | MT0 đạt mốc: tự Đạt | `cuoiKhoa.ts:209-232`; `BangKqdrLopFt.tsx` ('MT0 Overall {ov} ≥ mốc … — tự Đạt, không cần chốt.') |
| · Sau đó | Không đạt · Trung tâm: mỗi kỹ năng một Case + Tutor | `BangKqdrLopFt.tsx` ('Mỗi kỹ năng một Case + Tutor {n} buổi'); `qcV:105` |
| · Hạn | (không có dòng Hạn) | `mw:1643` ("Chưa có hạn") |
| Phân công · Khi nào có | Lớp thiếu GV môn / GVCN, hoặc Case trống người | `mw:1520-1545` |
| · Làm | Tab Case học thuật; Phân công / Chọn người phụ trách; Chọn giáo viên | `mw:1540-1548`; `PV` (PanelPhanCongMon / PanelChonPhuTrach: 'Chọn giáo viên') |
| · Không làm được | Em không có lớp: Hồ sơ em › | `PV` ('Chưa chọn được người ở đây — mở hồ sơ em.', 'Hồ sơ em ›') |
| · Sau đó | Case về người được chọn | `qcV:121-122` |
| Xếp lịch MT / ngày thi · Khi nào có | PA quy chế "đến MT" / "đến lúc thi" chạy mà thiếu lịch MT kế / ngày thi | `mw:1482-1500, 539-549` |
| · Làm | Xếp lịch / Nhập ngày thi → hồ sơ em; Bỏ qua | `mw:1506-1508`; `HT:616-620` ('Bỏ qua', 'Ẩn việc này. Lịch, PA, Case giữ nguyên.') |
| · Làm sai | Đã bỏ qua › Khôi phục | `HT:810-840` |
| · Xong khi | Có lịch / ngày thi; dòng tự rời | `mw:531-534` |
| Chuông (thẻ cũ) | Thanh theo tab, chỉ việc của bạn; Chờ bạn duyệt dưới vạch; Đã xem, Đã xem hết, Xem tất cả; vi phạm mới gom theo lớp | `HopChuong.tsx:89-124, 192-206`; `shared/domain/chuong.ts:49-96`; GD-19 |
| Xử lý vi phạm (thẻ cũ + panel) | Nâng 1 bậc: Xác nhận xử lý; cách khác: Gửi Quản lý duyệt rồi tự duyệt; Không xử lý + Lý do → Lưu không xử lý | `XacNhanXuLyPanel.tsx:64-66, 270-290, 316-330`; `server/src/duyet/yeuCau.ts:176-209` (QL tự gửi · tự duyệt) |
| Trường hợp · GV chấm quá hạn | Bài quá hạn → Nhập hộ; chép chữ nhắc | `TongQuanV5.tsx:385-405`; `PanelGvTre.tsx` ('Nhập hộ', nút sao chép) |
| · Thẻ chờ duyệt quá hạn | Quá hạn xếp trước; PA khác QC theo GV; Ý thức theo GVCN; loại khác vẫn chờ | `qcV:128-139`; `TongQuanV5.tsx:423-440` |
| · Case chưa có người | Dòng Phân công ở Của GV | `mw:1546` (mine false, ownerId null); `congViec.ts:319-320` |
| · Em chưa có TVV | Việc TVV về QL chi nhánh, tab Việc quản lý | `server/src/worklist/viecTvv.ts:15-21`; 15 mục 8.1 ("Em chưa có TVV: QL chi nhánh làm") |
| · Em chuyển lớp | Chuyển ngay không hoàn tác; tuần khác huỷ được; GV lớp cũ Bàn giao; quá hạn Báo QL | `qcV:104-111`; `yc:64-66` (bao_len_ban_giao) |
| · Final khác hướng | Máy sinh Xét lại ở lớp đang học; hết hạn ở lại | `xetLai.ts:228-244`; `qcV:96-97` |
| · Em thi thật xong | Hôm sau ngày thi Cập nhật kết quả; rồi Chọn bước tiếp; GVCN, CX chỉ xem | `mw:1648-1650`; luật `ql-buoc-tiep` |
| · Duyệt / xoá nhầm | Huỷ quyết định ở Đã xử lý; Đã xoá › Khôi phục | `HopChoDuyet.tsx`; luật Không khoá cứng (chủ SP 21/10) |

## Câu cũ → sửa (đối chiếu web mới)

| # | Chỗ | Cũ | Mới |
|---|---|---|---|
| 1 | `chuong` | "gom theo loại … số trên chuông bằng số ở Công việc" · "Đánh dấu đã đọc" | Thanh theo tab, chỉ việc của bạn; **Đã xem** · **Đã xem hết** · **Xem tất cả** (GD-19). Bỏ `ql: Đánh dấu đã đọc` khỏi `CHO_CAM` |
| 2 | `xem-viec`, `ql-cv-cua-gv` | "ô ▾ chọn một GV" | "một GV: **Lọc thêm**" |
| 3 | `chot-lo-trinh` | "tab Vận hành"; hạn gõ tay | Tab **Việc quản lý**; khuôn V3; `{han:chot_lo_trinh}` |
| 4 | `ky-vong` | "Vận hành › Kỳ vọng"; "mở thẳng hồ sơ lớp FT" | **Kết quả đầu ra ›** / **Cuối khoá ›**; khuôn V3 |
| 5 | `chot-ngay-thi` | "tab Vận hành" | tab **Việc quản lý**, mục Thiếu dữ liệu |
| 6 | `bao-ph` | "tab Ý thức & Phối hợp, mục Báo PH" | tab **Việc quản lý** (mã hiện hành — [XM]2) |
| 7 | `buoc-tiep`, `p-sau-thi` | "Hạn ngày thi + 7 ngày" | `{han:buoc_tiep_sau_thi}` từ ngày có kết quả |
| 8 | `doi-chu-case` | "Đổi người…" · "Lưu · đóng" | ô tên người phụ trách (▾), lưu ngay, "Đã đổi" + **Hoàn tác** |
| 9 | `phan-cong` | thẻ cũ hai câu | khuôn V3, tab Case học thuật, `viecWeb: no_owner` |
| 10 | `phan-tich`, `ql-pt-goc`, Phân tích `dangO` | Chi nhánh · SOS · Thi thật | Chi nhánh · **Thi thật** · **SOS** · Giáo viên · Ý thức |
| 11 | `xu-ly-vi-pham`, `p-xu-ly` | "bậc cần QL thì bạn duyệt được"; thiếu lối Không xử lý | hai lối (GD-19): Gửi Quản lý duyệt → tự duyệt; **Lưu không xử lý** |
| 12 | `pxl-xep` | "khoá cuối tuần theo công tắc Mở sửa lịch Test" | MT cuối tuần hỏi lại → **Vẫn đổi lịch** |
| 13 | `tong-quan.dangO` | "GV chấm quá hạn" (khối của Admin) | "bảng Giáo viên" |
| 14 | `p-xet-lai` | "Học lại hoặc Kết thúc học, hoặc giữ hướng" · `viec: chot-lo-trinh` | Tiếp tục FT / lớp, Học lại, Về lớp thường, Tạm dừng / Kết thúc học; hết hạn = Tiếp tục · `viec: xet-lai` |
| 15 | `duyet` | thẻ chung bốn bước | ba thẻ V3 theo cách quyết (15 mục 8.1) |
| 16 | luật `ql-han-duyet` | thiếu Thu hồi xử lý Ý thức; Dời lịch Test lần 2 | thêm Thu hồi; Dời lịch lần 2 không hạn; loại nào quá hạn tự chốt |
| 17 | `p-case`, `p-duyet`, `p-xet-lai` | không `the` | có `the` |
| 18 | `nhap-ho` | "Panel Nhập hộ theo môn" | "Panel bài quá hạn của GV … **Nhập hộ** ở dòng" (`PanelGvTre.tsx`) |
| 19 | `p-xet-lai.khongLam`, `p-chot-ngay-thi.khongLam` | "Công việc › Chốt lộ trình" · "Ý thức & Phối hợp" | "Việc quản lý" |
| 20 | thẻ hv ở tab Việc quản lý / Ý thức | không khai `tab` | khai `tab` → "?" ở tab liệt kê đúng |

## [XM] cho PTA

1. **Kỳ vọng (`ky_vong_dau_ra`) và Phân công (`no_owner`)**: máy chủ để `mine: false`, `ownerId null` (`mw:1643, 1546`), dù chỉ QL làm được.
   - Hệ quả: dòng nằm ở **Của GV**, không vào **Của tôi** và không vào chuông.
   - Thẻ viết như việc của QL. "?" hiện dải trung tính "Chưa có người giữ. Bạn làm được." (dải của HD3-5).
   - Đổi `mine` là việc mã, không thuộc nội dung. Đề xuất một PR nhỏ đặt `mine = true` như `chot_len_ft`.
2. **Báo PH vi phạm (`bao_ph_yt`)**: khoá này không có trong `NHOM_CUA_LOAI` (`tongQuan.ts:41-55`), nên với QL dòng rơi vào tab **Việc quản lý**, không vào Ý thức & Phối hợp. Thẻ ghi theo mã hiện hành; nếu là lỗi mã thì sửa ở PR mã.
3. **`missing_data`**: sau khi tách `lich-su:` và `chot-ngay-thi:` chỉ còn dòng `moc:` (hai tên: Xếp lịch MT / Nhập dự kiến thi), nên viết một thẻ chung. Không còn dòng "Sửa Target" như 15 mục 8.1 liệt kê.
4. **QL làm thay GVCN xử lý vi phạm**: chọn cách khác Nâng 1 bậc thì nút vẫn là "Gửi Quản lý duyệt", rồi QL tự duyệt ở Chờ bạn duyệt, tức hai bước. Thẻ ghi đúng như vậy; QL áp thẳng một bước là việc mã.
5. **Chờ bạn duyệt**: 15 mục 8.1 ghi "mỗi loại yêu cầu một thẻ" (10 loại). PR viết ba thẻ theo cách quyết, vì các loại khác nhau chủ yếu ở Hạn và ở chỗ quá hạn tự chốt hay không; viết 10 thẻ thì gần như chép lại nhau.
   - Panel duyệt mở thẻ chung, chưa chọn thẻ theo loại của yêu cầu đang mở. Muốn chọn theo loại thì cần `HopChoDuyet` ghi loại vào ngữ cảnh "?" (việc mã nhỏ).
6. **Chốt lộ trình, Xét lại, Kết quả đầu ra** không có panel ở Công việc: nút đổi trang. "?" sau khi đổi trang ra màn hồ sơ lớp (mục `lop-chot`, `lop-ky-vong`). Trang Cuối khoá chưa có `data-hd` riêng.
7. **Chưa soát kỹ**: menu ⋯ ở hồ sơ HV (`ql-hv-menu`), tab Phân công GV, trang Vận hành / Họp đơn vị. Giữ nguyên câu cũ.

## Ảnh (tài khoản demo QL Nguyễn Khánh Vy; ngày demo 14/09/2026; phông đã kiểm)

| Ảnh | Nội dung |
|---|---|
| `ql-tq-1440-toi.png` | Tổng quan, tầng 3: Việc làm ở đây = ba thẻ duyệt + Nhập hộ |
| `ql-vh-1440-toi.png` · `ql-vh-375-sang.png` | Công việc › Việc quản lý, tầng 2: Chốt lộ trình · Xét lại · Kết quả đầu ra · Xếp lịch MT (kèm số việc) |
| `ql-duyet-1440-toi.png` | Panel Duyệt đang mở → thẻ "Duyệt yêu cầu" khuôn bảy dòng |
| `ql-th-1440-toi.png` · `ql-th-375-sang.png` | Tab Trường hợp |

Không có chữ bị cắt "…".
