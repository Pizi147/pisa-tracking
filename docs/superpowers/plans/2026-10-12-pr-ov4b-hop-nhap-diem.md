# PR OV-4b — Hộp nhập điểm MT (L / R / W1 / W2 / S + nhận xét 4 kỹ năng, "Lưu · em tiếp") + nút Nhận xét lớp thường

Nguồn: đặc tả OV mục 4 "Điểm theo lớp", 6.5 (câu "Hộp nhập điểm…"); mockup đã duyệt `thiet-ke/mockup-overhaul-1-cong-viec-diem-mt-2026-10-11.html`
**§3** (dòng ~422–529) + chốt HD1, HD2 cuối §3. OV-4 của đặc tả tách hai PR: **OV-4a** (huỷ / khôi phục) và **OV-4b** (này). Chạy sau OV-1b (#323).
Song song được với **OV-4a**, **OV-6b1**. **OV-5** (Công việc › Nhập điểm dùng lại hộp này) chạy sau PR này. Rà: sâu (luồng nhập điểm chính).

## Hiện trạng (planning đọc mã 12/10, session code kiểm lại)
- Lưới MT: `web/src/modules/cham/LuoiFT.tsx` — L/R gõ thẳng (`RawScoreInput` `:300-320`); W1/W2/S nút → panel trượt phải `CriteriaModal`
  (`ScoreEntry.tsx:577-699`); sửa ô đã có điểm → `SuaDiemCoLyDo` (`:446-468, 535-575`). Lưới dùng ở: Điểm theo lớp (`DiemTheoLop.tsx:225`), hồ sơ lớp
  (`ClassOverviewPage.tsx:192`), Lịch Test nhúng (`test/lichTest/LuoiNhung.tsx:32`), `/nhap-diem` (`ChamDiemPage.tsx:150`) — qua `LuoiChamLop.tsx:137-140`.
  < 640 px: `MotKyNang.tsx:215-226` (✎ `HopNhanXet` chỉ W1/W2/S).
- Hồ sơ lượt MT (`MockDetailPage.tsx:302`) + Lộ trình (`students/HangLichMt.tsx:185`): `DaiODiemLon` (`fasttrack/ODiemLon.tsx:65-172`) mở `InlineScoreEditor`
  (`ScoreEntry.tsx:706-797`); W1, W2 hai dòng lưu riêng.
- Lưu: `PUT /attempts/:id/scores/:skill` (`routes/index.ts:849-866`) → `saveScore` (`attempts.ts:1615-1937`); W1, W2 là hai dòng `writing1` / `writing2`,
  lưu một task đã được; W = (W1 + 2×W2)/3 khi đủ (`scoring.ts:46,56`). Nhận xét `assessment_scores.comment` nhưng **chỉ W1/W2/S**
  (`shared/domain/nhanXet.ts:3` `BAI_CO_NHAN_XET`; máy chủ chặn `attempts.ts:1689`). Lớp thường **chưa có đường nhận xét** (`normal/regular.ts`, `routes:1354`).

## Đầu ra  [x] xong (PR OV-4b, 12/10)
1. **Một hộp nhập điểm MT dùng chung** (component mới, vd `web/src/modules/fasttrack/HopNhapDiem.tsx`) cho **mọi chỗ nhập điểm MT, gồm MT0**:
   lưới lớp (Điểm theo lớp, hồ sơ lớp, Lịch Test nhúng, `/nhap-diem`), hồ sơ lượt MT, Lộ trình (`HangLichMt`). Thay `CriteriaModal`, `InlineScoreEditor`,
   ô gõ thẳng L/R của MT → **xoá** phần không còn dùng. Hộp neo ngay ô (1440); điện thoại: tấm trượt từ dưới. Không còn panel trượt phải.
2. **Khung hộp** (đúng chữ mockup): đầu "Reading · MT2" / "{em} · {lớp} · {W2 OCT}"; con trỏ đứng sẵn ở ô điểm; chân: **Vắng · Lưu · Lưu · em tiếp ›**
   (Enter = "Lưu · em tiếp ›": đi xuống em kế, hộp giữ mở; ở trang một em chỉ "Lưu"); Esc đóng. **Lỗi lưu: giữ nguyên chữ đã gõ, chỉ rõ ô sai**
   ("Chưa lưu: số câu đúng từ 0 đến 40."). Không báo "đã lưu" trước khi máy chủ trả về.
   - **L / R**: "Số câu đúng [ ] / 40" + Band (tự tính) + "Kỳ vọng MT2: 5.5 · dưới 0.5" + Nhận xét.
   - **W1, W2 hai hộp riêng**: TA (W1) / TR (W2) · CC · LR · GRA + Band; "Task 2 chưa có · Writing = (Task 1 + Task 2 × 2) / 3 khi đủ hai task"; "Nhận xét Task n".
   - **S**: FC · LR · GRA · P + Band + **Người chấm** (ô chọn người sẵn có) + Nhận xét.
   - **MT0** (band): ô Band + Nhận xét (luật MT0 OV-1a giữ nguyên).
   - **Ô đang Vắng**: "Vắng lần 1 · đã dời sang W3 OCT" + "Ghi {ngày} bởi {người}" · "Em có làm bài? Số câu đúng [ ] / 40" · **Bỏ vắng** · Lưu điểm
     (luật OV-1b: Bỏ vắng = GV đúng kỹ năng + GVCN + QL khi ô tuần mới chưa có điểm; "Đã huỷ phần thi" chỉ QL "Khôi phục phần thi").
   - Sửa ô đã có điểm sau khi lượt hoàn tất: hộp hiện thêm ô **Lý do** (luật `SuaDiemCoLyDo` hiện có, không đổi quyền).
   - Gõ "-" trong ô điểm = Vắng (luật OV-1b, không đổi).
3. **Lưới MT** (mockup): cột Học viên · L (số câu) · R (số câu) · W1 · W2 · W · S · Kỳ vọng · Overall · Kết quả. L/R ghi "14 · 4.5"
   (**luôn hiện số câu**); ô trống ghi "Nhập"; dưới tên em "MT2 · W2 OCT". Cột Kết quả giữ cách tính hiện có (SOS tạm là OV-1c).
4. **Nhận xét cả 4 kỹ năng** (không bắt buộc): mở `BAI_CO_NHAN_XET` cho L, R; máy chủ nhận; sửa chú thích `schema.sql` ("L/R luôn NULL"). Hồ sơ lượt MT
   hiện nhận xét cả 4 kỹ năng; TVV / CX / Admin đọc được (như OV-2a).
5. **Lớp thường**: giữ ô gõ thẳng đúng/tổng; thêm **nút nhỏ "Nhận xét"** cạnh ô (mở hộp nhỏ chỉ có ô Nhận xét, lưu riêng). Máy chủ: đường lớp thường nhận
   `nhanXet` (cùng `kiemNhanXet` ≤ 1000 ký tự, cùng quyền nhập điểm môn đó).

## Ranh giới (song song OV-4a, OV-6b1)
- Vùng PR này: `web/src/modules/cham/{LuoiFT,MotKyNang,LuoiChamLop,LuoiThuong}.tsx`, `web/src/modules/fasttrack/{ODiemLon,HopNhapDiem(mới)}.tsx`,
  `ScoreEntry.tsx`, `NhanXet.tsx` / `HopNhanXet` / `ONhanXet`, phần ô điểm của `MockDetailPage.tsx`, `students/HangLichMt.tsx` (chỉ chỗ gọi ô điểm),
  `shared/domain/nhanXet.ts`, `saveScore` trong `attempts.ts` (chỉ chỗ chặn nhận xét), đường ghi điểm lớp thường trong `normal/regular.ts`.
- KHÔNG sửa (của OV-4a): `huyLuot` / `hoiSinhLuot` / `reopenAttempt` / `ketQuaHuy.ts` / `HopHuyMt.tsx` / `test/keHoach/*` · (của OV-6b1): `mocChupVaoLop`,
  `lichMt.ts`, `schedule.ts`, `intake.ts`, `platform/*` · (OV-1c): `scoring.ts`, `cases/*`. Không làm Công việc (OV-5).
- Chung tất yếu: `routes/index.ts`, `tests/run.ts`, `CODE_MAP.md`, `plan.md`; `MockDetailPage.tsx`, `HangLichMt.tsx` chung OV-4a → gộp main trước khi mở PR.

## Kiểm
- `server/src/tests/prOv4b.tests.ts` (đỏ trước, đăng ký cuối `run.ts`): nhận xét L, R lưu được (MT + MT0); > 1000 ký tự → 400; GV môn khác → 403;
  W1 lưu một mình → W chưa có, W2 lưu sau → W đúng công thức; lớp thường lưu nhận xét đúng ô, GV môn khác 403; nhận xét không đổi điểm / trạng thái lượt.
- Hành vi giao diện (bấm thử, ghi trong PR): Enter đi em kế giữ hộp mở; lỗi 46/40 giữ chữ, ô đỏ; "-" = Vắng; ô Vắng có Bỏ vắng; Esc đóng; điện thoại tấm trượt.
- `scripts/do-khung.mjs` / phép kiểm khung (`prKhung`) vẫn xanh (không cuộn lồng, 375 không tràn).
- `npm run check` xanh. Bấm thử một lần: GVBM L/R (1440 tối, Điểm theo lớp MT), GVBM W (375 sáng, W1 rồi W2), GVBM lớp thường (Nhận xét), QL hồ sơ lượt MT.
  Ảnh `thiet-ke/anh/pr-ov4b/`.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)

