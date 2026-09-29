# Hợp đồng số liệu

Cụ thể hóa `PISA-Design-Plan-after-PR28.md` mục 10. Mục tiêu: **không còn hai màn hiện hai số
khác nhau dưới cùng một cái tên** (F10: Toàn cảnh 18 HV/32 case · Thực trạng 20 HV/34 case).

---

## 1. Luật nền

1. **Một chỉ số = một hàm.** Cả số tổng lẫn danh sách khi bấm vào đều gọi **cùng một hàm trả
   về tập ID**. Số là `tap.length`. Không có đường nào đếm riêng.
2. **Trả tập ID, không trả số.** Tầng dưới trả `string[]`; tầng trên muốn số thì tự đếm. Đây là
   cách duy nhất làm cho "số khớp danh sách" đúng theo cấu trúc chứ không nhờ kỷ luật.
3. **Phạm vi rỗng trả rỗng.** Không hiểu phạm vi rỗng thành toàn hệ thống.
4. **Không cộng số học viên theo lớp/chi nhánh/tuần.** Một em có thể ở nhiều tập. Tổng toàn
   phạm vi phải `COUNT DISTINCT` theo đúng định nghĩa.
5. **Ba thời gian khác nhau, không trộn trong một hàng thiếu nhãn:** hiện trạng · phát sinh
   trong kỳ · kết quả trong kỳ.
6. **Drill-down áp đúng quyền của số tổng.** Không có đường API nào xem được nhiều hơn ô số.

---

## 2. Sổ đăng ký chỉ số

Đặt ở `shared/domain/metrics.ts`. Mỗi chỉ số khai báo đủ tám trường; thiếu một trường thì
không được lên dashboard.

```ts
export type ChiSo = {
  id: string;          // 'hv-co-case-mo'
  ten: string;         // 'Học viên có case đang mở'
  cauHoi: string;      // 'Bao nhiêu em đang có ít nhất một case chưa kết luận?'
  donVi: 'hoc-vien' | 'case' | 'phuong-an' | 'bai-thi' | 'tin-hieu' | 'dot-test';
  tapDuDieuKien: string; // mô tả mẫu số, viết đủ chữ
  thoiGian: 'hien-trang' | 'phat-sinh-trong-ky' | 'ket-qua-trong-ky';
  khuTrung: string;    // 'COUNT DISTINCT student_id'
  drilldown: string;   // route mở danh sách, dùng cùng hàm tập ID
};
```

### Mười một chỉ số của đợt này

| id | Tên | Đơn vị | Thời gian | Định nghĩa bắt buộc |
|---|---|---|---|---|
| `hv-sos-hien-tai` | Học viên có SOS hiện tại | học viên | hiện trạng | Theo **đợt mới nhất hợp lệ**, không MAX toàn lịch sử. Tạm thời và kết quả cuối tách riêng |
| `hv-duoi-ky-vong-mon` | HV dưới kỳ vọng theo môn | học viên | hiện trạng | So kỳ vọng **của chính đợt đó**. Mẫu số là HV có thể đánh giá được môn đó |
| `hv-co-case-mo` | HV có case đang mở | học viên | hiện trạng | Ít nhất một case chưa kết luận trong phạm vi. **Không** gộp case đã đóng (F02) |
| `case-mo` | Case đang mở | case | hiện trạng | Đếm case, không đếm HV, không đếm tín hiệu SOS |
| `tin-hieu-cho-xac-minh` | Tín hiệu cần xác minh | tín hiệu | hiện trạng | Còn hiệu lực, chưa xác minh, hạn 3 ngày. Sửa điểm sai thì **thu hồi tín hiệu** |
| `case-thieu-pa` | Case thiếu phương án | case | hiện trạng | Đủ điều kiện cần hỗ trợ nhưng chưa có PA hợp lệ. Case **chờ duyệt tách riêng**, không quy chậm cho GV |
| `pa-can-cap-nhat` | Phương án cần cập nhật | phương án | hiện trạng | Đang theo dõi và quá hạn cập nhật tuần. Khác "quá hạn làm" (F11) |
| `pa-co-ket-qua` | PA có kết quả xác định | phương án | kết quả trong kỳ | Đã kết thúc, kết quả ∈ {có tiến bộ, một phần, không tiến bộ, kém hơn}. Một PA **một dòng cuối** |
| `ty-le-co-cai-thien` | Tỷ lệ có cải thiện | phương án | kết quả trong kỳ | `(có tiến bộ + một phần) / (bốn mức xác định)`. **Loại** chưa đủ dữ liệu và case nhập bù |
| `dung-han-cap-nhat` | Đúng hạn cập nhật | nghĩa vụ | kết quả trong kỳ | Nghĩa vụ hoàn thành đúng hạn / nghĩa vụ đến hạn trong kỳ. **Không đếm số lần bấm ghi chú** |
| `do-phu-danh-gia` | Độ phủ đánh giá | học viên | hiện trạng | HV có dữ liệu đủ điều kiện / HV cần được đánh giá. **Khác** tỷ lệ đạt |

