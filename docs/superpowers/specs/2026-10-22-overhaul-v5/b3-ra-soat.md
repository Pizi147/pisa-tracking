# B3 — Rà soát Hồ sơ GV · Phân tích / Báo cáo · Tutor · trang còn lại (PHA 1)

> Soạn 22/10, đọc mã `main` (sau #506). Nguồn: brief 00 mục 5, 13–16, 18; `01-quyet-dinh-22-10.md`; ảnh `kpi-tieu-chi.jpg` (chỉ định hướng, KHÔNG tính điểm).
> Nhãn: **CÓ** = đã có hàm tập trong mã (số = danh sách khi bấm) · **MỘT PHẦN** = có nguồn, thiếu đúng định nghĩa brief · **CHƯA CÓ DỮ LIỆU** = không bịa số, mockup ghi "Chưa có dữ liệu".

## 1. Vai thực tế trong mã (`shared/domain/people.ts`, `server/src/seed/data.ts`)

| Vai (mã) | Hồ sơ GV người khác / Phân tích GV (`analysis.view_teacher`) | Phân tích (`analysis.view`) | Tutor |
|---|---|---|---|
| Quản trị (`system_admin`) | Có, toàn hệ thống | Có | xem + sửa |
| QL (`manager`) | Có, chi nhánh mình | Có | xem (buổi của HV chi nhánh) |
| Admin (`office_admin`) | Có | Có | — |
| GV (`teacher`) | Chỉ hồ sơ chính mình | — | — |
| TVV (`consultant`), CX (`cx`) | — | Có (trừ phần GV) | — |
| Head tutor (`head_tutor`) | — | — | xem + sửa (toàn hệ thống) |

Mockup giữ đúng ma trận này: không cấp mới. "QT theo chi nhánh" = `system_admin` chọn chi nhánh.

## 2. Hiện trạng màn

- **Hồ sơ GV** (`web/src/modules/giaoVien/HoSoGiaoVienPage.tsx`, máy chủ `server/src/giaoVien/hoSo.ts`): đầu trang + khối Việc đang có (nhóm Công việc), Lớp đang dạy + ô điểm nợ, Kết quả lớp "mốc gần nhất", Case đang phụ trách, Yêu cầu đã gửi, chip bàn giao. Không tách Hành chính / Học thuật; không bộ lọc kỳ (số là "hiện tại"); trộn ảnh chụp hôm nay với kết quả → trái C06.
- **Phân tích** (`PhanTich.tsx`): 6 tab Báo cáo · Test + SOS · Kết quả thi · Hiệu quả PA · Phân tích GV · Ý thức; một hàng lọc chung (Chương trình · Khoảng · Lớp). Số bấm mở `SoLieuO` → panel danh sách cùng hàm tập (hợp đồng số liệu tốt — GIỮ).
- **Phân tích GV** (`server/src/phanTich/giaoVien.ts`): một bảng, mỗi cột một hàm tập `{dung, tong}`; ô "18/20 · 90%", dưới 5 mục = "mẫu nhỏ", "—" không áp dụng, "không có" = mẫu 0. Màu ngưỡng 50 / 70 % ở ô kết quả (Q19) — brief 15 cấm tự đặt ngưỡng xanh / vàng / đỏ từ ảnh KPI → **đề xuất bỏ màu ngưỡng** (CẦN XÁC MINH: Q19 là quyết định chủ SP cũ; brief mới hơn thắng → khuyến nghị bỏ).
- **Panel số** (`oChiSoGv`, `oBaoCao`, `metricResponse`): đã chỉ đọc ở Phân tích GV; panel `metrics.ts` (OV-12e) còn "việc của một dòng" làm tại chỗ → trái C22 khi mở từ Báo cáo. Mockup V5: panel báo cáo không có khối Cần làm.
- **Tutor** (`server/src/tutors/trang.ts`): tỷ lệ tiêu chí `[Có, số buổi có trả lời]` (dòng NULL không vào mẫu — đúng T19), kết luận `on / can_cai_thien / ngung` của Head tutor. Không có điểm KPI — GIỮ.
- **Hộp duyệt** (`server/src/duyet/`), thu hồi Ý thức (`server/src/yThuc/xuLy.ts`); Hoàn tác chung `HOAN_TAC_MS = 5000` (5 s), MT "-" 10 s (#503).

## 3. Chỉ số Hồ sơ GV / Phân tích GV — nguồn thật

Gán người (đã có, Q15): ô điểm → phân công ở **hạn nhập**; kết quả + tiến bộ → phân công ở **tuần thi**; vi phạm → GVCN ở **hạn xử lý**; PA → người phụ trách Case.
→ Đổi GV giữa kỳ đã gắn theo thời gian phân công (`effective_from ≤ d ≤ effective_to`): **CÓ**, mockup chỉ cần nói rõ.

### 3.1 Hành chính (brief 13.1, TC.04)

| Chỉ số brief | Nguồn mã | Tình trạng | Đơn vị · tử / mẫu |
|---|---|---|---|
| Cập nhật điểm đúng hạn | `tapChamDiem` | **CÓ** | ô điểm (một kỹ năng một lượt); đúng hạn = nhập đầu ≤ mốc trễ / ô đến hạn thuộc phân công; loại vắng, huỷ, chờ duyệt dời, "-", HV không đang học |
| Ghi kết quả PA đúng hạn | `tapGhiKetQuaPa` (= `metricSet('dung-han-cap-nhat')`) | **CÓ** | nghĩa vụ (PA × kỳ 2 tuần) |
| Xử lý vi phạm đúng hạn (GVCN) | `tapXuLyViPham` | **CÓ** | vi phạm có hạn xử lý trong kỳ |
| % công việc hoàn thành đúng hạn (gộp) | — | **CHƯA CÓ DỮ LIỆU** | việc ở Công việc là tập suy ra lúc xem, không lưu ngày xong chung. Đề xuất: không dựng số gộp; hiện 3 dòng trên (cùng đơn vị riêng) |
| Việc / bài quá hạn hiện tại | `viecHoSoGv` (`myWork`/`viecCuaNguoi`) + `noDiemCuaGv` | **CÓ** (ảnh chụp hôm nay, không theo kỳ) | việc · bài; nhãn "hiện tại" |
| Thời gian phản hồi vấn đề HV (KH.01) | `sos_cases.created_at`, `acknowledged_at` có cột | **CHƯA CÓ DỮ LIỆU** (chưa có hàm; nghĩa "phản hồi" chưa chốt) | CẦN XÁC MINH: mốc phản hồi = GV nhận Case hay nhận xét đầu tiên? |
| Phân bố theo loại việc · xu hướng theo kỳ | các tập trên theo tuần | **MỘT PHẦN** (gọi lại cùng hàm theo từng tuần; chưa có API theo kỳ) | — |

Speaking chấm chéo chưa nhận: `noDiemCuaGv` hồ sơ GV KHÔNG truyền `lopCheo` (T18) → không thành nợ cá nhân: **CÓ** (T03).

### 3.2 Giảng dạy – Học thuật (brief 13.2, TC.02, TC.03)

| Chỉ số brief | Nguồn mã | Tình trạng | Ghi chú |
|---|---|---|---|
| % đạt test định kỳ (theo kỹ năng) | `tapKetQua` → `danhGiaMon` | **MỘT PHẦN** | đơn vị = ô kỹ năng, đạt = band ≥ kỳ vọng **của từng kỹ năng**. **Chưa áp quy tắc Overall** (T06–T08): MT Overall đạt mà R thấp vẫn tính R chưa đạt. Overall đã có ở `scoring.ts` (`overall`, `overallDat`, chỉ khi đủ 4 kỹ năng) → PR số liệu V5-C cần thêm, không đổi máy SOS |
| Đạt / chưa đạt / chưa đủ dữ liệu | `danhGiaMon` trả null khi không kỳ vọng; KCK loại | **MỘT PHẦN** | "Chưa đủ Overall" chưa là nhóm riêng |
| % HV tiến bộ | `tapTienBo` (FT) | **CÓ** (FT) / lớp thường **CHƯA CÓ** | mục = ô có điểm + đã có điểm cùng kỹ năng ở MT trước; tiến bộ = band cao hơn; W1, W2 riêng |
| Case có PA · PA có kết quả | `metricSet('case-thieu-pa')`, `paCoKetQua` | **CÓ** theo chi nhánh / Case; theo GV = người phụ trách Case | mẫu số = Case, không HV |
| PA cải thiện | `tapPaHieuQua` (FT, PA GV tự thêm) | **CÓ** | PA chưa đánh giá không vào mẫu → hiện riêng |
| % đạt Target thi thật (TC.03) | `ketQuaThi.ts` (lộ trình FT có KQ thi thật + target) | **MỘT PHẦN**: có theo HV / chi nhánh; **chưa gán GV** | CẦN XÁC MINH: gán GV nào cho kết quả thi thật (GV từng kỹ năng ở tuần cuối khoá? GVCN?). Mockup ghi giả định "GV dạy kỹ năng ở lớp cuối trước thi" |
| HV cần xem sâu | `oChiSoGv(cot='ket-qua:*')` dòng chưa đạt | **CÓ** | — |

Lớp thường: kết quả theo `evaluateRegular` (tỷ lệ, ngưỡng lớp) — không có band / Overall IELTS → quy tắc Overall chỉ áp FT.

## 4. Báo cáo HV (brief 14.1) — `server/src/phanTich/baoCao.ts`

| Số | Tình trạng |
|---|---|
| Mock Đạt / Chưa đạt / Chưa đủ (`mockTrongKhoang`) | **CÓ** — đơn vị lượt |
| SOS theo lớp, SOS hiện tại (`hv-sos-hien-tai`) | **CÓ** (hiện tại ≠ trong kỳ — nhãn phải đúng) |
| Case chưa chốt PA, PA quá hạn kết quả | **CÓ** (`metricSet`) |
| Tiến bộ theo kỹ năng (HV) | **MỘT PHẦN** (Test + SOS có bảng theo đợt; chưa có tỷ lệ tiến bộ HV ở Báo cáo) |
| Thi thật đạt Target | **CÓ** ở tab Kết quả thi (theo lượt thi) — chưa có ô tổng % ở Báo cáo |
| Chấm đúng hạn | **CÓ** (`test.baiDaCham / baiTong`) — brief: thông tin phụ |

Tổng nhiều chi nhánh (T20): các hàm trả TẬP rồi đếm → tổng = Σ tử / Σ mẫu sẵn đúng; mockup thể hiện. Mẫu 0 (T19): Phân tích GV đã có "không có"; V5 đổi chữ thống nhất **"Chưa có dữ liệu"**.

## 5. Vấn đề chính → hướng V5 (ĐỀ XUẤT THIẾT KẾ)

1. Hồ sơ GV trộn hiện tại / kỳ, không hai nhóm → khuyến nghị A (2 tab) + dòng tóm tắt "đang mở" ở đầu, bộ lọc kỳ chung.
2. Phân tích GV hiện chia khung FT / thường + nhiều cột kỹ năng → V5: một bảng, nhóm cột **Hành chính | Học thuật**, bộ cột Gọn / Đầy đủ; kỹ năng chi tiết ở Đầy đủ.
3. Panel số mở từ báo cáo phải chỉ đọc (C22): bỏ khối Cần làm / nút xử lý; giữ "Xem hồ sơ".
4. Màu ngưỡng 50 / 70 % → bỏ; chỉ chữ + tử / mẫu, "Mẫu nhỏ" khi < 5.
5. "Thi thật" trong báo cáo vs "Ngày thi" (C21): chỉ đổi nhãn cột lịch; "Kết quả thi thật" giữ.

## 6. CẦN XÁC MINH (chưa có căn cứ trong mã / brief)

1. Mốc "phản hồi vấn đề HV" (KH.01): `acknowledged_at` hay nhận xét đầu tiên? Đến khi chốt: "Chưa có dữ liệu".
2. Gán kết quả thi thật cho GV nào.
3. Bỏ màu ngưỡng Q19 ở ô kết quả Phân tích GV (khuyến nghị bỏ theo brief 15).

Không hỏi: quy tắc Overall (C09, C10 đã chốt), gán theo thời gian phân công (đã có mã).
