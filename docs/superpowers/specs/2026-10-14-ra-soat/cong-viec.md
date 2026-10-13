> Phụ lục rà soát 13–14/10 (báo cáo agent, planning đã đối chiếu các mục chặn). Đường ảnh `$SP/anh/...` chỉ có trên máy planning — tái hiện theo bước ghi trong mục.

# Rà chức năng · CÔNG VIỆC (CV) · agent N=5 · 13/10 (ngày demo 14/09/2026)

## Đã đi
| Trang | Vai | Thao tác đã thử |
|---|---|---|
| /cong-viec (Hỗ trợ HV) 1440 tối | QL | Của GV / Của tôi / Lọc thêm › một GV (so API theo từng GV) · dòng phạm vi · Nhắc 1 dòng gộp (1 chuông ✓) · Nhắc tất cả (hỏi lại, 43 chuông / 8 GV ✓) · Chốt lộ trình → hồ sơ lớp `?che-do=lo-trinh` → chốt Lên BE → việc hết ✓ · Chọn bước tiếp sau thi (NganTongKet, Kết thúc ✓) · ‹ Công việc về đúng lọc + cuộn ✓ |
| /cong-viec (Hỗ trợ HV) 1440 tối | GVCN | Xác nhận nguyên nhân gom (1 em → làm riêng → em còn lại; xác nhận cùng lúc bật / tắt → sinh Xác nhận PA ✓) · Xác nhận PA tại chỗ ✓ · Thêm PA ✗ (CV-2) · Kết quả PA ✓ · Ghi Mini Test ✓ (CV-4, CV-13) · Nhập điểm FT (hộp, Lưu) ✗ (CV-5) · Nhập điểm lớp thường (ô gõ) ✓ · PET Checkpoint, Pre FOU mở ✓ · Bàn giao (xác nhận 1 em, Sửa sau xác nhận ✓) · Ý thức Xác nhận xử lý ✗ (CV-7) · Ghi nhận vi phạm mới (mở trang lớp, ‹ Công việc ✓) · link em ↗ → hồ sơ → ‹ Công việc về đúng `viec=` ✓, nút Lùi ✓ · Tổng quan + 4 hồ sơ HV sau khi làm (không còn báo việc đã xong ✓) |
| /cong-viec | GVBM · GVW · GV Lê Minh Khoa | gom P lớp thường (bỏ chọn 1 em ✓) · Không cần theo dõi… trong panel gom ✓ (CV-15) · việc Vận hành được giao: mở tại chỗ, Cập nhật tiến độ → Xong ✓ (CV-12) · Chi nhánh MB+BC ✓ |
| /cong-viec/cho-duyet | QL · QT | Chờ duyệt / Nhắc việc / Đã xử lý · Từ chối (lý do bắt buộc ✓) · Duyệt ✓ · Huỷ quyết định trong ngày (PA về chờ duyệt, hạn cũ ✓) · Từ chối nhiều 2/2 ✓ · Nhắc tất cả (CV-14) · Mở thẻ chưa lệnh ✓ · badge 10→8→7 khớp tab ✓ |
| /cong-viec/van-hanh | QL · QT | + Giao việc cho GV ✓ · bảng, bộ lọc |
| /cong-viec/bao-cao | QL · QT | tuần này (chưa mở cửa sổ), tuần trước (đang mở) → mở ô → Nộp lại / Lưu nháp hiện ✓ (chưa bấm lưu) |
| /cong-viec | ADMIN (CP) | demo CP không có ô điểm chờ → Admin dời 2 lượt MT4 CP FT 110 sang W2 SEP → 3 dòng Chấm điểm, Nhắc 1 dòng ✓, panel + hộp nhập điểm, lưu ✓ · tab khác → về /cong-viec ✓ · API: `/yeu-cau` 403, `/meeting/board` 403, `/my-work/nhac` việc khác 403, `/cases/xac-nhan-nhom` 403, POST `/mgmt-tasks` 403 (GET `/mgmt-tasks` 200 rỗng) |
| /cong-viec + 5 đường con, `?viec=`, `?mo-viec=` | TVV · CX | về `/` không trắng trang ✓ · API `/my-work` `/yeu-cau` `/mgmt-tasks` `/meeting` `/MY-WORK` nhắc, duyệt, từ chối nhiều → 403 ✓ |
| /cong-viec 375 sáng | GVCN · QL | danh sách (hàng hạn vuốt ngang ✓, không tràn trang ✓) · panel màn đầy đủ + "‹ Công việc" về đúng cuộn ✓ · panel gom, Bàn giao, Nhập điểm FT ✓ · nút chân panel bấm được (không bị thanh dưới che) ✓ · Chờ duyệt / Vận hành / Báo cáo không tràn ✓ |
| API thẳng | QT · GVCN · GVBM | `nhac-nhieu` 51 việc → 400 "1 đến 50" ✓ · GV `?nguoi=tat-ca` 403 · GV nhắc 403 · GVBM duyệt 403 ✓ |

