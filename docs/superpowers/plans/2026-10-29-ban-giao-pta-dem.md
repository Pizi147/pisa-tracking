# Bàn giao PTA Plan — đêm 29/10/2026

Đọc sau `2026-10-28-ban-giao-pta-toi.md`. Session còn giữ cho sáng: ra-luong (trả lời Q-RL1…6), ra-ui (sửa mockup #688), don-may (chủ SP archive).

## 0. Deploy sáng 30/10 (chủ SP đã nói deploy sau đợt này)
- Main hiện `d5cb74e8f` (30/10). Migration mới từ lần deploy cuối (`6d2eecc6`, DB `pisatracking-261028`): **`prBandQuyDoi`** (#666, bảng `bang_quy_doi`) + **`prThungRac`** (#700, bảng `thung_rac` — migrate TRƯỚC khi đổi biến Netlify). Các tệp migrate cũ khác chỉ sửa chú thích (#689). Không `kiem-truoc` nào. `netlify.toml` không đổi.
- Các bước: `DEPLOY_2026-10.md` "Cách đang dùng" 1–5 (sao lưu → `mig.sqlite` + `npm run migrate` hai lần → DB mới `pisatracking-261030` → `khoi-phuc` → đổi biến Netlify production → `env:get` → `netlify deploy --build --prod`). Giữ DB `261028` ~1 tuần.
- Kiểm sau deploy: Quản trị › Bảng quy đổi band có v1 + v2; GV lớp thường không còn nút dời lịch môn tay (#679, Q13); Công việc QL đếm bài chấm chéo đúng.

## 1. Đã merge 29/10
- #674 LUOT-HAN-MO, #672 KHAI-BAC-LO (check đầy đủ chung xanh, tốc độ 58/58).
- #673 KHT-GON (check đầy đủ: 4584/4584; tốc độ đỏ GVCN 16 > 15 → session gộp hai câu lượt thành một, tocDo riêng 58/58; run.js chưa chạy lại sau lần sửa đó — check chung đợt sau phủ).
- Main sau đợt: `b5742bd13`. Đêm merge thêm: #677 (CODE_MAP), #676 #678 (check 4590/4590), #679 #684 #680 #681 #682 #683 #685 #687 (check 4597/4597, tốc độ 58/58). Main `019bcbb64`. #686 RA-LUONG-3 (chống lặp MT mới, chuông Case giao, quét thứ Hai) sửa 10 phép đỏ rồi merge (check 4600/4600). Main `f6dca6aa1`. #689 GON-MA-3 xoá mã chết (99 tệp, −1 646 dòng; check 3 đỏ do phép kiểm / tài liệu trỏ mã đã xoá → sửa, chạy riêng đạt). Main `13e6e27d3`. #690 GON-MA-2 merge (PTA check 4597/4597, tốc độ 58, 23 phút). Main `50b4259b1`. CACH-DUNG: tối đa 2 check (check-1 session, check-3 PTA).

## 2. Luật mới 29/10
- Chủ SP nhắc: mockup = chuẩn HÌNH ẢNH (học sát); thao tác / nút / luồng đã có giữ, không bỏ vì mockup không vẽ.
- Đêm 29/10 chủ SP cho tự merge PR giao diện khi ảnh cặp ≥ 90 % KHỚP + đúng luật + check xanh (đổi bố cục / luật vẫn chờ sáng).
- Graphify: chủ SP hỏi, PTA khuyên không cài (CODE_MAP làm tốt hơn việc "màn → tệp"; hook tốn token mọi phiên). Chưa cài.

## 3. Rà soát đêm (4 session, linked từ PTA Plan)
- gon-ma: CODE_MAP + check nhanh (check ~28,5 phút, run.js 93 %) + mã chết.
- ra-luong: mọi luồng theo vai, lỗi / chặn cứng / luật.
- ra-ui: audit + critique mọi trang / panel / nút, 1440 / 375, tối / sáng.
- don-may: dọn ổ (~22 GB an toàn), báo cáo `C:/Users/Admin/AppData/Local/Temp/claude/don-may-29-10.md`.

## 4. Việc để sau / [XM] chờ chủ SP
- #673 [XM]: (1) nút "Xếp nhiều MT…" ở chế độ tối — mockup tô kín xanh nhạt, web giữ nút chính tối (D4); (2) công tắc "Fast Track · n lớp" (`CongTacKhung`) khác mockup; (3) `HopKyNang`: chip trạng thái viên nền nhạt, nút "Xóa" cùng hàng Đóng / Lưu — critique đề nghị dời vào ⋯.
- #673 khác nhỏ: lượt đã huỷ chỉ chữ "đã huỷ" (mockup gạch tuần cũ — máy chủ không gửi tuần lượt huỷ).
- Giao ra-ui: 375 chân panel (Huỷ | Lưu cùng hàng, #672); 375 Kế hoạch Test "Lọc ▾" rơi hàng; "+ MT ▾" xa cột cuối.
- Từ bàn giao 28/10: chủ SP tự bật Dịch AI; P2 còn lại #673 (375 hàng công cụ, select chi nhánh GV).
- #679 (RA-LUONG-1) mục 3: áp R14 / 14/10-Q13 "dời lịch môn lớp thường chỉ QL" vào mã (trước đó GVCN / GVBM lớp thường vẫn dời tay; T11 cũ "tự do" bị Q13 thay; N23 giữ). PTA merge theo luật đã chốt — báo chủ SP sáng 30/10 vì GV sẽ thấy khác.
- ra-luong Q-RL1: môn "Không dự thi" làm kết quả lớp thường mãi "chưa đủ môn" — chờ chủ SP (ra-luong.md mục 6).
- EN-HOSO (prEn) đỏ khi chạy riêng: chữ GV nhập "PA Tutor 1-1…" lọt tomTat EN — check đầy đủ đạt (thứ tự); để sau.
- ra-luong Q-RL2: xoá HV / Case / PA / vi phạm / tệp, Kết thúc PA, Bỏ việc Báo PH, Duyệt-Từ chối chưa có Hoàn tác (trái luật "không khoá cứng") — khuyến nghị một đợt "xoá mềm + Hoàn tác + Khôi phục". Q-RL3: Phối hợp SOS của lộ trình cũ khi mở Lộ trình mới. Chờ chủ SP.
- ra-luong ghi nhận: 2 lần văng phiên (401 khi phiên còn), chưa tái hiện.
- ra-luong Q-RL4 (quan trọng): Chuyển lớp MỘT em ở tuần trước Final (Chốt lộ trình đã mở) ra lệnh "giữa khoá" → Lên FT không có MT0 / Xét lại, khác trang Cuối khoá. Q-RL5: MT0 khi Lên FT sau tuần Final sinh ra đã quá hạn. Q-RL6: Xét lại "Học lại" chỉ cùng chi nhánh, kẹt.
- ra-ui chờ chủ SP: (2) "Chờ bạn duyệt" QL lên đầu cột trái (bố cục); (5) tab "Thi thật" trong "Kết quả Test" (G2); (8) QL mặc định "Của tôi" hay "Tất cả". Critique TRƯỚC 23 màn: 25–32/40, chưa màn nào ≥ 35.
- **#688 MOCKUP-V8 (chờ chủ SP duyệt, chưa merge):** 4 mockup đề xuất bố cục `thiet-ke/v8/` — Hồ sơ lớp 25 → 33, Tổng quan 27–29 → 33, Công việc QL 26 → 35, Phân tích 26–30 → 35 (critique tự chấm). `thiet-ke/v8/README.md` có bảng điểm + 13 câu hỏi gộp (gồm ra-ui 2 / 5 / 8). Điểm web 23 màn trước / sau sửa nhỏ: `docs/superpowers/specs/2026-10-29-ra-soat-dem/diem-critique.md` (28,3 → 28,9).
- #689 GON-MA-3 xoá 13 `ops/kiemTruoc*` + 4 `scripts/kiem-truoc-*.mjs` (đều deploy trước 6d2eecc6): `DEPLOY_2026-10.md` dòng 14, 38 còn nhắc tên cũ — là lịch sử, sửa khi đụng. Deploy 30/10 (migrate `migratePrBandQuyDoi`) không cần kiem-truoc nào.
- DON-MAY xong: ổ D 53,4 → 64,9 GB trống, ổ C 29,5 → 40,9 GB, RAM trống 0,9 → 5,7 GB (xoá 35 worktree thừa, 25 nhánh đã merge, cache npm / Temp cũ). **Chủ SP quyết:** worktree `claude-6c-nho` (687 MB, có `.anh6c`), nhánh `pta-dot4` và `compassionate-gauss-…-pta` (chưa merge), ứng dụng Opera / NVIDIA / Steam / Zoom / Zalo / Discord ~14 GB. Báo cáo `C:/Users/Admin/AppData/Local/Temp/claude/don-may-29-10.md`.
- #690 GON-MA-2 check song song (`PISA_SO_NHOM` mặc định 2, `=1` tuần tự; `PISA_CHI_TEP=a,b` chạy riêng vài tệp ~15 s): check ~26 → 18,6 phút (−30–35 %), đỉnh RAM ~6,2 GB → đề xuất tối đa 2 check toàn máy. Muốn ≤ 50 % phải sửa phép kiểm tự dựng dữ liệu (gon-ma.md mục 3, đề xuất 1) — **chờ chủ SP chốt** (việc lớn, đụng nhiều tệp kiểm).
- (sáng 30/10) DESIGN.md dòng ~198 ghi chữ phụ "≥ 7:1", phép kiểm dùng 4,5:1; chữ mờ chế độ sáng đo 5,0:1 — sửa DESIGN.md cho khớp (planning) hoặc nâng màu, chờ chủ SP chọn.
- (30/10) [XM] #698: lỗi tải một khối dùng ErrorState chung, mockup v8 vẽ dải đỏ — đổi là đổi mọi màn → PR riêng nếu chủ SP muốn.
- (30/10) #692 MENU-DONG, #694 NEN-V8 merge (check 4597/4597); #695 RA-LUONG-4 (Q4, Q-RL1/3/6) merge — check PTA lần đầu 31 ✗ (XL-2 "database table is locked" dây chuyền + TEN-1 + sosV3), session sửa TEN-1 / sosV3, check đầy đủ của session 4601/4601; XL-2 không tái hiện → **theo dõi chạy song song #690 có thể chập chờn khoá bảng** (nếu lặp lại: thử `PISA_SO_NHOM=1`, báo GON-MA-sau).
- Chờ chủ SP duyệt ảnh: #696 V8-CV, #697 V8-HSL, #698 V8-TQ; V8-PT sắp mở. Q-RL2 (xoá mềm + Hoàn tác) PR riêng sau V8.
- (30/10) Q-RL2 PTA chốt theo kế hoạch ra-luong `q-rl2-ke-hoach.md`: bảng thùng rác `thung_rac` (chụp JSON cùng giao dịch, xoá như cũ), giữ 30 ngày, Khôi phục ở Quản trị › Đã xoá + /hoc-vien/luu-tru, `lich_thi` để ngoài; 3 PR Q-RL2a (Case/PA/vi phạm/tệp + khung, migrate thêm bảng) → 2b (xoá học viên) → 2c (đảo trạng thái, migrate thêm cột *_cu).
- (30/10) Chủ SP duyệt ảnh 4 màn v8. Merge #696 V8-CV, #697 V8-HSL, #698 V8-TQ (check 4602/4602, tốc độ 58). Main `519158a32`. #699 V8-PT đang check.
- ⚠ **Deploy sau #700 merge có thêm migrate `migratePrThungRac`** (CREATE TABLE `thung_rac` + 2 chỉ mục) — migrate TRƯỚC khi đổi biến Netlify, không thì Xoá Case / PA / vi phạm / gỡ tệp báo 500.
- (30/10) #700 Q-RL2a rà sâu: 7 lỗi (2 CAO: id dùng lại → khôi phục vào nhầm Case / vượt quyền; bảng lá trùng id → khôi phục hầu như luôn 409) — trả RA-LUONG sửa trước merge.
- (30/10) #699 V8-PT merge (check song song đỏ XL-2 chập chờn; `PISA_SO_NHOM=1` 4602/4602). Main `9cb24df98` — đủ 4 màn v8. RA-UI đang tìm gốc XL-2 "database table is locked" (PR KIEM-CHAP-CHON). Tới khi sửa: check song song đỏ đúng chuỗi XL-* → chạy lại `PISA_SO_NHOM=1`.
- (30/10) #700 + #701 (thùng rác) sửa 7 lỗi rà sâu; check PTA tuần tự 4616/4616. Chờ ảnh mới + chủ SP duyệt tab "Đã xoá". Deploy sau đó có migrate `migratePrThungRac`.
- (30/10) #700 + #701 thùng rác merge (chủ SP duyệt ảnh). Main `d5cb74e8f`. RA-LUONG làm Q-RL2c.
- (30/10) Chủ SP: chờ Q-RL2c xong rồi deploy một lần (3 migrate: prBandQuyDoi, prThungRac, + migrate của Q-RL2c).
- (30/10) #702 KIEM-CHAP-CHON merge: XL-2 / XL-5c giả DB cũ trên bản sao riêng (gốc 'database table is locked' khi có câu dở trên kết nối chung). Nối tiếp: prCl, prOv13k, prOv4a cũng DDL trên DB chung.
- (30/10) Chủ SP: panel Lịch thi (hồ sơ lớp) — lỗi lọc lớp lẫn lớp khác; mặc định thi gần nhất trước; KHÔNG tách Đã chốt / Dự kiến, một danh sách (em chỉ có tháng dự kiến cũng vào). Giao RA-LUONG. Chép vào plan.md 1.6 khi soạn luật đợt sau.
- (30/10) #705 Q-RL2c mở — ⚠ migrate thứ 3 cho deploy: `migratePrGhiDao` (bảng `ghi_dao`). Đang rà sâu + check.
- (30/10) #705 rà sâu: 3 lỗi (Huỷ từ chối Ý thức sau khi GVCN xử lý lại → 2 lần xử lý; Huỷ duyệt Không cần theo dõi → PA kẹt mất thẻ; Huỷ duyệt sửa Target sau khi có điểm) — trả RA-LUONG sửa.
- (30/10) #707 S1 (Tổng quan GV tính một lần, napBai thu hẹp) — ⚠ migrate thứ 4: `prS1` (chỉ mục idx_score_examiner). Chờ check chung sau #705/#706.
- (30/10) Merge xong #707–#715 (trừ không). Main `3a38444ad`. Deploy chủ SP chạy: 5 migrate prBandQuyDoi, prThungRac, prGhiDao, prS1, prPhanCongGv; DB mới pisatracking-261030.
- **Deploy 30/10 23:40** (chủ SP): main `3a38444ad`, DB `pisatracking-261030`, 5 migrate; bật Dịch AI (gpt-5.4, token tặng). Giữ DB 261028 ~1 tuần. Theo dõi Turso Top Queries vài ngày.
