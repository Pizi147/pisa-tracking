# OV-14 — Thiết kế tổng thể (bản nháp chờ chủ SP duyệt) · 18/10/2026

Nguồn: prompt tổng hợp chủ SP + GPT 18/10 (`nguon/2026-10-18-ov14-prompt-tong-hop.md`, mã C01–C31) · đánh giá 17/10
(`2026-10-17-ov14-danh-gia-ux.md`) · 3 mockup `thiet-ke/mockup-ov14-*` · tra mã main `4f4043a4` (chỉ đọc, file:dòng trong
`bao-cao` của planning) · ảnh GV nước ngoài 18/10 (chấm chéo Speaking).
Nhãn: **[CHỐT]** chủ SP đã nói · **[ĐÃ CÓ]** mã hiện tại đã làm · **[ĐỀ XUẤT]** planning đề xuất (chủ SP sửa nếu khác) · **[HỎI]**.
Luật làm việc: CLAUDE.md (đầu ra trước, ít bước, làm tại chỗ, một khái niệm một tên). Quyền overhaul toàn web [CHỐT C01].

---

## 0. GẤP — Chấm chéo Speaking (C32, chủ SP 18/10)

**Chủ SP báo:** GV nước ngoài (Speaking) muốn chấm chéo vài em nhưng không thấy em nào. Luật chủ SP: GV Speaking mặc định thấy
TẤT CẢ học viên cần chấm Speaking.

**Nguyên nhân (đã kiểm mã, chưa kiểm dữ liệu bản chính):** bốn chỗ cộng lại.
1. **Định nghĩa "GV Speaking" quá hẹp** — `lopFtChoGvSpeaking` (`server/src/permissions.ts:278`): chỉ người đang có phân công
   kỹ năng `speaking` ở ít nhất MỘT lớp FT, và chỉ mở các lớp FT cùng chi nhánh với lớp đó. GV nước ngoài không phân công S ở lớp FT
   nào (chỉ dạy lớp thường, hoặc chỉ là người chấm) → thấy 0 bài. Hồ sơ "kỹ năng phụ trách được" (`user_skills`) không được dùng.
2. **Công tắc khung giữ khung rỗng** — URL `loai=thuong` thắng cả khi Lớp thường có 0 lớp (`LichTestTab.tsx:170`, UX-2 cho mở khung rỗng
   khi phạm vi có cả hai khung). Ảnh: "Normal class · 0 classes" đang chọn, "Fast Track · 7 classes" bên cạnh.
3. **Bài chỉ thành việc SAU tuần thi** — `canChamCheo` (`shared/domain/chamDiem.ts:47`): Công việc / Tổng quan chỉ đưa bài S Mock
   khi tuần thi đã qua; trong tuần thi GV phải tự tìm ở Lịch Test đúng tuần.
4. **Đang xem tuần cũ** — ảnh ở W2 OCT (`periodId=9`) trong khi tuần này là W3 OCT.

**Chủ SP làm ngay (trước khi sửa mã):** bảo GV bấm **Fast Track** + **This week**. Vẫn trống → vào Quản trị kiểm GV có phân công
**Speaking** ở ít nhất một lớp FT đang học (chưa có thì thêm — luật hiện tại cần thế).

**Thiết kế mới — "Chấm Speaking" (một hàng đợi):** [ĐỀ XUẤT]
- **Ai:** GV có kỹ năng **Speaking** trong hồ sơ (Quản trị › Kỹ năng) **hoặc** đang dạy S ở lớp FT — không cần phân công từng lớp. **[CHỐT 18/10]**
- **Phạm vi:** mọi lớp FT trong các chi nhánh tài khoản GV có quyền (vai GV toàn hệ thống → mọi chi nhánh). **[CHỐT 18/10]**
- **Khi nào:** bài S Mock hiện từ **thứ Hai tuần thi** (như C14 lớp thường), chưa chấm thì còn tới khi chấm; hạn chấm không đổi. **[CHỐT 18/10]**
- **Ở đâu:** Công việc của GV Speaking có nhóm đầu **"Chấm Speaking · n bài"**: ô **Tìm học viên** (tên / email, có/không dấu) + lọc lớp;
  mỗi dòng = một em (tên · lớp · MT · tuần · "Nhập bởi" nếu đã có người chấm). Bấm → hộp chấm Speaking (4 tiêu chí + nhận xét) ngay
  trong panel, Enter = em tiếp. Hai người cùng chấm một em: hộp hiện "Đã chấm bởi … lúc …" trước khi ghi đè.
