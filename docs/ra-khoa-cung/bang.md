# RA-KHOA-CUNG — bảng rà mọi chỗ chặn cứng (07/11)

Chủ SP 07/11: "KHÔNG BAO GIỜ ĐƯỢC CHẶN CỨNG Ở BẤT KÌ CHỖ NÀO… RÀ SOÁT LẠI HẾT TẤT CẢ MỌI THỨ CHỖ NÀO CHẶN CỨNG MỞ RA NGAY" (plan.md mục 4).
Phạm vi: `server/src` (trừ ops / migrate / seed / tests) + `web/src` (trừ dev, huongDan) + hàm chặn `shared/domain` được gọi. Bỏ qua: chặn quyền (vai),
kiểm định dạng / ô bắt buộc, 404, lỗi nội bộ. Chỉ đọc mã `main` 7f2d9b735.

Loại: **A** chặn vô lý → MỞ (cho làm + lịch sử + Hoàn tác / đi thẳng) · **B** hậu quả lớn → XÁC NHẬN nêu ảnh hưởng · **C** luật đã chốt plan.md 1.6 → GIỮ ·
**C? Q-B1** ba khoá "vì đóng hồ sơ" N3 / Q-B1 ① (21/10) — lời 07/11 mới hơn nhiều khả năng đã thay · **D** chống mất / hỏng dữ liệu → GIỮ · **?** chưa chắc.
HOTFIX = tệp session HOTFIX-MO-KHOA đang sửa (buocTiep.ts, students.ts hoàn tác / hocLai, trangThaiHv.ts, thiThat.ts, PanelBuocTiep.tsx) — chỉ ghi.

## Đếm

| Khu | Dòng | A | A? | B (+B?) | C | C? Q-B1 | D (+D?) | ? |
|---|---|---|---|---|---|---|---|---|
| Máy chủ học viên & lộ trình | 55 | 6 | 2 | 2 | 2 | 7 | 26 (+3) | 6 |
| Máy chủ lớp | 57 | 7 | 12 | 1 | 8 | 2 | 18 (+7) | 2 |
| Máy chủ Test & điểm | 88 | 25 | 20 | 7 (+5) | 4 (+2 tham chiếu) | 6 | 13 | 6 |
| Máy chủ Case & PA & Tutor | 84 | 6 | 11 | 14 | 5 | 8 | 24 (+7) | 9 |
| Máy chủ Ý thức, duyệt, việc | 75 | 8 | 5 | 3 | 2 | 3 | 41 (+2) | 11 |
| Máy chủ quản trị & khác | 44 | 0 | 8 | 2 | 2 | 9 | 19 | 4 |
| Web HV, lớp, Test | 44 | 6 | 8 | 3 (+1) | 6 | 9 | 7 (+1) | 3 |
| Web Case, Ý thức, quản trị, việc | 47 | 13 | 5 | 6 (+1) | 2 | 3 | 10 (+2) | 5 |
| **Tổng** | **494** | **71** | **71** | **38 (+7)** | **31** | **47** | **158 (+22)** | **46** |

Web phần lớn trùng chỗ chặn máy chủ (ghi "MC"); dòng "chỉ web" = máy chủ đã cho, chỉ cần mở nút.

## Mười nhóm giải pháp chung (một sửa gỡ nhiều chỗ)

| # | Nhóm | Chỗ chính | Cách mở |
|---|---|---|---|
| G1 | **Hồ sơ Lưu trữ** `CAU_LUU_TRU` "Quay lại học trước rồi sửa" (~25 chỗ: lộ trình, môn, đầu vào, Target, dự kiến thi, Case, Nhập bù, điểm, nhận xét, Chuyển lớp, đề xuất sửa, vi phạm) | `students.ts:192,265,831,837,853` (HOTFIX) · `cases.ts:551,1925` · `attempts.ts:1456,2152,2204,1843` · `deXuatSua.ts:49` · `violations.ts:76-79` · web `quanLyHocVien.ts:72-86`, `StudentDetailPage`, `StudentManagePanel:272`, `ScoreEntry:23`, `LuoiFT:464`, `MotKyNang:245` | C? Q-B1 → đề xuất MỞ: người có quyền sửa thẳng, có lịch sử; việc cần em đang học (Chuyển lớp, lộ trình mới) = tự Quay lại học trong cùng giao dịch, hỏi xác nhận một câu |
| G2 | **Lớp đã kết thúc** — cờ thao tác tắt cả QL / QT; GV đúng môn không sửa điểm; không ghi "-"; lịch lớp chỉ QL | `classes.ts:895` (A) · `hoanTat.ts:130` (C? Q-B1), `:146` (A) · `schedule.ts:705` · `attempts.ts:1840,2221` · `regular.ts:667,733` · web `DauTrangLop:208`, `ScoreEntry:126`, `LuoiThuong:50` | Cờ theo quyền như lớp đang chạy; GV đúng môn sửa điểm có lịch sử; "-" ở lớp đã kết thúc = Không dự thi |
| G3 | **Lượt / kỹ năng đã huỷ → "Mở lại / Khôi phục trước"** (~12 chỗ) | `attempts.ts:1481,1616,1635,2200,2264` · `regular.ts:648,807` · `skillSchedule.ts:814,942` · `ketQuaHuy.ts:113` · `absence.ts:739` · web `MockDetailPage:753`, `thaoTacMt.ts:87` | Thao tác trên lượt huỷ = tự Khôi phục lượt rồi làm, một giao dịch, hỏi xác nhận nêu tên lượt |
| G4 | **"Đã có điểm"** — Xoá MT, ghi vắng "-", khôi phục điểm cũ đè điểm mới | `attempts.ts:1619,2319` · `regular.ts:846` · `absence.ts:756` · `ketQuaHuy.ts:71,117` · web `HopNhapDiem:338`, `HopKyNang:351/357`, `MockDetailPage:256` | B: hỏi "Xoá n ô điểm và …?", điểm cất (Thùng rác / ghi đảo), Khôi phục được. Ô đã ghi vắng: nhập điểm thẳng (`attempts.ts:2267`, A) |
| G5 | **Case xong → "Mở lại trước"** (sửa Case, kết quả PA, Xem lại, huỷ quyết định, + Thêm PA) | `cases.ts:1254,1362,1723,1806,4323,4615` · web `CasePanel:193,291,343,847`, `NganCase:95` | C? Q-B1 → đề xuất: sửa chữ không cần Mở lại; đổi lựa chọn / thêm PA = tự Mở lại Case (hỏi xác nhận) |
| G6 | **"Làm X trước rồi mới Y"** — Hoàn thành Case khi PA chưa khép · khép việc cha còn việc con · Kết thúc lớp còn quyết định chuyển đến · xoá tài khoản là GVCN · Tạm dừng khi có lệnh chuyển chờ · thu hồi lần xử lý cũ khi có lần sau · thẻ "Không cần theo dõi" chờ duyệt chặn + PA | `sosV4.ts:184-188` · `mgmttasks.ts:559` · `xoaKetThucLop.ts:130-132` · `xoaTaiKhoan.ts:153` · `trangThaiHv.ts:91` (HOTFIX) · `xuLy.ts:701` · `cases.ts:956`, `sosAuto.ts:239,486` | B: một hộp xác nhận nêu đúng đối tượng ("khép 2 PA", "huỷ quyết định chuyển lớp của X") rồi làm cả hai trong một giao dịch |
| G7 | **Cửa sổ thời gian** — huỷ quyết định chỉ trong ngày · khôi phục quyết định chuyển lớp quá giờ / tuần đã tới · tutor xoá nhận xét > 24 giờ · nộp báo cáo tuần chỉ 2 ngày cuối · ngày bắt đầu PA lùi ≤ 7 ngày | `yeuCau.ts:712` · `lenhChuyen.ts:485,486` · `tutors/trang.ts:330` · `week.ts:241`/`meeting.ts:296` · `sosAuto.ts:541` | A: bỏ cửa sổ, giữ lịch sử; quyết định đã thi hành thì đi thẳng (G9) |
| G8 | **Chỉ sửa được bản gần nhất / bản chưa khép** — kết quả PA, Xem lại, PA đã kết thúc, ngày bắt đầu PA có kết quả, lần xử lý đã thu hồi | `cases.ts:4296,4309,4617,4686,4718,4740` · `xuLy.ts:618,792` · web `CasePanel` (`chanPaChuaChay`) | A: sửa chữ / ngày mọi bản có lịch sử; đổi quyết định bản cũ → B xác nhận nêu bản sau bị ảnh hưởng |
| G9 | **Hoàn tác ghi đảo 409 "đã đổi sau"** (`ghiDao.ts:103-120`) | nơi gọi: `cases.ts:1726`, `phanCongGv.ts:474`, `yeuCau.ts:776`, `baoPhTvv.ts:266`, `phoiHop.ts:639`, `buocTiep.ts:273` (HOTFIX) | D giữ cơ chế (không đảo nửa chừng); mỗi nơi gọi phải có đường ĐI THẲNG tới trạng thái mới — rà từng nơi, chỗ thiếu là A |
| G10 | **Trần / giới hạn trái luật** — trần MT8 (N14 "không giới hạn số MT") | `shared/domain/lichMt.ts:87`, `keHoachTest.ts:255`, `keHoach/keHoachTest.ts:1206` | A: bỏ trần |

**Chỉ web chặn (máy chủ đã cho) — mở nhanh nhất:** `congViec/PanelSauThi.tsx:180` ẩn "Sửa điểm" thi thật khi đã chọn Bước tiếp (đúng lỗi chủ SP báo; sát HOTFIX thi thật) ·
`cases/CasePanel.tsx:291` ẩn "+ Thêm PA" khi Case xong · `tutor/PanelTutor.tsx:159` ẩn Sửa nhận xét sau 24 giờ · `classes/thaoTacDongHocVien.tsx:73` + `shared/domain/hocVienLop.ts:443` ⋯ dòng HV rỗng khi em không đang học ·
`ScoreEntry:121` `lockedByNoShow` · Chốt ngày thi lưu xong khoá ô.

## Dòng C — giữ (luật đã chốt)
N15 khoá đổi lịch MT T6–CN (`lichMt.ts:124`, `skillSchedule.ts:50`, web `ngayNghiepVu.ts:32`, `HopThaoTacMt:102`, `HopKyNang:197`, `HopSEx:35`) · N23 tuần đã qua với người không phải QL (`HopThaoTacMt:108`, `lichMt.ts:103`) ·
N9 MT0 trước MT1, số MT liền mạch (`mt0.ts:47`, `lichMt.ts:90`) · N13 môn không học (`attempts.ts:2256`) · N38 ② MT cũ chỉ nhập bù (`thaoTacMt.ts:116`) ·
N3 giữ bước duyệt: "Đã thực hiện" sau QL duyệt (`xuLy.ts:285`), PA chờ duyệt (`cases.ts:4684`) · N5 lần xử lý đã lưu chỉ Thu hồi, không xoá (`xuLy.ts:710`) ·
N37 xoá Case hệ thống / PA quy chế qua QL duyệt (`cases.ts:1301,1307,1867`) · N8 ④ Case tạm không PA / hoàn thành (`cases.ts:953`, `owner.ts:246`) ·
N17 cả lớp cùng chi nhánh (`lenhChuyen.ts:157`), Kết quả đầu ra (`cuoiKhoa.ts:780`) · N21 Xét lại (`xetLai.ts:348,354`) · N22 ① chỉ QL chốt hướng (`danhGiaDauRa.ts:68`, `loTrinhTiep.ts:229` với GVCN), ② chờ MT0 (`cuoiKhoa.ts:787`, `kyVong.ts:166`), ④ môn chỉ FT (`monDangKy.ts:60`) ·
N29 bàn giao đủ góp ý (`banGiaoGv.ts:284`, web `BanGiaoGvPanel:122`) · N28 thùng rác / ghi đảo 30 ngày (`ghiDao.ts:138`, `thungRac.ts:260`).
⚠ N22 ③ "Chuyển ngay — không hoàn tác" (`CuoiKhoaLop:731`) trái lời 07/11 → đề xuất thêm đường khôi phục (Hoàn tác lệnh chuyển = đi thẳng về lớp cũ).

## Dòng D — giữ (tóm theo nhóm; chi tiết ở bảng từng khu)
Tạo trùng bản ghi đang mở (Case, thẻ, lượt, bài, việc phối hợp, Checkpoint) · xung đột phiên bản (hai người cùng sửa, 409) · Hoàn tác ghi đảo khi dòng đã đổi (G9) ·
chống tự khoá (tự xoá mình, xoá Quản trị cuối, ô quyền khoá) · bấm lặp / đã làm rồi · dữ liệu không thể đúng (ngày tương lai, thứ tự ngày, số buổi < buổi đã dạy, vắng khi chưa có tuần / đã có điểm, không có lộ trình / lớp để gắn, lớp đích sai loại) ·
khôi phục khi bản gốc đã mất / đã quá 30 ngày · cửa sổ Hoàn tác 10 s (có đường Sửa / Xoá thay).
Cần sửa CÂU (không đổi luật): `sysconfig.ts:147` bỏ qua lặng lẽ → báo tại ô · `app.ts:147` "Dữ liệu bị trùng hoặc vi phạm ràng buộc." → câu cụ thể · các 409 "Không còn hoàn tác được" (`students.ts:488-624`) → thêm câu chỉ đường đi thẳng.

## Câu cần PTA / chủ SP quyết (gom từ 46 dòng "?")
1. **Q-B1 (47 dòng C?)** — ba khoá "vì đóng hồ sơ" (Lưu trữ, lớp đã kết thúc, Case xong phải Mở lại): lời chủ SP 07/11 thay Q-B1 ① → MỞ theo G1 / G2 / G5? **Khuyến nghị: mở** (đúng câu "học xong sửa điểm không được, sửa quyết định không được").
2. **Luật thang vi phạm Rulebook không có số ở 1.6** — đang bắt buộc xử lý thì không Ghi nhận (`xuLy.ts:106`, `lo.ts:76`); chuỗi đã xử lý trên web thì không khai bậc (`xuLy.ts:226`); chỉ QL sửa bậc sau xử lý (`xuLy.ts:257`); ngày thực hiện ≥ ngày QL duyệt (`xuLy.ts:287,335`); ≥ 3 vi phạm thì không còn "Đã xem". **Khuyến nghị:** ngày thực hiện → nhắc, không chặn; ba chỗ còn lại giữ (đúng thang) nhưng câu chỉ đường.
3. **Chặn theo tuần chưa tới** (T19, không số ở 1.6) — nhập điểm / "-" / S Ex khi chưa tới tuần thi (`skillSchedule.ts:1053`, `attempts.ts:2337`, `regular.ts:871`, `absence.ts:746`, `sExpert.ts:118`). **Khuyến nghị B:** hỏi "Dời về tuần này rồi lưu?".
4. **Tuần đã qua** — chọn tuần bắt đầu / chuyển lớp / thi lại / hiệu lực phân công lùi về tuần đã qua (`chuyenLop.ts:182`, `buocTiep.ts:168,336`, `loTrinhTiep.ts:470`, `keHoachTest.ts:686`, `phanCongGv.ts:75`). **Khuyến nghị:** cho chọn (ghi lịch sử), vì nhập bù là chuyện thường; giữ "Ngay hôm nay" làm mặc định.
5. **PA quy chế** chưa hết mốc ẩn Hoàn thành Case (`sosV4.ts:189`, quy chế SOS K3 §4a) + GV môn không gửi "Không cần theo dõi" khi PA đang chạy (`sosAuto.ts:750`) → GV môn kẹt. **Khuyến nghị B:** cho Hoàn thành, hỏi xác nhận "kết thúc sớm PA quy chế".
6. **Thứ tự Giữa khoá / Cuối khoá lớp thường** (`skillSchedule.ts:699-718`) và "MT0 muộn nhất tuần 2 FT" (`mt0.ts:46`) → nhắc + xác nhận thay chặn?
7. **Đổi chương trình lớp** khi đã có HV / bài Test (`thongTinLop.ts:62,64`; máy đếm cả em đã rời lớp) · **Kết thúc lớp** còn em đang học / chưa chốt Lộ trình tiếp (`xoaKetThucLop.ts:130`) → B xác nhận hay giữ?
8. **Tài khoản đã xoá mềm** — không có đường khôi phục (`accounts.ts:366…680`) → thêm "Khôi phục tài khoản" cho Quản trị?
9. Các "?" còn lại (thẻ không có Huỷ quyết định theo loại, thẻ đề xuất chuyển lớp tự đóng khi Tạm dừng, xử lý theo lô loại em có đề xuất chờ…) — xem bảng từng khu, sửa trong PR khu đó theo hướng A / B.

## Quyết định PTA Plan 07/11 (duyệt bảng)
1. Q-B1: **MỞ cả 3 khoá** (Lưu trữ, lớp kết thúc, Case xong) — có lịch sử + Hoàn tác.
2. Thang vi phạm: ngày thực hiện < ngày duyệt → nhắc, không chặn. Bắt buộc xử lý không Ghi nhận / chỉ QL sửa bậc → GV giữ luật, QL / Admin làm được (xác nhận + lịch sử).
3. Nhập điểm / "-" khi chưa tới tuần thi → B "Dời về tuần này rồi lưu?".
4. Chọn tuần đã qua → cho chọn, có lịch sử.
5. B "Kết thúc sớm PA quy chế" rồi Hoàn thành Case.
6. Giữa / Cuối khoá, MT0 muộn → nhắc + xác nhận, không chặn.
7. Đổi chương trình lớp có HV / bài; Kết thúc lớp còn em chưa chốt → B xác nhận nêu đúng số em / bài ảnh hưởng, rồi làm.
8. Thêm Khôi phục tài khoản xoá mềm cho Quản trị.
- N22 ③ "Chuyển ngay — không hoàn tác" → thêm Hoàn tác / khôi phục.
- **Luật chung cho mọi dòng C:** "không chặn cứng" = luôn có người có quyền làm được → GV theo luật đã chốt (N15, N23, N3…), **QL / Admin VƯỢT KHOÁ được** (xác nhận ngắn nêu luật bị vượt + lịch sử + Hoàn tác).
- **D:** giữ, nhưng mỗi câu chặn phải chỉ đường (làm gì tiếp, ở đâu). Câu báo / xác nhận ngắn tại nút. Turso không thêm đọc.
- `PanelSauThi.tsx:180` "Sửa điểm" thi thật → HOTFIX-MO-KHOA làm. RKC-5 sau khi HOTFIX merge.

## Đề xuất chia PR (theo khu, mỗi PR máy chủ + web của khu)
1. **RKC-1 Test & điểm** — G2 (phần điểm), G3, G4, G10, ô vắng → nhập điểm, `lockedByNoShow` (attempts, regular, skillSchedule, absence, ketQuaHuy, lichMt, keHoachTest + web fasttrack / test / cham).
2. **RKC-2 Case & PA & Tutor** — G5, G6 (Case), G7 (tutor, ngày PA), G8 (cases, sosAuto, sosV4, owner, tutors + web cases / tutor).
3. **RKC-3 Ý thức + duyệt + việc** — vi phạm em tạm dừng / đã học xong, Báo PH / Phối hợp đã bỏ, huỷ quyết định trong ngày, việc cha / con, báo cáo tuần (yThuc, duyet, worklist + web).
4. **RKC-4 Lớp** — G2 (cờ lớp, lịch lớp), khôi phục quyết định chuyển lớp, Xét lại đi thẳng, Kết thúc lớp xác nhận (classes, normal + web classes).
5. **RKC-5 Học viên + Lưu trữ (G1)** — **sau khi HOTFIX-MO-KHOA merge** (`chanLuuTru` nằm ở students.ts).
6. **RKC-6 Quản trị** — khôi phục tài khoản, xoá tài khoản là GVCN (xác nhận), câu lỗi chung.
Mỗi chỗ mở: lịch sử (`writeAudit` / ghi đảo) + đường hoàn tác / sửa lại + phép kiểm riêng. Turso: không thêm đọc đáng kể (chỉ bỏ điều kiện chặn; xác nhận đọc dữ liệu đã nạp).

---
# Bảng chi tiết từng khu

---

**Đếm (55 dòng):** A 6 · A? 2 · B 2 · C 2 (N22 ①, N22 ④) · C? Q-B1 7 · D 26 · D? 3 · ? 6

## Rà chặn cứng — MÁY CHỦ học viên & lộ trình (chỉ đọc, 07/11)

