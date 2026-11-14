import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { BoLocDoan, Empty, ErrorState, LoiTaiNho, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, ngay, quaHanChiXem, type ViolationCategory } from '@shared/domain/index.ts';
import { usePanelYThuc } from './panelYThuc.tsx';
import { ChiTietViPham } from './ChiTietViPham.tsx';
import type { CoordTurn } from './PhoiHopSosSection.tsx';
import { BangPhoiHopHoSo } from './BangPhoiHop.tsx';
import { ThangYThuc } from './ThangYThuc.tsx';
import { BadgeViec, CanLamEm, ChipLoc } from './khoiYThuc.tsx';
import { BaoPhDu, DauCotEm, DongLan, OBaoPh, OBuoc, ODaXuLy, TabNho, TheLoai, chuMoc, type VpDong } from './BangLan.tsx';
import { BuocTinhHinh, HopTinhHinh, NoiDungTinhHinh, TheTinhHinh, daXuLyTinhHinh, type CheDoHop, type ThaoTacTh } from './TinhHinh.tsx';
import { PanelBaoPhTvv, gioVnNay, lucVn } from '../congViec/PanelBaoPhTvv.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { DUONG_LAM_MOI_Y_THUC, type BaoPhLan, type DongThoiGianYt, type TinhHinhView, type ViPhamV4, type YThucHocVien } from './kieu.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** TINH-HINH (mockup v20 A4): lọc "Cả quá trình" theo loại — Vi phạm (đã xem, lần xử lý, thu hồi) · Nhắc nhở · Tình hình học tập. */
type LocLs = 'tat-ca' | 'vi-pham' | 'nhac-nho' | 'tinh-hinh';
type XuLyDong = Extract<DongThoiGianYt, { loai: 'xu-ly' }>;
/** Vi phạm còn chờ GVCN (không tính đang trong đề xuất chờ QL). */
const CHO_GV = new Set(['moi', 'can_xu_ly', 'qua_han']);
const LINK = 'link min-h-[30px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]';

/**
 * TINH-HINH (mockup `thiet-ke/v20/tinh-hinh.html` A4, chủ SP duyệt 12/11): hai tab nhỏ "Tình hình học tập / Ý thức" · "Phối hợp SOS"; trong tab nhỏ đầu:
 *   dải mốc (MỐC VIẾT HOA · Bậc kế · Thang ▾) + Khai / Hỏi / Báo tình hình / + Ghi vi phạm · "Đang chờ" (mọi bước còn chờ, cả tình hình hai chiều) ·
 *   "Cả quá trình" (vi phạm, nhắc nhở, tình hình, lần xử lý — mới nhất trước; lọc loại + phạm vi + nhóm). Cùng dòng `DongLan` với tab lớp.
 * (cũ) TAB `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ HỌC VIÊN — Y-THUC-V2 (mockup `thiet-ke/2026-11-11-y-thuc-v2/y-thuc-v2.html` K3 · K4, chủ SP duyệt 11/11).
 *   Cùng kiểu dòng với tab lớp (`BangLan.tsx`, bỏ cột Học viên): một lần = một khối; ① Vi phạm → ② GVCN xử lý → ③ TVV báo PH (đúng lần, đọc Nội dung) → Bước tiếp.
 *   Đầu thẻ: phân đoạn `Vi phạm | Phối hợp SOS` · trong Vi phạm `Cần làm | Lịch sử` · phải: Khai / sửa cấp bậc · + Ghi vi phạm.
 *   Dải bậc MỘT hàng: Đã tới · Bậc kế · Thang ▾ (thay dải 5 ô + hàng 4 nút khác kiểu). "Lần này" chỉ hiện ở ô ② khi PHẢI xử lý.
 *   Lịch sử: Đã xem · Đã xử lý · Đã thu hồi (chủ SP 11/11) · phạm vi Lộ trình | Cả lịch sử · nhóm vi phạm. Phối hợp SOS: mọi lượt (không đổi).
 * Thông báo / việc mở `?tab=y-thuc&mo=xu-ly` → panel Xác nhận xử lý; `&sub=phoi-hop` → mở phân đoạn Phối hợp.
 */
