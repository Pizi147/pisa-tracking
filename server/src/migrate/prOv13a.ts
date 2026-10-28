/**
 * PR-OV13a (chủ SP 15/10, đặc tả OV-13 §1 L6–L8, §2) — LUẬT CASE / PA MỚI. Đổi dữ liệu, chạy lặp không đổi; mỗi phần một giao dịch (migrate.ts `buoc`):
 *
 *   (a) Case hệ thống đóng "Chờ chốt SOS" (prOv1c) mà CHƯA AI ĐỤNG → XOÁ HẲN (`xoaCaseHeThong`). "Chưa ai đụng" = không kết quả PA, không tệp, không PA do
 *       người thêm / xác nhận, không nguyên nhân do người chọn, không thẻ Chờ duyệt, không mốc Xác nhận Case / Xin không theo dõi / Mở lại, không sửa tay.
 *   (c) PA quy chế ĐANG CHẠY của Case mà kỹ năng đã đạt sau khi PA ra đời (mốc `passed` / `overall_dat`) → "Kết quả cuối" (luật A, `paSangKetQuaCuoi`).
 *   (b) PA quy chế "đến lúc thi" đang chạy chưa có ngày thi → mốc MT cuối của lộ trình (luật B, `dienMocQuyChe`) — sau (c).
 *   (e) Lượt Mock FT chưa chốt có ô dưới kỳ vọng có điểm + nhận xét mà chưa có Case → Case tạm (luật Q2) — sau (a): Case vừa xoá nhường chỗ.
 *   (d) `migratePrOv1c` KHÔNG chạy nữa (rà #406): chỉ ghi khoá `pr_ov1c_da_chay` — (a) + (e) đã thay việc của nó.
 *
 * In từng Case xoá (em · mã · Case).
 */
import { CASE_CATEGORY_LABEL, type CaseCategory } from '../../../shared/domain/index.ts';
import { nowIso } from '../util.ts';
import { xoaCaseHeThong } from '../cases/cases.ts';
import { caseTamCuaLuot } from '../cases/sos.ts';
import { keHoachMocQuyChe, paSangKetQuaCuoi } from '../cases/sosAuto.ts';

export const KHOA_PR_OV1C = 'pr_ov1c_da_chay';

export type KetQuaOv13a = {
  /** (a) id Case xoá · (b) id PA đặt mốc MT cuối · (c) id PA sang Kết quả cuối · (e) `lượt:kỹ năng` Case tạm. */
  xoaChoChot: number[]; mocMtCuoi: number[]; ketQuaCuoi: number[]; caseTam: string[];
  /** Dòng in của (a): em · mã · Case. */
  dongXoa: string[];
};

/** Chỉ thêm cột `sos_cases.tam` — gọi ĐẦU migrate (mọi bước sau có thể tính Case qua mã nghiệp vụ đọc cột này). */
export function themCotPrOv13a(conn: any, applied: string[]) {
  const cot = conn.prepare('SELECT name FROM pragma_table_info(?)').all('sos_cases') as any[];
  if (!cot.length || cot.some((c) => c.name === 'tam')) return;
  conn.exec('ALTER TABLE sos_cases ADD COLUMN tam INTEGER NOT NULL DEFAULT 0');
  applied.push('PR-OV13a: thêm cột sos_cases.tam (Case tạm khi lượt Mock Test chưa chốt).');
}

const CASE_CHO_CHOT_CHUA_DUNG = `SELECT sc.id, sc.topic, sc.category, st.full_name, st.student_code FROM sos_cases sc LEFT JOIN students st ON st.id = sc.student_id
  WHERE sc.status = 'done' AND sc.system_close_reason = 'cho_chot_sos'
    AND NOT EXISTS (SELECT 1 FROM case_followups f WHERE f.case_id = sc.id)
    AND NOT EXISTS (SELECT 1 FROM attachments t WHERE (t.owner_type = 'sos_case' AND t.owner_id = sc.id)
      OR (t.owner_type = 'case_intervention' AND t.owner_id IN (SELECT iv_t.id FROM case_interventions iv_t WHERE iv_t.case_id = sc.id)))
    AND NOT EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id AND (COALESCE(iv.preset, 0) = 0 OR iv.confirmed_by IS NOT NULL))
    AND NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.created_by IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM yeu_cau_duyet y WHERE y.doi_tuong_loai = 'sos_case' AND y.doi_tuong_id = sc.id)
    AND NOT EXISTS (SELECT 1 FROM case_milestones m WHERE m.case_id = sc.id AND m.kind IN ('xac_nhan_case', 'xin_khong_theo_doi', 'reopened'))
    AND NOT EXISTS (SELECT 1 FROM sos_case_history h WHERE h.case_id = sc.id AND h.field IN ('title', 'summary', 'urgency', 'topic', 'primaryCode', 'observation'))
  ORDER BY sc.id`;

const PA_DA_DAT = `SELECT iv.id, iv.case_id, (SELECT MIN(m.occurred_on) FROM case_milestones m WHERE m.case_id = iv.case_id
      AND m.kind IN ('passed', 'overall_dat') AND m.created_at >= iv.created_at) AS ngay_dat
    FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
   WHERE sc.status != 'done' AND iv.preset = 1 AND iv.status = 'started' AND iv.confirmed_at IS NOT NULL
     AND iv.moc_quy_che IN ('one_month', 'until_next_mt', 'until_exam')
     AND EXISTS (SELECT 1 FROM case_milestones m WHERE m.case_id = iv.case_id AND m.kind IN ('passed', 'overall_dat') AND m.created_at >= iv.created_at)
   ORDER BY iv.id`;

