# Rà PR #149 PR-UXF-a (số liệu khớp + sót lớp thường) — mức ĐẦY ĐỦ

Người rà: Opus 5.5 · bản `main` @ `f814ba26` (worktree `ra6`) · chỉ đọc, không chạy `npm run check`.
Diff PR: `435da4d0..569515bf`. Hai cổng gộp `eed129ba`, `7639d992` đã soi bằng `git show --remerge-diff`. Cổng gộp của Pb2-b `94e45e8e` (gộp UXF-a vào Pb2-b) cũng đã soi.

Tổng: **P0: 0 · P1: 4 · P2: 7**

---

### [P1] Một luật quá hạn (Q10): cột "Việc tiếp theo", chip Quá hạn và badge "n HV quá hạn việc" vẫn tính quá hạn theo hạn trơn
- Chỗ: `shared/domain/hocVienLop.ts:358-361` (`viecTiepCuaEm`, nhánh nhập điểm), nhận dữ liệu từ `server/src/classes/dongHocVien.ts:65-84` (`nhapDiemTheoEm`, hàm UXF-a mới thêm)
- Lỗi: `tre = n.quaHan || v.tone === 'overdue'`. `v` là `deadlineView({ due: n.han })`, và `deadlineView` coi là quá hạn ngay khi `today > han`. Luật này không xét tuần thi đã hết hay chưa. `n.han` lại là hạn sớm nhất của mọi ô còn nợ, kể cả ô chưa quá hạn.
- Tình huống: ngày 14/09 (Thứ Hai, tuần W3 SEP đang chạy). Ô L của em ở tuần W3 SEP có hạn đặt đè 13/09.
  - Cờ ô `overdue = false`, đúng Q10.
  - Nhưng `viecTiepCuaEm` trả `tone: 'danger'` và chữ "quá hạn 1 ngày".
  - Em đó vào chip **Quá hạn** ở Học viên & Lớp, vào badge "n HV quá hạn việc" ở hồ sơ lớp (`dongHocVien.ts:151`), và vào cột Việc tiếp theo của bảng lớp.
  - Trong khi đó ô `bai-qua-han-nhap-diem`, Lịch Test và bảng GV đều nói **không** quá hạn.
- Sửa:
  - `NhapDiemViec` chỉ lấy `han` của ô `overdue` (nếu có);
  - `viecTiepCuaEm` dùng `tre = n.quaHan`, không OR với `v.tone`;
  - hoặc chỉ dùng `deadlineView` để in chữ hạn, không để quyết tone.
  - Thêm phép kiểm cho em W (hạn đè sớm, tuần đang chạy): `dem['qua-han']` không có em W. Hiện phép kiểm `UXF-a (6)` không phủ đường này.
- Nguồn luật: Q10, Task 6 ("mọi bản sao … đọc `view.overdue`, không tự tính lại"); Task 3 (b) VN29.

### [P1] Một luật quá hạn (Q10): Việc / Công việc (nhóm nhập điểm) còn so hạn trơn, và việc này hiện không PR nào nhận
- Chỗ: `server/src/worklist/mywork.ts:240-245` (`urgencyOf`), dùng ở `mywork.ts:366` (`urgencyOf(first.due, today)`, `first.due` = hạn sớm nhất của bucket)
- Lỗi: việc nhập điểm có `urgency = 'overdue'` khi `due < today`, không đọc `myPendingDetail[].overdue`. Dữ liệu cờ ô đã có từ Task 5/6 nhưng không ai dùng.
- Tình huống: cùng em W như trên. Trang Công việc và Tổng quan GV đếm việc nhập điểm L vào "Quá hạn" và khối "Việc của tôi · hôm nay". Ô Tổng quan và Lịch Test thì nói chưa quá hạn.
  - Kế hoạch Task 6 liệt kê "Việc (`urgency`)" trong năm đường phải khớp.
  - Phép kiểm `UXF-a (6)` không kiểm đường này.
- Hiện trạng giao việc:
  - Kế hoạch VAI-a Task 11 ghi "`urgencyOf` theo cờ ô: **chưa làm** — UXF-a chưa merge; làm ở cổng gộp" (`plans/2026-10-01-pr-vai-a-…md:519`).
  - Thân PR UXF-a lại chuyển ngược cho "PR-VAI-a (sau merge) / PR-UXF-b".
  - VAI-a đã merge trước UXF-a, nên thực tế **không ai làm**, và chưa có kế hoạch UXF-b.
