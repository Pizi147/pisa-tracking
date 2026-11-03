import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Bang, OBang, type CotBang } from '../../ui/Bang.tsx';
import { MuiTenMo, boQuaNutCon } from '../../ui/HangNhom.tsx';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';
import { XacNhanXuLyPanel } from '../yThuc/XacNhanXuLyPanel.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { ODiem } from '../../ui/ODiem.tsx';
import { ExamPlanText, TargetText } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { skillShort } from '../../lib/format.ts';
import { nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from '../classes/thaoTacDongHocVien.tsx';
import { ChipLichThi, kqOverall } from './GocLichThi.tsx';
import { ViecTiepDong, type DongSos } from './BangSos.tsx';
import { OPhuHuynh } from './HocVienTheoVai.tsx';
import { NhanSauThi } from './HopGiaHan.tsx';
import { boTenEm, chuPhuHuynh, chuThanhPhan, duongHoSoHocVien, shortDate, tuanLich, type EntrySkill, type ExamPlan, type GiaiDoanSauThi, type HangHv, type LichThi, type LienHe, type NguCanhDs } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';

/** Một em của danh sách gọn (`GET /hoc-vien-lop` → `hocVien`, SV-SO3 `hang` + UI-HV-LOP `tvv` / `lich`). */
export type HvGon = {
  id: number; classId: number; ten: string; khung: 'ft' | 'thuong';
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
const KN5 = ['L', 'R', 'W1', 'W2', 'S'] as const;
const KN_DAY: Record<(typeof KN5)[number], EntrySkill> = { L: 'listening', R: 'reading', W1: 'writing1', W2: 'writing2', S: 'speaking' };

/** ⋯ CUỐI DÒNG HỌC VIÊN — cùng menu / panel với hồ sơ lớp (`useThaoTacDongHocVien`, quyền theo lớp của em); "Nhập điểm" mở panel lớp đúng lượt còn nợ. */
function MenuEm({ h, lop, ev, onDoi }: { h: HvGon; lop: LopGon | undefined; ev?: EmVai; onDoi: () => void }) {
  const thuong = lop?.scoringMode === 'ratio';
  const khong = { coTheSuaHocVien: false, coTheBaoCase: false, coTheGhiViPham: false, coTheNhapDiem: false };
  /* TVV / CX: ⋯ theo vai (Sửa thông tin · Tạm dừng / Thôi học · Kết quả thi thật · Mở hồ sơ), quyền theo chính em (máy chủ) — như bảng V4 của vai. */
  const tt = useThaoTacDongHocVien({ laLopThuong: thuong, quyen: ev ? { ...khong, theoVai: true } : lop?.viewer ?? khong,
    maLop: lop?.code ?? null, classId: lop?.id ?? null, onDone: onDoi });
  const nd = h.nhapDiem && lop ? nhapDiemCua(lop.id, thuong, [{ kind: h.nhapDiem.kind, kindLabel: h.nhapDiem.dot ?? h.nhapDiem.kind, myPending: ['*'], attemptNo: h.nhapDiem.attemptNo }]) : null;
  const muc = tt.mucCua({ id: h.id, ten: h.ten, dangHoc: true, nhapDiem: nd, status: ev?.status ?? 'active', ft: ev?.ft ?? !thuong, maLop: lop?.code ?? null,
    xuLyYThuc: !!h.hang?.yThucHop?.canLam,
    ...(ev ? { suaThongTin: ev.viewer.suaThongTin, suaThem: ev.viewer.suaThem, kyThi: !!ev.kyThi } : {}) });
  return <>{muc.length > 0 && <MenuDong muc={muc} nhan={t('Thao tác khác')} />}{createPortal(tt.panels, document.body)}</>;
}

/** Chữ khớp ô tìm tô hồng (V14) — so không dấu, không phân biệt hoa thường; giữ nguyên chữ gốc. */
const boDau = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const khopTim = (chu: string, tim?: string) => { const q = boDau(tim?.trim() ?? ''); return q.length >= 2 ? boDau(chu).indexOf(q) : -1; };
function ToKhop({ chu, tim }: { chu: string; tim?: string }) {
  const i = khopTim(chu, tim);
  if (i < 0) return <>{chu}</>;
  const n = boDau(tim!.trim()).length;
  return <>{chu.slice(0, i)}<span className="khop-tim">{chu.slice(i, i + n)}</span>{chu.slice(i + n)}</>;
}

/** Tên em (link hồ sơ, chữ khớp ô tìm tô hồng) + dòng phụ TVV / Tạm dừng (mockup U04 `.dong2`). */
function TenEm({ h, ev, ds, tim }: { h: HvGon; ev?: EmVai; ds: NguCanhDs; tim?: string }) {
  const phu = [ev?.status === 'inactive' ? t('Tạm dừng') : null, h.tvv ? `TVV ${h.tvv}` : null].filter(Boolean).join(' · ');
  return (
    <span className="block min-w-0">
      <Link className="ten-ho-so khong-mui block" to={`/hoc-vien/${h.id}`} state={{ ds }}><ToKhop chu={h.ten} tim={tim} /></Link>
      {phu && <span className="dong2">{phu}</span>}
    </span>
  );
}

/**
 * HỘP NHỎ TẠI CHỖ (U04-1, K7): nút + hộp ngay dưới nút; Esc / bấm ngoài / cuộn đóng, Esc trả focus về nút. Không panel trượt (chủ SP 03/11).
 * Hộp vẽ qua portal `position: fixed` theo vị trí nút — khung bảng (cuộn ngang, thẻ `overflow-hidden`) không cắt hộp.
 */
function HopNho({ nut, nhan, nutLop, children, rong }: { nut: ReactNode; nhan: string; nutLop: string; children: ReactNode; rong?: boolean }) {
  const [cho, setCho] = useState<{ top: number; left: number } | null>(null);
  const nutRef = useRef<HTMLButtonElement>(null);
  const hopRef = useRef<HTMLSpanElement>(null);
  const mo = cho !== null;
  const qua = useBamNgoai(mo, () => setCho(null), nutRef, hopRef);
  useEffect(() => {
    if (!mo) return undefined;
    const dong = () => setCho(null);
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setCho(null); nutRef.current?.focus(); } };
    window.addEventListener('scroll', dong, true);
    window.addEventListener('resize', dong);
    document.addEventListener('keydown', phim, true);
    return () => { window.removeEventListener('scroll', dong, true); window.removeEventListener('resize', dong); document.removeEventListener('keydown', phim, true); };
  }, [mo]);
  const bat = () => {
    if (mo) { setCho(null); return; }
    const r = nutRef.current!.getBoundingClientRect();
    const rongHop = rong ? 300 : 260;
    setCho({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - rongHop - 8)) });
  };
  return (
    <>
      <button ref={nutRef} type="button" className={nutLop} aria-expanded={mo} aria-label={nhan} onClick={bat} {...qua}>{nut}</button>
      {cho && createPortal(
        <span ref={hopRef} className={`hop-nho ${rong ? 'hop-nho-rong' : ''}`} role="dialog" aria-label={nhan} style={cho} {...qua}>{children}</span>, document.body)}
    </>
  );
}

