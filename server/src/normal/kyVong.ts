import { THAM_SO_TOI_DA, chenNhieuDong, db, theoLo, tx } from '../db.ts';
import {
  NGUONG_KY_VONG, PERMISSIONS, REGULAR_SKILLS, caseDedupKey, categoryOf, goiYKyVong, kyNangLopDich, programmeOf, tenMon, tenMonNgan, weeklyUpdateDue,
  type GoiYKyVong, type RegularSkill,
} from '../../../shared/domain/index.ts';
import { badRequest, chuTuDo, forbidden, notFound, nowIso } from '../util.ts';
import { can, classScopeSql, scopeFor, type Principal, type Scope } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { writeAudit } from '../platform/audit.ts';
import { dongBoTrangThaiCaseLo } from '../cases/sosState.ts';
import { suggestCaseOwner } from '../cases/owner.ts';
import { chenPa, type DongPa } from '../cases/taoPa.ts';
import { phanCongDangHieuLuc } from '../worklist/scoreDebt.ts';
import { assessedBands } from '../fasttrack/scoring.ts';

/**
 * KỲ VỌNG ĐẦU RA CẢ LỚP (PR-KV, đặc tả 08/10 §3, mockup cuối khoá 2 phần 3) — em BE/ELE có quyết định Lên FT. Đạt = Overall MT0 ≥ ngưỡng
 * (`goiYKyVong`). MỘT việc Quản lý mỗi lớp nguồn khi lớp có em đủ điểm MT0; kết luận ghi ở `lo_trinh_tiep_theo` (em × lớp nguồn).
 * Em đã sang FT → Case ngay (`taoCaseKyVong`); chưa sang → lúc thi hành (`sauChuyenCuoiKhoa`). Mọi đọc / ghi theo lô (Turso).
 */

type KetLuan = { dat: boolean; nguyenNhan: 'trung_tam' | 'hoc_sinh' | null; mon: string[]; ghiChu: string | null };
type EmKyVong = {
  id: number; ma: string; ten: string; lopId: number; lopCode: string; ct: string; daChuyen: boolean; lopFtId: number | null; lopFt: string | null;
  /** Band MT0 + Overall; null = MT0 chưa đủ 4 kỹ năng ("Chờ MT0"). */
  mt0: (Record<RegularSkill, number> & { overall: number }) | null;
  goiY: GoiYKyVong | null; ketLuan: KetLuan | null;
};

const jsonMang = (s: string | null): string[] => { try { const v = JSON.parse(s ?? '[]'); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } };

/** Em có lệnh Lên FT (chờ / đã chuyển) từ lớp BE/ELE trong phạm vi `sc` (hoặc đúng lớp `classId`) + MT0 + kết luận — 3 câu mỗi lô. */
function emKyVong(o: { sc?: Scope; branchId?: number | null; classId?: number }): EmKyVong[] {
  const conn = db();
  const cs = o.sc ? classScopeSql(o.sc) : { sql: '1=1', params: [] };
  const rows = conn.prepare(
    `SELECT l.student_id, s.full_name, s.student_code, l.lop_nguon_id, c.code, c.programme_code, l.lop_dich_id, cd.code AS dich_code, l.trang_thai,
            lt.ky_vong_dat, lt.ky_vong_nguyen_nhan, lt.ky_vong_mon, lt.ky_vong_ghi_chu, MAX(l.id) AS lenh
       FROM lenh_chuyen_lop l
       JOIN classes c ON c.id = l.lop_nguon_id LEFT JOIN classes cd ON cd.id = l.lop_dich_id JOIN students s ON s.id = l.student_id
       LEFT JOIN lo_trinh_tiep_theo lt ON lt.student_id = l.student_id AND lt.class_id = l.lop_nguon_id
      WHERE l.huong = 'fast_track' AND l.trang_thai IN ('cho', 'da_chuyen') AND c.programme_code IN ('BE', 'ELE') AND ${HV_DANG_HOC_SQL('s')}
        AND ${cs.sql}${o.branchId ? ' AND c.branch_id = ?' : ''}${o.classId ? ' AND l.lop_nguon_id = ?' : ''}
      GROUP BY l.student_id`,
  ).all(...cs.params, ...(o.branchId ? [o.branchId] : []), ...(o.classId ? [o.classId] : [])) as any[];
  const mt0 = mt0TheoLop(rows.map((r) => ({ sid: r.student_id, lop: r.lop_nguon_id, ct: r.programme_code })));
  return rows.map((r) => {
    const { bands, goiY } = mt0.get(r.student_id)!;
    return {
      id: r.student_id, ma: r.student_code, ten: r.full_name, lopId: r.lop_nguon_id, lopCode: r.code, ct: r.programme_code,
      daChuyen: r.trang_thai === 'da_chuyen', lopFtId: r.lop_dich_id, lopFt: r.dich_code,
      mt0: goiY ? { ...(bands as Record<RegularSkill, number>), overall: goiY.overall } : null, goiY,
      ketLuan: r.ky_vong_dat === null ? null
        : { dat: !!r.ky_vong_dat, nguyenNhan: r.ky_vong_nguyen_nhan ?? null, mon: jsonMang(r.ky_vong_mon), ghiChu: r.ky_vong_ghi_chu ?? null },
    };
  }).sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
}

