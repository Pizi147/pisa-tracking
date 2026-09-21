# Prompt cho session coding

File này chứa prompt để **copy dán** vào một session Claude Code mới. Mỗi PR một prompt.
Dán **nguyên khối**, không cắt bớt — mỗi câu trong đó chặn một lỗi đã từng xảy ra.

Cập nhật: 21/09/2026. Lộ trình: `plan.md` mục 22.

---

## Cách dùng

1. Mở một session Claude Code mới trong repo này.
2. Copy **cả khối** của PR tiếp theo chưa làm, dán vào.
3. Session đó tự đọc tài liệu, tự làm, tự kiểm. Khi nó báo xong, quay lại session thiết kế
   (session này) để rà soát.
4. **Làm đúng một PR mỗi lần.** Đừng gộp hai PR vào một session.

**Thứ tự bắt buộc:** `PR-N → PR-J → PR-O → PR-K → PR-P → PR-Q → PR-R → PR-S`.
Lý do thứ tự ở `plan.md` mục 22.1 — đọc trước khi định đổi.

---

## PR-N — Nền số liệu và kho bằng chứng

```
Đọc plan.md mục 22 rồi làm PR-N (mục 22.2), chỉ PR-N.

Trước khi gõ dòng code đầu tiên, đọc đủ theo thứ tự ở plan.md mục 22.0:
thiet-ke/NGUON-Rule-Y-thuc-2026-09-21.md, rule book mục 18,
thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md, thiet-ke/BAN_DO_OVERHAUL.md,
thiet-ke/HOP_DONG_SO_LIEU.md, và plan.md mục 0-3 + mục 12.

Bối cảnh vì sao PR này đứng đầu: bốn hàm chỉ số đang trả lỗi 501 đang CHẶN
Tổng quan mới và Phân tích theo giáo viên. Nếu dựng màn trước khi có chúng,
người code sẽ tự viết phép đếm thứ hai cho cùng một khái niệm — và hai phép
đếm sẽ KHỚP NHAU trên dữ liệu demo hiện tại rồi lệch khi dữ liệu thật vào.
Đó là lỗi "badge ghi 28, bấm vào ra 0" ở dạng khó thấy hơn.

Yêu cầu về cách làm:
- Dùng TDD: viết phép kiểm đỏ trước, rồi mới sửa cho xanh. Với mỗi lỗi sửa,
  chứng minh bằng cách dựng lại lỗi thấy phép kiểm gãy, rồi khôi phục.
- Mỗi chỉ số là MỘT hàm trả về tập ID. Số là tap.length. Không có đường nào
  đếm riêng. Drill-down gọi lại đúng hàm đó với đúng quyền.
- npm run check phải xanh trước mỗi commit. Số phép kiểm chỉ tăng.
- Cập nhật plan.md (mục 14 lịch sử + tick từng bước) và
  thiet-ke/BAN_DO_OVERHAUL.md (đổi nhãn tình trạng + ghi bằng chứng)
  TRONG CÙNG commit.

Nếu kế hoạch ở mục 22.2 sai hoặc thiếu so với mã thật, SỬA KẾ HOẠCH TẠI CHỖ
và ghi rõ vào mục 14 là đã sai ở đâu — đừng im lặng làm theo cách khác.

Khi xong, báo cho tôi: đã làm gì, bằng chứng nào, và cái gì CHƯA làm.
Đừng báo xong khi còn việc dở.
```

---

## PR-J — Ý thức, nền dữ liệu

