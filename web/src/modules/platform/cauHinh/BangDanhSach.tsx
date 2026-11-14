import { useState, type ReactNode, type KeyboardEvent } from 'react';
import { t } from '@shared/i18n/index.ts';
import { laKhac, soOMocCuaPa, type MocSos, type MucNguyenNhan, type MucPa, type NguyenNhan, type NhanhNN, type Viec } from '@shared/domain/index.ts';
import type { DuLieuCauHinh, LuuDs } from '../CauHinhCaseSos.tsx';
import { Bang, OBang, type CotBang } from '../../../ui/Bang.tsx';

/** Cột chung (Bang): kéo · tên (linh hoạt) · đang dùng · nút. Tiêu đề chỉ chữ (G9). */
const COT: CotBang[] = [
  { key: 'tay', nhan: '', kieu: 'chu', rong: 32 },
  { key: 'ten', nhan: t('Tên'), kieu: 'chu', linhHoat: true },
  { key: 'dung', nhan: t('Đang dùng'), kieu: 'so', rong: 96 },
  { key: 'nut', nhan: '', kieu: 'nut', rong: 160 },
];

/**
 * BẢNG DANH SÁCH SỬA TẠI DÒNG (CAU-HINH-CASE-SOS, mockup K1–K4, K6): một bảng nhóm theo dải; tên bấm thẳng = sửa tại dòng (Enter lưu, Esc thôi);
 * ⠿ kéo / Alt + ↑ ↓ đổi thứ tự; Ẩn · Hiện lại · Xoá (mục chưa dùng) lưu ngay. Mỗi thao tác gọi `luu(khoa nhóm, danh sách mới của nhóm, câu toast)`.
 */
type MucChung = { ma: string; ten: string; tenEn?: string; an?: true };
export type NhomDs<M extends MucChung> = { key: string; ten: string; muc: M[]; themChu: string };

type Props<M extends MucChung> = {
  nhom: NhomDs<M>[];
  dangDung: Record<string, number>; donVi: string; chiXem: boolean;
  /** Dòng phụ dưới tên (giải thích / cách chạy) — rỗng thì không vẽ. */
  phu: (m: M) => ReactNode;
  /** Lý do không ẩn được (đang nằm trong ô mốc…) — có thì nút Ẩn tắt + lý do tại nút. */
  khoaAn?: (m: M) => string | null;
  /** Mục gốc (mã có hành vi) — không xoá; mục "Khác" luôn cuối. */
  coDinh: (m: M) => boolean;
  /** Ô thêm của dòng sửa (ngoài Tên + Tên tiếng Anh). */
  oThem?: (nhap: M, dat: (m: M) => void, moi: boolean) => ReactNode;
  moi: (nhomKey: string) => M;
  luu: (nhomKey: string, ds: M[], chu: string) => Promise<boolean>;
};

const chuan = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

