# PR OV-1e — migrate `prOv1b`: em đang chờ THI LẠI thì giữ lịch thi lại (không thành "Không dự thi")

Nguồn: planning 13/10 đọc kết quả `kiem-truoc-ov1b` trên **bản chính** (48 ô); chủ SP 13/10 "tôi theo bạn" → chọn **giữ lịch thi lại**.
Không giao diện. Rà: **sâu** (đổi dữ liệu bản chính). Chạy **trước deploy**.

## Vấn đề
`server/src/migrate/prOv1b.ts` nhánh **B-da** ("-" nhập bù sau tuần thi, đã chốt theo luật cũ → máy đã dời): đổi thành "Không dự thi", trả bài về tuần có "-".
Trên bản chính ~10 em đang có lịch **thi lại W2 / W3 OCT** (vd Trịnh Trung Hiếu CP FT 139 MT2, Tạ Nhật Anh CP FT 139 MT1, Phạm Tiến Đạt CP FT 131 MT4,
Trần Gia Khánh CP FT RF 01 MT1, Phạm Vũ Minh Anh CP FT 140 MT2 W1/W2/R…) — chạy như hiện nay thì **mất lịch thi lại**, GV không thấy bài, QL phải xếp tay.

## Đầu ra
1. Nhánh **B-da**: buổi mà bài **đang xếp ở tuần ≥ tuần hiện tại** (`attempt_skills.planned_period_id` → `week_start >= mondayOf(demoToday())`, `sit_status`
   chưa có điểm, chưa huỷ) → **bỏ qua** (không đổi gì: giữ "-" đã chốt, giữ lần vắng, giữ lịch thi lại). In một dòng "giữ lịch thi lại W3 OCT" ở báo cáo.
2. Các nhánh khác (A, B-chua, B-da với lịch đã qua, C) **không đổi**.
3. `kiemTruocOv1b` dùng **cùng** điều kiện (một hàm) — danh sách chỉ đọc khớp bản ghi thật.

## Ranh giới
- Vùng: `server/src/migrate/prOv1b.ts`, `server/src/ops/kiemTruocOv1b.ts`, `server/src/tests/prOv1b.tests.ts`. Không đổi luật vắng / dời đang chạy.

## Kiểm
- `prOv1b.tests.ts` thêm ca (đỏ trước): "-" nhập bù đã chốt, máy dời sang tuần hiện tại / tuần sau → migrate giữ nguyên (lịch, lần vắng, "-"); dời sang tuần đã qua → như cũ
  (Không dự thi, về tuần "-"); `kiemTruocOv1b` liệt kê đúng như bản ghi; chạy hai lần không đổi gì.
- `npm run check` xanh. Không ảnh.

## Prompt (Opus 5.5 · High; B: Sonnet 5.5 · High)

```
Session CODE cho PR OV-1e (migrate prOv1b: em đang chờ thi lại thì giữ lịch thi lại, không thành "Không dự thi"), repo Pizi147/pisa-tracking,
nhánh mới từ origin/main mới nhất. Không dùng Fable. Gọi skill karpathy-guidelines. ponytail full (không giao diện).
Đọc CLAUDE.md, plan.md mục 1.2 và 5, rồi docs/superpowers/plans/2026-10-14-pr-ov1e-giu-lich-thi-lai.md (làm ĐỦ Đầu ra).
PORT/WEB_PORT 4310/5483; `npm run check` tối đa 3 máy cùng lúc. test-driven-development (ca mới trong prOv1b.tests.ts đỏ trước).
Đây là migrate ĐỔI DỮ LIỆU bản chính: một hàm điều kiện dùng chung cho migrate và kiemTruocOv1b; chạy lặp không đổi gì. `/ponytail-review` trước khi mở PR.
Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md. Mở PR vào main, KHÔNG merge,
gửi link cho chủ SP. Báo cáo tiếng Việt, ngắn.
```
