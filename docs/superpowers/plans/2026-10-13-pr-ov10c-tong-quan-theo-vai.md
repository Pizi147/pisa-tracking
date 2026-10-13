# PR OV-10c — Tổng quan theo vai: Admin "Mock Test" · TVV "Học viên của tôi" · CX "Số liệu"

Nguồn: **chủ SP 13/10** "hiển thị hợp lý theo từng vai"; mockup `thiet-ke/mockup-vai-tvv-admin-cx-2026-10-13.html` **đã duyệt 13/10** (mục 4, 5, 6 dòng Tổng quan).
Chạy **sau OV-8b merge**, song song **OV-9**, **OV-10a**. Rà: **mặc định** + số liệu cùng nguồn.

## Hiện trạng (planning rà vai 13/10, session code kiểm lại)
- `web/src/modules/worklist/OverviewPage.tsx`: tab "Việc hôm nay · Phân tích" trên đường dẫn (`/`, `/phan-tich`); khối theo dáng QL (Case / PA, "PA chưa có Kết quả").
- Admin: Tổng quan dáng QL — ô Case / PA không phải việc Admin. CX: tab "Việc hôm nay" mà không có việc; `BranchPulse.tsx:81` có "Theo giáo viên" (CX không xem GV → 403).
- TVV: Tổng quan chưa có khối riêng cho "HV của tôi".

## Đầu ra
1. **Admin** (mockup mục 4): tab đầu tên **"Mock Test"**; bốn ô bấm được: **Lượt MT tuần này** · **Ô điểm chưa nhập** (n quá hạn) · **Đề nghị dời chờ** · **MT chưa xếp lịch**
   — mỗi ô mở đúng chỗ ở Test / Công việc với bộ lọc sẵn. Danh sách **GV chấm quá hạn** (GV · kỹ năng · lớp · lượt · số ô · quá hạn n ngày) có nút **Nhắc**
   (dùng lại Nhắc của Công việc, cùng chống nhắc trùng). Lịch sắp tới giữ (OV-6a). Bỏ ô Case / PA, "PA chưa có Kết quả".
2. **TVV**: tab đầu **"Học viên của tôi"**: ô bấm được **Cần chú ý · Tạm dừng · Sắp thi · Thiếu thông tin** (+ Chờ QL chọn bước tiếp nếu có) → mở Học viên & Lớp đã lọc
   sẵn đúng chip (OV-10b; trước khi OV-10b merge: mở danh sách với tham số lọc, chip đọc tham số).
3. **CX**: tab đầu **"Số liệu"** (bỏ "Việc hôm nay"); bỏ lựa chọn "Theo giáo viên" ở `BranchPulse`; ô bấm được như TVV, mọi chi nhánh.
4. Số đếm ở Tổng quan **cùng hàm** với danh sách nó mở (việc đã xong không còn đếm). QL, GVCN, GVBM **không đổi**.

## Ranh giới
- Vùng: `web/src/modules/worklist/{OverviewPage,BranchPulse,MetricTiles,HocVienCuaToi,Highlights}.tsx` + khối mới cùng thư mục; máy chủ: đường Tổng quan
  (`server/src/worklist/*` phần đếm cho Admin / TVV / CX — dùng lại hàm đếm của Test / Công việc / danh sách HV, không viết hàm đếm thứ hai).
- KHÔNG sửa: bảng Học viên & Lớp, hồ sơ HV / lớp (OV-10b), nút sai quyền ngoài Tổng quan (OV-10a), luật KCK (OV-9). Không đổi quyền vai.
- Chung tất yếu: `routes/index.ts`, `tests/run.ts`, `tocDoDuong.ts`, `CODE_MAP.md`, `plan.md`.

## Kiểm
- `server/src/tests/prOv10c.tests.ts` (đỏ trước): Admin nhận 4 số đúng (bằng số ở màn nó mở), danh sách GV chấm quá hạn đúng, Nhắc ghi đúng và không trùng; Admin
  không nhận khối Case / PA; TVV đếm đúng HV của mình theo từng chip; CX đếm mọi chi nhánh, không nhận số theo GV (đường "Theo giáo viên" với CX vẫn 403); QL không đổi.
- Tốc độ: đường Tổng quan mỗi vai trong trần `tocDoDuong.ts` (cả ×3 dữ liệu).
- `npm run check` xanh. Bấm thử một lần: Admin 1440 tối + 375 sáng (bấm từng ô, Nhắc), TVV 375 sáng, CX 1440 tối. Ảnh `thiet-ke/anh/pr-ov10c/`.

## Prompt (Opus 5.5 · High; B: Sonnet 5.5 · High)

```
Session CODE cho PR OV-10c (Tổng quan theo vai: Admin "Mock Test", TVV "Học viên của tôi", CX "Số liệu"), repo Pizi147/pisa-tracking,
nhánh mới từ origin/main mới nhất (đã có OV-8b). Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b, 3 (dòng 13/10 "Hiển thị theo vai") và 9.0, rồi docs/superpowers/plans/2026-10-13-pr-ov10c-tong-quan-theo-vai.md (làm ĐỦ Đầu ra),
mockup thiet-ke/mockup-vai-tvv-admin-cx-2026-10-13.html mục 4–6 (đã duyệt). Số đếm dùng lại hàm đếm sẵn có — một số liệu một nguồn.
PR này chạy SONG SONG với OV-9 và OV-10a: tuân thủ "Ranh giới"; PORT/WEB_PORT 4270/5443; `npm run check` tối đa 3 máy cùng lúc.
test-driven-development (prOv10c.tests.ts đỏ trước). impeccable (skill có sẵn trong repo): `layout`, `clarify`, `adapt` trong phạm vi PR, sau đó `audit` trước khi mở PR.
`/ponytail-review` trước khi mở PR. `npm run check` xanh, bấm thử một lần (Admin 1440 tối + 375 sáng, TVV 375 sáng, CX 1440 tối), ảnh vào thiet-ke/anh/pr-ov10c/ và mô tả PR.
Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá).
Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ngắn.
```

## Tự quyết (planning, báo chủ SP)
- TVV Tổng quan là ô đếm bấm được (không bảng thứ hai) — bảng chi tiết ở Học viên & Lớp (OV-10b).
