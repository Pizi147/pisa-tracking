/**
 * PHÉP KIỂM PR-HV — hồ sơ học viên 3 tab + Ý thức & Phối hợp theo prototype v3 (spec 2026-09-22).
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
// dist-server/server/src/tests → gốc repo. Kiểm lại bằng assert số file ở dưới; sai thì chỉnh số '..'.

/**
 * File đóng băng vì PR-Z2b chạy song song — Task 9 XOÁ danh sách này (để mảng rỗng).
 * `server/src/ops/` cũng đóng băng (Global Constraints 🧊) dù plan gốc không liệt kê ở đây — `ops/initBanChinh.ts` có
 * hai chỗ "hãy" (🆕 22/09), làm ở Task 9 cùng ba file kia.
 */
const CHO_Z2B = ['server/src/yThuc/measures.ts', 'server/src/migrate.ts', 'server/src/seed/', 'server/src/ops/'];
/** Dòng được phép giữ chữ cũ (không phải chữ người dùng thấy). Mỗi mục: [đường dẫn, chuỗi con của dòng]. */
const CHO_PHEP: Array<[string, string]> = [];

function boChuThich(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')          // /* … */ và {/* … */}
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1');     // // … (không cắt 'http://')
}
const CHU_CU: Array<[string, RegExp]> = [
  ['biện pháp', /[Bb]iện pháp|BIỆN PHÁP/],
  ['BP', /(^|[^A-Za-z0-9_])BP([^A-Za-z0-9_]|$)/],
  ['Hãy', /(^|[^\p{L}])[Hh]ãy\s/u],
];

