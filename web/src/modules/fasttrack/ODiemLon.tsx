/**
 * DẢI NĂM Ô ĐIỂM LỚN của hồ sơ Mock (PR-HSM, §7.6, YC-13.7, YC-13.8, K4-30, K4-31).
 *
 * Nằm ở: Test › một lượt MT (`/mock-test/:id` — mở từ Lịch Test, hồ sơ HV › bảng Mock Test, tên em ở lưới chấm) → ngay dưới
 * đầu trang. Tầng 1 của màn: 4 điểm kỹ năng + Overall.
 *
 * L · R · W · S · Overall cùng cỡ: nhãn 12 px · số 28 px / 700 · MỘT dòng phụ 12 px (câu dài vào tooltip). Ô mở được hộp
 * (`suaDuoc` — từ `cell.canEdit` / `daChot.goDuoc` của máy chủ, web không tự suy quyền) là nút; bấm → hộp nhập điểm (OV-4b,
 * `HopNhapDiem`) neo ngay ô. R1-LUU-TIEP: "Lưu · bài tiếp ›" = ô còn thiếu kế của CHÍNH lượt; hết → "Lưu · em tiếp ›" (danh sách nguồn,
 * `emTiep`) hoặc trạng thái hết + "‹ Về {nguồn}" / Đóng. W: dòng phụ là HAI nút W1 · W2 — hai hộp riêng, mỗi task lưu riêng (K4-31).
 */
import { useRef, type ReactNode } from 'react';
import { CHU_O_THIEU, ENTRY_SKILLS, chuDoiVang, conThieuFt, ngay, skillShort, soKyVong, tuanLich } from '@shared/domain/index.ts';
import { DauKetQua, lopKq } from '../../ui/BieuTuong.tsx';
import { fmtBand, skillLabel } from '../../lib/format.ts';
import { KetQuaDot } from '../../ui/KetQuaDot.tsx';
import { Han } from '../../ui/Han.tsx';
import { suaDuoc, type Cell, type SaveOpts, type SavePatch } from './ScoreEntry.tsx';
import { HopNhapDiem, type KetThucHop, type NguCanhHop } from './HopNhapDiem.tsx';
import { usePhienCham } from '../cham/phienCham.ts';
import { t } from '@shared/i18n/index.ts';