/**
 * MT0 chưa huỷ của em ở LỚP NGUỒN BE/ELE (MT0 giữ `class_id` lớp thường khi nối vào lộ trình FT) + band + gợi ý — 2 câu mỗi lô.
 * Dùng chung cho panel, việc QL và hồ sơ HV (`ghiKetLuanFt`, hộp Kết luận khoá).
 */
export function mt0TheoLop(ds: readonly { sid: number; lop: number; ct: string | null }[]): Map<number, { bands: Record<RegularSkill, number | null>; goiY: GoiYKyVong | null }> {
  const conn = db();
  const nguonCua = new Map(ds.map((x) => [x.sid, x]));
  const mt0Cua = new Map<number, number>();
  theoLo([...nguonCua.keys()], (lo, ph) => {
    for (const a of conn.prepare(`SELECT id, student_id, class_id FROM assessment_attempts WHERE kind = 'mt0' AND status != 'cancelled' AND student_id IN (${ph}) ORDER BY id`)
      .all(...lo) as any[]) if (nguonCua.get(a.student_id)?.lop === a.class_id) mt0Cua.set(a.student_id, a.id);
  });
  const diem = new Map<number, Record<string, number | null>>();
  theoLo([...mt0Cua.values()], (lo, ph) => {
    for (const s of conn.prepare(`SELECT attempt_id, skill, band FROM assessment_scores WHERE attempt_id IN (${ph})`).all(...lo) as any[]) {
      diem.set(s.attempt_id, { ...diem.get(s.attempt_id), [s.skill]: s.band });
    }
  });
  return new Map(ds.map((x) => {
    const m = mt0Cua.get(x.sid);
    const bands = assessedBands((m ? diem.get(m) : null) ?? {}) as Record<RegularSkill, number | null>;
    return [x.sid, { bands, goiY: goiYKyVong(x.ct, bands) }];
  }));
}

type LopKyVong = { classId: number; code: string; chua: number[]; choMt0: number };

/**
 * Việc QL "Kỳ vọng đầu ra · lớp · n em" (`myWork`) và chỉ số `hv-len-ft-chua-ky-vong` — CÙNG một tập: lớp có ít nhất một em đủ điểm MT0 và còn em
 * chưa kết luận (`chua`, kể cả em "Chờ MT0" — dòng còn tới khi hết em). Phạm vi `request.approve`. Nhớ trong request.
 */
export function lopKyVong(p: Principal, branchId: number | null): LopKyVong[] {
  return nho(`ky-vong:${p.userId}:${branchId ?? ''}`, () => {
    const sc = scopeFor(p, PERMISSIONS.REQUEST_APPROVE);
    if (sc.none) return [];
    const theoLop = new Map<number, EmKyVong[]>();
    for (const e of emKyVong({ sc, branchId })) theoLop.set(e.lopId, [...(theoLop.get(e.lopId) ?? []), e]);
    return [...theoLop.values()].flatMap((ds) => {
      const chua = ds.filter((e) => !e.ketLuan);
      if (!chua.length || !ds.some((e) => e.mt0)) return [];
      return [{ classId: ds[0].lopId, code: ds[0].lopCode, chua: chua.map((e) => e.id), choMt0: chua.filter((e) => !e.mt0).length }];
    }).sort((a, b) => a.code.localeCompare(b.code, 'vi'));
  });
}

/** Lớp nguồn BE/ELE + quyền Quản lý (`request.approve` ở lớp đó). */
function lopNguon(p: Principal, classId: number): { id: number; code: string; ct: string } {
  const c = db().prepare('SELECT id, code, programme_code FROM classes WHERE id = ?').get(classId) as any;
  if (!c) throw notFound('Không tìm thấy lớp.');
  if (!can(p, PERMISSIONS.REQUEST_APPROVE, { classId })) throw forbidden('Chỉ Quản lý mới đánh dấu được kỳ vọng đầu ra.');
  const ct = programmeOf(c.programme_code);
  if (!ct || NGUONG_KY_VONG[ct] === undefined) throw badRequest('Chỉ lớp BE/ELE mới có kỳ vọng đầu ra.');
  return { id: c.id, code: c.code, ct };
}

