/**
 * PHÉP KIỂM OV-15a — nền giao diện: token màu (nền tách lớp, chữ phụ ≥ 7:1, SOS riêng, đã thi), chip SOS một component,
 * ký hiệu điểm, giao diện theo máy, hạn chỉ ghi ngày. Kế hoạch: docs/superpowers/plans/2026-10-19-ov15-overhaul-6-pr.md (OV-15a).
 * Không mở database: đọc nguồn (`index.css`, `tailwind.config.js`, `web/src`) và gọi hàm thuần ở `shared/`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

function taiFile(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) taiFile(p, out);
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

export async function runPrOv15aTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nOV-15a · Nền: màu, chip SOS, ký hiệu, giao diện, hạn');

  const css = fs.readFileSync(path.join(REPO, 'web/src/index.css'), 'utf8');
  const cfg = (await import(pathToFileURL(path.join(REPO, 'tailwind.config.js')).href)).default;
  const { toi, sang } = d.docMauHaiCheDo(css);
  const nguon = taiFile(path.join(REPO, 'web/src')).map((p) => ({ f: path.relative(REPO, p).replace(/\\/g, '/'), text: fs.readFileSync(p, 'utf8') }));

  for (const [ten, mau] of [['tối', toi], ['sáng', sang]] as const) {
    const tp = (a: string, b: string) => (mau[a] && mau[b] ? d.tuongPhan(mau[a], mau[b]) : -1);

    check(`OV15a · 1 (${ten}): chữ phụ (dim, faint) ≥ 4.5:1 trên nền trang, thẻ, thẻ phụ (NEN-V5: chu-3 V5 5,5 : 1 — thay mức 7:1 của OV-15a)`, () => {
      const hong: string[] = [];
      for (const c of ['text-dim-rgb', 'text-faint-rgb']) for (const n of ['bg', 'surface', 'surface-2']) {
        const r = tp(c, n);
        if (r < 4.5) hong.push(`${c} trên ${n} = ${r}`);
      }
      assert(hong.length === 0, hong.join(' · '));
    });

    check(`OV15a · 1 (${ten}): nền tách lớp — trang tối hơn thẻ, thẻ khác thẻ phụ`, () => {
      const s = (n: string) => d.doSang(mau[n]);
      assert(s('bg') < s('surface'), `nền trang phải tối hơn thẻ (${mau.bg} / ${mau.surface})`);
      assert(s('surface') !== s('surface-2'), 'thẻ và thẻ phụ phải khác nhau');
      // trước OV-15a: tối 1,11 · sáng 1,07 — chủ SP 19/10 thấy chưa tách lớp
      const can = ten === 'tối' ? 1.15 : 1.09;
      assert(tp('bg', 'surface') >= can, `${ten}: thẻ trên nền trang chỉ ${tp('bg', 'surface')}:1 (cần ≥ ${can}) — chưa tách lớp`);
    });

    check(`OV15a · 1 (${ten}): SOS 1/2/3 — viền ≥ 3:1, chữ ≥ 4.5:1 trên mọi nền (kể cả hàng đã thi)`, () => {
      const hong: string[] = [];
      for (const k of ['sos1', 'sos2', 'sos3']) {
        for (const n of ['bg', 'surface', 'surface-2', 'hang-lon-bg']) {
          // viền ≥ 3:1 trên nền ô (trang, thẻ); chữ "SOS n" luôn có nên nền hàng lớn chỉ cần chữ đạt
          if (n !== 'hang-lon-bg' && tp(`${k}-rgb`, n) < 3) hong.push(`viền ${k} trên ${n} = ${tp(`${k}-rgb`, n)}`);
          if (tp(`${k}-chu-rgb`, n) < 4.5) hong.push(`chữ ${k} trên ${n} = ${tp(`${k}-chu-rgb`, n)}`);
        }
        if (tp(`${k}-chu-rgb`, 'da-thi-bg-rgb') < 4.5) hong.push(`chữ ${k} trên đã thi = ${tp(`${k}-chu-rgb`, 'da-thi-bg-rgb')}`);
      }
      for (const c of ['text-dim-rgb', 'text-faint-rgb']) if (tp(c, 'da-thi-bg-rgb') < 4.5) hong.push(`${c} trên đã thi = ${tp(c, 'da-thi-bg-rgb')}`);
      if (tp('ok-rgb', 'da-thi-bg-rgb') < 3) hong.push(`vạch đã thi (ok) trên nền đã thi = ${tp('ok-rgb', 'da-thi-bg-rgb')}`);
      assert(hong.length === 0, hong.join(' · '));
      const khac = (a: string, b: string) => mau[a].join() !== mau[b].join();
      assert(khac('sos1-rgb', 'sos2-rgb') && khac('sos2-rgb', 'sos3-rgb') && khac('sos1-rgb', 'sos3-rgb'), 'SOS 1/2/3 phải khác màu');
    });
  }

  check('OV15a · 1: SOS tách khỏi soon / late / bad; bỏ wait (tím) và chon-* (teal)', () => {
    for (const k of ['sos1', 'sos2', 'sos3']) assert(!new RegExp(`--${k}-rgb:\\s*var\\(`).test(css), `--${k}-rgb không còn là bí danh`);
    assert(!/--wait-|--chon-/.test(css), 'index.css còn token --wait-* / --chon-*');
    const colors = cfg.theme.extend.colors as Record<string, unknown>;
    for (const k of ['wait', 'ink', 'teal']) assert(!(k in colors), `tailwind còn màu "${k}"`);
    const hong: string[] = [];
    for (const { f, text } of nguon) {
      const m = /\b(?:text|bg|border|ring|accent|outline)-(?:wait|teal|ink)\b[-\w/]*|--wait-|--chon-|colors\.teal/.exec(text);
      if (m) hong.push(`${f}: ${m[0]}`);
    }
    assert(hong.length === 0, hong.slice(0, 10).join(' · '));
  });

  check('OV15a · 2: giaiThichSos — tiêu đề "Vì sao SOS n", kết luận đếm kỹ năng ở đợt, tạm thời nói rõ', () => {
    const g = d.giaiThichSos({ muc: 3, kyNang: ['L', 'R', 'W'], dot: 'MT3', ten: 'Hoàng Bảo Ngọc' });
    assert(g.tieuDe === 'Vì sao SOS 3 · Hoàng Bảo Ngọc', g.tieuDe);
    assert(g.ketLuan === '3 kỹ năng dưới kỳ vọng ở MT3', g.ketLuan);
    assert(d.chuChipSos({ muc: 2, kyNang: ['R', 'W'] }) === 'SOS 2 · R, W', d.chuChipSos({ muc: 2, kyNang: ['R', 'W'] }));
    assert(d.chuChipSos({ muc: 3, tam: true }) === 'SOS 3 tạm', d.chuChipSos({ muc: 3, tam: true }));
    const tam = d.giaiThichSos({ muc: 1, tam: true, kyNang: ['S'] });
    assert(tam.tieuDe === 'Vì sao SOS 1 tạm' && /tạm thời/i.test(tam.phu ?? ''), JSON.stringify(tam));
    const thuong = d.giaiThichSos({ muc: 2, kyNang: ['Reading', 'Writing'], dot: 'Progress Test', thuong: true });
    assert(thuong.ketLuan === '2 môn chưa đạt ở Progress Test', thuong.ketLuan);
    const khong = d.giaiThichSos({ muc: 2 });
    assert(khong.ketLuan === 'Có 2 kỹ năng dưới kỳ vọng', khong.ketLuan);
    assert(d.giaiThichSos({ muc: 3 }).luat.includes('SOS 3 = 3–4'), 'luật SOS 3 = 3–4 kỹ năng');
  });

  check('OV15a · 2: chip SOS từ "Kết quả gần nhất" — FT kỹ năng dưới kỳ vọng + band, lớp thường môn trượt; không SOS → null', () => {
    const goc = { mode: 'ielts_band', attemptLabel: 'MT2', sosLevel: 2, provisional: false, scored: 4, required: 4, failed: 2, overall: 6.0, expectation: 6.5,
      belowSkills: [{ skill: 'writing', band: 6.0 }, { skill: 'speaking', band: 5.5 }], failedSkills: [] } as any;
    const c = d.chipSosTuKetQua(goc)!;
    assert(c.muc === 2 && c.kyNang!.join() === 'W,S' && c.dot === 'MT2', JSON.stringify(c));
    assert(JSON.stringify(c.soLieu) === JSON.stringify([['Kỳ vọng MT2', '6.5'], ['W', '6.0'], ['S', '5.5']]), JSON.stringify(c.soLieu));
    assert(d.chipSosTuKetQua({ ...goc, sosLevel: 0 }) === null && d.chipSosTuKetQua(null) === null, 'không SOS → null');
    const th = d.chipSosTuKetQua({ ...goc, mode: 'ratio', sosLevel: 1, belowSkills: [], failedSkills: [{ skill: 'reading', score: 12, total: 20 }] })!;
    assert(th.thuong === true && th.soLieu[0][1] === '12/20' && th.kyNang!.length === 1, JSON.stringify(th));
  });

  check('OV15a · 3: soKyVong — vượt / bằng / dưới (làm tròn 0.1), thiếu band hay kỳ vọng → null', () => {
    assert(d.soKyVong(6.5, 6.0) === 'vuot' && d.soKyVong(6.0, 6.0) === 'bang' && d.soKyVong(5.5, 6.0) === 'duoi', 'ba mức');
    assert(d.soKyVong(6.1 - 0.1, 6.0) === 'bang', 'sai số dấu phẩy động vẫn là bằng');
    assert(d.soKyVong(null, 6) === null && d.soKyVong(6, null) === null, 'thiếu → null');
  });

  check('OV15a · 8: hạn chỉ ghi NGÀY ("hạn 18/09") — không thứ (T2…T7, CN) ở mọi loại hạn', () => {
    const KINDS = ['xac-minh-sos', 'lap-pa', 'cap-nhat-pa', 'nhap-diem', 'viec-van-hanh', 'duyet', 'xu-ly-vi-pham', 'mini-test', 'phoi-hop', 'chot-len-ft', 'sau-thi'] as const;
    for (const kind of KINDS) {
      const v = d.deadlineView({ kind, due: '2026-09-29', today: '2026-09-23' });
      assert(v.han === 'hạn 29/09', `${kind}: "${v.han}"`);
      assert(!/\b(T[2-7]|CN)\b/.test(v.text), `${kind}: còn thứ trong "${v.text}"`);
    }
  });

  check('OV15a · 5: chipSauThi — "Đã thi · chờ KQ" → "Có KQ · chờ bước tiếp"; chưa thi / xong → null (hàng thường)', () => {
    assert(d.chipSauThi({ giaiDoan: 'da_thi_cho_kq' }) === 'Đã thi · chờ KQ', 'đã thi');
    assert(d.chipSauThi({ giaiDoan: 'cho_buoc_tiep' }) === 'Có KQ · chờ bước tiếp', 'có KQ');
    assert(d.chipSauThi({ giaiDoan: 'chua_thi' }) === null && d.chipSauThi({ giaiDoan: 'xong' }) === null && d.chipSauThi(null) === null, 'hàng thường');
  });

  check('OV15a · 7: giao diện — Theo máy (mặc định, theo prefers-color-scheme) · Sáng · Tối; script chống nháy đọc cả ba', () => {
    for (const v of [null, undefined, '', 'x', 'may']) assert(d.docLuaChonGiaoDien(v) === 'may', `${String(v)} → Theo máy`);
    assert(d.docLuaChonGiaoDien('light') === 'light' && d.docLuaChonGiaoDien('dark') === 'dark', 'giữ lựa chọn Sáng / Tối');
    assert(d.cheDoThuc('may', true) === 'dark' && d.cheDoThuc('may', false) === 'light', 'Theo máy đi theo máy');
    assert(d.cheDoThuc('light', true) === 'light' && d.cheDoThuc('dark', false) === 'dark', 'chọn tay thắng máy');
    const html = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');
    assert(html.includes(d.CHE_DO_KHOA) && /prefers-color-scheme: light/.test(html), 'index.html: chưa chọn → theo prefers-color-scheme');
  });

  check('OV15a · 7: thanh trên gọn — Giao diện, Ngôn ngữ, Hướng dẫn nằm trong menu tài khoản (không còn trên thanh)', () => {
    const hd = fs.readFileSync(path.join(REPO, 'web/src/modules/platform/Header.tsx'), 'utf8');
    const tk = hd.indexOf('ref={nutTaiKhoan}');
    for (const x of ['<CongTacGiaoDien', '<NutNgonNgu', "t('Hướng dẫn')"]) {
      const i = hd.indexOf(x);
      assert(i > tk, `${x} phải nằm trong menu tài khoản (sau nút tài khoản)`);
    }
    assert(!/<NutHuongDan\b/.test(hd) && !/!dienThoai && <CongTacGiaoDien/.test(hd) && !/!dienThoai && <NutNgonNgu/.test(hd), 'thanh trên còn ?, ◐ hoặc VI | EN');
  });
}