export type KyNangLon = 'listening' | 'reading' | 'writing' | 'speaking';
export const KY_NANG_LON: KyNangLon[] = ['listening', 'reading', 'writing', 'speaking'];
const NHAN: Record<KyNangLon, string> = { listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking' };
export const CONG_THUC_W = t('Band Writing = (Task 1 + Task 2 × 2) / 3, khi đủ hai task.');

/** Dòng lịch của một kỹ năng đánh giá (phần `attemptDetail.skillSchedule` mà dải cần). */
export type LichKn = {
  skill: string; required: boolean; weekStart: string | null; sitStatus: string; progress: string;
  deadline: string | null; absenceMoveCount: number; doiTu: string | null;
  pendingMove: { decideBy: string; toWeek: string | null; moveNo: number } | null;
};

const coDiem = (c: Cell | undefined) => !!c && (c.band !== null || c.rawScore !== null);

/**
 * DÒNG PHỤ của ô chưa có điểm (K4-30) — một câu, theo thứ tự việc cần biết trước. `[chữ, màu, câu đầy đủ]`.
 * Hạn nhập / quá hạn đi qua `<Han>` để cùng một câu ở mọi màn.
 */
function trangThaiO(l: LichKn | undefined, c: Cell | undefined, lichSu: boolean, homNay: string): { chu: React.ReactNode; mau?: string; title?: string } {
  if (!l || !l.required) return { chu: t('Ngoài phạm vi') };
  if (l.sitStatus === 'cancelled' || l.progress === 'cancelled') return { chu: t('Đã huỷ') };
  if (l.pendingMove) {
    const cau = t('chờ Quản lý duyệt dời lần {moveNo} · hạn {ngay}', { moveNo: l.pendingMove.moveNo, ngay: ngay(l.pendingMove.decideBy, homNay) });
    return { chu: cau, mau: 'text-muted', title: t('Đề nghị dời sang {x} — Quản lý trả lời trước {ngay}, quá hạn thì huỷ kỹ năng.', { x: l.pendingMove.toWeek ?? t('tuần kế tiếp'), ngay: ngay(l.pendingMove.decideBy, homNay) }) };
  }
  if (l.sitStatus === 'absent') return { chu: t('vắng · chờ xếp lại'), title: t('Đã xác nhận vắng — Quản lý xếp lại bài trước khi nhập.') };
  if (lichSu) return { chu: t('Nhập bù, không tính hạn') };
  if (l.doiTu && l.absenceMoveCount > 0) {
    return { chu: chuDoiVang(l.doiTu, homNay), title: t('Dời từ {doiTu} sang {tuan} (vắng lần {x}).', { doiTu: l.doiTu, tuan: tuanLich(l.weekStart, homNay), x: l.absenceMoveCount }) };
  }
  if (c?.noShow) return { chu: c.noShow.text };
  if (!l.weekStart) return { chu: t('Chưa xếp tuần') };
  if (l.progress === 'upcoming') return { chu: t('Làm bài {tuan}', { tuan: tuanLich(l.weekStart, homNay) }) };
  if (l.deadline) return { chu: <Han loai="nhap-diem" han={l.deadline} /> };
  return { chu: t('Chưa có điểm') };
}

export function DaiODiemLon({ cells, lich, result, lichSu, homNay, mo, onMo: onMoCha, save, ketLuanOverall, nguCanh, emTiep = null, ve = null }: {
  cells: Cell[]; lich: LichKn[]; result: any; lichSu: boolean; homNay: string;
  /** PR-MT0: thay dòng kết luận dưới Overall (MT0 không có kỳ vọng — `MT0 ✓` / chip SOS). */
  ketLuanOverall?: ReactNode;
  /** Bài nhập đang mở hộp (lifted — nút chính "Nhập điểm" của bảng dưới cũng mở đúng bài). */
  mo: string | null; onMo: (k: string | null) => void;
  save: (skill: string, patch: SavePatch, opts?: SaveOpts) => Promise<boolean | 'trung'>;
  /** Đầu hộp: em · lớp · lượt; kỳ vọng; MT0. */
  nguCanh: Omit<NguCanhHop, 'bandTaskKia'>;
  /** R1-LUU-TIEP: trang mở từ một danh sách (lưới) → hết bài của lượt thì "Lưu · em tiếp ›" sang em kế, mở đúng kỹ năng. */
  emTiep?: ((kyNang: string) => void) | null;
  /** Không có danh sách nguồn: nút của trạng thái hết ("‹ Về {nguồn}"); null → Đóng. */
  ve?: KetThucHop['nut'];
}) {
  /* Một lượt: khoá hàng cố định 0; còn thiếu = `conThieuFt` của ô; kỹ năng của người xem theo thứ tự cột. */
  const phien = usePhienCham();
  const mot = () => [0];
  const kyNangToi = ENTRY_SKILLS.filter((k) => cells.some((c) => c.skill === k && c.canEdit));
  const conThieu = (v: { kyNang: string }) => { const c = cells.find((x) => x.skill === v.kyNang); return !!c && conThieuFt(c); };
  const onMo = (k: string | null) => { if (k) phien.mo(mot); else phien.dong(); onMoCha(k); };
  const keMo = mo && !phien.het ? phien.ke({ khoa: 0, kyNang: mo }, conThieu, kyNangToi, mot) : null;
  const tiep = (daLuu: boolean) => {
    if (!mo) return;
    const k = phien.tiep({ khoa: 0, kyNang: mo }, daLuu, conThieu, kyNangToi, mot);
    if (k) onMoCha(k.kyNang);
    else if (emTiep) emTiep(mo);
  };
  const oCua = (k: string) => cells.find((c) => c.skill === k);
  const baiCua = (k: KyNangLon) => (k === 'writing' ? [oCua('writing1'), oCua('writing2')] : [oCua(k)]).filter((c): c is Cell => !!c);
  /* Nút neo của từng bài nhập — hộp mở ngay dưới ô (L/R/S: cả ô; W1/W2: nút nhỏ ở dòng phụ). */
  const neo = useRef<Record<string, HTMLElement | null>>({});

  const ketLuan = result.evaluable ? result.sosLevel === 0 : null;

  const oKyNang = (k: KyNangLon) => {
    const bai = baiCua(k);
    const band: number | null = result.bands?.[k] ?? null;
    const v = result.verdicts?.find((x: any) => x.skill === k);
    const l = lich.find((x) => x.skill === k);
    const laW = k === 'writing';
    const sua = !laW && bai.some(suaDuoc);
    let phu: { chu: React.ReactNode; mau?: string; title?: string };
    if (laW && bai.some(suaDuoc)) {
      /* W1 · W2 hai nút — mỗi task một hộp. */
      phu = { chu: bai.map((c, i) => (
        <span key={c.skill}>
          {i > 0 && <span className="text-slate-600"> · </span>}
          {suaDuoc(c) ? (
            <button type="button" ref={(el) => { neo.current[c.skill] = el; }} aria-expanded={mo === c.skill}
              className="link appearance-none border-0 bg-transparent p-0 tabular-nums max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center"
              onClick={() => onMo(mo === c.skill ? null : c.skill)}>
              {c.skill === 'writing1' ? 'W1' : 'W2'} {c.band !== null ? fmtBand(c.band) : t('Nhập')}
            </button>
          ) : <span className="tabular-nums">{c.skill === 'writing1' ? 'W1' : 'W2'} {fmtBand(c.band)}</span>}
        </span>
      )), title: CONG_THUC_W };
    } else if (k === 'writing' && bai.some(coDiem)) {
      const w = (s: string) => fmtBand(oCua(s)?.band ?? null);
      phu = { chu: `W1 ${w('writing1')} · W2 ${w('writing2')}`, title: CONG_THUC_W };
    } else if ((k === 'listening' || k === 'reading') && bai[0]?.rawScore != null) {
      phu = { chu: t('{rawScore} câu', { rawScore: bai[0].rawScore }) };
    } else if (k === 'speaking' && bai[0]?.gvCham && band !== null) {   // OV-15b (7): người chấm chỉ hiện khi đã có điểm
      /* PR-S4F #10: tên dài bị cắt (truncate) — title cho đủ tên. */
      phu = { chu: t('GV chấm: {ten}', { ten: bai[0].gvCham.ten }), title: t('GV chấm: {ten}', { ten: bai[0].gvCham.ten }) };
    } else if (band !== null) {
      /* LUAT-NX-MT: bài đã dời do vắng giữ ghi chú "vắng W3 SEP" cả khi đã có điểm. */
      phu = { chu: l?.doiTu && l.absenceMoveCount > 0 ? chuDoiVang(l.doiTu, homNay) : '' };
    } else {
      phu = trangThaiO(l, bai[0], lichSu, homNay);
    }
    const nhapBoi = bai.filter((c) => c.enteredByName).map((c) => t('{skillLabel}: nhập bởi {enteredByName}', { skillLabel: skillLabel(c.skill), enteredByName: c.enteredByName })).join('\n');
    const kq = band !== null && v && v.passed !== null ? soKyVong(band, result.expectation) ?? (v.passed ? 'bang' : 'duoi') : null;
    const noiDung = (
      <>
        <span className="block text-xs font-medium text-slate-400">{NHAN[k]}</span>
        {/* NEN-TYPO-MAU: ✓ / ✗ đứng TRƯỚC số, số tô cùng màu kết quả (`lopKq`). */}
        <span className="mt-0.5 flex items-center gap-1.5">
          {kq && <DauKetQua kq={kq} />}
          <span className={`text-[28px] font-bold leading-none tabular-nums ${band === null ? 'text-slate-600' : lopKq(kq) || 'text-slate-100'}`}>
            {band === null ? '—' : fmtBand(band)}
          </span>
        </span>
        <span className={`mt-1 block min-h-[1rem] truncate text-xs ${phu.mau ?? 'text-slate-500'}`} title={laW ? undefined : phu.title}>{phu.chu}</span>
      </>
    );
    /* PR-S4F #10: flex-col cho cả nút và ô chỉ đọc — nút căn giữa nội dung theo chiều dọc nên lệch ~3 px so với ô bên cạnh. */
    const dangMo = mo !== null && bai.some((c) => c.skill === mo);
    /* UI-CON-LAI (chủ SP 24/10): thiếu nhận xét MT → viền vàng, không chữ dưới điểm; câu nhắc ở tooltip (Writing ghi task). */
    const thieu = bai.filter((c) => c.thieuNhanXet).map((c) => `${laW ? `${c.skill === 'writing1' ? 'W1' : 'W2'} ` : ''}${CHU_O_THIEU[c.thieuNhanXet!]}`);
    const vo = `flex min-w-0 flex-col rounded-lg border px-3 py-2.5 text-left ${dangMo ? 'border-[color:var(--accent-strong)] bg-white/[0.04]' : ''}`;
    return sua ? (
      <button key={k} type="button" aria-expanded={dangMo} aria-haspopup="dialog" ref={(el) => { neo.current[bai[0].skill] = el; }}
        title={[...thieu, nhapBoi, t('Bấm để nhập / sửa điểm tại chỗ.')].filter(Boolean).join('\n')}
        aria-description={thieu.join(', ') || undefined}
        className={`${vo} bam focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-strong)]`}
        style={dangMo ? undefined : { borderColor: thieu.length ? 'rgb(var(--soon-rgb))' : 'var(--line)' }}
        onClick={() => onMo(dangMo ? null : bai[0].skill)}>
        {noiDung}
      </button>
    ) : (
      <div key={k} className={vo} style={{ borderColor: thieu.length ? 'rgb(var(--soon-rgb))' : 'var(--line)' }} title={[...thieu, nhapBoi].filter(Boolean).join('\n') || undefined}>{noiDung}</div>
    );
  };

  const kqOverall = soKyVong(result.overall, result.expectation);
  const oMo = mo ? oCua(mo) : undefined;
  const neoMo = mo ? neo.current[mo] : null;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {KY_NANG_LON.map(oKyNang)}
        <div className="col-span-2 flex min-w-0 flex-col rounded-lg border px-3 py-2.5 sm:col-span-1" style={{ borderColor: 'var(--line)' }}>
          <span className="block text-xs font-medium text-slate-400">Overall</span>
          {/* NEN-TYPO-MAU (04 mục 5.2): Overall so kỳ vọng của lượt, cùng luật tô với kỹ năng. */}
          <span className="mt-0.5 flex items-center gap-1.5">
            {kqOverall && <DauKetQua kq={kqOverall} />}
            <span className={`text-[28px] font-bold leading-none tabular-nums ${result.overall === null ? 'text-slate-600' : lopKq(kqOverall) || 'text-slate-100'}`}>
              {result.overall === null ? '—' : fmtBand(result.overall)}
            </span>
          </span>
          <span className="mt-1 block min-h-[1rem] truncate">
            {ketLuanOverall ?? <KetQuaDot phan="overall" coDiem={result.scoredRequired} yeuCau={result.required.length} dat={ketLuan}
              sos={result.sosLevel ?? null} chot={result.chot} kckDuoi={result.kckDuoi}
              duoiKyVong={(result.verdicts ?? []).filter((x: any) => x.passed === false).map((x: any) => skillShort(x.skill))} />}
          </span>
        </div>
      </div>

      {oMo && neoMo && (
        <HopNhapDiem key={oMo.skill} cell={oMo} anchor={neoMo} onDong={() => onMo(null)} onSave={(p, x) => save(oMo.skill, p, x)}
          onTiep={tiep} nhanTiep={keMo ? skillLabel(keMo.kyNang) : null} tiepEm={!keMo && !!emTiep}
          ketThuc={phien.het ? { phamVi: `${nguCanh.tenHv} · ${nguCanh.luot}`, daLuu: phien.soDaLuu(), nut: ve } : null}
          ctx={{ ...nguCanh, bandTaskKia: oMo.skill === 'writing1' ? oCua('writing2')?.band ?? null : oMo.skill === 'writing2' ? oCua('writing1')?.band ?? null : undefined }} />
      )}
    </div>
  );
}
