# Việc liên phòng ban (TVV / BPXL) — thiết kế (26/11)

Session `brainstorm-lien-pb` (Fable 5.2 · high), brainstorming trực tiếp với chủ SP 26/11. Đọc trên `origin/main` ce2ba5770.
Trạng thái: **chờ chủ SP duyệt đặc tả** (đã chốt Q1–Q4 trong session) → mockup `thiet-ke/v28/` → PTA Plan giao code.
Nền: N72 ①–⑥ (đặc tả `../2026-11-26-tuyen-cong-viec-yt-phoi-hop/thiet-ke.md`, mockup `thiet-ke/v27/`). Tệp này chỉ ghi phần **thêm**.

## 0. Lời chủ SP (nguyên văn, 26/11)

> "Có một số việc cũng cần phải giao task cho TVV/ BPXL:
> 1. HV chuyển lớp: giao task báo PH cho TVV, giao task cập nhật thông tin để xếp lịch cho BPXL (việc này chỉ cần confirm là được)
> 2. Chuyển GV phụ trách: nếu như head bấm cần bàn giao thì tức là việc cũng sẽ sinh ra luôn cho BPXL để confirm nhận thông tin còn xếp lịch
> 3. Hạn này đều là CN gần nhất (nếu chỉ cách CN từ 2 ngày trở xuống thì cho thành hạn 3 ngày nhé)
> 4. Những người có liên quan đều có thể chuyển người làm sang người khác, hoặc chuyển hạn, kể cả đang bị giao việc, ví dụ CVXL A đang nhận việc, nhưng không phải việc của họ nên họ bấm và chuyển sang người khác, thì công việc đó sẽ biến mất khỏi danh sách, chỉ ở trong ds theo dõi, còn người bị giao sẽ được thông báo và công việc hiện lên trong DS.
> 5. Những việc này đều có thể giao thêm việc con cho đồng bộ. Nói chung mọi thứ cần đồng bộ về kiểu dạng việc, người làm, người theo dõi, ở gần như mọi việc, chỉ trừ một số cái như chấm điểm, chứ cứ liên phòng ban thì phải là có việc kiểu như thế này (tức kiểu thuộc vào vận hành)
> 6. Cứ brainstorm và sử dụng các skills thiết kế hợp lý nhé"

**Mục tiêu:** việc nào qua tay phòng khác (TVV, BPXL) là **một việc thật, cùng một kiểu**: có người làm, hạn, người theo dõi, việc con, chuyển được cho người khác. Đầu ra: PH được báo trước khi em vào lớp mới; BPXL biết em / GV đổi để xếp lịch đúng.
**Không làm:** thêm bước duyệt, thêm điều kiện chặn lệnh chuyển lớp / lưu phân công, đổi người làm mặc định hay hạn của việc đang có, đổi luật chấm điểm / Case / PA.
**Hỏng dù chạy được (anti-goal):** PH bị báo hai lần cùng một chuyện; chuyển lớp / đổi GV bị chậm vì chờ ai đó xác nhận; việc bị đẩy qua lại mà không ai biết đang ở ai; BPXL phải nhập gì đó mới xong việc "nhận thông tin".

## 1. Hiện trạng (đã kiểm trên code `origin/main` ce2ba5770)

`ss` = `server/src`, `sd` = `shared/domain`.

