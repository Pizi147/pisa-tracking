# PR-6 MAU-THONG-NHAT — kiểm kê màu kết quả (05/11)

Luật (chủ SP 05/11): **đỏ = không đạt · xanh dương = vừa đạt · xanh lá = exceed (vượt)**. Token như `ODiem`: `text-kq-duoi` (= `--bad`) ·
`text-kq-bang` (= `--doing`) · `text-kq-vuot` (= `--ok`); `lopKq()` ở `web/src/ui/BieuTuong.tsx` là một chỗ ánh xạ.
- Nhãn chỉ Đạt / Chưa đạt (không biết vượt) → Đạt **xanh dương**. `lopKq` thêm giá trị `'dat'` (→ `text-kq-bang`, đọc "Đạt").
- Số tỉ lệ (%) trung tính, trừ cột nhóm Exceed / Đạt / Fail (theo màu nhóm).
- KHÔNG đổi: dấu "✓ Đã lưu / Đã xong / Đã xem / Đã chốt / Có" (trạng thái việc, không phải kết quả) — giữ xanh lá `text-ok`.

Quét: `text-ok|text-dat|bg-ok-bg|border-ok|text-kq-*|lopKq|'vuot'|Nhan tone="ok"|Level tone="ok"|SCORE_CHIP.emerald` + nhãn Đạt / Chưa đạt / Pass / Fail / Exceed / Đạt Target ở `web/src/`.

## Sửa ở PR này (ngoài `phanTich/`, `BangLuotPanel`, `OSo`)

| # | Nơi | Ý nghĩa | Màu hiện tại | Màu đúng |
|---|---|---|---|---|
| 1 | Hồ sơ GV · dải chỉ số + bảng "Kết quả thi thật" (`HoSoGiaoVienPage.tsx` `MAU_THI`) | ▼ Fail · ▲ Pass · ★ Exceed | Fail đỏ · **Pass xanh lá · Exceed xanh dương** (ngược) | Fail đỏ · Pass xanh dương · Exceed xanh lá |
| 2 | Chip kết quả đợt Test (`ui.tsx` `SCORE_CHIP.emerald` / `SCORE_TEXT.emerald`) — `KetQuaDot`, ghim Hành trình, ghim Chương lớp, (Phân tích Test + SOS dùng chung) | Đạt (không SOS) | xanh lá | xanh dương |
| 3 | `NhanKq kq="dat"` (`Nhan.tsx`) — Đạt Target ở Panel sau thi, hồ sơ HV, bảng hồ sơ lớp, Lưới FT, Mock detail, Ý thức lớp, (Kết quả thi Phân tích dùng chung) | Đạt / Đạt Target | xanh lá | xanh dương |
| 4 | Lưới FT (`LuoiFT.tsx`) ô Kết quả "✓ Đạt" | Đạt (SOS 0) | xanh lá `kq-vuot` | xanh dương |
| 5 | Lưới lớp thường (`LuoiThuong.tsx`) % tổng | Đạt / Chưa đạt | xanh lá / đỏ | xanh dương / đỏ |
| 6 | Nhập điểm lớp thường (`ScoreEntry.tsx`) ô số pass / fail | Đạt / Chưa đạt | xanh lá / đỏ | xanh dương / đỏ |
| 7 | Bảng điểm lớp thường (`BangDiemLopThuong.tsx`) `ODiem` pass | Đạt | xanh lá ("Vượt kỳ vọng") | xanh dương ("Đạt") |
| 8 | Hành trình kỹ năng lớp thường (`HanhTrinhKyNang.tsx`) `ODiem` | Đạt | xanh lá | xanh dương |
| 9 | Biểu đồ D lớp thường (`BieuDoD.tsx` `kqSo(..., dat)`) | Đạt (bằng ngưỡng) | xanh lá | xanh dương |
| 10 | Hồ sơ HV · bảng Mock 375 "✓ Đạt" (`StudentDetailPage.tsx`) | Đạt | xanh lá | xanh dương |
| 11 | Hồ sơ HV · hàng Thi thật "✓ Đạt Target" (`StudentDetailPage.tsx`) | Đạt Target | xanh lá | xanh dương |
| 12 | Panel sau thi (`PanelSauThi.tsx`) OVR reached | Đạt Target | xanh lá `text-dat` | xanh dương |
| 13 | Panel kết quả thi thật (`KetQuaThiThatPanel.tsx`) | Đạt Target | Nhan xanh lá | xanh dương |
| 14 | Tổng kết lớp (`TabTongKetLop.tsx`) cột Thi thật · Giữa khoá · Cuối khoá · dải số | Đạt Target · n/n môn · % đạt | xanh lá; **chưa đạt vàng** | Đạt xanh dương; chưa đạt **đỏ**; dải số "Đạt Target" xanh dương, "Chưa đạt" đỏ |
| 15 | KQ đầu ra lớp FT (`BangKqdrLopFt.tsx`) | Đạt | xanh lá | xanh dương |
| 16 | Cuối khoá lớp (`CuoiKhoaLop.tsx`) % kết quả, nút chọn Đạt / Không đạt | Đạt / Không đạt | xanh lá / đỏ | xanh dương / đỏ |
| 17 | Ngăn tổng kết HV (`NganTongKet.tsx`) chip kỹ năng lớp thường | Đạt / Chưa đạt | xanh lá / **vàng** | xanh dương / đỏ |
| 18 | Kết luận khoá · Mini Test (`KetLuanKhoa.tsx`) | Đạt / Chưa đạt | xanh lá / vàng | xanh dương / đỏ |
| 19 | Đầu trang lớp (`DauTrangLop.tsx`) ô "Đạt …%" | số tỉ lệ | xanh lá | trung tính |
| 20 | Panel số liệu dùng chung (`SoLieu.tsx`, vd "HV tiến bộ" ở Tổng quan / hồ sơ GV) chữ "Đạt" / "Chưa đạt" cuối dòng | Đạt / Chưa đạt | trơn (không màu) | Đạt xanh dương (dòng `vuot`: xanh lá) · Chưa đạt đỏ |
| 21 | Hồ sơ HV · chip điểm môn lớp thường (`StudentDetailPage.tsx` `chipMon`, `Outcome`) | Đạt / Chưa đạt | xanh lá / **vàng** | xanh dương / đỏ (`Outcome` thêm tone `dat`) |
| 22 | Hồ sơ HV · ô Kết quả lượt không SOS (`Level`) | Đạt | xanh lá | xanh dương |
| 23 | Panel Case · điểm so kỳ vọng (`CasePanel.tsx`) | vượt / bằng / dưới | ≥ kỳ vọng xanh lá | vượt xanh lá · bằng xanh dương · dưới đỏ |
| 24 | Lưới lớp thường · chip kết quả (`LuoiThuong.tsx` `Level`) | Đạt | xanh lá | xanh dương |
| 25 | Ngăn tổng kết HV · Thi thật / Đạt Target (`NganTongKet.tsx`) · Tóm tắt lưu trữ (`TomTatLuuTru.tsx`) | Đạt Target | xanh lá | xanh dương |
| 26 | Bảng hồ sơ lớp FT · cột Kết quả "✓ Đạt" (`BangHoSoLop.tsx`) | Đạt (không SOS) | xám (U03) | xanh dương (luật 05/11 mới hơn U03) |

