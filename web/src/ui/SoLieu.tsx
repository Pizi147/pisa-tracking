import { useState } from 'react';
import { Link } from 'react-router-dom';
import { METRIC_UNIT_LABEL, metricById, type ChiSo } from '@shared/domain/index.ts';
import { useApi } from '../lib/useApi.ts';
import { Drawer } from './Drawer.tsx';
import { Empty, ErrorState, Skeleton } from './ui.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';

const THOI_GIAN_NHAN: Record<ChiSo['thoiGian'], string> = {
  'hien-trang': 'Hiện trạng — tính tại ngày dữ liệu',
  'phat-sinh-trong-ky': 'Phát sinh trong kỳ',
  'ket-qua-trong-ky': 'Kết quả trong kỳ',
};

type Drill = {
  id: string; unit: ChiSo['donVi']; n: number; numerator: number | null;
  empty: boolean; note: string | null; today: string;
  rows?: { id: number; title: string; sub: string; href: string }[];
};

/**
 * MỖI CON SỐ TỰ GIẢI THÍCH ĐƯỢC (hợp đồng số liệu §3).
 *
 *   <SoLieu id="hv-co-case-mo" giaTri={18} phamVi={{ branchId: 1 }} />
 *
 * Hiển thị: số + tên + đơn vị. Hai hành vi bắt buộc:
 *   · "Cách tính" → đọc THẲNG từ sổ chỉ số (`ChiSo`): câu hỏi, tập đủ điều kiện, quy tắc khử trùng,
 *     mốc thời gian, ngày dữ liệu. Không có chữ giải thích nào nằm riêng trong component này.
 *   · Bấm số → panel bên phải `{n} {đơn vị} — {tên}`, danh sách đúng TẬP ID sinh ra con số (cùng hàm,
 *     cùng quyền, cùng bộ lọc), có đường quay lại.
 *
 * CẤM hiển thị một con số dashboard ngoài `<SoLieu>`: mã không có trong sổ thì KHÔNG vẽ số, để một
 * con số không có định nghĩa không lọt lên màn hình.
 */
export function SoLieu({ id, giaTri, phamVi, rong, className = '', extra }: {
  id: string;
  giaTri: number;
  phamVi?: { branchId?: number | null };
  /** Phạm vi rỗng: ghi `Không có dữ liệu trong phạm vi` thay vì một số 0 trơn. */
  rong?: boolean;
  className?: string;
  /**
   * Tham số lọc thêm cho MỘT LÁT của chỉ số (ví dụ một loại biện pháp cụ thể của `bien-phap-theo-loai`).
   * Phải truyền Y HỆT tham số đã dùng để tính `giaTri` — nếu không số và danh sách khi bấm sẽ lệch nhau.
   */
  extra?: Record<string, string>;
}) {
  const cs = metricById(id);
  const { homNay, ngan } = useNgayNghiepVu();
  const [open, setOpen] = useState(false);
  const [howTo, setHowTo] = useState(false);
  const branch = phamVi?.branchId ?? null;
  const extraQs = extra ? Object.entries(extra).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join('') : '';
  const qs = `rows=1${branch ? `&branchId=${branch}` : ''}${extraQs}`;
  const { data, loading, error, reload } = useApi<Drill>(open && cs ? `/metrics/${id}?${qs}` : null, [id, open, branch, extraQs]);

  if (!cs) {
    return <span className="text-xs text-rose-300">Chỉ số không có trong sổ: {id}</span>;
  }
  const dv = METRIC_UNIT_LABEL[cs.donVi];
  const clickable = giaTri > 0;
  const cachTinh = (
    <div className="text-[11px] text-slate-400 leading-relaxed space-y-1">
      <div><strong className="text-slate-300">Câu hỏi:</strong> {cs.cauHoi}</div>
      <div><strong className="text-slate-300">Tập đủ điều kiện:</strong> {cs.tapDuDieuKien}</div>
      <div><strong className="text-slate-300">Khử trùng:</strong> {cs.khuTrung}</div>
      <div><strong className="text-slate-300">Thời gian:</strong> {THOI_GIAN_NHAN[cs.thoiGian]}</div>
      <div><strong className="text-slate-300">Dữ liệu đến:</strong> {ngan(homNay)}</div>
    </div>
  );

  return (
    <div className={`card p-4 h-full ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{cs.ten}</div>
        <button type="button" onClick={() => setHowTo(!howTo)} aria-expanded={howTo}
          className="appearance-none bg-transparent border-0 p-0 cursor-pointer text-[11px] text-slate-500 hover:text-slate-300 whitespace-nowrap"
          title={`${cs.cauHoi} — ${cs.tapDuDieuKien}`}>
          Cách tính
        </button>
      </div>

      <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
        {clickable ? (
          <button type="button" onClick={() => setOpen(true)}
            className="appearance-none bg-transparent border-0 p-0 cursor-pointer text-2xl font-semibold tabular-nums text-slate-100 underline decoration-dotted underline-offset-4 hover:text-white"
            aria-label={`${giaTri} ${dv} — ${cs.ten}. Bấm để xem danh sách`}>
            {giaTri}
          </button>
        ) : (
          <span className="text-2xl font-semibold tabular-nums text-slate-500">{giaTri}</span>
        )}
        <span className="text-xs text-slate-400">{dv}</span>
      </div>
      {(rong || giaTri === 0) && (
        <div className="text-[11px] text-slate-500 mt-1">{rong ? 'Không có dữ liệu trong phạm vi' : 'Không có mục nào'}</div>
      )}

      {howTo && <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>{cachTinh}</div>}

      <Drawer open={open} onClose={() => setOpen(false)}
        title={`${data ? data.n : giaTri} ${dv} — ${cs.ten}`}
        subtitle="Đúng những mục tạo nên con số vừa bấm">
        <div className="mb-3">{cachTinh}</div>
        {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
          : loading || !data ? <Skeleton rows={5} />
          : data.empty ? <Empty title="Không có dữ liệu trong phạm vi" />
          : !data.rows?.length ? <Empty title={`Không có ${dv} nào trong tập này`} />
          : (
            <ul className="list-none p-0 m-0 space-y-1.5">
              {data.rows.map((r) => (
                <li key={r.id}>
                  <Link to={r.href} onClick={() => setOpen(false)}
                    className="block rounded-lg border px-3 py-2 no-underline hover:brightness-125"
                    style={{ borderColor: 'var(--line)' }}>
                    <span className="block text-sm text-slate-100">{r.title}</span>
                    {r.sub && <span className="block text-[11px] text-slate-500 mt-0.5">{r.sub}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
      </Drawer>
    </div>
  );
}
