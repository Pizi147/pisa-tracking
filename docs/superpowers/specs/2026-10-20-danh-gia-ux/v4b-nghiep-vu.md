# v4b — Nghiệp vụ + workflow vòng 4: luật đã chốt · việc TVV · sửa sau lưu + khoá cứng · Mock Test (21/10)

> **Chỉ đánh giá + đề xuất.** Không sửa repo, không git, không lưu gì trên demo (chỉ mở trang / hộp / menu rồi Esc; 16 ảnh chỉ đọc). DB demo đọc `{readonly}`, API chỉ GET.
> Mã = `main` (chưa deploy; bản chính = deploy 18/10). Demo `http://localhost:5173`, ngày demo **14/09/2026 (W3 SEP)**.
> Viết tắt đường dẫn: `sd/` = `shared/domain/` · `ss/` = `server/src/` · `w/` = `web/src/modules/` · Rb = `thiet-ke/PISA-Rulebook-2026-09-19.md` (số dòng).
> Nhãn: **(A)** đã chốt · **(B)** phương án chủ SP nêu, chưa chốt · **(C)** PTA đề xuất · **(D)** lỗi đã xác nhận · **(E)** cần kiểm chứng · **(F)** xung đột / chưa rõ.
> **Năm luật đã chốt** (không hỏi lại): L1 GVCN lưu xử lý vi phạm → sinh ngay việc TVV · L2 hạn 5 ngày lịch từ lúc lưu (gồm T7, CN) · L3 có quyền thì sửa sau lưu, có lịch sử, giữ duyệt bắt buộc · L4 MT: "-" lần 1 dời tuần tiếp theo, lần 2 huỷ, cả lịch tuần cũ, MT hiện tại giữ gửi duyệt ·
> **L5 (bổ sung 21/10):** GVCN **thu hồi** một lần xử lý đã lưu, hoặc xử lý **không tăng bậc** → phải **gửi QL duyệt, bắt buộc lý do**.

---

## Tóm tắt 10 dòng

1. **L1–L2 chưa có trong mã (A, chưa làm):** TVV không có quyền / việc nào ở Ý thức (chỉ đọc); GVCN tự ghi "Đã gửi Report cho PH qua Zalo" trong ô mô tả. Đề xuất: mỗi lần lưu xử lý → **một việc "Báo PH" cho TVV phụ trách em**, hạn 5 ngày lịch tính cả ngày lưu (Q27-5), form 4 ô (liên hệ được? · cách + ngày · PH phản hồi · tệp), hiện ở **Tổng quan TVV** + một dòng trạng thái ở Ý thức lớp / HV.
2. **Dữ liệu chặn L1:** demo chỉ 4/129 em có TVV; bản chính "chưa gán ai cho tới OV-2b" (`ss/seed/ov2aSeed.ts:3`) → phải gán TVV trước khi bật, nếu không hầu hết việc rơi về QL.
3. **L5 lệch:** GVCN đang **"Xoá lần xử lý" thẳng** (thu hồi không qua ai, `ss/yThuc/xuLy.ts:622-638`, `w/yThuc/XemXuLyPanel.tsx:115`) và **không có đường "không tăng bậc"** (bậc kế do máy chủ tự điền, `xuLy.ts:185`). Đề xuất: hai loại thẻ mới trong ô "Ý thức" của Chờ duyệt, lý do bắt buộc; thu hồi được duyệt = trạng thái "Đã thu hồi" (giữ lịch sử, không xoá vật lý).
4. **Ảnh 5.webp tái hiện trên demo** (GV 20 / GV 21, MB FOU 14): khoá do **R11 "đợt hoàn tất"** = mọi môn có điểm + qua Chủ nhật → một GV bị khoá vì GV môn khác nhập xong. **Không có bước duyệt nào** ("nhờ Quản lý hiệu chỉnh" ngoài web) → **lỗi theo L3**: gỡ R11 cho GVBM đúng ô (FT, lớp thường, MT cũ 7 ngày, lớp đã kết thúc có lý do); hệ quả SOS / Case / Báo PH đã có sẵn vì QL vẫn sửa được.
5. **Rà 29 chỗ khoá:** nới / sửa 11, giữ 15 (lý do nghiệp vụ / toàn vẹn), đã nới trước 2, **1 chỗ ngược (thiếu duyệt bắt buộc — L5)**. Có thêm lỗi (D): GVCN lớp FT thấy nút "Xếp lại bài vắng" mà máy chủ trả 403.
6. **Lịch sử:** điểm, HV, lớp, thi thật đủ "ai · lúc · cũ → mới"; **thiếu** ở lần xử lý Ý thức (chỉ trong `audit_logs`), Phối hợp SOS, nhận xét Tutor. **Không có nút Khôi phục:** "Huỷ điểm" xoá luôn nhận xét + nhóm nguyên nhân + GV chấm (`ss/fasttrack/attempts.ts:2256-2262`) → khôi phục = gõ lại cả điểm lẫn nhận xét ≥ 10 ký tự.
7. **L4 lệch:** "-" ghi **sau tuần thi** ở MT hiện tại và "-" ở **MT cũ** đều thành **"Không dự thi"** ngay (không dời, không đếm — `attempts.ts:2135-2136`, `ss/fasttrack/absence.ts:975`, `sd/vang.ts:11-16`); nút trong hộp chấm đổi chữ "Vắng" → "Không dự thi" (ảnh v4b-03, v4b-04). Đây là chốt 11/10 (đặc tả OV §3.3) — L4 (20/10) thay.
8. **L4 khớp:** "-" trong tuần thi: lần 1 máy dời tuần kế của lịch, lần 2 huỷ (vắng 2 lần). "Gửi duyệt" còn **đúng một đường**: thẻ "Dời lịch" khi lần 1 không tự dời được (tuần kế đã qua hẳn / vướng MT sau). "Xin dời" chỉ còn route máy chủ, không có nút web.
9. **Đường đau MT:** 4 thao tác cùng chữ "huỷ / xoá" khác nghĩa + cùng trạng thái hai bộ nút ("Khôi phục → Chưa xếp · Giữ huỷ" ở hộp lịch ↔ "Khôi phục và đặt tuần · Không mock lại" ở hồ sơ MT). Đường "huỷ điểm → hồ sơ MT → gõ lại điểm → mới dời lịch" ≈ 13 bấm, 2 trang → đề xuất **một hộp một đợt + Khôi phục điểm một bấm** ≈ 3–4 bấm. **Bảng chuyển trạng thái MT: 12 trạng thái × 30 chuyển** (mục B), 4 dòng lệch L4, 3 dòng lệch L3.
10. **16 chỗ Rulebook phải sửa chữ**; **10 câu hỏi** cho chủ SP — quan trọng nhất: Q1 lần xử lý cần QL duyệt (ngoài thang / không tăng bậc) sinh việc TVV lúc nào · Q4 MT cũ "-" lần 1 dời sang tuần nào · Q5 điểm biên của L5.

---

## Phần 0. Phạm vi + cách làm

- **Đọc:** brief-v4; master prompt đủ 369 dòng (trọng tâm II, XII, XIII, XIV, III.9, VII, XV); Rb §17, §19, §20 (dòng 642–912); tài liệu chính 9.2, 11.3–11.4, 12.2; v3a Phần 1; v2b V6, V8; a3, a4; đặc tả OV 11/10 §3.2–3.4; mockup vai TVV 13/10; lời chủ SP 21/10 về thu hồi / không tăng bậc (qua PTA Plan).
- **Mã đã lần theo:** `sd/{yThuc, thaoTacMt, vang, fasttrack, lichMt, keHoachTest, keHoachOv15c, cases}` · `ss/yThuc/{xuLy, trangThai, phoiHop, violations}` · `ss/duyet/{loaiYeuCau, deXuatSua}` · `ss/worklist/{mywork, hvCuaToi}` · `ss/classes/hocVienTheoVai` · `ss/loTrinh/{thiThat, buocTiep}` · `ss/fasttrack/{absence, attempts, skillSchedule, hoanTat, ketQuaHuy}` · `ss/keHoach/keHoachTest` · `ss/normal/{regular, cuoiKhoa}` · `ss/platform/{lichSu, nav}` · `ss/permissions` · `ss/seed/data` · `ss/ops/chotVangDinhKy` · `ss/tutors/trang` · `ss/cases/cases` · web: `w/cham/LuoiThuong`, `w/fasttrack/{MockDetailPage, HopThaoTacMt, HopNhapDiem, ScoreEntry}`, `w/test/keHoach/HopKyNang`, `w/yThuc/{XacNhanXuLyPanel, XemXuLyPanel}`, `w/students/HocVienTheoVai`, `w/worklist/HocVienCuaToi`, `w/congViec/PanelViec`.
- **Ảnh (16, chỉ đọc):** `NEW\anh\v4b\v4b-01…16` — danh sách cuối báo cáo. Spec + script: `NEW\chup\v4b-1.json`, `v4b-2.json`, `v4b-db.cjs`, `v4b-api.mjs`.
- **Chưa làm được:** bấm Lưu thật (cấm) → hành vi sau khi lưu suy từ mã · số liệu bản chính (số em có TVV, số lần xử lý / tuần, số ô "Không dự thi" từ 18/10) → **[CẦN DỮ LIỆU]** · đường đau MT đúng như chủ SP đã gặp → **[CẦN ẢNH]** (Phần cuối).

---

## Phần A. Đối chiếu 5 luật với mã + Rulebook (bảng gọn — chi tiết ở các mục V4B)

| Luật | Mã đang làm gì (tệp:dòng) | Khớp? | Phải sửa (máy chủ · web · dữ liệu cũ) | Biên luật chưa nói | Phép kiểm |
|---|---|---|---|---|---|
| **L1** việc TVV khi GVCN lưu xử lý | `luuXuLy` ghi lần xử lý `done` + chuông QL "để biết" khi WL 1 / R4+Meeting / WL 2 (`ss/yThuc/xuLy.ts:151, 174-206`); **không có gì cho TVV**. TVV không có quyền `discipline.*` (`ss/seed/data.ts:103`) → chỉ đọc tab Ý thức (ảnh v4b-12). Placeholder mô tả GVCN "Đã gửi Report cho PH qua Zalo" (`w/yThuc/XacNhanXuLyPanel.tsx:280`). | **Chưa có** | Máy chủ: lưu kết quả báo PH gắn lần xử lý, đặt hạn lúc lưu, đóng khi thu hồi / em nghỉ, quyền mới cho TVV, việc TVV + chuông, `/lich-su` loại Ý thức. Web: khối "Việc của tôi" Tổng quan TVV + form; dòng trạng thái ở Ý thức lớp / HV; đổi placeholder. Dữ liệu: **không** sinh việc cho lần xử lý trước ngày bật; **gán TVV** cho em trước. | Lần xử lý cần QL duyệt (Q1) · không liên hệ được PH (Q2) · em không có TVV (Q3) | K1–K12 (V4B-01) |
| **L2** hạn 5 ngày lịch | — (chưa có việc). Quy ước hệ thống: `hanTheoNgay(batDau, n) = batDau + (n−1)` (`sd/cases.ts:766-769`), "n ngày liên tiếp, tính cả ngày đầu, quá hạn khi hôm nay > hạn" (Rb 708, Q27-5); Ý thức dùng 5 (`sd/yThuc.ts:195`). | — | Hạn = **ngày lưu (giờ VN) + 4, hết 23:59** (cùng Q27-5); lưu lần đầu, sửa không đổi hạn; em Tạm dừng dừng hạn (T65). | — (chỉ làm rõ giờ — PTA quyết, ghi để biết) | K1, K2, K7 |
| **L3** sửa sau lưu, có lịch sử | R11: đợt hoàn tất → chỉ QL sửa / xoá điểm (`sd/keHoachTest.ts:63-81`, `ss/fasttrack/hoanTat.ts:112-130`, `attempts.ts:2033-2044, 1415-1419`, `ss/normal/regular.ts:634-643`, `sd/thaoTacMt.ts:61`, `w/cham/LuoiThuong.tsx:462-468`). Tutor nhận xét chỉ 24 giờ (`ss/tutors/trang.ts:327`). Lịch xử lý Ý thức không xem được. | **Lệch** | Gỡ R11 cho GVBM đúng ô; MT cũ 7 ngày; lớp đã kết thúc (lý do bắt buộc); Tutor sửa mọi lúc; "Khôi phục điểm"; lịch sử Ý thức xem được. Dữ liệu cũ: không cần migrate. | Các khoá chủ SP "giữ nguyên" 15/10 (Q9) | V4B-03/04/05 |
| **L4** "-" MT | Trong tuần thi: chốt ngay, lần 1 máy dời tuần kế của lịch, lần 2 huỷ (`absence.ts:254-346, 750-826`) ✓. **Sau tuần thi / MT cũ → "Không dự thi"** (`attempts.ts:2135-2136`, `absence.ts:975`, `sd/vang.ts:11-16`, `sd/fasttrack.ts:355-365`) ✗. MT cũ bị chặn khỏi mọi luồng vắng (`absence.ts:224, 356, 483, 965`). | **Lệch** | Máy chủ: bỏ nhánh "Không dự thi" cho dấu mới ở MT; MT hiện tại trễ → lần 1 dời / thẻ QL; MT cũ → lần 1 dời tuần kế của lịch; tính lại cờ MT cũ sau dời. Web: nút "Vắng" (bỏ chữ "Không dự thi"). Dữ liệu cũ: giữ `no_show_cu`, liệt kê cho QL. | Tuần đích MT cũ (Q4) · chuỗi sau Khôi phục (Q6) · MT0 (Q7) | Mục B + D |
| **L5** thu hồi / không tăng bậc → QL duyệt + lý do | Thu hồi: GVCN **xoá thẳng** lần xử lý mới nhất (`xuLy.ts:558-561, 622-638`; route `ss/routes/index.ts:1388`; nút `XemXuLyPanel.tsx:115`). Không tăng bậc: **không có** (bậc kế tự điền `xuLy.ts:185`; chỉ có 4 loại ngoài thang qua QL `xuLy.ts:493-553`). | **Lệch** (thu hồi) · **Thiếu** (không tăng bậc) | Máy chủ: thẻ "Thu hồi xử lý" + "Xử lý không tăng bậc" (loại `y_thuc` mở rộng), trạng thái "Đã thu hồi" thay xoá vật lý; GVCN mất quyền xoá thẳng; QL thu hồi trực tiếp có lý do (tự duyệt). Web: nút "Thu hồi…" thay "Xoá lần xử lý"; "Không tăng bậc…" trong panel Xác nhận xử lý. Dữ liệu cũ: không. | Bấm nhầm ngay sau lưu · TVV đã báo PH rồi thu hồi · bằng chứng tệp (Q5) | V4B-02 |