/** Một việc của tôi: ô có khung — tên việc (bấm làm tại chỗ) + viên chấm màu + ngày hạn; quá hạn "⚠ 30/10" đỏ (vòng 2 chủ SP 03/11 khuya). */
function OMotViec({ x, onMo }: { x: ViecEm; onMo: (it: WorkItem) => void }) {
  const { homNay } = useNgayNghiepVu();
  const nhan = dich(x.it.statusLabel);
  const tt = x.quaHan ? 'qua' : nhan === t('Đang làm') ? 'dang' : nhan === t('Chờ duyệt') ? 'cho' : 'chua';
  const ten = { qua: t('Quá hạn'), dang: t('Đang làm'), cho: t('Chờ duyệt'), chua: t('Chưa làm') }[tt];
  const ngay = x.han ? shortDate(x.han, homNay) : null;
  return (
    <span className={`o-viec ${x.quaHan ? 'o-viec-qua' : ''}`}>
      <button type="button" className="o-viec-ten" onClick={() => onMo(x.it)}>{boTenEm(dich(x.chu), x.it.studentName)}</button>
      <span className={`vh vh-${tt}`} role="img" aria-label={[ten, ngay ? t('hạn {ngay}', { ngay }) : null].filter(Boolean).join(', ')}>{ngay}</span>
    </span>
  );
}

