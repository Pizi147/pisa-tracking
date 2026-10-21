import { useContext, useState, type ReactNode } from 'react';
import { NhanTrangThai, Outcome } from '../../ui/ui.tsx';
import { IconCanhBao, IconDat, IconGap } from '../../ui/BieuTuong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { fmtBand } from '../../lib/format.ts';
import { DongXinYKien } from './DongXinYKien.tsx';
import {
  CHUA_CO_HAN, OUTCOME_MARK, OUTCOME_TONE, chuKetQuaPa, chuKhoangPa, dangChay, deadlineView, tienDoCase, xepTheKyNang,
} from '@shared/domain/index.ts';
import {
  DongMt, NhanLoai, NhanTamDung, SCORE_CHIP_ROW, TamDungCtx, TenCase, chuBuoi, chuNguoi, gapText,
  type CaseCard, type MoCase, type Plan, type SkillBoardRow,
} from './SkillBoard.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * BẢNG KỸ NĂNG TRÊN ĐIỆN THOẠI (< 640 px, UX-D3, mockup 24 E) — mỗi kỹ năng MỘT THẺ, Case gấp lên trước (`xepTheKyNang`), kỹ năng đạt thu
 * thành một dòng. Việc và nút nằm ngay dưới điểm — không cuộn ngang để tìm cột "Việc tiếp". Cùng luật Case khung rỗng / PA khối đặc với bảng.
 * Nằm ở: Học viên & Lớp › hồ sơ học viên › tab Học thuật › "Tiến độ theo kỹ năng" (chỉ vẽ khi `useDienThoai()`; bảng không vẽ rồi ẩn).
 */
export function TheKyNangDs({ rows, onMoCase }: { rows: SkillBoardRow[]; onMoCase: (caseId: number, o?: MoCase) => void }) {
  return (
    <div className="flex flex-col gap-2 p-2.5">
      {xepTheKyNang(rows.filter((r) => !r.tuLopTruoc)).map(({ row, gon }) => (gon
        ? <TheGon key={row.category} row={row} onMoCase={onMoCase} />
        : <TheKyNang key={row.category} row={row} onMoCase={onMoCase} />))}
      {/* PR-UXF-b (R5-5): Case của lớp trước có tên môn khác — nhóm riêng cuối bảng, không nằm ở thẻ Writing / Speaking của chương trình mới. */}
      {rows.some((r) => r.tuLopTruoc) && <h3 className="m-0 px-1 pt-2 text-[12px] font-semibold  text-slate-400">{t('Case bàn giao')}</h3>}
      {rows.filter((r) => r.tuLopTruoc).map((row) => <TheKyNang key={`${row.category}@truoc`} row={row} onMoCase={onMoCase} />)}
    </div>
  );
}

function KhungThe({ children }: { children: ReactNode }) {
  return <article className="rounded-[10px] border bg-[color:var(--surface)] px-3 py-2.5" style={{ borderColor: 'var(--line)' }}>{children}</article>;
}

/** Kỹ năng đạt / không Case: một dòng `Listening · +0.5 · 6.0 ✓` — bấm mở thẻ đủ. */
function TheGon({ row, onMoCase }: { row: SkillBoardRow; onMoCase: (caseId: number, o?: MoCase) => void }) {
  const [mo, setMo] = useState(false);
  if (mo) return <TheKyNang row={row} onMoCase={onMoCase} onGap={() => setMo(false)} />;
  const diem = row.band === null ? null : row.ratio && row.total ? `${row.score}/${row.total}` : fmtBand(row.band);
  const phu = row.band === null ? t('chưa có điểm') : row.ratio ? (row.missed === false ? t('đạt') : '') : row.gap !== null ? `${gapText(row.gap)}${row.kck ? ' · KCK' : ''}` : row.kck ? 'KCK' : '';
  return (
    <button type="button" aria-expanded={false} onClick={() => setMo(true)}
      className="flex min-h-[44px] w-full items-center gap-2 rounded-[10px] border bg-[color:var(--surface)] px-3 text-left" style={{ borderColor: 'var(--line)' }}>
      <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-slate-100">{row.label}</span>
      {phu && <span className="text-[12px] text-slate-400">{phu}</span>}
      {diem !== null && <span className="font-bold tabular-nums text-slate-100">{diem}</span>}
      {row.missed === false && <span className="text-ok"><IconDat /></span>}
      <span className="text-slate-400"><IconGap mo={false} /></span>
    </button>
  );
}

