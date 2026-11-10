# Phân tích V2 — 4 báo cáo chính, số không trùng (thiết kế, 12/11/2026)

Nguồn: lời chủ SP 12/11 (`plan.md` mục 4, hai dòng "12/11 Phân tích V2"), brainstorming PTA Plan cùng ngày.
Trạng thái: **chủ SP duyệt hướng 12/11 ("Còn lại theo đề xuất, làm nhé")** → mockup → chủ SP duyệt mockup → kế hoạch PR → code.
Xuất Excel định dạng đẹp: **làm SAU khi chốt mockup web** (chủ SP), có đặc tả riêng.

## 1. Vì sao

- Phân tích có 6 tab (Báo cáo · Test + SOS · Thi thật · Hiệu quả PA · Phân tích GV · Ý thức), nhiều số lặp:
  - "Đạt Target thi thật" ở 4 chỗ: Tổng quan, Báo cáo, Thi thật, Phân tích GV.
  - "Case có PA", "PA cải thiện", "Tiến bộ": mỗi số 3 chỗ.
  - Tab Báo cáo gần như chép lại số của các tab khác.
- Luật đếm việc / bài chấm đã chuẩn (sổ nghĩa vụ, `2026-11-09-so-nghia-vu-design.md`, #1292 #1294), nhưng Phân tích GV vẫn bày nhiều cột cũ.
- Chủ SP cần báo cáo **trực diện, không dày**. Số phải cần thiết, rõ, dùng được, và **không trùng nhau giữa các báo cáo chính**.

## 2. Ý chính (giải thích cho chủ SP)

Mỗi em đi qua 3 chặng: **Học** → nếu tụt thì **được giúp (SOS)** → **Thi thật**. Thầy cô đi cùng em suốt đường.
Mỗi chặng một báo cáo, thầy cô một báo cáo:

| Báo cáo (tab) | Trả lời câu hỏi | Nhà của các số |
|---|---|---|
| **Chi nhánh** | Các em có theo kịp bài không? | Học viên đang học · Đạt kỳ vọng Test · Tiến bộ · (lớp thường) Cuối khoá |
| **SOS** | Em bị tụt có được giúp không? | SOS 1 · 2 · 3 · Thiếu điểm · SOS theo kỹ năng · Xử lý (Case, PA) · PA nào hiệu quả |
| **Thi thật** | Đi thi có đạt Target không? | Đạt Target · Tổng thể · Vượt / Đạt / Chưa đạt · Không thi · Chưa có KQ · Theo kỹ năng · Theo GV |
| **Giáo viên** | Thầy cô làm việc có đúng hạn, học trò có theo kịp không? | Chấm Test và Việc: Đúng hạn · Làm muộn · Chưa làm · Đạt kỳ vọng Test của học trò GV |

Thêm **Ý thức** (giữ nguyên). Tab Phân tích: **Chi nhánh · SOS · Thi thật · Giáo viên · Ý thức** (6 → 5).

### 2.1 Luật "không trùng"
- Một số (chỉ số + cách chia) chỉ nằm ở **một** báo cáo. Muốn xem số của báo cáo khác thì bấm lối "›" sang, không chép lại.
  - "Đạt kỳ vọng Test của lớp / chi nhánh" ở Chi nhánh. "Đạt kỳ vọng Test của học trò GV A" ở Giáo viên. Hai số khác nhau, không phải trùng.
  - Thi thật theo GV ở Thi thật (CX đang xem được ở đó, chủ SP 05/11). Báo cáo Giáo viên có lối "Thi thật theo GV ›".
- **Tổng quan giữ nguyên.** Đó là trang nhìn nhanh mỗi ngày, không phải báo cáo chính. Số ở Tổng quan bấm vẫn mở cùng danh sách, vì dùng cùng hàm tính.
- Mỗi số vẫn theo Hợp đồng số liệu (`thiet-ke/HOP_DONG_SO_LIEU.md`): một số = một hàm, số trên ô = số dòng khi bấm, ghi rõ "trong kỳ" / "hiện tại".

### 2.1b Bấm một lần (chủ SP 12/11)
"Khi bấm gì dó thì có thể làm gọn hơn là bấm 1 lần thôi thì ra box thông tin/ panel thông tin liên quan và nhanh chóng luôn hạn chế bấm nhiều lần đi".
- Mọi số, mọi đoạn thanh, mọi ô: **bấm một lần là mở panel / hộp thông tin đúng tập**. Không có thông tin chỉ hiện khi rê chuột, không có bước trung gian kiểu "bấm để xem chi tiết rồi bấm tiếp".
- Panel mở nhanh: một lần tải, đọc đúng tập của ô (không đọc lại cả báo cáo). Đầu panel tóm tắt luôn phần chia nhỏ (vd panel "Chưa đạt": chia theo lớp n · m), không phải bấm thêm.

### 2.2 Một khuôn cho mọi báo cáo
1. Hàng lọc chung như bây giờ (Fast Track / Lớp thường · khoảng tuần · lớp). Nút Xuất Excel ở cuối hàng (Excel định dạng mới làm sau, mục 7).
2. Dải 3–4 số chính. Bấm số ra danh sách (panel bảng có điểm như bây giờ, `BangLuotPanel`).
3. Một bảng **Theo lớp** khi xem một chi nhánh, hoặc **Theo chi nhánh** khi xem Tất cả chi nhánh (QT, CX). Cột giống dải số. Bấm tên chi nhánh thì lọc về chi nhánh đó, như bây giờ.
4. Nếu cần, một bảng riêng của báo cáo.

**Khoảng mặc định (chủ SP 12/11):** "Báo cáo vẫn là 2 tuần một lần mặc định đi nhé, báo cáo chi nhánh thì là cái duy nhất theo tháng, còn lại theo 2 tuần, nhưng nhớ là vẫn để phần khung tgian 2 tuần đầu cuối như bây giờ để chọn khung thời gian".
- **Chi nhánh:** mặc định **một tháng** — các tuần của tháng hiện tại theo mã tuần (vd W1 NOV → tuần cuối của NOV). Đây là lựa chọn của PTA. Họp đầu tháng muốn xem tháng trước thì chọn lại bằng ô khoảng tuần.
- **SOS · Thi thật · Giáo viên · Ý thức:** mặc định **2 tuần gần nhất**, như bây giờ (`khoangPhanTichMacDinh`).
- **Giữ nguyên ô chọn khoảng** (Toàn bộ · Chọn khoảng tuần · tuần đầu → tuần cuối), không thêm nút "Tháng".
- Mặc định chỉ dùng khi URL chưa có khoảng. Người dùng đã chọn khoảng thì đổi tab vẫn giữ (C29, như bây giờ). Mở tab Chi nhánh từ link không có khoảng thì ra tháng; sang SOS khi URL vẫn chưa có khoảng thì ra 2 tuần.

## 3. Báo cáo Chi nhánh (thay tab Báo cáo)

**Chủ SP 12/11:** "Bảng Chi nhánh cần có những phần số quan trọng to hơn một chút để có thể trình chiếu cho cả chi nhánh/ quản lý cùng quan sát trong buổi họp."

- **Dải số chính, cỡ trình chiếu:** số to hơn hẳn các tab khác. Đọc được từ cuối phòng họp qua máy chiếu 1280 × 720: phần dải số + bảng chính phải nằm trong một màn, không cuộn. Người làm mockup chọn cỡ (gợi ý số 40–48 px, nhãn 15–16 px), tương phản cao, không dùng chữ mờ cho số. Bảng bên dưới dùng cỡ chữ thường của web.
- Số chính:
  1. **Học viên đang học** (hiện tại) — Fast Track / lớp thường theo hàng lọc. Dòng nhỏ: "vào n · kết thúc m" trong kỳ (**số mới**: em vào lớp / Kết thúc học có ngày trong kỳ; session mockup ghi rõ lấy từ bảng nào). Không thêm Tạm dừng nếu làm chật dải số (để người làm quyết).
  2. **Đạt kỳ vọng Test** (trong kỳ) — Fast Track: như "Đạt MT" bây giờ (HV có lượt MT chốt, Overall so kỳ vọng của lượt). Lớp thường: HV đạt ≥ ngưỡng của lớp ở bài Progress / Final trong kỳ (cùng luật "Đạt Test" của Phân tích GV).
  3. **Tiến bộ** (trong kỳ, Fast Track) — lượt có band tăng so mốc MT trước (cùng hàm "Tiến bộ theo kỹ năng").
  4. **Lớp thường:** **Cuối khoá** — HV có Final trong kỳ chia Đạt (≥ 70 %) · 60–69 · 50–59 · < 50 (dải theo Rulebook §20.6).
- Bảng **Theo lớp / Theo chi nhánh:** HV đang học · Đạt kỳ vọng · Tiến bộ (· Cuối khoá với lớp thường).
- Bảng riêng: **Tiến bộ theo kỹ năng** L R W S — Tăng · Giữ · Giảm (giữ bảng sẵn có).
- **Bỏ khỏi màn:**
  - Bảng "Kết quả MT so Target" (MT0 → MT3+ · Thi thật). Cùng một bài Test mà đo bằng hai thước (kỳ vọng và Target) thì dễ rối. Dòng Thi thật trùng báo cáo Thi thật. Điểm + Target từng em vẫn xem được trong panel khi bấm số.
  - Ô "Đạt Target thi thật", "Thi trong kỳ" → Thi thật. Ô "PA cải thiện", "Case có PA" → SOS.
- Giữ nút **In** (A4 ngang).

## 4. Báo cáo SOS (thay tab Test + SOS và tab Hiệu quả PA)

**Chủ SP 12/11:** "Để bố cục khá giống với bảng SOS hiện tại là ok rồi, không cần 'lên lại kỳ vọng'."

- **Giữ bố cục tab Test + SOS hiện tại:** dải số + bảng "Xếp theo tuần / lớp / đợt Test / chi nhánh", mở dòng con, nhóm cột, Cột hiện, ⋯ (Xuất kết quả từng lượt, Excel Mock), cách tô màu chip SOS.
- Dải số: Lượt MT (mẫu số) · SOS 1 · 2 · 3 · Thiếu điểm (gồm SOS tạm) · Chưa chốt PA (hôm nay, ⚠ quá hạn) — như bây giờ.
- **Không trùng với Chi nhánh:** bỏ cột / ô **"Đạt"** ở SOS (Đạt kỳ vọng ở Chi nhánh). Nhóm cột "kỹ năng dưới kỳ vọng · HV" và "Xử lý" giữ.
- **Lớp thường:** giữ bảng lớp thường đã gọn (05/11: Bài kiểm tra · Progress Test · Final Test · Thiếu điểm). Nếu số "đạt" của bài nằm ở Chi nhánh thì SOS lớp thường chỉ giữ phần chưa đạt + Thiếu điểm; người làm mockup vẽ và ghi rõ trong bảng truy vết.
- Bảng riêng **PA nào hiệu quả:** giữ nguyên nội dung tab Hiệu quả PA (thẻ PA có kết quả · Có cải thiện · Thời gian thường mất; bảng PA do GV thêm; bảng PA theo quy chế; lọc `gv` từ link hồ sơ GV). Đặt dưới bảng chính, cùng trang.
- Không có số "Lên lại kỳ vọng ở Test sau" (chủ SP bỏ).

## 5. Báo cáo Thi thật (giữ tab Thi thật 05/11, sửa phần số)

**Chủ SP 12/11:** "Đúng là tôi cần số liệu 'không thi' thật, hiện tại đã có nút lựa chọn là không thi chưa nhỉ, khi cập nhật kết quả thi thật ấy · Nhớ là các GV KCK thì không tính vào số chính, nhưng vẫn cần có kết quả để biết số liệu, bạn đề xuất thể hiện thế nào cho đẹp cho tốt nhé · Không cần số 'sau thi'."

### 5.1 Hiện trạng (PTA kiểm 12/11)
- **Đã có ô "Không thi"** khi nhập kết quả thi thật: hồ sơ HV › Kết quả thi thật (`KetQuaThiThatPanel`, ô tick "Không thi") và panel Sau thi ở Công việc của TVV (`PanelSauThi`). Tab Thi thật đã đếm "Không thi" riêng, không vào %.
- Bản chép thật (07/11): **0 em** được đánh Không thi · 34 lộ trình có đủ 4 kỹ năng · **khoảng 49 lộ trình đã qua ngày thi mà chưa có KQ, cũng chưa đánh Không thi** (đếm thô, session đếm lại đúng hàm) · 20 lộ trình KCK, 1 em có KQ.
- Nghĩa là số Không thi hiện chưa thật vì chưa ai đánh. Các em không thi đang nằm lẫn trong "chưa có KQ".

### 5.2 Số chính (chủ SP 12/11, ba lần: KCK gồm WL 2 · cần tỉ lệ đạt tổng thể · "KCK không cần quan tâm quá nhiều, cho vào danh sách tổng hợp điểm thi/ danh sách thi là được" · đổi chữ "có cam kết", "mọi em có target")
- **KCK** trong báo cáo này = em không cam kết Target **hoặc em đã nhận WL 2** (bậc `wl_2` thang Ý thức, cùng lộ trình, trước ngày thi). Chỉ gom trong báo cáo; web KHÔNG tự chuyển em sang KCK (luật không đổi).
- Một khối "Kết quả thi thật", hai số %, một thanh:
  - **Đạt Target** (số to) — Vượt + Đạt trên số em thi có KQ, **trừ KCK**. Dòng nhỏ: "18/25 em · trừ KCK".
  - **Tổng thể** (cạnh đó, nhỏ hơn) — cùng cách tính nhưng **gồm cả KCK**. Dòng nhỏ: "20/31 em · gồm KCK".
  - Em không có Target (phần lớn em KCK — bản chép 07/11: 16/20 lộ trình KCK không có Target) không tính vào % nào; ghi trong ⓘ, không thành số riêng.
  - **Thanh** Vượt · Đạt · Chưa đạt (chỉ phần trừ KCK, màu `lopKq` như bây giờ). Bấm một đoạn = mở panel danh sách đoạn đó (luật 2.1b).
  - Chữ cấm dùng trên màn: "có cam kết", "mọi em có Target". ⓘ giải thích: "KCK gồm em không cam kết Target và em đã nhận WL 2. Em không có Target không tính vào %."
- **Không thi** — em được đánh "Không thi", không vào %.
- **Chưa có KQ** (**số mới**, hiện tại) — em đã qua ngày thi, chưa có KQ, chưa đánh Không thi (`trangThaiSauThi`, `da_thi_cho_kq`). Bấm ra danh sách để TVV / QL gọi hỏi rồi nhập KQ hoặc đánh Không thi.
- Không có số "Sau thi" / bước tiếp (chủ SP bỏ). Cột "Bước tiếp" trong danh sách kết quả: giữ như bây giờ (chỉ đọc).

### 5.3 Em KCK trong danh sách
- KHÔNG có thẻ / đoạn thanh KCK riêng (bỏ đề xuất thẻ KCK trước đó).
- Danh sách kết quả thi thật: em KCK giữ trong danh sách, có chip "KCK" (em WL 2: chip "WL 2") cạnh mức; bộ lọc mức (nếu có) thêm "KCK".
- Bảng Từng kỹ năng và Theo GV: không tính KCK (như bây giờ).

### 5.4 Giữ
Từng kỹ năng (so Target overall) · Theo GV (QL / QT / CX, trọng số tuần dạy) · Danh sách kết quả thi thật (nhóm lớp, phân trang, Xuất Excel hiện có). Thêm bảng Theo lớp / Theo chi nhánh: Em thi · Vượt · Đạt · Chưa đạt · Không thi · Chưa có KQ.

## 6. Báo cáo Giáo viên (thay tab Phân tích GV)

- Mỗi GV một dòng, **xếp theo tên, không xếp hạng, không màu ngưỡng** (C08). Hàng "Chưa phân công" cho bài chưa ai nhận (sổ nghĩa vụ 1.2a).
- Cột:
  - **Chấm Test:** Đúng hạn · Làm muộn · Chưa làm (+ dòng phụ "S chéo chung" theo sổ nghĩa vụ 1.2c).
  - **Việc:** Đúng hạn · Làm muộn · Chưa làm.
  - **Đạt kỳ vọng Test** của học trò GV (lượt của kỹ năng GV dạy trong kỳ; lớp thường "Đạt Test").
- Dải số đầu: Chấm Test đúng hạn % · Việc đúng hạn % · Chưa làm (n bài · m việc) · Chưa phân công.
- Bấm số ra panel 3 tab (Chưa làm · Làm muộn · Đúng hạn) như sổ nghĩa vụ 1.7. Bấm tên GV mở hồ sơ GV.
- Xem "Tất cả chi nhánh": mỗi người một dòng, bấm thì tách ra từng chi nhánh (sổ nghĩa vụ 1.7).
- Lối "Thi thật theo GV ›" sang báo cáo Thi thật (khối Theo GV).
- **Bỏ khỏi bảng:** Tiến bộ · HV cần chú ý · Case có PA · PA cải thiện · Kết quả thi thật. Các số này đã có nhà ở Chi nhánh / SOS / Thi thật; muốn xem kỹ một GV thì bấm tên mở hồ sơ GV. Bỏ công tắc Gọn / Đầy đủ (`?cot=day`) vì bảng còn ít cột; link cũ vẫn vào được màn.
- Quyền: như Phân tích GV bây giờ (`nav.phanTichGv`: QL, QT).

## 7. Xuất Excel (làm sau)

- Chủ SP 12/11: "Xuất excel 4 bảng đầu: chi nhánh, SOS, Thi thật, Giáo viên cần có format sẵn khi xuất excel, bản đẹp, dễ nhìn, dùng được luôn và xịn xò, nhưng cái này để sau khi chốt mockup bảng phân tích trên website trước đã nhé".
- Sau khi chủ SP duyệt mockup web, PTA soạn đặc tả Excel riêng (mẫu tệp có định dạng: đầu tệp, màu, độ rộng cột, số dạng số, % dạng %, trang Danh sách). Mockup web chỉ cần vẽ **vị trí nút Xuất Excel** giống nhau ở cả 4 báo cáo.
- Các nút xuất cũ giữ nguyên: Xuất Excel Test + SOS, Xuất kết quả từng lượt, Excel Mock, Excel Thi thật, Excel Ý thức.

## 8. Ràng buộc

- CLAUDE.md: màn đổi bố cục → mockup HTML trong `thiet-ke/` (1440 + 375, tối, đủ trạng thái: có số, rỗng, lỗi, đang tải, chưa có quyền). Chủ SP duyệt rồi mới code. **Một màn một PR** (4 PR web: Chi nhánh · SOS · Thi thật · Giáo viên; khung tab có thể đi cùng PR đầu).
- **Nâng cấp, không chép:** giữ mọi thao tác cũ (bấm số → panel, Xếp theo, mở dòng con, Cột hiện, ⋯ xuất, In, lọc `gv`, link cũ `?goc=…`). Ghi bảng thao tác TRƯỚC → SAU; mất thao tác nào phải có lý do.
- Link cũ: `goc=bao-cao` → Chi nhánh, `tong-hop` → SOS, `hieu-qua-pa` → SOS (cuộn tới khối PA), `ket-qua-thi` → Thi thật, `giao-vien` → Giáo viên (`replace`, như `gocNhinTuThamSo` đang làm với tên cũ).
- **Turso:** mỗi báo cáo tải một lần khi mở. Dùng lại đường đang có: Chi nhánh (`/tong-quan/v5?kemBaoCao=1`), SOS (`/phan-tich/tong-hop` + `/phan-tich/hieu-qua-pa`), Thi thật (`/phan-tich/thi-that`), Giáo viên (sổ nghĩa vụ). Số mới ("vào / kết thúc", "Chưa có KQ", thẻ KCK) tính trong cùng lần tải. Panel / Excel chỉ đọc khi bấm. Không đọc cả bảng rồi lọc. Đo trước → sau trong mô tả PR, có trần ở `tocDoDuong.ts`.
- Luật giao diện V5 / 21/10: báo cáo thuần (không thao tác làm việc trên màn), ô số = mở tại chỗ, "›" = đổi trang, ⓘ = giải thích, không điều khiển trong tiêu đề bảng, "Toàn bộ" chỉ ở Phân tích. Không chú thích tĩnh (bộ nhớ bo-chu-thich).
- Không đổi luật nghiệp vụ. Không đổi quyền ai xem tab nào.

## 9. PTA tự quyết sau rà đọc thử (12/11 — chủ SP xem lại được)

1. **"Đạt kỳ vọng Test" ở Giáo viên = cột "Đạt kỳ vọng Test" đang có** của Phân tích GV (`server/src/phanTich/giaoVien.ts`, đếm theo lượt kỹ năng GV dạy, lớp thường "Đạt Test"; S chéo, nhiều lớp, nhiều chi nhánh theo đúng hàm đó). Không viết hàm mới.
2. **Chi nhánh "Đạt kỳ vọng Test" = ô "Đạt MT" đang có** của tab Báo cáo (`datMt`, đếm theo HV; lớp thường đếm HV đạt ngưỡng, dùng lại hàm "Đạt Test"). Hai số khác đơn vị: Chi nhánh đếm **HV**, Giáo viên đếm **lượt**. Mỗi số giữ hàm của nó, tên ghi kèm đơn vị như bây giờ ("HV" / "lượt"). Người làm có thể giữ tên "Đạt MT" (FT) cho Chi nhánh nếu thấy rõ hơn.
3. **"Vào · kết thúc" (Chi nhánh):** đếm **em**, không đếm lượt ghi danh. "Vào" = em có lần ghi danh (`enrollments.started_at`) ĐẦU TIÊN ở chi nhánh nằm trong kỳ. Em chuyển lớp, học lại hay sang lộ trình mới không tính là vào. "Kết thúc" = `students.finished_at` (Kết thúc học) trong kỳ. Dữ liệu đã có (bản chép 07/11: 947 lần ghi danh, 87 có ngày kết thúc), không cần migrate. Một câu, trong cùng lần tải.
4. **Thi thật khi đang chọn Lớp thường:** giữ như bây giờ. Tab Thi thật luôn là Fast Track và ẩn ô chương trình (`coCt = false`). Sang tab khác thì trở về chương trình đang chọn.
5. **Tháng mặc định của Chi nhánh:** dùng đúng cách chia tuần vào tháng của mã tuần đang có (`tuanLich`). Tháng hiện tại = mọi tuần mang mã tháng đó, kể cả tuần chưa tới. Đầu tháng ít số thì người dùng chọn lại khoảng; không tự lùi tháng.
6. **Khối PA ở SOS:** có ở cả Fast Track và Lớp thường, như tab Hiệu quả PA bây giờ (PA theo quy chế lớp thường = Bổ trợ). Hai tab cũ không chặn quyền riêng nên khối PA hiện cho mọi người đang xem được SOS. Link cũ `goc=hieu-qua-pa` → SOS và cuộn tới khối PA.
7. **Bỏ "Đạt" ở SOS:** mẫu số là "Lượt MT". Ô SOS ghi "n · x %" trên số lượt. Không vẽ ô "còn lại".
8. ~~Thẻ KCK~~ — bỏ (chủ SP 12/11: KCK chỉ trong danh sách, xem 5.2–5.3).
9. **"Chưa có KQ" là số HIỆN TẠI:** mọi em đã qua ngày thi, chưa có KQ, chưa đánh Không thi, không lọc theo kỳ, nhãn ghi "hiện tại". Lý do: số này để TVV / QL gọi hỏi, lọc theo kỳ thì em thi tháng trước sẽ mất khỏi số. Các số còn lại của Thi thật vẫn theo kỳ (ngày thi trong kỳ).

## 10. Để người làm quyết
- Cỡ chữ, khoảng cách chính xác của dải số trình chiếu (mục 3). Thứ tự khối trong từng báo cáo. Cách xếp 375.
- Cách vẽ khối "Đạt Target · Tổng thể" + thanh (mục 5.2), miễn là hai số không lẫn nhau và đọc được trong 3 giây.
- Lớp thường ở SOS: giữ những cột nào sau khi bỏ "đạt" (mục 4). Ghi lý do trong bảng truy vết.
