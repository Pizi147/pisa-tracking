# v4d — Tạo Case nhiều kỹ năng · Thông báo / nhắc việc (rà bổ sung vòng 4, 21/10/2026)

> Agent v4d (Opus 5.5) cho PTA Plan. Chỉ đọc: mã `main` (worktree plan-ux-danh-gia), web demo http://localhost:5173 (ngày demo 14/09/2026), DB demo `{readonly:true}`. Không bấm Lưu / Tạo Case / Đánh dấu đã đọc.
> Ghi chú: mọi lần tải trang (kể cả `GET /notifications` của công cụ đọc) máy chủ tự đồng bộ 3 loại thông báo tự động OV-15d — đây là hành vi sẵn có của trang, không phải thao tác lưu.
> Hai ý mới của chủ SP 21/10: **ý 1 = (A) yêu cầu đã chốt** (FB-4-35) · **ý 2 = (B) góp ý GV trung tâm, chưa chốt** (FB-4-36).

## Tóm tắt 8 dòng

1. **Case nhiều kỹ năng làm được, không đổi luật nào**: mỗi kỹ năng vẫn một Case (một em × một hạng mục); chỉ thêm "chọn nhiều kỹ năng → lưu một lần ra n Case". Luật tạo Case đã cho mọi GV có phân công trong lớp tạo Case **mọi môn** (Rb §20.9) — không vướng quyền.
2. Nhu cầu có thật: **33/73 cặp GV × lớp (45 %) GV dạy ≥ 2 kỹ năng** (DB demo: Cô Hà L·R ở 6 lớp; Thầy Khoa L·R·W ở 4 lớp FOU/BE).
3. Nay 2 kỹ năng = **16 bấm + 4 lần gõ, 2 lần mở panel, 2 lần lưu** (hồ sơ lớp 20 + 6 vì chọn lại em). Khuyến nghị **C1** (chip chọn nhiều + thẻ riêng mỗi kỹ năng, phần chung nhập một lần, một giao dịch): **13 bấm + 4 gõ, 1 lần lưu**; 3 kỹ năng 24 → 18 bấm.
4. Lỗi mới (D): nút **"+ Case cho Listening"** ở bảng kỹ năng hồ sơ HV mở form **không chọn sẵn kỹ năng** (`StudentDetailPage.tsx:334` bỏ tham số).
5. **Chuông hiện là nhật ký sự kiện, không phải danh sách việc**: GV 7 có 9 việc quá hạn của mình — chuông "Cần làm" chỉ chứa **1**, **5** nằm ở "Để biết", **3** không có dòng nào (Kết quả PA, Ghi nhận / Xử lý vi phạm). Cùng màn có **4 con số khác nhau**: Công việc ⚠10 · "19 việc đến hết W3 SEP" · Thông báo 39 · Cần làm 18.
6. Gốc: "Cần làm" đoán theo danh sách `kind` cứng (`duongHoSo.ts:150-158`) chứ không đọc từ danh sách việc → loại mới quên thêm (A1-04 đã biết), loại không tính được "còn việc" kẹt mãi ở Cần làm (8 dòng "SOS n · em" của GVCN), việc không phát thông báo không bao giờ vào chuông.
7. Khuyến nghị **N2 — chuông = hộp "Nhắc việc" một nguồn**: khối Cần làm đọc **cùng hàm** với hàng đợi trang đầu của vai (GV Công việc · QL Cần bạn quyết · TVV Việc của bạn), số trên nút = số dòng đó; khối Để biết = tin một chiều. Làm 2 bước: vá ở GĐ1 SL1 (N1) → N2 ở M2. Không thêm trang / panel, không tick "xong" tay, không tự bật hộp khi đăng nhập.
8. **Không có câu PHẢI HỎI mới** — ý 1 là yêu cầu đã chốt (cách làm = UX), ý 2 là UX / IA. PTA tự quyết 5 mục (A20, B16, C21–C23), chủ SP phủ quyết nếu không đồng ý.

---

## Vấn đề 1 — Tạo Case nhiều kỹ năng trong một panel (FB-4-35 · loại A · P1 · GV, GVCN, QL)

**(1) Ở đâu.** Một panel "Tạo Case" dùng chung (`web/src/modules/cases/QuickReport.tsx`, 621 dòng), 4 lối mở tay:

| Lối | Mã | Ghi chú |
|---|---|---|
| Hồ sơ HV — nút "+ Case" đầu trang | `StudentDetailPage.tsx:243` → `:413` | em đã biết |
| Hồ sơ HV — bảng kỹ năng, hàng mở rộng "+ Case cho {kỹ năng}" | `SkillBoard.tsx:294` → `StudentDetailPage.tsx:334` | **lỗi: không chọn sẵn kỹ năng** |
| Hồ sơ lớp — đầu trang "+ Case" | `DauTrangLop.tsx:181` → `ClassOverviewPage.tsx:173` | có ô chọn học viên |
| Hồ sơ lớp — ⋯ dòng em | `thaoTacDongHocVien.tsx:129` | em đã biết |

