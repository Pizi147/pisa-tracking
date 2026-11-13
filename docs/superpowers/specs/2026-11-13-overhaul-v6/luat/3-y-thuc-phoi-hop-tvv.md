# Luật 3 — Ý thức · Tình hình học tập · Báo PH · việc TVV

Hiện trạng mã 13/11 (có #1502 #1504 #1506 #1507). VP = vi phạm · XL = lần xử lý.
Tệp: `xuLy` `violations` `baoPhTvv` `tinhHinh` `trangThai` `phoiHop` `board` `access` `lo` ở `server/src/yThuc/` · `luat` = `shared/domain/yThuc.ts` · `mywork` = `server/src/worklist/mywork.ts` · `the` = `server/src/duyet/loaiYeuCau.ts`.

## 1. Luật core

Cột cuối để trống = khớp mã.

| Mã | Luật | Nguồn | Mã thực thi | Lệch |
|---|---|---|---|---|
| Y-01 | Ghi VP: mọi GV dạy lớp, QL. Xử lý: chỉ GVCN lớp em đang học, QL. Sửa / xoá VP: người ghi, GVCN, QL. | Rulebook §20.3, §20.9 | `access:47-73` | |
| Y-02 | 5 nhóm: Chuyên cần · BTVN · Thái độ / hành vi · Kỷ luật lớp học · Khác. Bắt buộc Nhóm, tên VP; Môn khi GV dạy ≥ 2 môn. Một em ≤ 10 VP, hoặc ≤ 60 em một VP. | §20.3; chủ SP 06/10, 13/11 | `luat:34-87`, `violations:204,316` | §20.3: mô tả bắt buộc; mã: tuỳ chọn |
| Y-03 | "Chỉ nhắc nhở": ngoài luật 3 VP, bậc, việc, chuông, TVV. Sửa VP đổi lại được. | de-bai 5b | `violations:301,437` | |
| Y-04 | VP người khác ghi: GVCN "Đã xem" hoặc xử lý trong 5 ngày, tính cả ngày ghi. GVCN tự ghi thì tự "Đã xem". "Đã xem" vẫn đếm. | §20.3; N34 ④ | `luat:257-283`, `xuLy:107` | |
| Y-05 | Bắt buộc xử lý: ≥ 3 VP chưa xử lý từ thứ Hai tuần trước. Hạn 5 ngày từ ngày ghi VP thứ 3. Lúc đó không "Đã xem" được. | §20.3 | `luat:230-243`, `xuLy:113` | |
| Y-06 | Thang: Report 1 → Report 2 → WL 1 → Report 4 + Meeting CX/GĐCN → Report 5 → WL 2 → Report 7, 8… Ngoài thang, không đẩy bậc: WL 3 · Meeting CX/GĐCN · Đình chỉ · Khác. | §20.3 | `luat:136-148` | |
| Y-07 | Bậc hiện tại = cao nhất của XL đã xong và bậc khai. Mặc định = bậc + 1. | §20.3 | `luat:307,323`, `xuLy:196` | |
| Y-08 | Nâng 1 bậc (mặc định): xong ngay, TVV nhận việc ngay. Không nâng · Vượt bậc · Ngoài thang: vào hộp duyệt QL, TVV chưa có việc. | N1 (12/11) | `xuLy:185-218,556-638` | |
| Y-09 | QL có 5 ngày. Duyệt, hoặc hết hạn máy chốt theo GVCN → TVV nhận việc, GVCN "Ghi Đã thực hiện". Từ chối → VP về Cần xử lý. | N1 (12/11) | `xuLy:994-1023`, `the:515-585` | mục 6 #5 |
| Y-10 | Mô tả / lý do 10–300 ký tự. Tệp bắt buộc chỉ với Ngoài thang. | §21.1 L5 | `xuLy:38,606` | |
| Y-11 | Thu hồi XL: lý do bắt buộc; GVCN gửi QL, QL làm thẳng. Giữ dòng "Đã thu hồi", bậc tính lại; TVV đã báo → việc "Báo lại PH". | N5 | `xuLy:771-819`, `baoPhTvv:72` | mục 6 #1 |
| Y-12 | Khai bậc HV cũ: một lần mỗi chuỗi, bậc 0 … WL 2. | §20.3 | `xuLy:222-288` | |
| Y-13 | Lớp thường → lớp thường / FT: giữ bậc, trừ khi chọn "Reset bậc". Từ FT đi, hoặc nghỉ rồi quay lại: chuỗi mới. | N36 | `luat:291-304`, `classes/lenhChuyen.ts:883` | |
| Y-14 | Việc TVV "Báo PH": 5 ngày lịch = ngày lưu + 4. Sửa hạn: TVV, GVCN, QL. | N2; N34 | `shared/domain/baoPhTvv.ts:15`, `baoPhTvv:145` | |
| Y-15 | TVV ghi "Đã báo PH" / "Chưa liên hệ được" + ngày + Nội dung bắt buộc; GV của lớp đọc được. | chủ SP 11/11 | `baoPhTvv:251-297`, `board:212` | |
| Y-16 | Việc TVV do TVV của em giữ; không có → QL chi nhánh. | N6 | `baoPhTvv:44,140` | mục 6 #8 |
| Y-17 | GV dạy em / QL "Báo tình hình" → TVV báo PH, 5 ngày. ≤ 8 em một lần, không phân loại. | de-bai 5a | `tinhHinh:31,78` | |
| Y-18 | TVV / QL "Hỏi tình hình" từng em → GVCN trả lời, 3 ngày tính cả ngày hỏi. Web không theo dõi tiếp. | de-bai 5e | `tinhHinh:28,183` | |
| Y-19 | Phối hợp SOS: GVCN làm. TVV chỉ báo kết quả sau khi GVCN xác nhận Meeting CX/GĐCN, 5 ngày. | chủ SP 11/11 | `phoiHop:359` | |
| Y-20 | Báo PH kết quả Test lớp thường có môn trượt: GVCN, không hạn; Final < 50 %: QL. | N6 | `mywork:1302` | |
| Y-21 | Báo cáo PH: FT mỗi tháng (mở ngày 20, hạn 30); lớp thường tuần Progress / Final. GV viết phần mình, GVCN phần Chung. | chủ SP 05–06/11; #1502 | `shared/domain/baoCaoPh.ts:141`, `classes/baoCaoPh.ts:36` | |

## 2. Vòng đời

**(a) Vi phạm**
```
GV ghi VP ("Chỉ nhắc nhở" → dừng)
 → GVCN "Đã xem" hoặc Xác nhận xử lý · 5 ngày từ ngày ghi
 → đủ 3 VP / 2 tuần: GVCN buộc xử lý · 5 ngày từ VP thứ 3 · quá hạn: thẻ báo QL
 → Nâng 1 bậc: xong ngay → TVV báo PH · ngày lưu + 4
 → Cách khác: QL duyệt · 5 ngày · hết hạn máy tự chốt
     Từ chối → VP về Cần xử lý
     Chốt → cùng lúc: TVV báo PH · ngày chốt + 4 | GVCN "Ghi Đã thực hiện" · ngày chốt + 4
 → TVV ghi Nội dung → GV đọc ở tab Ý thức
```
Đường QL duyệt: bậc chỉ lên sau khi GVCN ghi "Đã thực hiện". Meeting CX/GĐCN có PH dự: GVCN ghi "Đã thực hiện" thì việc TVV tự xong.

**(b) Tình hình học tập**
```
GV / QL "Báo tình hình" → TVV báo PH · 5 ngày → ghi Nội dung → chuông người gửi
TVV / QL "Hỏi tình hình" → GVCN (không có → QL) ghi Kết quả · 3 ngày → chuông người hỏi
```
Sửa / Rút: người gửi hoặc QL, khi chưa có kết quả. Hoàn tác trong 2 phút. GVCN sửa kết quả được.

## 3. Việc sinh ra

GV bộ môn không có việc ở mảng này: ghi VP, Báo tình hình, viết Báo cáo PH đều tự chủ động.

| Việc (khoá · tên web) | Ai | Sinh khi | Hạn | Xong khi | Lưu xong |
|---|---|---|---|---|---|
| `yt_xem` · Xem vi phạm mới | GVCN | người khác ghi VP | ngày ghi + 4 | Đã xem / xử lý | — |
| `yt_xu_ly` · Xử lý vi phạm | GVCN | đủ 3 VP, hoặc QL từ chối | ngày ghi VP thứ 3 + 4 | lưu XL / gửi QL | Y-08 |
| `yt_thuc_hien` · Ghi "Đã thực hiện" | GVCN | QL duyệt / tự chốt | ngày chốt + 4 | ghi ngày thực hiện | bậc được tính |
| `khai_bac` · Xác nhận cấp bậc vi phạm HV cũ | GVCN | em mới vào web ≤ 14 ngày | không | khai, hoặc qua 14 ngày | — |
| `yt_hoi_tinh_hinh` · Tình hình học tập | GVCN | TVV hỏi | ngày hỏi + 2 | ghi Kết quả | chuông TVV |
| `phoi_hop_sos` · Phối hợp SOS | GVCN | lượt Mock có SOS | chỉ Meeting CX: 5 ngày | xác nhận từng em | Meeting → việc TVV |
| `phoi_hop` · Báo PH kết quả Test | GVCN | Y-20 | không | đánh dấu đã làm | — |
| `bao_ph_yt` · Báo PH vi phạm | TVV | XL mặc định · chốt thẻ · thu hồi sau khi đã báo · GV báo tình hình | ngày sinh + 4, sửa được | "Đã báo PH" | GV đọc Nội dung |
| `phoi_hop_tvv` · Báo PH · Meeting CX/GĐCN | TVV (không có → GVCN) | GVCN xác nhận Meeting | ngày xác nhận + 4 | Đã báo PH | — |
| `missing_data` · Chốt ngày thi | TVV | em FT tới tháng thi, chưa có ngày | không | có ngày | — |
| `thi_that` · Cập nhật kết quả thi thật | TVV | hôm sau ngày thi | không | đủ 4 kỹ năng / Không thi | sinh Chọn bước tiếp |
| `buoc_tiep` · Chọn bước tiếp | TVV | có kết quả thi thật | muộn hơn của ngày thi + 7 và ngày có kết quả + 7 | chọn bước | lộ trình đóng |
| `bo_sung_ho_so` · Bổ sung hồ sơ thiếu | TVV | thiếu Ngày sinh · Email · Tuần bắt đầu · Target FT | không | đủ trường | — |
| thẻ `y_thuc` · Xử lý Ý thức | QL | GVCN chọn khác mặc định | ngày gửi + 4, rồi tự chốt | Duyệt / Từ chối có lý do | Y-09 |
| thẻ `thu_hoi_y_thuc` | QL | GVCN xin thu hồi | 5 ngày, không tự chốt | Duyệt / Từ chối | bậc tính lại |
| thẻ `bao_len_y_thuc` · Ý thức quá hạn | QL, để biết | Xử lý / Đã thực hiện quá hạn | không | tự đóng | — |
| `xuat_bc_ph` · Xuất báo cáo PH | Admin chi nhánh | lớp đủ báo cáo, hoặc đợt quá hạn còn thiếu | hiện 7 ngày | tự rời | — |

Làm thay: QL làm được mọi việc của GVCN và TVV; TVV cùng chi nhánh: Báo PH, Chọn bước tiếp. QL, TVV cũng xuất Báo cáo PH (Excel, PDF).
Nguồn: `mywork:1297-1343,1413-1427,1516-1607`, `baoPhTvv:409`, `tinhHinh:252`, `worklist/viecTvv.ts:63`, `loTrinh/buocTiep.ts:549`, `loTrinh/thiThat.ts:260`.

**Chuông.** "Cần làm" = chính danh sách việc của mình. Thêm tin: GVCN — VP mới, em thành bắt buộc, QL duyệt / tự chốt, TVV hỏi. QL — GVCN xử lý WL 1 / Report 4 + Meeting / WL 2. Người gửi tình hình — khi có kết quả.

## 4. Người làm cần thấy gì ngay tại chỗ làm

- **Ghi VP (GV):** em, ngày, Nhóm, tên VP, Môn. Chọn Vi phạm (mặc định) | Chỉ nhắc nhở. Vi phạm → GVCN nhận việc xem, đủ 3 thì buộc xử lý. Nhắc nhở → không ai nhận việc.
- **Xem VP mới (GVCN):** VP, người ghi, môn, hạn; số VP chưa xử lý trong 2 tuần. Nút: Đã xem · Xác nhận xử lý.
- **Xác nhận xử lý (GVCN):** mốc hiện tại → bậc kế; VP đưa vào (tick sẵn); tên TVV. Mặc định Nâng 1 bậc → TVV nhận việc báo PH, hạn …. Cách khác → QL duyệt 5 ngày, hết hạn giữ quyết định của GVCN; TVV chưa có việc; sau chốt ghi Đã thực hiện. Ngoài thang cần tệp.
- **Ghi "Đã thực hiện" (GVCN):** bậc đã chốt, hạn, ngày thực hiện. Meeting: ô "PH dự" (mặc định có) → TVV khỏi báo.
- **Duyệt (QL):** cách GVCN chọn, bậc kế theo thang, VP + bằng chứng, lý do, còn mấy ngày trước khi tự chốt.
- **Thu hồi:** bậc sẽ về đâu; TVV đã báo PH chưa (ô "Nhờ TVV báo lại PH").
- **Báo PH (TVV):** bậc hoặc "Tình hình học tập"; VP + ghi chú GVCN, hoặc nội dung GV báo; liên hệ PH; hạn + Sửa hạn; các lần thử trước. Chọn Đã báo PH (xong) | Chưa liên hệ được (việc còn mở). Một ô Nội dung.
- **GV đọc kết quả:** dòng TVV trong khối em: kết quả, ngày, Nội dung.
- **Dưới tên em:** mốc VIẾT HOA ("REPORT 1", "WARNING LETTER 1"); có VP chưa tới mốc: "Chưa có mốc"; không có: "Chưa có vi phạm".

## 5. Khi nào KHÔNG có việc

- "Chỉ nhắc nhở".
- GVCN tự ghi VP, hoặc VP "Đã xem", khi chưa đủ 3 VP / 2 tuần.
- Thẻ đang chờ QL: GVCN không có việc xử lý, TVV chưa có việc. QL từ chối: không việc TVV.
- Em Tạm dừng: không việc Ý thức, không hạn; việc Báo PH ẩn.
- Lớp chưa có GVCN: không sinh việc `yt_*`.
- Khai bậc, Đã xem: không sinh việc TVV. GVCN trả lời TVV xong: không sinh việc Báo PH.
- Báo cáo PH: GV không có việc.
- VP Mới quá 5 ngày chưa xem: đỏ ở GVCN, không báo QL (`the:42`).

## 6. Chỗ tài liệu và mã lệch nhau / chưa rõ

1. N5 (plan.md 1.6) "không Hoàn tác sau lưu xử lý" ↔ mã có Hoàn tác: toast 10 s, máy chủ nhận 60 s (`xuLy:919`, [XM 5] PTA 11/11).
2. Rulebook §21.1 L1 "sinh việc TVV kể cả đang chờ QL" ↔ N1 12/11 + mã: sinh khi chốt.
3. Rulebook L1: TVV "Kết thúc · không liên hệ được" ↔ mã: "Chưa liên hệ được" là một lần thử, việc còn mở.
4. TVV báo PH vi phạm xong: GVCN không có chuông ↔ tình hình học tập có (`baoPhTvv:284-290`). Chưa rõ có chủ ý.
5. Hạn QL duyệt: web tính cứng 5 ngày (`web/src/modules/yThuc/XacNhanXuLyPanel.tsx:244`) ↔ máy chủ theo Hạn mặc định "QL trả lời Chờ duyệt" (`shared/domain/yeuCauDuyet.ts:85`).
6. Bậc chỉ lên khi GVCN ghi "Đã thực hiện" (`trangThai:179`), sau khi TVV đã nhận việc. Tài liệu không nói.
7. `dac-ta.md`: Hoàn tác tình hình 10 s ↔ máy chủ 2 phút (`tinhHinh:30`).
8. N6 "không có TVV → QL" ↔ việc sau Meeting CX: GVCN giữ (`baoPhTvv:142,446`, PTA chốt 11/11).
9. Thiếu Target FT: vừa là việc GVCN "Điền Target" (`mywork:1381-1407`), vừa trong "Bổ sung hồ sơ thiếu" của TVV (`viecTvv.ts:122`).
10. Thu hồi hết 5 ngày không tự chốt, khác thẻ xử lý (XM-5). Xử lý nhiều em một lúc (`lo`) chỉ có Nâng 1 bậc.
11. Chưa kiểm: QL tự gửi cách khác mặc định có tự duyệt không.
