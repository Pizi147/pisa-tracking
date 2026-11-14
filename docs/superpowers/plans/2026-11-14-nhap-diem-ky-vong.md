# NHAP-DIEM-TU-DO + KY-VONG-MT0 / KET-QUA-DAU-RA — Implementation Plan

> Thực thi theo cách repo: mỗi PR một session code (prompt do PTA Plan giao), session tự chia việc nhỏ / TDD trong phạm vi PR. PTA Plan rà diff + ảnh, check chung, merge.

**Goal:** GV nhập / sửa / vắng / Huỷ điểm một kỹ năng tự do, huỷ = hết nợ mọi nơi; MT0 lớp thường đạt mốc chương trình = tự Đạt; QL chốt Kỳ vọng ngay ở bảng Kết quả đầu ra.

**Architecture:** Một trạng thái kỹ năng "Đã huỷ" (`attempt_skills.sit_status='cancelled'`) + một hàm "còn phải nhập" dùng chung; một hàm `goiYKyVong` quyết Đạt / kỹ năng dưới mốc cho mọi nơi; bảng `BangKqdrLopFt` thêm thao tác QL qua `luuKyVong`.

**Tech Stack:** TypeScript · Node (server/) · React (web/) · libsql / SQLite · phép kiểm `server/src/tests/run.ts`.

**Spec:** `docs/superpowers/specs/2026-11-14-nhap-diem-tu-do-design.md` · `docs/superpowers/specs/2026-11-14-ky-vong-mt0-ket-qua-dau-ra-design.md`

## Global Constraints
- Turso: mở trang 0 câu thêm; Huỷ / Khôi phục ≤ 60 câu (trần `huyTay`); `kqdrLopFt` ≤ 23 câu + trần dòng mới — dòng trong `server/src/tests/tocDoDuong.ts`.
- V22: hạn / quá hạn chỉ màu, không ⚠ / ●. "✓ Đã lưu" xanh. Lời 35 / 36 / 40.
- Chống mất dữ liệu: điểm cũ cất `ket_qua_huy` trước khi huỷ / ghi "-" đè; Khôi phục trả đủ (cả ngày nhập đầu).
- Luật vắng N38 giữ: MT0 / Mock lần 2 tự huỷ; Progress / Final lớp thường không tự huỷ.
- Skill: karpathy-guidelines + ponytail (PR giao diện: `/ponytail lite` + impeccable + audit + web-design-guidelines). `npm run check` đầy đủ. Thử trên bản chép thật (`scripts/do-ban-chep.mjs`).

## Review Focus
1. Kỹ năng "Đã huỷ" còn hiện ở một nơi đếm nợ (chuông, Lịch Test, Phân tích, hồ sơ lớp / HV, sổ nghĩa vụ) → phép kiểm quét mọi nguồn: huỷ xong tất cả = 0.
2. Khôi phục sau khi đã có điểm mới / sau khi huỷ do vắng lần 2 → về đúng tuần, đúng số lần vắng, không mất điểm.
3. Gõ điểm đè "-" đã chốt → một lần lưu: về tuần gốc, trừ một lần vắng, có điểm; "-" sau đó tính là lần 1.
4. MT0 có kỹ năng "Đã huỷ" (không Overall) → xét từng kỹ năng còn lại theo mốc chương trình; không tạo SOS chip / Case khi đạt.
5. Migrate "Không đạt" → Đạt chạy hai lần không đổi gì thêm; Case Tutor đóng có lịch sử, khôi phục được.

---

### PR-1 NHAP-DIEM-a (máy chủ) — Opus 5.5 · high (B: Sonnet 5.5 · high)
**Files:** `server/src/fasttrack/absence.ts` (gộp `huyTay` thành Huỷ điểm mọi loại bài), `server/src/keHoach/keHoachTest.ts` (`huyDiem` → đường mới), `server/src/fasttrack/ketQuaHuy.ts`, `server/src/fasttrack/attempts.ts` (`saveScore`: tự dời khi nhập sớm, gõ điểm đè "-" = bỏ vắng + lưu, gõ "-" đè điểm = cất + vắng, không reset `nhap_dau_ngay` khi xoá ô), `server/src/normal/regular.ts` (cùng luật cho lớp thường), `server/src/fasttrack/scoring.ts` (`evaluateAttempt`: kỹ năng `cancelled` ra khỏi bộ, không Overall), một hàm "còn phải nhập" dùng chung (`shared/domain/` hoặc `skillSchedule.ts` `viewSkill` — mọi nơi đếm nợ gọi), `server/src/routes/index.ts`, `shared/domain/thaoTacMt.ts` (menu: Huỷ điểm / Khôi phục cho người nhập được ô, GV có Vắng ở Mock, bỏ mục "Nhập điểm" rỗng), phép kiểm mới `server/src/tests/prNhapDiemTuDo.tests.ts`.
**Interfaces (produces):** `POST /attempts/:id/skills/:skill/huy-diem { huy: boolean }` → `{ ok }` (một đường cho Mock / MT0 / lớp thường); `conPhaiNhap(view): boolean`; `thaoTacKyNang` thêm `'huy-diem' | 'khoi-phuc-kn'` thay `'huy-tay' | 'bo-huy-tay' | 'bo-ky-nang'` trên giao diện.
**Tests (tên + khẳng định):** `NDT-1 huỷ Mock L có điểm → sit cancelled, ket_qua_huy có điểm, conPhaiNhap=false ở my-work / scoreDebt / canCham / viecHocVien` · `NDT-2 khôi phục → điểm + nhap_dau_ngay như cũ` · `NDT-3 GV môn huỷ được, GV lớp khác 403` · `NDT-4 GV nhập trước tuần Test → kỹ năng dời về tuần này, 200` · `NDT-5 điểm đè "-" đã chốt → tuần gốc, lan-1, có điểm` · `NDT-6 "-" đè điểm → ket_qua_huy, vắng, không 409` · `NDT-7 xoá ô → nhap_dau_ngay giữ` · `NDT-8 evaluateAttempt bỏ cancelled: 3 kỹ năng còn lại quyết SOS, overall null` · `NDT-9 huỷ do vắng lần 2 → Khôi phục về tuần trước lần 2, lan giữ` · trần câu.
**Xong:** check đầy đủ + bản chép (số nợ trước → sau) + `/security-review`.

