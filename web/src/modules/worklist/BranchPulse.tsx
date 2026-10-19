import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useTapUrl, useThamSoUrl } from '../../lib/quayLai.ts';
import { BoLocDoan, Card, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { DINH_TRAI } from '../phanTich/dungChung.tsx';
import { GOI_Y_DUOI_KY_VONG, thamSoCt, type ChuongTrinh, type CotBang } from '@shared/domain/index.ts';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { BangGiaoVienChiNhanh } from '../giaoVien/BangGiaoVienChiNhanh.tsx';
import { nhoChiNhanh } from '../../ui/Filters.tsx';

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
type Bang = { cheDo: 'chi-nhanh' | 'lop'; hang: Hang[]; conLai: Hang | null; tong: Record<CotBang, OBang>; tenChiNhanh: string | null; branchId: number | null };

const COT_DAY_DU: { key: CotBang; nhan: (ct: ChuongTrinh) => string; goiY: string }[] = [
  { key: 'hocVien', nhan: () => 'Học viên', goiY: 'Học viên đang học, không tính em đã kết thúc.' },
  { key: 'duoiKyVong', nhan: (ct) => (ct === 'thuong' ? 'Chưa đạt' : 'Dưới kỳ vọng'),
    goiY: 'Học viên dưới kỳ vọng ít nhất một kỹ năng ở đợt Test mới nhất hợp lệ (lớp thường: chưa đạt ít nhất một môn).' },
  { key: 'sos', nhan: () => 'SOS hiện tại', goiY: 'Học viên có SOS ở lượt Test mới nhất hợp lệ, gồm SOS tạm (lượt chưa chốt). Overall đạt thì không SOS (dù có kỹ năng dưới kỳ vọng).' },
  { key: 'caseMo', nhan: () => 'Case đang mở', goiY: 'Case học thuật chưa kết luận — đếm Case, không đếm học viên.' },
  { key: 'thieuPa', nhan: () => 'Case chưa có PA', goiY: 'Case đã mở nhưng chưa ai ghi sẽ làm gì cho em.' },
  { key: 'duDuLieu', nhan: () => 'Tỷ lệ đủ dữ liệu', goiY: 'Em đã chấm đủ mọi kỹ năng ở đợt đã đến lịch mới nhất / em cần được đánh giá.' },
];
/* OV-15d (mockup 3, C23): "Lớp cần chú ý" của Tổng quan QL — Case đang mở + Case chưa có PA gộp thành MỘT cột "Case chưa chốt PA" (HV / Case, hai vùng bấm). */
const COT_CHU_Y = [...COT_DAY_DU.filter((c) => c.key !== 'caseMo' && c.key !== 'thieuPa' && c.key !== 'duDuLieu'),
  { key: 'caseChuaChot' as CotBang, nhan: () => 'Case chưa chốt PA',
    goiY: 'Case chưa có PA đang theo dõi: trống PA, chờ nhận xét / nguyên nhân, PA chờ xác nhận, PA chờ duyệt đổi, PA xong chờ đóng Case. Mỗi Case một trạng thái. Số trái: học viên, số phải: Case.' },
  COT_DAY_DU.find((c) => c.key === 'duDuLieu')!];
/** PR-LT2a (T58): khung Lớp thường không có cột SOS — số SOS chỉ của Fast Track. */
const cotCua = (ct: ChuongTrinh, chuY = false) => (chuY ? COT_CHU_Y : COT_DAY_DU).filter((c) => ct !== 'thuong' || c.key !== 'sos');
/** Hàng lớp "có vấn đề": có em dưới kỳ vọng / SOS / Case chưa chốt PA. */
const coVanDe = (o: Record<CotBang, OBang>) => o.duoiKyVong.n + o.sos.n + o.caseChuaChot.n > 0;
/** Mọi hàng thân bảng cao bằng nhau (G-2): nhãn FT / Lớp thường 11px không được nâng hàng lớp cao hơn hàng tổng. */
const HANG = '2.5rem';

export function BranchPulse({ branchId, ct, chuY = false }: {
  branchId: number | null; ct: ChuongTrinh;
  /** OV-15d: bảng "Lớp cần chú ý" của Tổng quan QL — cột Case chưa chốt PA (HV / Case), mặc định chỉ lớp có vấn đề. */
  chuY?: boolean;
}) {
  const navigate = useNavigate();
  const { session } = useSession();
  const q = `${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}`.replace(/^&/, '');
  const { data, loading, error, reload } = useApi<Bang>(q ? `/tong-quan/chi-nhanh?${q}` : '/tong-quan/chi-nhanh', [branchId, ct]);
  /* PR-OV5b: hàng mở + cách xem trên URL — Quay lại từ hồ sơ lớp về đúng chỗ. */
  const [mo, setMo] = useTapUrl('nhip-mo');
  const [xem, setView] = useThamSoUrl('nhip', 'lop');
  const view = xem === 'gv' ? 'gv' : 'lop';
  const COT = cotCua(ct, chuY);
  const [chiVanDe, setChiVanDe] = useThamSoUrl('lop-vd', '1');
  const locVanDe = chuY && chiVanDe === '1';
  const tieuDeTam = branchId ? 'Theo lớp' : 'Theo chi nhánh';   // tiêu đề trung tính khi chưa có dữ liệu, tránh nhấp nháy
  if (error) return <Card title={tieuDeTam}><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></Card>;
  if (loading) return <Card title={tieuDeTam}><Skeleton rows={3} /></Card>;
  if (!data) return null;
  /* QL một chi nhánh không có `cn` trên URL, server tự khoanh phạm vi. OV-10c: CX không xem GV (máy chủ 403) → không có "Theo giáo viên". */
  const coGv = data.cheDo === 'lop' && !!session?.nav?.phanTichGv;
  const o = (h: { khoa: string; nhan: string; o?: Record<CotBang, OBang> }, c: CotBang, x: OBang) => (
    <td key={c} className="td text-right tabular-nums">
      {/* UX-1: có học viên mà chưa em nào có đợt Test đến lịch → "—" có chữ, không phải 0/0. */}
      {c === 'duDuLieu' && !x.mau && (h.o ?? data.tong).hocVien.n > 0 ? (
        <span className="text-slate-500" title="Chưa có đợt Test đến lịch">—<span className="sr-only"> Chưa có đợt Test đến lịch</span></span>
      ) : <>
      {c === 'caseChuaChot' ? (
        /* "21 HV / 34 Case" — hai vùng bấm, mỗi vùng mở đúng danh sách của nó (cùng hàm bảng). */
        <span className="whitespace-nowrap">
          <SoLieuO giaTri={(h.o ?? data.tong).caseChuaChotHv.n} className="max-sm:px-2" tieuDe={`HV có Case chưa chốt PA · ${h.nhan}`}
            nguon={`/tong-quan/chi-nhanh/o?cot=caseChuaChotHv&khoa=${h.khoa}${q ? `&${q}` : ''}`} /> <span className="text-xs text-slate-500">HV</span>
          <span className="text-slate-500"> / </span>
          <SoLieuO giaTri={x.n} className="max-sm:px-2" tieuDe={`Case chưa chốt PA · ${h.nhan}`}
            nguon={`/tong-quan/chi-nhanh/o?cot=caseChuaChot&khoa=${h.khoa}${q ? `&${q}` : ''}`} /> <span className="text-xs text-slate-500">Case</span>
        </span>
      ) : <>
      {/* OV-11f (TQ-14, P2-2): số bấm được có vùng chạm 44 px cả ngang trên điện thoại (dọc đã có ở SoLieuO), không đổi hình. */}
      <SoLieuO giaTri={x.n} className="max-sm:px-3 max-sm:-mx-3" tieuDe={`${COT.find((k) => k.key === c)!.nhan(ct)} · ${h.nhan}`}
        nguon={`/tong-quan/chi-nhanh/o?cot=${c}&khoa=${h.khoa}${q ? `&${q}` : ''}`} />
      {c === 'duDuLieu' && <span className="text-slate-500">/{x.mau ?? 0}</span>}
      </>}
      </>}
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
  const soAn = locVanDe ? data.hang.flatMap((h) => (h.loai === 'lop' ? [h] : h.lop ?? [])).filter((l) => !coVanDe(l.o)).length : 0;
  const tenLop = (h: Hang) => (
    <span className="whitespace-nowrap">
      <Link to={`/hoc-vien/lop/${h.id}`} className="link max-sm:py-3 max-sm:-my-3">{h.nhan}</Link>
    </span>
  );
  return (
    <Card title={chuY ? 'Lớp cần chú ý' : data.cheDo === 'lop' ? `Theo lớp${data.tenChiNhanh ? ` · ${data.tenChiNhanh}` : ''}` : 'Theo chi nhánh'}
      action={chuY ? (
        <button type="button" className={`btn btn-sm min-h-[44px] sm:min-h-[28px] ${locVanDe ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}
          aria-pressed={locVanDe} onClick={() => setChiVanDe(locVanDe ? '0' : '1')}>Chỉ lớp có vấn đề</button>
      ) : coGv ? (
        <BoLocDoan ariaLabel="Cách xem" value={view} onChange={setView}
          muc={[{ key: 'lop', nhan: 'Theo lớp' }, { key: 'gv', nhan: 'Theo giáo viên' }]} />
      ) : undefined}
      bodyClass="p-0">
      {!chuY && coGv && view === 'gv' ? <BangGiaoVienChiNhanh branchId={data.branchId ?? branchId} ct={ct} /> : (
        <>
        <div className="table-scroll bang-dinh">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '44rem' }}>
            <colgroup><col style={{ width: '26%' }} />{COT.map((c) => <col key={c.key} style={{ width: `${(74 / COT.length).toFixed(1)}%` }} />)}</colgroup>
            <thead><tr>
              <Th className="sticky-col">{data.cheDo === 'lop' ? 'Lớp' : 'Chi nhánh'}</Th>
              {COT.map((c) => <Th key={c.key} align="right" hint={c.key === 'duoiKyVong' ? undefined : c.goiY}>{c.nhan(ct)}{c.key === 'duoiKyVong' && <> <NutLuat phai label={c.nhan(ct)}>{GOI_Y_DUOI_KY_VONG[ct]}</NutLuat></>}</Th>)}
            </tr></thead>
            <tbody>
              {data.cheDo === 'lop' && hangTong(data.tenChiNhanh ? `Cả ${data.tenChiNhanh}` : 'Cả chi nhánh')}
              {data.hang.filter((h) => !locVanDe || h.loai !== 'lop' || coVanDe(h.o)).map((h) => (
                <Fragment key={h.khoa}>
                  {h.loai === 'chi-nhanh' ? (
                    /* PR-UX4 (Q22, N-2): hàng chi nhánh là hàng lớn, hàng lớp mở xuống là hàng con — cùng component với mọi bảng có mở rộng. */
                    <HangNhom mo={mo.has(h.khoa)} onMo={() => setMo((s) => { const n = new Set(s); n.has(h.khoa) ? n.delete(h.khoa) : n.add(h.khoa); return n; })}
                      nhan={h.nhan} className={DINH_TRAI}
                      tieuDe={(
                        <button type="button" className="link appearance-none bg-transparent border-0 p-0 max-sm:py-3 max-sm:-my-3 cursor-pointer font-extrabold"
                          onClick={() => { nhoChiNhanh(session?.user?.id, h.id); navigate(`/?cn=${h.id}${thamSoCt(ct)}`); }}>{h.nhan}</button>
                      )}>
                      {COT.map((c) => o(h, c.key, h.o[c.key]))}
                    </HangNhom>
                  ) : (
                    <tr className="row-hover" style={{ height: HANG }}>
                      <td className="td sticky-col">{tenLop(h)}</td>
                      {COT.map((c) => o(h, c.key, h.o[c.key]))}
                    </tr>
                  )}
                  {h.loai === 'chi-nhanh' && mo.has(h.khoa) && (h.lop ?? []).filter((l) => !locVanDe || coVanDe(l.o)).map((l) => (
                    <HangCon key={l.khoa} className={DINH_TRAI}>
                      <td>{tenLop(l)}</td>
                      {COT.map((c) => o(l, c.key, l.o[c.key]))}
                    </HangCon>
                  ))}
                </Fragment>
              ))}
              {/* UX-1: Case / em của lớp đã kết thúc — có hàng riêng để cộng các hàng = hàng tổng. */}
              {data.conLai && (
                <tr className="row-hover" style={{ height: HANG }}>
                  <td className="td sticky-col whitespace-nowrap text-slate-400">{data.conLai.nhan}</td>
                  {COT.map((c) => o(data.conLai!, c.key, data.conLai!.o[c.key]))}
                </tr>
              )}
              {data.cheDo === 'chi-nhanh' && hangTong('Tất cả chi nhánh')}
            </tbody>
          </table>
        </div>
        <p className="m-0 px-4 py-2 text-xs text-slate-500 border-t" style={{ borderColor: 'var(--line)' }}>
          {locVanDe && soAn > 0 ? <>Ẩn {soAn} lớp không có vấn đề · <button type="button" className="link appearance-none border-0 bg-transparent p-0 max-sm:py-3" onClick={() => setChiVanDe('0')}>Hiện</button></>
            : data.cheDo === 'chi-nhanh' ? 'Bấm ▸ để mở ra từng lớp · bấm số để xem danh sách' : 'Bấm số để xem danh sách'}
        </p>
        </>
      )}
    </Card>
  );
}
