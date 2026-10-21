# 06 — Xác minh 7 điểm brief mục 17 (đọc mã)

> V5-A, 22/10. Mã `main` e3965ae7 (+ tài liệu V5). Mỗi điểm: **mã làm gì hôm nay** → **V5 làm theo** → còn cần chủ SP không.
> Theo `01` mục 2: câu còn mở **làm theo khuyến nghị** trừ khi brief nói khác — nên chỉ đưa lên chủ SP câu **chưa có căn cứ nghiệp vụ**.
> Ngày giờ dùng chung: múi giờ nghiệp vụ `Asia/Ho_Chi_Minh` (`server/src/util.ts:50`); "hôm nay" = `demoToday()` (`server/src/demoConfig.ts:48-52`);
> `ngayTheoGioVN` (`shared/domain/display.ts:42-53`) đổi mốc UTC sang ngày VN; hạn lưu dạng **ngày**, quá hạn khi `hôm nay > hạn` → "hết 23:59 ngày hạn" đúng sẵn ở mức ngày.

## 1. Quyền nhập điểm hộ QL / Admin / QT; xem hồ sơ GV, dữ liệu chi nhánh, sửa lịch

- **Mã:** QL, Admin, QT **đều nhập hộ được** — `editableSkills` `server/src/permissions.ts:550-566` (`score.override` `:560` hoặc `plan.week` `:562`), `scoreEditPath` `:611-620`; sửa điểm có sẵn bắt lý do (`server/src/fasttrack/attempts.ts:1747`, `:2235`; `server/src/normal/regular.ts:679-684`). GV chỉ kỹ năng phân công (`:363-365`); GVCN nhập hộ chỉ MT cũ (`:556`, `:616`).
- Xem hồ sơ / số liệu GV khác: `analysis.view_teacher` — QT, QL, Admin (`server/src/seed/data.ts:51-97`); GV chỉ của mình. Route `/giao-vien/:id` không chặn ở web, máy chủ chặn.
- Sửa lịch: `plan.week` QT, QL, Admin; GV `schedule.move` chỉ lớp thường (`permissions.ts:432-436`). Huỷ lượt: QT, QL.
- **V5:** mọi lối vào hiện cùng ô "Nhập hộ" cho ba vai; không tính là việc của họ (`03` mục 2).
- **Chủ SP:** không cần. *Ghi để biết:* quyền nhập hộ của QL đến từ `plan.week`, gỡ "Nhập bù điểm ngoài phân công" ở Quản trị không tắt được — nhãn quyền dễ hiểu sai (`shared/domain/people.ts:192`). Không sửa đợt này.

## 2. "5 ngày lịch" — múi giờ, ngày đầu, quá hạn

- **Mã:** **chưa có việc TVV có hạn.** Việc `bao_ph_tvv` ("Báo phụ huynh qua TVV", `shared/domain/sos.ts:104`, `:115`) **do GVCN sở hữu, không hạn** (`server/src/yThuc/phoiHop.ts:98`, `server/src/worklist/mywork.ts:201`, `:1001`). Hạn 5 ngày duy nhất trong mã là **Meeting CX / GĐCN** = `ngày tạo (giờ VN) + 5`, quá hạn khi `hạn < hôm nay` (`sos.ts:118-128`; `phoiHop.ts:234`, `:592`) — tức "+5", khác quyết định "+4".
- **V5 (CHỐT 22/10):** hạn = **23:59 giờ VN ngày (lưu + 4)**; ngày lưu là ngày 1. Lưu T2 14/09 10:00 → hết 23:59 T6 18/09; quá hạn từ 00:00 T7 19/09. Hiện "Hạn 18/09"; ngày hạn = hôm nay → badge "Hạn hôm nay" ⚠ vàng; sau → "Quá hạn n ngày" ⚠ đỏ.
- **Chủ SP:** không cần cho quy ước ngày. Meeting CX / GĐCN giữ "+5" (ngoài brief).

## 3. Hạn bước tiếp sau thi

- **Mã:** `trangThaiSauThi` `shared/domain/tongKetLoTrinh.ts:92-136`, `hanBuocTiep` `server/src/loTrinh/buocTiep.ts:348`. Hạn gốc = **ngày thi + 7** (`NGAY_HAN_SAU_THI`, `:100`); gia hạn chỉ tính khi muộn hơn (`:121-123`); khi đã có KQ, hạn = muộn hơn của (hạn gốc, **ngày có KQ** + 7) (`:127-130`). "Ngày có KQ" = lần lưu KQ **đầu tiên** = **ngày nhập** (`server/src/loTrinh/cotSauThi.ts:7`, `thiThat.ts:98`). **Sửa KQ không dời hạn** (`:97`); đổi ngày thi thì tính lại hạn gốc. Việc này không gán người (`ownerId: null`, dù HV có cột `consultant_user_id`, ai có `coQuyenBuocTiep` thấy — `permissions.ts:653-656`) → không có chuyện gán lại TVV reset hạn.
- **V5:** giữ đúng luật hiện hành; Sau thi lưu điểm riêng → "Đã có kết quả · Chưa chốt bước tiếp" + hạn bước tiếp hiện rõ (T09). Lưu một phần điểm đã khởi động đồng hồ (`cotSauThi.ts:5` ghi là đường tắt) — giữ.
- **Chủ SP:** không cần.

