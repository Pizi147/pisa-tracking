# PR OV-11c — Công việc · Chờ duyệt (một số liệu một cách đếm, việc xong không còn báo)

Nguồn: đặc tả `docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md` (mục 3 Q6, Q7, Q10) · bước tái hiện: phụ lục `2026-10-14-ra-soat/cong-viec.md` (CV-*),
`tong-quan.md` (TQ-1, TQ-4, TQ-5), `test.md` (TE-4), `ho-so-hv.md` (HV-14, HV-16), `phan-tich.md` (PT-7), `critique-A1-khung-tong-quan.md` (CA1-4).
Đợt 1, **song song với OV-11a, OV-11b**. Rà: **sâu** (luồng chính, số đếm, Nhắc). Mockup: không cần (mẫu panel tại chỗ OV-5a sẵn có).

## Đầu ra
**A. Một cách đếm**
1. **[TQ-1 · TE-4] "Bài quá hạn" một số.** `server/src/worklist/mywork.ts:390` khoá xô Nhập điểm thêm tuần thi (hoặc hạn) → việc con quá hạn chỉ chứa bài quá hạn, em thi bù tuần này không lẫn vào;
   `shared/domain/congViec.ts:79-82` `demPhamVi`: khi lọc Quá hạn / Hôm nay / Tuần này chỉ cộng `con` khớp lọc (cùng `khopLocNhanh`); nhóm Chấm điểm một đơn vị **"bài"**.
   Kết quả demo QL MB: Tổng quan "58 bài quá hạn" = Công việc lọc Quá hạn 58 = ô Admin "n quá hạn" (`tongQuanMt.ts:55-56` cùng xô). Nhắc chỉ nhắc bài quá hạn.
2. **[CV-1]** Dòng phạm vi "m học viên" đếm **tập em riêng** (máy chủ trả id em của dòng cả lớp, hoặc không ghi học viên khi có dòng cả lớp — chọn cách đúng số).
3. **[CV-15]** Số đầu nhóm lấy từ danh sách máy chủ, không cộng dòng giữ chỗ đã xong (`HoTroHocVienTab.tsx:121-122`, `NhomViec.tsx:40`).
4. **[CV-8 · Q6]** "Của GV" = **mọi việc của GV trong phạm vi**, cùng hàm "Lọc thêm › Của một GV" (`viecCuaNguoi`, `mywork.ts:1336-1352`) — gồm Bàn giao (`viecBanGiao` :623 cho từng GV);
   "Nhắc tất cả" nhắc cả Bàn giao quá hạn. Đo số câu SQL: giữ trần ở `tocDoDuong.ts`.
5. **[CV-11]** "Của tôi" chỉ việc người xem giữ (`ownerId === p.userId`, hoặc chưa ai giữ mà mình làm được); việc GV chỉ ở "Của GV" (`mywork.ts:549-550,670-703`).
6. **[CV-16]** QL / QT không lặp việc Vận hành ở Hỗ trợ học viên (đã có tab Vận hành); GV giữ như nay.
7. **[CV-4]** `shared/domain/daiDienBoTro.ts:8-12` nhận cả `bo_tro_mien_phi`; nhóm bổ trợ có Mini Test chờ chỉ **một** dòng "Ghi Mini Test"; chỉ số `pa-can-cap-nhat` (`metrics.ts:414`) theo cùng hàm.
8. **[PT-7]** Hồ sơ GV › Việc đang có (`HoSoGiaoVienPage.tsx:117-140`): ẩn ô nhóm người xem không được xem (Admin chỉ ô Chấm điểm); việc Vận hành không gắn lớp được tính khi GV thuộc chi nhánh người xem.
9. **[HV-14 · Q10]** Hạn Thêm PA một hàm cho Công việc và hồ sơ HV: `server/src/cases/cases.ts:1933`, `cases/caseLop.ts:96` dùng cùng `planDueDate` như `mywork.ts:712-715` (Case lớp thường hệ thống mở cũng có hạn).

