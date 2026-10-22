import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { ODiem } from '../../ui/ODiem.tsx';
import { TargetText } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { skillShort } from '../../lib/format.ts';
import { useThaoTacDongHocVien, type QuyenDong } from '../classes/thaoTacDongHocVien.tsx';
import { ChipLichThi, MiniKn, kqOverall } from './GocLichThi.tsx';
import { ViecTiepDong, type DongSos } from './BangSos.tsx';
import { shortDate, tuanLich, type HangHv, type LichThi, type NguCanhDs } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';

/** Một em của danh sách gọn (`GET /hoc-vien-lop` → `hocVien`, SV-SO3 `hang` + UI-HV-LOP `tvv` / `lich`). */
export type HvGon = {
  id: number; classId: number; ten: string; khung: 'ft' | 'thuong'; ketThuc?: true;
  hang?: HangHv; tvv?: string | null; lich?: LichThi;
};
/** Việc của em (cùng nguồn Công việc `/my-work`) — gấp nhất trước; `it` để bấm làm tại chỗ. */
export type ViecEm = { chu: string; han: string | null; quaHan: boolean; it: WorkItem };
/** Lớp của dòng: mã + chương trình + quyền của người xem ở lớp đó (menu ⋯ của em). */
export type LopGon = { id: number; code: string; programmeName: string | null; scoringMode: string | null; viewer: QuyenDong };

const chuSo = (n: number | null | undefined) => (n == null ? null : n.toFixed(1));
const trong = <span className="text-faint">—</span>;

/** ⋯ CUỐI DÒNG HỌC VIÊN — cùng menu / panel với hồ sơ lớp (`useThaoTacDongHocVien`, quyền theo lớp của em). Nhập điểm theo em ở panel Nhập điểm của lớp. */
function MenuEm({ h, lop, onDoi }: { h: HvGon; lop: LopGon | undefined; onDoi: () => void }) {
  const thuong = lop?.scoringMode === 'ratio';
  const tt = useThaoTacDongHocVien({ laLopThuong: thuong, quyen: lop?.viewer ?? { coTheSuaHocVien: false, coTheBaoCase: false, coTheGhiViPham: false, coTheNhapDiem: false },
    maLop: lop?.code ?? null, classId: lop?.id ?? null, onDone: onDoi });
  const muc = tt.mucCua({ id: h.id, ten: h.ten, dangHoc: !h.ketThuc, nhapDiem: null, status: h.ketThuc ? 'finished' : 'active', ft: !thuong, maLop: lop?.code ?? null });
  return <>{muc.length > 0 && <MenuDong muc={muc} nhan={t('Thao tác khác')} />}{createPortal(tt.panels, document.body)}</>;
}

function TenEm({ h, lop, ds }: { h: HvGon; lop?: LopGon; ds: NguCanhDs }) {
  return (
    <span className="block min-w-0">
      <Link className="link block truncate font-semibold" title={h.ten} to={`/hoc-vien/${h.id}`} state={{ ds }}>{h.ten}</Link>
      <span className="block truncate text-xs font-normal text-slate-400">
        {lop ? <Link className="text-slate-400 hover:text-slate-200" to={`/hoc-vien/lop/${lop.id}`}>{lop.code}</Link> : null}
        {' · '}{h.tvv ? `TVV ${h.tvv}` : t('chưa có TVV')}{h.ketThuc ? ` · ${t('Kết thúc học')}` : ''}
      </span>
    </span>
  );
}

