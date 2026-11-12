# 6 việc chủ SP 12/11 — đề bài chốt

Lời gốc: `plan.md` dòng "12/11 (chủ SP, brainstorming — 6 việc)". PTA đọc mã (12/11) rồi nhắc lại; chủ SP trả lời (nguyên văn):
"4. Không cần ghi 'phụ trách chính', làm nổi hơn là được và có số liệu là ok.
5+6: a. Không cần phân loại, nói chung là tình hình học tập thôi · c. Quản lý có 5 ngày để duyệt, hết 5 ngày thì quyết định của GVCN là quyết định cuối ·
d. Phối hợp SOS không cần phải 1 tab riêng vì vẫn cùng một workflow, trong tab đó chia ra 2 tab nhỏ dành cho các vấn đề về tình hình học tập/ ý thức (cả 2 chiều GV <-> TVV) và 1 cái là cho phối hợp SOS. · e. Hạn 3 ngày"
Mục không nhắc = đồng ý đề xuất PTA.

## 1. Lưu trữ (code, không mockup)
Lớp: hai nhóm FT → Lớp thường; trong nhóm số lớp lớn nhất đứng đầu (cùng chi nhánh / chương trình theo `soSanhLop` đảo số). Học viên: xếp theo lớp học cuối
(thứ tự lớp như bảng lớp), trong lớp theo tên. Hiện tại: `server/src/classes/luuTru.ts:45-59, 78-83`, `web/src/modules/students/LuuTruPage.tsx`.

## 2. Tổng kết lộ trình cũ (code, không mockup)
`NganTongKet.tsx` + `GET /lo-trinh/:cycleId/tong-ket` (`server/src/loTrinh/tongKet.ts`): thêm hàng "Đầu vào" đủ kỹ năng (bản chụp có `dau_vao_l/r/w/s`);
bảng MT tách L · R · W1 · W2 · S (bản chụp có writing1/writing2 — đang lọc bỏ ở `NganTongKet.tsx:67`); hàng cuối tổng kết: MT cuối + tăng so đầu vào.

## 3. Phân tích › Thi thật › Theo GV (code)
Bỏ cột "KN dưới Target" (web + Excel). Mức theo BAND KỸ NĂNG GV dạy so Target: > Vượt · = Đạt · < Chưa đạt (`shared/domain/thiThatThongKe.ts` `mucThiGv`).

## 4. Tỉ lệ GV theo tuần cho điểm thi thật (mockup → duyệt → code)
Mọi chỗ hiện điểm thi thật của em (hồ sơ HV Học thuật, Tổng kết lộ trình, panel KQ thi thật, Phân tích › Thi thật danh sách / panel ô, hồ sơ lớp Tổng kết):
bấm điểm một kỹ năng → hộp nhỏ: GV · số tuần · %; GV tỉ lệ cao nhất làm nổi (KHÔNG chữ "Phụ trách chính"). Có sẵn `tuanDay()` (`server/src/phanTich/thiThatThongKe.ts:29-66`),
tính từ `learning_cycles.started_at` tới ngày thi, gồm chuyển lớp + đổi GV. Chỉ đọc khi bấm.

## 5–6. Tình hình học tập / Ý thức (đặc tả → mockup → duyệt → code)
a. GV (mọi GV dạy em + QL) gửi TVV việc "Tình hình học tập" (KHÔNG phân loại) — nội dung tự do; TVV trả kết quả "Đã báo PH" + nội dung (dùng lại việc Báo PH TVV `viec_bao_ph`).
b. Ghi vi phạm có lựa chọn "Chỉ nhắc nhở": không tính luật 3 vi phạm / 2 tuần, không lên bậc; GVCN chỉ xem; không sinh việc TVV.
c. Xác nhận xử lý: chọn tại chỗ Nâng 1 bậc theo thang (mặc định) · Không nâng · Vượt bậc · Ngoài thang. Mặc định → thẳng TVV. Khác mặc định → lưu là vào hộp duyệt QL;
   QL có **5 ngày**; hết 5 ngày quyết định GVCN là cuối (tự chốt). TVV chỉ nhận việc SAU khi duyệt / tự chốt (sửa luồng hiện tại sinh ngay lúc gửi). Bỏ nút "Đề xuất QL duyệt".
   Làm lại giao diện panel Công việc + trang hồ sơ (chủ SP: "nhìn vừa rối vừa xấu").
d. Tab "Ý thức & Phối hợp" (hồ sơ lớp + hồ sơ HV) GIỮ một tab (cùng workflow), bên trong 2 tab nhỏ: "Tình hình học tập / Ý thức" (vi phạm, nhắc nhở, tình hình
   cả hai chiều GV ↔ TVV, xem kỹ cả quá trình từng em) · "Phối hợp SOS". Tên tab lớn: mockup đề xuất, ghi [XM].
e. TVV tạo yêu cầu "Hỏi tình hình học tập" gửi GVCN lớp em; GVCN hỏi GVBM ngoài web rồi ghi kết quả; **hạn 3 ngày**, nằm trong Công việc GVCN; TVV đọc kết quả, tự báo PH, web không theo dõi tiếp.
