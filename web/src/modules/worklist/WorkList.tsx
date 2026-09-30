import { type ReactNode } from 'react';
import { Level } from '../../ui/ui.tsx';
import { Han } from '../../ui/Han.tsx';
import { toneTheoNhan } from '../../lib/format.ts';
import { LOAI_HAN_CUA_VIEC } from '@shared/domain/index.ts';

export type WorkItem = {
  key: string; group: string; urgency: 'overdue' | 'today' | 'normal';
  studentId: number | null; studentName: string;
  classId: number | null; classCode: string | null;
  /** MH4: khung của lớp; `null` = việc không gắn lớp (hiện ở mọi khung). */
  khung?: 'ft' | 'thuong' | null;
  attemptId: number | null; attemptNo: number | null; caseId: number | null;
  level: { tone: 'ok' | 'info' | 'warn' | 'danger'; text: string } | null;
  reason: string; actionLabel: string; href: string;
  /** Tiêu đề dòng: động từ + đối tượng (B-2). */
  tieuDe: string;
  ownerId: number | null; owner: string | null; mine: boolean;
  due: string | null; statusLabel: string;
  /** Bài/case liên quan — ô thứ hai của dòng việc: "MT2", "Giữa khoá", "Case". */
  contextLabel: string | null;
  /** Số học viên trong một dòng việc gom. NULL khi dòng chỉ nói về một em. */
  count: number | null;
  /** PR-Ra Q5: chỉ dòng có người phụ trách là TÀI KHOẢN KHÁC người xem, và người xem là QL/QT. */
  nhac?: { ownerId: number; daNhacLuc: string | null } | null;
};
export type WorkGroup = { key: string; label: string; hint: string; items: WorkItem[]; overdue: number; today: number };

/**
 * MỘT DÒNG VIỆC (PR-UX0, mockup 17 (b3)) — ba ô: [tiêu đề + ≤ 1 badge + dòng phụ] · [hạn, cột 150px] · [nút].
 *
 * Việc cần làm là TIÊU ĐỀ (động từ + đối tượng), không nằm trong badge. Không còn `Status`/`Task`/`Alert`/`Info`
 * trên dòng: em nào · lớp · bài · số HV · người phụ trách gộp một dòng phụ mờ; hạn ở cột riêng qua `<Han>` —
 * quá hạn nối ngay sau bằng chữ "⚠ quá hạn n ngày" (B-3, B-5). Thẻ ngoài là `div` để nút phụ
 * đứng cạnh phần bấm-mở mà không lồng `button` trong `button`. Loại việc chưa có loại hạn thì hạn là ngày trơn.
 */
export function DongViec({ it, onOpen, nutPhu }: {
  it: WorkItem; onOpen: (href: string) => void;
  /** Nút phụ đứng cạnh nút chính (PR-Ra: Nhắc/Duyệt). */
  nutPhu?: ReactNode;
}) {
  const loaiHan = LOAI_HAN_CUA_VIEC[it.group];
  /* Lớp chỉ hiện khi dòng đang nói về MỘT EM — dòng gom đã lấy chính tên lớp làm tiêu đề phụ. */
  /* "Chuyển lớp cả lớp · lớp · n HV" (PR-S5F-a, mockup 20): tiêu đề đã có lớp và số em — dòng phụ không nhắc lại. */
  const gomLop = it.group === 'placement';
  const dongPhu = [
    gomLop ? null : it.studentName,
    it.classCode && it.studentName !== `Lớp ${it.classCode}` ? it.classCode : null,
    it.contextLabel,
    !gomLop && it.count !== null && it.count > 1 ? `${it.count} HV` : null,
    it.owner ?? (it.ownerId === null && !it.mine && it.group !== 'placement' && it.group !== 'next_step' ? 'chưa ai phụ trách' : null),
  ].filter(Boolean).join(' · ');
  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-1 py-2 pr-3 hover:bg-white/5 sm:grid-cols-[minmax(0,1fr)_150px_230px] sm:items-center" title={it.reason}>
      <button type="button" className="min-w-0 appearance-none border-0 bg-transparent p-0 text-left cursor-pointer" onClick={() => onOpen(it.href)}>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-slate-100">{it.tieuDe}</span>
          {it.level && <Level tone={toneTheoNhan(it.level.text, it.level.tone)}>{it.level.text}</Level>}
        </span>
        <span className="block truncate text-[11px] text-slate-500">{dongPhu}</span>
      </button>
      <span className="text-[11px]">
        {it.due ? <Han loai={loaiHan ?? 'viec-van-hanh'} han={it.due} haiDong /> : <span className="text-slate-500">—</span>}
      </span>
      <span className="flex items-center gap-2 sm:justify-end">
        {nutPhu}
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" onClick={() => onOpen(it.href)}>{it.actionLabel}</button>
      </span>
    </div>
  );
}
