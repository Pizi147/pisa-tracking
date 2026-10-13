# PR OV-11d — Hồ sơ học viên · Case (không kẹt sau Tạm dừng / Lưu trữ / Bước tiếp; nút hiện = máy chủ cho)

Nguồn: đặc tả `docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md` (mục 2, 3 Q4, Q12) · bước tái hiện: phụ lục `2026-10-14-ra-soat/ho-so-hv.md` (HV-*),
`critique-A2-hoc-vien-lop.md` (CA2-*), `hoc-vien-lop.md` (HL-11, HL-16). Đợt 2 (sau khi OV-11a, b, c merge), **song song với OV-11e, OV-11f**.
Rà: **sâu** (quyền, luồng Tạm dừng / Lưu trữ / Bước tiếp) + `/security-review`. Mockup: không cần (khung đổi nội dung như `NganCase`, dòng / nút theo mẫu sẵn có).

## Đầu ra
**A. Không kẹt**
1. **[HV-10 · chặn + HV-21] Tạm dừng không làm GVCN mất quyền.** `server/src/permissions.ts:193` `classesOfStudentDangHoc` tính cả ghi danh `paused`
   → GVCN lớp đó vẫn Sửa thông tin, Quay lại học, Thôi học, xử lý Ý thức. Thông báo Tạm dừng có **Hoàn tác** (trả nguyên trạng, không tính lại hạn Ý thức) như Thôi học.
   Dải Tạm dừng có nút **"Quay lại học"** (CA2-12), bỏ dòng tóm tắt trùng; ⋯ ghi "Thôi học" khi em đang Tạm dừng (HV-22).
2. **[HV-6] Bước tiếp sau thi làm được khi em còn ghi danh.** `server/src/loTrinh/buocTiep.ts:99`: Học lại / Học tiếp lộ trình mới với em còn học = Kết thúc học + `hocLai` trong **một giao dịch**
   (như nhánh Kết thúc); đổi Kết thúc → Học lại chạy được; câu lỗi đúng sự thật. `coMuc` (:32) / `NganTongKet.tsx:200` khớp máy chủ.
   Trước deploy: thêm vào `kiem-truoc` đếm (chỉ đọc) số em "lộ trình đã đóng mà còn ghi danh" (câu SELECT trong mô tả PR để planning chạy trên bản chính).
3. **[HV-3 · Q4] Hồ sơ Lưu trữ khoá đúng chữ "chỉ xem".** `shared/domain/quanLyHocVien.ts:66,71,74` ẩn Sửa thông tin / Lộ trình / Kết quả thi thật / + Case khi `chiXem`;
   máy chủ 400 "Đã lưu trữ — Bỏ lưu trữ trước rồi sửa." ở `PATCH /students/:id`, `PATCH /cycles/:id`, `PUT /cycles/:id/outcome`, `POST /cases/report`, `/cases/backfill`. Bỏ lưu trữ, Học lại giữ.
4. **[HV-8 · Q12]** Lưu trữ (`StudentManagePanel.tsx:215-255`) bỏ ô tích "Tôi hiểu…": lưu ngay + thông báo **Hoàn tác**.
5. **[HV-9]** Tổng kết lộ trình: Học lại / Học tiếp / Kết quả thi thật đổi nội dung **trong cùng khung** (dòng "← Tổng kết") như `NganCase` — không panel chồng (`NganTongKet.tsx:213,297`).

**B. Nút hiện = máy chủ cho**
6. **[HV-2]** `server/src/duyet/deXuatSua.ts:34` `guiDeXuatSua` chỉ cho **GV của lớp em đang học**; `coTheDeXuatSua` (`students/profile.ts:1007`) dùng cùng hàm → Admin / TVV / CX không có nút, API 403.
7. **[HV-1]** Sửa thông tin của GVCN: khi đã có đề xuất Target đang chờ, dưới ô Target hiện **"Đang chờ duyệt: 7.0 · Sửa đề xuất"** (mở `DeXuatSuaPanel` / thẻ của mình, sửa được — OV-7a);
   không gửi trùng; câu lỗi trùng nói chỗ sửa; chữ "Target" viết hoa.
8. **[HV-17]** Kết quả đầu ra chỉ cho em **có lệnh / lộ trình Lên FT**: `shared/domain/cuoiKhoa.ts:154`, `server/src/normal/cuoiKhoa.ts:769-770` (bỏ nhánh UNION 2);
   em đã chốt Lên FT có dòng KQĐR dù Final chưa có điểm (`StudentDetailPage.tsx:293` không đòi `scored > 0`). Lỗi "Chờ MT0" chỉ khi đúng là chờ MT0.
