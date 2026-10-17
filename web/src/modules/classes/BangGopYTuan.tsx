import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GOP_Y_HIEN_DEM, GOP_Y_TOI_DA, type NguCanhDs } from '@shared/domain/index.ts';
import { api, ApiError } from '../../lib/api.ts';
import { quenBanXem, useApi } from '../../lib/useApi.ts';
import { taoOLuu, type TrangThaiO } from '../../lib/luuChac.ts';
import { useToast } from '../../ui/Toast.tsx';
import { fmtDateTime } from '../../lib/format.ts';
import { Empty, Skeleton } from '../../ui/ui.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { KetLuan, type RosterRow } from '../students/ClassRoster.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * GÓP Ý HÀNG TUẦN (OV-12g, mockup 4 phương án A) — hồ sơ lớp › Học viên › cách xem "Góp ý hàng tuần" (`?che-do=gop-y&tuan=`).
 * Hàng = em (bảng học viên của lớp), cột = kỹ năng của lớp; chọn tuần ‹ ›. Ô ghi được (máy chủ báo `ghiDuoc`) là ô chữ lưu khi rời ô / Ctrl+Enter;
 * ô khác chữ thường. ▸ mở 4 tuần gần nhất ngay tại hàng. Không bắt buộc, không việc, không thông báo — khác hẳn nhận xét MT.
 * 375: mỗi em một thẻ, mỗi kỹ năng một ô.
 */
type Cot = { skill: string; nhan: string; gv: string[]; ghiDuoc: boolean };
type OGop = { studentId: number; skill: string; tuan: string; noiDung: string; ghiBoi: string | null; ghiLuc: string };
type DuLieu = {
  tuan: { weekStart: string; code: string }[]; truoc: string; sau: string | null;
  cot: Cot[]; o: OGop[]; ganNhat: { weekStart: string; code: string; soEm: number } | null;
};
type Em = Pick<RosterRow, 'id' | 'fullName' | 'studentCode' | 'status' | 'archived'> & Partial<RosterRow>;

/**
 * OV-14a (F07): chữ của ô bị gỡ khi chưa lưu được (Back, lưu lỗi sau khi rời trang, hết phiên) — giữ trong trang tới khi lưu xong;
 * vào lại đúng ô thì chữ hiện lại (còn "chưa lưu"). Tải lại trình duyệt thì mất (đã có hỏi `beforeunload`).
 */
const banNhap = new Map<string, string>();

