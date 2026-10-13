# PR OV-11a — Vắng · thi bù · hộp nhập điểm (luồng vắng sau OV-1b khép kín)

Nguồn: đặc tả `docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md` (mục 2, 3 Q1–Q2) · bước tái hiện: phụ lục `2026-10-14-ra-soat/test.md`
(TE-*), `cong-viec.md` (CV-5), `critique-A3-test-cong-viec.md` (CA3-*). Đợt 1, **song song với OV-11b, OV-11c**. Rà: **sâu** (luồng chính nhập điểm).
Mockup: không cần — dùng mẫu sẵn có (ô Vắng hai dòng, hộp nhập điểm OV-4b, dòng phụ "vắng lần 1").

## Đầu ra (làm đủ; mỗi mục có phép kiểm hoặc bấm thử)
1. **[TE-1 · chặn] Bài thi bù không bị khoá "Đợt đã hoàn tất".** `server/src/fasttrack/hoanTat.ts:64-69`: `coDau` chỉ đúng khi dấu "-" thuộc **tuần đang xếp** của kỹ năng
   (`no_show_period_id = planned_period_id`) hoặc kỹ năng `absent` — cùng luật `dauTruCuaO` / `sameWeek`. Kỹ năng đã dời sang tuần khác = chưa xong → GV đúng kỹ năng nhập được
   (không chỉ QL), chip "Đã hoàn tất" dưới tên em không hiện khi còn bài thi bù chưa điểm. Ca demo: Lý Minh Châu MT2 S (vắng W1 SEP → W2 SEP).
2. **[TE-2 · chặn + TE-3] Ô ở tuần thi bù là ô thường.** Kỹ năng đang xếp ở tuần này (đã có lần vắng, `daChot` thuộc tuần cũ):
   - lưới tuần thi bù: ô hiện như ô chưa nhập (không "Vắng → W3 SEP"); lưới tuần gốc giữ "Vắng → W3 SEP" (OV-1d);
   - hộp (`web/src/modules/fasttrack/HopNhapDiem.tsx:147,182,340-347`): ô điểm + nút **Vắng** (= lần 2 → huỷ phần thi) + dòng phụ "vắng lần 1 · dời từ W2 SEP" + Bỏ vắng;
     gõ "-" luôn là lệnh, không bị nuốt, không đóng hộp như đã lưu;
   - sau "Khôi phục phần thi" ô không còn "-".
3. **[TE-5 · Q2] "Báo vắng" một luật với "-".** `server/src/fasttrack/absence.ts:948-981` `baoVang`: tuần thi đã hết → ghi **Không dự thi** (không dời, không tính lần vắng) như `saveScore`;
   hộp xác nhận nói đúng hậu quả; nhãn ⋯ "Báo vắng" → **"Vắng"** (CA3-12).
4. **[TE-6 · Q1] Lớp thường "-" sau tuần thi.** `server/src/normal/regular.ts:~800-875`: tuần mới = **tuần sau của max(tuần thi, tuần hiện tại)** (không dời vào tuần đã qua).
   Trong tuần thi giữ như cũ. Không đổi MT.
5. **[CV-5 · chặn] Chip kỹ năng không tự nhảy.** `web/src/modules/cham/MotKyNang.tsx:47-58` `useKyNangChon`: `kn` truyền vào chỉ đặt chip **lần đầu** (và khi người dùng đổi `?kn=`
   trên URL thật); `kn` của việc đổi do `/my-work` tải lại thì **giữ chip đang chọn**. Sửa trong `MotKyNang` — KHÔNG đụng `congViec/PanelViec.tsx` (OV-11c).
   Ca: Công việc GVCN › "Listening, Reading · MT2 · 3 HV" → chip L → lưu 3 em liền → cả 3 điểm vào Listening.
6. **[CA3-9] 375 = 1440.** `MotKyNang` (điện thoại) dùng cùng điều kiện `khacTuanFt` với `LuoiFT.tsx:132`: ô tuần khác ghi mã tuần, không "Nhập", không đếm vào tab "R 5/8".
7. **[CA3-1] Nút + thông báo nói đúng hậu quả.** Hộp: trong tuần thi nút "Vắng"; sau tuần thi / MT cũ nút **"Không dự thi"**. `web/src/modules/cham/thongBaoVang.ts`:
   "Đã ghi vắng R · {tên} · dời W4 SEP" / "… · huỷ phần thi" (lần 2) / "Đã ghi Không dự thi · R · {tên}". Sửa chú thích cũ ":13".
8. **[CA3-3] Ô đã huỷ phần thi một trạng thái.** `web/src/modules/cham/LuoiFT.tsx:53-54` `khacTuanFt` loại ô `cancelled` (không hiện mã tuần); hộp ô huỷ dòng đầu
   **"Đã huỷ phần thi · vắng 2 lần"** (không "Vắng lần 1"; `HopNhapDiem.tsx:252`), QL giữ Khôi phục; hồ sơ MT (`MockDetailPage.tsx`) một dòng trạng thái, bỏ "Đã dời do vắng 1 lần" khi đã huỷ.
   Kiểm số "lần" thật (`absence_move_count`) trên ca Kiều Thu Trang / Lý Thanh Tâm.
9. **[CA3-5] Không dự thi không còn "Chờ nhập điểm".** Hồ sơ MT: chip "Không dự thi" thay "▶ Chờ nhập điểm"; Ô MT Kế hoạch Test (`shared/domain/oMt.ts`) giữ kỹ năng "R · không dự thi";
   hộp một đợt dòng R "W2 SEP · Không dự thi" (cờ `khongDuThi` đã có ở `/ke-hoach-test/ft/:id`).
