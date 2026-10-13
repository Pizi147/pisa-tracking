> Phụ lục rà soát 13–14/10 (báo cáo agent, planning đã đối chiếu các mục chặn). Đường ảnh `$SP/anh/...` chỉ có trên máy planning — tái hiện theo bước ghi trong mục.

# Rà chức năng — TỔNG QUAN + thanh đầu (mã TQ, môi trường N=1, ngày demo 14/09/2026)

## Đã đi (cập nhật dần)
| Trang | Vai | Thao tác đã thử |
|---|---|---|
| `/` Việc hôm nay (tab đầu theo vai) | QL, QT, QLCP, ADMIN, GVCN, GVBM, GVW, TVV, CX | mở 1440 tối, đọc chữ toàn trang; 0 lỗi API / console ở mọi vai |
| `/` mọi số bấm được (ô số, Cần xử lý, bảng chi nhánh/lớp, Lớp tôi dạy) | QL (FT 38 số, Lớp thường 57), QT (FT 42, LT 30), QLCP 16, CX 36, GVCN 7+18, GVBM 11+17, GVW 10 | bấm từng số → panel: **số = số dòng ở mọi số** (không lệch) |
| Dải Chờ duyệt: 4 chip + Quá hạn + "Mở hộp duyệt" | QL, QT, QT `?cn=1`, QLCP | đếm thẻ ở hộp: khớp hết; = badge Công việc |
| Cần xử lý: Xem và nhắc ×2, Lộ trình tiếp theo, Kế hoạch Test, Mở Vận hành, Sửa phân công | QL, QT | mở đích, đếm dòng (TQ-1, 2, 3, 10, 13) |
| Điểm đáng chú ý (3 + 1 điểm), "Cách tính", công tắc Fast Track / Lớp thường | QL | panel khớp số; tooltip đọc đúng sổ |
| Lịch sắp tới: 3 tab, "+ n lớp", "Hết khoá", tên lớp, "Xem toàn bộ lịch ›" | QL (FT, LT), QT (LT, FT `cn=1`) | Kế hoạch Test đúng tuần / CN / chương trình, số lớp khớp |
| Bảng chi nhánh: ▸ mở lớp, bấm tên CN, Theo giáo viên | QT, CX | CX không có "Theo giáo viên" (đúng); bảng GV khớp Lớp tôi dạy |
| Quay lại từ hồ sơ lớp về Tổng quan | QT | giữ `lich-tuan`, `nhip-mo`, vị trí cuộn (đúng) |
| Admin "Mock Test": 4 ô + GV chấm quá hạn | ADMIN (CP) | CP không có dữ liệu → 4 ô = 0; bấm 4 ô mở đúng đích; không thử được Nhắc |
| TVV "Học viên của tôi" 4 ô, CX "Số liệu" 4 ô | TVV, CX | số ô = "Đang xem … n học viên" ở Học viên & Lớp |
| GV Việc của tôi: bấm 17 dòng (dòng gộp: em đầu) + Yêu cầu của tôi | GVCN, (GVBM, GVW đọc) | đích đúng, 0 lỗi (TQ-5); số quá hạn / hôm nay / Tất cả = Công việc; badge = Quá hạn |
| Thông báo: nhóm Cần làm / Để biết, bấm 1 thông báo mỗi loại, Đánh dấu đã đọc | QL, QT, GVCN, GVBM | TQ-6, TQ-7; Đánh dấu đã đọc → 0, nút khoá |
| Tìm học viên / lớp (2 ký tự, "ft101", không thấy, Enter) · sáng/tối · menu tài khoản · `/ho-so-ca-nhan` · Hồ sơ GV · Quản trị | QL, GVCN, TVV, QT, GVW | đúng; TQ-15 |
| Đường cấm (gõ URL) `/test`, `/cong-viec`, `/quan-tri`, `/phan-tich`, `/giao-vien/7` + quét 18 API | TVV, CX, ADMIN, GVCN | TVV/CX không có Test/Công việc (UI + 403); TQ-9, TQ-16 |
| Tab Phân tích mở được | QL, QT, QLCP, ADMIN, TVV, CX | mở được, không lỗi; CX không có "Giáo viên" |
| 375 sáng: thanh dưới, tràn ngang, "Xem hết", chuông, tìm | QL, GVCN, TVV | không tràn ngang; "Xem hết (17)" = chip Đến hết tuần 17; TQ-14 |
| Đổi góc nhìn | — | demo KHÔNG có QL/QT nhiều vai; thêm vai vào DB riêng bị chặn quyền → chỉ đọc mã + API (TQ-8) |

