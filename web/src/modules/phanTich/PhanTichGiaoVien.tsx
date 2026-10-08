import { useId, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  COT_KET_QUA_GV, chuOPtGv, khungPtGvTuThamSo, mauKetQuaGv, ngay, tuanLich,
  type HangPtGv, type KhungPtGv, type OPtGv, type PhanTichGvKq,
} from '@shared/domain/index.ts';
import { useApi } from '../../lib/useApi.ts';
import { CongTacKhung, khungDaNho } from '../../ui/CongTacKhung.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { BoLocDoan, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';

/**
 * PHÂN TÍCH GIÁO VIÊN (PR-Pb2-b, mockup 25 màn A–D) — góc nhìn cuối hàng ở Tổng quan › Phân tích, Quản lý + Quản trị. Một hàng một giáo viên,
 * sắp theo tên; KHÔNG KPI, KHÔNG xếp hạng, KHÔNG hàng tổng, KHÔNG nút sắp (Q30-5). Ô ghi `n/m` trước, % 12 px dưới; dưới 5 mục "mẫu nhỏ".
 * Chỉ % ô KẾT QUẢ có màu (không thanh — Q27). Bộ lọc riêng (khung · khoảng tuần / tháng); chi nhánh lấy ô chi nhánh đầu trang.
 * Bấm số: Chấm điểm mở panel (màn C), ô khác mở trang liên quan đã lọc sẵn (Q22). Điện thoại: mỗi GV một thẻ, dòng không áp dụng ẩn (màn D).
 */

/** Chú thích nổi từng cột — chữ theo "Định nghĩa từng cột" của mockup 25 (Một mục là · Tử số). */
const GIAI: Record<string, (ft: boolean) => string> = {
  'dang-day': (ft) => `Ngữ cảnh, không phải chỉ số. Số ${ft ? 'lớp Fast Track' : 'lớp thường'} giáo viên có phân công (GVCN hoặc một môn) ở chi nhánh này, và số học viên các lớp đó, tính ở ngày cuối của khoảng.`,
  'cham-diem': () => 'Một mục là một ô điểm: một học viên × một bài × một kỹ năng giáo viên được phân công lúc tới hạn, tuần thi trong khoảng. Đúng hạn khi lần nhập đầu không muộn hơn hạn chấm; sửa điểm sau đó không tính. Quá hạn mà chưa nhập là trễ. Không tính: vắng đã xác nhận, huỷ, "không có bài", học viên tạm dừng, ô chưa tới hạn.',
  'ghi-pa': (ft) => `${ft ? '' : 'Lớp thường ngắn nên Case, PA ít; cột để mờ. '}Một mục là một lần Kết quả PA (mỗi tuần theo dõi) ở Case giáo viên phụ trách, hạn ghi trong khoảng. Đúng hạn khi ghi trước hạn; quá hạn mà chưa ghi là trễ.`,
  'vi-pham': () => 'Chỉ lớp giáo viên làm GVCN. Một mục là một vi phạm thành "Cần xử lý", hạn xử lý trong khoảng. Đúng hạn khi GVCN xác nhận xử lý, hoặc gửi đề xuất cho Quản lý, trước hạn. Thời gian chờ Quản lý duyệt không tính cho GVCN.',
  'pa-hieu-qua': () => 'PA giáo viên tự thêm vào Case (không tính PA theo quy chế, PA bổ trợ) đã có kết quả cuối trong khoảng. Số trên: PA có tiến bộ (cùng luật góc nhìn Hiệu quả PA) / PA đã có kết quả cuối.',
  'ket-qua': (ft) => ft
    ? 'Một mục là một học viên × một bài có tuần thi trong khoảng, ở lớp giáo viên dạy kỹ năng đó lúc thi. Số trên: đạt kỳ vọng của đợt đó / đã có điểm (W1, W2 so từng bài). Em đã chuyển lớp vẫn tính cho người dạy em lúc thi. Phần trăm tô màu: đỏ dưới 50%, vàng 50–69%, xanh từ 70%.'
    : 'Đạt từ 70%. Một mục là một học viên × một bài (Progress Test, Final Test) có tuần thi trong khoảng. Bốn cột cố định; môn giáo viên không dạy ghi —. Phần trăm tô màu: đỏ dưới 50%, vàng 50–69%, xanh từ 70%.',
  'tien-bo': () => 'Một mục là một học viên × một kỹ năng giáo viên dạy, ở bài có tuần thi trong khoảng, mà em đã có điểm kỹ năng đó ở bài trước. Tiến bộ khi điểm cao hơn bài trước; bằng hoặc thấp hơn thì không.',
  'w-gv': () => 'BE, ELE: Writing. FOU: Grammar + Vocabulary (G+V).',
  's-p': () => 'BE, ELE: Speaking. FOU: Pronunciation (P).',
};
const NHAN_KQ: Record<string, [string, string | null]> = {
  listening: ['L', null], reading: ['R', null], writing1: ['W1', null], writing2: ['W2', null], speaking: ['S', null],
};
const NHAN_KQ_THUONG: Record<string, [string, string | null]> = { listening: ['L', null], reading: ['R', null], writing: ['W', '(G+V)'], speaking: ['S', '(P)'] };
const MAU: Record<'thap' | 'vua' | 'cao', string> = { thap: 'text-bad', vua: 'text-soon', cao: 'text-ok' };

