# TUYEN-2 (web) — khớp / khác mockup v27

Mockup: `tuyen-cong-viec.html` T5, T6a – T6d, T11a – T11c + ghi chú (C8). Đặc tả: `docs/superpowers/specs/2026-11-26-tuyen-cong-viec-yt-phoi-hop/thiet-ke.md` mục 4.2, 4b, 7 (TUYEN-2).
Ảnh cặp mockup | web (seed 14/09/2026, Playwright Edge, phông đã nạp): `docs/anh/tuyen-2/` — 1440 + 1280 tối, 375 sáng.
Dữ liệu thêm trên DB demo cục bộ trước khi chụp: GVCN Trần Ngọc Hà xác nhận Meeting CX/GĐCN của Ngô Bảo Châu (để có Xếp lịch họp / Kết quả meeting). Seed chưa có GĐCN → Kết quả meeting về Head (luật máy chủ VAI-0 N75, không đổi ở PR này).

## Bảng truy vết khung → thành phần → ảnh

| Khung mockup (v27) | Thành phần web | Ảnh | |
|---|---|---|---|
| T11c: MỘT nhóm "Báo PH" mọi nguồn (Vi phạm · Báo lại · Tình hình · Trao đổi gia đình · Kết quả Progress · Kết quả Final) | máy chủ `viecBaoPhCuaToi`: Trao đổi gia đình nhóm `bao_ph_yt` (trước `phoi_hop_tvv` — mục "Phối hợp SOS" riêng) | t11c | KHỚP |
| T11c: dòng lớp × nguồn × đợt "n em" (khuôn A) | `gopNguon` (máy chủ) → `khoaGopCua` gộp theo lớp × nguồn; vi phạm / tình hình vẫn mỗi em một dòng | t11c | KHỚP |
| T11c: "4 em ˄" bung danh sách em ngay trong danh sách | bấm dòng "n em" mở panel nhiều em (T11a, `moCaDong`) | t11c / t11a | KHỚP — hai khung mockup tả hai cách mở cùng một dòng; chọn T11a (đặc tả 4.2 "panel nhiều em, khay từng em"), PTA chốt 27/11 "chọn một là hợp lệ" |
| T11a: panel nhiều em — bảng em, "Ghi" mở khay NGAY dưới em | `PanelBaoPhNhieu` (mới) | t11a | KHỚP |
| T11a: khay = khối Phụ trách · Hạn · Theo dõi + Tuyến + Máy điền sẵn + Kết quả · Ngày · Nội dung + Việc con | `PanelBaoPhTvv nhung` (cùng panel một em, không khung) + `NhapViec` theo từng em | t11a | KHỚP |
| T11a: cột "Tuyến" (chuỗi chấm) + "Máy điền sẵn" tóm mỗi em trên dòng | cột Tuyến = `ChuoiCham` · cột Máy điền sẵn (dòng 2+); dòng đầu (lượt · Overall) dưới tên — `GET /y-thuc/bao-ph-lo` theo lô khi mở panel (PTA chốt) | t11a | KHỚP |
| T11b / sửa lỗi: Kết quả Progress / Final mở đúng tên "Báo PH · Kết quả …" (trước: "Meeting CX/GĐCN" + hai phần Meeting) | `nguonTvv` (máy chủ `xemViecBaoPh`) → `laMeeting` chỉ khi Báo PH Meeting thật | t11b | KHỚP |
| T11a / T11b: "Máy điền sẵn" (lượt · Overall · kỹ năng trượt · Case / điểm từng môn) | hàng `BoiCanh` từ `boiCanh.noiDung` máy chủ | t11a, t11b | KHỚP |
| T5: cột Tuyến — chuỗi chấm + "Đang ở {bước} · {người}" | `ChuoiCham` (mới, `KhoiTuyen.tsx`, CSS `.cc` chép v27) · `chuoiTuyen` của GET Phối hợp lớp (TUYEN-0, 0 request thêm) | t5 | KHỚP |
| T5: bấm em mở khay — khối Phụ trách · Hạn · Theo dõi + Tuyến + Việc con | `KhayEm` (BangPhoiHop) — `useGiaoViec('phoi_hop')` + `GET /tuyen/phoi_hop/{lượt}` + `MucViecCon`, chỉ khi mở | t5 | KHỚP |
| T5: dòng em gọn (tên · SOS · "MT2 · Overall") | giữ thẻ điểm cũ (`DiemMotDong`: Overall + chip kỹ năng trượt); hạn bỏ khỏi dòng (ở khối trong khay) | t5 | KHÁC — chip kỹ năng trượt là thông tin cũ GVCN dùng khi xác nhận; giữ |
| T5: "Xác nhận n em ▾" · Xác nhận từng em · Hoàn tác | giữ | t5 | KHỚP |
| T6a / T6b: tiêu đề = phần của người mở ("Xếp lịch họp" / "Kết quả meeting") | `PanelMeeting` theo nhóm dòng việc | t6a, t6b | KHỚP |
| T6: khối Phụ trách · Hạn · Theo dõi của PHẦN MÌNH đầu panel | `KhoiGiaoViec` phần mình | t6a, t6b | KHỚP |
| T6: MỘT khối Tuyến thay 3 khối (phần người khác · dòng Báo PH · bối cảnh GVCN) | `KhoiTuyen` (trường `tuyen` của `/phoi-hop-sos/:id/meeting`) | t6a, t6b | KHỚP |
| T6b: bước "Meeting CX/GĐCN · xác nhận" mở sẵn Nội dung gửi; T6a BPXL không quyền nội dung → đóng, không ˅ (C3) | `moSan` (bước cha có hai phần) | t6a, t6b | KHỚP |
| T6: "{phần} · phần của bạn" + Ngày giờ họp / Kết quả | `PhanMeeting trongPanel` | t6a, t6b | KHỚP |
| T6: Hoàn thành ở chân panel (Lưu · Hoàn thành) | `PhanMeeting baoChan` báo nút lên chân: Đóng · Việc tiếp › · **Hoàn thành** (chính); lỗi lưu ở chân trái; Huỷ sửa giữ trong khối (PTA chốt) | t6a, t6b | KHỚP |
| T6: Phụ huynh nằm trong nội dung bước GVCN xác nhận | máy chủ `tuyen.ts`: bước GVCN xác nhận (Meeting CX xong) nội dung "Nội dung gửi: … / Phụ huynh: {QH} · {tên} · {SĐT}" — chỉ người xem được em; dòng PH riêng chỉ hiện khi bước không đọc được (PTA chốt) | t6a, t6b | KHỚP |
| T6: Việc con · Lịch sử gập | `MucViecCon` phần mình · `LichSuGap` | t6a, t6b | KHỚP |
| T6c 375 / T6d 375 (TVV một em Trao đổi gia đình) | cùng thành phần, 375 | t6c, t6d | KHỚP |

