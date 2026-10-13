# PR OV-11e — Lịch Test đếm "phần của bạn" · Điểm theo lớp · huỷ / khôi phục nguyên trạng · KCK theo lượt · OV-1e bền

Nguồn: đặc tả `docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md` (mục 2, 3 Q8) · bước tái hiện: phụ lục `2026-10-14-ra-soat/test.md` (TE-*),
`critique-A3-test-cong-viec.md` (CA3-*), `phan-tich.md` (PT-4), `ho-so-hv.md` (HV-18), `hoc-vien-lop.md` (HL-6), `impeccable-B-audit.md` (P2-7).
Đợt 2 (sau OV-11a, b, c), **song song với OV-11d, OV-11f**. Rà: **sâu** (migrate, huỷ / khôi phục). Mockup: không cần — khối 1 dùng lại ô "phần của bạn" của khối 2.

## Đầu ra
1. **[TE-7 · CA3-4] Lịch Test của GV đếm phần của GV.** Người có phân công (không phải QL / Admin): dải số 3 ô, badge khối và khối 1 đếm + tô đỏ **chỉ bài của người xem**;
   phần GV khác ghi nhạt "n bài của GV khác". Khối 1 thay chip "Chờ bạn chấm" bằng ô "{kn} của bạn: còn n · {kn}: GV khác" của khối 2 (cùng hàm `phan`).
   Speaking Mock chấm chéo không đỏ / không tính cho GVBM S, GVCN (T18). QL / Admin thấy toàn bộ như nay. Badge "n bài chờ chấm" ở Học viên & Lớp = số "phần của bạn" ở trang nó mở.
   Mã: `server/src/cham/canCham.ts:700` (`noQuaHan`, `hangLopTuan`), `web/src/modules/test/lichTest/{DaiSo.tsx:15-22,KhoiNo.tsx:37}`.
2. **[TE-8]** Dòng "MT cũ chưa nhập · n em" (Lịch Test + việc Công việc cùng `href`, `canCham.ts:146-149`) mở **Điểm theo lớp** `?lop={id}&luot=mt:{n}` + "Chỉ ô còn trống";
   nhiều lượt thì liệt kê "MT1 · 3 em · MT2 · 2 em". Số = số ô ở nơi nó mở.
3. **[TE-10 · CA3-10]** Điểm theo lớp: "trống" chỉ đếm ô **đã tới tuần thi** (luật T19) (`server/src/cham/diemTheoLuot.ts:84-90`, `lopCuaToi`); hàng chưa tới tuần ghi mã tuần ("W4 DEC") thay "Chờ 4 kỹ năng".
4. **[TE-11]** `shared/domain/diemTheoLuot.ts:39-46` `luotMacDinh`: hai lượt cùng tuần → lượt nhiều ô trống hơn (Final trước MT0).
5. **[HL-6]** Điểm theo lớp mở từ hồ sơ lớp có **"‹ Hồ sơ lớp {mã}"** (chồng nguồn Quay lại OV-5b, `DuongVe`).
6. **[PT-4 · chặn] Khôi phục lượt = nguyên trạng.** Huỷ lượt cất id các yêu cầu duyệt đang "cho" của Case / PA bị đóng vào bản huỷ (`server/src/fasttrack/ketQuaHuy.ts:113`); Khôi phục
   (`attempts.ts` `reopenAttempt` ~:1581) trả các yêu cầu đó về "cho" — kể cả khi `quetYeuCau` đã đóng chúng thành `tu_dong` trong lúc lượt huỷ. Không sửa `duyet/yeuCau.ts`.
