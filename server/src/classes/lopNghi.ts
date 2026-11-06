/**
 * FT-LOP-NGHI (chủ SP 06/11) — "Lớp nghỉ 1 tuần" của lớp Fast Track. Lớp FT không có Progress / Final cố định: lịch là các MT của từng em + hạn của
 * phương án hỗ trợ (PA). Cả lớp nghỉ một tuần thì MỘT thao tác dời đúng những thứ cần dời, theo 6 quyết định:
 *   1. MT KẾ TIẾP chưa thi của mỗi em đang học lớp +1 tuần — không dời các MT sau, không dời phần đã thi / có điểm;
 *   2. Báo cáo PH, 4. Ý thức, bàn giao chuyển lớp KHÔNG dời (không đụng bảng nào của chúng);
 *   3. MT dời mà vượt ngày thi thật của em → em đó giữ nguyên MT, xem trước nêu tên + lý do;
 *   5. chuông cho GV lớp + TVV của các em bị dời.
 * Thêm (nền "lớp nghỉ" chung): hạn làm PA (`action_due`) và hạn báo kết quả Case (`follow_until`) từ tuần nghỉ trở đi của em lớp đó +7 ngày — kể cả
 * em giữ MT, vì cả lớp nghỉ; hạn dời theo nên không ai trễ. Nhật ký lớp + nhật ký từng Case + lịch sử lịch MT ghi lý do; Hoàn tác trả đúng giá trị cũ.
 *
 * Quyền: `duocSuaLichLop` (lớp FT = `class.edit`: QL / Quản trị). Ghi theo LÔ (vài câu cho cả lớp, không câu nào theo từng em).
 * ponytail: lượt chưa có dòng kỹ năng (`attempt_skills`, tạo lười khi mở lượt) không được dời — mọi đường tạo / xếp MT đều tạo dòng.
 */
import { DS_JSON, THAM_SO_TOI_DA, chenNhieuDong, db, theoLo, theoLoJson, tx } from '../db.ts';
import { badRequest, forbidden, loi, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { duocSuaLichLop, type Principal } from '../permissions.ts';
import { notify, writeAudit, writeAuditLo } from '../platform/audit.ts';
import { ensurePeriods, mondayOf } from '../platform/week.ts';
import { HV_DANG_HOC_SQL, LUOT_CON_KE_HOACH_SQL } from '../students/tamDung.ts';
import { capNhatConOCho } from '../fasttrack/conOCho.ts';
import { laQuanTriGoc, recomputeCompletionWeek } from '../fasttrack/skillSchedule.ts';
import { dienMocQuyChe } from '../cases/sosAuto.ts';
import { addDaysIso, khoaCuoiTuan, ngay, tuanLich } from '../../../shared/domain/index.ts';

const NGAY_NGHI = 7;
const LY_DO_TOI_DA = 200;

export type EmLopNghi = {
  studentId: number; ten: string;
  /** "MT3" · null = em không có MT nào để dời (hết MT chưa thi từ tuần nghỉ). */
  mt: string | null; tuCu: string | null; tuMoi: string | null;
  /** Lý do MT của em giữ nguyên (vượt ngày thi thật · khoá T6–CN). */
  giu: string | null;
  /** Nhắc nhẹ, không chặn: MT dời trùng tuần với MT sau. */
  canhBao: string | null;
  soPa: number; soCase: number;
};
export type XemTruocLopNghi = {
  lop: string; tuan: { batDau: string; ma: string };
  em: EmLopNghi[]; soEmDoi: number; soEmGiu: number; soEmKhongMt: number; soPa: number; soCase: number;
};

type Hang = {
  kid: number; aid: number; cycle_id: number; attempt_no: number; asrc: string; apid: number | null; skill: string; required: number;
  pid: number | null; src: string; sit: string; week_start: string | null; ma: string | null; co_diem: number;
};
type Doi = { kid: number; aid: number; p0: number | null; s0: string; w1: string; ma0: string | null; skill: string };
type KeHoach = {
  lop: { id: number; code: string }; tuan: string; em: EmLopNghi[]; doi: Doi[]; aid: number[];
  cs: [number, string, string][]; pa: [number, string, string][]; csTheoEm: Map<number, number[]>;
  tvv: Map<number, string[]>;
};

/** Một cửa quyền + lớp: lớp FT còn học, người gọi sửa được lịch lớp (FT = QL / Quản trị). `kt` = đường Hoàn tác không đòi lớp còn học. */
function lopCho(p: Principal, classId: number, kt = false) {
  const c = db().prepare('SELECT id, code, status, is_fast_track FROM classes WHERE id = ?').get(classId) as any;
  if (!c) throw notFound('Không tìm thấy lớp');
  if (!duocSuaLichLop(p, classId)) throw forbidden('Chỉ Quản lý mới cho lớp Fast Track nghỉ được.');
  if (!c.is_fast_track) throw badRequest('Chỉ lớp Fast Track mới có "Lớp nghỉ 1 tuần".');
  if (!kt && c.status !== 'active') throw badRequest('Lớp đã kết thúc.');
  return c as { id: number; code: string; status: string };
}

const lyDoSach = (v: unknown): string | null => {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string') throw badRequest('Lý do không hợp lệ.');
  const s = v.trim();
  if (s.length > LY_DO_TOI_DA) throw loi(400, 'Lý do tối đa {x} ký tự.', { x: LY_DO_TOI_DA });
  return s || null;
};

/** Tuần nghỉ: ngày bất kỳ → thứ Hai của tuần đó. */
function tuanNghi(v: unknown): string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(`${v}T00:00:00Z`))) throw badRequest('Chọn tuần nghỉ.');
  return mondayOf(v);
}

