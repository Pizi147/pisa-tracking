# GD-14 — Tổng quan QL / Quản trị / CX / Admin theo mockup ⑧ (`thiet-ke/v21/tong-quan.html`, lời 37, 39, 41)

Plan: `docs/superpowers/specs/2026-11-13-overhaul-v6/12-plan-giao-dien-dot-3.md` dòng GD-14 (+ ghi chú V22 cuối tệp). Ghi chú mockup: `thiet-ke/v21/tong-quan-ghi-chu.md` (mục 2 truy vết, mục 3 thao tác, mục 6 [XM] đã chốt, **mục 10 lời 37**).
Luật áp: V22 (hạn chỉ màu), lời 35 (chip / badge không đơn vị), 36, 40; ✓ Đã lưu xanh (không đổi). Hồ sơ GV (khung H của ⑧) KHÔNG trong PR này (GD-15).
Ảnh cặp (trái mockup · phải web, seed demo 14/09; phông Be Vietnam Pro + Inter đã nạp):
- `cap-ql-1440-toi.png` — T1 ↔ `/` QL Monbay (vai 2) · `cap-ql-375-sang.png` — T7a
- `cap-qt-1440-toi.png` — T3 ↔ `/` Quản trị (vai 1, Tất cả chi nhánh)
- `cap-cx-1440-toi.png` — T4 ↔ `/` CX (vai 24) · `cap-cx-375-sang.png` — T7b
- `cap-admin-1440-toi.png` — T5 ↔ `/` Admin VP Monbay (vai 26) · `cap-admin-375-sang.png` — T7c
- `truoc-{ql,qt,cx,admin}-1440.png` — TRƯỚC PR (mockup │ web main; ảnh Admin trước chụp vai 22 — chi nhánh không có dữ liệu)

## 1. Truy vết khung → thành phần → ảnh

