import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { lopKq } from '../../ui/BieuTuong.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { DauThe, NutXemToanBo, NutXuat, RongDau, VaoHangLoc, thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { napDanhSach, ptX, sheetDanhSachHoacLoi, soX, xuatBaoCao } from './xuatV2.ts';
import type { OXlsx, SheetDep } from '../../lib/xlsxDep.ts';
import { t } from '@shared/i18n/index.ts';
import { tenMonNgan, type ChiNhanhV2Kq, type DongChiNhanhV2, type TyLeCn } from '@shared/domain/index.ts';

/**
 * BÁO CÁO CHI NHÁNH (Phân tích V2 — đặc tả `2026-11-12-phan-tich-v2-design.md` mục 3, 11, 12; mockup `thiet-ke/2026-11-12-phan-tich-v2/` A1–A6, chủ SP duyệt 12/11).
 * "Các em có theo kịp bài không?" MỘT GET `/tong-quan/v5?baoCao=chi-nhanh` (chỉ phần cần — XM-2). Cột trái: số cỡ trình chiếu (48 px; màn thấp 40) — HV đang học
 * (vào · kết thúc) · Đạt MT · Tiến bộ · Thi thật (FT); lớp thường: HV · Đạt Test · Cuối khoá. Cột phải: Theo lớp (6 lớp / trang, hàng tổng luôn hiện) hoặc
 * Theo chi nhánh (Tất cả) + Tiến bộ theo kỹ năng. Mọi số bấm MỘT lần mở panel đúng tập (2.1b) — panel sẵn có của hàm sinh ra số. "In" giữ.
 */
const pt = (x: TyLeCn | null) => (x && x.mau ? Math.round((100 * x.dat) / x.mau) : null);
const MO = 'text-[color:var(--text-faint)]';

/** Ô số lớn cột trái (mockup `.so-to`). */
function SoTo({ ten, ky, luat, gt, phu, children }: { ten: string; ky: string; luat?: string; gt?: ReactNode; phu?: ReactNode; children?: ReactNode }) {
  return (
    <div className="so-to grid gap-1 rounded-xl border px-[22px] pb-[18px] pt-4 max-sm:px-3 max-sm:pb-3 max-sm:pt-2.5" style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
      <span className="flex flex-wrap items-center gap-x-1.5 text-[17px] font-semibold leading-snug text-[color:var(--text)] max-sm:text-sm">
        {ten} <i className={`not-italic font-normal text-[15px] max-sm:text-[13px] ${MO}`}>· {ky}</i>
        {luat && <NutLuat label={ten}>{luat}</NutLuat>}
      </span>
      {gt != null && <span className="so-to-gt flex flex-wrap items-baseline gap-x-2.5 text-[48px] font-bold leading-[1.1] tabular-nums text-[color:var(--text)] [font-family:var(--phong-so,inherit)] max-sm:text-[28px]">{gt}</span>}
      {children}
      {phu && <span className="text-[15px] leading-snug text-[color:var(--text-dim)] max-sm:text-[13px]">{phu}</span>}
    </div>
  );
}
const Dam = ({ children }: { children: ReactNode }) => <b className="font-semibold tabular-nums text-[color:var(--text)]">{children}</b>;