/**
 * Ô Việc của tôi (U04-5, chủ SP 03/11 khuya): CHỈ việc của người đang xem (nơi gọi lọc `mine`). Một việc gấp nhất trong ô có khung; còn lại → ô số "+n việc"
 * mở dải dưới hàng (cùng dải ô Overall — không panel). Việc cấp lớp nằm ở hàng lớp (nơi gọi lọc), không lặp ở từng em.
 */
export function OViec({ v, onMo, onMoDai }: { v: ViecEm[] | undefined; onMo: (it: WorkItem) => void; onMoDai: () => void }) {
  if (!v?.length) return trong;
  return (
    <span className="grid min-w-0 justify-items-stretch gap-1">
      <OMotViec x={v[0]} onMo={onMo} />
      {v.length > 1 && <button type="button" className="viec-them justify-self-start" onClick={onMoDai}>{t('+{n} việc', { n: v.length - 1 })}</button>}
    </span>
  );
}

/** Hỗ trợ: chỉ chip SOS + môn (PTA 03/11: Case / PA xem ở dải dưới hàng hoặc hồ sơ — cùng mức hồ sơ lớp U03). */
function OHoTro({ h }: { h: HangHv['hoTro'] }) {
  return h.sos ? <ChipSos muc={h.sos} kyNang={h.kyNang.map((k) => skillShort(k))} /> : trong;
}

/** Overall của MT gần nhất (✓ / = / ✗ trên số); có điểm môn → nút mở dải điểm từng môn dưới hàng. */
function NutOvr({ g, mo, onMo }: { g: HangHv; mo: boolean; onMo: () => void }) {
  const m = g.mtGan!;
  const so = m.ovr == null ? <span className="text-sm text-dim">{t('Chưa có Overall')}</span>
    : <ODiem so={chuSo(m.ovr)} kq={kqOverall(m.ovr, m.kyVong)} kck={g.loTrinh.kck} nhan="Overall" chiToHut />;
  if (!KN5.some((k) => m.kn[k] != null)) return so;
  return (
    <button type="button" className="o-ovr" aria-expanded={mo} aria-label={t('Điểm từng môn MT{n}', { n: m.mt })} onClick={onMo}>
      {so}<span className="mui-o" aria-hidden>{mo ? '▴' : '▾'}</span>
    </button>
  );
}