Chưa thử được (demo không có việc loại này): Kết quả đầu ra (KQĐR), Xét lại lộ trình, Hoàn thành Case (không phải dòng việc riêng), Khai bậc / Đã thực hiện Ý thức (chỉ đọc mã).
DB riêng a5 đã ghi nhiều thao tác (không reset).

## Phát hiện

### CV-1 · lỗi · Dòng phạm vi "m học viên" đếm trùng (QL Của GV: 144, thật ~40+)
- Trang · vai: /cong-viec · QL (Của GV), cũng áp cho Quản trị
- Tái hiện: QL → /cong-viec (mặc định Của GV) → dòng "Đang xem: Monbay · Của GV · Tất cả hạn · 65 nhóm việc · 144 học viên".
- Thấy: 144 = 40 em riêng (dòng có `studentId`) + 104 cộng dồn `count` của dòng cả lớp. Riêng MB FT 101 có 12 dòng Nhập điểm (4 người × 3 lượt, `count` 8/3/4/9/3/6…) cộng 66 "học viên" cho một lớp ~10 em; Chốt lộ trình cộng thêm số em mỗi lớp dù các em đó có thể đã đếm ở dòng khác.
  Đúng ra: "học viên" = số em riêng (mockup M1 §1 "đếm đúng đơn vị (nhóm việc · học viên)"; CLAUDE.md: cùng số liệu cùng hàm, đúng đơn vị).
- Nguyên nhân: `shared/domain/congViec.ts:84-90` (`demPhamVi`: dòng không có `studentId` → `them += d.count`, không biết em nào nên cộng trùng).
- Đề xuất: máy chủ trả danh sách id em của dòng cả lớp (hoặc `emIds`) để đếm tập; tạm thời ghi "n nhóm việc" thôi khi có dòng cả lớp. Không cần mockup.
- Ảnh: $SP/anh/cong-viec/QL-1440-ho-tro.png

### CV-2 · lỗi · "Thêm PA" làm tại chỗ xong mà dòng vẫn "Cần làm", số đếm + badge không đổi (cả khi rời trang rồi quay lại)
- Trang · vai: /cong-viec · GVCN (mọi vai có việc "Thêm PA học thuật …", nhóm `no_plan`)
- Tái hiện: GVCN → /cong-viec → bấm "Thêm PA học thuật Reading · Trịnh Bảo Ngọc · MB FT 101" (`viec=support:49`) → gõ Nội dung → Thêm PA
  → toast "Đã ghi lại", panel chuyển sang Case (PA Đang thực hiện, DB có `case_interventions` mới) → dòng ở danh sách vẫn "Cần làm", không mờ/gạch,
  số "Tất cả / Case học thuật" giữ nguyên → bấm Tổng quan rồi Công việc (trong SPA) → dòng vẫn còn. Chỉ F5 mới hết. API `/my-work` thì đã không còn trả việc đó.
- Thấy: việc đã xong vẫn báo "Cần làm" (quá hạn thì badge Công việc vẫn đếm). Đúng ra: dòng mờ + gạch giữ chỗ, số đếm + badge giảm
  (đặc tả OV mục 4 "Lưu xong dòng mờ, không nhảy"; CLAUDE.md: việc đã xong không nơi nào còn báo chờ / quá hạn).
- Nguyên nhân: `web/src/modules/cases/ThaoTacCase.tsx:77` (`ThemPaPanel` chỉ `invalidate('/cases' | '/students' | '/tong-quan')`, thiếu `/my-work`) +
  `web/src/modules/congViec/PanelViec.tsx:59-60` (nhánh `no_plan` truyền `onChanged={onDaLam}`, không qua `doi` có `invalidate('/my-work')`).
  Các nhánh khác của NganCase (Kết quả PA, Xác nhận PA) có invalidate nên không bị.
- Đề xuất: thêm `invalidate('/my-work')` ở `ThemPaPanel.luu` (một dòng, mọi nơi mở Thêm PA đều đúng). Không cần mockup.
- Ảnh: $SP/anh/cong-viec/GVCN-them-pa-sau.png, GVCN-them-pa-stale.png

### CV-3 · lỗi · Dòng làm xong (hoặc làm một phần) vẫn nhảy chỗ — có khi rơi xuống sau "Xem thêm n việc"
- Trang · vai: /cong-viec · GVCN
- Tái hiện: GVCN → /cong-viec → "Xác nhận nguyên nhân · Listening · MB FT 101 · MT1 · 2 em" (hạn 16/09, vị trí 9 nhóm Case học thuật) →
  xác nhận 1 em (Vũ Ngọc Lan) → dòng đổi hạn 18/09 và tụt xuống dưới 2 dòng "Thêm PA … 18/09" → xác nhận nốt em còn lại bằng "Xác nhận · việc tiếp ›"
  → dòng đã xong KHÔNG còn thấy trong 10 dòng đầu (bị đẩy ra sau "Xem thêm 7 việc"), panel đã sang việc khác.
  Ví dụ gọn: /cong-viec?nhom=case-hoc-thuat → "Kết quả PA Listening · Dương Ngọc Ánh" ở vị trí 3, "Kết quả PA · MB ELE 02" vị trí 4 (cùng hạn 14/09) → Lưu kết quả
  → dòng xong (mờ + gạch) xuống vị trí 4, dòng MB ELE 02 lên 3.
