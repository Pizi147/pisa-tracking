import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ChipHan, Nhan } from '../../ui/Nhan.tsx';
import { ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { ChonLop } from '../../ui/ChonLop.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { OTarget, OTuanBatDau, type XemChuyenLopData } from '../students/ChuyenLopPanel.tsx';
import { KHOI_VANG } from './chuyenLopChung.tsx';
import { canHoiTarget, chuTyLeXetLai, docOTarget, kyHieuLop, laChuyenNgay, ngay, tenBacKe, tuanChonDuoc, tuanLich, type ProgrammeCode } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

type Quyet = 'tiep_tuc' | 'hoc_lai' | 'len' | 'dung';
const laChuyen = (q: Quyet | null | undefined) => q === 'hoc_lai' || q === 'len';
export type EmXetLai = {
  studentId: number; ten: string; lenhId: number; lyDo: { ma: 'a' | 'b' | 'c' | 'd'; chu: string }; han: string;
  lopHienTai: { id: number; code: string; ft: boolean; ct: string | null }; lopNguon: { id: number; code: string; ct: string | null }; daThiHanh: boolean; tuanBatDau: string;
  final: { tyLe: number | null; mon: { mon: string; pt: number | null; dat: boolean }[] };
  daChot: { huong: string; chu: string; lopDich: string | null; lopDichId: number | null; luc: string; nguoi: string | null; lyDo: string | null };
  goiY: string | null;
  phuHuynh: { tvv: string | null; luc: string | null; ketQua: string | null } | null;
  banGiaoGvcnCu: string | null;
  boTro: { mon: string[]; daHoc: number; tong: number; miniTest: { tyLe: number | null; ngayDuKien: string; ngayLam: string | null } } | null;
  nhanXetGvcnMoi: string | null;
  xetLaiTruoc: { quyetDinh: Quyet; chu: string | null; tuDong: boolean; luc: string; nguoi: string | null } | null;
  coTheNhanXet?: boolean;
  quyetDinh: { id: number; quyetDinh: Quyet; lopDich: string | null; tuan: string | null; luc: string; nguoi: string | null } | null;
};
type DuLieu = { lop: { id: number; code: string; ft: boolean }; chiXem: boolean; han: string | null; nguon: { code: string } | null; em: EmXetLai[]; lopHocLai: Record<string, LopMo[]>; lopLen: Record<string, LopMo[]> };
type LopMo = { id: number; code: string; phu: string; ft?: boolean };
/** Lựa chọn đang soạn của một em (chưa lưu). `hoiTarget`: Lên FT mà em chưa có Target (xem trước `/chuyen-lop`, như panel Chuyển lớp) → ô Target tại thẻ. */
type Chon = { quyet: Quyet; lop: number | null; tuan: string; lyDo: string; trangThai: 'inactive' | 'finished'; hoiTarget?: boolean; mucTieu?: string };
/** Kết quả đã lưu trong lần mở panel này (Hoàn tác / Sửa). */
type DaLuu = { id: number; chu: string; daChuyen: boolean };

export const duongXetLai = (classId: number, studentId?: number | null) => `/classes/${classId}/xet-lai${studentId ? `?studentId=${studentId}` : ''}`;
const LO = 10;   // = LO_XET_LAI máy chủ
const HOAN_TAC_XET_LAI_MS = 10_000;   // mockup khung 4: Hoàn tác 10 s
const lamMoi = () => { for (const k of ['/classes', '/students', '/my-work', '/hoc-vien-lop', '/lenh-chuyen', '/cases']) invalidate(k); };
const bac = (ct: string | null) => kyHieuLop(ct, null) ?? ct ?? '';
/** Em đã vào lớp mới → "Tiếp tục {lớp}"; lệnh chưa thi hành (em còn ở lớp cũ) → "Giữ {hướng đã chốt}" (mockup khung 5a). */
const tiepTucChu = (e: EmXetLai) => (!e.daThiHanh ? t('Giữ {huong}', { huong: e.daChot.chu })
  : e.lopHienTai.ft ? t('Tiếp tục FT') : t('Tiếp tục {lop}', { lop: bac(e.lopHienTai.ct) || e.lopHienTai.code }));
const hocLaiChu = (e: EmXetLai) => (e.lopHienTai.ft ? t('Về lớp thường') : t('Học lại {ct}', { ct: bac(e.lopNguon.ct) }));
/** Nút chuyển của thẻ: dòng (c) (đang học lại mà Final ≥ 60 %) → "Lên {bậc kế}" (lớp bậc kế / FT); còn lại → Học lại chương trình cũ. */
const chuyenCua = (e: EmXetLai): Quyet => (e.lyDo.ma === 'c' ? 'len' : 'hoc_lai');
const chuyenChu = (e: EmXetLai) => (e.lyDo.ma === 'c' ? t('Lên {lop}', { lop: e.lopNguon.ct ? tenBacKe(e.lopNguon.ct as ProgrammeCode) : '' }) : hocLaiChu(e));
const lopCua = (d: Pick<DuLieu, 'lopHocLai' | 'lopLen'>, e: EmXetLai): LopMo[] => (e.lyDo.ma === 'c' ? d.lopLen : d.lopHocLai)[e.lopNguon.ct ?? ''] ?? [];
const doLyDo = (e: EmXetLai) => e.lyDo.ma === 'a' || e.lyDo.ma === 'd';
const canLyDo = (e: EmXetLai, c: Chon) => c.quyet === 'dung' || (c.quyet === 'tiep_tuc' && e.lyDo.ma === 'a');
/** Cùng chữ máy chủ (`motEm`) để ô báo đúng chỗ dù lỗi từ web hay từ máy chủ. */
const LOI_LOP = { len: 'Chọn lớp', hoc_lai: 'Chọn lớp học lại' } as const;
const LOI_TARGET = 'Ghi Target (hoặc KCK)';   // = `kiemDongLenh` máy chủ
const laLoi = (loi: string | null, chu: typeof LOI_LOP[keyof typeof LOI_LOP] | typeof LOI_TARGET) => !!loi && (loi === chu || loi === t(chu));
const loiChon = (e: EmXetLai, c: Chon): string | null =>
  (laChuyen(c.quyet) && !c.lop ? t(c.quyet === 'len' ? LOI_LOP.len : LOI_LOP.hoc_lai)
    : laChuyen(c.quyet) && !c.tuan ? t('Chọn tuần bắt đầu.')
      : laChuyen(c.quyet) && c.hoiTarget && docOTarget(c.mucTieu ?? '').loi ? t(LOI_TARGET)
        : canLyDo(e, c) && !c.lyDo.trim() ? t('Ghi lý do ngắn') : null);

/**
 * XÉT LẠI LỘ TRÌNH (P9a, N21 — mockup V6 `thiet-ke/v6/xet-lai-lo-trinh.html` khung 2–7) — MỘT panel, mở tại chỗ ở hồ sơ lớp em đang học (việc QL ·
 * thanh Việc cần làm · chip "Xét lại" trên dòng em) và hồ sơ HV (một em). Mỗi em một thẻ: lý do · Final từng môn · ai chốt · gợi ý · phụ huynh ·
 * bàn giao · bổ trợ; ba nút Tiếp tục {lớp} · Học lại {CT} (lớp + tuần mở trên thẻ, = đường Chuyển lớp) · Tạm dừng/ Kết thúc học. Chọn nhiều → Áp cho n em.
 * Lưu theo lô (≤ 10 em / lời gọi), em lỗi giữ thẻ + lựa chọn; Hoàn tác 10 s; Sửa tới khi lệnh mới thi hành. GVCN lớp mới: chỉ xem + một nhận xét.
 */
export function PanelXetLai({ classId, studentId = null, onClose, onDone }: { classId: number; studentId?: number | null; onClose: () => void; onDone?: () => void }) {
  const { data, error, reload } = useApi<DuLieu>(duongXetLai(classId, studentId), [classId, studentId]);
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const toi = useSession().session?.user?.fullName ?? null;
  const [chon, setChon] = useState<Record<number, Chon>>({});
  const [tick, setTick] = useState<ReadonlySet<number>>(new Set());
  const [daLuu, setDaLuu] = useState<Record<number, DaLuu>>({});
  const [suaId, setSuaId] = useState<Record<number, number>>({});
  const [loi, setLoi] = useState<Record<number, string>>({});
  const [daBam, setDaBam] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hoiNgay, setHoiNgay] = useState<string[] | null>(null);
  const tuanChon = homNay ? tuanChonDuoc(homNay) : [];
  /* Danh sách em CHỐT lúc mở: lưu xong em không biến khỏi panel (đọc lại chỉ khi Hoàn tác / đóng). */
  const [ds, setDs] = useState<EmXetLai[] | null>(null);
  if (data && ds === null) setDs(data.em);
  /* Sau Hoàn tác: thẻ đọc lại từ máy chủ (dòng mở lại, quyết định cũ còn sửa được…) khi bản tải mới về. */
  const [napLai, setNapLai] = useState(false);
  useEffect(() => { if (napLai && data) { setDs(data.em); setNapLai(false); } }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const em = ds ?? [];
  const xong = (e: EmXetLai) => !!daLuu[e.studentId] || (!!e.quyetDinh && !suaId[e.studentId]);
  const soan = em.filter((e) => chon[e.studentId] && !xong(e));
  const daQuyet = em.filter((e) => xong(e)).length;
  const moi = (e: EmXetLai, q: Quyet): Chon => ({ quyet: q, lop: null, tuan: tuanChon[0] ?? '', lyDo: '', trangThai: 'inactive' });
  const datChon = (sid: number, c: Chon | null) => {
    setChon((m) => { const { [sid]: _, ...con } = m; return c ? { ...con, [sid]: c } : con; });
    setLoi((m) => { const { [sid]: _, ...con } = m; return con; });
  };
  const bamNut = (e: EmXetLai, q0: Quyet) => { const q = laChuyen(q0) ? chuyenCua(e) : q0; return  datChon(e.studentId, chon[e.studentId]?.quyet === q ? null : { ...(chon[e.studentId] ?? moi(e, q)), quyet: q }); };
  const apCho = (q: Quyet) => { for (const sid of tick) { const e = em.find((x) => x.studentId === sid); if (e && !xong(e)) { const q2 = laChuyen(q) ? chuyenCua(e) : q; datChon(sid, { ...(chon[sid] ?? moi(e, q2)), quyet: q2 }); } } };

  const gui = async (xacNhan = false) => {
    setDaBam(true);
    const sai = soan.filter((e) => loiChon(e, chon[e.studentId]));
    if (sai.length || !soan.length) return;
    const ngayNay = soan.filter((e) => laChuyen(chon[e.studentId].quyet) && homNay && laChuyenNgay(chon[e.studentId].tuan, homNay));
    if (ngayNay.length && !xacNhan) { setHoiNgay(ngayNay.map((e) => e.ten)); return; }
    setHoiNgay(null);
    setBusy(true);
    const ok: { studentId: number; id: number; chu: string; daChuyen: boolean }[] = [];
    const hong: Record<number, string> = {};
    try {
      for (let i = 0; i < soan.length; i += LO) {
        const lo = soan.slice(i, i + LO);
        const r = await api.post<{ ok: typeof ok; failed: { studentId: number; message: string }[] }>(`/classes/${classId}/xet-lai`, {
          items: lo.map((e) => {
            const c = chon[e.studentId];
            return { studentId: e.studentId, quyetDinh: c.quyet, toClassId: laChuyen(c.quyet) ? c.lop : null, tuan: laChuyen(c.quyet) ? c.tuan : null,
              lyDo: c.lyDo.trim() || null, trangThai: c.trangThai, suaId: suaId[e.studentId] ?? e.quyetDinh?.id ?? null,
              mucTieu: laChuyen(c.quyet) && c.hoiTarget ? docOTarget(c.mucTieu ?? '').giaTri : undefined };
          }),
        });
        ok.push(...r.ok);
        for (const f of r.failed) hong[f.studentId] = f.message;
      }
    } catch (e: any) {
      for (const x of soan) if (!ok.some((o) => o.studentId === x.studentId)) hong[x.studentId] ??= e?.message ?? t('Không lưu được');
    }
    setBusy(false);
    if (ok.length) {
      lamMoi();
      setDaLuu((m) => ({ ...m, ...Object.fromEntries(ok.map((o) => [o.studentId, { id: o.id, chu: o.chu, daChuyen: o.daChuyen }])) }));
      setSuaId((m) => { const n = { ...m }; for (const o of ok) delete n[o.studentId]; return n; });
      setChon((m) => { const n = { ...m }; for (const o of ok) delete n[o.studentId]; return n; });
      setTick(new Set());
      onDone?.();
      const hoanTacDuoc = ok.filter((o) => !o.daChuyen);
      const chu = Object.keys(hong).length ? t('Đã lưu {n} em', { n: ok.length })
        : daQuyet + ok.length >= em.length ? t('Đã lưu {n} em · việc Xét lại xong', { n: ok.length }) : t('Đã lưu {n} em', { n: ok.length });
      if (hoanTacDuoc.length) {
        toast.push('ok', chu, { ms: HOAN_TAC_XET_LAI_MS, demLui: true, key: `xet-lai:${classId}`, hanhDong: { nhan: t('Hoàn tác'), onBam: () => hoanTac(hoanTacDuoc) } });
      } else toast.push('ok', chu);
    }
    setLoi((m) => ({ ...m, ...hong }));
    if (Object.keys(hong).length) toast.push('error', t('{n} em chưa lưu được — xem lỗi ở từng thẻ', { n: Object.keys(hong).length }));
  };

  const hoanTac = async (ds2: { studentId: number; id: number }[]) => {
    try {
      const r = await api.post<{ ok: number[]; failed: { id: number; message: string }[] }>(`/classes/${classId}/xet-lai/hoan-tac`, { ids: ds2.map((x) => x.id) });
      setDaLuu((m) => { const n = { ...m }; for (const x of ds2) if (r.ok.includes(x.id)) delete n[x.studentId]; return n; });
      setSuaId((m) => { const n = { ...m }; for (const x of ds2) delete n[x.studentId]; return n; });
      lamMoi();
      setNapLai(true);
      reload();
      onDone?.();
      if (r.failed.length) toast.push('error', r.failed[0].message);
      else toast.push('ok', t('Đã hoàn tác'));
    } catch (e: any) { toast.push('error', e?.message ?? t('Chưa hoàn tác được — thử lại.')); }
  };
  /** Sửa: thẻ về lựa chọn cũ (chưa lưu) — Lưu sẽ đảo quyết định cũ rồi ghi mới, cùng giao dịch. */
  const sua = (e: EmXetLai) => {
    const id = daLuu[e.studentId]?.id ?? e.quyetDinh?.id;
    if (!id) return;
    setSuaId((m) => ({ ...m, [e.studentId]: id }));
    setDaLuu((m) => { const { [e.studentId]: _, ...con } = m; return con; });
  };

  const tieuDe = data ? t('Xét lại lộ trình · {lop} · {n} em', { lop: data.lop.code, n: em.length }) : t('Xét lại lộ trình');
  const dong = () => { if (!busy) onClose(); };
  if (error) return <KhungPanel tieuDe={tieuDe} rong="rong" onDong={onClose}><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></KhungPanel>;
  if (!data || ds === null) return <KhungPanel tieuDe={tieuDe} rong="rong" onDong={onClose}><div className="mt-3"><Skeleton rows={6} /></div></KhungPanel>;

  const tomTat = tomTatLuu(soan.map((e) => ({ e, c: chon[e.studentId] })), data, homNay);
  const conThieu = daBam ? soan.filter((e) => loiChon(e, chon[e.studentId])).map((e) => ({ nhan: e.ten, lyDo: loiChon(e, chon[e.studentId])! })) : [];
  const e0 = em[0];
  const nguCanh = [data.nguon && t('Từ {lop}', { lop: data.nguon.code }),
    e0 && (e0.daThiHanh ? t('vào lớp {tuan}', { tuan: tuanLich(e0.tuanBatDau, homNay) }) : t('chuyển lớp {tuan}', { tuan: tuanLich(e0.tuanBatDau, homNay) }))].filter(Boolean) as string[];
  return (
    <KhungPanel rong="rong" tieuDe={tieuDe} loai={t('VIỆC · XÉT LẠI LỘ TRÌNH')} onDong={dong}
      dau={{ han: data.han && !data.chiXem ? <ChipHan loai="viec-van-hanh" han={data.han} /> : null, dong2: nguCanh }}
      chan={data.chiXem ? { huy: { onClick: dong } } : {
        daSua: soan.length > 0, huy: { onClick: dong, disabled: busy },
        conThieu: conThieu.length ? conThieu : undefined,
        trai: <span className="text-slate-400" role="status">{tomTat ? <><b className="text-slate-100">{t('Khi lưu:')}</b> {tomTat}</> : t('{a}/{b} em đã quyết', { a: daQuyet, b: em.length })}</span>,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] max-sm:flex-1 sm:min-h-0" onClick={() => gui()} disabled={busy || !soan.length}>
          {busy ? t('Đang lưu…') : soan.length ? t('Lưu · {n} em', { n: soan.length }) : t('Lưu')}</button>,
      }}>
      {!em.length ? <p className="mt-3 text-sm text-slate-400">{t('Không còn em cần xét lại.')}</p> : (
        <div className="mt-3 flex flex-col gap-2.5">
          {!data.chiXem && em.filter((e) => !xong(e)).length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <NutChon nho chon={tick.size > 0 && tick.size === em.filter((e) => !xong(e)).length}
                onClick={() => setTick(tick.size ? new Set() : new Set(em.filter((e) => !xong(e)).map((e) => e.studentId)))}>
                {t('Chọn tất cả · {n}', { n: em.filter((e) => !xong(e)).length })}</NutChon>
              <span className="ml-auto text-[13px] text-slate-400">{t('Chưa quyết {n}', { n: em.length - daQuyet })}</span>
            </div>
          )}
          {tick.size > 0 && (
            <ThanhAp n={tick.size} mau={em.find((e) => tick.has(e.studentId))!} chonChung={chungCua([...tick].map((s) => chon[s]?.quyet ?? null))}
              onAp={apCho} onBo={() => setTick(new Set())} />
          )}
          {em.map((e) => (
            <TheEm key={e.studentId} e={e} chiXem={data.chiXem} classId={classId} homNay={homNay} toi={toi} tuanChon={tuanChon}
              chon={chon[e.studentId] ?? null} daLuu={daLuu[e.studentId] ?? null} xong={xong(e)} loi={loi[e.studentId] ?? (daBam && chon[e.studentId] ? loiChon(e, chon[e.studentId]) : null)}
              tick={tick.has(e.studentId)} busy={busy} lopHocLai={lopCua(data, e)}
              onTick={(v) => setTick((s) => { const n = new Set(s); if (v) n.add(e.studentId); else n.delete(e.studentId); return n; })}
              onNut={(q) => bamNut(e, q)} onChon={(c) => datChon(e.studentId, c)} onSua={() => sua(e)} />
          ))}
        </div>
      )}
      <Modal open={!!hoiNgay} onClose={() => setHoiNgay(null)} title={t('Chuyển ngay hôm nay?')}
        footer={<div className="flex justify-end gap-2 px-5 py-3"><button type="button" className="btn" onClick={() => setHoiNgay(null)}>{t('Đóng')}</button>
          <button type="button" className="btn btn-primary" onClick={() => gui(true)}>{t('Chuyển ngay · {n} em', { n: hoiNgay?.length ?? 0 })}</button></div>}>
        <p className="m-0 px-5 py-4 text-sm text-slate-200">{t('{ten} vào lớp mới ngay khi lưu — không hoàn tác được.', { ten: (hoiNgay ?? []).join(', ') })}</p>
      </Modal>
    </KhungPanel>
  );
}

