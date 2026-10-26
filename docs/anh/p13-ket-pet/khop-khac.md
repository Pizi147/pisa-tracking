# P13 KET-PET — khớp / khác, thao tác trước → sau, chỗ đọc thi thật

Plan: `docs/superpowers/plans/2026-10-26-p13-ket-pet.md` · luật `plan.md` 1.6 N18 · đặc tả `2026-10-24-cai-tien-da-chot-design.md` mục 3.10.
PR sửa giao diện **theo mẫu sẵn có** (ô Target ở Sửa thông tin, hộp Kết quả thi thật, lưới Checkpoint như lớp thường 4 môn) — không màn / bố cục mới, không ảnh cặp mockup.

## Quy chế lớp thường

Đã đối chiếu tệp chủ SP gửi 26/10 (`[P. Học thuật] Quy định và Chế tài lớp thường.docx`): quy chế **chỉ nói PreFound · Found · BE · ELE**, mức Pass 70 % cho Progress / Final.
Không có mục KET / PET → không có điểm nào khác plan. Ngưỡng Checkpoint KET / PET giữ `nguongDat` 0.7 của chương trình (khớp mức 70 % chung). Không [XM].

## Bảng thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | Ghi chú |
|---|---|---|---|
| Nhập điểm Checkpoint PET / KET | 2 ô L+S, R+W (đúng / tổng) | 4 ô **L · R · W · S** (đúng / tổng), đạt từ 70 % **mỗi môn**, chip "SOS · L S" | Lưới, lọc môn, Tổng số câu, Dán từ Excel, Nhận xét, ⋯ ô giữ nguyên |
| Lượt Checkpoint cũ đã ghi ở L+S / R+W | — | **Giữ** L+S, R+W cho đúng lượt đó (điểm, "-", nhận xét giữ; nhập ô gộp còn trống như cũ); lượt chưa ghi gì → 4 môn | Một luật `boMonTheoLuot` / `boMonCuaLuot` cho lưới điểm, bảng Tổng hợp lớp, Phân tích lớp, hồ sơ, xuất, bản chụp |
| GV phân công môn gộp | GV "L+S" | Dòng L+S **giữ** (lịch sử + người phụ trách ô gộp cũ) + thêm L và S cho GV đó | Không ai mất lớp / việc nhập điểm; Công việc / Nợ điểm tìm đúng GV của ô gộp cũ |
| Sửa Target em KET / PET (⋯ › Sửa thông tin) | Ô band 0–9; lưu → 400 "Chương trình liên tục không có Target." | Ô **"Target (B1 Preliminary 120–170)"** số nguyên, không KCK, lỗi tại ô | Lý do đổi Target bắt buộc như cũ; GVCN → Đề xuất sửa cùng thang |
| Sửa cả lớp / Đề xuất sửa Target KET / PET | band | thang Cambridge (`docTargetCua`; thẻ đề xuất nhớ thang — Sửa đề xuất kiểm cùng thang); khoá KET / PET bỏ qua cờ KCK | gợi ý cột Target ở Thêm học viên / Sửa cả lớp theo thang |
| Thêm em vào lớp KET / PET (cột Target) | cột có nhưng bỏ qua | **lưu** Target Cambridge; sai thang → lỗi tại ô, không thêm dòng | |
| Nhập KQ thi thật em KET / PET (⋯ › Kết quả thi thật) | Không có mục | Mục **có**: ngày thi (`ONgay`) + L R W S số nguyên trong thang; Overall · Grade · CEFR · Đạt / Chưa đạt Target máy tính; "Không thi" | Lưu xong → đóng + "Đã lưu" (KHÔNG Bước tiếp — KET / PET không có luồng sau thi); Lịch sử giữ |
| Đầu hồ sơ HV KET / PET | Lớp · Chương trình · Khoá học · GVCN · TVV | + **Target 145** + **Thi thật B1 Preliminary: 159 · Grade B · B1 · Đạt Target** | Không định dạng band ("150", không "150.0") |
| ⋯ dòng học viên của TVV / CX (Học viên & Lớp) | em KET / PET: không "Kết quả thi thật" | **có** như hồ sơ | `mucDongTheoVai` nhận `kyThi` |
| Các lộ trình / Tổng kết lộ trình (khoá KET / PET đã đóng) | % Checkpoint gần nhất / trống | **Thi thật 159 · Grade B · B1 · Đạt Target** (Đạt theo Target lúc nhập) | đọc lộ trình, không bản chụp (Báo cáo lịch sử không đọc bản chụp) |
| Chuyển lớp / chuyển tiếp cả lớp / Lộ trình mới | Target / KCK chép thường → thường, FT → thường | chỉ chép khi **cùng thang** (`cungThangTarget`) | FT ↔ KET / PET, FOU ↔ KET / PET không mang Target sang |
| FT: Target, KQ thi thật, Bước tiếp | band | **không đổi** | phép kiểm FT cũ + KP-3 / KP-4b |