/** MT gần nhất: ô Overall + dòng phụ "kỳ vọng 7.5 · MT2 · W4 SEP" (bỏ chữ tắt KV — PTA 03/11). */
function OMtGan({ g, mo, onMo }: { g: HangHv; mo: boolean; onMo: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const m = g.mtGan;
  if (!m) return trong;
  return (
    <span className="block">
      <NutOvr g={g} mo={mo} onMo={onMo} />
      <span className="dong2 tabular-nums">{[m.kyVong != null ? t('kỳ vọng {kv}', { kv: chuSo(m.kyVong)! }) : null, `MT${m.mt}`, m.tuan ? tuanLich(m.tuan, homNay) : null].filter(Boolean).join(' · ')}</span>
    </span>
  );
}

/** Ô một kỹ năng trong dải: nhãn + điểm (✓ / ✗ như Overall). Có điểm thành phần / số câu → bấm mở hộp nhỏ; chỉ có band → không bấm (U04-1). */
function OKn({ k, g }: { k: (typeof KN5)[number]; g: HangHv }) {
  const m = g.mtGan!;
  const v = m.kn[k];
  const ruot = <><span className="okn-t">{k}</span>{v == null ? <span className="text-faint">–</span> : <ODiem so={chuSo(v)} kq={kqOverall(v, m.kyVong)} kck={g.loTrinh.kck} nhan={k} chiToHut />}</>;
  const ct = v == null ? null : chuThanhPhan(KN_DAY[k], m.tp?.[k], v);
  if (!ct) return <span className="okn">{ruot}</span>;
  const cau = k === 'L' || k === 'R';
  return <HopNho nutLop="okn" nhan={`${k} ${chuSo(v)} · ${cau ? t('số câu') : t('điểm thành phần')}`} nut={ruot}><span className="tabular-nums">{cau ? ct.replace('câu', t('câu')) : ct}</span></HopNho>;
}

/**
 * DẢI DƯỚI HÀNG EM (U04 ý 2 + 25, chủ SP 03/11: rời hàng em, mở dưới hàng, KHÔNG panel trượt): điểm 5 môn của lượt (tiêu đề "MT2 · W4 SEP · kỳ vọng 7.0") ·
 * Hỗ trợ (Case · PA đang mở) · Việc của tôi (mọi việc, mỗi việc một ô). Dữ liệu đã nạp — không request.
 */
function DaiEm({ g, v, onMoViec }: { g: HangHv | undefined; v: ViecEm[] | undefined; onMoViec: (it: WorkItem) => void }) {
  const { homNay } = useNgayNghiepVu();
  const m = g?.mtGan;
  return (
    <div className="hvl-dai">
      {m && g && KN5.some((k) => m.kn[k] != null) && (
        <div className="hvl-dai-k">
          <span className="hvl-dai-t">{[`MT${m.mt}`, m.tuan ? tuanLich(m.tuan, homNay) : null].filter(Boolean).join(' · ')}{m.kyVong != null && <span className="text-faint"> · {t('kỳ vọng {kv}', { kv: chuSo(m.kyVong)! })}</span>}</span>
          <span className="hvl-dai-kn">{KN5.map((k) => <OKn key={k} k={k} g={g} />)}</span>
        </div>
      )}
      {g && g.hoTro.soCase > 0 && (
        <div className="hvl-dai-k"><span className="hvl-dai-t">{t('Hỗ trợ')}</span><span className="text-sm tabular-nums">{t('{c} Case · {p} PA', { c: g.hoTro.soCase, p: g.hoTro.soPa })}</span></div>
      )}
      {!!v?.length && (
        <div className="hvl-dai-k">
          <span className="hvl-dai-t">{t('Việc của tôi')} · <span className="tabular-nums">{v.length}</span></span>
          <ul className="hvl-dai-v">{v.map((x) => <li key={x.it.key}><OMotViec x={x} onMo={onMoViec} /></li>)}</ul>
        </div>
      )}
    </div>
  );
}

/**
 * Ý THỨC (K7 của U10, chủ SP 03/11): chip bậc bấm → hộp nhỏ ngay dưới chip — Cần làm · Vi phạm chờ · Đã tới · Lần này · Báo PH; "Hồ sơ ›" sang tab Ý thức hồ sơ HV;
 * "Xác nhận xử lý" (người ghi vi phạm được, khi em đang cần xử lý) mở panel Xác nhận như ⋯. Dữ liệu từ trạng thái Ý thức trang đã đọc (+1 câu Báo PH).
 */
function OYThuc({ h, g, lop, onDoi }: { h: HvGon; g: HangHv; lop: LopGon | undefined; onDoi: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const [xuLy, setXuLy] = useState(false);
  const y = g.yThucHop;
  if (!g.yThuc) return trong;
  if (!y) return <Nhan tone="doing">{dich(g.yThuc)}</Nhan>;
  const cl = y.canLam;
  const tieu = t('Ý thức · {ten}', { ten: h.ten });
  return (
    <>
      <HopNho nutLop="chip-bac" nhan={tieu} rong nut={dich(g.yThuc)}>
        <b className="block text-[14px]">{tieu}</b>
        <dl className="hop-dl">
          <dt>{t('Cần làm')}</dt>
          <dd>{!cl ? '—' : cl.nhom === 'qua_han'
            ? <span className="vh vh-qua">{cl.quaHanNgay ? t('Quá hạn {n} ngày', { n: cl.quaHanNgay }) : t('Quá hạn')}</span>
            : <span className="vh vh-dang">{cl.han ? t('hạn {ngay}', { ngay: shortDate(cl.han, homNay) }) : t('Bắt buộc xử lý')}</span>}</dd>
          <dt>{t('Vi phạm chờ')}</dt><dd className="tabular-nums">{y.viPhamCho}</dd>
          <dt>{t('Đã tới')}</dt><dd>{dich(g.yThuc)}</dd>
          <dt>{t('Lần này')}</dt><dd>{dich(y.lanNay)}</dd>
          {y.baoPh && <><dt>{t('Báo PH')}</dt><dd>{t('lần {lan}', { lan: dich(y.baoPh.lan) })} <span className={`vh ${y.baoPh.xong ? 'vh-xong' : 'vh-chua'}`}>
            {y.baoPh.xong ? (y.baoPh.ngay ? t('Đã báo {ngay}', { ngay: shortDate(y.baoPh.ngay, homNay) }) : t('Đã báo PH')) : t('Chưa báo')}</span></dd></>}
        </dl>
        <span className="hop-chan">
          <Link className="btn btn-sm" to={duongHoSoHocVien(h.id, { tab: 'y-thuc' })}>{t('Hồ sơ')} ›</Link>
          {cl && lop?.viewer.coTheGhiViPham && <button type="button" className="btn btn-sm btn-primary" onClick={() => setXuLy(true)}>{t('Xác nhận xử lý')}</button>}
        </span>
      </HopNho>
      {xuLy && createPortal(<XacNhanXuLyPanel studentId={h.id} lop={lop?.code ?? null} onClose={() => setXuLy(false)} onDone={onDoi} />, document.body)}
    </>
  );
}

/*
 * U04 cân đối cột (chủ SP 03/11 khuya: vừa màn 1280, không cuộn ngang): Học viên 190 · Lộ trình 96 · MT gần nhất 200 · Hỗ trợ 172 (chip "SOS 3 · L, R, W, S" đủ) · Ý thức 100 · Lịch thi 150 ·
 * Việc của tôi giãn · ⋯ cuối 48. Tổng cố định 956 + Việc ≥ 240 < bề ngang thẻ ở 1280.
 */
const COT_HV: CotBang[] = [
  { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 190 },
  { key: 'lo', nhan: t('Lộ trình'), kieu: 'chu', rong: 96 },
  { key: 'mt', nhan: t('MT gần nhất'), kieu: 'chu', rong: 200 },
  { key: 'ho', nhan: t('Hỗ trợ'), kieu: 'chu', rong: 172 },
  { key: 'y', nhan: t('Ý thức'), kieu: 'chu', rong: 100 },
  { key: 'lich', nhan: t('Lịch thi'), kieu: 'chu', rong: 150 },
  { key: 'viec', nhan: t('Việc của tôi'), kieu: 'viec' },
  { key: 'nut', nhan: '', kieu: 'nut', rong: 48 },
];
/** CX (không có Công việc): cột Việc thành cột Phụ huynh giãn (SĐT bấm gọi). TVV: không cột Phụ huynh (chủ SP 27/10 — SĐT ở thẻ 375 và hồ sơ). */
const cotHv = (vai?: VaiBang): CotBang[] => (!vai || vai.coViec ? COT_HV
  : COT_HV.map((c) => (c.key === 'viec' ? { key: 'ph', nhan: t('Phụ huynh'), kieu: 'viec' } : c)));

/** Ô Lịch thi: chip lịch ("Đã thi 31/10 · chờ KQ" nền lịch nhạt — U04-4); TVV / CX thêm nhãn sau thi (bấm = panel một em). Em ngoài danh sách lớp chưa có `lich` → dự kiến thi. */
function OLich({ h, ev, onMoEm }: { h: HvGon; ev?: EmVai; onMoEm?: (id: number) => void }) {
  return (
    <span className="block">
      {h.lich || !ev ? <ChipLichThi l={h.lich} them={h.lich?.trangThai === 'da-thi' ? t('chờ KQ') : undefined} /> : <span className="text-xs text-slate-300"><ExamPlanText plan={ev.duKienThi} /></span>}
      {ev?.sauThi && onMoEm && (
        <button type="button" className="mt-1 block cursor-pointer appearance-none whitespace-normal border-0 bg-transparent p-0 text-left hover:underline" onClick={() => onMoEm(h.id)}>
          <NhanSauThi s={ev.sauThi} gon />
        </button>
      )}
    </span>
  );
}

/** Một lớp của danh sách theo lớp (HV-LOP-SUA): `dau` = các ô của hàng lớp (nơi gọi dựng, lưới thẳng cột — bài học UX-A); `hv` chỉ vẽ khi `mo`. */
export type NhomLop = { id: number; nhan: string; dau: ReactNode; mo: boolean; onMo: () => void; hv: HvGon[] };
type PropsBang = {
  nhom: NhomLop[]; lop: Map<number, LopGon>; viec: Map<number, ViecEm[]>; nguCanh: NguCanhDs; onMoViec: (it: WorkItem) => void;
  onDoi: () => void; vai?: VaiBang;
  /** Chữ ô tìm (≥ 2 chữ) — tô hồng chữ khớp + nền dòng khớp. */
  tim?: string;
};

/** Hàng lớp (mockup U04 `.hl-lop`): ▸ + các ô lưới; bấm cả hàng mở / gập, bấm link / nút con thì để yên (`boQuaNutCon`). */
function HangLop({ g }: { g: NhomLop }) {
  return (
    <div className={`hl-lop ${g.mo ? 'mo-lop' : ''}`} onClick={(e) => boQuaNutCon(e, g.onMo)}>
      <MuiTenMo mo={g.mo} onMo={g.onMo} nhan={g.nhan} />
      {g.dau}
    </div>
  );
}

/** Khoá dải đang mở của em (dữ liệu chuyển lớp dở có thể có cùng em ở hai lớp → khoá theo lớp + em). */
const khoaEm = (h: HvGon) => `${h.classId}:${h.id}`;
function useDai() {
  const [dai, setDai] = useState<ReadonlySet<string>>(new Set());
  return { co: (k: string) => dai.has(k), doi: (k: string) => setDai((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; }) };
}

/**
 * BẢNG "TẤT CẢ" THEO LỚP (V11 U04, chủ SP duyệt 03/11): hàng lớp rồi — chỉ lớp đang mở — bảng em có tiêu đề cột riêng (B10: lớp gập không có hàng tiêu đề).
 * Cột: Học viên · Lộ trình · MT gần nhất · Hỗ trợ · Ý thức · Lịch thi · Việc của tôi · ⋯. Bấm ô Overall / "+n việc" → dải dưới hàng em.
 */
export function BangHvGon({ nhom, lop, viec, nguCanh, onMoViec, onDoi, vai, tim }: PropsBang) {
  const dai = useDai();
  const cot = cotHv(vai);
  const o = (h: HvGon, c: CotBang) => {
    const g = h.hang;
    const ev = vai?.em.get(h.id);
    const k = khoaEm(h);
    switch (c.key) {
      case 'ten': return <TenEm h={h} ev={ev} ds={nguCanh} tim={tim} />;
      case 'lo': return g
        ? <span className="block"><b className="block font-semibold tabular-nums text-slate-100" aria-label={g.loTrinh.soMt ? `${t('MT đã xong / đã tạo')}: ${g.loTrinh.mt}/${g.loTrinh.soMt}` : undefined}>
            {g.loTrinh.soMt ? `MT ${g.loTrinh.mt}/${g.loTrinh.soMt}` : '—'}</b>
            <span className="dong2">Target <TargetText band={g.loTrinh.target} kck={g.loTrinh.kck} /></span></span>
        : <span className="block truncate text-xs text-faint">{lop.get(h.classId)?.programmeName ? dich(lop.get(h.classId)!.programmeName!) : '—'}</span>;
      case 'mt': return g ? <OMtGan g={g} mo={dai.co(k)} onMo={() => dai.doi(k)} /> : trong;
      case 'ho': return g ? <OHoTro h={g.hoTro} /> : trong;
      case 'y': return g ? <OYThuc h={h} g={g} lop={lop.get(h.classId)} onDoi={onDoi} /> : trong;
      case 'lich': return <OLich h={h} ev={ev} onMoEm={vai?.onMoEm} />;
      case 'viec': return <OViec v={viec.get(h.id)} onMo={onMoViec} onMoDai={() => dai.doi(k)} />;
      case 'ph': return ev ? <span className="block text-sm"><OPhuHuynh l={ev.lienHe} /></span> : trong;
      default: return <MenuEm h={h} lop={lop.get(h.classId)} ev={ev} onDoi={onDoi} />;
    }
  };
  return (
    <div className="bang-hv">
      {nhom.map((g) => (
        <section key={g.id} aria-label={g.nhan}>
          <HangLop g={g} />
          {g.mo && g.hv.length > 0 && (
            <Bang ten={t('Học viên & Lớp')} cot={cot} hang={g.hv} khoa={khoaEm} khung={false} the375={false} dinh
              hangRieng={(h) => (
                <>
                  <tr className={`do-hang ${dai.co(khoaEm(h)) ? 'dang-mo' : ''} ${khopTim(h.ten, tim) >= 0 ? 'hang-khop' : ''}`}>
                    {cot.map((c) => <OBang key={c.key} c={c}>{o(h, c)}</OBang>)}
                  </tr>
                  {dai.co(khoaEm(h)) && <tr className="hang-dai"><td colSpan={cot.length}><DaiEm g={h.hang} v={viec.get(h.id)} onMoViec={onMoViec} /></td></tr>}
                </>
              )} />
          )}
        </section>
      ))}
    </div>
  );
}

/** Điện thoại (< 640 px): hàng lớp (▾ + `dau`) rồi mỗi em một thẻ ≤ 4 dòng (B26): tên + ⋯ · TVV · lộ trình · Overall · SOS · Ý thức · Lịch thi · 1 việc. */
export function TheHvGon({ nhom, ...p }: PropsBang) {
  const dai = useDai();
  return (
    <div className="bang-hv">
      {nhom.map((g) => (
        <section key={g.id} aria-label={g.nhan}>
          <HangLop g={g} />
          {g.mo && g.hv.map((h) => <TheEm key={khoaEm(h)} h={h} mo={dai.co(khoaEm(h))} onMo={() => dai.doi(khoaEm(h))} {...p} />)}
        </section>
      ))}
    </div>
  );
}

function TheEm({ h, mo, onMo, lop, viec, nguCanh, onMoViec, onDoi, vai, tim }: Omit<PropsBang, 'nhom'> & { h: HvGon; mo: boolean; onMo: () => void }) {
  const g = h.hang;
  const v = viec.get(h.id);
  const ev = vai?.em.get(h.id);
  const ph = ev ? chuPhuHuynh(ev.lienHe) : null;
  const m = g?.mtGan;
  return (
    <article className="the-em">
      <div className="the-em-1">
        <Link className="ten-ho-so khong-mui min-w-0" to={`/hoc-vien/${h.id}`} state={{ ds: nguCanh }}><ToKhop chu={h.ten} tim={tim} /></Link>
        <span className="shrink-0"><MenuEm h={h} lop={lop.get(h.classId)} ev={ev} onDoi={onDoi} /></span>
      </div>
      <div className="the-em-2">
        {ev?.status === 'inactive' && <span>{t('Tạm dừng')}</span>}
        {h.tvv && <span>TVV {h.tvv}</span>}
        {g && g.loTrinh.soMt > 0 && <span className="tabular-nums">MT {g.loTrinh.mt}/{g.loTrinh.soMt}</span>}
        {m && g && <span className="inline-flex items-center gap-1"><NutOvr g={g} mo={mo} onMo={onMo} />
          {m.ovr != null && <span className="tabular-nums">{m.kyVong != null ? `${t('kỳ vọng {kv}', { kv: chuSo(m.kyVong)! })} · ` : ''}MT{m.mt}</span>}</span>}
      </div>
      <div className="the-em-3">
        {g?.hoTro.sos ? <ChipSos muc={g.hoTro.sos} kyNang={g.hoTro.kyNang.map((k) => skillShort(k))} /> : null}
        {g?.yThuc && <span className="inline-flex items-center gap-1 text-[13px] text-dim">{t('Ý thức')} <OYThuc h={h} g={g} lop={lop.get(h.classId)} onDoi={onDoi} /></span>}
        <OLich h={h} ev={ev} onMoEm={vai?.onMoEm} />
      </div>
      {vai && !vai.coViec ? (ev && (ph || ev.lienHe.parentPhone) && (
        <div className="flex min-w-0 items-baseline gap-1.5 text-xs text-slate-400">
          <span className="shrink-0">{t('Phụ huynh')}</span>
          {ph && <span className="min-w-0 truncate text-slate-300">{ph}</span>}
          {ev.lienHe.parentPhone && <a href={`tel:${ev.lienHe.parentPhone.replace(/[^\d+]/g, '')}`} className="inline-flex min-h-[44px] items-center tabular-nums text-slate-300 no-underline">{ev.lienHe.parentPhone}</a>}
        </div>
      )) : !!v?.length && <OViec v={v} onMo={onMoViec} onMoDai={onMo} />}
      {mo && <DaiEm g={g} v={v} onMoViec={onMoViec} />}
    </article>
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
