import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { fmtBand } from '../../lib/format.ts';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { Truong } from '../../ui/KhungPanel.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChuDich } from '../../ui/ChuDich.tsx';
import { KhoaNho } from '../cases/FormPa.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BAI_LOP_NHAN_XET_TOI_DA, BAI_LOP_TEN_TOI_DA, BAI_LOP_THANG_TOI_DA, kiemBand, mondayOfDate, tenMonNgan } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { OVERALL, type ChonKn } from './HanhTrinhKyNang.tsx';

/** `GET /students/:id/bai-tren-lop` (SV-BAI-LOP-2): kết quả tuỳ chọn — điểm / thang của bài HOẶC band; nhận xét tuỳ chọn (cần ít nhất một trong ba). */
type Bai = {
  id: number; classId: number; lop: string; skill: string; tenBai: string | null; diem: number | null; thang: number | null; band: number | null;
  tuan: string; tuanMa: string; nhanXet: string | null; ghiBoi: string | null; suaBoi: string | null; sua: boolean;
};
/** Góp ý tuần cũ của em (chỉ đọc từ 27/10) — mọi lớp, mã lớp lúc ghi. */
type GopY = { id: number; classId: number; lop: string; skill: string; noiDung: string; tuan: string; tuanMa: string; ghiBoi: string | null };
type DsBai = { bai: Bai[]; gopY: GopY[]; lop: { classId: number; code: string; kyNang: string[] }[] };
type Dong = ({ loai: 'bai' } & Bai) | ({ loai: 'gy' } & GopY);
/** Thân gửi máy chủ — cũng là bản chụp để Hoàn tác (sửa → PUT bản cũ; xoá → POST lại). */
type Than = { skill: string; tuan: string; tenBai: string | null; diem: number | null; thang: number | null; band: number | null; nhanXet: string | null };
type VuaLuu = { id: number | null; chu: string; hoanTac: () => Promise<unknown> };

/** Kỹ năng của bài trên lớp: FT W1 / W2 ghi chung "writing" (cột Góp ý tuần). */
const kyNangBai = (chon: ChonKn) => (chon === 'writing1' || chon === 'writing2' ? 'writing' : chon);
const so = (d: number) => (Number.isInteger(d) ? String(d) : String(Math.round(d * 100) / 100));
const thanCua = (b: Bai): Than => ({ skill: b.skill, tuan: b.tuan, tenBai: b.tenBai, diem: b.diem, thang: b.thang, band: b.band, nhanXet: b.nhanXet });
/** ≤ 6 dòng hiện hết; dài hơn → 5 dòng + "Xem thêm n dòng" (mockup M5: không "Xem thêm 1 dòng"). */
const TOI_DA = 5;
const HOAN_TAC_MS = 10_000;

/**
 * TIẾN ĐỘ TRÊN LỚP — cột trái dưới Hành trình (UI-HO-SO-HV-2, mockup M5 `thiet-ke/v7/ho-so-hv.html` khu "Tiến độ trên lớp"): danh sách gọn mới trước —
 * dòng 1 tuần · (kỹ năng khi Overall) · người ghi (+ mã lớp lúc ghi khi khác lớp đang học); dòng 2 kết quả ("Part 2 · 6/10" / "Band 6.0") + nhận xét
 * (`ChuDich`). Góp ý tuần cũ: nhãn khoá, chỉ đọc. "+ Ghi tiến độ" và bấm dòng mình sửa được → form NGAY TRONG CỘT (không panel); lưu xong dòng viền nhấn +
 * "✓ Đã lưu · Hoàn tác" (10 giây; xoá cũng Hoàn tác được). Thang riêng: không vào MT / Overall / KPI. Quyền ghi do máy chủ (`lop[].kyNang`, `sua`).
 */
