# VAI-1 XM-2 · "chưa có TVV" / "TVV đã nghỉ" + "Gán TVV cho em ›" — khớp / khác với mockup v29 (V4a · V4b)

Ảnh cặp cả màn (trái mockup · phải web; tối 1440 / 1280, sáng 375) — `docs/anh/vai-1-xm2/`:
- `lead-tvv-{1440,1280}.png` — Lead TVV (MB) · Công việc › Báo PH · panel việc của em chưa có TVV (mockup V4a)
- `lead-tvv-ds-375.png` — danh sách Báo PH 375 (mockup V4b) · `lead-tvv-375.png` — panel 375

Dữ liệu demo không có Lead TVV → khi chụp gán TẠM vai Lead TVV cho một TVV chi nhánh MB và đặt người chốt của 4 việc Báo PH là người đó, một em có TVV ở chi nhánh khác (= TVV đã nghỉ) — chỉ trong DB demo máy dev, không commit.
Mockup không có khung 1280 → web 1280 ghép với V4a.

## Bảng truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|
| V4a dòng "… · chưa có TVV" (chữ mờ cuối ô chi tiết) | `chuKhongTvv` ở `DongA` / `DongCon` (DanhSachViec) đọc `khongTvv` máy chủ | lead-tvv-1440 / ds-375 | KHỚP |
| V4a dòng "… · TVV đã nghỉ" | cùng hàm, `khongTvv = 'da_nghi'` (TVV của em không còn vai TVV ở chi nhánh em) | (dòng em trong lô MB FOU 22) | KHỚP theo mã |
| Dòng gộp nhiều em | ghi khi mọi em cùng một lý do, khác lý do thì không ghi | lead-tvv-ds-375 | KHỚP (luật thêm, mockup không vẽ) |
| V4a khối "Em chưa có TVV · TVV  Chưa gán · Gán TVV cho em ›" | `KhoiKhongTvv` (PanelBaoPhTvv, cùng khuôn `KhoiChuyenLop` — tiêu đề + `BoiCanh`) | lead-tvv-1440 / 375 | KHỚP |
| V4a vị trí khối: ngay dưới khối Phụ trách | web: dưới khối Tuyến (Tuyến sẵn có nằm ngay dưới khối giao việc) | lead-tvv-1440 | KHÁC nhỏ — giữ thứ tự sẵn có |
| "Gán TVV cho em ›" | link "›" sang hồ sơ em mở panel Bổ sung hồ sơ (`viec=bo-sung`, có ô TVV); quyền gán chặn ở máy chủ (đường sửa hồ sơ sẵn có) | — | KHỚP (luật "›" = đổi trang) |
| V4a / V4b mỗi dòng một tầng | có lý do TVV → ô chi tiết giữ cụm đầu + "· chưa có TVV" (như mockup "Kết quả Final · chưa có TVV"); cụm lý do `nowrap`, không "…"; đủ chữ ở title + panel (PTA rà #2326) | lead-tvv-1440 / 1280 / ds-375 | KHỚP |
| Khối giao việc / Việc con / Lịch sử | sẵn có | mọi ảnh | GIỮ |

Tỉ lệ khớp (KHỚP + GIỮ + KHÁC nhỏ trên tổng): 7 KHỚP / GIỮ · 1 KHÁC nhỏ; tính KHÁC nhỏ nửa → 7,5 / 8 ≈ **94 %**.

## Thao tác TRƯỚC → SAU PR

| Thao tác | Trước | Sau |
|---|---|---|
| Lead TVV / Head biết vì sao việc TVV về mình | không thấy (chỉ dòng Chuyển lớp của Head có "chưa có TVV") | mọi dòng Báo PH + Chốt ngày thi ghi "chưa có TVV" / "TVV đã nghỉ" |
| Gán TVV cho em từ việc | phải tự mở hồ sơ em, tìm Sửa thông tin | "Gán TVV cho em ›" trong panel Báo PH |
| Mọi thao tác cũ của panel Báo PH (Ghi kết quả, Chưa liên hệ được, Bỏ việc, đổi người / hạn, Việc con…) | có | GIỮ |

Không mất thao tác nào.

## Máy chủ — 0 câu thêm

- `khongTvvCua` (viecTvv.ts): `chua_co` / `da_nghi` từ cột TVV đã đọc sẵn.
- `/my-work` Báo PH (`viecBaoPhCuaToi`, mọi nguồn): cờ khi việc chưa giao tay và em không có TVV hiệu lực. Chốt ngày thi (`viecTvv`): khi người giữ theo luật không phải TVV của em.
- Bỏ chữ " · chưa có TVV" cứng trong `nhomChuyenLop.chiTiet` (LPB-2b) — web ghi từ cờ chung (thêm "TVV đã nghỉ").
- Số câu `/my-work` không đổi (không câu mới; phép tốc độ băm bỏ trường `khongTvv`).
- Phép kiểm: VM-8 (`prVaiMoi`) thêm `chua_co` → `da_nghi`.

## [XM]

- Sau thi (Bước tiếp / KQ thi thật) và Bổ sung hồ sơ (dòng gộp) chưa mang cờ — PTA chốt: Việc để sau, gộp vào PR máy chủ XM-2 / XM-3 (sau LPB-3).

## Chú thích `ponytail:`

Không thêm.
