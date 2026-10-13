> Phụ lục rà soát 13–14/10 (báo cáo agent, planning đã đối chiếu các mục chặn). Đường ảnh `$SP/anh/...` chỉ có trên máy planning — tái hiện theo bước ghi trong mục.

# Rà khu QUẢN TRỊ + tài khoản + đường lui chung (QT) — agent N=7

## Đã đi
| Trang | Vai | Thao tác đã thử |
|---|---|---|
| `/quan-tri` › Tài khoản | QT · 1440 tối + 375 sáng | lọc, + Tạo tài khoản (trống → lỗi dưới ô; 2 vai QL+GV MB; vai không chi nhánh), Sửa (chỉ kỹ năng), ⋯ Sửa thông tin (email trùng 409 → lỗi dưới ô ✓), Xoá hẳn (TK mới) / xoá mềm (TVV có HV) + lọc Đã xoá, tự gỡ vai QT (API) |
| `/quan-tri` › Đăng ký chờ duyệt | QT | Duyệt (vai TVV · CP, kỹ năng đi theo ✓), Không duyệt + lý do, thử duyệt lại / cấp vai cho TK bị từ chối |
| `/quan-tri` › Chương trình | QT · 1440 + 375 | + Chương trình TOEIC (12 tuần, P6/F12, L·R, 60 %) và MOV (liên tục mỗi 4 tuần, L+S·R+W); lỗi mã FOU/FOUND/PREFOU/FT; sửa TOEIC (P5/F10), MOV (mỗi 3), FT · LT1 (MT1 tuần 5); ngừng dùng KET; mã ABC không Progress |
| Tạo lớp / Tạo nhiều lớp theo chương trình mới | QL MB | + Lớp mới MB TOEIC 1, MB MOV 1 (UI) → thêm 2 HV/lớp (API intake) → lượt: TOEIC Progress W4 OCT, Final W1 DEC; MOV Checkpoint 1 W2 OCT ✓ đúng; sau khi sửa: lớp cũ giữ bản chụp ✓; `/classes/bulk` MB TOEIC 2 (5/10), MB MOV 2 (mỗi 3) ✓; MB FT 901 lịch MT [5,12,16], MB FT 101 giữ [6,12,16] ✓; KET ngừng dùng → 400 rõ câu ✓ |
| `/quan-tri` › Quyền & nhật ký | QT · 1440 + 375 | Sửa quyền (bật 1 ô Admin) → xác nhận "ảnh hưởng 1 tài khoản" → Lưu → nhật ký ✓; đọc 40 dòng nhật ký |
| `/quan-tri` URL thẳng + 22 API quản trị | QL, QLCP, GVCN, GVBM, ADMIN, TVV, CX, chưa đăng nhập | mọi vai: `/quan-tri` → về `/` (không trắng trang); mọi GET/POST/PUT/PATCH quản trị → 403 (chưa đăng nhập 401) ✓. QL không có gì ở Quản trị (đúng ma trận đặc tả mục 2: Chương trình chỉ QT) |
| Góc nhìn (OV-2a) | TK mới QL+GV MB (25), QT+GV MB (26), QL+TVV CP (27); QL một vai | menu Góc nhìn, dải "Góc nhìn: … · Về …"; đổi GV → nav thu hẹp, `/tong-quan/chi-nhanh` 403; QT ở góc GV: `/quan-tri` về `/`, API quản trị 403 ✓; TVV → "Học viên của tôi", API Test/Công việc 403 ✓; đổi sang vai không nắm / QL một vai → 403 rõ câu ✓; Về vai gốc ✓; 375 dải ✓ |
| `/ho-so-ca-nhan` | QT, QL, GVCN, ADMIN, TVV(29), CX · 1440 + 375 | sửa tên rỗng / email phụ sai / lưu đúng; đổi mật khẩu (không khớp, sai mật khẩu cũ); hiển thị quyền cấp riêng |
| Màn đăng nhập / đăng ký / Vào nhanh | chưa đăng nhập · 1440 + 375 sáng | đăng ký (email sai đuôi, thiếu chi nhánh, đủ) → "Đã gửi đăng ký"; đăng nhập khi chờ duyệt / bị từ chối / sai mật khẩu / đã duyệt; đăng ký trùng email; Vào nhanh không lộ TK chờ duyệt ✓ |
| Không có trong trang | — | không có Khoá / Mở tài khoản (chỉ Xoá mềm = khoá hẳn, không khôi phục) · không có quản lý chi nhánh (chỉ danh sách Đơn vị báo cáo, chỉ đọc) |