export function BangDanhSach<M extends MucChung>(p: Props<M>) {
  const [sua, setSua] = useState<{ nhom: string; idx: number | 'moi'; m: M } | null>(null);
  const [busy, setBusy] = useState(false);
  const [keo, setKeo] = useState<{ nhom: string; idx: number } | null>(null);

  const ghi = async (nhomKey: string, ds: M[], chu: string) => {
    setBusy(true);
    try { return await p.luu(nhomKey, ds, chu); } finally { setBusy(false); }
  };
  const doiCho = async (n: NhomDs<M>, tu: number, toi: number) => {
    const ds = [...n.muc];
    const cuoi = ds.length - (ds.length && laKhac(ds[ds.length - 1].ma) ? 1 : 0);   // "Khác" luôn cuối
    if (toi < 0 || toi >= cuoi || tu >= cuoi || tu === toi) return;
    const [m] = ds.splice(tu, 1);
    ds.splice(toi, 0, m);
    const ok = await ghi(n.key, ds, t('Đã đổi thứ tự · {nhom}', { nhom: n.ten }));
    /* Đang sửa đúng mục vừa dời → chỉ số đi theo (Lưu sau đó ghi đúng mục, không đè mục bên cạnh). */
    if (ok) setSua((s) => (s && s.nhom === n.key && s.idx === tu ? { ...s, idx: toi } : s));
  };
  const loiTen = (n: NhomDs<M>, m: M, idx: number | 'moi'): string | null => {
    const ten = m.ten.trim();
    if (!ten) return t('Nhập tên.');
    if (ten.length > 60) return t('Tối đa {n} ký tự.', { n: 60 });
    const trung = n.muc.find((x, i) => i !== idx && chuan(x.ten) === chuan(ten));
    return trung ? t('Trùng tên với "{ten}" trong {nhom} — đổi tên khác.', { ten: trung.ten, nhom: n.ten }) : null;
  };
  const luuSua = async () => {
    if (!sua) return;
    const n = p.nhom.find((x) => x.key === sua.nhom)!;
    if (loiTen(n, sua.m, sua.idx)) return;
    const m = { ...sua.m, ten: sua.m.ten.trim(), ...(sua.m.tenEn?.trim() ? { tenEn: sua.m.tenEn.trim() } : { tenEn: undefined }) } as M;
    const ds = [...n.muc];
    if (sua.idx === 'moi') ds.splice(ds.length && laKhac(ds[ds.length - 1].ma) ? ds.length - 1 : ds.length, 0, m);
    else ds[sua.idx] = m;
    const ok = await ghi(n.key, ds, sua.idx === 'moi' ? t('Đã thêm "{ten}"', { ten: m.ten }) : t('Đã lưu "{ten}"', { ten: m.ten }));
    if (ok) setSua(null);   // lỗi → ở lại, giữ chữ
  };
  const phim = (e: KeyboardEvent) => {
    /* Enter = Lưu chỉ khi đang gõ trong ô nhập (Enter trên nút ↑ ↓ / Thôi giữ việc của nút). */
    if (e.key === 'Enter' && !e.nativeEvent.isComposing && (e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type !== 'checkbox') { e.preventDefault(); void luuSua(); }
    if (e.key === 'Escape') { e.preventDefault(); setSua(null); }
  };

  return (
    <Bang<number> ten={p.nhom.map((n) => n.ten).join(' · ')} cot={COT} hang={[0]} khoa={() => 0} the375={false} hangRieng={() => <>
          {p.nhom.map((n) => {
            const hien = n.muc.filter((m) => !m.an).length, an = n.muc.length - hien;
            return [
              <tr key={`d-${n.key}`} className="border-b" style={{ borderColor: 'var(--line)' }}>
                <OBang c={COT[0]} colSpan={4} className="!whitespace-normal bg-[color:var(--surface-2)] py-2.5 pl-3.5 pr-3 shadow-[inset_3px_0_0_var(--line-strong)]">
                  <span className="flex flex-wrap items-center gap-2.5 text-[15px] font-bold text-slate-100">
                    {n.ten}<span className="rounded border px-1.5 text-[12px] font-semibold tabular-nums text-slate-200" style={{ borderColor: 'var(--line-strong)' }}>{hien}</span>
                    {an > 0 && <span className="text-[13px] font-normal text-slate-400">· {t('{n} đang ẩn', { n: an })}</span>}
                  </span>
                </OBang>
              </tr>,
              ...n.muc.map((m, i) => {
                if (sua && sua.nhom === n.key && sua.idx === i) return <DongSua key={m.ma} {...p} n={n} sua={sua} setSua={setSua} loi={loiTen(n, sua.m, i)} busy={busy} onLuu={luuSua} phim={phim} doiCho={(d) => void doiCho(n, i, i + d)} />;
                const khac = laKhac(m.ma), dung = p.dangDung[m.ma] ?? 0, khoa = p.khoaAn?.(m) ?? null;
                const phu = p.phu(m);
                return (
                  <tr key={m.ma} className={`border-b ${m.an ? 'text-slate-500' : ''}`} style={{ borderColor: 'var(--line)' }}
                    draggable={!p.chiXem && !khac && !busy} onDragStart={() => setKeo({ nhom: n.key, idx: i })} onDragOver={(e) => { if (keo?.nhom === n.key) e.preventDefault(); }}
                    onDrop={() => { if (keo?.nhom === n.key) void doiCho(n, keo.idx, i); setKeo(null); }}
                    onKeyDown={(e) => { if (!p.chiXem && e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); void doiCho(n, i, i + (e.key === 'ArrowUp' ? -1 : 1)); } }}>
                    <OBang c={COT[0]} className="py-1.5 pl-3.5 align-middle">
                      {!p.chiXem && !khac && <span className="cursor-grab select-none text-slate-500" title={t('Kéo để đổi thứ tự · Alt + ↑ ↓')} aria-hidden>⠿</span>}
                    </OBang>
                    <OBang c={COT[1]} className="!whitespace-normal py-1.5 pr-3">
                      {p.chiXem || m.an
                        ? <span className={`text-[15px] font-medium ${m.an ? 'line-through decoration-1' : 'text-slate-100'}`}>{m.ten}</span>
                        : <button type="button" className="-ml-2 rounded-md px-2 py-1.5 text-left text-[15px] font-medium text-slate-100 hover:bg-[color:var(--accent-soft)]"
                            title={t('Sửa tên')} onClick={() => setSua({ nhom: n.key, idx: i, m: { ...m } })}>{m.ten} <span aria-hidden className="text-slate-500">✎</span></button>}
                      {phu && <div className="text-[13px] text-slate-400">{phu}</div>}
                      {/* Mục gốc: máy chủ không đếm (luôn coi là đang dùng, chỉ ẩn được) → để trống. */}
                      {(dung || !p.coDinh(m)) && <div className="text-[13px] text-slate-400 sm:hidden">{dung ? `${dung} ${p.donVi}` : t('Chưa dùng')}</div>}
                    </OBang>
                    <OBang c={COT[2]} className="py-1.5 text-sm tabular-nums text-slate-400">{dung ? <><b className="font-semibold text-slate-100">{dung}</b> {p.donVi}</> : p.coDinh(m) ? null : '—'}</OBang>
                    <OBang c={COT[3]} className="py-1.5 pr-3.5">
                      {p.chiXem ? (m.an ? <span className="text-[12px] font-semibold text-slate-400">{t('Đang ẩn')}</span> : null)
                        : khac ? <span className="text-[13px] text-slate-500">{t('Luôn cuối')}</span>
                        : m.an ? <span className="inline-flex items-center gap-2"><span className="text-[12px] font-semibold text-slate-400 max-sm:hidden">{t('Đang ẩn')}</span>
                            <button type="button" className="btn btn-ghost btn-sm min-h-[44px] sm:min-h-0" disabled={busy}
                              onClick={() => void ghi(n.key, n.muc.map((x) => (x.ma === m.ma ? { ...x, an: undefined } as M : x)), t('Đã hiện lại "{ten}"', { ten: m.ten }))}>{t('Hiện lại')}</button></span>
                        : khoa ? <span className="inline-flex items-center gap-2" title={khoa}><button type="button" className="btn btn-ghost btn-sm" aria-disabled="true" disabled>{t('Ẩn')}</button><span className="text-[12px] text-slate-500 max-sm:hidden">{khoa}</span></span>
                        : !dung && !p.coDinh(m) ? <button type="button" className="btn btn-ghost btn-sm min-h-[44px] sm:min-h-0" disabled={busy}
                            onClick={() => void ghi(n.key, n.muc.filter((x) => x.ma !== m.ma), t('Đã xoá "{ten}"', { ten: m.ten }))}>{t('Xoá')}</button>
                        : <button type="button" className="btn btn-ghost btn-sm min-h-[44px] sm:min-h-0" disabled={busy}
                            onClick={() => void ghi(n.key, n.muc.map((x) => (x.ma === m.ma ? { ...x, an: true } as M : x)), dung ? t('Đã ẩn "{ten}" — {n} {donVi} giữ nguyên', { ten: m.ten, n: dung, donVi: p.donVi }) : t('Đã ẩn "{ten}"', { ten: m.ten }))}>{t('Ẩn')}</button>}
                    </OBang>
                  </tr>
                );
              }),
              sua && sua.nhom === n.key && sua.idx === 'moi'
                ? <DongSua key={`moi-${n.key}`} {...p} n={n} sua={sua} setSua={setSua} loi={sua.m.ten ? loiTen(n, sua.m, 'moi') : null} busy={busy} onLuu={luuSua} phim={phim} />
                : !p.chiXem && n.themChu && (
                  <tr key={`t-${n.key}`} className="border-b" style={{ borderColor: 'var(--line)' }}>
                    <OBang c={COT[0]} />
                    <OBang c={COT[1]} colSpan={3} className="py-1.5"><button type="button" className="btn btn-ghost btn-sm -ml-2 min-h-[44px] text-[color:var(--accent)] sm:min-h-0" onClick={() => setSua({ nhom: n.key, idx: 'moi', m: p.moi(n.key) })}>+ {n.themChu}</button></OBang>
                  </tr>
                ),
            ];
          })}
        </>} />
  );
}

