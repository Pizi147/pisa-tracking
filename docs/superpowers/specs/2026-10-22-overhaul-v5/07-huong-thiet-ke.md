# 07 — Hướng thiết kế V5: thẩm mỹ + bố cục Tổng quan + Hồ sơ GV

> V5-A, 22/10. Trạng thái: **ĐỀ XUẤT THIẾT KẾ** — chờ chủ SP duyệt. Session B1 (Tổng quan), B3 (Hồ sơ GV / Phân tích) vẽ chi tiết theo lựa chọn ở đây.
> Nền: `thiet-ke/v5/v5-nen.css` · bảng mẫu `thiet-ke/v5/bang-mau.html` · dữ liệu `thiet-ke/v5/du-lieu-demo.md`.
> Ký hiệu: **[CHỐT]** = yêu cầu đã chốt (brief C01–C23, quyết định 22/10) · **[ĐX]** = đề xuất của V5-A · **[XM]** = cần xác minh nghiệp vụ.

## 1. Ba hướng thẩm mỹ (brief 5.1)

| | 1 · PISA sáng, rõ | 2 · Theo khu nội dung | 3 · Tập trung nhiệm vụ |
|---|---|---|---|
| Ý | Nền trắng, thanh điều hướng xanh logo, hồng điểm nhấn có chọn lọc, bảng sạch | Mỗi khu (Hành chính / Học thuật / Hỗ trợ) một nền nhạt + dấu hình riêng | Công việc dày, phím tắt; Tổng quan / Báo cáo thoáng, tỷ lệ, xu hướng |
| Được | Nhận ra PISA ngay (C02); đọc bảng tốt; ít màu → màu nghĩa nổi | Định vị nhanh trong hồ sơ dài | Đúng hai kiểu dùng thật: làm việc nhanh vs đọc tình hình |
| Mất | Dễ nhạt nếu không có điểm nhấn | Thêm 3 bộ màu nền → dễ lẫn với màu nghĩa (đạt / cảnh báo); khó giữ tương phản cả hai chế độ; hồng bị dùng làm "khu" | Một mình nó không nói gì về nhận diện |
| Rủi ro | Hồng lan khắp nơi thành "lỗi" | Mỗi màn một màu → mất nhất quán (CLAUDE.md "một khái niệm một tên") | Hai mật độ khác nhau phải chung component |

**Chọn: 1 + 3** [ĐX, đúng khuyến nghị brief]. Hướng 1 cho **hình** (màu, nền, badge, panel — toàn hệ); hướng 3 cho **mật độ theo loại trang**:

- Trang **làm việc** (Công việc, Chấm Test, Lịch tuần, Hồ sơ lớp): bảng 44 / 64 px, nút động từ trong hàng, phím ↑ ↓ Enter, "Lưu và tiếp", panel phải.
- Trang **đọc tình hình** (Tổng quan, Báo cáo, Phân tích, Hồ sơ GV): chỉ số 28 px có tử / mẫu, khoảng thở 24 px, xu hướng; số gạch chân mở panel **chỉ đọc**.
- Hướng 2 chỉ lấy một ý: **khu có tiêu đề + vạch hồng ngắn** (panel-loai trong bảng mẫu) để phân khu, không thêm nền màu riêng.

Luật màu (đã vào `v5-nen.css`): trắng đọc · xanh cấu trúc · hồng nhấn (vạch menu đang mở, mốc tuần này, chấm "của tôi", số chính) · **hồng không bao giờ = lỗi / SOS** · SOS vàng → cam → đỏ, đậm dần viền · 4 nhóm badge khác **dáng** (bảng mẫu mục 3).

## 2. Tổng quan theo vai — 2 phương án bố cục

Câu Tổng quan phải trả lời (brief 6.1): *Tình hình phạm vi của tôi ra sao? Chỗ nào cần chú ý? Tôi đi đâu xem tiếp?* Không form làm việc giữa trang (C04).

### Phương án A — "Một cột xếp chồng"