- Sửa: bucket mang thêm `quaHan = some(d.overdue)`. `urgency` = `'overdue'` khi `quaHan`, ngược lại theo `today`/`normal`. Đây là vài dòng ở `gomBaiChuaCham`.
- Nguồn luật: Q10, Task 6, bảng "Chuyển cho PR khác" dòng 3.

### [P1] T65 (Q9) làm chưa đủ: badge "n bài chờ chấm" và Lịch Test tuần đang xem vẫn đếm em Tạm dừng
- Chỗ:
  - `server/src/classes/classes.ts:162-237` (`listClassSummaries.needScores`). Câu SQL lượt không JOIN `students`, không lọc `s.status`.
  - `server/src/cham/canCham.ts:445-455` (`lichTest`, câu lượt của tuần đang xem). Cũng không lọc `students.status`.
- Lỗi: Q9 ghi rõ "Em Tạm dừng không sinh nợ điểm ở: `scoreDebtCells`, Việc, dòng Nợ Lịch Test, **badge**". UXF-a chỉ bật `chiDangHoc` ở `listAttempts` (Nợ, Việc, dashboard) và lọc ở `scoreDebtCells`, nên:
  - badge "n bài chờ chấm" ở danh sách lớp vẫn đếm ô của em Tạm dừng. Chú thích `canCham.ts:212` hứa badge và khối Nợ là "cùng một tập bài", nay hai bên lệch;
  - Lịch Test tuần đang xem (`lop.conBai`, `quaHanTuan`) vẫn đếm em Tạm dừng. `tongQuan.quaHan = quaHanTuan + no.quaHanBai` (`canCham.ts:592`) cộng hai số theo **hai luật khác nhau**: một vế có em Tạm dừng, một vế không.
- Tình huống: xem Lịch Test ở một tuần đã qua (`periodId` cũ), lớp có em Tạm dừng còn ô quá hạn.
  - Hàng lớp ghi "quá hạn" và dải số "Quá hạn n" có em đó.
  - Khối Nợ và ô Tổng quan thì không.
  - Badge danh sách lớp > tổng (hàng lớp + Nợ).
- Sửa: thêm `JOIN students s … AND s.status = 'active' AND s.archived_at IS NULL` vào hai câu trên (giống `scoreDebt.ts:32`). Phép kiểm T65 thêm hai vế: badge `needScores` và `lichTest(...).lop[].conBai` / `tongQuan.quaHan` giảm đúng 1.
- Nguồn luật: Q9; Task 5 ("T65 … dòng Nợ Lịch Test **đều** giảm"); CHUNG §3 (số khớp).

### [P1] Tín hiệu Báo cáo đơn vị: N+1 theo chi nhánh, đường `/signals` không có trần tốc độ
- Chỗ: `server/src/worklist/signals.ts:76-81` (`tuSo`), dòng 104, 107, 108
- Lỗi:
  - Mỗi tín hiệu gọi `metricSet(p, id, { branchId })` **một lần cho mỗi chi nhánh**. Có 3 chỉ số, nên tổng là 3 × số chi nhánh lần gọi.
  - Mỗi lần `bai-qua-han-nhap-diem` chạy lại `scoreDebtCells` (gồm `settleNoShows` và nạp lô điểm). Mỗi lần `case-xac-dinh-…` và `pa-can-cap-nhat` quét lại `listCases`.
  - Trước PR, ba câu SQL `GROUP BY c.branch_id` cho mọi chi nhánh.
  - `/signals` không có trong `tests/tocDoDuong.ts`. Trang Báo cáo đơn vị gọi `/signals` **hai lần**: `useSignalCount` và `SignalList`, vì `<details>` đóng vẫn mount con.
- Tình huống: QT xem trang (không lọc chi nhánh), 4 chi nhánh → 12 lần `metricSet` × 2 lần tải. Mỗi lần hàng chục câu, nên tổng hàng trăm câu Turso cho một trang.
- Sửa:
  - Gọi `metricSet` **một lần** không lọc chi nhánh, rồi chia `ids` theo chi nhánh bằng `lopCuaTap(unit, ids)`. Hàm này đã trả `branchId`/`classId`, là cùng hàm bộ lọc khung dùng.
  - Thêm `QL /signals`, `QT /signals` vào `DUONG_DO` + `TRAN`.
- Nguồn luật: CHUNG §5 (không N+1; route phải có trần); Global Constraints "không N+1".

---