/** Tên cột 2–3 chữ + chú thích nổi hiện khi rê chuột HOẶC Tab tới (không dựa vào `title` một mình). */
function DauCot({ nhan, giai, trai, children }: { nhan?: ReactNode; giai: string; trai?: boolean; children?: ReactNode }) {
  const id = useId();
  return (
    <span className="group relative inline-block">
      <span tabIndex={0} aria-describedby={id} className="cursor-help border-b border-dotted border-slate-500 outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]">
        {nhan}{children}
      </span>
      <span id={id} role="tooltip"
        className={`pointer-events-none absolute top-[calc(100%+6px)] z-20 hidden w-64 whitespace-normal rounded-lg border px-2.5 py-2 text-left text-xs font-normal normal-case leading-normal tracking-normal text-slate-200 shadow-lg group-hover:block group-focus-within:block ${trai ? 'left-0' : 'right-0'}`}
        style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
        {giai}
      </span>
    </span>
  );
}

/** Một ô số: `n/m` bấm được (link hoặc panel) + dòng phụ 12 px; "—" / "không có" mờ. `ketQua` → % có màu. */
function OSo({ o, den, onBam, ketQua, mo }: { o: OPtGv | undefined; den?: string; onBam?: () => void; ketQua?: boolean; mo?: boolean }) {
  if (!o) return <span className="text-faint">—</span>;
  const c = chuOPtGv(o);
  if (c.so === null) return <span className={`text-faint ${o.k === 'rong' ? 'text-xs' : 'tabular-nums'}`}>{c.phu}</span>;
  const mau = ketQua && o.k === 'so' ? mauKetQuaGv(o.dung, o.tong) : null;
  const so = 'font-semibold tabular-nums underline decoration-dotted underline-offset-4 py-2 -my-2 inline-block';
  const soMau = mo ? 'text-slate-400' : 'text-slate-100';
  return (
    <span className="inline-flex flex-col items-end">
      {onBam
        ? <button type="button" onClick={onBam} className={`cursor-pointer appearance-none border-0 bg-transparent p-0 ${so} ${soMau}`}>{c.so}</button>
        : den ? <Link to={den} className={`no-underline ${so} ${soMau}`}>{c.so}</Link>
        : <span className={`${so} no-underline ${soMau}`}>{c.so}</span>}
      <span className={`text-xs leading-tight tabular-nums ${mau ? `${MAU[mau]} font-semibold` : 'text-slate-400'}`}>{c.phu}</span>
    </span>
  );
}