```
┌ Thanh xanh: PISA  Tổng quan•  HV&Lớp  Test  Công việc(4)  Phân tích ┐
│ Tổng quan · Monbay · W3 SEP                         [Chi nhánh ▾]   │
│ ┌ Đạt MT ─┐ ┌ Case có PA ┐ ┌ Chờ duyệt ┐ ┌ Thi tuần này ┐            │
│ │ 75 %    │ │ 83 %       │ │ 4         │ │ 2            │            │
│ │ 15/20 HV│ │ 5/6 Case   │ │ việc      │ │ HV           │            │
│ └─────────┘ └────────────┘ └───────────┘ └──────────────┘            │
│ ┌ Chờ bạn duyệt (4) ───────────────────────────────────────────────┐ │
│ │ loại · đối tượng · người gửi · chờ                    [Duyệt]    │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│ ┌ Lớp cần chú ý  [FT | Thường] ─────────────────────────────────────┐ │
│ └───────────────────────────────────────────────────────────────────┘ │
│ ┌ GV cần chú ý ─────────────────────────────────────────────────────┐ │
│ └───────────────────────────────────────────────────────────────────┘ │
```

- Được: đơn giản, 375 giống hệt 1440; thứ tự đọc rõ.
- Mất: ở 1440 bảng 3 khối kéo dài, phải cuộn mới thấy GV; "chỗ cần chú ý" lẫn với "số tình hình"; khối Chờ duyệt (việc) ngang hàng khối tình hình.

### Phương án B — "Tình hình trái · Đi tiếp phải" ✅ chọn

```
┌ Thanh xanh ──────────────────────────────────────────────────────────┐
│ Tổng quan · Monbay · W3 SEP                         [Chi nhánh ▾]    │
│ ┌ Đạt MT 75 % ┐┌ Case có PA 83 % ┐┌ Đạt Target — ┐┌ Thi tuần này 2 ┐ │
│ │ 15/20 HV    ││ 5/6 Case        ││ Chưa có DL   ││ 2 HV           │ │
│ └─────────────┘└─────────────────┘└──────────────┘└────────────────┘ │
│ ┌ Lớp cần chú ý  FT ───────────────────────┐ ┌ Chờ bạn (4) ────────┐ │
│ │ lớp · đạt % (n/N) · SOS · Case chưa PA · │ │ ▸ Dời MT3 S · Thu Hà│ │
│ │ thi tuần này                             │ │   GV Hà · 1 ngày    │ │
│ ├ Lớp thường ──────────────────────────────┤ │ ▸ PA Tutor · …   ⚠  │ │
│ │                                          │ │ [Xem cả 4 ›]        │ │
│ └──────────────────────────────────────────┘ ├ Đi tiếp ────────────┤ │
│ ┌ GV cần chú ý [Hành chính | Học thuật] ───┐ │ 3 HV FT chưa xếp MT │ │
│ │ GV · quá hạn · Case chưa PA · KQ đáng xem│ │ → HV&Lớp (đã lọc) › │ │
│ └──────────────────────────────────────────┘ │ 7 bài quá hạn chấm ›│ │
│                                              └─────────────────────┘ │
```

- Cột trái (≈ 2/3) = **tình hình** (số + 2 bảng ngắn). Cột phải (≈ 1/3, 360 px) = **chờ bạn** (chỉ vai có duyệt) + **đi tiếp** (mỗi dòng: số có đơn vị + đích đã lọc, "›" = đổi trang).
- Được: trả lời đủ 3 câu hỏi trong một màn 1440 không cuộn; việc (duyệt) tách khỏi số tình hình nhưng vẫn ở trang đầu QL (brief 6.2); cột phải là một **danh sách một kiểu mở** (bấm dòng duyệt → panel duyệt ngay tại chỗ, đủ bối cảnh — C22 không áp vì đây không phải panel báo cáo).
- Mất: cần quy tắc thu về một cột ở < 1100 px (cột phải lên **sau** dải chỉ số, trước bảng); thêm một vùng phải giữ gọn (tối đa 5 dòng + "Xem cả N ›").
- **Lý do chọn B:** brief 6.1 muốn "3–4 chỉ số + tối đa 2–3 khối"; B đặt đúng 2 khối tình hình + 1 cột đi tiếp. A làm việc duyệt và tình hình cùng cấp — đúng lỗi V4 brief chê ("Tổng quan chưa thực sự là tổng quan").

