# KY-VONG-MT0 + KET-QUA-DAU-RA — MT0 lớp thường đạt Overall là đạt · bảng Kết quả đầu ra làm tại chỗ (thiết kế)

PTA Plan · 14/11/2026 · lời chủ SP (plan.md mục 4, dòng "Chủ SP 14/11 (ba việc)") + trả lời 4 câu 14/11.

## 1. Ý định
- "MT0 theo quy chế lớp thường là nếu như đạt overall rồi thì coi như đạt, chứ không ghi SOS và yêu cầu bổ trợ (tối đa) 10 buổi nữa. Cũng giống như trạng thái SOS thôi, đạt rồi thì k ghi SOS nữa."
- Kết quả đầu ra: "trông nó vẫn xấu … không thể thao tác được, không có nút gì, không làm được gì … sửa lại giao diện cho đẹp hơn và phục vụ các đầu việc tốt hơn" · trả lời: "Làm tại chỗ nhưng làm đẹp hơn đi, nhất là chỗ phần điểm nhìn kinh dị thực sự".
- Chủ SP chốt: mốc "đạt Overall" = **mốc chương trình** (`NGUONG_KY_VONG`: FOU 4 · BE 4 · ELE 4.5) · dữ liệu cũ đã chốt "Không đạt · Trung tâm" mà Overall đạt → **tự sửa thành Đạt** (đóng Case Tutor kèm theo).

## 2. Hiện trạng đã kiểm (rà mã 14/11)
- MT0 không tự tạo SOS / Case (`resultOf` target null; `raiseSignalsForResult` bỏ MT0). Nhưng chip "SOS" từng kỹ năng (`kyNangSosMt0`, `shared/domain/mt0.ts:53`) bỏ qua Overall → em đạt vẫn thấy SOS; `goiYKyVong.monTruot` (`shared/domain/cuoiKhoa.ts:216`) vẫn liệt kỹ năng dưới ngưỡng khi đã đạt (tô đỏ, điền sẵn kỹ năng Case); QL phải bấm tay "Đạt" cho mọi em; vẫn chọn được "Không đạt · Trung tâm" khi đã đạt.
- Bảng Kết quả đầu ra (`web/src/modules/classes/BangKqdrLopFt.tsx`, `GET /classes/:id/ket-qua-dau-ra` → `kqdrLopFt`): chỉ xem (N22 ②). Chỗ chốt (`luuKyVong`) chỉ ở trang Cuối khoá lớp nguồn, mà em đã chuyển thì không còn ở đó → **không ai chốt được**; việc QL "Kỳ vọng" (`mywork.ts:1594`) dẫn tới đó → không bao giờ hết. `GET /classes/:id/ky-vong` (`panelKyVong`) không còn web gọi. "Tutor 10 buổi" ghi cứng (3 nơi) thay vì `mocThuong().khongDatKyVong.tutor`. Cột MT0 "4.0 · × 3.5 · 4.0 · 4.5 · 4.0" khó đọc; chip % có "●" (trái V22).

## 3. Mục tiêu · không làm · thất bại
- Mục tiêu: (a) MT0 lớp thường Overall ≥ mốc chương trình → **tự Đạt**: không chip SOS, không tô đỏ, không Case / Tutor, không việc QL; (b) QL chốt / sửa Kỳ vọng **ngay trong bảng** Kết quả đầu ra; việc "Kỳ vọng" mở thẳng bảng này và hết khi chốt; (c) bảng đẹp, phần điểm dễ đọc.
- Không làm: không đổi luật N17 (lớp thường "Kết quả đầu ra" máy ghi từ Final) · GVCN vẫn chỉ ghi Nhận xét (N22 ①) · không đổi ngưỡng.
- Thất bại: còn nơi nào ghi SOS / đỏ cho em đã đạt; việc "Kỳ vọng" còn treo; QL vẫn phải đi tìm chỗ chốt.

## 4. Các cách
| Cách | | Được | Mất |
|---|---|---|---|
| **Làm tại chỗ (chủ SP chọn)** | QL chốt trong bảng bằng hộp nhỏ; tự Đạt khi đạt mốc; làm gọn bảng | một nơi, ít thao tác, việc hết đúng | phải sửa bảng chỉ xem (N22 ② "chỉ xem" → nay có thao tác cho QL) |
| Mockup trước | PTA Overhaul vẽ 1440 + 375 rồi code | ít rủi ro hình | chậm ~ nửa ngày |

