# V8-PT — Phân tích 6 tab theo mockup v8 (`thiet-ke/v8/phan-tich.html` + `phan-tich-ghi-chu.md`, chủ SP duyệt 29/10 #688)

Loại PR: **đổi bố cục một màn** (Phân tích, 6 tab). Kế hoạch: `docs/superpowers/plans/2026-10-29-v8-trien-khai.md` (V8-PT). HÌNH theo v8 sát; TÍNH NĂNG giữ đủ.
Câu hỏi ghi chú mockup chưa trả lời → làm như mockup vẽ (tên tab "Kết quả Test" giữ; số trong chip Đạt / SOS không gạch; thẻ chỉ số + dòng Tổng giữ cả hai; "⚠ quá hạn" / "Quá hạn" giữ như web).
Không đổi máy chủ, không đổi luật.

## Phần chung (`PhanTich.tsx`, `dungChung.tsx`, `ChonChuongTrinh`, `BoChonThoiGian`, `ONgay nutTrong`, `PhanTichPage`)
| Khung | Thành phần | KHỚP / KHÁC |
|---|---|---|
| MỘT hàng lọc, ô cao 36 chữ 14: [chương trình / Mock Test · Thi thật] · [Toàn bộ · Chọn khoảng tuần] · tuần → tuần (lịch trong ô) · Mọi lớp ▾ · ô riêng tab · (phải) Xuất / In / ⋯ | `DOAN`/`doanNut`, `OChon`, `ONgay nutTrong`, ba khe `VaoHangLoc` (`dau` · `giua` · `phai`) | KHỚP |
| Thẻ chỉ số đầu tab (tên · "trong kỳ" mờ · số 28 / 700 · dòng mẫu 12) | `DaiChiSo` | KHỚP |
| Thẻ bảng có tiêu đề thật + chip đếm + ⓘ Cách tính (ⓘ ra khỏi `th`, bỏ chú giải màu) | `DauThe` | KHỚP |
| Đầu trang 22 / 700 + "Dữ liệu đến" 13 mờ | `PhanTichPage` | KHỚP |
| 375: ô đoạn / thời gian hết hàng, ô chọn hai cột, thẻ chỉ số hai cột | lớp `max-sm:` | KHỚP · KHÁC nhỏ: ⋯ / Xuất đứng hàng riêng cuối hàng lọc (mockup đặt ⋯ cạnh Fast Track) |

## Truy vết từng tab (ảnh `cap-*.png` = mockup | web)
| Tab | Khung | KHỚP | KHÁC (lý do) |
|---|---|---|---|
| Test + SOS | A1, A2, C1/C1b, D1–D3 → `cap-a1-test-sos-1440-toi`, `cap-c1-test-sos-375-sang` | 5 thẻ chỉ số (Lượt MT · Đạt % · SOS chip · Thiếu điểm · Chưa chốt PA ⚠) cùng số dòng Tổng, bấm mở panel `khoa=tong`; "Theo tuần ▾" lên hàng lọc; Xuất Excel + ⋯ (Cột hiện, Xuất từng lượt) cuối hàng; đầu thẻ "Theo tuần · 2 tuần"; số trong chip không gạch, 0 xám; 375 thẻ mỗi tuần; rỗng "Chưa có lượt nào có điểm · trong …" + **Xem Toàn bộ** | "16 HV" ở thẻ Lượt MT (máy chủ không trả số HV duy nhất); lớp thường 3 thẻ (khung không có Đạt / SOS — luật D8); hàng lớn 40 px (CSS chung `.hang-lon`) |
| Kết quả Test | A3, A4, C2 → `cap-a3-ket-qua-mock-1440-toi`, `cap-c2-ket-qua-375-sang` | Mock Test \| Thi thật thành ô đoạn đầu hàng lọc; "Theo lớp ▾", "Mọi kết quả ▾" (số trong mục); Xuất Excel · n lượt cuối hàng (thêm cho Thi thật cùng kiểu); thẻ chỉ số Mock + Thi thật; badge ✓ Đạt / ✗ Chưa đạt / – Chưa đủ điểm; "Case / PA" + "Việc tiếp" gộp cột **Xử lý** (dòng phụ "tiếp: … · người" chữ thường, không link, không quá hạn); MT · tuần chữ thường; phân trang chỉ dưới; 375 thẻ mỗi lượt | % Đạt / Chưa đạt chia (Đạt + Chưa đạt) theo luật `ketQuaThi.ts` "Chưa đủ điểm không vào tỷ lệ" (mockup chia tổng lượt) — luật thắng mockup; số thẻ chưa bấm được (chưa có đường danh sách máy chủ); demo không có lượt thi thật nên bảng Thi thật chỉ thấy rỗng |
| Hiệu quả PA | A5, C3 → `cap-a5-hieu-qua-pa-1440-toi`, `cap-c3-hieu-qua-pa-375-sang` | thẻ chỉ số PA có KQ · Có cải thiện % · **Chưa tính** (3 số "đủ tin" cũ, vẫn bấm mở panel); chip "GV: … ✕" lên hàng lọc, bỏ dòng ngữ cảnh trùng; hai thẻ bảng cùng lưới cột + ⓘ; nhóm mở sẵn khi đủ dữ liệu, dòng nhóm 14 / 700, "vấn đề khác" gập; quy chế dòng phẳng có chip SOS; 375 ≤ 4 cột, phụ dòng mang thời gian + Nên dùng | **thiếu thẻ "Thời gian thường mất"** (máy chủ chỉ trả trung vị từng dòng — cần trường mới, để PTA quyết); dòng quy chế phẳng không còn số tổng theo mức SOS; dòng "n vấn đề khác" không có số (không cộng được HV khác nhau) |
| Ý thức | B3 → `cap-b3-y-thuc-1440-toi` | 4 thẻ chỉ số (HV cần chú ý · Vi phạm · Chưa xử lý · Lớp có vi phạm — cộng từ bảng Lớp); Xuất Excel cuối hàng; đầu thẻ + ⓘ; "Quá hạn" giữ | thẻ Vi phạm không có "↑ n so kỳ trước" (bảng chỉ có lớp có vi phạm, tổng ± sẽ thiếu); 375 bảng vẫn cuộn ngang (mockup không vẽ 375 tab này) |
| Báo cáo HV | B1 → `cap-b1-bao-cao-1440-toi` | `DaiChiSo` (cùng số), nhãn "tên · trong kỳ" không lặp khoảng tuần; hai thẻ bảng `DauThe`; In cuối hàng | giữ ⓘ luật ở Đạt MT / PA cải thiện (giải thích sẵn có) |
| Phân tích GV | B2 → `cap-b2-phan-tich-gv-1440-toi` | Gọn \| Đầy đủ + Tìm GV lên hàng lọc; "n GV · xếp theo tên" cuối phải; thẻ "Giáo viên" + chip + ⓘ; đầu nhóm phẳng (bỏ dải xanh / hồng `.bang-gv` — CSS đã xoá); một kiểu gạch chân; dòng phụ chỉ "n/m"; phân trang chỉ dưới | dòng phụ (n HV, %) vẫn dưới số (`Bang` dùng chung) |

