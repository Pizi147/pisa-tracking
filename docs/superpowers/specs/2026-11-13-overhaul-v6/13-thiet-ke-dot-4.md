# Overhaul V6 — đợt 4: giảm tải + theo dõi trực diện (thiết kế · đề bài mockup ⑪ ⑫ ⑬ · việc máy chủ)

PTA Overhaul · 15/11 · theo lời 46, 47, 48 (`loi-chu-sp.md`). Nguồn đọc mã: mục 6 dưới đây (agent chỉ đọc 15/11, chưa bấm thử — session kiểm lại trước khi dùng).

## 1. Ý định

Chủ SP hỏi còn chỗ nào nâng cấp, giảm tải workflow, theo dõi thông tin trực diện hơn (lời 46) rồi duyệt làm cả loạt (lời 47). Ba mục tiêu: **GV gõ ít hơn** (dùng lại chữ đã ghi) · **bớt bước không đổi đầu ra** (bỏ "Đã xem", Hoàn thành Case bật sẵn) · **nhìn là biết** (chuông theo tab, "Sắp tới", Case theo bước).
Không làm: AI sinh chữ · kênh thông báo mới (Zalo, email) · màn / tab mới · đổi luật ngoài mục 3. Thất bại dù chạy được: giao diện dày thêm · thêm bước · báo cáo gửi PH có chữ máy tự điền mà GV chưa đọc · thêm lượt đọc khi mở trang.
Chủ SP (lời 47 ý 6): **luôn dùng skill thiết kế để giao diện không dày, trực diện, sạch, đẹp, gọn.**

## 2. Tám hạng mục (đề xuất 4 "xác nhận nhiều Case" RÚT — web đã có `congViec/XacNhanPaLo.tsx`)

| # | Hạng mục | Thiết kế | Mockup |
|---|---|---|---|
| H1 | Báo cáo PH: dùng lại chữ đã ghi | Cạnh ô chữ của mỗi phần có khối **"Bạn đã ghi tháng này"** (KHUNG ghép từ dữ liệu, không AI): nhận xét MT của em ở đúng kỹ năng trong đợt · kết quả PA gần nhất của Case kỹ năng đó · (phần Chung: vi phạm + xử lý trong đợt, tình hình học tập đã báo). Nút **"Chèn"** đưa các câu đó vào ô; ô KHÔNG tự điền (giữ ý đặc tả cũ "ô chữ luôn trống": chữ gửi PH phải do GV đọc và chốt). Không có gì để gợi ý → không hiện khối. | ⑫ |
| H2 | Bàn giao (chuyển lớp, đổi GV): dùng lại chữ đã ghi | Cùng thành phần H1: câu của GV bộ môn / góp ý từng em có nút "Chèn" từ nhận xét MT gần nhất + Case đang mở của em ở môn đó. Khối `TuDien` đang có giữ. | ⑫ |
| H3 | Ghi kết quả PA theo lớp, dạng lưới | Việc "Ghi kết quả PA" của cùng lớp cùng kỳ gộp một dòng "Lớp · Ghi kết quả PA · n em"; mở ra LƯỚI: mỗi dòng một PA tới kỳ (em · kỹ năng · PA · kỳ) + Tiến triển (5 chip đang có) + Nhận xét (bắt buộc như nay) + Quyết định mặc định "Tiếp tục". Dòng cần hơn thế (điều chỉnh / thay PA, PA Tutor theo buổi, Mini Test, kết thúc PA) → "Mở đầy đủ" = panel đang có. "Lưu nháp" giữ; lưu từng dòng, lỗi dòng nào báo dòng đó. | ⑫ |
| H4 | "Hoàn thành Case" bật sẵn | Form kết thúc PA cuối đã có ô tick "Hoàn thành Case" (`CapNhatTuan.tsx:617`) → **mặc định BẬT** khi đây là PA cuối và kết quả cuối là đạt; GV bỏ tick nếu muốn giữ Case mở. Mức tiến bộ + kết luận vẫn do GV ghi (điền sẵn từ kết quả cuối). Không có máy tự đóng. | ⑫ |
| H5 | Chuông theo tab Công việc | Mục 4. | ⑪ |
| H6 | Vi phạm: bỏ "Đã xem", thêm "Yêu cầu xử lý" | Mục 3 (luật) + mục 4 (chuông) + form. | ⑪ |
| H7 | Dòng "Sắp tới" ở trang đầu GV | MỘT dòng mảnh trên "Lớp của tôi": việc CHƯA sinh nhưng sắp tới trong 7 ngày — Test tuần tới (lớp · đợt) · kết quả PA tới hạn thứ Ba (số) · Báo cáo PH mở ngày (ngày). Mỗi cụm bấm ra đúng chỗ. Không có gì → không hiện dòng. Không tính vào số việc / badge. | ⑬ |
| H8 | Case theo bước (QL) | Panel mở từ ô "Case chưa có PA" / số Case ở Tổng quan QL và Phân tích SOS: đầu panel có dải bước **Chờ mô tả · Chờ chọn PA · Đang chạy · Chờ kết quả cuối** (số, màu theo V22), bấm một bước lọc danh sách; dòng ghi GV phụ trách + hạn. Không thêm ô ở mặt trang. | ⑬ |
| H9 | "Sao chép để nhắn" | Panel "Chưa làm" (Phân tích GV, mockup ⑨) và panel theo GV ở Tổng quan: đầu mỗi nhóm GV có nút "Sao chép" → chữ thuần dán Zalo, KHÔNG có tên học viên: dòng đầu "{GV} · n việc quá hạn (tới dd/mm)", mỗi việc "• {lớp} · {việc} · {số bài / em} · quá hạn n ngày". Bấm xong nút đổi "✓ Đã chép" 2 giây. | ⑬ |

