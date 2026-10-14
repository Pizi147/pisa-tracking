import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { Han } from '../../ui/Han.tsx';
import { NganCase } from '../students/NganCase.tsx';
import { BanGiaoPanel } from '../classes/BanGiaoPanel.tsx';
import { XacNhanXuLyPanel } from '../yThuc/XacNhanXuLyPanel.tsx';
import { DaThucHienPanel } from '../yThuc/DaThucHienPanel.tsx';
import { KhaiBacPanel } from '../yThuc/KhaiBacPanel.tsx';
import { NganViecVanHanh } from '../worklist/MgmtTasksPage.tsx';
import { MotKyNang } from '../cham/MotKyNang.tsx';
import { duongDiemTheoLuot, type BangTheoLuot } from '../cham/LuoiChamLop.tsx';
import { LOAI_HAN_CUA_VIEC } from '@shared/domain/index.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { NganTongKet } from '../students/NganTongKet.tsx';

/** Số sau dấu `:` cuối của khoá việc (`yt_thuc_hien:12`, `mgmt:5`). */
const soCuaKhoa = (k: string) => Number(k.slice(k.lastIndexOf(':') + 1)) || null;

/**
 * VIỆC NÀO LÀM TẠI CHỖ (OV-5a, mockup M1 §2; OV-12c): Xác nhận Case (Progress) · Ghi nhận xét (Case MT cũ) · Thêm PA / Kết quả PA / Xác nhận PA /
 * Mini Test (Ngăn Case, khuôn panel v3 cho Xác nhận Case · Xác nhận PA · Ghi nhận xét) · Nhập điểm
 * (một lớp · một lượt) · Bàn giao · Ý thức (xử lý, đã thực hiện, khai bậc một em) · việc Vận hành. Còn lại (Chốt lộ trình, Kết quả đầu ra, Xét lại
 * lộ trình cần cả bảng lớp; Phối hợp, Thiếu dữ liệu, thi thật…) mở trang như cũ. OV-8a: Chọn bước tiếp sau thi = ngăn Tổng kết lộ trình (mục Bước tiếp).
 */
export function lamTaiCho(it: WorkItem): boolean {
  switch (it.group) {
    case 'cause': case 'ghi_nhan_xet': return it.caseId !== null;
    case 'xac_nhan_pa': case 'ghi_ket_qua_pa': case 'mini_test': return it.caseId !== null && !!it.paId;
    case 'no_plan': return it.caseId !== null;
    case 'score': return !!it.luot && it.classId !== null;
    case 'ban_giao': return it.classId !== null;
    case 'yt_xu_ly': case 'khai_bac': return it.studentId !== null;
    case 'yt_thuc_hien': case 'mgmt': case 'buoc_tiep': return soCuaKhoa(it.key) !== null;
    default: return false;
  }
}

/**
 * PANEL PHẢI CỦA MỘT VIỆC — dùng lại đúng panel sẵn có (không viết lại): `NganCase` đúng việc, `BanGiaoPanel`, form Ý thức, `NganViecVanHanh`,
 * `MotKyNang` (danh sách em một kỹ năng, ô mở hộp nhập điểm "Lưu · em tiếp ›"). Nơi gọi bọc `KhungTaiCho` để panel nằm tại chỗ.
 * `onDaLam`: việc vừa có thay đổi đã lưu — nơi gọi giữ dòng ở chỗ cũ (mờ + gạch khi máy chủ không còn trả việc đó).
 */
