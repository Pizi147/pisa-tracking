# Luật đang chạy trong code (nhánh main, HEAD 0aad2a0a, 02/10/2026)

Nguồn: đọc trực tiếp `shared/domain/*.ts` và `server/src/**`. Đường dẫn tính từ gốc repo. "Rulebook" = `thiet-ke/PISA-Rulebook-2026-09-19.md` (số dòng theo bản đang có, 614 dòng).
Quy ước ký hiệu: **QL** = vai `manager` (theo chi nhánh của grant); **QTHT** = vai `system_admin` (grant toàn hệ thống); **GVCN** / **GVBM** không phải vai trong DB mà suy từ `teacher_assignments` (`is_core`, `skill`) của vai `teacher`.

---

## A. Hạn và ngưỡng

| # | Luật | Giá trị / cách tính | file:line | So Rulebook |
|---|---|---|---|---|
| A1 | Hạn xác minh / xác nhận nguyên nhân SOS | 3 ngày, **tính cả ngày đầu** (ghi nhận T2 → hết T4). Hằng `SIGNAL_VERIFY_DAYS=3`; Case SOS tự tạo dùng `hanXacNhan` (3 ngày). Hạn tính từ ngày ghi nhận tín hiệu, không từ tuần thi. Quay lại học sau tạm dừng thì đặt lại hạn từ ngày quay lại | `shared/domain/cases.ts:739,798,807` · `shared/domain/sosV4.ts:15-17` · `server/src/cases/sosAuto.ts:320-333` | Khớp §3.4, §19 |
| A2 | Hạn có PA (Case tạo tay) | `PLAN_DUE_DAYS = {urgent: 3, attention: 5}`. Mã `attention` hiển thị là **"Bình thường"** (5 ngày), `urgent` = "Gấp" (3 ngày). Tính cả ngày đầu, từ ngày Case được tạo/giao; đổi người phụ trách không đặt lại | `shared/domain/cases.ts:513-533,827,837` | Khớp §18.2 điểm 3, §18.6. (§4.2 dòng 125 vẫn ghi "Cần chú ý" — đã lỗi thời, §18.2 thắng) |
| A3 | Mốc PA theo quy chế sau SOS (điền sẵn) | Bảng MT × SOS: MT1/MT2 SOS1-2 = Tự học 1 tháng, SOS3 = Tutor đến MT kế; MT3+ = Tutor đến lúc thi; RF dùng hàng MT3. "1 tháng" = Chủ nhật đầu tiên sau (ngày xác nhận + 30). Mốc tính từ **ngày xác nhận PA** | `shared/domain/sos.ts:54-94` · `shared/domain/sosV4.ts:22-25` · `server/src/cases/sosAuto.ts:346-398` | Khớp §19 |
| A4 | **Hạn ghi kết quả PA hằng tuần** | **Hết Thứ Hai của tuần kế tiếp** tuần chứa ngày ghi: `weeklyUpdateDue = Thứ Hai tuần chứa ngày + 7`. Sau mỗi lần ghi gọi `weeklyUpdateDue(ngàyGhi+1)` nên hạn mới luôn là Thứ Hai sau nữa. "Dự kiến kết thúc" mặc định là Chủ nhật tuần kế (`planEndDefault`) — KHÔNG phải hạn | `shared/domain/cases.ts:847-853` · `shared/domain/policy.ts:19` · `server/src/cases/sosAuto.ts:377` | **KHÁC RULEBOOK**: dòng 137 ("trước hết Chủ nhật hằng tuần") và dòng 400 (C01 "mỗi Chủ nhật") |
| A5 | Hạn duyệt của QL | `HAN_DUYET_NGAY=5` (cả ngày gửi). Theo loại thẻ: Đề xuất PA / Xin ý kiến / Đề xuất sửa / Không cần theo dõi / Xử lý Ý thức cần duyệt / Đề xuất chuyển lớp = 5; **Kế hoạch bổ trợ = 3**; Lịch thi lần 2 = hết CN tuần gửi (xem A10); Báo lên = không hạn. Quá hạn duyệt chỉ thông báo QL + QTHT, không tự đóng (trừ lịch thi) | `shared/domain/cases.ts:744` · `shared/domain/yeuCauDuyet.ts:40-61` · `server/src/duyet/yeuCau.ts:232-251` | Rulebook không nêu hạn duyệt từng loại (thiếu) |
| A6 | Hạn chấm FT | **Hết Thứ Tư tuần kế tiếp** tuần thi của **chính kỹ năng đó** (T2 + 9 ngày). Hạn riêng (`deadline.override`) phải có lý do ≥5 ký tự. Quá hạn chỉ khi tuần thi đã hết (qua Chủ nhật) VÀ qua hạn | `server/src/platform/week.ts:68-70,89-92,102-113` · `server/src/fasttrack/skillSchedule.ts:808-813` | Khớp §9.2 dòng 229 |
| A7 | Hạn chấm lớp thường | **Hết Chủ nhật của chính tuần thi** (T2 + 6) | `server/src/platform/week.ts:89-92` · `server/src/normal/regular.ts:229-236` | Khớp C08 (dòng 407, 519) |
| A8 | Ngưỡng đạt lớp thường | **70%**, so trên tỷ lệ chính xác (23/33 trượt, 7/10 đạt). Ngưỡng cũ 0.6 chỉ để đọc lịch sử. "Cả bài" (Pre FOU / Cuối khoá) = Σđiểm/Σtổng ≥ 70% | `shared/domain/normal.ts:38,51,206-217` · `server/src/normal/regular.ts:177-220` | Khớp §3.3 dòng 86 |
| A8b | Cuối khoá lớp thường: dải % tổng | `<50` · `50–59` · `60–69` · `≥70 Pass`; gợi ý hướng (học lại / lên + bổ trợ miễn phí / QL cân nhắc); Mini Test ≥70% | `shared/domain/cuoiKhoa.ts:19-33,60-100` | **THIẾU trong Rulebook** (chỉ có ở spec 27/09) |
| A9 | Chốt dấu "-" FT | Cron Netlify `5 17,23 * * 0` = **00:05 và 06:05 sáng Thứ Hai giờ VN**; `settleNoShows` chốt tuần có `week_end < ngày`; ngày hiệu lực = 23:59:59 VN Chủ nhật. Còn được gọi ở mọi đường đọc/ghi điểm. Cùng lượt cron còn thi hành lệnh chuyển lớp tới hạn | `server/src/ops/chotVangDinhKy.ts:16,28-31` · `netlify.toml:15-18` · `server/src/fasttrack/absence.ts:654-697,706-762` · `server/src/fasttrack/attempts.ts:895,1495,1590,1760` | Khớp §17.1. Ghi chú: comment "dự án không có cron" ở `shared/domain/fasttrack.ts:276` và `server/src/fasttrack/absence.ts:636` đã lỗi thời |
| A10 | Hạn đề nghị dời lần 2 | `hanDuyetDoiLan2` = **Chủ nhật của tuần chứa NGÀY GỬI** (không phải tuần đích). Tuần đích mặc định = tuần chưa bắt đầu gần nhất không vướng luật thứ tự đợt (thử tối đa 8 tuần). Hết hạn (`decide_by < hôm nay`) → **huỷ phần thi** (FT) — quét `sweepExpiredMoves` **chỉ chạy khi có người mở trang**, không cron | `shared/domain/lichMt.ts:97-102` · `server/src/fasttrack/absence.ts:159-167,260,293,457-484` | Khớp C09 (dòng 408). Độ trễ huỷ phụ thuộc có người mở web |
| A11 | Ý thức — hạn 5 ngày (`HAN_Y_THUC_NGAY`) | Không phải cảnh báo mềm: là **hạn thật** làm vi phạm thành "Quá hạn". (a) vi phạm *Mới*: 5 ngày từ max(ngày ghi, ngày vào lớp); (b) *Bắt buộc xử lý*: có ≥3 vi phạm chưa xử lý xảy ra trong [T2 tuần trước, ngày ghi] → hạn 5 ngày từ ngày ghi; (c) đã QL duyệt chờ thực hiện: 5 ngày từ ngày QL quyết. Em Tạm dừng thì không hạn. Quá hạn → thẻ Báo lên QL (1 thẻ mỗi em) | `shared/domain/yThuc.ts:126,156-208` · `server/src/duyet/loaiYeuCau.ts:365-400` | **KHÁC RULEBOOK**: dòng 430, 475-476 ("chỉ nhắc, không tính quá hạn"), 489-490 (không có hạn) |
| A12 | Khoá sửa điểm (R11) | Đợt **hoàn tất** = mọi kỹ năng bắt buộc có điểm (FT: hoặc đã chốt "-"; lớp thường: chỉ tính điểm) VÀ hôm nay > Chủ nhật của tuần muộn nhất → chỉ người có `plan.week`/`score.override` (QL, QTHT) sửa. **MT lịch sử**: khoá khi hôm nay > (ngày nhập cuối + **7 ngày**). Sửa ô đã có điểm cần lý do ≥5 ký tự (RB-5) | `shared/domain/keHoachTest.ts:69-81` · `server/src/fasttrack/hoanTat.ts:42,109-112` · `shared/domain/chamDiem.ts:124-130` | Khớp dòng 549, 585 (R11 chỉ nằm trong khối PR-MT/PR-XLMT, không có mục riêng) |
| A13 | Hạn bàn giao chuyển lớp | **GVBM 2 ngày, GVCN 3 ngày**, tính cả ngày ra lệnh; quá hạn không chặn việc chuyển; quá 3 ngày hoặc lớp không GVCN thì QL điền/xác nhận thay; quá hạn → thẻ Báo lên bàn giao | `shared/domain/chuyenLop.ts:36-39` · `server/src/classes/banGiao.ts:36-47` · `shared/domain/yeuCauDuyet.ts:54` | **THIẾU trong Rulebook** (dòng 253 chỉ nói "bàn giao") |
| A14 | Lệnh chuyển lớp | QL ra lệnh; tuần bắt đầu phải là Thứ Hai **sau** tuần hiện tại; tới Thứ Hai tự thi hành (cron + quét khi đọc) | `shared/domain/chuyenLop.ts:26-34` · `server/src/classes/lenhChuyen.ts:68` · `server/src/ops/chotVangDinhKy.ts:31` | THIẾU trong Rulebook |
| A15 | Cửa sổ MT lịch sử | `CUA_SO_CASE_LICH_SU_NGAY=28` ngày: chỉ lượt lịch sử có tuần thi kết thúc trong 28 ngày trước ngày tạo mới sinh Case/PA quy chế/Phối hợp | `shared/domain/lichMt.ts:13,37-45` | Khớp dòng 549-550 |
| A16 | Trần MT | `MT_TOI_DA=8`; đánh số liền mạch (MT(n) chỉ tạo khi có MT(n−1)); huỷ cả lượt chỉ với MT cuối chưa điểm/chưa thi | `shared/domain/lichMt.ts:15,48-95` · `server/src/fasttrack/attempts.ts:1269-1316` | Khớp dòng 551, 560 |
| A17 | Kỳ vọng MT | MT1 = target − 1.0; MT2 = target − 0.5; MT3+ = target; **RF: mọi MT = target** (theo lộ trình của lượt). Lịch mặc định: LT MT1/2/3 ở tuần học 6/12/16, RF MT1/2 ở tuần 4/8 | `shared/domain/fasttrack.ts:15-18,21` · `server/src/fasttrack/scoring.ts:110-113` · `shared/domain/lichMt.ts:18-21` | Khớp §3.2, dòng 545 |
| A18 | SOS cho FT | Đếm trên 4 kỹ năng đánh giá: 1 → SOS1, 2 → SOS2, ≥3 → SOS3; W = (W1 + 2·W2)/3 làm tròn 0.5; Writing xét hai tầng (W tổng đạt thì không sinh tín hiệu W1/W2); Overall chỉ khi đủ 4 kỹ năng; kết luận tạm thời khi thiếu điểm (cờ `provisional`) | `server/src/fasttrack/scoring.ts:46-49,84-107,159-238` | Khớp §3.2, §3.1 |
| A19 | SOS / kết luận cho lớp thường | `sosLevel` = số môn <70% (1/2/≥3); chưa đủ điểm mà 0 môn trượt → `null` (không báo "đạt" giả). **Nhưng không hiện nhãn SOS ở lớp thường** (T58). Giữa khoá (FOU/BE/ELE): môn trượt **tự tạo Case + PA "Bổ trợ"**, không tín hiệu "Tạo Case / Bỏ qua". **Cuối khoá: không sinh tín hiệu/Case**, dùng % tổng (A8b). Pre FOU: chỉ Cuối khoá, một ô Tổng hợp | `server/src/normal/regular.ts:177-220,746-838` · `shared/domain/normal.ts:220-224` · `shared/domain/sosV4.ts:59-85` | **KHÁC RULEBOOK**: dòng 89, 540 ("Normal giữ mô hình tín hiệu"), và dòng 85 ("đủ L/R/W/S" — Pre FOU chỉ có ô Tổng hợp, `shared/domain/normal.ts:156-163`) |
| A20 | Hạn khác | Kế hoạch bổ trợ nộp trong 3 ngày (cả `han_ke_hoach` lẫn thẻ duyệt); báo cáo tuần họp: mở 2 ngày cuối tuần, bù đến hết Thứ Tư tuần sau (`REPORT_EDIT_WINDOW_DAYS=2`, `GRACE_DAYS_AFTER_WEEK=3`); công việc quản lý "sắp hạn" = 3 ngày | `server/src/cases/boTro.ts:255-262` · `server/src/platform/week.ts:209,215` · `server/src/worklist/meeting.ts:15` | THIẾU trong Rulebook |

