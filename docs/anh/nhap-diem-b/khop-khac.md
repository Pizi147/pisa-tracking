# NHAP-DIEM-b — giao diện Huỷ điểm một kỹ năng · nhập / vắng tự do (sau PR-1 #1664)

Đặc tả `docs/superpowers/specs/2026-11-14-nhap-diem-tu-do-design.md` mục 5.5–5.6 · plan `docs/superpowers/plans/2026-11-14-nhap-diem-ky-vong.md` PR-2 · quyết định PTA 14/11 (nút Vắng có điểm → Hoàn tác; giữ "Xoá" ở hộp lập lịch).
Không có mockup mới: PR chỉ đổi thao tác trên mẫu sẵn có (ô điểm, menu ⋯, toast Hoàn tác) — CLAUDE.md "đổi chữ, thêm nút/ô theo mẫu sẵn có: không cần mockup". Luật áp: V22 (trạng thái "Đã huỷ" chữ mờ, không ⚠), lời 35 / 36 / 40, ✓ Đã lưu xanh (dấu lưu ô có sẵn).

Ảnh cặp TRƯỚC (main) | SAU (PR) — seed demo 14/09, phông Be Vietnam Pro + Inter đã nạp (`document.fonts.check` = true), 1440 tối · 375 sáng. Vai: GV Speaking = Phạm Thu Trang (9) · GVCN + GV L/R = Trần Ngọc Hà (7) · QL = 2. Ca "Đã huỷ" lớp thường dựng bằng tay trong DB demo: bài 28 (Bùi Khánh Linh, Progress FOU 12) môn P `cancelled` cho cả hai bên.

| Ảnh | Màn · vai | Thấy gì |
|---|---|---|
| `cap-1-mock-gv-1440.png` | Hồ sơ Mock 171 · GV S · ⋯ Speaking | Vắng · Huỷ điểm (đã có từ PR-1 qua menu chung) — hình không đổi |
| `cap-2-mock-ql-1440.png` | Hồ sơ Mock 171 · QL · ⋯ Listening (có điểm) | Dời lịch · Huỷ điểm — không đổi |
| `cap-3-mock-da-huy-gv-1440.png` | Hồ sơ Mock 151 · GVCN · L huỷ vắng 2 lần | ⋯ Khôi phục — không đổi |
| `14-sau-huy-diem-mock-1440.png` (chỉ SAU) | Mock 171 · GV S · sau ⋯ › Huỷ điểm | **Một bấm, không hộp**: dòng S "Đã huỷ" (không "vắng"), toast "Đã huỷ Speaking · … · Hoàn tác (8)" |
| `cap-4-mock-hop-nhap-375.png`, `cap-5-mock-menu-375.png` | Mock 375 · GV S | Hộp nhập / ⋯ — không đổi hình |
| `cap-6-luot-thuong-gv-1440.png` | Bài lớp thường 28 · GVCN · ⋯ Listening | Không đổi hình; Huỷ điểm nay một bấm + Hoàn tác (trước: mở hộp lý do rồi chỉ xoá ô) |
| `cap-7-luoi-thuong-gv-1440.png` | Lưới lớp thường · GVCN · ⋯ L | Không đổi hình |
| `cap-8-luoi-thuong-ql-1440.png` | Lưới lớp thường · QL · ⋯ P "Đã huỷ" | **TRƯỚC**: ô P chỉ chữ "Đã huỷ", không ô nhập · **SAU**: ô nhập + dòng mờ "Đã huỷ" dưới ô; ⋯ Khôi phục |
| `cap-11-luoi-thuong-gv-p-da-huy-1440.png` | Lưới · GV P · ⋯ P "Đã huỷ" | như trên, ở góc GV môn |
| `cap-12-luoi-thuong-sua-o-co-diem-1440.png` | Lưới · GV L · bấm ô L 27, gõ 29 | **TRƯỚC**: hộp nổi "Sửa Listening · Lý do sửa (tuỳ chọn) · Đóng / Lưu · đóng" · **SAU**: sửa ngay tại ô (vào ô chọn cả số, gõ là thay; Enter lưu, Esc huỷ) |
| `cap-9-luoi-thuong-gv-375.png`, `cap-10-luoi-thuong-ql-375.png`, `cap-13-luoi-thuong-gv-p-375.png` | Lưới 375 · GV / QL / GV P | **TRƯỚC**: không có ⋯; ô có điểm không có nút Vắng; ô "Đã huỷ" chỉ chữ · **SAU**: ⋯ mỗi em; nút Vắng cả ở ô có điểm; ô "Đã huỷ" có ô nhập |

## 1. Truy vết đặc tả → thành phần → ảnh

