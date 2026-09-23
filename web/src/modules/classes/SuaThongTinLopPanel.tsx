import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useToast } from '../../ui/Toast.tsx';

/**
 * ⋮ › SỬA THÔNG TIN LỚP (đặc tả §3.7, g3-120; Q8). Mã lớp · chương trình (chỉ đổi được khi lớp chưa có học viên) · LT (Fast Track) ·
 * ghi chú. Máy chủ kiểm lại mọi luật (`PATCH /classes/:id/thong-tin`) và nói rõ vì sao khi từ chối.
 */
export function SuaThongTinLopPanel({ lop, onClose, onDone }: {
  lop: { id: number; code: string; route: string | null; note: string | null; programmeCode: string | null; soHocVien: number };
  onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const programmes = useApi<{ code: string; name: string }[]>('/ref/programmes');
  const [code, setCode] = useState(lop.code);
  const [chuongTrinh, setChuongTrinh] = useState(lop.programmeCode ?? '');
  const [route, setRoute] = useState(lop.route ?? 'LT1');
  const [note, setNote] = useState(lop.note ?? '');
  const [busy, setBusy] = useState(false);
  const [daBamLuu, setDaBamLuu] = useState(false);
  const doiDuoc = lop.soHocVien === 0;

  const luu = async () => {
    setDaBamLuu(true);
    if (!code.trim()) return;   // báo "Còn thiếu: Mã lớp" ở chân panel, không khoá nút
    setBusy(true);
    try {
      await api.patch(`/classes/${lop.id}/thong-tin`, {
        code: code.trim(),
        note: note.trim() || null,
        ...(chuongTrinh && chuongTrinh !== lop.programmeCode ? { programmeCode: chuongTrinh } : {}),
        ...(chuongTrinh === 'FT' ? { route } : {}),
      });
      invalidate('/classes'); invalidate('/hoc-vien-lop');
      toast.push('ok', 'Đã lưu thông tin lớp');
      onDone(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Sửa thông tin lớp" lop={lop.code} onDong={onClose}
      chan={{
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>Lưu</button>,
        conThieu: daBamLuu && !code.trim() ? ['Mã lớp'] : undefined,
      }}>
      <Khoi tieuDe="Thông tin lớp"
        luat={doiDuoc ? undefined : 'Lớp đã có học viên nên không đổi được chương trình. Lớp thường học tiếp khoá sau thì dùng Chuyển tiếp lớp.'}>
        <Truong nhan="Mã lớp" batBuoc phu="Ví dụ: MB-FT 101">
          <input className="field w-full" value={code} onChange={(e) => setCode(e.target.value)} />
        </Truong>
        {chuongTrinh === 'FT' ? (
          <Hang2>
            <Truong nhan="Chương trình">
              <select className="field w-full" value={chuongTrinh} disabled={!doiDuoc} onChange={(e) => setChuongTrinh(e.target.value)}>
                {(programmes.data ?? []).map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </Truong>
            <Truong nhan="Lộ trình (LT)">
              <select className="field w-full" value={route} onChange={(e) => setRoute(e.target.value)}>
                <option value="LT1">LT1</option>
                <option value="LT2">LT2</option>
              </select>
            </Truong>
          </Hang2>
        ) : (
          <Truong nhan="Chương trình">
            <select className="field w-full" value={chuongTrinh} disabled={!doiDuoc} onChange={(e) => setChuongTrinh(e.target.value)}>
              {(programmes.data ?? []).map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
          </Truong>
        )}
        <Truong nhan="Ghi chú" tuyChon>
          <textarea className="field w-full" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Truong>
      </Khoi>
    </KhungPanel>
  );
}
