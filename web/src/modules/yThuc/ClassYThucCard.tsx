import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { BoLocDoan, Card, Empty, ErrorState, LoiTaiNho, Skeleton } from '../../ui/ui.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { addDaysIso, bacNgan, laDongLs, ngay, quaHanChiXem, tvvChinhCuaLop, type NhomEm } from '@shared/domain/index.ts';
import { usePanelYThuc, type PanelYThuc } from './panelYThuc.tsx';
import { ChiTietViPham } from './ChiTietViPham.tsx';
import type { CoordTurn } from './PhoiHopSosSection.tsx';
import { BangPhoiHopHoSo } from './BangPhoiHop.tsx';
import { ThangVach, ThangYThuc } from './ThangYThuc.tsx';
import { BadgeViec, CanLamEm, ChipLoc } from './khoiYThuc.tsx';
import { BaoPhDu, ChipBac, DauCotEm, DongEmGon, DongLan, KhoiEm, KhungLs, OBaoPh, OBuoc, ODaXuLy, TabNho, TheLoai, ThanhLs, type VpDong } from './BangLan.tsx';
import { BuocTinhHinh, HopTinhHinh, NoiDungTinhHinh, TheTinhHinh, daXuLyTinhHinh, type CheDoHop, type ThaoTacTh } from './TinhHinh.tsx';
import { DUONG_LAM_MOI_Y_THUC, type BangLo, type BangYThucLop, type BaoPhLan, type DongEm, type DongThoiGianYt, type KqEm, type TinhHinhView, type XuLyView, type YThucHocVien } from './kieu.ts';
import { CO_LO, LoYThucPanel, guiTheoLo, type ViecLo } from './LoYThucPanel.tsx';
import { OChon, ThanhChonNhieu, useChonNhieu } from '../students/chonNhieuHocVien.tsx';
import { PanelBaoPhTvv, gioVnNay, lucVn } from '../congViec/PanelBaoPhTvv.tsx';
import { PanelDuyet } from '../duyet/HopChoDuyet.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { NutChu } from '../../ui/KhuonViec.tsx';
import { dich, dichChu, t } from '@shared/i18n/index.ts';

