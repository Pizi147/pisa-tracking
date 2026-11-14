# Đề bài mockup đợt 2: ⓪ ⑥ ⑦ ⑧ ⑨ ⑩ (overhaul V6)

PTA Overhaul · 15/11 · theo lời 34, 35. Mỗi mockup một session con Opus 5.5 · high. Chủ SP đang thức: duyệt trong session con SAU KHI PTA Overhaul rà theo từng dòng R.

**Đọc trước, cho MỌI mockup** (thư mục `docs/superpowers/specs/2026-11-13-overhaul-v6/`): `loi-chu-sp.md` (nhất là lời 4–7, 17, 20, 24, 28, 32–35) · `04-thiet-ke.md` mục 2, 3, 12–15 · **`10-ra-dong-bo.md`** (kết quả rà — nguồn chi tiết của đề bài này, có đường dẫn mã) · `luat/0-luat-core-mot-trang.md` · `luat/5-y-do-thiet-ke-gan-day.md` (mục 2 "phải giữ", 3 "ngôn ngữ thao tác", 5 "đã bị bác") · bộ chuẩn `thiet-ke/v21/bang-mau.html` + `bang-mau-ghi-chu.md` + `v21.css` · `DESIGN.md` Luật V5 · `CLAUDE.md`. Skill: `impeccable` (layout, clarify, adapt; critique trước khi báo xong).

## Luật chung

- **G1 Nâng cấp màn đang có, không dựng lại.** Giữ bố cục, hình ảnh, MỌI thao tác của màn hiện tại + mockup nền đã duyệt (ghi ở từng mục; danh sách "Giữ" ở `10` mục C). Chỉ đổi điều đề bài nêu. Chạy web thật (`npm run seed`, `npm run dev` ở cổng riêng của worktree) để xem màn hiện tại; tắt tiến trình của mình khi xong.
- **G2 Đồng bộ là mục tiêu số một** (lời 34: "cần đồng bộ những chỗ cần đồng bộ, với những gì tôi đã chốt"). Cùng chức năng = cùng thành phần, cùng chữ, cùng vị trí như bộ chuẩn ⑤ và các chuẩn sau (đã quyết ở `10` mục B, không chờ mockup ⓪ sửa xong):
  - thanh tab + badge viên tròn (đỏ = việc của tôi quá hạn · vàng = hôm nay · mờ = chỉ đếm); badge / nút-chip việc = **chữ loại việc + SỐ, không đơn vị** ("Nhập điểm 6", không "6 bài" — lời 35); không biểu tượng trong nút-chip;
  - ô chọn người / lớp / học viên = **ô chọn có tìm** (mẫu A), mục liên quan đứng trước; danh sách ngắn cố định giữ dáng chip / đoạn;
  - chân panel việc (lời 36): mở từ danh sách còn việc kế → "Đóng" · "Lưu" · **"Lưu · việc tiếp ›"** (chính); hết việc kế / mở lẻ → "Đóng" · "Lưu"; lưu xong "✓ Đã lưu"; dòng quy chế một dòng trên chân, câu lấy từ bảng câu ⑤;
  - dải chỉ số mỏng cao 44, số bấm được, 0 không bấm (Tổng quan QL / Admin và Phân tích giữ số to — ⑤ [XM-11]);
  - lịch sử một kiểu, một tên **"Lịch sử · n"** (không "Nhật ký" cho cùng khái niệm; Quản trị giữ tên "Nhật ký" cho nhật ký hệ thống);
  - menu thả một kiểu; không "⋯" chỉ một mục; nút là nút (không dáng chữ link cho thao tác); tên HV / mã lớp là link; "›" = đổi trang; ⓘ = giải thích (không giải thích bằng rê chuột);
  - câu lỗi tải "⚠ Không tải được … · Thử lại"; số việc "n việc · ⚠ m quá hạn"; không hạn = cột hạn trống;
  - **tên bậc vi phạm VIẾT HOA**: REPORT 1 … · WL 1 · WL 2; **thang cấp bậc là thanh vạch thường, KHÔNG chữ trong thanh, mốc WL chỉ khác màu + nổi hơn (lời 36)**; viết đủ "WARNING LETTER 1" ở danh sách bậc khi mở "Thang ▾", panel Xác nhận xử lý / Thu hồi, bậc hiện tại của em ở tab Ý thức, dòng lịch sử xử lý, nội dung báo PH; viết tắt "WL 1" ở chip, cột bảng, dòng việc, badge, 375 (lời 35);
  - thời gian: mã tuần "W2 OCT"; ngày chỉ cho hạn, ngày thi, ngày sinh, lịch sử; ô ngày = ô gõ + nút lịch.
