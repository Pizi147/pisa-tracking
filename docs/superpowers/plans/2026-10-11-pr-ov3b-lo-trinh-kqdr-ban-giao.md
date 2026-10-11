# PR OV-3b — Lộ trình tiếp theo: nháp / chốt, bảng theo hướng, Kết quả đầu ra gộp, hạn mới, bàn giao

Nguồn: đặc tả OV mục 2 (dòng Lộ trình, Kết quả đầu ra), **3.1**, 4 "Hồ sơ lớp", 6.4 nghiệm thu; mockup đã duyệt
`thiet-ke/mockup-overhaul-2-ho-so-lop-lo-trinh-2026-10-11.html` **§4** (1440 + 375, hộp Lộ trình, hộp Kết quả đầu ra GVCN/QL, GV xem nháp).
Chạy sau OV-3a (#320). Song song được với **OV-2a** và **OV-1b** (xem Ranh giới). Rà: **sâu** (lệnh chuyển, MT0, migrate).

## Đầu ra (chỉ lớp thường, trừ mục 6)
1. **Nháp** — QL / Quản trị (`coTheRaLenh`) lưu nháp lộ trình bất cứ lúc nào: hướng, lớp đích, tuần, Target (Lên FT), ghi chú.
   Nháp **chỉ QL / Quản trị thấy** (máy chủ không trả nháp cho người khác), **không** tạo lệnh, MT0, việc, chuông. Sửa / xoá nháp được.
2. **Chốt** = ra lệnh Cuối khoá như hiện nay (`raLenh` → `dongBoTuLenh` → LTT + MT0 khi Lên FT) + mở việc Bàn giao; xoá nháp của em đó
   **cùng giao dịch**. Sửa / huỷ tới ngày thi hành (đường `suaLenh` / `huyLenh` có sẵn).
3. **Bỏ GVCN đề xuất lộ trình**: GVCN gọi ghi Hướng (`PUT /students/:id/lo-trinh-tiep`, `PUT /classes/:id/lo-trinh-tiep`) → **403**; bỏ cờ
   `coTheGhiHuong` (`transition.ts:212`) và việc / nhắc GVCN ghi lộ trình (`loTrinhTiep.ts:398` `nhacLoTrinh`). Cột `huong_gvcn` giữ để đọc lịch sử, thôi ghi.
4. **Hạn** (thay `hanChotLenFt`, giữ một hàm dùng chung cho máy chủ + web):
   - Nhắc từ **thứ Hai tuần Final − 2**: thanh nhắc ở hồ sơ lớp (QL) + việc QL "Chốt lộ trình · {lớp}" (`lopChoChotLoTrinh` hiện từ mốc này).
   - Hạn chốt = **Chủ nhật tuần Final − 2**; quá hạn đỏ, không chặn.
   - Bàn giao lớp thường Cuối khoá: hạn GVBM = hạn GVCN = **max(Chủ nhật tuần Final, ngày chốt + 2 ngày)**.
   - Ví dụ nghiệm thu: Final tuần 10 → nhắc từ thứ Hai tuần 8, chốt trước hết tuần 8, bàn giao trước hết tuần 10; chốt Chủ nhật tuần 10 → bàn giao hạn thứ Ba tuần 11.
   - Lệnh giữa khoá lớp thường giữ 2 / 3 ngày như cũ. Lệnh đã có giữ hạn đã lưu (không migrate hạn).
5. **Đổi hướng hoặc lớp đích của lệnh đã chốt** → phiếu bàn giao cũ thành "cần làm lại": bỏ xác nhận, GVBM / GVCN phải xác nhận lại,
   **chữ cũ điền sẵn** (không mất nội dung), hạn tính lại theo mục 4; **một chuông "Cần làm"** cho GVCN + GVBM lớp nguồn (`notify`). Đổi tuần / ghi chú: không chuông.
6. **FT** (Chuyển tiếp lớp, `TransitionPanel` giữ nguyên): hạn bàn giao **5 ngày** sau ra lệnh, GVBM và GVCN (cùng cách tính "cả ngày ra lệnh" của `hanBanGiao`).
7. **Kết quả đầu ra (KQĐR)** — đổi tên "Kỳ vọng đầu ra" ở mọi chữ trên màn; em Lên FT từ **FOU / BE / ELE** (thêm FOU), theo MT0 (≥ 3/4 kỹ năng, luật A #312):
   - Ngưỡng: BE 4.0 · ELE 4.5 như nay · **FOU: Overall > 3.5** (`NGUONG_KY_VONG.FOU = 4` với phép so `>=` — Overall làm tròn 0.5 nên tương đương).
   - **GVCN đề xuất** (GVCN lớp nguồn): Đạt / Không đạt + Trung tâm / Học viên + kỹ năng + ghi chú → lưu đề xuất, **không chạy gì** (không Case, không việc).
   - **QL chốt** (đường có sẵn `ghiKetLuanFt` / `luuKyVong`): hộp điền sẵn đề xuất GVCN; "Không đạt · Trung tâm" → Case + Tutor 10 buổi chạy ngay (như nay).
   - Chỉ có ô KQĐR khi đã chốt Lên FT; chưa đủ 3/4 kỹ năng MT0 → "Chờ MT0".
   - Bỏ mục ⋯ "Kỳ vọng đầu ra" (`menuHoSoLop` key `ky-vong`) và panel riêng; `?viec=ky-vong` mở cách xem Lộ trình tiếp theo.
8. **Giao diện — tab Học viên › cách xem "Lộ trình tiếp theo"** (giữa Tổng hợp và Cần hỗ trợ; lớp thường; khoá URL `?che-do=lo-trinh`) theo mockup §4:
   - Đầu khối: "QL chốt trước hết {tuần} · GV bàn giao trước hết {tuần} · x/y em đã chốt"; lọc nhanh **Tất cả · Chưa chốt · Còn bàn giao** (số đếm cùng hàm với bảng).
   - Mỗi hướng một bảng nhỏ, mở sẵn, thu gọn được: Chưa chọn (chỉ khi còn em) · Lên FT · Lên {lớp kế} (`NORMAL_LADDER`) · Học lại (cùng trình độ
     hoặc xuống lộ trình dưới — cho phép lớp đích thấp hơn) · Tạm dừng · Dừng học. Em chuyển bảng ngay khi lưu (nháp hoặc chốt).
   - Cột: Học viên · Progress · Final (ô điểm bấm được → nhập điểm như Tổng hợp, dùng lại `nhapDiemCua`) · [Lên FT: MT0 L R W S · Overall]
     · **Lộ trình** (chip "Nháp" / "Đã chốt" + chữ, không chỉ màu) · [Lên FT: **Kết quả đầu ra**] · **Bàn giao** (CN L R W S, ✓ xong / ⚠ quá hạn → bấm mở `BanGiaoPanel`).
   - **Hộp Lộ trình** (chỉ QL / Quản trị; hộp nhỏ, không panel lồng panel): hướng · lớp đích · tuần · Target (Lên FT) · ghi chú → **Xoá nháp · Lưu nháp · Chốt**;
     em đã chốt: Lưu (sửa lệnh) · Huỷ quyết định. Lỗi hiện trong hộp, giữ chữ đã gõ.
   - **Chọn nhiều em** (QL): thanh dưới cùng "n em đã chọn · {hướng} {lớp} {tuần} · Bỏ chọn · Lưu nháp · Chốt n em" — lô lỗi một phần: dòng lỗi
     giữ lại kèm lý do, dòng đúng vẫn lưu (dùng lại `chayHangLoat` như panel cũ).
   - GV (GVCN / GVBM): xem bảng; ô em đang là nháp hiện "Chưa chốt"; GVCN bấm ô KQĐR → hộp đề xuất.
   - 375: mỗi em một thẻ (`TheDong`), như mockup.
   - Thanh nhắc ở hồ sơ lớp (QL, từ thứ Hai tuần Final − 2, còn em chưa chốt): một dòng "Lộ trình tiếp theo · chốt trước hết {tuần} · x/y em" → mở cách xem này.
   - Lối vào cũ: ⋯ Lộ trình tiếp theo, `?viec=lo-trinh-ca-lop`, `?viec=chuyen-tiep` (lớp thường), việc QL "Chốt lộ trình", hồ sơ một em › Lộ trình tiếp theo
     → mở cách xem này; từ một em thì mở sẵn **hộp của em đó** (`&em={id}`).
   - Xoá `PanelCuoiKhoa.tsx` và `PanelKyVong.tsx` khi cách xem mới thay đủ (giữ hàm dùng chung trong `shared/domain`); không để mã chết.

## Tự quyết của planning (chủ SP xem khi rà; khác ý thì nói)
- **Nháp lưu ở bảng mới `lo_trinh_nhap`** (student_id, class_id, huong, lop_dich_id, tuan, muc_tieu, khong_cam_ket, ly_do, ngay_xem_lai, ghi_chu,
  sua_boi, sua_luc; UNIQUE(student_id, class_id)) — KHÔNG ghi vào `lo_trinh_tiep_theo`, vì mọi nơi đọc LTT (hồ sơ HV, Excel, `ghiCacDong` → `dongBoMt0`)
  sẽ làm nháp lộ ra GV hoặc tạo MT0. API mới tối thiểu: `PUT /classes/:id/lo-trinh-nhap` (items, ≤ 60 em) + `DELETE` một em; nháp trả trong
  `GET /classes/:id/transition` chỉ khi `coTheRaLenh`.
- **Migrate `prOv3b`** (chạy lặp được): (a) tạo `lo_trinh_nhap` + cột đề xuất KQĐR trên `lo_trinh_tiep_theo` (`kq_de_xuat_dat`, `kq_de_xuat_nguyen_nhan`,
  `kq_de_xuat_mon`, `kq_de_xuat_ghi_chu`, `kq_de_xuat_boi`, `kq_de_xuat_luc`); (b) LTT có Hướng mà **chưa có lệnh** `cho`/`da_chuyen`, chưa áp dụng, lớp còn chạy
  → chép thành nháp (QL không mất việc GVCN đã ghi). Không xoá LTT, không đụng MT0 đã có (có thể đã có điểm).
- **Phiếu "cần làm lại"** (mục 5): cách làm do session code chọn, miễn đúng đầu ra (bỏ xác nhận + chữ cũ điền sẵn + chuông + hạn mới); ghi cách đã chọn trong mô tả PR.

## Ranh giới (song song OV-2a, OV-1b)
- Vùng của PR này: `server/src/classes/{loTrinhTiep,lenhChuyen,transition,banGiao}.ts`, `server/src/normal/{cuoiKhoa,kyVong}.ts`, `server/src/fasttrack/mt0.ts`
  (chỉ nếu cần), `shared/domain/{mt0,chuyenLop,cuoiKhoa,hocVienLop,lenLop}.ts`, `web/src/modules/classes/*` (trừ file OV-2a có thể chạm ở dưới),
  `web/src/modules/students/LoTrinhTiepPanel.tsx`, migrate mới `server/src/migrate/prOv3b.ts`, `server/src/ops/` (lệnh chỉ đọc mới).
- KHÔNG sửa (của OV-2a): `shared/domain/people.ts`, `server/src/seed/data.ts`, `server/src/permissions.ts`, `server/src/auth.ts`, `App.tsx`, `OverviewPage.tsx`,
  `platform/*`, `worklist/mywork.ts`, `worklist/meeting.ts`. KHÔNG sửa (của OV-1b): `fasttrack/{absence,scoring,attempts}.ts`, `cham/*`, `web/src/modules/cham/*`,
  `web/src/modules/test/LichTestTab.tsx`.
- `server/src/classes/classes.ts`: OV-2a sửa vài dòng quyền (~881). Cần sửa thì chỉ sửa đúng chỗ của mình; gộp main trước khi mở PR.
- Chung tất yếu: `server/src/tests/run.ts` (một dòng), `server/src/migrate.ts` (một dòng đăng ký), `plan.md`, `CODE_MAP.md`.
- Dữ liệu demo cho nháp / KQĐR (nếu cần chụp ảnh): file seed riêng của lộ trình (vd `server/src/seed/ctSeed.ts`), không `seed/data.ts`.
- Không làm OV-3c (KQ lớp trước ở FT), OV-2b (hồ sơ HV), OV-5 (Công việc tại chỗ — việc "Chốt lộ trình" vẫn mở hồ sơ lớp).

## Kiểm
- `server/src/tests/prOv3b.tests.ts` (đỏ trước, đăng ký cuối `run.ts`):
  - Nháp: QL lưu → không lệnh, không MT0, không việc, không chuông; `GET transition` vai GVCN / GVBM không có nháp; GVCN `PUT lo-trinh-nhap` → 403;
    sửa / xoá nháp; lô 3 em có 1 em lỗi → 2 em lưu, em lỗi có lý do.
  - Chốt từ nháp: lệnh `cho` + LTT + MT0 (Lên FT) + việc bàn giao; nháp em đó bị xoá cùng tx; huỷ quyết định → như nay.
  - GVCN ghi Hướng (`PUT /students/:id/lo-trinh-tiep`, `PUT /classes/:id/lo-trinh-tiep`) → 403; `transition` không còn `coTheGhiHuong`.
  - Hạn: đúng ví dụ Final tuần 10 (nhắc / chốt / bàn giao, cả ca chốt muộn → +2 ngày); `lopChoChotLoTrinh` hiện từ thứ Hai tuần 8, không trước; FT 5 ngày; giữa khoá 2/3 ngày.
  - Đổi lớp đích sau chốt → xác nhận bị bỏ, chữ cũ còn, đúng một chuông cho GVCN + GVBM; đổi tuần → không chuông.
  - KQĐR: GVCN đề xuất Không đạt · Trung tâm → không Case; QL chốt → Case + Tutor 10 buổi; FOU Overall 4.0 đạt, 3.5 không; chưa 3/4 kỹ năng → "Chờ MT0"; GVBM đề xuất → 403.
  - Migrate `prOv3b` trên DB có LTT GVCN chưa lệnh → thành nháp; chạy lần hai không đổi; LTT đã có lệnh không bị chép.
  - Đường mới có trần số câu ở `tocDoDuong` (không N+1 theo em).
- Phép kiểm cũ đổi đúng ý mới, KHÔNG xoá cho xanh (dự kiến `prLc`, `prLcb`, `prK26`, `prKv`, `prMt0`, `prCt`, `prCt2`, `prOv3a` OV3a-1 mục `ky-vong`); mỗi chỗ một dòng lý do trong mô tả PR.
- Lệnh chỉ đọc `kiem-truoc-ov3b` (`server/src/ops/`): đếm LTT sẽ thành nháp theo lớp + lệnh `cho` đang mở theo hạn; không ghi gì (phép kiểm). Chủ SP chạy trước deploy cuối OV.
- `npm run check` xanh. Bấm thử demo một lần (1440 tối + 375 sáng): QL (nháp → chốt, chọn nhiều, lô lỗi một phần, đổi lớp đích), GVCN (xem "Chưa chốt",
  đề xuất KQĐR), GVBM (bàn giao). Ảnh vào `thiet-ke/anh/pr-ov3b/`.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)

```
Session CODE cho PR OV-3b (Lộ trình tiếp theo: nháp/chốt, bảng theo hướng, Kết quả đầu ra gộp, hạn mới, bàn giao), repo Pizi147/pisa-tracking,
nhánh mới từ origin/main mới nhất (đã có OV-3a #320). Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b và 9.0, đặc tả docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md mục 2, 3.1, 6.4, rồi
docs/superpowers/plans/2026-10-11-pr-ov3b-lo-trinh-kqdr-ban-giao.md (làm ĐỦ Đầu ra; Tự quyết làm theo, thấy sai thì dừng hỏi chủ SP) và mockup
thiet-ke/mockup-overhaul-2-ho-so-lop-lo-trinh-2026-10-11.html §4.
PR này chạy SONG SONG với OV-2a và OV-1b: tuân thủ mục "Ranh giới"; PORT/WEB_PORT 4100/5273; `npm run check` tối đa 3 máy cùng lúc.
test-driven-development (prOv3b.tests.ts đỏ trước). impeccable: `layout`, `clarify`, `harden`, `adapt` trong phạm vi PR, sau đó `audit` trước khi mở PR.
`/ponytail-review` trước khi mở PR. `npm run check` xanh, bấm thử một lần trên demo (1440 tối + 375 sáng, QL + GVCN + GVBM), ảnh vào
thiet-ke/anh/pr-ov3b/ và mô tả PR. Không deploy, không chạm Turso/Netlify, không chạy migrate trên bản chính.
Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ngắn.
```
