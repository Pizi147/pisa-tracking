# PR OV-6b1 — Quản trị › Chương trình: sửa cấu hình, chép vào lớp lúc tạo, tuần MT FT đọc từ cấu hình

**[x] Đã làm 12/10** — nhánh `claude/pensive-knuth-qt9uk0` (session code OV-6b1).

Nguồn: đặc tả OV mục 1 dòng 7.3, mục 4 "Chương trình + PET/KET", 6.7; plan.md mục 3 dòng 11/10 "Lộ trình tự cấu hình: Quản trị tạo/sửa, áp cho lớp mở sau";
mockup đã duyệt `thiet-ke/mockup-overhaul-3-tong-quan-vai-chuong-trinh-2026-10-11.html` **§6** (dòng ~486–553). OV-6b của đặc tả tách hai PR:
**OV-6b1** (này — cấu hình chương trình đang có) và **OV-6b2** (chương trình mới: Liên tục, Lặp mỗi n tuần, môn gộp, PET/KET). Rà: **sâu** (migrate lịch).
Song song được với **OV-4a**, **OV-4b**.

## Hiện trạng (planning đọc mã 12/10, session code kiểm lại)
- Bảng: `programmes` (`schema.sql:30-37`, `weeks` NULL = FT), `programme_skills` (`:40-45`), `programme_checkpoints` (`:49-54`, khoá (mã, kind) → tối đa
  một progress + một final), `routes` (`:204-211`, LT1 / RF). Lớp đã có bản chụp `so_tuan / tuan_giua_khoa / tuan_cuoi_khoa` (`:92-94`, NULL với FT) do
  `mocChupVaoLop` (`normal/regular.ts:88`, gọi ở `intake.ts:590`, `thongTinLop.ts:71`); đọc ở `computeProgress` (`classes/schedule.ts:439-534`: lớp
  chưa có bản chụp đọc **cấu hình sống** `:453-455`).
- **Tuần MT FT viết cứng theo lộ trình**: `lichMtMacDinh` (`shared/domain/lichMt.ts:19-22`: RF [4,8], còn lại [6,12,16]), `tuanHocCuaMt` (`:25-30`).
  Nơi gọi: `schedule.ts:83-85` (`goiYLo` → `apLichMacDinhLo` → `taoMtMacDinhLo`), `schedule.ts:564` (`XONG_MT_CUOI_SQL` viết cứng route='RF'),
  `intake.ts:314-321`, `keHoachTest.ts:333`, `lichMt.ts:90,124,147` (`cauMtSeDoi` → `StudentManagePanel.tsx:407`, `suaCaLop.ts:168`), `tenLop.ts:75-80`.
  **FT không có bản chụp**: đổi tuần bắt đầu tính lại MT tự động theo hằng số hiện hành (`schedule.ts:129-131`).
- Ngưỡng đạt: một hằng `RATIO_PASS_THRESHOLD = 0.7` (`normal/normal.ts:38`, 8 file dùng).
- Quản trị: `/quan-tri` (`App.tsx:207`, quyền `admin.config` chỉ Quản trị), tab "Lộ trình & chương trình" (`platform/AdminPage.tsx:31-35`) →
  `CatalogAdmin.tsx` (bảng + `ProgrammeDialog`) ↔ `sysconfig.ts:67 listProgrammes`, `:91 saveProgramme` (luật K1-48 cấm mã mới `:19,104`;
  khoá cách chấm + môn `:105-106`; cột "lớp" đếm cả lớp đã kết thúc `:76`).

## Đầu ra
1. **Tab "Chương trình"** (đổi tên tab hiện có; các tab khác giữ). Bảng (mockup §6): Chương trình · Cách chấm · Độ dài · Mốc Test · **Lớp đang chạy**
   (chỉ lớp đang chạy). Dòng FT theo lộ trình: "FT · LT1" (16 tuần · MT1 t6 · MT2 t12 · MT3 t16), "FT · RF" (8 tuần · MT t4 · t8).
   Điện thoại: danh sách thẻ (tên + một dòng "10 tuần · Progress t5 · Final t10" / "16 tuần · MT t6 · t12 · t16").
