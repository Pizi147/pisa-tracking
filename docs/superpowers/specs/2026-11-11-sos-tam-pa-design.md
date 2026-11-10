# SOS tạm — GV ghi mô tả + PA trước khi chốt; PA GV ↔ PA quy chế (chủ SP 11/11)

Trạng thái: **PTA chốt Q1–Q8 theo khuyến nghị (chủ SP 11/11: "tiếp tục tất cả những gì đang dở, tự rà, tự merge")** — đã code (PR SOS-TAM-PA). Khác bản nháp: thẻ QL là loại riêng `giu_pa_gv` (cùng hộp Chờ duyệt, đối tượng = PA quy chế chờ) thay vì dùng lại `de_xuat_pa` — `de_xuat_pa` coi đối tượng là PA mới CHỜ duyệt, còn PA của GV đang chạy.
Thay phần liên quan của: luật SOS MT 11/10 ("SOS tạm thời không Case, không hạn"), N8 ④, OV-13a (Case tạm không PA), K3-16 #1303 (nhánh trượt lại sinh PA quy chế mới),
PA-TRUNG #1207, gộp xác nhận #1308. Không đổi luật nào khác.

## 1. Luật (nguyên văn chủ SP 11/11, PTA nhắc lại, chủ SP "OK")

> "kể cả khi chưa chốt SOS status, các GV vẫn được phép cập nhật mô tả case (kể cả trực tiếp hay qua nhận xét MT), và cập nhật phương án luôn. Trong trường hợp SOS
> cần có phương án quy chế, nếu trùng phương án, mọi thứ giữ nguyên và không sinh thêm việc, nếu khác PA, GV sẽ phải vào chọn 1 trong 2, và nếu khác PA quy chế,
> thì QL phải duyệt, nếu chưa duyệt hoặc không duyệt sau 3 ngày, PA sẽ chốt theo lựa chọn của GV."

PTA nhắc lại: SOS tạm vẫn **không hạn / không trễ**. Khi SOS chốt cần PA quy chế: (1) PA GV trùng → giữ, không việc · (2) khác → GV chọn 1 trong 2: PA quy chế → xong;
giữ PA mình → QL duyệt; quá 3 ngày QL chưa trả lời → chốt theo GV · (3) QL Không duyệt trong 3 ngày → về PA quy chế · (4) GV chưa đặt PA → như hiện nay.

## 2. Hiện trạng (đã đọc mã)

| Chỗ | Hiện nay |
|---|---|
| Lượt Mock FT chưa chốt (`sos.ts` `raiseSignalsForResult` → `dongBoCaseTam`) | Case tạm (`sos_cases.tam = 1`) **chỉ khi ô dưới kỳ vọng có điểm + nhận xét** (`keHoachCaseTam`). Mô tả = nhận xét (đi theo tới khi sửa riêng — `suaCase` không chặn Case tạm). Không hạn, không chuông, không việc, không vào số đếm (`CASE_THAT`); chỉ hiện ở panel một em / hồ sơ HV, nhãn "Chờ chốt SOS" |
| PA trên Case tạm | **Bị chặn**: `recordIntervention` 400 "Case tạm … Lượt chốt rồi mới thêm PA" (`cases.ts:994`); web ẩn "+ Thêm PA" (`CasePanel.tsx:293`), ẩn Hoàn thành (`:344`) |
| Lượt chốt (`chotCaseTam`) | tam → 0, hạn xác nhận từ hôm nay, `createPresetPlan` (PA quy chế chờ xác nhận) → việc "Xác nhận PA" (`mywork.ts:876`, hạn `han_xac_nhan`) |
| Trượt lại vào Case thật đang mở (K3-16) | PA quy chế cũ "đến MTn / 1 tháng" → Kết quả cuối (`paHetMocTruotLai`); Case có nguyên nhân → PA quy chế mới chờ xác nhận; PA-TRUNG: không sinh trùng "đến lúc thi" |
| Mất SOS khi còn tạm (Overall đạt, kỹ năng hết dưới, xoá điểm / nhận xét) | `xoaCaseTamThua`: xoá Case tạm (Thùng rác); có tệp → đóng |
| Đề xuất PA khác (OV-13b, `doiPa.ts`) | Thẻ `de_xuat_pa` (đối tượng = PA mới **chờ**, `du_lieu.thayPaId` = PA quy chế); QL Duyệt / Từ chối / Huỷ quyết định / người gửi Rút; **không hạn tự chốt** |
| Thẻ tự đóng | `quetYeuCau` → `quetThat` (mỗi loại có `chet` + `quet`), chạy khi mở Chờ duyệt / Công việc / đóng HV — trạng thái `tu_dong` |
| PA quy chế có thể là | Tự học · 1 tháng · Tutor · đến MTn · Tutor · đến lúc thi (`academicSupportFor`) |

