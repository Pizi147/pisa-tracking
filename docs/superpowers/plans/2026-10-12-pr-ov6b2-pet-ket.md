# PR OV-6b2 — Chương trình mới (Liên tục, Lặp mỗi n tuần, môn gộp) + PET / KET

Nguồn: đặc tả OV mục 1 dòng 7.4, mục 4 "Chương trình + PET/KET", 6.7; plan.md mục 3 dòng 11/10 "PET/KET: môn L+S, R+W; checkpoint mỗi 6 tuần; liên tục;
chấm số câu đúng/tổng như lớp thường" + "PET/KET chưa đạt: chỉ chip SOS nhỏ, không tự tạo Case/PA; không Target, không lộ trình tiếp theo; tên `{CN} PET {số}`";
mockup `thiet-ke/mockup-overhaul-3-tong-quan-vai-chuong-trinh-2026-10-11.html` **§6** (panel PET, bảng "Lớp PET · Điểm theo lớp · Checkpoint 2").
Chạy **sau OV-6b1** (dùng màn + bản chụp của nó). Rà: **sâu** (nhiều cổng chương trình, sinh lượt mới).

## Hiện trạng (planning đọc mã 12/10, session code kiểm lại)
- Mã chương trình cố định: `PROGRAMME_CODES` (`normal/normal.ts:14`), `programmeOf` (`:209`) trả **null** cho mã lạ, và null bị hiểu là FT
  (`normal.ts:145,159`, `yThuc.ts:118`). Tạo lớp chặn mã lạ (`intake.ts:627-629`, `thongTinLop.ts:39-40`); tên lớp: `kyHieuLop` / `ghepMaLop`
  (`shared/domain/tenLop.ts:9-29`, regex `:41`, thứ tự `:3`). Danh sách cố định khác: `metrics.ts:276`, `mt0.ts:15`, `kyVong.ts:47`, `cuoiKhoa.ts:723-731`,
  `lenhChuyen.ts:752`, `profile.ts:802`, `LuoiTaoLop.tsx:34`, `ClassCreatePanel.tsx:21`.
- Môn L/R/W/S tách, theo dữ liệu (`programme_skills`, `class_skills` `schema.sql:116`); tiền lệ môn gộp: Pre FOU `tong_hop` (`normal.ts:17`).
- Lượt lớp thường chỉ hai loại `progress` / `final`, mỗi lộ trình một lượt mỗi loại (`cham/diemTheoLuot.ts:4`, khoá `thuong:<kind>` `shared/domain/diemTheoLuot.ts:11-17`,
  `keHoachTest.ts:735,825-830,1056`); sinh lượt: `taoBaiThuongMacDinh` (`regular.ts:379`), `planRegularTests` (`:259`).
- SOS lớp thường → Case chỉ cho `progress` + FOU/BE/ELE (`regular.ts:766-838`, `lopThuong.ts:12-17`); môn không có trong `REGULAR_TO_CATEGORY`
  (`cases.ts:~180`) → không Case.
- Không có "liên tục" (ngoài FT `weeks` NULL). Lớp không FT + `weeks` NULL: không bao giờ "đã kết thúc", mất nhãn tuần (`schedule.ts:481-516`), không tự
  kết thúc (`luatLoTrinh.ts:214-220`), thôi nhắc tuần bắt đầu (`schedule.ts:783`); và bị cho vào Lộ trình tiếp theo / KQĐR / Cuối khoá qua cổng `!is_fast_track`
  (`loTrinhTiep.ts:62,378`, `normal/cuoiKhoa.ts:57`, `classes.ts:801`, `profile.ts:750,811`).

## Đầu ra
1. **"+ Chương trình"** ở tab Chương trình (bỏ luật K1-48 cấm mã mới): Mã (2–6 chữ in hoa / số, không trùng, không sửa sau khi có lớp) · Tên ·
   **Môn** (chip, chọn từ danh sách cố định: L · R · W · S · L+S · R+W) · Cách chấm (chương trình mới: **Đúng / tổng**; "Band IELTS" mờ, ghi "chỉ FT") ·
   Đạt từ (%) · **Độ dài** "Số tuần | Liên tục" · **Mốc Test** "Tuần cố định | Lặp mỗi n tuần" ("[Checkpoint] mỗi [6] tuần"). Áp cho lớp mở sau (bản chụp OV-6b1 + `moc_lap`).
2. **Mã mới dùng được mọi nơi**: `programmeOf` đọc bảng `programmes` (mã lạ không còn thành FT); tạo lớp một / nhiều lớp nhận mã mới; tên lớp
   **`{CN} {MÃ} {số}`** (vd `CP PET 01`), gợi ý số kế tiếp như nay. Mọi danh sách cố định ở "Hiện trạng" xét lại: chỗ nào là luật FOU/BE/ELE giữ nguyên,
   chỗ nào là "mọi lớp thường" thì nhận mã mới.
3. **Môn gộp** L+S, R+W: hai khoá môn mới, nhãn "L+S", "R+W"; phân công GV theo môn như lớp thường; không vào `REGULAR_TO_CATEGORY` (không Case).
4. **Mốc lặp** → loại lượt mới **checkpoint** (số thứ tự n): luôn có **đúng một** checkpoint kế tiếp chưa thi (tuần học 6, 12, 18… theo `moc_lap` của lớp);
   sinh lượt kế khi lượt trước đã có điểm hoặc qua tuần thi (cùng chỗ đang sinh bài mặc định) — không sinh trước hàng loạt. QL dời checkpoint ở Lịch Test
   như mốc lớp thường. Điểm theo lớp + Kế hoạch Test + Lịch Test có lượt "Checkpoint n".
