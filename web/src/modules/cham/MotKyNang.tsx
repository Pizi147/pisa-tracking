/**
 * CHẤM TRÊN ĐIỆN THOẠI — MỘT KỸ NĂNG MỘT LÚC (mockup 05a §3, phương án A).
 *
 * Đúng cách giáo viên chấm thật: xong cả lớp một kỹ năng rồi mới sang kỹ năng khác. Không có bảng năm cột, không cuộn
 * ngang. Trên cùng là hàng chip chọn kỹ năng kèm "{đã nhập}/{tổng}"; dưới là danh sách học viên, mỗi em MỘT ô to.
 *
 * KHÔNG CÓ LUẬT THỨ HAI: ô điểm là chính các ô của lưới (`RawScoreInput`, `CriteriaButton`, `ODiemThuong`) ở cỡ `lon`,
 * lưu bằng chính `useSaveScore` / `useLuuThuong`. Nên gõ "-" (FT: đếm ngược DS02; lớp thường: môn dời sang tuần sau),
 * ô đã có điểm phải ghi lý do (RB-5), Enter/↓ xuống em kế tiếp, Esc huỷ — y hệt trên máy tính.
 *
 * Kỹ năng mình được phân công đứng trước; kỹ năng khác vẫn chọn được để đối chiếu, nhưng ô chỉ đọc.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ENTRY_SKILLS, ngay } from '@shared/domain/index.ts';
import { fmtBand, skillLabel, skillShort } from '../../lib/format.ts';
import { Info } from '../../ui/ui.tsx';
import {
  ChoNutDau, CriteriaButton, KHOA_HOAN_TAT_HINT, ODiemThuong, RawScoreInput, datPhanTram, useSaveScore, type Cell,
} from '../fasttrack/ScoreEntry.tsx';
import { DauLuu, LuoiFT, khopKn, oTrongFt, type FtSheet } from './LuoiFT.tsx';
import {
  LuoiThuong, ketQuaCua, lichCua, oThuong, tongPhoBien, useLuuThuong, type ThuongSheet,
} from './LuoiThuong.tsx';

const KHONG_PHAN_CONG = 'Bạn không được phân công kỹ năng này';

type Chung = { onReload: () => void; kn?: string | null; hv?: number | null };

export function MotKyNang(p: Chung & ({ mode: 'ielts_band'; data: FtSheet } | { mode: 'ratio'; data: ThuongSheet })) {
  return p.mode === 'ielts_band'
    ? <MotKyNangFt data={p.data} onReload={p.onReload} kn={p.kn ?? null} hv={p.hv ?? null} />
    : <MotKyNangThuong data={p.data} onReload={p.onReload} kn={p.kn ?? null} hv={p.hv ?? null} />;
}

/**
 * KỸ NĂNG ĐANG CHỌN. Mở từ Cần chấm với `?kn=` thì chọn sẵn kỹ năng đó (`writing` = W1 của FT); không thì kỹ năng đầu
 * tiên của mình còn ô trống, rồi kỹ năng đầu tiên của mình, rồi kỹ năng đầu tiên.
 */
function useKyNangChon(dsKn: string[], cuaMinh: (k: string) => boolean, conTrong: (k: string) => boolean, kn: string | null) {
  const tuUrl = () => (kn ? dsKn.find((k) => khopKn(k, kn)) ?? null : null);
  const macDinh = () => tuUrl()
    ?? dsKn.find((k) => cuaMinh(k) && conTrong(k)) ?? dsKn.find(cuaMinh) ?? dsKn[0] ?? null;
  const [chon, setChon] = useState<string | null>(macDinh);
  useEffect(() => {
    const k = tuUrl();
    if (k) setChon(k);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ theo `?kn=` trên đường dẫn
  }, [kn]);
  return [chon && dsKn.includes(chon) ? chon : macDinh(), setChon] as const;
}

