/** PHÉP KIỂM PR-XLMT — xếp lịch MT nhiều lớp, thao tác MT theo trạng thái (T37, T38). Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrXlmtTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-XLMT · Xếp lịch MT nhiều lớp, thao tác MT theo trạng thái');

  // ------------------------------------------------------------------ khối 1: luật thuần
  const L = (attempt_no: number, status = 'planned', coDiem = false) => ({ attempt_no, status, coDiem });

  check('PR-XLMT (1) · trần MT8: kiemSoMtMoi(MT1…MT8, 9) chặn "Tối đa MT8"; thuTuDot MT8 trước Giữa khoá (T37, K1-21)', () => {
    const ds = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => L(n, 'completed', true));
    assert(d.kiemSoMtMoi(ds, 9) === 'Tối đa MT8 cho một lộ trình.', String(d.kiemSoMtMoi(ds, 9)));
    assert(d.thuTuDot('mt:8') < d.thuTuDot('giua') && d.thuTuDot('mt:6') > d.thuTuDot('mt:5'), 'MT6–MT8 xếp trước Giữa khoá');
    assert(d.thuTuDot('giua') < d.thuTuDot('cuoi') && d.thuTuDot('la') > d.thuTuDot('cuoi'), 'Giữa < Cuối < khoá lạ');
  });

  check('PR-XLMT (1) · viecXepMt: đủ → tạo MT kế · dở → xếp nốt · chưa thi → dời · lịch sử → bỏ qua · chờ duyệt / ép / thiếu MT (K4-17)', () => {
    const kn = (o: Partial<Record<'listening' | 'reading' | 'writing' | 'speaking', Partial<{ coDiem: boolean; daThi: boolean; choDuyet: boolean; huyPhan: boolean }>>>) =>
      (['listening', 'reading', 'writing', 'speaking'] as const).map((skill) => ({
        skill, batBuoc: true, coDiem: false, daThi: false, huyPhan: false, choDuyet: false, ...(o[skill] ?? {}),
      }));
    const du = kn({ listening: { coDiem: true }, reading: { coDiem: true }, writing: { coDiem: true }, speaking: { coDiem: true } });
    const so3 = [L(1, 'completed', true), L(2, 'completed', true), L(3)];
    const truoc = [1, 2].map((no) => ({ no, huy: false, lichSu: false, kn: du }));
    const v1 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: du }], 3, so3);
    assert(v1.loai === 'tao' && v1.no === 4, JSON.stringify(v1));
    const v2 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: kn({ listening: { coDiem: true }, reading: { coDiem: true } }) }], 3, so3);
    assert(v2.loai === 'xep-not' && JSON.stringify(v2.kyNang) === '["writing","speaking"]', JSON.stringify(v2));
    const v3 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: kn({}) }], 3, so3);
    assert(v3.loai === 'doi' && v3.no === 3, JSON.stringify(v3));
    const v4 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: true, kn: kn({}) }], 3, so3);
    assert(v4.loai === 'tao' && v4.no === 4, `lịch sử → sang MT4: ${JSON.stringify(v4)}`);
    const choS = kn({ listening: { coDiem: true }, reading: { coDiem: true }, writing: { coDiem: true }, speaking: { choDuyet: true } });
    const v5 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: choS }], 3, so3);
    assert(v5.loai === 'chan' && /chờ Quản lý duyệt/.test(v5.cau), JSON.stringify(v5));
    const v6 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: du }], 3, so3, true);
    assert(v6.loai === 'da-du' && v6.coDiem.length === 4 && v6.coDiem[0] === 'listening', JSON.stringify(v6));
    const v7 = d.viecXepMt([{ no: 1, huy: false, lichSu: false, kn: du }], 3, [L(1, 'completed', true)]);
    assert(v7.loai === 'chan' && v7.cau === d.kiemSoMtMoi([L(1, 'completed', true)], 3), JSON.stringify(v7));
    const v8 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: true, kn: kn({}) }], 3, so3, true);
    assert(v8.loai === 'chan' && /nhập bù/.test(v8.cau), `ép MT lịch sử → chặn: ${JSON.stringify(v8)}`);
  });

  check('PR-XLMT (1) · kiemTuanDaQua: không qua · dời vào tuần qua · trộn qua/tới · em đã có trên web · MT lịch sử (K2-33, Q8)', () => {
    const b = { ngayVaoWeb: '2026-09-29', homNay: '2026-09-29' };
    assert(d.kiemTuanDaQua({ ...b, ketThuc: ['2026-10-04'], taoMoi: true }).cau === null, 'tuần này chưa qua');
    assert(/Không dời vào tuần đã qua/.test(d.kiemTuanDaQua({ ...b, ketThuc: ['2026-09-20'], taoMoi: false }).cau ?? ''), 'dời');
    assert(/cho mọi kỹ năng/.test(d.kiemTuanDaQua({ ...b, ketThuc: ['2026-09-20', '2026-10-04'], taoMoi: true }).cau ?? ''), 'trộn');
    assert(/đã có trên web/.test(d.kiemTuanDaQua({ ...b, ngayVaoWeb: '2026-07-01', ketThuc: ['2026-09-20'], taoMoi: true }).cau ?? ''), 'vào web trước');
    const ok = d.kiemTuanDaQua({ ...b, ketThuc: ['2026-09-06', '2026-09-13'], taoMoi: true });
    assert(ok.cau === null && ok.lichSu, JSON.stringify(ok));
  });

  check('PR-XLMT (1) · thaoTacKyNang: mọi trạng thái × 2⁵ quyền → ≤ 1 nút chính, ≤ 3 mục menu, không trùng, Bỏ kỹ năng chỉ FT (K4-27)', () => {
    const tts = ['khong-yeu-cau', 'chua-xep', 'chua-toi-tuan', 'dang-thi', 'co-diem', 'vang', 'cho-duyet', 'da-huy', 'lich-su'] as const;
    for (const tt of tts) {
      for (let m = 0; m < 32; m++) {
        const q = { nhapDiem: !!(m & 1), quanLy: !!(m & 2), gvcn: !!(m & 4), laFt: !!(m & 8), dotHoanTat: !!(m & 16) };
        const r = d.thaoTacKyNang(tt, q);
        const tat = [...(r.chinh ? [r.chinh] : []), ...r.menu];
        assert(r.menu.length <= 3, `${tt} ${m}: menu ${r.menu.length}`);
        assert(new Set(tat).size === tat.length, `${tt} ${m}: trùng ${tat}`);
        assert(!tat.includes('bo-ky-nang') || q.laFt, `${tt} ${m}: bỏ kỹ năng ở lớp thường`);
        assert(tat.every((x) => !!d.CHU_THAO_TAC[x]), `${tt} ${m}: thiếu chữ`);
      }
    }
    assert(d.canLyDo('doi-lich', false) === false && d.canLyDo('doi-lich', true) && d.canLyDo('bao-vang', false), 'canLyDo');
    assert(d.kiemLyDoThaoTac('Báo vắng', ' ab ') === 'Báo vắng: lý do cần ít nhất 5 ký tự.' && d.kiemLyDoThaoTac('Báo vắng', 'ốm sốt') === null, 'kiemLyDoThaoTac');
    assert(d.tuanMacDinhDotMoi('2026-09-16') === '2026-09-21', d.tuanMacDinhDotMoi('2026-09-16'));
  });

  check('PR-XLMT (1) · trangThaiNhom: cờ mới tuỳ chọn, thứ tự chờ duyệt › vắng › chưa xếp › huỷ › trễ › dời (K4-11)', () => {
    const k = (o: object = {}) => ({ batBuoc: true, tuan: '2026-09-28', xong: false, daDoi: false, ...o });
    assert(d.trangThaiNhom([k({ vang: true }), k({ choDuyet: true })]) === 'cho-duyet', 'chờ duyệt trước vắng');
    assert(d.trangThaiNhom([k({ vang: true }), k({ tuan: null })]) === 'vang', 'vắng trước chưa xếp');
    assert(d.trangThaiNhom([k({ huy: true }), k({ tre: true })]) === 'da-huy', 'huỷ trước trễ');
    assert(d.trangThaiNhom([k({ tre: true }), k({ daDoi: true })]) === 'tre', 'trễ trước dời');
    assert(d.trangThaiNhom([k({ daDoi: true })]) === 'da-doi' && d.trangThaiNhom([k()]) === 'da-xep', 'cũ giữ');
  });

  check('PR-XLMT (1) · chuSeXep + tomTatXepMt: chữ cột "Sẽ xếp" và dòng xem trước (M9, C4)', () => {
    const bai = (skill: any, tu: string | null, den: string, ghiChu: any = 'doi') => ({ skill, tu, den, ghiChu, cau: null });
    const dong: any[] = [
      { studentId: 1, ten: 'A', hanhDong: 'doi', viec: 'doi', attemptNo: 3, loi: null, bai: ['listening', 'reading', 'writing', 'speaking'].map((k) => bai(k, '2026-10-19', '2026-10-12')) },
      { studentId: 2, ten: 'B', hanhDong: 'doi', viec: 'xep-not', attemptNo: 3, loi: null, bai: [bai('writing', '2026-10-19', '2026-10-12'), bai('speaking', '2026-10-19', '2026-10-12', 'canh-bao')] },
      { studentId: 3, ten: 'C', hanhDong: 'tao', viec: 'tao', attemptNo: 4, loi: null, bai: ['listening', 'reading', 'writing', 'speaking'].map((k) => bai(k, null, '2026-10-12', 'moi')) },
      { studentId: 4, ten: 'D', hanhDong: 'tao', viec: 'tao', attemptNo: 4, lichSu: true, loi: null, bai: ['listening', 'reading', 'writing', 'speaking'].map((k) => bai(k, null, '2026-08-17', 'moi')) },
      { studentId: 5, ten: 'E', hanhDong: 'doi', viec: 'thi-lai', attemptNo: 3, loi: null, bai: [bai('listening', '2026-09-14', '2026-10-12')] },
      { studentId: 6, ten: 'F', hanhDong: 'loi', viec: 'chan', attemptNo: 3, loi: 'Chưa có MT2 — xếp MT2 trước rồi mới xếp MT3.', bai: [] },
    ];
    const chu = dong.map((x) => d.chuSeXep(x, null));
    assert(chu[0] === `Dời MT3 · ${d.tuanLich('2026-10-19')} → ${d.tuanLich('2026-10-12')}`, chu[0]);
    assert(chu[1] === 'Xếp nốt W S · MT3', chu[1]);
    assert(chu[2] === `Tạo MT4 · ${d.tuanLich('2026-10-12')}`, chu[2]);
    assert(chu[3].endsWith(' · MT lịch sử'), chu[3]);
    assert(chu[4] === 'Thi lại L · MT3', chu[4]);
    assert(chu[5] === dong[5].loi, chu[5]);
    const t2 = d.tomTatXepMt(dong);
    assert(JSON.stringify(t2) === JSON.stringify({ doi: 1, xepNot: 1, tao: 2, thiLai: 1, canhBao: 1, chan: 1, soEm: 5, soBai: 15 }), JSON.stringify(t2));
  });
}
