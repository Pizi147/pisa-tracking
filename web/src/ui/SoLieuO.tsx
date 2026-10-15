import { metricById } from '@shared/domain/index.ts';
import { useMoSoLieu } from '../lib/quayLai.ts';
import { useApi } from '../lib/useApi.ts';
import { DanhSachSoLieu, NganDanhSach, type DongSoLieu, type PhamViSoLieu } from './SoLieu.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * SỐ NHỎ BẤM ĐƯỢC (G-10) — dùng trong bảng, dòng phụ, dòng Cần xử lý. Hai nguồn, cùng một luật "số = số dòng khi bấm":
 *   · `id`    — một chỉ số trong sổ: mở `DanhSachSoLieu` (cùng `/metrics/:id` với ô số).
 *   · `nguon` — một đường máy chủ trả `{ n, tieuDe, rows }` tính bằng CHÍNH hàm sinh ra số (ví dụ ô bảng chi nhánh).
 * Số 0 không bấm được, chữ mờ.
 */
type Props = { giaTri: number; className?: string; /** Chữ hiện trên nút thay cho `giaTri` (vd "5/8": số bấm được là 8 học viên). */ nhan?: string;
  /** OV-11f (TQ-11): tên ở dòng đang bấm — tiêu đề panel dùng đúng chữ này. */ ten?: string } & (
  | { id: string; phamVi?: PhamViSoLieu; extra?: Record<string, string>; nguon?: undefined; tieuDe?: undefined }
  | { nguon: string; tieuDe: string; id?: undefined; phamVi?: undefined; extra?: undefined }
);

export function SoLieuO(props: Props) {
  const [open, setOpen] = useMoSoLieu(props.id !== undefined ? `${props.id}${props.extra ? `|${new URLSearchParams(props.extra)}` : ''}` : `nguon:${props.nguon}`);
  const { giaTri, className = '' } = props;
  // Mã không có trong sổ thì KHÔNG vẽ số (cùng luật với <SoLieu>).
  if (props.id !== undefined && !metricById(props.id)) return <span className="text-xs text-bad">{t('Chỉ số không có trong sổ: {id}', { id: props.id })}</span>;
  if (giaTri <= 0) return <span className={`tabular-nums text-slate-500 ${className}`}>{giaTri}</span>;
  const ten = props.ten ?? (props.id !== undefined ? (metricById(props.id)?.ten ?? props.id) : props.tieuDe);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={`appearance-none bg-transparent border-0 p-0 max-sm:py-3 max-sm:-my-3 cursor-pointer tabular-nums underline decoration-dotted underline-offset-4 hover:text-white ${className}`}
        aria-label={t('{gt} — {ten}. Bấm để xem danh sách', { gt: props.nhan ?? giaTri, ten })}>{props.nhan ?? giaTri}</button>
      {props.id !== undefined
        ? <DanhSachSoLieu id={props.id} giaTri={giaTri} phamVi={props.phamVi} extra={props.extra} open={open} onClose={() => setOpen(false)} ten={props.ten} />
        : <DanhSachNguon nguon={props.nguon} tieuDe={props.tieuDe} open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

function DanhSachNguon({ nguon, tieuDe, open, onClose }: { nguon: string; tieuDe: string; open: boolean; onClose: () => void }) {
  const { data, loading, error, reload } = useApi<{ n: number; tieuDe: string; rows: DongSoLieu[] }>(open ? nguon : null, [nguon, open]);
  if (!open) return null;
  /* OV-12e: cùng panel mở rộng dòng với ô số trong sổ (`NganDanhSach`). */
  return <NganDanhSach tieuDe={data?.tieuDe ?? tieuDe} data={data} loading={loading} error={error} reload={reload} onDong={onClose} />;
}
