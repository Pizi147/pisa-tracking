# Đặc tả UX toàn web trước deploy — PISA Progress

**Ngày:** 22/09/2026 · **Session:** planning · **Trạng thái:** chủ sản phẩm đã duyệt từng mockup trong buổi brainstorm 22/09.
**Quyết định gốc:** làm HẾT việc còn lại (kiểm kê) + làm lại UX theo mockup, xem giao diện sau mỗi đợt, rồi mới deploy bản chính (PR-Z2c).

## 0. Nguồn và thứ tự ưu tiên

Khi các nguồn lệch nhau, **nguồn trên thắng nguồn dưới**:

1. File này.
2. Mockup đã duyệt ở `thiet-ke/mockup/`, cùng phương án ghi ở §3 (trong file mockup có nhiều phương án; chỉ phương án ghi ở đây là đã duyệt).
3. `thiet-ke/THUAT_NGU_DA_CHOT.md`: chữ trên màn. Cột "Sửa thành" trống thì giữ nguyên chữ.
4. `docs/superpowers/specs/2026-09-22-kiem-ke-truoc-deploy.md`: danh sách việc có mã (O…, Q…, P…, R…, S…, YT-…, F-…, AN-…, RB-…, DOC-…).
5. `docs/superpowers/specs/2026-09-22-ux-audit-hien-trang.md`: lỗi UX của bản hiện tại (dùng để kiểm, không phải để thiết kế).
6. `plan.md`, `thiet-ke/*` cũ.

Mockup là HTML tĩnh nền tối. Chúng quy định **bố cục, thứ tự, chữ, trạng thái**, không quy định màu chính xác. Màu và thành phần lấy theo hệ giao diện có sẵn (`web/src/ui/*`, `thiet-ke/HE_GIAO_DIEN.md`).

## 1. Luật giao diện chung (áp mọi PR)

| Mã | Luật |
|---|---|
| G-1 | Dấu tích ✓ nhỏ, mảnh, cùng màu chữ phụ. Không dùng icon tích to hay có nền. |
| G-2 | Cột và hàng thẳng: số dùng `tabular-nums`; cột số canh phải hoặc giữa, cố định độ rộng (`table-layout: fixed` / `colgroup`); các hàng cùng bảng cao bằng nhau. |
| G-3 | Không dồn chữ: tối đa **một** dòng phụ dưới dòng chính, dòng phụ ≤ ~60 ký tự. Thông tin thêm đưa vào ⓘ hoặc panel. |
| G-4 | ⚠ chỉ nghĩa là **quá hạn**. Các trạng thái khác dùng badge chữ. |
| G-5 | Bỏ mọi khối chữ giải thích cho dev (`SectionNote` giải thích mô hình). Luật cần thiết đưa vào popover ⓘ cạnh tiêu đề. |
| G-6 | Ngày không bao giờ hiện dạng ISO. Ngày: `dd/mm` (cùng năm) hoặc `dd/mm/yyyy`. **Tuần lịch: `W{n} {THÁNG}`** (vd `W3 SEP`, `W1 OCT`, tháng viết tắt tiếng Anh in hoa). **Tuần học trong khoá: `W{n}/{tổng}`** (vd `W8/8`). Không dùng "T5", "tuần 5", "Tuần 36". Dùng một hàm chung (tạo ở PR-O, §7). |
| G-7 | Viết tắt được giữ (GVCN, GVBM, PA, SOS, FT, KV, OVR, L R W1 W2 S) luôn có tooltip bản đầy đủ. Icon ⋮ ⋯ ⓘ ▸ ✓ luôn có tooltip. |
| G-8 | Panel không chồng panel. Mở việc khác từ một panel thì đóng panel cũ rồi mở panel mới. |
| G-9 | Mọi ô dán bằng chứng nhận: **Ctrl+V dán ảnh chụp màn hình**, kéo thả, chọn tệp, dán liên kết. |
| G-10 | Mọi số trên dashboard bấm được, mở đúng danh sách tạo ra số đó (`<SoLieu>`). Mọi hạn hiển thị qua `<Han>`. |
| G-11 | Mobile (375px): bảng rộng cuộn ngang **trong thẻ**, trang không cuộn ngang. Thanh 4 khu vực chuyển thành thanh dưới 4 nút. |
| G-12 | Mọi module có hơn một lối vào phải có mục trong bảng định vị (§4). Không thêm nút ở chỗ chưa ghi trong §4. |

## 2. Luật chữ

