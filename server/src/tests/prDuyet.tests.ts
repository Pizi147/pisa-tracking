/** PHÉP KIỂM PR-DUYET — hộp Chờ duyệt. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrDuyetTests(t: YThucTestKit) {
  const { check, assert, P, classId } = t;
  const d = await import('../../../shared/domain/index.ts');
  const { can } = await import('../permissions.ts');
  console.log('\nPR-DUYET · Hộp Chờ duyệt');

  check('DUYET (1) · LOAI_YC_META phủ đủ loại, phân loại hợp lệ; hạn mặc định tính cả ngày gửi', () => {
    for (const k of d.LOAI_YEU_CAU) assert(d.LOAI_YC_META[k] && d.laPhanLoai(d.LOAI_YC_META[k].phanLoai), k);
    assert(Object.keys(d.LOAI_YC_META).length === d.LOAI_YEU_CAU.length, 'thừa khoá');
    assert(d.hanDuyetMacDinh('de_xuat_pa', '2026-09-28') === '2026-10-02', String(d.hanDuyetMacDinh('de_xuat_pa', '2026-09-28')));
    assert(d.hanDuyetMacDinh('lich_thi', '2026-09-28') === null && d.hanDuyetMacDinh('bao_len_nguyen_nhan', '2026-09-28') === null, 'không hạn');
    assert(d.LOAI_YC_META.xin_y_kien.kieuNut === 'tra-loi' && d.LOAI_YC_META.bao_len_nguyen_nhan.kieuNut === 'nhac', 'kiểu nút');
  });
  check('DUYET (1) · sapThe: quá hạn → hôm nay → còn hạn → không hạn; cùng hạn gửi trước đứng trước', () => {
    const h = '2026-09-29';
    const ds = [
      { id: 'khong', hanDuyet: null, taoLuc: '2026-09-01' },
      { id: 'con3', hanDuyet: '2026-10-01', taoLuc: '2026-09-20' },
      { id: 'homnay-moi', hanDuyet: h, taoLuc: '2026-09-25' },
      { id: 'qua2', hanDuyet: '2026-09-27', taoLuc: '2026-09-22' },
      { id: 'homnay-cu', hanDuyet: h, taoLuc: '2026-09-24' },
    ];
    const kq = d.sapThe(ds).map((x) => x.id).join(' ');
    assert(kq === 'qua2 homnay-cu homnay-moi con3 khong', kq);
  });
  check('DUYET (1) · demChip đủ 6 khoá, tất cả = tổng; laTuDuyet; duongThe; nhãn trạng thái', () => {
    const c = d.demChip([{ phanLoai: 'hoc-thuat' }, { phanLoai: 'hoc-thuat' }, { phanLoai: 'bao-len' }]);
    assert(c['tat-ca'] === 3 && c['hoc-thuat'] === 2 && c['bao-len'] === 1 && c['y-thuc'] === 0 && Object.keys(c).length === 6, JSON.stringify(c));
    assert(d.laTuDuyet(2, 2) && !d.laTuDuyet(null, 2) && !d.laTuDuyet(3, 2), 'tự duyệt');
    assert(d.duongThe(5, 'nguoi-xin') === '/cong-viec/yeu-cau?the=5' && d.duongThe(12, 'duyet') === '/cong-viec/cho-duyet?the=12', 'đường');
    assert(d.nhanTrangThaiYc('duyet', true).chu.includes('tự duyệt') && d.nhanTrangThaiYc('tu_choi').t === 'da-huy'
      && d.nhanTrangThaiYc('cho').t === 'cho-duyet', 'nhãn');
  });
  check('DUYET (1) · request.approve: QL MB duyệt lớp MB, QL CP không, GVCN không bao giờ; cycle.edit không cho GV', () => {
    const mb = classId('MB FT 101');
    assert(!can(P.coreTeacher, 'request.approve', { classId: mb }), 'GVCN có request.approve');
    assert(can(P.mbManager, 'request.approve', { classId: mb }), 'QL MB');
    assert(!can(P.cpManager, 'request.approve', { classId: mb }), 'QL CP duyệt lớp MB');
    assert(can(P.admin, 'request.approve', { classId: mb }), 'Quản trị');
    assert(!can(P.coreTeacher, 'cycle.edit', { classId: mb }) && can(P.mbManager, 'cycle.edit', { classId: mb }), 'cycle.edit');
    assert(d.PERMISSION_LABEL['request.approve'] && d.PERMISSION_LABEL['cycle.edit'], 'nhãn quyền');
  });
  check('DUYET (1) · deadlineView loại duyet: còn 3 ngày · hôm nay = còn 1 ngày · quá hạn 1 ngày', () => {
    const v = (due: string) => d.deadlineView({ kind: 'duyet', due, today: '2026-09-29' });
    assert(v('2026-10-01').con === 'còn 3 ngày' && v('2026-10-01').text.includes('còn 3 ngày'), v('2026-10-01').text);
    assert(v('2026-09-29').con === 'còn 1 ngày' && v('2026-09-29').homNay, v('2026-09-29').text);
    assert(v('2026-09-28').con === null && v('2026-09-28').quaHan === 'quá hạn 1 ngày', v('2026-09-28').text);
    assert(d.deadlineView({ kind: 'lap-pa', due: '2026-10-01', today: '2026-09-29' }).con == null, 'loại khác không có "còn"');
  });
}
