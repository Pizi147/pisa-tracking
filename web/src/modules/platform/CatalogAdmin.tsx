import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Field, Forbidden, Info, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { MT_TOI_DA, THU_TU_KY_HIEU, dsLoi, kyHieuLop, oPhanCong, skillShort, type KyHieuLop, type LoiTruong } from '@shared/domain/index.ts';

type RouteRow = { code: string; name: string; note: string | null; seq: number; status: string; inUse: number; lichMt: number[]; lopDangChay: number };
type Programme = {
  code: string; name: string; weeks: number | null; scoringMode: string; status: string;
  skills: string[]; checkpoints: { kind: string; studyWeek: number }[]; nguongDat: number | null; lopDangChay: number;
};
/** Một dòng của bảng: chương trình lớp thường, hoặc FT theo từng lộ trình (mockup §6). */
type Dong = { loai: 'ct'; ct: Programme } | { loai: 'ft'; lt: RouteRow };

const moc = (p: Programme, kind: 'progress' | 'final') => p.checkpoints.find((c) => c.kind === kind)?.studyWeek ?? null;
const thuTu = (p: Programme) => {
  const i = THU_TU_KY_HIEU.indexOf(kyHieuLop(p.code, null) as KyHieuLop);
  return i < 0 ? 99 : i;
};
/** MH9: bộ môn của CHÍNH chương trình đó (FOU: L · R · G+V · P; Pre FOU: Tổng hợp) — không gộp mọi môn. */
function boMon(p: Programme) {
  const mon = oPhanCong(p.code, p.skills).filter((o) => !o.laGvcn).map((o) => o.nhan);
  return (mon.length ? mon : p.skills.map(skillShort)).join(' · ');
}
const tenDong = (d: Dong) => (d.loai === 'ft' ? `FT · ${d.lt.code}` : `${kyHieuLop(d.ct.code, null) ?? d.ct.code} · ${d.ct.name}`);
const khoaDong = (d: Dong) => (d.loai === 'ft' ? `ft:${d.lt.code}` : d.ct.code);
const conDung = (d: Dong) => (d.loai === 'ft' ? d.lt.status : d.ct.status) === 'active';
const soLop = (d: Dong) => (d.loai === 'ft' ? d.lt.lopDangChay : d.ct.lopDangChay);
/** Độ dài: FT = tuần MT cuối của lộ trình (FT không có số tuần cố định). */
const doDai = (d: Dong) => (d.loai === 'ft' ? d.lt.lichMt.at(-1) ?? null : d.ct.weeks);
/** "Progress tuần 5 · Final tuần 10" / "MT1 tuần 6 · MT2 tuần 12 · MT3 tuần 16"; `ngan` cho thẻ điện thoại: "Progress t5 · Final t10" / "MT t6 · t12 · t16". */
function chuMoc(d: Dong, ngan = false): string {
  const t = ngan ? 't' : 'tuần ';
  if (d.loai === 'ft') return ngan ? `MT ${d.lt.lichMt.map((w) => `t${w}`).join(' · ')}` : d.lt.lichMt.map((w, i) => `MT${i + 1} tuần ${w}`).join(' · ');
  const p = moc(d.ct, 'progress'); const f = moc(d.ct, 'final');
  return [p !== null ? `Progress ${t}${p}` : null, f !== null ? `Final ${t}${f}` : null].filter(Boolean).join(' · ') || '—';
}

/**
 * QUẢN TRỊ › CHƯƠNG TRÌNH (OV-6b1, mockup overhaul-3 §6) — mục 7.3, K1-46…K1-50.
 *
 * Một bảng: chương trình lớp thường + Fast Track theo từng lộ trình (LT1, LT2, RF). Sửa trong panel: tên, "Đạt từ" (đúng/tổng),
 * số tuần và mốc Test (lớp thường: Progress / Final; FT: tuần học của từng MT). Lưu xong chỉ áp cho LỚP MỞ SAU — lớp đang chạy
 * giữ bản chụp lúc tạo, nên lịch của lớp đó không đổi. Môn và cách chấm chỉ đọc: đổi là đổi ý nghĩa của điểm đã nhập.
 *
 * Không thêm mã mới (K1-48) và không xoá — mã đang có lớp dùng thì NGỪNG DÙNG (biến khỏi ô chọn, lớp cũ vẫn đọc được).
 */