```
Đọc plan.md mục 22 rồi làm PR-J (mục 22.3), chỉ PR-J. PR-N phải xong trước.

Đọc bắt buộc, đủ và theo thứ tự:
1. thiet-ke/NGUON-Rule-Y-thuc-2026-09-21.md  — nguồn của chủ sản phẩm
2. thiet-ke/PISA-Rulebook-2026-09-19.md mục 18 — luật
3. thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md — ĐẶC TẢ CHÍNH, đọc hết
4. thiet-ke/LUAT_CHO_CHOT.md mục 6 — Y01-Y04
5. plan.md mục 0-3 và mục 12

Đây là PR thay MÔ HÌNH NGHIỆP VỤ, không phải sửa giao diện. Chủ sản phẩm đã
bỏ hẳn mô hình "Case Ý thức". Hai việc song song:
(a) dựng 5 bảng mới + luật + quyền cho Vi phạm và Biện pháp xử lý;
(b) GỠ mô hình Case Ý thức khỏi 36 file — checklist ở đặc tả mục 9.1 và 9.2.

DDL chép nguyên văn từ đặc tả mục 4, KỂ CẢ CHÚ THÍCH — chú thích giải thích
vì sao KHÔNG có cột nào (không có severity, không có status xử lý, không có
due_date, không có episode_no, không có urgency). Đừng "thêm cho chắc".

Bảy chỗ dễ sai nhất đã liệt kê ở plan.md mục 22.3 — đọc và kiểm từng cái.
Đặc biệt:
- Gỡ cột track sót một nơi là case HỌC THUẬT hỏng. Grep cả shared/, server/src/cases/, seed/.
- CONTACT_KINDS (talk_student/talk_parent/warning_letter) là chỗ dễ sót nhất.
- Chuỗi Thư cảnh cáo 1->2->3 phải kiểm Ở MÁY CHỦ, có phép kiểm gọi thẳng API.
- violation_count_at_confirm là SNAPSHOT, không đếm lại.

Giữ hằng số C03_* và C04_* trong shared/domain/policy.ts, ghi "hết hiệu lực
21/09/2026" kèm lý do. ĐỪNG XOÁ — xoá là xoá mất dấu vết một quyết định thật.
ĐỪNG đổi tên bảng sos_cases. ĐỪNG xoá case_interventions (phương án học thuật
vẫn dùng). ĐỪNG gộp violations vào sos_cases.

Reseed demo đủ 18 tình huống ở đặc tả mục 10. Viết lại DEMO_SCENARIOS.md và
DEMO_ASSUMPTIONS.md thành MỘT file DEMO.md gọn, xoá hai file cũ, sửa mọi
đường dẫn trỏ tới chúng (CODE_MAP.md, README.md, plan.md).

TDD: phép kiểm đỏ trước. Ít nhất một phép kiểm cho mỗi mã luật V01-V14,
B01-B16, W01-W06. npm run check xanh trước mỗi commit.

Cập nhật plan.md mục 14 + tick từng bước, và BAN_DO_OVERHAUL.md, cùng commit.

Nghiệm thu: 24 mục ở đặc tả mục 12, phần kiểm được ở tầng máy chủ. Cộng thêm
grep -rn "behaviour" server/src shared chỉ còn chú thích lịch sử CÓ GHI NGÀY.

Khi xong, báo: đã làm gì, bằng chứng nào, cái gì CHƯA làm.
```

---

## PR-O — Điều hướng bốn khu vực

```
Đọc plan.md mục 22 rồi làm PR-O (mục 22.4), chỉ PR-O.

Đây là PR nhỏ nhưng chạm App.tsx và mọi link. Mục tiêu: bốn khu vực cấp chính
Tổng quan / Học viên & Lớp / Test / Công việc (quyết định D01 ngày 20/09, CHƯA
LÀM — App.tsx hiện có ba mục và không có khu vực Test).

Chỉ dựng KHUNG. Nội dung từng trang giữ nguyên, đổi ở PR-P/Q/R. Đừng tranh
thủ overhaul nội dung — đó là PR khác.

Đọc: thiet-ke/PISA-Design-Plan-after-PR28.md mục 17.1 (D01) và mục 18.1
(điều hướng), thiet-ke/BAN_DO_OVERHAUL.md mục 2, plan.md mục 22.4.

Việc quan trọng nhất và dễ bị coi nhẹ: REDIRECT MỌI LINK CŨ. Repo đã có tiền
lệ tốt — LegacySheetRedirect, /hop-tuan -> /tien-trinh, /mock-test -> /hoc-vien.
Làm y hệt cho mọi đường bị đổi. Một link chết đắt hơn là chưa đổi điều hướng.

Nghiệm thu: mọi URL trong git grep -n 'to="/' cũ còn mở được (trực tiếp hoặc
qua redirect); tab Phân tích mở được bằng URL trực tiếp và Back giữ ngữ cảnh;
khổ 375px bốn mục không tràn; GVBM không thấy ô khoá lớn chiếm diện tích.

npm run check xanh. Cập nhật plan.md mục 14 + BAN_DO_OVERHAUL.md, cùng commit.
```