## Phát hiện

### TQ-1 · lỗi · "58 bài quá hạn chưa nhập điểm" → "Xem và nhắc" ra "9 nhóm việc · 100 bài cần chấm"; dòng quá hạn gộp cả bài chưa quá hạn
- Trang · vai: `/` → Công việc · QL (MB) (QT cũng vậy: 65 bài)
- Tái hiện: `/` QL → Cần xử lý dòng "58 bài quá hạn chưa nhập điểm" → "Xem và nhắc" → `/cong-viec?nhom=cham-diem&loc=qua-han&khung=tat-ca`.
- Thấy: dòng phạm vi "9 nhóm việc · **100** bài cần chấm"; cộng bài quá hạn ở từng việc con = 64; chỉ số Tổng quan = **58** (= `/attempts?classId=3` đếm ô `overdue` của MB FT 101: 49). Ba số cho cùng một tập.
  Hai nguyên nhân: (a) dòng phạm vi cộng mọi bài của dòng quá hạn, kể cả việc con MT3 chưa đến hạn (`soBai` cả dòng); (b) việc con "MT1 · Listening, Reading · 8 em · quá hạn 68 ngày" gộp cả em **thi lại MT1 tuần này** (Hồ Ngọc Diệp, MT1 W3 SEP, hạn 23/09) vào cùng một xô với em quá hạn từ W1 JUL — nên bấm Nhắc là nhắc cả bài chưa trễ. Tương tự MT2 Speaking gộp Lý Minh Châu (hạn 16/09).
- Đúng ra: cùng một số "bài quá hạn chưa nhập điểm" ở Tổng quan và Công việc lọc Quá hạn (CLAUDE.md "cùng nguồn, cùng hàm"; việc chưa trễ không được báo quá hạn).
- Nguyên nhân: `server/src/worklist/mywork.ts:390` khoá xô `classId|kind|attemptNo|skill|owner` không có tuần/hạn; `:405-407` + `:426` dòng quá hạn nếu MỘT bài quá hạn, `due` = hạn sớm nhất. `shared/domain/congViec.ts:79-82` `demPhamVi` cộng `soBai` mọi việc con của dòng.
  Admin "Ô điểm chưa nhập · n quá hạn" (`server/src/worklist/tongQuanMt.ts:55-56`) dùng cùng cách đếm này → cũng lệch với chỉ số `bai-qua-han-nhap-diem`.
- Đề xuất: tách xô theo hạn (thêm `due`/tuần vào khoá `:390`) để việc con quá hạn chỉ chứa bài quá hạn; dòng phạm vi khi lọc Quá hạn chỉ cộng bài `overdue` (hoặc đổi chữ "bài cần chấm" → "bài cần chấm, trong đó m quá hạn"). Không cần mockup.
- Ảnh: $SP/anh/tong-quan/02-QL-cv-chamdiem-quahan.png

### TQ-2 · lỗi · "1 PA chưa có Kết quả" → "Xem và nhắc" ra 5 việc Case học thuật quá hạn (chỉ 1 là Kết quả PA)
- Trang · vai: `/` → Công việc · QL (MB); QT tương tự (4 PA → cả nhóm Case học thuật)
- Tái hiện: `/` QL → dòng "1 PA chưa có Kết quả tuần W1 SEP" → "Xem và nhắc" → `/cong-viec?nhom=case-hoc-thuat&loc=qua-han&khung=tat-ca`.
- Thấy: "5 nhóm việc · 6 học viên": Thêm PA (Dương Ngọc Ánh), Kết quả PA (Lý Minh Châu), Thiếu PA · MB FT 101 · 2 em, 2 × Xác nhận nguyên nhân. Đúng ra: mở ra đúng 1 việc "Kết quả PA" (số ở ô = số dòng nơi mở — BRIEF/CLAUDE.md).
- Nguyên nhân: `server/src/worklist/tongQuan.ts:121` `den` chỉ lọc nhóm `case-hoc-thuat`; Công việc không có lọc theo loại việc (`HoTroHocVienTab.tsx:67` quy `loai=` về nhóm).
- Đề xuất: thêm lọc loại việc trên URL (`loai=ghi_ket_qua_pa` lọc đúng loại, không quy về nhóm) hoặc đổi chữ nút thành "Mở Case học thuật quá hạn". Không cần mockup (đổi chữ / lọc).
- Ảnh: $SP/anh/tong-quan/03-QL-cv-case-quahan.png

