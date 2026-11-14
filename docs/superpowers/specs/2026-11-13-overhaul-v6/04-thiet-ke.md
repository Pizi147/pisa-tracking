# Overhaul V6 — bản thiết kế (chờ chủ SP duyệt)

PTA Overhaul · 13/11. Đọc kèm: `loi-chu-sp.md` (lời 1–14, nguyên văn) · `luat/0-luat-core-mot-trang.md` (luật không đổi) · `luat/5-y-do-thiet-ke-gan-day.md` (ý đồ phải giữ) · `02-de-xuat-hai-nhom.md` (bảng đề xuất, đã duyệt) · `03-de-bai-mockup-1.md`.
Người đọc: session dựng mockup, session code, PTA Plan. Đọc xong phải lên được plan mà không cần hỏi lại chủ SP.

## 1. Ý định và lý do

GV là người nhập liệu chính. GV thật đang: "không biết thao tác ở đâu như thế nào, cần phải làm gì, nhập điểm chỗ nào, thấy UX/UI loạn và khó theo dõi, nhiều cái thừa thãi" (lời 4). Luật và logic ổn; GV chưa thuộc quy chế mới nên web phải hỗ trợ nhiều hơn (lời 5). Web hiện tại là nền có ý đồ — học từ nó, chỉ sửa UI/UX (lời 7).

**Chẩn đoán:** web có đủ thành phần; sai ở **cửa vào và thứ tự** (trang đầu GV là số liệu; lối nhập điểm rải 7 nơi; ba việc GV tự khởi xướng nằm sâu trong tab), ở **dáng không thống nhất** (một việc hiện 5 nơi bằng 4–6 dáng) và ở **mật độ** (luật gọn M1–M10 mới áp vài màn).

## 2. Mục tiêu · không làm · thế nào là thất bại

**Mục tiêu (đo được):**
1. GV mới mở web tự trả lời "tôi cần làm gì" và "nhập điểm ở đâu" trong vài giây, không cần hướng dẫn: việc và lớp nằm ngay trang đầu.
2. Một loại việc **một dáng dòng, một panel**, mở từ đâu cũng giống nhau.
3. GV không cần thuộc quy chế: mỗi panel việc có **một dòng quy chế** (mặc định là gì · lưu xong ai nhận, hạn nào · chọn khác thì sao).
4. Mọi màn gọn theo cùng một bộ luật mật độ và một bộ thành phần.

**Không làm:** đổi luật nghiệp vụ ngoài 6 điểm chủ SP đã chốt (mục 5.10) · làm lại logic, API, quyền · khung / tab Quản trị mới · Tutor, KET / PET thi thật (hoãn) · bảng rộng một dòng một việc · bước xem trước / xác nhận cho thao tác thường ngày · "Đang chờ người khác".

**Thất bại dù chạy được:** mất một thao tác đang có mà không có lý do · web lệch hình ảnh mockup đã duyệt · thêm chữ giải thích tĩnh · thêm request / dòng đọc Turso đáng kể · GV phải học lại cách làm một việc (chỉ được đổi đường tới việc).

## 3. Ràng buộc

- Luật core: `luat/0`. Ý đồ phải giữ + ngôn ngữ thao tác chuẩn: `luat/5` mục 2, 3. Hướng đã bị bác: `luat/5` mục 5.
- CLAUDE.md: mockup HTML duyệt trước khi code (1440 + 375, sáng + tối, đủ trạng thái) · một màn một PR · bảng truy vết + bảng thao tác TRƯỚC → SAU · ảnh cặp, cổng ≥ 90 % KHỚP · chủ SP duyệt ảnh cặp trước merge · hình ảnh theo mockup sát, tính năng theo luật.
- Turso: mỗi PR có trần câu + dòng ở `server/src/tests/tocDoDuong.ts`, đo trước → sau; mục tiêu cả đợt: **không thêm request mới khi mở trang đầu**.
- Model: Fable chỉ làm đề bài / thiết kế / plan / rà; mockup + code = session Opus 5.5 / Sonnet 5.5 (lời 13). **Session mockup: PTA Overhaul tự mở và giao (lời 15). Việc logic / lỗi / luật: PTA Overhaul viết plan, PTA Plan tự giao session (lời 16 ý 5). Session code: PTA Plan giao, rà, merge.**

