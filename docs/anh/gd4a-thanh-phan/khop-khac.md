# GD-4a — Thành phần chung: dòng việc (ô vuông + vạch hạn) · nút-chip · menu "+ Task" + chọn em · nút Ý thức · thang WL nổi

Plan: `docs/superpowers/specs/2026-11-13-overhaul-v6/09-plan-giao-dien-dot-2.md` dòng GD-4, ý **(a) (b) (d) (f)**. Ý (c) 83 câu dòng quy chế = GD-4b; ý (e) một dáng tab / menu / dải / lịch sử = GD-4c.
Mockup ⑤ `thiet-ke/v21/bang-mau.html` khu B, C, F (lời 27 duyệt) · mockup ③ `ho-so-hv.html` K4a (lời 28). Thứ tự thắng: lời 24, 28, 33 (`04-thiet-ke.md` mục 15) → `04-thiet-ke.md` 12–14 → ⑤ → ③.

Ảnh cặp (trái mockup · phải web; seed demo 14/09, vai 7 GVCN; 1440 tối, 375 sáng; phông Be Vietnam Pro đã nạp — `document.fonts.check` = true):

| Ảnh | Mockup | Web |
|---|---|---|
| `cap-1440-case.png` | ⑤ B1 | Công việc › Case học thuật |
| `cap-375-cong-viec.png` | ⑤ B2 | Công việc 375 |
| `cap-1440-task-menu.png` | ⑤ F1 | Công việc, menu "+ Task" mở |
| `cap-1440-task-chon-em.png` | ⑤ F2 | "+ Task" › Vi phạm / Nhắc nhở, gõ "tran" |
| `cap-375-task-menu.png` | ⑤ F4 | Công việc 375, nút tròn "+ Task" → menu neo đáy |
| `cap-1440-y-thuc-hv.png` | ③ K4a | hồ sơ HV › Ý thức & Phối hợp, "Thang" mở |
| `cap-1440-tab-cham-speaking.png` | ⑤ H1 (badge `.bd.mo`) | Công việc › Chấm Speaking, vai 9 GV Speaking |

Chụp bằng `scripts/anh-cap.mjs` (PR này thêm: `BAM` bấm được mục menu và `gõ:chữ`; `KEO_TRUOC=1` kéo dài khung nhìn trước khi bấm — menu thả đóng khi đổi cỡ màn).

## 1. Truy vết khung → thành phần → ảnh

