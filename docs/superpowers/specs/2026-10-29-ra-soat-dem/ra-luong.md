# RA-LUONG — rà soát mọi luồng đầu-cuối theo vai (đêm 29/10)

Session **RA-LUONG** (logic / luồng). RA-UI làm màu, căn, chữ thừa — trùng tệp thì nhắn PTA Plan.
Trạng thái: **lượt 1 xong (chỉ đọc) — chờ PTA Plan nhắn "BẮT ĐẦU"** sau khi #672–#674 merge.

Nguồn luật khi so: `plan.md` 1.6 (Q-1…Q-9, N1…N23) + 2c (T1…T23) + 3 · Rulebook §20 (20.1b gỡ chặn, 20.9 ai làm gì) ·
bộ nhớ (không khoá cứng, thi thật = kết thúc, N8 nhận xét → mô tả Case, đơn giản hoá) · CLAUDE.md (đầu ra trước, tại chỗ, cùng số cùng nguồn).

## 0. Cách chạy

- Nhánh mới từ `origin/main` mới nhất · `npm run seed` · `npm run build:server` · `npm run dev` với `PORT` / `WEB_PORT` riêng
  (không 4000 / 5173). Một máy chủ; tắt khi không dùng (lọc theo đường worktree / cổng của mình).
- Ngày demo cố định **T2 14/09/2026 (W3 SEP)**. Đăng nhập: `POST /api/demo/session {userId}` hoặc tab "Vào nhanh".
  Đổi vai bằng góc nhìn (`/session/goc-nhin`) cho tài khoản nhiều vai.
- Thử luật cuối tuần (N15) và hạn: không đổi được ngày demo trên giao diện → kiểm bằng phép kiểm máy chủ (đồng hồ giả), không đổi seed.
- Mỗi luồng ghi vào bảng mục 3: bước · đổi trang · nhập lại · kẹt / chặn cứng · số lệch · vai lệch quyền máy chủ · console / mạng · trái luật.

## 1. Tài khoản thử (seed; id xác nhận lại bằng DB lúc chạy)

| Vai | Người | Ghi chú dùng |
|---|---|---|
| Quản trị hệ thống | Đỗ Vũ Tuấn Phong (id 1) | mọi CN; ngoại lệ N15; bảng quy đổi band; tài khoản; xoá |
| QL Monbay | Nguyễn Khánh Vy (id 2) | Chờ duyệt đủ chip (D17), Kế hoạch Test, Cuối khoá, Xét lại |
| QL BC / CP / HD / UB | Trần Hải Đăng · Lê Ngọc Mai · Phạm Quang Anh · Hoàng Thanh Bình (id 3–6) | thử phạm vi chi nhánh (không thấy CN khác) |
| GVCN MB FT 101 | Trần Ngọc Hà (id 7) | Ý thức D14, vắng, MT cũ, dời MT tuần đã qua (N23) |
| GVBM | Lê Minh Khoa · Phạm Thu Trang (MB + BC — hai CN) · Cao Khánh Linh (GVCN MB FT 102) | GV hai chi nhánh: số liệu tách |
| GV có S trong hồ sơ, không dạy S | Đỗ Thu Hương (pb2b) · Mạc Thùy Linh (đủ 5 kỹ năng) | S chấm chéo N7 / N8 ③ |
| Admin VP (office_admin) | Phạm Thanh Xuân (MB) | xếp / dời MT, sửa điểm có lý do; KHÔNG huỷ / khôi phục, KHÔNG Case / Ý thức |
| TVV | Phan Mai · Lê Thu (MB), Đỗ Minh Trang (BC), Vũ Hồng Nhung (HD), Trịnh Thu Thảo (UB) | việc TVV N6; không Test, không Công việc |
| CX | Vũ Thanh Tâm (toàn hệ thống) | như TVV mọi CN; Phân tích trừ phần GV |
| Head tutor | (tuSeed) | chỉ trang Tutor — **Tutor hoãn: chỉ kiểm không lỗi / không lộ menu khác, không sửa** |

## 2. Luồng cần thử theo vai

Mã luồng `Lxx`; cột "Vai" = ai đi luồng; "Tình huống thật" = ca khó phải thử thêm.