### TQ-3 · lỗi · Panel "n lớp cần Chốt lộ trình" mở hồ sơ lớp ở **Sửa phân công**, không phải Lộ trình tiếp theo (và mang chữ "thiếu P")
- Trang · vai: `/` Cần xử lý · QL (MB), QT
- Tái hiện: `/` QL → dòng "6 lớp cần Chốt lộ trình" → nút "Lộ trình tiếp theo" → panel "6 lớp — Lớp cần Chốt lộ trình" → bấm "MB FOU 12".
- Thấy: mọi dòng panel là `/hoc-vien/lop/{id}?viec=phan-cong` → hồ sơ lớp mở panel **Thông tin lớp, Phân công đang sửa** ("Huỷ thay đổi · Lưu phân công"). QT: dòng "UB FOU 07 · thiếu P" (chữ của chỉ số lớp thiếu GV) lọt vào danh sách Chốt lộ trình.
  Đúng ra: dòng lớp mở `?viec=lo-trinh-ca-lop` (như việc "Chốt lộ trình · lớp" ở Công việc và khi chỉ 1 lớp — `tongQuan.ts:133`).
- Nguyên nhân: `server/src/worklist/metrics.ts:215-221` — mọi chỉ số đơn vị `lop` dựng dòng bằng luật của "lớp thiếu GV môn" (`href …?viec=phan-cong`, `sub: thiếu {môn}`); `lop-chua-chot-len-ft` (`:691-693`) cũng là đơn vị `lop`.
- Đề xuất: `rowsFor('lop')` nhận mã chỉ số (hoặc tách đơn vị `lop-chot`) để `lop-chua-chot-len-ft` trả `href ?viec=lo-trinh-ca-lop`, `sub` = "n em chưa chọn · hạn …". Không cần mockup.
- Ảnh: $SP/anh/tong-quan/06-QL-cxl-2-dongdau.png

### TQ-4 · lỗi · Speaking MT quá hạn: Tổng quan ghi "GV chấm chéo", Công việc ghi "chưa ai phụ trách"
- Trang · vai: `/` → Công việc · QL (MB)
- Tái hiện: `/` Cần xử lý "58 bài quá hạn…" cột Người phụ trách "… +1 · GV chấm chéo" → "Xem và nhắc" → dòng "Nhập điểm · MB FT 101 · 3 việc · 2 việc quá hạn · **chưa ai phụ trách**" và "Nhập điểm Speaking · Lớp MB FT 105 · MT1 · 4 HV · **chưa ai phụ trách**".
- Thấy: một việc hai tên; máy chủ đã gửi `statusLabel: "GV chấm chéo"` nhưng web bỏ qua. Đúng ra: "GV chấm chéo" (T18 PR-LT3: không phải "chưa phân công"; CLAUDE.md "một khái niệm một tên").
- Nguyên nhân: `web/src/modules/worklist/WorkList.tsx:74` — `ownerId === null` → "chưa ai phụ trách", không xét `statusLabel`/chấm chéo.
- Đề xuất: dòng chấm chéo (`statusLabel === 'GV chấm chéo'`) hiện "GV chấm chéo". Không cần mockup.
- Ảnh: $SP/anh/tong-quan/02-QL-cv-chamdiem-quahan.png

### TQ-5 · thừa · GV bấm "Thêm PA" ở Việc hôm nay → hồ sơ HV không mở Case (dải "Việc của tôi" lại chỉ việc khác)
- Trang · vai: `/` Việc hôm nay · GVCN (Trần Ngọc Hà); cùng href ở mọi nơi dùng `href` của việc `no_plan`
- Tái hiện: `/` GVCN → dòng "Thêm PA học thuật Reading · Dương Ngọc Ánh · MB FOU 12" → nút "Thêm PA".
- Thấy: `/hoc-vien/11` mở hồ sơ, không panel; dải "VIỆC CỦA TÔI" đầu hồ sơ chỉ "Kết quả tuần W2 SEP · PA Nghe lại…" (việc Listening khác); phải tự tìm hàng Reading rồi mở Case → Thêm PA.
  "Kết quả PA" cùng khối thì mở thẳng panel (`/hoc-vien/50?case=41&pa=45&viec=ghi-ket-qua`). Đúng ra: Thêm PA mở Case đúng kỹ năng ở chế độ thêm PA (CLAUDE.md "xử lý tại chỗ", ít thao tác).
