/** PHÉP KIỂM PR-MT — lịch MT tự tạo, MT lịch sử, đánh số liền mạch, RF, dời do vắng. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrMtTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-MT · Lịch MT tự tạo, MT lịch sử, đánh số, RF, dời do vắng');

  check('PR-MT (1) · lichMtMacDinh LT1/LT2/RF/null + tuanHocCuaMt ngoài lịch (M1, Q1)', () => {
    const j = (x: unknown) => JSON.stringify(x);
    assert(j(d.lichMtMacDinh('LT1')) === '[6,12,16]' && j(d.lichMtMacDinh('LT2')) === '[6,12,16]', 'LT');
    assert(j(d.lichMtMacDinh('RF')) === '[4,8]' && j(d.lichMtMacDinh(null)) === '[]', 'RF / lớp thường');
    assert(d.tuanHocCuaMt('RF', 3) === 12 && d.tuanHocCuaMt('LT1', 4) === 20 && d.tuanHocCuaMt('LT1', 6) === 28, 'ngoài lịch mặc định');
    assert(d.LUAT_LO_TRINH_HIEN.RF.lichMt === 'Tuần 4 · 8' && d.LUAT_LO_TRINH_HIEN.LT1.lichMt === 'Tuần 6 · 12 · 16', 'một nguồn (K1-49)');
  });
  check('PR-MT (1) · laLichSu so CN tuần thi với ngày tạo; trongCuaSoCase biên đúng 28 ngày (T34, M4)', () => {
    assert(d.laLichSu('2026-09-20', '2026-09-21') === true, 'CN 20/09 < 21/09');
    assert(d.laLichSu('2026-09-20', '2026-09-20') === false, 'cùng ngày: chưa qua');
    assert(d.trongCuaSoCase('2026-08-24', '2026-09-21') === true, 'đúng 28 ngày: trong');
    assert(d.trongCuaSoCase('2026-08-23', '2026-09-21') === false, '29 ngày: ngoài');
    assert(d.luotSinhViec({ lich_su: 0, tuanKetThuc: null, created_at: '2026-09-21' }), 'lượt thường luôn sinh việc');
    assert(!d.luotSinhViec({ lich_su: 1, tuanKetThuc: '2026-07-05', created_at: '2026-09-21' }), 'lịch sử ngoài cửa sổ');
    assert(d.luotSinhViec({ lich_su: 1, tuanKetThuc: '2026-09-13', created_at: '2026-09-21' }), 'lịch sử trong cửa sổ');
  });
  check('PR-MT (1) · kiemSoMtMoi / soMtKeTiep: liền mạch, số huỷ không điểm dùng lại, huỷ còn điểm giữ số (T36, Q-B)', () => {
    const L = (attempt_no: number, status = 'planned', coDiem = false) => ({ attempt_no, status, coDiem });
    assert(d.kiemSoMtMoi([], 1) === null && d.soMtKeTiep([]) === 1, 'MT1 khi rỗng');
    assert(/Chưa có MT2/.test(d.kiemSoMtMoi([L(1)], 3) ?? ''), 'MT3 khi mới có MT1');
    assert(d.kiemSoMtMoi([L(1), L(2, 'cancelled')], 2) === null && d.soMtKeTiep([L(1), L(2, 'cancelled')]) === 2, 'MT2 huỷ không điểm → dùng lại');
    assert(/không dùng lại/.test(d.kiemSoMtMoi([L(1), L(2, 'cancelled', true)], 2) ?? ''), 'MT2 huỷ còn điểm → chặn');
    assert(d.soMtKeTiep([L(1), L(2, 'cancelled', true)]) === 3, 'huỷ còn điểm giữ số');
    assert(/đã có MT1/.test(d.kiemSoMtMoi([L(1)], 1) ?? ''), 'trùng');
    assert(d.kiemSoMtMoi([], 0) === 'Số MT không hợp lệ.', 'số 0');
  });
  check('PR-MT (1) · cachHuyLuot: lớn nhất chưa điểm → cả lượt; có điểm / ở giữa → phần còn lại (M-12)', () => {
    const L = (attempt_no: number, status = 'planned', coDiem = false) => ({ attempt_no, status, coDiem });
    const ds = [L(1, 'completed', true), L(2), L(3)];
    assert(d.cachHuyLuot(ds[2], ds) === 'ca-luot', 'MT3 lớn nhất chưa điểm');
    assert(d.cachHuyLuot(ds[1], ds) === 'phan-con-lai', 'MT2 ở giữa');
    const ds2 = [L(1), L(2, 'planned', true)];
    assert(d.cachHuyLuot(ds2[1], ds2) === 'phan-con-lai', 'lớn nhất có điểm');
    assert(d.cachHuyLuot(L(2, 'cancelled'), ds) === null, 'đã huỷ');
  });
  check('PR-MT (1) · hanDuyetDoiLan2 = CN tuần chứa ngày gửi (T42, K4-04)', () => {
    assert(d.hanDuyetDoiLan2('2026-09-28') === '2026-10-04', d.hanDuyetDoiLan2('2026-09-28'));
    assert(d.hanDuyetDoiLan2('2026-10-04') === '2026-10-04', 'CN → chính nó');
  });
  check('PR-MT (1) · kỳ vọng RF = target; PA quy chế hàng MT3, Phối hợp hàng MT4 (M2, T4, Q27-4)', () => {
    assert(d.expectationDelta(1, 'RF') === 0 && d.expectationDelta(2, 'RF') === 0, 'RF');
    assert(d.expectationDelta(1, 'LT1') === 1 && d.expectationDelta(1) === 1 && d.expectationDelta(2, null) === 0.5, 'LT giữ');
    const pa = d.academicSupportFor(1, 2, 'RF');
    assert(pa?.kind === 'tutor' && pa.span === 'until_exam' && pa.description === 'Tutor · đến lúc thi', JSON.stringify(pa));
    assert(d.academicSupportFor(1, 2)?.span === 'one_month', 'LT MT1 giữ Tự học');
    assert(JSON.stringify(d.sosCoordinationFor(1, 3, 'RF')) === JSON.stringify(d.DEFAULT_SOS_COORDINATION[4][3]), 'Phối hợp hàng 4');
  });
  check('PR-MT (1) · mocKeTiep: planned, không lịch sử, từ tuần này, sớm nhất (K2-05, K2-31)', () => {
    const M = (attempt_no: number, weekStart: string, lich_su = 0, status = 'planned') => ({ attempt_no, weekStart, lich_su, status });
    assert(d.mocKeTiep([M(3, '2026-12-14'), M(1, '2026-10-12'), M(2, '2026-11-16')], '2026-09-29')?.attempt_no === 1, 'MT1');
    assert(d.mocKeTiep([M(1, '2026-08-03', 1), M(2, '2026-10-12')], '2026-09-29')?.attempt_no === 2, 'bỏ MT1 lịch sử');
    assert(d.mocKeTiep([M(1, '2026-09-28')], '2026-09-29')?.attempt_no === 1, 'tuần này vẫn tính');
    assert(d.mocKeTiep([M(1, '2026-09-21')], '2026-09-29') === null, 'tuần trước không tính');
  });

  const mig: any = await import('../migrate/prMt.ts');
  const { default: Database } = await import('libsql');
  check('PR-MT (2) · migratePrMt: DB cũ thêm cột lich_su mặc định 0, chạy lại không đổi gì; DB từ schema.sql đã có cột (T78)', () => {
    const mem = new Database(':memory:');
    mem.exec('CREATE TABLE assessment_attempts (id INTEGER PRIMARY KEY, attempt_no INTEGER)');
    mem.exec('INSERT INTO assessment_attempts (attempt_no) VALUES (1)');
    const lan1: string[] = []; mig.migratePrMt(mem, lan1);
    const lan2: string[] = []; mig.migratePrMt(mem, lan2);
    assert(lan1.length === 1 && lan2.length === 0, `${lan1.length}/${lan2.length}`);
    assert((mem.prepare('SELECT lich_su FROM assessment_attempts').get() as any).lich_su === 0, 'dòng cũ = lượt thường');
    mem.close();
    const lan3: string[] = []; mig.migratePrMt(t.conn, lan3);
    assert(lan3.length === 0, 'schema.sql đã có cột');
  });
  check('PR-MT (2) · chạy thử: lotrinhNhaySo bắt lộ trình MT1 + MT3; luotHuyGiua bắt lượt huỷ ở giữa (K4-09 phần báo)', () => {
    const now = '2026-09-29';
    const sid = Number(t.conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, status, created_at)
      VALUES ('PRMT-NHAY', 'Em Nhảy Số', 'em nhay so', 'active', ?)`).run(now).lastInsertRowid);
    const cid = Number(t.conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at)
      VALUES (?, 1, 'LT1', ?, 'completed', ?)`).run(sid, now, now).lastInsertRowid);
    const them = (n: number, status: string) => t.conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, status, created_at)
      VALUES (?,?,?, 'mock', ?, ?)`).run(cid, sid, n, status, now);
    them(1, 'done'); them(2, 'cancelled'); them(3, 'planned');
    const nhay = mig.lotrinhNhaySo(t.conn).find((x: any) => x.hv === 'PRMT-NHAY');
    assert(nhay?.so === 'MT1, MT3', JSON.stringify(nhay));
    const huy = mig.luotHuyGiua(t.conn).filter((x: any) => x.hv === 'PRMT-NHAY');
    assert(huy.length === 1 && huy[0].mt === 'MT2' && !huy[0].coDiem, JSON.stringify(huy));
  });
}