Tài khoản thử tạo trong DB a7: 25 Thử Hai Vai (QL+GV MB), 26 Thử QT Kiêm GV, 27 Thử QL Kiêm TVV (CP), 29 Giáo Viên Đăng Ký (TVV CP, từ đăng ký), 30 Người Bị Từ Chối, 31 Người Còn Chờ. Mật khẩu thử sinh ngẫu nhiên, không ghi lại (đăng nhập demo bằng userId).

## Phát hiện

### QT-1 · lỗi · Tạo / sửa tài khoản: vai không chọn chi nhánh bị bỏ im lặng — báo "Đã tạo tài khoản" mà người đó không có vai nào
- Trang · vai: `/quan-tri` › Tài khoản › + Tạo tài khoản (và Sửa) · QT
- Tái hiện: + Tạo tài khoản → điền họ tên, email `thu.khongcn.pisa@gmail.com`, mật khẩu → giữ dòng vai "Giáo viên" mặc định, KHÔNG bấm chi nhánh nào → Lưu.
- Thấy: toast "Đã tạo tài khoản"; tài khoản id 28 có `roles: []` (chip "Chưa có vai trò 1"); nhật ký `user_created` ghi `teacher:toàn hệ thống` — sai sự thật. Người này đăng nhập được nhưng không thấy gì.
  Sửa tài khoản cũng vậy: bỏ hết chi nhánh của một dòng vai rồi Lưu → vai đó mất, không báo.
- Đúng ra: dòng vai (trừ Quản trị hệ thống và CX — hai vai "toàn hệ thống") chưa chọn chi nhánh → lỗi dưới ô "Chọn chi nhánh cho vai Giáo viên", không lưu (CLAUDE.md: không báo xong khi chưa lưu đúng; kiểm dữ liệu nhập).
- Nguyên nhân: `server/src/platform/accounts.ts:270` (`grantRole` lặp 0 chi nhánh → không chèn gì, không ném lỗi); `createAccount` :306 chỉ kiểm `roles.length`; nhật ký :322 in "toàn hệ thống" khi `branches` rỗng. Web `AccountsAdmin.tsx:418` chỉ kiểm có ≥ 1 dòng vai.
- Đề xuất: máy chủ ném 400 khi vai khác `system_admin`/`cx` mà `branches` rỗng (cả `createAccount`, `setRoles`, `approve`); web thêm lỗi dưới dòng vai. Không cần mockup.
- Ảnh: $SP/anh/quan-tri/tk-khong-vai-sau-tao.png

### QT-2 · chặn · Quản trị tự gỡ vai "Quản trị hệ thống" của chính mình được — kể cả khi là Quản trị cuối cùng → khoá cả hệ thống, không đường lui
- Trang · vai: `/quan-tri` › Tài khoản › dòng của chính mình › Sửa › "Gỡ" dòng vai Quản trị hệ thống (hoặc đổi sang Quản lý) › Lưu · QT
- Tái hiện (API cùng đường nút Lưu): QT id 1 → `PUT /api/admin/accounts/1/roles {roles:[{role:'manager',branches:['MB']}]}`.
- Thấy: 200, ngay sau đó `/demo/session` → `nav.admin=false`, `/api/admin/accounts` → 403. Không hộp xác nhận, không chặn. Demo chỉ có MỘT Quản trị (id 1) → nếu làm vậy
  thì không còn ai vào Quản trị (tôi khôi phục được chỉ vì đã tạo thêm tài khoản QT id 26 để thử).
- Đúng ra: như Xoá tài khoản (đã chặn "tự xoá mình" + "Quản trị cuối cùng", `xoaTaiKhoan.ts:132`) và như ma trận quyền (khoá `admin.config` của vai QT, `sysconfig.ts:303`):
  chặn gỡ vai QT của chính mình, hoặc ít nhất chặn khi không còn Quản trị nào khác; nói lý do dưới dòng vai.