export function TienDoTrenLop({ studentId, lopNay, chon, ct, homNay, onRe }: {
  studentId: number; lopNay: number | null; chon: ChonKn; ct: string | null; homNay: string;
  /** Rê / focus một dòng → tuần của dòng (Hành trình tô cột tuần đó); rời → null. */
  onRe?: (tuan: string | null) => void;
}) {
  const duong = `/students/${studentId}/bai-tren-lop`;
  const { data, error, reload } = useApi<DsBai>(duong, [studentId]);
  const [du, setDu] = useState(false);
  const [mo, setMo] = useState<Bai | 'moi' | null>(null);
  const [vua, setVua] = useState<VuaLuu | null>(null);
  const [loiHoanTac, setLoiHoanTac] = useState<string | null>(null);
  useEffect(() => { if (!vua) return undefined; const h = setTimeout(() => setVua(null), HOAN_TAC_MS); return () => clearTimeout(h); }, [vua]);
  const kn = chon === OVERALL ? null : kyNangBai(chon);
  const ds: Dong[] = [
    ...(data?.bai ?? []).map((b) => ({ loai: 'bai' as const, ...b })),
    ...(data?.gopY ?? []).map((g) => ({ loai: 'gy' as const, ...g })),
  ].filter((d) => !kn || d.skill === kn).sort((a, b) => b.tuan.localeCompare(a.tuan) || (a.loai === b.loai ? b.id - a.id : a.loai === 'bai' ? -1 : 1));
  const hien = du || ds.length <= TOI_DA + 1 ? ds : ds.slice(0, TOI_DA);
  const ghiDuoc = (data?.lop ?? []).some((l) => l.kyNang.length && (!kn || l.kyNang.includes(kn)));
  const taiLai = () => { invalidate(duong); reload(); };
  const xong = (x: VuaLuu) => { setMo(null); setLoiHoanTac(null); setVua(x); taiLai(); };
  const hoanTac = async () => {
    if (!vua) return;
    try { await vua.hoanTac(); setVua(null); setLoiHoanTac(null); taiLai(); } catch (e: any) { setLoiHoanTac(e?.message ?? t('Chưa hoàn tác được')); }
  };
  const baoXong = (
    <p className="m-0 flex flex-wrap items-center gap-x-2.5 text-[13px] font-semibold text-ok" role="status">
      ✓ {vua?.chu}
      <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]" onClick={() => void hoanTac()}>{t('Hoàn tác')}</button>
      {loiHoanTac && <span className="font-normal text-bad" role="alert">{loiHoanTac}</span>}
    </p>
  );
  return (
    <section className="card flex min-w-0 flex-col" aria-label={t('Tiến độ trên lớp')}>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h2 className="m-0 text-[15px] font-bold text-slate-100">{t('Tiến độ trên lớp')}</h2>
        <NutLuat label={t('Tiến độ trên lớp là gì')}>{t('GV ghi tuỳ ý: nhận xét, có thể kèm điểm bài hoặc band · không vào MT, Overall, KPI · góp ý tuần cũ chỉ đọc.')}</NutLuat>
        {ghiDuoc && mo !== 'moi' && <button type="button" className="btn btn-sm ml-auto max-sm:min-h-[44px]" onClick={() => setMo('moi')}>{t('+ Ghi tiến độ')}</button>}
      </div>
      <div className="flex flex-col gap-2 px-4 py-3">
        {mo === 'moi' && data && <FormTienDo duong={duong} bai={null} lop={data.lop} lopNay={lopNay} knDau={kn} ct={ct} homNay={homNay} onHuy={() => setMo(null)} onXong={xong} />}
        {vua && vua.id === null && baoXong}
        {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
          : !data ? <Skeleton rows={3} />
          : !ds.length ? (mo !== 'moi' && <p className="m-0 py-2 text-[14px] text-slate-400">{t('Chưa có ghi nhận nào.')}</p>)
          : (
            <ul className="m-0 flex list-none flex-col p-0">
              {hien.map((d) => {
                if (d.loai === 'bai' && mo !== 'moi' && mo?.id === d.id) {
                  return <li key={`b${d.id}`} className="py-2"><FormTienDo duong={duong} bai={d} lop={data.lop} lopNay={lopNay} knDau={kn} ct={ct} homNay={homNay} onHuy={() => setMo(null)} onXong={xong} /></li>;
                }
                const laVua = d.loai === 'bai' && vua?.id === d.id;
                const sua = d.loai === 'bai' && d.sua && !mo;
                const ai = d.loai === 'bai' ? d.suaBoi ?? d.ghiBoi : d.ghiBoi;
                return (
                  <li key={`${d.loai}${d.id}`} onMouseEnter={() => onRe?.(d.tuan)} onMouseLeave={() => onRe?.(null)}
                    className={`grid gap-1 border-b py-2.5 text-[14px] last:border-b-0 ${laVua ? 'my-0.5 rounded-[10px] border px-2.5' : ''}`}
                    style={laVua ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent)' } : { borderColor: 'var(--line)' }}>
                    {/* Dòng sửa được: cả dòng là MỘT nút (Tab + Enter), chữ nhận xét vẫn chọn / dịch được ở dòng 2. */}
                    <div className="flex items-baseline gap-2 text-[13px]">
                      {sua ? (
                        <button type="button" className="flex min-w-0 flex-1 appearance-none items-baseline gap-2 border-0 bg-transparent p-0 text-left text-[13px] text-slate-100 hover:underline max-sm:-my-3.5 max-sm:py-3.5"
                          title={t('Sửa / xoá')} onClick={() => setMo(d as Bai)} onFocus={() => onRe?.(d.tuan)} onBlur={() => onRe?.(null)}>
                          <DauDong d={d} kn={kn} ct={ct} lopNay={lopNay} ai={ai} />
                        </button>
                      ) : <span className="flex min-w-0 flex-1 items-baseline gap-2"><DauDong d={d} kn={kn} ct={ct} lopNay={lopNay} ai={ai} /></span>}
                    </div>
                    <div className="min-w-0 break-words text-slate-200">
                      {d.loai === 'gy' ? (
                        <>
                          <span className="mr-1.5 inline-flex h-5 items-center gap-1 whitespace-nowrap rounded border px-1.5 align-[1px] text-[12px] font-semibold text-slate-400" style={{ borderColor: 'var(--line-strong)' }}
                            aria-label={t('Góp ý tuần (chỉ đọc)')}><KhoaNho />{t('Góp ý tuần')}</span>
                          <ChuDich chu={d.noiDung} nguon={{ bang: 'gop_y_tuan', id: d.id, cot: 'noi_dung' }} />
                        </>
                      ) : (
                        <>
                          <KetQuaBai b={d} />
                          {d.nhanXet && <ChuDich chu={d.nhanXet} nguon={{ bang: 'bai_tren_lop', id: d.id, cot: 'nhan_xet' }} />}
                        </>
                      )}
                    </div>
                    {laVua && baoXong}
                  </li>
                );
              })}
            </ul>
          )}
        {ds.length > TOI_DA + 1 && (
          <button type="button" className="link self-start appearance-none border-0 bg-transparent p-0 text-[13px] max-sm:min-h-[44px]" aria-expanded={du} onClick={() => setDu(!du)}>
            {du ? t('Thu gọn ▴') : t('Xem thêm {n} dòng ▾', { n: ds.length - TOI_DA })}
          </button>
        )}
      </div>
    </section>
  );
}