export function PanelViec({ it, onDong, onDaLam, onTiep }: {
  it: WorkItem; onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null;
}) {
  const lop = it.classCode;
  const hv = it.studentId !== null ? it.studentName : null;
  const doi = () => { invalidate('/my-work'); onDaLam(); };
  switch (it.group) {
    case 'cause':
      return <NganCase key={it.key} caseId={it.caseId!} viec="xac-nhan" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} />;
    case 'ghi_nhan_xet':
      return <NganCase key={it.key} caseId={it.caseId!} viec="ghi-nhan-xet" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} />;
    case 'xac_nhan_pa':
      return <NganCase key={it.key} caseId={it.caseId!} paId={it.paId} viec="xac-nhan-pa" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} />;
    case 'ghi_ket_qua_pa': case 'mini_test':
      return <NganCase key={it.key} caseId={it.caseId!} paId={it.paId} viec="ghi-ket-qua" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} />;
    case 'no_plan':
      return <NganCase key={it.key} caseId={it.caseId!} viec="them-pa" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} />;
    case 'score':
      return <PanelNhapDiem key={it.key} it={it} onDong={onDong} onDaLam={doi} />;
    case 'ban_giao':
      return <BanGiaoPanel key={it.key} classId={it.classId!} mon={it.key.startsWith('ban_giao_mon:') ? it.key.split(':')[2] ?? null : null} onClose={onDong} onDone={doi} />;
    case 'yt_xu_ly':
      return <XacNhanXuLyPanel key={it.key} studentId={it.studentId} onClose={onDong} onDone={doi} />;
    case 'yt_thuc_hien':
      return <DaThucHienPanel key={it.key} measureId={soCuaKhoa(it.key)} onClose={onDong} onDone={doi} />;
    case 'khai_bac':
      return <KhaiBacPanel key={it.key} studentId={it.studentId} onClose={onDong} onDone={doi} />;
    case 'mgmt':
      return <NganViecVanHanh key={it.key} taskId={soCuaKhoa(it.key)} onClose={onDong} onDone={doi} />;
    case 'buoc_tiep':
      return <NganTongKet key={it.key} cycleId={soCuaKhoa(it.key)!} onClose={onDong} onDoi={doi} />;
    default:
      return null;
  }
}

/**
 * NHẬP ĐIỂM TẠI CHỖ (mockup M1 §2): bảng điểm của lớp · lượt (`/classes/:id/diem-theo-luot/:luot`, cùng nguồn Điểm theo lớp), dạng MỘT KỸ NĂNG
 * MỘT LÚC (`MotKyNang`, chọn sẵn kỹ năng của việc) — ô FT mở hộp nhập điểm (Lưu · em tiếp ›), lớp thường ô gõ thẳng. Không đường ghi mới.
 */
function PanelNhapDiem({ it, onDong, onDaLam }: { it: WorkItem; onDong: () => void; onDaLam: () => void }) {
  const { data, error, reload } = useApi<BangTheoLuot>(duongDiemTheoLuot(it.classId!, it.luot!), [it.classId, it.luot]);
  const daLuu = () => { reload(); onDaLam(); };
  /* OV-11c (CV-6): em của việc lên đầu; phần còn lại của lớp gập "Cả lớp (n)". Kỹ năng giữ như lúc mở (`kn` ban đầu). */
  const em = new Set(it.studentId !== null ? [it.studentId] : it.emIds ?? []);
  const [kn] = useState(it.kn ?? null);
  const tach = <S extends { rows: { studentId: number }[] }>(d: S, ve: (x: S) => ReactNode) => {
    const viec = d.rows.filter((r) => em.has(r.studentId));
    if (!viec.length || viec.length === d.rows.length) return ve(d);
    const khac = d.rows.filter((r) => !em.has(r.studentId));
    return (
      <>
        {ve({ ...d, rows: viec })}
        <details className="border-t" style={{ borderColor: 'var(--line)' }}>
          <summary className="min-h-[44px] cursor-pointer px-4 py-3 text-[13px] text-slate-300 sm:min-h-0 sm:py-2">Cả lớp ({khac.length})</summary>
          {ve({ ...d, rows: khac })}
        </details>
      </>
    );
  };
  const ngCanh = (
    <span className="flex flex-wrap items-center gap-x-1.5">
      <Link className="link" to={`/test/diem-lop?lop=${it.classId}&luot=${encodeURIComponent(it.luot!)}`}>
        {it.classCode} · {it.contextLabel} <span aria-hidden className="text-xs">↗</span>
      </Link>
      {it.due && <><span aria-hidden>·</span><Han loai={LOAI_HAN_CUA_VIEC.score ?? 'nhap-diem'} han={it.due} /></>}
    </span>
  );
  return (
    <KhungPanel tieuDe={it.tieuDe} ngCanh={ngCanh} onDong={onDong}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : !data ? <div className="pt-3"><Skeleton rows={6} /></div>
          : (
            <div className="-mx-4">
              {data.mode === 'ielts_band' && data.ft
                ? tach(data.ft, (d) => <MotKyNang mode="ielts_band" data={d} kn={kn} onReload={daLuu} />)
                : data.thuong ? tach(data.thuong, (d) => <MotKyNang mode="ratio" data={d} kn={kn} onReload={daLuu} anNutTao />) : null}
            </div>
          )}
    </KhungPanel>
  );
}