- Nguồn: `thiet-ke/THUAT_NGU_DA_CHOT.md` (1.214 dòng, 228 dòng đã sửa). PR nào chạm chữ nào thì dùng chữ mới cho chữ đó. PR-S3 quét phần còn lại.
- Dạng "Ngắn · Đầy đủ": chỗ chật dùng dạng ngắn, chỗ rộng hoặc tooltip dùng dạng đầy đủ.
- **"Case"** luôn viết hoa. **HS/học sinh → HV/học viên.** "Biện pháp" → **"Phương án (PA)"**. Màn trộn hai loại thì ghi "PA xử lý" / "PA học thuật".
- Kết quả PA: **Tiến bộ rõ · Tiến bộ một phần · Không tiến bộ · Kém hơn**.
- Không mở đầu câu bằng "Hãy".
- Đổi tên: Tiến độ công việc → **Công việc** · Thực trạng → **Hiện trạng** · Báo cáo tuần chi nhánh → **Báo cáo đơn vị** · Sự kiện nổi bật → **Điểm đáng chú ý** · chưa ổn → **Cần hỗ trợ** · hụt → **Thiếu** · Độ phủ đánh giá → **Tỷ lệ học viên đã có điểm** · Thời gian trung vị → **Thời gian thường mất** · Khử trùng → **Không đếm trùng** · Lịch kiểm tra (FT) → **Lịch Test**.
- **Lớp thường** (không viết "Normal" trên màn): tên bài **Giữa khoá · Cuối khoá** (không "Progress/Final Test", không "MT"); kết quả **Đạt / Chưa đạt · "Đạt 3/4 môn"** (không "đạt kỳ vọng", không Overall); kỹ năng **L R W S** (W không tách Task 1/2); đầu hồ sơ ghi **khoá đang học**, không ghi mục tiêu band.
- Giữ riêng vì khác nghĩa: Bỏ / Gỡ; Đề xuất / Đề nghị.

## 3. Quyết định theo khu vực (mockup đã duyệt)

### 3.1. Khung 4 khu vực — `01-dieu-huong.html`, phương án **A**
- Thanh ngang trên cùng: **Tổng quan · Học viên & Lớp · Test · Công việc**. Mobile: thanh dưới 4 nút.
- Hiện theo quyền; khu vực không có quyền thì bỏ hẳn. GV thấy khu Công việc (chỉ tab Hỗ trợ học viên) và khu Test (Cần chấm, Lịch Test).
- Redirect mọi đường dẫn cũ (`/hoc-thuat`, `/tien-trinh`, `/tien-do-cong-viec`, `/tong-hop-tuan`, `/tong-quan?cn=`).
- Ẩn nhãn "Bản demo nội bộ" khi `laBanChinh()`.

### 3.2. Tổng quan — `02-tong-quan.html`
- **Quản lý (phương án A):** thanh ngữ cảnh (chọn chương trình Lớp thường/FT/Cả hai · chọn chi nhánh · "Dữ liệu đến {ngày}"); tab **Tổng quan | Phân tích**; 4 ô số: **HV dưới kỳ vọng · HV có Case mở · Chờ xác minh quá hạn** (tín hiệu SOS lớp thường quá 3 ngày) **· PA học thuật cần cập nhật**; khối **Cần xử lý** đặt cạnh khối **Điểm đáng chú ý** (≤ 3 nhận định có số + link); **Lịch sắp tới** thu gọn; bảng chi nhánh mở xuống lớp.
- **Giáo viên:** **Việc cần làm của tôi**, gom theo nhóm (Chấm điểm · Case học thuật · Ý thức & Phối hợp · Vận hành), có số đếm; nhóm có việc quá hạn tự mở. Thêm **Học viên cần hỗ trợ**.

### 3.3. Phân tích — `03b-phan-tich-v2.html`
Một hàng chọn góc nhìn + bộ lọc chung. Bỏ "Việc đã giao" và `/tong-hop-tuan`.
- **Vấn đề HV:** ma trận nhiệt; hàng **L, R, W1, W2, S** (lớp thường: L R W S), mở ra từng loại lỗi; cột là lớp hoặc chi nhánh; cột "Lỗi phổ biến nhất".
- **Kết quả hỗ trợ:** chia theo kỹ năng rồi theo loại PA; cột: PA có kết quả · HV · có cải thiện (thanh) · không tiến bộ · thời gian thường mất; dưới 5 thì ghi "ít dữ liệu".
- **Tổng hợp Test + SOS:** bảng lớn 3 nhóm cột. Kết quả: Lượt, Đạt, SOS1–3, Tạm thời, Chưa đủ điểm. Dưới kỳ vọng / chưa đạt theo kỹ năng. Xử lý: HV có Case, Case, Đang xử lý, Thiếu PA học thuật. Dòng theo tuần / lớp / đợt; có dòng tổng; xuất Excel. Lớp thường dùng cột L R W S và "Chưa đạt" thay "Dưới kỳ vọng".
- **Ý thức & Phối hợp:** bảng nhóm × trạng thái, 9 loại PA, tách SOS1/2/3, lọc theo lớp.
- **Theo giáo viên (`06e-ql-xem-gv.html`, bảng):** mỗi cột một câu hỏi: Đang dạy · Chưa đạt ở môn mình dạy n/N · Vấn đề nhiều em mắc nhất (n em) · PA có hiệu quả k/n (thanh) · Cập nhật đúng hạn. Hàng mở ra theo kỹ năng. **Không xếp hạng.** Đây là danh sách GV duy nhất (không có tab Giáo viên ở khu Học viên & Lớp).