Không có lối tạo Case tay ở Công việc, Test, Tổng quan. Case **tự động** (SOS Mock `taoCaseTuDong` `server/src/cases/sos.ts:627`; Giữa khoá lớp thường `server/src/normal/regular.ts:1007`; kỳ vọng cuối khoá `server/src/normal/kyVong.ts:202`) đã tạo một Case cho **mỗi** kỹ năng trượt — không đụng. Máy chủ: `POST /cases/report` → `reportIssue` (`server/src/cases/cases.ts:463-739`).

**(2) Biểu hiện.** Ô "Kỹ năng" là hàng nút **chọn một** (`QuickReport.tsx:400-412`, `chon={topic === k}`): bấm R thì L tắt (ảnh `gv7-case-hv--chon-l` → `--chon-r`). Lưu xong panel đóng, form xoá sạch (`reset()` `:220`) → kỹ năng thứ hai phải mở lại panel, chọn lại mức độ, chọn lại tệp; ở hồ sơ lớp còn phải gõ lại tên em. "+ Case cho Listening" mở form với "Nhóm nguyên nhân: Chọn kỹ năng trước" (ảnh `gv7-case-cho2--form`).

**(3) Bằng chứng.**
- Ảnh: `gv7-case-hv--form`, `--chon-l`, `--chon-r` (FT: L · R · W1 · W2 · S) · `gv8-case-lt--form` (lớp thường FOU: L · R · G+V · P) · `gv7-case-lop--form` (hồ sơ lớp, ô học viên) · `gv7-case-cho2--mo-hang`, `--form` · `gv7-case-hv-375--form`.
- Luật trong mã: `reportIssue` nhận **một** `topic`; bắt buộc Tên ≥ 6 (`:530-534`), Mô tả ≥ 15 (`:535-538`), kỹ năng (`:564-574`), nhóm nguyên nhân thuộc bộ của kỹ năng đó (`:593-603`); mức độ 2 bậc (`:541-544`); chống gửi đôi `idempotency_key` (`:548-550`); Case chờ xác nhận cùng kỹ năng → chặn, dẫn sang Xác nhận Case (`:617-627`, K3-23); Case mở cùng hạng mục → trả `duplicateCase`, người dùng chọn "Ghi vào Case đang có" / "Vấn đề khác, mở Case riêng" (`:629-676`, mục 7.13); người phụ trách = GV dạy đúng kỹ năng, chưa có thì GVCN (`suggestCaseOwner`, `server/src/cases/owner.ts:18-45`). Quyền: `SOS_REPORT` theo **phạm vi lớp / em, không theo kỹ năng** (`:513-519`). Khoá trùng theo **hạng mục** (`caseDedupKey`, `shared/domain/cases.ts:224-231`) — W1, W2 là hai hạng mục.
- Bằng chứng tệp gắn nhiều bản ghi đã có: `taiTepCho(tep, { ownerIds: [...] })` + `/attachments/chep` (`web/src/ui/TepCho.tsx:144-162`) — đang dùng cho Ghi vi phạm nhiều em.
- DB demo (chỉ đọc): 33/73 cặp GV × lớp có ≥ 2 kỹ năng; Case tạo tay (`teacher_report`) 9, trong đó **4 người tạo ≠ người phụ trách**.

**(4) Nguyên nhân.** Thiết kế: luật đúng "một Case = một em × một hạng mục" (Rb §4.1, §18.2; chú thích `shared/domain/cases.ts:52-64`) được làm thành "một lần tạo = một Case" (API một `topic`, form một kỹ năng). Lỗi "+ Case cho": `onReport={… ? () => setReportOpen(true) : …}` bỏ `category`; `QuickReport` không có prop kỹ năng ban đầu (triển khai).

**(5) Ảnh hưởng.** Cô Hà (GVCN MB FT 101, dạy L·R) thấy em X yếu cả L và R:

| | Hồ sơ HV | Hồ sơ lớp |
|---|---|---|
| Một Case | + Case 1 · kỹ năng 1 · nguyên nhân 2 (mở + chọn) · mức độ 1 · Tên 1 + gõ · Mô tả 1 + gõ · Tạo Case 1 = **8 bấm + 2 gõ** | + 2 (ô em: bấm, gõ, chọn) = 10 + 3 |
| Hai kỹ năng (nay) | **16 bấm + 4 gõ · 2 lần mở · 2 lần lưu · chọn tệp 2 lần** | **20 + 6** |
| Ba kỹ năng (Thầy Khoa L·R·W) | 24 + 6 | 30 + 9 |

