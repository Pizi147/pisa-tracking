# v23 ① Khung panel — ghi chú

Mockup: [`khung-panel.html`](khung-panel.html) · CSS chung mới: [`v23.css`](v23.css) (tự đứng, không link v21 / v22) · ảnh: `anh/khung-panel-*.png`.
Đặc tả: `docs/superpowers/specs/2026-11-22-nhe-hon-design.md` mục 1, 2. Bộ v23 gồm 8 màn: ① khung panel · ② Công việc GV · ③ TVV · ④ Admin · ⑤ panel chấm điểm · ⑥ Lịch Test · ⑦ Cuối khoá · ⑧ thang Ý thức.

## Khung chung `v23.css` (PR khung chung làm trước)

| Phần | Giá trị | Thay cho |
|---|---|---|
| Thang chữ | 12 · 13 · 14 · 16 · 20 · 26 (`--c12`…`--c26`); chữ thường **14**; tiêu đề trang 20, tiêu đề panel 16 | 12 · 13 · 14 · 15 · 17 · 22 · 28 (`web/src/index.css:200`) |
| 60-30-10 | nền `--bg` · thẻ / bảng `--surface` + chữ phụ · nhấn chỉ cho nút chính + quá hạn / chưa đạt / SOS 2–3; ≤ 1 điểm màu một dòng | — |
| Chip | MỘT kiểu `.chip`: cao 22, chữ 12 / 600, bo 4, viền mảnh không nền; chỉ `.sos2` `.sos3` `.qua` có nền | 4 nhóm badge (V4) — giữ nghĩa, gom dáng |
| Hạn trong dòng | chữ `.han` (đỏ quá hạn · vàng hôm nay · thường) — không chip | `ChipHan` viên tròn |
| Bảng | `table-layout:fixed` + `colgroup`; tên không cắt; ô số / điểm đều; không nút trong `th`; mã tuần nowrap | mỗi bảng tự co |
| Ô điểm | 72 × 40 (375: 44); vắng `−` nền xám; **huỷ** viền đứt + gạch chéo + gạch ngang số | 96 × 44, "đã huỷ" dưới ô |
| Ô tick | `.tick` vẽ theo theme | ô trình duyệt |
| Panel | `.pn` top = dưới thanh menu, bottom 0; 58 % / `.rong` 75 % / 375 toàn màn; đầu 52 · chân 52 | 480 / 720 px nổi trong cột |
| Khối phụ | `details.gap` gập sẵn, summary = một dòng tóm tắt | khối 3 hàng mở sẵn |

## Truy vết ý → khung → thành phần

| Ý chủ SP / mục đặc tả | Khung | Thành phần web dự kiến |
|---|---|---|
| ý 4 panel chật, kéo cao tới thanh đầu trang, header / footer chiếm chỗ — mục 2 | P1, P2, P3 | `web/src/ui/KhungPanel.tsx` (vị trí, bề rộng `rong: 'thuong' \| 'bang'`), `DauPanel`, `ChanPanel` |
| ý 12 Lịch sử luôn gập — mục 2 "Thân" | P1, P3a | `LichSuThayDoi` (gập mặc định), khối Phụ trách `KhoiPhuTrach` (v22) bọc `<details>` |
| ý 13 chữ nhỏ 1 px — mục 1 | mọi khung | `web/src/index.css` thang chữ, `DESIGN.md` |
| ý 8 panel "Đạt MT" có giá trị — (sửa logic SUA-2211; hình ở đây) | P2 | panel số `bang` (V11) |
| bỏ hàng "Quy chế" — mục 1 "Chữ phụ" | P1 | `DongQuyChe` → ⓘ `NutLuat` ở đầu panel |
| trạng thái lưu một hàng — V12 | P4 | `ChanPanel` trái `TrangThaiLuu` |

## Thao tác TRƯỚC → SAU

| Trước | Sau | Ghi chú |
|---|---|---|
| ⋯ · ✕ góc panel | giữ, cùng ô 36 × 36, cùng tâm | đo ≤ 1 px khi code |
| Đổi người / Sửa hạn / + theo dõi / ✕ bỏ theo dõi | giữ, trong khối "Phụ trách" (bấm mở) | thêm 1 bấm để thấy — chủ SP chọn gập |
| Lịch sử | giữ, gập sẵn | ý 12 |
| Lưu · Lưu · việc tiếp › · Hoàn tác · Việc tiếp › | giữ | V12 |
| Dòng "Quy chế … ⓘ" | bỏ dòng, ⓘ lên đầu panel | không mất thông tin |
| ‹ Quay lại (375) | giữ | V19 |
| Xuất (panel số) | giữ | — |