- **G3 Không** thêm chú thích tĩnh, bước xác nhận cho thao tác thường ngày, tab / màn mới ngoài đề bài, thành phần đề bài không yêu cầu. Không đụng luật nghiệp vụ; thấy chỗ đụng → [XM].
- **G4 Đầu ra:** `thiet-ke/v21/<tên>.html` + `<tên>.css` riêng (`v21.css`, `bang-mau.css` CHỈ ĐỌC — trừ session ⓪) + `<tên>-ghi-chu.md` (bảng truy vết khung → thành phần → TRƯỚC → SAU có dòng GIỮ / BỎ · bảng thao tác TRƯỚC → SAU · [XM] · bảng tự rà từng dòng R) + ảnh từng khung ở `thiet-ke/v21/anh/<tên>/` (1440 Tối + Sáng, 375 Sáng; kiểm `document.fonts` đã nạp Be Vietnam Pro trước khi chụp). Mỗi khung có ảnh **TRƯỚC (web hiện tại) │ SAU (mockup)** ghép cặp để chủ SP xem. 1440 + 375, Sáng + Tối, đủ trạng thái (rỗng, đang tải, lỗi, chỉ xem). Tên người bịa.
- **G5 Xong:** mở PR chỉ gồm tệp trong `thiet-ke/v21/`, tiêu đề "mockup v21: … — chờ chủ SP duyệt", KHÔNG merge; nhắn session "PTA Overhaul": số PR, bảng tự rà, [XM], đường dẫn ảnh. Chủ SP nói gì trong session thì ghi nguyên văn vào tệp ghi chú mục 0 và chuyển lại PTA Overhaul. Không hỏi chủ SP điều đề bài / tài liệu đã trả lời.

## ⓪ Sửa đồng bộ năm mockup đã duyệt — sửa tại chỗ các tệp `thiet-ke/v21/*` hiện có

Chỉ session này được sửa các tệp v21 đang có (kể cả `v21.css`, `bang-mau.css`). Không vẽ lại, không đổi bố cục.
- R0.1 Sửa HẾT các dòng ở `10-ra-dong-bo.md` mục A (đã chốt mà chưa theo) — nặng nhất là mockup ① `trang-dau-gv.html` (Báo cáo PH vào tab Vận hành · chip không biểu tượng · bỏ chip Chấm Speaking ở "Lớp của tôi" · "Chấm Speaking" · dòng việc "Lớp · tên việc ngắn" · badge Chấm Speaking mờ + ⚠ · "GV chấm" và bước chọn em theo mẫu A) và bảng câu ⑤ (Q9 MT0 vắng như Mock — lời 32; Q72 thẻ thu hồi tự chốt theo GVCN — lời 33).
- R0.2 Sửa HẾT mục B (cùng chức năng khác dáng) theo cột "nên theo" + chuẩn G2: chân panel · câu quy chế trong ②③④ theo bảng ⑤ · dải chỉ số · badge tab · menu "+ Task" · hộp chọn em · câu lỗi / hết việc · lịch sử · "không hạn" · số đếm việc · chip hạn · các dòng lặt vặt.
- R0.3 Lời 35: mọi nút-chip và badge việc chỉ **chữ loại + số** (bỏ "bài", "việc", "em" trong chip / badge). Dòng việc trong danh sách giữ phần phụ như ⑤.
- R0.4 Tên bậc theo G2 ở mọi chỗ trong năm tệp; panel Xác nhận xử lý (⑤ D1a / D1b) có thang cấp bậc nổi WL 1 / WL 2 như ③. Thêm vào ⑤ một ô mẫu "Tên bậc: chỗ viết đủ │ chỗ viết tắt".
- R0.5 Hồ sơ HV giữ dòng việc không tiền tố "Lớp ·" (đã duyệt); hồ sơ HV giữ TVV ở đầu, hồ sơ lớp không.
- R0.6 Cập nhật năm tệp `-ghi-chu.md`: xoá / sửa [XM] đã cũ hoặc trái lời chốt (`10` mục "[XM] mâu thuẫn" nếu có, ① [XM-2], [XM-5], ⑤ [XM-15], bảng kê ⑤ mục 3).
- R0.7 **Bảng "đã sửa gì"** trong `thiet-ke/v21/dong-bo-ghi-chu.md`: mỗi dòng = tệp · khung · trước → sau · nguồn; kèm **ảnh cặp TRƯỚC │ SAU của từng chỗ sửa** ở `thiet-ke/v21/anh/dong-bo/` (chụp bản trước từ `origin/main`). Chỗ "chưa chắc" ở `10` phải kiểm tận nơi rồi mới sửa; không chắc → [XM].