## 3. Luật đổi (chủ SP chốt lời 47, 48) — thay D2 ở `luat/0`

- **Bỏ việc "Đã xem vi phạm" (`yt_xem`) của GVCN.** Vi phạm do người khác ghi → GVCN nhận một TIN "Cập nhật" ở chuông (không vào số việc); "xem" = bấm tin (mở đúng em ở tab Ý thức) hoặc ✓ tại chuông. "Chỉ nhắc nhở" cũng là tin.
- **Luật 3 vi phạm trong 2 tuần GIỮ NGUYÊN** (việc "Xử lý vi phạm", hạn 5 ngày, quá hạn báo QL).
- **Ô "Yêu cầu GVCN xử lý" khi ghi vi phạm** (chủ SP đề ra): người ghi không phải GVCN lớp đó tick được (không có khi "Chỉ nhắc nhở") → GVCN có việc **"Xử lý vi phạm"** ngay, hạn như luật 3 vi phạm. GVCN chọn:
  - **Xác nhận xử lý** — form đang có (mặc định nâng 1 bậc…); hoặc
  - **Không xử lý** + lý do bắt buộc → việc xong; người ghi nhận tin "GVCN không xử lý · «lý do»". **Báo lại là xong** (lời 48): không có vòng hai trên web, hai GV tự trao đổi bên ngoài.
- Sau "Không xử lý": **vi phạm vẫn còn, vẫn tính vào luật 3 vi phạm / 2 tuần**; GVCN đổi ý thì **luôn xác nhận xử lý được ở tab Ý thức**. Hoàn tác 10 giây như mọi nơi; có lịch sử.

## 4. Chuông mới (H5 + H6)