- Thấy: dòng xong được nối vào CUỐI mảng rồi sắp lại theo hạn → đứng sau mọi dòng cùng hạn; nhóm chỉ vẽ 10 dòng nên dòng xong biến mất khỏi tầm nhìn.
  Dòng làm một phần cũng đổi hạn (hạn sớm nhất của em còn lại) nên nhảy. Đúng ra: "Lưu xong dòng mờ, không nhảy" (đặc tả OV mục 4, mockup M1 §1).
- Nguyên nhân: `web/src/modules/congViec/HoTroHocVienTab.tsx:110` (`hienThi = [...tatCaViec, ...giu xong]`) + `shared/domain/tongQuan.ts:70-71`
  (`gomNhomViec` sắp lại theo urgency + hạn) + `NhomViec soHien=10`.
- Đề xuất: giữ thứ tự theo lần tải trước (chỉ chèn dòng xong vào đúng chỉ số cũ, không sắp lại khi đang mở panel), hoặc tính thứ tự một lần lúc vào trang. Không cần mockup.
- Ảnh: $SP/anh/cong-viec/GVCN-xn-sau-luu-1.png, GVCN-xn-viec-tiep.png

### CV-4 · lỗi · Một việc Bổ trợ miễn phí hiện thành 3 dòng (Ghi Mini Test + 2 × "Kết quả cuối" cùng chữ)
- Trang · vai: /cong-viec · GVCN (Trần Ngọc Hà), em Vương Bảo Ngọc · MB ELE 02 (Final Test BE trượt W + S, một nhóm bổ trợ `mt:214`)
- Tái hiện: GVCN → /cong-viec → nhóm Case học thuật có "Kết quả PA · MB ELE 02 · 2 việc" (action:62 Writing, action:63 Speaking — cùng chữ
  "Kết quả cuối · 2 buổi miễn phí (W, S)…") VÀ "Ghi Mini Test · Vương Bảo Ngọc" (minitest:1). Ba dòng mở CÙNG một form (Kết quả cuối + Mini Test).
  Ghi Mini Test 75 % ở minitest:1 → máy chủ khép cả nhóm (2 PA, 2 Case done, `case_followups` 26 + 27) → cả 3 dòng hết.
- Thấy: một việc đếm 3 lần ở Case học thuật / Tất cả / hạn hôm nay (badge nếu quá hạn). Đúng ra: một dòng cho một nhóm bổ trợ (PR-SO D2 "PA bổ trợ chung gộp MỘT dòng mỗi nhóm").
- Nguyên nhân: `shared/domain/daiDienBoTro.ts:8-12` chỉ chọn đại diện cho `kind === 'bo_tro'`, bỏ sót `bo_tro_mien_phi` (dù `anhEmNhom`/`chepKetQuaNhom`
  ở `server/src/cases/boTro.ts:110-115` đã coi hai loại là một nhóm); `server/src/worklist/mywork.ts:559`. Dòng "Ghi Mini Test" (`mywork.ts:878`) thêm lần thứ ba.
  Chỉ số Tổng quan `pa-can-cap-nhat` (`metrics.ts:414`) dùng cùng hàm → cũng đếm 2 (chỉ đọc mã).
- Đề xuất: `daiDienNhomBoTro` nhận cả `bo_tro_mien_phi`; khi tuần cuối (`laLanGhiCuoi`) của nhóm có Mini Test chờ thì bỏ dòng "Kết quả cuối" (giữ "Ghi Mini Test") hoặc ngược lại. Không cần mockup.
- Ảnh: $SP/anh/cong-viec/GVCN-mini-test-panel.png, GVCN-kq-bo-tro-62.png, GVCN-mini-test-sau.png

### CV-5 · lỗi (nặng — nhập nhầm kỹ năng) · Panel Nhập điểm tự nhảy chip kỹ năng sau mỗi lần lưu
- Trang · vai: /cong-viec › Nhập điểm (FT) · GVCN (Trần Ngọc Hà, dạy L + R MB FT 101)
- Tái hiện: GVCN → /cong-viec → "Nhập điểm · MB FT 101" ▾ → "Listening, Reading · MT2 · 3 HV" (`viec=score:3|mock|2|2026-08-19|u7`) → chip **L** đang chọn →
  "Nhập" Hà Gia Bình → 25 → Lưu → **chip tự chuyển sang R** → "Nhập" Lương Bảo Anh, Tạ Minh Quân (người dùng tưởng vẫn cột L) → điểm vào **Reading**;
  sau lần lưu thứ ba chip lại tự về L. DB: Hà Gia Bình listening 25 · Lương Bảo Anh reading 25 · Tạ Minh Quân reading 25.
  Lần đầu thử với MT3 (4 em, gõ L 30 rồi R 31) cũng ra lẫn: 3/4 em L/R đảo nhau.
