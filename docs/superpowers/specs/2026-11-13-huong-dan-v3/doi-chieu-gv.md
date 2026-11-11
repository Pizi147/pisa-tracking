# HD-V3-A — Đối chiếu Hướng dẫn vai GIÁO VIÊN với mã main (13/11)

Nguồn: `shared/huongDan/gv.ts` (viết 05/11) × mã main `3fac03216`. Đối chiếu bằng route (`web/src/App.tsx`), thanh điều hướng thật (`server/src/platform/nav.ts`,
`shared/domain/dieuHuong.ts`), quyền máy chủ (`server/src/permissions.ts` `teacherAllows` :457-549; seed `server/src/seed/data.ts:88-90`) và nhãn nút trong web.
Trạng thái: **CÓ** (đúng) · **THIẾU** (việc / màn / panel chưa có) · **SAI** (trái mã / luật) · **CŨ** (nhãn, chỗ đã đổi). Cột "Sửa" = việc làm trong PR này.

Quyền GV tóm tắt: GVBM = phân công một kỹ năng; GVCN = `isCore` của lớp em đang học (`student.edit`, `discipline.manage`, `student.add` chỉ GVCN —
permissions.ts:506, :519-522); GV Speaking = có kỹ năng S (`lopFtChoGvSpeaking`). GV không có `analysis.view`, `class.edit`, `cycle.edit`, `plan.week`,
`request.approve` → không Phân tích, không Chờ duyệt, không Chuyển lớp / Cuối khoá chốt hướng / Bước tiếp, Kế hoạch Test chỉ xem.

## 1. Màn / route / tab (phép HD-ROUTE)

| Route / tab | GV vào được? (mã) | Màn trong gv.ts | Trạng thái | Sửa |
|---|---|---|---|---|
| `/` Tổng quan | mọi vai (App.tsx:380) | `tong-quan` | CÓ — ô "Việc của tôi ›" · Case đang xử lý · Đạt kỳ vọng Test · Tiến bộ (`worklist/TongQuanV5.tsx:467,490-495`), khối Kỹ năng tôi dạy · Lớp tôi chủ nhiệm (`worklist/LopToiDay.tsx:155-161`) | thêm link "Hồ sơ GV của tôi" (TongQuanV5.tsx:549) |
| `/cong-viec` (tab Hỗ trợ học viên) | `nav.work` | `cong-viec` | CŨ — "nhóm Chấm điểm / Speaking chấm chéo / Thiếu dữ liệu đánh giá", chip "⚠ quá hạn" | Công việc nay là **tab** Chấm điểm · Bài thi Speaking · Case học thuật · Ý thức & Phối hợp · Vận hành (`shared/domain/tongQuan.ts:122-126,33-35`), mục trong tab (`tongQuan.ts:133-148`); lọc = ô hạn "Mọi hạn / Quá hạn / Hôm nay / Hạn đến…" + "Lọc thêm" (`congViec/HoTroHocVienTab.tsx:489-510`) |
| `/cong-viec/yeu-cau` | `workRequests` | `yeu-cau` | CÓ | — |
| `/test`, `/test/lich` | `nav.test` | `lich-test` | CÓ (‹ W3 SEP › · Tuần này `ui/Filters.tsx:158-178`; Quá hạn chấm `KhoiNo.tsx:69`; Test tuần này `LichTestTab.tsx:370`) · THIẾU "Xuất Excel…" (GVCN, `LichTestTab.tsx:276`), Lớp tôi dạy / Tất cả, Lịch thi thật › | thêm |
| `/test/ke-hoach` | `testPlanXem` (nav.ts:45) | `ke-hoach` | CŨ — "Cần dời lịch: nhờ QL" thiếu ngoại lệ N23 (GVCN dời kỹ năng MT đã qua) + công tắc "Mở sửa lịch Test" (N15, `platform/moSuaLichTest.ts:46`); thiếu "Xuất Excel…" (`KeHoachTestTab.tsx:227`) | sửa |
| `/test/diem-lop` | đường cũ → panel (dieuHuong.ts:127-131) | `diem-lop` | CÓ (giữ cho link cũ) | — |
| `/nhap-diem/:id`, `/bang-diem-thuong/:id`, `/mock-test/:id`, `/luot-test/:id` | `nav.test` / ô điểm | `nhap-diem` | CÓ | — |
| `/hoc-vien` | `nav.students` | `hoc-vien` | SAI — "Ba góc nhìn … Cần làm": nay **Tất cả · Đang SOS · Lịch thi** (`students/StudentsPage.tsx:109,327`) | sửa |
| `/hoc-vien/lop/:id` | `nav.students` | `ho-so-lop` | CŨ — thiếu tab Ý thức & Phối hợp · Phân tích lớp · Báo cáo PH · Tổng kết (`shared/domain/hocVienLop.ts:747-752`), "tuần 5/8" (`classes/DauTrangLop.tsx:202`), ⋯ lớp của GVCN (`hocVienLop.ts:709-723`) | sửa |
| `/hoc-vien/luu-tru` | `nav.students`; link "Tìm trong HV lưu trữ ›" (`platform/Header.tsx:239`), góc Lưu trữ HV & Lớp (StudentsPage.tsx:427) | — | **THIẾU** (khớp nhầm màn Hồ sơ HV qua tiền tố `/hoc-vien/`) | thêm màn `luu-tru` (tab Lớp đã kết thúc · Học viên đã lưu trữ, `students/LuuTruPage.tsx:179-180`) |
| `/hoc-vien/:id` | `nav.students` | `ho-so-hv` | CÓ tab Học thuật · Ý thức & Phối hợp · Lộ trình & lớp (`shared/domain/hoSoHocVien.ts:24-26`) · THIẾU ⋯ GVCN: Sửa thông tin, Tạm dừng/ Kết thúc học, Quay lại học, Lịch sử; GVBM: Đề xuất sửa thông tin (`shared/domain/quanLyHocVien.ts:53-103`) | thêm việc |
| `/hoc-thuat/case/:id` | link thông báo / Công việc | — | không phải màn: chuyển sang hồ sơ HV hoặc mở riêng panel Case (`cases/CaseBoardPage.tsx:20-23`) | phép kiểm ghi lý do (VAO) |
| `/giao-vien/:id` | GV xem hồ sơ mình (`giaoVien/phamVi.ts:22-27`; menu Tài khoản `Header.tsx:353`) | `ho-so-gv` | CŨ — khối nay: dải chỉ số · Lớp đang dạy · Học thuật · Việc đang tồn · Case đang phụ trách · Yêu cầu đã gửi · "Mở Công việc ›" (`giaoVien/HoSoGiaoVienPage.tsx:121-651`) | sửa |
| `/ho-so-ca-nhan` | mọi vai | `ho-so-ca-nhan` | CŨ — menu Tài khoản: "Giao diện" Theo máy / Sáng / Tối · "Ngôn ngữ" VI / EN (`platform/CongTacGiaoDien.tsx:29-31`, `NutNgonNgu.tsx:29-32`) | sửa chữ |
| `/huong-dan` | mọi vai | `huong-dan` | CÓ | — |
| `/phan-tich` | GV không có `analysis` (nav.ts:29) | — | đúng là không có | — |

