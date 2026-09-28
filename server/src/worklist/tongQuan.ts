import { db } from '../db.ts';
import {
  ASSESSED_SKILLS, CAN_XU_LY, PERMISSIONS, SOS_LABEL, caseTopicLabel, tenMon, chonDiemDangChuY, sapCanXuLy,
  type ChuongTrinh, type DiemChuY, type DongCanXuLyGoc, type MaCanXuLy, type UngVienChuY,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, forbidden } from '../util.ts';
import { can, scopeFor, type Principal } from '../permissions.ts';
import { listCases } from '../cases/cases.ts';
import { warningsFor } from '../yThuc/canhBao.ts';
import { latestAttempts, studentsInScope } from './danhGia.ts';
import { metricSet } from './metrics.ts';
import { tachTheoLop } from './chuongTrinh.ts';

/**
 * TỔNG QUAN (PR-Pa, đặc tả §3.2). File này KHÔNG ĐẾM gì: mọi số lấy từ `metricSet` (hợp đồng số liệu luật 1), ở đây chỉ
 * chọn chỉ số nào lên khối nào, xếp thứ tự và viết dòng phụ.
 */

export function tongQuanQuanLy(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh }) {
  if (scopeFor(p, PERMISSIONS.MEETING_VIEW).none) throw forbidden('Khối này dành cho Quản lý.');
  const base = { branchId: f.branchId ?? null, program: f.ct };

  /* CẦN XỬ LÝ — mỗi dòng một chỉ số của sổ. */
  const sets = new Map<MaCanXuLy, ReturnType<typeof metricSet>>();
  const dem: Partial<Record<MaCanXuLy, number>> = {};
  for (const x of CAN_XU_LY) {
    const r = metricSet(p, x.metricId, base);
    sets.set(x.metricId, r);
    dem[x.metricId] = r.n;
  }
  const coQuyenDuyet = can(p, PERMISSIONS.CASE_APPROVE, { anyScope: true });
  const canXuLy: (DongCanXuLyGoc & { phu: string })[] = sapCanXuLy(dem, coQuyenDuyet).map((x) => {
    const r = sets.get(x.metricId)!;
    return { ...x, phu: tachTheoLop(r.unit, r.ids) };
  });

  /* ĐIỂM ĐÁNG CHÚ Ý — ba luật (plan Q6), mỗi ứng viên là một chỉ số có sẵn. */
  const ung: UngVienChuY[] = [];
  /* `hv-duoi-ky-vong-mon` là chỉ số khung Fast Track: 4 kỹ năng đánh giá (MH5). */
  for (const skill of ASSESSED_SKILLS) {
    const r = metricSet(p, 'hv-duoi-ky-vong-mon', { ...base, skill });
    ung.push({ loai: 'mon-duoi-ky-vong', metricId: 'hv-duoi-ky-vong-mon', extra: { skill }, tu: r.n,
      mau: r.denominatorIds?.length ?? 0, nhanMon: tenMon(null, skill) });
  }
  const tl = metricSet(p, 'ty-le-co-cai-thien', base);
  ung.push({ loai: 'pa-cai-thien', metricId: 'ty-le-co-cai-thien', tu: tl.numeratorIds?.length ?? 0, mau: tl.n });
  const from = addDays(demoToday(), -30);
  const dh = metricSet(p, 'dung-han-cap-nhat', { ...base, from });
  ung.push({ loai: 'dung-han', metricId: 'dung-han-cap-nhat', extra: { from }, tu: dh.numeratorIds?.length ?? 0, mau: dh.n });
  const diemDangChuY: DiemChuY[] = chonDiemDangChuY(ung, f.ct);

  return { canXuLy, diemDangChuY };
}

export type DongHvCanHoTro = {
  studentId: number; ten: string; lop: string | null;
  huyHieu: { text: string; tone: 'info' | 'warn' | 'danger' } | null;
  phu: string;
};

