# PR OV-3c — Kết quả đầu ra lớp trước ở hồ sơ lớp FT (4 tuần theo đợt)

Nguồn: đặc tả OV mục 3.1 (dòng "Lên FT"), 4 "Hồ sơ lớp FT", 6.4 (câu cuối); mockup đã duyệt
`thiet-ke/mockup-overhaul-2-ho-so-lop-lo-trinh-2026-10-11.html` **§5** (dòng ~582–629). Chạy sau OV-3b (#325: KQĐR gộp, FOU, GVCN đề xuất / QL chốt).
Không chung vùng chính với PR OV nào khác → chạy song song được với bất kỳ PR OV nào (xem "Ranh giới"). Rà: mặc định. Không migrate.

## Hiện trạng (planning đọc mã 12/10, session code kiểm lại)
- KQĐR lưu ở `lo_trinh_tiep_theo` (một dòng mỗi em × lớp nguồn): QL chốt = `ky_vong_dat`, `ky_vong_nguyen_nhan`, `ky_vong_mon`, `ky_vong_ghi_chu`
  (`schema.sql:424-427`); GVCN đề xuất = `kq_de_xuat_*` (`:429-431`). MT0 từng kỹ năng + Overall **tính** bằng `mt0TheoLop` (`server/src/normal/kyVong.ts:64-85`).
- Vào FT: lượt ghi danh mới `started_at` = Thứ Hai tuần thi hành, lượt cũ `transferred` (`luatLoTrinh.ts:560-573`); `lo_trinh_tiep_theo.da_ap_dung_luc` cùng ngày
  (`transition.ts:409`). Em demo chuyển bằng `applyTransition` không có `lenh_chuyen_lop` → **đọc theo ghi danh, không chỉ theo lệnh**.
- Case KQĐR: `taoCaseKyVong` (`kyVong.ts:201`), tiêu đề bắt đầu "Kỳ vọng đầu ra…", chống trùng bằng `LIKE 'Kỳ vọng đầu ra%'` ở 5 chỗ → **không đổi tiêu đề Case**.
- Cách xem hồ sơ lớp: `TabHocVienLop.tsx:22,45,54-62`; `?che-do=` đọc ở `ClassOverviewPage.tsx:38`. Đếm cho đầu trang đi qua câu `daiLop`
  (`server/src/classes/daiChuyenLop.ts:22-31`) — overview FT đang sát trần (`tocDoDuong.ts:399-403`).
- Hồ sơ HV › Hành trình: payload đã có `kyVongDat` (`tongKet.ts:153`, bản chụp `banChup.ts:159-211`) nhưng `NganTongKet.tsx:22` không vẽ.

## Đầu ra
1. **Hồ sơ lớp FT › Học viên**: cách xem mới **"Kết quả đầu ra"** cuối hàng, bên phải "Cần hỗ trợ", kèm số đợt (`BoLocDoan` `so`). Chỉ lớp FT, chỉ khi lớp
   còn ≥ 1 đợt trong 4 tuần. URL `?che-do=ket-qua`; hết đợt mà mở URL cũ → về cách xem mặc định, không lỗi.
2. **Nội dung** (mockup §5): **một bảng mỗi chương trình nguồn** (FOU, BE, ELE — thứ tự `NORMAL_LADDER`; FOU có vì KQĐR có FOU từ OV-3b, cùng mẫu),
   tiêu đề "Kết quả đầu ra {BE}" + mờ "· {các lớp cũ}". Nhiều lớp cũ cùng chương trình gộp một bảng, **nhóm con theo đợt** = tuần vào lớp FT:
   dòng nền "Đợt {W3 NOV}" + "vào lớp {W3 NOV} · hiện tới hết {W2 DEC}" (tuần vào + 3 tuần; nhãn tuần bằng `tuanLich`, `shared/domain/hienThiNgay.ts:22`).
   Cột: Học viên (link) · Lớp cũ · Final (% chip) · MT0 · L R W S · Overall (kỹ năng dưới ngưỡng đỏ, Overall đậm; thiếu → "—") ·
   Kết quả đầu ra (chip "Đạt" / "Không đạt · Trung tâm · L" / "Không đạt · Học viên · S" / "Chưa chốt") · Hỗ trợ (link Case "Case L · Tutor 10 buổi" hoặc "—") ·
   Bàn giao từ GV cũ (nhận xét chung của phiếu bàn giao; không có → "Chưa bàn giao").
   **Chỉ giá trị QL đã chốt** — đề xuất GVCN chưa chốt KHÔNG lộ ra (hiện "Chưa chốt").
3. **375**: không cột; mỗi em một thẻ (`TheDong` / `useDienThoai`): "Tên · lớp cũ" · "MT0 5.0 · 5.5 · 5.0 · 5.0 · **5.0**" · chip · nhận xét hoặc link Case.
   Tiêu đề bảng bỏ danh sách lớp; dòng đợt "Đợt W3 NOV · hiện tới hết W2 DEC". Không cột Final (như mockup).
4. **Hết 4 tuần**: đợt tự ẩn; hết đợt → cách xem ẩn. Không xoá dữ liệu.
5. **Hồ sơ HV › Hành trình**: ngăn Tổng kết của lộ trình lớp thường vẽ "Kết quả đầu ra: Đạt / Không đạt" (+ nguyên nhân, môn nếu bản chụp có) từ `kyVongDat`
   đã có — để tra lại sau 4 tuần (đặc tả 3.1).
6. **Ai xem**: người xem được hồ sơ lớp FT (`attempt.view` — QL, Quản trị, GVCN, GVBM lớp FT, TVV, CX), **trừ Admin** (bảng vai đặc tả mục 2: KQĐR "—").
   Máy chủ chặn Admin (403), web ẩn cách xem. Chỉ đọc, không nút sửa (sửa KQĐR vẫn ở hồ sơ lớp nguồn như OV-3b).

## Cách làm gợi ý (session code tự chọn chi tiết, giữ ranh giới)
- Máy chủ: hàm mới `kqdrLopFt(lopFtId, homNay)` trong `server/src/normal/kyVong.ts`: ghi danh đang học lớp FT có `started_at ≥ homNay − 27 ngày`
  → lượt ghi danh `transferred` liền trước ở lớp FOU/BE/ELE → `lo_trinh_tiep_theo` (em, lớp nguồn). MT0 gom theo lớp nguồn (`mt0TheoLop` một lần mỗi lớp),
  Final % của lớp nguồn, Case (`sos_cases` tiêu đề "Kỳ vọng đầu ra%"), bàn giao (`lenh_chuyen_lop.nhan_xet_chung`). Không N+1.
- Đường `GET /classes/:id/ket-qua-dau-ra` (routes/index.ts) + dòng `DUONG_DO` **và** `TRAN` trong `tocDoDuong.ts` (thiếu TRAN thì phép đo bỏ qua, không báo).
- Số đợt cho đầu trang: thêm **một vế** vào câu `daiLop` (không thêm câu SQL vào overview), trả `dai.kqdrDot`.
- Web: `web/src/modules/classes/BangKqdrLopFt.tsx` (mới), mục cách xem trong `TabHocVienLop.tsx`, kiểu `dai` ở `DauTrangLop.tsx`, `ClassOverviewPage.tsx:38`;
  dùng lại `oMt0` / `oKqdr` (`BangLoTrinhTiep.tsx:161-190`) nếu hợp.
- **Dữ liệu demo**: MB FT 101 đã có 2 em từ MB BE 04 vào 07/09 (Chu Nhật Minh: Không đạt · Trung tâm · R + Case; Kiều Thảo Nhi: Không đạt · Học viên · S;
  `lt2bSeed.ts:53-69`) nhưng chưa MT0. Thêm (seed nhỏ, nối cuối như `ov2aSeed`): MT0 cho hai em đó; một đợt ELE (hoặc FOU) tuần khác có một em Đạt;
  một đợt cũ hơn 4 tuần (phải ẩn). Phép kiểm cũ đếm theo seed bị đổi → chọn lớp FT khác thay vì sửa phép kiểm cũ.

## Ranh giới (song song mọi PR OV)
- Vùng PR này: `server/src/normal/kyVong.ts`, `server/src/classes/daiChuyenLop.ts`, `web/src/modules/classes/{TabHocVienLop,ClassOverviewPage,DauTrangLop}.tsx`,
  `web/src/modules/classes/BangKqdrLopFt.tsx` (mới), `web/src/modules/students/NganTongKet.tsx`, seed mới.
- KHÔNG sửa: `fasttrack/*`, `cham/*`, `cases/*`, `web/src/modules/fasttrack/*` (OV-4a/4b, OV-1c) · `programmes`, `lichMt.ts`, `tenLop.ts`, `intake.ts`,
  `platform/*` (OV-6b) · `worklist/mywork.ts` (đổi tiêu đề việc "Kỳ vọng đầu ra · lớp" → "Kết quả đầu ra" là việc **OV-5**).
- Chung tất yếu (chỉ thêm dòng, gộp được): `server/src/routes/index.ts`, `server/src/tests/run.ts`, `tocDoDuong.ts`, `CODE_MAP.md`, `plan.md`.

## Kiểm
- `server/src/tests/prOv3c.tests.ts` (đỏ trước, đăng ký cuối `run.ts`):
  - em vào FT hôm nay − 27 ngày hiện; − 28 ngày ẩn; lớp không đợt nào → `dai.kqdrDot` = 0 và đường trả danh sách rỗng.
  - hai chương trình nguồn → hai bảng; hai đợt cùng chương trình (hai lớp cũ) → một bảng, hai nhóm, mỗi nhóm đúng "hiện tới hết".
  - GVCN đã đề xuất, QL chưa chốt → "Chưa chốt", payload KHÔNG có giá trị đề xuất; QL chốt Không đạt · Trung tâm → có link Case.
  - em vào FT bằng `applyTransition` (không lệnh) vẫn hiện; em chuyển từ FT khác sang (không phải FOU/BE/ELE) không hiện.
  - quyền: QL, GVCN lớp FT, GVBM lớp FT, TVV đọc được; Admin 403; GV lớp khác 403.
  - Hành trình: lộ trình lớp thường đã đóng có `kyVongDat` → ngăn Tổng kết có "Kết quả đầu ra".
- Tốc độ: overview lớp FT **không tăng số câu** (phép đo hiện có); đường mới có trần.
- `npm run check` xanh. Bấm thử một lần: QL (1440 tối), GVCN lớp FT (375 sáng), TVV; hồ sơ lớp FT có / không có đợt. Ảnh `thiet-ke/anh/pr-ov3c/`.

## Prompt (Opus 5.5 · High; B: Sonnet 5.5 · High)

```
Session CODE cho PR OV-3c (Kết quả đầu ra lớp trước ở hồ sơ lớp FT, 4 tuần theo đợt + dòng KQĐR ở Hành trình), repo Pizi147/pisa-tracking,
nhánh mới từ origin/main mới nhất (đã có OV-3b #325). Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b và 9.0, đặc tả docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md mục 3.1, 4, 6.4, rồi
docs/superpowers/plans/2026-10-12-pr-ov3c-kqdr-lop-truoc-ft.md (làm ĐỦ Đầu ra) và mockup thiet-ke/mockup-overhaul-2-ho-so-lop-lo-trinh-2026-10-11.html §5.
PR này có thể chạy SONG SONG với PR OV khác: tuân thủ mục "Ranh giới"; PORT/WEB_PORT 4150/5323; `npm run check` tối đa 3 máy cùng lúc.
test-driven-development (prOv3c.tests.ts đỏ trước). impeccable: `layout`, `clarify`, `harden`, `adapt` trong phạm vi PR, sau đó `audit` trước khi mở PR.
`/ponytail-review` trước khi mở PR. `npm run check` xanh, bấm thử một lần trên demo (QL 1440 tối, GVCN lớp FT 375 sáng, TVV), ảnh vào
thiet-ke/anh/pr-ov3c/ và mô tả PR. Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR.
Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ngắn.
```

## Tự quyết (planning, báo chủ SP)
- Có bảng **FOU** (mockup chỉ vẽ BE, ELE; KQĐR có FOU từ OV-3b — cùng mẫu).
- **Admin không thấy** cách xem này (theo bảng vai mục 2); GVBM lớp FT thấy (người nhận em).
- Đợt = tuần vào lớp FT; "4 tuần" = tuần vào + 3 tuần (mockup W3 NOV → hết W2 DEC).