Khu: `server/src/students/*`, `server/src/loTrinh/*`, `classes/loTrinhTiep.ts`, `classes/transition.ts`, `classes/luatLoTrinh.ts`, `fasttrack/monDangKy.ts`, `fasttrack/cycles.ts`, `fasttrack/hoanTat.ts` + hàm chặn `shared/domain` các tệp gọi.
`CAU_LUU_TRU` (shared/domain/quanLyHocVien.ts:26) = "Đã lưu trữ — Quay lại học trước rồi sửa." · Kết thúc học luôn vào Lưu trữ (NGHI-HOC-LUU-TRU) nên mọi khoá `archived_at` = khoá em đã kết thúc / tạm dừng.

| tệp:dòng | thao tác (đường API / nút) | câu chặn (rút gọn) | loại | đề xuất mở / lý do giữ · lịch sử/hoàn tác? · HOTFIX? |
|---|---|---|---|---|
| students/students.ts:404 (+ hangLoat.ts:54) | POST /students/:id/hoc-lai (một em, hàng loạt) — em kết thúc không có ghi danh `completed` | "Chưa có lớp nào để học lại — dùng Chuyển lớp" | A | KẸT: Chuyển lớp em lưu trữ bị `CAU_LUU_TRU` (:192). Có `lopMoiId` thì cho Học lại sang lớp đó · có nhật ký `student.rejoin` · HOTFIX |
| loTrinh/buocTiep.ts:253 | POST /cycles/:id/buoc-tiep — đổi lựa chọn "Lộ trình mới · Lớp khác" sau khi lệnh đã thi hành | "Em đã chuyển sang lớp mới — đổi ở hồ sơ" | A | Không hoàn tác chuyển lớp; áp thẳng lựa chọn mới từ trạng thái hiện tại · có Hành trình + nhật ký · HOTFIX |
| loTrinh/buocTiep.ts:273 | POST /cycles/:id/buoc-tiep — đổi lựa chọn khi hoàn tác lựa chọn cũ vướng 409 (Học lại đã có điểm, em đã đổi trạng thái) | "Không đổi được … Giữ lựa chọn cũ, hoặc đổi ở hồ sơ" | A | Bỏ bước "hoàn tác trước": giữ dữ liệu lộ trình mới, đi thẳng tới lựa chọn mới · có `truoc` để lùi · HOTFIX |
| loTrinh/buocTiep.ts:375 | Bước tiếp › Tạm dừng khi em đã Kết thúc học | "Em đã Kết thúc học — chọn Lộ trình mới hoặc Thôi học" | A | Kết thúc → Tạm dừng thẳng (đổi status + giữ Lưu trữ), ghi lịch sử · HOTFIX |
| classes/luatLoTrinh.ts:106, :541 (`lopHienTaiCua` chỉ ghi danh `active`) + students/profile.ts:19 (`lopHocP7` ẩn Chuyển lớp) | GET /students/:id/chuyen-lop, lớp đích; nút Chuyển lớp — em Tạm dừng | "Học viên không đang học lớp nào" | A | `transferStudent` đã nhận em tạm dừng (lớp giữ `paused`); mở panel + nút cho em tạm dừng, khỏi Quay lại học trước · có nhật ký |
| fasttrack/hoanTat.ts:146 `chanVangLopKetThuc` (gọi: absence.ts:737, attempts.ts:2219, normal/regular.ts:665, :812) | ghi / gỡ "-", Báo vắng ở lớp đã kết thúc — kể cả QL | "Lớp đã kết thúc — không ghi vắng ("-")" | A | "-" ở lớp đã kết thúc = Không dự thi (như MT cũ, N38 ②), không dời; gỡ "-" cho làm · có nhật ký điểm |
| students/trangThaiHv.ts:140 | POST /students/:id/quay-lai — em đã Kết thúc | "Em đã kết thúc học — dùng Quay lại học … ở hồ sơ" | A? | Cùng nút "Quay lại học": gọi thẳng `hocLai` thay vì 400 chỉ đường · HOTFIX |
| fasttrack/monDangKy.ts:61 | PUT /cycles/:id/mon-dang-ky — lộ trình đã kết thúc | "Lộ trình đã kết thúc — không đổi môn học" | A? | Cho sửa môn lộ trình đã xong (chỉ tính lại Overall / SOS lộ trình đó), có nhật ký; em lưu trữ còn bị `chanLuuTru` trước |
| students/trangThaiHv.ts:91 (câu ở :18–24) + students/hangLoat.ts:49–50 | POST /students/:id/status Tạm dừng / Kết thúc; hàng loạt cùng việc — em có quyết định chuyển lớp chờ | "Em đang có quyết định chuyển lớp chờ — huỷ … rồi làm lại" | B | Hỏi xác nhận "Huỷ quyết định chuyển lớp W… và Tạm dừng?", làm cùng giao dịch · huỷ lệnh có Khôi phục · HOTFIX (trangThaiHv) |
| students/students.ts:417 | POST /hoc-lai về lớp cũ đã kết thúc | "Lớp x đã kết thúc — mở lại lớp để học viên học lại" | B | Đã là xác nhận (cờ `moLaiLop`); giữ · HOTFIX |
| students/students.ts:192 | `transferStudent` (Chuyển lớp, Quay lại học › lớp khác, thi hành lệnh) — em Kết thúc (Lưu trữ) | CAU_LUU_TRU | C? Q-B1 | Mở: Chuyển lớp em kết thúc = Học lại sang lớp đó một bước (`hocLai` có `lopMoiId`) · nhật ký có · HOTFIX |
| students/students.ts:265 + hangLoat.ts:49 ("Đã kết thúc học") | POST /students/:id/status — Tạm dừng em đã Kết thúc | CAU_LUU_TRU | C? Q-B1 | Mở: Kết thúc → Tạm dừng thẳng, không bắt Học lại trước · nhật ký có · HOTFIX |
| students/students.ts:831 `chanLuuTru` (gọi: routes/index.ts:1846 PATCH /cycles/:id · :1855 PUT /cycles/:id/mon-dang-ky · :1862 PUT /cycles/:id/baseline · :1873 PUT /cycles/:id/outcome thân cũ · :1942 POST /cycles/:id/target-revision · classes/lichThi.ts:295 dự kiến thi) | sửa Target, dự kiến thi, môn, đầu vào, kết luận cũ — em Lưu trữ | CAU_LUU_TRU | C? Q-B1 | Mở: sửa được, ghi lịch sử (KQ thi thật đã mở OV-13h; Sửa thông tin đã mở 07/11) · HOTFIX |
| students/students.ts:837 `chanLuuTruHv` (routes/index.ts:1830) | POST /students/:id/cycles (mở lộ trình mới) — em Lưu trữ | CAU_LUU_TRU | C? Q-B1 | Mở: = Học lại + lộ trình mới một bước · HOTFIX |
| students/students.ts:853 | PATCH /students/:id có `dauVao` — em Lưu trữ | CAU_LUU_TRU | C? Q-B1 | 07/11 đã nới (chỉ còn điểm đầu vào); mở nốt, có nhật ký `cycle.baseline.*` · HOTFIX |
| classes/loTrinhTiep.ts:367–376 `lopHocCua` (`chiXem`) | cờ nút hồ sơ — em Lưu trữ: ẩn Chuyển lớp, Tạm dừng, Kết thúc, Ghi lộ trình | ẩn nút (chỉ còn Bỏ lưu trữ / Học lại) | C? Q-B1 | Mở theo :192, :265 (cờ đi cùng máy chủ) |
| fasttrack/hoanTat.ts:130 `kiemLopKetThuc` (gọi: attempts.ts:2221, normal/regular.ts) | sửa / xoá điểm đã có ở lớp đã kết thúc — GV đúng môn | 403 "Lớp đã kết thúc — chỉ Quản lý sửa được điểm" | C? Q-B1 | Đề xuất: GV đúng môn sửa được, đi đường override (có nhật ký); ô trống đã mở OV-13h |
| classes/loTrinhTiep.ts:229 `chanQlDaQuyet` | PUT /students/:id/lo-trinh-tiep, ghi cả lớp — đổi Hướng / Target khi có quyết định Cuối khoá chờ | 409 "Quản lý đã quyết." | C N22 ① (GVCN) · A? (QL) | GVCN giữ (chỉ QL chốt hướng). QL: đổi ở ô Lộ trình = sửa luôn quyết định chờ, có nhật ký |
| fasttrack/monDangKy.ts:60 (+ buocTiep.ts:142 lớp thường) | đổi môn lộ trình không FT | "Môn học chỉ áp cho lộ trình Fast Track" | C N22 ④ | P8 Môn đăng ký chỉ FT |
| students/students.ts:268, :273 | POST /status — ngày quay lại trước ngày tạm dừng / ngày tạm dừng trước lần quay lại | "Ngày … không được trước …" | D | Khoảng tạm dừng ghép cặp theo ngày; ghi lùi làm sai hạn Case · HOTFIX |
| students/students.ts:260, :387; loTrinh/buocTiep.ts:124 | đổi trạng thái / Học lại ngày sau hôm nay | "Ngày hiệu lực không được sau hôm nay" | D | Trạng thái áp ngay, chưa có lịch hẹn · HOTFIX |
| students/students.ts:388 | POST /hoc-lai ngày trước ngày kết thúc | "Ngày học lại không được trước ngày kết thúc" | D | Thứ tự mốc Hành trình · HOTFIX |
| students/students.ts:284 | POST /status Quay lại học khi lớp giữ đã kết thúc | "Lớp đã kết thúc — Quay lại học ở Lưu trữ để chọn lớp" | D? | Đường đúng có (`quayLaiHoc` chọn lớp); có thể thêm "mở lại lớp" như Học lại · HOTFIX |
| students/students.ts:384 | POST /hoc-lai em chưa kết thúc | "Chỉ cho học lại được học viên đã kết thúc học" | D | Em đang học / tạm dừng có đường riêng · HOTFIX |
| students/students.ts:488 (+ hangLoat.ts:58) | Hoàn tác Học lại | "Không còn hoàn tác được — đã đổi trạng thái / chuyển lớp" | D | Không hoàn tác chính xác; đi thẳng = Tạm dừng / Kết thúc học (có). Câu nên chỉ đường · HOTFIX |
| students/students.ts:495–510 | Hoàn tác Học lại khi lộ trình mới đã có điểm / dữ liệu | "Lộ trình mới đã có … — không hoàn tác được" | D | Gỡ lộ trình có điểm = mất dữ liệu; đi thẳng = Kết thúc học. Bước tiếp gọi vào đây → buocTiep.ts:273 (A) · HOTFIX |
| students/students.ts:562 (+ hangLoat.ts:57) | Hoàn tác Kết thúc học | "Không còn hoàn tác được …" | D | Đi thẳng = Học lại (có) · HOTFIX |
| students/students.ts:596 (+ hangLoat.ts:51) | Hoàn tác Tạm dừng | "Không còn hoàn tác được …" | D | Đi thẳng = Quay lại học (có) · HOTFIX |
| students/students.ts:624 | Hoàn tác Quay lại học | "Không còn hoàn tác được …" | D | Đi thẳng = Tạm dừng (có) · HOTFIX |
| students/students.ts:685 (+ hangLoat.ts:52) | Lưu trữ em chưa kết thúc | "Chỉ lưu trữ được học viên đã kết thúc học" | D? | Lưu trữ = không học; em tạm dừng đã tự vào · HOTFIX |
| students/students.ts:873–874 | Sửa thông tin › điểm đầu vào — em chưa có lộ trình / lớp thường | "Em chưa có lộ trình…" · "Lớp thường không có điểm đầu vào" | D | Không có chỗ ghi · HOTFIX |
| students/hangLoat.ts:139 | hàng loạt Học lại sang lớp FT | "cần Target — làm từng học viên" | D? | Target bắt buộc từng em; có thể thêm ô Target / KCK chung |
| students/trangThaiHv.ts:121 | GET/POST quay-lai em đang học | "Học viên đang học — không cần Quay lại học" | D | Không có gì để làm · HOTFIX |
| students/trangThaiHv.ts:139 | POST quay-lai khi lộ trình đã đóng sau thi | "Lộ trình cũ đã đóng — chọn Lộ trình mới" | D | Lộ trình đã đóng không chạy tiếp; panel Lộ trình mới cần chọn · HOTFIX |
| loTrinh/buocTiep.ts:374 | chọn bước tiếp ở lộ trình không phải mới nhất | "Em đã có lộ trình sau lộ trình này" | D | Tránh hai nhánh lộ trình · HOTFIX |
| loTrinh/buocTiep.ts:147 (`kiemLopLoTrinhMoi` shared/domain/students.ts:55) | Lộ trình mới — lớp sai loại (LT / RF / thường) | "{lớp} là lớp RF — lộ trình LT1 cần lớp LT" | D | Lịch MT theo loại lớp; "Khác" nhận mọi lớp FT · HOTFIX |
| loTrinh/thiThat.ts:93–94 | KQ thi thật — ngày thi sau hôm nay / trước ngày bắt đầu lộ trình | "Ngày thi không hợp lệ…" | D | Ngày thi trước lộ trình là KQ lộ trình cũ · HOTFIX |
| loTrinh/thiThat.ts:181 | Khôi phục KQ thi thật bản ghi trước PR | "Bản này ghi trước khi có Khôi phục — sửa tay" | D | Không có bản chụp; sửa tay được · HOTFIX |
| loTrinh/thiThat.ts:186 | Hoàn tác KQ thi thật sau khi người khác sửa | "Đã có người sửa … — mở Lịch sử" | D | Xung đột phiên bản; Lịch sử khôi phục đúng bản · HOTFIX |
| loTrinh/thiThat.ts:312 | PUT /cycles/:id/han-sau-thi ngoài giai đoạn chờ bước tiếp | "Chỉ gia hạn Chọn bước tiếp…" | D | Không có hạn để gia · HOTFIX |
| classes/loTrinhTiep.ts:129 | Lộ trình tiếp theo — ngày xem lại mới đã qua | "Ngày xem lại phải từ hôm nay trở đi" | D | Ngày cũ giữ được; hẹn xem lại quá khứ vô nghĩa |
| classes/loTrinhTiep.ts:142–146 (+ transition.ts:409, loTrinhTiep.ts:466 qua `kiemDongChuyenTiep` shared/domain/lenLop.ts:151) | lớp dự kiến / lớp đích không khớp hướng | "Lớp … phải là chương trình kế tiếp / Fast Track…" | D | Hướng ↔ lớp phải khớp; lớp khác → chọn hướng khác |
| classes/loTrinhTiep.ts:240–243, :256–257; transition.ts:49 | Lộ trình tiếp theo — em không đang học / lớp FT / chương trình liên tục | "Chỉ áp dụng cho lớp thường" · `CAU_LIEN_TUC` | D | Không áp dụng |
| classes/loTrinhTiep.ts:460 (`luuNhap`) | PUT /classes/:id/lo-trinh-nhap — em đã có quyết định chờ | "Đã chốt — sửa ở ô Lộ trình" | D | Nháp không đè lệnh; sửa lệnh ở ô Lộ trình (có) |
| classes/luatLoTrinh.ts:54–57 `lopDichHopLe` (students.ts:194, :410; luatLoTrinh.ts:571; transition.ts:403) | lớp đích đã kết thúc / trùng lớp nguồn | "Lớp chuyển đến không hợp lệ" | D | Không ghi danh vào lớp đã đóng |
| fasttrack/cycles.ts:516, :538 | đổi Target chương trình liên tục không kỳ thi | `CAU_LIEN_TUC.target` | D | Không có Target (OV-6b2) |
| fasttrack/cycles.ts:455–458 | setOutcome lấy lượt MT làm KQ | "Không lấy một lượt Mock Test làm kết quả thi thật" | D | Dữ liệu sai nghĩa |
| students/baiTrenLop.ts:85 | POST /students/:id/bai-tren-lop tuần sau tuần này | "Chưa tới tuần này…" | D | Không ghi bài tương lai |
| students/trangThaiHv.ts:145 | POST quay-lai, lớp cũ đã kết thúc — TVV / GVCN | 403 "Lớp cũ đã kết thúc — chỉ Quản lý chọn lớp mới" | ? | Quyền đổi theo trạng thái lớp: lớp chạy thì TVV làm được, lớp đóng thì kẹt. Chuyển lớp = QL (PR-CT) → đề xuất: TVV gửi đề xuất / việc QL · HOTFIX |
| loTrinh/buocTiep.ts:328 | chọn bước tiếp khi chưa có KQ thi thật | "Lộ trình chưa có KQ thi thật — nhập … trước" | ? | Hạn N6 tính từ KQ. Có thể cho chọn trước, KQ nhập sau; hồ sơ vẫn Tạm dừng / Kết thúc được · HOTFIX |
| loTrinh/buocTiep.ts:168, :336 (+ loTrinhTiep.ts:470 nháp; `LOI_TUAN_BAT_DAU` shared/domain/chuyenLop.ts:68) | Lộ trình mới / nháp — tuần bắt đầu đã qua | "Tuần bắt đầu phải là hôm nay hoặc từ tuần sau" | ? | Ghi muộn không lùi được tuần 1; mở cần lịch MT quá khứ · HOTFIX (buocTiep) |
| loTrinh/thiThat.ts:87 | KQ thi thật — lộ trình đóng vì chuyển lớp | "Lộ trình đóng vì chuyển lớp — em không đi thi" | ? | Em vẫn có thể đi thi sau chuyển lớp; cho nhập, hoặc chỉ sang lộ trình mới · HOTFIX |
| loTrinh/thiThat.ts:319, :321 | gia hạn sau thi — hạn trước hôm nay / không sau hạn gốc | "Hạn mới … phải sau hạn gốc" | ? | Không rút ngắn được hạn; "Bỏ gia hạn" có — vô hại, có thể nới · HOTFIX |
| classes/loTrinhTiep.ts:140 | Lộ trình tiếp theo MỘT em — lớp dự kiến khác chi nhánh | "Không tìm thấy lớp dự kiến" | ? | N17 chỉ khoá luồng cả lớp; một em khác CN được (N17, N24 ④) — câu sai nghĩa |

Ngoài khu (chỉ ghi chú): R11 "đợt hoàn tất chỉ QL sửa điểm" (`quyenSuaSauHoanTat` hoanTat.ts:116) chặn ở `fasttrack/attempts.ts` · `khoiPhucLenh` (hangLoat.ts:174) và `raLenh` (buocTiep.ts:394) chỉ chuyển tiếp câu của khu Chuyển lớp · `cotCua` (classes/gopYTuan.ts) quyết `ghiDuoc` bài trên lớp.

---

Đếm: A 7 · A? 12 · B 1 · C 8 · C? Q-B1 2 · D 18 · D? 7 · ? 2 — tổng 57 dòng (máy chủ lớp: `server/src/classes/*` trừ loTrinhTiep/transition/luatLoTrinh, + normal/xetLai, cuoiKhoa, kyVong, hàm chặn shared/domain gọi tới).