## 4. Các hướng đã cân nhắc

| Hướng | Được | Mất | Kết quả |
|---|---|---|---|
| A · Việc dẫn đường (trang đầu chỉ có việc) | Trả lời "làm gì" | Không có cửa cho việc chưa sinh và việc GV tự khởi xướng | Không chọn |
| B · Lớp dẫn đường (trang đầu là các lớp) | Đúng cách GV nghĩ | Phải dò từng lớp; việc không thuộc lớp nào không có chỗ | Không chọn |
| **C · Việc bên trái + lớp bên phải** | Trả lời cả hai câu trên một trang; dùng lại trang Công việc đang có | Phải kỷ luật mật độ | **Chủ SP chọn (lời 6, 12)** |
| Giữ khung, dọn từng màn | Ít rủi ro | Đã làm 5 đợt, không chữa "không biết thao tác ở đâu" | Loại |
| Viết bản mới song song | Sạch | Rơi tính năng (bài học V5), nuôi hai bản | Loại |

## 5. Thiết kế

### 5.1 Cửa vào theo vai
GV / GVCN và TVV: trang đầu = **Công việc**. Admin văn phòng, QL, Quản trị, CX: giữ Tổng quan hiện tại (đã là trang làm việc của họ). Menu GV: Công việc · Học viên & Lớp · Test. Đường `/` của GV, TVV chuyển sang Công việc; link cũ vẫn chạy.
Số liệu ở Tổng quan GV (4 ô số, bảng "Kỹ năng tôi dạy", "Lớp tôi chủ nhiệm") → Hồ sơ GV (cùng nguồn số, cùng hàm). 5 ô số của TVV → một dải mỏng đầu trang Công việc.

### 5.2 Trang đầu GV (mockup ①, đề bài `03`)
Trang Công việc giữ nguyên khung đã duyệt (tab hạng mục + badge, danh sách trái 640, làm ở khung phải). Khung phải khi chưa chọn việc = **"Lớp của tôi"**: mỗi lớp một dòng — mã lớp · tôi dạy gì · tình trạng Test theo luật B2–B4 · việc của tôi ở lớp. Nút "Nhập điểm" chỉ ở lớp đang có bài của tôi. Nhóm gập "Lớp tôi dạy" cuối danh sách bỏ (đã lên khung phải). 375: công tắc hai đoạn "Việc · Lớp của tôi".

### 5.3 Việc: một dáng dòng, một panel, một dòng quy chế
- **Dòng việc** chuẩn = dáng v12 / v18 (S1–S13). Dùng cùng thành phần ở: Công việc · dải "Việc của tôi" hồ sơ lớp · thanh việc hồ sơ HV · hộp chuông. Hồ sơ HV hiện đủ việc của người xem (thêm Nhập điểm, Tình hình đang thiếu). Chuông mở thẳng panel việc.
- **Panel việc** = `PanelViec` đang có; mọi nơi mở cùng panel (hồ sơ HV thôi kiểu "nhảy tab").
- **Dòng quy chế**: một dòng 13 px màu phụ, cố định ngay trên chân panel; nội dung lấy từ luật (không viết tay từng nơi); đổi theo lựa chọn đang chọn. Chi tiết dài → ⓘ / "?". Danh sách câu cho từng loại việc: session mockup ⑤ soạn từ `luat/1`–`4` mục "Người làm cần thấy gì", PTA Overhaul rà.
- **Tên việc** = động từ + đối tượng, đúng hành động nút.

