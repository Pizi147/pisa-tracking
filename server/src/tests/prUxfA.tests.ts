/** PHÉP KIỂM PR-UXF-a — số liệu khớp + sót lớp thường (kế hoạch 2026-10-01). Mỗi sửa có phép kiểm so hai đường; mọi đường quyền có phép PHỦ ĐỊNH. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrUxfATests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  console.log('\nPR-UXF-a · Số liệu khớp + sót lớp thường');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const lopId = (code: string) => get('SELECT id FROM classes WHERE code = ?', code).id as number;
  const emId = (ten: string) => get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
  const THU_HAI = (d.tuanChonDuoc(TODAY) as string[])[0];

  // ==================================================================== Task 1 · P0 K2-25
  check('UXF-a (1) · khacGoiY: đủ 6 nhánh (Pass+học lại · <50%+lên · 50–59%+học lại · gợi ý null · Pass+FT · hướng null)', () => {
    const goi = (tyLe: number) => d.goiYCuoiKhoa({ ct: 'BE', tyLe, monTruot: [] });
    assert(d.khacGoiY('hoc_lai', goi(0.8)) === true, 'Pass + học lại');
    assert(d.khacGoiY('len_lop', goi(0.45)) === true, '< 50% + lên');
    assert(d.khacGoiY('hoc_lai', goi(0.55)) === false, '50–59% + học lại');
    assert(d.khacGoiY('hoc_lai', null) === false, 'gợi ý null');
    assert(d.khacGoiY('fast_track', goi(0.8)) === false, 'Pass + FT');
    assert(d.khacGoiY(null, goi(0.8)) === false, 'hướng null');
  });

  check('UXF-a (1) · máy chủ bắt lý do khi khác Web gợi ý — thân gửi khacGoiY:false KHÔNG lách được; 50–59% không đòi lý do', () => {
    const be04 = lopId('MB BE 04'), be03 = lopId('MB BE 03');
    const huy = emId('Tạ Đức Huy'), khoi = emId('Đặng Minh Khôi');
    const ra = (dong: any) => lenh.raLenh(P.mbManager, { lopNguonId: be04, boiCanh: 'cuoi-khoa', tuanChung: THU_HAI, dongs: [lenh.dongTuBody(dong)] });
    const r1 = ra({ studentId: huy, huong: 'hoc_lai', toClassId: be03 });
    assert(r1.failed.length === 1 && r1.failed[0].message === 'Ghi lý do ngắn', `không lý do: ${JSON.stringify(r1)}`);
    const r2 = ra({ studentId: huy, huong: 'hoc_lai', toClassId: be03, khacGoiY: false });
    assert(r2.failed[0]?.message === 'Ghi lý do ngắn', `khacGoiY:false vẫn bị chặn: ${JSON.stringify(r2)}`);
    const r3 = ra({ studentId: huy, huong: 'hoc_lai', toClassId: be03, lyDo: 'Phụ huynh xin học lại' });
    assert(r3.ok.length === 1, `có lý do: ${JSON.stringify(r3)}`);
    const l = get(`SELECT id, khac_goi_y FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, huy);
    assert(l.khac_goi_y === 1, 'khac_goi_y = 1');
    const r4 = ra({ studentId: khoi, huong: 'hoc_lai', toClassId: be03 });
    assert(r4.ok.length === 1, `55% học lại không lý do: ${JSON.stringify(r4)}`);
    const lk = get(`SELECT id, khac_goi_y FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, khoi);
    assert(lk.khac_goi_y === 0, 'khac_goi_y = 0');
    lenh.huyLenh(P.mbManager, l.id, 'Dọn phép kiểm');
    lenh.huyLenh(P.mbManager, lk.id, 'Dọn phép kiểm');
  });

  check('UXF-a (1) · suaLenh đổi hướng sang lệch gợi ý mà không lý do → 400; thân PATCH không nhận khacGoiY', () => {
    const be04 = lopId('MB BE 04'), be03 = lopId('MB BE 03'), ele02 = lopId('MB ELE 02');
    const huy = emId('Tạ Đức Huy');
    const r = lenh.raLenh(P.mbManager, { lopNguonId: be04, boiCanh: 'cuoi-khoa', tuanChung: THU_HAI, dongs: [{ studentId: huy, huong: 'len_lop', toClassId: ele02 }] });
    assert(r.ok.length === 1, `lên ELE khớp gợi ý: ${JSON.stringify(r)}`);
    const l = get(`SELECT id, khac_goi_y FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, huy);
    assert(l.khac_goi_y === 0, 'khớp gợi ý → 0');
    assert(!('khacGoiY' in lenh.suaTuBody({ khacGoiY: false, huong: 'hoc_lai' })), 'suaTuBody bỏ khacGoiY');
    assert(maLoi(() => lenh.suaLenh(P.mbManager, l.id, lenh.suaTuBody({ huong: 'hoc_lai', toClassId: be03, khacGoiY: false }))) === 400, 'đổi sang học lại không lý do');
    lenh.huyLenh(P.mbManager, l.id, 'Dọn phép kiểm');
  });
}
