import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { WeekPicker } from '../../ui/Filters.tsx';
import { useToast } from '../../ui/Toast.tsx';
import {
  CHO_TAO_PRE_FOU, ENTRY_SKILLS, PROGRAMME_TEMPLATES,
  chuanHoaMaLop, ghepMaLop, kiemPhanCong, kiemSoLop, kyHieuLop, locSoLop, oPhanCong,
} from '@shared/domain/index.ts';

type Branch = { id: number; code: string; name: string };
type Programme = { code: string; name: string; weeks: number | null; skills: readonly string[]; checkpoints: readonly { kind: string; studyWeek: number }[] };
type Kieu = 'FT' | 'THUONG';
const CHUONG_TRINH_THUONG = ['PREFOU', 'FOU', 'BE', 'ELE'] as const;

/**
 * TẠO LỚP MỚI (PR-LOP, mockup 21 mục 1–3) — MỘT lệnh `POST /classes` tạo lớp + phân công cùng giao dịch (YC-1).
 * Tên lớp do máy ghép `{CN} {ký hiệu} {số}`: người dùng chỉ chọn kiểu lớp/lộ trình/chương trình và gõ số (T1).
 * Mỗi ô phân công MỘT người (YC-4); lỗi luật phân công hiện ngay tại ô và khoá nút Tạo lớp (Q2) — cùng hàm máy chủ kiểm.
 * ponytail: lỗi ô thường tự giữ cờ "đã bấm" + `Truong loi` + `conThieu`; đổi sang `useLoiForm` khi PR-N1 Task 6 merge.
 */
