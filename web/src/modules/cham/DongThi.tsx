import { createContext, useContext } from 'react';
import { dongThiHocVien } from '@shared/domain/index.ts';
import { skillShort } from '../../lib/format.ts';

/** Chỉ Test › Điểm theo lớp bật (`DiemTheoLop`): dưới mã học viên thêm dòng tuần thi. Nhập điểm / Lịch Test không có dòng này. */
export const DongThiContext = createContext(false);

/** "W1 OCT" (lệch kỹ năng: "W1 OCT · S W2 OCT"; chưa có: "Chưa xếp tuần") — chữ nhỏ xám, không tô đậm / màu. */
export function DongThi({ muc }: { muc: { nhan: string; weekStart: string | null }[] }) {
  if (!useContext(DongThiContext)) return null;
  return <div className="text-xs text-slate-500 tabular-nums">{dongThiHocVien(muc)}</div>;
}

/** Nhãn kỹ năng của lớp Fast Track trong dòng thi: Writing 1/2 gộp "W", còn lại chữ ngắn (như `LuoiFT`). */
export const nhanKyNangFt = (skill: string) => (skill.startsWith('writing') ? 'W' : skillShort(skill));
