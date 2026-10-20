import type { ExamPlan, GiaiDoanSauThi, NguCanhDs, NhanYThucEm } from '@shared/domain/index.ts';
import { NhanSauThi } from './HopGiaHan.tsx';
import { useEffect, useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ExamPlanText, Skeleton, TargetText } from '../../ui/ui.tsx';
import { ChipDuoiKck } from '../../ui/KetQuaDot.tsx';
import { Nhan, QuaHan } from '../../ui/Nhan.tsx';
import { DanhSachViecTiep } from '../../ui/ViecTiep.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { HangCon } from '../../ui/HangNhom.tsx';
import { TheDong } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { fmtBand } from '../../lib/format.ts';
import { MissingBadge } from './MissingBadge.tsx';
import { CanhBaoYThuc } from '../classes/CanhBaoYThuc.tsx';
import { duongViecTiep, nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from '../classes/thaoTacDongHocVien.tsx';
import {
  chuSapToi, duongDotTest, ketQuaGanNhat, khoaLopThuong, sapXepHocVien, soKyVong, tachViecChung, tuanLich,
  type KetQuaVao, type SapXep, type ViecTiepTheo, chipSosTuKetQua, chipSauThi } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { DauKetQua } from '../../ui/BieuTuong.tsx';
import { OChon, type ChonNhieu } from './chonNhieuHocVien.tsx';

/** Các trường của một dòng `GET /classes/:id/roster` mà bảng này đọc. */
export type NhanSauThiEm = { giaiDoan: GiaiDoanSauThi; han: string | null; quaHan: boolean; daGiaHan: boolean };
export type DongRoster = {
  id: number; studentCode: string; fullName: string; status: string; archived: boolean;
  cycle: { target: number | null; khongCamKet?: boolean } | null;
  /** + mốc kế tiếp cho cột "Sắp tới" (`nextAttemptLabel` · tuần của `nextWeekStart` · kỳ vọng `nextKyVong`; `nhanLuotChuaXep` khi lượt đã bỏ tuần). */
  standing: (KetQuaVao & { nextAttemptLabel?: string | null; nextWeekStart?: string | null; nextKyVong?: number | null; nhanLuotChuaXep?: string | null }) | null;
  /** Dự kiến thi ở đúng mức chắc chắn đang có (cột "Dự kiến thi"; roster FT và lớp thường đều trả). */
  examPlan: ExamPlan;
  /** OV-14b: "Đã thi · chờ kết quả" / "Đã xong · chờ bước tiếp" (`sauThiTheoEm`, cùng hàm panel một em) — dưới Dự kiến thi. */
  sauThi?: NhanSauThiEm | null;
  openCases: number; handoverCases: number;
  missing: { key: string; label: string; who: string }[];
  canhBaoYThuc: NhanYThucEm | null;
  viecTiepTheo: ViecTiepTheo[];
  timeline: {
    id: number; kind: string; kindLabel: string; myPending: string[]; overdueSkills: number;
    /** OV-10b: cột Admin "Lượt MT gần nhất" · "Ô chưa nhập". */
    weekStart?: string | null; status?: string; scoredRequired?: number; requiredCount?: number;
  }[];
  /** PR-LT: cột Khoá "tiếp theo: …" và cờ chưa có lộ trình tiếp theo (chỉ lớp thường). */
  tiepTheo: string | null;
  chuaLoTrinh: boolean;
  choDuyetChuyen?: boolean;
  /** OV-15b (C13): lượt MT có điểm, mới nhất đầu (`roster` ở classes.ts) — lớp FT hiện OVR · L · R · W · S của lượt đầu. */
  history?: { id: number; overall: number | null; expectation: number | null; writing: number | null; bands: Record<string, number | null> | null; lichSu?: boolean }[];
};

/** OV-15b (C13): cột điểm lớp FT ở Học viên & Lớp — W là Writing tổng (W1 · W2 dòng phụ mờ). */
export const COT_DIEM_FT = ['overall', 'listening', 'reading', 'writing', 'speaking'] as const;
export const NHAN_COT_DIEM_FT: Record<(typeof COT_DIEM_FT)[number], string> = { overall: 'OVR', listening: 'L', reading: 'R', writing: 'W', speaking: 'S' };

/** Một ô điểm của lượt MT mới nhất: band đậm + ✓ / ✗ so kỳ vọng của lượt đó (`DauKetQua`); W thêm dòng "W1 · W2" mờ; trống = chưa có. */
function ODiemFt({ h, k }: { h: NonNullable<DongRoster['history']>[number] | undefined; k: (typeof COT_DIEM_FT)[number] }) {
  const v = !h ? null : k === 'overall' ? h.overall : k === 'writing' ? h.writing : h.bands?.[k] ?? null;
  const kq = h && !h.lichSu ? soKyVong(v, h.expectation) : null;
  const w = k === 'writing' && h ? [h.bands?.writing1 ?? null, h.bands?.writing2 ?? null] : null;
  return (
    <>
      {v === null ? <span className="sr-only">{t('Chưa có')}</span>
        : <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-slate-100">{fmtBand(v)}{kq && <DauKetQua kq={kq} />}</span>}
      {w && w.some((x) => x !== null) && <span className="block text-[11px] tabular-nums text-slate-500">{w.map((x) => (x === null ? '–' : fmtBand(x))).join(' · ')}</span>}
    </>
  );
}

export type LopChoBang = {
  id: number; code?: string; programmeCode: string | null; scoringMode: string | null;
  currentWeek: number | null; totalWeeks: number | null; tuanKetThuc: string | null;
  viewer: QuyenDong;
  /** PR-LT: lớp đang trong hai tuần cuối khoá — chỉ khi đó mới nhắc "chưa có lộ trình tiếp theo" (Q5). */
  nhacLoTrinh?: boolean;
};

/**
 * CÁC HÀNG CON CỦA MỘT LỚP (đặc tả §3.6, mockup 07b A + 07c A + 10b §1; PR-UX0 N-2; PR-HVL M3). Trả về CÁC `<tr>` — bảng và tiêu đề
 * cột do trang Học viên & Lớp dựng MỘT lần cho mỗi nhóm khung. Bảy cột: Học viên (tên đậm, mã 6 số mờ) · Kết quả gần nhất (chính + tối đa
 * hai dòng chữ, không "…") · Target (FT) / Khoá (lớp thường) · Sắp tới · Case · Việc tiếp theo (bấm được) · ⋯. Việc Nhập điểm trùng
 * chữ ở ≥ 2 em thành MỘT hàng "Cả lớp" đầu lớp. `chiHien` = id học viên còn lại sau chip lọc / ô tìm (máy chủ tính); `null` = mọi em đang học.
 * Nằm ở: Học viên & Lớp (menu trái) → mở một lớp. Điện thoại (< 640 px, D2): `the` = mỗi em một `TheDong` thay vì `<tr>` (cùng dữ liệu, cùng thứ tự cột).
 */
export function BangHocVienLop({ lop, chiHien, sapXep, onDoi, soCot, the = false, ds, onThuTu, admin = false, onMoCase, chon }: {
  /** OV-15h2 (ý 1): ô tick trước tên em (Xuất Excel "Các HV đã chọn"); em Kết thúc học không tick. */
  chon?: ChonNhieu;
  /** OV-12f: việc Case ở cột Việc tiếp theo mở Panel một em tại trang (không rời Học viên & Lớp). */
  onMoCase?: (studentId: number, caseId: number) => void;
  lop: LopChoBang; chiHien: Set<number> | null; sapXep: SapXep; onDoi: () => void;
  /** OV-10b (mockup vai mục 6): Admin — Học viên · Lượt MT gần nhất · Ô chưa nhập · ⋯ (Sửa thông tin · Mở hồ sơ). */
  admin?: boolean;
  /** PR-DH (Q-0310-4): danh sách học viên đang hiện (đúng lọc + thứ tự) — đi cùng link tên em để hồ sơ có Trước/Sau; `onThuTu` báo thứ tự của lớp này lên trang. */
  ds?: NguCanhDs; onThuTu?: (classId: number, ids: number[]) => void;
  /** Số cột của bảng ngoài — để hàng lỗi / đang tải / rỗng trải hết bề ngang. */
  soCot: number;
  /** Vẽ thẻ (điện thoại) thay vì hàng bảng. */
  the?: boolean;
}) {
  const { homNay } = useNgayNghiepVu();
  const thuong = lop.scoringMode === 'ratio';
  /* OV-11g (HL-19): kèm em Kết thúc học chưa Lưu trữ của lớp cuối — dòng mờ cuối lớp, ⋯ Lưu trữ · Học lại. */
  const { data, loading, error, reload } = useApi<DongRoster[]>(`/classes/${lop.id}/roster?kemKetThuc=1`, [lop.id]);
  const tt = useThaoTacDongHocVien({ laLopThuong: thuong, quyen: admin ? { ...lop.viewer, theoVai: true } : lop.viewer, maLop: lop.code, classId: lop.id, onDone: () => { reload(); onDoi(); } });
  /** Admin: lượt đã tới tuần thi gần nhất (không tính lượt huỷ) + số ô còn trống của lượt đó. */
  const luotGanNhat = (s: DongRoster) => {
    const t = s.timeline.filter((x) => !!x.weekStart && x.weekStart <= homNay && x.status !== 'cancelled').at(-1);
    return t ? { nhan: `${t.kindLabel} · ${tuanLich(t.weekStart!, homNay)}`, co: t.scoredRequired ?? 0, can: t.requiredCount ?? 0 } : null;
  };
  const oLuot = (s: DongRoster) => {
    const l = luotGanNhat(s);
    return l ? <><span className="block tabular-nums text-slate-200">{l.nhan}</span><span className="block text-xs tabular-nums text-slate-500">{t('{co}/{can} ô có điểm', { co: l.co, can: l.can })}</span></>
      : <span className="text-slate-600">—</span>;
  };
  const oTrong = (s: DongRoster) => {
    const l = luotGanNhat(s);
    return l && l.can > l.co ? <span className="tabular-nums text-slate-100">{l.can - l.co}</span> : <span className="text-slate-600">—</span>;
  };
  const menuDong = (s: DongRoster) => tt.mucCua({
    id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(lop.id, thuong, s.timeline), status: s.status, xuLyYThuc: !!s.canhBaoYThuc,
  });
  const rows = useMemo(() => sapXepHocVien(
    (data ?? [])
      .filter((s) => !s.archived && (!chiHien || chiHien.has(s.id)))
      .map((s) => ({
        ...s, ten: s.fullName,
        quaHan: s.viecTiepTheo.some((v) => v.tone === 'danger'),
        canhBao: !!s.canhBaoYThuc, sosLevel: s.standing?.sosLevel ?? null, soCaseMo: s.openCases,
      })),
    sapXep,
  ).sort((a, b) => Number(a.status === 'finished') - Number(b.status === 'finished')), [data, chiHien, sapXep]);
  useEffect(() => { onThuTu?.(lop.id, rows.map((s) => s.id)); }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  /* Q6/B8: việc chung của lớp lên hàng "Cả lớp", không lặp ở từng em. */
  const { chung, conLai } = useMemo(() => tachViecChung(rows.map((s) => ({ id: s.id, viec: s.viecTiepTheo }))), [rows]);
  const denChung = chung ? nhapDiemCua(lop.id, thuong, rows.find((s) => s.timeline.some((t) => t.myPending.length))?.timeline ?? [])?.den ?? null : null;
  /** Ô "Sắp tới": chữ ngắn (`chuSapToi`) + tooltip đủ nghĩa — dùng chung cho hàng bảng và thẻ điện thoại. */
  const sapToiCua = (s: DongRoster) => {
    const st = s.standing;
    const chu = chuSapToi({
      nhanLuot: st?.nextAttemptLabel ?? null, tuanBatDau: st?.nextWeekStart ?? null, kyVong: st?.nextKyVong ?? null,
      conLuotChuaXep: st?.nhanLuotChuaXep ?? null, duKienThi: s.examPlan ?? null, homNay, khung: thuong ? 'thuong' : 'ft',
    });
    const title = st?.nextAttemptLabel
      ? [st.nextAttemptLabel, st.nextWeekStart && t('tuần thi {tuan}', { tuan: tuanLich(st.nextWeekStart, homNay) }), st.nextKyVong != null && t('kỳ vọng {kv}', { kv: fmtBand(st.nextKyVong) })].filter(Boolean).join(' · ')
      : chu ? dich(chu) : undefined;
    return { chu: chu && dich(chu), title, thiThat: !!chu?.startsWith(t('Thi thật')) };   // chuSapToi đã theo tiếng của trang (EN-b) — so cùng tiếng
  };
  const khoaCua = (s: DongRoster) => thuong
    ? khoaLopThuong({ maChuongTrinh: lop.programmeCode, tuanHienTai: lop.currentWeek, tongTuan: lop.totalWeeks,
        tuanKetThuc: lop.tuanKetThuc, tiepTheo: s.tiepTheo, nhacLoTrinh: !!lop.nhacLoTrinh && s.chuaLoTrinh, choDuyetChuyen: s.choDuyetChuyen, homNay })
    : null;

  const trong = (n: ReactNode) => (the ? <div>{n}</div> : <HangCon><td colSpan={soCot}>{n}</td></HangCon>);
  if (error) {
    return trong(
      <div className="px-4 py-3 text-xs text-bad">
        {error.message} <button type="button" className="btn btn-sm ml-2" onClick={reload}>{t('Thử lại')}</button>
      </div>,
    );
  }
  if (loading || !data) return trong(<div className="p-3"><Skeleton rows={3} /></div>);
  if (!rows.length) {
    return trong(<Empty title={chiHien ? t('Không có học viên nào khớp bộ lọc trong lớp này') : t('Lớp chưa có học viên')} />);
  }

  if (the) {
    return (
      <div>
        {chung && <p className="m-0 border-t px-3 py-2 text-xs" style={{ borderColor: 'var(--line)' }}><ViecChungLop chung={chung} den={denChung} /></p>}
        {rows.map((s) => {
          const k = ketQuaGanNhat(s.standing);
          const khoa = khoaCua(s);
          const sapToi = sapToiCua(s);
          return (
            <TheDong key={s.id} className={`${s.status !== 'active' ? 'row-muted' : ''} ${chipSauThi(s.sauThi) ? 'hang-da-thi' : ''}`}
              dau={(
                <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  {chon && s.status !== 'finished' && <OChon chon={chon} id={s.id} ten={s.fullName} />}
                  <Link className="link font-semibold" to={`/hoc-vien/${s.id}`} state={{ ds }}>{s.fullName}</Link>
                  {s.status === 'finished' ? <Nhan tone="done">{t('Đã kết thúc học')}</Nhan> : <MissingBadge items={s.missing} gon />}
                  <CanhBaoYThuc cb={s.canhBaoYThuc} />
                </span>
              )}
              hanhDong={<MenuDong muc={menuDong(s)} />}
              dong={admin ? [
                { nhan: t('Lượt MT'), noiDung: oLuot(s) },
                { nhan: t('Ô chưa nhập'), noiDung: oTrong(s) },
              ] : [
                { nhan: t('Kết quả'), noiDung: <KetQuaOHocVien k={k} standing={s.standing} thuong={thuong} /> },
                ...(!thuong && s.history?.length ? [{ nhan: t('Điểm'), noiDung: (
                  <span className="flex flex-wrap gap-x-3 gap-y-1">
                    {COT_DIEM_FT.map((c) => <span key={c} className="inline-flex items-start gap-1"><span className="text-slate-500">{NHAN_COT_DIEM_FT[c]}</span><span><ODiemFt h={s.history![0]} k={c} /></span></span>)}
                  </span>
                ) }] : []),
                { nhan: thuong ? t('Khoá') : 'Target', noiDung: thuong
                  ? <>{khoa?.chinh}{khoa?.phu && <span className="block text-xs text-slate-500">{khoa.phu}</span>}</>
                  : <TargetText band={s.cycle?.target} kck={s.cycle?.khongCamKet} /> },
                { nhan: t('Dự kiến thi'), noiDung: <><ExamPlanText plan={s.examPlan} />{s.sauThi && <NhanSauThi s={s.sauThi} gon />}</> },
                { nhan: t('Sắp tới'), noiDung: sapToi.chu ? <span title={sapToi.title} className={sapToi.thiThat ? 'text-slate-400' : ''}>{sapToi.chu}</span> : <span className="text-slate-600">—</span> },
                { nhan: 'Case', noiDung: s.openCases || <span className="text-slate-600">—</span> },
                { nhan: t('Việc tiếp'), noiDung: (
                  <DanhSachViecTiep viec={(conLai.get(s.id) ?? []).map(dichViec)}
                    den={(v) => duongViecTiep(v, { studentId: s.id, classId: lop.id, laLopThuong: thuong, timeline: s.timeline })}
                    onBam={onMoCase ? (v) => (v.dich?.loai === 'case' ? () => onMoCase(s.id, (v.dich as { caseId: number }).caseId) : null) : undefined} />
                ) },
              ]} />
          );
        })}
        {createPortal(tt.panels, document.body)}
      </div>
    );
  }

  return (
    <>
      {chung && (
        <HangCon>
          <td colSpan={soCot} className="td text-xs"><ViecChungLop chung={chung} den={denChung} /></td>
        </HangCon>
      )}
      {rows.map((s) => {
        const k = ketQuaGanNhat(s.standing);
        const khoa = khoaCua(s);
        const sapToi = sapToiCua(s);
        return (
          <HangCon key={s.id} className={`row-hover ${s.status !== 'active' ? 'row-muted' : ''} ${chipSauThi(s.sauThi) ? 'hang-da-thi' : ''}`}>
            <td className="td h-14">
              {/* PR-S4F #11: tên được ưu tiên chỗ — badge xuống dòng khi chật; tên quá dài vẫn cắt nhưng có title. */}
              <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                {chon && s.status !== 'finished' && <OChon chon={chon} id={s.id} ten={s.fullName} />}
                <Link className="link max-w-full truncate font-semibold" title={s.fullName} to={`/hoc-vien/${s.id}`} state={{ ds }}>{s.fullName}</Link>
                {s.status === 'finished' ? <Nhan tone="done">{t('Đã kết thúc học')}</Nhan> : <MissingBadge items={s.missing} gon />}
                <CanhBaoYThuc cb={s.canhBaoYThuc} />
              </span>
            </td>
            {admin ? (
              <>
                <td className="td text-xs">{oLuot(s)}</td>
                <td className="td text-right">{oTrong(s)}</td>
              </>
            ) : (<>
            <td className="td"><KetQuaOHocVien k={k} standing={s.standing} thuong={thuong} /></td>
            {!thuong && COT_DIEM_FT.map((c) => <td key={c} className="td text-center"><ODiemFt h={s.history?.[0]} k={c} /></td>)}
            <td className="td">
              {thuong ? (
                <>
                  <span className="block whitespace-nowrap tabular-nums text-slate-200">{khoa?.chinh}</span>
                  {khoa?.phu && <span className="block truncate text-xs text-slate-500">{khoa.phu}</span>}
                </>
              ) : <span className="tabular-nums text-slate-200"><TargetText band={s.cycle?.target} kck={s.cycle?.khongCamKet} /></span>}
            </td>
            <td className="td text-xs"><ExamPlanText plan={s.examPlan} />{s.sauThi && <NhanSauThi s={s.sauThi} gon />}</td>
            <td className={`td text-xs tabular-nums ${sapToi.thiThat ? 'text-slate-400' : 'text-slate-300'}`} title={sapToi.title}>
              {sapToi.chu ?? <span className="text-slate-600">—</span>}
            </td>
            <td className="td text-right tabular-nums"
              title={s.handoverCases ? t('{n} Case bàn giao từ lớp trước', { n: s.handoverCases }) : undefined}>
              {s.openCases || <span className="text-slate-600">—</span>}
            </td>
            <td className="td">
              <DanhSachViecTiep viec={(conLai.get(s.id) ?? []).map(dichViec)}
                den={(v) => duongViecTiep(v, { studentId: s.id, classId: lop.id, laLopThuong: thuong, timeline: s.timeline })}
                onBam={onMoCase ? (v) => (v.dich?.loai === 'case' ? () => onMoCase(s.id, (v.dich as { caseId: number }).caseId) : null) : undefined} />
            </td>
            </>)}
            <td className="td text-center"><MenuDong muc={menuDong(s)} /></td>
          </HangCon>
        );
      })}
      {createPortal(tt.panels, document.body)}
    </>
  );
}

/** Ô Kết quả gần nhất — chung cho hàng bảng và thẻ điện thoại: số chính + độ lệch FT + ✓ + SOS (FT) và tối đa hai dòng chữ 12 px, không cắt "…". */
export function KetQuaOHocVien({ k, standing, thuong }: { k: ReturnType<typeof ketQuaGanNhat>; standing: KetQuaVao | null; thuong: boolean }) {
  return (
    <>
      <span className="flex flex-wrap items-center gap-x-1.5">
        <span className="text-sm font-bold tabular-nums text-slate-100">{k.chinh}</span>
        {k.lech && <span className={`text-xs font-semibold tabular-nums ${k.kckDuoi ? 'text-slate-400' : 'text-bad'}`} title={t('Dưới kỳ vọng {n}', { n: k.lech.replace('−', '') })}>{k.lech}</span>}
        {k.dat && <span className="text-[11px] text-slate-400" title={thuong ? t('Đạt mọi môn') : t('Đạt kỳ vọng')}>✓</span>}
        {k.kckDuoi && <ChipDuoiKck />}
        {k.sos && chipSosTuKetQua(standing) && <ChipSos {...chipSosTuKetQua(standing)!} />}
      </span>
      {k.dong1 && <span className="block text-[12px] leading-4 text-slate-500"><DongCham chu={k.dong1} lienKet={standing?.attemptId && standing.attemptLabel ? { nhan: standing.attemptLabel, den: duongDotTest({ id: standing.attemptId, kind: standing.attemptKind, classId: standing.attemptClassId }) } : undefined} /></span>}
      {k.dong2 && <span className="block text-[12px] leading-4 text-slate-500"><DongCham chu={k.dong2} /></span>}
    </>
  );
}

/** PR-EN-c: việc tiếp theo máy chủ dựng (chữ Việt) → tiếng của trang. */
export const dichViec = (v: ViecTiepTheo): ViecTiepTheo => ({ ...v, viec: dich(v.viec), han: v.han && dich(v.han), title: dich(v.title) });

/** PR-S4F #11: dòng "a · b · c" chỉ xuống dòng Ở DẤU "·" (không bẻ "…có / điểm", không để "W ·" đứng riêng ở 375 px). */
/** PR-UXF-b (G5): `lienKet` biến tên lượt ở đầu dòng 1 ("MT3") thành link tới đợt (`duongDotTest`). */
function DongCham({ chu, lienKet }: { chu: string; lienKet?: { nhan: string; den: string } }) {
  return <>{chu.split(' · ').flatMap((x, i) => [i ? ' ' : null, <span key={i} className="whitespace-nowrap">{i ? '· ' : ''}{i === 0 && lienKet && x.startsWith(lienKet.nhan) ? <><Link to={lienKet.den} className="link">{lienKet.nhan}</Link>{x.slice(lienKet.nhan.length)}</> : x}</span>])}</>;
}

/** Hàng "Cả lớp" (Q6, B8): việc Nhập điểm chung của cả lớp — chữ + hạn + số em + link tới lưới nhập điểm; dùng cho bảng và thẻ. */
function ViecChungLop({ chung, den }: { chung: { viec: ViecTiepTheo; soEm: number }; den: string | null }) {
  const v = chung.viec;
  return (
    <>
      <span className="text-slate-500">{t('Cả lớp:')} </span>
      <span className="text-slate-200">
        {den ? <Link to={den} className="link">{dich(v.viec)}</Link> : dich(v.viec)}
        {v.quaHanNgay !== null ? <> <QuaHan ngay={v.quaHanNgay} /></> : v.han ? <span className="text-slate-500"> · {dich(v.han)}</span> : null}
      </span>
      <span className="text-slate-500"> · {t('{n} em', { n: chung.soEm })}{den ? ' →' : ''}</span>
    </>
  );
}
