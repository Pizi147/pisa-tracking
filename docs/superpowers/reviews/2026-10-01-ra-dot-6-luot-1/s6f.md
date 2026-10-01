# Rà GỌN #151 PR-S6F-a + #152 PR-S6F-b (main @ 0c9c04f6)

Người rà: Opus 5.5 · chỉ đọc mã ở worktree `ra6`. Không chạy `npm run check` (S6F-b đã chạy trên bản gộp: 2232 + 29).
Đối chiếu: kế hoạch `docs/superpowers/plans/2026-10-01-pr-s6f-sua-sau-ra-dot-6.md` (Q1–Q23, Task 1–13) và báo cáo rà gốc
`docs/superpowers/reviews/2026-10-01-ra-dot-6-luot-1/` (1 P0 + 24 P1; gộp trùng còn 23 mục).

**Kết quả: 23 Đã sửa · 0 Sửa thiếu · 0 Chưa sửa.** Lỗi mới: 0 P0 · 0 P1 · 3 P2.

## Bảng P0 / P1

Đường dẫn phép kiểm: `A` = `server/src/tests/prS6fA.tests.ts`, `B` = `server/src/tests/prS6fB.tests.ts`.

| Mục (nguồn) | Kết luận | Chỗ sửa | Phép kiểm |
|---|---|---|---|
| **P0** `nhap_dau_ngay` chốt khi ô mới có 1 tiêu chí (pb2-b) — Q18 | Đã sửa | FT: `server/src/fasttrack/attempts.ts:1683-1684` (`coDiemThat = raw !== null \|\| band !== null`; `bandFromCriteria` trả null khi < 4 tiêu chí, `scoring.ts:35`). Lớp thường: `server/src/normal/regular.ts:532` (chỉ khi có `score`). Seed: `server/src/seed/pb2bSeed.ts:27-29`. Chỉ hai hàm này ghi điểm (`routes/index.ts:816, :1256`, `keHoachTest.ts:455, :479` đều gọi `saveScore`) | A:55 (1a), A:63 (1b), A:69 (1c lớp thường), A:77 (1d hai đường Nợ điểm ↔ bảng GV) |
| PA do GV thêm bỏ Case chưa phân loại → ô ≠ trang (pb2-a) — Q20 | Đã sửa | `server/src/phanTich/hieuQuaPa.ts:160` (vào hàng `KHOA_CHUA_PHAN_LOAI`), `:216-221` (tóm tắt cộng cả hàng đó) | A:304 (4d) |
| `napBai` chép luật nợ, em thôi học / lưu trữ vẫn trễ (pb2-b) — Q2 | Đã sửa | `server/src/phanTich/giaoVien.ts:112` (`dang_hoc` từ `HV_DANG_HOC_SQL`), `:190` (`!x.dangHoc` bỏ khỏi Chấm điểm); hằng `server/src/students/tamDung.ts:7` | A:123 (2b), A:161 (2d hai đường), A:172 (2e quét chuỗi) |
| Chấm điểm luật trễ riêng `hôm nay > hạn` (pb2-b) — Q6 | Đã sửa | `server/src/platform/week.ts:101-112` (`mocTreNhapDiem`, `quaHanNhapDiem` gọi lại); `giaoVien.ts:191-199` (quá hạn, đúng hạn, số ngày trễ đều theo mốc) | A:197 (3a), A:214 (3c), A:223 (3d) |
| Xử lý vi phạm: em Tạm dừng vẫn trễ (pb2-b) — Q2 | Đã sửa | `giaoVien.ts:301` (JOIN `students` + `HV_DANG_HOC_SQL`) | A:143 (2c) |
| Gán người theo `class_id` hiện tại (pb2-b) — Q19 | Đã sửa | `giaoVien.ts:125-138` (`lopLucThi`, ghi danh nạp theo lô), `:142-145` (ô mang lớp lúc thi); Kết quả / Tiến bộ dùng `x.classId` đó (`:226`, `:259`) | A:271 (4a) |
| Thiếu phép kiểm Task 4 (a)(b)(c)(d) (pb2-b) | Đã sửa | — (phép kiểm) | (a) A:161 (2d) · (b)+(c) A:287 (4b/4c) · (d) A:271 (4a) |
| Lưu "Sửa phân công" FOU tự gán G+V (pb2-b) — Q3 | Đã sửa | `shared/domain/phanCong.ts:42-47` (có môn gộp trống → tách); `web/src/modules/classes/TeacherAssignPanel.tsx:57-59` | A:453 (11b) |
| Lớp tôi dạy đếm HV, không đếm bài (tich-hop) — Q10 | Đã sửa | `server/src/worklist/tongQuan.ts:231-236` (`noDiemCuaGv`, khoá `baiId`), `:281-292` (`oLopToiDay` `bai-cho` / `bai-qua-han`); web `web/src/modules/worklist/LopToiDay.tsx:43-55` (`SoLieuO`, bỏ `/my-work`) | B:184 (D10 hai đường), `prVaiA.tests.ts` (8c) sửa kỳ vọng |
| "em chưa có lệnh chuyển lớp" hạn đã qua vẫn Cần làm (tich-hop) | Đã sửa | `tongQuan.ts:84-87` (`lenhQuaHan`), `:125-129` (chữ "quá hạn từ {tuần}") | B:236 |
| Q6 thiếu vế "m bài chưa có người chấm" (tich-hop = vai-a) | Đã sửa | `tongQuan.ts:139-145` (cùng tập `bai-qua-han-nhap-diem`, ô không người); chú thích `ponytail:` cũ đã xoá | B:222, `prVaiA.tests.ts` (sửa kỳ vọng `kem`) |
| Việc tiếp theo / chip Quá hạn / badge theo hạn trơn (uxf-a) — Q6 | Đã sửa | `shared/domain/hocVienLop.ts:363-367` (`tre = n.quaHan`); `server/src/classes/dongHocVien.ts:79-91` (hạn hiện = hạn ô quá hạn) | A:206 (3b), A:223 (3d) |
| `urgencyOf` nhóm nhập điểm theo hạn trơn (uxf-a = vai-a) — Q6 | Đã sửa | `server/src/worklist/mywork.ts:351-356` (bucket `quaHan` từ cờ ô), `:376` | A:206 (3b), A:223 (3d), A:233 (3e hai đường) |
| T65: badge "n bài chờ chấm" + Lịch Test đếm em Tạm dừng (uxf-a) — Q2 | Đã sửa | `server/src/classes/classes.ts:170`; `server/src/cham/canCham.ts:452`; danh sách badge mở: `attempts.ts:598` | A:110 (2a, badge = danh sách) |
| `/signals` N+1 theo chi nhánh, không trần (uxf-a) | Đã sửa | `server/src/worklist/signals.ts:85-111` (`metricSet` một lần, chia theo `homeBranchId` / `lopCuaTap`); trần `server/src/tests/tocDoDuong.ts:47, :271-272` | B:92 (hai đường + số câu không tăng theo chi nhánh) |
| Phối hợp SOS đếm lượt lớp thường (vai-a) — Q11 | Đã sửa | `server/src/yThuc/phoiHop.ts:307` (`COALESCE(a.kind,'mock') = 'mock'`) | A:383 (10a) |
| `bao_len` rơi vào Để biết (vai-a) — Q12 | Đã sửa | `shared/domain/duongHoSo.ts:119`; `server/src/platform/thongBao.ts` (`con_viec` nhánh `yeu_cau_duyet` gồm `bao_len`, `ycd.trang_thai = 'cho'`); gửi với `entityType: 'yeu_cau_duyet'` (`duyet/yeuCau.ts:107-110`) | A:395 (10b), `prVaiA.tests.ts` danh sách kiểm có `bao_len` |
| Lớp tôi dạy: khung nhớ chung khoá với QL (vai-a) — Q7 | Đã sửa | `web/src/ui/CongTacKhung.tsx:13-16` (khoá `.u{userId}`), đặt ở `web/src/lib/session.tsx:69` (trong render, trước trang con); `LopToiDay.tsx:31-33` (`khungLopToiDay` rơi về khung mặc định) | B:215 (D7) |
| Link Tổng quan → Công việc thiếu `khung=tat-ca` (vai-a) — Q13 | Đã sửa | `web/src/modules/worklist/ViecCuaToi.tsx:78, :111`; `tongQuan.ts:108, :118` (`den` Cần xử lý) | B:208 (D13), `prVaiA.tests.ts` (sửa kỳ vọng `den`) |
| Trang đầu gọi lặp route nặng (vai-a) — Q14 | Đã sửa | `web/src/lib/useApi.ts:9-21` (gộp GET đang bay, xoá khi xong / khi `invalidate`); `web/src/App.tsx:85-86` (badge đọc `/my-work`); `LopToiDay.tsx` bỏ `/my-work`; route `/my-work/dem` đã xoá (`routes/index.ts:401`) | B:80 (12), `tocDo.run.ts:567` + `tocDoDuong.ts:670-679` (tải trang đầu, mỗi GET một lần) |
| Hành trình: chương em Tạm dừng như đã rời (vai-b) — Q17 | Đã sửa | `server/src/students/hanhTrinh.ts:308-318` (`paused` chưa `ended_at` = đang học, `tuanHocTai`); `den` chương cũ qua `tuanHocTai(…, ended_at − 1)`; hàm chung `shared/domain/hienThiNgay.ts:51-58` | B:408, B:428, B:440 (7) |
| Ngăn Case ghi "Quá hạn" khi em Tạm dừng (vai-b) | Đã sửa | `web/src/modules/students/NganCase.tsx:168-169, :175` | B:549 (quét chuỗi) |
| Thanh việc bỏ sót "Đề ra PA" (vai-b) — Q5 | Đã sửa | `server/src/students/viecHocVien.ts:70-74` (`support:{caseId}`, người làm = `c.ownerId`); `shared/domain/hoSoHocVien.ts:168` (`VIEC_HOC_THUAT` có `de-ra-pa`) | B:283 (hai đường khoá + hạn, câu tóm tắt) |