export function CatalogAdmin() {
  const routes = useApi<RouteRow[]>('/admin/routes');
  const programmes = useApi<Programme[]>('/admin/programmes');
  const [sua, setSua] = useState<Dong | null>(null);

  /* Không có quyền thì nói thẳng, đừng để một khối trống — xem chú thích ở `AccountsAdmin`. */
  if (routes.error || programmes.error) {
    return (
      <Forbidden
        message="Phần này chỉ dành cho Quản trị hệ thống."
        hint="Chương trình là cấu hình chung của cả trung tâm, nên chỉ Quản trị sửa được."
      />
    );
  }
  const dong: Dong[] = [
    ...[...(programmes.data ?? [])].filter((p) => p.code !== 'FT').sort((a, b) => thuTu(a) - thuTu(b)).map((ct) => ({ loai: 'ct' as const, ct })),
    ...(routes.data ?? []).map((lt) => ({ loai: 'ft' as const, lt })),
  ];
  const dangSua = sua ? khoaDong(sua) : null;
  const ngung = (d: Dong) => !conDung(d) && <span className="ml-1.5"><Info pending>ngừng dùng</Info></span>;

  return (
    <>
      <Card className="min-w-0" bodyClass="p-0">
        {routes.loading || programmes.loading ? <div className="p-4"><Skeleton rows={6} /></div> : (
          <>
            <div className="table-scroll bang-dinh max-sm:hidden"><table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">Chương trình</th><th className="th">Cách chấm</th><th className="th text-right">Độ dài</th>
                  <th className="th">Mốc Test</th><th className="th text-right">Lớp đang chạy</th><th className="th" />
                </tr>
              </thead>
              <tbody>
                {dong.map((d) => (
                  <tr key={khoaDong(d)} onClick={() => setSua(d)}
                    className={`row-hover cursor-pointer ${dangSua === khoaDong(d) ? 'row-active' : ''} ${conDung(d) ? '' : 'opacity-50'}`}>
                    <td className="td whitespace-nowrap text-slate-100">{tenDong(d)}{ngung(d)}</td>
                    <td className="td whitespace-nowrap text-slate-400">{d.loai === 'ft' || d.ct.scoringMode !== 'ratio' ? 'band IELTS' : 'đúng / tổng'}</td>
                    <td className="td whitespace-nowrap text-right tabular-nums text-slate-300">{doDai(d) !== null ? `${doDai(d)} tuần` : '—'}</td>
                    <td className="td whitespace-nowrap tabular-nums text-slate-300">{chuMoc(d)}</td>
                    <td className="td text-right tabular-nums text-slate-300">{soLop(d)}</td>
                    <td className="td text-right">
                      <button type="button" className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setSua(d); }}>Sửa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            {/* Điện thoại: mỗi chương trình một dòng bấm được — tên + một dòng độ dài · mốc. */}
            <ul className="sm:hidden m-0 list-none p-0">
              {dong.map((d) => (
                <li key={khoaDong(d)} className="border-b last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                  <button type="button" onClick={() => setSua(d)}
                    className={`flex min-h-[44px] w-full items-center gap-2 px-4 py-2.5 text-left ${conDung(d) ? '' : 'opacity-50'}`}>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-slate-100">{tenDong(d)}{ngung(d)}</span>
                      <span className="block text-xs tabular-nums text-slate-400">
                        {doDai(d) !== null ? `${doDai(d)} tuần · ` : ''}{chuMoc(d, true)}
                      </span>
                    </span>
                    <span aria-hidden className="text-slate-500">›</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
      {sua && (
        <SuaChuongTrinh key={khoaDong(sua)} dong={sua} onClose={() => setSua(null)}
          onDone={() => {
            setSua(null);
            if (sua.loai === 'ft') { routes.reload(); invalidate('/ref/routes'); } else { programmes.reload(); invalidate('/ref/programmes'); }
          }} />
      )}
    </>
  );
}

const NHAN_O: Record<string, string> = { ten: 'Tên', 'so-tuan': 'Độ dài', moc: 'Mốc Test', nguong: 'Đạt từ' };
const soNguyen = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v) : NaN);

/**
 * PANEL SỬA một dòng (mockup §6): Tên · Môn (chỉ đọc) · Cách chấm (chỉ đọc) · Đạt từ (chỉ đúng/tổng) · Độ dài · Mốc Test · Còn dùng.
 * Lỗi ở đúng ô — kiểm trước dưới ô, máy chủ kiểm lại và trả `details.o` (ô bị lỗi); chữ đã gõ giữ nguyên.
 */
function SuaChuongTrinh({ dong: d, onClose, onDone }: { dong: Dong; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const ft = d.loai === 'ft';
  const ct = d.loai === 'ct' ? d.ct : null;
  const thuong = ct?.scoringMode === 'ratio';
  const coGiuaKhoa = !!ct && moc(ct, 'progress') !== null;
  const [f, setF] = useState(() => ({
    ten: d.loai === 'ft' ? d.lt.name : d.ct.name,
    nguong: ct?.nguongDat != null ? String(ct.nguongDat) : '',
    soTuan: ct?.weeks ? String(ct.weeks) : '',
    progress: ct ? String(moc(ct, 'progress') ?? '') : '',
    final: ct ? String(moc(ct, 'final') ?? '') : '',
    mt: d.loai === 'ft' ? d.lt.lichMt.map(String) : [],
    conDung: conDung(d),
  }));
  const [goc] = useState(() => JSON.stringify(f));   // luật I1: đã sửa → "Huỷ thay đổi"
  const [busy, setBusy] = useState(false);
  const [loiMay, setLoiMay] = useState<LoiTruong | null>(null);
  const lf = useLoiForm();
  const doi = (patch: Partial<typeof f>) => { setLoiMay(null); setF({ ...f, ...patch }); };

  /* Kiểm sớm dưới ô — cùng luật máy chủ (`sysconfig.ts`). */
  const loi: LoiTruong[] = [...dsLoi([{ khoa: 'ten', nhan: 'Tên', toiThieu: 1 }], { ten: f.ten })];
  const soTuan = soNguyen(f.soTuan);
  if (thuong) {
    const ng = Number(f.nguong.replace(',', '.'));
    if (f.nguong.trim() === '' || !Number.isFinite(ng) || ng < 1 || ng > 100) loi.push({ khoa: 'nguong', nhan: 'Đạt từ', lyDo: 'Từ 1 đến 100 %' });
  }
  if (ft) {
    const ds = f.mt.map(soNguyen);
    if (ds.some((w) => !Number.isInteger(w) || w < 1 || w > 104)) loi.push({ khoa: 'moc', nhan: 'Mốc Test', lyDo: 'Tuần học từ 1 đến 104' });
    else if (ds.some((w, i) => i > 0 && w <= ds[i - 1])) loi.push({ khoa: 'moc', nhan: 'Mốc Test', lyDo: 'MT sau phải ở tuần sau MT trước' });
  } else if (ct?.weeks) {
    const p = soNguyen(f.progress); const fi = soNguyen(f.final);
    if (!Number.isInteger(soTuan) || soTuan < 1 || soTuan > 104) loi.push({ khoa: 'so-tuan', nhan: 'Độ dài', lyDo: 'Từ 1 đến 104 tuần' });
    else if ((coGiuaKhoa && !(p >= 1 && p <= soTuan)) || !(fi >= 1 && fi <= soTuan)) loi.push({ khoa: 'moc', nhan: 'Mốc Test', lyDo: `Tuần từ 1 đến ${soTuan}` });
    else if (coGiuaKhoa && p >= fi) loi.push({ khoa: 'moc', nhan: 'Mốc Test', lyDo: 'Progress phải trước Final' });
  }
  if (loiMay) loi.push(loiMay);

  const luu = async () => {
    lf.bam();
    if (loi.length > 0 || busy) return;
    setBusy(true);
    try {
      if (d.loai === 'ft') {
        await api.put('/admin/routes', {
          code: d.lt.code, name: f.ten, note: d.lt.note, status: f.conDung ? 'active' : 'inactive', lichMt: f.mt.map(Number),
        });
      } else {
        await api.put('/admin/programmes', {
          code: d.ct.code, name: f.ten, status: f.conDung ? 'active' : 'inactive',
          weeks: d.ct.weeks ? soTuan : null, progressWeek: coGiuaKhoa ? Number(f.progress) : null, finalWeek: d.ct.weeks ? Number(f.final) : null,
          ...(thuong ? { nguongDat: Number(f.nguong.replace(',', '.')) } : {}),
        });
      }
      toast.push('ok', `Đã lưu ${tenDong(d)} — áp cho lớp mở sau`);
      onDone();
    } catch (e) {
      const o = e instanceof ApiError ? (e.details?.o as string | undefined) : undefined;
      if (o && NHAN_O[o]) { lf.bam(); setLoiMay({ khoa: o, nhan: NHAN_O[o], lyDo: (e as Error).message }); }
      else toast.push('error', (e as Error).message);
    } finally { setBusy(false); }
  };

  const n = soLop(d);
  const oSo = 'field w-20 tabular-nums';
  return (
    <KhungPanel tieuDe={tenDong(d)} onDong={onClose}
      ngCanh={<span className="text-xs text-slate-400">Áp cho lớp mở sau khi lưu · <span className="tabular-nums">{n}</span> lớp đang chạy giữ lịch cũ</span>}
      chan={{
        daSua: JSON.stringify(f) !== goc, huy: { onClick: onClose, disabled: busy },
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>,
      }}>
      <div className="space-y-4 pt-3">
        <Field label="Tên" required loi={lf.loiCua(loi, 'ten')}>
          <input className="field w-full" maxLength={200} {...lf.o(loi, 'ten')} value={f.ten} onChange={(e) => doi({ ten: e.target.value })} />
        </Field>
        <dl className="m-0 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-slate-400">Môn</dt><dd className="m-0 text-slate-200">{ct ? boMon(ct) : 'L · R · W · S'}</dd>
          <dt className="text-slate-400">Cách chấm</dt><dd className="m-0 text-slate-200">{thuong ? 'Đúng / tổng' : 'Band IELTS'}</dd>
        </dl>

        {thuong && (
          <Field label="Đạt từ" loi={lf.loiCua(loi, 'nguong')}>
            <span className="flex items-center gap-2">
              <input inputMode="decimal" className={oSo} {...lf.o(loi, 'nguong')} value={f.nguong} onChange={(e) => doi({ nguong: e.target.value })} />
              <span className="text-slate-400">%</span>
            </span>
          </Field>
        )}

        {ct?.weeks ? (
          <Field label="Độ dài" loi={lf.loiCua(loi, 'so-tuan')}>
            <span className="flex items-center gap-2">
              <input inputMode="numeric" className={oSo} {...lf.o(loi, 'so-tuan')} value={f.soTuan}
                /* Final đang = số tuần thì đi theo số tuần mới (10 → 12 thì Final cũng 12). */
                onChange={(e) => doi({ soTuan: e.target.value, final: f.final === f.soTuan ? e.target.value : f.final })} />
              <span className="text-slate-400">tuần</span>
            </span>
          </Field>
        ) : ft && f.mt.length > 0 && (
          <p className="m-0 text-sm text-slate-400">Độ dài <span className="tabular-nums text-slate-200">{f.mt.at(-1) || '—'} tuần</span> · tới MT cuối</p>
        )}

        {(ft || ct?.weeks) && (
          <Field as="div" label="Mốc Test" loi={lf.loiCua(loi, 'moc')}>
            {ft ? (
              <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {f.mt.map((w, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className="text-slate-400">MT{i + 1} tuần</span>
                    <input inputMode="numeric" aria-label={`Tuần học của MT${i + 1}`} className="field w-16 tabular-nums" {...(i === 0 ? lf.o(loi, 'moc') : {})}
                      aria-invalid={!!lf.loiCua(loi, 'moc')} value={w} onChange={(e) => doi({ mt: f.mt.map((x, k) => (k === i ? e.target.value : x)) })} />
                  </span>
                ))}
                <span className="flex items-center gap-1">
                  {f.mt.length < MT_TOI_DA && (
                    <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0"
                      onClick={() => doi({ mt: [...f.mt, String((Number(f.mt.at(-1)) || 0) + 4)] })}>+ MT</button>
                  )}
                  {f.mt.length > 1 && (
                    <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" aria-label={`Bỏ MT${f.mt.length}`}
                      onClick={() => doi({ mt: f.mt.slice(0, -1) })}>Bỏ MT{f.mt.length}</button>
                  )}
                </span>
              </span>
            ) : (
              <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {coGiuaKhoa && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-slate-400">Progress tuần</span>
                    <input inputMode="numeric" aria-label="Tuần Progress Test" className="field w-16 tabular-nums" {...lf.o(loi, 'moc')}
                      value={f.progress} onChange={(e) => doi({ progress: e.target.value })} />
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400">Final tuần</span>
                  <input inputMode="numeric" aria-label="Tuần Final Test" className="field w-16 tabular-nums" {...(coGiuaKhoa ? {} : lf.o(loi, 'moc'))}
                    aria-invalid={!!lf.loiCua(loi, 'moc')} value={f.final} onChange={(e) => doi({ final: e.target.value })} />
                </span>
              </span>
            )}
          </Field>
        )}

        <label className="flex min-h-[44px] items-center gap-2 text-sm text-slate-200 sm:min-h-0">
          <input type="checkbox" checked={f.conDung} onChange={(e) => doi({ conDung: e.target.checked })} />
          Còn dùng — bỏ dấu thì không chọn được khi tạo lớp mới; lớp cũ giữ nguyên
        </label>
      </div>
    </KhungPanel>
  );
}