## 2. Panel làm việc (phép HD-PANEL — `PANEL_HD` + `KhungPanel hd=`)

| Panel (tệp) | GV mở? (quyền) | Trước | Sau PR |
|---|---|---|---|
| Case (`students/NganCase.tsx`) | mọi GV (Case kỹ năng mình) | CÓ `ngan-case` | giữ |
| Nhập điểm lớp (`cham/PanelNhapDiemLop.tsx`), Chấm Speaking (`congViec/PanelChamSpeaking.tsx`) | `score.edit` kỹ năng mình | CÓ `nhap-diem` | giữ |
| Nhập điểm từ Công việc (`congViec/PanelViec.tsx` `PanelNhapDiem` :250, `PanelNhapDiemTuan` :305) | như trên — lối CHÍNH của Nhập điểm | **THIẾU** (bấm "?" ra màn Công việc) | `hd="nhap-diem"` |
| Ghi kết quả PA / Kết quả cuối / Sửa kết quả (`cases/CapNhatTuan.tsx:477,644`) | `kiemQuyenPa` (`server/src/cases/cases.ts:4857`) | THIẾU | `ket-qua-pa` — Lưu nháp (:460), Lưu là lưu, không Hoàn tác (:337-342), Sửa kết quả ở thẻ PA (`cases/CasePanel.tsx:868`) |
| Phối hợp SOS (`congViec/PanelViec.tsx` `PanelPhoiHop` :447 → `yThuc/BangPhoiHop.tsx`) | GVCN (`yThuc/phoiHop.ts:680`, permissions.ts:506) | THIẾU | `phoi-hop-sos` |
| Ghi vi phạm (`yThuc/RecordViolationPanel.tsx`) | mọi GV có phân công lớp (permissions.ts:504) | THIẾU | `vi-pham` — Môn bắt buộc khi dạy ≥ 2 môn (`server/src/yThuc/violations.ts:198-202`), 1 môn tự điền (:296) |
| Xử lý vi phạm · Xem vi phạm mới · Ghi "Đã thực hiện" · Xác nhận cấp bậc (`yThuc/XacNhanXuLyPanel.tsx`, `DaThucHienPanel.tsx`, `KhaiBacPanel.tsx`, `LoYThucPanel.tsx`) | GVCN (`discipline.manage`) | THIẾU | `xu-ly-vi-pham` |
| Bàn giao (`classes/BanGiaoPanel.tsx`, `BanGiaoGvPanel.tsx`) | GVBM môn mình (2 ngày), GVCN gom + xác nhận (3 ngày) (`server/src/worklist/mywork.ts:328-329`) | THIẾU | `ban-giao` |
| Báo cáo PH · viết (`classes/TabBaoCaoPh.tsx:405`) | GV đúng phần, GVCN phần Chung (`server/src/classes/baoCaoPh.ts:35-39`) | THIẾU | `bao-cao-ph` (panel đọc :602 không gắn — chỉ xem) |
| Đề xuất chuyển lớp (`students/ChuyenLopPanel.tsx:293`) | GVCN (thaoTacDongHocVien.tsx:110) | THIẾU | `chuyen-lop` |
| Xuất Excel · Điểm Test (`test/NganXuatMt.tsx:160`, `keHoach/NganXuatKeHoach.tsx:60`) | GVCN lớp mình (`server/src/phanTich/xuatMt.ts:33-43`) | THIẾU | `xuat-excel` |
| Lộ trình mới (`students/PanelLoTrinhMoi.tsx:127`) | KHÔNG (PanelBuocTiep: GVCN chỉ đọc — `students/PanelBuocTiep.tsx:52`) | — | `lo-trinh` (nội dung: B QL, C TVV) |

