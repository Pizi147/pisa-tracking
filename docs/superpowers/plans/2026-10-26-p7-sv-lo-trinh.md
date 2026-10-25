# P7 SV-LO-TRINH — Trạng thái HV một nút + Bước tiếp 2 hướng + Lộ trình mới — Implementation Plan

> **For agentic workers:** chạy NGAY TRONG SESSION bằng superpowers:executing-plans (plan.md 1.2) + test-driven-development; skill `karpathy-guidelines`. Phần web: `/ponytail lite`; impeccable `clarify`, `layout`, `harden`, `adapt`; cuối `audit` + web-design-guidelines. Steps `- [ ]`.
> **Loại PR:** đổi bố cục (hộp trạng thái, Bước tiếp, panel Lộ trình mới, Lưu trữ) → cổng plan.md 1.6 Q-3…Q-6: bảng truy vết, ảnh cặp mockup | web, ≥ 90 % KHỚP, **chủ SP duyệt ảnh trước merge**. Rà sâu (dữ liệu trạng thái + migrate) → PTA Plan chạy `/code-review high`.
> **Song song:** P9a / P9b đang chạy ở cloud (account khác). KHÔNG chạm tệp của P9 (mục "KHÔNG chạm"). Chung tệp nào thì gộp giữ cả hai.

**Goal:** một nút "Tạm dừng/ Kết thúc học" ở mọi nơi, cả hai vào Lưu trữ, Quay lại học từ Lưu trữ; Bước tiếp sau thi thật còn 2 hướng; Lộ trình mới chọn LT1 / LT2 / RF / Khác, đầu vào = KQ thi thật, đóng Case / PA lộ trình cũ bằng lý do riêng. Sửa E1, E2, E3, E9, E10.

**Spec:** `plan.md` 1.6 **N11, N12, N22 ⑤**; thiết kế `docs/superpowers/specs/2026-10-24-cai-tien-da-chot-design.md` 3.1–3.3 + E1–E3, E9, E10; mockup ĐÃ DUYỆT `thiet-ke/v6/trang-thai-hv.html` (k1–k6) + `thiet-ke/v6/lo-trinh-moi.html` (**chỉ k1–k3**; k4–k7 và bước "2 Môn học" của k1 là P8) + hai tệp `*-truy-vet.md`. Nâng cấp, không chép mockup (CLAUDE.md "PR giao diện V5"); khung trái luật → [XM], hỏi PTA Plan.

**Hiện trạng (PTA Plan đã kiểm 26/10 trên main 355bad86):**
- Menu ⋯ "Tạm dừng / Thôi học" mở panel 2 tab (`shared/domain/quanLyHocVien.ts:16, 38-43`, `StudentManagePanel.tsx:65, 136`); mục riêng "Lưu trữ", "Bỏ lưu trữ", "Học lại", "Quay lại học".
- `setStudentStatus` (`server/src/students/students.ts:261`): chỉ `finished` ghi `archived_at` (`:300`); em đã lưu trữ bị chặn mọi đổi trạng thái (`:276`). `hoanTacTamDung` (`:595`) không xoá `archived_at` (E10). `archiveStudent` chỉ nhận `finished` (`:667`). `hocLai` (`:386`) có về lớp cũ / lớp mới + `hoanTacHocLai`.
- Hàng loạt: `server/src/students/hangLoat.ts` (`VIEC_HANG_LOAT`, gọi `setStudentStatus`, `archiveStudent`, `hocLai`…).
- Lưu trữ: `server/src/classes/luuTru.ts:62` (em có `archived_at`), web `LuuTruPage.tsx` (Bỏ lưu trữ · Học lại, chọn nhiều).
- Bước tiếp: `LUA_CHON_SAU_THI = ['lo_trinh_moi','tam_dung','ket_thuc']` (`shared/domain/tongKetLoTrinh.ts`), `goiYSauThi` trả `hoc_lai` (E9); máy chủ `server/src/loTrinh/buocTiep.ts:192` (`chonBuocTiep`; `lo_trinh_moi` đi `batDauBangHocLai` hoặc lệnh chuyển lớp); web `PanelBuocTiep.tsx`.
- `moLoTrinhMoi` (`server/src/classes/luatLoTrinh.ts:243`): chép `exam_month / exam_date / exam_period_id` khi không gửi tháng thi (E1), không ghi `baseline_*` (E3); route chỉ LT1 / LT2 / RF (`shared/domain/students.ts:45`, bảng route ở `sysconfig.ts:288`).
- Đóng Case hệ thống: `server/src/cases/systemClose.ts` (PA mở → `cancelled` + `closed_reason='system_closed'`, không vào Hiệu quả PA); lý do ở `SYSTEM_CLOSE_REASONS` (`shared/domain/cases.ts:585`).
- Lưới chấm FT: `ngungHocCua` (`server/src/fasttrack/attempts.ts:1392`) khoá ghi khi có `archived_at`.

