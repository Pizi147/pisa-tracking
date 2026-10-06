# PR-SOTAY · Sáu sổ tay PDF theo web mới nhất — kế hoạch (07/10/2026)

> Session code: dùng superpowers:executing-plans (hoặc subagent-driven-development), làm từng Task, tick `- [ ]`.
> Dàn ý từng file: `docs/so-tay/DAN_Y_2026-10-07.md` (planning tự duyệt 07/10, plan.md mục 3).

**Goal.** Sáu PDF viết theo `main` cuối cùng, ảnh thật chụp app chạy cục bộ:

| File PDF (tên đúng từng ký tự) | Người đọc | Tiếng | Trang |
|---|---|---|---|
| `PTA - TEACHER MANUAL - MINI.pdf` | GV Việt Nam | Việt | 2–4 |
| `PTA - TEACHER MANUAL - FULL.pdf` | GV Việt Nam | Việt | ~32 |
| `PTA - FOREIGN TEACHER MANUAL - MINI.pdf` | GV nước ngoài | Anh (ảnh màn EN) | 2–4 |
| `PTA - FOREIGN TEACHER MANUAL - FULL.pdf` | GV nước ngoài, chỉ phần GV dùng (phạm vi PR-EN) | Anh | ~18 |
| `PTA - HEADS MANUAL - MINI.pdf` | Quản lý | Việt | 2–4 |
| `PTA - HEADS MANUAL - FULL.pdf` | Quản lý | Việt | ~30 |

MINI: chỉ việc hằng tuần, mỗi việc 1 ảnh + 3–5 bước. FULL: đủ mọi màn, mọi luật.

**Khi nào chạy.** Thứ tự đã chốt (plan.md mục 3, 07/10): … → KHUNG → HK2 → (TEN nếu còn trong kế hoạch) → **PR-EN** → **PR-SOTAY** → deploy một lần.
Viết **chữ** và **ảnh** theo `main` sau khi PR-EN merge. Không chờ bản chính, không chạm Turso / Netlify / DB bản chính.

**Làm trước được (trước khi HK2 / EN merge, nhánh riêng, không chụp):** Task 1 (khung dựng + css + dọn sổ cũ), Task 2 phần **chữ** (bước, luật, bảng hạn, bảng quyền — để chỗ `<fig>` trống, dựng ra PDF có ô "[Ảnh … chưa có]"), Task 3 phần **kịch bản chụp** cho màn không đổi ở HK2/EN (QL). Chữ trên nút đánh dấu `<!-- kiem-chu -->` để soát lại sau HK2/TEN/EN.
**Phải chờ:** chụp ảnh (Task 4), bản EN (chữ + ảnh: theo bảng thuật ngữ PR-EN), soát chữ nút (Task 5), dựng PDF cuối (Task 6).

---

## Đánh giá bộ dựng cũ `docs/so-tay/` (02/10)

