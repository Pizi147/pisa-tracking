# PR OV-7b — Sửa sau khi lưu (2/2): Case · PA (kết quả PA, xem lại sau hỗ trợ, hoàn thành, xác nhận)

Nguồn: **chủ SP 13/10** (như OV-7a: "sau khi bấm Lưu vẫn vào sửa và lưu lại được"). Rà soát 13/10 — nhóm A mục 2–5. Chạy **sau OV-5a**
(cùng `cases/sosAuto.ts`, panel Công việc dùng `NganCase`). Không mockup mới. Rà: **sâu** (đảo hệ quả nhiều tầng). Luật chung: như OV-7a.

## Hiện trạng (planning đọc mã 13/10, session code kiểm lại)
- **Ghi kết quả PA** (`updateResult`, `cases/cases.ts:3068`): dòng `case_followups` **chỉ chèn**, không có đường sửa / xoá; chọn Kết thúc → PA `completed`
  (`:3415` "đã kết thúc — không cập nhật thêm được"). Một lần lưu kéo theo: `cycle_no + 1`, `action_due` mới; Điều chỉnh → dòng revision; Thay PA → PA mới,
  PA cũ `superseded`; Xin hỗ trợ QL → thẻ xin_y_kien; nhóm bổ trợ chép sang PA anh em (`chepKetQuaNhom`); bổ trợ miễn phí → Mini Test; Hành trình;
  `dongBoTrangThaiCase`. Lối lui duy nhất: QL "Xoá PA" (`:1284`, chặn PA quy chế / bổ trợ / Case xong).
- **Xem lại sau hỗ trợ** (`recordFollowUp :1455`): chỉ chèn.
- **Hoàn thành Case** (`closeCaseOutcome :146` / `setDisposition :1521`): "Mở lại Case" (`:281`) **chỉ QL**; PA đã đóng không về.
- **Xác nhận Case** (`sosAuto.ts:218`): nội dung sửa được qua Sửa Case; không có "bỏ xác nhận".
- Mẫu đảo hệ quả sẵn có: **Huỷ quyết định PA** (`cases.ts:1113` qua `yeuCau.ts:513`) — khôi phục từ `before_json` nhật ký, đổi khoá chống trùng.

## Đầu ra
1. **Sửa lần ghi kết quả PA gần nhất** (người đã ghi + QL; chỉ lần **mới nhất** của PA, khi PA chưa có lần ghi sau): mở lại đúng form Kết quả, điền sẵn, Lưu =
   **đảo hệ quả của lần cũ** (theo mẫu Huỷ quyết định PA: chu kỳ, hạn, revision, PA thay thế / `superseded`, thẻ xin ý kiến chưa ai trả lời, kết quả chép sang
   PA anh em, Mini Test chưa ghi, trạng thái Case) **rồi chạy hệ quả lần mới** — một giao dịch. Chỉ sửa chữ (nhận xét, số buổi, người dạy tuần này) mà không đổi
   lựa chọn kết quả → chỉ cập nhật dòng, không đảo gì. Đảo không được (vd PA thay thế đã có kết quả, thẻ đã được QL trả lời) → chặn kèm câu rõ + bước tiếp.
   PA "Kết thúc" sửa được theo luật này (bỏ chặn `:3415` cho lần mới nhất).
2. **Sửa "Xem lại sau hỗ trợ"** (lần mới nhất, người ghi + QL): sửa tại chỗ, nhật ký trước → sau.
3. **Hoàn thành Case → Mở lại** cho **người đã đóng** (GV) như QL, khi chưa có Case mới cùng khoá; PA bị đóng **cùng lần Hoàn thành** mở lại theo (lưu danh sách
   đóng trong nhật ký như OV-4a). Case hệ thống đóng: giữ luật cũ.
4. **Xác nhận Case → "Sửa xác nhận"**: đổi nguyên nhân / mô tả (đã có qua Sửa Case — chỉ đưa nút vào đúng chỗ trong `NganCase` sau khi xác nhận). Không làm
   "bỏ xác nhận" (PA quy chế đã chạy; sửa PA qua Sửa PA sẵn có).
5. Trong panel Công việc (OV-5a) và Ngăn Case: nút **"Sửa"** cạnh lần ghi gần nhất / Case đã hoàn thành, cùng vị trí, cùng chữ.

## Ranh giới
- Chạy sau OV-5a. Vùng: `cases/{cases,sosAuto,systemClose}.ts`, `web/src/modules/students/NganCase.tsx`, `web/src/modules/cases/*`.
- KHÔNG đổi: luật PA quy chế, hạn, Case SOS tự tạo (OV-1c), bổ trợ Final (CT2). Chung tất yếu: `routes/index.ts`, `tests/run.ts`, `tocDoDuong.ts`, `plan.md`.

## Kiểm
- `server/src/tests/prOv7b.tests.ts` (đỏ trước): mỗi lựa chọn kết quả (Tiếp tục · Điều chỉnh · Thay PA · Xin hỗ trợ QL · Kết thúc · nhóm bổ trợ · bổ trợ miễn phí)
  ghi → sửa sang lựa chọn khác → **trạng thái = như chỉ ghi lần mới** (so ảnh chụp DB PA / Case / thẻ / Hành trình); sửa chữ không đảo gì; chặn đúng câu khi
  không đảo được; GV khác 403. Hoàn thành → GV đã đóng Mở lại → PA cùng lần về. Trần câu SQL đường sửa trong `tocDoDuong.ts`.
- `npm run check` xanh. Bấm thử một lần (GVBM 1440 tối: Kết quả PA Kết thúc → Sửa → Tiếp tục; 375 sáng: Mở lại Case). Ảnh `thiet-ke/anh/pr-ov7b/`.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)

```
Session CODE cho PR OV-7b (Sửa sau khi lưu 2/2: sửa lần ghi kết quả PA gần nhất, Xem lại sau hỗ trợ, GV mở lại Case mình đã hoàn thành, nút Sửa xác nhận),
repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất (đã có OV-5a). Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b, 3 (dòng 13/10 "Sửa sau khi lưu") và 9.0, docs/superpowers/plans/2026-10-13-pr-ov7a-sua-sau-luu.md (mục Luật chung), rồi
docs/superpowers/plans/2026-10-13-pr-ov7b-sua-case-pa.md (làm ĐỦ Đầu ra). Không mockup mới; nút theo mẫu sẵn có.
PORT/WEB_PORT 4210/5383; `npm run check` tối đa 3 máy cùng lúc. Tuân thủ "Ranh giới".
test-driven-development (prOv7b.tests.ts đỏ trước); systematic-debugging khi lỗi lạ. Sửa = đảo hệ quả cũ rồi chạy hệ quả mới trong MỘT giao dịch.
impeccable (skill có sẵn trong repo): `clarify`, `harden` trong phạm vi PR, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần (GVBM 1440 tối + 375 sáng), ảnh vào thiet-ke/anh/pr-ov7b/ và mô tả PR. Không deploy, không chạm Turso/Netlify.
Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP.
Báo cáo tiếng Việt, ngắn.
```
