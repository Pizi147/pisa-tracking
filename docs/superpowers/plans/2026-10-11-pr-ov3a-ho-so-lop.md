# PR OV-3a — Đầu hồ sơ lớp + ⋯, panel "Thông tin lớp", Tổng hợp, bảng điểm mở sẵn, dòng "Đầu vào" FT

Nguồn: đặc tả OV mục 4 "Hồ sơ lớp", "Hồ sơ lớp FT" (phần Đầu vào), 6.3 nghiệm thu; mockup đã duyệt
`thiet-ke/mockup-overhaul-2-ho-so-lop-lo-trinh-2026-10-11.html` §1, §2, §3, §5 (chỉ phần "Điểm đầu vào ở ô MT0"). Chạy sau OV-1a (đã đổi
nút Nhập điểm → `/test/diem-lop?lop=`). Song song với **OV-2a**.

## Đầu ra — [x] xong (PR OV-3a, 11/10)
1. **Đầu trang** (M2 §1): nút cố định **Nhập điểm** (giữ đường OV-1a) · **+ Case** · **⋯** — không đổi chỗ theo giai đoạn.
   ⋯ cùng thứ tự lớp thường và FT, có tiêu đề nhóm: **Lớp** (Thông tin lớp · Sửa thông tin học viên · + Học viên) → **Lộ trình**
   (thường: Lộ trình tiếp theo [bỏ "…"] · Kỳ vọng đầu ra — giữ tới OV-3b; FT: Chuyển tiếp lớp) → **Công cụ** (Xuất Excel) → kẻ →
   Mở lại lớp / Xoá lớp / Kết thúc lớp. Bỏ "Điểm Test cả lớp / Điểm MT cả lớp", "Sửa phân công", "Lịch Test của lớp / Tuần khai giảng",
   "Sửa thông tin lớp". Mỗi mục giữ điều kiện quyền hiện có. Thanh nhắc Lộ trình: KHÔNG làm ở PR này (OV-3b).
2. **Panel "Thông tin lớp"** (M2 §2): một panel, ba phần theo thứ tự **Lớp → Phân công → Lịch Test của lớp** (FT: "Tuần khai giảng").
   Mỗi phần chế độ xem + nút **Sửa** riêng, **Lưu riêng**; phần lỗi không làm mất chữ phần khác. Phần Lớp: Số lớp + Chương trình,
   chỉ người có quyền hiện nay (`canEditProgress`/QL), **bỏ ô Ghi chú** (giữ cột DB, máy chủ vẫn nhận). Dùng lại 3 đường API sẵn có
   (`PATCH /classes/:id/thong-tin`, `PUT /classes/:id/teachers`, `PATCH /classes/:id/progress`) — không thêm API.
   Mọi lối cũ (badge "thiếu GV" → phân công, link chuyển tiếp trong lịch Test) mở đúng phần của panel mới.
3. **Bảng điểm cuối trang mở sẵn** (`KhoiDiemLop` mặc định mở; vẫn thu gọn được).
4. **Tab Học viên**: cách xem "Điểm" → **"Tổng hợp"**. Lớp thường (`BangDiemLopThuong`): bỏ cột **Dự kiến thi** (bàn + điện thoại);
   "Hướng gợi ý" → **"Lộ trình tiếp theo"**, chỉ hiện hướng **QL đã chốt** (`lo_trinh_tiep_theo.quyet_*`, + bổ trợ nếu có), chưa chốt → "Chưa chốt";
   bỏ gợi ý tự tính khỏi bảng này (Excel, hồ sơ HV, panel cuối khoá giữ nguyên). Cách xem "Lộ trình tiếp theo" (bảng theo hướng) là OV-3b.
5. **FT — dòng "Đầu vào"** (M2 §5): em chưa có MT0 trong `ClassRoster` → dòng mốc "Đầu vào" lấy từ `learning_cycles.baseline_*`
   (chỉ Overall → chỉ cột OVR; có từng kỹ năng → điền L/R/W/S). Chỉ để nhìn: không vào SOS, Overall, Phân tích, Xuất Excel. Chưa có điểm đầu vào
   → như nay ("chưa có điểm").

## Ranh giới (chạy song song OV-2a)
- KHÔNG sửa `shared/domain/people.ts`, `server/src/seed/data.ts`, `server/src/permissions.ts`, `server/src/auth.ts`, `App.tsx`, `OverviewPage.tsx`,
  `platform/*` (của OV-2a). Chung tất yếu: `server/src/tests/run.ts` (một dòng đăng ký) và `plan.md`.
- Không làm OV-3b (thanh nhắc, nháp/chốt, bảng theo hướng, KQĐR) và OV-2b (hồ sơ HV).

## Phép kiểm cũ sẽ đổi (đổi đúng ý mới, KHÔNG xoá cho xanh)
`prDl.tests.ts` (DL-6: nhãn "Điểm Test cả lớp", `mo` mặc định) · `prDh.tests.ts:112` (cột Dự kiến thi) · `prLcb.tests.ts:422-441` ·
`prK26.tests.ts:231` · `prHvl.tests.ts:161-169, 551-554` · `prLop.tests.ts:166-190` · `panelUx3.tests.ts:265, 511` · `prHk2.tests.ts:476-490`.
Giữ ràng buộc chữ `hocVienLop.tests.ts:490-496`. Mỗi phép kiểm đổi: ghi một dòng lý do trong mô tả PR.

## Kiểm
- `server/src/tests/prOv3a.tests.ts` (đăng ký cuối `run.ts`): thứ tự ⋯ hai loại lớp giống nhau theo nhóm; payload roster lớp thường có
  hướng đã chốt, nháp/gợi ý không lọt; dòng "Đầu vào" FT có khi chưa MT0, không có khi đã có MT0, không vào Overall/SOS/Phân tích.
- `npm run check` xanh. Bấm thử demo 1440 + 375 tối: QL + GVCN + GVBM, lớp thường và FT, ba phần panel lưu riêng (cố ý làm một phần lỗi).
  Ảnh vào `thiet-ke/anh/pr-ov3a/`.

## Prompt (Opus 5.5 · High; B: Sonnet 5.5 · High)

```
Session CODE cho PR OV-3a (hồ sơ lớp: đầu trang + ⋯, Thông tin lớp, Tổng hợp, dòng Đầu vào FT), repo Pizi147/pisa-tracking,
nhánh mới từ main (đã có OV-1a). Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Đọc CLAUDE.md, plan.md mục 1.2–1.3b, rồi
docs/superpowers/plans/2026-10-11-pr-ov3a-ho-so-lop.md (làm đủ Đầu ra) và mockup
thiet-ke/mockup-overhaul-2-ho-so-lop-lo-trinh-2026-10-11.html §1, §2, §3, §5 (phần Đầu vào).
PR này chạy SONG SONG với OV-2a: tuân thủ mục "Ranh giới"; dùng PORT/WEB_PORT riêng (vd 4080/5253).
impeccable: `layout`, `clarify`, `harden`, `adapt`, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần trên demo (1440 + 375, tối), ảnh vào thiet-ke/anh/pr-ov3a/ và mô tả PR.
Không deploy, không chạm Turso/Netlify. Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ngắn.
```
