# Phân công GV — bảng phân công theo lớp + bàn giao khi đổi GV (thiết kế)

> **Chủ SP duyệt 30/10** (mockup `thiet-ke/v9/phan-cong-gv.html`, "tạm ổn", không mockup lại) kèm 2 chỉnh khi code: (1) **dùng tối đa bề rộng** cho bảng lớp (bảng giãn hết khung, cột ô GV chia đều phần còn lại); (2) **cột GVCN nổi bật hơn một chút** (vd nền surface-2 cả cột + vạch trái nhấn, tiêu đề đậm hơn — theo token sẵn có, không màu mới).

Ngày 30/10/2026 · PTA Plan · chủ SP mô tả qua trò chuyện (brainstorming). Chỗ ghi **[PTA quyết]** là quyết định của PTA, chủ SP chưa nói — duyệt cùng tài liệu.

## 1. Vì sao
- Hiện xem / đổi phân công GV phải mở **từng hồ sơ lớp › ⋯ › Sửa thông tin**; không chỗ nào nhìn cả bức tranh. Chủ SP đang theo dõi bằng **Google Sheet** (mỗi dòng một lớp: L · R · W1 · W2 · S · GVCN · Số buổi; bên phải bảng "DSGV" đếm FT / Normal / Total mỗi GV và bảng "GVCN" đếm FT / Normal / Total lớp chủ nhiệm).
- Muốn: một bảng trên web **thông minh, dễ dùng hơn sheet**: nhìn ai dạy lớp nào, GV nào nhiều / ít lớp, và **đổi phân công ngay tại đó**.
- Khi đổi GV, kiến thức về học viên của GV cũ phải đi theo sang GV mới → **việc bàn giao** (giống bàn giao khi học viên chuyển lớp).

## 2. Mục tiêu
1. Góc mới **"Phân công GV"** ở trang **Học viên & Lớp** (cạnh Tất cả · Đang SOS · Cần làm · Lịch thi). Thấy: **QL, Quản trị, CX**. Sửa: **QL** (+ **Quản trị** — [PTA quyết]: Quản trị có mọi quyền của QL). CX chỉ xem. GV / TVV không thấy góc này.
2. **Bố cục B (chủ SP chọn):** bảng lớp bên trái, tổng hợp bên phải; nếu chật (1440 không đủ chỗ) thì **hai bảng tổng hợp xuống dưới bảng lớp, đặt cạnh nhau**. 375: bảng lớp (thẻ mỗi lớp) rồi hai bảng tổng hợp.
3. **Bảng lớp — mỗi dòng một lớp**, nhóm **"Fast Track · n lớp"** và **"Lớp thường · n lớp"**:
   - FT: cột **L · R · W1 · W2 · S · GVCN**.
   - Lớp thường: cột môn theo **chương trình** của lớp (dùng `oPhanCong(chuongTrinh, kyNang)` sẵn có — cùng ô như Sửa thông tin); [PTA quyết] mỗi chương trình một nhóm con có tiêu đề cột riêng (FOU, BE, Pre FOU… khác môn).
   - Mỗi ô = **ô chọn ▾** (dropdown) liệt kê GV có vai trò giảng dạy ở chi nhánh của lớp; ô chưa có người: "Chưa có" (vàng, có chữ, không chỉ màu).
   - Tên lớp là link mở hồ sơ lớp.
   - Lọc: chi nhánh (như các góc khác), ô tìm lớp / GV, khung FT / Lớp thường (dùng chung bộ lọc trang).
4. **Hai bảng tổng hợp:**
   - **Giảng dạy:** mỗi GV · **FT · Lớp thường · Tổng**. **Đếm theo kỹ năng**: một GV dạy 2 kỹ năng của một lớp = **2** (W1 và W2 tính riêng — khớp sheet: Ms. Hà Hoàng FT = 7).
   - **GVCN:** mỗi GV · **FT · Lớp thường · Tổng** số lớp chủ nhiệm.
   - Bấm một GV ở tổng hợp → **tô sáng** mọi ô của GV đó ở bảng lớp (bấm lại để bỏ). Sắp xếp được theo cột (mặc định Tổng giảm dần). GV có vai trò giảng dạy ở chi nhánh mà 0 lớp vẫn hiện (0) — để thấy người đang trống.
   - Số tổng hợp tính từ **cùng dữ liệu** bảng lớp (một nguồn), đổi ô là số đổi ngay.