/** Hàng chip kỹ năng: "L 3/8" — chữ tắt có tooltip tên đầy đủ (G-7); kỹ năng không phân công viền đứt. */
function HangChip({ ds, chon, onChon }: {
  ds: { k: string; cuaMinh: boolean; daNhap: number; tong: number }[];
  chon: string | null; onChon: (k: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 px-3 pt-3 pb-2" role="group" aria-label="Chọn kỹ năng để chấm">
      {ds.map(({ k, cuaMinh, daNhap, tong }) => {
        const on = k === chon;
        return (
          <button key={k} type="button" aria-pressed={on} onClick={() => onChon(k)}
            title={`${skillLabel(k)} — đã nhập ${daNhap}/${tong}${cuaMinh ? '' : `. ${KHONG_PHAN_CONG}`}`}
            className={`inline-flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center px-2 rounded-full border text-sm tabular-nums ${
              on ? 'bg-[color:var(--accent-soft)] border-[color:var(--accent-line)] text-[color:var(--accent-strong)]'
                : cuaMinh ? 'border-[color:var(--line-strong)] text-slate-200'
                  : 'border-dashed border-[color:var(--line-strong)] text-slate-500'}`}>
            <span className="font-semibold">{skillShort(k)}</span>
            <span className={on ? '' : 'text-slate-500'}>{daNhap}/{tong}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Enter/↓ xuống em kế tiếp CÓ Ô NHẬP, ↑ lên — cùng cách của lưới. */
function useDiChuyen() {
  const o = useRef<(HTMLInputElement | null)[]>([]);
  const di = (i: number, d: number) => {
    for (let r = i + d; r >= 0 && r < o.current.length; r += d) {
      const el = o.current[r];
      if (el) { el.focus(); el.select(); return; }
    }
  };
  const phim = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); di(i, 1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); di(i, -1); }
  };
  const dangKy = (i: number) => (el: HTMLInputElement | null) => { o.current[i] = el; };
  return { phim, dangKy };
}

/** Một dòng học viên: tên + TỐI ĐA một dòng phụ ngắn bên trái (G-3), một ô to bên phải. */
function DongHv({ studentId, active, ten, href, phu, phuTitle, phuDo = false, luu, children, nhan }: {
  studentId: number; active: boolean; ten: string; href: string;
  phu: string; phuTitle?: string; phuDo?: boolean; luu: React.ReactNode; children: React.ReactNode;
  /** R11: nhãn "Đã hoàn tất" cạnh tên khi đợt/bài của dòng này đã hoàn tất. */
  nhan?: React.ReactNode;
}) {
  return (
    <li data-hv={studentId}
      className={`flex items-center gap-3 px-3 py-2 min-h-[60px] border-t ${active ? 'row-active' : ''}`}
      style={{ borderColor: 'var(--line)' }}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 min-w-0">
          <Link className="link block truncate" to={href} title={ten}>{ten}</Link>
          {nhan}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0 tabular-nums">
          <span className={`truncate ${phuDo ? 'text-rose-300/80' : ''}`} title={phuTitle}>{phu}</span>
          {luu}
        </div>
      </div>
      {children}
    </li>
  );
}

/** R11: nhãn "Đã hoàn tất" cạnh tên — dùng chung cho dòng FT và dòng lớp thường của `MotKyNang`. */
function NhanHoanTat({ hoanTat, chuNhatCuoi }: { hoanTat?: boolean; chuNhatCuoi?: string | null }) {
  if (!hoanTat) return null;
  return <Info title={`Hết Chủ nhật ${ngay(chuNhatCuoi)}. ${KHOA_HOAN_TAT_HINT}`}>Đã hoàn tất</Info>;
}

/* ------------------------------------------------------------------ Lớp Fast Track */

const oCua = (r: FtSheet['rows'][number], k: string): Cell | undefined => r.cells.find((c) => c.skill === k);
/** Ô tính vào "{đã nhập}/{tổng}" của chip: kỹ năng bắt buộc, không huỷ, không vắng chờ xếp lại. "-" tính là đã nhập. */
const tinhFt = (c: Cell | undefined): c is Cell => !!c && c.required && c.progress !== 'cancelled' && c.progress !== 'absent';

function MotKyNangFt({ data, onReload, kn, hv }: { data: FtSheet; onReload: () => void; kn: string | null; hv: number | null }) {
  const minh = useMemo(() => new Set(data.editableSkills), [data.editableSkills]);
  const dsKn = useMemo(
    () => [...ENTRY_SKILLS.filter((k) => minh.has(k)), ...ENTRY_SKILLS.filter((k) => !minh.has(k))] as string[],
    [minh],
  );
  const conTrong = (k: string) => data.rows.some((r) => { const c = oCua(r, k); return !!c && oTrongFt(c); });
  const [chon, setChon] = useKyNangChon(dsKn, (k) => minh.has(k), conTrong, kn);
  const { phim, dangKy } = useDiChuyen();

  if (data.rows.length === 0 || !chon) return <LuoiFT data={data} onReload={onReload} kn={kn} hv={hv} />;

  const chips = dsKn.map((k) => {
    const cs = data.rows.map((r) => oCua(r, k)).filter(tinhFt);
    return { k, cuaMinh: minh.has(k), daNhap: cs.filter((c) => c.band !== null || !!c.noShow).length, tong: cs.length };
  });
  const nhieuMt = new Set(data.rows.map((r) => r.attemptNo)).size > 1;

  return (
    <div>
      <HangChip ds={chips} chon={chon} onChon={setChon} />
      <ul className="m-0 p-0 list-none">
        {data.rows.map((r, i) => (
          <DongFt key={r.attemptId} row={r} k={chon} nhieuMt={nhieuMt}
            active={hv !== null && r.studentId === hv} onReload={onReload}
            inputRef={dangKy(i)} onKeyDown={phim(i)} />
        ))}
      </ul>
    </div>
  );
}

function DongFt({ row, k, nhieuMt, active, onReload, inputRef, onKeyDown }: {
  row: FtSheet['rows'][number]; k: string; nhieuMt: boolean; active: boolean; onReload: () => void;
  inputRef: (el: HTMLInputElement | null) => void; onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const { save, status, lastError, retry } = useSaveScore(row.attemptId, onReload);
  const c = oCua(row, k);
  const kv = row.result?.expectation ?? null;
  const phu = [nhieuMt ? `MT${row.attemptNo}` : null, kv !== null ? `KV ${fmtBand(kv)}` : row.studentCode]
    .filter(Boolean).join(' · ');
  const laSoCau = k === 'listening' || k === 'reading';
  return (
    <DongHv studentId={row.studentId} active={active} ten={row.studentName} href={`/mock-test/${row.attemptId}`}
      phu={phu} phuTitle={kv !== null ? `Kỳ vọng (KV) của lượt này: ${fmtBand(kv)} · ${row.studentCode}` : undefined}
      luu={<DauLuu status={status} error={lastError} onRetry={retry} />}
      nhan={<NhanHoanTat hoanTat={row.hoanTat} chuNhatCuoi={row.chuNhatCuoi} />}>
      <div className="shrink-0 flex justify-end" data-kn={k} data-trong={c && oTrongFt(c) ? '1' : undefined}>
        {!c ? <span className="inline-flex items-center gap-1.5"><span className="text-slate-600">—</span><ChoNutDau /></span>
          : laSoCau
            ? <RawScoreInput lon cell={c} onSave={(p, o) => save(k, p, o)} inputRef={inputRef} onKeyDown={onKeyDown} />
            : <CriteriaButton lon cell={c} onSave={(p, o) => save(k, p, o)} />}
      </div>
    </DongHv>
  );
}

/* ------------------------------------------------------------------ Lớp thường */

type DongThuongRow = ThuongSheet['rows'][number];
/** Môn tính vào "{đã nhập}/{tổng}": có lịch, không huỷ, không vắng chờ xếp lại. "-" (đã dời) tính là đã nhập. */
const tinhThuong = (r: DongThuongRow, k: string) => {
  const s = lichCua(r, k);
  return !!s && s.progress !== 'cancelled' && s.progress !== 'absent';
};

function MotKyNangThuong({ data, onReload, kn, hv }: {
  data: ThuongSheet; onReload: () => void; kn: string | null; hv: number | null;
}) {
  const skills = data.programme.skills;
  const minh = (k: string) => data.editableSkills.includes(k) || data.rows.some((r) => lichCua(r, k)?.canEdit);
  const dsKn = [...skills.filter(minh), ...skills.filter((k) => !minh(k))];
  const conTrong = (k: string) => data.rows.some((r) => oThuong(r, k, data.today).trong);
  const [chon, setChon] = useKyNangChon(dsKn, minh, conTrong, kn);
  /* Ô "tổng số câu của đề" — lấy sẵn tổng hay gặp nhất của cột; gõ thì giữ đúng chữ đã gõ (riêng từng môn). */
  const [tongGo, setTongGo] = useState<Record<string, string>>({});
  const { phim, dangKy } = useDiChuyen();

  if (data.rows.length === 0 || !chon) return <LuoiThuong data={data} onReload={onReload} kn={kn} hv={hv} />;

  const chips = dsKn.map((k) => {
    const rs = data.rows.filter((r) => tinhThuong(r, k));
    return {
      k, cuaMinh: minh(k), tong: rs.length,
      daNhap: rs.filter((r) => ketQuaCua(r, k)?.score != null || !!lichCua(r, k)?.noShow).length,
    };
  });
  const macDinh = tongPhoBien(data.rows, chon);
  const chuTong = tongGo[chon] ?? (macDinh === null ? '' : String(macDinh));
  const tongCot = /^\d+$/.test(chuTong.trim()) && Number(chuTong) > 0 ? Number(chuTong) : null;
  const tenMon = data.skillLabels[chon] ?? skillLabel(chon);

  return (
    <div>
      <HangChip ds={chips} chon={chon} onChon={setChon} />
      {minh(chon) && (
        <label className="flex items-center justify-end gap-2 px-3 pb-2 text-xs text-slate-500">
          <span title="Tổng số câu của đề cả lớp làm. Ô tổng còn trống của từng em lấy sẵn số này; em làm đề khác thì sửa riêng ô đó.">
            Tổng số câu của đề
          </span>
          <input className="field w-[60px] h-11 px-1 text-center tabular-nums text-base" inputMode="numeric"
            value={chuTong} placeholder="—" aria-label={`Tổng số câu chung của ${tenMon}`}
            onChange={(e) => setTongGo((t) => ({ ...t, [chon]: e.target.value }))} />
        </label>
      )}
      <ul className="m-0 p-0 list-none">
        {data.rows.map((r, i) => (
          <DongThuongMot key={r.attemptId} row={r} k={chon} sheet={data} tongCot={tongCot}
            active={hv !== null && r.studentId === hv} onReload={onReload}
            inputRef={dangKy(i)} onKeyDown={phim(i)} />
        ))}
      </ul>
    </div>
  );
}

function DongThuongMot({ row, k, sheet, tongCot, active, onReload, inputRef, onKeyDown }: {
  row: DongThuongRow; k: string; sheet: ThuongSheet; tongCot: number | null; active: boolean; onReload: () => void;
  inputRef: (el: HTMLInputElement | null) => void; onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const { luu, dau, status, lastError, retry } = useLuuThuong(row.attemptId, onReload);
  const { s, canEdit, trong, dung, chuDung, quaHan, cell } = oThuong(row, k, sheet.today);
  const tenMon = sheet.skillLabels[k] ?? skillLabel(k);
  /*
   * MỘT dòng phụ (G-3): ô mang "-" nói tuần mới (Q17: lớp thường không đếm ngược) → quá hạn chấm → chưa tới tuần thi
   * → kết quả của ô đã có điểm ("Đạt · 82,5%" — trên lưới câu này nằm dưới hai số; ở đây nằm dưới tên để mọi dòng cao
   * bằng nhau) → mã học viên.
   */
  const ketQua = datPhanTram(cell.ketQua, cell.tiLe);
  const phu = (cell.dau && cell.diem === null && cell.tuanHienTai ? `Đã dời sang ${cell.tuanHienTai}` : null)
    ?? quaHan
    ?? (cell.chuaToiTuan && cell.tuanHienTai ? `Thi ${cell.tuanHienTai}` : null)
    ?? ketQua
    ?? row.studentCode;
  return (
    <DongHv studentId={row.studentId} active={active} ten={row.studentName} href={`/hoc-vien/${row.studentId}`}
      phu={phu} phuTitle={`${tenMon} · ${row.studentCode}`} phuDo={phu === ketQua && cell.ketQua === 'fail'}
      luu={<DauLuu status={status} error={lastError} onRetry={retry} />}
      nhan={<NhanHoanTat hoanTat={row.hoanTat} chuNhatCuoi={row.chuNhatCuoi} />}>
      <div className="shrink-0 flex justify-end" data-kn={k} data-trong={trong ? '1' : undefined}>
        {dung || !s ? (
          <span className="inline-flex items-center gap-1">
            <span className="text-[11px] text-slate-500" title={`${tenMon}: ${chuDung ?? 'không có lịch'}`}>
              {chuDung ?? '—'}
            </span>
            {/* Giữ chỗ nút "−" để chữ trạng thái thẳng cột với ô nhập của các dòng khác. */}
            <ChoNutDau />
          </span>
        ) : (
          <ODiemThuong lon tongLaySan cell={cell} tongCot={tongCot} canEdit={canEdit} tenMon={tenMon} tenHv={row.studentName}
            onSave={(p, o) => luu(k, p, o)} onDau={(bat) => dau(k, bat)} inputRef={inputRef} onKeyDown={onKeyDown} />
        )}
      </div>
    </DongHv>
  );
}
