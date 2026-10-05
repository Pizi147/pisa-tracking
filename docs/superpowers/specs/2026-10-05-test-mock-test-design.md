# Đặc tả: Test / Mock Test đơn giản hoá (05/10/2026)

Nguồn: `D:\Download\Pisa tracking web\PISA-tracking-test-mocktest-review-final.md` + 2 ảnh của chủ sản phẩm; các quyết định T1–T14 ở
`plan.md` mục 2c; mockup đã duyệt `thiet-ke/mockup-test-mt-2026-10-05.html` (bản 4). Đặc tả này **ghi đè** các luật cũ ghi ở cột "Thay".

Luật chung: **Logical → Practical → Simple workflow → Easy to use**. Chữ trên web ngắn (nhãn 1–3 từ, không câu giải thích dưới nút/ô;
English / nửa Anh nửa Việt được khi tự nhiên hơn). Mọi luật nằm ở **máy chủ + `shared/domain`**, web chỉ vẽ theo.

## 1. Luật

| ID | Luật mới | Thay |
|---|---|---|
| T1 | **MT cũ** = lượt được **xếp vào** tuần thi (Chủ nhật của tuần thi muộn nhất) cách tuần hiện tại **≥ 2 tuần** — tính lúc xếp/dời; MT thường đã qua không tự thành MT cũ. Tuần trước = MT thường (có hạn chấm, sinh Case). MT cũ: không tính hạn chấm; sinh Case/PA/Phối hợp chỉ khi trong cửa sổ 4 tuần (giữ `luotSinhViec`). Bỏ điều kiện "chỉ cho tuần trước ngày em vào web". Chữ "MT lịch sử" → **"MT cũ"** mọi nơi | `laLichSu` (so với ngày tạo, kể cả tuần trước), `kiemTuanDaQua` điều kiện `ngayVaoWeb`, T34 |
| T2 | Dời một MT số nhỏ muộn hơn (hoặc trùng tuần) MT số lớn: **cho lưu sau popup**. MT bị vượt: bỏ lịch (về "chưa xếp"); nếu đã có điểm → các điểm đó **đánh dấu huỷ** (không xoá; không tính SOS, báo cáo, Phân tích, Xuất Excel; vẫn xem trong nhật ký), Case/PA sinh từ các điểm đó tự đóng (lý do hệ thống), Quản lý **khôi phục kết quả** được. Lý do bắt buộc (vì huỷ kết quả). MT bị vượt chưa có điểm → không popup, chỉ dòng vàng | Q-0310-2 (chặn khi MT sau có điểm) |
| T3 | Dấu "-" **lần 2** ở một kỹ năng Mock Test: kỹ năng thành **huỷ (vắng 2 lần)**, không còn lịch, chuông báo GVCN. GVCN có nút **"Xin dời"** → thẻ Chờ duyệt "Dời lịch" như hiện nay. Không tự tạo thẻ. Quản lý chốt "không mock lại" → kỹ năng tính như bỏ khỏi đợt (đợt hoàn thành được) | K4-28 lần 2 → đề nghị chờ QL |
| T4 | Xếp / dời MT / Test lớp thường **chưa thi** về tuần đã qua: **chỉ Quản lý / Quản trị**, không chặn (một dòng vàng ở panel); tuần đủ cũ thì là MT cũ. GVCN / GV vẫn chỉ từ tuần này | K2-33 (chặn mọi người) |
| T5 | **MT0**: em FOU/BE/ELE ghi hướng **Lên FT** ở Lộ trình tiếp theo → web tạo lượt Mock số 0, tuần = tuần Final Test của lớp đang học, **hạn chấm hết Chủ nhật tuần sau**. Luôn đứng đầu, trước MT1, muộn nhất tuần 2 của lộ trình FT. Không có trong panel Xếp lịch MT; dời ở hồ sơ HV / hồ sơ Mock. Mock 1–4 kỹ năng. Kỹ năng thấp hơn Target ≥ 2.0 → chữ SOS chỉ hiển thị (không Case/PA/Phối hợp). Điểm MT0 = mốc đầu vào trên Hành trình | — (mới) |
| T5b | Mốc quyết: "Lên FT" phải ghi trước khi hết **tuần 7 (FOU) / tuần 9 (BE, ELE)** → việc của Quản lý ở Tổng quan / Công việc, hạn đó, quá hạn đỏ, **không chặn**. Chốt thật ở **Chuyển tiếp lớp**: giữ Lên FT → MT0 thành mốc đầu vào lộ trình FT mới (nối `cycle_id`); đổi Học lại / Lên BE → MT0 giữ ở Hành trình, ghi "MT0 · không dùng", không tạo lộ trình FT. Bỏ hướng Lên FT trước Final → MT0 chưa có điểm bị huỷ, đã có điểm giữ "không dùng" | — |
| T6 | Hạn chấm Mock Test giữ **thứ Tư tuần kế** (MT0 riêng: Chủ nhật tuần sau) | — |
| T7 | (Áp MỌI chỗ trên web, kể cả ngoài Test; bỏ tối thiểu ký tự) Lý do **bắt buộc** chỉ khi: huỷ điểm, huỷ lượt, huỷ kết quả MT do dời vượt (T2), Quản lý **từ chối** một đề nghị. Còn lại (sửa điểm, dời lịch, dời hạn chấm, bỏ kỹ năng, báo vắng, thi lại, …): ô lý do **tuỳ chọn**, không đòi tối thiểu ký tự. Nhật ký vẫn ghi ai, lúc nào, cũ → mới | K4-15, RB-5, `LY_DO_TOI_THIEU` ở mọi nơi |
| T8 | "Để QL biết" → **"Nhắc việc"**; bỏ số nổi đầu trang; số Chờ duyệt chỉ đếm việc cần duyệt. "Nhắc tất cả" không quá 10 giây cho 50 thẻ: dựng danh sách việc **một lần mỗi người được nhắc**, bỏ qua thẻ đã nhắc hôm nay **trước** khi dựng | J5b (tên), `nhacViec` dựng `myWork` mỗi thẻ |
| T9 | Chi nhánh mặc định (Học viên & Lớp và mọi màn có ô chi nhánh): lần chọn trước (nhớ trên máy) → chi nhánh người xem có vai Quản lý → chi nhánh có nhiều lớp mình dạy / chủ nhiệm nhất → chi nhánh đầu | `hocVienLop.ts:74` lấy id nhỏ nhất (= MB) |
| T10 | Nhập band: ô L/R nhận số nguyên = raw (như cũ), số có dấu chấm hoặc "b6" = band; W1/W2/S thêm ô **Band** cạnh 4 tiêu chí (điền band thì bỏ trống tiêu chí được). Mặc định như cũ | L/R chỉ raw; W/S chỉ 4 tiêu chí |
| T11 | Test lớp thường: dời tự do như nay; người khác GVCN dời → **một chuông cho GVCN**. Không thẻ, không Case | — |
| T12 | Giữ: đợt không đủ 4 kỹ năng (Bỏ kỹ năng) · chặn tạo MT mới khi MT trước chưa có lịch · điểm đi theo MT khi dời · hạn thứ Tư | — |
| T15 | **Lịch Test chia 3 khối** (05/10, thay "Nợ tuần trước" + khối hạn trong dòng lớp) | Trên xuống: **(1) "Test quá hạn chấm"** — bài chưa chấm, đã **qua hạn** (`quaHanNhapDiem`) **và đã sang tuần thứ hai sau tuần thi** (tuần thi ≤ tuần hiện tại − 2); **thu gọn mặc định**. **(2) "Test chấm tuần này"** — bài học viên **thi tuần trước** (tuần thi = tuần hiện tại − 1), còn chưa chấm; **ở lại khối này hết tuần (Chủ nhật), kể cả khi đã quá hạn** (FT quá hạn từ thứ Năm) — quá hạn chỉ thêm **badge "Quá hạn"** (đỏ nhạt, cạnh hạn chấm), không đỏ cả dòng; sang Thứ Hai tuần sau mới chuyển khối 1; **mở sẵn**, hiện như Lịch Test hàng tuần (cột Lớp · Đợt · Kỹ năng · Tiến độ · Hạn chấm), **không** có vùng đỏ của khối nợ. **(3) "Lịch Test tuần này"** — như hiện nay (ai thi môn gì tuần đang xem), **thu gọn mặc định**; xem tuần khác thì tiêu đề theo mã tuần (vd "Lịch Test W1 OCT"). Một bài chỉ nằm đúng **một** khối. Hai lịch tách hẳn: **lịch thi của học viên** (khối 3) khác **lịch chấm của GV** (khối 1, 2). Thay "Nợ tuần trước thu gọn" (T13/PR-NV NV-6): nợ = quá hạn thật, bài thi tuần trước **không** vào khối 1 trong cùng tuần, dù đã quá hạn. Ngoại lệ: hạn riêng được dời xa hơn thì bài ở lại khối 2 với badge hạn tới khi hết hạn |
| T16 | Lùi / tiến tuần | Khối 1 **không đổi theo tuần đang xem** (luôn tính theo hôm nay, vẫn theo bộ lọc phạm vi / chi nhánh / lớp) và **luôn đi cùng** màn. Khối 2 **chỉ hiện khi đang xem tuần hiện tại**; xem tuần khác thì ẩn. Khối 3 theo tuần đang xem. Lùi tuần chỉ để xem lại: **không sửa được điều gì làm đổi khối 1** ngoài thao tác nhập điểm thường (không có đường nào xoá nợ bằng cách đổi tuần xem). Tổng bài chưa chấm của 3 khối = badge "n bài chờ chấm" (giữ G-10) |
| T17 | Khối 1 — cột và mục con | Phần dòng lớp (Lớp · Đợt · Kỹ năng · Còn · Hạn · GV chấm · nhãn · Thu) **chỉ dùng cho khối 1** để mở ra lớp / học viên đang quá hạn. **GV chấm: kéo rộng, chỉ ghi tên GV còn chưa chấm** (GV đã nhập xong không hiện), không cắt chữ. Lưới học viên là **mục con** của dòng lớp, thể hiện nhẹ: thụt vào + một vạch dọc mảnh bên trái nối với dòng lớp, nền nhạt hơn, **không** khung bo + viền thứ hai, header cột chữ nhỏ; "Mở lưới đầy đủ" đưa lên dòng lớp. Chi tiết do `impeccable layout` quyết trong PR, giữ bảng màu / phông đã khoá |
| T18 | **Speaking Mock chấm chéo** (chủ sản phẩm 05/10) | Speaking Mock **không có GV mặc định**; cột GV chấm ghi "Chấm chéo" tới khi có người nhập. **Quá hạn**: chỉ **báo** cho **GVBM Speaking của lớp** và **GVCN lớp đó** (dòng ở khối 1 + chuông), nhưng **không tính nợ / quá hạn** vào chỉ số của hai người này (không số đỏ, không "đúng hạn" của Phân tích GV, không "Chờ bạn chấm"). Khi **GV chấm chéo nhập điểm** (người ghi ở "GV chấm Speaking", T39) thì mới tính: nhập sau mốc trễ (`mocTreNhapDiem`) = **trễ của chính người đó**. GV chấm là tên người ngoài (không tài khoản) → không tính trễ cho ai. Thay dòng "ô S vẫn là việc / nợ điểm của GV được phân công S lớp đó" (PR-HSM) |