---

## B. Ma trận quyền

**Cách đọc.** Cột QL/QTHT gộp hai vai vì seed cho cả hai gần như cùng bộ quyền (khác duy nhất: `admin.config` + `score.override` chỉ QTHT; QL không có `score.edit` nhưng sửa mọi ô qua `plan.week`). Phạm vi QL = chi nhánh của grant; QTHT = toàn hệ thống. Khi nói "đúng kỹ năng" nghĩa là `teacher_assignments.skill` khớp ô/Case — GVCN **không** có thêm quyền nhờ chủ nhiệm (C02 `gvcn-dung-mon`, `shared/domain/policy.ts:33`).

Vai/quyền gốc: `server/src/seed/data.ts:45-81`. Quyền riêng cho cá nhân (`user_permissions`) cộng thêm như một grant: `server/src/permissions.ts:84-110`. QTHT sửa được quyền của vai lúc chạy: `server/src/platform/sysconfig.ts:211-235`.
**Admin chi nhánh đã bỏ**: vai `branch_admin` ở trạng thái `retired`, bị xoá hết quyền và grant (`server/src/migrate.ts:1895-1930`, `server/src/seed/data.ts:37-39`, `shared/domain/people.ts:11-31`). Không còn tham chiếu logic nào tới nó. Khớp dòng 242.

