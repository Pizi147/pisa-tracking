import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useThamSoUrl } from '../../lib/quayLai.ts';
import { Card, Info, Skeleton } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { DUONG_TAB_TEST, boMonLich, tenMonNgan, thamSoCt, tuanLich, type ChuongTrinh } from '@shared/domain/index.ts';

/**
 * LỊCH SẮP TỚI (PR-Pa, §3.2; trước đây 'Sự kiện nổi bật') — khối nhỏ trên Tổng quan.
 *
 * Thay cho "Mốc của lớp" cũ, vốn nằm lẫn trong danh sách việc cần làm. Một chuyện SẮP XẢY RA
 * không phải một việc đang nợ: để chung thì danh sách việc lúc nào cũng dài, và cái gì cũng
 * đỏ thì không cái nào đỏ nữa.
 *
 * Ba tuần, xem một tuần một lúc. Chương trình đang chọn (`ct`) chỉ hiện lượt của khung mình.
 *
 * KHÔNG có nhãn đỏ ở đây — sự kiện chưa đến thì không quá hạn được.
 */

type ClassRow = { id: number; code: string; students: number; programme: string | null };
type MockRow = { id: number | null; code: string; students: number; attemptNo: number | null };
export type Week = {
  weekStart: string; code: string; range: string; offset: number;
  normal: { progressClasses: ClassRow[]; finalClasses: ClassRow[]; endingClasses: ClassRow[] };
  ft: { mockClasses: MockRow[]; mockStudents: number; examStudents: number };
};
export type Data = {
  weeks: Week[];
  examMonthOnly: { months: string[]; students: number };
  scopeEmpty: boolean;
};

/**
 * OV-6a (mockup overhaul-3 §1, D1): MỘT TUẦN MỘT LÚC (ba tab), MỖI LỚP MỘT DÒNG, các lượt là chip — vẫn thấy từng lượt, không gộp mất.
 * Tối đa 5 lớp, còn lại "+ n lớp" mở tại chỗ. Cùng `/highlights` (thêm mã chương trình cho cột môn lớp thường).
 */
type Chip = { chu: string; so: number | null; den?: string };
type DongLop = { key: string; id: number | null; code: string; mon: string; chip: Chip[]; soEm: number };
const TOI_DA = 5;

/** Mã chương trình → ký hiệu môn ngắn (`L R W S`); FT dùng 4 kỹ năng đánh giá. */
const chuMon = (ct: string | null) => boMonLich(ct).map((k) => tenMonNgan(ct, k)).join(' ');

/** Gom các lượt của một tuần theo lớp (thứ tự mã lớp). `hienFt`/`hienThuong`: khung đang chọn. */
function gomTheoLop(w: Week, hienFt: boolean, hienThuong: boolean): DongLop[] {
  const lop = new Map<string, DongLop>();
  const lay = (id: number | null, code: string, ct: string | null) => {
    const key = id === null ? `?${code}` : String(id);
    let d = lop.get(key);
    if (!d) lop.set(key, d = { key, id, code, mon: chuMon(ct), chip: [], soEm: 0 });
    return d;
  };
  if (hienFt) {
    for (const m of [...w.ft.mockClasses].sort((a, b) => (a.attemptNo ?? 0) - (b.attemptNo ?? 0))) {
      const d = lay(m.id, m.code, 'FT');
      d.chip.push({ chu: m.attemptNo !== null ? `MT${m.attemptNo}` : 'MT', so: m.students });
      d.soEm += m.students;
    }
  }
  if (hienThuong) {
    for (const r of w.normal.progressClasses) { const d = lay(r.id, r.code, r.programme); d.chip.push({ chu: 'Progress', so: r.students }); d.soEm += r.students; }
    for (const r of w.normal.finalClasses) { const d = lay(r.id, r.code, r.programme); d.chip.push({ chu: 'Final', so: r.students }); d.soEm += r.students; }
    for (const r of w.normal.endingClasses) lay(r.id, r.code, r.programme).chip.push({ chu: 'Hết khoá', so: null, den: `/hoc-vien/lop/${r.id}?viec=chuyen-tiep` });
  }
  return [...lop.values()].sort((a, b) => a.code.localeCompare(b.code, 'vi', { numeric: true }));
}