Chỉ số Ý thức đếm riêng, không dùng tỷ lệ hiệu quả học thuật: HV duy nhất · đợt case · báo cáo
nguồn · số báo cáo gia đình/thư cảnh cáo **đã thực hiện** · đợt tái diễn · việc còn hạn/quá hạn
(RB 6.4). Một PA báo cáo gia đình dùng chung cho ba nguồn vẫn chỉ đếm **một** report.

---

## 3. `<SoLieu>` — mỗi con số tự giải thích được

```tsx
<SoLieu id="hv-co-case-mo" giaTri={18} phamVi={{ chiNhanh: 'MB', tuan: 'W3-SEP-2026' }} />
```

Hiển thị: số + tên + đơn vị. Hai hành vi bắt buộc:

- **Hover/nút "Cách tính"** → tooltip đọc thẳng từ `ChiSo`: câu hỏi, tập đủ điều kiện, quy tắc
  khử trùng, mốc thời gian, ngày dữ liệu.
- **Bấm số** → mở panel bên phải: tiêu đề `{n} {đơn vị} — {tên}`, danh sách đúng tập ID đó, giữ
  nguyên bộ lọc, có đường quay lại.

Cấm hiển thị một con số dashboard ngoài `<SoLieu>`. Số nằm trong câu văn thì câu văn phải link
tới cùng drill-down.

---

## 4. Ba lỗi phải đóng bằng cấu trúc, không bằng vá nhãn

**F01 — báo cáo tuần chưa giữ đủ phạm vi (P0).** `server/src/worklist/weekly.ts`: tập attempts
đã lọc chi nhánh/chương trình/quyền, nhưng ba truy vấn case/HV/chờ duyệt sau đó chỉ lọc
`planned_period_id` → hai chi nhánh cùng tuần cộng lẫn vào nhau. Sửa: ba truy vấn nhận **chính
tập attempt ID được phép** làm đầu vào. Danh sách khi bấm số dùng lại tập đó.

**F02 — "HV đang gặp" lẫn case đã đóng (P1).** `server/src/cases/effectiveness.ts` →
`issueBoard`: `students` đếm từ mọi case của phân loại, `openCases` mới lọc chưa done. Tách hai
chỉ số: `hv-co-case-mo` (hiện trạng) và một chỉ số lịch sử riêng. Hiệu quả lịch sử **vẫn** phải
đọc được PA của case đã đóng.

**F03 — hiệu quả cũ đi theo lớp hiện tại (P1).** `planOutcomes` lấy HV từ enrollment đang active
rồi đọc PA lịch sử → HV chuyển chi nhánh làm mất mẫu ở nơi cũ và mọc ở nơi mới. Luật: **hiện
trạng theo nơi đang chăm sóc, lịch sử theo đơn vị và người thực hiện tại thời điểm hỗ trợ.**
Dữ liệu quá khứ không đủ thì ghi `chưa xác định nguồn`, không quy cho nơi hiện tại.

Kèm theo: **F04** (hiệu quả chưa lọc tới mã vấn đề cụ thể), **F05** (hàng `undetermined` vẫn
nằm trong bảng hiệu quả dù đã bị loại khỏi mẫu số — chuyển sang liên kết `Cần bổ sung đánh giá`
ngoài bảng).