Thao tác mất: **không**. Chỉnh nhỏ: Lịch sử thay đổi hiện số > 9 dạng nguyên (Target 150 không thành "150.0").

## Chỗ đọc `thi_that_*` / `target_score` (≈ 40 tệp) — không trộn thang

KET / PET lưu **chỉ** `thi_that_ngay`, `thi_that_l/r/w/s`, `thi_that_khong_thi`, `thi_that_nhap_boi/luc`, `thi_that_target`; **KHÔNG** ghi `outcome`, `outcome_score`, bản chụp `ban_chup_lo_trinh`.
Lộ trình KET / PET có `route IS NULL`.

| Chỗ đọc | Trạng thái | Căn cứ |
|---|---|---|
| `phanTich/ketQuaThi.ts` (Kết quả thi › thi thật) | đã lọc | `c.route IS NOT NULL` · KP-4c so JSON trước / sau |
| `phanTich/giaoVien.ts` thi thật (Phân tích GV, hồ sơ GV) | đã lọc | `outcome IN ('reached','not_reached')` (KET / PET NULL) + em từng học lớp FT · KP-4c |
| `phanTich/giaoVien.ts`, `baoCao.ts` `target_at_attempt` | không ảnh hưởng | chỉ lượt MT (FT) |
| `loTrinh/thiThat.ts` việc chờ KQ, `sauThiTheoEm`, `sauThiCuaEm` | đã lọc | `route IS NOT NULL` · KP-4c |
| `loTrinh/buocTiep.ts`, `cotSauThi.ts` (Bước tiếp, nhãn sau thi) | đã lọc | câu Bước tiếp lọc FT · KP-4c (`choBuocTiep` không đổi) |
| `loTrinh/banChup.ts`, `tongKet.ts` | **đã rẽ** | KET / PET không ghi bản chụp (thang band); Các lộ trình + Tổng kết lộ trình đọc 4 cột của lộ trình, Đạt theo `thi_that_target` · KP-4d |
| `worklist/viecTvv.ts`, `mywork.ts` (Chốt ngày thi, Điền Target) | đã lọc | `is_fast_track && route` / `route IS NOT NULL` |
| `worklist/hvCuaToi.ts` (sắp thi) | không ảnh hưởng | chỉ ngày thi (không điểm) |
| `classes/luatLoTrinh.ts` `dauVaoTuLoTrinh` | đã lọc | chỉ gọi từ Bước tiếp FT |
| `classes/luatLoTrinh.ts` `moLoTrinhMoi`, `apDungMotDong`, `apDungCaLop` | **đã rẽ** | `cungThangTarget` — Target / KCK / mục tiêu chỉ chép khi cùng thang · KP-3c, KP-3d, KP-3e |
| `fasttrack/cycles.ts` `reviseTarget`, `loiDoiTarget` | **đã rẽ** | `docTargetCua` theo `kyThiCuaChuongTrinh` · KP-3 |
| `classes/suaCaLop.ts`, `duyet/deXuatSua.ts` | **đã rẽ** | cùng thang · KP-3 |
| `classes/intake.ts` | **đã rẽ** | cột Target KET / PET theo thang · KP-3, KP-3b |
| `students/profile.ts` | **đã rẽ** | `kyThi`, `thiThat` (Overall · Grade · CEFR) chỉ cho KET / PET |
| `students/lichSuSua.ts` | **đã rẽ** | Target theo kỳ thi của khoá (không còn luật "> 9") |
| `classes/hocVienLop.ts`, `classes.ts`, `lichThi.ts`, `hocVienTheoVai.ts`, `xuatDanhSach.ts`, `students.ts`, `hanhTrinh.ts`, `cases.ts` | không ảnh hưởng | chỉ HIỆN Target của lộ trình em (lớp liên tục ẩn cột Target / Lộ trình tiếp theo, Hành trình chỉ ghi Target lớp FT); không tính trung bình / tỷ lệ |
| `classes/phanTichLop.ts`, `students/standing.ts`, `fasttrack/attempts.ts`, `mt0.ts`, `schedule.ts` | không ảnh hưởng | kỳ vọng / MT chỉ FT (`ratio` → null) |
| `classes/luatLoTrinh.ts` `xemChuyenLop`, `lenhChuyen.ts` khoá Target lên FT | **đã rẽ** (sửa sau rà) | Target Cambridge không điền sẵn làm Target FT · KP-3d |
| `classes/transition.ts` `dienSanChuyenTiep` | không ảnh hưởng | lớp liên tục bị chặn ở đầu hàm (`CAU_LIEN_TUC.loTrinhTiep`) |
| `platform/lichSu.ts` (Lịch sử thi thật) | **đã rẽ** | điểm theo kỳ thi của khoá (không còn luật "> 9") |
| `classes/lenhChuyen.ts` KCK lệnh | không ảnh hưởng (như cũ) | lệnh KCK tới lộ trình liên tục trước đã 400, nay 400 thang Cambridge |
| `duyet/loaiYeuCau.ts`, migrate cũ, `ops/kiemTruocLtSv.ts` | không ảnh hưởng | so Target đề xuất / lộ trình FT |