## Bốn chỗ soi kỹ

1. **Cổng gộp `110ec147`.** Hai nhánh cùng sửa 5 tệp: kế hoạch, `luatLoTrinh.ts`, `prVaiA.tests.ts`, `run.ts`, `signals.ts`. `git show --remerge-diff` cho thấy chỉ `signals.ts` xung đột, và chỉ ở dòng import. Bản gộp giữ cả hai import. `HV_DANG_HOC_SQL` vẫn dùng ở `signals.ts:119`. `lopCuaTap`/`tuSo` vẫn dùng ở `:85-111`. Các tệp tự gộp vẫn đủ phần của cả hai PR:
   - `luatLoTrinh.ts:306` còn `chotHanXuLy` (S6F-a), `:366` còn `tuanHocTai` (S6F-b);
   - `run.ts:9830-9834` đăng ký cả hai bộ phép kiểm;
   - `prVaiA.tests.ts` còn `bao_len` (S6F-a) và các kỳ vọng sửa của S6F-b.

   Không mất phần nào.
2. **P0 cả hai đường.** FT đã sửa. Lớp thường vốn đã đúng và nay có phép kiểm khoá lại (1c). Chỉ hai hàm `saveScore`/`saveRegularScore` ghi `nhap_dau_ngay`; không còn đường ghi điểm thứ ba.
3. **D14.** Trên Tổng quan QL, `DaiChoDuyet` và `KhoiCanXuLy` là hai khối ngang hàng, mount cùng một lượt vẽ. Chúng gọi cùng một đường nên dùng chung một lời gọi. Trên Tổng quan GV, `OverviewPage` nạp ngay (không lazy). Badge App và `ViecCuaToi` vì thế mount cùng lượt, dùng chung `/my-work`. `/my-work/dem` đã xoá; web không còn gọi `/my-work/dem`, `/cases/queues`, `baiChoChamTheoLop`. Trang đầu không còn gọi lặp route nặng.
4. **D17.** Ba nơi máy chủ cùng gọi `tuanHocTai` và cùng nguồn `khoangTamDung`:
   - đầu hồ sơ `profile.ts:483`;
   - panel một em `luatLoTrinh.ts:366`;
   - panel cả lớp `transition.ts:180`.

   Chương Hành trình (`hanhTrinh.ts:312`) cũng gọi `tuanHocTai`. Bộ lọc "dừng và quay lại cùng tuần" ở đó cho cùng kết quả: `tuanHocFt` vốn không trừ tuần nào trong ca này. Cả bốn chỗ hiện chữ qua `chuTuanHoc(…, dangDung)`. Phép kiểm B:527, B:539 và B:408 cho ra cùng một số.

   Còn hai giới hạn:
   - Theo Nhật ký S6F-b, em có ghi danh `paused` không mở được panel Chuyển lớp / Lên lớp. Phép kiểm vì thế dựng khoảng dừng trên em còn ghi danh `active`.
   - Một ca lệch số có từ trước PR, xem P2 #1.