/**
 * TAB `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ LỚP — YT-a (mockup `thiet-ke/v19/y-thuc.html` A1–A6, chủ SP duyệt #1482 kể cả XM-2 XM-3; nền Y-THUC-V2).
 *
 *   Đầu thẻ: `Vi phạm | Phối hợp SOS` · lọc em `Tất cả | Việc của tôi` · Tìm em · phải: Điểm Mock Test › · Khai / sửa cấp bậc · Chọn nhiều · + Ghi vi phạm.
 *   MỌI em của lớp (`emLop`): em còn bước chưa xong lên đầu (bắt buộc / quá hạn › mới › chờ QL › chờ TVV), MỘT em MỘT khối (`KhoiEm`), mỗi lần một dòng
 *   `Vi phạm · Đã xử lý (GVCN / TVV) · Bước đang làm` (`DongLan`, một nút đúng vai; không phải việc của mình thì "Chờ …"). Rồi các em khác theo tên,
 *   mỗi em một dòng gọn ("✓ Chưa có vi phạm" / "Không có vi phạm chờ"). Thanh "Xem lịch sử · n" mở tại chỗ: Đã xem · Đã xử lý · Đã thu hồi + phạm vi
 *   Lộ trình | Cả lịch sử (dữ liệu đã nạp; lớp > 150 dòng mà em thiếu dòng → `/students/:id/y-thuc` khi bấm).
 *   Bấm tên vi phạm → mở tại chỗ (mô tả, bằng chứng, Sửa · Xoá); rê → hộp thông tin. Bấm badge GVCN → Xem lần xử lý (Thu hồi… ở đó). Chip bậc → thang + Khai bậc.
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
  /* Phân đoạn ghi vào địa chỉ (`sub`) — sang hồ sơ em rồi Quay lại về đúng chỗ. YT-a: bỏ `Cần làm | Lịch sử` (lịch sử mở trong khối em). */
  const phan: 'vi-pham' | 'phoi-hop' = params.get('sub') === 'phoi-hop' ? 'phoi-hop' : 'vi-pham';
  const setPhan = (p: 'vi-pham' | 'phoi-hop') => {
    const q = new URLSearchParams(params);
    if (p === 'phoi-hop') q.set('sub', 'phoi-hop'); else q.delete('sub');
    setParams(q, { replace: true });
  };
  const [locEm, setLocEm] = useState<'tat-ca' | 'cua-toi'>('tat-ca');
  const [tim, setTim] = useState('');
  /* Em đang mở lịch sử tại chỗ. */
  const [moLs, setMoLs] = useState<ReadonlySet<number>>(new Set());
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
  /* TINH-HINH: hộp nhỏ Báo / Hỏi tình hình · Sửa · Ghi kết quả — neo nút vừa bấm. */
  const [hop, setHop] = useState<{ che: CheDoHop; neo: RefObject<HTMLElement | null> } | null>(null);
  const neoBao = useRef<HTMLButtonElement>(null);
  const neoHoi = useRef<HTMLButtonElement>(null);
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
    const vp = vpTu(d.dongThoiGian);
    const xl = new Map<number, XuLyDong>();
    for (const x of d.dongThoiGian) if (x.loai === 'xu-ly') xl.set(x.id, x);
    const em = new Map<number, DongEm>();
    for (const ds of [...Object.values(d.nhom), d.choBaoPh, d.choThuHoi]) for (const x of ds) em.set(x.studentId, x);
    return { vp, xl, em };
  }, [d]);
  if (board.error && !d) return <ErrorState message={board.error.message} hint={board.error.hint} status={board.error.status} onRetry={board.reload} />;
  if (!d || !tra) return <Card title={t('Ý thức & Phối hợp')}><Skeleton rows={4} /></Card>;

  /* OV-13d: em chưa xác nhận cấp bậc (em mới vào web) — YT-a: em nào cũng có dòng, ô chọn hiện khi Chọn nhiều. */
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
  const batLs = (sid: number) => setMoLs((c) => { const n = new Set(c); if (n.has(sid)) n.delete(sid); else n.add(sid); return n; });
  /* "Lịch sử của em ›" (hộp thang) · "Xem lại" (sau Đã xem): mở lịch sử của em tại chỗ rồi cuộn tới khối em. */
  const moLichSu = (sid: number) => { setMoLs((c) => new Set(c).add(sid)); requestAnimationFrame(() => cuonToi(document.getElementById(`yt-em-${sid}`))); };
  const xemLai = (sid: number, ids: number[]) => { setLsVua(ids); moLichSu(sid); };

  const tvvChinh = tvvChinhCuaLop((roster.data ?? []).filter((r: any) => !r.archived));
  const khongMo = new Set((roster.data ?? []).filter((r: any) => r.xemHoSo === false).map((r: any) => r.id as number));
  const emLop = new Map(d.emLop.map((e) => [e.studentId, e]));
  const vpCua = (ids: readonly number[], du?: DongEm['viPhamCho'], vpm: Map<number, VpDong> = tra.vp) => ids.map((id): VpDong => vpm.get(id)
    ?? (() => { const v = du?.find((u) => u.id === id); return { id, ngay: v?.ngay ?? '', ten: v?.ten ?? '', skill: null, nhom: null, nguoiGhi: null, moTa: '' }; })());
  const xemXl = (id: number) => mo({ loai: 'xem', id });
  const ghiBaoPh = (sid: number, b: BaoPhLan) => setBaoPh({ viecId: b.id, studentId: sid, ten: emLop.get(sid)?.ten ?? '', han: b.han });

  /* ---------------- Ô Học viên (khối em + dòng gọn) ---------------- */
  /* Em chưa có vấn đề gì (không khối, không lịch sử, chưa bậc): dòng đã ghi "✓ Chưa có vi phạm" (chủ SP 12/11) — không thêm chip trùng ý (mockup v20 A1). */
  const theoEmCo = (sid: number) => d.tinhHinh.some((x) => x.studentId === sid) || d.dongThoiGian.some((x) => x.studentId === sid);
  const hvEm = (sid: number) => {
    const e = emLop.get(sid);
    const ten = e?.ten ?? tra.em.get(sid)?.ten ?? '';
    const tvv = e?.tvv && e.tvv !== tvvChinh ? e.tvv : null;
    return (
      <span className="flex min-w-0 items-start gap-2">
        {chonN.bat && <OChon chon={chonN} id={sid} ten={ten} />}
        <span className="flex min-w-0 flex-col items-start gap-2">
          {/* GV-CU-BO-TRO [XM-2]: người dạy bổ trợ chỉ xem lớp — em không mở được hồ sơ (roster `xemHoSo: false`) là chữ thường, không link tới 403. */}
          {khongMo.has(sid)
            ? <span className="block text-[15px] font-semibold text-slate-100">{ten}</span>
            : <Link className="block text-[15px] font-semibold text-slate-100 no-underline hover:text-[color:var(--accent)] hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center" to={`/hoc-vien/${sid}?tab=y-thuc`}>{ten}</Link>}
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
            {/* Chủ SP 12/11: mốc viết hoa, không "Đã tới"; chưa có → "Chưa có vi phạm" — cùng `bac` với thang (TH-9). */}
            {e && (e.bac > 0 || e.soLs > 0 || theoEmCo(sid)) && <ChipBac bac={e.bac} ten={ten}>{(dong) => <ThangEm sid={sid} ten={ten} homNay={homNay} onKhai={() => { dong(); mo({ loai: 'khai', studentId: sid }); }} onLichSu={() => { dong(); moLichSu(sid); }} />}</ChipBac>}
            {tvv && <span>{t('TVV {ten}', { ten: tvv })}</span>}
          </span>
        </span>
      </span>
    );
  };

  /* ---------------- Một dòng lần (gom theo em ở dưới) ---------------- */
  type Dong = { key: string; sid: number; node: ReactNode };
  const dongLan = (o: { key: string; sid: number; ten: string; vp: VpDong[]; gv: ReactNode | null; ph: ReactNode | null; tiep: ReactNode; nen?: 'vua'; b?: BaoPhLan | null; moiIds?: number[]; ls?: boolean;
    the?: ReactNode; vanDe?: ReactNode; dx?: ReactNode }): Dong => {
    const em = tra.em.get(o.sid);
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
    /* Báo PH đang mở = bước còn chờ → cột "Bước đang làm"; đã báo / đã bỏ → "Đã xử lý" dòng TVV. Lịch sử: luôn ở "Đã xử lý". */
    const phCho = !o.ls && o.b?.trangThai === 'mo' && o.ph != null;
    const dx = o.dx !== undefined ? o.dx : o.gv || (o.ph && !phCho) ? <ODaXuLy gv={o.gv} tvv={phCho ? null : o.ph} /> : null;
    const tiep = phCho ? <span className="flex flex-col items-stretch gap-2">{o.ph}{o.tiep}</span> : o.tiep;
    return {
      key: o.key, sid: o.sid,
      node: <DongLan key={o.key} vp={o.vp} dx={dx} tiep={tiep} nen={o.nen} ls={o.ls} homNay={homNay}
        the={o.the ?? (o.vanDe ? undefined : <TheLoai loai="vp" so={o.vp.length} />)} vanDe={o.vanDe}
        moVp={moId} onMoVp={(id) => setMoVp((c) => (c === `${o.key}:${id}` ? null : `${o.key}:${id}`))} chiTietVp={chiTietVp}
        duoi={o.b && moDu === o.b.id ? <BaoPhDu id={o.b.id} homNay={homNay} onSuaHan={() => ghiBaoPh(o.sid, o.b!)} /> : undefined} />,
    };
  };
  const ph = (sid: number, b: BaoPhLan | null | undefined) => (
    <OBaoPh b={b} homNay={homNay} tvv={b?.trangThai === 'mo' ? null : emLop.get(sid)?.tvv ?? null} moDu={!!b && moDu === b.id}
      onXemDu={b ? () => setMoDu((c) => (c === b.id ? null : b.id)) : undefined} onSuaHan={b ? () => ghiBaoPh(sid, b) : undefined} />
  );
  const choAi = (vai: string, ten: string | null) => <span className="text-[13px] text-slate-500">{t('Chờ {vai}', { vai })}{ten && <> <b className="whitespace-nowrap font-semibold text-slate-300">{ten}</b></>}</span>;
  const nutChinh = (chu: string, ten: string, onClick: () => void, vien = false) => (
    <button type="button" className={`btn w-full justify-center max-sm:h-11 ${vien ? '' : 'btn-primary'}`} aria-label={`${chu} · ${ten}`} onClick={onClick}>{chu}</button>
  );
  const nutPhu = (ds: [string, () => void][], ten: string) => (
    <span className="flex justify-center gap-3">
      {ds.map(([chu, f]) => <button key={chu} type="button" aria-label={`${chu} · ${ten}`} onClick={f} className="link min-h-[30px] appearance-none border-0 bg-transparent px-1 text-[13px] font-semibold max-sm:min-h-[44px]">{chu}</button>)}
    </span>
  );
  const oXl = (x: XuLyDong) => x.status === 'thu_hoi'
    ? <OBuoc badge={<BadgeViec xuong tong="xam" title={t('Xem lần xử lý')} onClick={() => xemXl(x.id)}>{t('Đã thu hồi')}</BadgeViec>} phu={[bacNgan(dich(x.nhan))]} />
    : <OBuoc badge={<BadgeViec xuong tong="xong" title={t('Xem lần xử lý')} onClick={() => xemXl(x.id)}>{bacNgan(dich(x.nhan))} · {ngay(x.ngay, homNay)}</BadgeViec>} phu={[x.nguoi, x.soTep ? t('{soTep} tệp', { soTep: x.soTep }) : null]} />;
  const hanBuoc = (noi: ReactNode) => <span className="flex flex-col items-start gap-1.5">{noi}</span>;

  /* ---------------- Em còn bước chưa xong (thứ tự độ gấp: bắt buộc / quá hạn › mới › chờ QL › chờ TVV) ---------------- */
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
  const moiNhatEm = new Map<number, number>();
  for (const x of xls) if (x.status === 'done' && !moiNhatEm.has(x.studentId)) moiNhatEm.set(x.studentId, x.id);

  /*
   * Rà 11/11 G3-14: "Việc của tôi" = EM có việc của CHÍNH người xem (cùng tập Công việc "Của tôi" — dữ liệu đã nạp, không thêm request): GVCN của lớp
   * xử lý / xem / ghi Đã thực hiện · QL duyệt · người giữ Báo PH (TVV của em; em chưa có TVV → QL) ghi Báo PH. YT-a: khối em hiện MỌI lần còn chờ của em.
   */
  const laGvcn = !!d.laGvcn;
  const giuPh = (sid: number, measureId: number | undefined) => { const x = measureId ? tra.xl.get(measureId) : undefined; return !!tra.em.get(sid)?.giuBaoPh && !!x && phMo(x)?.trangThai === 'mo'; };
  const viecDx = (x: (typeof d.nhom.cho_duyet)[number]) => !!x.deXuat && ((x.deXuat.status === 'cho_duyet' ? d.coTheDuyet : laGvcn) || giuPh(x.studentId, x.deXuat.id));
  const choDuyetDx = d.nhom.cho_duyet.filter((x) => x.deXuat);
  const cuaToi = new Set<number>([
    ...nhomBb.filter((o) => laGvcn && !o.x.deXuat).map((o) => o.x.studentId), ...(laGvcn ? moiDs.map((x) => x.studentId) : []),
    ...choDuyetDx.filter(viecDx).map((x) => x.studentId), ...emThuHoi.filter((x) => d.coTheDuyet || giuPh(x.studentId, x.thuHoi?.id)).map((x) => x.studentId),
    ...choTvv.filter((x) => giuPh(x.studentId, x.id)).map((x) => x.studentId),
    ...d.tinhHinh.filter((x) => x.trangThai === 'mo' && (x.chieu === 'tvv_gvcn' ? x.coTheTraLoi && laGvcn : !!x.baoPh?.coTheGhi && !!tra.em.get(x.studentId)?.giuBaoPh)).map((x) => x.studentId),
  ]);

  const kBb = nhomBb.map(({ x, k }) => {
    const vp = x.viPhamCho.filter((v) => v.trangThai !== 'cho_duyet');
    const gv = x.tuChoi ? <OBuoc badge={<BadgeViec xuong tong="qua" title={t('Xem lần xử lý')} onClick={() => xemXl(x.tuChoi!.id)}>{t('QL từ chối')}</BadgeViec>} phu={[bacNgan(dich(x.tuChoi.nhan))]} /> : null;
    const tiep = <>
      {hanBuoc(<><CanLamEm x={{ ...x, nhom: k, deXuat: null }} homNay={homNay} hanDuoi /><span className="text-xs text-slate-400">{t('Lần này')} <b className="font-semibold text-slate-100">{bacNgan(dich(x.keTiep.nhan))}</b></span></>)}
      {d.canManage && !x.deXuat
        ? <>{nutChinh(t('Xác nhận xử lý'), x.ten, () => mo({ loai: 'xu-ly', studentId: x.studentId }))}</>
        : choAi('GVCN', d.gvcn)}
    </>;
    return dongLan({ key: `bb${x.studentId}`, sid: x.studentId, ten: x.ten, vp: vpCua(vp.map((v) => v.id), vp), gv, ph: null, tiep });
  });
  const kMoi = [
    ...moiDs.map((x) => {
      const ids = x.viPhamCho.filter((v) => v.trangThai === 'moi' || v.trangThai === 'qua_han').map((v) => v.id);
      const tiep = <>
        {hanBuoc(<CanLamEm x={{ ...x, nhom: x.quaHanNgay ? 'qua_han' : 'moi', deXuat: null }} homNay={homNay} hanDuoi />)}
        {d.canManage && ids.length
          ? <>
              <button type="button" className="btn w-full justify-center max-sm:h-11" style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'transparent' }} disabled={dangGhi === x.studentId}
                aria-label={`${t('Đã xem · {n}', { n: ids.length })} · ${x.ten}`} title={t('Đã xem, chưa cần xử lý')} onClick={() => void daXem(x, x.studentId, ids)}>
                {dangGhi === x.studentId ? t('Đang lưu…') : t('Đã xem · {n}', { n: ids.length })}
              </button>
              {/* GD-4a (lời 28): "Xác nhận xử lý" là NÚT (viền), không chữ link. */}
              {nutChinh(t('Xác nhận xử lý'), x.ten, () => mo({ loai: 'xu-ly', studentId: x.studentId }), true)}
            </>
          : choAi('GVCN', d.gvcn)}
      </>;
      return dongLan({ key: `moi${x.studentId}`, sid: x.studentId, ten: x.ten, vp: vpCua(x.viPhamCho.map((v) => v.id), x.viPhamCho), gv: null, ph: null, tiep, moiIds: ids });
    }),
    ...vua.map((v) => dongLan({
      key: `vua${v.x.studentId}`, sid: v.x.studentId, ten: v.x.ten, vp: vpCua(v.ids, v.x.viPhamCho), nen: 'vua', ph: null,
      gv: <b role="status" className="text-sm font-semibold text-ok">✓ {t('Đã xem {n} vi phạm · {gio}', { n: v.ids.length, gio: v.luc })}</b>,
      tiep: <span className="flex gap-3.5">
        <button type="button" className="link min-h-[30px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]" disabled={dangGhi === v.x.studentId} aria-label={`${t('Hoàn tác')} · ${v.x.ten}`} onClick={() => void daXem(null, v.x.studentId, v.ids, true)}>{t('Hoàn tác')}</button>
        <button type="button" className="link min-h-[30px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]" aria-label={`${t('Xem lại')} · ${v.x.ten}`} onClick={() => xemLai(v.x.studentId, v.ids)}>{t('Xem lại')}</button>
      </span>,
    })),
  ];
  const kChoQl = [
    ...choDuyetDx.map((x) => {
      const dx = x.deXuat!;
      const xl = tra.xl.get(dx.id);
      const vpDx = x.viPhamCho.filter((v) => v.trangThai === 'cho_duyet');
      const gv = <OBuoc badge={<BadgeViec xuong tong="dang" title={t('Xem đề xuất')} onClick={() => xemXl(dx.id)}>{dx.status === 'da_duyet' ? t('QL đã duyệt {nhan}', { nhan: bacNgan(dich(dx.nhan)) }) : t('Đề xuất {nhan} · chờ QL', { nhan: bacNgan(dich(dx.nhan)) })}</BadgeViec>}
        phu={[dx.han ? (dx.status === 'da_duyet' ? t('thực hiện trước {ngay}', { ngay: ngay(dx.han, homNay) }) : t('QL trả lời trước {ngay}', { ngay: ngay(dx.han, homNay) })) : null]} />;
      const tiep = dx.status === 'cho_duyet' && d.coTheDuyet
        ? <>{nutChinh(t('Duyệt'), x.ten, () => setDuyet({ id: dx.id, thuHoi: false, moSan: 'duyet' }))}{nutPhu([[t('Từ chối…'), () => setDuyet({ id: dx.id, thuHoi: false, moSan: 'tu-choi' })], [t('Xem'), () => xemXl(dx.id)]], x.ten)}</>
        : dx.status === 'da_duyet' && d.canManage
          ? <>{nutChinh(t('Đánh dấu đã thực hiện'), x.ten, () => mo({ loai: 'da-thuc-hien', id: dx.id }))}{nutPhu([[t('Xem'), () => xemXl(dx.id)]], x.ten)}</>
          : dx.status === 'da_duyet' ? choAi('GVCN', d.gvcn) : choAi('QL', null);
      return dongLan({ key: `dx${dx.id}`, sid: x.studentId, ten: x.ten, vp: vpCua(xl?.viPhamIds ?? vpDx.map((v) => v.id), x.viPhamCho), gv, ph: xl?.baoPh ? ph(x.studentId, xl.baoPh) : null, tiep, b: xl?.baoPh });
    }),
    ...emThuHoi.map((x) => {
      const id = x.thuHoi!.id;
      const xl = tra.xl.get(id);
      const gv = <OBuoc badge={<BadgeViec xuong tong="dang" title={t('Xem lần xử lý')} onClick={() => xemXl(id)}>{t('Xin thu hồi {nhan}', { nhan: bacNgan(dich(x.thuHoi!.nhan)) })}</BadgeViec>} phu={[t('chờ QL')]} />;
      const tiep = d.coTheDuyet
        ? <>{nutChinh(t('Duyệt thu hồi'), x.ten, () => setDuyet({ id, thuHoi: true, moSan: 'duyet' }))}{nutPhu([[t('Từ chối…'), () => setDuyet({ id, thuHoi: true, moSan: 'tu-choi' })], [t('Xem'), () => xemXl(id)]], x.ten)}</>
        : choAi('QL', null);
      return dongLan({ key: `th${id}`, sid: x.studentId, ten: x.ten, vp: vpCua(xl?.viPhamIds ?? x.viPhamCho.map((v) => v.id), x.viPhamCho), gv, ph: xl?.baoPh ? ph(x.studentId, xl.baoPh) : null, tiep, b: xl?.baoPh });
    }),
  ];
  const kTvv = choTvv.map((x) => {
    const b = phMo(x)!;
    const tvv = emLop.get(x.studentId)?.tvv ?? null;
    const tiep = b.coTheGhi ? nutChinh(t('Ghi kết quả báo PH'), x.ten, () => ghiBaoPh(x.studentId, b), d.canManage) : choAi('TVV', tvv);
    return dongLan({ key: `tvv${x.id}`, sid: x.studentId, ten: x.ten, vp: vpCua(x.viPhamIds), gv: oXl(x), tiep, b,
      nen: vuaLuu?.sid === x.studentId && moiNhatEm.get(x.studentId) === x.id ? 'vua' : undefined,
      /* G3-14: việc báo lại sau thu hồi — nhãn nói rõ vì sao TVV gọi lại PH. */
      ph: x.status === 'thu_hoi' ? <span className="flex flex-col items-start gap-1"><span className="text-xs font-semibold text-slate-400">{t('Báo lại · đã thu hồi')}</span>{ph(x.studentId, b)}</span> : ph(x.studentId, b) });
  });
  /* TINH-HINH (mockup v20 A1): tình hình còn chờ = một dòng trong khối em (cả hai chiều GV ↔ TVV); xong / rút vào lịch sử của em. */
  const thTheoEm = new Map<number, TinhHinhView[]>();
  for (const x of d.tinhHinh) (thTheoEm.get(x.studentId) ?? thTheoEm.set(x.studentId, []).get(x.studentId)!).push(x);
  const fTh: ThaoTacTh = {
    onGhiBaoPh: (x) => x.baoPh && setBaoPh({ viecId: x.baoPh.id, studentId: x.studentId, ten: emLop.get(x.studentId)?.ten ?? '', han: x.han ?? homNay }),
    onSua: (x, neo) => setHop({ che: { loai: 'sua', x }, neo }),
    onRut: (x) => { if (!window.confirm(t('Rút tình hình này? Việc của người nhận sẽ đóng.'))) return; void api.post(`/tinh-hinh/${x.id}/rut`, {}).then(() => { toast.push('ok', t('Đã rút')); DUONG_LAM_MOI_Y_THUC.forEach((p) => invalidate(p)); lamMoi(); }, (e) => toast.push('error', e.message)); },
    onTraLoi: (x, neo) => setHop({ che: { loai: 'tra-loi', x }, neo }),
    onHoanTacTraLoi: (x) => void api.post(`/tinh-hinh/${x.id}/tra-loi/hoan-tac`, {}).then(() => { DUONG_LAM_MOI_Y_THUC.forEach((p) => invalidate(p)); lamMoi(); }, (e) => toast.push('error', e.message)),
  };
  const dongTh = (x: TinhHinhView, ls = false): Dong => {
    const dx = daXuLyTinhHinh(x, homNay);
    return dongLan({ key: `th${x.id}`, sid: x.studentId, ten: emLop.get(x.studentId)?.ten ?? '', vp: [], gv: null, ph: null, ls,
      the: <TheTinhHinh x={x} homNay={homNay} />, vanDe: <NoiDungTinhHinh chu={x.noiDung} />, dx: dx.gv || dx.tvv ? <ODaXuLy gv={dx.gv} tvv={dx.tvv} /> : null,
      tiep: <BuocTinhHinh x={x} homNay={homNay} tvv={emLop.get(x.studentId)?.tvv ?? null} gvcn={d.gvcn} f={fTh} /> });
  };
  const kTh = d.tinhHinh.filter((x) => x.trangThai === 'mo').map((x) => dongTh(x));
  /* Nhắc nhở 7 ngày gần nhất: một dòng trong khối em (em đã có khối) — không việc, không hạn. */
  const tuNgay = addDaysIso(homNay, -6);
  const nhacGan = d.dongThoiGian.filter((x): x is Extract<DongThoiGianYt, { loai: 'vi-pham' }> => x.loai === 'vi-pham' && !!x.chiNhac && x.ngay >= tuNgay);
  const theoEm = new Map<number, Dong[]>();
  for (const r of [...kBb, ...kMoi, ...kChoQl, ...kTvv, ...kTh]) { const ds = theoEm.get(r.sid); if (ds) ds.push(r); else theoEm.set(r.sid, [r]); }
  for (const x of nhacGan) {
    const ds = theoEm.get(x.studentId);
    if (ds) ds.push(dongLan({ key: `nn${x.id}`, sid: x.studentId, ten: x.ten, vp: vpCua([x.id]), gv: null, ph: null, the: <TheLoai loai="nn" />,
      tiep: <span className="text-xs text-slate-500">{t('Không cần làm gì')}</span> }));
  }
  const iBaoPh = <NutLuat label={t('Đã xử lý là gì')}>{t('GVCN: lần xử lý (bậc, ngày) hoặc Đã xem. TVV: kết quả báo PH và Nội dung TVV ghi. Báo PH sinh khi GVCN lưu xử lý hoặc khi QL duyệt / tự chốt, hạn 5 ngày.')}</NutLuat>;

  /* ---------------- Lịch sử của em — mở tại chỗ (K6 cũ, cùng kiểu dòng) ---------------- */
  const hopPhamVi = (x: DongThoiGianYt) => phamVi === 'tat-ca' || x.trongChuoi !== false;
  const lsDaNap = (sid: number) => d.dongThoiGian.filter((x) => x.studentId === sid && laDongLs(x));
  /* `dongThoiGian` cắt 150 dòng mới nhất: em thiếu dòng → đọc `/students/:id/y-thuc` có sẵn CHỈ khi bấm. */
  const thieuLs = (sid: number) => d.catLs && lsDaNap(sid).length < (emLop.get(sid)?.soLs ?? 0);
  const dongLs = (x: DongThoiGianYt, vpm: Map<number, VpDong>): Dong => {
    if (x.loai === 'vi-pham' && x.chiNhac) {
      return dongLan({ key: `ls-n${x.id}`, sid: x.studentId, ten: x.ten, vp: [vpm.get(x.id)!], ls: true, ph: null, gv: null, the: <TheLoai loai="nn" />, tiep: <span className="text-slate-500">—</span> });
    }
    if (x.loai === 'vi-pham') {
      const v = vpm.get(x.id)!;
      return dongLan({
        key: `ls-v${x.id}`, sid: x.studentId, ten: x.ten, vp: [v], nen: lsVua.includes(x.id) ? 'vua' : undefined, ls: true, ph: null,
        gv: <OBuoc badge={<BadgeViec tong="xam">{t('Đã xem')}</BadgeViec>} phu={[x.xemLuc && x.xemBoi ? `${lucVn(x.xemLuc)} · ${x.xemBoi}` : x.xemBoi]} />,
        /* Rà 11/11 G3-6: vi phạm đã xem (kể cả GVCN tự ghi — tự Đã xem) vẫn xử lý ngay được. */
        tiep: d.canManage ? (
          <span className="flex flex-wrap gap-x-3">
            {x.trongChuoi !== false && (
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]"
                aria-label={`${t('Xác nhận xử lý')} · ${x.ten} · ${x.viPham}`} onClick={() => mo({ loai: 'xu-ly', studentId: x.studentId, tick: [x.id] })}>{t('Xác nhận xử lý')}</button>
            )}
            <button type="button" className="link min-h-[30px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]" disabled={dangGhi === x.studentId}
              aria-label={`${t('Bỏ xem')} · ${x.ten} · ${x.viPham}`} onClick={() => void daXem(null, x.studentId, [x.id], true)}>{t('Bỏ xem')}</button>
          </span>
        ) : <span className="text-slate-500">—</span>,
      });
    }
    return dongLan({ key: `ls-x${x.id}`, sid: x.studentId, ten: x.ten, vp: vpCua(x.viPhamIds, undefined, vpm), gv: oXl(x), ph: x.baoPh ? ph(x.studentId, x.baoPh) : null, b: x.baoPh, ls: true,
      tiep: x.status === 'done' ? <span className="text-sm font-semibold text-ok">✓ {t('Xong')}</span> : <span className="text-slate-500">—</span> });
  };
  const thLs = (sid: number) => (thTheoEm.get(sid) ?? []).filter((x) => x.trangThai !== 'mo');
  const veLs = (rows: DongThoiGianYt[], vpm: Map<number, VpDong>, sid: number) => {
    /* Dòng thời gian + tình hình đã xong / rút của em, mới nhất trước. */
    const ds = [...rows.filter(hopPhamVi).map((x) => ({ ngay: x.ngay, node: dongLs(x, vpm).node })),
      ...thLs(sid).map((x) => ({ ngay: x.taoLuc.slice(0, 10), node: dongTh(x, true).node }))].sort((a, b) => b.ngay.localeCompare(a.ngay));
    return ds.length ? ds.map((x) => x.node)
      : <p className="m-0 px-4 py-3 text-sm text-slate-400">{phamVi === 'chuoi' ? t('Lộ trình này chưa có gì — xem Cả lịch sử.') : t('Chưa có gì trong lịch sử')}</p>;
  };
  const khungLs = (sid: number) => (
    <KhungLs dau={<>
      <b className="text-sm font-bold text-slate-100">{t('Lịch sử')}</b>
      <span className="ml-auto flex items-center gap-1">
        <BoLocDoan v8 ariaLabel={t('Phạm vi lịch sử')} value={phamVi} onChange={setPhamVi}
          muc={[{ key: 'chuoi', nhan: thuong ? t('Lớp thường') : t('Lộ trình') }, { key: 'tat-ca', nhan: t('Cả lịch sử') }]} />
        <NutLuat label={t('Phạm vi lịch sử')}>{t('Lộ trình: vi phạm tính vào thang của lộ trình đang học. Cả lịch sử: mọi lộ trình.')}</NutLuat>
      </span>
    </>}>
      {thieuLs(sid) ? <LsTai sid={sid} phamVi={phamVi} ve={(rows) => veLs(rows, vpTu(rows), sid)} /> : veLs(lsDaNap(sid), tra.vp, sid)}
    </KhungLs>
  );
  const thanhLs = (sid: number) => {
    const ten = emLop.get(sid)?.ten ?? '';
    return <ThanhLs so={thieuLs(sid) ? null : lsDaNap(sid).filter(hopPhamVi).length + thLs(sid).length} mo={moLs.has(sid)} ten={ten} onClick={() => batLs(sid)} />;
  };

  /* ---------------- Danh sách: em còn bước (khối) rồi các em khác theo tên (dòng gọn) ---------------- */
  const timChu = tim.trim().toLocaleLowerCase('vi');
  const hien = (sid: number) => (!timChu || (emLop.get(sid)?.ten ?? '').toLocaleLowerCase('vi').includes(timChu)) && (locEm === 'tat-ca' || cuaToi.has(sid));
  const emCho = [...theoEm.entries()].filter(([sid]) => hien(sid));
  const emKhac = d.emLop.filter((e) => !theoEm.has(e.studentId) && hien(e.studentId));
  const dauNhom = (chu: string, dem: string, i?: ReactNode) => (
    <div className="flex flex-wrap items-baseline gap-x-2.5 px-4 pb-2 pt-4 max-sm:px-3">
      <h3 className="m-0 text-[15px] font-bold text-slate-100">{chu}</h3><span className="text-[13px] tabular-nums text-slate-400">{dem}</span>{i && <span className="-ml-1 self-center">{i}</span>}
    </div>
  );

  const tenPhoiHop = thuong ? t('Phối hợp') : t('Phối hợp SOS');
  const nutGhi = d.canRecord && <button type="button" className="btn btn-primary h-9 max-sm:order-first max-sm:h-11 max-sm:flex-1" onClick={() => mo({ loai: 'ghi', studentId: 0 })}>{t('+ Ghi vi phạm')}</button>;
  const batChon = () => { chonN.batTat(); setGhiNhanKq(null); };

  return (
    <Card bodyClass="p-0 [container-type:inline-size]">
      <h2 className="sr-only">{t('Ý thức & Phối hợp')}</h2>
      {/* Mockup v19 A1: phân đoạn + lọc em + tìm em trái · thao tác phải; 375 (A2): + Ghi vi phạm rộng + ⋯. */}
      {/* Mockup v20 A1: MỘT tab lớn, hai tab nhỏ (chủ SP 12/11). */}
      <TabNho value={phan} onChange={setPhan}
        muc={[{ key: 'vi-pham', nhan: t('Tình hình học tập / Ý thức'), ngan: t('Tình hình / Ý thức') }, { key: 'phoi-hop', nhan: tenPhoiHop, so: coord.data?.pendingCount ?? null }]} />
      <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3 max-sm:px-3" style={{ borderColor: 'var(--line)' }}>
        {phan === 'vi-pham' && (
          <>
            <ChipLoc ariaLabel={t('Lọc học viên')} value={locEm} onChange={setLocEm}
              muc={[{ key: 'tat-ca', nhan: t('Tất cả'), so: d.emLop.length }, { key: 'cua-toi', nhan: t('Việc của tôi'), so: cuaToi.size }]} />
            <input type="search" className="field h-9 w-[200px] py-1 max-sm:h-11 max-sm:w-full" aria-label={t('Tìm em')} placeholder={t('Tìm em')} autoComplete="off" value={tim} onChange={(e) => setTim(e.target.value)} />
          </>
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
          ) : (
            <>
              {onDiemMt && <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:hidden" onClick={onDiemMt}>{thuong ? t('Điểm Test ›') : t('Điểm Mock Test ›')}</button>}
              {chonN.bat && <span className="text-[13px] font-semibold text-[color:var(--accent)]">✓ {t('Chọn nhiều')}</span>}
              {/* TINH-HINH: GV / QL báo tình hình cho TVV; TVV hỏi GVCN. */}
              {d.coTheBao && <button ref={neoBao} type="button" className="btn h-9 max-sm:h-11 max-sm:flex-1"
                onClick={() => setHop({ neo: neoBao, che: { loai: 'bao', em: [], chonThem: d.emLop.map((e) => ({ id: e.studentId, ten: e.ten, tvv: e.tvv })) } })}>{t('Báo tình hình')}</button>}
              {d.coTheHoi && !d.coTheBao && <button ref={neoHoi} type="button" className="btn h-9 max-sm:h-11 max-sm:flex-1"
                onClick={() => setHop({ neo: neoHoi, che: { loai: 'hoi', em: null, ds: d.emLop.map((e) => ({ id: e.studentId, ten: e.ten })), gvcn: d.gvcn } })}>{t('Hỏi tình hình')}</button>}
              {nutGhi}
              {/* Mockup v20: Khai / sửa cấp bậc · Chọn nhiều vào ⋯ (thao tác giữ nguyên). */}
              {(d.canManage || onDiemMt) && (
                <MenuDong lopNut="btn h-9 min-w-[36px] max-sm:h-11 max-sm:min-w-[44px]" muc={[
                  ...(onDiemMt ? [{ key: 'diem-mt', nhan: thuong ? t('Điểm Test ›') : t('Điểm Mock Test ›'), onChon: onDiemMt }] : []),
                  ...(d.canManage ? [{ key: 'cap-bac', nhan: t('Khai / sửa cấp bậc'), onChon: () => setLoMo({ viec: 'cap-bac', ids: null }) },
                    { key: 'chon-nhieu', nhan: chonN.bat ? t('Tắt chọn nhiều') : t('Chọn nhiều'), onChon: batChon }] : []),
                ]} />
              )}
            </>
          )}
        </span>
      </div>

      {phan === 'phoi-hop' ? (
        <div className="pb-1">
          {coord.error ? <LoiTaiNho chu={t('Không tải được Phối hợp.')} onRetry={coord.reload} className="px-4 py-3" />
            : !coord.data ? <div className="px-4 py-3"><Skeleton rows={3} /></div>
            /* PHOI-HOP-V2 PR-2 (mockup #1368 K5–K6): bảng chung với panel Công việc. */
            : <BangPhoiHopHoSo turns={coord.data.rows} cot1="hocVien" onChanged={() => { coord.reload(); }} khongMo={khongMo} />}
        </div>
      ) : !d.emLop.length ? (
        <div className="p-4"><Empty title={t('Lớp chưa có học viên')} /></div>
      ) : !emCho.length && !emKhac.length ? (
        <div className="p-4">
          <Empty title={locEm === 'cua-toi' && !timChu ? t('Không có việc Ý thức nào của bạn ở lớp này') : t('Không em nào khớp')}
            action={<button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => { setLocEm('tat-ca'); setTim(''); }}>{t('Xem tất cả {n} HV', { n: d.emLop.length })}</button>} />
        </div>
      ) : (
        <div className="pb-4">
          <DauCotEm ph={iBaoPh} />
          {emCho.length > 0 && (
            <>
              {dauNhom(t('Chưa xong'), t('{n} HV', { n: emCho.length }),
                <NutLuat label={t('Thứ tự')}>{t('Em còn bước chưa xong (GVCN, QL hoặc TVV), kể cả tình hình học tập đang chờ. Thứ tự: bắt buộc / quá hạn, mới, chờ QL, chờ TVV, tình hình. Các em khác xếp theo tên.')}</NutLuat>)}
              <div className="grid gap-2.5 px-3 max-sm:px-2">
                {emCho.map(([sid, ds]) => (
                  <KhoiEm key={sid} id={`yt-em-${sid}`} ten={emLop.get(sid)?.ten ?? ''} hv={hvEm(sid)} mo={moHv === sid}
                    cuoi={(emLop.get(sid)?.soLs ?? 0) > 0 && <>
                      <div className="border-t border-dashed px-4 py-2 max-sm:px-3" style={{ borderColor: 'var(--line-strong)' }}>{thanhLs(sid)}</div>
                      {moLs.has(sid) && khungLs(sid)}
                    </>}>
                    {ds.map((x) => x.node)}
                  </KhoiEm>
                ))}
              </div>
            </>
          )}
          {emKhac.length > 0 && (
            <>
              {dauNhom(emCho.length ? t('Các em khác') : t('Các em'), t('{n} HV · theo tên', { n: emKhac.length }))}
              <div className="mx-3 overflow-hidden rounded-[10px] border max-sm:mx-2" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
                {emKhac.map((e) => (
                  <DongEmGon key={e.studentId} id={`yt-em-${e.studentId}`} hv={hvEm(e.studentId)} mo={moLs.has(e.studentId) || moHv === e.studentId}>
                    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 px-4 py-2.5 text-sm text-slate-400 max-sm:px-3 max-sm:pt-0">
                      {e.soLs > 0
                        ? <>{thanhLs(e.studentId)}<span>{nhacGan.some((x) => x.studentId === e.studentId)
                          ? t('{n} nhắc nhở · không việc chờ', { n: nhacGan.filter((x) => x.studentId === e.studentId).length }) : t('Không có vi phạm chờ')}</span></>
                        : <span><span aria-hidden className="text-ok">✓ </span>{t('Chưa có vi phạm')}</span>}
                    </div>
                    {moLs.has(e.studentId) && khungLs(e.studentId)}
                  </DongEmGon>
                ))}
              </div>
            </>
          )}
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
      {hop && <HopTinhHinh neo={hop.neo} che={hop.che} homNay={homNay} onDong={() => setHop(null)} onXong={lamMoi} />}
      {duyet && <PanelDuyetXuLy {...duyet} onDong={() => setDuyet(null)} onXong={(chu) => { if (chu) toast.push('ok', dich(chu)); setDuyet(null); DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x)); lamMoi(); }} />}
      {panels}
    </Card>
  );
}