## Task 0 — kiểm dữ liệu (DB demo cục bộ, `npm run kiem-truoc-ket-pet`)

Trước migrate (bộ demo CŨ, môn gộp):

```
Môn PET (programme_skills): listening_speaking, reading_writing
Môn KET (programme_skills): listening_speaking, reading_writing
Lớp PET · active: 1
Em đang học lớp PET / KET: 3
Lượt GIỮ môn gộp (đã có điểm / dấu "-" / nhận xét môn gộp): 2
Lượt TÁCH 4 môn (chưa ghi gì ở môn gộp): 3
Phân công GV môn gộp sẽ thêm dòng môn tách (dòng gộp giữ): 2
Case mở theo môn gộp (giữ nguyên): 0
Lộ trình KET / PET có dấu KCK (sẽ bỏ dấu, Target giữ): 0
```

`npm run migrate` lần một in 4 dòng P13 (PET, KET bộ môn · MB PET 01 môn + phân công · MB PET 01 3 lượt chưa có điểm môn gộp → 4 môn); lần hai **không in**.
Sau migrate: giữ 2 lượt (Checkpoint 1 của 2 em đã chấm), tách 0, phân công thiếu 0 (ảnh `sau-migrate-*`).
**Bản sao DB thật: chưa chạy** (không có trên cloud) — bước ở `DEPLOY_2026-10.md` (P13 KET-PET): chạy `kiem-truoc-ket-pet` trên `mig.sqlite` trước migrate, gửi số cho PTA Plan.

## Ảnh (Playwright, 1440 tối + 375 sáng)

| Ảnh | Nội dung |
|---|---|
| `truoc-checkpoint1-1440-toi.png`, `truoc-checkpoint1-375-sang.png`, `truoc-checkpoint2-1440-toi.png` | lưới Checkpoint cũ L+S · R+W |
| `truoc-ho-so-pet-1440-toi.png`, `truoc-ho-so-pet-375-sang.png` | hồ sơ em PET: không Target, không thi thật |
| `sau-checkpoint1-4-mon-1440-toi.png`, `sau-checkpoint1-4-mon-375-sang.png` | lưới Checkpoint 4 môn (seed mới) |
| `sau-migrate-checkpoint1-giu-gop-1440-toi.png`, `sau-migrate-checkpoint2-4-mon-1440-toi.png`, `sau-migrate-ho-so-lop-tong-hop-1440-toi.png` | DB cũ sau migrate (lượt — không còn theo đợt): lượt đã chấm giữ L+S / R+W, đợt chưa có điểm 4 môn |
| `sau-ho-so-pet-1440-toi.png`, `sau-ho-so-pet-375-sang.png` | đầu hồ sơ: Target 145 · Thi thật B1 Preliminary 159 · Grade B · B1 · Đạt Target |
| `sau-kq-thi-that-pet-1440-toi.png`, `sau-kq-thi-that-pet-375-sang.png` | hộp Kết quả thi thật thang Cambridge |
| `sau-de-xuat-sua-target-375-sang.png` | Đề xuất sửa Target (GV): "đang là 150", gõ 6.5 → "Số nguyên 120–170" tại ô |
| `sau-sua-thong-tin-target-1440-toi.png`, `sau-sua-thong-tin-target-loi-375-sang.png` | ô Target (B1 Preliminary 120–170); gõ 99 → lỗi tại ô |

