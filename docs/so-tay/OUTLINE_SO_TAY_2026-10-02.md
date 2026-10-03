# Outline sổ tay người dùng PISA — bản 02/10/2026

Hai sổ tay: **Sổ Giáo viên** và **Sổ Quản lý**. Mỗi sổ xếp theo **việc người dùng làm trong tuần**, không theo menu. Luật lấy từ `thiet-ke/PISA-Rulebook-2026-09-19.md` **mục 20** (đã đối chiếu với code `main` ngày 02/10); tên màn, nút và tài khoản demo lấy từ [BAN_DO_MAN_HINH_2026-10-02.md](BAN_DO_MAN_HINH_2026-10-02.md) (mã `G1…G19`, `Q1…Q13`, `A1…A3`).

Bằng chứng đối chiếu từng luật (nguồn, `file:line`, trạng thái) nằm ở [doi-chieu-02-10/](doi-chieu-02-10/): A đặc tả 27/09 · B kế hoạch 28–29/09 · C kế hoạch 30/09–01/10 · D luật đang chạy trong code (hạn, ma trận quyền, dấu "-", thông báo, vai).

**Ký hiệu.** 📷 một ảnh màn hình có số khoanh vùng, kèm danh sách số · ⚖ khung "Luật cần nhớ" (tối đa 3–4 dòng) · `[G9]` màn tương ứng trong bản đồ màn hình · **(chờ …)** mục còn phụ thuộc một việc chưa xong, xem phần "Việc phải xong trước khi chụp".

**Cách một trang sổ tay trông.** Ảnh có số ①②③ khoanh đúng nút/cột → bên cạnh là danh sách "① bấm để …, ② cột này nghĩa là …" → khung ⚖. Chữ chú thích nằm **ngoài** ảnh, nên sửa chữ không phải chụp lại.

---

# Sổ Giáo viên

## Phần 0. Bắt đầu
- **0.1 Đăng nhập; giáo viên mới đăng ký** (chờ Quản trị hệ thống duyệt) — `[WelcomePage]`
  📷 ① email ② mật khẩu ③ "Giáo viên đăng ký"
- **0.2 Bạn là ai trong web:** GVCN, GVBM, GV Speaking chấm chéo. Vai trong hệ thống chỉ có 3 (Quản trị hệ thống · Quản lý · Giáo viên); GVCN/GVBM suy từ phân công lớp
  ⚖ Bảng ba cột GVCN | GVBM | GV Speaking: thấy gì, làm được gì (lấy từ Rulebook §20.9)
- **0.3 Làm quen màn hình** — `[0.4 khung chung]`
  📷 ① bốn mục thanh điều hướng ② ô tìm ③ chuông Thông báo ④ nút tài khoản ⑤ số đỏ cạnh Công việc (= số việc quá hạn của bạn)
- **0.4 Đọc thời gian và màu**
  ⚖ Tuần Thứ Hai → Chủ nhật · `W2 OCT` = tuần 2 của tháng 10 · đỏ dưới kỳ vọng, xanh dương bằng, xanh lá vượt, xám chưa đủ dữ liệu · mọi hạn "n ngày" là ngày lịch, tính cả ngày đầu

## Phần 1. Nhịp một tuần (một trang lịch)
- **Thứ Hai là ngày chốt tuần:** sáng Thứ Hai web chốt dấu "-" của tuần trước (Fast Track) · hạn **ghi kết quả PA** của tuần vừa qua hết ngày này · lệnh chuyển lớp có hiệu lực
- **Thứ Tư:** hạn chấm Fast Track (của tuần thi trước đó) · **Chủ nhật:** hết hạn sửa dấu "-" · hạn chấm lớp thường
- 📷 `[G1]` Việc của tôi · hôm nay: ① `#viec-cua-toi` ② nhóm Chấm điểm ③ ô hạn (chip Quá hạn) ④ nút hành động ⑤ "Yêu cầu của tôi" ⑥ bảng Lớp tôi dạy
- Cách bắt đầu mỗi ngày: quá hạn → hạn hôm nay → còn lại; "việc đến hết tuần này" cũng hiện ở đây

