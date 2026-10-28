# RA-LUONG — rà soát mọi luồng đầu-cuối theo vai (đêm 29/10)

Session **RA-LUONG** (logic / luồng). RA-UI làm màu, căn, chữ thừa — trùng tệp thì nhắn PTA Plan.
Trạng thái: **đang chạy** (BẮT ĐẦU 29/10 sau #672–#674). PR đầu: RA-LUONG-1…3.

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
**Chủ SP 29/10:** mockup chỉ là chuẩn HÌNH ẢNH; không đề xuất bỏ thao tác / nút / thành phần đã có chỉ vì mockup không vẽ.
RÚT GỌN được bớt bước thừa, nhưng mọi thao tác đang có phải còn đường làm — PR ghi bảng TRƯỚC → SAU.

| Mã | Luồng | Loại | Hiện trạng (bước · trang · kẹt · số lệch · quyền · console) | Đề xuất / sửa | PR |
|---|---|---|---|---|---|
| K1 | L60/L61 GVCN Hà | **LỖI** số lệch | Công việc: ô lọc "Quá hạn · 9" cạnh đầu nhóm 7 + 3 + 2 = 12 và Tổng quan "⚠ 12 quá hạn"; công tắc "Fast Track 16 · Lớp thường 11" cạnh "56 việc" — ô lọc đếm DÒNG (dòng gộp = 1), đầu trang đếm VIỆC (`demViec`) | `demLocNhanh` + công tắc khung đếm `demViec` trên việc con | RA-LUONG-1 |
| K2 | L61 QL Vy | **LỖI** số lệch | "Của tôi 5 · Của GV 91 · Tất cả 96" cạnh "155 việc" (cùng gốc K1) | `demNguoiViec` đếm `demViec` → Tất cả 155 | RA-LUONG-1 |
| K3 | L30/L61 QL, Admin VP | **LỖI** số lệch | Dòng gộp Speaking chấm chéo MB FT 101 (13 bài) nằm trong "Chấm điểm · Quá hạn" mà không được đếm; nhóm "Bài thi Speaking" chỉ 5 bài ≠ Tổng quan Admin "Speaking · 18 bài". Gốc: khoá dòng gộp chấm chéo mất đuôi `|cc` (chú thích mã nói phải có) → còn mở panel Nhập điểm cả dòng thay vì panel chấm chéo | `khoaGopCua` giữ `|cc` → nhóm Speaking 18 bài = Tổng quan | RA-LUONG-1 |
| K4 | L14 GVBM / GVCN lớp thường | **LỖI** quyền máy chủ | Rulebook R14 + 14/10-Q13: dời lịch Test (FT và lớp thường) chỉ QL / Quản trị; máy chủ vẫn cho GVCN / GVBM lớp thường dời tay mọi tuần (`SCHEDULE_MOVE`), bảng lớp thường còn bày "Xếp lại bài vắng" cho GVBM. R14 ghi "chặn ở GĐ1" — chưa ai làm | `setSkillWeek`: dời tay cần `PLAN_WEEK`; giữ "-" tự dời (`ghiBuDau`), tạo lượt (`khiTao`), GVCN dời MT tuần đã qua (N23). 5 phép kiểm luật cũ SCH-01 sửa theo R14 | RA-LUONG-2 |
| K5 | L11 hồ sơ Mock | **LỖI** nhỏ | Lượt không gắn lớp: "Dời lịch cả đợt" bấm không mở gì (plan mục 4 HOP1) | ẩn mục khi `classId` null | RA-LUONG-3 |
| K6 | L24 vắng FT | RÚT GỌN (để sau — không nhỏ) | Em vắng cả 4 kỹ năng đã dời → biến khỏi lưới tuần gốc (W2 SEP thiếu Hồ Ngọc Diệp); em dời một phần vẫn hiện. Không kẹt: ô tuần mới có "vắng W2 SEP" + gỡ được | lọc thêm `assessment_scores.no_show_period_id` — cột không có chỉ mục → cần migration + đo tốc độ; để PR riêng | — |
| K7 | L14 lớp thường | **CẦN CHỦ SP** | Môn "Không dự thi" làm kết quả lớp thường mãi "chưa đủ môn" (tạm tính) — `regularResultOf` không đọc `no_show_cu` | xem câu hỏi Q-RL1 mục 6 | — |
| K8 | L50 chuyển lớp | ghi nhận | P03 Rulebook: PA Bổ trợ Giữa khoá không tự khép khi chuyển lớp; việc "Ghi kết quả" đi theo GV lớp hiện tại (đúng PR-S5F-a), chỉ còn kẹt khi GV cũ là chủ Case và lớp mới không có GV môn đó | để sau | — |
| K9 | L42 Ý thức | đạt | N5 đã đúng: GVCN không xoá thẳng; thu hồi gửi QL, lý do bắt buộc, giữ dòng (Rulebook 20.9 "LỆCH" đã cũ) | — | — |
| K10 | L65 Xuất | đạt | GVBM không có Xuất (403 + nút ẩn), GVCN xuất lớp mình, TVV 403 | — | — |
| K11 | L60 TVV / Admin VP | đạt | Tổng quan ↔ Công việc khớp (TVV 3 việc; Admin 46 việc · 89 bài + 18 S chéo riêng) | — | — |
| K12 | kiểm | ghi nhận | `EN-HOSO` (prEn) đỏ cả trên `origin/main` sạch: "PA Tutor 1-1 hai buổi…" (chữ GV nhập) lọt vào `tomTat` EN — không do RA-LUONG | báo PTA | — |
| K13 | L53 TVV sau thi | **LỖI** | Công việc bày "Gia hạn" ở việc "Cập nhật KQ thi thật" (không hạn — N6); hộp mở ra, Lưu → máy chủ 400 "Chỉ gia hạn Chọn bước tiếp" | nút chỉ ở "Chọn bước tiếp" | RA-LUONG-4 |
| K14 | L53 TVV → Lộ trình mới | đạt (bấm thử) | Nhập KQ (6.5/7/6/6) → việc "Chọn bước tiếp" hạn 21/09 = 1 tuần (N6) → Lộ trình mới: đầu vào = KQ thi 05/09, MT1–3 xếp sẵn, lộ trình cũ đóng (N12). Phụ: ngay sau "Mở lộ trình", đầu panel vẫn "Chưa chốt bước tiếp" + ô Bước tiếp về "Chọn một bước" tới khi tải lại (máy chủ đã đúng) | ghi nhận — panel không đọc lại | — |
| K15 | L50 Chuyển lớp một em | **LỖI** không khoá cứng | Huỷ quyết định chuyển lớp ở hồ sơ em: không Hoàn tác (Cuối khoá lớp thì có), khôi phục chỉ qua thao tác hàng loạt | `toast.hoanTac` → `khoi-phuc-lenh` sẵn có; bấm thử: huỷ → Hoàn tác → "Đã khôi phục quyết định" | RA-LUONG-5 |
| K16 | L31 S chéo → Case (N8 ③) | **LỖI** số liệu | Xác nhận Case Speaking chọn "Giữ mô tả": chỉ hạ cờ, Case vẫn theo nhận xét ô → lần lưu điểm sau chép nhận xét chấm chéo đè mô tả đã giữ | "giữ" = tách mô tả khỏi nhận xét (như "viết khác"); Hoàn tác trả nguồn cũ | RA-LUONG-6 |
| K17 | L31/L33 Case tái phát | **LỖI** | Case cũ đóng, em trượt lại → Case mới thừa kế chủ Case cũ kể cả khi người đó đã thôi dạy lớp (chú thích mã nói phải kiểm, mã không kiểm) → việc "Mô tả Case" không tới GV đang dạy (N8 ②) | thừa kế chỉ khi còn phân công ở lớp | RA-LUONG-7 |
| K18 | L32 SOS tạm | **LỖI** | Case tạm của em KCK sinh việc "Mô tả Case" (thiếu `CASE_THAT` mà mọi câu đếm khác có) — N8 ④ SOS tạm không việc | thêm `CASE_THAT` | RA-LUONG-8 |
| K19 | L03 bỏ môn (N13 P8) | **LỖI** số liệu | Bỏ môn giữa lộ trình: mức SOS đã trừ môn bỏ nhưng "dưới kỳ vọng" (Tổng quan) và danh sách kỹ năng ở Đang SOS vẫn tính môn bỏ | `evaluateAttemptRow` dùng `kyNangDaBo` như mức SOS | RA-LUONG-9 |
| K20 | L53 hạn bước tiếp | ghi nhận | Hạn "Chọn bước tiếp" tính từ lần lưu KQ thi ĐẦU TIÊN kể cả lưu dở (thiếu kỹ năng) — lối tắt đã ghi `cotSauThi.ts` ("cần cột riêng nếu chủ SP báo"); KQ IELTS thường về một lần | để sau | — |
| K21 | L52/L53 | ghi nhận | (agent đọc mã, chưa bấm thử) việc Phối hợp SOS chờ (Báo PH qua TVV, gặp CX) của lộ trình cũ không đóng khi "Lộ trình mới" — N12 không nói; bản chụp lộ trình đóng tính lại SOS khi sửa điểm muộn không trừ môn đã bỏ; đầu vào lộ trình mới bỏ qua KQ thi cũ chỉ có Overall; "Hẹn bắt đầu" → Case cũ còn mở tới thứ Hai hẹn; xoá nhận xét chấm chéo không hạ cờ Xác nhận Case | để sau / hỏi chủ SP Q-RL3 | — |
| K22 | không khoá cứng | **CẦN CHỦ SP** | Xoá vĩnh viễn, không Hoàn tác / khôi phục: học viên (một / hàng loạt, QL làm được), Case, PA (cả kết quả 6 tuần), vi phạm, tệp bằng chứng; "Kết thúc PA" quy chế không mở lại được; "Bỏ việc Báo PH" (TVV) không mở lại; Duyệt / Từ chối ở Chờ duyệt chỉ huỷ được với Đề xuất PA + Thu hồi Ý thức (trong ngày) | Q-RL2 | — |
| K23 | L40 ghi vi phạm | RÚT GỌN (thấp) | Em đã chuyển / tạm dừng → "chưa xếp lớp hoặc không còn đang học — chưa ghi được vi phạm" không nói bước tiếp | để sau | — |
| K25 | L60 hồ sơ lớp | **LỖI** số lệch | Badge "⚠ 6 việc quá hạn" (đếm dòng con) cạnh Công việc 9 việc quá hạn của cùng lớp (đếm `demViec`) | `demViec` | RA-LUONG-10 |
| K26 | L40 Ý thức cả lớp | **LỖI** mất chữ | Lưu lô được một phần → panel xoá nháp + thôi coi là "đã sửa" → đóng là mất mô tả đã gõ của các em chưa lưu | giữ nháp khi còn em chưa lưu | RA-LUONG-11 |
| K27 | L07 hàng loạt HV | **LỖI** lô một phần | Lỗi máy chủ (không phải lỗi luật) ở một em giữa lô → 500 cả lô: web báo mọi em "chưa lưu" dù em trước đã lưu, không nhật ký, Thử lại kẹt | trả đúng em đã lưu, em lỗi + em sau "chưa lưu" | RA-LUONG-12 |
| K28 | L01 Thêm HV | **LỖI** mất dòng | Sau khi lưu, bỏ dòng đã thêm theo CHỈ SỐ lưới hiện tại — dán / sửa lưới trong lúc chờ → xoá nhầm dòng mới chưa lưu | bỏ theo dòng đã gửi | RA-LUONG-13 |
| K29 | L02 Sửa cả lớp | RÚT GỌN | Một ô lỗi chặn lưu cả bảng (web khoá Lưu) — trái "lô lỗi một phần: dòng đúng vẫn lưu"; chữ không mất | web gửi các em hợp lệ, em có ô lỗi ở lại lưới; máy chủ giữ "lô = một lần lưu" (C22). Bấm thử: "Lưu 1 em" bật khi còn ô lỗi, em hợp lệ lưu, panel ở lại "1 ô cần sửa" | RA-LUONG-15 |
| K30 | L10 Xếp MT mới | **LỖI** dữ liệu | "MT mới" hàng loạt không có khoá chống lặp: mất phản hồi mạng rồi bấm Lưu lại → tạo MT n+1 cho em đã lưu (việc sau vòng lưu lỗi → báo lỗi dù đã lưu: còn, thấp) | khoá chống gửi lặp như Thêm HV / Sửa cả lớp: cùng khoá + cùng nội dung → trả kết quả cũ; web giữ khoá khi lỗi mạng | RA-LUONG-17 |
| K31 | L64 quyền | đạt | Mã trả về API theo vai khớp nav: CX / TVV 403 Phân tích GV, Test; TVV có Công việc (việc TVV), CX không; Admin VP có Phân tích (trừ Ý thức — tab ẩn đúng); GV 403 Phân tích; Head tutor 403 mọi khu | — | — |
| K32 | L40 Ý thức → TVV (N1, N2) | đạt (bấm thử) | GVCN Xác nhận xử lý Report 1 (Lê Quang Huy) → việc Báo PH của TVV sinh ngay, hạn 18/09 (lưu T2 14/09 + 4) | — | — |
| K33 | L12 Kế hoạch Test (N23) | đạt | GV bộ môn mở lớp: chỉ xem, không nút ghi; mọi lối dời lịch lớp thường trên web (bảng lớp thường, trang lượt lớp thường, hộp kỹ năng) đọc cờ máy chủ `doiLich` / `canPlan` → sau RA-LUONG-2 GV không thấy nút; GVCN dời MT tuần đã qua thì hộp chặn tuần đích ngay tại ô | — | — |
| K34 | hồ sơ HV (RA-UI báo) | **LỖI** văng trang | Tab Ý thức đọc `cy.ratio` khi em chưa có lộ trình (`cycle` null) — chỗ khác đều `cy?.`; bộ demo không có ca này | `cy?.ratio` | RA-LUONG-14 |
| K35 | L52 Xét lại (N21) | **LỖI** | Chọn Tạm dừng/ Kết thúc học khi em còn lệnh chuyển CHƯA thi hành: lệnh treo — bàn giao GVBM / GVCN, "Sắp nhận" vẫn chạy cho em đã nghỉ (lối khác đều chặn bằng `chanLenhCho`) | huỷ lệnh cùng quyết định; Hoàn tác khôi phục lệnh | RA-LUONG-16 |
| K36 | L50/L51 Chuyển lớp tuần W-1 (N20) | **CẦN CHỦ SP** | Trang Cuối khoá luôn ra lệnh "cuối khoá" (Lên FT → MT0 tuần Final, bổ trợ, Xét lại, hạn bàn giao tới CN tuần Final); Chuyển lớp MỘT em (hồ sơ HV, duyệt đề xuất GVCN) chỉ là "cuối khoá" từ thứ Hai tuần Final → cùng quyết định "Lên FT" ở tuần trước Final (lúc việc Chốt lộ trình đã mở) ra lệnh "giữa khoá": không MT0, không Xét lại, hạn bàn giao chỉ +7 ngày | Q-RL4 | — |
| K37 | L17 MT0 (N20) | CẦN CHỦ SP | Lên FT ra lệnh SAU tuần Final (N20 cho phép) → MT0 đặt ở tuần Final đã qua → sinh ra đã quá hạn chấm | Q-RL5 | — |
| K38 | L52 Xét lại (N21) | CẦN CHỦ SP | "Học lại" ở thẻ Xét lại chỉ cho lớp cùng chi nhánh; chi nhánh không có lớp đúng chương trình → thẻ "Chưa có lớp…" không lối ra, hết hạn tự "Tiếp tục" (N21 ghi "= đường Chuyển lớp", Chuyển lớp một em được khác chi nhánh) | Q-RL6 | — |
| K39 | ghi nhận | ghi nhận | (agent đọc mã) sửa lệnh không cập nhật `ngay_ra_lenh` → điều kiện (b) "chốt trước Final" của Xét lại có thể báo sai; GVCN lớp mới ghi nhận xét Xét lại sau khi QL đã quyết → 403 không bước tiếp; việc Kỳ vọng FT và Bàn giao không bao giờ hết hạn | để sau | — |
| K40 | đạt | đạt | (agent đọc mã) N20 ngày (nhắc T2 W-1, hạn T5, quá hạn từ T6, không chặn), ngoại lệ N15 cho MT0 do chốt; N17 cả lớp cùng chi nhánh, một em khác chi nhánh được; N21 bốn điều kiện, chủ = QL lớp hiện tại, hạn, tự "Tiếp tục"; N22 chỉ QL chốt hướng, xác nhận một lần nêu tên; bàn giao hạn + sửa sau ngày chuyển | — | — |
| K24 | phiên | ghi nhận | Hai lần văng về màn đăng nhập giữa thao tác (một lần `GET /cycles/41/lo-trinh-moi/xem-truoc` 401, phiên vẫn còn trong DB); không tái hiện, log máy chủ không lỗi | theo dõi | — |

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

- K6: em vắng dời hết 4 kỹ năng không còn hàng ở lưới tuần gốc (không kẹt, ô tuần mới gỡ được).
- K8: chủ Case cũ giữ việc "Ghi kết quả" khi lớp mới không có GV môn đó (P03).
- K14 panel Sau thi không đọc lại sau "Mở lộ trình" · K20 hạn bước tiếp từ lần lưu dở · K21 (năm điểm agent đọc mã) · K23 câu chặn ghi vi phạm thiếu bước tiếp · K24 văng phiên chập chờn.
- [XM] nhóm Công việc tên "Bài thi Speaking tuần này" (mockup T03) nhưng chứa cả bài chấm chéo tuần trước (quá hạn) — đổi tên là chữ hiển thị, của RA-UI / chủ SP; Chấm Test gọi cùng nhóm là "Speaking chấm chéo".
- `moveableSkills` (máy chủ trả ở hồ sơ Mock) web không đọc — dọn khi đụng.
- plan.md mục 4 dòng "Hồ sơ MT: lượt không có `classId`… (HOP1)" — xoá sau khi RA-LUONG-3 merge.

## 6. Câu hỏi CẦN CHỦ SP (gom, không hỏi lẻ)

| # | Câu hỏi | Khuyến nghị |
|---|---|---|
| Q-RL1 | Em "Không dự thi" một môn ở Final / Progress lớp thường: kết quả tính thế nào? Nay máy để "chưa đủ môn" mãi (tạm tính), QL không chốt được theo số. | Tính trên các môn đã thi, ghi rõ "{môn}: không dự thi" cạnh kết quả; QL vẫn đổi được ở Cuối khoá. |
| Q-RL2 | Các thao tác XOÁ (học viên, Case, PA có kết quả, vi phạm, tệp bằng chứng) và "Kết thúc PA", "Bỏ việc Báo PH", Duyệt / Từ chối ở Chờ duyệt hiện không Hoàn tác / không khôi phục được (luật "không khoá cứng" 21/10). Làm thế nào? | Một đợt PR: xoá = xoá mềm + Hoàn tác 10 s + "Khôi phục" ở nhật ký cho người có quyền sửa (30 ngày rồi mới xoá hẳn); Kết thúc PA / Bỏ việc Báo PH có "Mở lại"; Duyệt / Từ chối có Hoàn tác 10 s cho mọi loại thẻ. |
| Q-RL3 | Em chọn "Lộ trình mới": việc Phối hợp SOS còn chờ của lộ trình cũ (Báo PH qua TVV, gặp CX) có đóng theo như Case / PA không? | Đóng cùng lý do "Kết thúc lộ trình" (giữ lịch sử), như Case / PA. |
| Q-RL4 | Chuyển lớp MỘT em ở tuần trước Final (lúc việc Chốt lộ trình đã mở): coi là quyết định Cuối khoá như trang Cuối khoá (Lên FT có MT0, Xét lại, hạn bàn giao tới CN tuần Final) không? Nay chỉ từ thứ Hai tuần Final. | Có — từ thứ Hai tuần trước Final, Chuyển lớp một em đi đúng luật Cuối khoá (cùng ngày mở việc Chốt lộ trình); chuyển ngang cùng chương trình vẫn được ghi là chuyển lớp, không thành "Học lại". |
| Q-RL5 | "Lên FT" ra lệnh sau tuần Final (N20 cho phép): MT0 đặt tuần nào? Nay đặt ở tuần Final đã qua → quá hạn chấm ngay. | Tuần này (muộn nhất tuần 2 FT như luật MT0); hạn chấm tính từ tuần đó. |
| Q-RL6 | Thẻ Xét lại "Học lại" có cho chọn lớp chi nhánh khác như Chuyển lớp một em không? Nay chỉ cùng chi nhánh, chi nhánh không có lớp đúng chương trình thì kẹt, hết hạn tự "Tiếp tục". | Cho chọn mọi chi nhánh như Chuyển lớp một em (N17 chỉ giới hạn cả lớp); hoặc ít nhất có nút "Mở lớp mới" như Cuối khoá. |
