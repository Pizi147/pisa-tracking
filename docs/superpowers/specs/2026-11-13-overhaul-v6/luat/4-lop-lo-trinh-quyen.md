# Luật core 4 — Vai, lớp, lộ trình, chuyển lớp, thi thật, lưu trữ, hộp duyệt

Hiện trạng 13/11, không đề xuất đổi luật. `ss/` = `server/src/` · `sd/` = `shared/domain/` · RB = `thiet-ke/PISA-Rulebook-2026-09-19.md` · QC = quy chế lớp thường, bản chép `thiet-ke/nguon-27-09/NGUON_QUY_DINH_LOP_THUONG.md` (xem 6.1) · N… = `plan.md` 1.6. Số ngày là bản gốc; Quản trị đổi được ở Hạn mặc định.

## 1. Vai × quyền

Quyền = vai × chi nhánh được cấp × phân công lớp, kỹ năng. Nguồn: `ss/seed/data.ts:49-108` · `ss/permissions.ts:477-582` · `ss/platform/nav.ts:16` · trang đầu `web/src/modules/worklist/OverviewPage.tsx:34`.

| Vai | Trang đầu | Làm được | Chỉ xem | Phạm vi |
|---|---|---|---|---|
| Quản trị hệ thống | Bảng chi nhánh | Mọi việc của QL; tài khoản, cấu hình, Đã xoá | — | Toàn hệ thống |
| Quản lý | Lớp cần chú ý + Chờ bạn duyệt | Lịch Test, sửa điểm; duyệt; lớp, phân công GV; chốt hướng, chuyển lớp, Xét lại, Kỳ vọng; Target, lưu trữ, xoá em; Vận hành | — | Chi nhánh |
| Giáo viên | Việc của tôi + lớp tôi dạy | Điểm, Case, PA đúng kỹ năng; báo Case, ghi vi phạm cả lớp; bàn giao môn mình; có kỹ năng S: chấm S chéo lớp FT | Kỹ năng khác; Kế hoạch Test; lớp cũ (L-04) | Lớp được phân công |
| GVCN (phân công, không phải vai) | như GV | Thêm: sửa thông tin, thêm em; Tạm dừng/ Kết thúc học; môn, lộ trình; Ý thức; đề xuất chuyển lớp, sửa Target; phân công GVBM; lịch lớp thường; xác nhận bàn giao | Không được: Target, quyết định chuyển lớp, chốt hướng, duyệt | Lớp chủ nhiệm |
| Admin văn phòng | Mock Test + lịch sắp tới | Xếp, dời lịch Test; sửa điểm hộ; thông tin em, lộ trình; lịch lớp thường; Xuất báo cáo PH | Case, Ý thức, Phân tích | Chi nhánh |
| Tư vấn viên | "HV của tôi" | Thông tin em, Target, môn, lộ trình; trạng thái em; KQ thi thật; Bước tiếp; Báo PH; tạo lớp, thêm em | Điểm, Case, PA, Ý thức | Chi nhánh; mặc định em của mình |
| CX | Bảng chi nhánh | Như TVV, trừ Bước tiếp, môn, KCK; không giữ việc | Như TVV | Toàn hệ thống |
| Head tutor | Như trang GV | Trang Tutor (đang ẩn) | — | Toàn hệ thống |

## 2. Luật core