### Áp B cho từng vai (nội dung — vai xác minh ở `03-ma-tran-vai.md`)

| Vai | Dải chỉ số (3–4) | Trái | Phải |
|---|---|---|---|
| QL | Đạt MT % · Case có PA % · Chờ duyệt (việc) · Thi tuần này (HV) | Lớp cần chú ý (FT / Thường tách) · GV cần chú ý (lọc Hành chính / Học thuật) | Chờ bạn duyệt · Đi tiếp |
| QT | như QL nhưng **theo chi nhánh** (tổng = Σ tử / Σ mẫu — T20) | Bảng chi nhánh (5 dòng) — chọn chi nhánh → về mức QL | Chờ bạn duyệt · Đi tiếp |
| GV [ĐX: GV hiện không có Tổng quan, `/` → Công việc] | Việc đúng hạn % (của tôi) · Bài đến hạn tuần này (bài) · Case đang xử lý · Đạt MT kỹ năng tôi dạy % | "Kỹ năng tôi dạy" và "Lớp tôi chủ nhiệm" **hai khối riêng** (brief 6.4, không cộng trùng) | Đi tiếp (Công việc đã lọc; **Bài thi Speaking tuần này** là nguồn chấm, không là nợ — T03) |
| TVV | Báo PH xong trong kỳ % · Chưa liên hệ được (HV) · Thi tuần này (HV) · Chờ KQ / bước tiếp (HV) | Nhóm cần chú ý (không bảng "HV của tôi" dàn trải) | Đi tiếp → **Công việc** (C05) |
| Admin VP | Độ đủ lịch Test % · Phân công đủ % · Thiếu sót vận hành | Lịch tuần tới chưa đủ | Đi tiếp |
| CX | Theo phạm vi hiện có (HV cần phối hợp) — không thêm trách nhiệm mới | | |
| Head tutor | Không đổi (vào thẳng Tutor) | | |

Vai không có việc → **không** dựng khối "Không có việc" (brief 6.6); cột phải co còn "Đi tiếp".

## 3. Hồ sơ GV — 3 phương án bố cục (brief 13)

Đầu hồ sơ chung cho mọi phương án: tên · chi nhánh · kỹ năng · vai · lớp phụ trách; **một** bộ chọn kỳ (Từ tuần – Đến tuần, mặc định 4 tuần tới W3 SEP) dùng cho cả hai nhóm.

### Phương án A — Hai tab Hành chính / Học thuật

```
│ Lê Minh Khoa · Monbay · R W · GV · 4 lớp        [W4 AUG – W3 SEP ▾] │
│ [ Hành chính ]  Giảng dạy – Học thuật                                │
│ ┌Việc đúng hạn┐┌Điểm đúng hạn┐┌Quá hạn nay┐                           │
│ │ 86 % 12/14  ││ 95 % 63/66  ││ 1 việc    │                           │
│ └─────────────┘└─────────────┘└───────────┘                           │
│ Xu hướng theo tuần ▁▃▅▆ · Phân bố loại việc · Danh sách việc trễ     │
```
- Được: gọn, hợp 375. Mất: đang ở tab Học thuật thì không biết còn 1 việc quá hạn (brief tự nêu).

### Phương án B — Hai khu cùng trang, cạnh nhau

```
│ ┌ Hành chính ─────────────────┐ ┌ Giảng dạy – Học thuật ───────────┐│
│ │ 86 % · 95 % · 1 quá hạn     │ │ Đạt MT 72 % · Tiến bộ 64 % · …   ││
│ │ [Chi tiết ▾]                │ │ [Chi tiết ▾]                     ││
│ └─────────────────────────────┘ └──────────────────────────────────┘│
```
- Được: đối chiếu nhanh. Mất: mở chi tiết hai bên → trang dài, hai cột lệch chiều cao; ở 375 thành A không tab.

