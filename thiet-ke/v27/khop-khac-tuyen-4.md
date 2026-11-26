# TUYEN-4 (web) — khớp / khác mockup v27

Mockup: `tuyen-cong-viec.html` T10a (hồ sơ HV 1440), T10b (hồ sơ lớp 375), T10c (hồ sơ HV 375). Đặc tả `docs/superpowers/specs/2026-11-26-tuyen-cong-viec-yt-phoi-hop/thiet-ke.md` mục 4.2, 7 (TUYEN-4).
Ảnh cặp mockup | web (seed 14/09/2026): `docs/anh/tuyen-4/` — hồ sơ HV Đoàn Minh Khang (TVV Lê Thu, vai 28 — seed: em có cả Phối hợp lẫn lần xử lý vi phạm; Ngô Bảo Châu của mockup chưa có vi phạm), hồ sơ lớp MB FT 101 (GVCN Trần Ngọc Hà, vai 7). Mockup lớp chỉ có 375 → ảnh 1440 / 1280 của lớp ghép với khung T10b.
Nhánh xếp chồng trên `claude/tuyen-3` (#2281 — `KhoiTuyen` "Lần trước", "Sau khi bạn duyệt", `buocNgan`).

## Bảng truy vết khung → thành phần → ảnh

| Khung mockup (v27) | Thành phần web | Ảnh | |
|---|---|---|---|
| T10a: Phối hợp SOS — mỗi lượt một dòng: "MT2 · SOS 3" · chuỗi chấm · "Đang ở … · …" · hạn | `BangPhoiHopHoSo` đầu lượt (`KhoiLuot`): chuỗi chấm + `chuTomTuyen` + `HanTomTuyen` từ `chuoiTuyen` của GET Phối hợp em (TUYEN-0, 0 request thêm) — thay "x/y việc xong" | t10a | KHỚP |
| T10a: lượt đang mở bung sẵn khối Tuyến; lượt xong gập ("MT1 · SOS 2 · ●●● · Xong 24/08/2026") | `TuyenTaiHs` (GET `/tuyen/phoi_hop/{lượt}` khi mở) mở sẵn nội dung bước đang ở + bước xong gần nhất; "Xong {ngày}" (`tomTat` thêm `ketThucLuc`) | t10a | KHỚP |
| T10a: Vi phạm — "n lần xử lý", mỗi lần một dòng: tên bậc · chuỗi chấm · "Xong · …" / "Đang ở GVCN …"; "Chờ xử lý" | khối Vi phạm mới (`DongTuyenHs`) từ `chuoiTuyen` của GET Ý thức (0 request thêm), bấm mở Tuyến | t10a | KHỚP |
| T10a: hai cột Phối hợp SOS · Vi phạm | ≥ 1280 hai cột dưới thang + Đang chờ (giữ) | t10a | KHỚP |
| T10a: dòng việc lặp lại từng bước | bỏ thanh chấm `ThanhBuoc` + dòng phụ `tienDoViec` ở từng việc; có Tuyến → chỉ còn dòng việc người xem THAO TÁC được (Xác nhận · Sửa · Ghi kết quả · Bỏ…) | t10a | KHỚP |
| T10a: đầu hồ sơ / thang / Đang chờ / Lịch sử | giữ khung hồ sơ hiện có (không thuộc PR) | t10a | KHÁC — mockup vẽ gọn chỉ hai khối; web giữ thang xử lý vi phạm, Đang chờ, Lịch sử (tính năng đã duyệt) |
| T10b: hồ sơ lớp — mỗi em một dòng gập: tên · chuỗi chấm phải · "Đang ở …" | `KhoiLuot` cột em: HAI hàng (SOS · tên · [điểm ≥ 640] … chuỗi chấm / "Đang ở …" · hạn … Xem tuyến ˅ · + Thêm việc), gập sẵn | t10b | KHỚP |
| T10b: bấm em mở Tuyến tại chỗ ("Xem 2 bước đã xong ˅") | `TuyenTaiHs` + `KhoiTuyen` (gập bước xong khi dài) | t10b | KHỚP |
| T10b / T10c 375 | điểm (Overall · Trượt) ẩn < 640 ở dòng có tuyến; link xuống hàng riêng | t10b, t10c | KHỚP |
| "Xong a/b" (không "đang n") | `KhoiTuyen` (TUYEN-3) | t10a, t10b | KHỚP |

Đếm: 10 dòng · KHỚP 9 · KHÁC 1. **KHỚP thuần 9 / 10 = 90 %.**

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| Xác nhận · Sửa · Ghi kết quả (TVV) · Bỏ · Mở lại · Sửa hạn · nội dung gửi TVV | dòng việc luôn hiện | dòng việc của người xem (thao tác được) dưới Tuyến | GIỮ |
| Xem tiến độ việc | thanh chấm từng việc + dòng phụ | chuỗi chấm của lượt + khối Tuyến (ai · ngày · nội dung theo quyền) | ĐỔI (N72 ②) |
| + Thêm việc · Học thuật › · Hiện cả lượt đã xong | có | có | GIỮ |
| Hồ sơ lớp: thấy việc từng em | bung sẵn | gập (chuỗi chấm + Đang ở), "Xem tuyến ˅" mở | ĐỔI (mockup T10b) — +1 bấm; GVCN làm việc chính ở Công việc (T5) |
| Hồ sơ HV: lần xử lý vi phạm | chỉ ở thang + Lịch sử | thêm khối Vi phạm (tuyến từng lần) | THÊM |

## Máy chủ
- `tuyen.ts` `tomTat`: + `ketThucLuc` ("Xong {ngày}"). Không đường mới, không câu thêm.