- Nguyên nhân: `server/src/worklist/mywork.ts:733` `href: /hoc-vien/${id}` (thiếu `?case=${c.id}&viec=them-pa`; `NganCase.tsx:241` đã đọc `viec=them-pa`).
- Đề xuất: đổi href thành `/hoc-vien/{id}?case={caseId}&viec=them-pa`. Không cần mockup.
- Ảnh: $SP/anh/tong-quan/09-GVCN-thempa.png

### TQ-6 · lỗi · Chuông "Báo phụ huynh qua TVV · {em} · Progress Test không đạt …" (Cần làm) bấm không tới đâu
- Trang · vai: thanh đầu › Thông báo · GVCN (7 thông báo loại này)
- Tái hiện: đăng nhập GVCN → Thông báo → nhóm "Cần làm" → "Báo phụ huynh qua TVV · Trương Gia Bảo · Progress Test không đạt G+V".
- Thấy: không có dòng xanh "bấm tới đâu", bấm chỉ đánh dấu đã đọc rồi đóng, vẫn ở `/`. Thân thông báo bảo "xong thì đánh dấu đã làm" nhưng không chỉ chỗ.
  Việc thật có ở Công việc: "Báo phụ huynh qua TVV · MB FOU 15 · 4 em" → `/hoc-vien/81?tab=y-thuc&sub=phoi-hop`. Đúng ra: chuông Cần làm mở đúng chỗ làm việc (duongHoSo.ts "mỗi loại về đúng chỗ LÀM ĐƯỢC VIỆC").
- Nguyên nhân: `shared/domain/duongHoSo.ts:185-190` — `assessment_attempt` chỉ xử lý `sos`, `schedule_move`, `tu_doi_lich`, `huy_vang`; `phoi_hop` (có trong `LOAI_CAN_LAM` `:142`) rơi về `null`.
- Đề xuất: thêm nhánh `phoi_hop` → hồ sơ em `?tab=y-thuc&sub=phoi-hop`; và tính `con_viec` cho loại này (xem TQ-7). Không cần mockup.
- Ảnh: (không đổi trang) $SP/anh/tong-quan/11-GVCN-thongbao.png

### TQ-7 · lỗi · Chuông "Cần làm" còn giữ việc đã xong ("Case chờ xác nhận nguyên nhân" từ tháng 7)
- Trang · vai: thanh đầu › Thông báo · GVCN (Cần làm 28), GVBM
- Tái hiện: GVCN → Thông báo → Cần làm có "Case chờ xác nhận nguyên nhân · Reading · Nguyễn Minh An — Hạn 08/07", "… Listening · Lê Quang Huy — Hạn 08/07 / 19/08", "… Trần Thu Hà", "… Phạm Bảo Ngọc".
- Thấy: cả 5 tín hiệu (`case_signals` id 1, 2, 5, 6, 7) đã `status = linked` (đã xác minh, đã vào Case) nhưng vẫn nằm nhóm **Cần làm**; bấm → `/hoc-vien/{id}` (không mở Case 10 dù tín hiệu có `case_id`).
  Đúng ra: việc đã xong không còn báo chờ ở đâu (CLAUDE.md); chuông Cần làm chỉ chứa việc còn mở (PR-VAI-a Q18).
- Nguyên nhân: `server/src/platform/thongBao.ts:38-52` chỉ tính `con_viec` cho `sos_case` và `yeu_cau_duyet`; `case_signal`/`sos`, `assessment_attempt`/`phoi_hop` luôn `null` → `nhomThongBao` (`duongHoSo.ts:146-148`) xếp theo loại → mãi "Cần làm". `duongHoSo.ts:183-184` `case_signal` không mang `caseId`.
- Đề xuất: thêm `con_viec` cho `case_signal` (`cs.status` còn chờ → 1, `linked/withdrawn` → 0) và `phoi_hop` (việc phối hợp còn mở); `case_signal` có `case_id` → mở `?case=`. Không cần mockup.
- Ảnh: $SP/anh/tong-quan/11-GVCN-thongbao.png