### Phương án C — Dải tóm tắt hai nhóm + tab chi tiết ✅ chọn

```
│ Lê Minh Khoa · Monbay · R W · GVCN MB FT RF 12 · 4 lớp [W4 AUG–W3 SEP]│
│ ┌ HÀNH CHÍNH ───────────────────┬ HỌC THUẬT ──────────────────────────┐│
│ │ Việc đúng hạn 86 % (12/14)    │ Đạt MT 72 % (18/25 lượt)            ││
│ │ Điểm đúng hạn 95 % (63/66 bài)│ Tiến bộ 64 % (16/25 HV có 2 mốc)    ││
│ │ ⚠ 1 việc quá hạn hiện tại     │ Case có PA 4/4 · PA cải thiện 2/3   ││
│ └───────────────────────────────┴─────────────────────────────────────┘│
│ [ Hành chính ]  Giảng dạy – Học thuật                                 │
│  (tab: xu hướng theo kỳ · phân bố · bảng giải thích số — như A)       │
```
- Dải tóm tắt luôn thấy (2 × 3 số, mỗi số gạch chân → panel chỉ đọc); tab chỉ chứa **chi tiết**. Ở 375 dải thành 2 khối xếp chồng, tab giữ.
- **Lý do chọn C:** giữ cái được của A (gọn, chi tiết nhiều dữ liệu) và vá đúng điểm yếu brief nêu ("không để phải đổi tab chỉ để biết GV còn vấn đề hành chính") bằng chính dải mà Phân tích GV dùng (C07: Phân tích GV = **một bảng** hai nhóm cột; hồ sơ = cùng định nghĩa, chi tiết hơn) → một hàm tính, hai nơi hiện (G7).
- Học thuật: áp **quy tắc Overall** (brief 15): Overall đạt → kỹ năng dưới không tính tạch; Overall thiếu → "Chưa đủ dữ liệu" riêng. Gán kết quả theo người dạy kỹ năng **trong tuần thi** (`server/src/phanTich/giaoVien.ts:230`) — không đổ lịch sử cho GV hiện tại. Không câu "GV gây ra kết quả".
- Không xếp hạng, không điểm KPI, không ngưỡng xanh / vàng / đỏ từ ảnh KPI (C08) — **[ĐX] bỏ màu < 50 / 50–69 / ≥ 70 hiện có ở Phân tích GV** (`shared/domain/phanTichGv.ts:83-87`), chỉ giữ số + mẫu nhỏ.

## 4. Quy tắc dùng chung cho mọi màn B (tóm tắt — chi tiết ở bảng mẫu)

1. Tên + ↗ = hồ sơ · số gạch chân = panel **chỉ đọc** · nút động từ = panel **việc** · ⓘ = giải thích · "›" = đổi trang.
2. Một danh sách một kiểu mở; panel phải 420–480 px ở 1440, toàn màn ở 375; không panel chồng.
3. Panel việc: loại (vạch hồng) → tiêu đề → bối cảnh → form → lịch sử gập → chân (trạng thái lưu + Lưu / Lưu và tiếp). Panel báo cáo: định nghĩa → phạm vi → tử / mẫu → bảng → không nút xử lý.
4. "Lưu và tiếp" chỉ chuyển sau khi lưu xong; lỗi → ở lại, giữ chữ. Không tự chuyển theo giờ.
5. Mỗi tỷ lệ: % to + "n/N đơn vị" dưới; mẫu 0 → "Chưa có dữ liệu"; < 5 → "mẫu nhỏ".
6. Ngày thi: badge nhóm **lịch thi**; Đạt / Chưa đạt / SOS: nhóm **kết quả**; quá hạn: nhóm **tiến độ** có ⚠.
7. Mockup V5: 1440 sáng + 1440 tối + 375; tên tệp `thiet-ke/v5/<man>.html`, ảnh `thiet-ke/v5/anh/<man>-<1440-sang|1440-toi|375>.png`; `<link rel="stylesheet" href="v5-nen.css">`; nút "Sáng / Tối" + `?theme=dark`.