export async function runHoSoHocVienTests(t: YThucTestKit) {
  const { check, assert } = t;
  console.log('\nPR-HV · Hồ sơ học viên 3 tab + Ý thức & Phối hợp v3');

  check('PR-HV · D1/D3 Chữ người dùng thấy không còn "biện pháp", "BP", "Hãy" (chú thích được giữ)', () => {
    const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === 'tests' || e.name === 'node_modules' ? [] : walk(p);
      return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
    });
    const files = ['web/src', 'shared', 'server/src'].flatMap((d) => walk(path.join(ROOT, d)))
      .map((f) => path.relative(ROOT, f).replace(/\\/g, '/'))
      .filter((f) => !CHO_Z2B.some((z) => f.startsWith(z)));
    assert(files.length > 80, `Quét quá ít file (${files.length}) — sai ROOT?`);
    const hits: string[] = [];
    for (const f of files) {
      const lines = boChuThich(fs.readFileSync(path.join(ROOT, f), 'utf8')).split('\n');
      lines.forEach((line, i) => {
        if (CHO_PHEP.some(([pf, s]) => pf === f && line.includes(s))) return;
        for (const [ten, re] of CHU_CU) if (re.test(line)) hits.push(`${f}:${i + 1} "${ten}": ${line.trim().slice(0, 90)}`);
      });
    }
    assert(hits.length === 0, `Còn ${hits.length} chỗ:\n    ${hits.join('\n    ')}`);
  });

  // ================================================================== Task 2 — khung 3 tab, ?tab=

  const domain: any = await import('../../../shared/domain/index.ts');

  check('PR-HV · A6 ?tab= đọc đúng ba giá trị, mọi giá trị khác về Học thuật', () => {
    assert(JSON.stringify(domain.HO_SO_TABS) === JSON.stringify(['hoc-thuat', 'y-thuc', 'hanh-trinh']), 'Ba tab đúng thứ tự');
    assert(domain.HO_SO_TAB_LABEL['hoc-thuat'] === 'Học thuật' && domain.HO_SO_TAB_LABEL['y-thuc'] === 'Ý thức & Phối hợp'
      && domain.HO_SO_TAB_LABEL['hanh-trinh'] === 'Hành trình', 'Nhãn ba tab');
    for (const k of ['y-thuc', 'hanh-trinh', 'hoc-thuat']) assert(domain.parseHoSoTab(k) === k, `Giá trị hợp lệ ${k} phải giữ nguyên`);
    for (const v of [null, undefined, '', 'Y-THUC', 'tong-quan', ' y-thuc']) {
      assert(domain.parseHoSoTab(v) === 'hoc-thuat', `Giá trị lạ ${JSON.stringify(v)} phải về hoc-thuat, được ${domain.parseHoSoTab(v)}`);
    }
  });

  // ================================================================== Task 3 — Q7 bốn ô số

  check('PR-HV · Q7 Ô "Kết quả Test gần nhất": lượt số lớn nhất có điểm, không bịa Overall cho lớp Normal', () => {
    const L = (o: Record<string, unknown>) => ({
      id: o.attemptNo, kind: 'mock', status: 'done', periodCode: 'W2 SEP', mode: 'ielts',
      scored: 4, required: 4, complete: true, overall: 6, expectation: 5.5, sosLevel: 0, ...o,
    });
    const f = domain.ketQuaTestGanNhat;
    let k = f([L({ attemptNo: 3 }), L({ attemptNo: 2 })]);
    assert(k && k.dat === true && k.nhan === 'MT3 · W2 SEP' && k.attemptId === 3 && k.coDiem === 4 && k.yeuCau === 4 && k.sos === 0 && k.dungKetQuaDot === true, `(a) FT đủ, đạt: ${JSON.stringify(k)}`);
    k = f([L({ attemptNo: 3, overall: 5 })]);
    assert(k && k.dat === false, `(b) FT đủ, dưới kỳ vọng → dat false: ${JSON.stringify(k)}`);
    k = f([L({ attemptNo: 3, scored: 2, complete: false, overall: null, sosLevel: 1 })]);
    assert(k && k.dat === null && k.coDiem === 2 && k.yeuCau === 4 && k.sos === 1, `(c) FT mới 2/4 → dat null: ${JSON.stringify(k)}`);
    k = f([L({ attemptNo: 3, status: 'cancelled' }), L({ attemptNo: 2 })]);
    assert(k && k.attemptId === 2 && k.nhan === 'MT2 · W2 SEP', `(d) lượt mới nhất bị huỷ → lấy lượt trước: ${JSON.stringify(k)}`);
    k = f([L({ attemptNo: 3, scored: 0, complete: false, overall: null }), L({ attemptNo: 2 })]);
    assert(k && k.attemptId === 2, `(e) lượt mới nhất chưa có điểm → lấy lượt trước: ${JSON.stringify(k)}`);
    assert(f([L({ attemptNo: 1, scored: 0, complete: false })]) === null && f([]) === null, '(f) không lượt nào có điểm → null');
    k = f([L({ attemptNo: 1, kind: 'progress', mode: 'ratio', overall: null, expectation: null, sosLevel: 0, periodCode: 'W3 SEP' })]);
    assert(k && k.dat === true && k.nhan === 'Giữa khoá · W3 SEP', `(g) Normal đủ, SOS 0 → đạt, nhãn Giữa khoá: ${JSON.stringify(k)}`);
    k = f([L({ attemptNo: 2, kind: 'final', mode: 'ratio', overall: null, expectation: null, sosLevel: null, scored: 2, complete: false, periodCode: null })]);
    assert(k && k.dat === null && k.nhan === 'Cuối khoá', `(h) Normal thiếu → dat null, nhãn Cuối khoá không tuần: ${JSON.stringify(k)}`);
    k = f([L({ attemptNo: 1, mode: 'ratio', required: 5, scored: 5, overall: null, expectation: null })]);
    assert(k && k.dungKetQuaDot === false && k.yeuCau === 5, `(i) required 5 → không dùng KetQuaDot: ${JSON.stringify(k)}`);
    k = f([L({ attemptNo: 1 }), L({ attemptNo: 2 }), L({ attemptNo: 3 })]);
    assert(k && k.attemptId === 3, `(j) thứ tự vào tăng dần vẫn lấy lượt số lớn nhất: ${JSON.stringify(k)}`);
    k = f([L({ attemptNo: 2, periodCode: null })]);
    assert(k && k.nhan === 'MT2', `(k) không có tuần → chỉ MT2: ${JSON.stringify(k)}`);
  });

  check('PR-HV · Q7 quaHan: hạn đúng hôm nay CHƯA quá hạn; hạn hôm qua quá hạn; không hạn thì không', () => {
    assert(domain.quaHan('2026-09-14', '2026-09-14') === false, 'Hạn = hôm nay chưa quá hạn');
    assert(domain.quaHan('2026-09-13', '2026-09-14') === true, 'Hạn hôm qua đã quá hạn');
    assert(domain.quaHan('2026-09-15', '2026-09-14') === false, 'Hạn ngày mai chưa quá hạn');
    assert(domain.quaHan(null, '2026-09-14') === false && domain.quaHan(undefined, '2026-09-14') === false && domain.quaHan('', '2026-09-14') === false, 'Không có hạn → false');
  });

  await t.checkAsync('PR-HV · Q7 Ô "Việc cần làm tiếp": câu bắt đầu bằng động từ, có cờ quá hạn đúng', async () => {
    const profile: any = await import('../students/profile.ts');
    const max = t.seedMax.sos_cases ?? Number.MAX_SAFE_INTEGER;
    const pairs = t.conn.prepare("SELECT DISTINCT student_id, cycle_id FROM sos_cases WHERE status != 'done' AND id <= ?").all(max) as any[];
    assert(pairs.length > 0, 'Bộ demo phải có học viên đang có case mở');
    let coNext = 0;
    for (const { student_id, cycle_id } of pairs) {
      const next = profile.studentProfile(t.P.admin, student_id, cycle_id).headline?.next ?? null;
      if (!next) continue;
      coNext++;
      assert(typeof next.overdue === 'boolean', `HV ${student_id}: next.overdue phải là boolean: ${JSON.stringify(next)}`);
      assert(next.overdue === (next.due !== null && next.due < t.TODAY), `HV ${student_id}: overdue phải = (due < hôm nay ${t.TODAY}): ${JSON.stringify(next)}`);
      assert(/^(Xác minh SOS|Đề ra PA|Làm PA|Chờ Quản lý duyệt PA|Cập nhật PA) /.test(next.text), `HV ${student_id}: câu phải bắt đầu bằng động từ: "${next.text}"`);
    }
    assert(coNext > 0, 'Phải có ít nhất một học viên có việc cần làm tiếp');
  });
}