| Phần | Giữ / sửa / bỏ |
|---|---|
| `dung/dung.mjs` (ghép `noi-dung` + `<fig id>` → HTML → PDF) | **Giữ cách làm**, sửa: (1) tham số = mã sổ (`gv-mini`, `gv-full`, `gvnn-mini`, `gvnn-full`, `ql-mini`, `ql-full`) → tên PDF đúng bảng trên; (2) đọc ảnh theo tiếng (`anh/vi/`, `anh/en/`); (3) trình duyệt `channel: 'msedge'` (Edge headless qua Playwright `--no-save`, như PR-KHUNG), rơi về CLI `msedge --headless --print-to-pdf` nếu không có Playwright; (4) chân trang "PISA Tracking · {tên sổ} · bản {ngày} · n/N" (EN: "edition"); (5) **kiểm tự động** (Task 6); (6) `lang="en"` cho sổ EN |
| `dung/so-tay.css` | **Giữ** (bìa, khung luật, ảnh có số, `.buoc`, ảnh dọc). Sửa: thêm `@font-face` chữ số Inter như `web/src/index.css` dòng 7–14 (luật phông PR-SANG); thêm khối `.viec` cho MINI (ảnh trái + bước phải, `break-inside: avoid`); tên web "PISA Tracking" |
| `chup/lib.mjs` (đăng nhập `POST /api/demo/session`, ẩn DemoBar, khoanh số, chụp) | **Giữ**. Sửa: `channel: 'msedge'`; tham số `lang` (đặt khoá ngôn ngữ PR-EN vào `localStorage` trước khi mở trang — lấy tên khoá từ mã PR-EN); `BASE` = cổng vite hiện tại (biến `SO_TAY_BASE`); ảnh ra `anh/{lang}/`; cỡ 375 dùng `w: 375` |
| `chup/anh.mjs`, `fig-*.mjs` (79 ảnh `g-*`, `q-*`) | **Bỏ khai báo cũ**, viết lại theo bảng ảnh Task 3 (id mới `gv-*`, `ql-*`). Dùng lại được: selector của màn **không đổi** (hộp Thông báo, hộp tài khoản, Chờ duyệt `#the-{id}`, Phân tích `radiogroup Góc nhìn`, Vận hành, Báo cáo đơn vị, `#bang-ky-nang`, `#dai-diem`) — chép từ `fig-*.mjs` cũ rồi kiểm |
| `noi-dung/*.html` (4 sổ) | **Không dùng lại nguyên khối.** Lấy được: bìa, "Nhớ ba điều", bảng hạn (sửa), bảng ai làm được gì, thang Ý thức, phụ lục thuật ngữ. **Lỗi thời** (viết lại): Lịch Test (nay ba khối, LT3), "Nợ tuần trước" (bỏ), hạn chấm lớp thường (nay **Thứ Tư tuần sau**, T19), sửa điểm cần lý do ≥ 5 ký tự (nay tuỳ chọn, T7; xoá trắng ô = xoá, T22), "-" lớp thường / FT (nay xoá "-" = hết vắng, BV; vắng lần 2 huỷ kỹ năng + Xin dời, T3), MT lịch sử → **MT cũ** (T1, T23), panel Xếp lịch MT + ô MT mới + MT0 (MTb, MT0), Điểm theo lớp (DL), Tổng kết lộ trình + thi thật (TK), Ghi vi phạm nhiều em + Sửa / Xoá (LUI-a1), Case Sửa / Xoá / Mở lại + Người phụ trách (LUI-a2), Chọn nhiều HV + Học lại + Mở lại lớp (LUI-b), Chờ duyệt "Nhắc việc" thay "Để QL biết" (NV), Lộ trình tiếp theo "Chưa quyết" + cả lớp (K26), Sửa thông tin cả lớp (SL), Speaking chấm chéo (T18), khung nhập điểm (T19), band (T10) |
| `_dung/*.html` | Tệp sinh ra — thêm `docs/so-tay/_dung/` vào `.gitignore` |
| `OUTLINE_…02.md`, `BAN_DO_MAN_HINH_…02.md` | Chuyển vào `cu/`. Bản đồ màn: dùng **CODE_MAP.md "Tra theo MÀN HÌNH"** thay (mới hơn); tài khoản demo / lớp minh hoạ ở BAN_DO mục 0.2–0.3 vẫn đúng phần lớn — kiểm lại khi seed |
| 4 PDF 02/10 | **Đề xuất:** chuyển vào `docs/so-tay/cu/` (giữ để so); xoá `anh/` cũ (79 PNG ~ vài MB, git còn giữ). Xem câu hỏi Q1 |

## Cấu trúc mới

```
docs/so-tay/
  PTA - TEACHER MANUAL - MINI.pdf  … (6 PDF, tên đúng bảng Goal)
  DAN_Y_2026-10-07.md
  dung/dung.mjs  dung/so-tay.css
  noi-dung/vi/gv-mini.html  gv-full.html  ql-mini.html  ql-full.html
  noi-dung/en/gvnn-mini.html  gvnn-full.html
  chup/lib.mjs  chup/anh.mjs  chup/du-lieu.mjs  chup/fig-gv-a.mjs  fig-gv-b.mjs  fig-ql-a.mjs  fig-ql-b.mjs  chup/README.md
  anh/vi/gv-*.png  anh/vi/ql-*.png  anh/en/gv-*.png
  cu/  (sổ 02/10)
```
Một khai báo ảnh `gv-*` dùng cho cả `vi` và `en` (cùng selector; chữ khoanh lấy theo vai trò / `aria-label` / `data-*`, **không** theo chữ hiển thị, để chạy được ở hai tiếng). Chú thích số `ghi` có hai tiếng: `{ vi: '…', en: '…' }`.