/**
 * HỌC VIÊN CẦN HỖ TRỢ — khối của giáo viên (§3.2, mockup 02 bản GV). Em ĐANG HỌC ở lớp người xem được xem, có SOS ≥ 1 ở
 * đợt mới nhất hợp lệ, hoặc Case đang mở, hoặc cảnh báo vi phạm 5 ngày. Mọi phần dùng lại hàm có sẵn (không luật mới):
 * `latestAttempts` (SOS), `listCases` (Case), `pa-can-cap-nhat` (PA quá hạn), `warningsFor` (vi phạm).
 */
export function hocVienCanHoTro(p: Principal): { rows: DongHvCanHoTro[]; tong: number } {
  const today = demoToday();
  const sids = studentsInScope(p, null);
  if (!sids.length) return { rows: [], tong: 0 };
  const trong = new Set(sids);
  const latest = latestAttempts(sids, 'valid', today);

  const caseCua = new Map<number, { n: number; mon: Set<string> }>();
  const caseHv = new Map<number, number>();
  for (const c of listCases(p, {}).rows as any[]) {
    if (c.state === 'done' || !c.studentId || !trong.has(c.studentId)) continue;
    caseHv.set(c.id, c.studentId);
    const x = caseCua.get(c.studentId) ?? { n: 0, mon: new Set<string>() };
    x.n += 1;
    if (c.topic) x.mon.add(caseTopicLabel(c.topic, c.chuongTrinh));
    caseCua.set(c.studentId, x);
  }
  const paQuaHan = new Map<number, number>();
  const pa = metricSet(p, 'pa-can-cap-nhat', {}).ids;
  for (let i = 0; i < pa.length; i += 400) {
    const chunk = pa.slice(i, i + 400);
    for (const r of db().prepare(`SELECT case_id FROM case_interventions WHERE id IN (${chunk.map(() => '?').join(',')})`)
      .all(...chunk) as any[]) {
      const sid = caseHv.get(r.case_id);
      if (sid) paQuaHan.set(sid, (paQuaHan.get(sid) ?? 0) + 1);
    }
  }
  const canhBao = warningsFor(sids, today);

  const info = new Map<number, { ten: string; lop: string | null }>();
  for (let i = 0; i < sids.length; i += 400) {
    const chunk = sids.slice(i, i + 400);
    for (const r of db().prepare(
      `SELECT s.id, s.full_name,
              (SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id
                WHERE e.student_id = s.id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1) AS lop
         FROM students s WHERE s.id IN (${chunk.map(() => '?').join(',')})`,
    ).all(...chunk) as any[]) info.set(r.id, { ten: r.full_name, lop: r.lop ?? null });
  }

  const rows: (DongHvCanHoTro & { _sos: number; _case: number })[] = [];
  for (const sid of sids) {
    const ev = latest.get(sid);
    const sos = ev?.sosLevel ?? 0;
    const cs = caseCua.get(sid);
    const cb = canhBao.get(sid);
    const coCanhBao = !!cb?.active;
    if (sos <= 0 && !cs && !coCanhBao) continue;
    const huyHieu = sos > 0
      ? { text: `${SOS_LABEL[sos as 1 | 2 | 3]}${ev?.provisional ? ' · tạm thời' : ''}`, tone: (sos >= 3 ? 'danger' : sos === 2 ? 'warn' : 'info') as 'info' | 'warn' | 'danger' }
      : coCanhBao ? { text: 'Ý thức', tone: 'info' as const } : null;
    const k = paQuaHan.get(sid) ?? 0;
    const phu = cs
      ? [`${cs.n} Case`, k ? `${k} PA quá hạn` : [...cs.mon].join(', ')].filter(Boolean).join(' · ')
      : coCanhBao ? `${cb!.count} vi phạm chưa xử lý` : '';
    rows.push({ studentId: sid, ten: info.get(sid)?.ten ?? 'Học viên', lop: info.get(sid)?.lop ?? null, huyHieu,
      phu: phu.length > 60 ? `${phu.slice(0, 57)}…` : phu, _sos: sos, _case: cs?.n ?? 0 });
  }
  rows.sort((a, b) => b._sos - a._sos || b._case - a._case || a.ten.localeCompare(b.ten, 'vi'));
  const out = rows.map(({ _sos, _case, ...r }) => r);
  return { rows: out, tong: out.length };
}