### [P2] Bảng Theo giáo viên: chi nhánh chưa có hàng GV nào thì hàng "Chưa phân công" bị giấu
- Chỗ: `web/src/modules/giaoVien/BangGiaoVienChiNhanh.tsx:29`
- Lỗi: `if (!data.hang.length) return <Empty …/>` chạy trước khi vẽ `data.chuaPhanCong`.
- Tình huống: chi nhánh hay khung (ví dụ khung FT mới mở) chưa phân công GV nào, nhưng có bài quá hạn. Ô Tổng quan ghi n bài, bảng ghi "Chưa có giáo viên nào…", Σ = 0 ≠ n.
- Sửa: chỉ hiện Empty khi `!hang.length && !chuaPhanCong`.
- Nguồn luật: Q8 ("Σ hàng = ô").

### [P2] FT "tuần học thứ n" của em đang Tạm dừng: hai màn ra hai kết quả
- Chỗ:
  - `server/src/classes/luatLoTrinh.ts:359-364` (`xemChuyenLop`) → `tuanHocFt(…, mondayOf(homNay), …)` = `null`, nên không hiện tuần.
  - `server/src/students/profile.ts:478` (VAI-b) tính tới tuần trước ngày dừng, nên hiện "tuần học thứ 14 · đang dừng".
- Lỗi: cùng một em, panel Chuyển lớp (dòng "Đang học …") không có tuần, còn đầu hồ sơ HV có "tuần học thứ 14 · đang dừng". Hai đường gọi cùng `tuanHocFt` nhưng truyền mốc khác nhau.
- Sửa: tách một hàm server dùng chung (mốc = tuần trước ngày dừng nếu đang dừng), hoặc ghi rõ ở Nhật ký rằng panel cố ý không hiện.
- Nguồn luật: Q6 (Q31-11); CHUNG §3 (một hàm một số).

### [P2] Đường "giữa khoá" không tính `khac_goi_y`: cột lưu sai cho em lớp thường đã hết khoá
- Chỗ:
  - `server/src/routes/index.ts:1852-1858` (`/students/:id/transfer` luôn `boiCanh: 'giua-khoa'`);
  - `server/src/classes/lenhChuyen.ts:101` (`ck` chỉ tính khi `cuoi-khoa`).
- Lỗi: em lớp thường đã hết khoá, Web gợi ý "Học lại". QL dùng panel một em chọn lớp FT, nên hướng là `fast_track` ở bối cảnh `giua-khoa`. Lệnh ghi `khac_goi_y = 0`.
  - Không lách được lý do: route luôn bắt lý do.
  - Nhưng cờ lưu sai, và lý do có thể chỉ là lý do chọn nhanh mặc định.
- Tương tự `apDungDeXuatChuyenLop` (`lenhChuyen.ts:565`): lý do lấy `yc.ly_do` (lý do của GVCN) làm lý do "khác gợi ý" của QL.
- Sửa: tính `ck` khi lớp nguồn là lớp thường và `mocKetKhoa(...).tuCuoiKhoa`, không chỉ khi `boiCanh === 'cuoi-khoa'`.
- Nguồn luật: Q1/Q2, §3.1f "chọn khác gợi ý phải ghi lý do ngắn".

### [P2] `raLenh` đưa danh sách em từ thân yêu cầu vào `IN (…)` không chia lô
- Chỗ: `server/src/classes/lenhChuyen.ts:101` → `normal/cuoiKhoa.ts:116-118` (`loc` ghép `?` cho mọi `sids`, không `theoLo`)
- Lỗi: `dongs` là thân API, chưa lọc qua `hopLe` trước khi gọi.
- Tình huống: gửi hơn 900 `dongs`. Trên Turso câu vượt trần tham số thì lỗi 500, thay vì báo "Học viên không thuộc lớp này".
- Sửa: truyền `dongs.filter(d => hopLe.has(d.studentId))`, hoặc bỏ `sids` (một lớp < 900 em) rồi lọc bằng JS.
- Nguồn luật: CHUNG §5 (≤ 900 tham số).

### [P2] Ghi bù đúng ngày Thứ Hai: tiêu đề "ghi bù N tuần" nhưng chỉ N−1 trễ, tuần cuối không tính "đúng"
- Chỗ: `server/src/worklist/metrics.ts:300-302` (`tuanTre`), `:318`
- Lỗi: với dòng trễ chỉ giữ tuần k có `due + 7k < ghi`. Khi ghi đúng Thứ Hai (hạn của tuần cuối), tuần cuối bị bỏ khỏi cả tử lẫn mẫu, không phải "1 đúng".
  - `nhanTuanGhiKetQua('2026-08-24','2026-09-07')` = "ghi bù 3 tuần", trong khi `tuanTre` = 2.
  - Kế hoạch Q13 nói "N trễ = N của tiêu đề".
  - Nhật ký Task 8 có ghi phần chặn thêm, nhưng không nói tuần cuối rơi khỏi mẫu số.
