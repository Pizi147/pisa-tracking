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
}