### 3.4. Công việc — `04-cong-viec.html`
- **Hỗ trợ học viên:** gom nhóm như Tổng quan GV; lọc nhanh Tất cả / Quá hạn / Hôm nay / Tuần này; dropdown **Người phụ trách** (Tôi / Tất cả / Chọn giáo viên… có tìm) và **Loại việc**; QL có nút "Nhắc" và "Duyệt" ngay trên dòng.
- **Vận hành:** hàng số (quá hạn / chờ người khác / cần quyết định / vừa hoàn thành); bảng 5 cột; dời hạn giữ hạn cũ + lý do; Tạm dừng bắt buộc lý do, người cần hỗ trợ, ngày xem lại; việc con quá hạn hiện tên.
- **Báo cáo đơn vị (phương án A):** ma trận đơn vị × hạng mục ở trên cùng; trạng thái Đã nộp / Nháp · chưa nộp / Chưa báo cáo; bấm ô mở panel bên phải (trạng thái, nội dung, liên kết việc Vận hành, **bằng chứng** theo G-9). Lưu nháp lúc nào cũng được; ngoài cửa sổ nộp chỉ khoá nút "Nộp".

### 3.5. Test — `05a-test-cham-diem.html`, `05a2-can-cham-v2.html`, `05b-ke-hoach-test.html`, `10b-lop-thuong-v2.html` §2, §4
- Tab **Cần chấm · Lịch Test · Kế hoạch Test**. GV chỉ thấy hai tab đầu. Tab mặc định: GV → Cần chấm; người xếp lịch được → Lịch Test.
- **Lịch Test:** danh sách các lượt Test của một tuần (chọn tuần `W3 SEP`), nhóm theo lớp: lớp · đợt (MT{n} / Giữa khoá / Cuối khoá) · kỹ năng · số HV · trạng thái chấm; bấm dòng mở lưới chấm. PR-O dựng bản tối thiểu chỉ đọc; PR-Rc1 hoàn thiện.
- **Cần chấm (05a2 phương án A):** các mục Quá hạn / Tuần này / Sắp tới. Mỗi dòng: lớp + đợt · kỹ năng · còn n bài · nút **Chấm**, bấm vào mở thẳng lưới chấm. Hạn tự đúng theo loại lớp (lớp thường: Chủ nhật của tuần thi môn đó; FT: thứ Tư tuần sau).
- **Lưới chấm chung FT và lớp thường (05a §2):** ô môn mình dạy sửa được, môn khác chỉ đọc; cột kết quả tính ngay; tự lưu; Enter sang ô kế; luật đưa vào ⓘ.
  - FT: một số band mỗi ô; "-" = vắng, theo luật FT hiện có.
  - **Lớp thường: mỗi ô hai số, số câu đúng / tổng số câu, cả hai đều điền.** Ô "tổng" trên đầu cột chỉ để điền nhanh cả cột (↓); sửa riêng từng em được; ô khác tổng của cột có viền vàng. **Không có tổng cố định theo chương trình.** Nhập "-" = em vắng → môn đó tự dời sang tuần sau (C08; máy chủ bỏ chặn "-" cho lớp thường). Đạt khi ≥ 70%; thiếu điểm không tính là chưa đạt.
  - Mở thẳng `/nhap-diem/:id` của một lớp thường thì chuyển sang lưới lớp thường (hiện đang hiện lưới FT).
- **Chấm trên điện thoại (05a §3, phương án A):** một kỹ năng một lúc.
- **Kế hoạch Test (05b):**
  - FT: lưới cả lớp (HV × MT1–5), mỗi đợt 2 hàng (RLW, S), ô tô màu theo trạng thái; bấm ô sửa tuần (cảnh báo trùng; trùng tuần MT kế tiếp thì **chặn**, T15). Xếp lịch hàng loạt: **ngăn trượt phải, 5 bước trên một màn** (phương án A), có xem trước thay đổi. Tiêu đề "Kế hoạch Mock Test" khi chỉ có FT.
  - **Lớp thường (10b §4):** xếp **theo lớp**, không theo từng HV. Mỗi lớp 2 hàng (Giữa khoá, Cuối khoá) × 4 cột L R W S; ô ghi tuần `W3 SEP`; máy tự đề xuất tuần theo chương trình (FOU W4 và W8; BE, ELE W5 và W10); bấm ô đổi tuần một môn; nút **Dời một môn**.

