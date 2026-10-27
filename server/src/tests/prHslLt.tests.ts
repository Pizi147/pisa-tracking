/**
 * PHÉP KIỂM HSL-LT (M4 PR 3, kế hoạch 2026-10-27-m4-code.md) — trang hồ sơ một lượt Test lớp thường `/luot-test/:id`:
 *   (1) `duongDotTest`: lượt lớp thường → `/luot-test/{id}` (+ `?kn=`); FT / MT0 giữ `/mock-test/`; mất lớp + có em → hồ sơ HV;
 *   (2) `GET /regular/attempts/:id` trả `cycleId` (lộ trình của lượt — khối Case lấy thẻ đúng lộ trình) + `lichSuCase` (Case mở · PA thêm của Case của lượt);
 *   (3) route + điểm vào: App có route, tên em ở bảng điểm lớp thường (lưới + một kỹ năng) mở trang lượt, Quay lại / khu vực nhận trang mới;
 *   (4) không luật thứ hai: trang dùng lại ô điểm / lưu / thao tác của bảng điểm lớp và khối Case của hồ sơ HV.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (rel: string) => fs.readFileSync(path.join(REPO, rel), 'utf8');

export async function runPrHslLtTests(t: any) {
  const { check, assert, conn, P, classId, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const regular: any = await import('../normal/regular.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nHSL-LT · trang lượt lớp thường /luot-test/:id: đường dẫn · cycleId + lichSuCase · điểm vào · dùng lại thành phần');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;

  check('HSLLT-1 · duongDotTest: progress / final / checkpoint → /luot-test/{id} (+ kn hợp lệ); mock, MT0, thiếu kind → /mock-test/; mất lớp + có em → hồ sơ HV', () => {
    assert(d.duongDotTest({ id: 7, kind: 'progress', classId: 3 }) === '/luot-test/7', 'progress');
    assert(d.duongDotTest({ id: 8, kind: 'final', classId: 3 }, 'reading') === '/luot-test/8?kn=reading', 'final + kn');
    assert(d.duongDotTest({ id: 9, kind: 'checkpoint', classId: 3 }, 'abc') === '/luot-test/9', 'kn lạ bỏ');
    assert(d.duongDotTest({ id: 5, kind: 'mock' }) === '/mock-test/5' && d.duongDotTest({ id: 5 }) === '/mock-test/5', 'FT / thiếu kind');
    assert(d.duongDotTest({ id: 6, kind: 'mt0', classId: 3 }) === '/mock-test/6', 'MT0 chấm band → hồ sơ Mock');
    assert(d.duongDotTest({ id: 4, kind: 'progress', classId: null, studentId: 12 }) === d.duongHoSoHocVien(12), 'mất lớp → hồ sơ HV');
  });

  check('HSLLT-2 · /regular/attempts/:id: cycleId = lộ trình của lượt; lichSuCase = Case mở (+ PA thêm) của đúng các Case của dòng', () => thu(() => {
    const LOP = classId('MB FOU 12');
    const l = get(`SELECT a.id, a.cycle_id FROM assessment_attempts a JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
       WHERE a.class_id = ? AND a.kind = 'progress' AND a.status != 'cancelled' ORDER BY a.id LIMIT 1`, LOP);
    assert(l, 'demo phải có Progress Test ở MB FOU 12');
    const ct = regular.regularAttemptDetail(P.mbManager, l.id);
    assert(ct.cycleId === (l.cycle_id ?? null), `cycleId: ${ct.cycleId} ≠ ${l.cycle_id}`);
    const ids = ct.dong.cases.map((c: any) => c.id);
    const mo = ct.lichSuCase.filter((h: any) => h.loai === 'case').map((h: any) => Number(h.id.slice(1)));
    assert(JSON.stringify([...mo].sort()) === JSON.stringify([...ids].sort()), `Case mở ${JSON.stringify(mo)} ≠ Case của dòng ${JSON.stringify(ids)}`);
    /* Case của dòng có topic = môn của dòng → dải Lịch sử môn lọc theo `topic` ra đúng môn. */
    for (const c of ct.dong.cases) {
      const h = ct.lichSuCase.find((x: any) => x.id === `c${c.id}`);
      assert(h && h.topic === c.skill, `Case ${c.id}: topic ${h?.topic} ≠ môn ${c.skill}`);
    }
    void TODAY;
  }));

  check('HSLLT-3 · route + điểm vào: App /luot-test/:id → LuotThuongPage; tên em ở bảng điểm lớp thường (lưới, một kỹ năng) mở trang lượt; Quay lại + khu vực nhận trang mới', () => {
    const app = doc('web/src/App.tsx');
    assert(/<Route path="\/luot-test\/:id" element=\{<LuotThuongPage \/>\} \/>/.test(app) && /import\('\.\/modules\/fasttrack\/LuotThuongPage\.tsx'\)/.test(app), 'route');
    assert(/to=\{duongDotTest\(\{ id: row\.attemptId, kind: row\.kind\.split\(':'\)\[0\], classId: sheet\.class\.id \}\)\}/.test(doc('web/src/modules/cham/LuoiThuong.tsx')), 'tên em lưới lớp thường');
    assert(/href=\{duongDotTest\(\{ id: row\.attemptId, kind: row\.kind\.split\(':'\)\[0\], classId: sheet\.class\.id \}, k\)\}/.test(doc('web/src/modules/cham/MotKyNang.tsx')), 'tên em một kỹ năng lớp thường');
    assert(d.loaiHoSo('/luot-test/5') === 'luot' && d.trangCha('luot', { studentId: 3, tenHv: 'An' }).url === '/hoc-vien/3', 'Quay lại về hồ sơ em');
    assert(d.khuVucCuaDuong('/luot-test/5') === 'test', 'mục Test sáng');
  });

  check('HSLLT-4 · không luật thứ hai: trang lượt dùng lại ODiemThuong · useLuuThuong · oThuong · thaoTacKyNang · HopThaoTacMt · CaseLuotKn · KetQua; không tự ghép đường /mock-test/ /luot-test/', () => {
    const s = doc('web/src/modules/fasttrack/LuotThuongPage.tsx');
    for (const x of ['<ODiemThuong', 'useLuuThuong(', 'oThuong(', 'thaoTacKyNang(', '<HopThaoTacMt', '<CaseLuotKn', '<KetQua', '<ConLaiLuot', '<VungMoKn', 'viecCaseLuot(', "fetch('", '/regular/attempts/']) {
      if (x === "fetch('") assert(!s.includes(x), 'không gọi fetch trần');
      else assert(s.includes(x), `thiếu ${x}`);
    }
    assert(!/`\/(mock|luot)-test\/\$\{/.test(s), 'tự ghép đường lượt');
    /* Hồ sơ Mock chuyển cửa lượt không phải FT qua attemptHref (= duongDotTest) → trang lượt lớp thường. */
    assert(/<Navigate to=\{attemptHref\(\{ id: data\.id, kind: data\.kind, classId: data\.classId, studentId: data\.student\.id \}\)\} replace \/>/.test(doc('web/src/modules/fasttrack/MockDetailPage.tsx')), 'MockDetailPage chuyển cửa');
  });
}
