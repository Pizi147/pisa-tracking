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

/** Đóng băng vì PR-Z2b chạy song song — Z2b đã gộp (Task 9), danh sách rỗng và giữ lại chỉ để nhắc lịch sử. */
const CHO_Z2B: string[] = [];
/**
 * Loại trừ VĨNH VIỄN: dữ liệu kể chuyện của bộ demo (`server/src/seed/*`), không phải chữ giao diện — TRỪ `seed.ts`
 * (in bảng tổng kết ra màn hình lệnh) và `duLieuNen.ts` (dữ liệu nền của BẢN CHÍNH, PR-Z2b thêm) vẫn quét.
 */
const LOAI_TRU = (f: string) => f.startsWith('server/src/seed/') && f !== 'server/src/seed/seed.ts' && f !== 'server/src/seed/duLieuNen.ts';
/**
 * Dòng được phép giữ chữ cũ (không phải chữ người dùng thấy). Mỗi mục: [đường dẫn, chuỗi con của dòng].
 * `migrate.ts`: chú thích SQL (`-- …`) nằm TRONG chuỗi DDL chép từ `schema.sql` — đổi không đem lại gì cho người dùng, có rủi ro
 * với phép so schema (Task 9 Step 4).
 */
const CHO_PHEP: Array<[string, string]> = [
  ['server/src/migrate.ts', "-- Chỉ dùng khi kind = 'other'"],
  ['server/src/migrate.ts', '-- chính xác thì số này KHÔNG đổi'],
  ['server/src/migrate.ts', '-- MỘT vi phạm gắn NHIỀU biện pháp'],
  ['server/src/migrate.ts', '-- Ví dụ thật phải chạy được'],
];

function boChuThich(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')          // /* … */ và {/* … */}
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1');     // // … (không cắt 'http://')
}
const CHU_CU: Array<[string, RegExp]> = [
  ['biện pháp', /[Bb]iện pháp|BIỆN PHÁP/],
  ['BP', /(^|[^A-Za-z0-9_])BP([^A-Za-z0-9_]|$)/],
  ['Hãy', /(^|[^\p{L}])[Hh]ãy(\s|\p{P}|$)/u],
];