```
Session CODE cho PR OV-4b (hộp nhập điểm MT L/R/W1/W2/S + nhận xét 4 kỹ năng + "Lưu · em tiếp"; nút Nhận xét lớp thường), repo Pizi147/pisa-tracking,
nhánh mới từ origin/main mới nhất. Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b và 9.0, đặc tả docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md mục 4 "Điểm theo lớp", 6.5, rồi
docs/superpowers/plans/2026-10-12-pr-ov4b-hop-nhap-diem.md (làm ĐỦ Đầu ra) và mockup thiet-ke/mockup-overhaul-1-cong-viec-diem-mt-2026-10-11.html §3.
PR này chạy SONG SONG với OV-4a và OV-6b1: tuân thủ mục "Ranh giới"; PORT/WEB_PORT 4130/5303; `npm run check` tối đa 3 máy cùng lúc.
test-driven-development (prOv4b.tests.ts đỏ trước). Một hộp dùng chung mọi chỗ, xoá component cũ không còn dùng. Chữ trên màn đúng mockup, không thêm câu giải thích.
impeccable: `layout`, `clarify`, `harden`, `adapt` trong phạm vi PR, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần trên demo (GVBM L/R 1440 tối, GVBM W 375 sáng, GVBM lớp thường, QL hồ sơ lượt MT), ảnh vào thiet-ke/anh/pr-ov4b/ và mô tả PR.
Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR.
Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ngắn.
```

## Tự quyết (planning, báo chủ SP)
- Hộp dùng cả ở hồ sơ lượt MT và Lộ trình (mockup ghi "Hồ sơ lượt MT"), thay khung sửa cũ — một cách nhập điểm cho mọi chỗ.
- Trang một em (hồ sơ lượt) không có "Lưu · em tiếp" (không có em kế).