function DauDong({ d, kn, ct, lopNay, ai }: { d: Dong; kn: string | null; ct: string | null; lopNay: number | null; ai: string | null }) {
  return (
    <>
      <span className="whitespace-nowrap font-semibold tabular-nums">{d.tuanMa}</span>
      {!kn && <span className="font-bold text-slate-400">{tenMonNgan(ct, d.skill)}</span>}
      <span className="ml-auto min-w-0 truncate text-right text-slate-400">
        {ai ?? '—'}{d.classId !== lopNay && <> · <span className="font-semibold text-soon">{d.lop}</span></>}
      </span>
    </>
  );
}

/** "Part 2 · 6/10" · "Band 6.0" · chỉ tên bài — chip nhấn nhạt; không có gì thì không vẽ. */
function KetQuaBai({ b }: { b: Bai }) {
  const kq = b.diem != null && b.thang != null ? <span className="tabular-nums">{so(b.diem)}/{so(b.thang)}</span>
    : b.band != null ? <>Band <span className="tabular-nums">{fmtBand(b.band)}</span></> : null;
  if (!kq && !b.tenBai) return null;
  return (
    <span className="mr-1.5 inline-block rounded-md bg-[color:var(--accent-soft)] px-[7px] font-bold text-slate-100">
      {b.tenBai}{b.tenBai && kq ? ' · ' : ''}{kq}
    </span>
  );
}