## 4. Đạt, kỳ vọng, KCK, chưa đủ dữ liệu, W / Overall

- **Kỳ vọng MT** = Target − 1,0 (MT1) / − 0,5 (MT2) / = Target (MT3+; MT0, RF) — `server/src/fasttrack/scoring.ts:107-110`, `shared/domain/fasttrack.ts:16-19`.
- **W** = (W1 + 2×W2)/3 làm tròn 0,5, chỉ khi có cả hai (`scoring.ts:40-47`; `shared/domain/policy.ts:73-78`). **Overall** = TB 4 kỹ năng làm tròn 0,5 (`Math.round(x*2)/2`, x.25 → x.5, x.75 → x+1 — `tongKetLoTrinh.ts:58-60`), chỉ khi đủ 4 và không kỹ năng bỏ (`scoring.ts:226-229`).
- **SOS:** Overall ≥ kỳ vọng → SOS 0 dù có kỹ năng dưới (`scoring.ts:233-236`); không thì mức = số kỹ năng rớt, tối đa 3. SOS tạm khi mới có một phần điểm (`:203-217`).
- **Đạt (báo cáo):** `ketQuaMock` — `chua-du` khi thiếu Overall / kỳ vọng, `dat` khi Overall ≥ kỳ vọng (`shared/domain/ketQuaThi.ts:20-23`). **Phân tích GV** lại tính **theo kỹ năng** (`server/src/classes/phanTichLop.ts:149-152`) — chưa áp quy tắc Overall của brief 15.
- **KCK** (`khong_cam_ket`, chụp ở `kck_at_attempt` — `attempts.ts:236-245`): vẫn có kỳ vọng; dưới kỳ vọng → không SOS, Case nhẹ, không báo PH (`scoring.ts:237-238`). Phân tích GV bỏ lượt FT KCK khỏi Kết quả (`server/src/phanTich/giaoVien.ts:223`) nhưng vẫn tính tiến bộ (`:242`).
- **Lớp thường:** đạt ≥ 70 % mỗi môn (`DEMO.md:211-223`).
- **V5:** dùng nguyên định nghĩa; Phân tích / Hồ sơ GV áp quy tắc Overall (`05` mục 2) — đổi logic báo cáo ở giai đoạn C, không đổi SOS / Case.
- **Chủ SP:** không cần (C09, C10 đã chốt).

## 5. Gán kết quả học thuật khi đổi phân công; người chấm S khác người dạy S

- **Mã:** có lịch sử phân công `teacher_assignments.effective_from / effective_to` (`server/src/schema.sql:262-263`); `nguoiLuc(lop, kỹ năng, ngày)` lấy người đúng ngày, trùng ngày thì dòng mới thắng (`giaoVien.ts:84-87`). Kết quả kỹ năng + tiến bộ → **người dạy trong tuần thi** (`:230`, `:265`); chấm đúng hạn → người được phân công **ở hạn nhập** (`:195`); vi phạm → GVCN ở hạn xử lý (`:313`); PA → người phụ trách Case (`:283-291`).
- Chấm chéo: `laChamCheo` = MT + Speaking (`shared/domain/chamDiem.ts:45`). Cột chấm đúng hạn S MT tính cho **người chấm** (`examiner_user_id`, `attempts.ts:1812-1815`); chưa nhập thì không ai trễ (`giaoVien.ts:193-195`). Cột **kết quả** S vẫn tính cho **người dạy S**.
- **V5:** giữ; Hồ sơ GV ghi dưới chỉ số "Gán theo người dạy kỹ năng trong tuần thi"; bài S chưa nhận không là nợ ai (C12, T03).
- **Chủ SP:** không cần.

## 6. Báo PH: trạng thái kết thúc ngoại lệ; thu hồi khi TVV đã ghi

