# Luật SOS · Case · PA · Phối hợp SOS (hiện trạng 13/11)

Hiện trạng theo tài liệu + mã; không đề xuất đổi luật. `sd/` = `shared/domain/`, `ss/` = `server/src/`, `cases.ts` = `ss/cases/cases.ts`. Số ngày là bản gốc; Quản trị sửa được.

## 1. Luật core

| Mã | Luật | Nguồn | Mã thực thi | Khớp mã? |
|---|---|---|---|---|
| C-01 | Kỳ vọng FT: MT1 = Target − 1.0, MT2 = Target − 0.5, MT3+ và RF = Target. SOS = số kỹ năng L R W S dưới kỳ vọng (1, 2, từ 3 = SOS 3). Overall ≥ kỳ vọng: không SOS. | Rulebook §3.2 | `sd/bandNguong.ts:13`, `ss/fasttrack/scoring.ts:221-250` | Khớp |
| C-02 | SOS tạm = lượt chưa đủ điểm. Máy tự chốt khi đủ điểm, hoặc phần thiếu đã dời / huỷ / vắng. | Rulebook §20.16 | `scoring.ts:231` | Khớp |
| C-03 | SOS tạm: mỗi kỹ năng dưới kỳ vọng có Case tạm. GV ghi mô tả, thêm PA, ghi kết quả được. Không hạn, việc, chuông, số đếm. | plan.md 11/11 (#1366) | `ss/cases/sos.ts:731-811`, `sosState.ts:22,44` | Khớp; N8 ④ còn chữ cũ |
| C-04 | Hết SOS lúc còn tạm: Case có PA → giữ; chỉ có mô tả riêng / tệp → đóng; còn lại → xoá. | đặc tả sos-tam-pa 3.3 | `sos.ts:762-793` | Khớp |
| C-05 | Chốt còn SOS: mỗi kỹ năng một Case thật (W1, W2 tách), theo em qua nhiều MT. Máy sinh PA quy chế chờ xác nhận + việc Phối hợp. | Rulebook §19; N8 ② | `sos.ts:419-548` | Khớp |
| C-06 | Lớp thường: Progress môn < 70 % → Case + PA Bổ trợ ngay, nhãn SOS theo số môn trượt. Final không sinh Case SOS. | Rulebook §20.6, §20.17 | `ss/normal/regular.ts:1063-1146` | Khớp |
| C-07 | Phụ trách Case = GV dạy kỹ năng đó ở lớp em; chưa có → GVCN. Đổi GV / chuyển lớp: Case + PA mở sang GV mới; chuyển lớp thì hạn tính lại. | N29; chủ SP 10/11 | `ss/cases/owner.ts:26-43,105,376` | Khớp |
| C-08 | Mô tả Case MT = nhận xét MT, tới khi có người sửa riêng. Không nhận xét → việc "Mô tả Case". S chấm chéo → GV phụ trách S xác nhận. | N8 ②③⑤ | `ss/cases/nguyenNhanO.ts:19`, `cases.ts:1525` | Khớp |
| C-09 | "+ Case" tay: kỹ năng, nhóm nguyên nhân, mô tả 8–300 ký tự, mức độ (Bình thường / Gấp), tên (web tự sinh). | N35; plan.md 12/11 | `cases.ts:546-680` | Khớp |
| C-10 | Hạn Mô tả Case, Xác nhận PA, Thêm PA: 5 ngày tính cả ngày đầu; Gấp / SOS 3: 3 ngày. | chủ SP 08/10 (plan.md:1035) | `sd/cases.ts:856` | Lệch Rulebook §20.2 |
| C-11 | PA quy chế FT: MT1–2 SOS 1–2 Tự học 1 tháng; MT1–2 SOS 3 Tutor đến MT kế; MT3+ và RF Tutor đến lúc thi. | Rulebook §19 | `sd/sos.ts:59` | Khớp |
| C-12 | Loại PA: GV tự làm (Tự học, Tutor, Điều chỉnh cách dạy, Tăng cường bài tập); cần QL duyệt (Hỗ trợ học thuật, Khác); máy tạo (Bổ trợ, Bổ trợ miễn phí). Nội dung 8–200 ký tự. | Rulebook §5; N35 | `sd/cases.ts:620-677` | Khớp |
| C-13 | Chốt SOS khi GV đã có PA: cùng loại → giữ, không việc; khác loại → "Chọn PA". "Giữ PA của tôi" → QL 3 ngày; duyệt / quá hạn → theo GV; không duyệt → PA quy chế chạy ngay. | chủ SP 11/11 | `ss/cases/sosAuto.ts:157-279` | Khớp |
| C-14 | Ghi kết quả PA 2 tuần một lần, hết Thứ Ba. Ô: Tiến triển (5 mức), Nhận xét 8–200, Số buổi (Tutor, Tự học), Quyết định. | OV-12a 14/10; N35 | `sd/week.ts:42`, `cases.ts:3918` | Lệch Rulebook §20.1 dòng 1 |
| C-15 | Quyết định: Giữ nguyên · Điều chỉnh · Thay PA · Kết thúc PA · Xin hỗ trợ QL. Kết quả chưa tốt không kết thúc suông. PA quy chế: GV không thay, không kết thúc sớm. | OV-12e; RKC-2c | `sd/cases.ts:986-1066`, `cases.ts:4042` | Khớp |
| C-16 | "Lưu nháp" không tính xong. "Lưu" = chốt, không Hoàn tác; đổi thì bấm Sửa. | chủ SP 13/11 | `cases.ts:4304`, `CapNhatTuan.tsx:337` | Khớp |
| C-17 | PA quy chế chạm mốc, hoặc kỹ năng đạt ở MT sau → lần ghi tới là "Kết quả cuối". GVCN / QL có "Kết thúc sớm…". | Rulebook §20.16 | `sd/sosV4.ts:64`, `sosAuto.ts:631`, `cases.ts:1734` | Khớp |
| C-18 | Hoàn thành Case: mức + kết luận ≥ 8 ký tự. Còn PA mở → hỏi, đồng ý thì PA dừng. Mở lại được. | RKC-2a 07/11 | `cases.ts:188-314` | Lệch nhẹ (mục 6) |
| C-19 | "Không cần theo dõi" → QL duyệt 5 ngày; duyệt thì Case đóng, PA huỷ. Xoá Case / PA → Thùng rác 30 ngày; Case từ Test, PA quy chế: GV xin, QL duyệt. | Rulebook §20.1 dòng 5; N37, N28 | `sosAuto.ts:968`, `cases.ts:1360` | Khớp |
| C-20 | Bổ trợ miễn phí sau Final: người dạy = GV cũ, giữ việc cả khi em chuyển lớp. Lần cuối = Mini Test: ≥ 70 % Case tự hoàn thành; < 70 % → QL. | Rulebook §20.6; đặc tả gv-cu-bo-tro | `ss/cases/giuKetQua.ts:37`, `ss/normal/cuoiKhoa.ts:682` | Khớp |
| C-21 | Phối hợp SOS: GVCN làm, QL làm thẳng. Chỉ Meeting CX/GĐCN có hạn. GVCN xác nhận Meeting → TVV báo gia đình, ghi kết quả. | chủ SP 11/11 | `sd/sos.ts:229`, `ss/yThuc/phoiHop.ts:359,678` | Khớp |
| C-22 | Lộ trình mới, bỏ môn: máy đóng Case, PA dừng. Em Tạm dừng: việc ẩn, hạn dừng. | N11–N13 | `ss/cases/systemClose.ts:62-121` | Khớp |
| C-23 | Hiệu quả PA: mỗi PA đã khép tính một lần; "Chưa đủ dữ liệu", PA huỷ: không tính. | Rulebook §5, §11 | `ss/cases/effectiveness.ts:18-36` | Khớp |

**Việc Phối hợp theo mốc (bản gốc):** SOS 1: Trao đổi ngắn với HV + Trao đổi với gia đình. SOS 2: gia đình; từ MT2 thêm GVCN meeting. SOS 3: gia đình + GVCN meeting; MT2, MT4+ thêm Meeting CX/GĐCN · HV; MT3 thêm Meeting CX/GĐCN · HV / PH. Lớp thường: "Báo PH kết quả Test" khi Progress có môn trượt, hoặc Final phải học lại.

## 2. Vòng đời

```
Điểm MT (GV chấm)
 ├ chưa đủ điểm → SOS tạm + Case tạm · GV ghi mô tả / PA nếu muốn · không hạn
 ├ đủ điểm, hết SOS → Case tạm xoá / đóng / giữ (C-04)
 └ đủ điểm, còn SOS (máy chốt) → Case thật + PA quy chế chờ + việc Phối hợp (GVCN)
     → Mô tả Case (khi thiếu) → Xác nhận PA / Chọn PA · GV phụ trách · 5 ngày từ ngày chốt (SOS 3: 3)
         ├ Giữ PA của tôi → QL · 3 ngày · quá hạn theo GV
         └ Không cần theo dõi → QL · 5 ngày
     → PA chạy → Ghi kết quả từng kỳ · người giữ việc · 2 tuần, hết Thứ Ba
     → chạm mốc / đạt ở MT sau → Kết quả cuối · PA khép
     → Hoàn thành Case · GV phụ trách hoặc QL · không hạn
```

Case tay và Progress lớp thường: xem `no_plan`, `cause` ở mục 3.

## 3. Việc sinh ra (`ss/worklist/mywork.ts:205-293, 868-1373`)

| Việc | Ai làm | Sinh khi | Hạn | Xong khi | Lưu xong thì | Làm thay |
|---|---|---|---|---|---|---|
| `ghi_nhan_xet` Mô tả Case | GV phụ trách | Lượt chốt, ô không nhận xét | Hạn SOS (C-10) | Có mô tả + nhóm | Sang Xác nhận PA | QL |
| `xem_nx_s` Xác nhận Case Speaking | GV phụ trách S | Người chấm chéo ghi nhận xét S | Hạn SOS | Chọn dùng / giữ / viết khác | Việc hết | GVCN, QL |
| `cause` Xác nhận Case | GV dạy môn | Progress môn < 70 % | 5 ngày | Chọn nhóm + mô tả | PA Bổ trợ chạy; quá hạn → thẻ Báo lên QL | GVCN, QL |
| `xac_nhan_pa` Xác nhận PA / Chọn PA | GV phụ trách | Case có mô tả, PA quy chế chờ | Hạn SOS | Xác nhận, hoặc chọn một trong hai | PA chạy từ hôm đó; "Giữ" → thẻ QL | QL |
| `no_plan` Thêm PA | GV phụ trách | Case tay chưa có PA | 5 ngày (Gấp 3) | Có một PA | PA chạy; loại cần duyệt → thẻ QL | QL |
| `ghi_ket_qua_pa` Ghi kết quả PA / Kết quả cuối | GV môn lớp hiện tại; Bổ trợ chung: GVCN; Bổ trợ miễn phí: người dạy | PA đang chạy; hiện từ Chủ nhật trước hạn | Thứ Ba sau kỳ | Bấm Lưu (nháp không tính) | Hạn kỳ kế, hoặc PA khép; Xin hỗ trợ → thẻ QL | QL; GVCN (Bổ trợ) |
| `mini_test` Ghi Mini Test | Người dạy bổ trợ (GV cũ) | Có PA Bổ trợ miễn phí | Chủ nhật tuần cuối + 2 ngày | Có % và ngày | ≥ 70 %: Case hoàn thành; < 70 %: QL | GVCN lớp mới, QL |
| `phoi_hop_sos` Phối hợp SOS (mỗi lớp × việc một dòng) | GVCN | Lượt chốt có SOS | Không; Meeting: ngày tạo + 5 | Xác nhận (ngày + Nội dung) hoặc Bỏ (lý do) | Em rời dòng; Meeting → việc TVV | QL |
| `phoi_hop_tvv` Báo PH · Meeting CX/GĐCN | TVV của em; không có → GVCN | GVCN xác nhận Meeting | 5 ngày | "Đã báo" + Nội dung ≥ 10 ký tự | Kết quả hiện ở tab Phối hợp | TVV cùng chi nhánh, QL |
| `phoi_hop` Báo PH kết quả Test | GVCN (Final: QL) | Progress có môn trượt; Final học lại | Không | Đánh dấu đã làm | — | QL |
| `no_owner` Chưa có người phụ trách | QL | Lớp chưa có GV môn, GVCN | Không | Phân công | Case về GV | — |

Thẻ QL: PA khác quy chế 3 ngày (quá hạn tự duyệt); thẻ khác 5 ngày.

## 4. Người làm cần thấy gì ngay tại chỗ làm

- **Mô tả Case:** kỹ năng, MT, band so kỳ vọng, mức SOS, hạn; nhận xét MT nếu có.
- **Xác nhận PA:** mô tả Case; PA quy chế + mốc; người dạy gợi ý; Số buổi (Tutor bắt buộc); bắt đầu = hôm nay. Mặc định: xác nhận. Khác: "Không cần theo dõi" → chờ QL 5 ngày.
- **Chọn PA:** hai PA cạnh nhau. Mặc định "Theo PA quy chế": PA của tôi dừng, kết quả giữ. "Giữ PA của tôi": PA vẫn chạy, QL có 3 ngày (C-13).
- **Ghi kết quả PA:** PA, kỳ, hạn, kết quả kỳ trước, nháp, mốc PA. Mặc định Giữ nguyên. Điều chỉnh / Thay cần lý do. Kết thúc chỉ khi Tiến bộ rõ / một phần. Xin hỗ trợ QL: PA vẫn chạy. PA cuối có ô "Hoàn thành Case".
- **Kết quả cuối:** không chọn quyết định; Bổ trợ miễn phí phải nhập Mini Test.
- **Hoàn thành Case:** kết quả gần nhất từng PA; kết luận điền sẵn; còn PA mở thì báo PA sẽ dừng.
- **Phối hợp SOS:** em, MT, mức SOS; ngày làm + Nội dung. Meeting: hạn và "TVV sẽ nhận việc". Bỏ: chọn lý do.
- **TVV:** nội dung GVCN gửi, SĐT phụ huynh, hạn.

## 5. Khi nào KHÔNG có việc

- SOS tạm, Case tạm.
- MT0; MT cũ quá 4 tuần; em KCK (Case nhẹ: không PA quy chế, không hạn, không Phối hợp).
- Môn không học hoặc đã bỏ (N13).
- Em Tạm dừng; quay lại học thì hạn tính lại.
- PA của GV trùng loại PA quy chế: không có Xác nhận PA.
- Thiếu nhận xét MT: chỉ nhắc (N9); chỉ thành việc khi lượt chốt còn SOS.
- Phối hợp ngoài Meeting, Báo PH kết quả Test: không hạn.
- Case đóng vì Lộ trình mới / bỏ môn / Không cần theo dõi: hết việc.

## 6. Chỗ tài liệu và mã lệch nhau / chưa rõ

1. **Hạn xác nhận:** Rulebook §20.1 dòng 4, 6 và §20.2: 3 ngày. Mã: 5 ngày, SOS 3 / Gấp 3 (`sd/cases.ts:856`), theo chủ SP 08/10.
2. **Kỳ ghi kết quả:** Rulebook §20.1 dòng 1: hằng tuần, hết Thứ Hai. Mã: 2 tuần, hết Thứ Ba (`sd/week.ts:42`), theo OV-12a.
3. **SOS tạm:** N8 ④, Rulebook §20.16 còn "không Case / chưa PA / cần nhận xét". Lời 11/11 + mã: có Case tạm, thêm PA được.
4. **Rulebook cũ khác mã:** §20.1 dòng 3 có 3 quyết định (mã 5, `sd/cases.ts:1013`); §20.16 "bỏ ô Mô tả" (N8 ② + mã: sửa được).
5. **Hoàn thành Case khi còn PA quy chế:** `sd/sosV4.ts:184` trả "ẩn nút"; máy chủ hỏi rồi cho làm (`cases.ts:249`); web hiện nút kèm lý do, vẫn bấm được (`CasePanel.tsx:340-380`).
6. **"5 ngày" Meeting:** GVCN = ngày tạo + 5 (`sd/sos.ts:171`); TVV = ngày xác nhận + 4 (`phoiHop.ts:364`).
7. **Chữ tối thiểu:** chung 8; Xác nhận Case Speaking còn 10 (`cases.ts:1540`).
8. **"Ai làm" Phối hợp:** chủ SP: chỉ GVCN. Cấu hình cho chọn TVV / CX (`sd/cauHinhCaseSos.ts:28`); không thấy chỗ nào trong `ss/` đọc để giao việc.
9. **GV cũ bổ trợ:** đặc tả 13/11 có 2 lối vào (hồ sơ lớp cũ, hồ sơ GV). Mã: đã có quyền tạm + giữ việc (`ss/permissions.ts:455`); không thấy 2 lối vào ở `web/src`.
