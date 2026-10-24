# SV-TQ-GV — truy vết + KHỚP / KHÁC + thao tác TRƯỚC → SAU

Khung: `thiet-ke/v5/tong-quan.html?k=gv` (V5-B1, phương án B) · `tong-quan-truy-vet.md` dòng "brief 6.4" · XM-5 của `docs/anh/ui-tong-quan/khop-khac.md`.
Màn: Tổng quan vai GV (`/`, `web/src/modules/worklist/TongQuanV5.tsx` `TongQuanGvV5` + `LopToiDay.tsx` `HaiKhoiGv`). Head tutor dùng chung góc nhìn GV (không dạy lớp → không dựng khối).
Máy chủ: `GET /tong-quan/lop-toi-day/hai-khoi` (`server/src/worklist/tongQuan.ts` `lopToiDayHaiKhoi`). Đường V4 `/tong-quan/lop-toi-day?ct=` **giữ** — trang Công việc GV vẫn dùng khối "Lớp tôi dạy" V4.

## Kế hoạch (loại PR: đổi bố cục một khối, một màn)

| Bước | Việc |
|---|---|
| 1 | Máy chủ `/hai-khoi` hai phần + ô `thi-thang-nay` / `sos1..3` ở `/tong-quan/lop-toi-day/o` + phép kiểm `prSvTqGv` |
| 2 | Trần câu SQL (`tocDoDuong.ts`) |
| 3 | Web `HaiKhoiGv` thay "Lớp tôi dạy" trên Tổng quan GV |
| 4 | Ảnh cặp + bảng này |
| 5 | Gộp main · `npm run check` · `/ponytail-review` · `audit` |

## Không đếm lại (một hàm một số)

