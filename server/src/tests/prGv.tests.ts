/** PHÉP KIỂM PR-GV — Hồ sơ giáo viên + số liệu theo giáo viên (không KPI, không xếp hạng). */
import type { YThucTestKit } from './yThuc.tests.ts';
import { COT_O_GV, demViecTheoNhom, duongViecCuaGv, laCotOGv } from '../../../shared/domain/hoSoGiaoVien.ts';

export async function runPrGvTests(t: YThucTestKit) {
  const { check, assert } = t;
  console.log('\nPR-GV · Hồ sơ giáo viên');

  check('PR-GV (1) · demViecTheoNhom: luôn đủ 4 nhóm đúng thứ tự, loại lạ rơi vào Vận hành', () => {
    const r = demViecTheoNhom([{ group: 'score', urgency: 'overdue' }, { group: 'result', urgency: 'normal' },
      { group: 'yt_xem', urgency: 'today' }, { group: 'la', urgency: 'overdue' }]);
    assert(JSON.stringify(r.map((x) => x.nhom)) === JSON.stringify(['cham-diem', 'case-hoc-thuat', 'y-thuc', 'van-hanh']), 'thứ tự NHOM_VIEC');
    assert(JSON.stringify(r.map((x) => [x.n, x.quaHan])) === JSON.stringify([[1, 1], [1, 0], [1, 0], [1, 1]]), 'n / quá hạn từng nhóm');
    assert(demViecTheoNhom([]).length === 4, 'rỗng vẫn đủ 4 dòng');
  });

  check('PR-GV (1) · duongViecCuaGv: QL có nguoi=id, tự xem có nguoi=toi, GV không có nguoi; có khung=tat-ca', () => {
    assert(duongViecCuaGv(7, { userId: 2, laQuanLy: true }, 'cham-diem', true) === '/cong-viec/ho-tro?nguoi=7&nhom=cham-diem&khung=tat-ca&loc=qua-han', 'QL xem GV');
    assert(duongViecCuaGv(7, { userId: 7, laQuanLy: false }, null) === '/cong-viec/ho-tro?khung=tat-ca', 'GV tự xem không có nguoi');
    assert(duongViecCuaGv(2, { userId: 2, laQuanLy: true }, 'y-thuc') === '/cong-viec/ho-tro?nguoi=toi&nhom=y-thuc&khung=tat-ca', 'QL tự xem = toi');
  });

  check('PR-GV (1) · laCotOGv: chỉ nhận cột trong COT_O_GV, KPI đã bỏ', () => {
    assert(COT_O_GV.every(laCotOGv), 'mọi cột hợp lệ');
    assert(!laCotOGv('kpi-bai') && !laCotOGv(undefined) && !laCotOGv(''), 'cột lạ bị chặn');
  });
}
