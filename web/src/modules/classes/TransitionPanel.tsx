import { useMemo, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import {
  NORMAL_LADDER, hanBanGiao, kiemDongLenh, ketQuaGanNhat, ngay, tomTatLenh, tuanLich,
  type DongTomTatLenh, type HuongLenh, type KetQuaVao, type MucTieuLenh, type ProgrammeCode,
} from '@shared/domain/index.ts';
import { ClassCreatePanel } from './ClassCreatePanel.tsx';

/** Cách Quản lý chọn trên hàng (mockup 20 — B, I). `doi` = Đổi lộ trình (FT): lớp đích khác lộ trình, vẫn là `chuyen_lop` (Q3). */
type Kieu = 'len' | 'ft' | 'lai' | 'bao-luu' | 'dung' | 'chuyen' | 'doi';
type Dong = { kieu: Kieu | ''; toClassId: number | 'new' | ''; tuan: string; mucTieu: string; ngayThi: string; lyDo: string; ngayXemLai: string };
const DONG_TRONG: Dong = { kieu: '', toClassId: '', tuan: '', mucTieu: '', ngayThi: '', lyDo: '', ngayXemLai: '' };
const HUONG_CUA: Record<Kieu, HuongLenh> = { len: 'len_lop', ft: 'fast_track', lai: 'hoc_lai', 'bao-luu': 'bao_luu', dung: 'dung_hoc', chuyen: 'chuyen_lop', doi: 'chuyen_lop' };
const canLop = (k: Kieu | '') => k !== '' && k !== 'bao-luu' && k !== 'dung';

/** Cột lưới: thường 7 cột (có Web gợi ý), FT 6 cột. Dưới sm mỗi em là một khối xếp dọc (375 px, không cuộn ngang). */
const LUOI_THUONG = 'sm:grid-cols-[28px_minmax(150px,1.25fr)_minmax(120px,.9fr)_minmax(110px,.8fr)_minmax(250px,1.7fr)_minmax(160px,1.15fr)_minmax(120px,.8fr)]';
const LUOI_FT = 'sm:grid-cols-[28px_minmax(150px,1.25fr)_minmax(150px,1.1fr)_minmax(250px,1.7fr)_minmax(160px,1.15fr)_minmax(120px,.8fr)]';

/**
 * CHUYỂN LỚP CẢ LỚP (PR-CT, §3.1f Q30-1, mockup 20 màn B · C · I) — Quản lý RA LỆNH: em nào · lớp đích · tuần bắt đầu. Web tự chuyển vào Thứ Hai
 * của tuần đó; tới lúc đó Quản lý sửa / huỷ lệnh được. Lớp thường (hết khoá) và lớp FT (gộp / tách lớp, đổi lộ trình) dùng CHUNG panel (`cheDo`).
 *
 * Hai bước: 1 Soạn (mỗi em một hàng với đúng ba quyết định — hướng, lớp đích, tuần) rồi 2 Xác nhận (tóm tắt bằng câu). "Gửi phần đã quyết
 * trước, quyết nốt sau": em chưa chọn KHÔNG có lệnh. Em thiếu điểm Cuối khoá KHÔNG bị khoá dòng (Q30-4). Lối vào: Hồ sơ lớp → dải "Kết thúc khoá" →
 * `Chuyển lớp cả lớp…` (lớp thường) · ⋮ `Chuyển nhiều em…` (lớp FT).
 */
export function TransitionPanel({ classId, open, onClose, onDone }: {
  classId: number; open: boolean; onClose: () => void; onDone: () => void;
}) {
  if (!open) return null;
  return <NoiDung classId={classId} onClose={onClose} onDone={onDone} />;
}

function NoiDung({ classId, onClose, onDone }: { classId: number; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<any>(`/classes/${classId}/transition`, [classId]);
  const lf = useLoiForm();
  const [buoc, setBuoc] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [tuanChung, setTuanChung] = useState('');
  const [dongs, setDongs] = useState<Record<number, Partial<Dong>>>({});
  const [daSua, setDaSua] = useState<ReadonlySet<number>>(new Set());
  const [chon, setChon] = useState<ReadonlySet<number>>(new Set());
  const [bulk, setBulk] = useState<{ kieu: Kieu | ''; toClassId: number | 'new' | '' }>({ kieu: '', toClassId: '' });
  const [loiMayChu, setLoiMayChu] = useState<Record<number, string>>({});
  const [taoLop, setTaoLop] = useState(false);
  const [huy, setHuy] = useState<{ sid: number; lyDo: string } | null>(null);

  const ft = data?.cheDo === 'ft';
  const homNay: string = data?.today ?? '';
  const tuanCh = tuanChung || data?.tuanChon?.[0] || '';
  const students: any[] = data?.students ?? [];
  const maTu = (data?.from?.programmeCode ?? null) as ProgrammeCode | null;
  const maKe = maTu ? NORMAL_LADDER[maTu] ?? null : null;
  const routeTu: string | null = data?.from?.route ?? null;

  const kieuTuLenh = (l: any): Kieu | '' => {
    if (!l) return '';
    if (l.huong === 'len_lop') return 'len';
    if (l.huong === 'fast_track') return 'ft';
    if (l.huong === 'hoc_lai') return 'lai';
    if (l.huong === 'bao_luu') return 'bao-luu';
    if (l.huong === 'dung_hoc') return 'dung';
    const dich = (data?.candidates ?? []).find((c: any) => c.id === l.lopDichId);
    return dich && dich.route && routeTu && dich.route !== routeTu ? 'doi' : 'chuyen';
  };
  const macDinh = (s: any): Dong => {
    const l = s.lenh;
    if (!l) return DONG_TRONG;
    return {
      kieu: kieuTuLenh(l), toClassId: l.lopDichId ?? '', tuan: l.tuan === tuanCh ? '' : l.tuan, mucTieu: l.mucTieu == null ? '' : String(l.mucTieu),
      ngayThi: l.ngayThi ?? '', lyDo: l.lyDo ?? '', ngayXemLai: l.ngayXemLai ?? '',
    };
  };
  const dongCua = (s: any): Dong => ({ ...macDinh(s), ...(dongs[s.id] ?? {}) });
  const sua = (sid: number, p: Partial<Dong>) => {
    if (p.toClassId === 'new') setTaoLop(true);
    setDaSua((x) => (x.has(sid) ? x : new Set(x).add(sid)));
    setDongs((m) => ({ ...m, [sid]: { ...m[sid], ...p } }));
    setLoiMayChu((m) => { if (!(sid in m)) return m; const { [sid]: _, ...con } = m; return con; });
  };

  /** Lớp đích hợp lệ theo cách chọn — cùng luật máy chủ (`kiemDongChuyenTiep`), máy chủ vẫn kiểm lại. */
  const lopHopLe = (k: Kieu | ''): any[] => (data?.candidates ?? []).filter((c: any) => {
    if (k === 'len') return !c.ft && c.programmeCode === maKe;
    if (k === 'lai') return !c.ft && c.programmeCode === maTu;
    if (k === 'ft') return c.ft;
    if (k === 'chuyen') return c.ft;
    if (k === 'doi') return c.ft && (!routeTu || c.route !== routeTu);
    return false;
  });
  const nhanLop = (c: any) => [c.code, c.ft ? c.route : null, `${c.studentCount} em`].filter(Boolean).join(' · ');

  const dichCua = (d: Dong) => (typeof d.toClassId === 'number' ? (data?.candidates ?? []).find((c: any) => c.id === d.toClassId) ?? null : null);
  const mucTieuCua = (d: Dong): MucTieuLenh | null => (d.mucTieu.trim().toUpperCase() === 'KCK' ? 'KCK' : d.mucTieu.trim() === '' ? null : Number(d.mucTieu));
  const kiemTra = (d: Dong): string | null => {
    if (!d.kieu) return null;
    const dich = dichCua(d);
    return kiemDongLenh({
      huong: HUONG_CUA[d.kieu], lopDichId: dich?.id ?? null, lopDichFt: !!dich?.ft, nguonFt: ft, tuan: d.tuan || tuanCh, homNay,
      lyDo: d.lyDo || null, khacGoiY: false, mucTieu: mucTieuCua(d), ngayXemLai: d.ngayXemLai || null,
    });
  };

  const rows = students.map((s) => { const d = dongCua(s); return { s, d, loi: kiemTra(d), coLenh: !!s.lenh }; });
  const quyet = rows.filter((r) => r.d.kieu);
  const chua = rows.length - quyet.length;
  const coLoi = quyet.some((r) => r.loi);
  /** Chỉ gửi em MỚI quyết hoặc lệnh cũ đã sửa — lệnh đã có mà không đụng tới thì đứng yên. */
  const canGui = quyet.filter((r) => !r.coLenh || daSua.has(r.s.id));
  const hienLoi = (sid: number) => lf.daBam || daSua.has(sid);
  const dsLoi = quyet.filter((r) => r.loi).map((r) => ({ khoa: `dong-${r.s.id}`, nhan: r.s.fullName as string, lyDo: r.loi as string }));

  const dong = () => { onClose(); };
  const apChoNhieu = () => {
    if (!bulk.kieu || !chon.size) return;
    for (const sid of chon) sua(sid, { kieu: bulk.kieu, toClassId: canLop(bulk.kieu) ? bulk.toClassId : '' });
    setChon(new Set());
  };
  const ganLopMoi = (v: number | '') => {
    setDongs((m) => Object.fromEntries(Object.entries(m).map(([k, x]) => [k, x.toClassId === 'new' ? { ...x, toClassId: v } : x])));
    setBulk((b) => (b.toClassId === 'new' ? { ...b, toClassId: v } : b));
  };

  const dsTomTat: DongTomTatLenh[] = rows.map((r) => ({
    ten: r.s.fullName as string, huong: r.d.kieu ? HUONG_CUA[r.d.kieu] : null,
    lopDich: dichCua(r.d) ? [dichCua(r.d).code, dichCua(r.d).ft ? dichCua(r.d).route : null].filter(Boolean).join(' · ') : null,
    tuan: r.d.tuan || tuanCh, mucTieu: mucTieuCua(r.d), ngayXemLai: r.d.ngayXemLai || null,
  }));
  const cau = tomTatLenh(dsTomTat, homNay);
  const han = hanBanGiao(homNay || tuanCh);

  const gui = async () => {
    setBusy(true);
    try {
      const r = await api.post<any>(`/classes/${classId}/transition`, {
        tuanChung: tuanCh,
        dongs: canGui.map((x) => ({
          studentId: x.s.id, huong: HUONG_CUA[x.d.kieu as Kieu], toClassId: typeof x.d.toClassId === 'number' ? x.d.toClassId : undefined,
          tuan: x.d.tuan || undefined, mucTieu: mucTieuCua(x.d) ?? undefined, ngayThi: x.d.ngayThi || undefined, lyDo: x.d.lyDo || undefined,
          ngayXemLai: x.d.kieu === 'bao-luu' ? x.d.ngayXemLai || undefined : undefined,
        })),
      });
      invalidate('/classes'); invalidate('/students'); invalidate('/hoc-vien-lop'); invalidate('/my-work'); invalidate('/lenh-chuyen'); invalidate('/yeu-cau');
      if (r.failed.length) {
        setLoiMayChu(Object.fromEntries(r.failed.map((f: any) => [f.studentId, f.message])));
        setBuoc(1);
        toast.push('error', `${r.failed.length} em chưa gửi được lệnh — xem lỗi ở từng hàng`);
        if (r.ok.length) reload();
      } else {
        toast.push('ok', `Đã gửi lệnh chuyển ${r.ok.length} em`);
        onDone(); dong();
      }
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const huyLenh = async () => {
    if (!huy) return;
    const s = students.find((x) => x.id === huy.sid);
    try {
      await api.post(`/lenh-chuyen/${s.lenh.id}/huy`, { lyDo: huy.lyDo });
      invalidate('/classes'); invalidate('/my-work'); invalidate('/lenh-chuyen');
      setDongs((m) => ({ ...m, [huy.sid]: { ...DONG_TRONG } }));
      setHuy(null); reload();
      toast.push('ok', 'Đã huỷ lệnh');
    } catch (e: any) { toast.push('error', e.message); }
  };

  const nhomChan = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of quyet) {
      const c = dichCua(r.d);
      const t = ({ len: 'Lên', ft: 'Lên FT', lai: 'Học lại', 'bao-luu': 'Bảo lưu', dung: 'Dừng học', chuyen: 'Chuyển lớp FT', doi: 'Đổi lộ trình' } as const)[r.d.kieu as Kieu];
      const k = c ? `${t} · ${c.code}` : t;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dongs, data]);

  const tieuDe = data ? `Chuyển lớp · ${data.from.code} · ${students.length} em` : 'Chuyển lớp';
  const luoi = ft ? LUOI_FT : LUOI_THUONG;
  const cotTieuDe = 'hidden gap-3 border-b px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.06em] text-slate-500 sm:grid';

  return (
    <>
      <KhungPanel longTrong rong="toan" onDong={taoLop ? () => {} : dong} tieuDe={tieuDe}
        ngCanh={data ? <span>{buoc === 1 ? '1 Soạn › 2 Xác nhận' : '1 Soạn › 2 Xác nhận · đọc lại rồi gửi'}</span> : undefined}
        chan={buoc === 1 ? {
          huy: { nhan: 'Đóng', onClick: dong, disabled: busy },
          dongTren: data ? (
            <div className="space-y-1 px-4 pt-2 text-xs text-slate-400">
              <div className="flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
                {nhomChan.map(([k, n]) => <span key={k}>{k} <b className="text-slate-100">{n}</b></span>)}
                <span>Chưa quyết <b className="text-slate-100">{chua}</b></span>
              </div>
              <p className="m-0">
                Gửi phần đã quyết trước, quyết nốt sau. Tới hết tuần kết thúc lớp{data.tuanKetThuc ? ` (${tuanLich(data.tuanKetThuc, homNay)})` : ''} mà còn em chưa có lệnh thì Quản lý nhận thẻ Báo lên.
              </p>
            </div>
          ) : undefined,
          phu: data?.canEdit ? <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => setTaoLop(true)}>+ Mở lớp mới</button> : undefined,
          chinh: (
            <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={!data?.canEdit || !canGui.length}
              onClick={() => { if (coLoi) lf.bam(); else setBuoc(2); }}>
              Tiếp tục · {canGui.length} em
            </button>
          ),
          conThieu: lf.conThieu(dsLoi),
        } : {
          huy: { nhan: '‹ Sửa', onClick: () => setBuoc(1), disabled: busy },
          chinh: (
            <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={gui} disabled={busy}>
              {busy ? 'Đang gửi…' : `Gửi lệnh chuyển ${canGui.length} em`}
            </button>
          ),
        }}>
        {error && <ErrorState message={error.message} hint={error.hint} onRetry={reload} />}
        {loading && <Skeleton rows={8} />}
        {data && !data.canEdit && <p className="mt-3 text-sm text-slate-400">Chỉ Quản lý chi nhánh của lớp này ra lệnh chuyển lớp. Bạn xem được tình trạng lệnh.</p>}

        {data && buoc === 1 && (
          <div className="space-y-3 pt-3">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <div className="w-44">
                <span className="mb-1 block text-[11.5px] font-bold text-slate-200">Tuần bắt đầu chung</span>
                <OTuan tuanChon={data.tuanChon} value={tuanCh} onChange={setTuanChung} ariaLabel="Tuần bắt đầu chung" />
              </div>
              <p className="m-0 min-w-0 flex-1 text-xs text-slate-400">
                Chỉ chọn từ tuần sau trở đi; web chuyển em vào Thứ Hai của tuần đó. Em có thể có tuần riêng.
              </p>
            </div>

            {data.canEdit && (
              <div className="surface-2 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" role="group" aria-label="Chọn nhiều em">
                <span className="text-xs font-semibold text-slate-200 tabular-nums">{chon.size} em đang chọn</span>
                <div className="flex flex-wrap gap-1.5">
                  {(ft
                    ? [['chuyen', 'Chuyển lớp FT'], ['doi', 'Đổi lộ trình'], ['bao-luu', 'Bảo lưu'], ['dung', 'Dừng học']]
                    : [...(maKe ? [['len', `Lên ${maKe}`]] : []), ['ft', 'Lên FT'], ['lai', 'Học lại'], ['bao-luu', 'Bảo lưu'], ['dung', 'Dừng học']]
                  ).map(([k, nhan]) => (
                    <NutChon key={k} nho chon={bulk.kieu === k} onClick={() => setBulk({ kieu: k as Kieu, toClassId: '' })}>{nhan}</NutChon>
                  ))}
                </div>
                {canLop(bulk.kieu) && (
                  <select className="field w-full sm:w-64" aria-label="Lớp đích cho các em đang chọn" value={bulk.toClassId}
                    onChange={(e) => { if (e.target.value === 'new') setTaoLop(true); setBulk((b) => ({ ...b, toClassId: e.target.value === 'new' ? 'new' : e.target.value ? Number(e.target.value) : '' })); }}>
                    <option value="">Chọn lớp đích</option>
                    {lopHopLe(bulk.kieu).map((c) => <option key={c.id} value={c.id}>{nhanLop(c)}</option>)}
                    <option value="new">+ Mở lớp mới…</option>
                  </select>
                )}
                <button type="button" className="btn btn-sm" disabled={!bulk.kieu || !chon.size || (canLop(bulk.kieu) && !bulk.toClassId)} onClick={apChoNhieu}>
                  Áp cho {chon.size} em
                </button>
              </div>
            )}

            <div className="surface-2 rounded-lg" role="table" aria-label="Học viên của lớp">
              <div role="row" className={`${cotTieuDe} ${luoi}`}>
                <span role="columnheader"><input type="checkbox" aria-label="Chọn cả lớp" disabled={!data.canEdit}
                  checked={chon.size > 0 && chon.size === students.length}
                  onChange={(e) => setChon(e.target.checked ? new Set(students.map((s) => s.id)) : new Set())} /></span>
                <span role="columnheader">Học viên</span>
                <span role="columnheader">{ft ? 'Kết quả gần nhất' : 'Cuối khoá'}</span>
                {!ft && <span role="columnheader">Web gợi ý</span>}
                <span role="columnheader">Quản lý quyết định</span>
                <span role="columnheader">Lớp đích</span>
                <span role="columnheader">Tuần bắt đầu</span>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
                {rows.map(({ s, d, loi }) => (
                  <HangEm key={s.id} s={s} d={d} ft={ft} luoi={luoi} maKe={maKe} routeTu={routeTu} tuanCh={tuanCh} homNay={homNay}
                    loi={hienLoi(s.id) ? loi : null} loiMayChu={loiMayChu[s.id] ?? null} oId={lf.oId(`dong-${s.id}`)} khoa={!data.canEdit}
                    chon={chon.has(s.id)} onChon={(v) => setChon((x) => { const n = new Set(x); if (v) n.add(s.id); else n.delete(s.id); return n; })}
                    sua={(p) => sua(s.id, p)} lopHopLe={lopHopLe} nhanLop={nhanLop} data={data}
                    huy={huy?.sid === s.id ? huy : null} moHuy={() => setHuy({ sid: s.id, lyDo: '' })} doiLyDoHuy={(v) => setHuy({ sid: s.id, lyDo: v })}
                    dongHuy={() => setHuy(null)} xacNhanHuy={huyLenh} />
                ))}
              </div>
            </div>
          </div>
        )}

        {data && buoc === 2 && (
          <div className="space-y-3 pt-3">
            <div className="surface-2 rounded-lg p-3">
              <p className="m-0 mb-2 text-sm font-bold text-slate-100">Xác nhận lệnh chuyển · {data.from.code}</p>
              <ul className="m-0 list-disc space-y-1.5 pl-5">
                {cau.map((c, i) => <li key={i} className="text-sm text-slate-200">{c}</li>)}
              </ul>
            </div>
            <p className="m-0 text-sm text-slate-300">
              Sau khi gửi: {data.gvcn ? `GVCN ${data.gvcn}` : 'GVCN lớp cũ'} có việc <b>Bàn giao {canGui.filter((r) => r.d.kieu !== 'dung').length} em</b> · hạn hết {ngay(han.gvcn, homNay)}.
              {' '}GVBM có việc Bàn giao môn, hạn hết {ngay(han.gvbm, homNay)}. GVCN lớp mới được báo.
            </p>
          </div>
        )}
      </KhungPanel>
      {taoLop && data && (
        <ClassCreatePanel moHoSo={false}
          macDinh={{ ...(data.goiYLopMoi ?? { branchId: data.from.branchId }), previousClassId: data.from.id }}
          onDone={(lop) => { reload(); ganLopMoi(lop.id); setTaoLop(false); }}
          onClose={() => { ganLopMoi(''); setTaoLop(false); }} />
      )}
    </>
  );
}

function HangEm({ s, d, ft, luoi, maKe, routeTu, tuanCh, homNay, loi, loiMayChu, oId, khoa, chon, onChon, sua, lopHopLe, nhanLop, data, huy, moHuy, doiLyDoHuy, dongHuy, xacNhanHuy }: {
  s: any; d: Dong; ft: boolean; luoi: string; maKe: ProgrammeCode | null; routeTu: string | null; tuanCh: string; homNay: string;
  loi: string | null; loiMayChu: string | null; oId: string; khoa: boolean; chon: boolean; onChon: (v: boolean) => void;
  sua: (p: Partial<Dong>) => void; lopHopLe: (k: Kieu | '') => any[]; nhanLop: (c: any) => string; data: any;
  huy: { sid: number; lyDo: string } | null; moHuy: () => void; doiLyDoHuy: (v: string) => void; dongHuy: () => void; xacNhanHuy: () => void;
}) {
  const k = ketQuaGanNhat(s.ketQua as KetQuaVao | null);
  const ketQua = s.ketQua as KetQuaVao | null;
  const thieuDiem = !ft && !!ketQua && ketQua.mode === 'ratio' && ketQua.scored < ketQua.required;
  const lenh = s.lenh;
  const loiHang = loi ?? loiMayChu ?? (lenh?.loi ? `Chưa chuyển được: ${lenh.loi}` : null);
  const chonKieu = (kieu: Kieu | '') => sua({ kieu, toClassId: kieu === d.kieu ? d.toClassId : '' });
  const nutKieu: [Kieu, string][] = ft
    ? [['chuyen', 'Chuyển lớp FT'], ['doi', 'Đổi lộ trình']]
    : [...(maKe ? [['len', `Lên ${maKe}`] as [Kieu, string]] : []), ['ft', 'Lên FT'], ['lai', 'Học lại']];
  const khac = d.kieu === 'bao-luu' || d.kieu === 'dung';
  const nhan = 'text-[11px] text-slate-500 sm:hidden';
  const dsLop = lopHopLe(d.kieu);
  const tuanRieng = d.tuan && d.tuan !== tuanCh;

  return (
    <div role="row" className={`grid gap-x-3 gap-y-2 px-3 py-2.5 text-sm ${luoi} ${chon ? 'bg-ink-800/60' : ''}`}>
      <span role="cell" className="flex items-start pt-1">
        <input type="checkbox" aria-label={`Chọn ${s.fullName}`} checked={chon} disabled={khoa} onChange={(e) => onChon(e.target.checked)} />
      </span>
      <span role="cell" className="min-w-0">
        <span className="block truncate text-slate-100" title={s.fullName}>{s.fullName}</span>
        <span className="block text-[11px] tabular-nums text-slate-500">{s.studentCode}</span>
      </span>
      <span role="cell" className="min-w-0">
        <span className={nhan}>{ft ? 'Kết quả gần nhất' : 'Cuối khoá'}</span>
        <span className="block" title={k.dong1 ?? undefined}>
          {thieuDiem ? <span className="text-slate-500">—</span> : <span className="font-bold tabular-nums text-slate-100">{k.chinh}</span>}
          {!thieuDiem && k.lech && <span className="ml-1.5 text-[11px] font-semibold tabular-nums text-bad">{k.lech}</span>}
          {!thieuDiem && k.dong2 && <span className="block text-[12px] leading-4 text-slate-500">{k.dong2}</span>}
          {thieuDiem && <span className="block text-[12px] leading-4 text-slate-500">Chưa đủ điểm · cập nhật sau</span>}
        </span>
      </span>
      {!ft && (
        <span role="cell" className="min-w-0">
          <span className={nhan}>Web gợi ý</span>
          {s.cuoiKhoa?.goiY ? <span className="block text-xs text-slate-300">{s.cuoiKhoa.goiY.nhanNgan ?? s.cuoiKhoa.goiY.nhan}</span> : <span className="text-slate-600" title="Gợi ý theo luật Cuối khoá sẽ hiện khi có điểm">—</span>}
          {s.cuoiKhoa?.goiY?.canQl && <span className="mt-0.5 inline-flex rounded-full bg-soon-bg px-[7px] text-[11.5px] font-bold leading-[18px] text-soon">Quản lý cân nhắc</span>}
        </span>
      )}
      <span role="cell" className="min-w-0">
        <span className={nhan}>Quản lý quyết định</span>
        <span id={oId} tabIndex={-1} aria-invalid={!!loi} className="flex flex-wrap items-center gap-1 outline-none">
          {nutKieu.map(([kk, nh]) => <NutChon key={kk} nho chon={d.kieu === kk} disabled={khoa} onClick={() => chonKieu(d.kieu === kk ? '' : kk)}>{nh}</NutChon>)}
          <select className={`field !h-8 !w-auto !py-0 text-xs ${khac ? '!border-teal-600' : ''}`} aria-label={`Khác cho ${s.fullName}`} disabled={khoa}
            value={khac ? d.kieu : ''} onChange={(e) => chonKieu((e.target.value || '') as Kieu | '')}>
            <option value="">Khác ▾</option>
            <option value="bao-luu">Bảo lưu</option>
            <option value="dung">Dừng học</option>
          </select>
        </span>
        {!d.kieu && <span className="mt-1 block text-[11px] text-slate-500">Chưa chọn</span>}
      </span>
      <span role="cell" className="min-w-0">
        <span className={nhan}>Lớp đích</span>
        {canLop(d.kieu) ? (
          <select className="field w-full" aria-label={`Lớp đích của ${s.fullName}`} disabled={khoa} value={d.toClassId}
            onChange={(e) => sua({ toClassId: e.target.value === 'new' ? 'new' : e.target.value ? Number(e.target.value) : '' })}>
            <option value="">Chọn lớp</option>
            {dsLop.map((c) => <option key={c.id} value={c.id}>{nhanLop(c)}</option>)}
            <option value="new">+ Mở lớp mới…</option>
          </select>
        ) : <span className="text-slate-500">{d.kieu ? 'không chuyển lớp' : '—'}</span>}
      </span>
      <span role="cell" className="min-w-0">
        <span className={nhan}>Tuần bắt đầu</span>
        {d.kieu ? (
          <span className="block">
            <span className="tabular-nums text-slate-200">{tuanLich(d.tuan || tuanCh, homNay)}</span>
            {!tuanRieng && <span className="text-[11px] text-slate-500"> (chung)</span>}
            {!khoa && (
              <span className="mt-1 block max-w-[9.5rem]">
                <OTuan tuanChon={data.tuanChon} value={d.tuan || tuanCh} onChange={(v) => sua({ tuan: v === tuanCh ? '' : v })} ariaLabel={`Tuần bắt đầu của ${s.fullName}`} />
              </span>
            )}
          </span>
        ) : <span className="text-slate-600">—</span>}
      </span>

      {d.kieu === 'ft' && (
        <div className="flex flex-wrap items-end gap-3 sm:col-start-2 sm:col-end-[-1]">
          <label className="block">
            <span className="mb-0.5 block text-[11px] text-slate-500">Target</span>
            <span className="flex items-center gap-1">
              <input className="field w-20 tabular-nums" inputMode="decimal" placeholder="6.0" aria-label={`Target của ${s.fullName}`} value={d.mucTieu === 'KCK' ? '' : d.mucTieu}
                disabled={khoa || d.mucTieu === 'KCK'} onChange={(e) => sua({ mucTieu: e.target.value })} />
              <NutChon nho chon={d.mucTieu === 'KCK'} disabled={khoa} title="Không cam kết — không tính SOS" onClick={() => sua({ mucTieu: d.mucTieu === 'KCK' ? '' : 'KCK' })}>KCK</NutChon>
            </span>
          </label>
          <span className="block w-36">
            <span className="mb-0.5 block text-[11px] text-slate-500">Thi dự kiến</span>
            <ONgay kieu="thang" value={d.ngayThi} onChange={(v) => sua({ ngayThi: v })} ariaLabel={`Tháng thi dự kiến của ${s.fullName}`} />
          </span>
          <span className="pb-1 text-[11px] text-slate-500">Lộ trình theo lớp đích</span>
        </div>
      )}
      {(d.kieu === 'bao-luu' || d.kieu === 'dung' || d.kieu === 'chuyen' || d.kieu === 'doi') && (
        <div className="flex flex-wrap items-end gap-3 sm:col-start-2 sm:col-end-[-1]">
          <label className="block min-w-[14rem] flex-1">
            <span className="mb-0.5 block text-[11px] text-slate-500">Lý do <span className="text-bad">*</span></span>
            <input className="field w-full" aria-label={`Lý do của ${s.fullName}`} value={d.lyDo} disabled={khoa} onChange={(e) => sua({ lyDo: e.target.value })} />
          </label>
          {d.kieu === 'bao-luu' && (
            <span className="block w-40">
              <span className="mb-0.5 block text-[11px] text-slate-500">Xem lại</span>
              <OTuan tuanChon={data.tuanChon} rong value={d.ngayXemLai} onChange={(v) => sua({ ngayXemLai: v })} ariaLabel={`Tuần xem lại của ${s.fullName}`} chuaChon="Chọn tuần" />
            </span>
          )}
          {d.kieu === 'doi' && <span className="pb-1 text-[11px] text-slate-400">LT ↔ RF = mở lộ trình mới, MT đánh lại từ MT1</span>}
        </div>
      )}
      {thieuDiem && d.kieu && (
        <p className="m-0 text-[12px] text-slate-400 sm:col-start-2 sm:col-end-[-1]">Vẫn chuyển đúng tuần. Khi có điểm, web áp luật Cuối khoá ở lớp mới (bổ trợ, Mini Test nếu cần).</p>
      )}
      {!ft && d.kieu === 'ft' && s.cuoiKhoa?.ketLuanFt && (
        <p className="m-0 text-[12px] text-slate-400 sm:col-start-2 sm:col-end-[-1]">
          Kỳ vọng đầu ra: {s.cuoiKhoa.ketLuanFt.nhan ?? 'chưa đánh dấu'} · <a className="link" href={`/hoc-vien/${s.id}`}>Mở hồ sơ</a>
        </p>
      )}
      {loiHang && <p role="alert" className="m-0 text-[12px] text-late sm:col-start-2 sm:col-end-[-1]">{loiHang}</p>}
      {lenh && !khoa && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 sm:col-start-2 sm:col-end-[-1]">
          <span>Đã có lệnh · bắt đầu {tuanLich(lenh.tuan, homNay)}</span>
          {!huy && <button type="button" className="link border-0 bg-transparent p-0 text-xs" onClick={moHuy}>Huỷ lệnh</button>}
          {huy && (
            <span className="flex flex-wrap items-center gap-1.5">
              <input className="field w-56" placeholder="Lý do huỷ" aria-label={`Lý do huỷ lệnh của ${s.fullName}`} value={huy.lyDo} onChange={(e) => doiLyDoHuy(e.target.value)} />
              <button type="button" className="btn btn-sm btn-danger" disabled={huy.lyDo.trim().length < 3} onClick={xacNhanHuy}>Huỷ lệnh</button>
              <button type="button" className="btn btn-sm" onClick={dongHuy}>Giữ lệnh</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** Ô tuần chỉ nhận Thứ Hai từ TUẦN SAU trở đi (Q5) — `tuanChon` do máy chủ trả (`tuanChonDuoc`). `rong`: không chặn trên (tuần xem lại của Bảo lưu). */
export function OTuan({ tuanChon, value, onChange, ariaLabel, chuaChon, rong }: {
  tuanChon: string[]; value: string; onChange: (v: string) => void; ariaLabel: string; chuaChon?: string; rong?: boolean;
}) {
  return <ONgay kieu="tuan" moc="dau" value={value} onChange={onChange} toiThieu={tuanChon[0] ?? null} toiDa={rong ? null : tuanChon[tuanChon.length - 1] ?? null}
    ariaLabel={ariaLabel} goiY={chuaChon} />;
}