Panel không gắn (giữ "?" mở Màn nền): Kết quả thi thật, Sửa thông tin, Tạm dừng/ Kết thúc học, + Học viên, Lịch sử, Tổng kết — việc ngắn, bước nằm đủ ở "Tôi muốn…".

## 3. Việc (Tôi muốn…) — một việc một lối chính

| Việc | Trạng thái | Chỗ sai / thiếu (mã) | Sửa |
|---|---|---|---|
| Nhập điểm MT · Progress · Final | CŨ | "nhóm Chấm điểm" → tab Chấm điểm, mục Mock Test / Progress / Final Test / Checkpoint; nút "Nhập điểm" (`mywork.ts:748-749`); "Lớp tiếp: {lớp} ›" (`PanelViec.tsx:291`), "Việc tiếp ›" | sửa bước |
| Nhập điểm MT cũ (GVCN) | CŨ | nhóm "Thiếu dữ liệu đánh giá" → tab Vận hành, mục Thiếu dữ liệu (`tongQuan.ts:48`, `mywork.ts:307,1420`) | sửa |
| Chấm Speaking chéo (S) | CŨ | nhóm → tab **Bài thi Speaking** (`tongQuan.ts:125`), dòng "Chấm Speaking · n bài", nút "Chấm" (`mywork.ts:810`, `DanhSachViec.tsx:204`) | sửa |
| Xác nhận Case, PA | CŨ | thiếu "Chọn PA" (`mywork.ts:1216-1220`), "Xác nhận PA cùng lúc" (`congViec/XacNhanPaLo.tsx:144-154`); mục Mô tả Case / Phương án | sửa |
| Ghi kết quả PA | **SAI** | thiếu **Lưu nháp** (CapNhatTuan.tsx:460; chip "Có nháp" `DanhSachViec.tsx:382`); Lưu là lưu, không Hoàn tác (chủ SP 13/11, CapNhatTuan.tsx:337); Sửa kết quả ở thẻ PA | viết lại |
| Tạo Case tay | CŨ | thiếu nút "+ Case" đầu Hồ sơ lớp / Hồ sơ HV (`DauTrangLop.tsx:248-251`, `StudentDetailPage.tsx:275`) | thêm lối tắt |
| Hoàn thành, mở lại, xoá Case | SAI | "⋯ › Xoá Case" → nút **Xoá Case** cuối thân Case; còn PA thì hỏi một lần nêu PA; xoá xong dải Hoàn tác (`cases/CasePanel.tsx:609-652`, N37); "Mở lại" chỉ QL / QT (:122) | sửa |
| Đổi người phụ trách Case | CÓ | `CasePanel.tsx:95` | — |
| Xem mọi Case của em | CÓ | `cases/CotCaseHv.tsx:118-132` | — |
| Ghi vi phạm | **SAI** | "hạn xử lý 5 ngày" gắn nhầm việc ghi (ghi không hạn — `violations.ts:170-174`); thiếu ô **Môn** bắt buộc khi dạy ≥ 2 môn; thiếu lối tab Ý thức & Phối hợp (`yThuc/ClassYThucCard.tsx:404`, `StudentYThucSection.tsx:244`) | sửa |
| Xử lý vi phạm (GVCN) | **THIẾU** | Công việc › Ý thức & Phối hợp › Vi phạm: "Xác nhận xử lý" · "Đã xem" · `Ghi "Đã thực hiện"` · "Xác nhận cấp bậc" (`mywork.ts:248,312-324`; `XacNhanXuLyPanel.tsx:229-255`, `DaThucHienPanel.tsx:70-88`, `KhaiBacPanel.tsx:79-87`) | thêm |
| Phối hợp SOS (GVCN) | **THIẾU** | Công việc › Ý thức & Phối hợp › Phối hợp SOS, nút "Xác nhận" (`mywork.ts:238,1325`); bảng ① Học viên ② Đã làm ③ Kết quả (`BangPhoiHop.tsx:85-87,183`); Meeting CX/GĐCN → việc TVV báo gia đình + ghi kết quả (:316) — luật chủ SP 11/11 "chỉ GVCN làm, QL theo dõi / làm thay" | thêm |
| Báo PH kết quả Test (GVCN, lớp thường) | **THIẾU** | Công việc › Case học thuật › Báo PH, nút "Phối hợp" → "Đánh dấu đã làm" (`mywork.ts:232,1290-1292`, `PhoiHopSosSection.tsx:259`) | thêm |
| Bàn giao | **THIẾU** | Công việc › Vận hành › Bàn giao: GVBM "Bàn giao môn {môn} · {lớp}" (W1 · W2 gộp — `classes/banGiao.ts:591-606`), GVCN "Bàn giao n em · {lớp}" + Nhận xét chung (`BanGiaoPanel.tsx:260`), đổi GV "Bàn giao {lớp} · {môn}" → "Xác nhận bàn giao" (`BanGiaoGvPanel.tsx:122`) | thêm |
| Viết Báo cáo PH | **THIẾU** | Hồ sơ lớp › tab Báo cáo PH › "Viết {phần} · n/N", tự lưu khi rời ô, "Lưu · em tiếp ›" (`TabBaoCaoPh.tsx:188,397-401`); Admin xuất | thêm |
| Xuất Excel điểm Test (GVCN) | **THIẾU** | Test › "Xuất Excel…" (`LichTestTab.tsx:276`, `KeHoachTestTab.tsx:227`); Hồ sơ lớp › ⋯ › Xuất Excel (`DauTrangLop.tsx:178`) | thêm |
| Đề xuất chuyển lớp (GVCN) | CÓ | `ChuyenLopPanel.tsx:260,293` | — |
| Sửa thông tin, lộ trình đang học (GVCN) | **THIẾU** | ⋯ › Sửa thông tin: Lộ trình đang học LT1 / LT2 / RF ở lộ trình FT (`StudentManagePanel.tsx:318,510-519`, chủ SP 11/11 LO-TRINH-THEO-HV); Hồ sơ lớp ⋯ › Sửa thông tin học viên (cả lớp); GVBM: "Đề xuất sửa thông tin" (`duyet/DeXuatSuaPanel.tsx:74`) | thêm |
| Thêm học viên · Dán Excel (GVCN) | **THIẾU** | Hồ sơ lớp › ⋯ › + Học viên — Dán Excel CHỈ ở đây (`students/IntakePanel.tsx:177,212-217`; chủ SP 13/11) | thêm |
| Tạm dừng/ Kết thúc học · Quay lại học (GVCN) | **THIẾU** | ⋯ hồ sơ HV (`quanLyHocVien.ts:53-103`, N11) | thêm |
| Cuối khoá lớp thường (GVCN) | **THIẾU** | Hồ sơ lớp › ⋯ › Cuối khoá…: GVCN xem hướng QL chốt + Nhận xét không bắt buộc, "Lưu nhận xét · n em" (`classes/CuoiKhoaLop.tsx:78,111`, N22 ①) | thêm |
| Ghi Mini Test (GVCN) | CŨ | còn (`mywork.ts:274`); mục Phương án tab Case học thuật | sửa chữ |
| Ghi kết quả thi thật | CŨ | việc của TVV (N6); GVCN vẫn ghi được qua ⋯ (`StudentManagePanel.tsx:78`, `server/src/loTrinh/thiThat.ts:48-57`) | sửa chữ, giữ lối |
| Xem lịch thi, xuất Excel | CŨ | góc "Lịch thi" (StudentsPage.tsx:327), nút "Xuất Excel" đầu trang (:440) | sửa |
| Xem Test tuần này | CÓ | — | thêm lọc Lớp tôi dạy |
| Xem việc của bạn | CŨ | nhóm → tab; "✓ n xong hôm nay" (`HoTroHocVienTab.tsx:465`) | sửa |
| Xem chuông | **THIẾU** | chuông V2: khối "Việc cần làm" (mỗi loại việc một dòng, ⚠ quá hạn, "Công việc ›") + "Cập nhật" (Đánh dấu đã đọc) (`platform/HopChuong.tsx:190-213`, `shared/domain/chuong.ts`) | thêm |
| Theo dõi yêu cầu | CÓ | — | — |
| Xem số của bạn | CÓ | thêm "Hồ sơ GV của tôi" | lối tắt |

