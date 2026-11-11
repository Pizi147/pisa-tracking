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
}