/** GET panel: em của lớp + ngưỡng + lớp FT + GV cũ từng kỹ năng (khối "Lưu sẽ"). */
export function panelKyVong(p: Principal, classId: number) {
  const lop = lopNguon(p, classId);
  const em = emKyVong({ classId });
  const gv = phanCongDangHieuLuc([classId], demoToday());
  return {
    lop, nguong: NGUONG_KY_VONG[lop.ct], em,
    lopFt: [...new Set(em.flatMap((e) => (e.lopFt ? [e.lopFt] : [])))].sort(),
    gvCu: Object.fromEntries(REGULAR_SKILLS.map((k) => [k, gv.get(`${classId}|${k}`)?.ten ?? null])) as Record<RegularSkill, string | null>,
  };
}

/** Một dòng đã kiểm của "Lưu" (panel) hoặc hồ sơ HV (`ghiKetLuanFt`). */
export type DongKyVong = { sid: number; dat: boolean; nguyenNhan: 'trung_tam' | 'hoc_sinh' | null; mon: RegularSkill[]; lyDo: string | null };

/** Kiểm một dòng thân yêu cầu — lỗi nói tên em. */
export function kiemDongKyVong(x: any, ten: string): DongKyVong {
  if (typeof x?.dat !== 'boolean') throw badRequest(`${ten}: chọn Đạt hoặc Không đạt.`);
  if (x.dat) return { sid: Number(x.sid), dat: true, nguyenNhan: null, mon: [], lyDo: null };
  if (x.nguyenNhan !== 'trung_tam' && x.nguyenNhan !== 'hoc_sinh') throw badRequest(`${ten}: chọn Trung tâm hoặc Học viên.`);
  const mon = Array.isArray(x.mon) ? [...new Set((x.mon as unknown[]).map(String))] : [];
  if (mon.some((m) => !(REGULAR_SKILLS as readonly string[]).includes(m))) throw badRequest(`${ten}: kỹ năng không hợp lệ.`);
  if (!mon.length) throw badRequest(`${ten}: chọn kỹ năng chưa đạt.`);
  const lyDo = chuTuDo(x.lyDo ?? null, `${ten} · Lý do`, 2000);
  if (x.nguyenNhan === 'hoc_sinh' && !lyDo) throw badRequest(`${ten}: ghi lý do.`);
  return { sid: Number(x.sid), dat: false, nguyenNhan: x.nguyenNhan, mon: mon as RegularSkill[], lyDo: x.nguyenNhan === 'hoc_sinh' ? lyDo : null };
}

/**
 * PUT "Lưu · n em" — MỘT tx: ghi kết luận cả lô (`lo_trinh_tiep_theo`) rồi tạo Case cho em đã sang FT. Em phải thuộc lớp và đủ điểm MT0.
 * Đổi kết luận sau khi đã tạo Case → Case cũ GIỮ (người phụ trách tự xử lý), không tạo trùng.
 */