- **Lịch Test:** khung đang chọn rỗng mà khung kia có lớp → trạng thái rỗng có nút **"Fast Track · 7 lớp ›"** (không tự nhảy khung).
- **Quản trị:** cột / chip "Chấm Speaking" ở danh sách GV để QL thấy ai được tính là GV Speaking.
- Giữ: OV-13k (nhận xét GV phụ trách, việc "Xem nhận xét Speaking"), chuông quá hạn `chamCheo.ts`, ô S không phải "việc của ai" ở Phân tích GV.
- PR: **OV-14c** (máy chủ: định nghĩa + phạm vi + thời điểm, phép kiểm theo vai; web: nhóm Chấm Speaking + tìm + rỗng có nút). Không migrate.

---

## 1. Bảng quyết định C01–C31

| Mã | Nội dung | Hiện trạng mã | Quyết định / việc làm |
|---|---|---|---|
| C01 | Overhaul toàn web | — | [CHỐT] Rà xuyên suốt; mục 2 là bản đồ mới |
| C02 | Bấm là tới đúng dữ liệu + làm được | nhiều số mở danh sách tên hoặc chuyển trang | [CHỐT] Một mẫu **panel làm việc** (mục 3.1); số 0 tuyệt đối không là link; `0/20` vẫn mở 20 mục |
| C03 | Bỏ Nhắc thủ công | [ĐÃ CÓ] OV-12h bỏ 4 route Nhắc; còn chữ "Đã nhắc" ở `HangTab.tsx:12,42`, Rulebook :763, :836 | Bỏ nốt chữ; thông báo tự động đã có (`notify()` dedup `audit.ts:65`, cron `chot-vang` + quét khi đọc) → bổ sung sự kiện thiếu (mục 3.4); bấm thông báo mở đúng việc |
| C04 | Nút `?` thay "Vì sao?" | — | [CHỐT] Component `NutGiaiThich` một mẫu: tiêu đề → **kết luận đậm** → số liệu → việc có thể làm; ở mọi chip SOS, ô số, chỗ dán Excel |
| C05 | Ký hiệu đạt / chưa đạt | ▲▼ đang dùng cho CẢ xu hướng (`hanhTrinh.ts:309`) VÀ đạt/dưới kỳ vọng (`ODiemLon.tsx:35` `DauKyVong`); `ClassRoster` ▾ chỉ có "dưới" | [ĐỀ XUẤT] Icon SVG một bộ: ✓ **Đạt** · ⊗ **Chưa đạt** · ○ **Chưa đủ điểm**; chênh kỳ vọng = chữ nhỏ "thiếu 0.5" / "vượt 0.5" (không mũi tên); xu hướng chỉ ở vùng Hành trình: "Tăng 0.5 / Giảm 0.5 / Không đổi". Bỏ "=" |
| C06 | Căn cột | — | [CHỐT] Số căn giữa, `tabular-nums`; tên / chữ dài căn trái |
| C07 | W ở Học viên & Lớp | mockup 1 | [CHỐT] giữ, căn giữa |
| C08 | Chip SOS | mockup 1 phương án A | [CHỐT] vàng / cam / đỏ **chỉ viền**. Màu viền một mình KHÔNG đạt kiểm (sáng ΔE 8,3; mù màu 0,9) → [ĐỀ XUẤT] viền dày dần **1 → 1,5 → 2,5 px**, SOS 3 viền đôi; chữ "SOS n" giữ |
| C09 | Cỡ chữ | — | [CHỐT] đầu cột 12 không in hoa · ô bảng 13 · ô nhập 375 = 16 · thang 12/13/14/16/20 (sửa DESIGN.md) |
| C10 | Bộ lọc | — | [CHỐT] dải lọc dính dưới tiêu đề, chip đang lọc có ✕ |
| C11 | Thanh trên | — | [CHỐT] Giao diện, Ngôn ngữ, Hướng dẫn vào menu tài khoản; sáng / tối mặc định theo máy |
| C12 | Hồ sơ lớp | [ĐÃ CÓ] `ClassRoster` 2 lượt (`depth = 2`, lượt cũ mờ) + cột W1 · W2 · **W** | [CHỐT] bỏ cột W tổng; thêm cột nhỏ "Đợt" (MT3 / MT2); một hàng = một lượt, không ghép |
| C13 | Học viên & Lớp mở lớp FT | chưa có cột điểm | [CHỐT] thêm OVR · L · R · W · S (W1 · W2 dòng phụ mờ) |
| C14 | Progress / Final hiện trong tuần thi | [ĐÃ CÓ] Lịch Test hiện từ tuần đã xếp; Công việc từ thứ Hai tuần thi (`skillSchedule.ts:325`); nhập được trong tuần thi; quá tuần vẫn còn (khối 2 → khối 1) | Chủ SP 18/10: không hiện ở **Test › Lịch Test / chấm Test** → OV-14c tái hiện bằng bản sao dữ liệu (chỉ đọc) tìm đúng lớp / tuần, sửa theo nguyên nhân. Rulebook :683, :771 lỗi thời → sửa |
| C15 | Dán điểm + nhận xét từ Excel | lưới KHÔNG nhận dán (chỉ IntakePanel nhập HV) | [ĐỀ XUẤT] Ở mọi lưới nhập: nút **Dán từ Excel** + `?`; nhận cặp `Tên | điểm | nhận xét | …` (có / không hàng tiêu đề; báo cột đã nhận); khớp tên bỏ dấu, trùng tên → chọn em; xem trước một bảng trong panel (mới / ghi đè trước→sau / lỗi); MT: nhận xét dán thoả "nhận xét bắt buộc", nhóm nguyên nhân dưới kỳ vọng chọn tại chỗ trong bảng xem trước; lưu dòng hợp lệ, phần chưa đủ là nháp. Một mẫu "loại dữ liệu" mỗi lô (số câu / band) |
| C16 | Bỏ tab Điểm theo lớp | [ĐÃ CÓ] ⋯ hàng lớp có "Nhập điểm" (→ `/test/diem-lop?lop=`), hồ sơ lớp có nút Nhập điểm | [CHỐT] bỏ tab; ⋯ → Nhập điểm mở **panel nhập điểm tại chỗ** (chọn lượt / môn trong panel); link cũ `/test/diem-lop?lop=` chuyển sang panel của lớp đó |
| C17 | Xuất Excel Kế hoạch Test | chưa có (`xuatMt` là điểm, không phải lịch) | [CHỐT] 13 cột `Gmail | Tên học sinh | Lớp | MT1…MT10`; ô = lịch thi `W4 AUG/2026` hoặc `L/R: W4 AUG/2026; W/S: W1 SEP/2026`; "Chưa xếp" / "Đã huỷ" / "Vắng"; phạm vi = bộ lọc đang xem; sheet "Thông tin xuất" ghi MT > 10 nếu có |
| C18 | Tìm lớp + HV + Gmail | `TimLop.tsx` chỉ mã lớp | [CHỐT] một ô "Tìm lớp, học viên hoặc email…"; kết quả chia Lớp / Học viên (tên · lớp · email); chọn em → mở lớp + cuộn tới hàng em |
| C19 | Nút Xóa ở chân hộp lịch | `HopKyNang` ⋯ có "Huỷ MT" (= huỷ cả lượt); API **bỏ tuần** đã có (`boTuanLuot`, QL, chặn khi có điểm / đã thi) nhưng chỉ ở panel Lộ trình | [ĐỀ XUẤT] nút **Xóa lịch** ngay phải "Đóng" = bỏ tuần (lượt về "Chưa xếp", giữ học viên, lượt, lịch sử). Hộp hỏi: "Xóa lịch MT4 của Đỗ Trọng Tiến? 4 kỹ năng về Chưa xếp." Có điểm / đã thi → nút mờ + lý do. "Huỷ MT" giữ trong ⋯ |
| C20 | Năm cạnh tuần | `tuanLich` chỉ kèm năm khi khác năm; ~46 chỗ gọi không kèm | [CHỐT] Kế hoạch Test, hộp lịch, xuất: luôn `W4 AUG/2026`; nơi khác giữ mã tuần ngắn (luật 30/09) trừ khi khác năm |
| C21 | Ghi chú dưới lịch MT | chưa có | [ĐỀ XUẤT] ghi chú theo **học viên × lượt MT** (bảng mới, có tác giả, lúc, lịch sử); một dòng dưới chip, bấm sửa tại chỗ; ô "Ghi chú lịch thi" trong hộp lịch; ghi chú lớp ở dưới bảng. Không là lệnh dời |
| C22 | Lịch sử nhập / sửa | có nhiều bảng (audit_logs, attempt_schedule_history, score history, …); chưa có màn cho: thông tin lớp, tiến độ lớp, phân công GV, góp ý tuần, nhập HV hàng loạt, thi thật, ô lưới FT | [ĐỀ XUẤT] một component **Lịch sử thay đổi** đọc theo đối tượng (gom một lần lưu, trước→sau, ai, lúc, nguồn, lý do); lấp các chỗ thiếu; lô / Excel = một lần lưu mở ra từng ô |
| C23 | Tổng quan A + nhãn | Case chưa chốt PA = các trạng thái chờ (nhận xét, nguyên nhân, xác nhận PA, duyệt đổi PA, đang làm không có PA theo dõi); mỗi Case một trạng thái, không trùng | [CHỐT] "Lớp cần chú ý", "HV cần chú ý", **Case chưa chốt PA** = Case trống PA + PA chờ xác nhận + PA chờ duyệt + Chờ nhận xét / nguyên nhân + PA xong chờ đóng Case (phân rã trong `?`); cột HV - Case xếp chồng "21 HV / 34 Case", hai vùng bấm |
| C24 | Báo cáo 2 tuần hoàn chỉnh | — | [CHỐT] mặc định 2 tuần trước tuần này; bộ chọn chung (mục 3.5) |
| C25 | Bỏ khung Đã thi – Chờ KQ khỏi báo cáo | — | [CHỐT] chỉ báo cáo; màn vận hành giữ |
| C26 | Panel báo cáo hiện kết quả cụ thể | — | [CHỐT] điểm gì · của ai · đợt · kết quả; mở hàng em làm tại chỗ; "Mở bảng điểm" giữ lớp / lượt |
| C27 | Kết quả thi Pass / Fail | luật trong mã: Mock — kỹ năng đạt khi band ≥ kỳ vọng MT (MT1 Target−1, MT2 −0,5, MT3+ = Target), Overall ≥ kỳ vọng = Đạt; thi thật — OVR ≥ Target; lớp thường — môn ≥ 70 %, Final dải % (≥ 70 Pass) | [ĐỀ XUẤT] vùng **Kết quả thi** trong Phân tích, lọc **Loại thi** (Mock Test · Thi thật · Progress · Final) — không trộn thang; Đạt / Chưa đạt / Chưa đủ điểm theo luật từng loại ở trên; Fail ghi kỹ năng hụt ("R 5.5/6.0 · thiếu 0.5"), Pass ghi "Đạt"; đếm theo **lượt**, có số HV riêng; mẫu số ghi ở `?` |
| C28 | Tên bảng Phân tích | — | [CHỐT] Test + SOS · Hiệu quả PA · Phân tích GV · Ý thức (+ Kết quả thi) |
| C29 | Thời gian tự do | chỉ Phân tích GV có Từ tuần – Đến tuần / Theo tháng; tab khác 4/8/12 tuần / 6 tháng | [CHỐT] bộ chọn chung mọi tab, giữ khi đổi tab, URL có ngày đầu–cuối; "Xếp theo: tuần / lớp / đợt Test / chi nhánh" là ô chọn riêng (Q6b) |
| C30 | Phân tích GV giữ chiều sâu | `PhanTichGiaoVien.tsx` có lớp, HV, đúng hạn (chấm, KQ PA, vi phạm), PA hiệu quả, kết quả môn, HV tiến bộ, tử/mẫu | [CHỐT] một hàng một GV theo mục 9.1 prompt; bấm chỉ số → panel đúng GV + đúng thời gian, làm tại chỗ theo quyền |
| C31 | Xuất danh sách HV theo nhu cầu | thư viện `xlsx` có; xuất ở Lịch Test, hồ sơ lớp, Test+SOS, Ý thức; KHÔNG ở Học viên & Lớp | [ĐỀ XUẤT] nút **Xuất Excel · n HV** ở Học viên & Lớp + mọi panel danh sách; kế thừa bộ lọc (SOS · Cơ sở · Lớp; Bộ lọc thêm: Case / PA, kỹ năng, kết quả, thời gian); hai phạm vi "Toàn bộ đang lọc" / "Đã chọn"; 3 mẫu cột (Cơ bản · Theo dõi SOS · Kết quả thi); dùng CHUNG truy vấn với danh sách; sheet "Thông tin xuất" |
| Mục 10 | Rà soát lịch thi (thi thật) | dữ liệu ở `learning_cycles` (`exam_month`, `exam_period_id`, `exam_date`, `thi_that_*`), có audit | [ĐỀ XUẤT] phương án **D** — mục 4 |

