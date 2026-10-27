# UI-CHART-D (M5 PR ③) — bảng KHỚP / KHÁC (ảnh cặp `*.png`, trái mockup | phải web)

Nguồn: `thiet-ke/v7/ho-so-hv.html` (chủ SP duyệt 27/10, #604) khu Đang học · Đã thi · 375 · Trạng thái khác + kế hoạch `docs/superpowers/plans/2026-10-27-m5-code.md` (Global Constraints + PR ③).
Phạm vi PR: khối "Hành trình · {kỹ năng}" (chart D + nút Bảng) và Overall (bảng Mock Test + hàng Thi thật). Ô điểm đầu trang, Việc của tôi, Tiến độ trên lớp,
Case & PA hai cột là PR ② (UI-HO-SO-HV-2) — ảnh web ở các phần đó vẫn là bản hiện tại.

Bộ demo cục bộ (chỉ máy chụp, ngày demo 14/09/2026): Trần Thu Hà (id 2, GVCN Trần Ngọc Hà) đang học, Case S SOS 2 + 2 PA, nhận xét MT Speaking ghi tay ·
Đinh Ngọc Quyên (id 21, GVCN Ngô Bảo Nam) đã thi 12/09 có KQ · Trương Ngọc Bích (id 36) `thi_that_ngay` = 12/09, chưa điểm → chờ KQ ·
Ngô Hải Yến (id 23) môn đăng ký bỏ W1 + xoá điểm W1 MT3 → "không học".

| Ảnh | Trạng thái |
|---|---|
| `dang-hoc-1440-toi.png` | Đang học · Speaking (Case + PA, dự kiến thi, tuần này) |
| `dang-hoc-bang-1440-toi.png` | Đang học · nút Bảng |
| `da-thi-1440-toi.png` | Đã thi có KQ · W2 (◆ + −0.5) |
| `da-thi-cho-kq-1440-toi.png` | Đã thi · chờ kết quả |
| `da-thi-overall-1440-toi.png` | Overall = bảng Mock Test + hàng Thi thật |
| `p8-khong-hoc-1440-toi.png` | P8: W1 "không học" |
| `dang-hoc-375-sang.png` · `da-thi-375-sang.png` | 375: Hành trình là bảng |

## Truy vết khung → thành phần

| # | Khung mockup → thành phần | Kết quả |
|---|---|---|
| K1 | Đầu khối "Hành trình · {kỹ năng}" ⓘ + Biểu đồ \| Bảng → `HanhTrinhKn` | KHỚP |
| K2 | Tầng tháng: dải nền xen kẽ, vạch đầu tháng, năm ở tháng đầu / JAN khi trục qua năm → `BieuDoD` | KHỚP |
| K3 | W1…W5 dưới mọi cột, đậm ở cột có mốc | KHỚP |
| K4 | Hàng tên mốc MT · S Ex · Thi · nay đúng cột, không chồng | KHỚP (lượt đúng tuần này ghi "MT3 · nay" — critique vòng 1) |
| K5 | Trong vùng vẽ chỉ số band; dưới kỳ vọng vạch đứt đỏ + "−x" | KHỚP |
| K6 | Kỳ vọng lượt = vạch ngắn đúng cột (bỏ khi trùng Target) | KHỚP |
| K7 | Target bậc thang, một nhãn đầu phải | KHỚP (bậc từ `targetRevisions`) |
| K8 | Tuần này = cột hồng | KHỚP |
| K9 | Vắng: vòng đứt trên trục | KHỚP |
| K10 | Lượt chưa có điểm | KHÁC nhỏ — mockup không vẽ trạng thái này; web: vòng liền vàng + "?" + chú giải "chưa có điểm" (critique: chưa nhập ≠ vắng, nguyên tắc "không em nào bị bỏ sót") |
| K11 | Không học (P8): mockup lọc khỏi chart | KHÁC nhỏ — web ghi chữ "không học" trên trục, nối điểm qua (Review Focus 1: "chart / Bảng ghi 'không học'") |
| K12 | S Ex thoi hồng, không tính | KHỚP (Speaking, `/s-expert`) |
| K13 | Làn Case: thanh màu SOS, chữ trong thanh, đã đóng viền mảnh | KHỚP |
| K14 | Làn PA: chữ trong thanh + ●◐○✕…; "kỳ tới" đứt tới hạn kỳ | KHỚP (hạn = `followupDue`) |
| K15 | Thi dự kiến theo tháng → khối tháng; theo tuần → một cột | KHỚP |
| K16 | Đã thi chờ KQ → cột xanh lơ | KHỚP (ghi chú mockup nói "◇ ở mức Target", hình mockup chỉ có cột — theo hình: ◇ dễ đọc nhầm là điểm = Target) |
| K17 | Đã thi có KQ → ◆ lớn, số 15/800, vạch đỏ tới Target + "−0.5" | KHỚP |
| K18 | Chạm / Tab dấu → hộp nhỏ; Enter → "Hồ sơ lượt ›" | KHỚP (+ Enter trên thanh Case / PA mở ngăn Case tại trang) |
| K19 | Chú giải dưới chart, chỉ mục có trên chart | KHỚP |
| K20 | Dữ liệu dài: cột < 26 px bỏ hàng tuần, số chỉ ở điểm mới nhất; > 260 tuần khung 80 + "‹ Xem trước đó" | KHỚP |
| K21 | Tạm dừng: dải xám "Tạm dừng", không nối qua | KHỚP (máy chủ thêm `thongTin.khoangDung`) |
| K22 | Rê dòng Tiến độ → tô cột tuần | KHÁC — để PR ② (Tiến độ trên lớp làm lại ở PR ②; khối Tiến độ hiện tại là bảng `Bang`) |
| K23 | Nút Bảng: Lượt · Tuần · Band · Kỳ vọng · ± · Ghi chú; số hẹp, Ghi chú rộng nhất → `BangKn` | KHỚP |
| K24 | Ghi chú = nhận xét MT của kỹ năng ở lượt đó (vắng / không học / dự kiến khi không có) | KHỚP (Global Constraints; mockup để trống ô có điểm) |
| K25 | Hàng cuối Thi thật, đậm, so Target | KHỚP |
| K26 | 375: Hành trình là bảng; Tuần + Ghi chú xuống dòng phụ dưới Lượt | KHỚP |
| K27 | Overall = bảng Mock Test tại chỗ chart, hàng Thi thật cuối, nổi nhất → `KhoiMockTest` | KHỚP |
| K28 | Bảng Mock Test tách W1 \| W2, thi thật W một số (colspan) | KHỚP (mockup ghi [XM] "web gộp W"; theo khung đã duyệt — xem [XM-1]) |
| K29 | Bảng Mock Test tăng dần MT1 → MTn | KHỚP (trước PR giảm dần) |
| K30 | Kết quả hàng thi: "✗ Chưa đạt Target · −0.5" / "✓ Đạt Target" | KHỚP |
| K31 | 375 Overall: bảng cột đầu dính, cuộn ngang | KHÁC — GIỮ thẻ điện thoại V4 (PR-UXD Q9) + thẻ Thi thật cuối (xem [XM-2]) |
| K32 | Lớp thường: trục %, vạch "Đạt từ 70 %", nhãn "18/25", cột cuối Final | KHỚP (máy chủ thêm `attempts[].nguongDat`) |
| K33 | Chưa có lượt: chart chỉ MT1 sắp tới + cột thi dự kiến | KHỚP |

**BỎ / GIỮ**

| # | Mục | Kết quả |
|---|---|---|
| B1 | BỎ chart đường cũ (lưới tuần đứt dày, nhãn "MT2 6.0" mọi điểm) | KHỚP |
| B2 | BỎ khối "Mock Test" cuối tab (FT) — chuyển lên chỗ chart khi chọn Overall | KHỚP (lớp thường: "Kết quả Test" cuối tab GIỮ) |
| G1 | GIỮ "‹ Xem trước đó" khi > 260 tuần | KHỚP |
| G2 | GIỮ ghi chú dưới bảng Mock Test: Target đã đổi · Kết luận lộ trình · RF · chưa ghi điểm đầu vào | KHỚP |
| G3 | GIỮ `?dot=` mở đúng lượt (nay mở Overall rồi cuộn tới hàng) | KHỚP |

**Đếm:** 33 + 5 = 38 dòng — KHỚP 34 · KHÁC 4 (K10 nhỏ theo critique, K11 nhỏ theo Review Focus, K22 để PR ②, K31 GIỮ V4). **34/38 = 89 %**.
Không tính K22 (thuộc PR ②) → 34/37 = 92 %; chủ SP chấp nhận K10, K11 (theo luật / plan đã chốt) → 36/37 = 97 %.

## [XM] cần PTA Plan / chủ SP

- **[XM-1]** Bảng Mock Test: mockup tách W1 \| W2 (tự ghi [XM] "web gộp W"), kế hoạch nói "khối Mock Test hiện có". Đã làm theo khung duyệt (W1 \| W2, khớp ô điểm),
  thi thật W một số trải hai cột. Muốn giữ W gộp thì đổi lại một chỗ (`KN_MOCK` trong `StudentDetailPage.tsx`).
- **[XM-2]** 375 Overall: GIỮ thẻ mỗi lượt (PR-UXD Q9, đã duyệt) thay bảng cuộn ngang của mockup; thêm thẻ Thi thật cuối. Đổi sang bảng = PR riêng nếu chủ SP muốn.
- **[XM-3]** Hai Case cùng kỹ năng mở chồng thời gian (demo em 21: hai Case W2) — mockup chỉ vẽ một Case. Đã làm: mỗi Case chồng thời gian một làn Case + PA riêng
  (critique vòng 2: Case bị che = "bỏ sót"). Không đổi luật.
- **[XM-4]** MT xếp lịch SAU ngày thi thật (demo em 21: MT4 W1 OCT sau thi 12/09) — kế hoạch nói "Thi thật là cột cuối", nhưng thi thật không phải luật chặn nên web
  vẫn vẽ MT4 (sau cột thi) và bảng Mock Test vẫn có hàng MT4 "Chưa có điểm". Hỏi chủ SP: sau thi có KQ thì MT chưa làm ẩn đi, hay giữ (mờ, "dự kiến")? Chưa đổi gì.

## Thao tác TRƯỚC → SAU PR (CLAUDE.md "PR giao diện V5 = nâng cấp")

| Thao tác (main) | Sau PR | Ghi chú |
|---|---|---|
| Bấm ô điểm đổi kỹ năng Hành trình + Case & PA | GIỮ | Overall → bảng Mock Test tại chỗ chart |
| Đọc biểu đồ kỹ năng (chấm + nhãn MT) | ĐỔI → chart D; rê / chạm / Tab dấu → hộp nhỏ; Enter → hồ sơ lượt | K18 |
| — | MỚI: Biểu đồ \| Bảng; Enter / "Mở Case" trên thanh Case / PA → ngăn Case | |
| "‹ Xem trước đó" · "Về gần nhất ›" (> 260 tuần) | GIỮ | |
| Bảng Mock Test: bấm hàng → hồ sơ MT; MT{n} → hồ sơ MT; điểm kỹ năng → hồ sơ MT cuộn tới kỹ năng; nhãn dời / huỷ phần; thẻ 375 | GIỮ — nay ở Overall, tăng dần, "MT1 ›", W1 \| W2 (điểm W1 / W2 → cuộn tới Writing) | B2, K28 |
| `?dot=` mở đúng lượt | GIỮ (mở Overall + cuộn) | G3 |
| Tiến độ trên lớp (+ Ghi tiến độ, sửa / xoá) | GIỮ nguyên (PR ② làm lại) | |
| Case & phương án · {kỹ năng} (+ Case, Mở Case, Thêm PA, Kết quả…) | GIỮ nguyên | |
| Lớp thường: bảng "Kết quả Test" cuối tab | GIỮ; thêm chart % theo môn ở Hành trình | K32 |

Không mất thao tác nào.

## Máy chủ (chỉ đọc, không đổi luật) — `GET /students/:id`

- `attempts[].diemKn` (band từng ô nhập, W1 / W2 tách, đủ mọi lượt — `points` của bảng kỹ năng chỉ 4 lượt cuối) và `attempts[].nhanXet`
  (nhận xét bài MT; Speaking chưa có nhận xét người chấm → nhận xét GV phụ trách). Đọc từ điểm đã nạp sẵn (`diemCuaLuot`), không thêm câu SQL.
- `attempts[].nguongDat` (lớp thường) · `cycle.thiThat` (ngày, L R W S, OVR qua `thiThatCuaCycle`, Target lúc nhập, không thi) · `dauHoSo.thongTin.khoangDung`.
- Phép kiểm `server/src/tests/uiChartD.tests.ts` (7 ca). Không migration.
