import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Field, Forbidden, Info, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { MON_CHON, MON_GOP, MT_TOI_DA, dsLoi, kyHieuLop, oPhanCong, skillShort, thuTuKyHieu, type LoiTruong } from '@shared/domain/index.ts';
import { PhanDoan } from '../classes/ClassCreatePanel.tsx';

type RouteRow = { code: string; name: string; note: string | null; seq: number; status: string; inUse: number; lichMt: number[]; lopDangChay: number };
type Programme = {
  code: string; name: string; weeks: number | null; scoringMode: string; status: string;
  skills: string[]; checkpoints: { kind: string; studyWeek: number }[]; nguongDat: number | null; lopDangChay: number;
  /** OV-6b2: liên tục — Checkpoint mỗi n tuần · `goc` = chương trình có sẵn (môn, cách chấm khoá) · `coLop` = đã có lớp (môn khoá). */
  lapMoiTuan: number | null; goc: boolean; coLop: boolean;
};
/** Một dòng của bảng: chương trình lớp thường, hoặc FT theo từng lộ trình (mockup §6); `moi` = panel "+ Chương trình" (OV-6b2). */
type Dong = { loai: 'ct'; ct: Programme } | { loai: 'ft'; lt: RouteRow } | { loai: 'moi' };

const moc = (p: Programme, kind: 'progress' | 'final') => p.checkpoints.find((c) => c.kind === kind)?.studyWeek ?? null;
const thuTu = (p: Programme) => thuTuKyHieu(kyHieuLop(p.code, null));
/** MH9: bộ môn của CHÍNH chương trình đó (FOU: L · R · G+V · P; Pre FOU: Tổng hợp) — không gộp mọi môn. */
function boMon(p: Programme) {
  const mon = oPhanCong(p.code, p.skills).filter((o) => !o.laGvcn).map((o) => o.nhan);
  return (mon.length ? mon : p.skills.map(skillShort)).join(' · ');
}
type DongCo = Exclude<Dong, { loai: 'moi' }>;
const tenDong = (d: Dong) => (d.loai === 'moi' ? 'Chương trình mới' : d.loai === 'ft' ? `FT · ${d.lt.code}` : `${kyHieuLop(d.ct.code, null) ?? d.ct.code} · ${d.ct.name}`);
const khoaDong = (d: Dong) => (d.loai === 'moi' ? '+moi' : d.loai === 'ft' ? `ft:${d.lt.code}` : d.ct.code);
const conDung = (d: DongCo) => (d.loai === 'ft' ? d.lt.status : d.ct.status) === 'active';
const soLop = (d: Dong) => (d.loai === 'moi' ? 0 : d.loai === 'ft' ? d.lt.lopDangChay : d.ct.lopDangChay);
/** Độ dài: FT = tuần MT cuối của lộ trình (FT không có số tuần cố định); OV-6b2: "liên tục". */
const doDai = (d: DongCo): string => {
  if (d.loai === 'ct' && d.ct.lapMoiTuan) return 'liên tục';
  const n = d.loai === 'ft' ? d.lt.lichMt.at(-1) ?? null : d.ct.weeks;
  return n !== null ? `${n} tuần` : '—';
};
/** "Progress tuần 5 · Final tuần 10" / "MT1 tuần 6 · MT2 tuần 12 · MT3 tuần 16"; `ngan` cho thẻ điện thoại: "Progress t5 · Final t10" / "MT t6 · t12 · t16". */
function chuMoc(d: DongCo, ngan = false): string {
  const t = ngan ? 't' : 'tuần ';
  if (d.loai === 'ct' && d.ct.lapMoiTuan) return `Checkpoint mỗi ${d.ct.lapMoiTuan} tuần`;
  if (d.loai === 'ft') return ngan ? `MT ${d.lt.lichMt.map((w) => `t${w}`).join(' · ')}` : d.lt.lichMt.map((w, i) => `MT${i + 1} tuần ${w}`).join(' · ');
  const p = moc(d.ct, 'progress'); const f = moc(d.ct, 'final');
  return [p !== null ? `Progress ${t}${p}` : null, f !== null ? `Final ${t}${f}` : null].filter(Boolean).join(' · ') || '—';
}