---

## Phần B. Các vấn đề (mỗi mục đủ 10 ý)

### V4B-01 · L1–L2 — Việc TVV "Báo PH kết quả xử lý vi phạm" chưa có — (A chưa làm) · P1 · TVV, GVCN, QL

**1. Ở đâu.** Ý thức: panel Xác nhận xử lý / Đề xuất QL duyệt (hồ sơ lớp › Ý thức & Phối hợp, hồ sơ HV › Ý thức, Công việc nhóm `yt_*`); Chờ duyệt (thẻ Ý thức); vai TVV: Tổng quan TVV, Học viên & Lớp (TVV) › Cần làm, hồ sơ HV.

**2. Biểu hiện — luồng hiện tại (đã kiểm mã).**
```
Ghi vi phạm (mọi GV dạy lớp)          → "Mới"; chuông GVCN nếu người khác ghi (xuLy.ts:458-473)
   │  ≥ 3 vi phạm chưa xử lý trong [T2 tuần trước, ngày ghi] → "Cần xử lý / bắt buộc", hạn 5 ngày từ ngày ghi vi phạm thứ 3 (sd/yThuc.ts:225-277)
   ├─ GVCN/QL "Ghi nhận" (đã xem, không biện pháp; hạn 5 ngày từ ngày ghi; chặn khi bắt buộc)          xuLy.ts:97-121 · Bỏ ghi nhận :124-139
   ├─ GVCN/QL "Xác nhận xử lý" — bậc kế MÁY ĐIỀN: R1 › R2 › WL1 › R4+Meeting CX/GĐCN › R5 › WL2 › R7, R8…  xuLy.ts:153-206
   │     ngày ≤ hôm nay · người thực hiện · mô tả ≥ 10 ("Ví dụ: Đã gửi Report cho PH qua Zalo") · tệp tuỳ chọn → "Đã xử lý · Report n"
   │     QL nhận chuông "để biết" khi WL1 / R4+Meeting / WL2 (xuLy.ts:151, 197-203)
   ├─ GVCN "Đề xuất QL duyệt" — WL3 · Meeting CX/GĐCN riêng · Đình chỉ tạm thời · Khác (không đẩy bậc)
   │     nháp → ≥ 1 tệp/liên kết bắt buộc → Gửi → thẻ "Ý thức" ở Chờ duyệt, QL 5 ngày (xuLy.ts:493-553)
   │     QL Duyệt → "Đã duyệt · chờ thực hiện" → GVCN "Đã thực hiện" trong 5 ngày từ ngày duyệt (xuLy.ts:273-294)
   │     QL Từ chối (lý do bắt buộc) → vi phạm về "Cần xử lý" từ ngày quyết, bậc giữ (ss/duyet/loaiYeuCau.ts:400-446)
   └─ Quá hạn (bắt buộc > 5 ngày, hoặc "Mới" > 5 ngày chưa ai xem) → thẻ "Báo QL" tự tạo / tự đóng (loaiYeuCau.ts:448-500)
Sửa (OV-7a): sửa ngày / người / mô tả · thêm / bớt vi phạm · "Chưa thực hiện" · XOÁ lần xử lý mới nhất (GVCN + QL) · Rút đề xuất đang chờ.
```
- **Phụ huynh:** không có bước nào riêng. Báo PH nằm lẫn trong ô mô tả của GVCN. **TVV không xuất hiện** trong luồng Ý thức.
- Việc gần nhất đang có: **"Báo phụ huynh qua TVV"** — chỉ cho Progress / Final lớp thường có môn trượt, là **việc của GVCN** (GVCN nhờ TVV ngoài web rồi tự đánh dấu đã làm), không hạn (M-05): `ss/yThuc/phoiHop.ts:97-135`, `ss/worklist/mywork.ts:197-201, 994-1030`, panel `PanelBaoPh` (`w/congViec/PanelViec.tsx:192-202`) mở Phối hợp SOS của em; form xác nhận chỉ có ngày · người · ghi chú (`phoiHop.ts:475-500`) — **không có "PH phản hồi", "liên hệ được không"**.

**3. Bằng chứng.** Mã trên · ảnh v4b-08 (panel Xác nhận xử lý, placeholder "Đã gửi Report cho PH qua Zalo"), v4b-12 (TVV xem tab Ý thức chỉ đọc, thanh "ĐANG XỬ LÝ: GVCN · Ghi nhận 1 vi phạm mới"), v4b-10 (Tổng quan TVV chỉ 5 ô số, không danh sách việc), v4b-11 (Cần làm TVV rỗng), v4b-07 (thẻ "Đề xuất WL 3" đang chờ QL). DB demo: 16 lần xử lý (14 đã xử lý, 1 WL 3 chờ duyệt, 1 Đình chỉ bị từ chối); **4/129 em có TVV**, một TVV (CP); bản chính chưa gán TVV tới OV-2b (`ss/seed/ov2aSeed.ts:3`); ngoài `consultant_user_id` còn cột chữ `consultant_name` từ Thêm HV (`ss/classes/intake.ts:478`) — không phải tài khoản, không giao việc được.

**4. Nguyên nhân.** Thiết kế Ý thức v4 (27/09) để GVCN tự làm hết; TVV thêm sau (OV-2a, OV-8b) với vai "báo phụ huynh, giữ chân học viên" (mockup vai 13/10) nhưng chỉ đọc. L1–L2 là luật mới (20/10).

**5. Ảnh hưởng.** Không ai chịu trách nhiệm ghi "PH đã biết chưa, phản hồi gì"; GVCN phải nhắn TVV ngoài web; QL không biết lần xử lý nào PH chưa được báo; báo cáo đếm "Report đã làm" nhưng không biết PH đã nhận. TVV không có chỗ nào thấy việc + hạn.

**6. Phương án.**

**6a. Khi nào sinh việc (L1 + lời chủ SP).**

| Thao tác (ai) | Sinh việc TVV? | Lý do |
|---|---|---|
| Xác nhận xử lý — bậc thang R1 … WL2, R7+ (GVCN **hoặc QL**, một em hay "Chọn nhiều") | **Có, ngay khi lưu** | đúng L1; QL lưu thay cũng là "lưu xử lý" (C — PTA quyết) |
| Đề xuất ngoài thang (WL3, Meeting CX/GĐCN, Đình chỉ, Khác) / **không tăng bậc** (L5) | **Q1**: lúc gửi đề xuất, hay lúc GVCN ghi "Đã thực hiện" sau duyệt | luật nói "không cần đợi bước phê duyệt khác" nhưng chưa nói ca cần QL duyệt |
| Ghi nhận · Bỏ ghi nhận · Khai bậc HS cũ | Không | không phải lần xử lý |
| Sửa ngày / người / mô tả · thêm vi phạm vào lần xử lý | Không sinh mới; việc cũ giữ hạn | L3 — sửa, không phải lưu mới |
| Chưa thực hiện (bỏ "Đã thực hiện" bấm nhầm) | Việc chưa ghi → tự huỷ; ghi "Đã thực hiện" lại → mở lại cùng việc, hạn từ lần lưu mới | C — PTA quyết |

Khuyến nghị Q1: **lúc "Đã thực hiện"** (sau duyệt) — vì: (1) trước khi QL duyệt chưa có gì để báo PH; TVV báo PH một biện pháp QL có thể từ chối (WL 3, đình chỉ) là rủi ro thật; (2) QL có 5 ngày để duyệt — nếu việc TVV chạy song song thì TVV có thể quá hạn vì chờ QL (sai người chịu); (3) bậc thang (đa số trường hợp, không cần duyệt) vẫn sinh ngay đúng L1. Nếu chủ SP chọn "lúc gửi": QL từ chối → việc TVV chưa ghi tự huỷ ("QL từ chối — không báo PH"); đã ghi → giữ, chuông TVV + GVCN "báo lại PH".

**6b. Form — ba phương án (đếm bấm từ dòng việc, ca thường gặp "đã gọi, PH đồng ý").**

| | F1 "Một câu" | **F2 "Bốn ô có cấu trúc" (khuyến nghị)** | F3 "Kịch bản báo PH" |
|---|---|---|---|
| Ô | Đã báo PH / Chưa liên hệ được · ghi chú bắt buộc | **Liên hệ** [Đã báo PH · Chưa liên hệ được] · **Cách** (Gọi · Zalo/nhắn · Gặp trực tiếp) + **Ngày** (`ONgay`, mặc định hôm nay, ≥ ngày GVCN lưu, ≤ hôm nay) · **PH phản hồi** [Đồng ý phối hợp · Có ý kiến khác] + ghi chú (bắt buộc khi "Có ý kiến khác") · **Tệp / liên kết** tuỳ chọn | F2 + danh sách nội dung phải báo, tick "Đã báo đủ" |
| Bấm | 3 + gõ ≥ 10 ký tự | **4, không gõ** (mở · Đã báo · Đồng ý · Lưu; "Gọi" mặc định) | 5 |
| Dùng được cho | chỉ đọc chữ | chuông GVCN khi PH không đồng ý; đếm "đã báo PH" trong báo cáo | như F2 |
| Nhược | không đếm được, không biết PH phản ứng | nhiều ô hơn F1 (đã gom 1 hàng) | thêm bước tick vô nghĩa |

Đầu form (chỉ đọc, 2 dòng): "**Report 2** · 3 vi phạm (BTVN 07/10, 09/10 · Đi muộn 10/10) · GVCN lưu 13/10 · **hạn CN 17/10**" + "Nội dung GVCN: …" + "PH: {tên} ({quan hệ}) · {SĐT} [Gọi]" (thiếu SĐT → ô "Thêm SĐT PH" ngay trong form — không sinh việc "thiếu liên hệ" riêng). Chân: Lưu (Enter) · Đóng; đang lưu / đã lưu / lỗi giữ chữ.
Khi "Chưa liên hệ được": chip "Đã thử" (Gọi không nghe · Nhắn chưa trả lời · Sai số) + ghi chú tuỳ chọn → **Lưu lần thử** (việc vẫn mở, ghi "lần n", hạn vẫn chạy) · nút phụ **Kết thúc · không liên hệ được** (ghi chú bắt buộc, GVCN nhận chuông) — **Q2**.
Tên việc: **"Báo PH · Report 2 · {em}"**, nút "Ghi kết quả" — **không dùng chữ "Ghi nhận"** (đã là tên thao tác của GVCN "Ghi nhận vi phạm mới" — một khái niệm một tên).

**6c. Trạng thái việc (một tên mỗi trạng thái).** `Chờ báo PH` (mở) → `Chưa liên hệ được · lần n` (mở) → `Đã báo PH · dd/mm` | `Không liên hệ được` (đóng) · `Đã huỷ` (hệ thống: lần xử lý thu hồi / bỏ "Đã thực hiện" / em nghỉ — khi chưa ghi). **Quá hạn** = đang mở và hôm nay > hạn → chữ cam + ⚠ (không chip nền — DESIGN.md). Sau khi đóng: TVV / QL **sửa được mọi lúc** (L3), nhật ký trước → sau; "Không liên hệ được" → sửa thành "Đã báo PH" khi liên hệ được muộn.

**6d. Người giữ việc.**
- Mặc định: **TVV phụ trách em** (`students.consultant_user_id`, tài khoản đang hoạt động, cùng chi nhánh — `kiemTvvCungChiNhanh`, `ss/students/students.ts:826`).
- Không có TVV / tài khoản TVV khoá → **QL chi nhánh** của em, dòng ghi "Chưa có TVV · Gán TVV"; gán xong → việc sang TVV, **hạn giữ** (**Q3**).
- Đổi TVV → việc đang mở đi theo TVV mới (tính khi đọc, không migrate); kết quả đã ghi giữ tên người ghi.
- **Ai ghi được:** TVV của chi nhánh em + QL / QT (thay khi cần). GV / GVCN chỉ xem.
- **Nhiều em một lô** ("Chọn nhiều"): mỗi em một việc (mỗi PH khác nhau); danh sách TVV gom theo lớp. **Một em có ≥ 2 lần xử lý chưa báo** → một dòng "2 lần xử lý chờ báo PH", **một form ghi chung** (mỗi lần xử lý vẫn một bản ghi) — không nhập lại.

**6e. Hiển thị (không lặp dữ liệu).**
- **TVV:** Tổng quan TVV — khối **"Việc của tôi"** trên đầu (trên 5 ô số), quá hạn trước; bấm dòng → form mở ngay dưới dòng (375: tấm dưới đáy, nút [Gọi PH]); chuông "Cần làm" khi có việc mới + chuông tự động khi quá hạn (mẫu OV-15d). Góc "Cần làm" ở Học viên & Lớp TVV thành bộ lọc (khớp 9.2-13, 11.8-8).
- **GVCN / QL — Ý thức lớp (phương án A, 11.3):** ô "Thang" thêm một dòng phụ: `PH: chờ TVV · hạn 17/10` · `⚠ TVV quá hạn 2 ngày` · `PH ✓ 15/10` · `PH ✗ không liên hệ được` (chữ + ký hiệu, không chỉ màu); mở rộng hàng → lần xử lý + kết quả TVV đủ chữ.
- **Hồ sơ HV (11.4):** cùng thành phần, mở sẵn; thanh "ĐANG XỬ LÝ" đầu hồ sơ ghi người giữ việc (TVV) + hạn.
- **Panel Xác nhận xử lý sau khi lưu:** "✓ Đã xác nhận · TVV {tên} nhận việc báo PH · hạn CN 17/10" (hoặc "Chưa có TVV — việc về Quản lý") — 0 bước thêm. Placeholder mô tả đổi: "Ví dụ: Report 2 — bỏ BTVN 3 buổi; nhờ PH kiểm tra vở" (nội dung để TVV báo, không còn "Đã gửi Report…").
- **QL:** Công việc › Tất cả (lọc người phụ trách); việc mà QL giữ (em chưa TVV) vào "Của tôi". **Không** thêm ô số Tổng quan QL, **không** thẻ Báo QL khi TVV quá hạn (Q3).
- **Báo cáo:** Phân tích › Ý thức (Y1) bảng "Xử lý đã làm trong kỳ theo loại" thêm cột "Đã báo PH n/m"; Xuất Excel Ý thức sheet xử lý thêm 3 cột (Báo PH · ngày · PH phản hồi) — C, làm cùng M6.

