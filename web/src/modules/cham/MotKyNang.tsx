/**
 * CHẤM TRÊN ĐIỆN THOẠI — MỘT KỸ NĂNG MỘT LÚC (mockup 05a §3, phương án A).
 *
 * Đúng cách giáo viên chấm thật: xong cả lớp một kỹ năng rồi mới sang kỹ năng khác. Không có bảng năm cột, không cuộn
 * ngang. Trên cùng là hàng chip chọn kỹ năng kèm "{đã nhập}/{tổng}"; dưới là danh sách học viên, mỗi em MỘT ô to.
 *
 * KHÔNG CÓ LUẬT THỨ HAI: ô điểm là chính các ô của lưới (`ODiemMt` → hộp nhập điểm, tấm trượt từ dưới; `ODiemThuong`) ở cỡ `lon`,
 * lưu bằng chính `useSaveScore` / `useLuuThuong`. Nên "-" = Vắng, ô đã có điểm thêm lý do tuỳ chọn (RB-5, T7), "Lưu · em tiếp ›"
 * (FT) / Enter↓ (lớp thường) xuống em kế tiếp, Esc huỷ — y hệt trên máy tính.
 *
 * Kỹ năng mình được phân công đứng trước; kỹ năng khác vẫn chọn được để đối chiếu, nhưng ô chỉ đọc.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ENTRY_SKILLS, nhanBai, ngay, tenMon, tenMonNgan, tuanLich, type NguoiChon,
} from '@shared/domain/index.ts';
import { dotGvCham, duongDotTest } from '@shared/domain/index.ts';
import { fmtBand } from '../../lib/format.ts';
import { Info, Level } from '../../ui/ui.tsx';
import {
  ChoNutDau, KHOA_HOAN_TAT_HINT, ODiemThuong, apDiemVuaLuu, datPhanTram, suaDuoc, useSaveScore, type Cell,
} from '../fasttrack/ScoreEntry.tsx';
import { NutNhanXet, ODiemMt } from '../fasttrack/HopNhapDiem.tsx';
import { GOI_Y_COT_MT, NutGvCham, useGvChamCot } from './GvCham.tsx';
import { DongThi, nhanKyNangFt } from './DongThi.tsx';
import { DauLuu, DauO, LuoiFT, VIEN_LOI, chiConHuy, khacTuanFt, khopKn, nutTuanGoc, oTrongFt, type FtSheet, type HangMo } from './LuoiFT.tsx';
import {
  LuoiThuong, ketQuaCua, lichCua, oThuong, tongPhoBien, useLuuThuong, type ThuongSheet,
} from './LuoiThuong.tsx';
import { dich, t } from '@shared/i18n/index.ts';

const KHONG_PHAN_CONG = t('Bạn không được phân công kỹ năng này');

type Chung = { onReload: () => void; kn?: string | null; hv?: number | null };

export function MotKyNang(p: Chung & ({ mode: 'ielts_band'; data: FtSheet; hangMo?: HangMo[]; tuanDangXem?: string | null } | { mode: 'ratio'; data: ThuongSheet; anNutTao?: boolean; tuanDangXem?: string | null })) {
  return p.mode === 'ielts_band'
    ? <MotKyNangFt data={p.data} onReload={p.onReload} kn={p.kn ?? null} hv={p.hv ?? null} hangMo={p.hangMo ?? []} tuanDangXem={p.tuanDangXem ?? null} />
    : <MotKyNangThuong data={p.data} onReload={p.onReload} kn={p.kn ?? null} hv={p.hv ?? null} anNutTao={p.anNutTao} tuanDangXem={p.tuanDangXem ?? null} />;
}

/**
 * KỸ NĂNG ĐANG CHỌN. Mở từ Lịch Test / Việc cần làm với `?kn=` thì chọn sẵn kỹ năng đó (`writing` = W1 của FT); không thì kỹ năng đầu
 * tiên của mình còn ô trống, rồi kỹ năng đầu tiên của mình, rồi kỹ năng đầu tiên.
 *
 * OV-11a (CV-5): `kn` truyền vào chỉ đặt chip LẦN ĐẦU; sau đó chỉ `?kn=` trên đường dẫn thật đổi mới đặt lại. `kn` của việc ở Công việc đổi
 * sau mỗi lần lưu (`/my-work` tải lại) — chip đang chọn GIỮ NGUYÊN, điểm không vào nhầm kỹ năng.
 */
