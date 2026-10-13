# PR OV-8a — Bước tiếp sau khi có kết quả thi thật (QL chọn: Kết thúc · Học tiếp lộ trình mới · Học lại)

Nguồn: **chủ SP 13/10**: "cập nhật kết quả thi thật xong không có bước tiếp — thi xong là kết thúc lộ trình đó, có phương án học lại hay không, chuyển sang lớp
nào; đạt rồi thì thôi hẳn hoặc sang lộ trình tiếp (LT1 → LT2)". Trả lời 13/10: **chỉ QL chọn bước tiếp**. Không mockup mới (mục mới trong hộp sẵn có +
dùng lại panel Học lại / Kết thúc học). Song song được với **OV-7b**, **OV-8b**. Rà: **sâu** (lộ trình, lưu trữ).

## Hiện trạng (planning đọc mã 13/10, session code kiểm lại)
- Kết quả thi thật: `server/src/loTrinh/thiThat.ts` (`datKetQuaThiThat :45`): lưu L R W S / Không thi, máy so Target (`ketQuaThiThat`), làm mới bản chụp lộ trình,
  em "Kết thúc học FT chờ kết quả" → **tự vào Lưu trữ** (`tuLuuTruKhiHetCho :99`). **Không có bước tiếp** — không việc, không gợi ý.
- Đã có sẵn để dùng lại: **Học lại** (về lớp cũ / sang lớp mới, mở lộ trình mới — PR-LUI-b, `students/students.ts:472` + panel), **Kết thúc học** + Hoàn tác
  (`:543`), **Bỏ lưu trữ**, Chuyển lớp (PR-CL), việc QL trong Công việc (`worklist/mywork.ts`, panel tại chỗ OV-5a).

## Đầu ra
1. **Mục "Bước tiếp"** ngay dưới kết quả thi thật (hồ sơ HV › Hành trình / ngăn Tổng kết, chỗ đang nhập kết quả), **chỉ QL / Quản trị** thấy nút:
   - **Kết thúc** — lộ trình đóng (như nay), em Kết thúc học (nếu đang học) → **Lưu trữ**. Có Hoàn tác như Kết thúc học.
   - **Học tiếp lộ trình mới** (vd LT1 → LT2, FT → RF, lên lớp khác) — mở **panel Học lại sẵn có** chế độ "sang lớp mới", chọn lớp + tuần bắt đầu; em đang Lưu trữ
     thì tự Bỏ lưu trữ. Lộ trình cũ giữ bản chụp + kết quả thi.
   - **Học lại** — panel Học lại sẵn có (về lớp cũ / lớp khác cùng trình độ).
   Máy **gợi ý sẵn** (chỉ chữ, QL vẫn chọn): Đạt Target → "Kết thúc"; chưa đạt / Không thi → "Học lại". Đã chọn → mục hiện "Đã chọn: … · {ngày} · {QL}" + **Sửa**
   (luật OV-7: đổi lựa chọn = Hoàn tác lựa chọn cũ rồi làm cái mới, khi chưa có điểm / lịch mới phát sinh ở lớp mới; vướng thì nói rõ bước tiếp).
2. **Không tự Lưu trữ ngay khi nhập kết quả nữa**: em chờ kết quả → có kết quả → **chờ QL chọn bước tiếp**; Lưu trữ chỉ khi QL chọn "Kết thúc".
3. **Việc QL** "Chọn bước tiếp sau thi · {em}" (nhóm Vận hành, hạn = ngày nhập kết quả + 7 ngày, đỏ không chặn) — mở thẳng mục Bước tiếp trong **panel Công việc
   tại chỗ** (OV-5a) hoặc hồ sơ HV. Chọn xong việc tự hết. Nhiều em cùng lớp → dòng gộp theo lớp (`gopViecTheoLop`) như việc khác.
4. Hành trình ghi một mốc "Sau thi: {lựa chọn}" (đổi lựa chọn → mốc mới, khoá chống trùng theo mẫu Mở lại Case).

