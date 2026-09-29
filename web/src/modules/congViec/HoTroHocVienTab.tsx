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
import { TraLoiDeXuatPanel } from '../cases/ThaoTacCase.tsx';
import { NganViecVanHanh } from '../worklist/MgmtTasksPage.tsx';
import { useNhacYThuc } from '../yThuc/YThucReminders.tsx';
import { ChonPhuTrach, type NguoiPhuTrach } from './ChonPhuTrach.tsx';
import { CongTacKhung, khungDaNho, type KhungLoc } from '../../ui/CongTacKhung.tsx';
import {
  LOC_NHANH, LOC_NHANH_LABEL, demLoaiViec, demLocNhanh, gomNhomViec, khopLocNhanh, type LocNhanh,
} from '@shared/domain/index.ts';

type Work = {
  summary: { total: number; overdue: number; today: number; approval: number; mine: number };
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
 * nhanh theo hạn (Q4), Người phụ trách (chỉ QL/QT, Q1–Q2), Loại việc. QL có thêm nút Nhắc/Duyệt
 * ngay trên dòng (Q5–Q6). GV chỉ thấy việc của mình — không có ô Người phụ trách.
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
  const loai = params.get('loai');
  const moViec = params.get('mo-viec') ? Number(params.get('mo-viec')) : null;
  const nhac = useNhacYThuc();

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
   * đã là Loại việc), rồi lựa chọn đã nhớ trên máy. Việc không gắn lớp (`khung` null) hiện ở mọi khung.
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
  const demHan = useMemo(() => demLocNhanh(items, loai ?? 'tat-ca', homNay), [items, loai, homNay]);
  const demLoai = useMemo(() => demLoaiViec(items, loc, homNay), [items, loc, homNay]);
  const locItems = useMemo(() => items.filter((it) => khopLocNhanh(it, loc, homNay)), [items, loc, homNay]);
  const cuoiItems = useMemo(() => (loai ? locItems.filter((it) => it.group === loai) : locItems), [locItems, loai]);
  /* Ý thức & Phối hợp là nhắc MỀM của chính người xem — không có ý nghĩa khi đang xem việc người khác. */
  const soNhacYThuc = nguoi === 'toi' ? nhac.length : 0;
  const nhom = useMemo(() => gomNhomViec(cuoiItems, soNhacYThuc), [cuoiItems, soNhacYThuc]);
  /* Đang lọc thì kết quả đã ít — mở hết luôn, không bắt bấm thêm một lần gập/mở nữa. */
  const moHet = loc !== 'tat-ca' || !!loai;

  const [dangNhac, setDangNhac] = useState<Record<string, boolean>>({});
  const [duyetDong, setDuyetDong] = useState<WorkItem | null>(null);

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
      if (it.nhac.daNhacLuc) return <span className="text-[11px] text-slate-500 whitespace-nowrap">✓ Đã nhắc {fmtTime(it.nhac.daNhacLuc)}</span>;
      return (
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangNhac[it.key]} onClick={(e) => { e.stopPropagation(); bamNhac(it); }}>
          Nhắc
        </button>
      );
    }
    if (it.duyet) {
      return (
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={(e) => { e.stopPropagation(); setDuyetDong(it); }}>
          Duyệt
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
          <ChonPhuTrach
            value={nguoi}
            onChange={(v, name) => {
              /* Mặc định KHÔNG có `nguoi` trên URL là "Tất cả trong phạm vi" (`thamSoNguoi` ở trên
                 trả về khi param lạ/thiếu) — xoá tham số ở đây thì đúng "tất cả", còn "Tôi" phải GHI
                 rõ `nguoi=toi` chứ xoá tham số sẽ rơi lại về "tất cả", không phải "tôi". */
              setParam('nguoi', v === 'tat-ca' ? null : String(v));
              if (typeof v === 'number' && name) toast.push('ok', `Đang xem việc của ${name}`);
            }}
          />
        )}
        <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-400">
          Loại việc:
          <select className="field" value={loai ?? ''} onChange={(e) => setParam('loai', e.target.value || null)}>
            <option value="">Mọi loại</option>
            {data?.groups.filter((g) => (demLoai[g.key] ?? 0) > 0).map((g) => (
              <option key={g.key} value={g.key}>{g.label} ({demLoai[g.key] ?? 0})</option>
            ))}
          </select>
        </label>
        <BranchFilter branchId={branchId} onBranch={(id) => setParam('cn', id ? String(id) : null)} />
      </div>

      {loading && <Card><Skeleton rows={8} /></Card>}
      {data && (data.scopeEmpty) && (
        <Card><Empty title="Bạn chưa được cấp phạm vi nào" /></Card>
      )}
      {data && !data.scopeEmpty && nhom.length === 0 && (
        <Card><Empty title="Không có việc nào khớp bộ lọc" /></Card>
      )}
      {data && !data.scopeEmpty && nhom.length > 0 && (
        <Card bodyClass="p-0">
          <NhomViec nhom={nhom} nhac={nguoi === 'toi' ? nhac : []} soHien={10} moHet={moHet} onOpen={navigate} nutPhu={nutPhu} />
        </Card>
      )}

      {duyetDong?.duyet && (
        <TraLoiDeXuatPanel
          hocVien={duyetDong.studentName} lop={duyetDong.classCode}
          iv={{ id: duyetDong.duyet.interventionId, kind: duyetDong.duyet.kind, description: duyetDong.duyet.description }}
          onClose={() => setDuyetDong(null)}
          onSaved={() => { invalidate('/my-work'); setDuyetDong(null); }}
        />
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
