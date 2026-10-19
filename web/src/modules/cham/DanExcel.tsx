import { useMemo, useState, type ReactNode } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { IconDat } from '../../ui/BieuTuong.tsx';
import { BoLocDoan } from '../../ui/ui.tsx';
import { ChonNhom } from '../fasttrack/NhanXet.tsx';
import { lyDoChiDoc, type Cell } from '../fasttrack/ScoreEntry.tsx';
import type { FtSheet } from './LuoiFT.tsx';
import {
  ENTRY_SKILL_SHORT, LO_DAN, docBangDan, khopHocVien, xetODan, chiaLo, tuanLich,
  type CheDoLR, type EntrySkill, type PatchDan, type XetODan,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * DÁN TỪ EXCEL (OV-15b mục 2, C15; mockup 2 khung 1d) — khối xem trước ngay cạnh lưới đang mở (không panel lồng panel). Dán (Ctrl V) vào
 * khung → bảng xem trước (em khớp / ô mới / ghi đè trước → sau / lỗi / trùng tên → chọn em / không có trong lớp); dưới kỳ vọng chọn nhóm
 * nguyên nhân tại chỗ; "Lưu n dòng" lưu dòng hợp lệ (mỗi request `LO_DAN` dòng, máy chủ kiểm lại mọi luật), dòng còn lại ở lại là nháp.
 * Lỗi mạng: bảng giữ nguyên, "Thử lại". Luật đọc / khớp / xét ô: `shared/domain/danExcel.ts`.
 */
type Hang = FtSheet['rows'][number];
type ODong = { skill: EntrySkill; diem: string; nhanXet: string; x: XetODan; cell?: Cell };
type DongXem = {
  so: number; ten: string; hang: Hang | null; trung: Hang[]; khongCo: boolean; trungDong: number | null;
  /** Em do người dùng chọn (trùng tên) — có "Chọn lại". */
  daChon: boolean;
  o: ODong[]; loiMay: string | null;
  /** Mọi ô lỗi của dòng cùng một câu (≥ 2 ô) — nói một lần dưới tên, ô chỉ đỏ. */
  loiChung: string | null;
};
type KetQua = { dong: ({ attemptId: number; ok: true } | { attemptId: number; ok: false; skill: string | null; loi: string })[] };

/** Ô trước khi lưu → lệnh trả lại như cũ (Hoàn tác). Ô trống → xoá; nhận xét / nhóm chỉ trả khi lần dán có gửi. */
function patchTruoc(c: Cell, p: PatchDan): PatchDan {
  const diem: PatchDan = p.noShow ? { noShow: false }
    : p.rawScore === undefined && p.band === undefined && p.criteria === undefined ? {}
    : c.skill === 'listening' || c.skill === 'reading'
      ? (c.rawScore !== null ? { rawScore: c.rawScore } : c.band !== null ? { band: c.band } : { rawScore: null })
      : (c.criteria.some((v) => v !== null) ? { criteria: c.criteria } : c.band !== null ? { band: c.band } : { criteria: [null, null, null, null] });
  return {
    ...diem,
    ...(p.nhanXet !== undefined ? { nhanXet: c.nhanXet ?? null } as PatchDan : {}),
    ...(p.nhomNguyenNhan !== undefined ? { nhomNguyenNhan: c.nhomNguyenNhan ?? [] } : {}),
  };
}

export function DanExcel({ data, cot, tenLuot, homNay, hep, hoiBanDau = false, onDong, onDaLuu }: {
  data: FtSheet; cot: readonly EntrySkill[]; tenLuot: string; homNay: string; hep: boolean; hoiBanDau?: boolean; onDong: () => void; onDaLuu: () => void;
}) {
  const [chu, setChu] = useState('');
  const [cheDo, setCheDo] = useState<CheDoLR>('cau');
  const [chon, setChon] = useState<Record<number, number | 'bo' | null>>({});
  const [nhom, setNhom] = useState<Record<string, string[]>>({});
  const [daLuu, setDaLuu] = useState<Set<number>>(new Set());
  const [loiMay, setLoiMay] = useState<Record<number, string>>({});
  const [dang, setDang] = useState<{ xong: number; tong: number } | null>(null);
  const [loiMang, setLoiMang] = useState<string | null>(null);
  const [vua, setVua] = useState<{ n: number; luc: string; tra: { so: number; attemptId: number; o: ({ skill: string } & PatchDan)[] }[] } | null>(null);
  const [hoi, setHoi] = useState(hoiBanDau);

  const bang = useMemo(() => docBangDan(chu, cot), [chu, cot]);
  const coLR = cot.includes('listening') || cot.includes('reading');
  const ds = useMemo(() => data.rows.map((r) => ({ attemptId: r.attemptId, ten: r.studentName, email: r.studentEmail })), [data.rows]);
  const theoId = useMemo(() => new Map(data.rows.map((r) => [r.attemptId, r])), [data.rows]);

  const dong = useMemo<DongXem[]>(() => {
    const dungBoi = new Map<number, number>();
    return bang.dong.filter((d) => !daLuu.has(d.so) && chon[d.so] !== 'bo').map((d) => {
      const k = khopHocVien(d.ten, ds);
      const c = chon[d.so];
      const hang = (k.attemptId ? theoId.get(k.attemptId) : typeof c === 'number' ? theoId.get(c) : undefined) ?? null;
      const trungDong = hang ? dungBoi.get(hang.attemptId) ?? null : null;
      if (hang && trungDong === null) dungBoi.set(hang.attemptId, d.so);
      const o = d.o.map((x) => {
        const c0 = hang?.cells.find((cc) => cc.skill === x.skill);
        /* Ô chỉ đọc: cùng câu với lưới (`lyDoChiDoc`); ô chưa tới tuần thi nói tuần. */
        const cell = c0 && !c0.canEdit ? { ...c0, lyDoKhoa: c0.weekStart && c0.weekStart.slice(0, 10) > homNay
          ? t('Chưa tới tuần thi {tuan}', { tuan: tuanLich(c0.weekStart, homNay) }) : lyDoChiDoc(c0) } : c0;
        /* Chưa có em (trùng tên / không có trong lớp): chưa xét — hiện số thô. */
        const r: XetODan = !hang || !(x.diem || x.nhanXet) ? { loai: 'bo' } : cell ? xetODan(x, cell, cheDo) : { loai: 'loi', loi: t('Lượt này không thi kỹ năng này') };
        return { ...x, x: r, cell };
      });
      const cauLoi = [...new Set(o.flatMap((x) => (x.x.loai === 'loi' ? [x.x.loi] : [])))];
      const loiChung = cauLoi.length === 1 && o.filter((x) => x.x.loai === 'loi').length > 1 ? cauLoi[0] : null;
      return {
        loiChung, so: d.so, ten: d.ten, hang, daChon: !k.attemptId && !!hang, trung: (k.trung ?? []).map((id) => theoId.get(id)!).filter(Boolean), khongCo: !!k.khongCo, trungDong, o,
        loiMay: loiMay[d.so] ?? null,
      };
    });
  }, [bang, ds, theoId, chon, cheDo, daLuu, loiMay]);

  const khoaNhom = (so: number, k: string) => `${so}:${k}`;
  const thieuNhom = (d: DongXem, o: ODong) => o.x.loai === 'ghi' && o.x.canNhom && !nhom[khoaNhom(d.so, o.skill)]?.length;
  const loiO = (d: DongXem) => d.o.filter((o) => o.x.loai === 'loi').length + (d.trungDong !== null ? 1 : 0);
  const ghi = (d: DongXem) => d.o.filter((o) => o.x.loai === 'ghi');
  const hopLe = (d: DongXem) => !!d.hang && d.trungDong === null && !loiO(d) && ghi(d).length > 0 && !ghi(d).some((o) => thieuNhom(d, o));
  const luuDuoc = dong.filter(hopLe);
  /* Mới / ghi đè: dòng khớp em, không lỗi (kể cả dòng còn chờ chọn nhóm nguyên nhân). */
  const sach = (d: DongXem) => !!d.hang && d.trungDong === null && !loiO(d) && !d.loiMay && ghi(d).length > 0;
  const coDe = (d: DongXem) => ghi(d).some((o) => o.x.loai === 'ghi' && o.x.truoc !== null);
  const dem = {
    moi: dong.filter((d) => sach(d) && !coDe(d)).length,
    ghiDe: dong.filter((d) => sach(d) && coDe(d)).length,
    trung: dong.filter((d) => !d.hang && d.trung.length).length,
    loi: dong.filter((d) => d.hang && (loiO(d) || d.loiMay)).length,
    khong: dong.filter((d) => !d.hang && d.khongCo).length,
  };
  const conNhap = dong.length - luuDuoc.length;

  const goi = async (lo: { so: number; attemptId: number; o: ({ skill: string } & PatchDan)[] }[]) => {
    const ok: number[] = [], loi: Record<number, string> = {};
    setDang({ xong: 0, tong: lo.length });
    try {
      for (const phan of chiaLo(lo, LO_DAN)) {
        const r = await api.post<KetQua>('/attempts/scores/lo', { dong: phan.map(({ attemptId, o }) => ({ attemptId, o })) });
        r.dong.forEach((k, i) => {
          if (k.ok) ok.push(phan[i].so);
          else loi[phan[i].so] = `${k.skill ? `${ENTRY_SKILL_SHORT[k.skill as EntrySkill] ?? k.skill}: ` : ''}${dich(k.loi)}`;
        });
        setDang({ xong: ok.length + Object.keys(loi).length, tong: lo.length });
      }
      return { ok, loi, mang: null as string | null };
    } catch (e: any) {
      return { ok, loi, mang: e.message as string };
    } finally {
      setDang(null);
      if (ok.length) {
        for (const p of ['/attempts', '/tong-quan', '/classes', '/students', '/my-work']) invalidate(p);
        onDaLuu();
      }
    }
  };

  const luu = async () => {
    const lo = luuDuoc.map((d) => ({
      so: d.so, attemptId: d.hang!.attemptId,
      o: ghi(d).map((o) => {
        const p = (o.x as Extract<XetODan, { loai: 'ghi' }>).patch;
        const n = nhom[khoaNhom(d.so, o.skill)];
        return { skill: o.skill, ...p, ...(n?.length ? { nhomNguyenNhan: n } : {}) };
      }),
    }));
    const tra = lo.map((d) => ({ ...d, o: d.o.map((x) => ({ skill: x.skill, ...patchTruoc(luuDuoc.find((r) => r.so === d.so)!.o.find((o) => o.skill === x.skill)!.cell!, x) })) }));
    setLoiMang(null);
    const r = await goi(lo);
    setLoiMay((m) => { const moi = { ...m, ...r.loi }; for (const so of r.ok) delete moi[so]; return moi; });
    setDaLuu((s) => new Set([...s, ...r.ok]));
    if (r.ok.length) {
      const luc = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setVua({ n: r.ok.length, luc, tra: tra.filter((x) => r.ok.includes(x.so)) });
    }
    if (r.mang) setLoiMang(r.mang);
  };

  const hoanTac = async () => {
    if (!vua) return;
    const r = await goi(vua.tra);
    setDaLuu((s) => { const moi = new Set(s); for (const so of r.ok) moi.delete(so); return moi; });
    setVua(r.ok.length === vua.tra.length ? null : { ...vua, tra: vua.tra.filter((x) => !r.ok.includes(x.so)) });
    if (r.mang || Object.keys(r.loi).length) setLoiMang(r.mang ?? Object.values(r.loi)[0]);
  };

  const huy = () => { setChu(''); setChon({}); setNhom({}); setDaLuu(new Set()); setLoiMay({}); setLoiMang(null); setVua(null); };
  const tieuDe = t('Dán từ Excel · {luot}', { luot: tenLuot });
  const kn = cot.filter((k) => bang.dong.some((d) => d.o.some((o) => o.skill === k)));

  return (
    <section aria-label={tieuDe} className="flex flex-col gap-3 rounded-lg border p-3 md:p-4" style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
      <div className="flex items-start gap-2">
        {hep && <button type="button" className="btn btn-ghost min-h-[44px] px-2" onClick={onDong}>{t('‹ Lưới điểm')}</button>}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-100">{tieuDe}</h3>
          <p className="text-xs text-slate-400">
            {data.classCode}{bang.dong.length ? <> · <b className="text-slate-200">{t('{n} dòng', { n: bang.dong.length })}</b> · {bang.coTieuDe ? t('có hàng tiêu đề') : t('không hàng tiêu đề')}</> : null}
          </p>
        </div>
        <button type="button" className="btn btn-sm min-h-[44px] min-w-[44px] justify-center sm:min-h-0" aria-expanded={hoi} aria-label={t('Cách dán từ Excel')} onClick={() => setHoi((v) => !v)}>?</button>
        {!hep && <button type="button" className="btn btn-sm" onClick={onDong}>{t('Đóng')}</button>}
      </div>

      {hoi && <HuongDan cot={cot} />}

      {!chu.trim() ? (
        <textarea className="field min-h-[160px] w-full font-mono text-xs" aria-label={tieuDe} autoFocus
          placeholder={t('Chọn vùng trong Excel, Ctrl C rồi Ctrl V vào đây')}
          value={chu} onChange={(e) => setChu(e.target.value)} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400">{t('Đã nhận {n} cột:', { n: bang.cot.length })}</span>
            {bang.cot.map((c, i) => <span key={i} className="rounded border px-1.5 py-0.5 text-slate-200" style={{ borderColor: 'var(--line-strong)' }}>{c}</span>)}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {coLR && (
              <>
                <span>{t('L, R là')}</span>
                <BoLocDoan ariaLabel={t('L, R là')} value={cheDo} onChange={setCheDo}
                  muc={[{ key: 'cau', nhan: t('Số câu · 0–40') }, { key: 'band', nhan: t('Band · 0–9') }]} />
              </>
            )}
            <span className="flex-1" />
            <Dem n={dem.moi} chu={t('mới')} />
            <Dem n={dem.ghiDe} chu={t('ghi đè')} />
            <Dem n={dem.trung} chu={t('trùng tên')} />
            <Dem n={dem.loi} chu={t('lỗi')} loi />
            <Dem n={dem.khong} chu={t('không có trong lớp')} />
          </div>

          {vua && (
            <div role="status" className="flex flex-wrap items-center gap-2 rounded-md px-3 py-2 text-sm surface-2">
              <span className="font-semibold text-ok">✓ {t('Đã lưu {n} dòng lúc {luc}', { n: vua.n, luc: vua.luc })}</span>
              <button type="button" className="link" disabled={!!dang} onClick={() => void hoanTac()}>{t('Hoàn tác')}</button>
              <span className="flex-1" />
              {!!dong.length && <span className="text-slate-400">{t('{n} dòng còn nháp ở dưới', { n: dong.length })}</span>}
            </div>
          )}

          {!dong.length ? (
            <p className="text-sm text-slate-400">{bang.dong.length ? t('Đã lưu hết các dòng.') : t('Không đọc được dòng nào — kiểm lại vùng đã chép.')}</p>
          ) : hep ? (
            <ul className="flex flex-col gap-2">
              {[...dong].sort((a, b) => Number(hopLe(a)) - Number(hopLe(b))).map((d) => (
                <li key={d.so} className="flex flex-col gap-1.5 rounded-lg border p-3" style={{ borderColor: hopLe(d) ? 'var(--line)' : 'var(--accent)' }}>
                  <TenDong d={d} chon={(v) => setChon((c) => ({ ...c, [d.so]: v }))} />
                  <p className="text-xs text-slate-300">{d.o.map((o) => <span key={o.skill} className={o.x.loai === 'loi' && !d.loiChung ? 'block' : 'mr-2 inline-block'}><OCh o={o} gon tho={!d.hang} anLoi={!!d.loiChung} /></span>)}</p>
                  <NhomDong d={d} thieuNhom={thieuNhom} nhom={nhom} setNhom={setNhom} khoa={khoaNhom} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] table-fixed text-[13px]">
                <colgroup><col className="w-44" />{kn.map((k) => <col key={k} />)}</colgroup>
                <thead>
                  <tr className="text-left text-xs text-slate-400">
                    <th className="px-2 py-1.5 font-medium">{t('Học viên')}</th>
                    {kn.map((k) => <th key={k} className="px-2 py-1.5 font-medium">{ENTRY_SKILL_SHORT[k]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {dong.map((d) => (
                    <FragmentDong key={d.so} d={d} kn={kn}
                      ten={<TenDong d={d} chon={(v) => setChon((c) => ({ ...c, [d.so]: v }))} />}
                      nhom={<NhomDong d={d} thieuNhom={thieuNhom} nhom={nhom} setNhom={setNhom} khoa={khoaNhom} />}
                      coNhom={d.o.some((o) => o.x.loai === 'ghi' && o.x.canNhom)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {loiMang && (
            <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-bad">
              <span className="flex-1 min-w-0">⚠ {t('Không lưu được — {loi}. Bảng dán giữ nguyên.', { loi: loiMang })}</span>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => void luu()} disabled={!!dang || !luuDuoc.length}>{t('Thử lại')}</button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-sm" style={{ borderColor: 'var(--line)' }}>
            <span className="min-w-0 flex-1 text-slate-400" aria-live="polite">
              {dang ? t('Đang lưu {x}/{n} dòng…', { x: dang.xong, n: dang.tong })
                : <>{t('Lưu được')} <b className="text-slate-100">{t('{n} dòng', { n: luuDuoc.length })}</b>{conNhap ? ` · ${t('{n} dòng còn nháp', { n: conNhap })}` : ''}</>}
            </span>
            <button type="button" className="btn btn-sm" onClick={huy} disabled={!!dang}>{t('Dán lại')}</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => void luu()} disabled={!!dang || !luuDuoc.length}>
              {t('Lưu {n} dòng', { n: luuDuoc.length })}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function Dem({ n, chu, loi }: { n: number; chu: string; loi?: boolean }) {
  if (!n) return null;
  return <span className={`rounded border px-1.5 py-0.5 text-xs ${loi ? 'text-bad' : 'text-slate-300'}`} style={{ borderColor: loi ? 'currentColor' : 'var(--line-strong)' }}><b>{n}</b> {chu}</span>;
}

/** Một dòng bảng + (nếu ô dưới kỳ vọng) dòng chọn nhóm nguyên nhân ngay dưới. */
function FragmentDong({ d, kn, ten, nhom, coNhom }: { d: DongXem; kn: readonly EntrySkill[]; ten: ReactNode; nhom: ReactNode; coNhom: boolean }) {
  const mo = !d.hang;
  return (
    <>
      <tr className={`border-t align-top ${mo ? 'opacity-60' : ''}`} style={{ borderColor: 'var(--line)' }}>
        <td className="px-2 py-2">{ten}</td>
        {kn.map((k) => { const o = d.o.find((x) => x.skill === k); return <td key={k} className="px-2 py-2">{o ? <OCh o={o} tho={!d.hang} anLoi={!!d.loiChung} /> : null}</td>; })}
      </tr>
      {coNhom && d.hang && <tr><td colSpan={kn.length + 1} className="px-2 pb-2">{nhom}</td></tr>}
    </>
  );
}

function TenDong({ d, chon }: { d: DongXem; chon: (v: number | 'bo' | null) => void }) {
  if (d.hang) {
    const khac = d.ten && d.ten !== d.hang.studentName;
    return (
      <div className="min-w-0">
        <span className="inline-flex items-center gap-1 font-medium text-slate-100"><IconDat className="text-ok" />{d.hang.studentName}</span>
        {khac && <small className="block text-xs text-slate-400">{t('Excel: {ten}', { ten: d.ten })}</small>}
        {d.daChon && <button type="button" className="link text-xs" onClick={() => chon(null)}>{t('Chọn lại')}</button>}
        {d.trungDong !== null && <small className="block text-xs text-bad">{t('Trùng em với dòng {so}', { so: d.trungDong })}</small>}
        {d.loiMay && <small className="block text-xs text-bad">⚠ {d.loiMay}</small>}
        {d.loiChung && <small className="block text-xs text-bad">⚠ {d.loiChung}</small>}
      </div>
    );
  }
  if (d.trung.length) {
    return (
      <label className="flex min-w-0 flex-col gap-1">
        <span className="font-medium text-slate-100">{t('{ten} · chọn em', { ten: d.ten })}</span>
        <small className="text-xs text-slate-400">{t('{n} em cùng tên trong lớp', { n: d.trung.length })}</small>
        <select className="field min-h-[44px] text-sm sm:min-h-0" defaultValue="" onChange={(e) => chon(e.target.value === 'bo' ? 'bo' : Number(e.target.value))}>
          <option value="" disabled>{t('Chọn em…')}</option>
          {d.trung.map((h) => <option key={h.attemptId} value={h.attemptId}>{h.studentName}{h.studentEmail ? ` · ${h.studentEmail}` : ''}</option>)}
          <option value="bo">{t('Không dán dòng này')}</option>
        </select>
      </label>
    );
  }
  return <span className="text-slate-300">{t('{ten} · không có trong lớp', { ten: d.ten || '—' })}</span>;
}

/** Ô xem trước: điểm (ghi đè: cũ gạch → mới) + nhận xét nhỏ; lỗi: chữ đỏ + lý do; bỏ qua: chữ mờ. */
function OCh({ o, gon, tho, anLoi }: { o: ODong; gon?: boolean; tho?: boolean; anLoi?: boolean }) {
  const ten = gon ? `${ENTRY_SKILL_SHORT[o.skill]} ` : '';
  if (tho) return o.diem ? <span className="tabular-nums">{ten}{o.diem}</span> : null;
  if (o.x.loai === 'bo') return gon ? null : <span className="whitespace-nowrap text-xs text-slate-500">{o.diem || o.nhanXet ? t('không đổi') : t('bỏ qua · ô trống')}</span>;
  if (o.x.loai === 'loi') {
    return (
      <span className="text-bad">
        {ten}<b className="tabular-nums">{o.diem || '—'}</b>
        {anLoi ? <span aria-hidden> ⚠</span> : <small className="block text-xs">⚠ {o.x.loi}</small>}
      </span>
    );
  }
  const x = o.x;
  return (
    <span>
      {ten}{x.truoc !== null ? <span className="tabular-nums"><s className="text-slate-500">{x.truoc}</s> → <b>{x.sau}</b></span> : <b className="tabular-nums">{x.sau}</b>}
      {!gon && (o.nhanXet || x.truoc !== null) && <small className="block max-w-[18ch] text-xs text-slate-400">{x.truoc !== null ? `${t('Ghi đè')}${o.nhanXet ? ' · ' : ''}` : ''}{o.nhanXet}</small>}
      {x.canNhom && <small className="block text-xs font-semibold text-[color:var(--accent-strong)]">{t('Nguyên nhân *')}</small>}
    </span>
  );
}

function NhomDong({ d, thieuNhom, nhom, setNhom, khoa }: {
  d: DongXem; thieuNhom: (d: DongXem, o: ODong) => boolean; nhom: Record<string, string[]>;
  setNhom: (f: (n: Record<string, string[]>) => Record<string, string[]>) => void; khoa: (so: number, k: string) => string;
}) {
  const can = d.o.filter((o) => o.x.loai === 'ghi' && o.x.canNhom);
  if (!d.hang || !can.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {can.map((o) => {
        const id = `nn-${d.so}-${o.skill}`;
        const thieu = o.cell?.kyVong != null && o.x.loai === 'ghi' && o.x.band !== null ? o.cell.kyVong - o.x.band : null;
        return (
          <div key={o.skill} className="flex flex-wrap items-center gap-2">
            <span id={id} className={`text-xs font-semibold ${thieuNhom(d, o) ? 'text-bad' : 'text-slate-300'}`}>
              {ENTRY_SKILL_SHORT[o.skill]} · {d.hang!.studentName}{thieu !== null ? ` · ${t('thiếu {x}', { x: thieu.toFixed(1) })}` : ''} · {t('Nhóm nguyên nhân')}
            </span>
            <ChonNhom skill={o.skill} nhanId={id} value={nhom[khoa(d.so, o.skill)] ?? []}
              onChange={(v) => setNhom((n) => ({ ...n, [khoa(d.so, o.skill)]: v }))} />
          </div>
        );
      })}
    </div>
  );
}

/** Nút ? — 6 bước + "Sao chép mẫu" (tiêu đề cột của các kỹ năng đang mở). */
function HuongDan({ cot }: { cot: readonly EntrySkill[] }) {
  const [daChep, setDaChep] = useState<'' | 'ok' | 'loi'>('');
  const mau = [t('Tên'), ...cot.flatMap((k) => [ENTRY_SKILL_SHORT[k], t('Nhận xét {k}', { k: ENTRY_SKILL_SHORT[k] })])];
  const chep = async () => {
    try { await navigator.clipboard.writeText(`${mau.join('\t')}\n`); setDaChep('ok'); } catch { setDaChep('loi'); }
  };
  return (
    <div role="note" aria-label={t('Cách dán từ Excel')} className="rounded-md px-3 py-2 text-sm surface-2">
      <p className="font-semibold text-slate-100">{t('Cách dán từ Excel')}</p>
      <p className="text-slate-300">{t('Mỗi em một dòng: Tên, rồi từng cặp điểm · nhận xét.')}</p>
      <p className="my-1.5 flex flex-wrap gap-1 text-xs">{mau.map((c, i) => <span key={i} className="rounded border px-1.5 py-0.5" style={{ borderColor: 'var(--line-strong)' }}>{c}</span>)}</p>
      <ol className="list-decimal pl-5 text-slate-300">
        <li>{t('Chọn đúng lớp, lượt Test và kỹ năng.')}</li>
        <li>{t('Sao chép mẫu có tiêu đề cột')} (<button type="button" className="link" onClick={() => void chep()}>{t('Sao chép mẫu')}</button>{daChep === 'ok' ? ` ✓ ${t('đã chép')}` : daChep === 'loi' ? ` · ${t('trình duyệt chặn — gõ tiêu đề theo mẫu trên')}` : ''}).</li>
        <li>{t('Điền mỗi em một dòng; điểm và nhận xét cạnh nhau theo mẫu.')}</li>
        <li>{t('Chọn vùng dữ liệu trong Excel (có hoặc không hàng tiêu đề), Ctrl C rồi Ctrl V vào khung.')}</li>
        <li>{t('Kiểm bảng: em khớp, ô mới, ô ghi đè, dòng lỗi; trùng tên thì chọn em.')}</li>
        <li>{t('Bấm Lưu: dòng hợp lệ được lưu, dòng chưa đủ còn là nháp.')}</li>
      </ol>
      <p className="mt-1.5 text-xs text-slate-400">{t('Một kỹ năng: Tên · điểm · nhận xét. Ô trống được bỏ qua, không thành 0. W1, W2, S: bốn tiêu chí (5.5 6 6 5.5).')}</p>
    </div>
  );
}
