# Muốn sửa chức năng X thì tìm ở đâu?

Tài liệu này để trả lời đúng một câu hỏi: *"tôi muốn đổi chỗ này, phải mở file nào."*

> **BẮT BUỘC CẬP NHẬT.** Xoá hoặc đổi tên một file thì sửa file này **trong cùng commit**.
> Một đường dẫn chết ở đây đắt hơn là không có dòng nào: người đọc tin nó, mở ra không thấy,
> rồi đi tìm tay — mất đúng cái thời gian mà tài liệu này sinh ra để tiết kiệm.
>
> Kiểm nhanh mọi đường dẫn trong file này còn sống hay không:
>
> ```bash
> grep -oE '`[a-zA-Z0-9_./-]+\.(ts|tsx|sql|md)`' CODE_MAP.md | tr -d '`' | sort -u | while read -r f; do [ -e "$f" ] || echo "CHET: $f"; done
> ```

---

## Tra theo MÀN HÌNH — dành cho người không đọc code

Nếu bạn nghĩ theo "cái tôi thấy trên màn hình" chứ không theo tên module, bắt đầu từ bảng này.

| Trên màn hình | File chính | Dữ liệu từ |
|---|---|---|
| **Học viên & Lớp** (một trang, nhóm theo lớp, chip lọc, Phạm vi) | `web/src/modules/students/StudentsPage.tsx` → `BangHocVienLop.tsx` | `GET /hoc-vien-lop` → `server/src/classes/hocVienLop.ts` |
| **Trước / Sau** ở hồ sơ học viên và hồ sơ lớp (PR-DH) — danh sách vừa mở đi qua `location.state.ds` + `sessionStorage`, mở link thẳng thì lớp của em A→Z | `web/src/ui/ThanhTruocSau.tsx` · `shared/domain/dieuHuongHoSo.ts` (`keBen`, `docNguCanhDs`) · gọi ở `StudentDetailPage.tsx`, `DauTrangLop.tsx`; link mang `state.ds` ở `BangHocVienLop`, `ClassRoster`, `BangDiemLopThuong`, `StudentsPage` | `GET /classes/:id/roster` · `GET /hoc-vien-lop` (danh sách dự phòng) |
| **Điểm theo lớp** (PR-DL) — mã lượt `mt:N` · `thuong:progress|final`, lượt mở sẵn, nhãn lượt | `shared/domain/diemTheoLuot.ts` (`docMaLuot`, `vietMaLuot`, `luotMacDinh`, `nhanMaLuot`, `dongPhuLuot`, `oTrongLuotFt`, `hangThuongConTrong`) · web: `web/src/modules/cham/DiemTheoLop.tsx` (bảng một lượt dùng chung, thanh lượt, hàng mờ chưa có lịch, "Chỉ ô còn trống"; đường API `duongDiemTheoLuot` ở `LuoiChamLop.tsx`) · hai lối vào: `web/src/modules/test/TabDiemLop.tsx` (Test › Điểm theo lớp `/test/diem-lop?lop=`, danh sách lớp + số ô trống; < md thành ô chọn lớp) và khối thu gọn cuối hồ sơ lớp `KhoiDiemLop` ở `ClassOverviewPage.tsx` (⋮ "Điểm MT cả lớp" mở và cuộn tới; cờ `viewer.coTheXemDiem` = `coTheXemLuotCham` ở `permissions.ts`) | `server/src/cham/diemTheoLuot.ts` → `danhSachLuot` (`GET /classes/:classId/diem-theo-luot`) · `bangTheoLuot` (`GET /classes/:classId/diem-theo-luot/:luot`, gọi lại `chamSheet`) · `lopCuaToi` (`GET /diem-theo-lop/lop`) — chỉ đọc; phép kiểm `server/src/tests/prDl.tests.ts` |
| Ô **Sắp tới** của Học viên & Lớp (`MT2 · W3 OCT · 5.5` · `MT2 · chưa xếp` · `Thi thật · …`) | `shared/domain/sapToi.ts` (`chuSapToi`) · `BangHocVienLop.tsx` | `server/src/students/standing.ts` (`nextKyVong`, `nhanLuotChuaXep`) |
| **Khung 4 khu vực**, thanh dưới điện thoại, chuyển hướng đường dẫn cũ | `web/src/App.tsx` + `shared/domain/dieuHuong.ts` | `server/src/platform/nav.ts` → `navOf` |
| Test › **Lịch Test** — lối vào "Chấm điểm" (PR-UX1 gộp tab Cần chấm cũ; `/test/can-cham` tự chuyển về đây): dải số ba ô · ba khối (PR-LT3): khối 1 "Test quá hạn chấm" (theo hôm nay, lưới mở dưới dòng là mục con) · khối 2 "Test chấm tuần này" (tuần trước + hạn riêng) · khối 3 "Lịch Test" tuần đang xem; một bài đúng một khối (`khoiCham` ở `shared/domain/chamDiem.ts`) | `web/src/modules/test/LichTestTab.tsx` + `web/src/modules/test/lichTest/` (`DaiSo.tsx` · `KhoiNo.tsx` · `HangLop.tsx` · `LuoiNhung.tsx` · `moLop.ts` · `kieu.ts`) | `server/src/cham/canCham.ts` → `lichTest` · `noQuaHan` (khối 1) · `hangLopTuan` (khối 2, 3) (`GET /cham/lich-test?periodId&branchId&phamVi&classId`) — MỘT lời gọi đủ cho cả màn; phép kiểm `server/src/tests/prLt3.tests.ts` |
| Test › **Kế hoạch Test** — CHỈ Quản lý: mỗi đợt xếp riêng **L · R · W · S** (ô cùng tuần gộp chip `L R W S · W3 SEP`), lưới học viên × đợt dùng chung cho lớp FT (mỗi ô đợt = Ô MT `OMt`, bấm mở hộp một đợt) và lớp thường (chip kỹ năng; Giữa khoá · Cuối khoá, cạnh tuần ghi `W5/10`), tìm lớp, hộp kỹ năng neo cạnh chip, xếp lịch hàng loạt (xem trước, lưu theo em, giữ hàng lỗi) | `web/src/modules/test/KeHoachTestTab.tsx` (`web/src/modules/test/keHoach/`: `TimLop.tsx` · `LopKeHoach.tsx` · `LuoiKeHoach.tsx` · `ChipKyNang.tsx` · `HopKyNang.tsx` · `HopXacNhanHuyLich.tsx` (PR-LM: xác nhận huỷ lịch lượt bị vượt; PR-MTb: cũng có `HopKhoiPhucKetQua`) · `TuanNho.tsx` · `NganXepHangLoat.tsx` · `kieu.ts`) | `server/src/keHoach/keHoachTest.ts` (`GET /ke-hoach-test/lop`, `/ft/:classId`, `/thuong/:classId`; `POST /dot/kiem`, `/dot`, `/xep-moi`, `/hang-loat`) — Kế hoạch Test xếp theo từng kỹ năng, **chỉ gọi lại** `createAttempt` / `setSkillWeek` / `setSkillSkip` / `planRegularTests`, không dựng đường ghi lịch thứ hai; luật thuần (gộp chip, nhãn tuần khoá, tóm tắt hàng loạt) ở `shared/domain/keHoachTest.ts` |
| **Hồ sơ lớp** (đầu trang, 3 tab, ⋮) | `web/src/modules/classes/ClassOverviewPage.tsx` → `DauTrangLop` · `TabHocVienLop` · `PhanTichLopTab` | `/classes/:id/overview` · `/roster` · `/phan-tich-lop` · `PATCH /thong-tin` |
| Menu ⋯ dòng học viên (Hồ sơ · + Ghi nhận vi phạm · + Case · Nhập điểm) | `web/src/modules/classes/thaoTacDongHocVien.tsx` + `shared/domain/hocVienLop.ts` (`mucMenuDongHocVien`) | — |
| Luật hiển thị Học viên & Lớp (kết quả gần nhất hai dòng, khoá, badge lớp theo vai, chip, nút chính đầu hồ sơ lớp) | `shared/domain/hocVienLop.ts` (`ketQuaGanNhat`, `badgeLop`, `demLoc`, `nutChinhDauTrang`) | `server/src/classes/dongHocVien.ts` (`viecHocVienTheoLop`) |
| **Việc tiếp theo** của em — MỘT nguồn cho cột Việc tiếp theo, cột Theo dõi (bảng điểm FT) và Cần hỗ trợ; `tachViecChung` → hàng "Cả lớp" (PR-HVL) | `shared/domain/hocVienLop.ts` → `viecTiepCuaEm` (gọi nguyên `viecTiepCuaCase` của `sosV4.ts`) · `web/src/ui/ViecTiep.tsx` · `duongViecTiep` ở `thaoTacDongHocVien.tsx` | `server/src/cases/caseLop.ts` → `chiTietCaseMo` (Case mở theo lô: trạng thái v4 + việc tiếp + PA, số câu SQL cố định) |
| **Cần hỗ trợ theo kỹ năng** (mỗi em một khối, hàng L R W S / G+V P / Tổng hợp, Ngăn Case tại chỗ) (PR-HVL M4) | `web/src/modules/classes/BangCanHoTro.tsx` · `shared/domain/hocVienLop.ts` → `hangCanHoTro` · `sapEmCanHoTro` | `GET /classes/:id/can-ho-tro` → `server/src/classes/canHoTro.ts` (`canHoTroLop`) |
| **Phân tích lớp** mở một kỹ năng: hai bảng nhỏ Vấn đề + Hiệu quả PA, số bấm được; dòng "Cả bài" lớp thường (PR-HVL M5) | `web/src/modules/classes/ClassIssueBoard.tsx` (`VanDeKyNang`) · `PhanTichLopTab.tsx` | `server/src/cases/effectiveness.ts` → `issueBoard` (`tong`, `plans[].ids`) · `GET /classes/:id/issue-board/o` → `phanTichLop.ts` → `oPhanTichLop` |
| **Thẻ điện thoại** thay bảng < 640 px (D2; PR-UXD dùng lại cho Mock Test / Kết quả kiểm tra) | `web/src/ui/TheDong.tsx` (`TheDong`, `useDienThoai`) | — |
| Bộ demo H1–H4 (PR-HVL) | `server/src/seed/hvlSeed.ts` | `buildHvlDemo` sau `buildXlmtDemo` ở `seed.ts` |
| **Hồ sơ một học viên** (đầu hồ sơ, bốn ô số, hai tab dưới) | `web/src/modules/students/StudentDetailPage.tsx` | `server/src/students/profile.ts` |
| Bảng kỹ năng trong hồ sơ · **ô điểm bốn màu** | `web/src/modules/cases/SkillBoard.tsx` → `ScoreCell` | `server/src/cases/cases.ts` → `skillSupportBoard` |
| **Thẻ case** và từng khối phương án ba phần trong hồ sơ (PR-HV Q8) | `web/src/modules/cases/SkillBoard.tsx` → `TheCase` · `KhoiPhuongAn` | `server/src/cases/cases.ts` → `caseCardOf` |
| **Ghi kết quả PA** (cập nhật tuần 5 mục; Giữ nguyên / Điều chỉnh / Thay / Kết thúc) | `web/src/modules/cases/CapNhatTuan.tsx` → `CapNhatTuanForm` | `server/src/cases/cases.ts` → `updateResult` · PR-SO: PA đại diện nhóm Bổ trợ (Tổng quan `pa-can-cap-nhat` = Công việc) `shared/domain/daiDienBoTro.ts` → `daiDienNhomBoTro` |
| **Lịch sử điều chỉnh PA** (bản cũ · khi nào · ai · vì sao) | `web/src/modules/cases/CapNhatTuan.tsx` → `LichSuDieuChinh` | `server/src/cases/planRevisions.ts` |
| Tab **Hành trình** — một lưới trải rộng, chuỗi điểm ▲▼ trong cột tên, màu ghim N-1b, Xem gọn (PR-Qb, PR-UX5) | `web/src/modules/students/HanhTrinh.tsx` · `NganCase.tsx` · `web/src/lib/cuonOnDinh.ts` (`?dot=` cuộn ổn định) | `server/src/students/hanhTrinh.ts` · `shared/domain/hanhTrinh.ts`, `duongHoSo.ts` |
| **Ngăn Case một panel (PR-UX3)** — `NganCase` là MỘT `KhungPanel` đổi nội dung theo `ViewCase` (`case` · `ghi-ket-qua` · `them-pa` · `hoan-thanh` · `tra-loi`), có dòng "← Case Listening"; mở từ Hồ sơ HV (`?case=&pa=&viec=ghi-ket-qua`), Hành trình, Việc cần làm, bảng Case, Phân tích | `web/src/modules/students/NganCase.tsx` · `cases/CasePanel.tsx` (`ThanCase`, trang `/hoc-thuat/case/:id`) · `cases/CapNhatTuan.tsx` (`GhiKetQuaPanel`) · `cases/ThaoTacCase.tsx` (`ThemPaPanel`, `HoanThanhCasePanel`, `TraLoiDeXuatPanel`) · `cases/SkillBoard.tsx` (bảng hàng lớn/nhỏ, `onMoCase`) · `web/src/ui/ChonNgay.tsx` (`ChonNgayGan`, `ChonTuan`, `ChonThang` — lớp bọc `ONgay`) · `ui/ViecTiep.tsx` | `shared/domain/chonNgay.ts` (`dsNgayGan`, `dsTuan`, `cuoiTuan`, `dsThang`, `nhanDotNgan`) · `shared/domain/quanLyHocVien.ts` (`mucQuanLyHocVien`, menu ⋮) · `cases.ts` (`PLAN_DECISION_NGAN/NGHIA`, `NUT_LUU_KET_QUA`) · `duongHoSo.ts` (`viec`) · `cases/cases.ts` (`performerUserId`) | phép kiểm `server/src/tests/panelUx3.tests.ts` |
| Thông báo trên thanh đầu, mở đúng chỗ theo loại — PR-VAI-a: hai nhóm Cần làm / Để biết (`nhomThongBao`), giờ, dòng "bấm tới đâu" (`noiDenThongBao`), Đọc hết (`POST /notifications/doc-het`), điện thoại neo hai mép | `web/src/modules/platform/Header.tsx` · `shared/domain/duongHoSo.ts` | `server/src/platform/thongBao.ts` (`thongBaoCua`, `docHet`) |
| Màn một lượt Test (chọn đợt khác cạnh tiêu đề; nút nhập điểm mở lưới đúng tuần của đợt) | `web/src/modules/fasttrack/MockDetailPage.tsx` | `server/src/fasttrack/attempts.ts` → `attemptDetail` |
| **Bảng nhập điểm cả lớp** — một lưới cho hai loại lớp, máy chủ trả `mode` | `web/src/modules/cham/ChamDiemPage.tsx` (lưới dùng chung cho trang này và Lịch Test: `web/src/modules/cham/LuoiChamLop.tsx`; `web/src/modules/cham/LuoiFT.tsx` · `web/src/modules/cham/LuoiThuong.tsx`; điện thoại `web/src/modules/cham/MotKyNang.tsx`) | `server/src/cham/canCham.ts` → `chamSheet` (`GET /classes/:classId/cham`) |
| **Công việc** (3 tab: Hỗ trợ học viên · Vận hành · Báo cáo đơn vị, PR-Ra) | `web/src/modules/congViec/CongViecPage.tsx` (bọc `HoTroHocVienTab.tsx` · `worklist/MgmtTasksPage.tsx` → `TasksBoard`/`NganViecVanHanh` · `worklist/MeetingPage.tsx` → `MeetingBoard`) | `worklist/mywork.ts` (`nguoi`, `nhacViec.ts`) · `worklist/mgmttasks.ts` · `worklist/meeting.ts` · luật thuần `shared/domain/congViec.ts` (lọc nhanh, hàng số Vận hành, trạng thái báo cáo; PR-GVa: `giaTriDauGiaoViec`, `trangThaiKyGiao`, `duocGiao` của form Giao việc — vỏ `CreateTask` mount lại `CreateTaskForm` mỗi lần mở) · nâng cấp `migrate.ts` → `migrateCongViec` |
| **Tổng quan theo vai** (PR-VAI-a, mockup 23) — QL tab "Việc hôm nay": tầng 1 dải Chờ duyệt (theo chi nhánh) + Cần xử lý 5 cột (trạng thái · việc · Người giữ việc · Hạn · nút; gộp hai khung; 4 việc "của Bạn"); tầng 3 Số liệu theo công tắc FT · Lớp thường (4 ô, Điểm đáng chú ý, Lịch sắp tới, bảng chi nhánh). GV: Việc của tôi · hôm nay (`trongKhoiHomNay`) · Yêu cầu của tôi · Lớp tôi dạy; điện thoại 3 việc + Xem hết; badge việc quá hạn (`/my-work/dem`) | `web/src/modules/worklist/OverviewPage.tsx` · `KhoiCanXuLy.tsx` (DaiChoDuyet, DiemDangChuY) · `ViecCuaToi.tsx` (YeuCauCuaToi) · `LopToiDay.tsx` · `MetricTiles.tsx` · `Highlights.tsx` | `server/src/worklist/tongQuan.ts` (`tongQuanQuanLy`, `diemChuY`, `lopToiDay`, `oLopToiDay`) · `bangChiNhanh.ts` · `metrics.ts` (metricSet + chương trình, `lop-thieu-gv-mon`, `van-hanh-can-quyet-dinh`, `hv-chua-co-lenh-chuyen`, `hv-ft-xong-mt-cuoi-chua-mt-ke`, `hv-len-ft-chua-ky-vong`) |
| Dòng tín hiệu SOS lớp thường (Tạo Case / Bỏ qua) | `web/src/modules/worklist/DongTinHieu.tsx` → `QuickReport.tsx` | `/signals/pending/:id/dismiss` · `/cases/report` |
| Lọc chương trình Lớp thường / FT cho mọi chỉ số | `shared/domain/tongQuan.ts` | `server/src/worklist/chuongTrinh.ts` |
| **Phân tích** (5 góc nhìn — Tổng hợp Test + SOS · Tổng hợp vấn đề HV · Hiệu quả PA · Ý thức & Phối hợp; Danh sách Case bỏ ở PR-Pb2-a) | web/src/modules/phanTich/{PhanTich,TongHopTestSos,TongHopVanDeHv,HieuQuaPa,YThucPhoiHop,dungChung}.tsx | server/src/phanTich/{tongHop,vanDeHv,hieuQuaPa,yThucPhanTich,phamVi}.ts · shared/domain/phanTich.ts · cases/effectiveness.ts |
| Hàm chung ngày/tuần G-6 (`ngay`, `tuanLich`, `tuanKhoa`) | `shared/domain/hienThiNgay.ts` | — |
| Form **+ Case** | `web/src/modules/cases/QuickReport.tsx` | `server/src/cases/cases.ts` → `reportIssue` |
| Màn một case đầy đủ | `web/src/modules/cases/CasePanel.tsx` | `server/src/cases/cases.ts` → `caseDetail` |
| Trang đăng nhập và vào nhanh bằng tài khoản demo | `web/src/modules/platform/WelcomePage.tsx` | `server/src/platform/accounts.ts` |

## Tài liệu nào để làm gì

| File | Dùng khi nào |
|---|---|
| **`plan.md`** | **Kế hoạch duy nhất** (04/10): đã làm, việc còn lại, thứ tự đợt, model + effort, skill, prompt cho session code và mẫu giao agent |
| `CODE_MAP.md` | File này — muốn sửa chỗ nào thì mở file nào |
| `DEMO.md` | Mở hồ sơ nào để xem tình huống nào (Ý thức v4 a–m + kịch bản học thuật) và những điều đã chốt / còn treo |
| *(bốn nhóm file bàn giao và tham chiếu cũ)* | **ĐÃ XOÁ 21/09/2026:** BAN\_GIAO (bốn file), PISA\_Design\_Master\_Reference, PRODUCT\_DEMO\_SPEC, thư mục vong4. Đã bị `thiet-ke/` thay hẳn. `plan.md` mục 1.2 đã cảnh báo chúng là "lịch sử, không phải luật" — giữ lại chỉ tạo rủi ro đọc phải luật cũ. Cần tra lại thì dùng `git log` |
| `thiet-ke/PISA-Rulebook-2026-09-19.md` | **Luật sản phẩm** do chủ sản phẩm chốt. **Mục 20 (02/10, đã đối chiếu code) ưu tiên hơn mọi mục**; mục 18 (21/09) ưu tiên hơn mục 17; mục 17 ưu tiên hơn mọi mô tả cũ mâu thuẫn |
| `thiet-ke/SOS_VA_PHOI_HOP_V3.md` | **Mới nhất (tối 21/09).** SOS tự tạo case + điền sẵn phương án, Phối hợp SOS, xoá vi phạm, bố cục `Ý thức & Phối hợp`. Thắng `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` ở chỗ khác nhau |
| `TRIEN_KHAI.md` | Đưa bản chính lên Netlify + Turso (miễn phí), sao lưu, quay lại bản cũ |
| *(prompt, lộ trình, kiểm kê, rà soát cũ)* | **ĐÃ XOÁ 04/10/2026:** `PROMPT_SESSION_CODE.md`, `PROMPT_BAN_GIAO_PLANNING.md`, `vong7/`, kế hoạch của PR đã merge, `docs/superpowers/reviews/`, các file kiểm kê — gộp vào `plan.md`. Tra lại bằng `git show 575e898d:<đường dẫn>` |
| `thiet-ke/NGUON-Rule-Y-thuc-2026-09-21.md` | **Nguồn mới nhất** do chủ sản phẩm gửi 21/09/2026: bỏ hẳn mô hình Case Ý thức |
| `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` | Đặc tả Ý thức **v3 (lịch sử)** — từ PR-YT4 luật theo đặc tả 27/09 §5.4–§5.8 (khối đầu file) |
| `thiet-ke/BAN_DO_OVERHAUL.md` | **Yêu cầu nào của design plan đã có, cái nào chưa, PR nào làm.** Đọc trước khi tưởng "chỉ còn vài việc dọn" |
| `thiet-ke/PISA-Design-Plan-after-PR28.md` | **Đặc tả thiết kế** sau PR28; mục 17–22 là bản mới nhất. Đọc kèm `thiet-ke/BAN_DO_OVERHAUL.md` để biết mục nào hết hiệu lực |
| `thiet-ke/HE_GIAO_DIEN.md` | Trước khi dựng bất kỳ màn nào — token, component dùng chung, bốn trạng thái dữ liệu, mobile, bàn phím |
| `thiet-ke/HOP_DONG_SO_LIEU.md` | Khi code một con số trên dashboard/báo cáo — chỉ số đó nghĩa là gì, bấm vào ra tập nào |
| `thiet-ke/TU_DIEN_VA_CHU.md` | Khi viết hoặc sửa chữ tiếng Việt trên giao diện |
| `thiet-ke/CHU_CAN_SUA_2026-10.md` (+ `-a-…`, `-b-…`, `-c-…`, `-d-…`) · `scripts/quet-chu.mjs` | **Danh sách chữ tiếng Việt chối tai (10/2026)**: 602 mục theo màn, mỗi mục có `file:dòng`, ai thấy, vì sao chối, cột "Đề xuất" để trống cho người/AI điền; session sửa chữ đọc file chính (mục 0–4) rồi file con. Script chạy lại quét chữ trong mã (`node scripts/quet-chu.mjs > chu-tho.jsonl`, không nằm trong `npm run check`) |
| `thiet-ke/LUAT_CHO_CHOT.md` | Khi chạm một luật mà chủ sản phẩm chưa trả lời (C01–C09) |

Hệ thống chia theo **nghiệp vụ**, không chia theo kỹ thuật. Cùng một module thì cả phần dữ
liệu, phần giao diện và phần kiểm thử nằm cạnh nhau, để sửa một chức năng không phải đi tìm
ba nơi.

---

## Chín module

> **Module thứ chín — `Ý thức` — CÓ MÁY CHỦ TỪ PR-J (21/09/2026), giao diện là PR-K.** Đặc tả ở
> `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md`. Nó thay hẳn phần Ý thức từng nằm nhờ trong module
> **Case** (mô hình "Case Ý thức" đã gỡ). Lý do tách: `server/src/cases/cases.ts` đã **3033 dòng**;
> nhồi thêm hai vòng đời nữa vào đó là cách chắc chắn nhất để không ai sửa được nó nữa.

| Module | Trả lời câu hỏi | Máy chủ | Giao diện |
|---|---|---|---|
| **Học viên** | Em này là ai, đang học gì, đã đi qua những đâu | `server/src/students/` | `web/src/modules/students/` |
| **Lớp học** | Lớp nào, ai dạy, ai đang học, chuyển lớp thế nào | `server/src/classes/` | `web/src/modules/classes/` |
| **Fast Track** | Tuần Mock Test, điểm band, mức SOS, dự kiến thi | `server/src/fasttrack/` | `web/src/modules/fasttrack/` |
| **Normal** | FOU/BE/ELE, bốn môn L/R/W/S, điểm đạt/tổng điểm, chuyển tiếp lớp | `server/src/normal/` | `web/src/modules/normal/` |
| **Case** | Vấn đề **học thuật** của em, phương án, phê duyệt, kết quả | `server/src/cases/` | `web/src/modules/cases/` |
| **Ý thức** | Em vi phạm gì, đã xử lý bằng phương án xử lý nào, bằng chứng đâu; **Phối hợp SOS** của GVCN sau Mock có SOS (`server/src/yThuc/phoiHop.ts`, PR-T) | `server/src/yThuc/` | `web/src/modules/yThuc/` — tab Ý thức & Phối hợp của hồ sơ học viên (`StudentYThucSection.tsx`) và hồ sơ lớp (`ClassYThucCard.tsx`); thẻ lượt Phối hợp `TheSos` (trong `PhoiHopSosSection.tsx`); hộp chỉ đọc một lần xử lý `XemXuLyPanel.tsx` |
| **Tổng quan và công việc** | Ai phải làm gì, cả chi nhánh đang thế nào | `server/src/worklist/` | `web/src/modules/worklist/` |
| **Nền tảng** | Tài khoản, quyền, tuần, danh mục, nhật ký thay đổi | `server/src/platform/` | `web/src/modules/platform/` |
| **Dùng chung** | Badge, nút, panel, bảng, chọn tuần; hàng tab gạch chân `HangTab.tsx`, ô số nhỏ `OSoNho.tsx`, dòng thời gian lưới `DongThoiGian.tsx` (PR-HV) | — | `web/src/ui/` |
| **Nền giao diện (PR-UX0)** — token màu nghĩa **một chỗ**: `web/src/index.css :root` (`--ok/bad/late/soon/doing/done/wait/muted-rgb` + `-bg`/`-line`, alias kết quả Test `--dat/--sos1/--sos2/--sos3`, hàng lớn/con `--hang-*`, ô sửa/đọc `.o-sua/.o-doc`); `tailwind.config.js` ánh xạ (`text-ok`, `bg-bad-bg`, `border-late-line`) và ghi đè `rose/amber/sky/emerald-200/300`, `slate-400/500` | `web/src/ui/Nhan.tsx` (`Nhan`, `QuaHan`, `toneNhanTuBadge`) · `HangNhom.tsx` (`HangNhom`, `HangCon`, `KhoiNhom`, `MuiTenMo`) · `KhungPanel.tsx` (`KhungPanel`, `Khoi`, `Truong`, `Hang2`, `khoPanelChung`) | `shared/domain/mauNghia.ts` (`docMauCss`, `tuongPhan`) · `shared/domain/khoPanel.ts` (`taoKhoPanel`, một panel một lúc) · `display.ts` `deadlineView` (mảnh hạn) · `worklist/mywork.ts` (`tieuDe`, bỏ `overdueLabel`) | `web/src/ui/` · phép kiểm `server/src/tests/nenGiaoDien.tests.ts` |
| **Giao diện sáng/tối, phông, cỡ chữ (PR-SANG — T15, T16, YC-7, E4)** — hai khối token ở `web/src/index.css`: `:root` = Tối (mặc định), `:root[data-theme="light"]` = Sáng; `tailwind.config.js` ánh xạ MỌI cấp màu Tailwind còn dùng (`slate-100…700`, `white`, `ink-800/950`, `teal-*`, `rose/amber/sky/emerald-*`) về biến (`--chu-*`, `--chu-mo*`, `--phu-rgb`, `--chon-*`, `--nut-hover`, `--o-nhap-*`, `--cuon*`, `--o-sua-focus`, `--accent-ink-rgb`) nên ~830 chỗ gọi tự đổi theo chế độ; phông `--font-sans` = Be Vietnam Pro (`@fontsource/be-vietnam-pro` nạp ở `main.tsx`) + chữ số 0–9 từ Inter (`@fontsource/inter`, `@font-face` `unicode-range` trong `index.css`); script nội dòng ở `index.html` đặt `data-theme` trước khi vẽ; sàn chữ 11 px, kết quả/hạn/trạng thái 12 px, `Nhan` 11,5 px | `web/src/ui/CongTacGiaoDien.tsx` (nút ◐ ở `platform/Header.tsx`, giữa Thông báo và tài khoản) | `shared/domain/mauNghia.ts` (`docKhoiCss`, `docMauHaiCheDo`, `CHE_DO_KHOA`, `docCheDo`) | `web/src/index.css` · `tailwind.config.js` · `index.html` · phép kiểm `server/src/tests/prSang.tests.ts` (S1–S9; `nenGiaoDien.tests.ts` N-1 đọc khối `:root`) |
| **Thành phần chung PR-NEN** — ô ngày thống nhất (gõ `dd/mm/yyyy` + lịch tự vẽ, "Gần đây"), ô "Khác" (Ghi rõ ≥ 3 ký tự), nút đang chọn, bộ lọc nút đoạn, sáu nhãn trạng thái, giữ/trả focus trong panel · Modal · lịch; Esc chỉ đóng lớp trên cùng; "Bỏ qua tới nội dung" (`App.tsx`) · luật ở `thiet-ke/HE_GIAO_DIEN.md` §3, §9, §10 | `web/src/ui/ONgay.tsx` (`ONgay`) · `LichNho.tsx` (`LichNho`, portal) · `OKhac.tsx` (`OKhac`) · `giuFocus.ts` (`useGiuFocus`) · `ui.tsx` (`NutChon`, `BoLocDoan`, `NhanTrangThai`) · `KhungPanel.tsx` (thêm `rong="toan"`, `chan.huy.disabled`; Esc không đóng panel khi Modal đang mở trong nó) · `ChonNgay.tsx` (`ChonNgayGan`/`ChonTuan`/`ChonThang` — lớp bọc `ONgay`; `NgayDoiDuoc` đã xoá) · `Filters.tsx` (`WeekPicker` dùng `LichNho`) · `Drawer.tsx` (`Modal` có tên qua `aria-labelledby`, `ConfirmDialog`; hàm `Drawer` đánh dấu bỏ — chỉ còn `classes/TransitionPanel.tsx`, `classes/ClassCreatePanel.tsx` chờ PR-LOP) · `MenuDong.tsx`, `PeoplePicker.tsx` (`ChonNguoi` mở danh sách ngay), `platform/Header.tsx` (phím) | `shared/domain/oNgay.ts` (`docONgay`, `loiKhoangNgay`, `hienONgay`, `phuONgay`, `goiYGanDay`, `luoiThang`, `chotONgay`, `canDongBoONgay`) · `khac.ts` (`KHAC_TOI_THIEU`, `laKhac`, `kiemGhiRoKhac`, `ghepKhac`, `tachKhac`) · `trangThai.ts` (`TRANG_THAI`, `NHAN_TRANG_THAI`, `chuTrangThai`, `trangThaiPhoiHop`, `trangThaiCaseDong`) · `banPhim.ts` (`buocDanhSach`, `buocVongFocus`, `buocLich`, `traFocusVe`) · máy chủ "Khác" `cases/cases.ts`, `yThuc/violations.ts` · tìm người `platform/timNguoi.ts` | `web/src/ui/` · phép kiểm `server/src/tests/thanhPhanChung.tests.ts` |

Từ vựng nghiệp vụ (nhãn, hằng số, luật thuần) nằm ở `shared/domain/`, chia theo **đúng chín
module trên**. Cả máy chủ lẫn giao diện đọc chung một bộ, nên không có chuyện hai bên gọi
cùng một thứ bằng hai cái tên.

---

## Bộ dữ liệu demo nằm ở đâu

Bộ demo được dựng **từ hành trình học viên**, không phải sinh ngẫu nhiên rồi ghép lại. Bốn
file, mỗi file một việc:

| File | Chứa gì |
|---|---|
| `server/src/seed/journeys.ts` | Kiểu dữ liệu kịch bản · 10 giáo viên · 13 lớp và phân công |
| `server/src/seed/students.ts` | **Toàn bộ hành trình của 41 học viên**, viết tay từng con số |
| `server/src/seed/build.ts` | Đọc kịch bản rồi ghi xuống đúng các bảng, theo đúng thứ tự đời thật |
| `server/src/seed/seed.ts` | Chi nhánh, vai trò, quyền, tài khoản, chương trình, tuần, công việc quản lý |

Muốn **đổi một câu chuyện** thì sửa `server/src/seed/students.ts` rồi chạy `npm run seed`. Muốn **thêm một
loại dữ liệu mới** vào kịch bản thì thêm trường ở `server/src/seed/journeys.ts` và xử lý ở `server/src/seed/build.ts`.

---

## Tra nhanh theo việc muốn sửa

### Học viên

| Muốn sửa | Mở file |
|---|---|
| Cột trong bảng học viên của một lớp | `web/src/modules/students/ClassRoster.tsx` |
| Dữ liệu đổ vào bảng đó | `server/src/classes/classes.ts` → `classRoster` |
| Trang hồ sơ một em | `web/src/modules/students/StudentDetailPage.tsx` |
| Panel "Quản lý học viên" (kế hoạch · đầu vào · mục tiêu · kết luận · chuyển lớp) | `web/src/modules/students/StudentManagePanel.tsx` |
| Tab Hành trình — một lưới, chuỗi điểm ▲▼, màu ghim N-1b, Xem gọn; hàng Tuần học/Tuần khoá + Lớp, Case khung rỗng + tầng PA, khối Chờ (luật thuần `shared/domain/hanhTrinh.ts`: `chuoiDiem`, `nhanGhim` (`hai`), `boCucHanhTrinh`, `xepHangLuoi`, `soTuanCot`, `khoiCho`, `chuKhoangDung`) | `web/src/modules/students/HanhTrinh.tsx` · `server/src/students/hanhTrinh.ts` |
| Dữ liệu hồ sơ | `server/src/students/profile.ts` |
| Danh sách lớp, nhóm theo lớp, 6 chip lọc | `web/src/modules/students/StudentsPage.tsx` → `BangHocVienLop.tsx` |
| PR-UXF-a — số liệu khớp: **bài = một ô điểm** (`baiId`/`tachBaiId`), một luật quá hạn nhập điểm (`quaHanNhapDiem`: tuần thi phải hết), việc nhập điểm của người xem theo em (`nhapDiemTheoEm`), khoảng Tạm dừng + "tuần học thứ n" FT (`khoangTamDung`, `tuanHocFt`, `chuTuanHoc`), khác Web gợi ý (`khacGoiY`), ghi bù N tuần = N trễ (`tuanTre`), hạn gốc Vận hành (`hanGocCua`) | `shared/domain/cases.ts` · `server/src/platform/week.ts` · `server/src/classes/dongHocVien.ts` · `server/src/students/tamDung.ts` · `shared/domain/hienThiNgay.ts` · `shared/domain/chuyenLop.ts` · `server/src/worklist/metrics.ts` · `server/src/worklist/mgmttasks.ts` · phép kiểm `server/src/tests/prUxfA.tests.ts` |
| PR-S6F-a — một luật cho một khái niệm: "em đang học" (`HV_DANG_HOC_SQL` — nợ điểm, badge, Lịch Test, bảng GV, vi phạm), mốc trễ nhập điểm (`mocTreNhapDiem`; `quaHanNhapDiem` gọi lại), bảng GV gán theo lớp lúc thi (`napBai`), gợi ý phân công theo chương trình lớp (`nhanDayDuoc`) | `server/src/students/tamDung.ts` · `server/src/platform/week.ts` · `server/src/phanTich/giaoVien.ts` · `server/src/phanTich/hieuQuaPa.ts` · `shared/domain/phanCong.ts` · phép kiểm `server/src/tests/prS6fA.tests.ts` |
| PR-S6F-b — một hàm "tuần học thứ n · đang dừng" (`tuanHocTai`, `chuTuanHoc(…, dangDung)` — đầu hồ sơ, chương Hành trình, panel Chuyển lớp / Lên lớp); Lớp tôi dạy đếm bài bằng `noDiemCuaGv` (cùng cột hồ sơ GV); khung nhớ theo người (`datNguoiDungKhung`, `khungLopToiDay`); `useApi` gộp GET đang bay; tín hiệu một `metricSet` mỗi chỉ số; chân chương `chuLen`; tải trang đầu đo ở `TAI_TRANG` | `shared/domain/hienThiNgay.ts` · `server/src/worklist/tongQuan.ts` · `web/src/ui/CongTacKhung.tsx` · `shared/domain/congViec.ts` · `web/src/lib/useApi.ts` · `server/src/worklist/signals.ts` · `shared/domain/hanhTrinh.ts` · `server/src/tests/tocDoDuong.ts` · phép kiểm `server/src/tests/prS6fB.tests.ts` |
| PR-Dọn-a — quyền và an toàn (một cửa chữ tự do `chuTuDo`, chống bấm đúp `vuaGhi` 10 giây, `caseDaCoTheoKhoa`, `listCases` một lớp cho lọc + quyền `LOP_CUA_CASE`, lộ trình phải thuộc đúng em ở `createAttempt`); một luật cho một khái niệm (`HV_DANG_HOC_SQL` mọi nơi, phân công đang hiệu lực `phanCongDangHieuLuc`, lộ trình tính tuần `loTrinhTinhTuan`, khai bậc `khaiDuoc`, tuần kết quả `tuanKetQuaCuaHan`, badge lớp = `emChuaCoLenh`); nhớ trong request cho hồ sơ HV (`dongHocVien`, `activeClassOf`, `cyclesOf`, `periodById`, `programmeCodeOfCycle`) | `server/src/util.ts` · `server/src/db.ts` · `server/src/cases/cases.ts` · `server/src/fasttrack/attempts.ts` · `server/src/worklist/scoreDebt.ts` · `server/src/fasttrack/cycles.ts` · `server/src/yThuc/xuLy.ts` · `shared/domain/week.ts` · `server/src/classes/lenhChuyen.ts` · `server/src/students/tamDung.ts` · phép kiểm `server/src/tests/prDonA.tests.ts` (khối 1–10) + `tocDo.run.ts` (9a, 9c, 9d) |
| PR-UXD — điện thoại 375 px: **thanh dưới có biểu tượng 20 px, cao 56 px, vạch mục đang mở** (`BIEU_TUONG`, `NutDay`); thanh trên < 640 px: **nút kính lúp mở ô tìm neo hai mép**, chữ cái tài khoản, bảng thông báo neo đáy `<header relative>` (`Header.tsx`); toast lên trên khi có panel (`.vung-toast` + `body:has([aria-modal])`, `index.css`); viền ô nhập tối ≥ 3:1; thẻ Mock Test / Kết quả kiểm tra (`IeltsAttempts`, `RatioAttempts`, `TheDong` có prop `id`); Lịch Test nút Lọc; dòng phụ hàng lớp có lộ trình (`chuLop`) | `web/src/App.tsx` · `web/src/modules/platform/Header.tsx` · `web/src/ui/Toast.tsx` · `web/src/ui/HangTab.tsx` · `web/src/ui/TheDong.tsx` · `web/src/index.css` · `web/src/modules/students/StudentDetailPage.tsx` · `web/src/modules/test/LichTestTab.tsx` · `web/src/modules/students/StudentsPage.tsx` · phép kiểm `server/src/tests/prUxd.tests.ts` |
| Tên và điều kiện của 5 chip lọc (`Tất cả · Cần làm · Chờ duyệt · Đang SOS · Thiếu thông tin`; link cũ `case_*` → Cần làm) | `shared/domain/hocVienLop.ts` → `LOC_HOC_VIEN` · `LOC_HOC_VIEN_NHAN` · `docThamSoLoc` |
| Thêm học viên, nhập Excel (PR-NHAP: cột theo tiêu đề, email bắt buộc, thi dự kiến, cột Tình trạng; lỗi/lưu ý tách `muc`; thêm xong ở lại với dòng lỗi qua `IntakeResult.hangDaThem`; cột "Đã thi tới MT" → `taoMtMacDinh({ daThiToiMt })`, xem trước báo MT lịch sử, `IntakeResult.mt`) | `web/src/modules/students/IntakePanel.tsx` · `server/src/classes/intake.ts` · luật thuần `shared/domain/nhapHocVien.ts` (đọc ngày `dd/mm/yyyy`, email, tiêu đề cột, tuần bắt đầu mặc định) · migrate `server/src/migrate/prNhap.ts` (`students.email`, `learning_cycles.exam_date`) |
| Target + Dự kiến thi lớp thường, dán Excel không cần tiêu đề (PR-NT, chủ sản phẩm 04/10: lưới lớp thường 6 cột `cotLuoiNhap`; `laDongTieuDe`/`docDongDan` đoán tiêu đề, `parsePaste(text, { classId, coTieuDe })` trả `cach`; Thông tin HV lớp thường sửa Target (lý do, `cycle.edit`) + Dự kiến thi; đầu hồ sơ `thongTin.thiIelts`; lên lớp thường giữ Target/Dự kiến thi; Target lớp thường KHÔNG bật FT — `apTargetLuotChuaDiem`/`luotKck` chỉ lượt Mock, `giaoVien.ts` KCK chỉ bỏ lượt FT) | `shared/domain/nhapHocVien.ts` · `server/src/classes/intake.ts` · `web/src/modules/students/IntakePanel.tsx` · `web/src/modules/students/StudentManagePanel.tsx` (`ThongTinPanel`) · `server/src/students/profile.ts` (`dongThongTin`) + `web/src/modules/students/DauHoSo.tsx` · `server/src/classes/luatLoTrinh.ts` (`apDungMotDong`, `apDungCaLop`) · phép kiểm `server/src/tests/prNt.tests.ts` |
| Badge "Thiếu thông tin" (chỉ thiếu sót CẢN TRỞ chuyên môn) | `web/src/modules/students/MissingBadge.tsx` · `server/src/classes/schedule.ts` → `missingForStudent` |
| Câu tình trạng đầu hồ sơ ("MT2 đạt kỳ vọng · còn 2 case…") | `server/src/students/standing.ts` |
| Lịch sử điểm 2–3 mốc trên bảng lớp | `web/src/modules/students/ClassRoster.tsx` · `server/src/classes/classes.ts` → `classRoster` (`history`) |
| Chuyển lớp | `server/src/students/students.ts` → `transferStudent` · `server/src/classes/luatLoTrinh.ts` → `apDungMotDong` · `web/src/modules/students/ChuyenLopPanel.tsx` |
| **Luật đổi lớp/khoá dùng chung** (giữ khoá hay đóng-mở, đóng Case tự động, endKind) | `shared/domain/lenLop.ts` → `luatDoiLop` (bảng Q, PR-LT) |
| Lộ trình tiếp theo (dự định sau lớp đang học, ghi trước khi chuyển thật) | `server/src/classes/loTrinhTiep.ts` (`kiemDong` + `ghiCacDong` ghi theo lô, `ghiLoTrinhTiepCaLop`, `layLoTrinhTiepCaLop` — PR-K26) · `web/src/modules/students/LoTrinhTiepPanel.tsx` · `web/src/modules/classes/LoTrinhTiepCaLopPanel.tsx` (ghi cả lớp, ⋮ hồ sơ lớp) · `server/src/migrate/prK26.ts` (gộp `chua_ro`/`xep_sau` → `chua_quyet`) · phép kiểm `server/src/tests/prK26.tests.ts` |
| Chương theo lớp (đầu tab Hành trình, mỗi ghi danh một thẻ — thay Lịch sử lớp + Mốc học tập, PR-VAI-b) | `shared/domain/hanhTrinh.ts` → `chiaChuong`, `lapLaiQuaLop` · `server/src/students/hanhTrinh.ts` (`chuong`) · `web/src/modules/students/ChuongLop.tsx` |
| Đầu hồ sơ HV "hiểu trong 30 giây" (PR-VAI-b): dòng thông tin, thanh việc theo người, câu tóm tắt, bốn ô, dải Tạm dừng / chờ duyệt | `server/src/students/profile.ts` (`dauHoSo`) · `server/src/students/viecHocVien.ts` · `server/src/students/tamDung.ts` (`khoangTamDung`) · `shared/domain/hoSoHocVien.ts` · `shared/domain/hienThiNgay.ts` (`tuanHocFt`, `chuTuanHoc`) · `web/src/modules/students/DauHoSo.tsx` |
| Bảng kỹ năng thành thẻ < 640 px; đường dẫn sâu "MT2 · Speaking" → hồ sơ Mock `?kn=` (PR-VAI-b) | `web/src/modules/cases/TheKyNang.tsx` · `shared/domain/duongHoSo.ts` (`duongDotTest`, `docKnMock`) |
| Lưu trữ / Bỏ lưu trữ học viên (thôi học tự vào Lưu trữ — `setStudentStatus`, PR-XOA) | `server/src/students/students.ts` → `archiveStudent`, `unarchiveStudent`, `setStudentStatus` |
| **Xoá học viên** (chỉ Quản trị hệ thống; một giao dịch, danh sách bảng viết cứng + phép kiểm "không sót" so PRAGMA) | `server/src/students/xoaHocVien.ts` → `CAU_XOA_HOC_VIEN`, `xemXoaHocVien`, `xoaHocVien` · `web/src/modules/students/XoaHocVienPanel.tsx` · menu ⋮ `shared/domain/quanLyHocVien.ts` (`coTheXoa`) · phép kiểm `server/src/tests/xoaDuLieu.tests.ts` |
| Khu Lưu trữ (lớp đã kết thúc, HV đã lưu trữ, chế độ chỉ xem) | `server/src/classes/luuTru.ts` · `web/src/modules/students/LuuTruPage.tsx` |
| **Tổng kết lộ trình** (PR-TK): bản chụp lúc đóng MỌI đường đóng (lộ trình mới, chuyển / lên / học lại / sang FT, kết thúc học, sửa tay, hoàn tác Học lại) — bảng `ban_chup_lo_trinh` + `ban_chup_luot` (một dòng lượt × kỹ năng, nguồn cho PR-NC), ghi cùng giao dịch, điểm sửa sau đóng làm mới (`lamMoiDiemBanChup` ở `refreshOutcome` / `refreshRegularOutcome`); **kết quả thi thật** L R W S do GVCN nhập (`datKetQuaThiThat`, `PUT /cycles/:id/outcome`, máy so Target lúc đóng) + việc nhắc `thi_that`; Kết thúc học FT chờ kết quả chưa lưu trữ (`canChoThiThat`, `tuLuuTruKhiHetCho`); đường đọc `GET /students/:id/lo-trinh`, `/lo-trinh/:cycleId/tong-ket`, `/classes/:id/tong-ket`; khối Các lộ trình, ngăn Tổng kết, tab Tổng kết lớp đã kết thúc, nút Tổng kết ở Lưu trữ | `server/src/loTrinh/banChup.ts` · `server/src/loTrinh/thiThat.ts` · `server/src/loTrinh/tongKet.ts` · migrate `server/src/migrate/prTk.ts` (bảng, 8 cột thi thật, điền ngược `dienNguocBanChup`) · luật thuần `shared/domain/tongKetLoTrinh.ts` · `web/src/modules/students/{CacLoTrinh,NganTongKet,KetQuaThiThatPanel}.tsx` · `web/src/modules/classes/TabTongKetLop.tsx` · phép kiểm `server/src/tests/prTk.tests.ts` (bất biến cuối `run.ts`) |
| Đường lui Học viên & Lớp (PR-LUI-b): Học lại về lớp cũ / sang lớp mới (`hocLai`, `moLoTrinhMoi`), Mở lại lớp (`moLaiLop`), Quản lý kết thúc lớp, làm nhiều học viên một lần (xem trước + lô 8: kết thúc học, lưu trữ, bỏ lưu trữ, học lại, huỷ / khôi phục chuyển lớp), nút Chọn nhiều học viên | `server/src/students/students.ts` · `server/src/students/hangLoat.ts` · `server/src/classes/xoaKetThucLop.ts` · `server/src/classes/lenhChuyen.ts` · `server/src/classes/luatLoTrinh.ts` · `shared/domain/hangLoatEm.ts` · `web/src/modules/students/{chonNhieuHocVien,XemTruocHangLoatPanel,hangLoatEm}.ts(x)` · `web/src/modules/classes/{TabHocVienLop,XoaKetThucLopPanel}.tsx` · phép kiểm `server/src/tests/prLuiB.tests.ts` |

### Lớp học

| Muốn sửa | Mở file |
|---|---|
| Tạo lớp (PR-LOP: một lệnh, **một giao dịch** lớp + phân công; kiểm ba luật phân công trước khi ghi) | `web/src/modules/classes/ClassCreatePanel.tsx` (cũng mở từ "+ Mở lớp mới" của Chuyển tiếp; lưới ô `LuoiPhanCong`) · `POST /classes` → `server/src/classes/intake.ts` → `taoLopVaPhanCong` (lô một dòng của `taoLopHangLoat`) · PR-QU: tạo nhiều lớp `POST /classes/bulk` → `taoLopHangLoat` (kiểm quyền từng dòng → khoá idempotency → `kiemDongTaoLop` → ghi một giao dịch), quyền `class.create` · PR-SO: `donKhoaGuiCu` dọn khoá `bulkclass:*`/`intake:*` cũ hơn 7 ngày · `createClass` chỉ còn là hàm ghi nội bộ (seed, phép kiểm) |
| Tạo nhiều lớp một lần (PR-QU C: lưới ≤ 30 dòng trong "+ Lớp mới", Kiểm tra = `dryRun`, khoá idempotency mỗi lần mở panel) | `web/src/modules/classes/LuoiTaoLop.tsx` (mở từ nút "Nhiều lớp" của `ClassCreatePanel.tsx`) · `POST /classes/bulk` → `server/src/classes/intake.ts` → `taoLopHangLoat` · luật thuần `shared/domain/tenLop.ts` (`goiYSoTiep`, `themDongGiong`, `gopLoiTheoDong`) |
| **Tên lớp** `{CN} {FT \| FT RF \| Pre FOU \| FOU \| BE \| ELE} {số}` — ghép, kiểm số, so trùng chuẩn hoá, sắp xếp số tự nhiên, đổi tên lớp cũ; cờ `CHO_TAO_PRE_FOU` (tắt tới PR-MON) | `shared/domain/tenLop.ts` (`ghepMaLop`, `kiemSoLop`, `chuanHoaMaLop`, `soSanhLop`, `tenMoiChoLopCu`, `kyHieuLop`; PR-QU: `goiYSoTiep`, `themDongGiong`, `gopLoiTheoDong`, `TOI_DA_DONG_TAO_LOP`) |
| Sửa thông tin cả lớp (PR-SL, Q-0310-3: Họ tên, Ngày sinh, Email, Tuần bắt đầu, Dự kiến thi, Target, Điểm đầu vào — lớp thường theo `cotLuoiNhap(true)`, không điểm đầu vào; kiểm hết trước khi ghi bằng hàm kiểm của đường một em `chuanHoaSuaHoSo` · `docTuanBatDau` · `docDuKienThi` · `docTarget` · `docDiemXuatPhat`; quyền theo trường `student.edit` / `cycle.edit` (`CHI_QL_SUA`); lưu MỘT giao dịch gọi `updateStudent` · `updateCycle` · `setBaseline` · `reviseTarget`; khoá `suacalop:*`; ≤ 60 dòng) | panel `web/src/modules/students/SuaCaLopPanel.tsx` (mở từ ⋮ "Sửa thông tin học viên" ở `DauTrangLop.tsx` và nút "Sửa thông tin" ở `TabHocVienLop.tsx`) · `GET /classes/:id/sua-ca-lop` (`duLieuSuaCaLop`) · `POST /classes/:id/sua-ca-lop/xem-truoc` · `POST /classes/:id/sua-ca-lop` → `server/src/classes/suaCaLop.ts` (`xemTruocSuaCaLop`, `luuSuaCaLop`) · câu "MT… sẽ dời sang …" `cauMtSeDoi` (`shared/domain/lichMt.ts`, chung với `ThongTinPanel`) · phép kiểm `server/src/tests/prSl.tests.ts` · trần câu SQL `TRAN_GHI_LO.xemTruocSuaCaLop30` / `luuSuaCaLop30` |
| Sửa thông tin lớp (số lớp, lộ trình, chương trình — khoá khi lớp đã có HV/bài Test) | `web/src/modules/classes/SuaThongTinLopPanel.tsx` · `PATCH /classes/:id/thong-tin` → `server/src/classes/thongTinLop.ts` → `capNhatThongTinLop` |
| Phân công giáo viên, ba luật phân công (mỗi ô **một** người; Pre FOU chỉ ô GVCN, máy tự thêm ô Tổng hợp) | luật `shared/domain/phanCong.ts` (`oPhanCong`, `kiemPhanCong`, `moRongPhanCong`) · `server/src/classes/classes.ts` → `setClassTeachers` (`PUT /classes/:id/teachers`), `ghiPhanCong`, `docSlots`, `teacherCandidatesBranch` · `web/src/modules/classes/TeacherAssignPanel.tsx` |
| Tuần khai giảng, tuần Progress/Final Test | `web/src/modules/classes/ClassProgressPanel.tsx` · `server/src/classes/schedule.ts` |
| Lớp đang ở tuần thứ mấy, sắp thi gì | `server/src/classes/schedule.ts` → `classProgress` |
| Tab **Ý thức & Phối hợp** của lớp — khung trái nhóm em (Quá hạn · Bắt buộc · Chờ QL duyệt · Mới · Đã xử lý 7 ngày), khung phải dòng thời gian (PR-YT4, M6) | `server/src/yThuc/board.ts` → `bangYThucLop` (`GET /classes/:id/y-thuc`) · `web/src/modules/yThuc/ClassYThucCard.tsx` |
| **Bảng phân tích vấn đề** của lớp (tab kỹ năng, năm con số mỗi hàng) | `web/src/modules/classes/ClassIssueBoard.tsx` · `server/src/cases/effectiveness.ts` → `classIssueBoard` |
| Chuyển tiếp cả lớp khi hết chương trình (mỗi em một hướng, hai bước Soạn/Xác nhận) | `server/src/classes/transition.ts` · `web/src/modules/classes/TransitionPanel.tsx` |
| Lớp đã kết thúc — chế độ chỉ xem (mọi cờ viewer `false`) | `server/src/classes/classes.ts` → `classOverview`, `classRoster` (nhánh `status==='finished'`) |

### Fast Track

| Muốn sửa | Mở file |
|---|---|
| Mốc lịch MT mặc định (tuần học 6/12/16/20/24) | `shared/domain/fasttrack.ts` → `MOCK_FT_STUDY_WEEK` |
| Kỳ vọng của từng lượt MT | `shared/domain/fasttrack.ts` → `expectationDelta` |
| **Ô điểm: số ± là khoảng cách tới kỳ vọng** (`gap`), xu hướng so lượt trước là chữ trung tính (`trend`) | `server/src/cases/cases.ts` → `skillSupportBoard` · `web/src/modules/cases/SkillBoard.tsx` → `ScoreCell`, `gapText` |
| Bốn màu của ô điểm (dưới đỏ · bằng xanh dương · vượt xanh lá · thiếu xám) | `web/src/modules/cases/SkillBoard.tsx` → `scoreTone` |
| Bảng quy đổi số câu đúng → band | `server/src/fasttrack/scoring.ts` |
| Cách tính mức SOS | `server/src/fasttrack/scoring.ts` → `resultOf` |
| Màn một lượt MT | `web/src/modules/fasttrack/MockDetailPage.tsx` |
| Bảng nhập điểm cả lớp (lưới FT) | `web/src/modules/cham/LuoiFT.tsx` · `server/src/fasttrack/attempts.ts` → `classScoreSheet` — xem mục "Chấm điểm" bên dưới |
| **Hàng nào hiện ra ở bảng chấm của một tuần** — lọc theo lịch TỪNG KỸ NĂNG, không theo tuần cả đợt | `server/src/fasttrack/attempts.ts` → `classScoreSheet` |
| **Luật đếm "bài cần chấm"** — badge và danh sách đều gọi vào đây | `shared/domain/fasttrack.ts` → `pendingSkillsOf` |
| Hai phạm vi công việc và nhãn của chúng | `shared/domain/people.ts` → `WORK_SCOPES`, `WORK_SCOPE_LABEL`, `WORK_SCOPE_HINT` |
| Phạm vi mở ra mặc định theo vai | `server/src/permissions.ts` → `defaultWorkScope` |
| Ai phụ trách từng bài còn thiếu (cột GV ở hàng đợi) | `server/src/fasttrack/attempts.ts` → `ownersOf` |
| Xếp tuần MT — Test › **Kế hoạch Test** (xem bảng màn hình ở trên). PR-Dọn-a xoá `planning.ts` (`/attempts/no-plan`, `/attempts/bulk-plan`, `POST /attempts`) — web không gọi |
| Nhãn "Dự kiến thi" (tuần / chỉ tháng / chưa biết) | `server/src/fasttrack/cycles.ts` → `examPlanOf` · `web/src/ui/ui.tsx` → `ExamPlanText` |
| **Lịch thi, phạm vi, trạng thái thi và hạn chấm CỦA TỪNG KỸ NĂNG** | `server/src/fasttrack/skillSchedule.ts` |
| Hạn chấm của một kỹ năng (FT thứ Tư tuần sau · Normal Chủ nhật cùng tuần) | `server/src/platform/week.ts` → `skillScoreDeadline` · `effectiveSkillDeadline` |
| Tuần kế hoạch hoàn tất của một đợt | `server/src/fasttrack/skillSchedule.ts` → `completionWeekOf` · `recomputeCompletionWeek` |
| Ràng buộc thứ tự đợt khi đổi lịch một kỹ năng (T15: trùng tuần với đợt lân cận thì CHẶN, cách đúng một tuần thì CẢNH BÁO) | `server/src/fasttrack/skillSchedule.ts` → `checkSkillWeekMove` (một kỹ năng, đợt đã có) gọi `checkWeekVsNeighbours` (cycleId + attemptNo, kiểm được cả đợt CHƯA tạo — dùng ở `keHoach/keHoachTest.ts`) |
| Bảng "Lịch thi theo kỹ năng" trong màn một lượt MT | `web/src/modules/fasttrack/MockDetailPage.tsx` → `SkillScheduleCard` |
| Lịch MT tự đề xuất | `server/src/classes/schedule.ts` → `suggestedMockWeeks` (theo lộ trình: LT 6/12/16, RF 4/8) |
| Luật lịch MT (PR-MT): lịch mặc định theo lộ trình, MT lịch sử, cửa sổ Case 4 tuần, đánh số liền mạch, cách huỷ lượt, hạn duyệt dời lần 2, mốc kế tiếp | `shared/domain/lichMt.ts` (`lichMtMacDinh`, `tuanHocCuaMt`, `laLichSu`, `luotSinhViec`, `soMtKeTiep`, `kiemSoMtMoi`, `cachHuyLuot`, `hanDuyetDoiLan2`, `mocKeTiep`, `coMocTiepTheo`, hằng SQL `LUOT_TINH_NO_SQL` · `CO_DIEM_SQL` · `MOC_KE_TIEP_SQL`) |
| Thao tác một kỹ năng theo trạng thái (PR-XLMT, T38): bảng nút chính + menu, sáu tên, luật lý do | `shared/domain/thaoTacMt.ts` (`thaoTacKyNang`, `trangThaiTT`, `CHU_THAO_TAC`, `canLyDo`, `kiemLyDoThaoTac`) · hộp dùng chung `web/src/modules/fasttrack/HopThaoTacMt.tsx` · dòng thời gian lượt `web/src/modules/fasttrack/DongThoiGianLuot.tsx` · ⋯ ô lưới lớp thường `web/src/modules/cham/LuoiThuong.tsx` + `web/src/modules/cham/NganLichSuBai.tsx` |
| Xếp lịch MT nhiều lớp (PR-XLMT, M9): việc từng em (tạo · dời · xếp nốt · thi lại · chặn), trần MT8, tuần đã qua = MT lịch sử | luật `shared/domain/keHoachTest.ts` (`viecXepMt`, `chuSeXep`, `tomTatXepMt`, `tuanMacDinhDotMoi`, PR-MTb: `nhanSeXep`, `demSeXep`, `dotMtMoi`) + `shared/domain/lichMt.ts` (`MT_TOI_DA`, `kiemTuanDaQua`, `mtDaThiChuaQua`) · máy chủ `server/src/keHoach/keHoachTest.ts` (`xepHangLoat` → `xetMotEmFT`, `thiLai`) · ngăn `web/src/modules/test/keHoach/NganXepLichMt.tsx` (khung Lớp thường `NganXepHangLoat.tsx`) |
| Báo vắng (PR-XLMT, K4-28): "-" + chốt ngay qua `settleGroup` | `server/src/fasttrack/absence.ts` → `baoVang` (FT) · `server/src/normal/regular.ts` → `reportRegularNoShow(…, lyDo)` (lớp thường) |
| Tự tạo MT mặc định khi mở lộ trình FT (Thêm HV, vào lớp FT, đổi LT ↔ RF, mở lộ trình tay) | `server/src/fasttrack/mtMacDinh.ts` → `taoMtMacDinh` (giao kèo PR-NHAP) · lõi `server/src/classes/schedule.ts` → `apLichMacDinh` (tạo + dời lượt `auto` chưa điểm khi đổi tuần bắt đầu) |
| Đánh số MT — MỘT chốt cho mọi đường tạo lượt; hồi sinh số huỷ không điểm | `server/src/fasttrack/attempts.ts` → `createAttempt` (`hoiSinhLuot`) · `server/src/fasttrack/cycles.ts` → `luotSoCuaLoTrinh`, `nextAttemptNo` |
| Hồ sơ Mock (PR-HSM, M10): dải 5 ô điểm lớn L · R · W · S · Overall, bấm ô sửa tại chỗ (W hai hàng W1/W2), khối nhận xét W/S | `web/src/modules/fasttrack/ODiemLon.tsx` (`DaiODiemLon`, dùng `InlineScoreEditor` có sẵn) · `web/src/modules/fasttrack/MockDetailPage.tsx` (`KhoiNhanXet`, bảng "Lịch kiểm tra" bốn cột) |
| Nhận xét W/S + GV chấm Speaking (PR-HSM, YC-13.5, T39): cột `assessment_scores.comment` · `examiner_user_id` · `examiner_name` | migrate `server/src/migrate/prHsm.ts` · luật `shared/domain/nhanXet.ts` (`kiemNhanXet`, `nhanXetW`, `tenGvCham`, `NHAN_XET_TOI_DA`) · ghi **cùng đường điểm** `saveScore` (nhánh chỉ-nhận-xét `luuNhanXet`: không lý do, không đổi Nhập bởi, không SOS; nhật ký `score.nhan_xet`; ô mất hết điểm → xoá cùng) · đọc join `users g` trong `scoresOf`/`loadBundle` → `SkillCell.nhanXet` / `gvCham` · web `web/src/modules/fasttrack/NhanXet.tsx` (`HopNhanXet` điện thoại, `ONhanXet` hồ sơ Mock) · `web/src/modules/cham/GvCham.tsx` (`useGvChamCot` nhớ lớp × tuần, `NutGvCham`, `DongGvCham`) |
| GV Speaking chấm S chéo lớp FT cùng chi nhánh (chủ sản phẩm 30/09) — quyền, không phải việc | `server/src/permissions.ts` → `lopFtChoGvSpeaking` (nối vào `editableSkills` trừ nhánh việc, `scoreEditPath`, `ATTEMPT_VIEW` theo lớp) · Lịch Test "Tất cả" `server/src/cham/canCham.ts` → `lichTest` |
| **Speaking Mock chấm chéo** (PR-LT3 T18) — không GV mặc định: không nợ / trễ cho GVBM S, GVCN; trễ theo GV chấm đã ghi; lưu không chọn GV chấm → ghi người lưu; chuông "Speaking quá hạn chấm" | cờ `laChamCheo` + chữ `CHAM_CHEO` ở `shared/domain/chamDiem.ts` → chặn ở nguồn: `fasttrack/attempts.ts` (`skillCells` mine/viec, `pendingOwners`, `saveScore` GV chấm mặc định) · `worklist/scoreDebt.ts` (`DebtCell.chamCheo`) · `phanTich/giaoVien.ts` (`tapChamDiem`) · chuông `server/src/cham/chamCheo.ts` → `baoChamCheoQuaHan` (gọi từ `ops/chotVangDinhKy.ts`) · web nút đầu cột S `web/src/modules/cham/GvCham.tsx` (`NutGvCham chiTen`, `useGvChamCot` mặc định người xem) |
| Tên 4 tiêu chí theo bài nhập (K4-25: W1 TA, W2 TR) | `shared/domain/skills.ts` → `tieuChiCua` · `tieuChiNganCua` |
| Nhãn lượt "Đang chấm · 2/4" (F8) | `shared/domain/fasttrack.ts` → `nhanLuot` (lưới FT, hồ sơ Mock) |
| Huỷ cả lượt / Huỷ phần còn lại + hệ quả nói trước | `server/src/fasttrack/attempts.ts` → `huyLuot`, `heQuaHuyLuot` (`attemptDetail.viewer.huyLuot`) · `web/src/modules/fasttrack/MockDetailPage.tsx` → `CancelDialog` |
| MT cũ (cột `lich_su`; PR-MTa T1: tuần thi cách ≥ 2 tuần lúc xếp/dời — `laMtCu`, `tinhLaiMtCu`): không nợ / không hạn (chốt `viewSkill({ lichSu })` → `progress 'lich_su'`), GVCN/QL nhập đủ 4 kỹ năng, R11 7 ngày, cửa sổ Case | `server/src/fasttrack/skillSchedule.ts` → `viewSkill` · `server/src/permissions.ts` → `scoreEditPath`/`editableSkills` · `server/src/fasttrack/hoanTat.ts` · `server/src/cases/sos.ts` → `raiseSignalsForResult` |
| Dòng nhắc "MT lịch sử chưa nhập" (Lịch Test + Việc cần làm) | `server/src/cham/canCham.ts` → `mtLichSuChuaNhap` |
| Nhãn "cũ" cạnh số đợt (MT cũ) | `web/src/ui/OMt.tsx` → `NhanCu` |
| Ô MT dùng chung (13 trạng thái mockup phần 3: chưa có đợt · chưa xếp · có lịch · đang thi · chờ chấm · trễ chấm · còn việc · xong · đang chọn; PR-MTb T2) | luật `shared/domain/oMt.ts` → `oMt(v, homNay, ct)` (thứ tự cố định; tooltip một dòng mỗi kỹ năng), `oKyNangTuLich` (hàng lịch hồ sơ Mock → `OKyNang`) · vẽ `web/src/ui/OMt.tsx` → `OMt` (dùng ở `HangLichMt`, đầu `MockDetailPage`) · phép kiểm `server/src/tests/prMtb.tests.ts` |
| Dời do vắng: máy tự dời lần 1 lúc chốt "-", đề nghị lần 2 hạn hết CN tuần gửi, tuần đích mặc định, QL đổi kết luận thì rút đề nghị | `server/src/fasttrack/absence.ts` → `xuLyVangMotKyNang`, `tuanDichMacDinh`, `moTaDoiLan2` (chữ thẻ cho PR-DUYET), `rutDeNghiDoi` · `server/src/fasttrack/skillSchedule.ts` → `setSkillWeek` (QL dời bài đang vắng = dời do vắng) |
| Đổi LT ↔ RF: Case đi theo lộ trình mới | `server/src/cases/systemClose.ts` → `chuyenCaseSangLoTrinh` (mốc `route_changed`) |
| Lộ trình của lượt (kỳ vọng RF = target) | `server/src/fasttrack/attempts.ts` → `routeCuaLuot` · `shared/domain/fasttrack.ts` → `expectationDelta(n, route)` · `shared/domain/sos.ts` → `academicSupportFor`, `sosCoordinationFor` |
| Lộ trình học của một em, target, dự kiến thi | `server/src/fasttrack/cycles.ts` |
| Panel Lộ trình: bảng lịch MT xếp / dời / huỷ lịch / nhập điểm tại hàng (PR-LM) | `web/src/modules/students/StudentPlanPanel.tsx` · `web/src/modules/students/HangLichMt.tsx` · `server/src/keHoach/keHoachTest.ts` → `lichMtLoTrinh` (`GET /cycles/:id/suggested-mocks`) |
| **MT0** (PR-MT0, T5/T5b): lượt Mock số 0 (`kind = 'mt0'`, `attempt_no = 0`) của em lớp thường FOU/BE/ELE ghi Lên FT — tạo / huỷ / mở lại khi ghi Lộ trình tiếp theo, nối vào lộ trình FT lúc chuyển (điểm đầu vào), dời muộn nhất tuần 2 FT và trước MT1, việc QL "Chốt lên FT" | luật `shared/domain/mt0.ts` · máy chủ `server/src/fasttrack/mt0.ts` (`dongBoMt0`, `huyMt0`, `noiMt0VaoFt`, `mt0TheoHocVien`, `lopChoChotLenFt`) · chặn tuần `skillSchedule.ts` → `kiemTuanMt0Cho` (trong `kiemVuot`), theo Final `mt0TheoFinal` · phép kiểm `server/src/tests/prMt0.tests.ts` |
| Dời vượt lượt sau → huỷ lịch lượt bị vượt (bỏ tuần, giữ lượt); có điểm → huỷ kết quả (PR-MTa T2) | `shared/domain/lichMt.ts` → `luotBiVuot`, `cauSeHuyLich`, `dongHeQuaVuot`, `canLyDoVuot` · `server/src/fasttrack/skillSchedule.ts` → `kiemVuot`, `kiemXacNhanVuot`, `boLichLuotBiVuot`, `boTuanLuot` (`POST /attempts/:id/bo-tuan`) |
| **Kết quả MT đã huỷ do dời vượt** (PR-MTa T2) — điểm chuyển sang bảng `ket_qua_huy` (không xoá), Case sinh riêng đóng, Quản lý khôi phục | `server/src/fasttrack/ketQuaHuy.ts` → `huyKetQuaLuot`, `khoiPhucKetQua` (`POST /attempts/:id/khoi-phuc-ket-qua`), `ketQuaHuyCua` (đọc theo lô cho `lichMtLoTrinh`, `attemptDetail`) · migrate `server/src/migrate/prMta.ts` (cột `attempt_skills.huy_vang`, bảng `ket_qua_huy`) · phép kiểm `server/src/tests/prMta.tests.ts` |
| Xoá "-" = hết vắng (PR-BV): Mock đã chốt trả lịch / lần vắng / đề nghị như trước khi gõ, giữ quyết định của người; khung gỡ chung FT + lớp thường; ô FT `daChot` (hiện "-" → tuần mới); nhập lại điểm sau khi xoá mở lại đúng Case; Lịch sử ô lớp thường | `server/src/fasttrack/absence.ts` → `duocGoDau`, `dauDaChot`, `goVangDaChot` (gọi từ `attempts.ts` → `saveScore` khi `noShow: false`) · `normal/regular.ts` → `reportRegularNoShow` (gỡ), `refreshRegularOutcome` · `cases/signals.ts` → `CASE_DONG_DO_XOA`, `retireCaseForCorrectedScore` (`score_cleared:<trạng thái>`) · `cases/sos.ts` → `upsertCategoryCase` (`reopened`) · `attempts.ts` → `scoreHistoryOf` · web `ScoreEntry.tsx` (`daChot`, `ODiemThuong.oTuanCu`) · phép kiểm `server/src/tests/prBv.tests.ts` |
| Vắng lần 2 ở Mock → huỷ kỹ năng, Xin dời, Không mock lại (PR-MTa T3) | `server/src/fasttrack/absence.ts` → `huyVangNoi`, `xinDoi` (`POST /attempts/:id/skills/:skill/xin-doi`), `khongMockLai` (`…/khong-mock-lai`) · `shared/domain/thaoTacMt.ts` (`huy-vang`) |
| Khung nhập điểm: không nhập trước tuần thi (PR-MTa T19) — một chốt cho Mock và lớp thường; hạn lớp thường thứ Tư tuần sau | `server/src/fasttrack/skillSchedule.ts` → `kiemDaToiTuanThi` · `server/src/platform/week.ts` → `skillScoreDeadline` |
| Quản lý dời kỹ năng đã có điểm, điểm đi theo (T20); khôi phục phần huỷ vào tuần đã qua (T21); MT cũ: GVCN sửa / xoá ô có điểm, kể cả sau khoá 7 ngày (T22, `hoanTat.ts` → `quyenSuaSauHoanTat`), "-" = không dự thi, chốt cuối lúc ghi (`assessment_scores.no_show_cu`), không vào luồng vắng (T23); khôi phục kết quả không đè ô "-" (`ketQuaHuy.ts` → `khoiPhucKetQua`) | `skillSchedule.ts` → `setSkillWeek` · `keHoachTest.ts` → `kiemDotNoi` · `absence.ts` → `restoreCancelledSkill`, `settleNoShows` · `permissions.ts` → `scoreEditPath`, `editableSkills` · `cham/canCham.ts` → `mtLichSuChuaNhap` |
| Panel "Xếp lịch Mock Test" — "MT mới" (mỗi em đợt riêng), đúng đợt đã chọn (không tự sang đợt khác), tick kỹ năng, cột "Sẽ xếp" một dòng 3 màu, hạn chấm trên ô kỹ năng (PR-MTb T13b/T6) | `shared/domain/keHoachTest.ts` → `viecXepMt`, `dotMtMoi`, `nhanSeXep`, `demSeXep`, `OKyNang.hanCham` · `server/src/keHoach/keHoachTest.ts` → `xepHangLoat` (`attemptNo: 'moi'`, `kyNang`), `oKyNangCua` · `POST /ke-hoach-test/hang-loat` · `shared/domain/thaoTacMt.ts` (`co-diem` → `doi-lich` cho Quản lý) · phép kiểm `server/src/tests/prMtb.tests.ts` |
| Hộp một đợt (mockup phần 2: Tuần chung, 4 dòng ô tích · tên · tuần + điểm / chip trạng thái · ⋯ luôn hiện năm mục cố định, Nhật ký; PR-MTb T5) | luật `shared/domain/thaoTacMt.ts` → `menuHopKyNang`, `CHU_MUC_HOP` · `shared/domain/oMt.ts` → `chipDongKyNang` · `OKyNang.diem` (`server/src/keHoach/keHoachTest.ts` → `diemChu`) · vẽ `web/src/modules/test/keHoach/HopKyNang.tsx` (Kế hoạch Test + hồ sơ HV › Lộ trình) · `web/src/modules/cham/NganLichSuBai.tsx` (`trongHop`) · phép kiểm `server/src/tests/prMtb.tests.ts` |

### Normal

| Muốn sửa | Mở file |
|---|---|
| Bốn ô môn của FOU/BE/ELE (L/R/W/S); Pre FOU một ô `tong_hop` | `shared/domain/normal.ts` → `REGULAR_SKILLS`, `PROGRAMME_TEMPLATES` (bảng `programme_skills` thắng) |
| **Tên môn theo chương trình** (PR-MON, MH2 — MỘT nguồn: FOU `W` = G+V / Grammar + Vocabulary, `S` = P / Pronunciation; Pre FOU Tổng hợp) | `shared/domain/normal.ts` → `tenMon(ct, ô)`, `tenMonNgan(ct, ô)`; `skillLabel`/`skillShort` (web `lib/format.ts`), `tenKyNang`, `caseTopicLabel` chỉ là lớp mỏng. Máy chủ gửi kèm `chuongTrinh` (Case, Lịch Test, hồ sơ HV, lưới `monNgan`) |
| Bộ môn xếp lịch của MỘT lượt (FT 4 kỹ năng đánh giá; lớp thường theo chương trình) | `server/src/fasttrack/skillSchedule.ts` → `boMonCuaLuot` · luật `shared/domain/normal.ts` → `boMonLich` · `regularSkillViews(…, skills)` bắt buộc truyền bộ môn |
| Nguyên nhân Case theo môn (FOU G+V: Từ vựng/Ngữ pháp · P: Âm/Trọng âm/Ngữ điệu · Pre FOU nhóm Tổng hợp) | `shared/domain/cases.ts` → `nhanhPhanLoai`, `issuesForTopic(topic, ct)`, `ISSUE_TAXONOMY` (nhánh `gv`, `phat_am`, `tong_hop`) |
| Pre FOU: kết quả là % tổng (không SOS) | `server/src/normal/regular.ts` → `evaluateRegular` (`tyLeTong`) · `shared/domain/chamDiem.ts` → `ketQuaThuong` · `hocVienLop.ts` → `ketQuaGanNhat` · `hanhTrinh.ts` → `nhanGhim` |
| Số tuần và mốc kiểm tra từng chương trình | `shared/domain/normal.ts` → `PROGRAMME_TEMPLATES` |
| Ngưỡng đạt (70%) và cách chấm theo tỷ lệ | `shared/domain/normal.ts` → `ratioResult` · `RATIO_PASS_THRESHOLD` |
| Bảng nhập điểm Progress/Final Test (lưới lớp thường) | `web/src/modules/cham/LuoiThuong.tsx` · `server/src/normal/regular.ts` → `regularSheet` — xem mục "Chấm điểm" bên dưới |
| Xử lý điểm và sinh case của Normal | `server/src/normal/regular.ts` |
| **Lớp thường ghi "-"** thì môn đó tự dời sang tuần sau (C08) | `server/src/normal/regular.ts` → `reportRegularNoShow` (dùng lại `setSkillWeek`) |
| Chuyển tiếp lớp FOU → BE → Fast Track | `server/src/classes/transition.ts` · `web/src/modules/classes/TransitionPanel.tsx` |
| Bài nào mở màn nào (Mock Test hay bảng điểm Normal) | `server/src/fasttrack/attempts.ts` → `attemptHref` · `web/src/lib/format.ts` |

### Chấm điểm — chung cho lớp FT và lớp thường (PR-Rc1)

> **Một lưới cho hai loại lớp, máy chủ trả `mode`.** Trang không tự đoán loại lớp: `chamSheet` trả `mode`
> (`ielts_band` hay `ratio`) rồi trang chọn lưới. `/nhap-diem/:classId` và `/bang-diem-thuong/:classId` cùng mở
> `ChamDiemPage`. Hai lưới vẫn là hai file riêng — đúng nguyên tắc "Fast Track và Normal có form riêng" ở cuối file.

| Muốn sửa | Mở file |
|---|---|
| Trang lưới chấm: đầu trang, chọn tuần/bài, tham số đường dẫn `?periodId=` `?kind=` `?kn=` `?hv=` | `web/src/modules/cham/ChamDiemPage.tsx` |
| Phần lưới dùng chung (chọn lưới theo `mode`, màn hẹp một kỹ năng một lúc, đặt con trỏ; Lịch Test thêm `gon` · `tuanDangXem` · `chiAttempt`) | `web/src/modules/cham/LuoiChamLop.tsx` |
| Lưới lớp Fast Track (band, dấu "-" chờ chốt Chủ nhật) | `web/src/modules/cham/LuoiFT.tsx` |
| Lưới lớp thường (điểm đạt/tổng điểm, dấu "-" dời tuần sau) | `web/src/modules/cham/LuoiThuong.tsx` |
| Chấm trên điện thoại — một kỹ năng một lúc (< 768px) | `web/src/modules/cham/MotKyNang.tsx` |
| Dữ liệu cho các câu hỏi đọc: lưới một lớp · Lịch Test (ba khối) | `server/src/cham/canCham.ts` → `chamSheet` · `lichTest` · `noQuaHan` · `hangLopTuan` |
| Luật thuần: nhãn hàng lớp Lịch Test (`nhanLopLichTest`), lớp tự mở (`lopTuMo`), chữ trạng thái chấm, ô lưới thường, độ dài tối thiểu của lý do · dựng lệnh điểm từ chữ gõ (`rawPatchFrom`, `criteriaPatchFrom`: số câu / band `6.5` `b6` / "-") · đường dẫn Lịch Test `duongLichTest` | `shared/domain/chamDiem.ts` · `shared/domain/dieuHuong.ts` |
| **Sửa điểm đã có phải ghi lý do** (RB-5) — cả hai cửa lưu điểm | `web/src/modules/fasttrack/ScoreEntry.tsx` → `SuaDiemCoLyDo` · `server/src/fasttrack/attempts.ts` → `saveScore` · `server/src/normal/regular.ts` → `saveRegularScore` |
| Ô điểm lớp thường dùng chung (lưới và điện thoại) | `web/src/modules/fasttrack/ScoreEntry.tsx` → `ODiemThuong` |
| **R11 — đợt/bài đã hoàn tất thì chỉ Quản lý sửa điểm (có lý do)** — "hoàn tất" suy từ điểm + lịch mỗi lần đọc, không lưu cột riêng (PR-Rc2) | `server/src/fasttrack/hoanTat.ts` → `dotHoanTat` / `dotHoanTatMany` / `quyenSuaSauHoanTat` — nối vào `saveScore`, `saveRegularScore`, `reportRegularNoShow`, `skillCells`, `regularSheet`; web đọc `SkillCell.khoa` + nhãn "Đã hoàn tất" ở `cham/LuoiFT.tsx` · `cham/LuoiThuong.tsx` · `cham/MotKyNang.tsx` |

### Case

> **Từ 21/09/2026 (PR-J) module này CHỈ có case học thuật.** Mô hình Case Ý thức đã gỡ khỏi mã: không còn
> cột `track`, `episode_no`, `merge_until`, bảng `case_reports`, `CONTACT_KINDS`, `BEHAVIOUR_*`, bảng ý thức của
> lớp. Ý thức là module riêng — xem mục "Ý thức" bên dưới. Bảng `sos_cases` là bảng **case học thuật**
> (KHÔNG đổi tên, KHÔNG gộp vi phạm vào đây). Hằng số `C03_*`/`C04_*` ở `shared/domain/policy.ts` còn đó,
> ghi "hết hiệu lực 21/09/2026".

| Muốn sửa | Mở file |
|---|---|
| **Tín hiệu từ điểm** (điểm dưới kỳ vọng sinh gì) — từ PR-LT2a chỉ còn FT; lớp thường không có tín hiệu | `server/src/cases/signals.ts` |
| **Lớp thường Giữa khoá** (PR-LT2a): luật thuần (`boTroGiuaKhoa`, `nhomBoTro`, `moTaBoTro`, `tenCaseThuong`, `nhanKetQuaThuong`, `noiDungBaoPh`) | `shared/domain/lopThuong.ts` |
| **Cuối khoá lớp thường** (PR-LT2b): luật thuần (dải, hướng gợi ý `goiYCuoiKhoa`, bổ trợ miễn phí, `lichBoTro`, `chuHopKetLuan`) | `shared/domain/cuoiKhoa.ts` |
| Cuối khoá — một cửa máy chủ: % theo lô (`tyLeTongLo`, `cuoiKhoaTheoHocVien`), sau chuyển (`sauChuyenCuoiKhoa`, `capNhatCuoiKhoaSauChuyen`), Mini Test (`ghiMiniTestTrongTx`, `ghiMiniTest`), kết luận lên FT (`ghiKetLuanFt`) | `server/src/normal/cuoiKhoa.ts` |
| Case `chuyen_cap` không phải Case SOS — MỘT định nghĩa `LA_CASE_SOS` | `server/src/cases/sosState.ts` |
| Hộp Kết luận khoá + ô Mini Test (hồ sơ HV); ô Mini Test ở form Ghi kết quả cuối | `web/src/modules/students/KetLuanKhoa.tsx` · `web/src/modules/cases/CapNhatTuan.tsx` |
| PA Bổ trợ: tạo (`taoCaseTuDong({ pa: 'bo_tro' })`), nộp kế hoạch (`nopKeHoachBoTro`), chạy khi duyệt (`chayPaBoTro`, `khiDuyetKeHoach`), quyền (`quyenBoTro`, `coQuyenNop`), khối `boTro` cho Ngăn Case (`boTroCuaCase`) | `server/src/cases/boTro.ts` |
| Điểm lớp thường → Case Giữa khoá + PA + Báo PH (`refreshRegularOutcome` → `taoCaseGiuaKhoa`); em vào lớp thường tự có bài Giữa/Cuối khoá (`taoBaiThuongMacDinh`, M1b) | `server/src/normal/regular.ts` |
| Thẻ Chờ duyệt `ke_hoach_bo_tro` (`doi_tuong_loai = 'nhom_bo_tro'`); trạng thái kế hoạch đọc từ thẻ (`YC_KE_HOACH`) | `server/src/duyet/loaiYeuCau.ts` · `server/src/cases/sosState.ts` |
| Cột `nhom_bo_tro`, `han_ke_hoach` (migrate một lần) | `server/src/migrate/prLt2a.ts` |
| Panel Nộp kế hoạch + khối Kế hoạch dùng chung với Xác nhận Case | `web/src/modules/cases/NopKeHoachPanel.tsx` · `web/src/modules/yThuc/CaseSosControls.tsx` |
| Hạn xác minh tín hiệu (3 ngày, tính cả ngày đầu) | `shared/domain/cases.ts` → `signalVerifyDue` |
| Thu hồi tín hiệu và case khi sửa điểm (mục 9.4) | `server/src/cases/signals.ts` → `withdrawSignalsNoLongerValid` · `caseHasIndependentBasis` |
| Đối soát sau sửa điểm — MỘT hàm cho FT và lớp thường (RB-8) | `server/src/cases/signals.ts` → `reconcileCorrectedSignals` |
| **Tạo Case · Bỏ qua** một tín hiệu lớp thường, ai xử lý được tín hiệu (S1) | `server/src/cases/signals.ts` → `dismissSignal`, `canResolveSignal` · Tạo Case: `server/src/cases/cases.ts` → `reportIssue` (`fromSignalId`) |
| **Hệ thống tự đóng Case** — em kết thúc khoá (S16) / đổi chương trình (S17) | `server/src/cases/systemClose.ts` → `closeCasesBySystem`, `closeCasesOnProgrammeSwitch` |
| Thẻ "Tín hiệu chờ xác minh" ở hồ sơ học viên | `web/src/modules/students/StudentDetailPage.tsx` → `PendingSignals` |
| Năm hạng mục case | `shared/domain/cases.ts` → `CASE_CATEGORIES` |
| Tên case tự sinh | `shared/domain/cases.ts` → `caseTitle` |
| Bảng phân loại nguyên nhân | `shared/domain/cases.ts` → `ISSUE_TAXONOMY` |
| Danh sách phương án, nhóm tự làm / cần duyệt | `shared/domain/cases.ts` → `INTERVENTION_KINDS` |
| Luật sinh case sau mỗi đợt MT | `server/src/cases/sos.ts` |
| **SOS v4 (PR-SOS)** — luật thuần: hạn xác nhận 3 ngày, mốc PA quy chế, lần ghi cuối, MỘT nhãn trạng thái Case, việc tiếp, chặn Hoàn thành, tên `[MT1] … [SOS 3]` | `shared/domain/sosV4.ts` → `hanXacNhan`, `mocQuyChe`, `laLanGhiCuoi`, `quyetDinhChoPa`, `trangThaiCaseV4`, `viecTiepCuaCase`, `chanHoanThanh`, `tenCaseSos`, `mocChuPa` |
| Case tự tạo từ SOS (tách hàm cho PR-LT2a gọi lại) | `server/src/cases/sos.ts` → `taoCaseTuDong` |
| Xác nhận Case → Xác nhận PA · Không cần theo dõi (thẻ `khong_theo_doi`) · điền mốc · bàn giao PA khi chuyển lớp · đặt lại hạn khi Quay lại | `server/src/cases/sosAuto.ts` → `xacNhanCase`, `xacNhanPaQuyChe`, `guiKhongTheoDoi`, `apDungKhongTheoDoi`, `tuChoiKhongTheoDoi`, `dienMocQuyChe`, `banGiaoPaQuyChe`, `datLaiHanCase` · loại thẻ ở `server/src/duyet/loaiYeuCau.ts` |
| Cột `sos_cases.han_xac_nhan`, `case_interventions.moc_quy_che` | `server/src/migrate/prSos.ts` |
| Hàng Case / hàng PA ở bảng kỹ năng · panel Xác nhận Case / PA / Không cần theo dõi | `web/src/modules/cases/SkillBoard.tsx` → `HangCase`, `HangPA` · `web/src/modules/yThuc/CaseSosControls.tsx` |
| Vòng đời case, phương án, phê duyệt, kết quả | `server/src/cases/cases.ts` |
| Màn một case | `web/src/modules/cases/CasePanel.tsx` |
| Bảng theo dõi năm hạng mục ở hồ sơ | `web/src/modules/cases/SkillBoard.tsx` |
| Case của em ở hồ sơ — **nằm ngay dưới hàng kỹ năng**, không còn khối danh sách riêng | `web/src/modules/cases/SkillBoard.tsx` → `HangCase` / `HangPA` |
| Luật hạn chu kỳ hai tuần / một tuần | `shared/domain/cases.ts` → `cycleDeadline` |
| Năm kết quả và sáu bước tiếp theo (PR-S2 thêm `adjust` = Điều chỉnh, lịch sử ở bảng `case_intervention_revisions`) | `shared/domain/cases.ts` → `FOLLOWUP_OUTCOMES`, `NEXT_STEPS`, `nextStepsFor` |
| Luật hiển thị thuần của hồ sơ học viên: tab từ `?tab=`, ô Test gần nhất, quá hạn, tiến độ case `k/n PA có kết quả`, việc tiếp của một PA, đếm vi phạm theo nhóm (PR-HV) | `shared/domain/hoSoHocVien.ts` → `parseHoSoTab`, `ketQuaTestGanNhat`, `quaHan`, `tienDoCase`, `viecTiepPhuongAn`, `demTheoNhomViPham` |
| Một chu kỳ khép lại (gộp ba nút cũ) | `server/src/cases/cases.ts` → `updateResult` |
| Điều kiện được hoàn thành case | `server/src/cases/cases.ts` → `closeBlockers` |
| Điểm giáo viên tự chấm | `server/src/cases/cases.ts` → `normalizeMetrics`, `parseMetrics` |
| **Cách đếm hiệu quả phương án** — thành công/thất bại/chưa xác định, n/N, mẫu nhỏ | `server/src/cases/effectiveness.ts` (nơi sở hữu duy nhất; bảng của lớp và góc nhìn Kết quả hỗ trợ đều gọi vào đây) |
| **Hiệu quả PA** (vấn đề → loại PA, cỡ mẫu, "Ít dữ liệu", "Nên dùng", Thời gian trung bình; thay "Kết quả hỗ trợ") — bấm số ra PA | `web/src/modules/phanTich/HieuQuaPa.tsx` · `server/src/phanTich/hieuQuaPa.ts` (dùng `cases/effectiveness.ts` → `planOutcomes`) |
| **Xuất Excel kết quả Test** (PR-XUAT · bộ lọc chi nhánh × lớp × thời gian, Cột gọn/đầy đủ, sheet "Bộ lọc đã dùng", nhật ký `mt.xuat_excel`; nút ở Lịch Test, hồ sơ lớp ⋮, Phân tích › Tổng hợp Test) | `web/src/modules/test/NganXuatMt.tsx` · `server/src/phanTich/xuatMt.ts` (`phamViXuatMt`, `duLieuXuatMt`) · `shared/domain/xuatMt.ts` (bộ lọc, bộ cột T40, `bangFT`/`bangThuong`) · route `GET /xuat-mt/xem-truoc`, `POST /xuat-mt` |
| **Hồ sơ giáo viên + bảng GV chi nhánh** (PR-GV · trang `/giao-vien/:id` 5 khối: Việc đang có, Lớp đang dạy, Kết quả gần nhất, Case đang phụ trách, Yêu cầu đã gửi; bảng Tổng quan › Theo lớp › Theo giáo viên, sắp theo tên, **không KPI, không xếp hạng**; quyền xem dẫn xuất, không quyền mới) | `server/src/giaoVien/phamVi.ts` (`phamViHoSoGv`) · `server/src/giaoVien/hoSo.ts` (`hoSoGiaoVien`, `viecHoSoGv`, `ketQuaHoSoGv`, `oHoSoGv`, `bangGvChiNhanh`) · `server/src/worklist/mywork.ts` (`viecCuaNguoi`, cuối file) · `shared/domain/hoSoGiaoVien.ts` (`COT_O_GV`, `demViecTheoNhom`, `duongViecCuaGv`) · `web/src/modules/giaoVien/HoSoGiaoVienPage.tsx` · `web/src/modules/giaoVien/BangGiaoVienChiNhanh.tsx` · route `GET /giao-vien?cn=&ct=` · `/giao-vien/:id` · `/:id/viec` · `/:id/ket-qua` · `/:id/o?cot=…` |
| **Phân tích giáo viên** (PR-Pb2-b · góc nhìn "Giáo viên" cuối hàng; mỗi cột một hàm tập: Chấm điểm · Ghi kết quả PA · Xử lý vi phạm · PA hiệu quả · Kết quả môn · HV tiến bộ; panel Chấm điểm; **không KPI, không xếp hạng, không hàng tổng**) | `server/src/phanTich/giaoVien.ts` (`nguCanhPtGv`, `tapChamDiem`, `tapGhiKetQuaPa`, `tapXuLyViPham`, `tapPaHieuQua` → `paCoKetQua`, `phanTichGiaoVien`, `oChamDiemGv`) · `shared/domain/phanTichGv.ts` (`KhungPtGv`, `khoangPtGv`, `chuOPtGv`, `mauKetQuaGv`) · `server/src/classes/phanTichLop.ts` (`danhGiaMon`) · `web/src/modules/phanTich/PhanTichGiaoVien.tsx` · route `GET /phan-tich/giao-vien?cn=&ct=&tu=&den=|thang=` · `/phan-tich/giao-vien/cham-diem?…&gv=` |
| **Lớp + chương trình gốc của Case** (PR-DEPLOY 0b-3, R5-5: `sos_cases.goc_class_id`, `goc_programme_code`, trigger `trg_sos_cases_goc` ghi lúc INSERT; lần trượt ở chương trình mới mở Case mới) | `server/src/migrate/prDeploy.ts` · `server/src/cases/sos.ts` → `caseKhacChuongTrinh`, `chuongTrinhCuaLop`, `upsertCategoryCase` · `server/src/normal/regular.ts` → `taoCaseGiuaKhoa` · `server/src/cases/cases.ts` (`caseDetail`, `listCases` `class_ct`, `skillSupportBoard` nhóm Case bàn giao, `reportIssue`) |
| **Ngày nghiệp vụ mới** (PR-Pb2-b: ngày nhập đầu ô điểm, hạn xử lý chốt, ngày phản hồi vi phạm) | `server/src/migrate/prPb2b.ts` · `server/src/yThuc/trangThai.ts` (`chotHanXuLy`, `ghiPhanHoi`) · `saveScore` / `saveRegularScore` · `server/src/seed/pb2bSeed.ts` (`buNgayPb2b`, demo D18 `buildPb2bDemo`) · phép kiểm `server/src/tests/prPb2b.tests.ts` |
| **Khoá gửi mỗi lần mở form** (PR-GVa, F01 = D13: `tasks` · `case_interventions` · `case_followups` có `idempotency_key`, unique theo người tạo; thay chặn trùng 10 giây) | `server/src/migrate/prGva.ts` · `shared/domain/khoaGui.ts` (`chuanKhoaGui`, `moiKhoaGui`) · `server/src/db.ts` → `theoKhoaGui`, `laTrungKhoa` · `createMgmtTask` · `createTask` · `recordIntervention` · `recordFollowUp` · phép kiểm `server/src/tests/prGva.tests.ts` |
| **Bản chụp 4 nội dung Báo phụ huynh** (PR-PHH, F02: cột `sos_coordination_actions.noi_dung_luc_bao`; ghi lúc `confirmCoordination`, đọc lại ở `turnsOf`; dòng `done` cũ NULL → nội dung hiện tại + cờ `noiDungLaHienTai`) | `server/src/migrate/prPhh.ts` · `server/src/yThuc/phoiHop.ts` → `confirmCoordination`, `docBanChup`, `turnsOf` · `web/src/modules/yThuc/PhoiHopSosSection.tsx` · phép kiểm `server/src/tests/prPhh.tests.ts` |
| **Lớp FOU hai giáo viên** (PR-Pb2-b: phân công 2 ô `L · R · G+V` + `P`, Tách từng môn) | `shared/domain/phanCong.ts` (`oPhanCong(…, { tach })`, `slotsTuO`, `nenTachFou`, `chonKhiDoiTach`) · `web/src/modules/classes/ClassCreatePanel.tsx` (`useTachFou`, `NutTachFou`, `loiTaiO`) · `TeacherAssignPanel.tsx` |
| **Tổng hợp vấn đề HV** (đếm HV theo loại lỗi `ISSUE_TAXONOMY`, công tắc gộp loại lỗi chung `LOI_CHUNG`) | `web/src/modules/phanTich/TongHopVanDeHv.tsx` · `server/src/phanTich/vanDeHv.ts` |
| **Khối phương án theo tầng** ở tab Hành trình (một lưới, dấu + màu theo kết quả, hẹp chỉ hiện dấu) | `web/src/modules/students/HanhTrinh.tsx` → `KhoiPa` · luật xếp tầng `shared/domain/hanhTrinh.ts` → `xepTang` |
| Khung Phân tích (hàng góc nhìn + bộ lọc chung), Danh sách Case và bộ lọc | `web/src/modules/phanTich/PhanTich.tsx` · `web/src/modules/cases/CaseBoardPage.tsx` (`DanhSachCase`) |

### Ý thức

| Muốn sửa | Mở file |
|---|---|
| **Luật Ý thức v4 (PR-YT4)** — thang `THANG`, `batBuocTu` (3 vi phạm / 2 tuần), `trangThaiViPham` (sáu nhãn), `chuoiThang`, `bacKeTiep`, `nhomEm`, `macDinhTick`, `dongThang`, `HAN_Y_THUC_NGAY` | `shared/domain/yThuc.ts` (thuần) |
| **Một cửa trạng thái** — nhãn, nhóm em, bậc, hạn của mọi em (tab lớp, tab HV, Việc của tôi, Tổng quan, chỉ số, Báo lên) | `server/src/yThuc/trangThai.ts` → `trangThaiYThuc`, `ungVienYThuc`, `ungVienVaThe`, `emCuaLop` |
| Ghi nhận · Xác nhận xử lý (bậc máy chủ quyết, 409) · Khai bậc · Đề xuất QL duyệt (nháp → gửi) · Đã thực hiện · đọc tab HV | `server/src/yThuc/xuLy.ts` |
| Ghi · sửa · xoá một vi phạm; GVCN tự ghi → Đã ghi nhận (Q5) · **ghi nhiều** (`recordViolations`: nhiều học viên một vi phạm, hoặc một học viên nhiều dòng; lô 8, mỗi em một giao dịch) · ô `Vi phạm` (cột `ten`) + `Mô tả` | `server/src/yThuc/violations.ts` · `server/src/migrate/prLuiA1.ts` (cột `violations.ten`) · luật `shared/domain/yThuc.ts` (`kiemTenViPham`, `tachTenMoTa`, `dsLoiGhiViPham`) |
| **Sửa vi phạm của lần xử lý · Xoá lần xử lý mới nhất** (bậc tính lại; Q5) | `server/src/yThuc/xuLy.ts` (`suaViPhamXuLy`, `xoaXuLy`) · `web/src/modules/yThuc/XemXuLyPanel.tsx` |
| **Tệp chờ trong form** (chọn khi ghi, tải sau khi có id; một tệp nhiều bản ghi `POST /attachments/chep`) | `web/src/ui/TepCho.tsx` (`TepCho`, `taiTepCho`) · `server/src/platform/attachments.ts` (`chepTep`, kho chỉ xoá khi dòng cuối đi) · panel `web/src/modules/yThuc/RecordViolationPanel.tsx` · phép kiểm `server/src/tests/prLuiA1.tests.ts` |
| Thẻ `y_thuc` (duyệt / từ chối) và `bao_len_y_thuc` (Báo lên quá hạn) ở hộp Chờ duyệt | `server/src/duyet/loaiYeuCau.ts` (hai phần tử cuối `DINH_NGHIA_LOAI`) |
| Chỉ số Ý thức, mỗi chỉ số một hàm trả tập ID (`bien-phap-cho-duyet`, `hv-theo-bac`) | `server/src/yThuc/thongKe.ts` |
| Tab Ý thức trong lớp (M6: khung trái nhóm em · khung phải dòng thời gian) | `server/src/yThuc/board.ts` → `web/src/modules/yThuc/ClassYThucCard.tsx` |
| Panel Ý thức v4 | `web/src/modules/yThuc/{XacNhanXuLyPanel,DaThucHienPanel,KhaiBacPanel,XemXuLyPanel,ThangYThuc,NhanViPham,panelYThuc}.tsx` · kiểu `kieu.ts` |
| Ai được ghi / xử lý / xem thống kê | `server/src/yThuc/access.ts` · `server/src/permissions.ts` (`violation.record`, `discipline.manage` — GVCN **lớp đang học**, `discipline.stats`) |
| Bảng và DDL | `server/src/schema.sql` · migrate PR-YT4 (`violations.ghi_nhan_luc/_boi`, `discipline_measures.quyet_luc`, bảng `y_thuc_khai_bac`) `server/src/migrate/prYt4.ts` |
| Nâng cấp database còn mô hình Case Ý thức | `server/src/migrate.ts` → `migrateLegacyDisciplineCases` |
| Bằng chứng (tệp / liên kết) của biện pháp và vi phạm | `server/src/platform/attachments.ts` |
| Dữ liệu demo Ý thức v4 (tình huống a–m) | `server/src/seed/yThucSeed.ts` |
| Phép kiểm | `server/src/tests/yThuc.tests.ts` (kể cả phép gọi thẳng HTTP qua `server/src/app.ts`) · `server/src/tests/prYt4.tests.ts` (v4) |

### Tổng quan và công việc

| Muốn sửa | Mở file |
|---|---|
| Danh sách việc của người đang xem | `server/src/worklist/mywork.ts` |
| Màn Tổng quan (PR-VAI-a: QL ba tầng — Chờ duyệt + Cần xử lý trên, Số liệu theo khung dưới; GV: Việc của tôi · hôm nay · Yêu cầu của tôi · Lớp tôi dạy) | `web/src/modules/worklist/OverviewPage.tsx` · `server/src/worklist/tongQuan.ts` · `metrics.ts` (metricSet + chương trình) |
| Dòng tín hiệu SOS lớp thường (Tạo Case / Bỏ qua) | `web/src/modules/worklist/DongTinHieu.tsx` → `QuickReport.tsx` · `/signals/pending/:id/dismiss` · `/cases/report` |
| Lọc chương trình Lớp thường / FT cho mọi chỉ số | `shared/domain/tongQuan.ts` · `server/src/worklist/chuongTrinh.ts` |
| Một dòng việc (năm ô) và khối bốn nhóm gập/mở | `web/src/modules/worklist/WorkList.tsx` → `DongViec` · `worklist/NhomViec.tsx` (dùng chung ở `ViecCuaToi.tsx` và tab Hỗ trợ học viên, PR-Ra) |
| Tab **Hỗ trợ học viên** — lọc nhanh theo hạn, Người phụ trách (QL: Tất cả trong phạm vi/Chọn giáo viên…), Loại việc, nút Nhắc/Duyệt trên dòng (PR-Ra) | `web/src/modules/congViec/HoTroHocVienTab.tsx` · `congViec/ChonPhuTrach.tsx` · `server/src/worklist/mywork.ts` (`nguoi`) · `nhacViec.ts` |
| Nhắc việc — một lõi cho nút Nhắc một dòng và "Nhắc tất cả" (PR-NV: gom theo người, `myWork` một lần mỗi người, một lần ghi, dừng trước 10 s; thẻ Cuối khoá / Mini Test không có dòng `myWork` kiểm người nhận riêng) | `server/src/worklist/nhacViec.ts` → `nhacViecNhieu`, `nhacViec` · `server/src/duyet/yeuCau.ts` → `nhacNhieu`, `napDongNgoai` · phép kiểm `server/src/tests/prNv.tests.ts` |
| Chi nhánh mặc định (PR-NV, T9): lần chọn trước → vai Quản lý → lớp mình dạy → chi nhánh đầu / Tất cả; một khoá nhớ `pisa.chiNhanh` cho mọi ô chi nhánh | luật thuần `shared/domain/chiNhanhMacDinh.ts` → `chiNhanhMacDinh` · máy chủ `server/src/classes/hocVienLop.ts` → `goiYChiNhanh` (phiên `/demo/session` `chiNhanhGoiY`, `/hoc-vien-lop?cnNho=`) · web `web/src/ui/Filters.tsx` → `useChiNhanhMacDinh`, `docChiNhanhDaNho`, `nhoChiNhanh` |
| Bảng "Theo chi nhánh" / "Theo lớp" (Việc cần lưu ý) | `web/src/modules/worklist/BranchPulse.tsx` · `server/src/worklist/bangChiNhanh.ts` (PR-Dọn-a xoá `branchpulse.ts`, `summary.ts`, `dashboard.ts`, `weekly.ts` cùng `/branch-pulse`, `/summary`, `/overview`, `/weekly-rollup` — web không gọi) |
| **Ô điểm còn nợ** của bảng chi nhánh — đi qua đúng hàm của bảng chấm (S12, §6) | `server/src/worklist/scoreDebt.ts` → `scoreDebtCells` |
| Quản lý giao việc cho giáo viên | `web/src/modules/worklist/ManagerTasks.tsx` · `server/src/worklist/meeting.ts` (không còn gọi từ Phân tích — PR-Ra quyết, xem `MeetingPage`) |
| Khối "Lịch sắp tới" (tuần này · tuần tới · tuần nữa; cột Lớp thường / Fast Track) | `web/src/modules/worklist/Highlights.tsx` · `server/src/worklist/highlights.ts` |
| Bảng "Phương án và kết quả" (góc nhìn **Hiệu quả PA** của Phân tích) | `web/src/modules/phanTich/HieuQuaPa.tsx` · `server/src/phanTich/hieuQuaPa.ts` · `server/src/cases/effectiveness.ts` |
| Tên và ý nghĩa của chín nhóm việc | `server/src/worklist/mywork.ts` → `GROUP_META` |
| "Việc của tôi" khác "tôi sửa được" | `server/src/permissions.ts` → `mySkills` vs `editableSkills` |

### Chuyển lớp do Quản lý quyết + Bàn giao (PR-CT, §3.1f, mockup 20)

| Muốn sửa | Mở file |
|---|---|
| Luật thuần: tuần bắt đầu (Thứ Hai, từ tuần sau), hạn bàn giao 2/3 ngày, kiểm một dòng lệnh, câu tóm tắt, kiểu `DaiLop`/`DaiHocVien`/`PhieuBanGiaoDto` | `shared/domain/chuyenLop.ts` |
| Ra / sửa / huỷ lệnh · **thi hành đúng Thứ Hai** (`thiHanhLenhDenHan`: cron + quét khi đọc, chạy lặp an toàn) · Đề xuất chuyển lớp · thông báo "Sắp nhận" | `server/src/classes/lenhChuyen.ts` · cron `server/src/ops/chotVangDinhKy.ts` |
| Phiếu bàn giao (tự điền, dòng môn GVBM, xác nhận, Nhắc) · việc `ban_giao` | `server/src/classes/banGiao.ts` · quyền `server/src/classes/quyenChuyenLop.ts` |
| Dữ liệu các dải (hồ sơ lớp A · H, hồ sơ HV E) | `server/src/classes/daiChuyenLop.ts` → web `web/src/modules/classes/DaiChuyenLop.tsx` |
| Panel chuyển cả lớp (lớp thường + FT) · chuyển một em / đề xuất · Bàn giao (GVCN, GVBM, đọc) | `web/src/modules/classes/TransitionPanel.tsx` · `web/src/modules/students/ChuyenLopPanel.tsx` · `web/src/modules/classes/BanGiaoPanel.tsx` |
| Ba loại thẻ Chờ duyệt (`de_xuat_chuyen_lop`, `bao_len_ban_giao`, `bao_len_chua_lenh`) | `server/src/duyet/loaiYeuCau.ts` · `shared/domain/yeuCauDuyet.ts` |
| Bảng `lenh_chuyen_lop`, `ban_giao_mon` · migrate | `server/src/schema.sql` (cuối file) · `server/src/migrate/prCt.ts` |
| Bộ demo 6 kịch bản | `server/src/seed/ctSeed.ts` · `DEMO.md` mục 14 |

Quy tắc: **mọi chuyển lớp thật chỉ đi qua `thiHanhLenhDenHan`**; `applyTransition`/`transferStudent` là hàm nội bộ (thi hành, phép kiểm, seed). Đường web cũ `POST /classes/:id/transition`, `POST /students/:id/transfer` nay RA LỆNH.

### Tiến độ công việc (tab Vận hành)

| Muốn sửa | Mở file |
|---|---|
| Tab Vận hành: hàng số (bấm lọc), bảng 5 cột, panel chi tiết | `web/src/modules/worklist/MgmtTasksPage.tsx` → `TasksBoard` · `NganViecVanHanh` (PR-Ra) |
| Luật của bảng đó: việc con một tầng, lý do bắt buộc, đóng việc cha, **Tạm ngưng** đủ ba ý (lý do + người cần hỗ trợ + ngày xem lại, PR-Ra Q10), dời hạn giữ hạn cũ (Q9) | `server/src/worklist/mgmttasks.ts` |
| Bốn nhóm công việc và năm trạng thái | `shared/domain/worklist.ts` → `TASK_GROUPS`, `TASK_PROGRESS` |
| Luật thuần hàng số Vận hành (Q8: quá hạn · chờ người khác · cần quyết định · vừa hoàn thành), facet, lọc nhanh Hỗ trợ học viên, trạng thái ô/đơn vị báo cáo (Q12) | `shared/domain/congViec.ts` |

### Nền tảng

| Muốn sửa | Mở file |
|---|---|
| Đăng nhập, đăng ký, duyệt tài khoản | `server/src/platform/accounts.ts` · `web/src/modules/platform/WelcomePage.tsx` |
| **Xoá tài khoản** (xoá hẳn nếu chưa có dấu vết, xoá mềm nếu có; 68 cột trỏ `users` phân loại trong `COT_TRO_TAI_KHOAN`) · nút lọc Đang dùng / Đã xoá | `server/src/platform/xoaTaiKhoan.ts` · `web/src/modules/platform/XoaTaiKhoanPanel.tsx` · `web/src/modules/platform/AccountsAdmin.tsx` |
| Vai trò và quyền | `shared/domain/people.ts` → `ROLES`, `PERMISSIONS` |
| Danh mục quyền theo nhóm (PR-QU): nhóm, mô tả một câu, ghi chú phạm vi GV, quyền suy ra cho cột GVCN, whitelist cấp riêng (`duocCapRieng`), ô cấm theo vai (SCH-01, `lyDoCamVai`; PR-SO: cấm cấp riêng khi MỌI vai đều cấm — `lyDoCamCapRieng`, máy chủ chặn + ô tích khoá ở `web/src/modules/platform/CapQuyenRieng.tsx`) | `shared/domain/nhomQuyen.ts` · máy chủ `server/src/platform/sysconfig.ts` (`maTranQuyen`, `anhHuongOVai`, `GET /admin/permissions/matrix`) · `server/src/platform/accounts.ts` (`setUserPermissions`) |
| Quyền suy ra `class.assign_subject` (GVCN phân công GV bộ môn) và `case.close` của GV (đúng môn / GVCN Ý thức) | `server/src/permissions.ts` → `can`, `teacherAllows` · `server/src/classes/classes.ts` (`setClassTeachers`, `giaoVienPhanCong` = `GET /ref/teachers`) · `server/src/cases/cases.ts` (`canCloseCase`, báo QL) · migrate một lần `server/src/migrate/prQu.ts` · phép kiểm `server/src/tests/prQu.tests.ts` |
| Báo cáo đơn vị: lọc chi nhánh (D9, chọn chi nhánh kèm Tutor), đếm ba trạng thái, lựa chọn bộ lọc chỉ từ đơn vị máy chủ đã cho (PR-BC) | `shared/domain/baoCaoDonVi.ts` (`locDonViBaoCao`, `demTrangThaiDonVi`, `luaChonChiNhanhBaoCao`, `khopChiNhanhBaoCao`) · màn `web/src/modules/worklist/MeetingPage.tsx` · phép kiểm `server/src/tests/prBc.tests.ts` |
| Quản trị › Tài khoản: lọc chi nhánh/vai (khớp trên cùng một lần cấp vai)/kỹ năng/tìm không dấu, nhóm theo chi nhánh/vai, chip phân loại, đọc/ghi URL, ẩn cột "Quyền cấp riêng" khi rỗng (PR-BC, L3, J10) | `shared/domain/taiKhoan.ts` (`locTaiKhoan`, `nhomTaiKhoan`, `phanLoaiTaiKhoan`, `coQuyenCapRieng`, `docBoLocTaiKhoan`, `ghiBoLocTaiKhoan`) · màn `web/src/modules/platform/AccountsAdmin.tsx` · phép kiểm `server/src/tests/prBc.tests.ts` |
| Sửa bảng quyền theo vai | `server/src/platform/sysconfig.ts` → `setRolePermission` · `web/src/modules/platform/AdminPage.tsx` |
| Cấp quyền riêng cho một người theo nhóm quyền (ô tick, phạm vi chi nhánh, lý do) | `server/src/platform/accounts.ts` → `setUserPermissions` · `web/src/modules/platform/CapQuyenRieng.tsx` (dùng trong `AccountsAdmin.tsx`) |
| Ai được làm gì ở đâu | `server/src/permissions.ts` |
| Quản trị › Lộ trình & chương trình (LT1 · LT2 · RF; sửa số tuần, **không** thêm mã mới; lớp đang học giữ số tuần đã chụp) | `server/src/platform/sysconfig.ts` → `saveProgramme` · `web/src/modules/platform/CatalogAdmin.tsx` · số tuần chụp vào lớp `server/src/normal/regular.ts` → `mocChupVaoLop` |
| Hồ sơ cá nhân | `web/src/modules/platform/ProfilePage.tsx` |
| Quy ước tuần, mã tuần (W2 SEP 2026) | `server/src/platform/week.ts` |
| Nhật ký thay đổi | `server/src/platform/audit.ts` |

### Tốc độ (PR-TD, tốc độ trên Turso)

Kế hoạch cũ: `git show 575e898d:docs/superpowers/plans/2026-09-23-pr-td-toc-do.md`.

| Muốn sửa | Mở file |
|---|---|
| Ngữ cảnh request: bộ nhớ tra cứu lặp (chỉ mở cho GET, tự xoá khi request chạy một lệnh ghi) + bộ đếm câu SQL | `server/src/platform/nguCanhRequest.ts` → `chayTrongRequest`, `nho`, `datNho`, `trongBoNho`, `napTruocPhamVi` (permissions.ts) |
| Cách đếm một câu SQL (`get`/`run`/`iterate`; KHÔNG đếm `all` vì nó tự gọi lại `iterate`) | `server/src/db.ts` (khối vá đầu file) |
| Bật log `[sql] METHOD url n câu` mỗi request (đặt `PISA_DEM_SQL=1`, không có trên bản chính) | `server/src/app.ts` → `moNguCanhRequest` |
| Danh sách đường đo (route × vai) + trần câu SQL của từng đường — **PR sau thêm đường mới vào đây** | `server/src/tests/tocDoDuong.ts` → `DUONG_DO`, `TRAN` |
| Phép kiểm ĐO (hạ tầng bộ nhớ, mọi đường×vai đúng mã, trần câu SQL, nhân dữ liệu ×3) — chạy tiến trình riêng, DB riêng, nối vào `npm test` sau `run.js` | `server/src/tests/tocDo.run.ts` |
| Đo khung trên trang thật (html cuộn, cuộn lồng, chữ cắt, nút tràn) mọi màn GV / QL 1440 + 375, sáng + tối — chạy tay, cần dev server (`KHUNG_BASE`), không nằm trong `npm run check`; luật nguồn khoá ở `server/src/tests/prKhung.tests.ts` | `scripts/do-khung.mjs` |
| Chụp JSON mọi (đường × vai) của một cây mã bất kỳ đã build, so trước/sau — dùng `--db`/`--khong-seed` để hai lượt chụp dùng chung một lần seed (tránh lệch giờ các trường ghi `new Date()` lúc seed) | `scripts/chup-api.mjs` |
| **Luật bắt buộc:** không sửa mảng/đối tượng nhận về từ `listCases`/các hàm có `nho()` (giá trị dùng chung trong request — sửa tại chỗ gọi thì phải copy trước) | xem chú thích đầu `nguCanhRequest.ts`; đặt `PISA_DONG_BANG_NHO=1` trong phép kiểm để lộ chỗ sửa nhầm (ném lỗi thay vì âm thầm sai) |

### Bản chính (Netlify + Turso, PR-Z2)

Hướng dẫn cho chủ sản phẩm: `TRIEN_KHAI.md`. Kế hoạch cũ: `git show 575e898d:docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md`.

| Muốn sửa | Mở file |
|---|---|
| Đọc biến môi trường (Turso, `BAN_CHINH`), luật "nguyên tên máy chủ" cho seed/migrate, nhận tên database bản chính | `server/src/moiTruong.ts` |
| Mở kết nối (file cục bộ hay Turso), vá khác biệt của libsql, giao dịch lồng (savepoint), **chốt chặn xoá sạch database ở Turso** | `server/src/db.ts` → `db`, `tx`, `tuChoiXoaSachNeuTuXa` |
| Nơi cất nội dung tệp: ổ đĩa (máy dev) hay Netlify Blobs (bản chính), tên kho theo database | `server/src/platform/khoTep.ts` → `khoTepHienTai`, `tenKhoTep` |
| Tệp bằng chứng (thêm/mở/xoá, xoá SAU giao dịch) | `server/src/platform/attachments.ts` |
| Máy chủ trên Netlify (bọc Express thành một Function) | `netlify/functions/api.ts` · `netlify.toml` |
| Tắt mọi thứ của bản demo ở bản chính (giao diện) | `web/src/lib/banChinh.ts` |
| Dữ liệu nền dùng chung cho bộ demo và bản chính (quyền, vai trò, lộ trình, chương trình) + ba dấu `demo_config` (`normal_pass_threshold`, `xoa_du_lieu_backfill_at`, **`khoi_tao_moi_at`** = DB dựng bằng mã hiện hành; PR-SO đã gỡ mọi bước chuyển dữ liệu cũ nên migrate không còn đọc dấu này) | `server/src/seed/duLieuNen.ts` → `napDuLieuNen` |
| `npm run init-ban-chinh` — khởi tạo database rỗng; `npm run them-chi-nhanh` | `server/src/ops/initBanChinh.ts` (luật) · `server/src/ops/runInit.ts` · `server/src/ops/themChiNhanh.ts` (điểm chạy) |
| `npm run sao-luu` — chép database + tải kho tệp, giữ 14 bản | `server/src/ops/saoLuu.ts` (luật) · `server/src/ops/runSaoLuu.ts` (điểm chạy) |
| `npm run khoi-phuc` — chép một bản sao lưu vào database rỗng | `server/src/ops/khoiPhuc.ts` (luật) · `server/src/ops/runKhoiPhuc.ts` (điểm chạy) |
| `npm run thu-turso` — thử đường mạng tới database THỬ | `server/src/ops/thuTurso.ts` |
| `npm run kiem-sau-init` — CHỈ ĐỌC: bảng nền (`BANG_NEN_INIT`), bảng lạ có dòng, chi nhánh, khoá `demo_config`, tài khoản mang mật khẩu demo, `foreign_key_check`; `Đạt.` / `CÓ VẤN ĐỀ` (PR-DEPLOY, thay `kiem-sau-xoa`) | `server/src/ops/kiemSauInit.ts` · danh sách bảng `BANG_NEN_INIT` ở `server/src/ops/initBanChinh.ts` |
| `npm run xoa-kho-tep` — xoá sạch kho tệp (Netlify Blobs) của database đang trỏ tới, gõ lại tên kho; từ chối kho `demo` (reset tại chỗ, PR-DEPLOY 5b) | `server/src/ops/xoaKhoTep.ts` (`xoaSachKho`, `demTepKho` — `runInit.ts` cảnh báo kho còn tệp) |
| `npm run migrate` vào Turso (xác nhận, bỏ tài khoản mặc định) | `server/src/migrate/run.ts` · `server/src/migrate.ts` → `migrateAccounts` |
| Phiên đăng nhập (cookie), **hết hạn sau 30 ngày không dùng** (`PHIEN_HET_HAN_SAU_NGAY`) | `server/src/auth.ts` |
| Giới hạn số lần thử đăng nhập/đăng ký (AN-1), bảng `auth_attempts` | `server/src/platform/gioiHanThu.ts` · khối `/auth` trong `server/src/routes/index.ts` |
| Câu lỗi 409/500 trả người dùng, mã lỗi trong log (AN-3) | `server/src/app.ts` → `traLoiLoi` |
| `/api/health` công khai, nhớ kết quả (AN-4) | `server/src/platform/suKhoe.ts` |
| Hạn 10 giây của hàm Netlify: không mở giao dịch khi sắp hết giờ, log `[cham]` (AN-5) | `server/src/platform/hanGio.ts` · `server/src/db.ts` → `tx`, `donGiaoDichTreo` · `server/src/app.ts` → `demGio` |
| Hàm định kỳ chốt "-" 00:05 + 06:05 sáng thứ Hai (RB-1) | `netlify/functions/chot-vang.ts` → `server/src/ops/chotVangDinhKy.ts` · lịch ở `netlify.toml` |
| Bảng không chép dòng khi sao lưu/khôi phục (`demo_sessions` — mã đăng nhập) | `server/src/ops/saoLuu.ts` → `BANG_KHONG_CHEP_DONG` |
| Phép kiểm của bản chính | `server/src/tests/banChinh.tests.ts` |

### Dùng chung

| Muốn sửa | Mở file |
|---|---|
| Sáu họ nhãn (`Level` · `Status` · `Task` · `Alert` · `Outcome` · `Info`), nút, thẻ, bảng | `web/src/ui/ui.tsx` |
| Panel trượt bên phải (một khung cho mọi panel) | `web/src/ui/KhungPanel.tsx` |
| Hộp thoại giữa màn, hộp xác nhận | `web/src/ui/Drawer.tsx` → `Modal`, `ConfirmDialog` |
| Ô ngày · tuần · tháng (gõ + lịch), lịch tự vẽ | `web/src/ui/ONgay.tsx` · `web/src/ui/LichNho.tsx` · luật `shared/domain/oNgay.ts` |
| Ô "Khác" → Ghi rõ | `web/src/ui/OKhac.tsx` · luật `shared/domain/khac.ts` |
| Nút đang chọn, bộ lọc nút đoạn, nhãn trạng thái | `web/src/ui/ui.tsx` → `NutChon`, `BoLocDoan`, `NhanTrangThai` · luật `shared/domain/trangThai.ts` |
| Công tắc hai khung `Fast Track · Lớp thường` (Lịch Test, Kế hoạch Test) / `Tất cả · …` (Công việc) — nhớ theo máy | `web/src/ui/CongTacKhung.tsx` (`CongTacKhung`, `khungDaNho`) · khung của dòng: `shared/domain/normal.ts` → `khungCua` · máy chủ `LichTest.tongQuanKhung`, `WorkItem.khung` |
| Ô chọn kỹ năng phụ trách được (5 ô L R W1 W2 S) | `web/src/modules/platform/ProfilePage.tsx` → `ChonKyNang` (dùng lại ở Quản trị › Tài khoản, Đăng ký) · Quản trị sửa: `PUT /admin/accounts/:id/skills` → `setUserSkills` |
| Giữ và trả focus (panel, Modal, lịch), phím mũi tên | `web/src/ui/giuFocus.ts` · luật `shared/domain/banPhim.ts` |
| Ô chọn tuần, bộ lọc chi nhánh | `web/src/ui/Filters.tsx` |
| Thông báo nổi | `web/src/ui/Toast.tsx` · `toast.hoanTac(text, onHoanTac, { key })` = toast Hoàn tác chung 5 giây, nút đếm lùi (PR-N1 C1; `shared/domain/hoanTac.ts` `HOAN_TAC_MS`, `giayHoanTacConLai`) |
| Báo lỗi form (PR-N1, YC-12.5.2) | `web/src/ui/loiForm.tsx` (`useLoiForm`: `o(loi, khoa)` gắn lên ô, `loiCua` → `Truong loi`, `conThieu` → chân; `DongCanSua` "n ô cần sửa ↑") · luật thuần `shared/domain/loiForm.ts` (`kiemTruong`, `dsLoi`, `nhanCanSua`) |
| Hạn "n ngày" và nhãn tuần ghi kết quả PA (PR-N1) | `shared/domain/cases.ts` (`weeklyUpdateDue` = hết Thứ Hai, `hanTheoNgay`, `HAN_DUYET_NGAY`) · `display.ts` (`nhanTuanGhiKetQua`) |
| Nhãn tiếng Việt của Nhật ký thay đổi | `shared/domain/nhatKy.ts` (`nhanHanhDongNhatKy`) → `web/src/modules/platform/AdminPage.tsx` |
| Migrate PR-N1 (tính lại trạng thái Case SOS Q28-5; dời hạn CN → T2 đã gỡ ở PR-SO) | `server/src/migrate/prN1.ts` · phép kiểm `server/src/tests/suaLoiNong.tests.ts` |
| Migrate PR-LOP (cột `so_tuan`/`tuan_giua_khoa`/`tuan_cuoi_khoa`, dòng RF + Pre FOU, chỉ mục `ux_classes_ma_chuan`; đổi tên lớp cũ đã gỡ ở PR-SO) | `server/src/migrate/prLop.ts` (`migratePrLop`, `dienMocLop` — seed gọi) · phép kiểm `server/src/tests/prLop.tests.ts` |
| Migrate PR-DUYET (bảng `yeu_cau_duyet` + chỉ mục một phần `ux_ycd_dang_cho`, chỉ mục `ix_notifications_dedup`, cột `tasks.assignee_name`, `notifications.duong`) | `server/src/migrate/prDuyet.ts` (`migratePrDuyet`, `napYeuCauTuNguonCu` — seed gọi) · phép kiểm `server/src/tests/prDuyet.tests.ts` |
| **Hộp Chờ duyệt** (PR-DUYET, §5.5, M8) — một bảng `yeu_cau_duyet` cho mọi thứ "xin QL quyết": Đề xuất PA · Xin ý kiến · Dời lịch lần 2 · Đề xuất sửa thông tin HV · Báo lên Case chờ nguyên nhân quá hạn. Giao kèo loại thẻ: PR sau chỉ thêm MỘT phần tử | luật thuần `shared/domain/yeuCauDuyet.ts` (`LOAI_YEU_CAU`, `LOAI_YC_META`, `sapThe`, `demChip`, `duongThe`, `nhanTrangThaiYc`, `TheYeuCauDto`; PR-GVb: `nhomCuaLoai`/`PHAN_LOAI_CAN_QUYET` tách thẻ phải quyết khỏi tab Nhắc việc, `demHop` một hàm đếm, `chonMot`/`chonHet`/`TRAN_HANG_LOAT`, `tomTatKetQuaHangLoat`, `chipChoDuyet` hàng chip dải Tổng quan; `TONE_TRANG_THAI` ở `shared/domain/trangThai.ts`) · lõi `server/src/duyet/yeuCau.ts` (`taoYeuCau`, `chotYeuCau` idempotent, `hopChoDuyet`, `yeuCauCuaToi`, `demYeuCau`, `duyetYeuCau`/`tuChoiYeuCau`/`traLoiYeuCau`/`duyetNhieu` (lỗi từng thẻ kèm `ma`)/`nhacNhieu` (Nhắc tất cả, gọi `nhacViec`), `quetYeuCau` quét khi đọc, `theCuaDoiTuong`) · giao kèo `server/src/duyet/loaiYeuCau.ts` (`DINH_NGHIA_LOAI`) · Đề xuất sửa `server/src/duyet/deXuatSua.ts` · routes `GET /yeu-cau`, `/yeu-cau/dem`, `POST /yeu-cau/:id/duyet|tu-choi|tra-loi`, `/yeu-cau/duyet-nhieu`, `/yeu-cau/nhac-nhieu`, `GET /yeu-cau?xem=cho|de-biet|da-xu-ly`, `POST /students/:id/de-xuat-sua` · web `web/src/modules/duyet/` (`TheYeuCau` một khuôn cho hộp · Yêu cầu của tôi · Ngăn Case; `HopChoDuyet`; `YeuCauCuaToi`; `DeXuatSuaPanel`) · dải Tổng quan `worklist/KhoiCanXuLy.tsx`, badge `App.tsx` · demo `server/src/seed/duyetSeed.ts` |
| Migrate PR-MT (cột `assessment_attempts.lich_su`, dữ liệu cũ = lượt thường) | `server/src/migrate/prMt.ts` (`migratePrMt`, `lotrinhNhaySo`, `luotHuyGiua`) · phép kiểm `server/src/tests/prMt.tests.ts` · dữ liệu thử cho phép kiểm cũ `server/src/tests/luotThu.ts` · bộ demo `server/src/seed/prMtSeed.ts` |
| Tên hiển thị của mọi mã máy | `web/src/lib/format.ts` |

---

## Điểm kết nối cần biết

Ba chỗ này nối các module với nhau. Sửa một chỗ là ảnh hưởng nhiều màn, nên đọc trước khi đụng.

**`server/src/fasttrack/attempts.ts`** — danh sách và chi tiết một *lượt đánh giá*. Cả Fast
Track lẫn Normal cùng dùng bảng `assessment_attempts`, nên file này rẽ nhánh theo chương
trình của lớp. Đây là chỗ dễ làm hỏng cả hai bên nhất.

**`server/src/permissions.ts`** — mọi câu hỏi "người này có được làm việc kia không" đều đi
qua đây. Quyền = quyền của vai × chi nhánh của chính grant đó × phân công lớp/kỹ năng, cộng
thêm quyền cấp riêng cho cá nhân.

**`server/src/platform/week.ts`** — quy ước tuần (thứ Hai → Chủ nhật, thuộc tháng chứa thứ
Năm; mã tuần LUÔN kèm năm). Lịch MT, hạn chấm, chu kỳ case và bảng theo tuần đều đếm từ đây.
Không có ngày thi cụ thể ở bất kỳ đâu trong luồng MT: đơn vị nhỏ nhất là TUẦN.

**`server/src/fasttrack/skillSchedule.ts`** — từ vòng 7, mỗi KỸ NĂNG trong một đợt có lịch,
phạm vi yêu cầu, trạng thái thi và hạn chấm của RIÊNG nó (bảng `attempt_skills`). Đây là nơi
sở hữu duy nhất của bốn thứ đó; màn nào tự đọc bảng rồi tính lấy hạn là màn sớm muộn nói một
con số khác. Hai điều dễ hiểu nhầm nhất:

- `assessment_attempts.planned_period_id` KHÔNG còn là "tuần thi của đợt". Nó là **tuần kế
  hoạch hoàn tất** — tuần muộn nhất trong các kỹ năng bắt buộc — và được tính lại mỗi khi một
  kỹ năng đổi tuần. Nhờ vậy bảng kết quả theo tuần vẫn đếm mỗi đợt đúng một lần.
- Điểm vẫn thuộc **một đợt duy nhất**. Tách tuần không tạo đợt mới, không đổi số MT, không
  ghép điểm từ đợt khác.

**`shared/domain/fasttrack.ts` → `pendingSkillsOf`** — từ PR1, "bài cần chấm" được đếm ở
ĐÚNG MỘT CHỖ, và badge ở danh sách lớp lẫn hàng đợi việc đều gọi vào đó. Trước PR1 mỗi bên
đếm một kiểu: badge đếm theo "kỹ năng tôi ĐƯỢC PHÉP SỬA", danh sách lọc theo "kỹ năng tôi
ĐƯỢC PHÂN CÔNG" — nên Quản trị hệ thống thấy badge 28 rồi bấm vào ra danh sách rỗng, còn Quản
lý thấy 0 ở mọi lớp. Hai phép đếm riêng thì dù sửa cho khớp hôm nay, lần sửa sau chúng lệch
lại. Thêm một màn cần con số này thì gọi hàm đó, đừng viết phép đếm thứ hai.

Kèm theo: `Cell.required` (`server/src/fasttrack/attempts.ts`) cố ý **độc lập với quyền người
xem**. `canEdit` và `mine` đều đã nhân `required` vào rồi, nên đếm phạm vi quản lý bằng
`canEdit` sẽ luôn ra 0 với Quản lý — đó đúng là lỗi cũ.

**`server/src/cases/signals.ts`** — từ vòng 7, điểm dưới kỳ vọng **không tự mở case và không
tự sinh phương án hỗ trợ** (mục 6.2). Nó sinh một TÍN HIỆU, giao cho đúng một người, kèm hạn
ba ngày. Lý do: máy đọc được "band 5.5 < kỳ vọng 6.0" nhưng không biết VÌ SAO, và không xếp
được tutor thay người — nên case và phương án tự sinh chỉ làm bảng tổng hợp đầy số mà không
có việc thật nào đứng sau.

Ba chỗ dễ hiểu nhầm:

- Tín hiệu **không phải case** và không được đếm chung. Nó đi ra ở khoá riêng (`pendingSignals`
  trên hồ sơ, `/signals/pending` ở API, nhóm `verify` ở hàng việc).
- Hạn ba ngày đếm từ `raised_on` — NGÀY GHI NHẬN, không phải thứ Hai của tuần thi. Điểm nhập
  muộn vì thế không làm giáo viên quá hạn ngay lúc điểm vừa công bố.
- Hạng mục ĐÃ CÓ case đang mở thì tín hiệu tự nối vào case đó (thêm một mốc, không mở case
  thứ hai). Chỉ khi chưa có case nào thì nó mới nằm chờ người xác minh.

**`shared/domain/cases.ts`** — từ vựng của case: năm hạng mục, năm kết quả, sáu bước tiếp theo,
và `cycleDeadline`. Từ vòng 5, HẠN của một chu kỳ tính ở ĐÚNG MỘT CHỖ này (Chủ nhật của tuần thứ
hai; Ý thức không còn hạn nào) — luật cũ suy hạn từ mức gấp `7 · 5 · 3 ngày`
đã bị thay hẳn. Màn hình nào tự tính hạn lấy là màn hình sớm muộn nói một con số khác.

**`server/src/cases/cases.ts` → `listCases`** — lọc theo lớp đi theo **lớp em ĐANG học**
(`homeClassId`), trong khi cột hiển thị vẫn là **lớp lúc đánh giá** (`classId`). Bảng tổng hợp
gom theo cùng ô đó, nên bấm một con số ra đúng danh sách tạo nên nó. Đổi một trong hai mà quên
chỗ kia là cách tạo ra "bảng nói 19 case, bấm vào ra danh sách rỗng".

---

## Thêm một module mới thì làm gì

1. Tạo `server/src/<tên>/` và `web/src/modules/<tên>/`.
2. Nếu có từ vựng riêng, thêm `shared/domain/<tên>.ts` và khai báo ở `shared/domain/index.ts`.
3. Thêm đường dẫn API trong `server/src/routes/index.ts`.
4. Thêm một mục kiểm thử trong `server/src/tests/run.ts`.
5. Thêm một dòng vào bảng "Chín module" ở đầu file này.

## Nguyên tắc giữ ranh giới

- **Fast Track và Normal có form, kiểm tra dữ liệu và workflow RIÊNG.** Dùng chung thành phần
  giao diện cơ bản thì được; tái dùng form nghiệp vụ của bên này cho bên kia bằng cách ẩn vài
  ô thì không — đó là cách chắc chắn nhất để một sửa đổi bên này làm hỏng bên kia.
  Cụ thể: Fast Track có W1/W2 và chấm theo band; Normal có một môn W và chấm theo điểm
  đạt/tổng điểm. Hai môn ĐÓ KHÔNG GỘP VÀO NHAU ở bất kỳ bảng nào. Mọi đường dẫn tới điểm đi
  qua `attemptHref` để mở đúng màn theo loại bài.
- **Case học thuật và Ý thức** là HAI module, hai vòng đời (từ 21/09/2026): case có phương án, duyệt, chu kỳ và
  kết quả; Ý thức có vi phạm độc lập, biện pháp và cảnh báo — không hạn, không đợt, không duyệt. Đừng đưa
  vi phạm vào `sos_cases` và đừng đưa hạn vào vi phạm.
- **Hành trình học viên** tổng hợp từ dữ liệu nguồn, không giữ một bộ điểm hay trạng thái
  riêng — hai bộ số song song là hai bộ số sớm muộn lệch nhau.
