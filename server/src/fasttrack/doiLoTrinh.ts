/**
 * ĐỔI LỘ TRÌNH CỦA EM (LO-TRINH-THEO-HV, chủ SP 11/11: "Lộ trình là theo HV, KHÔNG PHẢI THEO LỚP… luật liên quan đến MT các thứ thì vẫn là
 * theo lộ trình của học viên") — LT1 · LT2 · RF của lộ trình FT đang chạy, ô "Lộ trình đang học" ở Sửa thông tin.
 *
 *   quyền     `duocDoiMon` — QL · Quản trị (chi nhánh em) · GVCN lớp em đang học · TVV chi nhánh em (cùng bốn vai đổi Môn học).
 *   đứng yên  lượt đã có điểm / đã xong: lịch giữ, kỳ vọng + SOS giữ theo lộ trình lúc thi (`route_at_attempt`); lượt QL xếp tay (`manual`) giữ.
 *   theo mới  lượt hệ thống tự xếp chưa có điểm: dời theo lịch MT lộ trình mới (cùng lõi đổi tuần bắt đầu, KHÔNG về tuần đã qua); thiếu thì tạo;
 *             thừa (lộ trình mới ít MT hơn, chưa có dấu gì) huỷ — đổi lại sau thì mở lại đúng lượt đã huỷ.
 *   giữ       Môn học, Target, điểm đầu vào, Case (thêm mốc "Sang lộ trình …").
 *   ghi       Hành trình + nhật ký `cycle.update` (Lịch sử sửa "Lộ trình"); Hoàn tác qua `ghi_dao` (mọi dòng còn y như sau lúc đổi).
 *   chặn      lớp thường (đổi chương trình = Chuyển lớp) · "Khác" (Lộ trình mới) · lộ trình đã đóng · trùng.
 */
import { db, theoLo, tx } from '../db.ts';
import { badRequest, conflict, forbidden, notFound, nowIso } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
import { activeRouteCodes } from '../platform/sysconfig.ts';
import { GhiDao, daoLai, luuGhiDao, type BanGhiDao } from '../platform/ghiDao.ts';
import { apLichMacDinh, lichMtCua } from '../classes/schedule.ts';
import { chuyenCaseSangLoTrinh } from '../cases/systemClose.ts';
import { huyLuotChuaDiem } from './mt0.ts';
import { duocDoiMon } from './monDangKy.ts';
import { demoToday } from '../demoConfig.ts';
import { CO_DIEM_SQL, ROUTE_KHAC, tuanLich } from '../../../shared/domain/index.ts';

export type DongDaoLoTrinh = { bang: string; dk: string; args: unknown[]; k: 'sua' | 'them' | 'ca' };
export type TomTatDoiLoTrinh = { cu: string; moi: string; doi: string[]; tao: string[]; huy: string[]; giu: number };

const LUOT = 'attempt_id IN (SELECT id FROM assessment_attempts WHERE cycle_id = ?)';
/** Bảng + điều kiện đổi lộ trình chạm — MỘT nguồn cho Hoàn tác (Sửa thông tin) và Huỷ quyết định (đề xuất "lộ trình" ở Chờ duyệt). */
export function dongDaoDoiLoTrinh(cycleId: number, studentId: number): DongDaoLoTrinh[] {
  return [
    { bang: 'learning_cycles', dk: 'id = ?', args: [cycleId], k: 'sua' },
    { bang: 'assessment_attempts', dk: 'cycle_id = ?', args: [cycleId], k: 'ca' },
    { bang: 'attempt_skills', dk: LUOT, args: [cycleId], k: 'ca' },
    { bang: 'attempt_schedule_history', dk: LUOT, args: [cycleId], k: 'them' },
    { bang: 'case_milestones', dk: 'case_id IN (SELECT id FROM sos_cases WHERE cycle_id = ?)', args: [cycleId], k: 'them' },
    { bang: 'journey_events', dk: 'student_id = ?', args: [studentId], k: 'them' },
  ];
}

/** Lộ trình chọn được ở ô (thứ tự danh mục): lộ trình FT đang dùng, trừ "Khác" (cần tên — Lộ trình mới). */
const loTrinhChonDuoc = (): string[] => activeRouteCodes().filter((c) => c !== ROUTE_KHAC);

/** Câu chặn (null = đổi được) — web hiện tại ô, máy chủ 400 cùng câu. */
export function lyDoKhongDoi(c: { route: string | null; status: string }): string | null {
  if (!c.route) return 'Lớp thường đi theo chương trình — đổi bằng Chuyển lớp.';
  if (c.status !== 'active') return 'Lộ trình đã kết thúc — không đổi lộ trình.';
  return null;
}

/**
 * LÕI (không kiểm quyền, chạy TRONG `tx` của nơi gọi): đổi `route` + lịch MT theo lộ trình mới. Dùng chung cho Sửa thông tin (`doiLoTrinh`) và
 * `updateCycle` (Duyệt / Huỷ quyết định đề xuất "lộ trình").
 */
