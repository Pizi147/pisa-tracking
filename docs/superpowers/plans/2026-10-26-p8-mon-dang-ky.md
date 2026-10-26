# P8 MON-DANG-KY — Môn đăng ký L · R · W1 · W2 · S theo lộ trình FT — Implementation Plan

> **For agentic workers:** chạy NGAY TRONG SESSION bằng superpowers:executing-plans (plan.md 1.2). Mỗi Task: superpowers:test-driven-development. Steps dùng `- [ ]`.
> Skill: `karpathy-guidelines`; phần web `/ponytail lite`, impeccable `clarify` + `layout` + `harden` + `adapt` trong phạm vi; cuối `audit` + `web-design-guidelines`; trước PR `/ponytail-review`.

**Goal (N13, N22 ④):** mỗi lộ trình **Fast Track** có môn đăng ký (5 ô L · R · W1 · W2 · S; NULL = đủ môn). Môn không học không thành việc / nợ / nhắc / SOS;
Overall không kết luận khi thiếu bộ môn ("Không đủ bộ môn"); chỉ học W1 hoặc W2 → Writing = task đã học. Sửa ở 3 nơi: Sửa thông tin HV, Sửa cả lớp, Lộ trình mới.

**Đầu ra:** QL chọn môn 4–5 bấm; GV không bị giao / nhắc nhập ô môn em không học; báo cáo, nợ điểm, SOS chỉ tính môn đã đăng ký; điểm cũ không mất khi đổi môn.

**Mockup đã duyệt:** `thiet-ke/v6/lo-trinh-moi.html` k1 (bước "2 Môn học" panel Lộ trình mới), k4 (Sửa thông tin · đổi môn giữa lộ trình), k5 (Sửa cả lớp · cột Môn học),
k6 (bảng lớp ô "Không học"), k7 (hồ sơ HV) + `lo-trinh-moi-truy-vet.md`. **PR đổi bố cục → ảnh cặp mockup | web, cổng ≥ 90 % KHỚP, chủ SP duyệt ảnh trước merge.**

**Spec:** `docs/superpowers/specs/2026-10-24-cai-tien-da-chot-design.md` mục 3.4 + bảng mục 5 dòng 3.4; luật `plan.md` 1.6 N13, N22 ④ (chỉ FT).

**Architecture (dùng lại cơ chế phạm vi lượt có sẵn):**
- Dữ liệu: `learning_cycles.mon_dang_ky TEXT` (JSON mảng con của `['listening','reading','writing1','writing2','speaking']`; NULL = đủ) + `attempt_skills.bo_task TEXT`
  (`'writing1' | 'writing2' | NULL` — Writing vẫn MỘT dòng lịch, chỉ đánh dấu task không học). Nhật ký đổi môn = `writeAudit` trước → sau (đọc ở Lịch sử như các trường khác).
- Một hàm thuần `shared/domain/monDangKy.ts`: `chuanMon(json) → Set`, `monThieu(mon)`, `kyNangKhongHoc(mon) → AssessedSkill[]` (L / R / S, Writing khi bỏ cả W1 + W2),
  `boTaskCua(mon) → 'writing1' | 'writing2' | null`, `chuMon(mon)` ("L · R · W2 · S"), `laDuMon(mon)`.
- Áp vào lượt: MỘT hàm máy chủ `apMonDangKy(p, cycleId, monMoi, lyDo)` dùng lại `setSkillScope` (`server/src/fasttrack/skillSchedule.ts` ~985, `required = 0`, `scope_reason = 'Không học'`)
  cho mọi lượt MT **chưa thi** của lộ trình (MT0 + MT1…, `sit_status = 'scheduled'`, chưa có điểm); lượt đã thi / đã có điểm: GIỮ (không xoá điểm cũ — N13 Q5).
  Bật lại môn → `required = 1` cho lượt chưa thi (đúng dòng mà `apMonDangKy` đã tắt, nhận theo `scope_reason`). Lượt MỚI sinh sau (MT tự sinh, "+ MT", Lộ trình mới) đọc `mon_dang_ky` lúc tạo dòng (`ensureSkillRows` / nơi chèn `attempt_skills`).
- Đánh giá: `scoring.ts` đã bỏ kỹ năng `required = 0` (Overall null khi `skipped.length`) → thêm nhãn **"Không đủ bộ môn"** khi lý do là môn đăng ký (khác "Chưa đủ dữ liệu", cùng kiểu badge viền đứt).
  `writingBand(w1, w2)` → khi `bo_task` = W1 thì Writing = W2 (và ngược lại).
