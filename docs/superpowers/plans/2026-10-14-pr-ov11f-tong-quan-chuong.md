# PR OV-11f — Tổng quan · chuông · thanh đầu (số ở ô = nơi nó mở, chuông chỉ việc còn mở)

Nguồn: đặc tả `docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md` (mục 3 Q5, Q9) · bước tái hiện: phụ lục `2026-10-14-ra-soat/tong-quan.md` (TQ-*),
`critique-A1-khung-tong-quan.md` (CA1-*), `phan-tich.md` (PT-3, PT-6), `impeccable-B-audit.md` (P1-1, P2-2, P2-5). Đợt 2 (sau OV-11a, b, c), **song song với OV-11d, OV-11e**.
Rà: mặc định + gọi API bằng TVV / CX / Admin cho mục 7. Mockup: không cần.

## Đầu ra
1. **[TQ-2]** "n PA chưa có Kết quả" → "Xem và nhắc" mở Công việc **lọc đúng loại việc** (`loai=ghi_ket_qua_pa` lọc thật, không quy về nhóm — `server/src/worklist/tongQuan.ts:121`,
   `web/src/modules/congViec/HoTroHocVienTab.tsx:67`). Số ở ô = số dòng nơi mở.
2. **[TQ-3]** Chỉ số `lop-chua-chot-len-ft`: dòng panel mở `/hoc-vien/lop/{id}?viec=lo-trinh-ca-lop` (không `?viec=phan-cong`), dòng phụ "n em chưa chọn · hạn …", không chữ "thiếu P"
   (`server/src/worklist/metrics.ts:215-221` `rowsFor` theo mã chỉ số).
3. **[TQ-10 · Q5]** "Học viên FT xong MT{n}, chưa có MT kế" = **đủ điểm bắt buộc** (cùng nghĩa Kế hoạch Test; `server/src/classes/schedule.ts:593-595` `XONG_MT_CUOI_SQL`, `metrics.ts:672-686`);
   nút "Kế hoạch Test" mở lớp với đúng các em đó nổi lên (lọc / chip trên Kế hoạch Test nếu đã có, không màn mới).
4. **[TQ-6 · CA1-3]** Chuông "Báo phụ huynh qua TVV" (`phoi_hop`) mở hồ sơ em `?tab=y-thuc&sub=phoi-hop` (`shared/domain/duongHoSo.ts:185-190`).
5. **[TQ-7]** Chuông "Cần làm" chỉ việc còn mở: tính `con_viec` cho `case_signal` (đã `linked` / `withdrawn` → 0) và `phoi_hop` (`server/src/platform/thongBao.ts:38-52`); `case_signal` có `case_id` mở `?case=`.
6. **[CA1-2 · Q9]** Ở Góc nhìn khác: chuông chỉ hiện thông báo vai đang chọn mở được; về vai gốc thấy lại; bấm không bao giờ đánh dấu đã đọc một thông báo không mở được (`Header.tsx:234-240`, `App.tsx:204`).
7. **[TQ-9]** `GET /tong-quan/quan-ly` đòi quyền việc của QL (không chỉ `analysis.view`) → TVV / CX / Admin 403; `diemChuY`, `chi-nhanh` giữ `analysis.view` (`tongQuan.ts:25-27`).
8. **[TQ-8]** QL / QT kiêm TVV ở vai gốc giữ Tổng quan QL; "Học viên của tôi" chỉ khi Góc nhìn = TVV (`OverviewPage.tsx:52`, `server/src/platform/nav.ts:30`).
9. **[PT-3]** Chỉ số SOS / Dưới kỳ vọng khung **Fast Track** chỉ lấy lượt Mock của lộ trình đang chạy (như `standingFor`), không rơi về Final lớp thường cũ (`server/src/worklist/danhGia.ts:173-188`);
   "Điểm đáng chú ý" cùng hàm. Demo: Chu Nhật Minh không còn trong SOS; Tổng quan = chip "Đang SOS".