## ⑥ Học viên & Lớp — `thiet-ke/v21/hoc-vien-lop.html`

Nền: `thiet-ke/v11/hoc-vien-lop.html` · `thiet-ke/v16/lich-thi.html` · `thiet-ke/v9/phan-cong-gv.html`. Mã + chỗ lệch: `10` mục C1. Vai vẽ: GV (chính) · QL · TVV (tab Lịch thi).
- R6.1 Giữ 4 tab (Tất cả · Đang SOS · Lịch thi · Phân công GV) về thanh tab chuẩn; lớp gập, tìm tên tự mở; 5 môn mở dưới hàng; em nghỉ không hiện.
- R6.2 Bộ lọc: "Mọi lớp", "Mọi TVV" là ô chọn có tìm ("Lớp của tôi" / "Tôi" đứng trước), có ở cả tab Tất cả; ô "Xem" (chi nhánh) cùng dáng; hàng lọc cùng vị trí ở mọi tab.
- R6.3 Một tên cột **"Việc cần làm"** (thay "Việc của tôi" / "Việc tiếp") dùng nút-chip chuẩn, chỉ việc của người xem; bấm = mở panel việc tại trang.
- R6.4 "Mở tất cả", "Bỏ lọc", "Xoá lọc thêm", Hoàn tác, Thử lại: nút chuẩn. Trạng thái rỗng một dòng ngắn.
- R6.5 **Tab Lịch thi = THÔNG TIN (lời 35):** không badge việc trên tab, không cột việc, không nút-chip việc, không menu "Đặt lịch ▾". Hàng: em (link) · lớp · **lịch thi** (tháng dự kiến / ngày đã chốt / chờ KQ / KQ thi) · **thông tin hiện tại của em** (Target · MT gần nhất · SOS · lộ trình + tuần học). Thao tác đang có GIỮ ĐỦ cho người có quyền: bấm thẳng giá trị để sửa (tháng, ngày, KQ) hoặc mở dưới hàng (Bước tiếp, + Ghi chú, Lịch sử · n chuẩn), có Hoàn tác. Lọc "Cần làm / Tất cả" → đề xuất lọc theo trạng thái thi (Chưa chốt ngày · Đã chốt · Chờ KQ · Có KQ) — ghi [XM] để chủ SP quyết.
- R6.6 Tab Phân công GV: giữ một bảng cả chi nhánh, sửa theo dòng, hiệu lực Ngay / Từ tuần, hỏi bàn giao; ô "Xếp", ô tuần theo chuẩn; Quản trị mở vào chi nhánh gần nhất.
- R6.7 Đầu trang: Xuất Excel · + Thêm học viên · ⋯ giữ; thêm link **"Lưu trữ ›"** thấy được (nay trong ⋯), mọi vai xem được.
- R6.8 375: lớp thành thẻ gập; Lịch thi mỗi em một thẻ hai dòng (lịch thi · thông tin hiện tại).

## ⑦ Test — `thiet-ke/v21/test.html`

