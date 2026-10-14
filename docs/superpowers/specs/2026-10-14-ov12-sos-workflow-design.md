# OV-12 — Nhận xét MT = nguyên nhân SOS · hồ sơ MT · Góp ý hàng tuần · panel số liệu · Học viên & Lớp · hạn 2 tuần · quyền

Nguồn: prompt chủ SP 14/10 (`PISA-prompt-Claude-overhaul-2026-10-14.md`, mục 3.1–3.7) + 8 câu trả lời 14/10.
Mốc mã đã rà: `main` = `0e3adf32` (đã merge hết OV-11a…i #371–#379; trong prompt ghi #378, #379 còn mở — nay đã merge). Rà bằng 3 lượt đọc mã độc lập (file:dòng bên dưới).
Mockup: `thiet-ke/mockup-ov12-{1..4}-*-2026-10-14.html` (mục 4). **Chưa duyệt** — chủ SP xem rồi mới code (trừ OV-12a đã chốt, đang làm).

## 1. Hiện trạng đã kiểm
| Phần | Hiện trạng | Nơi |
|---|---|---|
| Nhận xét MT | Đã có ô cho cả 5 bài L, R, W1, W2 (riêng), S — **không bắt buộc**; lưu `assessment_scores.comment` (lượt × kỹ năng); Case / Phân tích / hồ sơ HV **không đọc**; Excel chỉ có "Nhận xét W" (gộp) + S, thiếu L/R | `shared/domain/nhanXet.ts`, `schema.sql:738-741`, `HopNhapDiem.tsx:351-360`, `fasttrack/attempts.ts:1711-1737`, `shared/domain/xuatMt.ts:137-162` |
| "Có nguyên nhân" | = có dòng `case_issues` role `primary` (nhóm `taxonomy_code`); > 20 nơi phụ thuộc: trạng thái v4 `cho-nguyen-nhan`, việc `cause` (+ gom OV-5a), chuông, thẻ Chờ duyệt `bao_len_nguyen_nhan`, chỉ số Tổng quan, Tổng hợp, Vấn đề HV, Hiệu quả PA, hồ sơ HV, Hành trình, Báo PH lớp thường, PA bổ trợ chung | `cases/sosState.ts:33-146`, `shared/domain/sosV4.ts:59-102`, `cases/sosAuto.ts:183-253`, `worklist/mywork.ts:795-856`, `duyet/loaiYeuCau.ts:340-389`, `worklist/metrics.ts:271,631-646`, `phanTich/{tongHop,vanDeHv,hieuQuaPa}.ts` |
| Chặn theo nguyên nhân | Xác nhận PA quy chế đòi đã có nguyên nhân; **"Không cần theo dõi" chỉ khi CHƯA có nguyên nhân**; Overall đạt chỉ đóng Case chưa có nguyên nhân (`CASE_CHUA_DUNG`) | `sosAuto.ts:375,437`, `cases/sos.ts:534-538` |
| Case không phải MT | Progress lớp thường (FOU/BE/ELE) **cũng** qua `cho-nguyen-nhan` (PA bổ trợ preset). Final / chuyển cấp, Checkpoint, MT0, Case GV báo tay: không qua | `normal/regular.ts:1020-1051`, `sosState.ts:34` |
| Hồ sơ MT | `/mock-test/:id` (`MockDetailPage.tsx`) **cố ý bỏ khối Case** theo Rulebook 17.5; API `attemptDetail` không trả Case | `PISA-Rulebook-2026-09-19.md:388`, `MockDetailPage.tsx:342`, `attempts.ts:1123-1127` |
| Tổng hợp nhóm Xử lý | HV - Case · Chờ nguyên nhân · Chờ duyệt (chỉ "Không cần theo dõi") · Đang làm · Xong/Huỷ; trạng thái **hôm nay**; Case vào dòng theo `sc.attempt_id` | `shared/domain/phanTich.ts:243-262`, `phanTich/tongHop.ts:235-258` |
| Panel số liệu | `DanhSachSoLieu` mỗi dòng là link **chuyển trang**; 9 đơn vị `rowsFor`; một panel một lúc (`khoPanelChung`) | `ui/SoLieu.tsx:58-97`, `worklist/metrics.ts:84-244`, `ui/KhungPanel.tsx:10-39` |
| Học viên & Lớp | Chip Tất cả · Cần làm · Chờ duyệt · Đang SOS · Thiếu thông tin (+ Quá hạn); "Đang SOS" = SOS lượt MT mới nhất **hôm nay**, chỉ FT; TVV/CX trang riêng (Cần chú ý…); **Chọn nhiều chỉ ở hồ sơ lớp** | `StudentsPage.tsx:68,128-134`, `classes/hocVienLop.ts:244-267`, `HocVienTheoVai.tsx:39-46`, `classes/TabHocVienLop.tsx:67,100-107` |
| Góp ý theo tuần | **Chưa có** bảng nào (gần nhất: `assessment_scores.comment` theo lượt; `teacher_estimates` cũ, không dùng) | `schema.sql:752-768` |
| Hạn kết quả PA | Hằng tuần, hết Thứ Hai (`weeklyUpdateDue`) — **đổi ở OV-12a** | `shared/domain/cases.ts:876` |
| Quyền xoá / lưu trữ / bước tiếp | Xoá lớp, xoá HV: chỉ Quản trị; Lưu trữ: QL; Bước tiếp sau thi: QL (`CYCLE_EDIT`); TVV đã nhập được thi thật (OV-8b) — **đổi ở OV-12a** | `classes/xoaKetThucLop.ts:92`, `students/xoaHocVien.ts:196-209`, `loTrinh/buocTiep.ts:43,80,134` |
| Nghi lỗi (chưa tái hiện) | Dòng Case trong panel số liệu luôn lấy `han = han_xac_nhan` (không xoá khi đã xác nhận) → Case xong có thể báo "quá hạn" | `worklist/metrics.ts:112`, `ui/SoLieu.tsx:49-53` — sửa ở OV-12e |

## 2. Quyết định
### Chủ SP chốt 14/10 (không hỏi lại)
- Nhận xét bắt buộc **chỉ MT**, trong hộp chấm hiện có, **W1 / W2 riêng**; dùng làm nguyên nhân Case SOS → **bỏ bước xác nhận nguyên nhân**. Không tự bỏ xác nhận PA / các bước duyệt khác.
- **Nhóm nguyên nhân chọn ngay trong hộp chấm**: hàng chip dưới ô Nhận xét, chỉ hiện và bắt buộc khi điểm kỹ năng đó **dưới kỳ vọng** → Phân tích theo nhóm giữ nguyên.
- **Case MT cũ đang chờ nguyên nhân** (bản chính lúc đổi luật): ô đã có nhận xét → dùng làm nguyên nhân, Case sang bước tiếp; ô trống → việc **"Ghi nhận xét {kỹ năng} · MT{n}"** (mở hộp chấm tại chỗ), giữ hạn cũ. Không xoá lịch sử.
- Tổng hợp nhóm Xử lý: **HV - Case · Chờ duyệt · Đang xử lý**. **Chờ duyệt (rộng)** = đang chờ người chốt: Case chưa có PA, PA chờ xác nhận, "Không cần theo dõi" chờ QL. **Đang xử lý** = có PA đang theo dõi. Xong / huỷ chỉ trong tổng HV - Case.
- Hồ sơ MT thêm bảng Case & phương án (yêu cầu 3.2) — **thay luật Rulebook 17.5** ("bỏ khối Case khỏi hồ sơ MT").
- Học viên & Lớp ba góc nhìn **Tất cả · Đang SOS · Cần làm**; "Đang SOS" theo tuần = **lượt MT thi tuần đó bị SOS** (cả Case đã xong), PA + kết quả là tình trạng đến hôm nay; "Toàn bộ" = mọi lượt SOS trong khoảng.
- Hạn kết quả PA 2 tuần (hạn Thứ Ba, theo tuần, hạn cố định, PA đang chạy tính lại) · QL xoá lớp trống / xoá nhiều HV · TVV bước tiếp sau thi cả 3 hướng → **OV-12a** (đang làm, deploy chiều 14/10).

### Planning tự quyết (theo CLAUDE.md "Nguyên tắc workflow + UX" — chủ SP xem lại khi duyệt mockup)
| # | Việc | Chọn | Lý do |
|---|---|---|---|
| P1 | Ô nào phải có nhận xét | Mọi ô MT (kind `mock`, gồm MT lịch sử nhập bù) có điểm; **không** MT0, Vắng / "-" / Không dự thi / huỷ phần thi / kỹ năng huỷ | Đúng "chỉ MT"; ô không có điểm thì không có gì để nhận xét |
| P2 | Lưu thiếu nhận xét | Hộp chấm: nút Lưu tắt + lý do một dòng. Dán Excel / nhập hàng loạt: **điểm vẫn lưu** (không mất dữ liệu), ô hiện "thiếu nhận xét", vẫn là việc Nhập điểm | Không mất chữ đang gõ; một chỗ đếm |
| P3 | "Ô xong" của MT | = có điểm + nhận xét (+ nhóm khi dưới kỳ vọng). Lượt **chốt** (sinh SOS) chỉ khi mọi ô xong | Case luôn sinh ra đã có nguyên nhân → không cần bước xác nhận |
| P4 | Nguyên nhân của Case | **Liên kết sống** tới ô điểm (nhận xét + nhóm): sửa ở hồ sơ MT = sửa nguyên nhân, có nhật ký. Case Writing = nhận xét W1 + W2 theo luật hai tầng | Một nguồn, không nhập lại |
| P5 | Trượt lại lượt sau (Case lặp) | Mốc "lặp" mang nhận xét + nhóm của lượt mới; Case hiện nguyên nhân theo từng lượt ("MT1: … · MT2: …") | Không hỏi lại, không mất lịch sử |
| P6 | Mức gấp · Tên · Mô tả Case | Mức gấp mặc định theo SOS (SOS 3 = Gấp), sửa được; Tên tự sinh (`tenCaseSos`); Mô tả = nhận xét | Thay phần bước xác nhận đang ghi |
| P7 | Case đi thẳng | **Chờ xác nhận PA** (PA quy chế), hạn xác nhận như nay (5 ngày; Gấp / SOS 3 = 3 ngày) | Giữ xác nhận PA (chủ SP chưa bỏ) |
| P8 | "Không cần theo dõi" | Giữ; mở ở trạng thái chờ xác nhận PA (trước khi PA chạy) | Hiện chỉ mở khi chưa có nguyên nhân → sẽ mất lối nếu không đổi |
| P9 | Overall đạt → xoá SOS | `CASE_CHUA_DUNG` đổi thành "chưa xác nhận PA và chưa có PA GV thêm" | Nguyên nhân tự có, không còn là dấu "đã đụng" |
| P10 | Progress lớp thường | **Giữ bước xác nhận nguyên nhân** (nhận xét không bắt buộc ở lớp thường) — mọi hàm chung rẽ theo `isFastTrackMock` | Luật "chỉ MT" — chủ SP xác nhận ở đợt hỏi 2 |
| P11 | Excel | Thêm cột Nhận xét L, R, W1, W2, S + Nhóm nguyên nhân | Số liệu đi cùng nguồn |
| P12 | Panel số liệu | Bấm dòng → **mở rộng tại chỗ** trong danh sách; việc ngắn (Nhắc, Ghi kết quả gọn, nhập một ô) làm ngay trong dòng; việc dài **thay nội dung panel** kèm "← Danh sách", lưu xong về đúng dòng; nút làm việc tách khỏi link xem hồ sơ | Không panel lồng panel (`khoPanelChung`) |
| P13 | Góp ý hàng tuần | Bảng mới (em × lớp × tuần × kỹ năng); lưu khi rời ô; người ghi mặc định: GV dạy kỹ năng đó + GVCN + QL; TVV / CX / Admin đọc; không thông báo | Chờ chủ SP chốt quyền ở đợt hỏi 2 |
| P14 | Ba góc nhìn ↔ chip cũ | Không bỏ lọc nào: Chờ duyệt, Quá hạn, Thiếu thông tin thành lọc phụ trong góc nhìn (mockup 3) | Prompt 3.5: không tự bỏ chức năng |

## 3. Đối chiếu yêu cầu → tác động → hướng xử lý
| YC | Tác động / xung đột | Hướng xử lý | PR | Còn chờ |
|---|---|---|---|---|
| 3.1 nhận xét bắt buộc + bỏ xác nhận nguyên nhân | Hộp chấm (5 nơi dùng), định nghĩa ô xong / chốt lượt, Kế hoạch Test, Công việc Nhập điểm, Excel; > 20 nơi đọc `case_issues primary`; việc `cause` + panel gom OV-5a; chuông; thẻ Báo lên nguyên nhân; chỉ số Tổng quan `case-*-nguyen-nhan`; seed (6) + ~25 phép kiểm | Case MT tạo kèm `case_issues` (nhóm từ ô) + observation (nhận xét); trạng thái `cho-nguyen-nhan` chỉ còn cho lớp thường; migrate Case cũ (quyết định trên). **Không xoá** dữ liệu `case_issues` cũ | OV-12b (hộp chấm) → OV-12c (Case) | P10 |
| 3.2 bảng Case ở hồ sơ MT | Đảo Rulebook 17.5; quyền xem Case (GV chấm chéo S không thấy) | Khối "Case & phương án" giữa Lịch Test và Lịch sử, dùng `chiTietCaseMo` (theo lô) + `DongCase`, Case theo `sc.attempt_id` + mốc lặp; sửa Rulebook 17.5 | OV-12d | — |
| 3.3 Góp ý hàng tuần | Bảng + API mới; hồ sơ lớp (cạnh Điểm) | migrate bảng `gop_y_tuan`; khối ở tab Học viên; theo dõi tuần cho QL/TVV/CX | OV-12g | P13 quyền, vị trí (mockup 4 có 2 phương án) |
| 3.4 Tổng hợp nhóm Xử lý | `COT_XU_LY_V4`, `tongHop.ts:249-258`, chú giải, Xuất Excel Tổng hợp | 3 cột theo định nghĩa đã chốt; trạng thái hôm nay giữ | OV-12d | — |
| 3.4 panel số liệu toàn web | `SoLieu.tsx`, `rowsFor` (thêm trường mở rộng theo đơn vị, theo lô), mọi màn có số (Tổng quan, Phân tích 5 góc, hồ sơ lớp, hồ sơ GV, Học viên & Lớp badge) | Đơn vị `case` + `phuong-an` trước, rồi `bai`, `hoc-vien`, `lop`, `viec-van-hanh`; thao tác theo vai | OV-12e | — |
| 3.5 Học viên & Lớp ba góc nhìn | Chip hiện có, trang TVV/CX riêng, API SOS theo tuần chưa có (nguồn: `roster.timeline`, `sos_cases`, `case_followups`) | Góc nhìn đổi cột; API `/hoc-vien-lop?goc=sos&tuan=` | OV-12f | Lớp thường trong "Đang SOS"; góc thứ ba của CX |
| 3.6 hạn 2 tuần | xem OV-12a | — | OV-12a | — |
| 3.7 quyền QL / TVV | xem OV-12a | — | OV-12a | — |

## 4. Mockup (chưa duyệt)
| File | Nội dung |
|---|---|
| `thiet-ke/mockup-ov12-1-hop-cham-ho-so-mt-2026-10-14.html` | Hộp chấm MT (nhận xét bắt buộc, chip nhóm khi dưới kỳ vọng, W1/W2 riêng, Vắng), ô "thiếu nhận xét", hồ sơ MT khối Case & phương án, việc "Ghi nhận xét", hồ sơ HV Case không còn Xác nhận nguyên nhân |
| `thiet-ke/mockup-ov12-2-panel-so-lieu-tong-hop-2026-10-14.html` | Số → danh sách → mở rộng dòng → thao tác theo vai (Case, bài, HV, PA); Tổng hợp nhóm Xử lý 3 cột — **thay bởi v2 cho phần panel** |
| `thiet-ke/mockup-ov12-2-panel-lam-viec-v2-2026-10-14.html` | **v2 (14/10 chiều)**: khuôn panel làm việc chung + Xác nhận PA, Xác nhận Case Progress, Ghi kết quả (từng em, Tutor từng buổi), Thêm PA, meeting CX, Ý thức, panel số liệu — không Nhắc |
| `thiet-ke/mockup-ov12-3-hoc-vien-lop-ba-goc-v2-2026-10-14.html` | **v2**: thêm Panel một em (Case + PA + Ghi kết quả), lớp thường trong Đang SOS, không Nhắc |
| `thiet-ke/mockup-ov12-3-hoc-vien-lop-ba-goc-2026-10-14.html` | Ba góc nhìn × QL, GVCN, GVBM, TVV, CX, Admin; SOS theo tuần |
| `thiet-ke/mockup-ov12-4-gop-y-hang-tuan-2026-10-14.html` | Góp ý hàng tuần cạnh Điểm (2 phương án vị trí), quyền ghi / đọc, theo dõi nhiều tuần |

## 5. Kế hoạch PR (thứ tự phụ thuộc; kế hoạch chi tiết từng PR viết khi mockup duyệt)
| PR | Việc | Sau | Song song với | Rà |
|---|---|---|---|---|
| **OV-12a** | Hạn 2 tuần + quyền QL xoá / TVV bước tiếp (migrate `prOv12a`) | — | — | sâu + security (đang làm) |
| **OV-12b** | Hộp chấm MT: nhận xét bắt buộc, nhóm nguyên nhân khi dưới kỳ vọng, ô xong = điểm + nhận xét, Excel cột nhận xét (migrate: cột nhóm trên `assessment_scores`) | deploy 1 + mockup 1 duyệt | OV-12g | sâu (luồng nhập điểm) |
| **OV-12g** | Góp ý hàng tuần (migrate bảng mới) | mockup 4 duyệt | OV-12b | mặc định |
| **OV-12c** | Case SOS MT lấy nguyên nhân từ ô, bỏ `cho-nguyen-nhan` cho MT (việc, chuông, thẻ, chỉ số, hồ sơ HV, Hành trình), Không cần theo dõi, `CASE_CHUA_DUNG`, migrate Case cũ → "Ghi nhận xét" | OV-12b | — | sâu + migrate |
| **OV-12d** | Tổng hợp nhóm Xử lý 3 cột + hồ sơ MT khối Case & phương án + sửa Rulebook 17.5 | OV-12c | OV-12e, OV-12f | mặc định |
| **OV-12e** | Panel số liệu mở rộng dòng toàn web (+ sửa nghi lỗi hạn dòng Case) | OV-12c | OV-12d, OV-12f | sâu (thao tác theo vai) |
| **OV-12f** | Học viên & Lớp ba góc nhìn + API SOS theo tuần | OV-12c | OV-12d, OV-12e | sâu (quyền theo vai) |
Model mỗi PR: Opus 5.5 · XHigh (B: High); không Fable. Deploy lần 2 sau OV-12c (luật đổi) hoặc sau cả OV-12 — chủ SP chọn.
Thứ tự với PR-EN / PR-SOTAY: PR-EN đổi chữ mọi màn → chạy **sau** OV-12 (đếm lại chuỗi).

## 6. Kiểm chứng (hành vi)
- Nhận xét: ô MT có điểm thiếu nhận xét → hộp chấm không lưu, dán Excel lưu điểm nhưng ô "thiếu nhận xét", lượt không chốt; MT0 / Progress / Final / Checkpoint không bị đòi; W1, W2 lưu riêng; ô dưới kỳ vọng thiếu nhóm → 400.
- Không còn sinh việc / chuông / thẻ / số "chờ nguyên nhân" cho Case MT (gọi API Công việc, Tổng quan, Chờ duyệt, Tổng hợp sau khi chốt một lượt SOS); Progress lớp thường vẫn như cũ.
- Case MT mới ở "Chờ xác nhận PA", nguyên nhân = nhận xét + nhóm của ô; sửa nhận xét → Case đổi theo, có nhật ký.
- Migrate Case cũ: Case có nhận xét → sang bước tiếp; Case ô trống → đúng một việc "Ghi nhận xét", hạn cũ; chạy hai lần không đổi.
- Số ở mọi ô số = số dòng panel mở ra; mở rộng dòng không chuyển trang; thao tác đúng vai (gọi API bằng vai khác → 403).
- Tổng hợp: HV - Case = Chờ duyệt + Đang xử lý + xong/huỷ (bấm số thấy đủ).
- Học viên & Lớp "Đang SOS" tuần W2 SEP = số lượt MT thi W2 SEP có SOS ở Tổng hợp cùng tuần.

## 7. Chủ SP trả lời 14/10 chiều (ghi đè mục 2 / P1–P14 nơi khác nhau)
1. **MT bắt buộc nhận xét ở MỌI nơi nhập điểm MT, thiếu thì KHÔNG lưu** (bỏ P2 "dán Excel lưu điểm thiếu nhận xét"); **chỉ miễn MT cũ / MT lịch sử nhập bù** (nhập điểm thôi). Nhận xét ≥ 10 ký tự; nhóm nguyên nhân khi dưới kỳ vọng, chip có số (1 = chính); W1 / W2 xét từng task; "Khác" không cần ô Ghi rõ.
2. **Progress Test lớp thường:** vẫn tạo Case, **mỗi Case một môn**, **ghi nhãn SOS** (theo số môn trượt: 1 → SOS 1, 2 → SOS 2, ≥ 3 → SOS 3 — bỏ T58 "lớp thường không SOS"); **GIỮ PA Bổ trợ mặc định** theo Rulebook §20.6 (chủ SP 14/10 tối chốt lại: FOU 2 buổi/tuần chung, người dạy GVCN; BE/ELE 1 buổi/tuần/môn, GVBM môn); **MỘT bước "Xác nhận Case" hạn 5 ngày cố định**: nhóm nguyên nhân + mô tả ngắn + PA Bổ trợ điền sẵn (sửa được tại chỗ) trong cùng một panel → một nút. Người làm: người phụ trách Case như nay (GV dạy môn), GVCN / QL làm được. Final Test: quy trình bổ trợ miễn phí + Mini Test **giữ nguyên**.
3. **Case SOS MT** lưu như bình thường; em đạt lại (hết SOS) → Case **xoá hẳn** nếu chưa có PA được xác nhận (thay P9); GV muốn thì + Case tay.
4. **PA Tutor:** ghi kết quả bắt buộc theo "Số buổi kỳ này" n → n dòng [Tên tutor * · Nhận xét buổi *] + **một** ô "Tiến triển (2 tuần)" chọn mức tổng hợp cả kỳ (không chọn tiến triển từng buổi). Danh sách tutor + nhận xét tutor: làm sau.
5. **Ghi kết quả PA từng em riêng** — PA gộp được (nhóm bổ trợ), kết quả không gom; vẫn mở panel tại chỗ.
6. **Bỏ mọi "Nhắc"** của QL / QT / Admin ở mọi trang; giữ số đếm, danh sách quá hạn, thẻ Báo QL.
7. **Phối hợp SOS:** việc meeting CX / GĐCN phải xác nhận trong **5 ngày**; xác nhận: Ngày · Người · **Ghi chú bắt buộc (≥ 10 ký tự)** · Đính tệp / ảnh không bắt buộc.
8. **Panel làm việc tại chỗ đồng bộ toàn web** (Công việc, Tổng quan, panel số liệu, Học viên & Lớp, hồ sơ, Ý thức / vi phạm — chuẩn: ⋯ cạnh tên em ở Học viên & Lớp mở panel ngay); bỏ hẳn Xác nhận nguyên nhân MT ở Công việc. Mockup 2 làm lại (impeccable): `mockup-ov12-2-panel-lam-viec-v2-2026-10-14.html` — khuôn chung 4 phần (đầu 2 dòng · khối Cần làm duy nhất có màu · Thông tin gập · chân trạng thái lưu), áp cho mọi panel việc có hạn.
9. **Học viên & Lớp:** bấm "Mở" ở mọi góc nhìn → MỘT panel một em (Case gập được + PA + việc đang cần, Ghi kết quả ngay trong panel) — `mockup-ov12-3-hoc-vien-lop-ba-goc-v2-2026-10-14.html`; lớp thường có trong Đang SOS; góc thứ ba của CX = "Cần chú ý".
10. **Góp ý hàng tuần:** phương án A (cách xem cạnh "Tổng hợp"), người ghi theo đề xuất (GV dạy kỹ năng + GVCN + QL; TVV / CX / Admin đọc).
11. Còn lại theo đề xuất (P1–P14, mockup).
12. **Hệ panel v3** (`thiet-ke/mockup-ov12-panel-v3-2026-10-14.html`, thay phần panel của mockup 2 v2 / 3 v2 / hộp chấm mockup 1): đầu panel giống hệt mọi nơi (tên việc + chip hạn / em · lớp · ngữ cảnh), khối Cần làm duy nhất có màu + một nút chính, Bối cảnh ≤ 3 dòng, chỉ đọc cho TVV / CX gọn; Sửa PA mở ngay trong khối Cần làm. **Chủ SP chốt 14/10 tối (3 câu cuối mockup v3):** (1) mức 5 bậc tên "Tiến triển (2 tuần)" cho PA thường và Tutor; ô chữ "Nhận xét" (PA thường) / "Nhận xét buổi" (Tutor); **bỏ** ô "Vấn đề còn tồn / Ghi chú". (2) Quyết định 3 nút Giữ nguyên · Điều chỉnh · Kết thúc PA — "Thay PA" và "Xin hỗ trợ QL" **gộp vào Điều chỉnh** (giữ chức năng, mở bên trong). (3) Chip hạn 3 mức: quá hạn cam ⚠ · còn ≤ 3 ngày vàng · xa hơn viền xám — sửa một chỗ `deadlineView` (`shared/domain/display.ts`) để mọi nơi cùng ngưỡng.

### Thứ tự mới (chủ SP chạy mỗi PR một session cloud, không tự merge — planning rà, chủ SP merge)
Đêm 14/10 (deploy lần 2 sáng 15/10 cho GV nước ngoài): **OV-12b** (nhận xét MT bắt buộc) ∥ **OV-12h** (bỏ Nhắc · ghi kết quả từng em · Tutor từng buổi · meeting CX 5 ngày) ∥ **EN-a** (nền tiếng Anh)
→ **OV-12c** (Case MT từ nhận xét · Progress "Xác nhận Case" · xoá Case khi đạt · migrate) ∥ **EN-b** (Công việc / Test / nhập điểm tiếng Anh; chờ OV-12b + OV-12h vào main).
Sau: OV-12d (Tổng hợp + hồ sơ MT Case) · OV-12e (panel làm việc v2 toàn web) · OV-12f (ba góc nhìn + panel một em) · OV-12g (Góp ý hàng tuần) · EN-c · EN-d → PR-SOTAY.