const chungCua = (ds: (Quyet | null)[]): Quyet | null => (ds.length && ds.every((x) => x === ds[0]) ? ds[0] : null);

/** "2 em Tiếp tục BE · 1 em Học lại → MB FOU 14 từ W2 OCT" — dòng chân "Khi lưu:" (mockup khung 3). */
function tomTatLuu(ds: { e: EmXetLai; c: Chon }[], d: Pick<DuLieu, 'lopHocLai' | 'lopLen'>, homNay: string | null): string {
  const nhom = new Map<string, number>();
  for (const { e, c } of ds) {
    const k = c.quyet === 'tiep_tuc' ? tiepTucChu(e)
      : c.quyet === 'dung' ? (c.trangThai === 'finished' ? t('Kết thúc học') : t('Tạm dừng'))
        : `${chuyenChu(e)}${c.lop ? ` → ${lopCua(d, e).find((l) => l.id === c.lop)?.code ?? ''}` : ''}${c.tuan ? ` ${homNay && laChuyenNgay(c.tuan, homNay) ? t('ngay hôm nay') : t('từ {tuan}', { tuan: tuanLich(c.tuan, homNay) })}` : ''}`;
    nhom.set(k, (nhom.get(k) ?? 0) + 1);
  }
  return [...nhom].map(([k, n]) => t('{n} em {viec}', { n, viec: k })).join(' · ');
}