## 3. Thiết kế

### 3.1. Khi SOS còn tạm (lượt chưa chốt)
- **Case tạm cho MỌI kỹ năng dưới kỳ vọng có điểm** — bỏ điều kiện "ô có nhận xét" trong `keHoachCaseTam`, để GV có chỗ viết mô tả trực tiếp. Có nhận xét → mô tả theo nhận xét (N8 ② giữ);
  không có → Case tạm "chưa có mô tả" (ô Mô tả bấm thẳng để ghi — memory case-pa-bam-thang). Vẫn **không việc "Mô tả Case", không hạn, không chuông, không số đếm**.
- **PA trên Case tạm**: bỏ chặn ở `recordIntervention` + web — "+ Thêm PA", sửa, xoá (Thùng rác + Hoàn tác), ghi kết quả như Case thường. Hoàn thành Case vẫn ẩn (SOS chưa chốt).
- Nhãn giữ "Chờ chốt SOS". Case tạm vẫn ngoài mọi danh sách / số đếm (`CASE_THAT`).
- Case thật đang mở (lượt mới chưa chốt trượt lại cùng kỹ năng): GV đã sửa mô tả / PA được từ trước — không đổi.

### 3.2. Khi lượt chốt dưới kỳ vọng (`chotCaseTam`, và nhánh trượt lại K3-16 sinh PA quy chế mới)
Q = PA quy chế theo bảng (`presetFor`, mức SOS lúc chốt). G = PA của GV đang mở trên Case (planned / started, đã duyệt; **không tính** PA quy chế cũ vừa sang Kết quả cuối, PA quy chế chờ xác nhận).

| Ca | Xử lý |
|---|---|
| (4) G rỗng | **Như nay**: PA quy chế chờ xác nhận + việc "Xác nhận PA" + hạn |
| (1) có G **cùng loại** Q (Tự học / Tutor) | **Không tạo PA quy chế, không việc, không hạn xác nhận.** G giữ nguyên nội dung, người dạy, ngày, kết quả; G được **gắn dấu PA quy chế** (`preset = 1`, `moc_quy_che` = mốc của Q, xác nhận = người tạo G lúc chốt) để mốc / bắt buộc trước Hoàn thành / Kết thúc PA quy chế / số liệu PA quy chế chạy đúng — [hỏi Q2] |
| (2) chỉ có G **khác loại** | PA quy chế chờ xác nhận như nay, nhưng việc đổi thành **"Chọn PA · {kỹ năng}"** (cùng dòng việc `xac_nhan_pa`, cùng hạn `han_xac_nhan`, thêm một cột EXISTS — không câu mới). Form có 2 nút: **"Theo PA quy chế"** · **"Giữ PA của tôi"** |

**"Theo PA quy chế"** = Xác nhận PA (hàm có sẵn) + G kết thúc lý do mới "Thay bằng PA quy chế" (kết quả đã ghi giữ). Hoàn tác (toast) trả cả Q lẫn G.

