# RÀ LUẬT · LOGIC · WORKFLOW 25/11

Giao bởi PTA Plan sau đợt 24–25/11 (khuôn A, panel 720, Chờ duyệt inline, N70, panel số Phân tích, Cuối khoá, hai cột cố định). Nối tiếp bản rà 21/11 (`docs/superpowers/specs/2026-11-21-audit-toan-bo/`). Mã: `origin/main` 8dd5b5081. **Chỉ rà + báo cáo, không sửa mã, không đổi luật.**

## 0. Tóm tắt

**Đếm: P0 0 · P1 1 · P2 14 · P3 25 (tổng 40).** Lỗi sửa thẳng: 23 (P1 1 · P2 12 · P3 10). Đề xuất cần chủ SP duyệt: 17 (P2 2 · P3 15, trong đó A-6, B-3 chỉ chỉnh chữ luật cho khớp mã).

Luồng đã chắc: không còn P0 nào. **Mọi mục P0/P1 của 21/11 đã sửa và có phép kiểm** (P0-01 quyền người giao mất vai, P1-01 TVV panel trắng, P1-02, P1-03 xoá vi phạm trả lại + Hoàn tác, P1-04 khôi phục HV gắn nhầm việc, P1-05 gửi thân thiếu phân công, P1-07, P1-08, P1-09). N70 (cấp bậc, lần đầu áp ngay, sửa lại chờ Head, rút, hạn, hết hạn tự áp theo GVCN) đúng ở máy chủ. Còn mở từ 21/11: B2-03 nửa sau (D-04), B2-10 (`lich-su:{lớp}` thanh việc hồ sơ HV — chưa kiểm lại), P1-05 cũ "ba kỳ mặc định" (D-06, đã chủ SP chốt có chủ ý).

**Cách làm và giới hạn (nói thật):**
- 5 nhóm đọc mã song song theo luồng (A chấm điểm / thi thật / Cuối khoá · B Case, Ý thức, Tutor · C Chờ duyệt + giao việc · D số liệu cùng nguồn + tốc độ · E quyền, đường lui, người nghỉ). Mỗi mục có file:dòng. PTA rà lại bằng mã: A-2, B-1, D-01 (gốc lỗi đúng như mô tả); các mục còn lại ghi "đọc mã".
- **Không chạy máy chủ demo, không chạy `npm run check`, không đo lại số câu SQL**: mọi mục "đã kiểm" ở đây là đọc mã + đối chiếu phép kiểm có sẵn, chưa bấm thử. Mục nào cần bấm thử ghi "chưa kiểm". Check xanh 6130 / 6130 trên main là của PTA Plan 25/11, không chạy lại.
- (g) N+1: không thấy N+1 mới trên đường ĐỌC đụng từ 21/11 (Công việc, Phân tích, Tổng quan, Chờ duyệt, hồ sơ GV); N70 và Đang theo dõi đã có trần ở `tocDoDuong.ts`. Chỉ N+1 nhẹ ở đường GHI hiếm (D-08).
- (a) Luật không có phép kiểm gắn nhãn N-số: N9, N16, N25, N27, N53 (A-7); N60 chỉ ép ở web.
- Ngày demo là thứ Hai: khoá cuối tuần N15, hạn N20 T6–CN chỉ đọc mã.
- Không đọc mã từng nhánh: N8 ①–⑤, N33, N36, N24 ① (chỉ xác nhận có phép kiểm theo tên luật); `/attachments/*`, `/cases/backfill`, `/dich`, `/xuat-mt` (E).
- Tên người: báo cáo gọi theo vai + vị trí, không dùng tên thật.

## 1. Top 10

| # | Mã | Mức | Một dòng |
|---|---|---|---|
| 1 | D-01 | P1 | Tổng quan / Phân tích / hồ sơ GV vẫn đếm Case mở + chưa có PA của em đã có KQ thi thật (N46), Công việc thì ẩn: số trên ô ≠ số việc thật |
| 2 | B-1 | P2 | Hoàn tác "Chuyển lớp ngay hôm nay" không trả việc Phối hợp SOS đã bị đóng: mất việc, không có nút mở lại |
| 3 | A-2 | P2 | Hồ sơ lớp › Lịch thi › "Test sắp tới" còn hiện MT3… của em đã thi thật (thiếu `LUOT_CON_KE_HOACH_SQL`) |
| 4 | E-3 | P2 | Gỡ hết vai không kết thúc phân công lớp: người nghỉ vẫn là GV môn / GVCN, Case mới vẫn gán họ |
| 5 | E-2 | P2 | N69 thiếu bậc "Head chi nhánh"; không ai hợp lệ thì Case / PA vẫn đứng tên người nghỉ |
| 6 | E-6 | P2 | Modal đóng ngay khi bấm nền / Esc: mất chữ ở S Ex, Khôi phục KQ MT, Tạm dừng / Kết thúc học |
| 7 | C-1 · C-2 | P2 | PanelMeeting và Chờ duyệt inline mất chữ đang gõ (đóng panel, đổi chip lọc) — cùng loại lỗi B3-05 đã sửa ở nơi khác |
| 8 | C-3 | P2 | Thẻ "Sửa cấp bậc" (N70) không có nút Rút trên thẻ cho GVCN gửi (chỉ rút trong panel Khai bậc) |
| 9 | A-1 | P2 | Xuất Excel kết quả Test / Kế hoạch Test ghi band số nguyên "7", không "7.0" (N53) |
| 10 | E-1 · E-5 | P2 | Head thấy nút "Xoá tutor" mà máy chủ 403; xem trước Xoá tài khoản nói sai (đổi người "sau khi xoá" trong khi máy đã tự chuyển) |

Ghi chú mức: không mục nào mất dữ liệu hoặc sai quyền nghiêm trọng (P0). P1 duy nhất là số liệu lệch giữa hai nơi (luật CLAUDE.md "cùng số liệu cùng nguồn").

## 2. Lỗi — sửa thẳng (sắp theo mức)
Mẫu mỗi mục: Loại · Trạng thái (đã kiểm = đọc mã, chưa chạy) · Mức · Luật · Kịch bản · Kỳ vọng / Thực tế · Sửa gợi ý · Tệp.

### D-01 · "Case đang mở / chưa có PA" ở Tổng quan, Phân tích, hồ sơ GV không áp N46 (em đã có KQ thi thật) — Công việc thì ẩn
- Loại: LỖI · Trạng thái: đã kiểm (đọc mã; chưa chạy dữ liệu) · Mức: P1
- Luật: N46 (ẩn việc Case / PA của lộ trình FT đã có KQ thi thật; "MỘT điều kiện cho Công việc, hồ sơ HV, Tổng quan — cùng câu", `tamDung.ts:44-52`); CLAUDE.md "việc đã xong không được nơi nào còn báo chờ".
- Kịch bản: em FT đã nhập đủ 4 kỹ năng thi thật, bước tiếp chưa chọn hoặc đã chọn Lộ trình mới (status em vẫn `active`), Case học thuật cũ vẫn mở và chưa có PA. QL mở Tổng quan thấy "Case chưa có PA" = n, bấm ô → panel có Case này; sang Công việc không có dòng "Thêm PA / Mô tả Case" nào cho nó. Hồ sơ GV phụ trách cũng đếm Case đó vào "Case đang phụ trách / chưa có PA".
- Kỳ vọng: cùng điều kiện N46 ở mọi nơi. Công việc đã ẩn (`mywork.ts:517,555-556` đặt `la_no_plan/la_cause/chua_co_nguoi = 0`; `owner.ts:183`; `metrics.ts:715` PA cần cập nhật; `mywork.ts:1701`; `viecHocVien.ts:109`). · Thực tế: `metricSet('case-mo')` = `listCases(...).state != 'done'` (`metrics.ts:926-928`); `case-cho-xac-dinh-nguyen-nhan` = `xuLyCaseMany` (`metrics.ts:957-962`, `sosState.ts:213-223` không đọc `sau_thi`); `tapCaseQl` chỉ loại em không `HV_DANG_HOC` (`bangChiNhanh.ts:192-201`); Phân tích gọi cùng hàm (`baoCao.ts:296-300`); hồ sơ GV dùng `listCases` (`hoSo.ts:119-121,237`). Không nhánh đếm nào gọi `CASE_SAU_THI_SQL`. Với Lộ trình mới, Case cũ không đóng (N46) nên số "ma" này tồn tại lâu.
- Sửa gợi ý: thêm lọc `!sau_thi` vào `tapCaseQl` (nơi chung của Tổng quan + Phân tích; chọn thêm `${CASE_SAU_THI_SQL('sc','s.id')}` vào câu `sos_cases JOIN students` đã có, +0 câu) và `caseMoCuaGv` (hồ sơ GV) — đúng "như em Tạm dừng" của N46. Nếu chủ SP muốn Case vẫn "đang mở" ở báo cáo thì đó là ĐỀ XUẤT đổi luật; hiện luật nói ẩn.
- Tệp: `server/src/worklist/bangChiNhanh.ts:192-201`, `server/src/worklist/metrics.ts:926-962`, `server/src/giaoVien/hoSo.ts:119-121,237,345-350`, `server/src/phanTich/baoCao.ts:296-300`; đối chiếu `server/src/worklist/mywork.ts:517,555`, `server/src/cases/owner.ts:183`.

### A-1 · Xuất Excel kết quả Test ghi band số nguyên là "7", không "7.0" (N53)
- Loại: LỖI · Trạng thái: đã kiểm (đọc mã) · Mức: P2
- Luật: N53 "mọi chỗ hiện điểm band / Target / Overall / KQ thi LUÔN một chữ số thập phân — web, PDF, xuất file"
- Kịch bản: 1) QL vào Test › Xuất kết quả Test (FT, cột đủ) 2) HV có L = 7, Overall = 6.0, Target = 7 3) mở tệp .xlsx.
- Kỳ vọng: ô hiện 7.0 / 6.0 · Thực tế: máy chủ trả ô là số thô (`d.l, d.r, d.w, d.s, d.overall, d.target, d.kyVong, d.w1, d.w2`), web dựng bằng `XLSX.utils.aoa_to_sheet` kiểu General, không đặt định dạng ô, nên số nguyên hiện "7", "6". Không tìm thấy `numFmt` hay `.z = '0.0'` ở web; `dang: 'band'` của `shared/xlsxDep.ts` không nơi nào dùng (chỉ phục vụ báo cáo kiểu khác). Cùng cách ở `taiXlsx.ts` (Kế hoạch Test) và `phanTich/xuatMock.ts`. Phép kiểm N53 chỉ phủ chuỗi chữ (`prDh`, `prHk2`, `prMtb`), không phủ tệp.
- Sửa gợi ý: sau `aoa_to_sheet`, quét cột có tiêu đề band (L, R, W, S, W1, W2, Overall, Target, Kỳ vọng) đặt `cell.t='n'; cell.z='0.0'` — giữ là số để lọc / sắp xếp; một hàm dùng chung cho 3 nơi xuất. Không đổi sang chuỗi vì mất sắp xếp.
- Tệp: web/src/modules/test/NganXuatMt.tsx:131-141 · web/src/modules/test/keHoach/taiXlsx.ts:10-18 · web/src/modules/phanTich/xuatMock.ts:20-22 · shared/domain/xuatMt.ts:191 · server/src/phanTich/xuatMt.ts:116-123

### A-2 · Hồ sơ lớp › Lịch thi thật: ô "Test sắp tới" vẫn hiện MT chưa làm của em đã thi thật
- Loại: LỖI · Trạng thái: đã kiểm (đọc mã) · Mức: P2
- Luật: "Thi thật là kết thúc" (PTA 28/10) + N46: MT chưa làm của lộ trình đã có KQ thi thật không còn là kế hoạch; một điều kiện dùng chung `LUOT_CON_KE_HOACH_SQL` / `LUOT_HIEN_TAI_SQL` (`students/tamDung.ts:63-65`) cho mọi danh sách.
- Kịch bản: 1) HV FT đã có KQ thi thật đủ 4 kỹ năng, chưa chọn Bước tiếp (hoặc đã chọn Lộ trình mới / Tạm dừng), lộ trình còn lượt `planned` (MT3 tuần sau) 2) mở Học viên & Lớp › Lịch thi › mở hàng em đó.
- Kỳ vọng: không có "Test sắp tới" (như Kế hoạch Test, Công việc, hồ sơ HV `students.ts:88`, bàn giao `banGiao.ts:155` đều đã lọc) · Thực tế: `sapToi` lấy mọi lượt `status='planned'` của lộ trình có tuần ≥ thứ Hai tuần này, không lọc `LUOT_CON_KE_HOACH_SQL`; khối ghi "MT3 · W…" cho em đã xong kỳ thi. Cùng một em: nơi này nói còn MT, nơi khác không.
- Sửa gợi ý: thêm `AND ${LUOT_CON_KE_HOACH_SQL('a')}` vào câu `sapToi` (một điều kiện, không thêm câu).
- Tệp: server/src/classes/lichThi.ts:260-267 (nguồn đúng: server/src/students/tamDung.ts:63-65)