7. **[HV-18 · Q8 chủ SP chốt] KCK chụp theo lượt (luật nhẹ từ sau khi tích).** Cột mới trên lượt (kiểu `target_at_attempt`) ghi KCK **lúc lượt chốt**; `kckCuaLuot` (`fasttrack/attempts.ts:218-224`) đọc cột đó cho lượt đã chốt,
   cờ hiện tại của lộ trình cho lượt chưa chốt. Tích / bỏ KCK không đổi kết luận + Case của lượt đã chốt. **Migrate `server/src/migrate/prOv11e.ts`**: thêm cột; lượt đã chốt điền theo cờ hiện tại
   (giữ đúng như màn đang hiện); chạy lặp không đổi gì. Thêm vào `migrate.ts` + danh sách migrate plan.md mục 5.
8. **[OV-1e — giữ lịch thi lại KHÔNG theo ngày]** `server/src/migrate/prOv1b.ts` `giuLichThiLai`: bỏ điều kiện `ws >= tuần này`. Giữ (không đổi gì) **mọi** ô "-" nhập bù đã chốt mà máy đã
   dời bài sang **tuần khác tuần "-"** (có lịch thi lại), `sit_status` `scheduled` / `sat`, chưa huỷ / chưa chờ QL — **dù tuần thi lại đã qua** (đã thi chờ chấm, hoặc chưa nhập = nợ chấm bình thường).
   Lý do (`kiem-truoc-ov1b` bản chính 14/10): deploy sau W3 OCT thì 18 ô giữ hôm nay sẽ thành "Không dự thi"; 2 ô đã thi lại W2 OCT đang chờ chấm (Tô Xuân Tùng MT3 W1 `sat`,
   Nguyễn Vũ Nam Phương MT1 R) đã bị đổi. Kết quả không phụ thuộc ngày deploy, chạy lặp không đổi gì. `kiemTruocOv1b` cùng hàm.
9. **[TE-12 phần còn]** Admin hộp một đợt: "Dời hạn chấm" mờ lý do **"Chỉ Quản lý"** (`shared/domain/thaoTacMt.ts:90`) · hồ sơ MT › Lịch sử mã tuần không kèm năm khi cùng năm ·
   hồ sơ MT lượt chưa tới tuần: ẩn "Nhập điểm" · hộp "Huỷ MT{n}?" nêu cả PA (chưa có kết quả) sẽ đóng (`HopHuyMt.tsx`) · Kế hoạch Test lớp thường chip bài quá tuần chưa chấm có "· trễ" như FT
   (`shared/domain/keHoachTest.ts:221-240`).
10. **[CA3-11]** Bỏ cắt chữ: cột Đợt khối 1 / khối 2, công tắc ở cột trái Điểm theo lớp, Kết quả lớp thường BE 03, câu lỗi trong hộp / panel (xuống dòng, không `truncate`).
11. **[CA3-12 Test]** Dòng lớp GV Writing: "W2 của bạn: còn 1 · W1, S: GV khác" (W1 / W2 tách người); tên kỹ năng một kiểu trong Test (đủ tên ở tiêu đề, chữ tắt ở chip có `title`).
12. **[P2-7]** Ô "Tìm lớp…" Kế hoạch Test có `aria-label="Tìm lớp"` (`test/keHoach/TimLop.tsx:39`).

## Ranh giới
- Vùng: `server/src/cham/{canCham,diemTheoLuot}.ts`, `server/src/fasttrack/{ketQuaHuy,attempts}.ts` (huỷ / khôi phục / `kckCuaLuot`), `server/src/migrate/{prOv11e,prOv1b}.ts`, `migrate.ts`,
  `schema.sql` (cột mới), `server/src/ops/kiemTruocOv1b.ts`, `shared/domain/{diemTheoLuot,thaoTacMt,keHoachTest}.ts`, web `test/*`, `cham/{DiemTheoLop,LuoiChamLop}.tsx`,
  `fasttrack/{MockDetailPage,HopHuyMt}.tsx`. Phép kiểm `server/src/tests/prOv11e.tests.ts` (+ sửa ca cũ `prOv1b.tests.ts` nếu đổi).