## Phần 2. Chấm và nhập điểm Test
- **2.1 Tìm bài cần chấm** `[G8]` 📷 ① chọn tuần ② dải "Tổng quan chấm điểm" ③ "Nợ tuần trước" ④ "Chờ bạn chấm" ⑤ lọc lớp tôi dạy
- **2.2 Nhập điểm Fast Track** `[G9]` 📷 ① cột L, R (số câu đúng) ② cột W1, W2, S (mở bốn tiêu chí) ③ ô nhận xét W/S (≤ 1000 ký tự, không bắt buộc) ④ chọn GV chấm Speaking ⑤ Overall tự tính ⑥ trạng thái lưu ô
  ⚖ W1 và W2 là hai ô riêng; Writing tổng cần cả hai; ô trống không phải 0
- **2.3 Dấu "-" ở Fast Track** 📷 ① ô "-" ② dòng "Không có bài · Có thể sửa đến hết Chủ nhật" ③ cách sửa lại thành điểm
  ⚖ Còn "-" hết Chủ nhật → **Không dự thi**. Lần 1 máy tự dời sang tuần kế (báo GVCN + GVBM); lần 2 chờ Quản lý, không phản hồi → huỷ phần thi
- **2.4 Nhập điểm lớp thường** `[G9]` — chia theo chương trình 📷 ① ô điểm đạt ② ô tổng ③ % tổng ④ Đạt / Chưa đạt
  ⚖ Đạt khi ≥ 70 %, không làm tròn trước khi so · BE/ELE: L R W S · **FOU: L R G+V P** · **Pre FOU: một ô Tổng hợp**
- **2.5 Dấu "-" ở lớp thường (chờ luật C08 làm đủ)** — hiện web: GV ghi "-" → môn dời ngay sang tuần sau; mỗi tuần mới phải ghi lại; lần vắng thứ 2 báo GVCN
  ⚖ Luật chốt 02/10: còn "-" thì dời liên tục đến khi có điểm hoặc Quản lý xác nhận huỷ kết quả môn đó. **Nút Quản lý huỷ chưa có** → xem "Việc phải xong trước khi chụp"
- **2.6 Sửa hoặc huỷ điểm đã nhập** 📷 ① nút Sửa / Huỷ điểm ② ô lý do (≥ 5 ký tự)
  ⚖ Sau khi đợt hoàn tất, GVBM không sửa nữa, chỉ Quản lý
- **2.7 Đọc kết quả** `[G10]` 📷 ① năm ô điểm lớn ② kỳ vọng ③ chip SOS ④ "Tạm thời" vs "Đã đủ điểm" ⑤ dòng "Đã thi / tuần thi"
  ⚖ Kỳ vọng MT1 = Target − 1.0, MT2 = Target − 0.5, MT3 trở đi = Target (RF: mọi MT = Target); Target `KCK` = không kỳ vọng, không SOS tự động
- **2.8 Việc không phải của bạn:** dời lịch thi FT, bỏ kỹ năng, xếp lịch MT (chỉ Quản lý). Lớp thường: GVCN và GVBM đúng môn dời được

## Phần 3. Khi có SOS: Case và PA (GVBM đúng kỹ năng)
- **3.1 SOS là gì; web tự tạo Case** `[G5]` 📷 ① dòng kỹ năng có SOS ② chip Case ③ nhãn "Chưa xử lý / Đang xử lý" ④ hạn xác nhận
- **3.2 Trong 3 ngày chọn MỘT trong hai** `[G6]` 📷 ① nhóm nguyên nhân ② mức gấp ③ mô tả (≥ 15 ký tự) ④ Xác nhận Case ⑤ Không cần theo dõi
  ⚖ **Không cần theo dõi** không đóng ngay: gửi QL duyệt trong 5 ngày; bị từ chối thì hạn 3 ngày mới
- **3.3 Xác nhận PA quy chế** 📷 ① PA "Chờ xác nhận" ② mô tả ③ người thực hiện ④ Xác nhận PA
  ⚖ PA quy chế không tự chạy, không xoá, không thay, không kết thúc sớm; chỉ đổi người thực hiện
- **3.4 Tạo Case bằng tay** `[G7]` 📷 ① học viên ② kỹ năng ③ mức độ (Bình thường PA trong 5 ngày · Gấp 3 ngày) ④ mô tả
- **3.5 Thêm PA do bạn chọn** 📷 ① loại ② người thực hiện (gõ từ 3 ký tự) ③ mô tả ④ file hoặc link. PA ngoài danh mục → gửi QL duyệt
- **3.6 Ghi kết quả PA hằng tuần — hạn hết THỨ HAI** 📷 ① nhãn `Ghi kết quả tuần W4 SEP · hạn hết T2 28/09` ② năm mức kết quả ③ ghi chú ④ **Giữ nguyên / Điều chỉnh / Xin hỗ trợ QL** ⑤ nhãn `quá hạn n ngày`
  ⚖ "Xin hỗ trợ QL" không dừng PA, QL trả lời bằng chữ · "Chưa đủ dữ liệu" = chưa kết luận · áp mọi PA học thuật, không áp Ý thức
