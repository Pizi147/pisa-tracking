# PR OV-7a — Sửa sau khi lưu (1/2): Bàn giao · Ý thức · Phối hợp / Báo PH · Mini Test · rút đề xuất đang chờ

Nguồn: **chủ SP 13/10**: "việc đã làm thì có bước được sửa — sau khi bấm Lưu vẫn vào sửa và lưu lại được cho hầu hết các chỗ; GV bấm nhầm thì sao.
Ví dụ bàn giao: mới lưu đã kết thúc luôn." Rà soát 13/10 (planning, đọc mã) — nhóm A mục 1, 6 (phía gửi), 7–13, 15. Phần Case / PA = **OV-7b**.
Không mockup mới: thêm nút "Sửa" / "Rút" theo mẫu sẵn có (plan.md 1.3b). Song song được với **OV-5a**, **OV-5b**. Rà: **sâu** (đảo hệ quả).

## Luật chung (áp mọi mục dưới)
- **Ai lưu được thì sửa được** (cùng quyền như lúc lưu) + QL / Quản trị; **không thêm bước duyệt, không hỏi lại** (chỉ xác nhận khi hậu quả lớn — nêu đúng đối tượng).
- Sửa = mở **đúng form cũ, điền sẵn**, Lưu lại. Không giới hạn số lần; giới hạn thời gian chỉ khi hệ quả đã chạy không đảo được (ghi rõ từng mục).
- Mỗi lần sửa ghi nhật ký (trước → sau) như `Sửa Case` / `Sửa vi phạm`; mốc / thông báo có khoá chống trùng thì **đổi khoá** theo mẫu Mở lại Case
  (`cases/cases.ts:281`, hậu tố `:mo-lai:<ts>`) để lần lưu lại ghi được — không gửi chuông trùng nếu nội dung không đổi người nhận.
- Lưu lại không làm mất thứ người khác đã làm sau đó (vd phiếu bàn giao môn của GVBM khác).

## Đầu ra
1. **Bàn giao** (`classes/banGiao.ts:249, 271`; web `classes/BanGiaoPanel.tsx:107-111, 197`): sau "Xác nhận bàn giao" GVCN (và GVBM phần môn mình) vẫn **Sửa** được
   câu từng môn + nhận xét chung **tới ngày thi hành lệnh** (sau ngày thi hành: chỉ QL sửa). Lưu lại = chụp lại `tu_dien`, cập nhật Hành trình (đổi khoá
   `ban_giao:lenhId`); việc / thẻ "báo lên bàn giao" không mở lại. Ô không còn readOnly sau xác nhận — nút "Sửa" mở lại ô.
2. **Ý thức** (`yThuc/xuLy.ts`):
   - Lần xử lý đã "Xác nhận xử lý" / "Đã thực hiện": GVCN **sửa được** ghi chú, ngày thực hiện, người thực hiện, vi phạm của lần đó (`quyenSuaXuLy :466` bỏ điều kiện
     `status ≠ done` cho người đã ghi; QL như nay). Thêm đường sửa cho ghi chú / ngày / người (hiện chưa có ai sửa được). Bậc / thang tính lại như Sửa vi phạm.
   - "Đã thực hiện" bấm nhầm → **"Chưa thực hiện"** (về trạng thái trước).
   - Khai bậc (`:187, :201`): GVCN sửa được bậc đã khai của em mình; QL sửa được kể cả sau khi đã có lần xử lý trên web (thang tính lại từ bậc mới).
   - "Ghi nhận" vi phạm (`:97-110`): **Bỏ ghi nhận** (xoá `ghi_nhan_luc`).
   - Đề xuất "Gửi QL" (`:439`) còn chờ: GVCN **sửa ghi chú / bằng chứng** hoặc **Rút**.
3. **Phối hợp SOS / Báo PH** (`yThuc/phoiHop.ts:459, 489`): việc "Đã xong" sửa được ngày, ghi chú, người; **"Đưa lại Cần xử lý"** (bỏ trạng thái xong); việc đã "Bỏ"
   → **Khôi phục**. Báo PH: lưu lại thì chụp lại `noi_dung_luc_bao`; số liệu Phối hợp đếm lại từ trạng thái hiện tại (không cộng dồn).
4. **Mini Test** (`normal/cuoiKhoa.ts:676`): người đã ghi (người dạy / GVCN / người giữ việc) **sửa được** % và ngày như QL. Sửa từ < 70 % → ≥ 70 % hay ngược lại:
   máy tính lại đúng như lần ghi đầu (PA bổ trợ đã đóng `het_moc` giữ nguyên — không mở lại PA; Case theo luật Mini Test như nay).