**"Giữ PA của tôi"** → thẻ QL loại `giu_pa_gv` (đối tượng = Q, `du_lieu.paGv` = G), `han_duyet` = ngày gửi + 3. Q chờ (`superseded_by`, Case "Chờ duyệt đổi PA"),
việc Chọn PA rời GV, **G vẫn chạy**. Lý do: [hỏi Q3].
- QL **Duyệt** → Q "Đã kết thúc · Đổi PA" (`apDungDoiPa 'duyet'`), G giữ.
- QL **Không duyệt** (lý do bắt buộc như thẻ hiện nay) → Q xác nhận, chạy từ hôm nay; G kết thúc "Thay bằng PA quy chế"; GV nhận chuông kèm lý do — [hỏi Q4].
- **Quá hạn** (hết ngày gửi + 3) QL chưa trả lời → máy tự duyệt (`tu_dong`, "Quá 3 ngày QL chưa trả lời — chốt theo PA GV"); chạy trong `quet` của loại (cùng lượt `quetYeuCau`) + lượt quét định kỳ. Thẻ này không báo "Quá hạn duyệt".
- Người gửi **Rút** → về việc Chọn PA. QL **Huỷ quyết định** trong ngày → thẻ chờ lại (có sẵn).
- Ca có G cùng loại **và** G khác loại → ca (1) (PA khác là PA GV thêm, giữ).

### 3.3. SOS tạm rồi mất SOS (Overall đạt, kỹ năng hết dưới, xoá điểm, chốt mà không còn SOS)
- Case tạm **có PA (chưa huỷ)** → không xoá: thành Case thường (tam = 0, không hạn, không PA quy chế), mốc "Không còn SOS — GV xem và tự đóng" (như Case thật đã có PA ở `xoaSosOverallDat`). PA GV chạy tiếp.
- Case tạm **không PA nhưng có mô tả GV sửa riêng / có tệp** → đóng (giữ lịch sử, Mở lại được) — không sinh việc "Thiếu PA".
- Còn lại (mô tả theo nhận xét, không PA) → xoá như nay (Thùng rác, khôi phục được; nhận xét vẫn ở ô điểm). — [hỏi Q5]

### 3.4. Đổi PA nhiều lần / mức SOS đổi
- Trong tạm: thêm / sửa / xoá PA tự do (Thùng rác + Hoàn tác). Chỉ PA đang mở **lúc chốt** được so.
- Sau chốt, việc Chọn PA còn chờ: GV xoá / kết thúc hết G khác loại → việc tự về "Xác nhận PA" (việc tính lúc đọc).
- Mức SOS đổi sau chốt (`resyncUnconfirmedPresets` đổi loại Q): Q mới **trùng** G → áp ca (1) (Q chờ huỷ, G gắn dấu, hết việc; thẻ QL đang chờ tự đóng `tu_dong` "PA GV trùng PA quy chế"); Q mới vẫn khác → giữ Chọn PA / thẻ.
- Sau khi đã chốt (duyệt / tự chốt / theo quy chế): đổi PA về sau theo luồng thường (Điều chỉnh, Thay, Đề xuất đổi PA).

### 3.5. Hai kỹ năng
Mỗi kỹ năng một Case (N8 ②), xét riêng: vd W1 trùng, R khác → chỉ R có "Chọn PA" + thẻ. Hai Case khác → hai việc, hai thẻ (hộp Chờ duyệt gom theo em như hiện nay).

### 3.6. Hoàn tác / khôi phục
| Thao tác | Đường sửa sai |
|---|---|
| Thêm / sửa / xoá PA, sửa mô tả ở Case tạm | Như Case thường (Hoàn tác, Thùng rác, lịch sử) |
| Theo PA quy chế | Toast Hoàn tác (`hoanTacXacNhanPa` + trả G); sau đó luồng thường |
| Giữ PA của tôi | Rút thẻ trước khi QL trả lời |
| QL Duyệt / Không duyệt | Huỷ quyết định trong ngày (có sẵn) |
| Tự chốt sau 3 ngày | Không "Huỷ" (thẻ `tu_dong`); QL đổi bằng luồng thường (Đổi PA / Kết thúc PA quy chế) |
| Lượt hết chốt (Bỏ vắng, khôi phục phần thi) | Như nay — không gỡ gì đã sinh |