export function StudentYThucSection({ studentId, onGoAcademic, thuong: thuongVao }: {
  studentId: number;
  /** Lớp thường: "Phối hợp" (không có chữ SOS); FT: "Phối hợp SOS". Không truyền thì tự biết từ chuỗi em đang học (panel Công việc). */
  thuong?: boolean;
  /** Đổi sang tab Học thuật của hồ sơ (link trong thẻ Phối hợp SOS). */
  onGoAcademic?: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [phamVi, setPhamVi] = useState<'chuoi' | 'tat-ca'>('chuoi');
  const { data: d, error, loading, reload } = useApi<YThucHocVien>(`/students/${studentId}/y-thuc${phamVi === 'tat-ca' ? '?pham-vi=tat-ca' : ''}`, [studentId, phamVi]);
  const coord = useApi<{ rows: CoordTurn[]; pendingCount: number }>(`/students/${studentId}/phoi-hop-sos`, [studentId]);
  const [phan, setPhan] = useState<'vi-pham' | 'phoi-hop'>(params.get('sub') === 'phoi-hop' ? 'phoi-hop' : 'vi-pham');
  const [loc, setLoc] = useState<LocLs>('tat-ca');
  const [nhomVp, setNhomVp] = useState('');
  const [moVp, setMoVp] = useState<string | null>(null);
  const [moDu, setMoDu] = useState<number | null>(null);
  const [thang, setThang] = useState(false);
  const [baoPh, setBaoPh] = useState<{ viecId: number; han: string } | null>(null);
  /* Phản hồi tại chỗ sau "Đã xem" (F03): khối ở lại, Hoàn tác + Xem lại — không chỉ toast. */
  const [vuaXem, setVuaXem] = useState<{ ids: number[]; luc: string } | null>(null);
  const [lsVua, setLsVua] = useState<number[]>([]);
  /* Vi phạm đang gửi Đã xem — mọi nút Đã xem khoá tới khi xong (không gửi chồng). */
  const [dangGhi, setDangGhi] = useState(false);
  const dauRef = useRef<HTMLElement>(null);
  const [hop, setHop] = useState<{ che: CheDoHop; neo: RefObject<HTMLElement | null> } | null>(null);
  const neoBao = useRef<HTMLButtonElement>(null);
  const neoHoi = useRef<HTMLButtonElement>(null);
  const { mo, panels } = usePanelYThuc({ onDone: () => { setVuaXem(null); reload(); } });

  useEffect(() => {
    const moGi = params.get('mo');
    if (!moGi) return;
    if (moGi === 'xu-ly') mo({ loai: 'xu-ly', studentId });
    const xl = Number(params.get('xl')) || null;
    if (moGi === 'da-thuc-hien' && xl) mo({ loai: 'da-thuc-hien', id: xl });
    const p = new URLSearchParams(params); p.delete('mo'); p.delete('xl');
    setParams(p, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get('mo'), studentId]);
  /* PR-LT2a: việc "Báo PH kết quả Test" mở `&sub=phoi-hop` — mở phân đoạn Phối hợp và cuộn tới. */
  const coSub = params.get('sub') === 'phoi-hop';
  useEffect(() => {
    if (!coSub || !d) return;
    setPhan('phoi-hop');
    dauRef.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coSub, !!d]);

  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (loading || !d) return <Skeleton rows={5} />;

  const lamMoi = () => { DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x)); reload(); };
  /* Đã xem (N34): không lên bậc, vẫn tính 3 vi phạm / 2 tuần. Bỏ xem = đảo lại (luật không khoá cứng). */
  const daXem = async (ids: number[], bo = false) => {
    setDangGhi(true);
    try {
      await api.post(`/students/${studentId}/y-thuc/${bo ? 'bo-ghi-nhan' : 'ghi-nhan'}`, { violationIds: ids });
      if (bo) { setVuaXem(null); setLsVua((c) => c.filter((id) => !ids.includes(id))); toast.push('ok', t('Đã bỏ xem')); } else setVuaXem({ ids, luc: gioVnNay() });
      lamMoi();
    } catch (e: any) { toast.push('error', e.message); }
    finally { setDangGhi(false); }
  };

  const thuong = thuongVao ?? d.chuoi.nhan === 'lớp thường';
  const tenPhoiHop = thuong ? t('Phối hợp') : t('Phối hợp SOS');
  /* Vi phạm → dòng: ưu tiên danh sách đầy đủ của em (nhóm, người ghi, mô tả), không có thì dòng thời gian. */
  const vpDong = (v: ViPhamV4): VpDong => ({ id: v.id, ngay: v.occurredOn, ten: v.ten, skill: v.skill, nhom: v.categoryLabel, nguoiGhi: v.reportedByName, moTa: v.moTa, nhanTrangThai: v.nhanTrangThai });
  const vpTheoId = new Map<number, VpDong>(d.viPham.map((v) => [v.id, vpDong(v)]));
  for (const x of d.dongThoiGian) if (x.loai === 'vi-pham' && !vpTheoId.has(x.id)) vpTheoId.set(x.id, { id: x.id, ngay: x.ngay, ten: x.viPham, skill: x.skill ?? null, nhom: x.nhom, nguoiGhi: x.nguoiGhi, moTa: x.moTa ?? '' });
  const vpCua = (ids: readonly number[]) => ids.map((id) => vpTheoId.get(id)).filter((v): v is VpDong => !!v);
  const xemXl = (id: number) => mo({ loai: 'xem', id });
  const xls = d.dongThoiGian.filter((x): x is XuLyDong => x.loai === 'xu-ly');
  const xlTheoId = new Map(xls.map((x) => [x.id, x]));

  /* ---------------- Một dòng (cùng `DongLan` tab lớp, không cột Học viên) ---------------- */
  const khoi = (o: { key: string; vp: VpDong[]; gv: ReactNode | null; ph: ReactNode | null; tiep: ReactNode; nen?: 'vua'; b?: BaoPhLan | null; moiIds?: number[]; ls?: boolean;
    the?: ReactNode; vanDe?: ReactNode; dx?: ReactNode; moc?: string | null }) => {
    const moId = moVp?.startsWith(`${o.key}:`) ? Number(moVp.slice(o.key.length + 1)) : null;
    const chiTietVp = (v: VpDong) => (
      <div className="space-y-2">
        <ChiTietViPham violationId={v.id} onSua={(vv) => mo({ loai: 'sua', v: vv, studentName: d.ten })}
          onDaXoa={() => { setMoVp(null); reload(); }} onMoXuLy={xemXl} />
        {o.moiIds && o.moiIds.length > 1 && o.moiIds.includes(v.id) && (
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangGhi} onClick={() => void daXem([v.id])}>{t('Đã xem vi phạm này')}</button>
        )}
      </div>
    );
    /* Báo PH còn mở = bước còn chờ → cột "Bước đang làm"; đã báo / bỏ → "Đã xử lý" dòng TVV (như tab lớp). */
    const phCho = !o.ls && o.b?.trangThai === 'mo' && o.ph != null;
    const dx = o.dx !== undefined ? o.dx : o.gv || (o.ph && !phCho) ? <ODaXuLy gv={o.gv} tvv={phCho ? null : o.ph} /> : null;
    return (
      <DongLan key={o.key} moc={o.moc ?? o.vp.map((v) => v.ngay).sort().pop() ?? null} vp={o.vp} dx={dx} tiep={phCho ? <span className="flex flex-col items-stretch gap-2">{o.ph}{o.tiep}</span> : o.tiep} nen={o.nen} ls={o.ls} homNay={homNay}
        the={o.the ?? (o.vanDe ? undefined : <TheLoai loai="vp" so={o.vp.length} />)} vanDe={o.vanDe}
        moVp={moId} onMoVp={(id) => setMoVp((c) => (c === `${o.key}:${id}` ? null : `${o.key}:${id}`))} chiTietVp={chiTietVp}
        duoi={o.b && moDu === o.b.id ? <BaoPhDu id={o.b.id} homNay={homNay} onSuaHan={() => setBaoPh({ viecId: o.b!.id, han: o.b!.han })} /> : undefined} />
    );
  };
  const ph = (b: BaoPhLan | null | undefined) => (
    <OBaoPh b={b} homNay={homNay} moDu={!!b && moDu === b.id} onXemDu={b ? () => setMoDu((c) => (c === b.id ? null : b.id)) : undefined}
      onSuaHan={b ? () => setBaoPh({ viecId: b.id, han: b.han }) : undefined} />
  );
  const choAi = (vai: string, ten: string | null) => <span className="text-[13px] text-slate-500">{t('Chờ {vai}', { vai })}{ten && <> <b className="whitespace-nowrap font-semibold text-slate-300">{ten}</b></>}</span>;
  const nutChinh = (chu: string, onClick: () => void, vien = false) => <button type="button" className={`btn w-full justify-center max-sm:h-11 ${vien ? '' : 'btn-primary'}`} onClick={onClick}>{chu}</button>;
  const oXl = (x: XuLyDong) => x.status === 'thu_hoi'
    ? <OBuoc badge={<BadgeViec xuong tong="xam" title={t('Xem lần xử lý')} onClick={() => xemXl(x.id)}>{t('Đã thu hồi')}</BadgeViec>} phu={[dich(x.nhan)]} />
    : <OBuoc badge={<BadgeViec xuong tong="xong" title={t('Xem lần xử lý')} onClick={() => xemXl(x.id)}>{dich(x.nhan)} · {ngay(x.ngay, homNay)}</BadgeViec>} phu={[t('Đã xử lý'), x.soTep ? t('{soTep} tệp', { soTep: x.soTep }) : null]} />;

  /* ---------------- Cần làm (K3) ---------------- */
  /* P1 G3-1: chỉ quá hạn "xem" (không vi phạm bắt buộc) → như Mới (Đã xem), badge vẫn "Quá hạn n ngày". */
  const batBuoc = (d.nhom === 'bat_buoc' || d.nhom === 'qua_han') && !quaHanChiXem(d.nhom, d);
  const choGv = d.viPham.filter((v) => CHO_GV.has(v.trangThai)).sort((a, b) => a.occurredOn.localeCompare(b.occurredOn) || a.id - b.id);
  const xemIds = choGv.filter((v) => v.trangThai === 'moi' || (v.trangThai === 'qua_han' && v.lyDoQuaHan === 'xem')).map((v) => v.id);
  const nhomCho = batBuoc ? d.nhom : choGv.length ? (d.nhom === 'qua_han' ? 'qua_han' : 'moi') : null;
  const kCho = nhomCho ? khoi({
    key: 'cho', vp: choGv.map(vpDong), ph: null, moiIds: batBuoc ? undefined : xemIds,
    gv: d.hang.tuChoi ? <OBuoc badge={<BadgeViec xuong tong="qua" title={t('Xem lần xử lý')} onClick={() => xemXl(d.hang.tuChoi!.id)}>{t('QL từ chối')}</BadgeViec>} phu={[dich(d.hang.tuChoi.nhan)]} /> : null,
    tiep: <>
      <span className="flex flex-col items-start gap-1.5"><CanLamEm x={{ ...d, nhom: nhomCho, deXuat: null }} homNay={homNay} hanDuoi />
        {batBuoc && <span className="text-xs text-slate-400">{t('Lần này')} <b className="font-semibold text-slate-100">{dich(d.keTiep.nhan)}</b></span>}</span>
      {!d.canManage || d.deXuat ? choAi('GVCN', d.gvcn)
      : batBuoc ? <>{nutChinh(t('Xác nhận xử lý'), () => mo({ loai: 'xu-ly', studentId }))}</>
      : <>
          {xemIds.length > 0 && (
            <button type="button" className="btn w-full justify-center max-sm:h-11" style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'transparent' }} disabled={dangGhi}
              title={t('Đã xem, chưa cần xử lý')} onClick={() => void daXem(xemIds)}>{dangGhi ? t('Đang lưu…') : t('Đã xem · {n}', { n: xemIds.length })}</button>
          )}
          {/* GD-4a (lời 28): "Xác nhận xử lý" là NÚT (viền), không chữ link. */}
          {nutChinh(t('Xác nhận xử lý'), () => mo({ loai: 'xu-ly', studentId }), true)}
        </>}
    </>,
  }) : null;
  const kVua = vuaXem && !choGv.some((v) => vuaXem.ids.includes(v.id)) ? khoi({
    key: 'vua', vp: vpCua(vuaXem.ids), nen: 'vua', ph: null,
    gv: <b role="status" className="text-sm font-semibold text-ok">✓ {t('Đã xem {n} vi phạm · {gio}', { n: vuaXem.ids.length, gio: vuaXem.luc })}</b>,
    tiep: <span className="flex gap-3.5">
      <button type="button" className={LINK} disabled={dangGhi} onClick={() => void daXem(vuaXem.ids, true)}>{t('Hoàn tác')}</button>
      <button type="button" className={LINK} onClick={() => { setLoc('vi-pham'); setLsVua(vuaXem.ids); document.getElementById(`yt-ls-${studentId}`)?.scrollIntoView({ block: 'start' }); }}>{t('Xem lại')}</button>
    </span>,
  }) : null;
  const dx = d.deXuat;
  const xlDx = dx ? xlTheoId.get(dx.id) : undefined;
  const kDx = dx ? khoi({
    key: `dx${dx.id}`, vp: vpCua(xlDx?.viPhamIds ?? d.viPham.filter((v) => v.trangThai === 'cho_duyet').map((v) => v.id)), ph: ph(xlDx?.baoPh), b: xlDx?.baoPh,
    gv: <OBuoc badge={<BadgeViec xuong tong="dang" title={t('Xem đề xuất')} onClick={() => xemXl(dx.id)}>{dx.status === 'da_duyet' ? t('QL đã duyệt {nhan}', { nhan: dich(dx.nhan) }) : t('Đề xuất {nhan} · chờ QL', { nhan: dich(dx.nhan) })}</BadgeViec>}
      phu={[dx.han ? (dx.status === 'da_duyet' ? t('thực hiện trước {ngay}', { ngay: ngay(dx.han, homNay) }) : t('QL trả lời trước {ngay}', { ngay: ngay(dx.han, homNay) })) : null]} />,
    tiep: dx.status === 'da_duyet' && d.canManage ? nutChinh(t('Đánh dấu đã thực hiện'), () => mo({ loai: 'da-thuc-hien', id: dx.id }))
      : dx.status === 'da_duyet' ? choAi('GVCN', d.gvcn) : choAi('QL', null),
  }) : null;
  const th = d.hang.thuHoi?.cho ? d.hang.thuHoi : null;
  const xlTh = th ? xlTheoId.get(th.id) : undefined;
  const kTh = th ? khoi({
    key: `th${th.id}`, vp: vpCua(xlTh?.viPhamIds ?? []), ph: ph(xlTh?.baoPh), b: xlTh?.baoPh,
    gv: <OBuoc badge={<BadgeViec xuong tong="dang" title={t('Xem lần xử lý')} onClick={() => xemXl(th.id)}>{t('Xin thu hồi {nhan}', { nhan: dich(th.nhan) })}</BadgeViec>} phu={[t('chờ QL')]} />,
    tiep: choAi('QL', null),
  }) : null;
  const choTvv = xls.filter((x) => x.status === 'done' && x.baoPh?.trangThai === 'mo' && x.id !== th?.id);
  const kTvv = choTvv.map((x) => khoi({
    key: `tvv${x.id}`, vp: vpCua(x.viPhamIds), gv: oXl(x), ph: ph(x.baoPh), b: x.baoPh,
    tiep: x.baoPh!.coTheGhi ? nutChinh(t('Ghi kết quả báo PH'), () => setBaoPh({ viecId: x.baoPh!.id, han: x.baoPh!.han }), d.canManage) : choAi('TVV', null),
  }));
  /* TINH-HINH: tình hình hai chiều GV ↔ TVV — còn chờ ở "Đang chờ", xong / rút ở "Cả quá trình". */
  const fTh: ThaoTacTh = {
    onGhiBaoPh: (x) => x.baoPh && setBaoPh({ viecId: x.baoPh.id, han: x.han ?? homNay }),
    onSua: (x, neo) => setHop({ che: { loai: 'sua', x }, neo }),
    onRut: (x) => { if (!window.confirm(t('Rút tình hình này? Việc của người nhận sẽ đóng.'))) return; void api.post(`/tinh-hinh/${x.id}/rut`, {}).then(() => { toast.push('ok', t('Đã rút')); lamMoi(); }, (e) => toast.push('error', e.message)); },
    onTraLoi: (x, neo) => setHop({ che: { loai: 'tra-loi', x }, neo }),
    onHoanTacTraLoi: (x) => void api.post(`/tinh-hinh/${x.id}/tra-loi/hoan-tac`, {}).then(lamMoi, (e) => toast.push('error', e.message)),
  };
  const dongTh = (x: TinhHinhView, ls = false) => {
    const dx = daXuLyTinhHinh(x, homNay);
    return khoi({ key: `th-${x.id}`, vp: [], gv: null, ph: null, ls, moc: x.taoLuc.slice(0, 10), the: <TheTinhHinh x={x} homNay={homNay} />, vanDe: <NoiDungTinhHinh chu={x.noiDung} />,
      dx: dx.gv || dx.tvv ? <ODaXuLy gv={dx.gv} tvv={dx.tvv} /> : null, tiep: <BuocTinhHinh x={x} homNay={homNay} tvv={null} gvcn={d.gvcn} f={fTh} /> });
  };
  const kThMo = d.tinhHinh.filter((x) => x.trangThai === 'mo').map((x) => dongTh(x));
  const soCanLam = (kCho ? 1 : 0) + (dx ? 1 : 0) + (th ? 1 : 0) + choTvv.length + kThMo.length;
  const iBaoPh = <NutLuat label={t('Báo PH sinh khi nào')}>{t('GVCN: lần xử lý (bậc, ngày) hoặc Đã xem. TVV: kết quả báo PH và Nội dung TVV ghi. Báo PH sinh khi GVCN lưu xử lý hoặc khi QL duyệt / tự chốt, hạn 5 ngày.')}</NutLuat>;

  /* ---------------- Cả quá trình (mockup v20 A4) ---------------- */
  const loaiCua = (x: DongThoiGianYt): Exclude<LocLs, 'tat-ca' | 'tinh-hinh'> => (x.loai === 'vi-pham' && x.chiNhac ? 'nhac-nho' : 'vi-pham');
  const dongLs = d.dongThoiGian.filter((x) => (x.loai === 'vi-pham' ? x.trangThai === 'da_ghi_nhan' && (!nhomVp || x.category === nhomVp) : (x.status === 'done' || x.status === 'thu_hoi') && !nhomVp));
  const thLs = nhomVp ? [] : d.tinhHinh.filter((x) => x.trangThai !== 'mo');
  const soLs = { 'vi-pham': dongLs.filter((x) => loaiCua(x) === 'vi-pham').length, 'nhac-nho': dongLs.filter((x) => loaiCua(x) === 'nhac-nho').length, 'tinh-hinh': thLs.length };
  const kLs = [
    ...dongLs.filter((x) => loc === 'tat-ca' || loaiCua(x) === loc).map((x) => {
      if (x.loai === 'vi-pham' && x.chiNhac) {
        return { ngay: x.ngay, node: khoi({ key: `ls-n${x.id}`, vp: vpCua([x.id]), gv: null, ph: null, ls: true, the: <TheLoai loai="nn" />, tiep: <span className="text-slate-500">—</span> }) };
      }
      if (x.loai === 'vi-pham') {
        return { ngay: x.ngay, node: khoi({
          key: `ls-v${x.id}`, vp: vpCua([x.id]), nen: lsVua.includes(x.id) ? 'vua' : undefined, ph: null, ls: true,
          gv: <OBuoc badge={<BadgeViec tong="xam">{t('Đã xem')}</BadgeViec>} phu={[x.xemLuc && x.xemBoi ? `${lucVn(x.xemLuc)} · ${x.xemBoi}` : x.xemBoi]} />,
          /* Rà 11/11 G3-6: vi phạm đã xem vẫn xử lý ngay được. */
          tiep: d.canManage ? (
            <span className="flex flex-wrap gap-x-3">
              {x.trongChuoi !== false && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" aria-label={`${t('Xác nhận xử lý')} · ${x.viPham}`} onClick={() => mo({ loai: 'xu-ly', studentId, tick: [x.id] })}>{t('Xác nhận xử lý')}</button>}
              <button type="button" className={LINK} disabled={dangGhi} aria-label={`${t('Bỏ xem')} · ${x.viPham}`} onClick={() => void daXem([x.id], true)}>{t('Bỏ xem')}</button>
            </span>
          ) : <span className="text-slate-500">—</span>,
        }) };
      }
      return { ngay: x.ngay, node: khoi({ key: `ls-x${x.id}`, moc: x.ngay, vp: vpCua(x.viPhamIds), gv: oXl(x), ph: ph(x.baoPh), b: x.baoPh, ls: true,
        tiep: x.status === 'done' ? <span className="text-sm font-semibold text-ok">✓ {t('Xong')}</span> : <span className="text-slate-500">—</span> }) };
    }),
    ...(loc === 'tat-ca' || loc === 'tinh-hinh' ? thLs.map((x) => ({ ngay: x.taoLuc.slice(0, 10), node: dongTh(x, true) })) : []),
  ].sort((a, b) => b.ngay.localeCompare(a.ngay)).map((x) => x.node);
  const nhanChuoi = d.chuoi.nhan.startsWith('lớp thường') ? d.chuoi.nhan.replace('lớp thường', t('Lớp thường')) : t('Lộ trình {nhan}', { nhan: d.chuoi.nhan });
  const xuLyCuoi = d.hang.xuLyGanNhat;

  return (
    <section ref={dauRef} className="card scroll-mt-24 [container-type:inline-size]" aria-label={t('Ý thức & Phối hợp')}>
      {/* Mockup v20 A4: MỘT tab lớn, hai tab nhỏ (chủ SP 12/11). */}
      <TabNho value={phan} onChange={setPhan}
        muc={[{ key: 'vi-pham', nhan: t('Tình hình học tập / Ý thức'), ngan: t('Tình hình / Ý thức') }, { key: 'phoi-hop', nhan: tenPhoiHop, so: coord.data?.pendingCount ?? null }]} />

      {phan === 'phoi-hop' ? (
        <div className="pb-1">
          <div className="flex justify-end border-b px-4 py-2 text-[13px] text-slate-400 max-sm:px-3" style={{ borderColor: 'var(--line)' }}>{t('mọi lượt')}</div>
          {coord.error ? <LoiTaiNho chu={t('Không tải được Phối hợp.')} onRetry={coord.reload} className="px-4 py-3" />
            : !coord.data ? <div className="px-4 py-3"><Skeleton rows={3} /></div>
            /* PHOI-HOP-V2 PR-2 (mockup #1368 K7): cùng bảng với hồ sơ lớp, cột đầu là Lượt. */
            : <BangPhoiHopHoSo turns={coord.data.rows} cot1="luot" onGoAcademic={onGoAcademic}
                onChanged={() => { coord.reload(); }} />}
        </div>
      ) : (
        <>
          {/* Dải mốc (chủ SP 12/11: mốc VIẾT HOA, không "Đã tới") · Bậc kế · Thang ▾ · thao tác. */}
          <div className="border-b px-4 py-3 max-sm:px-3" style={{ borderColor: 'var(--line)' }}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="flex flex-wrap items-baseline gap-x-2.5 text-sm text-slate-400">
                <b className={`text-base ${d.bac > 0 ? 'font-bold text-slate-100' : 'font-medium text-slate-400'}`}>{chuMoc(d.bac, d.dongThoiGian.some((x) => x.loai === 'vi-pham' && !x.chiNhac))}</b>
                {/* Mockup v20 A4: thang mini sáu vạch (vạch đã qua tô) — chỉ để nhìn, đủ tên ở "Thang ▾". */}
                <span aria-hidden className="inline-flex items-center gap-[3px] self-center">{[1, 2, 3, 4, 5, 6].map((b) => <i key={b} className={`h-1.5 w-[26px] rounded-full ${b <= d.bac ? 'bg-[color:var(--accent)]' : 'bg-[color:var(--line-strong)]'}`} />)}</span>
                {xuLyCuoi && <span className="tabular-nums">{ngay(xuLyCuoi.ngay, homNay)}</span>}
                <span>{t('Bậc kế')} <b className="font-semibold text-slate-100">{dich(d.keTiep.nhan)}</b></span>
                <button type="button" aria-expanded={thang} className={LINK} onClick={() => setThang((x) => !x)}>{thang ? `${t('Thang')} ▴` : `${t('Thang')} ▾`}</button>
              </span>
              <span className="ml-auto flex flex-wrap items-center gap-2 max-sm:ml-0 max-sm:w-full">
                {d.coTheKhai && <button type="button" className="btn h-9 max-sm:h-11" onClick={() => mo({ loai: 'khai', studentId })}>{t('Khai / sửa cấp bậc')}</button>}
                {!d.coTheKhai && d.canSuaKhai && <button type="button" className="btn h-9 max-sm:h-11" onClick={() => mo({ loai: 'khai', studentId, sua: true })}>{t('Khai / sửa cấp bậc')}</button>}
                {d.coTheHoi && <button ref={neoHoi} type="button" className="btn h-9 max-sm:h-11 max-sm:flex-1"
                  onClick={() => setHop({ neo: neoHoi, che: { loai: 'hoi', em: { id: studentId, ten: d.ten }, gvcn: d.gvcn } })}>{t('Hỏi tình hình')}</button>}
                {d.coTheBao && <button ref={neoBao} type="button" className="btn h-9 max-sm:h-11 max-sm:flex-1"
                  onClick={() => setHop({ neo: neoBao, che: { loai: 'bao', em: [{ id: studentId, ten: d.ten, tvv: null }] } })}>{t('Báo tình hình')}</button>}
                {d.canRecord && <button type="button" className="btn btn-primary h-9 max-sm:h-11 max-sm:flex-1" onClick={() => mo({ loai: 'ghi', studentId, studentName: d.ten })}>{t('+ Ghi vi phạm')}</button>}
              </span>
            </div>
            {thang && <div className="mt-3"><ThangYThuc d={d} homNay={homNay} onKhai={d.canManage && d.coTheKhai ? () => mo({ loai: 'khai', studentId }) : undefined} /></div>}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-2.5 px-4 pb-2 pt-4 max-sm:px-3">
            <h3 className="m-0 text-[15px] font-bold text-slate-100">{t('Đang chờ')}</h3><span className="text-[13px] tabular-nums text-slate-400">{t('{n} việc', { n: soCanLam })}</span>
          </div>
          {soCanLam === 0 && !kVua ? (
            <p className="m-0 px-4 pb-2 text-sm text-slate-400 max-sm:px-3"><span aria-hidden className="text-ok">✓ </span>{t('Không có việc nào đang chờ')}</p>
          ) : (
            <div className="mx-3 overflow-hidden rounded-[10px] border surface-2 max-sm:mx-2" style={{ borderColor: 'var(--line-strong)' }}>
              <DauCotEm ph={iBaoPh} khongHv />
              {kCho}{kVua}{kDx}{kTh}{kTvv}{kThMo}
            </div>
          )}

          <div id={`yt-ls-${studentId}`} className="flex scroll-mt-24 flex-wrap items-center gap-x-3 gap-y-2 px-4 pb-2 pt-6 max-sm:px-3">
            <h3 className="m-0 text-[15px] font-bold text-slate-100">{t('Cả quá trình')}</h3><span className="text-[13px] text-slate-400">{t('mới nhất trước')}</span>
            <ChipLoc ariaLabel={t('Lọc theo loại')} value={loc} onChange={(k) => setLoc(k)}
              muc={[{ key: 'tat-ca', nhan: t('Tất cả'), so: dongLs.length + thLs.length }, { key: 'vi-pham', nhan: t('Vi phạm'), so: soLs['vi-pham'] },
                { key: 'nhac-nho', nhan: t('Nhắc nhở'), so: soLs['nhac-nho'] }, { key: 'tinh-hinh', nhan: t('Tình hình'), so: soLs['tinh-hinh'] }]} />
            <span className="ml-auto flex flex-wrap items-center gap-2 max-sm:ml-0">
              <BoLocDoan v8 ariaLabel={t('Phạm vi')} value={phamVi} onChange={setPhamVi}
                muc={[{ key: 'chuoi', nhan: nhanChuoi }, { key: 'tat-ca', nhan: t('Cả lịch sử') }]} />
              <select className="field min-h-[44px] w-auto py-1 text-xs sm:min-h-0" aria-label={t('Nhóm vi phạm')} value={nhomVp} onChange={(e) => setNhomVp(e.target.value)}>
                <option value="">{t('Mọi nhóm')}</option>
                {VIOLATION_CATEGORIES.map((c) => <option key={c} value={c}>{dich(VIOLATION_CATEGORY_LABEL[c as ViolationCategory])}</option>)}
              </select>
            </span>
          </div>
          {kLs.length
            ? <div className="mx-3 mb-4 overflow-hidden rounded-[10px] border max-sm:mx-2" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>{kLs}</div>
            : <div className="p-4"><Empty title={loc === 'tat-ca' && !nhomVp ? t('Chưa có gì trong lịch sử') : t('Không có dòng nào khớp bộ lọc')} /></div>}
        </>
      )}

      {baoPh && (
        /* Báo PH tại chỗ (TVV / QL ghi; GVCN sửa hạn) — cùng panel với Công việc và tab lớp. */
        <PanelBaoPhTvv key={baoPh.viecId}
          it={{ viecId: baoPh.viecId, studentId, studentName: d.ten, due: baoPh.han, classCode: null } as unknown as WorkItem}
          onDong={() => setBaoPh(null)} onDaLam={lamMoi} onTiep={null} />
      )}
      {hop && <HopTinhHinh neo={hop.neo} che={hop.che} homNay={homNay} onDong={() => setHop(null)} onXong={reload} />}
      {panels}
    </section>
  );
}
