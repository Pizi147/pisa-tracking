import { useState } from 'react';
import { thaoTacKyNang, trangThaiTT, tuanDaQua } from '@shared/domain/index.ts';
import { skillLabel } from '../../lib/format.ts';
import { useToast } from '../../ui/Toast.tsx';
import { useTrongKhung } from '../../ui/KhungPanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { HopThaoTacMt } from '../fasttrack/HopThaoTacMt.tsx';
import type { HopProps } from '../fasttrack/HopNhapDiem.tsx';
import { coDiemChinhThuc, type Cell } from '../fasttrack/ScoreEntry.tsx';
import { guiHuyDiem } from './huyDiem.ts';
import type { FtSheet } from './LuoiFT.tsx';

/**
 * ⋯ ĐẦU HỘP CHẤM FT (chủ SP 26/11): "Dời lịch" · "Huỷ điểm" của MỘT ô — cùng nguồn `thaoTacKyNang` + cờ quyền máy chủ (`data.quyen`) với hồ sơ Mock, cùng hộp
 * `HopThaoTacMt` và `guiHuyDiem` (Hoàn tác 10 giây). `cua(dòng, ô)` = cờ cho hộp đang mở; `hopTt` = hộp Dời lịch (vẽ một lần ở gốc lưới, hộp chấm đã đóng).
 */
export function useThaoTacO(data: FtSheet, onReload: () => void) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const trongKhung = useTrongKhung();
  const [mo, setMo] = useState<{ aid: number; ten: string; c: Cell } | null>(null);
  const q = data.quyen;

  const cua = (row: FtSheet['rows'][number], c: Cell): HopProps['thaoTac'] => {
    if (!homNay) return undefined;
    const tt = trangThaiTT({ batBuoc: c.required, tuanBatDau: c.weekStart ?? null, coDiem: coDiemChinhThuc(c), sit: c.sitStatus ?? null, choDuyet: false, lichSu: !!row.lichSu, homNay });
    const tat = thaoTacKyNang(tt, { nhapDiem: c.canEdit, quanLy: !!q?.canPlan, gvcn: !!q?.laGvcn, laFt: true, dotHoanTat: !!c.khoa, quaTuan: tuanDaQua(c.weekStart, homNay),
      diemHuy: !!c.diemHuy, diem: q?.diem ?? true });
    const ds = [tat.chinh, ...tat.menu];   // ô vắng: "Dời lịch" là nút chính của bảng thao tác
    return {
      doiLich: ds.includes('doi-lich') ? () => setMo({ aid: row.attemptId, ten: row.studentName, c }) : undefined,
      huyDiem: ds.includes('huy-diem')
        ? () => void guiHuyDiem(toast, { attemptId: row.attemptId, skill: c.skill, mon: skillLabel(c.assessedSkill), tenHv: row.studentName, huy: true, onDone: onReload }) : undefined,
    };
  };

  const hopTt = mo && (
    <HopThaoTacMt thaoTac="doi-lich" attemptId={mo.aid} skill={mo.c.assessedSkill} ct={null} laThuong={false} quanLy={!!q?.canPlan} gvcn={!!q?.laGvcn} trongHop={trongKhung}
      row={{ periodId: mo.c.periodId ?? null, weekStart: mo.c.weekStart ?? null, deadline: mo.c.deadline }} hocVien={mo.ten} lop={data.classCode}
      onClose={() => setMo(null)} onDone={onReload} />
  );
  return { cua, hopTt };
}
