# PR OV-11b — Quản trị · tài khoản (không tự khoá, có đường lui khi từ chối nhầm)

Nguồn: đặc tả `docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md` (mục 2) · bước tái hiện: phụ lục `2026-10-14-ra-soat/quan-tri.md` (QT-*),
`critique-A1-khung-tong-quan.md` (CA1-7). Đợt 1, **song song với OV-11a, OV-11c**. Rà: **sâu** (quyền) + `/security-review`.
Mockup: không cần — thêm chip / nút / dòng lỗi theo mẫu sẵn có của `AccountsAdmin`.

## Đầu ra
1. **[QT-2 · chặn] Không tự khoá Quản trị.** `server/src/platform/accounts.ts:329` `setRoles`: chặn 400 khi người sửa **gỡ vai Quản trị hệ thống của chính mình**, và khi sau lần lưu
   **không còn Quản trị nào khác** (dùng lại câu đếm `so_qt_khac` của `xoaTaiKhoan.ts:121`). Web: dòng vai Quản trị của chính mình khoá "Gỡ" + ô chọn vai, lý do một dòng dưới dòng.
2. **[QT-4 · chặn] Từ chối nhầm có đường lui.** Tài khoản `approval_state = 'declined'`: dòng ở Tài khoản có chip **"Không duyệt"** (lý do ở tooltip / dòng phụ) + nút **"Duyệt lại"**
   (mở đúng hộp Duyệt; máy chủ `approve` `accounts.ts:213` nhận cả `declined`). Lưu vai cho tài khoản declined → 400 "Chưa duyệt — bấm Duyệt lại" (không còn "Đã lưu" giả).
   Đăng ký lại cùng email đang declined: câu "Email này đã đăng ký và không được duyệt — liên hệ Quản trị." (`accounts.ts:139-141`).
3. **[QT-1] Vai thiếu chi nhánh không bị bỏ im lặng.** Vai khác `system_admin` / `cx` mà `branches` rỗng → 400 ở `createAccount`, `setRoles`, `approve` (`grantRole` :270);
   web lỗi dưới dòng vai "Chọn chi nhánh cho vai {vai}", không lưu. Nhật ký không ghi "toàn hệ thống" khi rỗng.
4. **[QT-3] Sửa không đổi vai thì không "đặt lại vai".** Web chỉ gọi `PUT /roles` khi vai đổi (`AccountsAdmin.tsx:429`, biến `vaiGoc` đã có); máy chủ so tập cũ / mới, giống nhau thì
   không đóng / chèn / ghi `user_roles_set`.
5. **[QT-5] Nhật ký nói đúng thao tác.** `shared/domain/nhatKy.ts`: thêm nhãn `programme_created` "Thêm chương trình", `programme_updated` "Sửa chương trình",
   `route_updated` "Sửa lộ trình FT", `user_info_set` "Sửa thông tin tài khoản"; môn PET / KET hiện "L+S" / "R+W" (tên môn), không mã `reading_writing`.
6. **[QT-6] Quyền cấp riêng có tên.** Menu Tài khoản (`web/src/modules/platform/Header.tsx:309`) và Hồ sơ cá nhân (`ProfilePage.tsx:145-155`): "Cấp riêng: {tên quyền} · {phạm vi}"
   (`PERMISSION_LABEL`, từ `server/src/permissions.ts:100-108` grant `granted`); không chữ "granted"; key React theo chỉ số; bỏ câu "Nhãn màu vàng là quyền cấp riêng".
7. **[QT-7] Chương trình chưa có lớp sửa được như lúc tạo** (thêm / bỏ Progress, đổi Số tuần ↔ Liên tục): `sysconfig.ts:159-160` khi `!coLop` dùng nhánh kiểm của `taoChuongTrinh`;
   web `CatalogAdmin.tsx:159,375` vẽ ô Progress. Có lớp → giữ khoá như nay ("Sửa sau khi lưu" 13/10).
8. **[QT-8] Chữ vai theo hiện tại.** `AccountsAdmin.tsx:68,198-200`, `CatalogAdmin` (Forbidden), `AdminPage.tsx:29`, `WelcomePage.tsx:339-341`: bỏ "Admin CN", "Admin chi nhánh",
   "Ba nhóm"; ghi ngắn theo vai thật (Quản trị · Quản lý · GV · Admin · TVV · CX; QL / QT nắm ≥ 2 vai đổi được góc nhìn).