Giữ nguyên (không phải Đạt / Chưa đạt): Ngăn tổng kết dải "60–69 %", "50–59 %" vàng (mức giữa); chip SOS (họ màu SOS); "Học lại" vàng ở Tổng kết lớp thường;
PA "Tiến bộ" xanh lá (`Outcome ok`, kết quả PA không chấm theo kỳ vọng — chủ SP chưa nêu).

## Đúng sẵn (không sửa)

`ODiem` + `lopKq` (vượt / bằng / dưới) · `DiemKq` · `CotCaseHv` · `GocLichThi` · `BanGiaoPanel` · `DauKetQua` · `MuiTenKyVong` · `SoLieu` tab Fail · Pass · Exceed (chữ trung tính) ·
dấu "✓ đã xong / đã lưu" ở Công việc, Ý thức, Case, Tutor (trạng thái việc).

## Trong vùng session khác (chưa sửa — nhắn PTA Plan chuyển PR-1..4)

| Nơi | Ý nghĩa | Hiện tại | Đúng |
|---|---|---|---|
| `phanTich/BaoCao.tsx:34` `MAU_KQ_MT.dat` — ô "Đạt" kết quả MT theo lượt (Báo cáo) | Đạt kỳ vọng | xanh lá `text-ok` | xanh dương `text-kq-bang` |

Tự đổi theo PR này (dùng chung, không sửa tệp vùng đó): `TongHopTestSos` cột Đạt (`SCORE_CHIP.emerald`) và `KetQuaThi` nhãn Đạt (`NhanKq`) → xanh dương.
Không phải màu kết quả (giữ): Báo cáo ↑ tăng xanh lá / ↓ giảm đỏ (tiến bộ); `PhanTichGiaoVien` đúng hạn xanh lá; `BangLuotPanel`, `OSo` không tô màu kết quả.