9. **[HV-19]** + Case › "Đã xong từ trước": kỹ năng GV không dạy hiện mờ + một dòng "Chỉ ghi bù Case môn bạn dạy" (`QuickReport.tsx`); lỗi 403 hiện `details.hint`. Luật C02 giữ.
10. **[HV-15]** FT: ⋯ Lộ trình (`StudentPlanPanel.tsx`) chỉ còn lịch MT; Tuần bắt đầu / Dự kiến thi / Target / Điểm đầu vào chỉ ở Sửa thông tin (một chữ "Tuần bắt đầu");
    GVCN bỏ mục "Đề xuất sửa thông tin…" (Sửa thông tin đã gửi đề xuất Target). Lớp thường: kiểm panel trước khi bớt, chỉ bớt ô trùng.
11. **[HL-11 · HV-25 · Q3 chủ SP chốt]** Sửa thông tin một em: **ngày sinh và email không bắt buộc** (gõ thì vẫn kiểm dạng; xoá trống = NULL) — không chặn lưu việc khác (`StudentManagePanel.tsx:446` + `PATCH /students/:id`).
    Em còn thiếu → nằm ở "Thiếu thông tin" (OV-11g) để TVV cập nhật.
11b. **[Q8 chủ SP chốt] Ai tích KCK.** Ô KCK (Sửa thông tin, Sửa cả lớp, lưới / dán Excel "6.5 KCK") chỉ **QL, Quản trị, TVV** đổi được — tích lúc nào cũng được, luật nhẹ áp từ lượt chốt sau khi tích (OV-11e).
    GVCN, CX, Admin: ô KCK chỉ đọc; máy chủ 403 khi đổi `kck` bằng vai khác.

**C. Một số liệu một nguồn**
12. **[HV-13]** Hạn bàn giao ở panel Chuyển lớp (`ChuyenLopPanel.tsx:168`) và thanh "Việc của tôi" (`server/src/students/viecHocVien.ts:143`) dùng `hanBanGiaoLenh` / hạn lưu trên lệnh — bỏ `hanBanGiao` cũ.
13. **[HV-4 · CA2-1]** Ô Học thuật: "mọi kỹ năng đạt" chỉ khi mọi hàng `missed === false`; chưa có điểm → **"chưa có điểm"**; có điểm, không Case → "Không có Case mở" (`shared/domain/hoSoHocVien.ts:287`).
14. **[CA2-2]** Ô Sắp tới hồ sơ HV lớp thường dùng cùng hàm mốc kế với danh sách lớp (`server/src/students/profile.ts:672-674`): không hiện bài đã qua.
15. **[HV-11]** Em đã chốt Lên FT: Sắp tới ưu tiên **"MT0 · W3 SEP"**, bỏ "xét lên BE" (`hoSoHocVien.ts:324`). Không thêm MT0 vào bảng Kết quả Test (PR-MT0 giữ).
16. **[CA2-3]** Hành trình: trạng thái Case dùng trạng thái v4 ("⚠ Quá hạn · chờ nguyên nhân"; "Đang làm" một màu) (`shared/domain/hanhTrinh.ts:218-219`).
17. **[HV-12]** Hành trình: ghi danh `completed` không `end_kind` mà có lớp sau → "Sang {lớp sau}" (không "Kết thúc học") (`hanhTrinh.ts:607-612`).
18. **[HV-7]** Tổng kết có kết luận cũ: ô Thi thật ghi "Kết luận cũ: Đạt Target" (không "Chờ kết quả thi thật"); gợi ý Bước tiếp ghi "theo kết luận cũ" (`buocTiep.ts:18,42`, `NganTongKet.tsx`).
19. **[CA2-9 hồ sơ]** Dự kiến thi một dạng (**JAN 2027**) ở đầu hồ sơ, Sửa thông tin, Sửa cả lớp; chữ hạn một hàm ("hôm nay" / "⚠ quá hạn n ngày") ở máy tính và 375.
20. **[HV-20]** Case giữ sau "Overall đã đạt": một dòng dưới đầu Case "Overall MT1 đã đạt — xem và Hoàn thành Case" (`CasePanel.tsx:470-490`).
21. **[HL-16 · CA2-4]** Panel mở từ ⋯ "Chuyển tiếp lớp" (FT) có tiêu đề **"Chuyển tiếp lớp · {lớp} · n em"** (`ChuyenLopPanel.tsx:380`, `classes/TransitionPanel.tsx:215`); Chuyển lớp một em giữ tên.
22. **[HV-22 · HV-24 · HV-23]** Sửa vi phạm tiêu đề có tên em (`yThuc/panelYThuc.tsx:49-55`); tên Case hệ thống tách chip (không "[MT2] … [SOS 1]" thô ở câu báo trùng); Admin Sửa thông tin
    "Target · Quản lý / TVV sửa"; Hoàn thành Case điền sẵn Kết quả cuối theo PA gần nhất; ô OVR thi thật là chữ (không trông như ô nhập); nút "Lịch đã đúng" mờ có lý do (`title`→ chữ);
    câu tóm tắt không để "KCK · không tính SOS" đẩy mất việc có hạn; Trước / Sau có cả em Tạm dừng (`StudentDetailPage.tsx:191-194`); "Đổi" ô TVV, ô tích KCK / Không thi, link kỹ năng "L" / "MT2" (audit P2-3) vùng chạm 44 px ở 375.