| Số | Hàm | Trùng với |
|---|---|---|
| Đạt Test · Tiến bộ theo lớp | `chiSoHoSoGv(p, p.userId, {}).hocThuatTheoLop` (kỳ mặc định 4 tuần) | hồ sơ GV bảng "Theo lớp" (#557) — panel `ket-qua-lop:` / `tien-bo-lop:` chung |
| Chờ chấm · quá hạn · hạn gần nhất | `noDiemCuaGv` qua `tinhLopToiDay` (V4 D10) | cột "Chưa nhập / Bài quá hạn" hồ sơ GV, Công việc |
| Dưới kỳ vọng · SOS · Case đang mở | `metricSet` `hv-duoi-ky-vong-mon` · `hv-sos-hien-tai` · `case-mo` chia theo lớp (V4); mức SOS = `sosLevel` của CHÍNH lượt mới nhất (`latestAttempts`) | Lớp tôi dạy V4 (phép kiểm: Σ mức = SOS V4) |
| Thi tháng này | `tapThiThangNayLop` (Phân tích / Tổng quan QL, #558) — phạm vi = lớp GV có phân công hôm nay | ô "Thi tháng này" theo lớp của QL (phép kiểm so với QL chi nhánh) |

Quyền: chỉ lớp của chính người gọi (phân công hiệu lực hôm nay); ô lớp không dạy → 403; panel hồ sơ GV người khác → 403 (phép kiểm `SV-TQ-GV · quyền`).

## Truy vết khung → thành phần

| # | Khung mockup | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | Hai thẻ cạnh nhau "Kỹ năng tôi dạy" · "Lớp tôi chủ nhiệm" trong cột trái, cột "Đi tiếp" phải | `HaiKhoiGv` (`Card` × 2) trong `BoCuc` trái; cột phải giữ "Điều hướng" #551 | KHỚP |
| 2 | Cạnh nhau tới 1100 px | cạnh nhau **≥ 1440** (ba cột: dạy · chủ nhiệm · Điều hướng); 1100–1439: Kỹ năng tôi dạy | Điều hướng, **Lớp tôi chủ nhiệm trải cả bề ngang dưới** (chủ SP 24/10 — không để thừa khoảng trống dưới Điều hướng); ở 1280 hai thẻ cạnh nhau chỉ ~400 px, bảng phải cuộn ngang | KHÁC — [XM-SV-3] |
| 3 | Tiêu đề phụ "R · W1 · W (lớp thường)" | tiêu đề phụ = **kỳ** "W4 AUG – W3 SEP" (Đạt / Tiến bộ là số theo kỳ); kỹ năng nằm ở chip từng hàng | KHÁC nhỏ (chỉnh cho hợp lý) |
| 4 | Cột Lớp + dòng phụ mốc Test ("MT2", "Progress") | mã lớp → hồ sơ lớp; dòng phụ: lộ trình · Test sắp tới (FT) / tuần học · Test sắp tới (thường) · "tuần này" (V4 "Test sắp tới") | KHỚP |
| 5 | Cột Kỹ năng (chip) | `ChipKy` (chung với hồ sơ GV, chuyển sang `ui/Nhan.tsx`) | KHỚP |
| 6 | Cột Đạt: % + "n/N lượt", % bấm → panel | `PhanTram` + "n/N lượt"; bấm → panel hồ sơ GV `ket-qua-lop:<lớp>` (Đạt kỳ vọng Test · tab Chưa đạt / Đạt) | KHỚP |
| 7 | Lớp chưa có lượt trong kỳ: "—" | `—` (mẫu 0 / không dữ liệu) | KHỚP |
| 8 | Cột "Chấm của tôi": "22 bài W · hạn 23/09" | "Chờ chấm": số bài (bấm → bài) · dòng phụ "hạn dd/mm" (hạn gần nhất); có bài quá hạn → "⚠ n" đỏ + "quá hạn" (bấm → bài quá hạn, V4 D10) | KHỚP |
| 9 | Chú thích quy tắc Đạt dưới bảng | `p` chú thích ("Chỉ bài của tôi. Đạt = …") | KHỚP |
| 10 | (mockup không có) Tiến bộ | cột **Tiến bộ** (FT; lớp thường "—") theo `plan.md` SV-TQ-GV — bấm → `tien-bo-lop:<lớp>` | KHỚP (theo kế hoạch) |
| 11 | "Lớp tôi chủ nhiệm · 2 lớp" | "Lớp tôi chủ nhiệm · n lớp · hiện tại" | KHỚP |
| 12 | Cột Lớp + "9 HV" | mã lớp → hồ sơ lớp; dòng phụ "n HV · lộ trình" | KHỚP |
| 13 | SOS hiện tại: chip "SOS 2 · 1" | chip mức + số HV ngoài chip, mỗi mức một cặp (như Lớp cần chú ý QL); bấm số → em của mức đó (`cot=sos<n>`); lớp thường "—" | KHỚP |
| 14 | Ý thức chờ xử lý "2 việc" | **Case** đang mở (V4) — `plan.md` SV-TQ-GV ghi "SOS, Case, Thi tháng này" | KHÁC — [XM-SV-1] |
| 15 | Thi tháng này | `tapThiThangNayLop` theo lớp, bấm → HV (`cot=thi-thang-nay`) | KHỚP |
| 16 | Chú thích "Số chủ nhiệm tách riêng…" | giữ nguyên câu | KHỚP |
| 17 | 375: một cột, bảng → thẻ | `Bang` thẻ < 640: đầu = mã lớp + chip, dưới = lưới "nhãn số" (cột kiểu `diem`) | KHỚP |
| 18 | Trạng thái tải / lỗi / rỗng | `Skeleton` trong thẻ · `ErrorState` + Thử lại · GV chưa có lớp → thẻ "Lớp của tôi" + câu bước tiếp; GV chỉ dạy bộ môn → không dựng thẻ chủ nhiệm (luật "không dựng khối không có việc") | KHỚP |
| — | GIỮ (mockup không vẽ): cột **Dưới kỳ vọng** / Chưa đạt theo lớp (V4) | ở khối chủ nhiệm (bấm → em) | GIỮ |
| — | Dải chỉ số, cột Điều hướng (#551) | không đổi (ngoài phạm vi) | GIỮ |

**Đếm:** 18 dòng khung → 15 KHỚP + 1 KHÁC nhỏ (dòng 3, chỉnh hợp lý theo luật V5 "chỉnh nhỏ được") + 2 KHÁC [XM] → 16 / 18 = **89 %**; nếu PTA Plan nhận XM-SV-1 theo `plan.md` (Case thay Ý thức đã ghi trong kế hoạch) → 17 / 18 = **94 % — đạt cổng 90 %**.

## [XM] — cần PTA Plan

- **XM-SV-1** cột "Ý thức chờ xử lý" (mockup) ↔ "Case" (`plan.md` SV-TQ-GV + prompt PR). Chọn **Case** (giữ ô V4 bấm được). Thêm cột Ý thức cần một tập "việc Ý thức chờ xử lý theo lớp" — chưa có hàm theo lớp cho GVCN (Công việc nhóm Ý thức là theo việc). **Khuyến nghị:** giữ Case; nếu chủ SP muốn Ý thức, thêm cột thứ 6 ở PR sau (dùng tập nhóm `y-thuc` của `myWork` chia theo lớp).
- **XM-SV-3** hai khối cạnh nhau chỉ từ 1440 (mockup từ 1100). Ở 1280 mỗi thẻ ~400 px < bảng 462–500 px. Chủ SP 24/10 xem ảnh 1280: khối chủ nhiệm **trải cả bề ngang** dưới (đã làm). **Khuyến nghị:** giữ.
- (không phải XM — ghi lại) Mockup "Đi tiếp" có dòng "2 việc Phan Gia Hân" (bàn giao): ngoài phạm vi PR này, cột phải giữ đúng #551.

## Thao tác TRƯỚC → SAU

| Thao tác trước PR (Tổng quan GV — "Lớp tôi dạy" V4) | Sau PR | Ghi chú |
|---|---|---|
| Công tắc Fast Track / Lớp thường (dạy cả hai khung) | **ĐỔI** → không công tắc: hai khối hiện **cả hai khung** cùng lúc, mỗi hàng ghi khung của lớp (dòng phụ lộ trình / tuần học) | mockup không có công tắc; 0 bấm để thấy lớp thường. Công việc giữ công tắc V4 |
| Bấm mã lớp → hồ sơ lớp | **GIỮ** (cả hai khối) | |
| Bấm "Dưới kỳ vọng" / "Chưa đạt" theo lớp → panel em | **GIỮ** ở khối chủ nhiệm | GVBM thuần: số này nằm ở GVCN; thay bằng Đạt Test của kỹ năng mình (+ panel) — lý do: số "dưới kỳ vọng" tính mọi kỹ năng của lớp, không phải phần GVBM chịu trách nhiệm (brief 6.4 "không cộng trùng") |
| Bấm SOS theo lớp → panel em SOS | **GIỮ** + tách mức (SOS 1 · 2 · 3, bấm từng mức) ở khối chủ nhiệm | `cot=sos` V4 vẫn chạy (Công việc) |
| Bấm "Case đang mở" theo lớp → panel Case | **GIỮ** ở khối chủ nhiệm | GVBM thuần: Case mình phụ trách ở ô dải "Case đang xử lý" (#551, bấm → panel) |
| Bấm "Bài chờ chấm" / "bài quá hạn" theo lớp → panel bài | **GIỮ** (cột "Chờ chấm", + hạn gần nhất) | |
| Đọc "Test sắp tới" · "tuần này" · "Tuần học" | **GIỮ** (dòng phụ dưới mã lớp) | |
| Đọc "Học viên" theo lớp | **GIỮ** ở khối chủ nhiệm ("n HV") | |
| — | **MỚI** bấm Đạt Test / Tiến bộ theo lớp → panel lượt (cùng hồ sơ GV) | |
| — | **MỚI** bấm Thi tháng này theo lớp chủ nhiệm → panel HV | |
| Trang Công việc: khối "Lớp tôi dạy" V4 | **GIỮ** nguyên (không đổi) | |

## Ảnh (`docs/anh/sv-tq-gv/`, seed nguyên, ngày demo 14/09/2026, `scripts/anh-cap.mjs`)

Vai: **GV 7 Trần Ngọc Hà** (vừa dạy vừa chủ nhiệm: 10 lớp dạy, GVCN 8 lớp, có SOS 1–3) · **GV 12 Vũ Gia Hân** (chỉ dạy bộ môn: BC FT 205 W1, BC ELE 01) · **GV chưa có lớp** (tài khoản GV tạm thêm vào DB chụp — seed không có GV nào chưa phân công; không commit DB).
Số trên web là seed (khác số demo mockup) — so khung, thứ tự, tên, kiểu ô; số kiểm bằng `prSvTqGv`.

- `cap-gv7-1440-toi.png` · `cap-gv7-1440-sang.png` · `cap-gv7-1280.png` · `cap-gv7-375.png` (375 sáng)
- `cap-gv12-chi-bo-mon-1440-toi.png` · `cap-gv12-chi-bo-mon-375.png`
- `cap-gv-chua-co-lop-1440-toi.png` (so `?k=gv&tt=rong`)
- panel: `panel-dat-test-1440.png` (Đạt Test MB FT 101 = 11/14 lượt Test, cùng panel hồ sơ GV) · `panel-duoi-ky-vong-1440.png`
