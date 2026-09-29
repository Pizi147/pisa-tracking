import { useState, type ReactNode } from 'react';
import { RecordViolationPanel } from './RecordViolationPanel.tsx';
import { XacNhanXuLyPanel } from './XacNhanXuLyPanel.tsx';
import { DaThucHienPanel } from './DaThucHienPanel.tsx';
import { KhaiBacPanel } from './KhaiBacPanel.tsx';
import { XemXuLyPanel } from './XemXuLyPanel.tsx';
import { DeleteViolationConfirm } from './DeleteViolationConfirm.tsx';
import type { ViolationDetail } from './ChiTietViPham.tsx';

export type ViolationChoSua = Pick<ViolationDetail, 'id' | 'studentId' | 'category' | 'skill' | 'occurredOn' | 'description'>;

/** Một state duy nhất cho MỌI panel Ý thức — mở mới thay cũ, không bao giờ chồng hai panel cùng lúc (G-8, YT-13). */
export type PanelYThuc =
  | { loai: 'ghi'; studentId: number; studentName?: string }
  | { loai: 'sua'; v: ViolationChoSua }
  | { loai: 'xu-ly'; studentId: number; cheDo?: 'xu-ly' | 'de-xuat' }
  | { loai: 'khai'; studentId: number; sua?: boolean }
  | { loai: 'da-thuc-hien'; id: number }
  | { loai: 'xem'; id: number }
  | null;

/**
 * MỘT PANEL MỘT LÚC (PR-YT4) — `RecordViolationPanel` (+ Ghi vi phạm / Sửa) · `XacNhanXuLyPanel` (Xác nhận xử lý + Đề xuất QL duyệt) ·
 * `KhaiBacPanel` · `DaThucHienPanel` · `XemXuLyPanel` (chỉ đọc) · `DeleteViolationConfirm`.
 */
export function usePanelYThuc({ onDone, roster, maLop }: {
  onDone: () => void;
  /** Mã lớp hiện ở đầu các ngăn (`Ghi vi phạm · Tên HV · MB FOU 12`). */
  maLop?: string | null;
  /** Mở `+ Ghi vi phạm` từ trang lớp: cho chọn học viên ngay trong form (không chọn sẵn). */
  roster?: { id: number; name: string; code?: string | null }[];
}): { mo: (p: PanelYThuc) => void; panel: PanelYThuc; panels: ReactNode } {
  const [panel, setPanel] = useState<PanelYThuc>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const mo = (p: PanelYThuc) => setPanel(p);
  const dong = () => setPanel(null);
  const xong = () => { dong(); onDone(); };

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
        open={panel?.loai === 'sua'} onClose={dong}
        studentId={panel?.loai === 'sua' ? panel.v.studentId : 0}
        violation={panel?.loai === 'sua' ? panel.v : null} lop={maLop}
        onDone={onDone}
        onDelete={(id) => { dong(); setDeleteId(id); }}
      />
      {panel?.loai === 'xu-ly' && (
        <XacNhanXuLyPanel studentId={panel.studentId} cheDo={panel.cheDo} onClose={dong} onDone={onDone}
          onKhai={(sid) => mo({ loai: 'khai', studentId: sid })} />
      )}
      {panel?.loai === 'khai' && <KhaiBacPanel studentId={panel.studentId} sua={panel.sua} onClose={dong} onDone={onDone} />}
      {panel?.loai === 'da-thuc-hien' && <DaThucHienPanel measureId={panel.id} onClose={dong} onDone={onDone} />}
      <XemXuLyPanel measureId={panel?.loai === 'xem' ? panel.id : null} onClose={dong} onDaThucHien={(id) => mo({ loai: 'da-thuc-hien', id })} />
      <DeleteViolationConfirm violationId={deleteId} onClose={() => setDeleteId(null)} onDone={onDone} />
    </>
  );

  return { mo, panel, panels };
}