| tệp:dòng | thao tác (đường API / nút) | câu chặn (rút gọn ≤ 15 chữ) | loại | đề xuất mở / lý do giữ · lịch sử/hoàn tác? · HOTFIX? |
|---|---|---|---|---|
| server/src/classes/classes.ts:895 | GET /classes/:id — cờ `viewer` lớp đã kết thúc (ẩn mọi nút web) | lớp finished → mọi cờ thao tác false, kể cả QL / QT | A | Vượt Q-B1 (Q-B1 vẫn cho QL sửa điểm): cờ theo quyền như lớp đang chạy, không bắt "Mở lại lớp" trước · Mở lại lớp có nhật ký |
| server/src/classes/lenhChuyen.ts:485 | POST khôi phục quyết định chuyển lớp (Hoàn tác huỷ nhiều) | Đã quá {n} giờ — ra quyết định mới | A | Bỏ trần giờ; còn hợp lệ (488–490) thì khôi phục · có nhật ký |
| server/src/classes/lenhChuyen.ts:486 | như trên | Tuần bắt đầu đã tới — ra quyết định mới | A | Khôi phục về `cho` với tuần = hôm nay / tuần sau (hỏi tuần tại hộp) · có nhật ký |
| server/src/normal/xetLai.ts:474 | POST /classes/:id/xet-lai (Sửa) + /xet-lai/hoan-tac | Em đã chuyển lớp — dùng Chuyển lớp để đổi | A | Đi thẳng: Sửa = ra lệnh mới từ lớp hiện tại ngay tại thẻ, ghi Hành trình · không bắt sang Chuyển lớp |
| server/src/normal/xetLai.ts:481 | Hoàn tác / Sửa quyết định "Tạm dừng/ Kết thúc học" | Trạng thái học viên đã đổi — sửa ở hồ sơ | A | Đi thẳng từ trạng thái hiện tại tới quyết định mới · gọi hoanTacKetThuc/TamDung ở students.ts — HOTFIX |
| server/src/normal/xetLai.ts:484 | Hoàn tác "Tạm dừng" từ Xét lại → khôi phục lệnh đã huỷ | lỗi kế thừa khoiPhucLenh (quá giờ / tuần đã tới) | A | Theo dòng lenhChuyen:485–486 · HOTFIX (students.ts cùng luồng) |
| server/src/normal/xetLai.ts:533 | PUT nhận xét GVCN lớp mới | QL đã quyết … — nhận xét không còn cần | A | Nhận xét không bắt buộc, vô hại: cho lưu, hiện trong lịch sử thẻ |
| server/src/classes/lenhChuyen.ts:159 | raLenh (Chuyển lớp / Cuối khoá / Xét lại / duyệt đề xuất) | Em đã có quyết định chuyển lớp ở lớp khác | A? | Lệnh cũ là lệnh treo (em đã rời lớp đó): tự huỷ lệnh cũ có ghi lý do rồi ra lệnh mới |
| server/src/classes/lenhChuyen.ts:337 | PATCH / huỷ quyết định (`kiemConSuaDuoc`) | Quyết định vừa được thi hành / đã được huỷ | A? | Đã thi hành: "Sửa" mở thẳng Chuyển lớp từ lớp hiện tại (điền sẵn); đã huỷ: nút Khôi phục · đã huỷ là D |
| server/src/classes/lenhChuyen.ts:484 | Khôi phục quyết định | Do hệ thống huỷ — không khôi phục được | A? | Cho khôi phục khi kiểm 488–490 đạt (em còn lớp nguồn, lớp đến chạy) |
| server/src/classes/banGiao.ts:36 | ghi môn / xác nhận / nháp bàn giao chuyển lớp (`quyenBanGiao.qlThay`) | QL xác nhận thay chỉ khi không GVCN hoặc quá hạn | A? | QL "Làm thay" lúc nào cũng được (N33 ③), ghi `xac_nhan_thay` · có nhật ký |
| server/src/classes/banGiaoGv.ts:182 | góp ý / nhận xét / xác nhận bàn giao đổi GV (`quyenViec.thay`) | Quản lý điền thay khi quá hạn | A? | Như trên — bỏ điều kiện hạn cho QL |
| server/src/classes/baoCaoPh.ts:251 | PUT /classes/:id/bao-cao-ph | Đợt báo cáo chưa mở hoặc không có | A? | Cho viết sớm đợt sắp mở (hoặc QL mở ngay) · lý do giữ: đợt chưa tính được em |
| server/src/classes/dotBaoCaoPh.ts:83 | POST /bao-cao-ph/dot (thêm đợt) | Đợt mở từ hôm nay trở về trước | A? | Cho hẹn ngày mở tương lai |
| server/src/classes/xoaKetThucLop.ts:130 (nhánh `lyDoConEm` cuối) | POST /classes/:id/ket-thuc | Còn n em chờ tới tuần chuyển lớp | A? | Hẹn kết thúc: lớp tự kết thúc khi lệnh cuối thi hành (`dongLopNeuHet` đã có cho lớp thường) |
| server/src/normal/xetLai.ts:329 (+73, 256, 470) | POST /classes/:id/xet-lai | Em không còn cần xét lại (quá hạn tự "Tiếp tục", dòng tự giữ không Sửa được) | A? | N21 chỉ nói hết hạn tự ghi Tiếp tục, không nói khoá: cho QL Sửa cả dòng tự giữ / sau hạn |
| server/src/normal/xetLai.ts:412, 414 | Hoàn tác / Sửa Học lại (`khoiPhucLenh` nội bộ) | Đã đổi ở Chuyển lớp — dùng Chuyển lớp | A? | Đi thẳng: ghi quyết định mới trên lệnh hiện tại tại thẻ |
| server/src/normal/xetLai.ts:502 | Hoàn tác một lần Sửa (`traLaiQuyetCu`) | Không trả lại được — em đã đổi lớp | A? | Đi thẳng: báo đã giữ quyết định hiện tại, cho chọn quyết định mới |
| server/src/normal/cuoiKhoa.ts:612 | ghi / sửa Mini Test (`kiemMiniTest`) | Ngày làm Mini Test quá xa ngày dự kiến (< −14 ngày) | A? | Ngày thật có thể sớm: chỉ nhắc, không chặn (ngày tương lai vẫn chặn) |
| server/src/classes/xoaKetThucLop.ts:132 (+ 90) | POST /classes/:id/ket-thuc | Còn n quyết định chuyển ĐẾN lớp — huỷ trước | B | Xác nhận nêu n em: huỷ n quyết định đến cùng lúc (ghi lý do, khôi phục được) |
| server/src/classes/lenhChuyen.ts:157 | raLenh cả lớp (Cuối khoá) | Lớp chuyển đến phải cùng chi nhánh | C | N17 (chuyển MỘT em khác chi nhánh vẫn được) |
| server/src/classes/banGiaoGv.ts:284 | POST /ban-giao-gv/:id/xac-nhan | Còn n em thiếu góp ý | C | N29 "mỗi em một góp ý mỗi kỹ năng" |
| server/src/classes/danhGiaDauRa.ts:68 | PUT /classes/:id/danh-gia-dau-ra/:sid (ghi đề xuất hướng) | CHI_QL_CHOT_HUONG (403) | C | N22 ① chỉ QL chốt hướng, `de_xuat` cũ chỉ đọc |
| server/src/normal/xetLai.ts:348 | Xét lại "Lên lớp" | Lên lớp chỉ cho em học lại có Final ≥ 60 % | C | N21 dòng (c); dòng (a)(b) "Tiếp tục" = lên |
| server/src/normal/xetLai.ts:354 | Xét lại "Học lại" | Lớp học lại phải là lớp {CT cũ} | C | N21 "Học lại {CT cũ}" (mọi chi nhánh — N24 ④) |
| server/src/normal/cuoiKhoa.ts:787 | ghiKetLuanFt (Kỳ vọng ở hồ sơ HV) | Chờ MT0: cần ít nhất 3 kỹ năng có điểm | C | N22 ② QL đánh tay sau tuần muộn nhất · đề xuất (nếu PTA muốn mở): đánh tay lúc nào cũng được, ghi "đánh tay" |
| server/src/normal/kyVong.ts:166 | PUT Lưu Kỳ vọng cả lớp | {tên}: MT0 cần ít nhất 3 kỹ năng có điểm | C | N22 ② — như dòng trên |
| server/src/normal/cuoiKhoa.ts:780 | ghiKetLuanFt | Chỉ em lên FT từ FOU/BE/ELE mới có Kỳ vọng | C | N17 (Kỳ vọng chỉ em Lên FT) |
| server/src/classes/schedule.ts:705 | PUT lịch lớp (khai giảng / Progress / Final) | Lớp đã kết thúc — chỉ Quản lý sửa lịch lớp | C? Q-B1 | Cùng họ khoá Q-B1 "lớp kết thúc chỉ QL"; đề xuất mở cho GVCN / Admin như lớp chạy · có nhật ký |
| server/src/classes/lichThi.ts:295 | PUT /hoc-vien-lop/lich-thi/:cycleId (`chanLuuTru`) | CAU_LUU_TRU "Đã lưu trữ — Quay lại học trước rồi sửa." | C? Q-B1 | Q-B1 "hồ sơ Lưu trữ khoá"; đề xuất cho sửa lịch thi khi Lưu trữ (có nhật ký) · hàm ở students.ts:829 — HOTFIX |
| server/src/classes/lenhChuyen.ts:483 | Khôi phục quyết định | Đã thi hành — không khôi phục được | D | Đã áp; đi thẳng = ra quyết định mới |
| server/src/classes/lenhChuyen.ts:488 | Khôi phục quyết định | Đã có quyết định chuyển lớp khác | D | Một lệnh chờ / em (chỉ mục duy nhất) |
| server/src/classes/lenhChuyen.ts:489 | Khôi phục quyết định | Học viên không còn học lớp nguồn | D | Lệnh không thi hành được |
| server/src/classes/lenhChuyen.ts:885 | POST đề xuất chuyển lớp (GVCN) | Đã có một đề xuất đang chờ Quản lý | D | Trùng thẻ; người gửi Sửa thẻ cũ (OV-7a) |
| server/src/classes/lenhChuyen.ts:926 | Duyệt đề xuất chuyển lớp | Em không còn học lớp nào | D | Không có lớp nguồn |
| server/src/classes/banGiao.ts:353, 383, 439, 451 | ghi / xác nhận / nháp / sửa bàn giao | Quyết định đã huỷ — không ghi bàn giao | D | Phiếu thuộc lệnh đã huỷ; khôi phục lệnh thì phiếu về |
| server/src/classes/banGiao.ts:387 | Xác nhận bàn giao | Phiếu đã được xác nhận | D | Trùng; đường Sửa có (OV-7a) |
| server/src/classes/banGiao.ts:442 | Nháp nhận xét chung | Phiếu đã xác nhận — dùng Sửa | D | Đường Sửa có |
| server/src/classes/banGiao.ts:452 | Sửa bàn giao | Phiếu chưa xác nhận — Xác nhận trước | D | Đường Xác nhận có, cùng ô |
| server/src/classes/banGiaoGv.ts:277 | Xác nhận bàn giao đổi GV | Bàn giao đã được xác nhận | D | Trùng; sau xác nhận vẫn sửa góp ý được |
| server/src/classes/phanCongGv.ts:119 | POST /phan-cong/luu | Phân công vừa đổi bởi người khác — tải lại | D | Xung đột phiên bản |
| server/src/classes/phanCongGv.ts:398 | đổi mốc / huỷ lịch đổi | Lịch đổi vừa thay đổi — tải lại | D | Xung đột phiên bản |
| server/src/classes/phanCongGv.ts:467 | Hoàn tác lưu phân công | Ô đã có lần đổi mới hơn — sửa trực tiếp | D | Đảo sẽ thành hai lịch một ô; đi thẳng ở bảng có |
| server/src/classes/phanCongGv.ts:472 | Hoàn tác lưu phân công | Việc bàn giao vừa tạo đã có góp ý | D | Không xoá chữ người khác; đi thẳng ở bảng có |
| server/src/classes/classes.ts:1110, 1117 | lưu phân công (`kiemTruocPhanCong`) | Mỗi môn một người · một GVCN · GV đã nghỉ | D | Dữ liệu không thể đúng (không ai nhập điểm) |
| server/src/classes/danhGiaDauRa.ts:80 | Lưu Đánh giá đầu ra | Đã có người sửa lúc… — bấm Lưu lần nữa | D | Xung đột phiên bản, bấm lại là ghi đè |
| server/src/classes/schedule.ts:311 | Áp lịch MT đề xuất | Chưa khai tuần bắt đầu học | D | Thiếu dữ liệu để tính |
| server/src/classes/xoaKetThucLop.ts:101 | POST /classes/:id/xoa | Lớp đã có dữ liệu — dùng Kết thúc lớp | D | Xoá hẳn mất dữ liệu; Kết thúc thay |
| server/src/classes/lenhChuyen.ts:490 | Khôi phục quyết định | Lớp chuyển đến đã kết thúc | D? | Khôi phục ra lệnh hỏng; có thể cho khôi phục + bắt chọn lớp đến mới |
| shared/domain/chuyenLop.ts:182 (`tuanHopLe`, gọi ở lenhChuyen:171, 905; xetLai:356) | ra / sửa lệnh, đề xuất, Xét lại | Tuần bắt đầu phải là hôm nay hoặc từ tuần sau | D? | Lùi ngày làm lệch điểm / lịch đã ghi; "Ngay hôm nay" đã là đi thẳng |
| server/src/classes/lenhChuyen.ts:897 | Đề xuất chuyển lớp | Học viên không đang học lớp nào | D? | Không lớp nguồn; em Lưu trữ / tạm dừng → QL Quay lại học (HOTFIX luồng students.ts) |
| server/src/classes/lenhChuyen.ts:907 | Đề xuất chuyển lớp (GVCN) | Em đã có quyết định chuyển lớp đang chờ | D? | Trùng lệnh QL; nên dẫn tới lệnh / cho nhắn QL thay vì chặn trơn |
| server/src/classes/banGiaoGv.ts:244 | Góp ý bàn giao đổi GV | Việc bàn giao đã huỷ (403) | D? | Việc huỷ theo lịch đổi; Hoàn tác huỷ lịch (`dao`) khôi phục |
| server/src/classes/phanCongGv.ts:75 | lưu / đổi mốc phân công | Chọn tuần sau tuần này hoặc Ngay hôm nay | D? | Lùi hiệu lực làm sai người chấm đã ghi; "Ngay hôm nay" có |
| server/src/classes/thongTinLop.ts:64 | PATCH thông tin lớp (đổi CT / lộ trình) | Lớp đã có bài Test nên không đổi được | D? | Bài Test theo thang chương trình cũ sẽ sai |
| server/src/classes/thongTinLop.ts:62 | PATCH thông tin lớp (đổi CT / lộ trình) | Lớp đã có n học viên — chuyển các em sang lớp khác | ? | Đếm cả em đã rời (enrollments mọi trạng thái); A nếu chỉ cần: đổi cả lớp + lộ trình từng em đi theo (xác nhận); D nếu giữ luật K2-18 |
| server/src/classes/xoaKetThucLop.ts:130 (nhánh FT / chưa chốt LTT) | POST /classes/:id/ket-thuc | Còn n em đang học / n em chưa chốt Lộ trình tiếp theo — làm trước | ? | B nếu cho Kết thúc kèm xác nhận nêu n em (em sang trạng thái nào?); D nếu em phải có nơi học — cần PTA quyết |

---

ĐẾM: A 25 · A? 20 · B 7 · B? 5 · C 4 (N15 · N9 ×2 · N13) · C N9/? 2 (dòng tham chiếu) · C? 6 (Q-B1 ×5 · N15 ×1) · D 13 · ? 6 — tổng 88 dòng (khu MÁY CHỦ Test & điểm; không tệp nào thuộc danh sách HOTFIX)

Ghi chú chung:
- "LS" = có nhật ký (`logSchedule` / `writeAudit`); "HT" = có Hoàn tác / Khôi phục sẵn. Đường dẫn gốc `server/src/` (trừ `shared/…`).
- Nhiều chỗ "lượt đã huỷ (`status='cancelled'`) → Mở lại trước": web đã bỏ "Huỷ MT" (attempts.ts:1764) nhưng dữ liệu cũ + lớp thường vẫn có lượt huỷ → đề xuất chung: thao tác trên lượt huỷ = tự Khôi phục lượt (reopenAttempt) rồi làm tiếp, một tx, hỏi xác nhận nêu tên lượt.
- `checkWeekVsNeighbours` (skillSchedule.ts:699–718) là MỘT nguồn chặn thứ tự, gọi lại ở absence.ts:310/444, ketQuaHuy.ts:131, skillSchedule.ts:980, keHoachTest.ts:621/810/973/985/1141, regular.ts:910 — dòng riêng chỉ ghi chỗ có hậu quả khác.