10. **[PT-6]** "Dưới kỳ vọng" ở Tổng quan bỏ lượt em KCK (gọi `luotKck` như `phanTich/tongHop.ts:176`, Q29-1) — `danhGia.ts:209-221`.
11. **[TQ-11]** Panel chỉ số dùng cùng nhãn ô / dòng đang bấm (`web/src/ui/SoLieu.tsx:85`, `MetricTiles.tsx:38,45`, `CAN_XU_LY.nhan`): một khái niệm một tên ("PA chưa có Kết quả", "chưa đạt" / "dưới kỳ vọng" theo khung).
12. **[TQ-12]** Lịch sắp tới bỏ lớp 0 em (`Highlights.tsx:64-66`).
13. **[TQ-13]** "2 Case / 6 bài chưa có người" bấm được → danh sách (`SoLieuO`, `tongQuan.ts:139-145`).
14. **[TQ-14 · P2-2]** 375: chip dải Chờ duyệt (`KhoiCanXuLy.tsx:127-128`) và số bấm được ở bảng chi nhánh (`BranchPulse.tsx:105`) có vùng chạm 44 px (dọc + ngang), không đổi hình.
15. **[TQ-15]** Menu tài khoản GV chỉ liệt kê lớp đang mở (`Header.tsx:107-108`).
16. **[P1-1]** CX / QT Tổng quan ở 375 không tràn ngang: `OverviewPage.tsx:133` `grid-cols-[minmax(0,1fr)] lg:grid-cols-2`.
17. **[P2-5]** Tổng quan mọi vai có `h1` (được `sr-only`), Tổng quan TVV có heading.
18. **[CA1-10]** GV chưa có lớp: một câu đúng lý do ("Chưa có lớp được phân công"), máy tính và điện thoại cùng chữ.
19. **[CA1-11]** "Cần chú ý" chỉ một nghĩa trên Tổng quan (chỗ khác đổi chữ đúng nghĩa); "Cách tính" không lặp ở mọi ô (một ⓘ chung khối).

## Ranh giới
- Vùng: `server/src/worklist/{tongQuan,metrics,danhGia}.ts`, `server/src/classes/schedule.ts` (chỉ `XONG_MT_CUOI_SQL`), `server/src/platform/{thongBao,nav}.ts`, `shared/domain/{duongHoSo,tongQuan(CAN_XU_LY)}.ts`,
  web `worklist/{OverviewPage,Highlights,KhoiCanXuLy,MetricTiles,BranchPulse,LopToiDay,ViecCuaToi}.tsx`, `ui/SoLieu.tsx`, `platform/Header.tsx`, `congViec/HoTroHocVienTab.tsx` (chỉ đọc `loai=`), `App.tsx` (chỉ :204).
  Phép kiểm `server/src/tests/prOv11f.tests.ts`.
- KHÔNG đụng: `students/*`, `cases/*` (OV-11d) · `test/*`, `cham/*`, `fasttrack/*` (OV-11e) · `mywork.ts` (đã sửa ở OV-11c).
- Luật không đổi: thứ tự khối Tổng quan theo vai (mockup 13/10); Đổi góc nhìn chỉ QL / QT ≥ 2 vai.

## Kiểm
- `prOv11f.tests.ts` (đỏ trước): (1) `/tong-quan/quan-ly` bằng TVV / CX / Admin → 403, QL 200; (2) dòng `lop-chua-chot-len-ft` có `?viec=lo-trinh-ca-lop`; (3) `case_signal` linked → `con_viec = 0`;
  `phoi_hop` có đường; (4) SOS khung FT không đếm em chỉ có Final lớp thường (Chu Nhật Minh); (5) Dưới kỳ vọng không đếm lượt KCK; (6) "xong MT3" không đếm em MT3 thiếu W / S;
  (7) QL kiêm TVV vai gốc → `nav` cho Tổng quan QL; (8) chuông ở góc nhìn GV không có thông báo chỉ QL mở được.
- `npm run check` xanh MỘT lần cuối. Bấm thử MỘT lần (QL, GVCN, Admin, TVV, CX; 1440 tối + 375 sáng — CX 375 không tràn): mọi nút Cần xử lý, chuông Cần làm, Lịch sắp tới. Ảnh đính PR.

## Prompt (Opus 5.5 · High; B: Sonnet 5.5 · High)
```
Session CODE cho PR OV-11f (Tổng quan · chuông · thanh đầu), repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất. Không dùng Fable.
Gọi skill karpathy-guidelines. Gõ /ponytail lite (có giao diện). Đọc CLAUDE.md, plan.md mục 1.2, 1.3b, 3, rồi
docs/superpowers/plans/2026-10-14-pr-ov11f-tong-quan-chuong.md (làm ĐỦ 19 mục Đầu ra) + đặc tả docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md mục 3
+ phụ lục docs/superpowers/specs/2026-10-14-ra-soat/{tong-quan,critique-A1-khung-tong-quan,phan-tich}.md (bước tái hiện).
PORT/WEB_PORT 4325/5498; npm run check tối đa 3 máy cùng lúc. Task ngay trong session (executing-plans, KHÔNG subagent), test-driven-development (đỏ trước), systematic-debugging khi lỗi lạ.
Chạy song song với OV-11d, OV-11e: chỉ sửa file trong mục Ranh giới. Đổi quyền (mục 7): /security-review trước khi mở PR.
Chữ trên web ngắn (nhãn 1–3 từ, không câu giải thích dưới nút/ô). impeccable: clarify · harden · adapt trong phạm vi PR; /impeccable audit cuối.
Bấm thử MỘT lần theo mục Kiểm, ảnh đính PR. /ponytail-review trước khi mở PR. Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR.
Xong: một dòng mục 11 plan.md, CODE_MAP.md nếu thêm/xoá file. Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ≤ 15 dòng.
```