type XuLyDong = Extract<DongThoiGianYt, { loai: 'xu-ly' }>;
/** Vi phạm trên dòng — từ dòng thời gian đã nạp (bảng lớp hoặc hồ sơ em), không thêm request. */
const vpTu = (rows: readonly DongThoiGianYt[]) => {
  const m = new Map<number, VpDong>();
  for (const x of rows) if (x.loai === 'vi-pham') m.set(x.id, { id: x.id, ngay: x.ngay, ten: x.viPham, skill: x.skill ?? null, nhom: x.nhom, nguoiGhi: x.nguoiGhi, moTa: x.moTa ?? '', nhanTrangThai: x.nhanTrangThai });
  return m;
};

/** Lịch sử em khi bảng lớp bị cắt 150 dòng: đọc `/students/:id/y-thuc` (đường có sẵn) CHỈ khi mở. */
function LsTai({ sid, phamVi, ve }: { sid: number; phamVi: 'chuoi' | 'tat-ca'; ve: (rows: DongThoiGianYt[]) => ReactNode }) {
  const { data, error, reload } = useApi<YThucHocVien>(`/students/${sid}/y-thuc${phamVi === 'tat-ca' ? '?pham-vi=tat-ca' : ''}`, [sid, phamVi]);
  if (error) return <LoiTaiNho chu={t('Không tải được lịch sử.')} onRetry={reload} className="px-4 py-3" />;
  if (!data) return <div className="px-4 py-3"><Skeleton rows={3} /></div>;
  return <>{ve(data.dongThoiGian.filter(laDongLs))}</>;
}

/** Cuộn tới hàng — không trượt khi người dùng tắt chuyển động. */
const cuonToi = (el: Element | null | undefined) =>
  el?.scrollIntoView({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

/** Hộp thang của một em (chip bậc): đọc `/students/:id/y-thuc` CHỈ khi mở. */
function ThangEm({ sid, ten, homNay, onKhai, onLichSu }: { sid: number; ten: string; homNay: string; onKhai: () => void; onLichSu: () => void }) {
  const { data: hv, error, reload } = useApi<YThucHocVien>(`/students/${sid}/y-thuc`, [sid]);
  return (
    <>
      {/* GD-6 (lời 28 ý 3, lời 36): cùng thang vạch như hồ sơ HV / panel Xác nhận xử lý — mốc WL đỏ, dày hơn, không chữ trong thanh. */}
      <span className="flex flex-wrap items-center gap-3">
        <b className="text-[15px] font-bold text-slate-100">{t('Thang · {ten}', { ten })}</b>
        {hv && <ThangVach dong={hv.dongThang} />}
      </span>
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
