# AUDIT-BAN-GIAO — tệp rà (session AUDIT-BAN-GIAO, 03/11)

Nguồn: `00` mục 1.5, 4 (F01, F05), 7, 10 (X01), 14.4, 16 "Tự lưu" + "W1/W2", 17.4. Mã đối chiếu: main `4e1c0ed83` (sau #827).
Quy ước kết quả: tái hiện / không / đúng luật / đã sửa / thiếu dữ liệu.

## 1. Bảng xác minh

| ID | Mức | file:dòng (main) | Vai / lối vào | Cách tái hiện | Kết quả | Tác động |
|---|---|---|---|---|---|---|
| F01a | P1 | `web/src/modules/classes/banGiaoChung.tsx:90–95` (`OGopY.luu`) | GV cũ / QL điền thay · bàn giao đổi GV (Công việc, hồ sơ lớp `?viec=ban-giao-gv&id=`) | Gõ "A", rời ô (đang lưu) → quay lại gõ "AB" → phản hồi A về | **Tái hiện** (bản chạy cục bộ, chậm phản hồi 2,5 s): ô hiện "AB" mà báo "✓ Đã lưu" — máy chủ chỉ có "A". **Đã sửa (PR1)** | Người dùng tin đã lưu, đóng panel → mất "B" |
| F01b | P1 | `banGiaoChung.tsx:89` (`useBaoDangSua` không nhận `luu`) + `BanGiaoGvPanel.tsx:73–79` | như trên | Đổi em / đóng panel lúc ô đang lưu, lần lưu đó lỗi mạng | **Tái hiện bằng đọc mã**: ô gỡ → lỗi rơi vào ô đã gỡ, chữ mất, không ai biết. **Đã sửa** — chữ giữ theo khoá ô, mở lại em thấy chữ + câu lỗi; Đóng chờ lần lưu, lỗi thì ở lại + báo | Mất góp ý |
| F01c | P1 | `BanGiaoGvPanel.tsx:81–87` (`xacNhan`: `Promise.allSettled`) | GV cũ / QL · Xác nhận bàn giao | Ô đang lưu lỗi (500 / mất mạng) rồi bấm Xác nhận | **Tái hiện bằng đọc mã**: `allSettled` nuốt lỗi → xác nhận phiếu bằng bản cũ trên máy chủ. **Đã sửa** — chờ hết lần lưu; còn ô chưa lưu → không gửi xác nhận, đưa tới em đó + báo | Phiếu chốt sai nội dung |
| F01d | P2 | `BanGiaoGvPanel.tsx:129–130` (nhận xét chung) | như trên | Lưu "Y" (bản gốc "X") → gõ lại "X" → rời ô | **Tái hiện bằng đọc mã**: so với `giaTri` cũ (không đổi sau lưu) → không gửi, máy chủ giữ "Y". **Đã sửa** (so với bản máy chủ đã nhận) | Sai nội dung im lặng |
| F01e | P1 | `BanGiaoPanel.tsx:79–86` (nhận xét chung GVCN, chuyển lớp) | GVCN lớp cũ · bàn giao chuyển lớp | Như F01a | **Tái hiện** (bản chạy cục bộ): phản hồi bản cũ về → "✓ Đã lưu" cho chữ chưa lưu. **Đã sửa** | Như F01a |
| F01f | P1 | `BanGiaoPanel.tsx:269–279` (bảng GVBM, chuyển lớp) | GVBM · Bàn giao môn | Như F01a; đóng panel lúc đang lưu lỗi | **Tái hiện bằng đọc mã** (cùng mẫu F01a; panel không hỏi khi đóng với ô lưu lỗi). **Đã sửa** — xếp lượt, ô lỗi → ✕ hỏi, Đóng chờ lần lưu | Như F01a |
| F01g | — | hai tab cùng sửa một ô | mọi vai | Tab 1 lưu "A", tab 2 lưu "B" | **Đúng thiết kế hiện hành**: người lưu sau thắng, nhật ký `writeAudit` giữ bản trước. Không thêm khoá phiên bản (một câu / ô, ít người cùng sửa) — ghi để PTA biết | Thấp |
| X01 | — | `quyenChuyenLop.ts:12–17`, `banGiao.ts:31` | GVCN / GVBM / QL · bàn giao chuyển lớp | Phân công tương lai / đã hết | **Không tái hiện — đúng thiết kế**: "Từ tuần …" nằm ở `doi_phan_cong` (`cho`), chỉ ghi vào `teacher_assignments` khi tới hạn (`apDoiDenHan`: cron thứ Hai + quét khi đọc ở Phân công GV và quét lệnh chuyển `lenhChuyen.ts:646`); bỏ phân công = `status='ended'`. Mọi `INSERT` vào `teacher_assignments` dùng ngày ≤ hôm nay. Vậy `status='active'` = đang hiệu lực. Quyền bàn giao theo phân công ở LỚP NGUỒN (không theo ghi danh) → GV lớp cũ vẫn làm phiếu sau khi em chuyển | Không |
| X01-phụ | P3 | `phanCongGv.ts:331–381` | — | Cron thứ Hai lỡ | Áp lịch đổi chậm tới lần quét khi đọc kế tiếp → vài giờ người cũ còn quyền. Ghi nhận, không sửa (cron đã có, quét khi đọc bù) | Thấp |
| F05 | P1 | `banGiao.ts:243` (`boMonCt` = bộ môn LỊCH: L R W S), `:309–330` (`ghiMon` UPSERT `(lenh_id, mon)`) | GV W1 + GV W2 · bàn giao chuyển lớp FT | GV W1 ghi Writing "A", GV W2 ghi Writing "B" | **Tái hiện bằng đọc mã**: cả hai được ghi `mon='writing'` (`kyNangPhuTrach` map writing → writing1/2) → **câu sau đè câu trước** (nhật ký còn bản trước); đếm "đã ghi" coi Writing xong khi MỘT người viết | Mất câu bàn giao của một GV; thiếu môn đếm sai |
| F05-đổi GV | — | `banGiaoGv.ts:216–219` (cột = `ban_giao_gv_mon.mon` = khoá phân công) | GV cũ · bàn giao đổi GV | Đổi GV W1 và W2 | **Đúng**: cột theo khoá phân công (`writing1`, `writing2` riêng); một GV cả hai → hai ô trong cùng phiếu; đếm theo cột độc lập (`trangThaiEmBg`) | — |
| MDK | P2 | `banGiao.ts:243–256`, `banGiaoGv.ts` `emCuaPhieu` | mọi vai · cả hai luồng | Em chỉ học W1 (`learning_cycles.mon_dang_ky`) | **Tái hiện bằng đọc mã**: không luồng nào đọc `mon_dang_ky` → vẫn đòi câu W2 / Writing cho em không học (trái N13 "môn không học không là thiếu / việc") | Việc thừa, "Thiếu" sai |

## 2. W1 / W2 — hiện trạng theo bảng `00` mục 7

| Thành phần | Chuyển lớp (`banGiao.ts`, `BanGiaoPanel.tsx`) | Đổi GV (`banGiaoGv.ts`, `BanGiaoGvPanel.tsx`) |
|---|---|---|
| Phiếu | Một trường Writing (bộ môn lịch) | W1, W2 riêng (theo phân công) ✓ |
| Người phụ trách | GV W1 và W2 cùng ghi một trường (đè nhau) | Đúng người từng cột ✓ |
| Một GV dạy cả hai | Một ô Writing | Hai ô cùng phiếu ✓ |
| Hoàn thành | Writing "xong" khi một người viết | Độc lập từng cột ✓ |
| Cùng GV lớp cũ / mới | Theo Writing gộp (`cungGvTheoLo`) | Không áp dụng (chỉ cặp GV đổi) |
| Môn đăng ký | Không xét | Không xét |
| Bản chụp | `gvbmChuaBanGiao` theo bộ môn lịch | Chụp theo cột ✓ |
| API / việc / chuông | Việc GVBM "Bàn giao môn Writing" — W1, W2 cùng một việc | Theo cột ✓ |

**Phương án dữ liệu (chờ câu 17.4):** bộ môn BÀN GIAO riêng (`boMonBanGiao(ct)` = bộ môn lịch, FT tách `writing` → `writing1`, `writing2`; lớp thường giữ nguyên) dùng ở phiếu, `ghiMon`, đếm, bản chụp, việc GVBM, cùng GV; lọc theo `mon_dang_ky` của lộ trình em. **Không đổi** `boMonCt` / lịch Test / cách gộp Writing · Overall · SOS. Bảng `ban_giao_mon` giữ nguyên khoá `(lenh_id, mon)` — dòng mới ghi `writing1` / `writing2`, dòng cũ `writing` giữ nguyên (không migrate dữ liệu; có thể không cần migrate schema). Dữ liệu cũ — **chủ SP chốt câu 17.4 (03/11, chọn khuyến nghị):** phiếu chưa xác nhận đã có câu Writing chung → câu cũ hiện **chỉ đọc**, nhãn "Writing · cũ" để GV tham khảo; W1 và W2 vẫn là "chưa có", mỗi GV viết câu riêng — không tự coi một câu là đủ hai môn. Phiếu đã xác nhận giữ nguyên, không mở lại.

## 3. PR

| PR | Nội dung | Trạng thái |
|---|---|---|
| PR1 F01 | Tự lưu bàn giao (đổi GV + chuyển lớp): xếp lượt theo ô (`taoOLuu` có sẵn), hàng lưu của phiếu (`taoHangLuu`): Xác nhận / Đóng chờ lần lưu, ô lỗi giữ chữ theo khoá ô, không xác nhận khi còn ô chưa lưu. 2 phép kiểm mới (`prOv14a`). Không đổi API / dữ liệu / bố cục | **#832 đã merge** |
| PR2 W1/W2 | `monBanGiao` (shared) + `boMonBanGiaoCt` + `monCuaLenh` / `MDK_SQL` (`banGiao.ts`): phiếu, ghi môn, đếm, bản chụp, việc GVBM, dải lớp / HV, Cùng GV theo W1 · W2; lọc môn đăng ký; câu Writing cũ chỉ đọc (17.4 = N31). Không migrate. Kèm: chip "Chờ môn" bỏ môn Cùng GV (lỗi cũ); bỏ tải lại cả phiếu sau mỗi ô (`invalidateGop`). Một GV dạy cả W1 + W2 vẫn hai việc / hai lần mở bảng GVBM tới khi PR giao diện theo mockup | mở PR |
| Mockup bàn giao (14.4) | W1/W2 hai GV, cùng GV, một môn không học, Writing cũ, đang lưu / lưu lỗi | soạn sau PR1, chờ chủ SP duyệt |

## 4. Nghiệm thu F01 (`00` mục 4 + 16 "Tự lưu") — đã chạy

| Ca | Cách kiểm | Kết quả |
|---|---|---|
| A đang lưu → gõ AB → A về | Bản chạy cục bộ (đổi GV + chuyển lớp), chậm phản hồi 2,5 s | AB "● Đang gõ" (không "Đã lưu"); rời ô → lưu AB → "✓ Đã lưu" ✓ |
| Hai lần rời ô chồng nhau | Phép kiểm `prOv14a` "phiếu bàn giao…" | Gửi tuần tự A rồi AB; `xong()` chỉ trả khi AB lưu ✓ |
| Đổi em lúc đang lưu + lỗi mạng | Bản chạy: lỗi 503 giả; quay lại em | Chữ còn + câu lỗi ✓ |
| Đóng panel khi còn ô lỗi | Bản chạy: nút Đóng | Ở lại + báo "Còn 1 ô chưa lưu được… bấm Đóng lần nữa để bỏ" ✓; ✕ / Esc: panel hỏi "Bỏ chữ, đóng" |
| Xác nhận khi có ô lỗi | Phép kiểm (`dongSauKhiLuu` / `chuaLuu`) + đọc mã `xacNhan` | Không gửi xác nhận ✓ (bản chạy chưa bấm: phiếu demo 33 em) |
| Gõ về đúng bản máy chủ sau lỗi | Phép kiểm | Hết "chưa lưu" ✓ |
| 409 / 500 | Mọi lỗi đi cùng đường (`taoOLuu` → `loi`) | Chữ giữ ✓ |
| Hai tab | — | Người lưu sau thắng (F01g) |
| Mất phản hồi sau khi máy chủ đã ghi | Lần rời ô sau gửi lại cùng chữ (UPSERT, không nhân đôi) | ✓ theo mã |

## 5. Để PTA

- Panel `KhungPanel`: nút **Đóng ở chân** (`chan.huy`) không qua hộp "Bỏ chữ, đóng" như ✕ / Esc (`KhungPanel.tsx:303, 377`) — mọi panel. PR1 chỉ chặn ở hai panel bàn giao; muốn đồng bộ toàn app → PR riêng (UX-A / LOI). → PTA giao AUDIT-LOI (03/11).
- `BanGiaoPanel` (chuyển lớp) tải lại cả phiếu sau mỗi lần lưu một ô (`reload()`) — đọc Turso thêm mỗi ô; panel đổi GV đã không tải lại. Gom vào PR2 nếu chạm tệp. → **đã gom vào PR2** (`invalidateGop`).