```
VIỆC CỦA TÔI · 14 · 9 quá hạn
  Chấm điểm            4  [2]   ⌄      ← bấm thanh: sang Công việc đúng tab
  Case học thuật       3  [1]   ⌄      ← bấm ⌄: mở tại chỗ ≤ 3 việc gấp nhất
  Ý thức & Phối hợp    2        ⌄
  Vận hành             1        ⌄
CẬP NHẬT · 2 mới                      Đã xem hết
  MB FT 101 · Vi phạm mới · Không làm bài · cô Lan ghi     ✓
  MB FOU 12 · TVV đã báo phụ huynh                         ✓
```
- Mỗi tab Công việc MỘT thanh: cùng tên, thứ tự, số, màu badge với tab (V22: đỏ quá hạn · vàng gần tới · thường; không ⚠). Tab rỗng không có thanh. Không có thanh Chấm Speaking (đã chốt). Vai TVV / QL / Admin: theo tab của vai đó; QL giữ "Chờ bạn duyệt".
- Nút mở rộng là **"⌄"** (không dùng "›": "›" = đổi trang). Mở ra ≤ 3 dòng việc gọn "Lớp · việc · hạn" (dòng việc chuẩn bản hẹp), bấm một việc → mở thẳng panel việc đó; "+ n việc" → tab. Một lúc chỉ một thanh mở.
- "Cập nhật": tin một chiều; cùng lớp có ≥ 2 tin vi phạm chưa xem thì gom "MB FT 101 · 3 vi phạm mới" (bấm mở ra). ✓ từng tin, "Đã xem hết"; "Xem tất cả" theo ngày giữ.
- Số trên biểu tượng chuông giữ luật cũ (việc quá hạn + hôm nay); có tin Cập nhật chưa xem thì thêm chấm nhỏ, không cộng số.
- Lượt đọc: việc lấy từ `/my-work` đã nạp (0 request); tin nạp khi mở chuông như nay.

## 5. Đề bài mockup (mỗi mockup một session Opus 5.5 · high; luật chung G1–G5 + G2 ở `11-de-bai-mockup-dot-2.md`, V22, lời 40 "theo trạng thái")

Tệp MỚI trong `thiet-ke/v21/` (không sửa tệp đang có; dùng `v21.css` chỉ đọc + css riêng). Ảnh cặp TRƯỚC web │ SAU. Mỗi khung có 1440 Tối + Sáng và 375 Sáng. Chạy impeccable `distill`, `layout`, `clarify`, rồi `critique`.

**⑪ `chuong-vi-pham.html` — chuông mới + vi phạm** (nền: `thiet-ke/2026-11-11-chuong-v2/chuong-v2.html`, bảng mẫu ⑤ khung G, `thiet-ke/v19/y-thuc.html`, ①K5 form ghi vi phạm). Vai: GVCN (chính) · GV bộ môn · TVV · QL.
- R11.1 Chuông theo mục 4: thanh theo tab; trạng thái đóng / một thanh mở / hết việc / chỉ có Cập nhật / rỗng / đang tải / lỗi.
- R11.2 Bấm thanh → Công việc đúng tab; bấm việc trong phần mở → panel việc; vẽ cả hai đích.
- R11.3 "Cập nhật": tin vi phạm mới (đơn + gom theo lớp), tin "GVCN không xử lý · lý do", tin TVV đã báo PH; ✓ / Đã xem hết / Xem tất cả.
- R11.4 Form ghi vi phạm: công tắc **"Yêu cầu GVCN xử lý"** dễ thấy, nổi bật nhưng không dày (một dòng, có dòng quy chế đổi theo công tắc: bật → "GVCN có việc Xử lý vi phạm, hạn dd/mm"; tắt → "GVCN nhận tin ở chuông"); ẩn khi "Chỉ nhắc nhở" hoặc người ghi là GVCN lớp đó.
- R11.5 Việc "Xử lý vi phạm" do được yêu cầu: dòng việc ghi rõ nguồn ("cô Lan yêu cầu"); panel có hai lối "Xác nhận xử lý" │ "Không xử lý" (lý do bắt buộc, câu quy chế: "Người ghi nhận lý do · vi phạm vẫn tính vào luật 3 vi phạm / 2 tuần").
- R11.6 Tab Ý thức (lớp + hồ sơ HV): vi phạm chưa xử lý không còn nút / trạng thái "Đã xem"; vi phạm "Không xử lý" hiện trạng thái + lý do, nút "Xác nhận xử lý" VẪN có; em chưa xử lý lên đầu giữ.
- R11.7 375 cho chuông (toàn màn) và form.