/** `ct = null`: giáo viên xem lịch gộp hai khung (Q2). */
export function LichSapToi({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh | null }) {
  const { homNay } = useNgayNghiepVu();
  const hep = useDienThoai();
  const [tab, setTab] = useThamSoUrl('lich-tuan', '0');   // PR-OV5b: tab tuần trên URL — Quay lại về đúng tuần
  const [moHet, setMoHet] = useState(false);
  const { data, loading } = useApi<Data | null>(
    `/highlights?${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}`.replace(/\?&/, '?'), [branchId, ct],
  );
  if (loading) return <Card title="Lịch sắp tới"><Skeleton rows={3} /></Card>;
  if (!data || data.scopeEmpty || !data.weeks.length) return null;

  const hienThuong = ct !== 'ft';
  const hienFt = ct !== 'thuong';
  const theoTuan = data.weeks.map((w) => gomTheoLop(w, hienFt, hienThuong));
  const i = Math.min(Number(tab), data.weeks.length - 1);
  const w = data.weeks[i];
  const dong = theoTuan[i];
  const thi = hienFt ? w.ft.examStudents : 0;
  const hien = moHet ? dong : dong.slice(0, TOI_DA);
  const conLai = dong.length - hien.length;
  const maTuan = (x: Week) => tuanLich(x.weekStart, homNay);
  const nhanTab = (x: Week) => (x.offset === 0 ? (hep ? 'Tuần này' : `Tuần này · ${maTuan(x)}`)
    : x.offset === 1 ? (hep ? 'Tuần sau' : `Tuần sau · ${maTuan(x)}`) : maTuan(x));
  const q = new URLSearchParams({ tuan: w.weekStart });
  if (branchId) q.set('cn', String(branchId));
  if (ct) q.set('loai', ct);
  const xemHet = <Link to={`${DUONG_TAB_TEST['ke-hoach']}?${q}`} className="link inline-flex items-center whitespace-nowrap text-xs max-sm:min-h-[44px]">Xem toàn bộ lịch ›</Link>;
  const chuaRo = hienFt && data.examMonthOnly.students > 0;

  return (
    <Card title="Lịch sắp tới" bodyClass="p-0" action={hep ? undefined : xemHet}>
      <div className="px-2 pt-1">
        <HangTab cap="con" ariaLabel="Tuần" value={String(i)} onChange={(k) => { setTab(k); setMoHet(false); }}
          tabs={data.weeks.map((x, j) => ({ key: String(j), label: nhanTab(x), so: theoTuan[j].reduce((n, d) => n + d.soEm, 0) }))} />
      </div>
      {!dong.length ? (
        <p className="m-0 px-4 py-3 text-sm text-slate-400">Không có đợt Test nào trong tuần này.</p>
      ) : (
        <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>
          {hien.map((d) => (
            <li key={d.key} className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-3 px-4 py-2 text-sm sm:grid-cols-[7rem_minmax(0,1fr)_auto]" style={{ borderColor: 'var(--line)' }}>
              {d.id !== null
                ? <Link to={`/hoc-vien/lop/${d.id}`} className="truncate font-semibold text-slate-200 no-underline hover:underline max-sm:py-3 max-sm:-my-3">{d.code}</Link>
                : <b className="truncate font-semibold text-slate-200">{d.code}</b>}
              <span className="flex min-w-0 flex-wrap gap-1.5">
                {d.chip.map((c) => {
                  const noiDung = <>{c.chu}{c.so !== null && <i className="not-italic text-slate-500">· <span className="tabular-nums">{c.so}</span><span className="max-sm:hidden"> em</span></i>}</>;
                  const cls = 'inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-md border px-[7px] text-xs text-slate-300';
                  return c.den
                    ? <Link key={c.chu} to={c.den} className={`${cls} no-underline hover:underline`} style={{ borderColor: 'var(--line-strong)' }}>{noiDung}</Link>
                    : <span key={c.chu} className={cls} style={{ borderColor: 'var(--line-strong)' }}>{noiDung}</span>;
                })}
              </span>
              <span className="whitespace-nowrap text-xs text-slate-500 max-sm:hidden">{d.mon}</span>
            </li>
          ))}
        </ul>
      )}
      {(conLai > 0 || thi > 0 || chuaRo || hep) && (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t px-4 py-2 text-xs text-slate-500" style={{ borderColor: 'var(--line)' }}>
          {conLai > 0 && <button type="button" className="link min-h-[44px] sm:min-h-0" onClick={() => setMoHet(true)}>+ {conLai} lớp</button>}
          {conLai > 0 && thi > 0 && <span aria-hidden>·</span>}
          {thi > 0 && <span>Dự kiến thi IELTS · <b className="tabular-nums font-semibold text-slate-300">{thi} em</b></span>}
          <span className="flex-1" />
          {/*
            CHỈ BIẾT THÁNG THÌ KHÔNG XẾP VÀO TUẦN NÀO (mục 3.5) — nói thẳng là chưa xác định tuần, không lặng lẽ xếp vào tuần đầu tháng.
          */}
          {chuaRo && (
            <span><Info>Chưa xác định tuần</Info>{' '}
              {data.examMonthOnly.students} em ({data.examMonthOnly.months.map(monthLabel).join(', ')})</span>
          )}
          {hep && xemHet}
        </div>
      )}
    </Card>
  );
}
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
function monthLabel(m: string): string {
  const [y, mm] = m.split('-');
  return MONTHS.includes(mm) ? `tháng ${Number(mm)}/${y}` : m;
}