5. **Chấm**: ô gõ thẳng đúng/tổng như lớp thường (mockup: "L+S · tổng [60]" · "R+W · tổng [80]" · % tổng · Kết quả); đạt / SOS theo luật tỷ lệ lớp thường với
   ngưỡng của lớp. Chưa đạt → **chỉ chip "SOS · L+S"** (nhỏ), **không** Case / PA / việc. Đạt → chip "Đạt".
6. **Chương trình Liên tục**: không Progress / Final, không Lộ trình tiếp theo, không KQĐR, không Cuối khoá, không MT0, không Target (một hàm cổng
   `laLienTuc` thay các cổng `!is_fast_track` / `ratio` ở "Hiện trạng"); nhãn đầu hồ sơ lớp "tuần n" (không "/tổng"); lớp không tự kết thúc — QL kết thúc tay;
   vẫn nhắc tuần bắt đầu.
7. **PET, KET có sẵn** (migrate `server/src/migrate/prOv6b2.ts` chèn hai dòng nếu chưa có, tự kiểm): môn L+S, R+W · đúng/tổng · Đạt từ 70 % · Liên tục ·
   Checkpoint mỗi 6 tuần. Thêm cột `programmes.lap_moi_tuan`, `classes.moc_lap` (bản chụp). Seed demo: một lớp `MB PET 01` có 3 em, Checkpoint 1 đủ điểm (một Đạt, một SOS).

## Ranh giới
- Chạy sau OV-6b1. Vùng chính: `normal/{normal,regular,lopThuong,cuoiKhoa,kyVong}.ts`, `shared/domain/{tenLop,diemTheoLuot,keHoachTest}.ts`,
  `cham/diemTheoLuot.ts`, `keHoach/keHoachTest.ts`, `classes/{schedule,intake,thongTinLop,classes}.ts`, `loTrinh/*` cổng, `students/profile.ts` cổng,
  `platform/{sysconfig.ts,CatalogAdmin.tsx}`, web tạo lớp (`ClassCreatePanel`, `LuoiTaoLop`), `cham/LuoiThuong.tsx` (cột môn gộp).
- Song song: planning ghi trong prompt PR kia (OV-5 / OV-1c không chạm vùng này trừ `routes/index.ts`, `run.ts`).
- KHÔNG đổi: luật FOU / BE / ELE / FT, tên lớp hiện có, Case SOS lớp thường.

## Kiểm
- `server/src/tests/prOv6b2.tests.ts` (đỏ trước, đăng ký cuối `run.ts`):
  - Quản trị tạo chương trình mã mới liên tục, lặp 6 tuần → tạo lớp → tên `{CN} {MÃ} 01`, có Checkpoint 1 tuần 6; nhập đủ Checkpoint 1 → có Checkpoint 2 tuần 12;
    không bao giờ có hai checkpoint chưa thi. Lớp đang chạy của chương trình khác không đổi lịch.
  - PET: 48/60 + 61/80 → "Đạt"; 35/60 + 58/80 → chip "SOS · L+S", **0 Case / PA / việc**.
  - lớp PET: không Lộ trình tiếp theo, KQĐR, Cuối khoá, MT0, Target (API trả rỗng / 400 đúng câu); hồ sơ lớp nhãn "tuần n"; không tự kết thúc.
  - mã lạ không còn bị hiểu là FT (kỹ năng lớp PET = L+S, R+W); tạo lớp mã đã ngừng → 400. Migrate chạy hai lần không đổi gì.
- Phép kiểm cũ đổi đúng ý (dự kiến `prLop:207-218` "mã mới bị từ chối"), KHÔNG xoá cho xanh.
- Tốc độ: đường Điểm theo lớp / Kế hoạch Test với lớp PET trong trần `tocDoDuong.ts`.
- `npm run check` xanh. Bấm thử một lần: Quản trị tạo chương trình (1440 tối), QL tạo lớp PET, GVBM nhập Checkpoint (375 sáng). Ảnh `thiet-ke/anh/pr-ov6b2/`.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)

```
Session CODE cho PR OV-6b2 (chương trình mới: Liên tục, Lặp mỗi n tuần, môn gộp + PET/KET), repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất
(đã có OV-6b1). Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b, 3 (dòng 11/10 PET/KET) và 9.0, đặc tả docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md mục 1 (7.4), 4, 6.7,
rồi docs/superpowers/plans/2026-10-12-pr-ov6b2-pet-ket.md (làm ĐỦ Đầu ra) và mockup thiet-ke/mockup-overhaul-3-tong-quan-vai-chuong-trinh-2026-10-11.html §6.
PORT/WEB_PORT 4170/5343; `npm run check` tối đa 3 máy cùng lúc. Tuân thủ "Ranh giới".
test-driven-development (prOv6b2.tests.ts đỏ trước). Luật FOU/BE/ELE/FT hiện có không đổi — mọi cổng mới đi qua một hàm.
impeccable: `layout`, `clarify`, `harden`, `adapt` trong phạm vi PR, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần (Quản trị 1440 tối, QL tạo lớp PET, GVBM nhập Checkpoint 375 sáng), ảnh vào thiet-ke/anh/pr-ov6b2/ và mô tả PR.
Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR.
Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ngắn.
```

## Tự quyết (planning, báo chủ SP)
- Môn chọn từ danh sách cố định (L, R, W, S, L+S, R+W) — không tự đặt môn tuỳ ý.
- Chương trình mới chỉ chấm Đúng / tổng; Band IELTS giữ cho FT có sẵn (band mới = luật MT, Target, SOS Case — ngoài phạm vi).
- PET, KET chèn sẵn bằng migrate theo đúng thông số chủ SP đã chốt; Quản trị sửa được.
- Checkpoint sinh từng lượt một (luôn một lượt kế tiếp), không sinh trước cả năm.