### 3.6. Học viên & Lớp — `07b-hoc-vien-theo-lop.html` (A), `07c-cot-ket-qua.html` (A), `10b` §1
- Một trang, **nhóm theo lớp**. Hộp đầu lớp: mã · chương trình · n HV · GVCN · tối đa 2 badge · ⋯.
- Trong lớp: HV xếp A→Z (đổi được sang "Cần chú ý trước").
- Điều khiển: một ô tìm (tên / mã HV / mã lớp); chọn chi nhánh; dropdown **Phạm vi** (Lớp tôi dạy / Chi nhánh / Tất cả); chip lọc có số đếm (gồm "Case thiếu PA học thuật").
- Cột: **Học viên** (mã 6 số, chữ mờ) · **Kết quả gần nhất** · **Mục tiêu** (FT) / **Khoá** (lớp thường) · **Case** · **Việc tiếp theo** (mỗi việc một badge, mỗi badge một dòng, xếp chồng không đè) · ⋯.
- Kết quả gần nhất FT: Overall to + "thiếu x" đỏ + chip SOS; dòng phụ "MT2 · kỳ vọng 6.5 · Thiếu L 5.5" (kỹ năng viết tắt). "Thiếu" tính theo kỳ vọng của chính đợt đó.
- Kết quả gần nhất lớp thường: "Đạt 3/4 môn" + chip SOS; dòng phụ "Giữa khoá · chưa đạt W 12/20".
- Cột Khoá (lớp thường): "FOU · W8/8" + dòng phụ ngày kết thúc, hoặc "tiếp theo: …" **chỉ khi đã ghi Lộ trình tiếp theo** (§3.9).

### 3.7. Hồ sơ lớp — `06-ho-so-lop.html` (menu dòng A), `06c-dau-trang-va-ho-so-gv.html` §1, `10b`
- **3 tab:** Học viên · Ý thức & Phối hợp · Phân tích lớp. Bỏ tab Giáo viên.
- Hàng tiêu đề, các nút: **Lộ trình lớp** (FT) / **Lịch kiểm tra** (lớp thường) · **Chuyển tiếp lớp** (chỉ lớp thường) · **+ Case** · **+ Học viên** · **Nhập điểm Test** · **⋮** (Sửa phân công giáo viên, Sửa thông tin lớp). "Chuyển tiếp lớp" bỏ khỏi menu ⋮.
- Dòng thông tin: GVCN trong một hộp nhỏ, nhạt. Dòng dưới là GV bộ môn trên **một dòng không xuống hàng**, gom theo người ("L · R Trần Ngọc Hà"), viết tắt có tooltip, quá dài thì "+2", tên bấm được mở hồ sơ GV. Sau đó là tối đa 2 badge.
- Nút ⋯ cuối mỗi dòng HV mở menu nhỏ: **Hồ sơ · + Ghi nhận vi phạm · + Case · Nhập điểm · Lộ trình tiếp theo** (lớp thường) **· Chuyển lớp**.
- Tab Học viên có hai chế độ Điểm / Cần hỗ trợ.
  - FT: như hiện có (đợt MT).
  - **Lớp thường (10b, phương án A):** hai nhóm cột **Giữa khoá | Cuối khoá**, mỗi nhóm L R W S, ô `đúng/tổng` đỏ nếu chưa đạt; ô chưa tới lịch ghi tuần thi.
- Tab Phân tích lớp: FT là ma trận 5 kỹ năng × MT1…MT5. Lớp thường là 4 môn × Giữa khoá/Cuối khoá, ghi "n/N HV đạt".

### 3.8. Hồ sơ học viên — Hành trình `08e-hanh-trinh-lich.html`, `10b` §3, `11` §4
- **Trục lịch:** tháng + tuần W1–W4, tuần hiện tại tô sáng. Kết quả Test là ghim nhỏ trên trục.
- Mỗi kỹ năng một hộp: chuỗi điểm + badge trạng thái ("Cần hỗ trợ · 10 tuần" / "Đã ổn"). Mỗi vấn đề là một hàng; các khối PA nối nhau theo thời gian, có tên và kết quả bằng chữ; PA song song xuống tầng hai (không ghi chữ "chạy song song").
- Bấm thanh PA hoặc tên vấn đề → mở thẻ Case tương ứng ở ngăn trượt phải, cuộn tới đúng PA, không rời tab. Không có sự kiện Ý thức ở đây.
- **Giai đoạn:** HV học cả lớp thường và FT có hai nút chọn giai đoạn ở đầu tab. Mỗi giai đoạn một trục riêng, không trộn.
  - Giai đoạn lớp thường: dải **Khoá** theo đúng thứ tự thời gian (FOU → BE → ELE), ghim Giữa/Cuối, chuỗi điểm theo %, 4 hộp L R W S.
  - Giai đoạn FT: 5 hộp L R W1 W2 S, ghim MT1…MT5.
