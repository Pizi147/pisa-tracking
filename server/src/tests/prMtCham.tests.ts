/**
 * PHÉP KIỂM PR-MT-CHAM (N39, chủ SP 05/11 — đặc tả 2026-11-04-luat-mt-thong-nhat-design.md mục 4): việc chấm Mock theo tuần + lớp.
 *  · Dòng việc chấm Mock: nhãn chỉ tuần ("W3 OCT"), không còn danh sách "MT1, MT4"; cách gom (lớp + tuần thi + người) giữ nguyên.
 *  · Panel từ việc: lưới TUẦN + LỚP (`/classes/:id/cham?periodId`), chỉ em có bài tuần đó (cả bài đã chấm) — không cả lớp; kể cả Speaking chấm chéo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

export async function runPrMtChamTests(t: any) {
  const { check, assert, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const mw: any = await import('../worklist/mywork.ts');
  const perm: any = await import('../permissions.ts');
  const { chamSheet } = await import('../cham/canCham.ts');
  console.log('\nPR-MT-CHAM · chấm Mock theo tuần + lớp (N39)');

  /* Mọi việc chấm Mock có tuần thi, của mọi vai demo (gồm dòng con của dòng gộp). */
  const viecMock = () => Object.values(P).flatMap((x: any) => {
    const p = perm.loadPrincipal(x.userId);
    return (mw.myWork(p).items as any[])
      .filter((i) => i.group === 'score' && (i.kind ?? 'mock') === 'mock' && i.tuanThi && i.classId && i.periodId)
      .map((i) => ({ p, i }));
  });

  check('MT-CHAM ① nhãn dòng việc chấm Mock = tuần thi, không còn "MTn"', () => {
    const ds = viecMock();
    assert(ds.length > 0, 'seed không có việc chấm Mock có tuần');
    const sai = ds.filter(({ i }) => /\bMT\d/.test(i.contextLabel ?? '') || i.contextLabel !== d.tuanLich(i.tuanThi));
    assert(!sai.length, JSON.stringify(sai.slice(0, 3).map(({ i }) => [i.key, i.contextLabel])));
  });

  check('MT-CHAM ② panel từ việc chỉ liệt kê em có bài tuần đó (đủ em còn thiếu, không cả lớp)', () => {
    let itHon = 0;
    for (const { p, i } of viecMock()) {
      const ft = (chamSheet(p, i.classId, { periodId: i.periodId }) as any).ft;
      if (!ft) continue;
      const kns = i.kns ?? (i.kn ? [i.kn] : null);
      const co = d.attemptCoBaiTuan(ft.rows, i.tuanThi, kns);
      const can = d.attemptCuaEm(ft.rows, d.emCuaViec(i));
      const thieu = [...can].filter((a) => !co.has(a));
      assert(!thieu.length, `${i.key}: em còn bài của việc không có trong panel ${JSON.stringify(thieu)}`);
      for (const r of ft.rows.filter((r: any) => co.has(r.attemptId))) {
        assert(r.cells.some((c: any) => c.weekStart === i.tuanThi && (c.band !== null || c.progress === 'due' || c.progress === 'sat')),
          `${i.key}: em ${r.studentId} không có bài tuần ${i.tuanThi}`);
      }
      if (co.size < ft.rows.length) itHon++;
    }
    assert(itHon > 0, 'không việc nào ít em hơn cả lớp — phép kiểm không phân biệt được');
  });

  check('MT-CHAM ②b attemptCoBaiTuan: chờ điểm / đã có điểm ở tuần + cột → vào; nhập bù chưa điểm, tuần khác, cột khác → không', () => {
    const W = '2026-07-20';
    const o = (skill: string, progress: string, band: number | null = null, weekStart = W) => ({ skill, progress, band, weekStart });
    const rows = [
      { attemptId: 1, cells: [o('speaking', 'due')] },
      { attemptId: 2, cells: [o('speaking', 'scored', 6.5)] },
      { attemptId: 3, cells: [o('speaking', 'lich_su')] },
      { attemptId: 4, cells: [o('speaking', 'due', null, '2026-07-27')] },
      { attemptId: 5, cells: [o('listening', 'due')] },
      { attemptId: 6, cells: [o('writing2', 'sat')] },
    ];
    assert([...d.attemptCoBaiTuan(rows, W, ['speaking'])].join() === '1,2', 'speaking');
    assert([...d.attemptCoBaiTuan(rows, W, ['writing'])].join() === '6', 'writing khớp W2');
    assert([...d.attemptCoBaiTuan(rows, W, null)].join() === '1,2,5,6', 'mọi cột');
  });

  check('MT-CHAM ③ PanelViec: việc chấm có tuần (kể cả chấm chéo) mở PanelNhapDiemTuan, lưới lọc em có bài tuần; "Cả lớp" giữ', () => {
    const goc = path.join(ROOT, 'web/src');
    const pv = fs.readFileSync(path.join(goc, 'modules/congViec/PanelViec.tsx'), 'utf8');
    assert(/if \(it\.con \|\| it\.periodId\) return <PanelNhapDiemTuan/.test(pv), 'việc có tuần chưa mở panel tuần');
    assert(!/!laViecChamCheo\(it\) && \(it\.con \|\| it\.periodId\)/.test(pv), 'chấm chéo còn mở bảng cả lớp theo đợt');
    assert(/emCoBaiTuan=\{\(x\.kind \?\? 'mock'\) === 'mock'\}/.test(pv), 'panel tuần chưa lọc em có bài tuần');
    const ln = fs.readFileSync(path.join(goc, 'modules/test/lichTest/LuoiNhung.tsx'), 'utf8');
    assert(/attemptCoBaiTuan\(data\.ft\.rows, tuanDangXem, chiCot\)/.test(ln), 'LuoiNhung chưa dùng attemptCoBaiTuan');
    const lc = fs.readFileSync(path.join(goc, 'modules/cham/LuoiChamLop.tsx'), 'utf8');
    assert(/nutCaLop = true/.test(lc), 'nút "Cả lớp" mất mặc định hiện');
  });
}