### B-1 · Hoàn tác "Chuyển lớp ngay hôm nay" không trả lại việc Phối hợp SOS đã bị đóng
- Loại: LỖI · Trạng thái: đã kiểm (đọc mã) · Mức: P2
- Luật: N24 ③ (Q-RL3: Lộ trình mới đóng Phối hợp SOS chờ, lý do "Kết thúc lộ trình") + N24 ② / luật "không khoá cứng: Hoàn tác trả như cũ" + CLAUDE.md (thao tác có Hoàn tác)
- Kịch bản: 1) Em lớp thường đã thi xong (`sauThi`), có một việc Phối hợp SOS đang chờ (vd Báo PH kết quả Test) · 2) Head chuyển em sang lớp khác, chọn "Ngay hôm nay" · 3) `luatLoTrinh.ts` đóng Case "Kết thúc lộ trình" và đổi việc Phối hợp `pending → removed` · 4) Head bấm Hoàn tác (hoanTacChuyenNgay).
- Kỳ vọng: em về y như trước, việc Phối hợp SOS chờ trở lại · Thực tế: Case / PA / tín hiệu được khôi phục (nằm trong danh sách chụp), nhưng `sos_coordination_actions` KHÔNG có trong `dongDaoChuyenNgay` nên việc Phối hợp vẫn `removed` ("Kết thúc lộ trình") — mất việc, không còn nút nào mở lại (khôi phục tay chỉ có cho việc người dùng bỏ). Đường "Lộ trình mới" ở `buocTiep.ts:412 / 343` thì ĐÃ lưu `dongPhoiHop` để Hoàn tác — chỉ đường chuyển lớp bị sót. Không có phép kiểm phủ: `system_ket_thuc_lo_trinh` chỉ xuất hiện ở `prRaLuong.tests.ts`, `sosV3.tests.ts`, không ở phép kiểm Hoàn tác chuyển ngày.
- Sửa gợi ý: thêm `{ bang: 'sos_coordination_actions', dk: 'student_id IN (…)', k: 'ca' }` vào `dongDaoChuyenNgay` (một dòng) + một phép kiểm seed: em sau thi có Phối hợp pending → chuyển ngay → Hoàn tác → so DB trước / sau.
- Tệp: `server/src/classes/luatLoTrinh.ts:484-488` · `server/src/classes/hoanTacChuyenNgay.ts:34-64` · `server/src/cases/systemClose.ts:56-72` · so sánh `server/src/loTrinh/buocTiep.ts:412-413,343`

### C-1 · PanelMeeting: gõ Kết quả / ngày giờ họp rồi Đóng panel thì mất chữ, không hỏi
- Loại: LỖI · Trạng thái: đã kiểm (đọc mã) · Mức: P2
- Luật: CLAUDE.md "không mất chữ đang gõ"; N58 / N67 (Kết quả meeting, Xếp lịch họp); cùng loại lỗi B3-05 đã sửa ở `KhoiGiaoViec`
- Kịch bản: 1) CX (hoặc TVV nhập hộ) mở dòng Kết quả meeting. 2) Gõ vài câu vào ô "Kết quả". 3) Bấm ✕ / Esc / "Đóng" ở chân panel (hoặc đổi sang việc khác).
- Kỳ vọng: hộp "Bỏ chữ đang gõ?" như mọi form khác. Thực tế: panel đóng, chữ mất. `PhanMeeting` giữ `kq` / `ngay` / `gio` trong state riêng, không gọi `useBaoDangSua`, và `KhungPanel` của `PanelMeeting` không truyền `chan.daSua`. Vì "Hoàn thành" không bắt buộc nhập nên người dùng dễ nghĩ đóng là được.
- Sửa gợi ý: trong `PhanMeeting` thêm `useBaoDangSua(mo && (kq.trim() !== (m.ketQua ?? '').trim() || ngay !== (m.ngayGio?.slice(0,10) ?? '') || gio !== (m.ngayGio?.slice(11,16) ?? '')))`, một dòng giống `KhoiGiaoViec.tsx:213`.
- Tệp: web/src/modules/congViec/PanelMeeting.tsx:97-110 (state), :123-131 (lưu); so với KhoiGiaoViec.tsx:213

### C-2 · Chờ bạn duyệt (mở tại dòng): đổi bộ lọc xoá dòng đang mở, ô lý do đang gõ và lý do Từ chối nhiều, không hỏi
- Loại: LỖI · Trạng thái: đã kiểm (đọc mã; chưa kiểm xem `BaoSuaPanel` có bao quanh tab này không) · Mức: P2
- Luật: CLAUDE.md "không mất chữ đang gõ"; chính mã ghi ý đồ "khoá nút, không gập, không mất chữ đang gõ" (`HopChoDuyet.tsx:121-123`)
- Kịch bản: 1) Head mở dòng Đề xuất, bấm "Từ chối…", gõ lý do dài. 2) Bấm chip lọc ("Ý thức", "Báo Head"…) hoặc chọn Lớp ▾ / đổi chi nhánh. 3) `url` đổi.
- Kỳ vọng: chữ giữ hoặc có hộp hỏi. Thực tế: `useEffect(() => { setMo(new Set()); setLenh(null); }, [url])` gập mọi dòng kể cả dòng có `dangO`; `setChon(new Set())` ở `[url]` làm `chon.size = 0` nên `lyDoTc` (lý do Từ chối cho cả lô) cũng bị `setLyDoTc(null)`. Bảo vệ `dangO` chỉ chặn việc bấm lại chính dòng đó (`bamDong`). `useBaoDangSua` ở `TheYeuCau.tsx:78` chỉ có tác dụng nếu có `KhungPanel` bao quanh; chế độ `dong` không có panel (chưa kiểm).
- Sửa gợi ý: khi `dangO.size > 0` hoặc `lyDoTc?.trim()` thì chip lọc đổi `url` phải hỏi một câu ("Bỏ lý do đang gõ?") hoặc giữ `mo` của dòng còn trong danh sách mới.
- Tệp: web/src/modules/duyet/HopChoDuyet.tsx:113-114, :129, :152-156 (`bamDong`); TheYeuCau.tsx:78

### C-3 · Thẻ "Sửa cấp bậc vi phạm" (N70): người gửi không có nút Rút trên thẻ, chỉ rút được trong panel Khai / sửa cấp bậc
- Loại: LỖI · Trạng thái: đã kiểm (đọc mã) · Mức: P2
- Luật: N70 ③ "trong lúc chờ bậc cũ giữ, GVCN rút được"; CLAUDE.md "mọi thao tác có đường lui, đặt nơi người dùng nhìn thấy"
- Kịch bản: 1) GVCN sửa bậc đã khai nên thẻ vào Chờ duyệt. 2) GVCN vào "Yêu cầu của tôi" / hồ sơ GV thấy thẻ, muốn rút.
- Kỳ vọng: nút Rút trên thẻ như thẻ Ý thức (`y_thuc`). Thực tế: `LOAI_NGUOI_XIN_SUA` không có `sua_khai_bac` nên `nguoiGuiSua` = false, thẻ không có Rút. Máy chủ cho rút (`khiRut` `loaiYeuCau.ts:1016`, `yeuCau.ts:609`). Nút Rút chỉ ở `KhaiBacPanel.tsx`, phải nhớ vào hồ sơ HV › Ý thức.
- Sửa gợi ý: dùng cờ "chỉ Rút" như `chiRut` của `xin_xoa` (`TheYeuCau.tsx:106`): thêm `|| yc.loai === 'sua_khai_bac'`, không đưa vào `LOAI_NGUOI_XIN_SUA` (loại này không có `khiSua`). Giữ nguyên: chỉ NGƯỜI GỬI (`nguoiXinId`) thấy nút (máy chủ `theCuaNguoiGui` đòi đúng người gửi).
- Tệp: shared/domain/yeuCauDuyet.ts:29 · web/src/modules/duyet/TheYeuCau.tsx:104-106,346 · server/src/duyet/yeuCau.ts:609

### D-02 · `case-xac-dinh-nguyen-nhan-qua-han` không lọc HV đang học / N46 trong khi "Case chưa chốt PA" có lọc
- Loại: LỖI · Trạng thái: đã kiểm (chỉ thấy tính ở server, chưa thấy web hiển thị) · Mức: P2
- Luật: N46, Tạm dừng; "cùng số cùng hàm".
- Kịch bản: em Tạm dừng (hoặc đã thi thật) có Case chờ chốt PA quá hạn. "Chưa chốt" (qua `tapCaseQl`) không đếm em đó, "quá hạn" (tập con của chưa chốt) có đếm → quá hạn có thể lớn hơn chưa chốt.
- Kỳ vọng: quá hạn ⊆ chưa chốt, cùng lọc · Thực tế: `metrics.ts:937-944` dùng `openCases()` + `choDuyetCaseIds(.., true)`, không qua `tapCaseQl`; dùng ở `baoCao.ts:320` (`casePa.quaHanChotPa`) và `tongQuan.ts:191,210` (`canQuyet.caseQuaHan`, `khungKhac.n`). Web hiện không đọc `quaHanChotPa` / `canQuyet` (grep `web/src` không thấy), nên lệch chưa lên màn, nhưng `metricSet` còn là nguồn drill-down `/metrics/case-xac-dinh-nguyen-nhan-qua-han` và dòng "Cần xử lý" (`shared/domain/tongQuan.ts:291`).
- Sửa gợi ý: cho chỉ số này đi qua cùng bộ lọc `tapCaseQl` (cùng sửa D-01); hoặc gỡ phần chết nếu web không dùng (D-03).
- Tệp: `server/src/worklist/metrics.ts:937-944`, `server/src/worklist/tongQuan.ts:191-211`, `server/src/phanTich/baoCao.ts:320`.

### E-1 · Head thấy nút "Xoá tutor" nhưng máy chủ trả 403
- Loại: LỖI · Trạng thái: đã kiểm · Mức: P2
- Luật: N54 (Head thêm / sửa tutor chi nhánh mình; nhận xét + kết luận + xoá là Head tutor + Quản trị) · CLAUDE.md "giao diện theo vai đi cùng quyền máy chủ"
- Kịch bản: 1) Head một chi nhánh mở Tutor › một tutor của chi nhánh mình (không phải dòng GV, chưa có buổi) › Sửa. 2) Footer hộp "Sửa tutor" có nút "Xoá tutor". 3) Bấm › xác nhận.
- Kỳ vọng: Head không thấy nút (hoặc có quyền xoá). · Thực tế: `DELETE /tutors/:id` → `xoaTutor` gọi `canSua` (cần `tutor.manage`, Head chỉ có `tutor.view`) → 403 "Bạn không có quyền sửa danh sách tutor." Hộp giữ nguyên chữ, báo lỗi trong hộp — nhưng người dùng đã qua hộp xác nhận danh sách. Phép kiểm `prTutor5.tests.ts:77` khẳng định Head 403 → máy chủ đúng ý đồ, web sai.
- Sửa gợi ý: `HopTutor` nhận thêm prop `coXoa` = `data.coSua` (DTO `/tutors` đã có `coSua`, `trang.ts:260`); ẩn "Xoá tutor" khi false. Một dòng ở `PanelTutor.tsx:255` + `TutorPage.tsx:281`. Hoặc (cần chủ SP duyệt) cho Head xoá tutor chi nhánh mình bằng `suaDuocTutor` — Thùng rác đã có Hoàn tác.
- Tệp: `web/src/modules/tutor/HopTutor.tsx:74`, `web/src/modules/tutor/PanelTutor.tsx:255`, `server/src/tutors/trang.ts:43-46,345-346`

### E-2 · N69 thiếu bậc "Head chi nhánh"; không ai hợp lệ thì Case vẫn đứng tên người nghỉ
- Loại: LỖI · Trạng thái: đã kiểm · Mức: P2
- Luật: N69 "GV môn hiện tại + kỹ năng → GVCN → **Head chi nhánh**; không ai hợp lệ thì về 'chưa có người' (như R1)"
- Kịch bản: 1) GV nghỉ là người DUY NHẤT dạy + GVCN một lớp (hoặc em đã hết lớp đang học). 2) Quản trị xoá tài khoản / gỡ hết vai. 3) Case, PA, tín hiệu, lần xử lý của em đứng tên người đó.
- Kỳ vọng: về Head chi nhánh (rồi "chưa có người"). · Thực tế: `chuyenViecNguoiNghi` chỉ gọi `chonChuCase(phanCongLop…)` (GV môn → GVCN); `moi === null` → `continue`, dòng GIỮ owner là người đã xoá / hết vai. Lần xử lý chỉ thử GVCN. Không có bậc Head, không có bước đặt NULL. Phép kiểm `prGiaoViec.tests.ts:724+` chỉ phủ trường hợp "có người thay"; "em không đang học → để nguyên" được khẳng định như ý đồ (trái N69).
- Sửa gợi ý: sau `theoLuat` thất bại → tìm một Head (`manager`) hoạt động ở chi nhánh của em (một câu, cùng hàm `HOAT_DONG_O`), không có thì đặt `owner_user_id = NULL` (Công việc QL đã hiện "Phân công GV {môn}" cho Case chưa chủ — `owner.ts:70`). Thêm phép kiểm "lớp một GV nghỉ".
- Tệp: `server/src/cases/owner.ts:464-468,489-491,496-497`

### E-3 · Gỡ hết vai không kết thúc phân công lớp (khác Xoá tài khoản) — người nghỉ còn là GV môn / GVCN
- Loại: LỖI (lệch hai đường cùng "người nghỉ") · Trạng thái: đã kiểm · Mức: P2
- Luật: N69 "người nghỉ còn đứng tên" · N29
- Kịch bản: 1) GV đang dạy lớp A (phân công `active`). 2) Quản trị sửa vai → bỏ hết vai. 3) `setRoles` đóng `user_roles` nhưng KHÔNG đóng `teacher_assignments`. 4) Em của lớp A có Case mới → `ganChuCaseThieu` / `chonChuCase` đọc `teacher_assignments` (không nối `user_roles`) → chọn lại đúng người đã hết vai. Người đó không có `grants` nên không mở được Case.
- Kỳ vọng: giống xoá tài khoản — kết thúc phân công (`xoaTaiKhoan.ts:261`) hoặc ít nhất bỏ qua người không còn vai khi chọn chủ Case. · Thực tế: chỉ `xoaTaiKhoan.ts:258-262` đóng vai + phân công; `accounts.ts:416-427` chỉ đóng vai, chuyển việc. Danh sách tài khoản còn tính người đó "đang dạy" (`accounts.ts:687`).
- Sửa gợi ý: trong nhánh `roles.length === 0` của `setRoles`, đóng phân công như xoá tài khoản (có `ghi_dao` / nhật ký để Hoàn tác) hoặc cảnh báo "Còn dạy lớp …" trước khi lưu. Cần chủ SP chốt nếu muốn giữ phân công khi gỡ vai (QL không vai GV vẫn được phân công — `accounts.ts:686` ghi chú).
- Tệp: `server/src/platform/accounts.ts:417-421`, `server/src/platform/xoaTaiKhoan.ts:258-264`, `server/src/cases/owner.ts:47-56`