- **3.7 Ghi kết quả cuối và Hoàn thành Case** — đến mốc quy chế (1 tháng · đến MT kế · đến lúc thi); Hoàn thành Case bị chặn đến lúc đó
- **3.8 Chỉ xử lý Case đúng kỹ năng mình dạy** (GVCN cũng vậy)

## Phần 4. Lớp thường: Giữa khoá và Cuối khoá (mới so với bản đầu)
- **4.1 Giữa khoá có môn dưới 70 %** `[G5]` 📷 ① Case "[Giữa khoá] {môn} không đạt" ② nhãn n/4 môn đạt ③ PA Bổ trợ
  ⚖ Không có chữ SOS ở lớp thường · GVBM xác nhận nguyên nhân trong 3 ngày · Pre FOU không có Giữa khoá
- **4.2 Nộp kế hoạch bài giảng bổ trợ** (người dạy bổ trợ) 📷 ① nội dung yếu ② kế hoạch (mỗi ô ≥ 15 ký tự) ③ Nộp
  ⚖ FOU: 2 buổi/tuần chung, người dạy mặc định GVCN · BE/ELE: 1 buổi/môn · QL duyệt trong 3 ngày
- **4.3 Báo phụ huynh qua TVV** (GVCN) — 4 nội dung cần nói
- **4.4 Cuối khoá và Mini Test** 📷 ① % tổng ② dải (< 50 · 50–59 · 60–69 · ≥ 70) ③ hướng gợi ý ④ ô Mini Test · ⚖ Mini Test một lần, ≥ 70 % thì Case tự xong

## Phần 5. Ý thức & Phối hợp
- **5.1 Ghi vi phạm** (mọi GV trong lớp) `[G11]` 📷 ① học viên ② ngày ③ nhóm (5 nhóm) ④ mô tả ⑤ cảnh báo trùng
  ⚖ Sai thì sửa hoặc xoá thẳng; GVBM sửa/xoá vi phạm do mình ghi
- **5.2 Chỉ GVCN: Thang xử lý 6 bậc** 📷 ① thang một dòng, bậc đã qua ✓ ② bậc kế tiếp ③ chọn vi phạm gộp ④ mô tả (≥ 10 ký tự) ⑤ Xác nhận xử lý
  ⚖ **Bắt buộc theo thứ tự:** Report 1 → Report 2 → WL 1 → Report 4 + Meeting CX/GĐCN → Report 5 → WL 2 → Report 7 → Report 8 → … (WL = thư cảnh cáo) · mọi bậc trong thang tự làm · bậc không lùi
- **5.3 "Bắt buộc xử lý" và Quá hạn** 📷 ① nhãn Mới / Đã ghi nhận / **Cần xử lý** / **Quá hạn** ② hạn 5 ngày
  ⚖ Từ 3 vi phạm trong tuần này + tuần trước → bắt buộc xử lý, nút "Ghi nhận" biến mất · quá 5 ngày → Quá hạn + Báo lên Quản lý
- **5.4 WL 3 và các loại ngoài thang cần Quản lý duyệt** (WL 3 không còn là bậc cuối của thang) 📷 ① Đề xuất ② bằng chứng (bắt buộc) ③ trạng thái Chờ QL duyệt ④ nút Đã thực hiện
  ⚖ Meeting CX/GĐCN đứng riêng, Đình chỉ học tạm thời, Khác (ghi rõ ≥ 3 ký tự): ngoài thang, không đẩy bậc
- **5.5 Khai bậc cho học sinh cũ** (GVCN, một lần)
- **5.6 Phối hợp SOS** 📷 ① việc trao đổi ② Xác nhận ③ Bỏ kèm lý do · ⚖ Chỉ sinh từ Mock FT; không hạn

