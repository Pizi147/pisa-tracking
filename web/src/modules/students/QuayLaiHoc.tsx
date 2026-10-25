import { useEffect, useState, type ReactNode } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { Modal } from '../../ui/Drawer.tsx';
import { Truong } from '../../ui/KhungPanel.tsx';
import { ChonLop } from '../../ui/ChonLop.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { t } from '@shared/i18n/index.ts';
import { HocLaiPanel } from './StudentManagePanel.tsx';
import { PanelBuocTiep } from './PanelBuocTiep.tsx';
import { KhoiKhiLuu } from './HopTamDungKetThuc.tsx';

type LopDich = { id: number; code: string; ft: boolean; route: string | null; tenChuongTrinh: string | null; branchCode: string; siSo?: number };
type ThongTin = {
  huong: 'lop-cu' | 'chon-lop' | 'lo-trinh-moi' | 'hoc-lai'; lopCu: { id: number; code: string; daKetThuc: boolean } | null;
  cycleId: number | null; lop: LopDich[]; goiYId: number | null;
};
type Em = { id: number; ten: string; lop?: string | null };

const LAM_MOI = ['/students', '/classes', '/hoc-vien-lop', '/cases', '/my-work', '/tong-quan', '/cycles'];
const lamMoi = () => LAM_MOI.forEach((k) => invalidate(k));
const phuLop = (l: LopDich) => [l.ft ? `FT ${l.route ?? ''}`.trim() : l.tenChuongTrinh, l.branchCode, l.siSo != null ? t('{n} em', { n: l.siSo }) : null].filter(Boolean).join(' · ');

/**
 * QUAY LẠI HỌC (P7 SV-LO-TRINH, N11, N22 ⑤ — mockup V6 `trang-thai-hv.html` k5, k6): MỘT nút cho em tạm dừng và em đã kết thúc, ở trang Lưu trữ và đầu hồ sơ lưu trữ.
 * Máy chủ chọn hướng (`GET /students/:id/quay-lai`): lớp cũ còn chạy → một bấm + Hoàn tác 10 s · lớp cũ đã kết thúc → hộp chọn lớp (gợi ý sẵn lớp cùng chương
 * trình, cùng chi nhánh; đổi được) · lộ trình đã đóng / em kết thúc có KQ thi thật → panel Lộ trình mới · em kết thúc giữa khoá → panel Học lại sẵn có.
 */
export function useQuayLaiHoc(onDone: () => void): { mo: (em: Em) => Promise<void>; dangMo: number | null; panels: ReactNode } {
  const toast = useToast();
  const [dangMo, setDangMo] = useState<number | null>(null);
  const [mo, setMo] = useState<{ em: Em; tt: ThongTin } | null>(null);
  const xong = () => { setMo(null); lamMoi(); onDone(); };

  const batDau = async (em: Em) => {
    if (dangMo) return;
    setDangMo(em.id);
    try {
      const tt = await api.get<ThongTin>(`/students/${em.id}/quay-lai`);
      if (tt.huong !== 'lop-cu') { setMo({ em, tt }); return; }
      await api.post(`/students/${em.id}/quay-lai`, {});
      lamMoi(); onDone();
      toast.hoanTac(t('{ten} quay lại {lop} · Case chạy hạn lại', { ten: em.ten, lop: tt.lopCu?.code ?? '' }), async () => {
        try { await api.post(`/students/${em.id}/hoan-tac-quay-lai`, {}); } catch (e: any) { toast.push('error', e.message); return; }
        lamMoi(); onDone(); toast.push('ok', t('Đã hoàn tác'));
      }, { key: `quay-lai:${em.id}` });
    } catch (e: any) { toast.push('error', e.message); } finally { setDangMo(null); }
  };

  const panels = !mo ? null
    : mo.tt.huong === 'chon-lop' ? <HopChonLopQuayLai em={mo.em} tt={mo.tt} onClose={() => setMo(null)} onDone={xong} />
      : mo.tt.huong === 'lo-trinh-moi' && mo.tt.cycleId ? (
        <PanelBuocTiep cycleId={mo.tt.cycleId} hocVien={{ id: mo.em.id, ten: mo.em.ten }} lop={mo.em.lop ?? mo.tt.lopCu?.code ?? null} chonSan="lo_trinh_moi"
          onClose={() => setMo(null)} onDone={() => { lamMoi(); onDone(); }} />
      ) : <HocLaiPanel studentId={mo.em.id} studentName={mo.em.ten} lop={mo.em.lop ?? mo.tt.lopCu?.code ?? null} onClose={() => setMo(null)} onDone={xong} />;
  return { mo: batDau, dangMo, panels };
}

