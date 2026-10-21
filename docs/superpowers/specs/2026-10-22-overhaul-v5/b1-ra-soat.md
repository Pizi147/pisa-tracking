# B1 — Rà soát Tổng quan theo vai · Công việc · TVV / Sau thi (pha 1)

> Soạn 22/10/2026, session cloud V5-B1. Pha 2 (mockup): `thiet-ke/v5/tong-quan.html`, `cong-viec.html`, `tvv.html` + truy vết. Nguồn: brief [`00`](00-brief-chu-sp.md) mục 5, 6, 7, 9, 15, 18 · [`01`](01-quyet-dinh-22-10.md) · mã trên `main` (đọc, không sửa) · mockup V4 `thiet-ke/mockup-v4-tong-quan`, `-cong-viec`, `-viec-tvv` (tham khảo).
> Nhãn: **[MÃ]** = hiện trạng đã đọc trong mã · **[KH]** = đã chốt trong `plan.md` 1.6 nhưng CHƯA có trong mã · **[CHỐT]** = brief / chủ SP 22/10 · **[ĐX]** = đề xuất thiết kế · **[XM]** = cần xác minh.

## 1. Vai thực tế trong mã [MÃ]

| Vai (mã) | Tên trên màn | Trang `/` hôm nay | Menu |
|---|---|---|---|
| `system_admin` | Quản trị (QT) | Tổng quan bố cục QL + lọc chi nhánh `?cn=` (chỉ hiện khi ≥ 2 CN) | Tổng quan · HV & Lớp · Test · Công việc · Phân tích |
| `manager` | QL | Tổng quan QL | như QT |
| `teacher` | GV (GVCN / GVBM / GV S chéo **không phải vai**, suy từ phân công) | **không có Tổng quan** → `/cong-viec` | HV & Lớp · Test · Công việc · Phân tích |
| `office_admin` | Admin | Tổng quan "Mock Test" | Tổng quan · Test · Công việc (chỉ nhóm Chấm điểm) |
| `consultant` | TVV | Tổng quan "HV của tôi" (ô đếm HV) | Tổng quan · HV & Lớp · Phân tích — **không Công việc** (thiếu `work.view`) |
| `cx` | CX | Tổng quan ô HV + `MetricTiles` + bảng chi nhánh | Tổng quan · HV & Lớp · Phân tích |
| `head_tutor` | Head tutor | `/` chuyển thẳng `/tutor` | Tutor |

Nguồn: `shared/domain/people.ts:19-41`, `server/src/seed/data.ts:49-110`, `server/src/platform/nav.ts:14-50`, `web/src/App.tsx:296-316`, `web/src/modules/worklist/OverviewPage.tsx:51-148`.
- Kiêm vai: người ≥ 2 vai có QL/QT đổi "Góc nhìn" → quyền chỉ còn vai đang chọn (`server/src/auth.ts:79-86`). GV kiêm GVCN = một vai `teacher`, không trang riêng.
- `branch_admin` đã bỏ (chỉ đọc lịch sử).

## 2. Tổng quan hôm nay theo vai [MÃ] — vấn đề so với brief mục 6