/** Thẻ kỹ năng đủ: tên + chip điểm · `MT1 · kỳ vọng 5.5 · thiếu 0.5` · mỗi Case một khối, PA thụt vào (khối đặc). */
function TheKyNang({ row, onMoCase, onGap }: { row: SkillBoardRow; onMoCase: (caseId: number, o?: MoCase) => void; onGap?: () => void }) {
  const mo = row.cases.filter((c) => c.status !== 'done');
  return (
    <KhungThe>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[14px] font-extrabold text-slate-100">{row.label}</span>
        {!row.tuLopTruoc && (
          <span className={`inline-flex items-center rounded-md border px-2 text-[15px] font-bold leading-6 tabular-nums ${SCORE_CHIP_ROW(row)}`}>
            {row.band === null ? '—' : row.ratio && row.total ? `${row.score}/${row.total}` : fmtBand(row.band)}
          </span>
        )}
        {onGap && (
          <button type="button" aria-label={t('Thu gọn {label}', { label: row.label })} onClick={onGap} className="inline-flex h-11 w-11 items-center justify-center border-0 bg-transparent text-slate-400">
            <IconGap mo />
          </button>
        )}
      </div>
      <div className="mt-0.5 text-[12px] text-slate-400">{row.tuLopTruoc ? <>{t('từ {tuLopTruoc}', { tuLopTruoc: row.tuLopTruoc })}</> : <><DongMt row={row} />{!row.ratio && row.gap !== null && <> · {gapText(row.gap)}</>}</>}</div>
      {mo.length === 0 && <div className="mt-1 text-[12px] text-slate-400">{t('Không có Case mở')}</div>}
      {mo.map((c) => <KhoiCase key={c.id} c={c} onMoCase={onMoCase} />)}
    </KhungThe>
  );
}

/** Nút động từ của việc tiếp (clarify: không "Xác nhận" trơn). */
const NUT_VIEC: Record<NonNullable<MoCase['viec']>, string> = {
  'xac-nhan': t('Xác nhận Case'), 'xac-nhan-pa': t('Xác nhận PA'), 'ghi-ket-qua': t('Kết quả'), 'them-pa': t('Thêm PA'),
};