5. **Sửa tại chỗ:** chọn GV trong ô → lưu (qua đường phân công sẵn có `ghiPhanCong` + `kiemTruocPhanCong`, ba luật giữ nguyên: mỗi môn một người · đúng một GVCN và GVCN dạy ít nhất một môn · chỉ GV chi nhánh lớp). Sai luật → ô báo lỗi tại chỗ kèm lý do, giá trị cũ giữ. Có **Hoàn tác** (toast) như mọi thao tác.
6. **Hỏi bàn giao khi đổi người** (cả ở bảng này **và** hồ sơ lớp › Sửa thông tin): khi một ô đổi từ GV A sang GV B (A ≠ trống) → hộp nhỏ: **"Tạo việc bàn giao [A] → [B] cho [lớp] · [môn]?"** [PTA quyết: mặc định CÓ]. Bỏ chọn → chỉ đổi người. Đổi GVCN: cùng câu hỏi (bàn giao vai GVCN).
7. **Việc bàn giao (GV cũ → GV mới)** — **panel giống bàn giao chuyển lớp** (`BanGiaoPanel`, mẫu F: trái danh sách em + trạng thái, phải phiếu của em đang chọn, ↑/↓ đi từng em, dưới 820 px danh sách trên phiếu dưới):
   - Việc của **GV cũ** trong Công việc: "Bàn giao [lớp] · [môn] cho [GV mới]", **hạn 5 ngày** kể từ khi tạo.
   - Mỗi **học viên** một **góp ý riêng cho kỹ năng được bàn giao** (bắt buộc — chủ SP: "GV cần có góp ý cho mỗi HV riêng lẻ ở kĩ năng được bàn giao").
   - **Cùng GV cũ + cùng lớp + nhiều kỹ năng** → **MỘT việc**, phiếu mỗi em có **một cột (ô) cho từng kỹ năng** (vd hai ô L, R).
   - **Nhận xét chung cả lớp**: [PTA quyết] có, tuỳ chọn (giống mẫu nhưng không bắt buộc vì mỗi em đã có góp ý).
   - Xong khi mọi em có đủ góp ý mọi kỹ năng → "Xác nhận bàn giao". Lưu khi rời ô (không mất chữ).
   - **GV mới**: một thông báo khi việc xong; đọc phiếu ở hồ sơ lớp (dải "Bàn giao" như chuyển lớp — mẫu "Đọc"). GV mới không có việc phải làm.
   - **GV cũ đã nghỉ / tài khoản khoá** [PTA quyết]: việc giao **GVCN lớp**; nếu chính GVCN là người nghỉ → **QL chi nhánh**.
   - Quá hạn → như mọi việc quá hạn (đỏ, không chặn, vẫn làm được). QL "Điền thay" được như bàn giao chuyển lớp.
8. **Đồng bộ hai loại bàn giao:** dùng chung khung panel / thành phần; chỗ nào hai bên lệch (chữ nút, đếm, cách lưu, bắt buộc) thì sửa theo bên hợp lý hơn — ghi bảng TRƯỚC → SAU trong PR.

## 2b. Quyết định sau rà (builder check)
- **Sửa theo DÒNG, lưu một lần** [PTA quyết]: đổi một ô → dòng lớp vào trạng thái nháp (ô đổi có viền nhấn, cuối dòng hiện **Lưu · Huỷ**); kiểm ba luật trên cả dòng ngay khi chọn (lỗi hiện tại ô, ví dụ "GVCN phải dạy ít nhất một môn" ở ô GVCN), **Lưu** chỉ bật khi dòng hợp lệ. Lý do: thay hẳn A (GVCN + L) bằng D phải đổi 2 ô cùng lúc — đi từng ô sẽ kẹt. Đổi một ô hợp lệ ngay thì vẫn chỉ 1 chọn + Lưu. **Một hộp hỏi bàn giao cho cả dòng** (liệt kê các cặp A → B theo môn, mỗi cặp một ô tích, mặc định có).
- **GV đã nghỉ / khoá còn giữ ô** [PTA quyết]: ô hiện "Ms. X · đã nghỉ" (vàng) — dòng chỉ Lưu được khi đổi hết các ô đó; lỗi nói rõ.
- **Bàn giao vai GVCN** [PTA quyết]: GVCN coi như một "kỹ năng" — mỗi em một ô **"GVCN"** bắt buộc (tình hình chung, phụ huynh, ý thức…). A đổi cả GVCN lẫn L ở cùng lớp → **một việc, hai cột** (L, GVCN). Pre FOU (GVCN dạy luôn): như vậy.
- **Việc đang mở của GV cũ (chủ SP 30/10: "Chuyển hết sang B"):** đổi A → B ở một môn (hoặc GVCN) của lớp → mọi Case đang mở A phụ trách ở lớp + môn đó, PA bổ trợ A đang dạy (`performer_user_id`), và việc còn dở của A ở lớp + môn đó (ghi kết quả PA, mô tả Case, xác nhận…) **chuyển sang B**, ghi lịch sử (Case history / nhật ký), thông báo cho B. Điểm / bài A đã chấm **giữ tên A** (người chấm không đổi). Áp ở cả bảng Phân công GV và hồ sơ lớp › Sửa thông tin (cùng đường lưu).
- **Hiệu lực + quyền xem của GV cũ (chủ SP 30/10):** hộp Lưu / hỏi bàn giao có chọn **hiệu lực: "Ngay hôm nay"** hoặc **"Từ tuần [W? MON] ▾"** (mã tuần; dùng `ONgay` / ô tuần sẵn có). Phân công đổi, chuyển Case / PA / việc sang B áp **từ thời điểm hiệu lực** (trước đó A vẫn dạy như cũ). Sau hiệu lực, **GV cũ vẫn xem (chỉ xem) lớp cũ** — hồ sơ lớp, học viên, điểm — **tối thiểu 1 tuần và tới khi hoàn thành bàn giao** [PTA hiểu: lâu hơn của hai mốc]; hết mốc thì mất quyền xem. Áp cho **cả lớp FT lẫn lớp thường**.
- **Bỏ người (A → Chưa có) / kết thúc gián tiếp** (xoá tài khoản, đổi chương trình, tạo lớp) [PTA quyết]: **không** tạo việc bàn giao (không có người nhận). Người được gán sau đó không tự có bàn giao.
- **Đồng bộ hai loại bàn giao** [PTA quyết]: dùng chung khung panel + thành phần + cách lưu (lưu khi rời ô) + chữ nút; **không đổi luật bắt buộc** của bàn giao chuyển lớp (nhận xét chung ≥ 15 ký tự mỗi em của GVCN giữ nguyên).

