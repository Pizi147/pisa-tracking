import { useEffect, useRef, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { HopNeo } from '../../ui/HopNeo.tsx';
import { NUT_DONG } from '../../ui/KhungPanel.tsx';
import { ChonNguoi, type NguoiTrongDs, type TimXa } from '../../ui/PeoplePicker.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { QuickReport } from '../cases/QuickReport.tsx';
import { RecordViolationPanel } from '../yThuc/RecordViolationPanel.tsx';
import { HopTinhHinh } from '../yThuc/TinhHinh.tsx';
import { IconNhom } from './DanhSachViec.tsx';
import { t } from '@shared/i18n/index.ts';

export type EmTask = { id: number; ten: string; lopId: number; lop: string; tvv: string | null };
type Em = EmTask;
type Loai = 'case' | 'vi-pham' | 'tinh-hinh';
/** Chủ SP 14/11 (lời 17): tên nút "+ Task", thứ tự Case · Vi phạm / Nhắc nhở · Tình hình học tập. */
const MUC: [Loai, string][] = [['case', t('Case')], ['vi-pham', t('Vi phạm / Nhắc nhở')], ['tinh-hinh', t('Tình hình học tập')]];
/** GD-4a (mockup ⑤ F1, [XM-7]): menu giữ biểu tượng mục — cờ Case · khiên Ý thức · bóng lời Tình hình. */
const IC: Record<Loai, string> = { case: 'case-hoc-thuat', 'vi-pham': 'y-thuc', 'tinh-hinh': 'tinh-hinh' };
const TOI_DA_TINH_HINH = 8;

/**
 * "+ TASK" Ở TRANG ĐẦU GV (GD-1, mockup v21 ① K5; `04-thiet-ke.md` 5.4 + mục 12): menu 3 mục → hộp "Chọn em" (gõ tên, em lớp của tôi lên trước,
 * lớp bên cạnh tên; Tình hình học tập chọn nhiều ≤ 8) → ĐÚNG form đang có (QuickReport · RecordViolationPanel · hộp Báo tình hình) — cùng quyền, cùng luật.
 * Tìm em: `/tim/hoc-vien` qua ô chọn có tìm chung (GD-5; một câu mỗi lần gõ, ≥ 2 ký tự, chờ 250 ms). Nút cũ ở hồ sơ lớp / HV giữ nguyên.
 * `noi`: nút ở đầu trang (máy rộng) hoặc nút tròn nổi trên thanh tab dưới (< 640 px, K8a).
 * GD-4a (mockup ⑤ F): MỘT nút cho trang đầu, hồ sơ lớp, hồ sơ HV — `lopId`: mở từ hồ sơ lớp, nhóm "Lớp này" lên đầu; `em`: hồ sơ HV điền sẵn em → bỏ bước chọn.
 * < 640 px menu neo đáy (F4).
 */
export function NutTask({ noi, lopId, em: emSan }: { noi: 'dau' | 'noi'; lopId?: number; em?: EmTask }) {
  const neo = useRef<HTMLSpanElement>(null);
  const [loai, setLoai] = useState<Loai | null>(null);
  const [em, setEm] = useState<Em[] | null>(null);
  const { homNay } = useNgayNghiepVu();
  const dong = () => { setLoai(null); setEm(null); };
  const xong = () => { invalidate('/my-work'); dong(); };
  const mat = noi === 'dau'
    ? <span className="inline-flex h-8 items-center px-3 text-[13px] font-semibold">{t('+ Task')}</span>
    : <span className="grid h-[60px] w-[60px] place-items-center text-sm font-bold">{t('+ Task')}</span>;
  return (
    <>
      <span ref={neo} className={noi === 'noi' ? 'fixed bottom-[80px] right-4 z-[35] sm:hidden' : 'max-sm:hidden'}>
        <MenuDong nhan={t('Task: Case, vi phạm / nhắc nhở, tình hình học tập')} mat={mat} tieuDeDay={t('+ Task')}
          lopNut={noi === 'dau' ? 'btn btn-primary !p-0' : 'btn btn-primary !rounded-full !p-0 shadow-lg'}
          muc={MUC.map(([k, nhan]) => ({ key: k, nhan, bieuTuong: <IconNhom k={IC[k]} />, onChon: () => { setEm(emSan ? [emSan] : null); setLoai(k); } }))} />
      </span>
      {loai && !em && <HopChonEm neo={neo} loai={loai} lopId={lopId} onDong={dong} onChon={setEm} />}
      {loai === 'case' && em?.[0] && <QuickReport open onClose={dong} studentId={em[0].id} studentName={em[0].ten} lop={em[0].lop} onDone={xong} />}
      {loai === 'vi-pham' && em?.[0] && <RecordViolationPanel open onClose={dong} studentId={em[0].id} studentName={em[0].ten} lop={em[0].lop} onDone={xong} />}
      {loai === 'tinh-hinh' && em?.length && (
        <HopTinhHinh neo={neo} homNay={homNay} che={{ loai: 'bao', em: em.map((e) => ({ id: e.id, ten: e.ten, tvv: e.tvv })) }} onDong={dong} onXong={() => invalidate('/my-work')} />
      )}
    </>
  );
}

/**
 * GD-4a (mockup ⑤ F2, F3) · GD-5: bước chọn em = ô chọn có tìm chung (`ChonNguoi tim`, mẫu ⑤ A) trong hộp nhỏ — nhóm có nhãn + số: "Lớp này" (mở từ hồ sơ lớp)
 * → từng lớp của tôi ("· chủ nhiệm") → "Lớp khác"; tô chữ khớp; Tình hình học tập chọn nhiều ≤ 8 (chip + "n / 8"). Tìm: `/tim/hoc-vien` (một câu, LIMIT 40, ≥ 2 ký tự).
 */
function HopChonEm({ neo, loai, lopId, onDong, onChon }: {
  neo: React.RefObject<HTMLElement | null>; loai: Loai; lopId?: number; onDong: () => void; onChon: (em: Em[]) => void;
}) {
  const { session } = useSession();
  const pc = session?.assignments ?? [];
  const lopToi = new Set(pc.map((a) => a.classId));
  const chuNhiem = new Set(pc.filter((a) => a.isCore).map((a) => a.classId));
  const nhieu = loai === 'tinh-hinh';
  const [chon, setChon] = useState<NguoiTrongDs[]>([]);
  /** Em đã thấy trong kết quả tìm (id → lớp, TVV) — form sau cần đủ thông tin, ô chọn chỉ giữ tên + dòng phụ. */
  const emCua = useRef(new Map<number, Em>());
  /* HopNeo focus phần tử bấm được đầu tiên (nút ✕) sau khi vẽ — đưa focus về ô gõ ở lượt kế (người dùng gõ tên ngay). */
  useEffect(() => { const h = setTimeout(() => document.getElementById(O_TIM_EM)?.focus()); return () => clearTimeout(h); }, []);
  /* Thứ tự nhóm: lớp này → lớp của tôi (theo mã) → lớp khác; giữ thứ tự tên máy chủ trong mỗi nhóm. */
  const hang = (e: Em) => (e.lopId === lopId ? 0 : lopToi.has(e.lopId) ? 1 : 2);
  const tenNhom = (e: Em) => (hang(e) === 0 ? `${t('Lớp này')} · ${e.lop}` : hang(e) === 1 ? (chuNhiem.has(e.lopId) ? `${e.lop} · ${t('chủ nhiệm')}` : e.lop) : t('Lớp khác'));
  const tim: TimXa = {
    toiThieu: 2, goiY: t('Gõ ít nhất 2 chữ của tên em'),
    goi: async (q) => {
      const r = await api.get<Em[]>(`/tim/hoc-vien?q=${encodeURIComponent(q)}&lop=toi`);
      for (const e of r) emCua.current.set(e.id, e);
      return [...r].sort((a, b) => hang(a) - hang(b) || (hang(a) === 1 ? a.lop.localeCompare(b.lop) : 0)).slice(0, 12)
        .map((e) => ({ id: e.id, ten: e.ten, phu: e.lop, nhom: tenNhom(e) }));
    },
  };
  const em = (ds: NguoiTrongDs[]) => ds.map((x) => emCua.current.get(x.id)).filter((e): e is Em => !!e);
  const tieuDe = MUC.find(([k]) => k === loai)![1];
  return (
    <HopNeo neo={neo} nhan={tieuDe} rong={440} onNgoai={onDong}>
      {/* ⑤ F2 `.h-dau`: tiêu đề 15 + ✕ CÙNG HÀNG (tâm ✕ = tâm dòng tiêu đề), dòng phụ "Chọn em" dưới; ✕ cách mép phải hộp 12 px (đệm 16 − 4). */}
      <div className="-mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 border-b pb-2.5" style={{ borderColor: 'var(--line)' }}>
        <b className="min-w-0 text-[15px] font-bold text-slate-100">{tieuDe}</b>
        <button type="button" className={`${NUT_DONG} -mr-1`} aria-label={t('Đóng')} onClick={onDong}>✕</button>
        <span className="text-[13px] text-dim">{t('Chọn em')}</span>
      </div>
      <ChonNguoi id={O_TIM_EM} value={null} nhom="nhan_vien" choToi={false} choNgoai={false} tim={tim} tuMo tinh
        ariaLabel={t('Gõ tên em')} tieuDe={t('Học viên')} placeholder={t('Gõ tên em…')}
        nhieu={nhieu ? { chon, toiDa: TOI_DA_TINH_HINH, onDoi: setChon, donVi: t('em') } : undefined}
        onChange={(v) => { if (v?.kieu === 'tai_khoan') onChon(em([{ id: v.id, ten: v.ten }])); }} />
      {nhieu && (
        <div className="flex justify-end gap-2 border-t pt-2.5" style={{ borderColor: 'var(--line)' }}>
          {/* ⑤ F3 + rà đồng bộ 15/11 mục B: một chân "Đóng · Tiếp" cho hộp chọn em. */}
          <button type="button" className="btn max-sm:h-11 max-sm:flex-1" onClick={onDong}>{t('Đóng')}</button>
          <button type="button" className="btn btn-primary max-sm:h-11 max-sm:flex-1" disabled={!chon.length} onClick={() => onChon(em(chon))}>{t('Tiếp ›')}</button>
        </div>
      )}
    </HopNeo>
  );
}
const O_TIM_EM = 'tim-em-task';
