# PR OV-6a — Lịch sắp tới gọn (chạy song song với OV-1a)

Nguồn: đặc tả OV mục 7.1 / D1 (`docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md`), mockup đã duyệt
`thiet-ke/mockup-overhaul-3-tong-quan-vai-chuong-trinh-2026-10-11.html` §1 (1440 + 375).

## Phạm vi
- `web/src/modules/worklist/Highlights.tsx` (`LichSapToi`), chỗ đặt khối trong `OverviewPage.tsx` nếu cần cho chiều cao.
- `server/src/worklist/highlights.ts` CHỈ khi thiếu dữ liệu (ưu tiên dùng nguyên `/highlights`, không đếm thêm).
- `web/src/modules/test/KeHoachTestTab.tsx` CHỈ để nhận tham số tuần trên URL (nếu chưa có).
- Không chạm file của OV-1a (Chấm điểm, Điểm theo lớp, regular/cham server) → song song an toàn.

## Đầu ra
1. Ba tab tuần: “Tuần này · W2 OCT” · “Tuần sau · W3 OCT” · mã tuần kế; mỗi tab kèm tổng số em; mặc định tuần này.
2. Trong tab: **mỗi lớp một dòng**, các lượt là chip (“MT3 · 2 em”; lớp thường: “Progress · n em”, “Final · n em”, “Hết khoá”), cột kỹ năng như mockup.
   Bấm tên lớp → hồ sơ lớp (như nay). Tối đa 5 lớp, còn lại “+ n lớp” (bấm mở hết tại chỗ).
3. “Dự kiến thi IELTS · n em” một dòng riêng cuối tuần. “Chưa xác định tuần” giữ ở chân khối (như nay).
4. “Xem toàn bộ lịch ›” → Test › Kế hoạch Test đúng **tuần đang xem, chi nhánh, chương trình** (`cn`, `loai`, thêm tham số tuần nếu tab chưa nhận).
5. Khối không cao hơn “Điểm đáng chú ý”; bảng “Theo lớp” lên màn đầu (1440). 375: như mockup (chip rút gọn “MT3 · 2”).
6. Trống: “Không có đợt Test nào trong tuần này.” Đang tải: Skeleton như nay. GV (`ct = null`) vẫn thấy gộp hai khung.

## Không làm
- Không đổi API trả về trừ khi thiếu; không thêm trạng thái/nhãn đỏ (sự kiện chưa đến không quá hạn).

## Kiểm
- `npm run check` xanh. Bấm thử demo 1440 + 375 tối: 3 tab, gom lớp, “+ n lớp”, link Xem toàn bộ lịch đúng tuần/CN/CT, GV gộp. Chụp ảnh gửi planning.

## Prompt (Opus 5.5 · High; B: Sonnet 5.5 · High)

```
Session CODE cho PR OV-6a (Lịch sắp tới gọn), repo Pizi147/pisa-tracking, nhánh mới từ main.
Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Đọc CLAUDE.md, plan.md mục 1.2–1.3b, rồi
docs/superpowers/plans/2026-10-11-pr-ov6a-lich-sap-toi-gon.md (làm đủ phần Đầu ra) và mockup
thiet-ke/mockup-overhaul-3-tong-quan-vai-chuong-trinh-2026-10-11.html §1.
PR này chạy song song với OV-1a: KHÔNG sửa file ngoài phạm vi ghi trong kế hoạch; dùng PORT/WEB_PORT riêng (vd 4060/5233).
impeccable: `layout`, `clarify`, `adapt`, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần trên demo (1440 + 375, tối), đính ảnh vào mô tả PR.
Không deploy, không chạm Turso/Netlify. Mở PR vào main, gửi link cho chủ SP. Báo cáo tiếng Việt, ngắn.
```