| tệp:dòng | thao tác (đường API / nút) | câu chặn (rút gọn) | loại | đề xuất mở / lý do giữ · lịch sử/hoàn tác · HOTFIX |
|---|---|---|---|---|
| shared/domain/lichMt.ts:124 + fasttrack/skillSchedule.ts:50 | mọi đường ghi lịch MT/MT0/S Ex tay (gọi ở attempts.ts:1376,1769,1871 · skillSchedule.ts:822,948,1117 · ketQuaHuy.ts:123 · keHoachTest.ts:612,1139,1154 · sExpert.ts:138,178,208) | T6–CN không đổi lịch MT tuần trước/này/sau | C N15 | giữ N15 (+ công tắc 06/11) · LS · không |
| fasttrack/attempts.ts:1871 | POST /attempts/:id/reopen (Khôi phục lượt) | khoá cuối tuần N15 | C? N15 | Khôi phục lượt không có trong ngoại lệ N15; giống "Khôi phục phần thi vắng" → nên miễn · HT · không |
| fasttrack/ketQuaHuy.ts:123 | POST /attempts/:id/khoi-phuc-ket-qua | khoá cuối tuần N15 | ? | khôi phục kết quả, không phải xếp lịch mới — đề xuất miễn như ngoại lệ Khôi phục · LS · không |
| shared/domain/lichMt.ts:87 · shared/domain/keHoachTest.ts:255 · keHoach/keHoachTest.ts:1206 | tạo MT9+ (xếp mới, hàng loạt, POST /attempts) | Tối đa MT8 cho một lộ trình | A | trái N14 "không giới hạn số MT" — bỏ trần · LS · không |
| shared/domain/lichMt.ts:90 | tạo MT(n) khi chưa có MT(n−1) | Chưa có MT{ke} — xếp trước | C N9 | N9 "số MT liền mạch" · — · không |
| shared/domain/lichMt.ts:88 · attempts.ts:1390 · keHoachTest.ts:980,989 | tạo lượt/bài đã có | Lộ trình đã có MTn / đã có bài này | D | trùng lượt đang mở; web nên mở ô có sẵn · — · không |
| shared/domain/lichMt.ts:91 | dùng lại số MT đã huỷ còn điểm | MT{n} đã huỷ còn điểm | D | bản cất điểm treo trên số đó; đề xuất Khôi phục thay vì chặn · HT · không |
| shared/domain/mt0.ts:47 (qua skillSchedule.ts:976, attempts.ts:1493, keHoachTest.ts:614) | xếp/dời MT1 trước MT0 | MT0 phải trước MT1 | C N9 | N9 "giữ MT0 trước MT1" · LS · không |
| shared/domain/mt0.ts:44 | xếp MT0 trước tuần Cuối khoá | MT0 sớm nhất {tuần} | A? | N25 chỉ là mặc định cùng tuần Final; đổi thành cảnh báo + xác nhận · LS · không |
| shared/domain/mt0.ts:46 | xếp MT0 sau tuần 2 FT | MT0 muộn nhất {tuần} | ? | N22② ngầm có "muộn nhất tuần 2 FT" nhưng là mốc tự đánh, không phải cấm xếp → đề xuất cảnh báo · LS · không |
| fasttrack/skillSchedule.ts:699–718 (lớp thường) | dời/xếp Giữa khoá ↔ Cuối khoá, Checkpoint | lượt sau không trước lượt trước / trùng tuần | ? | không có số luật 1.6; MT↔MT đã nới (N9) — đề xuất cảnh báo + xác nhận như MT · LS · không |
| normal/regular.ts:910 | gõ "-" lớp thường (PUT /regular/attempts/:id/scores/:skill) | vướng thứ tự — Nhờ QL dời ở Kế hoạch Test | A | FT "-" vướng lượt khác vẫn dời + cảnh báo (N38 ①) — làm y vậy · LS · không |
| fasttrack/attempts.ts:1764 | POST /attempts/:id/cancel (web, MT/MT0) | Không còn huỷ MT — dùng Xóa | A | MT đã có điểm: Xoá cũng chặn (1619) → kẹt; cho Xoá kèm điểm (xem dưới) · HT · không |
| fasttrack/attempts.ts:1619 | POST /attempts/:id/xoa (Xoá MT) | MTn đã có điểm — không xoá được | B | hỏi "Xoá MTn và n ô điểm?"; điểm cất (`catDiemO`), Khôi phục trả lại · HT · không |
| fasttrack/attempts.ts:1620 | POST /attempts/:id/xoa | MTn đã làm bài — không xoá được | A | đã làm bài chưa có điểm: không mất gì → cho xoá, Khôi phục được · HT · không |
| fasttrack/attempts.ts:1616 | POST /attempts/:id/xoa | MTn đã huỷ | A | lượt huỷ (cũ): Xoá = đi thẳng tới "Đã xoá" · HT · không |
| fasttrack/attempts.ts:1635 | POST /attempts/:id/dua-lai-ca-luot (Khôi phục MT) | đã huỷ — mở lại lượt trước | A | gộp: Khôi phục = mở lại lượt + đưa kỹ năng về, một tx · HT · không |
| fasttrack/attempts.ts:1481 | POST /attempts/:id/week (dời cả đợt) | Lượt đã huỷ. Mở lại trước | A | tự mở lại rồi dời (xác nhận) · LS · không |
| fasttrack/attempts.ts:1489 | POST /attempts/:id/week | Không kỹ năng nào còn đổi được tuần | A? | bỏ qua kỹ năng huỷ trái N38 L5 (chọn tuần = xếp lại, kể cả đã huỷ) — gồm cả kỹ năng huỷ · LS · không |
| fasttrack/attempts.ts:1779 | POST /attempts/:id/cancel (lớp thường / API) | Đợt hoàn tất — chỉ QL huỷ lượt có điểm | ? | 403 theo thời gian cho GVCN (công tắc) dù luật 3 LUAT-34 bỏ khoá "Đủ điểm" — đề xuất bỏ · HT · không |
| fasttrack/attempts.ts:1827 | POST /attempts/:id/reopen | Đã xếp MTn mới — Huỷ MTn mới trước | A? | "phải … trước"; đề xuất khôi phục thành số MT kế tiếp (hoặc hỏi gộp vào MTn mới) · HT · không |
| fasttrack/attempts.ts:1840 | POST /attempts/:id/reopen (lớp thường) | Lớp đã kết thúc — không khôi phục | C? Q-B1 | Q-B1 lớp kết thúc; lời 07/11 mới hơn → QL khôi phục được, ghi LS · HT · không |
| fasttrack/attempts.ts:1843 | POST /attempts/:id/reopen (lớp thường) | Em lưu trữ — bỏ lưu trữ trước | C? Q-B1 | Q-B1 hồ sơ Lưu trữ; đề xuất khôi phục bài mà không bắt Quay lại học · HT · không |
| fasttrack/attempts.ts:1847 | POST /attempts/:id/reopen (lớp thường) | Em không còn học lớp đó | A? | bài lớp cũ vẫn là lịch sử thật — cho khôi phục (bài lớp cũ, chỉ đọc ở danh sách hiện tại) · HT · không |
| fasttrack/attempts.ts:1851 | POST /attempts/:id/reopen (lớp thường) | Em đã có bài cùng loại khác | D | hai bài cùng loại đang mở = trùng · — · không |
| fasttrack/attempts.ts:2200 | PUT /attempts/:id/scores/:skill (nhập điểm) | Lượt đã huỷ, không nhập điểm | A | hỏi "Khôi phục MTn và lưu điểm?" rồi đi thẳng · HT · không |
| normal/regular.ts:648 | PUT /regular/attempts/:id/scores/:skill | Lượt đã huỷ, không nhập điểm | A | như trên (lớp thường) · HT · không |
| normal/regular.ts:807 | gõ "-" lớp thường | Lượt đã huỷ, không ghi "-" | A | như trên · HT · không |
| fasttrack/attempts.ts:2204 | PUT /attempts/:id/scores/:skill (+ dán Excel luuLo, khôi phục điểm) | Em đã lưu trữ — Quay lại học trước | C? Q-B1 | đúng lời chủ SP 07/11 "học xong sửa điểm không được" — đề xuất mở cho người có quyền ô, ghi LS · LS · không |
| fasttrack/attempts.ts:2152 | PUT /attempts/:id/scores/speaking/phu-trach | Em đã lưu trữ (ngungHocCua) | C? Q-B1 | như trên · LS · không |
| fasttrack/attempts.ts:2221 → hoanTat.ts:130 | PUT /attempts/:id/scores/:skill · regular.ts:667 | Lớp đã kết thúc — chỉ QL sửa điểm | C? Q-B1 | Q-B1 ①; câu ở hoanTat.ts (khu khác) — đề xuất GV đúng môn sửa được, ghi LS · LS · không |
| fasttrack/attempts.ts:2219 · normal/regular.ts:665,812 · fasttrack/absence.ts:737 → hoanTat.ts:146 | gõ "-" / gỡ "-" / Báo vắng khi lớp đã kết thúc | Lớp đã kết thúc — không ghi vắng | A? | kể cả QL, kể cả GỠ "-" sai; đề xuất "-" = Không dự thi (không dời), gỡ luôn được · LS · không |
| normal/regular.ts:733 | QL sửa điểm lớp đã kết thúc | Lớp đã kết thúc — ghi lý do | ? | lý do bắt buộc theo trạng thái; T7 đã cho lý do tuỳ chọn mọi nơi khác · LS · không |
| fasttrack/attempts.ts:2265 | PUT /attempts/:id/scores/:skill | Kỹ năng đã huỷ — Khôi phục + đặt tuần trước | A | nhập điểm vào kỹ năng huỷ (vắng 2 lần) = tự đưa về "đã thi" tuần đang giữ, LS · LS · không |
| fasttrack/attempts.ts:2268 | PUT /attempts/:id/scores/:skill | Đang ghi vắng — sửa trạng thái trước | A | nhập điểm = tự đổi `sit_status` sang đã thi, ghi LS · LS · không |
| fasttrack/attempts.ts:2254 | PUT /attempts/:id/scores/:skill | Kỹ năng không trong phạm vi đợt | A? | kỹ năng "Bỏ khỏi đợt" (không phải môn không học) → nhập điểm = đưa lại vào đợt, xác nhận · HT · không |
| normal/regular.ts:836 | gõ "-" lớp thường | Kỹ năng không trong phạm vi bài | A? | như trên · HT · không |
| fasttrack/skillSchedule.ts:1185 | setSitStatus (nội bộ / thi lại) | Kỹ năng không trong phạm vi | A? | như trên · LS · không |
| fasttrack/attempts.ts:2256 | PUT /attempts/:id/scores/:skill | Em không học W1/W2 — ô không nhập | C N13 | môn đăng ký N13/P8 · — · không |
| fasttrack/attempts.ts:2319 | gõ "-" ô đã có điểm (FT) | Ô đã có điểm — "-" không xoá điểm | B | hỏi "Xoá điểm và ghi vắng?"; điểm cất, Khôi phục điểm · HT · không |
| normal/regular.ts:846 | gõ "-" ô đã có điểm (lớp thường) | Ô đã có điểm — "-" không xoá điểm | B | như trên · HT · không |
| fasttrack/absence.ts:756 | POST /attempts/:id/skills/:skill/bao-vang | Đã có điểm — không báo vắng | B | như trên · HT · không |
| fasttrack/attempts.ts:2324 · normal/regular.ts:853 | gõ "-" khi chưa có tuần | Chưa có tuần Test — chưa ghi "-" | D | vắng phải gắn một tuần thi · — · không |
| fasttrack/skillSchedule.ts:1187 | setSitStatus vắng | Đã có điểm — không xác nhận vắng | D | vắng + có điểm mâu thuẫn · — · không |
| fasttrack/skillSchedule.ts:1190 | setSitStatus | Chưa có tuần — chưa xác nhận | D | như trên · — · không |
| fasttrack/skillSchedule.ts:1053 (kiemDaToiTuanThi; saveScore + saveRegularScore) | nhập điểm tuần chưa tới | Chưa tới tuần Test — chưa nhập điểm | B? | T19 (06/10) không có số 1.6; em thi sớm thật → hỏi "Dời về tuần này và lưu?" · LS · không |
| fasttrack/skillSchedule.ts:1052 | nhập điểm kỹ năng chưa xếp tuần | Chưa xếp tuần — chưa nhập điểm | A? | nhập = tự xếp tuần này (ghi LS) · LS · không |
| fasttrack/attempts.ts:2337 | gõ "-" FT trước tuần thi | Chưa tới tuần — dùng Dời lịch | B? | hỏi "Em vắng sớm? Dời sang tuần sau tuần thi" · LS · không |
| normal/regular.ts:871 | gõ "-" lớp thường trước tuần thi | Chưa tới tuần — chưa ghi "-" | B? | như trên · LS · không |
| fasttrack/absence.ts:746 | Báo vắng trước tuần thi | Chưa tới tuần — muốn đổi thì Dời | B? | như trên · LS · không |
| cham/sExpert.ts:118 | POST/PUT /s-expert (điểm) | Chưa tới tuần S Expert — chưa nhập | B? | hỏi dời lượt về tuần này rồi lưu · LS · không |
| cham/sExpert.ts:136 | POST /s-expert | Không có lớp đang học — xếp lớp trước | A? | em tạm dừng vẫn có lượt riêng (N10); lấy lớp gần nhất làm phạm vi · LS+xoá mềm · không |
| fasttrack/absence.ts:739 | POST …/bao-vang | Đợt này đã huỷ | A | như lượt huỷ chung · LS · không |
| fasttrack/absence.ts:743 | POST …/bao-vang | Không còn chờ làm bài — không báo vắng | A? | `sat` chưa điểm (đã xác nhận làm bài nhầm) → cho báo vắng, đổi trạng thái, LS · LS · không |
| fasttrack/absence.ts:642 (duocGoDau; saveScore noShow=false) | gỡ "-" sau vắng 2 lần (GV/GVCN) | Đã huỷ vắng 2 lần — QL chọn tuần | A | GV/GVCN gỡ "-" mọi lúc (OV-13h) — gỡ luôn được, trả về như trước gõ, LS · LS · không |
| fasttrack/absence.ts:261 | decideAbsenceMove (thẻ cũ, gọi từ duyệt) | MT cũ không vào luồng vắng | A? | thẻ cũ treo trên MT cũ: cho từ chối/đóng thẻ · LS · không |
| fasttrack/absence.ts:265 | decideAbsenceMove | Lượt đã huỷ — đề nghị hết hiệu lực | A? | cho đóng thẻ (rút) thay vì 400 · LS · không |
| fasttrack/absence.ts:305 | decideAbsenceMove duyệt | Tuần đã bắt đầu — chọn tuần chưa tới | A | QL xếp được tuần này/tuần qua ở mọi đường khác (T21) — bỏ · LS · không |
| fasttrack/absence.ts:263 | decideAbsenceMove | Đề nghị đã xử lý | D | hai người cùng duyệt · — · không |
| fasttrack/absence.ts:437 | POST …/skills/:skill/restore (lớp thường) | Đang có lịch hẹn — dùng đổi lịch thường | A? | chỉ đường; làm luôn việc đổi tuần · LS · không |
| fasttrack/skillSchedule.ts:814 | POST /attempts/:id/bo-tuan (Huỷ lịch) | {nhan} đã huỷ | A | như lượt huỷ chung · LS · không |
| fasttrack/skillSchedule.ts:816 | POST /attempts/:id/bo-tuan | Đã có điểm — không huỷ lịch | A | code chỉ bỏ tuần kỹ năng chưa thi — chặn cả lượt vô lý; bỏ tuần phần chưa thi, giữ phần có điểm · LS · không |
| fasttrack/skillSchedule.ts:817 | POST /attempts/:id/bo-tuan | Đã làm bài — không huỷ lịch | A | như trên · LS · không |
| fasttrack/skillSchedule.ts:819 | POST /attempts/:id/bo-tuan | Đang có đề nghị dời — duyệt trước | A | rút thẻ tự động như N38 L5 (`rutDeNghiDoi`) · LS · không |
| fasttrack/skillSchedule.ts:942 | POST /attempts/:id/skills/:skill/week · /ke-hoach-test/dot | Đợt đã huỷ. Mở lại trước | A | như lượt huỷ chung · LS · không |
| fasttrack/skillSchedule.ts:943 | POST …/skills/:skill/week | Kỹ năng không trong phạm vi đợt | A? | chọn tuần = đưa lại vào đợt (N38 L5); luuDot làm được, đường lẻ thì không · LS · không |
| fasttrack/skillSchedule.ts:999 | POST …/skills/:skill/week (lớp thường) | Đã huỷ — Khôi phục và đặt tuần trước | A | luuDot đã gộp (keHoachTest.ts:676) — làm y vậy ở đường lẻ · LS · không |
| fasttrack/skillSchedule.ts:993 | dời lớp thường khi có thẻ dời chờ | Đang có đề nghị dời chờ QL | D | tránh dời hai lần (thẻ cũ); có thể rút thẻ tự động · LS · không |
| fasttrack/skillSchedule.ts:1121 | POST /attempts/:id/skills/:skill/skip (lớp thường) | Lớp thường luôn đủ bốn môn | ? | không có số 1.6 (N13/N22④ môn đăng ký chỉ FT); hỏi PTA · LS · không |
| fasttrack/skillSchedule.ts:1125 | POST …/skip có điểm | Đã có điểm — Xoá cả điểm? (409) | B | đã là xác nhận (web gửi `xoaDiem`) — đúng luật · HT · không |
| fasttrack/ketQuaHuy.ts:71 | POST …/skills/:skill/khoi-phuc-diem | Đã có điểm mới — không khôi phục cũ | B | hỏi "Thay điểm mới bằng điểm cũ?"; điểm mới cất · HT · không |
| fasttrack/ketQuaHuy.ts:117 | POST /attempts/:id/khoi-phuc-ket-qua | Đã có điểm mới — không khôi phục | B | như trên · HT · không |
| fasttrack/ketQuaHuy.ts:113 | POST /attempts/:id/khoi-phuc-ket-qua | Đã huỷ — mở lại lượt trước | A | như lượt huỷ chung · HT · không |
| fasttrack/ketQuaHuy.ts:127 | POST /attempts/:id/khoi-phuc-ket-qua | Kỹ năng đã huỷ — không khôi phục | A | khôi phục = đưa kỹ năng về (xếp lại) · HT · không |
| fasttrack/ketQuaHuy.ts:131 | POST /attempts/:id/khoi-phuc-ket-qua | Vướng thứ tự — Dời lượt trước rồi khôi phục | A | như reopenAttempt (MTG-3c): kỹ năng vướng về "Chưa xếp", điểm vẫn về · HT · không |
| keHoach/keHoachTest.ts:695 | POST /ke-hoach-test/thi-lai | Chỉ thi lại ở lượt Mock đang chạy (MT cũ / huỷ) | A? | MT cũ cho thi lại được (điểm cũ giữ LS) · LS · không |
| keHoach/keHoachTest.ts:699 · :1156 | thi lại / hàng loạt thi lại | Thi lại: chọn tuần từ tuần này | A? | QL ghi bù buổi thi lại đã diễn ra → cho tuần đã qua (như T4) · LS · không |
| keHoach/keHoachTest.ts:705 | POST /ke-hoach-test/thi-lai | Chưa có điểm — dùng "Xếp lại bài vắng" | A? | chỉ đường tới nút đã gỡ (N38); chưa có điểm = Dời luôn · LS · không |
| shared/domain/keHoachTest.ts:263 (qua keHoachTest.ts:1126) | POST /ke-hoach-test/hang-loat | Còn chờ QL duyệt dời — trả lời trước | A | rút thẻ cũ tự động như L5 · LS · không |
| keHoach/keHoachTest.ts:800 · :1108 · attempts.ts:1371 · keHoachTest.ts:971 | xếp MT / hàng loạt / Checkpoint | Chưa có lộ trình đang chạy | D | không có lộ trình thì không có chỗ gắn MT · — · không |
| keHoach/keHoachTest.ts:963 | xếp mới lớp thường | HV không thuộc lớp này | D | bài phải gắn lớp em đang học · — · không |
| normal/regular.ts:335 · :337 | POST /regular/classes/:classId/plan | Chưa có ngày khai giảng / chưa khai báo mốc | D | thiếu dữ liệu nền để tính tuần · — · không |
| normal/regular.ts:618 | xếp tay Checkpoint n | Em đã có bài số n | D | trùng số lượt (UNIQUE) · — · không |
| cham/luuLo.ts:82 | POST /attempts/scores/lo · /regular/scores/lo | Dòng không thuộc lớp/lượt đang mở | D | dán nhầm bảng → ghi sai em · — · không |
| fasttrack/attempts.ts:2149 | PUT …/scores/speaking/phu-trach | Lượt này đã huỷ | A? | nhận xét không đổi điểm — cho lưu (hoặc đi cùng Khôi phục) · LS · không |
| fasttrack/attempts.ts:2163 | PUT …/scores/speaking/phu-trach | Chưa có điểm — chờ người chấm | A? | GV phụ trách ghi nhận xét trước được; N8 ③ không đòi điểm trước · LS · không |
| fasttrack/absence.ts:310 · :444 | duyệt thẻ dời / restore (lớp thường) | blockers thứ tự đợt | C N9 / ? | xem dòng `checkWeekVsNeighbours` · LS · không |
| fasttrack/skillSchedule.ts:980 · keHoachTest.ts:658,810,973,985,1141 | dời/xếp một kỹ năng, hộp đợt, xếp mới, hàng loạt | blockers thứ tự đợt | C N9 / ? | như trên (MT0↔MT1 = N9; lớp thường = ?) · LS · không |

---

## Rà chặn cứng — MÁY CHỦ Case · PA · Tutor

**84 dòng: A 6 · A? 11 · B 14 · C 5 (N3 1 · N37 2 · N8 ④ 2) · C? Q-B1 8 · D 24 · D? 7 · ? 9**

Phạm vi đã đọc: `server/src/cases/*` (chỉ cases.ts, sosAuto.ts, doiPa.ts, owner.ts, planRevisions.ts, nguoiThucHien.ts, taoPa.ts có throw; sos/sosState/boTro/signals/effectiveness/systemClose/caseLop/giuKetQua/nguyenNhanO không có), `server/src/tutors/*`, `shared/domain` hàm gọi tới (`sosV4.chanHoanThanh`, `hoanTac.duocHoanTacPa`, `quanLyHocVien.CAU_LUU_TRU`, `paDongBo.kiemSoBuoiPa / kiemBuoiTutor / kiemSoBuoiTuan`). Không có tệp HOTFIX trong khu này (dòng 5 liên quan `students.ts` HOTFIX).
Bỏ qua theo tiêu chí: 403, 404, kiểm nhập (độ dài, thang, trống, sai loại, "không đổi gì"), no-op ("chưa hoàn thành" khi Mở lại, "đã xác nhận rồi"), `setDisposition` (không có đường API).
`CAU_LUU_TRU` = "Đã lưu trữ — Quay lại học trước rồi sửa." · `duocHoanTacPa` = 10 s + 5 s mạng.