### 3.7. Ai thấy gì
| Lúc | GV phụ trách kỹ năng | GVCN | QL |
|---|---|---|---|
| SOS tạm | Case tạm ở hồ sơ HV / panel một em: ghi mô tả, đặt PA, ghi KQ PA. Không việc, không chuông | Như nay (chip "SOS tạm"), sửa theo quyền Case | Sửa thay được (quyền Case) |
| Chốt — trùng / chưa có PA | Trùng: không gì mới. Chưa PA: "Xác nhận PA" như nay | Chuông SOS như nay | Như nay |
| Chốt — khác | Việc "Chọn PA" (hạn như Xác nhận PA) → chọn; giữ → chờ, thấy "Chờ QL duyệt · tự chốt {ngày}" ở thẻ PA | Như nay | Thẻ "PA khác · {kỹ năng}" ở Chờ duyệt / Công việc QL: "Tutor (quy chế) → Tự học · {GV}", hạn 3 ngày "quá hạn tự chốt theo GV" |
| QL trả lời / tự chốt | Chuông: Đã duyệt / Không duyệt (lý do) / Tự chốt theo PA của bạn | — | Thẻ sang Lịch sử |

### 3.8. Ảnh hưởng
- **Sổ nghĩa vụ**: "Chọn PA" là dòng `xac_nhan_pa` (cùng hạn) — không loại mới; ca trùng không có dòng. Case tạm không có dòng (như nay). PA trên Case tạm: [hỏi Q6].
- **Công việc**: một cột EXISTS trong câu `xacNhanPa` (nhãn Chọn PA) — không câu mới. QL: thẻ hiện ở hộp Chờ duyệt có sẵn.
- **Chuông**: không chuông mới khi tạm. Chốt như nay. Thẻ QL: chuông thẻ đề xuất PA có sẵn; GV chuông khi trả lời / tự chốt.
- **Dòng đọc Turso**: mở trang không thêm request. Panel một em thêm vài dòng Case tạm (kỹ năng chưa nhận xét). Tự chốt: một câu trong `quetYeuCau` (đã chạy, có `quetTheoMoc`).
- **Chữ**: hướng dẫn `shared/huongDan/gv.ts` + `hd.ts` / `ux1.ts` (EN) đổi câu "Case tạm — chưa hạn, chưa việc" thành "ghi mô tả + PA được, chưa hạn".
- **Giao diện**: theo mẫu sẵn có (panel Case / ThePa, form Xác nhận PA thêm 2 nút, thẻ Chờ duyệt có hạn) → không cần mockup (plan.md 1.3b), trừ khi PTA thấy khác.

### 3.9. Migrate (một lần, có nhật ký, chạy lặp vô hại)
- Sinh Case tạm cho kỹ năng chưa nhận xét của lượt chưa chốt (dùng lại `caseTamCuaLuot` như `prOv13a`).
- Case thật đang có PA quy chế chờ + PA GV mở (dữ liệu đã chốt trước luật): áp ca (1) / (2) hay để nguyên — [hỏi Q7].

## 4. Số đếm — bản chép `mig.sqlite` 07/11 09:24 (chép ra tạm, chỉ đọc; em đang học)