5. **Rút / sửa đề xuất đang chờ** (phía người gửi): Đề xuất sửa (`duyet/deXuatSua.ts:72`), Đề xuất chuyển lớp (`classes/lenhChuyen.ts:805`), "Không cần theo dõi"
   (`cases/sosAuto.ts:427`): khi QL chưa trả lời → **Sửa** (nội dung) hoặc **Rút** (thẻ Chờ duyệt đóng, không chuông). QL đã trả lời → như nay.
6. **Trả lời "Xin ý kiến"** của QL (`duyet/yeuCau.ts:435`): QL **sửa câu trả lời** (người hỏi thấy bản mới, một chuông "QL đã sửa câu trả lời").

## Giữ khoá (không làm, ghi lý do trong PR)
Báo cáo đơn vị sau cửa sổ tuần (thiết kế) · lệnh chuyển lớp đã thi hành (sửa = quyết định mới) · Case hệ thống đóng · nhật ký append-only · chuông đã gửi ·
QL trả lời dời lịch vắng (lịch đã dời — QL dời lại tay được).

## Ranh giới
- Vùng: `classes/banGiao.ts`, `BanGiaoPanel.tsx`, `yThuc/*`, `web/src/modules/yThuc/*`, `normal/cuoiKhoa.ts` (Mini Test), `duyet/*`, `classes/lenhChuyen.ts`
  (chỉ rút đề xuất), `cases/sosAuto.ts` (**chỉ** rút "Không cần theo dõi" — hàm khác với xác nhận nhóm của OV-5a), web chỗ hiện nút.
- KHÔNG sửa: `cases/cases.ts` (OV-7b), `congViec/*`, `worklist/*` (OV-5a), `ui/ThanhTruocSau.tsx` + đầu trang hồ sơ (OV-5b). `BanGiaoPanel.tsx` OV-5a nhúng
  vào panel Công việc — chỉ đổi bên trong, giữ props → gộp main trước khi mở PR.
- Chung tất yếu: `routes/index.ts`, `tests/run.ts`, `tocDoDuong.ts`, `CODE_MAP.md`, `plan.md`.

## Kiểm
- `server/src/tests/prOv7a.tests.ts` (đỏ trước): mỗi mục 1–6 một nhóm — lưu → sửa → lưu lại đúng giá trị mới, nhật ký trước → sau, quyền (người lưu + QL được,
  người khác 403), giới hạn (bàn giao sau ngày thi hành: GVCN 400 câu rõ, QL được), hệ quả đếm lại đúng (bậc Ý thức, số Phối hợp, Mini Test), không chuông trùng.
- Phép kiểm cũ khoá-sau-lưu đổi đúng ý (ghi tên + lý do trong PR), KHÔNG xoá cho xanh.
- `npm run check` xanh. Bấm thử một lần (GVCN 1440 tối: bàn giao xác nhận → Sửa → lưu; Ý thức Đã thực hiện → Chưa thực hiện; 375 sáng: Phối hợp Đưa lại Cần xử lý).
  Ảnh `thiet-ke/anh/pr-ov7a/`.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)

```
Session CODE cho PR OV-7a (Sửa sau khi lưu 1/2: Bàn giao · Ý thức · Phối hợp / Báo PH · Mini Test · rút đề xuất đang chờ · sửa trả lời Xin ý kiến),
repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất. Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b, 3 (dòng 13/10 "Sửa sau khi lưu") và 9.0, rồi docs/superpowers/plans/2026-10-13-pr-ov7a-sua-sau-luu.md (làm ĐỦ Đầu ra, theo Luật chung).
Không mockup mới: nút "Sửa" / "Rút" / "Chưa thực hiện" / "Đưa lại Cần xử lý" theo mẫu nút sẵn có; chữ ngắn.
PR này chạy SONG SONG với OV-5a và OV-5b: tuân thủ mục "Ranh giới"; PORT/WEB_PORT 4200/5373; `npm run check` tối đa 3 máy cùng lúc.
test-driven-development (prOv7a.tests.ts đỏ trước); systematic-debugging khi lỗi lạ. Sửa phải đảo đúng hệ quả cũ, không mất dữ liệu người khác.
impeccable (skill có sẵn trong repo): `clarify`, `harden`, `adapt` trong phạm vi PR, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần (GVCN 1440 tối + 375 sáng), ảnh vào thiet-ke/anh/pr-ov7a/ và mô tả PR. Không deploy, không chạm Turso/Netlify.
Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP.
Báo cáo tiếng Việt, ngắn.
```
