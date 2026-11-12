# Tình hình học tập / Ý thức — đặc tả (session MOCKUP-TINH-HINH, 12/11)

Đề bài: `de-bai.md` mục 5–6 (lời chủ SP nguyên văn). Mockup: `thiet-ke/v20/tinh-hinh.html` · ghi chú (TRƯỚC → SAU, [XM], Turso): `thiet-ke/v20/tinh-hinh-ghi-chu.md`.
Trạng thái: **ĐẶC TẢ + MOCKUP, chờ chủ SP duyệt** — chưa sửa mã. Nền: Ý thức V3 (`thiet-ke/v19/y-thuc.html`, #1487 #1488), Phối hợp SOS V2 (#1384 #1388), Báo PH TVV (SV-YT-TVV).

Phân biệt: **[đã kiểm]** = mã main 12/11 đã đọc · **[chốt]** = chủ SP đã nói · **[đề xuất]** = PTA / session này đề xuất · **[XM]** = cần chủ SP chốt.

## 0. Hiện trạng đã kiểm (mã main 12/11)

| Chỗ | Hiện trạng | Tệp |
|---|---|---|
| Xác nhận xử lý | luôn bậc kế (máy chủ tính), `done` ngay, **sinh việc TVV ngay** (`sinhViecBaoPh`) | `server/src/yThuc/xuLy.ts` `luuXuLy` |
| Đề xuất QL duyệt | nút chữ "Đề xuất QL duyệt" chuyển panel sang chế độ khác: nháp `nhap` → `guiDeXuat` → `cho_duyet` + thẻ `y_thuc` + **việc TVV sinh ngay** (N1) | `xuLy.ts` `deXuat` / `guiDeXuat`, `XacNhanXuLyPanel.tsx` |
| Loại đề xuất được | ngoài thang (WL 3, Meeting CX/GĐCN, Đình chỉ, Khác — cần tệp) · "không tăng bậc" (bậc thang ≤ bậc hiện tại — tệp tuỳ chọn). **Không có vượt bậc.** | `xuLy.ts:540-583` |
| QL duyệt | thẻ `y_thuc` hạn `hanDuyetNgay` (Hạn mặc định "QL trả lời", đang 5); duyệt → `da_duyet` → GVCN "Đánh dấu đã thực hiện" (`yt_thuc_hien`) → `done`; từ chối → vi phạm về Cần xử lý; **hết hạn: không tự chốt** (chỉ chuông quá hạn) | `server/src/duyet/loaiYeuCau.ts:511-575`, `duyet/yeuCau.ts:249` |
| Tự chốt khi hết hạn (mẫu có sẵn) | `quetGiuPaGv` trong `quetYeuCau` (chạy khi đọc hộp duyệt / việc + quét đêm `dongHocVien`) → `chotYeuCau(..., 'tu_dong')` | `server/src/cases/sosAuto.ts:268` |
| Luật 3 vi phạm / 2 tuần | `batBuocTu` đếm mọi vi phạm chưa xử lý | `shared/domain/yThuc.ts:230` |
| Việc TVV | bảng `viec_bao_ph` đa nguồn: `measure_id` (sau xử lý) · `bao_lai_cua` (thu hồi) · `phoi_hop_id` (Meeting CX); mỗi lần ghi một dòng `viec_bao_ph_lan` (Đã báo PH / Chưa liên hệ được + ngày + ghi chú); hạn `hanBaoPh` (+4), sửa hạn N34 | `server/src/yThuc/baoPhTvv.ts`, `schema.sql:2282` |
| Tab | hồ sơ lớp + hồ sơ HV: "Ý thức & Phối hợp", phân đoạn **Vi phạm \| Phối hợp SOS** (`?sub=phoi-hop`) | `shared/domain/hocVienLop.ts:747`, `duongHoSo.ts:282` |

## 1. Bốn việc a–e (trả lời 6 câu của CLAUDE.md)

### a. GV báo "Tình hình học tập" cho TVV → TVV báo PH [chốt: không phân loại, nội dung tự do; dùng lại việc Báo PH TVV]

| Câu | Trả lời |
|---|---|
| Phát sinh từ đâu | GV thấy em có chuyện học tập cần PH biết (sa sút, nghỉ nhiều, tiến bộ…) — không gắn vi phạm, không gắn SOS |
| Ai làm / chốt / cần biết | **Gửi:** mọi GV đang dạy em (GVCN, GVBM) + QL. **Làm:** TVV của em (không có → QL chi nhánh, như `nguoiGiuBaoPh`); TVV cùng chi nhánh làm thay được (như Báo PH). **Cần biết:** GV gửi (chuông khi TVV ghi kết quả) + GVCN (thấy ở tab) |
| Thông tin cần | Em (một hoặc nhiều — từ hồ sơ lớp chọn nhiều như Ghi vi phạm, cùng một nội dung) · **Nội dung *** (≥ 10, ≤ 500 ký tự, có bộ đếm — N35) · tệp / liên kết tuỳ chọn. Không loại, không mức, không hạn chọn |
| Đầu ra · xong | TVV ghi **"Đã báo PH" + ngày + nội dung** (PH nói gì). "Chưa liên hệ được" = một lần thử, việc vẫn mở (như Báo PH) |
| Bước bắt buộc / gộp | Một hộp nhỏ, một nút "Gửi TVV". Không bước duyệt. Hạn việc TVV: **5 ngày, hàm `hanBaoPh` chung** [đề xuất, XM-2]; sửa hạn theo N34 |
| Sửa / huỷ / khôi phục | Sau Gửi: toast **Hoàn tác 10 s** (xoá thật). Chưa có kết quả: người gửi **Sửa nội dung** / **Rút** (việc TVV "Đã bỏ · GV rút", giữ dòng). Đã có kết quả: không rút; TVV sửa kết quả như Báo PH (thêm lần ghi, lịch sử giữ). Bỏ việc (TVV) dùng lý do bỏ sẵn có. Mọi thay đổi vào nhật ký (`writeAudit`) |

### b. Ghi vi phạm có lựa chọn "Chỉ nhắc nhở" [chốt]

| Câu | Trả lời |
|---|---|
| Phát sinh | GV thấy lỗi nhẹ, muốn để lại dấu vết + để GVCN biết, nhưng **không muốn tính** vào luật 3 vi phạm / 2 tuần |
| Ai | Ai ghi vi phạm được thì chọn được (như nay). GVCN **chỉ xem** — không việc, không hạn. TVV: không sinh việc |
| Thông tin | Như Ghi vi phạm (ngày, môn, nhóm, tên, mô tả, tệp) + **một lựa chọn ở đầu panel: "Vi phạm · Chỉ nhắc nhở"** (mặc định Vi phạm; áp cho mọi dòng của lần lưu) |
| Đầu ra | Dòng "Nhắc nhở" trong khối em + lịch sử; không lên bậc, không vào `batBuocTu`, không thành "Mới / Cần xử lý / Quá hạn", không vào việc GVCN, không vào số vi phạm ở Phân tích / Excel (đếm riêng "nhắc nhở" nếu chủ SP cần — XM-4) |
| Bước | Không thêm bước: một lựa chọn trong panel có sẵn |
| Sửa / huỷ | **Sửa vi phạm** đổi được Nhắc nhở ↔ Vi phạm (người ghi, GVCN, QL — như quyền Sửa hiện tại); đổi sang Vi phạm thì tính luật như vi phạm ghi ngày gốc (`reportedOn` không đổi → `batBuocTu` tự tính lại). Xoá như vi phạm (Thùng rác N28). Nhật ký ghi lần đổi |

### c. Xác nhận xử lý chọn bậc tại chỗ [chốt]

| Câu | Trả lời |
|---|---|
| Phát sinh | Vi phạm Mới / Bắt buộc của em (việc `yt_xu_ly`, `yt_xem` của GVCN) |
| Ai | **GVCN quyết** (QL làm thẳng được). **QL chốt** khi khác mặc định. **TVV** nhận việc báo PH **sau khi chốt** |
| Thông tin | Vi phạm đưa vào (tick sẵn như `macDinhTick`) · **Cách xử lý (4 lựa chọn, ngay trong panel):** ① **Nâng 1 bậc** → {bậc kế} (mặc định) · ② **Không nâng** (giữ {bậc hiện tại}; chọn bậc ≤ hiện tại — mặc định đúng bậc hiện tại) · ③ **Vượt bậc** (chọn một bậc thang > bậc kế) · ④ **Ngoài thang** (WL 3 · Meeting CX/GĐCN · Đình chỉ học tạm thời · Khác + tên). Mặc định: Ngày * · Người thực hiện · Mô tả *. Khác mặc định: **Lý do *** (≥ 10) · Bằng chứng (bắt buộc với Ngoài thang, tuỳ chọn với ② ③ — như luật 5 hiện nay) |
| Đầu ra · xong | ① lưu `done` → **TVV nhận việc ngay** (như nay). ②③④ lưu `cho_duyet` + thẻ `y_thuc`, **chưa sinh việc TVV**; câu ghi rõ ngay dưới lựa chọn: "Sẽ gửi QL duyệt · QL có 5 ngày (tới {ngày}); hết hạn giữ quyết định của bạn". **Chốt** = QL Duyệt **hoặc** hết hạn tự chốt → `da_duyet` + **sinh việc TVV lúc chốt** + việc GVCN "Đánh dấu đã thực hiện" (giữ như nay) → `done`. QL Từ chối → vi phạm về Cần xử lý (như nay), không việc TVV |
| Bước | **Bỏ nút "Đề xuất QL duyệt"** (không còn chế độ thứ hai): một panel, một form, nút chính đổi chữ theo lựa chọn — "Xác nhận · Report 2" / "Gửi QL duyệt". Nháp `nhap` vẫn dùng nội bộ để giữ tệp (không hiện) |
| Hết hạn | Quét `quetYThucHetHan` (mẫu `quetGiuPaGv`) trong `quetYeuCau`: thẻ `y_thuc` `cho` có `han_duyet < hôm nay` → áp `khiDuyet` (quyet_luc = hôm nay) + `chotYeuCau(..., 'tu_dong', 'Quá 5 ngày QL chưa duyệt — giữ quyết định GVCN')` + chuông GVCN + TVV (việc mới). Chạy **khi đọc** (Hộp duyệt, Công việc, tab Ý thức — đã gọi `quetYeuCau`) **và** quét đêm (`dongHocVien`) → không cần ai mở trang |
| Sửa / huỷ | Chờ duyệt: GVCN **Sửa lý do / bằng chứng**, **Rút** (như nay — `rutDeXuatYThuc`). ① sau lưu: Hoàn tác 10 s (như nay `hoanTacXuLy`), sau đó Thu hồi (N5). QL Duyệt / Từ chối: Hoàn tác + đảo (`dao` có sẵn). Đã tự chốt: QL muốn đổi → **Thu hồi** (N5) — không đảo thẻ tự chốt. Lịch sử: thẻ ghi "Tự chốt · {ngày}" |

**Đổi luật N1** [chốt chủ SP 12/11]: "kể cả lần xử lý đang chờ QL duyệt" → **lần chờ QL duyệt KHÔNG sinh việc TVV; sinh lúc chốt**. Ghi vào `plan.md` 1.6 N1 khi duyệt. Thẻ đang chờ lúc deploy: việc TVV đã sinh trước đó **giữ** (không xoá việc người ta có thể đã làm); chỉ thẻ gửi sau deploy theo luật mới.

**Thu hồi (`thu_hoi_y_thuc`)**: không đổi (ngoài phạm vi; hết hạn không tự chốt) — XM-5 nếu chủ SP muốn cùng luật 5 ngày.

### d. Tab "Ý thức & Phối hợp" giữ một tab, 2 tab nhỏ [chốt]

| Câu | Trả lời |
|---|---|
| Phát sinh | GVCN / QL / TVV / GVBM rà lớp hoặc một em; mở từ việc / chuông (`?hv=&mo=`, `?sub=`) |
| Ai | Mọi vai xem được lớp / em (quyền như nay) |
| Thông tin | **Tab nhỏ 1 "Tình hình học tập / Ý thức"**: mỗi em một khối (bố cục v19 giữ) gồm mọi việc giữa GV ↔ TVV của em: vi phạm (lần xử lý), **nhắc nhở**, **tình hình GV → TVV** (nội dung + kết quả báo PH), **TVV hỏi → GVCN** (câu hỏi + kết quả). Cột: **Học viên · Vấn đề · Đã xử lý · Bước đang làm** (đổi "Vi phạm" → "Vấn đề" vì cột nay chứa cả tình hình). Xem kỹ cả quá trình: "Xem lịch sử · n" (lớp) / dòng thời gian đầy đủ (hồ sơ HV). **Tab nhỏ 2 "Phối hợp SOS"**: giữ nguyên V2 |
| Đầu ra | Em còn bước (của bất kỳ ai) lên đầu; em sạch một dòng; lịch sử đọc tại chỗ |
| Bước | Không thêm. Nút đầu tab theo vai: GV/QL **+ Ghi vi phạm** (chính) · **Báo tình hình**; TVV **Hỏi tình hình** (+ Ghi vi phạm nếu có quyền như nay) |
| Tên tab lớn | **Giữ "Ý thức & Phối hợp"** [đề xuất, XM-1]: người dùng đã quen; "Phối hợp" đã bao tình hình học tập (GV ↔ TVV ↔ PH). Phương án khác: "Tình hình & Phối hợp" |
| Sửa / khôi phục | Từng dòng mở tại chỗ (Sửa / Rút / Hoàn tác như a, b, c, e). `?sub=phoi-hop` giữ; `?sub=` cũ "vi-pham" → tab nhỏ 1 |

### e. TVV "Hỏi tình hình học tập" → GVCN (hạn 3 ngày) [chốt]

| Câu | Trả lời |
|---|---|
| Phát sinh | PH hỏi TVV / TVV cần thông tin để tư vấn |
| Ai | **Hỏi:** TVV của em, TVV cùng chi nhánh, QL. **Trả lời:** GVCN lớp em đang học (QL làm thẳng); em không có GVCN → QL chi nhánh. **Cần biết:** TVV hỏi (chuông khi có kết quả) |
| Thông tin | Câu hỏi * (≥ 10, ≤ 500, bộ đếm) — vd "PH hỏi em có theo kịp Writing không". GVCN trả lời: **Kết quả *** (≥ 10, ≤ 500) — GVCN hỏi GVBM ngoài web rồi ghi |
| Đầu ra · xong | GVCN ghi kết quả → việc xong; TVV đọc ở tab em + chuông; TVV tự báo PH, **web không theo dõi tiếp** (không sinh việc Báo PH) |
| Hạn | **3 ngày tính cả ngày hỏi** (hỏi T2 → hết T4 23:59 VN, như cách tính `hanBaoPh` −2). Việc nằm ở Công việc GVCN › Ý thức & Phối hợp, mục "Tình hình học tập" (mục mới trong `MUC_CV`, loại `hoi_tinh_hinh`); quá hạn đỏ, không chặn |
| Bước | TVV: một hộp nhỏ, nút "Gửi GVCN". GVCN: form tại dòng trong panel việc (như Phối hợp) — một ô + Lưu |
| Sửa / huỷ | TVV: Hoàn tác 10 s; chưa có kết quả → Sửa câu hỏi / **Rút**. Mỗi em tối đa **một câu hỏi đang chờ** của cùng người hỏi (hỏi thêm → mở câu đang chờ để sửa). GVCN: sau Lưu Hoàn tác 10 s, sau đó **Sửa kết quả** (nhật ký giữ bản cũ) |

## 2. Dữ liệu + migrate (dùng lại trước)

| Việc | Cách | Migrate |
|---|---|---|
| b. Nhắc nhở | cột `violations.chi_nhac INTEGER NOT NULL DEFAULT 0`; `ViPhamVao.chiNhac`; `batBuocTu` + `trangThaiViPham` + `trangThaiYThuc` bỏ qua `chi_nhac = 1` (trạng thái riêng `nhac_nho`, không hạn); `viPhamChon` từ chối nhắc nhở (đổi sang Vi phạm trước) | `ALTER TABLE violations ADD COLUMN chi_nhac …` (mặc định 0 → dữ liệu cũ không đổi) |
| a + e. Tình hình | **một bảng mới** `tinh_hinh_hoc_tap` (id, student_id, class_id, cycle_id, `chieu` 'gv_tvv' \| 'tvv_gvcn', noi_dung, nguoi_gui, tao_luc, sua_luc, `han` (chỉ tvv_gvcn), `tra_loi`, tra_loi_boi, tra_loi_luc, `trang_thai` 'mo' \| 'xong' \| 'rut', rut_boi, rut_luc) + chỉ mục `(student_id, trang_thai)` và `(chieu, trang_thai)`. Không bảng nào sẵn có chứa câu hỏi GVCN có hạn (`yeu_cau_duyet` là thẻ QL quyết, sai vai) | tạo bảng + 2 chỉ mục |
| a. Việc TVV | **dùng lại `viec_bao_ph`**: thêm cột `tinh_hinh_id INTEGER` (UNIQUE khi NOT NULL, như `phoi_hop_id`); nhãn "Tình hình học tập"; ghi kết quả / sửa hạn / bỏ việc / chuông = đường Báo PH có sẵn | `ALTER TABLE viec_bao_ph ADD COLUMN tinh_hinh_id` + chỉ mục |
| c. Chọn bậc | `discipline_measures` có sẵn (kind bất kỳ trong `MEASURE_KINDS`); bỏ ràng `khongTangBac` để nhận cả **vượt bậc** (kind thang > bậc kế); `du_lieu` thẻ thêm `cach: 'khong_nang' \| 'vuot' \| 'ngoai'`; `sinhViecBaoPh` chuyển từ `guiDeXuat` sang `khiDuyet` + quét tự chốt | không đổi bảng |
| c. Tự chốt | `quetYThucHetHan(conn, homNay)` trong `quetYeuCau`; `chotYeuCau 'tu_dong'` có sẵn | không |
| Bỏ "Đề xuất QL duyệt" | web: `XacNhanXuLyPanel` một form; máy chủ giữ `deXuat` + `guiDeXuat` (panel gọi thẳng khi lựa chọn ≠ mặc định) | không |

Phép kiểm cần thêm (session code): `batBuocTu` bỏ nhắc nhở (3 nhắc nhở / 2 tuần không bắt buộc) · ②③④ không sinh `viec_bao_ph` lúc gửi, sinh khi duyệt + khi quét hết hạn · quét chạy hai lần không sinh hai việc (UNIQUE measure_id) · câu hỏi TVV hạn = hỏi + 2 · Rút sau khi có kết quả → 400 · quyền máy chủ (GVBM không trả lời câu hỏi; TVV không gửi "tình hình" chiều GV) · trần `tocDoDuong.ts` các đường mới.

## 3. Đường API (đề xuất, session code chốt tên)

`POST /students/:id/tinh-hinh` (a: GV/QL; e: TVV/QL — `chieu` theo vai, máy chủ kiểm) · `PATCH /tinh-hinh/:id` (sửa / rút / trả lời) · `GET` không thêm đường mới: tab lớp + hồ sơ HV đọc kèm trong `GET /classes/:id/y-thuc` và `GET /students/:id/y-thuc`; Công việc đọc trong `/my-work`.

## 4. Đọc Turso (ước, đo lại sau code)

| Màn / thao tác | Thêm | Ước |
|---|---|---|
| Tab lớp `/classes/:id/y-thuc` | +1 câu `tinh_hinh_hoc_tap WHERE student_id IN (em lớp)` (chỉ mục) · việc TVV của tình hình đã nằm trong câu `viec_bao_ph` có sẵn (thêm LEFT JOIN, +0 câu) · nhắc nhở: cột mới trong câu vi phạm có sẵn (+0) | +1 câu, +0…40 dòng (lớp 30 em, vài tình hình / em / lộ trình) — trần 24 → 25 câu |
| Hồ sơ HV `/students/:id/y-thuc` | +1 câu (một em) | +1 câu, +0…15 dòng |
| `/my-work` GVCN | +1 câu câu hỏi đang mở của lớp mình (`chieu='tvv_gvcn' AND trang_thai='mo'`, chỉ mục) | +1 câu, thường 0–3 dòng |
| `/my-work` TVV | việc tình hình nằm trong câu `viec_bao_ph` có sẵn | +0 câu |
| Quét tự chốt | +1 câu trên `yeu_cau_duyet` (`loai, trang_thai, han_duyet` — đi chỉ mục loại/trạng thái có sẵn) mỗi lần `quetYeuCau` | +1 câu, thường 0 dòng |
| Panel Xác nhận xử lý | không thêm (bậc kế, thang đã có trong `emCua`) | 0 |

Tổng ước **< 0,05 triệu dòng / ngày** (dưới ngưỡng cảnh báo CLAUDE.md). Không đường nào vượt ~30 câu / ~2 000 dòng.

## 5. Brief giao diện (impeccable `shape`, giả định ghi rõ — không có người trả lời trực tiếp)

- **Ai, khi nào:** GVCN trên máy trung tâm (chính), TVV trên máy / điện thoại khi PH gọi, QL rà Hộp duyệt. Chế độ **Operate**.
- **Việc chính:** thấy ngay em nào có việc GV ↔ TVV đang chờ và làm bước của mình tại chỗ; đọc được cả quá trình một em.
- **Hướng:** giữ thế giới hình ảnh v19 (token, khối em, viên trạng thái). Điểm nhấn duy nhất = **chọn cách xử lý** trong Xác nhận xử lý: 4 ô chọn lớn ngang, ô mặc định có nhãn "Mặc định", chọn khác thì một dải vàng ngay dưới nói hậu quả (QL 5 ngày, hết hạn giữ quyết định) — thay cho chế độ thứ hai bị chê "rối".
- **Phân loại dòng trong khối em:** một nhãn nhỏ đầu dòng (Vi phạm · Nhắc nhở · Tình hình · TVV hỏi) bằng chữ + nền nhạt, không chỉ bằng màu.
- **Không làm:** không thêm bước, không modal cho việc ngắn (hộp nhỏ neo nút), không số ①②③, không chú thích tĩnh (ⓘ khi cần).