/**
 * QUẢN TRỊ › CHƯƠNG TRÌNH (OV-6b1, mockup overhaul-3 §6) — mục 7.3, K1-46…K1-50.
 *
 * Một bảng: chương trình lớp thường + Fast Track theo từng lộ trình (LT1, LT2, RF). Sửa trong panel: tên, "Đạt từ" (đúng/tổng),
 * số tuần và mốc Test (lớp thường: Progress / Final; FT: tuần học của từng MT; liên tục: Checkpoint mỗi n tuần). Lưu xong chỉ áp cho LỚP MỞ SAU —
 * lớp đang chạy giữ bản chụp lúc tạo, nên lịch của lớp đó không đổi. Cách chấm chỉ đọc; môn chỉ đọc khi chương trình gốc hoặc đã có lớp.
 *
 * OV-6b2: "+ Chương trình" tạo mã mới (đúng/tổng; số tuần hoặc liên tục). Không xoá — mã đang có lớp dùng thì NGỪNG DÙNG (biến khỏi ô chọn, lớp cũ vẫn đọc được).
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
  const dong: DongCo[] = [
    ...[...(programmes.data ?? [])].filter((p) => p.code !== 'FT').sort((a, b) => thuTu(a) - thuTu(b)).map((ct) => ({ loai: 'ct' as const, ct })),
    ...(routes.data ?? []).map((lt) => ({ loai: 'ft' as const, lt })),
  ];
  const dangSua = sua ? khoaDong(sua) : null;
  const ngung = (d: DongCo) => !conDung(d) && <span className="ml-1.5"><Info pending>ngừng dùng</Info></span>;

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
                    <td className="td whitespace-nowrap text-right tabular-nums text-slate-300">{doDai(d)}</td>
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
                        {doDai(d) !== '—' ? `${doDai(d).replace(/^l/, 'L')} · ` : ''}{chuMoc(d, true)}
                      </span>
                    </span>
                    <span aria-hidden className="text-slate-500">›</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t px-4 py-2.5" style={{ borderColor: 'var(--line)' }}>
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setSua({ loai: 'moi' })}>+ Chương trình</button>
            </div>
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

const NHAN_O: Record<string, string> = { ma: 'Mã', ten: 'Tên', mon: 'Môn', 'so-tuan': 'Độ dài', moc: 'Mốc Test', nguong: 'Đạt từ' };
const soNguyen = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v) : NaN);

/** Môn chọn được (OV-6b2): danh sách cố định; môn gộp không đi cùng môn nó đã gồm. */
const monConChon = (da: readonly string[]) => (MON_CHON as readonly string[]).filter((k) => !da.includes(k)
  && !MON_GOP[k]?.some((x) => da.includes(x)) && !da.some((g) => MON_GOP[g]?.includes(k)));

/**
 * PANEL SỬA một dòng (mockup §6): Tên · Môn · Cách chấm · Đạt từ (chỉ đúng/tổng) · Độ dài · Mốc Test · Còn dùng.
 * OV-6b2: `moi` = "+ Chương trình" — thêm Mã; Môn chọn từ danh sách; Cách chấm chỉ Đúng / tổng ("Band IELTS" chỉ FT); Độ dài "Số tuần | Liên tục"
 * đi cùng Mốc Test "Tuần cố định | Lặp mỗi n tuần" (liên tục ⇔ lặp). Chương trình mới đã có: sửa "mỗi n tuần"; Môn sửa được khi chưa có lớp.
 * Lỗi ở đúng ô — kiểm trước dưới ô, máy chủ kiểm lại và trả `details.o` (ô bị lỗi); chữ đã gõ giữ nguyên.
 */
