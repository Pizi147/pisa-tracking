# Sửa ghi chú 2–6 của KIEM-TAY-1011 — trước | sau

Nguồn: `docs/anh/kiem-tay-1011/ket-qua.md` mục "Ghi lại, KHÔNG sửa". Ghi chú 1 (lớp đã kết thúc, em lưu trữ) **không làm** — chờ chủ SP.
Seed mới (`npm run seed`, ngày demo 14/09/2026), Playwright Chromium nền tối, 1440 + 375. Ảnh `*-truoc.png` | `*-sau.png` cùng thư mục.
Ghi chú 3: ô "Không dự thi" dựng bằng cách gõ "-" vào Listening MT1 W1 JUL của Bùi Thảo Vy (GV Trần Ngọc Hà), sau khi chụp đã gỡ lại.

## Bảng đối chiếu

| # | Vấn đề (hiện trạng đã kiểm) | Sửa | Ảnh |
|---|---|---|---|
| 2 | GV S chéo (Lâm Quang Vinh) ở Kế hoạch Test: mọi mã lớp là link, bấm vào ra "Không có quyền" | Máy chủ thêm cờ `xemHoSo` vào `/ke-hoach-test/lop` (đã có, cùng quyền `attempt.view` của `classOverview`); web: không mở được → chữ thường. Vinh: 5 lớp chữ, MB FT 105 (Vinh là GVCN) vẫn link | `2-ke-hoach-gv-s-{1440,375}-*` |
| 3 | Ô "Không dự thi" (MT0 / MT cũ): không có "Bỏ vắng", gỡ bằng xoá "-" + Lưu chỉ báo "✓ Đã lưu" | Chân hộp có **Bỏ vắng** (như ô vắng đã chốt), gửi đúng lệnh gỡ "-" máy chủ đang có (`noShow: false`); máy chủ trả `boKhongDuThi` → toast **"Đã bỏ vắng L · {em} · Hoàn tác (10)"**; Hoàn tác = ghi lại "-" (máy chủ chốt lại Không dự thi). Xoá "-" trong ô + Lưu cũng ra cùng toast | `3-o-khong-du-thi-hop-*`, `3-sau-bo-vang-toast-*`, `3-sau-hoan-tac-*` |
| 4 | Panel sổ nghĩa vụ: chỉ link "MT1 · S" mở; bấm chỗ trống của dòng không làm gì | Cả dòng bấm được (+ Enter), mở đúng `href` của tên việc / bài (Hồ sơ Mock Test, dòng Speaking mở sẵn). Link em / lớp trong dòng giữ đích riêng (`Bang` bỏ qua bấm / Enter trên phần tử tương tác con) | `4-so-nghia-vu-{1440,375}-*` (hàng đang rê) |
| 5 | Công việc 1440 › Lớp tôi dạy: bảng `min-w 760` trong thẻ 614 px → mã lớp gãy ("MB FT / 101"), cột "Test sắp tới" phải cuộn ngang | Đệm cột 12 → 8 px, mã lớp một dòng, lộ trình / chương trình và "tuần này" xuống dòng phụ, `min-w 600`: cuộn ngang 760/614 → 614/614 (vừa khít, đủ 8 cột). Thẻ hẹp hơn vẫn cuộn trong thẻ. 375 (thẻ) không đổi | `5-lop-toi-day-{1440,375}-*` |
| 6 | Kế hoạch Test 375, mở "Lọc": công tắc chen vào hàng ô tìm ("Tìm l…", "Lớp thườ…") | `<details className="contents">` làm khối lọc thành một ô flex co lại. Thay bằng nút "Lọc" (`aria-expanded`) + khối là con trực tiếp của hàng, xuống dòng riêng dưới ô tìm, trên "n HV". Ô tìm GV: 85 → 255 px | `6-ke-hoach-loc-{gv,ql}-375-*`, `6-ke-hoach-{gv,ql}-375-*` |

## Thao tác trước → sau

| Màn | Trước | Sau |
|---|---|---|
| Kế hoạch Test · hàng lớp | Bấm mã lớp → hồ sơ lớp (kể cả khi không có quyền → trang lỗi); bấm hàng → mở / gập lớp | Mã lớp là link chỉ khi mở được hồ sơ; không thì chữ, bấm vào = bấm hàng (mở / gập). Không mất thao tác |
| Hộp nhập điểm · ô Không dự thi | Xoá "-" + Lưu / Lưu · bài tiếp | Giữ nguyên + thêm **Bỏ vắng** (đóng hộp sau khi máy chủ nhận) + toast có **Hoàn tác** |
| Panel sổ nghĩa vụ | Bấm tên việc / bài, tên em, mã lớp | Giữ cả ba + bấm chỗ trống của dòng / Enter trên dòng = như bấm tên việc |
| Công việc › Lớp tôi dạy | Mọi số bấm được, link lớp | Không đổi (chỉ bố trí cột) |
| Kế hoạch Test 375 · Lọc | Bấm "Lọc" mở / đóng khối công tắc + chip + chi nhánh | Không đổi (khối xuống dòng riêng) |

## Dòng đọc Turso

Không thêm request, không thêm câu SQL: `xemHoSo` dùng `can()` trên bảng lớp đã nhớ trong request GET (`bangLop`, như `chiXem` sẵn có); `boKhongDuThi` đọc `existing.no_show_cu` đã có trong lệnh gỡ "-".
Trần câu / dòng của `/ke-hoach-test/lop` ở `tocDoDuong` vẫn đạt.

## Kiểm

- `server/src/tests/prKiemTay1011.tests.ts` (3 phép kiểm): `xemHoSo` = hồ sơ lớp mở được / 403 cho QL + 3 GV; gỡ Không dự thi trả `boKhongDuThi`, gỡ lần hai không, Hoàn tác về Không dự thi; web (đọc mã).
- `npm run check`: 5451 đạt, 2 không đạt — `[anToan] Z2c-d` và `[prToc] TOC rà (4)` (thời gian / đồng thời); hỏng y hệt trên `main` không có thay đổi này (đã chạy riêng hai tệp sau `git stash`).