/** Dựng kế hoạch — CHỈ ĐỌC, 5 câu cho cả lớp (em · dòng MT · Case · PA · hết) bất kể số em. */
function ke(c: { id: number; code: string }, p: Principal, tuan: string): KeHoach {
  const conn = db();
  const homNay = demoToday();
  const quanTri = laQuanTriGoc(p);
  const ems = conn.prepare(
    `SELECT s.id, s.full_name AS ten, s.consultant_user_id AS tvv, cy.id AS cycle_id, cy.exam_date, ep.week_end AS thi_cn
       FROM enrollments e
       JOIN students s ON s.id = e.student_id AND ${HV_DANG_HOC_SQL('s')}
       JOIN learning_cycles cy ON cy.student_id = s.id AND cy.route IS NOT NULL
        AND cy.seq = (SELECT MAX(z.seq) FROM learning_cycles z WHERE z.student_id = s.id AND z.route IS NOT NULL)
       LEFT JOIN report_periods ep ON ep.id = cy.exam_period_id
      WHERE e.class_id = ? AND e.status = 'active' ORDER BY s.full_name, s.id`,
  ).all(c.id) as any[];

  const hang = new Map<number, Hang[]>();   // theo lộ trình
  const caseCua = new Map<number, number[]>();   // em → Case mở
  const dem = new Map<number, { cs: number; pa: number }>();   // em → số Case / PA có hạn dời (hạn từ tuần nghỉ trở đi)
  const emCuaCase = new Map<number, number>();
  const cs: [number, string, string][] = [];
  const pa: [number, string, string][] = [];
  if (ems.length) {
    theoLoJson(ems.map((e) => e.cycle_id as number), (json) => {
      for (const r of conn.prepare(
        `SELECT a.id AS aid, a.cycle_id, a.attempt_no, a.plan_source AS asrc, a.planned_period_id AS apid,
                k.id AS kid, k.skill, k.required, k.planned_period_id AS pid, k.plan_source AS src, k.sit_status AS sit, pr.week_start, pr.code AS ma,
                EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id AND (sc.band IS NOT NULL OR sc.raw_score IS NOT NULL)
                         AND (sc.skill = k.skill OR (k.skill = 'writing' AND sc.skill IN ('writing1', 'writing2')))) AS co_diem
           FROM assessment_attempts a
           JOIN attempt_skills k ON k.attempt_id = a.id
           LEFT JOIN report_periods pr ON pr.id = k.planned_period_id
          WHERE a.cycle_id IN (${DS_JSON}) AND a.kind = 'mock' AND a.status = 'planned' AND a.lich_su = 0 AND ${LUOT_CON_KE_HOACH_SQL('a')}`,
      ).all(json) as Hang[]) {
        if (!hang.has(r.cycle_id)) hang.set(r.cycle_id, []);
        hang.get(r.cycle_id)!.push(r);
      }
    });
    theoLoJson(ems.map((e) => e.id as number), (json) => {
      for (const r of conn.prepare(`SELECT id, student_id, follow_until FROM sos_cases WHERE student_id IN (${DS_JSON}) AND status != 'done'`).all(json) as any[]) {
        if (!caseCua.has(r.student_id)) caseCua.set(r.student_id, []);
        caseCua.get(r.student_id)!.push(r.id);
        emCuaCase.set(r.id, r.student_id);
        /* Chỉ hạn từ tuần nghỉ trở đi mới dời — hạn trước đó không bị lớp nghỉ đụng tới (như MT: chỉ từ tuần nghỉ). */
        if (r.follow_until && r.follow_until.slice(0, 10) >= tuan) {
          cs.push([r.id, r.follow_until, addDaysIso(r.follow_until, NGAY_NGHI)]);
          dem.set(r.student_id, { cs: (dem.get(r.student_id)?.cs ?? 0) + 1, pa: dem.get(r.student_id)?.pa ?? 0 });
        }
      }
    });
    const caseIds = [...caseCua.values()].flat();
    theoLoJson(caseIds, (json) => {
      for (const r of conn.prepare(
        `SELECT id, case_id, action_due FROM case_interventions WHERE case_id IN (${DS_JSON}) AND status IN ('planned', 'started') AND action_due IS NOT NULL`,
      ).all(json) as any[]) {
        if (r.action_due.slice(0, 10) < tuan) continue;
        pa.push([r.id, r.action_due, addDaysIso(r.action_due, NGAY_NGHI)]);
        const sid = emCuaCase.get(r.case_id)!;
        dem.set(sid, { cs: dem.get(sid)?.cs ?? 0, pa: (dem.get(sid)?.pa ?? 0) + 1 });
      }
    });
  }

  const doi: Doi[] = [];
  const aid = new Set<number>();
  const tvv = new Map<number, string[]>();
  const em: EmLopNghi[] = ems.map((e) => {
    const x: EmLopNghi = { studentId: e.id, ten: e.ten, mt: null, tuCu: null, tuMoi: null, giu: null, canhBao: null, soPa: dem.get(e.id)?.pa ?? 0, soCase: dem.get(e.id)?.cs ?? 0 };
    const ds = hang.get(e.cycle_id) ?? [];
    /* Dòng dời được: bắt buộc, chưa thi (`scheduled`), chưa có điểm, tuần từ tuần nghỉ trở đi. MT kế tiếp = lượt có dòng như vậy ở tuần SỚM NHẤT. */
    const dời = ds.filter((r) => r.required && r.sit === 'scheduled' && !r.co_diem && r.week_start && r.week_start.slice(0, 10) >= tuan);
    if (!dời.length) return x;
    const dau = dời.reduce((a, b) => (a.week_start! < b.week_start! || (a.week_start === b.week_start && a.attempt_no <= b.attempt_no) ? a : b));
    const dong = dời.filter((r) => r.aid === dau.aid);
    const tuMoi = (r: Hang) => addDaysIso(r.week_start!.slice(0, 10), NGAY_NGHI);
    x.mt = `MT${dau.attempt_no}`;
    x.tuCu = dau.week_start!.slice(0, 10);
    x.tuMoi = tuMoi(dau);
    const gioiHan = e.exam_date ?? e.thi_cn ?? null;   // ngày thi thật; chưa có ngày thì hết tuần thi dự kiến
    const muon = dong.map(tuMoi).sort().at(-1)!;
    const khoa = khoaCuoiTuan({ tuan: [...dong.map((r) => r.week_start), ...dong.map(tuMoi)], homNay, quanTri });
    if (gioiHan && muon > gioiHan.slice(0, 10)) x.giu = `Vượt ngày thi thật ${ngay(gioiHan.slice(0, 10))}`;
    else if (khoa) x.giu = 'Khoá đổi lịch thứ Sáu – Chủ nhật';
    else {
      const trung = ds.find((r) => r.aid !== dau.aid && r.required && r.week_start && dong.some((d) => tuMoi(d) === r.week_start!.slice(0, 10)));
      if (trung) x.canhBao = `Trùng tuần MT${trung.attempt_no}`;
      for (const r of dong) doi.push({ kid: r.kid, aid: r.aid, p0: r.pid, s0: r.src, w1: tuMoi(r), ma0: r.ma, skill: r.skill });
      aid.add(dau.aid);
      if (e.tvv) tvv.set(e.tvv, [...(tvv.get(e.tvv) ?? []), e.ten]);
    }
    return x;
  });
  /* Chỉ dòng của lượt được dời; lượt đã chọn nhưng em giữ nguyên thì không vào `doi`. */
  return { lop: c, tuan, em, doi, aid: [...aid], cs, pa, csTheoEm: caseCua, tvv };
}

