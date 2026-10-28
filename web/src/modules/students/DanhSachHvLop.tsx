import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Bang, OBang, type CotBang } from '../../ui/Bang.tsx';
import { HangNhom, MuiTenMo, boQuaNutCon } from '../../ui/HangNhom.tsx';
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
  status: string; ft: boolean; kyThi?: boolean; viewer: { suaThongTin: boolean; suaThem: boolean }; lienHe: LienHe; duKienThi: ExamPlan;
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
    ...(ev ? { suaThongTin: ev.viewer.suaThongTin, suaThem: ev.viewer.suaThem, kyThi: !!ev.kyThi } : {}) });
  return <>{muc.length > 0 && <MenuDong muc={muc} nhan={t('Thao tác khác')} />}{createPortal(tt.panels, document.body)}</>;
}

function TenEm({ h, ev, ds }: { h: HvGon; ev?: EmVai; ds: NguCanhDs }) {
  return (
    <span className="block min-w-0">
      <Link className="ten-ho-so khong-mui block truncate" title={h.ten} to={`/hoc-vien/${h.id}`} state={{ ds }}>{h.ten}</Link>
      {/* HV-LOP-GON (chủ SP 28/10): bỏ dòng TVV cho đỡ rối (TVV ở hồ sơ em); chỉ còn trạng thái khác "đang học". */}
      {(h.ketThuc || ev?.status === 'inactive') && (
        <span className="block truncate text-xs font-normal text-slate-400">
          {[h.ketThuc && t('Kết thúc học'), ev?.status === 'inactive' && t('Tạm dừng')].filter(Boolean).join(' · ')}
        </span>
      )}
    </span>
  );
}

/** Hạn của một việc = chip tiến độ (mockup V5 `.bd-td`): quá hạn ⚠ · hôm nay `soon` · còn lại xám chờ. */
function HanViec({ x }: { x: ViecEm }) {
  const { homNay } = useNgayNghiepVu();
  if (!x.han) return null;
  const ngay = shortDate(x.han, homNay);
  if (x.quaHan) return <span className="shrink-0"><span className="sr-only">{t('Quá hạn')} </span><Nhan tone="late">{ngay}</Nhan></span>;
  return <span className="shrink-0 tabular-nums"><Nhan tone={x.it.urgency === 'today' ? 'soon' : 'muted'}>{ngay}</Nhan></span>;
}

/**
 * Ô Việc (HV-LOP-SUA, chủ SP 27/10 "phân tầng rõ"): mỗi việc MỘT dòng — tên việc (bấm = làm tại chỗ như Công việc) · hạn là chip cùng dòng căn phải;
 * 2 dòng gấp nhất, "Xem thêm n" mở hết tại chỗ. QL / Admin (`gopMon`, P11): mỗi môn một dòng (việc gấp nhất của môn + "+n") — Σ dòng + "+n" = số việc thật.
 * Việc cấp lớp nằm ở hàng lớp (nơi gọi lọc), không lặp ở từng em.
 */
export function OViec({ v, onMo, gopMon }: { v: ViecEm[] | undefined; onMo: (it: WorkItem) => void; gopMon?: boolean }) {
  const [mo, setMo] = useState(false);
  if (!v?.length) return trong;
  const dong = gopMon ? gopViecTheoMon(v, (x) => monCuaViec(x.it)) : v.map((x) => ({ mon: null, dau: x, them: 0 }));
  const hien = mo ? dong : dong.slice(0, SO_DONG_VIEC_MAC_DINH);
  /* Ô Việc nằm trên dòng của em → bỏ " · {tên em}" cuối tên việc (không lặp). */
  const chuCua = (x: ViecEm) => { const c = dich(x.chu); const duoi = ` · ${x.it.studentName}`; return x.it.studentName && c.endsWith(duoi) ? c.slice(0, -duoi.length) : c; };
  return (
    /* SUA-375: điện thoại nút cao 36 → cách 6 px, không dính nhau. */
    <span className="block min-w-0 space-y-1 max-sm:space-y-1.5">
      {hien.map(({ dau: x, them }) => (
        <span key={x.it.key} className="flex min-w-0 items-center gap-1.5">
          {/* D10 (chủ SP 27/10, mockup V5 `.viec-o .nut`): việc = nút viền nhỏ màu chữ thường (không link xanh) · chip hạn ngay sau; trạng thái nằm ở chip. */}
          {/* SUA-375: điện thoại tên việc xuống dòng trong nút (không cắt "…"), nút cao tối thiểu 36. */}
          <button type="button" className="btn btn-sm h-[30px] min-w-0 max-w-full shrink justify-start max-sm:h-auto max-sm:min-h-[36px] max-sm:whitespace-normal max-sm:py-1.5 max-sm:text-left"
            title={dich(x.chu)} onClick={() => onMo(x.it)}><span className="sm:truncate">{chuCua(x)}</span></button>
          {them > 0 && <span className="shrink-0 text-xs text-dim">{t('+{n} việc', { n: them })}</span>}
          <HanViec x={x} />
        </span>
      ))}
      {dong.length > SO_DONG_VIEC_MAC_DINH && (
        <button type="button" aria-expanded={mo} onClick={() => setMo(!mo)}
          className="block appearance-none border-0 bg-transparent p-0 text-left text-xs font-medium text-[color:var(--accent)] hover:underline max-sm:min-h-[44px]">
          {mo ? t('Thu gọn') : t('Xem thêm {n}', { n: dong.length - SO_DONG_VIEC_MAC_DINH })}
        </button>
      )}
    </span>
  );
}