| Hành động | QL / QTHT | GVCN | GVBM đúng kỹ năng | GV khác trong lớp | file:line |
|---|---|---|---|---|---|
| Nhập điểm FT (ô trống, đợt chưa hoàn tất) | ✓ mọi ô, mọi lúc (đường `override`, đổi ô đã có thì cần lý do) | chỉ ô môn mình dạy (như GVBM) | ✓ đúng ô (W1 và W2 là hai ô riêng) | ✗ | `server/src/permissions.ts:344-349,516-532,577-586` · `server/src/fasttrack/attempts.ts:1451-1490` |
| Nhập ô **S** Mock của lớp FT khác | ✓ | — | **GV được phân công Speaking** ở một lớp FT nhập được ô S của **mọi lớp FT cùng chi nhánh** (quyền, không phải việc/nợ); lớp thường không áp | ✗ | `server/src/permissions.ts:279-298,530,581` |
| Nhập điểm lớp thường (đạt/tổng) | ✓ | như GVBM nếu có ô | ✓ đúng ô (`writing` = W/G+V, `speaking` = S/P); Pre FOU: GVCN tự nhận ô `tong_hop` | ✗ | `server/src/normal/regular.ts:461-505` · `shared/domain/phanCong.ts:84-89` |
| Nhập MT lịch sử | ✓ mọi ô (sửa ô có điểm cần lý do) | ✓ **ô trống** cả 4 kỹ năng | theo ô đã phân công | ✗ | `server/src/permissions.ts:516-532,577-582` |
| Sửa điểm đã nhập | ✓ mọi lúc (lý do ≥5 ký tự) | như GVBM | ✓ đúng ô, **chỉ khi đợt chưa hoàn tất** (R11), lý do ≥5 ký tự | ✗ | `server/src/fasttrack/attempts.ts:1470-1490,1644-1661` · `server/src/fasttrack/hoanTat.ts:109-112` |
| Huỷ điểm | ✓ mọi lúc | như người nhập | người nhập ô (trước hoàn tất); sau hoàn tất chỉ QL | ✗ | FT: route riêng `server/src/keHoach/keHoachTest.ts:470-483` · `server/src/routes/index.ts:700-708` (qua `saveScore` nên quyền = quyền sửa ô). Lớp thường: không có route riêng, xoá ô = sửa + lý do |
| Báo vắng FT (ghi "-" + chốt ngay) | ✓ | ✓ (lý do ≥5 ký tự; từ Thứ Hai tuần thi) | ✗ (GVBM chỉ gõ "-" trong ô) | ✗ | `server/src/fasttrack/absence.ts:76-79,842-877` |
| Gõ "-" trong ô điểm | ✓ | như GVBM | ✓ đúng ô; không nhận ở MT lịch sử | ✗ | `server/src/fasttrack/attempts.ts:1459,1546-1608` |
| Dời lịch thi một kỹ năng (đổi tuần) | ✓ mọi lớp | **chỉ lớp thường**, mọi môn lớp mình chủ nhiệm | **chỉ lớp thường**, đúng môn | ✗ | `server/src/permissions.ts:414-418` · `server/src/fasttrack/skillSchedule.ts:27-37,591-635` |
| Dời hạn chấm; Bỏ kỹ năng khỏi đợt (FT) | ✓ QL/QTHT | ✗ | ✗ | ✗ | `server/src/fasttrack/skillSchedule.ts:699-730,808-813` (lớp thường: không có "bỏ kỹ năng", `:710-714`) |
| Xếp lịch MT / tạo lượt / Kế hoạch Test / Thi lại | ✓ | ✗ | ✗ | ✗ | `server/src/fasttrack/attempts.ts:1059` · `server/src/keHoach/keHoachTest.ts:231,391,436-440` · `server/src/normal/regular.ts:264` |
| Huỷ lượt / Huỷ phần còn lại / mở lại lượt | ✓ (lý do bắt buộc) | ✗ | ✗ | ✗ | `server/src/fasttrack/attempts.ts:1269-1325` |
| Trả lời đề nghị dời lần 2; khôi phục phần đã huỷ; sửa kết luận "không dự thi" | ✓ QL/QTHT (ghi đè thẳng, từ chối cần lý do ≥3 ký tự) | ✗ | ✗ | ✗ | `server/src/fasttrack/absence.ts:82-84,380-449,544-591` · `server/src/fasttrack/skillSchedule.ts:772-805` |
| Tạo Case (báo vấn đề) | ✓ | ✓ mọi môn trong lớp | ✓ **bất kỳ môn nào** trong lớp | ✓ nếu có phân công trong lớp | `server/src/permissions.ts:364-365` · `server/src/cases/cases.ts:404` |
| Xác nhận nguyên nhân SOS; thêm / cập nhật / kết thúc PA; xác nhận PA quy chế; ghi kết quả PA | ✓ trong phạm vi | **chỉ Case đúng môn mình dạy** (C02) | ✓ Case đúng kỹ năng | ✗ | `server/src/permissions.ts:377-383` · `server/src/cases/sosAuto.ts:184-192,346-353` · `server/src/cases/cases.ts:715,1018,1232,2826` |
| PA Bổ trợ (Giữa khoá lớp thường): nộp kế hoạch / ghi kết quả | ✓ | ✓ (mặc định người dạy) | ✓ chỉ khi nhóm một môn (BE/ELE); PA chung FOU / Pre FOU: chỉ người dạy, GVCN, QL | ✗ | `server/src/cases/boTro.ts:80-110` |
| Hoàn thành Case | ✓ | **chỉ Case đúng môn mình dạy** | ✗ | ✗ | `server/src/cases/cases.ts:262-277` |
| Đề xuất PA ngoài danh mục (Hỗ trợ học thuật / Khác) → duyệt | **duyệt** = QL/QTHT (`case.approve`) | đề xuất được (như SOS_EDIT) | đề xuất được | ✗ | `shared/domain/cases.ts:630-631,654-656` · `server/src/cases/cases.ts:764,923` |
| "Không cần theo dõi" (SOS) | gửi + **duyệt** (tự gửi tự duyệt được, báo QTHT) | gửi nếu đúng môn | gửi nếu đúng môn | ✗ | `server/src/cases/sosAuto.ts:407-452` · `shared/domain/yeuCauDuyet.ts:47` |
| Ghi vi phạm | ✓ | ✓ | ✓ (kể cả trái môn) | ✓ nếu dạy lớp | `server/src/yThuc/access.ts:50-53` · `server/src/permissions.ts:391-392` |
| Sửa / xoá vi phạm | ✓ | ✓ (GVCN lớp em ĐANG học) | chỉ vi phạm do chính mình ghi | chỉ của mình | `server/src/yThuc/access.ts:59-63` · `server/src/yThuc/violations.ts:287-349` |
| Xác nhận xử lý Ý thức (theo bậc) | ✓ | ✓ GVCN lớp em đang học | ✗ chỉ xem | ✗ | `server/src/yThuc/xuLy.ts:132-156` · `server/src/permissions.ts:393-394` |
| Ý thức: bậc WL 3 và loại ngoài thang (Meeting CX/GĐCN, Đình chỉ, Khác) | **duyệt** = QL/QTHT; sửa bậc đã khai chỉ QL | **đề xuất** → QL duyệt → GVCN bấm "Đã thực hiện" | ✗ | ✗ | `shared/domain/yThuc.ts:78-108` · `server/src/yThuc/xuLy.ts:156,203,387-440` |
| Phối hợp SOS (thêm / xác nhận / bỏ kèm lý do) | ✓ | ✓ | ✗ chỉ xem | ✗ | `server/src/yThuc/phoiHop.ts:353-425` |
| Chuyển lớp: ra lệnh / huỷ lệnh | ✓ QL (QTHT) — thi hành tự động Thứ Hai | ✗ | ✗ | ✗ | `server/src/classes/lenhChuyen.ts:68-76,218,232` · `server/src/classes/quyenChuyenLop.ts:9` |
| Chuyển lớp: đề xuất | QL gửi = tự duyệt | ✓ GVCN lớp em đang học (lý do ≥15 ký tự) | ✗ | ✗ | `server/src/classes/lenhChuyen.ts:525-540` |
| Bàn giao | QL điền/xác nhận **thay** khi lớp không GVCN hoặc quá 3 ngày | ✓ xác nhận (GVCN lớp nguồn) | ✓ ghi một câu cho đúng môn mình dạy | ✗ | `server/src/classes/banGiao.ts:36-47` |
| Kết luận lộ trình FT; tạm dừng / kết thúc học | ✓ | ✓ (lớp em đang học) | ✗ | ✗ | `server/src/fasttrack/cycles.ts:422-426` |
| Đánh dấu kỳ vọng đầu ra Cuối khoá (lớp thường) | ✓ chỉ QL/QTHT | ✗ | ✗ | ✗ | `server/src/normal/cuoiKhoa.ts:508` |
| Lưu trữ / bỏ lưu trữ học viên | ✓ QL | ✗ | ✗ | ✗ | `server/src/students/students.ts:326,340` |
| Xoá học viên, xoá lớp đã kết thúc, tài khoản, cấu hình, mở lại tuần báo cáo | **chỉ QTHT** (`admin.config`) | ✗ | ✗ | ✗ | `server/src/students/xoaHocVien.ts:190` · `server/src/classes/xoaKetThucLop.ts:59` · `server/src/platform/accounts.ts:189-509` |
| Tạo lớp; phân công GV; sửa thông tin / tiến độ lớp | ✓ QL/QTHT | ✗ | ✗ | ✗ | `server/src/classes/intake.ts:546,604-606` · `server/src/classes/classes.ts:984` · `server/src/classes/thongTinLop.ts:26` · `server/src/classes/schedule.ts:590` |
| Thêm học viên (tay / Excel) | ✓ | ✓ **chỉ lớp mình chủ nhiệm** | ✗ | ✗ | `server/src/classes/intake.ts:196,404` · `server/src/permissions.ts:406-407` |
| Đổi Target / đổi lộ trình / mở lộ trình mới cho em đã có lộ trình | ✓ QL/QTHT (`cycle.edit`, lý do + ngày hiệu lực) | ✗ chỉ **"Đề xuất sửa"** → QL duyệt | ✗ (đề xuất được nếu xem được HV) | ✗ | `shared/domain/people.ts:128` · `server/src/fasttrack/cycles.ts:146-147,244-246,493` · `server/src/duyet/deXuatSua.ts:35` |
| Duyệt các thẻ trong hộp Chờ duyệt | ✓ QL (chi nhánh mình) + QTHT; "Báo lên" không duyệt, chỉ Nhắc | **không bao giờ** | ✗ | ✗ | `shared/domain/people.ts:126` · `server/src/duyet/yeuCau.ts:20,311-313,406-445` |
| Nhắc việc GV | ✓ QL/QTHT (`case.approve`, trong chi nhánh) | ✗ | ✗ | ✗ | `server/src/worklist/nhacViec.ts:20-22` |

