# OV-13 — Sửa lỗi sau deploy 15/10 + tính năng chủ SP 15/10 + Hướng dẫn trên web

Nguồn: tin chủ SP 15/10 sáng (10 mục + "ghi kết quả mãn kiếp" + hướng dẫn trên web), ba lượt rà của planning trên main d2460e09
(#399): (1) điều tra Case / MT, (2) phạm vi tính năng 4–8, (3) rà toàn bộ panel OV-12 c–f + EN + TD4 theo 8 vai, VI + EN, 1440 + 375.
Ký hiệu: **[chốt]** = chủ SP đã trả lời · **[chờ]** = planning khuyến nghị, chờ chủ SP · **[lỗi]** = lỗi mã, sửa không đổi luật.

## 0. Chủ SP chốt 15/10 (thắng mọi chỗ ghi [chờ] bên dưới)
- Q1 Case MT bỏ ô Mô tả · Q2 Case tạm khi lượt chưa chốt (+ xoá Case `cho_chot_sos` cũ) · Q3 Xác nhận PA giữ GVBM đúng kỹ năng, QL làm thay ·
  Q4 gom theo tuần + lớp + mức SOS 1/2/3, Xác nhận PA cùng lúc tick sẵn · Q6 tự chọn vai GV/QL/TVV/CX/Admin, chi nhánh bắt buộc trừ CX ·
  Q7 Speaking chấm chéo có số, không đỏ · Hướng dẫn trên web phần 2 ok.
- **Q5:** xử lý vi phạm ở mức lớp, mô tả chung sửa riêng được; chip bậc 0 tên **"Chưa có xử lý vi phạm"**.
- **Q8 (đổi khuyến nghị):** Excel **bỏ hẳn cột Mã**. Email học viên **BẮT BUỘC** và **không trùng** giữa các học viên (planning hiểu "các câu còn lại
  ok" gồm cả câu không trùng); thêm HV để trống email vẫn được, nhưng em thiếu email là việc phải làm ("Thiếu email" — Cần làm / Thiếu thông
  tin) tới khi điền; sửa / thêm email sau. Email trùng → máy chủ chặn kèm tên em đang dùng. Cần migrate? chỉ ràng buộc ở mã (không UNIQUE DB
  vì dữ liệu cũ có thể trùng) + lệnh chỉ đọc đếm em trống / trùng email trên bản chính trước khi làm.

- **Mockup `thiet-ke/mockup-ov13-2026-10-15.html` DUYỆT 15/10** (bản 3, PR #403): panel màu rõ hơn; 5 việc / vai; nút chưa tới kỳ "Cập nhật trước hạn";
  người dạy chung không đè giá trị riêng; ô Email * + "Thiếu" cam; PA Tutor (mục 7); **Đề xuất PA khác…** (một tên) cho PA mặc định — lúc Xác nhận
  PA (mục 9: luôn mở panel, Nội dung / hướng dẫn *, Người dạy *, Bắt đầu *) và khi PA đang chạy (mục 8); gửi đề xuất → PA gốc CHỜ (chưa chạy) / đang
  chạy thì vẫn chạy, Case "Chờ duyệt đổi PA", QL duyệt → PA mới chạy từ ngày duyệt, từ chối → việc cũ quay lại kèm lý do; ghi kết quả kỳ + đề xuất một nút.
- **Gỡ chặn cứng (chủ SP 15/10, OV-13h + HOTFIX-2):** GV đúng kỹ năng sửa nhận xét / nhóm MT mọi lúc; sau hoàn tất GV nhập ô TRỐNG (sửa / xoá điểm
  đã có vẫn qua QL); gỡ "-" mọi lúc; ai hoàn thành Case được thì mở lại được; sửa bàn giao sau ngày chuyển lớp (đổi 13/10); báo cáo tuần nộp muộn có nhãn;
  Góp ý tuần lớp đã kết thúc; thi thật em Lưu trữ; đề xuất sửa em Tạm dừng. Giữ: cấp bậc Ý thức đã xử lý, em Lưu trữ, PA đã kết thúc / QL đã trả lời.

- **Bước tiếp sau thi + Chuyển lớp ngay (mockup `thiet-ke/mockup-ov13-buoc-tiep-2026-10-15.html` DUYỆT 15/10, PR #414):** có kết quả thi thật →
  lộ trình "Đã xong" + khối Bước tiếp (Lộ trình mới [Lớp này / Lớp khác · Bắt đầu "Ngay bây giờ" hoặc chọn tuần → "Hẹn bắt đầu", Huỷ hẹn] · Tạm dừng ·
  Thôi học), QL + TVV chọn, GVCN chỉ đọc; lộ trình mới bắt đầu ngay thì tuần này là tuần 1 (CHỈ lộ trình mới sau thi — chuyển lớp thường giữ cách tính
  tuần); lộ trình mới ở lớp khác có phiếu bàn giao như Chuyển lớp; giữ Target cũ ("Target 6.5 · giữ · Sửa"). Chuyển lớp: ô tuần thêm "Ngay hôm nay"
  (chuyển ngay, không hoàn tác); hạn bàn giao mọi lệnh = muộn hơn của (ra lệnh + 7 ngày) và mốc cũ.
  **Điểm khi chuyển (chủ SP 15/10):** chuyển lớp khi lộ trình CHƯA kết thúc → điểm / lượt Test của lộ trình đang chạy ĐI THEO em sang lớp mới (lộ trình
  tiếp tục); lộ trình đã kết thúc hẳn rồi sang lớp mới → lộ trình mới, điểm cũ ở lại lộ trình cũ. (Kiểm mã chuyển lớp hiện đóng-mở lộ trình thế nào
  trước khi giao prompt.)

## 1. Lỗi đã tìm gốc

| # | Chủ SP báo | Gốc (đã tái hiện trừ khi ghi khác) | Sửa | PR |
|---|---|---|---|---|
| L1 | GV ghi nhận xét bài đợt đã hoàn tất → bị chặn (29 việc "Ghi nhận xét" sau migrate `prOv12c` không làm được) | `routes/index.ts` ~857 gửi đủ khoá `undefined`, `attempts.ts` ~1879 xét `Object.keys` → coi như sửa điểm → 403 | chỉ xét khoá có giá trị + phép kiểm qua HTTP | **HF** [lỗi] |
| L2 | Mục 2: nhận xét + 4 nhóm ở hồ sơ MT mà Case "trống trơn" | Dữ liệu đúng (`issues[0].observation`, đủ nhóm); `CasePanel.tsx` ~193 chỉ hiện `summary` (Case MT NULL); Sửa Case (`ThaoTacCase.tsx` ~342/430, máy chủ `sosAuto.ts` ~198) bắt Mô tả ≥ 15 ký tự, chỉ hiện nhóm chính | panel dùng `DongNguyenNhan`; Sửa Case MT không đòi Mô tả, hiện đủ nhóm + nhận xét chỉ đọc | **HF** |
| L3 | Mục 3: Case đã huỷ không mờ | `SkillBoard.tsx` `HangCase` không có lớp mờ (PanelMotEm có) | opacity + xếp sau | **HF** |
| L4 | Mục 1: mở hộp nhập điểm từ Tổng quan → Lịch Test → Test chấm tuần này: hộp hiện rồi màn tối | CHƯA tái hiện trên seed. Web không có ErrorBoundary → lỗi render bất kỳ = màn tối | ErrorBoundary + ghi mã lỗi; bắt lại khi có log | **HF** |
| L5 | (rà) Đóng panel bằng ✕ / Esc / nền / đổi dòng → mất chữ đang gõ, không hỏi | `KhungPanel.tsx` ~84/117/167/175 chỉ `veLai` kiểm `daSua` | một hàm đóng chung kiểm `daSua` | **HF** |
| L6 | Mục 9: hai Case MT3 Reading, một "Đã huỷ · Hệ thống đóng · Chờ chốt SOS" | Case cũ (tạo từ điểm đầu tiên) bị `prOv1c` ĐÓNG chứ không xoá; lượt chốt → `upsertCategoryCase` tạo Case mới. `migratePrOv1c` chạy ở MỌI lần migrate → có thể sinh trùng ở deploy sau | migrate một lần: xoá hẳn Case `cho_chot_sos` (định nghĩa "chưa ai đụng"); `prOv1c` chỉ chạy một lần | **13a** |
| L7 | Mục 9: Case bị "khoá cứng" khi lượt chưa đủ điểm | Luật OV-1c: chỉ sinh Case khi lượt chốt → trước đó không có Case để mở / sửa | luật mới §2 Q2 | **13a** [chờ] |
| L8 | "Ghi kết quả mãn kiếp", không kết thúc được | Luật `sosV4.ts:8`: PA quy chế không kết thúc sớm; SOS 3 = Tutor "đến lúc thi"; chưa có ngày thi → mốc không bao giờ tới; Case khoá tới khi PA quy chế hết; Overall đạt mà đã có PA → chỉ ghi mốc | luật mới §2 (A+B+C) [chốt] | **13a** |
| L9 | Mục 10: chữ "chưa xác nhận nguyên nhân" còn sót | `PanelMotEm.tsx` ~116/144, `BangSos.tsx` ~91, `NganCase.tsx` ~239 (câu "Hoàn tác Kết thúc học" sai lý do) | "Chờ ghi nhận xét"; câu theo lý do đóng | **HF** |

Lỗi khác từ rà panel (Nặng → **13b**, Nhẹ → PR chạm vùng đó):
- Sau khi lưu (Ghi kết quả / Thêm PA / Xác nhận PA) panel nhảy sang Case đầy đủ; không có "✓ Đã lưu · Việc tiếp ›" (mockup v3 §1); toast đè nút chân.
- Tổng quan GV: "Xác nhận Case" chuyển hẳn sang hồ sơ HV (`ViecCuaToi.tsx` ~69/111) — phải mở `PanelViec` tại chỗ.
- Công việc: Ghi nhận vi phạm, Báo phụ huynh qua TVV, Thiếu thông tin, Chọn người phụ trách vẫn chuyển trang (`PanelViec.tsx` `lamTaiCho` thiếu `yt_xem`, `phoi_hop`, `missing_data`, `no_owner`).
- Panel số liệu: "Xem hồ sơ ↗" rồi "‹ Tổng quan" mất panel + dòng (chưa lên URL).
- Học viên & Lớp: badge "13 HV quá hạn việc" bấm ra 1; chip Quá hạn đếm em, nhóm đếm việc → một hàm đếm, ghi rõ "n việc" / "n em".
- EN: Đang SOS + panel một em còn chữ Việt (`BangSos.tsx`, `PanelMotEm.tsx`, chữ dựng ở `hocVienSos.ts`); chip hạn "Due T3 22/09" (`Nhan.tsx` `THU`); `mocChu` chưa `dich`.
- Một việc ba tên ("Kết quả PA" / "Kết quả" / "Ghi kết quả W4 AUG – W1 SEP"), Meeting CX ba tên; tiêu đề Công việc lặp tên em; mô tả PA Bổ trợ lặp mốc; Thêm PA chưa theo mockup §6 (chip loại PA, "Cần QL giúp gì *").
- Hộp duyệt "Chờ duyệt 10" vs "Case chờ duyệt 19" vs Tổng hợp "12" — đặt tên khác nhau / ghi phạm vi.

## 2. Luật mới

**[chốt 15/10] Ghi kết quả PA không kẹt mãi (A + B + C):**
- A. Kỹ năng của Case đạt kỳ vọng ở lượt MT sau → PA quy chế tự sang "Ghi kết quả cuối"; ghi xong → Case Hoàn thành được.
- B. "Đến lúc thi" mà chưa có ngày thi → mốc = MT cuối của lộ trình.
- C. GVCN / QL có "Kết thúc PA" sớm cho PA quy chế, lý do bắt buộc ≥ 10 ký tự (nhật ký PA ghi lý do).

**[chốt 15/10] Ghi kết quả gọn:** ghi nhanh ngay trên dòng (5 chip "Tiến triển (2 tuần)" + "Nhận xét" + Lưu, Quyết định mặc định Giữ nguyên) ở
Công việc, ngăn Case, panel một em; panel lớn chỉ khi Điều chỉnh / Kết thúc / Tutor n buổi. Case: PA đang chạy một dòng ("Đang chạy · kết quả
gần nhất … · hạn kế …"), lịch sử + nhật ký gập; nút chính chỉ nổi khi tới kỳ. PA chưa có người dạy: "Chưa chọn người dạy · Chọn" trên dòng.
Cần mockup.

**[chờ] Q1 — Case MT bỏ ô Mô tả:** khuyến nghị bỏ (P6 đã chốt Mô tả = nhận xét); Sửa Case MT chỉ còn Mức độ + Tên. (HF đã bỏ bắt buộc.)

**[chờ] Q2 — Case tạm khi lượt chưa chốt (thay luật OV-1c):** ô dưới kỳ vọng đã có điểm + nhận xét → sinh ngay Case "tạm": hiện + sửa được, chip
"chờ chốt SOS", chưa có hạn / PA / chuông. Lượt chốt: Overall đạt + chưa có PA được xác nhận → xoá hẳn (`xoaSosOverallDat`); ngược lại → "Chờ
xác nhận PA" như nay. Kèm migrate một lần xoá hẳn Case `cho_chot_sos` cũ.

**[chờ] Q3 — Ai Xác nhận PA (MT):** mockup v3 §3 ghi QL; mã theo Rulebook #4: GVBM đúng kỹ năng (QL làm thay được). Khuyến nghị giữ mã.

## 3. Tính năng chủ SP 15/10

| # | Việc | Khuyến nghị | Migrate | Mockup | Cỡ | Câu hỏi [chờ] |
|---|---|---|---|---|---|---|
| 4 | Gom Công việc | Case SOS FT gộp theo **nhóm việc + lớp + tuần thi + mức SOS**; trong dòng "Xác nhận PA cùng lúc" (tick sẵn, ngày bắt đầu + người dạy dùng chung, sửa riêng được; máy chủ theo lô, PA lỗi báo riêng, gọi lại `xacNhanPaQuyChe`); Nhập điểm gom theo **tuần thi** thay vì lượt. Thêm PA, Ghi kết quả vẫn từng em | không | **cần** | L | Q4a "trạng thái SOS" = mức SOS 1/2/3 (khuyến nghị có) · Q4b tick sẵn hết (có) |
| 5 | Cấp bậc vi phạm nhiều em | Tab Ý thức hồ sơ lớp + dòng gộp Công việc: Chọn nhiều → Xác nhận xử lý chung (mỗi em tự lấy bậc kế, hiện "An → Report 2 · Bình → WL 1", em cần QL bị loại kèm lý do) · Ghi nhận mọi vi phạm Mới · Xác nhận cấp bậc bảng em × chip bậc, thêm "Chưa từng" (bậc 0) | không | **cần** | M–L | Q5a "ngoài hồ sơ" = ở mức lớp, không vào từng em (có) · Q5b mô tả chung, sửa riêng được (có) |
| 6 | Đăng ký + chọn vai | Tab "Đăng ký"; chip vai GV · QL · TVV · CX · Admin (không Quản trị); chi nhánh bắt buộc trừ CX; kỹ năng chỉ khi GV; máy chủ lưu `requested_role` (danh sách trắng, 400 với system_admin); hộp duyệt điền sẵn, QT đổi được | **có** (`users.requested_role`, chỉ thêm cột) | không | S | Q6 danh sách vai như trên (có) |
| 7 | Speaking cần chấm | GV có lớp FT cùng chi nhánh để chấm chéo thấy ở Công việc › Chấm điểm "Speaking chấm chéo": bài tuần trước + mọi bài còn tồn, gom tuần thi → lớp, không đỏ / quá hạn (giữ T18); mở `PanelNhapDiem` kỹ năng S ("Lưu · em tiếp ›"); nhận xét + nhóm nguyên nhân giữ (= "xác định nguyên nhân") | không | không | M | Q7 có số "bài chờ chấm", không đỏ (có) |
| 8 | Ẩn mã HV, email | Bỏ mã khỏi mọi màn (giữ DB, nhật ký, tìm kiếm); tìm kiếm + cảnh báo trùng hiện email; Excel thêm cột Email sau Tên, Mã xuống cuối. **Không** dùng email làm khoá (nhiều em trống / chung email phụ huynh) | không | không | M | Q8 email không bắt buộc, không duy nhất (giữ Q3 14/10) |

Phụ thuộc: 4 và 7 cùng `mywork.ts` / `gopViec.ts` / phép đo TD4 → một PR (4 trước); 5 dùng dòng gộp của 4; 8 làm cuối (chạm nhiều file); 6 độc lập.

## 4. Hướng dẫn sử dụng trên web (thay PR-SOTAY) — [chốt 15/10: A thay sổ tay + nút "?", nội dung trong mã, "Chỉ cho tôi", dải "Mới dùng?"]
- Trang **Hướng dẫn** (menu Tài khoản + nút "?"), 4 phần theo vai đang đăng nhập: Việc hằng tuần · Theo màn · Luật và hạn · Thuật ngữ; ô tìm;
  QL / QT bật "Xem vai khác". In được (kiểu in gọn). PR-SOTAY (6 PDF) **bỏ**.
- **Nút "?"** cạnh Thông báo → panel phải, đúng mục của màn đang đứng (không chuyển trang).
- **"Chỉ cho tôi"** mỗi bước: mở đúng trang (nếu cần), làm tối phần còn lại, khoanh nút `data-hd="…"` + một dòng chú thích; bấm ra ngoài tắt.
- **Dải "Mới dùng PISA? Xem 5 việc hằng tuần của bạn (3 phút)"** ở Tổng quan cho tài khoản chưa mở hướng dẫn; Ẩn; nhớ theo tài khoản.
- **Nội dung** = dữ liệu trong mã (`shared/huongDan/*.ts`), mọi chữ qua `t()` (EN tự có, tsc ép). Việc hằng tuần theo vai: GV (Công việc mỗi sáng ·
  Nhập điểm + nhận xét MT · Speaking chấm chéo · Xác nhận PA / Case · Ghi kết quả PA 2 tuần · Ghi vi phạm · Góp ý hàng tuần) · QL · QT · TVV / CX · Admin.
  "Theo màn" theo CODE_MAP "Tra theo MÀN HÌNH"; "Luật và hạn" từ Rulebook.
- **Giữ đúng tự động:** (1) mỗi đường trong thanh điều hướng có mục, thiếu → check đỏ; (2) mỗi "Chỉ cho tôi" trỏ `data-hd` có thật trong mã web,
  mất → check đỏ; (3) chữ qua `t()`; (4) mục 9.0 plan: PR đổi màn nào sửa mục đó; (5) do-khung thêm kịch bản bấm mọi "Chỉ cho tôi" theo vai.
- Phần 2 (nội dung theo vai + giữ đúng) chờ chủ SP "ok".

## 5. Chia PR + thứ tự

| PR | Nội dung | Mockup | Migrate | Rà | Khi nào |
|---|---|---|---|---|---|
| **HF** | L1–L5, L9 + ErrorBoundary + Công việc dòng xong ẩn hạn | không | không | sâu (L1 quyền) | **ngay** (thẻ đề xuất) |
| **13e** | Đăng ký + chọn vai (mục 6) | không | thêm cột | security | ngay (song song HF) — chờ Q6 |
| **EN-e** | chữ EN sót (Đang SOS, panel một em, chip thứ, `mocChu`, tên việc thống nhất) | không | không | mặc định | sau HF |
| **13a** | Luật Case: A+B+C, Case tạm (Q2), xoá Case `cho_chot_sos`, `prOv1c` một lần, Case MT bỏ Mô tả (Q1) | không (đổi luật, giữ màn) | **đổi dữ liệu** | sâu + tập dượt | sau HF + Q1/Q2 |
| **13b** | Ghi kết quả gọn + Case gọn + "Đã lưu · Việc tiếp ›" + Tổng quan GV tại chỗ + `lamTaiCho` đủ loại + panel số liệu lên URL + một hàm đếm quá hạn | **cần** | không | sâu | sau 13a + mockup |
| **13c** | Gom Công việc (4) + Speaking chấm chéo (7) | **cần** (4) | không | sâu + đo tốc độ | sau 13b + mockup |
| **13d** | Cấp bậc vi phạm nhiều em (5) | **cần** | không | sâu | song song 13c (khác vùng) |
| **13f** | Ẩn mã HV + Excel Email (8) | không | không | mặc định | cuối |
| **HD-a / HD-b** | Hướng dẫn trên web: khung + GV / nội dung vai khác | **cần** | không | mặc định | song song từ khi mockup duyệt |

Mockup cần soạn (một file, 1440 + 375, tối, đủ trạng thái): Ghi kết quả gọn + Case gọn (13b) · dòng gộp tuần + Xác nhận PA cùng lúc (13c) ·
Ý thức chọn nhiều + panel lô (13d) · Hướng dẫn + nút "?" + "Chỉ cho tôi" + dải Mới dùng (HD).