export function ClassCreatePanel({ onClose, onDone, macDinh, moHoSo }: {
  onClose: () => void;
  onDone?: (lop: { id: number; code: string }) => void;
  macDinh?: { branchId?: number; chuongTrinh?: string; loTrinh?: string | null; so?: string; startPeriodId?: number | null; previousClassId?: number };
  /** Mặc định true: tạo xong mở hồ sơ lớp. Chuyển tiếp truyền false. */
  moHoSo?: boolean;
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const id = useId();
  const branches = useApi<Branch[]>('/ref/branches');
  const routes = useApi<{ code: string; name: string }[]>('/ref/routes');
  const programmes = useApi<Programme[]>('/ref/programmes');

  const [branchId, setBranchId] = useState<number | null>(macDinh?.branchId ?? null);
  const [kieu, setKieu] = useState<Kieu>(macDinh?.chuongTrinh && macDinh.chuongTrinh !== 'FT' ? 'THUONG' : 'FT');
  const [loTrinh, setLoTrinh] = useState(macDinh?.loTrinh ?? 'LT1');
  const [chuongTrinh, setChuongTrinh] = useState(macDinh?.chuongTrinh && macDinh.chuongTrinh !== 'FT' ? macDinh.chuongTrinh : 'FOU');
  const [so, setSo] = useState(locSoLop(macDinh?.so ?? ''));
  const [startPeriodId, setStartPeriodId] = useState<number | null>(macDinh?.startPeriodId ?? null);
  const [chon, setChon] = useState<Record<string, number | ''>>({});
  const [daBam, setDaBam] = useState(false);
  const [busy, setBusy] = useState(false);

  const teachers = useApi<{ id: number; name: string; classCount: number }[]>(
    branchId ? `/ref/teachers?branchId=${branchId}` : null, [branchId]);
  const lopDaCo = useApi<{ code: string }[]>(branchId ? `/ref/classes?branchId=${branchId}` : null, [branchId]);

  /* A2 §2.5: người tạo chỉ có một chi nhánh → chọn sẵn. */
  const dsCn = branches.data ?? [];
  useEffect(() => { if (branchId === null && dsCn.length === 1) setBranchId(dsCn[0].id); }, [branches.data, branchId]); // eslint-disable-line react-hooks/exhaustive-deps
  const branch = dsCn.find((b) => b.id === branchId) ?? null;

  const ct = kieu === 'FT' ? 'FT' : chuongTrinh;
  const lt = kieu === 'FT' ? loTrinh : null;
  const prog = (programmes.data ?? []).find((p) => p.code === ct);
  const mau = prog ?? (PROGRAMME_TEMPLATES as Record<string, Programme | undefined>)[ct];
  const kyNang: string[] = ct === 'FT' ? [...ENTRY_SKILLS] : [...(mau?.skills ?? [])];
  const oList = oPhanCong(ct, kyNang);
  const khoaO = oList.map((o) => o.khoa).join('|');
  /* Đổi kiểu lớp/chương trình → bỏ chọn của ô không còn. */
  useEffect(() => {
    setChon((c) => Object.fromEntries(Object.entries(c).filter(([k]) => khoaO.split('|').includes(k))));
  }, [khoaO]);
  const slots = oList.flatMap((o) => (chon[o.khoa] ? [{ userId: Number(chon[o.khoa]), skill: o.skill, isCore: o.laGvcn }] : []));

  const ma = branch && !kiemSoLop(so) ? ghepMaLop(branch.code, ct, lt, so) : null;
  const trung = !!ma && (lopDaCo.data ?? []).some((l) => chuanHoaMaLop(l.code) === chuanHoaMaLop(ma));
  const loiPc = kiemPhanCong(ct, kyNang, slots);
  const loiPcO = (khoa: string) => loiPc.find((l) => l.khoa === khoa)?.lyDo ?? null;

  /* Lỗi ô thường: hiện sau khi bấm Tạo lớp; riêng số sai mẫu / trùng tên hiện ngay khi đã gõ. */
  const loiO: { khoa: string; nhan: string; lyDo: string | null }[] = [
    { khoa: 'chi-nhanh', nhan: 'Chi nhánh', lyDo: branchId ? null : 'Chọn chi nhánh' },
    { khoa: 'so', nhan: 'Số lớp', lyDo: kiemSoLop(so) ?? (trung ? `Đã có lớp ${ma}` : null) },
    { khoa: 'tuan', nhan: 'Tuần khai giảng', lyDo: kieu === 'THUONG' && !startPeriodId ? 'Chọn tuần khai giảng' : null },
  ];
  const loiHien = (khoa: string) => {
    const l = loiO.find((x) => x.khoa === khoa)?.lyDo ?? null;
    return daBam || (khoa === 'so' && so !== '') ? l : null;
  };
  const conLoi = loiO.filter((l) => l.lyDo);
  const conThieu = daBam || loiPc.length
    ? [...new Set([...conLoi.map((l) => l.nhan), ...loiPc.map((l) => oList.find((o) => o.khoa === l.khoa)?.nhan ?? '')])]
    : undefined;

  const moc = (k: string) => mau?.checkpoints.find((c) => c.kind === k)?.studyWeek;
  const lopSeCo = ct === 'FT'
    ? 'Lịch MT theo từng HV'
    : [mau?.weeks && `${mau.weeks} tuần`, moc('progress') && `Giữa khoá tuần ${moc('progress')}`, moc('final') && `Cuối khoá tuần ${moc('final')}`]
      .filter(Boolean).join(' · ');

  const tao = async () => {
    setDaBam(true);
    if (conLoi.length || loiPc.length) return;
    setBusy(true);
    try {
      const r = await api.post<{ id: number; code: string }>('/classes', {
        branchId, chuongTrinh: ct, loTrinh: lt, so, startPeriodId, slots, previousClassId: macDinh?.previousClassId,
      });
      invalidate('/classes'); invalidate('/ref/classes'); invalidate('/hoc-vien-lop'); invalidate('/my-work');
      toast.push('ok', `Đã tạo lớp ${r.code}`);
      onDone?.(r);
      if (moHoSo !== false) navigate(`/hoc-vien/lop/${r.id}`); else onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const loiPcDau = loiPc[0] ? `${oList.find((o) => o.khoa === loiPc[0].khoa)?.nhan ?? ''}: ${loiPc[0].lyDo}` : undefined;

  return (
    <KhungPanel tieuDe="Tạo lớp mới" onDong={onClose}
      chan={{
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={tao}
            disabled={busy || loiPc.length > 0} title={loiPcDau}>Tạo lớp</button>
        ),
        conThieu,
      }}>
      <div className="space-y-3 pt-3.5">
        <Truong nhan="Chi nhánh" batBuoc loi={loiHien('chi-nhanh')}>
          <select className={`field w-full ${loiHien('chi-nhanh') ? 'border-late' : ''}`} value={branchId ?? ''}
            onChange={(e) => { setBranchId(e.target.value ? Number(e.target.value) : null); setChon({}); }}>
            <option value="">— Chọn chi nhánh —</option>
            {dsCn.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
          </select>
        </Truong>

        <Truong nhan="Kiểu lớp" as="div">
          <PhanDoan nhan="Kiểu lớp" giaTri={kieu} onChon={(v) => setKieu(v as Kieu)}
            muc={[{ v: 'FT', nhan: 'Fast Track' }, { v: 'THUONG', nhan: 'Lớp thường' }]} />
        </Truong>

        {kieu === 'FT' ? (
          <Truong nhan="Lộ trình" as="div">
            <PhanDoan nhan="Lộ trình" giaTri={loTrinh} onChon={setLoTrinh}
              muc={(routes.data ?? []).map((r) => ({ v: r.code, nhan: r.code, title: r.name }))} />
          </Truong>
        ) : (
          <Truong nhan="Chương trình" as="div" phu={CHO_TAO_PRE_FOU ? undefined : 'Mở cùng đợt cập nhật hệ môn học'}>
            <PhanDoan nhan="Chương trình" giaTri={chuongTrinh} onChon={setChuongTrinh}
              muc={CHUONG_TRINH_THUONG.map((c) => ({
                v: c, nhan: kyHieuLop(c, null) ?? c, tat: c === 'PREFOU' && !CHO_TAO_PRE_FOU,
                title: c === 'PREFOU' && !CHO_TAO_PRE_FOU ? 'Mở cùng đợt cập nhật hệ môn học' : undefined,
              }))} />
          </Truong>
        )}

        <div>
          <Truong nhan="Số lớp" batBuoc phu="1–4 chữ số, được thêm một chữ cái cuối (101A)" loi={loiHien('so')}>
            <input className={`field w-28 tabular-nums ${loiHien('so') ? 'border-late' : ''}`} inputMode="numeric" autoComplete="off"
              value={so} onChange={(e) => setSo(locSoLop(e.target.value))} />
          </Truong>
          <p className="m-0 mt-2 text-sm tabular-nums" aria-live="polite">
            {ma
              ? <>Lớp sẽ là <strong className="text-slate-100">{ma}</strong></>
              : <span className="text-slate-500">Lớp sẽ là {branch?.code ?? '…'} {kyHieuLop(ct, lt)} …</span>}
          </p>
        </div>

        <Truong nhan="Tuần khai giảng" as="div" batBuoc={kieu === 'THUONG'} loi={loiHien('tuan')}>
          <WeekPicker periodId={startPeriodId} label={null} scope="planning" onPeriod={setStartPeriodId} />
        </Truong>
        {lopSeCo && <p className="m-0 text-xs text-slate-400 tabular-nums">Lớp này sẽ có: {lopSeCo}</p>}
      </div>

      <Khoi tieuDe="Phân công">
        <div className="grid grid-cols-[6rem_1fr] items-center gap-x-2.5 gap-y-1.5">
          {oList.map((o) => {
            const loi = loiPcO(o.khoa);
            return (
              <div key={o.khoa} className="contents">
                <label htmlFor={`${id}-${o.khoa}`} className="text-xs font-bold text-slate-200">{o.nhan}</label>
                <select id={`${id}-${o.khoa}`} className={`field w-full ${loi ? 'border-late' : ''}`} value={chon[o.khoa] ?? ''}
                  aria-invalid={loi ? true : undefined}
                  onChange={(e) => setChon((c) => ({ ...c, [o.khoa]: e.target.value ? Number(e.target.value) : '' }))}>
                  <option value="">— Chưa chọn —</option>
                  {(teachers.data ?? []).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}{t.classCount ? ` · ${t.classCount} lớp` : ''}</option>
                  ))}
                </select>
                {loi && <span className="col-start-2 -mt-0.5 text-[11px] text-late">{loi}</span>}
              </div>
            );
          })}
        </div>
        <p className="m-0 text-[11px] text-slate-500">
          {oList.length === 1
            ? 'Lớp Pre FOU không chia môn — GVCN dạy luôn.'
            : 'Mỗi ô một người. Một người nhận nhiều ô được. Thiếu ô nào vẫn tạo được lớp — bổ sung ở hồ sơ lớp.'}
        </p>
      </Khoi>
    </KhungPanel>
  );
}

/** Nút phân đoạn: mục đang chọn viền + nền accent nhạt (không `btn-primary` — B3). */
function PhanDoan({ nhan, giaTri, onChon, muc }: {
  nhan: string; giaTri: string; onChon: (v: string) => void;
  muc: { v: string; nhan: string; tat?: boolean; title?: string }[];
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line-strong)' }} role="group" aria-label={nhan}>
      {muc.map((m) => {
        const on = m.v === giaTri;
        return (
          <button key={m.v} type="button" aria-pressed={on} disabled={m.tat} title={m.title}
            className={`min-h-[44px] border-0 border-r px-3 text-xs font-semibold last:border-r-0 disabled:opacity-40 sm:min-h-[30px] ${on ? 'text-slate-100' : 'text-slate-400'}`}
            style={{
              borderColor: 'var(--line-strong)',
              background: on ? 'var(--accent-soft)' : 'transparent',
              boxShadow: on ? 'inset 0 0 0 1px var(--accent-line)' : undefined,
            }}
            onClick={() => onChon(m.v)}>{m.nhan}</button>
        );
      })}
    </div>
  );
}