---

## Task 1 — Khung dựng + css + dọn sổ cũ (làm trước được)

- [ ] `git mv` 4 PDF 02/10, `OUTLINE_…`, `BAN_DO_…` vào `docs/so-tay/cu/`; xoá `anh/*.png` cũ, `noi-dung/*.html` cũ, `_dung/`, `chup/fig-*.mjs` cũ (git còn giữ: ghi commit gốc trong `cu/README.md` một dòng).
- [ ] `.gitignore`: `docs/so-tay/_dung/`.
- [ ] Sửa `dung/dung.mjs`, `so-tay.css`, `chup/lib.mjs` theo bảng đánh giá. Không thêm gói vào `package.json` (Playwright chạy `npm i --no-save playwright`).
- [ ] Chạy thử `node docs/so-tay/dung/dung.mjs gv-mini` với nội dung tạm → ra PDF đúng tên, có ô "[Ảnh … chưa có]", phông Be Vietnam Pro + số Inter.

## Task 2 — Viết nội dung chữ (3 vai × MINI / FULL)

Theo `DAN_Y_2026-10-07.md`. Luật lấy từ Rulebook §20 + plan.md mục 2c (T1–T23) + mục 3 + mô tả PR đã merge (BV, LUI-a1/a2/b, TK, MT0, LT3, MTa/MTb, NV, K26, DL, SL); **đối chiếu mã `main`** khi nghi (luật theo mã, không theo kế hoạch cũ).
- [ ] `noi-dung/vi/gv-mini.html`, `gv-full.html` (tiếng Việt).
- [ ] `noi-dung/vi/ql-mini.html`, `ql-full.html`.
- [ ] `noi-dung/en/gvnn-mini.html`, `gvnn-full.html` — **sau khi có bảng thuật ngữ PR-EN**; chữ nút chép đúng màn EN. Viết tiếng Anh đơn giản (B1), câu ngắn.
- [ ] Luật chữ: nói theo cái thấy trên màn; mỗi việc 3–5 bước; khung luật ≤ 3 dòng; không tên mã, không số PR, không "T19".
- [ ] Chữ chép từ nút / tab / nhãn đánh `<!-- kiem-chu -->` để Task 5 soát.

## Task 3 — Danh sách ảnh + dữ liệu chụp

Môi trường: DB riêng `data/pisa-so-tay.sqlite` (`PISA_DB=… npm run seed`, rồi `PISA_DB=… npm run dev`), ngày demo cố định của seed (`DEMO_DATE`). **Không** dùng DB demo chung, **không** Turso.
- [ ] `chup/du-lieu.mjs`: một lần, chạy tuần tự **trước** khi chụp — tạo các trạng thái seed còn thiếu bằng API (ghi vào DB riêng, được phép): bài thi tuần trước chưa chấm (khối 2), bài quá hạn ≥ 2 tuần (khối 1), "-" đã chốt, em có Lên FT + MT0, PA cần ghi kết quả, Case tay mình tạo, vi phạm ≥ 3 (bắt buộc), thẻ Chờ duyệt đủ 5 phân loại, lớp thường tới tuần kết thúc, HV đã kết thúc (Học lại), lộ trình đã đóng (Tổng kết). Kiểm trạng thái nào seed đã có thì bỏ qua. In ra id dùng cho `fig-*.mjs`.
- [ ] Sau bước này: chụp **chỉ đọc** (không bấm Lưu / Gửi / Xác nhận / Duyệt); mở panel, gõ thử vào ô rồi chụp thì được, không lưu.

**Bảng ảnh** (cỡ mặc định 1440, sáng; `375` = điện thoại; tài khoản theo BAN_DO mục 0.2: Hà 7 = GVCN + L R, Khoa 8 = Writing, Trang 9 = Speaking/P (dùng cho bản EN), Vy 2 = QL MB). Cột EN = cũng chụp bản `en/`.