---

## PR-K — Ý thức, giao diện đầy đủ

```
Đọc plan.md mục 22 rồi làm PR-K (mục 22.5), chỉ PR-K. PR-J và PR-O phải xong trước.

Đọc bắt buộc:
1. thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md mục 7 — CÓ SƠ ĐỒ ASCII CHO TỪNG
   PANEL. Dựng theo đúng sơ đồ đó, kể cả thứ tự ô và vị trí nút.
2. thiet-ke/HE_GIAO_DIEN.md — trước khi dựng bất kỳ màn nào
3. thiet-ke/TU_DIEN_VA_CHU.md mục 6 — mọi chữ của Ý thức đã viết sẵn ở đó,
   kể cả mẫu câu trạng thái và trạng thái rỗng. Đừng tự sáng tác chữ.
4. plan.md mục 22.5

Mục tiêu người dùng: GVBM ghi vi phạm trong 15 giây; GVCN gom vi phạm và xác
nhận biện pháp trong MỘT trang, không phải đi qua nhiều modal.

Bốn nguyên tắc UX bắt buộc, vi phạm là làm lại:
- Mọi ràng buộc NÓI TRƯỚC khi bấm, không báo lỗi đỏ sau khi bấm. Cụ thể: ba
  dòng Thư cảnh cáo bị khoá phải ghi lý do NGAY TẠI DÒNG; nút Xác nhận MỜ ĐI
  kèm câu nói thiếu gì.
- Gom vi phạm theo HỌC VIÊN, không theo ngày. Tick nhiều rồi một nút.
- Số ngày tuổi hiện cạnh TỪNG vi phạm, không chỉ ở dòng tổng.
- Khu "Biện pháp đang chuẩn bị" LUÔN MỞ, không thu gọn.

Hai nút lưu ở form Tạo biện pháp, vì có hai loại việc thật: việc cần 3-5 ngày
(Lưu - Đang chuẩn bị) và việc vừa làm tại chỗ (Xác nhận đã làm luôn, mở thẳng
form xác nhận, KHÔNG phải tạo rồi vào sửa hai lần).

Xoá web/src/modules/classes/ClassBehaviourBoard.tsx và gỡ giao diện cũ theo
checklist ở đặc tả mục 9.3.

Hồ sơ học viên: cảnh báo vi phạm là BANNER phía trên, KHÔNG thêm ô số thứ năm
(design plan mục 18.7 chốt đúng bốn ô).

Kiểm khổ 375px cho cả bảy màn.

Nghiệm thu: toàn bộ 24 mục ở đặc tả mục 12, BẤM THỬ THẬT bằng ba vai — GVBM
(chỉ ghi được, không thấy nút tạo biện pháp), GVCN (làm hết), Quản lý (làm hết
+ xem thống kê chi nhánh). Cộng thêm grep -ri "case ý thức|behaviour" web/src
không còn kết quả nào ngoài chú thích có ghi ngày.

npm run check xanh. Cập nhật plan.md mục 14 + BAN_DO_OVERHAUL.md, cùng commit.

Sau PR này chủ sản phẩm sẽ bấm thử, nên chụp ảnh desktop và 375px ở ba vai.
```

---

## PR-P — Tổng quan và Phân tích

