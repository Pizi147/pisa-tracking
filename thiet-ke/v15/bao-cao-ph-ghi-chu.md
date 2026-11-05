# v15 · Báo cáo PH — ghi chú mockup

Đặc tả: `docs/superpowers/specs/2026-11-05-bao-cao-ph/de-xuat.md` (nhánh plan-dem-0211). Mockup: `thiet-ke/v15/bao-cao-ph.html`. Ngày 05/11/2026. Mã đối chiếu: main `70df7c667`.
Dữ liệu demo Monbay (tên mẫu, không tên thật trong `CP FT 131.xlsx` / `NORMAL.pdf`); "hôm nay" trong mockup = **24/11/2026 · W4 NOV** (đợt tháng 11 đang mở 20–30/11).

✓ = khớp mã / đặc tả · ✎ = lệch, mockup làm theo cột "Mockup" · ? = cần PTA chốt (khuyến nghị ghi sẵn).

## 1. Bảng ý → mockup

| # | Ý (đặc tả) | Mã main / mẫu sẵn có | Mockup | |
|---|---|---|---|---|
| 1 | §5.1 Nhóm mới "Báo cáo PH" ở Công việc, sau các nhóm hiện có | Công việc có 4 nhóm `NHOM_VIEC` (Chấm điểm · Case học thuật · Ý thức & Phối hợp · Vận hành) + Speaking chấm chéo + Chờ bạn duyệt; QL: Vận hành = "Việc quản lý" luôn cuối, gập (OV-15d) | Nhóm thứ 5 `DaiNhom` "Báo cáo PH", biểu tượng nét tờ giấy. GV: cuối danh sách. QL: trước "Việc quản lý" (giữ luật Việc quản lý cuối) | ? L4 |
| 2 | §5.1 Một dòng = (đợt, lớp, phần của tôi) "Báo cáo tháng 11 · CP FT 131 · Listening · 4/12 em" + hạn | Dòng gộp lớp v12: ô vuông lớp · "Cả lớp {mã} · {việc}" · chip phụ · viên hạn 136 px · nút 112 px; S11 một dòng = 1 | "Cả lớp MB FT 131 · Báo cáo PH · Listening", chip "Tháng 11" · "4/12 em"; viên hạn "hạn 30/11"; nút **Viết**. GVCN: "… · Nhận xét chung". Lớp thường: chip "Progress · W3 NOV" | ✎ L6 |
| 3 | §5.1 Bấm dòng → panel viết tại chỗ: trái danh sách em ✓, phải form một em | `BanGiaoPanel`: `KhungPanel rong="vua"`, dòng loại "VIỆC · …", dòng ngữ cảnh, lưới 280 px danh sách em (`DsEmBanGiao`) + form; chân "Tự lưu khi rời ô" | Cùng khung: loại **VIỆC · BÁO CÁO PH**, tiêu đề "Báo cáo PH · MB FT 131 · Listening", ngữ cảnh "Tháng 11 · 4/12 em đủ · hạn 30/11"; trái 12 em (✓ đủ / chấm "đang viết" / trống); phải form một em | ✓ |
| 4 | §5.1 Điểm tự điền + "sửa"; §10 dạng điểm như "Điểm theo lớp"; đã sửa không ghi đè | FT band + ✓/✗ màu theo kỳ vọng (G12); lớp thường "✓ 17/25" | Dòng "Điểm  ✓ 6.5 · MT4 · sửa". Bấm "sửa" → ô số tại chỗ. Đã sửa: "6.0 · đã sửa (gốc 6.5) · Về điểm gốc" | ✓ |
| 5 | §5.1 Tiêu chí = hàng 4 nút thang Xuất sắc · Tốt · Khá · Yếu | Đang chọn = nền nhấn nhạt + viền (G14) | 4 nút đoạn trung tính mỗi tiêu chí; đang chọn nền nhấn. **Không tô màu kết quả** (thang 4 mức không phải đạt / không đạt; đỏ · xanh dương · xanh lá giữ cho điểm) | ? L10 |
| 6 | §6 Tiêu chí đặt sẵn theo đợt trước, nhạt "như tháng trước"; ô chữ luôn trống | — | Mức đặt sẵn = nút chọn **viền đứt** + chip đầu khối "Đặt sẵn như Tháng 10"; GV bấm mức khác → viền liền. Em vẫn "chưa đủ" tới khi viết ô chữ (ô chữ trống) | ? L10 |
| 7 | §5.1 Đề xuất cải thiện (chữ); em đủ = mọi tiêu chí có mức + ô chữ không trống (Điểm không bắt buộc) | — | Ô chữ "Đề xuất cải thiện" 4 dòng, tự giãn. Danh sách trái ✓ khi đủ | ✓ |
| 8 | §5.1 Tự lưu nháp từng ô + "Lưu · em tiếp ›"; Tab qua tiêu chí, phím 1–4 | V12 ②⑤⑦; `BanGiaoPanel` chân trái "Tự lưu khi rời ô" | Chân: trái "Tự lưu khi rời ô · ✓ đã lưu 14:02", phải **Lưu · em tiếp ›**; dòng "Tiếp: Đỗ Minh Khang". Phím 1–4 chỉ ở `aria-keyshortcuts` / tooltip (V6: không chữ giải thích) | ✓ |
| 9 | §5.1 Hết em | V12 ⑦ "Đã xong phần của bạn · …" + Việc tiếp › | Thẻ hết: "Đã xong phần của bạn · MB FT 131 · Listening: 12/12 em" + **Việc tiếp ›** / Đóng | ✓ |
| 10 | §5.1 QL làm hộ như Nhập hộ | Công việc QL: nút "Nhập hộ" (điểm), "Làm thay" (Case) | Dòng ở "Của GV" / "Tất cả": nút **Viết hộ** + người giữ việc mờ | ? L16 |
| 11 | §3 GVCN: Nhận xét chung + 7 tiêu chí (I 3 · II 4) | Mẫu NORMAL có hai đầu mục I / II; mẫu FT không có đầu mục | Panel phần Nhận xét chung: ô "Nhận xét chung" + đầu mục "Trách nhiệm học tập" (3) · "Thái độ học tập" (4). Không ô Điểm | ✓ |
| 12 | §5.2 Hồ sơ lớp: khối "Báo cáo PH" gập sẵn, một dòng, không intrusive | Tiền lệ `KhoiDiemLop`: thẻ gập cuối hồ sơ lớp "▸ Điểm Mock Test của lớp" + MỘT chip, nhớ trạng thái; dải đầu trang (`DaiLopChuyen`) là chỗ của việc gấp | Khối **ngay dưới khối Điểm**, cùng dáng: "▸ Báo cáo PH" + chip "Tháng 11 · 3/12 em đủ · hạn 30/11". Không dải đầu trang. Việc của GV ở lớp tự lên thanh "Việc của tôi" đầu hồ sơ (đã có, cùng nguồn my-work) | ✎ L7 |
| 13 | §5.2 Mở: chọn đợt "Tháng 11 ▾", bảng em × phần, ô ✓ / –, "Xuất em" cuối dòng, "Xuất lớp" đầu bảng | G9: cấm điều khiển trong tiêu đề bảng; G4 bảng rộng → mở dưới hàng / panel | Hàng công cụ ngoài bảng: ô chọn đợt · "3/12 em đủ" · **Xuất lớp**. Bảng: Học viên · Chung · L · R · W1 · W2 · S · (nút Xuất em). Đầu cột hai dòng: mã phần + tên GV nhỏ (chỉ chữ); không GV → "Chưa phân công". Bấm ô → panel đọc phần đó (GV phần đó: viết được) | ✓ |
| 14 | §11 FOU: L · R · W (PREP-Writing) · P; P chưa tiêu chí | FOU ô W phân công = **G+V**, ô S = **P** (`TEN_MON_RIENG`) | Lớp FOU đợt Progress: cột Chung · L · R · W · P; panel P chỉ Điểm + Đề xuất | ? L3 |
| 15 | §5.3 Ngăn Xuất Excel: thêm mẫu "Báo cáo PH" cạnh Danh sách cơ bản · Theo dõi SOS · Kết quả Test; chọn tháng / đợt; tập: cả chi nhánh / lọc / **em đã tích** | `NganXuatDs`: **không có ô chọn mẫu** (mẫu do góc trang đặt: SOS → Theo dõi SOS, Tất cả → Kết quả Test); khối Phạm vi (Bộ lọc hiện tại · Cả chi nhánh) + khối Cột; **không cột tích** | Thêm khối đầu **Mẫu**: Danh sách · Báo cáo PH. Danh sách = ngăn cũ y nguyên. Báo cáo PH: Phạm vi giữ, khối Cột thay bằng **Tháng** (một ô "Tháng 11 ▾"), nút "Xuất n HV" | ✎ L1 L2 |
| 16 | §5.3 chọn tháng / đợt khi chi nhánh có cả FT và lớp thường | Đợt lớp thường theo tuần của từng lớp (§10) | Một ô **Tháng**: FT = đợt tháng đó; lớp thường = đợt Progress / Final **có hạn trong tháng đó** (lớp không có đợt → bỏ; dòng "Không có đợt · 3 lớp" + ⓘ nêu tên lớp) | ? L1 |
| 17 | §4 sửa sau hạn được; trễ → "⚠ quá hạn n ngày" | Viên hạn v12 | Dòng quá hạn mẫu ở Công việc: lớp thường Progress W3 NOV "⚠ quá hạn 2 ngày" | ✓ |
| 18 | §7 Turso: khối gập không đọc | `KhoiDiemLop` gập vẫn đọc danh sách lượt để vẽ chip | Dòng gập có số "3/12 em đủ" → cần **một câu đếm** khi mở hồ sơ (≈ em × phần ≤ ~100 dòng); bảng chi tiết chỉ đọc khi mở khối | ? L18 |
| 19 | §9 (7) 375 panel viết | `KhungPanel` 375 = toàn màn | 375: danh sách em thu thành dòng "‹ Em 5 · Lê Bảo Ngọc · Nháp ›" đầu form; nút thang 44 px, xuống hai hàng nếu thiếu chỗ | ✓ |

