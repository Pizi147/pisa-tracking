/** PHÉP KIỂM PR-OV1a — MT0 lớp thường không ghi / không hiện qua bảng tỷ lệ; Điểm theo lớp có lượt MT0; tên tab; hai lệnh chỉ đọc. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv1aTests(t: YThucTestKit) {
  const { check, assert, conn, P, addDays } = t;
  const regular: any = await import('../normal/regular.ts');
  const canCham: any = await import('../cham/canCham.ts');
  const loTrinh: any = await import('../classes/loTrinhTiep.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const dl: any = await import('../cham/diemTheoLuot.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const tongHop: any = await import('../phanTich/tongHop.ts');
  const { kiemDuLieuMt } = await import('../ops/kiemDuLieuMt.ts');
  const { kiemOLop } = await import('../ops/kiemOLop.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV1a · MT0 nhập đúng bảng, Điểm theo lớp, lệnh kiểm chỉ đọc');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  const QL = P.admin;

  /* Một em lớp thường BE/FOU/ELE đang học, khoá đang chạy — QL ghi Lên FT tạo MT0 (như prMt0). */
  const em = all(`SELECT s.id sid, c.id classId FROM students s JOIN learning_cycles lc ON lc.student_id = s.id AND lc.status = 'active'
      JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' JOIN classes c ON c.id = e.class_id WHERE c.programme_code IN ('BE', 'FOU', 'ELE') AND s.archived_at IS NULL AND s.status = 'active'
        AND NOT EXISTS (SELECT 1 FROM assessment_attempts x WHERE x.class_id = c.id AND x.kind = 'mt0') ORDER BY s.id LIMIT 1`)[0];
  const taoMt0 = () => {
    loTrinh.ghiLoTrinhTiep(QL, em.sid, { huong: 'fast_track', mucTieu: 6.5 });
    const a = all(`SELECT a.id, p.week_start FROM assessment_attempts a JOIN attempt_skills k ON k.attempt_id = a.id
        JOIN report_periods p ON p.id = k.planned_period_id WHERE a.student_id = ? AND a.kind = 'mt0' LIMIT 1`, em.sid)[0];
    return { id: a.id as number, sau: addDays(a.week_start, 8) as string };
  };
  const diem = (id: number) => JSON.stringify(all(`SELECT skill, raw_score, raw_total, band, no_show_at FROM assessment_scores WHERE attempt_id = ? ORDER BY skill`, id));

  check('OV1a-1 · saveRegularScore vào lượt MT0 (đúng/tổng hoặc "-") → 400 chữ MT0, điểm không đổi', () => {
    assert(em, 'cần một em lớp thường BE/FOU/ELE');
    thu(() => {
      const m = taoMt0();
      const truoc = diem(m.id);
      for (const patch of [{ score: 6, total: 9 }, { noShow: true }]) {
        const e = loi(() => regular.saveRegularScore(QL, m.id, 'listening', patch, m.sau));
        assert(e?.status === 400 && /MT0/.test(e.message), `${JSON.stringify(patch)}: ${e?.status} ${e?.message}`);
      }
      assert(diem(m.id) === truoc, `điểm đổi: ${diem(m.id)}`);
    });
  });

  check('OV1a-2 · regularSheet không có hàng MT0; chamSheet(kind mt0) vẫn bảng band', () => {
    thu(() => {
      taoMt0();
      for (const k of [undefined, 'mt0']) {
        const s = regular.regularSheet(QL, em.classId, k);
        assert(!JSON.stringify(s).includes('"kind":"mt0"'), `regularSheet(${k}) còn hàng MT0`);
      }
      const c = canCham.chamSheet(QL, em.classId, { kind: 'mt0' });
      assert(c.mode === 'ielts_band' && c.ft.rows.length >= 1, `chamSheet mt0: ${c.mode} ${c.ft?.rows?.length}`);
    });
  });

  check('OV1a-2b · huỷ lượt MT0 có điểm band vẫn chạy (đường band, không dính chặn mới)', () => {
    thu(() => {
      const m = taoMt0();
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, nhap_dau_ngay) VALUES (?,?,?,?)').run(m.id, 'listening', 4, t.TODAY);
      attempts.huyLuot(QL, m.id, { lyDo: 'Em nghỉ' });
      assert(all('SELECT status FROM assessment_attempts WHERE id = ?', m.id)[0].status === 'cancelled', 'chưa huỷ');
    });
  });

  check('OV1a-3 · mã thuong:mt0; Điểm theo lớp lớp thường có lượt MT0 sau Final (bảng band); lớp chưa có MT0 thì không', () => {
    assert(JSON.stringify(dm.docMaLuot('thuong:mt0')) === '{"loai":"thuong","kind":"mt0"}', 'docMaLuot thuong:mt0');
    assert(dm.docMaLuot('thuong:abc') === null, 'thuong:abc phải null');
    assert(dm.nhanMaLuot({ loai: 'thuong', kind: 'mt0' }) === 'MT0', 'nhãn MT0');
    assert(!dl.danhSachLuot(QL, em.classId).luot.some((l: any) => l.ma === 'thuong:mt0'), 'lớp chưa có MT0 không có lượt MT0');
    thu(() => {
      taoMt0();
      const ma = dl.danhSachLuot(QL, em.classId).luot.map((l: any) => l.ma);
      const i = ma.indexOf('thuong:mt0');
      assert(i >= 0 && i > ma.indexOf('thuong:final') && dl.danhSachLuot(QL, em.classId).luot[i].nhan === 'MT0', `thứ tự lượt: ${ma}`);
      const b = dl.bangTheoLuot(QL, em.classId, 'thuong:mt0');
      assert(b.mode === 'ielts_band' && b.ft.rows.length >= 1, `bảng MT0: ${b.mode}`);
      const e = loi(() => dl.bangTheoLuot(QL, em.classId, 'thuong:abc'));
      assert(e?.status === 400, `thuong:abc: ${e?.status}`);
    });
  });

  check('OV1a-4 · lượt MT0 chưa điểm, 4 kỹ năng bắt buộc → 5 ô trống (L, R, W1, W2, S)', () => {
    thu(() => {
      taoMt0();
      const l = dl.danhSachLuot(QL, em.classId).luot.find((x: any) => x.ma === 'thuong:mt0');
      assert(l?.oTrong === 5 && l.coLich === 1, `oTrong ${l?.oTrong} coLich ${l?.coLich}`);
    });
  });

  check('OV1a-5 · tên tab "Lịch Test / Chấm Test"; Tổng hợp theo tuần: đúng một hàng tuanNay (hàng "tuần này")', () => {
    assert(dm.TAB_TEST_LABEL.lich === 'Lịch Test / Chấm Test', `nhãn: ${dm.TAB_TEST_LABEL.lich}`);
    let coTuanNay = 0;
    for (const ct of ['ft', 'thuong']) {
      const r = tongHop.tongHop(QL, { ct, soTuan: 12, theo: 'tuan' });
      const nay = r.hang.filter((h: any) => h.tuanNay === true);
      assert(r.hang.every((h: any) => typeof h.tuanNay === 'boolean'), `${ct}: hàng thiếu tuanNay`);
      assert(nay.length <= 1 && nay.every((h: any) => h.phu?.includes('tuần này'))
        && r.hang.filter((h: any) => h.phu?.includes('tuần này')).length === nay.length, `${ct}: ${JSON.stringify(r.hang.map((h: any) => [h.nhan, h.tuanNay]))}`);
      coTuanNay += nay.length;
    }
    assert(coTuanNay >= 1, 'demo cần ít nhất một hàng tuần này');
    const lop = tongHop.tongHop(QL, { ct: 'ft', soTuan: 12, theo: 'lop' });
    assert(lop.hang.every((h: any) => h.tuanNay === undefined), 'theo lớp không có tuanNay');
  });

  check('OV1a-6 · kiem-du-lieu-mt nhóm 6: MT0 có ô đúng/tổng (không band) bị bắt; MT0 band thường thì không', () => {
    thu(() => {
      const m = taoMt0();
      const ins = conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, band) VALUES (?,?,?,?,?)');
      ins.run(m.id, 'listening', null, null, 5);
      assert(!kiemDuLieuMt(conn).some((d) => d.nhom === 6 && d.luotId === m.id), 'MT0 band bị báo nhầm');
      ins.run(m.id, 'reading', 6, 9, null);
      const d = kiemDuLieuMt(conn).find((x) => x.nhom === 6 && x.luotId === m.id);
      assert(d && /reading/.test(d.vanDe) && /6\/9/.test(d.vanDe), `nhóm 6: ${JSON.stringify(d)}`);
    });
  });

  check('OV1a-7 · kiem-o-lop: một dòng mỗi ô (W = W1 + W2), không ghi DB; mã lớp lạ → lỗi "Không thấy lớp"', () => {
    const n0 = (conn.prepare('SELECT total_changes() n').get() as any).n;
    const ds = kiemOLop(conn, 'MB FT 101');
    assert(ds.length >= 1, 'không có dòng');
    const nhom = new Map<string, { kn: Set<string>; o: Set<string> }>();
    for (const d of ds) {
      const g = nhom.get(`${d.ma}|${d.luot}`) ?? nhom.set(`${d.ma}|${d.luot}`, { kn: new Set(), o: new Set() }).get(`${d.ma}|${d.luot}`)!;
      g.kn.add(d.kyNang); g.o.add(d.o);
    }
    const du = [...nhom.entries()].filter(([k, g]) => /\|MT\d/.test(k) && g.kn.size === 4 && g.kn.has('writing'));
    /* Lớp thường (Progress / Final) một ô Writing; MT chấm band hai ô W1, W2. */
    assert(ds.some((d) => /^(Progress|Final) Test/.test(d.luot) && d.o === 'writing'), 'lượt lớp thường phải một ô writing');
    const sai = du.filter(([, g]) => !(g.o.size === 5 && g.o.has('writing1') && g.o.has('writing2')));
    assert(du.length >= 1 && !sai.length, `ô của lượt FT sai: ${JSON.stringify(sai.slice(0, 3).map(([k, g]) => [k, [...g.kn], [...g.o]]))}`);
    assert(ds.some((d) => d.tru), 'có lịch sử lượt');
    assert((conn.prepare('SELECT total_changes() n').get() as any).n === n0, 'kiem-o-lop đã ghi DB');
    const e = loi(() => kiemOLop(conn, 'KHONG CO LOP'));
    assert(e && /Không thấy lớp "KHONG CO LOP"/.test(e.message), `mã lạ: ${e?.message}`);
  });
}