function DongSua<M extends MucChung>(p: Props<M> & {
  n: NhomDs<M>; sua: { nhom: string; idx: number | 'moi'; m: M }; setSua: (s: { nhom: string; idx: number | 'moi'; m: M } | null) => void;
  loi: string | null; busy: boolean; onLuu: () => void; phim: (e: KeyboardEvent) => void; doiCho?: (d: number) => void;
}) {
  const { sua, setSua } = p;
  const dat = (m: M) => setSua({ ...sua, m });
  const moi = sua.idx === 'moi';
  return (
    <tr className="border-b bg-[color:var(--surface-2)] shadow-[inset_3px_0_0_var(--accent)]" style={{ borderColor: 'var(--line)' }} onKeyDown={p.phim}>
      <OBang c={COT[0]} />
      <OBang c={COT[1]} colSpan={3} className="!whitespace-normal py-3 pr-3.5">
        <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <label className="grid gap-1 text-[13px] font-medium text-slate-400">
            <span className="flex justify-between">{t('Tên')}<span className="tabular-nums text-slate-500">{sua.m.ten.length}/60</span></span>
            <input className={`field ${p.loi ? 'border-[color:var(--danger)]' : ''}`} autoFocus value={sua.m.ten} maxLength={80} aria-invalid={!!p.loi}
              onChange={(e) => dat({ ...sua.m, ten: e.target.value })} />
            {p.loi && <span className="text-[13px] text-bad">⚠ {p.loi}</span>}
          </label>
          {p.oThem?.(sua.m, dat, moi)}
          <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-slate-400 sm:col-span-2">
            <span>{t('Tên tiếng Anh')}</span>
            <input className="field min-w-[200px] flex-1" value={sua.m.tenEn ?? ''} maxLength={60} placeholder={t('Không bắt buộc')} onChange={(e) => dat({ ...sua.m, tenEn: e.target.value })} />
            {p.doiCho && !laKhac(sua.m.ma) && (
              <span className="inline-flex overflow-hidden rounded-lg border" role="group" aria-label={t('Đổi thứ tự')} style={{ borderColor: 'var(--line-strong)' }}>
                <button type="button" className="btn btn-ghost btn-sm min-h-[44px] rounded-none sm:min-h-0" aria-label={t('Lên')} onClick={() => p.doiCho!(-1)}>↑</button>
                <button type="button" className="btn btn-ghost btn-sm min-h-[44px] rounded-none border-l sm:min-h-0" aria-label={t('Xuống')} style={{ borderColor: 'var(--line-strong)' }} onClick={() => p.doiCho!(1)}>↓</button>
              </span>
            )}
            <span className="ml-auto flex gap-2">
              <button type="button" className="btn btn-ghost min-h-[44px] sm:min-h-0" onClick={() => setSua(null)}>{t('Đóng')}</button>
              <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={p.busy || !!p.loi || !sua.m.ten.trim()} onClick={p.onLuu}>
                {p.busy ? t('Đang lưu…') : moi ? t('Thêm') : t('Lưu')}</button>
            </span>
          </div>
        </div>
      </OBang>
    </tr>
  );
}