- Thấy: kỹ năng đang nhập đổi dưới tay người dùng, không báo (chỉ chữ đầu hộp "Reading · MT2" khác). Đúng ra: chip giữ nguyên tới khi người dùng đổi
  (đặc tả OV mục 4 "Nhập điểm = danh sách em + hộp nhập điểm"; CLAUDE.md "không mất chữ đang gõ", trạng thái rõ).
- Nguyên nhân: `server/src/worklist/mywork.ts:451` `kn: first.skill` — kỹ năng của "bucket" đầu tiên, đổi khi một em xong L còn R; panel truyền `it.kn`
  (`web/src/modules/congViec/PanelViec.tsx:102-103`) và `useKyNangChon` có `useEffect([kn]) → setChon` (`web/src/modules/cham/MotKyNang.tsx:52-56`) nên mỗi lần
  `/my-work` tải lại sau khi lưu là chip bị đặt lại.
- Đề xuất: panel chỉ dùng `kn` lúc mở (giữ `kn` ban đầu trong ref / `useState(() => it.kn)`), hoặc `useKyNangChon` chỉ áp `kn` lần đầu. Không cần mockup.
- Ảnh: $SP/anh/cong-viec/GVCN-score-chip-nhay.png, GVCN-score-sau.png

### CV-6 · thừa · Panel Nhập điểm hiện cả lớp 34 em, 3–4 em của việc lẫn giữa ~30 dòng "—"
- Trang · vai: /cong-viec › Nhập điểm FT · GVCN
- Tái hiện: mở "Listening, Reading · MT3 · 4 HV" (MB FT 101) → danh sách 34 em theo ABC; 4 em cần nhập (Lê Quang Huy, Nguyễn Minh An, Trần Thu Hà, Vũ Hải Đăng)
  nằm rải rác, thêm các nút "Nhập" của việc khác (em "cũ", em "Đã kết thúc học" Ngô Thanh Tùng). Trên 375 phải cuộn cả lớp.
- Thấy: phải dò tìm em của việc. Đúng ra (gợi ý): mặc định lọc / đưa lên đầu các em của việc (đúng tuần + đúng người), phần còn lại gập "Cả lớp (n)".
  Mockup M1 bảng §2 chỉ ghi "Danh sách em của đúng kỹ năng đó" — chủ SP chọn.
- Nguyên nhân: `PanelViec.tsx:84-103` truyền nguyên bảng `diem-theo-luot` vào `MotKyNang`.
- Đề xuất: lọc theo `studentId` của việc (máy chủ đã có trong bucket). Đổi bố cục nhỏ trong panel — không cần mockup nếu chỉ lọc.
- Ảnh: $SP/anh/cong-viec/GVCN-score-panel-mt3.png, GVCN-score-mt2.png

### CV-7 · lỗi · Ý thức "Xác nhận xử lý" tại chỗ: panel biến mất ngay sau Lưu — mất bước "Đã lưu · Tệp hoặc liên kết", dòng em biến mất (không mờ + gạch)
- Trang · vai: /cong-viec · GVCN
- Tái hiện: GVCN → /cong-viec?nhom=y-thuc → "Xử lý vi phạm · MB FT 101 · 3 em" ▾ → Kiều Minh Đức (`viec=yt_xu_ly:91`) → Ngày thực hiện 14/09/2026 + Mô tả → Xác nhận xử lý
  → panel thành "Chọn một việc ở danh sách" (URL vẫn `viec=yt_xu_ly:91`), em biến khỏi dòng gộp (còn "2 em" rồi "1 em"), không có dòng mờ/gạch. DB đã ghi xử lý.
- Thấy: bước 2 của panel (Đã lưu + đính kèm Tệp / liên kết, nút Xong) không bao giờ hiện ở Công việc → muốn đính kèm phải đi hồ sơ HV.
  Đúng ra: panel giữ sau khi lưu, dòng mờ + gạch (đặc tả OV mục 4; CLAUDE.md "không báo xong khi chưa lưu"/trạng thái rõ). Ở hồ sơ HV (nơi khác dùng panel) không bị vì không phụ thuộc `/my-work`.
- Nguyên nhân: `web/src/modules/yThuc/XacNhanXuLyPanel.tsx:99` `lamMoi()` invalidate `/my-work` (`kieu.ts:73`) NGAY khi lưu, còn `onDone` (→ `daLam` giữ chỗ) chỉ gọi lúc đóng
  (`:86-88`) → `/my-work` tải lại không còn việc → `chon` = null (`HoTroHocVienTab.tsx:129-132`) → PanelViec bị gỡ. `DaThucHienPanel`, `KhaiBacPanel` gọi `onClose(); onDone()` cùng lúc nên không mất bước, nhưng cũng đóng panel thay vì giữ (phần này chỉ đọc mã, chưa tái hiện).