export function apDoiLoTrinh(actorUserId: number | null, cycleId: number, route: unknown,
  /** `nhatKy: false` — nơi gọi tự ghi nhật ký cả dòng (`updateCycle`), khỏi hai dòng "Lộ trình" ở Lịch sử sửa. */
  o: { lyDo?: string | null; nhatKy?: boolean } = {}): TomTatDoiLoTrinh {
  const conn = db();
  const c = conn.prepare('SELECT id, student_id, route, status FROM learning_cycles WHERE id = ?').get(cycleId) as any;
  if (!c) throw notFound('Không tìm thấy lộ trình');
  const chan = lyDoKhongDoi(c);
  if (chan) throw badRequest(chan);
  const moi = String(route ?? '').trim();
  if (moi === ROUTE_KHAC) throw badRequest('Lộ trình "Khác" mở ở Bước tiếp › Lộ trình mới.');
  if (!loTrinhChonDuoc().includes(moi)) throw badRequest('Chọn một lộ trình còn dùng.');
  if (moi === c.route) throw badRequest('Lộ trình mới trùng lộ trình hiện tại.');
  const cu = c.route as string;
  const homNay = demoToday();
  const now = nowIso();
  const lyDo = `Đổi lộ trình ${cu} → ${moi}`;

  /* Lượt đã có điểm / đã xong giữ lộ trình lúc thi — kỳ vọng, SOS, hỗ trợ học thuật không đổi theo lộ trình mới. */
  conn.prepare(`UPDATE assessment_attempts AS a SET route_at_attempt = ? WHERE a.cycle_id = ? AND a.route_at_attempt IS NULL AND a.status != 'cancelled'
                  AND (a.status = 'done' OR ${CO_DIEM_SQL('a')})`).run(cu, cycleId);
  const giu = (conn.prepare(`SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ? AND kind = 'mock' AND status != 'cancelled' AND route_at_attempt IS NOT NULL`)
    .get(cycleId) as any).n as number;
  conn.prepare(`UPDATE learning_cycles SET route = ?, route_ten = NULL WHERE id = ?`).run(moi, cycleId);

  const lop = conn.prepare(`SELECT c.lich_mt, c.route FROM enrollments e JOIN classes c ON c.id = e.class_id
                             WHERE e.student_id = ? AND e.status = 'active' ORDER BY e.id DESC LIMIT 1`).get(c.student_id) as any;
  const soMt = lichMtCua(lop, moi).length;
  /* Đổi qua lại (RF → LT → RF…): lượt chính lần đổi trước huỷ, nay nằm trong số MT mới, chưa có lượt cùng số còn hiệu lực → mở lại để lõi xếp tuần. */
  const moLai = (conn.prepare(
    `SELECT a.id FROM assessment_attempts a WHERE a.cycle_id = ? AND a.kind = 'mock' AND a.status = 'cancelled' AND a.attempt_no <= ? AND a.cancel_reason LIKE 'Đổi lộ trình %'
        AND NOT EXISTS (SELECT 1 FROM assessment_attempts b WHERE b.cycle_id = a.cycle_id AND b.kind = 'mock' AND b.attempt_no = a.attempt_no AND b.status != 'cancelled')`)
    .all(cycleId, soMt) as any[]).map((r) => r.id as number);
  theoLo(moLai, (lo, ph) => {
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', cancel_reason = NULL, cancelled_at = NULL, updated_at = ? WHERE id IN (${ph})`).run(now, ...lo);
    for (const id of lo) conn.prepare(`INSERT INTO attempt_schedule_history (attempt_id, action, reason, actor_user_id, created_at) VALUES (?, 'reopened', ?, ?, ?)`).run(id, lyDo, actorUserId, now);
  });

  /* Cùng lõi đổi tuần bắt đầu (K2-33): lượt `auto` chưa điểm dời theo lịch mới — trừ tuần đã qua (chủ SP 10/11); số còn thiếu thì tạo. */
  const kq = apLichMacDinh(cycleId, actorUserId, { theoMoc: true, khongVeQua: true });

  /* Thừa: lượt tự xếp số > số MT của lộ trình mới, chưa có dấu gì (điểm, "-"), không kỹ năng nào xếp tay. */
  const thua = conn.prepare(
    `SELECT a.id, a.attempt_no FROM assessment_attempts a WHERE a.cycle_id = ? AND a.kind = 'mock' AND a.status = 'planned' AND a.plan_source = 'auto' AND a.attempt_no > ?
        AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id)
        AND NOT EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND k.plan_source != 'auto')
      ORDER BY a.attempt_no`).all(cycleId, soMt) as any[];
  huyLuotChuaDiem(actorUserId as number, thua.map((r) => r.id), lyDo);

  const tom: TomTatDoiLoTrinh = {
    cu, moi, giu,
    doi: kq.moved.map((x) => `MT${x.attemptNo} ${tuanLich(x.weekStart, homNay)}`),
    tao: kq.created.map((x) => `MT${x.attemptNo} ${tuanLich(x.weekStart, homNay)}`),
    huy: thua.map((r) => `MT${r.attempt_no}`),
  };
  chuyenCaseSangLoTrinh(actorUserId, c.student_id, cycleId, cycleId, moi, homNay);   // Case giữ, thêm mốc (K5-60)
  addJourney({
    studentId: c.student_id, cycleId, eventType: 'cycle_start', eventDate: homNay, title: lyDo,
    detail: [cauTomTat(tom), o.lyDo?.trim() || null].filter(Boolean).join(' — ') || null,
    refTable: 'learning_cycles', refId: cycleId, createdBy: actorUserId,
  });
  if (o.nhatKy !== false) writeAudit({ actorUserId, action: 'cycle.update', entityType: 'learning_cycle', entityId: cycleId, before: { route: cu }, after: { route: moi } });
  return tom;
}

