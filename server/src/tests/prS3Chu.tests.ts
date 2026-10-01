/**
 * PHÉP KIỂM PR-S3 — chữ cuối trên web (kế hoạch 2026-10-02-pr-s3-chu-cuoi; nhãn [S3]).
 * Nguồn chữ: thiet-ke/THUAT_NGU_2026-10-01.md (cột "Sửa thành") + mục "Đã chốt" của kế hoạch.
 * Chỉ quét CHỮ HIỂN THỊ trong code (bỏ chú thích, bỏ tests, bỏ dữ liệu kể chuyện của bộ demo) — không quét tên bảng/cột/enum.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
// dist-server/server/src/tests → gốc repo.

/** Dữ liệu kể chuyện của bộ demo, không phải chữ giao diện — trừ `seed.ts` (in ra màn hình lệnh) và `duLieuNen.ts` (dữ liệu nền bản chính). */
const LOAI_TRU = (f: string) => f.startsWith('server/src/seed/') && f !== 'server/src/seed/seed.ts' && f !== 'server/src/seed/duLieuNen.ts';

function boChuThich(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ''))
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1');
}

const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) return e.name === 'tests' || e.name === 'node_modules' ? [] : walk(p);
  return /\.(ts|tsx|mjs)$/.test(e.name) ? [p] : [];
});

let cacheNguon: Array<{ f: string; dong: string[] }> | null = null;
/** Mọi tệp nguồn (đã bỏ chú thích), mỗi tệp là mảng dòng — đọc một lần cho cả file kiểm. */
function nguon() {
  if (cacheNguon) return cacheNguon;
  cacheNguon = ['web/src', 'shared', 'server/src', 'scripts'].flatMap((d) => walk(path.join(ROOT, d)))
    .map((f) => path.relative(ROOT, f).replace(/\\/g, '/'))
    .filter((f) => !LOAI_TRU(f))
    .map((f) => ({ f, dong: boChuThich(fs.readFileSync(path.join(ROOT, f), 'utf8')).split('\n') }));
  return cacheNguon;
}

/**
 * Quét một nhóm chữ cũ. `choPhep`: [đường dẫn (hoặc tiền tố), chuỗi con của dòng] cho chỗ cố ý giữ (chữ khác nghĩa,
 * hằng so khớp). Trả về danh sách vị trí còn sót.
 */
export function quetChuCu(chuCu: Array<[string, RegExp]>, choPhep: Array<[string, string]> = []): string[] {
  const hits: string[] = [];
  for (const { f, dong } of nguon()) {
    dong.forEach((line, i) => {
      if (choPhep.some(([pf, s]) => f.startsWith(pf) && line.includes(s))) return;
      for (const [ten, re] of chuCu) if (re.test(line)) hits.push(`${f}:${i + 1} "${ten}": ${line.trim().slice(0, 100)}`);
    });
  }
  return hits;
}

/** Nội dung nguyên văn một tệp (đã bỏ chú thích) — để khẳng định chữ MỚI có mặt đúng chỗ. */
export const docNguon = (rel: string) => boChuThich(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

export async function runPrS3ChuTests(t: YThucTestKit) {
  const { check, assert } = t;
  console.log('\nPR-S3 · Chữ cuối trên web');

  const khongCon = (ten: string, chuCu: Array<[string, RegExp]>, choPhep: Array<[string, string]> = []) =>
    check(ten, () => {
      assert(nguon().length > 150, `Quét quá ít tệp (${nguon().length}) — sai ROOT?`);
      const hits = quetChuCu(chuCu, choPhep);
      assert(hits.length === 0, `Còn ${hits.length} chỗ:\n    ${hits.join('\n    ')}`);
    });

  // ------------------------------------------------------------------ Task 0 · bảng thuật ngữ còn nguyên 147 dòng "Sửa thành"
  check('S3 (0) · THUAT_NGU_2026-10-01.md còn đủ 147 dòng có "Sửa thành" (nguồn để đối chiếu)', () => {
    const md = fs.readFileSync(path.join(ROOT, 'thiet-ke/THUAT_NGU_2026-10-01.md'), 'utf8');
    const n = md.split('\n').filter((l) => /^\| [A-G]-\d{3} \|/.test(l) && (l.split('|').slice(-2, -1)[0] ?? '').trim() !== '').length;
    assert(n === 147, `${n} dòng`);
  });
  // ------------------------------------------------------------------ Task 1 · điều hướng & tên trang (nhóm A)
  // `migrate.ts`: chữ đã lưu trong DB / nhật ký di cư (Q11) — giữ nguyên.
  khongCon('S3 (1) · Nhóm A: không còn "Lịch kiểm tra", "Khu Lưu trữ", "Quyền và nhật ký", "Tổng quan chấm điểm", "Lịch sử thay đổi/cập nhật/chỉnh sửa", "Hồ sơ đợt", "hồ sơ Mock", tên trang tính không dấu',
    [
      ['Lịch kiểm tra', /[Ll]ịch kiểm tra/],
      ['Khu Lưu trữ', /Khu Lưu trữ/],
      ['Quyền và nhật ký', /Quyền và nhật ký/],
      ['Tổng quan chấm điểm', /Tổng quan chấm điểm/],
      ['Lịch sử thay đổi', /[Ll]ịch sử (thay đổi|cập nhật|chỉnh sửa)/],
      ['Việc của tôi · hôm nay', /Việc của tôi · hôm nay/],
      ['Hồ sơ đợt', /[Hh]ồ sơ đợt/],
      ['hồ sơ Mock', /[Hh]ồ sơ Mock(?! Test)/],
      ['Xuất kết quả Mock Test', /Xuất kết quả Mock Test/],
      ['Kết quả kiểm tra', /Kết quả kiểm tra/],
      ['Việc học viên (tên tab)', /'Việc học viên'/],
      ['Tên trang tính không dấu', /'(Tong hop|HV can chu y|Lop nhieu vi pham|Xu ly theo loai)'/],
    ],
    [['server/src/migrate.ts', '']]);
  check('S3 (1) · Hồ sơ Mock Test là tên trang FT; lớp thường dùng "Bảng điểm đợt" (không có chữ Mock/MT); tab Hỗ trợ học viên', () => {
    assert(/Hồ sơ Mock Test ·/.test(docNguon('web/src/modules/fasttrack/MockDetailPage.tsx')), 'tiêu đề MockDetailPage');
    const sd = docNguon('web/src/modules/students/StudentDetailPage.tsx');
    assert((sd.match(/Bảng điểm đợt ›/g) ?? []).length === 2, 'link lớp thường');
    assert(/'ho-tro': 'Hỗ trợ học viên'/.test(docNguon('shared/domain/dieuHuong.ts')), 'TAB_CONG_VIEC_LABEL');
    assert(/'Tổng hợp'/.test(docNguon('web/src/modules/phanTich/TongHopTestSos.tsx')), 'Excel A-054');
  });
}