| Mã | Luật | Nguồn | Mã thực thi | Khớp? |
|---|---|---|---|---|
| L-01 | GVCN, GVBM suy từ phân công. GV xem cả lớp, sửa đúng kỹ năng. Hồ sơ em, Ý thức: GVCN lớp em đang học. | RB §20.9 | `ss/permissions.ts:477-569` | Khớp |
| L-02 | FT: lộ trình LT1 · LT2 · RF · Khác, chấm band. Lớp thường: Pre FOU 5 tuần, FOU 8, BE, ELE 10; chấm %. | RB §20.6 | `sd/normal.ts:256-276` | Khớp |
| L-03 | Phân công theo ô: GVCN + từng kỹ năng. Đổi GV "Ngay hôm nay" hoặc "Từ tuần…". Case, PA mở sang GV mới; điểm cũ giữ tên GV cũ. | N29 | `sd/phanCongGv.ts:24-63` | Khớp |
| L-04 | GV cũ chỉ xem lớp cũ ≥ 7 ngày và tới khi bàn giao xong; không tính vào việc, chỉ số. | N29 | `ss/permissions.ts:89`, `:443`, `:651` | Khớp |
| L-05 | Lớp hết em, không kế hoạch nhận em, 7 ngày liền → máy Kết thúc lớp, vào Lưu trữ. Mở lại được. | plan.md:527 | `ss/classes/xoaKetThucLop.ts:180-211` | Khớp |
| L-06 | Lộ trình theo em, không theo lớp; luật MT theo lộ trình em. Đổi: QL, GVCN, TVV, Admin. Lượt có điểm đứng yên. | plan.md:273 | `ss/fasttrack/monDangKy.ts:59` | Lệch 6.5 |
| L-07 | Môn đăng ký (chỉ FT): QL, GVCN, TVV đổi. Môn không học không thành việc; thiếu bộ môn thì Overall không kết luận. | N13 | `ss/fasttrack/monDangKy.ts:50-69` | Khớp |
| L-08 | Target: QL, TVV, CX sửa, phải có lý do. GVCN gửi "Đề xuất sửa". | RB §20.9 | `ss/fasttrack/cycles.ts:287`, `:514` | Lệch 6.4 |
| L-09 | Em: đang học · tạm dừng · kết thúc. Một nút "Tạm dừng/ Kết thúc học"; cả hai vào Lưu trữ. Tạm dừng giữ lớp, dừng hạn. Em kết thúc quay lại: chỉ QL. | N11 | `ss/students/students.ts:245-258`, `:385` | Khớp |
| L-10 | Pass ≥ 70 %. Final: < 50 học lại + báo PH · 50–59 QL cân nhắc · 60–69 lên + bổ trợ · ≥ 70 Pass. Máy tự ghi "Kết quả đầu ra". | QC III; N17 | `sd/cuoiKhoa.ts:29`, `:133-154` | Khớp |
| L-11 | Bổ trợ miễn phí khi lên: mỗi môn trượt 2 buổi (50–59), 1 buổi (60–69); ELE, BE → FT không có. GV cũ dạy. Xong làm Mini Test, hạn + 2 ngày. | QC III; RB §20.6 | `sd/cuoiKhoa.ts:124`, `:162`, `:200` | Lệch 6.8 |
| L-12 | Chỉ QL chốt hướng; GVCN ghi Nhận xét, không bắt buộc. Hạn T5 tuần trước Final; quá hạn không chặn. Cả lớp chỉ sang lớp cùng chi nhánh. | N17, N20, N22 | `sd/chuyenLop.ts:92`; `ss/classes/lenhChuyen.ts:156`, `:837` | Lệch 6.9 |
| L-13 | Lên FT: có MT0 tuần Final, cần Target. Kỳ vọng: QL đánh, máy gợi ý theo MT0 (FOU, BE ≥ 4.0 · ELE ≥ 4.5). Không đạt do Trung tâm → Case + Tutor 10 buổi/kỹ năng; do Học viên → ghi phương án. | QC IV; N17, N22 | `sd/cuoiKhoa.ts:210`; `ss/normal/kyVong.ts:99`, `:205` | Lệch 6.7 |
| L-14 | Xét lại: lên mà Final < 50 · chốt trước Final, lên mà 50–59 · học lại mà ≥ 60 · Mini Test < 70. QL lớp em đang học quyết. Hết hạn máy ghi "Tiếp tục". | N21 | `sd/cuoiKhoa.ts:57-88`; `ss/normal/xetLai.ts:69` | Khớp |
| L-15 | Chỉ QL lớp nguồn quyết định chuyển lớp; GVCN đề xuất. Bắt đầu "Ngay hôm nay" hoặc Thứ Hai sau; máy tự chuyển. | RB §20.7 | `ss/classes/lenhChuyen.ts:83`, `:883` | Lệch 6.11 |
| L-16 | Một em: mọi chi nhánh. Quanh tuần Final chọn được "theo luồng chuyển tiếp". Bậc vi phạm giữ, trừ khi tích "Reset bậc". | N24, N25, N36 | `ss/classes/luatLoTrinh.ts:71`; `ss/classes/lenhChuyen.ts:190` | Lệch 6.11 |
| L-17 | Bàn giao chuyển lớp: GVBM một câu mỗi em, môn mình (W1, W2 riêng); GVCN lớp cũ nhận xét chung + Xác nhận. Hạn: 7 ngày tính cả ngày quyết định, hoặc CN tuần Final nếu muộn hơn. Quá hạn em vẫn chuyển. Dừng học không phiếu. | RB §20.7; N31 | `sd/chuyenLop.ts:82-110`; `ss/classes/banGiao.ts:34` | Lệch 6.2 |
| L-18 | Bàn giao đổi GV: GV cũ viết, 5 ngày; GV cũ nghỉ → GVCN → QL. Kỹ năng ở lớp mới vẫn đúng GV cũ dạy → không cần bàn giao. | N29 | `sd/phanCongGv.ts:80`; `ss/classes/banGiao.ts:77` | Khớp |
| L-19 | Lịch thi: chưa có · dự kiến · chưa chốt ngày · đã chốt ngày · đã thi. | RB §21.2 | `sd/lichThiOv15f.ts:44` | Khớp |
| L-20 | KQ thi thật: việc TVV của em (chưa có TVV → QL), không hạn. Máy tính Overall, Đạt / Chưa đạt Target. | N6 | `ss/loTrinh/thiThat.ts:48`, `:256` | Khớp |
| L-21 | Thi thật không tự kết thúc lộ trình. Có KQ → chọn Bước tiếp: Tạm dừng/ Kết thúc học · Lộ trình mới (Target giữ, đầu vào = KQ thi thật, Case cũ đóng). QL, TVV chọn. | N6, N12 | `ss/loTrinh/buocTiep.ts:1`; `sd/tongKetLoTrinh.ts:137` | Lệch 6.6 |
| L-22 | Tổng kết lộ trình: số đóng băng; đầu vào + mọi MT đủ 5 kỹ năng. Bấm điểm thi thật → % tuần dạy từng GV. | plan.md:339; #1500, #1505 | `ss/loTrinh/tongKet.ts:1`; `ss/phanTich/tuanDay.ts` | Khớp |
| L-23 | Lưu trữ = chỗ ẩn: lớp đã kết thúc, em tạm dừng, kết thúc. Hồ sơ khoá, trừ KQ thi thật, Sửa thông tin. | N11; RB §21.1 | `ss/classes/luuTru.ts:34` | Khớp (6.12) |
| L-24 | Thùng rác giữ 30 ngày: em, Case, PA, vi phạm, tệp. Ai xoá được thì khôi phục được. | N28 | `ss/platform/khoiPhucRac.ts:22` | Lệch 6.10 |
| L-25 | Chỉ QL, Quản trị duyệt. Từ chối phải có lý do. QL tự duyệt được thẻ mình gửi. | RB §20.5 | `ss/duyet/yeuCau.ts:554` | Khớp |