// ---------------------------------------------------------------- ba danh sách

type ChungProps = { duLieu: DuLieuCauHinh; chiXem: boolean; luuDs: LuuDs };

const TEN_NHANH: Record<'ft' | 'thuong', Partial<Record<NhanhNN, string>>> = {
  ft: { listening: 'Listening', reading: 'Reading', writing: 'Writing · W1 + W2', speaking: 'Speaking' },
  thuong: { listening: 'Listening · BE, ELE', reading: 'Reading · BE, ELE', writing: 'Writing · BE, ELE', speaking: 'Speaking · BE, ELE',
    gv: 'Grammar + Vocabulary · FOU', phat_am: 'Pronunciation · FOU', tong_hop: 'Tổng hợp · Pre FOU' },
};

export function BangNguyenNhan({ duLieu, chiXem, luuDs, ben }: ChungProps & { ben: 'ft' | 'thuong' }) {
  const nn = duLieu.nguyen_nhan.du_lieu;
  const nhom: NhomDs<MucNguyenNhan>[] = (Object.keys(TEN_NHANH[ben]) as NhanhNN[]).filter((k) => nn[ben][k])
    .map((k) => ({ key: k, ten: TEN_NHANH[ben][k]!, muc: nn[ben][k]!, themChu: t('Thêm nhóm') }));
  return (
    <BangDanhSach<MucNguyenNhan> nhom={nhom} dangDung={duLieu.dangDung} donVi="Case" chiXem={chiXem}
      phu={(m) => m.giaiThich ?? null}
      coDinh={(m) => !/\.m\d+$/.test(m.ma)}
      moi={() => ({ ma: '', ten: '' })}
      oThem={(m, dat) => (
        <label className="grid gap-1 text-[13px] font-medium text-slate-400">
          <span className="flex justify-between">{t('Giải thích')}<span className="tabular-nums text-slate-500">{(m.giaiThich ?? '').length}/160</span></span>
          <input className="field" value={m.giaiThich ?? ''} maxLength={160} placeholder={t('Không bắt buộc — GV thấy ở ⓘ')}
            onChange={(e) => dat({ ...m, giaiThich: e.target.value.trim() ? e.target.value : undefined })} />
        </label>
      )}
      luu={(k, ds, chu) => luuDs('nguyen_nhan', { ...nn, [ben]: { ...nn[ben], [k]: ds } } as NguyenNhan, chu)} />
  );
}