| # | Đặc tả | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | 5.1 Huỷ điểm một bấm, không hộp xác nhận, toast "Đã huỷ {kỹ năng} · Hoàn tác" 10 giây | `cham/huyDiem.ts` `guiHuyDiem` (thay `huyTay.ts`) — hồ sơ Mock, hộp một đợt (`HopKyNang`), lưới + 375, trang bài lớp thường | 14 | KHỚP |
| 2 | 5.2 Khôi phục từ ⋯ (một bấm; ô đã có điểm mới → máy chủ hỏi) | cùng hàm `huy: false`; hộp nhập Mock "Khôi phục" (`khoiPhuc`) gọi `/huy-diem {huy:false}` | 3, 8, 11 | KHỚP |
| 3 | 5.5 Hộp nhập ở chế độ vắng vẫn có ô điểm | `HopNhapDiem` (đã có từ trước, giữ) | 4 | GIỮ |
| 4 | 5.5 Gõ "-" đè điểm: cất điểm, ghi vắng, toast Hoàn tác thay hộp hỏi | máy chủ trả `daCat`; `useSaveScore` / `useLuuThuong` / `HopThaoTacMt` → Hoàn tác = Khôi phục (điểm về + bỏ vắng) | (bấm thử) | KHỚP |
| 5 | 5.5 Lớp thường dùng chung cách nhập với Mock: ô vắng / huỷ có ô nhập | `LuoiThuong` (`dung && canEdit` → ô nhập + dòng trạng thái mờ, `aria-describedby`), `MotKyNang` | 8, 11, 13 | KHỚP |
| 6 | 5.5 Sửa điểm tại chỗ (bỏ hộp `SuaDiemCoLyDo`) | `ODiemThuong`: một kiểu ô cho có / chưa có điểm; bỏ `SuaDiemCoLyDo` | 12 | KHỚP |
| 7 | 5.5 Ô có điểm nhận "-" | `ODiemThuong` commit + nút Vắng 375 không còn ẩn ở ô có điểm | 9 | KHỚP |
| 8 | 5.5 375 có ⋯ | `useMenuOThuong` (tách từ `DongThuong`, dùng chung lưới + `MotKyNang`) | 9, 10, 13 | KHỚP |
| 9 | 5.5 GV môn có ⋯ "Vắng" ở Mock | `MockDetailPage` lọc menu GV: + `bao-vang` (máy chủ PR-1 cho người nhập được ô) | 1 | KHỚP |
| 10 | 5.5 Ô chỉ đọc nói đúng lý do | `lyDoChiDoc`: kỹ năng ngoài đợt → "Không có trong đợt này", còn lại "Bạn không được phân công kỹ năng này" | — | KHỚP (một phần — xem KHÁC 2) |
| 11 | 5.5 Bỏ ⋯ "Nhập điểm" mở hộp rỗng (lớp thường) | `thaoTacKyNang` PR-1 (giữ) | 7 | KHỚP |
| 12 | 5.6 Ô "Đã huỷ": chữ "Đã huỷ" mờ (không ⚠, V22) | Mock: Huỷ tay ghi `huy_vang = 2` → chữ "Đã huỷ" (không "vắng n lần" / "QL từ chối dời"); lớp thường: dòng mờ dưới ô | 14, 8 | KHỚP |
| 13 | 5.6 Hướng dẫn "?" GV, QL | `huongDan/gv.ts` (dau-gach, sua-diem), `ql.ts` (ql-sua-diem), ⓘ quy chế (`quyCheVanHanh`) | — | KHỚP |
| 14 | PTA 14/11: nút Vắng trên kỹ năng có điểm → không hỏi, Hoàn tác | máy chủ `baoVang` bỏ `canXacNhan`, trả `daCat`; `HopThaoTacMt` Hoàn tác = Khôi phục | (bấm thử) | KHỚP |
| 15 | PTA 14/11: giữ "Xoá" ở hộp lập lịch một đợt | `HopKyNang` nút Xoá (không đổi) | — | GIỮ |
| 16 | Xoá trống ô có điểm + Lưu (5.4) — rà guidelines: phải có Hoàn tác | toast "Đã xoá {môn} · Hoàn tác" (= Khôi phục bản cất) | (bấm thử) | THÊM |

## 2. Bảng thao tác TRƯỚC → SAU