---

## 5. Nghiệm thu

1. Hai chi nhánh cùng tuần: lọc một CN, mọi cột và mọi drill-down **không chứa ID của CN kia**.
2. Xuất tập ID sinh ra số ở Toàn cảnh và ở Phân tích, `diff` hai tập: hoặc rỗng, hoặc chênh lệch
   giải thích được bằng định nghĩa khác nhau **và** hai màn phải đổi nhãn cho khác nhau.
3. Một case đóng + một case mở cùng lỗi: `hv-co-case-mo` chỉ đếm em có case mở; bảng hiệu quả
   vẫn đọc được kết quả lịch sử hợp lệ.
4. Ba PA đủ kết quả (tiến bộ · một phần · không tiến bộ) + một PA chưa đủ dữ liệu:
   `ty-le-co-cai-thien` = **2/3**, không phải 2/4. Số PA khác số HV.
5. PA cập nhật 4 lần rồi kết thúc: đóng góp **một** kết quả cuối.
6. HV chuyển CN sau khi kết thúc PA: hiện trạng sang nơi mới, kết quả lịch sử giữ nơi cũ.
7. Gọi thẳng API drill-down bằng tài khoản ngoài phạm vi → bị từ chối, không trả tập rút gọn.
8. Phạm vi rỗng → danh sách rỗng và số 0 có nhãn `Không có dữ liệu trong phạm vi`, không phải
   toàn hệ thống.

---

## 5. Chỉ số Ý thức — bổ sung 21/09/2026

Mô hình Case Ý thức bị bỏ. Nguồn: `NGUON-Rule-Y-thuc-2026-09-21.md`; đặc tả:
`Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` mục 8. Tám chỉ số này tuân đúng bốn luật nền ở mục 1.

| id | Tên | Đơn vị | Thời gian | Định nghĩa bắt buộc |
|---|---|---|---|---|
| `vi-pham-tong` | Vi phạm | vi phạm | phát sinh trong kỳ | `valid = 1`. Đếm theo `occurred_on` — **không** theo `reported_on`, vì GV nhớ ra muộn không làm sự việc xảy ra muộn |
| `vi-pham-chua-xu-ly` | Vi phạm chưa xử lý | vi phạm | hiện trạng | `valid = 1` và **không** có dòng nào trong `measure_violations` |
| `vi-pham-khong-hieu-luc` | Vi phạm không còn hiệu lực | vi phạm | phát sinh trong kỳ | `valid = 0`. Đứng **riêng**, không trừ vào `vi-pham-tong` trên cùng một hàng |
| `hv-co-vi-pham` | Học viên có vi phạm | học viên | phát sinh trong kỳ | `COUNT DISTINCT student_id` trên vi phạm `valid = 1` |
| `hv-can-xu-ly` | Học viên cần xử lý | học viên | hiện trạng | Có ít nhất một vi phạm chưa xử lý **và** cái cũ nhất quá 5 ngày. Định nghĩa đầy đủ ở đặc tả mục 5.5 |
| `bien-phap-da-thuc-hien` | Biện pháp đã thực hiện | biện pháp | kết quả trong kỳ | `status = 'done'`, đếm theo `performed_on`. Một Report gom n vi phạm bằng **MỘT** |
| `bien-phap-dang-chuan-bi` | Biện pháp đang chuẩn bị | biện pháp | hiện trạng | `status = 'preparing'`. Không có hạn nên **không có** khái niệm "quá hạn" |
| `bien-phap-theo-loai` | Biện pháp theo loại | biện pháp | kết quả trong kỳ | Chín loại, tách riêng `warning_1/2/3`. **Không** gộp ba thư thành một dòng |

### 5.1. Ba chỉ số cũ phải sửa định nghĩa

| id | Sửa gì |
|---|---|
| `hv-co-case-mo` | Chỉ đếm case **học thuật**. Ý thức không còn case |
| `case-mo` | Chỉ case học thuật |
| `case-thieu-pa` | Chỉ case học thuật |

### 5.2. Chỉ số hết hiệu lực

| id | Vì sao |
|---|---|
| `Tái diễn Ý thức` *(design plan §10)* | Không còn "đợt" nên không còn "tái diễn lần thứ mấy" |