## Lỗi mới

### [P2] Chương Hành trình lấy lộ trình theo ngày vào lớp → lệch số tuần học đầu hồ sơ khi đổi lộ trình mà không đổi lớp
- Chỗ: `server/src/students/hanhTrinh.ts:296, :310-312`, so với `server/src/students/profile.ts:757` và `:478-483`.
- Lỗi: hai nơi chọn lộ trình khác nhau.
  - Chương chọn lộ trình bắt đầu muộn nhất **trước ngày vào lớp** (`ftCuaNgay(e.started_at)`).
  - Đầu hồ sơ, panel Chuyển lớp và panel cả lớp chọn lộ trình **đang chạy** (`status = 'active'`).
  - Đổi lộ trình (`createCycle`, `fasttrack/cycles.ts:122-148`) giữ nguyên ghi danh, nên hai cách chọn ra hai lộ trình khác nhau.
- Tình huống: em vào MB FT 101 ngày 03/08 với lộ trình LT1. Ngày 14/09, Quản lý mở lộ trình RF mà không chuyển lớp.
  - Đầu hồ sơ ghi "tuần học thứ 1", tính từ RF.
  - Chương MB FT 101 ghi "tuần học thứ 7", tính từ LT1.
  - Hai số này trái D17 ("một hàm, một số"). Có từ trước PR, không phải hồi quy.
