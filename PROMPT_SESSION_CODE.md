# Prompt cho session coding

Copy **cả khối** của PR cần làm, dán vào một session Claude Code (Sonnet) mới. Một PR một session.

Cập nhật: 21/09/2026 tối. Lộ trình: `plan.md` **mục 23** (đêm nay) và mục 22 (sau deploy).

**Đã xong:** PR-N (#32) · PR-J (#34).

## Đêm nay — deploy bản chính

```
Bây giờ (Sonnet):     PR-T  →  merge  →  PR-K  →  merge
Tối nay (Max, Opus):  PR-Z2  (bản chính trên Netlify + Turso — KHÔNG chạy song song với T/K)
Trong lúc Z2 chạy:    bạn tạo tài khoản Turso + Netlify theo TRIEN_KHAI.md mục 2
```

**Mức kiểm tra đã cố ý giảm cho đêm nay.** Chỉ giữ nguyên độ chặt ở chỗ có thể làm **sai dữ liệu thật**
(luật tạo case, phối hợp SOS, xoá vi phạm, quyền, khởi tạo DB rỗng, sao lưu). Giao diện chỉ bấm thử một lượt.

---

## PR-T — Máy chủ theo rulebook v3  *(làm ngay bây giờ, Sonnet)*

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

## PR-K — Giao diện Ý thức & Phối hợp  *(sau khi PR-T đã merge — làm được ngay bây giờ bằng Sonnet)*

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

## PR-Z2 — Bản chính trên Netlify + Turso  *(tối nay, Opus, sau khi PR-T và PR-K đã merge)*

```
Làm PR-Z2 ở plan.md mục 24, chỉ PR-Z2. PR-T và PR-K đã merge vào main.
Bản chính: Netlify (giao diện + Netlify Functions) + Turso (database libSQL) + Netlify Blobs (tệp).
Dữ liệu bắt đầu RỖNG, không có dữ liệu nào phải chuyển.

Skill superpowers dùng (gọi bằng tool Skill):
- using-git-worktrees: nhánh pr-z2-netlify-turso.
- brainstorming — nhánh "spike": CHỈ cho bước Z0 (thử nhanh ≤45 phút: thư viện `libsql` gọi đồng bộ
  có dùng được trong Netlify Function không; đo độ trễ Function → Turso). Kết quả ghi mục 14 rồi đi tiếp,
  KHÔNG viết spec.
- subagent-driven-development: CHỈ cho Z2 (đổi cách gọi DB) nếu Z0 chọn đường async — mỗi module một
  subagent theo đúng thứ tự ở mục 24.2 Z2, npm test phải xanh sau MỖI module rồi mới sang module sau.
- systematic-debugging: khi phép kiểm gãy sau khi đổi một module.
- test-driven-development: CHỈ cho Z6 (init từ chối khi DB có dữ liệu) và Z7 (file sao lưu mở lại được).
- verification-before-completion: BẮT BUỘC Z8 trên địa chỉ Netlify thật, kèm số đo thời gian 5 trang.
- requesting-code-review: MỘT lượt cho tầng kết nối DB + giao dịch (tx) trước khi mở PR.
- finishing-a-development-branch: commit, push, mở PR (không draft). KHÔNG tự merge.
Không cần: writing-plans (mục 24 đã là plan), kiểm ngược, chụp ảnh.

Đọc: plan.md mục 24 (đọc hết 24.0-24.3), TRIEN_KHAI.md (chủ sản phẩm sẽ làm theo — tên lệnh và biến
môi trường phải KHỚP: npm run init-ban-chinh · npm run sao-luu · TURSO_DATABASE_URL · TURSO_AUTH_TOKEN ·
ADMIN_EMAIL · ADMIN_PASSWORD · BACKUP_DIR · NODE_ENV; đổi tên nào thì sửa luôn TRIEN_KHAI.md).

Bốn điều tuyệt đối:
1. Z2 chỉ đổi CÁCH GỌI database. Không đổi luật nghiệp vụ, không "tối ưu" truy vấn ở bước này.
   Số phép kiểm sau Z2 phải bằng hoặc hơn trước Z2, tất cả xanh.
2. Máy dev không đổi thói quen: npm run dev, npm run seed, npm test vẫn chạy như cũ (file cục bộ).
3. init-ban-chinh KHÔNG BAO GIỜ xoá hay ghi đè dữ liệu đã có.
4. Bản production không còn gì của demo (Vào nhanh, DemoBar, đổi ngày demo); demoToday() ra ngày thật.

Khi cần Turso URL/token hoặc quyền Netlify để deploy thật (Z8): DỪNG và hỏi tôi, chỉ tôi cung cấp.
Không ghi token vào file nào trong repo.

Báo xong: đường đã chọn ở Z0, số phép kiểm, kết quả Z8 từng bước, thời gian 5 trang, link PR, cái gì CHƯA làm.
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