2. **Panel sửa** (`KhungPanel` 520): đầu "{mã}" / "Áp cho lớp mở sau khi lưu · n lớp đang chạy" / ×. Trường: Tên · Môn (chỉ đọc ở PR này) ·
   Cách chấm (chỉ đọc, như nay) · **Đạt từ** (%, chỉ chương trình đúng/tổng) · Độ dài (số tuần) · **Mốc Test**: lớp thường "Progress tuần [a] · Final tuần [b]";
   FT theo lộ trình "MT tuần [6] · [12] · [16]" (thêm / bớt mốc). Huỷ / Lưu; lỗi đúng ô, giữ chữ (mốc ≤ số tuần, tăng dần, Progress < Final).
3. **"Áp cho lớp mở sau"** — chép vào lớp lúc tạo (và lúc đổi chương trình ở Thông tin lớp, như `mocChupVaoLop`): số tuần + mốc (đã có) + **mới**
   `classes.lich_mt` (tuần MT của lộ trình FT) + `classes.nguong_dat`. Lớp đang chạy **không đổi lịch** khi Quản trị sửa.
4. **Tuần MT FT đọc từ bản chụp của lớp**: `lichMtMacDinh` / `tuanHocCuaMt` nhận danh sách tuần làm tham số; mọi nơi gọi ở "Hiện trạng" truyền bản chụp lớp
   (web nhận qua API sẵn có, không tự đoán); `XONG_MT_CUOI_SQL` bỏ route='RF' viết cứng. Chữ luật lộ trình (`tenLop.ts:75-80`) đọc cấu hình.
5. **Ngưỡng đạt theo lớp**: mọi chỗ dùng `RATIO_PASS_THRESHOLD` đọc `nguong_dat` của lớp (thiếu → 0.7). Một hàm, không chép ngưỡng khắp nơi.
6. **Migrate** `server/src/migrate/prOv6b1.ts` (tự kiểm, chạy lại không đổi gì; đăng ký `migrate.ts`; cập nhật `schema.sql` + `seed/duLieuNen.ts`):
   thêm cột `routes.lich_mt` (điền [6,12,16] LT1, [4,8] RF), `programmes.nguong_dat` (0.7), `classes.lich_mt`, `classes.nguong_dat`;
   **điền bản chụp cho MỌI lớp hiện có trước khi mã đọc cấu hình** — FT theo hằng số hiện hành, lớp thường thiếu `so_tuan` theo cấu hình hiện hành.
   In số lớp đã điền. `ops/initBanChinh.ts` chép thêm cột mới.

## Ranh giới (song song OV-4a, OV-4b)
- Vùng PR này: `schema.sql`, `migrate/prOv6b1.ts`, `migrate.ts`, `seed/duLieuNen.ts`, `platform/sysconfig.ts`, `normal/{normal,regular}.ts` (chỉ `mocChupVaoLop` + ngưỡng),
  `classes/{schedule,intake,thongTinLop,suaCaLop}.ts`, `fasttrack/mtMacDinh.ts`, `shared/domain/{lichMt,tenLop}.ts`, web `platform/{AdminPage,CatalogAdmin}.tsx`,
  `students/StudentManagePanel.tsx` (chỉ chỗ `cauMtSeDoi`), `ops/initBanChinh.ts`.
- KHÔNG làm ở PR này (OV-6b2): mã chương trình mới, "+ Chương trình", Liên tục, Lặp mỗi n tuần, môn gộp, PET/KET, đặt tên lớp mới.
  KHÔNG sửa (OV-4a): `huyLuot` / `ketQuaHuy.ts` / `test/keHoach/*`; (OV-4b): `cham/*`, ô điểm, đường ghi điểm lớp thường trong `regular.ts`.