- Nguyên nhân: `server/src/platform/accounts.ts:329-349` (`setRoles`) không kiểm `userId === p.userId` / số QT còn lại.
- Đề xuất: thêm một câu kiểm ở `setRoles` (cùng câu đếm `so_qt_khac` của `xoaTaiKhoan.ts:121`); web khoá nút "Gỡ" + ô chọn vai trên dòng QT của chính mình. Không cần mockup.
- Ảnh: — (tái hiện bằng API trong phiên QT; kết quả 200 → 403 ở trên)

### QT-3 · gợi ý · Sửa tài khoản chỉ đổi kỹ năng / mật khẩu vẫn "đặt lại vai": đóng mọi dòng vai rồi chèn dòng mới + một dòng nhật ký "user_roles_set"
- Trang · vai: `/quan-tri` › Tài khoản › Sửa (tài khoản "Thử Hai Vai", QL MB + GV MB) › chỉ bấm kỹ năng L › Lưu · QT
- Thấy: `user_roles` của người đó từ 2 dòng active (id 27, 28) → 27, 28 `ended` + 33, 34 `active` (cùng vai, cùng chi nhánh); nhật ký thêm "user_roles_set" dù vai không đổi.
  Mỗi lần đặt lại mật khẩu / sửa kỹ năng đều lặp lại → "Nhật ký thay đổi gần nhất" (40 dòng) đầy dòng đổi vai giả.
- Nguyên nhân: web `AccountsAdmin.tsx:429` luôn gọi `PUT /roles`; máy chủ `accounts.ts:340` đóng hết rồi chèn lại, ghi nhật ký vô điều kiện.
- Đề xuất: web chỉ gửi `/roles` khi `khoaVai(grants) !== vaiGoc` (biến đã có); hoặc máy chủ so tập cũ / mới, không đổi thì không ghi. Không cần mockup.

### QT-4 · chặn · "Không duyệt" không có đường lui: tài khoản bị từ chối nằm trong danh sách như tài khoản thường, cấp vai báo lưu được nhưng người đó vẫn không vào được
- Trang · vai: `/quan-tri` › Tài khoản › Đăng ký chờ duyệt · QT; màn đăng nhập · người đăng ký
- Tái hiện: (1) Màn đăng nhập › Giáo viên đăng ký: "Người Bị Từ Chối", `gv.tuchoi.pisa@gmail.com`, MB → Gửi. (2) QT › Không duyệt › lý do "Chưa ký hợp đồng" › Gửi từ chối.
  (3) Tài khoản › tìm "Từ Chối": dòng hiện như mọi tài khoản ("chưa có vai trò", nút Sửa, ⋯) — không có chữ nào nói đã từ chối. (4) Sửa › cấp Giáo viên · MB › Lưu → 200 "Đã lưu tài khoản".
  (5) Người đó đăng nhập → 403 "Đăng ký không được duyệt: Chưa ký hợp đồng". `POST /admin/accounts/30/approve` → 404 "Không tìm thấy đăng ký nào đang chờ duyệt". (6) Đăng ký lại cùng email → 400 "Email này đã có tài khoản. Đăng nhập, hoặc nhờ Quản trị hệ thống đặt lại mật khẩu." (đặt lại mật khẩu cũng không giúp gì).
- Thấy: từ chối nhầm thì đường duy nhất là ⋯ › Xoá tài khoản (xoá hẳn, vì chưa có dấu vết) rồi bảo người đó đăng ký lại. Cấp vai cho tài khoản bị từ chối báo thành công mà không có tác dụng (CLAUDE.md: "không báo xong khi chưa…", "bị chặn thì nói lý do + bước tiếp").
- Đúng ra: một đường duyệt lại (vd dòng tài khoản bị từ chối có chip "Không duyệt · lý do" + nút "Duyệt lại" dùng đúng hộp Duyệt), hoặc lưu vai cho tài khoản `declined` thì chuyển `approval_state = 'approved'`. Câu đăng ký lại nên nói "Email này đã đăng ký và không được duyệt — liên hệ Quản trị".
- Nguyên nhân: `server/src/platform/accounts.ts:213` (`approve` chỉ nhận `pending`), :567 (`listAccounts` lấy cả `declined`, web không hiện `approvalState` — `AccountsAdmin.tsx:228-276`), `auth.ts:64` (phiên chỉ cho `approved`), `accounts.ts:139-141` (câu đăng ký trùng).
- Đề xuất: thêm "Duyệt lại" (máy chủ: `approve` nhận cả `declined`) + chip trạng thái ở dòng. Thêm chip / nút theo mẫu có sẵn → không cần mockup.
- Ảnh: $SP/anh/quan-tri/tk-bi-tu-choi-trong-ds.png

