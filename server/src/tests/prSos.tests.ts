/** PHÉP KIỂM PR-SOS — SOS v4: PA quy chế chờ xác nhận, Xác nhận Case → Xác nhận PA, Không cần theo dõi qua Quản lý. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrSosTests(t: YThucTestKit) {
  const { check, assert, conn } = t;
  const d = await import('../../../shared/domain/index.ts');
  const libsqlMod: any = await import('libsql');
  console.log('\nPR-SOS · SOS v4');

  // ------------------------------------------------------------------ Task 1 · luật thuần
  check('SOS (1) · hanXacNhan: 3 ngày tính cả ngày đầu', () => {
    assert(d.hanXacNhan('2026-09-14') === '2026-09-16', d.hanXacNhan('2026-09-14'));
  });
  check('SOS (1) · laLanGhiCuoi: 5 ca (T22, K5-25, M-17)', () => {
    const ca: [boolean, string | null, string | null, string, boolean][] = [
      [false, '2026-09-27', '2026-09-28', '2026-09-28', false],   // PA thường
      [true, '2026-09-27', '2026-09-28', '2026-09-22', true],     // tuần đang ghi chứa mốc CN 27/09
      [true, '2026-10-04', '2026-09-28', '2026-09-22', false],    // mốc tuần sau
      [true, '2026-09-27', '2026-09-21', '2026-09-29', true],     // ghi sau mốc
      [true, null, '2026-09-28', '2026-09-22', false],            // chưa có mốc
    ];
    for (const [preset, followupDue, actionDue, ngay, mong] of ca) {
      assert(d.laLanGhiCuoi({ preset, followupDue, actionDue }, ngay) === mong, `${preset} ${followupDue} ${actionDue} ${ngay}`);
    }
  });
  check('SOS (1) · quyetDinhChoPa: PA quy chế không Thay / Kết thúc; lần cuối không có quyết định (T63)', () => {
    const q = d.quyetDinhChoPa({ preset: true }, false);
    assert(!q.includes('replace') && !q.includes('end') && q.includes('keep') && q.includes('ask_manager'), q.join());
    assert(d.quyetDinhChoPa({ preset: false }, false).join() === d.PLAN_DECISIONS.join(), 'PA thường đủ 5');
    assert(d.quyetDinhChoPa({ preset: true }, true).length === 0, 'lần cuối rỗng');
  });
  check('SOS (1) · trangThaiCaseV4: đủ 7 dòng bảng + quá hạn, một nhãn', () => {
    const goc = { status: 'open' as const, fromSos: true, hasCause: false, dismissed: false, systemClosed: false, choDuyetKhongTheoDoi: false, coPaChoXacNhan: true, hanXacNhan: '2026-09-16' };
    const k = (x: object, hom = '2026-09-15') => d.trangThaiCaseV4({ ...goc, ...x }, hom);
    assert(k({ systemClosed: true, dismissed: true, lyDoHeThong: 'Lượt Test đã huỷ' }).k === 'he-thong-dong' && k({ systemClosed: true, lyDoHeThong: 'Lượt Test đã huỷ' }).chu === 'Hệ thống đóng · Lượt Test đã huỷ', 'hệ thống đóng');
    assert(k({ dismissed: true, status: 'done' }).chu === 'Đã huỷ · không cần theo dõi' && k({ dismissed: true }).t === 'da-huy', 'huỷ');
    assert(k({ status: 'done', hasCause: true }).k === 'xong', 'xong');
    const cd = k({ choDuyetKhongTheoDoi: true });
    assert(cd.k === 'cho-duyet-khong-theo-doi' && cd.t === 'cho-duyet' && cd.chu === 'Chờ Quản lý duyệt · không theo dõi', 'chờ duyệt');
    const cn = k({});
    assert(cn.k === 'cho-nguyen-nhan' && cn.t === 'can-lam' && cn.han === '2026-09-16' && cn.chu === 'Chờ xác nhận nguyên nhân', JSON.stringify(cn));
    assert(k({}, '2026-09-17').t === 'qua-han' && k({}, '2026-09-16').t === 'can-lam', 'quá hạn khi hôm nay > hạn');
    assert(k({ hasCause: true }).k === 'cho-xac-nhan-pa' && k({ hasCause: true }).chu === 'Chờ xác nhận PA', 'chờ xác nhận PA');
    assert(k({ hasCause: true, coPaChoXacNhan: false, status: 'in_progress' }).k === 'dang-lam', 'đang làm');
    assert(k({ fromSos: false, hasCause: false, coPaChoXacNhan: false }).k === 'dang-lam', 'Case tay');
  });
  check('SOS (1) · viecTiepCuaCase: thứ tự nguyên nhân → chờ duyệt → Xác nhận PA → Ghi kết quả cuối → Ghi kết quả PA → Hoàn thành → Đề ra PA', () => {
    const c = { status: 'open' as const, fromSos: true, hasCause: false, dismissed: false, systemClosed: false, choDuyetKhongTheoDoi: false, coPaChoXacNhan: true, hanXacNhan: '2026-09-16' };
    const pa = (x: object) => ({ id: 1, ten: 'Tutor', batBuoc: true, choXacNhan: false, xong: false, actionDue: '2026-09-28', followupDue: '2026-10-18', ...x });
    const hom = '2026-09-22';
    assert(d.viecTiepCuaCase(c, [pa({ choXacNhan: true })], hom)?.chu === 'Xác nhận nguyên nhân', 'nguyên nhân');
    assert(d.viecTiepCuaCase({ ...c, choDuyetKhongTheoDoi: true }, [], hom)?.han === null, 'chờ duyệt không hạn');
    const xn = d.viecTiepCuaCase({ ...c, hasCause: true }, [pa({ choXacNhan: true })], hom);
    assert(xn?.chu === 'Xác nhận PA Tutor' && xn.han === '2026-09-16' && xn.loaiHan === 'xac-minh-sos' && xn.paId === 1, JSON.stringify(xn));
    const chay = { ...c, hasCause: true, coPaChoXacNhan: false, status: 'in_progress' as const };
    assert(d.viecTiepCuaCase(chay, [pa({ followupDue: '2026-09-27' })], hom)?.chu === 'Ghi kết quả cuối Tutor', 'lần cuối');
    const g = d.viecTiepCuaCase(chay, [pa({ id: 2, ten: 'A', batBuoc: false, followupDue: null, actionDue: '2026-09-21' }), pa({})], hom);
    assert(g?.chu === 'Ghi kết quả PA A' && g.loaiHan === 'cap-nhat-pa' && g.han === '2026-09-21', JSON.stringify(g));
    assert(d.viecTiepCuaCase(chay, [pa({ xong: true })], hom)?.chu === 'Hoàn thành Case', 'hoàn thành');
    assert(d.viecTiepCuaCase({ ...chay, fromSos: false }, [], hom)?.loaiHan === 'lap-pa', 'Đề ra PA');
    assert(d.viecTiepCuaCase({ ...chay, status: 'done' }, [], hom) === null, 'xong → không việc');
    const cu = JSON.stringify([d.viecTiepCuaCase(c, [], hom), xn, g]);
    assert(!/Xác minh SOS|gợi ý|Chờ QL/.test(cu), cu);
  });
  check('SOS (1) · chanHoanThanh: PA bắt buộc chưa khép → ẩn nút + câu; PA thường → lý do', () => {
    const r = d.chanHoanThanh([{ batBuoc: true, xong: false, choDuyet: false, followupDue: null, mocChu: 'đến MT2 · W2 OCT' }]);
    assert(r.an && r.dong === 'Hoàn thành được sau khi PA theo quy chế kết thúc (đến MT2 · W2 OCT)', JSON.stringify(r));
    const t2 = d.chanHoanThanh([{ batBuoc: false, xong: false, choDuyet: true, followupDue: null, mocChu: '' }, { batBuoc: true, xong: true, choDuyet: false, followupDue: null, mocChu: '' }]);
    assert(!t2.an && t2.dong === null && t2.ly_do.join().includes('chờ Quản lý duyệt'), JSON.stringify(t2));
    assert(d.chanHoanThanh([]).ly_do.length === 1, 'chưa PA');
  });
  check('SOS (1) · mocQuyChe tính từ ngày xác nhận (dùng lại sosPlanEndDate: +30 ngày → Chủ nhật đầu tiên sau)', () => {
    /* 17/09 + 30 = 17/10 (thứ Bảy) → Chủ nhật đầu tiên sau = 18/10. */
    assert(d.mocQuyChe('one_month', { ngayXacNhan: '2026-09-17' }) === '2026-10-18', String(d.mocQuyChe('one_month', { ngayXacNhan: '2026-09-17' })));
    assert(d.mocQuyChe('until_next_mt', { ngayXacNhan: '2026-09-17' }) === null && d.mocQuyChe('until_exam', { ngayXacNhan: '2026-09-17', examDate: '2027-01-10' }) === '2027-01-10', 'chưa lịch → null');
  });
  check('SOS (1) · MT5+ = Tutor · đến lúc thi (Câu 1 = A); tên Case SOS ghép chip', () => {
    assert(d.academicSupportFor(5, 2)?.description === 'Tutor · đến lúc thi', 'MT5');
    assert(d.tenCaseSos({ mt: 1, giua: 'Reading không đạt', sos: 3 }) === '[MT1] Reading không đạt [SOS 3]', 'tên');
  });

  // ------------------------------------------------------------------ Task 2 · migrate
  const { migratePrSos } = await import('../migrate/prSos.ts');
  const migN1: any = await import('../migrate/prN1.ts');
  check('SOS (2) · migratePrSos trên libsql: thêm hai cột, chạy lần 2 không báo gì; schema.sql có cả hai cột', () => {
    const { default: SqliteDb } = libsqlMod;
    const mem = new SqliteDb(':memory:');
    mem.exec('CREATE TABLE sos_cases (id INTEGER PRIMARY KEY); CREATE TABLE case_interventions (id INTEGER PRIMARY KEY)');
    const a1: string[] = []; migratePrSos(mem, a1);
    const a2: string[] = []; migratePrSos(mem, a2);
    const cot = (b: string) => (mem.prepare('SELECT name FROM pragma_table_info(?)').all(b) as any[]).map((c) => c.name);
    assert(a1.length === 2 && a2.length === 0, `${a1.join()} | ${a2.join()}`);
    assert(cot('sos_cases').includes('han_xac_nhan') && cot('case_interventions').includes('moc_quy_che'), 'thiếu cột');
    mem.close();
    const cotThat = (b: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all(b) as any[]).map((c: any) => c.name);
    assert(cotThat('sos_cases').includes('han_xac_nhan') && cotThat('case_interventions').includes('moc_quy_che'), 'DB mới (schema.sql) thiếu cột');
  });
  check('SOS (2) · migratePrN1 không còn đổi PA chờ xác nhận (R6, M1)', () => {
    const c = conn.prepare(`SELECT id FROM sos_cases WHERE status != 'done' LIMIT 1`).get() as any;
    const id = Number(conn.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, preset, cycle_no, needs_approval, created_at)
      VALUES (?, 'tutor', 'Tutor · đến MT2', 'planned', 1, 1, 0, ?)`).run(c.id, new Date().toISOString()).lastInsertRowid);
    migN1.migratePrN1(conn, []);
    const iv = conn.prepare('SELECT status, confirmed_at FROM case_interventions WHERE id = ?').get(id) as any;
    conn.prepare('DELETE FROM case_interventions WHERE id = ?').run(id);
    assert(iv.status === 'planned' && iv.confirmed_at === null, JSON.stringify(iv));
  });
}
