import { useEffect, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Empty, Skeleton } from '../../ui/ui.tsx';
import { skillLabel } from '../../lib/format.ts';
import { ngay } from '@shared/domain/index.ts';

/**
 * SỬA PHÂN CÔNG GIÁO VIÊN CỦA LỚP (PR-UX3, N-4, mockup 15 §8) — MỘT panel `KhungPanel`.
 *
 * Một lớp có thể có HAI người cùng dạy một kỹ năng (hai lớp trong dữ liệu thật đang như vậy), nên mỗi kỹ năng là một danh sách chứ không
 * phải một ô chọn. Ô chọn một-người sẽ âm thầm đá mất người thứ hai — đúng kiểu lỗi chỉ lộ ra khi ai đó không nhập được điểm.
 *
 * Gửi lên NGUYÊN bức tranh đang hiển thị, không gửi từng thao tác thêm/bớt: hai người sửa cùng lúc thì kết quả vẫn là một trong hai bức
 * tranh, không phải một trạng thái pha trộn mà không ai định. Chân `Huỷ | Lưu`.
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

export function TeacherAssignPanel({ open, onClose, classId, classCode, onDone }: {
  open: boolean; onClose: () => void; classId: number; classCode: string; onDone: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data, loading, error } = useApi<Teachers>(open ? `/classes/${classId}/teachers` : null, [open]);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [moDaDay, setMoDaDay] = useState(false);

  // Nạp bức tranh hiện tại một lần khi mở; sửa xong mới gửi lên.
  useEffect(() => {
    if (!data) { setSlots(null); return; }
    setSlots([
      ...data.core.map((c) => ({ userId: c.userId, skill: null, isCore: true })),
      ...data.bySkill.map((c) => ({ userId: c.userId, skill: c.skill, isCore: false })),
    ]);
  }, [data]);

  if (!open) return null;

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

  /* Một môn: nhãn TRÊN, dưới là các chip tên (×) và ô "+ Thêm giáo viên". */
  const oMon = (skill: string | null, label: string) => (
    <Truong key={label} nhan={label} as="div">
      <div className="flex flex-wrap items-center gap-1.5">
        {inSlot(skill).length === 0 && <span className="text-xs text-slate-500">Chưa phân công</span>}
        {inSlot(skill).map((s) => (
          <span key={s.userId} className="inline-flex items-center gap-1">
            <Nhan tone="muted">{nameOf(s.userId)}</Nhan>
            <button type="button" className="px-1 text-xs leading-none text-slate-500 hover:text-bad"
              title="Bỏ phân công" aria-label={`Bỏ ${nameOf(s.userId)}`} onClick={() => remove(s.userId, skill)}>×</button>
          </span>
        ))}
        {data?.viewer.canAssign && (
          <select className="field w-auto py-1 text-xs" value="" aria-label={`Thêm giáo viên ${label}`}
            onChange={(e) => { add(Number(e.target.value), skill); e.currentTarget.value = ''; }}>
            <option value="">+ Thêm giáo viên</option>
            {(data?.candidates ?? [])
              .filter((c) => !inSlot(skill).some((s) => s.userId === c.id))
              .map((c) => <option key={c.id} value={c.id}>{c.name}{c.classCount ? ` · ${c.classCount} lớp` : ''}</option>)}
          </select>
        )}
      </div>
    </Truong>
  );

  const luu = async () => {
    setBusy(true);
    try {
      await api.put(`/classes/${classId}/teachers`, { slots });
      invalidate('/classes'); invalidate('/my-work');
      toast.push('ok', 'Đã lưu phân công');
      onDone(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Sửa phân công" lop={classCode} onDong={onClose}
      ngCanh={data && !data.viewer.canAssign ? <span className="text-slate-400">Chỉ xem: đổi phân công là việc của Quản lý và Admin chi nhánh.</span> : undefined}
      chan={{
        chinh: data?.viewer.canAssign
          ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !slots} onClick={luu}>Lưu</button>
          : undefined,
      }}>
      {loading && <div className="pt-3"><Skeleton rows={5} /></div>}
      {error && <div className="pt-3"><Empty title="Không đọc được phân công" hint={error.message} /></div>}
      {data && slots && (
        <>
          <Khoi tieuDe="GVCN">
            {oMon(null, 'GVCN')}
          </Khoi>
          <Khoi tieuDe="Giáo viên bộ môn"
            luat="Chỉ nhập được điểm môn mình được phân công. Bỏ phân công KHÔNG xoá lịch sử: dòng cũ được đóng lại theo ngày, nên báo cáo cũ đọc lại vẫn thấy đúng ai dạy lúc đó; điểm đã nhập giữ nguyên tên người nhập.">
            {data.skills.map((sk) => oMon(sk, skillLabel(sk)))}
          </Khoi>
          {slots.length === 0 && (
            <p className="mt-3.5"><Nhan tone="soon">Lớp đang không có giáo viên nào</Nhan></p>
          )}
          {data.past.length > 0 && (
            <div className="mt-3.5">
              <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-xs" aria-expanded={moDaDay}
                onClick={() => setMoDaDay((v) => !v)}>
                {moDaDay ? '▾' : '▸'} Đã từng dạy lớp này ({data.past.length})
              </button>
              {moDaDay && (
                <ul className="m-0 mt-1.5 list-none space-y-1 p-0">
                  {data.past.map((h, i) => (
                    <li key={i} className="text-xs text-slate-500">
                      {h.name} · {h.isCore ? 'GVCN' : skillLabel(h.skill ?? '')} · {ngay(h.from, homNay)}{h.to ? ` → ${ngay(h.to, homNay)}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </KhungPanel>
  );
}