/** Đích bấm số (Q22, URL hợp đồng Pb2-a cho Hiệu quả PA). */
function duong(kq: PhanTichGvKq, h: HangPtGv) {
  const cn = kq.cn;
  const motLop = (ds: number[] | undefined, tab: string, them = '') => (ds && ds.length === 1 ? `/hoc-vien/lop/${ds[0]}?tab=${tab}${them}` : null);
  return {
    gv: `/giao-vien/${h.id}`,
    ghiPa: `/cong-viec?nguoi=${h.id}&nhom=case-hoc-thuat&khung=${kq.khung}&cn=${cn}`,
    viPham: motLop(h.xuLyViPham.k === 'so' ? h.xuLyViPham.lopGvcn : undefined, 'y-thuc') ?? `/phan-tich?goc=y-thuc&cn=${cn}`,
    pa: `/phan-tich?goc=hieu-qua-pa&cn=${cn}&ct=ft&gv=${h.id}&tu=${kq.tu}&den=${kq.den}`,
    ketQua: (k: string) => motLop((h.ketQua[k] as { lop?: number[] }).lop, 'phan-tich', `&ky-nang=${k}`) ?? `/giao-vien/${h.id}`,
    tienBo: motLop(h.tienBo && 'lop' in h.tienBo ? h.tienBo.lop : undefined, 'phan-tich') ?? `/giao-vien/${h.id}`,
  };
}