## Global Constraints
- **Lưu tối giản (spec 3.1):** giữ `students.status` (`inactive` = tạm dừng, có thể quay lại · `finished` = kết thúc). Thêm `archived_at` cho CẢ `inactive`. Không thêm cột trạng thái. Mọi lọc "đang học" đã qua `HV_DANG_HOC_SQL` → tự đúng; kiểm lại 87 chỗ đọc `archived_at` (grep `archived_at` trong `server/src`, bỏ `tests/`): chỗ nào dùng `archived_at` với nghĩa "đã kết thúc" thì đổi sang `status = 'finished'`. Ghi danh sách chỗ đã đổi vào mô tả PR.
- **Hồ sơ em tạm dừng trong Lưu trữ:** như lưu trữ ("chỉ xem", `CAU_LUU_TRU`), TRỪ: Quay lại học, Kết thúc học, Sửa thông tin liên hệ (TVV cần gọi mời học lại — [ĐX] PTA, ghi vào báo cáo cho chủ SP chốt; nếu chủ SP không đồng ý thì chỉ bỏ dòng cho phép này). Lưới chấm FT: em tạm dừng hàng mờ "Tạm dừng", **vẫn nhập bù / sửa** điểm lượt cũ (không mất dữ liệu; `ngungHocCua` chỉ khoá khi `finished` + lưu trữ); không vào nợ / việc (đã đúng nhờ `HV_DANG_HOC_SQL`).
- **Một nút (N11):** `ViecQuanLy` thay `tam-dung-thoi-hoc` + `luu-tru` + `bo-luu-tru` + `hoc-lai` bằng `tam-dung-ket-thuc` ("Tạm dừng/ Kết thúc học") và `quay-lai` ("Quay lại học"). Mọi nơi một chữ: hồ sơ ⋯, ⋯ dòng theo vai (`mucDongTheoVai`), hàng loạt lớp, Bước tiếp, Lưu trữ. Dữ liệu / API cũ (`'bo-luu-tru'`, `archiveStudent`, `unarchiveStudent`) giữ ở máy chủ cho dữ liệu cũ; web không bày.
- **Hộp nhỏ (k2):** Từ ngày (`ONgay`) · Lý do (tuỳ chọn) · ô "Có thể quay lại học" (bật khi giữa khoá, tắt khi vừa có KQ thi thật) · "Khi lưu, web sẽ" lấy từ máy chủ (cùng hàm lúc thi hành: Case dừng hạn / đóng, lượt chưa điểm huỷ…). Bật → `inactive` + lưu trữ; tắt → `finished` + lưu trữ (như Thôi học nay). Trạng thái: Đang lưu… · lỗi giữ chữ + Thử lại · Hoàn tác 10 s · bị chặn nói đúng câu lỗi máy chủ + nút đi tiếp.
- **Quay lại học (N11, N22 ⑤):** một nút ở Lưu trữ + hồ sơ lưu trữ. Em `inactive`, lộ trình còn chạy: lớp cũ còn chạy → một bấm + Hoàn tác; lớp cũ đã kết thúc → hộp chọn lớp (`ChonLop`, P4) **gợi ý sẵn lớp đang chạy cùng chương trình, cùng chi nhánh** (QL đổi được) + Bắt đầu. Em `inactive` mà lộ trình đã đóng (tạm dừng sau thi) hoặc em `finished` có KQ thi thật → mở panel Lộ trình mới. Em `finished` giữa khoá → đường `hocLai` sẵn có (về lớp cũ / lớp khác), đổi tên "Quay lại học". Bỏ chặn `students.ts:276` cho đúng đường này; Hoàn tác xoá `archived_at` (E10).
- **Migrate `server/src/migrate/prSvLoTrinh.ts`:** em `inactive` hiện có, `archived_at IS NULL` → `archived_at` = ngày `pause` gần nhất trong `journey_events` (không có → ngày `students.updated_at` / hôm nay); chạy hai lần không đổi gì. Thêm cột `learning_cycles.route_ten TEXT NULL`; route `KHAC` vào bảng route (`sysconfig.ts`) + `ROUTES`, `ROUTE_NAME` ("Khác"). Ghi tên migrate vào `DEPLOY_2026-10.md` (danh sách migrate mới).
- **Bước tiếp 2 hướng (N12):** `LUA_CHON_SAU_THI = ['dung', 'lo_trinh_moi']` trên web; "Tạm dừng/ Kết thúc học" mở nội dung hộp k2 NGAY trong panel, ô tắt sẵn → máy chủ ghi `buoc_tiep = 'tam_dung' | 'ket_thuc'` như cũ theo ô. Dữ liệu cũ `hoc_tiep` / `hoc_lai` đọc + hoàn tác được. `goiYSauThi`: Đạt Target → "Tạm dừng/ Kết thúc học", chưa đạt / Không thi → "Lộ trình mới" (sửa E9, không trả `hoc_lai`). Giữ: Gia hạn 1 tuần, Huỷ hẹn, Lịch sử, Hoàn tác; GVCN chỉ xem.
- **Lộ trình mới (N12, k1–k3):** một panel: 1 Lộ trình LT1 · LT2 · RF · Khác (ô Tên bắt buộc) → 3 Target (giữ, Sửa; Khác: không bắt buộc + "Bỏ Target") → 4 Bắt đầu Ngay / Thứ Hai → 5 Lớp Giữ / Lớp khác (`ChonLop`; lớp sai loại mờ, không chọn được; lớp đang giữ sai loại → lỗi tại ô + nút tắt "Chọn lớp RF để lưu"). Bước "2 Môn học" **để P8** (không vẽ ô trống). Lộ trình mặc định chọn sẵn: LT1 xong → LT2; còn lại giữ route cũ.
  - Loại lớp: LT1 / LT2 → lớp FT route LT; RF → lớp RF; Khác → lớp FT bất kỳ. Kiểm ở máy chủ (400 + câu như mockup), web chỉ báo sớm.
  - Số MT = `lich_mt` lớp đích (LT 3, RF 2); **Khác = 0 MT** (không nhắc xếp MT, không SOS tự động khi không Target — như KCK; "+ MT" ở Kế hoạch Test vẫn dùng được).
  - `moLoTrinhMoi`: **không chép ngày thi** (E1: `exam_month / exam_date / exam_period_id` = NULL trừ khi gửi); **đầu vào** `baseline_*` = KQ thi thật gần nhất (`learning_cycles.thi_that_*` của lộ trình vừa xong; không có → MT có Overall gần nhất, ghi nguồn vào `baseline_nguon` hoặc nhật ký; không ghép điểm nhiều lần thi) (E3); "Giữ lớp" khi lớp cũ đã kết thúc → máy chủ tự mở lại lớp (E2, không bắt web gửi `moLaiLop`).
  - Case chưa xong của lộ trình cũ → `dongCaseHeThongLo` lý do MỚI `ket_thuc_lo_trinh` ("Kết thúc lộ trình"), PA đang chạy → `cancelled` + nhãn "Dừng — kết thúc lộ trình" (không vào Hiệu quả PA — đã đúng với `system_closed`, thêm phép kiểm). Thay `course_ended` CHỈ ở đường Lộ trình mới.
  - "Khi lưu, web sẽ" do máy chủ tính (cùng hàm lúc thi hành): "Tạo MT1–MT3 (W? ? / …) · đóng n Case (S) — Kết thúc lộ trình · đầu vào = KQ thi {ngày} (L R W S)". Lỗi giữ lựa chọn; Hoàn tác như Bước tiếp hiện có.
