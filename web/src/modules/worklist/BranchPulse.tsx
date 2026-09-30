import { Fragment, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { BoLocDoan, Card, Empty, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { DINH_TRAI } from '../phanTich/dungChung.tsx';
import { thamSoCt, type ChuongTrinh, type CotBang } from '@shared/domain/index.ts';

/**
 * BẢNG "THEO CHI NHÁNH" (PR-Pa §3.2, mockup 02 phương án A).
 *
 * Bảng này trả lời CHI NHÁNH / LỚP NÀO ĐANG TẮC Ở ĐÂU. Chưa chọn chi nhánh: mỗi hàng là một chi nhánh, bấm ▸ mở xuống
 * từng lớp; đã chọn: mỗi hàng là một lớp, hàng tổng "Cả <chi nhánh>" đứng đầu. Sáu cột đều là chỉ số của sổ, số nào
 * cũng bấm được và mở đúng danh sách tạo ra nó (`/tong-quan/chi-nhanh/o`, G-10). Các cột cũ "PA học thuật cần cập
 * nhật / Đề xuất chờ duyệt" nay nằm ở ô số đầu trang và khối Cần xử lý, không lặp lại ở đây.
 *
 * Bảng THEO GIÁO VIÊN (`BangTheoGiaoVien`) giữ nguyên từ bản trước, chỉ hiện khi bảng đang ở chế độ LỚP — tức đã chọn
 * một chi nhánh, hoặc QL chỉ có một chi nhánh nên server tự khoanh (Q10 — giữ tạm tới PR-GV). Nó KHÔNG tô màu tốt/xấu
 * và KHÔNG xếp hạng. Một bảng "giáo viên nào chậm nhất" là thứ ai cũng hiểu ngay và không ai muốn bị đưa vào — nó biến
 * công cụ điều phối thành công cụ đánh giá, và người ta sẽ học cách làm đẹp số thay vì làm việc.
 */

type OBang = { n: number; mau?: number };
type Hang = { khoa: string; id: number; loai: 'chi-nhanh' | 'lop'; nhan: string; laFt: boolean | null; o: Record<CotBang, OBang>; lop?: Hang[] };
type Bang = { cheDo: 'chi-nhanh' | 'lop'; hang: Hang[]; tong: Record<CotBang, OBang>; tenChiNhanh: string | null; branchId: number | null };

const COT: { key: CotBang; nhan: (ct: ChuongTrinh) => string; goiY: string }[] = [
  { key: 'hocVien', nhan: () => 'Học viên', goiY: 'Học viên đang học, không tính em đã kết thúc.' },
  { key: 'duoiKyVong', nhan: (ct) => (ct === 'thuong' ? 'Chưa đạt' : 'Dưới kỳ vọng'),
    goiY: 'Học viên dưới kỳ vọng ít nhất một kỹ năng ở đợt Test mới nhất hợp lệ (lớp thường: chưa đạt ít nhất một môn).' },
  { key: 'sos', nhan: () => 'SOS', goiY: 'Học viên có SOS ở đợt Test mới nhất hợp lệ, kể cả SOS tạm thời.' },
  { key: 'caseMo', nhan: () => 'Case mở', goiY: 'Case học thuật chưa kết luận — đếm Case, không đếm học viên.' },
  { key: 'thieuPa', nhan: () => 'Thiếu PA học thuật', goiY: 'Case đã mở nhưng chưa ai ghi sẽ làm gì cho em.' },
  { key: 'duDuLieu', nhan: () => 'Đủ dữ liệu đánh giá', goiY: 'Em đã chấm đủ mọi kỹ năng ở đợt đã đến lịch mới nhất / em cần được đánh giá.' },
];
/** Mọi hàng thân bảng cao bằng nhau (G-2): nhãn FT / Lớp thường 11px không được nâng hàng lớp cao hơn hàng tổng. */
const HANG = '2.5rem';

export function BranchPulse({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh }) {
  const navigate = useNavigate();
  const q = `${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}`.replace(/^&/, '');
  const { data, loading, error, reload } = useApi<Bang>(q ? `/tong-quan/chi-nhanh?${q}` : '/tong-quan/chi-nhanh', [branchId, ct]);
  const [mo, setMo] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'lop' | 'gv'>('lop');
  const tieuDeTam = branchId ? 'Theo lớp' : 'Theo chi nhánh';   // tiêu đề trung tính khi chưa có dữ liệu, tránh nhấp nháy
  if (error) return <Card title={tieuDeTam}><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></Card>;
  if (loading) return <Card title={tieuDeTam}><Skeleton rows={3} /></Card>;
  if (!data) return null;
  const coGv = data.cheDo === 'lop';                            // Q10 — giữ tạm tới PR-GV; QL một chi nhánh không có `cn` trên URL, server tự khoanh phạm vi
  const o = (h: { khoa: string; nhan: string }, c: CotBang, x: OBang) => (
    <td key={c} className="td text-right tabular-nums">
      <SoLieuO giaTri={x.n} tieuDe={`${COT.find((k) => k.key === c)!.nhan(ct)} · ${h.nhan}`}
        nguon={`/tong-quan/chi-nhanh/o?cot=${c}&khoa=${h.khoa}${q ? `&${q}` : ''}`} />
      {c === 'duDuLieu' && <span className="text-slate-500">/{x.mau ?? 0}</span>}
    </td>
  );
  const hangTong = (nhan: string) => (
    <tr className="bg-white/5" style={{ height: HANG }}>
      {/* Ô dính phải đục để che nội dung cuộn, nhưng cùng tông với hàng tổng (bg-white/5 trên --surface). */}
      <td className="td sticky-col whitespace-nowrap font-medium text-slate-100"
        style={{ background: 'color-mix(in srgb, var(--surface) 95%, white)' }}>{nhan}</td>
      {COT.map((c) => o({ khoa: 'tong', nhan }, c.key, data.tong[c.key]))}
    </tr>
  );
  const tenLop = (h: Hang) => (
    <span className="whitespace-nowrap">
      <Link to={`/hoc-vien/lop/${h.id}`} className="link">{h.nhan}</Link>
      {ct === 'ca-hai' && h.laFt !== null && <span className="text-[11px] leading-none align-middle text-slate-500 ml-1.5">{h.laFt ? 'FT' : 'Lớp thường'}</span>}
    </span>
  );
  return (
    <Card title={data.cheDo === 'lop' ? `Theo lớp${data.tenChiNhanh ? ` · ${data.tenChiNhanh}` : ''}` : 'Theo chi nhánh'}
      action={coGv ? (
        <BoLocDoan ariaLabel="Cách xem" value={view} onChange={setView}
          muc={[{ key: 'lop', nhan: 'Theo lớp' }, { key: 'gv', nhan: 'Theo giáo viên' }]} />
      ) : undefined}
      bodyClass="p-0">
      {coGv && view === 'gv' ? <BangTheoGiaoVien branchId={data.branchId ?? branchId} /> : (
        <>
        <div className="table-scroll">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '44rem' }}>
            <colgroup><col style={{ width: '26%' }} />{COT.map((c) => <col key={c.key} style={{ width: `${(74 / COT.length).toFixed(1)}%` }} />)}</colgroup>
            <thead><tr>
              <Th className="sticky-col">{data.cheDo === 'lop' ? 'Lớp' : 'Chi nhánh'}</Th>
              {COT.map((c) => <Th key={c.key} align="right" hint={c.goiY}>{c.nhan(ct)}</Th>)}
            </tr></thead>
            <tbody>
              {data.cheDo === 'lop' && hangTong(data.tenChiNhanh ? `Cả ${data.tenChiNhanh}` : 'Cả chi nhánh')}
              {data.hang.map((h) => (
                <Fragment key={h.khoa}>
                  {h.loai === 'chi-nhanh' ? (
                    /* PR-UX4 (Q22, N-2): hàng chi nhánh là hàng lớn, hàng lớp mở xuống là hàng con — cùng component với mọi bảng có mở rộng. */
                    <HangNhom mo={mo.has(h.khoa)} onMo={() => setMo((s) => { const n = new Set(s); n.has(h.khoa) ? n.delete(h.khoa) : n.add(h.khoa); return n; })}
                      nhan={h.nhan} className={DINH_TRAI}
                      tieuDe={(
                        <button type="button" className="link appearance-none bg-transparent border-0 p-0 cursor-pointer font-extrabold"
                          onClick={() => navigate(`/?cn=${h.id}${thamSoCt(ct)}`)}>{h.nhan}</button>
                      )}>
                      {COT.map((c) => o(h, c.key, h.o[c.key]))}
                    </HangNhom>
                  ) : (
                    <tr className="row-hover" style={{ height: HANG }}>
                      <td className="td sticky-col">{tenLop(h)}</td>
                      {COT.map((c) => o(h, c.key, h.o[c.key]))}
                    </tr>
                  )}
                  {h.loai === 'chi-nhanh' && mo.has(h.khoa) && (h.lop ?? []).map((l) => (
                    <HangCon key={l.khoa} className={DINH_TRAI}>
                      <td>{tenLop(l)}</td>
                      {COT.map((c) => o(l, c.key, l.o[c.key]))}
                    </HangCon>
                  ))}
                </Fragment>
              ))}
              {data.cheDo === 'chi-nhanh' && hangTong('Tất cả chi nhánh')}
            </tbody>
          </table>
        </div>
        <p className="m-0 px-4 py-2 text-[11px] text-slate-500 border-t" style={{ borderColor: 'var(--line)' }}>
          {data.cheDo === 'chi-nhanh' ? 'Bấm ▸ để mở ra từng lớp · bấm số để xem danh sách' : 'Bấm số để xem danh sách'}
        </p>
        </>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------ Theo giáo viên (giữ nguyên từ bản trước)

type PersonRow = {
  id: number; name: string; classCount: number;
  mtPending: number; mtOverdue: number;
  cases: number; noPlan: number; overdueUpdate: number; pendingApproval: number;
};
type Pulse = { people: PersonRow[] };

const PEOPLE_COLS: { key: keyof PersonRow; label: string; hint: string }[] = [
  { key: 'mtPending', label: 'MT chưa nhập', hint: 'Ô điểm còn trống ở các lượt MT đã thi.' },
  { key: 'mtOverdue', label: 'MT quá hạn nhập', hint: 'Trong số trên, phần đã qua hạn nhập điểm.' },
  { key: 'cases', label: 'Case phụ trách', hint: 'Case mà người này là NGƯỜI PHỤ TRÁCH chính — không phải mọi case của lớp họ dạy.' },
  { key: 'noPlan', label: 'Thiếu PA học thuật', hint: 'Case chưa ai ghi sẽ làm gì.' },
  { key: 'overdueUpdate', label: 'PA học thuật cần cập nhật', hint: 'Phương án của case người này phụ trách đã qua hạn cập nhật kết quả tuần.' },
  { key: 'pendingApproval', label: 'Đề xuất chờ duyệt', hint: 'Đề xuất của người này đang chờ trả lời.' },
];

/** Bảng theo giáo viên: tự gọi `/branch-pulse`, chỉ dùng `people`. Số ở đây không bấm (giữ nguyên tới PR-GV). */
function BangTheoGiaoVien({ branchId }: { branchId: number | null }) {
  const { data, loading, error, reload } = useApi<Pulse | null>(
    `/branch-pulse${branchId ? `?branchId=${branchId}` : ''}`, [branchId],
  );
  const [pSort, setPSort] = useState<{ col: keyof PersonRow; dir: 'asc' | 'desc' } | null>(null);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading) return <div className="p-4"><Skeleton rows={3} /></div>;
  if (!data) return null;
  if (data.people.length === 0) return <Empty title="Chưa có giáo viên nào trong chi nhánh này" />;

  const num = (n: number) => (
    <span className={`tabular-nums ${n === 0 ? 'text-slate-500' : 'text-slate-100'}`}>{n}</span>
  );
  const pSortOf = (key: keyof PersonRow) => ({
    active: pSort?.col === key,
    dir: (pSort?.col === key ? pSort.dir : 'desc') as 'asc' | 'desc',
    onSort: () => setPSort((x) => (x?.col === key
      ? { col: key, dir: x.dir === 'desc' ? 'asc' : 'desc' }
      : { col: key, dir: 'desc' })),
  });
  const sortedPeople = pSort
    ? [...data.people].sort((a, b) => (pSort.dir === 'desc'
        ? (b[pSort.col] as number) - (a[pSort.col] as number)
        : (a[pSort.col] as number) - (b[pSort.col] as number)))
    : data.people;

  return (
    <>
      <div className="table-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th className="sticky-col">Giáo viên</Th>
              <Th align="right" hint="Số lớp người này dạy trong chi nhánh đang xem."
                sort={pSortOf('classCount')}>Lớp</Th>
              {PEOPLE_COLS.map((c) => (
                <Th key={c.key} align="right" hint={c.hint} sort={pSortOf(c.key)}>{c.label}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedPeople.map((x) => (
              <tr key={x.id}>
                <td className="td sticky-col whitespace-nowrap text-slate-100">{x.name}</td>
                <td className="td text-right">{num(x.classCount)}</td>
                {PEOPLE_COLS.map((c) => (
                  <td key={c.key} className="td text-right">{num(x[c.key] as number)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2.5 text-[11px] text-slate-500 m-0 border-t" style={{ borderColor: 'var(--line)' }}>
        Bảng này để biết <strong>cần nói chuyện với ai</strong>, không phải để xếp hạng — nên
        không có màu tốt/xấu. Số ở đây là việc đang tồn, và tồn vì nhiều lý do khác nhau. Số
        case là case người này <strong>phụ trách</strong>, còn đề xuất chờ duyệt là đề xuất
        <strong> chính họ gửi</strong> — không đếm sang đầu người nhập hộ. Tất cả chỉ tính
        trong chi nhánh đang xem.
      </p>
    </>
  );
}
