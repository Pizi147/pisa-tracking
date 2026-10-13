# PR OV-5a — Công việc làm tại chỗ: danh sách trái · panel phải, lọc hai tầng, gom Xác nhận nguyên nhân + PA

Nguồn: đặc tả OV mục 4 "Công việc", 6.6; mockup đã duyệt `thiet-ke/mockup-overhaul-1-cong-viec-diem-mt-2026-10-11.html` **§1–§2** (dòng ~246–421,
chốt CV1, CV2). OV-5 của đặc tả tách hai PR: **OV-5a** (này) và **OV-5b** (Quay lại toàn hệ thống) — chạy song song. Rà: **sâu** (luồng chính, ghi theo lô).

## Hiện trạng (planning đọc mã 13/10, session code kiểm lại)
- Trang `/cong-viec/:tab?` → `web/src/modules/congViec/CongViecPage.tsx`, tab Hỗ trợ học viên `HoTroHocVienTab.tsx` → `NhomViec` → `DongViec`
  (`worklist/WorkList.tsx`): mọi nút việc **chuyển trang** theo `it.href` (`onOpen={navigate}`). Dòng gộp "n em ▾" (PR-GOP, `gopViecTheoLop`).
- Nhóm việc máy chủ `server/src/worklist/mywork.ts` (`NHOM_VIEC` ~`:124-200`; Xác nhận nguyên nhân = một dòng mỗi Case `:722-740`).
- Xác nhận một Case: `POST /cases/:id/xac-nhan` → `xacNhanCase` (`cases/sosAuto.ts:208`); xác nhận PA quy chế `POST /interventions/:id/xac-nhan-pa` (`:352`).
- Dùng lại được: `NganCase` (`web/src/modules/students/NganCase.tsx`, tự chứa), `BanGiaoPanel` (`classes/BanGiaoPanel.tsx`), hộp nhập điểm `HopNhapDiem`
  (OV-4b), form biện pháp Ý thức sẵn có, `KhungPanel`.
- Tiêu đề việc "Kỳ vọng đầu ra · {lớp} · n em" (`mywork.ts` ~`:1127`, nhãn nhóm + gợi ý `:181-182` chưa có FOU > 3.5; phép kiểm `prKv.tests.ts:102`).

## Đầu ra
1. **Bố cục** (1440): danh sách việc bên trái, **panel phải** xử lý việc đang chọn; bấm việc khác → panel đổi (không chồng panel). **Điện thoại**: bấm việc
   → màn đầy đủ có "‹ Công việc" (CV2), về đúng chỗ cũ.
2. **Lọc hai tầng** (mockup §1): hàng chính Của tôi / Của GV (QL, Quản trị) · hạn (Tất cả · Quá hạn · Hôm nay · Tuần này, có số) · Chi nhánh; **Lọc thêm**
   (Chương trình · Nhóm việc · Của một GV, số bộ lọc đang bật). **Dòng phạm vi** luôn hiện: "Đang xem: {CN} · {Của tôi} · {hạn} · n nhóm việc · m học viên"
   (đơn vị đúng: nhóm việc · học viên / bài cần chấm) + **Xoá lọc**. Bộ lọc nằm trên URL (OV-5b dùng để Quay lại).
3. **Panel theo loại việc** (mockup §2): Xác nhận nguyên nhân → panel gom (mục 4) · Thêm PA / Kết quả PA / Hoàn thành Case / Trả lời đề xuất → `NganCase`
   đúng việc (`viec=them-pa | ghi-ket-qua | hoan-thanh`) · Nhập điểm (một lớp · một kỹ năng) → danh sách em của kỹ năng đó, ô mở `HopNhapDiem`
   ("Lưu · em tiếp ›") · Bàn giao → `BanGiaoPanel` · Ý thức (biện pháp · xác nhận) → form sẵn có · **chỉ** Chốt lộ trình · {lớp} và Kết quả đầu ra mở
   hồ sơ lớp (đúng tab Học viên › Lộ trình tiếp theo) · Duyệt (Chờ duyệt) giữ nguyên. Tên em / lớp / lượt trong panel là link ↗ (tách khỏi nút làm việc).
4. **Gom Xác nhận nguyên nhân theo lớp + kỹ năng + lượt**: một dòng "Xác nhận nguyên nhân · Reading" / "CP FT 131 · MT2 · 4 em". Panel: bảng em (✓ chọn ·
   điểm kỹ năng · kỳ vọng · SOS · ghi chú riêng); em **khác mức PA quy chế** (vd SOS 3) **tự bỏ chọn**, ghi "làm riêng"; Nguyên nhân chính (chip) + Mô tả;
   **Phương án theo quy chế** (Loại · Nội dung · Số buổi) + Người thực hiện + Ngày bắt đầu (`ONgay`); ô **"xác nhận cùng lúc"** mặc định bật (CV1);
   nút **"Xác nhận n em"** và **"Xác nhận · việc tiếp ›"**; "Không cần theo dõi…" giữ đường cũ. Em bỏ chọn ở lại làm riêng (dòng "còn n em").
   Máy chủ: **một đường mới** nhận danh sách Case + nguyên nhân + PA, chạy `xacNhanCase` (+ `xacNhanPaQuyChe` khi bật) cho từng Case **trong MỘT giao
   dịch**; mỗi Case vẫn kiểm quyền, kiểm Case cùng lớp + kỹ năng + lượt + cùng mức PA quy chế (khác → 400 đúng em); trần câu SQL ở `tocDoDuong.ts`.