| id | Màn › trạng thái | Vai | EN | Cỡ | Nhóm |
|---|---|---|---|---|---|
| gv-01 | Đăng nhập (chưa đăng nhập; nút Tiếng Việt \| English) | — | ✓ | 1440 | A |
| gv-02 | Khung: nav, tìm, chuông, VI\|EN, ◐, tài khoản (hộp tài khoản mở) | Hà | ✓ | 1440 | A |
| gv-03 | Hộp Thông báo (Cần làm / Để biết) | Hà | ✓ | 1440 | A |
| gv-04 | Tổng quan GV trên điện thoại, thanh dưới | Hà | ✓ | 375 | A |
| gv-05 | Tổng quan › Việc của tôi · hôm nay (có quá hạn) + Yêu cầu của tôi + Lớp tôi dạy | Hà | ✓ | 1440 | A |
| gv-06 | Công việc của tôi, lọc Quá hạn | Hà | ✓ | 1440 | A |
| gv-07 | Lịch Test ba khối (khối 2 mở, badge Quá hạn) + dải số | Hà | ✓ | 1440 | A |
| gv-08 | Khối 1 Test quá hạn chấm mở: dòng lớp + lưới con, GV chấm còn thiếu | Hà | ✓ | 1440 | A |
| gv-09 | Lưới FT: L R W1 W2 S, band, Overall, trạng thái lưu | Hà | ✓ | 1440 | A |
| gv-10 | Hộp 4 tiêu chí W/S + ô Band | Khoa | ✓ | 1440 | A |
| gv-11 | Ô khoá "chưa tới tuần thi" | Hà | ✓ | 1440 | A |
| gv-12 | Ô "-" + dòng giải thích; xoá "-" | Hà | ✓ | 1440 | A |
| gv-13 | Xoá trắng ô có điểm + Lưu (ô lý do không bắt buộc) | Hà | ✓ | 1440 | A |
| gv-14 | Lưới lớp thường BE (L R W S, %, Đạt / Chưa đạt) | Hà | ✓ | 1440 | A |
| gv-15 | Lưới FOU (G+V, P) và Pre FOU (Tổng hợp) | Hà / Trang | ✓ | 1440 | A |
| gv-16 | Nhập điểm một kỹ năng trên điện thoại | Trang | ✓ | 375 | A |
| gv-17 | Test › Điểm theo lớp, một lượt | Hà | ✓ | 1440 | A |
| gv-18 | Hồ sơ một lượt Mock (5 ô điểm, kỳ vọng, SOS, Lịch sử) | Hà | ✓ | 1440 | A |
| gv-19 | MT cũ (nhãn "cũ"), GVCN sửa ô; "-" = Không dự thi | Hà | — | 1440 | A |
| gv-20 | Speaking chấm chéo: cột GV chấm, chọn GV chấm S | Trang | ✓ | 1440 | A |
| gv-21 | Hàng MT0 ở Lịch Test lớp thường tuần Final | Hà | — | 1440 | A |
| gv-22 | Hồ sơ HV › bảng kỹ năng (SOS, chip Case) | Hà | ✓ | 1440 | B |
| gv-23 | Ngăn Case: xác nhận nguyên nhân / Không cần theo dõi | Hà | ✓ | 1440 | B |
| gv-24 | Xác nhận PA quy chế | Hà | ✓ | 1440 | B |
| gv-25 | Tạo Case (có bằng chứng) | Hà | ✓ | 1440 | B |
| gv-26 | Thêm PA | Hà | ✓ | 1440 | B |
| gv-27 | Ghi kết quả PA (hạn Thứ Hai, Người phụ trách, Vấn đề còn tồn / Ghi chú, nút kết quả) | Hà | ✓ | 1440 | B |
| gv-28 | Ghi kết quả cuối + Hoàn thành Case | Hà | ✓ | 1440 | B |
| gv-29 | Sửa / Xoá Case mình tạo | Hà | — | 1440 | B |
| gv-30 | Hồ sơ lớp › Cần hỗ trợ | Hà | ✓ | 1440 | B |
| gv-31 | Case Giữa khoá lớp thường + PA Bổ trợ | Hà | ✓ | 1440 | B |
| gv-32 | Nộp kế hoạch bổ trợ | Hà | — | 1440 | B |
| gv-33 | Báo phụ huynh qua TVV | Hà | — | 1440 | B |
| gv-34 | Kết luận Cuối khoá (dải %) | Hà | — | 1440 | B |
| gv-35 | Mini Test | Hà | — | 1440 | B |
| gv-36 | Lộ trình tiếp theo một em (Hệ thống gợi ý, Lên FT) | Hà | — | 1440 | B |
| gv-37 | Ghi lộ trình tiếp theo cả lớp (⋮ hồ sơ lớp) | Hà | — | 1440 | B |
| gv-38 | Ghi vi phạm nhiều em / nhiều vi phạm, Vi phạm + Mô tả, bằng chứng | Hà | ✓ | 1440 | B |
| gv-39 | Sửa / Xoá vi phạm | Hà | ✓ | 1440 | B |
| gv-40 | Thang xử lý (GVCN), Xác nhận xử lý | Hà | — | 1440 | B |
| gv-41 | Bắt buộc xử lý / Quá hạn | Hà | — | 1440 | B |
| gv-42 | Đề xuất ngoài thang (WL 3…) + bằng chứng | Hà | — | 1440 | B |
| gv-43 | Sửa / Xoá lần xử lý | Hà | — | 1440 | B |
| gv-44 | Phối hợp SOS | Hà | — | 1440 | B |
| gv-45 | Khai bậc | Hà | — | 1440 | B |
| gv-46 | Hồ sơ lớp (đầu trang, tab, ⋮) | Hà | ✓ | 1440 | B |
| gv-47 | Thêm học viên | Hà | — | 1440 | B |
| gv-48 | Sửa thông tin cả lớp (GVCN) | Hà | — | 1440 | B |
| gv-49 | Báo vắng | Hà | — | 1440 | B |
| gv-50 | Đề xuất chuyển lớp | Hà | — | 1440 | B |
| gv-51 | Bàn giao | Hà | — | 1440 | B |
| gv-52 | Tổng kết lộ trình + kết quả thi thật | Hà | — | 1440 | B |
| gv-53 | Menu ⋮ hồ sơ HV: Tạm dừng / Kết thúc học | Hà | — | 1440 | B |
| gv-54 | Hành trình | Hà | ✓ | 1440 | B |
| gv-55 | Yêu cầu của tôi (Chờ duyệt / Bị từ chối / Sửa và gửi lại) | Hà | ✓ | 1440 | B |
| gv-56 | Hồ sơ giáo viên của mình | Hà | — | 1440 | B |
| ql-01 | Tổng quan QL: Cần xử lý, dải Chờ duyệt, công tắc, chi nhánh | Vy | — | 1440 | D |
| ql-02 | Tổng quan › Số liệu | Vy | — | 1440 | D |
| ql-03 | Tạo lớp | Vy | — | 1440 | D |
| ql-04 | Học viên & Lớp | Vy | — | 1440 | D |
| ql-05 | Thêm học viên (Target / KCK) | Vy | — | 1440 | D |
| ql-06 | Sửa thông tin cả lớp (Target có lý do) | Vy | — | 1440 | D |
| ql-07 | Chọn nhiều học viên + xem trước | Vy | — | 1440 | D |
| ql-08 | Lưu trữ: Học lại, Mở lại lớp | Vy | — | 1440 | D |
| ql-09 | Chuyển lớp một em | Vy | — | 1440 | D |
| ql-10 | Chuyển tiếp lớp (điền sẵn đề xuất, MT0) | Vy | — | 1440 | D |
| ql-11 | Việc Chốt lên FT · lớp + Lộ trình tiếp theo | Vy | — | 1440 | D |
| ql-12 | Kết thúc lớp | Vy | — | 1440 | D |
| ql-13 | Tổng kết lộ trình (Lưu trữ, tab Tổng kết lớp) | Vy | — | 1440 | D |
| ql-14 | Kế hoạch Test (lưới HV × đợt, ô MT) | Vy | — | 1440 | D |
| ql-15 | Panel Xếp lịch MT (MT mới, tick 4, Sẽ xếp) | Vy | — | 1440 | D |
| ql-16 | Hộp một đợt (Tuần chung, ⋯, Nhật ký) | Vy | — | 1440 | D |
| ql-17 | Popup dời vượt + huỷ / khôi phục kết quả | Vy | — | 1440 | D |
| ql-18 | Kế hoạch Test lớp thường (Progress / Final, MT0) | Vy | — | 1440 | D |
| ql-19 | Dời bài đã có điểm về tuần cũ (dòng nhắc vàng) | Vy | — | 1440 | D |
| ql-20 | Khôi phục phần đã huỷ | Vy | — | 1440 | D |
| ql-21 | Lịch Test QL, khối quá hạn + Nhắc | Vy | — | 1440 | D |
| ql-22 | Điểm theo lớp (QL) | Vy | — | 1440 | D |
| ql-23 | Chờ duyệt (5 phân loại, Tất cả chi nhánh) | Vy | — | 1440 | E |
| ql-24 | Từ chối (một / nhiều) | Vy | — | 1440 | E |
| ql-25 | Duyệt hàng loạt | Vy | — | 1440 | E |
| ql-26 | Huỷ quyết định trong ngày | Vy | — | 1440 | E |
| ql-27 | Nhắc việc / Nhắc tất cả | Vy | — | 1440 | E |
| ql-28 | Thẻ Xin dời (vắng lần 2) | Vy | — | 1440 | E |
| ql-29 | Thẻ Ý thức cần duyệt (bằng chứng) | Vy | — | 1440 | E |
| ql-30 | Thẻ Kế hoạch bổ trợ | Vy | — | 1440 | E |
| ql-31 | Mở lại Case, Sửa / Xoá Case, Xoá PA | Vy | — | 1440 | E |
| ql-32 | Công việc: việc quá hạn của GV, Nhắc | Vy | — | 1440 | E |
| ql-33 | Phân tích › Tổng hợp Test + SOS | Vy | — | 1440 | E |
| ql-34 | Phân tích › Vấn đề học viên | Vy | — | 1440 | E |
| ql-35 | Phân tích › Hiệu quả PA | Vy | — | 1440 | E |
| ql-36 | Phân tích › Ý thức & Phối hợp | Vy | — | 1440 | E |
| ql-37 | Phân tích › Giáo viên | Vy | — | 1440 | E |
| ql-38 | Hồ sơ giáo viên (QL xem) | Vy | — | 1440 | E |
| ql-39 | Đánh dấu kỳ vọng đầu ra BE/ELE | Vy | — | 1440 | E |
| ql-40 | Vận hành | Vy | — | 1440 | E |
| ql-41 | Báo cáo đơn vị | Vy | — | 1440 | E |
| ql-42 | Tổng quan QL trên điện thoại | Vy | — | 375 | E |

