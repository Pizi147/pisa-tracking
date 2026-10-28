import { Suspense } from 'react';
import { khoaSoLieu, metricById } from '@shared/domain/index.ts';
import { useMoSoLieu } from '../lib/quayLai.ts';
import { useApi } from '../lib/useApi.ts';
import { DanhSachSoLieu, mauOSo, NganDanhSach, VUNG_BAM_SO, type DongSoLieu, type PhamViSoLieu } from './SoLieu.tsx';
import { KhungPanel } from './KhungPanel.tsx';
import { Skeleton } from './ui.tsx';
import { lazyTai } from '../lib/taiLaiManh.ts';
import type { CauHinhGvTre } from '../modules/worklist/PanelGvTre.tsx';
import { t } from '@shared/i18n/index.ts';

/* M6 6b-4: panel "GV chấm quá hạn" (lưới Nhập hộ) chỉ tải khi bấm — trang có ô số không kéo lưới chấm vào lần tải đầu. */
const PanelGvTre = lazyTai(() => import('../modules/worklist/PanelGvTre.tsx').then((m) => ({ default: m.PanelGvTre })));

/**
 * Ô SỐ BÁO CÁO `OSo` (NEN-V5: gộp SoLieuO + OSoNho cũ; G6, G-10) — một dáng "số gạch chân liền màu nhấn → panel dữ liệu chỉ đọc", khác nút động từ
 * và tên hồ sơ (↗). Dùng trong bảng, dòng phụ, dòng Cần xử lý. Hai nguồn, cùng một luật "số = số dòng khi bấm":
 *   · `id`    — một chỉ số trong sổ: mở `DanhSachSoLieu` (cùng `/metrics/:id` với ô số).
 *   · `nguon` — một đường máy chủ trả `{ n, tieuDe, rows }` tính bằng CHÍNH hàm sinh ra số (ví dụ ô bảng chi nhánh).
 * Số 0 không bấm được, chữ mờ.
 */
type Props = { giaTri: number; className?: string; /** Chữ hiện trên nút thay cho `giaTri` (vd "5/8": số bấm được là 8 học viên). */ nhan?: string;
  /** OV-11f (TQ-11): tên ở dòng đang bấm — tiêu đề panel dùng đúng chữ này. */ ten?: string;
  /** SL1 (A1-01): cùng số vẽ ở hai vùng một trang (dải + hàng tổng) → mỗi vùng một khoá panel (`khoaSoLieu`). */ vung?: string } & (
  | { id: string; phamVi?: PhamViSoLieu; extra?: Record<string, string>; nguon?: undefined; tieuDe?: undefined }
  | { nguon: string; tieuDe: string; id?: undefined; phamVi?: undefined; extra?: undefined;
      /** M6 6b-4: `nguon` là `/tong-quan/gv-tre` — panel GV chấm quá hạn (theo GV → em còn trống → Nhập hộ) thay danh sách phẳng. */
      gvTre?: CauHinhGvTre }
);

export function OSo(props: Props) {
  const [open, setOpen] = useMoSoLieu(khoaSoLieu(props));
  const { giaTri, className = '' } = props;
  // Mã không có trong sổ thì KHÔNG vẽ số (cùng luật với <SoLieu>).
  if (props.id !== undefined && !metricById(props.id)) return <span className="text-xs text-bad">{t('Chỉ số không có trong sổ: {id}', { id: props.id })}</span>;
  if (giaTri <= 0) return <span className={`tabular-nums font-medium text-slate-500 ${className}`}>{giaTri}</span>;
  const ten = props.ten ?? (props.id !== undefined ? (metricById(props.id)?.ten ?? props.id) : props.tieuDe);
  /* M6 6b-1 (bảng kê lỗi 3): ô số nằm trong hàng bấm được (`Bang onHang`, `HangNhom`) — click / Enter / Space ở nút VÀ trong panel (portal vẫn nổi
     theo cây React) không lên hàng: hàng không đổi chi nhánh thay vì mở panel, ô gõ trong panel gõ được dấu cách. Esc không chặn (khung nghe ở document). */
  return (
    <span className="contents" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}>
      <button type="button" onClick={() => setOpen(true)}
        className={`${VUNG_BAM_SO} ${mauOSo(className)}`}
        aria-label={t('{gt} — {ten}. Bấm để xem danh sách', { gt: props.nhan ?? giaTri, ten })}>{props.nhan ?? giaTri}</button>
      {props.id !== undefined
        ? <DanhSachSoLieu id={props.id} giaTri={giaTri} phamVi={props.phamVi} extra={props.extra} open={open} onClose={() => setOpen(false)} ten={props.ten} />
        : props.gvTre ? open && (
          <Suspense fallback={<KhungPanel tieuDe={props.tieuDe} rong="rong" onDong={() => setOpen(false)}><div className="pt-3"><Skeleton rows={5} /></div></KhungPanel>}>
            <PanelGvTre nguon={props.nguon} tieuDe={props.tieuDe} cauHinh={props.gvTre} onDong={() => setOpen(false)} />
          </Suspense>
        )
        : <DanhSachNguon nguon={props.nguon} tieuDe={props.tieuDe} open={open} onClose={() => setOpen(false)} />}
    </span>
  );
}

export function DanhSachNguon({ nguon, tieuDe, open, onClose }: { nguon: string; tieuDe: string; open: boolean; onClose: () => void }) {
  const { data, loading, error, reload } = useApi<{ n: number; tieuDe: string; rows: DongSoLieu[] }>(open ? nguon : null, [nguon, open]);
  if (!open) return null;
  /* OV-12e: cùng panel mở rộng dòng với ô số trong sổ (`NganDanhSach`). M6 6b-1 (bảng kê 0.2): tiêu đề = chữ nơi gọi (kèm ngữ cảnh: chi nhánh, lớp)
     — không đổi sang tiêu đề máy chủ khi tải xong (đầu panel không nhảy, không mất ngữ cảnh). */
  return <NganDanhSach tieuDe={tieuDe} data={data} loading={loading} error={error} reload={reload} onDong={onClose} />;
}
