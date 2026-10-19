/**
 * PHÉP KIỂM PR-UX0 — nền giao diện: màu nghĩa (N-1), hàng lớn/nhỏ (N-2), badge gọn (N-3), khuôn panel (N-4).
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database (trừ phép cần dữ liệu thật).
 * Spec: docs/superpowers/specs/2026-09-23-overhaul-giao-dien-design.md §1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const REPO = path.join(ROOT, '..');

export async function runNenGiaoDienTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-UX0 · Nền giao diện');

  const css = fs.readFileSync(path.join(REPO, 'web/src/index.css'), 'utf8');
  const mau = d.docMauCss(d.docKhoiCss(css, ':root'));

  check('UX0 · N-1: tuongPhan đúng công thức', () => {
    assert(d.tuongPhan('#000000', '#ffffff') === 21, `đen/trắng = ${d.tuongPhan('#000000', '#ffffff')}`);
    const x = d.tuongPhan('#ff9a9a', '#3b2126');
    assert(Math.abs(x - 7.22) <= 0.05, `#ff9a9a/#3b2126 = ${x}`);
    assert(d.tuongPhan([0, 0, 0], [255, 255, 255]) === 21, 'nhận cả [r,g,b]');
  });

  check('UX0 · N-1: mọi chữ màu nghĩa ≥ 4.5:1 trên nền badge của nó và trên mọi nền trang', () => {
    const hong: string[] = [];
    const cap = (chu: string, nen: string) => {
      const a = mau[chu], b = mau[nen];
      if (!a || !b) { hong.push(`thiếu token ${!a ? chu : nen}`); return; }
      const r = d.tuongPhan(a, b);
      if (r < 4.5) hong.push(`${chu} trên ${nen} = ${r}`);
    };
    const coNen = ['ok-rgb', 'done-rgb', 'bad-rgb', 'late-rgb', 'soon-rgb', 'doing-rgb', 'muted-rgb'];   // OV-15a bỏ wait
    for (const c of coNen) cap(c, c.replace('-rgb', '-bg-rgb'));
    const chu = [...coNen, 'text-dim-rgb', 'text-faint-rgb'];
    for (const c of chu) for (const n of ['bg', 'surface', 'surface-2', 'hang-lon-bg', 'hang-con-bg']) cap(c, n);
    assert(hong.length === 0, hong.join(' · '));
  });

  /* OV-15a: SOS tách token riêng (chỉ viền + chữ) — phép kiểm ở prOv15a; Đạt vẫn là bí danh của ok. */
  check('UX0 · N-1b: --dat là bí danh của ok; SOS 1/2/3 khác màu nhau', () => {
    const cung = (a: string, b: string) => mau[a] && mau[b] && mau[a].join() === mau[b].join();
    for (const [x, y] of [['dat', 'ok']] as const) {
      for (const hau of ['-rgb', '-bg-rgb', '-line-rgb']) assert(cung(x + hau, y + hau), `--${x}${hau} phải bằng --${y}${hau}`);
      assert(css.includes(`--${x}-rgb: var(--${y}-rgb);`), `--${x}-rgb phải là var(--${y}-rgb), không chép hex`);
    }
    assert(!cung('sos1-rgb', 'sos2-rgb') && !cung('sos2-rgb', 'sos3-rgb'), 'SOS 1/2/3 phải khác màu nhau');
  });

  check('UX0 · N-1: một chỗ khai báo — component nền không chứa hex hay màu Tailwind cứng', () => {
    const hong: string[] = [];
    for (const f of ['web/src/ui/ui.tsx', 'web/src/ui/Han.tsx', 'web/src/ui/Nhan.tsx', 'web/src/ui/HangNhom.tsx', 'web/src/ui/KhungPanel.tsx', 'web/src/modules/students/MissingBadge.tsx']) {
      const p = path.join(REPO, f);
      if (!fs.existsSync(p)) continue;
      const text = fs.readFileSync(p, 'utf8');
      if (/#[0-9a-f]{6}\b/i.test(text)) hong.push(`${f}: có mã hex`);
      const m = /\b(rose|amber|sky|emerald)-\d/.exec(text);
      if (m) hong.push(`${f}: có "${m[0]}"`);
    }
    assert(hong.length === 0, hong.join(' · '));
  });

  /* PR-YT4 (K5-24): hai loại hạn Ý thức cũ đã bỏ, thay bằng `xu-ly-vi-pham`. */
  const KINDS = ['xac-minh-sos', 'lap-pa', 'cap-nhat-pa', 'xu-ly-vi-pham', 'nhap-diem', 'du-kien-ket-thuc', 'viec-van-hanh'] as const;

  check('UX0 · N-3: hạn hôm nay là "hôm nay", không quá hạn, không ⚠', () => {
    const v = d.deadlineView({ kind: 'nhap-diem', due: '2026-09-23', today: '2026-09-23' });
    assert(v.homNay === true && v.tone !== 'overdue' && v.quaHan === null, `homNay=${v.homNay} tone=${v.tone}`);
    assert(!/⚠/.test(v.text) && /hôm nay/.test(v.text), `text: "${v.text}"`);
    assert(d.deadlineView({ kind: 'du-kien-ket-thuc', due: '2026-09-23', today: '2026-09-23' }).homNay === false, 'dự kiến không có "hôm nay"');
  });

  check('UX0 · N-3: không mảnh nào lặp chữ "quá hạn" hai lần và không có năm khi cùng năm', () => {
    for (const kind of KINDS) {
      for (const due of ['2026-10-05', '2026-09-23', '2026-09-08']) {
        const v = d.deadlineView({ kind, due, reschedule: '2026-10-12', today: '2026-09-23' });
        assert((v.text.match(/quá hạn/g) ?? []).length <= 1, `${kind} ${due}: "${v.text}"`);
        assert(!/\/2026/.test(v.text) && !/\/2026/.test(v.han), `${kind} ${due}: có năm trong "${v.text}"`);
      }
    }
  });

  // ---------------------------------------------------------------- Việc cần làm (máy chủ)
  const { conn } = t;
  const myworkSvc: any = await import('../worklist/mywork.ts');
  const nguoiXem = Object.entries(t.P).filter(([k]) => /manager|teacher/i.test(k)).map(([, v]) => v);

  /* PR-LCb: "Xếp lớp tiếp" (placement) gộp vào "Chốt lộ trình" có hạn thật (CN trước tuần Final) — giữ ý: không hạn thì không bao giờ quá hạn. */
  check('UX0 · N-3: "Chốt lộ trình" chỉ quá hạn khi hạn đã qua (không hạn → không bao giờ quá hạn); chữ việc không tự ghi "quá hạn"', () => {
    let thay = 0;
    for (const who of nguoiXem) {
      for (const g of myworkSvc.myWork(who, {}).groups as any[]) {
        if (g.key !== 'chot_len_ft') continue;   // PR-VAI-a (Q27): việc next_step đã bỏ
        for (const it of g.items) {
          thay++;
          assert((it.urgency === 'overdue') === (!!it.due && it.due < t.TODAY), `${g.key} ${it.key}: quá hạn ${it.urgency} · hạn ${it.due}`);
          assert(!/quá hạn/i.test(`${it.reason} ${it.statusLabel} ${it.tieuDe}`), `${it.key}: còn chữ "quá hạn"`);
        }
      }
    }
    assert(thay >= 1, 'Dữ liệu mẫu phải có ít nhất một việc xếp lớp / lộ trình để kiểm');
  });

  check('UX0 · #13: việc của lớp thường ghi Progress Test/Final Test, không "MT"', () => {
    const ratio = new Set((conn.prepare(
      `SELECT c.id FROM classes c JOIN programmes p ON p.code = c.programme_code WHERE p.scoring_mode = 'ratio'`,
    ).all() as any[]).map((r) => r.id as number));
    assert(ratio.size >= 1, 'Dữ liệu mẫu phải có lớp thường (scoring_mode = ratio)');
    let thay = 0;
    for (const who of nguoiXem) {
      for (const it of (myworkSvc.myWork(who, {}).groups as any[]).flatMap((g) => g.items)) {
        if (it.classId === null || !ratio.has(it.classId) || !it.contextLabel) continue;
        thay++;
        assert(!/^MT\d/.test(it.contextLabel), `${it.key} của lớp thường còn nhãn "${it.contextLabel}"`);
      }
    }
    assert(thay >= 1, 'Dữ liệu mẫu phải có việc của lớp thường có nhãn đợt để kiểm');
  });

  check('UX0 · N-3: badge hộp lớp là danh từ + số, câu cũ vào tooltip', () => {
    const goc = { vai: 'gv' as const, needsPlacement: true, canXepLop: 4, soChuaLoTrinhTiep: 5, missingSkills: ['writing'], soBaiChoCham: 9,
      needScoresTitle: 'Lớp còn 9 bài chưa nhập điểm', phase: 'final_week', missingCount: 2, soChoDuyet: 2, soViecQuaHan: 3 };
    const b = d.badgeLop(goc);
    const tatCa = [...b.hien, ...b.an];
    assert(tatCa.length === 7, `Bộ đủ phải có 7 badge, đang ${tatCa.length}`);
    const cham = tatCa.find((x: any) => x.key === 'cham')!;
    assert(cham.nhan === '9 bài chờ chấm' && cham.title === 'Lớp còn 9 bài chưa nhập điểm', JSON.stringify(cham));
    // Miễn: `chang` (tên chặng thi, chữ chốt ở PR-LT/PR-Qa), `xep-lop` ("n HV cần xếp lớp tiếp") và `qua-han` ("n HV quá hạn việc") — chữ chốt ở PR-HVL (B4), "HV" là viết tắt.
    for (const x of tatCa) {
      if (x.key === 'chang' || x.key === 'xep-lop' || x.key === 'qua-han') continue;
      const tu = x.nhan.split(/\s+/).filter((w: string) => !/^\d+$/.test(w));
      assert(tu.length <= 3, `${x.key}: "${x.nhan}" quá 3 từ`);
    }
    assert(!tatCa.some((x: any) => x.key === 'case'), 'Không còn badge "Case mở" (K2-06)');
    assert(tatCa.find((x: any) => x.key === 'xep-lop')!.nhan === '4 HV cần xếp lớp tiếp', 'Cần xếp lớp tiếp');
    assert(tatCa.find((x: any) => x.key === 'cho-duyet')!.nhan === '2 chờ duyệt', 'Chờ duyệt');
  });

  check('UX0 · N-4: mở panel thứ hai thì panel thứ nhất bị đóng, không bao giờ hai panel', () => {
    const kho = d.taoKhoPanel();
    let dongA = 0, dongB = 0;
    kho.mo('A', () => { dongA++; });
    assert(kho.dangMo() === 'A', 'A phải đang mở');
    kho.mo('B', () => { dongB++; });
    assert(dongA === 1, `dong của A phải gọi đúng 1 lần, đang ${dongA}`);
    assert(kho.dangMo() === 'B' && dongB === 0, `B phải là panel duy nhất (đang mở: ${kho.dangMo()}), dong của B chưa gọi (${dongB})`);
    kho.mo('B', () => { dongB++; });
    assert(dongB === 0, 'Mở lại đúng panel đang mở không tự đóng nó');
  });

  check('UX0 · N-4: đóng panel cũ sau khi panel mới đã mở không đóng nhầm panel mới', () => {
    const kho = d.taoKhoPanel();
    let dongB = 0;
    kho.mo('A', () => undefined);
    kho.mo('B', () => { dongB++; });
    kho.dong('A');   // cleanup của A chạy muộn
    assert(kho.dangMo() === 'B' && dongB === 0, `B phải còn mở (đang ${kho.dangMo()}), dong của B chưa gọi (${dongB})`);
    kho.dong('B');
    assert(kho.dangMo() === null, 'Đóng B thì không còn panel nào');
  });
}