**Tổng: 131 ảnh** = 56 `vi/gv` + 33 `en/gv` (dòng có ✓) + 42 `vi/ql`. MINI dùng lại ảnh FULL.

## Task 4 — Chụp song song theo nhóm (superpowers:dispatching-parallel-agents)

- [ ] Một dev server cục bộ (DB riêng) chạy nền; `du-lieu.mjs` đã chạy xong.
- [ ] Giao **5 agent cùng lúc**, mỗi agent một tệp `fig-*.mjs` + một thư mục ra, không ghi chung tệp:
  A `fig-gv-a.mjs` gv-01…21 (vi) · B `fig-gv-b.mjs` gv-22…56 (vi) · C chạy lại `fig-gv-a` + `fig-gv-b` với `lang=en`, chỉ id có ✓ → `anh/en/` · D `fig-ql-a.mjs` ql-01…22 · E `fig-ql-b.mjs` ql-23…42.
- [ ] Agent: Opus 5.5 hoặc Sonnet 5.5 (không Fable, không Haiku); chỉ đọc; khoanh theo `aria-label`, `role`, `data-*`, id (BAN_DO cũ mục 0.5 + CODE_MAP), không theo chữ; ảnh nào thiếu số / không có trạng thái thì **báo**, không tự sửa mã web.
- [ ] Mỗi agent báo: ✓ / ⚠ thiếu số / ✗ lỗi cho từng id; xem lại từng ảnh (Read ảnh) — không có thanh DemoBar, không lỗi, không chữ cắt trên màn.
- [ ] Không chạy `npm run check` trong lúc chụp (bộ nhớ, CLAUDE.md).