## 3. Việc sinh ra (`ss/worklist/mywork.ts`)

Việc điểm, Case, Ý thức, việc TVV: mảng khác đã đọc. Em chưa có TVV thì QL giữ `thi_that`, `buoc_tiep`, Chốt ngày thi, `bo_sung_ho_so`, `bao_ph_yt` (`ss/worklist/viecTvv.ts:18`). Admin chỉ thấy việc chấm (`score`, nhập hộ được) và `xuat_bc_ph`. CX không có việc; chỉ nhận tin Meeting CX/GĐCN (`ss/yThuc/xuLy.ts:960`).

| Việc | Ai làm | Sinh khi | Hạn | Xong khi | Lưu xong thì | Làm thay |
|---|---|---|---|---|---|---|
| **GVCN** `ban_giao` "Bàn giao n em" (`:1073`) | GVCN lớp cũ | Có quyết định chuyển lớp | L-17 | Xác nhận đủ em | Thẻ Báo QL tự đóng | QL |
| `ban_giao` "Bàn giao môn…" (`:1081`) | GVBM | như trên | L-17 | Mọi em có câu môn mình | Tới GVCN xác nhận | GVCN, QL |
| `ban_giao` đổi GV (`:1093`) | GV cũ | Lưu phân công, tích tạo việc | 5 ngày | Đủ góp ý + Xác nhận | GV mới nhận tin | QL khi quá hạn |
| `missing_data` "Điền Target" (`:1381`) | GVCN | Em FT chưa có Target | Không | Có Target | Tính được kỳ vọng MT | Xem 6.4 |
| **QL** `chot_len_ft` "Chốt lộ trình" (`:1034`) | QL lớp | T2 tuần trước Final | T5 tuần đó | Mọi em có quyết định | Tạo MT0, bổ trợ, việc bàn giao; Thứ Hai tự chuyển | Quản trị |
| `xet_lai_lo_trinh` (`:1048`) | QL lớp em đang học | Final, Mini Test lệch hướng (L-14) | CN tuần 2 lớp mới | Quyết từng em | Học lại = quyết định chuyển lớp mới | Quản trị |
| `ky_vong_dau_ra` "Kỳ vọng" (`:1587`) | QL | Em Lên FT có MT0 đủ 3 kỹ năng | Không | Mọi em có Đạt / Không đạt | Không đạt do Trung tâm → Case + PA Tutor cho GVBM lớp FT | Quản trị |
| `missing_data` "Nhập ngày thi / Xếp lịch MT" (`:1447`) | QL | PA quy chế chưa có mốc | Không | Có lịch | PA có mốc kết quả cuối | Bỏ qua được |
| `no_owner` "Phân công GV…" (`:1486`) | QL | Case mở, lớp thiếu GV môn hoặc GVCN | Không | Phân công xong | Case về người đó | — |
| `mgmt` "Việc được giao" (`:1617`) | Người được giao | QL giao ở Vận hành | Người giao đặt | Ghi Hoàn thành | Không đóng Case | QL |
| **Admin** `xuat_bc_ph` (`:1413`) | Chỉ Admin | Lớp đủ báo cáo PH, hoặc đợt quá hạn còn thiếu | Chỉ dòng thiếu | Tự rời sau 7 ngày | — | Không |