- **Lịch sử lớp** (11 §4): bảng nhỏ đầu tab. Cột: Lớp · Thời gian · Kết thúc vì (**Lên lớp** / **Chuyển lớp** / …) · Kết quả.
- Đầu hồ sơ HV lớp thường không có Mục tiêu hay Dự kiến thi. Thay vào đó: khoá đang học, và "tiếp theo: …" nếu đã ghi.

### 3.9. Lên lớp, chuyển lớp — `11-chuyen-lop.html`, `12-ban-do-vi-tri.html`
Ba việc tách rõ:
1. **Lộ trình tiếp theo** (chỉ lớp thường): GVCN hoặc QL ghi cho từng em bất cứ lúc nào.
   - Lựa chọn: Lên lớp thường tiếp ({chương trình}) · Chuyển sang Fast Track (thêm Mục tiêu band, Tháng dự kiến thi; điền sau được) · Học lại {khoá} · Bảo lưu · Dừng học · Chưa rõ.
   - Thêm: lớp dự kiến (không bắt buộc), ghi chú. Lưu thành dữ liệu riêng của em. Chỉ là dự định, không đổi lớp.
   - **Mặc định không hiện khoá tiếp theo.** Hai tuần cuối khoá mà chưa ghi thì hiện badge "Chưa có lộ trình tiếp theo" và thêm việc cho GVCN.
2. **Chuyển tiếp lớp** (cuối khoá, cả lớp, chỉ lớp thường, QL).
   - Giữ từ bản cũ: ô "Lớp đích cho cả lớp", sửa riêng từng em, lớp mới chỉ tạo khi xác nhận.
   - Mỗi em một dòng: Lộ trình tiếp theo (điền sẵn từ bước 1, sửa được) · Lớp đích · Cần điền thêm (FT: mục tiêu, tháng thi; không chuyển: lý do, ngày xem lại).
   - Em không chuyển **bắt buộc** có hướng: Bảo lưu / Học lại / Dừng học / Xếp sau, kèm lý do.
   - "+ Mở lớp mới": mã, chương trình, tuần khai giảng (**sửa lỗi**: hiện ô này bị bỏ qua), GVCN.
   - **Bước Xác nhận** tóm tắt: bao nhiêu em đi đâu, Case được xử lý thế nào.
   - Việc đỏ "Hết khoá · n HV cần xếp lớp tiếp" giữ nguyên; bấm vào mở panel này; hết đỏ khi mọi em đã có hướng. Lớp hết khoá không còn HV đang học thì tự thành "Đã kết thúc".
3. **Chuyển lớp** (một em, giữa khoá, FT và lớp thường, QL và GVCN).
   - Chọn chi nhánh → lớp · ngày hiệu lực · lý do chọn nhanh, **bắt buộc** (Đổi chi nhánh · Đổi lịch học · Xếp lại trình độ · Khác) · lưu ý bàn giao **bắt buộc**, có lựa chọn "Không có lưu ý".
   - Case đang mở tự giao cho GV cùng kỹ năng ở lớp mới (đổi được). Bài Test chưa làm đi theo em.
   - Lớp đích khác chương trình thì hỏi thêm như bước 2.

**Luật lộ trình:**

| Trường hợp | Lộ trình | Case đang mở |
|---|---|---|
| Chuyển lớp FT → FT | **Giữ nguyên** | Giữ, giao GV cùng kỹ năng |
| FT kết thúc | Chỉ đóng khi bấm **Kết luận lộ trình** (có sẵn ở ⋮ hồ sơ HV) | — |
| Lớp thường → lớp thường, cùng khoá | Giữ nguyên | Giữ, giao GV cùng môn |
| Lên lớp thường tiếp | Đóng khoá cũ (hoàn tất), mở khoá mới | Đi theo em, giao GV cùng môn |
| Lớp thường → FT | Đóng khoá cũ, mở lộ trình FT (mục tiêu, tháng thi) | Tự đóng "Chuyển sang Fast Track" (S17) |

Quyền phải khớp giữa menu, máy chủ và việc đỏ.

### 3.10. Tín hiệu SOS lớp thường — `10b` §5
- Lớp thường giữ mô hình tín hiệu (Q-V3-1, chủ sản phẩm xác nhận 22/09). FT giữ tự tạo Case.
- **Mỗi môn chưa đạt là một tín hiệu riêng**, về GV dạy môn đó (không ai dạy thì về GVCN). Nằm ở Việc cần làm, nhóm Case học thuật.
- Hai nút trên dòng:
  - **Tạo Case:** mở form Case môn đó, điền sẵn điểm.
  - **Bỏ qua:** bấm một lần là xong; ô lý do nhỏ, không bắt buộc.
- Không gom các môn thành một cụm việc. Mức SOS 1/2/3 vẫn tính theo số môn chưa đạt và hiện ở hồ sơ.
- Ô Tổng quan "Chờ xác minh quá hạn" đếm các tín hiệu quá 3 ngày.

