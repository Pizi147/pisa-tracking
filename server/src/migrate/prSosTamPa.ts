/**
 * SOS-TAM-PA (chủ SP 11/11, PTA chốt Q7) — ĐỔI DỮ LIỆU MỘT LẦN lúc deploy: Case đã chốt SOS trước luật mới, đang có PA quy chế CHỜ xác nhận mà GV đã có PA
 * CÙNG LOẠI đang chạy → như luật mới lúc chốt: PA của GV mang dấu quy chế (`ganDauQuyChe`, lịch sử `pa_gv_quy_che`), PA quy chế chờ thôi (huỷ — nhật ký
 * `pa_quy_che_trung_gv` giữ trạng thái cũ). Case có PA GV KHÁC loại không cần ghi gì: việc tự thành "Chọn PA". `khoiPhucSosTamPa` trả lại. Khoá `demo_config`.
 */
import { nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { CHO_DOI_PA, PA_GV_MO, UNCONFIRMED_PRESET, dongBoTrangThaiCase } from '../cases/sosState.ts';
import { ganDauQuyChe, presetFor } from '../cases/sosAuto.ts';

export const KHOA_PR_SOS_TAM_PA = 'pr_sos_tam_pa_da_chay';
const TRUONG = 'pa_quy_che_trung_gv';

/** CHỈ ĐỌC: PA quy chế chờ (q) + PA GV cùng loại (g) của Case đang mở; `khac` = số Case có PA GV khác loại (thành "Chọn PA"). */
export function keHoachSosTamPa(conn: any): { trung: { q: number; g: number; caseId: number }[]; khac: number[] } {
  const ds = conn.prepare(`SELECT q.id AS q, q.case_id, q.kind AS kq, g.id AS g, g.kind AS kg FROM case_interventions q JOIN sos_cases sc ON sc.id = q.case_id
      JOIN case_interventions g ON g.case_id = q.case_id AND ${PA_GV_MO('g')}
     WHERE ${UNCONFIRMED_PRESET('q')} AND q.status = 'planned' AND q.kind != 'bo_tro' AND NOT ${CHO_DOI_PA('q')} AND sc.status != 'done' AND sc.tam = 0
     ORDER BY q.id, g.id`).all() as any[];
  const trung = new Map<number, { q: number; g: number; caseId: number }>();
  for (const r of ds) if (r.kq === r.kg && !trung.has(r.q)) trung.set(r.q, { q: r.q, g: r.g, caseId: r.case_id });
  const khac = [...new Set(ds.filter((r) => r.kq !== r.kg && !trung.has(r.q)).map((r) => r.case_id as number))];
  return { trung: [...trung.values()], khac };
}

/** Đổi — không khoá (phép kiểm gọi thẳng). Trả Case đã đổi. */
export function doiSosTamPa(conn: any): { trung: number[]; khac: number[] } {
  const k = keHoachSosTamPa(conn);
  for (const r of k.trung) {
    const q = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(r.q) as any;
    const g = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(r.g) as any;
    const luot = conn.prepare(`SELECT a.* FROM case_milestones m JOIN assessment_attempts a ON a.id = m.attempt_id WHERE m.case_id = ? AND m.kind IN ('opened', 'repeat')
        ORDER BY m.created_at DESC, m.id DESC LIMIT 1`).get(r.caseId) as any;
    const p = luot ? presetFor(luot, conn.prepare('SELECT sos_level FROM sos_cases WHERE id = ?').get(r.caseId)?.sos_level) : null;
    ganDauQuyChe(g, p && p.kind === q.kind ? p : { kind: q.kind, span: q.moc_quy_che, description: q.description }, luot ?? null, null);
    conn.prepare(`UPDATE case_interventions SET status = 'cancelled', closed_reason = 'dismissed', updated_at = ? WHERE id = ?`).run(nowIso(), q.id);
    conn.prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, '${TRUONG}', ?, ?, NULL, ?)`)
      .run(r.caseId, JSON.stringify({ q: q.id, g: g.id, status: q.status, closed_reason: q.closed_reason ?? null }), 'cancelled', nowIso());
    dongBoTrangThaiCase(r.caseId);
  }
  return { trung: k.trung.map((r) => r.caseId), khac: k.khac };
}

/** Khôi phục: PA quy chế về chờ, PA GV bỏ dấu quy chế (theo lịch sử `pa_gv_quy_che` mới nhất của PA đó); dòng lịch sử đổi thành `…_khoi_phuc`. Trả Case đã trả. */
export function khoiPhucSosTamPa(conn: any): number[] {
  const ra: number[] = [];
  for (const h of conn.prepare(`SELECT id, case_id, old_value FROM sos_case_history WHERE field = '${TRUONG}' ORDER BY id DESC`).all() as any[]) {
    const v = JSON.parse(h.old_value);
    conn.prepare('UPDATE case_interventions SET status = ?, closed_reason = ?, updated_at = ? WHERE id = ?').run(v.status, v.closed_reason, nowIso(), v.q);
    const g = conn.prepare(`SELECT id, old_value FROM sos_case_history WHERE case_id = ? AND field = 'pa_gv_quy_che' ORDER BY id DESC LIMIT 1`).get(h.case_id) as any;
    if (g) {
      const o = JSON.parse(g.old_value);
      conn.prepare('UPDATE case_interventions SET preset = 0, moc_quy_che = ?, followup_due = ?, confirmed_by = ?, confirmed_at = ?, updated_at = ? WHERE id = ?')
        .run(o.moc_quy_che, o.followup_due, o.confirmed_by, o.confirmed_at, nowIso(), o.pa);
      conn.prepare(`UPDATE sos_case_history SET field = 'pa_gv_quy_che_khoi_phuc' WHERE id = ?`).run(g.id);
    }
    conn.prepare(`UPDATE sos_case_history SET field = '${TRUONG}_khoi_phuc' WHERE id = ?`).run(h.id);
    dongBoTrangThaiCase(h.case_id);
    ra.push(h.case_id);
  }
  return ra;
}

export function migratePrSosTamPa(conn: any, applied: string[]) {
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_SOS_TAM_PA)) return;
  const r = doiSosTamPa(conn);
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_SOS_TAM_PA, demoToday(), nowIso());
  if (r.trung.length || r.khac.length) {
    applied.push(`SOS-TAM-PA: ${r.trung.length} Case PA của GV trùng loại PA quy chế chờ → PA GV mang dấu quy chế, PA quy chế chờ huỷ (khôi phục: khoiPhucSosTamPa), Case ${r.trung.join(', ') || '—'}`
      + ` · ${r.khac.length} Case PA GV khác loại → việc "Chọn PA", Case ${r.khac.join(', ') || '—'}.`);
  }
}