## 2. Chỗ lệch — PTA Plan chốt 05/11: L1 L2 L4 L6 L7 L10 L16 L18 đồng ý; L3 chủ SP đồng ý 05/11

- **L1 · Ngăn Xuất không có ô chọn mẫu.** Khuyến nghị thêm khối "Mẫu" (Danh sách · Báo cáo PH) ở đầu ngăn; "Danh sách" giữ nguyên mọi thứ cũ (mẫu theo góc, cột nhớ máy). Một ô **Tháng** cho cả FT lẫn lớp thường (lớp thường lấy đợt có hạn trong tháng đó) — chủ SP nói "chọn tháng", không bắt chọn tuần từng lớp. Lớp thường có hai đợt trong một tháng (hiếm): xuất cả hai, sheet "{mã} · Final".
- **L2 · "Em đã tích"**: Học viên & Lớp không có cột tích (`NganXuatDs`: "không cột tick") → mockup chỉ "Bộ lọc hiện tại · Cả chi nhánh". Xuất một em ở Hồ sơ lớp (cột Xuất em).
- **L3 · FOU phần W. (chủ SP đồng ý 05/11)** Ô W của FOU trên web là G+V (phân công + điểm). Khuyến nghị: phần W của báo cáo FOU = GV phân công ô W, điểm tự điền = điểm ô W, tên phần trên web "Writing" (Excel "PREP – Writing task"), 5 tiêu chí PREP.
- **L4 · Vị trí nhóm.** Thêm khoá thứ 5 vào `NHOM_VIEC` chạm bộ lọc "Loại việc" và mọi chỗ đếm theo nhóm (Tổng quan). Khuyến nghị giữ nhóm riêng như đặc tả; QL: đặt trước "Việc quản lý".
- **L6 · Chữ dòng việc** theo mẫu dòng gộp v12 thay câu đặc tả: "Cả lớp MB FT 131 · Báo cáo PH · Listening" + chip "Tháng 11" "4/12 em". Nút **Viết**.
- **L7 · Chỗ khối Hồ sơ lớp**: cùng dáng, ngay dưới khối Điểm (thẻ gập cuối trang) — không dải đầu trang, không tab mới.
- **L10 · Thang không màu kết quả; đặt sẵn = viền đứt.** Lý do: 4 mức ≠ 3 nghĩa đạt; màu kết quả giữ riêng cho điểm.
- **L16 · Nút QL**: "Viết hộ" (cùng họ "Nhập hộ"). Phương án khác: "Làm thay".
- **L18 · Đọc khi gập**: một câu đếm nhỏ cho chip, bảng đọc khi mở. Ước ~70 dòng / lần mở hồ sơ lớp FT 12 em (12 × 6 phần), chỉ trong đợt đang mở / gần nhất.
- **Ghi thêm (không cần chốt):** TVV có nhóm "Báo PH" (báo PH vi phạm) — tên gần "Báo cáo PH" nhưng khác việc; giữ cả hai.