/** Mục PA đang nằm trong ô PA quy chế của Mốc SOS — không ẩn được (lý do tại nút). */
const oDungPa = soOMocCuaPa;   // cùng hàm máy chủ dùng để chặn ẩn / xoá
export const oDungViec = (moc: MocSos, ma: string) => Object.values(moc.ft).reduce((n, h) => n + Object.values(h).filter((o) => o.viec.includes(ma)).length, 0)
  + Object.values(moc.thuong).filter((x) => x.viec.includes(ma)).length;

export function BangPhuongAn({ duLieu, chiXem, luuDs }: ChungProps) {
  const pa = duLieu.phuong_an.du_lieu.muc;
  const moc = duLieu.moc_sos.du_lieu;
  const nhom: NhomDs<MucPa>[] = [
    { key: 'gv_tu_lam', ten: t('GV tự làm'), muc: pa.filter((m) => m.nhom === 'gv_tu_lam'), themChu: t('Thêm phương án') },
    { key: 'can_ql_duyet', ten: t('Cần QL duyệt · Đề xuất'), muc: pa.filter((m) => m.nhom === 'can_ql_duyet'), themChu: t('Thêm phương án cần QL duyệt') },
  ];
  const gocMa = new Set(['self_study', 'tutor', 'teaching_adjust', 'extra_homework', 'extra_support', 'other_proposal']);
  return (
    <div className="grid gap-3">
      <BangDanhSach<MucPa> nhom={nhom} dangDung={duLieu.dangDung} donVi="PA" chiXem={chiXem}
        phu={(m) => [oDungPa(moc, m.ma) ? t('PA quy chế') : '', m.nguoiDay ? t('có người dạy') : '', m.soBuoi ? t('đếm số buổi') : '', laKhac(m.ma) ? t('GV ghi rõ tên đề xuất') : ''].filter(Boolean).join(' · ') || null}
        khoaAn={(m) => (oDungPa(moc, m.ma) ? t('đang ở {n} ô Mốc SOS', { n: oDungPa(moc, m.ma) }) : null)}
        coDinh={(m) => gocMa.has(m.ma)}
        moi={(k) => ({ ma: '', ten: '', nhom: k as MucPa['nhom'], nguoiDay: false, soBuoi: false })}
        oThem={(m, dat) => {
          if (gocMa.has(m.ma)) return null;
          /* PA đã có PA dùng: cách chạy khoá (máy chủ cũng chặn) — chỉ đổi tên, thứ tự, ẩn. */
          const khoa = (duLieu.dangDung[m.ma] ?? 0) > 0;
          return (
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <label className="inline-flex min-h-[44px] items-center gap-2 sm:min-h-0"><input type="checkbox" checked={m.nguoiDay} disabled={khoa} onChange={(e) => dat({ ...m, nguoiDay: e.target.checked })} />{t('Có người dạy')}</label>
              <label className="inline-flex min-h-[44px] items-center gap-2 sm:min-h-0"><input type="checkbox" checked={m.soBuoi} disabled={khoa} onChange={(e) => dat({ ...m, soBuoi: e.target.checked })} />{t('Đếm số buổi')}</label>
              {khoa && <span className="text-[13px] text-slate-400">{t('{n} PA đang dùng — giữ cách chạy', { n: duLieu.dangDung[m.ma] })}</span>}
            </div>
          );
        }}
        luu={(k, ds, chu) => {
          /* Giữ thứ tự: GV tự làm trước, Cần QL duyệt sau ("Khác" cuối cùng). */
          const ke = k === 'gv_tu_lam' ? [...ds, ...pa.filter((m) => m.nhom !== 'gv_tu_lam')] : [...pa.filter((m) => m.nhom === 'gv_tu_lam'), ...ds];
          return luuDs('phuong_an', { muc: ke }, chu);
        }} />
      <div className="card px-4 py-3 text-[13px] text-slate-400">
        <b className="font-semibold text-slate-200">{t('Hệ thống tạo')}</b> · {t('Bổ trợ, Bổ trợ miễn phí — số buổi ở Mốc SOS › Lớp thường.')}
      </div>
    </div>
  );
}