- **Hàng loạt (k3):** thanh chọn lớp: "Tạm dừng/ Kết thúc học" (một mục thay 3) · Chuyển lớp… · Xuất · Bỏ chọn → cùng hộp "· n em"; lỗi một phần: "Đã lưu n em" + em lỗi giữ lý do + "Thử lại n em" (`guiTheoLo` nếu đã có ở tệp chung; chưa có thì dùng mẫu trong `hangLoat.ts`, KHÔNG tự dời `guiTheoLo` — P9b đang dời).
- **Hồ sơ lưu trữ (k6):** một dòng tóm tắt (lộ trình gần nhất · Target · thi thật · kết quả · ngày kết thúc) từ `cacLoTrinh` / bản chụp sẵn có (`tongKet.ts`), + "Lộ trình & lớp" như cũ + nút chính Quay lại học; biến thể em tạm dừng ("Tạm dừng · Có thể quay lại").
- **Ai:** như hiện nay (`lopHoc.quyen`: `tamDung`, `ketThuc`, `quayLai`, `hocLai`); máy chủ vẫn kiểm. Không thêm vai.
- Turso: ≤ 900 tham số, không tham số đặt tên; đường mới (gợi ý lớp Quay lại, tóm tắt Lộ trình mới) có trần ở `tocDoDuong.ts`. EN qua `t()`.
- **KHÔNG chạm (P9a / P9b):** `shared/domain/cuoiKhoa.ts`, `shared/domain/lenLop.ts` (chữ hướng Cuối khoá), `server/src/normal/cuoiKhoa.ts`, `server/src/classes/{transition,lenhChuyen,loTrinhTiep}.ts`, `BangLoTrinhTiep.tsx`, `TabDauRa.tsx`, `TransitionPanel.tsx`, `ChuyenLopPanel.tsx`, `DaiChuyenLop.tsx`, `web/src/ui/ChonLop.tsx` (dùng như hiện có). `mywork.ts`, `hocVienLop.ts` chung → chỉ sửa dòng của P7, gộp giữ cả hai. P8 (Môn đăng ký) không làm ở đây.