## 5. Thiết kế
### 5.1 Luật (một hàm)
- `goiYKyVong(ct, bands)`: `dat` = Overall ≥ mốc chương trình; khi `dat` → `monTruot: []`. Không có Overall (MT0 thiếu / có kỹ năng "Đã huỷ" — đặc tả NHAP-DIEM-TU-DO) → xét từng kỹ năng còn lại theo mốc: mọi kỹ năng còn lại ≥ mốc → Đạt; không thì `monTruot` = kỹ năng dưới mốc.
- `kyNangSosMt0`: trả `[]` khi `goiYKyVong(...).dat` (cần mã chương trình lớp nguồn; nối `classes` ở câu `mt0TheoHocVien`, các câu khác đã có `programme_code`). Mọi nơi gọi (Mock detail, lưới FT, một kỹ năng, hồ sơ HV, Kế hoạch Test, chuyển lớp, lộ trình) đi qua hàm này — không thêm nhánh riêng.
- Tự Đạt: em `goiY.dat` chưa có kết quả lưu → coi là Đạt ở `emKyVong` (việc + chỉ số), `kqdrLopFt`, `transition.ts` `kqdrCua`. Ghi Đạt vào DB khi MT0 đủ (lúc lưu điểm MT0 cuối) hoặc đọc suy ra — người code chọn cách đọc ít, ghi lý do. Chặn "Không đạt" khi `goiY.dat` ở `luuKyVong` + `ghiKetLuanFt` (máy chủ), nút tắt có lý do trên web.
- Dữ liệu cũ (chủ SP: tự sửa thành Đạt): migrate một lần — em có kết quả "Không đạt · Trung tâm / Học viên" mà `goiY.dat` → Đạt, đóng Case "Kỳ vọng đầu ra…" + PA Tutor kèm theo (lý do hệ thống, có lịch sử, khôi phục được); khoá `demo_config`; đếm trên bản chép thật, ghi số trong PR trước merge.
### 5.2 Bảng Kết quả đầu ra (làm tại chỗ, làm đẹp)
- QL / Quản trị (quyền như `luuKyVong`): cột "Kết quả đầu ra" có chip trạng thái + nút ở cùng ô: "Chưa chốt" → **Chốt…** mở hộp nhỏ: Đạt · Không đạt · Trung tâm (chọn kỹ năng, điền sẵn `monTruot`; ghi "Tutor {n} buổi / kỹ năng" theo cấu hình) · Không đạt · Học viên (ô kế hoạch). Đã chốt → chip + ⋯ Sửa. Tự Đạt → chip "Đạt" (dòng phụ "tự theo MT0" qua ⓘ). "Chờ MT0" (< 3 band) → chữ mờ; quá tuần 2 FT → QL chốt tay như N22.
- GV / người khác: chỉ xem như cũ.
- Việc "Kỳ vọng · {lớp} · n em" của QL → mở `/hoc-vien/lop/{lớp FT}?che-do=ket-qua` (lớp em đang học), làm tại chỗ; hết khi mọi em đã chốt / tự Đạt.
- **Phần điểm** (chủ SP: "kinh dị"): thay chuỗi "MT0 · L R W S · Overall" bằng ô điểm chuẩn như bảng Tổng hợp (cột L · R · W · S · Overall riêng, cùng dáng ✓ / ✗ màu như hồ sơ lớp); chỉ tô đỏ kỹ năng dưới mốc khi **chưa** đạt; đạt thì màu thường. Final: "76 %" chữ thường, không "●" (V22). Hỗ trợ: link Case gọn ("Case Tutor · L, R ›"). Bàn giao từ GV cũ: tối đa 2 dòng + "Xem" mở hộp đọc. Đợt: dải nhóm như hiện có, gọn.
- 375: mỗi em một thẻ (tên · Final · điểm MT0 lưới 5 ô · kết quả + nút) theo mẫu thẻ em hồ sơ lớp.
- Sửa ghi cứng "Tutor 10 buổi" ở 3 nơi → số cấu hình.
### 5.3 Ràng buộc
- Turso: mở bảng không thêm request; `kqdrLopFt` giữ ≤ trần (23 câu), thêm trần dòng; COUNT "n đợt" giữ.
- Nghiệm thu: ảnh trước → sau 1440 + 375 (QL và GV); **chủ SP duyệt ảnh trước merge** (đổi bố cục bảng). Phép kiểm: em đạt mốc không có SOS / không Case / tự Đạt / việc hết; "Không đạt" bị chặn khi đạt; migrate đổi đúng số em trên bản chép.
- `/code-review high` (migrate + logic máy chủ) trước merge.

## 6. Để người code quyết
Ghi Đạt vào DB hay suy ra khi đọc; tách PR (gợi ý: PR-a luật + migrate + việc QL; PR-b bảng làm tại chỗ + làm đẹp).