export function luuKyVong(p: Principal, classId: number, body: any): { luu: number; taoCase: number } {
  const lop = lopNguon(p, classId);
  const vao: any[] = Array.isArray(body?.dong) ? body.dong : [];
  if (!vao.length) throw badRequest('Chưa có em nào để lưu.');
  if (vao.length > 500) throw badRequest('Tối đa 500 em một lần lưu.');
  const em = new Map(emKyVong({ classId }).map((e) => [e.id, e]));
  const dong = [...new Map(vao.map((x) => {
    const e = em.get(Number(x?.sid));
    if (!e) throw badRequest('Học viên không có quyết định Lên FT ở lớp này.');
    if (!e.mt0) throw badRequest(`${e.ten}: chờ MT0 đủ điểm.`);
    /* Học viên không gửi kỹ năng → kỹ năng MT0 dưới ngưỡng; vẫn rỗng (MT0 không kỹ năng nào dưới ngưỡng) → 400 "chọn kỹ năng". */
    const thieu = x?.nguyenNhan === 'hoc_sinh' && !(Array.isArray(x.mon) && x.mon.length);
    return [e.id, kiemDongKyVong(thieu ? { ...x, mon: e.goiY!.monTruot } : x, e.ten)] as const;
  })).values()];
  return tx(() => {
    const now = nowIso();
    chenNhieuDong(
      'INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, ky_vong_dat, ky_vong_nguyen_nhan, ky_vong_mon, ky_vong_ghi_chu, updated_by, created_at, updated_at)',
      dong.map((d) => [d.sid, classId, 'chua_quyet', d.dat ? 1 : 0, d.nguyenNhan, d.mon.length ? JSON.stringify(d.mon) : null, d.lyDo, p.userId, now, now]),
      ` ON CONFLICT(student_id, class_id) DO UPDATE SET ky_vong_dat = excluded.ky_vong_dat, ky_vong_nguyen_nhan = excluded.ky_vong_nguyen_nhan,
         ky_vong_mon = excluded.ky_vong_mon, ky_vong_ghi_chu = excluded.ky_vong_ghi_chu, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    );
    const taoCase = taoCaseKyVong(p, emDaSangFt(dong.filter((d) => !d.dat && em.get(d.sid)!.daChuyen && em.get(d.sid)!.lopFtId).map((d) => ({ ...d, fromClassId: classId, ftClassId: em.get(d.sid)!.lopFtId! }))));
    writeAudit({ actorUserId: p.userId, action: 'cuoi_khoa.ky_vong_lop', entityType: 'class', entityId: classId, entityLabel: lop.code,
      after: { dat: dong.filter((d) => d.dat).length, khongDat: dong.filter((d) => !d.dat).length, taoCase } });
    return { luu: dong.length, taoCase };
  });
}

export type DongCaseKyVong = DongKyVong & { fromClassId: number; ftClassId: number; ftCycleId: number; ngay: string };

/** Gắn lộ trình FT đang chạy (một câu mỗi lô); em chưa có lộ trình FT bỏ qua. */
export function emDaSangFt(ds: readonly (DongKyVong & { fromClassId: number; ftClassId: number })[]): DongCaseKyVong[] {
  const ngay = demoToday();
  const cyc = new Map<number, number>();
  theoLo(ds.map((d) => d.sid), (lo, ph) => {
    for (const r of db().prepare(`SELECT id, student_id FROM learning_cycles WHERE status = 'active' AND route IS NOT NULL AND student_id IN (${ph})`).all(...lo) as any[]) cyc.set(r.student_id, r.id);
  });
  return ds.flatMap((d) => (cyc.has(d.sid) ? [{ ...d, ftCycleId: cyc.get(d.sid)!, ngay }] : []));
}

const MO_TA_TUTOR = 'Tutor 10 buổi/kỹ năng · tính vào buổi Free, có lương GV';

/**
 * Case "Kỳ vọng đầu ra chưa đạt…" ở lộ trình FT (T49, §3) — THEO LÔ, trong tx nơi gọi. Trung tâm: mỗi kỹ năng một Case + PA Tutor 10 buổi
 * (`chenPa`; Người dạy = GV cũ dạy kỹ năng đó ở lớp BE/ELE, hết phân công → trống; việc Kết quả theo `nguoiGiuKetQua` = GVBM Case). Học viên: MỘT Case,
 * không PA (Quản lý thêm sau). Chủ Case = GVBM kỹ năng đó ở lớp FT (`suggestCaseOwner`). Một lần cho mỗi (lộ trình, kỹ năng) — đã có Case "Kỳ vọng
 * đầu ra…" bất kỳ trạng thái thì không tạo lại; Case đang mở cùng khoá (vd Case Mock) thì giữ, không gắn PA. Trả số Case mới.
 */
export function taoCaseKyVong(p: Principal, ds: readonly DongCaseKyVong[]): number {
  if (!ds.length) return 0;
  const conn = db();
  const daCo = new Set<string>(), emDaCo = new Set<string>();
  theoLo([...new Set(ds.map((d) => d.sid))], (lo, ph) => {
    for (const r of conn.prepare(`SELECT student_id, cycle_id, category FROM sos_cases WHERE origin_kind = 'chuyen_cap' AND title LIKE 'Kỳ vọng đầu ra%' AND student_id IN (${ph})`)
      .all(...lo) as any[]) { daCo.add(`${r.student_id}:${r.cycle_id}:${r.category}`); emDaCo.add(`${r.student_id}:${r.cycle_id}`); }
  });
  type O = { d: DongCaseKyVong; mon: RegularSkill; skill: string; category: string; khoa: string; title: string };
  const o: O[] = ds.flatMap((d) => {
    /* Mọi đường ghi đều bắt ít nhất một kỹ năng (`kiemDongKyVong`); dòng ghi trước PR-KV có thể rỗng → không có kỹ năng để mở Case. */
    const mon = d.nguyenNhan === 'hoc_sinh' ? d.mon.slice(0, 1) : d.mon;
    if (d.nguyenNhan === 'hoc_sinh' && emDaCo.has(`${d.sid}:${d.ftCycleId}`)) return [];
    return mon.flatMap((m) => {
      const skill = kyNangLopDich(m, true), category = categoryOf(skill) ?? skill;
      if (daCo.has(`${d.sid}:${d.ftCycleId}:${category}`)) return [];
      const title = d.nguyenNhan === 'hoc_sinh'
        ? `Kỳ vọng đầu ra chưa đạt · Học viên · ${d.mon.map((x) => tenMonNgan(null, x)).join(', ')}`
        : `Kỳ vọng đầu ra chưa đạt · ${tenMon(null, skill)}`;
      return [{ d, mon: m, skill, category, khoa: caseDedupKey({ category: category as any, studentId: d.sid, cycleId: d.ftCycleId })!, title }];
    });
  });
  if (!o.length) return 0;
  /* Khoá chống trùng: Case đang mở → giữ (bỏ qua); Case đã đóng → nhả khoá, Case mới nối `previous_case_id` (hiếm — từng câu). */
  const coSan = new Map<string, { id: number; status: string }>();
  theoLo(o.map((y) => y.khoa), (lo, ph) => {
    for (const r of conn.prepare(`SELECT id, status, dedup_key FROM sos_cases WHERE dedup_key IN (${ph})`).all(...lo) as any[]) coSan.set(r.dedup_key, { id: r.id, status: r.status });
  });
  const moi = o.filter((y) => !coSan.has(y.khoa) || coSan.get(y.khoa)!.status === 'done');
  for (const y of moi) if (coSan.has(y.khoa)) conn.prepare('UPDATE sos_cases SET dedup_key = NULL, updated_at = ? WHERE id = ?').run(nowIso(), coSan.get(y.khoa)!.id);
  if (!moi.length) return 0;
  const chu = new Map<string, number | null>();
  const chuCase = (classId: number, category: string) => {
    const k = `${classId}:${category}`;
    if (!chu.has(k)) chu.set(k, suggestCaseOwner({ classId, category }));
    return chu.get(k)!;
  };
  const caseCua = new Map<string, number>();
  const COT = 13;
  theoLo(moi, (lo) => {
    const rows = lo.map((y) => [null, y.d.sid, y.d.ftCycleId, y.skill, y.category, 'chuyen_cap', y.d.ngay, 'in_progress', y.khoa, y.title,
      coSan.get(y.khoa)?.id ?? null, chuCase(y.d.ftClassId, y.category), nowIso()]);
    for (const r of conn.prepare(
      `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, topic, category, origin_kind, detected_at, status, dedup_key, title, previous_case_id, owner_user_id, created_at)
       VALUES ${rows.map(() => `(${Array(COT).fill('?').join(',')})`).join(',')} RETURNING id, dedup_key`,
    ).all(...rows.flat()) as any[]) caseCua.set(r.dedup_key, Number(r.id));
  }, Math.floor(THAM_SO_TOI_DA / COT));
  const gvCu = new Map<string, Map<string, { userId: number }>>();
  for (const ng of new Set(moi.map((y) => y.d.ngay))) gvCu.set(ng, phanCongDangHieuLuc([...new Set(moi.map((y) => y.d.fromClassId))], ng));
  const pa: DongPa[] = [], moc: unknown[][] = [];
  for (const y of moi) {
    const caseId = caseCua.get(y.khoa)!, tt = y.d.nguyenNhan === 'trung_tam';
    if (tt) {
      pa.push({
        caseId, kind: 'tutor', description: MO_TA_TUTOR, soBuoi: 10, performerUserId: gvCu.get(y.d.ngay)?.get(`${y.d.fromClassId}|${y.mon}`)?.userId ?? null,
        recordedBy: p.userId, status: 'started', startedDate: y.d.ngay, confirmedBy: p.userId, confirmedAt: nowIso(),
        cycleStartedOn: y.d.ngay, actionDue: weeklyUpdateDue(y.d.ngay),
      });
    }
    moc.push([caseId, 'opened', y.d.ngay, tt ? 'Kỳ vọng đầu ra chưa đạt (Trung tâm) — Tutor 10 buổi' : `Kỳ vọng đầu ra chưa đạt (Học viên) — ${y.d.lyDo ?? ''}`,
      p.userId, nowIso(), `ky-vong:${caseId}`]);
  }
  chenPa(conn, pa);
  chenNhieuDong('INSERT OR IGNORE INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at, dedup_key)', moc);
  dongBoTrangThaiCaseLo([...caseCua.values()]);
  return moi.length;
}