export function BaoCao(pv: PhamViPhanTich) {
  const [params, setParams] = useSearchParams();
  const ct = pv.ct ?? 'ft';
  const ft = ct === 'ft';
  const q = thamSoLoc({ ...pv, ct, classId: null });
  const api = useApi<ChiNhanhV2Kq>(`/tong-quan/v5?${q}&baoCao=chi-nhanh`, [q]);
  const pt6 = usePhanTrang(Math.max(0, (api.data?.hang.length ?? 0)), q, t('lớp'), 6);
  const { homNay } = useNgayNghiepVu();
  const [dangXuat, setDangXuat] = useState(false);

  if (api.error) return <ErrorState message={api.error.message} hint={api.error.hint} status={api.error.status} onRetry={api.reload} />;
  if (!api.data) return <Skeleton rows={8} />;
  const d = api.data;
  const lop = d.cheDo === 'lop';
  /* Nguồn panel của một hàng: lớp → `lop=`, chi nhánh → `branchId=` (cùng tham số kỳ / khung). */
  const qHang = (h: DongChiNhanhV2) => (h.khoa === 'tong' ? q : h.khoa.startsWith('lop:') ? `${q}&lop=${h.id}` : thamSoLoc({ ...pv, ct, classId: null, branchId: h.id }));
  const nHv = (khoa: string) => `/tong-quan/chi-nhanh/o?${d.branchId ? `branchId=${d.branchId}&` : ''}ct=${ct}&cot=hocVien&khoa=${encodeURIComponent(khoa)}`;
  const nBc = (h: DongChiNhanhV2, o: string) => `/phan-tich/bao-cao/o?${qHang(h)}&o=${encodeURIComponent(o)}`;
  const nThi = (h: DongChiNhanhV2, o: string) => `/phan-tich/thi-that/o?${qHang(h)}&o=${encodeURIComponent(o)}`;
  const nTest = (h: DongChiNhanhV2, cot: string) => `/phan-tich/tong-hop/o?${q}&theo=${lop ? 'lop' : 'cn'}&khoa=${encodeURIComponent(h.khoa)}&cot=${cot}`;
  const nMoi = (o: string, khoa?: string) => `/tong-quan/chi-nhanh-v2/o?${q}&o=${o}${khoa ? `&khoa=${encodeURIComponent(khoa)}` : ''}`;
  const chonCn = (id: number) => { const n = new URLSearchParams(params); n.set('cn', String(id)); setParams(n); };

  /* SL1: ô trong bảng `vung="bang"` — ô hàng Tổng cùng nguồn với dải số bên trái, khoá panel phải khác (không thì hai panel mở rồi tự đóng). */
  const phanTram = (x: TyLeCn | null, nguon: string, tieuDe: string, nho?: boolean) => {
    const v = pt(x);
    if (v == null) return <span className="text-slate-500" title={t('Chưa có dữ liệu')}>—</span>;
    return <OSo giaTri={x!.mau} nhan={`${v} %`} nguon={nguon} tieuDe={tieuDe} className={nho ? '' : 'so-chinh'} vung={nho ? 'bang' : undefined} />;
  };
  const mauSo = (x: TyLeCn | null, dv: string) => (x && x.mau ? <span className={`ml-1.5 text-xs font-normal tabular-nums ${MO}`}>{x.dat}/{x.mau}{dv && ` ${dv}`}</span> : null);
  const thi = (h: DongChiNhanhV2) => {
    if (!h.thi) return <span className="text-slate-500" title={t('Không em nào thi trong kỳ')}>—</span>;
    const o = (n: number, k: 'exceed' | 'dat' | 'fail', kq: 'vuot' | 'dat' | 'duoi', nhan: string) =>
      <OSo giaTri={n} nguon={nThi(h, `tong:${k}`)} tieuDe={`${t('Thi thật')} · ${nhan} · ${h.ten || d.tenChiNhanh || ''}`} className={n ? lopKq(kq) : ''} vung="bang" />;
    return <span className="inline-flex items-baseline gap-2 whitespace-nowrap tabular-nums">{o(h.thi.vuot, 'exceed', 'vuot', t('Vượt'))}<span className={MO}>·</span>{o(h.thi.dat, 'dat', 'dat', t('Đạt'))}<span className={MO}>·</span>{o(h.thi.chuaDat, 'fail', 'duoi', t('Chưa đạt'))}</span>;
  };
  const CK = [['Đạt', 'ck-dat', 'text-kq-vuot'], ['60–69 %', 'ck-60', 'text-soon'], ['50–59 %', 'ck-50', 'text-kq-thieu10'], ['< 50 %', 'ck-duoi50', 'text-kq-duoi']] as const;

  /* ---- cột trái ---- */
  const soHv = (
    <SoTo ten={t('Học viên đang học')} ky={t('hiện tại')} gt={<OSo giaTri={d.hv.dangHoc} nguon={nHv('tong')} tieuDe={t('Học viên đang học')} className="so-chinh" />}
      phu={<>{t('vào')} <OSo giaTri={d.hv.vao} nguon={nMoi('vao')} tieuDe={t('Vào học trong kỳ')} /> · {t('kết thúc')} <OSo giaTri={d.hv.ketThuc} nguon={nMoi('ket-thuc')} tieuDe={t('Kết thúc học trong kỳ')} /> {t('trong kỳ')}</>} />
  );
  const tong = d.tong;
  const cotTrai = ft ? (
    <>
      {soHv}
      <SoTo ten={t('Đạt MT')} ky={t('trong kỳ')} luat={t('HV có lượt MT chốt trong kỳ, Overall so với kỳ vọng của lượt. HV chưa đủ điểm không tính.')}
        gt={phanTram(d.datMt, nBc(tong, 'dat-mt'), t('Đạt MT'))} phu={d.datMt?.mau ? <><Dam>{d.datMt.dat}/{d.datMt.mau}</Dam> {t('HV có MT chốt')}</> : t('Chưa có dữ liệu')} />
      <SoTo ten={t('Tiến bộ')} ky={t('trong kỳ')} luat={t('Lượt kỹ năng có band tăng so mốc MT trước của chính HV.')}
        gt={phanTram(d.tienBo, nBc(tong, 'tien-bo:tat-ca'), t('Tiến bộ'))} phu={d.tienBo?.mau ? <><Dam>{d.tienBo.dat}/{d.tienBo.mau}</Dam> {t('lượt kỹ năng tăng band')}</> : t('Chưa có dữ liệu')} />
      {d.thiThat && (() => {
        const x = d.thiThat; const mau = x.vuot + x.dat + x.chuaDat;
        return (
          <SoTo ten={t('Thi thật')} ky={t('trong kỳ')} luat={t('Cùng số với báo cáo Thi thật. Đạt Target trừ KCK. Chưa có KQ là số hiện tại.')}>
            <span className="grid grid-cols-2 gap-3">
              <span className="grid min-w-0">
                <i className="not-italic whitespace-nowrap text-sm font-medium text-[color:var(--text-dim)] max-sm:text-[13px]">{t('Đạt Target · trừ KCK')}</i>
                <b className="so-thi text-[40px] font-bold leading-[1.15] tabular-nums max-sm:text-[28px]">{phanTram({ dat: x.vuot + x.dat, mau }, nThi(tong, 'tong:co-target'), t('Đạt Target · trừ KCK'))}</b>
                <span className="text-sm text-[color:var(--text-dim)] max-sm:text-[13px]">{mau ? <><Dam>{x.vuot + x.dat}/{mau}</Dam> {t('em')}</> : t('chưa em nào có KQ')}</span>
              </span>
              <span className="grid min-w-0">
                <i className="not-italic text-sm font-medium text-[color:var(--text-dim)] max-sm:text-[13px]">{t('Em thi')}</i>
                <b className="so-thi text-[40px] font-bold leading-[1.15] tabular-nums max-sm:text-[28px]"><OSo giaTri={x.emThi} nguon={nThi(tong, 'tong:thi')} tieuDe={t('Em thi')} className="so-chinh" /></b>
                <span className="text-sm text-[color:var(--text-dim)] max-sm:text-[13px]">{t('Chưa có KQ')} <OSo giaTri={x.chuaCoKq} nguon={nMoi('chua-co-kq')} tieuDe={t('Chưa có KQ')} /> · {t('hiện tại')}</span>
              </span>
            </span>
          </SoTo>
        );
      })()}
    </>
  ) : (
    <>
      {soHv}
      <SoTo ten={t('Đạt Test')} ky={t('trong kỳ')} luat={t('Đếm BÀI: mỗi bài Progress Test / Final Test của một em (đủ điểm mọi môn) tính một lần. Đạt = Progress đạt hết các môn, Final từ 70 % tổng — cùng ô của bảng Test lớp thường.')}
        gt={phanTram(d.datTest, nTest(tong, 'dat-test'), t('Đạt Test'))} phu={d.datTest?.mau ? <><Dam>{d.datTest.dat}/{d.datTest.mau}</Dam> {t('bài · Progress, Final')}</> : t('Chưa có dữ liệu')} />
      <SoTo ten={t('Cuối khoá')} ky={t('trong kỳ')} luat={t('Đếm HỌC VIÊN có bài Final Test đủ môn trong kỳ (thi lại: bài mới nhất), xếp theo % tổng = Σ điểm / Σ câu các môn: Đạt từ 70 % · 60–69 % · 50–59 % · dưới 50 %.')}
        gt={<>{(d.cuoiKhoa ?? [0, 0, 0, 0]).reduce((a, b) => a + b, 0)}<small className="text-[15px] font-medium text-[color:var(--text-dim)]">{t('HV có Final')}</small></>}>
        <span className="mt-1.5 grid grid-cols-4 gap-1.5">
          {CK.map(([nhan, cot, mau], i) => (
            <span key={cot} className="grid rounded-lg border px-2.5 pb-1.5 pt-1 text-sm font-medium text-[color:var(--text-dim)]" style={{ borderColor: 'var(--line-strong)', background: 'var(--surface-2)' }}>
              <span className="whitespace-nowrap">{nhan === 'Đạt' ? t('Đạt') : nhan}</span>
              <b className="text-[22px] font-bold leading-tight tabular-nums"><OSo giaTri={d.cuoiKhoa?.[i] ?? 0} nguon={nMoi(cot, 'tong')} tieuDe={`${t('Cuối khoá')} · ${nhan === 'Đạt' ? t('Đạt') : nhan}`} className={d.cuoiKhoa?.[i] ? mau : ''} /></b>
            </span>
          ))}
        </span>
      </SoTo>
    </>
  );

  /* ---- bảng Theo lớp / Theo chi nhánh ---- */
  const cot: CotBang[] = [
    { key: 'ten', nhan: lop ? t('Lớp') : t('Chi nhánh'), kieu: 'ten', rong: 180 },
    { key: 'hv', nhan: t('HV đang học'), kieu: 'so' },
    ...(ft ? [
      { key: 'datMt', nhan: t('Đạt MT'), dv: t('HV'), kieu: 'so' as const },
      { key: 'tienBo', nhan: t('Tiến bộ'), dv: t('lượt'), kieu: 'so' as const },
      { key: 'thi', nhan: t('Thi thật'), goiY: t('Vượt · Đạt · Chưa đạt Target, trừ KCK'), kieu: 'so' as const, rong: 150 },
    ] : [
      { key: 'datTest', nhan: t('Đạt Test'), dv: t('bài'), kieu: 'so' as const },
      ...CK.map(([nhan, cot]): CotBang => ({ key: cot, nhan: nhan === 'Đạt' ? t('Đạt') : nhan, nhom: t('Cuối khoá'), kieu: 'so' })),
    ]),
  ];
  const oCua = (h: DongChiNhanhV2, c: CotBang): ReactNode => {
    const laTong = h.khoa === 'tong';
    switch (c.key) {
      case 'ten': return laTong ? <b>{h.ten || d.tenChiNhanh}</b> : lop ? <Link className="lk-t ten-ho-so" to={`/hoc-vien/lop/${h.id}`}>{h.ten}</Link>
        : <button type="button" className="lk-t ten-ho-so border-0 bg-transparent p-0 text-left" onClick={() => chonCn(h.id)}>{h.ten}</button>;
      case 'hv': return <OSo giaTri={h.hv} nguon={nHv(h.khoa)} tieuDe={`${t('Học viên đang học')} · ${h.ten || d.tenChiNhanh || ''}`} vung="bang" />;
      case 'datMt': return <span className="whitespace-nowrap">{phanTram(h.datMt, nBc(h, 'dat-mt'), `${t('Đạt MT')} · ${h.ten || d.tenChiNhanh || ''}`, true)}{mauSo(h.datMt, '')}</span>;
      case 'tienBo': return <span className="whitespace-nowrap">{phanTram(h.tienBo, nBc(h, 'tien-bo:tat-ca'), `${t('Tiến bộ')} · ${h.ten || d.tenChiNhanh || ''}`, true)}{mauSo(h.tienBo, '')}</span>;
      case 'thi': return thi(h);
      case 'datTest': return <span className="whitespace-nowrap">{phanTram(h.datTest, nTest(h, 'dat-test'), `${t('Đạt Test')} · ${h.ten || d.tenChiNhanh || ''}`, true)}{mauSo(h.datTest, '')}</span>;
      default: {
        const i = CK.findIndex(([, k]) => k === c.key);
        if (i < 0) return null;
        if (!h.cuoiKhoa) return <span className="text-slate-500" title={t('Không có bài Final trong kỳ')}>—</span>;
        const n = h.cuoiKhoa[i];
        return <OSo giaTri={n} nguon={nMoi(c.key, h.khoa)} tieuDe={`${t('Cuối khoá')} · ${CK[i][0] === 'Đạt' ? t('Đạt') : CK[i][0]} · ${h.ten || d.tenChiNhanh || ''}`} className={n ? CK[i][2] : ''} vung="bang" />;
      }
    }
  };
  /* PR-5 Excel: Tổng quan (các số cột trái) · Theo lớp / Theo chi nhánh (mọi hàng + tổng) · Tiến bộ theo kỹ năng (FT) · Danh sách (em Đạt MT / bài Đạt Test). */
  async function xuatExcel() {
    setDangXuat(true);
    try {
      const tyLe = (x: TyLeCn | null): OXlsx[] => (x && x.mau ? [x.dat, x.mau, ptX(x.dat, x.mau)] : ['—', '—', '—']);
      const tq: OXlsx[][] = [
        [t('Học viên đang học'), t('hiện tại'), d.hv.dangHoc, '', ''], [t('Vào học'), t('trong kỳ'), d.hv.vao, '', ''], [t('Kết thúc học'), t('trong kỳ'), d.hv.ketThuc, '', ''],
        ...(ft ? [
          [t('Đạt MT'), t('trong kỳ · HV'), ...tyLe(d.datMt)], [t('Chưa đủ điểm MT'), t('trong kỳ · HV'), d.datMt?.chuaDu ?? '—', '', ''],
          [t('Tiến bộ'), t('trong kỳ · lượt kỹ năng'), ...tyLe(d.tienBo)],
          ...(d.thiThat ? [
            [`${t('Thi thật')} · ${t('Vượt')}`, t('trong kỳ · trừ KCK'), soX(d.thiThat.vuot, 'vuot'), d.thiThat.vuot + d.thiThat.dat + d.thiThat.chuaDat, ptX(d.thiThat.vuot, d.thiThat.vuot + d.thiThat.dat + d.thiThat.chuaDat)],
            [`${t('Thi thật')} · ${t('Đạt')}`, t('trong kỳ · trừ KCK'), soX(d.thiThat.dat, 'dat'), d.thiThat.vuot + d.thiThat.dat + d.thiThat.chuaDat, ptX(d.thiThat.dat, d.thiThat.vuot + d.thiThat.dat + d.thiThat.chuaDat)],
            [`${t('Thi thật')} · ${t('Chưa đạt')}`, t('trong kỳ · trừ KCK'), soX(d.thiThat.chuaDat, 'chua-dat'), d.thiThat.vuot + d.thiThat.dat + d.thiThat.chuaDat, ptX(d.thiThat.chuaDat, d.thiThat.vuot + d.thiThat.dat + d.thiThat.chuaDat)],
            [`${t('Thi thật')} · ${t('Em thi')}`, t('trong kỳ'), d.thiThat.emThi, '', ''], [`${t('Thi thật')} · ${t('Chưa có KQ')}`, t('hiện tại'), d.thiThat.chuaCoKq, '', ''],
          ] : []),
        ] : [
          [t('Đạt Test'), t('trong kỳ · bài'), ...tyLe(d.datTest)],
          ...CK.map(([nhan], i): OXlsx[] => [`${t('Cuối khoá')} · ${nhan === 'Đạt' ? t('Đạt') : nhan}`, t('trong kỳ · HV'), d.cuoiKhoa ? soX(d.cuoiKhoa[i], i ? 'chua-dat' : 'vuot') : '—',
            d.cuoiKhoa ? d.cuoiKhoa.reduce((a, b) => a + b, 0) : '', d.cuoiKhoa ? ptX(d.cuoiKhoa[i], d.cuoiKhoa.reduce((a, b) => a + b, 0)) : '']),
        ]),
      ];
      const tenHang = (h: DongChiNhanhV2) => h.ten || d.tenChiNhanh || t('Tổng');
      const bangHang = [...d.hang, tong].map((h): OXlsx[] => [tenHang(h), h.hv, ...(ft
        ? [...tyLe(h.datMt), ...tyLe(h.tienBo), ...(h.thi ? [soX(h.thi.vuot, 'vuot'), soX(h.thi.dat, 'dat'), soX(h.thi.chuaDat, 'chua-dat')] : ['—', '—', '—'])]
        : [...tyLe(h.datTest), ...(h.cuoiKhoa ? h.cuoiKhoa.map((n, i) => soX(n, i ? 'chua-dat' : 'vuot')) : ['—', '—', '—', '—'])])]);
      const sheets: SheetDep[] = [
        { ten: t('Tổng quan'), coDinhCot: false, dau: [[t('Chỉ số'), t('Kỳ'), t('Số'), t('Trên'), '%']], hang: tq },
        { ten: lop ? t('Theo lớp') : t('Theo chi nhánh'), tong: [bangHang.length - 1], hang: bangHang,
          dau: ft ? [[lop ? t('Lớp') : t('Chi nhánh'), t('HV đang học'), t('Đạt MT'), null, null, t('Tiến bộ'), null, null, t('Thi thật'), null, null],
            [null, null, t('Đạt'), t('HV'), '%', t('Tăng'), t('Lượt'), '%', t('Vượt'), t('Đạt'), t('Chưa đạt')]]
            : [[lop ? t('Lớp') : t('Chi nhánh'), t('HV đang học'), t('Đạt Test'), null, null, `${t('Cuối khoá')} · ${t('HV')}`, null, null, null],
              [null, null, t('Đạt'), t('Bài'), '%', t('Đạt'), '60–69 %', '50–59 %', '< 50 %']] },
        ...(ft && d.tienBoKn ? [{ ten: t('Tiến bộ theo kỹ năng'), coDinhCot: false, dau: [[t('Kỹ năng'), t('Tăng'), t('Giữ nguyên'), t('Giảm'), t('Lượt'), `% ${t('Tăng')}`]],
          hang: d.tienBoKn.map((x): OXlsx[] => [tenMonNgan(null, x.skill), soX(x.tang, 'vuot'), x.tong - x.tang - x.giam, soX(x.giam, 'chua-dat'), x.tong, ptX(x.tang, x.tong)]) }] : []),
        sheetDanhSachHoacLoi(await napDanhSach(ft ? nBc(tong, 'dat-mt') : nTest(tong, 'dat-test'))),
      ];
      xuatBaoCao({ bao: t('Chi nhánh'), cn: d.tenChiNhanh, ct, khoang: pv.khoang, homNay }, sheets);
    } finally { setDangXuat(false); }
  }
  const trang = lop ? pt6.cat(d.hang) : d.hang;
  const bang = !d.hang.length ? <RongDau chu={lop ? t('Chi nhánh chưa có lớp đang học ở khung này') : t('Chưa có chi nhánh nào trong phạm vi')} nut={<NutXemToanBo />} /> : (
    <>
      <Bang ten={lop ? t('Theo lớp') : t('Theo chi nhánh')} cot={cot} hang={[...trang, tong]} khoa={(h) => h.khoa} oCua={oCua} khung={false} chat deu theLuoi
        lopHang={(h) => (h.khoa === 'tong' ? 'tong' : '')} />
      {lop && <div className="border-t px-3" style={{ borderColor: 'var(--line)' }}><PhanTrang {...pt6.thanh} /></div>}
    </>
  );

  return (
    <div className="bao-cao chi-nhanh">
      <VaoHangLoc o="phai"><NutXuat nhan={t('Xuất Excel')} tat={dangXuat} onClick={xuatExcel} /></VaoHangLoc>
      <style>{'@media print { @page { size: A4 landscape; margin: 10mm; } .bao-cao .card { box-shadow: none; } } .chi-nhanh tr.tong > td { font-weight: 700; border-top: 1px solid var(--line-strong); } @media (max-height: 760px) and (min-width: 1024px) { .chi-nhanh .so-to { padding-top: 6px; padding-bottom: 8px; gap: 0; } .chi-nhanh .so-to > span:first-child { font-size: 15px; } .chi-nhanh .so-to-gt { font-size: 40px; line-height: 1.05; } .chi-nhanh .so-thi { font-size: 28px; line-height: 1.1; } .chi-nhanh .cot-so { gap: 8px; } }'}</style>
      <div className="grid items-start gap-3.5 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)] print:grid-cols-[360px_minmax(0,1fr)]">
        <div className="cot-so grid gap-3 max-lg:grid-cols-2 max-lg:[&>*:first-child]:col-span-2 max-lg:[&>*:nth-child(4)]:col-span-2 max-sm:gap-2">{cotTrai}</div>
        <div className="grid min-w-0 gap-3.5">
          <section className="card overflow-clip">
            <DauThe ten={lop ? t('Theo lớp') : t('Theo chi nhánh')} dem={lop ? t('{n} lớp', { n: d.hang.length }) : t('{n} chi nhánh', { n: d.hang.length })}
              cachTinh={ft ? t('HV đang học: hiện tại. Đạt MT (HV), Tiến bộ (lượt kỹ năng), Thi thật (em, trừ KCK): trong kỳ. Hàng tổng là tập gốc — một em ở hai lớp tính một lần.')
                : t('HV đang học: hiện tại. Đạt Test, Cuối khoá: bài trong kỳ, cùng ô của bảng Test lớp thường.')} />
            {bang}
          </section>
          {ft && d.tienBoKn && <TienBo hang={d.tienBoKn} nguon={(o) => nBc(tong, o)} />}
        </div>
      </div>
    </div>
  );
}