**Khác Rulebook ở ma trận:** (1) Rulebook dòng 249 cho "QL/GVCN sửa … mục tiêu/lộ trình/thi dự kiến"; code chỉ QL sửa target/lộ trình, GVCN chỉ đề xuất (`server/src/fasttrack/cycles.ts:244-246`). (2) Rulebook không nêu ai ra lệnh chuyển lớp và ai duyệt "Đề xuất chuyển lớp"; code: QL ra lệnh, GVCN đề xuất (thiếu trong Rulebook). (3) Giáo viên cũng có `schedule.move` trong seed (`server/src/seed/data.ts:78`) nhưng `teacherAllows` chặn FT (`server/src/permissions.ts:414-418`) — khớp dòng 205 và 252.

---

## C. Hành vi dấu "-"

### C1. FT (Mock Test) — **CODE-OK so với §17.1 và khối PR-MT/PR-XLMT**

| Bước | Hành vi trong code | file:line |
|---|---|---|
| Ai nhập | GV được phân công đúng ô (hoặc QL/QTHT). Không nhận ở MT lịch sử. Báo vắng từ menu (GVCN/QL) ghi "-" mọi ô của kỹ năng + chốt ngay | `server/src/fasttrack/attempts.ts:1459,1546-1608` · `server/src/fasttrack/absence.ts:842-877` |
| Sửa được | Đến hết Chủ nhật của tuần lịch của chính bài; điểm thật thắng "-"; ô có điểm thì "-" không xoá được | `shared/domain/fasttrack.ts:302-326` · `server/src/fasttrack/attempts.ts:1555-1560,1706-1720` |
| Chốt cuối Chủ nhật | `settleNoShows`: cron 00:05 + 06:05 Thứ Hai VN, và ở đường đọc/ghi; idempotent (mỗi buổi một lần); buổi Writing chỉ chốt khi **cả W1 và W2** đều "-", đếm một lần | `server/src/ops/chotVangDinhKy.ts:16` · `server/src/fasttrack/absence.ts:654-762` |
| Nhập "-" cho tuần đã kết thúc | **Chốt ngay** (C10 `chot-ngay`) | `shared/domain/policy.ts:107` · `server/src/fasttrack/attempts.ts:1566,1588-1592` |
| Lần 1 | **Máy tự dời** sang tuần kế tiếp của lịch đang có (nếu tuần đích chưa kết thúc và không vướng luật thứ tự đợt), báo GVCN + GVBM đúng kỹ năng, `absence_move_count` +1 | `server/src/fasttrack/absence.ts:259-286,347-371,744-759` |
| Lần 2 trở đi (hoặc lần 1 bị chặn) | Thành **đề nghị chờ QL** (thẻ "Dời lịch thi lần 2"), lịch giữ nguyên tới khi duyệt; hạn = hết Chủ nhật tuần gửi; tuần đích mặc định = tuần chưa bắt đầu gần nhất hợp luật | `server/src/fasttrack/absence.ts:159-167,288-311` · `shared/domain/lichMt.ts:97-102` |
| QL duyệt | Đổi lịch, bộ đếm +1. QL từ chối (lý do ≥3 ký tự) → huỷ phần thi | `server/src/fasttrack/absence.ts:380-449` |
| **Hết hạn thì sao** | `sweepExpiredMoves` **huỷ phần thi** (FT: `sit_status='cancelled'`, điểm các phần khác giữ nguyên, đợt chưa đủ kết quả, không Overall), báo QL + QTHT. Chỉ QL khôi phục + đặt tuần mới (không reset bộ đếm). **Quét chỉ chạy khi có người mở trang liên quan** | `server/src/fasttrack/absence.ts:457-534,544-591` · `server/src/worklist/mywork.ts:27` |
| QL đổi kết luận khỏi "vắng" | Đề nghị đang chờ bị rút; "-" báo lại cho cùng tuần không chốt lại | `server/src/fasttrack/skillSchedule.ts:792` · `shared/domain/fasttrack.ts:331-335` |