### E-5 · Xem trước Xoá tài khoản nói sai: bảo đổi người phụ trách "sau khi xoá" trong khi máy đã tự chuyển; web không được báo số đã chuyển
- Loại: LỖI (chữ + thông tin hậu quả) · Trạng thái: đã kiểm · Mức: P2
- Luật: N69 "cùng giao dịch, có lịch sử" · CLAUDE.md "xác nhận chỉ khi hậu quả lớn (nêu đúng đối tượng bị ảnh hưởng)"
- Kịch bản: 1) Quản trị mở ⋯ › Xoá tài khoản của GV có 6 Case. 2) Cảnh báo: "Còn 6 Case/việc đang giao cho người này — đổi người phụ trách sau khi xoá." 3) Sau khi xoá, máy tự chuyển (N69) nên không còn gì phải đổi; Quản trị không biết Case đi đâu. `setRoles` / `xoaTaiKhoan` trả `{ ok }` (số `chuyen` chỉ nằm trong nhật ký).
- Kỳ vọng: cảnh báo "Case / PA … sẽ tự chuyển cho GV môn → GVCN → Head; lớp không có ai thì còn trống" + sau lưu, toast "Đã chuyển n Case · m PA" (và với E-2: "k việc chưa có người"). · Thực tế: câu cũ.
- Sửa gợi ý: sửa `canhBao` (`xoaTaiKhoan.ts:215`) đếm theo luật mới; trả `chuyen` trong kết quả `setRoles` / `xoaTaiKhoan` rồi web đưa vào toast.
- Tệp: `server/src/platform/xoaTaiKhoan.ts:208-215,264-271`, `server/src/platform/accounts.ts:421-428`

### E-6 · Hộp (Modal) đóng ngay khi bấm nền / Esc / ✕ — mất chữ đang gõ ở S Ex, Khôi phục kết quả MT, Tạm dừng / Thôi học
- Loại: LỖI · Trạng thái: đã kiểm (mã) · Mức: P2
- Luật: CLAUDE.md "không mất chữ đang gõ"; N56 giảm bước (nhưng không bỏ bảo vệ chữ)
- Kịch bản: 1) GV / Head mở hộp "+ S Ex" (Nhận xét tối đa dài) hoặc "Khôi phục kết quả" (lý do 300 ký tự) hoặc "Tạm dừng / Thôi học" (lý do 2000 ký tự). 2) Gõ 3–4 dòng. 3) Bấm lỡ vùng tối ngoài hộp hoặc Esc.
- Kỳ vọng: hộp "Bỏ chữ đang gõ? · Ở lại" như panel (`KhungPanel`). · Thực tế: `Modal` gọi `onClose` thẳng (`ui/Drawer.tsx:12-16,31`); ba hộp truyền `onClose={onDong}`; không dùng `useBaoDangSua` / `HopBoChu`. Panel có sẵn cơ chế (`KhungPanel.tsx:88,291-310`), hộp nhỏ thì không.
- Sửa gợi ý: cho `Modal` thêm prop `daSua` → nền / Esc / ✕ mở `HopBoChu` (đã có ở `Drawer.tsx:49`; `ConfirmDialog` đã có `daSua`); ba hộp truyền `daSua = chữ ≠ giá trị đầu`. Một chỗ sửa, nhiều hộp hưởng.
- Tệp: `web/src/ui/Drawer.tsx:5-37`, `web/src/modules/test/keHoach/HopSEx.tsx:70,96`, `web/src/modules/test/keHoach/HopKhoiPhucKetQua.tsx:42,96`, `web/src/modules/students/HopTamDungKetThuc.tsx:128,155`

### A-3 · Hành trình "Kết quả thi thật" của Khôi phục ghi điểm số thô ("L 7 · OVR 6")
- Loại: LỖI · Trạng thái: đã kiểm (đọc mã) · Mức: P3
- Luật: N53 (một hàm `fmtBand`)
- Kịch bản: TVV Khôi phục bản trước của KQ thi thật; HV có L = 7, OVR = 6.0 → dòng Hành trình "L 7 · R 6.5 · … · OVR 6" (đường lưu thường `datKetQuaThiThat` dùng `fmtBand` đúng: `thiThat.ts:133`).
- Kỳ vọng: "L 7.0 … OVR 6.0" · Thực tế: `tom()` ở nhánh khôi phục nối `thi_that_l ?? '—'` và `outcome_score` trực tiếp, không `fmtBand`.
- Sửa gợi ý: dùng lại hàm `tom` của `datKetQuaThiThat` (đưa ra ngoài hàm, một chỗ).
- Tệp: server/src/loTrinh/thiThat.ts:220 (đối chiếu :133)

### A-4 · Nhãn đọc màn (aria-label) ô điểm thi thật ở hồ sơ HV ghi "S 7", không có ".0"
- Loại: LỖI · Trạng thái: đã kiểm (đọc mã) · Mức: P3
- Luật: N53
- Kịch bản: hồ sơ HV có KQ thi thật S = 7; ô điểm bấm mở "Tuần dạy" có `aria-label="S 7 — {tên}"`.
- Kỳ vọng: "S 7.0" (như Tổng kết lớp `TabTongKetLop.tsx:125` dùng `b1()`) · Thực tế: `nhan` ghép `thiKq.diem[k]` không qua `fmtBand`.
- Sửa gợi ý: `fmtBand(thiKq.diem[k])`.
- Tệp: web/src/modules/students/StudentDetailPage.tsx:674

### A-5 · Mô tả quyền "student.edit_more" còn chữ "Thôi học" (N11: MỘT tên "Tạm dừng / Kết thúc học")
- Loại: LỖI (chữ) · Trạng thái: đã kiểm mã; chưa kiểm màn Quản trị có hiện `moTa` hay không · Mức: P3
- Luật: N11; một khái niệm một tên
- Thực tế: `moTa` ghi "Tạm dừng / Quay lại học / Thôi học; nhập kết quả thi thật…". Các chú thích mã cũng còn "Thôi học" (`StudentManagePanel.tsx:124`, `DanhSachHvLop.tsx:56`) nhưng chú thích không lên màn.
- Sửa gợi ý: đổi `moTa` thành "Tạm dừng / Kết thúc học · Quay lại học".
- Tệp: shared/domain/nhomQuyen.ts:62

### B-2 · Lý do "Sửa cấp bậc" (N70) chỉ cần khác rỗng, không theo ngưỡng 8 ký tự của N50 (6)
- Loại: LỖI (nhẹ; có thể là chủ ý — cần PTA chốt) · Trạng thái: đã kiểm · Mức: P3
- Luật: N50 (6) "mọi ô lý do / nhận xét BẮT BUỘC một ngưỡng 8 ký tự" · N70 ③ (GVCN sửa bậc đã khai: lý do = ghi chú, bắt buộc)
- Kịch bản: GVCN sửa bậc đã khai, gõ "ok" ở ô Lý do sửa → gửi Head duyệt.
- Kỳ vọng: 400 "ít nhất 8 ký tự" như mọi lý do khác (Trả lại, Không xử lý, Thu hồi) · Thực tế: `guiSuaKhai` chỉ kiểm `!k.ghiChu`; web đặt `toiThieu: 1` ở cả panel một em và panel lô. Head đọc "ok" để quyết định áp bậc.
- Sửa gợi ý: dùng `CHU_TOI_THIEU` ở `guiSuaKhai` (chỉ đường GVCN gửi duyệt, giữ ghi chú tuỳ chọn cho khai lần đầu và Head tự sửa) + `toiThieu` tương ứng ở hai panel. Nếu chủ SP muốn giữ "1 ký tự" thì ghi ngoại lệ vào N50 / N70.
- Tệp: `server/src/yThuc/xuLy.ts:290` · `web/src/modules/yThuc/KhaiBacPanel.tsx:90` · `web/src/modules/yThuc/KhaiBacLoPanel.tsx:92`

### B-5 · Hoàn tác "Gộp tên tutor" dùng được nhiều lần, có thể đảo nhầm lần gộp mới hơn
- Loại: LỖI (hiếm) · Trạng thái: đã kiểm (đọc mã), chưa thử UI · Mức: P3
- Luật: N54 (Head gộp tên gõ tay) · luật "không khoá cứng, Hoàn tác trả như cũ" (không đảo thứ không thuộc lần đó)
- Kịch bản: 1) Head gộp tên X → tutor T1 (nhật ký A) · 2) Hoàn tác A (dòng về NULL) · 3) Head gộp lại X → T1 (nhật ký B, cùng các dòng buổi) · 4) gọi lại Hoàn tác với nhật ký A (toast cũ / gọi API).
- Kỳ vọng: 400 "lần gộp này đã hoàn tác" · Thực tế: `hoanTacGop` không đánh dấu nhật ký A đã dùng; câu `UPDATE … SET tutor_id = NULL WHERE tutor_id = T1 AND id IN (…)` khớp các dòng của lần B → lần gộp B bị đảo. Chỉ người gộp bấm được (`actor_user_id`), nên rủi ro thấp.
- Sửa gợi ý: kiểm đã có dòng nhật ký `tutor.gop_hoan_tac` với `entityId = nhatKyId` trước khi chạy (một câu), hoặc ghi dấu "đã đảo" vào nhật ký A.
- Tệp: `server/src/tutors/trang.ts:513-540`

### B-6 · Việc Báo PH "bỏ" rồi ghi lại không xoá dấu "bỏ" (bo_ly_do / bo_luc)
- Loại: LỖI (nhẹ) · Trạng thái: chưa kiểm nơi hiển thị (chỉ đọc mã) · Mức: P3
- Luật: N24 ② / số liệu không lệch (một việc không vừa "xong" vừa mang lý do bỏ)
- Kịch bản: việc Báo PH ở trạng thái `bo` (bỏ tay) · TVV ghi lại lần liên hệ "Đã báo PH" (RKC-3a cho ghi trên việc đã bỏ) · `UPDATE viec_bao_ph SET trang_thai = 'xong'` nhưng giữ `bo_ly_do`, `bo_boi`, `bo_luc`.
- Kỳ vọng: sạch dấu bỏ khi việc mở lại / xong · Thực tế: dòng vừa `xong` vừa có lý do bỏ; `khoiPhucViecBaoPh` đã chặn theo trạng thái nên không ra lỗi, nhưng báo cáo / xuất đọc cột `bo_*` có thể hiện sai. Chưa kiểm nơi đọc cột này.
- Sửa gợi ý: ở `ghiKetQuaBaoPh`, khi việc đang `bo` thì đặt `bo_ly_do = bo_ly_do_chu = bo_boi = bo_luc = NULL` cùng câu UPDATE trạng thái.
- Tệp: `server/src/yThuc/baoPhTvv.ts:347` (UPDATE trạng thái), `:371-399` (bỏ)

---

### C-5 · Nhóm Vận hành khởi đầu: mã cho Head / CX "toàn hệ thống" sửa được, N63 ⑧ nói chỉ Quản trị
- Loại: LỖI (mã rộng hơn luật chữ) · Trạng thái: đã kiểm (đọc mã; giả định grant không chi nhánh phủ ctx `{ branchId: null }`) · Mức: P3
- Luật: N63 ⑧ "4 nhóm Vận hành khởi đầu chỉ Quản trị sửa"; web `NhomViec.tsx:144` ghi "dùng chung · Quản trị sửa" khi `!coTheSua`
- Kịch bản: Head (hoặc CX) có grant không chi nhánh mở hộp "Nhóm…" rồi đổi tên / ẩn / sắp "Giáo trình", "Giáo viên".
- Kỳ vọng: 403, nút ẩn. Thực tế: `suaNhom` và `nhomRa.coTheSua` dùng `quanLyVanHanh(p, { branchId: null })`, chỉ chặn Head một chi nhánh (phép kiểm `prVanHanh.tests.ts:61` chỉ ca này). Không có kiểm `khoa != null` để đòi Quản trị.
- Sửa gợi ý: nhóm có `khoa` (4 nhóm khởi đầu) đòi `can(p, ADMIN_CONFIG, { anyScope: true })`; nhóm dùng chung do Quản trị tạo (không `khoa`) giữ luật hiện tại. Nếu chủ SP muốn Head toàn hệ thống cũng sửa thì sửa chữ N63 ⑧ cho khớp mã.
- Tệp: server/src/worklist/mgmttasks.ts:122-127, :169-175 · web/src/modules/worklist/NhomViec.tsx:144

### C-6 · Từ chối / Duyệt nhiều: mạng đứt giữa chừng, danh sách chọn còn id ma
- Loại: LỖI · Trạng thái: đã kiểm (đọc mã) · Mức: P3
- Luật: CLAUDE.md "không báo xong khi chưa lưu; bị chặn nói lý do + bước tiếp"
- Kịch bản: Head chọn 12 thẻ cùng loại, Từ chối (lô 6). Lô 1 xong, lô 2 đứt mạng.
- Kỳ vọng: thanh chọn chỉ còn thẻ chưa quyết. Thực tế: `catch` báo lỗi + `reload()` nhưng KHÔNG chỉnh lại `chon`; 6 thẻ đã từ chối thành id ma trong `chon`, `loaiChon` có thể thành null (nút Duyệt / Từ chối sai số) và "Duyệt n yêu cầu" gửi id đã xử lý (máy chủ trả "đã được xử lý" từng thẻ, không mất dữ liệu).
- Sửa gợi ý: sau `reload` lọc `chon` theo `data.the` còn `trangThai === 'cho'` (một `useEffect` theo `ds`).
- Tệp: web/src/modules/duyet/HopChoDuyet.tsx:221-232 (`catch` của `tuChoiNhieu`), :113