10. **[CA3-2] Ô điểm đọc được khi bỏ màu.** Ô đã chốt hiện **chữ** theo mẫu ô Vắng hai dòng: "Không / dự thi", "Đã huỷ"; một ký tự "—" duy nhất cho "không có gì để nhập"
    (`HopNhapDiem.tsx:61,76,107`; `DongDau` không cắt `max-w-[6rem]`); chip Ô MT "xong" thêm "✓" như lớp thường. Viết hoa thống nhất "Vắng".
11. **[CA3-6]** `web/src/modules/fasttrack/ScoreEntry.tsx:759` "Đang lưu: 16/25" → **"Đã lưu: 16/25"** (giá trị đã lưu ≠ đang gửi).
12. **[CA3-7]** Dấu ✓ đã lưu (màu `ok`) giữ tới khi lưới tải lại (bỏ hẹn 3 s, `LuoiFT.tsx:412,444`); mở hộp em kế cuộn ô lên giữa `main` (`HopNhapDiem.tsx:389` `block: 'center'`).
13. **[CA3-8]** Esc / đóng khi đã gõ: thay `window.confirm` (`HopNhapDiem.tsx:227,478` + hộp Nhận xét lớp thường) bằng dòng ngay chân hộp
    **"Bỏ điểm Listening · Kiều Thu Trang?"** + nút **Bỏ** · **Gõ tiếp** (không hộp thứ hai).
14. **[TE-12 phần]** Hộp Khôi phục phần thi: "Tuần thi mới *" (bỏ "(bắt buộc)" thừa) · hàng chỉ còn ô "Đã huỷ phần thi" ở tuần đang xem → ẩn khỏi lưới khối 2/3.

## Ranh giới
- Vùng: `server/src/fasttrack/{hoanTat,absence}.ts`, `server/src/normal/regular.ts` (nhánh "-"), `server/src/cham/canCham.ts` (chỉ phần dựng ô / `daChot` nếu cần cho mục 2),
  `shared/domain/{keHoachTest,oMt}.ts` (+ hàm thuần mới nếu cần), web `fasttrack/{HopNhapDiem,ScoreEntry,MockDetailPage,NhanXet}.tsx`, `cham/{LuoiFT,LuoiThuong,MotKyNang,thongBaoVang}.ts(x)`,
  `test/keHoach/*` (chỉ nhãn / hộp Vắng). Phép kiểm `server/src/tests/prOv11a.tests.ts` (gọi cuối `run.ts`).
- KHÔNG đụng: `worklist/*`, `congViec/*`, `duyet/*` (OV-11c) · `platform/*`, `admin/*` (OV-11b) · `test/lichTest/*`, `diemTheoLuot*` (OV-11e, đợt sau).
- Luật không đổi: lần 1 dời tuần sau, lần 2 huỷ; MT nhập bù / MT cũ = Không dự thi; T19 khung nhập điểm; T18 chấm chéo. Không migrate.

## Kiểm
- `prOv11a.tests.ts` (đỏ trước trên DB test): (1) vắng lần 1 → dời → Thứ Hai sau tuần thi bù, GV đúng kỹ năng `saveScore` **200** (trước: 403), `hoanTat` false khi còn bài thi bù;
  (2) tuần thi bù `noShow` → lần 2 → `cancelled`; ô tuần thi bù không mang `daChot` của tuần cũ (dữ liệu ô cho hộp); (3) `baoVang` tuần đã hết → `no_show_cu = 1`, không dời,
  `absence_move_count` không tăng; trong tuần → dời như cũ; (4) lớp thường "-" sau tuần thi → tuần mới = tuần sau tuần hiện tại (không < tuần này); trong tuần thi như cũ;
  (5) hàm thuần (nếu tách) cho chữ nút / thông báo vắng theo trạng thái (trong tuần · sau tuần · lần 2).
- `npm run check` xanh MỘT lần cuối. Bấm thử MỘT lần (1440 tối + 375 sáng; QL + GVBM 9 + GVCN 7): Lịch Test khối 2/3 ô thi bù (nhập điểm, Vắng lần 2), Kế hoạch Test ⋯ Vắng sau tuần thi,
  Công việc › Nhập điểm lưu 3 em liền (chip giữ), hồ sơ MT ô Không dự thi / đã huỷ, 375 MotKyNang. Ảnh đính PR.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)
```
Session CODE cho PR OV-11a (vắng · thi bù · hộp nhập điểm), repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất. Không dùng Fable.
Gọi skill karpathy-guidelines. Gõ /ponytail lite (có giao diện). Đọc CLAUDE.md, plan.md mục 1.2, 1.3b, 3, rồi
docs/superpowers/plans/2026-10-14-pr-ov11a-vang-thi-bu-hop-diem.md (làm ĐỦ 14 mục Đầu ra, không tự bớt) + đặc tả
docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md mục 3 + phụ lục docs/superpowers/specs/2026-10-14-ra-soat/{test,cong-viec,critique-A3-test-cong-viec}.md (bước tái hiện).
PORT/WEB_PORT 4320/5493; npm run check tối đa 3 máy cùng lúc. Task ngay trong session (executing-plans, KHÔNG subagent), test-driven-development (đỏ trước), systematic-debugging khi lỗi lạ.
Chạy song song với OV-11b, OV-11c: chỉ sửa file trong mục Ranh giới. Chữ trên web ngắn (nhãn 1–3 từ, không câu giải thích dưới nút/ô).
impeccable: clarify · harden · adapt trong phạm vi PR; /impeccable audit cuối. Bấm thử MỘT lần theo mục Kiểm, ảnh đính PR. /ponytail-review trước khi mở PR.
Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md nếu thêm/xoá file.
Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ≤ 15 dòng.
```
