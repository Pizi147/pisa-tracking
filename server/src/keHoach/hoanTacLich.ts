/**
 * R2 C2 (rà 24/11, luật "không khoá cứng"): HOÀN TÁC LẦN XẾP LỊCH TEST NHIỀU EM — Xếp lịch Test (lô một lớp), Xếp nhiều MT (lô nhiều lớp), Xếp theo học viên
 * (`/dot`, `/xep-moi` từng em khi web xin `hoanTac`). Lần lưu chụp mọi dòng lịch / điểm / sổ của các em đó (`ghi_dao`, như Chuyển lớp "Ngay hôm nay"),
 * Hoàn tác = trả về y như trước lần lưu (lượt vừa tạo mất, tuần cũ về, điểm thi lại về). Có ai đổi tiếp sau đó → 409, không đảo nửa chừng.
 *
 *   quyền   như xếp lịch (`requireSuaLichTest`) ở lớp / em của bản ghi.
 *   N15     Hoàn tác trong `HOAN_TAC_PHUT` phút sau lưu không hỏi khoá cuối tuần (đảo đúng lần vừa lưu); quá hạn → 409, sửa từng ô.
 *   giữ     nhật ký (`audit_logs`) — Lịch sử sửa thấy cả lần lưu lẫn lần Hoàn tác.
 */
import { db, tx } from '../db.ts';
import { badRequest, conflict, notFound, nowIso } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { HOAN_TAC_PHUT, chayCoChup, daoLai, luuGhiDao, type BanGhiDao, type DongChup } from '../platform/ghiDao.ts';
export { HOAN_TAC_PHUT };
import { requireSuaLichTest } from '../platform/moSuaLichTest.ts';
import { writeAudit } from '../platform/audit.ts';

const LOAI = 'ke_hoach.lich';

const PLAN_MSG = 'Chỉ Head hoàn tác được lịch Test.';

/** Bảng cha trước bảng con. Một tham số JSON cho cả lô (không vướng trần ~900 tham số của Turso). */
function dongLich(sids: readonly number[]): DongChup[] {
  const j = JSON.stringify([...new Set(sids)]);
  const em = 'IN (SELECT value FROM json_each(?))';
  const luot = `attempt_id IN (SELECT id FROM assessment_attempts WHERE student_id ${em})`;
  return [
    { bang: 'assessment_attempts', dk: `student_id ${em}`, args: [j], k: 'ca' },
    { bang: 'attempt_skills', dk: luot, args: [j], k: 'ca' },
    { bang: 'attempt_skill_skips', dk: luot, args: [j], k: 'ca' },
    { bang: 'assessment_scores', dk: luot, args: [j], k: 'ca' },
    { bang: 'skill_move_requests', dk: luot, args: [j], k: 'ca' },
    { bang: 'attempt_schedule_history', dk: luot, args: [j], k: 'them' },
    { bang: 'journey_events', dk: `student_id ${em}`, args: [j], k: 'them' },
    { bang: 'nghia_vu', dk: `hoc_vien ${em}`, args: [j], k: 'ca' },
    { bang: 'notifications', dk: `entity_type = 'assessment_attempt' AND entity_id IN (SELECT id FROM assessment_attempts WHERE student_id ${em})`, args: [j], k: 'them' },
  ];
}

/**
 * Chạy lần xếp `fn` có chụp để Hoàn tác (không mở giao dịch — lô xếp mỗi em một `tx`, lỗi em này không cuộn em khác). `doi` = lớp (lô) hoặc em
 * (`/dot`, `/xep-moi`). `daLuu(kq)` false → không lưu bản chụp. Trả kết quả + `dao`.
 */
export function xepCoHoanTac<T extends object>(p: Principal, doi: { bang: 'classes' | 'students'; id: number }, sids: readonly number[], fn: () => T,
  daLuu: (kq: T) => boolean = () => true): T & { dao?: number } {
  const conn = db();
  const { kq, g } = chayCoChup(conn, dongLich(sids), fn);
  if (!daLuu(kq) || g.rong) return kq;
  return { ...kq, dao: luuGhiDao(conn, { loai: LOAI, bang: doi.bang, id: doi.id, nguoi: p.userId, ghi: g }) };
}

/** `/dot`, `/xep-moi` một em: chỉ chụp khi web xin (`hoanTac: true` — Xếp theo học viên); ô lẻ không tốn thêm câu nào. `attemptId` → em của lượt. */
export function emCoHoanTac<T>(p: Principal, bat: unknown, em: { studentId?: number | null; attemptId?: number | null }, fn: () => T): T & { dao?: number } {
  type R = T & { dao?: number };
  if (bat !== true) return fn() as R;
  const sid = em.studentId ?? (db().prepare('SELECT student_id FROM assessment_attempts WHERE id = ?').get(em.attemptId) as any)?.student_id;
  if (!sid) return fn() as R;
  return xepCoHoanTac(p, { bang: 'students', id: sid }, [sid], fn as () => T & object);
}

/** POST /ke-hoach-test/hoan-tac { dao: id | id[] } — đảo các lần lưu (lần sau trước) trong MỘT giao dịch: tất cả hoặc không. */
export function hoanTacXep(p: Principal, daoVao: unknown, homNayIso = nowIso()): { ok: true; so: number } {
  const conn = db();
  const ids = [...new Set((Array.isArray(daoVao) ? daoVao : [daoVao]).map(Number))];
  if (!ids.length || ids.length > 500 || ids.some((x) => !Number.isInteger(x) || x <= 0)) throw badRequest('Danh sách hoàn tác không hợp lệ.');
  const ds = conn.prepare(`SELECT * FROM ghi_dao WHERE loai = ? AND id IN (SELECT value FROM json_each(?)) ORDER BY id DESC`).all(LOAI, JSON.stringify(ids)) as BanGhiDao[];
  if (ds.length !== ids.length) throw notFound('Không còn bản ghi để hoàn tác.');
  for (const g of ds) {
    const ctx = g.bang === 'classes' ? { classId: g.doi_tuong_id } : { studentId: g.doi_tuong_id };
    requireSuaLichTest(p, ctx, PLAN_MSG);   // kiểm quyền TRƯỚC khi ghi
    if (Date.parse(homNayIso) - Date.parse(g.luc) > HOAN_TAC_PHUT * 60_000) throw conflict(`Đã quá ${HOAN_TAC_PHUT} phút — không hoàn tác cả lần lưu được, sửa từng ô ở Kế hoạch Test.`);
  }
  return tx(() => {
    conn.pragma('defer_foreign_keys = ON');   // dòng thêm (lượt mới) xoá trước, khoá ngoại kiểm lúc chốt
    for (const g of ds) {
      daoLai(conn, g, p.userId);
      writeAudit({ actorUserId: p.userId, action: 'ke_hoach.hoan_tac', entityType: g.bang === 'classes' ? 'class' : 'student', entityId: g.doi_tuong_id,
        after: { dao: g.id, _hoan: true, _nguon: 'Hoàn tác xếp lịch Test' } });
    }
    return { ok: true as const, so: ds.length };
  });
}