### C2. Lớp thường — chủ sản phẩm chốt 02/10: Normal dùng "-"; còn "-" thì dời sang tuần sau, lặp lại cho đến khi có điểm hoặc QL xác nhận huỷ kết quả điểm môn đó

| Nội dung chốt 02/10 | Code đang làm | Nhãn | file:line |
|---|---|---|---|
| Normal có dùng "-" | Có. Lớp thường "-" đi **đường riêng** (`reportRegularNoShow`), FT bị chặn dùng đường này. Rulebook dòng 407, 519-523 vẫn ghi "chưa triển khai / Normal không có '-'" | **CODE-OK** (Rulebook lỗi thời: **KHÁC RULEBOOK**) | `server/src/normal/regular.ts:477-482,591-738` · `shared/domain/policy.ts:81-87` · `server/src/fasttrack/attempts.ts:1465-1467` |
| Ai nhập "-" | GV được phân công đúng ô (gõ "-" trong ô, không lý do); thêm GVCN + QL qua menu "Báo vắng" (có lý do ≥5 ký tự); QL/QTHT nhập bù. Chỉ từ khi tuần thi **đã tới** (từ Thứ Hai tuần thi) | **CODE-OK** | `server/src/normal/regular.ts:604-624,659-665` · `shared/domain/thaoTacMt.ts:43-45` |
| Dời tự động hay thủ công | **Tự động NGAY lúc ghi "-"** (không chờ cuối Chủ nhật, không cron). Dùng lại `setSkillWeek` sang `tuanKeTiep` của **tuần thi của môn** (không từ hôm nay); ghi dấu + dời là một giao dịch. Nếu GV **không** nhập "-" thì không có gì tự dời: ô vẫn nợ điểm và quá hạn sau Chủ nhật | **KHÁC** (với cách hiểu "còn '-' cuối tuần thì tự dời" — cần chủ sản phẩm xác nhận ý) | `server/src/normal/regular.ts:666-697` · `shared/domain/lichMt.ts:83-85` |
| "Lặp lại cho đến khi có điểm" | Được, **không giới hạn số lần**: sang tuần mới, khi tuần đó đã tới mà em lại vắng thì GV ghi "-" **thêm một lần nữa** (mỗi lần một dòng nhật ký `regular.no_show`). Ghi "-" khi tuần mới chưa tới thì vô hại, không dời lần hai. Có điểm ở tuần mới thì "-" không gỡ được nữa | **CODE-OK** (mỗi tuần phải ghi tay) | `server/src/normal/regular.ts:650-657,694-697,719-737` |
| Bộ đếm | **Không có cột/bộ đếm riêng**: `absence_move_count` (đếm vắng FT) không bị đụng. Số lần suy từ `audit_logs` (`regular.no_show`) chỉ để **thông báo GVCN từ lần 2** | **THIẾU** bộ đếm hiển thị/giới hạn | `server/src/normal/regular.ts:572-590,698-710` |
| Vướng đợt kế tiếp | Dời bị chặn nếu tuần mới trùng/vượt đợt kế (Giữa khoá không qua được tuần Cuối khoá): trả lỗi "Nhờ Quản lý dời lịch ở Kế hoạch Test", **dấu "-" không lưu** (cuộn lại) | **KHÁC** (GV bị kẹt, không có lối ra trong web) | `server/src/normal/regular.ts:668-677` · `server/src/fasttrack/skillSchedule.ts:501-531` |
| Cuối khoá dời quá tuần cuối khoá | Chỉ sinh **thẻ Báo lên "Cuối khoá dời quá hạn"** cho QL (không duyệt, chỉ nhắc GVCN) | **KHÁC** (không phải "huỷ kết quả") | `server/src/normal/regular.ts:711-715` · `server/src/normal/cuoiKhoa.ts:566-574` · `shared/domain/yeuCauDuyet.ts:60` |
| **Nút QL "xác nhận huỷ kết quả điểm môn đó"** | **Không tồn tại**. Gần nhất: QL "Huỷ điểm" (chỉ FT, route riêng) và QL xếp lại/dời tuần; luồng huỷ-khi-hết-hạn (`cancelPart` nhánh `ratio`) chỉ nối vào đề nghị dời lần 2, mà đề nghị đó chỉ sinh từ **Mock** (`settleGroup`) và API cũ `absence-move` | **THIẾU** | `server/src/fasttrack/absence.ts:495-534,706-762` · `server/src/keHoach/keHoachTest.ts:470` · `shared/domain/thaoTacMt.ts:38-52` |
| Hệ quả đang có khi "-" lặp nhiều tuần | Bài Cuối khoá không có điểm thì đợt không "hoàn tất" (R11 không khoá), Case/Cuối khoá chờ; hạn chấm tính theo tuần mới nên không còn "quá hạn" | ghi nhận | `shared/domain/keHoachTest.ts:69-81` · `server/src/platform/week.ts:89-113` |