## Phần 6. Việc riêng của GVCN
- **6.1 Hồ sơ lớp** `[G4]` 📷 ① dạng xem Điểm / Ý thức ② tab Cần hỗ trợ ③ nút chính đầu trang
- **6.2 Thêm học viên** `[G17]` 📷 ① lớp ② ô dán bảng ③ dòng lỗi ④ "n MT sẽ là MT lịch sử"
  ⚖ Email bắt buộc khi thêm mới; bảng dán phải có dòng tiêu đề "Họ và tên"; dòng lỗi ở lại, không khoá cả lô
- **6.3 Báo vắng và xếp lại bài vắng**
- **6.4 Nhập MT lịch sử** cho em mới vào lớp (khoá sửa 7 ngày sau lần nhập cuối)
- **6.5 Đề xuất chuyển lớp** `[G13]` 📷 ① hướng đi ② lớp đích ③ lý do (≥ 15 ký tự) ④ Gửi đề xuất
  ⚖ **GVCN không tự chuyển lớp**: Quản lý ra lệnh, tự thi hành sáng Thứ Hai · em Tạm dừng phải "Quay lại học" trước
- **6.6 Bàn giao** `[G15]` 📷 ① môn của bạn: một câu mỗi em ② nhận xét chung ③ Xác nhận bàn giao
  ⚖ GVBM 2 ngày · GVCN 3 ngày; quá hạn thì báo Quản lý nhưng lệnh vẫn chạy
- **6.7 Lộ trình tiếp theo và Kết luận khoá** `[G14, G16]`
- **6.8 Tạm dừng và Kết thúc học** (GVCN làm được, hiệu lực ngay)

## Phần 7. Yêu cầu gửi Quản lý, hồ sơ giáo viên
- **7.1 Yêu cầu của tôi** `[G12]` 📷 ① danh sách ② Chờ duyệt / Bị từ chối ③ "Sửa và gửi lại"
  ⚖ GV không bao giờ duyệt; Quản lý kiêm GV tự duyệt thẻ của mình
- **7.2 Đề xuất sửa Target / lộ trình** — GVCN không tự sửa, lý do ≥ 15 ký tự (họ tên, ngày sinh, email, tuần bắt đầu vẫn tự sửa)
- **7.3 Hồ sơ giáo viên của mình** `[G18]` 📷 ① năm khối ② số ở ô = số dòng khi bấm
  ⚖ Không KPI, không xếp hạng, không xem hồ sơ đồng nghiệp

## Phần 8. Hỏi nhanh — gặp lỗi gì (một bảng chữ, không ảnh)
Không thấy lớp · không nhập được ô ("Bạn không được phân công kỹ năng này") · ô hiện "vắng" · "Không lưu được" · "-" bị chặn khi vướng đợt kế · vi phạm đã Quá hạn thì làm gì

**Phụ lục.** A. Bảng hạn (Rulebook §20.2) · B. Ai làm được gì (§20.9) · C. Thuật ngữ (chữ đang hiện và chữ mới sau PR-S3)

**Số ảnh ước tính: khoảng 38.**

---

# Sổ Quản lý

## Phần 0. Bắt đầu
- **0.1 Vai Quản lý:** phạm vi theo chi nhánh; Quản trị hệ thống là vai khác, có sổ riêng
- **0.2 Tổng quan của Quản lý** `[Q1]` 📷 ① **Cần xử lý** (cột Người giữ việc, Hạn) ② dải **Chờ duyệt** ③ công tắc Fast Track · Lớp thường ④ Số liệu chính ⑤ tab Phân tích ⑥ chọn chi nhánh

## Phần 1. Nhịp một tuần
Thứ Hai: xem bài vừa bị chốt "Không dự thi", đề nghị dời mới, lệnh chuyển lớp vừa chạy · giữa tuần: duyệt thẻ, nhắc GV · **Chủ nhật: hạn đề nghị dời lịch lần 2** · cuối tuần: Báo cáo đơn vị

## Phần 2. Dựng lớp và học viên
- **2.1 Tạo lớp** `[Q4]` 📷 ① Fast Track hay lớp thường ② chương trình (Pre FOU · FOU · BE · ELE) ③ phân công từng môn ④ GVCN
  ⚖ Một môn một người; GVCN phải dạy ít nhất một môn; FOU thường 2 GV (L·R·G+V và P); Pre FOU chỉ GVCN; lớp đã có học viên thì không đổi chương trình