Bấm thử: QL lưu KQ thi thật qua giao diện (S 150 → 152) → "Đã lưu", panel đóng, đầu hồ sơ cập nhật, `outcome` / `outcome_score` vẫn NULL;
GV T_HA (dạy L, S) mở Checkpoint 1: ô L, S nhập được, R, W chỉ đọc.

## Phép kiểm đổi / ảnh chụp đo

- Sửa theo luật mới: OV6b2-3 (PET 4 môn, chip "SOS · L S"), OV6b2-4 (PET có Target Cambridge — 400 "B1 Preliminary: 120–170" thay "không có Target"),
  OV6b2-5 (KET 4 môn), OV6b2-6 (PET / KET mặc định 4 môn), OV11h-1 (Phân tích lớp / GV theo L · R · W · S), OV11h-2 (hạng mục Case PET / KET = 4 môn).
- TD4-a (×3): chụp lại 7 băm — so JSON Công việc main ↔ nhánh (32 tài khoản × Của tôi / Tất cả): lệch CHỈ 2 việc "Nhập điểm Checkpoint · MB PET 01"
  (L+S → L, S; R+W → R, W; 1 → 2 bài). Trần câu `QL /my-work?nguoi=7` 68 → 69: do dữ liệu (mã P13 chạy trên dữ liệu main vẫn 68).
- `npm run check`: sqld bỏ qua (máy cloud không có sqld) như các PR trước.

## Sửa theo rà sâu PTA Plan (26/10)

| # | Việc | Cách sửa | Phép kiểm |
|---|---|---|---|
| gốc | Dữ liệu môn gộp cũ rải rác | MỘT luật `boMonTheoLuot` (shared) / `boMonCuaLuot` (máy chủ): lượt có dòng điểm môn gộp → bộ gộp, còn lại → bộ chương trình; thang theo khoá `kyThiCuaChuongTrinh`. Bỏ fallback `evaluateRegular`, `monGopCu`, quyền `MON_GOP`, lịch sử "> 9" | KP-2a |
| 1 | Phân công môn gộp | Không đổi tên: giữ dòng gộp + thêm môn tách; `ownerOf` / Nợ điểm / Phân tích GV tìm được GV ô gộp cũ | KP-2a, KP-2e |
| 2 | Chép Target khác thang | `cungThangTarget` cho `moLoTrinhMoi`, `apDungMotDong`, `apDungCaLop`, `xemChuyenLop` | KP-3c, KP-3d, KP-3e |
| 3 | Bảng khoá (lượt, môn) | Mọi bảng có `attempt_id` + `skill` (trừ điểm) — `attempt_skills`, `attempt_skill_skips`, `skill_move_requests` — tách theo lượt (`case_signals` không đụng — vòng 2); cột duy nhất (khoá chống trùng) để trống ở bản chép | KP-2f |
| 4 | Phân tích lớp | Dòng = bộ môn các lượt (lượt cũ thêm L+S, R+W) | KP-2g |
| 5 | Đề xuất sửa (panel) | Kiểm theo thang khoá, không KCK, "đang là" số nguyên; thẻ nhớ thang cho Sửa đề xuất | (web) |
| 6 | KQ khoá đã đóng | Các lộ trình + Tổng kết lộ trình hiện KQ Cambridge; Đạt theo `thi_that_target`. **Không ghi bản chụp:** Báo cáo lịch sử (P12 — `ketQuaThi.ts`, `giaoVien.ts`, `baoCao.ts`) đọc `learning_cycles`, không đọc `ban_chup_lo_trinh`; bản chụp có cột band (`thi_that_ovr`, `ket_luan`) — ghi Cambridge vào đó mới là trộn thang | KP-4d |
| 7 | ⋯ dòng theo vai | `mucDongTheoVai({ kyThi })` | (web) |
| 8 | KCK của khoá KET / PET | Đề xuất sửa / `loiDoiTarget` bỏ qua cờ; migrate bỏ dấu KCK (Target giữ, ghi applied) | KP-2h |
| 9 | Hiện Target số nguyên | `TargetText({ kyThi })` — hồ sơ, Sửa thông tin, Hành trình đổi Target, Đề xuất sửa; Tổng kết lộ trình; gợi ý cột Target (Thêm học viên, Sửa cả lớp) | (web) |

