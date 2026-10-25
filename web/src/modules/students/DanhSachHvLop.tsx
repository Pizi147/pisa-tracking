import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { ODiem } from '../../ui/ODiem.tsx';
import { ExamPlanText, TargetText } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { skillShort } from '../../lib/format.ts';
import { nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from '../classes/thaoTacDongHocVien.tsx';
import { ChipLichThi, MiniKn, kqOverall } from './GocLichThi.tsx';
import { ViecTiepDong, type DongSos } from './BangSos.tsx';
import { OPhuHuynh } from './HocVienTheoVai.tsx';
import { NhanSauThi } from './HopGiaHan.tsx';
import { SO_DONG_VIEC_MAC_DINH, chuPhuHuynh, gopViecTheoMon, monCuaViec, shortDate, tuanLich, type ExamPlan, type GiaiDoanSauThi, type HangHv, type LichThi, type LienHe, type NguCanhDs } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';

/** Một em của danh sách gọn (`GET /hoc-vien-lop` → `hocVien`, SV-SO3 `hang` + UI-HV-LOP `tvv` / `lich`). */
export type HvGon = {
  id: number; classId: number; ten: string; khung: 'ft' | 'thuong'; ketThuc?: true;
  hang?: HangHv; tvv?: string | null; lich?: LichThi;
  /** Lượt sớm nhất người xem còn ô chờ nhập của em (máy chủ `nhapDiemTheoEm`) — có thì ⋯ có "Nhập điểm". */
  nhapDiem?: { kind: string; attemptNo: number; dot: string | null };
};
/** Việc của em (cùng nguồn Công việc `/my-work`) — gấp nhất trước; `it` để bấm làm tại chỗ. */
export type ViecEm = { chu: string; han: string | null; quaHan: boolean; it: WorkItem };
/** Lớp của dòng: mã + chương trình + quyền của người xem ở lớp đó (menu ⋯ của em). */
export type LopGon = { id: number; code: string; programmeName: string | null; scoringMode: string | null; viewer: QuyenDong };
/** TVV / CX (`GET /hoc-vien-lop/theo-vai`, một dòng một em): trạng thái, quyền sửa của chính em, phụ huynh, sau thi — ⋯ theo vai + cột Phụ huynh. */
export type EmVai = {
  status: string; ft: boolean; viewer: { suaThongTin: boolean; suaThem: boolean }; lienHe: LienHe; duKienThi: ExamPlan;
  sauThi: { giaiDoan: GiaiDoanSauThi; han: string | null; quaHan: boolean; daGiaHan: boolean } | null;
};
/** Bảng ở góc nhìn TVV / CX: dữ liệu theo em · có cột Việc không (CX không có Công việc) · bấm nhãn sau thi mở panel một em. */
export type VaiBang = { em: Map<number, EmVai>; coViec: boolean; onMoEm: (id: number) => void };

const chuSo = (n: number | null | undefined) => (n == null ? null : n.toFixed(1));
const trong = <span className="text-faint">—</span>;

/** ⋯ CUỐI DÒNG HỌC VIÊN — cùng menu / panel với hồ sơ lớp (`useThaoTacDongHocVien`, quyền theo lớp của em); "Nhập điểm" mở panel lớp đúng lượt còn nợ. */
function MenuEm({ h, lop, ev, onDoi }: { h: HvGon; lop: LopGon | undefined; ev?: EmVai; onDoi: () => void }) {
  const thuong = lop?.scoringMode === 'ratio';
  const khong = { coTheSuaHocVien: false, coTheBaoCase: false, coTheGhiViPham: false, coTheNhapDiem: false };
  /* TVV / CX: ⋯ theo vai (Sửa thông tin · Tạm dừng / Thôi học · Kết quả thi thật · Mở hồ sơ), quyền theo chính em (máy chủ) — như bảng V4 của vai. */
  const tt = useThaoTacDongHocVien({ laLopThuong: thuong, quyen: ev ? { ...khong, theoVai: true } : lop?.viewer ?? khong,
    maLop: lop?.code ?? null, classId: lop?.id ?? null, onDone: onDoi });
  const nd = h.nhapDiem && lop ? nhapDiemCua(lop.id, thuong, [{ kind: h.nhapDiem.kind, kindLabel: h.nhapDiem.dot ?? h.nhapDiem.kind, myPending: ['*'], attemptNo: h.nhapDiem.attemptNo }]) : null;
  const muc = tt.mucCua({ id: h.id, ten: h.ten, dangHoc: !h.ketThuc, nhapDiem: nd, status: ev?.status ?? (h.ketThuc ? 'finished' : 'active'), ft: ev?.ft ?? !thuong, maLop: lop?.code ?? null,
    ...(ev ? { suaThongTin: ev.viewer.suaThongTin, suaThem: ev.viewer.suaThem } : {}) });
  return <>{muc.length > 0 && <MenuDong muc={muc} nhan={t('Thao tác khác')} />}{createPortal(tt.panels, document.body)}</>;
}

function TenEm({ h, lop, ev, ds }: { h: HvGon; lop?: LopGon; ev?: EmVai; ds: NguCanhDs }) {
  return (
    <span className="block min-w-0">
      <Link className="link block truncate font-semibold" title={h.ten} to={`/hoc-vien/${h.id}`} state={{ ds }}>{h.ten}</Link>
      <span className="block truncate text-xs font-normal text-slate-400">
        {lop ? <Link className="text-slate-400 hover:text-slate-200" to={`/hoc-vien/lop/${lop.id}`}>{lop.code}</Link> : null}
        {' · '}{h.tvv ? `TVV ${h.tvv}` : t('chưa có TVV')}{h.ketThuc ? ` · ${t('Kết thúc học')}` : ''}{ev?.status === 'inactive' ? ` · ${t('Tạm dừng')}` : ''}
      </span>
    </span>
  );
}

/**
 * Ô Việc: việc gấp nhất (bấm = làm tại chỗ như Công việc) · hạn dd/mm (⚠ đỏ khi quá hạn) · "+n việc".
 * P11 VIEC-DUNG-VAI: GV / TVV một dòng (việc của mình). QL / Admin (`gopMon`): mỗi môn một dòng (việc gấp nhất của môn + "+n"), một dòng cho việc không
 * gắn môn; 3 dòng gấp nhất, "Xem thêm (n)" mở hết tại chỗ — Σ dòng + "+n" = số việc thật.
 */
function OViec({ v, onMo, gopMon }: { v: ViecEm[] | undefined; onMo: (it: WorkItem) => void; gopMon?: boolean }) {
  const { homNay } = useNgayNghiepVu();
  const [mo, setMo] = useState(false);
  if (!v?.length) return trong;
  const dong = gopMon ? gopViecTheoMon(v, (x) => monCuaViec(x.it)) : [{ mon: null, dau: v[0], them: v.length - 1 }];
  const hien = mo ? dong : dong.slice(0, SO_DONG_VIEC_MAC_DINH);
  return (
    <span className="block min-w-0 space-y-1 text-xs max-sm:space-y-0">
      {hien.map(({ dau: x, them }) => (
        <span key={x.it.key} className="block min-w-0 max-sm:flex max-sm:items-center max-sm:gap-2">
          <button type="button" className="link block max-w-full min-w-0 truncate appearance-none border-0 bg-transparent p-0 text-left text-xs max-sm:min-h-[44px] max-sm:flex-1 max-sm:leading-[44px]"
            title={dich(x.chu)} onClick={() => onMo(x.it)}>{dich(x.chu)}</button>
          <span className="block tabular-nums max-sm:shrink-0">
            {x.han && <span className={x.quaHan ? 'font-semibold text-bad' : 'text-slate-400'}>{x.quaHan ? '⚠ ' : ''}{shortDate(x.han, homNay)}</span>}
            {them > 0 && <span className="text-slate-500">{x.han ? ' · ' : ''}{t('+{n} việc', { n: them })}</span>}
          </span>
        </span>
      ))}
      {dong.length > SO_DONG_VIEC_MAC_DINH && (
        <button type="button" aria-expanded={mo} onClick={() => setMo(!mo)}
          className="block appearance-none border-0 bg-transparent p-0 text-left text-xs font-semibold text-[color:var(--accent)] hover:underline max-sm:min-h-[44px]">
          {mo ? t('Thu gọn') : t('Xem thêm ({n})', { n: dong.length - SO_DONG_VIEC_MAC_DINH })}
        </button>
      )}
    </span>
  );
}

function OHoTro({ h }: { h: HangHv['hoTro'] }) {
  if (!h.sos && !h.soCase) return <span className="text-slate-400">{t('Không có Case')}</span>;
  return (
    <span className="block">
      {h.sos ? <ChipSos muc={h.sos} kyNang={h.kyNang.map((k) => skillShort(k))} /> : null}
      <span className={`block text-xs ${h.quaHan ? 'font-semibold text-bad' : 'text-slate-400'}`}>
        {h.quaHan ? t('PA quá hạn') : t('{c} Case · {p} PA', { c: h.soCase, p: h.soPa })}
      </span>
    </span>
  );
}

function OMtGan({ g }: { g: HangHv }) {
  const { homNay } = useNgayNghiepVu();
  const m = g.mtGan;
  if (!m) return trong;
  return (
    <span className="block">
      <span className="flex items-baseline gap-1">
        <ODiem so={chuSo(m.ovr)} kq={kqOverall(m.ovr, m.kyVong)} kck={g.loTrinh.kck} nhan="Overall" />
        <span className="text-xs text-slate-400">/ KV {chuSo(m.kyVong) ?? '—'} · {m.tuan ? tuanLich(m.tuan, homNay) : `MT${m.mt}`}</span>
      </span>
      <MiniKn kn={m.kn} kv={m.kyVong} />
    </span>
  );
}

const COT_HV: CotBang[] = [
  { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 210 },
  { key: 'lo', nhan: t('Lộ trình'), kieu: 'chu', rong: 104 },
  { key: 'mt', nhan: t('MT gần nhất'), kieu: 'chu', rong: 224 },
  { key: 'xu', nhan: t('Xu hướng'), kieu: 'chu', rong: 84 },
  { key: 'ho', nhan: t('Hỗ trợ'), kieu: 'chu', rong: 140 },
  { key: 'y', nhan: t('Ý thức'), kieu: 'chu', rong: 112 },
  { key: 'lich', nhan: t('Lịch thi'), kieu: 'chu', rong: 180 },
  { key: 'viec', nhan: t('Việc'), kieu: 'viec' },
  { key: 'nut', nhan: '', kieu: 'nut' },
];
/** TVV / CX: + Phụ huynh (SĐT bấm gọi) trước ⋯; CX không có Công việc nên bỏ cột Việc (Phụ huynh thành cột giãn — `cotLinhHoat`). Vài cột hẹp lại để cả bảng vừa khung 1440 (⋯ không khuất). */
const RONG_VAI: Record<string, number> = { ten: 190, lo: 96, mt: 200, y: 96 };
const cotHv = (vai?: VaiBang): CotBang[] => (!vai ? COT_HV : COT_HV.flatMap((c): CotBang[] => (c.key === 'viec' && !vai.coViec ? []
  : c.key === 'nut' ? [vai.coViec ? { key: 'ph', nhan: t('Phụ huynh'), kieu: 'chu', rong: 120 } : { key: 'ph', nhan: t('Phụ huynh'), kieu: 'viec' }, c] : [vai.coViec && RONG_VAI[c.key] ? { ...c, rong: RONG_VAI[c.key] } : c])));

/** Ô Lịch thi: chip lịch; TVV / CX thêm nhãn sau thi (bấm = panel một em: nhập KQ / chọn bước tiếp / gia hạn tại chỗ). Em ngoài danh sách lớp (Tạm dừng…) chưa có `lich` → dự kiến thi. */
function OLich({ h, ev, onMoEm }: { h: HvGon; ev?: EmVai; onMoEm?: (id: number) => void }) {
  return (
    <span className="block">
      {h.lich || !ev ? <ChipLichThi l={h.lich} /> : <span className="text-xs text-slate-300"><ExamPlanText plan={ev.duKienThi} /></span>}
      {ev?.sauThi && onMoEm && (
        <button type="button" className="mt-1 block cursor-pointer appearance-none whitespace-normal border-0 bg-transparent p-0 text-left hover:underline" onClick={() => onMoEm(h.id)}>
          <NhanSauThi s={ev.sauThi} gon />
        </button>
      )}
    </span>
  );
}

/**
 * BẢNG "TẤT CẢ" (UI-HV-LOP, `dieu-chinh-cuoi.html` khu d + `10` mục 5): mỗi em một dòng — Học viên · Lộ trình · MT gần nhất (Overall / KV + 5 kỹ năng) ·
 * Xu hướng · Hỗ trợ · Ý thức · Lịch thi · Việc · ⋯ (thao tác của em, giữ từ bảng cũ — `10` mục 8). Em lớp thường: cột MT để "—" (không có lượt MT).
 */
export function BangHvGon({ ds, lop, viec, gopMon, nguCanh, onMoViec, onDoi, vai }: {
  ds: HvGon[]; lop: Map<number, LopGon>; viec: Map<number, ViecEm[]>; gopMon?: boolean; nguCanh: NguCanhDs; onMoViec: (it: WorkItem) => void; onDoi: () => void; vai?: VaiBang;
}) {
  const o = (h: HvGon, c: CotBang) => {
    const g = h.hang;
    const ev = vai?.em.get(h.id);
    switch (c.key) {
      case 'ten': return <TenEm h={h} lop={lop.get(h.classId)} ev={ev} ds={nguCanh} />;
      case 'lo': return g
        ? <span className="block"><b className="block tabular-nums text-slate-100" title={t('MT đã xong / đã tạo')} aria-label={g.loTrinh.soMt ? `${t('MT đã xong / đã tạo')}: ${g.loTrinh.mt}/${g.loTrinh.soMt}` : undefined}>
            {g.loTrinh.soMt ? `${g.loTrinh.mt}/${g.loTrinh.soMt} MT` : '—'}</b>
            <span className="block text-xs text-slate-400">Target <TargetText band={g.loTrinh.target} kck={g.loTrinh.kck} /></span></span>
        : <span className="block truncate text-xs text-slate-400">{lop.get(h.classId)?.programmeName ? dich(lop.get(h.classId)!.programmeName!) : '—'}</span>;
      case 'mt': return g ? <OMtGan g={g} /> : trong;
      case 'xu': return g?.xuHuong ? (
        <span className="block">
          <span className={`block font-semibold tabular-nums ${g.xuHuong.lech > 0 ? 'text-ok' : g.xuHuong.lech < 0 ? 'text-bad' : 'text-slate-400'}`}>
            {g.xuHuong.lech === 0 ? '= 0' : `${g.xuHuong.lech > 0 ? '↑' : '↓'} ${Math.abs(g.xuHuong.lech).toFixed(1)}`}
          </span>
          <span className="block text-xs text-slate-400">{t('so MT{n}', { n: g.xuHuong.soMt })}</span>
        </span>) : trong;
      case 'ho': return g ? <OHoTro h={g.hoTro} /> : trong;
      case 'y': return g?.yThuc ? <Nhan tone="doing">{dich(g.yThuc)}</Nhan> : trong;
      case 'lich': return ev ? <OLich h={h} ev={ev} onMoEm={vai?.onMoEm} /> : <ChipLichThi l={h.lich} />;
      case 'viec': return <OViec v={viec.get(h.id)} onMo={onMoViec} gopMon={gopMon} />;
      case 'ph': return ev ? <span className="block text-sm"><OPhuHuynh l={ev.lienHe} /></span> : trong;
      default: return <MenuEm h={h} lop={lop.get(h.classId)} ev={ev} onDoi={onDoi} />;
    }
  };
  return <Bang ten={t('Học viên & Lớp')} cot={cotHv(vai)} hang={ds} khoa={(h) => `${h.classId}:${h.id}`} oCua={o} khung={false} the375={false} dinh />;
}

/** Điện thoại (< 640 px, khu d 375): mỗi em một thẻ — tên · lớp · chip (SOS trước, không thì lịch thi) · ⋯; dòng 2 = việc gấp nhất, không việc thì Target · Overall. */
export function TheHvGon({ ds, lop, viec, gopMon, nguCanh, onMoViec, onDoi, vai }: {
  ds: HvGon[]; lop: Map<number, LopGon>; viec: Map<number, ViecEm[]>; gopMon?: boolean; nguCanh: NguCanhDs; onMoViec: (it: WorkItem) => void; onDoi: () => void; vai?: VaiBang;
}) {
  return (
    <div>
      {ds.map((h) => {
        const g = h.hang;
        const v = viec.get(h.id);
        const ev = vai?.em.get(h.id);
        const ph = ev ? chuPhuHuynh(ev.lienHe) : null;
        return (
          <article key={`${h.classId}:${h.id}`} className={`space-y-1 border-t px-3 py-2.5 first:border-t-0 ${h.ketThuc ? 'opacity-60' : ''}`} style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2">
              <Link className="link min-w-0 truncate font-semibold" to={`/hoc-vien/${h.id}`} state={{ ds: nguCanh }}>{h.ten}</Link>
              <span className="shrink-0 text-xs text-slate-400">{lop.get(h.classId)?.code}{ev?.status === 'inactive' ? ` · ${t('Tạm dừng')}` : ''}</span>
              <span className="ml-auto shrink-0">{g?.hoTro.sos ? <ChipSos muc={g.hoTro.sos} kyNang={g.hoTro.kyNang.map((k) => skillShort(k))} /> : !h.lich && ev ? <span className="text-xs text-slate-300"><ExamPlanText plan={ev.duKienThi} /></span> : <ChipLichThi l={h.lich} />}</span>
              <span className="shrink-0"><MenuEm h={h} lop={lop.get(h.classId)} ev={ev} onDoi={onDoi} /></span>
            </div>
            <div className="text-xs text-slate-400">
              {v?.length ? <OViec v={v} onMo={onMoViec} gopMon={gopMon} />
                : g?.mtGan ? <span className="inline-flex items-baseline gap-1">Target <TargetText band={g.loTrinh.target} kck={g.loTrinh.kck} /> · Overall
                    <ODiem so={chuSo(g.mtGan.ovr)} kq={kqOverall(g.mtGan.ovr, g.mtGan.kyVong)} kck={g.loTrinh.kck} nhan="Overall" /> MT{g.mtGan.mt}</span>
                : '—'}
            </div>
            {ev?.sauThi && vai && (
              <button type="button" className="block min-h-[44px] cursor-pointer appearance-none border-0 bg-transparent p-0 text-left" onClick={() => vai.onMoEm(h.id)}>
                <NhanSauThi s={ev.sauThi} gon />
              </button>
            )}
            {ev && (ph || ev.lienHe.parentPhone) && (
              <div className="flex min-w-0 items-baseline gap-1.5 text-xs text-slate-400">
                <span className="shrink-0">{t('Phụ huynh')}</span>
                {ph && <span className="min-w-0 truncate text-slate-300">{ph}</span>}
                {ev.lienHe.parentPhone && <a href={`tel:${ev.lienHe.parentPhone.replace(/[^\d+]/g, '')}`} className="inline-flex min-h-[44px] items-center tabular-nums text-slate-300 no-underline">{ev.lienHe.parentPhone}</a>}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

/** Trạng thái Case · PA của một em SOS: quá hạn · chưa có PA · đang làm. */
function trangThaiCase(r: DongSos): { chu: string; tone: 'late' | 'doing' } {
  const soPa = r.cases.reduce((s, c) => s + c.pa.length, 0);
  if (coPaQuaHan(r)) return { chu: t('Quá hạn'), tone: 'late' };
  if (!soPa) return { chu: t('Chưa có PA'), tone: 'late' };
  return { chu: t('Đang làm'), tone: 'doing' };
}
export const coPaQuaHan = (r: DongSos) => r.cases.some((c) => c.viecTiep?.quaHan);

const COT_SOS: CotBang[] = [
  { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 240 },
  { key: 'muc', nhan: t('Mức · kỹ năng'), kieu: 'chu', rong: 180 },
  { key: 'tu', nhan: t('Từ'), kieu: 'tuan' },
  { key: 'ovr', nhan: t('Overall / kỳ vọng'), kieu: 'chu', rong: 170 },
  { key: 'case', nhan: t('Case · PA'), kieu: 'chu', rong: 260 },
  { key: 'viec', nhan: t('Việc tiếp'), kieu: 'viec' },
];

/**
 * CHẾ ĐỘ ĐANG SOS (khu d — làm lại theo dõi SOS): Học viên · Mức · kỹ năng · Từ (tuần của lượt SOS) · Overall / kỳ vọng · Case · PA (bấm = panel một em, như nút "Mở" cũ) · Việc tiếp.
 */
export function BangSosGon({ rows, hang, nguCanh, onMo }: { rows: DongSos[]; hang: Map<number, HangHv | undefined>; nguCanh: NguCanhDs; onMo: (r: DongSos) => void }) {
  const { homNay } = useNgayNghiepVu();
  const o = (r: DongSos, c: CotBang) => {
    switch (c.key) {
      case 'ten': return (
        <span className="block min-w-0">
          <Link className="link block truncate font-semibold" to={`/hoc-vien/${r.studentId}`} state={{ ds: nguCanh }}>{r.ten}</Link>
          <span className="block text-xs font-normal text-slate-400">{r.classCode}</span>
        </span>);
      case 'muc': return <ChipSos muc={r.sosLevel} kyNang={r.kyNang.map((k) => skillShort(k))} dot={r.luot} ten={r.ten} thuong={!r.ft} />;
      case 'tu': return <span className="tabular-nums">{tuanLich(r.tuan, homNay)}</span>;
      case 'ovr': {
        const m = hang.get(r.studentId)?.mtGan;
        const ke = hang.get(r.studentId)?.ke;
        return m ? (
          <span className="inline-flex flex-wrap items-baseline gap-1">
            <ODiem so={chuSo(m.ovr)} kq={kqOverall(m.ovr, m.kyVong)} nhan="Overall" /><span className="text-slate-400">/ {chuSo(m.kyVong) ?? '—'}</span>
            {ke && <span className="text-xs text-slate-400">→ {ke.luot}{ke.kyVong != null ? ` ${chuSo(ke.kyVong)}` : ''}</span>}
          </span>) : trong;
      }
      case 'case': {
        const tt = trangThaiCase(r);
        return (
          <span className="flex flex-wrap items-center gap-1.5">
            <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 tabular-nums sm:min-h-0" onClick={() => onMo(r)}
              aria-label={t('Mở Case của {ten}', { ten: r.ten })}>{t('{c} Case · {p} PA', { c: r.cases.length, p: r.cases.reduce((s, x) => s + x.pa.length, 0) })}</button>
            <Nhan tone={tt.tone}>{tt.chu}</Nhan>
          </span>);
      }
      default: return <ViecTiepDong r={r} />;
    }
  };
  return <Bang ten={t('Đang SOS')} cot={COT_SOS} hang={rows} khoa={(r) => r.attemptId} oCua={o} khung={false} dinh />;
}