## Ranh giới
- Vùng: `loTrinh/thiThat.ts` (trừ hàm quyền `coTheNhapThiThat` — của OV-8b), `loTrinh/*` liên quan, `students/students.ts` (gọi Học lại / Kết thúc học, không đổi luật
  của chúng), `worklist/mywork.ts` (một nhóm việc mới), web ngăn Tổng kết / Hành trình + panel Học lại (nhận chế độ mở sẵn).
- KHÔNG sửa: `cases/*`, `NganCase` (OV-7b) · quyền TVV, `seed/data.ts`, `students/StudentManagePanel.tsx` phần quyền (OV-8b). Không đổi luật Học lại / Chuyển lớp / KQĐR.
- Chung tất yếu: `routes/index.ts`, `tests/run.ts`, `tocDoDuong.ts`, `CODE_MAP.md`, `plan.md` → gộp main trước khi mở PR.

## Kiểm
- `server/src/tests/prOv8a.tests.ts` (đỏ trước): nhập kết quả → em **không** tự Lưu trữ, có việc QL (hạn +7); QL Kết thúc → lộ trình đóng + Lưu trữ + việc hết; QL Học tiếp
  LT2 → lộ trình mới ở lớp đã chọn, em hết Lưu trữ, bản chụp lộ trình cũ còn; Học lại → như panel Học lại; đổi lựa chọn (Kết thúc → Học tiếp) đúng trạng thái như chỉ
  chọn lần sau; GVCN / TVV gọi API chọn bước tiếp → 403; gợi ý Đạt / chưa đạt đúng.
- Phép kiểm cũ "tự Lưu trữ khi có kết quả" (PR-TK, `prTk`) đổi đúng ý — ghi lý do trong PR, KHÔNG xoá cho xanh.
- `npm run check` xanh. Bấm thử một lần (QL 1440 tối: nhập kết quả → Bước tiếp → Học tiếp LT2; 375 sáng: việc trong Công việc). Ảnh `thiet-ke/anh/pr-ov8a/`.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)

```
Session CODE cho PR OV-8a (Bước tiếp sau khi có kết quả thi thật: QL chọn Kết thúc · Học tiếp lộ trình mới · Học lại; việc QL nhắc), repo Pizi147/pisa-tracking,
nhánh mới từ origin/main mới nhất. Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b, 3 (dòng 13/10 "Bước tiếp sau thi", "Sửa sau khi lưu") và 9.0, rồi docs/superpowers/plans/2026-10-13-pr-ov8a-buoc-tiep-sau-thi.md
(làm ĐỦ Đầu ra). Không mockup mới: mục "Bước tiếp" theo mẫu khối sẵn có, dùng lại panel Học lại / Kết thúc học.
PR này chạy SONG SONG với OV-7b và OV-8b: tuân thủ mục "Ranh giới"; PORT/WEB_PORT 4220/5393; `npm run check` tối đa 3 máy cùng lúc.
test-driven-development (prOv8a.tests.ts đỏ trước). Mỗi lựa chọn là MỘT giao dịch; đổi lựa chọn đảo đúng lựa chọn cũ.
impeccable (skill có sẵn trong repo): `clarify`, `harden`, `adapt` trong phạm vi PR, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần (QL 1440 tối + 375 sáng), ảnh vào thiet-ke/anh/pr-ov8a/ và mô tả PR. Không deploy, không chạm Turso/Netlify.
Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP.
Báo cáo tiếng Việt, ngắn.
```

## Tự quyết (planning, báo chủ SP)
- Không tự Lưu trữ khi có kết quả nữa — Lưu trữ khi QL chọn "Kết thúc" (để còn đường Học tiếp). Việc QL hạn 7 ngày.
- "Học tiếp lộ trình mới" và "Học lại" dùng chung panel Học lại sẵn có (khác nhau ở lớp đích) — không dựng màn mới.