function KhoiCase({ c, onMoCase }: { c: CaseCard; onMoCase: (caseId: number, o?: MoCase) => void }) {
  const { homNay } = useNgayNghiepVu();
  const tamDung = useContext(TamDungCtx);
  const tt = c.trangThaiV4;
  const td = tienDoCase(c.plans, c);
  const v = c.viecTiep;
  const han = v?.loaiHan && v.han ? deadlineView({ kind: v.loaiHan, due: v.han, today: homNay }) : null;
  const viecMo: MoCase | undefined = !v ? undefined
    : v.chu === 'Xác nhận Case' || v.chu === 'Ghi nhận xét' ? { viec: 'xac-nhan' }   // OV-12c: Ngăn Case mở đúng khối theo trạng thái
    : v.chu.startsWith('Xác nhận PA') ? { viec: 'xac-nhan-pa', paId: v.paId }
    : v.loaiHan === 'cap-nhat-pa' ? { viec: 'ghi-ket-qua', paId: v.paId } : undefined;
  return (
    <div className="mt-2 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
      <div className="flex min-w-0 items-center gap-1.5 text-[13px] font-bold text-slate-100">
        <NhanLoai loai="Case" /><span className="min-w-0 truncate max-sm:whitespace-normal max-sm:overflow-visible max-sm:break-words"><TenCase c={c} /></span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-slate-400">
        {tamDung && tt.t === 'qua-han' ? <NhanTamDung tu={tamDung} /> : <NhanTrangThai t={tt.t} title={dich(tt.chu)} chu={tt.k === 'tam' ? dich(tt.chu) : undefined} />}
        {tt.k !== 'tam' && <span>{tt.k === 'dang-lam' ? td.text : dich(tt.chu)}</span>}
        {/* OV-13a: Case tạm không có việc tiếp — vẫn mở được để xem / sửa. */}
        {tt.k === 'tam' && <button type="button" className="btn ml-auto min-h-[44px]" onClick={() => onMoCase(c.id)}>{t('Mở Case')}</button>}
      </div>
      {c.plans.filter(dangChay).map((p) => <KhoiPa key={p.id} p={p} c={c} onMoCase={onMoCase} />)}
      {v && (
        <div className="mt-2 flex flex-col gap-1.5">
          <span className="text-[12px] text-slate-200">
            {/* Ghi kết quả: dạng ngắn theo tuần ("Ghi kết quả tuần W4 SEP") — tên PA đã ở khối PA ngay trên. */}
            {v.loaiHan === 'cap-nhat-pa' && han ? han.viec : dich(v.chu)}
            {/* Em Tạm dừng: mọi hạn đang dừng → nhãn vàng thay hạn (cùng luật DongHan ở bảng). */}
            {tamDung && han ? <> <NhanTamDung tu={tamDung} /></> : <>
              {/* OV-11d (CA2-9): chữ hạn cùng luật bảng máy tính (`DongHan`): quá hạn ⚠ · hôm nay · hạn hết dd/mm. */}
              {han?.quaHan ? <span className="inline-flex items-center gap-1 font-semibold text-bad"> · <IconCanhBao />{han.quaHan}</span>
                : han?.homNay ? <span className="font-semibold text-soon"> {t('· hôm nay')}</span>
                : han && han.han !== CHUA_CO_HAN && <span className={han.ganHan ? 'font-semibold text-soon' : 'text-slate-400'}> · {han.han}</span>}
            </>}
          </span>
          {viecMo && (viecMo.viec === 'ghi-ket-qua' ? !!c.plans.find((p) => p.id === viecMo.paId)?.ghiDuoc : v.chu === 'Xác nhận Case' ? c.coTheXacNhanCase : c.canEdit)
            ? <button type="button" className="btn btn-primary min-h-[44px] w-full" onClick={() => onMoCase(c.id, viecMo)}>{v.chu.startsWith('Kết quả cuối') ? t('Kết quả cuối') : v.chu === 'Ghi nhận xét' ? t('Ghi nhận xét') : NUT_VIEC[viecMo.viec!]}</button>
            : (
              <span className="flex items-center justify-between gap-2 text-[12px] text-slate-400">
                <span className="min-w-0 truncate">{c.nguoiLam?.ten ? t('Việc của {ten}', { ten: c.nguoiLam.ten }) : t('Việc của người khác')}</span>
                <button type="button" className="btn min-h-[44px]" onClick={() => onMoCase(c.id)}>{t('Mở Case')}</button>
              </span>
            )}
        </div>
      )}
    </div>
  );
}

/** Khối PA: thụt vào, nền `surface-2`, đường nối từ Case (khối đặc), `người · đến MT2 · W4 OCT`, kết quả gần nhất. */
function KhoiPa({ p, c, onMoCase }: { p: Plan; c: CaseCard; onMoCase: (caseId: number, o?: MoCase) => void }) {
  const { homNay, ngan } = useNgayNghiepVu();
  const khoang = chuKhoangPa({ startedOn: null, completedOn: null, mocChu: p.mocChu }, homNay);
  return (
    <div className="relative ml-3 mt-2 rounded-lg bg-[color:var(--surface-2)] px-2.5 py-2 pl-3">
      <span aria-hidden className="absolute -left-3 top-0 h-4 w-3 rounded-bl-md border-b-[1.5px] border-l-[1.5px]" style={{ borderColor: 'var(--line-strong)' }} />
      <button type="button" onClick={() => onMoCase(c.id, { paId: p.id })} className="flex w-full min-w-0 items-center gap-1.5 border-0 bg-transparent p-0 text-left text-[13px] font-semibold text-slate-100">
        <NhanLoai loai="PA" /><span className="min-w-0 truncate max-sm:whitespace-normal max-sm:overflow-visible max-sm:break-words">{p.name}</span>
      </button>
      <div className="mt-0.5 truncate text-[12px] text-slate-400 max-sm:whitespace-normal max-sm:overflow-visible max-sm:break-words">{[chuNguoi(p), khoang, chuBuoi(p)].filter(Boolean).join(' · ')}</div>
      <DongXinYKien x={p.xinYKien} ngan={ngan} />
      {p.lastOutcomeLabel && (
        <div className="mt-1">
          <Outcome tone={OUTCOME_TONE[p.lastOutcome ?? ''] ?? 'muted'} mark={OUTCOME_MARK[p.lastOutcome ?? '']}>{chuKetQuaPa(p.lastOutcomeLabel, p.lastOutcomeOn, homNay)}</Outcome>
        </div>
      )}
    </div>
  );
}