export async function runHoSoHocVienTests(t: YThucTestKit) {
  const { check, assert } = t;
  console.log('\nPR-HV · Hồ sơ học viên 3 tab + Ý thức & Phối hợp v3');

  check('PR-HV · D1/D3 Chữ người dùng thấy không còn "biện pháp", "BP", "Hãy" (chú thích được giữ)', () => {
    const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === 'tests' || e.name === 'node_modules' ? [] : walk(p);
      return /\.(ts|tsx|mjs)$/.test(e.name) ? [p] : [];
    });
    const files = ['web/src', 'shared', 'server/src', 'scripts'].flatMap((d) => walk(path.join(ROOT, d)))
      .map((f) => path.relative(ROOT, f).replace(/\\/g, '/'))
      .filter((f) => !CHO_Z2B.some((z) => f.startsWith(z)) && !LOAI_TRU(f));
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
      id: o.attemptNo, kind: 'mock', status: 'done', weekStart: '2026-09-07', mode: 'ielts',
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
    k = f([L({ attemptNo: 1, kind: 'progress', mode: 'ratio', overall: null, expectation: null, sosLevel: 0, weekStart: '2026-09-14' })]);
    assert(k && k.dat === true && k.nhan === 'Progress Test · W3 SEP', `(g) Normal đủ, SOS 0 → đạt, nhãn Progress Test: ${JSON.stringify(k)}`);
    k = f([L({ attemptNo: 2, kind: 'final', mode: 'ratio', overall: null, expectation: null, sosLevel: null, scored: 2, complete: false, weekStart: null })]);
    assert(k && k.dat === null && k.nhan === 'Final Test', `(h) Normal thiếu → dat null, nhãn Final Test không tuần: ${JSON.stringify(k)}`);
    k = f([L({ attemptNo: 1, mode: 'ratio', required: 5, scored: 5, overall: null, expectation: null })]);
    assert(k && k.dungKetQuaDot === false && k.yeuCau === 5, `(i) required 5 → không dùng KetQuaDot: ${JSON.stringify(k)}`);
    k = f([L({ attemptNo: 1 }), L({ attemptNo: 2 }), L({ attemptNo: 3 })]);
    assert(k && k.attemptId === 3, `(j) thứ tự vào tăng dần vẫn lấy lượt số lớn nhất: ${JSON.stringify(k)}`);
    k = f([L({ attemptNo: 2, weekStart: null })]);
    assert(k && k.nhan === 'MT2', `(k) không có tuần → chỉ MT2: ${JSON.stringify(k)}`);
  });

  check('PR-HV · Q7 quaHan: hạn đúng hôm nay CHƯA quá hạn; hạn hôm qua quá hạn; không hạn thì không', () => {
    assert(domain.quaHan('2026-09-14', '2026-09-14') === false, 'Hạn = hôm nay chưa quá hạn');
    assert(domain.quaHan('2026-09-13', '2026-09-14') === true, 'Hạn hôm qua đã quá hạn');
    assert(domain.quaHan('2026-09-15', '2026-09-14') === false, 'Hạn ngày mai chưa quá hạn');
    assert(domain.quaHan(null, '2026-09-14') === false && domain.quaHan(undefined, '2026-09-14') === false && domain.quaHan('', '2026-09-14') === false, 'Không có hạn → false');
  });

  /* PR-VAI-b (Q5): ô "Việc cần làm tiếp" (`headline.next`) → thanh việc `dauHoSo.viec` — cùng ý: câu bắt đầu bằng động từ, cờ quá hạn đúng,
     tên kỹ năng đầy đủ; thứ tự nay theo hạn (quá hạn → hạn sớm → không hạn, T72). */
  await t.checkAsync('PR-HV · Q7 → VAI-b: việc ở đầu hồ sơ bắt đầu bằng động từ, quá hạn đúng, tên kỹ năng đầy đủ, xếp theo hạn', async () => {
    const profile: any = await import('../students/profile.ts');
    const max = t.seedMax.sos_cases ?? Number.MAX_SAFE_INTEGER;
    const pairs = t.conn.prepare("SELECT DISTINCT student_id, cycle_id FROM sos_cases WHERE status != 'done' AND id <= ?").all(max) as any[];
    assert(pairs.length > 0, 'Bộ demo phải có học viên đang có case mở');
    let coViec = 0;
    for (const { student_id, cycle_id } of pairs) {
      const v = profile.studentProfile(t.P.admin, student_id, cycle_id).dauHoSo.viec;
      const tatCa = [...v.cuaBan, ...v.nguoiKhac];
      coViec += tatCa.length;
      for (const x of tatCa) {
        assert((x.quaHanNgay !== null) === (x.han !== null && x.han < t.TODAY), `HV ${student_id}: quaHanNgay phải = (hạn < hôm nay ${t.TODAY}): ${JSON.stringify(x)}`);
        if (x.loai !== 'cho-duyet' && x.loai !== 'buoc-tiep') {   // SEED-UX: dòng Chọn bước tiếp hiện nhãn kết quả "Đã xong · OVR …" (OV-13m)
          assert(/^(Xác nhận Case|Thêm PA|Xác nhận PA|Kết quả|Nộp kế hoạch bổ trợ|Báo phụ huynh|Ghi Mini Test|Xác nhận xử lý|Ghi nhận|Ghi "Đã thực hiện"|Bàn giao) /.test(x.chu), `HV ${student_id}: câu phải bắt đầu bằng động từ: "${x.chu}"`);
        }
        /* Mục 3 (chủ sản phẩm 22/09): tên kỹ năng ĐẦY ĐỦ, không viết tắt L / R / W1 / W2 / S. */
        assert(!/ (L|R|W|W1|W2|S)$/.test(x.chu), `HV ${student_id}: câu phải dùng tên đầy đủ của kỹ năng: "${x.chu}"`);
      }
      for (const ds of [v.cuaBan, v.nguoiKhac]) {
        const han = ds.map((x: any) => x.han ?? '9999');
        assert(han.every((h: string, i: number) => i === 0 || han[i - 1] <= h), `HV ${student_id}: việc phải xếp theo hạn: ${han}`);
      }
    }
    assert(coViec > 0, 'Phải có ít nhất một học viên có việc ở đầu hồ sơ');
  });

  await t.checkAsync('PR-HV · Q7 (mục 1) → PR-SOS → VAI-b: Case từ SOS chờ nguyên nhân → đầu hồ sơ có việc "Xác nhận Case {kỹ năng}" (Progress) / "Ghi nhận xét {kỹ năng}" (MT cũ chưa nhận xét — OV-12c), hạn = hạn xác nhận', async () => {
    const profile: any = await import('../students/profile.ts');
    const casesMod: any = await import('../cases/cases.ts');
    const max = t.seedMax.sos_cases ?? Number.MAX_SAFE_INTEGER;
    const pairs = t.conn.prepare("SELECT DISTINCT student_id, cycle_id FROM sos_cases WHERE status != 'done' AND id <= ?").all(max) as any[];
    let n = 0;
    for (const { student_id, cycle_id } of pairs) {
      const rows = (casesMod.skillSupportBoard(t.P.admin, student_id, cycle_id) as any).rows as any[];
      const cho = rows.flatMap((r) => r.cases.filter((c: any) => c.status !== 'done' && (c.sos?.awaitingCause || c.sos?.choNhanXet)).map((c: any) => ({ r, c })));
      const v = profile.studentProfile(t.P.admin, student_id, cycle_id).dauHoSo.viec;
      const tatCa = [...v.cuaBan, ...v.nguoiKhac];
      for (const { r, c } of cho) {
        n++;
        const [khoa, chu] = c.sos.choNhanXet ? ['ghi_nhan_xet', 'Ghi nhận xét'] : ['cause', 'Xác nhận Case'];
        const x = tatCa.find((y: any) => y.key === `${khoa}:${c.id}`);
        assert(x, `HV ${student_id}: có case chờ xác định nguyên nhân mà đầu hồ sơ không có việc`);
        assert(x.chu === `${chu} ${r.label}` && x.han === (c.sos.dueOn ?? null), `HV ${student_id}: mong "${chu} ${r.label}" hạn ${c.sos.dueOn}, được ${JSON.stringify(x)}`);
      }
      /* PR-N1 S4-1: PA quy chế tự chạy — không còn việc "Xác nhận PA gợi ý". */
      assert(!tatCa.some((x: any) => /Xác nhận PA gợi ý/.test(x.chu)), `HV ${student_id}: còn "Xác nhận PA gợi ý"`);
    }
    assert(n > 0, 'Bộ demo phải có học viên có case từ SOS chờ xác định nguyên nhân (ba em mới của sosV3Seed)');
  });

  // ================================================================== Task 4 — thành phần dùng chung

  check('PR-HV · A3 Đếm vi phạm theo nhóm: đúng thứ tự năm nhóm, bỏ nhóm 0', () => {
    const r = domain.demTheoNhomViPham([{ category: 'attendance' }, { category: 'homework' }, { category: 'homework' }]);
    assert(r.tong === 3, `tong phải 3: ${JSON.stringify(r)}`);
    /* Thứ tự theo VIOLATION_CATEGORIES thật: attendance (Chuyên cần) đứng trước homework (BTVN). */
    assert(JSON.stringify(r.nhom) === JSON.stringify([
      { category: 'attendance', label: domain.VIOLATION_CATEGORY_LABEL.attendance, n: 1 },
      { category: 'homework', label: domain.VIOLATION_CATEGORY_LABEL.homework, n: 2 },
    ]), `nhóm phải theo thứ tự VIOLATION_CATEGORIES và bỏ nhóm 0: ${JSON.stringify(r.nhom)}`);
    assert(r.nhom[0].label === 'Chuyên cần' && r.nhom[1].label === 'BTVN', 'Nhãn lấy từ VIOLATION_CATEGORY_LABEL');
    const rong = domain.demTheoNhomViPham([]);
    assert(rong.tong === 0 && rong.nhom.length === 0, 'Rỗng → {tong: 0, nhom: []}');
    const la = domain.demTheoNhomViPham([{ category: 'other' }, { category: 'khong-co' }]);
    assert(la.tong === 2 && la.nhom.length === 1 && la.nhom[0].category === 'other', `Mã lạ vẫn tính vào tổng nhưng không có nhóm: ${JSON.stringify(la)}`);
  });

  // ================================================================== Task 6 — Q8 thẻ case, khối phương án

  const PA = (o: Record<string, unknown>) => ({
    status: 'started', lastOutcome: null, preset: false, confirmedAt: '2026-08-01T00:00:00Z', pendingApproval: false,
    approvalDue: null, actionDue: null, actionOverdue: false, completedOn: null, ...o,
  });
  const CASE = { status: 'in_progress', followUntil: '2026-08-30', followOverdue: false };

  check('PR-HV · Q8 Tiến độ case "k/n PA có kết quả" và việc tiếp theo', () => {
    const f = domain.tienDoCase;
    let r = f([PA({ lastOutcome: 'improved' }), PA({})], CASE);
    assert(r.coKetQua === 1 && r.tong === 2 && r.text === '2 PA · 1 có kết quả', `(a) 2 PA, 1 có kết quả: ${JSON.stringify(r)}`);
    r = f([], CASE);
    assert(r.text === 'Chưa có PA' && r.tiep && r.tiep.text === 'Kết quả PA' && r.tiep.due === '2026-08-30' && r.tiep.overdue === false, `(b) 0 PA → tiep theo followUntil: ${JSON.stringify(r)}`);
    r = f([PA({ actionDue: '2026-08-25' }), PA({ preset: true, confirmedAt: null })], CASE);
    assert(r.tiep && r.tiep.text === 'Kết quả PA' && r.tiep.due === '2026-08-25', `(c) PR-N1 S4-1: không còn nhánh "PA gợi ý chờ xác nhận" — PA có hạn là việc tiếp: ${JSON.stringify(r.tiep)}`);
    r = f([PA({ actionDue: '2026-08-30' }), PA({ actionDue: '2026-08-25', actionOverdue: true })], CASE);
    assert(r.tiep && r.tiep.text === 'Kết quả PA' && r.tiep.due === '2026-08-25' && r.tiep.overdue === true, `(d) hai PA có hạn → lấy hạn sớm nhất + cờ quá hạn của PA đó: ${JSON.stringify(r.tiep)}`);
    r = f([PA({ actionDue: null, followupDue: '2026-09-30' } as any)], CASE);
    assert(r.tiep && r.tiep.text === 'Kết quả PA' && r.tiep.due === '2026-08-30', `(e) chỉ có followupDue → KHÔNG lấy làm hạn, rơi về followUntil: ${JSON.stringify(r.tiep)}`);
    r = f([PA({ lastOutcome: 'improved', status: 'completed', completedOn: '2026-08-20' })], { status: 'done', followUntil: null, followOverdue: false });
    assert(r.tiep === null && r.text === '1 PA · đủ kết quả', `(f) case done → tiep null: ${JSON.stringify(r)}`);
    r = f([PA({ pendingApproval: true, approvalDue: '2026-09-01' })], CASE);
    assert(r.tiep && r.tiep.text === 'Chờ Quản lý trả lời' && r.tiep.due === '2026-09-01' && r.tiep.overdue === false, `(g) PA chờ duyệt: ${JSON.stringify(r.tiep)}`);
    r = f([PA({ status: 'completed', completedOn: '2026-08-20', actionDue: '2026-08-10', actionOverdue: true })], { status: 'in_progress', followUntil: null, followOverdue: false });
    assert(r.tiep === null, `(h) PA đã xong không được tính là việc tiếp; không followUntil → null: ${JSON.stringify(r.tiep)}`);
    /* Mục 2 (chủ sản phẩm 22/09): PA đang chạy ĐÃ QUÁ HẠN đứng trước "chờ Quản lý trả lời" (và PA quy chế — PR-N1). */
    r = f([PA({ pendingApproval: true, approvalDue: '2026-09-30' }), PA({ actionDue: '2026-08-10', actionOverdue: true })], CASE);
    assert(r.tiep && r.tiep.text === 'Kết quả PA' && r.tiep.due === '2026-08-10' && r.tiep.overdue === true, `(i) PA quá hạn thắng PA chờ duyệt: ${JSON.stringify(r.tiep)}`);
    r = f([PA({ preset: true, confirmedAt: null }), PA({ actionDue: '2026-08-10', actionOverdue: true })], CASE);
    assert(r.tiep && r.tiep.text === 'Kết quả PA' && r.tiep.overdue === true, `(j) PA quá hạn thắng PA quy chế: ${JSON.stringify(r.tiep)}`);
    r = f([PA({ actionDue: '2026-08-25', actionOverdue: true }), PA({ actionDue: '2026-08-10', actionOverdue: true })], CASE);
    assert(r.tiep && r.tiep.due === '2026-08-10', `(k) hai PA quá hạn → hạn sớm nhất: ${JSON.stringify(r.tiep)}`);
  });

  check('PR-HV · Q8 Việc tiếp theo của một PA: ba nhánh (PR-N1 S4-1 bỏ nhánh "Gợi ý tự động · chờ xác nhận")', () => {
    const f = domain.viecTiepPhuongAn;
    let v = f(PA({ preset: true, confirmedAt: '2026-09-28T01:00:00Z', actionDue: '2026-10-05' }));
    assert(v.loai === 'ghi-ket-qua' && v.text === 'Kết quả PA' && v.due === '2026-10-05' && v.overdue === false, `PA quy chế đang chạy = Ghi kết quả: ${JSON.stringify(v)}`);
    v = f(PA({ pendingApproval: true, approvalDue: '2026-09-01' }));
    assert(v.loai === 'cho-duyet' && v.text === 'Chờ Quản lý trả lời' && v.due === '2026-09-01', `chờ duyệt: ${JSON.stringify(v)}`);
    v = f(PA({ status: 'planned', actionDue: '2026-08-25', actionOverdue: true }));
    assert(v.loai === 'ghi-ket-qua' && v.text === 'Kết quả PA' && v.due === '2026-08-25' && v.overdue === true, `ghi kết quả: ${JSON.stringify(v)}`);
    v = f(PA({ status: 'completed', completedOn: '2026-08-20' }));
    assert(v.loai === 'da-xong' && v.text === 'Đã kết thúc' && v.due === '2026-08-20' && v.overdue === false, `đã xong: ${JSON.stringify(v)}`);
    assert(domain.dangChay({ status: 'planned' }) && domain.dangChay({ status: 'started' }) && !domain.dangChay({ status: 'completed' }), 'dangChay: planned/started');
  });

  await t.checkAsync('PR-HV · Q8 Thẻ case có số bằng chứng (attachmentCount) khớp bảng attachments', async () => {
    const cases: any = await import('../cases/cases.ts');
    const max = t.seedMax.sos_cases ?? Number.MAX_SAFE_INTEGER;
    const pair = t.conn.prepare('SELECT student_id, cycle_id FROM sos_cases WHERE id <= ? ORDER BY id LIMIT 1').get(max) as any;
    assert(pair, 'Bộ demo phải có case');
    const countOf = (id: number) => (t.conn.prepare("SELECT COUNT(*) n FROM attachments WHERE owner_type = 'sos_case' AND owner_id = ?").get(id) as any).n as number;
    const boardCases = () => (cases.skillSupportBoard(t.P.admin, pair.student_id, pair.cycle_id) as any).rows.flatMap((r: any) => r.cases) as any[];
    let list = boardCases();
    assert(list.length > 0, 'Bảng kỹ năng phải có case');
    for (const c of list) assert(typeof c.attachmentCount === 'number' && c.attachmentCount === countOf(c.id), `Case ${c.id}: attachmentCount ${c.attachmentCount} ≠ ${countOf(c.id)}`);
    /* Không chỉ so 0 với 0: chèn MỘT liên kết cho case đầu, kiểm số tăng đúng 1, rồi xoá. */
    const first = list[0];
    const before = countOf(first.id);
    const ins = t.conn.prepare(
      "INSERT INTO attachments (owner_type, owner_id, kind, url, display_name, uploaded_by, created_at) VALUES ('sos_case', ?, 'link', 'https://example.com/pr-hv', 'PR-HV thử', ?, ?)",
    ).run(first.id, t.P.admin.userId, new Date().toISOString());
    try {
      const again = boardCases().find((c: any) => c.id === first.id);
      assert(again && again.attachmentCount === before + 1, `Sau khi thêm 1 liên kết: ${again?.attachmentCount} (mong ${before + 1})`);
    } finally {
      t.conn.prepare('DELETE FROM attachments WHERE id = ?').run(Number(ins.lastInsertRowid));
    }
  });
}