**⑫ `gv-viet-it.html` — GV gõ ít hơn** (nền: `thiet-ke/v15/bao-cao-ph.html`, `thiet-ke/v11/ban-giao-w1w2.html`, `thiet-ke/v16/case-pa.html`, mockup ② tab Báo cáo PH). Vai: GV bộ môn (chính) · GVCN.
- R12.1 H1: panel viết một phần Báo cáo PH có khối "Bạn đã ghi tháng này" + "Chèn"; trạng thái: có gợi ý / đã chèn (sửa được, "Hoàn tác chèn") / không có gì (không hiện khối); phần Chung của GVCN.
- R12.2 H2: bàn giao chuyển lớp (lưới em × môn) và bàn giao đổi GV: nút "Chèn" từng ô; "Chèn cho n em còn trống" MỘT lần rồi GV rà (vẫn phải bấm Xác nhận như nay).
- R12.3 H3: lưới Ghi kết quả PA theo lớp: dòng việc gộp ở Công việc → lưới; trạng thái dòng (chưa ghi / nháp / đã lưu / lỗi / "Mở đầy đủ"); "Lưu · việc tiếp ›".
- R12.4 H4: form kết thúc PA cuối với "Hoàn thành Case" bật sẵn; bỏ tick thì dòng quy chế đổi ("Case còn mở · không hạn").
- R12.5 375: lưới thành thẻ.

**⑬ `theo-doi.html` — nhìn là biết** (nền: mockup ① trang đầu GV, ⑧ Tổng quan QL, ⑨ panel Chưa làm).
- R13.1 H7: dòng "Sắp tới" trên "Lớp của tôi" (GV): đủ ba cụm / một cụm / không có; 375.
- R13.2 H8: panel Case theo bước (QL) mở từ Tổng quan và Phân tích SOS: dải bước + danh sách lọc; bấm dòng → Case.
- R13.3 H9: nút "Sao chép" ở panel Chưa làm và panel theo GV; vẽ cả khung "chữ dán ra" (khối chữ thuần ngoài khung web) để chủ SP thấy đúng nội dung.

## 6. Mã hiện tại (đường dẫn từ gốc repo)

- Chuông: `web/src/modules/platform/HopChuong.tsx`, luật gom `shared/domain/chuong.ts`; số chuông `App.tsx:294`; tin: bảng `notifications.read_at`, `server/src/platform/thongBao.ts`; "mới" của khối Việc chỉ ở localStorage.
- Báo cáo PH: `web/src/modules/classes/TabBaoCaoPh.tsx` (ô chữ `chu`, `formDau` :480 "ô chữ luôn trống"), `shared/domain/baoCaoPh.ts`, bảng `bao_cao_ph`.
- Bàn giao: `web/src/modules/classes/BanGiaoPanel.tsx`, `BanGiaoGvPanel.tsx`; `server/src/classes/banGiao.ts`, `banGiaoGv.ts`; `TuDien` ở `shared/domain/chuyenLop.ts:304`.
- Vi phạm: form `web/src/modules/yThuc/RecordViolationPanel.tsx`; `server/src/yThuc/violations.ts`; việc `yt_xem`, `yt_xu_ly` ở `server/src/worklist/mywork.ts:1575-1610`; luật 3 / 2 tuần `shared/domain/yThuc.ts:230`.
- Case: `web/src/modules/cases/CasePanel.tsx:345`, `CapNhatTuan.tsx` (`GhiKetQuaPanel` :102, tick Hoàn thành :617); `chanHoanThanh` `shared/domain/sosV4.ts:185`; lô xác nhận PA `congViec/XacNhanPaLo.tsx`.
- Chữ đã có theo em: `assessment_scores.comment` · `sos_cases.summary` · `case_followups.note` · `violations.description` · `discipline_measures.note`.