### PR-2 NHAP-DIEM-b (giao diện) — Opus 5.5 · high — sau PR-1
**Files:** `web/src/modules/fasttrack/HopNhapDiem.tsx` (ô điểm luôn có ở chế độ vắng), `ScoreEntry.tsx` (lý do ô chỉ đọc đúng), `web/src/modules/cham/LuoiThuong.tsx` + `MotKyNang.tsx` (ô vắng / huỷ có ô nhập, sửa tại chỗ — bỏ `SuaDiemCoLyDo`, ô có điểm nhận "-", 375 có ⋯), `HopThaoTacMt.tsx`, `web/src/modules/cham/huyTay.ts` → toast Huỷ điểm · Hoàn tác, Hướng dẫn "?" GV / QL.
**Tests:** phép kiểm web sẵn có sửa theo; ảnh trước → sau 1440 + 375 (Mock + lớp thường), đo ✕ / ⋯.
**Xong:** chủ SP duyệt ảnh (đổi thao tác nhập) → merge.

### PR-3 KY-VONG-a (luật + migrate + việc QL) — Opus 5.5 · high (B: Sonnet 5.5 · high) — song song PR-1
**Files:** `shared/domain/cuoiKhoa.ts` (`goiYKyVong`: `dat` → `monTruot: []`; không Overall → xét từng kỹ năng còn lại theo `NGUONG_KY_VONG`), `shared/domain/mt0.ts` (`kyNangSosMt0(bands, target, ct)` → `[]` khi `goiYKyVong(ct,bands).dat`), `server/src/fasttrack/mt0.ts` (nối `classes` lấy `programme_code`), mọi nơi gọi `kyNangSosMt0`, `server/src/normal/kyVong.ts` (`emKyVong`, `kqdrLopFt`: tự Đạt; `luuKyVong` chặn Không đạt khi dat), `server/src/normal/cuoiKhoa.ts` (`ghiKetLuanFt` chặn), `server/src/classes/transition.ts` (`kqdrCua`), `server/src/worklist/mywork.ts` (việc "Kỳ vọng" → `/hoc-vien/lop/{lớp FT}?che-do=ket-qua`), migrate một lần `prKyVongTuDat` (Không đạt mà dat → Đạt, đóng Case "Kỳ vọng đầu ra…" + PA Tutor, khoá `demo_config`), phép kiểm `prKyVongMt0.tests.ts`.
**Tests:** `KV-1 MT0 lớp thường BE overall 4.0 → dat, monTruot [], kyNangSosMt0 []` · `KV-2 overall 3.5 → monTruot kỹ năng < 4` · `KV-3 có kỹ năng Đã huỷ, 3 kỹ năng ≥ mốc → dat` · `KV-4 em dat chưa lưu → emKyVong không đếm, việc hết` · `KV-5 luuKyVong Không đạt khi dat → 400` · `KV-6 migrate: Không đạt+dat → Đạt, Case đóng; chạy lần 2 không đổi` · trần.
**Xong:** check + bản chép (đếm em bị migrate, ghi PR) + `/code-review high`.

### PR-4 KET-QUA-DAU-RA-b (bảng làm tại chỗ, làm đẹp) — Opus 5.5 · high — sau PR-3
**Files:** `web/src/modules/classes/BangKqdrLopFt.tsx` (ô điểm L · R · W · S · Overall riêng như bảng Tổng hợp; đỏ chỉ khi chưa đạt; Final không ●; Bàn giao 2 dòng + Xem; Hỗ trợ link gọn; cột Kết quả: chip + "Chốt…" / ⋯ Sửa cho QL; 375 thẻ em), hộp chốt nhỏ (Đạt · Không đạt Trung tâm + chọn kỹ năng + "Tutor {n} buổi" từ cấu hình · Không đạt Học viên + kế hoạch) gọi `PUT /classes/:id/ky-vong`, bỏ ghi cứng "Tutor 10 buổi" ở `KetLuanKhoa.tsx`, `CuoiKhoaLop.tsx`; Hướng dẫn "?" QL.
**Tests:** QL chốt / sửa tại chỗ, GV không thấy nút; ảnh trước → sau 1440 + 375 (QL, GV), đo ✕ / ⋯.
**Xong:** chủ SP duyệt ảnh → merge.

## Thứ tự
PR-1 ∥ PR-3 (máy chủ, khác tệp — `cuoiKhoa.ts` / `scoring.ts` chú ý: PR-3 chỉ sửa `goiYKyVong`) → PR-2 ∥ PR-4. Màn GD đang chạy (GD-6, GD-8) không đụng các tệp này; PR-2 đụng `LuoiThuong` / `HopNhapDiem` → không song song với GD-11a (Lịch Test).