## 3. Brief (impeccable shape)

- **Người · việc:** GV (chế độ Operate) viết phần mình cho 8–20 em mỗi lớp mỗi tháng, ở trung tâm, máy tính; cần đi nhanh từng em bằng bàn phím, không nhập lại điểm. QL / Admin / TVV chỉ cần biết lớp nào thiếu phần nào và xuất file đúng mẫu.
- **Đầu ra:** mỗi em một cột Excel đủ phần. Thành công = GV xong một lớp không rời panel; QL thấy "3/12 em đủ" mà không phải mở gì.
- **Hướng:** trong hệ có sẵn (DESIGN Luật V5, v12 Công việc, `KhungPanel`, `KhoiDiemLop`, `NganXuatDs`). Không thành phần mới ngoài hàng nút thang. Điểm nhìn chính của panel = hàng tiêu chí + ô Đề xuất; của Hồ sơ lớp = một dòng gập.
- **Trạng thái vẽ:** (1) Công việc GV · (2) panel FT Listening (điểm tự điền, đặt sẵn như tháng trước, một em đang viết, lưu nháp) · (3) GVCN Nhận xét chung · (4) Hồ sơ lớp gập + mở (FT) · (5) lớp thường FOU Progress (L R W P, P không tiêu chí, có "Chưa phân công") · (6) ngăn Xuất mẫu Báo cáo PH · (7) 375 panel viết. Thêm: hết em, điểm đã sửa, lỗi lưu (giữ chữ).
- **Không làm:** gửi PH, duyệt, "đã gửi", PDF; không câu giải thích trên màn.