## Review Focus
1. Em giữa khoá: ⋯ › Tạm dừng/ Kết thúc học › Tạm dừng → em ở Lưu trữ, lớp còn giữ chỗ, Case dừng hạn, không còn nợ / việc; lưới FT vẫn nhập bù MT2 cũ; Hoàn tác 10 s → hết lưu trữ (E10).
2. Lưu trữ › Quay lại học: lớp cũ còn chạy → một bấm, hạn Case tính lại; lớp cũ đã kết thúc → gợi ý lớp cùng chương trình cùng chi nhánh, đổi được, Bắt đầu.
3. Bước tiếp sau thi LT1 (Đạt Target): gợi ý "Tạm dừng/ Kết thúc học", ô tắt → Kết thúc học + Lưu trữ; chọn Lộ trình mới → LT2 chọn sẵn, **3 bấm**, MT1–MT3 có, không ngày thi cũ (E1), đầu vào = KQ thi thật (E3), Case S đóng "Kết thúc lộ trình", PA không vào Hiệu quả PA.
4. RF khi đang giữ lớp LT → lỗi tại ô Lớp + nút tắt; chọn lớp RF → MT1–MT2. Khác: không Tên → lỗi tại ô; 0 MT, không SOS khi không Target. Giữ lớp đã kết thúc → mở lại lớp, không 400 (E2).
5. Hàng loạt 3 em, 1 em có lệnh chuyển lớp đang chờ → "Đã lưu 2 em" + lý do em lỗi + "Thử lại 1 em". Migrate chạy hai lần: em `inactive` cũ có `archived_at` đúng ngày pause, không đổi thêm.

---

### Task 1: Luật thuần + migrate
**Files:** `shared/domain/quanLyHocVien.ts` (mục menu, nhãn), `shared/domain/tongKetLoTrinh.ts` (`LUA_CHON_SAU_THI`, `goiYSauThi`), `shared/domain/students.ts` (`ROUTES`, `ROUTE_NAME` + Khác), `shared/domain/cases.ts` (`ket_thuc_lo_trinh`); `server/src/migrate/prSvLoTrinh.ts`; test `server/src/tests/prSvLoTrinh.tests.ts`, `run.ts`.
- [ ] `SV-1` menu: một mục "Tạm dừng/ Kết thúc học" cho `active` / `inactive`; `quay-lai` cho em lưu trữ chưa `finished`-không-quay-lại; không còn `luu-tru` / `bo-luu-tru` / `hoc-lai` trên web; `mucDongTheoVai` cùng chữ.
- [ ] `SV-2` `goiYSauThi` không trả `hoc_lai` (E9); bảng gợi ý 3 trường hợp.
- [ ] `SV-3` migrate: em `inactive` → `archived_at` = ngày pause; chạy hai lần không trùng; cột `route_ten`, route `KHAC`.