function ThanhAp({ n, mau, chonChung, onAp, onBo }: { n: number; mau: EmXetLai; chonChung: Quyet | null; onAp: (q: Quyet) => void; onBo: () => void }) {
  const [q, setQ] = useState<Quyet | null>(chonChung);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[10px] border px-3 py-2" style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }} role="group" aria-label={t('{n} em đã chọn', { n })}>
      <b className="text-sm text-slate-100">{t('{n} em đã chọn', { n })}</b>
      <span className="flex flex-wrap gap-1.5">
        <NutChon nho chon={q === 'tiep_tuc'} onClick={() => setQ('tiep_tuc')}>{tiepTucChu(mau)}</NutChon>
        <NutChon nho chon={q === 'hoc_lai'} onClick={() => setQ('hoc_lai')}>{chuyenChu(mau)}</NutChon>
        <NutChon nho chon={q === 'dung'} onClick={() => setQ('dung')}>{t('Tạm dừng/ Kết thúc học')}</NutChon>
      </span>
      <span className="ml-auto flex gap-1.5">
        <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={!q} onClick={() => q && onAp(q)}>{t('Áp cho {n} em', { n })}</button>
        <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={onBo}>{t('Bỏ chọn')}</button>
      </span>
    </div>
  );
}

function Dong({ n, children }: { n: string; children: ReactNode }) {
  return (
    <>
      <dt className="pt-px text-xs font-semibold text-slate-500 max-sm:pt-1.5">{n}</dt>
      <dd className="m-0 min-w-0 text-[13px] text-slate-200">{children}</dd>
    </>
  );
}