function OHoTro({ h }: { h: HangHv['hoTro'] }) {
  if (!h.sos && !h.soCase) return <span className="text-faint" title={t('Không có Case')}>—</span>;   // HV-LOP-SUA: bớt chữ lặp mỗi dòng
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
      {/* HV-LOP-GON: Overall nổi (15 / 700, màu kết quả) · kỳ vọng + tuần là chữ phụ mờ 12. */}
      <span className="flex items-baseline gap-1.5">
        <ODiem so={chuSo(m.ovr)} kq={kqOverall(m.ovr, m.kyVong)} kck={g.loTrinh.kck} nhan="Overall" />
        <span className="whitespace-nowrap text-xs tabular-nums text-faint">/ KV {chuSo(m.kyVong) ?? '—'} · {m.tuan ? tuanLich(m.tuan, homNay) : `MT${m.mt}`}</span>
      </span>
      <MiniKn kn={m.kn} kv={m.kyVong} />
    </span>
  );
}

const COT_HV: CotBang[] = [
  { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 210 },
  { key: 'lo', nhan: t('Lộ trình'), kieu: 'chu', rong: 104 },
  { key: 'mt', nhan: t('MT gần nhất'), kieu: 'chu', rong: 224 },
  { key: 'ho', nhan: t('Hỗ trợ'), kieu: 'chu', rong: 140 },
  { key: 'y', nhan: t('Ý thức'), kieu: 'chu', rong: 112 },
  { key: 'lich', nhan: t('Lịch thi'), kieu: 'chu', rong: 180 },
  { key: 'viec', nhan: t('Việc'), kieu: 'viec' },
  { key: 'nut', nhan: '', kieu: 'nut' },
];
/** CX (không có Công việc): cột Việc thành cột Phụ huynh giãn (SĐT bấm gọi). TVV: không cột Phụ huynh (chủ SP 27/10 — SĐT ở thẻ 375 và hồ sơ). */
const cotHv = (vai?: VaiBang): CotBang[] => (!vai || vai.coViec ? COT_HV
  : COT_HV.map((c): CotBang => (c.key === 'viec' ? { key: 'ph', nhan: t('Phụ huynh'), kieu: 'viec' } : c)));

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

/** Một lớp của danh sách theo lớp (HV-LOP-SUA): `dau` = nội dung hàng lớp (nơi gọi dựng: mã (link hồ sơ) · n HV · GVCN · SOS · việc cấp lớp · ⋯); `hv` chỉ vẽ khi `mo`. */
export type NhomLop = { id: number; nhan: string; dau: ReactNode; mo: boolean; onMo: () => void; hv: HvGon[] };

/**
 * BẢNG "TẤT CẢ" THEO LỚP (HV-LOP-SUA, mockup đã duyệt `thiet-ke/v5/hoc-vien-lop.html`; chủ SP 27/10 "mặc định danh sách THEO LỚP"): hàng lớp ▾ (`HangNhom`)
 * rồi mỗi em một dòng — Học viên · Lộ trình · MT gần nhất (Overall / KV + 5 kỹ năng) · Hỗ trợ · Ý thức · Lịch thi · Việc · ⋯ (thao tác của em, giữ — `10` mục 8).
 * Bỏ Xu hướng (chủ SP 27/10). Em lớp thường: cột MT để "—" (không có lượt MT).
 */
