import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { BoLocDoan, Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter } from '../../ui/Filters.tsx';
import { fmtTime } from '../../lib/format.ts';
import { NhomViec } from '../worklist/NhomViec.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import type { WorkGroup, WorkItem } from '../worklist/WorkList.tsx';
import { NganViecVanHanh } from '../worklist/MgmtTasksPage.tsx';
import { ChonPhuTrach, type NguoiPhuTrach } from './ChonPhuTrach.tsx';
import { CongTacKhung, khungDaNho, type KhungLoc } from '../../ui/CongTacKhung.tsx';
import {
  LOC_NHANH, LOC_NHANH_LABEL, NHOM_VIEC, NHOM_VIEC_LABEL, demLocNhanh, demNhomChip, gomNhomViec, khopLocNhanh, nhomViecCua, type LocNhanh, type NhomViec as MaNhomViec,
} from '@shared/domain/index.ts';

type Work = {
  summary: { total: number; overdue: number; today: number; mine: number };
  items: WorkItem[]; groups: WorkGroup[]; scopeEmpty: boolean; xemNguoiKhac?: boolean;
};

const thamSoNguoi = (s: string | null): NguoiPhuTrach => {
  if (s === 'toi') return 'toi';
  if (s && /^[1-9]\d*$/.test(s)) return Number(s);
  return 'tat-ca';
};

/**
 * CÔNG VIỆC › HỖ TRỢ HỌC VIÊN (PR-Ra, đặc tả §3.4).
 *
 * Bốn nhóm cố định như Tổng quan (`NhomViec`), cộng ba chiều lọc đứng cùng một hàng: lọc
 * nhanh theo hạn (Q4), Của tôi · Của GV (nhắc) + chọn một GV (chỉ QL/QT, Q1–Q2, K1-29), chip 4 nhóm có số (K1-30). QL có nút
 * Nhắc ngay trên dòng (Q5); Duyệt nằm ở hộp Chờ duyệt (PR-DUYET, K1-32). GV chỉ thấy việc của mình.
 */
