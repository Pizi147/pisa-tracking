# Prompt cho session coding

Copy **cả khối** của PR cần làm, dán vào một session Claude Code (Sonnet) mới. Một PR một session.

Cập nhật: 21/09/2026 tối. Lộ trình: `plan.md` **mục 23** (đêm nay) và mục 22 (sau deploy).

**Đã xong:** PR-N (#32) · PR-J (#34).

## Đêm nay — deploy bản chính

```
Bây giờ (Sonnet):     PR-T  →  merge  →  PR-K  →  merge
Sau PR-T, PR-K:       PR-Z2  (bản chính trên Netlify + Turso — Sonnet/Fable; KHÔNG chạy song song với T/K)
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

## PR-Z2 — Bản chính trên Netlify + Turso  *(sau khi PR-T và PR-K đã merge · Sonnet hoặc Fable)*

**Trước khi dán:** chọn mức suy nghĩ cao nhất model cho phép. Để sẵn 2–3 giờ, vì có hai lúc model sẽ **dừng lại hỏi
bạn** (gate 🛑): lần 1 cần database Turso **thử**, lần 2 cần site Netlify + database **bản chính**.

```
Bạn thực thi PR-Z2: đưa PISA Progress lên làm BẢN CHÍNH trên Netlify + Turso.
Đây là bản chính, dữ liệu thật của trung tâm sẽ nằm ở đây. Chất lượng và an toàn quan trọng hơn tốc độ.

KẾ HOẠCH DUY NHẤT BẠN LÀM THEO:
docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md
Đọc HẾT file đó trước khi gõ dòng lệnh đầu tiên — đặc biệt hai mục "Global Constraints" và
"Hướng dẫn riêng cho model thực thi". Rồi đọc plan.md mục 24 và TRIEN_KHAI.md.

CÁCH LÀM:
- Gọi skill superpowers:executing-plans và làm ĐÚNG thứ tự Task 0 → Task 11. Không nhảy, không gộp task.
- Tick từng bước (- [x]) ngay trong file kế hoạch khi xong. Ghi vào bảng "Nhật ký thực thi" cuối file:
  số phép kiểm sau mỗi task, kết quả gate, mọi điều bất ngờ, mọi chỗ bạn phải tự quyết.
- Mỗi task kết thúc bằng: npm run check xanh (số phép kiểm KHÔNG được giảm) → một commit.
- Trước mỗi commit tự rà diff: chỉ chạm đúng các file ghi ở mục "Files" của task? Không có token/mật khẩu?
  Không đổi luật nghiệp vụ nào?

SKILL SUPERPOWERS (gọi bằng tool Skill, đúng lúc):
- using-git-worktrees — Task 0.
- executing-plans — suốt quá trình.
- test-driven-development — ở mọi bước plan ghi "Phép kiểm đỏ": chạy thấy ĐỎ trước, ghi lại, rồi mới viết mã.
- systematic-debugging — BẤT KỲ lúc nào npm run check đỏ mà chưa rõ vì sao. Tìm nguyên nhân gốc.
  TUYỆT ĐỐI không sửa một phép kiểm cũ cho xanh.
- requesting-code-review — Task 11 Step 1, đúng phạm vi plan ghi.
- verification-before-completion — Task 11 Step 2, và trước MỌI câu "đã xong".
- finishing-a-development-branch — Task 11 Step 3. KHÔNG tự merge.

BỐN ĐIỀU TUYỆT ĐỐI:
1. KHÔNG đổi kiểu gọi database sang async (không thêm await vào prepare/get/all/run). Plan đã thử: đổi thư
   viện sang libsql là đủ. Nếu gate Task 3 cho thấy không được → DỪNG, báo tôi. Không tự nghĩ đường khác.
2. KHÔNG ghi token, mật khẩu, URL có token vào bất kỳ file nào trong repo, kể cả Nhật ký và chú thích.
3. KHÔNG chạy lệnh nào xoá hay ghi đè database bản chính. Không bao giờ chạy npm run seed với biến Turso
   bản chính. Mật khẩu quản trị: để TÔI tự gõ, đừng xin.
4. KHÔNG đổi luật nghiệp vụ, KHÔNG dọn mã hay tối ưu ngoài task. Thấy gì đáng sửa → ghi plan.md mục 12.

KHI NÀO DỪNG HỎI TÔI:
- Hai gate 🛑 (Task 3, Task 10): hỏi đúng nguyên văn plan ghi, nói rõ cần để làm gì.
- Gặp tình huống plan không nói tới, hoặc mã thật khác plan mô tả tới mức phải chọn giữa hai cách: dừng,
  ghi Nhật ký, hỏi. Đừng đoán.
- Trước Task 0: nếu main chưa có PR-T và PR-K → dừng, báo tôi.

KHI XONG, báo tôi bằng tiếng Việt cơ bản (tôi không đọc code): link PR; bản chính đã sẵn sàng chưa; số phép kiểm
trước/sau; bảng thời gian tải các trang; việc còn lại; ba việc tôi cần làm tiếp.
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
