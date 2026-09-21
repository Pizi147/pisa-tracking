# Prompt cho session coding

Copy **cả khối** của PR cần làm, dán vào một session Claude Code (Sonnet) mới. Một PR một session.

Cập nhật: 21/09/2026 tối. Lộ trình: `plan.md` **mục 23** (đêm nay) và mục 22 (sau deploy).

**Đã xong:** PR-N (#32) · PR-J (#34).

## Đêm nay — deploy bản chính

```
Mở 2 session cùng lúc:   PR-T   và   PR-Z      (không đụng file của nhau)
Xong PR-T thì mở:        PR-K
Merge cả ba → làm theo TRIEN_KHAI.md
```

**Mức kiểm tra đã cố ý giảm cho đêm nay.** Chỉ giữ nguyên độ chặt ở chỗ có thể làm **sai dữ liệu thật**
(luật tạo case, phối hợp SOS, xoá vi phạm, quyền, khởi tạo DB rỗng, sao lưu). Giao diện chỉ bấm thử một lượt.

---

## PR-T — Máy chủ theo rulebook v3  *(song song với PR-Z)*

```
Làm PR-T ở plan.md mục 23.1, chỉ PR-T. Chỉ máy chủ + shared/domain + seed demo, KHÔNG sửa giao diện.

Skill superpowers dùng (gọi bằng tool Skill):
- using-git-worktrees: tạo nhánh pr-t-may-chu-v3 trước khi code.
- test-driven-development: BẮT BUỘC cho mọi mã luật S01-S09, P01-P10, V11'-V14' — phép kiểm đỏ trước.
- systematic-debugging: chỉ khi có phép kiểm gãy mà chưa rõ vì sao.
- verification-before-completion: npm run check xanh trước khi báo xong.
- requesting-code-review: MỘT lượt rà diff trước khi mở PR (luật dữ liệu thật — đáng làm).
- finishing-a-development-branch: commit, push, mở PR (không draft). KHÔNG tự merge.
Không cần: brainstorming, executing-plans, kiểm ngược (mutation), chụp ảnh.

Đọc trước khi code: thiet-ke/SOS_VA_PHOI_HOP_V3.md (đặc tả chính — đọc hết), rule book mục 19,
plan.md mục 23.0-23.1.

Ba chỗ dễ sai nhất:
1. Chỉ lượt Mock Test FAST TRACK mới tự tạo case / điền sẵn phương án / Phối hợp SOS. Lớp Normal
   giữ nguyên mô hình tín hiệu cũ — có phép kiểm khoá điều này (nghiệm thu §10 mục 8).
2. Chạy lặp (lưu điểm lại, chấm lại) không được nhân đôi case, phương án, việc phối hợp.
   Tận dụng dedup_key của case_signals và UNIQUE của sos_coordination_actions.
3. Sửa điểm làm SOS giảm/hết: việc phối hợp 'done' và phương án đã xác nhận KHÔNG bị xoá.

Phương án điền sẵn chưa xác nhận KHÔNG vào effectiveness.ts và KHÔNG sinh nghĩa vụ cập nhật tuần.

Kế hoạch sai/thiếu so với mã thật: sửa tại chỗ trong plan.md và ghi một dòng mục 14. Nếu phải CHỌN
GIỮA HAI CÁCH LÀM VỀ NGHIỆP VỤ: dừng lại hỏi tôi, không tự chọn.

Báo xong: đã làm gì, số phép kiểm, link PR, cái gì CHƯA làm.
```

---

## PR-Z — Chuẩn bị bản chính  *(song song với PR-T)*

```
Làm PR-Z ở plan.md mục 23.2, chỉ PR-Z. Không đổi nghiệp vụ, không sửa luật case/ý thức.

Skill superpowers dùng:
- using-git-worktrees: nhánh pr-z-ban-chinh.
- test-driven-development: CHỈ cho hai thứ — (a) init-ban-chinh từ chối chạy khi DB đã có dữ liệu,
  (b) sao-luu tạo file mở được và giữ đúng 14 bản. Phần còn lại không cần TDD.
- verification-before-completion: BẮT BUỘC chạy bước Z5 thật từ DB rỗng (init → đăng nhập → tạo
  chi nhánh → tài khoản → lớp → học viên → xếp MT → nhập điểm). Đây là phần quan trọng nhất.
- finishing-a-development-branch: commit, push, mở PR. KHÔNG tự merge.
Không cần: brainstorming, requesting-code-review, kiểm ngược, chụp ảnh.

Đọc: plan.md mục 23.2, TRIEN_KHAI.md (hướng dẫn chủ sản phẩm sẽ làm theo — tên lệnh và biến môi
trường phải KHỚP đúng file này: npm run build · npm run init-ban-chinh · npm start · npm run sao-luu ·
NODE_ENV · DATA_DIR · BACKUP_DIR · PORT · COOKIE_SECURE · ADMIN_EMAIL · ADMIN_PASSWORD).
Nếu buộc phải đổi tên nào, sửa luôn TRIEN_KHAI.md cho khớp.

Ba điều tuyệt đối:
1. init-ban-chinh KHÔNG BAO GIỜ xoá hay ghi đè dữ liệu đã có.
2. Bản production không còn "Vào nhanh bằng tài khoản demo", không DemoBar, không đổi ngày demo;
   demoToday() ra ngày thật.
3. Máy dev vẫn chạy như cũ: npm run dev và npm run seed không đổi hành vi.

Z5 tìm ra màn nào trắng/lỗi khi DB rỗng thì sửa nếu nó CHẶN luồng nhập liệu; còn lại ghi vào mục 12.

Báo xong: link PR, kết quả Z5 từng bước, lỗi còn để lại.
```

---

## PR-K — Giao diện Ý thức & Phối hợp  *(sau khi PR-T đã merge)*

```
Làm PR-K ở plan.md mục 23.3, chỉ PR-K. PR-T đã merge.

Skill superpowers dùng:
- using-git-worktrees: nhánh pr-k-giao-dien-y-thuc-v3.
- verification-before-completion: npm run check xanh + bấm thử MỘT lượt mỗi vai (GVBM, GVCN,
  Quản lý) + khổ 375px, theo nghiệm thu §10 mục 5, 7, 9-15 của SOS_VA_PHOI_HOP_V3.md.
- systematic-debugging: chỉ khi gặp lỗi chưa rõ nguyên nhân.
- finishing-a-development-branch: commit, push, mở PR. KHÔNG tự merge.
Không cần: TDD cho giao diện (chỉ dùng nếu phải thêm hàm máy chủ), brainstorming,
requesting-code-review, kiểm ngược, chụp ảnh.

Đọc: thiet-ke/SOS_VA_PHOI_HOP_V3.md mục 7 (bố cục — THẮNG Y_THUC_VI_PHAM_VA_BIEN_PHAP.md §7 ở chỗ
khác nhau), Y_THUC §7.2 §7.4 §7.5 (ba form giữ nguyên), TU_DIEN_VA_CHU.md mục 6-7 (mọi chữ đã viết
sẵn, đừng tự sáng tác). Prototype tham khảo: thiet-ke/tham-khao/*.html — chỉ để hình dung.

Nguyên tắc: GVCN nhìn THEO HỌC SINH trước. Mở rộng tại chỗ, không trang mới, không thẻ số lớn.
Mọi ràng buộc nói trước khi bấm (nút mờ kèm câu thiếu gì), không báo lỗi đỏ sau khi bấm.
Tận dụng StudentDetailPage, ClassOverviewPage, SkillBoard, IssueAnalysis, BangChung, SoLieu có sẵn.
Chưa đổi hồ sơ lớp thành 4 tab (việc sau deploy) — chỉ thay tab Ý thức.

Báo xong: link PR, vai nào đã bấm thử, cái gì CHƯA làm.
```

---

## Prompt rà soát — dán vào session thiết kế sau mỗi PR

```
Session coding vừa báo xong PR-<X>. Rà soát nhanh: diff có làm đúng plan.md mục 23 và
SOS_VA_PHOI_HOP_V3.md không, có tick mà chưa làm không, có tự quyết điểm nghiệp vụ không.
Báo bằng tiếng Việt cơ bản, nói rõ cái gì cần tôi chốt.
```

---

## Sau deploy — rút gọn, dùng khi quay lại

Thứ tự: `PR-O → PR-Q → PR-P → PR-R → PR-S`. Đặc tả ở `plan.md` mục 22.4–22.9 (bỏ phần mục 23 đã làm)
và `thiet-ke/BAN_DO_OVERHAUL.md`. Hồ sơ lớp khi làm PR-Q: 4 tab `Học viên | Ý thức & Phối hợp | Phân tích
lớp | Giáo viên`.

Khuôn prompt chung (thay `<X>` và `<mục>`):

```
Làm PR-<X> ở plan.md mục <mục>, chỉ PR-<X>. Đọc thiet-ke/BAN_DO_OVERHAUL.md phần tương ứng trước
design plan để biết cái gì đã có / hết hiệu lực. Bản chính đang chạy với dữ liệu thật: nếu PR đổi
schema thì phải có bước npm run migrate chạy lặp không lỗi, KHÔNG được làm mất dữ liệu.

Skill: using-git-worktrees · verification-before-completion (npm run check + bấm thử một lượt các vai
liên quan) · finishing-a-development-branch (không tự merge). Chỉ dùng test-driven-development khi thêm
hoặc đổi luật ở máy chủ. Chỉ dùng requesting-code-review cho PR-R (lớn nhất). Không chụp ảnh, không
kiểm ngược.

Kế hoạch sai so với mã: sửa tại chỗ + một dòng mục 14. Phải chọn giữa hai cách về nghiệp vụ: hỏi tôi.
Báo xong: link PR, cái gì CHƯA làm.
```

| PR | Làm gì | Mục |
|---|---|---|
| PR-O | Điều hướng 4 khu vực + redirect link cũ | 22.4 |
| PR-Q | Học viên & Lớp · hồ sơ lớp 4 tab · hồ sơ HV 4 ô · hành trình | 22.7 |
| PR-P | Tổng quan mới · Phân tích 4 góc nhìn (không có góc nhìn Giáo viên) | 22.6 |
| PR-R | Công việc 3 tab · Kế hoạch Test · 4 đường vào nhập điểm · nút dời lịch Normal | 22.8 |
| PR-S | Biên tập chữ · trạng thái rỗng · nợ kỹ thuật (bỏ S3 đã làm ở PR-T) | 22.9 |
