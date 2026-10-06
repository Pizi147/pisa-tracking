# Rà "đường lui" — Xoá / Sửa / Hoàn tác / Hàng loạt (mã `origin/main` ebea10f4, 06/10)

> Đủ A (có bấm thử API thật), B, C, câu hỏi. Đọc mã + seed demo; không sửa repo.
> Viết tắt: QL = Quản lý chi nhánh (quyền `PLAN_WEEK`), QT = Quản trị hệ thống, GVCN, GVBM. "MTa" = PR-MTa đang làm.

## A. Xoá / sửa điểm từng kỹ năng

### A1. Mọi đường ghi/xoá điểm (máy chủ)

| # | Đường (nút trên màn) | Hàm (file:dòng) | Ai | Lý do | Hậu quả |
|---|---|---|---|---|---|
| 1 | Gõ/xoá số ở ô (Lịch Test › lưới lớp FT `LuoiFT`, Điểm theo lớp, hồ sơ Test `ScoreEntry`) | `saveScore` `server/src/fasttrack/attempts.ts:1423` | GVBM đúng kỹ năng (trước hoàn tất); GV Speaking chéo; GVCN chỉ ô trống MT cũ; QL/QT mọi lúc (đường `override`, `permissions.ts:602-611`) | Ô đã có điểm mà đổi/xoá → bắt buộc, **≥ 5 ký tự** (`kiemLyDo`, `shared/domain/chamDiem.ts:126-131`: "Sửa điểm đã nhập thì phải ghi lý do." / "Lý do cần ít nhất 5 ký tự để người sau đọc còn hiểu.") | Nhật ký `score.edit/override/lich_su` (giá trị cũ ở `before`); ô mất hết điểm → nhận xét + GV chấm cũng về NULL (`attempts.ts:1638-1641`); `refreshOutcome` → lượt `done`→`planned`, rút tín hiệu, Case chỉ dựng trên điểm đó bị rút (đóng) + PA chưa làm huỷ; Case có căn cứ khác giữ + nhắc xem lại (`attempts.ts:1374-1421`) |
| 2 | Menu ⋯ › **Huỷ điểm** (hồ sơ Mock, hộp kỹ năng Kế hoạch Test) | `huyDiem` `server/src/keHoach/keHoachTest.ts:574-587` → gọi `saveScore` từng ô trong một `tx` | Như #1 (không tự kiểm `PLAN_WEEK`); menu chỉ hiện ở trạng thái `co-diem` (`shared/domain/thaoTacMt.ts:43`) | Bắt buộc ≥ 5 ký tự (`kiemLyDoThaoTac`, `thaoTacMt.ts:60-64`: "Huỷ điểm: cần ghi lý do." / "Huỷ điểm: lý do cần ít nhất 5 ký tự.") | Như #1. Writing chọn W1/W2. Chỉ **một kỹ năng của một em** mỗi lần |
| 3 | **Thi lại** (Kế hoạch Test) | `thiLai` `keHoachTest.ts:540-568` | Chỉ QL/QT (`PLAN_WEEK`) | Bắt buộc ≥ 5 | Xoá điểm (qua `saveScore`) + đặt tuần mới; nhiều kỹ năng một em một lần. Chặn: lượt MT cũ / đã huỷ / không phải Mock ("Chỉ thi lại được ở lượt Mock đang chạy."); kỹ năng chưa có điểm |
| 4 | Ô lưới lớp thường (`LuoiThuong`, Điểm theo lớp) + ⋯ › Huỷ điểm (gửi `score:null,total:null`) | `saveRegularScore` `server/src/normal/regular.ts:466-579` | GVBM đúng môn; QL/QT mọi lúc (`override`) | Đổi/xoá điểm đã có → ≥ 5 ký tự (`kiemLyDo`, `regular.ts:526-532`) | Nhật ký `regular.score(.override)`; `refreshRegularOutcome` rút tín hiệu/Case Giữa khoá dựng trên điểm đó (`regular.ts:753-779`). **Nghi lỗi:** trạng thái bài chỉ đi `planned→done`, **không lùi về `planned`** khi xoá điểm (`regular.ts:759`) — xem A3 |
| 5 | Dời vượt (MT1 dời qua MT2 có điểm) | `setSkillWeek`/`setPlanningWeek`/`luuDot` → hiện **chặn** (`lichMt.ts:139-147`) | QL | — | **Đã có ở MTa** (T2: huỷ kết quả vào `ket_qua_huy`, QL khôi phục) |
| 6 | Huỷ lượt (`huyLuot`) | `attempts.ts:1241-1287` | `ATTEMPT_CANCEL` (QL) | Bắt buộc, khác rỗng ("Cần ghi lý do huỷ.") | Không xoá điểm: "Huỷ cả lượt" chỉ cho MT cuối, chưa điểm, chưa thi; còn lại "Huỷ phần còn lại" chỉ huỷ kỹ năng chưa điểm/chưa thi |
| 7 | Nhận xét / GV chấm (W1/W2/S) | `saveScore` nhánh `chiNhanXet` `attempts.ts:1508-1510` | Như #1 | Không | Xoá = gửi rỗng/null; không lý do, nhật ký có |
| 8 | Dấu "-" FT | `saveScore` nhánh `noShow` `attempts.ts:1520-1580` + `settleNoShows` `absence.ts:654` | GVBM đúng kỹ năng, QL | Không | Gỡ được tới hết Chủ nhật tuần thi; **gõ "-" cho tuần đã qua → chốt ngay** (C10 `chot-ngay`) → `absent` + máy tự dời (vắng lần 1, `absence.ts:700-760`) |
| 9 | Dấu "-" lớp thường | `reportRegularNoShow` `regular.ts:600+` | GVBM, GVCN (Báo vắng), QL | Báo vắng: ≥ 5 | Dời môn sang tuần sau ngay; gỡ dấu = trả lịch về tuần cũ (chặn nếu tuần mới đã có điểm) |

