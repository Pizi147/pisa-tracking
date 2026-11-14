/**
 * KY-VONG-MT0 (chủ SP 14/11: "MT0 … đạt overall rồi thì coi như đạt") — ĐỔI DỮ LIỆU MỘT LẦN lúc deploy. Kết quả đầu ra đã chốt "Không đạt" (Trung tâm /
 * Học viên) mà MT0 lớp nguồn đạt mốc chương trình (`goiYKyVong(...).dat`, cùng hàm mọi nơi đọc) → Đạt; Case "Kỳ vọng đầu ra…" còn mở của em đóng
 * theo (lý do hệ thống "Overall đạt", PA Tutor chưa xong → huỷ hệ thống; `dongCaseHeThongLo` ghi lịch sử, mốc, Hành trình, nhật ký).
 * Nhật ký `audit_logs` (`cuoi_khoa.ky_vong_tu_dat`, người ghi NULL = migrate) giữ kết luận cũ + bản chụp Case / PA → `khoiPhucKyVongTuDat` trả lại
 * (`npm run khoi-phuc-ky-vong-tu-dat`). Khoá `demo_config`; DB mới ghi khoá sẵn (`duLieuNen`).
 */
import { nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { theoLo } from '../db.ts';
import { mt0TheoLop } from '../normal/kyVong.ts';
import { dongCaseHeThongLo, moLaiCaseHeThongDong, type ChupCaseDong } from '../cases/systemClose.ts';

export const KHOA_KY_VONG_TU_DAT = 'pr_ky_vong_tu_dat_da_chay';
const DAU = 'ky-vong-tu-dat';

/** Sửa — không khoá (phép kiểm gọi thẳng). Trả số em đổi + số Case đóng. */
export function suaKyVongTuDat(conn: any): { em: number[]; caseDong: number[] } {
  const ds = conn.prepare(
    `SELECT lt.student_id AS sid, lt.class_id AS lop, c.programme_code AS ct, lt.ky_vong_nguyen_nhan AS nn, lt.ky_vong_mon AS mon, lt.ky_vong_ghi_chu AS ghiChu,
            lt.updated_by AS boi, lt.updated_at AS luc
       FROM lo_trinh_tiep_theo lt JOIN classes c ON c.id = lt.class_id
      WHERE lt.ky_vong_dat = 0 AND c.programme_code IN ('FOU', 'BE', 'ELE') ORDER BY lt.class_id, lt.student_id`,
  ).all() as any[];
  /* `mt0TheoLop` khoá theo em → mỗi lớp nguồn một lần (một em hai lớp nguồn vẫn đúng lớp). Hai câu mỗi lớp — migrate một lần. */
  const theoLop = new Map<number, any[]>();
  for (const r of ds) theoLop.set(r.lop, [...(theoLop.get(r.lop) ?? []), r]);
  const sua = [...theoLop.values()].flatMap((rs) => {
    const mt0 = mt0TheoLop(rs.map((r) => ({ sid: r.sid, lop: r.lop, ct: r.ct })));
    return rs.filter((r) => mt0.get(r.sid)?.goiY?.dat);
  });
  if (!sua.length) return { em: [], caseDong: [] };
  const sids = [...new Set(sua.map((r) => r.sid as number))];
  /* Case "Kỳ vọng đầu ra…" còn mở của em + PA chưa xong — chụp trước khi đóng (đủ để `moLaiCaseHeThongDong` mở lại đúng như cũ). */
  const caseCua = new Map<number, ChupCaseDong[]>();
  theoLo(sids, (lo, ph) => {
    for (const c of conn.prepare(
      `SELECT id AS id, student_id AS sid, status AS status, disposition AS disposition, disposition_note AS disposition_note, outcome_note AS outcome_note,
              dedup_key AS dedup_key, closed_at AS closed_at, closed_by AS closed_by
         FROM sos_cases WHERE origin_kind = 'chuyen_cap' AND title LIKE 'Kỳ vọng đầu ra%' AND status != 'done' AND student_id IN (${ph}) ORDER BY id`,
    ).all(...lo) as any[]) {
      const { sid, ...chup } = c;
      caseCua.set(sid, [...(caseCua.get(sid) ?? []), { ...chup, pa: [] }]);
    }
  });
  const moiCase = new Map([...caseCua.values()].flat().map((c) => [c.id, c]));
  theoLo([...moiCase.keys()], (lo, ph) => {
    for (const pa of conn.prepare(`SELECT id AS id, case_id AS caseId, status AS status FROM case_interventions WHERE status IN ('planned', 'started') AND case_id IN (${ph})`)
      .all(...lo) as any[]) moiCase.get(pa.caseId)!.pa.push({ id: pa.id, status: pa.status });
  });
  const luc = nowIso();
  const up = conn.prepare(`UPDATE lo_trinh_tiep_theo SET ky_vong_dat = 1, ky_vong_nguyen_nhan = NULL, ky_vong_mon = NULL, ky_vong_ghi_chu = NULL,
      updated_by = NULL, updated_at = ? WHERE student_id = ? AND class_id = ? AND ky_vong_dat = 0`);
  const ls = conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at)
    VALUES (NULL, 'cuoi_khoa.ky_vong_tu_dat', 'student', ?, 'Kỳ vọng đầu ra', ?, ?, ?)`);
  const daChup = new Set<number>();
  for (const r of sua) {
    up.run(luc, r.sid, r.lop);
    /* Case gắn em (không gắn lớp nguồn) — chụp vào dòng đầu tiên của em, không chụp hai lần. */
    const cases = daChup.has(r.sid) ? [] : caseCua.get(r.sid) ?? [];
    daChup.add(r.sid);
    ls.run(r.sid, JSON.stringify({ classId: r.lop, dat: 0, nguyenNhan: r.nn, mon: r.mon, ghiChu: r.ghiChu, updatedBy: r.boi, updatedAt: r.luc, cases }),
      JSON.stringify({ classId: r.lop, dat: 1, migrate: DAU }), luc);
  }
  const caseDong = dongCaseHeThongLo({ actorUserId: null, reason: 'overall_dat', on: demoToday(), caseIds: [...moiCase.keys()] });
  return { em: sids, caseDong };
}

/**
 * Khôi phục: kết luận về "Không đạt" cũ — chỉ khi dòng vẫn là Đạt do migrate ghi (`updated_by` NULL: QL đã chốt lại thì giữ); Case / PA mở lại đúng như
 * trước (`moLaiCaseHeThongDong`: Case đã bị sửa / có Case mới cùng khoá thì bỏ qua). Dòng nhật ký đổi action `…_khoi_phuc` để không trả hai lần.
 */
export function khoiPhucKyVongTuDat(conn: any): { em: number[]; caseMoLai: number[] } {
  const em: number[] = [], caseMoLai: number[] = [];
  for (const h of conn.prepare(`SELECT id AS id, entity_id AS sid, before_json AS cu FROM audit_logs
      WHERE action = 'cuoi_khoa.ky_vong_tu_dat' AND actor_user_id IS NULL AND json_valid(after_json) AND json_extract(after_json, '$.migrate') = ? ORDER BY id DESC`).all(DAU) as any[]) {
    const cu = JSON.parse(h.cu);
    const tra = conn.prepare(`UPDATE lo_trinh_tiep_theo SET ky_vong_dat = 0, ky_vong_nguyen_nhan = ?, ky_vong_mon = ?, ky_vong_ghi_chu = ?, updated_by = ?, updated_at = ?
        WHERE student_id = ? AND class_id = ? AND ky_vong_dat = 1 AND updated_by IS NULL`).run(cu.nguyenNhan, cu.mon, cu.ghiChu, cu.updatedBy, cu.updatedAt, h.sid, cu.classId).changes;
    if (tra) em.push(h.sid);
    /* Kết luận không trả được (đã có người ghi lại dòng) → Case giữ đóng, không để Case Tutor mở cạnh kết luận Đạt. */
    if (tra && cu.cases?.length) {
      caseMoLai.push(...moLaiCaseHeThongDong({ actorUserId: null, studentId: h.sid, reason: 'overall_dat', chup: cu.cases, tinHieu: [], lyDo: 'Khôi phục KY-VONG-MT0' }).moLai);
    }
    conn.prepare(`UPDATE audit_logs SET action = 'cuoi_khoa.ky_vong_tu_dat_khoi_phuc' WHERE id = ?`).run(h.id);
  }
  return { em, caseMoLai };
}

export function migratePrKyVongTuDat(conn: any, applied: string[]) {
  if (!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'demo_config'").get()) return;
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_KY_VONG_TU_DAT)) return;
  const r = suaKyVongTuDat(conn);
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_KY_VONG_TU_DAT, demoToday(), nowIso());
  if (r.em.length) applied.push(`KY-VONG-MT0: ${r.em.length} em "Không đạt" mà MT0 đạt mốc → Đạt, đóng ${r.caseDong.length} Case Kỳ vọng (khôi phục: npm run khoi-phuc-ky-vong-tu-dat).`);
}