### 3.11. Ý thức — `09c-y-thuc-vua.html`
- **Ghi nhận vi phạm** (ngăn trượt):
  - Học viên · Ngày + Môn (tự điền theo môn GV dạy; sửa lỗi V04 web gửi `skill: null`) · chip Nhóm · Mô tả.
  - Cảnh báo trùng một dòng, có link "Xem" · Bằng chứng (G-9).
  - Toast **Hoàn tác** 10 giây.
- **Phương án xử lý** (ngăn trượt):
  - Loại + Phụ trách trên một hàng · Nội dung.
  - Danh sách vi phạm có ô tích. Mục "Thêm vi phạm" liệt kê vi phạm chưa xử lý; vi phạm đã xử lý nằm sau "Xem thêm".
  - Bằng chứng (G-9) · nút Xoá · Lưu · Đã thực hiện.
  - PA đang chuẩn bị sửa được toàn bộ (YT-2); gắn được vi phạm đã xử lý vào PA khác.
- **Dòng vi phạm mở tại chỗ:** Bằng chứng / Phương án / Đã sửa n lần + Sửa, Xoá.
- "Theo thời gian" là danh sách **mọi** vi phạm, có lọc ngày (YT-6). Tóm tắt Ý thức của HV đếm theo chu kỳ học.

### 3.12. Hồ sơ giáo viên — `06d-ho-so-gv-v2.html` (A)
- Mở từ tên GV ở hồ sơ lớp, hoặc từ Phân tích › Theo giáo viên.
- 3 tab: **Học viên đang dạy · Case phụ trách · Hỗ trợ đã thực hiện**. Đầu trang 5 con số trên một dòng, không dùng ô số.
- Tab 1: mỗi kỹ năng một thẻ: Vấn đề hay gặp → Số HV (thanh) → PA đã dùng → Kết quả PA (thanh nhỏ 3 màu).
- Quyền xem: QL xem GV trong phạm vi mình; GV chỉ xem hồ sơ của chính mình.

### 3.13. Form, chọn người, bằng chứng
- Mọi ô chọn người dùng **ô chọn có tìm kiếm**, lưu **ID** (có lựa chọn "Người ngoài (gõ tên)" cho tutor ngoài). Làm trước deploy vì DB bản chính rỗng.
- Form tạo Case, tab nhập bù, bước xác minh: lưu trước; khối Bằng chứng hiện ngay trong panel sau khi lưu, panel không đóng.
- Lớp thường tạo được Case **Writing** (F07; hiện chỉ có W1/W2 và máy chủ từ chối).

## 4. Bảng định vị (mockup `12-ban-do-vi-tri.html`)

| Việc | Nằm ở | Ai thấy |
|---|---|---|
| Lộ trình tiếp theo (ghi) | ⋯ dòng HV ở Hồ sơ lớp · ⋮ Hồ sơ HV | GVCN, QL · lớp thường |
| Lộ trình tiếp theo (hiện) | cột Khoá ở danh sách · dòng dưới tên ở Hồ sơ HV | trong phạm vi |
| Nhắc chưa ghi | badge hộp lớp · Việc cần làm (2 tuần cuối khoá) | GVCN |
| Chuyển tiếp lớp | nút đầu Hồ sơ lớp · badge đỏ hết khoá · Việc cần làm | QL · lớp thường |
| Chuyển lớp một em | ⋯ dòng HV ở Hồ sơ lớp · ⋮ Hồ sơ HV | QL, GVCN |
| Lịch sử lớp | đầu tab Hành trình | trong phạm vi |
| Kết luận lộ trình | ⋮ Hồ sơ HV | GVCN, QL · FT |
| Tín hiệu SOS lớp thường | Việc cần làm › Case học thuật · hộp môn ở Hồ sơ HV · badge Hồ sơ lớp | GV môn đó |
| Chấm điểm | Test › Cần chấm → lưới · nút Nhập điểm Test ở Hồ sơ lớp · ⋯ dòng HV | GV môn đó, QL |
| Kế hoạch Test | Test › Kế hoạch Test | QL |
| Hồ sơ GV | tên GV ở Hồ sơ lớp · Phân tích › Theo giáo viên | QL trong phạm vi · GV (chính mình) |
| Ghi nhận vi phạm | ⋯ dòng HV · tab Ý thức & Phối hợp của lớp và của HV | GV |
| Báo cáo đơn vị | Công việc › Báo cáo đơn vị | QL |

## 5. Quyết định còn lại (22/09)

**Chủ sản phẩm chốt:**

| Mã | Quyết định |
|---|---|
| 4.4 / Q-V3-1 | Lớp thường giữ tín hiệu, không tự tạo Case |
| 4.11 | Giữ `/auth/register`, tài khoản phải QTHT duyệt; thêm giới hạn số lần thử |
| Cách chạy | 2 session code song song, xem giao diện sau mỗi đợt |
| S1 | Bỏ qua tín hiệu: lý do không bắt buộc |