### A2. Chỗ QL bị chặn khi xoá/sửa điểm (kiểm trên mã)

| Tình huống | QL bị chặn? | Câu báo nguyên văn (file:dòng) | Lý do nghiệp vụ | Nên mở? |
|---|---|---|---|---|
| Đợt đã hoàn tất (R11) | **Không** — QL qua `override`, cần lý do | (GV: "Đợt này đã hoàn tất (hết Chủ nhật …). Chỉ Quản lý sửa được điểm — nhờ Quản lý hiệu chỉnh, kèm lý do." `attempts.ts:1452-1456`) | Đúng | Giữ |
| MT cũ (lịch sử), khoá 7 ngày sau lần nhập cuối | **Không** (QL `PLAN_WEEK`) | — | Đúng | Giữ |
| Bài đã qua nhiều tuần | **Không** | — | — | — |
| Em đã chuyển lớp / lưu trữ / lớp đã kết thúc | **Không** khi lớp cũ cùng chi nhánh QL (quyền theo lớp của lượt). Khác chi nhánh → không | — | Đúng (phạm vi chi nhánh) | Giữ |
| Lượt đã huỷ (`status='cancelled'`) | **Có** | "Lượt này đã huỷ, không nhập điểm được." (`attempts.ts:1429`, `regular.ts:477`) | Lượt huỷ cả lượt luôn chưa có điểm → không có gì để xoá. Muốn nhập: "Mở lại" (`reopenAttempt` `attempts.ts:1289`) | Không cần mở |
| Kỹ năng "đã huỷ" (huỷ phần thi / đề nghị dời hết hạn) | **Có** | "Phần thi {skill} của đợt này đã bị huỷ. Khôi phục và đặt tuần mới trước khi nhập điểm." (`attempts.ts:1481`) | Phần huỷ luôn chưa có điểm. Nhưng **Khôi phục chỉ cho tuần CHƯA TỚI** ("Tuần {W} đã bắt đầu. Chọn một tuần chưa tới." `absence.ts:566-568`) → em thực ra đã thi tuần này/tuần trước thì QL **không ghi điểm được** cho tới tuần sau (và sau T19 của MTa: không nhập trước tuần thi) | **Mở**: QL khôi phục vào tuần này / tuần đã qua (khớp T4) |
| Kỹ năng đã **chốt vắng** (`absent`, dấu "-" qua Chủ nhật) | **Có** | "{skill} đang được ghi nhận là học viên đã vắng. Nếu thực ra em có thi, sửa trạng thái thi trước rồi mới nhập điểm." (`attempts.ts:1485`) | Câu chỉ tới "sửa trạng thái thi" nhưng **không có nút/route nào** gọi `setSitStatus` (`skillSchedule.ts:924`, grep routes/web: 0 chỗ). Đường duy nhất: "Xếp lại bài vắng" sang tuần ≥ tuần này → **bộ đếm vắng +1** (`skillSchedule.ts:821`), mất tuần thật | **Mở (cao)**: "Bỏ vắng / Em có thi" cho QL — trả `scheduled` tuần cũ, không tăng bộ đếm, rút đề nghị/dời tự động, lý do bắt buộc |
| Gõ "-" nhầm cho bài **tuần đã qua** (FT) | Không gỡ được | Chốt ngay + tự dời vắng lần 1 trong cùng giao dịch (`attempts.ts:1562`, `absence.ts:740-760`) | "Chốt ngay" để không ai quên; nhưng bấm nhầm không có đường lui | **Mở**: cùng nút "Bỏ vắng" ở trên (hoàn tác cả lần tự dời, trả bộ đếm) |
| Kỹ năng bị bỏ khỏi đợt (`required=0`) | **Có** | "Kỹ năng {X} không nằm trong phạm vi yêu cầu của đợt này." (`attempts.ts:1471`) | Bỏ kỹ năng chặn khi đã có điểm (`skillSchedule.ts:870-872`) → không có điểm kẹt. QL "Đưa lại vào đợt" được | Giữ |
| Ô có dấu "-" chưa chốt | Điểm thật thắng "-" (nhập số là gỡ dấu, `attempts.ts:1673-1683`); web khoá ô (`lockedByNoShow`) | — | — | Giữ |
| Ô đã có điểm mà gõ "-" | **Có** | "Ô này đã có điểm chính thức — dấu "-" không xoá được điểm. Muốn sửa, dùng hiệu chỉnh điểm có ghi lý do." (`attempts.ts:1530-1533`) | Đúng — "-" không phải đường xoá | Giữ |
| Lý do ngắn (< 5 ký tự) | **Có** | "Lý do cần ít nhất 5 ký tự để người sau đọc còn hiểu." | Thừa | **Đã có ở MTa** (T7: chỉ cần khác rỗng; sửa điểm → tuỳ chọn; xoá → bắt buộc) |
| Dời MT trước vượt MT sau có điểm | **Có** (`lichMt.ts:139-147`) | | | **Đã có ở MTa** (T2) |
| Xoá **cả kỹ năng cho cả lớp / cả đợt** (vd nhập nhầm cột Reading cả lớp) | **Không có đường** — chỉ từng ô hoặc "Huỷ điểm" từng em × từng kỹ năng | — | — | **Mở (cao)**: "Huỷ điểm hàng loạt" cho QL |
| Xoá **mọi điểm một đợt của một em** (nhập nhầm em) | Không có — phải Huỷ điểm 4 lần (W thêm chọn ô) | — | — | Mở (gộp vào hàng loạt) |
| Khôi phục điểm đã xoá tay / Huỷ điểm / Thi lại | **Không có** — giá trị cũ chỉ còn trong "Lịch sử thay đổi"; phải gõ lại tay | — | Chốt 29/09, MTa Q1 = A (giữ) | Đề xuất làm sau MTa (dùng lại `ket_qua_huy`) |