/** Một em (mockup `.em-xl`): đầu thẻ · lưới thông tin · hàng làm (QL) hoặc nhận xét (GVCN lớp mới). */
function TheEm({ e, chiXem, classId, homNay, toi, tuanChon, chon, daLuu, xong, loi, tick, busy, lopHocLai, onTick, onNut, onChon, onSua }: {
  e: EmXetLai; chiXem: boolean; classId: number; homNay: string | null; toi: string | null; tuanChon: string[];
  chon: Chon | null; daLuu: DaLuu | null; xong: boolean; loi: string | null; tick: boolean; busy: boolean; lopHocLai: LopMo[];
  onTick: (v: boolean) => void; onNut: (q: Quyet) => void; onChon: (c: Chon) => void; onSua: () => void;
}) {
  const ct = bac(e.lopNguon.ct);
  const nguoiChot = e.daChot.nguoi ? `QL ${tenGoi(e.daChot.nguoi)}` : null;
  const chuDaLuu = daLuu ? `✓ ${daLuu.chu} · ${toi ? `QL ${tenGoi(toi)}` : ''} ${homNay ? ngay(homNay, homNay) : ''}`.trim()
    : e.quyetDinh ? `${chuyenChu(e)} → ${e.quyetDinh.lopDich ?? ''}${e.quyetDinh.tuan ? ` · ${t('từ {tuan}', { tuan: tuanLich(e.quyetDinh.tuan, homNay) })}` : ''}` : null;
  const vien = tick ? { borderColor: 'var(--accent)', boxShadow: 'inset 3px 0 0 var(--accent)' } : loi ? { borderColor: 'rgb(var(--late-line-rgb))' } : { borderColor: 'var(--line)' };
  return (
    <article className={`flex flex-col rounded-[10px] border bg-[color:var(--surface)] ${xong ? 'opacity-75' : ''}`} style={vien} aria-label={e.ten}>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-3.5 pb-2 pt-3">
        {!chiXem && !xong && <input type="checkbox" className="h-[18px] w-[18px] accent-[color:var(--accent)]" aria-label={t('Chọn {ten}', { ten: e.ten })} checked={tick} disabled={busy} onChange={(ev) => onTick(ev.target.checked)} />}
        <b className="text-[15px]"><Link className="ten-ho-so" to={`/hoc-vien/${e.studentId}`}>{e.ten}</Link></b>
        {chiXem && <ChipXetLai />}
        {!xong && e.lyDo.chu && <span className={`text-[13px] font-bold ${doLyDo(e) ? 'text-bad' : 'text-soon'}`}>{e.lyDo.chu}</span>}
        {chuDaLuu && (daLuu && !daLuu.chu.startsWith('Học lại') ? <span className="text-[13px] font-semibold text-ok">{chuDaLuu}</span>
          : <Nhan tone="doing">{daLuu ? chuDaLuu.replace(/^✓ /, '') : chuDaLuu}</Nhan>)}
        {chiXem && <span className="ml-auto flex items-center gap-1.5 text-[13px] text-slate-400">{t('QL quyết')} · <ChipHan loai="viec-van-hanh" han={e.han} /></span>}
        {!chiXem && xong && !daLuu?.daChuyen && <button type="button" className="btn btn-sm btn-ghost ml-auto min-h-[44px] sm:min-h-0" onClick={onSua} disabled={busy}>{t('Sửa')}</button>}
      </div>
      {!xong && (
        <dl className="m-0 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 px-3.5 pb-2.5 pl-[42px] max-sm:grid-cols-1 max-sm:pl-3.5">
          {e.final.tyLe !== null && (
            <Dong n={t('Final {ct}', { ct })}>
              <b className={`tabular-nums ${e.final.tyLe < 0.7 ? 'text-bad' : ''}`}>{e.final.tyLe < 0.7 && <span aria-hidden>✗ </span>}{chuTyLeXetLai(e.final.tyLe)}</b>
              {' · '}<span className="tabular-nums">{e.final.mon.map((m, i) => (
                <span key={m.mon} className={m.dat ? '' : 'text-bad'}>{i > 0 && ' · '}{!m.dat && '✗ '}{m.mon} {m.pt ?? '—'}</span>))}</span>
            </Dong>
          )}
          {e.xetLaiTruoc && <Dong n={t('Đã xét lại')}>{e.xetLaiTruoc.chu ?? '—'} · {e.xetLaiTruoc.tuDong ? t('tự giữ') : e.xetLaiTruoc.nguoi ? `QL ${tenGoi(e.xetLaiTruoc.nguoi)}` : ''} {ngay(e.xetLaiTruoc.luc.slice(0, 10), homNay)}</Dong>}
          <Dong n={t('Đã chốt')}>{[e.daChot.chu, nguoiChot && `${nguoiChot} ${ngay(e.daChot.luc, homNay)}`].filter(Boolean).join(' · ')}{e.lyDo.ma === 'b' ? ` ${t('(chưa có Final)')}` : ''}{!chiXem && e.daChot.lyDo && <> · <span className="text-slate-300">“{e.daChot.lyDo}”</span></>}</Dong>
          {!chiXem && e.goiY && <Dong n={t('Gợi ý')}>{e.goiY}</Dong>}
          {!chiXem && e.phuHuynh && <Dong n={t('Phụ huynh')}>{[e.phuHuynh.tvv && `TVV ${tenGoi(e.phuHuynh.tvv)}`, e.phuHuynh.luc && ngay(e.phuHuynh.luc, homNay)].filter(Boolean).join(' ')}{e.phuHuynh.ketQua && <> · “{e.phuHuynh.ketQua}”</>}</Dong>}
          {!chiXem && e.banGiaoGvcnCu && <Dong n={t('GVCN cũ')}>“{e.banGiaoGvcnCu}”</Dong>}
          {!chiXem && e.boTro && (
            <Dong n={t('Bổ trợ Final')}>{[e.boTro.mon.join(', '), t('{a}/{b} buổi', { a: e.boTro.daHoc, b: e.boTro.tong }),
              e.boTro.miniTest.tyLe !== null ? t('Mini Test {pt}', { pt: chuTyLeXetLai(e.boTro.miniTest.tyLe) }) + (e.boTro.miniTest.ngayLam ? ` ${ngay(e.boTro.miniTest.ngayLam, homNay)}` : '')
                : t('Mini Test dự kiến {ngay}', { ngay: ngay(e.boTro.miniTest.ngayDuKien, homNay) })].filter(Boolean).join(' · ')}</Dong>
          )}
          {!chiXem && e.nhanXetGvcnMoi && <Dong n={t('GVCN mới')}>“{e.nhanXetGvcnMoi}”</Dong>}
        </dl>
      )}
      {chiXem ? (e.coTheNhanXet ? <NhanXetGvcn e={e} classId={classId} /> : null)
        : !xong && <HangLam e={e} ct={ct} chon={chon} loi={loi} busy={busy} homNay={homNay} tuanChon={tuanChon} lopHocLai={lopHocLai} onNut={onNut} onChon={onChon} />}
    </article>
  );
}