## Task 5 — Soát chữ theo màn

- [ ] Mọi `<!-- kiem-chu -->`: chữ trong sổ = chữ trên ảnh (vi và en). Bản EN: không còn chữ Việt ngoài tên riêng / dữ liệu GV tự gõ.
- [ ] `node scripts/quet-chu.mjs` (nếu áp được cho `docs/so-tay/noi-dung/vi/`) — không còn chữ chối tai trong `thiet-ke/CHU_CAN_SUA_2026-10*.md`.

## Task 6 — Dựng PDF + kiểm tự động

- [ ] `node docs/so-tay/dung/dung.mjs all` dựng đủ 6 PDF ở `docs/so-tay/` đúng tên.
- [ ] `dung.mjs` **thoát mã 1** nếu: (a) thiếu ảnh (`thieu` không rỗng); (b) MINI ngoài 2–4 trang (đếm `/Type /Page` trong PDF); (c) chữ cắt: trước khi in, đo trong trang HTML mọi phần tử có `scrollWidth > clientWidth + 1` hoặc `scrollHeight > clientHeight + 1` khi `overflow` ≠ visible, và ảnh / bảng rộng hơn vùng in; (d) tên file khác 6 tên trong Goal.
- [ ] Mở từng PDF xem bằng mắt (render vài trang): bìa, một trang có ảnh dọc, bảng phụ lục, trang cuối.