- Đề xuất: gọi `onDone` (giữ chỗ) ngay sau khi lưu ở bước 1, trước `lamMoi`; hoặc PanelViec giữ `chon` theo bản đã chọn khi việc vừa rời máy chủ. Không cần mockup.
- Ảnh: $SP/anh/cong-viec/GVCN-yt-sau2.png

### CV-8 · lỗi · "Của GV (nhắc)" và "Lọc thêm › Của một GV" tính việc của cùng một GV hai cách — Bàn giao của GV không bao giờ hiện ở "Của GV"
- Trang · vai: /cong-viec · QL (MB), cũng Quản trị
- Tái hiện: QL → /cong-viec (Của GV) → không có dòng Bàn giao nào (API `?nguoi=tat-ca`: 0 dòng `ban_giao`) → Lọc thêm › Của một GV › Lê Minh Khoa →
  hiện "Bàn giao · MB FOU 23 · 4 việc · 4 việc quá hạn" (có Nhắc), "Bàn giao · MB FOU 22", "Bàn giao môn W · MB FT 103", "Bàn giao · MB FOU 24"…
  So theo người (API): Trần Ngọc Hà 26 (Của GV) ↔ 35 (một GV); Lê Minh Khoa 11 ↔ 25; Phạm Thu Trang 11 ↔ 17; Cao Khánh Linh 8 ↔ 12. Khác nhau chủ yếu `ban_giao` (21 việc),
  thêm `ghi_ket_qua_pa` chưa quá hạn, `no_owner`, `phoi_hop_sos`, `missing_data`.
- Thấy: QL ở mặc định không thấy (và "Nhắc tất cả" không nhắc) Bàn giao quá hạn của GV; chọn một GV thì số việc nhảy lên. Đúng ra: một khái niệm "việc của GV" một hàm
  (CLAUDE.md "cùng một số liệu ở nhiều nơi phải cùng nguồn, cùng hàm tính"). Nếu chủ ý "Của GV" chỉ hiện việc QL cần nhắc thì "một GV" cũng phải cùng luật.
- Nguyên nhân: `server/src/worklist/mywork.ts:623` `viecBanGiao(p.userId, …)` chỉ lấy việc của chính người xem (nhánh `tatCa` không liệt kê GV khác);
  `viecCuaNguoi` (`mywork.ts:1336-1352`) lại chạy nguyên `myWork` của GV đó. Hồ sơ GV › Việc đang có dùng `viecCuaNguoi` (cùng số "một GV").
- Đề xuất: chủ SP chọn một luật; dễ nhất: nhánh `tatCa` gọi `viecBanGiao` cho từng GV trong phạm vi (như các nhóm khác liệt kê dòng của GV). Không cần mockup.
- Ảnh: (API) $SP/pw/cv/cmp.mjs

### CV-9 · thừa + chữ sai · Thẻ "Lớp hết khoá · chưa có quyết định chuyển lớp" trùng việc "Chốt lộ trình" của chính QL, và ghi "Lớp chưa có GVCN" cho lớp có GVCN
- Trang · vai: /cong-viec/cho-duyet › Nhắc việc · QL (MB)
- Tái hiện: QL → Công việc › Chờ duyệt › Nhắc việc → thẻ "Báo QL · Lớp hết khoá · chưa có quyết định chuyển lớp · MB BE 04 · MB BE 04 · 2 em…" với chữ **"Lớp chưa có GVCN"**
  (hồ sơ lớp MB BE 04 ghi "GVCN Lê Minh Khoa"); tương tự MB FOU 21. Cùng lúc tab Hỗ trợ học viên có "Chốt lộ trình · MB BE 04 · quá hạn" (QL làm).
- Thấy: một việc của QL báo hai nơi (QL tự "báo lên" cho chính mình); chữ thay nút Nhắc nói sai lý do. Sau OV-3b chỉ QL chốt lộ trình — không có GV nào để nhắc.
  Đúng ra: một việc một chỗ (CLAUDE.md "Thông tin vừa đủ… cùng một số liệu cùng nguồn"; đặc tả OV 3.1 "việc QL Chốt lộ trình").
- Nguyên nhân: `server/src/duyet/loaiYeuCau.ts:553-598` (`bao_len_chua_lenh`, `ownerId: null`) + `shared/domain/yeuCauDuyet.ts:247-248` (`nhanKhongNguoiNhac` mặc định "Lớp chưa có GVCN").
- Đề xuất: bỏ quét tạo `bao_len_chua_lenh` cho lớp thường (việc Chốt lộ trình đã phủ, có hạn đỏ), hoặc ít nhất đổi chữ "Việc của Quản lý — chốt ở Lộ trình tiếp theo". Không cần mockup.
- Ảnh: $SP/anh/cong-viec/QL-nhac-viec-tab.png