/** "Nguyễn Khánh Vy" → "Vy" (mockup: "QL Vy 17/09", "TVV Lan"). */
const tenGoi = (ten: string) => ten.trim().split(/\s+/).pop() ?? ten;

function HangLam({ e, ct, chon, loi, busy, homNay, tuanChon, lopHocLai, onNut, onChon }: {
  e: EmXetLai; ct: string; chon: Chon | null; loi: string | null; busy: boolean; homNay: string | null; tuanChon: string[];
  lopHocLai: LopMo[]; onNut: (q: Quyet) => void; onChon: (c: Chon) => void;
}) {
  const ds = useMemo(() => lopHocLai.map((l) => ({ id: l.id, ma: l.code, phu: l.phu })), [lopHocLai]);
  const lopChu = lopHocLai.find((l) => l.id === chon?.lop)?.code ?? null;
  /* Lên FT từ lớp thường: xem trước như panel Chuyển lớp — em chưa có Target nào → ô Target / KCK ngay tại thẻ (`canHoiTarget`). */
  const dichFt = laChuyen(chon?.quyet) && !!lopHocLai.find((l) => l.id === chon?.lop)?.ft;
  const xem = useApi<XemChuyenLopData>(dichFt && !e.lopHienTai.ft ? `/students/${e.studentId}/chuyen-lop?toClassId=${chon!.lop}` : null, [e.studentId, chon?.lop, dichFt]);
  /* Máy chủ báo thiếu Target (xem trước lỗi / chưa tải xong) cũng mở ô — ô ở lại tới khi đổi lớp. */
  const canTarget = (dichFt && !!xem.data && canHoiTarget(xem.data.hienTai.ft, true, xem.data.targetSan)) || laLoi(loi, LOI_TARGET);
  const hoiTarget = !!chon?.hoiTarget || canTarget;
  useEffect(() => { if (chon && !chon.hoiTarget && canTarget) onChon({ ...chon, hoiTarget: true }); }, [canTarget]); // eslint-disable-line react-hooks/exhaustive-deps
  const ngayNay = !!chon && !!homNay && laChuyenNgay(chon.tuan, homNay);
  const len = e.lyDo.ma === 'c';
  const ke = e.lopNguon.ct ? tenBacKe(e.lopNguon.ct as ProgrammeCode) : '';
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 border-t border-dashed px-3.5 pb-3 pt-2.5 pl-[42px] max-sm:flex-col max-sm:items-stretch max-sm:pl-3.5" style={{ borderColor: 'var(--line)' }}>
      <span className="flex flex-wrap gap-1.5 max-sm:flex-col">
        <NutChon chon={chon?.quyet === 'tiep_tuc'} disabled={busy} onClick={() => onNut('tiep_tuc')}>{tiepTucChu(e)}</NutChon>
        <NutChon chon={laChuyen(chon?.quyet)} disabled={busy} onClick={() => onNut(chuyenCua(e))}>{chuyenChu(e)}</NutChon>
        <NutChon chon={chon?.quyet === 'dung'} disabled={busy} onClick={() => onNut('dung')}>{t('Tạm dừng/ Kết thúc học')}</NutChon>
      </span>
      {laChuyen(chon?.quyet) && chon && (
        <div className="flex basis-full flex-col gap-2">
          <div className="flex flex-wrap items-start gap-x-2.5 gap-y-1.5">
            <span className="text-xs font-bold leading-[34px] text-slate-300">{t('Lớp')}</span>
            <span className="w-[300px] max-w-full">
              <ChonLop ds={ds} value={chon.lop} onChange={(id) => onChon({ ...chon, lop: id, hoiTarget: false })} ariaLabel={t('Lớp của {ten}', { ten: e.ten })} tat={busy}
                invalid={laLoi(loi, LOI_LOP.len) || laLoi(loi, LOI_LOP.hoc_lai)} khongKhop={t('Chưa có lớp {ct} đang học', { ct: len ? ke : ct })} placeholder={len ? ke : ct} />
            </span>
          </div>
          {hoiTarget && (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <span className="text-xs font-bold text-slate-300">Target <span aria-hidden className="text-bad">*</span></span>
              <OTarget value={chon.mucTieu ?? ''} onChange={(v) => onChon({ ...chon, mucTieu: v })} ariaLabel={t('Target của {ten}', { ten: e.ten })} disabled={busy}
                oProps={{ 'aria-invalid': laLoi(loi, LOI_TARGET) }} />
            </div>
          )}
          <div className="flex flex-wrap items-start gap-x-2.5 gap-y-1.5">
            <span className="text-xs font-bold leading-[34px] text-slate-300">{t('Từ')}</span>
            <span className="min-w-0 flex-1"><OTuanBatDau tuanChon={tuanChon} tuan={chon.tuan} setTuan={(v) => onChon({ ...chon, tuan: v })} homNay={homNay} oProps={{ 'aria-label': t('Tuần bắt đầu') }} /></span>
          </div>
          {chon.lop && (
            <div className="rounded-lg border p-3" style={KHOI_VANG} role="note">
              <p className="m-0 mb-1 text-xs font-bold text-slate-200">{t('Khi lưu, web sẽ')}</p>
              <ul className="m-0 list-disc space-y-0.5 pl-5 text-[13px] text-slate-200">
                {e.daThiHanh
                  ? <li>{ngayNay ? t('Chuyển {tu} → {den} ngay hôm nay — không hoàn tác', { tu: e.lopHienTai.code, den: lopChu ?? '' })
                    : t('Quyết định chuyển {tu} → {den} từ {tuan} (sửa / huỷ được tới {ngay})', { tu: e.lopHienTai.code, den: lopChu ?? '', tuan: tuanLich(chon.tuan, homNay), ngay: ngay(chon.tuan, homNay) })}</li>
                  : <li>{t('Sửa quyết định ở {lop}: {viec} → {den} từ {tuan}', { lop: e.lopNguon.code, viec: chuyenChu(e), den: lopChu ?? '', tuan: tuanLich(chon.tuan, homNay) })}</li>}
                {e.daThiHanh && <li>{t('Đóng khoá {cu}, mở khoá {moi} mới · điểm {cu} (nếu có) ở lại khoá {cu}', { cu: bac(e.lopHienTai.ct) || e.lopHienTai.code, moi: len ? ke : ct })}</li>}
                {e.daThiHanh && <li>{t('Phiếu bàn giao GVCN {lop}', { lop: e.lopHienTai.code })}</li>}
                <li>{t('Hành trình: “QL xét lại: {viec}”', { viec: chuyenChu(e) })}</li>
              </ul>
            </div>
          )}
        </div>
      )}
      {chon?.quyet === 'dung' && (
        <div className="flex basis-full flex-wrap items-center gap-2">
          <NutChon nho chon={chon.trangThai === 'inactive'} disabled={busy} onClick={() => onChon({ ...chon, trangThai: 'inactive' })}>{t('Tạm dừng')}</NutChon>
          <NutChon nho chon={chon.trangThai === 'finished'} disabled={busy} onClick={() => onChon({ ...chon, trangThai: 'finished' })}>{t('Kết thúc học')}</NutChon>
        </div>
      )}
      {chon && canLyDo(e, chon) && (
        <span className="flex basis-full flex-wrap items-center gap-2">
          <input className={`field h-[34px] w-[360px] max-w-full text-sm ${loi === t('Ghi lý do ngắn') ? 'border-late-line' : ''}`} autoComplete="off" name={`ly-do-${e.studentId}`} placeholder={t('Lý do')} aria-label={t('Lý do · {ten}', { ten: e.ten })}
            aria-invalid={loi === t('Ghi lý do ngắn')} maxLength={2000} value={chon.lyDo} disabled={busy} onChange={(ev) => onChon({ ...chon, lyDo: ev.target.value })} />
        </span>
      )}
      {loi && <span role="alert" className="basis-full text-xs font-semibold text-late"><span aria-hidden>⚠ </span>{loi}</span>}
    </div>
  );
}