const tomTat = (k: KeHoach): XemTruocLopNghi => {
  const ma = ensurePeriods([k.tuan]).get(k.tuan)!.code;
  return {
    lop: k.lop.code, tuan: { batDau: k.tuan, ma },
    em: k.em, soEmDoi: k.em.filter((e) => e.mt && !e.giu).length, soEmGiu: k.em.filter((e) => e.giu).length,
    soEmKhongMt: k.em.filter((e) => !e.mt).length, soPa: k.pa.length, soCase: k.cs.length,
  };
};

/** GET /classes/:id/lop-nghi?tuan= — xem trước, không ghi gì (ngoài tuần lịch còn thiếu của bảng tuần). */
export function xemTruocLopNghi(p: Principal, classId: number, tuan: unknown): XemTruocLopNghi {
  const c = lopCho(p, classId);
  return tomTat(ke(c, p, tuanNghi(tuan ?? mondayOf(demoToday()))));
}

/** `UPDATE bang SET cot = CASE id WHEN ? THEN ? … END WHERE id IN (…)` — mỗi hàng một giá trị, theo lô. `bang` / `cot` là hằng của module. */
function datHan(bang: 'sos_cases' | 'case_interventions', cot: 'follow_until' | 'action_due', ds: readonly [number, string][], luc: string) {
  theoLo(ds, (lo) => {
    db().prepare(`UPDATE ${bang} SET ${cot} = CASE id ${lo.map(() => 'WHEN ? THEN ?').join(' ')} END, updated_at = ? WHERE id IN (${lo.map(() => '?').join(',')})`)
      .run(...lo.flatMap(([id, v]) => [id, v]), luc, ...lo.map(([id]) => id));
  }, Math.floor(THAM_SO_TOI_DA / 3));
}