Còn lại (ghi để PTA quyết): lưới **Nhập điểm** một Checkpoint cũ trộn hai bộ môn (lượt đã chấm L+S / R+W + lượt chưa ghi 4 môn) có 6 cột, rộng hơn 1440 → cuộn ngang trong bảng
(chỉ dữ liệu cũ, hết khi đợt cũ xong). Màn ít dùng đọc bộ môn của **lớp** (Kế hoạch Test, phân công) vẫn 4 môn.

## Vòng 2 — PTA Plan rà (26/10), sau khi gộp origin/main (P9a #584)

| # | Việc | Cách sửa | Phép kiểm |
|---|---|---|---|
| 1 | Nơi tính kết quả còn duyệt bộ môn chương trình | `boMonTheoLuot` ở `standing.ts`, `yThuc/phoiHop.ts`, `normal/cuoiKhoa.ts` (`tyLeTongLo`), `loTrinh/banChup.ts`, `worklist/scoreDebt.ts`, `phanTich/giaoVien.ts`; `cham/canCham.ts` đếm môn của dòng. Kèm: `standingFor` đọc `scoringMode` từ bảng `programmes` (KET / PET chỉ có ở bảng → trước đây rơi vào nhánh IELTS) | KP-5a |
| 2 | Gửi lại bức tranh phân công có dòng môn gộp → 400 | `setClassTeachers` coi môn gộp đang có dòng phân công là môn hợp lệ | KP-5b |
| 3 | Lưu phân công kết thúc dòng môn gộp còn việc | **Chọn: giữ dòng.** `ghiPhanCong` không kết thúc dòng môn gộp (GV bộ môn) khi lớp còn ô môn gộp chưa có điểm / "-" ở lượt chưa huỷ, hoặc Case mở theo môn gộp (`monGopConCan`); hết việc thì kết thúc như mọi dòng. Không khôi phục fallback quyền ở `permissions.ts` | KP-5b |
| 4 | Thẻ đề xuất không nhớ thang | `guiDeXuatSua` lưu `kyThi` trong dữ liệu thẻ | — |
| 5 | Điền sẵn Lên FT lấy Target khoá | `dienSanChuyenTiep` chỉ nhận Target khoá khi `cungThangTarget` (khoá KET / PET → không) | (luật chung KP-3c/d) |
| 6 | Target ngoài thang sau migrate | Target khoá KET / PET ngoài thang → NULL, ghi applied; `kiem-truoc-ket-pet` in số | KP-5c |
| 7 | Tách lượt đã huỷ / `case_signals` | Bỏ lượt `cancelled` và lượt có `ket_qua_huy` chưa khôi phục (khôi phục lại khớp lịch cũ); `case_signals` không tách (khoá chống trùng giữ nguyên) | KP-5d |
| 8 | `ensureSkillRows` chèn trùng | Bộ môn theo dòng lịch có sẵn của lượt, không theo điểm | KP-5e |
| 9 | Lịch sử sửa không tra được khoá | Nhật ký `cycle.target.revise`, `cycle.thi_that` ghi `kyThi`; `lichSuSua` dùng khi không tra được lộ trình | — |
| 10 | Cột tính trong vòng lặp | Danh sách bảng + cột tính một lần trước vòng lặp | KP-2b |