### 5.4 "+ Ghi"
Một nút ở trang đầu GV, đầu hồ sơ lớp, đầu hồ sơ HV: Ghi vi phạm / nhắc nhở · Báo tình hình cho TVV · + Case → chọn em (điền sẵn khi đang ở hồ sơ em / lớp) → form đang có. Nút cũ trong tab Ý thức giữ. Quyền như nay (mọi GV dạy lớp).

### 5.5 Nhập điểm và Speaking chấm chéo
- Lưới nhập giữ. Hộp nhập một ô (FT): nút chính "Lưu · bài tiếp ›" + "Vắng"; thao tác khác vào nhóm phụ "⋯" — không mất thao tác nào.
- **Speaking chấm chéo (lời 9–11):** giữ tab riêng; vẫn MỘT việc chung; panel gom **tuần Test → lớp**, cùng lưới nhập; tuần cũ gập; đầu tab "Việc chung của nhóm GV Speaking · n bài · m quá hạn"; ô "GV chấm" ở đầu ngăn lớp, **lưu ở máy chủ** theo lớp × tuần (thay localStorage); "Đã có điểm" ghi "GV chấm: …".

### 5.6 Việc "Báo cáo PH" của GV (lời 12–14) — việc mới
Người giữ: GV có phần phải viết ở lớp (GV kỹ năng: phần mình; GVCN: phần Chung). Mỗi lớp × đợt một dòng (một dòng = 1 việc). Sinh khi đợt mở; xong khi người đó đủ phần của mình cho mọi em; quá hạn sau hạn. Tab riêng "Báo cáo PH" ở Công việc (rỗng thì ẩn); nút "Viết ›" sang tab Báo cáo PH của hồ sơ lớp.
- FT: đợt tháng, mở ngày 20, hạn 30 (tháng 2: 28) — đã đúng trong mã.
- Lớp thường: đợt Progress / Final, mở thứ Hai tuần Test, **hạn thứ Ba tuần kế tiếp** (lời 14 — ĐỔI: mã đang là Chủ nhật tuần Test).
- Vai khác không có việc này; việc Admin "Xuất báo cáo PH" giữ.

### 5.7 Hồ sơ lớp (mockup ②) · Hồ sơ HV (mockup ③)
- Hồ sơ lớp: đầu trang 2 hàng (mã lớp + chip · GV theo kỹ năng thu gọn); nút "+ Ghi"; "Nhập điểm" chỉ hiện với người có ô để nhập hoặc quyền nhập hộ; dải "Việc của tôi" dùng dòng việc chuẩn; giữ tab, ⋯ dòng, khối điểm, tab Báo cáo PH. Em đã chuyển còn bổ trợ: theo GV-CU-BO-TRO.
- Hồ sơ HV: thanh việc dùng dòng việc chuẩn + mở panel; giữ hai cột Tiến độ │ Case, bấm thẳng để sửa, ba tab; tab Ý thức đồng bộ kiểu tab lớp (việc đang dở).

### 5.8 TVV (mockup ④)
Trang đầu = Công việc (Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ) + khung phải "HV của tôi" khi chưa chọn việc (em · lớp · việc đang chờ · thi tháng này). Dải mỏng 5 chỉ số ở đầu.

### 5.9 Các màn còn lại
Áp luật mật độ M1–M10 (`2026-11-05-mat-do-thong-tin/de-xuat.md`) + một bộ thành phần (một thanh tab, một menu thả, một dải chỉ số, một kiểu lịch sử) cho: Học viên & Lớp · Test (Lịch Test, Kế hoạch Test, trang lượt) · Phân tích · Quản trị · Hồ sơ GV · Lưu trữ · Hướng dẫn. Không đổi bố cục các màn này → không cần mockup mới; mỗi màn một PR có ảnh trước | sau. Làm nốt: ô số hộp ở Tổng quan / hồ sơ lớp, tên đầu panel là link. Cập nhật Hướng dẫn "?" theo đường đi mới trong cùng PR đổi đường.

