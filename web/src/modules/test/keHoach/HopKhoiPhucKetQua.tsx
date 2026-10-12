import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, invalidate } from '../../../lib/api.ts';
import { useApi } from '../../../lib/useApi.ts';
import { fmtDate } from '../../../lib/format.ts';
import { ConfirmDialog, Modal } from '../../../ui/Drawer.tsx';
import { Truong } from '../../../ui/KhungPanel.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../../ui/ngayNghiepVu.ts';
import { duongDotTest, tuanLich, type KetQuaHuy } from '@shared/domain/index.ts';

/**
 * HỘP "KHÔI PHỤC KẾT QUẢ" (PR-MTb Task 8, T2): Quản lý trả lại điểm của MT đã huỷ do dời vượt. Dùng chung hồ sơ Mock (menu đầu
 * trang) và ⋯ hàng Lộ trình. Lý do TUỲ CHỌN. Máy chủ chặn khi ô đã có điểm mới / lượt vượt vẫn đứng sau (R1 Q2): câu lỗi hiện
 * trong hộp, hộp mở, chữ đã gõ còn nguyên (state của hộp, không remount).
 */
export function HopKhoiPhucKetQua({ attemptId, nhan, ketQua, onDong, onXong }: {
  attemptId: number; nhan: string; ketQua: KetQuaHuy; onDong: () => void; onXong: () => void;
}) {
  const toast = useToast();
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const [loiMay, setLoiMay] = useState<string | null>(null);
  const lam = async () => {
    if (busy) return;
    setBusy(true); setLoiMay(null);
    try {
      await api.post(`/attempts/${attemptId}/khoi-phuc-ket-qua`, { lyDo: lyDo.trim() || null });
      for (const k of ['/attempts', '/tong-quan', '/classes', '/students', '/ke-hoach-test', '/cycles', '/my-work']) invalidate(k);
      toast.push('ok', `Đã khôi phục kết quả ${nhan}`);
      onXong(); onDong();
    } catch (e: any) { setLoiMay(e.message); } finally { setBusy(false); }
  };
  return (
    <ConfirmDialog open z="z-[80]" busy={busy} closeLabel="Đóng" confirmLabel="Khôi phục" title={`Khôi phục kết quả ${nhan}?`}
      onClose={onDong} onConfirm={() => void lam()}
      body={(
        <div className="space-y-3">
          <p className="m-0">{nhan}: {ketQua.soDiem} điểm đã huỷ{ketQua.vuotBoi ? ` khi dời ${ketQua.vuotBoi}` : ''}.</p>
          <Truong nhan="Lý do" tuyChon>
            <textarea className="field w-full" rows={2} maxLength={300} value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
          </Truong>
          {loiMay && <p className="m-0 text-xs font-semibold text-bad" role="alert">{loiMay}</p>}
        </div>
      )} />
  );
}

type BanHuy = { id: number; luc: string; nguoi: string | null; lyDo: string; soDiem: number; tuan: string | null; soCase: number; soPa: number; soPhoiHop: number };
type ChiTietLuot = {
  status: string; student: { name: string }; classCode: string | null;
  huy: { lyDo: string | null; ai: string | null; khi: string } | null;
  khoiPhuc: { ban: BanHuy[]; chan: string | null };
  viewer: { canCancel: boolean };
};

/**
 * HỘP "MT{n} · ĐÃ HUỶ" (PR-OV4a, mockup §5): Quản lý / Quản trị Khôi phục lượt — lịch, điểm, Case, PA trở lại. Nhiều bản huỷ → chọn bản. Số MT đã
 * được xếp lại → câu chặn + link mở MT mới (máy chủ cũng chặn). Không có quyền (Admin, GV) → chỉ xem, một dòng "Chỉ Quản lý khôi phục được…".
 * `onXepMoi` (ô Kế hoạch Test, số MT tới lượt): nút phụ "Xếp MT{n} mới". Dùng ở Kế hoạch Test, Hồ sơ MT, hàng Lộ trình.
 */
