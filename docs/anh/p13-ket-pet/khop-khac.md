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
| Checkpoint cũ đã có điểm L+S / R+W | — | **Giữ** cột L+S, R+W cho đúng đợt đó (sửa / nhập ô còn trống được) | GV dạy L hoặc S làm được ô L+S cũ (quyền `MON_GOP`) |
| GV phân công môn gộp | GV "L+S" | Cùng GV dạy L **và** S (migrate) | Không ai mất lớp / việc nhập điểm |
| Sửa Target em KET / PET (⋯ › Sửa thông tin) | Ô band 0–9; lưu → 400 "Chương trình liên tục không có Target." | Ô **"Target (B1 Preliminary 120–170)"** số nguyên, không KCK, lỗi tại ô | Lý do đổi Target bắt buộc như cũ; GVCN → Đề xuất sửa cùng thang |
| Sửa cả lớp / Đề xuất sửa Target KET / PET | band | thang Cambridge (cùng `docTargetCua`) | |
| Thêm em vào lớp KET / PET (cột Target) | cột có nhưng bỏ qua | **lưu** Target Cambridge; sai thang → lỗi tại ô, không thêm dòng | |
| Nhập KQ thi thật em KET / PET (⋯ › Kết quả thi thật) | Không có mục | Mục **có**: ngày thi (`ONgay`) + L R W S số nguyên trong thang; Overall · Grade · CEFR · Đạt / Chưa đạt Target máy tính; "Không thi" | Lưu xong → đóng + "Đã lưu" (KHÔNG Bước tiếp — KET / PET không có luồng sau thi); Lịch sử giữ |
| Đầu hồ sơ HV KET / PET | Lớp · Chương trình · Khoá học · GVCN · TVV | + **Target 145** + **Thi thật B1 Preliminary: 159 · Grade B · B1 · Đạt Target** | Không định dạng band ("150", không "150.0") |
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
| `loTrinh/banChup.ts`, `tongKet.ts` | không ảnh hưởng | `laFt = !!route`; KET / PET không ghi bản chụp |
| `worklist/viecTvv.ts`, `mywork.ts` (Chốt ngày thi, Điền Target) | đã lọc | `is_fast_track && route` / `route IS NOT NULL` |
| `worklist/hvCuaToi.ts` (sắp thi) | không ảnh hưởng | chỉ ngày thi (không điểm) |
| `classes/luatLoTrinh.ts` `dauVaoTuLoTrinh` | đã lọc | chỉ gọi từ Bước tiếp FT |
| `classes/luatLoTrinh.ts` `moLoTrinhMoi` giữ Target | **đã rẽ** (sửa) | giữ Target chỉ khi cùng kỳ thi (PET → FOU không mang 150 sang) · KP-3c |
| `fasttrack/cycles.ts` `reviseTarget`, `loiDoiTarget` | **đã rẽ** | `docTargetCua` theo `kyThiCuaChuongTrinh` · KP-3 |
| `classes/suaCaLop.ts`, `duyet/deXuatSua.ts` | **đã rẽ** | cùng thang · KP-3 |
| `classes/intake.ts` | **đã rẽ** | cột Target KET / PET theo thang · KP-3, KP-3b |
| `students/profile.ts` | **đã rẽ** | `kyThi`, `thiThat` (Overall · Grade · CEFR) chỉ cho KET / PET |
| `students/lichSuSua.ts` | **đã rẽ** | số > 9 không định dạng band |
| `classes/hocVienLop.ts`, `classes.ts`, `lichThi.ts`, `hocVienTheoVai.ts`, `xuatDanhSach.ts`, `students.ts`, `hanhTrinh.ts`, `cases.ts` | không ảnh hưởng | chỉ HIỆN Target của lộ trình em (lớp liên tục ẩn cột Target / Lộ trình tiếp theo, Hành trình chỉ ghi Target lớp FT); không tính trung bình / tỷ lệ |
| `classes/phanTichLop.ts`, `students/standing.ts`, `fasttrack/attempts.ts`, `mt0.ts`, `schedule.ts` | không ảnh hưởng | kỳ vọng / MT chỉ FT (`ratio` → null) |
| `classes/luatLoTrinh.ts` chuyển FT → lớp thường giữ Target | **đã rẽ** (sửa sau rà) | FT → KET / PET không mang band sang · KP-3d |
| `classes/luatLoTrinh.ts` `xemChuyenLop`, `lenhChuyen.ts` khoá Target lên FT | **đã rẽ** (sửa sau rà) | Target Cambridge không điền sẵn làm Target FT · KP-3d |
| `classes/transition.ts` `dienSanChuyenTiep` | không ảnh hưởng | lớp liên tục bị chặn ở đầu hàm (`CAU_LIEN_TUC.loTrinhTiep`) |
| `platform/lichSu.ts` (Lịch sử thi thật) | **đã rẽ** | số > 9 không định dạng band |
| `classes/lenhChuyen.ts` KCK lệnh | không ảnh hưởng (như cũ) | lệnh KCK tới lộ trình liên tục trước đã 400, nay 400 thang Cambridge |
| `duyet/loaiYeuCau.ts`, migrate cũ, `ops/kiemTruocLtSv.ts` | không ảnh hưởng | so Target đề xuất / lộ trình FT |