**6f. Tình huống biên (khuyến nghị; ★ = hỏi chủ SP).**

| # | Tình huống | Khuyến nghị |
|---|---|---|
| E1 ★ | Lần xử lý cần QL duyệt (ngoài thang / không tăng bậc) | Q1 — sinh lúc "Đã thực hiện" |
| E2 ★ | QL từ chối sau khi việc TVV đã sinh (chỉ khi Q1 = "lúc gửi") | chưa ghi → tự huỷ; đã ghi → giữ, chuông TVV + GVCN |
| E3 | GVCN sửa lần xử lý sau khi lưu (L3) | việc giữ, hạn không đổi; TVV thấy nội dung mới; nếu TVV **đã** báo PH và GVCN đổi loại / ngày / mô tả / vi phạm → chuông TVV "nội dung đã sửa — kiểm lại với PH" |
| E4 ★ | GVCN xin **thu hồi** (L5) — đang chờ QL | việc TVV vẫn chạy (lần xử lý còn hiệu lực tới khi QL duyệt), dòng việc ghi "GVCN đang xin thu hồi"; QL duyệt thu hồi → việc chưa ghi tự huỷ; đã ghi → giữ + chuông TVV "để biết" (Q5b) |
| E5 | GVCN "Chưa thực hiện" | như thu hồi được duyệt (việc chưa ghi huỷ) |
| E6 | Em chuyển lớp | việc theo em (TVV không đổi); GVCN lớp mới thấy trạng thái; hạn **không** đặt lại (khác hạn GVCN M-08 — việc TVV không gắn lớp) |
| E7 | Em Tạm dừng | ẩn, dừng hạn (T65); Quay lại học → hạn = max(ngày lưu, ngày quay lại) + 4 |
| E8 | Em Lưu trữ / Kết thúc học | việc chưa ghi tự đóng "Em đã nghỉ"; đã ghi giữ |
| E9 ★ | Em chưa có TVV / TVV nghỉ / đổi TVV | Q3 — QL giữ; đổi TVV việc đi theo, hạn giữ |
| E10 | "Chọn nhiều" 3 em | 3 việc; danh sách gom theo lớp |
| E11 | Một em 2 lần xử lý trong 5 ngày | một dòng, một form ghi chung, 2 bản ghi |
| E12 ★ | PH không liên hệ được | Q2 |
| E13 | Lần xử lý do QL lưu | vẫn sinh |
| E14 | Lần xử lý "Khác" không liên quan PH | vẫn sinh (L1 không ngoại lệ); TVV ghi cách "GVCN/CX đã báo trực tiếp" |
| E15 | Ngày thực hiện GVCN lùi (performedOn < ngày lưu) | hạn tính từ **ngày lưu** (L2), không từ ngày thực hiện |
| E16 | Lần xử lý trước ngày bật tính năng | không sinh (tránh dồn việc quá hạn giả) |
| E17 | CX | không nhận việc; xem được |
| E18 | GVCN đã tự gặp PH (Meeting) | không có ô "bỏ qua TVV"; TVV ghi "GVCN đã báo trực tiếp" (1 bấm thêm ở chip Cách) |

**6g. Phải sửa.** Máy chủ: (1) kết quả báo PH gắn **một-một** với lần xử lý — ponytail: thêm cột vào `discipline_measures` (`bao_ph_han`, `bao_ph_tt`, `bao_ph_cach`, `bao_ph_ngay`, `bao_ph_ph`, `bao_ph_ghi_chu`, `bao_ph_boi`, `bao_ph_luc`), lần thử + sửa ghi `audit_logs`; đặt hạn trong `luuXuLy` (+ `daThucHien` theo Q1); (2) đóng tự động ở thu hồi (L5) / `chuaThucHien` / lưu trữ; (3) quyền mới `discipline.bao_ph` cho consultant, manager, system_admin (phạm vi chi nhánh); (4) việc TVV nhóm `bao_ph` qua `/my-work` cho TVV (không mở trang Công việc) + chuông; (5) `/lich-su` thêm loại "y-thuc". Web: khối việc Tổng quan TVV + form (dùng lại `KhungPanel`, `ONgay`, chip lựa chọn), dòng trạng thái ở `ThangYThuc` / dòng lần xử lý, placeholder. Dữ liệu: lệnh chỉ đọc trước bật — số em chưa có `consultant_user_id` theo chi nhánh; QL gán qua Sửa cả lớp (cột TVV đã có, `ss/classes/suaCaLop.ts:40`).

**7. Xuyên trang / vai.** Hồ sơ lớp Ý thức (A), Hồ sơ HV (M3b), Công việc (QL), Tổng quan TVV (M7), Học viên & Lớp TVV, Chờ duyệt (Q1), Phân tích Ý thức (Y1), Xuất Excel Ý thức (E1), chuông. Không đụng thang, hạn GVCN, Ghi nhận, bắt buộc xử lý, thẻ Báo QL.

**8. Luật.** L1, L2, L3, L5; Rb §20.3 (thang, QL duyệt ngoài thang), T65 (Tạm dừng), Q27-5 (cách tính ngày), M-08 (hạn theo lớp — không áp cho TVV).

**9. Kiểm thử.** K1 lưu bậc thang → 1 việc, hạn = ngày lưu VN + 4, người giữ = TVV · K2 lưu 23:30 giờ VN ngày D → hạn D+4 (không lệch UTC) · K3 em không TVV → QL; gán TVV → đổi người, hạn giữ · K4 Ghi nhận / Khai bậc → 0 việc · K5 đề xuất ngoài thang / không tăng bậc → theo Q1 · K6 thu hồi được duyệt: việc chưa ghi → "Đã huỷ"; đã ghi → giữ + chuông · K7 Tạm dừng → ẩn, không quá hạn; Quay lại → hạn mới · K8 TVV sửa kết quả → nhật ký trước/sau, xem ở Lịch sử · K9 GV / GVCN ghi kết quả → 403 · K10 2 lần xử lý cùng em → 1 lần ghi, 2 bản ghi · K11 quá hạn → 1 chuông (khoá chống trùng) · K12 "Chọn nhiều" 3 em → 3 việc. Ảnh cặp: Tổng quan TVV 1440 tối + 375 sáng (cần mockup — màn mới).

**10. Cần chủ SP.** **Q1, Q2, Q3** (+ Q8 liên quan việc "Báo PH qua TVV" của lớp thường).

---

### V4B-02 · L5 — Thu hồi lần xử lý / xử lý không tăng bậc phải qua QL duyệt — (A mới) · lệch + thiếu · P1 · GVCN, QL, TVV

**1. Ở đâu.** Panel xem lần xử lý (`XemXuLyPanel`), panel Xác nhận xử lý (`XacNhanXuLyPanel`), Chờ duyệt (ô "Ý thức"), Ý thức lớp / HV.

**2. Biểu hiện — đối chiếu "cái gần nhất đang có".**

| Đang có | Ai | Qua QL? | So với L5 |
|---|---|---|---|
| **Xoá lần xử lý** (chỉ lần mới nhất của chuỗi, hỏi một dòng) — `xuLy.ts:622-638`, quyền `quyenSuaXuLy` = GVCN lớp em + QL (`:558-561`), nút `XemXuLyPanel.tsx:115` | GVCN, QL | **Không** | **LỆCH** — đây chính là "thu hồi"; GVCN phải gửi QL + lý do |
| **Rút đề xuất** đang chờ QL (`xuLy.ts:644-648`) | người gửi | không | không phải thu hồi (biện pháp chưa có hiệu lực) — **giữ** |
| **Chưa thực hiện** (bỏ "Đã thực hiện" bấm nhầm, lần xử lý về "Đã duyệt · chờ thực hiện") — `xuLy.ts:297-315` | GVCN, QL | không | không phải thu hồi (biện pháp đã duyệt vẫn còn) — **giữ** (C, PTA quyết) |
| **Sửa vi phạm của lần xử lý** (thêm / bớt, còn ≥ 1) — `xuLy.ts:586-616` | GVCN, QL | không | bớt vi phạm = thu hồi **một phần** → PTA đề xuất **coi là sửa (L3)**: bậc không đổi, vi phạm bị bớt về chưa xử lý, lịch sử giữ (ghi để chủ SP biết) |
| **Đề xuất QL duyệt** ngoài thang (WL3, Meeting CX/GĐCN, Đình chỉ, Khác) — không đẩy bậc, bắt buộc mô tả ≥ 10 + ≥ 1 tệp (`xuLy.ts:493-553`) | GVCN | có | **gần nhất** với "không tăng bậc" — nhưng không có lựa chọn "lặp bậc hiện tại / bậc thấp hơn"; "Khác" phải gõ tên + tệp |
| Xác nhận xử lý — bậc kế máy điền, client không gửi loại (`xuLy.ts:185`) | GVCN | không | **THIẾU** đường "không tăng bậc" |
| "Đưa lại Cần xử lý", "Bỏ ▾" ở **Phối hợp SOS** | GVCN | không | không phải xử lý vi phạm (Phối hợp ≠ vi phạm, Rb §19) — ngoài L5, giữ |

**3. Bằng chứng.** Mã trên; route `DELETE /y-thuc/xu-ly/:id` (`ss/routes/index.ts:1388`); xoá là **xoá vật lý** dòng `discipline_measures` + liên kết, nội dung chỉ còn trong `audit_logs` (`xuLy.ts:661-675`) — không xem được trên web.

**4. Nguyên nhân.** OV-7a (13/10) "ai lưu được thì sửa / xoá được" — trước luật 21/10.

**5. Ảnh hưởng.** GVCN hạ bậc của em bằng cách xoá (bậc tự tính lại `bacVe`), QL không biết; báo cáo "xử lý đã làm" đổi ngược không dấu vết trên web; không có cách "xử lý nhẹ hơn bậc kế" hợp lệ → GVCN ghi sai loại hoặc xử lý ngoài web.

**6. Phương án.**
- **Thu hồi (khuyến nghị TH-A):** nút **"Thu hồi…"** thay "Xoá lần xử lý" cho GVCN (chỉ lần mới nhất của chuỗi — giữ luật thứ tự) → hộp nhỏ "Lý do thu hồi *" → **Gửi QL** (1 bấm + gõ). Thẻ mới trong Chờ duyệt (loại `y_thuc`, phân loại "Ý thức"): "Thu hồi Report 2 · {em} · lý do… · Nếu duyệt: bậc về Report 1, 3 vi phạm về chưa xử lý". Trong lúc chờ: lần xử lý **vẫn tính** (bậc, vi phạm "Đã xử lý"), dòng ghi "⏳ Chờ QL duyệt thu hồi". QL **Duyệt** → lần xử lý sang **"Đã thu hồi"** (giữ dòng, không xoá vật lý — L3 lịch sử; không tính bậc / thống kê; vi phạm tính lại; hạn bắt buộc chốt lại như hiện nay `chotHanXuLy`); QL **Từ chối** (lý do bắt buộc) → giữ nguyên, GVCN thấy lý do ở thẻ. **QL tự thu hồi** = làm thẳng, lý do bắt buộc, nhật ký "tự duyệt" (theo Q-D, Rb 765).
  TH-B (thay thế): giữ xoá vật lý sau khi QL duyệt — đơn giản hơn ở máy chủ nhưng mất lịch sử trên web → **không khuyến nghị**.
- **Không tăng bậc (khuyến nghị KB-A):** trong panel Xác nhận xử lý, cạnh "Bậc xử lý: **WL 1**" có link **"Không tăng bậc…"** → chọn **bậc hiện tại (lặp, vd Report 2)** hoặc một bậc thấp hơn của thang → lý do bắt buộc → **Gửi QL** (đi đúng đường Đề xuất hiện có: `cho_duyet` → Duyệt → GVCN "Đã thực hiện"; Từ chối → vi phạm về Cần xử lý, bậc giữ). Bậc em không đổi tự nhiên vì `bacHienTai` = max (`sd/yThuc.ts:300-302`) — **không cần loại dữ liệu mới**. Thẻ: "Xử lý không tăng bậc · Report 2 (lặp) · {em} · lý do · bậc kế vẫn là WL 1".
  KB-B (thay thế): dùng "Khác" có sẵn (gõ tên) — 0 việc lập trình nhưng mất bậc thật trong thống kê, bắt tệp → **không khuyến nghị**.
- **Sửa đè "Đã xử lý · Report 2" thành "không tăng bậc"** (GVCN bấm nhầm bậc kế): một thẻ "Thu hồi" có ô tick "Ghi lại thành xử lý không tăng bậc (Report 1)" → QL duyệt một lần (thay 2 thẻ).
- **Bằng chứng tệp:** thu hồi / không tăng bậc chỉ bắt **lý do** (đúng lời chủ SP); tệp tuỳ chọn — khác WL 3 / ngoài thang (bắt tệp) — **Q5c**.
- Đếm bước: thu hồi nay 2 bấm (Xoá · Xác nhận, không ai duyệt) → sau: GVCN 2 bấm + lý do, QL 1 bấm (Duyệt ở hộp) — thêm đúng một bước duyệt bắt buộc, không hơn.