export function PhanTichGiaoVien({ branchId }: { branchId: number | null }) {
  const [params, setParams] = useSearchParams();
  const { homNay } = useNgayNghiepVu();
  const dienThoai = useDienThoai();
  const ctUrl = params.get('ct');
  const khung: KhungPtGv = ctUrl === 'ft' || ctUrl === 'thuong' ? ctUrl : khungPtGvTuThamSo(khungDaNho('phan-tich-gv'));
  const thang = params.get('thang');
  const tu = params.get('tu');
  const den = params.get('den');
  const [chamDiem, setChamDiem] = useState<HangPtGv | null>(null);
  const q = new URLSearchParams({ ct: khung, ...(branchId ? { cn: String(branchId) } : {}), ...(thang ? { thang } : tu && den ? { tu, den } : {}) });
  const { data, loading, error, reload } = useApi<PhanTichGvKq>(branchId ? `/phan-tich/giao-vien?${q}` : null, [q.toString()]);

  const dat = (o: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(o)) if (v === null) next.delete(k); else next.set(k, v);
    setParams(next, { replace: false });
  };
  const theoThang = !!thang;
  const tuHien = data?.tu ?? tu ?? '';
  const denHien = data?.den ?? den ?? '';

  const boLoc = (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
      <div className="flex flex-col gap-1 text-xs text-slate-400">
        <span>Khung</span>
        <CongTacKhung trang="phan-tich-gv" value={khung} onChange={(k) => dat({ ct: k })} />
      </div>
      <div className="flex flex-col gap-1 text-xs text-slate-400">
        <span>Khoảng</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <BoLocDoan<'tuan' | 'thang'> ariaLabel="Khoảng theo tuần hoặc tháng" value={theoThang ? 'thang' : 'tuan'}
            onChange={(v) => (v === 'thang' ? dat({ thang: (tuHien || homNay).slice(0, 7), tu: null, den: null }) : dat({ thang: null, tu: tuHien || null, den: denHien || null }))}
            muc={[{ key: 'tuan', nhan: 'Theo tuần' }, { key: 'thang', nhan: 'Theo tháng' }]} />
          {theoThang ? (
            <>
              <ONgay kieu="thang" gon value={thang ?? ''} onChange={(v) => v && dat({ thang: v })} ariaLabel="Tháng"
                toiThieu={homNay ? `${Number(homNay.slice(0, 4)) - 2}${homNay.slice(4, 7)}` : null} toiDa={homNay ? homNay.slice(0, 7) : null} />
              {data && <span className="text-xs tabular-nums text-slate-400">{tuanLich(data.tu, homNay)} – {tuanLich(data.den, homNay)}</span>}
            </>
          ) : (
            <>
              <ONgay kieu="tuan" gon value={tuHien} onChange={(v) => v && dat({ tu: v, den: denHien < v ? v : denHien, thang: null })} ariaLabel="Từ tuần" />
              <span className="text-slate-500" aria-hidden>–</span>
              <ONgay kieu="tuan" gon value={denHien} onChange={(v) => v && dat({ den: v, tu: tuHien > v ? v : tuHien, thang: null })} ariaLabel="Đến tuần" />
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (!branchId) return <div className="space-y-3">{boLoc}<Empty title="Chọn một chi nhánh" hint="Bảng giáo viên luôn là một chi nhánh — chọn ở ô chi nhánh đầu trang." /></div>;
  return (
    <div className="space-y-3">
      {boLoc}
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : loading || !data ? <Skeleton rows={6} />
        : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>
                <span className="tabular-nums">{data.hang.length}</span> giáo viên có {data.khung === 'ft' ? 'lớp Fast Track' : 'lớp thường'} ở {data.tenChiNhanh} trong{' '}
                <b className="font-semibold tabular-nums text-slate-200">{data.thang ? `${data.thang.slice(5)}/${data.thang.slice(0, 4)}` : `${tuanLich(data.tu, homNay)} – ${tuanLich(data.den, homNay)}`}</b>
                {' '}· sắp theo tên{!dienThoai && ' · rê chuột hoặc Tab vào tên cột gạch chấm để xem cách tính'}
              </span>
              {!dienThoai && (
                <span className="flex flex-wrap gap-x-4 gap-y-0.5">
                  <span><b className="font-semibold tabular-nums text-slate-200">18/20</b> đúng hạn / có hạn trong khoảng</span>
                  <span><b className="text-slate-200">—</b> không áp dụng</span>
                  <span>không có = áp dụng, chưa có mục</span>
                  <span>mẫu nhỏ = dưới 5 mục</span>
                  <span className="inline-flex gap-1.5">ô kết quả <span className="font-semibold text-bad">dưới 50%</span><span className="font-semibold text-soon">50–69%</span><span className="font-semibold text-ok">từ 70%</span></span>
                </span>
              )}
            </div>
            {!data.hang.length
              ? <Empty title={`Không có giáo viên nào có ${data.khung === 'ft' ? 'lớp Fast Track' : 'lớp thường'} trong khoảng này.`} />
              : dienThoai ? <TheGv kq={data} onChamDiem={setChamDiem} /> : <BangGv kq={data} onChamDiem={setChamDiem} />}
            {chamDiem && <PanelChamDiem kq={data} h={chamDiem} onDong={() => setChamDiem(null)} />}
          </>
        )}
    </div>
  );
}

// ------------------------------------------------------------------ bảng 1440 (màn A, B)