### 5.3. Hai luật riêng của nhóm Ý thức

1. **Ý thức nằm hoàn toàn ngoài mọi bảng hiệu quả hỗ trợ.** Không có đường nào đưa biện pháp vào
   `pa-co-ket-qua` hay `ty-le-co-cai-thien`. Gia đình đã nhận report không chứng minh em tiến bộ;
   bịa một chỉ số thành công cho một cuộc gọi là nói dối bằng số.
2. **Ý thức không vào `dung-han-cap-nhat`.** Không có hạn nào để đúng hay trễ.

---

## 6. Bốn chỉ số đang trả lỗi 501 — chốt chặn của hai trang lớn nhất

Ghi ở đây vì đây là thứ dễ bị bỏ qua nhất khi đọc bảng chỉ số: **bốn dòng dưới đây đã khai báo
nhưng chưa có hàm tập ID.** Máy chủ trả `501`.

| id | Chặn cái gì |
|---|---|
| `hv-duoi-ky-vong-mon` | Ô số thứ nhất của Tổng quan mới (design plan §18.2) |
| `hv-sos-hien-tai` | Tổng quan §18.2 và Phân tích §18.3 |
| `dung-han-cap-nhat` | Cột "cập nhật đúng hạn" của bảng Giáo viên (§6.2) |
| `do-phu-danh-gia` | Cột "độ phủ đánh giá" — §6.3 bắt buộc có mẫu số và độ phủ |

**Rủi ro cụ thể nếu dựng màn trước khi có hàm:** người code sẽ tự viết phép đếm thứ hai cho
cùng một khái niệm. Đó đúng là lỗi "badge ghi 28, bấm vào ra 0" mà mục 1 luật 1 sinh ra để dập —
và lần này còn khó thấy hơn, vì hai phép đếm sẽ **khớp nhau trên dữ liệu demo hiện tại** rồi
lệch khi dữ liệu thật vào.

Vì vậy bốn hàm này nằm ở **PR đầu tiên** của lộ trình, trước cả Ý thức. Xem `plan.md`.


---

## 7. Bản v3 — tối 21/09/2026

Bỏ `vi-pham-khong-hieu-luc`. Thêm `phoi-hop-luot-sos` · `phoi-hop-dang-xu-ly` · `phoi-hop-hoan-thanh` ·
`case-cho-xac-dinh-nguyen-nhan`. Định nghĩa: `SOS_VA_PHOI_HOP_V3.md` §8. Phương án điền sẵn **chưa xác nhận**
không vào `pa-co-ket-qua`, `ty-le-co-cai-thien`, `dung-han-cap-nhat`.

## PR-MT — MT lịch sử và "mới nhất" (29/09/2026)

| Luật | Áp cho |
|---|---|
| Lượt `lich_su = 1` (MT lịch sử) **không** vào: nợ điểm (`scoreDebtCells`), quá hạn, chờ chấm, Lịch Test (dải số + Nợ), Việc nhập điểm, badge lớp, `bai-qua-han-nhap-diem`, Theo giáo viên, tín hiệu "bài Test còn thiếu điểm" + bộ lọc `need=missing_scores` | mọi nơi đếm nợ/hạn — một chốt `viewSkill` (`progress 'lich_su'`) + điều kiện SQL `LUOT_TINH_NO_SQL` |
| `do-phu-danh-gia`: lượt lịch sử **chưa đủ điểm** không phải "cần được đánh giá" | độ phủ |
| "Đợt mới nhất" = **số MT lớn nhất** của lộ trình mới nhất (không theo tuần hay ngày nhập) | `hv-sos-hien-tai`, `hv-duoi-ky-vong-mon`, `do-phu-danh-gia`, Bỏ quên |
| Lượt lịch sử có tuần thi **ngoài 4 tuần** trước ngày tạo không làm "hiện trạng" (SOS hiện tại, Bỏ quên) và không sinh Case | M4, M-14 |
| Kỳ vọng tính theo **lộ trình của lượt** (RF: mọi MT = target) | bảng Case, Phân tích lớp, Tổng hợp Test, SOS |