Nguy cơ: bỏ kỹ năng thứ hai ("để mai tạo"); "+ Case cho Reading" mở form trống → chọn nhầm kỹ năng.

**(6) Phương án.**

| | Nay | **C1 — chip chọn nhiều + thẻ mỗi kỹ năng (khuyến nghị)** | C2 — mô tả chung, chỉ nguyên nhân + tên riêng | C3 — giữ một kỹ năng, thêm "Lưu và tạo cho kỹ năng khác" |
|---|---|---|---|---|
| Bấm + gõ · 2 kỹ năng, hồ sơ HV | 16 + 4 | **13 + 4** | 12 + 3 | 14 + 4 |
| Hồ sơ lớp | 20 + 6 | **15 + 5** | 14 + 4 | 16 + 5 |
| 3 kỹ năng, hồ sơ HV | 24 + 6 | **18 + 6** | 16 + 4 | 20 + 6 |
| Lần lưu / mở panel / chọn tệp | 2 / 2 / 2 | **1 / 1 / 1** | 1 / 1 / 1 | 2 / 1 / 1 |
| "Đồng thời trên một panel" (yêu cầu chốt) | ✗ | ✓ | ✓ | ✗ (lần lượt) |
| Mỗi Case mô tả đúng kỹ năng của nó | ✓ | ✓ | ✗ — Case Reading mang chữ về Listening; GV môn kia đọc lẫn | ✓ |
| Một kỹ năng | — | y như nay | y như nay | y như nay |

**Ưu tiên C1.** Đúng chữ yêu cầu; giữ chất lượng Case (Rb §4.1: tên + mô tả nói đúng vấn đề — người đọc sau là GV môn đó); tiết kiệm phần lặp (em, mức độ, tuần, tệp, mở / lưu). C2 tiết kiệm thêm 1 bấm + 1 lần gõ nhưng làm bẩn dữ liệu Case. C3 không đáp ứng "đồng thời".

**C1 chi tiết** (theo hệ panel 04 mục 9 — vỏ panel bậc 3, chip HTT-5, báo lưu HTT-10; thang làm tại chỗ: panel bậc 3 vì 3–6 ô + bối cảnh):
- **Kỹ năng\***: chip **chọn nhiều** (HTT-5: nền nhấn + viền + "✓"). **Không chọn sẵn** (chọn sẵn "kỹ năng tôi dạy" dễ tạo Case thừa — Case có hạn PA 5 / 3 ngày, xoá phải làm thêm). Mở từ "+ Case cho Reading" → chọn sẵn Reading (sửa lỗi). Dưới chip kỹ năng người xem dạy: chữ nhỏ "bạn dạy" (biết Case sẽ về mình hay về GV khác).
- **Phần chung — nhập một lần**: Học viên (lối hồ sơ lớp) · Mức độ\* (Bình thường / Gấp — một mức cho cả lô; khác thì sửa từng Case sau, `suaCase` đã cho) · Bắt đầu theo dõi · Bằng chứng (tải sau khi có id, gắn **mọi** Case bằng `/attachments/chep` sẵn có).
- **Phần riêng — một thẻ mỗi kỹ năng** (theo thứ tự chip; dùng `Khoi` + `Truong` sẵn có): đầu thẻ "Reading · phụ trách: Trần Ngọc Hà" · Nhóm nguyên nhân\* (+ Ghi rõ khi "Khác") · Tên Case\* · Mô tả và dẫn chứng\*. Bỏ chip → thẻ ẩn, chữ đã gõ giữ tới khi đóng panel (không mất chữ đang gõ).
- **Nút chính** nói đúng đầu ra: "Tạo 2 Case" · "Tạo 1 Case · ghi thêm 1".
- **Ghi bù "Đã xong từ trước"** giữ **một** kỹ năng (ít dùng, chỉ môn mình dạy — C02; nhiều PA + kết quả mỗi kỹ năng sẽ rất dài).
- Pre FOU chỉ "Tổng hợp" → một chip, không đổi. Lớp thường theo bộ môn của chương trình (FOU L · R · G+V · P; PET / KET môn gộp) — lấy từ `case-topics`, không tự đoán.

**Lô lỗi một phần — biết sớm, lưu một giao dịch:**