```
Đọc plan.md mục 22 rồi làm PR-P (mục 22.6), chỉ PR-P.

Đọc bắt buộc:
1. thiet-ke/BAN_DO_OVERHAUL.md mục 3 (Tổng quan) và mục 4 (Phân tích) — bảng
   này nói từng yêu cầu ĐÃ CÓ hay CHƯA, và cái nào HẾT HIỆU LỰC vì rule Ý thức
   mới. Đọc nó trước design plan, để không dựng lại thứ đã bị thay.
2. thiet-ke/PISA-Design-Plan-after-PR28.md mục 4, 5, 18.2, 18.3
3. thiet-ke/HOP_DONG_SO_LIEU.md — mọi con số phải đi qua hàm chỉ số
4. thiet-ke/HE_GIAO_DIEN.md
5. plan.md mục 22.6

KHÔNG làm góc nhìn "Giáo viên" (design plan mục 6). Chủ sản phẩm chốt ngày
21/09 là HOÃN SAU DEPLOY. Xem BAN_DO_OVERHAUL.md mục 10. Bốn góc nhìn của PR
này là: Vấn đề học viên | Kết quả hỗ trợ | Theo tuần | Ý thức.

Hai việc dễ bị bỏ qua nhưng là trọng tâm:
- BỎ khỏi màn chính Tổng quan: hàng đợi việc đầy đủ (chỉ giữ preview 5-8 việc
  + Xem tất cả) và khối Sự kiện nổi bật khổ lớn. Đây là "bỏ", không phải "thêm".
- NỐI <KetQuaDot> và <TyLe> vào màn thật. Hai component này có luật, có phép
  kiểm, có trang thử, nhưng CHƯA MÀN NÀO DÙNG — các màn cũ còn tự vẽ câu riêng.

Mọi phần trăm đi qua <TyLe>: n/N trước, % sau; N=0 ghi "Chưa có dữ liệu";
N<5 gắn nhãn mẫu nhỏ. Mọi số bấm được và ra đúng tập tạo nên nó.

Nghiệm thu: bốn ô số có số thật và bấm ra đúng tập; màn đầu desktop không còn
hàng đợi đầy đủ lẫn khối Sự kiện nổi bật lớn; ảnh desktop + 375px ở hai vai
QL và GVBM; dữ liệu rỗng / ít / nhiều đều đọc được.

npm run check xanh. Cập nhật plan.md mục 14 + BAN_DO_OVERHAUL.md, cùng commit.
Sau PR này chủ sản phẩm bấm thử — chụp ảnh.
```

---

## PR-Q — Học viên & Lớp, Hồ sơ lớp, Hồ sơ học viên, Hành trình

```
Đọc plan.md mục 22 rồi làm PR-Q (mục 22.7), chỉ PR-Q.

Đọc bắt buộc:
1. thiet-ke/BAN_DO_OVERHAUL.md mục 6 (lớp) và mục 7 (hồ sơ HV) — đọc TRƯỚC
   design plan, để biết cái nào đã có và cái nào hết hiệu lực
2. thiet-ke/PISA-Design-Plan-after-PR28.md mục 8.1-8.4, 18.5, 18.6, 22.2
3. thiet-ke/HE_GIAO_DIEN.md và TU_DIEN_VA_CHU.md
4. plan.md mục 22.7

Chốt ngày 21/09 hoà giải ba đặc tả từng chồng nhau về Hồ sơ lớp:
BỐN TAB — Học viên | Ý thức | Phân tích lớp | Giáo viên.
"Lộ trình" và "Chuyển tiếp lớp" là NÚT Ở HEADER, không phải tab — chúng là
hành động, không phải cách xem.
Bỏ màn trung gian "Thông tin lớp" chứa tiếp hai tab (design plan 22.2), NHƯNG
các trường tên/mã/chương trình vẫn phải có nơi sửa hợp lý, KHÔNG BỊ MẤT VÌ GỠ TAB.

Ba luật phân công giáo viên ở máy chủ ĐÃ ĐÚNG (server/src/classes/classes.ts
dòng 690-760, đã kiểm, plan.md mục 2.2). ĐỪNG VIẾT LẠI. Tab Giáo viên dùng
CHUNG form TeacherAssignPanel.tsx, không dựng bộ form thứ hai.

Hồ sơ học viên giữ đúng BỐN ô đầu (design plan 18.7): Kết quả Test gần nhất /
Kỹ năng cần hỗ trợ / Case đang mở / Việc cần làm tiếp. Ô Test dùng <KetQuaDot>;
Normal ghi đủ hay thiếu bao nhiêu môn, KHÔNG BỊA OVR. Ô việc có ĐỘNG TỪ VÀ HẠN,
không dùng một ngày cũ làm nội dung chính.

Nghiệm thu: bốn tab đúng thứ tự và hai nút header vẫn mở được; không còn màn
trung gian nhưng vẫn sửa được tên/mã/chương trình; khối case hai phương án song
song + ghi chú dài + tên GV dài không tràn không cắt (design plan 18.9);
ảnh desktop + 375px ở ba vai.

npm run check xanh. Cập nhật plan.md mục 14 + BAN_DO_OVERHAUL.md, cùng commit.
Sau PR này chủ sản phẩm bấm thử — chụp ảnh.
```