function BangGv({ kq, onChamDiem }: { kq: PhanTichGvKq; onChamDiem: (h: HangPtGv) => void }) {
  const ft = kq.khung === 'ft';
  const cotKq = COT_KET_QUA_GV[kq.khung];
  const nhanKq = ft ? NHAN_KQ : NHAN_KQ_THUONG;
  const th = 'th whitespace-normal align-bottom leading-snug';
  const bl = 'border-l border-[color:var(--line)]';
  const rongKq = ft ? 60 : 72;
  return (
    <div className="table-scroll min-h-[13rem] rounded-lg border" style={{ borderColor: 'var(--line)' }} role="region" aria-label="Bảng Phân tích giáo viên, cuộn ngang" tabIndex={0}>
      <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: ft ? '1000px' : '820px' }}>
        <colgroup>
          <col style={{ width: 176 }} /><col style={{ width: 80 }} /><col style={{ width: 88 }} /><col style={{ width: 112 }} /><col style={{ width: 108 }} />
          {ft && <col style={{ width: 88 }} />}
          {cotKq.map((k) => <col key={k} style={{ width: rongKq }} />)}
          {ft && <col style={{ width: 88 }} />}
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={2} className={`${th} sticky left-0 z-10`} style={{ background: 'var(--surface-2, var(--surface))' }}>Giáo viên</th>
            <th rowSpan={2} className={`${th} text-right`}><DauCot nhan="Đang dạy" giai={GIAI['dang-day'](ft)} trai /></th>
            <th colSpan={3} className={`${th} ${bl} text-center align-middle text-slate-200`}>Đúng hạn</th>
            {ft && <th rowSpan={2} className={`${th} ${bl} text-right`}><DauCot nhan="PA hiệu quả" giai={GIAI['pa-hieu-qua'](ft)} /></th>}
            <th colSpan={cotKq.length} className={`${th} ${bl} text-center align-middle text-slate-200`}><DauCot nhan="Kết quả môn mình dạy" giai={GIAI['ket-qua'](ft)} /></th>
            {ft && <th rowSpan={2} className={`${th} ${bl} text-right`}><DauCot nhan="HV tiến bộ" giai={GIAI['tien-bo'](ft)} /></th>}
          </tr>
          <tr>
            <th className={`${th} ${bl} text-right`}><DauCot nhan="Chấm điểm" giai={GIAI['cham-diem'](ft)} trai /></th>
            <th className={`${th} text-right ${ft ? '' : 'font-medium'}`}><DauCot nhan="Kết quả PA" giai={GIAI['ghi-pa'](ft)} /></th>
            <th className={`${th} text-right`}><DauCot nhan="Xử lý vi phạm" giai={GIAI['vi-pham'](ft)} /></th>
            {cotKq.map((k, i) => {
              const [nhan, phu] = nhanKq[k];
              return (
                <th key={k} className={`${th} text-right ${i === 0 ? bl : ''}`}>
                  {phu ? <DauCot giai={GIAI[k === 'writing' ? 'w-gv' : 's-p'](ft)}>{nhan} <span className="font-medium">{phu}</span></DauCot> : nhan}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {kq.hang.map((h) => {
            const d = duong(kq, h);
            return (
              <tr key={h.id} className="row-hover">
                <td className="td sticky left-0 z-[1] align-top" style={{ background: 'var(--bg)' }}>
                  <Link to={d.gv} className="link font-semibold">{h.ten}</Link>
                  {h.phu && <div className="text-xs text-slate-400">{h.phu}</div>}
                </td>
                <td className="td text-right align-top tabular-nums">
                  <Link to={d.gv} className="font-semibold text-slate-100 underline decoration-dotted underline-offset-4">{h.dangDay.lop}</Link> <span className="text-xs text-slate-400">lớp</span>
                  <span className="block text-xs text-slate-400"><span className="tabular-nums">{h.dangDay.hv}</span> HV</span>
                </td>
                <td className={`td text-right align-top ${bl}`}><OSo o={h.chamDiem} onBam={() => onChamDiem(h)} /></td>
                <td className="td text-right align-top"><OSo o={h.ghiKetQuaPa} den={d.ghiPa} mo={!ft} /></td>
                <td className="td text-right align-top"><OSo o={h.xuLyViPham} den={d.viPham} /></td>
                {ft && <td className={`td text-right align-top ${bl}`}><OSo o={h.paHieuQua} den={d.pa} /></td>}
                {cotKq.map((k, i) => <td key={k} className={`td text-right align-top ${i === 0 ? bl : ''}`}><OSo o={h.ketQua[k]} den={d.ketQua(k)} ketQua /></td>)}
                {ft && <td className={`td text-right align-top ${bl}`}><OSo o={h.tienBo} den={d.tienBo} /></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------------ 375 px (màn D): mỗi GV một thẻ, dòng không áp dụng ẩn

function TheGv({ kq, onChamDiem }: { kq: PhanTichGvKq; onChamDiem: (h: HangPtGv) => void }) {
  const ft = kq.khung === 'ft';
  const nhanKq = ft ? NHAN_KQ : NHAN_KQ_THUONG;
  return (
    <div className="card p-0">
      {kq.hang.map((h) => {
        const d = duong(kq, h);
        const dong: { nhan: string; noiDung: ReactNode; o: OPtGv | undefined }[] = [
          { nhan: 'Chấm đúng hạn', o: h.chamDiem, noiDung: <OSo o={h.chamDiem} onBam={() => onChamDiem(h)} /> },
          { nhan: 'Kết quả PA đúng hạn', o: h.ghiKetQuaPa, noiDung: <OSo o={h.ghiKetQuaPa} den={d.ghiPa} mo={!ft} /> },
          { nhan: 'Xử lý vi phạm đúng hạn', o: h.xuLyViPham, noiDung: <OSo o={h.xuLyViPham} den={d.viPham} /> },
          ...(ft ? [{ nhan: 'PA hiệu quả', o: h.paHieuQua, noiDung: <OSo o={h.paHieuQua} den={d.pa} /> }] : []),
          ...COT_KET_QUA_GV[kq.khung].map((k) => ({
            nhan: `Kết quả ${nhanKq[k][0]}${nhanKq[k][1] ? ` ${nhanKq[k][1]}` : ''} · ${ft ? 'đạt kỳ vọng' : 'đạt'}`, o: h.ketQua[k],
            noiDung: <OSo o={h.ketQua[k]} den={d.ketQua(k)} ketQua />,
          })),
          ...(ft ? [{ nhan: 'HV tiến bộ', o: h.tienBo, noiDung: <OSo o={h.tienBo} den={d.tienBo} /> }] : []),
        ];
        return (
          <TheDong key={h.id}
            dau={(
              <span className="block min-w-0">
                <Link to={d.gv} className="link font-semibold">{h.ten}</Link>
                <span className="block text-xs text-slate-400">{[h.phu, `${h.dangDay.lop} lớp · ${h.dangDay.hv} HV`].filter(Boolean).join(' · ')}</span>
              </span>
            )}
            dong={dong.filter((x) => x.o && x.o.k !== 'na').map(({ nhan, noiDung }) => ({ nhan, noiDung: <span className="flex justify-end">{noiDung}</span> }))} />
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ panel Chấm điểm (màn C)

type DongCham = {
  id: number; studentId: number; hocVien: string; lop: string; bai: string; mon: string; tuan: string; han: string;
  nhapDau: string | null; tre: number | null; dung: boolean; sua: string | null;
};
type PanelCham = { ten: string; tenChiNhanh: string; khung: KhungPtGv; tu: string; den: string; n: number; tre: number; khongTinhVang: number; rows: DongCham[] };

function Dau({ ok }: { ok: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="shrink-0">
      {ok
        ? <path d="M2.5 6.3 5 8.6l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M3.5 3.5l5 5M8.5 3.5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
}

function PanelChamDiem({ kq, h, onDong }: { kq: PhanTichGvKq; h: HangPtGv; onDong: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const [chiTre, setChiTre] = useState(false);
  const q = new URLSearchParams({ cn: String(kq.cn), ct: kq.khung, gv: String(h.id), ...(kq.thang ? { thang: kq.thang } : { tu: kq.tu, den: kq.den }) });
  const { data, loading, error, reload } = useApi<PanelCham>(`/phan-tich/giao-vien/cham-diem?${q}`, [q.toString()]);
  const rows = (data?.rows ?? []).filter((r) => !chiTre || !r.dung);
  const khoang = `${tuanLich(kq.tu, homNay)} – ${tuanLich(kq.den, homNay)}`;
  return (
    <KhungPanel tieuDe={`Chấm đúng hạn · ${h.ten}`} rong="rong" onDong={onDong}
      ngCanh={data ? (
        <span className="text-xs text-slate-400">
          {kq.khung === 'ft' ? 'Fast Track' : 'Lớp thường'} · {data.tenChiNhanh} · tuần thi <span className="tabular-nums">{khoang}</span> ·{' '}
          <b className="tabular-nums text-slate-200">{data.n}</b> đúng hạn · <b className="tabular-nums text-slate-200">{data.tre}</b> trễ · <span className="tabular-nums">{data.rows.length}</span> ô
        </span>
      ) : undefined}
      tabs={data ? (
        <BoLocDoan<'tat-ca' | 'tre'> ariaLabel="Lọc ô điểm" value={chiTre ? 'tre' : 'tat-ca'} onChange={(v) => setChiTre(v === 'tre')}
          muc={[{ key: 'tat-ca', nhan: 'Tất cả', so: data.rows.length }, { key: 'tre', nhan: 'Trễ', so: data.tre }]} />
      ) : undefined}
      chan={{
        huy: { nhan: 'Đóng', onClick: onDong },
        phu: (
          <span className="text-xs text-slate-400">
            Không tính: {data?.khongTinhVang ? <><span className="tabular-nums">{data.khongTinhVang}</span> ô vắng đã xác nhận · </> : null}ô chưa tới hạn và chưa nhập.
          </span>
        ),
        chinh: <Link to="/test/lich" className="link text-xs">Mở Lịch Test ›</Link>,
      }}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : loading || !data ? <div className="pt-3"><Skeleton rows={6} /></div>
        : !rows.length ? <div className="pt-3"><Empty title={chiTre ? 'Không có ô trễ.' : 'Không có ô điểm nào trong khoảng này.'} /></div>
        : (
          <div className="table-scroll mt-3 rounded-lg border" style={{ borderColor: 'var(--line)' }} role="region" aria-label="Danh sách ô điểm" tabIndex={0}>
            <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '640px' }}>
              <colgroup><col style={{ width: '20%' }} /><col style={{ width: '23%' }} /><col style={{ width: '11%' }} /><col style={{ width: '11%' }} /><col style={{ width: '16%' }} /><col style={{ width: '19%' }} /></colgroup>
              <thead><tr className="whitespace-nowrap">
                <th className="th">Học viên</th><th className="th">Lớp · bài · kỹ năng</th><th className="th">Tuần thi</th>
                <th className="th text-right">Hạn chấm</th><th className="th text-right">Lần nhập đầu</th><th className="th">Kết quả</th>
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={r.dung ? undefined : { boxShadow: 'inset 3px 0 0 rgb(var(--bad-rgb))' }}>
                    <td className="td"><Link to={`/hoc-vien/${r.studentId}`} className="link">{r.hocVien}</Link></td>
                    <td className="td text-slate-300">{r.lop} · {r.bai} · {r.mon}</td>
                    <td className="td whitespace-nowrap tabular-nums">{tuanLich(r.tuan, homNay)}</td>
                    <td className="td whitespace-nowrap text-right text-xs tabular-nums">{ngay(r.han, homNay)}</td>
                    <td className="td whitespace-nowrap text-right text-xs tabular-nums">
                      {r.nhapDau ? ngay(r.nhapDau, homNay) : <span className="text-slate-400">chưa nhập</span>}
                      {r.sua && <span className="block text-xs text-slate-400">sửa {ngay(r.sua, homNay)}</span>}
                    </td>
                    <td className="td">
                      <span className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold ${r.dung ? 'text-ok' : 'text-bad'}`}>
                        <Dau ok={r.dung} />{r.dung ? 'Đúng hạn' : `Quá hạn · ${r.tre} ngày`}
                      </span>
                      {!r.dung && !r.nhapDau && <span className="block text-xs text-slate-400">tới hôm nay {ngay(homNay, homNay)}</span>}
                      {r.dung && r.sua && <span className="block text-xs text-slate-400">lần sửa không tính</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </KhungPanel>
  );
}
