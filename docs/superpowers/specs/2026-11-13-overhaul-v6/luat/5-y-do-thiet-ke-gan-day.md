# 5 — Ý đồ thiết kế gần đây (28/10 → 13/11)

Overhaul V6 chỉ đổi cách bày. Thao tác và ý đồ dưới đây phải còn.

Ký hiệu: **p.N** = `plan.md` dòng N ở commit `94a1daf79` · **D.V… / D.G…** = luật `DESIGN.md` · **N…** = `plan.md` 1.6. Chữ trong ngoặc kép = nguyên văn chủ SP.

## 1. Mốc deploy

| Giờ | DB | main tới | Gồm chính |
|---|---|---|---|
| 12/11 01:47 | `pisatracking-261111` | #1478 (p.357) | mở chặn cứng · sổ nghĩa vụ · Ý thức V2 · chuông V2 · Quản trị V2 · Phân tích V2 |
| 07/11 09:37 | `pisatracking-261107` | #1174 (p.577) | audit 03/11 · Công việc chia tab · nút "?" · Báo cáo PH · Case – PA bấm thẳng |
| 30/10 23:40 | `pisatracking-261030` | `3a38444ad` (#707–#715) | 4 màn v8 · panel chuỗi view · thùng rác |
| 28/10 ~01:01 | `pisatracking-261028` | `6d2eecc6` (#642) | sửa nhỏ sau R1 |

Nguồn mốc tháng 10: `docs/superpowers/plans/2026-10-29-ban-giao-pta-dem.md` dòng 60. Mốc 27/10 (DB `261027`): giờ không thấy.

**Đã merge, chưa deploy (#1479 → #1523):** ô số Phân tích nổi (#1483 #1486 #1490) · Ý thức V3 (#1487 #1488) · Tình hình học tập (#1504 #1506 #1507) · % GV theo tuần dạy (#1505 #1509) · Tổng kết lộ trình (#1500) · Lưu trữ xếp lại (#1501) · GV cũ bổ trợ (#1514) · sửa lỗi F01–F07 (#1521 #1523).

Ngày trong `plan.md` có chỗ lệch 1–2 ngày so với git (#1475 ghi "13/11", merge 12/11 00:50). Tin số PR.

## 2. Ý đồ theo khu

### Khung chung
| Thay đổi | Ý đồ | Mockup | Phải giữ |
|---|---|---|---|
| Nút "?" (#1003–#1007, #1468–#1471) | "cần có dấu '?' ở trên thanh trên cùng của website" 05/11 (p.719) | `thiet-ke/v14/huong-dan.html` | cạnh chuông, không tự mở · 3 tab · mỗi việc một lối chính · mở chồng, không mất chữ đang gõ |
| Chuông V2 + badge (#934 #1397) | "Mở chuông tôi chỉ cần thấy công việc cần làm" 11/11 (p.303) | `thiet-ke/2026-11-11-chuong-v2/chuong-v2.html` | số chuông = badge Công việc = việc của tôi quá hạn + hôm nay (D.V13) · "Cập nhật" nhẹ ở dưới |
| Menu tài khoản gọn (#1212) | "Để đã xóa vào quản trị hệ thống nhé để đây nhìn vướng" 07/11 (p.517) | không thấy | chỉ tên · vai · lối phụ · giao diện · Đăng xuất (N32 ③) |

### Tổng quan
| Thay đổi | Ý đồ | Mockup | Phải giữ |
|---|---|---|---|
| Cả ô số bấm được (#1170) | "thay vì phải bấm vào con số" 07/11 (p.584) | không cần | cả ô = đích số chính · đổi trang thì có "›" · 0 không bấm · đích từng vai: p.587–592 |
| Bố cục v8 (#698 #937) | chủ SP 29/10: "rất ok" (`plans/2026-10-29-v8-trien-khai.md`) | `thiet-ke/v8/tong-quan.html` | trang đầu = tình hình, không form (D.V10) · ô "Việc của tôi ›" sang Công việc · Điều hướng không số |

### Công việc
| Thay đổi | Ý đồ | Mockup | Phải giữ |
|---|---|---|---|
| Chia tab + badge (#1126 #1260) | "nên chia công việc theo từng tab" 06/11 (p.762) | `thiet-ke/v17-nhap/` | thứ tự tab cố định, tab rỗng ẩn · mở vào tab đỏ đầu · Quá hạn lên trước |
| Dòng việc gọn (#934 #1047) | "ghi mỗi 'tên lớp - công việc' hết" 06/11 (p.778) | `thiet-ke/v12/cong-viec.html` | một dòng việc = 1 · hạn cột cố định · mỗi loại trường một dáng |
| Làm ở khung phải (#696 #1273) | "muốn nhập hộ thì nhập hộ luôn" 10/11 (p.493) | `thiet-ke/v8/cong-viec-ql.html` | danh sách + panel phải · "Lưu · việc tiếp ›" · QL làm thẳng việc người khác (thay N33 ③) |
| Bớt réo việc (#826 #1188) | "thiếu thì mới báo" 07/11 (p.561) | không thấy | nhắc xếp MT chỉ khi thiếu · đã huỷ / xoá thì thôi · "Bỏ qua" khôi phục được |

### Học viên & Lớp
| Thay đổi | Ý đồ | Mockup | Phải giữ |
|---|---|---|---|
| Danh sách gọn (#884 #1038) | "Không cần tên TVV ở dưới nhé" 06/11 (p.781) | `thiet-ke/v11/hoc-vien-lop.html` | lớp gập hết, tìm tên thì tự mở · 5 môn mở dưới hàng, không panel trượt (p.647) · em nghỉ không hiện (p.735) |
| Tab Lịch thi (#1061) | "không rõ là phải làm gì ấy" 06/11 (p.779) | `thiet-ke/v16/lich-thi.html` | chữ trạng thái + một dòng phụ · nút chính chỉ khi tới lúc, tối đa 1 / hàng · làm ngay dưới hàng |
| Tab Phân công GV (#714) | "dùng tối đa bề rộng" 30/10 (`2026-10-30-phan-cong-gv-design.md`) | `thiet-ke/v9/phan-cong-gv.html` | một bảng cả chi nhánh · sửa theo dòng · hiệu lực Ngay / Từ tuần · hỏi bàn giao (N29) |

### Hồ sơ lớp
| Thay đổi | Ý đồ | Mockup | Phải giữ |
|---|---|---|---|
| Đầu trang v8, ⋯ dòng (#697 #692) | khớp hình "càng gần càng tốt" 29/10 (N26) | `thiet-ke/v8/ho-so-lop.html` | Nhập điểm · + Case · ⋯ · thứ tự ⋯ dòng theo N26 · Case mở dưới hàng |
| Dải "Việc của tôi" (#1334) | "Cái khu vực CV dàn trải ở trong HS lớp này nhìn hơi rối mắt" 11/11 (p.273) | `thiet-ke/2026-11-11-mockup-1111/1-dai-viec-cua-toi.html` | một dải, mở panel tại trang, cùng nguồn Công việc |
| Tab Báo cáo PH (#1025 #1223) | "Không cần tạo hẳn task báo cáo PH đâu" 05/11 (p.743) | `thiet-ke/v15/bao-cao-ph.html` | tab cạnh Phân tích lớp · GV không có việc · điểm tự điền, sửa được · PDF mỗi em một tệp |
| Tên HV = link (#1196); lớp thường như FT (#1268) | "về bản chất cốt lõi là cần phải như vậy mà" 07/11 (p.532) | `thiet-ke/2026-11-08-hsl-thuong.html` | tên mở hồ sơ, phần còn lại của hàng mở rộng |

### Hồ sơ học viên
| Thay đổi | Ý đồ | Mockup | Phải giữ |
|---|---|---|---|
| Hai cột Tiến độ │ Case (#882) | "tôi vẫn muốn tiến độ trên lớp ở phía bên trái và case bên phải nhé" 10/11 (p.448) | `thiet-ke/v18/ho-so-hv.html` | Tiến độ luôn cột trái · mỗi Case một dòng, việc của tôi mở sẵn, Case đóng thì gập (N33 ①) |
| Sửa em lưu trữ, nút "Đổi" (#1169 #1171 #1172) | "sửa đổi được một vài thông tin của HV đã lưu trữ" 07/11 (p.597) | không cần | sửa điểm thi thật khi đã lưu trữ · "Đổi" bước tiếp tại chỗ · nhắc, không chặn |
| Lộ trình theo HV (#1329 #1350) | "Lộ trình là theo HV, KHÔNG PHẢI THEO LỚP" 11/11 (p.273) | không thấy | ô "Lộ trình đang học" ở Sửa thông tin · Hành trình có điểm lớp cũ |

### Case & phương án
| Thay đổi | Ý đồ | Mockup | Phải giữ |
|---|---|---|---|
| Bấm thẳng để sửa (#1054 #1062) | "đây là khu vực GV chạm vào nhiều nhất" 06/11 (p.782) | `thiet-ke/v16/case-pa.html` | bấm chính giá trị để sửa · không ⋯ một mục · xoá có Hoàn tác · lý do chặn tại nút · Case ↔ PA ↔ kết quả ≤ 1 bấm (N37) |
| Chuỗi view một panel (#618 #644) | chủ SP 27/10 (D.V19–V21) | `thiet-ke/v7/panel-pilot.html` | từ panel số mở Case ngay trong panel · lưu xong về Case · "Case tiếp ›" |
| Gộp bước; SOS tạm (#1308 #1366) | "các GV vẫn được phép cập nhật mô tả case" 11/11 (p.287) | không cần | sửa Case = xác nhận · ghi kết quả lần đầu = xác nhận PA (p.456) · "Theo PA quy chế" / "Giữ PA của tôi" |
| Nháp kết quả PA (#1454) | "để đến 2 tuần thì sợ quên mất" 13/11 (p.379) | không cần | "Lưu nháp" cạnh "Lưu" · chip "Có nháp" · nháp không tính xong |

### Test
| Thay đổi | Ý đồ | Mockup | Phải giữ |
|---|---|---|---|
| Luật vắng một kiểu (#928) | "nhiều nút cùng chức năng… rất khó hiểu" 05/11 (N38) | không thấy | chỉ Dời · Vắng · Bỏ khỏi đợt · vắng 2 lần = huỷ, không nhắc · "Bỏ vắng" được (p.494) |
| Nhập điểm theo tuần + lớp (#944) | "đừng bị fixated vào việc phân ra MT mấy MT mấy" 05/11 (p.692) | `thiet-ke/v11/lich-test-tuan.html` | panel chỉ em có bài (N39) · Lịch Test tuần đủ cột để xem điểm · "Mở tất cả lớp" (p.700) |
| Kế hoạch Test (#673 #1076 #1083) | "đừng để nó xóa ẩn hẳn đi nhìn rất ngứa mắt" 06/11 (p.805) | `thiet-ke/v11/ke-hoach-test.html` | ô mờ "Đã xoá · Khôi phục" · S Ex ô dẹt riêng · GV chỉ xem (N23) |
| Trang lượt; xuất (#638; G1-08 G1-11) | "Duyệt, code đi" 13/11 (p.389) | `thiet-ke/2026-11-13-test-g1/` · `thiet-ke/v7/ho-so-luot-test.html` (duyệt: không thấy) | lớp thường cùng khung FT · một nút "Xuất Excel…" · không Dán Excel điểm (p.381) |

### Ý thức & Phối hợp
| Thay đổi | Ý đồ | Mockup | Phải giữ |
|---|---|---|---|
| Ý thức V2 → V3 (#1327 #1487 #1488) | "nhìn vẫn hơi rối không biết phải thao tác như thế nào cho đúng" 11/11 (p.267) | `thiet-ke/2026-11-11-y-thuc-v2/y-thuc-v2.html` · `thiet-ke/v19/y-thuc.html` | một em một khối, em chưa xử lý lên đầu · cột cuối "Bước đang làm" · GV đọc được nội dung Báo PH · cùng kiểu ở hồ sơ lớp, hồ sơ HV, Công việc |
| Phối hợp SOS V2 (#1384 #1388) | "thấy những việc cần làm, xác nhận đã làm và báo cáo kết quả" 11/11 (p.295) | `thiet-ke/2026-11-11-phoi-hop-sos-v2/phoi-hop-sos-v2.html` | xác nhận tại dòng · TVV nhập kết quả ở Công việc · QL "làm là làm thôi" (p.301) · không nhét điểm (p.293) |
| Khai bậc cả lớp (#672 #1336) | "Chỗ này tôi vẫn thấy hơi rối và xấu một chút" 11/11 (p.273) | `thiet-ke/2026-11-11-mockup-1111/2-khai-cap-bac.html` | áp một bậc cho nhiều em · Hoàn tác cả lô |

### Tình hình học tập (chưa deploy)
| Thay đổi | Ý đồ | Mockup | Phải giữ |
|---|---|---|---|
| Gộp vào tab "Ý thức & Phối hợp" (#1506) | "Phối hợp SOS không cần phải 1 tab riêng" 12/11 (p.339) | `thiet-ke/v20/tinh-hinh.html` | hai tab nhỏ · hai chiều GV ↔ TVV · cả quá trình của em một chỗ |
| Xác nhận xử lý một form (#1507) | "không cần phải bấm vào 'đề xuất QL duyệt' nữa" 12/11 (p.341) | như trên | 4 ô chọn, mặc định Nâng 1 bậc · chọn khác thì tự vào QL duyệt 5 ngày (N1) · "Chỉ nhắc nhở" |

### Cuối khoá · chuyển lớp · bàn giao · lộ trình · lưu trữ
| Thay đổi | Ý đồ | Mockup | Phải giữ |
|---|---|---|---|
| Hộp điểm chuyển tiếp lớp thường (#1337 #1348) | "các hàng cột cần phải cân đối" 11/11 (p.277) | `thiet-ke/2026-11-11-mockup-1111/3-chuyen-tiep-lop-thuong.html` | tổng theo %, ô môn "✓ 21/25" (p.279) · Chọn tất cả · áp chung rồi sửa ngoại lệ (N17) |
| Bàn giao W1 / W2, hai phía (#869 #1016) | "Tìm cách xử lý đi nhé" 05/11 (p.735) | `thiet-ke/v11/ban-giao-w1w2.html` | một việc cho GV dạy cả hai · ô tự lưu · lớp cũ "Mở phiếu", lớp mới "Đọc bàn giao" |
| Lưu trữ; tổng kết (#1205 #1500) | "sau 1 tuần sẽ tự động bị đưa vào lưu trữ" 07/11 (p.527) | không thấy | một nút "Tạm dừng/ Kết thúc học" (N11) · lớp trống tự lưu trữ, mở lại được · tổng kết đủ 5 kỹ năng |

### Phân tích
| Thay đổi | Ý đồ | Mockup | Phải giữ |
|---|---|---|---|
| V2: 5 tab (#1408–#1416) | "các con số không nên trùng nhau" 12/11 (p.425) | `thiet-ke/2026-11-12-phan-tich-v2/phan-tich-v2.html` | Chi nhánh · Thi thật · SOS · Giáo viên · Ý thức · số to để trình chiếu · bấm một lần ra panel (p.415) |
| Ô số nổi (#1486 #1490) | "các con số ở đây đang bị chìm" (`2026-11-12-phan-tich-y-thuc/de-bai.md`) | `thiet-ke/v19/phan-tich.html` | hộp = bấm được, màu = cần làm · số to không hộp (p.347) |
| Panel có điểm (#976–#986) | "khi bấm vào số liệu thì ra panels rỗng" 05/11 (p.700) | `thiet-ke/v13/phan-tich-thi-that.html` · `thiet-ke/v10/panel-thong-tin.html` | không panel chỉ có tên · dòng cho thấy lý do (N30) |
| Sổ nghĩa vụ; % GV (#1292 #1505) | "ai là người làm tốt, ai là người KHÔNG LÀM" 09/11 (p.490) | `thiet-ke/v20/ti-le-gv.html` | Đúng hạn · Làm muộn · Chưa làm · bấm điểm thi thật ra tuần dạy theo GV |

### Quản trị
| Thay đổi | Ý đồ | Mockup | Phải giữ |
|---|---|---|---|
| Quản trị V2, Case & SOS (#1379–#1409) | "không làm hẳn 1 tab cho quản trị, vẫn ở vị trí cũ" 12/11 (p.307) | `thiet-ke/2026-11-11-quan-tri-v2/quan-tri-v2.html` (tham chiếu) | danh sách → sửa tại dòng → nhật ký · lưu có Hoàn tác · mục đang dùng chỉ Ẩn · QL chỉ xem · quyền là công tắc |

### Hồ sơ GV
| Thay đổi | Ý đồ | Mockup | Phải giữ |
|---|---|---|---|
| GVCN + kỹ năng về đây; số việc theo sổ nghĩa vụ (N32 ③, #1292) | "xem ở hồ sơ GV nhé" 09/11 (p.490) | không thấy | cùng số với Phân tích GV · chỉ QL / Quản trị sửa kỹ năng (p.444) · "Em đang bổ trợ" (#1514) |

## 3. Ngôn ngữ thao tác đã thành chuẩn

- **Lưu ở lại** "✓ Đã lưu"; "Lưu · bài tiếp ›" / "· việc tiếp ›" / "· em tiếp ›" / "· đóng" — D.V12.
- **Hoàn tác 10 giây + khôi phục có lịch sử**; chỉ hỏi lại khi hậu quả lớn — D.G5, N3, N24.
- **Không chặn cứng:** không hoàn tác được thì đi thẳng trạng thái mới; QL / Admin vượt khoá có xác nhận — 07/11 (p.540, p.543).
- **Một panel một lúc**; ‹ lùi một view, ✕ đóng cả panel; nháp theo người + Case + view — D.V11, D.V19.
- **Một danh sách một kiểu mở:** có khung phải thì mở khung phải; bảng rộng thì mở dưới hàng — D.G4.
- **Ô số bấm một lần ra đúng danh sách**; số trên ô = số dòng panel; 0 không bấm — D.G6, D.G7.
- **Tên HV / mã lớp = link**; "›" = đổi trang; ⓘ = giải thích; không ↗ — D.G6, #1196.
- **Hạn = ngày thật**; một chữ "Quá hạn" — D.V8, p.770.
- **Tab hạng mục + badge** (số + màu); một dòng việc = 1 — p.762–763, D.V13.
- **Thùng rác 30 ngày**; xoá để lại "Đã xoá · Khôi phục" — N28, p.805.
- **Bấm lưu là lưu**; nháp là nút riêng — 13/11 (p.377, p.379).
- **Bấm thẳng thứ đang thấy để sửa**; không ⋯ một mục; lý do chặn tại nút — `thiet-ke/v16/case-pa-ghi-chu.md`.
- **Bỏ chú thích tĩnh → ⓘ**; giữ lưu ý cần thiết — D.V6, 07/11 (p.550, p.555).
- **Mặc định đúng quy chế**; chọn khác thì tự vào QL duyệt có hạn — N1, #1366.
- **375:** đang gõ thì ẩn thanh tab dưới — p.371.

## 4. Chủ SP khen gì · còn chê gì

**Khen:**
- 03/11: "làm tốt hơn nhiều, màu sắc và các nút nổi bật dễ nhìn" (p.830).
- 06/11, chia tab: "Được đấy, cố gắng giữ vững về mặt hình ảnh khi code nhé" (p.764).
- 12/11, mockup v20: "mockup làm khá đẹp, hãy cố gắng theo sát về mặt hình ảnh" (p.337).
- 13/11: "luật và logic thì khá ok" (`loi-chu-sp.md` lời 5).

**Còn chê:**
- 13/11: "họ không biết thao tác ở đâu như thế nào, cần phải làm gì, nhập điểm chỗ nào" (`loi-chu-sp.md` lời 4).
- 05/11: "quá ngợp, dàn trải, nhiều chữ, không phân biệt được các trường thông tin" (`2026-11-05-mat-do-thong-tin/de-xuat.md` dòng 8).
- 11/11: "trường thông tin khác nhau, nhưng nhìn y như nhau, rất khó chịu" (p.295).
- 04/11: "về mặt hình ảnh làm ơn cứ làm giống mockup" (p.655).
- 13/11: "tôi vẫn đang thấy navigate phần này hơi phức tạp" (p.329).

## 5. Hướng đã thử và bị bác

- Công việc thành bảng rộng, mỗi việc một dòng — 05/11: "thà như cũ còn hơn, cải thiện cái cũ thôi" (`2026-11-05-mat-do-thong-tin/de-xuat.md` dòng 14).
- Công việc bỏ khung trống khi chưa chọn việc — 07/11: "Giữ như cũ" (p.505).
- Khung / tab Quản trị mới — 12/11 (p.307).
- Việc "Báo cáo PH" cho GV — 05/11 (p.743).
- Tab riêng cho Phối hợp SOS — 12/11 (p.339).
- "Tuần nghỉ" của lớp — 06/11: "phức tạp hóa lên" (p.804).
- Khối "Đang xử lý" ở hồ sơ HV — 04/11: "xấu quá" (p.664).
- Thanh 4 nấc ở Lịch thi — 06/11: "Bỏ thanh" (p.814).
- Nhắc "xếp lại" MT đã huỷ — 05/11: "hủy là hủy thôi" (p.825).
- Tuần dạy trong bảng Theo GV — 12/11: "rất vô bổ" (p.409).
- Gộp Tổng quan GV — 13/11: "Không cần đổi tổng quan nữa" (p.397); lời 2 cùng ngày mở lại.

## 6. Việc giao diện còn dở / để sau

- Tab Ý thức hồ sơ HV chưa đồng bộ kiểu tab lớp (p.349).
- Ô số dạng hộp chưa áp Tổng quan, hồ sơ lớp (p.349).
- Tên ở đầu panel chưa là link (p.534).
- Luật mật độ M1–M10 mới áp vài màn (p.685).
- Ghi vi phạm nhiều kỹ năng: chờ chủ SP (p.277).
- GV cũ bổ trợ mới xong PR-1 (#1514).
- Tutor, điểm thi KET / PET: hoãn (p.438).
