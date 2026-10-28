# RA-UI-3 — Lịch Test: hộp hỏi chung thay `window.confirm` · dọn CSS "↗" chết

Loại PR: **sửa nhỏ** (không đổi bố cục, không đổi thao tác). Nguồn: `docs/superpowers/specs/2026-10-29-ra-soat-dem/ra-ui.md` mục 2 "Ngoài phạm vi — RA-UI làm luôn".

## Sửa
| # | Chỗ | Trước | Sau |
|---|---|---|---|
| 1 | Lịch Test › thu khối (Quá hạn chấm / Test tuần này) khi còn ô chưa lưu | hộp gốc trình duyệt `window.confirm` (OK / Cancel, chữ hệ điều hành, khác mọi hộp khác của web) | `ConfirmDialog` chung: tiêu đề "Thu khối này?", câu cũ giữ nguyên, nút **Ở lại** · **Bỏ, thu khối** (đỏ) |
| 2 | Lịch Test › đóng lưới một dòng Quá hạn chấm khi còn ô chưa lưu | `window.confirm` | `ConfirmDialog`: "Đóng lưới này?" · **Ở lại** · **Bỏ, đóng lưới** |
| 3 | `web/src/index.css` | 10 dòng CSS "↗" sau `.ten-ho-so` + 2 lớp đè `content: none` (BO-MUI-TEN) | bỏ cả cặp — kết quả hiển thị như nhau (không "↗"), không còn luật chết |

Bản EN: 4 chữ mới ở `shared/i18n/en/b.ts` (cạnh câu cũ).

## Thao tác TRƯỚC → SAU
| Thao tác | TRƯỚC | SAU |
|---|---|---|
| Thu khối / đóng lưới còn ô chưa lưu | hỏi → OK = bỏ ô, Cancel = ở lại | hỏi → **Bỏ, …** = bỏ ô, **Ở lại** / Esc / ✕ / nền = ở lại |
| Không còn ô chưa lưu | thu / đóng ngay | như cũ |

## Đã xét, giữ nguyên (mockup đã duyệt có)
- Câu phụ dưới h1 Quản trị ("Tài khoản, danh mục và cấu hình quyền…", "Quản trị hệ thống sửa; Quản lý xem.") — có trong `v7/bang-quy-doi-band.html`.
- Dải "👁 Đang xem việc của … — chế độ theo dõi." ở Công việc — có trong `v7/cong-viec-2.html`.
- Câu gợi ý ở trạng thái rỗng (nói cái gì sẽ hiện ở đây) — giữ: giúp người mới, không phải giải thích luật (V6).

## Chưa kiểm
- **Chưa bấm thử được hộp hỏi bằng script** (cần ô "chưa lưu" — demo lưu ngay khi rời ô). Logic thay 1:1 (`if (n > 0 && !confirm) return; làm` → `if (n > 0) { hỏi; return } làm`); typecheck đạt. Thử tay: Lịch Test › mở một lớp › gõ điểm, chưa rời ô › bấm thu "Test tuần này".