### C-8 · Thẻ Dời lịch thi quá hạn: Tổng quan / badge / hộp đếm "quá hạn" + chuông "Quá hạn duyệt" dù luật là tự huỷ
- Loại: LỖI nhẹ (chỉ khi chưa có lượt quét) · Trạng thái: đã kiểm (đọc mã) · Mức: P3
- Luật: thẻ `lich_thi` tự ghi "hết hạn chưa duyệt thì yêu cầu tự huỷ và kỹ năng bị huỷ" (`loaiYeuCau.ts:262`); CLAUDE.md "việc xong không được nơi nào còn báo chờ / quá hạn"
- Kịch bản: sang ngày mới, Head mở Tổng quan hoặc chỉ nhìn badge menu (`/yeu-cau/dem`) trước khi ai mở Công việc. `quetThat` không có `quet` cho `lich_thi`; `sweepExpiredMoves` chỉ chạy ở `mywork.ts:1071` và đêm (`chotVangDinhKy.ts:47`, 02:20–06:20 giờ VN). Vòng `qua` của `quetThat` còn gửi chuông "Quá hạn duyệt · Dời lịch" cho thẻ sắp tự huỷ.
- Kỳ vọng: cùng một số ở mọi nơi. Thực tế: Tổng quan / badge đếm thẻ quá hạn; mở Công việc thì thẻ biến mất. Ở bản chính hầu như không gặp (job đêm quét trước 06:20); lộ ra ở demo đổi ngày hoặc job đêm lỗi.
- Sửa gợi ý: cho `lich_thi` khai `quet: () => sweepExpiredMoves()` (cùng đường `quetTheoMoc`) hoặc loại `lich_thi` khỏi vòng `qua` chuông.
- Tệp: server/src/duyet/yeuCau.ts:222-262 · server/src/fasttrack/absence.ts:377-402 · server/src/worklist/mywork.ts:1071

### E-10 · `laVaiQuanLy` chỉ gồm Head + Quản trị: CX / BPXL / Admin VP vào hồ sơ lớp nhận bộ badge kiểu GV
- Loại: LỖI (nghi ngờ) · Trạng thái: chưa kiểm hiệu ứng thực · Mức: P3
- Luật: CLAUDE.md "cùng số liệu cùng nguồn; giao diện theo vai khớp quyền máy chủ"; N52 (CX xem như Head)
- Kịch bản: CX mở hồ sơ lớp: `DauTrangLop.tsx:147-152` đặt `vai: 'gv'`, `soViecChoCham: null`, `soViecQuaHan: 0` — CX không thấy badge "việc quá hạn của lớp / chờ chấm" mà máy chủ cho CX xem (Công việc "Tất cả").
- Kỳ vọng: badge theo vai thực (CX = xem như Head, không có nút chấm). · Thực tế: ba vai ngoài Head / Quản trị rơi nhánh GV.
- Sửa gợi ý: dùng cờ máy chủ (`session.nav.workOps`/`workCx`) thay `laVaiQuanLy(session.roles)` ở đây; xác nhận với ảnh CX trước khi sửa.
- Tệp: `web/src/modules/classes/DauTrangLop.tsx:147-175`, `shared/domain/hocVienLop.ts:48-50`


## 3. Đề xuất — cần chủ SP duyệt (đổi luật / workflow, hoặc chỉnh chữ luật cho khớp mã)
Không mục nào ở đây được tự làm. Mục chỉ "ghi lại luật cho khớp mã" (A-6, B-3) không đổi hành vi.

### E-4 · Đổi chi nhánh (gỡ vai ở một nơi, còn vai nơi khác) không chuyển Case / PA của em chi nhánh cũ
- Loại: ĐỀ XUẤT · Trạng thái: đã kiểm (mã), chưa kiểm hiệu ứng thực · Mức: P2
- Luật: N69 (chỉ nói "gỡ hết vai"); CLAUDE.md "không để người dùng kẹt"
- Kịch bản: 1) GV có vai teacher ở Monbay và Bãi Cháy, giữ Case của em Monbay. 2) Quản trị bỏ vai Monbay (còn Bãi Cháy). 3) `chuyen = roles.length ? null : …` → không chuyển; `donGiaoHetHieuLuc` chỉ lo việc N58, không lo Case. Case của em Monbay đứng tên người không còn quyền ở Monbay.
- Kỳ vọng: Case / PA / tín hiệu / xử lý ở chi nhánh bị gỡ chuyển như N69. · Thực tế: phép kiểm `prGiaoViec.tests.ts:~760` ghi rõ "đổi vai còn vai → không chuyển".
- Sửa gợi ý: gọi `chuyenViecNguoiNghi` theo tập chi nhánh vừa mất vai (thêm tham số `chiNhanh`). Cần chủ SP xác nhận mở rộng N69.
- Tệp: `server/src/platform/accounts.ts:421`

### E-7 · Khôi phục tài khoản không trả Case đã chuyển (N69) — mất "luôn khôi phục được"
- Loại: ĐỀ XUẤT · Trạng thái: đã kiểm · Mức: P2
- Luật: N69 (chủ SP chấp nhận "Khôi phục không trả lại") vs CLAUDE.md "luôn Hoàn tác ngắn + khôi phục được"
- Kịch bản: 1) Xoá nhầm tài khoản GV. 2) Case / PA đã chuyển người khác. 3) Khôi phục tài khoản → vai về, Case không về; Quản trị phải đi từng Case.
- Kỳ vọng: nếu Khôi phục trong thời hạn ngắn (như Hoàn tác 15 phút của các việc khác) thì trả lại các Case chưa bị ai sửa tiếp (`ghi_dao`). · Thực tế: `prGiaoViec.tests.ts:737` khẳng định "Khôi phục không tự trả". Câu thông báo khi Khôi phục (`xoaTaiKhoan.ts:289-310`) không nhắc điều này.
- Sửa gợi ý: tối thiểu thêm một dòng trong `canhBao` của Khôi phục: "Case / PA đã chuyển cho {người} giữ nguyên — đổi lại ở từng Case"; tốt hơn: lưu `ghi_dao` ở `chuyenViecNguoiNghi` (đã chụp `rows`) và Khôi phục ≤ 15 phút trả lại. Đổi luật → chủ SP duyệt.
- Tệp: `server/src/cases/owner.ts:461-518`, `server/src/platform/xoaTaiKhoan.ts:264,279-310`

### A-6 · Dòng N15 trong plan.md nói "mọi vai trừ Quản trị hệ thống", mã cho QL / Admin vượt khoá cuối tuần sau một câu hỏi (RKC 07/11)
- Loại: ĐỀ XUẤT (đồng bộ tài liệu) · Trạng thái: đã kiểm (đọc mã) · Mức: P3
- Luật: N15 (24–25/10) so với chủ SP 07/11 "không chặn cứng" (plan.md mục RKC)
- Thực tế: `chanCuoiTuan` → `vuotKhoaCuoiTuan` = có `plan.week` → hỏi "Đang khoá … vẫn đổi lịch?" rồi cho đổi; GV (không `plan.week`) bị chặn 400. Mã đúng lời mới hơn của chủ SP, nhưng dòng N15 không ghi ngoại lệ → người đọc plan tưởng QL bị khoá cứng.
- Sửa gợi ý: thêm một mệnh đề "(RKC 07/11: QL / Admin vượt được sau một câu hỏi)" vào dòng N15; không đổi mã.
- Tệp: plan.md (dòng N15) · server/src/fasttrack/skillSchedule.ts:48-58 · server/src/platform/moSuaLichTest.ts:94-96

