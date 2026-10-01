import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Info, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { thamSoCt, tuanLich, type ChuongTrinh } from '@shared/domain/index.ts';

/**
 * LỊCH SẮP TỚI (PR-Pa, §3.2; trước đây 'Sự kiện nổi bật') — khối nhỏ trên Tổng quan.
 *
 * Thay cho "Mốc của lớp" cũ, vốn nằm lẫn trong danh sách việc cần làm. Một chuyện SẮP XẢY RA
 * không phải một việc đang nợ: để chung thì danh sách việc lúc nào cũng dài, và cái gì cũng
 * đỏ thì không cái nào đỏ nữa.
 *
 * Ba tuần, chọn một lần một. Lớp thường và FT đứng hai cột riêng vì hai loại lớp có hai loại sự
 * kiện; chương trình đang chọn (`ct`) chỉ hiện cột của mình. Bấm một con số là mở đúng danh sách tạo ra con số đó.
 *
 * KHÔNG có nhãn đỏ ở đây — sự kiện chưa đến thì không quá hạn được.
 */

type ClassRow = { id: number; code: string; students: number };
type MockRow = { id: number | null; code: string; students: number; attemptNo: number | null };
type Week = {
  weekStart: string; code: string; range: string; offset: number;
  normal: { progressClasses: ClassRow[]; finalClasses: ClassRow[]; endingClasses: ClassRow[] };
  ft: { mockClasses: MockRow[]; mockStudents: number; examStudents: number };
};
type Data = {
  weeks: Week[];
  examMonthOnly: { months: string[]; students: number };
  scopeEmpty: boolean;
};

/**
 * PR-VAI-a (mockup 23 màn B): danh sách PHẲNG theo khung đang chọn — mỗi dòng một đợt Test: mã tuần · bài · lớp · số em. Không còn ba tab
 * tuần; khối nhỏ ở tầng 3, đọc lướt. Cùng `/highlights` với trước (không đếm thêm gì).
 */
type DongLich = { tuan: string; tuanNay: boolean; chu: string; den: string | null; key: string };

/** `ct = null`: giáo viên xem lịch gộp hai khung (Q2). */
export function LichSapToi({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh | null }) {
  const { homNay } = useNgayNghiepVu();
  const { data, loading } = useApi<Data | null>(
    `/highlights?${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}`.replace(/\?&/, '?'), [branchId, ct],
  );
  if (loading) return <Card title="Lịch sắp tới"><Skeleton rows={3} /></Card>;
  if (!data || data.scopeEmpty) return null;

  const hienThuong = ct !== 'ft';
  const hienFt = ct !== 'thuong';
  const dong: DongLich[] = [];
  for (const w of data.weeks) {
    const tuan = tuanLich(w.weekStart, homNay);
    const tuanNay = w.offset === 0;
    const them = (chu: string, den: string | null, key: string) => dong.push({ tuan, tuanNay, chu, den, key: `${w.weekStart}-${key}` });
    if (hienFt) {
      w.ft.mockClasses.forEach((m, i) => them(`${m.attemptNo !== null ? `MT${m.attemptNo} · ` : 'MT · '}${m.code} · ${m.students} em`, m.id ? `/hoc-vien/lop/${m.id}` : null, `mt${i}`));
      if (w.ft.examStudents) them(`Dự kiến thi IELTS · ${w.ft.examStudents} em`, null, 'thi');
    }
    if (hienThuong) {
      for (const r of w.normal.progressClasses) them(`Giữa khoá · ${r.code} · ${r.students} em`, `/hoc-vien/lop/${r.id}`, `g${r.id}`);
      for (const r of w.normal.finalClasses) them(`Cuối khoá · ${r.code} · ${r.students} em`, `/hoc-vien/lop/${r.id}`, `c${r.id}`);
      for (const r of w.normal.endingClasses) them(`Hết khoá · ${r.code} · chuẩn bị chuyển lớp`, `/hoc-vien/lop/${r.id}?viec=chuyen-tiep`, `h${r.id}`);
    }
  }

  return (
    <Card title="Lịch sắp tới" bodyClass="p-0">
      {!dong.length ? (
        <p className="m-0 px-4 py-3 text-sm text-slate-400">Không có đợt Test nào trong ba tuần tới.</p>
      ) : (
        <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>
          {dong.map((x) => (
            <li key={x.key} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-3 px-4 py-2 text-sm">
              <b className="tabular-nums font-semibold text-slate-200">{x.tuan}</b>
              <span className="min-w-0 text-slate-300">
                {x.den ? <Link to={x.den} className="text-slate-200 no-underline hover:underline">{x.chu}</Link> : x.chu}
                {x.tuanNay && <span className="ml-1.5 text-xs text-slate-500">tuần này</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {/*
        CHỈ BIẾT THÁNG THÌ KHÔNG XẾP VÀO TUẦN NÀO (mục 3.5) — nói thẳng là chưa xác định tuần, không lặng lẽ xếp vào tuần đầu tháng.
      */}
      {hienFt && data.examMonthOnly.students > 0 && (
        <p className="m-0 border-t px-4 py-2.5 text-xs text-slate-500" style={{ borderColor: 'var(--line)' }}>
          <Info>Chưa xác định tuần</Info>{' '}
          {data.examMonthOnly.students} học viên mới có dự kiến thi theo tháng ({data.examMonthOnly.months.map(monthLabel).join(', ')}).
        </p>
      )}
    </Card>
  );
}
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
function monthLabel(m: string): string {
  const [y, mm] = m.split('-');
  return MONTHS.includes(mm) ? `tháng ${Number(mm)}/${y}` : m;
}