## Ranh giới
- Vùng: `server/src/{permissions(:186-200),students/*,loTrinh/buocTiep,duyet/deXuatSua,normal/cuoiKhoa(KQĐR :740-800)}.ts`, `server/src/cases/cases.ts` (chỉ chặn Lưu trữ ở report/backfill),
  `shared/domain/{hoSoHocVien,hanhTrinh,quanLyHocVien,cuoiKhoa}.ts`, web `students/{StudentDetailPage,StudentManagePanel,NganTongKet,ChuyenLopPanel,StudentPlanPanel,HanhTrinh,DeXuatSuaPanel}.tsx`,
  `classes/TransitionPanel.tsx` (tiêu đề), `cases/{QuickReport,CasePanel}.tsx`, `yThuc/panelYThuc.tsx`. Phép kiểm `server/src/tests/prOv11d.tests.ts`.
- KHÔNG đụng: `test/*`, `cham/*`, `fasttrack/*` (OV-11e) · `worklist/*`, `platform/*`, `Header` (OV-11f) · `classes/*` khác, `StudentsPage`, `hocVienLop` (OV-11g).
- Luật không đổi: C02 (GVCN không ghi bù Case môn không dạy); Target GVCN = đề xuất; Kết thúc học nhập bù được, Lưu trữ khoá; lệnh chuyển đã thi hành giữ khoá. Không migrate.

## Kiểm
- `prOv11d.tests.ts` (đỏ trước): (1) GVCN Tạm dừng em lớp mình → PATCH hồ sơ 200, Quay lại học 200, Ý thức 200; GVCN lớp khác vẫn 403; (2) Bước tiếp Học lại với em còn ghi danh → 200, một giao dịch,
  lỗi giữa chừng thì quay lui; (3) hồ sơ Lưu trữ: PATCH / outcome / cases/report → 400; Bỏ lưu trữ rồi sửa → 200; (4) de-xuat-sua bằng Admin / TVV / CX → 403, GV của lớp → 200;
  (5) KQĐR em BE → ELE → không có dòng, PUT 400 đúng lý do; em đã chốt Lên FT chưa Final → có dòng; (6) hạn bàn giao panel = lệnh = thanh việc; (7) `oHocThuat` ca `missed: null` → "chưa có điểm"
  (sửa `prVaiB.tests.ts:271` theo); (8) sửa thông tin khi thiếu ngày sinh / email → 200 (không bắt buộc); ngày sinh sai dạng → 400; (9) đổi KCK bằng QL / TVV → 200, GVCN / CX / Admin → 403.
- `npm run check` xanh MỘT lần cuối. Bấm thử MỘT lần (QL + GVCN 7 + TVV 23 + Admin 22; 1440 tối + 375 sáng): Tạm dừng → Hoàn tác / Quay lại học (GVCN), Lưu trữ, hồ sơ lưu trữ,
  Tổng kết › Học lại, Sửa thông tin (Target chờ duyệt, chỉ SĐT), + Case ghi bù, Chuyển lớp (hạn), Hành trình. Ảnh đính PR.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)
```
Session CODE cho PR OV-11d (hồ sơ học viên · Case — không kẹt, nút hiện = máy chủ cho), repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất. Không dùng Fable.
Gọi skill karpathy-guidelines. Gõ /ponytail lite (có giao diện). Đọc CLAUDE.md, plan.md mục 1.2, 1.3b, 3, rồi
docs/superpowers/plans/2026-10-14-pr-ov11d-ho-so-hv-case.md (làm ĐỦ 22 mục Đầu ra) + đặc tả docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md mục 3
+ phụ lục docs/superpowers/specs/2026-10-14-ra-soat/{ho-so-hv,critique-A2-hoc-vien-lop,hoc-vien-lop}.md (bước tái hiện).
PORT/WEB_PORT 4323/5496; npm run check tối đa 3 máy cùng lúc. Task ngay trong session (executing-plans, KHÔNG subagent), test-driven-development (đỏ trước), systematic-debugging khi lỗi lạ.
Chạy song song với OV-11e, OV-11f: chỉ sửa file trong mục Ranh giới. Đổi quyền: /security-review trước khi mở PR. Chữ trên web ngắn (nhãn 1–3 từ, không câu giải thích dưới nút/ô).
impeccable: clarify · harden · adapt trong phạm vi PR; /impeccable audit cuối. Bấm thử MỘT lần theo mục Kiểm, ảnh đính PR. /ponytail-review trước khi mở PR.
Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md nếu thêm/xoá file.
Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ≤ 15 dòng (ghi câu SELECT đếm của mục 2 trong mô tả PR).
```