Đếm: 21 dòng · KHỚP 20 · KHÁC 1. **KHỚP thuần 20 / 21 = 95 % — đạt cổng 90 %.** KHÁC còn lại: chip kỹ năng trượt ở T5 (PTA chốt giữ — thông tin làm việc).

Lệch hình nhỏ còn lại (không tính dòng riêng): khay em ở T11a có nút "Lưu" riêng trong khay (mockup: chân panel) — mỗi em lưu độc lập, một chân cho nhiều khay sẽ lẫn em; nội dung bước GVCN là chữ hai dòng (mockup: lưới nhãn · giá trị).

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| TVV: Báo PH Trao đổi gia đình | mục "Phối hợp SOS" riêng, mỗi em một dòng | mục "Báo PH" chung; dòng lớp × nguồn "n em" → panel nhiều em, "Ghi" mở khay em | GIỮ (đổi chỗ) |
| TVV: Kết quả Progress / Final | panel tên "Meeting CX/GĐCN" + hai phần Meeting thừa | panel "Báo PH · Kết quả …" + Máy điền sẵn | SỬA LỖI |
| TVV: Ghi kết quả · Chưa liên hệ được · Bỏ việc · Khôi phục · Hoàn tác · gọi PH | có | có (trong khay hoặc panel một em) | GIỮ |
| GVCN: Xác nhận · Xác nhận n em · Sửa · Bỏ việc · Đưa lại · Hoàn tác | có | có | GIỮ |
| GVCN: Sửa hạn từng em | bấm ngày ở dòng | bấm ô Hạn trong khay em | GIỮ (đổi chỗ) |
| GVCN: Đổi người · Theo dõi · Việc con từng em | không có ở panel cả lớp | khay em | THÊM |
| BPXL / CX: Ngày giờ họp · Kết quả · Hoàn thành · Sửa · Hoàn tác | có | có | GIỮ |
| BPXL: mở panel Xếp lịch họp | **403 "Không có quyền"** (máy chủ đòi đọc cả phần Kết quả) | mở được, phần Kết quả trong Tuyến | SỬA LỖI |
| Theo dõi chung cả Meeting (một dòng cho mọi phần) | có | Theo dõi của phần mình trong khối | ĐỔI — [XM 5] |