### TQ-8 · lỗi (chỉ đọc mã, chưa tái hiện) · QL / Quản trị kiêm TVV: Tổng quan ở vai gốc chỉ còn "Học viên của tôi"
- Trang · vai: `/` · tài khoản QL + TVV (demo KHÔNG có ai nhiều vai — kiểm 15 user QL/QT, mỗi người 1 vai; thêm vai vào DB riêng bị chặn quyền nên không dựng được)
- Thấy (đọc mã): `server/src/platform/nav.ts:30` `hvCuaToi = roleKeys.includes('consultant')`; `web/src/modules/worklist/OverviewPage.tsx:52` kiểm `nav.hvCuaToi` TRƯỚC mọi nhánh → ở vai gốc (làm việc bằng mọi vai) QL kiêm TVV mất Chờ duyệt, Cần xử lý, Số liệu.
  Đúng ra: vai gốc giữ Tổng quan QL; chỉ khi chọn Góc nhìn TVV mới ra "Học viên của tôi" (đặc tả OV §2 "Đổi góc nhìn").
- Đề xuất: điều kiện TVV ở `OverviewPage.tsx:52` thêm `&& !laVaiQuanLy(session.roles)` (hoặc nav.hvCuaToi chỉ khi không có vai QL/QT). Không cần mockup.
- API đã thử: `PUT /session/goc-nhin` với QL, Quản trị, GVCN (một vai) → 403 "Chỉ Quản lý hoặc Quản trị hệ thống nắm từ hai vai trở lên mới đổi được góc nhìn." (đúng); `role: 5` → 400. Máy chủ lọc quyền theo vai đang chọn ở `server/src/auth.ts:79-88` (lọc `grants` → `can()` tự đúng) — đọc mã thấy đúng, chưa bấm được dải "Góc nhìn" / "Về …".

### TQ-9 · lỗi (quyền, nhẹ) · TVV / CX / Admin gọi được `GET /tong-quan/quan-ly` (Cần xử lý của QL: GV nào chậm chấm, bao nhiêu bài)
- Trang · vai: API · TVV (23), CX (24), Admin (22)
- Tái hiện: đăng nhập demo CX → `GET /api/tong-quan/quan-ly` → 200: "65 bài quá hạn chưa nhập điểm · 5 giáo viên: Bùi Hải Yến · Cao Khánh Linh · Lê Minh Khoa · +2 · GV chấm chéo", "4 PA chưa có Kết quả · Dương Tuấn Kiên · Đặng Thanh Quân…". TVV: 200 (1 dòng, tên Ngô Bảo Nam). GV thì 403 "Khối này dành cho Quản lý."
- Thấy: giao diện không cho 3 vai này thấy khối (CX/TVV không có Công việc, Admin có tab Mock Test) nhưng máy chủ vẫn trả. CX theo đặc tả là "xem, **trừ phần GV**" (OV §2) — đây đúng là phần "GV nào đang trễ". Đúng ra: giao diện theo vai đi cùng quyền máy chủ (CLAUDE.md; plan.md mục 3 dòng 13/10 "nút / link chỉ hiện khi máy chủ cho làm" — chiều ngược lại cũng vậy).
- Nguyên nhân: `server/src/worklist/tongQuan.ts:25-27` `laQuanLy` chỉ đòi `analysis.view` — quyền OV-2a cấp cả cho TVV, CX, Admin.
- Đề xuất: `tongQuanQuanLy` đòi quyền làm việc của QL (vd `request.approve` hoặc `work.view` + không phải `cham-diem`); `diemChuY` / `chi-nhanh` giữ `analysis.view` (CX có dùng). Không cần mockup.
- Ảnh: — (API)

