# Deploy sớm + UX 26/10 — đối chiếu, quyết định, kế hoạch (PTA Plan)

> Nguồn yêu cầu: prompt chủ SP 26/10 — bản chép nguyên `docs/superpowers/specs/2026-10-26-deploy-ux/prompt-chu-sp.md` (gọi tắt **PR26**, mục theo số của prompt).
> Đối chiếu trên `main` **10cbbad0** (26/10, sau #587) bằng đọc mã + `git` + Netlify chỉ đọc. Chưa bấm thử web, chưa đăng nhập bản chính.
> Phân loại: **[CHỐT]** chủ SP nói trong PR26 · **[LUẬT]** luật cũ còn hiệu lực (`plan.md` 1.6, `DESIGN.md` Luật V5) · **[KIỂM]** đã đọc mã, có file:dòng ·
> **[BÁO]** chủ SP phản ánh, cần tái hiện · **[ĐX]** đề xuất PTA, chưa duyệt.

## 0. Đọc nhanh

- **Bản chính đang chạy `fa7e1811`** (22/10 12:10, DB `pisatracking-261022`, Netlify deploy `6ad99a8e…`). Tới `main` còn **364 commit (#533–#587)** chưa lên mạng: toàn bộ V5, SUA-NO-RA, CHAM-LAI, SUA-CHAM-LAI, P1–P14 (trừ P8, P13).
- **Release 1 (R1) = ưu tiên 1 + 2 + 3 + mốc deploy**, gồm 5 PR nhỏ (mục 4; KHO-TEP đã bỏ). Mục 4–5–6 của PR26 làm sau R1, mỗi mục bắt đầu bằng mockup 2–3 phương án (mục 6).
- **Ba lỗi thật phải sửa trước R1** (đều chưa có trên bản chính):
  - Biểu đồ Hành trình vẽ điểm sau tuần 80 vào cột đầu.
  - "Việc tiếp" ở Chấm Test / thanh việc lớp nhảy về việc đầu khi việc vừa xong rời danh sách.
  - ~~Kho tệp bằng chứng~~ — **bỏ** (chủ SP 26/10: tệp trên bản chính chỉ là tệp thử, không quan trọng; mục 4.6).
- **Chủ SP đã trả lời 26/10** (mục 7): chờ P8 + P13; tiếng Anh chỉ màn GV; bỏ chép tệp thử. Mockup cần duyệt trước code: **M2 Lịch Test phân cấp** (A / B). P1 Lưu · bài tiếp sửa theo mẫu sẵn có, không cần mockup.

## 1. Mốc phiên bản

| | SHA / tên | Bằng chứng |
|---|---|---|
| `main` | `10cbbad0` | `git log origin/main` 26/10 |
| Bản chính | `fa7e1811` (merge #528), độ chắc ~95 % | Netlify `listSiteDeploys`: deploy mới nhất `6ad99a8e…` 22/10 05:09Z, `cli`, không `commit_ref`; `git reflog main` đứng ở `fa7e1811` 10:30–12:26 +07; `plan.md` dòng deploy 22/10 |
| PR mở | #586 P13 KET-PET (chờ sửa rà vòng 3) · P8 MON-DANG-KY (session cloud đang làm, chưa PR) | GitHub 26/10 |
| Nhánh release | **không tách nhánh**: RC = SHA `main` lúc đóng băng (ghi vào DEPLOY) — [ĐX] |

## 2. Sáu ưu tiên — hiện trạng

| # | Mục PR26 | Đã có [KIỂM] | Cần sửa | Mockup | Phụ thuộc |
|---|---|---|---|---|---|
| 1 | Lưu · bài tiếp liền mạch | Một hộp `HopNhapDiem` cho mọi ô MT; `luuRoiTiep` + `viecKeTiep` cho panel việc; ô "còn trống" `oTrongFt` (`LuoiFT.tsx:60`) | "Lưu" đang **đóng hộp** (`HopNhapDiem.tsx:334`, trái V12); "em tiếp" = hàng dưới cùng cột kể cả ô đã có điểm, không vòng lên, không đổi kỹ năng (`LuoiFT.tsx:187-196`, `MotKyNang.tsx:194-197`); hồ sơ MT / Lộ trình **không có nút tiếp** (`ODiemLon.tsx:170`); Enter trên nút nào cũng thành "em tiếp" (`:342-350`); chống bấm đôi bằng state; `findIndex+1` sai khi việc rời danh sách (`ChamTestTab.tsx:95`, `ThanhViecLop.tsx:27`); `PanelViec` không chuyển `onTiep` xuống panel điểm (`:116-119`) | Không (sửa chữ + hành vi theo mẫu `GhiNhanh` "✓ Đã lưu · Việc tiếp ›") | Không (P8 đánh dấu môn không học bằng `attempt_skills.required = 0` → tự bỏ qua) |
| 2 | Phân cấp bảng Test | Lịch Test tuần V5; "ba khung" cũ **đã gỡ** (`LichTestTab.tsx:38`) → không áp dụng | Tối: dải nhóm = nền hàng lớp = đầu cột lưới `#172440`; hàng lớp đóng ≈ nền thẻ, không viền; không gì dính khi cuộn (`.hang-lon-dinh` có mà không dùng, `index.css:423`); dòng S Ex giống hệt hàng HV; cột tên dính khác nền hàng | **M2** A / B | Sau PR 1 (chung `LuoiFT.tsx`) |
| 3a | Tiếng Anh giao diện | `t()` có tsc kiểm khoá (0 thiếu); phép kiểm EN-KHOA, EN-LOI; glossary `thiet-ke/THUAT_NGU_EN_2026-10-07.md` | **357 khoá trùng, 72 khác nghĩa** (vd "{n} HV" số nhiều bị đè → "1 students"); **1 252 chữ Việt cứng** không khoá EN ở `web/src`; ~481 chuỗi lỗi máy chủ không dịch được; chuỗi ghép ở máy chủ ("Thi thật 7.5"); glossary thiếu KCK, bài / lượt / việc | Không | Rà cuối sau PR 1, 2 |
| 3b | Dịch AI | P14 #580: quyền trước cache, hạn lượt, tắt / lỗi rõ, che tên / email / SĐT | Prompt không coi nhận xét là dữ liệu, không giữ số / mã tuần; **không kiểm placeholder đầu ra**; khoá cache không phiên bản; web không reset trạng thái khi đổi nội dung; không trần độ dài; `reasoning_effort` code `'none'` ≠ plan `'minimal'` (phải tra tài liệu chính thức) | Không | Migrate P14 có trong R1 |
| 4 | Hồ sơ Test / MT | `/mock-test/:id` FT, 8 khối (`MockDetailPage.tsx`); trạng thái thiếu / không học / vắng / dời / huỷ đã phân biệt (`ODiemLon.tsx:40-55`) | **Lớp thường không có trang lượt** (chuyển về bảng cả lớp, `duongHoSo.ts:91-96`); S Ex không có ở hồ sơ MT; khả năng vòng chuyển hướng khi lượt thường `classId = null` | **M4** A / B / C | Sau R1 |
| 5 | Hồ sơ HV, chart, góp ý tuần | Ô điểm đầu, chart theo kỹ năng, Tiến độ trên lớp (`bai_tren_lop`), Case & PA | Chart: không mốc đổi Target, không chú giải, không ◆ thi thật, không chart lớp thường; **lỗi trục 80 tuần** (`HanhTrinhKyNang.tsx:151`); góp ý tuần: bảng + API ghi **vẫn mở** dù gỡ giao diện (`routes/index.ts:1596-1604`), trùng vai với `bai_tren_lop` | **M5** chart A / B / C + **M5b** góp ý A / B / C | Sau R1 |
| 6 | Hệ thống panel | `KhungPanel` 68 tệp / 134 chỗ; `NganCase` 16; `OSo` 44; một panel một lúc (`khoPanel.ts`) | Không ngăn xếp view: quay lại một tầng, nối tay từng nơi; panel trung gian toàn link rời trang (`NeedsEvaluation.tsx:28-48`); dòng "BÁO CÁO · CHỈ ĐỌC" không làm được gì (`SoLieu.tsx:258-277`); `CasePanel` component chết (0 nơi gọi) | **M6** pilot | Sau R1 |

## 3. Nhật ký quyết định

| # | Xung đột / điểm mở | Áp dụng | Loại |
|---|---|---|---|
| D1 | Luật cũ "deploy khi xong hết V5" ↔ muốn deploy sớm | V5 đã merge hết; **R1 sau 1–2–3**, 4–5–6 phát hành sau. PTA không deploy; chủ SP bấm | [CHỐT] PR26 mục 2.1 |
| D2 | "Tinh chỉnh, không làm lại" ↔ overhaul 4–5–6 | Được thiết kế lại đúng các màn đó, giữ dữ liệu / thao tác / luật; cổng Q-1…Q-6 giữ (mockup duyệt, ảnh cặp, ≥ 90 % KHỚP, chủ SP duyệt trước merge) | [CHỐT] + [LUẬT] |
| D3 | **V11** "số → panel chỉ đọc" (C22) ↔ làm việc nối tiếp trong panel | Luật mới **thay V11 khi pilot 6b được duyệt**: panel số vẫn giải thích đúng số; từ dòng, người có quyền **mở việc ngay trong cùng panel** (view kế tiếp, có ‹ Quay lại); bảng báo cáo tổng hợp không thành form. R1 không đổi V11 | [CHỐT] PR26 2.1 (mới hơn C22) |
| D4 | **V12** "Lưu ở lại" ↔ mã đang đóng hộp | **Giữ V12, sửa mã.** Nhãn: "Lưu" · "Lưu · bài tiếp ›" (chấm) · "Lưu · việc tiếp ›" (panel việc) · hộp một trường đóng sau lưu: **"Lưu · đóng"** (tên nói đúng hành vi) | [LUẬT] V12 + [CHỐT] PR26 3.1 + [ĐX] nhãn "Lưu · đóng" |
| D5 | Góp ý tuần đã gỡ (P3 #573) ↔ xem lại | R1 không đụng. Mục 5 có mockup A / B / C; **bật lại quyền ghi = chủ SP quyết khi duyệt M5b**. Riêng API ghi đang mở không có giao diện → khoá ghi ở PR máy chủ mục 5 | [CHỐT] + [ĐX] |
| D6 | Panel đủ dài ↔ khung gọn cũ | Cho rộng / dài theo nội dung, có cuộn, vừa viewport, 375 toàn màn — áp ở mục 6 | [CHỐT] |
| D7 | Nhiều phương án ↔ "một khuyến nghị" | Overhaul lớn: 2–3 phương án khác thật trên cùng dữ liệu + **một** khuyến nghị có lý do | [CHỐT] |
| D8 | Tutor | Ngoài phạm vi (chủ SP hoãn tới ~28/10); không mở lại route đang ẩn | [LUẬT] |
| D9 | Sổ tay PDF "trước lần deploy kế" (`plan.md` :299) | **Không chặn R1**: Hướng dẫn trên web (HD-a / HD-b / TL-V5) là nguồn; sổ PDF 17/10 lệch V5 — làm lại sau nếu chủ SP cần in | [ĐX] |
| D10 | Thứ tự R1 | **R1 chờ P8 + P13** (chủ SP 26/10, Q1: "cứ đợi, đang chạy rồi; R1 cũng nhiều PR") → RC gồm cả hai; migrate + tiền kiểm của P8, P13 vào danh sách deploy | [CHỐT] Q1 |
| D11 | Phạm vi tiếng Anh | **Chỉ màn GV dùng** (chủ SP 26/10, Q2: không QL / QT nào là người nước ngoài). EN-3 (màn quản lý / quản trị) **bỏ**, không làm sau R1; phép kiểm chặn chữ mới chỉ áp màn GV | [CHỐT] Q2 |

## 4. Release 1 — 5 PR (KHO-TEP bỏ)

Mỗi PR có **impact note** đầu kế hoạch (PR26 mục 2.3), bảng thao tác TRƯỚC → SAU (`khop-khac.md`), model Opus 5.5 (không Fable), skill theo `plan.md` 9.0 + dòng "Skill" từng PR.

### 4.1 R1-LUU-TIEP — Lưu · bài tiếp / việc tiếp (ưu tiên 1)

> **Impact:** GV / QL nhập điểm ở 7 điểm vào → hộp nhập điểm + panel việc · đầu ra: chấm liền các bài **còn thiếu**, không mở lại bài đã xong, không mất chữ · dữ liệu / quyền: không đổi máy chủ (web đã có `required`, `canEdit`, band, "-") · ngõ cụt hiện có: hồ sơ MT chỉ "Lưu"; bài cuối đóng hộp · sửa sai: Lưu ở lại để xem / sửa; lỗi giữ nguyên · test: hàm chọn bài thuần + kịch bản bấm thử.

**Luật (sẽ ghi `DESIGN.md` V12 bản 26/10):**
1. **Lưu** chờ máy chủ → **ở lại**, chân hộp hiện "✓ Đã lưu"; nút chính đổi thành **"Bài tiếp ›"** (không gửi lại); X / Esc / bấm ngoài đóng.
2. **Lưu · bài tiếp ›** chỉ chuyển khi máy chủ xác nhận.
   - Lỗi → ở lại, giữ mọi ô / nhận xét / lý do.
   - Lỗi web tự kiểm: focus đúng ô.
   - Lỗi máy chủ (API lưu điểm không trả ô lỗi, `HopNhapDiem.tsx:310`): câu lỗi ở chân hộp, focus ô điểm đầu. **Không đổi máy chủ.**
3. **Không đổi gì:** bài đã xong → chuyển ngay, không gọi máy chủ, không báo "Đã lưu"; ô còn trống → ở lại, nhắc "Ô còn trống — nhập điểm hoặc Vắng".
4. **Vắng GIỮ như nay:** ghi "-" rồi chuyển sang bài tiếp (`HopNhapDiem.tsx:497`).
   - Vắng là thao tác kết thúc ô; bắt thêm một phím cho mỗi em vắng trái luật "ít thao tác".
   - Toast "Đã ghi vắng · {tên} · Hoàn tác" (N4: Hoàn tác 10 s).
   - Không còn bài tiếp → trạng thái hết (luật 7).
5. **Chọn bài tiếp** — một hàm thuần `baiKeTiep(ds, hienTai, toi)` ở `shared/domain/baiKeTiep.ts`:
   - `ds` = **ảnh chụp** danh sách ô của phiên, theo thứ tự đang thấy (hàng × cột kỹ năng), chụp khi mở hộp đầu tiên. Mỗi lần chọn kiểm lại với dữ liệu mới nhất: ô người khác vừa điền, hoặc vừa mất quyền → bỏ qua.
   - `conThieu(o)` = bắt buộc (`required` — gồm môn không học của P8) ∧ người xem sửa được ∧ chưa band ∧ không "-" / vắng / huỷ / chờ duyệt dời ∧ đã tới tuần thi.
     - Lấy `oTrongFt` (`LuoiFT.tsx:60`) chuyển vào shared, rồi **thêm hai điều kiện "đã tới tuần thi" và "không chờ duyệt dời"**. Hàm cũ chỉ đúng khi đi kèm `khacTuanFt` ở lưới theo tuần; hồ sơ MT và Điểm theo lớp theo lượt cần đủ điều kiện.
     - Đây là **một định nghĩa** dùng chung cho web.
     - Lớp thường dùng `oThuong(...).trong`; Speaking chéo dùng cờ `cho` của máy chủ.
   - Thứ tự: cùng kỹ năng sau ô hiện tại → cùng kỹ năng trước ô hiện tại (vòng) → kỹ năng khác người xem được giao (thứ tự cột) từ đầu → hết.
6. **Đích tiếp** hiện ở chân hộp: "Tiếp: Reading · Minh Anh" (cùng kỹ năng chỉ ghi tên). Đổi kỹ năng → đổi tiêu đề, thang, cột / tab đang chọn (màn một kỹ năng 375 đổi tab), focus ô điểm.
7. **Hết phần của người xem trong lớp đang chấm:** hộp hiện "Đã xong phần của bạn · {lớp · lượt}: đã lưu n bài". Không bao giờ ghi "cả lớp xong". Nút chính, theo thứ tự:
   - **"Lớp tiếp: {mã lớp} ›"** khi cùng phạm vi còn lớp khác có bài người xem còn thiếu. Phạm vi là một việc gộp nhiều lớp của Công việc (`gopViec.ts:90-125`, `PanelNhapDiemTuan` mỗi lớp một lưới) hoặc danh sách lớp của tuần ở Lịch Test. Nút mở lớp đó ngay trong cùng panel / bảng. Nút đổi chữ nên không trái PR26 3.2 (5) ("bài tiếp" không tự nhảy lớp).
   - **"Việc tiếp ›"** khi nơi gọi có danh sách việc chấm (Chấm Test, Công việc, thanh việc lớp), dùng `viecKeTiep` trên ảnh chụp.
   - Còn lại: "Đóng".
   - Cách làm: `LuoiFT` báo "hết" lên nơi gọi (`onHet`); nơi gọi chọn lớp tiếp / việc tiếp. Không đưa ảnh chụp toàn trang lên trên `LuoiFT`.
8. **Phím:**
   - Enter ở ô nhập = nút chính.
   - Enter trên nút đang focus = chính nút đó.
   - Ô nhận xét: Enter xuống dòng; Ctrl / Cmd + Enter = nút chính.
   - Bỏ qua khi `isComposing` hoặc `keyCode 229`.
9. **Chống bấm đôi:**
   - Khoá bằng `ref`, không bằng state.
   - Lệnh trùng do `inflight` (`ScoreEntry.tsx:164-169`) **không** báo lỗi.
   - "Đang lưu…" chỉ hiện ở nút đã bấm.

**Điểm vào (Task 1b, tìm mọi nơi gọi trước khi đổi chữ ký):**
- `LuoiFT`: Lịch Test, hồ sơ lớp, Điểm theo lớp, `PanelNhapDiem*` của Công việc.
- `MotKyNangFt` (màn hẹp).
- `PanelChamSpeaking`.
- Hồ sơ MT + Lộ trình (`DaiODiemLon`): trước hết các ô của **chính lượt đó**, hết thì sang em kế của danh sách nguồn (xem "Luật cho trang một em" bên dưới).
- `PanelViec`: chuyển `onTiep` xuống panel điểm.
- `ChamTestTab`, `ThanhViecLop`: thay `findIndex + 1` bằng `viecKeTiep` trên ảnh chụp — **lỗi [KIỂM]**.
- `GhiNhanh`, `PanelBaoPhTvv`: "Lưu và tiếp" → "Lưu · việc tiếp".
- `HopSEx`, `SuaDiemCoLyDo`, `HopNhanXetThuong`: "Lưu · đóng".
- **Lớp thường (ô gõ trực tiếp `ODiemThuong`, `LuoiThuong.tsx`, phần lớp thường của `MotKyNang`):**
  - **Giữ** Enter = xuống hàng dưới kiểu bảng tính, vì không phải hộp. Lỗi máy chủ giữ nháp + "Lưu lại" như nay.
  - **Sửa:** Enter bỏ qua hàng không sửa được hoặc không học. Hiện đang nhảy vào ô chỉ đọc (`ScoreEntry.tsx:798`) — ngõ cụt.
  - **Thêm:** `PanelViec` có **"Việc tiếp ›" ở chân panel** cho mọi việc chấm (FT và lớp thường). Nút nổi bật khi việc đã đủ phần người xem; lưới lớp thường không cần trạng thái hết riêng.
- **Dán Excel** giữ luồng riêng.

**[BÁO] "đạt kỳ vọng thì chỉ còn Lưu" — PTA đã tái hiện 26/10** (web demo, GV Trần Ngọc Hà, 1440; chủ SP Q3: gặp trên máy tính, chắc điện thoại cũng vậy):
- Lịch Test tuần, ô Reading 7.0 = kỳ vọng: **có** "Lưu" + "Lưu · em tiếp ›".
- Chấm Test, gõ 36 câu (band 8.0 > kỳ vọng 5.5): có cả hai nút; bấm em tiếp → sang đúng em kế.
- **Hồ sơ MT** `/mock-test/16` (trang mở khi bấm tên HV ở mọi lưới, hoặc chip SOS), bấm ô Reading 7.0: **chỉ có "Lưu"**. Trang Lộ trình ở hồ sơ HV (`HangLichMt` → `DaiODiemLon`) cũng vậy.
- **Nguyên nhân:** `DaiODiemLon` không truyền `onTiep` (`ODiemLon.tsx:170`). Nút **không** phụ thuộc kỳ vọng. Có thể chủ SP thấy đúng như mô tả vì em đã đạt thường được mở ở trang hồ sơ để xem / sửa.

**Luật cho trang một em** (hồ sơ MT, Lộ trình). Mục tiêu là không còn chỗ nào chỉ có "Lưu":
- **"Lưu · bài tiếp ›"** = ô còn thiếu kế tiếp của chính lượt đó.
- Lượt đã đủ phần người xem → nút đổi thành **"Lưu · em tiếp ›"** nếu trang được mở từ một danh sách. Nút sang **em kế trong danh sách nguồn**, cùng loại Test, mở đúng kỹ năng. Dùng lại cơ chế Trước / Sau của hồ sơ HV (`ThanhTruocSau`) cùng ngăn xếp quay lại `quayLai.ts`; mở rộng cho trang hồ sơ MT.
- Không có danh sách nguồn → "Lưu" + **"‹ Về {nguồn}"**: về đúng lưới, giữ tuần / lớp / dòng.
- Task 0 vẫn thử cả 7 điểm vào (gồm 375). Thêm vào bấm thử: kịch bản "từ lưới bấm tên HV → hồ sơ MT → sửa ô đã đạt → Lưu · em tiếp".

**Phép kiểm:**
- `baiKeTiep` (BT-1…10):
  - sau / trước / vòng;
  - đổi kỹ năng;
  - bỏ ô có điểm, ô không học, ô không quyền, ô vắng, ô chưa tới tuần;
  - ô vừa xong rời bộ lọc;
  - người khác vừa điền;
  - hết.
- Kịch bản bấm thử mới `cham-lien-mach` trong `scripts/do-khung.mjs` — GV dạy L + R, MB FT 101:
  - điểm dưới / bằng / trên kỳ vọng đều còn nút;
  - bài cuối L → R;
  - bài phía trên còn trống;
  - lỗi máy chủ → ở lại, giữ chữ;
  - Enter × 2 nhanh không nhảy hai bài;
  - hồ sơ MT sang kỹ năng kế;
  - Chấm Test hết → Việc tiếp đúng việc kế.
- Ghi số phím / bấm **trước → sau** cho "chấm 5 bài L + 3 bài R" vào PR.

**Rà:** `/code-review high` (luồng chính nhập điểm) + ảnh 1440 tối, 375 sáng.
**Tệp:** `HopNhapDiem.tsx`, `LuoiFT.tsx`, `LuoiChamLop.tsx`, `LuoiThuong.tsx`, `MotKyNang.tsx`, `PanelChamSpeaking.tsx`, `ODiemLon.tsx`, `MockDetailPage.tsx`, `PanelViec.tsx` (`PanelNhapDiem*`), `HangLop.tsx` / `LichTestTab.tsx` (Lớp tiếp), `ChamTestTab.tsx`, `ThanhViecLop.tsx`, `GhiNhanh.tsx`, `PanelBaoPhTvv.tsx`, `HopSEx.tsx`, `ScoreEntry.tsx`, `shared/domain/baiKeTiep.ts` (mới), `shared/i18n/en/r1LuuTiep.ts` (mới), `DESIGN.md` V12, Hướng dẫn GV / QL.

### 4.2 R1-PHAN-CAP-TEST — phân cấp Lịch Test (ưu tiên 2)

> **Impact:** người xem Lịch Test tuần, nhiều lớp mở → không biết đang ở nhóm / lớp / HV nào · đầu ra: nhìn là biết cấp · dữ liệu / quyền: không đổi · giữ: Nhập điểm, Dán Excel, Xuất, lịch sử, mở dưới hàng, nháp ô · sửa sai: chỉ CSS + cấu trúc nhỏ, quay lại được · test: ảnh cặp + `do-khung` / `do-bang` + kiểm tương phản cấp liền kề.

**Mockup M2** `thiet-ke/v7/lich-test-phan-cap.html` (PTA làm ngay khi kế hoạch được duyệt; chú thích ngoài vùng UI theo PR26 mục 10).
- **Dữ liệu chung cho A và B:** W3 SEP; nhóm "Quá hạn chấm" + "Test tuần này"; 3 lớp mở: MB FT 101 (HV khác lượt MT), một lớp FOU thường, một lớp có dòng S Ex; tên dài.
- **Khung vẽ:** 1440 tối + sáng, 375 sáng.

**Phương án A — khuyến nghị (giữ bảng, tăng phân cấp):**
- **Nhóm:** nền `--surface-2` giữ; thêm khoảng trên 12 px + viền trên `--line-strong`; số đếm 13 / 500 có đơn vị ("3 lớp · 14 bài").
- **Lớp đóng:** nền thẻ, **viền dưới `--line`** (như mockup V5 khu a), tên 15 / 700.
- **Lớp mở:** `--accent-soft` + vạch trái 3 px `--accent-strong` (giữ). **Dính dưới thanh trên** khi cuộn trong vùng lớp, dùng `.hang-lon-dinh` có sẵn. Cần thử trước: nếu `overflow-x` của `bang-dinh` chặn dính, thay bằng dòng nhãn lớp lặp ở đầu lưới.
- **Vùng lưới mở:**
  - Bỏ nền tối bọc ngoài (`--hang-con-bg`).
  - Lưới nằm trên nền thẻ, **thụt 12 px**, có **vạch trái 3 px accent nối từ hàng lớp**.
  - Đầu cột có token riêng (khác dải nhóm), 13 / 600.
- **Hàng HV:** giữ cao 44 / 64. Cột tên dính **cùng nền hàng** (hết sọc).
- **Dòng S Ex:** thụt 24 px, chữ 13, nền hàng con, nhãn "S Ex" đứng trước — không trông như một HV khác.
- **Chấm Test:** nhóm bên trái dùng cùng dáng dải nhóm.
- **Kế hoạch Test:** giữ nguyên, vì đã là hộp riêng từng lớp.

**Phương án B (chia vùng):**
- Mỗi lớp một hộp như Kế hoạch Test; dải nhóm nằm ngoài hộp.
- Rõ hơn khi rất nhiều lớp, nhưng tốn chiều cao và mất cột thẳng hàng giữa các lớp.
- Phải đổi cấu trúc `bang-dinh` → nhiều việc hơn, chậm R1.

**Dữ liệu nghiệm thu:**
- Seed không có lớp 50+ HV ([KIỂM] tối đa 10 HV một lớp một tuần).
- Thêm cờ `SEED_LON=1`: thêm 1 lớp 60 HV + 6 lớp tuần W3 SEP, **chỉ khi bật cờ**, nên TD4-a không đổi.
- Tình huống thử: 0 / 1 / nhiều lớp, nhiều lớp cùng mở, HV khác lượt, tên dài, S Ex, 60 HV; sáng / tối; 1440 / 1280 / 375; zoom 125 %.

**Cổng:**
- Ảnh cặp M2-A | web, ≥ 90 % KHỚP, **chủ SP duyệt trước merge**.
- `do-khung` + `do-bang` xanh.
- Thêm phép đo nhỏ "hàng dính không che ô / menu / hộp".
- Kiểm tương phản cấp liền kề (sáng + tối) bằng `thiet-ke/v5/kiem-tuong-phan.py`.

**Tệp:** `index.css` / `v5-nen.css` (2 token mới), `NhomDau.tsx`, `HangLop.tsx`, `LuoiNhung.tsx`, `LuoiFT.tsx` (S Ex, cột dính), `ChamTestTab.tsx`, `seed` (cờ), `DESIGN.md`.

### 4.3 R1-EN-1, R1-EN-2 — tiếng Anh giao diện (ưu tiên 3a)

**EN-1 (nền, chạy ngay):**
- Ba phép kiểm vào `npm run check`:
  - (a) khoá trùng **khác giá trị** → đỏ; sửa 72 cặp theo glossary, xoá bản trùng cùng giá trị;
  - (b) quét chữ Việt cứng toàn `web/src` bằng `scripts/quet-chu.mjs`, có danh sách nền `scripts/chu-viet-cung.json` **chỉ được giảm** — chặn chữ mới chưa dịch;
  - (c) chuỗi lỗi máy chủ literal (`badRequest` / `forbidden` / `notFound` / `HttpError`): chuỗi mới phải dịch được bằng `dich()`, cũng theo danh sách nền.
- Glossary bản 26/10 (sửa tệp có sẵn, ghi nguồn quyết định từng dòng):
  - Bổ sung: KCK; bài / lượt / việc / HV; S Ex; Tiến độ trên lớp; Xét lại; Cuối khoá; Lộ trình mới; Tạm dừng/ Kết thúc học.
  - Nhãn lưu: "Lưu · bài tiếp" = **Save & next**, "Lưu · việc tiếp" = **Save & next task**, "Lưu · đóng" = **Save & close**, "Lưu lại" = **Retry save**.
  - Cặp phải phân biệt: kỳ vọng vs Target; Đạt MT / Đạt Test / Đạt Target thi thật; Case / PA / kết quả kỳ / kết quả cuối; người phụ trách / người thực hiện; Chưa có dữ liệu / Ngoài phạm vi / Vắng / Không học.

**EN-2 (sau PR 4.1; tệp Test làm sau PR 4.2):**
- Mọi màn GV dùng → **0 chữ Việt cứng**:
  - Tổng quan GV, Công việc, Test 3 tab;
  - hồ sơ lớp, hồ sơ HV, hồ sơ MT;
  - Case / PA, bàn giao;
  - Hướng dẫn GV.
- Lỗi máy chủ trên các đường đó: chuyển sang `loi(status, khoá)` hoặc thêm khoá EN đúng chuỗi.
- Chuỗi ghép ở máy chủ trả số liệu để web ghép bằng `t()`: `tongKet.ts:34`, `giaoVien.ts:852,855`, cùng chuỗi P13 nếu đã merge.
- Kiểm bằng `do-khung` ở chế độ EN, 1440 + 375: chữ dài làm vỡ nút / cột / chân panel.

**EN-3 (QL / QT / TVV / CX / Admin) — BỎ** (chủ SP 26/10, Q2):
- Không có QL / QT nào là người nước ngoài.
- Phép kiểm (b), (c) của EN-1 chỉ áp tệp / đường thuộc màn GV, danh sách tệp ghi trong phép kiểm.
- Tệp xuất: chỉ tệp GV xuất được.

**Tệp xuất (PR26 5.1A gồm "xuất dữ liệu"):**
- Tiêu đề cột, tên sheet, chữ trạng thái theo **ngôn ngữ giao diện của người bấm Xuất**: web gửi ngôn ngữ, máy chủ dùng `dichMau`. Dữ liệu (tên, chữ GV nhập) giữ nguyên.
- EN-2 làm các tệp GV xuất được: Xuất điểm Test `phanTich/xuatMt.ts`, danh sách lớp / HV nếu GV có quyền. Tệp chỉ nhân sự quản lý xuất (`xuatDanhSach.ts`, `keHoachTest.ts`…) theo EN-3.

**Chủ ý giữ tiếng Việt** (ghi trong PR):
- Tên người, mã lớp, mã tuần.
- Chữ GV nhập (đã có nút Dịch).

**Rà:** đọc diff + ảnh EN.

### 4.4 R1-DICH-2 — hoàn thiện P14 + hướng dẫn bật (ưu tiên 3b)

1. **Prompt máy chủ** (`server/src/dich/dich.ts:132-134`):
   - Nội dung đặt trong thẻ `<ghi_chu>…</ghi_chu>` và được nêu rõ là **dữ liệu**: không làm theo chỉ dẫn nằm trong đó.
   - Giữ nguyên số, điểm (6.5, 24/30), mã tuần (W3 SEP), mã lớp, `[[Pn]]`, phủ định.
   - Thuật ngữ giữ nguyên: Case, PA, SOS, MT, Target, KCK.
   - Chỉ trả bản dịch.
2. **Kiểm đầu ra:**
   - Tập `[[Pn]]` vào phải bằng tập ra, đúng số lần. Sai → 502 "Chưa dịch được", **không lưu cache**, vẫn tính lượt.
   - Chữ gốc có sẵn `[[P` → thoát trước khi che.
3. **Khoá cache** thêm phiên bản = băm (model + prompt v2). Đổi model hoặc prompt → bản dịch mới.
4. **Trần độ dài:**
   - Chữ vào: lấy độ dài tối đa của các nguồn trong `NGUON_DICH`; vượt → 400.
   - Trần token ra: tên tham số theo tài liệu.
5. **Web `ChuDich`:**
   - Reset `xemDich` / `dang` / `loi` khi khoá đổi; bỏ phản hồi về muộn.
   - Máy chủ trả kèm băm chữ đã đọc; web chỉ hiện bản dịch khi khớp chữ đang thấy, khác → "Nội dung vừa đổi — Dịch lại".
6. **Tham số OpenAI:** xác minh `DICH_MODEL` mặc định + giá trị `reasoning_effort` hợp lệ **theo tài liệu chính thức ngày làm PR**. Sửa code hoặc plan P14 cho khớp; ghi link + ngày đọc.
7. **`/security-review`** (CLAUDE.md: đổi quyền / dịch AI).
8. **Hướng dẫn** `docs/huong-dan/bat-dich-ai.md` — tiếng Việt, đủ 9 mục của PR26 5.4. Mỗi bước: vào đâu → bấm gì → điền gì → thấy gì là đúng → lỗi thì làm gì. Tra tài liệu OpenAI + Netlify mới nhất khi viết. Ghi rõ:
   - Tài khoản ChatGPT và API là hai phần riêng.
   - Khoá chỉ đặt trên Netlify (Functions), không `VITE_`, không dán vào chat / PR.
   - **Bật khoá sau khi R1 đã deploy** (DB phải có bảng `ban_dich` / `dich_luot`).
   - Bật xong tải lại trang (cờ nằm trong phiên).
   - Nút chỉ hiện khi chữ khác ngôn ngữ giao diện.
   - Hạn lượt **không phải trần tiền**; ngân sách nhà cung cấp là cảnh báo hay chặn — ghi theo tài liệu.
   - Tắt nhanh: `DICH_TAT=1`; thay / thu hồi khoá.

**Trạng thái R1 phải ghi một trong hai:**
- "Đã bật và thử thật" — chủ SP làm sau deploy.
- "Code sẵn sàng, còn bước cấu hình của chủ SP".

### 4.5 R1-SUA-NHO — lỗi thật chưa lên bản chính

- **Trục Hành trình** (`HanhTrinhKyNang.tsx:145-151`): điểm sau tuần 80 bị vẽ vào cột đầu. Sửa:
  - Trục chạy từ điểm đầu tới điểm cuối, trần 260 tuần.
  - Quá trần → hiện 80 tuần gần nhất + nút "Xem trước đó".
  - Không bao giờ vẽ điểm ngoài trục.
  - Tách hàm trục ra shared để có phép kiểm thuần.
- **Vòng chuyển hướng hồ sơ lượt** ([KIỂM] khả năng: lượt lớp thường `classId = null` → `duongHoSo.ts:93` trả `/mock-test/:id` → `MockDetailPage.tsx:176` chuyển về chính nó). Tái hiện; nếu thật → về hồ sơ HV.
- **Xoá `CasePanel` component chết** (`cases/CasePanel.tsx:153`, 0 nơi gọi; giữ `ThanCase`, `tenNganCase`).

### 4.6 R1-KHO-TEP — **BỎ** (chủ SP 26/10)

**Quyết định:** tệp bằng chứng trên bản chính chỉ là tệp thử, không quan trọng → không chép, không đếm, không làm công cụ.
- Hệ quả đã biết: dòng tệp cũ vẫn hiện trong hồ sơ, bấm tải sẽ báo lỗi.
- Kho cũ trên Netlify không bị xoá, nên sau này cần vẫn chép lại được.
- Lần đầu có tệp thật thì làm công cụ chép trước lần đổi DB kế tiếp.

Phần dưới giữ để tra cứu:

**[KIỂM] Hiện trạng:**
- Kho tệp tên theo DB (`khoTep.ts:17`: `bang-chung-<tên DB>`).
- Đổi DB → kho mới rỗng.
- `khoi-phuc` không chép tệp; chưa có công cụ chép.

**Tiền kiểm (chủ SP):** chạy `npm run sao-luu` có `NETLIFY_SITE_ID` + `NETLIFY_AUTH_TOKEN` → đếm tệp.
- **Không gõ tay tên kho:** `tenKhoTep` lấy nguyên nhãn đầu tên máy chủ DB, có đuôi tổ chức Turso (`khoTep.ts:17-19`, `moiTruong.ts:43`).
- Đếm **cả kho của DB `pisatracking-261018`:** lần đổi DB 22/10 không ghi bước kiểm kho tệp (lần cuối "không có tệp" là 18/10, `plan.md:292`). Tệp tải lên 18–22/10 có thể đang nằm ở kho cũ, tức trên bản chính hiện **đã không tải được**.

**Nếu có tệp:** PR `npm run chep-kho-tep`:
- Đọc kho cũ, ghi kho mới.
- Chạy lặp không chép trùng.
- Có `--thu` chỉ đếm.
- Thêm bước vào DEPLOY.
- Rà `/code-review high`.

**Nếu 0 tệp:** bỏ PR, ghi "0 tệp" vào DEPLOY.

### 4.7 Thứ tự, song song, rà

| Đợt | PR (song song khác tệp) | Điều kiện |
|---|---|---|
| A | **LUU-TIEP** ∥ **EN-1** ∥ **DICH-2** ∥ **SUA-NHO**; PTA làm mockup **M2**; P13 sửa vòng 3, P8 tiếp (cloud) | chủ SP duyệt tài liệu này |
| B | **PHAN-CAP-TEST** (sau M2 duyệt + LUU-TIEP merge) ∥ **EN-2** (sau LUU-TIEP; 4 tệp Test sau PHAN-CAP) | |
| C | Rà EN cuối (chữ mới của đợt B) · EN-3 theo Q2 · PTA viết khối "Deploy R1" · đóng băng RC → `npm run check` + build **một lần** | |

- Tối đa 2 PR giao diện cùng lúc, khác màn (Q-2): đợt A có LUU-TIEP (hộp nhập điểm) và SUA-NHO (hồ sơ HV).
- Merge:
  - PR đổi bố cục (PHAN-CAP-TEST) chờ chủ SP duyệt ảnh, không merge qua đêm.
  - PR khác: PTA merge khi rà đạt + check xanh.

## 5. Mốc sẵn sàng deploy R1 — checklist

| # | Việc | Bằng chứng cần có |
|---|---|---|
| 1 | Phạm vi = SHA RC; P8 / P13 vào nếu đã merge trước đóng băng (Q1); không nửa schema / nửa UI | SHA trong DEPLOY |
| 2 | Đã xong: SUA-NO-RA #562 (`e5e1c074`), CHAM-LAI #564 (`71e806b2`), SUA-CHAM-LAI #567 (`ea1344c1`); TEN-CHI-SO chưa làm, **không chặn** | `git log` |
| 3 | Migrate từ `fa7e1811` (bảng dưới) tập dượt trên `mig.sqlite`, chạy 2 lần (lần 2 không in), **đúng ngày deploy** (P9a lấy ngày migrate làm mốc bắt đầu Xét lại) | log 2 lần chạy |
| 4 | Tiền kiểm chỉ đọc trên `mig.sqlite` trước migrate, gửi số cho PTA: `node scripts/kiem-truoc-cv-loi.mjs`, `npm run kiem-truoc-sv-nx-case`, `npm run kiem-tieu-chi-le`, `npm run kiem-truoc-ket-pet` (nếu P13), tiền kiểm P8 (nếu có) | số in ra |
| 5 | Tệp bằng chứng: **không chép** (chủ SP 26/10: chỉ là tệp thử); ghi một dòng trong DEPLOY "tệp cũ không chuyển — bấm tải báo lỗi" | dòng trong DEPLOY |
| 6 | Biến: `TURSO_*` DB mới (bắt buộc, `env:get` production + deploy-preview trước `--prod`); `OPENAI_API_KEY` + `DICH_*` **để sau** (4.4) | `env:get` |
| 7 | `npm run check` + `npm run build` trên RC, một lần | log |
| 8 | Smoke theo vai (vai đăng nhập mới): GV dạy L+R Lưu · bài tiếp · GV nước ngoài chế độ EN · GV S chấm chéo · GVCN lớp thường Cuối khoá · QL Tổng quan + Phân tích **Toàn bộ** (tốc độ Turso) · TVV Công việc · em Tạm dừng ở Lưu trữ (P7) · Checkpoint PET (P13) · tải một tệp bằng chứng | ghi đạt / lỗi từng dòng |
| 9 | **Rollback:** Publish deploy `6ad99a8e…` **và** đặt `TURSO_*` về `pisatracking-261022` (giữ ~1 tuần, không migrate). Rollback chỉ mã **không an toàn**: P7 đã lưu trữ em tạm dừng, P13 tách môn. Dữ liệu nhập sau deploy sẽ mất → rollback chỉ trong ngày, báo người dùng | ghi trong DEPLOY |
| 10 | Không chặn: DB demo preview chưa migrate; sổ tay PDF (D9) | — |
| 11 | Báo đúng một trạng thái: "sẵn sàng deploy" / "còn blocker: …" / "còn bước cấu hình: …" | — |

**Migrate từ `fa7e1811` tới `main`** (`server/src/migrate.ts`, mọi bước qua `buoc()`; chưa gồm P8):

| Bước | Đổi gì | Chạy lặp | Tiền kiểm |
|---|---|---|---|
| `themCotPrSvNxCase` | Thêm cột `sos_cases.mo_ta_attempt_id` + chỉ mục | an toàn | — |
| `prCvLoi` (SUA-NO-RA đổi) | Gán người phụ trách Case mở còn trống, có lịch sử; **một lần** (khoá `pr_cv_loi_gan_chu_case_at`) | một lần | `kiem-truoc-cv-loi` |
| `prUiHoSoLop` | Thêm bảng `danh_gia_dau_ra` | an toàn | — |
| `prDich` | Thêm bảng `ban_dich`, `dich_luot` | an toàn | — |
| `prSvNxCase` | Gắn `mo_ta_attempt_id` cho Case MT có mô tả = nhận xét; hạ cờ `cho_phu_trach_xem` khi PA đã xác nhận | an toàn (chỉ dòng NULL / cờ 1) | `kiem-truoc-sv-nx-case` |
| `prXetLai` | Thêm bảng `xet_lai_lo_trinh`; mốc bắt đầu = ngày migrate; đóng thẻ "Báo lên Mini Test" đang chờ | một lần (gắn với tạo bảng) | — |
| `prBaoCaoLichSu` | Thêm cột `thi_that_target`; điền Target hiện tại cho lộ trình đã có KQ (ước lượng) | an toàn | — |
| `prSvLoTrinh` | Thêm cột `route_ten`; thêm lộ trình KHAC (ngừng); **em tạm dừng → Lưu trữ** | an toàn | — |
| `prKetPet` (#586) | Tách môn PET / KET; bỏ KCK; Target ngoài thang → trống | xem rà vòng 3 | `kiem-truoc-ket-pet` |

## 6. Sau R1 — mục 4, 5, 6 (bắt đầu bằng mockup)

**Chuẩn mockup cho mọi mockup:**
- Thư mục `thiet-ke/v7/`.
- Chú thích **ngoài vùng UI** theo PR26 mục 10: mã, route, vai, điểm vào, dữ liệu, vùng A / B / C, hành vi bấm, giữ / thay, lỗi, trạng thái duyệt.
- Cùng một bộ dữ liệu cho mọi phương án.
- Ảnh 1440 + 375, sáng / tối; ảnh toàn trang làm mốc + ảnh chi tiết.

**Mục 4 — Hồ sơ lượt Test (M4)**
- **Dữ liệu chung:** một em FT MT2 có ô dời, ô vắng, môn không học (P8), S Ex, Case W đang mở; một em lớp thường Checkpoint / Progress.
- **Ba phương án:**
  - A: bảng kết quả làm trung tâm — **khuyến nghị**.
  - B: chọn kỹ năng, vùng chi tiết bên cạnh.
  - C: dòng thời gian.
  - Có thể ghép: A mặc định + B cho vùng xử lý + C cho lịch sử thu gọn.
- **Hỏi khi duyệt:** lớp thường có trang lượt riêng không. Khuyến nghị **có**, cùng khung, thang % — hiện chỉ có bảng cả lớp.
- **Sau duyệt:** PR máy chủ (API lượt lớp thường nếu thiếu) → PR giao diện.
- Không gộp sửa logic điểm vào PR bố cục.

**Mục 5 — Hồ sơ HV, chart, góp ý tuần**
- **Thứ tự 5 câu hỏi** đầu hồ sơ theo PR26 8.1; ghi nguồn / ngày cho ô điểm đầu khi các kỹ năng khác lượt.
- **Chart (M5): A / B / C**, khuyến nghị **A** — một kỹ năng, kỳ vọng từng lượt:
  - mốc đổi Target, chú giải, ◆ thi thật;
  - khoảng thiếu không nối;
  - bảng dữ liệu tương đương; tooltip mở được bằng focus / chạm;
  - lớp thường có chart % riêng thang — không trộn band.
- **Góp ý tuần (M5b): A / B / C**, khuyến nghị **A**:
  - Đọc chung trong "Tiến độ trên lớp", ghi rõ nguồn; góp ý cũ chỉ đọc.
  - PR máy chủ khoá ghi `PUT /classes/:id/gop-y` (đang mở mà không có giao diện).
  - Sửa chú thích cũ `gopYTuan.ts:7`. Quyền theo `:31` (OV-13h, chủ SP 15/10: lớp đã kết thúc GV / GVCN vẫn ghi) **giữ, không rút**.
  - **Bật lại ghi = chủ SP quyết khi duyệt M5b.**

**Mục 6 — Panel**
- **6a inventory:** agent đọc đủ caller `KhungPanel` / `NganDanhSach` / `OSo` / `OChiSo` / `useMoSoLieu` / `PanelViec` / `NganCase` / `Modal` → bảng 11 cột theo PR26 9.1 + danh sách giữ / sửa / gộp / bỏ.
- **Hợp đồng panel 5 phần** (PR26 9.2): đầu panel, dữ liệu đủ quyết định, bước tiếp, tra cứu sâu, trạng thái.
- **6b pilot (M6 trước code):**
  - số "Case chưa PA" → Case → thêm PA → lưu → xác nhận → kết quả → ‹ Quay lại × 2;
  - một panel việc;
  - panel "GV quá hạn".
  - Cách làm: **ngăn xếp view nhỏ trong `KhungPanel`** (mảng view cục bộ, "‹ Quay lại" tự có), thay cho `quayLai` nối tay; URL `?so-lieu=&dong=` giữ như nay.
  - Duyệt xong → luật thay V11 (D3).
- **6c:** áp dần theo màn.
- **Panel trung gian:** `NeedsEvaluation` → thêm ngữ cảnh + việc tại chỗ, hoặc thành link thẳng.

## 7. Câu hỏi cho chủ SP — đã trả lời 26/10

1. **Q1 — chờ P8 / P13?** → **Chờ.** "Cứ đợi đi, đang chạy rồi; đằng nào cũng cả đống PR sao kịp" (D10).
2. **Q2 — phạm vi tiếng Anh?** → **Chỉ màn GV dùng**; không QL / QT nào là người nước ngoài. EN-3 bỏ (D11).
3. **Q3 — "chỉ còn Lưu" ở đâu?** → Máy tính (điện thoại chắc cũng vậy), "khi điểm đủ kỳ vọng". PTA tái hiện: chỉ trang một em (hồ sơ MT, Lộ trình) — xem 4.1.
4. Tệp bằng chứng → **bỏ chép** (chỉ là tệp thử; 4.6).

## 8. PTA tự quyết (chủ SP xem khi đọc)

**Lưu / bài tiếp:**
- Hộp một trường đóng sau lưu đổi nhãn thành "Lưu · đóng".
- **Vắng giữ như nay** (ghi "-" rồi chuyển, có Hoàn tác).
- Ô gõ trực tiếp lớp thường giữ Enter xuống hàng nhưng bỏ qua hàng chỉ đọc.
- Không đổi gì mà ô còn trống → ở lại và nhắc (không thêm nút "Bỏ qua").
- Hết lớp → "Lớp tiếp: {mã} ›" (cùng việc gộp / cùng tuần), rồi "Việc tiếp ›" ở nơi có danh sách việc.
- Hồ sơ MT / Lộ trình: bài tiếp trong chính lượt, hết thì "Lưu · em tiếp ›" theo danh sách nguồn, không có danh sách thì "‹ Về {nguồn}".
- Lỗi máy chủ khi lưu điểm không focus đúng ô (không đổi API).

**Lịch Test:** khuyến nghị A; thêm cờ `SEED_LON` để có dữ liệu nghiệm thu.

**Tiếng Anh:** ba phép kiểm dùng danh sách nền chỉ được giảm, không bắt sửa 1 252 chữ trong một PR; tệp xuất theo ngôn ngữ người bấm Xuất (tiêu đề / trạng thái, không dịch dữ liệu).

**Phát hành:**
- Không tách nhánh release.
- Sổ tay PDF không chặn R1.
- KHO-TEP bỏ (chủ SP 26/10, tệp chỉ là tệp thử).
- Sửa trục chart trong R1, vì #550 chưa lên bản chính.