**7. Quan hệ L1–L2–L3.** L1: lần xử lý **chờ thu hồi** vẫn có hiệu lực → việc TVV giữ; thu hồi được duyệt → việc TVV chưa ghi tự huỷ, đã ghi giữ + chuông TVV (E4). Lần xử lý **không tăng bậc** là đề xuất → việc TVV theo **Q1**. L3: sửa ngày / người / mô tả vẫn sửa thẳng có lịch sử (không phải thu hồi); "thu hồi" và "không tăng bậc" là **duyệt bắt buộc mới** → giữ, không cho đường vòng (máy chủ chặn GVCN gọi xoá). Xuyên trang: Chờ duyệt (2 mẫu thẻ mới), Ý thức lớp / HV (chip "Chờ QL duyệt thu hồi", "Đã thu hồi"), Phân tích Ý thức (không đếm lần xử lý đã thu hồi), Xuất Excel.

**8. Luật.** L5 (A, 21/10); L1, L3; Rb §20.3 (thang, ngoài thang qua QL, "bậc không lùi" — nay lùi được khi QL duyệt thu hồi, giống xoá hiện nay), OV-7a (thay một phần).

**9. Kiểm thử.** GVCN gọi xoá → 403 "Gửi QL thu hồi"; GVCN gửi thu hồi không lý do → 400; QL duyệt → trạng thái "Đã thu hồi", `bacHienTai` lùi, vi phạm về chưa xử lý, việc TVV chưa ghi huỷ; QL từ chối → giữ; QL tự thu hồi → làm thẳng + nhật ký "tự duyệt"; không tăng bậc: gửi `kind` = bậc hiện tại → duyệt → Đã thực hiện → bậc không đổi, bậc kế giữ; thu hồi lần không phải mới nhất → 400 như nay.

**10. Cần chủ SP.** **Q5** (3 điểm biên: bấm nhầm ngay sau lưu · TVV đã báo PH rồi thu hồi · tệp tuỳ chọn). Còn lại PTA quyết (ghi ở Phần D).

---

### V4B-03 · XII.1 — Nhóm việc của TVV: rải rác, nhiều người cùng giữ một việc — (C) · P2 · TVV, QL, GVCN

**1. Ở đâu.** Học viên & Lớp (TVV) › góc "Cần làm"; Tổng quan TVV; Công việc (TVV không có — `ss/platform/nav.ts:22-28`).

**2. Biểu hiện — kiểm kê việc TVV hiện có.**

| Việc | Sinh khi | Hạn | Tắt khi | Ai thấy là "của mình" | Mã |
|---|---|---|---|---|---|
| Chọn bước tiếp (sau thi thật) | lộ trình FT có kết quả thi thật | ngày thi + 7 / ngày có KQ (gia hạn được) | chọn bước tiếp | **QL + QT + mọi TVV chi nhánh** (mỗi người `mine: true`) | `ss/loTrinh/buocTiep.ts:367-394`, `ss/classes/hocVienTheoVai.ts:115` |
| Kết quả thi (thi thật) | hôm sau ngày thi, chưa có KQ | ngày thi + 7 | đủ 4 kỹ năng / Không thi | **GVCN lớp cuối** (Công việc) **và TVV** (Cần làm) | `ss/loTrinh/thiThat.ts:149-188`, `hocVienTheoVai.ts:117` |
| Thiếu thông tin (tách "Thiếu email") | cờ `thieu_tt` | không | điền đủ | TVV / QL | `w/students/HocVienTheoVai.tsx:220` |
| Tổng quan TVV | — | — | — | 5–6 ô **số**, không danh sách, không hạn (ảnh v4b-10) | `w/worklist/HocVienCuaToi.tsx:24-50` |
| Báo phụ huynh qua TVV | Progress / Final lớp thường có môn trượt | không | GVCN đánh dấu | **GVCN** (TVV làm ngoài web) | `mywork.ts:994-1030` |
Chữ hướng dẫn việc GVCN "Hạn 4 tuần kể từ thứ Hai sau kỳ thi" (`mywork.ts:221-224`) **sai** với hạn thật 7 ngày (`sd/tongKetLoTrinh.ts:101, 125`) — (D, chữ). TVV **không nhận chuông** việc nào.

**3. Bằng chứng.** Mã trên; ảnh v4b-10, v4b-11 (Cần làm TVV rỗng ở demo — thiếu dữ liệu để thử).

**4. Nguyên nhân.** Việc TVV được gắn dần (OV-12a, OV-12f, OV-13q) vào góc Cần làm, mỗi lần một loại; quyền "ai làm được" được dùng luôn làm "việc của ai".

**5. Ảnh hưởng.** Hai–ba người cùng thấy một việc là của mình → làm trùng hoặc cùng chờ nhau; TVV phải vào Học viên & Lớp mới biết việc; QL bị "nhận" việc TVV.

**6. Phương án — bộ việc TVV (≤ 5 loại, mỗi loại có đầu ra thật; luật chung: một việc một người giữ = TVV phụ trách em, không có thì người dự phòng ghi trong bảng).**

| Việc | Đầu ra | Sinh khi | Hạn | Tắt khi | Người giữ (dự phòng) | Trạng thái |
|---|---|---|---|---|---|---|
| **Báo PH kết quả xử lý vi phạm** | PH biết + phản hồi | V4B-01 | 5 ngày lịch | Đã báo / Không liên hệ được / huỷ | TVV (QL) | **A — làm** |
| **Báo PH kết quả Test lớp thường** (đổi từ việc GVCN) | như trên, 4 nội dung có sẵn (`noiDungBaoPh`) | như nay | không (M-05) | như trên | TVV (GVCN như nay) | **Q8** |
| **Chốt ngày thi** | có ngày thi | tới tháng dự kiến chưa có ngày (FT) | không | có ngày / dời tháng / có KQ / Không thi / tạm dừng | TVV (QL) | **11.8-3c** (đang hỏi) |
| **Kết quả thi thật** | 4 kỹ năng / Không thi | hôm sau ngày thi | ngày thi + 7 | đủ KQ | TVV (GVCN lớp cuối) | **Q9** |
| **Chọn bước tiếp** | lộ trình mới / tạm dừng / thôi | có KQ | như nay | đã chọn | TVV (QL) | **Q9** |
| Bổ sung hồ sơ | đủ email / Target / tuần bắt đầu | cờ thiếu | không | đủ | TVV, QL | giữ — **một dòng tổng** "n em thiếu…" trong Việc của tôi, không mỗi em một việc |
**Không thêm:** "Liên hệ lại PH" riêng, "TVV xác nhận đã đọc", "Theo dõi em SOS" (ô Cần chú ý đã có — xem, không phải việc).
**Nơi hiện — 3 phương án:** P1 giữ góc Cần làm ở Học viên & Lớp, thêm loại (7 bấm + 1 đổi trang cho một việc báo PH) · **P2 khối "Việc của tôi" ở Tổng quan TVV (khuyến nghị, 9.2-13, 11.8-8): 5 bấm, 0 đổi trang** · P3 mở trang Công việc cho TVV (7 bấm; thêm một trang cho ≤ 5 loại việc — thừa).

**7. Xuyên trang.** Tổng quan TVV (M7), Học viên & Lớp TVV (Cần làm → lọc), Công việc QL ("Của tôi" bớt việc TVV), Công việc GVCN (bớt "Báo PH qua TVV", "Kết quả thi" nếu Q8/Q9 = có), hồ sơ HV (thanh ĐANG XỬ LÝ).

**8. Luật.** L1–L2; OV-12a (bước tiếp: QL hoặc TVV), TK-K (thi thật: GVCN), M-05, 11.8-3c.

**9. Kiểm thử.** Mỗi việc đúng một người giữ (`mine` chỉ một người); số ở Tổng quan TVV = số dòng; chuông việc mới; người khác có quyền vẫn làm được (không 403) nhưng không thấy là việc của mình.

**10. Cần chủ SP.** **Q8, Q9** (đổi người chịu trách nhiệm = nghiệp vụ).

---

### V4B-04 · L3 — Ảnh 5.webp: GV không sửa được điểm Progress Test đã lưu — (D) lỗi theo L3 · P1 · GVBM, GVCN, QL

**1. Ở đâu.** Lưới Test lớp thường (Lịch Test, hồ sơ lớp, panel Nhập điểm lớp, Công việc), lưới FT, hồ sơ MT, hộp chấm.

**2. Biểu hiện.** Dòng có chip **"Đã hoàn tất"** → ô thành chữ "26/40 · Đạt", ⋯ chỉ còn **"Lịch sử"**; FT: "Chỉ xem" + tooltip "Đợt này đã hoàn tất. Chỉ Quản lý sửa được điểm — nhờ Quản lý hiệu chỉnh." (`w/fasttrack/ScoreEntry.tsx:118`); gọi API → 403 cùng câu. Dòng chưa đủ môn vẫn sửa được.

**3. Bằng chứng.** Ảnh chủ SP 5.webp (bản chính, Progress W3 OCT, xem sau CN 18/10). **Tái hiện trên demo:** v4b-01 (GV 20 — GVCN, L·R·G+V của MB FOU 14, Progress W2 SEP, ngày demo 14/09 > CN 13/09): dòng "Đã hoàn tất" → ⋯ chỉ "Lịch sử"; dòng thiếu P ngay dưới vẫn có ô nhập; v4b-02 (GV 21, môn P) như vậy; v4b-16 (375). Mã: luật "hoàn tất" `sd/keHoachTest.ts:63-81` (mọi kỹ năng bắt buộc có điểm, FT tính cả "-", **và** đã qua CN tuần muộn nhất) · quyền sau hoàn tất `ss/fasttrack/hoanTat.ts:112-117` (chỉ `PLAN_WEEK` / `SCORE_OVERRIDE`) · chặn `ss/normal/regular.ts:634-643` (lớp thường), `attempts.ts:2033-2044` (FT), `:1415-1419` (xoá theo lô) · ô chỉ đọc `regular.ts:1259-1267` · menu `sd/thaoTacMt.ts:61` · chip `w/cham/LuoiThuong.tsx:462-468`. MT cũ: khoá 7 ngày sau lần nhập cuối (`hoanTat.ts:31-49`). Lớp đã kết thúc: chỉ QL sửa điểm đã có (`hoanTat.ts:123-130`).
**Có bước duyệt bắt buộc không?** **Không.** Không có thẻ, không có yêu cầu: "nhờ Quản lý hiệu chỉnh" = nhắn ngoài web; QL sửa thẳng (đường `override`, lý do tuỳ chọn T22).

**4. Nguyên nhân.** R11 (23/09, Q1–Q2) "đợt hoàn tất thì chỉ QL sửa", nới 15/10 (OV-13h) chỉ cho ô trống + nhận xét. "Hoàn tất" phụ thuộc điểm của **mọi** môn → khoá theo thao tác của người khác.

**5. Ảnh hưởng.** GV nhập nhầm thứ Sáu, thứ Hai phát hiện → không tự sửa → nhắn QL → QL tìm lớp / bài / tuần (~6–8 bấm) → sửa. Chậm, QL ôm việc nhập liệu, GV mất quyền với dữ liệu của mình, có thể bỏ sót (điểm sai đi vào Case / báo cáo).

**6. Phương án.**
- **A (khuyến nghị) — gỡ khoá theo L3:** GVBM đúng ô sửa / xoá điểm đã có **mọi lúc** — FT, lớp thường, MT cũ (bỏ khoá 7 ngày cho GVBM), lớp đã kết thúc (**lý do bắt buộc**, như QL hiện nay `regular.ts:692`). Lý do tuỳ chọn ở các ca khác (T22 giữ). Nhật ký đã đủ ("ai · lúc · cũ → mới · lý do", `ss/platform/lichSu.ts:289-330`). Chip "Đã hoàn tất" → **"Đủ điểm"** (trạng thái, không còn nghĩa khoá; bỏ câu "chỉ Quản lý sửa"). Hệ quả — **đã có sẵn** vì QL vẫn sửa được: FT tính lại SOS / Case tự tạo / PA quy chế / Phối hợp (việc đã làm giữ), Case tạm (§20.16); lớp thường tính lại Case Giữa khoá / PA Bổ trợ / Báo PH (đã làm giữ); Final: gợi ý dải đổi, quyết định QL không tự đổi, Bổ trợ Final một lần (luật có sẵn), "Xét lại lộ trình" tự phát hiện sau chuyển lớp; lớp đã kết thúc chỉ lưu điểm + nhật ký (`laLopKetThuc`); "Đúng hạn" ở Phân tích GV **không đổi** (giữ `nhap_dau_ngay`, `attempts.ts:2267-2268`). Bước: GV 2–3 bấm (bấm ô · sửa · Lưu) thay vì nhắn QL + QL 6–8 bấm.
- B — "Đề xuất sửa điểm" qua thẻ QL: **thêm** bước duyệt không bắt buộc (trái L3), thêm việc QL → không khuyến nghị.
- C — "cửa sổ sửa" N ngày sau hoàn tất: vẫn khoá cứng theo thời gian → không khuyến nghị.

**7. Xuyên trang.** Mọi lối lưới (Lịch Test, hồ sơ lớp, panel Nhập điểm, Công việc, hồ sơ MT, `/nhap-diem`, `/bang-diem-thuong`), Dán Excel (lưới theo lượt — ô đã có điểm cho ghi đè với GVBM), "Huỷ điểm" trong menu, Case / SOS, Phân tích, Xuất Excel.

**8. Luật.** L3; R11 (thay), Rb 723, 816, 696 (20.1b dòng 1), PR-HSM "kèm điểm thì theo quyền sửa ô (hoàn tất → chỉ QL)" (Rb 608), T22.

**9. Kiểm thử.** Máy chủ: GV đúng ô sửa / xoá điểm đợt hoàn tất (FT, lớp thường, MT cũ > 7 ngày) → 200 + nhật ký `score.edit` / `regular.score` trước/sau + `sauHoanTat`; GV khác môn → 403; lớp đã kết thúc không lý do → 400, có lý do → 200; `thaoTacKyNang('co-diem', {nhapDiem:true, dotHoanTat:true}).menu` có `huy-diem`; sửa R trượt → đạt ở Progress → Case Giữa khoá đóng như khi QL sửa. Bấm thử: GV 20, MB FOU 14, `/test/lich?classId=28&loai=thuong`. Ảnh cặp v4b-01 trước / sau.