### 5.10 Chín điểm luật / máy chủ chủ SP đã chốt (lời 12–16) — plan giao việc: `05-plan-logic-luat.md` (PTA Plan giao)
| # | Đổi | Nguồn |
|---|---|---|
| S1 | GV có việc "Báo cáo PH" (5.6) | lời 12, 13 |
| S2 | Hạn Báo cáo PH lớp thường = thứ Ba tuần sau tuần Test | lời 14 |
| S3 | Việc "Điền Target" bỏ khỏi GVCN, TVV giữ; GVCN thấy nhắc + "Đề xuất sửa" | 2.3 |
| S4 | S chấm chéo: người nhập không phải GV Speaking phải chọn "GV chấm" | 2.4 |
| S5 | Một định nghĩa "GV Speaking" theo quyền N7 | 2.5 |
| S6 | TVV báo PH vi phạm xong → tin "Cập nhật" cho GVCN | 2.7 |
| S7 | Báo cáo PH: Admin nhận tin khi lớp × đợt đủ hết báo cáo; GV được nhắc tới ngày hạn chưa xong + khi quá hạn (qua badge / chuông đang có); quá hạn hiện 7 ngày rồi rời | lời 16 ý 1, 3 |
| S8 | Đợt Báo cáo PH do QL / Admin thêm được đặt ngày mở ở tương lai | lời 16 ý 4 |
| S9 | Head tutor xem như GV | lời 16 ý 2 |

## 6. Màn × mức đổi × mockup

| Màn | Mức | Mockup |
|---|---|---|
| Trang đầu GV (Công việc + Lớp của tôi + "+ Ghi" + S chấm chéo + tab Báo cáo PH) | Lớn | ① đang dựng |
| Hồ sơ lớp | Vừa | ② |
| Hồ sơ HV | Vừa | ③ |
| Trang đầu TVV | Vừa | ④ |
| Bảng mẫu: dòng việc · panel việc · dòng quy chế · hộp nhập gọn · chuông | Vừa (nền) | ⑤ |
| Hồ sơ GV (nhận số liệu Tổng quan GV) | Nhỏ | không (theo mẫu sẵn có) |
| Học viên & Lớp · Test · Phân tích · Quản trị · Lưu trữ · Tổng quan QL / Admin / CX | Nhỏ (mật độ + thành phần) | không |

## 7. Thứ tự làm

0. Sửa lỗi F01–F07, L1–L8 (PTA Plan đang giao) — độc lập.
1. Mockup ① → chủ SP duyệt → ⑤ ② ③ ④ (session Opus do PTA Overhaul tự giao, song song được sau khi ① duyệt).
2. Máy chủ: S1–S6 + dữ liệu "Lớp của tôi" / "HV của tôi" (không đổi bố cục → không chờ mockup; PR máy chủ chạy trước PR giao diện).
3. Nền giao diện: dòng việc chuẩn + panel + dòng quy chế + bộ thành phần (theo ⑤).
4. Trang đầu GV → Speaking chấm chéo → "+ Ghi" → hộp nhập gọn.
5. Hồ sơ lớp → hồ sơ HV → TVV.
6. Mật độ các màn còn lại (mỗi màn một PR nhỏ) + Hồ sơ GV + Hướng dẫn + sửa chữ tài liệu (Rulebook, plan.md 1.6).
Mỗi đợt xong là web vẫn nhất quán và deploy được (không có trạng thái nửa cũ nửa mới ở cùng một màn).

## 8. Nghiệm thu chung