### CV-10 · lỗi chữ · Thẻ Báo QL lặp tên lớp / tên em hai lần
- Trang · vai: /cong-viec/cho-duyet › Nhắc việc, Đã xử lý · QL
- Tái hiện: xem thẻ: "Bàn giao quá hạn · MB FOU 23 · **MB FOU 23** · GVCN Lê Minh Khoa"; "Lớp hết khoá · … · MB BE 04 · **MB BE 04**"; "Mini Test chưa đạt · 58% · Lâm Khánh Vy · MB ELE 02 · **Lâm Khánh Vy**".
- Nguyên nhân: `web/src/modules/duyet/TheYeuCau.tsx:185` ghép `hocVien · lop · phu` trong khi `tieuDe` (`loaiYeuCau.ts:545`, `:595`) đã có lớp và `phu` của Mini Test (`:657`) là tên em.
- Đề xuất: bỏ lớp khỏi `tieuDe` hai loại thẻ lớp; `phu` Mini Test = người giữ việc (GVCN). Không cần mockup.
- Ảnh: $SP/anh/cong-viec/QL-nhac-viec-tab.png

### CV-11 · lỗi (nhãn) · QL "Của tôi" lẫn việc của GV (có tên GV + nút Nhắc)
- Trang · vai: /cong-viec?nguoi=toi · QL (MB)
- Tái hiện: QL → Công việc › Hỗ trợ học viên › **Của tôi** → nhóm Case học thuật có "Kết quả PA Reading · Lý Minh Châu · Trần Ngọc Hà · Đã nhắc",
  "Thiếu PA học thuật · MB FT 101 · 2 em · Phạm Thu Trang", "Thêm PA học thuật G+V · Hồ Diệu Linh · Lê Minh Khoa (hạn 18/09, chưa quá hạn)", "… · Cao Khánh Linh"…
  API `?nguoi=toi`: 20 dòng, `summary.mine` = 5.
- Thấy: "Của tôi" không phải của tôi; dòng phạm vi "Đang xem: Monbay · Của tôi" sai. Đúng ra: Của tôi = việc người xem giữ; việc GV nằm ở "Của GV (nhắc)".
- Nguyên nhân: `server/src/worklist/mywork.ts:670-703` (`no_plan` hiện cho mọi người `coTheThemPa` — QL có `case.approve` nên thấy mọi Case không PA trong phạm vi) và nhánh
  `ghi_ket_qua_pa` "QL thấy dòng người khác khi quá hạn" (`:549-550`) chạy cả khi không `tatCa`.
- Đề xuất: khi không `tatCa`, chỉ giữ dòng `ownerId === p.userId` (hoặc `ownerId === null` cho việc chưa ai giữ). Không cần mockup.
- Ảnh: $SP/anh/cong-viec/QL-cua-toi.png

### CV-12 · thừa · Việc Vận hành tại chỗ: "Cập nhật tiến độ" mở thêm một ngăn kéo đè lên panel (panel lồng panel)
- Trang · vai: /cong-viec?viec=mgmt:{id} · GV (Lê Minh Khoa) được giao việc; tương tự QL
- Tái hiện: QL Vận hành › + Giao việc "Soạn bộ đề Reading tuần 4" cho Lê Minh Khoa → đăng nhập Lê Minh Khoa → Công việc › nhóm Vận hành → bấm dòng (panel phải)
  → "Cập nhật tiến độ" → ngăn kéo thứ hai phủ màn (chỉ 5 chip trạng thái + Ghi chú) → Xong → Lưu → dòng mờ + gạch (đúng).
- Thấy: hộp nhỏ (1 chip + 1 ô) mở thành ngăn kéo thứ hai đè lên panel tại chỗ. Đúng ra: CLAUDE.md "không panel lồng panel; việc ngắn → hộp nhỏ" — đặt chip + ghi chú ngay trong panel.
- Nguyên nhân: `web/src/modules/worklist/MgmtTasksPage.tsx` (`NganViecVanHanh` mở form cập nhật bằng `KhungPanel` riêng).
- Đề xuất: form cập nhật nằm trong thân panel (mở/đóng tại chỗ). Đổi bố cục nhỏ trong panel đã có — planning quyết có cần mockup.
- Ảnh: $SP/anh/cong-viec/GV8-cap-nhat-tien-do.png, GV8-van-hanh-xong.png

### CV-13 · lỗi (chữ / dữ liệu) · Ghi Mini Test đạt → Case đóng với "Tiến bộ một phần" dù GV chọn "Tiến bộ rõ"
- Trang · vai: /cong-viec?viec=minitest:1 (Ghi Mini Test tại chỗ) · GVCN; xem lại ở hồ sơ HV Vương Bảo Ngọc
- Tái hiện: Ghi Mini Test · Vương Bảo Ngọc → Kết quả tuần **Tiến bộ rõ** + Tiến triển + Số buổi 2 + Mini Test 75 % + ngày 13/09 → Lưu kết quả cuối
  → panel Case: "Đã kết luận: **Tiến bộ một phần** — Mini Test 75% ≥ 70%"; hồ sơ HV: Writing/Speaking "Xong · Tiến bộ một phần". DB: `case_followups.outcome = improved`, `sos_cases.outcome = improved`.