**10. Cần chủ SP.** Không (L3 + XIII.1 nói rõ). Chỉ để biết: nới cả "lớp đã kết thúc" (lý do bắt buộc) và "MT cũ 7 ngày".

---

### V4B-05 · L3 — Rà mọi khoá cứng toàn web — (D / C) · P1–P3

| # | Chỗ (mã) | Ai | Khoá gì | Lý do khoá | Đề xuất | Lịch sử / hoàn tác phù hợp |
|---|---|---|---|---|---|---|
| H01 | Sửa / xoá điểm sau "đợt hoàn tất" — `hoanTat.ts:112-117`, `regular.ts:634-643`, `attempts.ts:2033-2044` | GVBM | sửa / xoá điểm đã có | quy trình cũ (R11) | **NỚI** (V4B-04) | nhật ký ô có sẵn + Khôi phục (H04) |
| H02 | MT cũ khoá 7 ngày sau lần nhập cuối — `hoanTat.ts:31-49` | GVBM | như trên | quy trình cũ | **NỚI** | như H01 |
| H03 | Lớp đã kết thúc: chỉ QL sửa điểm đã có — `hoanTat.ts:123-130` | GVBM | như trên | toàn vẹn kết quả lớp đã đóng | **NỚI** có lý do bắt buộc | như H01 |
| H04 | **Huỷ điểm** xoá luôn nhận xét + nhóm + GV chấm, không có Khôi phục — `ss/keHoach/keHoachTest.ts:646-657`, `attempts.ts:2256-2262`, chữ `w/fasttrack/HopThaoTacMt.tsx:45` | người sửa được ô | không quay lại được | kỹ thuật (dùng đường lưu điểm) | **THÊM "Khôi phục điểm"** 1 bấm (điểm + nhận xét + nhóm + GV chấm từ nhật ký) | nhật ký "khôi phục" |
| H05 | **Huỷ kỹ năng** có điểm → xoá điểm — `attempts.ts:1377-1390`, `skillSchedule.ts:1006` | QL | mất kết quả khi chỉ muốn bỏ kỹ năng | kỹ thuật | **CẤT điểm**; "Đưa lại vào đợt" hỏi "Trả lại điểm cũ 6.5?" | như H04 |
| H06 | Xóa lịch bị chặn khi có điểm / đã thi / thẻ chờ — `skillSchedule.ts:703-733`, `sd/keHoachOv15c.ts:27-33` | QL, Admin | bỏ tuần | nghiệp vụ (không bỏ lịch phần đã thi) | **GIỮ**; câu mờ thêm "dời tuần thay vì xoá" | Hoàn tác (đã có) |
| H07 | Dời vượt MT sau bị chặn — `skillSchedule.ts:849-852` | QL | đổi tuần | nghiệp vụ (chủ SP 08/10) | **GIỮ luật**; (C) hộp đề nghị "Dời cả MT{n+1} sang …" một lần lưu | lịch sử lịch |
| H08 | Kỹ năng đã huỷ không đổi tuần thẳng ("Đưa lại vào đợt trước") — `skillSchedule.ts:881-882` | QL | phải 2 bước ở hồ sơ MT | kỹ thuật (hộp lịch đã gộp được, `keHoachTest.ts:593-598`) | **NỚI**: mọi nơi dùng hộp lịch, đặt tuần = đưa lại + tuần | lịch sử lịch |
| H09 | Có thẻ dời chờ → không đổi lịch thường — `skillSchedule.ts:868-879` | QL | đổi tuần | chống dời hai lần | **GIỮ**; trả lời thẻ ngay ở dòng | thẻ có lịch sử |
| H10 | "-" đã huỷ (vắng 2 lần) chỉ QL khôi phục — `absence.ts:857-868` | GV, GVCN | gỡ "-" | nghiệp vụ (L4: lần 2 QL quyết) | **GIỮ** | — |
| H11 | Lớp đã kết thúc: không ghi "-" — `hoanTat.ts:139-146` | mọi vai | "-" | nghiệp vụ (không còn tuần) | **GIỮ** | — |
| H12 | Chưa tới tuần thi: không nhập điểm — `skillSchedule.ts:936-939` | mọi vai | nhập điểm | nghiệp vụ (chủ SP 06/10) | **GIỮ** | — |
| H13 | Em Lưu trữ: không ghi gì — `attempts.ts:1306-1310` | mọi vai | mọi ô | nghiệp vụ | **GIỮ** (Bỏ lưu trữ — QL, có Hoàn tác) | — |
| H14 | "-" sau tuần thi / MT cũ = "Không dự thi" (trạng thái cuối) — `attempts.ts:2135-2136` | GV | không thi bù | chốt 11/10 | **BỎ** (L4 — V4B-07) | gỡ "-" (đã có) |
| H15 | GVCN lớp FT thấy **"Xếp lại bài vắng"** nhưng máy chủ 403 — `sd/thaoTacMt.ts:62` ↔ `ss/permissions.ts:432-436` (luật 09/10) | GVCN | nút giả | **lỗi (D)** | **SỬA** điều kiện nút theo quyền máy chủ | — |
| H16 | **GVCN xoá thẳng lần xử lý** — `xuLy.ts:622-638` | GVCN | (ngược: thiếu duyệt) | OV-7a trước L5 | **THÊM duyệt QL + lý do** (V4B-02) | "Đã thu hồi" giữ dòng |
| H17 | Sửa bậc đã khai sau khi có lần xử lý: chỉ QL — `xuLy.ts:250` | GVCN | bậc khai | nghiệp vụ (đổi gốc thang; chủ SP giữ 15/10) | **GIỮ** | nhật ký |
| H18 | Thu hồi / xoá chỉ lần xử lý mới nhất — `xuLy.ts:628-632` | GVCN, QL | thứ tự | nghiệp vụ (thang tuần tự) | **GIỮ** | — |
| H19 | Ghi nhận bị chặn khi em bắt buộc xử lý — `xuLy.ts:102-105` | GVCN | Ghi nhận | nghiệp vụ V4-2 | **GIỮ** | Bỏ ghi nhận (đã có) |
| H20 | Sửa lần xử lý không xem được lịch sử — `xuLy.ts:321-340` (chỉ `audit_logs`) | mọi vai xem | (thiếu lịch sử) | kỹ thuật | **THÊM** loại "y-thuc" vào `/lich-su` | trước → sau |
| H21 | Sửa lần ghi KQ PA khi Case đã hoàn thành → bắt "Mở lại" — `ss/cases/cases.ts:3769-3771` | người ghi, QL | phải mở lại Case | chủ SP giữ 15/10 (Rb 704) | **NỚI phần chữ** (đổi lựa chọn vẫn qua Mở lại) — **Q10** | nhật ký Case |
| H22 | Chỉ sửa lần ghi KQ gần nhất; PA có KQ không đổi ngày bắt đầu; Case MT / Case có PA không đổi kỹ năng; PA hệ thống không xoá — `cases.ts:3742-3744, 4159, 1222-1223, 1390` | GV, QL | sửa | toàn vẹn (kỳ, chủ PA) | **GIỮ** | — |
| H23 | QL đã duyệt đổi PA → không hoàn tác — `cases.ts:3869`, `ss/duyet/yeuCau.ts:455` | QL, GV | huỷ quyết định | Q15 | **GIỮ** (đang hỏi 9.2-6) | thẻ có lịch sử |
| H24 | Mini Test: sửa | người ghi | — | — | **ĐÃ NỚI** (OV-7a, `ss/normal/cuoiKhoa.ts:688-716`) — Rb §20.6 còn ghi "chỉ QL" | nhật ký |
| H25 | Lệnh chuyển lớp đã thi hành → không hoàn tác — `ss/classes/lenhChuyen.ts:471`, `ss/loTrinh/buocTiep.ts:131` | QL | hoàn tác | nghiệp vụ (chủ SP 15/10) | **GIỮ** (lệnh chuyển mới) | lịch sử HV |
| H26 | Lớp đã có bài Test → không đổi chương trình — `ss/classes/thongTinLop.ts:64` | QL | sửa lớp | toàn vẹn | **GIỮ** | — |
| H27 | Target / lộ trình: GVCN chỉ đề xuất → QL duyệt — `ss/duyet/deXuatSua.ts` | GVCN | sửa | **duyệt bắt buộc** | **GIỮ** (L3 giữ duyệt) | thẻ |
| H28 | Tutor: sửa / xoá nhận xét chỉ trong 24 giờ — `ss/tutors/trang.ts:327` | người ghi | sửa | thiết kế 19/10 | **NỚI sửa** (xoá giữ 24 giờ) — **Q10** | cần lưu trước → sau (nay chỉ `sua_luc`) |
| H29 | Báo cáo tuần quá hạn; góp ý lớp đã kết thúc | GV | — | — | **ĐÃ NỚI** (OV-13h) | — |

Tổng: nới / sửa / thêm **11** (H01–05, H08, H14, H15, H20, H21, H28) · giữ **15** · đã nới **2** · ngược (thiếu duyệt) **1** (H16).
10 ý gọn: (1) bảng · (2) khoá / thiếu đường lui · (3) mã · (4) mỗi PR thêm một chặn cho một ca, không rà lại theo L3 · (5) người đúng nhiệm vụ phải nhờ người khác, đổi trang, gõ lại · (6) cột "Đề xuất" (H01 phương án A/B/C ở V4B-04; H04–05 "cất + khôi phục" so "giữ xoá") · (7) Test, Ý thức, Case, Tutor · (8) L3, L5 · (9) mỗi dòng NỚI một phép kiểm 200 + nhật ký; mỗi dòng GIỮ một phép kiểm chặn đúng câu · (10) Q10 (H21, H28); còn lại không hỏi.

---

### V4B-06 · L3 — Lịch sử và khôi phục: đủ chưa, xem ở đâu — (C / D) · P2

| Dữ liệu | Lưu ở | Đủ "ai · lúc · cũ → mới"? | Xem ở đâu | Thiếu |
|---|---|---|---|---|
| Điểm, "-", nhận xét, GV chấm, lịch thi từng kỹ năng | `audit_logs` (`score.*`) + `attempt_schedule_history` | **Đủ** (+ lý do) | `/lich-su?loai=o` (`ss/platform/lichSu.ts:289-330`), hồ sơ MT › Lịch sử, ⋯ ô lớp thường › Lịch sử (`w/cham/NganLichSuBai.tsx`) | nút **Khôi phục** (H04) |
| Thông tin HV, Target, lộ trình, trạng thái, lịch thi | `audit_logs` → `lichSuSua` | Đủ | hồ sơ HV › Lịch sử | — |
| Lớp, phân công, tiến độ; góp ý tuần; nhập HV; thi thật / bước tiếp | `audit_logs` | Đủ | `/lich-su` (OV-15g) | — |
| Vi phạm | `violation_history` | Đủ (xoá vi phạm xoá luôn lịch sử — chỉ còn `audit_logs`, đúng luật "xoá thẳng" §19) | chi tiết vi phạm | — |
| **Lần xử lý Ý thức** (sửa ghi chú / ngày / người, sửa vi phạm, chưa thực hiện, xoá) | `audit_logs` | Đủ trong DB | **không xem được** | loại "y-thuc" ở `/lich-su` (cần cho L3, L5, kết quả TVV) |
| Phối hợp SOS (xác nhận / bỏ / sửa / đưa lại) | `audit_logs` | Đủ trong DB | chỉ thấy trạng thái cuối | (thấp) thêm vào loại "y-thuc" |
| Case / PA | `sos_case_history` + nhật ký Case | Đủ | ngăn Case | — |
| Nhận xét Tutor | `sua_luc` | **Thiếu** trước → sau | — | ghi nhật ký trước/sau khi nới H28 |
| Thẻ Chờ duyệt | `yeu_cau_duyet` (người, lúc, lý do) | Đủ | hộp Chờ duyệt › Đã xử lý | — |
| Kết quả TVV (mới) | — | — | — | cùng loại "y-thuc" |

**Khôi phục (C):** "Khôi phục điểm" một bấm cho điểm đã huỷ (H04, H05) — đọc trước-giá-trị từ nhật ký, ghi qua đúng `saveScore` (luật nhận xét, Case tính lại), nhật ký "khôi phục"; hết khi đã nhập điểm mới. **Không** làm "hoàn tác cả lô" (12.2 đã bỏ). Hoàn tác hiện có giữ (Xóa lịch, Tạm dừng, Lưu trữ, Học lại, Bỏ ghi nhận…).
Kiểm thử: Huỷ điểm → Khôi phục → điểm + nhận xét + nhóm + GV chấm như cũ, Case như trước khi huỷ, 2 dòng nhật ký; Khôi phục sau khi đã có điểm mới → 400.
Cần chủ SP: không.

---

### V4B-07 · L4 — "-" sau tuần thi / MT cũ thành "Không dự thi" — (F → A: L4 thay chốt 11/10) · P1 · GV, GVCN, QL

**1. Ở đâu.** Ô điểm MT (lưới FT mọi lối, hộp chấm, hồ sơ MT), menu "Vắng" (Báo vắng), hộp lịch.

**2. Biểu hiện.** (a) **MT hiện tại**, "-" ghi sau CN tuần thi → "Không dự thi · Tuần W1 JUL" (không dời, không đếm, hết nợ); nút trong hộp chấm đổi "Vắng" → "Không dự thi". (b) **MT cũ** (xếp vào tuần ≥ 2 tuần trước): "-" → "Không dự thi" ngay. (c) MT cũ bị chặn khỏi mọi luồng vắng (Báo vắng, đề nghị dời, duyệt dời). (d) MT0: "-" không chốt (chỉ Mock), "Không có bài" trong tuần, "Không dự thi" sau tuần.