### A-7 · Luật N9 / N16 / N25 / N27 / N53 không có phép kiểm gắn nhãn luật
- Loại: ĐỀ XUẤT (phủ phép kiểm) · Trạng thái: đã kiểm (grep tests) · Mức: P3
- Thực tế: grep `\bN9\b|\bN16\b|\bN25\b|\bN27\b|\bN53\b` trong server/src/tests/*.ts = 0 tệp (N53 có vài phép kiểm chuỗi theo mã khác). Mã có ép (N16: `attempts.ts:2548` + `kiemTieuChi`; N9: `thieuNhanXetMt`; N25 / N27 có mã) nhưng không tra được từ luật sang phép kiểm. N53 chưa có phép kiểm cho tệp xuất (xem A-1).
- Sửa gợi ý: thêm nhãn N-số vào tên `check()` hiện có (không viết phép kiểm mới); thêm một phép kiểm N53 cho tệp xuất khi sửa A-1.
- Tệp: server/src/tests/

### B-3 · N70 ghi "Head / Quản trị tự sửa áp ngay" nhưng mã áp ngay cho cả CX (theo N52)
- Loại: ĐỀ XUẤT (ghi lại luật cho khớp mã) · Trạng thái: đã kiểm · Mức: P3
- Luật: N70 ③ · N52 (CX duyệt / áp thẳng Ý thức)
- Kịch bản: CX mở hồ sơ em, bấm sửa bậc đã khai.
- Kỳ vọng (theo chữ N70): thẻ chờ Head? · Thực tế: `duyetYThuc` = Head HOẶC CX → `luuSuaKhai` áp ngay; thẻ duyệt của người khác cũng do CX duyệt được (`yeuCau.ts:355`). Khớp N52 và commit "CX duyệt thẻ sửa bậc", nhưng dòng N70 trong plan.md không nhắc CX.
- Sửa gợi ý: sửa chữ N70 thành "Head / CX / Quản trị" (không đổi mã).
- Tệp: `server/src/permissions.ts:950` · `server/src/yThuc/xuLy.ts:270-278` · `plan.md` N70

### B-4 · PA Tutor: trần "Nhận xét kết quả PA ≤ 200" (N35) bị bỏ qua, luật chưa nêu ngoại lệ
- Loại: ĐỀ XUẤT · Trạng thái: đã kiểm · Mức: P3
- Luật: N35 (Nhận xét kết quả PA ≤ 200) · N54 (một dòng gộp cả kỳ; Nội dung từng dòng)
- Kịch bản: ghi kết quả PA Tutor với 4 dòng Tutor, mỗi dòng Nội dung 1000 ký tự.
- Kỳ vọng: có trần rõ ràng · Thực tế: `cases.ts:4080-4081` loại hẳn PA Tutor khỏi trần 200 (ghi chú ghép từ các dòng); mỗi dòng cho tới 1000 ký tự (`paDongBo.ts:148`) → ghi chú kết quả có thể vài nghìn ký tự, hiện ở Lịch sử Case. N35 không nói ngoại lệ này.
- Sửa gợi ý: chốt một trần cho Nội dung dòng Tutor (vd 200 như Nội dung PA, hoặc 300) rồi ghi vào N35 / N54; chữ cũ dài giữ như N35.
- Tệp: `server/src/cases/cases.ts:4080-4081, 4842-4844` · `shared/domain/paDongBo.ts:148`

### C-4 · Huỷ quyết định thẻ sửa bậc không có `chan` (khác thẻ Ý thức) khi đã có lần xử lý mới sau lần duyệt
- Loại: ĐỀ XUẤT · Trạng thái: chưa kiểm (đọc mã, chưa dựng ca) · Mức: P3
- Luật: N70 + RKC-3b "huỷ mọi lúc, bảng nguồn kiểm dữ liệu sau"
- Kịch bản: 1) Head duyệt thẻ sửa bậc (khai 2 thành 4). 2) GVCN lưu lần xử lý mới theo bậc 4. 3) Head bấm Huỷ quyết định trên thẻ cũ (Đã xử lý hiện nút trong 30 ngày).
- Kỳ vọng: chặn có lý do + bước tiếp, như `y_thuc` (`loaiYeuCau.ts:560-571` có `chan`). Thực tế: `dao.duyet` chỉ chụp dòng `y_thuc_khai_bac`; chỉ 409 khi chính dòng khai đã đổi tiếp. Dòng khai về bậc cũ (và `sua_luc` cũ) nhưng lần xử lý mới đã ghi theo bậc mới, nên bậc và lịch sử có thể lệch nhau (cần dựng ca mới biết hậu quả cụ thể).
- Sửa gợi ý: thêm `chan` trả câu "GVCN đã xử lý theo bậc mới, không huỷ quyết định được; sửa lại bậc ở tab Ý thức" khi em có `discipline_measures` (done / cho_duyet / da_duyet) tạo sau `xu_ly_luc` của thẻ.
- Tệp: server/src/duyet/loaiYeuCau.ts:1013-1022

### C-7 · Quét hết hạn thẻ Ý thức: một thẻ lỗi làm hỏng cả lượt quét (mọi người đọc 500 liên tục)
- Loại: ĐỀ XUẤT (độ bền) · Trạng thái: chưa kiểm (đọc mã; chưa tạo ca lỗi) · Mức: P3
- Luật: N5 / N1 / N70 (hết hạn tự chốt theo GVCN); CLAUDE.md "không để người dùng kẹt"
- Kịch bản: `quetYThucHetHan` chạy mọi thẻ `y_thuc` / `thu_hoi_y_thuc` / `sua_khai_bac` quá hạn trong MỘT `tx`. Nếu một thẻ ném lỗi (vd `hocVien()` không thấy em, `apDungThuHoi` 409) thì cả `tx` cuộn lại và lỗi đi qua `quetTheoMoc` (`mocHeThong.ts:127-130` trả mốc về NULL rồi ném tiếp), nên mọi `GET /my-work`, `/yeu-cau`, `/yeu-cau/dem`, Tổng quan đều 500 tới khi dữ liệu được sửa.
- Kỳ vọng: thẻ lỗi bỏ qua + ghi log, thẻ khác vẫn chốt. Thực tế: không có `try/catch` từng thẻ (nhánh `sua_khai_bac` có `khop` chặn phần lớn ca, nhưng nhánh `y_thuc` / `thu_hoi` cũ vẫn dễ ném).
- Sửa gợi ý: bao từng thẻ trong vòng `for` bằng `try { … } catch (e) { console.error('[het-han-y-thuc]', y.id, e); }`.
- Tệp: server/src/yThuc/xuLy.ts:1265-1296 · server/src/platform/mocHeThong.ts:127-130

### C-9 · Meeting N67: API `mo-lai` cho phép mở lại Xếp lịch đã TỰ xong khi Kết quả còn xong
- Loại: ĐỀ XUẤT · Trạng thái: đã kiểm (đọc mã; giao diện không lộ đường này) · Mức: P3
- Luật: N67 "Xếp lịch họp KHÔNG còn là việc / quá hạn riêng khi Kết quả meeting đã xong"
- Kịch bản: gọi `POST /giao-viec/meeting/{xep_lich}/mo-lai` khi Kết quả đã xong. `moLaiPhanMeeting` chuyển Xếp lịch về `mo` (chỉ kiểm `coTheLamMeeting`, không kiểm Kết quả) nên việc "Xếp lịch họp" hiện lại và có thể quá hạn. Giao diện không lộ (Hoàn tác chỉ sau Hoàn thành thủ công; dòng tự xong chỉ có "Sửa").
- Kỳ vọng: 409 "Kết quả meeting đã xong, Xếp lịch tự xong". Thực tế: mở được.
- Sửa gợi ý: ở `moLaiPhanMeeting`, nếu `v.row.phan = 'xep_lich'` và phần `ket_qua` cùng `phoi_hop_id` đang `xong` thì `conflict(...)`.
- Tệp: server/src/worklist/giaoViec.ts:765-784

### D-03 · Mã chết tốn compute: `GET /phan-tich/bao-cao`, `?kemBaoCao=1` và các trường `chuY/casePa/test/sos/tienBo`
- Loại: ĐỀ XUẤT · Trạng thái: chưa kiểm hết (chỉ grep web) · Mức: P3
- Luật: CLAUDE.md "tốc độ + compute: không tính lại cái đã có".
- Kịch bản: web Báo cáo nay gọi `/tong-quan/v5?baoCao=chi-nhanh` (`BaoCao.tsx:48`) và `/phan-tich/bao-cao/o` cho panel; không thấy nơi nào gọi `/phan-tich/bao-cao` (không `/o`) hay `kemBaoCao`. Hàm `baoCao()` vẫn dựng nhiều chỉ số (nhiều `metricSet`, `tapCaseQl`, `tienBoTheoKyNang`); `tocDoDuong.ts:441-443,499` vẫn giữ trần cho đường không dùng.
- Kỳ vọng: không giữ đường không ai gọi · Thực tế: còn nguyên `routes/index.ts:914-916,2475`, `baoCao.ts:290-330`.
- Sửa gợi ý: xác nhận không client nào dùng (kể cả xuất Excel) rồi gỡ GET + `kemBaoCao`; giữ `tinh()` cho panel `/o`. Đồng thời hết nguồn lệch D-02.
- Tệp: `server/src/routes/index.ts:914-916,2475`, `server/src/phanTich/baoCao.ts:290-330`, `server/src/tests/tocDoDuong.ts:441-443,499`.

### D-04 · còn mở từ 21/11 (B2-03, nửa sau): chip "Nhập điểm · n" ở Lớp của tôi / hồ sơ lớp chỉ ghi "n bài", không nói số việc
- Loại: ĐỀ XUẤT · Trạng thái: đã kiểm · Mức: P3
- Luật: CLAUDE.md "cùng một số liệu ở nhiều nơi"; báo cáo 21/11 mục 4C B2-03.
- Kịch bản: hồ sơ lớp GV: chip Nhập điểm "21" cạnh badge tab / đầu trang "4 việc" — hai đơn vị khác nhau, không chú thích.
- Kỳ vọng: `title` chip "21 bài · 4 việc" · Thực tế: `LopCuaToi.tsx:79-80` `doc = '{n} bài chờ nhập điểm'`, không có vế việc. Phần badge tab đã sửa (`ClassOverviewPage.tsx:193-194`).
- Sửa gợi ý: tính thêm `dongTab(...).filter(cuaLop).length` cho chip Nhập điểm và ghi vào `doc`.
- Tệp: `web/src/modules/congViec/LopCuaToi.tsx:73-81`.

### D-05 · "Thi tháng này" của TVV đếm khác "Thi tháng này" của QL
- Loại: ĐỀ XUẤT · Trạng thái: đã kiểm hàm; chưa kiểm hai nhãn có giống nhau trên màn · Mức: P3
- Luật: "một khái niệm một tên", cùng hàm.
- Kịch bản: cùng nhãn "Thi tháng này": QL = `tapThiThangNayLop` (`baoCao.ts:153-167`: lớp FT theo `ct`, cần ghi danh `active`, ngày thi = `exam_date`, chi nhánh theo lớp); TVV = SQL riêng (`tongQuanV5.ts:134-140`: mọi `learning_cycles` của em mình có `exam_date` trong tháng, không cần ghi danh, không lọc FT, em Tạm dừng vẫn tính).
- Kỳ vọng: một định nghĩa (hoặc nhãn khác nhau) · Thực tế: hai hàm riêng; chip "Sắp thi" TVV (`hvCuaToi.ts:73-86`) là định nghĩa thứ ba (6 tuần, gồm tuần / tháng dự kiến).
- Sửa gợi ý: cho TVV gọi `tapThiThangNayLop` rồi lọc theo `consultant_user_id`, hoặc đổi nhãn TVV thành "Em có ngày thi trong tháng".
- Tệp: `server/src/worklist/tongQuanV5.ts:134-140`, `server/src/phanTich/baoCao.ts:153-167`.

### D-06 · còn mở từ 21/11 (P1-05 cũ): ba "kỳ mặc định" khi vào bằng menu
- Loại: ĐỀ XUẤT · Trạng thái: đã kiểm · Mức: P3
- Luật: CLAUDE.md "cùng số liệu ở nhiều nơi"; chủ SP 06/11, 12/11 (kỳ riêng từng tab).
- Kịch bản: Tổng quan = `khoangMacDinh` (2 tuần hoàn chỉnh vừa qua, `tongQuanV5.ts:49`); Phân tích mặc định = `khoangPhanTichMacDinh` (tuần trước + tuần này, `PhanTich.tsx:55`); Báo cáo = tháng (`khoangChiNhanhMacDinh`). Link từ Tổng quan mang kỳ nên khớp khi bấm qua; vào thẳng menu thì số "Thi / Đạt MT" hai trang lệch một tuần.
- Kỳ vọng / Thực tế: đã quyết có chủ ý (06/11, 12/11), chỉ ghi nhận còn mở. Không phải lỗi mã.
- Sửa gợi ý: giữ; kỳ đã hiện bằng chữ ở đầu trang (`nhanKhoang`).
- Tệp: `shared/domain/khoangThoiGian.ts:23,32,41`, `web/src/modules/phanTich/PhanTich.tsx:55`.

### D-07 · "HV đang học" có hai điều kiện SQL (chưa kiểm hết)
- Loại: ĐỀ XUẤT · Trạng thái: chưa kiểm · Mức: P3
- Luật: Tạm dừng / Kết thúc ẩn; `HV_DANG_HOC_SQL` = `s.status='active' AND archived_at IS NULL` (`tamDung.ts:12`).
- Kịch bản: đếm "học viên" ở hồ sơ GV và bảng chi nhánh dùng `e.status='active' AND s.archived_at IS NULL` (`hoSo.ts:99-101`, `bangChiNhanh.ts:117-121`), không `s.status='active'`. Nếu em Tạm dừng vẫn giữ ghi danh `active` (không `paused`) thì cột "Học viên" đếm em đó còn SOS / Case / nợ điểm thì không.
- Kỳ vọng / Thực tế: chưa xác nhận trạng thái ghi danh khi Tạm dừng (`hvCuaToi.ts:63` có `e.status IN ('active','paused')` gợi ý có `paused`). Cần đối chiếu mã Tạm dừng ghi `enrollments.status` thế nào trước khi kết luận.
- Sửa gợi ý: nếu Tạm dừng giữ `active`, thêm `s.status = 'active'` vào hai câu; không thì bỏ mục.
- Tệp: `server/src/giaoVien/hoSo.ts:97-102`, `server/src/worklist/bangChiNhanh.ts:117-121`.

### D-08 · N+1 trên đường ghi (không phải đường đọc): `khoiPhucLenh`, `vanHanhHetHieuLuc`, `themTheoDoiDong`
- Loại: ĐỀ XUẤT · Trạng thái: đã kiểm (đọc mã) · Mức: P3
- Luật: CLAUDE.md "không N+1"; nhẹ vì danh sách nhỏ.
- Kịch bản: `lenhChuyen.ts:499` mỗi id một `SELECT` chỉ để đếm lệnh quá tuần; `giaoViec.ts:209-212` mỗi người theo dõi một `INSERT…SELECT`; `giaoViec.ts:393-398` mỗi việc hết hiệu lực hai câu ghi. Chạy khi Hoàn tác nhiều lệnh / đổi vai — lô vài chục.
- Kỳ vọng: một câu theo lô (`theoLoJson`) · Thực tế: vòng lặp. Không chạm đường GET; `tocDoDuong` không đo đường ghi.
- Sửa gợi ý: chỉ sửa nếu đo thấy chậm; ưu tiên `lenhChuyen.ts:499` (đổi thành một `IN`).
- Tệp: `server/src/classes/lenhChuyen.ts:499`, `server/src/worklist/giaoViec.ts:209-212,393-398`.

### E-8 · Tải danh sách tutor hàng loạt không có Hoàn tác
- Loại: ĐỀ XUẤT · Trạng thái: đã kiểm (mã + `TaiDanhSach.tsx` không có `hoanTac`) · Mức: P3
- Luật: CLAUDE.md "luôn Hoàn tác ngắn" · so sánh `intake.hoanTacNhap` (Thêm HV có Hoàn tác 15 phút)
- Kịch bản: Head tải file 80 dòng tutor › Lưu (sau bước xem trước) › phát hiện sai chi nhánh. Xoá từng tutor (đã có Thùng rác) — 80 lần.
- Kỳ vọng: toast "Đã thêm 80 tutor · Hoàn tác". · Thực tế: `tutors/taiLen.ts:171` ghi trong `tx`, không trả khoá đảo.
- Sửa gợi ý: ghi `audit` id lô + `/tutors/tai-len/hoan-tac` như `intake/hoan-tac` (chỉ tutor chưa có buổi / nhận xét).
- Tệp: `server/src/tutors/taiLen.ts:171`, `web/src/modules/tutor/TaiDanhSach.tsx`

### E-9 · Hoàn tác Thêm HV bỏ qua kiểm quyền khi người gọi là người thêm
- Loại: ĐỀ XUẤT (rủi ro thấp) · Trạng thái: chưa kiểm sâu · Mức: P3
- Luật: CLAUDE.md "phân quyền không bao giờ bớt"
- Kịch bản: TVV thêm lô HV vào lớp, trong 15 phút bị gỡ vai ở chi nhánh đó (hoặc chuyển sang vai khác). Vẫn gọi `POST /intake/hoan-tac`.
- Kỳ vọng: người thêm còn vai ở chi nhánh lớp. · Thực tế: `a.actor_user_id === p.userId` bỏ qua `require_`; từng em xoá bằng `xoaHocVien(p, id, { daKiemQuyen: true })` (`intake.ts:452,469`). Chỉ xoá em chưa có dữ liệu, ≤ 15 phút, vào Thùng rác → hậu quả nhỏ.
- Sửa gợi ý: thêm `can(p, STUDENT_ADD, { classId })` cho nhánh người thêm (một lời gọi).
- Tệp: `server/src/classes/intake.ts:445-473`


## 4. Phụ lục — bảng của từng nhóm

<!-- nhóm A -->
### Chưa kiểm (ghi rõ, không tính là đúng)
- (g) N+1 / trần câu của route đụng từ 21/11 (Công việc, Phân tích, Tổng quan): chỉ đọc `lichThi.ts` (theo lô, `listCases` chia 500); không chạy `tocDoDuong.ts`.
- Cuối khoá cả lớp "Ngay hôm nay" + Hoàn tác, Lộ trình mới "Hẹn bắt đầu": chỉ đọc mã (`hoanTacChuyenNgay.ts`, `buocTiep.ts:305-380, 560-640`), không bấm.
- Khoá cuối tuần N15 và hạn N20 T6–CN theo ngày thật: chỉ đọc mã (ngày demo là thứ Hai).
- Phần web của N39 (panel chấm chỉ hiện em có bài) và N8 ③ (Xác nhận Case S chéo): chưa đọc.

<!-- nhóm B -->
### Mục 21/11 còn mở?
- P1-03 (xoá vi phạm bị trả lại rồi Hoàn tác): ĐÃ SỬA — chụp yêu cầu + khung giao việc TRƯỚC khi đóng (`violations.ts:531-543`), khôi phục trả yêu cầu về "mở", Báo PH về "Chờ GV sửa", hạn như cũ, TVV nhận một tin "GV đã hoàn tác xoá" (`traLai.ts:249-305`).
- P1-04 (Khôi phục HV gắn dữ liệu việc sang em khác): ĐÃ SỬA — `thungRac.ts` bản đồ `MEM` có `viec_theo_doi / viec_giao_lan / viec_han_lan / viec_mo_ta / ghi_dao(giao_viec) / viec_bao_ph`, ánh xạ theo id mới.
- P1-05 (PUT teachers thiếu `slots` kết thúc hết GV): ĐÃ SỬA — `classes.ts:1251-1255` kiểm ở lõi `luuPhanCong`, bắt buộc phiên bản.
- B1-07 / B1-11 (câu Hoàn tác trả lại sai lý do; GV gửi lại / giữ nguyên chưa có Hoàn tác): ĐÃ SỬA (`traLai.ts:188-247`, Hoàn tác GV 60 s qua `ghi_dao`).
- A3-06 (CX mẫu "GV báo TVV"): ĐÃ SỬA (`board.ts:312`, `xuLy.ts:635`).
- Còn mở từ 21/11, ngoài luồng, chưa kiểm lại: B2-10 (`lich-su:{lớp}` chỉ có ở `mywork.ts:1679`, chưa thấy ở thanh việc hồ sơ HV).

<!-- nhóm C -->
### Lỗi 21/11 đã sửa / còn mở

| Mã cũ | Trạng thái | Bằng chứng ngắn |
|---|---|---|
| P0-01 người giao mất vai vẫn sửa | **đã sửa** | `giaoViec.ts:104-106` `laNguoiGiao` = người giao + `conHieuLuc`; dùng ở `giaoViec.ts:163,172,184,345-348`, `baoPhTvv.ts:181`, `phoiHop.ts:692`; `suaHan` gọi `requireDoc` TRƯỚC khi ghi (`giaoViec.ts:560-561`) nên hết "403 nhưng đã ghi" |
| P1-01 TVV được giao Vận hành panel trắng | **đã sửa** | `routes/index.ts:171-189` `laViecVhCuaToi` (GET / PATCH / POST update đúng một việc) + `mgmttasks.ts:596-600` `coQuyenTheoViec`; tab: `tongQuan.ts:111` `nhomViecTvvCua` thành "Vận hành" |
| P1-02 giao người khác lại báo "1 xong hôm nay" | **đã sửa** | `HoTroHocVienTab.tsx:216,281` (`giaoDi`, không vào `giu`) |
| P1-03 Hoàn tác xoá vi phạm bị trả lại | **đã sửa** (đọc mã) | `traLai.ts:277-300` `dongKhiXoaViPham` / `khoiPhucTraLaiKhiXoa` |
| P1-04 khôi phục HV Thùng rác gắn dữ liệu việc | chưa kiểm | không thuộc đường đã đọc (`platform/thungRac.ts`) |
| P1-05 PUT teachers thiếu danh sách | chưa kiểm | nhóm khác (lớp / phân công) |
| P1-06 CX hồ sơ HV không thấy việc của mình | chưa kiểm | `students/viecHocVien.ts`, nhóm số liệu |
| P1-07 Sau thi "Đã thi · chờ KQ" | **đã sửa** | `PanelSauThi.tsx:58` ghi rõ không vẽ lại; chuỗi còn ở `DanhSachViec.tsx:530` chỉ cho `thi_that` |
| P1-08, P1-09 chữ Hướng dẫn / câu Xác nhận Meeting | **đã sửa** | grep không còn "TVV xếp họp", "BPXL / CX không có việc"; `shared/huongDan/gv.ts:259` đúng luật |
| P1-10 CX chốt Cuối khoá | chưa kiểm | đã chốt ở N63 ①; mã `classes/quyenChuyenLop.ts` thuộc nhóm khác |
| A2-03 hai mục "Báo PH" | **đã sửa** | `tongQuan.ts:192-193` `chuanHangMuc`; `mgmttasks.ts:809-813` |
| A2-04 / A2-09 Hoàn tác Đổi người Vận hành | **đã sửa** | `mgmttasks.ts:1354-1370` `hoanTacGiaoVh` (đảo bản ghi, chỉ người đổi + 60 giây) |
| A2-05 TVV tab Vận hành | **đã sửa** | như P1-01 |
| A2-06 ô Nhóm có tìm / "cần: —" | **đã sửa** | `MgmtTasksPage.tsx:252,365`, `NhomViec.tsx:51` |
| A2-10 một trần mô tả 500 | **đã sửa** | `mgmttasks.ts` `TRAN_MO_TA_VH` + `editMgmtTask` chỉ kiểm trần khi chữ đổi |
| A2-13 hai nút "+ Giao việc" | có vẻ đã sửa (chưa kiểm hiển thị) | `CongViecPage.tsx:47` tab Vận hành vẽ riêng `TasksBoard` (một nút, `MgmtTasksPage.tsx:214`); trang Công việc `HoTroHocVienTab.tsx:622` |
| A1-03 việc đóng chỉ đọc | **đã sửa** | `giaoViec.ts:670` `coTheSuaTheoDoi: v.mo && …`; `suaHan` chặn `!v.mo`. Mô tả sửa được cả khi đóng là chủ ý (R2 C13, `giaoViec.ts:535`) |
| B3-04 Về mặc định có Hoàn tác | **đã sửa** | `giaoViec.ts:320-343` trả `hoanTac`; `KhoiGiaoViec.tsx:179` |
| B3-05 mất chữ Mô tả khi Đóng | **đã sửa** ở `KhoiGiaoViec` (`:213` `useBaoDangSua`); cùng lỗi còn ở PanelMeeting, xem C-1 |
| B3-12 Hoàn thành một bấm | **đã sửa** | `MgmtTasksPage.tsx:699`, `WorkList.tsx:62` |
| B3-14 việc con mặc định người cha | **đã sửa** | `MgmtTasksPage.tsx:1196` |
| B1-07, B1-08, B1-09, B1-11, B1-13 | **đã sửa** | `traLai.ts:215`; `luatLoTrinh.ts:376` (+ test `prTraLai:552`); `permissions.ts:717`; `PanelTraLai.tsx:81`; `schedule.ts:742-745` |
| A3-07, B3-08, A3-08, A3-09, A3-10 | **đã sửa** | `TraLai.tsx:105`; `PanelTraLai.tsx:167`; `PanelMeeting.tsx:53` chân Đóng trước; `giaoViec.ts` dòng Báo PH có `chuHop`; `giaoViec.ts:668` lọc người phụ trách khỏi Theo dõi |
| A3-11 giờ `xong_luc` Meeting là giờ máy | giữ có chủ đích | commit `2557f53e5` "giữ giờ thật cho xong_luc Meeting" |
| Mục 4B / 4C / 4D khác | không thuộc luồng C | nhóm khác rà |

<!-- nhóm C -->
### Mục mới

<!-- nhóm D -->
### Bảng số — nơi hiển thị → hàm đếm

| Số | Nơi hiển thị | Hàm đếm | Cùng nguồn |
|---|---|---|---|
| Việc cần làm ngay (quá hạn + hôm nay) | badge menu Công việc, chuông, ô "Của tôi", đầu trang | `demDongViec` (`shared/domain/tongQuan.ts:87`) qua `demSo` (`mywork.ts:2020`) và `soCuaToi` web | Có |
| Badge tab Công việc / tab hồ sơ lớp | `HoTroHocVienTab.tsx:286`, `ClassOverviewPage.tsx:194` | `badgeTab` (`tongQuan.ts:251`), cùng bỏ S chấm chéo | Có (B2-03 đã sửa) |
| Việc đang tồn của GV (hồ sơ) · tab "Việc & Case" | `hoSo.ts:36-50`, panel `cot=viec` `hoSo.ts:328-340`, web `HoSoGiaoVienPage.tsx:112,171` | `demViecTheoNhom` → `demDongViec` trên `dongViecGv`; tự xem lấy từ `/my-work` đã nạp | Có (A1-02 đã sửa) |
| Việc quá hạn đầu hồ sơ lớp · "Chờ chấm" QL | `viecTheoEm.ts:59-60` | `demDongViec(gopViecTheoLop(...))` | Có (B2-08 đã sửa) |
| Chip "Việc cần làm" Lớp của tôi | `LopCuaToi.tsx:66-82` | Nhập điểm = số BÀI; chip khác = `dongTab` | Cố ý khác đơn vị — xem D-04 |
| Case đang mở | Tổng quan V5 (lớp / chi nhánh), Phân tích Báo cáo, panel ô | `metricSet('case-mo')` → `tapCaseQl` (`bangChiNhanh.ts:192`) lọc HV đang học | Có giữa Tổng quan ↔ Phân tích; KHÔNG khớp N46 với Công việc — D-01 |
| Case chưa có PA / chưa chốt PA | Tổng quan V5, Phân tích, hồ sơ GV `case-chua-pa` | `metricSet('case-cho-xac-dinh-nguyen-nhan')` → `tapCaseQl` | như trên — D-01 |
| Case chưa chốt PA QUÁ HẠN | `tongQuan.ts:191,210`, `baoCao.ts:320` (web chưa thấy đọc) | `metricSet('case-xac-dinh-nguyen-nhan-qua-han')` (`metrics.ts:937`) | Không (không lọc HV đang học) — D-02 |
| Case chưa có người | Công việc, Tổng quan | `caseChuaCoNguoi` (`owner.ts:183`, đã có N46 + Tạm dừng) / `napCaseMo` | Có |
| Bài chưa nhập / quá hạn (trễ chấm) | hồ sơ GV, Tổng quan, Phân tích, Lịch Test, BPXL | `scoreDebtCells` (`scoreDebt.ts:68`) trực tiếp hoặc qua `overdueScoreBai` | Có |
| SOS 1/2/3 hiện tại | Tổng quan, bảng chi nhánh, Phân tích | `metricSet('hv-sos-hien-tai')` | Có |
| Đạt MT / Thi tháng này / Đạt Target thi thật | Tổng quan V5 ↔ Phân tích Báo cáo | gọi thẳng `tapDatMt`, `tapThiThangNayLop`, `tapKqMt` (`tongQuanV5.ts:47-61`) | Có |
| Thi tháng này của TVV | `tongQuanV5.ts:134-140` | SQL riêng, không `tapThiThangNayLop` | Không — D-05 |
| Báo PH đúng hạn (TVV) | số `tongQuanTvv` và panel `oTongQuanTvv` | cùng `baoPhTrongKy` (`tongQuanV5.ts:111-122`) | Có |
| HV đang học (GV / lớp) | hồ sơ GV `tongHocVien`, bảng chi nhánh | `enrollments.status='active' AND archived_at IS NULL` (`hoSo.ts:99-101`, `bangChiNhanh.ts:117-121`) | Có giữa hai nơi; chưa kiểm so với `HV_DANG_HOC_SQL` — D-07 |
| Ô số → panel | Tổng quan V5, Phân tích GV, hồ sơ GV | cùng hàm tập (`tinh()`, `thiThatTrongKhoang`, `caseMoCuaGv`, `rowsFor`) | Có |

---

<!-- nhóm E -->
### Lỗi 21/11 đã sửa / còn mở

| Mã cũ | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| P0-01 | Người giao mất vai vẫn sửa hạn / theo dõi / Hoàn tác, 403 mà đã ghi | **ĐÃ SỬA** | `worklist/giaoViec.ts:104-106` `laNguoiGiao` = người giao + còn hiệu lực ở chi nhánh em; dùng ở `giaoViec.ts:166,175,187,348,564`, `yThuc/baoPhTvv.ts:180-181`, `yThuc/phoiHop.ts:692` (kiểm quyền trước khi ghi) |
| P1-01 | TVV được giao việc Vận hành mở panel trắng (403 cổng) | **ĐÃ SỬA** | `routes/index.ts:171-178,186` `laViecVhCuaToi` (GET / PATCH `/mgmt-tasks/:id`, POST `…/update`) qua `coQuyenTheoViec`; service vẫn tự kiểm (`mgmttasks.ts:1143-1149`: người phụ trách chỉ sửa hạn + theo dõi). Chưa thấy phép kiểm đường cổng (tên `laViecVhCuaToi` không có trong `tests/`) |
| P1-03 | Xoá vi phạm bị trả lại → Hoàn tác không trả việc GV | **ĐÃ SỬA** | `yThuc/violations.ts:526-541` chụp yêu cầu + 4 bảng việc + `ghi_dao` TRƯỚC khi đóng, `khoiPhucTraLaiKhiXoa` |
| P1-04 | Khôi phục HV gắn dữ liệu việc sang em khác (id dùng lại) | **ĐÃ SỬA** | `platform/thungRac.ts:64-77` ánh xạ `viec_theo_doi / viec_giao_lan / viec_mo_ta / viec_han_lan / ghi_dao / viec_bao_ph` theo `LOAI_CUA_BANG` |
| P1-05 | `PUT /classes/:id/teachers` thiếu `slots` = kết thúc hết GV | **ĐÃ SỬA** | `classes/classes.ts:1251-1255` + `phanCongGv.ts:121,137` (400 thiếu danh sách, phiên bản bắt buộc) |
| B1-07 / B1-08 / B1-09 | câu 403 sai lý do / chuyển lớp 500 / câu Head nhập điểm | **ĐÃ SỬA** (đọc `routes/index.ts` diff 21/11: kiểm `CLASS_EDIT` trước khi đọc lớp đích, 404) | `routes/index.ts` (chuyển lớp) |
| B1-11 | GV "Sửa rồi gửi lại / Giữ nguyên" không Hoàn tác | **ĐÃ SỬA** | `yThuc/traLai.ts:210-214,255` `hoanTacGv` |
| B3-04 | "Về mặc định" không Hoàn tác | **ĐÃ SỬA** | `KhoiGiaoViec.tsx:179-181` |
| B3-05 | Gõ mô tả việc rồi Đóng panel mất chữ | **ĐÃ SỬA** | `KhoiGiaoViec.tsx:213` `useBaoDangSua` |
| A1-03 | Việc đã đóng vẫn cho sửa hạn / phụ trách | **ĐÃ SỬA** (điều kiện `MO[loai]` ở UPDATE) | `giaoViec.ts:318,549`; Mô tả vẫn sửa được có chủ ý (`:573`) |
| A3-05 | CX thấy "Nhập điểm" không ô nhập | **ĐÃ SỬA** | `PanelNhapDiemTuan.tsx:87`, `HoTroHocVienTab.tsx:543` |
| 4B "Trang này dành cho…" thiếu BPXL / CX, A3-06 CX mẫu Tình hình | chưa kiểm lại (ngoài nhóm E) | chưa kiểm | — |
| Câu 9 (TVV cũ ghi Báo PH sau khi mất vai) | **ĐÃ SỬA** trong #1948 (`coTheGhi`) theo `plan.md:641` | đã kiểm qua plan, chưa đọc mã | — |
| Còn mở từ 21/11 | Không còn mục quyền / đường lui P0–P1 nào của 21/11 còn mở trong phạm vi nhóm E | — | — |

<!-- nhóm E -->
### Ma trận quyền vai × thao tác ghi chính (máy chủ | web)

Nguồn máy chủ: `server/src/seed/data.ts:50-137` (`ROLE_PERMISSIONS`) + `permissions.ts` (`teacherAllows`, `boVaiCx`, `boVaiBpxl`, `lopCuTamCo`) + cổng `routes/index.ts:156-190`. Nguồn web: `platform/nav.ts:15-80` (cờ do máy chủ tính — web không tự suy vai) và cờ `viewer.* / coThe* / suaDuoc` trong từng DTO. "✓" = máy chủ cho; "—" = 403; "≈" = có điều kiện (ghi chú).

| Thao tác | GV / GVCN | GV Speaking | Head tutor | Head (manager) | Quản trị | TVV | CX | BPXL | Admin VP | Web khớp? |
|---|---|---|---|---|---|---|---|---|---|---|
| Nhập điểm MT | ≈ đúng kỹ năng phân công | ≈ chấm chéo S | — | ✓ (`score.override` qua `qlDiem`) | ✓ | — | — (chỉ xem, A3-05 đã sửa) | — | ✓ | khớp |
| Xếp / dời lịch MT, Kế hoạch Test | ≈ GVCN lớp thường (N23); GVBM không | — | — | ✓ | ✓ | — | — | ✓ (khoá cuối tuần) | ✓ | khớp (`testPlan`, `coTheXep`) |
| Xoá / Khôi phục lượt MT | — | — | — | ✓ | ✓ | — | — | ≈ chỉ khi chưa có điểm (N63 ②, `choHuyKhoiPhucLichTest` + `chanBpxlCoDiem`) | — | khớp (`coTheKhoiPhuc` N63 ②) |
| Phân công GV (đổi, Hoàn tác) | ≈ GVCN: GV bộ môn lớp mình | — | — | ✓ | ✓ | — | xem | — | — | khớp (`quyenPhanCongGv`) |
| Chốt lộ trình cuối khoá / Xét lại | — | — | — | ✓ | ✓ | — | — (N63 ①) | — | — | khớp (`coTheChotLoTrinh`, `boVaiCx`) |
| Tạo / sửa lớp, chuyển lớp HV | — | — | — | ✓ | ✓ | tạo lớp + thêm HV | ✓ (`class.edit`) | — | — | khớp |
| Case / PA | ≈ đúng kỹ năng; Ý thức: GVCN | — | — | ✓ | ✓ | xem | xem | — | xem | khớp |
| Ý thức: ghi vi phạm / xử lý | ghi: mọi GV lớp; xử lý: GVCN | — | — | ✓ | ✓ | — | ✓ (N64 làm thay) | — | — | khớp |
| Giao / đổi người làm việc N58 | ≈ người giao còn vai | — | — | ✓ | ✓ | ≈ người được giao | ✓ | — | — | khớp (P0-01 đã sửa) |
| Việc Vận hành (tạo / xoá) | — | — | — | ✓ | ✓ | — (nhận được: P1-01) | ✓ | — | — | khớp |
| Tutor: xem | — | — | ✓ | ✓ (chi nhánh) | ✓ | — | ✓ | — | — | khớp (`nav.tutor`) |
| Tutor: thêm / sửa danh bạ | — | — | ✓ | ✓ chỉ chi nhánh mình (`quyenDanhBa`) | ✓ | — | — | — | — | khớp (`coDanhBa`) |
| Tutor: nhận xét / kết luận / **xoá tutor** | — | — | ✓ | — | ✓ | — | — | — | — | **lệch**: nút "Xoá tutor" hiện cho Head (xem E-1) |
| Thùng rác: khôi phục | theo loại | — | tutor | ✓ | ✓ | — | — | — | — | khớp (`khoiPhucRac.ts:28`) |
| Xoá / gỡ vai tài khoản | — | — | — | — | ✓ | — | — | — | — | khớp (`admin` = `admin.config`) |
| GV cũ xem lớp / hồ sơ em (N68) | chỉ đọc 30 ngày hoặc tới khi bàn giao xong (mốc muộn) | — | — | — | — | — | — | — | — | khớp (`xemCuDen`, `lopCuXem`, `daiChuyenLop.ts:159`) |

<!-- nhóm E -->
### Mục mới


## 5. Đã kiểm, đúng — đừng sửa

**Nhóm A · Chấm điểm / Thi thật / Cuối khoá**
- N4 / N38 vắng: "-" dời sang tuần sau TUẦN THI, vắng lần 2 huỷ không việc / thẻ, chọn tuần = reset, MT cũ = Không dự thi, một nơi sở hữu `fasttrack/absence.ts` (`xuLyVangMotKyNang`, `huyVangNoi`, `applyMove`); phép kiểm: nhiều tệp gắn N38 (`mtTrangThai`, `keHoachTest`, `chamDiem`, `luatMayChu`).
- N8 / N9 nhận xét MT: chỉ nhắc, ô xong = có band (`oXongCua`, `nhacNhanXetCua` chỉ MT mới nhất) — `prMtb`, `prOv12b`, `prOv12c`, `prDl`.
- N10 S Ex: bảng riêng `s_expert`, không vào Overall / SOS / Case / KPI (chỉ `sExpert.ts`, `lichSu.ts`, xoá HV tham chiếu); quyền thêm / dời / xoá `requireSuaLichTest`, chấm `chamDuoc`, BPXL chỉ lượt trống; khoá cuối tuần có `chanCuoiTuan` — `prSCheoCn`.
- N14: nhắc "Chưa đủ MT" một hàm `thieuMt` (lưới + danh sách lớp cùng nguồn) — `prKhtGon`, `prMtb`, `rkcLich`.
- N15 khoá cuối tuần ở máy chủ cho mọi đường thủ công (thêm / huỷ / dời / S Ex / MT0), ngoại lệ vắng / khôi phục đúng — `prKhoaLich`, `prMoSuaLichTest`, `prCuoiKhoa`, `prBpxl`.
- N16: tiêu chí W/S chỉ số nguyên ép ở máy chủ; dữ liệu cũ gửi lại y nguyên không lỗi oan (`attempts.ts:2548`).
- N6 / N12 / N46 / N51 / N11: Bước tiếp 3 hướng, Học tiếp giữ nguyên + Hoàn tác theo nhóm (`NHOM_HOC_TIEP`), Lộ trình mới đóng Case "Kết thúc lộ trình", `DA_THI_THAT_SQL` một điều kiện cho Công việc / Case / PA / Tổng quan, quyền `coQuyenBuocTiep` (TVV + CX phía TVV) — `prSvLoTrinh`, `prOv8a`, `prAuViec`, `prTu22`, `prOv1d`.
- N17 / N20 / N22 / N25 / N36 / N50 / N52 / N63: chốt lộ trình chỉ vai không-CX (`coTheChotLoTrinh`; `chotCaLop`, `ghiLoTrinhTiepCaLop`, `khoaLenhNguoiKhac` kiểm trước khi ghi), Kỳ vọng chỉ `request.approve` (CX không có), Xét lại loại CX (`phamViQuyet` dùng `boVaiCx`), cả lớp cùng chi nhánh / một em được khác (`LOI_KHAC_CHI_NHANH`), hạn N20 một hàm `mocLoTrinh`, Reset bậc mặc định giữ (`chuoiThang`), ngưỡng 8 ký tự một hằng `CHU_TOI_THIEU` — `prCuoiKhoa`, `prKv`, `prLt2b`, `prXetLai`, `prCl`, `prCt`, `prOv13l`, `prCxBpxl`, `prCxN52`.
- (c) Việc xong không báo chờ: Học tiếp trả lịch / KQ về "chưa thi", việc Case / PA / MT hiện lại; panel giữ ảnh chụp sau lưu (P1-07 21/11 đã sửa, `PanelSauThi.tsx:181`).

**Nhóm B · Case / Ý thức / Tutor**
- N70 đầy đủ ở máy chủ: ngày / tháng (`kiemKhai`, không ở tương lai; `daLuu` cho Hoàn tác / duyệt) · khai lần đầu áp ngay (`luuKhai`, 409 nếu đã khai) · GVCN sửa bậc đã khai → thẻ `sua_khai_bac` chờ (`guiSuaKhai`: một thẻ mỗi em, hạn giữ khi gửi lại, "Chưa đổi gì" → 400, `bacCu` lệch → 409) · Head / CX / Quản trị tự sửa áp ngay · so cả lộ trình (`cycleId`) khi áp (409 nếu em đổi chuỗi) · hết hạn 5 ngày tự chốt theo GVCN (`quetYThucHetHan`, thẻ lệch bậc tự đóng) · thẻ tự đóng khi bậc đổi / em lưu trữ (`chet.sql`) · Rút chỉ người gửi (`theCuaNguoiGui`) · Hoàn tác lô: khai lần đầu chỉ xoá khi chưa sửa + cùng người cùng ngày, "về bậc trước" chỉ Head, ghi đè thẻ → khôi phục nội dung trước (`khoiPhucSuaKhai`), thẻ mới → rút. Phép kiểm: `prN70.tests.ts` (+ đo trần câu ở prN70 N70-9, ghi chú ở `tocDoDuong.ts:2346`).
- N1 / N2 / N5 / N61: hạn Báo PH `hanBaoPh` (lưu + 4), hạn trả lại `hanTraLai` (3 ngày tính cả ngày trả), tạm dừng Báo PH + tính lại khi GV gửi lại (`dongBoTamDung`), TVV báo xong khi đang chờ GV sửa → yêu cầu tự đóng "TVV đã báo PH", Báo PH xong / bỏ → chặn trả lại ở máy chủ và ở `traLaiCuaViPham`, một yêu cầu mở mỗi vi phạm (UNIQUE + 409), quyền trả lại (TVV của em còn vai · TVV / CX cùng phạm vi · Head), Hoàn tác 60 s cả phía TVV lẫn phía GV, Hoàn tác xử lý 60 s rồi mới Thu hồi qua QL duyệt (`hoanTacXuLy`), hết hạn thu hồi tự chốt. Phép kiểm: `prTraLai.tests.ts`, `prYt4.tests.ts`, `prYtBaoPh.tests.ts`, `prR2HoanTac.tests.ts`.
- N50 (5) "Không xử lý" khi đủ 3 vi phạm / 2 tuần: GVCN bị chặn, Head vượt sau câu hỏi, ghi `vuotLuat`; Hoàn tác 60 s (`xuLy.ts:703-760`). Lý do ≥ 8 ký tự dùng chung `CHU_TOI_THIEU` ở Ý thức, Trả lại, Case, Tutor (trừ B-2).
- N28 / N37: xoá vi phạm / Case / PA / kết quả PA chụp vào Thùng rác cùng giao dịch, khôi phục `ghiGoc` (id dùng lại không dính sang đối tượng khác), Case có PA xoá được; PA quy chế hoặc Case hệ thống với người không phải QL → thẻ `xin_xoa`; thẻ chờ tự đóng + chuông khôi phục được; xoá PA của Case đã xong không mở lại Case. Phép kiểm: `prThungRac`, `prXoaCasePa`, `prBv`.
- N69: người nghỉ → Case / PA / tín hiệu / lần xử lý nháp đứng tên chuyển về GV kỹ năng → GVCN, cùng giao dịch, có lịch sử, mỗi người nhận một tin (dedup theo (người, khoá)), không ai hợp lệ → "chưa có người". Gắn ở xoá tài khoản và gỡ hết vai (`xoaTaiKhoan.ts:264`, `accounts.ts:421`). Yêu cầu trả lại đang mở tính lại người nhận (`capNhatNguoiNhanTraLai`). Phép kiểm: `prR1.tests.ts`, `prGiaoViec.tests.ts`, `xoaDuLieu.tests.ts`.
- N35: trần 300 / 200 / 200 / 300 ép ở máy chủ cho Mô tả Case (tạo, sửa, Xác nhận Case S, SOS tự động), Nội dung PA (tạo, sửa, Điều chỉnh), Nhận xét kết quả PA (trừ Tutor, xem B-4), nhận xét MT (hai đường `attempts.ts:2228, 2348`); chữ cũ dài giữ (`vuotTran(..., cu)`). Phép kiểm: `prN35.tests.ts`.
- N41: TVV báo PH vi phạm xong → GVCN một tin `discipline_de_biet` (không vào số việc), loại trừ khỏi tin "Có kết quả" trùng (`baoPhTvv.ts:326-361`). Phép kiểm: `prGiaoViec.tests.ts`.
- N40: đợt FT mở ngày 20 / hạn 30 (tháng 2 → 28), lớp thường mở thứ Hai / hạn +8 ngày, đợt thêm mở tương lai ("sắp mở"), việc GV chỉ người có phân công, quá hạn > 7 ngày chuyển việc QL (`shared/domain/baoCaoPh.ts`, `mywork.ts:1633-1665`). Phép kiểm: `prBaoCaoPh.tests.ts`. (Chưa mô phỏng ngày biên.)
- N54 phần máy chủ: số buổi "a / b", tổng a của các dòng phải bằng số buổi đã học, 3 nút Có / Không tuỳ chọn, quyền danh bạ tutor (Head chỉ chi nhánh mình, CX chỉ đọc, dòng GV không sửa ở trang Tutor), xoá tutor có buổi bị chặn, gộp tên gõ tay một giao dịch + Hoàn tác (trừ B-5), xuất số buổi theo người dạy × tháng. Phép kiểm: `prTutor2.tests.ts`, `prTutor5.tests.ts`, `prSuaTutorP1.tests.ts`.
- N24 ③: Lộ trình mới đóng Phối hợp SOS chờ + Hoàn tác trả lại đúng (`buocTiep.ts:412, 343`) — chỉ đường chuyển lớp thiếu (B-1). N24 ④ (Xét lại chọn lớp mọi chi nhánh): `normal/xetLai.ts:271-272`.
- Không thấy N+1 mới ở các route đụng từ 21/11 trong luồng này: `loCapBac` mỗi em một giao dịch (web chia lô 4, trần ở prN70); `chuyenViecNguoiNghi` đọc cả bốn loại bằng một UNION + nhớ phân công lớp (ghi chú `ponytail:` hợp lệ, đường Quản trị hiếm).
- Chưa kiểm sâu: N8 ①–⑤ (nhắc nhận xét MT mới nhất, Xác nhận Case S chéo), N33 (giao diện), N36 (Reset bậc khi chuyển lộ trình), N24 ① — chỉ xác nhận có phép kiểm tên luật (`prMtb`, `prOv12b/12c`, `prSvNxCase`, `prCt`, `prOv13l`), chưa đọc mã từng nhánh.

**Nhóm C · Chờ duyệt + Giao việc**

- **N70 máy chủ**: khai lần đầu áp ngay (`luuKhai` `xuLy.ts:251-268`); GVCN sửa thành thẻ (`suaKhaiBac` `:270-278`, `guiSuaKhai` `:289-324`); Head / Quản trị / CX áp thẳng; một thẻ chờ mỗi em (`ux_ycd_dang_cho` + ghi đè giữ bản trước ở `du_lieu.truoc`, Hoàn tác lô khôi phục `:327-341`); "Chưa đổi gì" trả 400; ngày hoặc tháng, không tương lai (`kiemKhai` `:388-411`); hết hạn thì áp theo GVCN (`xuLy.ts:1272-1278`), thẻ tự đóng khi bậc / lộ trình đã lệch (`loaiYeuCau.ts:1024-1029`); duyệt có so-và-đổi `bacCu` + `cycleId` (`luuSuaKhai` `:361-386`); nhật ký ghi người gửi cũ thành mới.
- **N70 số liệu**: thẻ vào `demHop` / `demChip` như `y_thuc` (nhóm `y-thuc`, `hangLoat: false`, `yeuCauDuyet.ts:81`); `trangThai.ts:34,147` đọc thẻ chờ trong câu có sẵn (không thêm vòng mạng); `tocDoDuong.ts` có trần câu cho gửi duyệt.
- **N1 / N5**: `guiDeXuat` (`xuLy.ts:836-910`): Head / CX áp thẳng, GVCN gửi thẻ hạn 5 ngày, việc TVV sinh khi chốt (`chotDeXuatYThuc :1245`); thu hồi hết hạn cũng tự chốt theo GVCN (`:1281-1293`); tin "Quá hạn duyệt" chỉ sinh sau khi `d.quet` đã đóng thẻ hết hạn (`yeuCau.ts:231-238`), nên không có chuông quá hạn cho thẻ sắp tự chốt.
- **Hoàn tác / Huỷ quyết định**: một cửa `huyQuyetDinh` (`yeuCau.ts:772-830`) có chặn trùng thẻ chờ (`ux_ycd_dang_cho`), 409 nói rõ, chuông cho người gửi; `theHuyDuoc` đọc theo lô.
- **Cổng quyền Chờ duyệt**: `hopChoDuyet` / `demYeuCau` / `duyetNhieu` / `tuChoiNhieu` / `lichSuYeuCau` cùng `require_(P_DUYET anyScope)`, quyền từng thẻ theo phạm vi thẻ (`trongPhamVi` + `napTruocPhamVi`, không N+1); `nav.workApprove` dùng `boVaiCx` khớp máy chủ (CX không mở hộp). Máy chủ cho CX duyệt thẻ Ý thức qua API (`duyetDuocThe`) nhưng UI không mở hộp cho CX, đúng ghi chú `permissions.ts:945-951`, không phải lỗi.
- **Cùng nguồn số**: badge tab / chip "Tất cả" / dải Tổng quan / `demYeuCau` / hồ sơ GV (`dongYeuCauCuaToi`) đều qua `demHop` hoặc cùng hàng thẻ; `badgeTab` đếm quá hạn + hôm nay, loại S chấm chéo như đầu trang.
- **N58 / N62 / N63 ③**: người giao / người phụ trách / người theo dõi còn hiệu lực dùng chung `HOAT_DONG_O` + `conHieuLuc`; `kiemNguoiNhan` chặn giao cho tài khoản không còn vai ở chi nhánh; hạng mục chính thống đi `laHangMucCv` / `chuanHangMuc`; việc Vận hành giao chính Head / CX vào `viecGiaoChoToi(vanHanh)`; `createMgmtTask` kiểm `canSeeBoard` + `quanLyVanHanh(taskBranchId)`; nút "+ Giao việc" web lấy `nav.vanHanh = viec && canSeeBoard` (`nav.ts:60`) khớp máy chủ.
- **N59**: lặp lại (`taoViecLap`) không tạo trùng (khoá `lap_goc_id, lap_ky`), người phụ trách bản mới kiểm còn hiệu lực; `editMgmtTask` người phụ trách / người giao chỉ sửa hạn + theo dõi; lý do dời hạn tuỳ chọn; so-và-đổi `updated_at`; Hoàn tác giao đảo bản ghi chỉ người đổi + 60 giây.
- **N64 / N56 ①**: làm thay theo quyền máy chủ, không bước "Làm thay": `coTheLamMeeting`, `coTheGhi` (TVV / TVV cùng chi nhánh / CX phía TVV / Head), `coTheTraLai` khớp N61 (`traLai.ts:45-47`); người giao `laNguoiGiao` kiểm vai.
- **N61**: trả lại chặn khi Báo PH xong / bỏ / lần xử lý không còn (`traLai.ts:164-169`), UNIQUE chặn hai người trả cùng lúc, Hoàn tác người trả 60 giây + kiểm còn vai (`:212-228`), GV Hoàn tác 60 giây có `ghi_dao`, hạn Báo PH tạm dừng tính lại không rút ngắn (`dongBoTamDung :71-93`).
- **N67**: Kết quả xong thì Xếp lịch tự xong (`xong_boi = NULL`, lịch sử `tu_xong`) ở cả ba đường: ghi Kết quả (`giaoViec.ts:752-757`), mở lại Meeting (`:696-700`), migrate sinh bù (`migrate/prGiaoViec.ts:96-105`); Hoàn tác Kết quả chỉ trả phần tự xong (`xong_boi IS NULL`, `:775-781`); việc rời Công việc / quá hạn, chỉ còn ở "Đang theo dõi" trong 7 ngày vừa xong.
- **N34 hạn**: một hàm hạn hiệu lực (`hanBaoPhHieuLuc`) dùng ở panel, `viecTheoDoi`, `tongQuanTvv`, `phoiHop.tvvCuaHanhDong`; `coTheSuaHan` tách quyền ghi (`baoPhTvv.ts:180-181`); việc không hạn đặt hạn được, "Về mặc định" bỏ hạn.
- **Đang theo dõi**: một câu SQL cho cả tab, tên người theo vai MỘT câu, bỏ việc của chính mình ("Của tôi"), người đã rời chi nhánh không thấy (`HOAT_DONG_O`); đã có trần `tocDoDuong.ts:131,627`.
- **Cổng route**: `/giao-viec/*`, `/phoi-hop-sos/:id/meeting` tự kiểm trong dịch vụ (`requireDoc`); `/mgmt-tasks/:id` mở cho người phụ trách / theo dõi qua `laViecVhCuaToi` (đúng một việc, không lộ danh sách).
- **Phép kiểm**: N58 / N59 / N61 / N62 / N63 / N64 / N67 / N70 đều có phép kiểm (`prGiaoViec`, `prVanHanh`, `prHangMuc`, `prTraLai`, `prCxBpxl`, `prN70`…). Chưa khoá bằng phép kiểm: N60 (gập / mở, chỉ web), đường API `mo-lai` Xếp lịch (C-9), Huỷ quyết định thẻ sửa bậc sau lần xử lý mới (C-4), quét hết hạn có thẻ lỗi (C-7).

**Nhóm D · Số liệu cùng nguồn**
- Badge tab / chuông / ô "Của tôi" / đầu trang Công việc: một hàm `demDongViec` (bỏ S chấm chéo, dòng gộp = 1) ở server (`demSo`), web (`soCuaToi`, `badgeTab`), hồ sơ GV (`demViecTheoNhom`), hồ sơ lớp (`viecTheoEm.ts:59-60`).
- Mục cũ 21/11 đã sửa: B2-03 phần badge tab hồ sơ lớp (`ClassOverviewPage.tsx:193-199`), B2-07 badge Chấm Speaking = số bài quá hạn (`Nhan.tsx` `BadgeTabSo`), B2-08 ô Chờ chấm QL = dòng (`viecTheoEm.ts:60`), B2-11 `chuBadgeTab` nhận "yêu cầu" (`Nhan.tsx:236-240`), A1-02 hồ sơ GV n = tổng việc (`HoSoGiaoVienPage.tsx:112,171`), B2-14 đo TVV bằng TVV đông em nhất (`tocDo.run.ts:228`; chưa mở bảng số đo).
- Tổng quan V5 không đếm lại: `tongQuanV5.ts` gọi `tapDatMt`, `tapThiThangNayLop`, `tapKqMt`, `bangChiNhanh`; panel mở từ ô cùng hàm (`oBangChiNhanh`, `oBaoCao`, `oTongQuanTvv` dùng cùng `baoPhTrongKy`).
- Nợ điểm / bài quá hạn: mọi nơi qua `scoreDebtCells` (hồ sơ GV, Lịch Test, BPXL, Phân tích, Tổng quan), không có hàm đếm thứ hai.
- Múi giờ VN: `dauNgayVnUtc` ở Báo PH TVV, Case mới (`hvCuaToi.ts:98-104`); ngày xong ở `viecDaXong.ts` là cột ngày hoặc `ngayTheoGioVN` (đã soi `mo_ta_luc`, `buoc_tiep_luc` = ngày, không phải UTC thô); không còn `date('now')` / `CURRENT_DATE` trong `server/src` + `shared`.
- Case chưa có người nhận: Công việc và Tổng quan cùng `caseChuaCoNguoi` (đã có N46 + `sc.tam = 0` + HV đang học, `owner.ts:183`).
- Tốc độ: không thấy N+1 trên đường GET trong `worklist/*`, `phanTich/*`, `giaoVien/*`, `classes/viecTheoEm.ts`; hàm lớn đều theo lô (`theoLo`, `theoLoJson`, `napTruocPhamVi`, `nho`). `tocDoDuong.ts` có đường đụng từ 21/11 (`/tong-quan/v5` `gon=1&kemViec=1&cuaToi=0`, `/my-work/theo-doi`, panel Phân tích).
- Chưa kiểm: số câu / dòng đo lại sau 21/11 (không chạy mã); Phân tích GV "Theo GV" đúng hạn vs `viecDaXong` (chỉ đọc nguồn ngày xong); `lopCuaGv` / `hocVienLop` ở Tutor.

**Nhóm E · Quyền + đường lui**

- Cổng khu theo vai: `/phan-tich/*` cần `analysis.view`, `/ke-hoach-test` · `/diem-theo-lop` cần `test.view`, `/my-work` · `/mgmt-tasks` · `/meeting` · `/tasks` cần `work.view` (có ngoại lệ TVV `/my-work` và việc được giao); đường chữ hoa không lọt (`routes/index.ts:181-189`).
- Ghi bằng bản chụp trước, quyền kiểm TRƯỚC khi ghi: `hoanTacXep` (`keHoach/hoanTacLich.ts:68-72`), `hoanTacHocTiepDoiLop` (`loTrinh/buocTiep.ts:580-585`), `hoanTacLuu` phân công (`classes/phanCongGv.ts:464-486`, quyền trên MỌI ô của bản ghi, 409 khi có lần đổi mới hơn), `xoaViec` Vận hành (`mgmttasks.ts:1404-1424`, Thùng rác, chặn khi đã có cập nhật), `deleteViolation` (`violations.ts`).
- N68: mốc "30 ngày hoặc tới khi bàn giao xong, lấy muộn hơn" có MỘT hàm `xemCuDen`, dùng chung cho quyền hồ sơ HV (`permissions.ts:563`), quyền lớp cũ (`permissions.ts:148`) và dải hiển thị (`daiChuyenLop.ts:159`); GV cũ chỉ có `ATTEMPT_VIEW` + `STUDENT_VIEW` (`permissions.ts:566-569`), không có quyền ghi.
- N29: đổi phân công chuyển Case / PA đang mở có `sos_cases` / `case_interventions` chụp vào `ghi_dao` nên Hoàn tác trả lại (`phanCongGv.ts:278-283`); GVCN chỉ đổi ô bộ môn lớp mình (`:135,146`).
- N28 Thùng rác: loại `tutor`, `nhan_xet_tutor`, `viec` đã vào `LOAI_RAC` (`routes/index.ts` diff 21/11); khôi phục tutor yêu cầu `tutor.manage` (`khoiPhucRac.ts:28`).
- N54 Tutor: đọc theo `tutor.view` + phạm vi; danh bạ Head chỉ chi nhánh mình, kể cả "Chỉ online do mình tạo" (`trang.ts:53-84`); CX chỉ xem (không có `quyenDanhBa`); nhận xét / kết luận chỉ `tutor.manage`; gộp tên có Hoàn tác (`/tutors/gop/hoan-tac`).
- N63 ① ② ⑤: CX bị `boVaiCx` ở Xét lại và `coTheChotLoTrinh`; BPXL khôi phục lượt / kỹ năng chỉ khi chưa có điểm (`chanBpxlCoDiem`, `attempts.ts:1923-1925`).
- N65: "Lớp tôi dạy" không còn cho Head / Quản trị ở Lịch Test (`canCham.ts:818-819`) và Học viên & Lớp (`hocVienLop.ts:76`, `laHeadHoacQt`).
- N42: người nhập không phải GV Speaking bị buộc chọn "GV chấm" ở máy chủ (`attempts.ts:2589-2593`).
- `PUT /classes/:id/gop-y` khoá 403 có chủ ý (`routes/index.ts:1865-1867`, D14) — không phải lỗi quyền.
- Quét tay 260 đường ghi (`POST/PUT/PATCH/DELETE`) trong `routes/index.ts`: những đường không gọi `require_/can` ngay trong thân route đều gọi dịch vụ có kiểm (đã mở: `updateResult`, `hoanTacKetQua` kiểm trong `nguCanhSuaKetQua`; `luuHanMacDinh` / `luuBand` kiểm trong lớp `HAN.luu` / `KY_VONG`). Không thấy đường ghi nào hoàn toàn trần quyền. Chưa kiểm sâu: `/attachments/*`, `/cases/backfill`, `/dich`, `/xuat-mt` (quét tự động chỉ nhìn 3000 ký tự đầu hàm).
- Khoảng trống phép kiểm (không phải lỗi): chưa thấy phép kiểm cho cổng `laViecVhCuaToi` (đường HTTP), cho nút xoá tutor ở web, và cho N69 bậc Head / "chưa có người".