- Thấy: cùng mã `improved` hai nghĩa — kết quả PA `improved` = "Tiến bộ rõ" (`shared/domain/cases.ts:880`), kết quả Case `improved` = "Tiến bộ một phần" (`:300`).
  Đóng Case do Mini Test gán cứng `outcome = 'improved'` (`server/src/normal/cuoiKhoa.ts:626`) → hiện mức thấp hơn mức GV chọn. Đúng ra: Case lấy đúng mức GV vừa chọn (hoặc ghi "Đạt Mini Test" không nói mức).
- Đề xuất: map kết quả tuần → kết quả Case khi tự đóng (`improved`→`much_better`, `partial`→`improved`), hoặc dùng lại mức GV chọn. Không cần mockup. (Ngoài khu CV một nửa — báo khu Case.)
- Ảnh: $SP/anh/cong-viec/GVCN-mini-test-sau.png, hoso-VuongBaoNgoc.png

### CV-14 · lỗi (nhất quán) · Nhắc ở Chờ duyệt › Nhắc việc: không hỏi lại, và không biết việc đã nhắc ở Hỗ trợ học viên
- Trang · vai: /cong-viec/cho-duyet › Nhắc việc · QL
- Tái hiện: QL → Hỗ trợ học viên › Nhắc tất cả (hỏi lại → Nhắc 8 GV, 43 chuông lúc 23:09, gồm "Xác nhận nguyên nhân · Writing Task 2 · Đỗ Minh Khôi" của Cao Khánh Linh, "Ghi nhận vi phạm · Vũ Hải Đăng"…)
  → Chờ duyệt › Nhắc việc: thẻ "Case quá hạn xác nhận nguyên nhân · Đỗ Minh Khôi" vẫn hiện nút **"Nhắc Cao Khánh Linh"** (chưa thấy đã nhắc); "Nhắc tất cả (**5**)" → bấm là gửi ngay
  (không hộp hỏi như bên Hỗ trợ), chỉ 2 chuông mới được tạo (3 thẻ đã nhắc từ trước) rồi thẻ mới đổi "Đã nhắc 23:09".
- Thấy: cùng một việc hai nơi báo trạng thái nhắc khác nhau; số "(5)" đếm cả việc đã nhắc; cùng thao tác "Nhắc tất cả" một nơi hỏi lại một nơi không (CLAUDE.md "cùng loại thao tác cùng vị trí, thứ tự, phản hồi").
- Nguyên nhân: `server/src/duyet/loaiYeuCau.ts:114-123` (`napNguoiNhac` dò chuông theo đúng `nhac:{viecKey}:{ngày}` — Hỗ trợ học viên nhắc bằng khoá dòng gộp `nhac:gop:cause:…`, máy chủ Nhắc thì đã coi là một qua `khoaCungViec`);
  `web/src/modules/duyet/HopChoDuyet.tsx:147-160,198` (gọi thẳng, không `ConfirmDialog`).
- Đề xuất: `napNguoiNhac` dò theo `khoaCungViec` (như `nhacViec`); thêm hộp hỏi giống Hỗ trợ học viên (hoặc bỏ hỏi ở cả hai). Không cần mockup.
- Ảnh: $SP/anh/cong-viec/QL-nhac-viec-tab.png

### CV-15 · lỗi nhỏ · Số trên đầu nhóm đếm cả dòng đã xong (giữ chỗ) → lệch ô "Tất cả"
- Trang · vai: /cong-viec · GVW (Cao Khánh Linh), mọi vai
- Tái hiện: GVW → "Xác nhận nguyên nhân · Writing Task 2 · MT1 · Trịnh Bảo Ngọc" → Không cần theo dõi… → Tình huống đơn lẻ → Gửi Quản lý duyệt → dòng mờ + gạch (đúng)
  → ô "Tất cả **6**", nhưng nhóm "Case học thuật **3**" + Chấm điểm 2 + Ý thức 1 + Vận hành 1 = 7 (Case học thuật thật còn 2).
- Thấy: đầu nhóm cộng dòng đã xong. Đúng ra: số chỉ từ `/my-work` (chú thích ở `HoTroHocVienTab.tsx:106-108` cũng ghi vậy); CLAUDE.md "việc đã xong không nơi nào còn báo chờ".
- Nguyên nhân: `HoTroHocVienTab.tsx:121-122` `dsNhom = gomNhomViec(hienThi …)` → `NhomViec` dùng `g.n` (`NhomViec.tsx:40`) của danh sách vẽ (có dòng giữ chỗ).
- Đề xuất: `dem` đầu nhóm lấy từ `gomNhomViec(cuoiItems)` (máy chủ), dòng giữ chỗ chỉ để vẽ. Không cần mockup.
- Ảnh: $SP/anh/cong-viec/GVW-khong-theo-doi-sau.png