### QT-5 · lỗi · Nhật ký quản trị: sửa / thêm chương trình, sửa lộ trình FT, sửa thông tin tài khoản đều hiện "Thao tác hệ thống"; nhãn môn lẫn mã tiếng Anh
- Trang · vai: `/quan-tri` › Quyền & nhật ký › "Nhật ký thay đổi gần nhất" · QT
- Tái hiện: Chương trình › + Chương trình (TOEIC, MOV) › Lưu; Sửa TOEIC, MOV, FT · LT1 › Lưu; Quyền & nhật ký.
- Thấy: "Thao tác hệ thống · TOEIC", "Thao tác hệ thống · LT1", "Thao tác hệ thống · KET" (ngừng dùng KET) — không biết là thêm, sửa hay ngừng. Cùng danh sách: "Sửa điểm lớp thường · PET · reading_writing" (mã môn thô).
- Đúng ra: "Thêm chương trình · TOEIC", "Sửa chương trình · MOV", "Sửa lộ trình FT · LT1", "Sửa thông tin tài khoản · …"; môn "R+W".
- Nguyên nhân: `shared/domain/nhatKy.ts:68-69` (rơi về 'Thao tác hệ thống') — thiếu khoá `programme_created`, `programme_updated`, `route_updated`, `user_info_set` (đặt ở `sysconfig.ts:68,199,258`, `accounts.ts:427`). Nhãn môn: entityLabel ghi mã môn thô ở đường ghi điểm lớp thường (chỉ thấy ở nhật ký, chưa tra đường ghi).
- Đề xuất: thêm 4 nhãn vào `NHAN_NHAT_KY`; đổi chữ, không cần mockup.

### QT-6 · lỗi · Quyền cấp riêng hiện chữ "granted" ở menu Tài khoản; Hồ sơ cá nhân không nói quyền gì và câu "nhãn màu vàng" sai
- Trang · vai: menu Tài khoản (góc phải) › "Phạm vi được cấp" và `/ho-so-ca-nhan` › "Vai trò và phạm vi" · GVCN (id 7) sau khi QT cấp riêng `score.override` · MB và `analysis.view` · toàn hệ thống
- Tái hiện: QT › Tài khoản › Trần Ngọc Hà › Sửa › Quyền cấp riêng (2 quyền, lý do) › Lưu → đăng nhập GVCN → mở menu Tài khoản, rồi Hồ sơ cá nhân.
- Thấy: menu: chip "granted · Monbay", "granted · Toàn hệ thống" (mã tiếng Anh). Hồ sơ: "Quyền cấp riêng · Monbay", "Quyền cấp riêng · Toàn hệ thống" — không nói quyền nào; cùng màu với chip vai, trong khi chú thích ngay dưới viết "Nhãn màu vàng là quyền cấp riêng".
- Đúng ra: "Cấp riêng: Nhập bù điểm ngoài phân công · Monbay" (tên quyền từ `PERMISSION_LABEL`), cùng cách ở hai nơi; bỏ câu "màu vàng" hoặc làm đúng (không chỉ bằng màu).
- Nguyên nhân: `server/src/permissions.ts:100-108` (grant `roleKey: 'granted'`, `id: -1`, `roleName: 'Quyền cấp riêng'`) → `Header.tsx:309` dùng `roleLabel(g.role)` (rơi về mã thô, `people.ts:42-44`) và `key={g.id}` (mọi grant cấp riêng cùng `-1` → trùng key React); `ProfilePage.tsx:145-155` in `roleName` + câu "màu vàng".
- Đề xuất: đổi chữ ở hai nơi (thêm tên quyền từ `g.permissions[0]`), key = chỉ số. Không cần mockup.
- Ảnh: $SP/anh/quan-tri/menu-cap-rieng.png

