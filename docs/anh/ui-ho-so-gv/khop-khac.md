# UI-HO-SO-GV — truy vết + KHỚP / KHÁC + thao tác TRƯỚC → SAU

Khung: `thiet-ke/v5/dieu-chinh-cuoi.html` khu **e** (V5-D, mới nhất — thắng phần trùng của `ho-so-gv.html` phương án C) + `ho-so-gv.html` C (trạng thái tải / lỗi / rỗng, panel chỉ đọc, 375) · `ho-so-gv-truy-vet.md`.
Màn: `/giao-vien/:id` (`web/src/modules/giaoVien/HoSoGiaoVienPage.tsx`). Seed nguyên, ngày demo 14/09/2026, ảnh `scripts/anh-cap.mjs`.

## Kế hoạch (loại PR: làm lại màn)

| Bước | Việc |
|---|---|
| 1 | Khung truy vết này + PR nháp |
| 2 | Máy chủ: `chiSoHoSoGv` thêm `theoLop` (lượt trong kỳ theo bài, Đạt kỳ vọng, Tiến bộ theo lớp em học lúc thi); hồ sơ: `laGvcn`, `gvcn` từng lớp, `coPa` từng Case; panel `ket-qua-lop:<lớp>` · `tien-bo-lop:<lớp>`; xoá `ketQuaHoSoGv` + đường `/ket-qua` (nợ #521) |
| 3 | Web: đầu gọn (tên · Vai · Kỹ năng · GVCN) + kỳ Từ tuần – Đến tuần (mặc định 4 tuần, P9) + "?" + dải 6 chỉ số (số → panel chỉ đọc) |
| 4 | Web: khối Lớp đang dạy (thẻ) + bảng Học thuật theo lớp (hàng Cộng) |
| 5 | Web: khối V4 giữ (Việc đang có, Case đang phụ trách, Yêu cầu đã gửi) theo luật V5; rỗng / lỗi / 375 |
| 6 | Ảnh cặp + bảng KHỚP / KHÁC (dưới) |
| 7 | `npm run check` · `/ponytail-review` · impeccable `audit` + `web-design-guidelines` |

Vai demo: QL = Nguyễn Khánh Vy (2). GV nhiều lớp + GVCN = Lê Minh Khoa (8: 16 lớp, GVCN 5 lớp). GV ít dữ liệu = Đỗ Thu Hương (17: 1 lớp, việc đúng hạn trống).
Số trên web là seed (khác số demo của mockup) — so khung, thứ tự, tên, kiểu ô; số kiểm bằng phép kiểm (`prGv`, `prSvSo2`, `prOv11h`: ô = số dòng panel).

Ảnh (`docs/anh/ui-ho-so-gv/`): `cap-gv8-1440-toi.png` · `cap-gv8-1440-sang.png` · `cap-gv8-1280.png` · `cap-gv8-375.png` (nhiều lớp + GVCN) · `cap-gv17-1440-toi.png` · `cap-gv17-375.png` (ít dữ liệu, so `ho-so-gv.html?tt=rong`) · `cap-gv8-tu-xem-1440-toi.png` (GV tự xem) · `cap-gv16-thi-that-1440-toi.png` · `cap-gv16-thi-that-375.png` (GV 16 Dương Tuấn Kiên, kỳ W2 AUG – W3 SEP — seed chỉ có thi thật ở lớp UB FT 401; Quản trị xem) · panel: `panel-lop-co-diem-1440.png` · `panel-thi-that-ky-nang-1440.png` · `panel-thi-that-fail-1440.png` · `panel-lop-thuong-1440.png` · lớp thường: `cap-gv8-lop-thuong-1440-toi.png`.

**Phản hồi chủ SP 23/10 (đã áp, lượt 5):** cột cân đối — khoảng trống dồn sau cột Kỹ năng (cột linh hoạt duy nhất), cột số sát nhau bên phải, mọi cột tỉ lệ 156 px · bỏ cột "Chưa đạt Test" ở bảng lớp thường (kỹ năng + lớp) vì ô Đạt Test đã có n/N, bấm % ra tab Chưa đạt · 375: hai bảng thành khối gọn (dòng đầu tên / chip, dưới là cặp "nhãn số"), không còn thẻ cao · panel MT: điểm + Overall + kỳ vọng MỘT hàng (≥ 640), bằng đúng mốc thì không ký hiệu (bỏ "▲0.0"); tiêu đề panel "Đạt kỳ vọng Test · … lượt Test" · do-khung gv-ho-so (QL, thi thật) 1440 / 1280 / 375 không lỗi.
**Phản hồi chủ SP 23/10 (đã áp, lượt 4):** hai bảng Học thuật **tách khung** (viền + dải tiêu đề riêng, cách 16 px, tỉ lệ 2 : 3) · **mọi cột %** (Đạt kỳ vọng Test, Tiến bộ, Pass Target, Đạt Test) cùng MỘT kiểu ô: % (bấm → panel) · thanh trung tính · n/N · bảng kỹ năng FT: cột thi thật gọn ▼ ▲ ★ + số, chú giải "▼ Fail ▲ Pass ★ Exceed" ở dải tiêu đề bảng; chưa đạt Test mở từ % (tab Chưa đạt).
**Phản hồi chủ SP 23/10 (đã áp, lượt 3):** dải số **4 ô** (Đúng hạn · Đạt kỳ vọng Test · Case có PA · **Kết quả thi thật** cuối, kèm ▼ Fail · ▲ Pass · ★ Exceed); bỏ ô Quá hạn (số quá hạn hiện tại ở "Việc đang tồn"; bài quá hạn theo lớp chuyển lên thẻ Lớp đang dạy) · thuật ngữ chốt ghi ở `thiet-ke/THUAT_NGU_2026-10-01.md` mục "Hồ sơ GV" (HSGV-1…9) · Học thuật: công tắc **Fast Track | Lớp thường** (chỉ khi GV dạy cả hai) + bảng **Theo kỹ năng ‖ Theo lớp cạnh nhau** (≥ 1280; < 1280 xếp dọc) · bảng lớp **7 hàng / trang**: lớp đang học khai giảng lâu nhất lên đầu → lớp đáng lo (Đạt kỳ vọng Test thấp, có Fail) → lớp đã kết thúc ở cuối (mờ), hàng Cộng cuối mỗi trang · FT lớp: Lớp · Kỹ năng · Đạt kỳ vọng Test · Tiến bộ · Pass Target; Thường lớp: Lớp · Kỹ năng · Bài Test trong kỳ · Đạt Test · Chưa đạt Test · panel điểm rộng 720, kỹ năng GV phụ trách ô to viền nhấn dày, kỹ năng khác nhỏ mờ, Overall + mốc so mép phải; tab thi thật Fail · Pass · Exceed.
**Phản hồi chủ SP 23/10 (đã áp, lượt 2):** dải số còn **5 ô** · thi thật có **Vượt Target** (Overall / band kỹ năng cao hơn Target): ô dải số, cột Thi thật bảng Theo kỹ năng (★ Vượt n), tab "★ Vượt Target" trong panel · thi thật (IELTS) **tách** khỏi kết quả Test ở hồ sơ GV.
**Phản hồi chủ SP 23/10 (đã áp, lượt 1):** bỏ ô "Phản hồi vấn đề HV" · thêm **Đạt Target thi thật** (ô dải số + cột bảng theo lớp + bảng **Theo kỹ năng**) · panel kết quả có **điểm từng kỹ năng**, kỹ năng GV phụ trách nổi bật + ▲/▼ chênh so với Target / kỳ vọng (lớp thường: % so ngưỡng đạt), Overall, tab **Chưa đạt · Đạt**, một em một dòng · khối **Case đang phụ trách gọn** (đếm theo trạng thái, 5 Case cần làm trước, "Xem cả n Case" → panel phân trang).

## Truy vết khung → thành phần

| # | Khung mockup | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | Khu e: đầu một hàng — tên · **Vai** (GV · chi nhánh) · **Kỹ năng** (chip) · **GVCN** n lớp; bỏ chuỗi "4 lớp: …" | `HoSoGiaoVienPage` đầu (`NhanDau`: nhãn nhỏ xám / giá trị đậm — P2) | KHỚP |
| 2 | Khu e: Từ tuần [ô] đến [ô] ? (P9, mặc định 4 tuần tới tuần này) | hai `ONgay kieu="tuan"` (gõ được + nút lịch) + `NutLuat`; giá trị ghi `?tu=&den=` (mặc định không ghi); tuần đầu > tuần cuối → báo ⚠, không gọi API | KHỚP |
| 3 | Khu e: dải 6 chỉ số trong MỘT thẻ, ô ngăn vạch (Việc đúng hạn · Điểm đúng hạn · Quá hạn · Đạt kỳ vọng · Tiến bộ · Case có PA) | `DaiChiSo` **5 ô** (chủ SP 23/10: "chỉ 5, gộp được thì gộp, giữ % Test đạt và % Pass Target"): **Đúng hạn** (số to = điểm, dòng phụ "Việc n %") · **Quá hạn** · **Đạt kỳ vọng** (dòng phụ "Tiến bộ n %") · **Đạt Target thi thật** (dòng phụ "Vượt n") · **Case có PA** (dòng phụ PA cải thiện); mọi % gạch chân = panel chỉ đọc | KHÁC — theo chủ SP |
| 4 | Mốc "phản hồi vấn đề HV" (C, R3c) | **BỎ** theo chủ SP 23/10 ("không cần thiết"); chỗ đó là ô **Đạt Target thi thật** (n/N HV, bấm → panel có điểm) | KHÁC — theo chủ SP |
| 5 | Mẫu 0 → "– Chưa có dữ liệu", không "0 %" (T19) | `PhanTram` (dùng lại của Tổng quan V5) | KHỚP |
| 6 | Khu e: khối **Lớp đang dạy** thẻ: mã lớp + chip GVCN · chip kỹ năng · n HV · "GVCN cô …" | `KhoiLop` (thẻ, 4 cột ≥ 1280, 2 cột ≥ 640, 1 cột 375); tiêu đề "n lớp · n HV" (HV bấm được — V4) | KHỚP |
| 7 | Thẻ lớp GVCN có "MT1 W1 OCT" / "Final 28/09" (mốc tiếp) | không vẽ — việc giao "lớp · kỹ năng · số HV · GVCN"; thay bằng "n chưa nhập" (V4 giữ, bấm → panel) | KHÁC — [XM-2] |
| 8 | Khu e: bảng **Học thuật** — Lớp · Kỹ năng · Lượt trong kỳ ("12 · MT3 10 · MT2 2") · Đạt kỳ vọng ("75 % 9/12 lượt") · Tiến bộ · Case có PA · Quá hạn; hàng Cộng | `KhoiHocThuat` (`Bang`, hàng 44 px, cột cố định, chỉ cột "Lượt trong kỳ" giãn); máy chủ `hocThuatTheoLop` (P8: lớp em học lúc thi, lượt từng HV) | KHỚP |
| 9 | Tiêu đề "Học thuật · lượt của từng HV có tuần thi trong kỳ" + "?" (P1: bỏ hộp "Quy tắc Overall…") | tiêu đề + phụ đề + `NutLuat` | KHỚP |
| 10 | Số → panel chỉ đọc (C22) | ô % mỗi hàng → `ket-qua-lop:<lớp>` / `tien-bo-lop:<lớp>`; Quá hạn → bài quá hạn của lớp (V4); hàng Cộng không bấm (số đã ở dải) | KHỚP |
| 11 | Tiến bộ đơn vị "HV" | "lượt" — máy chủ đếm lượt kỹ năng (K5, cùng Tổng quan "Tiến bộ · lượt") | KHÁC — [XM-3] |
| 12 | Mockup chỉ vẽ lớp FT | lớp thường cùng bảng (sau FT), Tiến bộ "—"; lớp đang dạy chưa có lượt trong kỳ vẫn có hàng (0 · —) để không mất ô Quá hạn | KHỚP (mở rộng theo dữ liệu thật) |
| 12b | (chủ SP 23/10) thi thật theo kỹ năng: "dạy kỹ năng này đạt nhiều hay trượt nhiều" | bảng **Theo kỹ năng** đầu khối Học thuật: Đạt kỳ vọng (% + thanh trung tính, không màu ngưỡng) · Chưa đạt · Thi thật ▲ Đạt n ▼ Chưa đạt n; 375 mỗi kỹ năng một dòng | MỚI — theo chủ SP |
| 12c | C: panel chỉ đọc "bảng dữ liệu" (`-panel-dat-mt-1440`) | panel kết quả: một em một dòng · điểm L R W S (kỹ năng GV phụ trách viền nhấn + ▲/▼ chênh) · Overall · Target / kỳ vọng · tab Chưa đạt · Đạt; bấm "Chưa đạt" / "Đạt" ở bảng → panel lọc sẵn (`loc=`) | KHỚP (nâng theo chủ SP) |
| 13 | C: trạng thái tải / lỗi một khối / rỗng | `Skeleton` từng khối; lỗi `chi-so` chỉ báo ở dải + Học thuật (khối khác vẫn đúng); rỗng "Chưa có dữ liệu · Không có lượt nào…" | KHỚP |
| 14 | C: 375 — dải 2 cột, bảng → thẻ, panel toàn màn | `grid-cols-2`, `Bang` thẻ < 640, `KhungPanel` | KHỚP |
| 15 | C08: không xếp hạng, không màu ngưỡng | số màu trung tính; chỉ quá hạn ⚠ đỏ (không chỉ màu) | KHỚP |
| 16 | C: QL xem = theo dõi; link Công việc chế độ theo dõi | nút "Việc của Khoa ›" (V4, `duongViecCuaGv`); GV tự xem: "Mở Công việc ›" | KHỚP |
| — | BỎ: khối "Kết quả gần nhất của lớp đang dạy" (mốc gần nhất của lớp — P8) | xoá web + máy chủ (`ketQuaHoSoGv`, `/giao-vien/:id/ket-qua`, ô `cot=ket-qua`) — nợ #521 | BỎ |
| — | BỎ: hộp chữ "Quy tắc Overall…", "Bấm số gạch chân…", "Phạm vi QL" dòng chữ (P1) | về "?" (phạm vi QL nằm trong "?" của kỳ) | BỎ |
| — | GIỮ (mockup không vẽ): Việc đang có · Case đang phụ trách · Yêu cầu đã gửi (V4) | giữ thao tác, đặt sau Học thuật; **Case đang phụ trách gọn** (chủ SP 23/10): tổng Case + đếm theo trạng thái (Quá hạn · Cần làm · Chờ duyệt · Đang làm, bấm → panel đúng nhóm `tt=`) · tối đa 5 Case "Cần làm trước" (quá hạn, hạn gần) · "Xem cả n Case" → panel phân trang 10/20/50, dòng mở rộng làm việc tại chỗ | GIỮ — [XM-4] |

**Đếm:** 13 KHỚP + 4 KHÁC (dòng 3, 4 theo chủ SP; XM-2, XM-3) trên 17 dòng khung (12b mới, không tính) → 13 / 17 = 76 %; hai dòng theo lời chủ SP → 15 / 17 = **88 %**; XM-2, XM-3 cần chủ SP đồng ý lý do để qua cổng 90 % (Q-5).

## [XM] — cần PTA Plan / chủ SP

- ~~XM-1~~ ô "Phản hồi vấn đề HV": chủ SP bỏ (23/10).
- **XM-6** bảng lớp bỏ cột Case có PA, Quá hạn, Lượt trong kỳ (FT) theo cột chủ SP chọn: Case có PA còn ở dải số + khối Case; bài quá hạn theo lớp **giữ thao tác** ở thẻ Lớp đang dạy (⚠ n quá hạn → panel).
- **XM-5** thi thật ≠ Test (chủ SP 23/10: "thi thật là thi IELTS thật, Final / Progress là phạm trù khác"): hồ sơ GV (và Tổng quan GV "Đạt MT", cùng API `chi-so`) **đã tách** — Đạt kỳ vọng / lượt / panel kết quả chỉ MT, Progress, Final; thi thật chỉ ở ô Đạt Target thi thật, cột Thi thật, bảng Theo kỹ năng. **Bảng Phân tích GV** (`phanTichGiaoVien`, màn khác) vẫn gộp thi thật vào cột kết quả theo C10 → **khuyến nghị** UI-PHAN-TICH tách giống hồ sơ (cột thi thật riêng), cần PTA Plan chốt.
- **XM-2** thẻ lớp không có mốc Test tiếp ("MT1 W1 OCT"): ngoài phạm vi việc giao, cần API mốc tiếp theo lớp. **Khuyến nghị:** để `plan.md` mục 4 nếu chủ SP muốn.
- **XM-3** Tiến bộ "lượt" thay "HV": máy chủ đếm theo lượt kỹ năng (K5); đổi sang HV cần luật mới. **Khuyến nghị:** giữ "lượt".
- **XM-4** khối V4 (Việc đang có, Case đang phụ trách, Yêu cầu đã gửi): `ho-so-gv-truy-vet.md` BỎ "Yêu cầu đã gửi" + chip bàn giao, nhưng luật 22/10 tối "GIỮ thao tác V4" → **giữ cả ba** (chip bàn giao vẫn ở thẻ lớp). Chờ PTA Plan nói bỏ.

## Thao tác TRƯỚC → SAU

| Thao tác trước PR | Sau PR | Ghi chú |
|---|---|---|
| "Việc của X ›" / "Mở Công việc ›" ở đầu hồ sơ | **GIỮ** (đầu trang, bên phải bộ lọc kỳ) | |
| Việc đang có: bấm số nhóm → Công việc đúng nhóm; "n quá hạn" → chỉ quá hạn | **GIỮ** (khối Việc đang có) + tổng quá hạn ở dải chỉ số | |
| Lớp đang dạy: bấm mã lớp → hồ sơ lớp | **GIỮ** (thẻ lớp) | |
| Lớp đang dạy: bấm tổng HV → panel HV | **GIỮ** (tiêu đề khối) | |
| Lớp đang dạy: bấm "Bài chưa nhập điểm" theo lớp → panel bài | **GIỮ** ("n chưa nhập" trên thẻ lớp) | |
| Lớp đang dạy: bấm "Bài quá hạn" theo lớp → panel bài | **GIỮ** (cột Quá hạn bảng Học thuật; hàng Cộng = mọi lớp) | |
| Chip "Bàn giao n/m em" → hồ sơ lớp việc bàn giao | **GIỮ** (thẻ lớp) | |
| Kết quả gần nhất: bấm ô đạt/tổng (mốc gần nhất) → panel HV | **ĐỔI** → bấm % Đạt kỳ vọng / Tiến bộ theo lớp trong kỳ → panel lượt (P8) | ô cũ trái P8 |
| — | **MỚI** chọn kỳ Từ tuần – Đến tuần (P9) | |
| — | **MỚI** dải chỉ số theo kỳ, bấm % → panel chỉ đọc | |
| Case đang phụ trách: bấm HV / Case / việc tiếp; số Case, Case quá hạn → panel; "Hiệu quả PA của X ›" | **GIỮ** — 5 Case gấp nhất bấm HV / Case / việc tiếp như cũ; mọi Case khác qua panel ("Xem cả n Case", dòng mở rộng có nút làm việc); "Case quá hạn" → nhóm Quá hạn | chủ SP 23/10: bỏ bảng dài |
| — | **MỚI** đếm Case theo trạng thái → panel đúng nhóm | |
| — | **MỚI** bảng Theo kỹ năng: bấm Chưa đạt / Đạt / Thi thật → panel lọc sẵn | |
| Yêu cầu đã gửi: số chờ / từ chối → panel; "Yêu cầu của tôi ›" / "Chờ duyệt ›" | **GIỮ** | XM-4 |

## Phép kiểm gỡ / đổi (Q-7)
- Gỡ: `prPb2b` (3e) (khoá dòng `ketQuaHoSoGv` lớp thường) · `prGv` (3) "kết quả gần nhất khớp Phân tích lớp" · `prGv` dòng GVBM gọi `ketQuaHoSoGv` · ô `cot=ket-qua` dòng lạ / thiếu lớp.
- Thêm `prUiHoSoGv` (thi thật: ô = panel, Chưa đạt trước, mỗi dòng 4 điểm + kỹ năng phụ trách + Target, lọc Đạt + Chưa đạt = cả tập, Theo kỹ năng / theo lớp = panel, Σ lớp = ô; Case theo trạng thái Σ = tổng; tham số lạ → 400).
- Gỡ `prBang0` hồ sơ GV khỏi hai danh sách miễn (BANG-2, BANG-3 — trang không còn tự viết `<table>`).
- Đổi: `prGv` (3) số = số dòng → `hocThuatTheoLop` × panel `ket-qua-lop` / `tien-bo-lop` (panel gộp một lượt một dòng → kiểm tử / mẫu ở tiêu đề + Đạt + Chưa đạt = mọi dòng); HTTP `/ket-qua` → `/chi-so`; `prSvSo2` hàng lớp = Σ kỹ năng; `prOv11h` PET → hàng Học thuật có "Checkpoint 1"; `tocDoDuong` `/giao-vien/9/ket-qua` → `/giao-vien/9/chi-so`.