## Máy chủ
- `routes/index.ts` `GET /y-thuc/bao-ph-lo?ids=` (mới): chỉ việc trong danh sách Báo PH người xem làm / quản · một câu nguồn · `chuoiPhoiHop` lô · `noiDungNguonTvvLo` lô (`phoiHop.ts`). `/my-work` KHÔNG đổi. Đo (tocDo.run): 1 em 15 câu · 30 dòng; 6 em 17 câu · 115 dòng → trần `TRAN_BAO_PH_LO` 23 câu · 165 dòng.
- `tuyen.ts`: bước Meeting CX/GĐCN xong kèm Phụ huynh (`students.parent_*`) trong nội dung bước (đọc theo quyền như nội dung bước).
- `baoPhTvv.ts`: `xemViecBaoPh` + `nguonTvv`; `viecBaoPhCuaToi` Trao đổi gia đình nhóm `bao_ph_yt` + `gopNguon` (nhãn "Trao đổi gia đình · MT{n}").
- `giaoViec.ts` `xemMeeting`: chỉ trả phần người xem đọc được (từng phần `requireDoc`); không phần nào → 403 như cũ.
- `shared/domain/gopViec.ts`: `gopNguon` gộp được dù nhóm giữ từng dòng.
- Nguồn **Chuyển lớp** (LPB-0 #2266) chưa merge — để chỗ: `gopNguon` nhận mọi nguồn mới, không đổi web khi thêm.

## [XM]
1. T11c (bung trong danh sách) vs T11a (panel nhiều em) cho cùng dòng "n em" — chọn T11a (PTA chốt hợp lệ).
2. ~~Chuỗi chấm từng em~~ — ĐÃ LÀM (GET lô khi mở panel, không ở `/my-work`).
3. ~~Hoàn thành ở chân panel Meeting~~ — ĐÃ LÀM.
4. ~~Phụ huynh trong nội dung bước GVCN~~ — ĐÃ LÀM.

Phép kiểm máy chủ `prTuyen0.tests.ts` TUYEN2-1: xemMeeting BPXL một phần (không phần Kết quả), GVCN hai phần; bước GVCN có Nội dung gửi + Phụ huynh, BPXL không nội dung; `nguonTvv` Trao đổi gia đình + Kết quả Progress / Final.
5. Theo dõi chung một dòng cho cả Meeting → nay theo dõi của phần mình.
6. Lỗi sẵn có đã sửa: BPXL 403 ở panel Xếp lịch họp.
