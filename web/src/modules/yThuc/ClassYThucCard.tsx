import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { BoLocDoan, Card, Empty, ErrorState, LoiTaiNho, Skeleton } from '../../ui/ui.tsx';
import { Menu } from '../../ui/Menu.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { addDaysIso, locCanLam, ngay, quaHanChiXem, tvvChinhCuaLop, type NhomEm } from '@shared/domain/index.ts';
import { usePanelYThuc, type PanelYThuc } from './panelYThuc.tsx';
import { ChiTietViPham } from './ChiTietViPham.tsx';
import { PhoiHopSosSection, type CoordTurn } from './PhoiHopSosSection.tsx';
import { ThangYThuc } from './ThangYThuc.tsx';
import { BadgeViec, CanLamEm, ChipLoc } from './khoiYThuc.tsx';
import { BaoPhDu, ChipBac, DauCot, KhoiLan, NhomLan, OBaoPh, OBuoc, type VpDong } from './BangLan.tsx';
import { DUONG_LAM_MOI_Y_THUC, type BangLo, type BangYThucLop, type BaoPhLan, type DongEm, type DongThoiGianYt, type KqEm, type XuLyView, type YThucHocVien } from './kieu.ts';
import { CO_LO, LoYThucPanel, guiTheoLo, type ViecLo } from './LoYThucPanel.tsx';
import { OChon, ThanhChonNhieu, useChonNhieu } from '../students/chonNhieuHocVien.tsx';
import { PanelBaoPhTvv, gioVnNay, lucVn } from '../congViec/PanelBaoPhTvv.tsx';
import { PanelDuyet } from '../duyet/HopChoDuyet.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { NutChu } from '../../ui/KhuonViec.tsx';
import { dich, dichChu, t } from '@shared/i18n/index.ts';

/**
 * TAB `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ LỚP — Y-THUC-V2 (mockup `thiet-ke/2026-11-11-y-thuc-v2/y-thuc-v2.html` K1 · K2 · K6 · K9, chủ SP duyệt 11/11).
 *
 *   Đầu thẻ: phân đoạn `Vi phạm | Phối hợp SOS` · trong Vi phạm `Cần làm | Lịch sử` · phải: Điểm Mock Test › · + Ghi vi phạm · Khai / sửa cấp bậc · Chọn nhiều.
 *   MỘT LẦN = MỘT KHỐI, MỘT VI PHẠM = MỘT DÒNG (`BangLan.tsx`): ① Vi phạm → ② GVCN xử lý → ③ TVV báo PH (đúng LẦN, đọc được Nội dung) → Bước tiếp
 *   (một nút đúng vai; không phải việc của mình thì "Chờ …"). Nhóm Cần làm: Bắt buộc xử lý (kể cả QL từ chối) › Mới, chưa xem › Chờ QL duyệt
 *   (đề xuất + xin thu hồi) › Chờ TVV báo PH › Xong · 7 ngày. Một em có thể ở hai nhóm (hai lần khác nhau).
 *   Lịch sử (K6, cùng kiểu dòng): Đã xem · Đã xử lý · Đã thu hồi (chủ SP 11/11: không lẫn Chờ QL / QL từ chối) · phạm vi Lộ trình | Cả lịch sử · tìm em.
 *   Bấm tên vi phạm → mở tại chỗ (mô tả, bằng chứng, Sửa · Xoá); rê → hộp thông tin. Bấm ô ② → Xem lần xử lý (Thu hồi… ở đó). Chip bậc → thang + Khai bậc.
 *   Phối hợp SOS: mọi lượt (không đổi).
 *
 * Việc / thông báo mở `?tab=y-thuc&hv={id}&mo=xu-ly` (hoặc `mo=khai`, `mo=da-thuc-hien&xl={id}`, `mo=cap-bac&em=…`) → cuộn tới em + panel (một lần);
 * `?sub=phoi-hop` mở phân đoạn Phối hợp. GVBM (K2-39): đọc được, không nút xử lý; vẫn có `+ Ghi vi phạm`.
 */