| Mặt | Hiện nay | Thiếu |
|---|---|---|
| **Chuyển lớp** | Head / Quản trị / CX ra lệnh (`lenhSvc.raLenh`, `ss/classes/lenhChuyen.ts`; bảng `lenh_chuyen_lop`, mỗi em một lệnh `cho`); đường: chuyển lẻ `POST /students/:id/transfer`, cả lớp Cuối khoá `POST /classes/:id/transition`, Xét lại `POST /classes/:id/xet-lai`, duyệt đề xuất GVCN. Thi hành thứ Hai (`thiHanhLenhDenHan`) hoặc **"Ngay hôm nay"** (`chuyenNgayCoHoanTac`). Tin chuông: `sap_nhan` (lúc ra lệnh) + `transfer_in` (lúc thi hành) cho **GVCN lớp đích** (+ Head nếu khác chi nhánh) | **TVV, BPXL, GVCN cũ không có việc, không có tin.** BPXL chỉ biết khi tự mở lưới lịch |
| Bàn giao chuyển lớp | GVBM ghi câu môn, GVCN lớp cũ xác nhận (`ss/classes/banGiao.ts`); hạn `hanBanGiaoLenh` = max(7 ngày, CN tuần Final); nhóm `ban_giao` ở `/my-work`; Head làm thay được (N64) | không có khối Phụ trách · Hạn · Theo dõi |
| **Đổi GV** | `POST /phan-cong/luu` → `luuPhanCong` (`ss/classes/phanCongGv.ts`); Head tích **"Tạo việc bàn giao"** từng cặp (cột `doi_phan_cong.tao_ban_giao`, mặc định bật; `web/…/HopLuuPhanCong.tsx:208`) → việc `ban_giao_gv` cho GV cũ, hạn 5 ngày (`hanBanGiaoGv`) | **BPXL không nhận gì** |
| Lịch khi chuyển lớp | FT → FT: lượt Mock đã xếp **đi theo em**, tuần giữ nguyên · Cuối khoá mở khoá mới: lượt `planned` **ở lại lớp cũ** · FT → lớp thường: MT0 / Mock chưa điểm **huỷ** (`ss/classes/luatLoTrinh.ts`) | BPXL không được báo điều nào |
| **Giao việc N58** (`ss/worklist/giaoViec.ts`) | `LOAI_GIAO` = `bao_ph` · `phoi_hop` · `tinh_hinh` · `meeting` · `tra_lai` (+ `xu_ly` · `da_thuc_hien` ở BAOPH-0 #2233). Đổi người: người đang giữ · Head · Quản trị · CX (`coTheDoiNguoi`); đổi hạn: thêm người giao (`coTheSuaHan`). Đổi người → người cũ tự vào theo dõi, người mới có chuông (`baoTheoDoi`), Hoàn tác (`hoanTacGiao`) | việc theo luật thuộc **nhiều người** (Xếp lịch họp = mọi BPXL chi nhánh): chuyển đi thì **không ai vào theo dõi** (`doiPhuTrach` :391) · người giao không đổi được người |
| BPXL (`scheduler`) | việc: Xếp lịch họp (mọi BPXL của chi nhánh cùng thấy; không BPXL → TVV → Head, `docViec`) + việc được giao + Đang theo dõi (N57) | — |
| Việc Vận hành N59 (`tasks`) | chỉ người tạo tay + việc lặp (`taoViecLap`); việc con `parent_task_id`, BAOPH-0 thêm `cha_loai` / `cha_id` cho việc con gắn việc N58 | chưa có việc nào do **luật** sinh |
| TVV báo PH (`viec_bao_ph`) | cột nguồn `measure_id` · `bao_lai_cua` · `phoi_hop_id` · `tinh_hinh_id`; sau BAOPH-0: mọi nguồn có Head + CX + người tạo theo dõi | không có nguồn chuyển lớp |
| Hạn | mọi hạn "n ngày tính cả ngày đầu" (`hanTheoNgay`, `hanBaoPh`…) | chưa có hàm "CN gần nhất" (`chuNhatCuaTuan` ở `sd/sos.ts:30` chưa export) |
| Việc TVV (N6), việc quản lý của Head | Chốt ngày thi · Chọn bước tiếp sau thi · Bổ sung hồ sơ thiếu · Cập nhật KQ thi thật (TVV) · Chốt lộ trình · Xét lại lộ trình · Xếp lịch MT còn thiếu (Head) | không có khối Phụ trách · Hạn · Theo dõi, không chuyển người được |

## 2. Đã chốt với chủ SP (26/11, trong session)

| # | Câu hỏi | Chủ SP chọn |
|---|---|---|
| Q1 | Lần chuyển lớp nào sinh việc? | "theo khuyến nghị nhưng nếu bấm chuyển 'ngay hôm nay' thì không sinh việc nhé" → **mọi lệnh chuyển lớp** (lẻ · Cuối khoá cả lớp · Xét lại) sinh việc **ngay lúc ra lệnh**; **"Ngay hôm nay" không sinh việc** · TVV: một dòng lớp × đợt "n em" mở tại chỗ; em đã có việc "Kết quả Final" thì **gộp**, chỉ báo PH một lần · BPXL: **một việc cho cả lô**, bấm Xác nhận một lần |
| Q2 | Hạn "CN gần nhất" tính thế nào? | "Thứ 6 thì hạn T2 tuần sau, Thứ 7 thì hạn t3, CN thì hạn T4" → sinh việc **T2–T5: hạn Chủ nhật tuần đó** · **T6 → T2, T7 → T3, CN → T4 tuần sau** (ngày sinh + 3) |
| Q3 | Ai đổi được người làm / hạn? | "nhóm theo khuyến nghị" → **người đang giữ việc · người đã giao · Head · Quản trị · CX** của chi nhánh, cho cả đổi người lẫn đổi hạn; **người theo dõi chỉ xem** |
| Q4 | Việc nào dùng khung việc chung? | "ok đồng ý" bảng mục 4.5: **Có** — ba việc mới, việc TVV (N6), Bàn giao, việc quản lý của Head · **Không** — chấm / nhập điểm / nhận xét Test, Case / PA học thuật, Báo cáo PH tháng / đợt, thẻ Chờ duyệt |

Nội dung ba việc (4.1–4.3) và cách chuyển người (4.4) session trình, chủ SP không sửa.

## 3. Cách làm (Approaches)

| Cách | Được | Mất | Chọn |
|---|---|---|---|
| **1. Nguồn mới trong khung sẵn có** — việc TVV là một nguồn nữa của `viec_bao_ph`; việc BPXL là một loại việc "nhận thông tin" nhỏ trong `LOAI_GIAO`; việc TVV / Bàn giao / Head thêm khung như BAOPH-0 làm cho `xu_ly` | một kiểu panel, một cách Hoàn tác, không làm lại | mỗi loại một nhánh ở máy chủ | **✓** (chủ SP giao session chọn) |
| 2. Máy tự tạo **việc Vận hành** (`tasks`) cho cả ba | sẵn việc con, tệp | Báo PH chuyển lớp lệch mọi Báo PH khác (không Đã báo / Chưa liên hệ được, trái N72 ⑤); `tasks` chỉ một người làm, không hợp "mọi BPXL chi nhánh" | bỏ |
| 3. Bảng việc chung mới thay mọi loại | sạch | làm lại toàn bộ, trái "sửa trên nền có sẵn" | bỏ |

## 4. Thiết kế

### 4.0 Khi nào sinh việc

| Sự kiện | TVV · Báo PH · Chuyển lớp | BPXL · Nhận thông tin |
|---|---|---|
| Ra lệnh chuyển lớp có **lớp đích**, thi hành "Từ tuần …" (lẻ, cả lớp Cuối khoá, Xét lại, duyệt đề xuất GVCN) | **có** — mỗi em một việc | **có** — một việc mỗi lô × chi nhánh |
| Chuyển **"Ngay hôm nay"** | không (Q1) | không (Q1) — không thêm tin nào |
| Xếp lớp lần đầu (em chưa từng có lớp), hướng Bảo lưu / Dừng học (không lớp đích) | không *(session tự quyết: không phải chuyển lớp; không có lịch lớp mới để xếp)* | không |
| Lưu phân công GV, cặp có tích **"Tạo việc bàn giao"** (kể cả hiệu lực "Ngay hôm nay") | — | **có** — một việc mỗi lần lưu × lớp |
| Lưu phân công, cặp bỏ tích | — | không |

Sinh việc **cùng giao dịch** với lệnh / lưu phân công (lỗi thì cuộn cả request như `raLenh` đang làm — không nuốt lỗi, không có lệnh thiếu việc). Không thêm bước, không chặn: lệnh thi hành đúng thứ Hai dù việc chưa xong.
Móc đặt **trong `raLenh`** nên mọi đường ra lệnh đều theo một luật, gồm cả "Lộ trình mới" có tuần tương lai (`ss/loTrinh/buocTiep.ts:518`); "Học tiếp sau thi" luôn chuyển ngay → không việc. "Ngay hôm nay" xét **từng dòng** (`tuan === homNay`): lô lẫn hai kiểu thì chỉ dòng "Từ tuần …" sinh việc. Khôi phục lệnh (`khoiPhucLenh`) → mở lại việc đã tự đóng.

### 4.1 Việc TVV **"Báo PH · Chuyển lớp"**

- Là việc `viec_bao_ph` thường (N72 ⑤): cột nguồn mới trỏ lệnh chuyển (`lenh_chuyen_id`, duy nhất). Người làm **TVV của em**, không TVV → **Head chi nhánh**; TVV cùng chi nhánh / CX / Head làm được như mọi Báo PH.
- **Hạn:** luật Chủ nhật (4.6) tính từ ngày ra lệnh — **ngoại lệ của N2** (5 ngày) riêng cho nguồn này. Sửa được.
- **Theo dõi mặc định:** Head + CX chi nhánh + **người ra lệnh** (N72 ⑤: người tạo việc).
- **Nội dung máy điền** (đọc thẳng từ lệnh — một nguồn): lớp cũ → lớp mới · tuần bắt đầu (mã tuần `W1 DEC`) · GVCN lớp mới · hướng (Lên lớp / Học lại / Lên FT / Chuyển lớp) · lý do nếu người ra lệnh có ghi.
- **Form:** như mọi Báo PH — Kết quả (Đã báo PH / Chưa liên hệ được) · Ngày · Nội dung (tuỳ chọn). Bỏ việc → Khôi phục như Báo PH.
- **Dòng ở Công việc** (tab Báo PH của TVV): khuôn A — "Chuyển lớp · {lớp cũ} · n em" (một dòng mỗi lớp nguồn × lô), mở tại chỗ danh sách em.
- **Gộp với "Kết quả Final"** (một lần báo PH — tinh thần C8): tại một thời điểm, em **không có hai việc Báo PH còn mở** về Kết quả Final và Chuyển lớp. Việc sinh sau **nhập vào việc đang mở**: cùng một dòng `viec_bao_ph` mang cả hai nguồn, panel hiện cả hai khối bối cảnh (điểm Final + chuyển lớp), tên dòng "Kết quả Final · Chuyển lớp"; hạn = **hạn muộn hơn** của hai (không rút ngắn hạn đang có). Việc kia **đã xong** thì không gộp (tin mới, báo riêng).
- **Lệnh đổi / huỷ** *(session tự quyết, theo tiền lệ thu hồi N5 + `lam_lai_ban_giao`)*:

| Lệnh | Việc còn mở | Việc đã xong |
|---|---|---|
| Sửa lớp đích / tuần bắt đầu | nội dung tự đổi theo lệnh (đọc từ nguồn); hạn giữ | sinh việc **"Báo lại PH · Chuyển lớp"** (hạn theo 4.6 từ ngày sửa) |
| Huỷ lệnh | việc tự đóng, lý do "Lệnh chuyển lớp đã huỷ" | sinh **"Báo lại PH · Huỷ chuyển lớp"** |
| Sửa thành **"Ngay hôm nay"** | việc tự đóng (Q1: chuyển ngay không có việc) | **không sinh thêm** (PH đã biết em chuyển lớp; chỉ sớm hơn) |
| Em vào Lưu trữ | đóng như mọi việc (chủ SP 26/11, `dongLuuTru`) | — |

### 4.2 Việc BPXL **"Nhận thông tin · Chuyển lớp"**

- **Một việc mỗi lô × chi nhánh:** lô = các lệnh từ **một lớp nguồn** mà việc Nhận thông tin của lớp đó **còn mở** — Head chuyển lẻ 5 em cùng lớp trong một buổi thì em sau **thêm vào việc đang mở** (hạn giữ), không thành 5 việc; việc đã xác nhận rồi mới có lệnh nữa → việc mới. Dòng TVV "Chuyển lớp · {lớp cũ} · n em" gom cùng cách (mọi việc Báo PH · Chuyển lớp còn mở của lớp nguồn đó). Việc thuộc chi nhánh **lớp đích**; lô có em sang chi nhánh khác → chi nhánh nguồn cũng một việc (BPXL nơi đó bớt em).
- **Người làm mặc định:** **mọi BPXL của chi nhánh** (như Xếp lịch họp) — ai bấm trước thì xong cho cả nhóm; chi nhánh không có BPXL → **Head** *(session tự quyết: việc về lịch, không đưa TVV)*.
- **Hạn:** luật Chủ nhật (4.6). **Theo dõi mặc định:** người ra lệnh.
- **Panel** (khung việc base N72 ⑥): khối Phụ trách · Hạn · Theo dõi → Tuyến (4.7) → **bảng em**: Học viên · Lớp cũ → Lớp mới · Tuần bắt đầu · **Lịch Mock đã xếp** ("MT2 · W3 DEC · đi theo em" / "ở lại lớp cũ" / "huỷ" — đúng điều máy sẽ làm khi thi hành) → Việc con → Lịch sử → chân **một nút "Xác nhận đã nhận"**. Không ô nhập bắt buộc nào. Tên em, tên lớp là link xem (BPXL có quyền xem Học viên & Lớp — N57).
- **Xong:** bấm Xác nhận → ghi ai, lúc nào; Hoàn tác ngắn; ⋯ "Mở lại" sau đó.
- **Lệnh đổi / huỷ** *(session tự quyết)*: việc còn mở → bảng em tự đổi (hết em thì việc tự đóng) · việc đã xác nhận → **không mở lại, không thêm việc**: BPXL nhận một tin "Cập nhật" nêu em nào đổi gì.
- **Dòng ở Công việc** của BPXL: nhóm mới **"Nhận thông tin"** — "Chuyển lớp · {lớp nguồn} · n em" · hạn. Vào số việc như việc thật.

### 4.3 Việc BPXL **"Nhận thông tin · Đổi GV"**

- **Một việc mỗi lần lưu phân công × lớp**, gom các cặp có tích "Tạo việc bàn giao". Sinh lúc lưu (kể cả đổi "Từ tuần …").
- Người làm, hạn (4.6 từ ngày lưu), theo dõi (người lưu phân công), panel, nút Xác nhận: **như 4.2**. Bảng: Môn / kỹ năng · GV cũ → GV mới · Hiệu lực (Ngay hôm nay / mã tuần).
- Hoàn tác lưu phân công / Huỷ lịch đổi (`/phan-cong/hoan-tac`, `/phan-cong/cho/huy`): việc còn mở tự đóng; đã xác nhận → tin "Cập nhật". Đổi mốc (`/phan-cong/cho/doi-moc`): như sửa lệnh ở 4.2.
- Hộp Lưu phân công: ô tích giữ một, chữ thành **"Tạo việc bàn giao · báo BPXL"** (một tích hai việc — đúng lời chủ SP, không thêm ô).

### 4.4 Chuyển người làm / đổi hạn (áp cho MỌI việc có khung — sửa N58)

- **Ai đổi được** (Q3): người đang giữ việc · **người đã giao** (người đổi gần nhất — `giao_boi`; A → B → C thì A chỉ còn theo dõi) · Head · Quản trị · CX của chi nhánh việc — đổi người **và** đổi hạn. Người theo dõi chỉ xem. (Quyền sửa hạn riêng theo loại đang có — N34 ① — giữ.)
- **Cách đổi:** bấm ô Phụ trách (C7) → chọn người (bất kỳ ai có tài khoản ở chi nhánh, như N58) → lưu ngay, không bắt lý do, **Hoàn tác**, có lịch sử.
- **Sau khi đổi:** việc **rời danh sách** của người cũ; người cũ **tự vào Đang theo dõi**; người mới có **chuông** + việc hiện trong danh sách kèm nhãn "{tên} giao". Người mới chuyển tiếp được (là người đang giữ).
- **Việc thuộc nhiều người theo luật** (mọi BPXL chi nhánh — Xếp lịch họp, Nhận thông tin): một người chuyển cho một người cụ thể → việc **thuộc hẳn người đó**, rời danh sách các BPXL còn lại; **người chuyển vào theo dõi** (sửa chỗ hở hiện nay). "Về mặc định" trả việc về cả nhóm.
- Người nhận làm được **đúng việc đó** (như N58) — với Chốt / Xét lại lộ trình chỉ giao được cho người **có quyền chốt** (N63 ①: không CX); ô chọn người chỉ liệt kê người hợp lệ.

### 4.5 Phạm vi khung việc chung (Q4 — mở rộng N72 ⑥)

Khung = khối **Phụ trách · Hạn · Theo dõi** (ô bấm C7) + Mô tả tuỳ chọn + **Việc con** (N59, `tasks.cha_loai` / `cha_id`) + chuyển người (4.4) + lịch sử.

| Việc | Khung | Người làm mặc định · hạn |
|---|---|---|
| Báo PH · Chuyển lớp · Nhận thông tin (Chuyển lớp, Đổi GV) | **có** | 4.1–4.3 |
| Việc TVV: Chốt ngày thi · Chọn bước tiếp sau thi · Bổ sung hồ sơ thiếu · Cập nhật KQ thi thật | **có** | giữ N6 (TVV của em; không TVV → Head; hạn như nay, việc không hạn đặt hạn được) |
| Bàn giao chuyển lớp (GVBM câu môn · GVCN xác nhận) · Bàn giao đổi GV | **có** — khung gắn **đúng đơn vị việc đang có** ở Công việc (lớp · lớp × môn · một việc `ban_giao_gv`), không tách theo em | giữ (`hanBanGiaoLenh`, `hanBanGiaoGv`; Head làm thay như N64) |
| Việc quản lý của Head: Chốt lộ trình · Xét lại lộ trình · Xếp lịch MT còn thiếu | **có** | giữ (N20, N21, N57); Chốt / Xét lại chỉ giao cho người có quyền chốt |
| Chấm / nhập điểm / nhận xét Test | không | gắn GV dạy môn |
| Case / PA học thuật | không | theo GV môn, đổi qua Phân công GV (N29, N69) |
| Báo cáo PH tháng / đợt (N40) | không | gắn GV viết |
| Thẻ Chờ duyệt | không | quyền duyệt không chuyển |

Việc "có" **giữ nguyên** người làm mặc định, hạn, điều kiện xong; chỉ thêm khung. Việc được giao rời dòng của người mặc định, hạn đặt tay thắng hạn luật (như `xu_ly` ở BAOPH-0). Không thêm số việc / chuông ngoài tin giao việc N58.

### 4.6 Luật hạn Chủ nhật (Q2)

`hanChuNhat(ngaySinh)` (giờ VN, ngày nghiệp vụ `demoToday()`), hết 23:59 ngày hạn:

| Ngày sinh việc | T2 | T3 | T4 | T5 | T6 | T7 | CN |
|---|---|---|---|---|---|---|---|
| Hạn | CN tuần đó | CN | CN | CN | **T2** tuần sau | **T3** | **T4** |

Áp cho đúng: Báo PH · Chuyển lớp (và "Báo lại PH" của nó), Nhận thông tin · Chuyển lớp, Nhận thông tin · Đổi GV. Việc khác giữ hạn đang có. Ô hạn bấm sửa được; tô màu theo NH4.

### 4.7 Tuyến (N72 ①–④ áp sang)

Hai loại tuyến mới trong `dungTuyen` (TUYEN-0), cùng khối `KhoiTuyen`:

```
Tuyến · Chuyển lớp · Trịnh Ngọc Ánh · MB BE 04 → MB ELE 02
✓ Lệnh chuyển lớp          Nguyễn Khánh Vy · 16/09/2026
● Bàn giao                 Trần Ngọc Hà · hạn 22/09/2026     ┐
● Báo PH                   Phan Mai · hạn 20/09/2026         │ cùng lúc
✓ Nhận thông tin (BPXL)    Lương Thu Trang · 17/09/2026      ┘
○ Vào lớp mới              W4 SEP · máy tự chuyển
```

- **Chuyển lớp** (tuyến của một em = lệnh của em đó; **Đang theo dõi một dòng mỗi lô** — "Chuyển lớp · MB BE 04 · 12 em · còn 3 em chưa báo PH", mở ra chuỗi chấm từng em — danh sách không dài theo số em): Lệnh → [Bàn giao · Báo PH · Nhận thông tin, cùng lúc] → Vào lớp mới (máy, thứ Hai tuần bắt đầu — **không chờ** ba việc kia). Panel lô của BPXL: chuỗi chấm từng em.
- **Đổi GV** (khoá = lần lưu × lớp): Lưu phân công → [Bàn giao (GV cũ) · Nhận thông tin, cùng lúc].
- Làm xong phần mình → tự theo dõi tuyến (N72 ①); nội dung theo quyền sẵn có (N72 ④): BPXL không đọc nội dung Báo PH / câu bàn giao, chỉ thấy khung bước.

## 5. Luật mới — **chờ chủ SP duyệt** (đề xuất số N73; PTA Plan ghi vào `plan.md` 1.6 khi duyệt đặc tả)

**N73 · Việc liên phòng ban TVV / BPXL (chủ SP 26/11):** ① **Chuyển lớp** — mọi lệnh có lớp đích, thi hành "Từ tuần …" (lẻ · Cuối khoá · Xét lại) sinh ngay lúc ra lệnh: việc TVV **"Báo PH · Chuyển lớp"** (một loại với mọi Báo PH — N72 ⑤; nội dung máy điền; em không TVV → Head) + việc BPXL **"Nhận thông tin · Chuyển lớp"** (một việc mỗi lô, **một nút Xác nhận**); **chuyển "Ngay hôm nay" không sinh việc**; không chặn / không làm chậm lệnh · em có việc Báo PH "Kết quả Final" đang mở → **gộp một việc**, hạn muộn hơn · lệnh sửa / huỷ: việc mở tự đổi / tự đóng; TVV đã báo → "Báo lại PH"; BPXL đã xác nhận → chỉ tin "Cập nhật" · ② **Đổi GV** — cặp có tích "Tạo việc bàn giao" sinh thêm việc BPXL **"Nhận thông tin · Đổi GV"** (một việc mỗi lần lưu × lớp, một nút Xác nhận) · ③ **Hạn Chủ nhật** cho ba việc trên: sinh T2–T5 → CN tuần đó; **T6 → T2, T7 → T3, CN → T4** tuần sau (ngoại lệ N2 cho nguồn chuyển lớp); sửa được · ④ **Chuyển người / đổi hạn (sửa N58):** người đang giữ · **người đã giao** · Head · Quản trị · CX; người theo dõi chỉ xem; đổi người → việc rời danh sách người cũ, người cũ tự theo dõi, người mới có chuông + việc trong danh sách; việc của cả nhóm BPXL chuyển cho một người thì thuộc hẳn người đó, người chuyển vào theo dõi; Hoàn tác, không bắt lý do · ⑤ **Khung việc chung (mở rộng N72 ⑥):** thêm việc TVV (Chốt ngày thi · Chọn bước tiếp sau thi · Bổ sung hồ sơ thiếu · Cập nhật KQ thi thật), Bàn giao (chuyển lớp · đổi GV), việc quản lý của Head (Chốt lộ trình · Xét lại lộ trình · Xếp lịch MT còn thiếu — Chốt / Xét lại chỉ giao cho người có quyền chốt) — giữ người làm mặc định + hạn theo luật cũ, có Việc con; **ngoài khung:** chấm / nhập điểm / nhận xét Test, Case / PA học thuật, Báo cáo PH tháng / đợt, thẻ Chờ duyệt · ⑥ BPXL thêm nhóm việc "Nhận thông tin" (sửa N57 "BPXL chỉ có việc Xếp lịch họp + Việc được giao + Đang theo dõi").

## 6. Quan hệ với N72 / BAOPH-0 / TUYEN-0

| PR | Trạng thái 26/11 | Phần việc này dựa vào | Chồng lấn — cách xử lý |
|---|---|---|---|
| **BAOPH-0 #2233** | MỞ, chưa merge | `viec_bao_ph` mọi nguồn + `theoDoiVaiBaoPh` mọi việc · nguồn "Kết quả Final" (`phoi_hop_id` → dòng `bao_ph_tvv`) để gộp 4.1 · `LOAI_GIAO` + mẫu `xu_ly` (bảng phụ chỉ có dòng khi đã giao) cho 4.5 · việc con `tasks.cha_loai` / `cha_id` | cùng tệp `giaoViec.ts`, `baoPhTvv.ts`, `schema.sql`, `mywork.ts` → **LPB-0 chỉ bắt đầu sau khi #2233 merge** |
| **TUYEN-0 #2231** | MỞ, chưa merge | `dungTuyen` + `GET /tuyen/:loai/:khoa` + theo dõi theo tuyến để thêm loại `chuyen_lop`, `doi_gv` (4.7) | cùng tệp `yThuc/tuyen.ts`, `tocDoDuong.ts` → sau khi #2231 merge |
| TUYEN-1…4 (web, chưa giao) | — | `KhoiGiaoViec` ô bấm (C7), `KhoiTuyen`, Việc con trên web | web của việc này (LPB-2, LPB-3) **sau TUYEN-1**; không vẽ lại thành phần |

Không sửa điều gì N72 đã chốt; N73 ④ là phần thêm vào quyền đổi người của N58 / N72 ⑥ (thêm "người đã giao" + trường hợp việc của cả nhóm).

## 7. Mockup cần vẽ — `thiet-ke/v28/viec-lien-phong-ban.html` (+ ghi chú, ảnh)

Nền: v27 (`v27.css`, `v24-chep.css`: khuôn A, panel 720, khối việc ô bấm, `KhoiTuyen`) — không màu / cỡ chữ mới. Dữ liệu bịa theo seed v27 (thứ Tư 16/09/2026; MB BE 04 → MB ELE 02; Head Nguyễn Khánh Vy · TVV Phan Mai · BPXL Lương Thu Trang + một BPXL thứ hai · GVCN Trần Ngọc Hà). Mỗi khung **1440 tối + 375 sáng**, ảnh **cả màn** (danh sách + panel).

| Khung | Vẽ | Trạng thái phải có |
|---|---|---|
| L1 | Head · panel **Chuyển lớp** + hộp **Lưu phân công** | dòng "Sẽ giao: TVV báo PH · BPXL nhận thông tin · hạn CN 20/09/2026" · chọn "Ngay hôm nay" → dòng đó mất · ô tích "Tạo việc bàn giao · báo BPXL" bật / tắt |
| L2 | TVV · tab **Báo PH** có dòng "Chuyển lớp · MB BE 04 · 12 em" mở tại chỗ + panel một em | nội dung máy điền · em **gộp** "Kết quả Final · Chuyển lớp" (hai khối bối cảnh) · em không TVV ở Head · "Báo lại PH · Huỷ chuyển lớp" · Chưa liên hệ được |
| L3 | BPXL · Công việc nhóm **"Nhận thông tin"** + panel **Chuyển lớp** (lô 12 em) | bảng em + lịch Mock (đi theo / ở lại / huỷ) · khối việc "Phụ trách: BPXL chi nhánh (2)" · nút Xác nhận đã nhận · đã xác nhận + Hoàn tác · lô 1 em · rỗng · lỗi lưu |
| L4 | BPXL · panel **Đổi GV** | 2 cặp, hiệu lực "Ngay hôm nay" / mã tuần · lịch đổi đã huỷ (việc tự đóng) |
| L5 | **Chuyển người**: BPXL A bấm ô Phụ trách → hộp chọn → sau lưu | toast Hoàn tác · danh sách A (việc rời, sang Đang theo dõi) · BPXL B: chuông + dòng "{A} giao" · ô hạn bấm sửa (bảng hạn T2…CN) · người theo dõi: ô chữ trơn, không bấm |
| L6 | **Khung chung** trên việc cũ: TVV · Chốt ngày thi · GVCN · Bàn giao chuyển lớp · Head · Chốt lộ trình | khối việc + Việc con · ô chọn người Chốt lộ trình chỉ có người có quyền chốt |
| L7 | **Tuyến** Chuyển lớp / Đổi GV + tab **Đang theo dõi** (Head) | ✓ ● ○ · ba việc "cùng lúc" · BPXL không đọc nội dung Báo PH · "Vào lớp mới · máy tự chuyển" |

Rà mockup: bảng ý (mục 2, 4) → khung · `impeccable critique` + `ui-ux-pro-max` · cột cân hết bề ngang · soi ✕ / ⋯ ≤ 1 px · không chú thích tĩnh (giải thích qua ⓘ; giữ lưu ý hậu quả "Sẽ giao…").

## 8. Kế hoạch PR (PTA Plan giao sau khi mockup duyệt; mọi PR skill `karpathy-guidelines`, ponytail)

| PR | Phạm vi | Model · effort |
|---|---|---|
| **LPB-0** (máy chủ; sau #2233 + #2231 merge) | `hanChuNhat` (`sd`) + phép kiểm 7 thứ · nguồn chuyển lớp ở `viec_bao_ph` (sinh theo `raLenh`, không sinh khi `chuyenNgayCoHoanTac` / xếp lớp lần đầu / không lớp đích; sửa / huỷ lệnh; gộp Kết quả Final hai chiều; Báo lại PH; Lưu trữ; xoá HV) · việc "Nhận thông tin" (bảng mới nhỏ, loại mới trong `LOAI_GIAO`, lô × chi nhánh, mọi BPXL → Head, Xác nhận / Hoàn tác / Mở lại, sinh theo lệnh + theo `tao_ban_giao`) · N73 ④ (`coTheDoiNguoi` thêm người giao; việc cả nhóm → người chuyển vào theo dõi, áp cả Xếp lịch họp) · tuyến `chuyen_lop`, `doi_gv` · `/my-work` nhóm mới · trần `tocDoDuong.ts`, đo trước → sau (`raLenh` cả lớp: sinh việc theo lô, không N+1) · thử trên `mig.sqlite` | Opus 5.5 · high (B: Sonnet 5.5 · high) · `/code-review high` khi rà |
| **LPB-1** (máy chủ; sau LPB-0) | 4.5: thêm vào `LOAI_GIAO` việc TVV (4 loại), Bàn giao (2), việc Head (3) theo mẫu `xu_ly`; người được giao làm được đúng việc (mở quyền ở từng hàm ghi, không rộng hơn việc đó); Chốt / Xét lại chỉ nhận người có quyền chốt; việc con; `/my-work` việc đã giao rời dòng người mặc định; Lưu trữ / xoá | Opus 5.5 · high · `/security-review` + `/code-review high` (đụng quyền) |
| **LPB-2** (web; sau TUYEN-1 + LPB-0) | L1–L5, L7: panel Nhận thông tin (2 loại), dòng + bối cảnh Báo PH · Chuyển lớp, dòng "Sẽ giao…" ở panel Chuyển lớp, chữ ô tích Lưu phân công, chuyển người việc cả nhóm | Opus 5.5 · medium (B: Sonnet 5.5 · high) · `/ponytail lite`, impeccable `layout` `harden` `audit` + `web-design-guidelines` |
| **LPB-3** (web; sau LPB-1 + LPB-2) | L6: khối việc + Việc con trên panel việc TVV, Bàn giao, việc Head | như LPB-2 |

PR giao diện: một màn một PR nếu đổi bố cục, bảng truy vết khung → thành phần → ảnh, ảnh cặp cả màn 1440 / 1280 / 375, cổng ≥ 90 % KHỚP, chủ SP duyệt ảnh trước merge; bảng thao tác TRƯỚC → SAU (giữ mọi thao tác cũ: Làm thay bàn giao, Sửa / Huỷ lệnh, Hoàn tác chuyển ngay, Hoàn tác phân công…).

## 9. Để người làm tự quyết

- Tên bảng / cột của việc "Nhận thông tin" và cách lưu khung cho 9 loại ở LPB-1 (một bảng phụ chung hay theo loại) — chọn cách ít đổi, giữ Hoàn tác.
- Khoá "lô" của lệnh chuyển (cột lô sẵn có ở `raLenh(…caLop)` hay khoá mới).
- Cách lưu việc gộp Kết quả Final + Chuyển lớp (một dòng hai cột nguồn, hay cách khác) miễn đúng luật 4.1.
- Chữ tin "Cập nhật" — ngắn, theo bảng thuật ngữ; tin khi sinh việc theo đúng cách việc cùng loại đang làm (Báo PH, Xếp lịch họp), không thêm kiểu tin.
