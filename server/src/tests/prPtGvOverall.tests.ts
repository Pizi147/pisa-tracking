/**
 * PHÉP KIỂM V5 · Phân tích GV theo Overall (brief V5 mục 3 C08–C10, C20; mục 15; tình huống T06, T07, T08, T19 — `05-tu-dien-chi-so.md` mục 2):
 *  · MT: Overall lượt ≥ kỳ vọng → kỹ năng dưới kỳ vọng vẫn tính Đạt cho GV (điểm thật vẫn hiện) · Overall chưa đạt → xét từng kỹ năng ·
 *    Overall thiếu → ra khỏi mẫu (Chưa đủ dữ liệu);
 *  · Thi thật: Overall so Target, gán GV dạy kỹ năng đó ở lớp cuối trước ngày thi;
 *  · ô không màu ngưỡng; mẫu 0 → "Chưa có dữ liệu";
 *  · C20: không còn chỉ số / việc "HV FT xong MT3, chưa có MT kế tiếp"; QL vẫn thêm MT4 tay.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrPtGvOverallTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const pt: any = await import('../phanTich/giaoVien.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const bc: any = await import('../phanTich/baoCao.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  console.log('\nV5 · Phân tích GV theo Overall (C09, C10), không màu ngưỡng (C08), bỏ gợi ý MT4 (C20)');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const D = TODAY;
  const tuanNay = week.mondayOf(D);
  const MB_FT = classId('MB FT 101');
  let seq = 0;
  /** Em mới MB FT 101, Target 6.5 → MT1 kỳ vọng 5.5. */
  const emMoi = () => {
    const ten = `V5GV HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: MB_FT, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `v5gv-${seq}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number;
    return { sid, cy };
  };
  const mt1 = (bands: Record<string, number>) => {
    const e = emMoi();
    boLichTuTao(conn, e.cy);
    const a = luotThu(conn, svc.createAttempt, P.admin, { studentId: e.sid, cycleId: e.cy, classId: MB_FT, no: 1, periodId: week.ensurePeriod(tuanNay).id });
    for (const [k, b] of Object.entries(bands)) {
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, band, nhap_dau_ngay) VALUES (?, ?, 20, 40, ?, ?)`).run(a.id, k, b, D);
    }
    return e;
  };
  /** Kết luận của em ở cột kỹ năng (panel mọi GV có số) — 'Đạt' | 'Chưa đạt' | null (ngoài mẫu) + dòng phụ. */
  const ketQuaEm = (sid: number, skill: string) => {
    xoaNho();
    const b = pt.phanTichGiaoVien(P.mbManager, { ct: 'ft', tu: tuanNay, den: tuanNay });
    for (const h of b.hang.filter((x: any) => x.ketQua[skill]?.k === 'so')) {
      const r = pt.oChiSoGv(P.mbManager, { ct: 'ft', tu: tuanNay, den: tuanNay, gv: h.id, cot: `ket-qua:${skill}` });
      const dong = r.rows.find((x: any) => x.href === `/hoc-vien/${sid}`);
      if (dong) return { kq: dong.sub.endsWith('Chưa đạt') ? 'Chưa đạt' : 'Đạt', sub: dong.sub as string, gv: h.id as number };
    }
    return null;
  };

  let gvR: number | null = null;   // người dạy R của MB FT 101 tuần này (từ T06) — thi thật cùng ngày phải gán cùng người
  check('V5GV (T06) · MT1 Overall 6.0 ≥ kỳ vọng 5.5, R 5.0 → R tính Đạt cho GV R; panel vẫn ghi "R 5.0"', () => thu(() => {
    const e = mt1({ listening: 6.5, reading: 5.0, writing1: 6.5, writing2: 6.5, speaking: 6.5 });
    const r = ketQuaEm(e.sid, 'reading');
    gvR = r?.gv ?? null;
    assert(r?.kq === 'Đạt', JSON.stringify(r));
    assert(r!.sub.includes('R 5.0') && r!.sub.includes('Overall 6.0'), r!.sub);
  }));
  check('V5GV (T07) · MT1 Overall 5.0 < 5.5: R 5.0 → Chưa đạt; S 5.5 → Đạt (xét từng kỹ năng)', () => thu(() => {
    const e = mt1({ listening: 5.0, reading: 5.0, writing1: 5.0, writing2: 5.0, speaking: 5.5 });
    assert(ketQuaEm(e.sid, 'reading')?.kq === 'Chưa đạt', 'R');
    assert(ketQuaEm(e.sid, 'speaking')?.kq === 'Đạt', 'S');
  }));
  check('V5GV (T08) · chưa đủ 4 kỹ năng (thiếu Overall) → em ra khỏi mẫu mọi cột kết quả', () => thu(() => {
    const e = mt1({ listening: 4.0, reading: 7.0 });
    assert(ketQuaEm(e.sid, 'reading') === null && ketQuaEm(e.sid, 'listening') === null, 'không vào mẫu');
  }));
  check('V5GV (thi thật) · Overall 6.5 = Target → R 5.5 Đạt; Overall 6.0 < Target → R 5.5 Chưa đạt, L 7.0 Đạt; gán GV dạy kỹ năng ở lớp lúc thi', () => thu(() => {
    const thi = (o: number, kq: string, l: number, r: number, w: number, s: number) => {
      const e = emMoi();
      boLichTuTao(conn, e.cy);
      conn.prepare(`UPDATE learning_cycles SET thi_that_ngay = ?, thi_that_l = ?, thi_that_r = ?, thi_that_w = ?, thi_that_s = ?, outcome_score = ?, outcome = ? WHERE id = ?`)
        .run(D, l, r, w, s, o, kq, e.cy);
      return e;
    };
    const dat = thi(6.5, 'reached', 7.0, 5.5, 6.5, 7.0);
    const chua = thi(6.0, 'not_reached', 7.0, 5.5, 5.5, 6.0);
    const r1 = ketQuaEm(dat.sid, 'reading');
    assert(r1?.kq === 'Đạt' && r1.sub.includes('Thi thật') && r1.gv === gvR, JSON.stringify({ r1, gvR }));
    assert(ketQuaEm(chua.sid, 'reading')?.kq === 'Chưa đạt' && ketQuaEm(chua.sid, 'listening')?.kq === 'Đạt', 'chưa đạt Target');
    assert(ketQuaEm(chua.sid, 'writing2')?.kq === 'Chưa đạt', 'W thi thật tính cho GV W2');
  }));
  /* 10 (22/10): bỏ chữ "mẫu nhỏ" ở Phân tích GV — mẫu < 5 vẫn ghi %. */
  check('V5GV (T19, C08) · mẫu 0 → "Chưa có dữ liệu"; mẫu < 5 vẫn ghi % (không "mẫu nhỏ"); không còn hàm màu ngưỡng', () => {
    assert(d.chuOPtGv({ k: 'rong' }).phu === 'Chưa có dữ liệu', d.chuOPtGv({ k: 'rong' }).phu);
    assert(d.chuOPtGv({ k: 'so', dung: 3, tong: 4 }).phu === '75%' && d.chuOPtGv({ k: 'so', dung: 18, tong: 20 }).phu === '90%', '%');
    assert(d.mauKetQuaGv === undefined, 'mauKetQuaGv còn');
  });
  check('V5GV (C20, T04) · không còn chỉ số "FT xong MT3, chưa MT kế" ở Cần xử lý / Báo cáo / bảng chi nhánh; QL vẫn thêm MT4 tay', () => thu(() => {
    const id = 'hv-ft-xong-mt-cuoi-chua-mt-ke';
    assert(!d.CAN_XU_LY.some((x: any) => x.metricId === id) && !d.METRICS.some((x: any) => x.id === id), 'còn trong danh mục');
    assert(!('chuaLich' in bc.baoCao(P.mbManager, { tu: tuanNay, den: D, ct: 'ft' }).chuY), 'Báo cáo còn chuaLich');
    const e = emMoi();
    boLichTuTao(conn, e.cy);
    const a4 = luotThu(conn, svc.createAttempt, P.mbManager, { studentId: e.sid, cycleId: e.cy, classId: MB_FT, no: 4, periodId: week.ensurePeriod(tuanNay).id });
    assert(a4?.id && get('SELECT attempt_no FROM assessment_attempts WHERE id = ?', a4.id).attempt_no === 4, 'MT4 tay');
  }));
}