### A. Lớp & học viên
| Mã | Luồng | Vai | Tình huống thật / điều phải đúng |
|---|---|---|---|
| L01 | Tạo lớp → phân công GV → thêm HV (tay + Dán / intake parse → preview → commit) | QL, TVV (tạo lớp + thêm HV, không phân công), GVCN (thêm HV lớp mình) | lô lỗi một phần (dòng trùng email, thiếu ngày sinh — không bắt buộc, Q3 14/10); TVV không thấy ô phân công; GVCN lớp khác bị chặn ở máy chủ |
| L02 | Sửa thông tin HV (Target, ngày sinh, email, TVV, liên hệ PH) · Sửa cả lớp (xem trước → lưu) | QL, TVV, CX, GVCN (Đề xuất sửa → QL duyệt) | sửa Target có lý do; GV không thấy ô liên hệ; đề xuất sửa em Tạm dừng được (20.1b-7) |
| L03 | Môn đăng ký (N13) ở Sửa thông tin / Sửa cả lớp / Lộ trình mới | QL | bỏ môn giữa lộ trình: bài chưa thi rời đợt, Case mở đóng "Không còn học môn", SOS / Phối hợp chỉ tính môn còn học (P8) — so ở Học viên & Lớp, hồ sơ, Tổng quan, Công việc |
| L04 | Tạm dừng / Kết thúc học (N11) → Lưu trữ → Quay lại học | QL, GVCN, TVV | Hoàn tác ngay; em kết thúc ẩn khỏi danh sách hiện tại (#665); Case dừng hạn; quay lại khi lớp cũ đã kết thúc → gợi ý lớp (N22 ⑤) |
| L05 | Trước / Sau + Quay lại đúng nguồn (bộ lọc, tab, cuộn) qua mọi hồ sơ | mọi vai | mở từ Tổng quan → hồ sơ HV → Case → quay lại |
| L06 | Học viên & Lớp ba góc nhìn (Tất cả · Đang SOS · Cần làm) · chi nhánh mặc định (T9) | QL, GV, TVV ("HV của tôi") | số "Cần làm" = Công việc = Tổng quan |
| L07 | Xoá HV / lớp trống / lưu trữ nhiều | QT (xoá), QL (lớp trống, nhiều HV) | xoá lớp còn em → chặn có lý do + bước tiếp |

### B. Lịch MT + Kế hoạch Test
| L10 | Kế hoạch Test FT: xếp MT mới (MT mới = đợt nhỏ nhất chưa lịch), xếp từng kỹ năng, hàng loạt (xem trước, giữ hàng lỗi) | QL, Admin VP | N9 nới: chỉ nhắc thứ tự, giữ MT0 trước MT1; không xếp tuần đã qua (trừ QL — T4); lô lỗi một phần |
| L11 | Dời một kỹ năng / cả đợt; dời có điểm (T20); dời vượt lượt sau (T2) | QL, Admin VP, GVCN (N23: tuần đã qua → đã qua / tuần này) | GVCN dời sang tuần tới phải bị chặn ở máy chủ VÀ không có nút; GVBM không dời |
| L12 | Kế hoạch Test chỉ xem cho GV lớp mình dạy (N23) | GVCN, GVBM, GV chấm S chéo; TVV phải 403 | nút ghi không hiện; API ghi 403 |
| L13 | + MT / S Ex (N10) | QL, QT, Admin VP (?) | N10 ghi "chỉ QL / Admin / QT" — đối chiếu quyền máy chủ; S Ex không vào Overall / SOS / KPI |
| L14 | Lớp thường: lịch PT / Final, dời môn (chỉ QL — Q13), "-" lớp thường (Q1 14/10) | QL, GVCN, GVBM | dời bị vướng đợt kế → GV kẹt (C08-c) |
| L15 | Huỷ / Xoá lịch, khôi phục phần thi huỷ (T21), "Không mock lại", khôi phục kết quả | QL (Admin VP không) | khôi phục vào tuần này / đã qua; đã có lượt cùng số → câu chặn rõ |
| L16 | Khoá cuối tuần N15 (T6–CN) | mọi vai trừ QT | chỉ kiểm bằng phép kiểm đồng hồ giả; ngoại lệ: nhập điểm, "-", duyệt thẻ Dời, Khôi phục, Không mock lại, MT0 do chốt Lên FT (N20) |
| L17 | MT0: chốt Lên FT → MT0 tuần Final; đổi hướng → MT0 "không dùng" | QL | MT0 luôn đứng đầu; không có trong panel Xếp lịch |

### C. Nhập điểm
| L20 | Lịch Test tuần → mở lớp → lưới → hộp nhập điểm → **Lưu · bài tiếp ›** đi hết lớp → Lớp tiếp / Việc tiếp | GVBM, GVCN, QL, Admin VP | T19 chưa tới tuần thi: không ai nhập; qua hạn vẫn nhập, tính trễ; W1 / W2 hai hộp; tiêu chí W/S số nguyên (N16); band x.5 |
| L21 | Dán Excel (`/attempts/scores/lo`, `/regular/scores/lo`) | GVBM, QL | dòng lỗi một phần giữ lại, dòng đúng lưu; không lỗi vì thiếu nhận xét (N9) |
| L22 | Panel Nhập điểm lớp (⋯ hàng lớp / hồ sơ lớp) · Chấm Test (GV) · điện thoại MotKyNang | GV | số "Của tôi" = Chấm Test = Tổng quan GV = Công việc |
| L23 | Sửa / xoá điểm (xoá trắng + Lưu, T22), MT cũ (GVCN + QL), lớp đã kết thúc (chỉ QL sửa; GV ô trống được) | GVBM, GVCN, QL | lịch sử cũ → mới; không lý do bắt buộc |
| L24 | "-" vắng FT (N4): lần 1 dời tuần kế, lần 2 huỷ, MT cũ huỷ ngay, ghi muộn; xoá "-" = hết vắng; nút "Vắng" | GVBM, GVCN, QL | không dời được → thẻ "Dời lịch Test" cho QL; Hoàn tác 10 s; ô ghi "vắng W3 SEP" (`chuDoiVang`) ở mọi ô điểm |
| L25 | Bảng quy đổi band (#666): QT sửa, QL xem; L theo IDP v2; điểm cũ giữ band | QT, QL | nhập raw L/R ra band đúng bảng; sửa bảng không đổi điểm đã nhập |

### D. S chéo, nhận xét → Case, SOS, Phối hợp
| L30 | S chấm chéo: GV có S trong hồ sơ (không dạy lớp) chấm ô S lớp FT cùng CN (N7) | Đỗ Thu Hương, Mạc Thùy Linh | khác CN → chặn; chưa ai nhận không tính quá hạn (N19, T18); người nhập ≠ GV phụ trách S → việc "Xác nhận Case" cho GV phụ trách S (N8 ③) |
| L31 | N8: nhận xét MT → mô tả Case kỹ năng (chỉ khi Case chưa mô tả; đi theo tới khi sửa riêng); không nhận xét → việc "Mô tả Case {kỹ năng}" cho GV phụ trách | GVBM, GV phụ trách S | ô viền vàng chỉ MT mới nhất; không chữ "cũ"; quá hạn SOS mà chưa mô tả vẫn phải ghi |
| L32 | SOS tạm → chốt → Case + hạn; Overall đạt → SOS chưa xử lý tự mất (N8 ④); KCK nhẹ | GVBM, QL | số "Đang SOS" ở Học viên & Lớp = Tổng quan = Phân tích |
| L33 | Case: tạo, đổi người phụ trách (D17), Thêm PA (FormPa), Ghi kết quả PA (2 tuần, Thứ Ba), Hoàn thành, Mở lại, Xác nhận PA lô + Hoàn tác | GV đúng kỹ năng, GVCN, QL | GVCN không dạy môn → không ghi bù Case môn đó (C02 giữ chặn); P06 FOU nhóm |
| L34 | Phối hợp SOS: xác nhận / mở lại / bỏ | GVCN, QL | N13 bỏ môn → Phối hợp chỉ tính môn còn học |
| L35 | Đề xuất PA ngoài danh mục / đổi PA → QL duyệt (Chờ duyệt) | GV → QL | trả lời / sửa trả lời / huỷ quyết định |

### E. Ý thức + cấp bậc
| L40 | Ghi vi phạm (một / nhiều) → GVCN Ghi nhận / Xác nhận xử lý theo thang → (N1) việc TVV ghi kết quả, hạn 5 ngày lịch (N2) | GV dạy lớp, GVCN, TVV | 3 vi phạm / 2 tuần → bắt buộc; quá hạn → thẻ Báo lên ở Chờ duyệt QL |
| L41 | Ngoài thang (WL 3, Meeting, Đình chỉ) → QL duyệt → Đã thực hiện | GVCN, QL | từ chối → về Cần xử lý, lý do ở dòng thời gian |
| L42 | Thu hồi / xử lý không tăng bậc (N5): gửi QL, lý do bắt buộc → "Đã thu hồi" | GVCN, QL | không Hoàn tác sau lưu xử lý; Rulebook 20.9 ghi "LỆCH — GVCN đang xoá thẳng" → kiểm còn lệch không |
| L43 | Khai bậc một em + **khai bậc cả lớp (#672 KHAI-BAC-LO)** | GVCN, QL | chỉ thử sau khi #672 merge |
| L44 | Báo PH (y-thuc/bao-ph) · em chuyển lớp giữ vi phạm dính (D15) | GVCN, TVV | hạn đặt lại ở lớp mới |

### F. Chuyển lớp, cuối khoá, thi thật, bước tiếp
| L50 | Chuyển lớp một em (QL ra lệnh; GVCN đề xuất) → bàn giao (GVBM ghi môn, GVCN xác nhận) → thi hành | QL, GVCN, GVBM | khác chi nhánh một em được; sửa / huỷ lệnh khi còn chờ (P02); bàn giao sửa sau ngày chuyển (20.1b-4) |
| L51 | Cuối khoá lớp thường (N17, N20, N22): chọn tất cả / nhóm, áp chung + ngoại lệ, tạo lớp tại chỗ; chốt Lên FT → MT0; kỳ vọng FT | QL (chốt), GVCN (nhận xét) | hạn T5 tuần trước Final; "Ngay hôm nay" một hộp xác nhận nêu tên |
| L52 | Xét lại lộ trình (N21): 4 điều kiện, Tiếp tục / Học lại / Tạm dừng, chọn nhiều, hoàn tác | QL | hết hạn tự ghi "Tiếp tục" |
| L53 | Thi thật: TVV nhập KQ (cả em Lưu trữ — 20.1b-7) → việc "Chọn bước tiếp" hạn 1 tuần (N6) → 2 hướng (N12): Tạm dừng / Kết thúc · Lộ trình mới (LT1 / LT2 / RF / Khác, môn, Target, đầu vào = KQ thi gần nhất) | TVV, QL (em không TVV), CX | KHÔNG tự kết thúc khi nhập KQ; Case cũ đóng "Kết thúc lộ trình", PA "Dừng — kết thúc lộ trình"; MT chưa làm của lộ trình đã có KQ thi không còn là kế hoạch (#665) |
| L54 | Kết luận FT, Học lại, Lộ trình tiếp (một em / cả lớp), Chuyển tiếp lớp FT | QL, GVCN | — |
| L55 | KET / PET (N18): Target + KQ Cambridge, Checkpoint R · W · L · S | QL, TVV | thang 100–150 / 120–170 |

### G. Việc của tôi, Tổng quan, báo cáo, Xuất, nhật ký
| L60 | Tổng quan theo vai (QT, QL, GV hai khối, TVV 3 số, Admin MT, CX) — ô số mở panel tại chỗ | mọi vai | **cùng số cùng nguồn**: ô số Tổng quan = số dòng panel = Công việc = badge menu = chuông |
| L61 | Công việc (Hỗ trợ HV · Vận hành · Báo cáo đơn vị): làm tại chỗ, dòng xong mờ + gạch, lọc hai tầng | GV, QL, Admin VP (chỉ Chấm điểm + Nhắc) | việc đã xong không còn chờ / quá hạn ở nơi nào; quá hạn người khác chữ mờ (#674) |
| L62 | Chờ duyệt QL: 6 chip (D17), duyệt / từ chối nhiều, sửa trả lời, huỷ quyết định, rút | QL, QT | GV không bao giờ thấy; badge = số cần duyệt |
| L63 | Báo cáo đơn vị: nộp, nộp muộn (20.1b-5), sửa bản đã nộp | QL, GV | không khoá |
| L64 | Phân tích (toàn bộ, GV, lớp, Hiệu quả PA) · "Toàn bộ" chỉ ở Phân tích | QL, QT, CX (không phần GV), Admin VP | CX gọi API phần GV phải 403 |
| L65 | Xuất Excel: Học viên & Lớp, Lịch Test, Kế hoạch Test (`/ke-hoach-test/xuat`, `/xuat-diem`), `/xuat-mt` | QL, QT, GVCN lớp mình; GVBM KHÔNG (20.9) | GVBM không có nút và API 403 |
| L66 | Hoàn tác / khôi phục khắp nơi: "-", Tạm dừng, Quay lại, xác nhận Case / PA, theo dõi, gộp tutor, xét lại, lô Ý thức | mọi vai | nút không đảo được = lỗi (bộ nhớ "không khoá cứng") |
| L67 | Nhật ký / Lịch sử: HV, điểm, lịch, Ý thức, PA, lớp; nhãn action tiếng Việt; "Khôi phục" (#674) | QL, QT | mọi thao tác ghi đều có dòng ai · lúc · cũ → mới |
| L68 | Thông báo: Cần làm / Để biết, Đọc hết, bấm tới đúng chỗ | mọi vai | chuông lọc theo góc nhìn |
| L69 | Đổi góc nhìn (nhiều vai), VI \| EN, Sáng / Tối, 375 | QL nhiều vai, mọi vai | quyền đúng vai đang chọn; không chữ Việt khi EN |

### H. Quản trị
| L70 | Tài khoản: duyệt đăng ký, vai, kỹ năng (ảnh hưởng S chéo), mật khẩu, xoá | QT | bỏ kỹ năng S → mất quyền chấm chéo nhưng điểm cũ giữ |
| L71 | Chương trình / lộ trình tự cấu hình, role-permissions, bảng quy đổi | QT | áp cho lớp mở sau |

## 3. Kết quả (điền khi chạy)

Phân loại: **LỖI** (sửa ngay) · **RÚT GỌN** (bớt bước / bỏ chặn cứng, không đổi luật, không đổi bố cục → sửa ngay) ·
**CẦN CHỦ SP** (luật sai / nên đổi, đổi bố cục — câu hỏi ngắn + một khuyến nghị).

| Mã | Luồng | Loại | Hiện trạng (bước · trang · kẹt · số lệch · quyền · console) | Đề xuất / sửa | PR |
|---|---|---|---|---|---|
| | | | | | |

## 4. Giả thuyết cần kiểm trước (từ tài liệu — chưa xác minh)

Lấy từ `plan.md` mục 4 "Ghi chú không chặn còn mở" và Rulebook 20.13. Mỗi dòng: thử trên web, đúng thì phân loại vào mục 3.

| # | Nguồn | Nghi vấn | Luồng |
|---|---|---|---|
| G1 | 20.9 | GVCN thu hồi lần xử lý: luật N5 = gửi QL, Rulebook ghi "LỆCH — GVCN đang xoá thẳng" | L42 |
| G2 | 20.13 C08-c | Lớp thường dời bị chặn khi vướng đợt kế → GV kẹt, không lối ra | L14 |
| G3 | 20.13 P03 | PA Bổ trợ Giữa khoá không tự khép khi chuyển lớp → GV lớp cũ còn việc quá hạn | L50 |
| G4 | 20.13 P08 | Quét huỷ phần thi hết hạn / quá hạn duyệt chỉ chạy khi có người mở web | L24, L62 |
| G5 | plan 4 | Công việc: MT0 lớp thường Nợ điểm đếm W1 + W2, Công việc đếm Writing 1 bài → số lệch | L60, L61 |
| G6 | plan 4 | "Nhắc tất cả" khi lọc hạn nhắc từng việc con; dòng gộp "1 em" mất "2 việc" | L61 |
| G7 | plan 4 | Vắng: lưới tuần gốc không có hàng em khi mọi kỹ năng đã dời; Khôi phục phần thi xoá dấu "-" | L24, L15 |
| G8 | plan 4 | Kết quả lớp thường có môn Không dự thi vẫn "chưa đủ môn" | L14 |
| G9 | plan 4 (SL1) | Chuông lấy tối đa 50 dòng; `case_giao` không theo khi đổi người phụ trách; `khacChiNhanh` không lọc `?lop=`; badge Chờ duyệt mọi CN vs hộp theo CN đã nhớ | L62, L68, L33 |
| G10 | plan 4 | Hồ sơ MT: lượt không `classId` → "Dời lịch thi cả đợt" không mở gì | L11 |
| G11 | 20.13 P07 | QL / QT xem hồ sơ QL khác → 404 | L60 |
| G12 | N10 | "+ MT" / S Ex: quyền Admin VP so với chữ "QL / Admin / QT" | L13 |
| G13 | N23 | GVCN dời MT tuần đã qua: máy chủ chặn đích tuần tới? GVBM có nút dời? | L11, L12 |
| G14 | 20.9 | Xuất Excel: GVBM có thấy nút / gọi được API không | L65 |

## 5. [XM] / để sau (chép sang mục "Việc để sau" của bàn giao PTA)

(chưa có)