/** GVCN lớp mới (khung 6): một ô nhận xét không bắt buộc — rời ô thì lưu, "✓ Đã lưu" / lỗi ngay cạnh, chữ đang gõ không mất. */
function NhanXetGvcn({ e, classId }: { e: EmXetLai; classId: number }) {
  const [chu, setChu] = useState(e.nhanXetGvcnMoi ?? '');
  const [luu, setLuu] = useState<'cho' | 'dang' | 'da' | { loi: string }>(e.nhanXetGvcnMoi ? 'da' : 'cho');
  const [cu, setCu] = useState(e.nhanXetGvcnMoi ?? '');
  const ghi = async () => {
    if (chu.trim() === cu.trim()) return;
    setLuu('dang');
    try { await api.put(`/classes/${classId}/xet-lai/${e.studentId}/nhan-xet`, { nhanXet: chu.trim() || null }); setCu(chu); setLuu('da'); }
    catch (err: any) { setLuu({ loi: err?.message ?? t('Không lưu được') }); }
  };
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-dashed px-3.5 pb-3 pt-2.5 pl-[42px] max-sm:pl-3.5" style={{ borderColor: 'var(--line)' }}>
      <span className="text-[13px] text-slate-400">{t('Nhận xét 2 tuần đầu')}</span>
      <input className="field h-[34px] w-[340px] max-w-full text-sm" autoComplete="off" name={`nhan-xet-${e.studentId}`} aria-label={t('Nhận xét của GVCN lớp mới')} maxLength={1000} value={chu}
        onChange={(ev) => { setChu(ev.target.value); if (luu !== 'dang') setLuu('cho'); }} onBlur={ghi} />
      <span role="status" className="text-[13px]">
        {luu === 'dang' ? <span className="text-slate-400">{t('Đang lưu…')}</span> : luu === 'da' && chu.trim() === cu.trim() && cu ? <span className="text-slate-400">✓ {t('Đã lưu')}</span>
          : typeof luu === 'object' ? <span className="text-late">{luu.loi} <button type="button" className="link border-0 bg-transparent p-0" onClick={ghi}>{t('Thử lại')}</button></span> : null}
      </span>
    </div>
  );
}