---

## PR-R — Công việc, Kế hoạch Test, đường vào nhập điểm

```
Đọc plan.md mục 22 rồi làm PR-R (mục 22.8), chỉ PR-R.

Đọc bắt buộc:
1. thiet-ke/BAN_DO_OVERHAUL.md mục 5 (Công việc) và mục 8 (Test)
2. thiet-ke/PISA-Design-Plan-after-PR28.md mục 7, 9, 18.4, 18.8, 22.3
3. plan.md mục 22.8 VÀ mục 12.5 + 12.6 (khảo sát cũ đã ghi rõ cái nào là
   "dựng mới", không phải "sửa nhỏ")

Đây là PR lớn nhất. Ba nhóm việc: Công việc ba tab, Kế hoạch Test, và bốn
đường vào nhập điểm.

Ba điểm bắt buộc làm đúng thứ tự trong PR:
1. CHỐT MỘT quy ước URL cho "mở đúng đợt" trên StudentDetailPage TRƯỚC
   (gợi ý ?attempt=<id> hoặc ?focus=<attemptId>:<skill>). Dựng lẻ tẻ ở từng
   nơi gọi là sinh ra đúng kiểu hai định nghĩa một khái niệm.
2. Rồi mới nối bốn đường vào nhập điểm.
3. Tên ba tab dùng bản mục 18.4 (Hỗ trợ học viên / Vận hành / Báo cáo đơn vị),
   KHÔNG dùng bản mục 7.1 — hai mục cùng design plan gọi một thứ bằng hai chữ,
   và đó là lỗi "một khái niệm hai chữ" mà từ điển cấm.

Một chỗ PHẢI HỎI, KHÔNG ĐƯỢC ĐOÁN: "đợt hoàn tất thì chỉ đọc".
assessment_attempts.status KHÔNG có giá trị riêng cho "hoàn tất" — trạng thái
này đang được SUY RA từ đủ điểm required. Chặn nhầm sẽ khoá luôn việc hiệu
chỉnh hợp lệ. Nếu chưa chắc định nghĩa ở tầng dữ liệu thì ĐỂ NGỎ và ghi vào
plan.md mục 12, đừng tự quyết.

Nút dời lịch một kỹ năng cho lớp Normal hiện KHÔNG CÓ Ở BẤT KỲ ĐÂU trên giao
diện, dù quyền schedule.move đã mở đúng ở máy chủ với 12 phép kiểm. Dựng UI ở
RegularSheetPage.tsx, tái dùng moveableSkills/canMoveSkillSchedule đã có sẵn.

Bộ chọn tuần: kiểm ở panel 600px, modal rộng VÀ mobile. Nút không rớt hàng
ngẫu nhiên; popover không bị z-index cắt.

Nghiệm thu: đầy đủ ở plan.md mục 22.8.
npm run check xanh. Cập nhật plan.md mục 14 + BAN_DO_OVERHAUL.md, cùng commit.
Sau PR này chủ sản phẩm bấm thử — chụp ảnh.
```