- Sửa: dòng trễ sinh N nghĩa vụ. Tuần k có `due + 7k >= ghi` tính là đúng hạn (`true`), không bỏ.
- Nguồn luật: Q13, Task 8.

### [P2] Kế hoạch Task 3 đo lại roster lớp thường và roster lớp FT: chỉ có trần cho `/classes/3/roster`
- Chỗ: `server/src/tests/tocDoDuong.ts:391-394`
- Lỗi: kế hoạch ghi đo `/classes/{lopThuong}/roster` và `/classes/{lopFT}/roster`.
  - Nhật ký Task 2 ghi `/classes/6/roster` (lớp thường) đo 52 câu, "không có trần riêng".
  - Roster lớp thường nay thêm `cuoiKhoaTheoHocVien` + `listCases` + `listAttempts` mà không có trần, nên lần sau tăng sẽ không ai thấy.
- Sửa: thêm `GVCN_THUONG /classes/6/roster` (và QL) vào `DUONG_DO` / `TRAN`.
- Nguồn luật: Task 2, Task 3 bullet `tocDoDuong`; CHUNG §5.

### [P2] U1 còn sót: "Lớp đang dạy" ở hồ sơ GV sắp theo chữ
- Chỗ: `server/src/giaoVien/hoSo.ts:91` (`a.ma.localeCompare(b.ma, 'vi')`)
- Lỗi: "MB FT 10" đứng trước "MB FT 9". Không thuộc 6 file kiểm kê, nhưng cùng luật U1, và hồ sơ GV là màn UXF-a có chạm (Task 5).
- Sửa: `soSanhLop({ code: a.ma }, { code: b.ma })` trong cùng khung.
- Nguồn luật: Q20 / U1.

---

## Đã kiểm, không có lỗi

- **P0 K2-25:**
  - `raLenh` tự tính `khacGoiY` từ `cuoiKhoaTheoHocVien` một lần/lô. Đã bỏ `khacGoiY` khỏi `DongLenhVao` / `dongTuBody` / `suaTuBody` / `suaLenh`, nên thân API gửi `khacGoiY:false` vô hiệu.
  - `suaLenh` đi qua `raLenh`, nên đổi hướng sang lệch gợi ý mà không có lý do → 400.
  - Gợi ý null / 50–59 % → không đòi lý do.
  - Hướng ↔ lớp đích bị `kiemDongChuyenTiep` khoá, nên không khai `len_lop` với lớp cùng bậc để né được.
  - `/students/:id/transfer` và duyệt đề xuất luôn có lý do.
  - Web dùng cùng hàm `khacGoiY` + ô "Lý do * · khác Web gợi ý" 12 px.
- **Task 2:**
  - Hậu tố hướng ở `dong1` (không dính số %), cùng `goiYCuoiKhoa`.
  - Cột "% tổng" + "Hướng gợi ý" đọc `roster[].cuoiKhoa`, cùng hàm với panel. Chip dùng `Nhan tone=soon`. Thẻ điện thoại có dòng Hướng gợi ý. Số 12 px `tabular-nums`.
- **Task 3:**
  - `coMocTiepTheoThuong` có ở hai nơi, cột con `co_cuoi_khoa` không thêm câu.
  - Cột Case = `listCases` theo quyền, khớp `soCaseMo`.
  - FT `overdueSkills` chỉ đếm ô `x.viec`; `myPending` gồm `sat`.
- **Bài = một ô:**
  - `baiId` / `tachBaiId`.
  - `rowsFor('bai')` dùng chung cho ô Tổng quan, hồ sơ GV (`oHoSoGv`) và bảng GV (`noDiemCuaGv` cùng `scoreDebtCells`), có hàng `chuaPhanCong`.
  - `chiTiet` khoá theo `baiId`, ô chưa phân công không có người.
  - `lopCuaTap('bai')` lọc khung.
  - Dòng Nợ `conBai` đếm ô (W1/W2 tách).
  - `teacherOf` lọc `effective_from/to`.
- **Một luật quá hạn ở máy chủ:**
  - `quaHanNhapDiem` dùng cho `viewSkill`, `skillCells`, Lịch Test, khối Nợ (đọc cờ ô).
  - `regular.ts:1001,1014`, `attempts.ts:697-701,785` đọc `v.overdue`. Không còn `isOverdue` trực tiếp cho nhập điểm.
  - Hai chỗ còn lệch nằm ở hai P1 phía trên.
