/**
 * PHÉP KIỂM MOCKUP-1111 (chủ SP duyệt 11/11, `thiet-ke/2026-11-11-mockup-1111/`).
 * Màn 1 — ô "Việc của tôi" hồ sơ lớp: tên việc (động từ) tách khỏi phần phụ (em · kỹ năng · số); bỏ mã lớp lặp. Tiêu đề lấy từ seed MB FT 101.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tachViec } from '../../../shared/domain/index.ts';
import { evaluateRegular } from '../normal/regular.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

const viec = (tieuDe: string, o: Partial<Parameters<typeof tachViec>[0]> = {}) =>
  tachViec({ tieuDe, actionLabel: '', group: 'khac', studentId: null, studentName: 'Lớp MB FT 101', classCode: 'MB FT 101', ...o });

export async function runM1111Tests(t: any) {
  const { check, assert } = t;
  const eq = (a: unknown, b: unknown, m: string) => assert(JSON.stringify(a) === JSON.stringify(b), `${m}: ${JSON.stringify(a)}`);
  console.log('\nMOCKUP-1111 · dải Việc của tôi');

  check('M1111-1 · Nhập điểm: tên = nhãn hành động, phụ = kỹ năng viết tắt · n bài; việc của một em có tên em', () => {
    eq(viec('Nhập điểm Listening, Reading', { group: 'score', actionLabel: 'Nhập điểm', soBai: 4 }), { ten: 'Nhập điểm', phu: 'L · R · 4 bài' }, 'cả lớp');
    eq(viec('Nhập điểm Listening, Reading', { group: 'score', actionLabel: 'Nhập điểm', soBai: 2, studentId: 9, studentName: 'Hà Gia Bình' }),
      { ten: 'Nhập điểm', phu: 'Hà Gia Bình · L · R · 2 bài' }, 'một em');
  });
  check('M1111-2 · việc một em: tên em đứng đầu phần phụ, kỹ năng viết tắt; giữ "(3)" của tên', () => {
    eq(viec('Ghi kết quả PA · Reading', { studentId: 5, studentName: 'Lý Minh Châu' }), { ten: 'Ghi kết quả PA', phu: 'Lý Minh Châu · R' }, 'PA');
    eq(viec('Mô tả Case · Listening · MT2 · Ngô Bảo Châu', { studentId: 6, studentName: 'Ngô Bảo Châu' }), { ten: 'Mô tả Case', phu: 'Ngô Bảo Châu · L · MT2' }, 'Case');
    eq(viec('Xử lý vi phạm · Phạm Bảo Ngọc (3) · bậc kế tiếp: Report 2', { studentId: 7, studentName: 'Phạm Bảo Ngọc' }),
      { ten: 'Xử lý vi phạm', phu: 'Phạm Bảo Ngọc (3) · bậc kế tiếp: Report 2' }, 'vi phạm');
  });
  check('M1111-3 · việc cả lớp: bỏ mã lớp (đang ở chính lớp), giữ số + đơn vị', () => {
    eq(viec('Phối hợp SOS · MB FT 101 · 10 lượt'), { ten: 'Phối hợp SOS', phu: '10 lượt' }, 'Phối hợp');
    eq(viec('Điền Target', { studentId: 8, studentName: 'Hồ Gia Hân' }), { ten: 'Điền Target', phu: 'Hồ Gia Hân' }, 'không phần phụ');
  });

  /* Màn 3 — hộp điểm Cuối khoá: ô môn ghi số câu đúng / tổng (chủ SP 11/11), lấy từ chính kết quả `evaluateRegular` (cùng câu SQL). */
  check('M1111-4 · evaluateRegular giữ đúng / tổng từng môn; cuoiKhoa.mon chuyển dung / tong (0 câu thêm)', () => {
    const kq = evaluateRegular(['listening', 'reading'], [{ skill: 'listening', raw_score: 21, raw_total: 25 }, { skill: 'reading', raw_score: null, raw_total: null }], 'FOU');
    eq(kq.skills.map((x) => [x.skill, x.score, x.total]), [['listening', 21, 25], ['reading', null, null]], 'điểm môn');
    const nguon = fs.readFileSync(path.join(REPO, 'server/src/normal/cuoiKhoa.ts'), 'utf8');
    assert(/mon: kq\.skills\.map\(\(s\) => \(\{ skill: s\.skill, ratio: s\.ratio, dung: s\.score, tong: s\.total \}\)\)/.test(nguon), 'cuoiKhoa.mon thiếu dung / tong');
  });
}
