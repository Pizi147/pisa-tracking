# HD3-2 — Nội dung Hướng dẫn V3 · Giáo viên (GVBM · GVCN · GV Speaking) + Head tutor

Nguồn: `docs/superpowers/specs/2026-11-13-overhaul-v6/15-huong-dan-v3.md` mục 4 + 6 + 8 (mục 8 thắng). Đọc mã thật của main 15/11 (sau GD-19, GD-20a/b/c/d, LG-11/12, #1752).
Bảng sự thật đầy đủ (mỗi dòng có tệp:dòng): ghi chú nhóm session `hd3-2-su-that-gv.md` — tóm tắt nguồn từng câu ở bảng dưới.
Viết tắt nguồn: `L1`…`L4` = `luat/1-test-nhap-diem.md` … `luat/4-lop-lo-trinh-quyen.md` · `mw` = `server/src/worklist/mywork.ts` · `han` = `shared/domain/hanMacDinh.ts` ·
`qcC/qcV/qcY` = `shared/domain/quyCheCase / quyCheVanHanh / quyCheYThuc.ts` · `HND` = `web/src/modules/fasttrack/HopNhapDiem.tsx` · `CSC` = `web/src/modules/yThuc/CaseSosControls.tsx` ·
`CP` = `web/src/modules/cases/CasePanel.tsx` · `XLP` = `web/src/modules/yThuc/XacNhanXuLyPanel.tsx` · `BGP` = `web/src/modules/classes/BanGiaoPanel.tsx`.

## Đã làm

- **21 thẻ việc theo đúng tên dòng việc trên web** (15 mục 8.1), mỗi thẻ khai `viecWeb` → "?" ở dòng việc mở đúng thẻ; mỗi thẻ ≤ 90 chữ (HD-DAI), hạn bằng mã chèn (HD-HAN).
- `maViec` tách ba cặp cùng nhóm máy chủ: **Chọn PA** (`chonPa`) · **Bàn giao đổi GV** (`ban_giao_gv:`) · **Nhập điểm MT cũ** (`lich-su:`).
- **11 trường hợp** (15 mục 4.7), mỗi câu có nguồn; trường hợp có thẻ liên quan thì có link "Thẻ việc: …".
- Panel GV mở được có `the` (13 panel) → "?" ở panel đó mở thẳng thẻ.
- Nhịp Tôi muốn… đổi đúng 4.3: Hằng ngày · Sau tuần Test · 2 tuần một lần · Hằng tháng · Khi có (cả Head tutor).
- Danh sách chờ (phép HD-DU): bỏ 16 loại việc + 13 panel đã có thẻ. Còn chờ: việc của TVV, QL, Admin (HD3-3 … HD3-5) và `ngan-case` (một panel nhiều loại việc).
- Sửa khung: "Bạn đang mở" không lặp mã lớp khi tiêu đề dòng gộp đã có lớp.

## Câu → nguồn luật (theo thứ tự dòng: Khi nào có · Làm · Xong khi · Hạn · Làm sai · Không làm được · Sau đó)

| Thẻ (`viecWeb`) | Chữ | Nguồn |
|---|---|---|
| Nhập điểm (`score`) | 84 | L1 §2 "Khi nào có" · L1 T-10, HND:609-640 (Vắng, Lưu · bài tiếp ›) · L1 §2 Xong khi · han `cham_test` + L1 T-15, qcV:44-50 (quá hạn vẫn nhập) · L1 T-16, HND:615-621 (⋯ Bỏ vắng) · L1 §2 Làm thay (không phải kỹ năng → không việc) · L1 §2 cột Lưu xong |
| Chấm Speaking (`cham_speaking`) | ~80 | mw:833-884, `permissions.ts:346-350` (Mock FT + MT0 lớp thường) · `PanelChamSpeaking.tsx:96-194` · L1 §2 Xong khi · mw:845-883 + L1 §2 "không đếm, không chuông" · HND (sửa ô) · L1 §2, mw:1305-1335 |
| Nhập điểm MT cũ (`mt_cu`) | 87 | `canCham.ts:137-183`, L1 T-20 · `lamTaiCho.ts:36` (đổi trang Điểm theo lớp), qcV:37 · L1 §2 · (không hạn: mw:1475) · L1 T-16 · L1 §2 Làm thay "GV đúng ô" · qcV:37 "MT trong 4 tuần gần đây vẫn sinh Case" |
| Xác nhận Case (`cause`) | 89 | L2 C-06 · CSC:109-200 · CSC:151 · han `xac_nhan_case`, `loaiYeuCau.ts:407-430` (Báo QL) · CSC:30-36 (Hoàn tác 10 s) · L2 §3 Làm thay; `Không cần theo dõi…` CP:387 · L2 §3 |
| Mô tả Case (`ghi_nhan_xet`) | 81 | L2 C-08, mw:1301 · CP:533-575 (tự lưu, không nút Lưu) · mw:226-229 · han `xac_nhan_case(.ngayGap)`, qcC:12-14 · CP:509-512, 246 (Sửa mô tả, Sửa nguyên nhân) · L2 C-07 · qcC:13 |
| Xác nhận PA (`xac_nhan_pa`) | 84 | mw:950-962, L2 C-05 · CP:768, CSC:210-400 · qcC:17-19 · mw:1254 · CSC:280-288 · CSC (Đề xuất PA khác…, Không cần theo dõi…) · L2 §3 |
| Chọn PA (`chon_pa`) | 74 | mw:1268-1270, L2 C-13 · CSC:296-376 · L2 §3 · han `giu_pa_gv`, qc:11-13 · CSC:246-288 · L2 C-13 |
| Xác nhận Case Speaking (`xem_nx_s`) | 78 | mw:1305-1335, L2 C-08 · CP:540-590, qcC:70-72 · L2 §3 · mw:1321 · CP:557, `TaiCho.tsx:182-198` · L2 §3 · mw:1333 |
| Thêm PA học thuật (`no_plan`) | 79 | mw:440-445, 1195-1226 · `ThaoTacCase.tsx:130-148`, `FormPa.tsx` · L2 §3 · `cases.ts:856-883`, qcC:31-33 · ThaoTacCase:83-86 · mw:1159-1189 · qcC:31-33, han `ql_duyet_pa` |
| Ghi kết quả PA (`ghi_ket_qua_pa`) | 87 | mw:730-758 ("từ Chủ nhật") · `CapNhatTuan.tsx:254-298, 468-483` · L2 C-16 · han `ghi_kq_pa`, L2 C-14 · qc:16-17, CapNhatTuan:483 · qcC:42 · qcC:55-63 |
| Ghi Mini Test (`mini_test`) | 72 | mw:992-1003, L2 C-20 · CapNhatTuan:470, 576-579 · L2 §3 · `cuoiKhoa.ts:200-203` (không mã cấu hình) · CapNhatTuan:483 · mw:1394-1411 · qcC:40, `loaiYeuCau.ts:796` |
| Báo PH kết quả Test (`phoi_hop`) | 49 | mw:1336-1361, L3 Y-20 · `PhoiHopSosSection.tsx:256-260, 345` · qcY:67 · (không hạn: mw:1358) · PhoiHopSosSection:266-276 · L2 §3 |
| Phối hợp SOS (`phoi_hop_sos`) | 83 | mw:1362-1383, L2 C-21 · `BangPhoiHop.tsx:180-313` · qcY:55-59 · `sos.ts:170-178` (chỉ việc có hạn cấu hình) · BangPhoiHop:31, 149 · mw:1366 · qcY:58, `phoiHop.ts:355-368` |
| Xử lý vi phạm (`yt_xu_ly`) | 82 | mw:1587-1630, L3 Y-05, Y-09, LG-12 · XLP:112-140, 270-345 · L3 §3 · han `xu_ly_vi_pham`, `loaiYeuCau.ts:588-608` · XLP:185-191, L3 Y-11 (Thu hồi…) · mw:1594-1597 · qcY:26-31 |
| Ghi "Đã thực hiện" (`yt_thuc_hien`) | 53 | mw:1615-1620, L3 Y-09 · `DaThucHienPanel.tsx:78-104` · — · `trangThai.ts:188` · qcY:35-37 |
| Xác nhận cấp bậc vi phạm HV cũ (`khai_bac`) | 84 | mw:1557-1586, L3 Y-12 · `KhaiBacPanel.tsx:80-106`, `KhaiBacLoPanel.tsx:185-244` · qcY:52 (14 ngày tự hết) · KhaiBacPanel:80, KhaiBacLoPanel:212 · L3 Y-12 |
| Tình hình học tập (`yt_hoi_tinh_hinh`) | 62 | `tinhHinh.ts:246-276`, L3 Y-18 · `TinhHinh.tsx:289-312` · L3 Y-18 · `tinhHinh.ts:27-28` (hằng, không cấu hình) · TinhHinh:320-323 · tinhHinh.ts:262-266 · qcY:15-17 |
| Bàn giao chuyển lớp (`ban_giao`) | ~80 | mw:1101-1130, L4 L-17 · BGP:193-215, 474-570 · L4 §3 · han `ban_giao_chuyen_lop`, qcV:77-81 · BGP:199, 210-212 · BGP:247 · L4 L-17 |
| Bàn giao đổi GV (`ban_giao_gv`) | 74 | mw:1131-1144, L4 L-18 · `BanGiaoGvPanel.tsx:140-212` · L4 §3 · han `ban_giao_doi_gv(.xemNgay)`, qcV:84 · L4 §3 · qcV:84 |
| Viết Báo cáo PH (`bao_cao_ph`) | 82 | mw:1430-1465, L3 Y-21 · `TabBaoCaoPh.tsx:567-645` · mw:350-353 · qcV:67-74 · TabBaoCaoPh (Hoàn tác chèn) · L3 Y-21 |
| Việc được giao (`mgmt`) | 30 | mw:1657-1681 · `PanelViec.tsx:174-175` · qcV:87 |

### Trường hợp

| Trường hợp | Chữ | Nguồn |
|---|---|---|
| Em vắng Test | 79 | L1 T-17, T-18, T-19, §4 bảng "-"; HND:619-621 (Vắng, Bỏ vắng) |
| Em tạm dừng / kết thúc học | 65 | L2 C-22, §5; L3 §5; L4 L-09, L-17 |
| Em chuyển lớp / lên lớp | 73 | L2 C-07, C-20; L4 L-15, L-16, L-17; qcV:90-94 |
| Đổi GV: nhận lớp mới / rời lớp | 58 | L4 L-03, L-04, L-18; qcV:84 |
| Việc quá hạn | 66 | L4 §4 (Báo QL); `loaiYeuCau.ts:407-430, 588, 683, 796` |
| Không thấy nút / không có quyền | 54 | mw:50-61; `TaiCho.tsx:165-178`; L1 T-08; L3 Y-01; L4 L-01 |
| Không lưu được, mất mạng | 35 | `TaiCho.tsx:80-128`; `PanelViec.tsx` (NhapViec); `CapNhatTuan.tsx:513-523` |
| Nhập sai, muốn sửa / xoá / khôi phục | 51 | L1 T-16; L4 L-24 (thùng rác 30 ngày); L2 C-16; L3 Y-11 |
| Chờ QL duyệt lâu | 47 | L4 §4; han `ql_duyet_pa`, `giu_pa_gv`; `server/src/duyet/yeuCau.ts:219, 247` |
| Làm nhiều em, lỗi một phần | 18 | `XacNhanPaLo.tsx:109, 144`; `LuoiKetQuaPa.tsx:187, 200`; `KhaiBacLoPanel.tsx:214, 262` |
| Em thi thật xong | 55 | L4 L-20, L-21; L3 §3; han `buoc_tiep_sau_thi` |

## Chỗ mã khác mockup ⑭ (theo mã)

1. Nhập điểm: bỏ "Chưa tới tuần Test… nhờ QL" — mã mới cho lưu, máy dời kỹ năng về tuần này (qcV:38-43). ⋯ trong hộp điểm là **Bỏ vắng** / **Khôi phục** (không "Khôi phục điểm"; chỉ hiện khi ô có điểm đã huỷ) → thẻ dùng Bỏ vắng.
2. Mô tả Case: tự lưu, không nút Lưu; có đường sửa (Sửa mô tả, Sửa nguyên nhân) → dòng Làm sai hiện ([XM-5] mockup ẩn).
3. Ghi kết quả PA: nhãn thật **Xin hỗ trợ từ Quản lý**, **Sửa kết quả**. Thứ Ba cố định trong mã, không cấu hình → dòng Hạn không ghi thứ (HD-HAN), chỉ "Mỗi kỳ {han:ghi_kq_pa}".
4. Xử lý vi phạm: không có chữ "Cách khác"; bốn cách Nâng 1 bậc · Không nâng · Vượt bậc · Ngoài thang → thẻ ghi "Cách xử lý, mặc định Nâng 1 bậc"; có lối Không xử lý (LG-12).
5. Chấm Speaking: MT0 là của lớp thường (không "MT0 mọi lớp FT"); nút dòng là **Nhập điểm**.
6. Mã chèn mockup (`cham_diem`, `y_thuc_xu_ly`, `bao_ph`, `ket_qua_pa`, `sos`) không có → dùng mã thật `cham_test`, `xu_ly_vi_pham`, `bao_ph_vi_pham`, `ghi_kq_pa`, `xac_nhan_case`.

## [XM] cho PTA

1. **Hạn ngoài cấu hình** (Phối hợp SOS / Meeting, Mini Test, Tình hình học tập 3 ngày, Báo cáo PH): thẻ ghi "hạn ở cuối dòng việc" thay số — đúng HD-HAN nhưng ít cụ thể. Muốn số thì cần đưa các hạn này vào Hạn mặc định (PR riêng).
2. **"Chỉ cho tôi"** chỉ có `data-hd="cv-dong"` dùng chung cho mọi dòng việc → chỉ thẻ Nhập điểm giữ nút; thêm `data-hd` theo loại dòng / tab Công việc là việc của PR giao diện.
3. **Thẻ không phải việc** (Ghi vi phạm, Tạo Case tay, Đề xuất chuyển lớp, Sửa thông tin, Thêm học viên, Lịch thi…) giữ chữ đã đối chiếu 13/11 (chỉ dòng Làm); chưa đổi sang khuôn bảy dòng vì không có dòng việc / hạn. Nói nếu cần.
4. Head tutor chỉ-vai: không Công việc (`nav.ts:16-37`) → giữ 2 thẻ màn; dạy lớp thì có vai Giáo viên và đọc thẻ GV (lời 16).

## Ảnh (tài khoản demo GV Trần Ngọc Hà, ngày demo 14/09/2026, phông Be Vietnam Pro đã kiểm)

| Ảnh | Nội dung |
|---|---|
| `gv-diem-1440-toi.png` · `gv-diem-375-sang.png` | Công việc › Chấm điểm, đang mở Nhập điểm → thẻ Nhập điểm (375: ô Quy chế đầu thẻ) |
| `gv-case-1440-toi.png` · `gv-case-375-sang.png` | Case học thuật, đang mở Xác nhận Case → thẻ Xác nhận Case |
| `gv-yt-1440-toi.png` | Ý thức & Phối hợp, đang mở Xử lý vi phạm (lô 3 em) → thẻ Xử lý vi phạm |
| `gv-tm-1440-toi.png` | Tôi muốn… nhóm theo tab Công việc, lọc nhịp mới |
| `gv-th-1440-toi.png` · `gv-th-375-sang.png` | Trường hợp: 11 tình huống, Em vắng Test mở |

Không chữ bị cắt "…" trong thẻ (chữ xuống dòng). Turso: 0 câu đọc thêm (nội dung tĩnh).

## Kiểm

`npm run check` đầy đủ: xanh — 5802 kiểm tra + 74 tốc độ. `PISA_CHI_TEP=prHd`: 400 / 400 (HD-DU, HD-NHAN, HD-CAM, HD-HAN, HD-DAI xanh).