- **Sau mockup v9 (PTA quyết 30/10):** "Lưu cả n lớp" — một hộp cho nhiều dòng nháp (ca GV nghỉ nhiều lớp); số tổng hợp hiện "cũ → mới" khi có nháp; hạn bàn giao **5 ngày từ khi tạo việc** (lời chủ SP); có lọc "Thiếu GV · n ô", **không** thêm Xuất Excel đợt này; GV cũ đã nghỉ → việc chuyển GVCN, ô tích vẫn mặc định có; góp ý bắt buộc = không để trống (không độ dài tối thiểu); 1440: tổng hợp xuống dưới bảng lớp (bảng lớp cần ~1 300 px).

## 3. Không làm (non-goals)
- Cột "Số buổi" của sheet — web chưa có dữ liệu này; không thêm.
- Không đổi luật phân công (ba luật giữ), không phân công khác chi nhánh.
- Không xếp lịch dạy / giờ dạy.
- Bảng không thay hồ sơ lớp › Sửa thông tin (vẫn giữ, cùng đường lưu + cùng hỏi bàn giao).

## 4. Tránh (anti-goals)
- Số tổng hợp lệch với bảng lớp hoặc với hồ sơ lớp (phải cùng nguồn).
- Đổi người làm mất phiếu bàn giao đang dở / làm việc bàn giao cũ treo khi đổi tiếp (đổi A→B rồi B→C trước khi A làm xong: [PTA quyết] việc A vẫn là A→(người hiện tại C), đổi tên người nhận; nếu đổi về lại A → huỷ việc).
- Bắt QL bấm nhiều bước: đổi một ô = 1 chọn + 1 xác nhận bàn giao.
- Lộ tên GV chi nhánh khác.

## 5. Ràng buộc
- Luật nghiệp vụ / quyền / chống mất dữ liệu (CLAUDE.md mục 1) — không khoá cứng (Hoàn tác + khôi phục), lưu không mất chữ, quyền máy chủ đúng vai.
- **Mockup HTML duyệt trước khi code** (`thiet-ke/v9/phan-cong-gv.html`, 1440 tối + 375 sáng, đủ trạng thái: bình thường · tô sáng GV · ô đang chọn ▾ · ô lỗi luật · hộp hỏi bàn giao · panel bàn giao 1 kỹ năng · 2 kỹ năng · rỗng · CX chỉ xem). Hình theo v8 / DESIGN.md (token, tầng nền, độ đậm).
- Dòng đọc Turso: bảng tải một lần theo chi nhánh, không tải lại cả bảng sau mỗi ô (dùng `invalidateGop` #704); phép kiểm trần câu SQL trong tocDo.
- Migrate: có (bảng việc bàn giao phân công / hoặc mở rộng `ban_giao_mon`) — chỉ thêm.

## 6. Để người làm quyết
- Lưu phiếu bàn giao đổi GV: bảng mới hay mở rộng `ban_giao_mon` / lệnh chuyển lớp (chọn cách ít đụng luồng chuyển lớp nhất).
- Cách gộp việc khi QL đổi nhiều ô liên tiếp (theo lớp + GV cũ, trong cùng ngày).
- Cách hiển thị bảng lớp ở 768–1023.
- Chi tiết chữ (theo DESIGN.md, ngắn).