---

## D. Thông báo (chuông; kind → nhóm "Cần làm / Để biết" ở `shared/domain/duongHoSo.ts:113-123`)

| Sự kiện | Người nhận | file:line |
|---|---|---|
| Lượt FT có SOS ≥1 | GVCN của lớp (kind `sos`) | `server/src/cases/sos.ts:453,519-531` |
| Case tự tạo từ SOS (FT) hoặc Giữa khoá lớp thường (cần xác nhận nguyên nhân) | Người phụ trách Case (GVBM đúng môn, hạn kèm) | `server/src/cases/sosAuto.ts:126-155` |
| Tín hiệu cần xác minh (không `silent`) | Người xác minh (owner); không có owner thì không báo ai, nằm hàng "chưa có người" | `server/src/cases/signals.ts:134-147` |
| Điểm nguồn sửa/huỷ mà Case còn căn cứ khác ("Xem lại case") | Người phụ trách Case (nếu Case chưa đóng) | `server/src/cases/signals.ts:349-363` |
| QL từ chối "Không cần theo dõi" | Người phụ trách Case (nếu khác người xin/duyệt); người xin nhận qua thẻ | `server/src/cases/sosAuto.ts:493-508` |
| QL từ chối kế hoạch bổ trợ | Người dạy bổ trợ + người xin | `server/src/cases/boTro.ts:253-270` |
| Giữa khoá lớp thường có môn trượt → việc "Báo phụ huynh qua TVV" | GVCN | `server/src/yThuc/phoiHop.ts:125-134` |
| FT: "-" chốt, lần 1 máy tự dời | GVCN + GVBM đúng kỹ năng (kind `tu_doi_lich`, tin để biết) | `server/src/fasttrack/absence.ts:744-759` |
| FT: huỷ phần thi / huỷ lịch hẹn / cần xếp lại | QL chi nhánh + QTHT (kind `schedule_move`) | `server/src/fasttrack/absence.ts:526-533,594-625` |
| Lớp thường: vắng cùng môn, cùng bài **từ lần 2** (đã dời) | GVCN (kind `sos`); lần 1 không báo | `server/src/normal/regular.ts:698-710` |
| Thẻ mới trong hộp Chờ duyệt (đề nghị dời lần 2, đề xuất PA, KTD, Ý thức cần duyệt, đề xuất chuyển lớp, kế hoạch bổ trợ…) | QL chi nhánh (+ QL toàn hệ thống) + QTHT, trừ người xin; **Báo lên** chỉ gửi QL | `server/src/duyet/yeuCau.ts:49-56,95-115,135-141` |
| Kết quả duyệt / từ chối / trả lời | Người xin (từ chối thuộc nhóm "Cần làm"); QL tự duyệt thẻ của mình → báo QTHT | `server/src/duyet/yeuCau.ts:174-199` |
| Thẻ quá hạn duyệt | QL chi nhánh + QTHT (một lần; chỉ phát sinh khi có người mở web) | `server/src/duyet/yeuCau.ts:232-251` |
| Ý thức: vi phạm mới (người ghi khác GVCN); em thành "bắt buộc" (≥3 vi phạm / 2 tuần) | GVCN lớp em đang học | `server/src/yThuc/xuLy.ts:351-366` |
| Ý thức: GVCN đã xử lý WL 1 / Report 4 + Meeting / WL 2 | QL chi nhánh, "để biết" (Report 1, 2 không báo; WL 3 và ngoài thang đi qua thẻ duyệt) | `server/src/yThuc/xuLy.ts:130,168-175` |
| Chuyển lớp: "Sắp nhận n em" (khi có lệnh) | GVCN lớp đích (+ QL chi nhánh đích nếu khác chi nhánh) | `server/src/classes/lenhChuyen.ts:180-200` |
| Chuyển lớp: đã chuyển vào lớp (kèm số vi phạm Ý thức đang mang) | GVCN lớp đích; QL chi nhánh đích nếu đổi chi nhánh | `server/src/classes/luatLoTrinh.ts:125-158` |
| Huỷ lệnh chuyển lớp | GVCN (+QL) lớp nguồn và lớp đích | `server/src/classes/lenhChuyen.ts:246-256` |
| Lệnh bị huỷ / chưa chuyển được | Người ra lệnh | `server/src/classes/lenhChuyen.ts:376-390` |
| Bàn giao đã xác nhận | GVCN lớp đích (+QL nếu khác chi nhánh) | `server/src/classes/banGiao.ts:285-296` |
| GVCN nhắc GVBM bàn giao một môn (mỗi ngày một lần) | GVBM đúng môn của lớp nguồn | `server/src/classes/banGiao.ts:300-320` |
| QL nhắc việc | GV chủ việc (mỗi việc mỗi ngày một lần) | `server/src/worklist/nhacViec.ts:57-63` |
| Đăng ký tài khoản mới | QTHT | `server/src/platform/accounts.ts:158-165` |

