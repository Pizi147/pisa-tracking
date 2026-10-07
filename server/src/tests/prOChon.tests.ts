/**
 * PHÉP KIỂM PR-O-CHON — mọi ô chọn NGƯỜI gõ được tên rồi chọn ở danh sách bên dưới (chủ sản phẩm 07/10):
 * dùng lại `ChonNguoi`, không còn `<select>` chọn người.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const than = (src: string, ten: string) => src.slice(src.indexOf(`export function ${ten}`));

export async function runPrOChonTests(t: Pick<YThucTestKit, 'check' | 'assert'>) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-O-CHON · ô chọn người gõ được');

  check('OC1 · locNguoiChon: tìm không dấu, đ = d, rỗng → cả danh sách, giữ thứ tự', () => {
    const ds = [{ id: 1, ten: 'Nguyễn Văn Đức' }, { id: 2, ten: 'Trần Thị Mai' }, { id: 3, ten: 'Lê Đức Anh' }];
    assert(d.locNguoiChon(ds, '').map((x: any) => x.id).join() === '1,2,3', 'rỗng phải trả cả danh sách');
    assert(d.locNguoiChon(ds, 'duc').map((x: any) => x.id).join() === '1,3', 'duc → Đức (giữ thứ tự)');
    assert(d.locNguoiChon(ds, '  MAI ').map((x: any) => x.id).join() === '2', 'hoa/thường + khoảng trắng');
    assert(d.locNguoiChon(ds, 'nguyen van').length === 1, 'nhiều từ');
    assert(d.locNguoiChon(ds, 'xyz').length === 0, 'không khớp');
  });

  check('OC2 · Phân công GV (Tạo lớp, Sửa phân công, Tạo nhiều lớp) và ô Học viên của Tạo Case: ChonNguoi, không <select>', () => {
    for (const f of ['web/src/modules/classes/ClassCreatePanel.tsx', 'web/src/modules/classes/LuoiTaoLop.tsx']) {
      const s = doc(f);
      assert(!/\{(dsGv|xep\(o\))\.map\([^)]*\) => [\s\S]{0,40}<option/.test(s), `${f}: còn <option> chọn giáo viên`);
      assert(/<ChonNguoi[\s\S]{0,400}\bds=/.test(s), `${f}: chưa dùng ChonNguoi với danh sách có sẵn`);
    }
    const qr = doc('web/src/modules/cases/QuickReport.tsx');
    assert(!/students\.map\([^)]*\) => <option/.test(qr), 'QuickReport: ô Học viên còn <select>');
    assert(/<ChonNguoi[\s\S]{0,400}\bds=/.test(qr), 'QuickReport: ô Học viên chưa dùng ChonNguoi');
  });

  check('OC4 · rời ô (bấm ra ngoài / Tab) không mất ý định: gõ khớp đúng 1 người → chọn; không → xoá chữ; Enter chưa ↓ → người khớp đầu', () => {
    const ds = [{ id: 1, ten: 'Phạm Thu Trang' }, { id: 2, ten: 'Trần Ngọc Hà' }, { id: 3, ten: 'Trần Văn Hà' }];
    assert(d.chotChuGo('Phạm Thu Trang', d.locNguoiChon(ds, 'Phạm Thu Trang'))?.id === 1, 'gõ đủ tên một người → chọn người đó');
    assert(d.chotChuGo('pham', d.locNguoiChon(ds, 'pham'))?.id === 1, 'khớp đúng 1 (không dấu) → chọn');
    assert(d.chotChuGo('tran', d.locNguoiChon(ds, 'tran')) === null, 'khớp 2 người → không chọn bừa');
    assert(d.chotChuGo('xyz', d.locNguoiChon(ds, 'xyz')) === null && d.chotChuGo('  ', ds) === null, 'không khớp / ô trống → không chọn');
    const pp = doc('web/src/ui/PeoplePicker.tsx');
    assert(/onBlur=\{\(e\) => \{[\s\S]{0,200}relatedTarget[\s\S]{0,200}roiO\(\)/.test(pp), 'ChonNguoi chưa bắt focusout trên khung (Tab / bấm ra ngoài)');
    assert(/const roiO = [\s\S]{0,400}chotChuGo\(/.test(pp) && /setTerm\(''\)/.test(pp), 'rời ô chưa chọn người khớp duy nhất / xoá chữ gõ');
    assert(/activeIndex < 0[\s\S]{0,200}kind === 'nguoi'/.test(pp), 'Enter khi chưa ↓ chưa chọn người khớp đầu');
    assert(!/document\.addEventListener\('mousedown', away\)/.test(than(pp, 'ChonNguoi')), 'ChonNguoi còn bắt mousedown riêng (rời ô đi một đường)');
  });

  check('OC3 · ChonNguoi kiểu `ds`: không gọi máy chủ, có dòng trống (choTrong), nhận id/onBlur/invalid như ONgay', () => {
    const pp = doc('web/src/ui/PeoplePicker.tsx');
    assert(/locNguoiChon\(/.test(pp), 'ChonNguoi chưa lọc danh sách có sẵn bằng locNguoiChon');
    assert(/useNguoiSearch\([^)]*!ds/.test(pp), 'ChonNguoi kiểu ds vẫn gọi /ref/nguoi');
    assert(/choTrong/.test(pp) && /\binvalid\b/.test(pp) && /onBlur/.test(pp), 'thiếu choTrong / invalid / onBlur');
  });
}
