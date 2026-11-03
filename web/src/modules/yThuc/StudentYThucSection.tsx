import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { api, invalidate } from '../../lib/api.ts';
import { BoLocDoan, Empty, ErrorState, LoiTaiNho, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, ngay, type ViolationCategory } from '@shared/domain/index.ts';
import { usePanelYThuc } from './panelYThuc.tsx';
import { ChiTietViPham } from './ChiTietViPham.tsx';
import { PhoiHopSosSection, type CoordTurn } from './PhoiHopSosSection.tsx';
import { NhanViPham } from './NhanViPham.tsx';
import { ThangYThuc } from './ThangYThuc.tsx';
import { BangLichSu, DsViPhamCho, LanTruoc, TomTatEm, type DongLs } from './khoiYThuc.tsx';
import { PanelBaoPhTvv, gioVnNay, lucVn } from '../congViec/PanelBaoPhTvv.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { DUONG_LAM_MOI_Y_THUC, type ViPhamV4, type YThucHocVien } from './kieu.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** Lọc Lịch sử (mockup K6): theo DÒNG hiển thị — Đã xem = vi phạm đã xem · Đã xử lý / Đã thu hồi = lần xử lý. */
type LocLs = 'tat-ca' | 'da-xem' | 'da-xu-ly' | 'thu-hoi';
/** Vi phạm "chưa xong": còn chờ GV (Mới · Cần xử lý · Quá hạn) hoặc đang trong đề xuất chờ QL. */
const CHUA_XONG = new Set(['moi', 'can_xu_ly', 'qua_han', 'cho_duyet']);
/** Trạng thái chung của em theo nhóm — vi phạm nào khác mới in nhãn riêng ở cuối dòng. */
const TT_KHOI = { qua_han: 'qua_han', bat_buoc: 'can_xu_ly', cho_duyet: 'cho_duyet', moi: 'moi', da_xu_ly: '' } as const;
const CUA_TOI = <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--hong)] align-middle" />;

