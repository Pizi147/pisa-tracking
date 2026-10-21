/**
 * PHÉP KIỂM V5 · SV-SO3 (`08-ke-hoach-trien-khai.md` mục 6 + 10, `10-pta-ap-phan-hoi-cuoi.md` mục 5):
 *  · Kết quả MT của Báo cáo HV: cột theo Overall − Target của chính em, MT3+ gộp MT3 trở đi (mỗi em một lần), mẫu 0, So lượt trước, số = panel chỉ đọc;
 *  · tổng nhiều chi nhánh = Σ theo chi nhánh;
 *  · hàng HV của Học viên & Lớp (`hang`): Lộ trình · MT gần nhất của em + 5 ô · Xu hướng · Hỗ trợ · Ý thức.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrSvSo3Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const bc: any = await import('../phanTich/baoCao.ts');
  const hvl: any = await import('../classes/hocVienLop.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  console.log('\nV5 · SV-SO3 — Kết quả MT (MT0 · MT1 · MT2 · MT3+ · Thi thật), hàng HV của Học viên & Lớp');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const tuanNay = week.mondayOf(TODAY);
  const MB_FT = classId('MB FT 101');
  let seq = 0;
  /** Em mới MB FT 101, Target 6.5, lịch tự tạo bỏ; `luot(no, tuan, bands)` thêm lượt MT{no} cùng lộ trình. */
  const em = () => {
    const ten = `SVSO3 HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: MB_FT, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `svso3-${seq}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number;
    boLichTuTao(conn, cy);
    const luot = (no: number, tuan: string, bands: Record<string, number>) => {
      const a = luotThu(conn, svc.createAttempt, P.admin, { studentId: sid, cycleId: cy, classId: MB_FT, no, periodId: week.ensurePeriod(tuan).id });
      for (const [k, b] of Object.entries(bands)) {
        conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, band, nhap_dau_ngay) VALUES (?, ?, 20, 40, ?, ?)`).run(a.id, k, b, TODAY);
      }
      return a.id as number;
    };
    return { sid, cy, luot };
  };
  const DU = (b: number) => ({ listening: b, reading: b, writing1: b, writing2: b, speaking: b });
  const f = { branchId: null, ct: 'ft', tu: tuanNay, den: tuanNay };
  const kqMt = (p = P.mbManager, loc: any = f) => { xoaNho(); return bc.baoCao(p, loc).kqMt as any[]; };
  const hang = (rows: any[], l: string) => rows.find((r) => r.luot === l);

  check('SVSO3 · cột Kết quả MT theo Overall − Target (band 0.5): 6.5 Đạt · 6.0 Thiếu 0.5 · 5.5 Thiếu 1.0 · 5.0 Thiếu ≥ 1.5 · thiếu Overall Chưa đủ; MT3, MT4 → MT3+', () => {
    assert(d.cotKqMt(6.5, 6.5) === 'dat' && d.cotKqMt(7, 6.5) === 'dat' && d.cotKqMt(6, 6.5) === 'thieu-0.5' && d.cotKqMt(5.5, 6.5) === 'thieu-1.0'
      && d.cotKqMt(5, 6.5) === 'thieu-1.5' && d.cotKqMt(null, 6.5) === 'chua-du' && d.cotKqMt(6, null) === 'chua-du', 'cotKqMt');
    assert(d.luotKqMt(0) === 'mt0' && d.luotKqMt(2) === 'mt2' && d.luotKqMt(3) === 'mt3+' && d.luotKqMt(5) === 'mt3+', 'luotKqMt');
  });

  check('SVSO3 · Kết quả MT luôn đủ 5 hàng; kỳ không có lượt → mọi hàng 0 HV, mẫu 0 ("Chưa có dữ liệu"); lớp thường → null', () => {
    const xa = week.mondayOf(t.addDays(TODAY, 7 * 60));
    const r = kqMt(P.mbManager, { ...f, tu: xa, den: xa });
    assert(r.map((x) => x.luot).join() === d.LUOT_KQ_MT.join() && r.every((x) => x.hv === 0 && x.mau === 0), JSON.stringify(r));
    xoaNho();
    assert(bc.baoCao(P.mbManager, { ...f, ct: 'thuong' }).kqMt === null, 'lớp thường');
  });

  check('SVSO3 (P8) · lượt của TỪNG em: MT1 5.5 tuần trước + MT2 6.0 tuần này → MT2 Thiếu 0.5, So lượt trước ↑; em thiếu Overall → Chưa đủ, ngoài mẫu', () => thu(() => {
    const truoc = t.addDays(tuanNay, -7);
    const goc = kqMt();
    const a = em(); a.luot(1, truoc, DU(5.5)); a.luot(2, tuanNay, DU(6.0));
    const b = em(); b.luot(2, tuanNay, { listening: 6.0, reading: 6.0 });
    const r = hang(kqMt(), 'mt2'), g = hang(goc, 'mt2');
    assert(r.hv === g.hv + 2 && r.mau === g.mau + 1 && r.dem['thieu-0.5'] === g.dem['thieu-0.5'] + 1 && r.dem['chua-du'] === g.dem['chua-du'] + 1, JSON.stringify({ r, g }));
    assert(r.soTruoc.tang === g.soTruoc.tang + 1, 'so lượt trước phải tăng');
    assert(hang(kqMt(), 'mt1').hv === hang(goc, 'mt1').hv, 'MT1 tuần trước không vào kỳ tuần này');
    const p = bc.oBaoCao(P.mbManager, { ...f, o: 'kq-mt:mt2:thieu-0.5' });
    const dong = p.rows.find((x: any) => x.id === a.sid);
    assert(p.n === r.dem['thieu-0.5'] && p.rows.length === p.n && dong && /MT2 · .* · Overall 6\.0 · Target 6\.5 · so lượt trước \+0\.5/.test(dong.sub)
      && p.rows.every((x: any) => !('viec' in x)), JSON.stringify({ n: p.n, dong }));
  }));

  check('SVSO3 · MT3+ gộp: em có MT3 và MT4 cùng kỳ → MỘT lần ở MT3+, theo lượt mới nhất (MT4)', () => thu(() => {
    const goc = hang(kqMt(), 'mt3+');
    const a = em(); a.luot(3, tuanNay, DU(5.0));
    let mt4 = true;
    try { a.luot(4, tuanNay, DU(6.5)); } catch { mt4 = false; }
    const r = hang(kqMt(), 'mt3+');
    assert(r.hv === goc.hv + 1, JSON.stringify({ r, goc }));
    assert(!mt4 || r.dem.dat === goc.dem.dat + 1, 'phải lấy MT4 (Đạt), không MT3');
    xoaNho();
    const p = bc.oBaoCao(P.mbManager, { ...f, o: mt4 ? 'kq-mt:mt3+:dat' : 'kq-mt:mt3+:thieu-1.5' });
    assert(p.rows.filter((x: any) => x.id === a.sid).length === 1, 'một em một dòng');
  }));

  check('SVSO3 (T20) · Kết quả MT nhiều chi nhánh = Σ theo chi nhánh (mỗi hàng, mỗi cột)', () => {
    const loc = { ct: 'ft', tu: week.mondayOf(t.addDays(TODAY, -7 * 26)), den: tuanNay };
    const all = kqMt(P.admin, { ...loc, branchId: null });
    const cn = (conn.prepare('SELECT id FROM branches').all() as any[]).map((b) => kqMt(P.admin, { ...loc, branchId: b.id }));
    assert(all.some((x) => x.hv > 0), 'seed phải có lượt');
    for (const [i, x] of all.entries()) {
      for (const k of ['hv', 'mau'] as const) assert(x[k] === cn.reduce((s, c) => s + c[i][k], 0), `${x.luot} ${k}`);
      for (const c of d.COT_KQ_MT) assert(x.dem[c] === cn.reduce((s, y) => s + y[i].dem[c], 0), `${x.luot} ${c}`);
    }
  });

  check('SVSO3 · panel Kết quả MT: mã ô sai → 400; lớp thường → 400', () => {
    let loi = 0;
    try { bc.oBaoCao(P.mbManager, { ...f, o: 'kq-mt:mt9:dat' }); } catch { loi++; }
    try { bc.oBaoCao(P.mbManager, { ...f, ct: 'thuong', o: 'kq-mt:mt2:dat' }); } catch { loi++; }
    assert(loi === 2, `${loi}`);
  });

  check('SVSO3 · hàng HV (khu d): Lộ trình MT2/n + Target · MT gần nhất CỦA EM (Overall / KV, tuần, L R W1 W2 S) · Xu hướng +0.5 so MT1 · Hỗ trợ · Ý thức', () => thu(() => {
    const truoc = t.addDays(tuanNay, -7);
    const a = em(); a.luot(1, truoc, DU(5.5)); a.luot(2, tuanNay, { ...DU(6.0), writing1: 5.5, writing2: 6.5 });
    xoaNho();
    const h = hvl.danhSachHocVienLop(P.mbManager, {}).hocVien.find((x: any) => x.id === a.sid)?.hang;
    assert(h && h.loTrinh.mt === 2 && h.loTrinh.soMt >= 2 && h.loTrinh.target === 6.5 && !h.loTrinh.kck, JSON.stringify(h?.loTrinh));
    assert(h.mtGan?.mt === 2 && h.mtGan.tuan === tuanNay && h.mtGan.ovr === 6.0 && h.mtGan.kyVong === 6.0
      && h.mtGan.kn.W1 === 5.5 && h.mtGan.kn.W2 === 6.5 && h.mtGan.kn.L === 6.0, JSON.stringify(h.mtGan));
    assert(h.xuHuong?.lech === 0.5 && h.xuHuong.soMt === 1, JSON.stringify(h.xuHuong));
    assert(h.hoTro.sos === null && h.hoTro.soCase === 0 && h.yThuc === null, JSON.stringify(h.hoTro));
    const thuong = hvl.danhSachHocVienLop(P.mbManager, {}).hocVien.filter((x: any) => x.khung === 'thuong');
    assert(thuong.every((x: any) => !x.hang), 'lớp thường không có hang');
  }));
}
