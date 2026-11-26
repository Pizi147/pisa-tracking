# Vai GĐCN · Lead TVV · BPXL theo lớp — thiết kế (26/11)

Session `vai-moi` (Fable 5.2 · high, brainstorming với chủ SP 26/11). Chỉ thiết kế; code giao qua PTA Plan.

## 1. Lời chủ SP (nguyên văn)

> "1. Thêm role: Giám đốc Chi nhánh (GĐCN), Lead TVV, chủ yếu quan sát và có thể làm được hộ những người khác, việc liên quan bạn tự đề xuất, nhưng hầu như không có việc gì lắm, chỉ trừ GĐCN thì thường cần phải cập nhật thông tin meeting với HV SOS 3 như vẫn có. Và Lead TVV thì góc nhìn khá giống với CX, tập trung vào trải nghiệm HV và liên quan đến bộ phận khách hàng
> 2. Ngoài ra, BPXL cần xử lý như sau: có thể thấy HẾT LỊCH của các CN khác, có được phân quyền 'toàn hệ thống' (toàn hệ thống thì như là kiểu CX ấy, nhưng nếu không bấm toàn hệ thống mà bấm hết tất cả các CN thì ý là vẫn là nhân viên thôi nhưng được xếp cho toàn bộ các CN) thì được coi như là lead của BPXL. Những CVXL được giao chi nhánh thì sẽ là người được nhận các đầu việc tự động giao của từng CN luôn, mấy việc chuyển lớp chuyển GV mà vừa nói ấy kiểu mấy việc như thế nha."

> (qua PTA Plan) "Những leaders chỉ chủ yếu theo dõi công việc, có một vài cái đặc thù thì sẽ giao trực tiếp thôi, còn thường các công việc chính chỉ giao cho một người thôi nhé, nếu là tuyến thì vẫn 1 người phụ trách chính, còn lại các công việc trong tuyến có người phụ trách riêng biệt, hiểu ý tôi chứ?"

**Trả lời trong session (nguyên văn):**

| # | Câu hỏi | Chủ SP |
|---|---|---|
| Q1 | Kết quả meeting SOS 3 giao một người nào | "giao cho GĐCN" |
| Q2 | CN nhiều người cùng vai nhận việc → ai | "Nếu liên quan đến xếp lịch, thì tốt nhất bây giờ như sau: cho tất cả các CVXL được tự chủ động gán mình vào một lớp để xếp, và phụ trách tất cả các CV liên quan đến lớp đó, lớp nào chưa gán, thì giao cho người ít việc nhất trong cùng CN." |
| Q3 | Chuyển lớp: CVXL lớp cũ hay lớp mới | "tất nhiên lớp mới rồi, theo lớp nhé" |
| Q4 | GĐCN = bộ quyền Head, không nhận việc tự động | "như đề xuất" |
| Q5 | Em chưa có TVV → việc TVV về Lead TVV thay Head | "ok giao cho Lead TVV" |
| Q6 | Phạm vi BPXL | "BPXL khá đặc thù và hay hỗ trợ nhau, nên cứ cho xếp hết toàn bộ, nhưng góc nhìn mặc định và các công việc được giao thì là theo CN" |
| Q7 | Cách làm A / B / C (mục 4) | "A nhé, cứ theo đề xuất" |

## 2. Mục tiêu · không làm · hỏng dù chạy được

- **Mục tiêu (đầu ra):** mỗi việc tự sinh về **đúng một người**, người đó là người làm thật (CVXL của lớp, GĐCN họp SOS 3, Lead TVV khi em thiếu TVV). Lead xem toàn cảnh, làm hộ được, không bị dồn việc.
- **Không làm:** không thêm bước duyệt, không thêm việc định kỳ cho lead, không tách quyền mới, không đổi luật nghiệp vụ khác.
- **Hỏng dù chạy được:** một việc hiện ở nhiều người ("ai làm?"); lead ngập chuông; việc nhảy người khi có người mới vào CN; BPXL không sửa được lịch CN bạn khi cần đỡ; GĐCN thấy nút mà bấm bị chặn.

## 3. Hiện trạng đã kiểm (26/11, main ae312aeed)