export function HoTroHocVienTab() {
  const { session } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const branchId = params.get('cn') ? Number(params.get('cn')) : null;
  const laQuanLy = !!session?.nav?.workOps;
  const nguoi = laQuanLy ? thamSoNguoi(params.get('nguoi')) : 'toi';
  const loc: LocNhanh = (LOC_NHANH as readonly string[]).includes(params.get('loc') ?? '') ? (params.get('loc') as LocNhanh) : 'tat-ca';
  /* PR-DUYET (K1-30): chip 4 nhóm `nhom=`; link cũ `loai=` (một loại việc) vẫn đọc — quy về nhóm chứa loại đó. */
  const nhomTs = params.get('nhom') ?? (params.get('loai') ? nhomViecCua(params.get('loai')!) : null);
  const nhom: MaNhomViec | null = (NHOM_VIEC as readonly string[]).includes(nhomTs ?? '') ? (nhomTs as MaNhomViec) : null;
  const moViec = params.get('mo-viec') ? Number(params.get('mo-viec')) : null;

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
  /* GV không gửi `nguoi` — `/my-work` không tham số giữ NGUYÊN hành vi cũ (Q3). */
  if (laQuanLy && nguoi !== 'toi') qs.set('nguoi', String(nguoi));
  const url = `/my-work${qs.toString() ? `?${qs}` : ''}`;
  const { data, loading, error, reload, setData } = useApi<Work>(url, [url]);

  const { homNay } = useNgayNghiepVu();
  /*
   * MH4, K1-30 (Q3): công tắc khung, mặc định Tất cả ("việc vẫn gộp" — T60). Tham số `khung` trên đường dẫn thắng (`loai` ở màn này
   * là link cũ của Nhóm việc), rồi lựa chọn đã nhớ trên máy. Việc không gắn lớp (`khung` null) hiện ở mọi khung. Lọc khung đứng TRƯỚC
   * mọi bộ lọc khác, nên số trên chip hạn / nhóm đếm theo khung.
   */
  const khungUrl = params.get('khung');
  const khungChon: KhungLoc = khungUrl === 'ft' || khungUrl === 'thuong' || khungUrl === 'tat-ca' ? khungUrl : khungDaNho('cong-viec') ?? 'tat-ca';
  const tatCaViec = data?.items ?? [];
  const demKhung = useMemo(() => ({
    'tat-ca': tatCaViec.length,
    ft: tatCaViec.filter((it) => it.khung === 'ft').length,
    thuong: tatCaViec.filter((it) => it.khung === 'thuong').length,
  }), [tatCaViec]);
  /* Chỉ một khung có việc thì công tắc ẩn — khi đó không lọc (lựa chọn đã nhớ không được giấu mất việc). */
  const khung: KhungLoc = demKhung.ft > 0 && demKhung.thuong > 0 ? khungChon : 'tat-ca';
  const items = useMemo(() => (khung === 'tat-ca' ? tatCaViec : tatCaViec.filter((it) => !it.khung || it.khung === khung)), [tatCaViec, khung]);
  const trongNhom = useMemo(() => (nhom ? items.filter((it) => nhomViecCua(it.group) === nhom) : items), [items, nhom]);
  const demHan = useMemo(() => demLocNhanh(trongNhom, 'tat-ca', homNay), [trongNhom, homNay]);
  const locItems = useMemo(() => items.filter((it) => khopLocNhanh(it, loc, homNay)), [items, loc, homNay]);
  const cuoiItems = useMemo(() => (nhom ? locItems.filter((it) => nhomViecCua(it.group) === nhom) : locItems), [locItems, nhom]);
  /* PR-VAI-a (K5-10): mọi số đếm từ `items` — Phối hợp SOS là việc thật, không còn nhắc mềm cộng tay. PR-UXF-a F5: hàng chip Nhóm đếm bằng
     hàm thuần chung (`demNhomChip`) — "Tất cả" = Σ nhóm = ô "Tất cả" của Lọc nhanh khi không lọc. */
  const demNhom = useMemo(() => demNhomChip(items, loc, homNay), [items, loc, homNay]);
  const dsNhom = useMemo(() => gomNhomViec(cuoiItems), [cuoiItems]);
  /* Đang lọc thì kết quả đã ít — mở hết luôn, không bắt bấm thêm một lần gập/mở nữa. */
  const moHet = loc !== 'tat-ca' || !!nhom;

  const [dangNhac, setDangNhac] = useState<Record<string, boolean>>({});

  const bamNhac = async (it: WorkItem) => {
    if (!it.nhac || dangNhac[it.key]) return;
    setDangNhac((s) => ({ ...s, [it.key]: true }));
    try {
      const r = await api.post<{ daNhacLuc: string }>('/my-work/nhac', { key: it.key, ownerId: it.nhac.ownerId });
      setData((prev) => (prev
        ? { ...prev, items: prev.items.map((x) => (x.key === it.key ? { ...x, nhac: { ...x.nhac!, daNhacLuc: r.daNhacLuc } } : x)) }
        : prev) as Work);
    } catch (e: any) { toast.push('error', e.message); } finally { setDangNhac((s) => ({ ...s, [it.key]: false })); }
  };

  const nutPhu = (it: WorkItem) => {
    if (it.nhac) {
      if (it.nhac.daNhacLuc) return <span className="text-[11px] text-slate-500 whitespace-nowrap">Đã nhắc {fmtTime(it.nhac.daNhacLuc)}</span>;
      return (
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangNhac[it.key]} onClick={(e) => { e.stopPropagation(); bamNhac(it); }}>
          Nhắc
        </button>
      );
    }
    return null;
  };

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  return (
    <div className="space-y-4">
      {/* ───────────────────────────────────────────────── hàng lọc — một hàng, xuống dòng ở màn hẹp */}
      <div className="flex flex-wrap items-center gap-1.5">
        <CongTacKhung trang="cong-viec" coTatCa value={khung} dem={demKhung}
          onChange={(k) => setParam('khung', k === 'tat-ca' ? null : k)} />
        {demKhung.ft > 0 && demKhung.thuong > 0 && <span className="mx-1 hidden h-5 w-px sm:block" style={{ background: 'var(--line)' }} />}
        <BoLocDoan ariaLabel="Lọc nhanh" value={loc} onChange={(k) => setParam('loc', k === 'tat-ca' ? null : k)}
          muc={LOC_NHANH.map((k) => ({ key: k, nhan: LOC_NHANH_LABEL[k], so: demHan[k] }))} />
        <span className="mx-1 hidden h-5 w-px sm:block" style={{ background: 'var(--line)' }} />
        {laQuanLy && data && (
          <>
            {/* Mặc định KHÔNG có `nguoi` trên URL là "tất cả" (`thamSoNguoi`) — "Của tôi" phải GHI rõ `nguoi=toi`. */}
            <BoLocDoan ariaLabel="Việc của ai" value={nguoi === 'toi' ? 'toi' : 'tat-ca'}
              onChange={(k) => setParam('nguoi', k === 'toi' ? 'toi' : null)}
              muc={[{ key: 'toi', nhan: 'Của tôi' }, { key: 'tat-ca', nhan: 'Của GV (nhắc)', title: 'Việc của giáo viên trong phạm vi — Nhắc ngay trên dòng' }]} />
            <ChonPhuTrach chiChonGv value={nguoi}
              onChange={(v, name) => {
                setParam('nguoi', v === 'tat-ca' ? null : String(v));
                if (typeof v === 'number' && name) toast.push('ok', `Đang xem việc của ${name}`);
              }} />
          </>
        )}
        <BoLocDoan ariaLabel="Nhóm việc" value={nhom ?? 'tat-ca'}
          onChange={(k) => { const next = new URLSearchParams(params); next.delete('loai'); if (k === 'tat-ca') next.delete('nhom'); else next.set('nhom', k); setParams(next, { replace: true }); }}
          muc={[{ key: 'tat-ca', nhan: 'Tất cả', so: demNhom['tat-ca'] },
            ...NHOM_VIEC.map((k) => ({ key: k, nhan: NHOM_VIEC_LABEL[k], so: demNhom[k] }))]} />
        <BranchFilter branchId={branchId} onBranch={(id) => setParam('cn', id ? String(id) : null)} />
      </div>

      {loading && <Card><Skeleton rows={8} /></Card>}
      {data && (data.scopeEmpty) && (
        <Card><Empty title="Bạn chưa được cấp phạm vi nào" /></Card>
      )}
      {data && !data.scopeEmpty && dsNhom.length === 0 && (
        <Card><Empty title="Không có việc nào khớp bộ lọc" /></Card>
      )}
      {data && !data.scopeEmpty && dsNhom.length > 0 && (
        <Card bodyClass="p-0">
          <NhomViec nhom={dsNhom} soHien={10} moHet={moHet} onOpen={navigate} nutPhu={nutPhu} />
        </Card>
      )}

      {/*
        PR-Ra, nợ PR-O (#58): GV mở được việc Vận hành giao cho mình mà không cần vào tab Vận
        hành (họ không có quyền) — panel mở TẠI CHỖ ở tab này. QL bấm dòng "Công việc được
        giao" ở tab này cũng mở tại chỗ, không nhảy sang tab Vận hành.
      */}
      <NganViecVanHanh taskId={moViec} onClose={() => setParam('mo-viec', null)} onDone={() => invalidate('/my-work')} />
    </div>
  );
}