### CV-16 · thừa · Việc Vận hành (mgmt) của QL hiện hai nơi: Hỗ trợ học viên › nhóm Vận hành VÀ tab Vận hành
- Trang · vai: /cong-viec?nguoi=toi và /cong-viec/van-hanh · QL
- Tái hiện: QL Của tôi → nhóm "Vận hành" có "Đổi phần mềm chấm Speaking", "Tuyển thêm 2 tutor…", "Sưu tầm đề Speaking…" (dòng phụ lặp lại tên + "Công việc quản lý") — đúng 3 việc ở tab Vận hành.
  "Lọc thêm › Của một GV" thì bỏ hẳn mgmt (`viecCuaNguoi`, `mywork.ts:1344-1347` "không thuộc Hỗ trợ học viên").
- Đề xuất: người có tab Vận hành (QL / Quản trị) không lặp `mgmt` ở Hỗ trợ học viên; GV (không có tab) giữ như nay. Không cần mockup.

### CV-17 · gợi ý (gom các điểm nhỏ, không chặn)
- a. Tiêu đề gom lớp thường chỉ một chữ cái: "Xác nhận nguyên nhân · **L**" / "· P" / "· S" (`mywork.ts:802-807` `tenMonNgan`) trong khi "Thêm PA học thuật **Listening**", "… Grammar + Vocabulary" cùng lớp FOU dùng tên đủ — một khái niệm một tên.
- b. "n **nhóm việc**" ở dòng phạm vi = số dòng, trong khi "Lọc thêm › **Nhóm việc**" = 4 nhóm (Chấm điểm…); đổi "n việc" cho khỏi lẫn (mockup có chữ "nhóm việc" — chủ SP quyết).
- c. Em trong dòng gộp mà mở trang khác (Ghi nhận vi phạm mới → hồ sơ lớp tab Ý thức; Báo phụ huynh qua TVV) không có dấu ↗ (chỉ dòng cấp 1 có) — bấm là rời trang bất ngờ (`NhomViec.tsx:53` `moTrang={!it.con && …}`, `WorkList.tsx` `DongCon`).
- d. Panel gom sau "Không cần theo dõi… → Gửi Quản lý duyệt": thân panel trống, chỉ toast — nên có dòng "✓ Đã gửi QL duyệt · xem ở Yêu cầu của tôi" như khi xác nhận.
- e. "✓ Đã xác nhận 1 em · PA Học Tutor chạy từ **14/09**" trong khi ô ngay dưới ghi "Tuần này · **W3 SEP**" — dùng mã tuần (CLAUDE.md "ưu tiên mã tuần").
- f. Rỗng mà không lọc gì vẫn ghi "Không có việc nào khớp bộ lọc" (Admin CP trước khi có việc) — nên "Không có việc nào".
- g. Admin chỉ có một nhóm (Chấm điểm) mà nhóm gập sẵn khi không có quá hạn → phải bấm thêm một lần; một nhóm thì mở sẵn.
- h. "Nhắc tất cả" gửi mỗi việc một chuông (Trần Ngọc Hà nhận 15 chuông cùng lúc) — cân nhắc gom một chuông / GV.
- i. Việc Vận hành "Tạm ngưng" (có ngày xem lại) vẫn "⚠ quá hạn 3 ngày" ở cả Hỗ trợ học viên và Vận hành — câu hỏi cho chủ SP: tạm ngưng có dừng hạn không.
- j. 375 QL: lọc chiếm 3 hàng (Của tôi/Của GV · hạn · Lọc thêm) — có thể gộp một hàng vuốt.
- k. Hồ sơ HV "VIỆC CỦA TÔI: Kết quả tuần W3 SEP · hạn hết T2 21/09" hiện ngay, còn Công việc chỉ hiện việc đó từ Chủ nhật (`mywork.ts:506-508`) — hai nơi hai cửa sổ cho cùng một việc.
- l. (ngoài khu, thấy khi đi từ Công việc) Hộp Lộ trình: chọn "Lên BE" + lớp đích, ô "Tuần bắt đầu" để trống → "Tuần bắt đầu phải từ tuần sau trở đi"; nên điền sẵn tuần sau (luật cứng "mặc định làm điều hiển nhiên").
  Hồ sơ lớp MB FOU 24: đầu trang "Final Test: 0/1 em có đủ điểm" nhưng khối Điểm "Final Test 1/1 đủ điểm" (đếm hai tập em khác nhau).
- m. Thêm PA đòi Nội dung ≥ 8 ký tự, Xác nhận PA quy chế (cùng ô "Nội dung") ≥ 15 — hai ngưỡng cho cùng ô (luật cũ, chỉ ghi lại).