## Nghiệm thu

- [ ] Đủ 6 PDF, tên đúng từng ký tự, ở `docs/so-tay/`; sổ 02/10 ở `docs/so-tay/cu/`.
- [ ] MINI 2–4 trang, mỗi việc 1 ảnh + 3–5 bước; FULL đủ mục trong `DAN_Y_2026-10-07.md`.
- [ ] 131 ảnh có, không ô "[Ảnh … chưa có]"; ảnh là `main` sau PR-EN, không DemoBar.
- [ ] Không chữ cắt trong PDF (kiểm tự động + xem mắt); phông Be Vietnam Pro, số Inter.
- [ ] Sổ EN chỉ phần GV dùng, ảnh màn EN, thuật ngữ khớp bảng PR-EN.
- [ ] Không thêm gói vào `package.json`; không chạm Turso / Netlify / DB bản chính.
- [ ] Chủ sản phẩm xem ảnh + PDF trước khi merge (plan.md mục 3, 07/10). Sau merge mới deploy một lần.

## Prompt session code

**Model: Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp; Fable hoặc model khác thì dừng.**
```
/ponytail lite
Làm PR-SOTAY theo docs/superpowers/plans/2026-10-07-pr-sotay-so-tay-moi.md và docs/so-tay/DAN_Y_2026-10-07.md.
Điều kiện: HK2 và PR-EN đã merge vào main (kiểm bằng gh pr list); chưa merge thì chỉ làm Task 1, Task 2 phần chữ tiếng Việt, rồi dừng và báo.
Worktree .claude/worktrees/pr-sotay, nhánh pr-sotay từ origin/main. Không chạm Turso / Netlify / DB bản chính; dùng DB riêng data/pisa-so-tay.sqlite.
Chụp ảnh: superpowers:dispatching-parallel-agents, 5 agent (A, B, C, D, E ở Task 4), cùng model với session, không Fable, không Haiku, chỉ đọc.
Luật chữ: tiếng Việt đơn giản, ngắn, nói theo cái thấy trên màn; bản EN tiếng Anh đơn giản theo bảng thuật ngữ PR-EN.
Không thêm gói npm; PDF bằng Edge headless (Playwright --no-save, channel msedge). Không chạy npm run check song song với chụp ảnh.
Xong: một dòng vào plan.md mục 11, mở PR vào main, KHÔNG merge; báo số trang từng PDF, số ảnh, ảnh nào ⚠.
```