/** "MT2 dời W1 DEC · MT3 tạo W2 JAN · MT3 huỷ · 1 MT đã có điểm giữ" — câu Hành trình + toast. */
export function cauTomTat(t: TomTatDoiLoTrinh): string {
  return [
    t.doi.length ? `${t.doi.join(', ')} dời theo lịch mới` : null,
    t.tao.length ? `thêm ${t.tao.join(', ')}` : null,
    t.huy.length ? `huỷ ${t.huy.join(', ')} chưa thi` : null,
    t.giu ? `${t.giu} MT đã có điểm giữ kỳ vọng cũ` : null,
  ].filter(Boolean).join(' · ');
}

const LOAI_DAO = 'lo_trinh.doi';

/** Sửa thông tin › ô "Lộ trình đang học": kiểm quyền, đổi + chụp `ghi_dao` cùng giao dịch. Trả tóm tắt + id bản ghi Hoàn tác. */
export function doiLoTrinh(p: Principal, cycleId: number, body: { route?: unknown; lyDo?: unknown }): TomTatDoiLoTrinh & { dao: number; cau: string } {
  const conn = db();
  const c = conn.prepare('SELECT id, student_id FROM learning_cycles WHERE id = ?').get(cycleId) as any;
  if (!c) throw notFound('Không tìm thấy lộ trình');
  if (!duocDoiMon(p, { studentId: c.student_id })) throw forbidden('Chỉ Quản lý, GVCN hoặc TVV của em đổi được lộ trình.');
  const lyDo = typeof body.lyDo === 'string' ? body.lyDo.slice(0, 2000) : null;
  return tx(() => {
    const g = new GhiDao(conn);
    const ds = dongDaoDoiLoTrinh(cycleId, c.student_id);
    for (const d of ds) if (d.k !== 'them') g.sua(d.bang, d.dk, ...d.args);
    const tom = ds.filter((d) => d.k !== 'sua')
      .reduce<() => TomTatDoiLoTrinh>((f, d) => () => g.theoDoi(d.bang, d.dk, d.args, f), () => apDoiLoTrinh(p.userId, cycleId, body.route, { lyDo }))();
    g.boKhongDoi('assessment_attempts');
    g.boKhongDoi('attempt_skills');
    const dao = luuGhiDao(conn, { loai: LOAI_DAO, bang: 'learning_cycles', id: cycleId, nguoi: p.userId, ghi: g });
    return { ...tom, dao, cau: cauTomTat(tom) };
  });
}

/** Hoàn tác lần đổi `dao` (toast 10 s; sau đó vẫn đổi lại được bằng chính ô chọn). Quyền như lúc đổi. */
export function hoanTacDoiLoTrinh(p: Principal, cycleId: number, daoId: unknown): { route: string } {
  const conn = db();
  const c = conn.prepare('SELECT id, student_id, route FROM learning_cycles WHERE id = ?').get(cycleId) as any;
  if (!c) throw notFound('Không tìm thấy lộ trình');
  if (!duocDoiMon(p, { studentId: c.student_id })) throw forbidden('Chỉ Quản lý, GVCN hoặc TVV của em đổi được lộ trình.');
  return tx(() => {
    const g = conn.prepare(`SELECT * FROM ghi_dao WHERE id = ? AND loai = ? AND bang = 'learning_cycles' AND doi_tuong_id = ?`)
      .get(Number(daoId), LOAI_DAO, cycleId) as BanGhiDao | undefined;
    if (!g) throw notFound('Không còn bản ghi để hoàn tác.');
    const cu = (JSON.parse(g.du_lieu) as { bang: string; truoc: any[] }[]).find((m) => m.bang === 'learning_cycles')?.truoc[0]?.route as string | undefined;
    if (!cu) throw conflict('Không hoàn tác được — chọn lại lộ trình cũ ở ô.');
    daoLai(conn, g, p.userId);
    writeAudit({ actorUserId: p.userId, action: 'cycle.update', entityType: 'learning_cycle', entityId: cycleId, before: { route: c.route }, after: { route: cu, _hoan: true } });
    return { route: cu };
  });
}