/** `thuong`: lớp thường — "Phối hợp" (không có chữ SOS); lớp FT: "Phối hợp SOS" (chủ sản phẩm 02/10). `onDiemMt`: sang tab Học viên, mở bảng điểm (#29). */
export function ClassYThucCard({ classId, thuong = false, onDiemMt }: { classId: number; thuong?: boolean; onDiemMt?: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  /* Phạm vi Lịch sử (X08) lọc tại trình duyệt theo cờ `trongChuoi` — đổi không đọc lại bảng lớp. */
  const [phamVi, setPhamVi] = useState<'chuoi' | 'tat-ca'>('chuoi');
  const board = useApi<BangYThucLop>(`/classes/${classId}/y-thuc`, [classId], { giuCu: true });
  const roster = useApi<any[]>(`/classes/${classId}/roster`);
  const [includeDone, setIncludeDone] = useState(false);
  const coord = useApi<{ rows: CoordTurn[]; pendingCount: number }>(`/classes/${classId}/phoi-hop-sos${includeDone ? '?includeDone=1' : ''}`, [classId, includeDone]);
  /* Phân đoạn ghi vào địa chỉ (`sub`, `doan`) — sang hồ sơ em rồi Quay lại về đúng chỗ. */
  const phan: 'vi-pham' | 'phoi-hop' = params.get('sub') === 'phoi-hop' ? 'phoi-hop' : 'vi-pham';
  const doan: 'can-lam' | 'lich-su' = params.get('doan') === 'lich-su' ? 'lich-su' : 'can-lam';
  const doiDoan = (o: { phan?: 'vi-pham' | 'phoi-hop'; doan?: 'can-lam' | 'lich-su' }) => {
    const q = new URLSearchParams(params);
    if (o.phan) { if (o.phan === 'phoi-hop') q.set('sub', 'phoi-hop'); else q.delete('sub'); }
    if (o.doan) { if (o.doan === 'lich-su') q.set('doan', 'lich-su'); else q.delete('doan'); }
    setParams(q, { replace: true });
  };
  const setPhan = (p: 'vi-pham' | 'phoi-hop') => doiDoan({ phan: p });
  const setDoan = (x: 'can-lam' | 'lich-su') => doiDoan({ doan: x });
  const [loc, setLoc] = useState<LocLs>('tat-ca');
  const [tim, setTim] = useState('');
  /* "Lịch sử của em ›": lọc đúng một em (theo id, không theo chuỗi tên). */
  const [lsEm, setLsEm] = useState<{ id: number; ten: string } | null>(null);
  const [moHv, setMoHv] = useState<number | null>(() => Number(params.get('hv')) || null);
  /* Mở tại chỗ: vi phạm (`khối:id`) · Báo PH đủ (id việc). */
  const [moVp, setMoVp] = useState<string | null>(null);
  const [moDu, setMoDu] = useState<number | null>(null);
  const chonN = useChonNhieu();
  const lo = useApi<BangLo>(chonN.bat ? `/classes/${classId}/y-thuc/lo` : null, [chonN.bat, classId]);
  const [loMo, setLoMo] = useState<{ viec: ViecLo; ids: number[] | null } | null>(null);
  const [ghiNhanKq, setGhiNhanKq] = useState<KqEm[] | null>(null);
  const [busyLo, setBusyLo] = useState(false);
  const [baoPh, setBaoPh] = useState<{ viecId: number; studentId: number; ten: string; han: string } | null>(null);
  const [duyet, setDuyet] = useState<{ id: number; thuHoi: boolean; moSan: 'duyet' | 'tu-choi' } | null>(null);
  const [dangGhi, setDangGhi] = useState<number | null>(null);
  /* F03: em vừa "Đã xem" — hàng ở lại nhóm Mới (Hoàn tác · Xem lại), không chỉ toast. */
  const [vuaXem, setVuaXem] = useState<Record<number, { x: DongEm; ids: number[]; luc: string }>>({});
  /* Dòng Lịch sử vừa thao tác (đến từ "Xem lại") — sáng. */
  const [lsVua, setLsVua] = useState<number[]>([]);
  /* Em vừa Xác nhận xử lý: lần mới nhất của em sáng xanh. */
  const [vuaLuu, setVuaLuu] = useState<{ sid: number; luc: string } | null>(null);
  const dangXuLy = useRef<number | null>(null);

  const lamMoi = () => { board.reload(); lo.reload(); };
  const { mo: moPanel, panels } = usePanelYThuc({
    maLop: board.data?.classCode ?? null,
    onDone: () => { if (dangXuLy.current) setVuaLuu({ sid: dangXuLy.current, luc: gioVnNay() }); lamMoi(); },
    roster: (roster.data ?? []).map((r: any) => ({ id: r.id, name: r.fullName, code: r.studentCode ?? null })),
  });
  /* Chỉ Xác nhận xử lý (không phải Đề xuất) làm lần mới sáng "vừa lưu". */
  const mo = (p: PanelYThuc) => { dangXuLy.current = p?.loai === 'xu-ly' && p.cheDo !== 'de-xuat' ? p.studentId : null; moPanel(p); };

  /* Việc / thông báo: `?hv=` cuộn tới em, `?mo=` mở panel đúng một lần rồi gỡ khỏi địa chỉ (quay lại không mở lại). */
  useEffect(() => {
    const hv = Number(params.get('hv')) || null;
    const moGi = params.get('mo');
    if (hv) setMoHv(hv);
    if (hv && moGi === 'xu-ly') mo({ loai: 'xu-ly', studentId: hv });
    if (hv && moGi === 'khai') mo({ loai: 'khai', studentId: hv });   // PR-VAI-a (K1-15): việc "Xác nhận cấp bậc vi phạm HV cũ"
    const xl = Number(params.get('xl')) || null;
    if (moGi === 'da-thuc-hien' && xl) mo({ loai: 'da-thuc-hien', id: xl });
    /* Rà #408 (5): đúng các em của việc "Xác nhận cấp bậc" (em mới vào web) — không phải mọi em chưa xác nhận của lớp. */
    if (moGi === 'cap-bac') {
      /* KHAI-BAC-LO: không kèm `em` → mọi em của lớp (nút "Khai / sửa cấp bậc"). */
      const em = (params.get('em') ?? '').split(',').map(Number).filter((x) => x > 0);
      setLoMo({ viec: 'cap-bac', ids: em.length ? em : null });
    }
    if (moGi || params.get('loc')) {
      const p = new URLSearchParams(params); p.delete('mo'); p.delete('xl'); p.delete('loc'); p.delete('em');
      setParams(p, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get('hv'), params.get('mo')]);

  const d = board.data;
  /* Mở từ việc: cuộn tới em khi bảng đã có. */
  const daCuon = useRef(false);
  useEffect(() => {
    if (!d || daCuon.current) return;
    daCuon.current = true;
    if (moHv) cuonToi(document.getElementById(`yt-em-${moHv}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);

  /* Dữ liệu đã nạp → bản đồ tra (không thêm request). */
  const tra = useMemo(() => {
    if (!d) return null;
    const vp = new Map<number, VpDong>();
    const xl = new Map<number, XuLyDong>();
    for (const x of d.dongThoiGian) {
      if (x.loai === 'vi-pham') vp.set(x.id, { id: x.id, ngay: x.ngay, ten: x.viPham, skill: x.skill ?? null, nhom: x.nhom, nguoiGhi: x.nguoiGhi, moTa: x.moTa ?? '', nhanTrangThai: x.nhanTrangThai });
      else xl.set(x.id, x);
    }
    const em = new Map<number, DongEm>();
    for (const ds of [...Object.values(d.nhom), d.choBaoPh, d.choThuHoi]) for (const x of ds) em.set(x.studentId, x);
    return { vp, xl, em };
  }, [d]);
  if (board.error && !d) return <ErrorState message={board.error.message} hint={board.error.hint} status={board.error.status} onRetry={board.reload} />;
  if (!d || !tra) return <Card title={t('Ý thức & Phối hợp')}><Skeleton rows={4} /></Card>;

  /* OV-13d: em chưa có vi phạm nhưng còn phải xác nhận cấp bậc (em mới vào web) — chỉ hiện khi Chọn nhiều. */
  const chuaKhai = (lo.data?.em ?? []).filter((x) => !x.nhom && x.capBac.duoc && x.capBac.khai === null);
  const daChon = (lo.data?.em ?? []).filter((x) => chonN.chon.has(x.studentId));
  const dem = (v: ViecLo) => daChon.filter((x) => (v === 'xu-ly' ? x.xuLy : v === 'ghi-nhan' ? x.ghiNhan : x.capBac).duoc).length;
  /* Đã xem theo lô là việc ngắn: làm ngay từ thanh, không panel; Hoàn tác = Bỏ xem đúng các vi phạm vừa xem. */
  const ghiNhanLo = async () => {
    setBusyLo(true);
    const tatCa: KqEm[] = [];
    try {
      await guiTheoLo(daChon.filter((x) => x.ghiNhan.duoc).map((x) => x.studentId), CO_LO['ghi-nhan'],
        (lo) => api.post<{ em: KqEm[] }>(`/classes/${classId}/y-thuc/lo/ghi-nhan`, { studentIds: lo }), (em) => { tatCa.push(...em); setGhiNhanKq([...tatCa]); });
    } catch (e: any) { toast.push('error', e.message); } finally {
      setBusyLo(false);
      const loi = tatCa.filter((x) => !x.ok);
      if (loi.length) toast.push('error', loi.map((x) => `${x.ten}: ${x.loi ? dichChu(x.loi) : ''}`).join(' · '));
      DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x));
      lamMoi();
    }
  };
  const hoanTacGhiNhan = async () => {
    const ok = (ghiNhanKq ?? []).filter((x) => x.ok && x.ids?.length);
    setBusyLo(true);
    const r = await Promise.allSettled(ok.map((x) => api.post(`/students/${x.studentId}/y-thuc/bo-ghi-nhan`, { violationIds: x.ids })));
    setBusyLo(false);
    if (r.some((x) => x.status === 'rejected')) toast.push('error', t('{n} em chưa hoàn tác được — thử lại.', { n: r.filter((x) => x.status === 'rejected').length }));
    setGhiNhanKq(null);
    DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x));
    lamMoi();
  };
  const okGhiNhan = (ghiNhanKq ?? []).filter((x) => x.ok);

  /* Đã xem / Bỏ xem (N34; OV-7a: bấm nhầm → vi phạm về Mới) — một hoặc nhiều vi phạm của MỘT em; nút của em đang gửi bị khoá. */
  const daXem = async (x: DongEm | null, studentId: number, ids: number[], bo = false) => {
    setDangGhi(studentId);
    try {
      await api.post(`/students/${studentId}/y-thuc/${bo ? 'bo-ghi-nhan' : 'ghi-nhan'}`, { violationIds: ids });
      DUONG_LAM_MOI_Y_THUC.forEach((p) => invalidate(p));
      setVuaXem((c) => {
        const { [studentId]: _cu, ...con } = c;
        return bo || !x ? con : { ...con, [studentId]: { x: { ...x, viPhamCho: x.viPhamCho.filter((v) => ids.includes(v.id)) }, ids, luc: gioVnNay() } };
      });
      if (bo) { toast.push('ok', t('Đã bỏ xem')); setLsVua((c) => c.filter((id) => !ids.includes(id))); }
      lamMoi();
    } catch (e: any) { toast.push('error', e.message); }
    finally { setDangGhi(null); }
  };
  const xemLai = (ids: number[]) => { doiDoan({ phan: 'vi-pham', doan: 'lich-su' }); setLoc('da-xem'); setTim(''); setLsEm(null); setLsVua(ids); };
  const lichSuEm = (sid: number, ten: string) => { doiDoan({ phan: 'vi-pham', doan: 'lich-su' }); setLoc('tat-ca'); setTim(''); setLsEm({ id: sid, ten }); };

  const tvvChinh = tvvChinhCuaLop((roster.data ?? []).filter((r: any) => !r.archived));
  const vpCua = (ids: readonly number[], du?: DongEm['viPhamCho']) => ids.map((id): VpDong => tra.vp.get(id)
    ?? (() => { const v = du?.find((u) => u.id === id); return { id, ngay: v?.ngay ?? '', ten: v?.ten ?? '', skill: null, nhom: null, nguoiGhi: null, moTa: '' }; })());
  const xemXl = (id: number) => mo({ loai: 'xem', id });
  const ghiBaoPh = (sid: number, b: BaoPhLan) => setBaoPh({ viecId: b.id, studentId: sid, ten: tra.em.get(sid)?.ten ?? '', han: b.han });

  /* ---------------- Một khối lần ---------------- */
  const daCoId = new Set<number>();
  const khoi = (o: { key: string; sid: number; ten: string; vp: VpDong[]; gv: ReactNode; ph: ReactNode; tiep: ReactNode; nen?: 'mo' | 'vua'; b?: BaoPhLan | null; chon?: boolean; moiIds?: number[] }) => {
    const em = tra.em.get(o.sid);
    const dau = !daCoId.has(o.sid); daCoId.add(o.sid);
    const tvv = em?.tvv && em.tvv !== tvvChinh ? em.tvv : null;
    const hv = (
      <span className="flex min-w-0 items-start gap-2">
        {o.chon && chonN.bat && <OChon chon={chonN} id={o.sid} ten={o.ten} />}
        <span className="min-w-0">
          <Link className="block text-[15px] font-semibold text-slate-100 no-underline hover:text-[color:var(--accent)] hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center" to={`/hoc-vien/${o.sid}?tab=y-thuc`}>{o.ten}</Link>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <ChipBac nhan={em?.bacNhan ?? null} ten={o.ten}>{(dong) => <ThangEm sid={o.sid} ten={o.ten} homNay={homNay} onKhai={() => { dong(); mo({ loai: 'khai', studentId: o.sid }); }} onLichSu={() => { dong(); lichSuEm(o.sid, o.ten); }} />}</ChipBac>
            {tvv && <span>{t('TVV {ten}', { ten: tvv })}</span>}
          </span>
        </span>
      </span>
    );
    const nen = o.nen ?? (moHv === o.sid ? 'mo' : undefined);
    const moId = moVp?.startsWith(`${o.key}:`) ? Number(moVp.slice(o.key.length + 1)) : null;
    const chiTietVp = (v: VpDong) => (
      <div className="space-y-2">
        <ChiTietViPham violationId={v.id} onSua={(vv) => mo({ loai: 'sua', v: vv, studentName: o.ten })}
          onDaXoa={() => { setMoVp(null); lamMoi(); }} onMoXuLy={xemXl} />
        {o.moiIds && o.moiIds.length > 1 && o.moiIds.includes(v.id) && em && (
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangGhi === o.sid} onClick={() => void daXem(em, o.sid, [v.id])}>{t('Đã xem vi phạm này')}</button>
        )}
      </div>
    );
    return (
      <KhoiLan key={o.key} id={dau ? `yt-em-${o.sid}` : undefined} hv={hv} vp={o.vp} gv={o.gv} ph={o.ph} tiep={o.tiep} nen={nen} homNay={homNay}
        moVp={moId} onMoVp={(id) => setMoVp((c) => (c === `${o.key}:${id}` ? null : `${o.key}:${id}`))} chiTietVp={chiTietVp}
        duoi={o.b && moDu === o.b.id ? <BaoPhDu id={o.b.id} homNay={homNay} onSuaHan={() => ghiBaoPh(o.sid, o.b!)} /> : undefined} />
    );
  };
  const ph = (sid: number, b: BaoPhLan | null | undefined) => (
    <OBaoPh b={b} homNay={homNay} tvv={b?.trangThai === 'mo' ? null : tra.em.get(sid)?.tvv ?? null} moDu={!!b && moDu === b.id}
      onXemDu={b ? () => setMoDu((c) => (c === b.id ? null : b.id)) : undefined} />
  );
  const choAi = (vai: string, ten: string | null) => <span className="text-[13px] text-slate-500">{t('Chờ {vai}', { vai })}{ten && <> <b className="whitespace-nowrap font-semibold text-slate-300">{ten}</b></>}</span>;
  const nutChinh = (chu: string, ten: string, onClick: () => void, vien = false) => (
    <button type="button" className={`btn w-full justify-center max-sm:h-11 ${vien ? '' : 'btn-primary'}`} aria-label={`${chu} · ${ten}`} onClick={onClick}>{chu}</button>
  );
  const nutPhu = (ds: [string, () => void][], ten: string) => (
    <span className="mt-1 flex justify-center gap-3">
      {ds.map(([chu, f]) => <button key={chu} type="button" aria-label={`${chu} · ${ten}`} onClick={f} className="link min-h-[30px] appearance-none border-0 bg-transparent px-1 text-[13px] font-semibold max-sm:min-h-[44px]">{chu}</button>)}
    </span>
  );
  const oXl = (x: XuLyDong) => x.status === 'thu_hoi'
    ? <OBuoc badge={<BadgeViec xuong tong="xam" title={t('Xem lần xử lý')} onClick={() => xemXl(x.id)}>{t('Đã thu hồi')}</BadgeViec>} phu={[dich(x.nhan)]} />
    : <OBuoc badge={<BadgeViec xuong tong="xong" title={t('Xem lần xử lý')} onClick={() => xemXl(x.id)}>{dich(x.nhan)} · {ngay(x.ngay, homNay)}</BadgeViec>} phu={[t('Đã xử lý'), x.soTep ? t('{soTep} tệp', { soTep: x.soTep }) : null]} />;

  /* ---------------- Cần làm (K1) ---------------- */
  const tuNgay = addDaysIso(homNay, -6);
  const thuHoiCho = new Set<number>();
  const emThuHoi = [...d.nhom.da_xu_ly.filter((x) => x.thuHoi?.cho), ...d.choThuHoi];
  for (const x of emThuHoi) thuHoiCho.add(x.thuHoi!.id);
  const xls = d.dongThoiGian.filter((x): x is XuLyDong => x.loai === 'xu-ly');
  /* P1 G3-1: em chỉ quá hạn "xem" (không vi phạm bắt buộc) về nhóm Mới, giữ "Đã xem" — cùng việc "Xem vi phạm mới" của Công việc. */
  const nhomBb = [...d.nhom.qua_han.filter((x) => !quaHanChiXem('qua_han', x)).map((x) => ({ x, k: 'qua_han' as NhomEm })), ...d.nhom.bat_buoc.map((x) => ({ x, k: 'bat_buoc' as NhomEm }))];
  const moiDs = [...d.nhom.qua_han.filter((x) => quaHanChiXem('qua_han', x)), ...d.nhom.moi];
  const conMoi = new Set(moiDs.map((x) => x.studentId));
  const vua = Object.entries(vuaXem).filter(([sid]) => !conMoi.has(Number(sid))).map(([, v]) => v);
  /* G3-14: việc Báo PH đang mở gắn với lần xử lý — cả việc "Báo lại PH" của lần đã thu hồi (cùng việc của TVV ở Công việc). */
  const phMo = (x: XuLyDong) => (x.status === 'thu_hoi' ? x.baoLai : x.baoPh) ?? null;
  const choTvv = xls.filter((x) => (x.status === 'done' || x.status === 'thu_hoi') && phMo(x)?.trangThai === 'mo' && !thuHoiCho.has(x.id));
  const xong7 = xls.filter((x) => x.status === 'done' && x.baoPh?.trangThai !== 'mo' && x.ngay >= tuNgay && !thuHoiCho.has(x.id));
  const moiNhatEm = new Map<number, number>();
  for (const x of xls) if (x.status === 'done' && !moiNhatEm.has(x.studentId)) moiNhatEm.set(x.studentId, x.id);

  /*
   * Rà 11/11 G3-14: số "Cần làm" = số EM có việc của CHÍNH người xem (cùng tập Công việc "Của tôi" — dữ liệu đã nạp, không thêm request): GVCN của lớp
   * xử lý / xem / ghi Đã thực hiện · QL duyệt · người giữ Báo PH (TVV của em; em chưa có TVV → QL) ghi Báo PH. MỘT em MỘT dòng: dòng không phải việc của người xem bị ẩn khi em đã có dòng là việc của người xem;
   * "Xong · 7 ngày" ẩn khi em còn dòng ở nhóm khác.
   */
  const laGvcn = !!d.laGvcn;
  const giuPh = (sid: number, measureId: number | undefined) => { const x = measureId ? tra.xl.get(measureId) : undefined; return !!tra.em.get(sid)?.giuBaoPh && !!x && phMo(x)?.trangThai === 'mo'; };
  const viecDx = (x: (typeof d.nhom.cho_duyet)[number]) => !!x.deXuat && ((x.deXuat.status === 'cho_duyet' ? d.coTheDuyet : laGvcn) || giuPh(x.studentId, x.deXuat.id));
  const choDuyetDx = d.nhom.cho_duyet.filter((x) => x.deXuat);
  const gan = <T,>(ds: T[], sid: (x: T) => number, cuaToi: (x: T) => boolean) => ds.map((x, i) => ({ i, sid: sid(x), cuaToi: cuaToi(x) }));
  const canLam = locCanLam([
    gan(nhomBb, (o) => o.x.studentId, (o) => laGvcn && !o.x.deXuat), gan(moiDs, (x) => x.studentId, () => laGvcn),
    gan(choDuyetDx, (x) => x.studentId, viecDx), gan(emThuHoi, (x) => x.studentId, (x) => d.coTheDuyet || giuPh(x.studentId, x.thuHoi?.id)),
    gan(choTvv, (x) => x.studentId, (x) => giuPh(x.studentId, x.id)),
  ], xong7.map((x, i) => ({ i, sid: x.studentId })));
  const nhomBbHien = canLam.nhom[0].map((m) => nhomBb[m.i]);
  const moiHien = canLam.nhom[1].map((m) => moiDs[m.i]);
  const choDuyetHien = canLam.nhom[2].map((m) => choDuyetDx[m.i]);
  const thuHoiHien = canLam.nhom[3].map((m) => emThuHoi[m.i]);
  const choTvvHien = canLam.nhom[4].map((m) => choTvv[m.i]);
  const xong7Hien = canLam.xong.map((m) => xong7[m.i]);

  const kBb = nhomBbHien.map(({ x, k }) => {
    const vp = x.viPhamCho.filter((v) => v.trangThai !== 'cho_duyet');
    const gv = (
      <span className="flex flex-col items-start gap-[5px]">
        {x.tuChoi && <><BadgeViec xuong tong="qua" title={t('Xem lần xử lý')} onClick={() => xemXl(x.tuChoi!.id)}>{t('QL từ chối')}</BadgeViec><span className="text-xs text-slate-400">{dich(x.tuChoi.nhan)}</span></>}
        <CanLamEm x={{ ...x, nhom: k, deXuat: null }} homNay={homNay} hanDuoi />
        <span className="text-xs text-slate-400">{t('Lần này')} <b className="font-semibold text-slate-100">{dich(x.keTiep.nhan)}</b></span>
      </span>
    );
    const tiep = d.canManage && !x.deXuat
      ? <>{nutChinh(t('Xác nhận xử lý'), x.ten, () => mo({ loai: 'xu-ly', studentId: x.studentId }))}{nutPhu([[t('Đề xuất QL duyệt'), () => mo({ loai: 'xu-ly', studentId: x.studentId, cheDo: 'de-xuat' })]], x.ten)}</>
      : choAi('GVCN', d.gvcn);
    return khoi({ key: `bb${x.studentId}`, sid: x.studentId, ten: x.ten, vp: vpCua(vp.map((v) => v.id), vp), gv, ph: null, tiep, chon: true });
  });
  const kMoi = [
    ...moiHien.map((x) => {
      const ids = x.viPhamCho.filter((v) => v.trangThai === 'moi' || v.trangThai === 'qua_han').map((v) => v.id);
      const tiep = d.canManage && ids.length
        ? <>
            <button type="button" className="btn w-full justify-center max-sm:h-11" style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'transparent' }} disabled={dangGhi === x.studentId}
              aria-label={`${t('Đã xem · {n}', { n: ids.length })} · ${x.ten}`} title={t('Đã xem, chưa cần xử lý')} onClick={() => void daXem(x, x.studentId, ids)}>
              {dangGhi === x.studentId ? t('Đang lưu…') : t('Đã xem · {n}', { n: ids.length })}
            </button>
            {nutPhu([[t('Xác nhận xử lý'), () => mo({ loai: 'xu-ly', studentId: x.studentId })]], x.ten)}
          </>
        : choAi('GVCN', d.gvcn);
      return khoi({ key: `moi${x.studentId}`, sid: x.studentId, ten: x.ten, vp: vpCua(x.viPhamCho.map((v) => v.id), x.viPhamCho), gv: <CanLamEm x={{ ...x, nhom: x.quaHanNgay ? 'qua_han' : 'moi', deXuat: null }} homNay={homNay} hanDuoi />,
        ph: null, tiep, chon: true, moiIds: ids });
    }),
    ...vua.map((v) => khoi({
      key: `vua${v.x.studentId}`, sid: v.x.studentId, ten: v.x.ten, vp: vpCua(v.ids, v.x.viPhamCho), nen: 'vua',
      gv: <b role="status" className="text-sm font-semibold text-ok">✓ {t('Đã xem {n} vi phạm · {gio}', { n: v.ids.length, gio: v.luc })}</b>, ph: null,
      tiep: <span className="flex gap-3.5">
        <button type="button" className="link min-h-[30px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]" disabled={dangGhi === v.x.studentId} aria-label={`${t('Hoàn tác')} · ${v.x.ten}`} onClick={() => void daXem(null, v.x.studentId, v.ids, true)}>{t('Hoàn tác')}</button>
        <button type="button" className="link min-h-[30px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]" aria-label={`${t('Xem lại')} · ${v.x.ten}`} onClick={() => xemLai(v.ids)}>{t('Xem lại')}</button>
      </span>,
    })),
  ];
  const kChoQl = [
    ...choDuyetHien.map((x) => {
      const dx = x.deXuat!;
      const xl = tra.xl.get(dx.id);
      const vpDx = x.viPhamCho.filter((v) => v.trangThai === 'cho_duyet');
      const gv = <OBuoc badge={<BadgeViec xuong tong="dang" title={t('Xem đề xuất')} onClick={() => xemXl(dx.id)}>{dx.status === 'da_duyet' ? t('QL đã duyệt {nhan}', { nhan: dich(dx.nhan) }) : t('Đề xuất {nhan} · chờ QL', { nhan: dich(dx.nhan) })}</BadgeViec>}
        phu={[dx.han ? (dx.status === 'da_duyet' ? t('thực hiện trước {ngay}', { ngay: ngay(dx.han, homNay) }) : t('QL trả lời trước {ngay}', { ngay: ngay(dx.han, homNay) })) : null]} />;
      const tiep = dx.status === 'cho_duyet' && d.coTheDuyet
        ? <>{nutChinh(t('Duyệt'), x.ten, () => setDuyet({ id: dx.id, thuHoi: false, moSan: 'duyet' }))}{nutPhu([[t('Từ chối…'), () => setDuyet({ id: dx.id, thuHoi: false, moSan: 'tu-choi' })], [t('Xem'), () => xemXl(dx.id)]], x.ten)}</>
        : dx.status === 'da_duyet' && d.canManage
          ? <>{nutChinh(t('Đánh dấu đã thực hiện'), x.ten, () => mo({ loai: 'da-thuc-hien', id: dx.id }))}{nutPhu([[t('Xem'), () => xemXl(dx.id)]], x.ten)}</>
          : dx.status === 'da_duyet' ? choAi('GVCN', d.gvcn) : choAi('QL', null);
      return khoi({ key: `dx${dx.id}`, sid: x.studentId, ten: x.ten, vp: vpCua(xl?.viPhamIds ?? vpDx.map((v) => v.id), x.viPhamCho), gv, ph: ph(x.studentId, xl?.baoPh), tiep, chon: true, b: xl?.baoPh });
    }),
    ...thuHoiHien.map((x) => {
      const id = x.thuHoi!.id;
      const xl = tra.xl.get(id);
      const gv = <OBuoc badge={<BadgeViec xuong tong="dang" title={t('Xem lần xử lý')} onClick={() => xemXl(id)}>{t('Xin thu hồi {nhan}', { nhan: dich(x.thuHoi!.nhan) })}</BadgeViec>} phu={[t('chờ QL')]} />;
      const tiep = d.coTheDuyet
        ? <>{nutChinh(t('Duyệt thu hồi'), x.ten, () => setDuyet({ id, thuHoi: true, moSan: 'duyet' }))}{nutPhu([[t('Từ chối…'), () => setDuyet({ id, thuHoi: true, moSan: 'tu-choi' })], [t('Xem'), () => xemXl(id)]], x.ten)}</>
        : choAi('QL', null);
      return khoi({ key: `th${id}`, sid: x.studentId, ten: x.ten, vp: vpCua(xl?.viPhamIds ?? x.viPhamCho.map((v) => v.id), x.viPhamCho), gv, ph: ph(x.studentId, xl?.baoPh), tiep, b: xl?.baoPh });
    }),
  ];
  const kTvv = choTvvHien.map((x) => {
    const b = phMo(x)!;
    const tvv = tra.em.get(x.studentId)?.tvv ?? null;
    const tiep = b.coTheGhi ? nutChinh(t('Ghi kết quả báo PH'), x.ten, () => ghiBaoPh(x.studentId, b), d.canManage) : choAi('TVV', tvv);
    return khoi({ key: `tvv${x.id}`, sid: x.studentId, ten: x.ten, vp: vpCua(x.viPhamIds), gv: oXl(x), tiep, b,
      /* G3-14: việc báo lại sau thu hồi — cùng ô ③, nhãn nói rõ vì sao TVV gọi lại PH. */
      ph: x.status === 'thu_hoi' ? <span className="flex flex-col items-start gap-1"><span className="text-xs font-semibold text-slate-400">{t('Báo lại · đã thu hồi')}</span>{ph(x.studentId, b)}</span> : ph(x.studentId, b) });
  });
  const kXong = xong7Hien.map((x) => khoi({
    key: `xong${x.id}`, sid: x.studentId, ten: x.ten, vp: vpCua(x.viPhamIds), gv: oXl(x), ph: ph(x.studentId, x.baoPh), b: x.baoPh,
    tiep: <span className="text-[13px] text-slate-500">✓ {t('Xong')}</span>,
    nen: vuaLuu?.sid === x.studentId && moiNhatEm.get(x.studentId) === x.id ? 'vua' : undefined,
  }));
  const soVp = (ds: { viPhamCho: unknown[] }[]) => ds.reduce((s, x) => s + x.viPhamCho.length, 0);
  const soCanLam = canLam.soEm;
  const coHang = kBb.length + kMoi.length + kChoQl.length + kTvv.length + kXong.length > 0;
  const iBaoPh = <NutLuat label={t('Báo PH sinh khi nào')}>{t('GVCN lưu xử lý (kể cả đề xuất chờ QL) → TVV của em có việc Báo PH, hạn 5 ngày. TVV ghi Nội dung: đã báo gì, PH nói gì.')}</NutLuat>;

  /* ---------------- Lịch sử (K6) — cùng kiểu khối ---------------- */
  const timChu = tim.trim().toLocaleLowerCase('vi');
  const dongLs = d.dongThoiGian
    .filter((x) => (x.loai === 'xu-ly' ? x.status === 'done' || x.status === 'thu_hoi' : x.trangThai === 'da_ghi_nhan')
      && (phamVi === 'tat-ca' || x.trongChuoi !== false) && (!lsEm || x.studentId === lsEm.id))
    /* "Tìm em" khớp tên em, tên vi phạm / lần xử lý và tên nhóm. */
    .filter((x) => !timChu || [x.ten, x.loai === 'vi-pham' ? `${x.viPham} ${dich(x.nhom)}` : `${dich(x.nhan)} ${x.tenViPham.join(' ')}`].join(' ').toLocaleLowerCase('vi').includes(timChu));
  const kieuLs = (x: DongThoiGianYt): KieuLs => (x.loai === 'vi-pham' ? 'xem' : x.status === 'thu_hoi' ? 'thu-hoi' : 'xu-ly');
  const soLs = { 'da-xem': dongLs.filter((x) => kieuLs(x) === 'xem').length, 'da-xu-ly': dongLs.filter((x) => kieuLs(x) === 'xu-ly').length, 'thu-hoi': dongLs.filter((x) => kieuLs(x) === 'thu-hoi').length };
  const kLs = dongLs.filter((x) => loc === 'tat-ca' || kieuLs(x) === KIEU_LOC[loc]).map((x) => {
    if (x.loai === 'vi-pham') {
      const v = tra.vp.get(x.id)!;
      return khoi({
        key: `ls-v${x.id}`, sid: x.studentId, ten: x.ten, vp: [v], nen: lsVua.includes(x.id) ? 'vua' : undefined,
        gv: <OBuoc badge={<BadgeViec tong="xam">{t('Đã xem')}</BadgeViec>} phu={[x.xemLuc && x.xemBoi ? `${lucVn(x.xemLuc)} · ${x.xemBoi}` : x.xemBoi]} />,
        ph: null,
        /* Rà 11/11 G3-6: vi phạm đã xem (kể cả GVCN tự ghi — tự Đã xem) vẫn xử lý ngay được, không phải Bỏ xem rồi đổi tab. */
        tiep: d.canManage ? (
          <span className="flex flex-wrap justify-center gap-x-3">
            {x.trongChuoi !== false && (
              <button type="button" className="link min-h-[30px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]"
                aria-label={`${t('Xác nhận xử lý')} · ${x.ten} · ${x.viPham}`} onClick={() => mo({ loai: 'xu-ly', studentId: x.studentId, tick: [x.id] })}>{t('Xác nhận xử lý')}</button>
            )}
            <button type="button" className="link min-h-[30px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]" disabled={dangGhi === x.studentId}
              aria-label={`${t('Bỏ xem')} · ${x.ten} · ${x.viPham}`} onClick={() => void daXem(null, x.studentId, [x.id], true)}>{t('Bỏ xem')}</button>
          </span>
        ) : <span className="text-slate-500">—</span>,
      });
    }
    return khoi({ key: `ls-x${x.id}`, sid: x.studentId, ten: x.ten, vp: vpCua(x.viPhamIds), gv: oXl(x), ph: ph(x.studentId, x.baoPh), b: x.baoPh, tiep: <span className="text-slate-500">—</span> });
  });

  const tenPhoiHop = thuong ? t('Phối hợp') : t('Phối hợp SOS');
  const nutGhi = d.canRecord && <button type="button" className="btn btn-primary h-9 max-sm:h-11 max-sm:flex-1" onClick={() => mo({ loai: 'ghi', studentId: 0 })}>{t('+ Ghi vi phạm')}</button>;
  const batChon = () => { chonN.batTat(); setGhiNhanKq(null); };

  return (
    <Card bodyClass="p-0 [container-type:inline-size]">
      <h2 className="sr-only">{t('Ý thức & Phối hợp')}</h2>
      {/* Mockup K1 `.cong-cu`: phân đoạn trái · thao tác phải; 375 (K2): + Ghi vi phạm rộng + ⋯, phân đoạn mỗi cái một hàng. */}
      <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3 max-sm:px-3" style={{ borderColor: 'var(--line)' }}>
        <BoLocDoan v8 giuSo ariaLabel={t('Phần')} value={phan} onChange={setPhan}
          muc={[{ key: 'vi-pham', nhan: t('Vi phạm') }, { key: 'phoi-hop', nhan: tenPhoiHop, so: coord.data?.pendingCount ?? null }]} />
        {phan === 'vi-pham' && (
          <BoLocDoan v8 giuSo ariaLabel={t('Vi phạm')} value={doan} onChange={setDoan}
            muc={[{ key: 'can-lam', nhan: t('Cần làm'), so: t('{n} HV', { n: soCanLam }) }, { key: 'lich-su', nhan: t('Lịch sử'), so: dongLs.length }]} />
        )}
        {phan === 'vi-pham' && doan === 'lich-su' && (
          <ChipLoc ariaLabel={t('Lọc lịch sử')} value={loc} onChange={setLoc}
            muc={[{ key: 'tat-ca', nhan: t('Tất cả'), so: dongLs.length }, { key: 'da-xem', nhan: t('Đã xem'), so: soLs['da-xem'] },
              { key: 'da-xu-ly', nhan: t('Đã xử lý'), so: soLs['da-xu-ly'] }, { key: 'thu-hoi', nhan: t('Đã thu hồi'), so: soLs['thu-hoi'] }]} />
        )}
        <span className="ml-auto flex flex-wrap items-center gap-2 max-sm:order-first max-sm:ml-0 max-sm:w-full">
          {phan === 'phoi-hop' ? (
            <>
              {/* X08: Phối hợp luôn là mọi lượt (không theo phạm vi Lịch sử). */}
              <span className="text-[13px] text-slate-400">{t('mọi lượt')}</span>
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setIncludeDone((v) => !v)}>
                {includeDone ? t('Chỉ hiện lượt chưa xong') : t('Hiện cả lượt đã xong')}
              </button>
            </>
          ) : doan === 'lich-su' ? (
            <>
              <BoLocDoan v8 ariaLabel={t('Phạm vi')} value={phamVi} onChange={setPhamVi}
                muc={[{ key: 'chuoi', nhan: thuong ? t('Lớp thường') : t('Lộ trình') }, { key: 'tat-ca', nhan: t('Cả lịch sử') }]} />
              {lsEm ? (
                <button type="button" className="btn h-9 max-sm:h-11" aria-label={`${t('Bỏ lọc em')} · ${lsEm.ten}`} onClick={() => setLsEm(null)}>{lsEm.ten} ×</button>
              ) : (
                <input type="search" className="field h-9 w-[200px] py-1 max-sm:h-11 max-sm:w-auto max-sm:flex-1" aria-label={t('Tìm em')} placeholder={t('Tìm em')} value={tim} onChange={(e) => setTim(e.target.value)} />
              )}
            </>
          ) : (
            <>
              {onDiemMt && <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:hidden" onClick={onDiemMt}>{thuong ? t('Điểm Test ›') : t('Điểm Mock Test ›')}</button>}
              {nutGhi}
              {d.canManage && (
                <>
                  {/* KHAI-BAC-LO: một panel mọi em của lớp — không cần Chọn nhiều trước. */}
                  <button type="button" className="btn h-9 max-sm:hidden" onClick={() => setLoMo({ viec: 'cap-bac', ids: null })}>{t('Khai / sửa cấp bậc')}</button>
                  <button type="button" aria-pressed={chonN.bat} onClick={batChon}
                    className={`btn h-9 max-sm:hidden ${chonN.bat ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : ''}`}>
                    {chonN.bat ? '✓ ' : ''}{t('Chọn nhiều')}
                  </button>
                  <span className="sm:hidden">
                    <Menu label="⋯" ariaLabel={t('Thao tác khác')} className="btn h-11 min-w-[44px]" items={[
                      ...(onDiemMt ? [{ label: thuong ? t('Điểm Test ›') : t('Điểm Mock Test ›'), onClick: onDiemMt }] : []),
                      { label: t('Khai / sửa cấp bậc'), onClick: () => setLoMo({ viec: 'cap-bac', ids: null }) },
                      { label: chonN.bat ? t('Tắt chọn nhiều') : t('Chọn nhiều'), onClick: batChon },
                    ]} />
                  </span>
                </>
              )}
            </>
          )}
        </span>
      </div>

      {phan === 'phoi-hop' ? (
        <div className="px-4 pb-4 pt-3 max-sm:px-3">
          {coord.error ? <LoiTaiNho chu={t('Không tải được Phối hợp.')} onRetry={coord.reload} className="px-0 py-1" />
            : <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} cot1="hocVien" xanh onChanged={() => { coord.reload(); }} />}
        </div>
      ) : doan === 'lich-su' ? (
        kLs.length ? <div><DauCot coHv cuoi={t('Thao tác')} ph={iBaoPh} />{kLs}</div>
          : <div className="p-4"><Empty title={loc === 'tat-ca' && !timChu ? t('Chưa có gì trong lịch sử') : t('Không có dòng nào khớp bộ lọc')} /></div>
      ) : !coHang && !(chonN.bat && chuaKhai.length) ? (
        <div className="p-4"><Empty title={t('Không em nào cần xử lý Ý thức')} /></div>
      ) : (
        <div>
          <DauCot coHv ph={iBaoPh} />
          {kBb.length > 0 && (
            <NhomLan tong="bb" chu={t('Bắt buộc xử lý')} dem={t('{n} HV · {so} vi phạm', { n: kBb.length, so: soVp(nhomBbHien.map((x) => x.x)) })}
              i={<NutLuat label={t('Luật bắt buộc xử lý')}>{t('≥ 3 vi phạm trong tuần này + tuần trước → phải xử lý; "Đã xem" không còn.')}</NutLuat>}>{kBb}</NhomLan>
          )}
          {kMoi.length > 0 && (
            <NhomLan chu={t('Mới, chưa xem')} dem={t('{n} HV · {so} vi phạm', { n: moiHien.length, so: soVp(moiHien) })}
              i={<NutLuat label={t('Đã xem là gì')}>{t('Đã xem: không lên bậc; vi phạm vẫn nằm trong 3 vi phạm / 2 tuần. Vi phạm nghiêm trọng: Xác nhận xử lý ngay.')}</NutLuat>}>{kMoi}</NhomLan>
          )}
          {kChoQl.length > 0 && <NhomLan chu={t('Chờ QL duyệt')} dem={t('{n} HV', { n: kChoQl.length })}>{kChoQl}</NhomLan>}
          {kTvv.length > 0 && <NhomLan chu={t('Chờ TVV báo PH')} dem={t('{n} HV', { n: new Set(choTvvHien.map((x) => x.studentId)).size })}>{kTvv}</NhomLan>}
          {chonN.bat && chuaKhai.length > 0 && (
            <NhomLan chu={t('Chưa xác nhận cấp bậc')} dem={t('{n} HV', { n: chuaKhai.length })}>
              {chuaKhai.map((x) => (
                <div key={x.studentId} className="flex min-h-[44px] items-center gap-2 border-b px-4" style={{ borderColor: 'var(--line)' }}>
                  <OChon chon={chonN} id={x.studentId} ten={x.ten} />
                  <span className="min-w-0 flex-1 truncate py-2.5 text-sm"><Link className="ten-ho-so" to={`/hoc-vien/${x.studentId}`}>{x.ten}</Link></span>
                </div>
              ))}
            </NhomLan>
          )}
          {kXong.length > 0 && <NhomLan tong="gap" chu={t('Xong · 7 ngày')} dem={t('{n} HV', { n: new Set(xong7Hien.map((x) => x.studentId)).size })}>{kXong}</NhomLan>}
        </div>
      )}

      <ThanhChonNhieu chon={chonN}
        viec={[
          { key: 'xu-ly', nhan: t('Xác nhận xử lý · {n}', { n: dem('xu-ly') }), chinh: true, tat: !dem('xu-ly') },
          { key: 'ghi-nhan', nhan: t('Đã xem · {n}', { n: dem('ghi-nhan') }), tat: !dem('ghi-nhan') || busyLo },
          { key: 'cap-bac', nhan: t('Xác nhận cấp bậc · {n}', { n: dem('cap-bac') }), tat: !dem('cap-bac') },
        ]}
        onViec={(k) => (k === 'ghi-nhan' ? void ghiNhanLo() : setLoMo({ viec: k as ViecLo, ids: [...chonN.chon] }))}
        dongTren={okGhiNhan.length ? (
          <>
            <span className="font-semibold text-ok">✓ {t('Đã xem {so} vi phạm · {n} em', { so: okGhiNhan.reduce((s, x) => s + (x.ids?.length ?? 0), 0), n: okGhiNhan.length })}</span>
            <span className="flex-1" />
            <NutChu disabled={busyLo} onClick={() => void hoanTacGhiNhan()}>{t('Hoàn tác')}</NutChu>
          </>
        ) : undefined} />
      {loMo && (
        <LoYThucPanel classId={classId} lop={d.classCode} viec={loMo.viec} studentIds={loMo.ids}
          onClose={() => setLoMo(null)} onDone={lamMoi} />
      )}
      {baoPh && (
        /* Báo PH tại chỗ (TVV / QL ghi; GVCN sửa hạn) — cùng panel với Công việc. */
        <PanelBaoPhTvv key={baoPh.viecId}
          it={{ viecId: baoPh.viecId, studentId: baoPh.studentId, studentName: baoPh.ten, due: baoPh.han, classCode: d.classCode } as WorkItem}
          onDong={() => setBaoPh(null)} onDaLam={lamMoi} onTiep={null} />
      )}
      {duyet && <PanelDuyetXuLy {...duyet} onDong={() => setDuyet(null)} onXong={(chu) => { if (chu) toast.push('ok', dich(chu)); setDuyet(null); DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x)); lamMoi(); }} />}
      {panels}
    </Card>
  );
}

type XuLyDong = Extract<DongThoiGianYt, { loai: 'xu-ly' }>;
/** Lọc Lịch sử (mockup K6): Đã xem = vi phạm đã xem · Đã xử lý / Đã thu hồi = lần xử lý. */
type LocLs = 'tat-ca' | 'da-xem' | 'da-xu-ly' | 'thu-hoi';
type KieuLs = 'xem' | 'xu-ly' | 'thu-hoi';
const KIEU_LOC = { 'da-xem': 'xem', 'da-xu-ly': 'xu-ly', 'thu-hoi': 'thu-hoi' } as const;

/** Cuộn tới hàng — không trượt khi người dùng tắt chuyển động. */
const cuonToi = (el: Element | null | undefined) =>
  el?.scrollIntoView({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

/** Hộp thang của một em (chip bậc): đọc `/students/:id/y-thuc` CHỈ khi mở. */
function ThangEm({ sid, ten, homNay, onKhai, onLichSu }: { sid: number; ten: string; homNay: string; onKhai: () => void; onLichSu: () => void }) {
  const { data: hv, error, reload } = useApi<YThucHocVien>(`/students/${sid}/y-thuc`, [sid]);
  return (
    <>
      <b className="text-[15px] font-bold text-slate-100">{t('Thang · {ten}', { ten })}</b>
      {error ? <LoiTaiNho chu={error.message} onRetry={reload} className="px-0 py-1" /> : !hv ? <Skeleton rows={2} /> : <ThangYThuc d={hv} homNay={homNay} />}
      <span className="flex items-center justify-between gap-3">
        <button type="button" className="link min-h-[30px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]" onClick={onLichSu}>{t('Lịch sử của em ›')}</button>
        {hv?.canManage && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={onKhai}>{t('Khai / sửa cấp bậc')}</button>}
      </span>
    </>
  );
}

/**
 * K4: QL Duyệt / Từ chối đề xuất hoặc xin thu hồi NGAY tab lớp — cùng panel duyệt của Hộp duyệt (`PanelDuyet`); thẻ lấy từ lần xử lý
 * (`GET /y-thuc/xu-ly/:id` — `the` = đề xuất, `thuHoi` = xin thu hồi). Máy chủ kiểm quyền duyệt.
 */
function PanelDuyetXuLy({ id, thuHoi, moSan, onDong, onXong }: { id: number; thuHoi: boolean; moSan: 'duyet' | 'tu-choi'; onDong: () => void; onXong: (chu?: string) => void }) {
  const { data, error } = useApi<XuLyView>(`/y-thuc/xu-ly/${id}`, [id]);
  const toast = useToast();
  const yc = thuHoi ? data?.thuHoi : data?.the;
  useEffect(() => {
    if (error) { toast.push('error', error.message); onDong(); }
    else if (data && (!yc || yc.trangThai !== 'cho')) { toast.push('info', t('Yêu cầu này đã được xử lý.')); onXong(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, data]);
  if (!yc || yc.trangThai !== 'cho') return null;
  return <PanelDuyet yc={yc} moSan={moSan} onDong={onDong} onXong={(_id, chu) => onXong(chu)} />;
}