## 4. Luật và hạn, thuật ngữ

| Mục | Trạng thái | Sửa |
|---|---|---|
| Hạn chấm, Hạn Xác nhận PA, Hạn Ghi kết quả PA, QL trả lời, Dấu "-" | CÓ | — |
| SOS và Case · Case tạm | CŨ — luật SOS-TAM-PA #1366: SOS tạm GV sửa mô tả + đặt / sửa PA; chốt: PA cùng loại quy chế giữ, khác → việc "Chọn PA" (Theo quy chế / Giữ PA của tôi) → QL duyệt 3 ngày, quá hạn tự duyệt | sửa |
| Kết thúc PA sớm | SAI — "⋯ › Kết thúc PA", "từ 10 ký tự" → "Kết thúc sớm…" ở thẻ PA (`CapNhatTuan.tsx:585`), ≥ 8 ký tự (`CHU_TOI_THIEU_CASE`, `shared/domain/cases.ts:538`) | sửa |
| Bàn giao khi em chuyển lớp | CŨ — hạn GVBM 2 ngày · GVCN 3 ngày tính cả ngày ra quyết định (`mywork.ts:329`); kỹ năng vẫn đúng GV cũ dạy → không bàn giao (N29) | sửa |
| Hạn Xử lý vi phạm | CŨ — xử lý khi em có ≥ 3 vi phạm trong tuần này + tuần trước, 5 ngày tính cả ngày ghi (`mywork.ts:312-313`) | sửa |
| Sửa điểm sau hoàn tất | CÓ | — |
| Nhận xét MT | CÓ (≥ 10 ký tự nhắc — `shared/domain/nhanXet.ts:30`); thêm trần 300 ký tự (N35) | thêm |
| Thuật ngữ | THIẾU "Lớp thường: tuần 5/8", "Có nháp" | thêm |
| Việc vai khác | THIẾU "Chọn bước tiếp sau thi" (TVV), "Chốt hướng Cuối khoá" (QL), "Xuất báo cáo PH" (Admin) | thêm |

