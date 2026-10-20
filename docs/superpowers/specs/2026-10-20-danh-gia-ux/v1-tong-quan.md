> Phụ lục vòng 1 (góp ý chủ SP 20/10 tối) của [Đánh giá lại UX/UI toàn diện](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md) — mục 10. Báo cáo gốc của agent nghiên cứu (Opus 5.5), giữ nguyên chữ. Đường `SCR\…` là tệp tạm (không lưu trong repo).

# Tổng quan QL / QT — nghiên cứu thiết kế lại (góp ý vòng 1, mục II) · 20/10/2026

Người làm: agent nghiên cứu Tổng quan (Opus 5.5). CHỈ nghiên cứu + đề xuất: không sửa mã, không mockup, không commit.
Mã đọc: `main` e3405b93 (worktree `plan-ux-danh-gia`). Ảnh: `SCR\anh\a1\`, `SCR\anh\a2\`, `SCR\anh\a6\cap\`, `SCR\anh\a6\pr471\`.
Phương pháp: đọc mã + đếm bước theo tình huống thật + đối chiếu mockup 2, 3, 6 + PR #471; luật ui-ux-pro-max (ux: Bulk Actions, Hover States, Hover vs Tap, Input Affordance, Color Only; quick-reference: `touch-target-size`, `progressive-disclosure`, `state-clarity`, `modal-vs-navigation`); impeccable `operate.md` ("modal là lựa chọn lười — thử tại chỗ trước"; mọi thành phần có đủ trạng thái) + Cognitive Load checklist (≤ 4 mục một nhóm, ≤ 4 lựa chọn một điểm quyết).

Nhãn: **[ĐÃ CHỐT]** = chủ SP đã quyết · **[ĐỀ XUẤT]** = của báo cáo này, chưa duyệt · **[ĐOÁN]** = suy từ mô tả, không có tệp ảnh.

**Ảnh 1–5 của chủ SP không có tệp — ĐOÁN theo mô tả, đối chiếu ảnh đợt rà:**
| Ảnh | Đoán là | Ảnh tương ứng trong SCR |
|---|---|---|
| 1 | dải "HV cần chú ý" + các số gạch chấm | `a1\f-tq-ql2-p1.png` (y ≈ 298) |
| 2 | panel danh sách Case (dòng mở có nút "Thêm PA" → panel Thêm PA thay nội dung) | `a1\bam-dai-quahan--mo.png`, `a1\bam-bang-case--mo.png` |
| 3 | panel số chỉ có tên + lớp | `a1\bam-bang-sos--mo.png`, `a1\bam-bang-chualich-101--mo.png` |
| 4 | khối "Cần bạn quyết" dưới tiêu đề "Việc hôm nay" | `a1\f-tq-ql2-p1.png` |
| 5 | hàng Case / Chốt lộ trình khi rê chuột | `a1\f-tq-ql2-p1.png`, `-p2.png` (hàng không đổi gì khi rê chuột) |

---

## Tóm tắt (đọc 1 phút)

1. **"Nháy rồi không ra panel" là LỖI THẬT, không phải giới hạn demo.** Dải và hàng tổng dùng cùng khoá URL `?so-lieu=` → hai panel cùng mở → luật "một panel một lúc" đóng cả hai trong một nhịp. 8 số chết (FT), 6 số (Lớp thường). Sửa GĐ1: 1 dòng + 1 phép kiểm. Thiết kế lại thì bỏ hẳn chỗ trùng.
2. **Phần lớn số trên Tổng quan không nên mở panel.** 29 thành phần hiện có: giữ 7, đổi cách bấm / chỗ / tên 15, bỏ 7; thêm 1–3 nhóm việc của QL. Panel "chỉ ra tên" bỏ hết; số trong bảng lớp bấm = **mở rộng hàng lớp tại chỗ** (danh sách em + việc + nút).
3. **SOS:** vùng bấm hiện chỉ là chữ số trong chip (8×12 px). Đề xuất: **cả ô SOS là một nút → mở rộng hàng lớp**, mỗi em một dòng theo mockup 6 khung 1 (mức + kỹ năng · MT · tuần · Case / PA · việc tiếp + hạn · nút theo quyền). Chip SOS + "Vì sao SOS" một mẫu toàn web.
4. **Khuyến nghị bố cục: B — một hàng đợi "Cần bạn quyết" trái–phải, Chờ duyệt là nhóm đầu (luôn mở).** Giữ lõi ý chủ SP (trái danh sách, phải chi tiết, làm tại chỗ) nhưng **không tách hộp duyệt lên trên**: chi tiết luôn nằm ngang hàng với dòng vừa bấm, một kiểu thao tác cho mọi nhóm, ngắn hơn A ~250 px. Duyệt 10 thẻ có xem bối cảnh: nay ≈ 31 bấm + 20 lần đổi trang → B **11 bấm, 0 đổi trang, 0 cuộn**.
5. **Phân vai:** việc QL phải quyết **chỉ ở Tổng quan**; Công việc của QL / QT chỉ còn việc của GV. Hiện Công việc QL **đã đúng bố cục A** (hộp duyệt trên + trái/phải) → làm A ở Tổng quan là sao y một trang. Thứ tự menu [ĐÃ CHỐT] (Tổng quan đầu, Công việc thứ 4) ủng hộ Tổng quan là "nhà" của QL.
6. **Thang "làm tại chỗ" 6 bậc (0–5)** cho toàn web (chỉ xem → một bấm → hộp nhỏ / mở rộng dưới hàng → khung chi tiết phải → panel rộng → trang riêng). "Thêm PA trên hàng HV, mở rộng tại chỗ": **đúng ở bảng lớp rộng hết trang**, không đúng ở danh sách 560 px — ở đó dùng khung phải. Cùng một form.

---

## Phần 1. Xác minh "bấm số gạch chân chỉ nháy, không ra panel" (II.1)

**Kết luận: LỖI THẬT** (mã, mọi dữ liệu, mọi chi nhánh, QL và QT, 1440 và 375). Không phải giới hạn demo.

**Chuỗi nguyên nhân (đã đọc từng dòng):**
1. Dải dựng số bằng `SoLieuO` với `nguon=/tong-quan/chi-nhanh/o?cot=${cot}&khoa=tong&chuY=1&…` — `web/src/modules/worklist/KhoiCanQuyet.tsx:34-36`.
2. Hàng tổng của "Lớp cần chú ý" dựng **cùng chuỗi** (`so()` với `h.khoa = 'tong'`) — `TongQuanQl.tsx:54-56`, `:71`. Ở 375 nhánh thẻ cũng có hàng tổng (`TongQuanQl.tsx:110`).
3. `SoLieuO` lấy khoá `nguon:${nguon}` — `web/src/ui/SoLieuO.tsx:20` → `useMoSoLieu` trả "đang mở" khi `?so-lieu=` bằng khoá — `web/src/lib/quayLai.ts:124-126`. Hai nút cùng khoá → bấm một là **cả hai** cùng mở.
4. Mỗi bên vẽ `DanhSachNguon → NganDanhSach → KhungPanel` (portal + nền tối). `KhungPanel` mới gọi `khoPanelChung.mo(id)` — `web/src/ui/KhungPanel.tsx:73-77`; kho gọi `dong` của panel trước — `shared/domain/khoPanel.ts:16-20`.
5. `dong` → `setOpen(false)` → xoá `so-lieu` khỏi URL — `quayLai.ts:129` → **cả hai** đóng. Panel kịp vẽ nền tối rồi mất → "nháy". (Kèm khoá cuộn `body` bật/tắt — `KhungPanel.tsx:79-84` — [GIẢ THUYẾT] thanh cuộn ẩn/hiện góp phần "nháy".)

**Số bị chết (số > 0 mới là nút):**
| Công tắc | Ở dải | Ở hàng tổng ("Cả Monbay" / "Tất cả chi nhánh") | Tổng |
|---|---|---|---|
| Fast Track | chưa lịch Test · chưa điểm · HV (Case) · Case | Chưa lịch · Chưa điểm · HV · Case | **8** |
| Lớp thường | chưa điểm · HV · Case (không có "chưa lịch") | như trái | **6** |

**Số vẫn chạy:** dải "⚠ n quá hạn" và "n bài trễ chấm" (dùng `id` chỉ số, khoá riêng); hàng tổng SOS 1 / 2 / 3, Đã thi · chờ KQ (không có ở dải); mọi số của hàng lớp / hàng chi nhánh.
Bằng chứng ảnh: `a1\bam-dai-chualich--mo.png`, `bam-dai-chuadiem--mo`, `bam-dai-hv--mo`, `bam-dai-case--mo`, `bam-bang-tong-chualich--mo` (không panel); `d-375-dai--bam` (375 cũng chết); đối chứng `bam-bang-chualich-101--mo` (hàng lớp mở được).

**Gốc thiết kế:** chú thích `KhoiCanQuyet.tsx:22-23` ghi chủ ý "ba số đầu = hàng tổng (cùng ô, cùng panel)" → **cùng một số vẽ hai lần trên một màn**. Đó là trùng lặp (X4), lỗi chỉ là hệ quả.

**Sửa:**
- GĐ1 (trước deploy, [ĐÃ CHỐT 9.1-3] sửa GĐ1 rồi mới deploy): thêm `&vung=dai` vào `nguon` của dải (`KhoiCanQuyet.tsx:35`). Máy chủ chỉ đọc `branchId, ct, cot, khoa, chuY` (`server/src/routes/index.ts:2029-2035`) nên bỏ qua tham số thừa. Thêm phép kiểm "bấm số dải → đúng 1 panel". Sửa Hướng dẫn `shared/huongDan/ql.ts:58`.
  `ponytail:` một tham số thừa để tách khoá — trần: hai `SoLieuO` cùng khoá ở trang khác vẫn lỗi; nâng cấp: cảnh báo lúc dev trong `useMoSoLieu` khi một khoá có > 1 nơi đăng ký (Báo cáo 7, Hồ sơ GV 7 số — nên kiểm cùng lúc).
- GĐ2 [ĐỀ XUẤT]: bỏ dải riêng (Phần 2) → mỗi số chỉ còn một chỗ, lỗi mất từ gốc.

---

## Phần 2. Kiểm kê mọi thành phần Tổng quan QL / QT + phân loại (II.2.2)

Loại theo chủ SP: **(a)** chỉ xem, không bấm · **(b)** bấm để lọc / mở rộng / nhảy tới nhóm ngay trên trang (không panel) · **(c)** bấm để LÀM việc tại chỗ, đủ chức năng · **(d)** bấm sang trang khác (chỉ khi cần không gian lớn / xem hồ sơ).
Quyền theo `server/src/seed/data.ts:61-69` (QL): có `request.approve`, `case.approve`, `sos.edit`, `case.close`, `cycle.edit`, `plan.week`, `class.assign`, `deadline.override`, `student.edit`; **không có `score.edit`** (nhập điểm chỉ GV; QT có `score.override` = sửa điểm có lý do).
Tần suất: ước cho QL một chi nhánh.

| # | Thành phần | Hiện gì | Bấm ra gì (nay) | QL / QT làm được gì ở đó | Tần suất | Giá trị nay | Loại nay → đề xuất | Giữ / gộp / bỏ |
|---|---|---|---|---|---|---|---|---|
| H1 | Tiêu đề | "Việc hôm nay" (≠ menu) | — | — | — | sai tên | (a) → (a) | đổi "Tổng quan" (A1-07) |
| H2 | Dữ liệu đến | ngày | — | — | — | cần | (a) | giữ, cùng hàng đầu |
| H3 | Chi nhánh | ô form nhãn trên, mép phải | chọn | QT đổi phạm vi | QT: ngày | cần | lọc | giữ, thành nút gọn hàng đầu; bấm tên chi nhánh ở bảng = lọc 1 bấm (A1-19) |
| H4 | Công tắc FT / LT | áp nửa trang | đổi khung | — | tuần | cần | lọc | [ĐÃ CHỐT 9.1-4] "Tất cả · FT n lớp · LT n lớp" cho cả trang |
| H5 | "Mới dùng PISA?" | dải cả hàng | sang trang Hướng dẫn | — | hiếm | thấp với QL quen | (d) | giữ nút Ẩn; "Xem" mở panel đúng màn (A1-25) |
| H6 | "Báo cáo ›" | nút | `/phan-tich?goc=bao-cao` | in / chiếu báo cáo | tuần | cao | (d) | giữ (cần không gian lớn) |
| H7 | "Thống kê theo kỳ: Phân tích ›" | link cuối dải | `/phan-tich` | — | hiếm | trùng H6 + menu | (d) | **bỏ** |
| D1 | Dải · "3 chưa lịch Test" | số HV | **chết**; nếu chạy: panel tên HV | xếp lịch MT kế (`plan.week`) — nhưng ở Kế hoạch Test, không ở panel | tuần | panel chỉ tên = 0 | (b) chết → bỏ khỏi dải | **bỏ** ở dải; việc thật → nhóm "Xếp lịch MT kế" của hàng đợi (c, hộp nhỏ) — cần thống nhất luật đếm với Kế hoạch Test (A7-12) |
| D2 | Dải · "12 chưa điểm" | số HV | **chết**; nếu chạy: panel tên | không gì (không `score.edit`); GV đã nhận thông báo tự động (C03) | — | thấp | → bỏ | **bỏ** ở dải; giữ cột ở bảng (L7) |
| D3 | Dải · "13 HV · 19 Case chưa chốt PA" | hai số | **chết**; nếu chạy: panel Case có làm tại dòng | Thêm PA, Xác nhận… (`sos.edit`) | ngày | trùng hàng tổng | → bỏ | **bỏ** ở dải; giữ ở bảng (L9) |
| D4 | Dải · "⚠ 5 quá hạn" | số Case | panel 5 Case, dòng mở → làm việc (ảnh 2 [ĐOÁN]) | Thêm PA / Ghi nhận xét / Xác nhận Case | ngày | cao nhưng **trùng** nhóm Q2 (cùng 5 Case) | (c) | **bỏ** (việc ở hàng đợi) |
| D5 | Dải · "58 bài trễ chấm · 4 GV" | số bài + GV | panel 58 dòng "Nhập điểm" — QL không nhập được (A1-06) | không gì | — | thấp, gây hiểu nhầm | (c) giả | **bỏ** — hệ quả [ĐÃ CHỐT] bỏ Trễ chấm |
| Q1 | Chờ duyệt | 10 ⚠1 + câu hướng dẫn + 3 thẻ cao + "Xem thêm 7" + "Mở hộp duyệt ›" | Duyệt (lưu ngay) · Từ chối… (ô lý do) · **Mở = sang hồ sơ HV** · ô tích | duyệt / từ chối (`request.approve`) | **ngày, nhiều nhất** | cao | (c) + (d) | **giữ**, thành nhóm đầu của hàng đợi; chi tiết + bối cảnh ở khung phải; bỏ "Mở" đổi trang |
| Q2 | Case chưa chốt PA (quá hạn) | tên · lớp / người · nhóm · hạn · "Mở Case" | panel Case phủ; nút chính sai "Hoàn thành Case" (A1-15) | Thêm PA, Xác nhận PA, Ghi nhận xét, Xác nhận Case | ngày | cao | (c) qua panel phủ | **giữ**, đổi tên "Case quá hạn chốt PA"; khung phải mở thẳng đúng việc tiếp; dòng có chip SOS + "đang chờ gì từ bao giờ" (A1-16) |
| Q3 | Chọn bước tiếp sau thi | tên · lớp · hạn · nút | panel Bước tiếp phủ | chọn bước tiếp, gia hạn | tuần | cao | (c) | **giữ**; khung phải; dòng có OVR + Đạt / Chưa đạt (mockup 3) |
| Q4 | Chốt lộ trình | "Chốt lộ trình · MB FOU 12 / 7 em chưa chọn" (chữ lặp 3 lần, A1-12) | panel toàn màn phủ cả thanh trên | chốt lộ trình cả lớp (`cycle.edit`) | theo khoá | cao | (c) | **giữ**; dòng ghi "đã đề xuất x/y"; panel rộng thay khung phải + "Chốt các em đã có đề xuất (x)" (A1-21) |
| Q5 | (mới) Chưa có người → Phân công | — (đang ở Công việc) | — | `class.assign` | tuần | cao | — → (c) hộp nhỏ | **chuyển vào** hàng đợi (CV-07) |
| L1 | "Chỉ lớp có vấn đề" | nút bật / tắt | lọc bảng | — | ngày | cần | (b) | giữ |
| L2 | Hàng tổng "Cả Monbay" | 51 · 3 · 12 · 6/5/3 · 13/19 · 0 | 4 số chết; SOS / Đã thi mở panel tên | — | ngày | cần (tóm tắt) | (b) lỗi → **(a)** | **giữ làm hàng tóm tắt duy nhất** (thay dải), chữ số lớn hơn, không bấm |
| L3 | Tên lớp | link | hồ sơ lớp | xem | ngày | cần | (d) | giữ (xem hồ sơ) |
| L4–L5 | GVCN · HV | chữ / số | — | — | — | cần | (a) | giữ |
| L6 | Chưa lịch (FT) | số HV | panel tên | xếp lịch | tuần | panel = 0 | panel → **(b)** | mở rộng hàng lớp lọc "Chưa lịch": em · MT vừa xong · MT kế · "Xếp lịch…" (hộp nhỏ) |
| L7 | Chưa điểm | số HV | panel tên | chỉ xem | tuần | panel = 0 | panel → **(b)** | mở rộng: em · bài · GV · "quá hạn n ngày" (chỉ xem; "Nhập thay" chỉ khi chủ SP cấp quyền, 9.2-1) |
| L8 | SOS 1 / 2 / 3 | 3 chip, số 0 xám | panel tên, vùng bấm 8×12 px | — trong panel | ngày | panel = 0 | panel → **(b)** | Phần 3 |
| L9 | Case chưa chốt PA (HV / Case) + ⓘ | hai số xếp chồng | panel tên (HV) · panel Case làm tại dòng (Case) | Thêm PA… | ngày | Case: có; HV: 0 | panel → **(b)** | mở rộng lọc Case: em · trạng thái Case (5 nhóm C23) · việc tiếp + hạn · nút; ⓘ phân rã giữ |
| L10 | Đã thi · chờ KQ (FT) | số HV | panel tên | chỉ xem (TVV / CX cập nhật KQ thi thật) | tuần | thấp | panel → **(b)** | mở rộng: em · ngày thi · chờ từ · ai cập nhật |
| L11 | Chân bảng | "Ẩn n lớp · Hiện" / "Bấm số để xem danh sách" | lọc | — | — | — | (b) | giữ "Ẩn · Hiện"; bỏ câu "Bấm số…" (nút tự nói) |
| T1 | Lịch sắp tới (Tuần này) | 3 tab tuần + hàng lớp + chip "MT1 · 1 em" + chữ mờ "L R W S" + "Xem toàn bộ lịch ›" | đổi tab; link lớp; sang Kế hoạch Test | xem | tuần | thấp (A1-11) | (b) + (d) | **thay** bằng một hàng 5 ô tuần (a), mỗi ô (d) → Lịch Test tuần đó; bỏ tab, bỏ "L R W S" |
| T2 | Trễ chấm theo GV | 4 dòng GV · số bài (bấm) · lớp · trễ nhất | panel bài trễ "Nhập điểm" (QL không nhập được) | không gì | — | thấp | (c) giả | **[ĐÃ CHỐT] bỏ** |

**Đếm (29 thành phần hiện có):** giữ 7 (H2, H6, L1, L3, L4, L5, L11) · đổi cách bấm / chỗ / tên 15 (H1, H3, H4, H5, Q1–Q4, L2, L6–L10, T1) · bỏ 7 (H7, D1–D5, T2) · thêm Q5 + nhóm "Xếp lịch MT kế" + nhóm "Vận hành quá hạn".
**Panel danh sách số (`NganDanhSach`) mở từ Tổng quan: nay 6 loại → sau 0.** Mọi số còn bấm được đều mở rộng tại chỗ (b) hoặc đã là việc (c).

**Hệ quả của [ĐÃ CHỐT] bỏ Trễ chấm:**
1. Số "58 bài trễ chấm · 4 GV" ở dải: **bỏ luôn** — cùng khái niệm, QL không làm được gì với nó; giữ thì trái quyết định.
2. Việc nhắc GV: đã tự động từ trước (C03, thông báo `cham_qua_han`). **Phải sửa A1-04 ở GĐ1**: 3 loại thông báo tự động đang nằm nhóm "Để biết" của chuông → GV dễ bỏ qua. Bỏ khối Trễ chấm thì thông báo là đường nhắc duy nhất.
3. QL vẫn xem được trễ chấm theo GV ở: Test › Lịch Test (ô "Quá hạn chấm" + khối "Test quá hạn chấm"), Phân tích › GV (chấm đúng hạn / trễ), Báo cáo ("Quá hạn theo GV"). Không mất thông tin.
4. Cột "Chưa điểm" (HV) ở bảng: [ĐỀ XUẤT] **giữ** — đây là tín hiệu rủi ro của EM (chưa biết em có SOS không), khác "GV trễ chấm". Mở rộng ra chỉ xem.
5. "Tuần này": bỏ "⚠ n quá hạn" theo tuần (cũng là số trễ chấm); giữ "Chấm x/y" (tiến độ tuần, không phải trễ). Xem câu hỏi 5.
6. Mockup 3 khung 1d (panel nhập band từ Trễ chấm) mất lối vào ở Tổng quan; nếu chủ SP cấp quyền nhập thay (9.2-1) thì đặt mẫu đó ở Lịch Test.

---

## Phần 3. SOS — hiện trạng và overhaul (II.3)

**Hiện trạng (đo + mã):**
- Hiển thị: cột "SOS hiện tại" chia 3 cột con SOS 1 · 2 · 3; số > 0 nằm trong chip tròn viền (`CHIP_SOS` cao 22 px, rộng ≥ 30 px — `web/src/ui/Nhan.tsx:34`); số 0 xám. Hàng 5 lớp → tới 15 vòng tròn trên một bảng.
- **Vùng bấm = chỉ chữ số bên trong chip**: `SoLieuO` (nút `p-0`) đặt TRONG chip (`TongQuanQl.tsx:60`) → 1440: **8×12 px** (B-02); 375: 24×36 px. Bấm viền chip, khoảng trống trong chip, ô bảng → không gì. Chuẩn: ≥ 24×24 (WCAG 2.5.8), DESIGN.md 40 px máy tính / 44 px điện thoại. Đúng ý chủ SP "phải bấm đúng con số".
- Panel mở ra (`bam-bang-sos--mo.png`): "5 học viên — SOS 1 · MB FT 101", mỗi dòng **tên + lớp**; mở dòng chỉ có "Mở trang ↗". Máy chủ trả `rowsFor('hv', ids)` (`server/src/worklist/bangChiNhanh.ts:198`) — không mức, không kỹ năng, không MT · tuần, không Case / PA, không việc tiếp, không nút. Trái C02 mục 5 [CHỐT] ("không làm panel chỉ để liệt kê tên"). Giá trị: gần 0 — muốn biết gì cũng phải sang hồ sơ (1 đổi trang mỗi em).
- Định nghĩa: [ĐÃ CHỐT 9.1-4] một định nghĩa "SOS hiện tại" cho Tổng quan · Học viên & Lớp · Báo cáo. Tổng quan đang tính cả SOS "tạm" → khi mở ra phải ghi chữ "tạm".

**So 3 cách (tình huống: "lớp nào có SOS 3, em nào, đã có PA chưa"):**
| | S-A: panel phải, nội dung giàu (bảng mockup 6) | **S-B: mở rộng ngay dưới hàng lớp** | S-C: sang Học viên & Lớp › Đang SOS (lọc lớp) |
|---|---|---|---|
| Bấm / đổi trang | 1 / 0 | **1 / 0** | 1 / 1 (+1 quay lại) |
| Che bối cảnh | phủ nửa bảng, nền tối — mất so sánh giữa lớp | không — các lớp khác vẫn thấy | rời trang |
| Thao tác (Thêm PA…) | trong panel; việc dài thay nội dung panel | ngay dưới dòng em (bảng rộng 1400 px đủ chỗ) | ở trang Đang SOS |
| Dùng lại thành phần | panel mới | **cùng dòng em của Đang SOS (mockup 6 khung 1)** | trang có sẵn |
| 375 | panel toàn màn | mở dưới thẻ lớp, mỗi em 2 dòng | trang có sẵn |
| Rủi ro | thêm một panel "danh sách" (đúng thứ chủ SP chê) | trang dài thêm khi mở nhiều lớp → mở một lớp một lúc | đổi trang cho việc xem nhanh |

**Chọn S-B.** Lý do: 1 bấm, 0 panel, giữ bảng làm bối cảnh; đúng ý chủ SP "tại chỗ"; một thành phần dòng em dùng chung với Đang SOS (nhất quán, ít mã).

**Đề xuất overhaul [ĐỀ XUẤT]:**
- **Hiển thị:** giữ 3 cột con theo mockup (dò dọc "lớp nào có SOS 3" theo cột); số 0 mờ hơn nữa, không viền; SOS 3 giữ viền đôi (không chỉ dựa màu). Hàng tổng chỉ xem (a).
- **Vùng bấm:** **cả ô SOS (3 số + nền ô) = một nút**, cao ≥ 40 px (1440) / 44 px (375); con trỏ tay + nền ô đổi khi rê; `aria-expanded`; nhãn đọc "MB FT 101: SOS 3 một em, SOS 2 hai em, SOS 1 năm em. Mở danh sách".
- **Tương tác:** bấm ô → hàng lớp mở rộng, lọc sẵn "SOS" (xếp SOS 3 → 1); hàng chip lọc trong vùng mở: `Tất cả n · SOS n · Case n · Chưa điểm n · Chưa lịch n` (b). Bấm ô khác của cùng lớp = đổi lọc, không mở thêm. Mở lớp khác thì lớp cũ gập. Esc / bấm lại = gập. URL ghi `?lop-mo=…&loc=…` để Quay lại về đúng chỗ.
- **Nội dung mỗi em (theo mockup 6 khung 1 + mockup 3):** Học viên (link ↗ hồ sơ) · chip SOS kèm kỹ năng ("SOS 3 · L R W", có "tạm") · MT · tuần (link ↗ hồ sơ MT) · Case / PA (một trong 5 trạng thái C23: Case trống PA · Chờ nhận xét / nguyên nhân · PA chờ xác nhận · PA chờ duyệt đổi · PA xong chờ đóng; hoặc "PA đang chạy · Kèm 1-1 R") · Việc tiếp + hạn ("Thêm PA · ⚠ quá hạn 5 ngày") · **một nút theo quyền** ("Thêm PA", "Xác nhận PA", "Ghi nhận xét"; người không có quyền thấy chữ tình trạng).
- **Thao tác tại chỗ:** "Thêm PA" mở form ngay dưới dòng em (bậc 2–3 của thang, Phần 5); lưu xong dòng còn "✓ Đã thêm PA · Hoàn tác" rồi cập nhật trạng thái. Việc khác của Case (Ghi kết quả PA, Sửa PA) → panel Case như nay (bậc 4).
- **Nối toàn web (A3-10, A3-11):** một `ChipSos` (kỹ năng gộp W, có "tạm") ở Tổng quan, Đang SOS, hồ sơ lớp, Công việc, Báo cáo; **bấm chip = hộp "Vì sao SOS"** ngay cạnh chip (mockup 6 khung 1: tiêu đề → kết luận "3 kỹ năng chưa đạt kỳ vọng ở MT3" → số từng kỹ năng → "Mở hồ sơ MT3 ›"), bỏ nút "?" cạnh chip. Vùng bấm chip ≥ 24×24 bằng `::after` (mẫu `ui/MenuDong.tsx:106`).

---

## Phần 4. Khu công việc + bố cục cả trang — so sánh phương án (II.5, II.7)

### 4.1 Tình huống thật (QL Monbay, thứ Hai 8:00, dữ liệu demo)
S1 duyệt 10 đề xuất PA, mỗi thẻ cần xem bối cảnh Case · S2 xử lý 5 Case quá hạn chốt PA (Thêm PA) · S3 chốt lộ trình 6 lớp (21 em, GVCN đã đề xuất một phần) · S4 chọn bước tiếp sau thi 2 em · S5 biết lớp nào có SOS 3, em nào, đã có PA chưa · S6 QT đổi chi nhánh.

### 4.2 Bốn phương án

**Hiện tại (đối chứng):** dải → Cần bạn quyết (thẻ cao, 21 dòng) → Lớp cần chú ý → Tuần này + Trễ chấm. 1440: 2 263 px (≈ 2,5 màn 900); 375: 4 279 px (≈ 5,3 màn 812; QT 5 741 px). Hàng việc không có trạng thái rê chuột (`KhoiCanQuyet.tsx:74`, `<li>` không lớp hover); bảng dùng `.row-hover` phủ trắng 4 % (`index.css:268`) ≈ **1,1 : 1** so với nền thẻ — mắt gần như không thấy (đúng ảnh 5 [ĐOÁN]).

**A — chủ SP đề xuất: hộp duyệt ở trên; dưới hai cột trái danh sách / phải chi tiết.**
```
┌ Tổng quan · [Monbay ▾] · [Tất cả|FT 5|LT 6] · Dữ liệu đến · Báo cáo ›            56 px ┐
├ CHỜ DUYỆT 10 ⚠1  (cả bề ngang; hàng gọn 4 cột: loại · việc+người gửi · Nếu duyệt · hạn+nút)
│  5 hàng × 64 + "Hiện 5 nữa"                                              ≈ 400 px   │
├──────────────── trái 560 ─────────────┬──────────── phải ≈ 820 (dính) ─────────────┤
│ Case quá hạn chốt PA 5 ⚠5             │ chi tiết việc đang chọn                     │
│ Sau thi · Bước tiếp 2                 │ (bắt đầu ở y ≈ 540 → màn đầu chỉ thấy       │
│ Lộ trình lớp 6 ⚠6                     │  ≈ 360 px của chi tiết)                     │
│                               ≈ 650 px│                                             │
├ Lớp cần chú ý ≈ 390 ── Tuần này ≈ 90 ───────────────────────────────────────────────┤
Trang ≈ 1 800 px (≈ 2 màn). 375 ≈ 2 600 px (≈ 3,2 màn).
```
Hai cách hiểu "bấm thẻ duyệt": (A1) chi tiết hiện ở khung phải **bên dưới** hộp — xa chỗ bấm (cách ≈ 400 px theo chiều dọc, có lúc khuất dưới màn), mắt và chuột đi chéo; (A2) thẻ duyệt mở rộng tại chỗ — hai kiểu tương tác trên một khu việc.

**B — một hàng đợi "Cần bạn quyết" trái–phải; Chờ duyệt là nhóm đầu, luôn mở. [KHUYẾN NGHỊ]**
```
┌ Tổng quan · [Monbay ▾] · [Tất cả|FT 5|LT 6] · Dữ liệu đến 14/09 · Báo cáo ›       56 px ┐
├ Cần bạn quyết · 23 việc · ⚠ 12 quá hạn · 2 hạn hôm nay      [Chỉ quá hạn]     36 px  │
├──────── DANH SÁCH 560 px ─────────────┬────── CHI TIẾT ≈ 820 px (dính, cao ≤ màn) ──┤
│ ▾ Chờ duyệt 10 · ⚠1     [Chọn nhiều]  │ Đề xuất PA · Speaking         ⚠ quá hạn 1 ngày│
│ ▌Đề xuất PA · Trần Thu Hà    ⚠ 1 ngày │ Trần Thu Hà ↗ · MB FT 101 · MT1               │
│  MB FT 101 · P.T.Trang gửi   Duyệt ›  │ P.T.Trang gửi 14/09: "Tutor 1-1 hai buổi/tuần" │
│  Đề xuất WL 3 · Lương Gia Bảo còn 2 n │ Nếu duyệt: PA chạy từ 14/09, Kết quả đầu 28/09 │
│  … (tối đa 5) · Xem thêm 5            │ Bối cảnh: SOS 2 · S · Nguyên nhân … · KQ gần nhất│
│ ▾ Case quá hạn chốt PA 5 · ⚠5         │ [Duyệt]  [Từ chối…]                 Hồ sơ ↗   │
│  Lê Quang Huy · SOS 2 · S   ⚠ 5 ngày  │                                               │
│  Case trống PA · P.T.Trang  Thêm PA › │                                               │
│ ▸ Sau thi · Bước tiếp 2               │                                               │
│ ▸ Lộ trình lớp 6 · ⚠6                 │                                    ≈ 800–950 px│
├ Lớp cần chú ý  [Chỉ lớp có vấn đề]                                                    │
│ Cả Monbay 51 HV · Chưa lịch 3 · Chưa điểm 12 · SOS 6·5·3 · Case 13 HV/19 · Đã thi 0 (chỉ xem)
│ MB FT 101 │ 33 │ [3] │ [8] │ [ 5 · 2 · 1 ] │ [8 HV / 12 Case] │ 0   ← cả ô là nút      │
│   ▾ 8 HV · lọc: Tất cả · SOS 8 · Case 8 · Chưa điểm 8 · Chưa lịch 3                   │
│     Hoàng Bảo Ngọc ↗ · SOS 3 · L R W · MT3 · W2 OCT ↗ · Case trống PA · ⚠5 n · [Thêm PA]│
│                                                                            ≈ 390 px   │
├ Tuần này: [Trước: còn 15 bài][W2 SEP Test 3 lớp·8 HV·Chấm 28/36][W3 · tuần này …][W4][W1 OCT] ≈ 90 │
Trang ≈ 1 500 px (≈ 1,7 màn). 375 ≈ 2 050 px (≈ 2,5 màn).
```
375: danh sách nhóm → chạm dòng → chi tiết toàn màn, "‹ Tổng quan" trên cùng, nút chính dính đáy, "Việc 2 / 10" → lưu xong tự sang việc kế cùng nhóm → Quay lại về đúng nhóm + vị trí cuộn. **Y hệt mẫu Công việc 375** (một mẫu cho cả web).

**C — Tổng quan chỉ là bức tranh; mọi việc ở Công việc.**
```
┌ Tổng quan · [Monbay ▾] · [Tất cả|FT|LT] · Dữ liệu đến · Báo cáo ›                      ┐
├ Cần bạn quyết: [Chờ duyệt 10 ⚠1] [Case quá hạn 5] [Bước tiếp 2] [Lộ trình 6] → mỗi nút sang Công việc lọc nhóm
├ Lớp cần chú ý (như B) ≈ 390 ── Tuần này ≈ 90                                            ┘
Trang ≈ 730 px (< 1 màn). 375 ≈ 1 000 px (≈ 1,2 màn). Việc làm ở Công việc (bố cục B).
```

**D — hai cột cả trang: trái hàng đợi, phải mặc định là "Lớp cần chú ý"; bấm việc thì phải đổi thành chi tiết.** (phương án thêm)
Trang ≈ 1 050 px (≈ 1,15 màn): thấy cả việc lẫn SOS ngay màn đầu. Nhưng: một khung hai vai (đổi nội dung dưới tay), bảng lớp 8 cột phải nén vào 820 px, QT "Tất cả chi nhánh" (6 chi nhánh) thành cuộn lồng trong khung dính; 375 thoái hoá về B.

### 4.3 Số bấm / đổi trang / panel phủ theo tình huống (đếm trên demo; bấm = click/chạm, không tính gõ chữ)

| Tình huống | Hiện tại | A | **B** | C | D |
|---|---|---|---|---|---|
| S1 duyệt 10 thẻ có xem bối cảnh | ≈ 31 bấm · **20 đổi trang** (Mở → hồ sơ → Quay lại) | A1: 20 bấm (chọn + Duyệt) + ~10 lần cuộn giữa hộp trên và chi tiết dưới · A2: 11 bấm, 2 kiểu tương tác | **11 bấm** (1 chọn + 10 Duyệt, tự sang thẻ kế) · 0 đổi trang · 0 cuộn | 12 bấm · 1 đổi trang (+1 về) | 11 · 0 |
| S1' duyệt 10 thẻ không cần xem | 11 (Xem thêm + 10) | 10 (Duyệt trên hàng) | 2–3 (Chọn nhiều · chọn hết đang hiện · Duyệt 10) hoặc 11 | 3–4 + 1 đổi trang | 2–3 |
| S2 Thêm PA 5 Case quá hạn | ≈ 25–30 bấm · 5 panel phủ (Mở Case → "+ Thêm PA" phụ → Loại → Lưu → đóng) | ≈ 11–16 · 0 phủ | **≈ 11–16** (1 chọn + 5 × [Loại 1–2 + Lưu 1], tự sang Case kế) · 0 phủ | 12–17 · 1 đổi trang | 11–16 |
| S3 chốt lộ trình 6 lớp (21 em) | ≈ 40–60 · 6 panel **toàn màn phủ cả thanh trên** | ≈ 12 + em chưa có đề xuất · panel rộng thay khung phải | **≈ 12 + em chưa có đề xuất** (chọn lớp + "Chốt các em đã có đề xuất (x)") | như B + 1 đổi trang | như B |
| S4 bước tiếp 2 em | ≈ 6–8 · 2 panel phủ | 5 | **5** (1 + 2 × [chip + Lưu]) | 6 + 1 đổi trang | 5 |
| S5 lớp nào SOS 3, em nào, có PA chưa | cuộn ≈ 1,3 màn → bấm số 8×12 px → panel phủ chỉ tên → mở dòng → "Mở trang ↗" = **3 bấm · 1 đổi trang · 1 panel** | cuộn ≈ 1,5 màn → **1 bấm** (cả ô SOS) · 0 | cuộn ≈ 1 màn → **1 bấm** · 0 | 0 cuộn → 1 bấm | 0 cuộn → 1 bấm (khi chưa mở việc) |
| S6 QT đổi chi nhánh | 2 bấm (ô form góc phải); danh sách duyệt có thể lệch chi nhánh (A1-02) | 2 bấm hoặc 1 (bấm tên chi nhánh ở bảng) | **2 / 1** — một trạng thái `{cn, ct}` cho mọi khối ([ĐÃ CHỐT 9.1-4]) | 2 / 1 | 2 / 1 |
| Độ dài trang 1440 / 375 | 2,5 / 5,3 màn | ≈ 2 / 3,2 | **≈ 1,7 / 2,5** | ≈ 0,8 / 1,2 (+ trang Công việc) | ≈ 1,15 / 2,5 |
| Trùng với trang Công việc QL | trùng Chờ duyệt | **trùng y bố cục** (Công việc QL đang là A — `HoTroHocVienTab.tsx:337-348`) | không (khi phân vai 4.6) | không | không |

Cognitive Load (8 mục, impeccable): hiện tại trượt 6/8 (A1). Ước: A trượt 2 (Visual hierarchy — hai khu việc ngang cấp; One thing at a time — chi tiết xa dòng); **B trượt 0–1**; C trượt 0 nhưng thêm đổi trang; D trượt 1–2 (một khung hai vai).

### 4.4 Nhóm việc, mức ưu tiên, trạng thái (áp cho B)

**Nhóm (thứ tự cố định — vị trí học được; theo mockup 3 đã duyệt):** 1 Chờ duyệt · 2 Case quá hạn chốt PA · 3 Sau thi · Bước tiếp · 4 Lộ trình lớp · 5 Phân công (Chưa có người) · 6 Lịch Test (Chưa lịch MT kế) · 7 Việc vận hành quá hạn / ≤ 7 ngày. **Chỉ nhóm có việc mới hiện** (mockup 1c) — ngày thường 3–4 nhóm.
Lý do thứ tự: việc người khác đang chờ mình (duyệt chặn GV) → em đang rủi ro → kế hoạch.

**Mở / gập:** Chờ duyệt luôn mở (≤ 5 dòng + "Xem thêm n" mở tại chỗ); nhóm có ⚠ quá hạn mở (≤ 3 dòng); nhóm còn lại gập, đầu nhóm vẫn có số. → ≤ 4 mục một nhóm khi nhìn lần đầu.

**Trong nhóm:** quá hạn lâu nhất → hạn hôm nay → còn n ngày. Không trộn nhóm khi sắp.

**Phân biệt mức (không chỉ bằng màu):** "⚠ quá hạn 5 ngày" (biểu tượng + chữ cam đậm) · "Hạn hôm nay" (chữ vàng đậm) · "còn 3 ngày" (chữ xám). Đầu nhóm: "Chờ duyệt 10 · ⚠ 1 quá hạn · 2 hôm nay". Không tô nền đỏ / vàng cả hàng.

**Dòng (2 dòng, ≈ 52 px; 375 ≈ 76 px):** dòng 1 = [chip loại — chỉ nhóm Chờ duyệt] tên em hoặc việc · lớp; dòng 2 (13 px, xám) = MỘT dữ kiện bối cảnh (người gửi / chip SOS + kỹ năng / "PA chờ GVCN xác nhận từ 08/10" / "OVR 6.0 · Chưa đạt"); phải = hạn + **động từ của dòng** ("Duyệt ›", "Thêm PA ›", "Chốt ›"). **Cả dòng là vùng bấm**; không đặt 3 nút trên dòng (trừ ô tích khi bật "Chọn nhiều").

**Trạng thái dòng (đủ theo impeccable operate):**
| Trạng thái | Cách hiện | Tiêu chí kiểm |
|---|---|---|
| Thường | nền thẻ | — |
| Rê chuột | nền phủ 8–10 % + động từ gạch chân + con trỏ tay | ≥ 2 tín hiệu đổi; nền chênh ≥ 1,3 : 1 so với nền khu |
| Focus bàn phím | vòng focus 2 px | thấy rõ ở cả sáng / tối |
| Đang chọn | nền `--accent-soft` + viền trái 3 px `--accent` + `aria-current` | khác rê chuột; vẫn thấy khi rê chuột lên dòng khác |
| Đang lưu | nút chính "Đang lưu…" trong chi tiết, dòng giữ chỗ | không cho bấm lặp |
| Vừa xong | dòng mờ "✓ Đã duyệt · Hoàn tác 8 s" (nếu chủ SP chọn Hoàn tác, 9.2-6), chọn tự sang dòng kế **cùng nhóm, đang hiện** | Hoàn tác bấm được ≥ 8 s; không nhảy sang việc khác nhóm |
| Lỗi | dòng giữ "Chưa lưu được — Thử lại", chữ đang gõ giữ nguyên | không mất chữ |
| Người khác đã xử lý | "Đã được … duyệt 08:12" rồi rời danh sách | — |
| Hết nhóm | "✓ Xong Chờ duyệt · Sang Case quá hạn (5) ›" (1 bấm, không tự nhảy) | — |
| Trống cả khu | "✓ Không có việc chờ · hôm nay đã xử lý 6" (mockup 1c) | khối giữ chỗ |
| Lô lỗi một phần | thanh "Đã duyệt 4 · 1 chưa duyệt được: [tên] — lý do · Thử lại" | thẻ lỗi vẫn chọn được |

**Vào trang:** chọn sẵn việc đầu (quá hạn lâu nhất) để khung phải không trống (CV-29), **không đặt con trỏ, không cuộn** (bài học CV-09). Bấm dòng chuông thông báo → về Tổng quan chọn sẵn đúng việc đó.

### 4.5 Khuyến nghị: **B**. So trực tiếp với A

B giữ đúng lõi ý chủ SP — **trái danh sách, phải chi tiết, làm ngay tại đây**. Khác A đúng một điểm: Chờ duyệt **là nhóm đầu của danh sách**, không phải hộp riêng phía trên.
1. **Chi tiết cạnh chỗ bấm.** B: dòng và chi tiết cùng mép trên; khung phải dùng được cả chiều cao màn. A: chi tiết bắt đầu ở y ≈ 540 px, màn đầu chỉ thấy ≈ 360 px; dòng duyệt ở trên, nút Duyệt ở dưới phải → mắt + chuột đi chéo, phải cuộn khi hộp > 3 dòng.
2. **Một kiểu thao tác.** B: mọi nhóm "chọn dòng → làm ở phải → tự sang việc kế". A phải chọn giữa chi tiết xa (A1) hoặc thêm kiểu mở rộng tại dòng (A2) — hai kiểu trên một khu, trái luật "cùng loại thao tác cùng vị trí".
3. **Ngắn hơn ≈ 250–300 px** (bỏ đầu hộp + khoảng cách).
4. **Không sao y Công việc QL** (đang đúng bố cục A).
5. **Đúng cả hai mockup đã duyệt:** mockup 3 khung 1 và mockup 2 khung 3 đều đặt Chờ duyệt là **nhóm đầu của một danh sách** — web hiện tách ra thành hộp riêng là lệch mockup.
6. **Duyệt nhiều vẫn có:** "Chọn nhiều" ở đầu nhóm Chờ duyệt → ô tích ở dòng loại duyệt hàng loạt được (`de_xuat_pa`, `lich_thi`) + thanh "Đã chọn n · Duyệt n" (luật ux "Bulk Actions": cột ô tích + thanh thao tác); "Chọn hết" chỉ dòng đang hiện (A1-14).
7. **Dùng lại mã:** khung phải tại chỗ (`KhungTaiCho`), `PanelViec`, `NganCase`, `PanelBuocTiep`, `PanelLoTrinhLop` đã có ở Công việc; chỉ thêm "chi tiết yêu cầu" = thân `TheYeuCau` + khối `BoiCanh` của Case.

Điểm A hơn B: hàng duyệt rộng hết trang, đọc được "Nếu duyệt" mà không bấm. B bù bằng: dòng 2 của dòng duyệt ghi trích ngắn; người không cần xem bối cảnh dùng "Chọn nhiều" (2–3 bấm cho 10 thẻ).
Vì sao không C: nhanh nhất cho S5 nhưng mọi việc thêm 1 đổi trang; trái C23 [CHỐT] (Cần bạn quyết ở Tổng quan) và ý chủ SP "làm ngay tại đây". Vì sao không D: một khung hai vai, cuộn lồng với QT.

### 4.6 Phân vai Tổng quan ↔ Công việc (tránh "hai nơi một việc") [ĐỀ XUẤT]

| | Tổng quan (QL / QT) | Công việc (QL / QT) |
|---|---|---|
| Trả lời câu | "Hôm nay TÔI phải quyết gì? Lớp nào đang có vấn đề?" | "GV đang nợ việc gì? Ai cần phân công lại / nhập thay?" |
| Có | hàng đợi Cần bạn quyết (7 nhóm ở 4.4) + Lớp cần chú ý + Tuần này | việc của GV, gập theo GV ("Trần Ngọc Hà · 10 việc · ⚠5 ›"), khung phải để xem / nhập thay (nếu được cấp) |
| Không có | từng dòng việc của GV | "Chờ bạn duyệt", "Việc quản lý", "Của tôi" → thay MỘT dòng "Cần bạn quyết · 23 · ⚠12 — ở Tổng quan ›" |
| Số trên menu | "Tổng quan" mang số việc cần quyết (xám) + "⚠ n" (cam) | không số (QL / QT) |
| Trang đầy đủ | "Hộp duyệt đầy đủ ›" (`/cong-viec/cho-duyet`: đã xử lý, để biết, lọc) — link ở đầu nhóm Chờ duyệt | — |
| GV | (không có Tổng quan) | giữ nguyên hàng đợi của GV |

Căn cứ: thứ tự menu [ĐÃ CHỐT 20/10] đặt Tổng quan đầu, Công việc thứ 4 (mockup đặt Công việc đầu) → Tổng quan là trang nhà của QL. Một việc một nơi (X4); số menu đặt ở mục chứa đúng việc đó (một nghĩa cho mọi vai: "việc TÔI phải làm" — sửa A1-13 / A7-13). Thay khuyến nghị 9.2-5 và 9.2-7 của đặc tả 20/10 (đặt Cần bạn quyết đầu trang Công việc) → câu hỏi 2.

**Danh sách BỎ khi làm lại màn (cho bảng truy vết Q1):** dải "HV cần chú ý" · khối Trễ chấm · link "Thống kê theo kỳ" · "Lịch sắp tới" (tab tuần + "L R W S") · câu "Đánh dấu ô ở thẻ…" · câu "Bấm số để xem danh sách" · mọi `NganDanhSach` mở từ số của Lớp cần chú ý · nút "Mở" đổi trang ở thẻ duyệt · khối "Chờ bạn duyệt" + "Việc quản lý" ở Công việc QL.

---

## Phần 5. Thao tác tại chỗ — đánh giá "Thêm PA trên hàng HV" + thang quyết định (II.2.1)

### 5.1 "Nút Thêm PA ngay trên hàng HV, bấm mở rộng tại chỗ"

**Form Thêm PA hiện có (đọc `ThaoTacCase.tsx:49-136`, `FormPa.tsx:23-106`):** Loại PA * (ô chọn 2 nhóm "Bạn tự làm được" / "Cần Quản lý duyệt") · Tên đề xuất * (chỉ khi "Khác") · Nội dung * (ô chữ 2 dòng, ≥ 8 ký tự) · Số buổi (tuỳ, chỉ loại có buổi) · Người dạy / Người thực hiện (tuỳ, ô tìm người) · Bắt đầu * (ngày, mặc định hôm nay) · link "Ghi một PA đã làm trước đây" (→ Ngày đã làm *) · khối Bối cảnh (Nguyên nhân · Kết quả gần nhất) · ⓘ luật. → **4–6 ô + 1 khối bối cảnh**. Cao ≈ 360–480 px (2 cột, 1440) / ≈ 700 px (375).

| | Nay (panel số ⚠5 hoặc "Mở Case") | Đề xuất chủ SP (mở rộng dưới hàng em) | B (khung phải của hàng đợi) |
|---|---|---|---|
| Bấm cho 1 Case | mở (1) + dòng / "+ Thêm PA" (1–2) + Loại (1–2) + Lưu (1) + đóng / quay lại (1) = **5–7** | Thêm PA (1) + Loại (1–2) + Lưu (1) = **3–4** | chọn dòng (1, chỉ lần đầu) + Loại (1–2) + Lưu (1) = **3–4**, tự sang Case kế |
| Panel phủ | 1 | 0 | 0 |
| Bối cảnh | có (khối Bối cảnh) | hàng em đã có SOS + kỹ năng + Case; thêm 1 dòng Nguyên nhân | có |

**Chỗ chật:** trong danh sách 560 px (cột trái của hàng đợi) form phải 1 cột ≈ 500–560 px → đẩy các dòng dưới xuống, dòng kế khuất, trang nhảy. Trong bảng lớp rộng 1 400 px → form gọn 2 hàng (≈ 220 px): `Loại ▾ · Người ▾ · Bắt đầu` / `Nội dung ………… · [Thêm PA]`.

**Kết luận [ĐỀ XUẤT]:** làm đúng ý chủ SP **ở vùng mở rộng của bảng "Lớp cần chú ý"** (và Đang SOS) — rộng hết trang, đã có bối cảnh trên hàng. **Ở hàng đợi** dùng khung phải (đã có sẵn, không đẩy danh sách). **Cùng một component form, cùng thứ tự ô, cùng phản hồi** "✓ Đã thêm PA · Hoàn tác". Không bao giờ trộn hai kiểu trong cùng một danh sách. Kèm sửa CV-23 (Loại PA thành chip 2 nhóm theo panel v3, bỏ "(không bắt buộc)" + câu thừa).

### 5.2 Thang "làm tại chỗ" (áp toàn web) [ĐỀ XUẤT]

Chọn bậc **thấp nhất** đủ cho việc. Tiêu chí: số ô phải điền · bối cảnh cần thấy · không gian · số bước / số đối tượng · đảo được không.

| Bậc | Dạng | Khi nào | Không dùng khi |
|---|---|---|---|
| 0 | **Chỉ xem** — số / chữ không bấm | số để quan sát; vai đó không có hành động khác | — |
| 1 | **Một bấm trên hàng / trong chi tiết** (+ Hoàn tác 8–10 s) | 0 ô, đảo được, bối cảnh đã thấy | hậu quả lớn không đảo được → thêm xác nhận nêu đúng đối tượng |
| 2 | **Hộp nhỏ neo tại nút / mở rộng ngay dưới hàng** | 1–2 ô ngắn (lý do, ngày, tuần, người); hoặc ≤ 4 ô khi danh sách rộng hết trang và bối cảnh có sẵn trên hàng | danh sách hẹp (≤ 600 px), hoặc cần khối bối cảnh |
| 3 | **Khung chi tiết bên phải** (master–detail; 375 = toàn màn + "‹ Quay lại") | 3–6 ô hoặc cần khối bối cảnh; làm tuần tự nhiều việc cùng loại | việc cần bảng nhiều em |
| 4 | **Panel rộng thay khung phải** (720 → 1 440, không phủ thanh trên, không chồng) | bảng nhiều em × lựa chọn của một lớp / một lượt | khám phá nhiều đối tượng |
| 5 | **Trang riêng** | xem hồ sơ (link "↗" tách khỏi nút làm); không gian lớn + khám phá (Kế hoạch Test theo tuần, Lịch Test, Báo cáo in, Hộp duyệt đầy đủ) | việc làm được ở bậc 1–4 |

Luật kèm: một danh sách một kiểu mở (không trộn bậc 2 và 3 trong cùng danh sách) · mở cái mới thì thay cái cũ (không chồng) · nút làm việc ≠ link xem hồ sơ · xác nhận chỉ khi hậu quả lớn · số bấm được phải trông bấm được (ux "Input Affordance") và vùng bấm ≥ 24 px / 44 px.

### 5.3 Áp thang cho mọi thao tác của Tổng quan

| Thao tác | Ô | Bối cảnh | Bậc | Nay (bấm · đổi trang · panel phủ) | Sau |
|---|---|---|---|---|---|
| Duyệt | 0 | đề xuất + Case | **1** (nút chính trong chi tiết; "Chọn nhiều" cho loại hàng loạt) | 1 · 0 · 0; muốn xem bối cảnh +2 đổi trang | 1 sau khi chọn dòng · 0 · 0 |
| Duyệt… (dời lịch thi: chọn tuần) | 1 | tuần GV đề nghị | **2** hộp ngay dưới nút | 2–3 · 0 · 0 | như nay, trong chi tiết |
| Từ chối | 1 (lý do) | đề xuất | **2** ô lý do ngay dưới nút | 2 + gõ | như nay |
| Thêm PA | 4–6 | nguyên nhân, KQ gần nhất | **3** ở hàng đợi; **2** ở bảng lớp rộng | 5–7 · 0 · 1 | 3–4 · 0 · 0 |
| Ghi nhận xét (Case MT cũ) | 1–2 | điểm MT | **3** | 3–4 · 0 · 1 | 2–3 · 0 · 0 |
| Xác nhận Case (Progress) | 2–3 | điểm, nguyên nhân | **3** | 3–4 · 0 · 1 | 2–3 · 0 · 0 |
| Xác nhận PA theo quy chế | 0 | PA | **1** + Hoàn tác | 2 · 0 · 0 (panel số) | 1 |
| Chọn bước tiếp | 1–3 (bước · lớp · bắt đầu) | KQ thi thật | **3** | 3–4 · 0 · 1 | 2–3 · 0 · 0 |
| Gia hạn (bước tiếp / thi thật) | 1 (ngày) | hạn cũ | **2** trong chi tiết | ngăn phủ CHỒNG panel (CV-19) | 2 · 0 · 0 |
| Chốt lộ trình lớp | bảng n em | cả lớp, đề xuất GVCN | **4** + nút "Chốt các em đã có đề xuất (x)" | 2 + n em · 0 · 1 toàn màn | 2 + em chưa đề xuất · 0 · 0 (thay khung phải) |
| Phân công (Case chưa có người) | 1 (người) | môn, lớp | **2** hộp nhỏ neo dòng | 4–5 trong ngăn "Thông tin lớp" cả lớp (CV-07, dễ đổi nhầm cả lớp) | 3 · 0 · 0 |
| Xếp lịch MT kế (chưa lịch Test) | 1 (tuần, gợi ý sẵn) cho cả nhóm em cùng lớp | MT vừa xong | **2** hộp nhỏ | sang Kế hoạch Test: ≥ 3 + 1 đổi trang | 2–3 · 0 · 0 (cần thống nhất luật đếm A7-12) |
| Xem hồ sơ HV / lớp / MT | — | — | **5** link "↗" | lẫn với nút "Mở" | tách riêng |

---

## Phần 6. Mở rộng sang chỗ khác cùng cấu trúc / cùng vấn đề

| Chỗ | Vấn đề (mã) | Hướng ngắn | Bậc |
|---|---|---|---|
| Báo cáo (Phân tích) | số → panel chỉ tên, không điểm / KQ; số lớn không bấm, số nhỏ bấm (A5-07, A5-19; trái C26) | một mẫu "bảng kết quả": HV · Lớp · Đợt · Điểm / KQ · Việc tiếp + nút theo quyền; Báo cáo rộng → mở rộng dưới hàng, panel chỉ khi gọi từ chỗ hẹp | 2 / 3 |
| Học viên & Lớp — hàng lớp | chip SOS / Case / ⚠ "+1" mở 3 kiểu (A3-07) | **cùng thành phần "hàng lớp mở rộng" với Tổng quan** (một mẫu, hai nơi) | 2 |
| Học viên & Lớp — Đang SOS + panel một em | 9 cột, chip 4 dáng, "Vì sao SOS" 2 nội dung (A3-10, A3-11) | 6 cột mockup 6 khung 1, dùng chung dòng em với Tổng quan; chip = hộp "Vì sao" | 1 / 2 |
| Hồ sơ lớp — chip "8 chờ duyệt", "78 bài chờ chấm" | dẫn sang 3 trang khác (A3-07) | "chờ duyệt" → Tổng quan nhóm Chờ duyệt lọc lớp (QL) / bỏ với GV; "bài chờ chấm" → lọc bảng em ngay trên trang | 2 / 5 |
| Lịch Test — 3 ô số đầu trang | trùng đầu khối (TST-03) | bỏ (9.2-20); số + đơn vị ở đầu khối | 0 |
| Công việc GV — "Lớp tôi dạy" | số mở ngăn phủ chồng panel; bảng tràn thẻ (CV-10, CV-19) | số mở trong khung phải (thay việc đang mở, "‹ Việc") | 3 |
| Công việc — Phân công, + Giao việc, Gia hạn | ngăn phủ chồng panel tại chỗ (CV-07, CV-19) | hộp nhỏ | 2 |
| Công việc — tự sang việc kế | nhảy sang nhóm khác, mất Hoàn tác (CV-05) | cùng luật hàng đợi Tổng quan (4.4) — một mã hàng đợi cho cả hai trang | 3 |
| Kế hoạch Test — hộp lịch → menu → panel | 3 lớp chồng (TST-16) | thao tác trong hộp (bậc 2), không mở panel chồng | 2 |
| Tutor — hộp Thêm chồng hộp Gộp (A5-26) | chồng hộp | thay nội dung hộp | 2 |
| Chuông thông báo | dòng dẫn tới "Công việc" chung chung; 3 loại tự động ở "Để biết" (A1-04) | bấm dòng = mở đúng việc tại chỗ (Tổng quan chọn sẵn việc); sửa nhóm ở GĐ1 | — |
| Tổng quan TVV / CX / Admin | ô số 0, đổi trang để tra em (A1-20, 9.2-13) | cùng mẫu "hàng đợi + chi tiết" khi vai có việc | 3 |
| **Rê chuột toàn web (II.6)** | `.row-hover` 4 % ≈ 1,1 : 1 (`index.css:268`); nhiều danh sách việc không có hover; hover ≈ đang chọn ở vài chỗ | 3 mức token: rê chuột (nền ≥ 1,3 : 1 + một tín hiệu nữa), đang chọn (accent-soft + viền trái accent), focus (vòng 2 px); phép kiểm DOM: mọi phần tử bấm được có `:hover` khác nền | — |

---

## Phần 7. Đối chiếu mockup đã duyệt

**Mockup 3 (khung 1 · 1c · 1d · 2):**
| Phần | Giữ khi làm lại | Bỏ / đổi | Mockup cũng có vấn đề chủ SP vừa chê? |
|---|---|---|---|
| Đầu trang một hàng (chi nhánh nút gọn · công tắc có số lớp · Dữ liệu đến · Báo cáo) | **giữ** | thêm "Tất cả" [ĐÃ CHỐT 9.1-4] | — |
| Dải "HV cần chú ý" (5 nút viền) | — | **bỏ** [ĐỀ XUẤT, trái Q6a → câu 3] | **có**: mockup ghi chủ ý "Số khớp: dải = hàng Cả Monbay" → cùng số vẽ hai lần; dải 5 số một dòng |
| Cần bạn quyết: nhóm trong một danh sách, Chờ duyệt đầu, hàng gọn 4 cột, "Nếu duyệt" có ngày, "Hoàn tác · 8 s", "?" hạn duyệt | **giữ** ý nhóm + hàng gọn | đổi sang trái / phải (B) [trái C23 "ba khối dọc" → câu 1] | **có**: mỗi nhóm trải hết danh sách dọc, Cần bạn quyết dài; nút trên mọi hàng |
| Dòng Case quá hạn: chip SOS + kỹ năng, GVCN + chip trạng thái, câu "PA … chờ xác nhận từ 08/10" | **giữ** (web đang thiếu, A1-16) | chip "?" → bấm chip (mockup 6) | — |
| Dòng Bước tiếp: OVR + Đạt / Chưa đạt + điểm kỹ năng | **giữ** | — | — |
| 1c: Lộ trình lớp "đã đề xuất x/y" + tóm tắt; chỉ hiện nhóm khi có việc; trống "✓ Không có việc chờ · hôm nay đã duyệt 6"; lỗi theo khối | **giữ** | — | — |
| Lớp cần chú ý: cột GVCN · HV · Chưa lịch · Chưa điểm · SOS 1/2/3 · HV/Case · Đã thi | **giữ cột** | số = cả ô mở rộng hàng (không panel) | **có**: vùng bấm chỉ ô viền quanh số / chip; ≈ 40 số trong bảng |
| Tuần này: 6 ô tuần (Test · HV · Chấm x/y · ⚠) + bảng "Test tuần này" + Trễ chấm | giữ ý "ô tuần" thu thành một hàng | **bỏ** bảng Test tuần này (trùng Lịch Test), **bỏ** Trễ chấm [ĐÃ CHỐT], bỏ ⚠ trễ theo tuần | **có**: mockup cũng có Trễ chấm; cả trang mockup ≈ 60 con số |
| 1d: panel bài quá hạn cho QL nhập band | — | mất lối vào (Trễ chấm bỏ); nếu cấp quyền nhập thay (9.2-1) → dời sang Lịch Test | **có**: giả định QL có quyền nhập điểm (thật không có) |
| Trạng thái rê chuột | — | thêm (4.4) | **có**: mockup không vẽ hover / đang chọn cho hàng việc |

**Mockup 2 khung 3 (Công việc QL):** Chờ bạn duyệt là **nhóm đầu của một danh sách** + thanh "2 thẻ · Duyệt 2 · Bỏ chọn" → **B làm đúng mẫu này**; web hiện tách hộp duyệt ra trên lưới hai cột (lệch). Với phân vai 4.6, khung này chuyển sang Tổng quan; Công việc QL còn phần "việc của GV" (nhóm Chấm điểm · Case học thuật · Ý thức, "?" giải thích + "Mở để nhập thay").

**Mockup 6 khung 10 ("Báo cáo" thay "Tổng quan", Công việc đầu menu):** **hết hiệu lực** — kế hoạch OV-15 §7 giữ "Tổng quan" (có lý do) và chủ SP [ĐÃ CHỐT 20/10] thứ tự Tổng quan → Lớp/HV → Test → Công việc → Phân tích → Tutor. Theo luật Q6 (quyết định mới trái khung thì sửa mockup) → cần sửa khung 10 trong PR tài liệu kế tiếp để session sau không làm theo khung cũ.

**PR #471 (bản khớp mockup 3 hơn, bị đóng):** **giữ ý tốt** — đầu trang "Fast Track · 6 lớp | Lớp thường · 14 lớp"; số dải in đậm, lớn hơn chữ (phân cấp số / nhãn); dòng Case có chip SOS 3; "Hiện 2 nữa" giới hạn mỗi nhóm; Tuần này là **danh sách tuần một dòng** ("W1 SEP · Test 2 lớp · 16 HV · Chấm 44/72") gọn hơn 6 thẻ, tuần này viền nhấn. **Không lấy:** thẻ Chờ duyệt cao (như web), Trễ chấm, Tuần này + Test tuần này + Trễ chấm nối nhau (trang ≈ 2 000 px).

---

## Phần 8. Câu hỏi cho chủ SP (6 câu, mỗi câu có khuyến nghị)

1. **Bố cục Tổng quan:** dùng **B** (một hàng đợi "Cần bạn quyết" trái danh sách / phải chi tiết, Chờ duyệt là nhóm đầu luôn mở, có "Chọn nhiều") thay A (hộp duyệt riêng ở trên) và thay bố cục "ba khối dọc" của C23? — **Khuyến nghị: B.** Lý do: chi tiết luôn cạnh chỗ bấm, một kiểu thao tác, ngắn hơn, đúng mẫu nhóm của mockup 2 + 3, không sao y Công việc.
2. **Phân vai:** việc QL / QT phải quyết **chỉ ở Tổng quan** (Chờ duyệt · Case quá hạn chốt PA · Bước tiếp · Lộ trình lớp · Phân công "Chưa có người" · Xếp lịch MT kế · Vận hành quá hạn); Công việc của QL / QT chỉ còn việc của GV; số đếm trên menu của QL chuyển sang mục "Tổng quan"? — **Khuyến nghị: có** (thay 9.2-5 và 9.2-7 của đặc tả 20/10).
3. **Bỏ dải "HV cần chú ý"** (thay Q6a): các số chỉ còn ở hàng tổng "Cả Monbay" của bảng — chữ số to hơn, chỉ xem? — **Khuyến nghị: có.** Một số một chỗ; bỏ luôn gốc lỗi "nháy" (GĐ1 vẫn vá 1 dòng để deploy).
4. **Số trong "Lớp cần chú ý":** bấm **cả ô** → mở rộng hàng lớp ngay tại chỗ (em · SOS kèm kỹ năng · MT · Case / PA · việc tiếp · nút theo quyền, gồm **Thêm PA ngay dưới dòng em**); bỏ mọi panel "danh sách tên"; ô SOS 3 số là một vùng bấm? — **Khuyến nghị: có.**
5. **Hệ quả bỏ Trễ chấm:** bỏ luôn "n bài trễ chấm · n GV" ở dải; **giữ** cột "Chưa điểm" (HV) chỉ xem; "Tuần này" còn **một hàng 5 ô tuần** (Test · HV · Chấm x/y, không số trễ), bấm ô → Lịch Test tuần đó; trễ chấm theo GV xem ở Lịch Test / Phân tích GV / Báo cáo? — **Khuyến nghị: theo đúng như vậy.** Kèm: sửa A1-04 ở GĐ1 (thông báo tự động phải vào nhóm "Cần làm").
6. **Thang "làm tại chỗ" 6 bậc (0–5)** làm luật toàn web (ghi vào DESIGN.md + CLAUDE.md sau khi duyệt), gồm luật "Thêm PA: mở rộng dưới hàng ở bảng rộng, khung phải ở hàng đợi — cùng một form"? — **Khuyến nghị: có.**

Sau khi chủ SP trả lời: planning soạn mockup B (1440 tối + 375 sáng, đủ trạng thái 4.4, QL + QT "Tất cả chi nhánh", trống / lỗi / lô lỗi một phần) theo luật CLAUDE.md "màn đổi bố cục phải có mockup duyệt trước khi code".
