import type { ReactNode } from 'react';
import { LOAI_HAN_CUA_VIEC } from '@shared/domain/index.ts';
import { ChipHan } from '../../ui/Nhan.tsx';
import { dauViec } from '../../ui/KhuonViec.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';

/**
 * R4 (rà 24/11, mục 4): đầu panel việc dựng từ DÒNG VIỆC (không request thêm) — hạn ("quá hạn n ngày" khi trễ, NH4) · tên em (link hồ sơ) · lớp ·
 * lý do phát sinh (`ngCanh`). Panel con dùng ngay từ lúc tải / lỗi (đầu không trống), khi có dữ liệu riêng thì ghép thêm vào `dong2`.
 */
export type DauPanel = ReturnType<typeof dauViec>;
export function dauTuViec(it: Pick<WorkItem, 'group' | 'due' | 'studentId' | 'studentName' | 'classCode'>, ngCanh?: ReactNode): DauPanel {
  return dauViec({
    han: it.due ? <ChipHan loai={LOAI_HAN_CUA_VIEC[it.group] ?? 'viec-van-hanh'} han={it.due} /> : null,
    em: it.studentId !== null ? { id: it.studentId, ten: it.studentName } : null,
    lop: it.classCode, ngCanh,
  });
}