| tệp:dòng | thao tác (đường API / nút) | câu chặn (rút gọn) | loại | đề xuất mở / lý do giữ · lịch sử/hoàn tác · HOTFIX |
|---|---|---|---|---|
| cases.ts:211 → sosV4.ts:184 | POST /cases/:id/outcome (Hoàn thành Case) | Case chưa có phương án nào — chưa có gì để kết luận | A? | Cho Hoàn thành, kết luận ≥ 10 ký tự là đủ · có Mở lại Case |
| cases.ts:211 → sosV4.ts:186 | Hoàn thành Case | n phương án đang chờ Quản lý duyệt | B | Hỏi "n PA chờ duyệt sẽ huỷ, thẻ tự đóng" rồi đóng · có Mở lại |
| cases.ts:211 → sosV4.ts:188 | Hoàn thành Case | n phương án chưa cập nhật kết quả cuối | B | Hỏi, PA chạy tự kết thúc "Dừng — Case hoàn thành"; Mở lại hiện KHÔNG trả PA → cần chụp |
| cases.ts:211 → sosV4.ts:189 (`an`: ẨN nút) | Hoàn thành Case | Hoàn thành được sau khi PA theo quy chế kết thúc (mốc) | ? | Quy chế SOS K3 §4a, không có trong N1–N39; đề xuất B: hỏi + tự Kết thúc sớm PA quy chế |
| cases.ts:295 → 336 | POST /cases/:id/mo-lai | Case do hệ thống đóng — không mở lại được | A | Cho người có quyền mở lại tay, PA huỷ hệ thống mở theo chụp · chỉ mở qua Hoàn tác Kết thúc học / Quay lại học (students.ts HOTFIX) |
| cases.ts:339 | Mở lại Case | Đã có Case {kỹ năng} mới — mở Case đó | D | Trùng Case đang mở cùng khoá; câu chỉ Case kia |
| cases.ts:551 | POST /cases/report (+ Case) | CAU_LUU_TRU | C? Q-B1 | Hồ sơ Lưu trữ khoá; đề xuất cho tạo Case (vd Ý thức sau Kết thúc học) không cần Quay lại học |
| cases.ts:1925 | POST /cases/backfill (Nhập bù) | CAU_LUU_TRU | C? Q-B1 | Case nhập bù đóng ngay, không đổi trạng thái em → nên cho |
| cases.ts:657 | + Case | {kỹ năng} đang có Case chờ mô tả / xác nhận — mở Case | D | Trùng Case đang mở; trả id để mở thẳng |
| cases.ts:668 | + Case | Đang có case "…" chưa xử lý xong ở hạng mục | B | Đã là hộp hỏi Ghi vào / Mở riêng — giữ |
| cases.ts:1985 | Nhập bù | Đã có Case nhập bù trùng khoảng — cùng một lần? | B | Đã là hỏi (`confirmDuplicate`) — giữ |
| cases.ts:953 | POST /cases/:id/interventions (+ PA) | Case tạm — lượt Mock chưa chốt SOS | C N8 ④ | SOS tạm: không Case, không việc |
| cases.ts:956 | + PA | Case đang chờ QL duyệt "Không cần theo dõi" — chờ rồi thêm | B | Hỏi "thêm PA sẽ rút thẻ Không cần theo dõi" rồi thêm |
| cases.ts:1037 | + PA | Việc đã xong rồi thì không còn gì để duyệt | D | Mâu thuẫn dữ liệu (đã xong + cần duyệt) |
| cases.ts:1172 | Duyệt / Từ chối PA (hộp Chờ duyệt) | PA đã huỷ hoặc Case đã đóng — không còn gì để duyệt | D | Duyệt PA huỷ làm PA sống lại sai (K5-58) |
| cases.ts:1179 | Duyệt / Từ chối PA đã quyết | Đã được duyệt / đã bị từ chối — GV đề xuất lại | A | QL đổi thẳng quyết định, lý do cũ giữ ở nhật ký · Huỷ quyết định chỉ trong ngày (duyet/yeuCau.ts:710, khu Duyệt) |
| cases.ts:1254 | Huỷ quyết định PA (hộp Duyệt) | Case đã đóng — không huỷ quyết định được | C? Q-B1 | Đề xuất tự Mở lại Case cùng thao tác, hỏi xác nhận |
| cases.ts:1256 (+ loaiYeuCau.ts:156) | Huỷ quyết định PA | PA đã có kết quả — không huỷ quyết định được | A? | Đi thẳng: đổi sang Từ chối / dừng PA, giữ kết quả + lịch sử; hỏi nêu n kết quả |
| cases.ts:1301, 1307 (`cachXoaCase/Pa`) | DELETE /cases/:id · /interventions/:id · /followups/:id | Case hệ thống / PA quy chế → thẻ xin xoá | C N37 | Giữ; QL xoá ngay · Thùng rác + Khôi phục |
| cases.ts:1317 · sosAuto.ts:741, 758 | Xin xoá · Không cần theo dõi | Đã gửi … — đang chờ duyệt | D | Trùng thẻ đang chờ |
| cases.ts:1362 | PATCH /cases/:id (Sửa Case) | Case đã hoàn thành — Mở lại trước khi sửa | C? Q-B1 | Đề xuất cho sửa tên / mô tả / nhóm Case xong (đã có `sos_case_history`), không đổi trạng thái |
| cases.ts:1366 | Sửa Case | Case chưa xác nhận — Xác nhận Case trước | A? | Sửa Case SOS chưa xác nhận = lưu như Xác nhận Case (gộp) |
| cases.ts:1395 | Sửa Case đổi kỹ năng | Case từ kết quả Test — không đổi kỹ năng | D | Kỹ năng gắn ô điểm bài Test |
| cases.ts:1396 | Sửa Case đổi kỹ năng | Case đã có PA — không đổi kỹ năng | A? | Cho đổi, PA đi theo; hỏi nêu n PA · lịch sử có |
| cases.ts:1401 | Sửa Case đổi kỹ năng | Đã có Case {kỹ năng} đang mở | D | Trùng khoá Case đang mở |
| cases.ts:1420 | Sửa Case | 409 Case vừa được cập nhật lúc … | D | Xung đột phiên bản; bấm Lưu lần nữa ghi đè |
| cases.ts:1452 | POST /cases/:id/xac-nhan-s | Case không có nhận xét S chấm chéo chờ xác nhận (cả Case đóng) | D | Không còn việc; sửa mô tả theo dòng 1362 |
| cases.ts:1469 | Xác nhận Case S | Nhận xét S chấm chéo đã được xác nhận | D | Hai người bấm cùng lúc |
| cases.ts:1523, 1525 | POST /cases/:id/hoan-tac-xac-nhan-s | Case đã đóng — Mở lại trước / PA đổi sau | D? | Cửa sổ Hoàn tác 10 s, chống đè thay đổi sau; đường thay Sửa Case |
| cases.ts:1665 | POST /interventions/:id/ket-thuc | Case đã hoàn thành — không còn PA để kết thúc | D | PA đã khép khi Case xong |
| cases.ts:1666 → 4683 | Kết thúc PA quy chế | PA quy chế chưa xác nhận — chưa chạy thì chưa có gì để kết thúc | ? | GVCN / QL bỏ PA chưa chạy: đề xuất cho Kết thúc thẳng có lý do (khỏi xin xoá N37) |
| cases.ts:1723 | POST /interventions/:id/hoan-tac-ket-thuc (Mở lại PA) | Case đã hoàn thành — Mở lại Case trước khi mở lại PA | C? Q-B1 | Đề xuất tự Mở lại Case cùng lúc, hỏi · `daoLai` (ghiDao) còn 409 khi có thay đổi sau |
| cases.ts:1801 | DELETE /followups/:id (Xoá kết quả PA) | Kết quả đang chờ QL trả lời — rút thẻ trước khi xoá | B | Hỏi "thẻ chờ sẽ rút" rồi xoá · Thùng rác có |
| cases.ts:1806 | Xoá kết quả gần nhất | Case đã hoàn thành — Mở lại Case trước | C? Q-B1 | Tự Mở lại Case khi đảo PA, hỏi xác nhận |
| cases.ts:1807 | Xoá kết quả | Lần ghi đã Thay PA — dùng Sửa kết quả | B | Xoá kèm gỡ Thay PA (PA mới vào Thùng rác), hỏi |
| cases.ts:1808 | Xoá kết quả | Lần ghi có Mini Test — dùng Sửa kết quả | B | Xoá kèm Mini Test về "chưa ghi", hỏi |
| cases.ts:1811 | Xoá kết quả | Kết quả chung nhóm bổ trợ — dùng Sửa kết quả | B | Hỏi "xoá cho cả n em của nhóm" |
| cases.ts:1814 | Xoá kết quả | PA đang chờ QL trả lời — rút thẻ trước | B | Như dòng 1801 |
| cases.ts:1867 | POST /interventions/:id/hoan-tac-them | PA do hệ thống tạo — không hoàn tác được | C N37 | PA quy chế: xoá qua QL duyệt |
| cases.ts:1868, 1872, 1874, 1876 | Hoàn tác thêm PA | Quá thời gian / PA có kết quả / QL đã trả lời / đề xuất thay PA | D? | Cửa sổ 10 s; đường thay Xoá PA (N37, Thùng rác) / Rút thẻ — không kẹt |
| cases.ts:2051 | POST /cases/:id/followups (Xem lại) | PA điền sẵn chưa xác nhận — xác nhận trước | ? | Như dòng 4683 |
| cases.ts:3949 | POST /interventions/:id/result (Ghi KQ) | PA quy chế — không thay, không kết thúc sớm | ? | T22 / K3-12, không có trong N1–N39; GVCN / QL có nút Kết thúc sớm, GV môn kẹt → hỏi PTA |
| cases.ts:3968 | Ghi KQ: Kết thúc + Chưa đủ dữ liệu | Chưa đủ dữ liệu thì chưa kết thúc PA được | A? | Cho Kết thúc kèm Lý do (như lần ghi cuối), không tính hiệu quả |
| cases.ts:3972 | Ghi KQ: Kết thúc khi KQ chưa tốt | Kết quả "…" chỉ kết thúc bằng Thay PA · Xin hỗ trợ | A? | Cho Kết thúc kèm Lý do (rulebook §5 / PR-S2 Q2 — hỏi PTA) |
| cases.ts:4013, 4014 | Ghi KQ + Đề xuất PA khác | Lần ghi cuối không đề xuất / chỉ đi cùng Giữ nguyên | D | Mâu thuẫn: PA khép thì không còn gì để đổi |
| cases.ts:4683 (`chanPaChuaChay`) | Ghi KQ · Sửa PA (PATCH /interventions/:id) | PA điền sẵn chưa được xác nhận — xác nhận trước | ? | Đề xuất: Ghi KQ / Sửa PA lần đầu = Xác nhận PA (cùng form) |
| cases.ts:4684 | Ghi KQ · Sửa PA | PA đang chờ QL duyệt — chưa bắt đầu | C N3 | Giữ bước duyệt bắt buộc (Sửa chữ PA chờ duyệt có thể mở — hỏi PTA) |
| cases.ts:4685 | Ghi KQ · Sửa PA | Phương án này đã huỷ | D? | PA huỷ (QL từ chối, Không theo dõi…) không chạy; Sửa chữ có thể mở |
| cases.ts:4686 | Ghi KQ · Sửa PA | PA đã kết thúc — không cập nhật thêm được | A | Sửa PA: cho (đã có `ghiBanDieuChinh`); Ghi KQ: hỏi "Mở lại PA?" rồi ghi |
| cases.ts:4296, 4309 | POST /followups/:id/sua · GET sửa · Hoàn tác KQ | Chỉ sửa được lần ghi gần nhất của PA | A | Sửa CHỮ mọi lần ghi (không đảo); đổi lựa chọn chỉ lần gần nhất · audit có |
| cases.ts:4323 | Sửa / Hoàn tác KQ PA | Case đã hoàn thành — bấm Mở lại trước khi sửa kết quả | C? Q-B1 | Khoá ③ Q-B1; đề xuất sửa chữ không cần Mở lại, đổi lựa chọn → tự Mở lại kèm hỏi |
| cases.ts:4326 | Sửa KQ | PA đã huỷ / đã đổi trạng thái — không sửa được nữa | A? | Cho sửa chữ (không đảo hệ quả) |
| cases.ts:4335 (qua 4377, 4425) | Sửa / Hoàn tác KQ đổi lựa chọn | PA thay thế đã có kết quả — nhờ QL xoá PA mới trước | B | Hỏi "PA mới + n kết quả vào Thùng rác" rồi đảo |
| cases.ts:4337 | Sửa / Hoàn tác KQ | QL đã duyệt / từ chối PA thay thế — chỉ sửa chữ | B | Hỏi, PA mới vào Thùng rác, lịch sử ghi |
| cases.ts:4347 | Sửa KQ Xin hỗ trợ | QL đã trả lời câu hỏi — chỉ sửa chữ | A? | Đổi lựa chọn được; câu trả lời QL giữ ở lịch sử thẻ |
| cases.ts:4422 | POST /followups/:id/hoan-tac | QL đã duyệt đổi PA — không hoàn tác được | D? | Đường thay: Huỷ quyết định ở hộp Duyệt / Sửa KQ |
| cases.ts:4522 | Sửa chữ KQ | QL đã trả lời — không sửa được câu hỏi | D | Câu hỏi đã có câu trả lời, sửa làm lệch |
| cases.ts:4615 | PATCH /followups/:id (Sửa Xem lại) | Case đã hoàn thành — bấm Mở lại trước khi sửa | C? Q-B1 | Sửa chữ, không hệ quả → nên cho |
| cases.ts:4617 | Sửa Xem lại | Chỉ sửa được lần xem lại gần nhất | A | Không có hệ quả đảo → sửa mọi lần · audit có |
| cases.ts:4718, 4740 | PATCH /interventions/:id (Sửa PA) | PA đã có Kết quả — không đổi Ngày bắt đầu | A? | Cho đổi; kỳ đã ghi giữ, chỉ tính lại hạn kỳ tới (hỏi) |
| cases.ts:186, 580, 1016, 1931, 1941, 3937, 3979, 4624 | Hoàn thành · + Case · + PA · Nhập bù · Ghi KQ · Sửa Xem lại | Không ghi được ngày … ở tương lai | D | Dữ liệu không thể đúng |
| shared/domain/paDongBo.ts:35 (`kiemSoBuoiPa`) | Sửa PA · Điều chỉnh · Xác nhận PA | Đã dạy n buổi — Số buổi từ n trở lên | D | Tổng buổi < đã dạy là sai |
| sosAuto.ts:236 | POST /cases/:id/xac-nhan | Case này đã đóng rồi | D | Không còn việc xác nhận (sửa mô tả: dòng 1362) |
| sosAuto.ts:239 | Xác nhận Case | Đang chờ QL duyệt "Không cần theo dõi" — chờ trả lời | B | Xác nhận = rút thẻ, hỏi |
| sosAuto.ts:481 | POST /interventions/:id/xac-nhan-pa (+ lô) | Case đã đóng — không còn xác nhận PA được | D | PA đã khép cùng Case |
| sosAuto.ts:485 | Xác nhận PA | Xác nhận Case / ghi Mô tả Case trước | ? | Gộp ô mô tả vào hộp Xác nhận PA (N8 ⑤ chỉ bắt có mô tả) |
| sosAuto.ts:486 | Xác nhận PA | Đang chờ QL duyệt "Không cần theo dõi" | B | Xác nhận = rút thẻ, hỏi |
| sosAuto.ts:541 | Xác nhận PA (ngày bắt đầu) | Chỉ lùi tối đa 7 ngày, tới tối đa 30 ngày | A? | Cho lùi xa — hạn kỳ đầu đã kẹp ≥ hôm nay |
| sosAuto.ts:617, 618, 621 | Hoàn tác xác nhận PA / lô / Case / Case S | Không còn hoàn tác được / quá thời gian / ghi trước khi có Hoàn tác | D? | Cửa sổ 10 s; câu nêu bước kế "Sửa PA / Case" |
| sosAuto.ts:657, 658, 699, 702, 706 | Hoàn tác xác nhận | Case đã đóng / PA có kết quả / PA đổi sau | D? | Chống đè thay đổi sau; đường thay Sửa |
| sosAuto.ts:736 | POST /cases/:id/dismiss | Case này đã đóng rồi | D | Không còn gì để bỏ theo dõi |
| sosAuto.ts:750 | Không cần theo dõi | Đã có PA xác nhận / đang chạy — kết thúc bằng Hoàn thành Case | ? | Hoàn thành có thể bị sosV4:189 chặn → GV môn kẹt; đề xuất cho gửi, duyệt thì PA chạy kết thúc |
| sosAuto.ts:807 | QL duyệt "Không cần theo dõi" | Case này đã đóng rồi | D | Case đóng chen giữa lúc gửi và duyệt |
| doiPa.ts:34 | POST /interventions/:id/de-xuat-doi-pa | Case đã đóng — không đề xuất đổi PA | D | PA đã khép |
| doiPa.ts:36 | Đề xuất đổi PA | PA này đã kết thúc — không đổi được | D | Không còn PA chạy; dùng + PA |
| doiPa.ts:37 | Đề xuất đổi PA Bổ trợ | PA Bổ trợ chưa chạy — Xác nhận Case trước | ? | Thứ tự bước; đề xuất gộp |
| doiPa.ts:38 | Đề xuất đổi PA | Đang chờ QL duyệt đổi PA — Rút đề xuất cũ rồi gửi lại | D? | Trùng thẻ chờ; đề xuất gửi lại = thay thẻ cũ (A?) |
| doiPa.ts:39 | Đề xuất đổi PA chưa chạy | Ghi Mô tả Case (nguyên nhân) trước | ? | Thứ tự bước; đề xuất gộp |
| owner.ts:245 | POST /cases/:id/nguoi-phu-trach | Case đã đóng | A? | Không ảnh hưởng đầu ra; cho đổi + `sos_case_history` |
| owner.ts:246 | Đổi người phụ trách | Case tạm chưa là việc | C N8 ④ | SOS tạm không việc |
| owner.ts:247, 253, 400, 406 | Đổi người phụ trách · phân công GV | 409 người phụ trách / người thực hiện vừa đổi | D | Xung đột phiên bản |
| tutors/trang.ts:273 | POST/PATCH /tutors | SĐT đã có: {tên} | D | Trùng khoá duy nhất |
| tutors/trang.ts:288 | DELETE /tutors/:id | Tutor đã có buổi dạy — không xoá. Dùng "Ngừng hợp tác" | D | Buổi đã ghi trỏ tutor (lịch sử); có đường thay |
| tutors/trang.ts:330 | DELETE /tutors/nhan-xet/:id | Quá 24 giờ — không xoá được nữa | A | LUAT-34 cũ, không có trong N1–N39; cho xoá + nhật ký |

---

**Đếm:** A 8 · A? 5 · B 3 · C 2 · C? Q-B1 3 · ? 11 · D 43 (D? 2) — tổng 75 dòng. Khu: máy chủ `yThuc/*`, `duyet/*`, `worklist/*` (+ hàm chặn được gọi: `cases.ts` huỷ quyết định PA, `platform/week.ts` cửa sổ báo cáo). Không dòng nào HOTFIX.