| Tình huống | Khi nào biết | Xử lý |
|---|---|---|
| Kỹ năng đang có Case **chờ xác nhận** (K3-23) | ngay khi chọn chip (đã có `choNguyenNhan`) | thẻ kỹ năng chỉ còn "Reading đang có Case chờ xác nhận (MT2 · SOS 1) · Mở form Xác nhận Case"; kỹ năng đó **không vào lô**; nút đổi "Tạo 1 Case" |
| Kỹ năng đã có **Case mở cùng hạng mục** (7.13) | ngay khi chọn chip — `case-topics` trả thêm `dangMo[kỹ năng]` | dòng vàng trên thẻ (tên Case, mở tuần nào, n PA) + 2 lựa chọn: **Ghi vào Case đang có** (mặc định như nay — thẻ còn Mô tả) · Vấn đề khác, mở Case riêng; quyết trước khi bấm, **không còn vòng lỗi 400** |
| Một thẻ thiếu ô | bấm nút | lỗi dưới ô + chân "2 ô cần sửa ↑" (mẫu `useLoiForm` sẵn có), không gửi |
| Máy chủ từ chối một kỹ năng (người khác vừa tạo Case cùng hạng mục, mất quyền) | sau gửi | **không tạo Case nào** (một giao dịch); chữ giữ nguyên; lỗi trên đúng thẻ; gửi lại |
| Mạng đứt sau khi máy chủ đã lưu | bấm lại | khoá chống gửi đôi theo lô + kỹ năng → trả lại các Case đã có, không trùng |
| Tệp lỗi | sau lưu | Case đã lưu; bước "Đã lưu" như nay, "Thử lại" gắn cho mọi Case |

Vì sao "tất cả hoặc không" thay vì "lưu phần đúng": chỉ một trạng thái để hiểu ("chưa lưu gì" / "đã lưu cả n"), không phải vẽ form nửa lưu nửa chưa; kiểm sớm đã loại gần hết lỗi; khớp luật "không báo xong khi chưa lưu".

**Sau lưu:** toast "✓ Đã tạo 2 Case · Listening, Reading" + "Thêm PA" (khi người tạo là người phụ trách) mở Case đầu; Case còn lại ở Công việc › Case học thuật (tự sang việc kế). Người phụ trách khác người tạo → chuông (vấn đề 2, 4.7 C23).

**Máy chủ (nhỏ):** `POST /cases/report` nhận thêm `kyNang: [{ topic, primaryCode, observation, title, summary, gop?: 'ghi-vao' | 'rieng' }]` (≤ số kỹ năng của chương trình) + phần chung; tách thân `reportIssue` thành hàm không tự mở `tx`, gọi n lần trong **một** `tx`; `GET /students/:id/case-topics` trả thêm `dangMo` + `phuTrach` theo kỹ năng. Không đổi bảng, không migrate.

**(7) Xuyên trang / vai.** Một panel cho hồ sơ HV + hồ sơ lớp. Mỗi Case sinh việc "Thêm PA" cho người phụ trách của nó (Công việc GV; Tổng quan QL "Case chưa chốt PA" +n). Phân tích đếm Case theo kỹ năng không đổi (n Case độc lập). GVCN tạo Case cho môn mình không dạy → Case về GV môn đó (đúng luật), người đó cần được báo (vấn đề 2).

**(8) Luật.** Rb §4.1 (tên + mô tả + phân loại bắt buộc; nhiều Case song song có chủ ý; nghi trùng thì gợi ý ghi vào Case cũ) · §4.2 / §18.2 / §19 (hạn có PA 5 ngày Bình thường, 3 ngày Gấp) · §20.9 (Tạo Case: QL + mọi GV có phân công trong lớp, **bất kỳ môn**; PA / kết quả: GV đúng kỹ năng — C02) · 7.13 cảnh báo trùng · K3-23 Case chờ xác nhận · OV-11d ghi bù chỉ môn mình dạy · `suggestCaseOwner` (owner chốt mục 2.3). **Không luật nào đổi.**

**(9) Cách kiểm thử.**
- Phép kiểm máy chủ (`server/src/tests/caseLo.tests.ts`, đỏ trước / xanh sau): 2 kỹ năng → 2 Case, mỗi Case người phụ trách = GV môn đó, hạn đúng mức · một kỹ năng trùng chọn "Ghi vào" → 1 Case mới + 1 ghi thêm, không bản thứ hai · kỹ năng chờ xác nhận gửi lên → 400, **0** Case · một thẻ Tên < 6 → **0** Case, lỗi theo kỹ năng · gửi lại cùng khoá → không trùng · GV ngoài lớp → 403 cả lô · tệp gắn đủ n Case.
- Bấm thử (demo riêng, được Lưu): GV 7, hồ sơ em 5 tạo L + R; GVCN 10 tạo W2 + S (S về GV 9 — kiểm chuông GV 9); hồ sơ lớp chọn em rồi 2 kỹ năng; "+ Case cho Reading" chọn sẵn R; 375.
- Ảnh trước / sau 1440 tối + 375 sáng: 1 kỹ năng (phải **giống hệt** nay), 2 kỹ năng, kỹ năng trùng, kỹ năng chờ xác nhận, lỗi lưu.

