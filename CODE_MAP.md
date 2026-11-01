# Muốn sửa chức năng X thì tìm ở đâu?

Tài liệu này trả lời một câu: *"tôi muốn đổi chỗ này, phải mở tệp nào."*

> **BẮT BUỘC CẬP NHẬT.** Xoá hoặc đổi tên một tệp thì sửa tệp này **trong cùng commit**.
> Một đường dẫn chết ở đây đắt hơn không có dòng nào: người đọc tin nó, mở ra không thấy, rồi đi tìm tay.
>
> Hai lệnh kiểm (chạy ở gốc repo; cả hai phải in rỗng):
>
> ```bash
> # 1. Đường dẫn chết (tên có "/" khớp đuôi một tệp git; tên trần phải có tệp cùng tên)
> git ls-files > /tmp/ls.txt; grep -oE '`[a-zA-Z0-9_./-]+\.(ts|tsx|mjs|sql|md|html|json)`' CODE_MAP.md | tr -d '`' | sort -u | while read -r f; do [ -e "$f" ] || grep -qE "(^|/)$(printf '%s' "$f" | sed 's/\./\\./g')$" /tmp/ls.txt || echo "CHET: $f"; done
> # 2. Tệp chính chưa có trong CODE_MAP (trừ tests, migrate, seed, i18n — đã mô tả theo thư mục)
> git ls-files 'web/src/*.ts' 'web/src/*.tsx' 'server/src/*.ts' 'shared/*.ts' | grep -vE '^server/src/(tests|migrate|seed)/|^shared/i18n/|main\.tsx$|vite-env' | while read -r f; do b=$(basename "$f"); grep -qw "${b%.*}" CODE_MAP.md || echo "THIEU: $f"; done
> ```
>
> Lệnh 1 không mở rộng `{A,B}`: tên trong ngoặc nhọn tự kiểm khi viết.

Cách đọc: mỗi hàng = việc · tệp web · hàm / đường API · tệp máy chủ. Đường đầy đủ ở lần nhắc đầu trong hàng,
sau đó viết tắt. Luật thuần (không đụng DB, máy chủ và web cùng đọc) ở `shared/domain/`. Lịch sử thay đổi: `git log`.

---

## Tra theo MÀN HÌNH

| Màn | Tệp web chính | API · máy chủ |
|---|---|---|
| Khung 4 khu vực, thanh trên / dưới, link cũ chuyển hướng | `web/src/App.tsx` (`ThanhTren`) · `shared/domain/dieuHuong.ts` (`chiaMucThanh`, `chiaThanhDuoi`) | `server/src/platform/nav.ts` → `navOf` |
| Đăng nhập, vào nhanh tài khoản demo, thanh Công cụ demo | `web/src/modules/platform/{WelcomePage,DemoBar}.tsx` | `/demo/session` → `server/src/platform/accounts.ts` |
| Thanh trên: tìm kiếm (`/`, Ctrl K), Thông báo, menu Tài khoản | `web/src/modules/platform/Header.tsx` · `shared/domain/duongHoSo.ts` | `GET /tim/giao-vien` → `server/src/giaoVien/phamVi.ts` (`timGiaoVien`) · `server/src/platform/thongBao.ts` (`thongBaoCua` + Cần làm đã đọc ngoài 50 dòng, `docHet`, `docNhieu`) |
| Tổng quan theo vai (QL · QT / CX · GV · TVV · Admin) | `web/src/modules/worklist/{OverviewPage,TongQuanV5,LopToiDay,MockTestAdmin,Highlights}.tsx` | `GET /tong-quan/v5` → `server/src/worklist/{tongQuanV5,tongQuan,tongQuanQl,tongQuanMt,bangChiNhanh}.ts` |
| Panel "GV chấm quá hạn" | `web/src/modules/worklist/PanelGvTre.tsx` | `GET /tong-quan/gv-tre` → `server/src/worklist/gvTre.ts` · `tongQuanQl.ts` (`treCham`) |
| Công việc (một danh sách, panel làm tại chỗ `?viec=`) | `web/src/modules/congViec/{CongViecPage,HoTroHocVienTab,DanhSachViec,PanelViec}.tsx` | `GET /my-work` → `server/src/worklist/mywork.ts` |
| Công việc của TVV (Báo PH · Sau thi · Chốt ngày thi) | `web/src/modules/congViec/{PanelBaoPhTvv,PanelSauThi}.tsx` | `server/src/worklist/viecTvv.ts` · `server/src/yThuc/baoPhTvv.ts` |
| Hộp Chờ duyệt · Yêu cầu của tôi | `web/src/modules/duyet/{HopChoDuyet,TheYeuCau,YeuCauCuaToi}.tsx` | `GET /yeu-cau` → `server/src/duyet/{yeuCau,loaiYeuCau}.ts` |
| Học viên & Lớp (góc Tất cả · Đang SOS · Cần làm · Lịch thi, dải lớp) | `web/src/modules/students/{StudentsPage,DanhSachHvLop,BangHocVienLop}.tsx` (+ `BangSos.tsx`: chỉ kiểu `DongSos` / `TrangSos` / `CaseTomTat`, `ViecTiepDong`) | `GET /hoc-vien-lop` → `server/src/classes/hocVienLop.ts` · `hocVienSos.ts` (`dangSos`) |
| Học viên & Lớp › góc Phân công GV (QL · Quản trị sửa, CX xem) | `web/src/modules/students/GocPhanCongGv.tsx` · `phanCongGv/{BangLopPc,OGv,TongHopPc,TheLopPc,ThanhLuuPc}.tsx` · hộp Lưu / Chờ đổi `web/src/modules/classes/HopLuuPhanCong.tsx` · hàm thuần `shared/domain/phanCongGv.ts` (`locLopPc`, `nhomLopPc`, `cotLop`, `hangTongHop`, `kiemDongPc`) | `GET /hoc-vien-lop/phan-cong` · `POST /phan-cong/{xem-truoc,luu,hoan-tac,cho/doi-moc,cho/huy}` → `server/src/classes/phanCongGv.ts` |
| Panel một em (Học viên & Lớp) | `web/src/modules/students/PanelMotEm.tsx` | `GET /hoc-vien-lop/em/:id` → `server/src/classes/hocVienSos.ts` (`panelMotEm`) |
| Học viên & Lớp theo vai (TVV · CX · Admin) | `web/src/modules/students/HocVienTheoVai.tsx` | `GET /hoc-vien-lop/theo-vai` → `server/src/classes/hocVienTheoVai.ts` |
| Hồ sơ một học viên | `web/src/modules/students/{StudentDetailPage,DauHoSo,HanhTrinhKyNang,BieuDoD,CotCaseHv}.tsx` | `GET /students/:id` → `server/src/students/profile.ts` (`dauHoSo`) |
| Tab Lộ trình & lớp | `web/src/modules/students/{HanhTrinh,ChuongLop}.tsx` | `server/src/students/hanhTrinh.ts` |
| Ngăn Case (một panel đổi view: case · ghi kết quả · thêm PA · hoàn thành) | `web/src/modules/students/NganCase.tsx` · `web/src/modules/cases/{CasePanel,CapNhatTuan,ThaoTacCase}.tsx` | `GET /cases/:id` → `server/src/cases/cases.ts` (`caseDetail`) |
| Màn một Case `/hoc-thuat/case/:id` | `web/src/modules/cases/CaseBoardPage.tsx` (`CaseRoutePage`) · `CasePanel.tsx` (`ThanCase`) | `server/src/cases/cases.ts` (`caseDetail`, `listCases`) |
| Hồ sơ lớp (đầu trang, tab, ⋮, thanh Việc cần làm) | `web/src/modules/classes/{ClassOverviewPage,DauTrangLop,TabHocVienLop,BangHoSoLop,ThanhViecLop}.tsx` | `/classes/:id/overview` · `/classes/:id/roster` · `/classes/:id/viec-theo-em` → `server/src/classes/{classes,viecTheoEm}.ts` |
| Trang Cuối khoá lớp thường (`?xem=cuoi-khoa`) | `web/src/modules/classes/CuoiKhoaLop.tsx` | `server/src/classes/transition.ts` · `server/src/normal/{cuoiKhoa,kyVong}.ts` |
| Trước / Sau, nút "‹ nguồn", Quay lại đúng nơi | `web/src/ui/ThanhTruocSau.tsx` (`DuongVe`) · `web/src/lib/quayLai.ts` · `shared/domain/{dieuHuongHoSo,quayLai}.ts` | chỉ giao diện |
| Test › Chấm Test (GV) | `web/src/modules/test/{TestPage,ChamTestTab}.tsx` | `GET /my-work` · `GET /my-work/cham-speaking` |
| Test › Lịch Test tuần | `web/src/modules/test/LichTestTab.tsx` · `web/src/modules/test/lichTest/{DaiSo,NhomDau,KhoiNo,HangLop,LuoiNhung}.tsx` | `GET /cham/lich-test` → `server/src/cham/canCham.ts` (`lichTest`, `noQuaHan`) |
| Test › Kế hoạch Test (QL) | `web/src/modules/test/KeHoachTestTab.tsx` · thư mục `web/src/modules/test/keHoach/` | `/ke-hoach-test/*` → `server/src/keHoach/keHoachTest.ts` |
| Nhập điểm lớp · Điểm theo lớp | `web/src/modules/cham/{PanelNhapDiemLop,DiemTheoLop}.tsx` | `GET /classes/:classId/diem-theo-luot` → `server/src/cham/diemTheoLuot.ts` |
| Lưới nhập điểm cả lớp (FT · lớp thường · điện thoại) | `web/src/modules/cham/{LuoiChamLop,LuoiFT,LuoiThuong,MotKyNang}.tsx` | `GET /classes/:classId/cham` → `server/src/cham/canCham.ts` (`chamSheet`) |
| Hồ sơ một lượt Mock `/mock-test/:id` | `web/src/modules/fasttrack/{MockDetailPage,ODiemLon,CaseLuotKn,DongThoiGianLuot}.tsx` | `GET /attempts/:id` → `server/src/fasttrack/attempts.ts` (`attemptDetail`) |
| Hồ sơ một lượt lớp thường `/luot-test/:id` | `web/src/modules/fasttrack/LuotThuongPage.tsx` | `GET /regular/attempts/:id` → `server/src/normal/regular.ts` (`regularAttemptDetail`) |
| Phân tích (Báo cáo · Test + SOS · Kết quả thi · Hiệu quả PA · GV · Ý thức) | `web/src/modules/phanTich/{PhanTichPage,PhanTich,BaoCao,TongHopTestSos,KetQuaThi,HieuQuaPa,PhanTichGiaoVien,YThucPhoiHop}.tsx` | `/phan-tich/*` → thư mục `server/src/phanTich/` |
| Hồ sơ giáo viên `/giao-vien/:id` | `web/src/modules/giaoVien/HoSoGiaoVienPage.tsx` | `server/src/giaoVien/hoSo.ts` (`hoSoGiaoVien`) · `server/src/phanTich/giaoVien.ts` (`chiSoHoSoGv`) |
| Lưu trữ | `web/src/modules/students/{LuuTruPage,TomTatLuuTru}.tsx` | `server/src/classes/luuTru.ts` |
| Quản trị (Tài khoản · Quyền · Chương trình · Bảng quy đổi · Nhật ký) | `web/src/modules/platform/{AdminPage,AccountsAdmin,CatalogAdmin,BangQuyDoiAdmin}.tsx` | `server/src/platform/{accounts,sysconfig,bangQuyDoi,audit}.ts` |
| Hồ sơ cá nhân | `web/src/modules/platform/ProfilePage.tsx` (`ChonKyNang`) | `PATCH /me/profile` |
| Hướng dẫn `/huong-dan`, nút "?", "Chỉ cho tôi" | `web/src/modules/huongDan/{HuongDanPage,NutHuongDan,chiChoToi,MucHuongDan,DaiMoiDung}.tsx` | nội dung `shared/huongDan/index.ts` (`HUONG_DAN`, `manCuaDuong`) |
| Trang Tutor (đang tắt: `/tutor` về `/`) | `web/src/modules/tutor/{TutorPage,PanelTutor,HopTutor,TaiDanhSach}.tsx` | `server/src/tutors/{trang,taiLen}.ts` |
| Sân mẫu thành phần `/dev/thanh-phan` (chỉ dev) | `web/src/modules/dev/{ThanhPhanDemo,BangMauV5,SanMauNen,BangMau}.tsx` | — |
| Sổ tay PDF theo vai | `docs/so-tay/dung/dung.mjs` (dựng + kiểm) · nội dung `docs/so-tay/noi-dung/` | — |

---

## Tài liệu nào để làm gì

| Tệp | Dùng khi nào |
|---|---|
| `plan.md` | Kế hoạch duy nhất: việc còn lại, thứ tự, luật đã chốt (mục 1.6), prompt cho session code |
| `CLAUDE.md` | Luật mặc định mọi session |
| `DESIGN.md` · `PRODUCT.md` | Chuẩn giao diện (Luật V5) · mô tả sản phẩm |
| `DEMO.md` | Mở hồ sơ nào để xem tình huống nào |
| `TRIEN_KHAI.md` | Đưa bản chính lên Netlify + Turso, sao lưu, quay lại bản cũ |
| `thiet-ke/PISA-Rulebook-2026-09-19.md` | Luật sản phẩm do chủ sản phẩm chốt |
| `thiet-ke/SOS_VA_PHOI_HOP_V3.md` · `thiet-ke/NGUON-Rule-Y-thuc-2026-09-21.md` | SOS, Phối hợp SOS, Ý thức (nguồn mới nhất) |
| `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` | Đặc tả Ý thức (khối đầu tệp là luật hiện hành) |
| `thiet-ke/HE_GIAO_DIEN.md` | Token, thành phần chung, bốn trạng thái dữ liệu, mobile, bàn phím |
| `thiet-ke/HOP_DONG_SO_LIEU.md` | Một con số trên dashboard nghĩa là gì, bấm vào ra tập nào |
| `thiet-ke/TU_DIEN_VA_CHU.md` · `thiet-ke/CHU_CAN_SUA_2026-10.md` | Viết / sửa chữ tiếng Việt; danh sách chữ cần sửa (`scripts/quet-chu.mjs` quét lại) |
| `thiet-ke/LUAT_CHO_CHOT.md` | Luật từng chờ chốt (C01–C10); mỗi điểm một hằng số ở `shared/domain/policy.ts` |
| `thiet-ke/BAN_DO_OVERHAUL.md` · `thiet-ke/PISA-Design-Plan-after-PR28.md` | Bản đồ yêu cầu thiết kế, đặc tả thiết kế cũ |
| `docs/superpowers/specs/` | Đặc tả theo đợt (overhaul, V5…) |

---

## Module

Hệ thống chia theo **nghiệp vụ**. Một module có máy chủ, giao diện và luật thuần nằm cạnh nhau.

| Module | Trả lời câu hỏi | Máy chủ | Giao diện |
|---|---|---|---|
| Học viên | Em là ai, đang học gì, đã đi qua đâu | `server/src/students/` | `web/src/modules/students/` |
| Lớp học | Lớp nào, ai dạy, ai học, cuối khoá | `server/src/classes/` | `web/src/modules/classes/` |
| Fast Track | Mock Test, band, SOS, lộ trình | `server/src/fasttrack/` | `web/src/modules/fasttrack/` |
| Lớp thường | FOU / BE / ELE / PET / KET, Progress / Final | `server/src/normal/` | lưới ở `web/src/modules/cham/` |
| Test và chấm điểm | Lịch Test, Kế hoạch Test, nhập điểm | `server/src/{cham,keHoach}/` | `web/src/modules/{test,cham}/` |
| Lộ trình | Tổng kết, thi thật, bước tiếp | `server/src/loTrinh/` | trong `students/` |
| Case | Vấn đề học thuật, PA, kết quả | `server/src/cases/` | `web/src/modules/cases/` |
| Ý thức | Vi phạm, xử lý, Phối hợp SOS | `server/src/yThuc/` | `web/src/modules/yThuc/` |
| Tổng quan và công việc | Ai phải làm gì, chi nhánh thế nào | `server/src/worklist/` | `web/src/modules/{worklist,congViec}/` |
| Chờ duyệt | Mọi thứ "xin QL quyết" | `server/src/duyet/` | `web/src/modules/duyet/` |
| Phân tích · giáo viên | Báo cáo, chỉ số, hồ sơ GV | `server/src/{phanTich,giaoVien}/` | `web/src/modules/{phanTich,giaoVien}/` |
| Tutor | Danh sách tutor, buổi Tutor | `server/src/tutors/` | `web/src/modules/tutor/` |
| Nền tảng | Tài khoản, quyền, tuần, nhật ký, thông báo | `server/src/platform/` | `web/src/modules/platform/` |
| Dịch | Dịch chữ GV nhập | `server/src/dich/` | `web/src/ui/ChuDich.tsx` |
| Dùng chung | Nhãn, nút, panel, bảng, ô ngày | — | `web/src/ui/`, `web/src/lib/` |

Từ vựng nghiệp vụ dùng chung: `shared/domain/` (xuất qua `shared/domain/index.ts`). Hướng dẫn trên web: `shared/huongDan/`.

**Thư mục không liệt kê từng tệp:**
- `shared/i18n/` — `t('chữ Việt', {biến})`, khoá là chữ Việt; `shared/i18n/index.ts` (`t`, `dich`, `ghepChu`); bản Anh theo đợt ở `shared/i18n/en/<đợt>.ts`, gộp ở `shared/i18n/en.ts`. Thêm chữ mới = thêm vào tệp `en/` của đợt; tsc báo chữ thiếu bản Anh.
- `server/src/migrate/` — mỗi đợt một tệp `pr<Ma>.ts`, gọi theo thứ tự từ `server/src/migrate.ts`; `server/src/migrate/run.ts` = `npm run migrate`. Chạy lặp an toàn. Bảng gốc: `server/src/schema.sql`.
- `server/src/seed/` — bộ demo (mục dưới); `<tínhNăng>Seed.ts` = dữ liệu demo theo tính năng, gọi từ `seed.ts`.
- `server/src/ops/` — lệnh `npm run …`: `run*.ts` là điểm chạy, luật ở tệp cùng tên (initBanChinh, runInit, themChiNhanh, saoLuu, runSaoLuu, khoiPhuc, runKhoiPhuc, thuTurso, xoaKhoTep, kiemSauInit, chotVangDinhKy, demBoTroTrung, kiemOLop, kiemDuLieuMt, kiemTieuChiLe). Lệnh kiểm trước một lần (`kiem-truoc-*`) đã xoá sau deploy 28/10 (GON-MA-3) — cần thì lấy lại từ git.
- `server/src/tests/` — `chayNhom.ts` = phần phép kiểm của `npm run check` / `npm test`: chạy `run.ts` chia `PISA_SO_NHOM` nhóm song song (mặc định 3; `=1` một tiến trình) + `tocDo.run.ts` cùng lúc. `run.ts` gọi mọi `*.tests.ts`; `PISA_CHI_TEP=a,b` chạy riêng vài tệp. `dbGoc.ts` (CN-1/2): DB chụp ngay sau seed; mọi tệp trừ `GIU_CHUOI` của `run.ts` chạy trên bản chép mới của nó (`PISA_DOC_LAP=a,b` thử), chia nhóm tham lam theo `THOI_GIAN_MS` (`chiaThamLam`); tệp đứng trước prTk có thêm phép `[BB] <tệp>` (`batBienDb`). Tệp phép kiểm mới phải tự dựng dữ liệu (không dựa vào tệp khác).

---

## Bộ dữ liệu demo

Dựng **từ hành trình học viên**, viết tay, không sinh ngẫu nhiên.

| Tệp | Chứa gì |
|---|---|
| `server/src/seed/journeys.ts` | Kiểu kịch bản · giáo viên · lớp và phân công |
| `server/src/seed/students.ts` | Toàn bộ hành trình học viên, từng con số |
| `server/src/seed/build.ts` | Đọc kịch bản, ghi xuống bảng theo thứ tự đời thật |
| `server/src/seed/seed.ts` | Chi nhánh, vai, quyền, tài khoản, chương trình, tuần; gọi các `*Seed.ts` |
| `server/src/seed/duLieuNen.ts` | Dữ liệu nền chung cho demo và bản chính (`napDuLieuNen`) |
| `server/src/seed/uxSeed.ts` · `server/src/seed/lonSeed.ts` | Dữ liệu chụp mockup V5 · lớp lớn để đo (chỉ khi `SEED_LON=1`) |

Đổi một câu chuyện: sửa `server/src/seed/students.ts` rồi `npm run seed`. Thêm loại dữ liệu: thêm trường ở `journeys.ts`, xử lý ở `build.ts`.

---

## Tra nhanh theo việc muốn sửa

### Học viên

| Muốn sửa | Mở tệp |
|---|---|
| Bảng HV một lớp (cột, lịch sử điểm 2–3 mốc) | `web/src/modules/students/ClassRoster.tsx` (kiểu dòng, `KetLuan`) · `server/src/classes/classes.ts` → `classRoster` |
| Chip lọc, badge lớp, kết quả gần nhất | `shared/domain/hocVienLop.ts` (`LOC_HOC_VIEN`, `docThamSoLoc`, `ketQuaGanNhat`, `badgeLop`, `demLoc`) |
| Menu ⋯ dòng HV · ⋯ đầu hồ sơ lớp | `web/src/modules/classes/thaoTacDongHocVien.tsx` · `shared/domain/hocVienLop.ts` (`mucMenuDongHocVien`, `menuHoSoLop`) · `server/src/classes/dongHocVien.ts` (`viecHocVienTheoLop`) |
| Việc tiếp theo của em (một nguồn cho mọi cột) | `shared/domain/hocVienLop.ts` → `viecTiepCuaEm` · `web/src/ui/ViecTiep.tsx` · `server/src/cases/caseLop.ts` → `chiTietCaseMo` |
| Ô Sắp tới (`MT2 · W3 OCT · 5.5`) · câu tình trạng đầu hồ sơ | `shared/domain/sapToi.ts` (`chuSapToi`) · `server/src/students/standing.ts` (`nextKyVong`, `nhanLuotChuaXep`) |
| Lọc thêm + tích chọn HV | `shared/domain/locThem.ts` (`khopLocThem`) · `server/src/classes/hocVienLop.ts` |
| Góc Lịch thi (Kết luận trên hàng, ghi chú họp) | `web/src/modules/students/GocLichThi.tsx` · `shared/domain/lichThiOv15f.ts` (`trangThaiLichThi`, `nhanLichThi`) · `server/src/classes/lichThi.ts` |
| Xuất Excel danh sách HV | `web/src/modules/students/NganXuatDs.tsx` · `shared/domain/lichThiOv15f.ts` (`bangXuatDanhSach`) · `POST /hoc-vien-lop/xuat` → `server/src/classes/xuatDanhSach.ts` |
| Đầu hồ sơ, thanh việc, bốn ô | `web/src/modules/students/DauHoSo.tsx` · `server/src/students/{profile,viecHocVien}.ts` · `shared/domain/hoSoHocVien.ts` (`parseHoSoTab`, `ketQuaTestGanNhat`) |
| Tuần học thứ n, khoảng Tạm dừng, "em đang học" | `shared/domain/hienThiNgay.ts` (`tuanHocFt`, `chuTuanHoc`) · `server/src/students/tamDung.ts` (`khoangTamDung`, `HV_DANG_HOC_SQL`) |
| Ngày / tuần hiển thị | `shared/domain/hienThiNgay.ts` (`ngay`, `tuanLich`, `tuanKhoa`) · trục tuần biểu đồ `shared/domain/trucTuan.ts` |
| Hành trình theo kỹ năng (biểu đồ, Case & PA cột phải) | `web/src/modules/students/{HanhTrinhKyNang,BieuDoD,CotCaseHv}.tsx` |
| Tab Lộ trình & lớp (lưới, chuỗi ▲▼, PA theo tầng, chương theo lớp) | `web/src/modules/students/HanhTrinh.tsx` (`KhoiPa`) · `shared/domain/hanhTrinh.ts` (`chuoiDiem`, `nhanGhim`, `xepTang`, `chiaChuong`) · `server/src/students/hanhTrinh.ts` |
| Bảng kỹ năng thành thẻ < 640 px; link "MT2 · Speaking" | `web/src/modules/cases/TheKyNang.tsx` · `shared/domain/duongHoSo.ts` (`duongDotTest`, `docKnMock`) |
| Bài trên lớp (không vào MT / KPI) | `web/src/modules/students/TienDoTrenLop.tsx` · `shared/domain/baiTrenLop.ts` · `server/src/students/baiTrenLop.ts` (`themBaiTrenLop`) |
| Sửa thông tin một em (Target, TVV, đầu vào, liên hệ) | `web/src/modules/students/StudentManagePanel.tsx` (`ThongTinPanel`) · `shared/domain/{quanLyHocVien,lienHe}.ts` · `server/src/students/students.ts` |
| Email là định danh, không trùng | `server/src/students/emailHocVien.ts` (`emailDangDung`, `cauEmailTrung`) |
| Thêm HV, nhập / dán Excel | `web/src/modules/students/IntakePanel.tsx` · `shared/domain/nhapHocVien.ts` (`cotLuoiNhap`, `laDongTieuDe`) · `server/src/classes/intake.ts` |
| Badge "Thiếu thông tin" | `web/src/modules/students/MissingBadge.tsx` · `server/src/classes/schedule.ts` → `missingForStudent` |
| Lịch sử sửa thông tin HV | `web/src/ui/LichSuThayDoi.tsx` · `server/src/students/lichSuSua.ts` (`lichSuSua`) · `server/src/platform/lichSu.ts` |
| Xoá học viên (gõ XOÁ) | `web/src/modules/students/XoaHocVienPanel.tsx` · `server/src/students/xoaHocVien.ts` (`xemXoaHocVien`, `xoaHocVien`) · phép kiểm `xoaDuLieu.tests.ts` |
| Lưu trữ · Thôi học · Hoàn tác Tạm dừng | `server/src/students/students.ts` (`archiveStudent`, `unarchiveStudent`, `setStudentStatus`, `hoanTacTamDung`) |
| Tạm dừng / Kết thúc học · Quay lại học | `web/src/modules/students/{HopTamDungKetThuc,QuayLaiHoc}.tsx` · `server/src/students/trangThaiHv.ts` (`tomTatTrangThai`, `chanLenhCho`, `thongTinQuayLai`) |
| Làm nhiều HV một lần (xem trước, lô 8) | `web/src/modules/students/{chonNhieuHocVien,XemTruocHangLoatPanel}.tsx` · `hangLoatEm.ts` · `shared/domain/hangLoatEm.ts` · `server/src/students/hangLoat.ts` |
| Học lại, mở lộ trình mới | `server/src/students/students.ts` (`hocLai`, `moLoTrinhMoi`) · panel `web/src/modules/students/PanelLoTrinhMoi.tsx` |
| Các lộ trình · Tổng kết · Kết quả thi thật | `web/src/modules/students/{CacLoTrinh,NganTongKet,KetQuaThiThatPanel}.tsx` · `server/src/loTrinh/{banChup,tongKet,thiThat}.ts` · `shared/domain/tongKetLoTrinh.ts` |
| Bước tiếp sau thi thật | `web/src/modules/students/PanelBuocTiep.tsx` · `server/src/loTrinh/buocTiep.ts` (`choBuocTiep`) · `shared/domain/tongKetLoTrinh.ts` (`goiYSauThi`) |
| Hạn sau thi + Gia hạn | `web/src/modules/students/HopGiaHan.tsx` · `server/src/loTrinh/thiThat.ts` (`datHanSauThi`, `sauThiCuaEm`) · `cotSauThi.ts` (tệp lá, tránh vòng import) |
| Kết luận khoá + Mini Test | `web/src/modules/students/KetLuanKhoa.tsx` · `server/src/normal/cuoiKhoa.ts` (`ghiMiniTest`) |
| Panel Lộ trình: lịch MT tại hàng | `web/src/modules/students/{StudentPlanPanel,HangLichMt}.tsx` · `server/src/keHoach/keHoachTest.ts` → `lichMtLoTrinh` |
| Bộ demo H1–H4 Học viên & Lớp | `server/src/seed/hvlSeed.ts` (`buildHvlDemo`) |

### Lớp học

| Muốn sửa | Mở tệp |
|---|---|
| Tạo một / nhiều lớp (một giao dịch lớp + phân công) | `web/src/modules/classes/{ClassCreatePanel,LuoiTaoLop}.tsx` · `POST /classes`, `/classes/bulk` → `server/src/classes/intake.ts` (`taoLopVaPhanCong`, `taoLopHangLoat`) |
| Tên lớp `{CN} {chương trình} {số}` | `shared/domain/tenLop.ts` (`ghepMaLop`, `kiemSoLop`, `soSanhLop`, `goiYSoTiep`) |
| Thông tin lớp (Lớp · Phân công · Lịch Test) | `web/src/modules/classes/ThongTinLopPanel.tsx` · `PATCH /classes/:id/thong-tin` → `server/src/classes/thongTinLop.ts` (`capNhatThongTinLop`) |
| Phân công GV (FOU hai GV, ô Tổng hợp) | `web/src/modules/classes/TeacherAssignPanel.tsx` · `shared/domain/phanCong.ts` (`oPhanCong`, `kiemPhanCong`) · `server/src/classes/classes.ts` (`setClassTeachers`, `ghiPhanCong`) |
| Phân công GV cả chi nhánh, lịch đổi (hiệu lực), Hoàn tác, GV cũ chỉ xem | `server/src/classes/phanCongGv.ts` (`luuPhanCong`, `apDoiLop`, `apDoiDenHan`, `doiMocCho`, `huyCho`, `hoanTacLuu`, `trangPhanCongGv`, `xemTruocLuu`) · bảng `doi_phan_cong` · `shared/domain/phanCongGv.ts` (`doiTheoO`, `demPhanCong`) · chuyển Case / PA `server/src/cases/owner.ts` (`chonViecChuyen`, `chuyenViecKhiDoi`) · quyền xem tạm `server/src/permissions.ts` (`xemTamCo`) |
| Tên GV là link hồ sơ GV | `web/src/modules/classes/TenGiaoVien.tsx` |
| Tuần khai giảng, Progress / Final, lớp đang tuần mấy | `web/src/modules/classes/ClassProgressPanel.tsx` (`PhanLichTest`) · `server/src/classes/schedule.ts` (`classProgress`, `suggestedMockWeeks`) |
| Sửa thông tin cả lớp (≤ 60 dòng, một giao dịch) | `web/src/modules/students/SuaCaLopPanel.tsx` · `server/src/classes/suaCaLop.ts` (`xemTruocSuaCaLop`, `luuSuaCaLop`) |
| Cần hỗ trợ theo kỹ năng | `web/src/modules/classes/BangCanHoTro.tsx` · `shared/domain/hocVienLop.ts` (`hangCanHoTro`) · `server/src/classes/canHoTro.ts` (`canHoTroLop`) |
| Phân tích lớp, bảng vấn đề kỹ năng | `web/src/modules/classes/{PhanTichLopTab,ClassIssueBoard}.tsx` · `server/src/cases/effectiveness.ts` (`issueBoard`) · `server/src/classes/phanTichLop.ts` (`oPhanTichLop`, `danhGiaMon`) |
| Bảng điểm lớp thường ở hồ sơ lớp | `web/src/modules/classes/BangDiemLopThuong.tsx` |
| Kết quả đầu ra lớp trước (lớp FT) | `web/src/modules/classes/BangKqdrLopFt.tsx` · `server/src/normal/kyVong.ts` (`kqdrLopFt`) |
| Đánh giá đầu ra lớp thường | `server/src/classes/danhGiaDauRa.ts` · `shared/domain/cuoiKhoa.ts` (`danhGiaDauRa`) |
| Góp ý hàng tuần (chỉ xem lịch sử) | `server/src/classes/gopYTuan.ts` · `shared/domain/gopYTuan.ts` |
| Nhãn Ý thức ở dòng HV | `web/src/modules/classes/CanhBaoYThuc.tsx` |
| Lớp đã kết thúc (chỉ xem) · Kết thúc / Mở lại lớp | `server/src/classes/classes.ts` (`classOverview`) · `web/src/modules/classes/XoaKetThucLopPanel.tsx` · `server/src/classes/xoaKetThucLop.ts` (`moLaiLop`) |
| Tab Tổng kết lớp đã kết thúc | `web/src/modules/classes/TabTongKetLop.tsx` · `server/src/loTrinh/tongKet.ts` |
| Chi nhánh mặc định | `shared/domain/chiNhanhMacDinh.ts` · `web/src/ui/Filters.tsx` (`useChiNhanhMacDinh`) · `server/src/classes/hocVienLop.ts` (`goiYChiNhanh`) |

### Fast Track (Mock Test)

| Muốn sửa | Mở tệp |
|---|---|
| Mốc MT mặc định, kỳ vọng từng lượt, nhãn lượt | `shared/domain/fasttrack.ts` (`expectationDelta`, `nhanLuot`) · lịch gốc `shared/domain/lichMt.ts` (`lichMtGoc`) |
| Luật lịch MT (theo lộ trình, MT cũ, đánh số, trần MT8) | `shared/domain/lichMt.ts` (`docLichMt`, `soMtKeTiep`, `MT_TOI_DA`) · `server/src/classes/schedule.ts` (`apLichMacDinh`, `lichMtCua`) |
| Tự tạo MT mặc định khi mở lộ trình | `server/src/fasttrack/mtMacDinh.ts` → `taoMtMacDinh` |
| Đánh số MT (một chốt), hồi sinh số huỷ | `server/src/fasttrack/attempts.ts` → `createAttempt` · `server/src/fasttrack/cycles.ts` (`nextAttemptNo`) |
| Lộ trình, Target, Dự kiến thi, KCK | `server/src/fasttrack/cycles.ts` (`examPlanOf`) · `web/src/ui/ui.tsx` → `ExamPlanText` · `shared/domain/nhapHocVien.ts` (`tachKck`) |
| Môn đăng ký của lộ trình | `shared/domain/monDangKy.ts` · `server/src/fasttrack/monDangKy.ts` (`apMonDangKy`) · nút `web/src/ui/NutMon.tsx` |
| Số câu → band, mức SOS | `server/src/fasttrack/scoring.ts` (`bandFromRaw`, `writingBand`) · `attempts.ts` (`resultOf`) · bảng quy đổi `server/src/platform/bangQuyDoi.ts` · web `shared/domain/chamDiem.ts` (`bandTuSoCau`) |
| Overall so lượt trước | `server/src/fasttrack/overallLuot.ts` (`luotTheoLoTrinh`, `luotTruocCoOverall`) |
| Lịch, phạm vi, hạn chấm của TỪNG kỹ năng | `server/src/fasttrack/skillSchedule.ts` (`setSkillWeek`, `completionWeekOf`, `checkWeekVsNeighbours`) · `server/src/platform/week.ts` (`skillScoreDeadline`) |
| Không nhập trước tuần thi · dời vượt lượt sau | `server/src/fasttrack/skillSchedule.ts` (`kiemDaToiTuanThi`, `kiemVuot`, `boTuanLuot`) · `shared/domain/lichMt.ts` (`luotBiVuot`) |
| Cờ "còn ô chờ điểm" của lượt | `server/src/fasttrack/conOCho.ts` (`capNhatConOCho`, `capNhatConOChoLop`) |
| Đếm "bài cần chấm" (một chỗ) · ai phụ trách bài thiếu | `shared/domain/fasttrack.ts` → `pendingSkillsOf` · `server/src/fasttrack/attempts.ts` (`ownersOf`, `classScoreSheet`) |
| Ô điểm ± kỳ vọng, bốn màu | `web/src/modules/cases/SkillBoard.tsx` (`DongMt`, `gapText`, `SCORE_CHIP_ROW`) · `server/src/cases/cases.ts` → `skillSupportBoard` |
| Ô MT dùng chung (trạng thái đợt) | `shared/domain/oMt.ts` (`oMt`, `chipDongKyNang`) · `web/src/ui/OMt.tsx` (`OMt`) |
| Thao tác một kỹ năng theo trạng thái | `shared/domain/thaoTacMt.ts` (`thaoTacKyNang`, `menuHopKyNang`) · `web/src/modules/fasttrack/HopThaoTacMt.tsx` |
| Hộp nhập điểm MT, band W / S tự tính | `web/src/modules/fasttrack/HopNhapDiem.tsx` (`ODiemMt`, `HopNhapDiem`) · `shared/domain/chamDiem.ts` (`duocNhapBandThang`) · `attempts.ts` → `saveScore` |
| Lưu · bài tiếp › | `web/src/modules/cham/phienCham.ts` (`usePhienCham`) · `shared/domain/baiKeTiep.ts` (`baiKeTiep`) |
| Nhận xét W / S, GV chấm, nhóm nguyên nhân | `web/src/modules/fasttrack/NhanXet.tsx` · `web/src/modules/cham/GvCham.tsx` (`useGvChamCot`) · `shared/domain/nhanXet.ts` (`kiemNhanXet`, `kiemNhomNguyenNhan`) |
| Tên 4 tiêu chí (W1 TA, W2 TR) | `shared/domain/skills.ts` (`tieuChiCua`) |
| Speaking chấm chéo | `shared/domain/chamDiem.ts` (`laChamCheo`) · `server/src/permissions.ts` (`lopFtChoGvSpeaking`) · `server/src/cham/chamCheo.ts` (`baoChamCheoQuaHan`) |
| Nhận xét GV phụ trách Speaking | `server/src/fasttrack/attempts.ts` (`gvPhuTrachS`, `luuNhanXetPhuTrach`) |
| Dấu "-" / vắng: một luật mọi cổng | `shared/domain/vang.ts` (`chuyenVang`, `luatVangThuong`) · `server/src/fasttrack/absence.ts` (`baoVang`, `chotVangNgay`) · `web/src/modules/cham/thongBaoVang.ts` |
| Xoá "-" = hết vắng · dời do vắng · vắng lần 2 | `server/src/fasttrack/absence.ts` (`goVangDaChot`, `xuLyVangMotKyNang`, `huyVangNoi`, `xinDoi`, `khongMockLai`) |
| Huỷ lượt / huỷ điểm / khôi phục (`ket_qua_huy`) | `server/src/fasttrack/ketQuaHuy.ts` (`catHuyLuot`, `khoiPhucKetQua`, `khoiPhucDiem`) · `attempts.ts` (`huyLuot`, `reopenAttempt`) · `web/src/modules/test/keHoach/HopKhoiPhucKetQua.tsx` |
| MT cũ (lịch sử): không nợ, nhắc chưa nhập | `server/src/fasttrack/skillSchedule.ts` → `viewSkill` · `server/src/cham/canCham.ts` → `mtLichSuChuaNhap` |
| Đợt hoàn tất, ai sửa sau | `server/src/fasttrack/hoanTat.ts` (`dotHoanTat`, `quyenSuaSauHoanTat`) |
| SOS tạm thời → chốt; KCK của lượt | `shared/domain/fasttrack.ts` (`kyNangXongThieu`) · `server/src/fasttrack/attempts.ts` (`refreshOutcome`, `kckCuaLuot`) |
| MT0 (em lớp thường lên FT) | `shared/domain/mt0.ts` · `server/src/fasttrack/mt0.ts` (`dongBoMt0`, `noiMt0VaoFt`, `keHoachVeThuong`) |
| Đổi LT ↔ RF: Case theo lộ trình mới | `server/src/cases/systemClose.ts` → `chuyenCaseSangLoTrinh` · `server/src/fasttrack/attempts.ts` → `routeCuaLuot` |
| Lượt S Expert (không vào Overall / SOS) | `server/src/cham/sExpert.ts` (`themSEx`, `xoaSEx`) · `web/src/modules/test/keHoach/HopSEx.tsx` |
| Bảng lịch kiểm tra trong hồ sơ Mock | `web/src/modules/fasttrack/MockDetailPage.tsx` · ô điểm lớn `ODiemLon.tsx` (`DaiODiemLon`) |

### Lớp thường

| Muốn sửa | Mở tệp |
|---|---|
| Môn theo chương trình (FOU G+V, P; Pre FOU Tổng hợp), số tuần, mốc | `shared/domain/normal.ts` (`REGULAR_SKILLS`, `PROGRAMME_TEMPLATES`, `tenMon`, `boMonLich`) · `server/src/fasttrack/skillSchedule.ts` → `boMonCuaLuot` |
| Ngưỡng đạt, Pre FOU theo % tổng | `shared/domain/normal.ts` (`ratioResult`, `RATIO_PASS_THRESHOLD`) · `server/src/normal/regular.ts` (`evaluateRegular`) · `shared/domain/chamDiem.ts` (`ketQuaThuong`) |
| Điểm → Case Giữa khoá; bài mặc định; "-" dời tuần sau | `server/src/normal/regular.ts` (`refreshRegularOutcome`, `taoBaiThuongMacDinh`, `reportRegularNoShow`) · `shared/domain/lopThuong.ts` |
| Cuối khoá (dải, hướng gợi ý, Mini Test) | `shared/domain/cuoiKhoa.ts` (`goiYCuoiKhoa`, `tacDongChot`) · `server/src/normal/cuoiKhoa.ts` (`cuoiKhoaTheoHocVien`, `ghiKetLuanFt`) |
| Kỳ vọng (MT0 → FT) | `server/src/normal/kyVong.ts` (`panelKyVong`, `luuKyVong`) · `shared/domain/cuoiKhoa.ts` (`KY_VONG_DAU_RA`) |
| Bổ trợ Final (sinh khi đủ điểm + có quyết định) | `server/src/normal/cuoiKhoa.ts` (`dongBoCheTaiFinal`, `taoBoTroFinal`) |
| Chương trình liên tục (PET / KET), Checkpoint, kỳ thi Cambridge | `shared/domain/normal.ts` (`laLienTuc`) · `server/src/normal/regular.ts` (`sinhCheckpointKeTiep`) · `shared/domain/kyThi.ts` · `shared/domain/lopThuong.ts` (`chipCheckpoint`) |
| Bài nào mở màn nào (Mock hay lượt thường) | `server/src/fasttrack/attempts.ts` → `attemptHref` · `web/src/lib/format.ts` |

### Test và chấm điểm

Một lưới cho hai loại lớp: `chamSheet` trả `mode` (`ielts_band` / `ratio`), trang chọn lưới. Hai lưới vẫn là hai tệp riêng.

| Muốn sửa | Mở tệp |
|---|---|
| Phần lưới chung (chọn theo `mode`, màn hẹp một kỹ năng) | `web/src/modules/cham/LuoiChamLop.tsx` |
| Lưới FT · lưới lớp thường · điện thoại · thẻ 375 | `web/src/modules/cham/{LuoiFT,LuoiThuong,MotKyNang}.tsx` (`TheHv`, `DongSExHv`) |
| Ô điểm lớp thường, sửa điểm phải lý do | `web/src/modules/fasttrack/ScoreEntry.tsx` (`ODiemThuong`, `SuaDiemCoLyDo`) · `server/src/fasttrack/attempts.ts` (`saveScore`) · `server/src/normal/regular.ts` (`saveRegularScore`) |
| Luật thuần chấm: dựng lệnh điểm, nhãn hàng lớp | `shared/domain/chamDiem.ts` (`rawPatchFrom`, `criteriaPatchFrom`, `nhanLopLichTest`) |
| Lịch sử một bài | `web/src/modules/cham/NganLichSuBai.tsx` · `server/src/fasttrack/attempts.ts` → `scoreHistoryOf` |
| Điểm theo lớp: mã lượt, dòng tuần thi | `shared/domain/diemTheoLuot.ts` (`docMaLuot`, `luotMacDinh`) · `web/src/modules/cham/DongThi.tsx` |
| Dán Excel điểm (API còn, web không gọi) | `server/src/cham/luuLo.ts` → `luuDiemLo` |
| Lịch Test: khung mặc định, ba khối, nợ quá hạn | `shared/domain/khungLichTest.ts` (`khungLichTestMacDinh`) · `server/src/cham/canCham.ts` (`lichTest`, `noQuaHan`, `hangLopTuan`) · `web/src/modules/test/lichTest/{moLop,kieu}.ts` |
| Kế hoạch Test FT + lớp thường (lưới HV × đợt, chip kỹ năng, hộp một đợt) | `web/src/modules/test/keHoach/{LopKeHoach,LuoiKeHoach,ChipKyNang,HopKyNang,TuanNho}.tsx` · `shared/domain/keHoachTest.ts` |
| Xếp lịch MT nhiều lớp / theo học viên | `web/src/modules/test/keHoach/{NganXepLichMt,NganXepHangLoat,XepTheoHocVien}.tsx` · `server/src/keHoach/keHoachTest.ts` (`xepHangLoat`, `thiLai`) |
| Kế hoạch Test: tìm, ghi chú lịch thi, Xuất | `web/src/modules/test/keHoach/{TimLop,TimKeHoach,GhiChuLichThi,NganXuatKeHoach,NganXuatDiem}.tsx` · `taiXlsx.ts` · `shared/domain/keHoachOv15c.ts` |
| Xuất Excel kết quả Test | `web/src/modules/test/NganXuatMt.tsx` · `shared/domain/xuatMt.ts` · `server/src/phanTich/xuatMt.ts` (`duLieuXuatMt`; đợt lớp thường Progress · Checkpoint · Final — `kindCuaDot`) |
| Báo "n ô chưa lưu" lên đầu trang | `web/src/ui/SaveState.tsx` (`SaveIndicator`, `useBaoLuu`) |

### Case

Chỉ Case **học thuật**. Bảng `sos_cases`; Ý thức là module riêng.

| Muốn sửa | Mở tệp |
|---|---|
| Tín hiệu từ điểm (FT), thu hồi / đối soát khi sửa điểm | `server/src/cases/signals.ts` (`raiseSignal`, `withdrawSignalsNoLongerValid`, `reconcileCorrectedSignals`) |
| Luật sinh Case sau MT, Case tự tạo | `server/src/cases/sos.ts` (`taoCaseTuDong`, `upsertCategoryCase`, `raiseSignalsForResult`) |
| SOS v4: hạn xác nhận, mốc PA quy chế, nhãn trạng thái, việc tiếp | `shared/domain/sosV4.ts` (`hanXacNhan`, `trangThaiCaseV4`, `viecTiepCuaCase`, `tenCaseSos`) |
| Xác nhận Case / PA / Không cần theo dõi | `server/src/cases/sosAuto.ts` (`xacNhanCase`, `xacNhanPaQuyChe`, `xacNhanPaNhieu`) · `web/src/modules/yThuc/CaseSosControls.tsx` |
| Case SOS là gì, Case tạm (không đếm) | `server/src/cases/sosState.ts` (`LA_CASE_SOS`, `CASE_THAT`) |
| Nguyên nhân Case MT = nhận xét của ô | `server/src/cases/nguyenNhanO.ts` |
| Vòng đời Case, PA, kết quả | `server/src/cases/cases.ts` (`reportIssue`, `updateResult`, `closeBlockers`, `normalizeMetrics`) |
| Form + Case (một hoặc nhiều kỹ năng) | `web/src/modules/cases/QuickReport.tsx` · `server/src/cases/cases.ts` (`reportIssue`, `reportIssues`) |
| Từ vựng Case: hạng mục, nguyên nhân, PA, kết quả, hạn | `shared/domain/cases.ts` (`CASE_CATEGORIES`, `ISSUE_TAXONOMY`, `INTERVENTION_KINDS`, `FOLLOWUP_OUTCOMES`, `cycleDeadline`, `signalVerifyDue`) |
| Người phụ trách Case (đổi, tự gán khi thiếu) | `web/src/modules/cases/DoiNguoiPhuTrach.tsx` · `server/src/cases/owner.ts` (`doiChuCase`, `ganChuCaseThieu` — kèm đổi chủ theo lớp mới khi chuyển lớp, DON-LUONG K8) |
| Người thực hiện (một kiểu chọn, một chỗ kiểm) | `shared/domain/nguoiThucHien.ts` · `server/src/cases/nguoiThucHien.ts` (`chuanHoaNguoiThucHien`) · `web/src/ui/PeoplePicker.tsx` (`ChonNguoi`) |
| PA một mẫu (Thêm · Sửa · Thay · Xác nhận) | `web/src/modules/cases/FormPa.tsx` · `shared/domain/paDongBo.ts` · `server/src/cases/taoPa.ts` (`chenPa`) |
| Ghi kết quả PA, ghi gọn, Hoàn tác, Sửa lần ghi | `web/src/modules/cases/{CapNhatTuan,GhiNhanh}.tsx` · `server/src/cases/cases.ts` (`updateResult`, `hoanTacKetQua`, `suaChuKetQua`, `daoKetQua`) · `giuKetQua.ts` (`nguoiGiuKetQua`) |
| Nhật ký PA | `web/src/modules/cases/FormPa.tsx` → `NhatKyPa` · `server/src/cases/planRevisions.ts` |
| Đề xuất đổi PA · dòng Xin ý kiến | `web/src/modules/cases/{DoiPa,DongXinYKien}.tsx` · `server/src/cases/doiPa.ts` (`deXuatDoiPa`, `apDungDoiPa`) |
| Cần bổ sung đánh giá · chi tiết theo thành phần kỹ năng | `web/src/modules/cases/{NeedsEvaluation,ChiTietKyNang}.tsx` |
| Mở lại, sửa, xoá Case; xoá / kết thúc PA | `server/src/cases/cases.ts` (`moLaiCase`, `suaCase`, `xoaCase`, `xoaPa`, `ketThucPaQuyChe`) · `web/src/modules/cases/MenuXoaPa.tsx` (`MenuPa`) |
| PA Bổ trợ · PA đại diện nhóm Bổ trợ | `server/src/cases/boTro.ts` · `shared/domain/daiDienBoTro.ts` |
| Buổi Tutor trong kết quả PA | `web/src/modules/cases/BuoiTutorO.tsx` · `server/src/cases/cases.ts` (`ghiBuoiTutor`) · `server/src/tutors/chon.ts` |
| Hệ thống tự đóng Case | `server/src/cases/systemClose.ts` (`closeCasesBySystem`, `closeCasesOnProgrammeSwitch`) |
| Bảng kỹ năng ở hồ sơ, Case + PA dưới hàng kỹ năng | `web/src/modules/cases/TheKyNang.tsx` (`KhoiCase`, `KhoiPa`; `SkillBoard.tsx` giữ kiểu + `TenCase` / `NhanLoai` dùng chung) |
| Hiệu quả PA (đếm thành công / thất bại, n/N) | `server/src/cases/effectiveness.ts` (`planOutcomes`) · `server/src/phanTich/hieuQuaPa.ts` · `web/src/modules/phanTich/HieuQuaPa.tsx` |
| Lớp + chương trình gốc của Case | `server/src/cases/sos.ts` (`caseKhacChuongTrinh`) |

### Ý thức

| Muốn sửa | Mở tệp |
|---|---|
| Luật Ý thức (thang, bắt buộc, sáu nhãn) | `shared/domain/yThuc.ts` (`THANG`, `batBuocTu`, `trangThaiViPham`) · nhãn lịch sử, cảnh báo trùng `shared/domain/yThucGon.ts` |
| Một cửa trạng thái mọi em | `server/src/yThuc/trangThai.ts` (`trangThaiYThuc`, `emCuaLop`) |
| Ghi / sửa / xoá vi phạm, ghi nhiều | `server/src/yThuc/violations.ts` (`recordViolations`) · `web/src/modules/yThuc/{RecordViolationPanel,ChiTietViPham,DeleteViolationConfirm}.tsx` (xoá: `xoaViPham` một hàm) |
| Xác nhận xử lý · Khai bậc · Đề xuất · Đã thực hiện · Thu hồi | `server/src/yThuc/xuLy.ts` (`thuHoiXuLy`, `suaXuLy`) · `web/src/modules/yThuc/{XacNhanXuLyPanel,KhaiBacPanel,DaThucHienPanel,XemXuLyPanel}.tsx` |
| Nhiều em cùng lúc ở mức lớp (lô) | `server/src/yThuc/lo.ts` (`loXuLy`, `loCapBac`) · `web/src/modules/yThuc/{LoYThucPanel,KhaiBacLoPanel}.tsx` |
| Tab Ý thức lớp · tab Ý thức HV | `server/src/yThuc/board.ts` (`bangYThucLop`) · `web/src/modules/yThuc/{ClassYThucCard,StudentYThucSection}.tsx` |
| Thang, nhãn vi phạm, panel chung | `web/src/modules/yThuc/{ThangYThuc,NhanViPham,panelYThuc}.tsx` · kiểu `web/src/modules/yThuc/kieu.ts` |
| Phối hợp SOS (GVCN sau Mock có SOS) | `server/src/yThuc/phoiHop.ts` (`confirmCoordination`, `docBanChup`, `moLaiCoordination`) · `PhoiHopSosSection.tsx` (`TheSos`) · hạn `shared/domain/sos.ts` (`hanPhoiHop`) |
| Chỉ số Ý thức | `server/src/yThuc/thongKe.ts` · Phân tích `server/src/phanTich/yThucPhanTich.ts` |
| Ai được ghi / xử lý / xem | `server/src/yThuc/access.ts` · `server/src/permissions.ts` |
| Bằng chứng (tệp, dán ảnh, liên kết) | `web/src/ui/{BangChung,TepCho}.tsx` · `shared/domain/bangChung.ts` · `server/src/platform/attachments.ts` (`chepTep`) |
| Thẻ duyệt Ý thức | `server/src/duyet/loaiYeuCau.ts` |
| Demo Ý thức (tình huống a–m) · phép kiểm | `server/src/seed/yThucSeed.ts` · `yThuc.tests.ts` |

### Tổng quan và công việc

| Muốn sửa | Mở tệp |
|---|---|
| Danh sách việc của người xem, chín nhóm | `server/src/worklist/mywork.ts` (`GROUP_META`, `viecCuaNguoi`) |
| Gộp việc theo lớp / tuần | `shared/domain/gopViec.ts` (`gopViecTheoLop`, `khoaGopCua`) |
| Dòng việc, nhóm việc, vạch hạn | `web/src/modules/congViec/DanhSachViec.tsx` · `web/src/modules/worklist/WorkList.tsx` · `shared/domain/congViec.ts` (`xepTheoEm`, `chiaVachHan`) |
| Panel làm tại chỗ theo loại việc | `web/src/modules/congViec/PanelViec.tsx` (`PanelViec`) · khuôn `web/src/ui/KhuonViec.tsx` · `web/src/modules/worklist/LamDongSoLieu.tsx` |
| Xác nhận PA cùng lúc | `web/src/modules/congViec/XacNhanPaLo.tsx` · `server/src/cases/sosAuto.ts` (`xacNhanPaNhieu`) |
| Lọc người phụ trách · xem việc người khác | `web/src/modules/congViec/ChonPhuTrach.tsx` · `server/src/worklist/xemViec.ts` |
| Chấm Speaking trong Công việc | `web/src/modules/congViec/PanelChamSpeaking.tsx` |
| Chỉ số, panel số liệu (số = số dòng) | `server/src/worklist/metrics.ts` (`rowsFor`) · `web/src/ui/{SoLieu,OSo}.tsx` · `shared/domain/metrics.ts` |
| Kết quả Test từng HV (nền chỉ số hiện trạng) | `server/src/worklist/danhGia.ts` |
| Dòng điểm HV trong panel (✓ / ✗ từng kỹ năng đúng lượt — PANEL-V10, N30) | `shared/domain/diemDong.ts` (`DiemHv`, `dauDiem`, `nhanDocDiem`) · `server/src/worklist/diemDong.ts` (`diemTuEval`, `diemTuMock`, `diemTuStanding`) · `MetricRow.diemHv` (`rowsFor`) |
| Tín hiệu từ dữ liệu (không phải task) | `server/src/worklist/signals.ts` (`signalsFor`) · `web/src/modules/worklist/SignalList.tsx` |
| Lọc Fast Track · Lớp thường cho mọi chỉ số | `shared/domain/tongQuan.ts` · `server/src/worklist/chuongTrinh.ts` · `web/src/modules/worklist/ChonChuongTrinh.tsx` · `web/src/ui/CongTacKhung.tsx` |
| Tổng quan QL (Lớp cần chú ý, Cần bạn quyết, Trễ chấm) | `server/src/worklist/tongQuanQl.ts` (`tongQuanQl`) · `bangChiNhanh.ts` |
| Bảng theo chi nhánh / theo lớp | `GET /tong-quan/chi-nhanh` → `server/src/worklist/bangChiNhanh.ts` |
| Ô điểm còn nợ (đi qua hàm của bảng chấm) | `server/src/worklist/scoreDebt.ts` → `scoreDebtCells` |
| Lịch sắp tới | `web/src/modules/worklist/Highlights.tsx` · `server/src/worklist/highlights.ts` |
| Admin: khối Mock Test | `web/src/modules/worklist/MockTestAdmin.tsx` · `server/src/worklist/tongQuanMt.ts` |
| TVV / CX: Học viên của tôi | `server/src/worklist/hvCuaToi.ts` (`chipHocVien`) |
| Thông báo tự động (đồng bộ khi mở chuông) | `server/src/platform/thongBaoTuDong.ts` (`dongBoThongBaoTuDong`; mốc 5 phút ở `users.chuong_dong_bo_luc` — migrate `server/src/migrate/prChuongNhe.ts`) |
| Vận hành: giao việc, việc con, Tạm ngưng | `web/src/modules/worklist/{MgmtTasksPage,ManagerTasks}.tsx` · `server/src/worklist/mgmttasks.ts` · `shared/domain/worklist.ts` |
| Báo cáo đơn vị | `web/src/modules/worklist/MeetingPage.tsx` · `server/src/worklist/meeting.ts` · `shared/domain/baoCaoDonVi.ts` |
| "Việc của tôi" khác "tôi sửa được" | `server/src/permissions.ts` (`mySkills`, `editableSkills`) |
| Hai phạm vi công việc, mặc định theo vai | `shared/domain/people.ts` (`WORK_SCOPES`) · `server/src/permissions.ts` (`defaultWorkScope`) |

### Chuyển lớp + Bàn giao

Mọi chuyển lớp thật chỉ đi qua `thiHanhLenhDenHan`; `applyTransition` / `transferStudent` là hàm nội bộ.

| Muốn sửa | Mở tệp |
|---|---|
| Luật thuần: tuần bắt đầu, hạn bàn giao, câu tóm tắt | `shared/domain/chuyenLop.ts` (`hanBanGiao`, `targetLenFt`) · đổi lớp / khoá `shared/domain/lenLop.ts` (`luatDoiLop`) |
| Ra / sửa / huỷ lệnh, thi hành, chuyển ngay | `server/src/classes/lenhChuyen.ts` (`raLenh`, `thiHanhLenhDenHan`, `thiHanhNgay`) · cron `server/src/ops/chotVangDinhKy.ts` |
| Chuyển lớp một em / nhiều em | `web/src/modules/students/ChuyenLopPanel.tsx` (`ChuyenLopNhieuEm`) · `server/src/classes/luatLoTrinh.ts` (`huongChuyenMotEm`, `apDungMotDong`) |
| Phần chung panel chuyển lớp (gửi theo lô) | `web/src/modules/classes/chuyenLopChung.tsx` (`guiTheoLo`) |
| Chuyển tiếp cả lớp lớp thường (Cuối khoá) | `web/src/modules/classes/CuoiKhoaLop.tsx` · `server/src/classes/transition.ts` |
| Lộ trình tiếp theo (nháp, Hướng) | `server/src/classes/loTrinhTiep.ts` (`luuNhap`, `xoaNhap`) |
| Việc QL "Chốt lộ trình · lớp" | `server/src/classes/lenhChuyen.ts` (`lopChoChotLoTrinh`) · `shared/domain/chuyenLop.ts` (`chuViecChotLoTrinh`) |
| Xét lại lộ trình (lô, Hoàn tác) | `web/src/modules/classes/PanelXetLai.tsx` · `server/src/normal/xetLai.ts` (`tapXetLai`) · `server/src/normal/cuoiKhoa.ts` (`emXetLaiLoTrinh`) |
| FT → lớp thường (MT0, Mock chưa điểm) | `server/src/fasttrack/mt0.ts` (`keHoachVeThuong`, `huyKhiVeThuong`) |
| Phiếu bàn giao · quyền chuyển lớp | `web/src/modules/classes/BanGiaoPanel.tsx` · `server/src/classes/banGiao.ts` (`suaBanGiao`) · `server/src/classes/quyenChuyenLop.ts` |
| PR-B: khung bàn giao chung · "Cùng GV · không cần bàn giao" · nháp nhận xét chung | `web/src/modules/classes/banGiaoChung.tsx` (`DsEmBanGiao`, `TuDienEm`, `OGopY`) · `server/src/classes/banGiao.ts` (`cungGvTuPhanCong`, `luuNhapNhanXet`) |
| PR-B: bàn giao khi đổi GV (việc, phiếu, dải GV cũ chỉ xem) | `server/src/classes/banGiaoGv.ts` (`dongBoViecBanGiao`, `phieuBanGiaoGv`, `viecBanGiaoGv`) · `web/src/modules/classes/BanGiaoGvPanel.tsx` · `daiChuyenLop.ts` (`daiBanGiaoGv`) · `DaiChuyenLop.tsx` (`DaiDoiGv`) · migrate `prBanGiaoGv.ts` |
| Các dải trạng thái ở hồ sơ lớp / HV | `web/src/modules/classes/DaiChuyenLop.tsx` · `server/src/classes/daiChuyenLop.ts` |
| Thẻ Chờ duyệt liên quan | `server/src/duyet/loaiYeuCau.ts` · `shared/domain/yeuCauDuyet.ts` |
| Bảng `lenh_chuyen_lop`, `ban_giao_mon` · demo | `server/src/schema.sql` · `server/src/seed/ctSeed.ts` |

### Chờ duyệt

| Muốn sửa | Mở tệp |
|---|---|
| Một bảng `yeu_cau_duyet` cho mọi loại thẻ (thêm loại = thêm MỘT phần tử) | `server/src/duyet/loaiYeuCau.ts` (`DINH_NGHIA_LOAI`) · `shared/domain/yeuCauDuyet.ts` (`LOAI_YEU_CAU`, `demHop`) |
| Lõi: tạo, duyệt, từ chối, trả lời, sửa / rút | `server/src/duyet/yeuCau.ts` (`taoYeuCau`, `duyetYeuCau`, `duyetNhieu`, `suaYeuCau`, `rutYeuCau`) |
| Thẻ Chờ duyệt: chip SOS, dòng điểm, Lịch sử · n (`GET /lich-su?loai=yeu-cau`) | `server/src/duyet/yeuCau.ts` (`ganBoiCanh`, `lichSuYeuCau`) |
| Đề xuất sửa thông tin HV | `server/src/duyet/deXuatSua.ts` · `web/src/modules/duyet/DeXuatSuaPanel.tsx` |

### Phân tích · giáo viên

| Muốn sửa | Mở tệp |
|---|---|
| Khung Phân tích, bộ chọn thời gian, phạm vi | `web/src/modules/phanTich/{PhanTichPage,BoChonThoiGian,dungChung}.tsx` · `shared/domain/{khoangThoiGian,phanTich}.ts` · `server/src/phanTich/phamVi.ts` |
| Báo cáo (in A4) | `web/src/modules/phanTich/BaoCao.tsx` · `server/src/phanTich/baoCao.ts` · `shared/domain/baoCaoPhanTich.ts` |
| Test + SOS, nhóm Xử lý Case | `web/src/modules/phanTich/TongHopTestSos.tsx` · `server/src/phanTich/tongHop.ts` · `server/src/cases/sosState.ts` (`xuLyCaseMany`) |
| Kết quả thi (Mock / thi thật), lớp lúc thi thật | `web/src/modules/phanTich/KetQuaThi.tsx` · `server/src/phanTich/{ketQuaThi,lopLucThi}.ts` · `shared/domain/ketQuaThi.ts` |
| Phân tích GV (không KPI, không xếp hạng) | `web/src/modules/phanTich/PhanTichGiaoVien.tsx` · `server/src/phanTich/giaoVien.ts` (`phanTichGiaoVien`, `tapChamDiem`; `napBai` cả chi nhánh đi từ `attempt_skills.branch_id` theo kỳ — cột giữ bằng trigger, migrate `server/src/migrate/prTlNapBai.ts`) · `shared/domain/phanTichGv.ts` |
| Hồ sơ GV, việc của GV, phạm vi xem | `server/src/giaoVien/{hoSo,phamVi}.ts` (`viecHoSoGv`, `phamViHoSoGv`) · `shared/domain/hoSoGiaoVien.ts` |
| Ý thức trong Phân tích | `web/src/modules/phanTich/YThucPhoiHop.tsx` · `server/src/phanTich/yThucPhanTich.ts` |
| Phân trang 10 / 20 / 50 | `web/src/ui/PhanTrang.tsx` (`usePhanTrang`) · `shared/domain/phanTrang.ts` |

### Nền tảng

| Muốn sửa | Mở tệp |
|---|---|
| Đăng nhập, đăng ký có chọn vai, duyệt tài khoản | `server/src/platform/accounts.ts` (`register`, `approve`) · `web/src/modules/platform/WelcomePage.tsx` |
| Phiên (cookie, hết hạn 30 ngày), góc nhìn | `server/src/auth.ts` (`apGocNhin`) · `web/src/lib/session.tsx` (`useSession`) |
| Tài khoản: lọc, nhóm, sửa thông tin, kỹ năng | `web/src/modules/platform/AccountsAdmin.tsx` · `shared/domain/taiKhoan.ts` (`locTaiKhoan`) · `accounts.ts` (`adminUpdateAccount`, `setUserSkills`) |
| Xoá tài khoản (cứng / mềm) | `server/src/platform/xoaTaiKhoan.ts` · `web/src/modules/platform/XoaTaiKhoanPanel.tsx` |
| Vai trò, quyền, nhóm quyền, cấp riêng | `shared/domain/{people,nhomQuyen}.ts` (`ROLES`, `PERMISSIONS`) · `web/src/modules/platform/CapQuyenRieng.tsx` · `accounts.ts` (`setUserPermissions`) |
| Bảng quyền theo vai | `server/src/platform/sysconfig.ts` (`setRolePermission`, `maTranQuyen`) · `web/src/modules/platform/AdminPage.tsx` |
| Ai được làm gì ở đâu | `server/src/permissions.ts` (`can`, `teacherAllows`, `scoreEditPath`, `editableSkills`) |
| Chương trình, lộ trình FT, chương trình mới | `server/src/platform/sysconfig.ts` (`saveProgramme`, `saveRoute`, `taoChuongTrinh`) · `web/src/modules/platform/CatalogAdmin.tsx` |
| Bảng quy đổi số câu → band | `server/src/platform/bangQuyDoi.ts` (`luuBangQuyDoi`) · `web/src/modules/platform/BangQuyDoiAdmin.tsx` |
| Quy ước tuần, mã tuần, hạn chấm, trễ nhập điểm | `server/src/platform/week.ts` (`mocTreNhapDiem`, `quaHanNhapDiem`) · `shared/domain/week.ts` (`hanKyGhiKetQua`) |
| Nhật ký thay đổi · Lịch sử thay đổi (một đường đọc) | `server/src/platform/audit.ts` · `shared/domain/nhatKy.ts` · `GET /lich-su` → `server/src/platform/lichSu.ts` |
| Thông báo | `server/src/platform/thongBao.ts` · `web/src/modules/platform/Header.tsx` |
| Tìm người | `server/src/platform/timNguoi.ts` |
| Tệp bằng chứng, nơi cất tệp | `server/src/platform/attachments.ts` · `server/src/platform/khoTep.ts` (`khoTepHienTai`) |
| Ngày demo, ngày nghiệp vụ | `server/src/demoConfig.ts` (`demoToday`, `nowNghiepVu`) · `web/src/ui/ngayNghiepVu.ts` (`useNgayNghiepVu`) |
| Khoá gửi mỗi lần mở form (idempotency) | `shared/domain/khoaGui.ts` · `server/src/db.ts` (`theoKhoaGui`) |
| Chữ tự do: một cửa kiểm | `server/src/util.ts` (`chuTuDo`) |
| Tiếng Anh: ngôn ngữ tài khoản | `web/src/ui/NutNgonNgu.tsx` · `web/src/lib/ngonNgu.ts` (`doiNgonNgu`) · `server/src/util.ts` (`loi`) · `server/src/app.ts` (`traLoiLoi`) |
| Dịch chữ GV nhập | `web/src/ui/ChuDich.tsx` · `shared/domain/doanNgonNgu.ts` (`canDich`) · `POST /dich` → `server/src/dich/dich.ts` |
| Hướng dẫn theo vai | `shared/huongDan/{kieu,gv,ql,qt,tvv,cx,admin,headTutor}.ts` |
| Danh mục route, bọc handler | `server/src/routes/index.ts` · `server/src/routes/helpers.ts` (`wrap`, `qInt`) |
| Điểm khởi động máy chủ | `server/src/index.ts` · `server/src/app.ts` |

### Tốc độ

| Muốn sửa | Mở tệp |
|---|---|
| Ngữ cảnh request: nhớ tra cứu lặp (chỉ GET), đếm câu SQL | `server/src/platform/nguCanhRequest.ts` (`chayTrongRequest`, `nho`, `nhoTheoId`) |
| Không sửa giá trị nhận từ hàm có `nho()` (copy trước) | đầu tệp `nguCanhRequest.ts`; `PISA_DONG_BANG_NHO=1` để lộ chỗ sửa nhầm |
| TL-NEN: mốc chung toàn hệ thống (bảng tham chiếu nhớ theo tiến trình, khoá phiên bản DB · quét đường đọc theo mốc 60 s / sau ghi / sang ngày) | `server/src/platform/mocHeThong.ts` (`nhoThamChieu`, `quetTheoMoc`, `COT_MOC` đọc kèm câu phiên `auth.ts`) · bảng `moc_he_thong` + trigger `tg_tc_*` — migrate `server/src/migrate/prTlNen.ts` · móc xoá mốc sau ghi `routes/index.ts` |
| Kết nối, đếm câu / dòng, nhớ câu lệnh (libsql rò bộ nhớ) | `server/src/db.ts` (`db`, `tx`, `demDong`) |
| Log `[cham]`, hạn 10 giây Netlify | `server/src/app.ts` (`demGio`) · `server/src/platform/hanGio.ts` |
| TL-VIEC: Công việc nạp chung một lần mỗi request (phân công `phanCongDangHoatDong`, Case mở `napCaseMo`, bảng lớp `lopDayDu`) · so bản chụp gốc | `server/src/permissions.ts` · `server/src/worklist/mywork.ts` · `server/src/tests/soGoc.ts` |
| Đường đo × vai, trần câu SQL / dòng | `server/src/tests/tocDoDuong.ts` (`DUONG_DO`, `TRAN`) · `server/src/tests/tocDo.run.ts` |
| Tải lại mảnh JS sau deploy | `web/src/lib/taiLaiManh.ts` (`lazyTai`) |
| Đo khung / bảng trên trang thật, miễn lỗi đã biết | `scripts/do-khung.mjs` · `scripts/do-bang.mjs` · `scripts/mien-do.json` |
| Cảnh báo esbuild, ảnh cặp mockup \| web, chụp API | `scripts/kiem-esbuild.mjs` · `scripts/anh-cap.mjs` · `scripts/chup-api.mjs` |

### Bản chính (Netlify + Turso)

Hướng dẫn cho chủ sản phẩm: `TRIEN_KHAI.md`. Lệnh `npm run …`: thư mục `server/src/ops/` (mục Module).

| Muốn sửa | Mở tệp |
|---|---|
| Biến môi trường, tên DB bản chính | `server/src/moiTruong.ts` |
| Chốt chặn xoá sạch DB ở Turso | `server/src/db.ts` (`tuChoiXoaSachNeuTuXa`) |
| Máy chủ trên Netlify, hàm định kỳ chốt "-" | `netlify/functions/api.ts` · `netlify/functions/chot-vang.ts` → `server/src/ops/chotVangDinhKy.ts` · `netlify.toml` |
| Tắt phần demo ở giao diện bản chính | `web/src/lib/banChinh.ts` |
| Khởi tạo, sao lưu, khôi phục | `server/src/ops/{initBanChinh,saoLuu,khoiPhuc}.ts` · bảng không chép dòng `BANG_KHONG_CHEP_DONG` |
| Migrate vào Turso | `server/src/migrate/run.ts` · `server/src/migrate.ts` (`migrateAccounts`) |
| Giới hạn thử đăng nhập · `/api/health` | `server/src/platform/gioiHanThu.ts` · `server/src/platform/suKhoe.ts` |
| Phép kiểm bản chính | `server/src/tests/banChinh.tests.ts` |

### Dùng chung (`web/src/ui/`, `web/src/lib/`)

| Muốn sửa | Mở tệp |
|---|---|
| Sáu họ nhãn, nút, thẻ, bảng; nút đang chọn, bộ lọc đoạn | `web/src/ui/ui.tsx` (`NutChon`, `BoLocDoan`, `NhanTrangThai`) · `shared/domain/trangThai.ts` |
| Nhãn, chip hạn, mọi hạn có loại | `web/src/ui/{Nhan,Han}.tsx` (`ChipHan`) · `shared/domain/display.ts` (`deadlineView`) |
| Chip SOS, dấu kết quả, màu kết quả Test | `web/src/ui/{ChipSos,BieuTuong,KetQuaDot}.tsx` · `shared/domain/chipSos.ts` |
| Panel trượt phải (một khung, một panel một lúc) | `web/src/ui/KhungPanel.tsx` (`KhungPanel`, `KhungTaiCho`) · `shared/domain/khoPanel.ts` |
| Hộp giữa màn, xác nhận | `web/src/ui/Drawer.tsx` (`Modal`, `ConfirmDialog`) |
| Menu, menu dòng ⋯, bấm ra ngoài | `web/src/ui/{Menu,MenuDong}.tsx` · `web/src/ui/useBamNgoai.ts` |
| Bảng chung, ô điểm, hàng nhóm, hàng tab | `web/src/ui/{Bang,ODiem,HangNhom,HangTab}.tsx` · `shared/domain/bang.ts` |
| Thẻ điện thoại thay bảng < 640 px | `web/src/ui/TheDong.tsx` (`TheDong`, `useDienThoai`) |
| Ô ngày (gõ + lịch), tuần, tháng | `web/src/ui/{ONgay,LichNho,ChonNgay}.tsx` · `shared/domain/{oNgay,chonNgay}.ts` |
| Ô "Khác" → Ghi rõ | `web/src/ui/OKhac.tsx` · `shared/domain/khac.ts` |
| Ô chọn người, chọn lớp | `web/src/ui/PeoplePicker.tsx` (`ChonNguoi`) · `web/src/ui/ChonLop.tsx` |
| Ô chọn tuần, bộ lọc chi nhánh, công tắc khung | `web/src/ui/{Filters,CongTacKhung}.tsx` (`WeekPicker`) |
| Giữ / trả focus, phím mũi tên | `web/src/ui/giuFocus.ts` · `shared/domain/banPhim.ts` |
| Toast + Hoàn tác 5 giây | `web/src/ui/Toast.tsx` · `shared/domain/hoanTac.ts` (`HOAN_TAC_MS`) |
| Báo lỗi form | `web/src/ui/loiForm.tsx` (`useLoiForm`) · `shared/domain/loiForm.ts` |
| Lưu chắc chắn, không mất chữ | `web/src/lib/luuChac.ts` · `web/src/lib/useApi.ts` · `web/src/lib/api.ts` |
| Ô số, ô chỉ số, % không đứng một mình | `web/src/ui/{OSo,SoLieu,TyLe}.tsx` |
| ⓘ luật, dòng thời gian, lịch sử thay đổi | `web/src/ui/{NutLuat,DongThoiGian,LichSuThayDoi}.tsx` |
| Chữ trình bày dùng chung | `web/src/ui/chu.ts` |
| Tên hiển thị mã máy, tên kỹ năng | `web/src/lib/format.ts` |
| Cuộn ổn định | `web/src/lib/cuonOnDinh.ts` (`cuonVeViTri`) |
| Token màu, sáng / tối, phông | `web/src/index.css` · `tailwind.config.js` · `web/src/ui/CongTacGiaoDien.tsx` · `shared/domain/mauNghia.ts` |

---

## Điểm kết nối cần biết

Sửa một chỗ dưới đây là ảnh hưởng nhiều màn. Đọc trước khi đụng.

- **`server/src/fasttrack/attempts.ts`** — lượt đánh giá của cả FT lẫn lớp thường (bảng `assessment_attempts`), rẽ nhánh theo chương trình. Dễ làm hỏng cả hai bên nhất. `Cell.required` cố ý độc lập với quyền người xem.
- **`server/src/permissions.ts`** — mọi câu "người này được làm việc kia không". Quyền = vai × chi nhánh của grant × phân công lớp / kỹ năng + quyền cấp riêng.
- **`server/src/platform/week.ts`** — tuần thứ Hai → Chủ nhật, thuộc tháng chứa thứ Năm, mã tuần luôn kèm năm. Lịch MT, hạn chấm đều đếm từ đây.
- **`server/src/fasttrack/skillSchedule.ts`** — mỗi kỹ năng trong một đợt có lịch, phạm vi, trạng thái, hạn RIÊNG (`attempt_skills`). `planned_period_id` = tuần kế hoạch hoàn tất, không phải tuần thi. Điểm vẫn thuộc một đợt.
- **`shared/domain/fasttrack.ts` → `pendingSkillsOf`** — "bài cần chấm" đếm ở đúng một chỗ. Màn mới cần số này thì gọi hàm, đừng viết phép đếm thứ hai.
- **`server/src/cases/signals.ts`** — điểm dưới kỳ vọng sinh TÍN HIỆU (không phải Case), hạn ba ngày từ `raised_on`; hạng mục đã có Case mở thì nối vào Case đó.
- **`shared/domain/cases.ts`** — từ vựng Case và hạn chu kỳ (`cycleDeadline`) ở đúng một chỗ.
- **`server/src/cases/cases.ts` → `listCases`** — lọc theo lớp em ĐANG học (`homeClassId`), cột hiển thị là lớp lúc đánh giá (`classId`). Đổi một bên phải đổi bên kia.

---

## Thêm một module mới thì làm gì

1. Tạo `server/src/<tên>/` và `web/src/modules/<tên>/`.
2. Có từ vựng riêng: thêm `shared/domain/<tên>.ts`, khai báo ở `shared/domain/index.ts`.
3. Thêm đường API ở `server/src/routes/index.ts`.
4. Thêm phép kiểm vào `server/src/tests/run.ts`.
5. Thêm một dòng vào bảng "Module" của tệp này.

## Nguyên tắc giữ ranh giới

- **Fast Track và lớp thường có form, kiểm dữ liệu và workflow RIÊNG.** Dùng chung thành phần cơ bản thì được; không tái dùng form nghiệp vụ bằng cách ẩn ô. FT có W1 / W2, chấm band; lớp thường một môn W, chấm điểm / tổng. Mọi đường tới điểm đi qua `attemptHref`.
- **Case học thuật và Ý thức là hai vòng đời.** Đừng đưa vi phạm vào `sos_cases`, đừng đưa hạn vào vi phạm.
- **Hành trình học viên** tổng hợp từ dữ liệu nguồn, không giữ bộ điểm hay trạng thái riêng.
- **Cùng một số liệu ở nhiều nơi = cùng một hàm.** Thêm màn thì gọi hàm sẵn có, không đếm lại.
