import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';

/** `GET /classes/:id/xoa-ket-thuc` — Quản lý của lớp hoặc Quản trị (OV-12a: cả hai xoá được lớp trống, `coTheXoa`). */
export type TinhTrangXoaKetThuc = {
  id: number; ma: string; chiNhanh: string; daKetThuc: boolean; soDangHoc: number; soTungGhiDanh: number;
  coDuLieu: boolean; dangGan: string[]; coTheXoa: boolean; coTheKetThuc: boolean; lyDoChanKetThuc: string | null;
  /** PR-LT2b (K2-35): việc còn treo, KHÔNG chặn — `Còn treo: 2 Mini Test chưa ghi`. */
  conTreo?: string | null;
};

/**
 * ⋮ HỒ SƠ LỚP › XOÁ LỚP (PR-UX3; OV-12a: Quản lý của lớp hoặc Quản trị; máy chủ kiểm quyền và kiểm lớp còn trống). Panel nêu mã lớp + chi nhánh +
 * "Không hoàn tác được"; chỉ khi GÕ LẠI ĐÚNG MÃ LỚP thì nút đỏ "Xoá lớp" mới bật.
 */
export function XoaLopPanel({ classId, classCode, onClose }: { classId: number; classCode: string; onClose: () => void }) {
  const toast = useToast();
  const navigate = useNavigate();
  const tt = useApi<TinhTrangXoaKetThuc>(`/classes/${classId}/xoa-ket-thuc`, [classId]);
  const [go, setGo] = useState('');
  const [busy, setBusy] = useState(false);
  const khop = go.trim() === classCode;
  const chan = tt.data && !tt.data.coTheXoa;

  const xoa = async () => {
    setBusy(true);
    try {
      await api.post(`/classes/${classId}/xoa`, { maLop: go.trim() });
      invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/tong-quan');
      toast.push('ok', `Đã xoá lớp ${classCode}`);
      onClose();
      navigate('/hoc-vien', { replace: true });
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Xoá lớp" lop={classCode} onDong={onClose}
      chan={{
        chinh: <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy || !khop || !!chan} onClick={xoa}>Xoá lớp</button>,
      }}>
      {tt.error ? <div className="pt-3"><ErrorState message={tt.error.message} hint={tt.error.hint} onRetry={tt.reload} /></div>
        : !tt.data ? <div className="pt-3"><Skeleton rows={3} /></div> : (
          <Khoi tieuDe="Xác nhận xoá">
            <p className="m-0 text-sm text-slate-200">
              Lớp <strong>{tt.data.ma}</strong> · {tt.data.chiNhanh} sẽ bị xoá hẳn cùng phân công giáo viên và kỹ năng lớp.
              <span className="text-soon"> Không hoàn tác được.</span>
            </p>
            {chan ? (
              <p className="m-0 text-xs text-late">Lớp đã có dữ liệu ({tt.data.dangGan.join(', ') || `${tt.data.soTungGhiDanh} học viên từng ghi danh`}). Dùng Kết thúc lớp.</p>
            ) : (
              <Truong nhan="Gõ lại mã lớp để xác nhận" batBuoc phu={`Mã lớp: ${tt.data.ma}`}>
                <input className="field w-full" value={go} onChange={(e) => setGo(e.target.value)} autoComplete="off" />
              </Truong>
            )}
          </Khoi>
        )}
    </KhungPanel>
  );
}

/**
 * ⋮ HỒ SƠ LỚP › KẾT THÚC LỚP (PR-UX3, chỉ Quản trị hệ thống) — cho lớp đã có dữ liệu. Còn học viên đang học thì CHẶN và chỉ dẫn; không còn
 * ai thì lớp thành "Đã kết thúc" và vào khu Lưu trữ (chỉ xem).
 */
export function KetThucLopPanel({ classId, classCode, onClose, onDone }: { classId: number; classCode: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const tt = useApi<TinhTrangXoaKetThuc>(`/classes/${classId}/xoa-ket-thuc`, [classId]);
  const [busy, setBusy] = useState(false);
  const chan = tt.data?.lyDoChanKetThuc ?? null;

  const ketThuc = async () => {
    setBusy(true);
    try {
      await api.post(`/classes/${classId}/ket-thuc`, {});
      invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/tong-quan');
      toast.push('ok', `Đã kết thúc lớp ${classCode}`);
      onDone(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Kết thúc lớp" lop={classCode} onDong={onClose}
      chan={{
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !tt.data || !!chan} onClick={ketThuc}>Kết thúc lớp</button>,
      }}>
      {tt.error ? <div className="pt-3"><ErrorState message={tt.error.message} hint={tt.error.hint} onRetry={tt.reload} /></div>
        : !tt.data ? <div className="pt-3"><Skeleton rows={3} /></div> : (
          <Khoi tieuDe="Xác nhận kết thúc">
            <p className="m-0 text-sm text-slate-200">
              Lớp <strong>{tt.data.ma}</strong> · {tt.data.chiNhanh} sẽ chuyển sang <strong>Đã kết thúc</strong> và vào khu Lưu trữ. Hồ sơ chỉ còn xem; dữ liệu giữ nguyên.
            </p>
            {chan && <p className="m-0 text-xs text-late">{chan}</p>}
            {tt.data.conTreo && <p className="m-0 mt-1 text-xs text-slate-400">{tt.data.conTreo} — không chặn kết thúc lớp.</p>}
          </Khoi>
        )}
    </KhungPanel>
  );
}

/**
 * ⋮ HỒ SƠ LỚP ĐÃ KẾT THÚC › MỞ LẠI LỚP / LƯU TRỮ › MỞ LẠI (PR-LUI-b, 06/10) — Quản lý của lớp hoặc Quản trị. Lý do tuỳ chọn. Hoàn tác = Kết thúc lớp lại
 * (Quản lý của lớp cũng kết thúc được lớp không còn học viên đang học).
 */
export function MoLaiLopPanel({ classId, classCode, chiNhanh, ketThuc, onClose, onDone }: {
  classId: number; classCode: string; chiNhanh?: string | null; ketThuc?: string | null; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const lamMoi = () => { invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/tong-quan'); };
  const moLai = async () => {
    setBusy(true);
    try {
      await api.post(`/classes/${classId}/mo-lai`, { lyDo: lyDo.trim() || undefined });
      lamMoi();
      toast.hoanTac(`Đã mở lại lớp ${classCode}`, async () => {
        try {
          await api.post(`/classes/${classId}/ket-thuc`, {});
          lamMoi(); toast.push('ok', 'Đã hoàn tác'); onDone();
        } catch (e: any) { toast.push('error', e.message); }
      }, { key: `mo-lai-lop:${classId}` });
      onDone(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  return (
    <KhungPanel tieuDe="Mở lại lớp" lop={classCode} onDong={onClose}
      chan={{ daSua: !!lyDo.trim(), chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={moLai}>Mở lại lớp</button> }}>
      <Khoi tieuDe="Mở lại lớp">
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-slate-400">Lớp</dt><dd className="m-0 font-semibold text-slate-100">{classCode}</dd>
          {chiNhanh && (<><dt className="text-slate-400">Chi nhánh</dt><dd className="m-0 text-slate-200">{chiNhanh}</dd></>)}
          {ketThuc && (<><dt className="text-slate-400">Kết thúc</dt><dd className="m-0 text-slate-200">{ketThuc}</dd></>)}
        </dl>
        <Truong nhan="Lý do" tuyChon>
          <input className="field w-full" maxLength={2000} value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
        </Truong>
      </Khoi>
    </KhungPanel>
  );
}
