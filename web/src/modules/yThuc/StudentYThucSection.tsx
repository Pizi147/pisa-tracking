import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { BoLocDoan, Empty, ErrorState, LoiTaiNho, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, addDaysIso, ngay, type ViolationCategory } from '@shared/domain/index.ts';
import { usePanelYThuc } from './panelYThuc.tsx';
import { ChiTietViPham } from './ChiTietViPham.tsx';
import { PhoiHopSosSection, type CoordTurn } from './PhoiHopSosSection.tsx';
import { ThangYThuc } from './ThangYThuc.tsx';
import { BadgeViec, CanLamEm, ChipLoc } from './khoiYThuc.tsx';
import { BaoPhDu, DauCot, KhoiLan, NhomLan, OBaoPh, OBuoc, type VpDong } from './BangLan.tsx';
import { PanelBaoPhTvv, gioVnNay, lucVn } from '../congViec/PanelBaoPhTvv.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { DUONG_LAM_MOI_Y_THUC, type BaoPhLan, type DongThoiGianYt, type ViPhamV4, type YThucHocVien } from './kieu.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** Lọc Lịch sử (mockup K6): Đã xem = vi phạm đã xem · Đã xử lý / Đã thu hồi = lần xử lý. */
type LocLs = 'tat-ca' | 'da-xem' | 'da-xu-ly' | 'thu-hoi';
type KieuLs = 'xem' | 'xu-ly' | 'thu-hoi';
const KIEU_LOC = { 'da-xem': 'xem', 'da-xu-ly': 'xu-ly', 'thu-hoi': 'thu-hoi' } as const;
type XuLyDong = Extract<DongThoiGianYt, { loai: 'xu-ly' }>;
/** Vi phạm còn chờ GVCN (không tính đang trong đề xuất chờ QL). */
const CHO_GV = new Set(['moi', 'can_xu_ly', 'qua_han']);
const LINK = 'link min-h-[30px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]';

