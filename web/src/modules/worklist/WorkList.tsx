import { type ReactNode } from 'react';
import { Alert, Info, Level, Status, Task } from '../../ui/ui.tsx';
import { Han } from '../../ui/Han.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { LOAI_HAN_CUA_VIEC, ngay } from '@shared/domain/index.ts';
import { DongTinHieu } from './DongTinHieu.tsx';

export type WorkItem = {
  key: string; group: string; urgency: 'overdue' | 'today' | 'normal';
  studentId: number | null; studentName: string;
  classId: number | null; classCode: string | null;
  attemptId: number | null; attemptNo: number | null; caseId: number | null;
  level: { tone: 'ok' | 'info' | 'warn' | 'danger'; text: string } | null;
  reason: string; actionLabel: string; overdueLabel: string | null; href: string;
  ownerId: number | null; owner: string | null; mine: boolean;
  due: string | null; statusLabel: string;
  /** Bài/case liên quan — ô thứ hai của dòng việc: "MT2", "Giữa khoá", "Case". */
  contextLabel: string | null;
  /** Số học viên trong một dòng việc gom. NULL khi dòng chỉ nói về một em. */
  count: number | null;
  /** Dòng tín hiệu SOS (§3.10): đủ để vẽ hai nút "Tạo Case · Bỏ qua". Chỉ dòng `verify` có. */
  signal?: {
    id: number; kind: 'normal' | 'ft'; skill: string | null; skillLabel: string;
    score: number | null; total: number | null; deadline: string; actions: ('create_case' | 'dismiss')[];
  } | null;
  /** PR-Ra Q6: dòng đề xuất PA học thuật chờ duyệt — đủ để mở `ApprovalDialog` ngay trên dòng. */
  duyet?: { interventionId: number; kind: string; description: string } | null;
  /** PR-Ra Q5: chỉ dòng có người phụ trách là TÀI KHOẢN KHÁC người xem, và người xem là QL/QT. */
  nhac?: { ownerId: number; daNhacLuc: string | null } | null;
};
export type WorkGroup = { key: string; label: string; hint: string; items: WorkItem[]; overdue: number; today: number };

/**
 * MỘT DÒNG VIỆC — thẻ ngoài là `div` để nút "Tạo Case · Bỏ qua" đứng cạnh phần bấm-mở mà
 * không lồng `button` trong `button`. Hạn hiện qua `<Han>` khi loại việc có loại hạn (G-10);
 * loại việc chưa có thì hạn là ngày trơn.
 */
export function DongViec({ it, onOpen, nutPhu }: {
  it: WorkItem; onOpen: (href: string) => void;
  /** Nút phụ đứng cạnh nhãn việc (PR-Ra: Nhắc/Duyệt) — thay `Task` mặc định khi có. */
  nutPhu?: ReactNode;
}) {
  const { homNay } = useNgayNghiepVu();
  const loaiHan = LOAI_HAN_CUA_VIEC[it.group];
  const coNut = !!it.signal && it.signal.actions.length > 0;
  return (
    <div className="px-4 py-3 hover:bg-white/5 grid gap-x-3 gap-y-1.5 grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-center">
      <button type="button" className="appearance-none bg-transparent border-0 p-0 text-left min-w-0 cursor-pointer" onClick={() => onOpen(it.href)}>
        {/* Ô 1–2: em nào (hoặc lớp nào), và việc gì */}
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-100 font-medium">{it.studentName}</span>
            {/*
              LỚP chỉ hiện khi ô đầu đang nói về MỘT EM — dòng gom đã lấy chính tên
              lớp làm ô đầu, nhắc lại lần nữa là thừa.
            */}
            {it.classCode && it.studentName !== `Lớp ${it.classCode}` && <Info>{it.classCode}</Info>}
            {/* BÀI/CASE LIÊN QUAN — nói rõ MT nào, thay vì bắt mở ra mới biết. */}
            {it.contextLabel && <Info>{it.contextLabel}</Info>}
            {it.count !== null && it.count > 1 && (
              <span className="text-[11px] text-slate-500 tabular-nums">{it.count} học viên</span>
            )}
            {it.level && <Level tone={it.level.tone}>{it.level.text}</Level>}
            {/* ⚠ chỉ nghĩa là QUÁ HẠN (G-4): "Hạn hôm nay" là nhãn vàng không dấu. */}
            {it.overdueLabel && (
              it.urgency === 'overdue'
                ? <Alert tone="danger">{it.overdueLabel}</Alert>
                : <Level tone="warn">{it.overdueLabel}</Level>
            )}
          </span>
          <span className="block text-xs text-slate-400 mt-0.5">{it.reason}</span>
          {/* Ô 3–5: người phụ trách · hạn · trạng thái — đứng thành một dòng phụ gọn. */}
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-500">
            {/* Nhóm no_owner đã nói "Chưa có người phụ trách" ở ô trạng thái — không lặp lại (G-3). */}
            {(it.owner || it.statusLabel !== 'Chưa có người phụ trách') && <span>{it.owner ?? 'Chưa có người phụ trách'}</span>}
            {loaiHan && it.due ? <Han loai={loaiHan} han={it.due} /> : <span>{it.due ? `Hạn ${ngay(it.due, homNay)}` : 'Chưa có hạn'}</span>}
            {/*
              TRẠNG THÁI và QUÁ HẠN là hai thông tin khác nhau (mục 7.7): quá hạn
              đã có nhãn cảnh báo riêng ở trên, nên ô này chỉ nói việc đang ở đâu
              trong quy trình. Tô nó theo độ gấp thì một dòng có hai chỗ báo động
              về cùng một chuyện.
            */}
            <Status kind={it.group === 'decide' ? 'waiting' : it.group === 'no_plan' || it.group === 'no_owner' ? 'idle' : 'doing'}>{it.statusLabel}</Status>
          </span>
        </span>
      </button>
      {/* Nhãn VIỆC luôn trung tính: màu gấp đã nằm ở nhãn quá hạn bên trái. Dòng tín hiệu thì thay bằng hai nút. */}
      <span className="flex items-center gap-2 shrink-0">
        {nutPhu}
        {coNut ? <DongTinHieu it={it} /> : <Task>{it.actionLabel}</Task>}
      </span>
    </div>
  );
}