## 4. Hộp duyệt của QL (`sd/yeuCauDuyet.ts:51-78`, `ss/duyet/loaiYeuCau.ts`)

Hạn chung 5 ngày, tính cả ngày gửi. Quá hạn: thẻ đỏ + tin cho QL, Quản trị (`ss/duyet/yeuCau.ts:247`). Thẻ hết ý nghĩa tự đóng.

| Thẻ | Ai gửi | Quá hạn | QL cần thấy |
|---|---|---|---|
| Đề xuất PA · Đổi PA `de_xuat_pa` | GV kỹ năng | Vẫn chờ | Case, MT, PA gốc → PA mới, người dạy, lý do |
| PA khác quy chế `giu_pa_gv` (hạn: ngày gửi + 3) | GV kỹ năng | Máy chốt theo PA của GV (`ss/cases/sosAuto.ts:268`) | PA quy chế ↔ PA của GV, lý do |
| Xin ý kiến `xin_y_kien` | GV | Vẫn chờ; PA không dừng | Câu hỏi, kết quả tuần; chỉ "Trả lời" |
| Không cần theo dõi `khong_theo_doi` | GVBM | Vẫn chờ | Case, điểm, lý do |
| Xin xoá `xin_xoa` (Case SOS, PA quy chế) | GV | Vẫn chờ | Xoá gì, kèm mấy PA |
| Xử lý Ý thức `y_thuc` | GVCN lưu khác mặc định | Máy chốt theo GVCN, sinh việc Báo PH cho TVV (`ss/yThuc/xuLy.ts:1012`) | Cách lưu, bậc kế, số vi phạm, bằng chứng |
| Thu hồi xử lý `thu_hoi_y_thuc` | GVCN | Vẫn chờ | Bậc về, số vi phạm, TVV đã báo PH chưa |
| Đề xuất sửa `sua_thong_tin` | GV lớp em | Vẫn chờ | Cũ → mới, lý do. Target, lộ trình: máy tự áp |
| Đề xuất chuyển lớp `de_xuat_chuyen_lop` | GVCN | Vẫn chờ | Lớp, tuần, lý do, Reset bậc; Duyệt = mở panel chuyển lớp điền sẵn |
| Dời lịch Test lần 2 `lich_thi` | Không còn tạo mới | Kỹ năng bị huỷ | Chỉ thẻ cũ |
| Báo QL (không duyệt) | Máy | Tự đóng khi việc gốc xong | Case quá hạn xác nhận · Ý thức quá hạn · Bàn giao quá hạn · Mini Test chưa đạt · Final dời quá hạn |

## 5. Người làm cần thấy gì tại chỗ làm