- **Mã:** trạng thái `pending` (Cần xử lý) / `done` (Xong) / `removed` (Đã bỏ) (`sos.ts:130-134`); lý do bỏ: không cần, đã xử lý cách khác, trùng biện pháp, khác (bắt chữ) (`sos.ts:136-139`; `phoiHop.ts:505-520`); lý do hệ thống tự bỏ / tự mở lại khi SOS đổi, việc `done` không bị đụng (`phoiHop.ts:107-120`). Xác nhận bắt ngày thực hiện (`phoiHop.ts:475-501`). **Chưa có** "Đã báo PH / Chưa liên hệ được", nhiều lần thử.
- Thu hồi xử lý vi phạm (`server/src/yThuc/xuLy.ts:668-735`): từ `done` / `da_duyet`; GVCN gửi duyệt, QL áp thẳng; vi phạm về "chưa xử lý"; chỉ **ghi** cờ `daBaoPhuHuynh` vào nhật ký, **không** đụng việc Báo PH. Hoàn tác thu hồi chỉ trong ngày (`:738-763`).
- **V5 (theo khuyến nghị):** form chính chỉ 3 trường (C15). Kết thúc ngoại lệ = thao tác phụ "Bỏ việc" trong menu ⋯ dùng lại lý do sẵn có. Thu hồi khi TVV đã ghi: lịch sử TVV giữ nguyên, panel thu hồi nêu "PH đã được báo ngày …" (T22); việc Báo PH **chưa xong** của xử lý bị thu hồi → tự "Đã bỏ · xử lý đã thu hồi".
- **Chủ SP:** xem câu Q1 dưới.

## 7. Phạm vi mặc định báo cáo; loại việc huỷ / thu hồi khỏi mẫu

- **Mã:** chi nhánh mặc định: lần chọn trước → chi nhánh làm QL → chi nhánh dạy nhiều lớp nhất → tất cả (`shared/domain/chiNhanhMacDinh.ts:32-39`). Kỳ: Báo cáo = 2 tuần trọn trước tuần này (`shared/domain/khoangThoiGian.ts:25-29`, `:74`); Phân tích GV = 4 tuần tới tuần này, tối đa 13 (`shared/domain/phanTichGv.ts:47-66`). Lượt `cancelled` bị loại ở Báo cáo, Tổng hợp, Phân tích GV (`baoCao.ts:27`, `tongHop.ts:175`, `giaoVien.ts:123`); chấm đúng hạn loại vắng, huỷ, bỏ, chờ dời, MT cũ, `-`, HV không còn học (`giaoVien.ts:32`, `:197-198`); Phối hợp `removed` ra khỏi mẫu (`phoiHop.ts:506`). Cập nhật PA đúng hạn **tính cả Case đã đóng** (`server/src/worklist/metrics.ts:467-525`). **Chưa có** tỷ lệ "việc đúng hạn" chung mọi loại việc.
- **V5:** giữ phạm vi mặc định; luật loại khỏi mẫu ở `05` mục 1.6. "Việc đúng hạn" chung = chỉ số mới giai đoạn C (`05` #8).
- **Chủ SP:** không cần.

## Phát hiện thêm khi đọc mã (không thuộc 7 điểm)

- **Gợi ý MT4 còn trong mã:** chỉ số "học viên FT xong MT3, chưa có MT kế tiếp" ở Tổng quan và Báo cáo (`server/src/worklist/metrics.ts:868-881`, `shared/domain/tongQuan.ts:118`, `server/src/phanTich/baoCao.ts:137`) — trái C20 → BỎ (`02` mục 3). `MOCK_FT_DEFAULT_ATTEMPTS = 3` (`shared/domain/fasttrack.ts:21-28`) chỉ dùng trong kiểm thử; mặc định thật là lịch tuyến `routes.lich_mt` (`shared/domain/lichMt.ts:4`, `:25`).
- **Luật `-` (#503) đúng như quyết định 22/10:** MT cũ (`laMtCu`, tuần thi ≥ 2 tuần trước — `shared/domain/lichMt.ts:45-48`) → huỷ ngay, Hoàn tác 10 s (`shared/domain/vang.ts:26-29`); MT hiện tại đếm `absence_move_count` theo tuần: lần 1 dời, lần 2 huỷ (`server/src/fasttrack/absence.ts:261-300`; `vang.ts:13-24`). Không cần sửa.

## CẦN XÁC MINH NGHIỆP VỤ (chỉ câu chưa có căn cứ)

| # | Câu | Vì sao chưa có căn cứ | Khuyến nghị mockup dùng tạm |
|---|---|---|---|
| Q1 | ~~Bậc xử lý nào sinh việc Báo PH cho TVV?~~ **ĐÃ CHỐT 21/10** (PTA Plan 22/10): mọi lần lưu xử lý vi phạm (GVCN / QL, mọi bậc, kể cả đang chờ duyệt) → việc "Báo PH · {bậc} · {em}" cho TVV của em, hạn 23:59 ngày lưu + 4. "Báo PH kết quả Test lớp thường" GIỮ GVCN, không hạn. Xem `01` mục 5. | luật 1–2, 07 GĐ1b, Rulebook §21.1 | dùng đúng như vậy |
| Q2 | ~~HV chưa có TVV thì giao ai?~~ **ĐÃ CHỐT 21/10:** QL chi nhánh của em (Q-D3 ①). Không giao chung các TVV. | 02 mục 5 Q-D3 | dùng đúng như vậy |