### A3. Bấm thử thật (API, worktree tách rời origin/main, seed demo 14/09/2026, vai QL userId 2)

| # | Thử | Kết quả thật |
|---|---|---|
| 1 | Xoá điểm Reading bài Giữa khoá lớp thường (#1, đủ 4 môn), lý do "nham" | 400 "Lý do cần ít nhất 5 ký tự để người sau đọc còn hiểu." |
| 2 | Như trên, lý do "nhap nham bai" | Xoá được — **nhưng bài vẫn `status = 'done'`** dù `result.complete = false` (lệch dữ liệu, `regular.ts:759` chỉ đi một chiều). Ảnh hưởng hiện thấy nhỏ (FT dùng `status` cho "xong"/"khoá"; lớp thường đọc `result`), nhưng là dữ liệu sai cho mọi báo cáo sau này đếm theo `status` |
| 3 | QL gõ "-" ô L MT3 (#128) tuần W2 SEP (đã qua) | **Chốt ngay**: L tự dời sang W3 SEP, `absence_move_count = 1` (vắng lần 1) |
| 4 | Gỡ "-" ngay sau đó | Dấu "-" mất, nhưng **lịch vẫn W3 SEP, bộ đếm vẫn 1** — hoàn tác "nửa vời", không báo gì |
| 5 | Dời L về lại W2 SEP | 400 "Không dời vào tuần đã qua — chọn tuần từ tuần này trở đi." (MTa T4 sẽ mở cho QL, **nhưng bộ đếm vắng vẫn 1**) |
| 6 | Khôi phục W đã huỷ (#177) vào tuần này W3 SEP | 400 "Tuần W3 SEP đã bắt đầu. Chọn một tuần chưa tới." |
| 7 | Nhập W1 cho phần đã huỷ đó | 400 "Phần thi writing của đợt này đã bị huỷ. Khôi phục và đặt tuần mới trước khi nhập điểm." (câu còn lộ chữ "writing") |
| 8 | Nhập S cho bài đã chốt vắng (#7) | 400 "speaking đang được ghi nhận là học viên đã vắng. Nếu thực ra em có thi, sửa trạng thái thi trước rồi mới nhập điểm." — **không có nút/route "sửa trạng thái thi"** |
| 9 | "Xếp lại bài vắng" #7 sang tuần khác | Được, **bộ đếm vắng 0 → 1** (dù em có thi thật) |
| 10 | Huỷ cả lượt MT2 cũ (#143) có điểm | 400 "Chỉ huỷ cả lượt được với MT cuối cùng của lộ trình khi chưa có điểm và chưa thi kỹ năng nào — dùng "Huỷ phần còn lại"." → xoá cả đợt phải Huỷ điểm từng kỹ năng |
| 11 | Huỷ điểm L của #143 lý do "sai" / "nhap nham em" | 400 "Huỷ điểm: lý do cần ít nhất 5 ký tự." / được |

**Tóm tắt A:** QL **không** bị chặn vì đợt hoàn tất, MT cũ, bài cũ, em chuyển lớp/lưu trữ (cùng chi nhánh). QL **bị chặn thật** ở 4 chỗ không có lý do nghiệp vụ mạnh: (1) bài đã chốt vắng mà em thực ra có thi — không có "Bỏ vắng", chỉ xếp lại (tốn một lần vắng); (2) "-" gõ nhầm cho tuần đã qua — chốt + dời ngay, gỡ dấu không trả lịch/bộ đếm; (3) khôi phục phần đã huỷ chỉ vào tuần chưa tới → điểm của bài đã thi không nhập được (đụng T19); (4) không có xoá điểm cả kỹ năng/cả đợt/cả lớp. Lý do ≥ 5 ký tự và dời vượt có điểm: **đã có ở MTa**.

## B. Rà toàn web — đối tượng ngoài điểm (kiểm trên mã origin/main; đường dẫn tương đối `server/src/` trừ khi ghi `web/`, `shared/`)

### B1. Học viên · Điểm đầu vào/Target/Dự kiến thi · Lớp · Phân công GV · Chuyển lớp · Tài khoản

| Đối tượng | Tạo | Sửa | Xoá/Huỷ | Hoàn tác / Khôi phục / Mở lại | Hàng loạt |
|---|---|---|---|---|---|
| Học viên | CÓ — Thêm HV dán lô ≤ 200 em/lớp (`classes/intake.ts:185,411`); QL/QT/GVCN | CÓ — họ tên, ngày sinh, email, ghi chú; nhật ký `student.update` (`students/students.ts:376-396`) | CÓ NHƯNG HẠN CHẾ — **xoá cứng 34 bảng, chỉ QT**, gõ lại mã ("Chỉ Quản trị hệ thống mới xoá được học viên." `students/xoaHocVien.ts:22,203-205`) | Lưu trữ ↔ Bỏ lưu trữ CÓ (QL/QT, toast Hoàn tác `web/.../LuuTruPage.tsx:66-69`); Tạm dừng → Quay lại CÓ; **Kết thúc học → học lại: KHÔNG**; xoá → khôi phục: KHÔNG | Sửa cả lớp (PR-SL) CÓ; lưu trữ / kết thúc / xoá nhiều em: KHÔNG |
| Điểm đầu vào / Target / Dự kiến thi | CÓ (Thêm HV, mở lộ trình `fasttrack/cycles.ts:140-148`) | Từng em: Dự kiến thi QL/QT/GVCN; Target chỉ QL/QT, **lý do bắt buộc** ("Ghi lý do đổi Target." `cycles.ts:265,515`); cả lớp qua PR-SL (Target lý do ≥ 5, `classes/suaCaLop.ts:189-192`) | Điểm đầu vào xoá được (`cycles.ts:392-394`) | Không nút hoàn tác; Target có lịch sử `cycle_target_revisions` (`cycles.ts:522`); sửa lại tay | CÓ (PR-SL, một giao dịch) |
| Lớp | CÓ — một lớp hoặc ≤ 30 lớp (`intake.ts:675-746`); QL/QT | CÓ (`classes/thongTinLop.ts:26`); chặn đổi chương trình khi đã có HV/bài Test (`:59-61`) | Xoá lớp: **chỉ QT, chỉ lớp rỗng**, xoá cứng (`classes/xoaKetThucLop.ts:90-96`). Kết thúc lớp: **chỉ QT** ("Chỉ Quản trị hệ thống mới xoá hoặc kết thúc được lớp." `:22`), chặn khi còn em đang học (`:64-66`); máy tự kết thúc lớp thường hết khoá (`classes/luatLoTrinh.ts:163-184`) | **Mở lại lớp đã kết thúc: KHÔNG** (chỉ có `SET status='finished'`, `xoaKetThucLop.ts:117`) | Tạo nhiều lớp CÓ; sửa/kết thúc nhiều lớp KHÔNG |
| Phân công GV | CÓ — cả bức tranh một lớp (`classes/classes.ts:1036`) | QL/QT mọi ô; GVCN chỉ GVBM ("GVCN chỉ đổi được GV bộ môn…" `:1053`) | Gỡ = kết thúc dòng, giữ lịch sử (`:1003`) | Không nút khôi phục — phân công lại thành dòng mới (`:1007-1012`) | KHÔNG (không đổi một GV ở nhiều lớp một lần) |
| Chuyển lớp / Lộ trình tiếp theo | Quyết định chuyển: QL/QT (`classes/lenhChuyen.ts:74`), cả lớp ≤ 500; GVCN chỉ đề xuất; Lộ trình tiếp theo từng em / cả lớp ≤ 60 (`classes/loTrinhTiep.ts:166,224`) | Sửa quyết định khi còn "chờ" (`lenhChuyen.ts:216`) | Huỷ quyết định khi còn "chờ", lý do ≥ 3 (`:234`) | **Chuyển lớp đã thi hành: KHÔNG hoàn tác** (máy tự thi hành thứ Hai `:301-359`); xếp lớp lần đầu chuyển ngay (`students/students.ts:164`) không lùi | Ra quyết định cả lớp CÓ; huỷ quyết định chỉ từng em (`web/.../TransitionPanel.tsx:183`) |
| Tài khoản / quyền | CÓ, chỉ QT (`platform/accounts.ts:295`) | Vai, kỹ năng, quyền riêng, đặt lại mật khẩu: chỉ QT, có nhật ký | Xoá: chỉ QT, gõ lại email; có dấu vết → xoá mềm (`platform/xoaTaiKhoan.ts:198-210`) | **Khôi phục tài khoản đã xoá: KHÔNG**; **khoá/mở khoá: không có hàm/route** (login có kiểm "Tài khoản đã bị khoá." `accounts.ts:105` nhưng không thao tác nào đặt) | KHÔNG |

**Không lùi được (B1):** xoá HV (cứng, chỉ còn bản sao lưu) · Kết thúc học (đóng Case, lộ trình `abandoned`, ghi danh `completed`, vào Lưu trữ — `students.ts:282-300`; không "học lại") · Kết thúc lớp · Chuyển lớp đã thi hành / xếp lớp lần đầu · Thêm HV nhầm cả lô (chỉ QT xoá từng em) · Xoá tài khoản · Kết luận lộ trình có đóng Case (`cycles.ts:475-478`).

**Chỉ từng cái (B1):** Lưu trữ/Bỏ lưu trữ, Tạm dừng/Quay lại/Kết thúc học (`web/.../StudentManagePanel.tsx:109,153`) · xoá HV · huỷ quyết định chuyển lớp · phân công một GV nhiều lớp · kết thúc/sửa lớp · tài khoản.

### B2. Case · PA · Ý thức · Chờ duyệt · Nhắc việc · Việc QL giao · Báo PH · Nhận xét · Chuông

| Đối tượng | Tạo | Sửa | Xoá/Huỷ | Hoàn tác / Mở lại | Hàng loạt |
|---|---|---|---|---|---|
| Case (SOS + Ý thức) | CÓ — báo tay `cases/cases.ts:381` (tên ≥ 6, mô tả ≥ 15), gộp vào Case mở cùng hạng mục | CÓ NHƯNG HẠN CHẾ — tên/mô tả/mức chỉ ghi một lần lúc Xác nhận ("Case đã xác nhận nguyên nhân rồi." `cases/sosAuto.ts:197`); đổi hạn theo dõi `cases.ts:258` (**không nhật ký**) | KHÔNG xoá; "Đóng" = Hoàn thành, kết luận ≥ 10 (`cases.ts:144,173`); "Không cần theo dõi" QL duyệt → đóng + huỷ mọi PA (`sosAuto.ts:471-475`) | **KHÔNG mở lại** — trượt lại thì máy tạo Case MỚI (`cases/sos.ts:186-199`). Chữ web nói ngược: `web/src/modules/cases/ThaoTacCase.tsx:218` ("chính Case này mở lại…") | KHÔNG đóng nhiều Case |
| PA | CÓ (`cases.ts:720`, mô tả ≥ 8) | Chỉ qua "Điều chỉnh/Thay PA" khi ghi kết quả (`cases.ts:2739`, lý do ≥ 8) | KHÔNG (chỉ hệ thống huỷ) | **KHÔNG** — "Phương án này đã kết thúc — không cập nhật thêm được." (`cases.ts:2806`); lần xem lại chỉ thêm, không sửa/xoá, **không nhật ký** (`cases.ts:1191`) | Duyệt PA hàng loạt CÓ (`shared/domain/yeuCauDuyet.ts:41`) |
| Vi phạm Ý thức | CÓ, **mỗi lần một em** (`yThuc/violations.ts:194`) | CÓ — người ghi / GVCN / QL, không giới hạn thời gian (`yThuc/access.ts:60-68`) | CÓ — **xoá CỨNG** kèm lịch sử + tệp, không lý do (`violations.ts:346-361`) | Hoàn tác chỉ ngay sau khi ghi (= gọi DELETE, `web/src/modules/yThuc/RecordViolationPanel.tsx:124-151`); xoá rồi **không khôi phục** | **KHÔNG** ghi nhiều em |
| Lần xử lý Ý thức | CÓ (`yThuc/xuLy.ts:97,132,385`) | KHÔNG sửa lần đã xác nhận; khai bậc chặn khi đã có xử lý (`xuLy.ts:206`) | Chỉ xoá nháp ("Chỉ xoá được đề xuất chưa gửi." `:452`) | **KHÔNG** bỏ Ghi nhận / Xác nhận / Đã thực hiện (`:228`) | Nhiều vi phạm của **một** em (`xuLy.ts:57`) |
| Chờ duyệt | Đề xuất sửa lý do ≥ 15 (`duyet/deXuatSua.ts:41`) | Người gửi không sửa | **Rút lại: KHÔNG**; từ chối lý do ≥ 3 ("Ghi lý do từ chối (ít nhất 3 ký tự)." `duyet/yeuCau.ts:425`) | **KHÔNG huỷ quyết định** ("Yêu cầu này đã được xử lý…" `yeuCau.ts:403`) | Duyệt nhiều chỉ 2 loại `de_xuat_pa`, `lich_thi`, ≤ 50 (`yeuCau.ts:448-464`); **không từ chối hàng loạt** |
| Nhắc việc | CÓ (`worklist/nhacViec.ts:187`) | — | KHÔNG | KHÔNG | "Nhắc tất cả" chỉ ở Chờ duyệt (`yeuCau.ts:477`) |
| Việc QL giao (mgmt-tasks) | CÓ (`worklist/mgmttasks.ts:381`) | CÓ — dời hạn lý do 2–200 (`:681`); chỉ `task_history`, **không nhật ký chung** | Chỉ "Dừng hẳn" (lý do, `:537`); không xoá việc tạo nhầm | CÓ — đặt lại "Đang làm" từ done/stopped (`:516`) | KHÔNG giao nhiều người (một `assigneeUserId`) |
| Báo phụ huynh | Tự tạo + thêm tay (`yThuc/phoiHop.ts:103,412`) | — | "Bỏ" khi còn chờ (`:485-497`) | **KHÔNG huỷ xác nhận** đã báo (`:455-458`) | KHÔNG |
| Nhận xét W/S | CÓ (`fasttrack/attempts.ts:1340`) | CÓ (sau hoàn tất chỉ QL) | CÓ (gửi rỗng) | Nhật ký có trước/sau, không nút khôi phục | KHÔNG |
| Thông báo chuông | — | — | KHÔNG xoá | KHÔNG "chưa đọc" lại | "Đọc hết" CÓ |

**Không lùi được (B2):** Hoàn thành Case · QL duyệt "Không cần theo dõi" · duyệt/từ chối nhầm thẻ Chờ duyệt (kể cả hàng loạt) · xoá vi phạm (cứng) · lần xử lý Ý thức · kết quả PA đã chốt, lần xem lại · xác nhận Báo PH · người gửi không rút được đề xuất · việc QL giao tạo nhầm (chỉ "Dừng hẳn") · tên/mô tả Case sau xác nhận.

**Chỉ từng cái (B2):** ghi vi phạm (một em) · hoàn thành Case · thêm PA / ghi kết quả PA · từ chối thẻ · xác nhận/bỏ Phối hợp, Báo PH · việc QL giao một người · lần xử lý một em.

**Thiếu nhật ký chung (`writeAudit`):** đổi hạn theo dõi Case (`cases.ts:258`), lần xem lại (`cases.ts:1191`), sửa/tiến độ mgmt-task (`mgmttasks.ts:604,695`).

### B3. Lịch MT/Test · Lượt MT · Bài lớp thường · Đề nghị dời do vắng

| Đối tượng | Tạo | Sửa | Xoá/Huỷ | Hoàn tác / Khôi phục / Mở lại | Hàng loạt |
|---|---|---|---|---|---|
| Lịch từng kỹ năng | CÓ — QL (FT); lớp thường tự xếp | Dời: QL mọi kỹ năng; GV chỉ lớp thường phần mình (`permissions.ts` `moveableSkills`). Tuần đã qua chặn ("Không dời vào tuần đã qua…" `skillSchedule.ts:764`) → **MTa T4 mở cho QL** | Huỷ lịch cả lượt (`boTuanLuot` `skillSchedule.ts:616`, QL, lý do ≥ 5, chặn khi có điểm/đã thi); Bỏ kỹ năng (FT, QL; chặn khi có điểm / đã tới tuần thi / đã vắng); lớp thường không bỏ môn | Đưa lại vào đợt CÓ; Khôi phục phần đã huỷ CÓ NHƯNG chỉ tuần chưa tới (`absence.ts:565`); **chốt vắng → không bỏ được** (`setSitStatus` không có route) | Xếp hàng loạt CÓ (`xepHangLoat`); huỷ lịch / bỏ kỹ năng / khôi phục hàng loạt KHÔNG |
| Lượt MT | CÓ — Xếp lịch MT, hàng loạt | Dời cả đợt (`setPlanningWeek`), hạn riêng | Huỷ cả lượt chỉ MT cuối, chưa điểm, chưa thi; còn lại "Huỷ phần còn lại" (`attempts.ts:1241-1287`), lý do bắt buộc | Mở lại lượt CÓ (`reopenAttempt` `attempts.ts:1289`) — **Case đã đóng khi huỷ không mở lại**, phần đã huỷ giữ "huỷ" | KHÔNG |
| Bài lớp thường (Giữa/Cuối khoá) | Tự tạo theo tuần học (`planRegularTests`) | Dời: GV/QL; "-" tự dời tuần sau | Không thấy thao tác huỷ bài | Gỡ "-" trả lịch cũ (chặn nếu tuần mới đã có điểm) | Dời hàng loạt qua `xepHangLoat` |
| Đề nghị dời do vắng | Máy tạo (vắng lần 2) | — | QL từ chối, lý do ≥ 3 | **Không huỷ quyết định** | Duyệt nhiều loại `lich_thi` (≤ 50) |

## C. Đề xuất (xếp theo giá trị cho QL, cao → thấp)

| # | Việc | Vì sao cần (tình huống thật) | Rủi ro dữ liệu | Cách an toàn | Cỡ | File chính | Chồng PR |
|---|---|---|---|---|---|---|---|
| 1 | **"Bỏ vắng" (Em có thi)** cho bài đã chốt vắng, kể cả "-" gõ nhầm tuần đã qua | GV gõ "-" nhầm ô tuần trước → chốt + tự dời ngay, em mất lượt vắng miễn phí; em thi bù trong tuần nhưng "-" chưa gỡ trước CN → không nhập được điểm | Bộ đếm vắng sai → lần sau "huỷ (vắng 2 lần)" (T3) oan; đề nghị dời / thẻ Chờ duyệt mồ côi | Chỉ QL/QT, lý do bắt buộc, nhật ký; đảo đúng một lần chốt: `sit_status` về `scheduled` tuần cũ, bộ đếm −1 nếu lần dời đến từ chốt này, rút đề nghị/thẻ, `huy_vang = 0`. Dùng lại `setSitStatus` (đã có, `skillSchedule.ts:924`; thiếu route + nút ở trạng thái `vang`) | M | `skillSchedule.ts`, `absence.ts`, `routes/index.ts`, `shared/domain/thaoTacMt.ts`, `MockDetailPage.tsx`, `HopThaoTacMt.tsx` | Sau **MTa** (T3, T7); nút ở **MTb** (mockup) |
| 2 | **Khôi phục phần đã huỷ vào tuần này / tuần đã qua** (QL) | Em đã thi thật nhưng phần thi bị huỷ → nay chỉ khôi phục vào tuần tới; sau **T19** điểm kẹt tới tuần sau | Thấp — chỉ đổi lịch | Cùng luật `kiemTuanXep` (QL được tuần đã qua) của MTa T4 | S | `absence.ts:544-597`, `HopThaoTacMt.tsx:78-80` | **Nên ghép MTa** (Task 2/12) |
| 3 | **Huỷ điểm hàng loạt**: một kỹ năng của nhiều em / cả đợt một em / cả cột một lớp | Dán Excel lệch cột, nhập nhầm lớp/đợt → hiện phải Huỷ điểm từng em × từng kỹ năng, mỗi lần gõ lý do | Mất điểm thật, đóng Case hàng loạt | Chỉ QL/QT; xem trước "huỷ n điểm · đóng m Case"; một lý do; nhật ký mỗi ô; chia lô; **xoá mềm** (`ket_qua_huy` của MTa) để khôi phục | M–L | `keHoachTest.ts` `huyDiem`, `attempts.ts`, `regular.ts`, `web/src/modules/cham/DiemTheoLop.tsx` | Sau **MTa** + **MTb**; cần mockup |
| 4 | **Khôi phục điểm đã huỷ tay** (Huỷ điểm, xoá ô, Thi lại) | Huỷ nhầm → phải đọc "Lịch sử thay đổi" rồi gõ lại tay (W/S 4 tiêu chí, nhận xét, GV chấm mất theo) | Đè điểm mới | Như T2: dòng sang `ket_qua_huy`, nút Khôi phục chỉ QL, chặn khi ô đã có điểm mới | M | `ketQuaHuy.ts` (MTa), `keHoachTest.ts` `huyDiem`/`thiLai` | Đổi **MTa Q1 A → B**; PR sau MTa |
| 5 | **Sửa lỗi**: bài lớp thường xoá điểm vẫn `status = 'done'` | A3 #2 | Lệch số khi đếm bài xong | `refreshRegularOutcome` lùi `done → planned` khi chưa đủ (như FT `attempts.ts:1382-1386`) | S | `normal/regular.ts:759` | Ghép **MTa Task 1** (L5) hoặc HK2 |
| 6 | **Mở lại Case đã hoàn thành** (QL) + sửa chữ sai "chính Case này mở lại" | Đóng nhầm / em trượt lại ngay; web hứa mở lại nhưng máy tạo Case mới | Hai Case trùng một vấn đề | QL/QT, lý do, nhật ký; PA không tự sống lại | M (chữ: S) | `cases/cases.ts:144`, `cases/sos.ts:186-199`, `web/src/modules/cases/ThaoTacCase.tsx:218` | Chữ → **PR-CHU/HK2** |
| 7 | **Huỷ quyết định Chờ duyệt bấm nhầm** (trong ngày, khi chưa có gì đi tiếp) + **Từ chối hàng loạt** | Duyệt 50 thẻ một lần, chọn sai | `khiDuyet` đã ghi dữ liệu (lịch, PA) | Chỉ loại đảo sạch được (lịch thi chưa có điểm; PA chưa bắt đầu) | M–L | `duyet/yeuCau.ts:403-464`, `shared/domain/yeuCauDuyet.ts` | Sau **NV**; MTa đổi lý do từ chối |
| 8 | **Vi phạm Ý thức: xoá mềm + khôi phục**; **ghi vi phạm nhiều em** | Xoá nhầm mất cả lịch sử + tệp; cả lớp đi muộn ghi từng em | Bậc xử lý lệch khi khôi phục | Cờ đã xoá thay `DELETE`, QL khôi phục; nhiều em = nhiều dòng một giao dịch | M | `yThuc/violations.ts:194,346-361`, `RecordViolationPanel.tsx` | Cần mockup |
| 9 | **"Học lại"** cho em đã Kết thúc học; **Mở lại lớp** đã kết thúc | Bấm nhầm / em quay lại; lớp máy tự kết thúc còn bài bù | Mở lại sai lộ trình | QL/QT, lý do; Case giữ đóng | M | `students/students.ts:245-300`, `classes/xoaKetThucLop.ts:117`, `classes/luatLoTrinh.ts:176` | Không |
| 10 | **Làm nhiều em một lần**: Lưu trữ/Bỏ lưu trữ, Tạm dừng/Kết thúc học, huỷ quyết định chuyển lớp | Cuối khoá lưu trữ cả lớp; huỷ lô chuyển lớp tạo nhầm | Thấp | Chọn nhiều + một lý do, gọi hàm từng em theo lô | M | `students/students.ts:245,325,339`, `classes/lenhChuyen.ts:230` | Gần SL (đã merge) |
| 11 | Hoàn tác chuyển lớp đã thi hành (khi lớp mới chưa có dữ liệu) | Chuyển nhầm lớp | Lộ trình, MT, phân công đã đổi | Lệnh chuyển ngược tự sinh | L | `classes/lenhChuyen.ts:301-359`, `transition.ts` | Không |
| 12 | Nhỏ: người gửi rút đề xuất chưa duyệt · xoá việc QL giao tạo nhầm · nhật ký cho hạn theo dõi Case / lần xem lại / mgmt-task · câu lỗi lộ "writing", "speaking" | — | — | — | S mỗi việc | `duyet/*`, `worklist/mgmttasks.ts`, `cases/cases.ts:258,1191`, `attempts.ts:1481,1485` | Chữ → **PR-CHU** |

**Không đề xuất:** nới quyền GV/GVBM (mọi đường lui trên chỉ cho QL/QT); mục §8 đã chốt không làm.

## Câu cần chủ sản phẩm quyết
1. **"Bỏ vắng"** cho QL (đề xuất 1): trả cả lịch cũ và bộ đếm vắng? — Khuyến nghị: **có**, lý do bắt buộc, chỉ QL/QT, làm sau MTa.
2. **Xoá điểm thành "xoá mềm, khôi phục được"** (MTa Q1 từ A sang B) để làm **Huỷ điểm hàng loạt**? — Khuyến nghị: **có**, PR riêng sau MTa, dùng chung `ket_qua_huy`.
3. **Khôi phục phần đã huỷ vào tuần này/đã qua** (đề xuất 2) + sửa lỗi "bài lớp thường vẫn xong" (đề xuất 5): ghép MTa ngay? — Khuyến nghị: **ghép MTa** (nhỏ, cùng luật T4/T19).
4. Ngoài Test, mở đường lui nào trước: Mở lại Case · Huỷ quyết định Chờ duyệt · Vi phạm xoá mềm · Học lại/Mở lại lớp? — Khuyến nghị: **Mở lại Case + Huỷ quyết định Chờ duyệt** trước.