/** ⋯ hồ sơ › Quay lại học: chạy đúng đường của nút ở Lưu trữ; đóng khi không còn hộp / panel nào mở. */
export function QuayLaiTuMenu({ em, onClose, onDone }: { em: Em; onClose: () => void; onDone: () => void }) {
  const q = useQuayLaiHoc(onDone);
  const [xong, setXong] = useState(false);
  useEffect(() => { void q.mo(em).then(() => setXong(true)); }, []);   // eslint-disable-line react-hooks/exhaustive-deps -- chạy một lần khi mở
  useEffect(() => { if (xong && !q.panels) onClose(); }, [xong, q.panels, onClose]);
  return <>{q.panels}</>;
}

/** Lớp cũ đã kết thúc → chọn lớp (gợi ý sẵn), Bắt đầu ngay. Lỗi giữ lựa chọn + Thử lại. */
function HopChonLopQuayLai({ em, tt, onClose, onDone }: { em: Em; tt: ThongTin; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [lopId, setLopId] = useState<number | null>(tt.goiYId);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const lop = tt.lop.find((l) => l.id === lopId) ?? null;
  const goiY = tt.lop.find((l) => l.id === tt.goiYId);
  /* Lớp gợi ý (cùng chương trình, cùng chi nhánh) lên đầu danh sách. */
  const ds = [...(goiY ? [goiY] : []), ...tt.lop.filter((l) => l.id !== tt.goiYId)].map((l) => ({ id: l.id, ma: l.code, phu: phuLop(l) }));
  const luu = async () => {
    if (!lopId || busy) return;
    setBusy(true); setLoi(null);
    try {
      await api.post(`/students/${em.id}/quay-lai`, { lopMoiId: lopId });
      toast.push('ok', t('{ten} quay lại học ở {lop}', { ten: em.ten, lop: lop?.code ?? '' }));
      onDone();
    } catch (e: any) { setLoi(e?.message ?? t('Mất kết nối')); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={busy ? () => {} : onClose} width="max-w-md"
      title={<span className="flex flex-col"><span>{t('Quay lại học · {ten}', { ten: em.ten })}</span>
        <span className="text-xs font-normal text-slate-400">{t('{lop} đã kết thúc', { lop: tt.lopCu?.code ?? '' })}</span></span>}
      footer={(
        <>
          {busy && <span className="mr-auto text-[13px] font-semibold text-[color:var(--accent)]" role="status">{t('Đang lưu…')}</span>}
          <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onClose} disabled={busy}>{t('Huỷ')}</button>
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => void luu()} disabled={busy || !lopId}>{loi ? t('Thử lại') : t('Quay lại học')}</button>
        </>
      )}>
      <div className="space-y-3">
        <Truong nhan={t('Lớp')} as="div">
          <ChonLop ds={ds} value={lopId} onChange={setLopId} ariaLabel={t('Lớp')} />
          {goiY && lopId === goiY.id && <p className="m-0 mt-1 text-xs text-slate-400">{t('Gợi ý: lớp đang chạy cùng chương trình, cùng chi nhánh')}</p>}
        </Truong>
        <KhoiKhiLuu dong={lop ? [t('Bỏ lưu trữ · em đang học ở {lop}', { lop: lop.code }), t('Chuyển lớp theo luật Chuyển lớp · Case chạy hạn lại')] : []} />
        {loi && (
          <p role="alert" className="m-0 flex gap-2 rounded-lg border border-late/50 bg-late/10 px-3 py-2 text-sm text-slate-100">
            <span aria-hidden className="text-late">⚠</span><span><b className="text-late">{t('Chưa lưu được.')}</b> {loi}</span>
          </p>
        )}
      </div>
    </Modal>
  );
}