## 7. Việc máy chủ / luật (gửi PTA Plan — làm trước được, phần web chờ mockup duyệt)

| Mã | Phạm vi | Model · effort (B) | Phép kiểm | Turso |
|---|---|---|---|---|
| **LG-11** VI-PHAM-BO-DA-XEM | Bỏ việc `yt_xem`; vi phạm do người khác ghi (kể cả "Chỉ nhắc nhở") → MỘT tin Cập nhật cho GVCN lớp em đang học (không có GVCN → QL), không vào số việc; bấm tin / ✓ ghi `read_at`. Số việc, badge, chuông, sổ nghĩa vụ không còn `yt_xem` (báo số Phân tích GV đổi trên bản chép). Luật 3 / 2 tuần không đổi. | Opus 5.5 · medium (B: Sonnet 5.5 · high) | GVCN hết việc Đã xem, có tin đúng một lần; GVCN tự ghi không có tin; số việc trước → sau trên `mig.sqlite` | ≤ 0 mỗi `/my-work` |
| **LG-12** VI-PHAM-YEU-CAU-XU-LY | Cột cờ "yêu cầu xử lý" trên `violations` (người ghi ≠ GVCN lớp, không áp "Chỉ nhắc nhở") → sinh `yt_xu_ly` ngay, hạn + quá hạn như luật 3 vi phạm; API "Không xử lý" (lý do bắt buộc ≥ 8 ký tự) → việc xong, tin cho người ghi, vi phạm giữ và VẪN tính luật 3 / 2 tuần, GVCN vẫn xác nhận xử lý được sau đó; Hoàn tác; lịch sử. | Opus 5.5 · high · rà `/code-review high` | tick → việc đúng người, đúng hạn; Không xử lý → tin đúng một lần, vi phạm vẫn đếm; đủ 3 vi phạm sau đó vẫn buộc xử lý; đổi GVCN giữa chừng; Hoàn tác | 0 (một cột) |
| **LG-13** GOI-Y-CHU + SAP-TOI + CASE-THEO-BUOC | (a) Một đường đọc "chữ đã ghi" của em theo kỹ năng × khoảng ngày (nhận xét MT, kết quả PA, vi phạm / xử lý) — CHỈ gọi khi mở panel viết Báo cáo PH / bàn giao, theo LỚP một lần (không từng em); (b) `/my-work` vai GV thêm "Sắp tới" 7 ngày (Test tuần tới đã có ở LG-8; thêm số PA tới kỳ + ngày mở Báo cáo PH tính bằng ngày); (c) panel Case theo bước dùng dữ liệu panel Case đang mở, thêm trường bước. | Opus 5.5 · medium (B: Sonnet 5.5 · high) | số dòng đọc đúng phạm vi lớp; trống thì không trả khối; số "Sắp tới" khớp việc sinh ra tuần sau | (a) ước 3–4 câu, ≤ ~500 dòng mỗi lần mở panel theo lớp; (b) + 1 câu `/my-work` GV; (c) 0 — thêm trần, đo trên bản chép |

Phần web (GD-19 chuông + vi phạm · GD-20 gợi ý chữ + lưới kết quả PA + Hoàn thành bật sẵn · GD-21 Sắp tới + Case theo bước + Sao chép): PTA Overhaul gửi plan sau khi mockup ⑪ ⑫ ⑬ được duyệt. LG-11 và LG-12 đổi luật đang chạy → chỉ bật cho người dùng CÙNG lúc với GD-19 (không deploy nửa chừng).