---

## 2. Bản đồ web mới [ĐỀ XUẤT]

- **Thanh trên:** Công việc · Tổng quan (QL / QT / TVV / CX) · Học viên & Lớp · Test · Phân tích · ô Tìm · Thông báo · menu tài khoản
  (Giao diện · Ngôn ngữ · Hướng dẫn · Hồ sơ · Đăng xuất). GV vào thẳng Công việc (hàng đợi, mockup 2 đã duyệt).
- **Công việc:** một danh sách theo nhóm loại, xếp theo hạn; "Chờ bạn duyệt" đầu khi có; GV Speaking có "Chấm Speaking"; QL lọc 3 trục
  (Của tôi · Của GV ▾ · Tất cả) + chip "Quá hạn" lọc toàn bộ quá hạn; việc chưa có người phụ trách hiện rõ để phân công.
- **Tổng quan QL:** Cần bạn quyết (Chờ duyệt · Case chưa chốt PA quá hạn · Bước tiếp sau thi · **Chốt lộ trình khi có** [CHỐT Q5]) ·
  dải tóm tắt nhỏ dẫn tới việc [CHỐT Q6a] · Lớp cần chú ý · Tuần này. Nút **Báo cáo** (trang in / chiếu).
- **Học viên & Lớp:** Tất cả · Đang SOS (mặc định Toàn bộ) · Cần làm · **Lịch thi** (mục 4). Mở lớp FT có cột điểm (C13). Xuất Excel (C31).
- **Test:** Lịch Test (chấm theo tuần) · Kế hoạch Test (lưới MT, năm, tìm HV / email, Xóa lịch, ghi chú, xuất 13 cột). Bỏ Điểm theo lớp.
- **Phân tích:** Test + SOS · Kết quả thi · Hiệu quả PA · Phân tích GV · Ý thức — một bộ chọn thời gian chung.