| | Số |
|---|---|
| Lượt Mock FT chưa chốt có SOS (trừ MT0, lớp kết thúc, MT lịch sử ngoài cửa sổ) | **186 lượt · 170 em** |
| Kỹ năng dưới kỳ vọng trong các lượt đó | **368** |
| · đã có Case tạm (ô có nhận xét) | 170 (Case tạm mở toàn bảng: 177 — 171 mô tả theo nhận xét, 6 GV đã sửa riêng; 0 có tệp) |
| · đã có Case thật đang mở cùng kỹ năng (từ MT trước — GV sửa được rồi) | 68 |
| · **chưa nhận xét → chưa có Case tạm → luật mới sinh Case tạm "chưa có mô tả"** | **130** |
| PA trên Case tạm hiện có | 0 (đang bị chặn) |
| Case thật mở có PA quy chế chờ xác nhận | 147 — trong đó có PA GV (không phải quy chế) đang mở: **3 cùng loại** (Tutor = Tutor, Case 427 · 635 · 659) · **1 khác loại** (Điều chỉnh dạy, Case 634). 5 Case khác có PA quy chế cũ đã xác nhận chạy cạnh (4 = PA-TRUNG, đã dọn bằng `prPaTrung0711`; 1 = K3-16, dọn bằng `prK316`) |
| Thẻ `de_xuat_pa` đang chờ | 0 |

## 5. Không làm
- Không đổi luật chốt SOS (khi nào chốt), mức SOS, bảng PA quy chế, KCK, lớp thường (Progress / Bổ trợ).
- Không đổi luồng Đề xuất PA khác (OV-13b) ngoài việc dùng lại thẻ.

## 6. Câu hỏi ca biên (mỗi câu một khuyến nghị)
- **Q1** Case tạm cho mọi kỹ năng dưới kỳ vọng có điểm (kể cả chưa nhận xét: +130 Case tạm trên bản chép, không vào số đếm) — **khuyến nghị: có** (không thì GV không có chỗ "ghi mô tả trực tiếp").
- **Q2** "Trùng" = cùng loại PA (Tự học / Tutor), không xét người dạy, nội dung, mốc; PA GV trùng được gắn dấu PA quy chế (mốc, bắt buộc trước Hoàn thành) — **khuyến nghị: có**.
- **Q3** "Giữ PA của tôi": lý do **không bắt buộc** (khuyến nghị — luật không nhắc, không thêm bước) hay ≥ 10 ký tự như "Đề xuất PA khác"?
- **Q4** QL Không duyệt → PA quy chế **chạy ngay** từ hôm đó (không thêm bước Xác nhận cho GV), PA GV kết thúc, kết quả giữ — **khuyến nghị: có**.
- **Q5** Mất SOS khi còn tạm: có PA → giữ Case mở + mốc; chỉ mô tả riêng / tệp → đóng; còn lại xoá như nay — **khuyến nghị: như vậy**.
- **Q6** PA trên Case tạm: **chưa có hạn ghi kết quả** (không trễ, không dòng sổ nghĩa vụ) tới khi lượt chốt; chốt rồi tính hạn như PA thường — **khuyến nghị: có** (đúng "SOS tạm không hạn / không trễ").
- **Q7** Dữ liệu cũ (Case đã chốt trước luật): 3 Case PA GV cùng loại → áp ca (1) (PA quy chế chờ huỷ, hết việc) · 1 Case khác loại → thành "Chọn PA" — **khuyến nghị: áp** (migrate có nhật ký, khôi phục được).
- **Q8** Nhánh trượt lại (K3-16) dùng cùng luật: G không tính PA quy chế cũ đang sang Kết quả cuối — **khuyến nghị: có**.

## 7. Kết quả thử trên bản chép `mig.sqlite` 07/11 (migrate + thao tác thật, cuộn lại)
- Migrate: **+119 Case tạm** (177 → 296; 130 ước ở mục 4 gồm cả lượt lớp kết thúc / tín hiệu đã nối) · **3 Case** (427 · 635 · 659) PA GV trùng loại → PA GV mang dấu quy chế, PA quy chế chờ huỷ (`khoiPhucSosTamPa`) · **1 Case** (634) → việc "Chọn PA".
- 20 Case tạm: người phụ trách thêm PA → 20/20 lưu được, không hạn ghi kết quả.
- Case 634: caseDetail có `chonPa`, Công việc QL "Chọn PA"; Giữ PA → QL Duyệt (PA quy chế "Đổi PA") · Không duyệt (PA quy chế chạy) · quá hạn (thẻ tự đóng, PA quy chế "Đổi PA") — 3/3 đúng.