| # | Khung | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | T1–T5 đầu trang (tên · phạm vi · tuần · kỳ │ link · khung · chi nhánh) | `DauTrangTq` (giữ) | cap-*-1440 | KHỚP |
| 2 | T1 ô **Việc của tôi ›**: dòng phụ chỉ "n quá hạn"; 0 → mờ, không "›", không bấm (C3) | `OViecCuaToi` | cap-ql-1440 | KHỚP (KHÁC theo V22: không ⚠) |
| 3 | T1 ô **Chờ duyệt ›**: dòng phụ chỉ khi có quá hạn | `ChiSoChoDuyet` | cap-ql-1440 | KHỚP |
| 4 | T1 ô Đạt MT ⓘ: dòng phụ "8 HV chưa đủ dữ liệu" (bỏ "2/3 HV") | `ChiSoDatMt` · `mauDatMt` | cap-ql-1440 | KHỚP |
| 5 | T1 ô **Case chưa có PA** 38 · "trong 45 Case đang mở" (45 bấm → panel Case đang mở) — XM-2, XM-14 | `ChiSoCaseChuaPa` | cap-ql-1440 | KHỚP |
| 6 | T1 ô Thi tháng này ⓘ (bỏ "HV") | `ChiSoThi` | cap-ql-1440 | KHỚP |
| 7 | T1 thứ tự ô cố định Việc · Chờ duyệt · Đạt MT · Case chưa có PA · Thi tháng này | `TongQuanQlV5` | cap-ql-1440 | KHỚP |
| 8 | T1–T7 số bấm được trong bảng = **hộp viền** (đỏ = quá hạn / chưa làm); 0 / không bấm = chữ thường; số to ô chỉ số giữ dáng chữ | lớp `.o-so-hop` ở trang Tổng quan (cùng luật Phân tích) | cap-*-1440 | KHỚP |
| 9 | T1 **Lớp cần chú ý** + số đếm "4"; cột "Case chưa có PA"; không mẫu "2/3" dưới % | `LopCanChuY` · `DemDau` | cap-ql-1440 | KHỚP |
| 10 | T1 **Giáo viên** + số đếm + ⓘ; Hành chính: **Việc** (% đúng hạn · Chưa làm) │ **Chấm Test** (% đúng hạn · Chưa làm) │ **Tới hôm nay** (Bài quá hạn) — lời 37, phương án A | `GvCanChuY` (`Bang` tiêu đề nhóm + `tach`) | cap-ql-1440 | KHỚP |
| 11 | T1 hàng cuối **S chéo chung · chưa ai nhận** (Chưa làm Chấm Test + Bài quá hạn) | hàng id −1 (số = GV thấy nhiều nhất, panel `sc=1` như Phân tích GV; Bài quá hạn = `tre` khoá −1) | cap-ql-1440 | KHỚP |
| 12 | Số đúng hạn / làm muộn xem ở panel khi bấm hộp % (0 % có mẫu > 0 vẫn bấm) | `OSo nhan="%"` → `/phan-tich/giao-vien/o?…&tt=dung` | bấm thử | KHỚP |
| 13 | T1 Giáo viên · Học thuật: "Case có PA" → **"Case chưa có PA"** (số, panel `case-chua-pa`) | `COT_GV_HT` + máy chủ `oHoSoGv` cột `case-chua-pa` (đọc khi bấm) | — | KHỚP |
| 14 | T1 **Chờ duyệt** (tên một với ô) + số; 5 dòng + **"+ n yêu cầu"** mở tại chỗ; bỏ "Hộp duyệt ›" (XM-6); hạn = viên | `ChoDuyetGon` (`ChipHan vien`) | cap-ql-1440 | KHỚP |
| 15 | T3 Quản trị: + **Việc của tôi ›** + **Chờ duyệt ›**; 6 ô Việc · Chờ duyệt · Đạt MT · Đạt Target · Case chưa có PA · Thi tháng này | `TongQuanQtV5` (`DaiChiSo sau`) — số chờ duyệt từ khung App (`DemYeuCauCtx`) | cap-qt-1440 | KHỚP |
| 16 | T3 cột phải **Chờ duyệt** như QL — GET danh sách CHỈ khi số > 0 (XM-4) | `BoCuc phai` | cap-qt-1440 | KHỚP |
| 17 | T3 / T4 **Theo chi nhánh** MỘT bộ cột (Đạt MT · Đạt Target thi thật · SOS 2–3 · Case chưa có PA · Thi tháng này) + số đếm + **Toàn hệ thống**; bấm dòng (cả CX) — XM-3 | `TheoChiNhanh` (`COT_CN`) | cap-qt-1440, cap-cx-1440 | KHỚP (KHÁC-1) |
| 18 | T4 CX 5 ô giữ (không Việc / Chờ duyệt — XM-1); dòng phụ bỏ "HV", "2/3 HV" | `TongQuanCxV5` | cap-cx-1440 | KHỚP |
| 19 | T4 link "Báo cáo HV ›" → **"Báo cáo ›"** | `lienKetTq('cx')` | cap-cx-1440 | KHỚP |
| 20 | T5 Admin ô: Lượt MT tuần này › (bỏ "n lớp") · Bài chưa nhập điểm › (chỉ "n quá hạn") · HV chưa đủ MT › (định nghĩa vào ⓘ) | `MockTestAdmin` | cap-admin-1440 | KHỚP |
| 21 | T5 **GV chấm quá hạn** mỗi GV một dòng (kỹ năng · lớp · hộp đỏ số bài · "lâu nhất n ngày"); bấm dòng → panel GV đó (XM-12); "Speaking chấm chéo" → **"Chấm Speaking · chưa ai nhận"**; dòng "chờ chấm" ra khỏi khối | `MockTestAdmin` (gom theo GV, panel `/tong-quan/gv-tre?gv=`) | cap-admin-1440 | KHỚP |
| 22 | T5 **Lịch sắp tới** sang cột phải 400; link **"Kế hoạch Test ›"** (thay "Xem toàn bộ lịch ›"); bỏ "Kế hoạch Test ›" đầu trang (XM-7) | `BoCuc` · `LichSapToi` · `lienKetTq('admin')` | cap-admin-1440 | KHỚP |
| 23 | T7a 375 QL: ô 2 cột; Chờ duyệt lên trước; bảng thẻ; thẻ GV nhãn đủ nhóm; GV không bài quá hạn gập sau **"+ n GV · S chéo chung"** | `Bang theRieng` (thẻ GV) + nút mở tại chỗ | cap-ql-375 | KHỚP |
| 24 | T7b / T7c 375 CX, Admin: ô 2 cột, bảng thẻ, cột phải lên trước | `BoCuc`, `Bang theLuoi` (giữ) | cap-cx-375, cap-admin-375 | KHỚP (KHÁC-2) |
| 25 | T6 trạng thái: giữ chỗ · lỗi + Thử lại · rỗng | `Skeleton` / `ErrorState` / `Bang rong` (giữ) | — | KHỚP (mã) |
| 26 | Hướng dẫn "?" QL · Quản trị (dùng màn QL) · CX · Admin | `shared/huongDan/{ql,cx,admin}.ts` + `en/gd14.ts` | — | KHỚP |

**KHỚP 26 / 26 = 100 %** thành phần.