## 3. Mẫu dùng chung [ĐỀ XUẤT]

1. **Panel làm việc:** đối tượng + ngữ cảnh → dữ liệu cần hiểu → thao tác chính → trạng thái lưu (Đang lưu · Đã lưu lúc 14:32 · Lỗi,
   chữ giữ) → Lịch sử / `?`. Số trên trang = số hàng trong panel (cùng hàm). Không panel chồng panel; điện thoại toàn màn, Back đúng chỗ.
2. **Ô điểm:** 4 dáng — cần tôi nhập (khung rỗng) · có điểm (số đậm + ký hiệu C05) · của người khác chưa có (trống) · "-" / Vắng.
3. **Ký hiệu + màu:** token 5 nghĩa (mockup 1), chip SOS viền (C08), quá hạn chỉ chữ cam + ⚠, hàng đã thi nền xanh, đang chọn = viền khung.
4. **Thông báo:** mỗi thông báo trỏ MỘT đối tượng nghiệp vụ, gom theo đối tượng, tự hết khi việc xong; "đã đọc" ≠ "đã xong". Thêm sự kiện:
   bài quá hạn chấm của chính GV (một thông báo mỗi lớp · đợt), Case chưa chốt PA quá hạn (GVCN), Chốt lộ trình tới hạn (QL). Không email / push.