type Kieu = 'khong' | 'diem' | 'band';
const nutChon = (chon: boolean) => `btn btn-sm min-w-[44px] max-sm:min-h-[44px] ${chon ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : ''}`;

/**
 * FORM GHI / SỬA TIẾN ĐỘ TẠI CHỖ (mockup M5 ① ② ③): Kỹ năng * · Tuần * (`ONgay`) · Kết quả tuỳ chọn Không có | Điểm (x / y) | Band · Tên bài tuỳ chọn · Nhận xét.
 * Nhận xét KHÔNG bắt buộc (chủ SP 27/10) — cần ít nhất một trong nhận xét / x/y / band: chọn "Không có" thì Nhận xét thành bắt buộc. Lỗi lưu: ở lại, giữ
 * chữ, nút thành "Thử lại". Enter (ô một dòng) / Ctrl + Enter (nhận xét) = Lưu, Esc = Huỷ.
 */
function FormTienDo({ duong, bai, lop, lopNay, knDau, ct, homNay, onHuy, onXong }: {
  duong: string; bai: Bai | null; lop: DsBai['lop']; lopNay: number | null; knDau: string | null; ct: string | null; homNay: string;
  onHuy: () => void; onXong: (x: VuaLuu) => void;
}) {
  const lf = useLoiForm();
  const lopGhi = lop.filter((l) => l.kyNang.length);
  const lopDau = bai ? lop.find((l) => l.classId === bai.classId) : lopGhi.find((l) => l.classId === lopNay && (!knDau || l.kyNang.includes(knDau))) ?? lopGhi.find((l) => !knDau || l.kyNang.includes(knDau)) ?? lopGhi[0];
  const classId = lopDau?.classId ?? null;
  const kyNang = lopDau?.kyNang ?? [];
  const [skill, setSkill] = useState(bai?.skill ?? (knDau && kyNang.includes(knDau) ? knDau : kyNang[0] ?? ''));
  const [kieu, setKieu] = useState<Kieu>(bai?.diem != null ? 'diem' : bai?.band != null ? 'band' : 'khong');
  const [tenBai, setTenBai] = useState(bai?.tenBai ?? '');
  const [diem, setDiem] = useState(bai?.diem != null ? so(bai.diem) : '');
  const [thang, setThang] = useState(bai?.thang != null ? so(bai.thang) : '10');
  const [band, setBand] = useState(bai?.band != null ? fmtBand(bai.band) : '');
  const [tuan, setTuan] = useState(bai?.tuan ?? mondayOfDate(homNay));
  const [nhanXet, setNhanXet] = useState(bai?.nhanXet ?? '');
  const [busy, setBusy] = useState(false);
  const dang = useRef(false);   // V12 ⑨: chống bấm đôi
  const [loi, setLoi] = useState<string | null>(null);
  const soDiem = Number(diem.replace(',', '.')), soThang = Number(thang.replace(',', '.')), soBand = Number(band.replace(',', '.').replace(/^b/i, ''));
  const loiBand = kieu === 'band' ? (!band.trim() ? t('Chưa nhập') : kiemBand(soBand)) : null;
  const loiO = [
    ...(!skill ? [{ khoa: 'kn', nhan: t('Kỹ năng'), lyDo: t('Chưa chọn') }] : []),
    ...(!tuan ? [{ khoa: 'tuan', nhan: t('Tuần'), lyDo: t('Chưa chọn') }] : []),
    ...(kieu === 'diem' && (!thang.trim() || !Number.isFinite(soThang) || soThang <= 0 || soThang > BAI_LOP_THANG_TOI_DA)
      ? [{ khoa: 'thang', nhan: t('Thang'), lyDo: t('Lớn hơn 0, không quá {n}', { n: BAI_LOP_THANG_TOI_DA }) }] : []),
    ...(kieu === 'diem' && (!diem.trim() || !Number.isFinite(soDiem) || soDiem < 0 || (Number.isFinite(soThang) && soDiem > soThang))
      ? [{ khoa: 'diem', nhan: t('Điểm'), lyDo: t('Từ 0 tới thang') }] : []),
    ...(loiBand ? [{ khoa: 'band', nhan: 'Band', lyDo: loiBand }] : []),
    ...(kieu === 'khong' && !nhanXet.trim() ? [{ khoa: 'nx', nhan: t('Nhận xét'), lyDo: t('Nhập nhận xét — hoặc chọn kết quả Điểm / Band') }] : []),
  ];
  const than: Than = {
    skill, tuan, tenBai: tenBai.trim() || null, nhanXet: nhanXet.trim() || null,
    diem: kieu === 'diem' ? soDiem : null, thang: kieu === 'diem' ? soThang : null, band: kieu === 'band' ? soBand : null,
  };
  /* Esc chỉ đóng khi chưa gõ gì — không mất chữ vì một phím. Nút trái theo luật S3: chưa sửa "Đóng", đã sửa "Huỷ thay đổi". */
  const goc = useRef(JSON.stringify(than));
  const daSua = JSON.stringify(than) !== goc.current;
  const gui = async (xoa = false) => {
    if (dang.current) return;
    if (!xoa) {
      lf.bam();
      if (loiO.length) { document.getElementById(lf.oId(loiO[0].khoa))?.focus(); return; }
    }
    dang.current = true; setBusy(true); setLoi(null);
    try {
      if (xoa && bai) {
        await api.del(`/bai-tren-lop/${bai.id}`);
        const cu = thanCua(bai);
        onXong({ id: null, chu: t('Đã xoá {tuan}', { tuan: bai.tuanMa }), hoanTac: () => api.post(duong, { classId: bai.classId, ...cu }) });
      } else if (bai) {
        await api.put(`/bai-tren-lop/${bai.id}`, than);
        const cu = thanCua(bai);
        onXong({ id: bai.id, chu: t('Đã lưu'), hoanTac: () => api.put(`/bai-tren-lop/${bai.id}`, cu) });
      } else {
        const r = await api.post<{ id: number }>(duong, { classId, ...than });
        onXong({ id: r.id, chu: t('Đã lưu'), hoanTac: () => api.del(`/bai-tren-lop/${r.id}`) });
      }
    } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { dang.current = false; setBusy(false); }
  };
  const phim = (e: KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Escape' && !busy && !daSua) { e.preventDefault(); onHuy(); return; }
    if (e.key !== 'Enter') return;
    const el = e.target as HTMLElement;
    if (el.tagName === 'TEXTAREA' ? e.ctrlKey || e.metaKey : el.tagName === 'INPUT') { e.preventDefault(); void gui(); }
  };
  const lopCode = lopDau?.code ?? null;
  return (
    <div role="group" aria-label={bai ? t('Sửa tiến độ') : t('Ghi tiến độ')} onKeyDown={phim}
      className="grid gap-3 rounded-[10px] border p-3" style={{ borderColor: 'var(--accent)', background: 'var(--surface)' }}>
      <h3 className="m-0 text-[14px] font-bold text-slate-100">
        {bai ? t('Sửa tiến độ') : t('Ghi tiến độ')}{lopCode && lopDau?.classId !== lopNay && <span className="font-semibold text-soon"> · {lopCode}</span>}
      </h3>
      {!classId ? <p className="m-0 text-[13px] text-slate-400">{t('Bạn không ghi được tiến độ trên lớp của học viên này.')}</p> : <>
        <div className="flex flex-wrap items-start gap-3">
          <Truong nhan={t('Kỹ năng')} batBuoc as="div" loi={lf.loiCua(loiO, 'kn')}>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('Kỹ năng')} id={lf.oId('kn')}>
              {kyNang.map((k) => <button key={k} type="button" role="radio" aria-checked={skill === k} disabled={busy} onClick={() => setSkill(k)} className={nutChon(skill === k)}>{tenMonNgan(ct, k)}</button>)}
            </div>
          </Truong>
          <div className="min-w-[180px] flex-1">
            <Truong nhan={t('Tuần')} batBuoc loi={lf.loiCua(loiO, 'tuan')}>
              <ONgay kieu="tuan" value={tuan} onChange={setTuan} toiDa={homNay} id={lf.oId('tuan')} onBlur={lf.roi('tuan')} invalid={!!lf.loiCua(loiO, 'tuan')} />
            </Truong>
          </div>
        </div>
        <Truong nhan={t('Kết quả')} tuyChon as="div">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('Kiểu kết quả')}>
            {([['khong', t('Không có')], ['diem', t('Điểm')], ['band', 'Band']] as const).map(([k, chu]) => (
              <button key={k} type="button" role="radio" aria-checked={kieu === k} disabled={busy} onClick={() => setKieu(k)} className={nutChon(kieu === k)}>{chu}</button>
            ))}
          </div>
        </Truong>
        {kieu === 'diem' && (
          <div className="flex items-start gap-2">
            <Truong nhan={t('Điểm')} loi={lf.loiCua(loiO, 'diem')}>
              <input className="field w-20 text-center tabular-nums" inputMode="decimal" value={diem} disabled={busy} onChange={(e) => setDiem(e.target.value)} {...lf.o(loiO, 'diem')} />
            </Truong>
            <span aria-hidden className="pt-8 text-slate-400">/</span>
            <Truong nhan={t('Thang')} loi={lf.loiCua(loiO, 'thang')}>
              <input className="field w-20 text-center tabular-nums" inputMode="decimal" value={thang} disabled={busy} onChange={(e) => setThang(e.target.value)} {...lf.o(loiO, 'thang')} />
            </Truong>
          </div>
        )}
        {kieu === 'band' && (
          <Truong nhan="Band" loi={lf.loiCua(loiO, 'band')}>
            <input className="field w-24 text-center tabular-nums" inputMode="decimal" placeholder="5.5" value={band} disabled={busy} onChange={(e) => setBand(e.target.value)} {...lf.o(loiO, 'band')} />
          </Truong>
        )}
        <Truong nhan={t('Tên bài')} tuyChon>
          <input className="field w-full" maxLength={BAI_LOP_TEN_TOI_DA} value={tenBai} disabled={busy} onChange={(e) => setTenBai(e.target.value)} placeholder={t('Ví dụ: Part 3 so sánh')} />
        </Truong>
        <Truong nhan={t('Nhận xét')} loi={lf.loiCua(loiO, 'nx')}>
          <textarea className="field w-full" rows={2} maxLength={BAI_LOP_NHAN_XET_TOI_DA} value={nhanXet} disabled={busy} onChange={(e) => setNhanXet(e.target.value)} {...lf.o(loiO, 'nx')} />
        </Truong>
        {loi && <p className="m-0 text-[13px] font-semibold text-bad" role="alert">⚠ {loi} {t('— chữ vẫn còn.')}</p>}
        <div className="flex flex-wrap items-center gap-2">
          {bai && <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void gui(true)}>{t('Xoá')}</button>}
          <span className="flex-1" />
          <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={onHuy}>{daSua ? t('Huỷ thay đổi') : t('Đóng')}</button>
          <button type="button" className="btn btn-primary min-h-[44px] max-sm:flex-1 sm:min-h-0" aria-busy={busy} onClick={() => void gui()}>
            {busy ? t('Đang lưu…') : loi ? t('Thử lại') : t('Lưu')}
          </button>
        </div>
      </>}
    </div>
  );
}
