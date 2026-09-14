import { useEffect, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Empty, Info, Level, SectionNote, Skeleton } from '../../ui/ui.tsx';
import { fmtDate, skillLabel } from '../../lib/format.ts';

/**
 * PHÂN CÔNG GIÁO VIÊN VÀO LỚP.
 *
 * Một lớp có thể có HAI người cùng dạy một kỹ năng (hai lớp trong dữ liệu thật đang như
 * vậy), nên mỗi kỹ năng là một danh sách chứ không phải một ô chọn. Ô chọn một-người sẽ
 * âm thầm đá mất người thứ hai — đúng kiểu lỗi chỉ lộ ra khi ai đó không nhập được điểm.
 *
 * Gửi lên NGUYÊN bức tranh đang hiển thị, không gửi từng thao tác thêm/bớt: hai người sửa
 * cùng lúc thì kết quả vẫn là một trong hai bức tranh, không phải một trạng thái pha trộn
 * mà không ai định.
 */

type Slot = { userId: number; skill: string | null; isCore: boolean };
type Teachers = {
  classId: number; classCode: string; branchCode: string;
  skills: string[];
  core: { userId: number; name: string; from: string }[];
  bySkill: { skill: string; userId: number; name: string; from: string }[];
  candidates: { id: number; name: string; code: string; title: string | null; classCount: number; inThisClass: boolean }[];
  past: { name: string; skill: string | null; isCore: boolean; from: string; to: string | null }[];
  viewer: { canAssign: boolean };
};

export function TeacherAssignDialog({ open, onClose, classId, classCode, onDone }: {
  open: boolean; onClose: () => void; classId: number; classCode: string; onDone: () => void;
}) {
  const toast = useToast();
  const { data, loading, error } = useApi<Teachers>(open ? `/classes/${classId}/teachers` : null, [open]);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [busy, setBusy] = useState(false);

  // Nạp bức tranh hiện tại một lần khi mở; sửa xong mới gửi lên.
  useEffect(() => {
    if (!data) { setSlots(null); return; }
    setSlots([
      ...data.core.map((c) => ({ userId: c.userId, skill: null, isCore: true })),
      ...data.bySkill.map((c) => ({ userId: c.userId, skill: c.skill, isCore: false })),
    ]);
  }, [data]);

  const nameOf = (id: number) => data?.candidates.find((c) => c.id === id)?.name
    ?? data?.core.find((c) => c.userId === id)?.name
    ?? data?.bySkill.find((c) => c.userId === id)?.name
    ?? `#${id}`;

  const inSlot = (skill: string | null) =>
    (slots ?? []).filter((s) => (skill === null ? s.isCore : s.skill === skill));
  const add = (userId: number, skill: string | null) => {
    if (!userId) return;
    setSlots((cur) => {
      const list = cur ?? [];
      const dup = list.some((s) => s.userId === userId && (skill === null ? s.isCore : s.skill === skill));
      return dup ? list : [...list, { userId, skill, isCore: skill === null }];
    });
  };
  const remove = (userId: number, skill: string | null) =>
    setSlots((cur) => (cur ?? []).filter(
      (s) => !(s.userId === userId && (skill === null ? s.isCore : s.skill === skill)),
    ));

  const row = (skill: string | null, label: string, hint?: string) => (
    <div key={label} className="py-2.5 border-b last:border-0" style={{ borderColor: 'var(--line)' }}>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-sm text-slate-200 min-w-[7.5rem]">{label}</span>
        {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        {inSlot(skill).length === 0 && <span className="text-xs text-slate-500">Chưa phân công</span>}
        {inSlot(skill).map((s) => (
          <span key={s.userId} className="inline-flex items-center gap-1">
            <Info>{nameOf(s.userId)}</Info>
            <button className="text-slate-500 hover:text-rose-200 text-xs leading-none px-1"
              title="Bỏ phân công" onClick={() => remove(s.userId, skill)}>×</button>
          </span>
        ))}
        <select className="field w-auto text-xs py-1" value=""
          onChange={(e) => { add(Number(e.target.value), skill); e.currentTarget.value = ''; }}>
          <option value="">+ Thêm giáo viên</option>
          {(data?.candidates ?? [])
            .filter((c) => !inSlot(skill).some((s) => s.userId === c.id))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.classCount ? ` · ${c.classCount} lớp` : ''}
              </option>
            ))}
        </select>
      </div>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={`Phân công giáo viên · ${classCode}`}
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy || !slots || !data?.viewer.canAssign}
            onClick={async () => {
              setBusy(true);
              try {
                await api.put(`/classes/${classId}/teachers`, { slots });
                invalidate('/classes'); invalidate('/my-work');
                toast.push('ok', 'Đã lưu phân công');
                onDone(); onClose();
              } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
            }}>Lưu</button>
        </>
      }>
      {loading && <Skeleton rows={5} />}
      {error && <Empty title="Không đọc được phân công" hint={error.message} />}
      {data && !data.viewer.canAssign && (
        <SectionNote>
          Bạn xem được phân công nhưng không đổi được. Đổi phân công là việc của Quản lý và
          Admin chi nhánh.
        </SectionNote>
      )}
      {data && slots && (
        <div className="space-y-1">
          {row(null, 'GVCN', 'Chăm cả lớp, đóng được vấn đề của lớp')}
          {data.skills.map((sk) => row(sk, skillLabel(sk), 'Chỉ nhập được điểm kỹ năng này'))}

          <SectionNote>
            Bỏ phân công KHÔNG xoá lịch sử: dòng cũ được đóng lại theo ngày, nên báo cáo cũ
            đọc lại vẫn thấy đúng ai dạy lúc đó. Điểm đã nhập giữ nguyên tên người nhập.
          </SectionNote>

          {data.past.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-slate-400 cursor-pointer">
                Đã từng dạy lớp này ({data.past.length})
              </summary>
              <ul className="list-none p-0 m-0 mt-1.5 space-y-1">
                {data.past.map((h, i) => (
                  <li key={i} className="text-xs text-slate-500">
                    {h.name} · {h.isCore ? 'GVCN' : skillLabel(h.skill ?? '')} ·{' '}
                    {fmtDate(h.from)}{h.to ? ` → ${fmtDate(h.to)}` : ''}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
      {data && slots && slots.length === 0 && (
        <div className="mt-2"><Level tone="warn">Lớp đang không có giáo viên nào</Level></div>
      )}
    </Modal>
  );
}