export const tomTatViec = (v: Viec) => [v.hanNgay ? t('{n} ngày', { n: v.hanNgay }) : t('không hạn'),
  v.ghiChu === 'bat_buoc' ? t('ghi chú ≥ {n}', { n: v.toiThieu ?? 1 }) : '', v.buocTvv ? t('→ TVV {n} ngày', { n: v.buocTvv.hanNgay }) : ''].filter(Boolean).join(' · ');

export function DanhMucViec({ duLieu, chiXem, luuDs }: ChungProps) {
  const moc = duLieu.moc_sos.du_lieu;
  const gocMa = new Set(['talk_student', 'talk_family', 'gvcn_meeting', 'cx_meeting_student', 'cx_meeting_family', 'other', 'bao_ph_tvv']);
  return (
    <BangDanhSach<Viec> nhom={[{ key: 'viec', ten: t('Việc phối hợp'), muc: moc.viec, themChu: t('Thêm việc') }]} dangDung={duLieu.dangDung} donVi={t('việc')} chiXem={chiXem}
      phu={(v) => tomTatViec(v)}
      khoaAn={(v) => (oDungViec(moc, v.ma) ? t('đang ở {n} ô mốc', { n: oDungViec(moc, v.ma) }) : null)}
      coDinh={(v) => gocMa.has(v.ma)}
      moi={() => ({ ma: '', ten: '', hanNgay: null, ghiChu: 'khong' })}
      oThem={(v, dat) => (
        <div className="grid gap-2 text-[13px] text-slate-400 sm:col-span-2 sm:grid-cols-2">
          <label className="grid gap-1 font-medium">{t('Hạn (ngày, trống = không hạn)')}
            <input className="field" inputMode="numeric" value={v.hanNgay ?? ''} onChange={(e) => dat({ ...v, hanNgay: e.target.value.trim() ? Number(e.target.value) : null })} /></label>
          <label className="grid gap-1 font-medium">{t('Ghi chú khi xác nhận')}
            <span className="flex items-center gap-2">
              <select className="field" value={v.ghiChu} onChange={(e) => dat({ ...v, ghiChu: e.target.value as Viec['ghiChu'], toiThieu: e.target.value === 'bat_buoc' ? v.toiThieu ?? 10 : undefined })}>
                <option value="khong">{t('Không bắt buộc')}</option><option value="bat_buoc">{t('Bắt buộc')}</option>
              </select>
              {v.ghiChu === 'bat_buoc' && <><span>≥</span><input className="field w-16 text-center" inputMode="numeric" value={v.toiThieu ?? ''} onChange={(e) => dat({ ...v, toiThieu: Number(e.target.value) || undefined })} /></>}
            </span></label>
          <label className="inline-flex min-h-[44px] items-center gap-2 text-sm text-slate-200 sm:col-span-2 sm:min-h-0">
            <input type="checkbox" checked={!!v.buocTvv} onChange={(e) => dat({ ...v, buocTvv: e.target.checked ? { hanNgay: 5, toiThieu: 10 } : undefined })} />
            {t('Sau xác nhận: sinh việc TVV báo gia đình')}
            {v.buocTvv && <>
              <span className="text-slate-400">· {t('hạn')}</span><input className="field w-16 text-center" inputMode="numeric" value={v.buocTvv.hanNgay} onChange={(e) => dat({ ...v, buocTvv: { ...v.buocTvv!, hanNgay: Number(e.target.value) } })} />
              <span className="text-slate-400">{t('ngày · tối thiểu')}</span><input className="field w-16 text-center" inputMode="numeric" value={v.buocTvv.toiThieu} onChange={(e) => dat({ ...v, buocTvv: { ...v.buocTvv!, toiThieu: Number(e.target.value) } })} />
              <span className="text-slate-400">{t('ký tự')}</span></>}
          </label>
        </div>
      )}
      luu={(_k, ds, chu) => luuDs('moc_sos', { ...moc, viec: ds }, chu)} />
  );
}
