/**
 * PHÉP KIỂM PC-GV-A (đặc tả 2026-10-30-phan-cong-gv-design.md · kế hoạch PR-A): luật thuần đổi người, lõi lưu nhiều lớp có hiệu lực,
 * chuyển Case / PA, áp lịch đổi tới hạn, Hoàn tác, GV cũ chỉ xem có hạn, đường đọc góc Phân công GV.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrPhanCongGvTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPC-GV-A · Phân công GV có hiệu lực (máy chủ)');

  /* ---------------------------------------------------------------- A1 · luật thuần */
  const FT = ['listening', 'reading', 'writing1', 'writing2', 'speaking'];
  const LRWS = ['listening', 'reading', 'writing', 'speaking'];
  const s = (userId: number, skill: string | null) => ({ userId, skill, isCore: skill === null });

  check('A1 · demPhanCong dữ liệu mockup v9 (16 lớp): FT 47 · thường 18 · GVCN FT 10 · thường 6; Hà FT = 7; Châu không có', () => {
    const G: Record<string, number> = {};
    const id = (k: string) => (G[k] ??= Object.keys(G).length + 1);
    const COT: Record<string, Record<string, string>> = {
      FT: { L: 'listening', R: 'reading', W1: 'writing1', W2: 'writing2', S: 'speaking' },
      FOU: { L: 'listening', R: 'reading', 'G+V': 'writing', P: 'speaking' }, BE: { L: 'listening', R: 'reading', W: 'writing', S: 'speaking' }, PREFOU: {},
    };
    const LOP: [string, Record<string, string>][] = [
      ['FT', { L: 'ha', R: 'ha', W1: 'miguel', W2: 'miguel', S: 'thea', CN: 'ha' }], ['FT', { L: 'dung', R: 'hang', W1: 'yen', W2: 'yen', S: 'miguel', CN: 'dung' }],
      ['FT', { L: 'ha', R: 'phong', W1: 'uyen', W2: 'lien', S: 'thea', CN: 'phong' }], ['FT', { L: 'ha', R: 'linh', W1: 'duy', W2: 'duy', S: 'miguel', CN: 'ha' }],
      ['FT', { L: 'phong', R: 'ha', W1: 'yen', W2: 'anh', S: 'thea', CN: 'anh' }], ['FT', { L: 'hang', R: 'hang', W1: 'miguel', W2: 'uyen', S: '', CN: 'hang' }],
      ['FT', { L: 'dung', R: 'ha', W1: 'linh', W2: 'linh', S: 'miguel', CN: 'linh' }], ['FT', { L: 'ha', R: 'dung', W1: 'duy', W2: 'yen', S: 'thea', CN: 'duy' }],
      ['FT', { L: 'phong', R: 'linh', W1: 'anh', W2: 'anh', S: 'miguel', CN: 'phong' }], ['FT', { L: 'uyen', R: 'uyen', W1: '', W2: '', S: 'thea', CN: 'uyen' }],
      ['FOU', { L: 'anh', R: 'anh', 'G+V': 'anh', P: 'miguel', CN: 'anh' }], ['FOU', { L: 'yen', R: 'yen', 'G+V': 'yen', P: 'thea', CN: 'yen' }],
      ['BE', { L: 'linh', R: 'linh', W: 'duy', S: 'thea', CN: 'linh' }], ['BE', { L: 'dung', R: 'hang', W: 'hang', S: 'miguel', CN: 'hang' }],
      ['PREFOU', { CN: 'uyen' }], ['PREFOU', { CN: 'ha' }],
    ];
    id('chau');
    const lop = LOP.map(([ct, o]) => {
      const slots = Object.entries(o).filter(([, g]) => g).map(([k, g]) => (k === 'CN' ? s(id(g), null) : s(id(g), COT[ct][k])));
      return { ft: ct === 'FT', slots: d.moRongPhanCong(ct === 'FT' ? null : ct, ct === 'PREFOU' ? ['tong_hop'] : ct === 'FT' ? FT : LRWS, slots) };
    });
    const m = d.demPhanCong(lop);
    const tong = { ft: 0, th: 0, cnFt: 0, cnTh: 0 };
    for (const x of m.values()) for (const k of Object.keys(tong) as (keyof typeof tong)[]) tong[k] += x[k];
    assert(tong.ft === 47 && tong.th === 18 && tong.cnFt === 10 && tong.cnTh === 6, `tổng ${JSON.stringify(tong)}`);
    assert(m.get(id('ha')).ft === 7, `Hà FT ${m.get(id('ha')).ft}`);
    assert(m.get(id('chau')) === undefined, 'Châu 0 lớp không có dòng');
  });

  const A = 1, B = 2, C = 3;
  check('A1 · doiTheoO FT đổi L: A dạy L + GVCN, L sang B → một dòng listening A → B', () => {
    const r = d.doiTheoO('FT', FT, [s(A, null), s(A, 'listening'), s(C, 'reading')], [s(A, null), s(B, 'listening'), s(C, 'reading')]);
    assert(JSON.stringify(r) === JSON.stringify([{ khoa: 'listening', nguoiCu: A, nguoiMoi: B }]), JSON.stringify(r));
  });
  check('A1 · doiTheoO Pre FOU đổi GVCN → đúng một dòng gvcn (không dòng tong_hop)', () => {
    const cu = d.moRongPhanCong('PREFOU', ['tong_hop'], [s(A, null)]);
    const moi = d.moRongPhanCong('PREFOU', ['tong_hop'], [s(B, null)]);
    const r = d.doiTheoO('PREFOU', ['tong_hop'], cu, moi);
    assert(r.length === 1 && r[0].khoa === 'gvcn' && r[0].nguoiCu === A && r[0].nguoiMoi === B, JSON.stringify(r));
  });
  check('A1 · doiTheoO bỏ người (A → Chưa có) và Chưa có → B: không phải cặp bàn giao', () => {
    const r = d.doiTheoO('FT', FT, [s(A, null), s(A, 'reading'), s(A, 'listening')], [s(A, null), s(A, 'reading')]);
    assert(r.length === 1 && r[0].nguoiCu === A && r[0].nguoiMoi === null && !d.laCapBanGiao(r[0]), JSON.stringify(r));
    const r2 = d.doiTheoO('FT', FT, [s(A, null), s(A, 'reading')], [s(A, null), s(A, 'reading'), s(B, 'speaking')]);
    assert(r2.length === 1 && r2[0].nguoiCu === null && r2[0].nguoiMoi === B && !d.laCapBanGiao(r2[0]), JSON.stringify(r2));
  });
  check('A1 · doiTheoO giữ môn gộp cũ: lớp PET có dòng listening_speaking cũ → không sinh dòng đổi; apDoi bỏ dòng đó (ghiPhanCong tự giữ)', () => {
    const cu = [s(A, null), s(A, 'listening'), s(C, 'listening_speaking')];
    const r = d.doiTheoO('PET', LRWS, cu, [s(A, null), s(A, 'listening')]);
    assert(r.length === 0, JSON.stringify(r));
    assert(!d.apDoi(cu, [], LRWS).some((x: any) => x.skill === 'listening_speaking'), 'apDoi bỏ dòng môn gộp cũ');
  });
  check('A1 · apDoi áp đổi L A → B + giữ ô khác', () => {
    const r = d.apDoi([s(A, null), s(A, 'listening'), s(C, 'reading')], [{ khoa: 'listening', nguoiCu: A, nguoiMoi: B }], FT);
    const k = r.map((x: any) => `${x.isCore ? 'gvcn' : x.skill}:${x.userId}`).sort().join(',');
    assert(k === `gvcn:${A},listening:${B},reading:${C}`, k);
  });
  check('A1 · caseThuocO: ô L → Case L, không R; ô GVCN (A còn dạy L) → Case R + không kỹ năng, không L; ô W1 → Case W1', () => {
    assert(d.caseThuocO('FT', 'listening', new Set(), 'listening') && !d.caseThuocO('FT', 'listening', new Set(), 'reading'), 'ô L');
    const con = new Set(['listening']);
    assert(d.caseThuocO('FT', 'gvcn', con, 'reading') && !d.caseThuocO('FT', 'gvcn', con, 'listening') && d.caseThuocO('FT', 'gvcn', con, null), 'ô GVCN');
    assert(d.caseThuocO('FT', 'writing1', new Set(), 'writing1') && !d.caseThuocO('FT', 'writing1', new Set(), 'writing2'), 'ô W1');
  });
  check('A1 · mốc: xemDen 30/10 → 06/11, 02/11 → 09/11; hạn bàn giao 30/10 → 03/11', () => {
    assert(d.xemDen('2026-10-30') === '2026-11-06' && d.xemDen('2026-11-02') === '2026-11-09', 'xemDen');
    assert(d.hanBanGiaoGv('2026-10-30') === '2026-11-03', d.hanBanGiaoGv('2026-10-30'));
  });
  check('A1 · nguoiVietBanGiao: A không nghỉ → gv-cu; A nghỉ → GVCN P; A nghỉ và là GVCN → QL', () => {
    const P0 = 9;
    const a = d.nguoiVietBanGiao({ cuNghi: false, nguoiCu: A, gvcn: P0, gvcnNghi: false });
    const b = d.nguoiVietBanGiao({ cuNghi: true, nguoiCu: A, gvcn: P0, gvcnNghi: false });
    const c = d.nguoiVietBanGiao({ cuNghi: true, nguoiCu: A, gvcn: A, gvcnNghi: true });
    assert(a.loai === 'gv-cu' && a.id === A && b.loai === 'gvcn' && b.id === P0 && c.loai === 'ql' && c.id === null, JSON.stringify([a, b, c]));
  });
}