- 5 kịch bản bấm thử trên seed, vai GV mới: (1) mở web → nhập điểm lớp đang có bài; (2) ghi một vi phạm cho em lớp mình; (3) GV Speaking chấm một bài chấm chéo của tuần này; (4) GVCN xử lý vi phạm theo mặc định; (5) viết Báo cáo PH khi đợt mở. Mỗi kịch bản: số lần bấm từ lúc mở web, có phải đoán không — so trước | sau.
- Bảng thao tác TRƯỚC → SAU của từng màn không mất dòng nào không có lý do.
- Số đếm: badge = chuông = đầu trang = tổng các tab (một hàm `demDongViec`); tab S chấm chéo ghi rõ "việc chung".
- Turso: trang đầu GV **không thêm request** so với hiện tại; `/my-work` của GV thêm tối đa ~2 câu cho "Test sắp tới" (mục 11.2) và ~3–4 câu khi có đợt Báo cáo PH đang mở (mục 11.3). Trần mới ghi ở `tocDoDuong.ts`, đo trước → sau trong PR.

## 9. Để người làm quyết (không cần hỏi chủ SP)

Tên biến, cách tách thành phần, cách ghép dữ liệu "Lớp của tôi" vào câu đã có (nguồn gợi ý: dữ liệu bảng "Kỹ năng tôi dạy" + nhóm "Lớp tôi dạy" ở `web/src/modules/worklist/LopToiDay.tsx`), thứ tự PR nhỏ trong một đợt, câu chữ cụ thể của dòng quy chế (theo luật, PTA Overhaul rà).

## 10. Còn mở

- Việc Báo cáo PH: GVCN vừa dạy kỹ năng vừa viết phần Chung → một dòng (đề xuất) hay hai dòng.
- Đợt Báo cáo PH do QL thêm bất chợt (`them`) có sinh việc cho GV không (đề xuất: có, theo hạn QL đặt).

## 11. Kết quả đọc soát 14/11 (agent đóng vai người làm, đối chiếu mã)

### 11.1 PTA Overhaul tự chốt (việc nhỏ, không đổi cái được dựng)
- ~~Head tutor giữ Tổng quan cũ~~ → **chủ SP sửa 14/11 (lời 16): Head tutor xem như GV** (trang đầu, menu như GV) — PR LG-7.
- "Lớp của tôi" chỉ lấy phân công **còn hiệu lực** hôm nay (session đang gửi mọi phân công, phải lọc).
- Hai GV cùng một phần Báo cáo PH: bản ghi theo em × phần → một người viết đủ thì việc của cả hai cùng xong.
- 375 dùng công tắc "Việc · Lớp của tôi" (đề bài `03` R24); câu "khối dưới tab" ở `02` là bản cũ.
- Số liệu chuyển sang Hồ sơ GV: hai bảng "Kỹ năng tôi dạy", "Lớp tôi chủ nhiệm" chỉ hiện khi GV xem **hồ sơ của chính mình** (đường `/tong-quan/lop-toi-day/hai-khoi` chỉ đọc phân công của người gọi — không sửa API). QL xem GV khác vẫn thấy các khối Hồ sơ GV đang có.

### 11.2 Dữ liệu "Lớp của tôi" — không thêm request
- Danh sách lớp, kỹ năng tôi dạy, chủ nhiệm: `session.assignments` (`web/src/session.tsx`).
- Việc của tôi ở lớp, số bài chờ nhập, hạn, quá hạn: các dòng của `/my-work` đã nạp (`WorkItem.classId`, `group`, `due`, `urgency` — `server/src/worklist/mywork.ts:63`).
- **Thiếu duy nhất "Test sắp tới"** của lớp chưa có việc ("Final · W3 OCT"): thêm MỘT trường vào `/my-work`, chỉ tính cho vai GV, dùng `MOC_KE_TIEP` (`server/src/worklist/tongQuan.ts:321`) + `classProgressMany` → khoảng **+2 câu**. Không dùng lại GET `/tong-quan/lop-toi-day` (47 câu / 1 827 dòng — quá nặng cho trang đầu).