**3. Bằng chứng.** `attempts.ts:2126-2158` (`late` / `cu` → `no_show_cu`; `chotVangNgay` chỉ khi `!cu && kind === 'mock'`) · `absence.ts:975` (Báo vắng: tuần đã hết → Không dự thi), `:224, 356, 483, 965` (MT cũ chặn) · `sd/vang.ts:11-16` (`sauTuanThi`, `chuNutVang`) · `sd/fasttrack.ts:355-365` (`dauTruCuaO`) · ảnh **v4b-04** (MT1 W1 JUL **không phải MT cũ**, quá hạn 68 ngày → nút "Không dự thi"), **v4b-03** (MT cũ W4 JUL → "Không dự thi") · đặc tả OV 11/10 §3.3 (dòng 109-110: chủ SP 11/10 chọn "Không dự thi" thay "dời sang tuần sau của tuần hiện tại") · Rb §20.1 dòng 31 (T23) · Rb §17.7 C10 ("nhập '-' cho tuần đã kết thúc: chốt ngay" — nghĩa gốc khớp L4).

**4. Nguyên nhân.** OV-1b (11/10) để "nhập bù không sinh nợ giả"; L4 (20/10) đảo lại: "không tự hiểu '-' đầu tiên là huỷ vì lịch đã cũ".

**5. Ảnh hưởng.** GV ghi "-" muộn một ngày → em mất quyền thi bù mà không ai quyết; MT cũ không ghi được "vắng W1, thi bù W2" (phải gỡ "-", nhờ QL đổi tuần, nhập — 6–8 bấm, 2 người); "Không dự thi" làm đợt "chốt" sớm (SOS / Case tính trên phần còn lại — OV §3.2-2).

**6. Phương án (L4 bắt buộc; lựa chọn thật chỉ ở tuần đích của MT cũ — Q4).** Cách hiểu PTA về "MT hiện tại vẫn giữ workflow gửi duyệt như trước": **khi máy không tự dời được thì gửi thẻ cho QL** (đường duy nhất còn trên web).
- **MT hiện tại (`lich_su = 0`):** "-" sau tuần thi = chốt ngay như trong tuần → **lần 1**: tuần kế của lịch nếu tuần đó chưa hết và không vướng thứ tự → máy dời (chuông GVCN + GVBM); tuần kế đã hết hẳn / vướng → **thẻ "Dời lịch" gửi QL** (tuần đích mặc định = tuần chưa bắt đầu gần nhất, hạn hết CN tuần gửi) — logic này đã có ở `absence.ts:283-317`, chỉ cần bỏ nhánh chặn trước; **lần 2** → Huỷ (vắng 2 lần).
- **MT cũ (`lich_su = 1`), khuyến nghị Q4 = tuần kế của lịch:** "-" lần 1 → dời sang W+1 của lịch, **không thẻ** (nhập bù lịch sử); vướng MT sau → "Vắng · chờ xếp lại" (QL Đổi tuần); lần 2 → Huỷ (vắng 2 lần). Sau dời gọi `tinhLaiMtCu` (`applyMove` hiện chưa gọi — `absence.ts:441-465`): W+1 vẫn cách ≥ 2 tuần → vẫn MT cũ, không hạn; thành tuần trước → MT thường, hạn T4 tuần này.
  Thay thế (nếu Q4 chọn): dời sang tuần sau của tuần hiện tại (thi bù thật) — đổi dữ liệu lịch sử thành lịch tương lai.
- Bỏ trạng thái "Không dự thi" cho dấu mới ở MT; dữ liệu cũ (`no_show_cu = 1`; demo 2 ô) **giữ**, lệnh chỉ đọc liệt kê cho QL trước deploy.
- Nút hộp chấm luôn "Vắng" (bỏ `chuNutVang` hai chữ).
- Đếm bước (em cần thi bù, GV ghi muộn): nay "-" → phát hiện → Gỡ "-" (2) → nhờ QL → QL Đổi tuần (3) = 5+ bấm, 2 người · sau: "-" (1) → máy dời, hoặc QL Duyệt thẻ (2).

**7. Xuyên trang.** Lịch Test (ba khối, nợ), Công việc Nhập điểm, hồ sơ MT, Kế hoạch Test (chip "vắng"), SOS chốt (OV §3.2), Case, Phân tích, Xuất Excel (ô "Vắng" / "Không dự thi"), thông báo.

**8. Luật.** L4; C10; OV §3.3 (thay); T23 (thay); Q-A, K4-03 (tự dời lần 1); PR-MTa T3 (lần 2 huỷ); C09 (thẻ hết hạn → huỷ).

**9. Kiểm thử.** Bảng mục B dòng T04–T07, T09; phép kiểm ngày: hôm nay = T2 sau tuần thi, "-" → dời W+1 (= tuần này); hôm nay = 2 tuần sau → thẻ QL; MT cũ "-" → W+1, vẫn MT cũ; lần 2 → huỷ; gỡ "-" → trả như trước; gửi lại → không đếm hai lần; Writing một task "-" + task kia có điểm (T07).

**10. Cần chủ SP.** **Q4, Q6, Q7.**

---

### V4B-08 · XIV — Đường đau "huỷ điểm → hồ sơ MT → khôi phục → mới chuyển lịch" + chữ huỷ / dời lẫn lộn — (D / C) · P1 · QL, GV, Admin

**1. Ở đâu.** Kế hoạch Test (hộp một đợt `HopKyNang`), hồ sơ MT, ⋯ ô lưới chấm, hồ sơ HV › Lộ trình (`HangLichMt`).

**2. Biểu hiện.**
- (i) **Bốn thao tác "huỷ / xoá" khác nghĩa:** Huỷ điểm (xoá giá trị ô) · "Huỷ kỹ năng" (bỏ khỏi đợt — `CHU_THAO_TAC['bo-ky-nang']`, `sd/thaoTacMt.ts:15`) · Xóa (bỏ tuần — OV-15c) · Huỷ (vắng 2 lần) / Huỷ phần thi (QL từ chối dời); + "Huỷ MT{n}" cũ (web đã bỏ, `attempts.ts:1576-1584`, nhưng lượt huỷ cũ còn "Khôi phục MT").
- (ii) **Cùng trạng thái hai bộ nút:** hộp lịch "Khôi phục → Chưa xếp · Giữ huỷ" (ảnh **v4b-06**) ↔ hồ sơ MT "Khôi phục và đặt tuần" + ⋯ "Không mock lại" (ảnh **v4b-05**). "Giữ huỷ" = "Không mock lại".
- (iii) **Huỷ điểm không trả lại được**; xoá luôn nhận xét, nhóm nguyên nhân, GV chấm (`attempts.ts:2256-2262`) — MT bắt nhận xét ≥ 10 ký tự khi nhập lại (OV-12b). Huỷ kỹ năng có điểm cũng xoá điểm.
- (iv) Dời vượt MT sau → chặn, phải mở MT kia dời trước (`skillSchedule.ts:849-852`).
- (v) Khôi phục / Xếp lại từ hộp mở panel phải **chồng lên hộp** (TST-16).
- (vi) GVCN FT thấy "Xếp lại bài vắng" nhưng 403 (ảnh **v4b-14**, H15).
- (vii) "Xin dời" còn route (`ss/routes/index.ts:940`) nhưng không còn nút web — Rb vẫn mô tả (R-sửa).

**3. Bằng chứng / tái hiện (đọc mã + mở hộp, không lưu).** Ba đường thật (đếm bấm từ Kế hoạch Test, QL):
| Đường | Nay | Sau đề xuất |
|---|---|---|
| **Đ1 — khả dĩ nhất với lời chủ SP:** điểm L nhập nhầm vào MT2, QL muốn dọn rồi dời MT2: chip MT2 (1) → "Xóa" mờ "Đã có điểm" → ⋯ dòng L → Huỷ điểm (2) → xác nhận (1) → (đổi ý / điểm đúng) ⋯ đầu hộp → "Mở hồ sơ MT" (2, **đổi trang**) → Lịch sử (1) → đọc điểm + nhận xét cũ → bấm ô lớn (1) → gõ lại điểm + nhận xét ≥ 10 ký tự → Lưu (1) → Chỉnh lịch → Dời lịch thi cả đợt (2) → chọn tuần (1) → Lưu (1) | **≈ 14 bấm, 1–2 đổi trang, gõ lại 2 ô** | chip (1) → "Tuần chung" chọn tuần (2) → Lưu (1) — điểm đi theo (T20 đã cho QL); nếu lỡ Huỷ điểm: dòng phụ "Đã huỷ 6.5 · Khôi phục" (1) → **3–4 bấm, 0 đổi trang** |
| **Đ2 — em vắng 2 lần, QL cho thi bù:** chip (1) → "Khôi phục → Chưa xếp" (1) → hộp đóng → mở lại chip (1) → chọn tuần dòng L (2) → Lưu (1); hoặc sang hồ sơ MT "Khôi phục và đặt tuần" (đổi trang) | ≈ 6 bấm hoặc 4 + đổi trang, 2 bộ chữ | dòng "Huỷ · vắng 2 lần — [Đặt tuần ▾] (có "Chưa xếp") · [Giữ huỷ]" → **3 bấm**, một chữ |
| **Đ3 — GV ghi "-" muộn, em cần thi bù** | 5+ bấm, 2 người (V4B-07) | 1 bấm |

**4. Nguyên nhân.** Mỗi PR thêm nút cho một ca (PR-MTa T2/T3, PR-MTGON, PR-OV4a, OV-15c) không dọn bộ chữ; "Huỷ điểm = xoá trắng ô" (T22) đi chung đường lưu điểm nên mất cả nhận xét (Q6 PR-HSM); hồ sơ MT giữ bộ nút cũ song song hộp lịch (PR-HOP1 chưa xong phần trạng thái).

**5. Ảnh hưởng.** QL (Chị Vy) mất 10+ bấm, phải nhớ / gõ lại dữ liệu; nhầm "huỷ" nào làm gì → mất điểm thật; GVCN bấm nút ra lỗi.

**6. Phương án.**
- **A (khuyến nghị) — một hộp, một bộ chữ, không mất kết quả:** (1) mọi thao tác lịch / trạng thái một em × một đợt chỉ ở **hộp một đợt**; hồ sơ MT, Lộ trình, lưới đều mở **cùng hộp** (bỏ bộ nút riêng ở hồ sơ MT); (2) dòng "Huỷ" (vắng 2 lần / QL từ chối dời) cùng hai nút **[Đặt tuần ▾] · [Giữ huỷ]** — Đặt tuần = khôi phục + tuần (có "Chưa xếp"); (3) **Huỷ điểm → điểm cất**, dòng phụ "Đã huỷ 6.5 · 14/10 · **Khôi phục**"; Huỷ kỹ năng có điểm cũng cất, "Đưa lại vào đợt" hỏi trả điểm; (4) dời vượt MT sau: hộp hiện "MT3 thi W2 OCT — [Dời MT3 sang W3 OCT cùng lúc]" xem trước hai đợt, lưu một lần (C — luật "không vượt" giữ); (5) Xóa lịch mờ: "Đã có điểm — dời tuần thay vì xoá"; (6) nút chỉ hiện khi máy chủ cho (sửa H15); (7) bộ chữ mục C.
- B — giữ hai nơi, chỉ đồng bộ chữ: ít việc hơn, vẫn hai bộ nút, vẫn mất điểm khi huỷ → không khuyến nghị.

**7. Xuyên trang.** Kế hoạch Test, hồ sơ MT, Lộ trình hồ sơ HV, lưới chấm, Lịch Test, Xuất Kế hoạch Test ("Đã huỷ" → chữ mới), Chờ duyệt (thẻ dời).

**8. Luật.** L3, L4; PR-HOP1; OV-15c; PR-MTGON luật 1, 3, 5; T20, T22; Q6 PR-HSM.

**9. Kiểm thử.** Bảng B (T14–T20); test "Huỷ điểm → Khôi phục"; ảnh cặp hộp lịch dòng "Huỷ" (1440 tối + 375 sáng — cần mockup vì đổi bố cục hộp); bấm thử Đ1, Đ2 đếm lại bấm.

**10. Cần chủ SP.** **[CẦN ẢNH]** đúng đường anh / chị đã gặp (trang · từng bước · trạng thái ô / kỹ năng). Dời kèm MT sau (6.4) là (C) — chủ SP xem khi duyệt mockup.

---

### V4B-09 · Rulebook lệch mã / lệch luật mới — chỉ sửa chữ (trừ các luật vừa chốt) — (D tài liệu) · P3

| # | Rb | Đang ghi | Đúng theo mã / luật mới | Nguồn |
|---|---|---|---|---|
| R1 | 677, 688, 562-565, 743-744, 357, 420 | "-" MT cũ / nhập bù sau tuần thi = Không dự thi (T23); C10 | **L4**: lần 1 dời, lần 2 huỷ, cả lịch tuần cũ | L4 20/10 |
| R2 | 719, 742-743 | "-" sửa đến hết CN, chốt đầu T2 (cron) | OV-1b: "-" trong tuần chốt ngay; cron không còn chốt "-" | `ss/ops/chotVangDinhKy.ts:8-12` |
| R3 | 679 | dời vượt không chặn, điểm sang `ket_qua_huy` | PR-MTGON 08/10: **chặn** | `skillSchedule.ts:849-852`, `ketQuaHuy.ts:4-5` |
| R4 | 680, 743 | GVCN "Xin dời"; vắng lần 2 chuông GVCN | chỉ QL (luật 09/10), chuông QL; "Xin dời" không còn nút web | `absence.ts:336-341, 352-354` |
| R5 | 883 | "ngoại lệ duy nhất" còn trạng thái huỷ = vắng 2 lần | còn "Huỷ phần thi" khi QL từ chối / thẻ lần 1 hết hạn | `absence.ts:506, 578` |
| R6 | 906-908 | OV-15c #464, OV-15d #463 chưa merge | đã merge 19/10 | `plan.md:506-508` |
| R7 | 723, 816, 696, 608, 564 | sau hoàn tất / MT cũ 7 ngày / lớp kết thúc: GVBM không sửa điểm đã có | **L3**: GVBM đúng ô sửa mọi lúc, có lịch sử | L3 |
| R8 | 774 | sửa Mini Test chỉ QL, có lý do | OV-7a: người ghi được thì sửa được, lý do tuỳ chọn (+ chú thích `ss/routes/index.ts:2445`, `ss/students/profile.ts:1040`) | `ss/normal/cuoiKhoa.ts:688-716` |
| R9 | 809 | "Vai chỉ có 3" | 7 vai: + Admin văn phòng, TVV, CX, Head tutor | `ss/seed/data.ts:25-33, 96-107` |
| R10 | 763 | Đề xuất sửa gồm "lịch MT" | bỏ từ 09/10 | `ss/duyet/deXuatSua.ts:53` |
| R11 | 727-737 (§20.3) | không có TVV, không có thu hồi / không tăng bậc | thêm **L1, L2, L5** | luật 20–21/10 |
| R12 | 730 | "Bậc không lùi" | lùi khi QL duyệt **thu hồi** (như xoá hiện nay) | L5 |
| R13 | 773 | "Báo PH qua TVV" là việc GVCN | theo Q8 | — |
| R14 | 818 | lớp thường GVCN / GVBM dời lịch | đang hỏi 12.9-7 | — |
| R15 | 772 | hạn chấm lớp thường CN tuần thi | T4 tuần sau (đã ghi ở 12.9-22) | — |
| R16 | (mã, không Rb) | hướng dẫn việc "Cập nhật kết quả thi thật: hạn 4 tuần…" | hạn ngày thi + 7 | `mywork.ts:221-224` |