Không có email/Zalo (chỉ chuông trong ứng dụng): `server/src/cases/sos.ts:516-518`.

---

## E. Vai, kỹ năng "phụ trách được", vai có trong DB/seed

| Mục | Thực tế trong code | file:line |
|---|---|---|
| Vai kích hoạt | Đúng **3**: `system_admin` (Quản trị hệ thống), `manager` (Quản lý), `teacher` (Giáo viên) | `shared/domain/people.ts:16-20` · `server/src/seed/data.ts:25-29` |
| Vai đã bỏ | `branch_admin` (Admin chi nhánh): trạng thái `retired`, **không quyền nào**, không giao mới được; chỉ để đọc lịch sử. Khớp dòng 242 | `server/src/seed/data.ts:37-39` · `server/src/seed/duLieuNen.ts:29-39` · `shared/domain/people.ts:29-36` |
| GVCN / GVBM | Không phải vai. `teacher_assignments(user_id, class_id, skill, is_core, effective_from/to)`; GVCN = `is_core=1`; GVBM = có `skill`. GVCN **phải dạy ít nhất một kỹ năng** của lớp; mỗi môn một người; Pre FOU chỉ ô GVCN (tự nhận ô `tong_hop`) | `server/src/schema.sql:246-256` · `shared/domain/phanCong.ts:84-108` |
| Grant phạm vi | `user_roles.branch_id` (NULL = toàn hệ thống). Quyền riêng cộng thêm qua `user_permissions` | `server/src/permissions.ts:68-110` |
| Kỹ năng "phụ trách được" của tài khoản | `user_skills` ∈ **L · R · W1 · W2 · S** (`ENTRY_SKILLS`); chỉ QTHT sửa. **Chỉ để gợi ý khi phân công** — quyền thật đi theo `teacher_assignments.skill`. Mã cũ `writing`/`prep_writing` đổi thành W1+W2, `pronunciation` thành S | `server/src/platform/accounts.ts:168-186,508-523` · `shared/domain/skills.ts:6` |
| Ô môn của LỚP (khác kỹ năng của người) | FT: L · R · W1 · W2 · S. FOU/BE/ELE: L · R · W · S; FOU hiển thị **G+V** (ô W) và **P** (ô S). Pre FOU: một ô **Tổng hợp**. FOU mở sẵn có thể **gộp**: 1 người "L · R · G+V" + 1 người "P" | `shared/domain/normal.ts:80-163` · `shared/domain/phanCong.ts:12-30` |
| Seed demo | 1 QTHT (Đỗ Vũ Tuấn Phong, toàn hệ thống); 5 QL, mỗi chi nhánh một người (MB, BC, CP, HD, UB); **10 giáo viên** (2 người dạy hai chi nhánh: Phạm Thu Trang MB+BC, Hoàng Quang Dũng CP+HD); 14 lớp (2 đã kết thúc); một số lớp cố ý thiếu GV | `server/src/seed/seed.ts:80-135` · `server/src/seed/journeys.ts:214-225` |
| Bản chính (init) | Chỉ nạp dữ liệu nền (3 vai + quyền + chương trình) và **một tài khoản QTHT**; QL/GV do QTHT tạo sau | `server/src/ops/initBanChinh.ts:89,112-114` · `server/src/seed/duLieuNen.ts:11-66` |
| Quyền gốc của từng vai | `system_admin`: `plan.week, schedule.move, attempt.cancel, attempt.skip_skill, deadline.override, attempt.view, score.override, case.view, sos.report, sos.edit, case.close, case.approve, violation.record, discipline.manage, discipline.stats, class.assign, class.edit, student.view/edit, meeting.view/edit, admin.config, request.approve, cycle.edit`. `manager`: như trên **trừ** `score.override`, `admin.config`. `teacher`: `attempt.view, score.edit, estimate.edit, schedule.move, case.view, sos.report, sos.edit, student.view, student.edit, violation.record, discipline.manage` — mỗi quyền bị `teacherAllows` siết theo phân công | `server/src/seed/data.ts:45-81` · `server/src/permissions.ts:344-423` |