function useKyNangChon(dsKn: string[], cuaMinh: (k: string) => boolean, conTrong: (k: string) => boolean, kn: string | null) {
  const tim = (x: string | null) => (x ? dsKn.find((k) => khopKn(k, x)) ?? null : null);
  const macDinh = () => tim(kn)
    ?? dsKn.find((k) => cuaMinh(k) && conTrong(k)) ?? dsKn.find(cuaMinh) ?? dsKn[0] ?? null;
  const [chon, setChon] = useState<string | null>(macDinh);
  const knUrl = useSearchParams()[0].get('kn');
  useEffect(() => {
    const k = tim(knUrl);
    if (k) setChon(k);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ theo `?kn=` trên đường dẫn
  }, [knUrl]);
  return [chon && dsKn.includes(chon) ? chon : macDinh(), setChon] as const;
}

/** Hàng chip kỹ năng: "L 3/8" — chữ tắt có tooltip tên đầy đủ (G-7); kỹ năng không phân công viền đứt. */
function HangChip({ ds, chon, onChon, ct = null }: {
  ds: { k: string; cuaMinh: boolean; daNhap: number; tong: number }[];
  chon: string | null; onChon: (k: string) => void;
  /** Mã chương trình lớp (lớp thường) — tên môn FOU G+V/P (MH2). FT: null. */
  ct?: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-1 px-3 pt-3 pb-2" role="group" aria-label={t('Chọn kỹ năng để chấm')}>
      {ds.map(({ k, cuaMinh, daNhap, tong }) => {
        const on = k === chon;
        return (
          <button key={k} type="button" aria-pressed={on} onClick={() => onChon(k)}
            title={t('{tenMon} — đã nhập {daNhap}/{tong}{x}', { tenMon: tenMon(ct, k), daNhap, tong, x: cuaMinh ? '' : `. ${KHONG_PHAN_CONG}` })}
            className={`inline-flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center px-2 rounded-full border text-sm tabular-nums ${
              on ? 'bg-[color:var(--accent-soft)] border-[color:var(--accent-line)] text-[color:var(--accent-strong)]'
                : cuaMinh ? 'border-[color:var(--line-strong)] text-slate-200'
                  : 'border-dashed border-[color:var(--line-strong)] text-slate-500'}`}>
            <span className="font-semibold">{tenMonNgan(ct, k)}</span>
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
function DongHv({ studentId, active, ten, href, phu, phuTitle, phuDo = false, luu, children, nhan, thi, mo = false }: {
  studentId: number; active: boolean; ten: string; href: string;
  /** OV-1d: em đã Kết thúc học / Lưu trữ — dòng mờ. */
  mo?: boolean;
  phu: string; phuTitle?: string; phuDo?: boolean; luu: React.ReactNode; children: React.ReactNode;
  /** LUAT-34: nhãn "Đủ điểm" (trạng thái, không khoá) cạnh tên khi đợt/bài của dòng này đã hoàn tất. */
  nhan?: React.ReactNode;
  /** Dòng "Thi W1 OCT" — chỉ hiện ở Điểm theo lớp (`DongThiContext`). */
  thi?: React.ComponentProps<typeof DongThi>['muc'];
}) {
  return (
    <li data-hv={studentId}
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 min-h-[60px] border-t ${mo ? 'row-muted' : ''} ${active ? 'row-active' : ''}`}
      style={{ borderColor: 'var(--line)' }}>
      {/* OV-14b: tên giữ ≥ 8rem (375: không vỡ từng chữ cái) — cụm ô chật thì xuống dòng dưới tên. */}
      <div className="min-w-[8rem] flex-1">
        <div className="min-w-0">
          <Link className="link block break-words max-sm:flex max-sm:min-h-[44px] max-sm:items-center" to={href} title={ten}>{ten}</Link>
          {nhan && <div className="mt-0.5">{nhan}</div>}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0 tabular-nums">
          <span className={`truncate ${phuDo ? 'text-rose-300' : ''}`} title={phuTitle}>{phu}</span>
          {luu}
        </div>
        {thi && <DongThi muc={thi} />}
      </div>
      {children}
    </li>
  );
}

/** LUAT-34: nhãn "Đủ điểm" (trạng thái, không khoá) cạnh tên — dùng chung cho dòng FT và dòng lớp thường của `MotKyNang`. */
function NhanHoanTat({ hoanTat, chuNhatCuoi }: { hoanTat?: boolean; chuNhatCuoi?: string | null }) {
  if (!hoanTat) return null;
  return <Info title={t('Hết Chủ nhật {ngay}. {x}', { ngay: ngay(chuNhatCuoi), x: KHOA_HOAN_TAT_HINT })}>{t('Đủ điểm')}</Info>;
}

/* ------------------------------------------------------------------ Lớp Fast Track */

const oCua = (r: FtSheet['rows'][number], k: string): Cell | undefined => r.cells.find((c) => c.skill === k);
/** Ô tính vào "{đã nhập}/{tổng}" của chip: kỹ năng bắt buộc, không huỷ, không vắng chờ xếp lại. "-" tính là đã nhập. */
const tinhFt = (c: Cell | undefined): c is Cell => !!c && c.required && c.progress !== 'cancelled' && c.progress !== 'absent';

function MotKyNangFt({ data, onReload, kn, hv, hangMo, tuanDangXem }: {
  data: FtSheet; onReload: () => void; kn: string | null; hv: number | null; hangMo: HangMo[]; tuanDangXem: string | null;
}) {
  const minh = useMemo(() => new Set(data.editableSkills), [data.editableSkills]);
  const dsKn = useMemo(
    () => [...ENTRY_SKILLS.filter((k) => minh.has(k)), ...ENTRY_SKILLS.filter((k) => !minh.has(k))] as string[],
    [minh],
  );
  /* CA3-9: 375 = 1440 — ô thi tuần khác tuần đang xem (`khacTuanFt`, như lưới) ghi mã tuần, không "Nhập", không đếm vào chip. */
  const khac = (c: Cell) => khacTuanFt(c, tuanDangXem);
  const tuanXem = tuanDangXem ?? data.period?.weekStart ?? null;
  const conTrong = (k: string) => data.rows.some((r) => { const c = oCua(r, k); return !r.ngungHoc && !!c && oTrongFt(c) && !khac(c); });
  const [chon, setChon] = useKyNangChon(dsKn, (k) => minh.has(k), conTrong, kn);
  /* Hộp đang mở (lượt) — "Lưu · em tiếp ›" sang em kế có ô mở được của kỹ năng đang chọn. */
  const [mo, setMo] = useState<number | null>(null);
  const [moChon, setMoChon] = useState<string | null>(null);
  /* K4-24: GV chấm chọn một lần cho cả lớp × tuần — cùng ô nhớ với tiêu đề cột S của lưới máy tính. */
  const dot = dotGvCham(data.period?.id, data.rows.map((r) => r.attemptNo));
  const [gvCot, setGvCot] = useGvChamCot(data.classId, dot);

  if (data.rows.length === 0 || !chon) return <LuoiFT data={data} onReload={onReload} kn={kn} hv={hv} hangMo={hangMo} />;

  const chips = dsKn.map((k) => {
    const cs = data.rows.filter((r) => !r.ngungHoc).map((r) => oCua(r, k)).filter(tinhFt).filter((c) => !khac(c));   // OV-1d: em đã Kết thúc học / Lưu trữ không tính
    return { k, cuaMinh: minh.has(k), daNhap: cs.filter((c) => c.band !== null || !!c.noShow).length, tong: cs.length };
  });
  const nhieuMt = new Set(data.rows.map((r) => r.attemptNo)).size > 1;
  /* OV-11a (TE-12): cùng bộ lọc lưới máy tính — hàng chỉ còn ô "Đã huỷ" ở tuần đang xem không hiện. */
  const rows = data.rows.filter((r) => !chiConHuy(r, tuanDangXem));

  return (
    <div>
      <HangChip ds={chips} chon={chon} onChon={setChon} />
      {/* VIEC-NHO-2: hàng "GV chấm S [tên ▾]" có viền ngay dưới chip — cả Điểm theo lớp xem theo MT (nhớ theo lớp × MT). */}
      {chon === 'speaking' && minh.has('speaking') && dot && (
        <NutGvCham hang nhan={t('GV chấm S')} value={gvCot} onChange={setGvCot} goiY={data.period ? undefined : GOI_Y_COT_MT} />
      )}
      <ul className="m-0 p-0 list-none">
        {rows.map((r, i) => (
          <DongFt key={r.attemptId} row={r} k={chon} nhieuMt={nhieuMt} lop={data.classCode} tuanDangXem={tuanDangXem} tuanXem={tuanXem}
            active={hv !== null && r.studentId === hv} onReload={onReload} gvMacDinh={gvCot}
            mo={mo === r.attemptId && moChon === chon} onMo={(m) => { setMo(m ? r.attemptId : null); setMoChon(chon); }}
            onTiep={() => {
              const ke = rows.slice(i + 1).find((x) => { const c = oCua(x, chon); return !x.ngungHoc && !!c && suaDuoc(c) && !khac(c); });
              setMo(ke?.attemptId ?? null);
            }} />
        ))}
        {/* PR-DL: em chưa có lịch lượt này — hàng mờ cuối danh sách, không có ô. */}
        {hangMo.map((h) => (
          <li key={`mo-${h.studentId}`} data-hv={h.studentId} className="px-3 py-2 min-h-[60px] border-t text-slate-500"
            style={{ borderColor: 'var(--line)' }}>
            <div className="truncate" title={h.ten}>{h.ten}</div>
            <div className="text-xs text-slate-400">{h.chu}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DongFt({ row, k, nhieuMt, lop, active, onReload, gvMacDinh, mo, onMo, onTiep, tuanDangXem, tuanXem }: {
  row: FtSheet['rows'][number]; k: string; nhieuMt: boolean; lop: string; active: boolean; onReload: () => void;
  gvMacDinh: NguoiChon | null; tuanDangXem: string | null; tuanXem: string | null;
  mo: boolean; onMo: (mo: boolean) => void; onTiep: () => void;
}) {
  const { save, status, lastError, retry, o, loi, luuLai, soLoi, coGuiLai, vuaLuu, xoaVuaLuu } = useSaveScore(row.attemptId, onReload, row.studentName);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- bảng tải lại (dòng mới) thì bỏ điểm tạm
  useEffect(() => { xoaVuaLuu(); }, [row]);
  const c0 = oCua(row, k);
  const c = c0 && apDiemVuaLuu(c0, vuaLuu[k]);
  const kv = row.result?.expectation ?? null;
  const phu = [nhieuMt ? `MT${row.attemptNo}` : null, kv !== null ? t('KV {x}', { x: fmtBand(kv) }) : null]
    .filter(Boolean).join(' · ');
  return (
    <DongHv studentId={row.studentId} active={active} ten={row.studentName} href={duongDotTest({ id: row.attemptId }, k)}
      phu={phu} phuTitle={kv !== null ? t('Kỳ vọng (KV) của lượt này: {fmtBand}', { fmtBand: fmtBand(kv) }) : undefined}
      luu={<DauLuu lon status={status} error={lastError} onRetry={coGuiLai ? retry : undefined} soLoi={soLoi} />}
      mo={!!row.ngungHoc}
      nhan={row.ngungHoc ? <Level tone="muted" title={row.cells[0]?.lyDoKhoa && dich(row.cells[0].lyDoKhoa)}>{dich(row.ngungHoc)}</Level> : <NhanHoanTat hoanTat={row.hoanTat} chuNhatCuoi={row.chuNhatCuoi} />}
      thi={row.cells.filter((x) => x.required && x.progress !== 'cancelled')
        .map((x) => ({ nhan: nhanKyNangFt(x.skill), weekStart: x.weekStart ?? null }))}>
      <div className={`shrink-0 flex items-center justify-end gap-1 rounded-md ${o[k] === 'loi' ? VIEN_LOI : ''}`} data-kn={k}
        data-trong={!row.ngungHoc && c && oTrongFt(c) && !khacTuanFt(c, tuanDangXem) ? '1' : undefined} data-luu={o[k]}>
        <DauO lon tt={o[k]} loi={loi[k]} onLuuLai={() => luuLai(k)} />
        {!c ? <span className="text-slate-500">—</span>
          /* CA3-9: cùng điều kiện ô tuần khác của lưới máy tính (`LuoiFT` › `oKhacTuan`). */
          : khacTuanFt(c, tuanDangXem) && !nutTuanGoc(c) ? (
            <span className="text-xs tabular-nums text-slate-500">{c.daChot?.doiSang ? t('Đã dời sang {doiSang}', { doiSang: c.daChot.doiSang }) : tuanLich(c.weekStart)}</span>
          ) : (
          <ODiemMt lon cell={c} mo={mo} onMo={onMo} onTiep={onTiep} onSave={(p, x) => save(k, p, x)} tuanXem={tuanXem}
            gvMacDinh={k === 'speaking' ? gvMacDinh : null}
            ctx={{ tenHv: row.studentName, lop, luot: `MT${row.attemptNo}`, kyVong: kv, mt0: !!row.mt0Sos,
              bandTaskKia: k === 'writing1' ? oCua(row, 'writing2')?.band ?? null : k === 'writing2' ? oCua(row, 'writing1')?.band ?? null : undefined }} />
        )}
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

function MotKyNangThuong({ data, onReload, kn, hv, anNutTao, tuanDangXem }: {
  data: ThuongSheet; onReload: () => void; kn: string | null; hv: number | null; anNutTao?: boolean; tuanDangXem: string | null;
}) {
  const skills = data.programme.skills;
  const minh = (k: string) => data.editableSkills.includes(k) || data.rows.some((r) => lichCua(r, k)?.canEdit);
  const dsKn = [...skills.filter(minh), ...skills.filter((k) => !minh(k))];
  const conTrong = (k: string) => data.rows.some((r) => oThuong(r, k, data.today).trong);
  const [chon, setChon] = useKyNangChon(dsKn, minh, conTrong, kn);
  /* Ô "tổng số câu của đề" — lấy sẵn tổng hay gặp nhất của cột; gõ thì giữ đúng chữ đã gõ (riêng từng môn). */
  const [tongGo, setTongGo] = useState<Record<string, string>>({});
  const { phim, dangKy } = useDiChuyen();

  if (data.rows.length === 0 || !chon) return <LuoiThuong data={data} onReload={onReload} kn={kn} hv={hv} anNutTao={anNutTao} />;

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
  const tenMonChon = tenMon(data.programme.code, chon);

  return (
    <div>
      {skills.length === 1 ? (
        /* PF6 (Pre FOU): một môn — không có gì để chọn, nên không hàng chip; một dòng nói bài nào, môn nào. */
        <div className="flex min-h-[44px] items-center gap-1.5 px-3 pt-3 pb-2 text-sm">
          <span className="font-semibold text-slate-100">{nhanBai(data.rows[0].kind)}</span>
          <span className="text-slate-500" aria-hidden>·</span>
          <span className="text-slate-200">{tenMonChon}</span>
          <span className="ml-auto tabular-nums text-xs text-slate-500">{chips[0].daNhap}/{chips[0].tong}</span>
        </div>
      ) : <HangChip ds={chips} chon={chon} onChon={setChon} ct={data.programme.code} />}
      {minh(chon) && (
        <label className="flex items-center justify-end gap-2 px-3 pb-2 text-xs text-slate-500">
          <span title={t('Tổng số câu của đề cả lớp làm. Ô tổng còn trống của từng em lấy sẵn số này; em làm đề khác thì sửa riêng ô đó.')}>
            {t('Tổng số câu của đề')}
          </span>
          <input className="field w-[60px] h-11 px-1 text-center tabular-nums text-base" inputMode="numeric"
            value={chuTong} placeholder="—" aria-label={t('Tổng số câu chung của {tenMonChon}', { tenMonChon })}
            onChange={(e) => setTongGo((t) => ({ ...t, [chon]: e.target.value }))} />
        </label>
      )}
      <ul className="m-0 p-0 list-none">
        {data.rows.map((r, i) => (
          <DongThuongMot key={r.attemptId} row={r} k={chon} sheet={data} tongCot={tongCot} tuanDangXem={tuanDangXem}
            active={hv !== null && r.studentId === hv} onReload={onReload}
            inputRef={dangKy(i)} onKeyDown={phim(i)} />
        ))}
      </ul>
    </div>
  );
}

function DongThuongMot({ row, k, sheet, tongCot, active, onReload, inputRef, onKeyDown, tuanDangXem }: {
  row: DongThuongRow; k: string; sheet: ThuongSheet; tongCot: number | null; active: boolean; onReload: () => void; tuanDangXem: string | null;
  inputRef: (el: HTMLInputElement | null) => void; onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const { luu, dau, nhanXet, status, lastError, retry, o, loi, luuLai, soLoi, loiNhap, coGuiLai } = useLuuThuong(row.attemptId, onReload, sheet.programme.code, row.studentName);
  const { s, canEdit, trong, dung, chuDung, quaHan, cell } = oThuong(row, k, sheet.today);
  const tenMonO = tenMon(sheet.programme.code, k);
  /*
   * MỘT dòng phụ (G-3): ô mang "-" nói tuần mới (Q17: lớp thường không đếm ngược) → quá hạn chấm → chưa tới tuần thi
   * → kết quả của ô đã có điểm ("Đạt · 82,5%" — trên lưới câu này nằm dưới hai số; ở đây nằm dưới tên để mọi dòng cao
   * bằng nhau) → trống (OV-13f: không hiện mã HV).
   */
  const ketQua = datPhanTram(cell.ketQua, cell.tiLe);
  const phu = (cell.khongDuThi ? t('Vắng') : null)
    ?? (cell.dau && cell.diem === null && cell.tuanHienTai ? t('Đã dời sang {tuanHienTai}', { tuanHienTai: cell.tuanHienTai }) : null)
    ?? quaHan
    ?? (cell.chuaToiTuan && cell.tuanHienTai ? t('Làm bài {tuan}', { tuan: cell.tuanHienTai }) : null)
    ?? ketQua
    ?? '';
  return (
    <DongHv studentId={row.studentId} active={active} ten={row.studentName} href={`/hoc-vien/${row.studentId}`}
      phu={phu} phuTitle={tenMonO} phuDo={phu === ketQua && cell.ketQua === 'fail'}
      luu={<DauLuu lon status={status} error={lastError} onRetry={coGuiLai ? retry : undefined} soLoi={soLoi} />}
      nhan={<NhanHoanTat hoanTat={row.hoanTat} chuNhatCuoi={row.chuNhatCuoi} />}
      thi={row.skillSchedule.filter((x) => x.progress !== 'cancelled' && x.progress !== 'skipped')
        .map((x) => ({ nhan: tenMonNgan(sheet.programme.code, x.skill), weekStart: x.weekStart }))}>
      <div className={`shrink-0 flex items-center justify-end gap-1 rounded-md ${o[k] === 'loi' ? VIEN_LOI : ''}`} data-kn={k}
        data-trong={trong ? '1' : undefined} data-luu={o[k]}>
        <DauO lon tt={o[k]} loi={loi[k]} onLuuLai={() => luuLai(k)} />
        {dung || !s ? (
          <span className="inline-flex items-center gap-1">
            <span className="text-xs text-slate-500" title={`${tenMonO}: ${chuDung ?? t('không có lịch')}`}>
              {chuDung ?? '—'}
            </span>
            {/* Giữ chỗ nút "−" để chữ trạng thái thẳng cột với ô nhập của các dòng khác. */}
            <ChoNutDau />
          </span>
        ) : (
          <ODiemThuong lon tongLaySan cell={{ ...cell, oTuanCu: !!tuanDangXem && s?.movedFromStart === tuanDangXem }} tongCot={tongCot} canEdit={canEdit} tenMon={tenMonO} tenHv={row.studentName}
            onSave={(p, o) => luu(k, p, o)} onDau={(bat) => dau(k, bat)} onLoiNhap={(x) => loiNhap(k, x)}
            inputRef={inputRef} onKeyDown={onKeyDown} />
        )}
        {s && (s.nhanXetDuoc ?? canEdit) && !dung && (
          <NutNhanXet lon tenMon={tenMonO} giaTri={s.nhanXet ?? null}
            phu={[row.studentName, sheet.class.code, s.weekStart ? tuanLich(s.weekStart) : null].filter(Boolean).join(' · ')}
            onLuu={(v) => nhanXet(k, v)} />
        )}
      </div>
    </DongHv>
  );
}