### QT-7 · gợi ý · Chương trình mới tạo không có Progress Test thì không bao giờ thêm được (và không đổi được Số tuần ↔ Liên tục) — phải tạo mã khác
- Trang · vai: `/quan-tri` › Chương trình › Sửa "ABC" (tạo với 8 tuần, bỏ trống Progress) · QT
- Thấy: panel chỉ có "Final tuần"; gửi `progressWeek: 4` → 400 "Chương trình này không có bài Progress Test.". Chương trình chưa có lớp nào (0 lớp) nên không có lý do khoá.
- Đúng ra: plan.md mục 3 dòng 13/10 "Sửa sau khi lưu" — chương trình Quản trị tạo, chưa có lớp: cho sửa như lúc tạo (Progress, độ dài), giống Môn đã mở khi chưa có lớp (`suaMon`).
- Nguyên nhân: `sysconfig.ts:159-160` (`coGiuaKhoa` theo dòng `programme_checkpoints` đang có); web `CatalogAdmin.tsx:159,375` chỉ vẽ ô Progress khi đã có.
- Đề xuất: với `!goc && !coLop` dùng nhánh kiểm của `taoChuongTrinh` (Progress tuỳ chọn, đổi Số tuần ↔ Liên tục). Thêm ô theo mẫu sẵn có → không cần mockup.
- Ảnh: $SP/anh/quan-tri/sua-abc-khong-progress.png

### QT-8 · gợi ý · Chữ cũ về vai: "Admin CN thì không [giảng dạy]", "Admin chi nhánh là nhân sự văn phòng", "Ba nhóm: Quản trị, Quản lý, Giáo viên"
- Trang · vai: `/quan-tri` › Tài khoản (chú thích cuối bảng) · QT; trang Forbidden của Tài khoản / Chương trình; màn đăng nhập › Vào nhanh (demo)
- Thấy: vai `branch_admin` "Admin chi nhánh" đã bỏ (OV-2a); nay "Admin" = Admin Mock Test (office_admin), thêm TVV, CX. Chú thích `AccountsAdmin.tsx:198-200`, gợi ý `AccountsAdmin.tsx:68`, `CatalogAdmin.tsx` qua Forbidden, `AdminPage.tsx:29`, `WelcomePage.tsx:339-341` ("Ba nhóm") còn chữ cũ. Vào nhanh thực tế đã hiện 6 nhóm.
- Đề xuất: đổi chữ (vd "Một người mang được nhiều vai ở nhiều chi nhánh — QL có thể kiêm GV; QT hoặc QL nắm ≥ 2 vai thì đổi được góc nhìn."). Không cần mockup. (Chỉ đọc mã + ảnh welcome-vao-nhanh-1440.png.)

### QT-9 · gợi ý · Màn 375 Tài khoản: nút ⋯ mỗi dòng cao 28 px; hàng lọc "Kỹ năng" bị cắt chữ S
- Trang · vai: `/quan-tri` › Tài khoản · QT · 375 sáng
- Thấy: nút "Thao tác khác" (⋯) cao 28 px (nút Sửa cạnh đó 44 px) — đây là lối duy nhất tới Sửa thông tin / Xoá trên điện thoại. Nút lọc "Tất cả L R W S" tràn khung, "S" bị cắt (phải vuốt ngang trong hàng lọc).
  (Bảng → thẻ là UX-D7 đã hoãn — không báo.)
- Nguyên nhân: `web/src/ui/MenuDong.tsx` (nút không có `max-sm:min-h-[44px]`), `AccountsAdmin.tsx:142-146`.
- Đề xuất: nút ⋯ 44 px ở < 640 px; hàng lọc kỹ năng cho xuống dòng. Không cần mockup.
- Ảnh: $SP/anh/quan-tri/375-tai-khoan-bang.png