| Vai | Khối / chỉ số hiện có (chữ trên màn) | Đơn vị · tử / mẫu | Vấn đề (brief) |
|---|---|---|---|
| QL / QT | Dải "HV cần chú ý" (HV chưa lịch Test · HV chưa điểm · "N HV · M Case chưa chốt PA" · "bài trễ chấm · n GV") → "Cần bạn quyết" (Chờ duyệt · Case chưa chốt PA · Chọn bước tiếp · Chốt lộ trình) → "Lớp cần chú ý" → "Tuần này" (Lịch sắp tới + Trễ chấm) | lẫn HV / Case / bài / GV; **không mẫu số** | **Form nhúng** trong Tổng quan (`HopChoDuyet`, `NganCase`, `PanelViec`, `PanelLoTrinhLop` — `KhoiCanQuyet.tsx:87-144`, `TongQuanQl.tsx:231-246`) trái C04; khối Trễ chấm trái 6.2 "không dựng cảnh báo chấm khắp màn"; không có tỷ lệ HV đạt MT, % Case có PA |
| QT | như QL; "Tất cả chi nhánh" → bảng theo chi nhánh (`bangChiNhanh.ts:168`, `cheDo: 'chi-nhanh'`) | không tử / mẫu | gần đúng 6.3; thiếu tỷ lệ có trọng số (T20) |
| GV | không có — Công việc là trang đầu | — | brief 6.4 muốn Tổng quan GV (tiến độ, bài đến hạn, Case, xu hướng HV kỹ năng mình); cần tách "kỹ năng tôi dạy" / "lớp tôi chủ nhiệm" |
| TVV | 6 ô HV: Cần chú ý · Tạm dừng · Sắp thi · Thiếu thông tin · Đã thi · chờ kết quả · Chờ chọn bước tiếp (`HocVienCuaToi.tsx:18-48`, API `/tong-quan/hoc-vien`) | HV, không mẫu số | đúng hướng "nhóm cần chú ý" nhưng thiếu % báo PH, "Chưa liên hệ được" (vì việc báo PH chưa có) |
| Admin | 4 ô: Lượt MT tuần này · Ô điểm chưa nhập (⚠ quá hạn) · Đề nghị dời chờ · MT chưa xếp lịch + "GV chấm quá hạn" + Lịch sắp tới (`tongQuanMt.ts:32`) | lượt / ô / đề nghị | đúng 6.6; thiếu độ đầy đủ phân công; "Ô điểm" là đơn vị kỹ thuật → đề xuất "bài" |
| CX | ô HV + "Học viên dưới kỳ vọng **/ N đánh giá được**" · HV có Case mở · Case chưa chốt PA · PA chưa có Kết quả + Điểm đáng chú ý + bảng chi nhánh | **có mẫu số** (chỉ số đầu) | khá sát 6.6; giữ nguồn `metrics.ts` |
| Head tutor | trang Tutor | — | không có Tổng quan; [ĐX] giữ: Tutor là trang đầu, thêm dải 3 chỉ số đầu trang Tutor (thuộc B3) |

## 3. Công việc hôm nay [MÃ]

- **Một nguồn** `/my-work` (`server/src/worklist/mywork.ts`, 23 kind, khai `:146-165`; nhóm `:1389`). Hồ sơ, Cần làm, badge GV cùng nguồn; **chuông thì không** (mục 5).
- 4 nhóm: Chấm điểm · Case học thuật · Ý thức & Phối hợp · Vận hành (QL: "Việc quản lý", gập) — `shared/domain/tongQuan.ts:30-45`.
- Người phụ trách theo kind: điểm = ô `mine` đúng kỹ năng phân công (`fasttrack/attempts.ts:510`, `permissions.ts:363`); Case / nhận xét / Xác nhận PA = chủ Case có `SOS_EDIT` đúng kỹ năng; Thêm PA = chủ Case hoặc QL CN; Phối hợp, Ý thức = GVCN; Chốt / Xét lại lộ trình **không chủ** (`ownerId` null).
- **T01** — Case R và W cùng GV: **2 việc** (`cause:{id}` tách theo `topic`), nhưng `gopViecTheoLop` (`shared/domain/gopViec.ts:88-147`) gộp một dòng "1 em · 2 việc" (trừ Thêm PA lớp FT). → Rủi ro: việc thứ hai "ẩn" trong dòng gộp; mockup phải hiện 2 dòng con có nhãn kỹ năng + hạn riêng.
- **T02** — GV chỉ thấy `myPendingDetail` (`mywork.ts:522-532`): không lấy bài GV khác. QL `nguoi=tat-ca` thêm `khacDongs` (`:566-584`). Đúng brief 7.
- **T03** — S chéo: ô S Mock `laChamCheo` (`shared/domain/chamDiem.ts:45`) không `mine` của ai, `userId` null trong nợ điểm (`scoreDebt.ts:113-115`) → **không thành nợ**. GV S có 1 việc "Chấm Speaking · n bài", không hạn, từ T2 tuần thi (`mywork.ts:539-563`); phạm vi `lopFtChoGvSpeaking` (`permissions.ts:281-287`, mọi lớp FT trong CN có grant). Loại khỏi "Của một GV" (`:1500`). Đúng N7 / C12.
- **Đơn vị đếm hiện lẫn**: đầu nhóm chỉ một số trơn; dòng gộp "n bài" / "n em" / "n em · m việc" / "n việc"; dòng lẻ "n bài" / "n HV"; đầu trang "n việc đến hết {tuần}". `soBai` = kỹ năng × em (`mywork.ts:513`); bảng nợ đếm **ô** (`scoreDebt.ts:10-26`); badge GV = **dòng quá hạn sau gộp** (`demDong`, `:1468`). → Ba đơn vị (dòng / việc / bài) cùng gọi "việc" ở các nơi khác nhau.
- **QL xem người khác**: `phamViXemViec` (`xemViec.ts:8-12`) `'het'` (có `case.approve`) / `'cham-diem'` (Admin) / `null`. Panel mở và **làm được nếu server cho** — không có chế độ "chỉ xem", không có nhãn "Làm thay". Nút Nhắc đã bỏ (OV-12h).
- Panel: `?viec=key`; desktop tự mở việc đầu khi vào / đổi lọc; lưu xong dòng mờ + tự sang việc kế, trừ khi còn "Hoàn tác" hoặc chữ đang gõ → nút "Việc tiếp ›"; điểm có "Lưu · em tiếp ›". Bản nháp chỉ trong bộ nhớ; đổi việc khi gõ dở hỏi "Bỏ nội dung đang gõ?" (`PanelViec.tsx:197`) — **không nháp bền** (grep, chưa kiểm hết) → T15 / T16 chưa đủ.