## Tự rà đặc tả (mục 2, 5)

- Cao từ dưới menu tới đáy, không hở: đạt (P1, P2). Rộng 58 % / 75 % / 375 toàn màn: đạt.
- Đầu một dòng tên · em · lớp · hạn, bỏ "Việc · …": đạt. ⋯ ✕ thẳng hàng: đạt trên ảnh, đo lại khi code.
- Chân một hàng, ≤ 2 nút, không Quy chế: đạt. Đầu + chân = 104 ≤ 120: đạt.
- Khối phụ gập một dòng: đạt. Việc ngắn không cuộn ở 1440: đạt (P1 nút luôn thấy).

## [XM]

- ~~[XM-1] Khối Phụ trách gập sẵn~~ → đóng: chủ SP góp ý 2 đưa lên ngay dưới đầu panel (việc liên phòng ban).

Critique (impeccable, tự chấm): **35 / 40** — không P0 / P1. P2: ô "Kết quả" dạng đoạn chọn hơi dài ở 1440 (đã sửa canh trái).

## Góp ý chủ SP 22/11 (qua PTA Plan) — đã sửa

| Góp ý | Khung | Sửa | Thành phần web |
|---|---|---|---|
| 1 bấm từng vi phạm vẫn hiện mô tả (luật cũ) | P1, P3a | danh sách vi phạm là nút; mở ngay dưới dòng: Nhóm · Ngày · người ghi · Mô tả · Tệp (vẽ một dòng đang mở) | `PanelBaoPhTvv.tsx` danh sách vi phạm (`.vpd`, như `.vp-dong` v22) |
| 2 việc liên phòng ban: Phụ trách · Hạn · Theo dõi lên trên | P1, P3a, P3b | `.pht1` một hàng ngay dưới đầu panel (375: 3 dòng gọn), không gập; Đổi / Sửa hạn / ✕ / + bấm thẳng. **Trừ nhập điểm.** Lịch sử vẫn gập | `KhoiPhuTrach` (v22 N58) đặt trong `KhungPanel` ngay sau đầu |
| 4 chữ dài cần đậm / tách dòng | P1, P2, P3b | dòng tóm vi phạm đậm số / người / bậc · nhận xét MT đậm kỹ năng · Lịch sử mỗi mục 2 dòng (ai làm gì đậm, nội dung xám) · mô tả vi phạm tách câu | `.chu-dai`, `.ls .noi` |

- Đầu + chân + khối Phụ trách = 52 + 48 + 52 = 152 px (> 120 của nghiệm thu cũ) — chủ SP chọn đưa khối lên trên; vẫn không cuộn với việc ngắn ở 1440.
- Bảng thao tác: khối Phụ trách không còn "thêm 1 bấm" → [XM-1] đóng.

## Góp ý chủ SP 22/11 vòng 2 (qua PTA Plan) — đã sửa

**LUẬT HẠN (khung chung, ghi trong `v23.css`):** mọi ngày hiện đủ **dd/mm/yyyy** (hạn, ngày thi, ngày ghi, lịch sử, vi phạm); mã tuần (W2 OCT) giữ cho tuần thi / tuần học. Hạn tô màu: chữ thường = còn xa · **vàng** = hôm nay → còn ≤ 2 ngày (đề xuất PTA) · **đỏ** = quá hạn. Chữ "quá hạn n ngày" CHỈ ở dòng việc danh sách Công việc + đầu panel việc; bảng báo cáo / hồ sơ / khối Phụ trách chỉ tô đỏ ngày. Đã rà cả 8 màn.

| Góp ý | Sửa |
|---|---|
| 1 khối Phụ trách: hạn đủ ngày tháng năm + màu | `.pht1` hạn "21/11/2026" đỏ (bỏ "quá hạn 2 ngày" trùng với đầu panel) |
| 1 panel bảng không cần nhận xét MT | P2 bỏ cột Nhận xét MT — chỉ L R W1 W2 S · Overall · Kết quả |
| 2 luật hạn mọi màn | như trên |