**(10) Cần chủ SP?** Không — yêu cầu đã chốt; cách làm là UX (PTA tự quyết, 4.7 B16 + C21). Để chủ SP biết: không chọn sẵn kỹ năng; mức độ chung một lần; mô tả riêng từng kỹ năng; ghi bù vẫn một kỹ năng; một giao dịch.

---

## Vấn đề 2 — Thông báo / nhắc việc "như Base" (FB-4-36 · loại B · P1 · mọi vai có việc)

**(1) Ở đâu.**
- Nút "Thông báo n" thanh trên (375: chuông + số) → hộp thả 416 px (375: tấm rộng, cao ≤ 70 vh) — `web/src/modules/platform/Header.tsx:211-288`. Hai nhóm "Cần làm" / "Để biết" (`nhomThongBao`, `shared/domain/duongHoSo.ts:150-158`), "Đánh dấu đã đọc" cả hộp, bấm dòng = đánh dấu đọc + đi tới `duongThongBao` (`:204-…`).
- Dữ liệu: `GET /notifications` (`server/src/routes/index.ts:2565`) → `thongBaoCua` (`server/src/platform/thongBao.ts`, 50 dòng, chưa đọc trước; `con_viec` tính cho một số loại) + đồng bộ 3 loại tự động OV-15d (`cham_qua_han`, `case_chua_chot_pa`, `chot_lo_trinh`) khi mở chuông, ≤ 1 lần / 5 phút / người (`server/src/platform/thongBaoTuDong.ts`). ~40 `kind` từ 36 chỗ gọi `notify(` ở máy chủ.
- Cùng lúc còn 2 chỗ báo việc: badge menu "Công việc n" (`web/src/App.tsx:155`: GV = `summary.overdue`; QL = thẻ chờ duyệt) và dòng đầu trang Công việc "⚠10 quá hạn · 19 việc đến hết W3 SEP".

**(2) Biểu hiện (đo trên demo 14/09).**

| Vai | Nút chuông | Cần làm | Để biết | Công việc / trang đầu | Lệch đáng chú ý |
|---|---|---|---|---|---|
| GV 7 (Hà) | **39** | 18 | 21 | ⚠10 · 19 việc tuần này · 26 việc của tôi | 9 việc quá hạn của Hà: **1** ở Cần làm, **5** "Quá hạn chấm" ở Để biết, **3** không có dòng (Kết quả PA Reading · Ghi nhận vi phạm · Xử lý vi phạm). Cần làm có **8** dòng "SOS n · em · MT1" (tin cho GVCN — không có việc, không bao giờ rời nhóm). Case 56 hai dòng (Xác nhận Case — Cần làm; Case chưa chốt PA quá hạn — Để biết) |
| GV 10 (Linh) | 9 | 1 | 8 | 11 việc, 5 quá hạn | 4 "Quá hạn chấm" + 1 Case quá hạn ở Để biết |
| QL 2 (Vy) | 30 | 13 | 17 | "Chờ duyệt 10", menu "Công việc 10" | 6 "Chốt lộ trình … quá hạn 8–29 ngày" ở Để biết; 7 thẻ đã duyệt vẫn chưa đọc |
| TVV 23 | 0 | 0 | 0 | không việc | sau luật 1, việc TVV phải vào chuông |

Mỗi dòng 3–5 hàng chữ, chỉ có giờ tạo ("Ghi nhận 20/10 15:11"), **không có hạn**, không sắp theo hạn; tiêu đề nhóm IN HOA 11,5 px; mọi dòng chưa đọc (đậm + chấm).

**(3) Bằng chứng.** Ảnh `gv7-chuong--mo` (Cần làm 18, dòng đầu là thẻ bị từ chối), `gv7-chuong--qua-han` ("ĐỂ BIẾT 21" mở đầu bằng "Case chưa chốt PA quá hạn" + "Quá hạn chấm · MB FT 101 … quá hạn 5 ngày"), `gv7-chuong-375--mo`, `gv10-chuong--mo`, `ql2-chuong--chot`, `tvv23-chuong--mo`. Dữ liệu: `scratchpad\chup\v4d-tb.mjs` (đọc `GET /notifications` + `/my-work` 5 vai), `v4a-mywork-gv7.txt`. Mã: `LOAI_CAN_LAM` thiếu 3 loại tự động (`duongHoSo.ts:150-155`) trong khi `thongBao.ts:39-40` ghi "luôn là Cần làm"; `kind='sos'` + `entity_type='assessment_attempt'` không có nhánh `con_viec` (`thongBao.ts:38-58`) — gửi từ `notifyTeachers` (`server/src/cases/sos.ts:805-819`); Case MT bỏ chuông Xác nhận (OV-12c, `server/src/cases/sosAuto.ts:150`); `reportIssue` không báo người phụ trách khi người tạo khác. Trùng phát hiện cũ: A1-04, A7-05, A7-15 (phụ lục a1, a7), 9.2-4.