## 5. Tóm tắt số

- Việc (Tôi muốn…): 18 → **29** — **thêm 11** (Báo PH kết quả Test, Xử lý vi phạm, Phối hợp SOS, Bàn giao, Sửa thông tin / lộ trình, Thêm học viên · dán Excel,
  Tạm dừng / kết thúc / quay lại học, Cuối khoá lớp thường, Xuất Excel điểm Test, Xem chuông, Viết Báo cáo PH) · **sửa 15** · **bỏ 0**.
- Màn: thêm 1 (Lưu trữ) + 8 mục panel mới (`p-ket-qua-pa`, `p-phoi-hop`, `p-vi-pham`, `p-xu-ly`, `p-ban-giao`, `p-bao-cao-ph`, `p-chuyen-lop`, `p-xuat`); sửa 12.
- Luật: sửa 6 (Hạn Ghi kết quả PA, Hạn Xử lý vi phạm, SOS và Case, Kết thúc PA sớm, Bàn giao, Nhận xét MT). Thuật ngữ: sửa 2, thêm 1 (Nháp kết quả PA). Việc vai khác: thêm 3.
- Không đụng luật nghiệp vụ; không đổi bố cục panel "?" / trang `/huong-dan`; 0 câu Turso (dữ liệu tĩnh).