| # | Khung | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | ⑤ B1/B2 ô vuông 28 px biểu tượng đầu mọi dòng việc (`.av.vuong`) | `AvViec` trong `DongViec` · `DongLop` · `DongGon` (em trong khay "n em ▾" không có — như mockup) | case, 375-cong-viec | KHỚP |
| 2 | ⑤ B1 biểu tượng theo loại: lớp / gộp / một em = ô bảng · Chấm Speaking = micro · Báo cáo PH = tờ giấy | `icDong()` | case | KHỚP |
| 3 | ⑤ B1/B2 vạch hạn trong mục: Quá hạn · Hôm nay · Hạn đến {CN} · Hạn sau {CN} · Không hạn | `DanhSachViec` — vạch khi mục có ≥ 2 nhóm hạn hoặc có việc không hạn; việc không hạn để TRỐNG cột hạn (vạch nói thay; `sr-only` cho trình đọc màn hình) — `10-ra-dong-bo.md` mục B | case (Mô tả Case, Phương án), 375-cong-viec | KHỚP |
| 4 | ⑤ B1 (a) dòng "Lớp · tên việc", tên em là thẻ phụ — lời 24 | đã có (#1584), giữ một thành phần | case | KHỚP |
| 5 | ⑤ C (b) nút-chip "Việc cần làm" không biểu tượng, thứ tự Nhập điểm · Case · Ý thức · Vận hành | đã có (#1566) `LopCuaToi` | task-menu (cột phải) | KHỚP |
| 6 | ⑤ F1 (d) menu "+ Task" 3 mục Case · Vi phạm / Nhắc nhở · Tình hình học tập, có biểu tượng ([XM-7]) | `MenuDong` thêm `bieuTuong` mỗi mục; `NutTask` (cờ · khiên · bóng lời) | task-menu | KHỚP |
| 7 | ⑤ F2 (d) chọn em: nhóm theo lớp có nhãn + số ("· chủ nhiệm"), tô chữ khớp, tên + lớp dòng phụ | `HopChonEm` (`NutTask.tsx`) nhóm Lớp này → lớp của tôi → Lớp khác; `ToKhop` | task-chon-em | KHỚP |
| 8 | ⑤ F3 (d) Tình hình chọn nhiều ≤ 8, chip ✕, "n / 8", chân "Đóng · Tiếp" (`10-ra-dong-bo.md` B: một chân) | đã có (GD-1) + thêm "Đóng" ở chân | — (đã chụp ở GD-1) | KHỚP |
| 9 | ⑤ F4 (d) 375 nút tròn → menu neo đáy, tiêu đề "+ Task", mục cao 48, nền mờ | `MenuDong` thêm `tieuDeDay` (< 640 px) | 375-task-menu | KHỚP |
| 10 | ⑤ F mục 2 (d) mở từ hồ sơ lớp: nhóm "Lớp này" lên đầu · hồ sơ HV: em điền sẵn, bỏ bước chọn | `NutTask` nhận `lopId`, `em` — đặt nút ở hai hồ sơ là GD-6 / GD-7 (một màn một PR) | — | KHỚP (mã) |
| 11 | Lời 28 ý 1 (f): "Không cần theo dõi" là NÚT mờ | `NUT_MO` (`ui/KhuonViec.tsx`) ở `CasePanel` + form Xác nhận PA (`CaseSosControls`) | — (seed vai 7 không có Case SOS chờ — kiểm mã) | KHỚP (mã) |
| 12 | Lời 28 ý 2 (f): "Xác nhận xử lý" là NÚT | hồ sơ HV (ô bước + dòng vi phạm) · tab Ý thức lớp (ô bước + dòng) · panel Xem vi phạm (chân) | y-thuc-hv | KHỚP |
| 13 | Lời 28 ý 3 / ③ `.vach-bac b.wl` (f): WL 1, WL 2 nhãn đỏ nổi trên thanh (đã tới: đỏ đặc) | thang mini hồ sơ HV (`StudentYThucSection`) | y-thuc-hv | KHỚP |
| 14 | (f) "mọi nơi hiện thang" | thang đầy đủ `ThangYThuc` (hồ sơ HV "Thang ▾", chip mốc tab lớp, panel Xử lý) — chip WL đỏ | y-thuc-hv | KHỚP |
| 15a | Lời 33 / `04-thiet-ke.md` mục 15 (thắng hình ①, ⑤ H1 badge vàng / đỏ): badge tab "Chấm Speaking" MỜ đếm bài + ⚠ khi có bài quá hạn; không đỏ, không cộng badge menu / chuông | `BadgeTabSo` nhánh `bai` (`ui/Nhan.tsx`), `BadgeTab.bai` (`shared/domain/tongQuan.ts`), tính ở `HoTroHocVienTab` (cùng số đầu mục "22 bài · ⚠ 15 quá hạn"); badge menu / chuông vẫn `demDongViec` (không đếm chấm chéo) | tab-cham-speaking | KHỚP |
| 15 | ⑤ B tên khung: dòng chuẩn ở "dải Việc cần làm hồ sơ lớp, thanh việc hồ sơ HV" | GIỮ ô việc hiện tại ở hai hồ sơ — đổi sang dòng chuẩn ở GD-6 / GD-7 (plan ghi rõ "dùng dòng việc chuẩn" trong dòng GD-7; một màn một PR) | — | GIỮ (chuyển GD-6/7) |
| 16 | Chuông (a "một thành phần cho … chuông") | GIỮ dáng chuông v2 — [XM-1] ⑤ đã chốt: không dùng dòng việc chuẩn; đổi đích bấm ở GD-9 | — | GIỮ (theo [XM-1]) |

**KHỚP 15 / 15 dòng thuộc PR = 100 %** (dòng 15, 16 là GIỮ có lý do, không tính).

## 2. KHÁC (có lý do)
- ~~KHÁC-1~~ (bỏ): "Không hạn" nay theo ⑤ B1 + `10-ra-dong-bo.md` mục B — cột hạn trống, vạch nhóm "Không hạn" kể cả khi mục chỉ có một nhóm.
- **KHÁC-2** Thang mini hồ sơ HV giữ 6 bậc mạch chính (Report 1 … WL 2); mockup ③ vẽ 7. Bậc sau WL 2 tăng mãi — thang đầy đủ ở "Thang ▾".
- **KHÁC-3** Đầu mục trong tab Công việc (Mô tả Case, Phương án…) không có biểu tượng như dải hạng mục ⑤ B1 (Mock Test, Case học thuật…): ⑤ B1 vẽ dải theo HẠNG MỤC, web đã tách hạng mục thành tab (biểu tượng ở tab không cần) — mục trong tab là nhóm con.
- **KHÁC-4** Ô gõ trong hộp chọn em chưa có kính lúp + ✕ của ô chọn có tìm (⑤ A): ô chọn chung là GD-5 (thay cả hộp này — ghi `ponytail:` ở `HopChonEm`).
- **KHÁC-5** Mockup F4 chỉ vẽ tối; web 375 chụp sáng (luật ảnh cặp). Cùng bố cục.

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| "+ Task" › chọn mục | menu 3 mục chữ | menu 3 mục có biểu tượng; 375 menu neo đáy | ĐỔI dáng (⑤ F1, F4) |
| Gõ tên em, ↑ ↓ Enter, chọn | danh sách phẳng, em lớp tôi lên trước | nhóm theo lớp có nhãn + số, tô chữ khớp; ↑ ↓ đi theo thứ tự vẽ | ĐỔI dáng (⑤ F2) |
| Tình hình: chọn nhiều ≤ 8, ✕ chip, Tiếp | có | có | GIỮ |
| Không cần theo dõi… (Case SOS, form Xác nhận PA) | chữ link | nút mờ | ĐỔI dáng (lời 28) |
| Xác nhận xử lý (ô bước, dòng vi phạm, panel Xem vi phạm) | chữ link | nút viền | ĐỔI dáng (lời 28) |
| Đọc mốc WL trên thang | vạch / chip như Report | nhãn đỏ WL 1 / WL 2 | ĐỔI dáng (lời 28) |
| Đọc badge tab Chấm Speaking | không có badge (bài chung không đếm) | viên mờ "⚠ 22" (số bài, ⚠ khi có bài quá hạn) | THÊM (lời 33) |
| Đọc hạn trong mục việc | cột hạn từng dòng | + vạch nhóm hạn | THÊM |
| Mọi thao tác dòng việc, "n em ▾", thang, panel, chip Việc cần làm | có | có | GIỮ |

Không thao tác nào bị mất.

## 4. Turso
Chỉ đổi hiển thị — 0 câu, 0 request thêm. Hộp chọn em vẫn một câu `/tim/hoc-vien` mỗi lần gõ (≥ 2 ký tự, chờ 250 ms) — nhóm, tô khớp làm ở trình duyệt; "chủ nhiệm" lấy từ phiên đã nạp (`assignments.isCore`).

## 5. [XM]
Áp theo ghi chú ⑤: [XM-1] chuông giữ v2 · [XM-7] menu giữ biểu tượng.
- **[XM-A] (hỏi PTA Plan)** ⑤ [XM-3]: GV không có nhóm "Khác" (luat/3 Y-01, Y-17 — GV chỉ ghi / báo cho em lớp mình). Web (từ GD-1) tìm theo phạm vi XEM học viên của máy chủ (`timHocVien`, quyền STUDENT_VIEW), nên GV xem được em lớp khác vẫn thấy các em đó — PR này xếp chúng cuối, nhóm "Lớp khác". Bỏ hẳn nhóm này với GV = đổi phạm vi máy chủ (luật / quyền) → không tự làm ở PR giao diện. Đề xuất: PR logic nhỏ cho `timHocVien` nhận `chiLopToi` khi người gọi không phải QL.

## 5b. Đối chiếu `10-ra-dong-bo.md` (PTA Overhaul 15/11)
- A badge tab Chấm Speaking mờ + ⚠ → làm (dòng 15a). A thang WL ở panel Xác nhận xử lý → panel dùng `ThangYThuc` (dòng 14).
- B "Không hạn" → làm (dòng 3). B menu "+ Task" có biểu tượng → làm (dòng 6). B hộp chọn em một chân → "Đóng · Tiếp" (dòng 8). B tên bậc "Report 1" / "WL 1" → web đã ghi dạng này.
- Ngoài 4a (để PR khác): chân panel một dáng (⑤ D2 — 4b), dải chỉ số / lịch sử / badge tab ② (4c), chip hạn "hạn hôm nay" dáng viên (⑤ B1 — dòng việc hiện ghi "⚠ còn n ngày · dd/mm" từ GD-1; đổi dáng chip hạn → hỏi PTA Plan [XM-B]), câu lỗi tải / hết việc, đếm việc.
- **[XM-B] (hỏi PTA Plan)** chip hạn: ⑤ B1 vẽ viên "quá hạn 5 ngày" / "hạn hôm nay" / "hạn 23/09"; web (GD-1, đã duyệt ảnh) ghi "⚠ 68 ngày · 08/07". Mục B nói "theo ⑤" — PR này chưa đổi (ngoài 4 ý a b d f); làm ở 4c hay PR riêng?

## 6. Hướng dẫn "?"
`shared/huongDan/gv.ts` mục `cv-task`: câu chọn em đổi theo nhóm lớp + nút tròn / menu đáy ở điện thoại (+ bản EN `shared/i18n/en/gd1.ts`).
