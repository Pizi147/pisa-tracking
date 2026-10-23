import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ngay, nhanKhoang, rateView, tuanLich,
  type ChuongTrinh, type HangPtGv, type KhoangNgay, type KhungPtGv, type OPtGv, type PhanTichGvKq,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { useApi } from '../../lib/useApi.ts';
import { useThamSoUrl } from '../../lib/quayLai.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { BoLocDoan, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { gopKq, phuGv, tyLeGv } from '../worklist/TongQuanV5.tsx';

/**
 * PHÂN TÍCH GV (UI-PHAN-TICH, `thiet-ke/v5/phan-tich.html` tab "Phân tích GV"; `10` mục 1 + dòng UI-PHAN-TICH): MỘT bảng, hai nhóm cột Hành chính / Học thuật.
 * Bộ cột Gọn (mặc định, vừa 1280 không cuộn) / Đầy đủ (`?cot=day`). Không KPI, không xếp hạng, không màu ngưỡng (C08) — xếp theo tên. Mỗi số mở panel
 * CHỈ ĐỌC đúng tập (C22): `/phan-tich/giao-vien/o` (cùng hàm ô), Quá hạn = Trễ chấm Tổng quan, Case có PA = hồ sơ GV — cùng nguồn Tổng quan › GV cần chú ý.
 * Chấm Test đúng hạn giữ panel Chấm điểm V4 (lọc Trễ). "Xử lý vi phạm" bỏ (10, 22/10). < 640 px: thẻ (Bang).
 */
type TyLe = { dat: number; mau: number };
const HC = t('HÀNH CHÍNH'), HT = t('HỌC THUẬT');
/*
 * Chủ SP 23/10 (vòng 2): cột tên cố định (các cột số trải đều cả bề rộng, không dồn phải); bỏ cột "Quá hạn" — bài trễ chấm hiếm, hiện "⚠ n quá hạn" ngay dưới
 * ô "Chấm Test đúng hạn"; Hành chính | Học thuật tách bằng vạch dọc + nền đầu nhóm. Đầy đủ không còn "Ghi KQ PA" (trùng hẳn "Việc đúng hạn" — một tập việc).
 */
const COT_GON: readonly CotBang[] = [
  { key: 'gv', nhan: t('Giáo viên'), kieu: 'ten', rong: 240 },
  { key: 'viec', nhan: t('Việc đúng hạn'), kieu: 'phan-tram', rong: 160, nhom: HC, tach: true },
  { key: 'diem', nhan: t('Chấm Test đúng hạn'), kieu: 'phan-tram', rong: 170, nhom: HC },
  { key: 'dat', nhan: t('Đạt MT'), kieu: 'phan-tram', rong: 150, nhom: HT, tach: true },
  { key: 'tb', nhan: t('Tiến bộ'), kieu: 'phan-tram', rong: 150, nhom: HT },
  { key: 'chuY', nhan: t('HV cần chú ý'), kieu: 'so', rong: 150, nhom: HT },
];
const COT_DAY: readonly CotBang[] = [
  { ...COT_GON[0], rong: 220 }, ...COT_GON.slice(1, 3).map((c) => ({ ...c, rong: 124 })),
  ...COT_GON.slice(3).map((c) => ({ ...c, rong: 108 })),
  { key: 'casePa', nhan: t('Case có PA'), kieu: 'phan-tram', rong: 108, nhom: HT },
  { key: 'pa', nhan: t('PA cải thiện'), kieu: 'phan-tram', rong: 108, nhom: HT },
  { key: 'tt', nhan: t('Đạt Target thi thật'), kieu: 'phan-tram', rong: 124, nhom: HT },
];
/** Cột chỉ Fast Track (lớp thường không có MT / tiến bộ band / PA cải thiện / thi thật) — "Đạt MT" lớp thường đổi thành "Kết quả" (đạt ≥ 70 %). */
const CHI_FT = new Set(['tb', 'pa', 'tt']);
const boDau = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