| Thao tác | TRƯỚC (main) | SAU (PR) | Lý do |
|---|---|---|---|
| ⋯ › Huỷ điểm (Mock, MT0, lớp thường, hộp một đợt) | mở panel "Huỷ điểm · {môn}" (Writing chọn W1 / W2, ô lý do) → Lưu; lớp thường chỉ xoá ô | **một bấm** → "Đã huỷ" + toast Hoàn tác 10 s; lý do bỏ (lịch sử vẫn ghi ai · lúc) | đặc tả 5.1 "không hộp xác nhận"; 6b Writing = cả kỹ năng |
| ⋯ › Huỷ môn / Khôi phục (lớp thường, LG-9) | hai mục riêng, chỉ khi đang vắng | **bỏ** — gộp vào Huỷ điểm / Khôi phục (mọi lúc) | một khái niệm một tên (5.1) |
| ⋯ › Khôi phục điểm | chữ "Khôi phục điểm", trả điểm (`/khoi-phuc-diem`) | chữ "Khôi phục", một đường `/huy-diem {huy:false}` (trả cả trạng thái + điểm) | 5.2 |
| Sửa ô lớp thường đã có điểm | bấm / gõ số → hộp nổi (giá trị mới + lý do tuỳ chọn) → Lưu · đóng | **sửa ngay tại ô**: vào ô chọn cả số, gõ là thay, Enter / Tab lưu, Esc huỷ | 5.5 "bỏ SuaDiemCoLyDo, lý do tuỳ chọn" — lý do sửa **BỎ** ở ô (xem KHÁC 1) |
| Xoá trống ô lớp thường đã có điểm | trong hộp sửa, "huỷ điểm" | xoá trống + Enter → xoá, **toast Hoàn tác** | 5.4 + rà guidelines |
| Gõ "-" vào ô lớp thường đã có điểm | báo lỗi "Ô đã có điểm không nhận dấu '-'" | cất điểm + vắng, toast Hoàn tác (= Khôi phục) | 5.5 |
| Gõ "-" trước tuần Test (lớp thường) | toast "Chưa tới tuần Test — chưa ghi '-' được" | ghi "-" cho đúng tuần Test (máy chủ PR-1: báo trước, dời tuần sau tuần Test) | PTA 14/11 (PR-1) |
| Ô lớp thường vắng / "Đã huỷ" (người nhập được) | chỉ chữ "Đã vắng · chờ xếp lại" / "Đã huỷ" | ô nhập + chữ trạng thái mờ dưới ô (gõ điểm = bỏ huỷ / đã làm bài) | 5.5 |
| Lưới lớp thường 375 | không có ⋯ | ⋯ mỗi em (Vắng · Huỷ điểm / Khôi phục · Dời lịch (QL) · Lịch sử) | 5.5 |
| Nút Vắng 375 ở ô có điểm | ẩn | hiện (cất điểm + vắng, Hoàn tác) | 5.5 "ô có điểm nhận '-'" |
| ⋯ Mock của GV môn | trang lọc chỉ còn Huỷ điểm · Khôi phục khi người xem không xếp lịch được (ảnh 1: GV S đã thấy Vắng vì là người được dời lịch kỹ năng mình) | mọi GV nhập được ô thấy Vắng · Huỷ điểm · Khôi phục | 5.5 |
| Nút Vắng (panel) trên kỹ năng có điểm | 409 hỏi "huỷ điểm rồi báo vắng?" | không hỏi; toast Hoàn tác = Khôi phục | PTA 14/11 |
| Vắng (panel) lớp thường | toast không Hoàn tác | toast Hoàn tác (= gỡ "-") như gõ "-" ở lưới | rà guidelines (thống nhất) |
| Chữ trạng thái Mock sau Huỷ điểm tay | (PR-1 lỡ) "Đã huỷ · vắng 1 lần" | "Đã huỷ" | `huy_vang = 2` cho huỷ tay |
| Hộp "Khôi phục và đặt tuần" (lớp thường, dữ liệu "đã huỷ" cũ) | ⋯ › mở hộp chọn tuần | **bỏ** — "Khôi phục" một bấm về đúng tuần; muốn đổi tuần thì Dời lịch (QL) | một khái niệm một tên; menu PR-1 đã thôi sinh mục này (mã chết) |

Không thao tác nào mất mà không có lý do ở cột phải.

## 3. KHÁC / [XM]

1. **Lý do sửa điểm (lớp thường) bỏ ở ô.** Đặc tả 5.5 ghi "lý do tuỳ chọn ở ⋯ nếu cần" — PR không thêm mục ⋯ "Sửa có lý do" (YAGNI: lý do vốn tuỳ chọn, lịch sử ô vẫn ghi ai · lúc · trước → sau). Cần lại thì một mục ⋯ mở hộp lý do cũ. **[XM] PTA quyết** có cần không.
2. **Lý do ô chỉ đọc** chỉ tách "Không có trong đợt này" / "Bạn không được phân công kỹ năng này". "Lượt đã huỷ" chưa tách ở ô (ô của lượt đã huỷ đã có dòng trạng thái lượt ở đầu trang) — [XM] nếu PTA muốn ghi riêng.
3. Hộp nhập Mock ⋯ (trong hộp) giữ: Lưu · đóng · Khôi phục · Bỏ vắng — không thêm "Huỷ điểm" trong hộp (Huỷ điểm ở ⋯ dòng kỹ năng).

## 4. Đo ✕ / ⋯ (≤ 1 px)

| Chỗ | Đo (tâm dọc, px) | Lệch |
|---|---|---|
| Lưới lớp thường 375 (5 dòng, cả dòng "Đã huỷ"): ô nhập · Vắng · Nhận xét · ⋯ | 519,8 · 519,8 · 519,8 · 519,8 (dòng 1) … | **0** (trước khi sửa: Nhận xét + ⋯ lệch 7–8 px — căn lại bằng `self-start min-h-11`) |
| Lưới lớp thường 1440 cột P (5 dòng, cả ô "Đã huỷ"): ô nhập · ⋯ · Nhận xét | 367,6 · 367,9 · 368,3 … | ≤ 0,7 |
| Vùng chạm ⋯ ở điện thoại | 28 px + `after:-inset-[9px]` = 46 px | ≥ 44 ✓ |