## 2. Giao diện (mockup bản 4)

- **Panel Xếp lịch Mock Test** (Kế hoạch Test › "Xếp lịch MT…"): 3 bước Đợt → Tuần và kỹ năng → Học viên.
  Đợt: **MT mới** (đầu tiên, mặc định) · MT1 · MT2 … (không có MT0). "MT mới" = đợt nhỏ nhất của em chưa có lịch, không có thì tạo đợt kế.
  Chọn số = đúng đợt đó, không tự suy sang đợt khác. Kỹ năng: 4 ô tick, **mặc định tick đủ**; bỏ tick = không mock kỹ năng đó.
  Một tuần chung + "Lịch riêng ▸". Bảng học viên: ô **Chọn tất cả / bỏ chọn**, cột chọn + tên đứng yên, cuộn ngang; mỗi dòng **một nhãn ngắn**
  3 màu (xanh xếp được · vàng nên xem · đỏ không xếp được, tự bỏ qua); 3 chip đếm lọc nhóm. Chi tiết ở tooltip.
- **Hộp một đợt** (ô MT ở Kế hoạch Test **và** hồ sơ HV › Lộ trình — cùng `HopKyNang`): ô tuần chung cho kỹ năng đã tick chưa có điểm;
  mỗi dòng: tick · kỹ năng · tuần/điểm · **⋯ luôn hiện** (mục chưa làm được thì mờ, không ẩn). Menu: Đổi tuần · Dời hạn chấm · Báo vắng · Huỷ điểm · Nhật ký.