/** % to bấm được + "n/m" dòng phụ (Bang `phuCua`); mẫu 0 → "—" (title "Chưa có dữ liệu"), không 0 % (T19). */
function OPt({ x, nguon, tieuDe, onBam }: { x: TyLe | null; nguon?: string; tieuDe: string; onBam?: () => void }) {
  if (!x) return <span className="text-slate-500">—</span>;
  const v = rateView(x.dat, x.mau);
  if (v.kind !== 'value') return <span className="text-slate-500" title={t('Chưa có dữ liệu')} aria-label={t('Chưa có dữ liệu')}>—</span>;
  if (onBam) {
    return (
      <button type="button" onClick={onBam} aria-label={t('{gt} — {ten}. Bấm để xem danh sách', { gt: `${v.percent} %`, ten: tieuDe })}
        className="cursor-pointer appearance-none border-0 bg-transparent p-0 font-semibold tabular-nums text-[color:var(--link,var(--accent))] underline decoration-dotted underline-offset-4 max-sm:-m-3 max-sm:p-3">{v.percent} %</button>
    );
  }
  return <OSo giaTri={x.mau} nhan={`${v.percent} %`} nguon={nguon!} tieuDe={tieuDe} />;
}

export function PhanTichGiaoVien({ branchId, ct, khoang }: { branchId: number | null; ct: ChuongTrinh; khoang: KhoangNgay }) {
  const khung: KhungPtGv = ct;
  const [boCot, setBoCot] = useThamSoUrl('cot', 'gon');
  const [tim, setTim] = useState('');
  const [chamDiem, setChamDiem] = useState<HangPtGv | null>(null);
  const q = new URLSearchParams({ ct: khung, ...(branchId ? { cn: String(branchId) } : {}), kieu: khoang.kieu, tu: khoang.tu, den: khoang.den });
  const { data, loading, error, reload } = useApi<PhanTichGvKq>(branchId ? `/phan-tich/giao-vien?${q}` : null, [q.toString()]);
  const hang = (data?.hang ?? []).filter((h) => !tim.trim() || boDau(h.ten).includes(boDau(tim.trim())));
  const pt = usePhanTrang(hang.length, `${q}|${tim}`, 'giáo viên');

  if (!branchId) return <Empty title={t('Chọn một chi nhánh')} hint={t('Bảng giáo viên luôn là một chi nhánh — chọn ở ô chi nhánh đầu trang.')} />;
  const ft = khung === 'ft';
  const day = boCot === 'day';
  const cot = (day ? COT_DAY : COT_GON).filter((c) => ft || !CHI_FT.has(c.key)).map((c) => (!ft && c.key === 'dat' ? { ...c, nhan: t('Kết quả') } : c));
  const nguonO = (h: HangPtGv, c: string) => `/phan-tich/giao-vien/o?${q}&gv=${h.id}&cot=${encodeURIComponent(c)}`;
  const ctQ = `cn=${branchId}&ct=${khung}`;
  /* Mỗi cột: tỷ lệ (`TyLe`) + nguồn panel — cùng nguồn với Tổng quan › GV cần chú ý. */
  const tyLe = (h: HangPtGv, k: string): TyLe | null => ({
    viec: tyLeGv(h.viecDungHan), diem: tyLeGv(h.chamDiem),
    dat: h.datMt ? tyLeGv(h.datMt) : gopKq(h.ketQua), tb: tyLeGv(h.tienBo), casePa: tyLeGv(h.casePa), pa: tyLeGv(h.paHieuQua), tt: tyLeGv(h.thiThat),
  } as Record<string, TyLe | null>)[k] ?? null;
  const NGUON: Record<string, (h: HangPtGv) => string> = {
    viec: (h) => nguonO(h, 'viec-dung-han'), dat: (h) => nguonO(h, ft ? 'dat-mt' : 'ket-qua'), tb: (h) => nguonO(h, 'tien-bo'),
    casePa: (h) => `/giao-vien/${h.id}/o?cot=case-mo&${ctQ}`, pa: (h) => nguonO(h, 'pa-hieu-qua'), tt: (h) => nguonO(h, 'thi-that'),
  };
  const DV: Record<string, string> = { viec: t('việc'), diem: t('bài'), dat: t('lượt'), tb: t('lượt'), casePa: 'Case', pa: 'PA', tt: t('lượt') };
  const oCua = (h: HangPtGv, c: CotBang): ReactNode => {
    if (c.key === 'gv') return <Link to={`/giao-vien/${h.id}`} className="ten-ho-so font-semibold">{h.ten}</Link>;
    if (c.key === 'chuY') return <OSo giaTri={h.hvChuY} tieuDe={`${t('HV cần chú ý')} · ${h.ten}`} nguon={nguonO(h, 'hv-chu-y')} />;
    const tieuDe = `${c.nhan} · ${h.ten}`;
    if (c.key === 'diem') return <OPt x={tyLe(h, 'diem')} tieuDe={tieuDe} onBam={() => setChamDiem(h)} />;
    return <OPt x={tyLe(h, c.key)} nguon={NGUON[c.key](h)} tieuDe={tieuDe} />;
  };
  const phuCua = (h: HangPtGv, c: CotBang): ReactNode => {
    if (c.key === 'gv') return phuGv(h);
    if (c.key === 'diem') {
      const x = tyLe(h, 'diem');
      return (
        <>
          {x && x.mau ? `${x.dat}/${x.mau} ${t('bài')}` : null}
          {h.quaHan > 0 && (
            <span className="block font-semibold text-bad">⚠ <OSo giaTri={h.quaHan} nhan={t('{n} quá hạn', { n: h.quaHan })} className="text-bad" tieuDe={t('Bài trễ chấm · {ten}', { ten: h.ten })} nguon={`/tong-quan/ql/tre?gv=${h.id}&branchId=${branchId}&ct=${khung}`} /></span>
          )}
        </>
      );
    }
    if (c.key === 'chuY') return null;
    const x = tyLe(h, c.key);
    return x && x.mau ? `${x.dat}/${x.mau} ${DV[c.key] ?? ''}`.trim() : null;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 print:hidden">
        <span className="text-sm text-slate-400">{t('Bộ cột')}</span>
        <span role="group" aria-label={t('Bộ cột')} className="inline-flex overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line-strong)' }}>
          {([['gon', t('Gọn')], ['day', t('Đầy đủ')]] as const).map(([k, nhan]) => (
            <button key={k} type="button" aria-pressed={boCot === k} onClick={() => setBoCot(k)}
              className={`min-h-[44px] px-3 text-sm sm:min-h-[34px] ${boCot === k ? 'bg-[color:var(--accent-soft)] font-bold text-[color:var(--accent)]' : 'text-slate-400'}`}>{nhan}</button>
          ))}
        </span>
        <input type="search" name="tim-gv" autoComplete="off" className="field w-56 max-sm:min-h-[44px] max-sm:w-full" placeholder={t('Tìm GV…')} aria-label={t('Tìm GV')} value={tim} onChange={(e) => setTim(e.target.value)} />
        {data && (
          <span className="text-xs text-slate-400 sm:ml-auto">
            {t('{n} GV {cn} · {ky} · xếp theo tên', { n: data.hang.length, cn: data.tenChiNhanh, ky: nhanKhoang(khoang).chinh })}
          </span>
        )}
      </div>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : loading || !data ? <Skeleton rows={6} />
        : (
          <>
            <PhanTrang {...pt.thanh} />
            <div className="bang-gv">
            <Bang ten={t('Phân tích GV — Hành chính và Học thuật')} cot={cot} hang={pt.cat(hang)} khoa={(h) => h.id} oCua={oCua} phuCua={phuCua} deu
              rong={{ tieuDe: tim.trim() ? t('Không GV nào khớp "{q}"', { q: tim.trim() }) : t('Không có giáo viên nào có {khung} trong khoảng này.', { khung: ft ? t('lớp Fast Track') : t('lớp thường') }) }} />
            </div>
            <PhanTrang {...pt.thanh} duoi />
            {chamDiem && <PanelChamDiem kq={data} h={chamDiem} onDong={() => setChamDiem(null)} />}
          </>
        )}
    </div>
  );
}

