import { useState } from 'react';
import { metricById } from '@shared/domain/index.ts';
import { useApi } from '../lib/useApi.ts';
import { KhungPanel } from './KhungPanel.tsx';
import { Empty, ErrorState, Skeleton } from './ui.tsx';
import { DanhSachSoLieu, DongDanhSach, type DongSoLieu, type PhamViSoLieu } from './SoLieu.tsx';

/**
 * SỐ NHỎ BẤM ĐƯỢC (G-10) — dùng trong bảng, dòng phụ, dòng Cần xử lý. Hai nguồn, cùng một luật "số = số dòng khi bấm":
 *   · `id`    — một chỉ số trong sổ: mở `DanhSachSoLieu` (cùng `/metrics/:id` với ô số).
 *   · `nguon` — một đường máy chủ trả `{ n, tieuDe, rows }` tính bằng CHÍNH hàm sinh ra số (ví dụ ô bảng chi nhánh).
 * Số 0 không bấm được, chữ mờ.
 */
type Props = { giaTri: number; className?: string; /** Chữ hiện trên nút thay cho `giaTri` (vd "5/8": số bấm được là 8 học viên). */ nhan?: string } & (
  | { id: string; phamVi?: PhamViSoLieu; extra?: Record<string, string>; nguon?: undefined; tieuDe?: undefined }
  | { nguon: string; tieuDe: string; id?: undefined; phamVi?: undefined; extra?: undefined }
);

export function SoLieuO(props: Props) {
  const [open, setOpen] = useState(false);
  const { giaTri, className = '' } = props;
  // Mã không có trong sổ thì KHÔNG vẽ số (cùng luật với <SoLieu>).
  if (props.id !== undefined && !metricById(props.id)) return <span className="text-xs text-bad">Chỉ số không có trong sổ: {props.id}</span>;
  if (giaTri <= 0) return <span className={`tabular-nums text-slate-500 ${className}`}>{giaTri}</span>;
  const ten = props.id !== undefined ? (metricById(props.id)?.ten ?? props.id) : props.tieuDe;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={`appearance-none bg-transparent border-0 p-0 cursor-pointer tabular-nums underline decoration-dotted underline-offset-4 hover:text-white ${className}`}
        aria-label={`${props.nhan ?? giaTri} — ${ten}. Bấm để xem danh sách`}>{props.nhan ?? giaTri}</button>
      {props.id !== undefined
        ? <DanhSachSoLieu id={props.id} giaTri={giaTri} phamVi={props.phamVi} extra={props.extra} open={open} onClose={() => setOpen(false)} />
        : <DanhSachNguon nguon={props.nguon} tieuDe={props.tieuDe} open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

function DanhSachNguon({ nguon, tieuDe, open, onClose }: { nguon: string; tieuDe: string; open: boolean; onClose: () => void }) {
  const { data, loading, error, reload } = useApi<{ n: number; tieuDe: string; rows: DongSoLieu[] }>(open ? nguon : null, [nguon, open]);
  if (!open) return null;
  return (
    <KhungPanel tieuDe={data?.tieuDe ?? tieuDe} onDong={onClose} ngCanh="Đúng những mục tạo nên con số vừa bấm">
      <div className="pt-3">
        {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
          : loading || !data ? <Skeleton rows={5} />
          : !data.rows.length ? <Empty title="Không có mục nào" />
          : <DongDanhSach rows={data.rows} onPick={onClose} />}
      </div>
    </KhungPanel>
  );
}