/** Chuông "đổi lịch lớp" cho GV đang dạy lớp (trừ người bấm) + mỗi TVV của em bị dời một chuông. */
function bao(p: Principal, c: { id: number; code: string }, tieuDe: string, tvv: Map<number, string[]>) {
  const luc = nowIso();
  const homNay = demoToday();
  const nguoi = new Map<number, string>();
  for (const r of db().prepare(
    `SELECT DISTINCT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?)`,
  ).all(c.id, homNay, homNay) as any[]) nguoi.set(r.user_id, tieuDe);
  for (const [uid, ten] of tvv) {
    const ds = ten.length > 3 ? `${ten.slice(0, 3).join(', ')} +${ten.length - 3}` : ten.join(', ');
    nguoi.set(uid, `${tieuDe} — ${ds}`);   // TVV cần biết em nào; GV lớp đã thấy cả lớp
  }
  for (const [uid, tieu] of nguoi) {
    if (uid === p.userId) continue;
    notify({ userId: uid, kind: 'doi_lich_lop', title: `${p.fullName}: ${tieu}`.slice(0, 300), entityType: 'class', entityId: c.id,
      dedupKey: `lop_nghi:${c.id}:${luc}`, duong: `/hoc-vien/lop/${c.id}` });
  }
}

/** Mảng nén cho Hoàn tác: dòng MT [kid, aid, p0, s0, p1] · lượt [aid, p0, s0, p1] · Case / PA [id, cũ, mới]. */
type Goi = { mt: [number, number, number | null, string, number][]; lu: [number, number | null, string, number][]; cs: [number, string, string][]; pa: [number, string, string][] };

