/**
 * RESET-HAN-CASE (chủ SP 06/11 khuya "Ok thế làm đi nhé") — ĐỔI DỮ LIỆU MỘT LẦN lúc deploy: mọi việc TUYẾN CASE còn mở ĐÃ quá hạn (hạn < hôm nay)
 * → hạn mới = hôm nay + `SO_NGAY_RESET` (Kết quả PA: + `SO_NGAY_RESET_PA`). Không xoá dòng nào; việc chưa quá hạn (kể cả hạn = hôm nay) / đã xong không đụng.
 *   · Xác nhận Case · Mô tả Case · Xác nhận PA · Xác nhận Case Speaking — `sos_cases.han_xac_nhan` (Case mở còn một trong các việc đó chờ).
 *   · Thêm PA — hạn là công thức (`hanThemPa`: ngày phát hiện + 3 / 5) → cột `sos_cases.han_them_pa` (NULL = công thức) thắng công thức.
 *   · Kết quả PA — `case_interventions.action_due`, mốc RIÊNG hôm nay + `SO_NGAY_RESET_PA` (chủ SP 06/11 "reset hết cho đến 2 tuần tới"): mọi PA có
 *     hạn TRƯỚC mốc (đang quá hạn + đợt tới hạn trong hai tuần) → hạn = mốc; Công việc hiện lại theo luật sẵn có (hạn − 2). Nghĩa vụ CHƯA GHI của
 *     "Việc đúng hạn" đếm từ cột này (`obligations`) nên các đợt đã lỡ không còn tính cho ai; ghi xong thì `hanKe` về lại lịch hai tuần của PA.
 *     Lần ghi TRỄ đã có hạn trước ngày reset: không còn tính (chủ SP "Xoá luôn" — `KQ_PA_TRE_TRUOC_RESET`, metrics.ts, đọc ngày = giá trị khoá).
 *   · Ghi Mini Test — `mini_test.han`.
 * Không gồm Phối hợp SOS (meeting CX — tab "Ý thức & Phối hợp", không thuộc tuyến Case) — [XM] PTA.
 * Mỗi việc một dòng `viec_han_lan` (loai `reset_case:<cột>`, hạn hiệu lực cũ → mới, boi NULL). HOÀN TÁC: `hoanTacResetHanCase(conn)` — trả hạn cũ
 * cho dòng chưa ai đổi tiếp (hạn hiện tại = hạn reset), xoá các dòng nhật ký reset, giá trị khoá → '' (lần ghi trễ cũ tính lại; khoá giữ → không chạy lại). Khoá `demo_config` → chạy lặp không làm gì; DB mới (init / seed)
 * ghi khoá sẵn (`duLieuNen`).
 */
import { nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { addDaysIso, hanThemPa } from '../../../shared/domain/index.ts';
import { CHO_DOI_PA, NOT_UNCONFIRMED_PRESET, UNCONFIRMED_PRESET } from '../cases/sosState.ts';

export const KHOA_PR_RESET_HAN_CASE = 'pr_reset_han_case_da_chay';
export const SO_NGAY_RESET = 7;
/** Kết quả PA (chủ SP 06/11 [XM-3]): hạn mới = hôm nay + 14, gồm cả PA tới hạn trước mốc này. */
export const SO_NGAY_RESET_PA = 14;

/** loai nhật ký → (bảng, cột). `han_them_pa` hoàn tác về NULL (công thức), `han_cu` của nó chỉ để tra. */
const COT = {
  'reset_case:han_xac_nhan': ['sos_cases', 'han_xac_nhan'],
  'reset_case:han_them_pa': ['sos_cases', 'han_them_pa'],
  'reset_case:action_due': ['case_interventions', 'action_due'],
  'reset_case:mini_test': ['mini_test', 'han'],
} as const;
type Loai = keyof typeof COT;

/** Cột mới (chạy MỖI lần, lặp không đổi) — gọi trước mọi câu đọc `sc.han_them_pa`. */
export function themCotHanThemPa(conn: any, applied: string[]) {
  if (conn.prepare(`SELECT 1 FROM pragma_table_info('sos_cases') WHERE name = 'han_them_pa'`).get()) return;
  conn.exec('ALTER TABLE sos_cases ADD COLUMN han_them_pa TEXT');
  applied.push('RESET-HAN-CASE: thêm cột sos_cases.han_them_pa (hạn Thêm PA đã đặt lại; NULL = công thức).');
}

/** Việc tuyến Case còn mở đã quá hạn tại `homNay` + PA có hạn trước mốc Kết quả PA (chỉ đọc) — mỗi dòng: loai, id, hạn hiệu lực cũ. */
export function viecCaseQuaHan(conn: any, homNay: string): { loai: Loai; id: number; han: string }[] {
  const out: { loai: Loai; id: number; han: string }[] = [];
  for (const r of conn.prepare(
    `SELECT sc.id, sc.han_xac_nhan AS han FROM sos_cases sc
      WHERE sc.status != 'done' AND sc.han_xac_nhan IS NOT NULL AND sc.han_xac_nhan < ?
        AND (NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary')   -- Xác nhận / Mô tả Case
             OR EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id AND ${UNCONFIRMED_PRESET('iv')} AND iv.status = 'planned'
                          AND iv.kind != 'bo_tro' AND NOT ${CHO_DOI_PA('iv')})   -- Xác nhận PA
             OR (sc.topic = 'speaking' AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = sc.attempt_id AND s.skill = 'speaking'
                                                     AND s.cho_phu_trach_xem = 1)))   -- Xác nhận Case Speaking chấm chéo
      ORDER BY sc.id`,
  ).all(homNay) as any[]) out.push({ loai: 'reset_case:han_xac_nhan', id: r.id, han: r.han });
  /* Thêm PA: cùng điều kiện `la_no_plan` của Công việc + Case chưa có PA nào; hạn qua `hanThemPa` (một hàm với Công việc / hồ sơ HV). */
  for (const r of conn.prepare(
    `SELECT sc.id, sc.detected_at, sc.created_at, sc.urgency, sc.sos_level, sc.kck, sc.han_them_pa FROM sos_cases sc
      WHERE sc.status != 'done' AND sc.kck = 0 AND sc.tam = 0 AND sc.disposition IS NULL AND COALESCE(sc.sos_level, 1) > 0
        AND NOT EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id AND iv.status != 'cancelled')
      ORDER BY sc.id`,
  ).all() as any[]) {
    const han = hanThemPa(r);
    if (han && han < homNay) out.push({ loai: 'reset_case:han_them_pa', id: r.id, han });
  }
  /* Kết quả PA: cùng điều kiện nghĩa vụ chưa ghi của `dung-han-cap-nhat` (metrics `obligations`) ⊇ dòng Công việc; hạn trước mốc riêng. */
  for (const r of conn.prepare(
    `SELECT iv.id, iv.action_due AS han FROM case_interventions iv
      WHERE iv.status IN ('planned', 'started') AND COALESCE(iv.approval_state, '') != 'pending' AND ${NOT_UNCONFIRMED_PRESET('iv')}
        AND iv.action_due IS NOT NULL AND iv.action_due < ?
      ORDER BY iv.id`,
  ).all(addDaysIso(homNay, SO_NGAY_RESET_PA)) as any[]) out.push({ loai: 'reset_case:action_due', id: r.id, han: r.han });
  for (const r of conn.prepare(`SELECT id, han FROM mini_test WHERE ty_le IS NULL AND han IS NOT NULL AND han < ? ORDER BY id`).all(homNay) as any[]) {
    out.push({ loai: 'reset_case:mini_test', id: r.id, han: r.han });
  }
  return out;
}

/** Đặt lại — không khoá (phép kiểm gọi thẳng). Trả các việc đã đổi; lần hai không còn việc nào (mọi hạn đã ≥ mốc). */
export function datLaiHanCase(conn: any, homNay: string): { loai: Loai; id: number; han: string }[] {
  const moi = addDaysIso(homNay, SO_NGAY_RESET), moiPa = addDaysIso(homNay, SO_NGAY_RESET_PA), luc = nowIso();
  const ds = viecCaseQuaHan(conn, homNay);
  const ghi = conn.prepare('INSERT INTO viec_han_lan (loai, viec_id, han_cu, han_moi, mac_dinh, boi, luc) VALUES (?,?,?,?,0,NULL,?)');
  for (const v of ds) {
    const [bang, cot] = COT[v.loai];
    const han = v.loai === 'reset_case:action_due' ? moiPa : moi;
    conn.prepare(`UPDATE ${bang} SET ${cot} = ? WHERE id = ?`).run(han, v.id);
    ghi.run(v.loai, v.id, v.han, han, luc);
  }
  return ds;
}

/** HOÀN TÁC: hạn cũ cho việc mà hạn hiện tại còn đúng hạn reset (người dùng đã đổi tiếp thì giữ), xoá nhật ký reset. Trả số việc trả về. */
export function hoanTacResetHanCase(conn: any): number {
  let n = 0;
  for (const l of conn.prepare(`SELECT loai, viec_id, han_cu, han_moi FROM viec_han_lan WHERE loai LIKE 'reset_case:%' ORDER BY id`).all() as any[]) {
    const [bang, cot] = COT[l.loai as Loai];
    n += conn.prepare(`UPDATE ${bang} SET ${cot} = ? WHERE id = ? AND ${cot} = ?`).run(cot === 'han_them_pa' ? null : l.han_cu, l.viec_id, l.han_moi).changes;
  }
  conn.prepare(`DELETE FROM viec_han_lan WHERE loai LIKE 'reset_case:%'`).run();
  conn.prepare(`UPDATE demo_config SET value = '', updated_at = ? WHERE key = ?`).run(nowIso(), KHOA_PR_RESET_HAN_CASE);
  return n;
}

export function migratePrResetHanCase(conn: any, applied: string[]) {
  themCotHanThemPa(conn, applied);
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_RESET_HAN_CASE)) return;
  const homNay = demoToday();
  const ds = datLaiHanCase(conn, homNay);
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_RESET_HAN_CASE, homNay, nowIso());
  if (ds.length) {
    const dem = (l: Loai) => ds.filter((v) => v.loai === l).length;
    applied.push(`RESET-HAN-CASE: ${ds.length} việc tuyến Case → hạn ${addDaysIso(homNay, SO_NGAY_RESET)} (Xác nhận / Mô tả Case, Xác nhận PA ${dem('reset_case:han_xac_nhan')} · `
      + `Thêm PA ${dem('reset_case:han_them_pa')} · Mini Test ${dem('reset_case:mini_test')}) · Kết quả PA ${dem('reset_case:action_due')} → ${addDaysIso(homNay, SO_NGAY_RESET_PA)}; hạn cũ ở viec_han_lan.`);
  }
}
