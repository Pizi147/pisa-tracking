# Luật 1 — Test và nhập điểm (hiện trạng 13/11)

Đọc mã nhánh `plan-overhaul-v6-loi6`. Không đề xuất đổi luật. "Tuần Test" = tuần làm bài của CHÍNH kỹ năng đó.
Tệp: `ss/` = `server/src/` · `sd/` = `shared/domain/` · `att` `lich` `vang` `diem` = `ss/fasttrack/{attempts,skillSchedule,absence,scoring}.ts` · `thuong` = `ss/normal/regular.ts` · `quyen` = `ss/permissions.ts` · `tuan` = `ss/platform/week.ts` · `mywork` = `ss/worklist/mywork.ts`.

## 1. Luật core

| Mã | Luật | Nguồn | Mã thực thi | Khớp mã? |
|---|---|---|---|---|
| T-01 | "Thi" chỉ là thi thật. FT có Mock Test (MT1, MT2…; band L R W1 W2 S) và MT0 (Mock số 0 của em lớp thường được chốt Lên FT). Lớp thường có Progress, Final (điểm đạt/tổng). KET/PET có Checkpoint. | Rulebook §21.4, §20.6 | `sd/normal.ts:64-72` | Khớp |
| T-02 | S Ex: chỉ lưu band + nhận xét. Không vào Overall, SOS, Case, việc, quá hạn. | N10 | `ss/cham/sExpert.ts:1-57` | Khớp |
| T-03 | Lớp thường theo tuần học của LỚP: Pre FOU Final tuần 5 (một ô Tổng hợp); FOU Progress 4, Final 8; BE/ELE Progress 5, Final 10. Em vào lớp tự có bài. QL, Admin, GVCN lớp sửa được mốc tuần. | Rulebook §20.6; chủ SP 06/11 | `sd/normal.ts:254-280`, `thuong:458-502`, `quyen:589-594` | Khớp |
| T-04 | KET/PET: hai môn L+S, R+W. Máy KHÔNG tự sinh Checkpoint; QL tự xếp. | plan mục 4 (06/11, 13/11) | `sd/normal.ts:84,286-289` | Lệch N18 (ghi 4 môn, cũ hơn) |
| T-05 | MT theo TỪNG EM: tuần bắt đầu lộ trình của em + tuần học MT của lớp. LT1/LT2: 3 MT (tuần 6, 12, 16). RF: 2 MT (4, 8). Khác: 0. Máy tự tạo; MT4+ do QL thêm. Mỗi kỹ năng có tuần riêng. | N12, N14; Rulebook §8, §20.8 | `ss/classes/schedule.ts:43-46,92-127`, `sd/lichMt.ts:20-38` | Khớp |
| T-06 | Xếp/dời/huỷ lịch: QL, Admin, Quản trị. GV bộ môn không. GVCN chỉ dời kỹ năng có tuần ĐÃ QUA sang tuần đã qua hoặc tuần này. Bật công tắc "Mở sửa lịch Test": GVCN làm như QL. | N23; N15 (06/11) | `lich:937-951`, `ss/platform/moSuaLichTest.ts:46-53` | Khớp |
| T-07 | Thứ Sáu–Chủ nhật: không đổi lịch MT, MT0, S Ex của tuần trước, này, sau. Lớp thường, nhập điểm, "-" không khoá. | N15; plan mục 4 (07/11) | `sd/lichMt.ts:123-129`, `lich:48-57` | Lệch N15: QL/Admin vượt được sau câu xác nhận |
| T-08 | Nhập điểm: GV được phân công ĐÚNG kỹ năng ở ĐÚNG lớp (Pre FOU: GVCN). Chủ nhiệm không thêm quyền nhập. QL, Admin, Quản trị nhập hộ mọi ô. | Rulebook §20.9 | `quyen:408-418,477-482,691-707` | Khớp |
| T-09 | Speaking của Mock và MT0 = chấm chéo, không GV mặc định. GV có kỹ năng Speaking trong hồ sơ (hoặc dạy S lớp FT) chấm mọi lớp FT và MT0 của chi nhánh mình. | N7; T18; plan mục 4 (08/11) | `sd/chamDiem.ts:46-52`, `quyen:339-368` | Khớp |
| T-10 | L/R: số nguyên 0–40 = số câu đúng, máy đổi ra band; "6.5" hoặc "b6" = band. W1/W2/S: 4 tiêu chí nguyên 0–9 (band = trung bình, tròn 0.5) HOẶC chỉ ô Band. Lớp thường: điểm đạt VÀ tổng; đạt từ 70 %. | N16; T10; Rulebook §20.6 | `sd/chamDiem.ts:216-296`, `diem:16-30`, `thuong:735-742` | Khớp |
| T-11 | Writing = (W1 + 2×W2)/3. Overall = trung bình 4 kỹ năng, chỉ khi đủ 4. Môn không đăng ký: ô "Không học", không là việc; Overall ghi "Không đủ bộ môn". | N13 | `diem:37-42,239-244`, `att:2296` | Khớp |
| T-12 | Kỳ vọng: MT1 = Target − 1.0; MT2 = Target − 0.5; MT3+ = Target; RF luôn = Target. MT0 không có. | Rulebook §20.2 | `sd/fasttrack.ts:16-21`, `att:74` | Khớp |
| T-13 | Ô xong = có band (lớp thường: có điểm). Nhận xét MT không bắt buộc, ≤ 300 ký tự. Chỉ MT mới nhất của em nhắc (viền vàng): thiếu nhận xét, hoặc band dưới kỳ vọng mà chưa chọn nhóm nguyên nhân. Không thành việc. | N8 ①, N9, N35 | `sd/nhanXet.ts:10,33-60`, `att:384-401` | Khớp |
| T-14 | Chưa tới tuần Test: GV không nhập được. | T19; plan mục 4 (07/11) | `lich:1062-1086`, `att:547-552` | Lệch T19: người dời được lịch được hỏi "Dời về tuần này rồi lưu?" |
| T-15 | Hạn chấm: hết thứ Tư tuần sau tuần Test (mọi loại Test). Quản trị sửa mặc định; QL đặt hạn riêng. Quá hạn khi tuần Test đã hết VÀ qua hạn; vẫn nhập được. | T6, T19, N25 | `tuan:91-117,287-298`, `sd/hanMacDinh.ts:13` | Khớp |
| T-16 | Ai nhập được ô thì sửa/xoá mọi lúc, có lịch sử. Xoá = điểm được cất, khôi phục một bấm. | N3; T22 | `att:2545-2578` | Khớp |
| T-17 | "-" ở Mock chốt ngay. Lần 1: dời sang tuần ngay sau tuần Test. Lần 2: huỷ, không việc, không chuông. Tuần Test cách ≥ 2 tuần: "Không dự thi". Lớp thường: dời, không bao giờ huỷ. | N38; đặc tả 04/11 | `sd/vang.ts:14-54`, `vang:176-209`, `att:2369-2461`, `thuong:816-978` | Khớp N38 (N4, Rulebook §21.1 L4 cũ hơn) |
| T-18 | "-" ở một task Writing = vắng cả Writing; task kia có điểm thì hỏi rồi huỷ điểm. | plan mục 4 (10/11, #1273) | `att:2418-2451` | Lệch N4 ("điểm đi theo", cũ hơn) |
| T-19 | Chọn tuần bằng tay = xếp lại từ đầu (lần vắng về 0, kỹ năng huỷ sống lại). Bỏ vắng: GV ô đó, GVCN, QL, mọi lúc. Hoàn tác 10 giây. | N38 ①; đặc tả L5, L7 | `lich:1013-1043`, `vang:667-682` | Khớp |
| T-20 | MT cũ (lượt xếp vào tuần cách ≥ 2 tuần): không hạn, không nợ. GVCN và QL nhập mọi ô. | T1, T22 | `sd/lichMt.ts:46-48`, `quyen:694-700` | Khớp |
| T-21 | Việc chấm gom theo TUẦN + LỚP, không theo đợt MT. Công việc: một dòng mỗi tuần Test, mở ra từng lớp; panel chỉ có em có bài. | N39 | `mywork:715-723,752`, `sd/gopViec.ts:68-73` | Khớp |

## 2. Việc sinh ra

| Việc | Ai làm | Sinh khi | Hạn | Xong khi | Lưu xong máy làm gì → ai nhận việc kế | Làm thay |
|---|---|---|---|---|---|---|
| `score` "Nhập điểm {kỹ năng}" | GV đang được phân công kỹ năng đó ở lớp | Từ thứ Hai tuần Test; ô chưa có điểm, chưa "-" | Hết thứ Tư tuần sau hoặc hạn riêng (T-15) | Ô có điểm; ghi "-"; kỹ năng dời hoặc huỷ; em ngừng học | Tính band, Writing, Overall. FT: lượt chốt, Overall dưới kỳ vọng → Case kỹ năng trượt → GV kỹ năng đó "Xác nhận PA" hoặc "Mô tả Case", GVCN "Phối hợp SOS". Progress có môn dưới 70 % → Case, PA Bổ trợ → GV môn "Xác nhận Case", GVCN "Báo PH kết quả Test" | QL, Admin, Quản trị |
| `score`, khoá `score:cham-speaking\|cc`, "Chấm Speaking · n bài" | Mọi GV Speaking của chi nhánh (một việc chung) | Từ thứ Hai tuần Test; ô S của Mock/MT0 chưa có band | Chỉ ghi chữ "quá hạn"; không đếm, không chuông | Ô có band hoặc "-" | Người chấm khác GV phụ trách S của lớp, có nhận xét → GV phụ trách S nhận "Xác nhận Case Speaking" | QL, Admin |
| `missing_data`, khoá `lich-su:{lớp}`, "Nhập điểm MT cũ" | GVCN lớp; QL | Lượt MT cũ còn ô trống | Không | Hết ô trống | MT cũ thi trong 4 tuần trước ngày tạo mới sinh Case | GV đúng ô |
| `missing_data`, khoá `moc:{PA}`, "Xếp lịch MTn" | QL | PA quy chế chờ MT kế mà em thiếu MT mặc định | Không | Có lịch, hoặc QL "Bỏ qua" | | |

Quá hạn tính cho GV được phân công HÔM NAY; đổi GV thì bài chưa chấm sang GV mới (`ss/worklist/scoreDebt.ts:35-65`).

## 3. Lớp nào, khi nào cần nhập điểm

**Một ô là việc `score` của một GV khi đủ cả 7 điều** (`att:933-942,1020-1026`, `lich:456-469`, `quyen:728-730`):
1. GV có phân công đang hiệu lực hôm nay cho đúng kỹ năng đó ở lớp của lượt.
2. Hôm nay ≥ thứ Hai tuần Test của kỹ năng.
3. Ô bắt buộc, chưa có điểm, chưa ghi "-".
4. Kỹ năng không vắng, không huỷ; lượt không huỷ, không là MT cũ.
5. Em đang học; lượt thuộc lộ trình mới nhất, chưa có kết quả thi thật (`ss/students/tamDung.ts:12-52`).
6. Lớp đang chạy (lớp đã kết thúc: chỉ ô chờ từ trước ngày kết thúc).
7. Không phải ô Speaking của Mock/MT0.

| Lớp | Tuần có bài | Ai có việc |
|---|---|---|
| FT | Theo từng em: tuần học 6, 12, 16 (RF 4, 8) của em, cộng tuần dời vì vắng và MT thêm. Tuần nào cũng có thể có vài em | GV L, R, W1, W2: ô của mình. Speaking: việc chung "Chấm Speaking" |
| BE/ELE | Tuần 5, 10 của lớp, cộng tuần dời | GV L, R, W, S |
| FOU | Tuần 4, 8, cộng tuần dời | GV L, R, G+V, P |
| Pre FOU | Tuần 5 | GVCN |
| KET/PET | Chỉ khi QL đã xếp Checkpoint | GV L+S, R+W |
| MT0 | Tuần Final của lớp thường, chỉ em được chốt Lên FT | GV L, R của lớp; GV Writing nhập W1, W2; S chấm chéo |

**Không bao giờ có việc nhập điểm:**
- GVCN không dạy kỹ năng nào (chỉ có "Nhập điểm MT cũ").
- QL, Admin: chỉ theo dõi và làm thay.
- Kỹ năng chưa phân công ai: QL thấy "Chưa phân công giáo viên".
- Chưa tới tuần Test; kỹ năng chưa xếp tuần.
- Em không học môn đó; kỹ năng bỏ khỏi đợt.
- Ô đã "-"; kỹ năng huỷ (vắng 2 lần); lượt huỷ.
- Em tạm dừng, kết thúc học, lưu trữ.
- MT cũ (với GV bộ môn); S Ex; lộ trình "Khác".

## 4. Người nhập cần thấy gì ngay tại chỗ nhập

Cần thấy: lớp, tuần Test, kỹ năng; chỉ em có bài; hạn chấm, đã quá hạn chưa; kỳ vọng của lượt; band xem trước; L/R tổng 40 câu; lớp thường: tổng điểm chung cả cột, ngưỡng 70 %; bộ đếm nhận xét 300 (nhận xét thành mô tả Case); "vắng W3 SEP, lần n"; Speaking: ô "GV chấm" (mặc định người lưu); ô "Không học"; trạng thái lưu từng ô.

| Thao tác | Hệ quả |
|---|---|
| Gõ điểm (mặc định) | Ô xong; "-" cũ mất; kỹ năng thành "đã làm bài" |
| "-" lần 1 (Mock) | Dời sang tuần sau tuần Test; chuông GVCN + GV kỹ năng đó |
| "-" lần 2 | Huỷ kỹ năng; lượt chốt với phần thiếu |
| "-" khi tuần Test cách ≥ 2 tuần | Không dự thi |
| "-" ở W1 hoặc W2 | Vắng cả Writing |
| "-" vào ô có điểm | Hỏi; huỷ điểm (khôi phục được) rồi ghi vắng |
| Gõ điểm vào kỹ năng vắng/huỷ | Hỏi; đổi thành đã làm bài rồi lưu |
| Gõ điểm trước tuần Test | QL/Admin: hỏi "Dời về tuần này"; GV: báo nhờ QL |
| Xoá "-" | Trả về tuần gốc, trừ một lần vắng |
| "-" lớp thường | Dời tuần sau; từ lần 2 chuông GVCN; Final quá tuần Final: thẻ báo QL |
| "-" MT0 | Chỉ ghi dấu, không dời; hết tuần thành Không dự thi |

## 5. Chỗ tài liệu và mã lệch nhau / chưa rõ

1. **"-" Mock:** N4, Rulebook §21.1 L4 (MT cũ huỷ ngay; thẻ "Dời lịch Test"; Giữ huỷ) ↔ N38 và mã. Rulebook chưa ghi [ĐÃ THAY]. §20.4 "huỷ vắng 2 lần chỉ QL khôi phục" ↔ lời 10/11, `vang:667-682`.
2. **MT0 "-":** Rulebook L4 "MT0 áp L4" ↔ `att:2395,2452` (không dời, không huỷ).
3. **Khoá cuối tuần:** N15 "trừ Quản trị hệ thống" ↔ lời 07/11, `ss/platform/moSuaLichTest.ts:69-71`.
4. **Nhập trước tuần Test:** T19 "không ai" ↔ lời 07/11 và mã. Chưa rõ: GV lớp thường qua được bước hỏi (`lich:1076`) nhưng bước dời đòi quyền QL (`lich:943-945`); chưa chạy thử.
5. **S chéo quá hạn:** T18 "báo GVCN và GV Speaking" ↔ lời 10/11, `mywork:621-624` (chỉ GV Speaking). Công việc không đếm (`mywork:791-792`); lời 09/11 "tính cho cả nhóm GV Speaking" ở sổ nghĩa vụ, không kiểm sâu.
6. **MT0 Speaking:** Rulebook §20.6 "GV bộ môn lớp thường nhập" ↔ mã: việc của GV Speaking chi nhánh; GV dạy S của lớp nhập được, không có việc.
7. **KET/PET:** N18 ↔ T-04. **Hạn MT0:** T5 "Chủ nhật tuần sau" ↔ N25 và mã.
8. **Nhắc xếp MT:** N14 "xong đủ số MT" ↔ lời 07/11, `sd/lichMt.ts:215-220` (đếm MT đã TẠO).
9. Việc sinh từ thứ Hai tuần Test (`lich:468`): tài liệu không nói rõ.
10. Mini Test không phải lượt Test (việc `mini_test`, sau PA Bổ trợ).
11. Kế hoạch Test "GV chỉ xem" (N23): không kiểm ở web.