const COT_TB: readonly CotBang[] = [
  { key: 'kn', nhan: t('Kỹ năng'), kieu: 'ten', rong: 64 },
  { key: 'tang', nhan: `↑ ${t('Tăng')}`, kieu: 'so', rong: 80 }, { key: 'giu', nhan: t('Giữ nguyên'), kieu: 'so', rong: 92 }, { key: 'giam', nhan: `↓ ${t('Giảm')}`, kieu: 'so', rong: 80 },
];
/** Tiến bộ theo kỹ năng (giữ bảng sẵn có): lượt có mốc MT trước của em, band kỹ năng tăng · giữ nguyên · giảm so mốc đó. */
function TienBo({ hang, nguon }: { hang: NonNullable<ChiNhanhV2Kq['tienBoKn']>; nguon: (o: string) => string }) {
  type H = (typeof hang)[number];
  const so = (h: H, k: string) => (k === 'tang' ? h.tang : k === 'giam' ? h.giam : h.tong - h.tang - h.giam);
  const oCua = (h: H, c: CotBang): ReactNode => {
    if (c.key === 'kn') return <span className="whitespace-nowrap"><b className="text-slate-100">{tenMonNgan(null, h.skill)}</b> <span className={`text-[13px] font-normal ${MO}`}>{t('{n} lượt', { n: h.tong })}</span></span>;
    const n = so(h, c.key);
    return <span className="whitespace-nowrap"><OSo giaTri={n} tieuDe={`${t('Tiến bộ {kn}', { kn: tenMonNgan(null, h.skill) })} · ${c.nhan}`} nguon={nguon(`tien-bo:${h.skill}:${c.key}`)}
      className={!n ? '' : c.key === 'tang' ? 'text-kq-vuot' : c.key === 'giam' ? 'text-kq-duoi' : ''} />{h.tong ? <span className={`ml-1.5 text-xs tabular-nums ${MO}`}>{Math.round((100 * n) / h.tong)} %</span> : null}</span>;
  };
  return (
    <section className="card overflow-clip">
      <DauThe ten={t('Tiến bộ theo kỹ năng')} phu={t('so mốc MT trước')} />
      {!hang.length ? <RongDau chu={t('Chưa có lượt nào có mốc MT trước trong kỳ')} nut={<NutXemToanBo />} />
        : <Bang ten={t('Tiến bộ theo kỹ năng')} cot={COT_TB} hang={hang} khoa={(h) => h.skill} oCua={oCua} the375={false} deu chat khung={false} />}
    </section>
  );
}