## Thao tác TRƯỚC → SAU (không mất thao tác)
| Thao tác | Trước | Sau |
|---|---|---|
| Đổi tab · chi nhánh | hàng tab · đầu trang | như cũ |
| FT / Lớp thường · Toàn bộ / Chọn khoảng tuần · 2 ô tuần · Mọi lớp | hàng lọc (cao lệch nhau) | như cũ, cùng cao 36 |
| Xếp theo (Test + SOS, Kết quả Test) | dải đầu thẻ | ô chọn trên hàng lọc |
| Cột hiện · Xuất bảng này · Xuất kết quả từng lượt (Test + SOS) | ⋯ đầu thẻ | Xuất Excel nút riêng (375: trong ⋯) + ⋯ cuối hàng lọc |
| Chú giải màu Đạt / SOS · ⓘ nhóm Xử lý trong `th` | dải đầu thẻ · `th` | ⓘ Cách tính đầu thẻ (bỏ trùng) |
| Mở / gập tuần → lớp · vấn đề → loại PA · lớp (Ý thức) | ▸ ▾ | như cũ (375 Test + SOS: nút "n lớp ▾" trên thẻ) |
| Bấm số → panel | OSo | như cũ + chip SOS ở thẻ chỉ số Test + SOS bấm được |
| Mock Test / Thi thật | tab con riêng | ô đoạn đầu hàng lọc |
| Lọc kết quả Tất cả · Đạt · Chưa đạt · Chưa đủ điểm | nút đoạn | "Mọi kết quả ▾" |
| Xuất Excel (Kết quả Test, Ý thức) · In (Báo cáo HV) | rải rác | cuối phải hàng lọc; thêm Xuất Thi thật |
| Phân trang · Mỗi trang 10 / 20 / 50 | trên + dưới | chỉ dưới |
| Hồ sơ HV (tên) · Hồ sơ HV › · MT · tuần mở MT · trạng thái Case mở Case | link | như cũ (chữ thường, rê mới gạch) |
| Lọc GV từ link · bỏ ✕ | dòng ngữ cảnh | chip "GV: … ✕" trên hàng lọc |
| Gọn / Đầy đủ · Tìm GV | hàng riêng | hàng lọc |
| Xem Toàn bộ khi rỗng | không | Test + SOS có nút (tab khác giữ câu rỗng cũ — để sau) |

## Kiểm
- `npm run typecheck`, `kiem-esbuild` sạch. Phép kiểm `prHk1` H5 cập nhật (chú giải màu đã bỏ theo mockup → kiểm không còn + có ⓘ Cách tính).
- Thử: bấm chip "SOS 2 · 3" ở thẻ chỉ số → panel "SOS 2 · Tổng" đúng 3 dòng; ⓘ Cách tính, ⋯, Theo lớp, Xem Toàn bộ khi rỗng.

## Để sau (ghi backlog)
Thẻ "Thời gian thường mất" (cần máy chủ) · số thẻ chỉ số Kết quả Test / Hiệu quả PA / Ý thức bấm được (cần đường danh sách) · "16 HV" Test + SOS · Xem Toàn bộ khi rỗng ở 4 tab còn lại · ⋯ cạnh ô đoạn ở 375 · thẻ 375 cho Ý thức.
