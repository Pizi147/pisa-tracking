# PR OV-5b — Quay lại đúng nơi bắt đầu, toàn hệ thống

Nguồn: đặc tả OV mục 4 "Quay lại", 6.6 (câu "Quay lại từ hồ sơ về đúng nguồn…"); mockup đã duyệt
`thiet-ke/mockup-overhaul-1-cong-viec-diem-mt-2026-10-11.html` **§6** (dòng ~644–720). Song song được với **OV-5a**, **OV-6b2**. Rà: mặc định (giao diện + điều hướng).

## Hiện trạng (planning đọc mã 13/10, session code kiểm lại)
- Chỉ hồ sơ HV (`students/StudentDetailPage.tsx`) và hồ sơ lớp (`classes/DauTrangLop.tsx`) có thanh `ThanhTruocSau` (`web/src/ui/ThanhTruocSau.tsx`):
  "← Quay lại" = lùi trình duyệt (`navigate(-1)`), chữ chung; mở thẳng link (`location.key === 'default'`) → `/hoc-vien` (`:48-52`); ‹ Trước / Sau › trong danh sách.
- Hồ sơ khác không có Quay lại theo nguồn: lượt MT `/mock-test/:id` (`fasttrack/MockDetailPage.tsx`), GV `/giao-vien/:id`, Case `/hoc-thuat/case/:id`;
  trang Nhập điểm `ChamDiemPage.tsx` có "← Test" cố định.
- Trang nguồn: Tổng quan `/`, Công việc `/cong-viec/:tab?`, Test `/test/:tab?`, Phân tích `/phan-tich`, Học viên & Lớp `/hoc-vien`, hồ sơ lớp (cách xem `?che-do=`).

## Đầu ra
1. **Một cơ chế chung** (`web/src/lib/…`, nhỏ): khi bấm link từ trang nguồn sang một hồ sơ, ghi **nguồn** = URL đầy đủ (đường dẫn + query: bộ lọc, tab,
   cách xem) + **vị trí cuộn** + **tên nguồn** (vd "Công việc · Quá hạn", "Lịch Test · W2 OCT", "Hồ sơ lớp CP FT 131 · Cần hỗ trợ") vào `sessionStorage`,
   **chồng tối đa 5**. Không thêm gì vào URL hồ sơ; không đổi máy chủ.
2. **Mọi hồ sơ** (HV, lớp, lượt MT, GV, Case) có nút **"‹ {tên nguồn}"** ở đầu trang → về **đúng URL nguồn** và **khôi phục vị trí cuộn** (dùng `cuonOnDinh`
   / cơ chế cuộn sẵn có). Panel đang mở ở nguồn mở lại nếu URL nguồn có ghi (không bắt buộc ghi thêm trạng thái ngoài URL).
3. **Đi tiếp hồ sơ → hồ sơ**: nút vẫn về **nguồn đầu tiên**; menu nhỏ cạnh nút liệt kê các bước đã qua (≤ 5), bấm bước nào về bước đó (mockup §6).
4. **Mở thẳng bằng link / tải lại trang** (không có nguồn trong `sessionStorage` của tab): về **trang cha** như hiện nay ("‹ Học viên & Lớp", lượt MT → hồ sơ HV
   của em, Case → hồ sơ HV, GV → Phân tích / Quản trị theo vai). Giữ "‹ Trước · Sau ›" của danh sách HV / lớp (`ThanhTruocSau`) — chỉ thay nút Quay lại.
5. **Trang nguồn ghi đủ trạng thái lên URL** để quay về đúng: Tổng quan (khối đang mở), Test (tab, tuần, lớp, lượt), Phân tích (tab, tuần), Học viên & Lớp
   (lọc, tìm), hồ sơ lớp (cách xem). Công việc: bộ lọc do **OV-5a** đặt lên URL — PR này chỉ đọc. Chỗ nào bộ lọc chưa lên URL thì đưa lên (không đổi giao diện).
6. Trang Nhập điểm (`/nhap-diem/:classId`): "← Test" thành "‹ {tên nguồn}" theo cùng cơ chế.

## Ranh giới (song song OV-5a, OV-6b2)
- Vùng PR này: `web/src/ui/ThanhTruocSau.tsx` + lib mới, đầu trang `StudentDetailPage.tsx`, `DauTrangLop.tsx`, `MockDetailPage.tsx` (chỉ phần đầu trang),
  trang GV, trang Case, `ChamDiemPage.tsx`, chỗ ghi query của Tổng quan / Test / Phân tích / Học viên & Lớp.
- KHÔNG sửa: `web/src/modules/congViec/*`, `worklist/{WorkList,NhomViec}.tsx` (OV-5a — chỉ dùng chung hàm "mở hồ sơ" nếu OV-5a đã merge; nếu chưa, OV-5a
  gộp sau), máy chủ, `normal/*`, `platform/*` (OV-6b2).
- Chung tất yếu: `tests/run.ts`, `CODE_MAP.md`, `plan.md`.

## Kiểm
- `server/src/tests/prOv5b.tests.ts` (đỏ trước; kiểm hàm thuần của lib): ghi nguồn → đọc lại đúng URL + cuộn + tên; chồng > 5 bỏ cũ nhất; hồ sơ → hồ sơ giữ
  nguồn đầu; không có nguồn → trang cha đúng từng loại hồ sơ; URL nguồn ngoài app / lạ bị bỏ (không mở trang ngoài).
- Bấm thử một lần (Playwright, ghi trong PR): Công việc (lọc Quá hạn, cuộn) → hồ sơ HV → Quay lại về đúng lọc + cuộn; Lịch Test W2 OCT → lượt MT → hồ sơ HV →
  menu bước → về Lịch Test; Phân tích → hồ sơ lớp → Quay lại; mở link thẳng → trang cha. 1440 tối + 375 sáng, QL + GVBM. Ảnh `thiet-ke/anh/pr-ov5b/`.
- `npm run check` xanh (phép kiểm khung `prKhung` / `do-khung` không lỗi mới).

## Prompt (Opus 5.5 · High; B: Sonnet 5.5 · High)

```
Session CODE cho PR OV-5b (Quay lại đúng nơi bắt đầu, toàn hệ thống), repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất.
Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b và 9.0, đặc tả docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md mục 4 "Quay lại", 6.6, rồi
docs/superpowers/plans/2026-10-13-pr-ov5b-quay-lai.md (làm ĐỦ Đầu ra) và mockup thiet-ke/mockup-overhaul-1-cong-viec-diem-mt-2026-10-11.html §6.
PR này chạy SONG SONG với OV-5a và OV-6b2: tuân thủ mục "Ranh giới"; PORT/WEB_PORT 4190/5363; `npm run check` tối đa 3 máy cùng lúc.
test-driven-development (prOv5b.tests.ts đỏ trước). Một cơ chế chung, không viết riêng từng trang.
impeccable (skill có sẵn trong repo): `clarify`, `harden`, `adapt` trong phạm vi PR, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần (QL + GVBM, 1440 tối + 375 sáng), ảnh vào thiet-ke/anh/pr-ov5b/ và mô tả PR. Không deploy, không chạm Turso/Netlify.
Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP.
Báo cáo tiếng Việt, ngắn.
```

## Tự quyết (planning, báo chủ SP)
- Nguồn lưu theo tab trình duyệt (`sessionStorage`): mở tab mới / tải lại → về trang cha (đúng mockup "mở thẳng bằng link").
- Không lưu trạng thái ngoài URL (vd ô đang gõ dở) — chỉ URL + vị trí cuộn.
