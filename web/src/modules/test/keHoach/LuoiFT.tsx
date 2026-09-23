import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, Th } from '../../../ui/ui.tsx';
import { tuanLich } from '@shared/domain/index.ts';
import { HopSuaTuan } from './HopSuaTuan.tsx';

export type TrangThaiO = 'xong' | 'da-xep' | 'da-doi' | 'chua-xep' | 'khong-yeu-cau';
export type ONhom = { trangThai: TrangThaiO; tuan: string | null; them: number; doiTu: string | null; giuNguyen: string[] };
export type DotFT = { attemptId: number | null; trangThaiDot: string | null; rlw: ONhom; s: ONhom };
export type HangFT = { studentId: number; ten: string; ma: string; vaoMuon: boolean; dot: Record<number, DotFT> };
export type LuoiFTData = { classId: number; classCode: string; cot: number[]; hang: HangFT[] };

const TEN_NHOM: Record<'rlw' | 's', string> = { rlw: 'RLW', s: 'S' };

/**
 * LƯỚI KẾ HOẠCH TEST — LỚP FAST TRACK CẢ LỚP (R10, mockup 05b (1)).
 *
 * Bảng cố định cột (`table-layout: fixed` + `colgroup`, G-2), cuộn ngang TRONG THẺ (G-11). Mỗi đợt (MT{n}) một ô
 * chứa hai khối RLW / S. Bấm ô đã xếp mở hộp sửa tuần; bấm "+ xếp" mở hộp xếp mới cho cả đợt.
 */
export function LuoiFT({ data, onReload }: { data: LuoiFTData; onReload: () => void }) {
  const [hop, setHop] = useState<
    | { mode: 'sua'; attemptId: number; nhom: 'rlw' | 's'; ten: string; attemptNo: number }
    | { mode: 'xep-moi'; studentId: number; ten: string; attemptNo: number }
    | null
  >(null);

  if (data.hang.length === 0) {
    return <Empty title="Lớp này chưa có học viên đang học" />;
  }

  const rong = 168 + data.cot.length * 200;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: rong }}>
        <colgroup>
          <col style={{ width: 168 }} />
          {data.cot.map((n) => <col key={n} style={{ width: 200 }} />)}
        </colgroup>
        <thead>
          <tr>
            <Th className="sticky-col">Học viên</Th>
            {data.cot.map((n) => <Th key={n} align="center">MT{n}</Th>)}
          </tr>
        </thead>
        <tbody>
          {data.hang.map((h) => (
            <tr key={h.studentId} className="row-hover">
              <td className="td py-2 sticky-col">
                <div className="text-slate-100 truncate" title={h.ten}>{h.ten}</div>
                <div className="text-[11px] text-slate-500">
                  {h.ma}
                  {h.vaoMuon && <span className="block text-slate-500">(vào muộn)</span>}
                </div>
              </td>
              {data.cot.map((n) => {
                const dot = h.dot[n];
                if (!dot || dot.attemptId === null) {
                  return (
                    <td key={n} className="td py-2 align-top">
                      <button type="button"
                        className="w-full rounded border border-dashed px-2 py-3 text-[11px] text-slate-500 hover:text-slate-200"
                        style={{ borderColor: 'var(--line-strong)' }}
                        onClick={() => setHop({ mode: 'xep-moi', studentId: h.studentId, ten: h.ten, attemptNo: n })}>
                        + xếp
                      </button>
                    </td>
                  );
                }
                return (
                  <td key={n} className="td py-2 align-top">
                    <div className="flex flex-col gap-1">
                      <ONhomKhoi nhom="rlw" o={dot.rlw} ten={h.ten} attemptNo={n} attemptId={dot.attemptId}
                        onOpen={() => setHop({ mode: 'sua', attemptId: dot.attemptId!, nhom: 'rlw', ten: h.ten, attemptNo: n })} />
                      <ONhomKhoi nhom="s" o={dot.s} ten={h.ten} attemptNo={n} attemptId={dot.attemptId}
                        onOpen={() => setHop({ mode: 'sua', attemptId: dot.attemptId!, nhom: 's', ten: h.ten, attemptNo: n })} />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-3 px-1 pt-2 pb-1 text-[11px] text-slate-500">
        <ChuGiai mau="var(--accent)" nhan="đã xếp" />
        <ChuGiai mau="#73d9a5" nhan="đã thi xong" />
        <ChuGiai mau="#e5c66a" nhan="đã dời (vì vắng)" />
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-dashed" style={{ borderColor: 'var(--line-strong)' }} />
          chưa xếp
        </span>
      </div>

      {hop && (
        <HopSuaTuan {...hop} onClose={() => setHop(null)} onSaved={onReload} />
      )}
    </div>
  );
}

function ChuGiai({ mau, nhan }: { mau: string; nhan: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: mau }} />
      {nhan}
    </span>
  );
}

function ONhomKhoi({ nhom, o, ten, attemptNo, attemptId, onOpen }: {
  nhom: 'rlw' | 's'; o: ONhom; ten: string; attemptNo: number; attemptId: number; onOpen: () => void;
}) {
  const nhan = TEN_NHOM[nhom];
  const them = o.them > 0 ? (
    <sup className="ml-0.5 text-[9px] text-slate-400"
      title={`${o.them} kỹ năng trong nhóm ở tuần khác`}>+{o.them}</sup>
  ) : null;

  if (o.trangThai === 'khong-yeu-cau') {
    return (
      <span className="block rounded px-2 py-1 text-[11px] text-slate-600 text-center"
        title={`Đợt này không kiểm tra ${nhom === 'rlw' ? 'Listening, Reading, Writing' : 'Speaking'}`}>—</span>
    );
  }

  if (o.trangThai === 'xong') {
    return (
      <Link to={`/mock-test/${attemptId}`}
        className="block rounded px-2 py-1 text-[11px] no-underline"
        style={{ background: '#15362a', color: '#73d9a5', border: '1px solid #1f4a3a' }}
        title={`${nhan} · Đã thi — mở hồ sơ đợt`}>
        {nhan} · {o.tuan ? tuanLich(o.tuan) : '—'} <span aria-hidden title="Đã thi">✓</span>
      </Link>
    );
  }

  if (o.trangThai === 'chua-xep') {
    return (
      <button type="button" onClick={onOpen}
        className="block w-full rounded border border-dashed px-2 py-1 text-[11px] text-slate-500 hover:text-slate-200 text-left"
        style={{ borderColor: 'var(--line-strong)' }}
        title={`Xếp tuần ${nhan} cho ${ten} · MT${attemptNo}`}>
        {nhan} · chưa xếp
      </button>
    );
  }

  const daDoi = o.trangThai === 'da-doi';
  return (
    <button type="button" onClick={onOpen}
      className="block w-full rounded px-2 py-1 text-[11px] text-left"
      style={daDoi
        ? { background: '#3a3219', color: '#e5c66a', border: '1px solid #5a4b22' }
        : { background: 'var(--accent-soft)', color: 'var(--accent-strong)', border: '1px solid var(--accent-line)' }}
      title={`Sửa lịch · ${ten} · MT${attemptNo} · ${nhan}`}>
      {daDoi ? <>{nhan} · dời → {o.tuan ? tuanLich(o.tuan) : '—'}</> : <>{nhan} · {o.tuan ? tuanLich(o.tuan) : '—'}</>}
      {them}
    </button>
  );
}