- KHÔNG đụng: `students/*`, `cases/*` web (OV-11d) · `worklist/*`, `platform/*` (OV-11f) · `duyet/yeuCau.ts`.
- Luật không đổi: T15–T18 (ba khối, chấm chéo), T19, OV-4a (huỷ giữ điểm ẩn), OV-9 (KCK nhẹ). QL / Admin xem toàn bộ.

## Kiểm
- `prOv11e.tests.ts` (đỏ trước): (1) GVBM S lớp MB FT 101: dải số "Quá hạn chấm" = bài của mình (0), không đếm S chấm chéo; QL = toàn lớp như cũ; badge lớp = số trang mở;
  (2) Điểm theo lớp "trống" không đếm ô tuần sau tuần này; (3) `luotMacDinh` hoà tuần → Final; (4) huỷ lượt có yêu cầu "Không cần theo dõi" chờ → gọi `/hoc-vien-lop` → khôi phục → yêu cầu "cho" lại,
  Chờ duyệt + Chờ nguyên nhân như trước huỷ; (5) KCK tích sau khi lượt chốt SOS 2 → lượt vẫn SOS 2 + Case giữ; lượt mới chốt sau đó → KCK; migrate `prOv11e` chạy hai lần không đổi;
  (6) `prOv1b`: ô có lịch thi lại giữ nguyên với hôm nay trước, trong và **sau** tuần thi lại (cả `sat` chưa điểm); ô không có lịch thi lại (bài ở đúng tuần "-") vẫn đổi như cũ; `kiem-truoc-ov1b` khớp; chạy hai lần không đổi.
- `npm run check` xanh MỘT lần cuối. Bấm thử MỘT lần (GVBM 9, GVW 10, GVCN 7, QL, Admin 22; 1440 tối + 375 sáng): Lịch Test 3 khối, dòng MT cũ, Điểm theo lớp (từ hồ sơ lớp),
  hồ sơ MT, Kế hoạch Test lớp thường. Ảnh đính PR.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)
```
Session CODE cho PR OV-11e (Lịch Test đếm phần của bạn · Điểm theo lớp · huỷ / khôi phục nguyên trạng · KCK theo lượt · OV-1e bền), repo Pizi147/pisa-tracking,
nhánh mới từ origin/main mới nhất. Không dùng Fable. Gọi skill karpathy-guidelines. Gõ /ponytail lite (có giao diện). Đọc CLAUDE.md, plan.md mục 1.2, 1.3b, 3, 5, rồi
docs/superpowers/plans/2026-10-14-pr-ov11e-lich-test-diem-lop-huy-kck.md (làm ĐỦ 12 mục Đầu ra) + đặc tả docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md mục 3
+ phụ lục docs/superpowers/specs/2026-10-14-ra-soat/{test,critique-A3-test-cong-viec,phan-tich,ho-so-hv}.md (bước tái hiện).
PORT/WEB_PORT 4324/5497; npm run check tối đa 3 máy cùng lúc. Task ngay trong session (executing-plans, KHÔNG subagent), test-driven-development (đỏ trước), systematic-debugging khi lỗi lạ.
Có migrate ĐỔI DỮ LIỆU bản chính (prOv11e thêm cột + điền; prOv1b sửa): file riêng, chạy lặp không đổi gì, phép kiểm đủ. Chạy song song với OV-11d, OV-11f: chỉ sửa file trong mục Ranh giới.
Chữ trên web ngắn (nhãn 1–3 từ, không câu giải thích dưới nút/ô). impeccable: clarify · harden · adapt trong phạm vi PR; /impeccable audit cuối.
Bấm thử MỘT lần theo mục Kiểm, ảnh đính PR. /ponytail-review trước khi mở PR. Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR.
Xong: một dòng mục 11 plan.md, thêm prOv11e vào danh sách migrate plan.md mục 5, CODE_MAP.md nếu thêm/xoá file. Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ≤ 15 dòng.
```