## 2. KHÁC (có lý do)
- **KHÁC theo V22** (lời 43, 44): mockup còn "⚠ 6 quá hạn", "⚠ 12" … → web chỉ màu đỏ.
- **KHÁC-1** cột SOS 2–3 ở bảng Theo chi nhánh là số thường (mockup vẽ hộp bấm được): máy chủ chưa có tập "SOS 2–3" theo chi nhánh cho panel (`COT_BANG` chỉ có `sos1/2/3`) — thêm tập là việc máy chủ riêng; số vẫn đúng.
- **KHÁC-2** 375 bảng Theo chi nhánh hiện đủ chi nhánh (mockup T7b gập chi nhánh rỗng sau "+ 3 chi nhánh"); 375 Chờ duyệt một hàng (mockup hai hàng) — tên em không bị cắt ở dữ liệu thật.
- **Số chờ duyệt Quản trị** đọc từ khung App qua context nhỏ `DemYeuCauCtx` (cùng kiểu `ViecCuaToiCtx`) — thêm Provider ở `App.tsx` để không GET `/yeu-cau/dem` lần hai.
- Panel ✕: `KhungPanel` chung (không đổi, đã đo ở GD-7 / GD-8: cao 36, cách mép 20–21 px). Tổng quan không có "⋯".

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| Bấm cả ô số | có ("Việc của tôi ›" còn "›" khi 0) | giữ; 0 không bấm, không "›" | SỬA (C3) |
| Ô "Case có PA" → panel Case đang mở; số "38 chưa PA" → panel Case chưa chốt PA | ô Case có PA | ô "Case chưa có PA" → panel Case chưa có PA; số "45" ở dòng phụ → panel Case đang mở | ĐỔI tên, giữ cả hai panel |
| Quản trị: Việc của tôi ›, Chờ duyệt ›, cột Chờ duyệt | không có | có | THÊM (R8.2) |
| Bảng Giáo viên: số % → panel tab Đúng hạn; "n chưa làm" (chữ) | chữ phụ dưới % | hộp "Chưa làm" riêng → panel tab Chưa làm; % → tab Đúng hạn | ĐỔI dáng (lời 37) |
| "+ n S chéo chung" dưới mỗi GV | chữ phụ | hàng cuối "S chéo chung" (hộp Chưa làm → panel `sc=1`, hộp Bài quá hạn → Nhập hộ) | GOM |
| Bài chấm quá hạn → panel Nhập hộ | cột "Bài chấm quá hạn" | cột "Bài quá hạn" (Tới hôm nay) — cùng panel | ĐỔI tên |
| Học thuật: Case có PA % → panel Case đang mở | % | "Case chưa có PA" số → panel Case chưa có PA (mới, đọc khi bấm) | ĐỔI |
| Chờ duyệt: bấm dòng → panel duyệt | có | giữ | GIỮ |
| "Hộp duyệt ›" | cuối khối | gom vào ô "Chờ duyệt ›" (cùng đích); "+ n yêu cầu" mở thêm tại chỗ | GOM (XM-6) |
| CX: bấm dòng chi nhánh | không | có (như Quản trị) | THÊM |
| CX "Báo cáo HV ›" | có | "Báo cáo ›" (cùng đích) | ĐỔI chữ |
| Admin "Kế hoạch Test ›" đầu trang | có | ô "Lượt MT tuần này ›" + "Kế hoạch Test ›" đầu khối Lịch sắp tới | GOM (XM-7) |
| Admin GV chấm quá hạn: số GV → panel theo GV | có | giữ + bấm từng dòng → panel GV đó | GIỮ + THÊM |
| Mã lớp / tên GV = link hồ sơ; Hành chính / Học thuật; công tắc khung; ô Chi nhánh; Thử lại | có | giữ | GIỮ |

Không thao tác nào bị mất.

## 4. Đo
- **Turso** (GET khi mở Tổng quan, không tính `/demo/session`): QL 6 → 6 · CX 3 → 3 · Admin 4 → 4 · Quản trị 4 → 5 (= `+ /yeu-cau?hop=cho-duyet` CHỈ khi số chờ duyệt > 0 — đúng XM-4 / cột Turso của plan; số ô lấy từ badge khung App, 0 request). Panel mới `case-chua-pa` chỉ đọc khi bấm.
- `npm run check` đầy đủ: xem mô tả PR.

## 5. Thành phần chung / máy chủ đã sửa
- `worklist/TongQuanV5.tsx` (chính) · `worklist/MockTestAdmin.tsx` · `worklist/Highlights.tsx` (chữ link) · `worklist/OverviewPage.tsx` (`.o-so-hop`, bố cục Admin).
- `lib/viecCuaToi.ts` + `App.tsx`: `DemYeuCauCtx` (số chờ duyệt dùng chung, không GET lại).
- Máy chủ: `giaoVien/hoSo.ts` + `shared/domain/hoSoGiaoVien.ts` — cột panel `case-chua-pa` (Case đang mở của GV ∩ Case chưa chốt PA; cùng tập `caseCoPaTheoGv`).
