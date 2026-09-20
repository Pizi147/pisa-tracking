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