- **2.2 Thêm học viên** `[G17]` 📷 ① Target hoặc KCK ② tuần bắt đầu ③ lưu ý tự tạo MT1–MT3
- **2.3 Sửa thông tin; đổi Target** — chỉ Quản lý, lý do + ngày hiệu lực; xử lý "Đề xuất sửa" của GVCN
- **2.4 Tạm dừng, Bảo lưu, Dừng học, Lưu trữ**
- **2.5 Chuyển lớp: Quản lý ra lệnh** 📷 ① em nào ② hướng (lên lớp · học lại · FT · chuyển lớp · bảo lưu · dừng học) ③ lớp đích ④ tuần bắt đầu (Thứ Hai, từ tuần sau) ⑤ chip "Quản lý cân nhắc"
  ⚖ Chọn khác "Web gợi ý" phải ghi lý do · em thiếu điểm Cuối khoá vẫn chuyển được · lên FT bắt buộc Target · lệnh tự chạy sáng Thứ Hai
- **2.6 Chuyển tiếp cả lớp; Kết thúc lớp** `[Q5]` — lớp thường tới tuần kết thúc: mọi em phải có lệnh; dòng "n em chưa có lệnh chuyển lớp" ở Cần xử lý

## Phần 3. Lên lịch Mock Test (chỉ Fast Track)
- **3.1 Kế hoạch Test, xếp nhiều lớp một lần** `[Q8]` 📷 ① chọn lớp ② chọn đợt MT ③ việc máy chọn cho từng em (Tạo / Xếp nốt / Dời / Thi lại)
- **3.2 Quy tắc đợt** — ⚖ số MT liền mạch, tối đa MT8; bốn kỹ năng cùng tuần theo mặc định
- **3.3 Dời lịch, bỏ kỹ năng, huỷ phần còn lại, huỷ cả lượt** 📷 ① nút chính ② ≤ 3 mục menu ③ ô lý do · ⚖ dời khi tuần thi đã bắt đầu thì bắt buộc lý do
- **3.4 Thi lại:** điểm cũ xoá khỏi ô nhưng vẫn giữ trong Lịch sử
- **3.5 Tuần đã qua chỉ để tạo MT lịch sử**

## Phần 4. Hộp Chờ duyệt
- **4.1 Đọc hộp** `[Q9]` 📷 ① năm phân loại (Học thuật · Ý thức · Lịch thi · Thông tin HV · Báo lên) ② hạn từng thẻ ③ Duyệt / Từ chối / Trả lời / Nhắc
  ⚖ Từ chối bắt buộc lý do · thẻ Báo lên không có nút Duyệt · thẻ quá hạn chỉ báo, không tự đóng (trừ lịch thi: hết hạn thì huỷ phần thi)
- **4.2 Từng loại thẻ:**
  - **Không cần theo dõi** (SOS) — duyệt thì Case và PA huỷ; từ chối thì GVBM có 3 ngày mới
  - **Đề xuất PA ngoài danh mục** · **Xin ý kiến** (trả lời bằng chữ)
  - **Kế hoạch bổ trợ** (3 ngày)
  - **Xử lý Ý thức cần duyệt:** WL 3, Meeting CX/GĐCN, Đình chỉ, Khác — bằng chứng bắt buộc, 5 ngày
  - **Dời lịch lần 2** (hết Chủ nhật tuần gửi) · khôi phục phần đã huỷ · sửa kết luận "Không dự thi" (ghi đè trực tiếp)
  - **Đề xuất sửa Thông tin HV** và **Đề xuất chuyển lớp** ("Duyệt" = mở panel điền sẵn rồi ra lệnh)
- **4.3 Tự duyệt:** Quản lý kiêm GV gửi thẻ thì tự duyệt, thẻ ghi "tự duyệt", có nhật ký
- **4.4 Lớp thường: bài đang "-" nhiều tuần (chờ luật C08 làm đủ)** — nút xác nhận huỷ kết quả môn

## Phần 5. Theo dõi chuyên môn
- **5.1 Việc quá hạn của giáo viên** `[Q10]` 📷 ① lọc Quá hạn ② nút Nhắc ③ cột người phụ trách
- **5.2 Phân tích, năm góc nhìn** `[Q2]` — mỗi góc một ảnh: Tổng hợp Test + SOS · vấn đề học viên · Hiệu quả PA · Ý thức · Giáo viên
- **5.3 Đọc số đúng** — ⚖ n/N trước phần trăm · mẫu nhỏ không kết luận · "Chưa đủ dữ liệu" ngoài tỷ lệ · Ý thức ngoài mọi bảng hiệu quả · PA quy chế tách riêng, không "Nên dùng"
- **5.4 Phân tích giáo viên và hồ sơ giáo viên** `[Q13]` — không KPI, không xếp hạng, sắp theo tên; hàng "Chưa phân công"; màu chỉ ở ô kết quả
- **5.5 Cuối khoá lớp thường:** đánh dấu kỳ vọng đầu ra BE/ELE lên FT; Mini Test không đạt thì Báo lên; PA bổ trợ miễn phí
- **5.6 Thông báo Quản lý nhận được:** WL 1, Report 4 + Meeting, WL 2 (để biết; Report 1, 2, 5, 7+ không báo) · thẻ mới trong Chờ duyệt · Báo lên

