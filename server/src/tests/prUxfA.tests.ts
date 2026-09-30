/** PHÉP KIỂM PR-UXF-a — số liệu khớp + sót lớp thường (kế hoạch 2026-10-01). Mỗi sửa có phép kiểm so hai đường; mọi đường quyền có phép PHỦ ĐỊNH. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrUxfATests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const classes: any = await import('../classes/classes.ts');
  const transition: any = await import('../classes/transition.ts');
  const cuoiKhoaMod: any = await import('../normal/cuoiKhoa.ts');
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

  // ==================================================================== Task 2 · K2-01 + K2-12
  check('UXF-a (2) · ketQuaGanNhat lớp thường Cuối khoá đủ điểm: hậu tố hướng ở dòng 1 (45/55/64/78 %); thiếu điểm, Giữa khoá: không hậu tố', () => {
    const k = (o: any) => d.ketQuaGanNhat({
      mode: 'ratio', attemptLabel: 'Cuối khoá', attemptKind: 'final', sosLevel: 0, provisional: false, scored: 4, required: 4, failed: 0,
      overall: null, expectation: null, belowSkills: [], failedSkills: [], chuongTrinh: 'BE', ...o,
    });
    const truot = [{ skill: 'writing', score: 8, total: 20 }, { skill: 'speaking', score: 9, total: 20 }];
    assert(k({ tyLeTong: 0.45 }).dong1 === 'Cuối khoá → học lại', k({ tyLeTong: 0.45 }).dong1);
    assert(k({ tyLeTong: 0.55 }).dong1 === 'Cuối khoá → QL cân nhắc', '55%');
    assert(k({ tyLeTong: 0.64, failed: 2, failedSkills: truot }).dong1 === 'Cuối khoá → lên + bổ trợ', '64%');
    assert(k({ tyLeTong: 0.78 }).dong1 === 'Cuối khoá → Pass', '78%');
    assert(k({ tyLeTong: null, scored: 3 }).dong1 === 'Cuối khoá · 3/4 môn có điểm', 'thiếu điểm');
    assert(k({ attemptLabel: 'Giữa khoá', attemptKind: 'progress', tyLeTong: 0.45 }).dong1 === 'Giữa khoá', 'Giữa khoá');
    assert(!/\d%/.test(k({ tyLeTong: 0.45 }).dong1), 'hậu tố không dính số %');
  });

  check('UXF-a (2) · hai đường MB BE 04: roster.cuoiKhoa.tyLe = cuoiKhoaTheoHocVien; hậu tố Kết quả gần nhất = goiY.nhanNgan; cột Hướng gợi ý = chữ panel Chuyển lớp', () => {
    const be04 = lopId('MB BE 04');
    const roster = classes.classRoster(P.mbManager, be04) as any[];
    const ck = cuoiKhoaMod.cuoiKhoaTheoHocVien(be04);
    const tp = transition.transitionPlan(P.mbManager, be04);
    let coGoiY = 0;
    assert(roster.length > 0, 'lớp có em');
    for (const r of roster) {
      const e = ck.get(r.id);
      assert(r.cuoiKhoa && e && r.cuoiKhoa.tyLe === e.tyLe, `tyLe ${r.fullName}`);
      const g = r.cuoiKhoa.goiY;
      const dong1 = d.ketQuaGanNhat(r.standing).dong1 as string;
      if (!g) { assert(!/→/.test(dong1 ?? ''), `không gợi ý thì không hậu tố: ${dong1}`); continue; }
      coGoiY += 1;
      assert(dong1.endsWith(g.nhanNgan), `hậu tố ${r.fullName}: ${dong1} ≠ ${g.nhanNgan}`);
      const x = tp.students.find((s: any) => s.id === r.id);
      assert(x?.cuoiKhoa?.goiY?.nhanHuong === g.nhanHuong, `Hướng gợi ý ${r.fullName}: ${x?.cuoiKhoa?.goiY?.nhanHuong} ≠ ${g.nhanHuong}`);
    }
    assert(coGoiY >= 2, `ít nhất Huy + Khôi có gợi ý: ${coGoiY}`);
  });
}
