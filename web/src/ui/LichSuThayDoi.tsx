import { Fragment, useEffect, useState } from 'react';
import { api } from '../lib/api.ts';
import { useApi } from '../lib/useApi.ts';
import { KhungPanel } from './KhungPanel.tsx';
import { BoLocDoan, Empty, ErrorState, Skeleton } from './ui.tsx';
import { dich, t } from '@shared/i18n/index.ts';

export type LoaiLichSu = 'hv' | 'lop' | 'phan-cong' | 'gop-y' | 'nhap-hv' | 'thi-that' | 'o';
type Truong = { ten: string; cu: string | null; moi: string | null; doiTuong?: string; heThong?: true };
type Muc = { id: number | string; luc: string; nguoi: string; nguon: string | null; lyDo: string | null; truong: Truong[] };
type Trang = { dong: Muc[]; tiep: number | null; nhom: { key: string; nhan: string }[]; batDau: string | null };

/** Chữ dài hơn mức này hiện gọn "đã sửa …" + Xem (C22: không buộc đọc hai đoạn dài cạnh nhau). */
const DAI = 120;
/** Nhãn hệ thống (máy chủ đánh `heThong`) dịch theo tiếng của trang; chữ người gõ giữ nguyên. */
const giaTri = (x: Truong, v: string | null) => (v === null ? <i>{t('trống')}</i> : x.heThong ? dich(v) : v);

/** "15/10 14:02" theo giờ máy; khác năm nay thì kèm năm. */
function lucNgan(iso: string): string {
  const d = new Date(iso);
  const h = (n: number) => String(n).padStart(2, '0');
  const nam = d.getFullYear() !== new Date().getFullYear() ? `/${d.getFullYear()}` : '';
  return `${h(d.getDate())}/${h(d.getMonth() + 1)}${nam} ${h(d.getHours())}:${h(d.getMinutes())}`;
}
const ngayVn = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;

/** Một trường "trước → sau"; chữ dài → "đã sửa {tên}" + Xem mở hai bản. */
function DongTruong({ x }: { x: Truong }) {
  const [mo, setMo] = useState(false);
  const ten = dich(x.ten);
  if ((x.cu?.length ?? 0) > DAI || (x.moi?.length ?? 0) > DAI) {
    return (
      <li className="break-words">
        <span className="text-slate-400">{ten}:</span>{' '}
        <span className="text-slate-200">{t('đã sửa')}</span>{' '}
        <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm sm:min-h-0" aria-expanded={mo} onClick={() => setMo(!mo)}>
          {mo ? t('Ẩn') : t('Xem')}
        </button>
        {mo && (
          <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
            {([[t('Trước'), x.cu], [t('Sau'), x.moi]] as const).map(([nhan, v]) => (
              <div key={nhan} className="rounded-md border px-2.5 py-2 text-sm" style={{ borderColor: 'var(--line)' }}>
                <div className="text-xs text-slate-500">{nhan}</div>
                <div className={nhan === t('Sau') ? 'text-slate-100' : 'text-slate-400'}>{v ?? <i>{t('trống')}</i>}</div>
              </div>
            ))}
          </div>
        )}
      </li>
    );
  }
  return (
    <li className="break-words">
      <span className="text-slate-400">{ten}:</span>{' '}
      <span className="text-slate-400">{giaTri(x, x.cu)}</span>
      <span className="sr-only">{t('thành')}</span><span aria-hidden className="px-1 text-slate-500">→</span>
      <span className="font-medium text-slate-100">{giaTri(x, x.moi)}</span>
    </li>
  );
}

/** Lô / Excel / sửa cả lớp: MỘT mục, gọn "n học viên · Xem", mở ra từng em. Một em: tên em đứng đầu các trường. */
function CacTruong({ ds }: { ds: Truong[] }) {
  const [mo, setMo] = useState(false);
  const nhom = new Map<string, Truong[]>();
  for (const x of ds) nhom.set(x.doiTuong ?? '', [...(nhom.get(x.doiTuong ?? '') ?? []), x]);
  const ds_ = [...nhom];
  const lo = ds_.filter(([k]) => k).length > 1;
  const ve = (ten: string, tr: Truong[]) => (
    <Fragment key={ten}>
      {ten && <div className="mt-1 text-sm font-semibold text-slate-200">{ten}</div>}
      <ul className="m-0 list-none space-y-0.5 p-0 text-sm">{tr.map((x, i) => <DongTruong key={`${x.ten}-${i}`} x={x} />)}</ul>
    </Fragment>
  );
  if (!lo) return <div className="mt-1">{ds_.map(([k, tr]) => ve(k, tr))}</div>;
  return (
    <div className="mt-1">
      <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm sm:min-h-0" aria-expanded={mo} onClick={() => setMo(!mo)}>
        {t('{n} học viên', { n: ds_.filter(([k]) => k).length })} · {mo ? t('Ẩn') : t('Xem')}
      </button>
      {mo && <div className="mt-1 space-y-1 border-l pl-3" style={{ borderColor: 'var(--line)' }}>{ds_.map(([k, tr]) => ve(k, tr))}</div>}
    </div>
  );
}