/** POST /classes/:id/lop-nghi { tuan, lyDo? } — dời MT kế tiếp + hạn PA / Case +7 ngày, trong MỘT giao dịch. Trả xem trước đã áp + `lanId` cho Hoàn tác. */
export function apDungLopNghi(p: Principal, classId: number, input: { tuan?: unknown; lyDo?: unknown }) {
  const c = lopCho(p, classId);
  const lyDo = lyDoSach(input?.lyDo);
  const k = ke(c, p, tuanNghi(input?.tuan));
  if (!k.doi.length && !k.cs.length && !k.pa.length) throw badRequest('Không có MT hay hạn nào cần dời từ tuần này.');
  return tx(() => {
    const conn = db();
    const luc = nowIso();
    const nhan = `Lớp nghỉ 1 tuần${lyDo ? ` · ${lyDo}` : ''}`;
    const moi = ensurePeriods([...new Set(k.doi.map((d) => d.w1))]);
    const goi: Goi = { mt: [], lu: [], cs: k.cs, pa: k.pa };

    /* Dòng kỹ năng: nhóm theo tuần mới (vài nhóm) — mỗi nhóm một câu. */
    const theoTuan = new Map<number, number[]>();
    for (const d of k.doi) {
      const pid = moi.get(d.w1)!.id;
      theoTuan.set(pid, [...(theoTuan.get(pid) ?? []), d.kid]);
      goi.mt.push([d.kid, d.aid, d.p0, d.s0, pid]);
    }
    for (const [pid, ids] of theoTuan) {
      theoLoJson(ids, (json) => conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual', updated_at = ? WHERE id IN (${DS_JSON})`).run(pid, luc, json));
    }
    /* Lượt: tuần kế hoạch hoàn tất = tuần muộn nhất của dòng bắt buộc chưa huỷ (như `completionWeekOf`), tính từ dữ liệu đã nạp. */
    const tuanMoiCua = new Map(k.doi.map((d) => [d.kid, d.w1] as const));
    const luotRows = new Map<number, { apid: number | null; asrc: string; ws: string[] }>();
    theoLoJson(k.aid, (json) => {
      for (const r of conn.prepare(
        `SELECT a.id, a.planned_period_id AS apid, a.plan_source AS asrc, pr.week_start AS ws, kk.id AS kid
           FROM assessment_attempts a JOIN attempt_skills kk ON kk.attempt_id = a.id AND kk.required = 1 AND kk.sit_status != 'cancelled'
           LEFT JOIN report_periods pr ON pr.id = kk.planned_period_id WHERE a.id IN (${DS_JSON})`,
      ).all(json) as any[]) {
        const x = luotRows.get(r.id) ?? { apid: r.apid, asrc: r.asrc, ws: [] as string[] };
        x.ws.push(tuanMoiCua.get(r.kid) ?? r.ws);
        luotRows.set(r.id, x);
      }
    });
    const theoLuot = new Map<number, number[]>();
    for (const [id, x] of luotRows) {
      const w = x.ws.filter(Boolean).sort().at(-1);
      if (!w) continue;
      const pid = moi.get(w)?.id ?? (ensurePeriods([w]).get(w)!.id);
      goi.lu.push([id, x.apid, x.asrc, pid]);
      theoLuot.set(pid, [...(theoLuot.get(pid) ?? []), id]);
    }
    for (const [pid, ids] of theoLuot) {
      theoLoJson(ids, (json) => conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = 'manual', updated_at = ? WHERE id IN (${DS_JSON})`).run(pid, luc, json));
    }
    capNhatConOCho(k.aid);
    chenNhieuDong('INSERT INTO attempt_schedule_history (attempt_id, action, field, old_value, new_value, reason, actor_user_id, created_at)',
      k.doi.map((d) => [d.aid, 'skill_week_set', d.skill, d.ma0, moi.get(d.w1)!.code, nhan, p.userId, luc]));

    datHan('sos_cases', 'follow_until', k.cs.map(([id, , den]) => [id, den]), luc);
    datHan('case_interventions', 'action_due', k.pa.map(([id, , den]) => [id, den]), luc);
    const tatCaCase = [...k.csTheoEm.values()].flat();
    if (tatCaCase.length) dienMocQuyChe({ caseIds: tatCaCase });   // PA "đến MT kế" theo tuần MT mới

    const xem = tomTat(k);
    writeAuditLo(k.cs.map(([id, tu, den]) => ({ actorUserId: p.userId, action: 'case.lop_nghi', entityType: 'sos_case', entityId: id,
      before: { followUntil: tu }, after: { followUntil: den, lyDo: nhan } })));
    writeAudit({ actorUserId: p.userId, action: 'class.lop_nghi', entityType: 'class', entityId: classId, entityLabel: c.code, before: goi,
      after: { tuan: xem.tuan.ma, lyDo, soEmDoi: xem.soEmDoi, soEmGiu: xem.soEmGiu, soPa: xem.soPa, soCase: xem.soCase } });
    const lanId = (conn.prepare(`SELECT id FROM audit_logs WHERE entity_type = 'class' AND entity_id = ? AND action = 'class.lop_nghi' ORDER BY id DESC LIMIT 1`).get(classId) as any).id as number;
    bao(p, c, `lớp ${c.code} nghỉ 1 tuần (${tuanLich(k.tuan, demoToday())}) — ${xem.soEmDoi} em dời MT +1 tuần`, k.tvv);
    return { ...xem, lanId };
  });
}

/** POST /classes/:id/lop-nghi/hoan-tac { lanId } — trả MT, hạn PA / Case về như trước; phần đã bị sửa tiếp (giá trị khác lúc dời) giữ nguyên. */
export function hoanTacLopNghi(p: Principal, classId: number, lanId: unknown) {
  const c = lopCho(p, classId, true);
  if (!Number.isInteger(lanId)) throw badRequest('Thiếu lần lớp nghỉ cần hoàn tác.');
  const conn = db();
  const lan = conn.prepare(`SELECT before_json FROM audit_logs WHERE id = ? AND entity_type = 'class' AND entity_id = ? AND action = 'class.lop_nghi'`).get(lanId, classId) as any;
  if (!lan) throw notFound('Không tìm thấy lần lớp nghỉ này.');
  const roi = conn.prepare(`SELECT 1 FROM audit_logs WHERE entity_type = 'class' AND entity_id = ? AND action = 'class.lop_nghi_hoan_tac' AND json_extract(after_json, '$.lanId') = ?`).get(classId, lanId);
  if (roi) throw badRequest('Lần lớp nghỉ này đã được hoàn tác.');
  const goi = JSON.parse(lan.before_json) as Goi;
  return tx(() => {
    const luc = nowIso();
    let khoiPhuc = 0, boQua = 0;

    /* Dòng MT: chỉ trả khi vẫn đang ở tuần đã dời và chưa thi. */
    const hienTai = new Map<number, { pid: number | null; sit: string }>();
    theoLoJson(goi.mt.map((m) => m[0]), (json) => {
      for (const r of conn.prepare(`SELECT id, planned_period_id AS pid, sit_status AS sit FROM attempt_skills WHERE id IN (${DS_JSON})`).all(json) as any[]) hienTai.set(r.id, r);
    });
    const tra = goi.mt.filter(([kid, , , , p1]) => hienTai.get(kid)?.pid === p1 && hienTai.get(kid)?.sit === 'scheduled');
    boQua += goi.mt.length - tra.length;
    khoiPhuc += tra.length;
    const pid = (v: string) => (v === 'null' ? null : Number(v));
    /* mỗi dòng một giá trị gốc (tuần + nguồn): gộp theo (tuần, nguồn) để vài câu cho cả lớp */
    const nhom = new Map<string, number[]>();
    for (const [kid, , p0, s0] of tra) nhom.set(`${p0}|${s0}`, [...(nhom.get(`${p0}|${s0}`) ?? []), kid]);
    for (const [kh, ids] of nhom) {
      const [p0, s0] = kh.split('|');
      theoLoJson(ids, (json) => conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = ?, updated_at = ? WHERE id IN (${DS_JSON})`).run(pid(p0), s0, luc, json));
    }
    const daTra = new Set(tra.map(([kid]) => kid));
    const luotDu = new Set(goi.mt.filter(([kid]) => !daTra.has(kid)).map(([, aid]) => aid));
    const aidTra = [...new Set(tra.map(([, aid]) => aid))];
    const luotNhom = new Map<string, number[]>();
    const luotTinhLai: number[] = [];
    for (const [aid, apid0, asrc0] of goi.lu) {
      if (!aidTra.includes(aid)) continue;
      if (luotDu.has(aid)) luotTinhLai.push(aid);   // còn dòng bị sửa tiếp → tuần hoàn tất tính lại từ dòng thật
      else luotNhom.set(`${apid0}|${asrc0}`, [...(luotNhom.get(`${apid0}|${asrc0}`) ?? []), aid]);
    }
    for (const [kh, ids] of luotNhom) {
      const [p0, s0] = kh.split('|');
      theoLoJson(ids, (json) => conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = ?, updated_at = ? WHERE id IN (${DS_JSON})`).run(pid(p0), s0, luc, json));
    }
    for (const id of luotTinhLai) recomputeCompletionWeek(id, p.userId);   // hiếm: lượt có dòng đã bị sửa tiếp
    capNhatConOCho(aidTra);
    if (tra.length) {
      const ma = new Map<number, string>();
      theoLoJson([...new Set(tra.flatMap(([, , p0, , p1]) => [p0, p1].filter((x): x is number => x !== null)))], (json) => {
        for (const r of conn.prepare(`SELECT id, code FROM report_periods WHERE id IN (${DS_JSON})`).all(json) as any[]) ma.set(r.id, r.code);
      });
      const ky = new Map<number, string>();
      theoLoJson(tra.map(([kid]) => kid), (json) => {
        for (const r of conn.prepare(`SELECT id, skill FROM attempt_skills WHERE id IN (${DS_JSON})`).all(json) as any[]) ky.set(r.id, r.skill);
      });
      chenNhieuDong('INSERT INTO attempt_schedule_history (attempt_id, action, field, old_value, new_value, reason, actor_user_id, created_at)',
        tra.map(([kid, aid, p0, , p1]) => [aid, 'skill_week_set', ky.get(kid) ?? null, ma.get(p1) ?? null, p0 === null ? null : ma.get(p0) ?? null, 'Hoàn tác lớp nghỉ 1 tuần', p.userId, luc]));
    }

    /* Case / PA: chỉ trả khi giá trị hiện tại còn đúng giá trị lúc dời. */
    const traHan = (bang: 'sos_cases' | 'case_interventions', cot: 'follow_until' | 'action_due', ds: [number, string, string][]) => {
      const nay = new Map<number, string | null>();
      theoLoJson(ds.map((d) => d[0]), (json) => {
        for (const r of conn.prepare(`SELECT id, ${cot} AS v FROM ${bang} WHERE id IN (${DS_JSON})`).all(json) as any[]) nay.set(r.id, r.v);
      });
      const ok = ds.filter(([id, , den]) => nay.get(id) === den);
      boQua += ds.length - ok.length;
      khoiPhuc += ok.length;
      datHan(bang, cot, ok.map(([id, tu]) => [id, tu]), luc);
    };
    traHan('sos_cases', 'follow_until', goi.cs);
    traHan('case_interventions', 'action_due', goi.pa);
    const caseIds = goi.cs.map((d) => d[0]);
    if (caseIds.length) dienMocQuyChe({ caseIds });
    writeAuditLo(goi.cs.map(([id, tu, den]) => ({ actorUserId: p.userId, action: 'case.lop_nghi', entityType: 'sos_case', entityId: id,
      before: { followUntil: den }, after: { followUntil: tu, lyDo: 'Hoàn tác lớp nghỉ 1 tuần' } })));
    writeAudit({ actorUserId: p.userId, action: 'class.lop_nghi_hoan_tac', entityType: 'class', entityId: classId, entityLabel: c.code, after: { lanId, khoiPhuc, boQua } });
    bao(p, c, `đã hoàn tác "Lớp nghỉ 1 tuần" của lớp ${c.code} — lịch MT và hạn trở lại như cũ`, new Map());
    return { khoiPhuc, boQua };
  });
}