9. **[QT-9]** 375: hàng lọc Kỹ năng ở Tài khoản xuống dòng, không cắt "S" (`AccountsAdmin.tsx:142-146`). (Nút ⋯ 44 px làm chung ở OV-11i.)
10. **[QT-10] Việc nhỏ (làm đủ):**
    a. Tạo tài khoản trùng email → lỗi dưới ô Email như Sửa thông tin (409), không chỉ toast · b. Toast "Đã duyệt {tên} · {vai} · {CN}" / "Đã từ chối {tên}" (`AccountsAdmin.tsx:114`) ·
    c. Hàng chờ duyệt: vai CX duyệt được không cần chi nhánh (`:315`) · d. Chip "Chưa có kỹ năng" chỉ đếm người dạy (`taiKhoan.ts` `phanLoaiTaiKhoan`); Hồ sơ cá nhân ô "Kỹ năng" chỉ hiện cho người dạy ·
    e. Xoá tài khoản TVV đang phụ trách n HV → cảnh báo "n học viên sẽ không còn TVV" (`xoaTaiKhoan.ts` canhBao); panel xoá tài khoản không vai bỏ "· toàn hệ thống" (`XoaTaiKhoanPanel.tsx:56`) ·
    f. Mã chương trình trùng mã cũ (vd "FOUND") → câu đúng lý do (`sysconfig.ts:133`) · g. Tab Quản trị lên URL (`?tab=`), Quay lại về đúng tab (`AdminPage.tsx:38`) ·
    h. Đổi mật khẩu (Hồ sơ): nút tắt khi chưa đủ độ dài tối thiểu, "Hai ô chưa khớp" dưới ô · i. Đăng ký: nhóm nút chi nhánh nhãn đúng (`WelcomePage.tsx:297` `as="div"`) ·
    j. Seed `user_skills` không còn mã `writing` / `tong_hop` (chỉ demo, `seed.ts:213`; chụp lại băm phép kiểm nếu đổi).
11. **[CA1-7]** Câu "Bản demo không gửi email…" ở Hồ sơ cá nhân chỉ hiện ở bản demo (`ProfilePage.tsx:177-180`, `LA_BAN_CHINH`).

## Ranh giới
- Vùng: `server/src/platform/{accounts,sysconfig,taiKhoan,xoaTaiKhoan}.ts`, `server/src/permissions.ts` (chỉ :100-108 nhãn grant), `shared/domain/{nhatKy,people}.ts`,
  web `admin/*` (`AccountsAdmin`, `CatalogAdmin`, `AdminPage`, `XoaTaiKhoanPanel`), `platform/{ProfilePage,WelcomePage}.tsx`, `platform/Header.tsx` (chỉ :300-315 chip vai), seed (mục 10j).
  Phép kiểm `server/src/tests/prOv11b.tests.ts`.
- KHÔNG đụng: `fasttrack/*`, `cham/*`, `normal/*` (OV-11a) · `worklist/*`, `duyet/*`, `congViec/*` (OV-11c) · phần còn lại của `Header.tsx` (thông báo — OV-11f).
- Luật không đổi: chỉ QT sửa vai / chương trình; xoá mềm như PR-XOA; lớp đang chạy giữ bản chụp chương trình. Không migrate.

## Kiểm
- `prOv11b.tests.ts` (đỏ trước): (1) QT tự gỡ vai QT → 400; QT cuối cùng đổi sang QL → 400; còn QT khác thì gỡ QT kia 200; (2) đăng ký → Không duyệt → `approve` 200 → đăng nhập được;
  `setRoles` cho declined → 400; (3) `createAccount` vai teacher không CN → 400, không tạo tài khoản; (4) sửa chỉ kỹ năng → không dòng `user_roles_set`, `user_roles` không đổi id;
  (5) chương trình 0 lớp thêm Progress → 200, có lớp → 400 như cũ; (6) `NHAN_NHAT_KY` có 4 khoá mới; (7) gọi thẳng bằng QL / GVCN / TVV → 403 như cũ.
- `npm run check` xanh MỘT lần cuối. Bấm thử MỘT lần (QT; 1440 tối + 375 sáng): Tài khoản (dòng mình, dòng Không duyệt → Duyệt lại, tạo thiếu CN, trùng email), Chương trình (sửa chương trình mới),
  Quyền & nhật ký, Hồ sơ cá nhân GV có quyền cấp riêng. Ảnh đính PR.

## Prompt (Opus 5.5 · High; B: Sonnet 5.5 · High)
```
Session CODE cho PR OV-11b (Quản trị · tài khoản), repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất. Không dùng Fable.
Gọi skill karpathy-guidelines. Gõ /ponytail lite (có giao diện). Đọc CLAUDE.md, plan.md mục 1.2, 1.3b, 3, rồi
docs/superpowers/plans/2026-10-14-pr-ov11b-quan-tri-tai-khoan.md (làm ĐỦ Đầu ra, kể cả 10a–j) + phụ lục docs/superpowers/specs/2026-10-14-ra-soat/quan-tri.md (bước tái hiện).
PORT/WEB_PORT 4321/5494; npm run check tối đa 3 máy cùng lúc. Task ngay trong session (executing-plans, KHÔNG subagent), test-driven-development (đỏ trước), systematic-debugging khi lỗi lạ.
Chạy song song với OV-11a, OV-11c: chỉ sửa file trong mục Ranh giới. Đổi quyền: chạy /security-review trước khi mở PR. Chữ trên web ngắn (nhãn 1–3 từ, không câu giải thích dưới nút/ô).
impeccable: clarify · harden · adapt trong phạm vi PR; /impeccable audit cuối. Bấm thử MỘT lần theo mục Kiểm, ảnh đính PR. /ponytail-review trước khi mở PR.
Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md nếu thêm/xoá file.
Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ≤ 15 dòng.
```