**B. Việc xong thì mờ + gạch, không nhảy, không mất panel**
10. **[CV-2]** `web/src/modules/cases/ThaoTacCase.tsx:77` `ThemPaPanel` thêm `invalidate('/my-work')` (một dòng) → dòng Thêm PA mờ + gạch, số + badge giảm.
11. **[CV-3]** Dòng xong / làm một phần giữ đúng chỗ cũ khi đang mở panel (không sắp lại theo hạn mới, không rơi sau "Xem thêm") — `HoTroHocVienTab.tsx:110`, `gomNhomViec` (`shared/domain/tongQuan.ts:70-71`).
12. **[CV-7]** Ý thức Xác nhận xử lý tại chỗ: sau Lưu panel ở lại bước "Đã lưu · Tệp hoặc liên kết" (gọi `onDone` giữ chỗ trước khi làm mới `/my-work`, `XacNhanXuLyPanel.tsx:86-99`); dòng em mờ + gạch.
    `DaThucHienPanel`, `KhaiBacPanel` cùng mẫu.
13. **[CV-12]** Vận hành tại chỗ: "Cập nhật tiến độ" mở ngay trong thân panel (chip trạng thái + Ghi chú), không ngăn kéo thứ hai (`MgmtTasksPage.tsx` `NganViecVanHanh`).
14. **[CV-6]** Panel Nhập điểm: em của việc lên đầu (theo `studentId` của xô), phần còn lại gập **"Cả lớp (n)"** (`PanelViec.tsx:84-103`).

**C. Chờ duyệt · Nhắc · chữ**
15. **[CV-9 · Q7]** Bỏ quét `bao_len_chua_lenh` cho **lớp thường** (việc Chốt lộ trình của QL đã phủ, `duyet/loaiYeuCau.ts:553-598`); FT giữ, chữ thay nút Nhắc "Việc của Quản lý · Chuyển tiếp lớp"
    (không "Lớp chưa có GVCN", `shared/domain/yeuCauDuyet.ts:247-248`).
16. **[CV-10]** Thẻ Báo QL không lặp lớp / em (`TheYeuCau.tsx:185`; bỏ lớp khỏi `tieuDe` hai loại thẻ lớp `loaiYeuCau.ts:545,595`; `phu` Mini Test = người giữ việc).
17. **[CV-14]** Chờ duyệt › Nhắc việc nhận việc đã nhắc ở Hỗ trợ học viên (`napNguoiNhac` `loaiYeuCau.ts:114-123` dò theo `khoaCungViec` như `nhacViec`); "Nhắc tất cả" hai nơi cùng hộp hỏi lại
    (`HopChoDuyet.tsx:147-160,198`); "(n)" chỉ đếm việc chưa nhắc.
18. **[HV-16]** Yêu cầu tự đóng chỉ khi em **Thôi học / Lưu trữ** (`loaiYeuCau.ts:279`: `s.status = 'finished' OR s.archived_at IS NOT NULL`), không khi Tạm dừng; kiểm mọi loại cùng mẫu `status != 'active'`.
19. **[CA1-4]** Thông báo "Lớp hết khoá" ghi tên lớp (`server/src/duyet/yeuCau.ts:110`).
20. **[CV-13]** Mini Test đạt tự đóng Case: kết quả Case theo đúng mức GV chọn (PA `improved` → Case `much_better`, PA `partial` → Case `improved`), không gán cứng (`server/src/normal/cuoiKhoa.ts:626`).
21. **[TQ-4]** Dòng chấm chéo hiện "GV chấm chéo" (`WorkList.tsx:74` đọc `statusLabel`), không "chưa ai phụ trách".
22. **[TQ-5]** "Thêm PA" mở thẳng Case: `mywork.ts:733` href `/hoc-vien/{id}?case={caseId}&viec=them-pa`.
23. **[CV-17 làm đủ]** a. tiêu đề gom lớp thường ghi tên kỹ năng đủ (`mywork.ts:802-807`) · c. em trong dòng gộp mở trang khác có "↗" (`NhomViec.tsx:53`) ·
    d. panel gom sau "Gửi Quản lý duyệt": dòng "✓ Đã gửi QL duyệt" · e. "PA … chạy từ W3 SEP" (mã tuần, không ngày) · f. rỗng khi không lọc: "Không có việc nào" ·
    g. chỉ một nhóm (Admin) thì mở sẵn · panel Bàn giao nút "Xong" (chỉ đóng) → **"Đóng"** (CA3-12) · dòng gom một đơn vị **"em"**.