// ------------------------------------------------------------------ panel Chấm điểm (màn C)

type DongCham = {
  id: number; studentId: number; hocVien: string; lop: string; bai: string; mon: string; tuan: string; han: string;
  nhapDau: string | null; tre: number | null; dung: boolean; sua: string | null;
};
type PanelCham = { ten: string; tenChiNhanh: string; khung: KhungPtGv; tu: string; den: string; n: number; tre: number; khongTinhVang: number; rows: DongCham[] };

function Dau({ ok }: { ok: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="shrink-0">
      {ok
        ? <path d="M2.5 6.3 5 8.6l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M3.5 3.5l5 5M8.5 3.5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
}

function PanelChamDiem({ kq, h, onDong }: { kq: PhanTichGvKq; h: HangPtGv; onDong: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const [chiTre, setChiTre] = useState(false);
  const q = new URLSearchParams({ cn: String(kq.cn), ct: kq.khung, gv: String(h.id), ...(kq.thang ? { thang: kq.thang } : { tu: kq.tu, den: kq.den }) });
  const { data, loading, error, reload } = useApi<PanelCham>(`/phan-tich/giao-vien/cham-diem?${q}`, [q.toString()]);
  const rows = (data?.rows ?? []).filter((r) => !chiTre || !r.dung);
  const pt = usePhanTrang(rows.length, `${q}|${chiTre}`, 'ô');
  const khoang = `${tuanLich(kq.tu, homNay)} – ${tuanLich(kq.den, homNay)}`;
  return (
    <KhungPanel tieuDe={`${t('Chấm Test đúng hạn')} · ${h.ten}`} rong="rong" onDong={onDong}
      ngCanh={data ? (
        <span className="text-xs text-slate-400">
          {kq.khung === 'ft' ? 'Fast Track' : 'Lớp thường'} · {data.tenChiNhanh} · tuần Test <span className="tabular-nums">{khoang}</span> ·{' '}
          <b className="tabular-nums text-slate-200">{data.n}</b> đúng hạn · <b className="tabular-nums text-slate-200">{data.tre}</b> trễ · <span className="tabular-nums">{data.rows.length}</span> ô
        </span>
      ) : undefined}
      tabs={data ? (
        <BoLocDoan<'tat-ca' | 'tre'> ariaLabel="Lọc ô điểm" value={chiTre ? 'tre' : 'tat-ca'} onChange={(v) => setChiTre(v === 'tre')}
          muc={[{ key: 'tat-ca', nhan: 'Tất cả', so: data.rows.length }, { key: 'tre', nhan: 'Trễ', so: data.tre }]} />
      ) : undefined}
      chan={{
        huy: { nhan: 'Đóng', onClick: onDong },
        phu: (
          <span className="text-xs text-slate-400">
            Không tính: {data?.khongTinhVang ? <><span className="tabular-nums">{data.khongTinhVang}</span> ô vắng đã xác nhận · </> : null}ô chưa tới hạn và chưa nhập.
          </span>
        ),
        chinh: <Link to="/test/lich" className="link text-xs">Mở Lịch Test / Chấm Test ›</Link>,
      }}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : loading || !data ? <div className="pt-3"><Skeleton rows={6} /></div>
        : !rows.length ? <div className="pt-3"><Empty title={chiTre ? 'Không có ô trễ.' : 'Không có ô điểm nào trong khoảng này.'} /></div>
        : (
          <>
          <div className="mt-2"><PhanTrang {...pt.thanh} /></div>
          <div className="table-scroll rounded-lg border" style={{ borderColor: 'var(--line)' }} role="region" aria-label="Danh sách ô điểm" tabIndex={0}>
            <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '640px' }}>
              <colgroup><col style={{ width: '20%' }} /><col style={{ width: '23%' }} /><col style={{ width: '11%' }} /><col style={{ width: '11%' }} /><col style={{ width: '16%' }} /><col style={{ width: '19%' }} /></colgroup>
              <thead><tr className="whitespace-nowrap">
                <th className="th">Học viên</th><th className="th">Lớp · bài · kỹ năng</th><th className="th">Tuần Test</th>
                <th className="th text-right">Hạn chấm</th><th className="th text-right">Lần nhập đầu</th><th className="th">Kết quả</th>
              </tr></thead>
              <tbody>
                {pt.cat(rows).map((r) => (
                  <tr key={r.id} style={r.dung ? undefined : { boxShadow: 'inset 3px 0 0 rgb(var(--bad-rgb))' }}>
                    <td className="td"><Link to={`/hoc-vien/${r.studentId}`} className="link">{r.hocVien}</Link></td>
                    <td className="td text-slate-300">{r.lop} · {r.bai} · {r.mon}</td>
                    <td className="td whitespace-nowrap tabular-nums">{tuanLich(r.tuan, homNay)}</td>
                    <td className="td whitespace-nowrap text-right text-xs tabular-nums">{ngay(r.han, homNay)}</td>
                    <td className="td whitespace-nowrap text-right text-xs tabular-nums">
                      {r.nhapDau ? ngay(r.nhapDau, homNay) : <span className="text-slate-400">chưa nhập</span>}
                      {r.sua && <span className="block text-xs text-slate-400">sửa {ngay(r.sua, homNay)}</span>}
                    </td>
                    <td className="td">
                      <span className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold ${r.dung ? 'text-ok' : 'text-bad'}`}>
                        <Dau ok={r.dung} />{r.dung ? 'Đúng hạn' : `Quá hạn · ${r.tre} ngày`}
                      </span>
                      {!r.dung && !r.nhapDau && <span className="block text-xs text-slate-400">tới hôm nay {ngay(homNay, homNay)}</span>}
                      {r.dung && r.sua && <span className="block text-xs text-slate-400">lần sửa không tính</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PhanTrang {...pt.thanh} duoi />
          </>
        )}
    </KhungPanel>
  );
}