## 4. TVV và Sau thi [MÃ] vs [KH]

| Việc | Mã hôm nay | Đã chốt (`plan.md` 1.6 / 01) | Khoảng cách |
|---|---|---|---|
| **Ghi kết quả báo PH** (vi phạm) | **Không có.** Lưu xử lý (`yThuc/xuLy.ts:178-206`) chỉ ghi `discipline_measures` + báo QL "để biết" | N1: sinh **ngay** khi GVCN lưu (kể cả chờ QL duyệt) · N2 + 01: hạn **23:59 giờ VN ngày lưu + 4** | Cần kind mới + bảng lần thử (PR GĐ1b SV-TVV-VIEC). Mockup vẽ theo luật đã chốt, ghi rõ "chưa có trong mã" |
| Báo PH kết quả Test lớp thường | `sos_coordination_actions.kind='bao_ph_tvv'` — việc của **GVCN** (Final: QL), không hạn; form `performedOn` + `note` + chụp 4 nội dung; trạng thái `pending/done/removed`; "Bỏ" có lý do (`yThuc/phoiHop.ts:98-131, 470-500`, `shared/domain/sos.ts:130-151`) | N6: giữ GVCN | **Không** thuộc trang TVV — tránh nhầm hai việc cùng chữ "báo PH" |
| Chưa liên hệ được · lịch sử lần thử | không có (một dòng mỗi bài) | brief 9.1 [CHỐT C15]: một lần thử, việc còn mở, giữ hạn | dữ liệu mới: bảng lần thử (ngày, người, kết quả, ghi chú) |
| Kết quả thi thật | `datKetQuaThiThat` (`loTrinh/thiThat.ts:59-120`) **tách** khỏi `chonBuocTiep` (`buocTiep.ts:187`) — lưu điểm riêng **đã được** | N6: chuyển từ GVCN sang TVV, không hạn | Giao diện: hôm nay GVCN lớp cuối nhập (`thiThat.ts:160-185`); TVV nhập được qua `student.edit_more` |
| Bước tiếp sau thi | trạng thái `chua_thi · da_thi_cho_kq · cho_buoc_tiep · xong` (`shared/domain/tongKetLoTrinh.ts:101-136`); hạn = max(ngày thi + 7 / `han_sau_thi`, ngày có KQ); gia hạn đếm lần; `ownerId` null, `mine` cho mọi QL / TVV CN | N6: **TVV của em giữ**, hạn 1 tuần từ khi có KQ | mã khớp N6 (xem XM1 mục 7). Gán lại TVV **không reset hạn** (hạn trên `learning_cycles`) ✓ |
| Chốt ngày thi | kind `chot-ngay-thi:<cycleId>`, nhóm `missing_data`, không hạn — **GVCN** (`mywork.ts:1140-1160`) | N6: TVV | chuyển chủ việc (GĐ1b) |
| Bổ sung hồ sơ thiếu | không kind; chỉ chip `thieu_tt`, "Thiếu email" (`hvCuaToi.ts:9,42`) | N6: TVV | kind mới; V4 Q-D4: 4 trường (Ngày sinh · Email · Tuần bắt đầu · Target FT) |
| SĐT PH | `students.parent_phone`, `parent_name`, `parent_relation` (`schema.sql:294`) | — | có dữ liệu cho "bấm gọi" |

Em chưa có TVV (`consultant_user_id` null) → việc về QL CN (N6). Demo V4: 4/129 em có TVV → cần seed (SEED-UX, đang tạm huỷ).

## 5. Nguồn số và đơn vị đếm — đề xuất chốt cho B1 [ĐX]