/**
 * TAB `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ HỌC VIÊN — Y-THUC-V2 (mockup `thiet-ke/2026-11-11-y-thuc-v2/y-thuc-v2.html` K3 · K4, chủ SP duyệt 11/11).
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
  const [doan, setDoan] = useState<'can-lam' | 'lich-su'>('can-lam');
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
  /* PR-LT2a: việc "Báo phụ huynh qua TVV" mở `&sub=phoi-hop` — mở phân đoạn Phối hợp và cuộn tới. */
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

  /* ---------------- Một khối lần (không cột Học viên) ---------------- */
  const khoi = (o: { key: string; vp: VpDong[]; gv: ReactNode; ph: ReactNode | null; tiep: ReactNode; nen?: 'mo' | 'vua'; b?: BaoPhLan | null; moiIds?: number[] }) => {
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
    return (
      <KhoiLan key={o.key} hv={null} vp={o.vp} gv={o.gv} ph={o.ph} tiep={o.tiep} nen={o.nen} homNay={homNay}
        moVp={moId} onMoVp={(id) => setMoVp((c) => (c === `${o.key}:${id}` ? null : `${o.key}:${id}`))} chiTietVp={chiTietVp}
        duoi={o.b && moDu === o.b.id ? <BaoPhDu id={o.b.id} homNay={homNay} onSuaHan={() => setBaoPh({ viecId: o.b!.id, han: o.b!.han })} /> : undefined} />
    );
  };
  const ph = (b: BaoPhLan | null | undefined) => (
    <OBaoPh b={b} homNay={homNay} moDu={!!b && moDu === b.id} onXemDu={b ? () => setMoDu((c) => (c === b.id ? null : b.id)) : undefined} />
  );
  const choAi = (vai: string, ten: string | null) => <span className="text-[13px] text-slate-500">{t('Chờ {vai}', { vai })}{ten && <> <b className="whitespace-nowrap font-semibold text-slate-300">{ten}</b></>}</span>;
  const nutChinh = (chu: string, onClick: () => void, vien = false) => <button type="button" className={`btn w-full justify-center max-sm:h-11 ${vien ? '' : 'btn-primary'}`} onClick={onClick}>{chu}</button>;
  const nutPhu = (chu: string, f: () => void) => <span className="mt-1 flex justify-center"><button type="button" onClick={f} className={`${LINK} px-1`}>{chu}</button></span>;
  const oXl = (x: XuLyDong) => x.status === 'thu_hoi'
    ? <OBuoc badge={<BadgeViec xuong tong="xam" title={t('Xem lần xử lý')} onClick={() => xemXl(x.id)}>{t('Đã thu hồi')}</BadgeViec>} phu={[dich(x.nhan)]} />
    : <OBuoc badge={<BadgeViec xuong tong="xong" title={t('Xem lần xử lý')} onClick={() => xemXl(x.id)}>{dich(x.nhan)} · {ngay(x.ngay, homNay)}</BadgeViec>} phu={[t('Đã xử lý'), x.soTep ? t('{soTep} tệp', { soTep: x.soTep }) : null]} />;

  /* ---------------- Cần làm (K3) ---------------- */
  const batBuoc = d.nhom === 'bat_buoc' || d.nhom === 'qua_han';
  const choGv = d.viPham.filter((v) => CHO_GV.has(v.trangThai)).sort((a, b) => a.occurredOn.localeCompare(b.occurredOn) || a.id - b.id);
  const xemIds = choGv.filter((v) => v.trangThai === 'moi' || (v.trangThai === 'qua_han' && v.lyDoQuaHan === 'xem')).map((v) => v.id);
  const nhomCho = batBuoc ? d.nhom : choGv.length ? 'moi' : null;
  const kCho = nhomCho ? khoi({
    key: 'cho', vp: choGv.map(vpDong), ph: null, moiIds: batBuoc ? undefined : xemIds,
    gv: (
      <span className="flex flex-col items-start gap-[5px]">
        {d.hang.tuChoi && <><BadgeViec xuong tong="qua" title={t('Xem lần xử lý')} onClick={() => xemXl(d.hang.tuChoi!.id)}>{t('QL từ chối')}</BadgeViec><span className="text-xs text-slate-400">{dich(d.hang.tuChoi.nhan)}</span></>}
        <CanLamEm x={{ ...d, nhom: nhomCho, deXuat: null }} homNay={homNay} hanDuoi />
        {batBuoc && <span className="text-xs text-slate-400">{t('Lần này')} <b className="font-semibold text-slate-100">{dich(d.keTiep.nhan)}</b></span>}
      </span>
    ),
    tiep: !d.canManage || d.deXuat ? choAi('GVCN', d.gvcn)
      : batBuoc ? <>{nutChinh(t('Xác nhận xử lý'), () => mo({ loai: 'xu-ly', studentId }))}{nutPhu(t('Đề xuất QL duyệt'), () => mo({ loai: 'xu-ly', studentId, cheDo: 'de-xuat' }))}</>
      : <>
          {xemIds.length > 0 && (
            <button type="button" className="btn w-full justify-center max-sm:h-11" style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'transparent' }} disabled={dangGhi}
              title={t('Đã xem, chưa cần xử lý')} onClick={() => void daXem(xemIds)}>{dangGhi ? t('Đang lưu…') : t('Đã xem · {n}', { n: xemIds.length })}</button>
          )}
          {nutPhu(t('Xác nhận xử lý'), () => mo({ loai: 'xu-ly', studentId }))}
        </>,
  }) : null;
  const kVua = vuaXem && !choGv.some((v) => vuaXem.ids.includes(v.id)) ? khoi({
    key: 'vua', vp: vpCua(vuaXem.ids), nen: 'vua', ph: null,
    gv: <b role="status" className="text-sm font-semibold text-ok">✓ {t('Đã xem {n} vi phạm · {gio}', { n: vuaXem.ids.length, gio: vuaXem.luc })}</b>,
    tiep: <span className="flex gap-3.5">
      <button type="button" className={LINK} disabled={dangGhi} onClick={() => void daXem(vuaXem.ids, true)}>{t('Hoàn tác')}</button>
      <button type="button" className={LINK} onClick={() => { setDoan('lich-su'); setLoc('da-xem'); setLsVua(vuaXem.ids); }}>{t('Xem lại')}</button>
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
  const tuNgay = addDaysIso(homNay, -6);
  const choTvv = xls.filter((x) => x.status === 'done' && x.baoPh?.trangThai === 'mo' && x.id !== th?.id);
  const xong7 = xls.filter((x) => x.status === 'done' && x.baoPh?.trangThai !== 'mo' && x.ngay >= tuNgay && x.id !== th?.id);
  const kTvv = choTvv.map((x) => khoi({
    key: `tvv${x.id}`, vp: vpCua(x.viPhamIds), gv: oXl(x), ph: ph(x.baoPh), b: x.baoPh,
    tiep: x.baoPh!.coTheGhi ? nutChinh(t('Ghi kết quả báo PH'), () => setBaoPh({ viecId: x.baoPh!.id, han: x.baoPh!.han }), d.canManage) : choAi('TVV', null),
  }));
  const kXong = xong7.map((x) => khoi({ key: `xong${x.id}`, vp: vpCua(x.viPhamIds), gv: oXl(x), ph: ph(x.baoPh), b: x.baoPh, tiep: <span className="text-[13px] text-slate-500">✓ {t('Xong')}</span> }));
  const soCanLam = choGv.length + (dx ? 1 : 0) + (th ? 1 : 0) + choTvv.length;
  const iBaoPh = <NutLuat label={t('Báo PH sinh khi nào')}>{t('GVCN lưu xử lý (kể cả đề xuất chờ QL) → TVV của em có việc Báo PH, hạn 5 ngày. TVV ghi Nội dung: đã báo gì, PH nói gì.')}</NutLuat>;

  /* ---------------- Lịch sử (K6) — cùng kiểu khối ---------------- */
  const dongLs = d.dongThoiGian.filter((x) => (x.loai === 'vi-pham' ? x.trangThai === 'da_ghi_nhan' && (!nhomVp || x.category === nhomVp) : (x.status === 'done' || x.status === 'thu_hoi') && !nhomVp));
  const kieuLs = (x: DongThoiGianYt): KieuLs => (x.loai === 'vi-pham' ? 'xem' : x.status === 'thu_hoi' ? 'thu-hoi' : 'xu-ly');
  const soLs = { 'da-xem': dongLs.filter((x) => kieuLs(x) === 'xem').length, 'da-xu-ly': dongLs.filter((x) => kieuLs(x) === 'xu-ly').length, 'thu-hoi': dongLs.filter((x) => kieuLs(x) === 'thu-hoi').length };
  const kLs = dongLs.filter((x) => loc === 'tat-ca' || kieuLs(x) === KIEU_LOC[loc]).map((x) => {
    if (x.loai === 'vi-pham') {
      return khoi({
        key: `ls-v${x.id}`, vp: vpCua([x.id]), nen: lsVua.includes(x.id) ? 'vua' : undefined, ph: null,
        gv: <OBuoc badge={<BadgeViec tong="xam">{t('Đã xem')}</BadgeViec>} phu={[x.xemLuc && x.xemBoi ? `${lucVn(x.xemLuc)} · ${x.xemBoi}` : x.xemBoi]} />,
        tiep: d.canManage ? <button type="button" className={LINK} disabled={dangGhi} aria-label={`${t('Bỏ xem')} · ${x.viPham}`} onClick={() => void daXem([x.id], true)}>{t('Bỏ xem')}</button> : <span className="text-slate-500">—</span>,
      });
    }
    return khoi({ key: `ls-x${x.id}`, vp: vpCua(x.viPhamIds), gv: oXl(x), ph: ph(x.baoPh), b: x.baoPh, tiep: <span className="text-slate-500">—</span> });
  });
  const nhanChuoi = d.chuoi.nhan.startsWith('lớp thường') ? d.chuoi.nhan.replace('lớp thường', t('Lớp thường')) : t('Lộ trình {nhan}', { nhan: d.chuoi.nhan });
  const xuLyCuoi = d.hang.xuLyGanNhat;
  const o = (nhan: string, gt: ReactNode) => (
    <div className="grid min-w-0 content-start gap-1 border-l px-[18px] py-0.5 first:border-l-0 first:pl-0" style={{ borderColor: 'var(--line)' }}>
      <span className="whitespace-nowrap text-xs font-medium text-slate-500">{nhan}</span><span className="text-[15px] font-semibold text-slate-100">{gt}</span>
    </div>
  );

  return (
    <section ref={dauRef} className="card scroll-mt-24 [container-type:inline-size]" aria-label={t('Ý thức & Phối hợp')}>
      <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3 max-sm:px-3" style={{ borderColor: 'var(--line)' }}>
        <BoLocDoan v8 giuSo ariaLabel={t('Phần')} value={phan} onChange={setPhan}
          muc={[{ key: 'vi-pham', nhan: t('Vi phạm') }, { key: 'phoi-hop', nhan: tenPhoiHop, so: coord.data?.pendingCount ?? null }]} />
        {phan === 'vi-pham' && (
          <BoLocDoan v8 giuSo ariaLabel={t('Vi phạm')} value={doan} onChange={setDoan}
            muc={[{ key: 'can-lam', nhan: t('Cần làm'), so: soCanLam }, { key: 'lich-su', nhan: t('Lịch sử'), so: dongLs.length }]} />
        )}
        <span className="ml-auto flex flex-wrap items-center gap-2 max-sm:ml-0 max-sm:w-full">
          {/* X08: Phối hợp luôn là mọi lượt (không theo phạm vi Lịch sử). */}
          {phan === 'phoi-hop' && <span className="text-[13px] text-slate-400">{t('mọi lượt')}</span>}
          {phan === 'vi-pham' && d.coTheKhai && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => mo({ loai: 'khai', studentId })}>{t('Khai / sửa cấp bậc')}</button>}
          {phan === 'vi-pham' && !d.coTheKhai && d.canSuaKhai && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => mo({ loai: 'khai', studentId, sua: true })}>{t('Khai / sửa cấp bậc')}</button>}
          {d.canRecord && <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-[36px] max-sm:flex-1" onClick={() => mo({ loai: 'ghi', studentId, studentName: d.ten })}>{t('+ Ghi vi phạm')}</button>}
        </span>
      </div>

      {phan === 'phoi-hop' ? (
        <div className="px-4 pb-4 pt-3 max-sm:px-3">
          {coord.error ? <LoiTaiNho chu={t('Không tải được Phối hợp.')} onRetry={coord.reload} className="px-0 py-1" />
            : <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} cot1="luot" xanh onGoAcademic={onGoAcademic}
                onChanged={() => { coord.reload(); }} />}
        </div>
      ) : doan === 'can-lam' ? (
        <>
          {/* Dải bậc một hàng (mockup K3): Đã tới · Bậc kế · Thang ▾ — thang đủ mở tại chỗ. */}
          <div className="border-b px-4 py-3 max-sm:px-3" style={{ borderColor: 'var(--line)' }}>
            <div className="flex flex-wrap items-center gap-y-2">
              {o(t('Đã tới'), d.bacNhan ? <>{dich(d.bacNhan)}{xuLyCuoi && <span className="font-medium tabular-nums text-slate-400"> · {ngay(xuLyCuoi.ngay, homNay)}</span>}</> : <span className="font-medium text-slate-400">{t('chưa có')}</span>)}
              {o(t('Bậc kế'), dich(d.keTiep.nhan))}
              <span className="pl-[18px]"><button type="button" aria-expanded={thang} className={LINK} onClick={() => setThang((x) => !x)}>{thang ? `${t('Thang')} ▴` : `${t('Thang')} ▾`}</button></span>
            </div>
            {thang && <div className="mt-3"><ThangYThuc d={d} homNay={homNay} onKhai={d.canManage && d.coTheKhai ? () => mo({ loai: 'khai', studentId }) : undefined} /></div>}
          </div>
          {soCanLam + kXong.length === 0 && !kVua ? (
            <div className="p-4"><Empty title={d.viPham.length ? t('Không còn vi phạm nào cần làm') : t('Em chưa có vi phạm nào')} /></div>
          ) : (
            <div>
              <DauCot coHv={false} ph={iBaoPh} />
              {batBuoc && kCho && (
                <NhomLan tong="bb" chu={t('Bắt buộc xử lý')} dem={t('{n} vi phạm', { n: choGv.length })}
                  i={<NutLuat label={t('Luật bắt buộc xử lý')}>{t('≥ 3 vi phạm trong tuần này + tuần trước → phải xử lý; "Đã xem" không còn.')}</NutLuat>}>{kCho}</NhomLan>
              )}
              {((!batBuoc && kCho) || kVua) && (
                <NhomLan chu={t('Mới, chưa xem')} dem={t('{n} vi phạm', { n: batBuoc ? 0 : choGv.length })}
                  i={<NutLuat label={t('Đã xem là gì')}>{t('Đã xem: không lên bậc; vi phạm vẫn nằm trong 3 vi phạm / 2 tuần. Vi phạm nghiêm trọng: Xác nhận xử lý ngay.')}</NutLuat>}>{!batBuoc && kCho}{kVua}</NhomLan>
              )}
              {(kDx || kTh) && <NhomLan chu={t('Chờ QL duyệt')} dem={t('{n} lần', { n: (kDx ? 1 : 0) + (kTh ? 1 : 0) })}>{kDx}{kTh}</NhomLan>}
              {kTvv.length > 0 && <NhomLan chu={t('Chờ TVV báo PH')} dem={t('{n} lần', { n: kTvv.length })}>{kTvv}</NhomLan>}
              {kXong.length > 0 && <NhomLan tong="gap" chu={t('Xong · 7 ngày')} dem={t('{n} lần', { n: kXong.length })}>{kXong}</NhomLan>}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3 max-sm:px-3" style={{ borderColor: 'var(--line)' }}>
            <ChipLoc ariaLabel={t('Lọc lịch sử')} value={loc} onChange={(k) => setLoc(k)}
              muc={[{ key: 'tat-ca', nhan: t('Tất cả'), so: dongLs.length }, { key: 'da-xem', nhan: t('Đã xem'), so: soLs['da-xem'] },
                { key: 'da-xu-ly', nhan: t('Đã xử lý'), so: soLs['da-xu-ly'] }, { key: 'thu-hoi', nhan: t('Đã thu hồi'), so: soLs['thu-hoi'] }]} />
            <span className="ml-auto flex flex-wrap items-center gap-2">
              <BoLocDoan v8 ariaLabel={t('Phạm vi')} value={phamVi} onChange={setPhamVi}
                muc={[{ key: 'chuoi', nhan: nhanChuoi }, { key: 'tat-ca', nhan: t('Cả lịch sử') }]} />
              <select className="field min-h-[44px] w-auto py-1 text-xs sm:min-h-0" aria-label={t('Nhóm vi phạm')} value={nhomVp} onChange={(e) => setNhomVp(e.target.value)}>
                <option value="">{t('Mọi nhóm')}</option>
                {VIOLATION_CATEGORIES.map((c) => <option key={c} value={c}>{dich(VIOLATION_CATEGORY_LABEL[c as ViolationCategory])}</option>)}
              </select>
            </span>
          </div>
          {kLs.length ? <div><DauCot coHv={false} cuoi={t('Thao tác')} ph={iBaoPh} />{kLs}</div>
            : <div className="p-4"><Empty title={loc === 'tat-ca' && !nhomVp ? t('Chưa có gì trong lịch sử') : t('Không có dòng nào khớp bộ lọc')} /></div>}
        </>
      )}

      {baoPh && (
        /* Báo PH tại chỗ (TVV / QL ghi; GVCN sửa hạn) — cùng panel với Công việc và tab lớp. */
        <PanelBaoPhTvv key={baoPh.viecId}
          it={{ viecId: baoPh.viecId, studentId, studentName: d.ten, due: baoPh.han, classCode: null } as unknown as WorkItem}
          onDong={() => setBaoPh(null)} onDaLam={lamMoi} onTiep={null} />
      )}
      {panels}
    </section>
  );
}
