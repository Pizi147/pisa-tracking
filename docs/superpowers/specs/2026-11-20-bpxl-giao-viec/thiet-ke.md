# BPXL · Giao việc liên phòng ban · Vận hành · Gập / mở · Trả lại vi phạm — thiết kế

**Trạng thái: ĐỀ XUẤT, CHƯA DUYỆT** (PTA Plan 20/11/2026). Chủ SP bảo "làm mockup" → vẽ mockup theo tệp này, chủ SP xem hình rồi mới duyệt. Chưa có luật mới trong `plan.md` 1.6.
Lời chủ SP gốc + 4 câu trả lời: `plan.md` mục 4, các đoạn "Chủ SP 20/11 tối". Chỗ ghi **[CHỐT]** là lời chủ SP; còn lại là đề xuất của PTA.

## 0. Hiện trạng (đã kiểm trong mã, main 971366e6b)

- **Vai:** `system_admin` (Quản trị) · `manager` (Head) · `teacher` (GVCN / GVBM) · `office_admin` (Admin) · `consultant` (TVV) · `cx` · `head_tutor`. Bảng vai → quyền: `server/src/seed/data.ts:49-114`. Menu: `server/src/platform/nav.ts`, `shared/domain/dieuHuong.ts`. Trang đầu theo vai: `web/src/modules/worklist/OverviewPage.tsx:35-73`.
- **Admin hôm nay:** Tổng quan = khối Mock Test (`MockTestAdmin`, `GET /tong-quan/mock-test`: lượt MT tuần này · ô điểm chưa nhập / quá hạn · HV chưa đủ MT · GV chấm quá hạn) + Lịch sắp tới; xếp / dời MT (`plan.week`), sửa điểm có lý do, sửa thông tin HV.
- **Trang lịch:** Kế hoạch Test `/test/ke-hoach` (`web/src/modules/test/KeHoachTestTab.tsx`; mỗi lớp có số `canXepLai`, `chuaCoLichTiep`) · Lịch Test tuần `/test/lich` · mốc lớp (`ClassProgressPanel`) · Lịch thi thật `/hoc-vien?view=lich-thi`.
- **Công việc:** gần như mọi dòng TÍNH lúc đọc (`server/src/worklist/mywork.ts`), người phụ trách theo luật. Dòng có lưu sẵn: `viec_bao_ph` (Báo PH của TVV, đã sửa hạn được), `sos_coordination_actions` (Phối hợp SOS / Meeting), `tinh_hinh_hoc_tap`, `tasks` (Vận hành).
- **Vận hành (`tasks`):** đã có người phụ trách, MỘT người theo dõi, việc con một cấp, sửa hạn (bắt lý do, có lịch sử), 5 trạng thái, 4 nhóm cố định; chỉ Head tạo; KHÔNG báo người được giao. Web: `web/src/modules/worklist/MgmtTasksPage.tsx`.
- **Trang Công việc:** `web/src/modules/congViec/HoTroHocVienTab.tsx`, `DanhSachViec.tsx`, `PanelViec.tsx`. Mỗi mục là một thẻ, KHÔNG gập được (dải gập `DaiNhom` chỉ dùng cho "Đã bỏ qua", "Yêu cầu của tôi", "PA đang chạy"). Ô sửa hạn dùng chung: `web/src/ui/DongHan.tsx`.
- **Chuông:** mục "Việc cần làm" (từ `/my-work`) + mục "Cập nhật" (`notifications`, ghi bằng `notify()`); không có tin tự động theo giờ.
- **Ý thức:** vi phạm do GVBM / GVCN ghi (`violations`); GVCN xử lý theo bậc → sinh việc Báo PH cho TVV (`viec_bao_ph`). TVV hôm nay KHÔNG thao tác được gì trên vi phạm. Chưa có luồng "trả lại" nào trong app; mẫu gần nhất: "Hỏi tình hình" TVV → GVCN hạn 3 ngày (`server/src/yThuc/tinhHinh.ts`, `web/src/modules/yThuc/TinhHinh.tsx`). Panel Báo PH: `web/src/modules/congViec/PanelBaoPhTvv.tsx`.

## A. Vai BPXL — Chuyên viên Xếp lịch