**(4) Nguyên nhân.** Thiết kế: chuông là **nhật ký sự kiện** (mỗi `notify` một dòng lưu), "Cần làm" **đoán theo danh sách `kind` cứng** thay vì đọc từ danh sách việc. Hệ quả: (a) loại mới quên thêm vào danh sách (A1-04); (b) loại không tính được "còn việc" kẹt mãi ở Cần làm (SOS-lượt); (c) việc không phát thông báo không bao giờ vào chuông (Kết quả PA hằng tuần, Ghi nhận / Xử lý vi phạm, Xác nhận PA MT, Thêm PA Case tạo tay); (d) số trên nút = số **chưa đọc**, không phải số việc; (e) 3 loại tự động là **bản sao** việc, đồng bộ trễ ≤ 5 phút (A7-15).

**(5) Ảnh hưởng.** GV dựa chuông để "không bỏ sót" sẽ **sót 8/9 việc quá hạn** (5 nằm "Để biết", 3 không có) — đúng lời GV trung tâm. Bốn số khác nhau cùng một màn (⚠10 · 19 · 39 · 18) → không tin số nào. QL thấy lộ trình quá hạn ở "Để biết". TVV (sau luật 1) không có chỗ nhận nhắc.

**(6) Phương án.** So mẫu "Base" (Base Wework — theo tài liệu công khai: việc có hạn tới giờ, báo cáo thành viên tô đỏ việc quá hạn, thông báo theo dự án; **chưa kiểm giao diện chuông Base thật**): một trung tâm nhắc việc tốt gồm (i) danh sách việc của tôi theo hạn, (ii) dòng tin sự kiện tách riêng, (iii) bấm mở đúng việc. PISA **đã có** (i) = Công việc / hàng đợi trang đầu và (iii) = `duongThongBao`; **thiếu**: chuông không đọc từ (i). Base có tick "hoàn thành" tay — PISA **không lấy**: "xong" phải là có đầu ra (điểm đã nhập, PA đã ghi — luật 08/10).

| Tình huống / tiêu chí | Nay | N1 — vá chuông hiện có | **N2 — chuông = hộp "Nhắc việc" một nguồn (khuyến nghị)** | N3 — trang / ngăn "Nhắc việc" riêng kiểu Base (danh sách + tick xong) |
|---|---|---|---|---|
| "Cần làm" lấy từ | danh sách `kind` | `kind` (+3 loại) + `con_viec` | **cùng hàm hàng đợi trang đầu của vai** (GV: Công việc của tôi · QL / QT: Cần bạn quyết · TVV / VP: Việc của bạn) | bảng riêng |
| GV 7: việc quá hạn thấy trong Cần làm | 1/9 | 6/9 | **9/9** | 9/9 |
| Số trên nút | 39 (chưa đọc) | 16 (Cần làm còn mở) | **19 · ⚠10 — trùng đầu trang Công việc và badge** | thêm một số |
| Từ trang khác tới việc quá hạn lâu nhất | 2 bấm + dò 39 dòng (nằm ở Để biết) | 2 + dò 16 | **2** (dòng đầu) | 2–3 |
| Việc mới do người khác giao (Case tạo tay cho môn bạn) | không báo | +1 loại thông báo | có trong Cần làm + chấm "Mới" | có |
| Panel / trang mới | — | không | **không** (dùng hộp sẵn có) | +1, trùng Công việc |
| Mã | — | 3 loại vào danh sách + `con_viec` cho SOS-lượt + 1 `notify` | **bỏ** `thongBaoTuDong.ts` (117 dòng, đồng bộ 5 phút, 3 loại bản sao); Cần làm đọc hàm sẵn có; thông báo còn lại = Để biết | nhiều nhất |
| Luật | vẫn hai nguồn (trái 11/10-UX) | vẫn hai nguồn | 11/10-UX, 9.2-4, Rb 20.10, 20.11 | trái "không trùng Công việc", "xong = đầu ra" |

**Ưu tiên N2, làm 2 bước:** GĐ1 (SL1) làm **N1** vì rẻ và đã nằm trong kế hoạch (A1-04, A7-05) + 3 vá mới v4d; M2 (Công việc / hàng đợi dùng chung) đổi sang **N2**.