Kiểm thử: PR tài liệu GĐ0 — so từng dòng với mã đã dẫn. Cần chủ SP: không (R1, R7, R11, R12 là luật đã chốt; còn lại chữ).

---

## Phần B (tiếp). Bảng chuyển trạng thái Mock Test

### B1. Trạng thái một kỹ năng trong một lượt MT

| Mã | Tên hiện (đề xuất) | Dữ liệu | `trangThaiTT` | Ghi chú |
|---|---|---|---|---|
| S1 | Chưa xếp | `required = 1`, chưa tuần | `chua-xep` | sau Xóa lịch / Khôi phục → Chưa xếp |
| S2 | Chưa tới tuần | tuần > tuần này | `chua-toi-tuan` | không ai nhập điểm (T19) |
| S3 | Chờ điểm (trễ chấm khi qua hạn) | tuần ≤ tuần này, chưa điểm, chưa "-" | `dang-thi` | hạn T4 tuần kế |
| S4 | Không có bài (chờ ô kia) | Writing mới một task "-" | — | — |
| S5 | Có điểm | band / số câu | `co-diem` | R11 khoá GV khi lượt hoàn tất (L3: bỏ) |
| S6 | Vắng · chờ QL (thẻ dời) | `absent` + đề nghị chờ | `cho-duyet` | đường gửi duyệt |
| S7 | Vắng · chờ xếp lại | `absent`, không đề nghị | `vang` | QL "Xếp lại" |
| S8 | Đã dời do vắng | `scheduled` tuần mới, đếm ≥ 1 | như S2/S3 + "dời từ … · vắng lần n" | — |
| S9 | Huỷ · vắng 2 lần | `cancelled`, `huy_vang = 1` | `huy-vang` | QL quyết |
| S10 | Huỷ phần thi (QL từ chối dời / thẻ hết hạn) | `cancelled`, `huy_vang = 0` | `da-huy` | — |
| S11 | Không dự thi | `no_show_cu = 1` | — | **chỉ dữ liệu cũ sau L4** |
| S12 | Bỏ khỏi đợt | `required = 0` | `khong-yeu-cau` | Huỷ kỹ năng / Không mock lại |
Cờ cấp lượt: **MT cũ** (`lich_su`, tính lúc xếp / dời: CN tuần muộn nhất < T2 tuần trước — `sd/lichMt.ts:46-48`) · **Hoàn tất** (R11) · **Lượt đã huỷ** (dữ liệu cũ) · **Chưa xếp** (Xóa lịch).

### B2. Chuyển trạng thái (hiện tại → đúng luật) — "Đếm" = `absence_move_count` (lần vắng trong chuỗi)

| # | Từ | Sự kiện (ai) | Điều kiện | Sang | Đếm · thẻ · chuông · Case | Mã | L4 / L3 |
|---|---|---|---|---|---|---|---|
| T01 | S1 | Xếp lịch / Đổi tuần (QL, Admin) | tuần qua: chỉ QL | S2 / S3 | cờ MT cũ tính lại | `skillSchedule.ts:800-929` | — |
| T02 | S2/S3 | Đổi tuần chủ động (QL) | không vượt MT sau, không thẻ chờ | S2/S3 tuần mới | đếm giữ; "-" lịch cũ xoá | `:892-911` | khớp |
| T03 | S2 | thời gian | tới T2 tuần thi | S3 | — | `sd/thaoTacMt.ts:38` | — |
| T04 | S3 | "-" / Vắng **trong tuần thi**, MT hiện tại (GV ô, GVCN, QL) | đủ ô của buổi | đếm 0 → **S8** (W+1) · đếm ≥ 1 → **S9** · W+1 không thi được / vướng → **S6** | +1 · chuông GVCN + GVBM (S8) / QL (S9) / thẻ QL (S6) | `attempts.ts:2132-2158`, `absence.ts:254-346, 768-826` | **khớp** |
| T05 | S3 | "-" / Vắng **sau tuần thi**, MT hiện tại | — | **nay S11** | không đếm, không thẻ | `attempts.ts:2135-2136`, `absence.ts:975` | **LỆCH → như T04** (W+1 còn chạy → S8; hết hẳn / vướng → S6; lần 2 → S9) |
| T06 | S3 (MT cũ) | "-" | — | **nay S11** | — | như trên | **LỆCH → lần 1 S8 tại W+1 (Q4), không thẻ; vướng → S7; lần 2 → S9; tính lại cờ MT cũ** |
| T07 | S4 | ô kia "-" / ô kia có điểm | — | chốt như T04/T05 / **nay: một task "-" thành Không dự thi sau tuần → Writing không đủ (C07)** | — | `sd/fasttrack.ts:355-365` | đề xuất: lần 1 dời cả W, điểm task kia đi theo (PTA) |
| T08 | S3/S4/S8 | Nhập điểm | đã tới tuần | S5 | "-" chưa chốt hết hiệu lực | `attempts.ts:2295-2305` | khớp |
| T09 | S6/S8/S9 | Gỡ "-" (GV ô, GVCN, QL; S9 chỉ QL) | — | như trước khi gõ; đã có quyết định của người → giữ lịch | −1 · thẻ rút | `absence.ts:857-951` | khớp (PR-BV) |
| T10 | S6 | QL Duyệt thẻ dời | tuần chưa bắt đầu, không vượt | S8 | +1 | `absence.ts:517-546` | khớp — **gửi duyệt như trước** |
| T11 | S6 | QL Từ chối (lý do bắt buộc) | — | S10 | — | `:497-510` | khớp; Rb 883 sai chữ |
| T12 | S6 | thẻ hết hạn (CN tuần gửi; quét khi có người mở web — P08) | — | S10 | — | `:556-585` | khớp |
| T13 | S7 | Xếp lại bài vắng / Đổi tuần (QL) | — | S8 | +1 (K4-12) | `skillSchedule.ts:892-900` | khớp; **nút hiện cho GVCN FT nhưng 403 (H15)** |
| T14 | S9 | Khôi phục → Chưa xếp (QL) | — | S1 | đếm giữ | `absence.ts:645-704` (`periodId` null) | chuỗi: **Q6** |
| T15 | S9/S10 | Khôi phục và đặt tuần (QL) | tuần hợp lệ (cả tuần qua) | S2/S3 | đếm giữ; "-" cũ xoá | `absence.ts:645-704` | khớp |
| T16 | S9 | Giữ huỷ / Không mock lại (QL) | — | S12 | đợt hoàn thành được | `absence.ts:379-394` | khớp; **hai tên** |
| T17 | S9 | Xin dời (QL) | — | S6 | thẻ | `absence.ts:352-373` | chỉ còn route, không nút web |
| T18 | S2/S3/S5/S7… | Huỷ kỹ năng (QL, FT) | có điểm → hỏi "Xoá điểm và huỷ kỹ năng?" | S12 | điểm **xoá** (nhật ký) | `attempts.ts:1377-1390`, `skillSchedule.ts:989-1048` | đề xuất: **cất điểm** |
| T19 | S12/S10 | Đưa lại vào đợt (QL) | tuần cũ hợp lệ giữ, vướng → Chưa xếp | S1/S2/S3 | — | `skillSchedule.ts:1008-1023`, `keHoachTest.ts:593-598` | khớp; đề xuất: hỏi trả điểm cất |
| T20 | S5 | Huỷ điểm (người sửa được ô; **hoàn tất: chỉ QL**) | — | S3 (S2) | điểm + nhận xét + nhóm + GV chấm **xoá**; SOS / Case tính lại | `ss/keHoach/keHoachTest.ts:646-657`, `attempts.ts:2256-2262` | **L3: GV đúng ô cả sau hoàn tất; thêm Khôi phục** |
| T21 | S5 | Sửa điểm | **hoàn tất: GV 403** | S5 | nhật ký, lý do tuỳ chọn | `attempts.ts:2033-2044`, `regular.ts:634-643` | **LỆCH L3 → nới** |
| T22 | S5 | Đổi tuần (QL) | — | S5 tuần mới | điểm đi theo; cờ MT cũ tính lại | `skillSchedule.ts:837-847` | khớp |
| T23 | S5 | Thi lại (QL) | tuần từ tuần này; không MT cũ | S2/S3 | điểm vào Lịch sử; đếm giữ | `keHoachTest.ts:611-640` | khớp |
| T24 | lượt | Xóa lịch (QL, Admin) | chặn: có điểm / đã thi / thẻ chờ | mọi kỹ năng chờ thi → S1 | Hoàn tác | `skillSchedule.ts:703-733`, `HopKyNang.tsx:250-270` | khớp |
| T25 | lượt | Huỷ MT{n} | web đã bỏ (OV-15c) | — | lượt huỷ cũ: Khôi phục MT (chặn khi đã có MT{n} mới) | `attempts.ts:1576-1584, 1656-1725` | khớp |
| T26 | lượt | Dời vượt MT sau | — | chặn | "dời MT{n} trước" | `skillSchedule.ts:849-852` | khớp; Rb 679 sai |
| T27 | lượt | xếp / dời bất kỳ | — | cờ MT cũ tính lại | — | `skillSchedule.ts:748-756` | **thiếu ở `applyMove`** (cần khi MT cũ dời do vắng) |
| T28 | lượt | đủ điểm + qua CN tuần muộn nhất | — | "Hoàn tất" → khoá GV | — | `sd/keHoachTest.ts:63-81` | **LỆCH L3 → chỉ còn là trạng thái "Đủ điểm"** |
| T29 | lượt | lớp kết thúc | — | không "-"; chỉ QL sửa điểm | — | `hoanTat.ts:123-146` | "-": giữ · sửa điểm: **nới (lý do bắt buộc)** |
| T30 | S11 (cũ) | Gỡ "-" / nhập điểm | — | S3 / S5 | — | `attempts.ts:2167-2179` | khớp |

**MT0 (lớp thường lên FT):** "-" không chốt, không dời (chỉ `kind = mock` vào `chotVangNgay`) → "Không có bài" / "Không dự thi" — **Q7**. **Lớp thường:** luật riêng (dời liên tục; OV-11a "≥ 2 tuần = Không dự thi") — ngoài L4, giữ (ghi ở Phần D).
**Xung đột thật giữa luật đang chạy:** (1) chốt 11/10 (OV §3.3) ↔ L4 20/10 — **L4 thắng** (mới hơn, nói đúng ca "lịch tuần cũ"); (2) Rb 883 "ngoại lệ duy nhất" ↔ mã còn S10 — chữ; (3) Rb 680 "GVCN Xin dời" ↔ luật 09/10 + mã — chữ. Không còn xung đột cần chủ SP chọn ngoài Q4, Q6, Q7.

### B3. Phân biệt chữ (một khái niệm một tên — PTA đề xuất, chủ SP xem)

| Chữ đề xuất | Làm gì | Điểm | Lịch | Ai | Đảo lại | Chữ đang dùng (lẫn) |
|---|---|---|---|---|---|---|
| **Dời lịch** | đổi tuần một / nhiều kỹ năng | giữ (đi theo) | đổi | QL, Admin (FT) | dời lại | "Dời lịch thi", "Đổi tuần", "Tuần chung", "Xếp lịch" |
| **Vắng** (máy dời) | "-" lần 1 → tuần kế của lịch | — | đổi | máy | Gỡ "-" | "Đã dời bài vắng", "vắng lần 1" |
| **Thẻ dời chờ QL** (gửi duyệt) | lần 1 không tự dời được → QL duyệt / từ chối | — | chờ | máy gửi, QL quyết | — | loại thẻ "Lịch thi" (trùng "thi thật" — 11.1d), "Dời S · MT3 · lần 2" |
| **Huỷ điểm** | xoá giá trị một ô | **cất, Khôi phục được** | giữ | người sửa được ô | Khôi phục | "Huỷ điểm", "xoá trắng ô" |
| **Bỏ khỏi đợt** | kỹ năng không còn bắt buộc | cất | bỏ | QL (FT) | Đưa lại vào đợt | "Huỷ kỹ năng", "Bỏ kỹ năng khỏi đợt" |
| **Huỷ · vắng 2 lần** | trạng thái máy sau "-" lần 2 | — | treo | máy → QL | Đặt tuần / Giữ huỷ | "Đã huỷ phần thi · vắng 2 lần", "huỷ" |
| **Giữ huỷ** | không thi lại kỹ năng đó | — | bỏ | QL | Đưa lại vào đợt | "Không mock lại", "Giữ huỷ" |
| **Xóa lịch** | bỏ tuần mọi kỹ năng chưa thi, đợt về Chưa xếp | giữ (chặn khi có) | bỏ | QL, Admin | Hoàn tác / xếp lại | "Xóa", "Huỷ lịch" (`CHU_LY_DO`) |
| **Huỷ MT** | (đã bỏ khỏi web) | — | — | — | Khôi phục MT (lượt cũ) | "Huỷ MT{n}", "Đã huỷ" |
| **Thi lại** | kỹ năng đã có điểm thi lại tuần mới | vào Lịch sử | đổi | QL | — | "Thi lại" |
Chữ "Huỷ" chỉ còn cho: Huỷ điểm · Huỷ (vắng 2 lần) / Giữ huỷ. "Không dự thi" chỉ còn ở dữ liệu cũ.