/** Lượt Mock chưa hoàn tất có ô có điểm + nhận xét — ứng viên Case tạm (luật chính xác ở `caseTamCuaLuot`). */
const LUOT_CHUA_CHOT = `SELECT DISTINCT a.id FROM assessment_attempts a JOIN assessment_scores s ON s.attempt_id = a.id
   WHERE a.kind = 'mock' AND a.status NOT IN ('cancelled', 'done') AND TRIM(COALESCE(s.comment, '')) != '' AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL)
   ORDER BY a.id`;

const tenCase = (r: any) => CASE_CATEGORY_LABEL[(r.category ?? r.topic) as CaseCategory] ?? r.topic ?? '?';
const rong = (): KetQuaOv13a => ({ xoaChoChot: [], mocMtCuoi: [], ketQuaCuoi: [], caseTam: [], dongXoa: [] });

export function buocA(conn: any, ra: KetQuaOv13a, ghi: boolean) {
  for (const r of conn.prepare(CASE_CHO_CHOT_CHUA_DUNG).all() as any[]) {
    ra.xoaChoChot.push(r.id);
    ra.dongXoa.push(`${r.full_name ?? '?'} · ${r.student_code ?? '?'} · Case ${tenCase(r)} (#${r.id})`);
    if (ghi) xoaCaseHeThong(conn, r.id, null, 'Đổi luật OV-13a — Case "Chờ chốt SOS" cũ chưa ai đụng', 'case.xoa_cho_chot_sos');
  }
}
export function buocC(conn: any, ra: KetQuaOv13a, ghi: boolean) {
  for (const r of conn.prepare(PA_DA_DAT).all() as any[]) {
    ra.ketQuaCuoi.push(r.id);
    if (ghi) paSangKetQuaCuoi([r.case_id], r.ngay_dat, null, [r.id]);
  }
}
export function buocB(conn: any, ra: KetQuaOv13a, ghi: boolean) {
  const boQua = new Set(ra.ketQuaCuoi);   // kiểm trước: PA sẽ sang Kết quả cuối ở (c) không còn "đến lúc thi"
  const thi = keHoachMocQuyChe({ tatCa: true }).filter((r) => r.span === 'until_exam' && !boQua.has(r.id));
  ra.mocMtCuoi.push(...thi.map((r) => r.id));
  /* Ghi ĐÚNG các dòng đã đếm (cùng mốc `keHoachMocQuyChe` / `dienMocQuyChe`) — không đụng PA "đến MT kế tiếp" (đường đọc tự điền). */
  if (ghi) for (const r of thi) conn.prepare('UPDATE case_interventions SET followup_due = ?, updated_at = ? WHERE id = ?').run(r.moc, nowIso(), r.id);
}
export function buocE(conn: any, ra: KetQuaOv13a, ghi: boolean) {
  for (const r of conn.prepare(LUOT_CHUA_CHOT).all() as any[]) ra.caseTam.push(...caseTamCuaLuot(r.id, ghi));
}

function inRa(ra: KetQuaOv13a, applied: string[]) {
  if (!ra.xoaChoChot.length && !ra.mocMtCuoi.length && !ra.ketQuaCuoi.length && !ra.caseTam.length) return;
  applied.push(`PR-OV13a: (a) ${ra.xoaChoChot.length} Case "Chờ chốt SOS" cũ chưa ai đụng xoá hẳn · (b) ${ra.mocMtCuoi.length} PA "đến lúc thi" chưa có ngày thi → mốc MT cuối · `
    + `(c) ${ra.ketQuaCuoi.length} PA quy chế kỹ năng đã đạt → Kết quả cuối · (e) ${ra.caseTam.length} Case tạm cho lượt chưa chốt.`);
  for (const d of ra.dongXoa) applied.push(`  xoá: ${d}`);
}

/** Cả bốn phần liền nhau (phép kiểm); migrate.ts gọi từng phần trong giao dịch riêng (`chayTungBuoc`). */
export function migratePrOv13a(conn: any, applied: string[]): KetQuaOv13a {
  const ra = rong();
  buocA(conn, ra, true); buocC(conn, ra, true); buocB(conn, ra, true); buocE(conn, ra, true);
  inRa(ra, applied);
  return ra;
}
/** migrate.ts: mỗi phần một giao dịch (`buoc`) — đứt giữa chừng thì phần đã chốt thành no-op khi chạy lại. */
export function cacBuocPrOv13a(conn: any, applied: string[]): (() => void)[] {
  const ra = rong();
  return [() => buocA(conn, ra, true), () => buocC(conn, ra, true), () => buocB(conn, ra, true), () => { buocE(conn, ra, true); inRa(ra, applied); }];
}

/** (d) `migratePrOv1c` không chạy nữa (trước đây chạy mọi lần migrate, đóng cả Case mới ở deploy sau — L6): chỉ ghi khoá, không đổi dữ liệu. */
export function khoaPrOv1c(conn: any, _applied: string[]) {
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_OV1C)) return;
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_OV1C, nowIso(), nowIso());
}
