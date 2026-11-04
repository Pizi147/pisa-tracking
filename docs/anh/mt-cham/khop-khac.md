# PR-MT-CHAM (N39) — chấm Mock theo tuần + lớp

Đặc tả: `docs/superpowers/specs/2026-11-04-luat-mt-thong-nhat-design.md` mục 4, 5.4, 7. Không đổi bố cục (không mockup mới) — sửa nhãn + nguồn dữ liệu panel.

Tình huống chụp (demo, QL Monbay): Công việc › Tất cả › Speaking chấm chéo › "Cả lớp MB FT 101 · Nhập điểm" › dòng con W1 JUL (2 bài).

| | Trước | Sau |
|---|---|---|
| Dòng con 1440 tối | `truoc-1440-1-danh-sach.png` — "Speaking · MT1 W1 JUL", "MT2, MT3 W2 SEP" | `sau-1440-1-danh-sach.png` — "Speaking · W1 JUL · 2 bài" |
| Panel 1440 tối | `truoc-1440-2-panel.png` — "Nhập điểm Speaking", **cả lớp** (≈ 20 em) | `sau-1440-2-panel.png` — "Nhập điểm · W1 JUL", **2 em có bài** |
| 375 sáng | `truoc-375-*.png` | `sau-375-*.png` |

## Thay đổi

| # | Chỗ | Trước | Sau |
|---|---|---|---|
| 1 | Nhãn dòng việc chấm Mock (`mywork.ts` `contextLabel`) | `MT1, MT4 W3 OCT` | `W3 OCT` (Progress / Final / Checkpoint giữ tên bài) |
| 2 | Panel từ việc Speaking chấm chéo | `PanelNhapDiem` theo đợt MT (`/diem-theo-luot/mt:n`) — 2 em trở lên thì hiện cả lớp | `PanelNhapDiemTuan` theo tuần + lớp (`/classes/:id/cham?periodId`) như việc chấm khác |
| 3 | Hàng trong panel tuần (việc Mock) | em còn thiếu của việc | em có bài tuần đó ở cột của việc: chờ điểm **hoặc đã có điểm** (sửa được) — `attemptCoBaiTuan` |
| 4 | Cách gom việc | lớp + tuần thi + người | giữ nguyên |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Bấm dòng việc chấm → nhập điểm tại chỗ | có | có |
| "Cả lớp" | có | có (không mặc định) |
| Chọn GV chấm S | có | có |
| "Mở lưới đầy đủ ›" | không ở panel chấm chéo | có (panel tuần sẵn có) |
| "Việc tiếp ›" | có | có |
| Link "lớp · lượt" đầu panel (chấm chéo) | có | thay bằng hàng lớp mở / gập của panel tuần |

Không thêm nút / bước.

## Turso

Mở panel: `/classes/:id/cham` đo 12 câu (tocDo) — thay `/classes/:id/diem-theo-luot/mt:n` 18 câu. Đọc một lớp × một tuần thay vì cả đợt cả lớp. Không thêm đường.