- **Ô MT** (một component, mọi nơi): Chưa có đợt · Chưa có lịch · Có lịch (viền) · **Đang chọn** (nền sáng, chữ tối, ✓ — chỉ trong panel)
  · **Đang thi** (nền xanh nhạt + chấm) · Chờ chấm (tím) · Quá hạn chấm (đỏ) · Còn việc (vàng) · Xong (xanh) · Xong 3/4 · Huỷ kỹ năng · nhãn "cũ" · MT0.
- **Popup dời vượt** (T2): tiêu đề "Dời MT1 sang W2 NOV?", 2 dòng hệ quả, ô Lý do, nút "Đóng" / "Dời và huỷ".
- **Lịch Test (T15–T17, chốt tối 05/10):** ba khối "Test quá hạn chấm" (thu gọn) · "Test chấm tuần này" (mở) · "Lịch Test tuần này" (thu gọn); khối 1 không đổi theo tuần xem, khối 2 chỉ ở tuần hiện tại. Thay dòng "Nợ tuần trước thu gọn mặc định" trước đó.
- **MT0** hiện ở: Lộ trình tiếp theo (một em, cả lớp) · việc của QL · Kế hoạch Test lớp thường cạnh Final · Lịch Test / Nhập điểm tuần Final
  · Chuyển tiếp lớp (cột MT0) · bảng Mock Test hồ sơ HV + Hành trình.