### B4. Phép kiểm bảng trạng thái
- **Một bảng → một test** (`ss/tests/mtTrangThai.tests.ts`): mỗi dòng T01–T30 = {trạng thái trước (dựng bằng hàm máy chủ thật trên DB thử), sự kiện, vai, ngày nghiệp vụ} → kỳ vọng {trạng thái sau, đếm, thẻ, chuông, Case}; dòng LỆCH viết theo đích mới (đỏ trước khi sửa — chứng minh lệch).
- **Hàm thuần** `chuyenVang({lan, tuanThi, homNay, mtCu, vuong, laMt0})` → `{kq: 'doi' | 'the-ql' | 'cho-xep' | 'huy', tuanDich}`: 12 ca ngày (CN 23:59 / T2 00:00 giờ VN, tuần kế còn chạy / hết hẳn, MT cũ cách 2 / 3 tuần, vướng MT sau, MT0 vượt hạn chót).
- **Ảnh cặp:** hộp chấm nút "Vắng" (không còn "Không dự thi"); hộp lịch dòng "Huỷ · vắng 2 lần" một bộ nút; lưới lớp thường dòng "Đủ điểm" có ô nhập cho GV đúng ô (v4b-01 trước / sau).

---

## Phần C. Câu hỏi cho chủ SP (chỉ chỗ luật chưa nói — quan trọng trước, mỗi câu có khuyến nghị)

1. **[L1 · biên] Lần xử lý cần QL duyệt (WL 3, Meeting CX/GĐCN riêng, Đình chỉ, Khác, và "không tăng bậc" của L5): việc TVV báo PH sinh lúc GVCN gửi đề xuất, hay lúc GVCN ghi "Đã thực hiện" sau khi QL duyệt?** — **Khuyến nghị: lúc "Đã thực hiện"** (trước duyệt chưa có gì để báo PH; tránh báo PH một biện pháp QL có thể từ chối; tránh TVV quá hạn vì chờ QL). Bậc thang (đa số) vẫn sinh ngay khi lưu. Nếu chọn "lúc gửi": QL từ chối → việc chưa ghi tự huỷ, đã ghi → giữ + báo TVV và GVCN.
2. **[L1 · form] PH không liên hệ được:** TVV được bấm "Kết thúc · không liên hệ được" (ghi chú bắt buộc, GVCN nhận chuông) để đóng việc, hay việc phải mở tới khi liên hệ được (quá hạn sau 5 ngày)? — **Khuyến nghị: được kết thúc**; trước đó "Chưa liên hệ được" ghi từng lần thử, hạn vẫn chạy.
3. **[L1 · người giao] Em chưa có TVV / TVV nghỉ:** việc về **QL chi nhánh** ("Chưa có TVV · Gán TVV" — gán xong chuyển sang TVV, hạn giữ)? Việc TVV quá hạn: chỉ chuông tự động cho người giữ việc, QL thấy ở Công việc — **không** thêm thẻ Báo QL? — **Khuyến nghị: có / có.** Lưu ý dữ liệu: bản chính gần như chưa gán TVV — cần gán trước khi bật.
4. **[L4 · biên] MT cũ (xếp vào tuần ≥ 2 tuần trước), "-" lần 1 dời sang tuần nào:** tuần kế **của lịch** (vẫn là tuần đã qua — ghi đúng "vắng W1, thi bù W2") hay tuần sau **của tuần hiện tại** (thi bù thật)? — **Khuyến nghị: tuần kế của lịch, không thẻ;** vướng MT sau → "Vắng · chờ xếp lại" (QL Đổi tuần). MT hiện tại ghi "-" muộn: tuần kế của lịch nếu còn thi được, không thì thẻ gửi QL (đường gửi duyệt hiện có).
5. **[L5 · biên] Ba điểm:** (a) bấm nhầm ngay sau khi lưu xử lý — cho **Hoàn tác trong 10 giây** ngay ở hộp, không cần duyệt (việc TVV chưa ai thấy cũng huỷ)? (b) thu hồi được duyệt mà TVV đã báo PH — chỉ chuông "để biết" cho TVV, **không** sinh việc "báo lại PH"? (c) thu hồi / không tăng bậc chỉ bắt **lý do**, tệp bằng chứng tuỳ chọn (khác WL 3 / ngoài thang bắt tệp)? — **Khuyến nghị: có / có / có.**
6. **[L4 · biên] "Cùng chuỗi dời" có bắt đầu lại sau khi QL Khôi phục kỹ năng đã huỷ không?** — **Khuyến nghị: không** — chuỗi giữ tới khi kỹ năng có điểm hoặc Giữ huỷ; "-" tiếp theo huỷ lại để QL quyết lần nữa (như mã hiện nay).
7. **[L4 · phạm vi] MT0 (lớp thường lên FT) có theo luật "-" của MT không?** — **Khuyến nghị: có**, trong giới hạn MT0 (không quá T2 tuần 2 FT, luôn trước MT1); vượt giới hạn → thẻ gửi QL.
8. **[XII.1] "Báo phụ huynh qua TVV" (Progress / Final lớp thường có môn trượt) chuyển thành việc của TVV** (GVCN chỉ xem; cùng form với báo PH xử lý vi phạm)? — **Khuyến nghị: có** (TVV là người báo PH — mockup vai 13/10; bỏ một bước nhắn qua lại).
9. **[XII.1] Sau thi thật, "Kết quả thi" và "Chọn bước tiếp" mỗi việc một người giữ:** TVV phụ trách em (không có TVV → GVCN lớp cuối giữ Kết quả thi, QL giữ Bước tiếp); người khác có quyền vẫn làm được nhưng không hiện là việc của họ? — **Khuyến nghị: có** (nay QL + mọi TVV chi nhánh cùng "của tôi").
10. **[L3 · các khoá giữ ngày 15/10]** Ngoài R11, PTA đề xuất nới thêm: (a) Tutor sửa nhận xét quá 24 giờ (có lịch sử; xoá vẫn 24 giờ), (b) sửa **chữ** lần ghi kết quả PA khi Case đã hoàn thành không bắt "Mở lại" (đổi lựa chọn vẫn qua Mở lại). Các khoá khác giữ (bảng V4B-05). — **Khuyến nghị: có / có.**

**[CẦN ẢNH]** Đường đau MT anh / chị đã gặp: chụp lần lượt — (1) trang + ô / hộp lúc bấm "huỷ điểm" (chữ nút), (2) hồ sơ MT lúc khôi phục (nút nào), (3) hộp / trang lúc chuyển lịch, (4) nếu có câu lỗi thì chụp câu lỗi. Bản chính (deploy 18/10) còn "Huỷ MT{n}" — nói rõ là huỷ điểm một ô hay huỷ cả MT.
**[CẦN DỮ LIỆU]** (lệnh chỉ đọc trên bản chính, không đổi gì): số em đang học có / chưa có TVV theo chi nhánh · số lần xử lý vi phạm / tuần · số ô "Không dự thi" từ 18/10 · số em có SĐT phụ huynh.

---

## Phần D. PTA tự quyết (thẩm mỹ / UX / chi tiết kỹ thuật) — liệt kê để chủ SP biết

- **Hạn việc TVV:** 5 ngày lịch tính cả ngày lưu (Q27-5) → hết **23:59 giờ VN** ngày (lưu + 4); lưu thứ Năm 15/10 → hạn **CN 19/10**, quá hạn từ T2 20/10. Theo **lần lưu đầu**; sửa không đổi hạn; Tạm dừng dừng hạn (T65). (Nếu chủ SP muốn đủ 5 × 24 giờ: đổi thành ngày lưu + 5 — một hằng số.)
- Mọi lần lưu xử lý (GVCN **hoặc QL**, một em hay "Chọn nhiều") → một việc / em / lần xử lý; Ghi nhận, Khai bậc không sinh; lần xử lý trước ngày bật không sinh.
- Form F2; tên việc "Báo PH · {bậc} · {em}", nút "Ghi kết quả" (tránh chữ "Ghi nhận" của GVCN); đầu form có nội dung GVCN + SĐT PH bấm gọi; thiếu SĐT thêm ngay trong form; một em ≥ 2 lần xử lý → một form ghi chung.
- Chuông GVCN khi TVV ghi "PH có ý kiến khác" hoặc "Không liên hệ được"; chuông TVV khi GVCN sửa nội dung lần xử lý đã báo PH.
- Hiển thị: khối "Việc của tôi" ở Tổng quan TVV; dòng phụ trạng thái PH trong ô "Thang" (Ý thức lớp A, hồ sơ HV); không ô số mới ở Tổng quan QL; báo cáo / Excel thêm cột "Đã báo PH" làm cùng M6.
- **L5:** "Thu hồi…" thay "Xoá lần xử lý" cho GVCN; QL thu hồi thẳng có lý do (tự duyệt, nhật ký); thu hồi được duyệt = trạng thái **"Đã thu hồi"** (giữ dòng); bớt vi phạm khỏi lần xử lý = **sửa** (L3, không duyệt — bậc không đổi); "Chưa thực hiện" giữ không duyệt; một thẻ "Thu hồi" có ô "ghi lại thành không tăng bậc" (thay 2 thẻ).
- **L3:** gỡ R11 cho GVBM đúng ô (FT, lớp thường, MT cũ 7 ngày, lớp đã kết thúc + lý do); chip "Đã hoàn tất" → "Đủ điểm"; "Khôi phục điểm" một bấm; Huỷ kỹ năng có điểm → cất điểm; `/lich-su` thêm loại "y-thuc" (lần xử lý + kết quả TVV + Phối hợp).
- **L4:** nút hộp chấm luôn "Vắng"; dữ liệu "Không dự thi" cũ giữ + liệt kê cho QL; Writing một task "-", task kia có điểm → lần 1 dời cả W (điểm task kia đi theo); lớp thường giữ OV-11a (ngoài L4 — nếu chủ SP muốn đồng bộ thì báo).
- **MT:** một hộp một đợt cho mọi thao tác lịch / trạng thái (hồ sơ MT mở cùng hộp); bộ chữ mục B3; dòng "Huỷ" [Đặt tuần ▾] · [Giữ huỷ]; nút chỉ hiện khi máy chủ cho (H15); gợi ý "Dời cả MT sau" (C) đưa vào mockup để chủ SP xem.
- Sửa chữ Rulebook R1–R16 (PR tài liệu GĐ0); sửa câu hướng dẫn việc "Cập nhật kết quả thi thật" (hạn 7 ngày).
- Màn mới cần mockup trước code (1440 tối + 375 sáng, đủ trạng thái): Tổng quan TVV khối việc + form Báo PH · dòng trạng thái PH ở Ý thức lớp / HV · hộp một đợt dòng "Huỷ" + Khôi phục điểm · thẻ Thu hồi / Không tăng bậc. Đổi chữ / gỡ khoá R11 / L4 máy chủ: không cần mockup.

---

## Phần E. Ảnh / bằng chứng (đường đầy đủ)

Thư mục: `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4b\`
- Ảnh chủ SP (bản chính — không chép tên): `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking--claude-worktrees-plan-ux-danh-gia\73e605ad-8127-476a-aa89-6555907579b7\images\5.webp`
- `…\anh\v4b\v4b-01-gv20-hoantat-L--menu.png` — **tái hiện 5.webp**: GV dòng "Đã hoàn tất" → ⋯ chỉ "Lịch sử"; dòng thiếu môn vẫn sửa được (`--hover.png` cùng chỗ)
- `…\anh\v4b\v4b-02-gv21-hoantat-P--menu.png` — như trên, GV môn P
- `…\anh\v4b\v4b-16-gv20-375-hoantat-p1.png` — như trên ở 375
- `…\anh\v4b\v4b-04-gv10-mt166-quatuan-hop--hop.png` — MT hiện tại, tuần thi đã qua → nút "**Không dự thi**" (lệch L4)
- `…\anh\v4b\v4b-03-ql2-mtcu120-hop--hop.png` — MT cũ → nút "Không dự thi"
- `…\anh\v4b\v4b-05-ql2-mock151-p1.png`, `-p2.png` — hồ sơ MT: "Đã huỷ phần thi · vắng 2 lần" + "Khôi phục và đặt tuần"; lịch sử "-" → vắng → huỷ
- `…\anh\v4b\v4b-06-ql2-mock151-hoplich--hop.png` — hộp lịch cùng kỹ năng: "Khôi phục → Chưa xếp · Giữ huỷ" (hai bộ nút một trạng thái)
- `…\anh\v4b\v4b-14-gv7-mock7-vang-p1.png` — GVCN lớp FT thấy "Xếp lại bài vắng" (máy chủ 403 — H15)
- `…\anh\v4b\v4b-07-ql2-congviec-p1.png` — Chờ bạn duyệt: thẻ "Đề xuất WL 3" (ca Q1)
- `…\anh\v4b\v4b-08-gv7-xacnhanxuly.png` — panel Xác nhận xử lý (bậc máy điền, mô tả "Đã gửi Report cho PH qua Zalo", nút "Đề xuất QL duyệt")
- `…\anh\v4b\v4b-09-gv7-hv4-ythuc-p1.png` — hồ sơ HV › Ý thức (GVCN)
- `…\anh\v4b\v4b-12-tvv23-hv23-ythuc.png` — TVV xem Ý thức chỉ đọc, thanh "ĐANG XỬ LÝ"
- `…\anh\v4b\v4b-10-tvv23-tongquan.png`, `v4b-13-tvv23-375-p1.png` — Tổng quan TVV: chỉ ô số, không việc
- `…\anh\v4b\v4b-11-tvv23-canlam.png` — Cần làm TVV rỗng (demo thiếu dữ liệu TVV)
- `…\anh\v4b\v4b-15-ql2-kh-mb101-p1.png` — Kế hoạch Test MB FT 101 (ngữ cảnh hộp lịch)
- Spec / script: `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\chup\v4b-1.json`, `v4b-2.json`, `v4b-db.cjs`, `v4b-api.mjs`