/**
 * TAB `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ HỌC VIÊN — UI-3 (mockup `thiet-ke/audit-0311/u10-y-thuc.html` K3, cùng thành phần K1 của tab lớp — `khoiYThuc.tsx`).
 *   Đầu thẻ: phân đoạn `Vi phạm | Phối hợp SOS` (chủ SP 03/11) · trong Vi phạm `Cần làm | Lịch sử` · phải: Khai / sửa cấp bậc · + Ghi vi phạm.
 *   Cần làm: dải tóm tắt (Cần làm · Người xử lý · Đã tới · Lần này · Báo PH của lần nào) · MỘT hàng nút (Xác nhận xử lý · Đề xuất QL duyệt ·
 *     Đã xem · n · Đánh dấu đã thực hiện) · phản hồi tại chỗ sau "Đã xem" (Hoàn tác · Xem lại) · vi phạm chờ mở tại chỗ · lần xử lý trước.
 *   Lịch sử: lọc Đã xem · Đã xử lý · Đã thu hồi (có số) · phạm vi Lộ trình | Cả lịch sử (X08: chỉ ở đây) · nhóm vi phạm.
 *   Phối hợp SOS: mọi lượt (như cũ).
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
  const toi = useSession().session?.user?.id ?? null;
  const [params, setParams] = useSearchParams();
  const [phamVi, setPhamVi] = useState<'chuoi' | 'tat-ca'>('chuoi');
  const { data: d, error, loading, reload } = useApi<YThucHocVien>(`/students/${studentId}/y-thuc${phamVi === 'tat-ca' ? '?pham-vi=tat-ca' : ''}`, [studentId, phamVi]);
  const coord = useApi<{ rows: CoordTurn[]; pendingCount: number }>(`/students/${studentId}/phoi-hop-sos`, [studentId]);
  const [phan, setPhan] = useState<'vi-pham' | 'phoi-hop'>(params.get('sub') === 'phoi-hop' ? 'phoi-hop' : 'vi-pham');
  const [doan, setDoan] = useState<'can-lam' | 'lich-su'>('can-lam');
  const [loc, setLoc] = useState<LocLs>('tat-ca');
  const [nhomVp, setNhomVp] = useState('');
  const [moViPhamId, setMoViPhamId] = useState<number | null>(null);
  const [moThang, setMoThang] = useState(false);
  const [baoPhMo, setBaoPhMo] = useState(false);
  /* Phản hồi tại chỗ sau "Đã xem" (F03): hàng ở lại, Hoàn tác + Xem lại — không chỉ toast. */
  const [vuaXem, setVuaXem] = useState<{ ids: number[]; luc: string } | null>(null);
  /* Vi phạm đang gửi Đã xem — mọi nút Đã xem khoá tới khi xong (không gửi chồng). */
  const [dangGhiIds, setDangGhiIds] = useState<number[]>([]);
  const dangGhi = dangGhiIds.length > 0;
  const dauRef = useRef<HTMLElement>(null);
  const { mo, panels } = usePanelYThuc({ onDone: reload });

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
  /* Đã xem (N34 — trước là "Ghi nhận"): không lên bậc, vẫn tính 3 vi phạm / 2 tuần. Bỏ xem = đảo lại (luật không khoá cứng). */
  const daXem = async (ids: number[], bo = false) => {
    setDangGhiIds(ids);
    try {
      await api.post(`/students/${studentId}/y-thuc/${bo ? 'bo-ghi-nhan' : 'ghi-nhan'}`, { violationIds: ids });
      if (bo) { setVuaXem(null); toast.push('ok', t('Đã bỏ xem')); } else setVuaXem({ ids, luc: gioVnNay() });
      lamMoi();
    } catch (e: any) { toast.push('error', e.message); }
    finally { setDangGhiIds([]); }
  };

  const coXem = (v: ViPhamV4) => d.canManage && (v.trangThai === 'moi' || (v.trangThai === 'qua_han' && v.lyDoQuaHan === 'xem'));
  const chuaXong = d.viPham.filter((v) => CHUA_XONG.has(v.trangThai)).sort((a, b) => a.occurredOn.localeCompare(b.occurredOn) || a.id - b.id);
  const xemIds = chuaXong.filter(coXem).map((v) => v.id);
  const thuong = thuongVao ?? d.chuoi.nhan === 'lớp thường';
  const tenPhoiHop = thuong ? t('Phối hợp') : t('Phối hợp SOS');
  const batBuoc = d.nhom === 'bat_buoc' || d.nhom === 'qua_han';
  const coViPhamMo = d.viPham.some((v) => v.trangThai !== 'da_xu_ly');
  const nutXuLy = d.canManage && !d.deXuat && coViPhamMo;
  const ttKhoi = d.nhom ? TT_KHOI[d.nhom] : '';
  const chiTiet = (v: ViPhamV4) => (
    <div className="space-y-2">
      <ChiTietViPham violationId={v.id} onSua={(vv) => mo({ loai: 'sua', v: vv, studentName: d.ten })}
        onDaXoa={() => { setMoViPhamId(null); reload(); }} onMoXuLy={(x) => mo({ loai: 'xem', id: x })} />
      {coXem(v) && xemIds.length > 1 && (
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangGhi} onClick={() => void daXem([v.id])}>{dangGhiIds.includes(v.id) ? t('Đang lưu…') : t('Đã xem vi phạm này')}</button>
      )}
    </div>
  );

  /* ---------------- Lịch sử (mockup K6): Đã xem · lần xử lý; lọc theo dòng ---------------- */
  const vpTheoId = new Map(d.viPham.map((v) => [v.id, v]));
  const dongLs: DongLs[] = d.dongThoiGian
    .filter((x) => (x.loai === 'vi-pham' ? x.trangThai === 'da_ghi_nhan' && (!nhomVp || x.category === nhomVp) : !nhomVp))
    .map((x): DongLs => {
      if (x.loai === 'xu-ly') {
        const xong = x.status === 'done', thuHoi = x.status === 'thu_hoi';
        return {
          key: `x${x.id}`, ngay: x.ngay, tong: xong ? 'xong' : thuHoi ? 'xam' : 'dang', loai: xong ? t('Đã xử lý') : thuHoi ? t('Đã thu hồi') : dich(x.statusLabel),
          tieuDe: dich(x.nhan), ai: x.nguoi, luc: null,
          truong: [[t('Vi phạm'), t('{soViPham} vi phạm', { soViPham: x.soViPham })], ...(x.soTep ? [[t('Bằng chứng'), t('{soTep} tệp', { soTep: x.soTep })] as [string, string]] : [])],
          cuoi: <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => mo({ loai: 'xem', id: x.id })}>{t('Xem')}</button>,
        };
      }
      const v = vpTheoId.get(x.id);
      return {
        key: `v${x.id}`, ngay: x.ngay, tong: 'xam', loai: t('Đã xem'), tieuDe: x.viPham,
        truong: [[t('Nhóm'), dich(x.nhom)], ...(x.nguoiGhi ? [[t('Người ghi'), x.nguoiGhi] as [string, string]] : [])],
        ai: v?.ghiNhanBoiName ?? null, luc: v?.ghiNhanLuc ? lucVn(v.ghiNhanLuc) : null, vua: !!vuaXem?.ids.includes(x.id),
        cuoi: d.canManage ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangGhi} onClick={() => void daXem([x.id], true)}>{t('Bỏ xem')}</button> : null,
      };
    });
  const soLs = { 'da-xem': dongLs.filter((x) => x.loai === t('Đã xem')).length, 'da-xu-ly': dongLs.filter((x) => x.tong === 'xong').length, 'thu-hoi': dongLs.filter((x) => x.loai === t('Đã thu hồi')).length };
  const hienLs = dongLs.filter((x) => loc === 'tat-ca' || (loc === 'da-xem' ? x.loai === t('Đã xem') : loc === 'da-xu-ly' ? x.tong === 'xong' : x.loai === t('Đã thu hồi')));
  const nhanChuoi = d.chuoi.nhan === 'lớp thường' ? t('Lớp thường') : t('Lộ trình {nhan}', { nhan: d.chuoi.nhan });
  const xemLai = () => { setDoan('lich-su'); setLoc('da-xem'); };

  return (
    <section ref={dauRef} className="card scroll-mt-24 [container-type:inline-size]" aria-label={t('Ý thức & Phối hợp')}>
      <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3 max-sm:px-3" style={{ borderColor: 'var(--line)' }}>
        <BoLocDoan v8 ariaLabel={t('Phần')} value={phan} onChange={setPhan}
          muc={[{ key: 'vi-pham', nhan: t('Vi phạm') }, { key: 'phoi-hop', nhan: tenPhoiHop, so: coord.data?.pendingCount ?? null }]} />
        {phan === 'vi-pham' && (
          <BoLocDoan v8 ariaLabel={t('Vi phạm')} value={doan} onChange={setDoan}
            muc={[{ key: 'can-lam', nhan: t('Cần làm'), so: chuaXong.length }, { key: 'lich-su', nhan: t('Lịch sử'), so: dongLs.length }]} />
        )}
        <span className="ml-auto flex flex-wrap items-center gap-2 max-sm:ml-0 max-sm:w-full">
          {/* X08: Phối hợp luôn là mọi lượt (không theo phạm vi Lịch sử). */}
          {phan === 'phoi-hop' && <span className="text-[13px] text-slate-400">{t('mọi lượt')}</span>}
          {phan === 'vi-pham' && d.coTheKhai && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => mo({ loai: 'khai', studentId })}>{t('Khai / sửa cấp bậc')}</button>}
          {phan === 'vi-pham' && !d.coTheKhai && d.canSuaKhai && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => mo({ loai: 'khai', studentId, sua: true })}>{t('Khai / sửa cấp bậc')}</button>}
          {d.canRecord && <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0 max-sm:flex-1" onClick={() => mo({ loai: 'ghi', studentId, studentName: d.ten })}>{t('+ Ghi vi phạm')}</button>}
        </span>
      </div>

      {phan === 'phoi-hop' ? (
        <div className="px-4 pb-4 pt-3 max-sm:px-3">
          {coord.error ? <LoiTaiNho chu={t('Không tải được Phối hợp.')} onRetry={coord.reload} className="px-0 py-1" />
            : <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} cot1="luot" xanh onGoAcademic={onGoAcademic}
                onChanged={() => { coord.reload(); }} />}
        </div>
      ) : doan === 'can-lam' ? (
        <div className="grid gap-3.5 px-4 pb-4 pt-3.5 max-sm:px-3">
          <TomTatEm d={{ ...d, baoPh: d.hang.baoPh }} homNay={homNay} onBaoPh={() => setBaoPhMo(true)} />

          {(nutXuLy || (d.canManage && xemIds.length > 0) || (d.canManage && d.deXuat?.status === 'da_duyet')) && (
            <div className="flex flex-wrap items-center gap-2">
              {nutXuLy && <button type="button" className={`btn btn-sm min-h-[44px] sm:min-h-0${d.nhom !== 'moi' ? ' btn-primary' : ''}`} onClick={() => mo({ loai: 'xu-ly', studentId })}>{d.nhom !== 'moi' && CUA_TOI}{t('Xác nhận xử lý')}</button>}
              {d.canManage && xemIds.length > 0 && !batBuoc && (
                <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'transparent' }} disabled={dangGhi}
                  onClick={() => void daXem(xemIds)}>{d.nhom === 'moi' && CUA_TOI}{dangGhi ? t('Đang lưu…') : t('Đã xem · {n}', { n: xemIds.length })}</button>
              )}
              {d.canManage && d.deXuat?.status === 'da_duyet' && <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={() => mo({ loai: 'da-thuc-hien', id: d.deXuat!.id })}>{CUA_TOI}{t('Đánh dấu đã thực hiện')}</button>}
              {nutXuLy && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm font-semibold sm:min-h-0" onClick={() => mo({ loai: 'xu-ly', studentId, cheDo: 'de-xuat' })}>{t('Đề xuất QL duyệt')}</button>}
              <span className="ml-auto flex items-center gap-1">
                {batBuoc && <span className="text-[13px] font-semibold text-soon">{t('Không có "Đã xem"')}</span>}
                <NutLuat label={t('Luật xử lý vi phạm')}>
                  {t('≥ 3 vi phạm trong tuần này + tuần trước → bắt buộc xử lý. Vi phạm lẻ: Đã xem (không cần biện pháp, không lên bậc) hoặc xử lý nếu nghiêm trọng.')}
                </NutLuat>
              </span>
            </div>
          )}

          {vuaXem && (
            <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-ok-line bg-ok-bg px-3 py-2 text-sm">
              <b className="font-semibold text-ok">✓ {t('Đã xem {n} vi phạm · {gio}', { n: vuaXem.ids.length, gio: vuaXem.luc })}</b>
              <span className="ml-auto flex gap-4">
                <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" disabled={dangGhi} onClick={() => void daXem(vuaXem.ids, true)}>{t('Hoàn tác')}</button>
                <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={xemLai}>{t('Xem lại')}</button>
              </span>
            </div>
          )}

          {chuaXong.length === 0 ? (
            <p className="m-0 text-[13px] text-slate-400">{t('Em không có vi phạm nào chưa xong.')}</p>
          ) : (
            /* Mockup K3: danh sách ngay dưới dải tóm tắt (số đã ở phân đoạn "Cần làm n") · Sửa ở cuối dòng cho người ghi / người xử lý (V10, máy chủ kiểm). */
            <DsViPhamCho ds={chuaXong} homNay={homNay} moId={moViPhamId} onMo={(id) => setMoViPhamId((c) => (c === id ? null : id))} chiTiet={chiTiet}
              nhanRieng={(v) => (
                <span className="flex items-center gap-2">
                  {v.trangThai !== ttKhoi && <NhanViPham t={v.trangThai} nhan={dich(v.nhanTrangThai)} />}
                  {(d.canManage || v.reportedBy === toi) && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0"
                    onClick={() => mo({ loai: 'sua', v: { id: v.id, studentId: v.studentId, category: v.category, skill: v.skill, occurredOn: v.occurredOn, ten: v.ten, moTa: v.moTa }, studentName: d.ten })}>{t('Sửa')}</button>}
                </span>
              )} />
          )}

          {(d.hang.xuLyGanNhat || d.hang.thuHoi || d.hang.tuChoi) && (
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t pt-3 text-sm" style={{ borderColor: 'var(--line)' }}>
              <span className="text-xs font-medium text-slate-500">{t('Lần trước')}</span>
              <LanTruoc x={d.hang} homNay={homNay} onXem={(id) => mo({ loai: 'xem', id })} />
              <span className="ml-auto flex gap-4">
                <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm font-semibold sm:min-h-0" aria-expanded={moThang} onClick={() => setMoThang(!moThang)}>{t('Thang ›')}</button>
                <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm font-semibold sm:min-h-0" onClick={() => setDoan('lich-su')}>{t('Lịch sử của em ›')}</button>
              </span>
            </div>
          )}
          {!(d.hang.xuLyGanNhat || d.hang.thuHoi || d.hang.tuChoi) && (
            <div className="flex justify-end"><button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm font-semibold sm:min-h-0" aria-expanded={moThang} onClick={() => setMoThang(!moThang)}>{t('Thang ›')}</button></div>
          )}
          {moThang && <ThangYThuc d={d} homNay={homNay} />}
        </div>
      ) : (
        <div className="space-y-2 px-4 pb-4 pt-3 max-sm:px-3">
          <div className="flex flex-wrap items-center gap-2">
            <BoLocDoan ariaLabel={t('Lọc lịch sử')} value={loc} onChange={(k) => setLoc(k)}
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
          <div className="card overflow-hidden">
            <BangLichSu dong={hienLs} homNay={homNay}
              rong={<Empty title={loc === 'tat-ca' && !nhomVp ? t('Chưa có gì trong lịch sử') : t('Không có dòng nào khớp bộ lọc')} />} />
          </div>
        </div>
      )}

      {baoPhMo && d.hang.baoPh && (
        /* Báo PH tại chỗ (TVV / QL) — cùng panel với Công việc và tab lớp. */
        <PanelBaoPhTvv key={d.hang.baoPh.id}
          it={{ viecId: d.hang.baoPh.id, studentId, studentName: d.ten, due: d.hang.baoPh.han, classCode: null } as unknown as WorkItem}
          onDong={() => setBaoPhMo(false)} onDaLam={lamMoi} onTiep={null} />
      )}
      {panels}
    </section>
  );
}
