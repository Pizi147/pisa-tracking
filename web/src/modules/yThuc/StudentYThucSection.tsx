import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { BoLocDoan, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { DongThoiGian, type DongThoiGianMuc } from '../../ui/DongThoiGian.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, ngay, type ViolationCategory } from '@shared/domain/index.ts';
import { usePanelYThuc } from './panelYThuc.tsx';
import { ChiTietViPham } from './ChiTietViPham.tsx';
import { PhoiHopSosSection, type CoordTurn } from './PhoiHopSosSection.tsx';
import { NhanViPham } from './NhanViPham.tsx';
import { ThangYThuc } from './ThangYThuc.tsx';
import { DUONG_LAM_MOI_Y_THUC, type YThucHocVien } from './kieu.ts';

type Loc = 'tat-ca' | 'can' | 'cho' | 'xong';
const MO_VP = new Set(['moi', 'can_xu_ly', 'qua_han']);

/**
 * TAB `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ HỌC VIÊN (PR-YT4, K3 §4f, §7.5 "tầng 1 = thanh việc"). Từ trên xuống:
 *   1. THANH VIỆC (chỉ khi có): bắt buộc · quá hạn (đã báo QL) · đề xuất chờ QL · đã duyệt chờ "Đã thực hiện" · vi phạm mới chưa xem.
 *   2. Khối Thang xử lý vi phạm: thang một dòng + hai nút `Xác nhận xử lý` · `Đề xuất QL duyệt` (+ Xác nhận cấp bậc vi phạm từ trước).
 *   3. Bộ lọc MỘT hàng `Tất cả · Cần xử lý n · Chờ duyệt · Đã xử lý` + nhóm vi phạm; phạm vi mặc định = chuỗi thang này, `Xem cả lịch sử`.
 *   4. Dòng thời gian TRỘN (vi phạm + lần xử lý, mới nhất trước) — lần xử lý là dòng đậm có vạch trái; vi phạm có nhãn + `Ghi nhận`;
 *      KHÔNG ô tick (B7 cũ bỏ — K3-48).
 *   5. Một dòng chữ phụ cuối đếm theo nhóm (thay năm ô đếm).
 * Thông báo / việc mở `?tab=y-thuc&mo=xu-ly` → mở panel Xác nhận xử lý một lần.
 */
export function StudentYThucSection({ studentId, onGoAcademic, thuong = false }: {
  studentId: number;
  /** Lớp thường: tab "Phối hợp" (không có chữ SOS); FT: "Phối hợp SOS". */
  thuong?: boolean;
  /** Đổi sang tab Học thuật của hồ sơ (link trong thẻ Phối hợp SOS). */
  onGoAcademic?: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [phamVi, setPhamVi] = useState<'chuoi' | 'tat-ca'>('chuoi');
  const { data: d, error, loading, reload } = useApi<YThucHocVien>(`/students/${studentId}/y-thuc${phamVi === 'tat-ca' ? '?pham-vi=tat-ca' : ''}`, [studentId, phamVi]);
  const [sub, setSub] = useState<'vi-pham' | 'phoi-hop'>(params.get('sub') === 'phoi-hop' ? 'phoi-hop' : 'vi-pham');   // PR-LT2a: việc "Báo phụ huynh qua TVV" mở thẳng tab Phối hợp
  /* Tải luôn để nhãn `Phối hợp {n}` có số ngay (A5). */
  const coord = useApi<{ rows: CoordTurn[]; pendingCount: number }>(`/students/${studentId}/phoi-hop-sos`, [studentId]);
  const [loc, setLoc] = useState<Loc>('tat-ca');
  const [nhomVp, setNhomVp] = useState('');
  const [moViPhamId, setMoViPhamId] = useState<number | null>(null);
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

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !d) return <Skeleton rows={5} />;

  const ghiNhan = async (ids: number[]) => {
    try {
      await api.post(`/students/${studentId}/y-thuc/ghi-nhan`, { violationIds: ids });
      DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x));
      toast.push('ok', `Đã ghi nhận ${ids.length} vi phạm`);
      reload();
    } catch (e: any) { toast.push('error', e.message); }
  };

  const vpTheoId = new Map(d.viPham.map((v) => [v.id, v]));
  const coGhiNhan = (id: number) => {
    const v = vpTheoId.get(id);
    return !!v && d.canManage && (v.trangThai === 'moi' || (v.trangThai === 'qua_han' && v.lyDoQuaHan === 'xem'));
  };
  const soCan = d.viPham.filter((v) => MO_VP.has(v.trangThai)).length;

  const hopLoc = (x: (typeof d.dongThoiGian)[number]) => {
    if (nhomVp && (x.loai !== 'vi-pham' || x.category !== nhomVp)) return false;
    if (loc === 'tat-ca') return true;
    if (x.loai === 'xu-ly') return loc === 'xong' ? x.status === 'done' : loc === 'cho' ? x.status === 'cho_duyet' || x.status === 'da_duyet' : false;
    if (loc === 'can') return MO_VP.has(x.trangThai);
    if (loc === 'cho') return x.trangThai === 'cho_duyet';
    return x.trangThai === 'da_xu_ly';
  };

  const muc: DongThoiGianMuc[] = d.dongThoiGian.filter(hopLoc).map((x) => x.loai === 'xu-ly' ? {
    key: `x${x.id}`, ngay: x.ngay, vach: true,
    cot2: <span className="text-[11px] font-bold uppercase tracking-[.04em] text-slate-400">Xử lý</span>,
    tieuDe: <span className="font-bold">{x.nhan}</span>,
    dongPhu: [`${x.soViPham} vi phạm`, x.nguoi, x.soTep ? `${x.soTep} tệp` : null, x.status !== 'done' ? x.statusLabel : null].filter(Boolean).join(' · '),
    cuoi: <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => mo({ loai: 'xem', id: x.id })}>Xem</button>,
  } : {
    key: `v${x.id}`, ngay: x.ngay,
    cot2: <span className="text-[11px] text-slate-400">Vi phạm</span>,
    tieuDe: x.viPham,
    dongPhu: [x.nhom, x.mon, x.nguoiGhi ? `${x.nguoiGhi} ghi` : null].filter(Boolean).join(' · '),
    cuoi: (
      <span className="flex flex-wrap items-center justify-end gap-1.5">
        <NhanViPham t={x.trangThai} nhan={x.nhanTrangThai} />
        {coGhiNhan(x.id) && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => void ghiNhan([x.id])}
          title="Đã xem, không cần xử lý">Ghi nhận</button>}
      </span>
    ),
    mo: moViPhamId === x.id,
    onMo: () => setMoViPhamId((c) => (c === x.id ? null : x.id)),
    chiTiet: <ChiTietViPham violationId={x.id} onSua={(vv) => mo({ loai: 'sua', v: vv })}
      onDaXoa={() => { setMoViPhamId(null); reload(); }} onMoXuLy={(id) => mo({ loai: 'xem', id })} />,
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="m-0 flex-1 text-sm font-semibold text-slate-200">Ý thức & Phối hợp</h2>
        {d.canRecord && <button type="button" className="btn btn-sm btn-primary" onClick={() => mo({ loai: 'ghi', studentId, studentName: d.ten })}>+ Ghi vi phạm</button>}
      </div>
      <HangTab cap="con" ariaLabel="Ý thức & Phối hợp của học viên" value={sub} onChange={setSub}
        tabs={[{ key: 'vi-pham', label: 'Vi phạm & xử lý', so: soCan }, { key: 'phoi-hop', label: thuong ? 'Phối hợp' : 'Phối hợp SOS', so: coord.data?.pendingCount ?? 0 }]} />

      {sub === 'vi-pham' && (
        <>
          <ThanhViec d={d} homNay={homNay}
            onDaThucHien={(id) => mo({ loai: 'da-thuc-hien', id })}
            onGhiNhan={() => void ghiNhan(d.viPham.filter((v) => coGhiNhan(v.id)).map((v) => v.id))} />
          <ThangYThuc d={d} homNay={homNay}
            onKhai={d.canManage ? () => mo({ loai: 'khai', studentId }) : undefined}
            onXuLy={() => mo({ loai: 'xu-ly', studentId })}
            onDeXuat={d.canManage ? () => mo({ loai: 'xu-ly', studentId, cheDo: 'de-xuat' }) : undefined} />
          {d.canSuaKhai && d.khai && (
            <p className="m-0 text-xs text-slate-500">
              Đã xác nhận cấp bậc vi phạm{d.khai.bac > 0 ? ` (bậc ${d.khai.bac})` : ''} ngày {ngay(d.khai.luc, homNay)}.{' '}
              <button type="button" className="link inline-flex items-center appearance-none border-0 bg-transparent p-0 min-h-[44px] sm:min-h-0" onClick={() => mo({ loai: 'khai', studentId, sua: true })}>Sửa cấp bậc</button>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <BoLocDoan ariaLabel="Lọc dòng thời gian" value={loc} onChange={setLoc}
              muc={[{ key: 'tat-ca', nhan: 'Tất cả' }, { key: 'can', nhan: 'Cần xử lý', so: soCan || null }, { key: 'cho', nhan: 'Chờ duyệt' }, { key: 'xong', nhan: 'Đã xử lý' }]} />
            <select className="field ml-auto w-auto py-1 text-xs" aria-label="Nhóm vi phạm" value={nhomVp} onChange={(e) => setNhomVp(e.target.value)}>
              <option value="">Mọi nhóm</option>
              {VIOLATION_CATEGORIES.map((c) => <option key={c} value={c}>{VIOLATION_CATEGORY_LABEL[c as ViolationCategory]}</option>)}
            </select>
          </div>

          <DongThoiGian bien="day-du" muc={muc}
            rong={<Empty title={loc === 'tat-ca' && !nhomVp ? 'Chưa có vi phạm nào' : 'Không có dòng nào khớp bộ lọc'} />} />

          <p className="m-0 flex flex-wrap items-center gap-x-2 text-[11.5px] text-slate-500">
            <span>
              {phamVi === 'chuoi' ? (d.chuoi.nhan === 'lớp thường' ? 'Các khoá lớp thường này' : `Lộ trình ${d.chuoi.nhan}`) : 'Cả lịch sử'}:
              {' '}{d.demCuoi.tong} vi phạm{d.demCuoi.theoNhom.length ? ` · ${d.demCuoi.theoNhom.map((x) => `${x.so} ${x.nhom}`).join(' · ')}` : ''}
            </span>
            <button type="button" className="link inline-flex items-center appearance-none border-0 bg-transparent p-0 min-h-[44px] sm:min-h-0" onClick={() => setPhamVi((v) => (v === 'chuoi' ? 'tat-ca' : 'chuoi'))}>
              {phamVi === 'chuoi' ? 'Xem cả lịch sử' : 'Chỉ chuỗi hiện tại'}
            </button>
          </p>
        </>
      )}

      {sub === 'phoi-hop' && (
        <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} cot1="luot" onGoAcademic={onGoAcademic}
          onChanged={() => { coord.reload(); }} />
      )}

      {panels}
    </div>
  );
}