Mỗi phép kiểm KP-5a…e đã chạy ĐỎ khi gỡ đúng phần sửa của nó, XANH khi có.

Phép kiểm tốc độ sau gộp P9a: TD4-a chụp lại 7 băm — so JSON ×3 origin/main ↔ nhánh, 11 góc: lệch CHỈ việc "Nhập điểm Checkpoint · MB PET 01" (môn tách, 3 → 6 bài)
và tổng bài nhóm W3 SEP (+3); 4 góc trùng hẳn. Trần dòng Học viên & Lớp (×3): P13 trước gộp 7 313, main 7 507, bản gộp 7 543 (seed PET 4 môn gặp bộ demo Xét lại)
→ trần 7 510 → 7 545, mã đường không đổi. `standingFor` chỉ đọc bảng chương trình cho mã không có hằng số (KET / PET) — FT không đọc thêm (TD2-a giữ trần).

## Vòng 3 — PTA Plan rà (26/10)

| # | Việc | Cách sửa | Phép kiểm |
|---|---|---|---|
| 1 | Huỷ cả lượt Checkpoint đã chấm L+S / R+W → 400 | `xoaDiemLuot` kiểm môn theo lượt (`boMonCuaLuot`) | KP-6a |
| 2 | Excel PET trộn lượt gộp / 4 môn lệch cột | `bangThuong`: tiêu đề = hợp môn mọi dòng (môn chương trình trước, L+S / R+W sau), dòng điền theo mã môn, thiếu để trống | KP-6c |
| 3 | Lượt có lịch gộp chưa điểm kẹt (khôi phục, có `ket_qua_huy`, lớp đã kết thúc) | MỘT luật: `daGhi` = dòng lịch ∪ dòng điểm (`daGhiLuot`) ở `boMonCuaLuot` và mọi nơi gọi `boMonTheoLuot` — nơi đã nạp `bundle.skillRows` / `attempt_skills` dùng luôn; nơi chưa nạp đọc theo lô CHỈ dòng lịch môn gộp (`lichGopCua` — rất ít dòng, giữ trần đọc) | KP-6b, KP-6a |
| 4 | Bước 3–4 không có nhật ký | Mỗi lộ trình một dòng `cycle.update` (trước → sau, `kyThi`, nguồn "migrate prKetPet") trong cùng `tx`; chú thích đầu tệp nói rõ bước 3–4 đụng cả khoá đã đóng | KP-6d |
| 5 | Chạy lại mỗi deploy | Bước 1–2 một lần (`demo_config` `pr_ket_pet_at`, mẫu `prCvLoi`); bước 3–4 chạy mỗi lần (không còn gì thì không làm) | KP-6e, KP-2b |
| 6 | Lớp PET / KET đã kết thúc không tách | Bước 2a: `class_skills` + phân công của MỌI lớp (dòng gộp giữ, dòng tách chép nguyên trạng thái / ngày hiệu lực); lượt không đụng | KP-6f |
| nhỏ | Câu KQ thi thật ghép ở máy chủ | Các lộ trình trả `ketQua.kyThi` (số liệu) — web ghép `t('Thi thật {kq}')` (EN có) | KP-6g |
| nhỏ | `docDiem` KET / PET | Đọc như `docTargetKyThi` (chỉ chữ số nguyên; "160.0", "1.6e2" → 400 đúng ô) | KP-6g |

Ghi chú KP-6a: lớp thường Huỷ cả lượt XOÁ điểm (PR-VN4) — Khôi phục trả lượt về "planned", lịch gộp giữ; nhập lại L+S / R+W được (trước: 400 ngay khi huỷ).
Mỗi phép kiểm KP-6a…g đã chạy ĐỎ khi gỡ đúng phần sửa của nó, XANH khi có.
Kèm theo (do bộ kiểm chung bắt): DB mới (init / seed, `duLieuNen`) ghi sẵn khoá `pr_ket_pet_at` như `pr_cv_loi_gan_chu_case_at` (DEPLOY-1c / 2a / 2g, SO-4b);
`tyLeTongLo` và Các lộ trình đọc dòng lịch môn gộp TRONG câu điểm sẵn có (UNION ALL, đặt tên mọi cột — DTL1) nên số câu SQL không đổi (LT2b (3), TK-7).