| Nơi | Đếm | Đơn vị đề xuất (chữ trên màn) | Nguồn |
|---|---|---|---|
| Badge menu Công việc (mọi vai có menu) | việc **của tôi** đang mở, quá hạn tô ⚠ | "việc" — 1 việc = 1 kind × 1 đối tượng × 1 kỹ năng (Case R ≠ Case W) | `/my-work` `mine` (không đếm dòng gộp) |
| Đầu trang Công việc | "3 nhóm · 7 việc · 12 bài" | nhóm = dòng gộp; việc như trên; bài = kỹ năng × em chưa có điểm | `/my-work` một lần gọi |
| Chuông | **thông báo chưa đọc** (chấm + số riêng) | "tin" — khác hẳn số việc | `/notifications` |
| Tổng quan | tỷ lệ có tử / mẫu + số tuyệt đối | % · "15/20 HV" | `metrics.ts` (đã có mẫu số "đánh giá được"), `tongQuanQl.ts`, `bangChiNhanh.ts` |
| QL "Cần bạn quyết" | Chờ duyệt = **đề xuất** | "đề xuất" | `/yeu-cau/dem` — hôm nay mọi CN, cần lọc theo phạm vi trang |

Hiện badge QL = số chờ duyệt mọi chi nhánh, badge GV = dòng quá hạn → hai nghĩa khác nhau dưới cùng một badge (vi phạm brief 7).
Số việc không đổi khi gập nhóm / phân trang (T17): đếm trước khi gộp.

## 6. Vấn đề chính → hướng V5-B1

1. **Tổng quan làm việc thay vì tình hình** (QL / QT: 4 loại form nhúng) → bỏ form; "Chờ duyệt" thành bảng gọn + link sang Công việc / hộp duyệt; số mở panel chỉ đọc (C04, C22).
2. **GV không có Tổng quan** → [ĐX] thêm Tổng quan GV gọn (hai cột "Kỹ năng tôi dạy" / "Lớp tôi chủ nhiệm"); Công việc vẫn là trang đầu GV? → [ĐX] trang đầu GV = **Tổng quan** (brief 6.1 "Tổng quan trả lời tình hình"), dải "Việc hôm nay" một dòng dẫn sang Công việc. Ghi vào câu XM nếu chủ SP muốn giữ G3.
3. **TVV không có Công việc** (C05 thay G3 / Q-A1 ①) → menu Công việc TVV: Báo PH · Sau thi (KQ thi thật → Bước tiếp) · Chốt ngày thi · Bổ sung hồ sơ.
4. **Form báo PH V4 4 hàng chip** → 2 nút trạng thái + Ngày (`ONgay`, mặc định hôm nay) + Ghi chú (C15).
5. **Đơn vị đếm lẫn** dòng / việc / bài / ô → chữ "nhóm · việc · bài" cố định (mục 5).
6. **Chuông ≠ việc**: hôm nay số chuông = dòng "Cần làm" của thông báo → [ĐX] chuông đếm **tin chưa đọc**, việc chỉ ở badge Công việc.
7. **QL xem người khác không có chế độ theo dõi** → dải "Đang xem việc của {GV} · chỉ theo dõi" + nút "Làm thay" chỉ hiện khi quyền cho (Case: `case.approve`; điểm: `score.override`).
8. **T01 ẩn trong dòng gộp** → dòng gộp HV mở thành dòng con theo kỹ năng; panel đúng kỹ năng.
9. **Không nháp bền / xung đột** (T15, T16) → mockup trạng thái "Đã giữ bản nháp", "Người khác vừa lưu · Tải lại / Giữ của tôi", lỗi mạng giữ chữ.

## 7. Cần xác minh (chỉ câu chưa có căn cứ)

- ~~XM1 — Hạn bước tiếp~~ **Đã rõ** (V5-A `06` điểm 3): hạn = muộn hơn của (ngày thi + 7, ngày có KQ + 7) — khớp N6 "1 tuần từ khi có KQ". Mockup: Quyên thi 12/09, có KQ 14/09 → hạn 21/09.
- XM2 — Trang đầu GV: G3 (21/10) "GV → Công việc" vs brief 6.4 (Tổng quan GV). Mockup vẽ Tổng quan GV; nếu giữ G3 thì Tổng quan GV thành dải đầu trang Công việc.
- XM3 — "Kết thúc · không liên hệ được" (V4 Q-D3 ①) có giữ không: brief 9.1 cho phép "thao tác phụ"; mockup để trong menu "⋯" của việc, không trên form chính.