**N2 — hộp chuông:**
- Đầu hộp: "Cần làm · 19 · ⚠10 quá hạn" (chữ thường, 15 / 600).
- **Khối Cần làm**: ≤ 8 dòng việc dáng `DongViec` 3 vùng (Hạn · Việc + đối tượng · ›), **cùng thứ tự Công việc** (quá hạn lâu nhất trước, nợ chấm cũ gom một dòng); phạm vi = quá hạn + hạn tới hết CN tuần này (Rb 20.10 "Việc của tôi · hôm nay") **+ việc có thông báo chưa đọc** (việc mới giao, hạn xa vẫn hiện với chấm "Mới"); chân "Xem đủ 26 việc ở Công việc ›" (QL: "… ở Tổng quan ›").
- **Khối Để biết**: tin một chiều (đã dời bài vắng, huỷ vắng 2 lần, được duyệt, chuyển lớp, SOS n của lớp chủ nhiệm…), chấm chưa đọc, "Đánh dấu đã đọc" chỉ cho khối này, gập khi > 5 dòng. Thông báo trỏ việc không hiện lần hai ở đây (nó là chấm "Mới" trên dòng việc).
- Số trên nút = số dòng Cần làm (9.2-4); Để biết chưa đọc = chấm, không số.
- Bấm dòng Cần làm → trang đầu của vai, `?viec=` mở đúng việc tại chỗ (05 mục 1.2); thông báo của việc đó tự đọc.
- Rỗng: "✓ Không còn việc tuần này · Việc sau: 3 ›". 375: tấm rộng như nay, dòng 2 hàng.
- **Không**: tự bật hộp khi đăng nhập (trang đầu GV đã là danh sách việc — thêm một bước đóng hộp mỗi lần vào) · tick "xong" tay · email / Zalo (Rb 20.11 chỉ chuông).

**N1 — vá ở GĐ1 SL1 (đã có A1-04 / A7-05, thêm v4d):** 3 loại tự động vào Cần làm · `sos` + `assessment_attempt` (SOS-lượt cho GVCN) → Để biết · một Case một dòng (bỏ dòng "Case chưa chốt PA quá hạn" khi đã có dòng việc của Case đó) · số = Cần làm còn mở · thẻ đã xử lý rời số đếm · dòng có hạn, sắp theo hạn · tiêu đề nhóm không IN HOA · Case tạo tay cho người khác → `notify` người phụ trách (Cần làm "Thêm PA · Case Reading · em · hạn …").

**(7) Xuyên trang / vai.** Thanh trên mọi vai (M0); Công việc GV, Tổng quan QL / QT / TVV / VP (M1, M2 — cùng `HangDoiViec`); badge menu; Hướng dẫn / sổ tay "Chỉ cho tôi" chụp lại; việc TVV (luật 1) tự vào chuông TVV khi hàng đợi TVV có việc; vấn đề 1 (Case tạo cho môn người khác).

**(8) Luật.** Rb §20.11 (chỉ chuông trong ứng dụng; Cần làm trỏ việc chờ chính người đọc, rời nhóm khi xong) · §20.10 ("Việc của tôi · hôm nay" = quá hạn + tới hết CN tuần này; badge GV = quá hạn) · C03 / OV-15d (thông báo tự động thay Nhắc — N2 **giữ hành vi**, đổi cơ chế) · 9.2-4 (chuông chỉ đếm việc còn mở) · 11/10-UX (một nguồn, việc xong không nơi nào còn báo chờ) · 05 mục 1.2 (chuông mở đúng việc ở trang đầu vai) · luật 08/10 (không thêm bước).

**(9) Cách kiểm thử.**
- Phép kiểm: "id dòng Cần làm của chuông = id hàng đợi trang đầu (lát tuần này + chưa đọc)" cho GV 7, GV 10, QL 2, QT 1, TVV (sau luật 1) · làm xong một việc → biến khỏi Cần làm ở lần tải kế (không chờ 5 phút) · không `kind` một chiều nào ở Cần làm · số trên nút = số dòng Cần làm · bấm dòng ra đúng URL `?viec=`.
- N1 (GĐ1): GV 7 → 5 "Quá hạn chấm" + Case quá hạn ở Cần làm, 0 dòng SOS-lượt ở Cần làm; QL 2 → 6 "Chốt lộ trình" ở Cần làm.
- Ảnh trước / sau 1440 tối + 375 sáng: GV 7, QL 2, TVV.

**(10) Cần chủ SP?** Không phải câu nghiệp vụ → PTA tự quyết (4.7 A20, C22, C23). Đáng cho chủ SP xem ảnh N2 để chuyển lại GV trung tâm: "hộp chuông như thế đủ để không bỏ sót chưa".