## 4. Turso (đọc mỗi lần mở)

| Chỗ | Câu | Dòng (ước) |
|---|---|---|
| Hồ sơ lớp, khối gập (chip "3/12 em đủ") | 1 câu đếm theo lớp × đợt đang mở / gần nhất | ≤ ~70 (FT 12 em × 6 phần) |
| Hồ sơ lớp, mở khối | 1–2 câu: phần × em của một lớp × một đợt + tên GV phân công | ≤ ~120 |
| Panel viết (một lớp × một phần × một đợt) | danh sách em + bản ghi phần đó + điểm gốc + mức đợt trước | ≤ ~60 |
| Lưu một ô | 1 ghi, không tải lại cả lớp | 1 |
| Xuất chi nhánh | theo lô từng lớp (như Xuất Excel hiện có) | ~ số em × số phần |

Đặt sẵn "như tháng trước" đọc cùng câu với panel (đợt trước của cùng em, cùng phần). Builder ghi trần ở `server/src/tests/tocDoDuong.ts`.

## 5. Ghi thêm cho builder

- Phần **Chưa phân công** (vd R của MB FOU 12) làm "em đủ" của lớp = 0 tới khi QL viết hộ → chip lớp đỏ khi quá hạn; đúng nghĩa (báo cáo thiếu), không ẩn phần.
- Ô bảng Hồ sơ lớp: ✓ đủ · "nháp" (375: ✎) · "–" chưa viết; mỗi ô là nút, có `aria-label`.
- Ngăn Xuất mẫu Báo cáo PH: dòng "Không có đợt" có ⓘ nêu tên lớp; nút "Xuất n HV" = HV của lớp có đợt.
- Hàng thang = nhóm radio (`role="radio"` + `aria-checked`, roving tabindex): Tab đi một bước mỗi hàng tiêu chí, ← → / phím 1–4 đổi mức; mức đặt sẵn có `aria-description="như Tháng 10"`.
- Màu: ✓ "đủ" trung tính (`text-faint`), ô thiếu có viền (chỗ mắt dừng), "nháp" vàng `soon`; xanh lá / xanh dương / đỏ chỉ cho điểm (G12, chủ SP).
- Tên dòng việc giữ "Cả lớp {mã} · Báo cáo PH · {phần}": dòng còn lên thanh "Việc của tôi" ở hồ sơ lớp, nơi không có tên nhóm.
- Hết em: "Đã xong phần của bạn" + **Lớp tiếp: {mã} ›** (phần cùng loại ở lớp khác) · Việc tiếp › · Đóng (V12 ⑦).
- **Em "đủ"**: mức đặt sẵn như đợt trước TÍNH là đã có mức — GV không phải bấm lại; em đủ khi mọi tiêu chí có mức (đặt sẵn hoặc chọn) + ô chữ không trống.
- Thứ tự trong panel mọi phần: Điểm → tiêu chí → ô chữ (Đề xuất cải thiện / Nhận xét chung) → Lưu · em tiếp ›. File Excel vẫn theo thứ tự mẫu.
- Lỗi lưu: chân "⚠ Chưa lưu được" màu `bad` (khác "Nháp" vàng); bấm lại "Lưu · em tiếp ›" = thử lưu rồi ở lại em đó (V12 ②). "Đang lưu…" chỉ ở nút đã bấm (V12 ⑨).
- Ô sửa điểm: FT band 0–9 bước 0.5; lớp thường 0 → tổng; sai thì viền đỏ + chữ lỗi, con trỏ ở lại ô, không lưu.
- Khối Hồ sơ lớp: chương trình chưa có mẫu (PET, KET, PREFOU) → không vẽ khối; có mẫu mà chưa tới đợt đầu → chip "Chưa có đợt · {đợt tới}".
- **[Đề xuất — PTA chốt]** Phần **Chưa phân công**: một dòng ở Công việc của QL ("Của GV" / "Tất cả"), chip "Chưa phân công", nút Viết hộ — như việc "Chưa có người phụ trách" của Case (`no_owner`). Không ai bị giao (đặc tả §10 giữ nguyên); chỉ để QL thấy chỗ kẹt mà không phải mở từng hồ sơ lớp. Vẽ ở khung a4.
- a11y cho builder: mỗi nhóm radio `aria-labelledby` = tên tiêu chí; ô bảng `aria-label` "{em} · {phần} · Đủ / Nháp / Chưa viết"; ⓘ ở ngăn Xuất là nút mở popover (G6), không chỉ `title`.
- Chưa vẽ (dáng sẵn có, builder theo mẫu): danh sách thả chọn em ở 375 (✓ đủ / nháp như danh sách 1440) · panel đọc em ở 375 (toàn màn, như d3) · GV xem hồ sơ lớp (phần của mình: Viết; phần khác: chỉ đọc) · TVV panel đọc không có Viết hộ.
- Bấm "Lưu · em tiếp ›" khi em chưa đủ: vẫn lưu nháp và sang em còn thiếu kế tiếp, không chặn. Hàng tiêu chí còn trống có chấm vàng + viền nhóm vàng (cùng tín hiệu "ô thiếu" của bảng Hồ sơ lớp).
- Đặt sẵn vẽ bằng **viền đứt** của nút; vòng focus bàn phím là **outline liền 2 px lệch ra ngoài** — hai dáng không trùng.

## 6. Kiểm · critique · ảnh

- `impeccable critique` (A rà thiết kế + B detector / đo trình duyệt, hai agent riêng mỗi vòng): **29 → 32 → 32 → 36/40**; vòng cuối **không P0 / P1**. P2 / P3 vòng cuối đã sửa (số Tháng 10, số việc QL, "Báo cáo PH" không ngắt dòng, aria nút Xuất / ô điểm).
- Detector: chỉ còn dương tính giả (chú thích mockup, vạch "Đang chọn" G14, badge đỏ v12, phông đã khoá). Đo trình duyệt (gốc · sáng · tối, 19 khung): phông Be Vietnam Pro + Inter tải đủ, không chữ < 12 px, không tương phản dưới ngưỡng, 375 không nút < 44 px, không lỗi console.
- Ảnh: `anh/<khung>-1440-toi.png`, `anh/<khung>-375-sang.png`, `anh/toan-trang.png`. Bản sáng 1440 / tối 375: nút "Tất cả sáng / Tất cả tối" đầu trang.
