import { useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { METRIC_UNIT_LABEL, metricById, nhanQuaHan, thamSoCt, type ChiSo, type ChuongTrinh } from '@shared/domain/index.ts';
import { useApi } from '../lib/useApi.ts';
import { KhungPanel } from './KhungPanel.tsx';
import { Empty, ErrorState, Skeleton } from './ui.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';

const THOI_GIAN_NHAN: Record<ChiSo['thoiGian'], string> = {
  'hien-trang': 'Hiện trạng — tính tại ngày dữ liệu',
  'phat-sinh-trong-ky': 'Phát sinh trong kỳ',
  'ket-qua-trong-ky': 'Kết quả trong kỳ',
};

export type PhamViSoLieu = { branchId?: number | null; chuongTrinh?: ChuongTrinh | null };
/** PR-VAI-a (Q26): dòng Case/PA có người phụ trách + hạn — panel ghi "người · quá hạn n ngày". */
export type DongSoLieu = { id: number; title: string; sub: string; href: string; nguoi?: string | null; han?: string | null };

type Drill = {
  id: string; unit: ChiSo['donVi']; n: number; numerator: number | null;
  empty: boolean; note: string | null; today: string;
  rows?: DongSoLieu[];
};

/** Tham số truy vấn của một lần mở danh sách — Y HỆT tham số đã dùng để tính con số. */
export function qsSoLieu(phamVi?: PhamViSoLieu, extra?: Record<string, string>): string {
  const b = phamVi?.branchId ?? null;
  const ex = extra ? Object.entries(extra).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join('') : '';
  return `rows=1${b ? `&branchId=${b}` : ''}${thamSoCt(phamVi?.chuongTrinh ?? null)}${ex}`;
}

/** Hộp "Cách tính" — chữ đọc thẳng từ sổ; nhãn theo THUAT_NGU g12-021/022. */
function CachTinh({ cs }: { cs: ChiSo }) {
  const { homNay, ngan } = useNgayNghiepVu();
  return (
    <div className="text-[11px] text-slate-400 leading-relaxed space-y-1">
      <div><strong className="text-slate-300">Chỉ số:</strong> {cs.cauHoi}</div>
      <div><strong className="text-slate-300">Đối tượng tính:</strong> {cs.tapDuDieuKien}</div>
      <div><strong className="text-slate-300">Không đếm trùng:</strong> {cs.khuTrung}</div>
      <div><strong className="text-slate-300">Thời gian:</strong> {THOI_GIAN_NHAN[cs.thoiGian]}</div>
      <div><strong className="text-slate-300">Dữ liệu đến:</strong> {ngan(homNay)}</div>
    </div>
  );
}

/** Người giữ việc · hạn của một dòng panel — 12 px (Q31-4); quá hạn nói bằng chữ. */
function DongNguoiHan({ nguoi, han }: { nguoi: string | null; han: string | null }) {
  const { homNay, ngan } = useNgayNghiepVu();
  const tre = han && han.slice(0, 10) < homNay ? Math.round((Date.parse(homNay) - Date.parse(han.slice(0, 10))) / 86_400_000) : 0;
  return (
    <span className="mt-0.5 block text-xs tabular-nums text-slate-400">
      {nguoi ?? 'chưa có người phụ trách'}
      {han && (tre > 0 ? <span className="font-semibold text-late"> · {nhanQuaHan(tre)}</span> : <> · hạn {ngan(han)}</>)}
    </span>
  );
}

export function DongDanhSach({ rows, onPick }: { rows: DongSoLieu[]; onPick?: () => void }) {
  return (
    <ul className="list-none p-0 m-0 space-y-1.5">
      {rows.map((r) => (
        <li key={r.id}>
          <Link to={r.href} onClick={onPick} className="block rounded-lg border px-3 py-2 no-underline hover:brightness-125"
            style={{ borderColor: 'var(--line)' }}>
            <span className="block text-sm text-slate-100">{r.title}</span>
            {r.sub && <span className="block text-[11px] text-slate-500 mt-0.5">{r.sub}</span>}
            {(r.nguoi || r.han) && <DongNguoiHan nguoi={r.nguoi ?? null} han={r.han ?? null} />}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Panel "{n} {đơn vị} — {tên}": đúng tập ID sinh ra con số (cùng hàm, cùng quyền, cùng bộ lọc). */
export function DanhSachSoLieu({ id, giaTri, phamVi, extra, open, onClose }: {
  id: string; giaTri: number; phamVi?: PhamViSoLieu; extra?: Record<string, string>; open: boolean; onClose: () => void;
}) {
  const cs = metricById(id);
  const qs = qsSoLieu(phamVi, extra);
  const { data, loading, error, reload } = useApi<Drill>(open && cs ? `/metrics/${id}?${qs}` : null, [id, open, qs]);
  if (!cs || !open) return null;
  const dv = METRIC_UNIT_LABEL[cs.donVi];
  return (
    <KhungPanel tieuDe={`${data ? data.n : giaTri} ${dv} — ${cs.ten}`} onDong={onClose}
      ngCanh="Đúng những mục tạo nên con số vừa bấm">
      <div className="mb-3 pt-3"><CachTinh cs={cs} /></div>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : loading || !data ? <Skeleton rows={5} />
        : data.empty ? <Empty title="Không có dữ liệu trong phạm vi" />
        : !data.rows?.length ? <Empty title={`Không có ${dv} nào trong tập này`} />
        : <DongDanhSach rows={data.rows} onPick={onClose} />}
    </KhungPanel>
  );
}

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
export function SoLieu({ id, giaTri, phamVi, rong, className = '', extra, nhan, phu, tone }: {
  id: string; giaTri: number; phamVi?: PhamViSoLieu; rong?: boolean; className?: string; extra?: Record<string, string>;
  /** Nhãn hiện ở ô khi khác tên trong sổ (plan PR-Pa Q20). "Cách tính" vẫn ghi tên trong sổ. */
  nhan?: string;
  /** Một dòng phụ dưới số (G-3). */
  phu?: ReactNode;
  tone?: 'danger' | 'warn';
}) {
  const cs = metricById(id);
  const [open, setOpen] = useState(false);
  const [howTo, setHowTo] = useState(false);
  const idCachTinh = useId();
  if (!cs) return <span className="text-xs text-bad">Chỉ số không có trong sổ: {id}</span>;
  const dv = METRIC_UNIT_LABEL[cs.donVi];
  const clickable = giaTri > 0;
  const mau = tone === 'danger' ? 'text-bad' : tone === 'warn' ? 'text-soon' : 'text-slate-100';
  return (
    <div className={`card p-4 h-full ${className}`}>
      <div className="relative flex items-start justify-between gap-2">
        <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{nhan ?? cs.ten}</div>
        {/* PR-VAI-a (K1-08): "Cách tính" là chú thích NỔI — rê chuột, Tab hoặc bấm; Esc đóng. Không đẩy giãn hàng ô. */}
        <span className="shrink-0" onMouseEnter={() => setHowTo(true)} onMouseLeave={() => setHowTo(false)}>
          {/* Bấm chỉ MỞ: chạm trên điện thoại phát mouseenter → focus → click, đảo trạng thái thì vừa mở đã đóng. Đóng: Esc, rời chuột, mất focus. */}
          <button type="button" onClick={() => setHowTo(true)} aria-expanded={howTo} aria-describedby={howTo ? idCachTinh : undefined}
            onFocus={() => setHowTo(true)} onBlur={() => setHowTo(false)}
            onKeyDown={(e) => { if (e.key === 'Escape' && howTo) { e.stopPropagation(); setHowTo(false); } }}
            className="appearance-none bg-transparent border-0 p-0 max-sm:py-3 max-sm:-my-3 cursor-pointer text-[11px] text-slate-500 hover:text-slate-300 whitespace-nowrap">Cách tính</button>
          {howTo && (
            <div id={idCachTinh} role="tooltip" className="card absolute right-0 top-full z-30 mt-1.5 w-[min(20rem,calc(100vw-2.5rem))] p-3 shadow-2xl">
              <CachTinh cs={cs} />
            </div>
          )}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
        {clickable ? (
          <button type="button" onClick={() => setOpen(true)}
            className={`appearance-none bg-transparent border-0 p-0 max-sm:py-1.5 max-sm:-my-1.5 cursor-pointer text-2xl font-semibold tabular-nums underline decoration-dotted underline-offset-4 hover:text-white ${mau}`}
            aria-label={`${giaTri} ${dv} — ${nhan ?? cs.ten}. Bấm để xem danh sách`}>{giaTri}</button>
        ) : (
          <span className="text-2xl font-semibold tabular-nums text-slate-500">{giaTri}</span>
        )}
        <span className="text-xs text-slate-400">{dv}</span>
      </div>
      {phu ? <div className="text-[11px] text-slate-500 mt-1">{phu}</div>
        : (rong || giaTri === 0) && <div className="text-[11px] text-slate-500 mt-1">{rong ? 'Không có dữ liệu trong phạm vi' : 'Không có mục nào'}</div>}
      <DanhSachSoLieu id={id} giaTri={giaTri} phamVi={phamVi} extra={extra} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