Nền: `thiet-ke/v11/lich-test-tuan.html` · `thiet-ke/v11/ke-hoach-test.html` · `thiet-ke/2026-11-13-test-g1/` · `thiet-ke/v7/ho-so-luot-test.html`. Mã + chỗ lệch: `10` mục C2. Vai vẽ: GV (Lịch Test tuần, nhập điểm) · Admin văn phòng / QL (Kế hoạch Test, xếp lịch). Chủ SP "chưa hình dung ra" → ảnh TRƯỚC │ SAU phải rõ từng điểm đổi.
- R7.1 Lịch Test tuần: hàng lớp ghi THẲNG trên hàng — đợt (MT2 · Progress…), môn của tôi, hạn chấm (chip hạn chuẩn), bài chờ duyệt dời — không để trong rê chuột. Dải số về dải chuẩn (0 không bấm). Hai nhóm "Quá hạn chấm" · "Test tuần này" giữ.
- R7.2 Lưới nhập điểm giữ nguyên (theo GD-3: hộp nhập "Lưu · bài tiếp ›" + "Vắng" + "⋯").
- R7.3 Kế hoạch Test: lưới HV × MT giữ; ô mờ "Đã xoá · Khôi phục" giữ; S Ex ô dẹt riêng; GV chỉ xem. Hộp xếp một kỹ năng (`HopKyNang`): Dời · Vắng · Xoá giữ, MỘT chân chung (Ghi chú · Lưu), "Lịch sử · n" và "Mở hồ sơ MT ›" vào ⋯ / đầu hộp. Nút xếp hàng loạt một nhãn theo khung đang chọn; nút tắt thì lý do đặt tại nút.
- R7.4 Trang lượt Test (FT + lớp thường cùng khung): menu "Chỉnh lịch" theo menu chuẩn; "Lớp lúc Test" là link; một khối "Lịch sử · n"; bỏ chú thích tĩnh (công thức Writing → ⓘ).
- R7.5 Một tên một khái niệm: "Xoá" (không "Bỏ khỏi đợt", không "Xóa") · "Chưa đủ MT" (bỏ "Cần xếp lại" nếu cùng nghĩa — kiểm, khác nghĩa thì [XM]) · dòng đang lọc "Lớp: X ✕" ở cả hai tab · công tắc khung và tab trong ngăn xếp lịch theo thanh tab / đoạn chuẩn · ô tìm kế hoạch / tìm lớp là ô chọn có tìm.
- R7.6 "Nhập điểm lớp ›" từ nơi khác trỏ thẳng Lịch Test đúng tuần + lớp (ghi trong bảng thao tác).
- R7.7 375: Lịch Test tuần mỗi lớp một thẻ có đủ đợt · môn · hạn; Kế hoạch Test cuộn ngang có cột em dính.

## ⑧ Tổng quan QL / Admin / CX + Hồ sơ GV — `thiet-ke/v21/tong-quan.html`, `thiet-ke/v21/ho-so-gv.html`

Nền: `thiet-ke/v8/tong-quan.html`. Mã + chỗ lệch: `10` mục C3, C4. Chủ SP (lời 35): **"Gom chung cái gì được thì gom chung"** — khối / số / link cùng nghĩa gom về một chỗ; mỗi chỗ gom ghi vào bảng TRƯỚC → SAU.
- R8.1 Tổng quan giữ là trang tình hình (không form), ô số thẻ lớn, cả ô bấm được, 0 không bấm và không "›". Một dáng cho số đổi trang. Một tên cho số Case ở ô, cột, tiêu đề panel.
- R8.2 QL / Quản trị nhiều chi nhánh và CX: có ô **"Việc của tôi ›"** và **"Chờ duyệt"** (cùng nguồn badge chuông); bảng "Theo chi nhánh" của CX bấm được dòng như của Quản trị.
- R8.3 Ba vai (QL một chi nhánh · QL / QT nhiều chi nhánh + CX · Admin văn phòng) dùng CHUNG một khung: hàng ô số → khối danh sách chính → cột phải; khối nào hai vai cùng có thì cùng dáng, cùng chỗ. Liệt kê khối đã gom.
- R8.4 Hồ sơ GV: đầu trang giữ (Vai · Kỹ năng sửa tại chỗ có Hoàn tác · "Việc của {tên} ›"); "GVCN n lớp" → mã lớp là link. Dải số chuẩn: **Đúng hạn · Làm muộn · Chưa làm** (cùng số, cùng tên với Phân tích GV), mọi số mở panel.
- R8.5 Hồ sơ GV gom 9 khối thành **3 tab chuẩn: Lớp · Học thuật · Việc & Case** (khối trùng ý gom lại); nhận hai bảng "Kỹ năng tôi dạy", "Lớp tôi chủ nhiệm" + 3 ô số từ Tổng quan GV cũ (GD-1) vào tab Lớp — chỉ khi xem hồ sơ của chính mình; "Em đang bổ trợ" giữ.
- R8.6 Head tutor xem như GV (lời 16) — không vẽ Tổng quan riêng.
- R8.7 375 cho cả hai màn.

