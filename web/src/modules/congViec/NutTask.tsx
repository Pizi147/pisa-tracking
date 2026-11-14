import { useEffect, useRef, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { HopNeo } from '../../ui/HopNeo.tsx';
import { NUT_DONG } from '../../ui/KhungPanel.tsx';
import { ChonNguoi, type TimXa } from '../../ui/PeoplePicker.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { QuickReport } from '../cases/QuickReport.tsx';
import { RecordViolationPanel } from '../yThuc/RecordViolationPanel.tsx';
import { HopTinhHinh, type ChonEmTinhHinh } from '../yThuc/TinhHinh.tsx';
import { IconNhom } from './DanhSachViec.tsx';
import { boDau } from '@shared/huongDan/kieu.ts';
import { t } from '@shared/i18n/index.ts';

export type EmTask = { id: number; ten: string; lopId: number; lop: string; tvv: string | null };
type Em = EmTask;
export type LoaiTask = 'case' | 'vi-pham' | 'tinh-hinh';
type Loai = LoaiTask;
/** Em của lớp đã nạp + dòng phụ tình trạng (SOS n / Đạt…). */
export type EmLop = EmTask & { phu?: string };
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
export function NutTask({ noi, lopId, em: emSan, muc: chiMuc, hoi, onXong, cycleId, onMoCase, phu = false, dauHoSo = false, dsEm }: {
  noi: 'dau' | 'noi'; lopId?: number; em?: EmTask;
  /** GD-7 (③ K6, [XM-6]): chỉ các mục người xem làm được (máy chủ quyết: `canReport` · `canRecord` · `coTheBao` / `coTheHoi`); bỏ trống = đủ 3 mục. */
  muc?: readonly Loai[];
  /** GD-7 ([XM-6]): TVV — mục Tình hình là "Hỏi tình hình học tập" (gửi GVCN), không "Báo". */
  hoi?: { gvcn: string | null };
  /** GD-7: nơi gọi tải lại sau khi lưu (hồ sơ HV: hồ sơ + mở Case vừa tạo). */
  onXong?: (caseId?: number) => void;
  /** GD-7: giữ thao tác cũ của "+ Case" hồ sơ HV — Case vào lộ trình đang xem · "Thêm PA" / Case trùng mở Case ngay tại hồ sơ. */
  cycleId?: number | null; onMoCase?: (caseId: number, viec: 'xac-nhan' | 'them-pa') => void;
  /** GD-7 ([XM-5]): nút thường (không chính) — hồ sơ lưu trữ có "Quay lại học" là nút chính. */
  phu?: boolean;
  /** GD-7: nút ở hàng nút đầu hồ sơ — cao 36 như "⋯" (`NUT_DAU_HO_SO`), không 34. */
  dauHoSo?: boolean;
  /** GD-6 ([XM-7] mockup ②): hồ sơ lớp truyền em của lớp đã nạp (`/roster`) — chọn em tìm tại chỗ, chỉ nhóm "Lớp này", không request. */
  dsEm?: EmLop[];
}) {
  const neo = useRef<HTMLSpanElement>(null);
  const [loai, setLoai] = useState<Loai | null>(null);
  const [em, setEm] = useState<Em[] | null>(null);
  const { homNay } = useNgayNghiepVu();
  const timEm = useTimEm(lopId, dsEm);
  /* Hộp Tình hình một bước: HopNeo focus nút đầu (✕) — đưa focus về ô gõ tên em (người dùng gõ ngay), như bước chọn em. */
  useEffect(() => {
    if (loai !== 'tinh-hinh' || emSan) return undefined;
    const h = setTimeout(() => document.getElementById(O_TIM_EM)?.focus());
    return () => clearTimeout(h);
  }, [loai, emSan]);
  const dong = () => { setLoai(null); setEm(null); };
  const xong = (caseId?: number) => { invalidate('/my-work'); dong(); onXong?.(caseId); };
  const dsMuc = MUC.filter(([k]) => !chiMuc || chiMuc.includes(k)).map(([k, nhan]) => [k, k === 'tinh-hinh' && hoi ? t('Hỏi tình hình học tập') : nhan] as const);
  if (!dsMuc.length) return null;
  const mat = noi === 'dau'
    ? <span className={`inline-flex ${dauHoSo ? 'h-[34px]' : 'h-8'} items-center px-3 text-[13px] font-semibold`}>{t('+ Task')}</span>
    : <span className="grid h-[60px] w-[60px] place-items-center text-sm font-bold">{t('+ Task')}</span>;
  return (
    <>
      <span ref={neo} className={noi === 'noi' ? 'fixed bottom-[80px] right-4 z-[35] sm:hidden' : 'max-sm:hidden'}>
        <MenuDong nhan={t('Task: Case, vi phạm / nhắc nhở, tình hình học tập')} mat={mat} tieuDeDay={t('+ Task')}
          lopNut={noi === 'dau' ? `btn ${phu ? '' : 'btn-primary '}!p-0` : 'btn btn-primary !rounded-full !p-0 shadow-lg'}
          muc={dsMuc.map(([k, nhan]) => ({ key: k, nhan, bieuTuong: <IconNhom k={IC[k]} />, onChon: () => { setEm(emSan ? [emSan] : k === 'tinh-hinh' ? [] : null); setLoai(k); } }))} />
      </span>
      {loai && loai !== 'tinh-hinh' && !em && <HopChonEm neo={neo} loai={loai} timEm={timEm} onDong={dong} onChon={setEm} />}
      {loai === 'case' && em?.[0] && <QuickReport open onClose={dong} cycleId={cycleId} onMoCase={onMoCase} studentId={em[0].id} studentName={em[0].ten} lop={em[0].lop} onDone={(cid) => xong(cid)} />}
      {loai === 'vi-pham' && em?.[0] && <RecordViolationPanel open onClose={dong} studentId={em[0].id} studentName={em[0].ten} lop={em[0].lop} onDone={() => xong()} />}
      {/* GD-4d (⓪ 40d, ⑤ F3 / ① K5c): Tình hình học tập = MỘT hộp — chọn em (ô chọn có tìm chung, ≤ 8) ngay trong hộp gửi; hồ sơ HV: em cố định. */}
      {loai === 'tinh-hinh' && em && (
        <HopTinhHinh neo={neo} homNay={homNay} onDong={dong} onXong={() => { invalidate('/my-work'); onXong?.(); }}
          che={hoi && emSan ? { loai: 'hoi', em: { id: emSan.id, ten: emSan.ten }, gvcn: hoi.gvcn }
            : { loai: 'bao', em: em.map((e) => ({ id: e.id, ten: e.ten, tvv: e.tvv })), chonEm: emSan ? undefined : chonEmTinhHinh(timEm) }} />
      )}
    </>
  );
}

/**
 * GD-4a (mockup ⑤ F2) · GD-5: tìm em = ô chọn có tìm chung (`ChonNguoi tim`, mẫu ⑤ A) — nhóm có nhãn + số: "Lớp này" (mở từ hồ sơ lớp) → từng lớp của tôi
 * ("· chủ nhiệm") → "Lớp khác"; tô chữ khớp. Tìm: `/tim/hoc-vien?lop=toi` (một câu, LIMIT 40, ≥ 2 ký tự). Dùng chung cho bước chọn em (Case · Vi phạm)
 * và hộp Tình hình học tập một bước (GD-4d).
 */
type TimEm = { tim: TimXa; emCua: Map<number, Em> };
function useTimEm(lopId?: number, dsEm?: EmLop[]): TimEm {
  const { session } = useSession();
  const pc = session?.assignments ?? [];
  const lopToi = new Set(pc.map((a) => a.classId));
  const chuNhiem = new Set(pc.filter((a) => a.isCore).map((a) => a.classId));
  /** Em đã thấy trong kết quả tìm (id → lớp, TVV) — form sau cần đủ thông tin, ô chọn chỉ giữ tên + dòng phụ. */
  const emCua = useRef(new Map<number, Em>()).current;
  /* Thứ tự nhóm: lớp này → lớp của tôi (theo mã) → lớp khác; giữ thứ tự tên máy chủ trong mỗi nhóm. */
  const hang = (e: Em) => (e.lopId === lopId ? 0 : lopToi.has(e.lopId) ? 1 : 2);
  const tenNhom = (e: Em) => (hang(e) === 0 ? `${t('Lớp này')} · ${e.lop}` : hang(e) === 1 ? (chuNhiem.has(e.lopId) ? `${e.lop} · ${t('chủ nhiệm')}` : e.lop) : t('Lớp khác'));
  /* GD-6: em của lớp đã nạp → lọc tại chỗ (không dấu, từ một chữ), dòng phụ = tình trạng em. */
  const timTaiCho: TimXa | null = dsEm ? {
    toiThieu: 1, goiY: t('Gõ tên em'),
    goi: async (q) => {
      const kim = boDau(q).toLowerCase().trim();
      return dsEm.filter((e) => boDau(e.ten).toLowerCase().includes(kim)).slice(0, 12)
        .map((e) => { emCua.set(e.id, e); return { id: e.id, ten: e.ten, phu: e.phu ?? e.lop, nhom: `${t('Lớp này')} · ${e.lop}` }; });
    },
  } : null;
  const tim: TimXa = timTaiCho ?? {
    toiThieu: 2, goiY: t('Gõ ít nhất 2 chữ của tên em'),
    goi: async (q) => {
      const r = await api.get<Em[]>(`/tim/hoc-vien?q=${encodeURIComponent(q)}&lop=toi`);
      for (const e of r) emCua.set(e.id, e);
      return [...r].sort((a, b) => hang(a) - hang(b) || (hang(a) === 1 ? a.lop.localeCompare(b.lop) : 0)).slice(0, 12)
        .map((e) => ({ id: e.id, ten: e.ten, phu: e.lop, nhom: tenNhom(e) }));
    },
  };
  return { tim, emCua };
}

/** GD-4d (⓪ 40d): ô chọn em trong hộp Tình hình học tập — chọn nhiều ≤ 8 (chip + "n / 8"); em kèm TVV cho khối "Gửi tới". */
const chonEmTinhHinh = (timEm: TimEm): ChonEmTinhHinh => ({ em, setEm, luu }) => (
  <ChonNguoi id={O_TIM_EM} value={null} onChange={() => {}} nhom="nhan_vien" choToi={false} choNgoai={false} tim={timEm.tim} disabled={luu}
    ariaLabel={t('Gõ tên em')} tieuDe={t('Học viên')} placeholder={t('Gõ tên em…')}
    nhieu={{ chon: em.map((e) => ({ id: e.id, ten: e.ten })), toiDa: TOI_DA_TINH_HINH, donVi: t('em'),
      onDoi: (ds) => setEm(ds.flatMap((x) => {
        const co = em.find((e) => e.id === x.id); if (co) return [co];
        const m = timEm.emCua.get(x.id); return m ? [{ id: m.id, ten: m.ten, tvv: m.tvv }] : [];
      })) }} />
);

/** Bước "Chọn em" của Case · Vi phạm / Nhắc nhở (một em) → form panel. */
function HopChonEm({ neo, loai, timEm, onDong, onChon }: {
  neo: React.RefObject<HTMLElement | null>; loai: Loai; timEm: TimEm; onDong: () => void; onChon: (em: Em[]) => void;
}) {
  /* HopNeo focus phần tử bấm được đầu tiên (nút ✕) sau khi vẽ — đưa focus về ô gõ ở lượt kế (người dùng gõ tên ngay). */
  useEffect(() => { const h = setTimeout(() => document.getElementById(O_TIM_EM)?.focus()); return () => clearTimeout(h); }, []);
  const tieuDe = MUC.find(([k]) => k === loai)![1];
  return (
    <HopNeo neo={neo} nhan={tieuDe} rong={440} onNgoai={onDong}>
      {/* ⑤ F2 `.h-dau`: tiêu đề 15 + ✕ CÙNG HÀNG (tâm ✕ = tâm dòng tiêu đề), dòng phụ "Chọn em" dưới; ✕ cách mép phải hộp 12 px (đệm 16 − 4). */}
      <div className="-mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 border-b pb-2.5" style={{ borderColor: 'var(--line)' }}>
        <b className="min-w-0 text-[15px] font-bold text-slate-100">{tieuDe}</b>
        <button type="button" className={`${NUT_DONG} -mr-1`} aria-label={t('Đóng')} onClick={onDong}>✕</button>
        <span className="text-[13px] text-dim">{t('Chọn em')}</span>
      </div>
      <ChonNguoi id={O_TIM_EM} value={null} nhom="nhan_vien" choToi={false} choNgoai={false} tim={timEm.tim} tuMo tinh
        ariaLabel={t('Gõ tên em')} tieuDe={t('Học viên')} placeholder={t('Gõ tên em…')}
        onChange={(v) => { const e = v?.kieu === 'tai_khoan' ? timEm.emCua.get(v.id) : undefined; if (e) onChon([e]); }} />
    </HopNeo>
  );
}
const O_TIM_EM = 'tim-em-task';