**Session planning tự quyết (theo đề xuất ở kiểm kê §4):**
- 4.1: 4 ô Tổng quan như §3.2.
- 4.2: GV thấy khu Công việc.
- 4.3: "Mở đúng đợt" mở hồ sơ HV `?dot=&kn=`.
- 4.5: S13 giữ quyết định QL, hiện một dòng giải thích.
- 4.6: Netlify Scheduled Function chốt "-" đầu thứ Hai.
- 4.7: lưu ID người.
- 4.8: lưu trước, đính kèm sau.
- 4.9: có Hoàn tác.
- 4.10: duyệt cả gói, nay thay bằng THUAT_NGU_DA_CHOT.
- 4.12: Hành trình không có Ý thức.
- 4.13: làm 3 bộ lọc phụ.
- 4.14: taxonomy hoãn.
- 4.15: GVCN không hoàn thành Case môn khác.
- 4.16: chuyển lớp bắt buộc lý do.
- 4.17: lưu trữ HV chỉ khi QL bấm.
- 4.18: giữ lệnh `them-chi-nhanh`.
- 4.19: duyệt Q-V3 cả gói.
- 4.20: GV thuộc CN theo vai.
- 4.21: gồm hồ sơ GV + DS02 (đếm ngược ô "-"), DS14 (skeleton), DS16 (script quét chữ). DS04 thay bằng ⓘ. Còn lại hoãn.

## 6. Lỗi lớp thường phải sửa (soát 22/09)

| Lỗi | Chỗ | PR |
|---|---|---|
| Bảng chi nhánh đếm "MT chưa nhập / quá hạn" bằng `band IS NULL` → mọi môn lớp thường treo mãi; dùng hạn thứ Tư của FT | `server/src/worklist/branchpulse.ts:293-319` | S1 |
| Danh sách tín hiệu: `missing_scores` dựa `band` → mọi lượt lớp thường "còn thiếu điểm"; `no_plan` không loại lớp thường | `server/src/worklist/signals.ts:70-104` | S1 |
| `caseHeadline` ghi cứng `MT${n}` cho lớp thường | `shared/domain/normal.ts:208` | S1 |
| `standingLine` "đạt kỳ vọng", "trong lộ trình này" cho lớp thường | `server/src/students/standing.ts:71-87` | S1 |
| `/nhap-diem/:id` không chặn lớp thường | `server/src/fasttrack/attempts.ts:1400-1458` | Rc1 |
| Máy chủ từ chối "-" cho lớp thường (C08) | `attempts.ts:1191-1195` | Rc1 |
| Ghi chú sai "phải đủ bốn môn mới… sinh case SOS" | `RegularSheetPage.tsx:196-200` | Rc1 |
| Trạng thái Case theo `attempt_id` mất ở dòng cũ | `regular.ts:578` | Rc1 |
| Không tạo được Case Writing lớp thường (F07) | máy chủ `cases.ts:383-385` · form `QuickReport.tsx:91` | S1 (máy chủ) · Form (form) |
| "Đạt kỳ vọng", "MT{n}", "Số MT đánh lại từ 1" trên màn lớp thường | `SkillBoard.tsx:203,412,917`, `StudentDetailPage.tsx:232-236,387,490`, `ClassRoster.tsx:244-252`, `display.ts:152` | Qb (hồ sơ HV), Qa (roster) |
| Chữ thô `writing` | `ClassRoster.tsx:322`, `StudentsPage.tsx:481` | Qa |
| "tỷ lệ câu đúng" | `CaseBoardPage.tsx:44`, `CatalogAdmin` | Pb |
| Seed ghi 60% thay 70% | `server/src/seed/students.ts:16,593` | S1 |
| Chuyển lớp không đổi lộ trình; sang FT không hỏi mục tiêu; tuần khai giảng lớp mới bị bỏ qua | `transition.ts`, `students.ts:154-223`, `TransitionPanel.tsx:64` | LT |

## 7. Chia PR và đợt (2 session song song)

Tên file, mã việc và ma trận chồng file lấy ở kiểm kê §5. Bổ sung ở đây: PR-Rc tách đôi; thêm PR-GV và PR-LT.