- Nợ / việc: các hàm đếm ô chờ (`O_CHO_TU_SQL` `fasttrack/conOCho.ts`, `scoreDebtCells` `worklist/scoreDebt.ts`, `oXongCua` `fasttrack/attempts.ts`, `kyNangXongThieu` `shared/domain/fasttrack.ts`)
  đã bỏ dòng `required = 0` → kiểm lại từng hàm + thêm bỏ ô task `bo_task`. Không thêm nhánh mới nếu hàm đã lọc `required`.

## Global Constraints
- **Chỉ FT (N22 ④).** Lớp thường / KET-PET: không ô Môn học; API gửi `monDangKy` cho lộ trình không phải FT → 400. `setSkillScope` vẫn chặn lớp ratio như cũ.
- Phải còn ít nhất **một** môn; gửi rỗng → 400 tại ô. Giá trị lạ → 400. Đủ 5 môn → lưu NULL (không lưu mảng đủ).
- Quyền: như Sửa thông tin HV / Sửa cả lớp / Lộ trình mới hiện có (không mở quyền mới). Không ở Thêm HV / Dán Excel (mặc định đủ môn — [XM] trong truy vết, giữ).
- Đổi môn giữa lộ trình (Q5): bài chưa thi của môn bỏ → khỏi đợt (giữ lịch sử, `required = 0`); bài đã chấm GIỮ; Case MỞ của môn bỏ → đóng lý do mới **"Không còn học môn"**
  (`cases` outcome riêng, KHÔNG vào tử số Hiệu quả PA — như "Kết thúc lộ trình" của P7); PA đang chạy của Case đó → `cancelled` nhãn như P7. Bật lại môn KHÔNG mở lại Case (ghi PR).
- Tóm tắt trước khi lưu do máy chủ tính (mẫu "Khi lưu, web sẽ" của P7): n bài bỏ khỏi đợt · n bài đã chấm giữ · n Case đóng · Writing = W2 · Overall Không đủ bộ môn.
- Đọc theo ô: bảng lớp ô môn không học = **"Không học"** (nghiêng, nhạt, nền sọc) ≠ "-" vắng ≠ "—" chưa điểm; chú giải ở hàng công cụ; trạng thái không chỉ bằng màu.
  Hồ sơ HV: dòng "Môn học L · R · W2 · S" chỉ khi thiếu môn; tab W chỉ task đã học.