### 11.3 Việc Báo cáo PH — ước lượng đọc
Chưa có hàm "GV X còn thiếu n em"; ghép từ mảnh sẵn có: `quyenBc().cuaToi` (`server/src/classes/baoCaoPh.ts:39`) · `dsDotLop` · `emTheoLo` (`server/src/classes/xuatBaoCaoPh.ts:89`) · đếm bản ghi đủ theo mẫu `viecXuatBaoCaoPh` (`:272`). Mỗi lần `/my-work` khi có đợt đang mở: **+3–4 câu, +300–500 dòng** với GV 8 lớp (hiện GVCN: 33 câu / 789 dòng, trần 43 / 1 026 — `server/src/tests/tocDoDuong.ts:651`, `:1189` → phải nâng trần dòng). Ngoài đợt: FT 0 câu (tính bằng ngày); lớp thường vẫn đọc tiến độ lớp (đã có trong request). Đổi hạn lớp thường: `dotTuan` + 6 → + 8 (`shared/domain/baoCaoPh.ts:147`).

### 11.4 Đổi trang đầu GV / TVV — chỗ đụng trong mã
- Đường: `web/src/App.tsx:380` (route `/`) và các `<Navigate to="/">` :382–396 · `web/src/modules/worklist/OverviewPage.tsx:35–54` · `server/src/routes/index.ts:277` (`landing`) · `server/src/platform/nav.ts:41` (`overview`) · `shared/domain/dieuHuong.ts:47–65`, `:94` (`KHU_VUC`, `khuVucHienThi`, tô sáng mục) · thanh dưới 375 `chiaThanhDuoi` + `App.tsx:314–316`.
- Link "Việc của tôi ›": `web/src/modules/worklist/TongQuanV5.tsx:459–472`. Nhóm "Lớp tôi dạy": `web/src/modules/congViec/HoTroHocVienTab.tsx:573–579`.
- Hướng dẫn "?": `shared/huongDan/gv.ts:214`, `:249` · `tvv.ts:33`, `:411` · mốc `data-hd="tq-lop-toi-day"`.
- Phép kiểm đang khoá hành vi cũ (phải sửa cùng PR): `server/src/tests/khung.tests.ts:81–94`, `:184` · `prOv15e.tests.ts:97` · `prHd.tests.ts:95`, `:230–290` · `prSvTqGv.tests.ts:183` · `prDonA.tests.ts:781` · `tocDoDuong.ts:92`, `:114–122`, `:1370–1378`.

### 11.5 Ba câu về việc Báo cáo PH — chủ SP 14/11 (lời 16): **theo đề xuất hết**
1. Việc Báo cáo PH quá hạn còn hiện bao lâu — đề xuất: **7 ngày sau hạn rồi tự rời**, như chip tab Báo cáo PH và việc Admin đang làm (`baoCaoPh.ts:100`, `xuatBaoCaoPh.ts:306`); không sinh việc cho đợt đã qua trước ngày bật.
2. GVCN vừa dạy kỹ năng vừa viết phần Chung — đề xuất: **một dòng**.
3. Đợt QL thêm bất chợt — đề xuất: **có sinh việc**, theo hạn QL đặt.

## 12. Chủ SP duyệt mockup ① 14/11 (lời 17) — các điểm dưới đây THẮNG mục 5 khi khác