function SuaChuongTrinh({ dong: d, onClose, onDone }: { dong: Dong; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const ft = d.loai === 'ft';
  const moi = d.loai === 'moi';
  const ct = d.loai === 'ct' ? d.ct : null;
  const thuong = moi || ct?.scoringMode === 'ratio';
  const coGiuaKhoa = !!ct && moc(ct, 'progress') !== null;
  /* Môn sửa được: chương trình mới (chưa lưu) hoặc chương trình Quản trị tạo chưa có lớp nào. */
  const suaMon = moi || (!!ct && !ct.goc && !ct.coLop);
  const [f, setF] = useState(() => ({
    ma: '',
    ten: d.loai === 'moi' ? '' : d.loai === 'ft' ? d.lt.name : d.ct.name,
    mon: ct ? [...ct.skills] : ['listening_speaking', 'reading_writing'],
    nguong: ct?.nguongDat != null ? String(ct.nguongDat) : moi ? '70' : '',
    lienTuc: moi || !!ct?.lapMoiTuan,
    lap: ct?.lapMoiTuan ? String(ct.lapMoiTuan) : '6',
    soTuan: ct?.weeks ? String(ct.weeks) : moi ? '10' : '',
    progress: ct ? String(moc(ct, 'progress') ?? '') : '',
    final: ct ? String(moc(ct, 'final') ?? '') : moi ? '10' : '',
    mt: d.loai === 'ft' ? d.lt.lichMt.map(String) : [],
    conDung: d.loai === 'moi' || conDung(d),
  }));
  const [goc] = useState(() => JSON.stringify(f));   // luật I1: đã sửa → "Huỷ thay đổi"
  const [busy, setBusy] = useState(false);
  const [loiMay, setLoiMay] = useState<LoiTruong | null>(null);
  const lf = useLoiForm();
  const doi = (patch: Partial<typeof f>) => { setLoiMay(null); setF({ ...f, ...patch }); };
  /* Có số tuần: chương trình có mốc cố định (gốc, hoặc mới chọn "Số tuần"). */
  const coSoTuan = moi ? !f.lienTuc : !!ct?.weeks;
  const lapDuoc = moi ? f.lienTuc : !!ct?.lapMoiTuan;

  /* Kiểm sớm dưới ô — cùng luật máy chủ (`sysconfig.ts`). */
  const loi: LoiTruong[] = [...dsLoi([{ khoa: 'ten', nhan: 'Tên', toiThieu: 1 }], { ten: f.ten })];
  if (moi && !/^[A-Z][A-Z0-9]{1,5}$/.test(f.ma)) loi.push({ khoa: 'ma', nhan: 'Mã', lyDo: '2–6 chữ in hoa / số, bắt đầu bằng chữ' });
  if (suaMon && !f.mon.length) loi.push({ khoa: 'mon', nhan: 'Môn', lyDo: 'Chọn ít nhất một môn' });
  const soTuan = soNguyen(f.soTuan);
  if (thuong) {
    const ng = Number(f.nguong.replace(',', '.'));
    if (f.nguong.trim() === '' || !Number.isFinite(ng) || ng < 1 || ng > 100) loi.push({ khoa: 'nguong', nhan: 'Đạt từ', lyDo: 'Từ 1 đến 100 %' });
  }
  if (ft) {
    const ds = f.mt.map(soNguyen);
    if (ds.some((w) => !Number.isInteger(w) || w < 1 || w > 104)) loi.push({ khoa: 'moc', nhan: 'Mốc Test', lyDo: 'Tuần học từ 1 đến 104' });
    else if (ds.some((w, i) => i > 0 && w <= ds[i - 1])) loi.push({ khoa: 'moc', nhan: 'Mốc Test', lyDo: 'MT sau phải ở tuần sau MT trước' });
  } else if (lapDuoc) {
    const n = soNguyen(f.lap);
    if (!Number.isInteger(n) || n < 1 || n > 52) loi.push({ khoa: 'moc', nhan: 'Mốc Test', lyDo: 'Lặp mỗi 1–52 tuần' });
  } else if (coSoTuan) {
    const p = f.progress.trim() ? soNguyen(f.progress) : null; const fi = soNguyen(f.final);
    const canGiua = coGiuaKhoa || (moi && p !== null);
    if (!Number.isInteger(soTuan) || soTuan < 1 || soTuan > 104) loi.push({ khoa: 'so-tuan', nhan: 'Độ dài', lyDo: 'Từ 1 đến 104 tuần' });
    else if ((canGiua && !(p !== null && p >= 1 && p <= soTuan)) || !(fi >= 1 && fi <= soTuan)) loi.push({ khoa: 'moc', nhan: 'Mốc Test', lyDo: `Tuần từ 1 đến ${soTuan}` });
    else if (canGiua && p !== null && p >= fi) loi.push({ khoa: 'moc', nhan: 'Mốc Test', lyDo: 'Progress phải trước Final' });
  }
  if (loiMay) loi.push(loiMay);

  const luu = async () => {
    lf.bam();
    if (loi.length > 0 || busy) return;
    setBusy(true);
    const nguongDat = Number(f.nguong.replace(',', '.'));
    try {
      if (d.loai === 'ft') {
        await api.put('/admin/routes', {
          code: d.lt.code, name: f.ten, note: d.lt.note, status: f.conDung ? 'active' : 'inactive', lichMt: f.mt.map(Number),
        });
      } else if (d.loai === 'moi') {
        await api.put('/admin/programmes', {
          taoMoi: true, code: f.ma, name: f.ten, skills: f.mon, scoringMode: 'ratio', nguongDat, status: f.conDung ? 'active' : 'inactive',
          ...(f.lienTuc ? { weeks: null, lapMoiTuan: Number(f.lap) }
            : { weeks: soTuan, progressWeek: f.progress.trim() ? Number(f.progress) : null, finalWeek: Number(f.final) }),
        });
      } else {
        await api.put('/admin/programmes', {
          code: d.ct.code, name: f.ten, status: f.conDung ? 'active' : 'inactive',
          weeks: d.ct.weeks ? soTuan : null, progressWeek: coGiuaKhoa ? Number(f.progress) : null, finalWeek: d.ct.weeks ? Number(f.final) : null,
          ...(thuong ? { nguongDat } : {}),
          ...(d.ct.lapMoiTuan ? { lapMoiTuan: Number(f.lap) } : {}),
          ...(suaMon ? { skills: f.mon } : {}),
        });
      }
      toast.push('ok', moi ? `Đã thêm ${f.ma} — tạo lớp ${f.ma} được ngay` : `Đã lưu ${tenDong(d)} — áp cho lớp mở sau`);
      onDone();
    } catch (e) {
      const o = e instanceof ApiError ? (e.details?.o as string | undefined) : undefined;
      if (o && NHAN_O[o]) { lf.bam(); setLoiMay({ khoa: o, nhan: NHAN_O[o], lyDo: (e as Error).message }); }
      else toast.push('error', (e as Error).message);
    } finally { setBusy(false); }
  };

  const n = soLop(d);
  const oSo = 'field w-20 tabular-nums';
  const conChon = monConChon(f.mon);
  return (
    <KhungPanel tieuDe={moi ? (f.ma ? `${f.ma} · chương trình mới` : 'Chương trình mới') : tenDong(d)} onDong={onClose}
      ngCanh={<span className="text-xs text-slate-400">{moi ? 'Tạo lớp được ngay sau khi lưu'
        : <>Áp cho lớp mở sau khi lưu · <span className="tabular-nums">{n}</span> lớp đang chạy giữ lịch cũ</>}</span>}
      chan={{
        daSua: JSON.stringify(f) !== goc, huy: { onClick: onClose, disabled: busy },
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>,
      }}>
      <div className="space-y-4 pt-3">
        {moi && (
          <Field label="Mã" required loi={lf.loiCua(loi, 'ma')}>
            <input className="field w-28 uppercase tabular-nums" maxLength={6} autoComplete="off" {...lf.o(loi, 'ma')} value={f.ma}
              onChange={(e) => doi({ ma: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} />
          </Field>
        )}
        <Field label="Tên" required loi={lf.loiCua(loi, 'ten')}>
          <input className="field w-full" maxLength={200} {...lf.o(loi, 'ten')} value={f.ten} onChange={(e) => doi({ ten: e.target.value })} />
        </Field>
        {suaMon ? (
          <Field as="div" label="Môn" required loi={lf.loiCua(loi, 'mon')}>
            <span className="flex flex-wrap items-center gap-1.5" {...lf.o(loi, 'mon')}>
              {f.mon.map((k) => (
                <button key={k} type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-label={`Bỏ môn ${skillShort(k)}`}
                  onClick={() => doi({ mon: f.mon.filter((x) => x !== k) })}>{skillShort(k)} <span aria-hidden className="text-slate-400">×</span></button>
              ))}
              {conChon.length > 0 && (
                <select className="field w-auto min-h-[44px] sm:min-h-0" aria-label="Thêm môn" value=""
                  onChange={(e) => e.target.value && doi({ mon: [...f.mon, e.target.value] })}>
                  <option value="">+ Môn</option>
                  {conChon.map((k) => <option key={k} value={k}>{skillShort(k)}</option>)}
                </select>
              )}
            </span>
          </Field>
        ) : (
          <dl className="m-0 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-slate-400">Môn</dt><dd className="m-0 text-slate-200">{ct ? boMon(ct) : 'L · R · W · S'}</dd>
          </dl>
        )}
        {moi ? (
          <Field as="div" label="Cách chấm">
            <PhanDoan nhan="Cách chấm" giaTri="ratio" onChon={() => {}}
              muc={[{ v: 'ratio', nhan: 'Đúng / tổng' }, { v: 'band', nhan: 'Band IELTS', tat: true, title: 'Chỉ FT' }]} />
          </Field>
        ) : (
          <dl className="m-0 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-slate-400">Cách chấm</dt><dd className="m-0 text-slate-200">{thuong ? 'Đúng / tổng' : 'Band IELTS'}</dd>
          </dl>
        )}

        {thuong && (
          <Field label="Đạt từ" loi={lf.loiCua(loi, 'nguong')}>
            <span className="flex items-center gap-2">
              <input inputMode="decimal" className={oSo} {...lf.o(loi, 'nguong')} value={f.nguong} onChange={(e) => doi({ nguong: e.target.value })} />
              <span className="text-slate-400">%</span>
            </span>
          </Field>
        )}

        {moi && (
          <Field as="div" label="Độ dài" loi={lf.loiCua(loi, 'so-tuan')}>
            <span className="flex flex-wrap items-center gap-2">
              <PhanDoan nhan="Độ dài" giaTri={f.lienTuc ? 'lien-tuc' : 'so-tuan'} onChon={(v) => doi({ lienTuc: v === 'lien-tuc' })}
                muc={[{ v: 'so-tuan', nhan: 'Số tuần' }, { v: 'lien-tuc', nhan: 'Liên tục' }]} />
              {!f.lienTuc && (
                <span className="flex items-center gap-2">
                  <input inputMode="numeric" aria-label="Số tuần" className={oSo} {...lf.o(loi, 'so-tuan')} value={f.soTuan}
                    onChange={(e) => doi({ soTuan: e.target.value, final: f.final === f.soTuan ? e.target.value : f.final })} />
                  <span className="text-slate-400">tuần</span>
                </span>
              )}
            </span>
          </Field>
        )}
        {!moi && ct?.weeks ? (
          <Field label="Độ dài" loi={lf.loiCua(loi, 'so-tuan')}>
            <span className="flex items-center gap-2">
              <input inputMode="numeric" className={oSo} {...lf.o(loi, 'so-tuan')} value={f.soTuan}
                /* Final đang = số tuần thì đi theo số tuần mới (10 → 12 thì Final cũng 12). */
                onChange={(e) => doi({ soTuan: e.target.value, final: f.final === f.soTuan ? e.target.value : f.final })} />
              <span className="text-slate-400">tuần</span>
            </span>
          </Field>
        ) : !moi && ct?.lapMoiTuan ? (
          <dl className="m-0 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 text-sm">
            <dt className="text-slate-400">Độ dài</dt><dd className="m-0 text-slate-200">Liên tục</dd>
          </dl>
        ) : ft && f.mt.length > 0 && (
          <p className="m-0 text-sm text-slate-400">Độ dài <span className="tabular-nums text-slate-200">{f.mt.at(-1) || '—'} tuần</span> · tới MT cuối</p>
        )}

        {(ft || ct?.weeks || lapDuoc || moi) && (
          <Field as="div" label="Mốc Test" loi={lf.loiCua(loi, 'moc')}>
            {moi && (
              <span className="mb-2 block">
                <PhanDoan nhan="Mốc Test" giaTri={f.lienTuc ? 'lap' : 'co-dinh'} onChon={(v) => doi({ lienTuc: v === 'lap' })}
                  muc={[{ v: 'co-dinh', nhan: 'Tuần cố định' }, { v: 'lap', nhan: 'Lặp mỗi n tuần' }]} />
              </span>
            )}
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
            ) : lapDuoc ? (
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-slate-200">Checkpoint</span><span className="text-slate-400">mỗi</span>
                <input inputMode="numeric" aria-label="Checkpoint mỗi bao nhiêu tuần" className="field w-16 tabular-nums" {...lf.o(loi, 'moc')}
                  value={f.lap} onChange={(e) => doi({ lap: e.target.value })} />
                <span className="text-slate-400">tuần</span>
              </span>
            ) : (
              <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {(coGiuaKhoa || moi) && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-slate-400">Progress tuần</span>
                    <input inputMode="numeric" aria-label="Tuần Progress Test" className="field w-16 tabular-nums" {...lf.o(loi, 'moc')}
                      placeholder={moi ? '—' : undefined} value={f.progress} onChange={(e) => doi({ progress: e.target.value })} />
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400">Final tuần</span>
                  <input inputMode="numeric" aria-label="Tuần Final Test" className="field w-16 tabular-nums" {...(coGiuaKhoa || moi ? {} : lf.o(loi, 'moc'))}
                    aria-invalid={!!lf.loiCua(loi, 'moc')} value={f.final} onChange={(e) => doi({ final: e.target.value })} />
                </span>
              </span>
            )}
          </Field>
        )}

        {!moi && (
          <label className="flex min-h-[44px] items-center gap-2 text-sm text-slate-200 sm:min-h-0">
            <input type="checkbox" checked={f.conDung} onChange={(e) => doi({ conDung: e.target.checked })} />
            Còn dùng — bỏ dấu thì không chọn được khi tạo lớp mới; lớp cũ giữ nguyên
          </label>
        )}
      </div>
    </KhungPanel>
  );
}
