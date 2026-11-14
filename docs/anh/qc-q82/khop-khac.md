# QC-Q82 — dòng quy chế "Nhập hộ điểm" · khớp / khác

Nguồn: `docs/anh/gd4b-dong-quy-che/khop-khac.md` dòng 57 · bảng 83 câu Q82 ("Bạn nhập hộ · trước tuần Test: hỏi dời về tuần này rồi lưu"). Chỉ thêm câu giải thích, KHÔNG đổi luật.
Seed demo 14/09, QL Nguyễn Khánh Vy (vai 2), Công việc › Tất cả › Chấm điểm. Phông Be Vietnam Pro đã nạp.

## Ảnh

| Ảnh | Nội dung |
|---|---|
| `cap-nhap-ho-1440-toi.png` | TRƯỚC │ SAU — "Nhập hộ" MB FT 101 Listening, Reading (việc của GV Trần Ngọc Hà): dòng quy chế thêm "Bạn nhập hộ · …" |
| `cap-nhap-ho-375-sang.png` | như trên, 375: câu xuống dòng trong chân, không cắt chữ |
| `web-nhap-ho-ca-lop-1440-toi.png` | SAU — việc "Cả lớp · 4 lớp W3 SEP" (panel nhiều lớp): "Bạn nhập hộ · "-" = vắng: dời sang tuần sau, không tự huỷ" |

Không ✕ / ⋯ nào đổi. Demo 14/09 đang ở tuần W3 SEP nên không có việc "trước tuần Test" để chụp; biến thể đó có trong phép kiểm.

## 1. Truy vết

| Mục | Theo mã | Chỗ | Kết quả |
|---|---|---|---|
| Ai là "nhập hộ" | `WorkItem.mine === false` (máy chủ đã trả trong việc) · panel GV trễ chấm: `gvId !== người xem` | `PanelNhapDiem` + panel nhiều lớp (`PanelViec.tsx`) · `PanelGvTre.tsx` | 0 câu thêm |
| Q82 | "Bạn nhập hộ · {câu của lượt}" — đứng đầu MỌI biến thể của `quyCheNhapDiem`; câu sau giữ luật của lượt (vắng / quá hạn / MT cũ / chưa tới tuần) | dòng quy chế panel Nhập điểm | KHỚP |
| Q82 "trước tuần Test" **[XM-Q82]** | Bảng: "hỏi dời về tuần này rồi lưu". Mã NHAP-DIEM-a (chủ SP 14/11, `doiVeTuanNayNeuChua`): lưu điểm trước tuần Test thì máy **tự dời về tuần này, không hỏi, không cần QL** → câu: "Chưa tới tuần Test {tuần} · lưu điểm thì máy dời về tuần này" | như trên | SỬA CÂU THEO MÃ |
| Q5 (chưa tới tuần Test, mọi người) | câu cũ "em làm sớm thì nhờ QL dời lịch" là luật trước NHAP-DIEM-a → cùng câu mới ở trên (một luật một câu) | như trên | SỬA CÂU THEO MÃ |
| `LamDongSoLieu` (mở Nhập điểm từ panel số liệu) | dòng số liệu không mang `mine` → không ghi "Bạn nhập hộ" (không đoán) | — | GIỮ |
| [XM-Q82b] | Panel làm thay đã có dải vàng "Bạn đang làm thay {GV}". "Bạn nhập hộ · " trong dòng quy chế là theo bảng Q82; nếu PTA thấy trùng thì chỉ cần bỏ đầu câu (một dòng ở `quyCheNhapDiem`) | — | HỎI PTA |

## 2. Bảng thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Nhập hộ / Nhập điểm, Việc tiếp, Cả lớp, Mở lưới đầy đủ, ⓘ quy chế | panel Nhập điểm | giữ nguyên; chỉ đổi chữ dòng quy chế |

Không thao tác nào bị mất.

## 3. Turso

0 câu thêm (`mine` có sẵn trong việc).

## 4. Phép kiểm

`thanhPhanChung.tests.ts` "QC-Q82 · …": có "Bạn nhập hộ" khi không phải việc của mình, không có khi là việc của mình. Biến thể trước tuần Test = máy tự dời; không còn chữ "nhờ QL" / "hỏi dời". Câu neo vào chú thích luật `doiVeTuanNayNeuChua`. Hai panel Nhập điểm + panel GV trễ chấm đều truyền cờ. `plan.md`: gạch Q82 khỏi Việc để sau.