---

## Câu hỏi cho chủ SP

Không có câu PHẢI HỎI mới. Sổ câu của v4d (để 02 mục 4.5c):

| Mã | Câu | TT | Mặc định |
|---|---|---|---|
| v4d-Q1 | Mô tả chung hay riêng từng kỹ năng? | (3) | Riêng (Rb §4.1 — Case nói đúng vấn đề kỹ năng đó) |
| v4d-Q2 | Lô lỗi một phần: lưu phần đúng hay tất cả-hoặc-không? | (3) | Tất cả-hoặc-không; trùng / chờ xác nhận báo ngay khi chọn chip |
| v4d-Q3 | Mức độ chung hay riêng từng Case? | (3) | Chung; sửa từng Case sau |
| v4d-Q4 | "Đã xong từ trước" có chọn nhiều kỹ năng? | (3) | Không — giữ một kỹ năng |
| v4d-Q5 | Có tự bật hộp nhắc việc khi đăng nhập ("một ô hiện lên")? | (3) | Không (4.7 A20) |
| v4d-Q6 | Chuông "Cần làm" = thông báo hay danh sách việc sống? | (3) | Danh sách việc cùng hàm trang đầu (4.7 C22) |
| v4d-Q7 | Nhắc qua email / Zalo như Base? | (1) | Đã có luật Rb §20.11: chỉ chuông trong ứng dụng |

## PTA tự quyết (thẩm mỹ / UX) — liệt kê để chủ SP biết

- **A20** (đảo phương án GV nêu): "một ô hiện lên" → **không** tự bật hộp khi đăng nhập; dùng hộp chuông (bấm mở) + trang đầu là danh sách việc.
- **B16** (diễn giải yêu cầu FB-4-35): lô = n Case **độc lập** — mỗi Case một kỹ năng, tên, mô tả, nguyên nhân, người phụ trách theo `suggestCaseOwner`, hạn PA theo mức, PA, Hoàn thành riêng; trùng hạng mục xử lý **từng kỹ năng** theo 7.13; kỹ năng có Case chờ xác nhận không vào lô (K3-23).
- **C21**: panel Tạo Case nhiều kỹ năng (C1): chip chọn nhiều, không chọn sẵn ("+ Case cho X" chọn sẵn X), "bạn dạy" dưới chip; phần chung một lần; thẻ riêng có "phụ trách: …"; một giao dịch; ghi bù giữ một kỹ năng.
- **C22**: chuông = hộp "Nhắc việc" (N2): Cần làm cùng hàm hàng đợi trang đầu, Để biết = tin một chiều; bỏ cơ chế lưu thông báo tự động OV-15d (giữ hành vi C03); không tick xong tay; không email / Zalo.
- **C23**: Case tạo tay cho kỹ năng người khác phụ trách → chuông người phụ trách (cùng mẫu Rb §20.11 "Case SOS mới → GVBM đúng môn").
- Lỗi (D), không cần duyệt: "+ Case cho {kỹ năng}" chọn sẵn kỹ năng (GĐ1 CV-LOI).

## Ảnh tiêu biểu (`C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4d\`)

- `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4d\gv7-case-hv--chon-r.png` — panel Tạo Case, kỹ năng chọn một (R thay L)
- `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4d\gv7-case-cho2--form.png` — "+ Case cho Listening" mở form không chọn kỹ năng
- `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4d\gv7-case-lop--form.png` — hồ sơ lớp, ô chọn học viên
- `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4d\gv8-case-lt--form.png` — lớp thường FOU: L · R · G+V · P
- `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4d\gv7-chuong--mo.png` — GV 7: Thông báo 39, Cần làm 18, Công việc ⚠10, "19 việc đến hết W3 SEP"
- `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4d\gv7-chuong--qua-han.png` — "Quá hạn chấm" + "Case chưa chốt PA quá hạn" nằm ở Để biết
- `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4d\gv7-chuong-375--mo.png` — 375
- `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4d\ql2-chuong--chot.png` — QL 2: "Chốt lộ trình … quá hạn" ở Để biết
- `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4d\gv10-chuong--mo.png` · `tvv23-chuong--mo.png`

Nguồn Base (tài liệu công khai, không kiểm giao diện thật): [Base Wework: Introduction](https://help.base.vn/support/solutions/articles/63000284686-base-wework-introduction-about-base-wework) · [Base Wework: Member Report](https://help.base.vn/support/solutions/articles/63000284728-base-wework-member-report) · [Base Wework: hourly deadlines](https://help.base.vn/support/solutions/articles/63000284692-base-wework-how-to-set-hourly-deadlines-for-tasks).
