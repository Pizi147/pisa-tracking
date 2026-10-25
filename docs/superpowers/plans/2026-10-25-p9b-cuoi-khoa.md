# P9b CUOI-KHOA — Trang Cuối khoá lớp thường + hạn chốt N20 — Implementation Plan

> **For agentic workers:** chạy NGAY TRONG SESSION bằng superpowers:executing-plans (plan.md 1.2) + test-driven-development; skill `karpathy-guidelines`. Phần web: `/ponytail lite`; impeccable `clarify`, `layout`, `harden`, `adapt` (làm lại màn → được `polish` trong phạm vi); cuối `audit` + web-design-guidelines. Steps `- [ ]`.
> **Loại PR:** làm lại màn → cổng plan.md 1.6 Q-3…Q-6 (bảng truy vết, ảnh cặp, ≥ 90 % KHỚP, chủ SP duyệt ảnh trước merge). Chạy SONG SONG với P9a (chung `mywork.ts`, `shared/domain/cuoiKhoa.ts`, `ClassOverviewPage.tsx` — gộp thì giữ cả hai; chip "Xét lại n" ở trang Cuối khoá là của P9a).

**Goal:** một trang "Cuối khoá · lớp" thay 4 chỗ rời (tab Lộ trình tiếp theo, tab Đánh giá đầu ra, hộp Kết quả đầu ra, hộp Lộ trình · em): chọn nhóm, áp chung + ngoại lệ, lớp cùng chi nhánh, mở lớp tại chỗ, Kết quả đầu ra máy ghi, Kỳ vọng FT chỉ em Lên FT, chốt một bước; hạn chốt T5 tuần trước Final.

**Spec:** `plan.md` 1.6 **N17, N20, N22** (① ② ③), thiết kế `docs/superpowers/specs/2026-10-24-cai-tien-da-chot-design.md` 3.9 + R5.1–R5.3; mockup ĐÃ DUYỆT `thiet-ke/v6/cuoi-khoa.html` (khung 1–9) + truy vết `thiet-ke/v6/cuoi-khoa-truy-vet.md`. Nâng cấp, không chép mockup; [XM] → hỏi PTA Plan.

## Global Constraints
- **N20 hạn chốt:** `mocLoTrinh` (`shared/domain/chuyenLop.ts:91`) → `{ nhacTu: T2 tuần Final−1, hanChot: T5 tuần Final−1, hanBanGiao: CN tuần Final }` (Final T2 21/09 → nhắc 14/09, hạn 17/09, bàn giao 27/09). Mọi nơi đọc hàm này tự đổi (`lenhChuyen.ts:828`, `daiChuyenLop.ts:65`, `BangLoTrinhTiep.tsx:109`, `hanBanGiaoLenh`); sửa chữ `metrics.ts:281`. Chuông QL chi nhánh: T2 (hạn T5) · T5 (hôm nay hạn) · T6 (quá hạn) — mỗi lớp mỗi mốc một lần (khoá chống trùng theo lớp + mốc). Quá hạn đỏ, không chặn.
- **MT0 cuối tuần (N20):** chốt / sửa / huỷ Lên FT T6–CN tạo / huỷ MT0 tuần Final (đường `dongBoTuLenh` / MT0 không gọi `chanCuoiTuan` — P6 đã để vậy). Thêm phép kiểm khoá hành vi này; QL dời MT0 tay T6–CN vẫn 400.
- **Chỉ QL chốt hướng (N22 ①):** GVCN không gửi `huong`; chỉ `nhan_xet` (không bắt buộc). `huong_gvcn` cũ đọc được, không ghi mới. Cột "Gợi ý" = gợi ý máy theo Final (trước Final: "Chờ Final") + dòng phụ "GVCN: {nhận xét}".
- **Kết quả đầu ra (N17):** một cột máy ghi (`chuHopKetLuan` / `goiYCuoiKhoa`), không nút. Bỏ tab "Đánh giá đầu ra" (`TabDauRa.tsx`) và bảng `danh_gia_dau_ra` chỉ còn đọc lịch sử (không xoá dữ liệu).
- **Kỳ vọng FT (N17 + N22 ②):** chỉ dòng Hướng = Lên FT; máy gợi ý từ MT0 (`goiYKyVong`), chỉ QL bấm; Trung tâm → Case + Tutor 10 buổi/kỹ năng; Học viên → ô Phương án, không Case. Đổi nhãn "Kết quả đầu ra (…)" → "Kỳ vọng …" (`chuHopKetLuan`). Việc QL `ky_vong_dau_ra` (`mywork.ts:231, 1330`) + bảng chỉ đọc 4 tuần ở lớp FT (`BangKqdrLopFt.tsx`) **giữ**, đổi tên "Kỳ vọng", link về trang Cuối khoá lớp cũ. MT0 quá `tuanMuonNhatMt0` vẫn < 3 band → nút Đạt / Không đạt mở cho QL (không còn "Chờ MT0").
- **Cùng chi nhánh (N17):** luồng cả lớp chỉ lớp đích cùng chi nhánh — máy chủ chặn ở `transition.ts:162-181` + `raLenh` khi `boiCanh = 'cuoi-khoa'`. Chuyển MỘT em khác chi nhánh (ChuyenLopPanel) giữ.
- **Một bước:** "Chốt · n em" = `raLenh` / `suaLenh` theo lô (`guiTheoLo`), không bước "2 Xác nhận". "Lưu nháp" giữ (`luuNhap`). "Ngay hôm nay" → hộp xác nhận nêu tên em (N22 ③). Tóm tắt chân do máy chủ tính (cùng hàm lúc thi hành).
- **Mở lớp mới tại chỗ:** thêm prop `moLopMoi?: () => void` vào `ChonLop` (`web/src/ui/ChonLop.tsx`) — dòng "+ Mở lớp mới…" cuối danh sách; hộp mở lớp dùng lại phần của `TransitionPanel` (chương trình suy từ hướng, chi nhánh khoá theo lớp nguồn); xong điền vào thanh Áp, giữ em đang chọn.
- **R5.3 lớp FT:** gỡ ⋯ "Chuyển tiếp lớp…" (`hocVienLop.ts:684`), dải "Chưa chuyển được" (`DaiChuyenLop.tsx:37-41`), nhánh "Kết thúc lớp › đi tiếp" — sau khi dời `guiTheoLo`, `OTuan`, `NutHomNay`, `KHOI_VANG`, `OMt0` ra tệp chung; `ChuyenLopNhieuEm` dùng `ChonLop` có `moLopMoi`. Sửa phép kiểm prLcb / prOv3a / prCt / prLuiB.
- Hướng "Tạm dừng/ Kết thúc học" thay "Tạm dừng học" + "Dừng học hẳn" (cùng chữ N11; dữ liệu `bao_luu` / `dung_hoc` đọc như cũ).
- Đường: trang con `/hoc-vien/lop/:id?xem=cuoi-khoa`; ba lối vào (việc QL "Chốt lộ trình", ⋯ hồ sơ lớp "Cuối khoá…", dải hồ sơ HV chọn sẵn em + cuộn tới dòng); "‹ Quay lại" về đúng nguồn. 375 = thẻ em + tấm "Áp cho n em" + chân dính.
- Turso: ≤ 900 tham số, `UNION` ≤ 20 vế; đường mới có trần ở `tocDoDuong.ts`.