---

## F. Tổng hợp "KHÁC RULEBOOK" (kèm dòng Rulebook bị khác)

1. **Hạn ghi kết quả PA hằng tuần**: code = hết **Thứ Hai** tuần kế (`shared/domain/cases.ts:847`); Rulebook dòng 137 và 400 ghi "Chủ nhật".
2. **"Không cần theo dõi" (SOS)**: code = GV **gửi, QL duyệt** trong 5 ngày, bị từ chối thì hạn xác nhận 3 ngày mới (`server/src/cases/sosAuto.ts:407-452,493-508`); Rulebook dòng 535 ghi "đóng ngay kèm lý do".
3. **Ý thức — thang bậc bắt buộc**: code có THANG 6 bậc tuần tự (Report 1, Report 2, WL 1, Report 4 + Meeting, WL 2, WL 3) (`shared/domain/yThuc.ts:78`); Rulebook dòng 463-464 ghi "không có thứ tự bắt buộc", chỉ thư cảnh cáo 1→2→3, và dòng 460-462 "chín biện pháp".
4. **Ý thức — QL duyệt**: code bắt QL duyệt WL 3 + ngoài thang (Meeting CX/GĐCN, Đình chỉ, Khác) (`shared/domain/yThuc.ts:106-108`); Rulebook dòng 473 ghi "không có bước Quản lý duyệt".
5. **Ý thức — hạn**: code có hạn 5 ngày thật → trạng thái "Quá hạn" + thẻ Báo lên QL, và luật ≥3 vi phạm / 2 tuần = bắt buộc (`shared/domain/yThuc.ts:126,156-208`); Rulebook dòng 430, 475-476, 489-490 ghi "không hạn, chỉ cảnh báo mềm".
6. **Ý thức — trạng thái biện pháp**: code dùng nhãn Mới / Đã ghi nhận / Cần xử lý / Quá hạn / Chờ QL duyệt / Đã xử lý (`shared/domain/yThuc.ts:122-124`), "Đang soạn" chỉ nội bộ; Rulebook dòng 468-469 ghi "Đang chuẩn bị / Đã thực hiện".
7. **C08 / dấu "-" lớp thường**: code **đã triển khai** (dời ngay sang tuần sau, lặp tay mỗi tuần, thông báo GVCN từ lần 2); Rulebook dòng 407 và 519-523 ghi "chưa triển khai; Normal không có '-'".
8. **Lớp thường — SOS/tín hiệu**: code Giữa khoá tự tạo Case + PA Bổ trợ (không nhãn SOS), Cuối khoá không sinh Case, dùng dải % tổng 50/60/70 + Mini Test (`server/src/normal/regular.ts:746-838`, `shared/domain/cuoiKhoa.ts:19-33`); Rulebook dòng 89 và 540 ghi "Normal giữ mô hình tín hiệu / ngưỡng SOS theo số môn".
9. **Đợt lớp thường "đủ L/R/W/S"**: Pre FOU chỉ có ô Tổng hợp, FOU gọi G+V / P (`shared/domain/normal.ts:156-163`); Rulebook dòng 85, 88 ghi đủ bốn môn L/R/W/S.
10. **Sửa mục tiêu/lộ trình**: code chỉ QL (`cycle.edit`), GVCN gửi "Đề xuất sửa" (`server/src/fasttrack/cycles.ts:244`); Rulebook dòng 249 ghi QL/GVCN đều sửa.
11. **THIẾU trong code (yêu cầu mới 02/10)**: không có nút QL "xác nhận huỷ kết quả điểm môn đó" cho lớp thường; không có bộ đếm lần "-"; "-" bị chặn không lưu khi vướng đợt kế tiếp (xem C2).
12. **THIẾU trong Rulebook** (code có, Rulebook không nêu): hạn duyệt theo loại thẻ (kế hoạch bổ trợ 3 ngày), hạn bàn giao 2/3 ngày, lệnh chuyển lớp Thứ Hai, Cuối khoá dải %, Mini Test 70%, PA Bổ trợ, hộp Chờ duyệt và QL tự duyệt, R11 như mục riêng, cron Thứ Hai.
13. Ghi chú không phải KHÁC: `sweepExpiredMoves` và `quetYeuCau` chỉ chạy khi có người mở web (không cron) — huỷ phần thi hết hạn và thông báo quá hạn duyệt có thể chậm. Comment "không có cron" ở `shared/domain/fasttrack.ts:276` và `server/src/fasttrack/absence.ts:636` đã sai.