| tệp:dòng | thao tác (đường API / nút) | câu chặn (rút gọn) | loại | đề xuất mở / lý do giữ · lịch sử/hoàn tác? · HOTFIX? |
|---|---|---|---|---|
| server/src/yThuc/violations.ts:76 | Ghi vi phạm (một em :264, lô :346 qua `chanGhiViPham`) | Em đang tạm dừng — Quay lại học trước | A | Ghi vào lớp đang tạm dừng (ghi danh `paused`) · xoá được qua Thùng rác N28 |
| server/src/yThuc/violations.ts:78 | Ghi vi phạm | Em đã học xong khoá — xếp lớp mới trước | A | Ghi vào lớp vừa học xong (ghi danh `completed`) · Thùng rác có |
| server/src/yThuc/violations.ts:77 | Ghi vi phạm | Em đã chuyển khỏi {lop} — ghi ở lớp đang học | A? | Chỉ rơi vào khi em KHÔNG có lớp đang học → ghi vào lớp gần nhất · Thùng rác có |
| server/src/yThuc/violations.ts:79 | Ghi vi phạm | Em đã thôi học — không ghi vi phạm mới | C? Q-B1 | Hồ sơ Lưu trữ khoá; đề xuất: QL ghi được vào lớp cuối · Thùng rác có |
| server/src/yThuc/violations.ts:75 | Ghi vi phạm | Em chưa xếp lớp — xếp lớp trước | D? | Vi phạm gắn lớp; em chưa từng có lớp. Mở được nếu cho `class_id` NULL |
| server/src/yThuc/xuLy.ts:97 (`khaiDuoc`) + lo.ts:83 (`lyDoCapBac`) | Xác nhận cấp bậc (link hồ sơ bị ẩn · lô lớp) | em đang Tạm dừng | A | API một em (`luuKhai`) không chặn — bỏ `!tamDung` ở hai hàm · có nhật ký + Hoàn tác lô |
| server/src/yThuc/xuLy.ts:618 (`requireSuaXuLy`) | Sửa vi phạm / sửa thông tin / Thu hồi lần xử lý | Lần xử lý đã thu hồi — chỉ xem | A? | Sửa lần đã thu hồi vô nghĩa, nhưng đảo thu hồi chỉ trong ngày (yeuCau.ts:712) → thêm "Khôi phục lần xử lý" cho QL mọi lúc · có nhật ký |
| server/src/yThuc/xuLy.ts:792 | Huỷ quyết định duyệt thu hồi (hộp Chờ duyệt) | Sau thu hồi đã khai cấp bậc — không huỷ | A? | Bậc = max(lần xử lý, bậc khai) nên không chồng sai → cho huỷ, ghi lịch sử |
| server/src/yThuc/xuLy.ts:701 (gọi từ :728) | Thu hồi lần xử lý (GVCN gửi / QL thẳng) | Đã có {X} sau lần này — thu hồi {X} trước | B | Cho thu hồi lần giữa; hộp xác nhận nêu "{X} vẫn giữ, bậc về …" · lịch sử thẻ + nhật ký có |
| server/src/yThuc/xuLy.ts:701 (gọi từ :771, :782) | QL Duyệt thẻ thu hồi · Huỷ quyết định thu hồi | Đã có {X} sau — thu hồi trước / không huỷ được | B | Như trên: xác nhận nêu lần sau, bậc tính lại · có nhật ký |
| server/src/yThuc/xuLy.ts:285 | Đã thực hiện (lần xử lý cần QL) | Chỉ lần QL đã duyệt mới bấm Đã thực hiện | C | N3 (giữ bước duyệt bắt buộc) · Chưa thực hiện đảo được |
| server/src/yThuc/xuLy.ts:710 (+:287 GVCN 403) | DELETE lần xử lý | Lần xử lý đã lưu không xoá được — Thu hồi | C | N5 (thu hồi + lý do, QL duyệt; giữ dòng) |
| server/src/yThuc/xuLy.ts:106 + lo.ts:76 | Ghi nhận (một em · lô) | Em đang bắt buộc xử lý — dùng Xác nhận xử lý | ? | Luật thang vi phạm (Rulebook), không có số ở 1.6 — PTA quyết; có đường Xác nhận xử lý |
| server/src/yThuc/xuLy.ts:226 + lo.ts:82 | Xác nhận cấp bậc | Chuỗi đã có lần xử lý trên web — không khai nữa | ? | Bậc = max nên khai thêm không hỏng số; cân nhắc mở (ít nhất cho QL) |
| server/src/yThuc/xuLy.ts:257 + lo.ts:81, :271 | Sửa / Hoàn tác cấp bậc đã khai | Đã có xử lý trên web — chỉ QL sửa | ? | GVCN có quyền Ý thức bị chặn theo trạng thái, QL làm được; đề xuất GVCN sửa + nhật ký |
| server/src/yThuc/xuLy.ts:287, :335 | Đã thực hiện · Sửa ngày thực hiện | Ngày thực hiện phải từ ngày QL duyệt | ? | Ngoài đời có thể làm trước khi QL bấm duyệt; đổi thành nhắc, không chặn |
| server/src/yThuc/lo.ts:68 (`lyDoXuLy`) | Xác nhận xử lý theo lô (tab Ý thức lớp) | Có đề xuất {nhan} chờ QL duyệt | ? | Lô loại cả em; một em lẻ vẫn xử lý vi phạm khác (chỉ trừ vi phạm đang chờ) — thống nhất |
| server/src/yThuc/xuLy.ts:63 (`viPhamChon`) | Xác nhận xử lý · Gửi QL · lô | Vi phạm đã xử lý hoặc đang chờ QL | D | Một vi phạm một lần xử lý — tránh đếm bậc hai lần |
| server/src/yThuc/xuLy.ts:185 | Xác nhận xử lý | Bậc đã đổi, mở lại panel (409) | D | Hai người bấm cùng lúc |
| server/src/yThuc/xuLy.ts:224 + lo.ts:80 | Xác nhận cấp bậc | Em chưa có lộ trình | D | Không có chuỗi để gắn bậc |
| server/src/yThuc/xuLy.ts:225 | Xác nhận cấp bậc | Chuỗi đã xác nhận — bấm Sửa | D | Trùng bản ghi; có nút Sửa |
| server/src/yThuc/xuLy.ts:255 + lo.ts:261, :269 | Hoàn tác cấp bậc (lô) | Bậc đã đổi sau lần lưu — không hoàn tác | D | Xung đột: không đè sửa của người khác |
| server/src/yThuc/xuLy.ts:296, :315, :756, :795, :833 | Đã thực hiện · Chưa thực hiện · Thu hồi · Huỷ thu hồi · Rút | Vừa được cập nhật — mở lại (409) | D | Xung đột phiên bản |
| server/src/yThuc/xuLy.ts:308 | Chưa thực hiện | Lần này chưa ghi Đã thực hiện | D | Không có gì để đảo |
| server/src/yThuc/xuLy.ts:309 | Chưa thực hiện | Không qua QL duyệt — sửa hoặc Thu hồi | D | Lần một bước không có trạng thái "đã duyệt" để về; Sửa / Thu hồi có |
| server/src/yThuc/xuLy.ts:332 | Sửa ngày / người / mô tả lần xử lý | Chỉ sửa lần đã thực hiện | D | Đề xuất chờ sửa ở thẻ; đã duyệt → Đã thực hiện |
| server/src/yThuc/xuLy.ts:567 | Gửi đề xuất QL | Đề xuất này đã gửi rồi | D | Gửi lặp |
| server/src/yThuc/xuLy.ts:577 | Gửi đề xuất "không tăng bậc" | Bậc đã đổi — mở lại | D | Bậc thay đổi giữa chừng |
| server/src/yThuc/xuLy.ts:617 | Sửa lần xử lý | Đề xuất chưa gửi — đóng panel để xoá nháp | D | Nháp nội bộ, đường xoá nháp riêng |
| server/src/yThuc/xuLy.ts:635, :640 | Sửa vi phạm của lần xử lý | Vi phạm thuộc em khác / lần xử lý khác | D | Đếm hai lần |
| server/src/yThuc/xuLy.ts:724 | Thu hồi | Đang chờ QL — Rút · bị từ chối — không cần | D | Đường khác / không tính bậc |
| server/src/yThuc/xuLy.ts:734 | Thu hồi (GVCN) | Đang chờ QL duyệt thu hồi | D | Trùng thẻ đang chờ |
| server/src/yThuc/xuLy.ts:770, :781, :809, :816, :847 | Duyệt / huỷ thu hồi · Rút / sửa đề xuất · xoá nháp | Không còn ở trạng thái … | D | Trạng thái đổi giữa chừng |
| server/src/yThuc/xuLy.ts:788 | Huỷ quyết định thu hồi | Vi phạm đã nằm trong lần khác | D? | Đếm hai lần; mở được: khôi phục lần cũ không kèm vi phạm đã dùng |
| server/src/yThuc/lo.ts:72 | Xác nhận xử lý theo lô | Chưa bắt buộc — dùng Ghi nhận | D | Chỉ đường, cùng bảng |
| server/src/yThuc/lo.ts:245 | Hoàn tác cấp bậc lô | Chỉ hoàn tác lần của chính bạn hôm nay | D | Chống xoá bậc người khác; sau đó Sửa cấp bậc thẳng được |
| server/src/yThuc/baoPhTvv.ts:212 | Ghi kết quả Báo PH | Việc đã kết thúc — chỉ xem | A | Ghi thẳng → việc tự mở lại / xong (không bắt Khôi phục trước) · lần ghi có lịch sử |
| server/src/yThuc/baoPhTvv.ts:214 (+:263, :315) | Ghi kết quả · Khôi phục · Sửa hạn Báo PH | Xử lý đã thu hồi / từ chối / rút — chỉ xem | ? | PH có thể đã được báo thật — cân nhắc cho ghi làm lịch sử; giữ nếu coi việc hết ý nghĩa |
| server/src/yThuc/baoPhTvv.ts:313 | Sửa hạn Báo PH | Việc đã kết thúc — không sửa hạn | ? | N34 ③ "đúng hạn" so hạn hiệu lực — việc xong không chỉnh được số đúng hạn; PTA quyết |
| server/src/yThuc/baoPhTvv.ts:234 | Bỏ việc Báo PH | Chỉ bỏ được việc đang mở | D | Việc xong không cần bỏ; đã bỏ thì thôi |
| server/src/yThuc/baoPhTvv.ts:240, :268, :302 | Bỏ · Khôi phục · Sửa hạn | Vừa được cập nhật / hạn vừa sửa (409) | D | Xung đột phiên bản |
| server/src/yThuc/baoPhTvv.ts:260 | Khôi phục Báo PH | Không ở trạng thái Đã bỏ | D | Không có gì để khôi phục |
| server/src/yThuc/baoPhTvv.ts:261 | Khôi phục Báo PH | Hệ thống đóng theo lần xử lý — không khôi phục tay | D | Đi theo lần xử lý; huỷ thu hồi tự mở lại |
| server/src/yThuc/phoiHop.ts:562 | Xác nhận việc Phối hợp | Việc đã bỏ — bấm Khôi phục trước | A | Xác nhận thẳng (tự khôi phục) · nhật ký có |
| server/src/yThuc/phoiHop.ts:595 | Bỏ việc Phối hợp | Chỉ bỏ việc Cần xử lý — đã xong không bỏ | A | Bỏ thẳng việc đã xong (khỏi "Đưa lại" trước) · bản ghi đảo + Khôi phục có |
| server/src/yThuc/phoiHop.ts:503 | Sửa hạn Meeting CX | Việc đã xong / bỏ — không sửa hạn | ? | Như baoPhTvv:313 |
| server/src/yThuc/phoiHop.ts:519 | Thêm việc Phối hợp | Lượt Mock đã huỷ | D | Lượt huỷ không còn SOS |
| server/src/yThuc/phoiHop.ts:531 | Thêm việc Phối hợp | Chỉ lượt FT có SOS | D | Không có SOS thì không có Phối hợp SOS |
| server/src/yThuc/phoiHop.ts:536 | Thêm việc Phối hợp | Việc đã có ở lượt này (kể cả đã bỏ) | D | Trùng; việc đã bỏ thì Khôi phục |
| server/src/yThuc/phoiHop.ts:613, :632 | Bỏ · Mở lại | Vừa cập nhật / đang Cần xử lý (409) | D | Xung đột / bấm hai lần |
| server/src/yThuc/phoiHop.ts:634 | Mở lại việc Phối hợp | Hệ thống bỏ theo điểm — không khôi phục tay | D | SOS đổi / lượt huỷ — mở lại sẽ lệch điểm |
| server/src/duyet/deXuatSua.ts:49 | Gửi đề xuất sửa thông tin HV | Học viên không còn đang học | C? Q-B1 | Hồ sơ Lưu trữ khoá; đề xuất: cho gửi (QL duyệt vẫn chặn sai) |
| server/src/duyet/deXuatSua.ts:50, :52 | Gửi đề xuất sửa (lớp · lịch MT) | Dùng Đề xuất chuyển lớp / Lịch Test do QL | D | Chỉ đường khác |
| server/src/duyet/deXuatSua.ts:61 | Gửi đề xuất sửa | Đã có đề xuất đang chờ — sửa thẻ cũ | D | Trùng thẻ chờ |
| server/src/duyet/deXuatSua.ts:91, :101 + loaiYeuCau.ts:310 | Gửi / Duyệt đổi Target · lộ trình | Em chưa / không còn lộ trình đang chạy | D | Không có lộ trình để đổi |
| server/src/duyet/yeuCau.ts:712 (`lyDoKhongHuy`) | Huỷ quyết định (hộp Chờ duyệt) | Chỉ huỷ được quyết định trong ngày | A | Bỏ giới hạn ngày; vẫn kiểm `chan` / dữ liệu sau · thẻ + nhật ký có |
| server/src/cases/cases.ts:1256 (gọi từ loaiYeuCau.ts:157, `huyDuoc` :160) | Huỷ quyết định Đề xuất PA | PA đã có kết quả — không huỷ | A | Huỷ quyết định giữ kết quả (lịch sử) hoặc cho QL quyết lại thẳng · khu Case |
| server/src/cases/cases.ts:1254 (gọi từ loaiYeuCau.ts:157, `huyDuoc` :160) | Huỷ quyết định Đề xuất PA | Case đã đóng — không huỷ | C? Q-B1 | Case xong phải "Mở lại"; đề xuất: huỷ tự mở lại Case · khu Case |
| server/src/duyet/loaiYeuCau.ts:450 | Huỷ quyết định "Không cần theo dõi" | Thẻ PA đã tự đóng — tạo Case mới | A? | Cho huỷ, mở lại Case; PA chờ không thẻ → tạo lại thẻ chờ · bản ghi đảo có |
| server/src/duyet/yeuCau.ts:709, :711 | Huỷ quyết định (Dời lịch Test, Duyệt chuyển lớp, Xin ý kiến, Báo QL…) | Loại này không huỷ quyết định được | ? | Kiểm từng loại có đường thẳng (sửa lịch, huỷ lệnh, sửa trả lời); loại nào không có → mở |
| server/src/duyet/loaiYeuCau.ts:156 | Huỷ quyết định Đổi PA | PA gốc đã đổi sau quyết định | ? | Dữ liệu sau; đường thẳng = Đề xuất PA khác / sửa PA — PTA quyết |
| server/src/duyet/loaiYeuCau.ts:599 (`chet` chuyển lớp) | Thẻ Đề xuất chuyển lớp tự đóng | Học viên không còn học (gồm Tạm dừng) | ? | Ghi danh `paused` ≠ `active` → thẻ tự đóng khi em tạm dừng; GV phải gửi lại |
| server/src/duyet/yeuCau.ts:514, :594 | Duyệt / Từ chối / Sửa / Rút | Yêu cầu đã được xử lý | D | Hai người bấm cùng lúc |
| server/src/duyet/yeuCau.ts:593 | Người gửi Rút sau khi QL duyệt đổi PA | QL đã duyệt — không hoàn tác | D | Người gửi không đảo quyết định QL; QL Huỷ quyết định |
| server/src/duyet/yeuCau.ts:710 | Huỷ quyết định | Thẻ đã tự đóng | D | Hệ thống đóng vì đối tượng không còn |
| server/src/duyet/yeuCau.ts:763 | Huỷ quyết định | Đã có yêu cầu mới đang chờ | D | Một thẻ chờ mỗi đối tượng (chỉ mục duy nhất) |
| server/src/duyet/yeuCau.ts:773 | Huỷ quyết định | Ghi trước khi có Hoàn tác — sửa ở màn gốc | D | Không có bản chụp để đảo; đường màn gốc |
| server/src/duyet/yeuCau.ts:777 | Huỷ quyết định | Yêu cầu vừa đổi (409) | D | Xung đột |
| server/src/duyet/loaiYeuCau.ts:336 | Huỷ quyết định Đổi Target | Đã nhập điểm Mock sau khi đổi | D | Lượt có điểm giữ Target; đổi lại bằng Đề xuất sửa |
| server/src/duyet/loaiYeuCau.ts:494 | Huỷ Từ chối xử lý Ý thức | Vi phạm đã vào lần xử lý khác | D | Đếm bậc hai lần; sửa ở tab Ý thức |
| server/src/duyet/loaiYeuCau.ts:697, :698 | Duyệt / Từ chối thẻ Kế hoạch bổ trợ cũ | Đã bỏ bước duyệt | D | Bước đã bỏ; thẻ cũ chỉ xem |
| server/src/worklist/meeting.ts:296 (week.ts:241) | Nộp báo cáo tuần (Họp tuần) | Báo cáo tuần mở từ {ngày} (hai ngày cuối) | A? | Cho nộp sớm (nhắc "tuần chưa hết"); nộp muộn đã mở · lịch sử `sua` có |
| server/src/worklist/meeting.ts:301 | Lưu nháp báo cáo tuần | Tuần chưa bắt đầu | D | Tuần tương lai chưa có dữ liệu |
| server/src/worklist/mgmttasks.ts:559 | Cập nhật công việc QL → Hoàn thành / Dừng hẳn việc cha | Còn n việc con — khép trước rồi mới … | B | Hỏi "khép luôn n việc con?" rồi làm · nhật ký tiến độ có |
| server/src/worklist/mgmttasks.ts:414 | Tạo việc con | Việc con chỉ một tầng | D | Cấu trúc dữ liệu |

---

Đếm: A 0 · A? 8 · B 2 · C 2 · C? 9 · D 19 · ? 4 — tổng 44 (khu máy chủ quản trị + phần còn lại; đã đọc hết 64 throw ở routes/index.ts — phần lớn là kiểm định dạng / ô bắt buộc / 403 / 404 → bỏ qua; phanTich, giaoVien, dich, demoConfig, permissions: không có chặn theo trạng thái)

