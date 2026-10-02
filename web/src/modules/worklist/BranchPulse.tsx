import { Fragment, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { BoLocDoan, Card, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { DINH_TRAI } from '../phanTich/dungChung.tsx';
import { thamSoCt, type ChuongTrinh, type CotBang } from '@shared/domain/index.ts';
import { BangGiaoVienChiNhanh } from '../giaoVien/BangGiaoVienChiNhanh.tsx';

/**
 * BẢNG "THEO CHI NHÁNH" (PR-Pa §3.2, mockup 02 phương án A).
 *
 * Bảng này trả lời CHI NHÁNH / LỚP NÀO ĐANG TẮC Ở ĐÂU. Chưa chọn chi nhánh: mỗi hàng là một chi nhánh, bấm ▸ mở xuống
 * từng lớp; đã chọn: mỗi hàng là một lớp, hàng tổng "Cả <chi nhánh>" đứng đầu. Sáu cột đều là chỉ số của sổ, số nào
 * cũng bấm được và mở đúng danh sách tạo ra nó (`/tong-quan/chi-nhanh/o`, G-10). Các cột cũ "PA học thuật cần cập
 * nhật / Đề xuất chờ duyệt" nay nằm ở ô số đầu trang và khối Cần xử lý, không lặp lại ở đây.
 *
 * Bảng THEO GIÁO VIÊN: `BangGiaoVienChiNhanh` (PR-GV) — chỉ hiện khi bảng đang ở chế độ LỚP (đã chọn một chi nhánh, hoặc QL chỉ có một
 * chi nhánh nên server tự khoanh). KHÔNG tô màu tốt/xấu, KHÔNG xếp hạng, KHÔNG nút sắp xếp: bảng "giáo viên nào chậm nhất" biến công cụ
 * điều phối thành công cụ đánh giá, và người ta sẽ học cách làm đẹp số thay vì làm việc.
 */

type OBang = { n: number; mau?: number };
type Hang = { khoa: string; id: number; loai: 'chi-nhanh' | 'lop'; nhan: string; laFt: boolean | null; o: Record<CotBang, OBang>; lop?: Hang[] };
type Bang = { cheDo: 'chi-nhanh' | 'lop'; hang: Hang[]; tong: Record<CotBang, OBang>; tenChiNhanh: string | null; branchId: number | null };

const COT_DAY_DU: { key: CotBang; nhan: (ct: ChuongTrinh) => string; goiY: string }[] = [
  { key: 'hocVien', nhan: () => 'Học viên', goiY: 'Học viên đang học, không tính em đã kết thúc.' },
  { key: 'duoiKyVong', nhan: (ct) => (ct === 'thuong' ? 'Chưa đạt' : 'Dưới kỳ vọng'),
    goiY: 'Học viên dưới kỳ vọng ít nhất một kỹ năng ở đợt Test mới nhất hợp lệ (lớp thường: chưa đạt ít nhất một môn).' },
  { key: 'sos', nhan: () => 'SOS', goiY: 'Học viên có SOS ở đợt Test mới nhất hợp lệ, kể cả SOS tạm thời.' },
  { key: 'caseMo', nhan: () => 'Case đang mở', goiY: 'Case học thuật chưa kết luận — đếm Case, không đếm học viên.' },
  { key: 'thieuPa', nhan: () => 'Case chưa có PA', goiY: 'Case đã mở nhưng chưa ai ghi sẽ làm gì cho em.' },
  { key: 'duDuLieu', nhan: () => 'Tỷ lệ đủ dữ liệu', goiY: 'Em đã chấm đủ mọi kỹ năng ở đợt đã đến lịch mới nhất / em cần được đánh giá.' },
];
/** PR-LT2a (T58): khung Lớp thường không có cột SOS — số SOS chỉ của Fast Track. */
const cotCua = (ct: ChuongTrinh) => (ct === 'thuong' ? COT_DAY_DU.filter((c) => c.key !== 'sos') : COT_DAY_DU);
/** Mọi hàng thân bảng cao bằng nhau (G-2): nhãn FT / Lớp thường 11px không được nâng hàng lớp cao hơn hàng tổng. */
const HANG = '2.5rem';

export function BranchPulse({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh }) {
  const navigate = useNavigate();
  const q = `${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}`.replace(/^&/, '');
  const { data, loading, error, reload } = useApi<Bang>(q ? `/tong-quan/chi-nhanh?${q}` : '/tong-quan/chi-nhanh', [branchId, ct]);
  const [mo, setMo] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'lop' | 'gv'>('lop');
  const COT = cotCua(ct);
  const tieuDeTam = branchId ? 'Theo lớp' : 'Theo chi nhánh';   // tiêu đề trung tính khi chưa có dữ liệu, tránh nhấp nháy
  if (error) return <Card title={tieuDeTam}><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></Card>;
  if (loading) return <Card title={tieuDeTam}><Skeleton rows={3} /></Card>;
  if (!data) return null;
  const coGv = data.cheDo === 'lop';                            // QL một chi nhánh không có `cn` trên URL, server tự khoanh phạm vi
  const o = (h: { khoa: string; nhan: string }, c: CotBang, x: OBang) => (
    <td key={c} className="td text-right tabular-nums">
      <SoLieuO giaTri={x.n} tieuDe={`${COT.find((k) => k.key === c)!.nhan(ct)} · ${h.nhan}`}
        nguon={`/tong-quan/chi-nhanh/o?cot=${c}&khoa=${h.khoa}${q ? `&${q}` : ''}`} />
      {c === 'duDuLieu' && <span className="text-slate-500">/{x.mau ?? 0}</span>}
    </td>
  );
  const hangTong = (nhan: string) => (
    <tr className="bg-white/5" style={{ height: HANG }}>
      {/* Ô dính phải đục để che nội dung cuộn, nhưng cùng tông với hàng tổng (bg-white/5 = --phu-rgb 5% trên --surface; PR-S4F: không trộn white cứng). */}
      <td className="td sticky-col whitespace-nowrap font-medium text-slate-100"
        style={{ background: 'color-mix(in srgb, var(--surface) 95%, rgb(var(--phu-rgb)))' }}>{nhan}</td>
      {COT.map((c) => o({ khoa: 'tong', nhan }, c.key, data.tong[c.key]))}
    </tr>
  );
  const tenLop = (h: Hang) => (
    <span className="whitespace-nowrap">
      <Link to={`/hoc-vien/lop/${h.id}`} className="link max-sm:py-3 max-sm:-my-3">{h.nhan}</Link>
    </span>
  );
  return (
    <Card title={data.cheDo === 'lop' ? `Theo lớp${data.tenChiNhanh ? ` · ${data.tenChiNhanh}` : ''}` : 'Theo chi nhánh'}
      action={coGv ? (
        <BoLocDoan ariaLabel="Cách xem" value={view} onChange={setView}
          muc={[{ key: 'lop', nhan: 'Theo lớp' }, { key: 'gv', nhan: 'Theo giáo viên' }]} />
      ) : undefined}
      bodyClass="p-0">
      {coGv && view === 'gv' ? <BangGiaoVienChiNhanh branchId={data.branchId ?? branchId} ct={ct} /> : (
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
                        <button type="button" className="link appearance-none bg-transparent border-0 p-0 max-sm:py-3 max-sm:-my-3 cursor-pointer font-extrabold"
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