- **Chốt hướng (QL):** mỗi em: % Final từng môn, gợi ý máy, Nhận xét GVCN, Target, lớp đích, tuần. Mặc định = gợi ý theo dải; 50–59 tự chọn. Chọn khác gợi ý phải ghi lý do (`sd/chuyenLop.ts:184`). Trước khi lưu: số Case bổ trợ, việc Báo PH, Case Tutor sẽ sinh (`sd/cuoiKhoa.ts:188`). "Ngay hôm nay": hỏi lại, nêu tên em.
- **Xét lại (QL):** Final từng môn, ai chốt + lý do, PH đã được báo chưa, bổ trợ + Mini Test. Không làm gì = "Tiếp tục". Tiếp tục khi Final < 50 phải ghi lý do (`ss/normal/xetLai.ts:345`).
- **Chuyển lớp một em:** ô lớp (chỉ lớp hợp lệ), tuần (mặc định tuần sau), lý do. Khối "Khi chuyển, web sẽ": điểm đi theo hay ở lại, MT0, Case.
- **Bàn giao:** phần tự điền (kết quả, bậc vi phạm, Case mở), ô viết từng em, môn "Cùng GV · không cần", ai còn thiếu, hạn. QL làm thay lúc GVCN còn hạn: bị hỏi lại (`ss/classes/banGiao.ts:52`).
- **Bước tiếp sau thi:** L R W S, Overall, Đạt / Chưa đạt Target, hạn. Lộ trình mới: lộ trình gợi ý, lớp, môn, Target; khối "Khi lưu, web sẽ": MT tạo mới, đầu vào, Case và PA đóng (`ss/loTrinh/buocTiep.ts:155`).

## 6. Chỗ lệch / chưa rõ

1. Quy chế docx gốc **không đọc được**: `D:\Download` không có tệp. Dùng bản chép 27/09.
2. **Hạn bàn giao chuyển lớp.** Mã: 7 ngày tính cả ngày quyết định (`sd/chuyenLop.ts:82`). Chữ trên web còn "GVBM 2 ngày, GVCN 3 ngày" (`mywork.ts:336`).
3. **Thẻ "Dời lịch Test".** N4, N15, N32 còn nói gửi QL; mã không tạo thẻ mới từ N38 (`ss/fasttrack/absence.ts:24-30`).
4. **Target.** RB §20.9 "chỉ QL"; mã cho TVV, CX. Việc "Điền Target" giao GVCN, nhưng GVCN chỉ gửi được Đề xuất sửa. Chỗ thiếu đó cũng thuộc việc TVV "Bổ sung hồ sơ thiếu".
5. Đổi lộ trình: plan.md:275 ghi 4 vai; lời gốc plan.md:273 và mã có thêm Admin.
6. **Bước tiếp.** Chữ giải thích việc ghi 3 lựa chọn (`mywork.ts:269`); N12 là 2 hướng. Hạn trong mã: mốc muộn hơn của ngày thi + 7 và ngày có KQ + 7. N6 ghi "TVV của em"; mã cho mọi TVV chi nhánh chọn (`ss/permissions.ts:794`). "Thi thật không tự kết thúc": lời chủ SP 27/10, không thấy dòng riêng ở plan.md 1.6.
7. Kỳ vọng: QC chỉ nêu BE, ELE; web thêm FOU. Việc `ky_vong_dau_ra`, `no_owner` không tính "Của tôi" (`mine: false`), khác Chốt lộ trình, Xét lại.
8. Mini Test: QC "trên 70 %", mã "từ 70 %". Em < 50 % mà QL cho lên: không bổ trợ (`sd/cuoiKhoa.ts:145`). RB §20.13 P04, P05 chưa chốt.
9. QC: 50–59 "Head phối hợp GV đánh giá"; kế hoạch bài giảng gửi Head duyệt. Web: GVCN chỉ nhận xét; bỏ duyệt kế hoạch; Pre FOU không có Progress Test.
10. Xoá em, xoá lớp trống: RB §20.9 "chỉ Quản trị"; mã QL làm được (`ss/students/xoaHocVien.ts:226`).
11. Lý do đề xuất chuyển lớp: RB đòi ≥ 15 ký tự, mã không (`lenhChuyen.ts:907`) · N25 ghi "tuần 9–10", mã tính theo tuần Final từng chương trình · GVCN cũ cũng là GVCN lớp mới thì nhận xét chung không bắt buộc: PTA đoán (`banGiao.ts:79`).
12. Chưa đọc kỹ: Báo cáo tuần (`ss/worklist/meeting.ts`); "điểm đi theo khi chuyển lớp" (theo RB §20.7); lịch quét đêm của thẻ duyệt; hồ sơ em tạm dừng khoá tới đâu.