### QT-10 · gợi ý · Lặt vặt (đã tái hiện trừ khi ghi khác)
- Tạo tài khoản trùng email: 400 → chỉ toast "Email này đã có tài khoản." (Sửa thông tin thì 409 + lỗi dưới ô — hai cách cho cùng lỗi). `accounts.ts:303-305`, `AccountsAdmin.tsx:436`.
- Duyệt / Không duyệt đều toast chung "Đã xử lý đăng ký" — nên "Đã duyệt {tên} · Tư vấn viên · CP" / "Đã từ chối {tên}". `AccountsAdmin.tsx:114`.
- Duyệt đăng ký vai CX: nút Duyệt khoá khi chưa chọn chi nhánh → không duyệt được CX "Toàn hệ thống" (mặc định của vai) ngay ở hàng chờ; phải duyệt vai khác rồi Sửa (chỉ đọc mã `AccountsAdmin.tsx:315`).
- Chip "Chưa có kỹ năng 9→12" đếm cả QT / QL / TVV / CX / Admin; Hồ sơ cá nhân của TVV, CX, Admin vẫn có ô "Kỹ năng bạn phụ trách được" (chỉ có nghĩa cho người dạy). `taiKhoan.ts` `phanLoaiTaiKhoan`, `ProfilePage.tsx:132`.
- Xoá tài khoản TVV đang phụ trách 4 HV: panel không cảnh báo "4 học viên sẽ mất TVV" (GV thì có cảnh báo lớp thiếu GV). Panel xoá của tài khoản không vai ghi "chưa có vai trò · toàn hệ thống" (sai: không có phạm vi). `xoaTaiKhoan.ts` (canhBao), `XoaTaiKhoanPanel.tsx:56`.
- Mã chương trình "FOUND" bị từ chối với câu "Mã 2–6 ký tự: chữ in hoa và số…" dù đúng dạng — lý do thật là mã cũ của FOU. `sysconfig.ts:133`.
- Tab Quản trị (Tài khoản / Chương trình / Quyền & nhật ký) không nằm trong URL: rời trang rồi Quay lại luôn về Tài khoản (CLAUDE.md "Quay lại về đúng nguồn… tab"). `AdminPage.tsx:38` (chỉ đọc mã).
- Đổi mật khẩu ở Hồ sơ: mật khẩu mới 3 ký tự nút vẫn bật, chỉ máy chủ báo; "Hai ô chưa khớp" chỉ là toast. Không mất chữ.
- Màn đăng ký: nút chi nhánh đầu tiên (Monbay) mang tên trợ năng "Chi nhánh bạn đang hoạt động" (nhãn `<label>` bọc cả nhóm nút) — `WelcomePage.tsx:297` thiếu `as="div"` như các chỗ khác.
- Demo seed: `user_skills` chép từ phân công (`seed.ts:213`) → còn mã `writing` (4) và `tong_hop` (1) ngoài 5 ô MH1; bảng Tài khoản hiện "Writing", "Tổng hợp"; lưu hồ sơ / sửa kỹ năng lặng lẽ bỏ `tong_hop`. Chỉ demo.
- Menu Tài khoản của GVCN liệt kê cả lớp đã kết thúc (GVCN MB FOU 03, MB BE 08 · L) trong "GVCN" / "Kỹ năng được phân công" — chưa tra sâu nguyên nhân (ảnh menu-cap-rieng.png).
- Chương trình mới có số tuần (TOEIC) mang cột Target + tab Lộ trình tiếp theo như FOU/BE/ELE ("QL chốt trước hết W3 NOV"); `sysconfig.ts:16` ghi "luật riêng FOU/BE/ELE/FT không áp cho mã mới" — chủ SP xác nhận mã mới có số tuần có Lộ trình tiếp theo / Target hay không (câu hỏi, không phải lỗi). Ảnh toeic-lo-trinh-tiep.png.
- Panel "+ Chương trình": "Độ dài (Số tuần | Liên tục)" và "Mốc Test (Tuần cố định | Lặp mỗi n tuần)" là hai công tắc cho cùng một lựa chọn (bấm cái này đổi cái kia) — đúng mockup M3 §6, chỉ ghi để chủ SP cân nhắc gộp. Ảnh 375-ct-moi.png.