- Sửa: với chương đang học, lấy lộ trình đang chạy, như `dongThongTin`. Với chương cũ, giữ `ftCuaNgay`.
- Nguồn luật: Q17 (D17), Global Constraints "tuần học đầu hồ sơ = trục".

### [P2] Phép kiểm "tải trang đầu" là danh sách GET chép tay — không bắt được hồi quy ở web
- Chỗ: `server/src/tests/tocDoDuong.ts:670-679`, `server/src/tests/tocDo.run.ts:567-584`
- Lỗi: phép kiểm gọi một danh sách URL cố định, ghi từ log mạng ngày 01/10, rồi cộng số câu SQL. Nếu một khối web sau này thêm `useApi` gọi lại route nặng, phép kiểm vẫn xanh. Chỉ phép quét chuỗi B:80 giữ được `useApi` và badge.
- Tình huống: một PR sau thêm khối trên Tổng quan GV gọi `/my-work?…` có tham số (khác đường dẫn, nên không được gộp). Kết quả: `myWork` chạy hai lần, mọi phép kiểm vẫn xanh.
- Sửa: chấp nhận được với `ponytail:`. Ghi ở KIỂM 16 rằng phải bấm thử lại log mạng mỗi khi sửa Tổng quan. Hoặc PR-Dọn thêm một phép quét chuỗi: đếm số `useApi(` theo route trong `OverviewPage` và các khối con.
- Nguồn luật: Q14 (D14).