/** Chip vàng "Xét lại" (mockup `.chip-xl`) — chip nhà `Nhan`. */
export function ChipXetLai({ onClick }: { onClick?: () => void }) {
  return <Nhan tone="soon" onClick={onClick}>{t('Xét lại')}</Nhan>;
}

/** Hồ sơ lớp: em nào đang có dòng Xét lại (chip trên dòng em) — cùng dữ liệu panel; bấm chip mở panel một em. */
export const XetLaiCtx = createContext<{ co: ReadonlySet<number>; mo: (sid: number) => void } | null>(null);
export function ChipXetLaiDong({ sid }: { sid: number }) {
  const c = useContext(XetLaiCtx);
  if (!c?.co.has(sid)) return null;
  return <ChipXetLai onClick={() => c.mo(sid)} />;
}

/** Hồ sơ HV (mockup khung 1c): dải vàng "Xét lại lộ trình · {lý do} · hạn …  Xét lại ›" — bấm mở panel đúng em đó tại trang. */
export function DaiXetLai({ classId, studentId }: { classId: number; studentId: number }) {
  const { data, reload } = useApi<DuLieu>(duongXetLai(classId, studentId), [classId, studentId]);
  const [mo, setMo] = useState(false);
  const e = data?.em.find((x) => x.studentId === studentId && !x.quyetDinh);
  if (!e) return null;
  return (
    <>
      <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border px-3 py-2 text-sm" style={KHOI_VANG}>
        <b className="shrink-0 text-slate-100">{t('Xét lại lộ trình')}</b>
        <span className="min-w-0 text-slate-300 max-sm:basis-full">{e.lyDo.chu}{e.daChot.chu ? ` · ${e.daChot.chu}` : ''}</span>
        <ChipHan loai="viec-van-hanh" han={e.han} />
        <button type="button" className="btn btn-sm ml-auto min-h-[44px] sm:min-h-0" onClick={() => setMo(true)}>{data!.chiXem ? t('Xem') : t('Xét lại')}</button>
      </div>
      {mo && <PanelXetLai classId={classId} studentId={studentId} onClose={() => { setMo(false); reload(); }} />}
    </>
  );
}