### TQ-10 · lỗi (nhẹ) · "Học viên FT xong MT3, chưa có MT kế tiếp" đếm cả em MT3 mới có 2/4 kỹ năng
- Trang · vai: `/` Cần xử lý · QL (MB), QT
- Tái hiện: `/` → "4 học viên FT xong MT3, chưa có MT kế tiếp · MB FT 101 (4)" → bấm số: Bùi Thảo Vy, Tạ Minh Quân, Lương Bảo Anh, Đoàn Khánh Chi. Nút "Kế hoạch Test" → `/test/ke-hoach?classId=3`.
- Thấy: Lương Bảo Anh MT3 (W2 SEP) mới có L 6.5, R 6.5 — W, S chưa nhập, lượt `planned` (`/attempts?studentId=64`); Kế hoạch Test ghi MT3 của em là chưa xong (chỉ 3 em "xong" MT3 ở lưới). Kế hoạch Test mở cả lớp 33 em, không chỉ ra 4 em nào (MT4 "chưa xếp" ở mọi em).
  Đúng ra: "xong MT3" = đủ điểm MT3 (cùng nghĩa với Kế hoạch Test) — hoặc đổi chữ thành "đã thi MT3". Em còn chờ chấm thì QL chưa cần xếp MT4.
- Nguyên nhân: `server/src/classes/schedule.ts:593-595` `XONG_MT_CUOI_SQL` = có lượt ≥ số MT mà `CO_DIEM_SQL` (bất kỳ một điểm); chỉ số ở `server/src/worklist/metrics.ts:672-686`.
- Đề xuất: điều kiện "đủ điểm bắt buộc" (như `complete`), hoặc đổi nhãn; nút "Kế hoạch Test" thêm lọc em (vd `&hv=…` hoặc chip "Cần xếp MT kế"). Cần chủ SP chốt nghĩa "xong". Không cần mockup (đổi điều kiện/chữ).
- Ảnh: $SP/anh/tong-quan/06-QL-cxl-3.png

### TQ-11 · gợi ý · Một chỉ số ba tên giữa ô số · Cần xử lý · panel
- Trang · vai: `/` · QL, QT, CX
- Thấy: ô "PA QUÁ HẠN KẾT QUẢ" → panel "1 PA học thuật — **PA học thuật cần cập nhật**"; Cần xử lý gọi "PA **chưa có Kết quả** tuần W1 SEP". Khung Lớp thường: ô "HỌC VIÊN **CHƯA ĐẠT**" và Điểm đáng chú ý "FOU: 22/29 học viên chưa đạt" → panel "Học viên **dưới kỳ vọng** theo môn". "7/22 lần cập nhật PA đúng hạn" → panel "22 **nghĩa vụ** — Đúng hạn cập nhật".
- Đúng ra: một khái niệm một tên (CLAUDE.md "Nhất quán"). Nguyên nhân: tiêu đề panel đọc `cs.ten` của sổ chỉ số (`web/src/ui/SoLieu.tsx:85`), ô dùng `nhan` riêng (`MetricTiles.tsx:38,45`), Cần xử lý dùng `CAN_XU_LY.nhan` (`shared/domain/tongQuan.ts:105`).
- Đề xuất: panel dùng cùng nhãn ô đang bấm (truyền `nhan`, theo khung). Đổi chữ, không cần mockup.

### TQ-12 · gợi ý · Lịch sắp tới (Lớp thường) liệt kê lớp 0 học viên: "MB FOU 16 · Progress · 0 em"
- Trang · vai: `/` khung Lớp thường · QL, QT. Tab "Tuần này · W3 SEP" (19).
- Đề xuất: bỏ lớp 0 em (hoặc chip mờ "không còn em"). Nguyên nhân: `web/src/modules/worklist/Highlights.tsx:64-66` đẩy chip kể cả `students = 0`. Không cần mockup.
- Ảnh: $SP/anh/tong-quan/07-QL-thuong.png

### TQ-13 · gợi ý · Dòng "lớp thiếu GV môn · 2 Case chưa có người nhận · 6 bài chưa có người chấm": hai số sau không bấm được, panel chỉ có 2 lớp
- Trang · vai: `/` Cần xử lý · QT. Nút "Sửa phân công" → panel "2 lớp — Lớp thiếu giáo viên môn" (HD FT 302, UB FOU 07). "2 Case", "6 bài" là chữ thường, không có đường xem danh sách (luật "số bấm được = số dòng").
- Đề xuất: biến hai số thành `SoLieuO` (`case-chua-co-nguoi-phu-trach`, tập bài chưa phân công) — `server/src/worklist/tongQuan.ts:139-145`. Không cần mockup.