## Review Focus
1. FOU Final 21/09: T2 14/09 việc hiện "hạn T5 17/09"; T6 18/09 "Quá hạn 1 ngày", chốt vẫn được; chuông không lặp khi mở lại trang.
2. Chốt Lên FT thứ Bảy → MT0 có ở W4 SEP; QL dời MT0 thứ Bảy → 400 câu khoá.
3. 12 em: chọn nhóm "Lên BE" → Áp → sửa 3 dòng → Chốt = ≤ 11 bấm; 2 em lỗi → "Thử lại 2 em" giữ lựa chọn.
4. Lớp đích khác chi nhánh qua API cả lớp → 400; qua Chuyển lớp một em → được.
5. GVCN: không có ô Hướng; sửa nhận xét được; em đã chốt hiện 🔒.

---

### Task 1: Máy chủ — N20 + chi nhánh + nhận xét GVCN
**Files:** `shared/domain/chuyenLop.ts` (`mocLoTrinh`), `server/src/classes/lenhChuyen.ts` (`lopChoChotLoTrinh`, chuông), `server/src/classes/transition.ts`, `server/src/classes/loTrinhTiep.ts` (GVCN chỉ `nhan_xet`), `metrics.ts:281`; test `server/src/tests/prCuoiKhoa.tests.ts`, `run.ts`.
- [ ] `CK-1` `mocLoTrinh` 3 chương trình (Pre FOU / FOU / BE); việc QL hiện / hạn / quá hạn theo ngày giả; chuông 3 mốc không trùng.
- [ ] `CK-2` MT0 tạo khi chốt T6–CN; dời tay T6 → 400.
- [ ] `CK-3` lớp đích khác chi nhánh cả lớp → 400; một em → 200; GVCN gửi `huong` → 403, `nhan_xet` → 200.

### Task 2: Máy chủ — Kết quả đầu ra / Kỳ vọng / tóm tắt
**Files:** `shared/domain/cuoiKhoa.ts` (`chuHopKetLuan` nhãn "Kỳ vọng"), API trang Cuối khoá (gộp nguồn của `BangLoTrinhTiep` + `TabDauRa` + `HopKetQua`: một lời gọi), tóm tắt tác động, mở Kỳ vọng khi MT0 quá hạn, việc `ky_vong_dau_ra` đổi tên + href.
- [ ] `CK-4` một API trả đủ cột khung 2–4 (trước Final, sau Final, Lên FT); tóm tắt = số Case bổ trợ / Báo PH / Case Tutor đúng như lúc thi hành.
- [ ] `CK-5` Kỳ vọng mở khi MT0 thiếu band qua `tuanMuonNhatMt0`.

### Task 3: Web — trang Cuối khoá
**Files:** mới `web/src/modules/classes/CuoiKhoaLop.tsx` (+ thẻ 375); `ChonLop.tsx` (`moLopMoi`); gỡ `TabDauRa.tsx`, phần lớp thường của `BangLoTrinhTiep.tsx` / `HopKetQua`; lối vào ở `DauTrangLop.tsx` ⋯, việc QL, hồ sơ HV; R5.3 gỡ ở lớp FT.
- [ ] Bảng truy vết khung 1–9 → thành phần → ảnh (`docs/anh/p9b-cuoi-khoa/khop-khac.md`, GIỮ: Lưu nháp, Huỷ quyết định, Hoàn tác, bàn giao + hạn, việc "Chốt lộ trình", "Ngay hôm nay", Lý do khi khác gợi ý, việc Kỳ vọng; BỎ theo truy vết mockup), bảng thao tác TRƯỚC → SAU.
- [ ] Bấm thử ≥ 2 vòng (QL, GVCN; lớp thường + lớp FT): ảnh cặp toàn trang 1440 tối + 375 sáng (+ 125 %).

### Task 4: Kiểm cuối
- [ ] `npm run check` xanh; `do-khung` + `do-bang` 1440 / 1280 / 375; `/ponytail-review`; audit. Rà sâu (luồng chuyển lớp chính) do PTA Plan chạy `/code-review high`. Mở PR, KHÔNG merge; nhắn "PTA Plan".