/**
 * THANH VIỆC — tầng 1 của tab HV (§7.5): MỘT câu việc (+ nút Ghi nhận / Đánh dấu đã thực hiện). Nút Xác nhận xử lý / Đề xuất QL duyệt nằm
 * ở khối Thang ngay dưới — một chỗ, không lặp. Không có việc thì không vẽ.
 */
function ThanhViec({ d, homNay, onDaThucHien, onGhiNhan }: {
  d: YThucHocVien; homNay: string; onDaThucHien: (id: number) => void; onGhiNhan: () => void;
}) {
  const nut = (nhan: string, onClick: () => void) => (d.canManage
    ? <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={onClick}>{nhan}</button> : null);
  let tone = '';
  let cau: ReactNode = null;
  let hanh: ReactNode = null;
  if (d.nhom === 'qua_han' && d.soBatBuoc > 0) {
    tone = 'border-late-line bg-late-bg text-late';
    cau = <>{d.soBatBuoc} vi phạm bắt buộc xử lý · quá hạn {d.quaHanNgay ?? ''} ngày{d.daBaoQl ? ' · đã báo QL' : ''}</>;
  } else if (d.deXuat?.status === 'da_duyet') {
    tone = d.deXuat.quaHan ? 'border-late-line bg-late-bg text-late' : 'border-wait-line bg-wait-bg text-wait';
    cau = <>Đã duyệt {d.deXuat.nhan}{d.deXuat.han ? ` · ghi "Đã thực hiện" trước ${ngay(d.deXuat.han, homNay)}` : ''}{d.deXuat.quaHan && d.daBaoQl ? ' · đã báo QL' : ''}</>;
    hanh = nut('Đánh dấu đã thực hiện', () => onDaThucHien(d.deXuat!.id));
  } else if (d.soBatBuoc > 0) {
    tone = 'border-soon-line bg-soon-bg text-soon';
    cau = <>{d.soBatBuoc} vi phạm trong tuần này + tuần trước → bắt buộc xử lý{d.han ? ` · hạn ${ngay(d.han, homNay)}` : ''}</>;
  } else if (d.deXuat?.status === 'cho_duyet') {
    tone = 'border-wait-line bg-wait-bg text-wait';
    cau = <>Đề xuất {d.deXuat.nhan} · chờ QL{d.deXuat.han ? ` · hạn ${ngay(d.deXuat.han, homNay)}` : ''}</>;
  } else if (d.soMoi > 0) {
    tone = d.nhom === 'qua_han' ? 'border-late-line bg-late-bg text-late' : 'border-[color:var(--line-strong)] text-slate-300';
    cau = <>{d.soMoi} vi phạm chưa xem{d.nhom === 'qua_han' ? ` · quá hạn${d.daBaoQl ? ' · đã báo QL' : ''}` : d.hanXem ? ` · hạn ${ngay(d.hanXem, homNay)}` : ''}</>;
    hanh = d.canManage ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={onGhiNhan}>Ghi nhận {d.soMoi}</button> : null;
  }
  if (!cau) return null;
  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 ${tone}`} role="status">
      <p className="m-0 min-w-0 flex-1 basis-full text-sm font-semibold sm:basis-0">{cau}</p>
      {hanh}
    </div>
  );
}