/**
 * OV-15g — LỊCH SỬ THAY ĐỔI (C22, mẫu OV-13j): một panel cho mọi đối tượng (`GET /lich-su?loai=&id=`). Mới nhất trước, mỗi lần lưu một mục:
 * "18/10 14:32 · Người · Nguồn: … · Lý do: …" rồi từng trường trước → sau. Chỉ xem — không nút khôi phục (Lịch sử ≠ Hoàn tác).
 * Lọc nhóm trường khi danh sách dài; "Xem thêm" nối trang sau (con trỏ `tiep`); trang cuối báo "Lịch sử bắt đầu ghi từ …" khi đối tượng có trước mốc ghi.
 * Mở từ một panel khác: truyền `quayLai` — panel này THAY nội dung panel đó (không panel chồng panel), ← về đúng panel cũ. 375: toàn màn (KhungPanel).
 */
export function LichSuThayDoi({ loai, id, dong2, quayLai, onClose }: {
  loai: LoaiLichSu; id: number; dong2: (string | null | undefined)[];
  quayLai?: { nhan: string; onClick: () => void }; onClose: () => void;
}) {
  const [loc, setLoc] = useState('');
  const goc = `/lich-su?loai=${loai}&id=${id}${loc ? `&loc=${loc}` : ''}`;
  const { data, error, loading, reload } = useApi<Trang>(goc, [goc]);
  const [them, setThem] = useState<Trang[]>([]);
  const [dangTai, setDangTai] = useState(false);
  const [loiThem, setLoiThem] = useState<string | null>(null);
  useEffect(() => { setThem([]); setLoiThem(null); }, [goc]);

  const ds = [...(data?.dong ?? []), ...them.flatMap((x) => x.dong)];
  const cuoi = them.length ? them[them.length - 1] : data;
  const tiep = cuoi?.tiep ?? null;
  const xemThem = async () => {
    if (tiep === null) return;
    setDangTai(true); setLoiThem(null);
    try { setThem([...them, await api.get<Trang>(`${goc}&tiep=${tiep}`)]); } catch (e) { setLoiThem((e as Error).message); } finally { setDangTai(false); }
  };
  /* Lọc chỉ khi dài (hơn 5 mục, hoặc còn trang sau) hoặc đang lọc — danh sách ngắn đọc thẳng. */
  const nhom = data?.nhom ?? [];
  const coLoc = nhom.length > 1 && (!!loc || ds.length > 5 || tiep !== null);

  return (
    <KhungPanel tieuDe={t('Lịch sử')} quayLai={quayLai} onDong={onClose} dau={{ dong2: dong2.filter(Boolean) }}>
      <div data-hd="lich-su-thay-doi">
        {coLoc && (
          <div className="pt-3">
            <BoLocDoan muc={[{ key: '', nhan: t('Tất cả') }, ...nhom.map((x) => ({ key: x.key, nhan: dich(x.nhan) }))]} value={loc} onChange={setLoc}
              ariaLabel={t('Lọc lịch sử')} />
          </div>
        )}
        {error ? <div className="pt-3"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
          : loading && !data ? <div className="pt-3"><Skeleton rows={5} /></div>
          : !ds.length ? <Empty title={t('Chưa có thay đổi nào')} />
          : (
            <ul className="m-0 mt-3 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>
              {ds.map((d) => (
                <li key={d.id} className="py-3" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex flex-wrap items-baseline gap-x-1.5 text-[13px] text-slate-400">
                    <span className="tabular-nums">{lucNgan(d.luc)}</span>
                    <span aria-hidden>·</span>
                    <span className="font-semibold text-slate-200">{dich(d.nguoi)}</span>
                    {d.nguon && <><span aria-hidden>·</span><span>{t('Nguồn')}: {dich(d.nguon)}</span></>}
                    {d.lyDo && <><span aria-hidden>·</span><span className="break-words">{t('Lý do')}: {d.lyDo}</span></>}
                  </div>
                  <CacTruong ds={d.truong} />
                </li>
              ))}
            </ul>
          )}
        {loiThem && <p className="mt-2 text-sm text-bad" role="alert">{loiThem}</p>}
        {tiep !== null && ds.length > 0 && !error && (
          <div className="py-3">
            <button type="button" className="btn btn-sm min-h-[44px] w-full sm:min-h-0 sm:w-auto" disabled={dangTai} onClick={() => void xemThem()}>
              {dangTai ? t('Đang tải') : t('Xem thêm')}
            </button>
          </div>
        )}
        {tiep === null && cuoi?.batDau && !error && (
          <p className="m-0 border-t py-3 text-[13px] text-slate-500" style={{ borderColor: 'var(--line)' }}>
            {t('Lịch sử bắt đầu ghi từ {ngay}', { ngay: ngayVn(cuoi.batDau) })}
          </p>
        )}
      </div>
    </KhungPanel>
  );
}