/** Ô Việc: việc gấp nhất (bấm = làm tại chỗ như Công việc) · hạn dd/mm (⚠ đỏ khi quá hạn) · "+n việc". */
function OViec({ v, onMo }: { v: ViecEm[] | undefined; onMo: (it: WorkItem) => void }) {
  const { homNay } = useNgayNghiepVu();
  if (!v?.length) return trong;
  const x = v[0];
  return (
    <span className="block min-w-0 text-xs">
      <button type="button" className="link block max-w-full truncate appearance-none border-0 bg-transparent p-0 text-left text-xs" title={dich(x.chu)} onClick={() => onMo(x.it)}>{dich(x.chu)}</button>
      <span className="block tabular-nums">
        {x.han && <span className={x.quaHan ? 'font-semibold text-bad' : 'text-slate-400'}>{x.quaHan ? '⚠ ' : ''}{shortDate(x.han, homNay)}</span>}
        {v.length > 1 && <span className="text-slate-500">{x.han ? ' · ' : ''}{t('+{n} việc', { n: v.length - 1 })}</span>}
      </span>
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

/**
 * BẢNG "TẤT CẢ" (UI-HV-LOP, `dieu-chinh-cuoi.html` khu d + `10` mục 5): mỗi em một dòng — Học viên · Lộ trình · MT gần nhất (Overall / KV + 5 kỹ năng) ·
 * Xu hướng · Hỗ trợ · Ý thức · Lịch thi · Việc · ⋯ (thao tác của em, giữ từ bảng cũ — `10` mục 8). Em lớp thường: cột MT để "—" (không có lượt MT).
 */
export function BangHvGon({ ds, lop, viec, nguCanh, onMoViec, onDoi }: {
  ds: HvGon[]; lop: Map<number, LopGon>; viec: Map<number, ViecEm[]>; nguCanh: NguCanhDs; onMoViec: (it: WorkItem) => void; onDoi: () => void;
}) {
  const o = (h: HvGon, c: CotBang) => {
    const g = h.hang;
    switch (c.key) {
      case 'ten': return <TenEm h={h} lop={lop.get(h.classId)} ds={nguCanh} />;
      case 'lo': return g
        ? <span className="block"><b className="block tabular-nums text-slate-100">MT{g.loTrinh.mt}/{g.loTrinh.soMt}</b>
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
      case 'lich': return <ChipLichThi l={h.lich} />;
      case 'viec': return <OViec v={viec.get(h.id)} onMo={onMoViec} />;
      default: return <MenuEm h={h} lop={lop.get(h.classId)} onDoi={onDoi} />;
    }
  };
  return <Bang ten={t('Học viên & Lớp')} cot={COT_HV} hang={ds} khoa={(h) => `${h.classId}:${h.id}`} oCua={o} khung={false} the375={false} dinh />;
}

/** Điện thoại (< 640 px, khu d 375): mỗi em một thẻ — tên · lớp · chip (SOS trước, không thì lịch thi) · ⋯; dòng 2 = việc gấp nhất, không việc thì Target · Overall. */
export function TheHvGon({ ds, lop, viec, nguCanh, onMoViec, onDoi }: {
  ds: HvGon[]; lop: Map<number, LopGon>; viec: Map<number, ViecEm[]>; nguCanh: NguCanhDs; onMoViec: (it: WorkItem) => void; onDoi: () => void;
}) {
  return (
    <div>
      {ds.map((h) => {
        const g = h.hang;
        const v = viec.get(h.id);
        return (
          <article key={`${h.classId}:${h.id}`} className={`space-y-1 border-t px-3 py-2.5 first:border-t-0 ${h.ketThuc ? 'opacity-60' : ''}`} style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2">
              <Link className="link min-w-0 truncate font-semibold" to={`/hoc-vien/${h.id}`} state={{ ds: nguCanh }}>{h.ten}</Link>
              <span className="shrink-0 text-xs text-slate-400">{lop.get(h.classId)?.code}</span>
              <span className="ml-auto shrink-0">{g?.hoTro.sos ? <ChipSos muc={g.hoTro.sos} kyNang={g.hoTro.kyNang.map((k) => skillShort(k))} /> : <ChipLichThi l={h.lich} />}</span>
              <span className="shrink-0"><MenuEm h={h} lop={lop.get(h.classId)} onDoi={onDoi} /></span>
            </div>
            <div className="text-xs text-slate-400">
              {v?.length ? <OViec v={v} onMo={onMoViec} />
                : g?.mtGan ? <span className="inline-flex items-baseline gap-1">Target <TargetText band={g.loTrinh.target} kck={g.loTrinh.kck} /> · Overall
                    <ODiem so={chuSo(g.mtGan.ovr)} kq={kqOverall(g.mtGan.ovr, g.mtGan.kyVong)} kck={g.loTrinh.kck} nhan="Overall" /> MT{g.mtGan.mt}</span>
                : '—'}
            </div>
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
        return m ? <span className="inline-flex items-baseline gap-1"><ODiem so={chuSo(m.ovr)} kq={kqOverall(m.ovr, m.kyVong)} nhan="Overall" /><span className="text-slate-400">/ {chuSo(m.kyVong) ?? '—'}</span></span> : trong;
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
