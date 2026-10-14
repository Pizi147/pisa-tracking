/** PHÉP KIỂM PR-U12 — bảng "Kết quả kiểm tra" lớp thường ở hồ sơ HV theo mẫu Mock Test (chủ sản phẩm 04/10). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
/** Thân một hàm cấp cao trong file: từ `function ten(` tới hàm cấp cao kế tiếp. */
const than = (src: string, ten: string) => {
  const dau = src.indexOf(`function ${ten}(`);
  if (dau < 0) return '';
  const sau = src.slice(dau + 1).search(/\n(?:export )?function /);
  return sau < 0 ? src.slice(dau) : src.slice(dau, dau + 1 + sau);
};

export async function runPrU12Tests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const src = doc('web/src/modules/students/StudentDetailPage.tsx');
  const ratio = than(src, 'RatioAttempts');
  const ielts = than(src, 'IeltsAttempts');
  const ketQua = than(src, 'KetQuaThuongO');
  console.log('\nPR-U12 · Bảng kết quả lớp thường theo mẫu Mock Test');

  check('PR-U12 (1) · tenBaiThuong: một bài mỗi loại → không số; hai Progress Test → "Progress Test 1" (cũ), "Progress Test 2" (mới)', () => {
    // bảng xếp mới trước (attempt_no DESC) — số theo thời gian, không theo hàng
    const rows = [{ kind: 'final', attemptNo: 3 }, { kind: 'progress', attemptNo: 2 }, { kind: 'progress', attemptNo: 1 }];
    assert(d.tenBaiThuong(rows, rows[2]) === 'Progress Test 1', String(d.tenBaiThuong(rows, rows[2])));
    assert(d.tenBaiThuong(rows, rows[1]) === 'Progress Test 2', String(d.tenBaiThuong(rows, rows[1])));
    assert(d.tenBaiThuong(rows, rows[0]) === 'Final Test', String(d.tenBaiThuong(rows, rows[0])));
    const mot = [{ kind: 'progress', attemptNo: 1 }];
    assert(d.tenBaiThuong(mot, mot[0]) === 'Progress Test', 'một bài → không số');
  });

  check('PR-U12 (1) · RatioAttempts: ô Bài là Link tới bảng điểm đợt, không còn "Bảng điểm đợt ›"; hai bảng cùng gọi NhanDot', () => {
    assert(ratio.length > 0 && ielts.length > 0, 'không tìm thấy hàm');
    assert(!ratio.includes('Bảng điểm đợt ›'), 'còn link "Bảng điểm đợt ›" riêng');
    assert(ratio.includes('<Link to={attemptHref(a)}'), 'ô Bài chưa là Link');
    assert(ratio.includes('<NhanDot a={a}'), 'RatioAttempts chưa gọi NhanDot');
    assert(ielts.includes('<NhanDot a={a}'), 'IeltsAttempts chưa gọi NhanDot');
    assert(!ielts.includes('const nhanCua'), 'IeltsAttempts còn chép nhãn riêng');
    assert(!/SOS/.test(ratio.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')), 'lớp thường không có chữ SOS (§20.6)');
  });

  check('PR-U12 (2) · kết quả nói một lần: bỏ "mới x/y môn"; chưa đủ môn → "Chờ n môn"', () => {
    assert(ratio.length > 0 && ketQua.length > 0, 'không tìm thấy hàm');
    assert(!ratio.includes('mới {a.scored}/{a.required} môn'), 'còn dòng "mới x/y môn"');
    assert(/a\.status !== 'done'/.test(ketQua), 'lượt đã xong mà thiếu môn (huỷ phần) không được "Chờ"');
    assert(/a\.status === 'cancelled'\) return <span className="text-muted">—<\/span>/.test(ketQua), 'lượt đã huỷ → "—"');
    assert(/khongChiaMon \?|!khongChiaMon \?/.test(ketQua), 'Pre FOU giữ nhánh riêng (%)');
    assert(/a\.scored < a\.required/.test(ketQua), 'KetQuaThuongO chưa có nhánh chưa đủ môn');
    assert(ketQua.includes("t('Chờ {n} môn', { n: a.required - a.scored })"), 'thiếu chữ "Chờ n môn"');
  });
}