| tệp:dòng | thao tác (đường API / nút) | câu chặn (rút gọn ≤ 15 chữ) | loại | đề xuất mở / lý do giữ (≤ 20 chữ) · đã có lịch sử/hoàn tác? · HOTFIX? |
|---|---|---|---|---|
| server/src/routes/index.ts:1830 | POST /students/:id/cycles (mở lộ trình) | "Đã lưu trữ — Quay lại học trước rồi sửa." (`CAU_LUU_TRU`) | C? Q-B1 | Mở: QL tạo lộ trình = tự Quay lại học, ghi lịch sử · chưa · HOTFIX (`chanLuuTruHv` ở students.ts:835) |
| server/src/routes/index.ts:1846 | PATCH /cycles/:id (sửa lộ trình) | "Đã lưu trữ — Quay lại học trước rồi sửa." | C? Q-B1 | Mở: QL sửa thẳng khi lưu trữ, ghi nhật ký · có audit · HOTFIX (`chanLuuTru` students.ts:829) |
| server/src/routes/index.ts:1855 | POST /cycles/:id/mon-dang-ky | "Đã lưu trữ — Quay lại học trước rồi sửa." | C? Q-B1 | Mở: sửa môn khi lưu trữ (không sinh lịch) · có xem trước · HOTFIX |
| server/src/routes/index.ts:1862 | PUT /cycles/:id/baseline (điểm đầu vào) | "Đã lưu trữ — Quay lại học trước rồi sửa." | C? Q-B1 | Mở: sửa đầu vào khi lưu trữ, ghi lịch sử · có audit · HOTFIX |
| server/src/routes/index.ts:1873 | PUT /cycles/:id/outcome (thân cũ outcome) | "Đã lưu trữ — Quay lại học trước rồi sửa." | C? Q-B1 | Mở như thân mới thi thật (đã mở 15/10) · thi thật có Khôi phục bản trước · HOTFIX |
| server/src/routes/index.ts:1942 | POST /cycles/:id/target-revision (đổi Target) | "Đã lưu trữ — Quay lại học trước rồi sửa." | C? Q-B1 | Mở: đổi Target khi lưu trữ, ghi lịch sử · có audit · HOTFIX |
| server/src/routes/index.ts:1692 | PUT /classes/:id/gop-y (Góp ý tuần) | "Góp ý tuần đã chuyển sang chỉ đọc." (403 mọi vai) | C? | Chủ SP 27/10 (D14) bỏ tính năng, không phải khoá trạng thái — giữ · dữ liệu cũ + Lịch sử giữ |
| server/src/routes/index.ts:2845 | POST /students/:id/status (Tạm dừng/ Kết thúc học) | em có lệnh chuyển lớp chờ → câu chặn (`chanLenhCho`) | B | Hỏi xác nhận "huỷ lệnh chuyển lớp đang chờ" rồi làm · HOTFIX (trangThaiHv.ts:91) |
| server/src/routes/index.ts:2743 | POST /students/:id/transfer (Chuyển lớp một em) | đẩy câu `raLenh`: "Em đã có quyết định… ở lớp khác", "Tuần bắt đầu phải hôm nay hoặc từ tuần sau" | ? | Thuộc khu classes/lenhChuyen.ts:160, shared/domain/chuyenLop.ts:184 — tuần đã qua bị chặn; khu lớp rà |
| server/src/platform/accounts.ts:366 | PUT /admin/accounts/:id/roles (đổi vai) | "Tài khoản đã xoá." | A? | Không có đường Khôi phục tài khoản xoá mềm — thêm Khôi phục (QT), ghi nhật ký · chưa |
| server/src/platform/accounts.ts:408 | Đặt lại mật khẩu | "Tài khoản đã xoá." | A? | Như trên: mở sau khi có Khôi phục tài khoản · chưa |
| server/src/platform/accounts.ts:446 | Sửa thông tin tài khoản (QT) | "Tài khoản đã xoá." | A? | Như trên · chưa |
| server/src/platform/accounts.ts:566 | Cấp quyền riêng | "Tài khoản đã xoá." | A? | Như trên · chưa |
| server/src/platform/accounts.ts:680 | Sửa kỹ năng tài khoản (`user_skills`) | "Tài khoản đã xoá." | A? | Như trên · chưa |
| server/src/platform/accounts.ts:367 | Đổi vai — đăng ký bị từ chối | "Chưa duyệt — bấm Duyệt lại." | A? | Đi thẳng: cấp vai = duyệt luôn, ghi nhật ký · có nút Duyệt lại (câu nêu bước tiếp) |
| server/src/platform/accounts.ts:368 | Đổi vai — đăng ký đang chờ | "Chưa duyệt — duyệt ở Đăng ký chờ duyệt." | A? | Như trên: cấp vai = duyệt · có bước tiếp |
| server/src/platform/xoaTaiKhoan.ts:155 | POST /admin/accounts/:id/xoa | "Tài khoản chưa có email… thêm email rồi xoá." | A? | Xác nhận bằng gõ lại họ tên khi không có email · câu đã nêu bước tiếp |
| server/src/platform/xoaTaiKhoan.ts:153 | POST /admin/accounts/:id/xoa | "Đổi GVCN lớp … trước." | B | Cho xoá, cảnh báo "lớp … sẽ thiếu GVCN" như GVBM · không hoàn tác |
| server/src/platform/xoaTaiKhoan.ts:150 | Xoá tài khoản | "Không tự xoá tài khoản của chính mình." | D | Tự khoá mình ra khỏi hệ thống |
| server/src/platform/xoaTaiKhoan.ts:151 | Xoá tài khoản | "Đây là Quản trị hệ thống cuối cùng." | D | Mất hết quyền quản trị, không ai mở lại được |
| server/src/platform/xoaTaiKhoan.ts:170 | GET xem xoá tài khoản | "Tài khoản đã xoá." (`DA_XOA`) | D | Đã xoá rồi — không còn gì để xoá |
| server/src/platform/xoaTaiKhoan.ts:217 | POST xoá tài khoản | "Tài khoản đã xoá." | D | Như trên (bấm lặp) |
| server/src/platform/accounts.ts:375 | Đổi vai — gỡ vai QT của mình | "Không tự gỡ vai Quản trị… của chính mình." | D | Tự khoá mình |
| server/src/platform/accounts.ts:380 | Đổi vai — gỡ QT cuối | "Đây là Quản trị hệ thống cuối cùng." | D | Không còn ai quản trị |
| server/src/platform/accounts.ts:146 | POST đăng ký (người ngoài) | "Email đã đăng ký và không được duyệt — liên hệ Quản trị." | ? | Người đăng ký không có quyền; QT vẫn Duyệt lại được — chắc giữ |
| server/src/platform/accounts.ts:582 | Cấp quyền riêng `plan.week` cho người chỉ có vai GV | lý do `CAM_CAP_VAI` (SCH-01) | C? | SCH-01 Rulebook: GV không chốt tuần MT FT (shared/domain/nhomQuyen.ts:97); không ở N1–N39 |
| server/src/platform/sysconfig.ts:345 | Bật ô vai × quyền (Quản trị › Quyền) | "Không bật được … SCH-01…" | C? | Như trên (SCH-01) |
| server/src/platform/sysconfig.ts:339 | Tắt ô vai × quyền khoá (`LOCKED`) | "gỡ xong thì không còn ai vào được màn này" | D | Tự khoá màn Quản trị |
| server/src/platform/sysconfig.ts:62 | Lưu lộ trình mã mới | "Không thêm lộ trình mới ở đây — lịch MT… gắn LT1, LT2, RF." | ? | Giới hạn thiết kế (N12 đã có hướng "Khác"); hỏi PTA có cần mở không |
| server/src/platform/sysconfig.ts:163 | Sửa chương trình gốc / đã có lớp — thêm Progress | "Chương trình này không có bài Progress Test." | ? | Thêm mốc cho chương trình đang có lớp — lớp đang chạy không đổi; có thể mở cho lớp mở sau |
| server/src/platform/sysconfig.ts:147 | Sửa chương trình đã có lớp — môn, cách chấm | (lặng lẽ bỏ qua, không báo) | D | Đổi cách chấm / môn = đổi nghĩa điểm đã nhập; nên báo câu tại ô thay vì im |
| server/src/platform/bangQuyDoi.ts:84 | Lưu bảng quy đổi | "Bảng vừa được người khác lưu — tải lại…" | D | Xung đột phiên bản · có Khôi phục phiên bản + Hoàn tác |
| server/src/platform/ghiDao.ts:98 | Hoàn tác (đảo) — mọi nơi dùng `daoLai` | "Thao tác này đã được hoàn tác." | D | Bấm lặp |
| server/src/platform/ghiDao.ts:103·104·111·120 | Hoàn tác: cases.ts:1726, phanCongGv.ts:474, duyet/yeuCau.ts:776, baoPhTvv.ts:266, phoiHop.ts:639 | "Không hoàn tác được: đã có thay đổi sau… — sửa trực tiếp ở màn đó." | D | Đảo đè thay đổi mới = mất dữ liệu; khu từng nơi gọi phải kiểm "sửa thẳng" có thật |
| server/src/platform/ghiDao.ts:138 | Hoàn tác sau 30 ngày (cron xoá `ghi_dao`) | (bản ghi đảo hết hạn, nút mất) | C | N28 giữ 30 ngày; sau đó sửa thẳng |
| server/src/platform/khoiPhucRac.ts:44 | Khôi phục kết quả PA đã xoá | "PA đã có kết quả ghi sau — không khôi phục được…" | D | Đè kết quả mới; ghi lại kết quả thẳng được |
| server/src/platform/khoiPhucRac.ts:48 | Khôi phục kết quả PA đã xoá | "PA đã thay đổi sau khi xoá… ghi lại kết quả" | D | Như trên (rà bảo mật #957) |
| server/src/platform/thungRac.ts:165 | Khôi phục mục thùng rác | "mục gốc đã không còn… khôi phục mục gốc trước." | D | Khoá ngoại (Case/HV gốc đã xoá); có đường khôi phục gốc |
| server/src/platform/thungRac.ts:238 | Khôi phục mục thùng rác | (cùng câu THIEU_GOC — kiểm khoá ngoại cuối) | D | Như trên |
| server/src/platform/thungRac.ts:200 | Khôi phục mục thùng rác | "dòng liên quan đã thay đổi… khôi phục mục liên quan trước." | D | Dòng cần trả không còn — trả sai dữ liệu |
| server/src/platform/thungRac.ts:219 | Khôi phục (vd Case) | "đã có dữ liệu mới trùng… (Case đang mở cùng kỹ năng)" | D | Trùng bản ghi đang mở (UNIQUE) |
| server/src/platform/thungRac.ts:259 | Khôi phục mục thùng rác | "Mục này đã được khôi phục." | D | Bấm lặp |
| server/src/platform/thungRac.ts:260 | Khôi phục mục > 30 ngày | "đã quá 30 ngày và đã xoá hẳn" | C | N28 giữ 30 ngày; dữ liệu đã xoá hẳn |
| server/src/app.ts:147 | Mọi đường ghi (lỗi SQLITE_CONSTRAINT) | "Dữ liệu bị trùng hoặc vi phạm ràng buộc." | D | Ràng buộc DB thật; câu chung không nêu bước tiếp — nên đổi câu cụ thể |

---

Đếm: A 6 · A? 8 · B 3 · B? 1 · C 6 · C? Q-B1 9 · D 7 · D? 1 · ? 3 — tổng 44 dòng (khu WEB students / classes / fasttrack / cham / test)

Đường dẫn rút gọn: `st/` = web/src/modules/students, `cl/` = classes, `ft/` = fasttrack, `ch/` = cham, `te/` = test, `sd/` = shared/domain, `sv/` = server/src.
"MC" = máy chủ cũng chặn (tệp:dòng) · "chỉ web" = máy chủ không chặn / không thấy chặn · "MC ?" = chưa xác minh.

| tệp:dòng | thao tác (đường API / nút) | câu chặn (rút gọn ≤ 15 chữ) | loại | đề xuất mở / lý do giữ (≤ 20 chữ) · đã có lịch sử/hoàn tác? · HOTFIX? |
|---|---|---|---|---|
| st/StudentDetailPage.tsx:270, :390 | "+ Case" đầu hồ sơ + cột Case — ẩn khi hồ sơ Lưu trữ (`lopHoc.chiXem` = `archived_at`) | Đã lưu trữ — Quay lại học trước rồi sửa (`CAU_LUU_TRU`) | C? Q-B1 | Mở: báo Case cho em Tạm dừng / Kết thúc · MC sv/cases/cases.ts:551, :1925 · có nhật ký Case |
| st/StudentDetailPage.tsx:264 | "Gia hạn" (hạn sau thi) — ẩn khi Lưu trữ | (không câu — nút ẩn) | C? Q-B1 | Mở: gia hạn được cả khi Tạm dừng · MC ? (thiThat.ts) · HOTFIX (sv/loTrinh/thiThat.ts) |
| sd/quanLyHocVien.ts:80, :82–83 (gọi từ st/StudentDetailPage.tsx:274) | ⋯ hồ sơ: Chuyển lớp · Cuối khoá… · Lộ trình — ẩn khi Lưu trữ | Đã lưu trữ — Quay lại học trước rồi sửa | C? Q-B1 | Mở: đi thẳng (chuyển lớp = quay lại học kèm) · MC sv/students/students.ts:192, :265, :831, :837 · HOTFIX |
| st/StudentManagePanel.tsx:272–275, :306, :316, :506 | Sửa thông tin hồ sơ Lưu trữ — ẩn khối Lộ trình (Target, dự kiến thi, tuần BĐ, đầu vào, môn) | Đã lưu trữ — Quay lại học trước rồi sửa | C? Q-B1 | Mở: sửa Target / dự kiến thi có lịch sử · MC students.ts:853 (`TRUONG_SUA_LUU_TRU`) · HOTFIX |
| sd/quanLyHocVien.ts:86–87 | ⋯ "Đề xuất sửa thông tin" / "Đề xuất chuyển lớp" — chỉ khi `status === 'active'` | (ẩn mục) | A? | Cho GVBM / GVCN đề xuất cả em Tạm dừng · chỉ web (MC có CAU_LUU_TRU khi lưu trữ) |
| cl/thaoTacDongHocVien.tsx:73 + sd/hocVienLop.ts:443 | ⋯ dòng học viên ở hồ sơ lớp: em không `active` → menu rỗng / chỉ "Quay lại học" | (ẩn + Case, vi phạm, Nhập điểm, Sửa thông tin, Chuyển lớp) | A | Giữ mục theo quyền như ⋯ hồ sơ (Sửa thông tin, KQ thi thật…) · chỉ web |
| st/StudentManagePanel.tsx:183, :203 | Quay lại học (Học lại, `POST /students/:id/hoc-lai`) — nút khoá khi không có lớp cũ, kể cả chọn "Sang lớp mới" | Chưa có lớp để học lại | A | Cho chọn lớp mới khi không lớp cũ · MC hàng loạt sv/students/hangLoat.ts:54 · có Hoàn tác |
| st/HopTamDungKetThuc.tsx:73, :119, :144 | Tạm dừng / Kết thúc học (`POST /students/:id/status`, hàng loạt) | Đang có quyết định chuyển lớp chờ — huỷ … rồi làm lại | A | Đi thẳng: huỷ lệnh chờ + đổi trạng thái, hỏi xác nhận nêu lệnh · MC sv/students/trangThaiHv.ts:18–24, hangLoat.ts:49–50 · HOTFIX (trangThaiHv.ts) |
| st/XemTruocHangLoatPanel.tsx (dòng `lyDoBo` của sv/students/hangLoat.ts:52–57) | Hàng loạt Hoàn tác tạm dừng / kết thúc / học lại | Không còn ở trạng thái tạm dừng / kết thúc / đang học | ? | Hoàn tác sau khi trạng thái đã đổi tiếp: nên đi thẳng tới trạng thái đích? · MC |
| st/PanelBuocTiep.tsx:159, :161, :166 | Bước tiếp sau thi: nút "Đổi" khoá + "Hoàn tác" ẩn khi em đã chuyển lớp | Em đã chuyển sang lớp mới — đổi ở hồ sơ | A | Đổi đi thẳng từ trạng thái hiện tại (Kết thúc học / LT khác) · MC sv/loTrinh/buocTiep.ts:98, :253 (409) · HOTFIX (cả hai tệp) |
| cl/DauTrangLop.tsx:208–210 (+ sv/classes/classes.ts:895–899) | Hồ sơ lớp đã kết thúc: mọi cờ viewer tắt, cả QL (Nhập điểm, + Case, + HV, Sửa HV, phân công); chỉ "Mở lại lớp" | Lớp đã kết thúc — chỉ xem | C? Q-B1 | Giữ cờ sửa / nhập điểm cho QL (đúng Q-B1 ①), không bắt Mở lại lớp · MC (cờ) |
| ft/ScoreEntry.tsx:126–127, :746; ch/LuoiThuong.tsx:50 | Sửa / xoá điểm đã có ở lớp đã kết thúc (GV đúng môn) | Lớp đã kết thúc — chỉ Quản lý sửa được điểm | C? Q-B1 | Q-B1 ①; nếu lời 07/11 thay → cho GV đúng môn sửa có lý do · MC sv/fasttrack/hoanTat.ts:130 (403) |
| ft/ScoreEntry.tsx:25, :631–634; ft/HopNhapDiem.tsx:338, :374; ch/LuoiThuong.tsx:56 | Gõ "-" (vắng) ở lớp đã kết thúc | Lớp đã kết thúc — không ghi vắng ("-") | A? | "-" = Không dự thi (như MT cũ), không dời · MC sv/fasttrack/hoanTat.ts:140 (`CAU_KHONG_VANG`) |
| ft/ScoreEntry.tsx:23, :137; ch/LuoiFT.tsx:39, :464; ch/MotKyNang.tsx:114, :245 | Nhập / sửa điểm, Bỏ vắng của em đã Lưu trữ | Em đã lưu trữ — Quay lại học trước khi nhập điểm | C? Q-B1 | Mở: nhập bù điểm cho em lưu trữ (ghi lịch sử) · MC sv/fasttrack/attempts.ts:1456, :2666 + saveScore |
| ft/ScoreEntry.tsx:129, :137; ft/ODiemLon.tsx:48; ft/MockDetailPage.tsx:753; sd/thaoTacMt.ts:83 | Nhập điểm bài đã xác nhận vắng (`sit_status = absent`) | Đã xác nhận vắng — QL xếp lại bài trước khi nhập | A | Nhập điểm thẳng = em có làm bài, tự gỡ vắng, ghi lịch sử · MC sv/fasttrack/attempts.ts:2267 |
| ft/MockDetailPage.tsx:752–753; sd/thaoTacMt.ts:87 (lớp thường: chỉ QL Khôi phục) | Nhập điểm kỹ năng đã huỷ | Đã bị huỷ. Khôi phục và đặt tuần mới trước | A | Nhập điểm thẳng tự khôi phục kỹ năng, giữ tuần cũ · MC sv/fasttrack/attempts.ts:2264 |
| ft/ScoreEntry.tsx:121–124, :138; ft/HopNhapDiem.tsx:257 | GV nhập điểm ô "Không dự thi" (vắng đã chốt) / "chờ QL hiệu chỉnh" | Đã chốt — cần Quản lý hiệu chỉnh | A? | GV có quyền ô nhập đè, ghi lịch sử · MC ? (không thấy throw riêng) |
| ft/HopNhapDiem.tsx:338; sd/thaoTacMt.ts:79–80, :111 (menuHopKyNang "Vắng" mờ) | Ghi vắng ô đã có điểm | Đã có điểm — "-" không xoá được điểm, dùng hiệu chỉnh | B | Hỏi "Xoá điểm {kn} và ghi vắng?" (điểm cũ vào Lịch sử) · MC sv/fasttrack/attempts.ts:2320, sv/normal/regular.ts:846 |
| ft/ScoreEntry.tsx:603, :620–623; sd/thaoTacMt.ts:112 | Gõ "-" khi chưa tới tuần Test | Chưa tới tuần Test — chưa ghi "-" được | D | Vắng trước tuần thi không thể đúng; báo trước thì Dời · chỉ web chặn gửi |
| ft/HopThaoTacMt.tsx:102–103; te/keHoach/HopKyNang.tsx:197–199, :433; te/keHoach/HopSEx.tsx:35, :72–74, :85 | Đặt / dời / bỏ lịch MT, MT0, S Ex T6–CN | Thứ Sáu – CN không đổi lịch MT 3 tuần (`LOI_KHOA_CUOI_TUAN`) | C | N15 (+ công tắc "Mở sửa lịch Test" 06/11) · MC |
| ft/HopThaoTacMt.tsx:108–109; sd/lichMt.ts:103; sd/thaoTacMt.ts:66 | GVCN / GV dời MT: sang tuần đã qua (MT chưa qua) / sang tuần tới (MT đã qua) | Tuần đã qua — chọn từ tuần này / tuần tới do QL xếp | C | N23 (quyền lịch MT cũ chỉ ≤ tuần này cho GVCN) · MC |
| te/keHoach/HopKyNang.tsx:194–199, :462 (câu từ `POST /ke-hoach-test/dot/kiem`) | Lưu hộp kỹ năng khi lượt sau trước lượt trước / trùng tuần (MT0↔MT1, lớp thường) | Lượt sau không được xếp trước lượt trước / trùng tuần | C | N9 (giữ MT0 trước MT1) + N23 (chặn vượt lượt giữ) · MC sv/fasttrack/skillSchedule.ts:699–718 |
| te/keHoach/NganXepLichMt.tsx:357, :397, :467 (câu `CAU_THI_LAI_TUAN_QUA`) | QL "Thi lại" kỹ năng đã có điểm vào tuần đã qua | Thi lại: chọn tuần từ tuần này trở đi | A? | Cho QL chọn tuần đã qua (N38 ④ chọn tuần = xếp lại) · MC sv/keHoach/keHoachTest.ts:686, :1157 |
| te/keHoach/HopKyNang.tsx:351–353, :357, :362; ft/MockDetailPage.tsx:256, :294; sd/keHoachOv15c.ts:31–32 | ⋯ "Xoá MT{n}" / "Xóa lịch" khi đã có điểm / đã làm bài | Đã có điểm / Đã làm bài — không xoá được | B | Hỏi "Xoá MT{n} cùng điểm?" — Khôi phục MT{n} đã có · MC sv/fasttrack/attempts.ts:1619–1620 |
| sd/keHoachOv15c.ts:33 (te/keHoach/HopKyNang.tsx:273) | "Xóa lịch" lớp thường khi chưa xếp lịch | Chưa xếp lịch | D | Không có lịch để xoá · chỉ web |
| sd/thaoTacMt.ts:116 (menuHopKyNang — MT cũ `lich-su`) | Vắng / Dời hạn chấm ở MT cũ (≥ 2 tuần) mờ | Chỉ nhập bù | C | N38 ② / T23: MT cũ "-" = Không dự thi, không dời · MC |
| ft/LuotThuongPage.tsx:154; te/keHoach/HopKhoiPhucKetQua.tsx:100, :112 | Khôi phục lượt đã huỷ khi lớp đã kết thúc / em Lưu trữ | Lớp đã kết thúc — không khôi phục / bỏ lưu trữ trước rồi khôi phục | C? Q-B1 | Mở: QL khôi phục thẳng (lượt đi theo lịch sử) · MC sv/fasttrack/attempts.ts:1840–1843 |
| ft/LuotThuongPage.tsx:154; te/keHoach/HopKhoiPhucKetQua.tsx:112 | Khôi phục lượt khi em đã rời lớp / đã có lượt khác cùng loại | Em không còn học lớp … / đã có {nhan} khác đang dùng | D | Hai lượt cùng loại đang mở = trùng bản ghi; có link sang lượt mới · MC attempts.ts:1845–1851 |
| ft/MockDetailPage.tsx:287–289 → HopKhoiPhucMt | Khôi phục MT{n} cũ khi số MT đã xếp lại | (hộp nói) huỷ MT mới trước rồi khôi phục | A? | Đi thẳng: hỏi "Thay MT{n} hiện tại bằng bản cũ?" · MC sv/fasttrack/attempts.ts (reopenAttempt, "400 câu chặn") |
| te/keHoach/HopKhoiPhucKetQua.tsx (câu từ sv/fasttrack/ketQuaHuy.ts:131) | Khôi phục kết quả lượt bị vượt | {x} Dời lượt trước về trước rồi khôi phục | A? | Khôi phục thẳng, lượt về "Chưa xếp lịch" như reopenAttempt · MC |
| st/NganCase.tsx:95, :99, :105 | Sửa tên Case / kỹ năng khi Case đã xong | (nút ẩn) · MC: Case đã hoàn thành — Mở lại trước khi sửa | C? Q-B1 | Q-B1 ③ (Case xong phải Mở lại); đề xuất sửa thẳng có lịch sử · MC sv/cases/cases.ts:1362 |
| cl/ThongTinLopPanel.tsx:116, :176–191 | Đổi chương trình / lộ trình lớp khi lớp đã có HV / bài Test | 🔒 Đổi chương trình khi lớp chưa có học viên | B? | Q6 K2-18 khoá; đề xuất xác nhận nêu n em bị đổi lộ trình · MC sv/classes/thongTinLop.ts:3 |
| cl/XoaKetThucLopPanel.tsx:79, :94 | Kết thúc lớp (`POST /classes/:id/ket-thuc`) | Còn n HV đang học / chưa chốt LTTT / n lệnh ĐẾN — … trước | B | Xác nhận nêu n em Kết thúc học + n lệnh đến bị huỷ · MC sv/classes/xoaKetThucLop.ts:71–77, :130–132 · có Mở lại lớp |
| cl/XoaKetThucLopPanel.tsx:29, :55 | Xoá lớp có dữ liệu | Lớp đã có dữ liệu. Dùng Kết thúc lớp | D? | Xoá hẳn = mất điểm (Thùng rác N28 chưa gồm lớp); đã có lối Kết thúc lớp · MC |
| cl/CuoiKhoaLop.tsx:725–731 | Chốt "Ngay hôm nay" ở Cuối khoá | Chuyển ngay, không hoàn tác | C | N22 ③ (một hộp xác nhận nêu tên em) — "không hoàn tác" trái lời 07/11? · MC |
| st/PanelLoTrinhMoi.tsx:122–125 | Mở lộ trình mới khi lớp đang giữ sai loại | (lỗi máy chủ `xem.loi`) — chọn lớp khác | D | Lộ trình FT trong lớp sai loại không đúng; có ô chọn lớp ngay tại panel · MC |
| st/PanelLoTrinhMoi.tsx:111 | Hoàn tác Lộ trình mới khi sang lớp khác | (không có Hoàn tác) | A? | Thêm Hoàn tác / đi thẳng ngược lại · MC ? (buocTiep.ts) · HOTFIX |
| cl/chuyenLopChung.tsx:36–40 | Ô Tuần bắt đầu chuyển lớp | Chỉ từ tuần sau trở đi (hoặc Ngay hôm nay, không hoàn tác) | ? | Không lùi về tuần đã qua — có cần? · MC `tuanChonDuoc` |
| te/keHoach/NganXepHangLoat.tsx:221–225 | Chọn đợt đã xong cả lớp trong Xếp hàng loạt | Cả lớp đã xong đợt này | ? | Thi lại cả lớp phải từng em — có cần mở? · chỉ web |
| cl/ClassCreatePanel.tsx:258–265 | "Gộp L · R · G+V" khi ba môn khác GV | L, R, G+V đang do nhiều người dạy | D | Gộp một ô không thể giữ hai người · chỉ web |
| cl/BanGiaoGvPanel.tsx:121–122 | Xác nhận bàn giao khi còn em thiếu góp ý | Còn n em thiếu góp ý | C | N29 (mỗi em một góp ý mỗi kỹ năng) · MC ? |
| cl/TabBaoCaoPh.tsx:523, :541 | Sửa điểm trong Báo cáo PH khi không phải đợt tháng / bài không có tổng | (nút Sửa ẩn) | D | Không có thang để sửa đúng · MC (RA-LOI-0611) |
| st/HopTamDungKetThuc.tsx:152–155 | Ô "Có thể quay lại học" khi em đang tạm dừng | · em đang tạm dừng | D | Đã tạm dừng; hộp chỉ còn Kết thúc học · MC |
| ft/LuotThuongPage.tsx:258; ft/MockDetailPage.tsx:436 | Case / PA của lượt đã huỷ — `CaseLuotKn chiDoc` | (chỉ đọc) | A? | Case sống độc lập lượt — cho sửa / thêm PA · chỉ web |

---

## Rà chặn cứng — WEB khu B (cases · yThuc · platform · congViec · worklist · tutor · duyet · giaoVien · phanTich · ui · App)

**Đếm: A 18 (trong đó A? 5) · B 7 (B? 1) · C 2 · C? 3 · D 12 (D? 2) · ? 5 — tổng 47 dòng.**
"MC" = máy chủ. "chỉ web" = máy chủ không chặn (web ẩn / tắt nút). Đường dẫn web tính từ `web/src/`, MC từ `server/src/`.
Không thấy chặn theo trạng thái ở `giaoVien/*`, `phanTich/*` (chỉ đọc báo cáo), `App.tsx`. `chiXem` trong khu này đều theo vai (bỏ qua).

## Case · PA (`modules/cases`)

| tệp:dòng | thao tác (đường API / nút) | câu chặn (rút gọn) | loại | đề xuất mở / lý do giữ · lịch sử/hoàn tác? · HOTFIX? |
|---|---|---|---|---|
| modules/cases/CasePanel.tsx:193,343 (+:432 Phụ trách, :241 Nguyên nhân/Mô tả, :714 Kết thúc sớm) | Case `done` → ẩn mọi sửa: Phụ trách, Nguyên nhân, Mô tả, PA, Kết thúc sớm | "Đã kết luận" — chỉ xem, phải Mở lại | C? Q-B1 | Đề xuất: sửa thẳng khi Case xong, ghi lịch sử · có Mở lại (QL / người hoàn thành) · MC: phần lớn chỉ web |
| modules/cases/CasePanel.tsx:847 (MC cases/cases.ts:2460, :4325) | Sửa kết quả PA (`GET/PUT /followups/:id/sua`) khi Case xong | "Case đã hoàn thành — bấm Mở lại trước" | C? Q-B1 | Đề xuất: sửa KQ thẳng, Case giữ kết luận (ghi lịch sử) · MC cũng chặn |
| modules/cases/CasePanel.tsx:291 | "+ Thêm PA" ẩn khi Case `done` | (ẩn nút, không câu) | A | Cho thêm PA → Case tự mở lại, ghi lịch sử · **chỉ web** (MC `themPa` không kiểm `done`) |
| modules/cases/CasePanel.tsx:589 (MC cases/cases.ts:338 `chanMoLai`) | Mở lại Case hệ thống đóng (`POST /cases/:id/mo-lai`) | "Hệ thống đóng — Hoàn tác Kết thúc học để mở" | A | QL mở lại thẳng từ trạng thái hiện tại, ghi lịch sử · MC chặn "không mở lại được" |
| modules/cases/CasePanel.tsx:585 (MC cases/cases.ts:340) | Mở lại Case khi đã có Case mới cùng hạng mục | "Đã có Case … mới — mở Case đó" | D | Trùng khoá Case đang mở (dedup) · có link sang Case mới |
| modules/cases/CasePanel.tsx:714 → shared/domain/paDongBo.ts:310 (MC cases/cases.ts:4685) | PA đã khép: Sửa Nội dung / Số buổi / Người dạy, Ghi kết quả ẩn | "Phương án này đã kết thúc — không cập nhật thêm được" | A | Cho sửa chữ / người / buổi PA đã khép, ghi `sua_pa` · MC cũng chặn |
| modules/cases/CasePanel.tsx:840 (MC cases/cases.ts:4718) | Đổi Ngày bắt đầu PA khi đã có kết quả | "đã có kết quả — không đổi" | A | Cho đổi, chỉ chặn nếu sau ngày KQ đầu (dữ liệu sai) · MC cũng chặn |
| modules/cases/CasePanel.tsx:810 · FormPa.tsx:68 (MC cases/cases.ts:4705) | Đổi Loại PA | "Loại không sửa được. Đổi loại: Ghi kết quả › Thay PA" | A? | PA chưa có KQ: đổi loại tại chỗ, ghi lịch sử; không bắt ghi KQ trước · MC chặn |
| modules/cases/CasePanel.tsx:867 (MC cases/cases.ts:2362 `daoDuoc`) | "Mở lại PA" sau Kết thúc sớm | nút ẩn khi đã có thay đổi sau lần Kết thúc | A | Đi thẳng: đặt PA về `started` từ hiện tại, ghi lịch sử · MC chỉ cho khi đảo chính xác được |
| modules/cases/CapNhatTuan.tsx:188,416,486 (MC cases/cases.ts:4335–4347 `chanDoi`) | Sửa lần ghi KQ: đổi Kết quả / Quyết định / Ngày | "PA thay thế đã có kết quả — chỉ sửa được chữ… nhờ QL xoá PA mới trước" | B | Cho đổi; hỏi xác nhận nêu PA mới sẽ vào Thùng rác · MC cũng chặn |
| modules/cases/CasePanel.tsx:366 → shared/domain/sosV4.ts:184–188 | Hoàn thành Case khi chưa có PA / PA chưa KQ cuối / PA chờ duyệt | "cần ít nhất 1 PA" · "n PA chưa có kết quả cuối" | B | Cho hoàn thành; hỏi xác nhận "khép n PA đang chạy" · nút mờ + ⓘ |
| modules/cases/CasePanel.tsx:342 → shared/domain/sosV4.ts:181,189 (`an`) | Hoàn thành Case khi PA theo quy chế chưa khép | "Hoàn thành được sau khi PA theo quy chế kết thúc" | B? | Quy chế SOS (K3-09) — nếu không phải luật đã chốt: xác nhận thay ẩn nút |
| modules/cases/CasePanel.tsx:291 (MC cases/cases.ts:955) | + Thêm PA khi chờ QL duyệt "Không cần theo dõi" | "Chờ duyệt xong (hoặc bị từ chối) rồi thêm" | B | Cho thêm; hỏi xác nhận: thêm PA = rút đề nghị Không cần theo dõi · MC cũng chặn |
| modules/cases/CasePanel.tsx:291,342 (MC cases/cases.ts:953) | + Thêm PA / Hoàn thành khi Case tạm (SOS chưa chốt) | "Case tạm — lượt chốt rồi mới thêm PA" | C N8④ | SOS tạm không Case, không việc · giữ |
| modules/cases/CasePanel.tsx:291 | + Thêm PA khi `awaitingCause` / `choNhanXet` | (ẩn nút) | C? N8③ | Xác nhận Case bắt buộc theo N8 · **chỉ web** (MC `themPa` không kiểm) — PTA xem có cần ẩn |
| modules/cases/CapNhatTuan.tsx:372,486 → shared/domain/cases.ts:997 | Chọn Quyết định không hợp Kết quả | "Kết quả chưa tốt thì chưa khép suông được…" | ? | Ràng buộc KQ ↔ quyết định (Rulebook §18), không ở 1.6 · có lẽ D (dữ liệu mâu thuẫn) |
| (MC cases/cases.ts:4294) · web chỉ cho sửa KQ gần nhất (CasePanel.tsx:847 `fGan`) | Sửa lần ghi KQ cũ hơn | "Chỉ sửa được lần ghi gần nhất của PA" | D? | Lần sau dựa trên quyết định lần trước; mở thì phải tính lại chuỗi |

## Ý thức (`modules/yThuc`)

| tệp:dòng | thao tác | câu chặn | loại | đề xuất / lý do · lịch sử? · HOTFIX? |
|---|---|---|---|---|
| modules/yThuc/XemXuLyPanel.tsx:175,200 (MC yThuc/xuLy.ts:595) | Sửa / Sửa vi phạm lần xử lý "Đã thu hồi" | `coTheSua` false khi `thu_hoi` — chỉ xem | A | Cho sửa thông tin + "Khôi phục" thu hồi (N24 ② xoá mềm), ghi lịch sử · MC cũng chặn |
| modules/yThuc/ClassYThucCard.tsx:208 (MC yThuc/xuLy.ts:395 `!sau`) | Thu hồi lần xử lý không phải mới nhất | nút ẩn | B | Cho thu hồi; xác nhận nêu lần sau bị ảnh hưởng · MC cũng chặn |
| modules/yThuc/KhaiBacLoPanel.tsx:214 · KhaiBacPanel.tsx:19 (MC yThuc/lo.ts:81–83) | Khai / sửa bậc trước khi dùng web khi chuỗi đã có xử lý | "đã có xử lý · chỉ QL sửa" · "đã có xử lý trên web" | ? | H5/T27 thiết kế "một lần"; GVCN có quyền mà bị khoá theo dữ liệu → nghiêng A + xác nhận (bậc kế đổi) |
| modules/yThuc/KhaiBacLoPanel.tsx:214 (MC yThuc/lo.ts:84) | Khai bậc khi em Tạm dừng | "em đang Tạm dừng" | A? | Không ảnh hưởng đầu ra · mở · MC cũng chặn |
| modules/yThuc/LoYThucPanel.tsx:92,225 (MC yThuc/lo.ts:67) | Xác nhận xử lý khi chưa đủ vi phạm bắt buộc | "chưa bắt buộc — dùng Ghi nhận" | ? | Luật ≥ 3 vi phạm (Rulebook), không ở 1.6 · GVCN muốn xử lý sớm bị chặn |
| modules/yThuc/ClassYThucCard.tsx:336,701 (MC yThuc/lo.ts:76) | "Đã xem" khi ≥ 3 vi phạm | "phải xử lý; 'Đã xem' không còn" | ? | Luật bắt buộc xử lý (Rulebook) — PTA xác nhận là luật thật |
| modules/yThuc/LoYThucPanel.tsx:92 (MC yThuc/lo.ts:65) | Xác nhận xử lý khi có đề xuất chờ QL | "có đề xuất … chờ QL duyệt" | D | Hai lần xử lý chồng cùng bậc · có Rút đề xuất |
| modules/yThuc/XacNhanXuLyPanel.tsx:33 | Bậc xử lý tự điền, chỉ đọc; lệch → 409 | "`bacDaThay` lệch → 409" | D | Xung đột phiên bản (người khác vừa xử lý) |
| modules/yThuc/DaThucHienPanel.tsx:67,69 | "Lưu · Đã thực hiện" khi lần xử lý không còn `da_duyet` | "không còn chờ Đã thực hiện" | D | Trạng thái đã đổi (cũ) |
| modules/yThuc/PhoiHopSosSection.tsx:413 | Thêm việc phối hợp SOS cùng loại đã có | nút loại tắt | D | Tránh trùng việc (trừ "Khác") |

## Công việc · Sau thi · Báo PH (`modules/congViec`)

| tệp:dòng | thao tác | câu chặn | loại | đề xuất / lý do · lịch sử? · HOTFIX? |
|---|---|---|---|---|
| modules/congViec/PanelSauThi.tsx:180 | "Sửa điểm" thi thật ẩn khi đã chọn Bước tiếp | (ẩn nút) | A | Cho sửa điểm mọi lúc, ghi lịch sử (đã có Khôi phục bản trước) · **chỉ web** (`PUT /cycles/:id/outcome` không kiểm bước tiếp) · liên quan HOTFIX thiThat.ts |
| modules/congViec/PanelSauThi.tsx:105,187,193 | Đổi Bước tiếp đã chốt (radio + ghi chú khoá) | "Đã chọn: …" — chỉ Hoàn tác | A | Cho chọn lại thẳng từ hiện tại (MC buocTiep.ts:273 đã có đường đổi) · HOTFIX buocTiep.ts |
| modules/congViec/PanelSauThi.tsx:126 (MC loTrinh/buocTiep.ts:96) | Hoàn tác Bước tiếp khi đã chuyển lớp | nút ẩn (`hoanTacDuoc = !daChuyen`) | A | Đi thẳng tới trạng thái mới, không đòi hoàn tác chuyển lớp · HOTFIX buocTiep.ts |
| modules/congViec/PanelSauThi.tsx:260,264,265 | Chốt ngày thi: lưu xong khoá ô, không Sửa / Hoàn tác | ô `disabled={!!xong}` | A? | Thêm "Sửa" tại chỗ · sửa được ở Lịch thi |
| modules/congViec/PanelBaoPhTvv.tsx:87,131 (MC yThuc/baoPhTvv.ts:178,214,261) | Ghi / Khôi phục Báo PH khi lần xử lý đã thu hồi / hệ thống đóng | "… — việc Báo PH chỉ xem" · "không khôi phục tay được" | D? | Việc gốc đã thu hồi (N5); mở lại khi thu hồi được khôi phục |
| modules/congViec/PanelBaoPhTvv.tsx:157 (MC yThuc/baoPhTvv.ts:313) | Sửa hạn Báo PH khi việc đã kết thúc | "đã kết thúc — không sửa hạn" | D | Hạn của việc đã xong không còn tác dụng |
| modules/congViec/PanelViec.tsx:393 | "Giao" khi môn / lớp vừa có người được giao | "Môn này vừa được giao cho …" | D | Hai người giao đè cùng lúc |

## Duyệt (`modules/duyet`)

| tệp:dòng | thao tác | câu chặn | loại | đề xuất / lý do · lịch sử? · HOTFIX? |
|---|---|---|---|---|
| modules/duyet/HopChoDuyet.tsx:174 · TheYeuCau.tsx:143 (MC duyet/yeuCau.ts:710) | Huỷ quyết định Duyệt / Từ chối (`POST /yeu-cau/:id/huy`) sau ngày quyết | "Chỉ huỷ được quyết định trong ngày." | A | Bỏ giới hạn ngày; ghi lịch sử, chuông người gửi · MC chặn |
| modules/duyet/TheYeuCau.tsx:143 (MC duyet/yeuCau.ts:728,737 `daoDuoc`/`chanDao`) | Huỷ quyết định khi dòng nguồn đã đổi sau | 409 "đã có thay đổi sau" | A? | Đi thẳng trạng thái mới (đảo phần còn đảo được) thay vì cấm |

## Vận hành · Họp tuần · Tutor (`modules/worklist`, `modules/tutor`)

| tệp:dòng | thao tác | câu chặn | loại | đề xuất / lý do · lịch sử? · HOTFIX? |
|---|---|---|---|---|
| modules/worklist/MeetingPage.tsx:426,429 (MC platform/week.ts:241, worklist/meeting.ts:296) | Nộp báo cáo tuần trước 2 ngày cuối tuần | "Báo cáo tuần mở từ … (hai ngày cuối tuần)" | A | Cho nộp sớm (đã có nháp) · MC cũng chặn |
| modules/worklist/MeetingPage.tsx:334,355 (MC routes/index.ts:2908) | Sửa ở kỳ tháng | "Kỳ tháng chỉ để đọc" | D | Tháng = tổng các tuần; sửa ở tuần |
| modules/worklist/MgmtTasksPage.tsx:448,485 (MC worklist/mgmttasks.ts:557) | Hoàn thành / Dừng hẳn việc cha còn việc con mở | "Khép chúng trước rồi mới hoàn thành" | B | Cho khép; xác nhận "khép luôn n việc con" · MC cũng chặn |
| modules/tutor/PanelTutor.tsx:159 (MC tutors/trang.ts:199) | Sửa nhận xét tutor sau 24 giờ | nút Sửa ẩn (`coSua` = trong 24h) | A | **Chỉ web**: MC cho sửa mọi lúc (LUAT-34) — tách cờ sửa / xoá |
| modules/tutor/PanelTutor.tsx:159 (MC tutors/trang.ts:330) | Xoá nhận xét tutor sau 24 giờ | "Quá 24 giờ — không xoá được nữa" | A | Xoá mềm + Hoàn tác (N28) · MC chặn |

## Quản trị (`modules/platform`) · `ui`

| tệp:dòng | thao tác | câu chặn | loại | đề xuất / lý do · lịch sử? · HOTFIX? |
|---|---|---|---|---|
| modules/platform/XoaTaiKhoanPanel.tsx:47,60 (MC platform/xoaTaiKhoan.ts:153) | Xoá tài khoản đang là GVCN | "Đổi GVCN lớp … trước." | B | Cho xoá; xác nhận nêu lớp sẽ trống GVCN |
| modules/platform/XoaTaiKhoanPanel.tsx:47,60 (MC platform/xoaTaiKhoan.ts:155) | Xoá tài khoản chưa có email | "Thêm email … rồi xoá" | A? | Xác nhận bằng gõ tên thay email |
| modules/platform/XoaTaiKhoanPanel.tsx:47,60 (MC platform/xoaTaiKhoan.ts:150–151) | Tự xoá mình / xoá QT cuối cùng | "Đây là Quản trị hệ thống cuối cùng." | D | Chống tự khoá hệ thống |
| modules/platform/AccountsAdmin.tsx:533,568 | Tự gỡ vai Quản trị của mình | "Không tự gỡ vai Quản trị của mình" | D | Chống tự khoá |
| modules/platform/CatalogAdmin.tsx:168 | Sửa Môn / số tuần / Progress chương trình gốc hoặc đã có lớp | ô chỉ đọc | ? | Lớp đang chạy giữ bản chụp → có thể mở kèm xác nhận (B); MC không rõ có bỏ qua `skills` |
| ui/ngayNghiepVu.ts:32 (MC kiểm lại) | Thêm / huỷ / dời lịch MT T6–CN | chip khoá cuối tuần | C N15 | Giữ; công tắc "Mở sửa lịch Test" đã có |