## Phần 6. Vận hành và Báo cáo đơn vị
- **6.1 Vận hành** `[Q11]` 📷 ① hàng số bấm lọc ② bảng việc ③ trạng thái (Cần làm · Đang làm · Tạm ngưng · Đã dừng · Xong) ④ giao việc (người ngoài hệ thống được)
- **6.2 Báo cáo đơn vị hằng tuần** `[Q12]` 📷 ① đơn vị đã nộp / chưa ② Ổn · Cần theo dõi · Có vấn đề

## Phần 7. Khi dữ liệu sai
Sửa điểm có lý do (≥ 5 ký tự) · sửa lịch · sửa Target · cái gì để lại nhật ký, cái gì xoá thẳng · xuất Excel (QL và GVCN lớp mình; GVBM không)

## Phần 8 (tuỳ chọn, tách sổ riêng). Quản trị hệ thống `[A1–A3]`
Tài khoản, duyệt GV đăng ký, đặt lại mật khẩu, quyền theo vai (Sửa quyền), lộ trình & chương trình (số tuần chỉ áp lớp tạo sau), xoá học viên/lớp, nhật ký

**Phụ lục.** A. Bảng hạn và người chịu trách nhiệm · B. Ma trận quyền · C. Lịch tuần mẫu · D. Thuật ngữ

**Số ảnh ước tính: khoảng 36.**

---

# Việc phải xong trước khi chụp

| # | Việc | Vì sao |
|---|---|---|
| 1 | **PR-S3** (chữ thuật ngữ 01/10) merge | Web còn khoảng 30 chỗ chữ cũ (xem BAN_DO_MAN_HINH mục 5): "Việc học viên", "Kết quả kiểm tra", "Lịch kiểm tra", "Hồ sơ đợt", "Thôi", "Báo lên", "Ra lệnh chuyển"… Chụp trước là phải chụp lại |
| 2 | **UXF-b** (mã tuần `W2 OCT` khắp nơi) và **Dọn-b** (nhãn Vận hành, "+ Giao việc", Sửa quyền) merge | Cùng lý do; ảnh Tổng quan, Vận hành, Hồ sơ lớp đổi chữ |
| 3 | Làm đủ luật **C08 lớp thường**: nút Quản lý "xác nhận huỷ kết quả môn", lối ra khi dời vướng đợt kế, (tuỳ chủ sản phẩm) dời tự động mỗi tuần | Mục 2.5 và 4.4 không viết được cho tới khi web làm đúng luật đã chốt |
| 4 | Thêm điểm bám `data-anh="…"` cho các khối chưa có hook ổn định (bốn ô đầu hồ sơ học viên, dải số Lịch Test, bảng điểm lớp thường, thang xử lý Ý thức) | Web chưa có `data-testid` nào; không có hook thì khung khoanh phải đặt theo chữ/vị trí, dễ lệch khi giao diện đổi |
| 5 | Ẩn thanh vàng DemoBar và dòng "Bản demo nội bộ" khi chụp | Chỉ có ở bản demo, không có trong bản chính |
| 6 | Chủ sản phẩm chốt các điểm P01–P09 ở Rulebook §20.13 liên quan ảnh | Ví dụ P02 (sửa/huỷ lệnh chuyển lớp mọi lúc hay chỉ trước tuần bắt đầu) |

**Có thể làm ngay, không cần chờ:** dựng khung nội dung (chữ chú thích, khung ⚖, bảng hạn, bảng quyền, thuật ngữ) cho cả hai sổ; viết kịch bản chụp (Playwright + chèn khung đỏ và số theo selector) và chạy thử trên **một** màn để duyệt kiểu khoanh vùng.

**Định dạng xuất (chưa chốt):** PDF để phát kèm bản trang web. Claude Docs chèn ảnh chưa tự động được.