5. **Bộ chọn thời gian:** `2 tuần vừa qua · Theo tuần (Từ – Đến) · Theo tháng · Tùy chọn`, có năm + khoảng ngày, tuần nghiệp vụ T2→CN.
6. **Lịch sử thay đổi** (C22) và **Dán từ Excel** (C15): mỗi thứ một component, mọi nơi dùng lại.

## 4. Rà soát lịch thi (thi thật) — so phương án

| | A — trang trong Test | B — góc trong Học viên & Lớp | C — chế độ trên Kế hoạch Test | **D — góc "Lịch thi" ở Học viên & Lớp + lối vào từ Test (khuyến nghị)** |
|---|---|---|---|---|
| Dữ liệu | lịch thi thật (theo HV) | đúng chỗ (theo HV) | lưới MT theo lớp — lệch | đúng chỗ |
| Người họp | QL | QL · TVV · CX · GVCN đều quen trang này | QL | như B |
| Thao tác chốt / dời | panel mới | ô sửa tại hàng | lẫn với MT | sửa tại hàng, như cột "Dự kiến thi" đang có |
| Thêm khái niệm | 1 trang | 1 góc nhìn | 1 chế độ | 1 góc nhìn |

**D:** Học viên & Lớp › **Lịch thi** — chọn **Tháng dự kiến thi** (một hoặc nhiều tháng); danh sách em có tháng đó + em chưa có dự kiến thi.
Cột: HV (lớp · GVCN · TVV) · Target · Kết quả gần nhất (đợt · OVR · kỹ năng dưới kỳ vọng) · Lịch hiện tại · **Kết luận** (Giữ tháng ·
Chốt ngày [ô ngày] · Chuyển tháng [ô tháng] · Cần xác nhận) · Ghi chú họp (một dòng, có tác giả). Sửa tại hàng → lưu ngay vào
`learning_cycles` (lịch sử như cột Dự kiến thi). Em vừa chuyển tháng vẫn ở danh sách tới khi rời trang, nhãn "Đã chuyển sang 12/2026".
Đầu bảng: "Đã chốt n · Chuyển tháng m · Còn k". Test › Lịch Test có lối "Lịch thi thật ›" mở đúng góc này. Không bước duyệt mới; quyền như
sửa Dự kiến thi hiện nay. Chỉ thi thật (Mock ở Kế hoạch Test). Dời lịch thi thật không tự dời MT / hạn PA.