### Task 2: Máy chủ — trạng thái, Quay lại học, lưu trữ
**Files:** `server/src/students/students.ts` (`setStudentStatus` ghi `archived_at` cho `inactive`, bỏ chặn `:276` cho Quay lại học, `hoanTacTamDung` xoá `archived_at`), `server/src/students/hangLoat.ts`, `server/src/classes/luuTru.ts` (em tạm dừng + nhãn tiến độ, gợi ý lớp), `server/src/fasttrack/attempts.ts` (`ngungHocCua`), các chỗ đọc `archived_at` nghĩa "kết thúc" (rà 87 chỗ), API tóm tắt "Khi lưu, web sẽ".
- [ ] `SV-4` tạm dừng / kết thúc → cả hai lưu trữ; Hoàn tác (E10); hồ sơ tạm dừng chỉ xem trừ 3 việc (Global Constraints).
- [ ] `SV-5` Quay lại học: lớp cũ chạy / đã kết thúc (gợi ý N22 ⑤) / lộ trình đã đóng → trả `moLoTrinhMoi: true` cho web mở panel; quyền như cũ.
- [ ] `SV-6` hàng loạt lỗi một phần; lưới FT nhập bù em tạm dừng 200, em kết thúc + lưu trữ 400 như cũ.

### Task 3: Máy chủ — Bước tiếp + Lộ trình mới
**Files:** `server/src/loTrinh/buocTiep.ts`, `server/src/classes/luatLoTrinh.ts` (`moLoTrinhMoi`: E1, E3, Khác, `route_ten`), `server/src/cases/systemClose.ts` (lý do mới), kiểm loại lớp, mở lại lớp (E2).
- [ ] `SV-7` Lộ trình mới LT2 / RF / Khác: MT đúng số, không ngày thi cũ, `baseline_*` từ thi thật (không có → MT gần nhất + nguồn), Case + PA đóng đúng lý do, Hiệu quả PA không đổi.
- [ ] `SV-8` lớp sai loại 400; Giữ lớp đã kết thúc → mở lại (E2); Khác không Tên 400.
- [ ] `SV-9` dữ liệu cũ `hoc_tiep` / `hoc_lai` / `tam_dung` đọc + hoàn tác được; tốc độ đường mới ≤ trần `tocDoDuong`.

### Task 4: Web
**Files:** `StudentManagePanel.tsx` (hộp mới thay `TamDungThoiHocPanel` 2 tab), `thaoTacDongHocVien.tsx` (hàng loạt), `PanelBuocTiep.tsx` (2 hướng + panel Lộ trình mới k1–k3; tách tệp `PanelLoTrinhMoi.tsx` nếu > 300 dòng), `LuuTruPage.tsx` (Quay lại học, em tạm dừng), `StudentDetailPage.tsx` / `CacLoTrinh.tsx` / `NganTongKet.tsx` (dòng tóm tắt k6, tên lộ trình Khác), `PanelSauThi.tsx` / `PanelViec.tsx` nếu đọc nhãn cũ. 375 = màn đầy đủ.
- [ ] Bảng truy vết k1–k6 (trang-thai-hv) + k1–k3 (lo-trinh-moi) → thành phần → ảnh (`docs/anh/p7-sv-lo-trinh/khop-khac.md`, dòng GIỮ / BỎ theo hai tệp truy vết mockup), bảng thao tác TRƯỚC → SAU (đếm bấm khớp truy vết: tạm dừng 3, kết thúc 4, LT2 3).
- [ ] Bấm thử ≥ 2 vòng (QL, GVCN, TVV): ảnh cặp toàn trang 1440 tối + 375 sáng.

### Task 5: Kiểm cuối
- [ ] `npm run check` xanh; `do-khung` + `do-bang`; `/ponytail-review`; audit + web-design-guidelines. Mô tả PR: danh sách chỗ `archived_at` đã đổi nghĩa, chú thích `ponytail:`, [ĐX] Sửa thông tin em tạm dừng. Mở PR, KHÔNG merge; nhắn "PTA Plan".