- Một nơi tính: web lấy nhãn / tóm tắt / ô "Không học" từ máy chủ hoặc hàm `shared/domain/monDangKy.ts` — không tự suy lại.
- Không chạm: Tutor; P13 (`kyThi.ts`, `prKetPet.ts`, KET/PET — PR #586 đang sửa); không commit tệp DB; không deploy.
- Hiệu năng: đọc `mon_dang_ky` cùng câu lấy lộ trình đã có (không thêm câu mỗi dòng); trần SQL `tocDo.run.ts` không tăng quá +1 câu mỗi đường (ghi lý do nếu tăng).

## Review Focus
1. Em không học S: không còn việc / nợ / nhắc nhập S, không SOS vì S, Overall "Không đủ bộ môn", Tổng quan / Phân tích GV không đếm ô S là thiếu.
2. Đổi môn khi đã có điểm: điểm cũ còn nguyên và vẫn hiện; bật lại môn không mất gì; nhật ký trước → sau.
3. Chỉ W2: Writing = W2 ở mọi nơi (bảng, hồ sơ, Phân tích, xuất điểm); nhập W1 bị chặn hoặc ẩn.
4. Lớp thường / KET-PET không đổi hành vi (phép kiểm cũ xanh).
5. Lô Sửa cả lớp lỗi một phần: em lỗi giữ lại kèm lý do, em đúng đã lưu ("Đã lưu n · Thử lại n").

---

### Task 1: Dữ liệu + hàm thuần
**Files:** Create `shared/domain/monDangKy.ts` (+ export), `server/src/migrate/prMonDangKy.ts` (ADD COLUMN, chạy lặp được), Modify `server/src/migrate.ts`, `schema.sql`. Test: Create `server/src/tests/prMonDangKy.tests.ts`, Modify `run.ts` (cuối).
- [ ] `MDK-1`: `chuanMon(null)` = đủ; `kyNangKhongHoc(['listening','reading','writing2','speaking'])` = [] và `boTaskCua` = 'writing1'; bỏ W1 + W2 → Writing không học; rỗng → lỗi; `chuMon` đúng thứ tự L R W1 W2 S.
- [ ] `MDK-2`: migrate hai lần → lần hai `applied` rỗng; DB cũ NULL = đủ môn, mọi phép kiểm FT cũ không đổi.

### Task 2: Áp môn vào lượt + đánh giá + nợ
**Files:** `server/src/fasttrack/skillSchedule.ts` (`apMonDangKy`, đọc `mon_dang_ky` khi tạo dòng `attempt_skills`), `fasttrack/scoring.ts` (`writingBand` theo `bo_task`, nhãn Không đủ bộ môn), `fasttrack/conOCho.ts`, `worklist/scoreDebt.ts`, `fasttrack/attempts.ts`, `shared/domain/fasttrack.ts`, `cases/systemClose.ts` (lý do "Không còn học môn").
- [ ] `MDK-3a`: em FT không học S → MT2 chưa thi `required = 0 'Không học'`; MT1 đã có điểm S giữ; không ô chờ / nợ / việc S; Overall null + "Không đủ bộ môn"; SOS không xét S.
- [ ] `MDK-3b`: chỉ W2 → Writing = W2 (MT đã chấm W1 cũ vẫn hiện W1 cũ trong lịch sử của lượt đó); ô W1 lượt chưa thi không là thiếu.
- [ ] `MDK-3c`: đổi môn khi Case S mở + PA chạy → Case đóng "Không còn học môn", PA cancelled, không vào Hiệu quả PA; bật lại S → lượt chưa thi `required = 1`, Case không mở lại.
- [ ] `MDK-3d`: MT mới sinh sau (tự sinh / "+ MT" / Lộ trình mới) theo `mon_dang_ky`. Lớp thường gửi môn → 400; `setSkillScope` lớp ratio vẫn 400.

### Task 3: API 3 nơi sửa + xem trước
**Files:** đường Sửa thông tin HV (`StudentManagePanel` → route sửa HV), Sửa cả lớp (`SuaCaLopPanel` → route sửa cả lớp, theo lô có lỗi từng em), Lộ trình mới (`loTrinh/buocTiep.ts` `docLoTrinhMoi` / `xemTruocLoTrinhMoi`: mặc định môn của lộ trình cũ).
- [ ] `MDK-4a`: xem trước trả tóm tắt đúng số (bài bỏ / giữ / Case đóng / Writing = …); lưu ghi `writeAudit` trước → sau; Lịch sử hiện "Môn học: đủ → L · R · W2 · S".
- [ ] `MDK-4b`: Sửa cả lớp 3 em, 1 em lộ trình không phải FT → 1 lỗi tại dòng, 2 em lưu; rỗng môn → 400 tại ô.
- [ ] `MDK-4c`: Lộ trình mới LT2 mặc định môn LT1; đổi môn → lộ trình mới có môn đó, MT1–MT3 theo môn; Hoàn tác Lộ trình mới không để lại dòng `required = 0` thừa.

### Task 4: Web theo mockup k1, k4–k7
**Files:** `web/src/modules/students/PanelLoTrinhMoi.tsx` (bước "2 Môn học" 5 nút bật), `StudentManagePanel.tsx` (hàng "Môn học · FT LT1" + tóm tắt), `classes/SuaCaLopPanel.tsx` (cột Môn học, "Áp cho n em", chân "n em đã sửa · Lưu n em"), bảng điểm lớp FT (ô "Không học" + chú giải), `StudentDetailPage.tsx` (dòng Môn học, tab W, badge).
- [ ] 5 nút bật có `aria-pressed`, bàn phím được, 375 không vỡ dòng; nút nhỏ trong ô, KHÔNG trong tiêu đề bảng (luật V5); lỗi tại ô; không mất chữ đang gõ khi lỗi.
- [ ] GIỮ mọi thao tác cũ của 3 panel (Hoàn tác Bước tiếp, Huỷ hẹn, Gia hạn, Target giữ + Sửa, Lịch sử, Dán Excel của Sửa cả lớp…). Bảng TRƯỚC → SAU trong `khop-khac.md`.

### Task 5: Seed + ảnh + kiểm
- [ ] Seed theo mockup (Lê Quang Huy chỉ W2, một em không học S ở lớp FT demo); id cũ ổn định (DL-2 / TD4-a đổi thì chụp lại có ghi chú).
- [ ] Ảnh cặp mockup | web k1, k4, k5, k6, k7 (1440 tối + 375 sáng) → `docs/anh/p8-mon-dang-ky/`; `khop-khac.md`: bảng truy vết khung → thành phần → ảnh (KHỚP / KHÁC / BỎ / GIỮ, ≥ 90 % KHỚP), bảng thao tác TRƯỚC → SAU.
- [ ] `npm run check` xanh (chạy nền, > 10 phút); bấm thử một vòng (QL 3 nơi sửa, GV nhập điểm lớp có em không học S); `/ponytail-review`; mở PR "P8 MON-DANG-KY", nhắn "PTA Plan".
- [ ] Rà: PTA Plan rà sâu `/code-review high` (dữ liệu + mọi hàm chấm / nợ); chủ SP duyệt ảnh cặp trước merge.
