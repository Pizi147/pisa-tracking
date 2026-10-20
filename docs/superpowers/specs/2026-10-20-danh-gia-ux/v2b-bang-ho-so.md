# v2b — Hệ thống bảng · Ô điểm · Hồ sơ lớp · Ý thức / Phối hợp (rà vòng 2 · 20/10)

> Phạm vi: I.7, II.1, II.2, II.3, II.4, III.1 + mở rộng toàn web. **Chỉ đánh giá + đề xuất**, không sửa repo, không đổi dữ liệu demo.
> Web `http://localhost:5173` (ngày demo 14/09/2026), mã `main` e3405b93+. Model Opus 5.5.
> Nhãn: **[ĐÃ CHỐT]** chủ SP chốt · **[ĐÃ KIỂM]** đo / đọc mã · **[ĐỀ XUẤT]** · **[GIẢ THUYẾT]** · **[CẦN ẢNH]**.
> NEW = `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad` · ảnh `NEW\anh\v2b\` · số đo `NEW\do\` · script `NEW\chup\`.

---

## Tóm tắt 10 dòng

1. **[ĐÃ KIỂM] Lệch bảng có gốc hệ thống, không phải vài giá trị CSS.** Web không có component bảng: 65 `<table>` ở 53 tệp, căn lề viết rời trên từng `<th>` / `<td>` (~190 lớp căn). OV-15a thêm luật căn theo **tên lớp** (`index.css:267`): tiêu đề `align="right"` bị kéo vào giữa, ô `text-right` vẫn căn phải → lưới điểm MT lệch **45–69 px** ở cả 6 lối vào (hồ sơ lớp, panel Nhập điểm, Lịch Test, Công việc, `/nhap-diem`, Điểm theo lớp). Trước OV-15a cột này thẳng (đã kiểm `git show 31b4f24f~1`).
2. **Bốn gốc phụ:** cột giãn (`w-full` + colgroup px → cột L 104 → 134 px; colgroup % → ở 1 280 cột điểm 54 px < nội dung 59 px); ô điểm có **7 cấu trúc** khác nhau + `vertical-align: middle` → số cùng hàng lệch đường cơ sở **7–20 px**; thanh công cụ nằm **trong** khung bảng; ~100 phép kiểm đọc chuỗi mã khoá cách viết cũ, `do-khung` bỏ qua lưới chấm.
3. **Bảng làm "đúng kiểu" thì thẳng:** Kết quả thi, Báo cáo, Hồ sơ GV, Quản trị, Mock Test hồ sơ HV đo 0 cột lệch → chứng minh gốc là cách dựng, không phải phông / màn hình.
4. **[ĐỀ XUẤT] Hệ thống bảng mới:** MỘT `Bang` + **kiểu cột** (tên · chữ · số · điểm · nổi bật · chip · tuần/ngày · việc · nút) — căn của tiêu đề và ô do kiểu cột quyết, không viết tay; MỘT `ODiem` (ký hiệu trước số, ô rộng cố định, theo mockup 6 khung 3 đã duyệt); hàng 44 / 64 px, căn **đường cơ sở**; công cụ ngoài khung; 375 thành thẻ cùng định nghĩa cột.
5. **Chống tái phát:** phép kiểm tĩnh `bang.tests.ts` trong `npm run check` (cấm lớp căn trên `td`/`th`, cấm luật căn theo tên lớp, cỡ chữ ngoài thang) + script đo DOM (đã viết, `NEW\chup\v2b-do-bang.mjs`) vào `do-khung`: lệch tiêu đề ↔ ô ≤ 2 px, lệch đường cơ sở ≤ 2 px, ở 1 440 / 1 280 / 375.
6. **Di chuyển:** BANG-0 nền (~6 tệp) → BANG-1 lưới điểm (~7 tệp, sửa 6 lối vào một lần — nên làm **trước deploy**) → theo màn M3–M7 (~50 tệp còn lại).
7. **[ĐÃ CHỐT] Nhập điểm tại chỗ:** nay nút "Nhập điểm" mở panel toàn màn chứa **bản thứ hai** của lưới đang mở sẵn cuối trang, chọn MT3 (29/32 em chưa tới tuần). Đề xuất: lưới gập; 1 bấm → cuộn + mở, chọn lượt có ô **quá hạn của tôi**, bật "Chỉ ô còn trống", con trỏ ở ô trống đầu. GVCN nhập bài thiếu: **4 bấm + 1 panel + phải nhớ MT → 1 bấm**.
8. **"Đã có trên trang thì làm tại đó":** 12 chỗ (hồ sơ lớp, hồ sơ HV, Học viên & Lớp, Lịch Test) đổi trang / mở panel cho nội dung có sẵn ngay trên trang — bảng bậc 0–5 ở V5.
9. **Ý thức & Phối hợp lớp:** 2 khung + 2 tab con + dòng thời gian 45 vi phạm phẳng; khung phải mặc định **không** theo học sinh (trái Rulebook §19); xem đủ một em 3–4 bấm + 1 đổi trang; tải nhận thức 6/8. Khuyến nghị **phương án A "một bảng theo em, việc ngay trên hàng, mở rộng tại chỗ"**: xử lý quá hạn 5 → 3 bấm; xác nhận phối hợp 4 bấm + dò 1 700 px → 3 bấm, 0 dò; phần Ý thức ~2 800 → ~700 px.
10. **Phối hợp SOS + hồ sơ HV:** 6 thẻ cùng màu, 9 nút chính giống nhau, một câu lặp ở mọi thẻ; ở hồ sơ HV một việc "Ghi nhận" hiện **3 chỗ** trên một màn. Đề xuất cùng ngôn ngữ cho lớp và HV (khối Cần làm 1 câu · 1 nút → Thang → Vi phạm chưa xong | Phối hợp → Nhật ký gập). Cần mockup mới (1440 tối + 375 sáng) trước khi code.

---

## Phần 0. Phạm vi và cách đo

**Đã chụp** (`NEW\anh\v2b\`, 114 ảnh; nhật ký `index.jsonl`):

| Nhóm | Vai | Ảnh (id) |
|---|---|---|
| Hồ sơ lớp MB FT 101 (id 3) — Học viên › Tổng hợp · Góp ý hàng tuần · Cần hỗ trợ · Kết quả đầu ra · Ý thức (Vi phạm, Phối hợp SOS, chọn em) · Phân tích lớp | QT 1, QL 2, GV 7 (GVCN) | `qt-lop3-*`, `ql2-lop3-*`, `gv7-lop3-*` (1440 tối, lát `-pN`) |
| Hồ sơ lớp MB FT 102 (id 4) | GV 10 (GVCN) | `gv10-lop4-hv`, `gv10-lop4-yt` |
| Panel Nhập điểm từ nút đầu trang | GV 7 | `gv7-lop3-nhapdiem` |
| Lưới MT3 phóng (tái hiện ảnh 4) | QT 1 | `qt-lop3-luoi-mt3` |
| Hồ sơ HV Ý thức / Phối hợp — Nguyễn Minh An (id 1), Đỗ Minh Khôi (id 46) | GV 7 | `gv7-hv1-yt`, `gv7-hv46-yt`, `gv7-hv46-ph` |
| 375 sáng | GV 7, QT 1 | `gv7-lop3-hv-375`, `gv7-lop3-yt-375`, `gv7-lop3-ph-375`, `gv7-hv1-yt-375`, `qt-lop3-hv-375` |
| Toàn web (đối chiếu lệch) | QT 1 | `qt-hvl-open3`, `qt-hvl-open3-1280`, `qt-pt-tonghop`, `qt-lop1-thuong-luoi`, `qt-test-lich` |
| Mockup 6 đã duyệt | — | `mk6-m3-luoi` (khung 3 lưới), `mk6-m2-hosolop` (khung 2) |

**Đo DOM** (Playwright + Edge, đăng nhập demo, phông thật): `NEW\chup\v2b-do-bang.mjs` đo mọi `<table>` thấy được: với mỗi cột — kiểu căn tiêu đề / ô (tính theo khoảng trống trái–phải thật, không theo CSS), **lệch theo kiểu căn** (mép trái nếu ô căn trái, mép phải nếu căn phải, tâm nếu giữa; trung vị các ô − chữ tiêu đề), cỡ chữ, số dòng, tràn ô; với mỗi hàng — chiều cao, **lệch đường cơ sở** dòng đầu giữa các ô; "sốR±" = chênh mép con số trong cùng cột. Bảng tiêu đề tách (Học viên & Lớp) được ghép tiêu đề–thân. 46 trang × 1440 / 1280 / 375. Kết quả: `NEW\do\bang.json`, `bang3.json`, tóm tắt `NEW\do\tomtat-bang.txt`, `tomtat-khac.txt`.

**Chưa rà được:** Tutor rỗng (dữ liệu demo — X11), Phân tích GV 0 bảng ở vai QT; bảng ở 375 đã thành thẻ nên chỉ đánh giá bằng ảnh; không mở panel cần lưu.

### Bảng số đo chính (1440 tối trừ khi ghi)

| Bảng (lối vào) | Tệp | Cột lệch > 2 px | Lệch lớn nhất | Cao hàng min / trung vị / max | Lệch đường cơ sở trung vị / max | Cỡ chữ trong ô |
|---|---|---|---|---|---|---|
| Lưới Điểm MT — hồ sơ lớp (khối cuối trang) | `cham/LuoiFT.tsx` | **9 / 10** | S **67,9** · L 51,2 · W1 44,9 · Overall 20,5 | 64 / 64 / 75,8 | 8 / 19,5 | 11 · 11,5 · 12 · 13 · 15 |
| Cùng lưới — panel Nhập điểm (GV 7) | `LuoiFT` | 9 / 10 | S 70,4 · L 53,2 | 64 / 64 / 72 | 8 / 19,5 | như trên |
| Cùng lưới — Lịch Test (QT) | `KhoiNo` + `LuoiFT` | 33 cột / 6 bảng | S 69 · L 52,1 | 56 / 64 / 75,8 | ≤ 22,4 | như trên |
| Cùng lưới — `/nhap-diem/3` | `LuoiFT` đủ cột | 7 / 12 | S 49,1 · L 36,2 | 64 / 64 / 75,8 | 1 / 16,4 | như trên |
| Cùng lưới — panel việc Công việc (GV 7) | `LuoiFT chiCot` | 3 / 4 | L 36,2 · Kết quả 25,5 | 64 | 1 | 11,5 · 13 |
| Hồ sơ lớp › Tổng hợp | `students/ClassRoster.tsx` | 7 / 12 | L 23,2 · OVR 20,6; **số cùng cột lệch ±16 px** | 46,6 / 63,6 / 70,6 | **12,5 / 19** | 11 · 11,5 · 12 · 13 |
| Học viên & Lớp (FT) | `StudentsPage` + `BangHocVienLop` | 2 / 13 | Sắp tới 47,9 · Học viên 32; **W cao hơn L/R/S 20 px** | 54,6 / 70,6 / 100,6 | **16 / 33** | 11 · 11,5 · 12 · 14 |
| Học viên & Lớp ở **1 280** | như trên | **8 / 13** | L 16,6 · S 16,5 (cột 54 px < nội dung 59 px) | 60,6 / 78,6 / 102,6 | 20 / 34 | như trên |
| Đang SOS | `BangSos.tsx` | 3 / 9 | MT · tuần 18,9 · Trạng thái 16,3 | 50,6 / 50,6 / 60,6 | 8 / 11 | 11,5 · 12 |
| Lưới lớp thường (Final Test) | `cham/LuoiThuong.tsx` | 4 / 6 | 10 | 57–72 | 10–10,5 | 11 · 11,5 · 12 · 13 |
| Phân tích › Test + SOS | `phanTich/TongHopTestSos.tsx` | [ĐÃ KIỂM bằng ảnh] tiêu đề giữa, số căn phải | ~23–40 px (`qt-pt-tonghop`) | 39,6 | 0,5 | 11,5 · 13 |
| Tổng quan QL › Lớp cần chú ý | `worklist/TongQuanQl.tsx` | 1 / 8 | 5,3 | 54,6 | 8 | 12 · 13 |
| **Đúng kiểu (đối chứng):** Kết quả thi · Báo cáo · Hồ sơ GV (4 bảng) · Quản trị · Mock Test hồ sơ HV · Phân tích Ý thức | nhiều tệp | **0** | — | 38,6–58,6 | 0,5–12 | 11–15 |

Kết luận đo: lệch tập trung đúng ở các bảng có **ô điểm** hoặc có cặp `Th align="right"` + `td text-right` không `tabular-nums`; bảng dựng nhất quán (`Th align="right"` + `td tabular-nums`) thì thẳng. Lệch không do phông hay màn hình.

---

## V1. Bảng xô lệch — nguyên nhân gốc ở cấp hệ thống — [ĐÃ CHỐT — sửa triệt để] [ĐÃ KIỂM] · P1 · mọi vai

**1. Vấn đề.**
- Tiêu đề cột và nội dung không thẳng: lưới điểm MT tiêu đề "L" nằm giữa cột 134 px, ô "7.0 ✓" dồn mép phải → lệch 51 px; cột S lệch 68 px (ảnh `qt-lop3-luoi-mt3` = ảnh 4 chủ SP). Hồ sơ lớp › Tổng hợp lệch 17–23 px; Phân tích Test + SOS 23–40 px (`qt-pt-tonghop`).
- Trong **cùng một hàng**, con số chính không cùng đường cơ sở: hàng Bùi Thảo Vy ở lưới MT3 — số L/R ở y 2 701, W1/W2 ở 2 708 (+6,9 px), W/S/Kỳ vọng ở 2 709 (+7,9 px). Học viên & Lớp: số W cao hơn L/R/S **20 px** vì ô W có 3 dòng (`qt-hvl-open3-1280` = ảnh 1).
- Trong **cùng một cột**, các con số không thẳng nhau: Tổng hợp — hàng có ✓ và hàng MT cũ / W1 không ✓ lệch mép số 16 px.
- Hàng cao thất thường: Tổng hợp 46,6–70,6 px; Học viên & Lớp 54,6–100,6 px; một bảng dùng 4–5 cỡ chữ trong ô (11 · 11,5 · 12 · 13 · 15).
- Ở 1 280 px bảng Học viên & Lớp vỡ thêm (8/13 cột lệch) vì cột điểm 54 px hẹp hơn nội dung.

**2. Nguyên nhân (gốc, có bằng chứng).**

| # | Gốc | Bằng chứng |
|---|---|---|
| R1 | **Không có component bảng; căn lề viết tay trên từng ô.** 65 `<table>` / 53 tệp; chỉ có `Th` (`ui/ui.tsx:401-428`, dùng ở 19 tệp) và lớp `.th` / `.td` (`index.css:258-265`). Căn rải rác: `td text-right` 43 chỗ, `td text-center` 27, `td tabular-nums` 48, `Th align="right"` 36, `align="center"` 6, `th text-right` 10, `th text-center` 21. `td` tự đặt đệm (`p-0`, `px-`, `py-`) 30 chỗ, tự đặt cỡ chữ 38 chỗ. Tiêu đề và ô của cùng một cột viết ở **hai chỗ** — có khi **hai tệp** (Học viên & Lớp: tiêu đề `StudentsPage.tsx:312-313` `canhCot()`, ô `BangHocVienLop.tsx:241-269`). | quét `web/src` (lệnh trong nhật ký); `ClassRoster.tsx:256-304` |
| R2 | **Luật căn theo TÊN LỚP thay vì theo cột** — OV-15a (#460, commit `31b4f24f`) hiện thực C06 "số căn giữa" bằng một bộ chọn: `td.td.tabular-nums, th.th.tabular-nums, th.th.text-right { text-align: center }` (`index.css:267`). Mọi tiêu đề `align="right"` thành **giữa**; ô `text-right` **không** có `tabular-nums` vẫn **phải** → lệch mới ở 7 tệp: `LuoiFT`, `LuoiThuong`, `ClassRoster`, `KhoiNo`, `PhanTichGiaoVien`, `BangDiemLopThuong`, `CatalogAdmin`. Trước OV-15a: tiêu đề phải + ô phải = thẳng (`git show 31b4f24f~1:web/src/modules/cham/LuoiFT.tsx:168,338` + `index.css:256` cũ). | đo: 9/10 cột lưới MT `th giữa / td phải` |
| R3 | **Cột giãn không kiểm soát.** Lưới FT: `table-layout: fixed` + colgroup px (tổng 1 058 px, `LuoiFT.tsx:90-94,133-138`) + `w-full` (`:168,176`) → trình duyệt chia phần dư theo tỉ lệ: L 104 → 134, S 130 → 168, Kết quả 124 → 160 px; ô căn phải trong cột rộng càng xa tiêu đề. Ngược lại Học viên & Lớp dùng colgroup **%** (`StudentsPage.tsx:600` `w-[4.5%]`) → 61 px ở 1 440, 54 px ở 1 280 < "7.0 ✓" 35 px + đệm 24 px → tràn, căn giữa vỡ. Tổng hợp: cột ⋯ chỉ chứa nút 28 px nhưng rộng 154 px. | đo `w` từng cột |
| R4 | **Ô điểm 7 cấu trúc, mỗi PR tự đặt cỡ** (chi tiết V2). Ô có 1–3 dòng (số + "30 câu" + "thiếu nhận xét" + "vắng lần 1") nằm cạnh ô 1 dòng, cùng `vertical-align: middle` (`.td`, `index.css:265`) → dòng chính bị đẩy lên / xuống theo số dòng phụ. `ClassRoster.tsx:240` đặt `align-top` trên `<tr>` — **không có tác dụng** (thuộc tính này không áp lên `tr`), `.td` vẫn ép giữa. | baseline đo hàng Bùi Thảo Vy |
| R5 | **Thanh công cụ trong khung bảng.** "Dán từ Excel · ?" (`LuoiChamLop.tsx:179-204`) và "GV chấm S: … ▾" (`LuoiFT.tsx:174`) nằm trong `div` có viền của bảng (`DiemTheoLop.tsx:239`) → chen giữa viền và hàng tiêu đề. | ảnh `qt-lop3-luoi-mt3` |
| R6 | **Không có phép kiểm; phép kiểm cũ khoá cách viết cũ.** `do-khung` chạy tay, không đo lệch tiêu đề ↔ ô, và **bỏ qua** lưới chấm khi đo chữ cắt (`scripts/do-khung.mjs` `BO_QUA_CAT = ['lichTest','diem-lop','mock','nhap-diem',…]`). `prSang` S8 chỉ chặn chữ < 11 px. Ngược lại ~100 phép kiểm đọc **chuỗi mã** của chính các tệp bảng (LuoiFT 14, StudentsPage 13, MotKyNang 11, LuoiThuong 10, HopNhapDiem 9, DiemTheoLop 9, ClassRoster 8…), vd `prHk2.tests.ts:651` bắt đúng chuỗi `gon ? 'table-scroll bang-dinh bang-dinh-1440' : 'overflow-x-auto'` → dựng lại bảng là vỡ hàng chục phép kiểm, nên PR sau chỉ dám **sửa số px** (N9 của phụ lục a6). | `server/src/tests/*.tests.ts` |
| R7 | **Quy trình vá số.** Chú thích trong mã ghi lại chuỗi vá: "PR-S4F #8: TT 118 → 146, bù HV 190 → 176, Kết quả 150 → 136"; "OV-4b: … lấy 12 px từ Kết quả"; "PR-HSM: … Hạn 200 → 140, Kết quả 176 → 150" (`LuoiFT.tsx:89-94`). DESIGN.md ghi luật ("Số căn giữa", `DESIGN.md:145`) nhưng không có chỗ hiện thực duy nhất; luật CLAUDE.md "dùng lại component sẵn có / bố cục đã khoá" (N2) giữ cấu trúc cũ. | — |
| R8 | **Lệch mockup đã duyệt.** Mockup 6 khung 3 (thắng 1–5): ký hiệu ✓/✗ **trước** số, ô đã có điểm là chữ trơn, tiêu đề và ô cùng căn trái, "30 câu" thẳng mép số, W1/W2 có ✓/✗, cột L/R ~76 px (`mk6-m3-luoi`). Web: nút có viền, ký hiệu **sau** số, ô căn phải, tiêu đề giữa, "30 câu" dồn phải sát mép hộp, cột 134 px. | `thiet-ke/mockup-ov14-6-…html:548-561, 713-745` |

**3. Ảnh hưởng.** Cô Linh nhập 20 bài: mắt phải dò từ tiêu đề "L" sang ô cách 51 px, dễ nhầm cột L ↔ R ở bảng 10 cột, nhất là khi cột W (nền xám) và Kỳ vọng / Overall (nền nhấn) chen giữa. Chị Vy đọc Tổng hợp / Học viên & Lớp: số cùng hàng không cùng dòng, hàng cao 2–5 lần nhau → khó so L/R/W/S của một em. Mọi vai: cảm giác "lôm côm" ở **mọi** màn có điểm (6 lối vào cùng một lưới). Quy trình: chủ SP phải nhắc lại mỗi đợt; mỗi lần sửa một chỗ thì chỗ khác vỡ (OV-15a sửa "căn giữa" đã làm hỏng lưới vốn thẳng).

**4. Phương án — Hệ thống bảng mới [ĐỀ XUẤT].**

*4a. Một component, một định nghĩa cột.* `web/src/ui/Bang.tsx`:
```
<Bang cot={[ {key:'hv', nhan:'Học viên', kieu:'ten'}, {key:'L', nhan:'L', kieu:'diem'}, …, {key:'kq', nhan:'Kết quả', kieu:'chip'} ]}
      hang={…} oCua={(hang, cot) => ReactNode} congCu={<ThanhCongCu …/>} the375={…} />
```
- `kieu` sinh **cùng một** `data-kieu` trên `<th>` và `<td>`; CSS căn theo `[data-kieu=…]` cho cả hai → tiêu đề và ô không thể lệch. Cấm lớp căn trên `td` / `th` ngoài `Bang`.
- Độ rộng: cột cố định theo kiểu (px); **chỉ một** cột "linh hoạt" (tên hoặc việc / ghi chú) nhận phần dư; không `%`. Bảng rộng hơn khung thì cuộn trong khung (`.table-scroll` có sẵn), cột tên dính trái.
- Bỏ luật `index.css:267`; `Th` giữ làm phần trong của `Bang`.

*4b. Kiểu cột (căn tiêu đề = căn ô).*

| Kiểu | Ví dụ | Căn | Rộng | Chữ (thang vòng 1) | Chữ phụ |
|---|---|---|---|---|---|
| `ten` | Học viên | trái, dính | ≥ 205 px | 15 / 600 (link nếu mở hồ sơ) | 1 dòng 13: lớp · tuần thi |
| `chu` | Nguyên nhân, Ghi chú | trái | linh hoạt | 15 / 400 | tối đa 1 dòng 13 |
| `so` | 6/11, 78, % | **giữa** (C06) | 64–88 px | 15 tabular | không |
| `diem` | L R W1 W2 W S OVR | **giữa** (C06) — xem câu hỏi Q2 | 72 px | `ODiem` (V2) | tối đa 1 dòng 12 |
| `noi-bat` | Kỳ vọng, Overall | giữa | 80 px | 15 / 800, nền `--accent-soft` | không |
| `chip` | Kết quả, Trạng thái, SOS | trái | 140 px | chip 13 | không |
| `tuan` / `ngay` | W2 OCT · hạn 18/09 | trái | 96 px | 14 tabular | không |
| `viec` | Việc tiếp theo | trái | linh hoạt | động từ 15 / 600 + hạn 13 | 1 dòng |
| `nut` | ⋯, Nhập | phải | 48 px | — | — |

*4c. Hàng.* 1 dòng = **44 px**, 2 dòng = **64 px** (đệm 10 / 12); `vertical-align: baseline` cho mọi ô (dòng chính của mọi ô cùng hàng chung đường cơ sở; chữ phụ chỉ nằm **dưới** dòng chính). Hàng nhóm 40 px, 15 / 700 (vòng 1). Không ô nào > 2 dòng; nội dung dài hơn → `title` + mở rộng hàng.

*4d. Dải nền cột.* Tối đa **một** dải nhấn mỗi bảng (Kỳ vọng + Overall, như mockup 6); cột tính sẵn (W) nền xám như mockup; tiêu đề cùng nền với cột. Đường kẻ dọc 1 px `--accent-line` giữa hai cột nổi bật (mockup 6 `.bang th.noi-bat+th.noi-bat`).

*4e. Thanh công cụ.* Luôn **ngoài** khung bảng, một hàng: trái = phạm vi (tab lượt / tuần) · giữa = lọc ("Chỉ ô còn trống") · phải = thao tác (GV chấm S ▾ · Dán từ Excel · ? · Xuất). Không chen giữa viền và tiêu đề.

*4f. Trạng thái hàng (theo vòng 1 §10.1 C2).* Rê chuột chỉ ở hàng bấm được (nền phủ 8 % / 9 %); đang chọn = viền trái 3 px + nền nhấn nhạt; mở rộng = hàng con ngay dưới, nền `--hang-con-bg`, thụt 16 px, một hàng mở một lúc; focus vòng 2 px.

*4g. 375.* `Bang` tự đổi sang thẻ (`TheDong` có sẵn) **từ cùng định nghĩa cột**: dòng 1 = cột `ten` + `chip`; dòng 2 = các cột `diem` trong **lưới 4–5 ô cố định** ("L 7.0 ✓ · R 7.0 ✓ · W 7.0 ✓ · S 5.0 ✗" — không bao giờ tách "W" và "7.0" ra hai dòng như `gv7-lop3-hv-375-p1`); dòng 3 = `viec` + nút. Lưới nhập điểm ở 375 giữ `MotKyNang` (một kỹ năng, ô 44 px).

*4h. Sân mẫu.* Trang `/dev/thanh-phan` có "bảng mẫu" đủ 9 kiểu cột × sáng/tối × 1 440 / 1 280 / 375, chuỗi kiểm tiếng Việt dài — để chủ SP duyệt **một lần** trước khi chuyển các bảng.

*4i. Phép kiểm tự động (chống tái phát).*

| Mã | Ở đâu | Kiểm |
|---|---|---|
| BANG-1 | `server/src/tests/bang.tests.ts` (chạy trong `npm test` → `npm run check`, cùng kiểu `prSang.tests.ts`) | `index.css` không còn bộ chọn căn theo tên lớp tiện ích (`th.th.text-right`, `td.td.tabular-nums`…) |
| BANG-2 | như trên | trong `web/src/modules/**`, `<td` / `<th` không mang `text-left|center|right`; danh sách tệp được miễn (chưa chuyển) **chỉ được giảm** |
| BANG-3 | như trên | `<table` chỉ trong `ui/Bang.tsx` (+ danh sách miễn giảm dần) |
| BANG-4 | như trên | tệp bảng không dùng `text-[11px]`, `text-[11.5px]`, `text-[12.5px]`; cỡ chữ trong ô thuộc {12, 13, 14, 15} |
| BANG-5 | như trên | cột kiểu `so` / `diem` / `noi-bat` có rộng px (không %) |
| BANG-D | `scripts/do-bang.mjs` (từ `NEW\chup\v2b-do-bang.mjs`) gọi trong `do-khung`; bắt buộc trước PR giao diện (GĐ0 CONG-CU) | mọi cột ≥ 3 ô: \|lệch theo kiểu căn\| ≤ **2 px**; số cùng cột lệch mép ≤ 1 px; lệch đường cơ sở trong hàng ≤ **2 px**; cao hàng ∈ {44, 64} ± 1; không ô tràn; cỡ chữ ∈ thang; ở 1 440, 1 280, 375. Bỏ `BO_QUA_CAT` cho lưới chấm |

Phép kiểm cũ đọc chuỗi mã của tệp bảng (R6) viết lại theo **hành vi** (DOM đo) hoặc gỡ khi tệp chuyển sang `Bang`.

**5. Vì sao tốt hơn.**

| Tình huống | A. `Bang` + kiểu cột (khuyến nghị) | B. Chỉ sửa CSS toàn cục (bỏ / thêm vài bộ chọn) | C. Thêm thư viện bảng (TanStack…) |
|---|---|---|---|
| Lưới MT hôm nay | thẳng (kiểu `diem` cho cả tiêu đề và ô) | thẳng nếu đổi `td.text-right` → giữa | vẫn phải tự viết CSS căn — thư viện "headless" không lo phần này |
| PR sau thêm một cột | khai `kieu` → tự đúng | dev tự chọn lớp căn → dễ sai lại (đã xảy ra: PR-HK2 07/10, OV-15a 19/10) | như A nhưng thêm phụ thuộc |
| Ô điểm 2 dòng cạnh ô 1 dòng | đường cơ sở chung (4c) | phải sửa từng component ô | không giải quyết |
| Kiểm được không | BANG-1…5 + đo DOM | khó viết luật tĩnh | — |
| Chi phí | ~6 tệp nền + chuyển dần ~55 tệp | 1 tệp, nhưng tái phát | thêm gói + vẫn chuyển 55 tệp |
B chỉ đáng dùng làm "chặn chảy máu" nếu buộc deploy trước khi làm A (xem câu Q1). C không đáng: thêm phụ thuộc mà không giải quyết căn / ô điểm.
Rule ui-ux-pro-max: `number-tabular`, `visual-hierarchy`, `font-scale`, `whitespace-balance`, `horizontal-scroll`, `truncation-strategy`.

**6. Ảnh hưởng khu vực khác (cùng cấu trúc toàn web).** 53 tệp có `<table>` + ~10 danh sách dạng lưới div (`BangCanHoTro`, `BangLoTrinhTiep`, `DongThoiGian`, `ClassYThucCard` khung trái, `PhoiHopSosSection`, `WorkList`, `KhoiCanQuyet`, `TongQuanQl` dòng việc, `HoTroHocVienTab`, `GocLichThi`) + 5 tệp lưới ARIA div (`BanGiaoPanel`, `TransitionPanel`, `MockDetailPage`, `ChuyenLopPanel`, `GocLichThi`). Đã đo lệch: lưới MT (6 lối vào), Tổng hợp, Học viên & Lớp (1 280), Đang SOS, lưới lớp thường, Phân tích Test + SOS, Tổng quan Lớp cần chú ý. Quét tĩnh còn nghi: `PhanTichGiaoVien`, `BangDiemLopThuong`, `CatalogAdmin` [GIẢ THUYẾT — kiểm bằng `do-bang` khi chuyển].

**7. Trình tự triển khai.**

| PR | Nội dung | Tệp ≈ | Trước / sau |
|---|---|---|---|
| **BANG-0** (thuộc NEN, vòng 1 §10.6) | `ui/Bang.tsx`, `ui/ODiem.tsx`, CSS `[data-kieu]` + baseline + hàng 44/64, bỏ `index.css:267`, `bang.tests.ts`, `scripts/do-bang.mjs`, bảng mẫu `/dev/thanh-phan`; cập nhật DESIGN.md (thang + kiểu cột) | 6–8 | sau GĐ0, cùng NEN chữ / màu; chủ SP duyệt bảng mẫu |
| **BANG-1** | lưới điểm: `LuoiFT`, `HopNhapDiem` (`ODiemMt`), `LuoiChamLop` (công cụ ra ngoài), `DiemTheoLop`, `MotKyNang`, `LuoiThuong`, `KhoiNo` → sửa cùng lúc 6 lối vào | ~7 + viết lại ~40 phép kiểm đọc chuỗi | **khuyến nghị trước deploy** (lỗi chủ SP nhắc nhiều nhất; không đổi bố cục, đã có mockup 6 khung 3) |
| M3 Hồ sơ lớp | `ClassRoster`, `BangGopYTuan`, `BangCanHoTro`, `PhanTichLopTab`, `BangKqdrLopFt`, Ý thức (V6) | ~12 | GĐ2 |
| M4 Học viên & Lớp | `StudentsPage` (bỏ bảng tiêu đề tách — `Bang` dính đầu cột cho nhóm), `BangHocVienLop`, `BangSos`, `BangCanLam`, `HocVienTheoVai` | ~6 | GĐ2 |
| M5 Test | `HangLop`, `LopKeHoach`, `LuoiKeHoach`, `XepTheoHocVien`, `NganXep*` | ~8 | GĐ2 |
| M6 Phân tích | `TongHopTestSos`, `KetQuaThi`, `PhanTichGiaoVien`, `HieuQuaPa`, `YThucPhoiHop`, `BaoCao` | ~6 | GĐ2 |
| M7 + phần còn lại | Tổng quan, Công việc, Tutor, Quản trị, Hồ sơ GV, hồ sơ HV, panel có bảng | ~25 | GĐ2–GĐ3; BANG-2/3 hết danh sách miễn = xong |

**8. Cần chủ SP xác nhận.** Q1 (BANG-1 trước deploy?) · Q2 (cột điểm căn giữa hay trái theo mockup 6 khung 3?) · Q3 (luật "đã có trong mockup thì không cần mockup mới" áp cho BANG-0/1 — chỉ duyệt bảng mẫu + ảnh cặp?).

---

## V2. Ô điểm — 7 cấu trúc, chữ phụ đè, ký hiệu sau số — [I.7 ĐÃ CHỐT — phải sửa] [ĐÃ KIỂM] · P1 · mọi vai

**1. Vấn đề.** Ảnh 4: "7.0 ✓" có "30 câu" dồn phải sát đáy hộp (khe **1 px**: đáy hộp y 2 711,3 → chữ y 2 712,3); W1/W2 "7.0" thấp hơn L/R 6,9 px và nhỏ hơn (12 vs 13 px); W chữ trơn trong dải xám; S hộp "5.0 ✗"; Kỳ vọng / Overall 15 px đậm 800. GV 10 thấy thêm "thiếu nhận xét" thành dòng 3 (`gv10-lop4-hv-p1`). Học viên & Lớp: W "7.0 ✓" + "7.0 · 7.0" 11 px **xuống 2 dòng** trong cột 61 px → ô 3 dòng (ảnh 1). 375: "W" và "7.0" tách hai dòng (`gv7-lop3-hv-375-p1`).

**2. Nguyên nhân — kiểm kê mọi kiểu ô điểm** (bổ sung bảng 19 nơi ở phụ lục v1-nen-chung §B1, ở đây chỉ phần cấu trúc / căn):

| # | Kiểu ô | Tệp:dòng | Cấu trúc DOM | Cỡ | Căn trong `td` | Ký hiệu | Chữ phụ | Dùng ở |
|---|---|---|---|---|---|---|---|---|
| 1 | `ODiemMt` sửa được | `fasttrack/HopNhapDiem.tsx:172-187` | `span.inline-flex.flex-col.items-end` > `button.btn.btn-sm` (viền, cao 30) + `SoCau` + `ChuThieu` + `DongDau` | L/R/S 13 đậm; W1/W2 12 | phải (`td text-right`, `LuoiFT.tsx:371,396`) | sau số (`DauKetQua`) — W1/W2 **không** | "n câu" 11 px phải (`:140-143`); "thiếu nhận xét" 12 px `text-soon` phải (`:125-133`); "vắng lần n" 12 px | lưới MT ở 6 lối vào, `MockDetailPage`, `HangLichMt`, `PanelChamSpeaking` |
| 2 | `ODiemMt` chỉ đọc | `HopNhapDiem.tsx:155-171` | `span` chữ trơn + cùng các dòng phụ | 12–13 | phải | sau số | như trên | như trên (ô của người khác / đã hoàn tất) |
| 3 | Dấu lưu ô `DauO` | `LuoiFT.tsx:477-492` | `absolute bottom-0.5 right-1` 11 px | 11 | góc dưới phải — **đè lên vùng chữ phụ** khi có "30 câu" [GIẢ THUYẾT: cần ảnh lúc đang lưu] | — | — | lưới MT |
| 4 | Cột W tổng | `LuoiFT.tsx:380-389` | `span.inline-flex` số + ✓ | 13 đậm | phải, nền `surface-2` | sau | — | lưới MT |
| 5 | Kỳ vọng / Overall | `LuoiFT.tsx:97-98, 404-405` | chữ trơn | 15 / 800 | phải, nền nhấn | Overall không so | — | lưới MT |
| 6 | `Band` + `Stack` | `students/ClassRoster.tsx:335-367, 280-298` | `td p-0` > `span.flex-col.items-end.px-2.py-1.5` > hàng h-6 / h-[18px] | 13 đậm (mốc mới) / 12 xám (mốc cũ) | phải, đệm 8 (khác 12 của mọi ô) | sau số; W1/W2 không | mốc cũ = hàng con | Tổng hợp hồ sơ lớp |
| 7 | `ODiemFt` | `students/BangHocVienLop.tsx:59-71, 246` | `span.inline-flex` + `span.block` 11 px "W1 · W2" | 12 đậm (đo) | giữa (`td text-center`) | sau | "W1 · W2" 11 px, xuống dòng | Học viên & Lớp |
| — | Khác (đã kê ở v1 §B1): `ODiemLon` 28 px, `KetQuaThi` ✓ 11 px, `StudentDetailPage` link xanh, `SkillBoard` chip nền, `LuoiThuong` / `BangDiemLopThuong` / `MotKyNang` / `PhanTichGiaoVien` | | | | | | | |

Gốc: mỗi PR tự dựng ô (OV-4b hộp nút, OV-15b "band trước, số câu dưới", OV-12b "thiếu nhận xét dưới số", PR-HSM cột W) và **không** có một mẫu ô; ký hiệu đặt **sau** số nên vị trí số đổi theo có / không ký hiệu; ô có 1–3 dòng + căn giữa dọc (V1-R4). Lệch mockup 6 khung 3 (V1-R8).

**3. Ảnh hưởng.** Đọc nhanh "em này L đạt, R đạt, S trượt" phải nhảy mắt lên xuống 7–20 px trong một hàng; số câu và "thiếu nhận xét" chen vào vùng điểm làm hàng cao 64–76 px; ở Học viên & Lớp hàng em tới 100 px. Màu chỉ ở ký hiệu 12 px (vòng 1 đã chốt tô chính con số — I.3).

**4. Phương án [ĐỀ XUẤT] — một `ODiem` cho mọi nơi hiện điểm band.**
- Cấu trúc một dòng: `[ký hiệu 13 px] [khe 4] [số 15 / 700 tabular]` trong khung rộng **cố định 56 px** (chỉ đọc) hoặc hộp **64 × 32 px** (sửa được) — ký hiệu **trước** số như mockup 6; ô không ký hiệu (chưa có kỳ vọng / MT lịch sử) vẫn **giữ chỗ** ký hiệu → mọi số trong cột thẳng nhau. Màu số theo 3 token vòng 1 (`--kq-vuot / --kq-bang / --kq-duoi`); W1 / W2 cũng có ký hiệu (mockup 6 + Rulebook §19: Case tách W1 / W2) — xem Q4.
- Chữ phụ **một** dòng 12 px, cách hộp 4 px, căn **cùng mép với số**; thứ tự ưu tiên (chỉ hiện một): "thiếu nhận xét" (việc) > "vắng lần n" > "n câu". Hàng nào có chữ phụ → cả hàng cao 64 px, đường cơ sở dòng chính vẫn chung (V1-4c).
- Dấu lưu (… / ✓ / Lưu lại) ở **góc trên phải** hộp, không đè chữ phụ, không đổi chiều cao.
- Ô trống sửa được: hộp viền đứt 64 × 32 (mockup 6 `.o-can`); ô trống không phải của tôi: để trống.
- Học viên & Lớp: bỏ dòng "W1 · W2" dưới W (đưa vào `title` + hộp "Vì sao SOS"); ô một dòng.
- Một hàm `ODiem` thay 7 kiểu ở bảng trên + `KetQuaThi`, `StudentDetailPage` tab Test, `ODiemLon` dùng cùng ký hiệu / màu (cỡ riêng).

**5. Vì sao tốt hơn.** So "giữ 3 dòng, chỉ căn lại" (phương án vá): vẫn hàng 76 px, vẫn lệch khi có / không ký hiệu. `ODiem` một dòng + ký hiệu trước: hàng 44–64 px, số thẳng theo cột và theo hàng, đúng mockup 6 đã duyệt, màu nằm trên con số (I.3). Rule `number-tabular`, `color-not-decorative-only` (vẫn có ✓ / ✗).

**6. Ảnh hưởng khu vực khác.** 19 nơi hiện điểm (v1 §B1) + hộp nhập (`HopNhapDiem` phần xem trước), thẻ 375 (`TheDong`), Đang SOS, Phân tích Kết quả thi, hồ sơ Mock, Hành trình.

**7. Trình tự.** `ODiem` ở BANG-0; thay ô ở BANG-1 (lưới) rồi theo màn M3 (Tổng hợp), M4 (Học viên & Lớp), M6 (Kết quả thi), hồ sơ HV / Mock khi làm lại màn đó. Cùng PR với 3 token màu kết quả của NEN.

**8. Cần xác nhận.** Q2 (căn giữa hay trái), Q4 (W1 / W2 có ✓ / ✗ như mockup 6?), Q5 (chữ phụ ưu tiên "thiếu nhận xét" > "vắng" > "n câu", chỉ một dòng?).

---

## V3. Nhập điểm MT ngay trên hồ sơ lớp — [II.1 ĐÃ CHỐT workflow] [ĐÃ KIỂM hiện trạng] · P1 · GVCN, GVBM, QL

**1. Vấn đề.**
- Nút "Nhập điểm" (`classes/DauTrangLop.tsx:179-180`) mở **panel toàn màn** `PanelNhapDiemLop` (`cham/PanelNhapDiemLop.tsx:21-29`, `KhungPanel rong="toan"`) chứa `DiemTheoLop` — **bản thứ hai** của lưới đang **mở sẵn** ở cuối trang (`ClassOverviewPage.tsx:48` `useState(true)`, `:145` vẽ ngoài khối tab → dưới **mọi** tab, +~2 200 px — A3-01).
- Cả hai mở **MT3** (`luotMacDinh`, `shared/domain/diemTheoLuot.ts:37-48`): 3/32 đủ điểm, 29 em tuần thi W4 OCT…W4 DEC — hàng trống không nhập được (`gv7-lop3-nhapdiem`). "Chỉ ô còn trống" tắt; nhớ bằng `localStorage` (`DiemTheoLop.tsx:29-35`). Lưới cuối trang **không** đặt con trỏ (`datConTro={false}`, `:242`).
- Hàng em chưa có lịch: "Chưa có lịch MT3 — xếp ở panel Lộ trình" (`DiemTheoLop.tsx:145-148`) — link **đổi trang** sang hồ sơ HV mở panel Lộ trình; GV không xếp được lịch MT (Rulebook §20.9: chỉ QL / QT).
- Chip "MT3 còn 35 ô trống" đếm cả ô tuần chưa tới (A3-14); chip đầu trang "78 bài chờ chấm" **đổi trang** sang Lịch Test (`DauTrangLop.tsx:121`).

**2. Nguyên nhân.** OV-15b (C16) đổi Nhập điểm thành panel nhưng không bỏ khối cuối trang (A3-01); luật chọn lượt dựa vào "tuần của lượt" chứ không vào "ô quá hạn của người xem"; luật cũ "lưới cuối trang mở sẵn" (PR-OV3a M2 §1).

**3. Ảnh hưởng (đếm thật, GV 7 nhập bài L còn thiếu).** Nay: Nhập điểm (1) → panel MT3 → chọn MT1 (1) → tích "Chỉ ô còn trống" (1) → bấm ô đầu (1) → gõ, Enter… = **4 bấm trước khi gõ + 1 panel phủ + phải nhớ lượt nào quá hạn**; hoặc cuộn ~2 000 px xuống lưới rồi 3 bấm. Hai bản lưới cùng trang → GV đọc nhầm. 375: trang 10 382–10 638 px (~13 màn).

**4. Phương án chi tiết [ĐỀ XUẤT trong khuôn ĐÃ CHỐT].**
1. **Gập mặc định**: một thanh 52 px "Điểm Mock Test · MT1 ⚠ 4 ô quá hạn · MT3 2 ô tuần này ›" (đếm **ô đã tới hạn**, theo vai: GV = ô của mình, QL = mọi ô). Chỉ ở **tab Học viên** (Q6).
2. **"Nhập điểm"** (nút đầu trang, và chip "⚠ n ô quá hạn chấm" thay "78 bài chờ chấm"): mở thanh → cuộn để thanh công cụ của lưới nằm ngay dưới đầu trang dính → **không panel**.
3. **Lượt mở sẵn**: lượt có ô **quá hạn** của người xem sớm nhất → nếu không, lượt có ô tới hạn tuần này → nếu không, `luotMacDinh` hiện tại. Tab lượt ghi "MT1 ⚠ 4", "MT3 · 2".
4. **"Chỉ ô còn trống" bật sẵn** khi mở bằng nút; nghĩa = "ô **tôi** nhập được còn trống" (GV), "mọi ô trống" (QL). Tắt bằng tay thì nhớ như hiện nay.
5. **Con trỏ**: mở luôn hộp nhập của ô trống đầu tiên (cột của tôi, hàng đầu) — gõ số câu, Enter = "Lưu · em tiếp ›" (đã có). Esc đóng hộp, lưới vẫn mở.
6. **Công cụ** (V1-4e) một hàng ngoài khung: `[MT1 ⚠4] [MT2] [MT3]  ☑ Chỉ ô còn trống        GV chấm S: … ▾ · Dán từ Excel · ?` — "GV chấm S" chỉ với người nhập ô S; "Dán từ Excel" chỉ khi có ô sửa được.
7. **Lưu từng ô** giữ luật hiện tại (`useSaveScore`): dấu ô "…" đang lưu / ✓ đã lưu / "Lưu lại" lỗi (góc trên phải — V2); chữ đã gõ không mất; đổi lượt khi còn ô đang lưu thì hỏi (đã có).
8. **Em chưa có lịch lượt này**: gom thành **một** dòng cuối "3 em chưa có lịch MT3: Hồ Gia Hân, …" — QL / QT có nút **"Xếp lịch MT3"** → hộp nhỏ chọn tuần (bậc 2, dùng lại hộp lịch Kế hoạch Test); GV chỉ thấy chữ "QL xếp lịch", không link. Ẩn khi "Chỉ ô còn trống" bật.
9. **URL** `?diem=mt:1` (thay, không thêm lịch sử) → tải lại / Quay lại từ hồ sơ HV giữ đúng lượt, đúng chỗ cuộn; gập = gỡ tham số.
10. **375**: nút Nhập điểm cuộn tới khối, hiện `MotKyNang` (một kỹ năng, ô 44 px) chọn sẵn kỹ năng của tôi.
11. **Panel `PanelNhapDiemLop` giữ** cho lối vào **ngoài** hồ sơ lớp (⋯ hàng lớp ở Học viên & Lớp, Công việc) — cùng component lưới.

**5. Vì sao tốt hơn.**

| Việc | Nay | Đề xuất |
|---|---|---|
| GV 7 nhập 20 bài L quá hạn | 4 bấm + panel + nhớ MT + 20× (gõ + Enter) | **1 bấm** + 20× (gõ + Enter) |
| QL xem lớp còn nợ bao nhiêu | cuộn xuống lưới MT3 (sai lượt) hoặc đổi trang Lịch Test | đọc thanh gập: "MT1 ⚠ 4 ô quá hạn" |
| QL xếp lịch MT3 cho 3 em | link → hồ sơ HV (đổi trang) → panel Lộ trình, × 3 em | 1 bấm "Xếp lịch MT3" + chọn tuần (hộp nhỏ) |
| Độ dài trang tab Học viên 1440 | 4 800 px | ~2 650 px (lưới gập) |
So "giữ panel, chỉ chọn đúng lượt": vẫn 2 bản lưới, vẫn phủ mất bảng học viên — trái ý chủ SP "đã có bảng trên trang thì không panel".

**6. Ảnh hưởng khu vực khác.** Cùng `DiemTheoLop` / `LuoiChamLop` ở panel Nhập điểm (Học viên & Lớp, Công việc), Test › Điểm theo lớp (route cũ), Lịch Test (lưới mở dưới hàng lớp — TST-01: áp cùng luật "chỉ ô còn trống + lượt quá hạn + con trỏ"). Chip "bài chờ chấm" ở hàng lớp Học viên & Lớp (A3-07) đổi theo cùng luật.

**7. Trình tự.** GĐ1: sửa `luotMacDinh` theo ô quá hạn của người xem + chip đếm ô đã tới hạn (lỗi chức năng, không đổi bố cục). M3 Hồ sơ lớp: gập + nút cuộn + bỏ panel ở hồ sơ lớp + dòng "chưa có lịch" + công cụ ngoài khung (sau BANG-1).

**8. Cần xác nhận.** Q6 (thanh gập chỉ ở tab Học viên hay mọi tab?) · Q7 (mở luôn hộp nhập ô đầu, hay chỉ đặt con trỏ?) · Q8 (QL xếp lịch MT ngay tại lưới bằng hộp nhỏ?).

---

## V4. Các bảng trong Hồ sơ lớp — đánh giá từng bảng — [II.1] [ĐÃ KIỂM] · P1 / P2 · QT, QL, GVCN, GVBM

**1. Vấn đề.** Trang 4 tầng điều hướng: tab (Học viên · Ý thức & Phối hợp · Phân tích lớp) → cách xem (Tổng hợp · Góp ý hàng tuần · Cần hỗ trợ · Kết quả đầu ra) → tab con (Vi phạm · Phối hợp) → (375) "Theo xử lý · Theo vi phạm". Chiều cao 1440: Tổng hợp 4 800 · Góp ý 5 036 · Cần hỗ trợ 4 448 · Kết quả đầu ra 3 026 · Ý thức 5 431 · Phối hợp 4 349 · Phân tích 3 012 px; 375: 10 382–10 638 px. Chip đầu trang khác theo vai (QT / QL "8 chờ duyệt · 78 bài chờ chấm · +1"; GV 7 "27 bài chờ chấm · ⚠ 7 việc quá hạn"; GV 10 "2 bài chờ chấm").

**2–4. Từng bảng — hiện trạng → nguyên nhân → đề xuất.**

| Bảng | Hiện trạng (đo / ảnh) | Đề xuất |
|---|---|---|
| **Tổng hợp** (`ClassRoster`) | 12 cột, 33 hàng 46–71 px; điểm lệch 17–23 px, số cùng cột ±16 px; "Thiếu n" ở 30/33 em (A3-04); chip "Chưa có kết quả" / "Không tính SOS" lặp; cột "Đợt" chồng 2–3 mốc; cột ⋯ 154 px cho nút 28 px; "Theo dõi" bấm → **đổi trang** hồ sơ HV / Test (`thaoTacDongHocVien.tsx:58-66`) (`qt-lop3-hv-p1`) | `Bang`: Học viên (`ten`, dòng phụ: chip SOS) · Target · Dự kiến thi · MT gần nhất (`tuan`) · OVR L R W S (`diem`, chỉ mốc mới; mốc cũ mở rộng hàng) · Việc tiếp (`viec`, mở tại chỗ) · ⋯. Hàng 44 px (một dòng); "Thiếu n" → một số ở đầu bảng + lọc (A3-04) |
| **Góp ý hàng tuần** (`BangGopYTuan`) | 33 em × 4 ô nhập viền đứt = 132 ô trống; tiêu đề 2 dòng "L / Trần Ngọc Hà"; chip "Chưa có kết quả" lặp (`qt-lop3-gopy-p1`) | GV chỉ thấy **cột môn mình** để nhập, cột khác chỉ đọc gập ("+3 môn"); QL / GVCN thấy đủ; tự lưu từng ô (đã có); bỏ chip kết luận ở cột tên |
| **Cần hỗ trợ** (`BangCanHoTro`, lưới div) | tiêu đề cột IN HOA 11 px tách khỏi thẻ bởi thanh phân trang (A3-28); thẻ em giống hệt nhau (`qt-lop3-canhotro-p1`) | `Bang` có hàng nhóm theo em (hàng nhóm 40 px, hàng con theo kỹ năng); phân trang dưới tiêu đề bảng chứ không chen giữa |
| **Kết quả đầu ra 1 đợt** (`BangKqdrLopFt`) | lớp FT hiện "Kết quả đầu ra BE · MB BE 04" (2 em đến từ lớp BE) — tên cách xem khó hiểu | đổi chữ "Kết quả lớp trước" khi lớp là FT [ĐỀ XUẤT — hỏi Q9] |
| **Phân tích lớp** (`PhanTichLopTab`) | 5 hàng kỹ năng × MT1–MT5 "6/11" không chú thích (A3-21); căn thẳng | giữ; thêm tiêu đề cột "đạt / có điểm"; `Bang` kiểu `so` |
| **Lưới Điểm MT** (`LuoiFT`) | V1, V2, V3 | V1–V3 |
| **Ý thức & Phối hợp** | V6, V7 | V6, V7 |
| **Đầu trang** (`DauTrangLop`) | chip dẫn sang 3 trang khác (A3-07) | V5 |

**5. Vì sao tốt hơn.** Mỗi bảng một dòng mỗi em, căn theo kiểu cột → Chị Vy dò một em trên 1 hàng; trang Tổng hợp ước 4 800 → ~2 650 px (lưới gập + hàng 44 px); 4 tầng điều hướng → 3 (bỏ tab con Ý thức — V6).

**6. Khu vực khác.** Cùng bảng em ở Học viên & Lớp (M4), Đang SOS, hồ sơ GV "Kết quả gần nhất của lớp".

**7. Trình tự.** M3 Hồ sơ lớp, sau BANG-0/1; cần mockup cập nhật mockup 1 khung 4 + mockup 6 khung 2 cho bố cục mới của Góp ý / Cần hỗ trợ (đổi bố cục).

**8. Cần xác nhận.** Q9 (đổi tên "Kết quả đầu ra 1 đợt" ở lớp FT) · Q10 (Góp ý: GV chỉ nhập cột môn mình, cột khác gập).

---

## V5. "Đã có trên trang thì làm ngay đó" — kiểm kê toàn web — [II.1 mở rộng] [ĐÃ KIỂM mã] · P1 · mọi vai

**1. Vấn đề.** Nhiều nút đổi trang hoặc mở panel trong khi nội dung cần làm **đã có trên trang** hoặc làm được bằng hộp nhỏ.

**2. Bảng kiểm kê** (bậc theo thang vòng 1 §10.3: 0 xem · 1 một bấm · 2 hộp nhỏ / mở dưới hàng · 3 khung phải · 4 panel rộng thay khung · 5 trang riêng):

| # | Chỗ | Hiện làm gì (tệp:dòng) | Đề xuất | Bậc nay → sau |
|---|---|---|---|---|
| 1 | Hồ sơ lớp · nút **Nhập điểm** | panel toàn màn, bản thứ 2 của lưới (`DauTrangLop.tsx:179-180`) | cuộn + mở lưới trên trang (V3) | 4 → **0/1** |
| 2 | Hồ sơ lớp · chip **"78 bài chờ chấm"** | đổi trang Lịch Test (`DauTrangLop.tsx:121`) | như #1, chip đếm ô đã tới hạn | 5 → 1 |
| 3 | Hồ sơ lớp · chip **"⚠ 7 việc quá hạn"** (GV) | đổi trang `/hoc-vien?view=qua-han&classId=` (`:120`) | lọc bảng Tổng hợp tại chỗ: chỉ em có việc quá hạn, xếp lên đầu (cột Việc tiếp đã có) | 5 → 1 |
| 4 | Hồ sơ lớp · chip **"Thiếu n thông tin"** | đổi trang `/hoc-vien?view=thieu_tt` (`:126`) | mở "Sửa thông tin" (đã có ở trang) lọc em thiếu | 5 → 4 |
| 5 | Hồ sơ lớp · chip **"8 chờ duyệt"** (QL) | đổi trang Công việc › Chờ duyệt (`:123`) | khung phải "Chờ duyệt · lớp này" (cùng thành phần hàng đợi Tổng quan B) | 5 → 3 |
| 6 | Hồ sơ lớp · cột **Theo dõi** "Xử lý vi phạm" | đổi trang hồ sơ HV tab Ý thức (`thaoTacDongHocVien.tsx:64`) | chuyển tab Ý thức của **lớp**, chọn em, mở hàng (V6) | 5 → 2 |
| 7 | Hồ sơ lớp · cột **Theo dõi** "Nhập điểm L, R · MT1" | đổi trang Test (`nhapDiemCua`) | cuộn + mở lưới đúng lượt / ô (V3) | 5 → 1 |
| 8 | Lưới MT · **"xếp ở panel Lộ trình"** | đổi trang hồ sơ HV + panel (`DiemTheoLop.tsx:147`) | QL: hộp nhỏ chọn tuần; GV: chữ (V3-8) | 5 → 2 |
| 9 | Hồ sơ lớp · cột **Đợt** "MT3" | đổi trang hồ sơ HV `?dot=` (`ClassRoster.tsx:265-266`) | mở rộng hàng: điểm 4 kỹ năng + nhận xét của lượt; "Hồ sơ ↗" tách riêng | 5 → 2 |
| 10 | Hồ sơ HV · **"Ghi nhận 1 vi phạm"** | hiện 3 chỗ: thanh "VIỆC CỦA TÔI" đầu hồ sơ + thanh trong tab (`StudentYThucSection.tsx:136-138, 187-219`) + nút trên dòng vi phạm (`:114`) | giữ thanh đầu hồ sơ + nút trên dòng; bỏ thanh trong tab (V8) | 1 (×3) → 1 (×2) |
| 11 | Lịch Test · **"Mở lưới đầy đủ ↗"** | đổi trang `/nhap-diem` khi lưới đã mở dưới hàng (TST-02, TST-11) | nút "Cả lớp · mọi cột" bật cột ẩn tại chỗ | 5 → 1 |
| 12 | Công việc · panel nhập điểm · link **↗** | rời sang Test (CV-04) | bỏ link; "Cả lớp" tại chỗ (đã có `nutCaLop`) | 5 → 1 |
| — | Giữ (đúng bậc): ⋯ hàng lớp "Nhập điểm" ở Học viên & Lớp (bậc 4 — lưới không có trên trang) · "Xác nhận xử lý" (bậc 3 — form 4–6 ô) · "Ghi nhận" (bậc 1 + Bỏ ghi nhận) · tên em → hồ sơ (bậc 5 xem) | | | |

**3. Ảnh hưởng.** Mỗi lần đổi trang mất bộ lọc / vị trí cuộn, Quay lại phải tìm lại lớp; GV 5 lớp (Cô Linh) đổi trang ~6–10 lần mỗi buổi chỉ để làm việc đã thấy trên trang.

**4–5. Phương án + vì sao.** Luật: "nội dung đã có trên trang → bậc 0–2 tại chỗ; không có → bậc 3 khung phải; chỉ bậc 5 khi xem hồ sơ" (đã đề xuất vòng 1, ở đây là danh sách cụ thể). Ví dụ #3: nay 1 bấm + đổi trang + Quay lại (mất tab / cuộn) → 1 bấm, 0 đổi trang.

**6. Khu vực khác.** Hàng lớp Học viên & Lớp (chip "8 chờ duyệt", "78 bài chờ chấm", "+1" — A3-07), Tổng quan (vòng 1), Lịch Test hộp → menu → panel (TST-16).

**7. Trình tự.** #2–#4, #6–#7 cùng M3 (hồ sơ lớp); #9 cùng BANG-1 (mở rộng hàng); #10 cùng V8; #11–#12 cùng M5 / CV-LOI.

**8. Cần xác nhận.** Q11 (#5 — khung phải Chờ duyệt lọc lớp ngay ở hồ sơ lớp, hay chỉ ở Tổng quan?).

---

## V6. Ý thức & Phối hợp của Hồ sơ lớp — thiết kế lại — [II.2] [ĐÃ KIỂM] · P1 · GVCN, QL, GVBM

**1. Vấn đề** (`qt-lop3-yt-p1/p2`, `gv7-lop3-yt-375-p1`).
- Hai khung: trái = em theo 5 nhóm (QUÁ HẠN · BẮT BUỘC XỬ LÝ · CHỜ QL DUYỆT · MỚI, CHƯA GHI NHẬN · ĐÃ XỬ LÝ — tiêu đề IN HOA 11 px); phải **mặc định** "Vi phạm của lớp" = dòng thời gian **45 vi phạm** từ 24/08, phần lớn "Đã xử lý · Report 5 / WL 1 / Meeting" (A3-15). Muốn thấy việc của một em phải bấm em → khung phải đổi sang Thang + vi phạm của em.
- Phối hợp SOS ở **tab con khác** → xem đủ tình trạng một em phải đổi tab; trang phải 5 431 px (Ý thức ≈ 2 800 px + lưới điểm ≈ 2 200 px).
- Khung trái không có nút: phải bấm em rồi mới có "Xác nhận xử lý". Năm kiểu nhãn trạng thái trên một danh sách (Mới viền · ✓ Đã ghi nhận chữ · Cần xử lý vàng nền · Chờ QL duyệt xám · Quá hạn n ngày cam nền) — "Quá hạn" là chip nền, trái DESIGN.md §5 nghĩa 4 "quá hạn chỉ chữ + ⚠".
- 375: 3 tầng tab (tab chính · Vi phạm / Phối hợp S… **bị cắt** dưới "Chọn nhiều" · Theo xử lý / Theo vi phạm).
- Rulebook §19: hồ sơ lớp "mặc định xem **theo học sinh**" — khung phải mặc định theo **vi phạm**.

**2. Nguyên nhân.** Thiết kế M6 / PR-YT4 (27/09) đặt dòng thời gian cả lớp làm mặc định; Phối hợp tách tab con theo §19 (vốn để tách khái niệm, không bắt buộc tách màn); mỗi PR sau (OV-7a Bỏ ghi nhận, OV-13d Chọn nhiều, OV-12e) thêm nút, không thu gọn.

**3. Ảnh hưởng — impeccable critique.**
- Tải nhận thức **6 / 8 trượt**: single focus ✗ (dòng thời gian + danh sách + lưới) · chunking ✓ (nhóm trái) · grouping ✗ (thông tin một em nằm ở 3 chỗ) · hierarchy ✗ (45 dòng cùng trọng lượng) · one-thing ✓ · minimal choices ✗ (3 tầng tab + 4–5 nút / em) · working memory ✗ (nhớ tình trạng vi phạm khi sang tab Phối hợp) · progressive disclosure ✗ (đã xử lý hiện mặc định).
- Persona **Cô Linh** (GVCN 5 lớp, điện thoại): mở 5 lớp × 3 tầng tab; tab Phối hợp bị cắt ở 375; 9 nút "Xác nhận" xanh giống nhau. **Chị Vy** (QL): đọc được nhóm trái nhưng không thấy "ai chờ mình duyệt" khác "ai GVCN chưa làm".
- Đếm bước (từ hồ sơ lớp, desktop):

| Việc | Nay |
|---|---|
| Ghi 1 vi phạm | tab Ý thức (1) → + Ghi vi phạm (1) → chọn em (1) → nhóm (1) → gõ → Lưu (1) = **5 bấm**, 1 panel |
| Xử lý vi phạm quá hạn (Phạm Bảo Ngọc) | tab (1) → bấm em (1) → Xác nhận xử lý (1) → gõ mô tả → Xác nhận (1) → Xong (1) = **5 bấm**, 1 panel |
| Xác nhận 1 việc phối hợp SOS | tab (1) → tab con Phối hợp (1) → dò 6 thẻ ~1 700 px → Xác nhận (1) → Lưu (1) = **4 bấm + dò** |
| Xem nhanh tình trạng một em | tab (1) → bấm em (1) → tab con Phối hợp (1) → tìm thẻ; hoặc sang hồ sơ HV = **3–4 bấm, 1 đổi trang** |

**4. Phương án — so 3 [ĐỀ XUẤT].** Giữ nguyên nghiệp vụ (Rulebook §20.3, §19, §20.9): thang 6 bậc; Ghi nhận biến mất khi bắt buộc; WL 3 / ngoài thang qua QL duyệt; hạn 5 ngày; Phối hợp: GVCN xác nhận hoặc bỏ kèm lý do, không hạn (trừ meeting CX 5 ngày), **không phải vi phạm / biện pháp** (cột và nhãn riêng); Sửa · Đưa lại Cần xử lý · Khôi phục; Chọn nhiều (lô).

- **A. Một bảng theo em, việc ngay trên hàng, mở rộng tại chỗ (khuyến nghị).**
  ```
  Ý thức & Phối hợp · MB FT 101                                              [+ Ghi vi phạm]
  [Cần làm · 8 em] [Tất cả em · 33] [Nhật ký vi phạm]        Nhóm vi phạm ▾      Chọn nhiều
  Học viên        Việc cần làm                         Hạn                 Vi phạm 2 tuần   Thang          Phối hợp SOS   
  Vũ Hải Đăng     Ghi nhận / xử lý 1 vi phạm chưa xem  ⚠ quá hạn 6 ngày    1 · Chuyên cần   → Report 1     —              [Ghi nhận] ▸
  Phạm Bảo Ngọc   Xử lý · Report 2                     ⚠ quá hạn 1 ngày    3 · BTVN +2      R1 › Report 2  —              [Xử lý] ▸
  Lê Quang Huy    Xử lý · Report 1 (bắt buộc)          hôm nay             3                → Report 1     —              [Xử lý] ▸
  Lương Gia Bảo   Chờ QL duyệt WL 3                    hạn QL 15/09        2                WL 2 › WL 3    —              ▸
  Đỗ Minh Khôi    Xác nhận: GVCN meeting với HV        —                   2 · đã ghi nhận  —              SOS 2 · 1/2    [Xác nhận] ▸
  Hoàng Bảo Ngọc  Xác nhận: Trao đổi ngắn với HV +1    —                   —                —              SOS 1 · 0/2    [Xác nhận] ▸
  ```
  - Mặc định "Cần làm": chỉ em có việc (vi phạm mở hoặc phối hợp chưa xong), xếp **quá hạn → bắt buộc → hôm nay → chờ QL → mới → phối hợp**. "Tất cả em" để tra; "Nhật ký vi phạm" = dòng thời gian hiện tại (gập, lọc nhóm).
  - **Một nút chính mỗi hàng** = động từ của việc tiếp (Ghi nhận · Xử lý · Đã thực hiện · Xác nhận); GVBM không có nút (chỉ + Ghi vi phạm). Ghi nhận = bậc 1 + Hoàn tác; Xử lý = panel `XacNhanXuLy` (bậc 3, đã có); Xác nhận phối hợp = form ngay dưới hàng (bậc 2, đã có).
  - ▸ mở rộng tại chỗ (một hàng một lúc): 3 cột — Thang (một dòng + "Xác nhận xử lý" · "Đề xuất QL duyệt") · Vi phạm chưa xong (ngày · vi phạm · người ghi · Ghi nhận) + "n vi phạm đã xử lý ▾" · Việc phối hợp (việc · trạng thái · Xác nhận / Bỏ ▾ · Sửa · Đưa lại Cần xử lý) + "+ Thêm việc".
  - Quá hạn = chữ cam + ⚠ (không chip nền); nhóm trạng thái bằng **thứ tự + chữ hạn**, không thêm tiêu đề nhóm in hoa. Chip SOS (component chung) cạnh tên khi em có SOS.
  - 375: mỗi em một thẻ: tên + chip SOS / việc + hạn / nút chính rộng hết; chạm ▸ → chi tiết toàn màn + "‹ Quay lại". Không còn tab con.
- **B. Giữ hai khung, sửa.** Khung trái thêm động từ + nút trên mỗi em; khung phải mặc định là em đầu nhóm Quá hạn (không phải dòng thời gian lớp); Phối hợp vào chi tiết em; bỏ tab con.
- **C. Giữ hai tab con, chỉ gọn từng tab.** Vi phạm: mặc định chỉ chưa xong, gom theo em; Phối hợp: thẻ → bảng việc một dòng.

**5. Vì sao A tốt hơn.**

| Tình huống | Nay | **A** | B | C |
|---|---|---|---|---|
| Ghi 1 vi phạm | 5 bấm | 5 (hoặc 4 từ ▸ em — em điền sẵn) | 5 | 5 |
| Xử lý vi phạm quá hạn | 5 bấm | **3** (tab, Xử lý, Xác nhận; "Xong" thay bằng toast + "Đính kèm tệp") | 4 | 5 |
| Xác nhận 1 việc phối hợp | 4 + dò ~1 700 px | **3**, 0 dò (hàng ghi tên việc) | 4 | 4 |
| Xem nhanh một em | 3–4 + 1 đổi trang | **1–2** (đọc hàng / ▸), 0 đổi trang | 2 | 3 |
| Chị Vy: ai quá hạn, ai chờ mình | đọc nhóm trái | đọc cột Việc + Hạn (chờ QL ghi "hạn QL") | như A | như nay |
| Chiều cao phần Ý thức 1440 | ~2 800 px | **~700 px** (8 hàng × 56 + đầu) | ~1 200 | ~1 400 |
| Đúng §19 "mặc định theo học sinh" | không | **có** | có | một phần |
A thắng vì việc, hạn và nút nằm **trên cùng một hàng em** (không phải bấm em mới biết làm gì), cùng ngôn ngữ "hàng → mở rộng tại chỗ" với Tổng quan B / Lớp cần chú ý (vòng 1 §10.2–10.3), và bỏ được một tầng tab. B kém hơn ở việc phải bấm từng em; C giữ tầng tab và tách thông tin một em.
Rule: `visual-hierarchy`, `content-priority`, "Bulk Actions" (giữ Chọn nhiều), progressive disclosure (Nhật ký gập).

**6. Ảnh hưởng khu vực khác.** Hồ sơ HV (V8, cùng thành phần); Phân tích › Ý thức (bảng "Học viên cần chú ý" — cùng cột Việc / Hạn); Công việc nhóm "Ý thức" (cùng chữ động từ); Tổng quan "Cần bạn quyết" (thẻ Chờ QL duyệt WL 3).

**7. Trình tự.** Mockup mới (lớp 1440 tối + 375 sáng: trạng thái trống, nhiều em, quá hạn, chờ QL, Chọn nhiều, lỗi lưu) → chủ SP duyệt → làm trong **M3 Hồ sơ lớp** (sau BANG-0); dùng lại `XacNhanXuLyPanel`, `ConfirmCoordinationForm`, `ThangYThuc`, `NhanViPham` (đổi chip Quá hạn thành chữ).

**8. Cần xác nhận.** Q12 (A thay hai tab con — Rulebook §19 có ghi "hai sub-tab"; đây là cách trình bày, không đổi luật) · Q13 (mặc định "Cần làm", dòng thời gian thành "Nhật ký" gập).

---

## V7. Phối hợp SOS — các nhóm giống nhau, không thấy cái quan trọng — [II.3] [ĐÃ KIỂM] · P1 · GVCN

**1. Vấn đề** (`qt-lop3-ph-p1`, `gv7-lop3-ph-375-p2` = ảnh 3). 6 thẻ cùng nền `surface-2`, cùng viền, cùng bố cục; đầu thẻ 3 cột (tên + "MT2 · SOS 2 · Speaking · Writing Task 2" | "1/2 việc hoàn thành" + câu **"Học thuật theo dõi ở bảng kỹ năng" lặp ở mọi thẻ** | chip "Đang làm" xám). Mức SOS chỉ là chữ, không dùng `ChipSos`. Trong thẻ: 9 việc chờ → **9 nút "Xác nhận" màu nhấn** + 9 "Bỏ ▾", "+ Thêm việc" ở mọi thẻ; việc đã xong cùng cỡ với việc chờ. 375: thẻ ~360 px mỗi em, tên việc xuống 2 dòng vì nút chiếm nửa ngang. Phối hợp chiếm ~1 700 px (1440) / 5 692 px cả trang (375).

**2. Nguyên nhân.** `TheSos` (`PhoiHopSosSection.tsx:69-130`) một khuôn cho mọi lượt, không phân cấp em ↔ việc; `ActionRow` (`:136-201`) đặt nút chính ở mọi việc chờ; dòng phụ cố định (`:104`); chip trạng thái thẻ trùng nghĩa với "x/y việc hoàn thành".

**3. Ảnh hưởng.** Không biết em nào gấp hơn (SOS 2 vs SOS 1 cùng trọng lượng), việc nào cần làm trước; "Xác nhận" ×9 làm mất nghĩa nút chính; cuộn dài.

**4. Phương án [ĐỀ XUẤT].** Trong A (V6) Phối hợp không còn thẻ riêng: là cột "Phối hợp SOS" + phần mở rộng của hàng em. Luật thị giác áp cho mọi "nhóm lặp" (cả khi giữ thẻ):
- **Cấp em** (đầu nhóm): tên 15 / 700 + `ChipSos` (viền màu theo mức, có kỹ năng) + một dòng "MT2 · W2 SEP"; nền `surface`; xếp **SOS cao trước**, rồi việc lâu nhất.
- **Cấp việc** (con): thụt 16 px, 14 / 400, nền `--hang-con-bg`, đường kẻ 1 px; trạng thái là **ký hiệu + chữ** ở cột cố định: "○ Cần làm" · "✓ Xong 13/09 · Trần Ngọc Hà" · "– Đã bỏ: lý do".
- **Nút**: chỉ việc chờ **đầu tiên** của em có nút chính "Xác nhận"; việc chờ khác nút viền; "Bỏ ▾" là nút chữ. Việc đã xong gập "✓ 1 việc đã xong ▾" (Sửa · Đưa lại Cần xử lý trong đó).
- Bỏ câu "Học thuật theo dõi ở bảng kỹ năng" (đưa vào ⓘ ở tiêu đề cột); bỏ chip "Đang làm" (đã có "1/2").
- "+ Thêm việc" chỉ trong phần mở rộng của em.

**5. Vì sao tốt hơn.** So "giữ thẻ, đổi màu thẻ theo mức SOS": màu nền thẻ lại thành nghĩa thứ sáu (trái 5 nghĩa màu DESIGN.md), vẫn 9 nút chính. Đề xuất phân cấp bằng **cấu trúc** (thụt, cỡ, đường kẻ) + **chữ** (ký hiệu trạng thái) + **một** màu (chip SOS) → nhìn 2 giây biết em nào, việc gì, còn gì. Nút chính 9 → ≤ 6 (một / em). Chiều cao ~1 700 → ~450 px (6 hàng em, việc gập).

**6. Ảnh hưởng khu vực khác — nhóm "giống nhau quá" cùng gốc:** Cần hỗ trợ (`BangCanHoTro`, thẻ em giống nhau — V4); Lịch Test khối 1 "8 nút chính giống nhau, chip Chờ chấm mọi dòng" (TST-17); Kế hoạch Test chip dày ký hiệu (TST-06); Tổng quan "Cần bạn quyết" (A1 / vòng 1 §10.2); Công việc nhóm việc (phụ lục a2); hồ sơ HV 4 ô tóm tắt cùng dáng.

**7. Trình tự.** Cùng V6 (M3); hồ sơ HV cùng lúc (V8) vì dùng chung `PhoiHopSosSection`.

**8. Cần xác nhận.** Q14 (chỉ một nút chính / em; việc chờ khác nút viền).

---

## V8. Ý thức & Phối hợp của Hồ sơ HV — [III.1] [ĐÃ KIỂM] · P1 · GVCN, QL

**1. Vấn đề** (`gv7-hv1-yt-p1`, `gv7-hv1-yt-375-p*`). Một việc "Ghi nhận 1 vi phạm mới" hiện **3 chỗ** trên một màn: thanh "VIỆC CỦA TÔI · Ghi nhận 1 vi phạm mới hạn 16/09 [Ghi nhận]" đầu hồ sơ; thanh trong tab "1 vi phạm chưa xem · hạn 16/09 [Ghi nhận 1]"; nút "Ghi nhận" trên dòng vi phạm. Khối Thang có **nút chính "Xác nhận xử lý"** trong khi việc thật là Ghi nhận (hai nút chính tranh nhau). Ô "Ý thức · bậc đã xử lý WL 1" ở dải 4 ô đầu hồ sơ lặp Thang. Hai tab con Vi phạm / Phối hợp; dòng thời gian trộn vi phạm + lần xử lý có chữ "XỬ LÝ" in hoa 11 px; 375: 3 174 px.

**2. Nguyên nhân.** `StudentYThucSection.tsx:136-142` vẽ `ThanhViec` + `ThangYThuc` (nút chính cố định `ThangYThuc.tsx:64-69`) không xét việc hiện tại; thanh đầu hồ sơ (`DauHoSo` / `ThanhViec` của trang) do PR khác thêm (K3, OV-13) — không ai gỡ bản trong tab.

**3. Ảnh hưởng.** Người mới không biết bấm nút nào; tình trạng một em (bậc · vi phạm mở · phối hợp) nằm ở 2 tab con.

**4. Phương án [ĐỀ XUẤT] — cùng ngôn ngữ với V6, mật độ một em.**
```
Ý thức & Phối hợp                                                         [+ Ghi vi phạm]
Thang · LT1   ✓ Report 1 › ✓ Report 2 › ✓ WL 1 › [Report 4 + Meeting CX/GĐCN · lần này] › Report 5 › WL 2
┌ Vi phạm chưa xong · 1 ───────────────┐ ┌ Phối hợp SOS · MT2 · SOS 2 W, S ─────┐
│ 12/09 Không nộp bài Writing Task 1   │ │ ✓ Trao đổi với gia đình · 13/09       │
│ BTVN · Lê Minh Khoa ghi   [Ghi nhận] │ │ ○ GVCN meeting với HV  [Xác nhận] Bỏ▾ │
└──────────────────────────────────────┘ └───────────────────────────────────────┘
[Xác nhận xử lý] [Đề xuất QL duyệt]   ← nút viền khi việc hiện tại là Ghi nhận; nút chính khi bắt buộc / quá hạn
Nhật ký · 12 ▾   (vi phạm + lần xử lý + việc phối hợp, lọc Tất cả · Cần xử lý · Chờ duyệt · Đã xử lý)
```
- Việc hiện tại chỉ ở **thanh đầu hồ sơ** (đã có, mọi tab) + nút trên dòng; bỏ thanh trong tab.
- Nút chính theo việc: bắt buộc / quá hạn → "Xác nhận xử lý" chính; chỉ có vi phạm mới → "Ghi nhận" (trên dòng) chính, "Xác nhận xử lý" viền.
- Hai cột Vi phạm chưa xong | Phối hợp (1440); xếp chồng ở 375; bỏ hai tab con.
- Thang, dòng vi phạm, dòng phối hợp, nhãn trạng thái **cùng component** với phần mở rộng hàng em ở hồ sơ lớp (V6-A) — khác mật độ: lớp = một hàng / em + mở rộng; HV = mở sẵn.
- Tiêu đề không in hoa (vòng 1 §10.1).

**5. Vì sao tốt hơn.** So "giữ tab con, chỉ bỏ thanh trùng": vẫn 2 tab cho một em có 1–3 mục. Đề xuất: thấy đủ tình trạng **0 bấm** (nay 1–2), một việc một chỗ (3 → 2 chỗ), một nút chính đúng việc.

**6. Ảnh hưởng khu vực khác.** Thanh "VIỆC CỦA TÔI" của hồ sơ HV (các tab khác dùng cùng luật "không lặp trong tab"); dải 4 ô đầu hồ sơ (ô Ý thức có thể gọn thành "WL 1 · 1 vi phạm mở"); hồ sơ HV lớp thường (tab "Phối hợp" không SOS — giữ chữ).

**7. Trình tự.** Cùng M3 (đề xuất tách "M3b Hồ sơ HV · Ý thức" vì hồ sơ HV chưa có mục riêng ở kế hoạch §8); mockup chung với V6.

**8. Cần xác nhận.** Q15 (bỏ thanh việc trong tab, giữ thanh đầu hồ sơ).

---

## V9. Cùng gốc ở chỗ khác (ghi ngắn, dẫn mã đã có)

| Chỗ | Gốc chung | Mã liên quan |
|---|---|---|
| Phân tích › Test + SOS: tiêu đề giữa, số phải (23–40 px); chip đếm 3 dáng (ô viền xanh / vàng / cam) | V1-R1/R2 | A5-19, X7 |
| Lịch Test lưới mở: lệch như lưới MT (S 69 px), mỗi lớp tự mở lưới đủ cột | V1-R2/R3 | TST-01 |
| Lưới lớp thường: nút "Điền cả cột" trong tiêu đề, lệch 10 px, ô 4 dòng | V1-R1, V2 | TST-08 |
| Học viên & Lớp: bảng tiêu đề tách khỏi bảng thân (căn viết ở hai tệp); colgroup % vỡ ở 1 280; W 3 dòng | V1-R1/R3, V2 | A3-06, ảnh 1 |
| Đang SOS: "MT · tuần", "Trạng thái" lệch 16–19 px; "Phương án" tràn | V1-R1 | A3-09 |
| Tổng quan Lớp cần chú ý: cột "Case chưa chốt PA ⓘ" lệch 5 px, 4 dòng | V1-R1 | vòng 1 §10.2 |
| Công việc · "Lớp tôi dạy" rộng 760 px trong khung 558 px | V1-R3 | B-01 |
| Cần hỗ trợ: tiêu đề IN HOA tách khỏi thẻ bởi phân trang | V1-R5 | A3-28 |
| Tiêu đề nhóm / mục IN HOA 11 px (Ý thức khung trái, Thang, Bằng chứng) | thang chữ | v1 §A2, A3-15 |
| Chip trạng thái vi phạm "Quá hạn n ngày" nền cam | 5 nghĩa màu | A3-15, A3-17 |
| `ClassRoster.tsx:240` `align-top` trên `<tr>` không có tác dụng | V1-R4 | — |

---

## Câu hỏi cho chủ SP (quan trọng trước)

1. **Q1 — Sửa lệch bảng trước deploy?** Đưa **BANG-0 + BANG-1** (component bảng + lưới điểm, ~13 tệp, không đổi bố cục, theo mockup 6 khung 3 đã duyệt) vào trước deploy cùng GĐ1? — **Khuyến nghị: có.** Nếu buộc deploy sớm hơn: vá tạm `index.css:267` (phương án B) và ghi rõ là tạm.
2. **Q2 — Căn cột điểm:** C06 [CHỐT 18/10] "số căn giữa" và mockup 6 khung 3 (19/10, thắng) "điểm căn trái, ký hiệu trước số" khác nhau. — **Khuyến nghị: căn GIỮA cho mọi cột số / điểm (giữ C06), lấy từ mockup 6 phần "ký hiệu trước số + ô rộng cố định"** — một luật cho mọi bảng; tiêu đề cùng căn.
3. **Q3 — Duyệt hệ thống bảng một lần:** chủ SP duyệt **bảng mẫu** ở `/dev/thanh-phan` + ảnh cặp trước / sau của 3 bảng (lưới MT, Tổng hợp, Học viên & Lớp); các PR chuyển bảng sau đó chỉ cần ảnh cặp, không mockup mới? — **Khuyến nghị: có.**
4. **Q4 — W1 / W2 có ✓ / ✗** (mockup 6 có; DESIGN.md nói không; Rulebook §19: Case tách W1 / W2)? — **Khuyến nghị: có**, giống L / R / S.
5. **Q5 — Chữ phụ dưới ô điểm** chỉ một dòng, ưu tiên "thiếu nhận xét" > "vắng lần n" > "n câu"; Học viên & Lớp bỏ dòng "W1 · W2" dưới W (xem ở hộp / di chuột)? — **Khuyến nghị: có.**
6. **Q6 — Thanh "Điểm Mock Test" gập** chỉ ở tab Học viên (nút Nhập điểm từ tab khác tự chuyển về tab Học viên) hay ở mọi tab? — **Khuyến nghị: chỉ tab Học viên.**
7. **Q7 — Bấm "Nhập điểm"**: mở luôn hộp nhập ô trống đầu (gõ ngay) hay chỉ đặt con trỏ? — **Khuyến nghị: mở luôn hộp.**
8. **Q12 — Ý thức & Phối hợp lớp theo phương án A** (một bảng theo em, việc + hạn + nút trên hàng, mở rộng tại chỗ; bỏ hai tab con mà Rulebook §19 có nhắc — chỉ là cách trình bày)? — **Khuyến nghị: A.** Cần mockup mới trước khi code.
9. **Q13 — Mặc định "Cần làm"** (chỉ em có việc), dòng thời gian cả lớp thành "Nhật ký" gập? — **Khuyến nghị: có.**
10. **Q15 — Hồ sơ HV**: bỏ thanh việc trong tab Ý thức (giữ thanh "VIỆC CỦA TÔI" đầu hồ sơ), bỏ hai tab con, hai cột Vi phạm chưa xong | Phối hợp? — **Khuyến nghị: có.**
11. **Q14 — Phối hợp SOS**: một nút chính / em, việc đã xong gập, bỏ câu "Học thuật theo dõi ở bảng kỹ năng"? — **Khuyến nghị: có.**
12. **Q8 — QL xếp lịch MT ngay tại lưới** (hộp nhỏ chọn tuần) thay link "xếp ở panel Lộ trình"; GV chỉ thấy chữ "QL xếp lịch"? — **Khuyến nghị: có.**
13. **Q11 — Chip "8 chờ duyệt" ở hồ sơ lớp**: mở khung phải Chờ duyệt lọc lớp tại chỗ (thay đổi trang)? — **Khuyến nghị: có**, cùng thành phần hàng đợi Tổng quan B.
14. **Q10 — Góp ý hàng tuần**: GV chỉ có ô của môn mình, cột môn khác gập (QL / GVCN thấy đủ)? — **Khuyến nghị: có.**
15. **Q9 — Lớp FT**: đổi "Kết quả đầu ra 1 đợt" thành "Kết quả lớp trước"? — **Khuyến nghị: có** (hỏi để chắc nghĩa).

---

## Ảnh tiêu biểu (`NEW\anh\v2b\`)

1. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v2b\qt-lop3-luoi-mt3.png` — lưới MT3 (ảnh 4 tái hiện): tiêu đề giữa, ô phải, công cụ trong khung, W1/W2 thấp hơn.
2. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v2b\mk6-m3-luoi.png` — mockup 6 khung 3 đã duyệt: ký hiệu trước số, cột hẹp, thẳng.
3. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v2b\qt-hvl-open3-1280.png` — Học viên & Lớp 1 280: W 3 dòng, số W cao hơn L/R/S 20 px (ảnh 1).
4. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v2b\qt-lop3-hv-p1.png` — Hồ sơ lớp › Tổng hợp: điểm lệch, "Thiếu n" mọi em, cột ⋯ 154 px.
5. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v2b\gv10-lop4-hv-p1.png` — ô điểm 3 dòng ("26 câu" + "thiếu nhận xét").
6. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v2b\gv7-lop3-nhapdiem.png` — nút Nhập điểm mở panel toàn màn = bản thứ 2 của lưới, MT3 phần lớn chưa tới tuần.
7. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v2b\qt-lop3-yt-p1.png` — Ý thức lớp: hai khung, dòng thời gian 45 vi phạm.
8. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v2b\qt-lop3-ph-p1.png` — Phối hợp SOS: thẻ giống nhau, nút chính lặp (ảnh 3).
9. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v2b\gv7-hv1-yt-p1.png` — hồ sơ HV: "Ghi nhận" 3 chỗ, hai nút chính tranh nhau.
10. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v2b\gv7-lop3-yt-375-p1.png` — 375: ba tầng tab, "Phối hợp S…" bị cắt.
11. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v2b\gv7-lop3-hv-375-p1.png` — 375: thẻ em "W / 7.0" tách dòng.
12. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v2b\qt-pt-tonghop.png` — Phân tích Test + SOS: cùng lỗi tiêu đề giữa / số phải.

**Số đo + script:** `…\scratchpad\do\bang.json`, `…\do\bang3.json`, `…\do\tomtat-bang.txt`, `…\do\tomtat-khac.txt`; `…\chup\v2b-do-bang.mjs` (đo — đề xuất đưa vào `scripts/do-bang.mjs`), `…\chup\v2b-tomtat.cjs`, spec chụp `…\chup\v2b-lop.json`, `v2b-khac.json`, `v2b-mock.json`.