- **T65 ở `scoreDebtCells`, `listAttempts(chiDangHoc)`:** đã bật ở Việc (cả "Tất cả trong phạm vi"), Nợ, dashboard, `nhapDiemTheoEm`. Quay lại học thì nợ hiện lại, vì lọc theo `status` lúc đọc, không ghi gì.
- **FT tuần học thứ n:**
  - `xemChuyenLop`: một câu + `khoangTamDung([sid])`.
  - `transitionPlan`: `khoangTamDung(sids)` **một lần** cho cả lớp, JOIN `report_periods` sẵn.
  - Web dùng `chuTuanHoc`; FT `tong: null`.
  - Lớp đích FT `tuan: null` (`luatLoTrinh.ts:80`).
  - Grep không còn `/16` hay `tuần học {n}/{tổng}` cho FT.
  - Chỉ còn **một** bản `chuTuanHoc` / `tuanHocFt` / `khoangTamDung`.
- **Báo cáo đơn vị:**
  - `daNop/nhap/chua` đếm đơn vị theo `u.trangThai.ma`, cùng tập chip lọc.
  - `weeksReported` = tuần đã nộp / tuần đã bắt đầu; `worstStatus` bỏ nháp.
  - Sửa kèm `cell.trangThai` (chuỗi) đúng.
  - Tín hiệu (b), (c) đọc sổ chỉ số, mở bằng `SoLieuO` (số = số dòng).
- **Ghi bù N tuần:**
  - id `PA×1e6 + đợt×1e3 + k`.
  - `parseObligation` dùng chung cho drill, `chuongTrinh.ts`, `sosV3`.
  - Bỏ quên nhiều tuần = nhiều lần trễ.
- **Bảng chi nhánh:**
  - Case gán theo `lopCuaTap('case')`, cùng hàm bộ lọc khung.
  - U1 `soSanhLop` ở planning, canCham (3 chỗ), bangChiNhanh, branchpulse, summary, xoaTaiKhoan, xuatMt.
- **F5:** `demNhomChip` cho "Tất cả" = Σ nhóm.
- **Task 10:**
  - "Chưa phân loại" bắt mọi Case không vào hàng (theo `caseCoDong`).
  - `hanGocCua` dùng chung cho danh sách + chi tiết; "Đặt hạn" / "Dời hạn".
  - Tooltip có "Tạm thời".
- **Cổng gộp 1 (`eed129ba`, 8 file xung đột):**
  - Giữ đủ của VAI-a: `chiTiet`/`han` (Q24), `duongCase`, `case 'lop'`, đơn vị `lop`/`viec-van-hanh`, `trongKhoiHomNay`/`baViecDau`, K5-10 bỏ nhắc mềm, `ctTuyChon`.
  - Giữ đủ của Pb2-a (bỏ "Cả hai").
  - Import `boQuen` bỏ đúng (VAI-a đã xoá file).
- **Cổng gộp 2 (`7639d992`):** lấy nguyên bản VAI-b cho `tamDung.ts` / `hienThiNgay.ts`; phép kiểm UXF-a (4) sửa theo luật chung. Không mất phần nào.
- **Cổng gộp Pb2-b (`94e45e8e`):** giữ `baiId` bản UXF-a, `chuaPhanCong`, import `baiId` ở `hoSo.ts`.
- **Không còn chữ cấm** trong diff UXF-a: không `CHUONG_TRINH`, `'ca-hai'`, "ca tối", "đổi ca".

## Chuyển cho PR khác

- **`mywork.ts urgencyOf` đọc cờ ô quá hạn**:
  - VAI-a và UXF-a đẩy cho nhau, nên hiện không ai nhận;
  - nếu không sửa ngay thì giao cho **PR-UXF-b** hoặc PR-Dọn (xem P1 thứ hai).
- **`mywork.ts:927` sắp lớp `soSanhLop`**: chuyển **PR-UXF-b**, vì VAI-a đã merge mà chưa làm.
- **Luật "chặn ngày ghi" K3-17**: planning (Nhật ký Task 8, nguồn chỉ có một câu).
- **`listCases` COALESCE lệch quyền** (`cases.ts:1781` và `:1795`): chuyển **PR-Dọn**. Nó cũng ảnh hưởng cột Case roster của lớp đã kết thúc.
- **PR-Pb2-b (người rà Pb2-b soi):**
  - `phanTich/giaoVien.ts:96-145` (`napBai`) dựng tập ô điểm **riêng**, không qua `scoreDebtCells`;
  - cần đối chiếu luật Tạm dừng (Q9) và quá hạn (Q10, `quaHanNhapDiem`) với ô Tổng quan / bảng GV.
- **Thẻ Lịch thi bỏ năm** (`loaiYeuCau.ts`): chuyển PR-UXF-b (U5), như thân PR ghi.