## ⑨ Phân tích (chỉnh, KHÔNG làm lại) — `thiet-ke/v21/phan-tich.html`

Nền (đã duyệt, giữ hình ảnh sát): `thiet-ke/2026-11-12-phan-tich-v2/phan-tich-v2.html` · `thiet-ke/v19/phan-tich.html` · `thiet-ke/v20/ti-le-gv.html` · `thiet-ke/v13/phan-tich-thi-that.html`. Chi tiết: `10` mục D. Giữ: 5 tab · số to để trình chiếu · số không trùng giữa các tab · bấm một lần ra panel có lý do · "Toàn bộ" chỉ ở đây. Chỉ vẽ các khung CÓ ĐỔI + một khung toàn trang mỗi tab để thấy không lệch.
- R9.1 Tab Giáo viên: ô "Chưa làm" bấm được → panel mọi bài / việc quá hạn nhóm theo GV, mỗi dòng có lớp · việc · hạn (dòng việc chuẩn, chỉ đọc).
- R9.2 Mọi giải thích đang nằm trong rê chuột → ⓘ ở đầu thẻ / đầu cột (Ý thức, SOS, khối PA); 375 đọc được.
- R9.3 Hàng lọc cố định vị trí giữa 5 tab: ô không áp dụng thì mờ (không biến mất); ô "Mọi lớp" và ô tìm GV là ô chọn có tìm.
- R9.4 Ô Thi thật ở tab Chi nhánh ghi rõ kỳ ("W1–W4 NOV"). Nhãn có đơn vị: "Đạt MT · HV", "Đạt kỳ vọng Test · lượt".
- R9.5 Tab Thi thật: ô mới **"Sắp thi · 6 tuần · còn SOS"** → panel em: lớp · ngày thi · mức SOS · TVV (lời 35 ý 9). Ghi ước lượng đọc (+ 2–3 câu) trong ghi chú.
- R9.6 Thanh tab, panel, Xuất theo bộ chuẩn; không đổi gì khác.

## ⑩ Quản trị + Lưu trữ — `thiet-ke/v21/quan-tri.html`, `thiet-ke/v21/luu-tru.html`

Nền: `thiet-ke/2026-11-11-quan-tri-v2/quan-tri-v2.html`. Mã + chỗ lệch: `10` mục C5, C6. **Không thêm tab Quản trị, không khung mới** (chủ SP 12/11).
- R10.1 Quản trị giữ 8 tab, "danh sách → sửa tại dòng → nhật ký", lưu có Hoàn tác, QL chỉ xem (một câu chỉ-xem chung). Mọi ô chọn người / chi nhánh / vai dài → ô chọn có tìm; danh sách ngắn giữ.
- R10.2 Nhật ký một dáng dòng ở mọi tab; QL có "Xem tất cả ›". "Mở sửa lịch Test" là công tắc như ở Quyền. Chương trình sửa tại dòng như Chi nhánh (nếu vướng dữ liệu nhiều trường → giữ panel, ghi [XM]).
- R10.3 Lưu trữ: 3 tab chuẩn có số — Lớp đã kết thúc · Học viên đã lưu trữ · **Đã xoá** (câu "giữ 30 ngày" vào ⓘ). Học viên dùng BẢNG cùng dáng với lớp (tên link · trạng thái · ngày · nút); lọc chi nhánh dùng ô "Xem" như Học viên & Lớp.
- R10.4 Giữ đủ: Tổng kết · Mở lại · Quay lại học (một / n em) · Xử lý tiếp · Sửa thông tin · Chọn nhiều · Khôi phục · Hoàn tác; tab "Đã xoá" ở Quản trị dùng cùng thành phần.
- R10.5 375 cho Lưu trữ; Quản trị 375 chỉ cần tab Tài khoản.