## Task 0 — kiểm dữ liệu (DB demo cục bộ, `npm run kiem-truoc-ket-pet`)

Trước migrate (bộ demo CŨ, môn gộp):

```
Môn PET (programme_skills): listening_speaking, reading_writing
Môn KET (programme_skills): listening_speaking, reading_writing
Lớp PET · active: 1
Em đang học lớp PET / KET: 3
Đợt Checkpoint GIỮ môn gộp (đã có điểm): 1 đợt · 3 lượt
Đợt Checkpoint TÁCH 4 môn (chưa có điểm): 1 đợt · 2 lượt
Phân công GV môn gộp (lớp đang chạy): 2
Case mở theo môn gộp (giữ nguyên): 0
```

`npm run migrate` lần một in 4 dòng P13 (PET, KET bộ môn · lớp MB PET 01 môn + phân công · MB PET 01 Checkpoint 2 → 4 môn); lần hai **không in**. Sau migrate:
bộ môn L · R · W · S, đợt giữ 1 (Checkpoint 1 đã có điểm, ảnh `sau-migrate-checkpoint1-giu-gop-1440-toi.png`), đợt tách 0, phân công gộp 0.
**Bản sao DB thật: chưa chạy** (không có trên cloud) — bước ở `DEPLOY_2026-10.md` (P13 KET-PET): chạy `kiem-truoc-ket-pet` trên `mig.sqlite` trước migrate, gửi số cho PTA Plan.

## Ảnh (Playwright, 1440 tối + 375 sáng)

| Ảnh | Nội dung |
|---|---|
| `truoc-checkpoint1-1440-toi.png`, `truoc-checkpoint1-375-sang.png`, `truoc-checkpoint2-1440-toi.png` | lưới Checkpoint cũ L+S · R+W |
| `truoc-ho-so-pet-1440-toi.png`, `truoc-ho-so-pet-375-sang.png` | hồ sơ em PET: không Target, không thi thật |
| `sau-checkpoint1-4-mon-1440-toi.png`, `sau-checkpoint1-4-mon-375-sang.png` | lưới Checkpoint 4 môn (seed mới) |
| `sau-migrate-checkpoint1-giu-gop-1440-toi.png`, `sau-migrate-checkpoint2-4-mon-1440-toi.png` | DB cũ sau migrate: đợt có điểm giữ L+S / R+W, đợt chưa có điểm 4 môn |
| `sau-ho-so-pet-1440-toi.png`, `sau-ho-so-pet-375-sang.png` | đầu hồ sơ: Target 145 · Thi thật B1 Preliminary 159 · Grade B · B1 · Đạt Target |
| `sau-kq-thi-that-pet-1440-toi.png`, `sau-kq-thi-that-pet-375-sang.png` | hộp Kết quả thi thật thang Cambridge |
| `sau-sua-thong-tin-target-1440-toi.png`, `sau-sua-thong-tin-target-loi-375-sang.png` | ô Target (B1 Preliminary 120–170); gõ 99 → lỗi tại ô |

Bấm thử: QL lưu KQ thi thật qua giao diện (S 150 → 152) → "Đã lưu", panel đóng, đầu hồ sơ cập nhật, `outcome` / `outcome_score` vẫn NULL;
GV T_HA (dạy L, S) mở Checkpoint 1: ô L, S nhập được, R, W chỉ đọc.

## Phép kiểm đổi / ảnh chụp đo

- Sửa theo luật mới: OV6b2-3 (PET 4 môn, chip "SOS · L S"), OV6b2-4 (PET có Target Cambridge — 400 "B1 Preliminary: 120–170" thay "không có Target"),
  OV6b2-5 (KET 4 môn), OV6b2-6 (PET / KET mặc định 4 môn), OV11h-1 (Phân tích lớp / GV theo L · R · W · S), OV11h-2 (hạng mục Case PET / KET = 4 môn).
- TD4-a (×3): chụp lại 7 băm — so JSON Công việc main ↔ nhánh (32 tài khoản × Của tôi / Tất cả): lệch CHỈ 2 việc "Nhập điểm Checkpoint · MB PET 01"
  (L+S → L, S; R+W → R, W; 1 → 2 bài). Trần câu `QL /my-work?nguoi=7` 68 → 69: do dữ liệu (mã P13 chạy trên dữ liệu main vẫn 68).
- `npm run check`: sqld bỏ qua (máy cloud không có sqld) như các PR trước.