---

## PR-S — Học thuật theo rule mới, biên tập chữ, nợ kỹ thuật

```
Đọc plan.md mục 22 rồi làm PR-S (mục 22.9), chỉ PR-S. Đây là PR cuối.

Đọc bắt buộc:
1. thiet-ke/PISA-Rulebook-2026-09-19.md mục 18.2 — bốn điểm sửa của Học thuật
2. thiet-ke/TU_DIEN_VA_CHU.md — TOÀN BỘ, đây là PR biên tập
3. plan.md mục 22.9 và mục 12.10 + 12.11 + 12.12 (nợ cũ đã ghi rõ)

Ba nhóm việc: Học thuật theo rule mới, biên tập chữ toàn web, nợ kỹ thuật.

Về biên tập: mục 12.11 ghi rõ chưa làm gì — mọi <Empty> chưa được kiểm "thiếu
gì + ai điền được + nút nào", và nhiều SectionNote giải thích MÔ HÌNH DỮ LIỆU
còn nguyên trên màn đọc. Nghiệm thu bằng cách MỞ TỪNG MÀN Ở BA VAI, không bằng
một lần tìm-thay. Trước khi đổi một chuỗi, grep toàn repo tìm MỌI biến thể —
kể cả test, seed và thông báo máy chủ.

KHÔNG viết lại ghi chú thật do giáo viên nhập. Biên tập chỉ chạm chuỗi của hệ thống.

Một nợ kỹ thuật là quả bom hẹn giờ, làm nó trước phần biên tập: chuỗi sit_note
bắt đầu bằng "Không dự thi" đang bị dùng làm CỜ NHẬN BIẾT (fromNoShow). Thay
bằng một cột riêng. Nếu làm biên tập trước, lượt đổi chữ sẽ vô tình gỡ cờ đó.

Hai chỗ PHẢI HỎI, KHÔNG ĐƯỢC ĐOÁN (plan.md mục 22.9 bước S16 và S17):
- Học viên đã kết thúc khoá mà case còn mở — chưa có luật nào đóng hoặc giao
  lại case. ĐỂ NGUYÊN và ghi vào mục 12, đừng tự đóng case.
- Case Fast Track mở mà em chuyển sang Normal thì biến khỏi tab Normal của
  Phân tích trong khi Tổng quan vẫn đếm — chưa quyết định hiện ở đâu. HỎI.

Nghiệm thu: đóng SOS không lý do bị từ chối; sửa nội dung phương án hai lần thì
đọc lại được cả hai bản cũ và lý do đổi; grep -rn "Cần chú ý" không còn kết quả
nào là nhãn mức case; grep -rn "sit_note" không còn chỗ nào dùng chuỗi chữ làm cờ.

npm run check xanh. Cập nhật plan.md mục 14 + BAN_DO_OVERHAUL.md, cùng commit.
Sau PR này chủ sản phẩm nghiệm thu toàn web — chụp ảnh mọi trang chính, hai khổ,
ba vai.
```

---

## Prompt rà soát — dùng ở session thiết kế sau mỗi PR

```
Session coding vừa báo xong PR-<X>. Rà soát giúp tôi:
1. Đọc diff của PR đó.
2. Đối chiếu với plan.md mục 22.<n> và thiet-ke/BAN_DO_OVERHAUL.md: có dòng nào
   được tick mà thực tế chưa làm không?
3. Có luật nào trong rule book mục 18 hoặc đặc tả Ý thức bị làm sai hoặc bỏ qua?
4. Có chỗ nào tự quyết một điểm chưa chốt thay vì hỏi?
5. Nghiệm thu của PR đó có mục nào chưa chạy thật mà đã coi là xong?
Báo cho tôi bằng tiếng Việt cơ bản, và nói rõ cái gì cần tôi chốt.
```