5. **Sau lưu**: dòng mờ + gạch, **không nhảy vị trí**, panel giữ, hiện "✓ Đã xác nhận 3 em · PA … chạy từ {ngày}"; chỉ chuyển việc khi người dùng bấm
   "· việc tiếp ›". Lỗi: giữ chữ đã gõ, nói đúng em lỗi; không báo xong khi chưa lưu. Badge / số đếm cập nhật cùng nguồn (`myWork().dong`).
6. **Đổi tên việc** "Kỳ vọng đầu ra · lớp" → **"Kết quả đầu ra · {lớp} · n em"**; nhãn nhóm "Kết quả đầu ra", gợi ý thêm FOU (Overall > 3.5). **Không** đổi
   tiêu đề Case "Kỳ vọng đầu ra…" (chống trùng dùng `LIKE`).
7. Ghi chú GOP (plan.md mục 4): Hồ sơ GV › Việc đang có đếm theo **dòng** như badge Công việc (cùng hàm).

## Ranh giới (song song OV-5b, OV-6b2)
- Vùng PR này: `web/src/modules/congViec/*`, `web/src/modules/worklist/{WorkList,NhomViec,ViecCuaToi}.tsx` + component panel mới, `server/src/worklist/mywork.ts`,
  `server/src/cases/sosAuto.ts` (đường xác nhận nhóm), `giaoVien/*` (đếm việc), `routes/index.ts`, `tocDoDuong.ts`.
- KHÔNG sửa (OV-5b): `web/src/ui/ThanhTruocSau.tsx`, đầu trang các hồ sơ, lớp lưu nguồn Quay lại — OV-5a chỉ đặt bộ lọc lên URL. (OV-6b2): `normal/*`,
  `platform/*`, tạo lớp. Không đổi luật Case / PA quy chế / hạn.
- Chung tất yếu: `routes/index.ts`, `tests/run.ts`, `CODE_MAP.md`, `plan.md` → gộp main trước khi mở PR.

## Kiểm
- `server/src/tests/prOv5a.tests.ts` (đỏ trước): gom đúng lớp + kỹ năng + lượt (hai lượt / hai kỹ năng → hai dòng); xác nhận nhóm 3 em → 3 Case + PA quy chế
  chạy, em bỏ chọn còn việc riêng; em khác mức quy chế trong danh sách → 400 nói đúng em, **không ghi gì** (một giao dịch); GV không phụ trách một Case → 403
  cả lô; badge = số dòng trước / sau; tiêu đề "Kết quả đầu ra · …"; hồ sơ GV đếm = badge.
- Phép kiểm cũ đổi đúng ý (dự kiến `prGop`, `prKv:102`, `prNv`), KHÔNG xoá cho xanh.
- `npm run check` xanh. Bấm thử một lần: GVBM Reading (1440 tối: gom 4 em, bỏ 1, xác nhận, dòng mờ), QL Của GV + Lọc thêm (1440), GV 375 sáng (màn đầy đủ,
  "‹ Công việc"), Nhập điểm trong panel. Ảnh `thiet-ke/anh/pr-ov5a/`.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)

```
Session CODE cho PR OV-5a (Công việc làm tại chỗ: danh sách trái · panel phải, lọc hai tầng, gom Xác nhận nguyên nhân + PA), repo Pizi147/pisa-tracking,
nhánh mới từ origin/main mới nhất. Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b và 9.0, đặc tả docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md mục 4 "Công việc", 6.6, rồi
docs/superpowers/plans/2026-10-13-pr-ov5a-cong-viec-tai-cho.md (làm ĐỦ Đầu ra) và mockup thiet-ke/mockup-overhaul-1-cong-viec-diem-mt-2026-10-11.html §1–§2.
PR này chạy SONG SONG với OV-5b và OV-6b2: tuân thủ mục "Ranh giới"; PORT/WEB_PORT 4180/5353; `npm run check` tối đa 3 máy cùng lúc.
test-driven-development (prOv5a.tests.ts đỏ trước). Dùng lại NganCase, BanGiaoPanel, HopNhapDiem, KhungPanel — không viết lại. Xác nhận nhóm là MỘT giao dịch.
impeccable (skill có sẵn trong repo): `layout`, `clarify`, `harden`, `adapt` trong phạm vi PR, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần (GVBM 1440 tối, QL Của GV 1440, GV 375 sáng), ảnh vào thiet-ke/anh/pr-ov5a/ và mô tả PR. Không deploy, không chạm Turso/Netlify.
Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP.
Báo cáo tiếng Việt, ngắn.
```

## Tự quyết (planning, báo chủ SP)
- Một đường máy chủ mới cho xác nhận nhóm (gọi lại hàm một Case trong một giao dịch) — không đổi luật xác nhận.
- Bộ lọc Công việc lên URL để OV-5b Quay lại đúng chỗ.
