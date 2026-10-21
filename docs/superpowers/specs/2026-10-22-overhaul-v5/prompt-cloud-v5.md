# Prompt session cloud đợt V5 (PTA Plan soạn 22/10)

Chủ SP dán một dòng ngắn vào session cloud mới (môi trường "Pisatracking"); session đọc tệp này trên nhánh `claude/v5-brief` (PR #506) hoặc `main` nếu #506 đã merge.
V5-A đã chạy (cloud, nhánh `claude/v5-a`). B1, B2, B3 chạy song song ngay; V5-C chạy sau khi A + B1–B3 đã mở PR.

---

## PHẦN CHUNG (mọi session V5)

- Repo Pizi147/pisa-tracking — PISA Tracking: web theo dõi học viên IELTS cho giáo viên / quản lý (React + Express + libsql/Turso). Chủ sản phẩm không biết code, nói tiếng Việt.
- `git fetch origin`. Đọc: `docs/superpowers/specs/2026-10-22-overhaul-v5/00-brief-chu-sp.md` (brief — ưu tiên số 1), `01-quyet-dinh-22-10.md` (GIỮ luật MT cũ "-" = huỷ ngay như PR #503; hạn việc TVV = 23:59 giờ VN ngày lưu + 4; câu còn mở → theo khuyến nghị), `logo-pisa.png`, `kpi-tieu-chi.jpg` (chỉ định hướng thông tin, KHÔNG tính điểm KPI). Nếu chưa có trên `main` thì `git merge origin/claude/v5-brief`.
- Tham khảo (không phải yêu cầu): bộ 20–21/10 `docs/superpowers/specs/2026-10-20-ke-hoach-overhaul/`, mockup V4 `thiet-ke/mockup-v4-*`.
- Luật: đọc `CLAUDE.md`, `DESIGN.md`, `plan.md` mục 1. Model Opus 5.5 — KHÔNG Fable (kể cả subagent). Không deploy, không chạm Turso / DB bản chính. Đợt này KHÔNG sửa mã sản phẩm — chỉ tài liệu + mockup HTML. Không đổi nghiệp vụ / quyền.
- Chữ trên giao diện ngắn (nhãn 1–3 từ), đúng chữ sẽ hiện trên web; mã tuần `W2 SEP`; ngày demo 14/09/2026. Phân biệt YÊU CẦU ĐÃ CHỐT / ĐỀ XUẤT THIẾT KẾ / CẦN XÁC MINH.
- NỀN CHUNG do V5-A dựng trên nhánh `claude/v5-a`: `thiet-ke/v5/v5-nen.css` (hệ màu xanh–hồng–trắng + badge), `thiet-ke/v5/bang-mau.html`, `thiet-ke/v5/du-lieu-demo.md` (một bộ dữ liệu giả cho mọi mockup), `docs/superpowers/specs/2026-10-22-overhaul-v5/07-huong-thiet-ke.md` (hướng + phương án bố cục đã chọn).
  **Chờ nền trước khi vẽ:** lặp `git fetch origin claude/v5-a && git cat-file -e origin/claude/v5-a:thiet-ke/v5/v5-nen.css` mỗi ~15 phút (vòng chờ / Monitor), tối đa 4 giờ — quá thì tự dựng token tạm theo brief 5.2 + logo và ghi rõ trong PR. Có nền rồi: `git checkout -b claude/v5-<mã> origin/claude/v5-a`, dùng ĐÚNG token, thành phần, dữ liệu demo của nền.
- Mockup HTML trong `thiet-ke/v5/`: mỗi tệp 1440 sáng (chính) + 1280 + 375–390, bản tối nếu nền có token tối; đủ trạng thái tải / rỗng / lỗi / đang lưu / đã lưu / chỉ xem; PNG từng khung `thiet-ke/v5/anh/` (Playwright); truy vết `<tên>-truy-vet.md`: yêu cầu (C.. / T.. của brief) → khung → thành phần, có dòng BỎ / GIỮ; tương tác chính minh hoạ bằng JS nhẹ (lọc, mở / đóng panel, chuyển tuần). Skill: `impeccable` (shape / critique), `ui-ux-pro-max`, `karpathy-guidelines`.
- Xong: PR vào `main` (ghi "dựa trên V5-A"), KHÔNG merge (chủ SP bấm). Mô tả ≤ 30 dòng: tệp + PNG, quyết định chính, giả định, câu CẦN XÁC MINH (chỉ câu thật sự chưa có căn cứ).

---

## V5-B1 — Tổng quan theo vai + Công việc + TVV / Sau thi

PHA 1 (ngay, không cần nền): đọc brief mục 5, 6, 7, 9, 15, 18 và mã thật: `web/src/modules/worklist`, `congViec`, trang đầu từng vai, chuông / Nhắc việc, `server/src/worklist/mywork.ts`, `server/src/loTrinh/`; mockup V4 `mockup-v4-tong-quan`, `-cong-viec`, `-viec-tvv`. Ghi `docs/superpowers/specs/2026-10-22-overhaul-v5/b1-ra-soat.md` (≤ 120 dòng): hiện trạng theo vai, vấn đề, nguồn số / đơn vị đếm (việc / nhóm / bài), vai thực tế trong mã.

PHA 2 (sau khi có nền):
1. `tong-quan.html` — Tổng quan theo vai: QL, QT (theo chi nhánh), GV (tách "kỹ năng tôi dạy" / "lớp tôi chủ nhiệm"), TVV, Admin, CX, Head tutor — theo phương án đã chọn ở `07-huong-thiet-ke.md` (chưa có thì tự dựng 2 phương án khác bố cục và chọn). Tình hình + 3–4 chỉ số có tử / mẫu + tối đa 2–3 khối; KHÔNG form làm việc (C04).
2. `cong-viec.html` — GV: hai việc R + W riêng của một HV (T01), chỉ phần mình (T02), Speaking chấm chéo không là nợ (T03); QL xem người khác = chế độ theo dõi, "Làm thay" chỉ khi có quyền; số việc vs thông báo chưa đọc là hai dấu hiệu khác nhau; đơn vị đếm rõ ("3 nhóm · 7 việc · 12 bài"); T15, T16, T17, T21.
3. `tvv.html` — Công việc TVV (C05): báo PH (Đã báo PH / Chưa liên hệ được + Ngày mặc định hôm nay + Ghi chú; bối cảnh HV, lớp, lần xử lý, nội dung GVCN, hạn, SĐT bấm gọi; lịch sử các lần thử — C15, T10) và tuyến **Sau thi** (Kết quả thi thật → Bước tiếp; lưu điểm riêng → "Đã có kết quả · Chưa chốt bước tiếp" — C16, T09), Chốt ngày thi, Bổ sung hồ sơ thiếu.

PR: "V5-B1: mockup Tổng quan theo vai + Công việc + TVV".

---

## V5-B2 — Test + Hồ sơ lớp + Học viên & Lớp + Hồ sơ HV

PHA 1 (ngay): đọc brief mục 5, 8, 10, 11, 12, 15, 18 và mã thật: `web/src/modules/test`, `fasttrack`, `classes`, `students`, `yThuc`; lưới `Bang` / `ODiem` (PR #500, #505 nếu đã merge); luật MT `server/src/fasttrack/absence.ts`, `shared/domain/vang.ts`; Kế hoạch Test + chỗ tự gợi ý / sinh việc MT4; mockup V4 `mockup-v4-cham-test`, `-ho-so`, `-hoc-vien-lop`. Ghi `b2-ra-soat.md` (≤ 120 dòng): hiện trạng, vấn đề, chỗ mã gợi ý MT4 (C20), cột "Thi thật" (C21), W1 / W2 ở từng màn.

PHA 2 (sau khi có nền):
1. `test.html` — Chấm Test 4 nhóm: Quá hạn → Hạn tuần này → Bài thi Speaking tuần này (mở sẵn) → Hạn tuần sau (gập) (C14, T03, T14); khu chấm tại chỗ ("Lưu" ở lại / "Lưu và tiếp"; thiếu nhận xét bắt buộc ≠ xong); **Lịch tuần** một tuần + chuyển tuần, QL / Admin thấy tình trạng chấm trong cùng lịch (chưa tới hạn trung tính, quá hạn còn thiếu mới đỏ; bỏ tab Tình trạng chấm — C13); Kế hoạch Test mặc định 3 MT, không gợi ý MT4, QL thêm tay (C20, T04); chuỗi "-" theo luật đã code #503 (T05).
2. `ho-so-lop.html` — đầu trang gọn; bảng điểm tách W1 / W2 (C18, T13); cột Ngày thi đúng ngày / chưa chốt (C21); cột Việc nhiều dòng, ưu tiên việc người xem (C19); panel việc tại chỗ đúng HV + kỹ năng; **đánh giá kết quả đầu ra liên tiếp trong panel** (C17, T12: điểm trước / sau, nhận xét, bước tiếp, Lưu / Lưu và em tiếp); Ý thức & Phối hợp phân cấp màu (brief mục 10).
3. `hoc-vien-lop.html` — hàng lớp gọn (SOS có viền + chú giải), cột W tổng + "W1 · W2" dòng phụ, bộ lọc Cần làm (nhiều việc một HV, đếm "n HV · m việc"), việc cấp lớp ở hàng lớp, Lịch thi (ngày đã chốt / tháng dự kiến / chưa có lịch), xuất theo bộ lọc có số HV chọn.
4. `ho-so-hv.html` — đầu gọn, thanh Việc cần làm trước bảng, hành trình từng kỹ năng L / R / W (W1 / W2) / S theo thời gian + mốc kỳ vọng đổi theo thời gian, ghi nhận bài trên lớp tuỳ chọn (thang riêng, không trộn MT — C11, T18), khoảng trống ≠ không tiến bộ.

PR: "V5-B2: mockup Test + Hồ sơ lớp + HV & Lớp + Hồ sơ HV".

---

## V5-B3 — Hồ sơ GV + Phân tích / Báo cáo + Tutor + trang còn lại

PHA 1 (ngay): đọc brief mục 5, 13, 14, 15, 16, 18 + ảnh `kpi-tieu-chi.jpg` và mã thật: `web/src/modules/giaoVien`, `phanTich`, báo cáo, tutor, quản trị, tìm kiếm, hộp duyệt, thông báo; nguồn số ở `server/src/worklist/metrics.ts`, `thongKe*`, `tongQuan*`. Ghi `b3-ra-soat.md` (≤ 120 dòng): số nào có dữ liệu thật cho từng chỉ số Hành chính / Học thuật (brief 13, 15), số nào chưa có nguồn đáng tin (ghi "chưa có dữ liệu", không bịa).

PHA 2 (sau khi có nền):
1. `ho-so-gv.html` — hai phương án: A hai tab Hành chính / Giảng dạy – Học thuật, B hai khu cùng trang; khuyến nghị A + dòng tóm tắt chung ở đầu (brief 13.3); đầu hồ sơ chỉ tên, chi nhánh, kỹ năng, vai, lớp; bộ lọc kỳ chung; chỉ số có tử / mẫu; quy tắc Overall khi đánh giá GV (brief 15: T06, T07, T08); không quy kết "GV gây ra kết quả"; đổi GV giữa kỳ gắn dữ liệu theo thời gian phân công.
2. `phan-tich.html` — Báo cáo HV (kết quả + hỗ trợ) và Phân tích GV MỘT bảng hai nhóm cột Hành chính / Học thuật (C07, brief 14.2, bộ cột gọn / đầy đủ); số bấm mở **panel chỉ đọc** (tiêu đề khớp số, phạm vi, cách tính, bảng đúng tập, 75 % = 15/20 giải thích 20 trường hợp — T11; mẫu 0 = "Chưa có dữ liệu" — T19; tổng nhiều chi nhánh có trọng số — T20); KHÔNG Thêm PA / Tạo Case / Duyệt / Làm thay trong panel (C22).
3. `tutor.html` — Tutor cùng nhận diện; tỷ lệ kèm mẫu số; không có buổi ≠ kết quả thấp; kết luận tutor là nhận xét quản lý, không thành điểm KPI; bảo vệ bản nháp.
4. `con-lai.html` — tìm kiếm, bộ lọc tuần, hộp duyệt (thu hồi / chỉnh sửa xử lý đã duyệt giữ lịch sử, Hoàn tác không vượt quyền — T22), thông báo, biểu mẫu thêm / sửa, trang rỗng / lỗi, in / xuất, mobile (bàn phím mở trong panel — T21).

PR: "V5-B3: mockup Hồ sơ GV + Phân tích / Báo cáo + Tutor + trang còn lại".

---

## V5-C — Kế hoạch triển khai (chạy SAU khi V5-A, B1, B2, B3 đã mở PR)

- `git fetch origin`; đọc mọi mockup + truy vết + `02`–`07` trên các nhánh `claude/v5-a`, `claude/v5-b1`, `claude/v5-b2`, `claude/v5-b3` (gộp vào nhánh của mình hoặc đọc bằng `git show`).
- Kiểm chéo: cùng dữ liệu demo, cùng tên / số giữa các mockup; chỗ lệch giữa B1–B3 → bảng sửa (không tự sửa mockup của PR khác; ghi vào tài liệu).
- Viết `08-ke-hoach-trien-khai.md` (brief 19 giai đoạn C): PR nền dùng chung (token màu, badge, panel, Bang) → PR số liệu / quyền (máy chủ, chỉ số theo `05-tu-dien-chi-so.md`) → PR từng module (một màn một PR, mockup V5 + ảnh cặp + chủ SP duyệt trước merge); phụ thuộc, phạm vi, tiêu chí nghiệm thu (T01–T22), dữ liệu cần bổ sung (tránh đổi schema chỉ vì giao diện), kiểm tra 1440 / 1280 / 375–390 + bàn phím + nội dung dài + lỗi lưu, đo số bước theo kịch bản thật; liệt kê PR cũ (CHU-THI, SEED-UX, BANG-1 #505…) giữ / sửa / bỏ theo V5; prompt ngắn cho từng PR (chạy cloud).
- PR "V5-C: kế hoạch triển khai V5", KHÔNG merge.
