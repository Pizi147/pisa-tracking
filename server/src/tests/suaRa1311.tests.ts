/**
 * PHÉP KIỂM SUA-RA-1311 (PTA rà trước deploy 13/11 + đề bài `docs/superpowers/specs/2026-11-13-audit-1454/de-bai.md`) — phần máy chủ:
 *  2 · Hai hàm đêm (`doi-chieu-so`, `chot-vang`) nạp `platform/cauHinhCaseSos.ts` (nguồn cấu hình Case & SOS) và quên nhớ mỗi lượt
 * Mục 1 (Khôi phục lượt mở lại việc Báo PH) ở `prMt.tests.ts`; mục 3 (nguồn lịch chuỗi "-") ở `prBv.tests.ts`.
 */
import pathMod from 'node:path';
import { fileURLToPath } from 'node:url';

export async function runSuaRa1311Tests(t: any) {
  const { check, checkAsync, assert, conn } = t;
  const chs: any = await import('../platform/cauHinhCaseSos.ts');
  const dcs: any = await import('../ops/doiChieuSo.ts');
  const cv: any = await import('../ops/chotVangDinhKy.ts');
  const { LOAI_CAU_HINH } = await import('../../../shared/domain/index.ts');
  const { build } = await import('esbuild');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  console.log('\nSUA-RA-1311 · 2 hàm đêm đọc cấu hình Case & SOS đang dùng');

  // ---------------------------------------------------------------- 2a · gói như Netlify
  await checkAsync('SUA-RA-1311 2a · gói hàm doi-chieu-so / chot-vang (esbuild như Netlify) có server/src/platform/cauHinhCaseSos.ts — không thì cauHinh() luôn là bản gốc', async () => {
    for (const f of ['doi-chieu-so', 'chot-vang']) {
      const g = await build({
        entryPoints: [`netlify/functions/${f}.ts`], absWorkingDir: REPO, bundle: true, platform: 'node', target: 'node22', format: 'cjs', write: false, outfile: 'x.js',
        external: ['libsql', '@libsql/*'], metafile: true, logLevel: 'silent',
      });
      const vao = Object.entries(Object.values(g.metafile.outputs)[0].inputs).filter(([, v]) => v.bytesInOutput > 0).map(([k]) => k.replace(/\\/g, '/'));
      assert(vao.includes('server/src/platform/cauHinhCaseSos.ts'), `${f}: thiếu nguồn cấu hình Case & SOS (${vao.filter((k) => /cauHinh/.test(k)).join(', ')})`);
    }
  });

  // ---------------------------------------------------------------- 2b · lambda ấm: bản mới tới ngay lượt sau
  const l = LOAI_CAU_HINH[0];
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { chs.quenNhoCauHinh(); fn(); } finally { conn.exec('ROLLBACK'); chs.quenNhoCauHinh(); } };
  const banMoi = () => Number(conn.prepare(`INSERT INTO cau_hinh_phien_ban (loai, du_lieu, tao_luc) VALUES (?, ?, ?)`)
    .run(l, JSON.stringify(chs.cauHinhDangDung(l).du_lieu), new Date().toISOString()).lastInsertRowid);
  check('SUA-RA-1311 2b · doiChieuSo: nhớ ấm bản cũ → có bản mới → lượt đối chiếu đọc bản mới (quenNhoCauHinh cạnh xoaNhoHan)', () => thu(() => {
    chs.cauHinhDangDung(l);
    const id = banMoi();
    dcs.doiChieuSo(undefined, []);
    assert(chs.cauHinhDangDung(l).id === id, `còn bản ${chs.cauHinhDangDung(l).id}, mong ${id}`);
  }));
  check('SUA-RA-1311 2c · chotVangDinhKy: như 2b', () => thu(() => {
    chs.cauHinhDangDung(l);
    const id = banMoi();
    cv.chotVangDinhKy({ chuyen: () => 0, daKhoiTao: () => true });
    assert(chs.cauHinhDangDung(l).id === id, `còn bản ${chs.cauHinhDangDung(l).id}, mong ${id}`);
  }));

  // ---------------------------------------------------------------- 4 · mốc PA quy chế: một luật (gắn dấu PA GV = đường đọc = migrate)
  console.log('\nSUA-RA-1311 · 4 mốc PA quy chế tính từ ngày bắt đầu PA, migrate chạy lại không đổi');
  const tamPa: any = await import('../migrate/prSosTamPa.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const week: any = await import('../platform/week.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { addDays } = await import('../util.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const run = (sql: string, ...a: unknown[]) => conn.prepare(sql).run(...a);
  /*
   * Như PA 541 / 566 trên bản chép 07/11: PA GV (tutor) bắt đầu 20 ngày trước, Case chốt SOS ở MT2, PA quy chế chờ cùng loại → migrate SOS-TAM-PA gắn dấu.
   * MT3 (MT cuối) xếp TRƯỚC ngày bắt đầu; lộ trình chưa có ngày thi.
   */
  const dungCa = (span: 'until_next_mt' | 'until_exam') => {
    const hn = demoToday();
    const batDau = addDays(hn, -20);
    const a = one(`SELECT a.cycle_id, a.student_id FROM assessment_attempts a WHERE a.kind = 'mock' AND a.attempt_no = 3 AND a.status != 'cancelled'
        AND EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND k.required = 1) ORDER BY a.id LIMIT 1`);
    run('UPDATE learning_cycles SET exam_date = NULL, exam_period_id = NULL, exam_month = NULL WHERE id = ?', a.cycle_id);
    const luot = (n: number) => one('SELECT id FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ? AND kind = ?', a.cycle_id, n, 'mock')?.id as number;
    for (const [n, tuan] of [[1, -56], [2, -42], [3, -28]] as const) {
      const pid = week.ensurePeriod(week.mondayOf(addDays(hn, tuan))).id;
      run(`UPDATE assessment_attempts SET planned_period_id = ?, status = 'planned' WHERE id = ?`, pid, luot(n));
      run('UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ?', pid, luot(n));
    }
    run(`UPDATE assessment_attempts SET status = 'cancelled' WHERE cycle_id = ? AND attempt_no > 3`, a.cycle_id);
    const cid = Number(run(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, sos_level, detected_at, created_at)
        VALUES (?, ?, 'listening', 'listening', 'mock', 'open', 1, ?, ?)`, a.student_id, a.cycle_id, hn, `${hn}T03:00:00.000Z`).lastInsertRowid);
    run(`INSERT INTO case_milestones (case_id, kind, attempt_id, attempt_no, occurred_on, created_at) VALUES (?, 'repeat', ?, 2, ?, ?)`, cid, luot(2), hn, `${hn}T03:00:00.000Z`);
    const g = Number(run(`INSERT INTO case_interventions (case_id, kind, description, status, preset, started_date, cycle_started_on, created_at)
        VALUES (?, 'tutor', 'Tutor GV kèm Listening hai buổi mỗi tuần', 'started', 0, ?, ?, ?)`, cid, batDau, batDau, `${batDau}T03:00:00.000Z`).lastInsertRowid);
    run(`INSERT INTO case_interventions (case_id, kind, description, status, preset, moc_quy_che, created_at) VALUES (?, 'tutor', 'Tutor theo quy chế', 'planned', 1, ?, ?)`,
      cid, span, `${hn}T03:00:01.000Z`);
    xoaNho();
    return { cid, g, batDau, mt3: addDays(week.mondayOf(addDays(hn, -28)), 6) };
  };
  for (const span of ['until_next_mt', 'until_exam'] as const) {
    check(`SUA-RA-1311 4 · ${span}: gắn dấu PA GV (migrate SOS-TAM-PA) → mốc không trước ngày bắt đầu; đường đọc / migrate chạy lại không đổi`, () => thu(() => {
      const c = dungCa(span);
      const r = tamPa.doiSosTamPa(conn);
      assert(r.trung.includes(c.cid), `chưa gắn dấu: ${JSON.stringify(r)}`);
      const g = one('SELECT preset, moc_quy_che, followup_due FROM case_interventions WHERE id = ?', c.g);
      assert(g.preset === 1 && g.moc_quy_che === span, JSON.stringify(g));
      if (span === 'until_next_mt') {
        /* MT3 (MT kế tiếp của MT2) hết tuần TRƯỚC ngày bắt đầu, không còn MT sau → chưa có mốc (điền khi xếp lịch), không phải CN tuần MT3. */
        assert(g.followup_due === null, `mốc ${g.followup_due} trước ngày bắt đầu ${c.batDau} (CN MT3 ${c.mt3})`);
      } else {
        assert(g.followup_due === addDays(c.batDau, 28), `mốc ${g.followup_due}, mong bắt đầu + 4 tuần ${addDays(c.batDau, 28)}`);
      }
      const lai = sosAuto.keHoachMocQuyChe({ caseIds: [c.cid] });
      assert(lai.length === 0, `đường đọc / migrate OV-13a tính mốc khác: ${JSON.stringify(lai)} (gắn dấu ghi ${g.followup_due})`);
    }));
  }
}
