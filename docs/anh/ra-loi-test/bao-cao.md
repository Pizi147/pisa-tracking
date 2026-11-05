# RA-LOI-TEST — rà màn lỗi ở các trang Test (05/11)

Chủ SP 05/11: "lỗi cũ … liên quan đến test khi trang hiện ra lỗi … không nhớ thao tác nào, nhưng cũng rà lại".

## 1. Dấu vết cũ

| Ngày | PR / commit | Lỗi | Gốc | Trạng thái |
|---|---|---|---|---|
| 19/10 | HOTFIX-4 `84390164d` (#465) | Gõ ô điểm L/R → "Trang gặp lỗi khi hiển thị" | `setState` vị trí trong layout effect mỗi lần vẽ + cuộn → "Maximum update depth exceeded" (hộp nhập điểm `HopNhapDiem`, hộp lịch Kế hoạch Test `HopKyNang`) | Đã sửa trước bản 30/10. Rà lại: hai hộp vẫn ghi vị trí thẳng vào style; các layout effect khác (`ScoreEntry`, `LichNho`, `MenuDong`, `NutLuat`) đều có danh sách phụ thuộc — không lặp |
| 15/10 | HOTFIX `ac086ea5a` | Màn tối khi lỗi vẽ | — | Thêm `BatLoiTrang` (App.tsx): câu lỗi + mã + Tải lại |
| 03/10, 26/10 | `9b73dd777`, `08e456205` | Hồ sơ HV văng khi chưa có đợt chấm / chưa có lộ trình | truy cập thuộc tính của giá trị rỗng | Đã sửa |

**Khả năng cao lỗi chủ SP nhớ là HOTFIX-4 (19/10)** — đúng mô tả "trang Test hiện lỗi", đã sửa từ 19/10, bản chính 30/10 có bản sửa.

## 2. Cách rà

- Ba bản chạy song song (cổng riêng): **main** + DB demo seed mới · **main** + bản sao dữ liệu thật 29/10 (`D:\pisa-mig\mig.sqlite`, migrate tới main) ·
  **bản 30/10** (`3a38444ad`, bản chính đang chạy) + cùng bản sao 29/10.
- Playwright (Edge), mỗi vai đăng nhập riêng, 1440 + 375. Bắt: hộp "Trang gặp lỗi khi hiển thị" (`BatLoiTrang`), `pageerror`, `console.error`
  (trừ cảnh báo React `Warning:`), API 5xx.
- Hai kiểu:
  - **Đi ngẫu nhiên** (hạt giống cố định, tái hiện được): 20 bước / lượt — bấm, bấm đúp, gõ (`7`, `7.5`, `-`, `abc`, `8,5`, rỗng…) + Enter / Tab,
    chọn, Esc, Quay lại, Tải lại. Trang: Lịch Test tuần, Kế hoạch Test, Chấm Test, hồ sơ lượt MT / MT0 / Progress / Final, lượt huỷ, lượt lớp đã kết thúc,
    Lịch thi (Học viên & Lớp).
  - **Theo cây** (đủ nhánh): mở lớp → ô điểm / chip MT (rải đều: lịch sử, trễ chấm, chưa điểm, + MT) → mọi nút trong hộp (Dời, Vắng, Bỏ khỏi đợt, ⋯ …,
    ô nhập điền giá trị trước) → hộp con. Lịch Test (FT, lớp thường, Mở tất cả, nút trang), Kế hoạch Test (lớp, Xếp nhiều MT…, nút trang), Chấm Test.
- Vai: demo QT · QL · GVCN · GVBM · TVV · CX; dữ liệu thật QT · QL · 2 GV · TVV · CX.

**Phạm vi đã chạy / chưa chạy (dừng sớm theo chủ SP "chạy lâu quá"):** cây Lịch Test + Kế hoạch + Chấm Test chạy đủ cho QL, GVBM, GVCN, QT (demo);
đi ngẫu nhiên xong QT (thật, 1440) và TVV (demo, 1440); các lượt còn lại dừng giữa chừng — không lỗi nào tới lúc dừng. Bản 30/10: chạy chưa tới
một vòng vai khi dừng — **chưa đủ để kết luận về bản chính**. Chưa rà riêng: dán Excel, đổi tài khoản giữa chừng.

## 3. Lỗi tìm được

| # | Thao tác | Vai | Lỗi | Gốc | Trạng thái |
|---|---|---|---|---|---|
| 1 | Panel đang gõ dở (vd Báo PH trên hồ sơ HV mở từ Kế hoạch Test) → bấm link rời trang → hộp "Bỏ chữ?" → **bấm đúp "Bỏ chữ, rời đi"** | TVV (demo) — mọi vai có panel sửa | `pageerror: Invalid blocker state transition: unblocked -> proceeding` (không hiện màn lỗi, trang vẫn đi tiếp; lỗi văng ra console) | Lần bấm thứ hai đọc `hoi` / blocker cũ (chưa vẽ lại) → gọi `proceed` của react-router lần hai. Đã xác nhận trên router thật: `proceed` hai lần ném đúng câu này. Cùng gốc: bấm đúp "Bỏ chữ, đóng / quay lại" chạy đóng / quay lại hai lần | **Đã sửa** (PR này): `motLanTraLoi` (`shared/domain/roiNhap.ts`) — mỗi lần bị giữ chỉ trả lời một lần, dùng ở `ChanRoiNhapGoc`; `boChu` của `KhungPanel` chạy một lần cho mỗi hộp. Phép kiểm CRN-8. Bộ chặn mới có từ CHAN-ROI-NHAP (sau 30/10) → riêng lỗi ném này **chỉ có trên main**; bản 30/10 có `boChu` gọi hai lần (đóng / quay lại hai lần) |
| 2 | Mở lưới Lịch Test tuần (FT) | mọi vai | Cảnh báo React `validateDOMNesting: whitespace text nodes cannot appear as a child of <tr>` | Khoảng trắng giữa `{…}` và chú thích trên cùng dòng trong `<tr>` (`LuoiFT.tsx` ô Kỳ vọng) | **Đã sửa** (chuyển chú thích lên dòng riêng). Chỉ là cảnh báo dev, không văng |

Không gặp: hộp "Trang gặp lỗi khi hiển thị", "Maximum update depth", "Cannot read properties of undefined/null", API 5xx thật — trên mọi trang Test đã chạy.

Ghi chú bỏ qua (không phải lỗi sản phẩm): API 500 khi đi ngẫu nhiên bấm Công cụ demo → kịch bản "Lỗi tải" (cố ý); "useSession null" lúc Vite nạp nóng sau khi sửa tệp.

## 4. Việc để sau
- Rà nốt bản 30/10 (bản chính) đủ vai nếu chủ SP vẫn gặp lại màn lỗi — cần ảnh có **Mã lỗi E-…** (màn lỗi in mã, console ghi `[PISA] lỗi giao diện <mã>`) để đối chiếu.
- Dán Excel vào lưới, đổi tài khoản giữa chừng: chưa có kịch bản tự động.

## 5. Chạy lại
`di.mjs` (đi ngẫu nhiên), `cay.mjs` (theo cây) cạnh tệp này. Playwright cài riêng (`npm i --no-save playwright`), kênh `msedge`; Git Bash cần `MSYS_NO_PATHCONV=1`.
`node di.mjs http://localhost:<web> ql=2,gvcn=7 /test/lich,/test/ke-hoach 1440,375 4 20 11` · `node cay.mjs http://localhost:<web> ql=2 1440,375 lich-mo-lop,kh-lop`.