export function BangHvGon({ nhom, lop, viec, gopMon, nguCanh, onMoViec, onDoi, vai }: {
  nhom: NhomLop[]; lop: Map<number, LopGon>; viec: Map<number, ViecEm[]>; gopMon?: boolean; nguCanh: NguCanhDs; onMoViec: (it: WorkItem) => void; onDoi: () => void; vai?: VaiBang;
}) {
  const o = (h: HvGon, c: CotBang) => {
    const g = h.hang;
    const ev = vai?.em.get(h.id);
    switch (c.key) {
      case 'ten': return <TenEm h={h} ev={ev} ds={nguCanh} />;
      case 'lo': return g
        ? <span className="block"><b className="block font-medium tabular-nums text-slate-100" title={t('MT đã xong / đã tạo')} aria-label={g.loTrinh.soMt ? `${t('MT đã xong / đã tạo')}: ${g.loTrinh.mt}/${g.loTrinh.soMt}` : undefined}>
            {g.loTrinh.soMt ? `${g.loTrinh.mt}/${g.loTrinh.soMt} MT` : '—'}</b>
            <span className="block text-xs text-slate-400">Target <TargetText band={g.loTrinh.target} kck={g.loTrinh.kck} /></span></span>
        : <span className="block truncate text-xs text-slate-400">{lop.get(h.classId)?.programmeName ? dich(lop.get(h.classId)!.programmeName!) : '—'}</span>;
      case 'mt': return g ? <OMtGan g={g} /> : trong;
      case 'ho': return g ? <OHoTro h={g.hoTro} /> : trong;
      case 'y': return g?.yThuc ? <Nhan tone="doing">{dich(g.yThuc)}</Nhan> : trong;
      case 'lich': return ev ? <OLich h={h} ev={ev} onMoEm={vai?.onMoEm} /> : <ChipLichThi l={h.lich} />;
      case 'viec': return <OViec v={viec.get(h.id)} onMo={onMoViec} gopMon={gopMon} />;
      case 'ph': return ev ? <span className="block text-sm"><OPhuHuynh l={ev.lienHe} /></span> : trong;
      default: return <MenuEm h={h} lop={lop.get(h.classId)} ev={ev} onDoi={onDoi} />;
    }
  };
  const cot = cotHv(vai);
  type Dong = { k: 'lop'; g: NhomLop } | { k: 'hv'; h: HvGon };
  const dong: Dong[] = nhom.flatMap((g): Dong[] => [{ k: 'lop', g }, ...(g.mo ? g.hv.map((h): Dong => ({ k: 'hv', h })) : [])]);
  return <Bang ten={t('Học viên & Lớp')} cot={cot} hang={dong} khoa={(d) => (d.k === 'lop' ? `lop:${d.g.id}` : `${d.h.classId}:${d.h.id}`)} khung={false} the375={false} dinh
    hangRieng={(d) => (d.k === 'lop'
      ? <HangNhom mo={d.g.mo} onMo={d.g.onMo} nhan={d.g.nhan} tieuDe={d.g.dau} soCotDau={cot.length} />
      : <tr className={`do-hang ${d.h.ketThuc ? 'opacity-60' : ''} ${d.h.lich?.trangThai === 'da-thi' ? 'hang-da-thi' : ''}`}>{cot.map((c) => <OBang key={c.key} c={c}>{o(d.h, c)}</OBang>)}</tr>)} />;
}

/** Điện thoại (< 640 px): hàng lớp (▾ + `dau`) rồi mỗi em một thẻ — tên · chip (SOS trước, không thì lịch thi) · ⋯; dòng 2 = việc, không việc thì Target · Overall. */
export function TheHvGon({ nhom, ...p }: Omit<Parameters<typeof TheHvLop>[0], 'ds'> & { nhom: NhomLop[] }) {
  return (
    <div>
      {nhom.map((g) => (
        <section key={g.id} aria-label={g.nhan}>
          {/* HV-LOP-GON: lớp gập mặc định → cả dải là vùng bấm mở / gập (như hàng lớp 1440); mũi tên đứng cạnh mã lớp, không lơ lửng giữa khối. */}
          <div className="flex min-h-[44px] cursor-pointer items-start gap-2 border-t px-3 py-2 first:border-t-0" onClick={(e) => boQuaNutCon(e, g.onMo)} style={{ borderColor: 'var(--line)', background: g.mo ? 'var(--hang-lon-bg)' : 'var(--hang-lon-dong-bg)', boxShadow: `inset 3px 0 0 var(${g.mo ? '--hang-lon-vach' : '--hang-lon-dong-vach'})` }}>
            <span className="mt-[9px] inline-flex"><MuiTenMo mo={g.mo} onMo={g.onMo} nhan={g.nhan} /></span>
            <div className="min-w-0 flex-1">{g.dau}</div>
          </div>
          {g.mo && <TheHvLop ds={g.hv} {...p} />}
        </section>
      ))}
    </div>
  );
}

function TheHvLop({ ds, lop, viec, gopMon, nguCanh, onMoViec, onDoi, vai }: {
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
          <article key={`${h.classId}:${h.id}`} className={`space-y-1 border-t px-3 py-2.5 first:border-t-0 ${h.ketThuc ? 'opacity-60' : ''} ${h.lich?.trangThai === 'da-thi' ? 'hang-da-thi' : ''}`} style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2">
              <Link className="ten-ho-so khong-mui min-w-0 truncate" to={`/hoc-vien/${h.id}`} state={{ ds: nguCanh }}>{h.ten}</Link>
              {ev?.status === 'inactive' && <span className="shrink-0 text-xs text-slate-400">{t('Tạm dừng')}</span>}
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
          <Link className="ten-ho-so khong-mui block truncate" to={`/hoc-vien/${r.studentId}`} state={{ ds: nguCanh }}>{r.ten}</Link>
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
