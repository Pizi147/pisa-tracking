# Truy vết — `ho-so-hv.html` (Hồ sơ học viên)

> V5-B2, dựa trên nền V5-A. **ĐỀ XUẤT THIẾT KẾ** — chờ chủ SP duyệt. Dữ liệu demo. Rà mã: `b2-ra-soat.md` mục 4–5.
> Tham số: `?hv=huy|lam|moi&kn=L|R|W|S&vai=ha|tam&khung=…&theme=dark`.

## 1. Yêu cầu → khung → thành phần

| Yêu cầu | Khung (ảnh `anh/`) | Thành phần |
|---|---|---|
| Brief 11 đầu gọn | `hv-1440-sang`, `-toi`, `hv-375` | Dòng 1: tên + badge kết quả (✗ Chưa đạt MT2) + SOS; dòng 2: lớp ↗ · chương trình · Target (+ "Đề nghị 7.0 · chờ QL duyệt") · lịch thi (badge nhóm lịch) · GVCN · liên hệ PH (theo quyền) |
| Thanh Việc cần làm trước bảng, làm tại chỗ, không lặp | `hv-1440-sang` | Một thanh: việc của tôi = nút (việc gấp nhất là nút chính) + badge hạn; "Việc của người khác (1)" gập. Đây là chỗ **duy nhất** có việc — bỏ việc ở câu tóm tắt, ô Học thuật, dòng hạn SkillBoard |
| Hành trình riêng L / R / W (W1 / W2) / S | `hv-1440-sang` (R), `hv-w1-w2-1280` (W) | Nút kỹ năng; biểu đồ đường theo tuần (SVG) + bảng mốc bên dưới (số liệu đầy đủ, đọc được bằng trình đọc màn hình); W vẽ hai đường W1, W2, bảng có W1 · W2 · W |
| Mốc kỳ vọng đổi theo thời gian, không tô lại lịch sử | `hv-1440-sang` | Đường KV bậc thang nét đứt: "Target 6.0 → KV 5.5" rồi vạch hồng "Target 6.5 · 20/07 → KV 6.0"; điểm MT1 so KV 5.5, MT2 so KV 6.0; cột "KV lúc thi" (`target_at_attempt`) |
| Khoảng trống ≠ không tiến bộ | `hv-1440-sang`, `hv-chua-co-mt-1440` | MT3 thi 14/09 chưa chấm: nét chấm xám + "MT3 chưa có điểm"; bảng ghi "Chưa có điểm (hạn chấm 23/09) — không phải 'không đổi'"; HV chưa có MT: "Chưa có lượt MT nào … chưa có điểm không phải là không tiến bộ" |
| Loại dữ liệu rõ | mọi khung | Chú giải: ● MT chính thức · ◆ Thi thật · □ Tiến độ trên lớp (thang riêng) · nét đứt KV · nét chấm chưa có điểm |
| C11 / T18 tiến độ trên lớp tuỳ chọn, thang riêng | `hv-t18-bai-tren-lop-1440`, `hv-ghi-bai-panel-1440`, `hv-ghi-bai-375` | Khối viền đứt "Tiến độ trên lớp · R — tuỳ chọn · không tính vào MT, Overall hay báo cáo GV"; thẻ "6/10 W4 AUG", "7/10 W2 SEP" (cô Yến); panel "GHI NHẬN · TUỲ CHỌN": kỹ năng, tên bài, điểm "7 / 10" (thang của bài, không quy đổi band), tuần, nhận xét không bắt buộc; không có nhắc / cảnh báo khi không ghi |
| Chỉ xem / tải / lỗi | `hv-chi-xem-1440`, `hv-tai-1440`, `hv-loi-tai-1440` | CX: dải chỉ xem, ẩn nút; khung xương; `bao-loi` |

## 2. BỎ / GIỮ

| | Thứ | Lý do |
|---|---|---|
| BỎ | Câu tóm tắt máy viết + 4 ô (Kết quả gần nhất · Học thuật · Ý thức · Sắp tới) ở đầu (`DauHoSo.tsx:203-329`) | Brief 11 đầu gọn; việc lặp tới 4 chỗ (`hoSoHocVien.ts:225-235, 291-301`) |
| BỎ | Lưới tuần CSS + chú giải 9 ký hiệu (`HanhTrinh.tsx:212-216, 553-584`) | Thay bằng biểu đồ đường + bảng mốc theo kỹ năng; chú giải 5 mục |
| BỎ | Bỏ qua lượt thiếu điểm không để lỗ (`server/src/students/hanhTrinh.ts:271-273`) | Phải thấy khoảng trống |
| GIỮ | Kỳ vọng theo lượt từ `target_at_attempt` (`profile.ts:88`) | Đã đúng brief 11 — nay vẽ thành bậc thang nhìn thấy |
| GIỮ | FT tách W1 / W2 (`cases.ts:113-115`) | C18 |
| GIỮ | Ý thức, Thông tin, Case / PA chi tiết (tab dưới) | Ngoài trọng tâm B2; không vẽ lại |

## 3. Giả định · cần xác minh

- **[B2]** MT1 của Lê Quang Huy, mốc đổi Target 6.0 → 6.5 ngày 20/07, MT của Đặng Ngọc Lam, liên hệ PH.
- **[XM] Dữ liệu mới:** mã chưa có chỗ lưu "tiến độ trên lớp có điểm" (góp ý tuần chỉ là chữ ≤ 500, `schema.sql:2085-2095`). Cần một bảng riêng (kỹ năng, tên bài, điểm, thang, tuần, người ghi) — V5-C quyết; không trộn vào bảng điểm MT. → **SV-BAI-LOP PR #513**: bảng `bai_tren_lop` + API `/students/:id/bai-tren-lop`, `/bai-tren-lop/:id`, lịch sử `/lich-su?loai=bai-lop`.
- **[ĐX]** Biểu đồ không dùng radar (brief 11); thang trục 4.0–7.5 cố định cho FT; lớp thường hiển thị theo thang của bài, không quy đổi band.
- Panel việc từ thanh việc dùng chung khung với Hồ sơ lớp / Công việc (vẽ đủ ở `ho-so-lop.html`).