- **GĐCN chưa là vai** — chỉ là chữ trong "Meeting CX/GĐCN". Phần Kết quả meeting: `meeting_phan.vai_id` → mọi CX của CN (`giaoViec.ts:167, 1011`), không CX → Head.
- **Người toàn hệ thống tự nhận việc mọi CN:** `nguoiVaiCuaChiNhanh` (`platform/audit.ts:86`) và `nguoiGiuVai` (`giaoViec.ts:1004`) lấy cả `branch_id IS NULL`.
- **Giao theo nhóm vai:** Xếp lịch họp (mọi BPXL CN), Kết quả meeting (mọi CX CN), Nhận thông tin N73 (đặc tả #2238 đã đổi sang một người).
- **Em không TVV → Head** tính lúc đọc (`viecTvv.ts:150`, `giaoViec.ts:568`).
- Vai = bảng `roles` + `role_permissions`; phạm vi = `user_roles.branch_id` (NULL = toàn hệ thống). `grantCovers` (`permissions.ts:558`) chặn grant CN ở CN khác.
- Mã so vai cứng: `'manager'` ~50 chỗ / 27 tệp máy chủ, `'cx'` ~36 chỗ, web + shared ~39 chỗ.
- **Bản chép thật `mig.sqlite` (chỉ đọc):** 5 CN · 0 tài khoản BPXL · CX: 1 toàn hệ thống, 2 tích đủ 5 CN, 2 tích một phần · chưa có GĐCN / Lead TVV.

## 4. Cách làm (chủ SP chọn A)

| | Cách | Được | Mất | |
|---|---|---|---|---|
| **A** | Hai vai thật `branch_director` (GĐCN, chép quyền Head) + `lead_consultant` (Lead TVV, chép quyền CX) · bảng `lop_xep_lich` (CVXL nhận lớp) · **một hàm chung `nguoiNhanTuDong`** cho mọi việc tự giao | một khái niệm một tên; luật giao việc ở một chỗ | 2 vai + migrate nhỏ; rà ~125 chỗ so vai cứng | **✓** |
| B | Không vai mới: Head / CX + cờ "không nhận việc" | ít mã | GĐCN hiện là "Head" trên màn; cờ ẩn; không biết ai là GĐCN để giao Kết quả meeting | bỏ |
| C | Quyền cấp riêng từng người | không đổi bảng vai | không có "người nhận theo vai", gán tay từng người | bỏ |

## 5. Luật mới (đề xuất số — PTA ghi vào `plan.md` 1.6 khi duyệt)

**N74 · Một việc một người nhận (chủ SP 26/11).** Mọi việc tự sinh lưu **một** người phụ trách lúc sinh (không giao "cả vai"). Hàm chung `nguoiNhanTuDong(loai, cn, lopId?)`:
1. Việc xếp lịch (BPXL) có lớp → **CVXL đã nhận lớp đó** (N76).
2. Còn lại → trong **nhóm người giữ vai đó gán đúng CN** (grant `branch_id = cn`; **bỏ grant toàn hệ thống**): người có **ít việc mở nhất** (đếm việc mở mọi loại mà người đó phụ trách), bằng nhau → người được gán CN **sớm hơn** (`user_roles.created_at`, rồi `id`).
3. Không ai → **Head** CN (cùng quy tắc ít việc nhất nếu CN nhiều Head).
- Người nhận lưu cố định — người mới vào CN **không** làm việc cũ nhảy người. Đổi người theo N73 ④ (chuyển tay, Hoàn tác).
- Áp cho: Xếp lịch họp (sửa N58 "mọi BPXL CN"), Nhận thông tin · Chuyển lớp / Đổi GV (N73), Kết quả meeting (N75), việc TVV khi em chưa có TVV (N76b).
- **Lead (grant toàn hệ thống, GĐCN, Lead TVV) mặc định chỉ theo dõi**; chỉ nhận việc đặc thù ghi rõ ở N75 / N76b.

**N75 · Vai GĐCN — Giám đốc Chi nhánh.** Gán 1 / nhiều CN (trống = toàn hệ thống).
- **Quyền = bộ quyền Head** trong phạm vi (xem mọi thứ, làm hộ mọi việc Head làm được, gồm đổi người / hạn N73 ④, giao việc Vận hành N59). Mọi chỗ mã coi "là Head" thì GĐCN cũng vậy, **trừ** việc tự giao cho Head.
- **Không nhận việc tự động của Head** (Chốt lộ trình, Xếp lịch MT còn thiếu, MT quá lịch thi, fallback "không TVV / không BPXL → Head"…).
- **Việc riêng duy nhất: phần "Kết quả meeting"** (Meeting CX / GĐCN, SOS 3) — người nhận: GĐCN gán CN của em (N74 bước 2) → không có: **CX** gán CN (N74 bước 2) → không có: Head. Thay luật cũ "Kết quả meeting = CX" (N58 / N52 ngoại lệ).
- Màn: như Head — trang đầu Tổng quan CN; Công việc mở "Của tôi" khi có việc, không có → "Tất cả" (như N63 ④).

**N76 · Vai Lead TVV.** Gán 1 / nhiều CN (trống = toàn hệ thống).
- **Quyền = bộ quyền CX (N52 / N63)**: xem mọi thứ trong phạm vi; sửa phía TVV (thông tin HV, Target, trạng thái, Chốt ngày thi, thi thật, Bước tiếp, hồ sơ thiếu, Báo PH, Ý thức, tạo / sửa lớp, thêm HV, chuyển lớp); không học thuật.
- **N76b · Em chưa có TVV** (hoặc TVV hết hiệu lực): việc TVV của em (Báo PH mọi nguồn N72 ⑤, Chốt ngày thi, Bước tiếp, Bổ sung hồ sơ, KQ thi thật, Báo PH · Chuyển lớp N73) → **Lead TVV gán CN em** (N74 bước 2) → không có: **Head** (như cũ). Thay "không TVV → Head" ở N72 ⑤ / N73 ①.
- **Theo dõi mặc định:** Lead TVV gán CN em vào người theo dõi mặc định của Báo PH (cùng Head + CX — N72 ⑤).
- Màn: như CX — menu, trang đầu như CX; Công việc mở "Của tôi" khi có việc, không có → "Tất cả".

**N77 · BPXL theo lớp (chủ SP 26/11).**
- **Mọi BPXL xem + xếp / sửa lịch MỌI CN** (Kế hoạch Test, + MT, S Ex, lịch lớp thường, Lịch Test tuần) — quyền N57 / N63 ② không còn giới hạn bởi CN gán. Các quyền khác của BPXL giữ theo N57 (xem Học viên & Lớp theo CN gán).
- **CN gán chỉ quyết:** màn mặc định (Kế hoạch Test mở CN của mình; ô chọn CN, nhiều CN → CN đầu) và **nhận việc tự động của CN đó**.
- **"Toàn hệ thống" = lead BPXL:** làm hộ mọi việc BPXL mọi CN, gán / đổi CVXL cho lớp; **không nhận việc tự động**. Tích đủ mọi CN = nhân viên nhận việc mọi CN (N74 bước 2 tính ở từng CN).
- **Nhận lớp:** CVXL bấm **"Nhận lớp"** (dòng lớp ở Kế hoạch Test + đầu hồ sơ lớp, cạnh "Xếp lịch: {tên}"); bấm lại "Bỏ nhận"; Hoàn tác ngắn. Lớp người khác đã nhận vẫn nhận lại được (không khoá): người cũ nhận một tin "Cập nhật", **việc BPXL đang mở của lớp chuyển sang người mới**, có lịch sử. Head / Quản trị / lead BPXL gán / đổi / bỏ CVXL cho lớp được.
- **Việc theo lớp:** mọi việc BPXL tự sinh của một lớp → CVXL của lớp đó (N74 bước 1), lớp chưa có → N74 bước 2. Xếp lịch họp: lớp em đang học.
- **Chuyển lớp (sửa N73 ① / đặc tả #2238 mục 4.2):** "Nhận thông tin · Chuyển lớp" gom **theo lớp ĐÍCH** (một việc mỗi lớp đích còn mở), giao CVXL lớp đích; **CVXL lớp nguồn tự vào theo dõi** (không việc). Bỏ "chi nhánh nguồn cũng một việc". Xét lại tách nhiều lớp đích → mỗi lớp đích một việc. Đổi GV: CVXL của lớp đó.
- Lớp kết thúc / lưu trữ: dòng nhận lớp giữ cho lịch sử, không giao việc mới (lớp không còn sinh việc).

## 6. Bảng quyền theo vai (sau thay đổi)

| | Phạm vi | Xem | Sửa / làm hộ | Việc tự nhận | Theo dõi mặc định |
|---|---|---|---|---|---|
| Head | CN gán | mọi thứ | như nay | như nay (fallback cuối N74) | như nay |
| **GĐCN** | CN gán / toàn HT | như Head | như Head | **chỉ Kết quả meeting** | — (tự vào khi giao / chuyển — N58) |
| CX | CN gán / toàn HT | như nay (N52) | như nay | Kết quả meeting **chỉ khi CN không có GĐCN** | Báo PH (N72 ⑤) |
| **Lead TVV** | CN gán / toàn HT | như CX | như CX | **việc TVV của em chưa có TVV** | Báo PH CN mình |
| TVV | như nay | như nay | như nay | như nay | như nay |
| **BPXL (CN)** | CN gán (mặc định + việc) | lịch mọi CN | **xếp lịch mọi CN** · Nhận lớp | việc BPXL của lớp đã nhận + lớp chưa ai nhận ở CN gán | lớp nguồn khi em chuyển đi |
| **Lead BPXL** (toàn HT) | toàn HT | lịch mọi CN | như BPXL + làm hộ mọi việc BPXL + gán CVXL cho lớp | **không** (trừ lớp tự nhận) | — |

Grant toàn hệ thống của **mọi** vai (CX, Lead TVV, GĐCN, BPXL) không vào nhóm nhận ở N74 bước 2.

## 7. Chuông, Công việc

- Lead **không tự vào theo dõi từng việc**; xem toàn cảnh ở Công việc › "Tất cả" (Head-like: Của tôi · Của GV · Tất cả với GĐCN; như CX với Lead TVV). Chuông chỉ khi được giao / chuyển tới, hoặc việc mình giao / chuyển đi (tự vào theo dõi — N58).
- Số việc / badge của lead chỉ đếm việc mình phụ trách.

## 8. Dữ liệu và chuyển dữ liệu

- **Bảng mới** `lop_xep_lich (class_id PK, user_id, gan_boi, gan_luc)` + lịch sử nhận / bỏ / đổi vào nhật ký sẵn có.
- **Vai mới:** migrate kiểu `prBpxl.ts` — chèn `branch_director`, `lead_consultant` + chép quyền từ `ROLE_PERMISSIONS.manager` / `.cx` một lần; khai `ROLES` + `ROLE_PERMISSIONS` (seed); `VAI_GIAO_VIEC` (`timNguoi.ts:71`) thêm hai vai.
- **Việc đang mở giao theo nhóm** (Xếp lịch họp mọi BPXL, Kết quả meeting mọi CX — `vai_id`): migrate **chốt một người** theo N74 lúc deploy; bản chép thật: 0 BPXL → Xếp lịch họp không có dòng nào đổi; Kết quả meeting đổi sang CX đang giữ theo N74 (GĐCN chưa có). Báo số dòng đổi khi deploy.
- **Em chưa có TVV (90 việc trên bản chép, đang ở Head):** chưa có Lead TVV nào → **không đổi lúc deploy**. Khi Quản trị tạo Lead TVV cho CN: *session tự quyết* — việc **sinh sau** mới về Lead TVV; việc cũ ở Head giữ, Head chuyển tay được (tránh danh sách Head đổi bất ngờ). Mã hiện tính "không TVV → Head" lúc đọc → phải lưu người nhận lúc sinh (N74).
- Chạy lặp không đổi; thử trên bản chép `mig.sqlite` (bản sao, không sửa bản gốc).

## 9. Màn đổi (mockup `thiet-ke/v29/` sau khi duyệt đặc tả)

| Khung | Màn | Trạng thái cần vẽ |
|---|---|---|
| V1 | **Sửa tài khoản** — ô vai thêm GĐCN, Lead TVV; BPXL chip "Toàn hệ thống" có ⓘ "Lead BPXL: không nhận việc tự động" | GĐCN 1 CN · Lead TVV toàn HT · BPXL tích đủ CN · BPXL toàn HT |
| V2 | **Kế hoạch Test (BPXL)** — ô chọn CN (mặc định CN gán), cột / chip "Xếp lịch: {tên}" + nút Nhận lớp / Bỏ nhận trên dòng lớp | lớp của tôi · lớp người khác (Nhận lại) · lớp chưa ai nhận · sau bấm (Hoàn tác) · CN khác (vẫn sửa được) · 375 |
| V3 | **Đầu hồ sơ lớp** — "Xếp lịch: {tên} · Đổi" (Head / lead BPXL) | có người · chưa có |
| V4 | **Công việc GĐCN** — "Của tôi" có Kết quả meeting / rỗng → "Tất cả" | 1440 + 375 |

Theo khuôn v27 / v28 (không màu, cỡ chữ mới). Dữ liệu bịa, không tên thật. 1440 tối + 375; critique ≥ 35 hoặc không P0 / P1 sau 2 vòng.

## 10. Kế hoạch PR

| PR | Nội dung | Model · effort | Sau |
|---|---|---|---|
| **VAI-0** (máy chủ) | 2 vai + migrate + seed · helper `laHead(p)` / `laCx(p)` gom so vai cứng (GĐCN tính Head, Lead TVV tính CX) **trừ** chỗ giao việc · `nguoiNhanTuDong` + thay `nguoiVaiCuaChiNhanh` / `nguoiGiuVai` ở mọi nguồn việc · bảng `lop_xep_lich` + đường Nhận / Bỏ / Gán (`POST /lop/:id/xep-lich`) · `grantCovers` cho quyền lịch của BPXL mọi CN · Kết quả meeting → GĐCN · em không TVV → Lead TVV (lưu người lúc sinh) · migrate chốt một người cho việc nhóm · phép kiểm từng luật N74–N77 + trần câu `tocDoDuong.ts` cho đường mới | Opus 5.5 · high (B: Sonnet 5.5 · high) | LPB-0 (N73) — hoặc gộp phần N74 vào LPB-0 nếu chưa mở |
| **VAI-1** (web) | Sửa tài khoản (V1) · Kế hoạch Test ô CN + Nhận lớp (V2) · hồ sơ lớp (V3) · Công việc GĐCN / Lead TVV mặc định (V4) · `/ponytail lite`, impeccable `clarify` `adapt`, `audit` + `web-design-guidelines` trước PR, ảnh cặp v29 | Opus 5.5 · medium (B: Sonnet 5.5 · high) | VAI-0 + mockup v29 duyệt |

Cả hai: skill `karpathy-guidelines`, `ponytail` (VAI-0 `full`). VAI-0 là logic quyền + migrate → planning chạy `/security-review` + `/code-review high`.

### Prompt VAI-0 (dán vào session mới)

> Model: Opus 5.5 · effort high (phương án B: Sonnet 5.5 · high). Skill `karpathy-guidelines`, `ponytail` full. Đọc CLAUDE.md, `plan.md` 1.6 (N52, N57, N58, N72–N77), đặc tả `docs/superpowers/specs/2026-11-26-vai-gdcn-lead-tvv-bpxl/thiet-ke.md` (mục 5–8, 10) và `…/2026-11-26-viec-lien-phong-ban/thiet-ke.md`. Làm PR VAI-0 máy chủ đúng bảng mục 10. Trước khi sửa: grep `'manager'`, `'cx'`, `'scheduler'`, `nguoiVaiCuaChiNhanh`, `nguoiGiuVai`, `consultant_user_id IS NULL`, `vai_id` — lập bảng chỗ "là Head / là CX" (GĐCN / Lead TVV vào) và chỗ "giao việc" (KHÔNG vào, đi qua `nguoiNhanTuDong`). Phép kiểm: một việc một người; grant toàn hệ thống không nhận; ít việc nhất + hoà theo gán sớm; người mới vào CN không làm việc cũ nhảy; Nhận lớp / nhận lại chuyển việc mở; chuyển lớp → CVXL lớp đích, CVXL nguồn theo dõi; BPXL CN A sửa lịch CN B được, không sửa điểm; GĐCN không thấy việc tự động của Head; em không TVV → Lead TVV → Head. Thử migrate trên bản chép của `D:\Github\pisa-mig\mig.sqlite` (không in tên / email), báo số dòng đổi. Đo câu trước → sau ở mô tả PR. `npm run check` trước PR; nhắn PTA Plan khi mở PR.

## 11. Session tự quyết (chủ SP xem khi duyệt)

1. Mã vai `branch_director` / `lead_consultant`; tên hiện "GĐCN" / "Lead TVV".
2. "Ít việc mở nhất" đếm **mọi loại việc mở** người đó phụ trách (không chỉ cùng loại) — đơn giản, phản ánh tải thật.
3. Kết quả meeting: GĐCN → **CX** → Head (chủ SP chỉ nói "giao cho GĐCN"; CX giữ làm dự phòng vì đang làm việc này).
4. Lead TVV toàn hệ thống / GĐCN toàn hệ thống không nhận việc (như mọi lead).
5. Nhận lại lớp người khác không khoá, người cũ có tin; Head / Quản trị / lead BPXL gán hộ.
6. Bật Lead TVV sau deploy: chỉ việc sinh sau về Lead TVV, việc cũ ở Head giữ.
7. Quyền khác của BPXL (Học viên & Lớp…) vẫn theo CN gán — chủ SP chỉ mở "xếp lịch" toàn bộ.
8. Lớp kết thúc giữ dòng nhận lớp cho lịch sử.
9. **Việc tính lúc đọc** (việc TVV từ bảng `students`: Chốt ngày thi, Bổ sung hồ sơ, Bước tiếp, KQ thi thật; không có dòng lưu): giữ tính lúc đọc, KHÔNG tạo dòng mới (tránh chồng LPB-1). Em không TVV → **Lead TVV gán CN em được gán sớm nhất** (ổn định, không cần đếm việc) → Head. Em được gán TVV → việc tự về TVV như nay. Việc có dòng lưu (Báo PH `viec_bao_ph`, `meeting_phan`, Nhận thông tin) → N74 đủ (ít việc nhất, lưu người). "Ít việc mở" chỉ đếm dòng có `phu_trach_id = người` (một câu gộp, không đếm việc tính lúc đọc).
10. **Người nhận hết hiệu lực** (gỡ vai / khoá tài khoản / hết CN): việc về người **gán CN sớm nhất** lúc đọc (không đếm lại việc, ổn định); người cũ không còn thấy. *(VAI-0 làm: người theo luật lưu ở cột riêng `meeting_phan.nguoi_luat`, giữ nguyên nghĩa `phu_trach_id` = người được chuyển tay.)*
11. **Nhận lớp CN khác:** được (BPXL xếp lịch mọi CN, tự chủ động nhận). Đã nhận thì nhận việc BPXL của lớp đó dù CN khác — `HOAT_DONG_O` / hết hiệu lực coi dòng `lop_xep_lich` là còn hiệu lực với BPXL.
12. **Nhận lớp (lần đầu hoặc nhận lại):** việc BPXL đang mở của lớp chuyển sang người nhận, **trừ** việc đã được chuyển tay (có người giao — `giao_boi`); Hoàn tác trả đúng người cũ từng việc.
13. **Gom theo lớp đích:** như 4.2 cũ đổi khoá — mọi lệnh (khác ngày cũng được) vào cùng lớp đích dồn vào việc Nhận thông tin của lớp đó **còn mở**; đã xác nhận → việc mới. Nếu LPB-0 chưa mở: gộp N74 + lô lớp đích vào LPB-0; đã merge: VAI-0 đổi khoá lô.
14. **GĐCN không nhận tin "để biết" / theo dõi nguồn `head`** (lead không tự theo dõi). Helper `laHead` dùng cho QUYỀN, không dùng cho đường gửi tin / giao việc / theo dõi mặc định.
15. **Head ở N74 bước 3:** Head gán CN (ít việc nhất) → không có: Head toàn hệ thống (ít việc nhất) → không có: việc để trống người, hiện ở Công việc › "Tất cả" của Quản trị / Head / GĐCN (không mất việc).

16. **BPXL xem / xếp mọi CN** = 3 quyền lịch (`plan.week`, `schedule.move`, `test.view`) phủ mọi CN + danh sách Lịch Test tuần mọi CN; **không** mở `attempt.view` (Học viên & Lớp, bảng điểm, Phân tích chi nhánh khác vẫn đóng — điểm 7); đường ghi điểm vẫn chặn BPXL. Trang Test không gửi chi nhánh → mở CN gán; `branchId=all` → mọi CN (web VAI-1 thêm ô chọn).
17. **Bản chép thật (VAI-0, 26/11):** migrate thêm 2 vai (GĐCN 30 quyền = Head, Lead TVV 17 quyền = CX), chốt CX cho 23 phần Kết quả meeting đang mở; Xếp lịch họp 23 phần chưa có BPXL → giữ TVV → Head như cũ; chạy lại không đổi.

## 12. Ảnh hưởng luật cũ (PTA sửa khi ghi 1.6)

- **N58 / N52 ngoại lệ:** Kết quả meeting = GĐCN (N75); Xếp lịch họp một người (N74, N77).
- **N72 ⑤ / N73 ①:** "em không TVV → Head" thành "→ Lead TVV → Head" (N76b); theo dõi Báo PH thêm Lead TVV.
- **N73 ① / 4.2:** lô Nhận thông tin · Chuyển lớp theo **lớp đích**, CVXL lớp đích; CVXL lớp nguồn theo dõi; bỏ việc ở chi nhánh nguồn.
- **N57:** BPXL xếp lịch mọi CN; CN gán = mặc định + việc.