export function BangGopYTuan({ classId, maLop, laFt, tuan, onTuan }: {
  classId: number; maLop?: string; laFt: boolean; tuan: string | null; onTuan: (w: string | null) => void;
}) {
  const roster = useApi<Em[]>(`/classes/${classId}/roster`, [classId]);
  const duong = `/classes/${classId}/gop-y${tuan ? `?tuan=${tuan}` : ''}`;
  const { data, error, setData, reload } = useApi<DuLieu>(duong, [duong]);
  const dienThoai = useDienThoai();
  /** Ô còn chữ chưa lưu (đang gõ / đang lưu / lỗi), khoá `banNhap` — hỏi lại khi đổi tuần hoặc rời trang. */
  const chuaLuu = useRef(new Set<string>());
  const [mo, setMo] = useState<Set<number>>(new Set());
  useEffect(() => {
    const chan = (e: BeforeUnloadEvent) => { if (chuaLuu.current.size) e.preventDefault(); };
    window.addEventListener('beforeunload', chan);
    return () => window.removeEventListener('beforeunload', chan);
  }, []);

  const err = error ?? roster.error;
  if (err) {
    return (
      <p className="m-0 text-xs text-rose-200">{err.message} <button type="button" className="btn btn-sm ml-2" onClick={() => { reload(); roster.reload(); }}>{t('Thử lại')}</button></p>
    );
  }
  if (!data || !roster.data) return <Skeleton rows={4} />;
  const rows = roster.data.filter((s) => !s.archived);
  if (!rows.length) return <Empty title={t('Lớp chưa có học viên')} />;
  const ds: NguCanhDs = { loai: 'hoc-vien', ids: rows.map((s) => s.id), nhan: maLop ? t('Lớp {lop}', { lop: maLop }) : t('Lớp') };
  const xem = data.tuan[0];
  const tuanCu = data.tuan[1];
  const oCua = (sid: number, skill: string, w: string) => data.o.find((x) => x.studentId === sid && x.skill === skill && x.tuan === w) ?? null;
  const soCo = rows.filter((s) => data.o.some((x) => x.studentId === s.id && x.tuan === xem.weekStart)).length;
  const coGhi = data.cot.some((c) => c.ghiDuoc);
  const oDau = coGhi && !dienThoai && soCo === 0 ? rows[0] && data.cot.find((c) => c.ghiDuoc) : null;

  const doiTuan = (w: string | null) => {
    const n = chuaLuu.current.size;
    if (n && !window.confirm(t('Còn {n} góp ý chưa lưu. Đổi tuần thì mất chữ đó — vẫn đổi?', { n }))) return;
    chuaLuu.current.clear();
    setMo(new Set());
    onTuan(w);
  };
  const baoChuaLuu = (k: string, con: boolean) => { if (con) chuaLuu.current.add(k); else chuaLuu.current.delete(k); };
  const luu = async (sid: number, skill: string, noiDung: string | null): Promise<string | null> => {
    try {
      const r = await api.put<{ noiDung: string | null; ghiBoi: string; ghiLuc: string | null }>(`/classes/${classId}/gop-y`, { studentId: sid, tuan: xem.weekStart, skill, noiDung });
      setData((d) => {
        const con = d!.o.filter((x) => !(x.studentId === sid && x.skill === skill && x.tuan === xem.weekStart));
        return { ...d!, o: r.noiDung === null ? con : [...con, { studentId: sid, skill, tuan: xem.weekStart, noiDung: r.noiDung, ghiBoi: r.ghiBoi, ghiLuc: r.ghiLuc ?? '' }] };
      });
      /* F03: bản vừa xem (‹ › tuần, rời trang rồi về trong 10 s) là bản TRƯỚC khi lưu — quên mọi tuần của lớp, lần sau đọc máy chủ. */
      quenBanXem(`/classes/${classId}/gop-y`);
      return null;
    } catch (e) {
      /* Mất mạng / 5xx: "Chưa lưu — thử lại"; máy chủ từ chối (vd vừa đổi phân công): lý do hiện dưới ô. Chữ đã gõ giữ nguyên. */
      return e instanceof ApiError && e.status >= 400 && e.status < 500 ? e.message : '';
    }
  };
  const o = (s: Em, c: Cot) => {
    const v = oCua(s.id, c.skill, xem.weekStart);
    if (!c.ghiDuoc) return <ODoc o={v} />;
    const cu = tuanCu ? oCua(s.id, c.skill, tuanCu.weekStart) : null;
    const k = `${classId}:${xem.weekStart}:${s.id}:${c.skill}`;
    return (
      <>
        {cu && <DongCu code={tuanCu.code} noiDung={cu.noiDung} />}
        <OGhi key={`${xem.weekStart}:${s.id}:${c.skill}`} nhan={`${dich(c.nhan)} · ${s.fullName} · ${xem.code}`} giaTri={v?.noiDung ?? null}
          tuDong={oDau ? s.id === rows[0].id && c.skill === oDau.skill : false}
          khoaNhap={k} conGiu={() => chuaLuu.current.has(k)}
          onLuu={(nd) => luu(s.id, c.skill, nd)} onBao={(con) => baoChuaLuu(k, con)} />
      </>
    );
  };
  const tuanMo = (sid: number) => data.tuan.slice(1).map((w) => ({ w, o: data.cot.map((c) => oCua(sid, c.skill, w.weekStart)) }));
  const doiMo = (sid: number) => setMo((m) => { const n = new Set(m); if (n.has(sid)) n.delete(sid); else n.add(sid); return n; });
  const ten = (s: Em) => (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <Link className="link font-semibold" to={`/hoc-vien/${s.id}`} state={{ ds }}>{s.fullName}</Link>
    </span>
  );
  const chip = (s: Em) => (laFt && s.sosLevel !== undefined ? <span className="mt-1 block"><KetLuan row={s as RosterRow} cotMocTrong={false} /></span> : null);

  const thanh = (dem = true) => (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="inline-flex items-center gap-1" role="group" aria-label={t('Chọn tuần')}>
        <button type="button" className="btn btn-ghost min-h-[44px] min-w-[44px] justify-center sm:min-h-0" aria-label={t('Tuần trước: {tuan}', { tuan: data.tuan[1]?.code ?? '' })}
          onClick={() => doiTuan(data.truoc)}>‹</button>
        <b className="min-w-[4.5rem] text-center text-sm font-semibold tabular-nums text-slate-100">{xem.code}</b>
        <button type="button" className="btn btn-ghost min-h-[44px] min-w-[44px] justify-center sm:min-h-0" aria-label={t('Tuần sau')} disabled={!data.sau}
          onClick={() => data.sau && doiTuan(data.sau)}>›</button>
      </span>
      {dem && <span className="text-[13px] text-slate-400">
        {soCo ? <>{t('Có góp ý:')} <b className="font-semibold tabular-nums text-slate-200">{t('{a}/{b} em', { a: soCo, b: rows.length })}</b></> : t('Chưa có góp ý {tuan}', { tuan: xem.code })}
      </span>}
    </div>
  );

  /* Người chỉ đọc + tuần chưa ai ghi: một khối thay vì cả bảng "—". */
  if (!coGhi && !soCo) {
    return (
      <div className="space-y-2">
        {thanh(false)}
        <div className="surface-2 flex flex-wrap items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300">
          <span>{t('Chưa có góp ý {tuan}', { tuan: xem.code })}</span>
          {data.ganNhat && (
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => doiTuan(data.ganNhat!.weekStart)}>
              {t('Xem {tuan} · {n} em', { tuan: data.ganNhat.code, n: data.ganNhat.soEm })}
            </button>
          )}
        </div>
      </div>
    );
  }

  const nutMo = (s: Em) => (
    <button type="button" className="btn btn-ghost btn-sm min-h-[44px] min-w-[44px] justify-center px-1 sm:min-h-0 sm:min-w-0" aria-expanded={mo.has(s.id)}
      aria-label={mo.has(s.id) ? t('Thu 4 tuần gần nhất của {ten}', { ten: s.fullName }) : t('Mở 4 tuần gần nhất của {ten}', { ten: s.fullName })} onClick={() => doiMo(s.id)}>{mo.has(s.id) ? '▾' : '▸'}</button>
  );

  if (dienThoai) {
    return (
      <div className="space-y-2">
        {thanh()}
        <div className="surface-2 overflow-hidden rounded-lg">
          {rows.map((s) => (
            <TheDong key={s.id} className={s.status !== 'active' ? 'row-muted' : ''}
              dau={<>{ten(s)}{chip(s)}</>}
              dong={[
                ...data.cot.map((c) => ({ nhan: dich(c.nhan), noiDung: o(s, c) })),
                ...(mo.has(s.id) ? tuanMo(s.id).map(({ w, o: dsO }) => ({
                  nhan: w.code,
                  noiDung: <span className="block space-y-1">{data.cot.map((c, i) => <span key={c.skill} className="block"><b className="font-semibold text-slate-400">{dich(c.nhan)}</b> <ODoc o={dsO[i]} dayDu /></span>)}</span>,
                })) : []),
                { nhan: '', noiDung: (
                  <button type="button" className="btn btn-ghost btn-sm min-h-[44px]" aria-expanded={mo.has(s.id)} onClick={() => doiMo(s.id)}>
                    {mo.has(s.id) ? t('Thu 4 tuần') : t('4 tuần gần nhất')}
                  </button>
                ) },
              ]} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {thanh()}
      <div className="surface-2 overflow-x-auto rounded-lg">
        <table className="w-full min-w-[900px] table-fixed text-sm">
          <colgroup><col className="w-[220px]" />{data.cot.map((c) => <col key={c.skill} />)}</colgroup>
          <thead>
            <tr>
              <th className="th sticky-col align-bottom">{t('Học viên')}</th>
              {data.cot.map((c) => (
                <th key={c.skill} className="th align-bottom">
                  {dich(c.nhan)}
                  {c.gv.length > 0 && <span className="mt-0.5 block truncate text-[11.5px] font-medium normal-case tracking-normal text-slate-500" title={c.gv.join(' · ')}>{c.gv.join(' · ')}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <Fragment key={s.id}>
                <tr className={s.status !== 'active' ? 'row-muted' : ''}>
                  <td className="td sticky-col align-top">
                    <span className="flex items-start gap-1">{nutMo(s)}<span className="min-w-0">{ten(s)}{chip(s)}</span></span>
                  </td>
                  {data.cot.map((c) => <td key={c.skill} className="td align-top">{o(s, c)}</td>)}
                </tr>
                {mo.has(s.id) && tuanMo(s.id).map(({ w, o: dsO }) => (
                  <tr key={w.weekStart} className="bg-[color:var(--surface-2)]">
                    <td className="td pl-10 align-top text-xs font-semibold tabular-nums text-slate-400">{w.code}</td>
                    {dsO.map((x, i) => <td key={data.cot[i].skill} className="td align-top"><ODoc o={x} dayDu /></td>)}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Ô chỉ đọc: tối đa 3 dòng (▸ mở thì đủ chữ), trống "—"; rê chuột thấy người ghi + lúc ghi. */
function ODoc({ o, dayDu = false }: { o: OGop | null; dayDu?: boolean }) {
  if (!o) return <span className="text-faint">—</span>;
  return (
    <span className={`text-[13px] leading-relaxed text-slate-200 ${dayDu ? 'whitespace-pre-wrap' : 'line-clamp-3'}`}
      title={`${o.ghiBoi ?? '—'} · ${fmtDateTime(o.ghiLuc)}`}>{o.noiDung}</span>
  );
}

/** Dòng mờ góp ý tuần trước — một dòng, bấm xem đủ. */
function DongCu({ code, noiDung }: { code: string; noiDung: string }) {
  const [mo, setMo] = useState(false);
  return (
    <button type="button" aria-expanded={mo} onClick={() => setMo(!mo)}
      className={`mb-1 block w-full appearance-none border-0 bg-transparent p-0 text-left max-sm:py-3 max-sm:-my-2 text-[11.5px] leading-snug text-faint ${mo ? 'whitespace-pre-wrap' : 'truncate'}`}>
      <b className="font-semibold tabular-nums text-slate-400">{code}:</b> {noiDung}
    </button>
  );
}

/**
 * Ô ghi góp ý: tự cao theo chữ, lưu khi rời ô hoặc Ctrl+Enter; Đang lưu… / Đã lưu / Chưa lưu — thử lại (giữ chữ). Xoá hết chữ = xoá góp ý.
 * Cùng cách với ô nhận xét hồ sơ Mock (`ONhanXet`) nhưng ≤ 500 ký tự, nằm trong ô bảng và báo "chưa lưu" lên bảng.
 * OV-14a: lưu theo lượt (`taoOLuu`, F01) — gõ thêm khi đang lưu không bị ghi đè. Ô bị gỡ khi còn chữ chưa lưu (Back, đổi trang) → tự gửi lưu;
 * lỗi → toast "Mở lại", chữ giữ trong `banNhap` (F07). Đổi tuần mà người dùng đã chọn bỏ chữ (`conGiu` false) thì không gửi.
 */
function OGhi({ nhan, giaTri, onLuu, onBao, conGiu, khoaNhap, tuDong }: {
  nhan: string; giaTri: string | null; tuDong: boolean; khoaNhap: string;
  /** null = đã lưu; '' = lỗi mạng; chữ khác = lý do máy chủ từ chối. */
  onLuu: (v: string | null) => Promise<string | null>; onBao: (conChuaLuu: boolean) => void;
  /** Bảng còn coi ô này là "chưa lưu" (chưa bị bỏ khi đổi tuần). */
  conGiu: () => boolean;
}) {
  const toast = useToast();
  const viTri = useLocation();
  const navigate = useNavigate();
  const moi = { onLuu, onBao, conGiu, navigate, noi: `${viTri.pathname}${viTri.search}` };
  const the = useRef(moi);
  the.current = moi;
  const gan = useRef(true);
  const [tt, setTt] = useState<TrangThaiO>('idle');
  const [lyDo, setLyDo] = useState('');
  const [bo] = useState(() => {
    let dangTao = true;
    const b = taoOLuu(giaTri ?? '', (v) => the.current.onLuu(v), (x, l) => {
      if (dangTao) return;
      setTt(x);
      setLyDo(l);
      const con = b.chuaLuu();
      the.current.onBao(con);
      if (!con) banNhap.delete(khoaNhap);
      else if (x === 'loi' && !gan.current) {
        banNhap.set(khoaNhap, b.nhap());
        toast.push('error', t('Góp ý chưa lưu được — chữ vẫn giữ.'), {
          key: 'gop-y-chua-luu', ms: 20_000, hanhDong: { nhan: t('Mở lại'), onBam: () => the.current.navigate(the.current.noi) },
        });
      }
    });
    const cu = banNhap.get(khoaNhap);
    if (cu !== undefined) b.go(cu);
    dangTao = false;
    return b;
  });
  const [nhap, setNhap] = useState(bo.nhap);
  const o = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const v = bo.nhanGoc(giaTri ?? ''); if (v !== null) setNhap(v); }, [giaTri, bo]);
  useEffect(() => { if (tuDong) o.current?.focus(); }, [tuDong]);
  useEffect(() => {
    gan.current = true;
    if (bo.chuaLuu()) the.current.onBao(true);   // nháp còn từ lần trước
    return () => {
      gan.current = false;
      /* Chờ một nhịp: StrictMode gỡ thử rồi gắn lại ngay — chỉ xử lý khi ô bị gỡ thật. */
      setTimeout(() => {
        if (gan.current || !bo.chuaLuu()) return;
        if (!the.current.conGiu()) { banNhap.delete(khoaNhap); return; }
        banNhap.set(khoaNhap, bo.nhap());
        void bo.luu();
      }, 0);
    };
  }, [bo, khoaNhap]);
  useEffect(() => {
    const el = o.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [nhap]);
  return (
    <div className="min-w-0">
      <textarea ref={o} aria-label={nhan} rows={1} maxLength={GOP_Y_TOI_DA} value={nhap}
        className={`o-sua block w-full resize-none px-2 py-1.5 text-[13px] leading-relaxed text-slate-100 max-sm:min-h-[44px] ${nhap ? 'min-h-[54px]' : 'min-h-[36px] border-dashed'} ${tt === 'loi' ? '!border-bad-line' : ''}`}
        onChange={(e) => { setNhap(e.target.value); bo.go(e.target.value); }}
        onBlur={() => void bo.luu()}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void bo.luu(); } }} />
      <span className="mt-0.5 flex items-baseline gap-2 text-[11.5px]" aria-live="polite">
        {tt === 'dang' && <span className="text-slate-500">{t('Đang lưu…')}</span>}
        {tt === 'xong' && <span className="text-slate-500">{t('Đã lưu')}</span>}
        {tt === 'loi' && (lyDo
          ? <span className="text-bad">{lyDo}</span>
          : <button type="button" className="appearance-none border-0 bg-transparent p-0 font-semibold text-bad underline"
              onMouseDown={(e) => e.preventDefault()} onClick={() => void bo.luu()}>{t('Chưa lưu — thử lại')}</button>)}
        {nhap.length > GOP_Y_HIEN_DEM && <span className={`ml-auto tabular-nums ${nhap.length >= GOP_Y_TOI_DA ? 'text-bad' : 'text-slate-500'}`}>{nhap.length}/{GOP_Y_TOI_DA}</span>}
      </span>
    </div>
  );
}