- **[CHỐT]** xếp / sửa lịch Mock Test + lịch lớp thường · KHÔNG xếp họp trên app ("trên app chỉ thuần về lịch test + thi") · việc "Xếp lịch MT còn thiếu" vẫn của Head (BPXL chỉ có danh sách để xem và tự xếp) · việc Meeting CX / GĐCN: BPXL mặc định là người theo dõi.
- Phạm vi: 1 / nhiều chi nhánh, bỏ trống = toàn hệ thống (như CX).
- Làm được: xếp, dời, + MT, S Ex ở Kế hoạch Test; sửa tuần khai giảng / Progress / Final lớp thường. Khoá cuối tuần T6–CN (N15) áp dụng như Admin.
- Chỉ xem: Lịch Test tuần, Học viên & Lớp, Lịch thi thật.
- Không có: sửa điểm, sửa thông tin HV, Case, Ý thức, Phân tích. Huỷ / khôi phục lượt MT vẫn chỉ Head / Quản trị.
- Menu: **Test · Học viên & Lớp · Công việc**. Trang đầu = **Kế hoạch Test**.
- **Dải số lặng** trên đầu Kế hoạch Test (chữ xám, không đỏ, không cộng vào số việc trên menu): Chưa xếp lịch MT · Vắng chờ xếp lại · Bài chưa có điểm · Lượt thi tuần này. Bấm số = lọc danh sách lớp ngay bên dưới (ô số = mở tại chỗ).
- Chuông, mục "Cập nhật": tin em vắng (đã dời sang tuần … / đã huỷ), gộp theo lớp × tuần, không nhắc lại.
- Công việc của BPXL: chỉ "Việc được giao" + "Đang theo dõi"; không bị giao việc theo luật.

## B. Giao việc liên phòng ban

- **[CHỐT]** chỉnh hạn · chọn người phụ trách (mặc định theo luật) · giao cho người khác · người theo dõi thấy thông báo · tab "Đang theo dõi" · chia từng mục RÕ RÀNG.
- Áp dụng: Báo PH (vi phạm · tình hình · Meeting), Phối hợp SOS / Meeting CX-GĐCN, Báo PH kết quả Test, Hỏi tình hình, Vi phạm bị trả lại (E), việc Vận hành (C). Việc học thuật (chấm, Case, PA, bàn giao) và việc GVCN "Xử lý vi phạm" giữ theo luật.
- Đầu MỖI panel việc có cùng một khối ba dòng, cùng vị trí, cùng thứ tự: **Phụ trách** (tên · "Đổi") · **Hạn** (`DongHan`) · **Theo dõi** (tên · "+").

| | Mặc định | Ai đổi được |
|---|---|---|
| Phụ trách | Người theo luật | Người đang phụ trách, Head / Quản trị, CX. Giao cho bất kỳ ai có tài khoản ở chi nhánh (ô tìm + chọn, người liên quan trước); có "Về mặc định" |
| Hạn | Theo luật | Người phụ trách, người giao, Head / CX. Việc không hạn đặt hạn được (sửa N34 ②) |
| Theo dõi | Người giao tự vào · Báo PH vi phạm: GVCN + GV ghi · Meeting: CX + BPXL | Người phụ trách, người giao, Head / CX thêm bớt; ai cũng tự bỏ theo dõi |

- Người được giao được làm ĐÚNG việc đó dù vai thường không có quyền (máy chủ kiểm theo việc).
- Người theo dõi chỉ xem; nhận tin "Cập nhật" khi: giao / đổi người · đổi hạn · có kết quả · bỏ việc · trả lại. Không tin "quá hạn" tự động.
- **Tab "Đang theo dõi"** trong Công việc (mọi vai): việc còn mở, chia mục theo loại như các tab khác, quá hạn lên đầu; mỗi dòng: việc · em / lớp · người phụ trách · hạn · trạng thái; "Vừa xong 7 ngày" gập sẵn. Bấm dòng = mở panel chỉ đọc.
- Việc người khác giao cho tôi nằm ở "Của tôi", đúng mục, kèm nhãn "{tên} giao".
- Mọi lần đổi người / hạn / theo dõi có lịch sử (ai · lúc · từ → đến).

## C. Việc Vận hành

- **[CHỐT]** Head, Quản trị, CX tạo và giao · QL tạo nhóm công việc, không chọn = không phân loại · việc con · thêm Việc lặp lại + Đính kèm tệp.
- Nhóm tự đặt: tạo, đổi tên, sắp thứ tự, ẩn. 4 nhóm đang có thành nhóm khởi đầu. Không chọn = "Không phân loại".
- Việc con: một cấp, mỗi việc con có người phụ trách + hạn riêng; đóng việc cha hỏi một lần rồi đóng việc con (đã có).
- Người được giao: ai có tài khoản ở chi nhánh. Thấy ở Công việc › "Việc được giao", chia theo nhóm; được báo chuông khi được giao.
- Nhiều người theo dõi (khối chung phần B). Người phụ trách cũng sửa hạn được, lý do tuỳ chọn, có lịch sử.
- Lặp lại: hằng tuần (thứ …) / hằng tháng (ngày …); tới kỳ máy tạo bản mới kèm việc con; có "Dừng lặp".
- Tệp: dùng lại cơ chế tệp đính kèm sẵn có (`attachmentSvc`).
- Bảng Vận hành (Head / Quản trị / CX): chia theo nhóm, gập / mở, lọc người · trạng thái.
- "Giao GV theo lớp + kỹ năng" (sinh Case) giữ nguyên.

