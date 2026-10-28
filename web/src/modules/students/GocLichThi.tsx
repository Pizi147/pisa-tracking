import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton, TargetText } from '../../ui/ui.tsx';
import { NhanLich } from '../../ui/Nhan.tsx';
import { Bang, OBang, type CotBang } from '../../ui/Bang.tsx';
import { ODiem } from '../../ui/ODiem.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { skillShort } from '../../lib/format.ts';
import {
  dsThangLichThi, nhanThang, thangTrongKhoang, nhanThangDuKien, shortDate, thangKeTiep, tuanLich,
  type ExamPlan, type KetLuanLichThi, type KetQuaVao, type LichThi, type NguCanhDs,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** Một hàng của `GET /hoc-vien-lop/lich-thi` (server/src/classes/lichThi.ts → HangLichThi). */
type Luu = { ketLuan: KetLuanLichThi | null; thang: string | null; ghiChu: string | null; ai: string | null; luc: string };
type Kn = Record<'L' | 'R' | 'W1' | 'W2' | 'S', number | null>;
type Hang = {
  studentId: number; cycleId: number | null; ten: string; ma: string; classId: number; classCode: string; thuong: boolean; gvcn: string | null; tvv: string | null;
  target: number | null; kck: boolean; standing: KetQuaVao | null;
  duKien: ExamPlan; coNgay: boolean; thangDuKien: string | null; chuaCo: boolean; ketLuan: KetLuanLichThi | null; luu: Luu | null; coTheSua: boolean;
  lichThi: LichThi;
  chot: { luc: string; ai: string | null } | null;
  chiTiet: {
    kn: Kn | null; sapToi: { luot: string; tuan: string } | null; caseMo: string[];
    lichSu: { luc: string; ai: string | null; ketLuan: string | null; ngay: string | null; ghiChu: string | null }[];
  };
};
type Trang = { thang: string[]; rows: Hang[] };
type TrangThaiLuu = { kieu: 'luu' | 'xong' | 'loi'; loi?: string; lai?: () => void };
/** Hàng đang hiện: dữ liệu máy chủ + việc làm tại chỗ. Em vừa dời tháng ra khỏi khoảng đang xem vẫn ở lại tới khi rời trang ("Đã dời sang 11/2026"). */
type HangHien = Hang & { doiSang: string | null; tt?: TrangThaiLuu };

/** Hai nút của hàng (V4 Q-C3 ①): Chốt ngày · Dời tháng — mở một hộp nhỏ ngay dưới hàng (ngày / tháng + ghi chú). */
type Hop = { id: number; kieu: 'chot' | 'doi' };

const KN_MINI = ['L', 'R', 'W1', 'W2', 'S'] as const;
const NHOM = ['chua-chot-ngay', 'da-chot-ngay', 'du-kien', 'chua-co'] as const;
type Nhom = (typeof NHOM)[number];
const nhomCua = (l: LichThi): Nhom => (l.trangThai === 'da-thi' ? 'da-chot-ngay' : l.trangThai);
const TEN_NHOM: Record<Nhom, string> = {
  'chua-chot-ngay': t('Chưa chốt ngày — đã tới tháng'), 'da-chot-ngay': t('Đã chốt ngày'), 'du-kien': t('Dự kiến'), 'chua-co': t('Chưa có tháng thi'),
};

/** `?thang=` của trang → khoảng [từ, đến]; mặc định tháng này → tháng sau (V4 khung 3: 09/2026 → 10/2026). */
export function khoangThang(thangUrl: string | null, homNay: string): [string, string] {
  const d = dsThangLichThi(thangUrl);
  return d.length ? [d[0], d[d.length - 1]] : [homNay.slice(0, 7), thangKeTiep(homNay)];
}

/** MỘT chip lịch thi thật cho Học viên & Lớp (cột Lịch thi + góc Lịch thi): Thi 17/09 · Đã thi · Chưa chốt · 09/2026 · Dự kiến 10/2026 · Chưa có lịch. */
export function ChipLichThi({ l, them }: { l: LichThi | null | undefined; them?: string }) {
  const { homNay } = useNgayNghiepVu();
  if (!l || l.trangThai === 'chua-co') return <NhanLich loai="chua">{t('Chưa có lịch')}</NhanLich>;
  const sau = them ? ` · ${them}` : '';
  if (l.trangThai === 'da-chot-ngay') return <NhanLich loai="co">{t('Thi {ngay}', { ngay: shortDate(l.ngay, homNay) })}{sau}</NhanLich>;
  if (l.trangThai === 'da-thi') return <NhanLich loai="da-thi">{t('Đã thi {ngay}', { ngay: shortDate(l.ngay, homNay) })}{sau}</NhanLich>;
  const moc = l.tuan ? tuanLich(l.tuan, homNay) : nhanThang(l.thang!);
  return l.trangThai === 'chua-chot-ngay'
    ? <NhanLich loai="du-kien">{t('Chưa chốt · {moc}', { moc })}</NhanLich>
    : <NhanLich loai="du-kien">{nhanThangDuKien(l.thang!)}</NhanLich>;
}

/** Overall so với kỳ vọng → ký hiệu của `ODiem` (vượt / bằng / dưới). */
export const kqOverall = (ovr: number | null | undefined, kv: number | null | undefined) =>
  ovr == null || kv == null ? null : ovr > kv ? 'vuot' as const : ovr === kv ? 'bang' as const : 'duoi' as const;

/** Dải 5 ô nhỏ L R W1 W2 S (W1 W2 riêng); ô dưới kỳ vọng chữ đỏ. */
export function MiniKn({ kn, kv }: { kn: Kn; kv: number | null }) {
  return (
    <span className="flex flex-wrap gap-x-2 text-[12px] tabular-nums text-slate-300">
      {KN_MINI.map((k) => (
        <span key={k} className={kn[k] != null && kv != null && kn[k]! < kv ? 'text-bad' : ''}>
          <span className="mr-0.5 text-faint">{k}</span>{kn[k] != null ? kn[k]!.toFixed(1) : '—'}
        </span>
      ))}
    </span>
  );
}

/**
 * HỌC VIÊN & LỚP › LỊCH THI (UI-HV-LOP — V4 `mockup-v4-hoc-vien-lop.html` khung 3 + trường của `mockup-ov14-5`): Tháng dự kiến [từ] → [đến];
 * nhóm theo trạng thái (Chưa chốt ngày — đã tới tháng · Đã chốt ngày · Dự kiến · Chưa có tháng thi gập); hàng: Học viên (lớp · TVV) · MT gần nhất ·
 * Target · Lịch thi · Ghi chú · [Chốt ngày] [Dời tháng] · ▸ mở chi tiết dưới hàng. Lưu ngay (`PUT /hoc-vien-lop/lich-thi/:cycleId`, có nhật ký).
 * `duongGoc`: đuôi truy vấn của trang (`?q=&phamVi=&branchId=`) — cùng phạm vi các góc kia. Khoảng tháng trên URL (`thang=từ,đến`).
 */
export function GocLichThi({ duongGoc, thangUrl, onDoiThang, onIds, ds, locTren }: {
  duongGoc: string; thangUrl: string | null; onDoiThang: (thang: string[]) => void;
  /** Em đang hiện (trừ nhóm gập) — nút Xuất đầu trang lấy đúng danh sách này. */
  onIds?: (ids: number[]) => void;
  ds?: NguCanhDs;
  /** Ô lọc chung của trang (chi nhánh …) đặt trong dải lọc của góc. */
  locTren?: ReactNode;
}) {
  const { homNay } = useNgayNghiepVu();
  const [tu, den] = khoangThang(thangUrl, homNay);
  const thang = useMemo(() => thangTrongKhoang(tu, den), [tu, den]);
  const duong = `/hoc-vien-lop/lich-thi${duongGoc}${duongGoc.includes('?') ? '&' : '?'}thang=${thang.join(',')}`;
  const { data, loading, error, reload, cu } = useApi<Trang>(duong, [duong], { giuCu: true });
  const [rows, setRows] = useState<HangHien[]>([]);
  useEffect(() => { setRows((data?.rows ?? []).map((r) => ({ ...r, doiSang: null }))); }, [data]);
  const [moChuaCo, setMoChuaCo] = useState(false);
  const [mo, setMo] = useState<Set<number>>(new Set());
  const [hop, setHop] = useState<Hop | null>(null);

  type DongBang = { loai: 'nhom'; khoa: string; nhom: Nhom; so: number } | { loai: 'hang'; khoa: string; nhom: Nhom; r: HangHien };
  const theoNhom = useMemo(() => {
    const m = new Map<Nhom, HangHien[]>(NHOM.map((k) => [k, []]));
    for (const r of rows) m.get(r.doiSang ? 'du-kien' : nhomCua(r.lichThi))!.push(r);
    return m;
  }, [rows]);
  const dongBang: DongBang[] = NHOM.flatMap((k) => {
    const ds_ = theoNhom.get(k)!;
    if (!ds_.length) return [];
    return [{ loai: 'nhom' as const, khoa: `n:${k}`, nhom: k, so: ds_.length },
      ...(k === 'chua-co' && !moChuaCo ? [] : ds_.map((r) => ({ loai: 'hang' as const, khoa: `h:${r.studentId}`, nhom: k, r })))];
  });
  const hienIds = rows.filter((r) => moChuaCo || nhomCua(r.lichThi) !== 'chua-co' || r.doiSang).map((r) => r.studentId);
  useEffect(() => { onIds?.(hienIds); }, [hienIds.join(',')]);   // eslint-disable-line react-hooks/exhaustive-deps

  const sua = (id: number, f: (r: HangHien) => HangHien) => setRows((x) => x.map((r) => (r.studentId === id ? f(r) : r)));
  /** Lưu MỘT kết luận + ghi chú; lỗi thì giữ hộp đang mở (chữ đang gõ còn nguyên) và cho Thử lại. */
  const luu = (r: HangHien, body: { ketLuan?: KetLuanLichThi; ngay?: string; thang?: string; ghiChu?: string }) => {
    if (!r.cycleId) return;
    sua(r.studentId, (x) => ({ ...x, tt: { kieu: 'luu' } }));
    api.put<Partial<Hang>>(`/hoc-vien-lop/lich-thi/${r.cycleId}`, body)
      .then((kq) => {
        /* Làm mới các trang khác nhưng KHÔNG đường của chính góc này — tải lại làm em vừa dời tháng biến mất khỏi danh sách. */
        invalidate('/hoc-vien-lop?'); invalidate('/hoc-vien-lop/theo-vai'); invalidate('/hoc-vien-lop/em'); invalidate('/students');
        const doi = body.ketLuan === 'chuyen-thang' && body.thang && !thang.includes(body.thang) ? body.thang : null;
        sua(r.studentId, (x) => ({ ...x, ...kq, doiSang: doi, tt: { kieu: 'xong' } }));
        setHop(null);
      })
      .catch((e: any) => sua(r.studentId, (x) => ({ ...x, tt: { kieu: 'loi', loi: e?.message ?? t('Không lưu được'), lai: () => luu(r, body) } })));
  };
  const doiMo = (id: number) => setMo((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const dem = { b: theoNhom.get('chua-chot-ngay')!.length, a: theoNhom.get('da-chot-ngay')!.length, dk: theoNhom.get('du-kien')!.length };

  return (
    <div className="card overflow-hidden !p-0">
      <div className="flex flex-wrap items-center gap-2 border-b p-3" style={{ borderColor: 'var(--line)' }} data-hd="hvl-lich-thi">
        <span className="text-[13px] text-slate-400">{t('Tháng dự kiến')}</span>
        <span className="w-[150px]"><ONgay kieu="thang" gon value={tu} ariaLabel={t('Từ tháng')} onChange={(m) => m && onDoiThang(m.slice(0, 7) > den ? [m.slice(0, 7), m.slice(0, 7)] : [m.slice(0, 7), den])} /></span>
        <span aria-hidden className="text-slate-400">→</span>
        <span className="w-[150px]"><ONgay kieu="thang" gon value={den} ariaLabel={t('Đến tháng')} onChange={(m) => m && onDoiThang(m.slice(0, 7) < tu ? [m.slice(0, 7), m.slice(0, 7)] : [tu, m.slice(0, 7)])} /></span>
        {locTren}
        {data && (
          <span className="ml-auto text-xs tabular-nums text-slate-400 max-sm:hidden">
            {t('{b} chưa chốt ngày · {a} đã chốt · {dk} dự kiến', dem)}
          </span>
        )}
      </div>
      {error && <div className="p-3"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>}
      {loading && !data && <div className="p-3"><Skeleton rows={5} /></div>}
      {data && rows.length === 0 && <Card><Empty title={t('Không có HV có lịch thi trong {khoang}.', { khoang: `${nhanThang(tu)} → ${nhanThang(den)}` })} /></Card>}
      {data && rows.length > 0 && (
        <div className={cu ? 'dang-tai-lai' : undefined} aria-busy={cu || undefined}>
        <Bang ten={t('Lịch thi')} cot={COT_LICH} hang={dongBang} khoa={(x) => x.khoa} khung={false} the375={false} dinh
          hangRieng={(x) => x.loai === 'nhom' ? (
            <tr className="bg-[color:var(--surface-2)]">
              <td colSpan={COT_LICH.length} className="px-3 py-2 text-[13px] font-semibold text-slate-100">
                {x.nhom === 'chua-co'
                  ? <button type="button" aria-expanded={moChuaCo} onClick={() => setMoChuaCo(!moChuaCo)} className="min-h-[44px] cursor-pointer appearance-none border-0 bg-transparent p-0 font-semibold text-slate-100 sm:min-h-0">
                      {moChuaCo ? '▾' : '▸'} {TEN_NHOM[x.nhom]} · <span className="tabular-nums">{x.so}</span></button>
                  : <>{TEN_NHOM[x.nhom]} · <span className="tabular-nums">{x.so}</span></>}
              </td>
            </tr>
          ) : (
            <DongLichThi r={x.r} ds={ds} mo={mo.has(x.r.studentId)} onMo={() => doiMo(x.r.studentId)} nhom={x.nhom}
              hop={hop?.id === x.r.studentId ? hop.kieu : null} onHop={(kieu) => setHop(kieu ? { id: x.r.studentId, kieu } : null)} onLuu={(b) => luu(x.r, b)} />
          )} />
        </div>
      )}
    </div>
  );
}

const COT_LICH: CotBang[] = [
  { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 260 },
  { key: 'mt', nhan: t('MT gần nhất'), kieu: 'chu', rong: 150 },
  { key: 'target', nhan: 'Target', kieu: 'so' },
  { key: 'lich', nhan: t('Lịch thi'), kieu: 'chu', rong: 200 },
  { key: 'ghi', nhan: t('Ghi chú'), kieu: 'chu' },
  { key: 'nut', nhan: '', kieu: 'chu', rong: 210 },
  { key: 'mo', nhan: '', kieu: 'nut' },
];
const [C_TEN, C_MT, C_TARGET, C_LICH, C_GHI, C_NUT, C_MO] = COT_LICH;

function DongLichThi({ r, ds, mo, onMo, nhom, hop, onHop, onLuu }: {
  r: HangHien; ds?: NguCanhDs; mo: boolean; onMo: () => void; nhom: Nhom;
  hop: 'chot' | 'doi' | null; onHop: (k: 'chot' | 'doi' | null) => void;
  onLuu: (b: { ketLuan?: KetLuanLichThi; ngay?: string; thang?: string; ghiChu?: string }) => void;
}) {
  const st = r.standing;
  const khoa = !r.coTheSua || r.tt?.kieu === 'luu';
  const daChot = r.lichThi.trangThai === 'da-chot-ngay' || r.lichThi.trangThai === 'da-thi';
  const phuEm = [r.classCode, r.tvv ? `TVV ${r.tvv}` : t('chưa có TVV')].join(' · ');
  return (
    <>
      <tr className={mo ? 'dang-mo' : ''}>
        <OBang c={C_TEN}>
          <Link className="ten-ho-so block truncate" to={`/hoc-vien/${r.studentId}`} state={ds ? { ds } : undefined}>{r.ten}</Link>
          <span className="block truncate text-xs text-slate-400" title={phuEm}>{phuEm}</span>
        </OBang>
        <OBang c={C_MT}><ODiem so={st?.overall != null ? st.overall.toFixed(1) : null} kq={kqOverall(st?.overall, st?.expectation)} phu={st?.attemptLabel ?? undefined} /></OBang>
        <OBang c={C_TARGET}><TargetText band={r.target} kck={r.kck} /></OBang>
        <OBang c={C_LICH}>
          {r.doiSang ? <NhanLich loai="du-kien">{t('Đã dời sang {thang}', { thang: nhanThang(r.doiSang) })}</NhanLich> : <ChipLichThi l={r.lichThi} />}
        </OBang>
        <OBang c={C_GHI}><GhiChu r={r} khoa={khoa} onLuu={(ghiChu) => onLuu({ ghiChu })} /></OBang>
        <OBang c={C_NUT}>
          {r.coTheSua && (daChot
            ? <button type="button" className="btn btn-sm" disabled={khoa} aria-expanded={hop === 'chot'} onClick={() => onHop(hop === 'chot' ? null : 'chot')}>{t('Sửa ngày')}</button>
            : <span className="flex flex-wrap gap-1.5">
                <button type="button" className={nhom === 'chua-chot-ngay' ? 'btn btn-sm btn-primary' : 'btn btn-sm'} disabled={khoa} aria-expanded={hop === 'chot'}
                  onClick={() => onHop(hop === 'chot' ? null : 'chot')}>{t('Chốt ngày')}</button>
                <button type="button" className="btn btn-sm" disabled={khoa} aria-expanded={hop === 'doi'} onClick={() => onHop(hop === 'doi' ? null : 'doi')}>{t('Dời tháng')}</button>
              </span>)}
          {r.tt && <TrangThai tt={r.tt} />}
        </OBang>
        <OBang c={C_MO}>
          <button type="button" className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-slate-400 hover:text-slate-100 max-sm:h-11 max-sm:w-11"
            aria-expanded={mo} aria-label={t('Chi tiết {ten}', { ten: r.ten })} onClick={onMo}>{mo ? '▾' : '▸'}</button>
        </OBang>
      </tr>
      {hop && (
        <tr><td colSpan={COT_LICH.length} className="px-3 pb-3">
          <HopLich r={r} kieu={hop} khoa={khoa} onHuy={() => onHop(null)} onLuu={onLuu} />
        </td></tr>
      )}
      {mo && <ChiTietDuoiHang r={r} />}
    </>
  );
}

/** Ghi chú sửa tại chỗ (V4 / ov14-5): rời ô hoặc Enter = lưu; dưới ô: người · ngày ghi. Chưa có ghi chú → chữ mờ "Chưa kết luận". */
function GhiChu({ r, khoa, onLuu }: { r: HangHien; khoa: boolean; onLuu: (ghiChu: string) => void }) {
  const { homNay } = useNgayNghiepVu();
  const [chu, setChu] = useState(r.luu?.ghiChu ?? '');
  useEffect(() => { setChu(r.luu?.ghiChu ?? ''); }, [r.luu?.ghiChu]);
  const luu = () => { if (chu.trim() !== (r.luu?.ghiChu ?? '').trim()) onLuu(chu.trim()); };
  return (
    <span className="block min-w-0">
      <input className="field h-8 w-full text-[13px] max-sm:min-h-[44px]" aria-label={t('Ghi chú {ten}', { ten: r.ten })} placeholder={t('Chưa kết luận')} maxLength={300}
        disabled={!r.coTheSua || khoa} value={chu} onChange={(e) => setChu(e.target.value)} onBlur={luu} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
      {r.luu?.ghiChu && <span className="block truncate text-[12px] text-slate-500">{[r.luu.ai, r.luu.luc ? shortDate(r.luu.luc, homNay) : null].filter(Boolean).join(' · ')}</span>}
    </span>
  );
}

/** Hộp nhỏ dưới hàng: Chốt ngày (ngày — nhận ngày đã qua, em đã thi) hoặc Dời tháng (mặc định tháng sau) + ghi chú tuỳ chọn. Lỗi: hộp ở lại, giữ chữ. */
function HopLich({ r, kieu, khoa, onHuy, onLuu }: {
  r: HangHien; kieu: 'chot' | 'doi'; khoa: boolean; onHuy: () => void;
  onLuu: (b: { ketLuan: KetLuanLichThi; ngay?: string; thang?: string; ghiChu?: string }) => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const [ngay, setNgay] = useState<string | null>(kieu === 'chot' ? r.lichThi.ngay : null);
  const [thang, setThang] = useState<string | null>(kieu === 'doi' ? thangKeTiep(`${r.lichThi.thang ?? homNay.slice(0, 7)}-01`) : null);
  const [ghiChu, setGhiChu] = useState(r.luu?.ghiChu ?? '');
  const gc = ghiChu.trim() !== (r.luu?.ghiChu ?? '') ? { ghiChu: ghiChu.trim() } : {};
  const duoc = kieu === 'chot' ? !!ngay : !!thang;
  const gui = () => {
    if (!duoc || khoa) return;
    onLuu(kieu === 'chot' ? { ketLuan: 'chot-ngay', ngay: ngay!, ...gc } : { ketLuan: 'chuyen-thang', thang: thang!.slice(0, 7), ...gc });
  };
  return (
    <div role="group" aria-label={kieu === 'chot' ? t('Chốt ngày thi · {ten}', { ten: r.ten }) : t('Dời tháng thi · {ten}', { ten: r.ten })}
      className="ml-auto flex max-w-[640px] flex-wrap items-end gap-3 rounded-lg border p-3" style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}
      onKeyDown={(e) => { if (e.key === 'Escape') onHuy(); }}>
      <label className="block w-[160px] text-xs text-slate-400">
        {kieu === 'chot' ? t('Ngày thi') : t('Tháng dự kiến')}
        {kieu === 'chot'
          ? <ONgay kieu="ngay" value={ngay} ariaLabel={t('Ngày thi')} onChange={setNgay} />
          : <ONgay kieu="thang" value={thang} ariaLabel={t('Tháng dự kiến')} toiThieu={homNay.slice(0, 7)} onChange={setThang} />}
      </label>
      <label className="block min-w-[180px] flex-1 text-xs text-slate-400">
        {t('Ghi chú')}
        <input className="field mt-1 w-full" maxLength={300} placeholder={t('Tuỳ chọn')} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') gui(); }} />
      </label>
      <span className="flex gap-2">
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" onClick={onHuy}>{t('Đóng')}</button>
        <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-[32px]" disabled={!duoc || khoa} onClick={gui}>
          {r.tt?.kieu === 'luu' ? t('Đang lưu…') : kieu === 'chot' ? t('Chốt ngày') : t('Dời tháng')}
        </button>
      </span>
    </div>
  );
}

const CHU_KET_LUAN: Record<string, string> = {
  'chot-ngay': t('chốt ngày'), 'chuyen-thang': t('dời tháng'), 'giu-thang': t('giữ tháng'), 'can-xac-nhan': t('chưa kết luận'),
};

/** Mở dưới hàng (V4): MT gần nhất 5 ô · Test sắp tới · Case · GVCN · lịch sử lịch thi. */
function ChiTietDuoiHang({ r }: { r: HangHien }) {
  const { homNay } = useNgayNghiepVu();
  const c = r.chiTiet;
  const st = r.standing;
  const tde = 'mb-1 text-[12px] font-semibold text-slate-400';
  return (
    <tr className="bg-[color:var(--accent-soft)]">
      <td colSpan={7} className="px-6 pb-3.5 pt-2">
        <div className="grid gap-4 text-[13px] text-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className={tde}>{[st?.attemptLabel, st?.expectation != null ? t('kỳ vọng {kv}', { kv: st.expectation.toFixed(1) }) : null].filter(Boolean).join(' · ') || t('MT gần nhất')}</div>
            {c.kn ? <MiniKn kn={c.kn} kv={st?.expectation ?? null} /> : <span className="text-slate-500">—</span>}
          </div>
          <div>
            <div className={tde}>{t('Test sắp tới')}</div>
            {c.sapToi ? `${c.sapToi.luot} · ${tuanLich(c.sapToi.tuan, homNay)}` : <span className="text-slate-500">—</span>}
          </div>
          <div>
            <div className={tde}>{t('Case · GVCN')}</div>
            {c.caseMo.length ? `Case ${c.caseMo.map((k) => skillShort(k)).join(', ')}` : t('Không có Case')}
            {r.gvcn && <span className="block text-xs text-slate-400">{t('GVCN {ten}', { ten: r.gvcn })}</span>}
          </div>
          <div>
            <div className={tde}>{t('Lịch sử lịch thi')}</div>
            {c.lichSu.length ? c.lichSu.map((x, i) => (
              <span key={i} className="block text-xs text-slate-400">
                {[shortDate(x.luc, homNay), x.ai,
                  x.ketLuan ? CHU_KET_LUAN[x.ketLuan] ?? x.ketLuan : x.ngay ? t('lịch → {moc}', { moc: x.ngay.length === 7 ? nhanThang(x.ngay) : shortDate(x.ngay, homNay) }) : null,
                  x.ghiChu ? `“${x.ghiChu}”` : null].filter(Boolean).join(' · ')}
              </span>
            )) : <span className="text-slate-500">—</span>}
          </div>
        </div>
      </td>
    </tr>
  );
}

function TrangThai({ tt }: { tt: TrangThaiLuu }) {
  return (
    <span className="mt-1 block text-[12px]" aria-live="polite">
      {tt.kieu === 'luu' && <span className="text-slate-400">{t('Đang lưu…')}</span>}
      {tt.kieu === 'xong' && <span className="text-slate-300">{t('Đã lưu')}</span>}
      {tt.kieu === 'loi' && (
        <span role="alert" className="text-bad">
          {tt.loi} <button type="button" className="link appearance-none border-0 bg-transparent p-0" onClick={tt.lai}>{t('Thử lại')}</button>
        </span>
      )}
    </span>
  );
}