### TQ-14 · gợi ý · Điện thoại 375: chip dải Chờ duyệt cao 28 px (dưới 44 px chạm)
- Trang · vai: `/` 375 sáng · QL. Chip "Học thuật 6", "Ý thức 1", "Lịch thi 1", "Thông tin HV 2", "⚠ Quá hạn 1" = 28 px cao (đo bằng getBoundingClientRect); các nút khác của trang đều ≥ 44 px.
- Nguyên nhân: `web/src/modules/worklist/KhoiCanXuLy.tsx:127-128` `Nhan` có onClick, không có `max-sm:min-h-[44px]`. Đề xuất: thêm vùng chạm như số (`max-sm:py-3 max-sm:-my-3`). Không cần mockup.
- Ảnh: $SP/anh/tong-quan/14-QL-375.png

### TQ-15 · gợi ý · Menu tài khoản GV liệt kê lớp đã kết thúc
- Trang · vai: thanh đầu › tài khoản · GVCN: "GVCN MB FOU 03", "MB FOU 03 · L / R", "MB BE 08 · L" (MB FOU 03 = lớp 1, MB BE 08 = lớp 2, đã kết thúc).
- Nguyên nhân: `web/src/modules/platform/Header.tsx:107-108` lấy mọi `session.assignments`. Đề xuất: chỉ lớp đang mở. Không cần mockup.

### TQ-16 · gợi ý · TVV / CX mở thẳng `/giao-vien/7`: báo "Bạn chỉ xem được hồ sơ giáo viên của chính mình." + nút "Thử lại"
- Câu dành cho giáo viên, TVV/CX không phải GV; 403 thì "Thử lại" vô ích. Chỉ gặp khi gõ URL (Tổng quan CX đã ẩn "Theo giáo viên" — đúng). Đề xuất: câu "Vai của bạn không xem hồ sơ giáo viên." và bỏ Thử lại khi 403.

## Đối chiếu cùng một số ở nhiều nơi (đã đếm thật)
| Số | Tổng quan | Nơi khác | Kết quả |
|---|---|---|---|
| Chờ duyệt (QL MB) | dải 10 (6/1/1/2, quá hạn 1) | badge Công việc 10 · hộp Chờ duyệt 10 thẻ, từng chip khớp | khớp |
| Case chờ xác nhận nguyên nhân (QL MB) | ô FT 9 + Lớp thường 8, quá hạn 1 + 1 | Công việc (Của GV) nhóm Xác nhận nguyên nhân: 17 Case, 2 quá hạn | khớp |
| Bài quá hạn chưa nhập điểm (QL MB) | 58 | Công việc lọc Quá hạn: "100 bài cần chấm", cộng việc con quá hạn 64; `/attempts` 49 ở MB FT 101 = chỉ số | **lệch — TQ-1** |
| Bài quá hạn của Trần Ngọc Hà · MB FT 101 | Lớp tôi dạy 17 | bảng Theo giáo viên (QT) 17 · panel 17 | khớp |
| Việc quá hạn GV | Việc hôm nay 7 / 4 / 2 (GVCN / GVBM / GVW) | badge 7 / 4 / 2 · chip Quá hạn Công việc 7 / 4 / 2 | khớp |
| Việc theo nhóm GVCN | — | Công việc 6 / 17 / 2 / 2 = Hồ sơ GV "Việc đang có" 6 / 17 / 2 / 2 | khớp (ghi chú GOP plan.md mục 4 đã hết lệch) |
| "Xem hết (n)" điện thoại GVCN | 17 | chip "Đến hết tuần" 17 | khớp |
| Lịch sắp tới → Kế hoạch Test | W3 SEP Lớp thường 5 lớp (QL), 6 lớp (QT, "+ 1 lớp"); W4 SEP FT 2 lớp | Kế hoạch Test cùng tuần 5 / 6 / 2 lớp | khớp |
| TVV / CX ô đếm | 3 / 0 / 0 / 0 · 61 / 0 / 0 / 54 | Học viên & Lớp "Đang xem … n học viên" | khớp |

## Ghi chú môi trường
- Admin (22) chỉ có CP, CP không có lượt MT tuần này → khối Mock Test toàn 0, chưa thử được Nhắc GV chấm quá hạn (đọc mã: `tongQuanMt.ts` cùng xô `myWork` nên dính TQ-1).
- Đã bấm đọc thông báo của QL, QT, GVCN, GVBM trong DB riêng a1 (đánh dấu đã đọc) — không ảnh hưởng môi trường khác.