## 5. Phân kỳ PR [ĐỀ XUẤT]

| Đợt | PR | Gồm | Mockup |
|---|---|---|---|
| 0 | OV-14b (đang dở) · **OV-14c** | sửa nhỏ giao diện · Chấm Speaking (mục 0) | 14c: thêm một khung vào mockup 2 |
| 1 | OV-15a nền | token + chip SOS viền + ký hiệu C05 + cỡ chữ + thanh trên / menu + `NutGiaiThich` + panel làm việc + dải lọc | mockup 1 (sửa C08, C05) |
| 2 | OV-15b lưới | lưới một component + Dán Excel (C15) + hàng đợi GV + bỏ tab Điểm theo lớp (C16) + hồ sơ lớp C12 + C13 | mockup 2 (thêm C15 cặp cột) |
| 3 | OV-15c Kế hoạch Test | năm (C20) · tìm HV / email (C18) · Xóa lịch (C19) · ghi chú (C21) · xuất 13 cột (C17) | thêm mockup 4 |
| 4 | OV-15d Công việc + Tổng quan + thông báo | C02 · C03 · C23 · Q5 · Q6a | mockup 2, 3 |
| 5 | OV-15e Phân tích + Báo cáo | C24–C30 + Kết quả thi | mockup 3 (sửa tên, thời gian, Phân tích GV) |
| 6 | OV-15f Lịch thi + Xuất danh sách | mục 4 + C31 | thêm mockup 5 |
| xuyên | OV-15g Lịch sử thay đổi | C22 — component + lấp chỗ thiếu (làm cùng đợt 1–2) | không (theo mẫu) |

Mỗi đợt: planning viết kế hoạch PR + sửa mockup → chủ SP duyệt → session code. Đợt 1 trước vì mọi màn sau dùng lại token / chip / panel.
Không migrate đổi dữ liệu trừ C21 (bảng ghi chú mới, chỉ thêm) và OV-14c (không migrate).