## D. Gập / mở mục

- **[CHỐT]** nhóm công việc ở mọi nơi (không chỉ Vận hành) gập / mở được.
- Mọi mục trong Công việc (mọi tab, mọi vai): bấm tiêu đề mục để gập / mở; nhớ theo người + tab; mặc định mở; mục gập vẫn hiện "n việc · m quá hạn".

## E. Trả lại vi phạm

- **[CHỐT]** TVV trả lại từng vi phạm lẻ hoặc cả yêu cầu xử lý để GVBM / GVCN sửa cho cụ thể, hoặc khi thấy ghi không hợp lý; GV sửa trong 3 ngày, hạn sửa được.
- Từ: nút **"Trả lại"** · trạng thái **"Chờ GV sửa"** · việc của GV **"Vi phạm bị trả lại"**.
1. TVV của em · TVV cùng chi nhánh · CX · Head bấm một vi phạm (panel Báo PH hoặc tab Ý thức) → "Trả lại" + lý do (≥ 8 ký tự) → về **người đã ghi**. Trả cả lần xử lý: ⋯ "Trả lại cả lần xử lý" → về **GVCN**.
2. GV nhận việc ở Công việc › Ý thức & Phối hợp, hạn 3 ngày, sửa hạn được; chuông "Cập nhật" báo.
3. GV chọn: **Sửa rồi gửi lại** · **Giữ nguyên** + trả lời (≥ 8 ký tự) · **Xoá vi phạm** (vào Đã xoá 30 ngày). Cả lần xử lý: GVCN có thêm **Thu hồi** theo đường sẵn có (N5).
4. TVV nhận tin "GV đã sửa / đã trả lời"; lịch sử vi phạm ghi đủ.
- Trong lúc chờ: việc Báo PH ghi "Chờ GV sửa", hạn Báo PH tạm dừng; GV gửi lại → tính lại 5 ngày. TVV không bị chặn (vẫn ghi Báo PH được), rút yêu cầu được, Hoàn tác 60 giây.
- GV quá 3 ngày: việc đỏ "Quá hạn", máy không tự làm gì.
- Không đổi bậc, không đổi luật 3 vi phạm / 2 tuần.
- Dùng khối Phụ trách · Hạn · Theo dõi của phần B (theo dõi mặc định: TVV trả + GVCN).

## PTA hiểu thế này — chờ chủ SP xác nhận

- "Cả yêu cầu xử lý" = cả lần xử lý mà TVV nhận để Báo PH.
- "Nhắc nhở" trong ý 2 = các việc Ý thức & Phối hợp ở phần B; việc GVCN xử lý theo bậc không nằm trong đó.
- BPXL chỉ xem lịch thi thật, không sửa.

## Dòng đọc Turso (ước lượng, chưa đo)

- `/my-work`: +1 câu, gần 0 dòng (việc giao cho tôi ngoài luật, có chỉ mục). Dòng GV đã sát trần +3 % → không thêm dòng.
- Tab "Đang theo dõi": đường riêng, chỉ tải khi mở tab, khoảng 6 câu; tab không có số đếm (khỏi thêm request).
- Trang đầu BPXL: dùng lại `GET /tong-quan/mock-test` của Admin (đã có trần).
- Gập / mở: không thêm request.

## Mockup cần vẽ (`thiet-ke/v22/`)

1. `bpxl-trang-dau.html` — Kế hoạch Test của BPXL + dải số lặng + chuông "Cập nhật" có tin vắng.
2. `giao-viec.html` — panel việc có khối Phụ trách · Hạn · Theo dõi (Báo PH, Meeting CX / GĐCN) · hộp đổi người · tab "Đang theo dõi" · mục gập / mở.
3. `van-hanh.html` — bảng Vận hành theo nhóm · tạo việc (nhóm, việc con, lặp lại, tệp) · quản lý nhóm · "Việc được giao" phía người nhận.
4. `tra-lai-vi-pham.html` — phía TVV (trả một vi phạm, trả cả lần xử lý, Báo PH "Chờ GV sửa") · phía GV (việc "Vi phạm bị trả lại", ba lựa chọn).

## Thứ tự sau khi chủ SP duyệt mockup

Luật mới N57–N61 vào `plan.md` 1.6 → PR máy chủ (vai BPXL ∥ khung giao việc → Vận hành, Trả lại) → PR giao diện mỗi màn một PR, ảnh cặp, chủ SP duyệt trước merge.