| PR | Phạm vi | Coder (B) | Reviewer |
|---|---|---|---|
| **O** · Khung 4 khu vực | O1–O7, R1 (khung 3 tab Công việc), redirect, hàm chung ngày/tuần G-6, ẩn "Bản demo nội bộ", §3.1 | Sonnet 5 · High (B: Fable 5.1 · Medium) | Opus 5 |
| **S1** · Luật máy chủ | S1 (tín hiệu từng môn: Tạo Case / Bỏ qua), S11–S17, RB-3, RB-6 (4.15), RB-8, RB-9, AN-13, các lỗi §6 gắn S1 | Opus 5 · XHigh (B: Fable 5.1 · High) | Fable 5.1 |
| **Qa** · Học viên & Lớp + Hồ sơ lớp | §3.6, §3.7, Q1–Q5, Q10–Q13, K2-6a, YT-8 | Fable 5.1 · High (B: Sonnet 5 · High) | Opus 5 |
| **AN** · An toàn | AN-1, 3, 4, 5, 6 (4.11), 7, 8, RB-1 (Scheduled Function) | Opus 5 · High (B: Fable 5.1 · High) | Fable 5.1 |
| **Pa** · Tổng quan | §3.2, P1–P6c, giao diện dòng tín hiệu SOS lớp thường ở Việc cần làm (§3.10; máy chủ làm ở S1) | Fable 5.1 · High (B: Opus 5 · High) | Opus 5 |
| **S2** · Điều chỉnh PA học thuật | S2 + S4 | Opus 5 · XHigh (B: Fable 5.1 · High) | Fable 5.1 |
| **Qb** · Hồ sơ HV | §3.8 (Hành trình theo giai đoạn, không gồm Lịch sử lớp), Q9, R7, R8, AN-9, AN-10, chữ lớp thường §6 | Fable 5.1 · High (B: Sonnet 5 · High) | Opus 5 |
| **YT2** · Ý thức phần thiếu | §3.11, YT-1…14, K2-6b…f | Sonnet 5 · High (B: Opus 5 · High) | Opus 5 |
| **Pb** · Phân tích | §3.3 (trừ Theo giáo viên nếu PR-GV nhận), P7–P15 | Opus 5 · XHigh (B: Fable 5.1 · High) | Fable 5.1 |
| **Ra** · Công việc | §3.4, R2–R6, R3b, Q6 | Opus 5 · XHigh (B: Fable 5.1 · High) | Fable 5.1 |
| **Rc1** · Cần chấm + Lịch Test + lưới chấm | §3.5 Cần chấm, Lịch Test, lưới chung, mobile, lớp thường (đúng/tổng, "-" dời tuần), R8 phần lưới, R13, R15, R16, RB-5, DS02, lỗi §6 gắn Rc1 | Opus 5 · XHigh (B: Fable 5.1 · High) | Fable 5.1 |
| **GV** · Hồ sơ GV + Theo giáo viên | §3.12, §3.3 Theo giáo viên | Fable 5.1 · High (B: Opus 5 · High) | Opus 5 |
| **Rc2** · Kế hoạch Test | §3.5 Kế hoạch Test (FT + lớp thường), R9–R12, R14 phần lịch, T9 (`standing.ts:222` dùng `target_at_attempt`), T15 chặn trùng | Opus 5 · XHigh (B: Fable 5.1 · High) | Fable 5.1 |
| **Form** · Chọn người + bằng chứng | §3.13, F-1, F-2, F-3, S5, F07, YT-9 nếu còn | Opus 5 · High (B: Fable 5.1 · High) | Fable 5.1 |
| **LT** · Lên lớp, chuyển lớp | §3.9 toàn bộ, nút Tạm dừng/Kết thúc/Lưu trữ HV (máy chủ lưu trữ làm ở S1) (gồm việc nhắc "Chưa có lộ trình tiếp theo") + Lịch sử lớp ở §3.8 | Opus 5 · XHigh (B: Fable 5.1 · High) | Fable 5.1 |
| **S3** · Chữ cuối | quét THUAT_NGU_DA_CHOT toàn web, S7, S9, RB-2, RB-4, DS14, DS16, DOC-1…6 | Fable 5.1 · High (B: Sonnet 5 · High) | Opus 5 |
| **Z2c** · Deploy | theo `docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md` Task 10–11 | Opus 5 · XHigh (B: Fable 5.1 · High) | Fable 5.1 |

**Đợt** (không chạy song song hai PR cùng sửa một file ✖; hai PR có migrate không merge cùng lúc):

```
Đợt 1:  O   ·  S1
Đợt 2:  Qa  ·  AN
Đợt 3:  Pa  ·  S2
Đợt 4:  Qb  ·  YT2
Đợt 5:  Pb  ·  Ra
Đợt 6:  Rc1 ·  GV
Đợt 7:  Rc2 ·  Form
Đợt 8:  LT
Đợt 9:  S3
Đợt 10: Z2c
```

Sau mỗi đợt: chủ sản phẩm xem demo khoảng 10 phút. Góp ý nhỏ thì đưa vào PR đợt sau; góp ý lớn thì mở PR sửa trước khi sang đợt kế.

## 8. Ngoài phạm vi
- Taxonomy vấn đề (chờ tổ chuyên môn).
- Kho ý tưởng I01–I26.
- DS còn lại.
- Màn tạo chi nhánh.
- Ba ý tưởng đã loại ở plan §20.1.