## Ranh giới
- Vùng: `server/src/worklist/{mywork,metrics(:414),tongQuanMt}.ts`, `server/src/duyet/{loaiYeuCau,yeuCau(:110)}.ts`, `server/src/cases/{cases(:1933),caseLop(:96)}.ts`, `server/src/normal/cuoiKhoa.ts(:626)`,
  `shared/domain/{congViec,daiDienBoTro,yeuCauDuyet}.ts`, `gomNhomViec` trong `shared/domain/tongQuan.ts`, web `congViec/*`, `worklist/{WorkList,NhomViec,MgmtTasksPage}.tsx`, `duyet/*`,
  `cases/ThaoTacCase.tsx` (1 dòng), `yThuc/{XacNhanXuLyPanel,DaThucHienPanel,KhaiBacPanel}.tsx`, `giaoVien/HoSoGiaoVienPage.tsx`, `BanGiaoPanel` (nhãn). Phép kiểm `server/src/tests/prOv11c.tests.ts`.
- KHÔNG đụng: `cham/MotKyNang.tsx` (OV-11a sửa CV-5) · `platform/*`, `admin/*` (OV-11b) · `worklist/{tongQuan,danhGia}.ts`, `OverviewPage` (OV-11f, đợt sau).
- Luật không đổi: gom việc PR-GOP (một lớp × một loại × một người); Nhắc 1 lần/ngày; ≤ 50 việc / lần Nhắc tất cả. Không migrate.

## Kiểm
- `prOv11c.tests.ts` (đỏ trước): (1) xô quá hạn không chứa bài chưa quá hạn; lọc Quá hạn tổng bài = chỉ số `bai-qua-han-nhap-diem` (demo); (2) "học viên" phạm vi = số em riêng;
  (3) "Của GV" của một GV = "Của một GV" (cùng tập, có `ban_giao`); "Của tôi" của QL không có dòng owner khác; (4) `daiDienNhomBoTro` gộp `bo_tro_mien_phi` — một dòng / nhóm;
  (5) Tạm dừng em không đóng đề xuất sửa đang chờ; Thôi học thì đóng; (6) Mini Test đạt sau PA "Tiến bộ rõ" → Case `much_better`; (7) hạn Thêm PA hồ sơ = Công việc;
  (8) không `bao_len_chua_lenh` cho lớp thường; (9) số câu SQL `/my-work?nguoi=tat-ca` trong trần `tocDoDuong.ts`.
- `npm run check` xanh MỘT lần cuối. Bấm thử MỘT lần (QL + GVCN 7 + Admin 22; 1440 tối + 375 sáng): Tổng quan "58 bài" → Công việc Quá hạn, Thêm PA tại chỗ, Ý thức xác nhận,
  Vận hành cập nhật, Nhập điểm panel, Chờ duyệt › Nhắc việc, hồ sơ GV xem bởi Admin. Ảnh đính PR.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)
```
Session CODE cho PR OV-11c (Công việc · Chờ duyệt — một số liệu một cách đếm, việc xong không còn báo), repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất. Không dùng Fable.
Gọi skill karpathy-guidelines. Gõ /ponytail lite (có giao diện). Đọc CLAUDE.md, plan.md mục 1.2, 1.3b, 3, rồi
docs/superpowers/plans/2026-10-14-pr-ov11c-cong-viec-cho-duyet.md (làm ĐỦ 23 mục Đầu ra) + đặc tả docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md mục 3
+ phụ lục docs/superpowers/specs/2026-10-14-ra-soat/{cong-viec,tong-quan,test,ho-so-hv,phan-tich}.md (bước tái hiện).
PORT/WEB_PORT 4322/5495; npm run check tối đa 3 máy cùng lúc. Task ngay trong session (executing-plans, KHÔNG subagent), test-driven-development (đỏ trước), systematic-debugging khi lỗi lạ.
Chạy song song với OV-11a, OV-11b: chỉ sửa file trong mục Ranh giới (KHÔNG đụng cham/MotKyNang.tsx). Đường API đổi số câu: đo lại, giữ trần tocDoDuong.ts.
Chữ trên web ngắn (nhãn 1–3 từ, không câu giải thích dưới nút/ô). impeccable: clarify · harden · adapt trong phạm vi PR; /impeccable audit cuối.
Bấm thử MỘT lần theo mục Kiểm, ảnh đính PR. /ponytail-review trước khi mở PR. Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR.
Xong: một dòng mục 11 plan.md, CODE_MAP.md nếu thêm/xoá file. Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ≤ 15 dòng.
```