export function HopKhoiPhucMt({ attemptId, attemptNo, onDong, onXong, onXepMoi, z = 'z-[80]' }: {
  attemptId: number; attemptNo: number; onDong: () => void; onXong: () => void; onXepMoi?: () => void; z?: string;
}) {
  const toast = useToast();
  const homNay = useNgayNghiepVu().homNay;
  const { pathname } = useLocation();
  const doc = useApi<ChiTietLuot>(`/attempts/${attemptId}`);
  const [chon, setChon] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [loiMay, setLoiMay] = useState<string | null>(null);
  const mt = `MT${attemptNo}`;
  const d = doc.data;
  const ban = d?.khoiPhuc.ban ?? [];
  const b = ban.find((x) => x.id === chon) ?? ban[0] ?? null;
  const daHuy = d?.status === 'cancelled';
  const duocLam = !!d?.viewer.canCancel && daHuy;
  const ai = b ? [b.luc, b.nguoi] : [d?.huy?.khi ?? null, d?.huy?.ai ?? null];
  const phu = d ? [d.student.name, d.classCode, ai[0] ? `huỷ ${fmtDate(ai[0])}${ai[1] ? ` bởi ${ai[1]}` : ''}` : null].filter(Boolean).join(' · ') : '';
  const traLai = b ? [b.tuan && homNay ? `lịch ${tuanLich(b.tuan, homNay)}` : 'lịch', b.soDiem ? `${b.soDiem} điểm` : null,
    b.soCase ? `${b.soCase} Case` : null, b.soPa ? `${b.soPa} PA` : null, b.soPhoiHop ? `${b.soPhoiHop} việc Phối hợp` : null].filter(Boolean).join(', ') : null;
  const moi = duongDotTest({ id: attemptId, kind: 'mock' });
  const lam = async () => {
    if (busy) return;
    setBusy(true); setLoiMay(null);
    try {
      const r = await api.post<{ cau: string[] }>(`/attempts/${attemptId}/reopen`, { banId: b?.id ?? null });
      for (const k of ['/attempts', '/tong-quan', '/classes', '/students', '/ke-hoach-test', '/cycles', '/my-work']) invalidate(k);
      toast.push('ok', [`Đã khôi phục ${mt}`, ...(r.cau ?? [])].join(' '));
      onXong(); onDong();
    } catch (e: any) { setLoiMay(e.message); } finally { setBusy(false); }
  };
  return (
    <Modal open z={z} width="max-w-md" onClose={onDong} title={<>{daHuy || !d ? `${mt} · Đã huỷ` : `${mt} cũ · Đã huỷ`}{phu && <span className="mt-0.5 block break-words text-xs font-normal text-slate-400">{phu}</span>}</>}
      footer={(
        /* 375: link + 3 nút xuống dòng trong khung, không tràn ngang (footer của Modal không tự xuống dòng). */
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          {d?.khoiPhuc.chan && moi !== pathname && <Link className="link mr-auto text-xs" to={moi} onClick={onDong}>Mở {mt} mới ↗</Link>}
          <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong} disabled={busy}>Đóng</button>
          {duocLam && onXepMoi && <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onXepMoi} disabled={busy}>Xếp {mt} mới</button>}
          {duocLam && (
            <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => void lam()} disabled={busy}>
              {busy ? 'Đang khôi phục…' : `Khôi phục ${mt}`}
            </button>
          )}
        </div>
      )}>
      <div className="space-y-3 text-sm leading-relaxed text-slate-300">
        {!d ? <p className="m-0 text-slate-400">{doc.error ? doc.error.message : 'Đang đọc lượt…'}</p>
          : d.khoiPhuc.chan ? (
            <p className="m-0 rounded-lg border border-bad-line bg-bad-bg px-3 py-2" role="alert">
              {d.khoiPhuc.chan}
            </p>
          ) : !d.viewer.canCancel ? <p className="m-0 text-slate-400">Chỉ Quản lý khôi phục được lượt đã huỷ.</p>
          : !daHuy ? <p className="m-0 text-slate-400">{mt} không ở trạng thái huỷ.</p>
          : (
            <>
              {ban.length > 1 && (
                <fieldset className="m-0 space-y-1 border-0 p-0">
                  <legend className="mb-1 text-xs font-semibold text-slate-400">Chọn bản huỷ để khôi phục</legend>
                  {ban.map((x) => (
                    <label key={x.id} className="flex min-h-[44px] items-start gap-2 sm:min-h-0">
                      <input type="radio" name={`ban-${attemptId}`} className="mt-1" checked={x.id === b?.id} onChange={() => setChon(x.id)} />
                      <span>huỷ {fmtDate(x.luc)}{x.nguoi ? ` bởi ${x.nguoi}` : ''} · {x.soDiem} điểm<span className="block text-xs text-slate-500">{x.lyDo}</span></span>
                    </label>
                  ))}
                </fieldset>
              )}
              <ul className="m-0 pl-5" style={{ listStyle: 'disc' }}>
                <li>{traLai ? <>Khôi phục: <span className="tabular-nums">{traLai}</span> trở lại.</> : 'Lượt huỷ trước 10/2026: không còn điểm để khôi phục — lượt trở lại, chưa có điểm.'}</li>
              </ul>
            </>
          )}
        {loiMay && <p className="m-0 text-xs font-semibold text-bad" role="alert">{loiMay}</p>}
      </div>
    </Modal>
  );
}