### [P2] "Đề ra PA": Công việc không có người làm, hồ sơ gán người phụ trách Case (đã ghi ở Nhật ký, chưa ghi thành mục chuyển)
- Chỗ: `server/src/worklist/mywork.ts:668` (`ownerId: null, mine: false`), so với `server/src/students/viecHocVien.ts:73` (`nguoiId: c.ownerId`).
- Lỗi: Q5 yêu cầu "cùng người làm" và "số việc hồ sơ = số việc Công việc". Hai đường đã cùng khoá và cùng hạn, nhưng khác người làm:
  - Công việc giao việc cho mọi người có `SOS_EDIT` theo kỹ năng;
  - hồ sơ chỉ giao cho người phụ trách Case.
- Tình huống: GV dạy đúng kỹ năng nhưng không phụ trách Case. Công việc của GV này có dòng "Đề ra PA" của em X. Hồ sơ em X lại xếp việc đó vào "việc người khác".
- Sửa: chủ sản phẩm / planning chọn một người làm cho `no_plan` (nên chọn người phụ trách Case, như `nguoiLamCua`), rồi sửa `mywork.ts` cho khớp. Phép kiểm B:283 khi đó so cả người làm.
- Nguồn luật: Q5 (D5); Nhật ký S6F-b Task 8.

## Đã kiểm, không có lỗi
- `HV_DANG_HOC_SQL` dùng ở `scoreDebt.ts:34`, `attempts.ts:598`, `classes.ts:170`, `canCham.ts:452`, `giaoVien.ts:112, :301`, `signals.ts:119`.
- `lopLucThi` (`giaoVien.ts:131-135`) xử lý đúng ca chuyển lớp vào Thứ Hai tuần thi: ghi danh cũ có `den = tuan` bị loại.
- `tapChamDiem`: đúng hạn khi `nhapDau ≤ mocTreNhapDiem`; số này khớp `quaHanNhapDiem` (quá hạn ⇔ hôm nay > mốc).
- `useApi`: listener xoá `dangBay` đăng ký lúc nạp module, nên chạy trước listener tải lại của từng `useApi`. Lời gọi sau `invalidate` không dùng lại promise cũ.
- `CongTacKhung`: `datNguoiDungKhung` chạy trong render của `SessionProvider`, trước trang con. Trang không vẽ khi phiên đang nạp (`App.tsx:90`).
- Q6 vế m: `CAN_XU_LY` luôn có `bai-qua-han-nhap-diem` (`shared/domain/tongQuan.ts:101`), nên `sets.get(...)!` không rỗng.
- Phân tích GV, panel: `gv` ngoài chi nhánh → 404 (`giaoVien.ts:411`, A:322).
- Chặn ngày Tạm dừng trước lần Quay lại: `students.ts:264-267` (B:562).

## Chuyển cho PR khác (đã có ở Nhật ký, nhắc lại để planning gom)
- Khoảng 30 điều kiện "em đang học" còn viết tay ngoài tệp luật nợ (ví dụ `keHoachTest.ts:85, :98`, `mywork.ts:901, :1044`, `metrics.ts:557, :683`) → **PR-Dọn** (Nhật ký S6F-a, lệch (a)).
- Việc nhập điểm còn tính lớp đã kết thúc, Nợ điểm thì không. Phép kiểm A:233 (3e) né bằng cách chỉ so lớp đang hoạt động → **planning / PR-Dọn**.
- Khoá trần cũ `/classes/5/…` không còn khớp id lớp thường → **PR-Dọn** (Nhật ký S6F-b, Task 12).
- Em ghi danh `paused` không mở được panel Chuyển lớp / Lên lớp. Nếu chủ sản phẩm muốn QL chuyển lớp cho em đang dừng → **planning**.
