import { useState, type ReactNode } from 'react';
import { RecordViolationPanel } from './RecordViolationPanel.tsx';
import { CreateMeasurePanel } from './CreateMeasurePanel.tsx';
import { PhuongAnPanel } from './PhuongAnPanel.tsx';
import { ConfirmMeasurePanel } from './ConfirmMeasurePanel.tsx';
import { XemPhuongAnPanel } from './XemPhuongAnPanel.tsx';
import { DeleteViolationConfirm } from './DeleteViolationConfirm.tsx';
import type { ViolationDetail } from './ChiTietViPham.tsx';

export type ViolationChoSua = Pick<ViolationDetail, 'id' | 'studentId' | 'category' | 'skill' | 'occurredOn' | 'description'>;

/** Một state duy nhất cho MỌI panel Ý thức — mở mới thay cũ, không bao giờ chồng hai panel cùng lúc (G-8, YT-13). */
export type PanelYThuc =
  | { loai: 'ghi'; studentId: number; studentName?: string }
  | { loai: 'sua'; v: ViolationChoSua; quayVe?: number }
  | { loai: 'tao-pa'; studentId: number; studentName: string; violations: { id: number; occurredOn: string; categoryLabel: string; description: string }[] }
  | { loai: 'pa'; id: number }
  | { loai: 'xac-nhan'; id: number }
  | { loai: 'xem-pa'; id: number }
  | null;

/**
 * MỘT PANEL MỘT LÚC (Q3, Q6, YT-13) — gom `RecordViolationPanel` (ghi/sửa) · `CreateMeasurePanel` (tạo PA) ·
 * `PhuongAnPanel` (sửa PA đang chuẩn bị, Task 5) · `ConfirmMeasurePanel` (xác nhận) · `XemPhuongAnPanel` (chỉ đọc) ·
 * `DeleteViolationConfirm` (xoá vi phạm từ trong form Sửa) — chép cách `thaoTacDongHocVien.tsx:28-59`.
 *
 * `sua` đóng (lưu HAY huỷ đều gọi `onClose`) mà có `quayVe` → mở lại đúng PA đó (không mất chỗ đang xem).
 */
export function usePanelYThuc({ canManage, onDone, roster, maLop }: {
  canManage: boolean;
  onDone: () => void;
  /** Mã lớp hiện ở đầu các ngăn (`Ghi nhận vi phạm · Tên HV · MB-FOU 12`). */
  maLop?: string | null;
  /** Mở `+ Ghi nhận vi phạm` từ trang lớp: cho chọn học viên ngay trong form. */
  roster?: { id: number; name: string; code?: string | null }[];
}): { mo: (p: PanelYThuc) => void; moPhuongAn: (m: { id: number; status: string }) => void; panels: ReactNode } {
  const [panel, setPanel] = useState<PanelYThuc>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  /** Đang xoá vi phạm từ TRONG form Sửa (mở từ một PA) — nhớ PA để quay lại SAU KHI hộp xác nhận xoá đóng, không mở chồng lên nó. */
  const [pendingQuayVe, setPendingQuayVe] = useState<number | undefined>(undefined);

  const mo = (p: PanelYThuc) => setPanel(p);
  const dong = () => setPanel(null);
  const xong = () => { dong(); onDone(); };

  /** Q9: GVBM (không quản lý được) chỉ Xem; PA đã thực hiện cũng chỉ Xem — chỉ GVCN/Quản lý mở PA đang chuẩn bị để sửa. */
  const moPhuongAn = (m: { id: number; status: string }) => {
    mo(m.status === 'preparing' && canManage ? { loai: 'pa', id: m.id } : { loai: 'xem-pa', id: m.id });
  };

  const suaDong = () => {
    const quayVe = panel?.loai === 'sua' ? panel.quayVe : undefined;
    dong();
    if (quayVe) mo({ loai: 'pa', id: quayVe });
  };

  /* YT-13: "Xoá vi phạm" trong form Sửa (mở từ PA) — đóng form Sửa NGAY, KHÔNG mở lại PA cho tới khi hộp xác nhận xoá đóng (tránh hai panel chồng nhau). */
  const suaXoa = (id: number) => {
    setPendingQuayVe(panel?.loai === 'sua' ? panel.quayVe : undefined);
    dong();
    setDeleteId(id);
  };
  const deleteDong = () => {
    setDeleteId(null);
    if (pendingQuayVe) { mo({ loai: 'pa', id: pendingQuayVe }); setPendingQuayVe(undefined); }
  };

  const panels = (
    <>
      <RecordViolationPanel
        open={panel?.loai === 'ghi'} onClose={dong}
        studentId={panel?.loai === 'ghi' ? panel.studentId : 0}
        studentName={panel?.loai === 'ghi' ? panel.studentName : undefined}
        lop={maLop}
        students={panel?.loai === 'ghi' ? roster : undefined}
        onPickStudent={(id) => mo({ loai: 'ghi', studentId: id, studentName: roster?.find((r) => r.id === id)?.name })}
        onDone={xong}
      />
      <RecordViolationPanel
        open={panel?.loai === 'sua'} onClose={suaDong}
        studentId={panel?.loai === 'sua' ? panel.v.studentId : 0}
        violation={panel?.loai === 'sua' ? panel.v : null} lop={maLop}
        onDone={onDone}
        onDelete={suaXoa}
      />
      <CreateMeasurePanel
        open={panel?.loai === 'tao-pa'} onClose={dong}
        studentId={panel?.loai === 'tao-pa' ? panel.studentId : 0}
        studentName={panel?.loai === 'tao-pa' ? panel.studentName : ''} lop={maLop}
        violations={panel?.loai === 'tao-pa' ? panel.violations : []}
        onDone={xong}
        onConfirmNow={(id) => mo({ loai: 'xac-nhan', id })}
      />
      {panel?.loai === 'pa' && (
        <PhuongAnPanel measureId={panel.id} onClose={dong} onDone={xong}
          onXacNhan={(id) => mo({ loai: 'xac-nhan', id })}
          onSuaViPham={(v, mid) => mo({ loai: 'sua', v, quayVe: mid })}
          onMoPhuongAnKhac={moPhuongAn} />
      )}
      <ConfirmMeasurePanel open={panel?.loai === 'xac-nhan'} onClose={dong}
        measureId={panel?.loai === 'xac-nhan' ? panel.id : null} onDone={xong} />
      <XemPhuongAnPanel measureId={panel?.loai === 'xem-pa' ? panel.id : null} onClose={dong} />
      <DeleteViolationConfirm violationId={deleteId} onClose={deleteDong} onDone={onDone} />
    </>
  );

  return { mo, moPhuongAn, panels };
}