## 3. Các cổng phải theo cùng luật (T14)

Kế hoạch Test (lưới FT, Xếp lịch MT, Xếp hàng loạt, Thi lại, lớp thường) · hồ sơ HV › Lộ trình (Áp lịch gợi ý, Huỷ lịch, nhập điểm tại chỗ)
· hồ sơ Mock (Dời cả đợt, hạn, huỷ / mở lại lượt, xếp lại vắng, từng kỹ năng) · gõ "-" ở Lịch Test / Nhập điểm / bảng lớp thường
· Chờ duyệt (đề nghị dời) · tự động (Thêm HV, tạo / lên lớp, lộ trình mới, cron chốt vắng) · Điểm theo lớp (chữ) · màn chỉ hiển thị
(Học viên & Lớp, Hành trình, Tổng quan, Công việc, Phân tích, Xuất Excel MT). Mỗi đường ghi có phép kiểm theo luật mới.

## 4. Chia PR (chạy sau khi DL, K26, SL merge)

| Đợt | PR | Gồm |
|---|---|---|
| 4 | **PR-NV** | T8, T9 (bỏ "Nợ tuần trước thu gọn" — nằm trong PR-LT3) |
| 4 | **PR-CHU** | File `thiet-ke/CHU_CAN_SUA_2026-10.md`: mọi chữ trên web dài / gượng / buồn cười — chữ hiện tại, nằm ở đâu (màn › khu vực › file:dòng), ngữ cảnh, vì sao chối. Không sửa mã |
| 4 | **PR-MTa** | Luật máy chủ T1, T2, T3, T4, T7, T10 (phần máy chủ), T11 + đổi chữ "MT lịch sử" → "MT cũ" |
| 5 | **PR-MTb** | Giao diện mục 2 (trừ MT0) + T10 phần web; dùng luật PR-MTa |
| 5 | **PR-LT3** | T15–T18: Lịch Test ba khối + Speaking chấm chéo (kế hoạch chi tiết chưa soạn); merge sau NV, MTa, trước MT0 |
| 5 | **PR-MT0** | T5, T5b (máy chủ + web); merge sau PR-MTb và PR-LT3 |
| 6 | PR-HK2 | Như cũ |

## 5. Nghiệm thu chung
- Mỗi luật có phép kiểm đỏ trước trên DB test; mỗi cổng ghi ở mục 3 có ít nhất một phép kiểm theo luật mới.
- Không mất dữ liệu: không đường TỰ ĐỘNG nào xoá điểm (dời vượt, vắng, chuyển lớp…); "huỷ" là đánh dấu, khôi phục được. Huỷ điểm tay của Quản lý giữ như 29/09.
- Bấm thử 375 / 1440, sáng / tối, vai Quản trị, Quản lý, GVCN, GVBM.
- Chữ trên màn đúng mockup bản 4, không thêm câu giải thích.
- Turso: không tham số đặt tên, UNION ≤ 20 vế, đường mới có trần ở `tocDoDuong.ts`; "Nhắc tất cả" 50 thẻ < 10 giây.