- **5.2 "Lớp của tôi":** không có nút "Nhập điểm" riêng. Cột cuối tên **"Việc cần làm"**: chỉ việc của người xem ở lớp đó, mỗi loại việc một nút-chip (loại + số; quá hạn có ⚠), thứ tự cố định Nhập điểm · Speaking chấm chéo · Case · Ý thức · Báo cáo PH · Vận hành. Bấm = mở panel tương ứng ở khung phải, hoặc đổi trang (chỉ chip có "›"). Cột Test chỉ còn tình trạng + hạn.
- **5.4:** nút tên **"+ Task"** (không phải "+ Ghi"); thứ tự mục: **Case · Vi phạm / Nhắc nhở · Tình hình học tập**.
- **5.5 Speaking chấm chéo:** trong mỗi tuần, lớp xếp theo **thứ tự lớp mặc định**; không đưa lớp tôi dạy lên đầu.
- **5.11 (mới) Ô chọn có tìm:** mọi chỗ chọn người / lớp / học viên / người phụ trách dùng MỘT thành phần "gõ để tìm + danh sách thả", **mục liên quan đứng trước** theo ngữ cảnh (cùng lớp → cùng chi nhánh → khác). Thay hết ô chọn thường cho các loại này trên toàn web. Danh sách ngắn cố định giữ dáng cũ. Mẫu + bảng kê chỗ thay: mockup ⑤ (`06-de-bai-mockup-2-5.md` R5.1, R5.2). Dữ liệu gợi ý dùng đường tìm đang có (`timNguoi`, tìm lớp của Chuyển lớp…) — không tải cả danh sách chi nhánh khi mở trang; đo Turso khi làm.
- Mockup ②–⑤: đề bài `06-de-bai-mockup-2-5.md`; mỗi mockup một session Opus do PTA Overhaul giao.
- **Tên (lời 19):** tab / tính năng gọi là **"Chấm Speaking"** (thay "Speaking chấm chéo"); mọi chỗ trong tài liệu này ghi "Speaking chấm chéo" hiểu là tab "Chấm Speaking".

## 13. Chủ SP duyệt hẳn mockup ① 14/11 đêm (lời 20) — THẮNG mục 5, 12 và hình mockup khi khác

- "Lớp của tôi" **không hiện việc Chấm Speaking**; lớp tôi chỉ dạy Speaking không có chip việc nào từ bài chấm chéo (bài đó nằm ở tab Chấm Speaking).
- Nút-chip "Việc cần làm": **không biểu tượng**; chữ loại việc + số; chip quá hạn giữ ⚠ + màu; mỗi lớp tối đa một hàng chip khi đủ chỗ, thứ tự cố định Nhập điểm · Case · Ý thức · Vận hành.
- **Việc "Báo cáo PH" nằm trong tab "Vận hành"** (nhóm riêng "Báo cáo PH" trong tab đó), không có tab "Báo cáo PH". Ở "Lớp của tôi" việc này thuộc chip "Vận hành".
- Bấm một việc → mở panel / sang đúng trang: nguyên tắc chung cho mọi màn (chip, dòng việc, ô số, chuông).
- Không vẽ lại mockup ①: session code đọc `thiet-ke/v21/trang-dau-gv.html` + mục 12, 13 này.

## 14. Chủ SP 14/11 sáng (lời 24) — THẮNG mọi mục trên và hình mockup khi khác

- **Dòng việc luôn một dạng "Lớp · tên việc ngắn"**, kể cả việc của một em; tên em là thẻ phụ (link). Bỏ dạng "vòng chữ đầu + tên em + cây việc" ở danh sách việc. Mẫu chuẩn: `thiet-ke/v21/bang-mau.html` (mockup ⑤, mục dòng việc).
- Đầu tab / dải nhóm ghi **"Chấm Speaking"**; không ghi "Việc chung của nhóm GV Speaking".

## 15. Chủ SP 15/11 (lời 32, 33) — THẮNG mọi mục trên và hình mockup khi khác

- **Badge tab "Chấm Speaking": dáng mờ (chỉ đếm số bài) + ⚠ khi có bài quá hạn**; không đỏ; không cộng vào badge menu / chuông. Đỏ chỉ dành cho "việc của tôi quá hạn". Dáng badge mờ: mockup ⑤ (`bang-mau.html`, thanh tab).
- **Chip "Việc cần làm" quá hạn:** mọi loại việc cùng một dáng ⚠ + đỏ như mockup; không tách riêng Nhập điểm.
- Luật (không phải giao diện): MT0 gõ "-" như Mock (LG-9) · thẻ Thu hồi xử lý vi phạm tự chốt theo GVCN khi hết hạn duyệt (LG-10) · việc Bước tiếp và xoá học viên / lớp trống giữ như mã.