- Chung tất yếu: `routes/index.ts`, `tests/run.ts`, `tocDoDuong.ts`, `CODE_MAP.md`, `plan.md`; `keHoachTest.ts:333` (một dòng, OV-4a cũng sửa file này) → gộp main trước khi mở PR.

## Kiểm
- `server/src/tests/prOv6b1.tests.ts` (đỏ trước, đăng ký cuối `run.ts`):
  - Quản trị sửa LT1 thành MT tuần [5,10,15] → lớp FT **mới** có MT tuần 5/10/15; lớp FT **đang chạy**: đổi tuần bắt đầu vẫn ra 6/12/16 (bản chụp).
  - Sửa BE Progress tuần 6 → lớp BE mới tuần 6; lớp BE đang chạy giữ tuần 5. RF giữ [4,8], `XONG_MT_CUOI_SQL` đúng với bản chụp.
  - "Đạt từ" BE = 75 % → lớp BE mới 72 % = không đạt; lớp BE cũ 72 % = đạt.
  - Kiểm dữ liệu: mốc > số tuần, mốc giảm dần, Progress ≥ Final → 400 đúng ô. QL / GV gọi API sửa → 403.
  - Migrate: lớp FT cũ có `lich_mt` = hằng số cũ; chạy hai lần không đổi; demo trước/sau migrate **cùng lịch MT mọi em** (so toàn bộ `planned_period_id`).
  - Cột "Lớp đang chạy" không đếm lớp đã kết thúc.
- Phép kiểm cũ đổi đúng ý (dự kiến `prLop:95-105`, `prMt:9-13,219`, `run.ts:4323`, `banChinh.tests.ts:522`), KHÔNG xoá cho xanh.
- `npm run check` xanh. Bấm thử một lần: Quản trị (1440 tối: danh sách, sửa LT1, sửa BE; 375 sáng: thẻ). Ảnh `thiet-ke/anh/pr-ov6b1/`.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)

```
Session CODE cho PR OV-6b1 (Quản trị › Chương trình: sửa cấu hình chương trình đang có, chép vào lớp lúc tạo, tuần MT FT đọc từ cấu hình), repo Pizi147/pisa-tracking,
nhánh mới từ origin/main mới nhất. Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b, 3 (dòng 11/10 "Lộ trình tự cấu hình") và 9.0, đặc tả docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md
mục 1 (7.3), 4, 6.7, rồi docs/superpowers/plans/2026-10-12-pr-ov6b1-chuong-trinh-cau-hinh.md (làm ĐỦ Đầu ra + migrate) và mockup
thiet-ke/mockup-overhaul-3-tong-quan-vai-chuong-trinh-2026-10-11.html §6.
PR này chạy SONG SONG với OV-4a và OV-4b: tuân thủ mục "Ranh giới"; PORT/WEB_PORT 4140/5313; `npm run check` tối đa 3 máy cùng lúc.
test-driven-development (prOv6b1.tests.ts đỏ trước). Luật số 1: lớp đang chạy KHÔNG đổi lịch — migrate điền bản chụp trước khi mã đọc cấu hình.
impeccable: `layout`, `clarify`, `harden`, `adapt` trong phạm vi PR, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần (Quản trị 1440 tối + 375 sáng), ảnh vào thiet-ke/anh/pr-ov6b1/ và mô tả PR. Không deploy, không chạm Turso/Netlify.
Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP.
Báo cáo tiếng Việt, ngắn.
```

## Tự quyết (planning, báo chủ SP)
- Số liệu trong mockup (FOU 12 tuần 6/12, "Basic English") là ví dụ: giữ số đang chạy; Quản trị tự sửa trên màn mới nếu cần.
- Chỉ đổi tên tab "Lộ trình & chương trình" → "Chương trình"; không dựng tab "Vai trò", "Chi nhánh" của mockup (ngoài phạm vi OV).
- Ngưỡng "Đạt từ" chép vào lớp lúc tạo như mốc (lớp cũ giữ 70 %).
