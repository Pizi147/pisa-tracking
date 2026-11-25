import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useDemYeuCau, useDuongViecCuaToi } from '../../lib/viecCuaToi.ts';
import { Card, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { VUNG_BAM_SO } from '../../ui/SoLieu.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { CHIP_SOS, CHIP_VUONG, DauQuaHan, LOP_MUC_HAN, lopSos } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { DauViecCongViec, KhungPanel, QuayLaiPanel } from '../../ui/KhungPanel.tsx';
import { DaiLamThay } from '../../ui/DaiLamThay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { PanelViec } from '../congViec/PanelViec.tsx';
import { HopChoDuyet } from '../duyet/HopChoDuyet.tsx';
import type { WorkItem } from './WorkList.tsx';
import { PhanTram, ChuaCoDl, kyChu, thamSoTq, type TongQuanV5Data } from './TongQuanV5.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import {
  laViec, mucHan, ngay, tenMonNgan, tuanLich, loaiTq, maTranLop, nhanLoaiTq, nhomTheoGv, quaHanCuaGv, tabCuaViec, type CotLop, type HangLop, type KhoaChip, type TheYeuCauDto,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * NHẸ HƠN PR-3 — TỔNG QUAN "Hôm nay có gì bất thường?" (mockup `thiet-ke/v23/tong-quan.html` T1–T4 + đặc tả 2026-11-22 mục 3, 6.1–6.3).
 * Hàng "Cần xử lý" theo vai · khối chính (Giáo viên ‖ Chờ duyệt · Lớp cần chú ý ‖ Tình hình). Ô số = panel TẠI CHỖ đúng danh sách tạo ra số; "›" = đổi trang.
 * Nguồn (đo trên bản chép thật, mô tả PR — PTA rà #2002 Turso): MỘT GET `/tong-quan/v5?gon=1&kemViec=1` — SOS / Tình hình (cùng hàm Phân tích, bỏ tập trang
 * không hiện) + `viec` = CHÍNH `dong` Công việc "Tất cả" (`myWork` nguoi=tat-ca) trong cùng request (lượt / điểm đọc một lần); CX: badge `/my-work`.
 */
type Dong = WorkItem & { lamThay?: boolean };
type ViecTatCa = { dong: Dong[] };

const congViec = (q: string) => `/cong-viec?nguoi=tat-ca${q ? `&${q}` : ''}`;

/** Hạn ở Tổng quan (chủ SP 24/11): CHỈ ngày dd/mm/yyyy tô theo `mucHan` — không "quá hạn n ngày", không nền. */
function NgayHan({ han }: { han: string }) {
  const { homNay } = useNgayNghiepVu();
  const muc = homNay ? mucHan(han, homNay) : 'xa';
  return <span className={`whitespace-nowrap text-[13px] tabular-nums ${LOP_MUC_HAN[muc]}`}>{muc === 'qua' && <DauQuaHan />}{ngay(han)}</span>;
}

/* ───────────── Ô "Cần xử lý" ───────────── */

/**
 * Ô: tên · số to · MỘT dòng phụ. Số > 0: cả ô là nút (panel tại chỗ) hoặc link ("›" ở tên = đổi trang). 0 → viền đứt "✓ không có", không bấm.
 * `do`: số là quá hạn / SOS — chữ đỏ + dấu ⚠ (không chỉ màu).
 */
function OCan({ ten, so, phu, onBam, to, o, nguy }: { ten: string; so: number | null; phu?: ReactNode; onBam?: () => void; to?: string;
  /** Ô dùng `OSo` (panel máy chủ): truyền nút số làm con. */ o?: ReactNode; nguy?: boolean }) {
  const lop = 'card flex min-h-[96px] flex-col gap-1 px-4 py-3.5 text-left';
  if (so === 0) {
    return (
      <div className={`${lop} border-dashed`} style={{ borderColor: 'var(--line-strong)' }}>
        <span className="text-sm font-semibold text-dim">{ten}</span>
        <span className="text-[26px] font-bold leading-none text-ok" aria-hidden>✓</span>
        <span className="text-[13px] text-dim">{t('không có')}</span>
      </div>
    );
  }
  const soChu = <span className={`text-[26px] font-bold leading-none tabular-nums ${nguy ? 'text-late' : 'text-slate-100'}`}>{so ?? '…'}</span>;
  const than = <><span className="text-sm font-semibold text-slate-100">{ten}{to && so ? ' ›' : ''}</span>{o ?? soChu}{phu && <span className="text-[13px] text-dim">{phu}</span>}</>;
  if (to && so) return <Link to={to} className={`${lop} ca-o no-underline hover:border-[color:var(--accent)]`}>{than}</Link>;
  if (onBam && so) return <button type="button" onClick={onBam} className={`${lop} ca-o w-full cursor-pointer hover:border-[color:var(--accent)]`} aria-label={`${ten}: ${so}`}>{than}</button>;
  return <div className={`${lop} ${o ? 'ca-o' : ''}`}>{than}</div>;
}
const HangO = ({ children, n }: { children: ReactNode; n: number }) => (
  <div data-hd="tq-can-xu-ly" className={`grid grid-cols-2 gap-3 ${n >= 4 ? 'lg:grid-cols-4' : n === 3 ? 'lg:grid-cols-3' : ''} max-lg:[&>*:last-child:nth-child(odd)]:col-span-2`}>{children}</div>
);
/** Hạn sớm nhất của một tập việc (dòng phụ ô). */
const hanSom = (ds: readonly Dong[]) => ds.map((x) => x.due).filter((x): x is string => !!x).sort()[0] ?? null;

/* ───────────── Panel danh sách việc (ô số → đúng việc tạo ra số) ───────────── */

/** Dòng panel: "em / lớp · việc" — tiêu đề máy chủ đã có tên em thì không ghi lại. */
const tenDong = (x: Dong) => { const td = dich(x.tieuDe); const ai = x.studentName || x.classCode; return ai && !td.includes(ai) ? `${ai} · ${td}` : td; };
export type NhomPanel = { khoa: string; ten: ReactNode; viec: Dong[] };
/**
 * Panel tại chỗ: nhóm (GV / lớp) → dòng "lớp / em · việc · hạn (quá hạn n ngày)". Bấm dòng → `PanelViec` THAY nội dung panel (‹ quay lại danh sách,
 * không panel chồng panel). Việc của người khác: mở thẳng khi máy chủ cho làm thay (`lamThay`, N64 — dải "Bạn đang làm thay …"), lưới điểm (quyền từng ô),
 * hoặc việc chưa ai giữ; còn lại → Công việc mở đúng việc (tóm tắt chỉ đọc ở đó).
 */
function PanelDsViec({ tieuDe, phu, nhom, chan, onDong }: { tieuDe: string; phu?: ReactNode; nhom: NhomPanel[]; chan: { to: string; nhan: string }; onDong: () => void }) {
  const [mo, setMo] = useState<Dong | null>(null);
  const daLam = () => { invalidate('/my-work'); invalidate('/tong-quan'); };
  if (mo) {
    const lamThay = !mo.mine && mo.ownerId !== null;
    return (
      <QuayLaiPanel.Provider value={{ nhan: tieuDe, onClick: () => setMo(null) }}>
        <DauViecCongViec.Provider value={{ loai: lamThay ? t('Làm thay') : t('Việc'), nguoiLam: lamThay ? mo.owner : null,
          daiLamThay: lamThay && mo.lamThay ? <DaiLamThay>{t('Bạn đang làm thay {ai}.', { ai: mo.owner ?? t('người phụ trách') })}</DaiLamThay> : undefined }}>
          <PanelViec key={mo.key} it={mo} onDong={onDong} onDaLam={daLam} onTiep={null} />
        </DauViecCongViec.Provider>
      </QuayLaiPanel.Provider>
    );
  }
  const moDuoc = (x: Dong) => x.mine || x.ownerId === null || !!x.lamThay || x.group === 'score';
  return (
    <KhungPanel rong="viec" tieuDe={tieuDe} phu={phu} onDong={onDong}
      chan={{ huy: null, chinh: <Link to={chan.to} className="btn min-h-[44px] sm:min-h-[36px]">{chan.nhan} ›</Link> }}>
      <div className="-mx-1 flex flex-col gap-3">
        {nhom.map((g) => (
          <section key={g.khoa} className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line)' }}>
            <h3 className="m-0 flex items-baseline gap-2 border-b px-3.5 py-2.5 text-base font-bold text-slate-100" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
              {g.ten}<span className={`text-[13px] font-semibold ${g.viec.every((x) => x.urgency === 'overdue') ? 'text-late' : 'text-dim'}`}>{t('{n} việc', { n: g.viec.length })}</span>
            </h3>
            <ul className="m-0 list-none p-0">
              {g.viec.map((x) => {
                /* Nhóm đã là tên lớp thì dòng KHÔNG nhắc lại "Lớp MB FT 101 ·" ở đầu (không chữ lặp đề mục). */
                const [dau, ...con] = tenDong(x).split(' · ');
                const tenDong1 = x.classCode && g.ten === x.classCode && con.length && dau.includes(x.classCode) ? con.join(' · ') : tenDong(x);
                const chu = (
                  <>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-100">{tenDong1}</span>
                      <span className="block text-[13px] text-dim">{[nhanLoaiTq(loaiTq(x)), x.studentName && g.ten !== x.classCode && !tenDong(x).includes(x.classCode ?? '') ? x.classCode : null, x.soBai ? t('thiếu {n} bài', { n: x.soBai }) : null].filter(Boolean).join(' · ')}</span>
                    </span>
                    {x.due && <span className="shrink-0 text-right"><NgayHan han={x.due} /></span>}
                  </>
                );
                const lop = 'flex min-h-[48px] w-full items-center justify-between gap-3 border-t px-3.5 py-2 text-left first:border-t-0 hover:bg-[color:var(--accent-soft)]';
                return (
                  <li key={x.key} className="border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
                    {moDuoc(x) ? <button type="button" className={`${lop} cursor-pointer border-0 bg-transparent`} onClick={() => setMo(x)}>{chu}</button>
                      : <Link to={congViec(`viec=${encodeURIComponent(x.key)}`)} className={`${lop} border-0 no-underline`}>{chu}</Link>}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </KhungPanel>
  );
}

/* ───────────── Khối Giáo viên (Head / Quản trị) ───────────── */

const TOI_DA_LOAI = 3;
const COT_GV: readonly CotBang[] = [
  { key: 'gv', nhan: t('Giáo viên'), kieu: 'ten', linhHoat: true }, { key: 'qh', nhan: t('Quá hạn'), kieu: 'so', rong: 88 }, { key: 'loai', nhan: t('Loại'), kieu: 'chu', rong: 380 },
];
function LoaiGv({ loai, onLoai }: { loai: [string, number][]; onLoai: (k: string) => void }) {
  const [het, setHet] = useState(false);
  const hien = het ? loai : loai.slice(0, TOI_DA_LOAI);
  return (
    <span className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
      {hien.map(([k, n], i) => (
        <span key={k} className="inline-flex items-center whitespace-nowrap">
          {i > 0 && <span className="px-1 text-faint" aria-hidden>·</span>}
          <button type="button" onClick={() => onLoai(k)} className={`${VUNG_BAM_SO} cursor-pointer rounded border-0 bg-transparent px-0.5 text-slate-200 hover:underline`}>
            <b className="tabular-nums text-slate-100">{n}</b> {nhanLoaiTq(k)}
          </button>
        </span>
      ))}
      {!het && loai.length > TOI_DA_LOAI && (
        <button type="button" onClick={() => setHet(true)} className={`${CHIP_VUONG} ${VUNG_BAM_SO} ml-1 cursor-pointer bg-transparent text-dim hover:text-slate-100`}
          aria-label={t('Thêm {n} loại', { n: loai.length - TOI_DA_LOAI })}>+{loai.length - TOI_DA_LOAI}</button>
      )}
    </span>
  );
}

type MoPanel = { tieuDe: string; phu?: ReactNode; nhom: NhomPanel[]; chan: { to: string; nhan: string } };
function KhoiGiaoVien({ quaHan, tenCn, onMo }: { quaHan: Dong[]; tenCn: ((id: number | null | undefined) => string | null) | null; onMo: (p: MoPanel) => void }) {
  const [hetGv, setHetGv] = useState(false);
  const nhom = useMemo(() => nhomTheoGv(quaHan), [quaHan]);
  const tenGv = (g: { owner: string | null; ownerId: number | null }) => g.owner ?? (g.ownerId === null ? t('Chưa có người phụ trách') : `#${g.ownerId}`);
  const hien = hetGv ? nhom : nhom.slice(0, 6);
  const an = nhom.slice(hien.length);
  const anGv = an.filter((g) => g.ownerId !== null).length;
  const lopCua = (ds: Dong[]) => [...new Set(ds.map((x) => x.classCode).filter(Boolean))].slice(0, 3).join(' · ');
  const tenGvO = (g: (typeof nhom)[number]) => (g.ownerId ? <Link to={`/giao-vien/${g.ownerId}`} className="ten-ho-so font-semibold">{tenGv(g)}</Link> : <span className="font-semibold italic text-dim">{tenGv(g)}</span>);
  const soGvO = (g: (typeof nhom)[number]) => (
    <button type="button" onClick={() => moGv(g)} className={`${VUNG_BAM_SO} cursor-pointer rounded border-0 bg-transparent px-2 text-base font-bold tabular-nums text-late hover:underline`}
      aria-label={t('{ten}: {n} việc quá hạn', { ten: tenGv(g), n: g.viec.length })}>{g.viec.length}</button>
  );
  const moGv = (g: (typeof nhom)[number], loai?: string) => onMo({
    tieuDe: loai ? `${tenGv(g)} · ${nhanLoaiTq(loai)}` : tenGv(g), phu: t('{n} việc quá hạn', { n: (loai ? g.viec.filter((x) => loaiTq(x) === loai) : g.viec).length }),
    nhom: [{ khoa: String(g.ownerId), ten: tenGv(g), viec: loai ? g.viec.filter((x) => loaiTq(x) === loai) : g.viec }],
    chan: { to: `/cong-viec?nguoi=${g.ownerId ?? 'gv'}`, nhan: t('Công việc "Của GV"') },
  });
  return (
    <Card bodyClass="p-0" className="h-full"
      title={<span className="inline-flex flex-wrap items-baseline gap-x-2">{t('Giáo viên')}
        <NutLuat label={t('Giáo viên')}>{t('Việc quá hạn của từng người — cùng danh sách Công việc "Của GV" (dòng quá hạn, không tính bài S chấm chéo). Loại = mục của Công việc.')}</NutLuat></span>}>
      {!nhom.length ? <p className="m-0 px-4 py-6 text-sm text-dim">{t('Không GV nào có việc quá hạn.')}</p> : (
        <div data-hd="tq-gv">
          {/* 375 (mockup T1b): `theRieng` — mỗi GV một dòng: tên · số quá hạn bên phải, loại dòng dưới. */}
          <Bang ten={t('Giáo viên')} cot={COT_GV} hang={hien} khoa={(g) => String(g.ownerId)} khung={false}
            oCua={(g, c) => (c.key === 'gv' ? tenGvO(g) : c.key === 'qh' ? soGvO(g) : <LoaiGv loai={g.loai} onLoai={(k) => moGv(g, k)} />)}
            phuCua={(g, c) => (c.key === 'gv' ? [lopCua(g.viec), tenCn?.(g.viec[0].cn)].filter(Boolean).join(' · ') : null)}
            theRieng={(g) => (
              <>
                {/* 375 gọn (~48 px, mockup T1b): tên + số một hàng, loại ngay dưới; vùng chạm 44 px bằng lớp phủ `VUNG_BAM_SO` (không đội cao hàng). */}
                <div className="flex items-center justify-between gap-3 leading-tight">{tenGvO(g)}{soGvO(g)}</div>
                <div className="mt-0.5 leading-tight"><LoaiGv loai={g.loai} onLoai={(k) => moGv(g, k)} /></div>
              </>
            )} />
          {nhom.length > hien.length && (
            <button type="button" onClick={() => setHetGv(true)} className="link w-full border-0 border-t bg-transparent px-4 py-2.5 text-left text-[13px] max-sm:min-h-[44px]" style={{ borderColor: 'var(--line)' }}>
              {/* Rà 25/11 PR 2: "+ n GV" chỉ đếm người thật — nhóm "Chưa có người phụ trách" (ownerId null) không phải GV, ghi riêng. */}
              {[anGv ? t('+ {n} GV', { n: anGv }) : null, an.some((g) => g.ownerId === null) ? `+ ${t('Chưa có người phụ trách')}` : null].filter(Boolean).join(' · ')}</button>
          )}
        </div>
      )}
    </Card>
  );
}

/* ───────────── Lớp cần chú ý — ma trận C ───────────── */

/** < 640 px: đầu cột một dòng (tên đủ ở `title` của đầu cột, `goiY`). */
const NHAN_NGAN: Record<CotLop | 'sos', string> = { case: 'Case', diem: t('Điểm'), meeting: 'Meet.', bcph: 'BCPH', sos: 'SOS' };
const NHAN_COT: Record<CotLop | 'sos', string> = { case: t('Case chưa PA'), diem: t('Điểm thiếu'), meeting: 'Meeting', bcph: t('Báo cáo PH'), sos: t('SOS 2–3') };
/* Meeting: số ở ô = số VIỆC (mỗi việc là một phần meeting của lớp, có nhiều em) — ghi "em" làm ô "4 em" lệch 4 dòng việc (4 + 6 + 8 + 3 em). */
const DON_VI: Record<CotLop, (n: number) => string> = { case: (n) => t('{n} em', { n }), diem: (n) => t('{n} bài', { n }), meeting: (n) => t('{n} việc', { n }), bcph: (n) => t('{n} việc', { n }) };
const TOI_DA_LOP = 5;
/**
 * Ô ma trận = CHỈ con số tô màu chữ (chủ SP 24/11: không đơn vị, không badge / nền / viền, không chú thích màu): đỏ quá hạn · vàng sắp đến (≤ 2 ngày) ·
 * thường còn xa. Trình đọc màn nghe đủ "3 em · quá hạn" qua `aria-label`; ô trống = không có việc.
 */
function OMaTran({ o, cot, lop, onBam }: { o: HangLop<Dong>['o'][CotLop]; cot: CotLop; lop: string; onBam: () => void }) {
  if (!o) return null;
  const so = o.so || o.viec.length;
  const nhan = `${lop} · ${NHAN_COT[cot]} · ${DON_VI[cot](so)}${o.muc === 'qua' ? ` · ${t('quá hạn')}` : o.muc === 'sap' ? ` · ${t('sắp đến hạn')}` : ''}`;
  const mau = o.muc === 'qua' ? 'text-late' : o.muc === 'sap' ? 'text-soon' : 'text-slate-100';
  return (
    <button type="button" onClick={onBam} aria-label={nhan} title={nhan}
      className={`${VUNG_BAM_SO} ${mau} cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold tabular-nums hover:underline max-sm:min-h-[36px]`}>
      {so}
    </button>
  );
}
function LopCanChuYC({ hang, cot, sos, onMo, xemHet }: { hang: HangLop<Dong>[]; cot: readonly CotLop[]; sos?: Map<number, { n: number; ids: number[] }>;
  onMo: (p: MoPanel) => void; xemHet: string }) {
  const ds = hang.slice(0, TOI_DA_LOP);
  const dt = useDienThoai();
  const moO = (h: HangLop<Dong>, c: CotLop) => onMo({
    tieuDe: `${h.classCode} · ${NHAN_COT[c]}`, phu: DON_VI[c](h.o[c]!.so || h.o[c]!.viec.length),
    nhom: [{ khoa: `${h.classId}:${c}`, ten: h.classCode, viec: h.o[c]!.viec }],
    chan: { to: congViec(`nhom=${tabCuaViec(h.o[c]!.viec[0])}`), nhan: t('Công việc · {loai}', { loai: NHAN_COT[c] }) },
  });
  return (
    <Card bodyClass="p-0" className="flex h-full flex-col"
      title={<span className="inline-flex items-baseline gap-2">{t('Lớp cần chú ý')}<span className="text-[13px] font-medium text-dim">{t('{n} lớp', { n: hang.length })}</span></span>}
      action={hang.length > 0 ? <Link to={xemHet} className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[color:var(--accent)] no-underline hover:underline sm:min-h-0">{t('Xem hết')} ›</Link> : undefined}>
      {!ds.length ? <p className="m-0 px-4 py-6 text-sm text-dim">{t('✓ Không lớp nào có việc quá hạn hay sắp đến hạn.')}</p> : (
        <div data-hd="tq-lop-chu-y" className="max-sm:[&_th]:whitespace-normal max-sm:[&_th]:text-xs [&_td]:py-1.5">
          {/* Mockup C: 375 GIỮ ma trận (không thành thẻ) — `the375={false}`; độ rộng cơ sở vừa 375 (96 + 4 × 62), ≥ 640 phần dư chia theo tỉ lệ (`deu`). */}
          <Bang ten={t('Lớp cần chú ý')} khung={false} the375={false} deu hang={ds} khoa={(h) => h.classId}
            cot={[{ key: 'lop', nhan: t('Lớp'), kieu: 'ten', rong: 96 }, ...cot.map((c) => ({ key: c, nhan: dt ? NHAN_NGAN[c] : NHAN_COT[c], goiY: NHAN_COT[c], kieu: 'so' as const, rong: 62 })),
              ...(sos ? [{ key: 'sos', nhan: dt ? NHAN_NGAN.sos : NHAN_COT.sos.replace('–', '⁠–⁠'), goiY: NHAN_COT.sos, kieu: 'so' as const, rong: 62 }] : [])]}
            oCua={(h, c) => {
              if (c.key === 'lop') return <Link to={`/hoc-vien/lop/${h.classId}`} className="ten-ho-so whitespace-nowrap font-semibold">{h.classCode}</Link>;
              if (c.key === 'sos') { const x = sos?.get(h.classId); return x?.n ? <OSo giaTri={x.n} tieuDe={`${t('SOS 2–3')} · ${h.classCode}`} nguon={`/tong-quan/chi-nhanh/sos23?ids=${x.ids.join(',')}`} className="so-chinh text-sm font-semibold" /> : null; }
              const k = c.key as CotLop;
              return <OMaTran o={h.o[k]} cot={k} lop={h.classCode} onBam={() => moO(h, k)} />;
            }} />
        </div>
      )}
    </Card>
  );
}

/* ───────────── Tình hình (V11: số → panel giải thích, giữ) ───────────── */

const qBc = (d: TongQuanV5Data, o: string) => `/phan-tich/bao-cao/o?${thamSoTq(d.branchId, d.ct)}&kieu=tuy-chon&tu=${d.ky.tu}&den=${d.ky.den}&o=${o}`;
const qCn = (d: TongQuanV5Data, cot: string) => `/tong-quan/chi-nhanh/o?cot=${cot}&khoa=tong&chuY=1&${thamSoTq(d.branchId, d.ct)}`;
/** Số Tình hình bấm được → panel giải thích (V11): màu nhấn như mọi ô số (`mauOSo`); SOS 2 / 3 giữ màu mức. */
const SO_TH = 'so-chinh';
/** Hàng Tình hình có MỘT số bấm được: cả hàng bấm (`ca-o` + `so-chinh`, như ô Cần xử lý) — rê = nền nhạt. Hàng SOS 1 · 2 · 3 có ba số → chỉ bấm từng số. */
const CA_HANG = 'has-[.so-chinh:hover]:bg-[color:var(--accent-soft)]';
const SOS3 = t('SOS 1 · 2 · 3');
function TinhHinh({ d, congTac, ngang }: { d: TongQuanV5Data; congTac: ReactNode; ngang?: boolean }) {
  const ft = d.ct === 'ft';
  const muc: [string, ReactNode, ReactNode][] = [
    [t('Đạt MT'), ft ? (d.datMt?.mau ? `${d.datMt.dat} / ${d.datMt.mau} HV` : null) : t('chỉ Fast Track'),
      ft ? <PhanTram x={d.datMt} nguon={qBc(d, 'dat-mt')} tieuDe={t('Đạt MT')} className={SO_TH} /> : <span className="text-dim">—</span>],
    [t('SOS 1 · 2 · 3'), t('HV hiện tại'), <span className="inline-flex items-baseline gap-1.5 tabular-nums">{d.sos.map((n, i) => (
      <span key={i} className="inline-flex items-baseline gap-1.5">{i > 0 && <span className="text-faint" aria-hidden>·</span>}
        <OSo giaTri={n} tieuDe={`SOS ${i + 1}`} nguon={qCn(d, `sos${i + 1}`)} className={`so-chinh ${i === 1 ? 'text-soon' : i === 2 ? 'text-late' : ''}`} /></span>))}</span>],
    [t('Thi tháng này'), t('HV có ngày thi'), <OSo giaTri={d.thiThangNay} tieuDe={t('Thi tháng này')} nguon={qBc(d, 'thi-thang-nay')} className={SO_TH} />],
    [t('Đạt Target thi thật'), ft ? t('đã có kết quả') : t('chỉ Fast Track'),
      ft && d.thiThat?.mau ? <OSo giaTri={d.thiThat.mau} nhan={`${d.thiThat.dat} / ${d.thiThat.mau}`} tieuDe={t('Đạt Target thi thật')} nguon={qBc(d, 'dat-target-thi')} className={SO_TH} />
        : ft ? <ChuaCoDl /> : <span className="text-dim">—</span>],
  ];
  return (
    <Card bodyClass="p-0" className="flex h-full flex-col"
      title={<span className="inline-flex flex-wrap items-baseline gap-2">{t('Tình hình')}<span className="text-[13px] font-medium text-dim">{kyChu(d.ky)}</span></span>} action={congTac}>
      <dl data-hd="tq-tinh-hinh" className={`m-0 grid flex-1 ${ngang ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-1'}`}>
        {muc.map(([ten, phu, so]) => (ngang ? (
          <div key={ten} className={`${CA_HANG} flex min-h-[64px] flex-col gap-0.5 border-t px-4 py-3 lg:border-l lg:border-t-0 lg:first:border-l-0 ${ten !== SOS3 ? 'ca-o' : ''}`} style={{ borderColor: 'var(--line)' }}>
            <dt className="text-sm font-semibold text-slate-100">{ten}</dt>
            <dd className="so-tinh-hinh m-0 text-[20px] font-bold tabular-nums text-slate-100">{so}</dd>
            {phu && <dd className="m-0 text-xs text-dim">{phu}</dd>}
          </div>
        ) : (
          <div key={ten} className={`${CA_HANG} flex min-h-[64px] flex-col gap-0.5 border-t px-4 py-2.5 max-lg:odd:border-r lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-3 ${ten !== SOS3 ? 'ca-o' : ''}`} style={{ borderColor: 'var(--line)' }}>
            <dt className="text-sm font-semibold text-slate-100 lg:col-start-1 lg:row-start-1">{ten}</dt>
            <dd className="so-tinh-hinh m-0 text-[20px] font-bold tabular-nums text-slate-100 lg:col-start-2 lg:row-span-2 lg:row-start-1">{so}</dd>
            {phu && <dd className="m-0 text-xs text-dim lg:col-start-1 lg:row-start-2">{phu}</dd>}
          </div>
        )))}
      </dl>
    </Card>
  );
}

/* ───────────── Chờ duyệt (dòng gọn → panel duyệt) ───────────── */

type Hop = { the: TheYeuCauDto[]; dem: Record<KhoaChip, number>; homNay: string };
/**
 * Panel Chờ duyệt (chủ SP 25/11): CHÍNH danh sách của tab Chờ duyệt ở Công việc (`HopChoDuyet` — nhóm theo loại, cột cố định, hạn tô màu, mở tại dòng,
 * Duyệt / Từ chối / Trả lời, cùng quyền) trong khung 720; thân cuộn, chân "Công việc · Chờ duyệt ›" cố định dưới thân (không che dòng cuối).
 * `n` = số của thẻ Tổng quan (một nguồn: `dem['tat-ca']` của hộp, cùng chi nhánh với trang).
 */
function PanelDuyet({ n, branchId, dau, onDong }: { n: number | null; branchId: number | null; dau: number | null; onDong: () => void }) {
  return (
    <KhungPanel rong="viec" tieuDe={t('Chờ duyệt')} phu={n != null ? t('{n} yêu cầu', { n }) : undefined} onDong={onDong}
      chan={{ huy: null, chinh: <Link to="/cong-viec?nhom=duyet" className="btn min-h-[44px] sm:min-h-[36px]">{t('Công việc · Chờ duyệt')} ›</Link> }}>
      <HopChoDuyet branchId={branchId} gon dau={dau} />
    </KhungPanel>
  );
}
function DongDuyet({ ds, onMo }: { ds: TheYeuCauDto[]; onMo: (y: TheYeuCauDto) => void }) {
  return (
    <ul className="m-0 list-none p-0">
      {ds.map((y) => (
        <li key={y.id} className="border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
          <button type="button" onClick={() => onMo(y)} className="bam flex min-h-[56px] w-full cursor-pointer items-center justify-between gap-x-3 gap-y-1 border-0 bg-transparent px-4 py-2 text-left max-sm:flex-col max-sm:items-start">
            <span className="min-w-0">
              <span className="block break-words text-sm font-semibold text-slate-100">{[y.hocVien, dich(y.nhanLoai)].filter(Boolean).join(' · ')}</span>
              <span className="block text-[13px] text-dim">{[y.lop, y.nguoiXin && t('{ten} gửi', { ten: y.nguoiXin })].filter(Boolean).join(' · ')}</span>
            </span>
            {y.hanDuyet && <span className="shrink-0"><NgayHan han={y.hanDuyet} /></span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ───────────── Trang theo vai ───────────── */

function useHop(branchId: number | null, co: boolean) {
  return useApi<Hop>(co ? `/yeu-cau?hop=cho-duyet${branchId ? `&branchId=${branchId}` : ''}` : null, [branchId, co]);
}

/**
 * HEAD / QL (một chi nhánh) và QUẢN TRỊ (Toàn hệ thống hoặc một chi nhánh): Cần xử lý (GV quá hạn · Chờ duyệt · Em SOS cần chú ý) ·
 * Giáo viên ‖ Chờ duyệt · Lớp cần chú ý (Case chưa PA · Điểm · Meeting · SOS 2–3) ‖ Tình hình.
 */
export function TongQuanHead({ d, congTac }: { d: TongQuanV5Data; congTac: ReactNode }) {
  const { session } = useSession();
  const { homNay } = useNgayNghiepVu();
  const duyet = !!session?.nav?.workApprove;
  /* MỘT SỐ "Chờ duyệt" (chủ SP 25/11: ô 12 ≠ panel 10): `dem` của khung App là mọi chi nhánh — Tổng quan một chi nhánh thì số đúng là `dem['tat-ca']` của CHÍNH
     hộp theo chi nhánh trang (cùng hàm `demHop` với tab Công việc). `dem.cho` chỉ làm công tắc tải hộp: 0 toàn hệ thống thì 0 ở chi nhánh, khỏi GET. */
  const dem = useDemYeuCau();
  const hop = useHop(d.branchId, duyet && (dem?.cho ?? 0) > 0);
  const choN = hop.data ? hop.data.dem['tat-ca'] : dem && !dem.cho ? 0 : null;
  const coKhoiDuyet = duyet && (choN ?? dem?.cho ?? 0) > 0;   // chưa có hộp: theo công tắc → khối hiện Skeleton, không nhảy bố cục
  const viec = { data: d.viec ? { dong: d.viec as Dong[] } : null };
  const cn = useApi<{ id: number; name: string }[]>(d.branchId ? null : '/ref/branches').data;
  const [panel, setPanel] = useState<MoPanel | null>(null);
  const [duyetMo, setDuyetMo] = useState<{ dau: TheYeuCauDto | null } | null>(null);
  const dong = viec.data?.dong ?? [];
  const quaHan = useMemo(() => quaHanCuaGv(dong), [dong]);
  const soGv = new Set(quaHan.filter((x) => x.ownerId !== null).map((x) => x.ownerId)).size;
  const lopSosDs = d.lop ?? d.lopCn ?? [];
  const sos = new Map(lopSosDs.map((l) => [l.id, { n: l.sos[1] + l.sos[2], ids: l.sos23Ids }]));
  const sos23Ids = [...new Set(lopSosDs.flatMap((l) => l.sos23Ids))];
  const s2 = lopSosDs.reduce((n, l) => n + l.sos[1], 0), s3 = lopSosDs.reduce((n, l) => n + l.sos[2], 0);
  const hang = useMemo(() => maTranLop(dong, ['case', 'diem', 'meeting'], homNay), [dong, homNay]);
  const tenCn = d.branchId ? null : (id: number | null | undefined) => cn?.find((b) => b.id === id)?.name ?? null;
  const ganNhat = hop.data?.the.map((y) => y.hanDuyet).filter((x): x is string => !!x).sort()[0];
  const moGvQuaHan = () => setPanel({
    tieuDe: t('GV quá hạn'), phu: t('{n} GV · {m} việc', { n: soGv, m: quaHan.length }),
    nhom: nhomTheoGv(quaHan).map((g) => ({ khoa: String(g.ownerId), ten: g.owner ?? t('Chưa có người phụ trách'), viec: g.viec })),
    chan: { to: '/cong-viec?nguoi=gv', nhan: t('Công việc "Của GV"') },
  });
  return (
    <>
      <HangO n={3}>
        <OCan ten={t('GV quá hạn')} so={viec.data ? soGv : null} nguy phu={quaHan.length ? t('{n} việc quá hạn', { n: quaHan.length }) : undefined} onBam={moGvQuaHan} />
        {duyet && <OCan ten={t('Chờ duyệt')} so={choN} phu={ganNhat ? <>{t('gần nhất')} <NgayHan han={ganNhat} /></> : undefined}
          onBam={hop.data ? () => setDuyetMo({ dau: null }) : undefined} />}
        <OCan ten={t('Em SOS cần chú ý')} so={s2 + s3} phu={s2 + s3 ? [s3 ? `${s3} SOS 3` : null, s2 ? `${s2} SOS 2` : null].filter(Boolean).join(' · ') : undefined}
          o={<span className="text-[26px] font-bold leading-none"><OSo giaTri={s2 + s3} tieuDe={t('Em SOS cần chú ý')} nguon={`/tong-quan/chi-nhanh/sos23?${thamSoTq(d.branchId, d.ct)}&ids=${sos23Ids.join(',')}`} className="so-chinh text-late" /></span>} />
      </HangO>
      {!viec.data ? null : (
        <div className="flex flex-col gap-4">
          {/* 375 (mockup T1b): Lớp cần chú ý → Giáo viên → Chờ duyệt → Tình hình — hai lưới thành `contents`, thứ tự bằng `order`. */}
          <div className={`grid items-stretch gap-4 max-sm:contents ${coKhoiDuyet ? 'min-[1100px]:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]' : ''}`}>
            <div className="max-sm:order-2"><KhoiGiaoVien quaHan={quaHan} tenCn={tenCn} onMo={setPanel} /></div>
            {coKhoiDuyet && <div className="max-sm:order-3">{hop.error ? <ErrorState message={hop.error.message} onRetry={hop.reload} /> : !hop.data ? <Skeleton rows={3} /> : (
              <Card bodyClass="p-0" className="h-full" title={t('Chờ duyệt')}
                action={<Link to="/cong-viec?nhom=duyet" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[color:var(--accent)] no-underline hover:underline sm:min-h-0">{t('Công việc')} ›</Link>}>
                <DongDuyet ds={hop.data.the.slice(0, 5)} onMo={(y) => setDuyetMo({ dau: y })} />
                {hop.data.the.length > 5 && <button type="button" className="link w-full border-0 border-t bg-transparent px-4 py-2.5 text-left text-[13px] max-sm:min-h-[44px]" style={{ borderColor: 'var(--line)' }}
                  onClick={() => setDuyetMo({ dau: null })}>{t('+ {n} yêu cầu', { n: hop.data.the.length - 5 })}</button>}
              </Card>
            )}</div>}
          </div>
          <div className="grid items-stretch gap-4 max-sm:contents min-[1100px]:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            <div className="max-sm:order-1"><LopCanChuYC hang={hang} cot={['case', 'diem', 'meeting']} sos={sos} onMo={setPanel} xemHet={congViec('')} /></div>
            <div className="max-sm:order-4"><TinhHinh d={d} congTac={congTac} /></div>
          </div>
        </div>
      )}
      {panel && <PanelDsViec {...panel} onDong={() => setPanel(null)} />}
      {duyetMo && hop.data && <PanelDuyet n={choN} branchId={d.branchId} dau={duyetMo.dau?.id ?? null} onDong={() => setDuyetMo(null)} />}
    </>
  );
}

/** ADMIN (góc vận hành): Điểm chưa đủ · Báo cáo PH chưa đủ (Lịch thi / Hồ sơ: Admin không có việc đó trong Công việc — không vẽ ô, [XM-P3-2]) · Lớp cần chú ý ‖ Tình hình. */
export function TongQuanAdmin({ d, congTac }: { d: TongQuanV5Data; congTac: ReactNode }) {
  const { homNay } = useNgayNghiepVu();
  const viec = { data: d.viec ? { dong: d.viec as Dong[] } : null };
  const [panel, setPanel] = useState<MoPanel | null>(null);
  const [moDiem, setMoDiem] = useState(false);
  const dong = viec.data?.dong ?? [];
  const tat = laViec(dong);
  const diem = tat.filter((x) => x.group === 'score' && !x.key.endsWith('|cc'));
  const bcph = tat.filter((x) => x.group === 'xuat_bc_ph');
  const soBai = diem.reduce((s, x) => s + (x.soBai ?? 0), 0);
  const lop = (ds: Dong[]) => new Set(ds.map((x) => x.classId).filter((x) => x != null)).size;
  const hang = useMemo(() => maTranLop(dong, ['diem', 'bcph'], homNay), [dong, homNay]);
  const theoLop = (ds: Dong[]): NhomPanel[] => {
    const m = new Map<string, Dong[]>();
    for (const x of ds) (m.get(x.classCode ?? '—') ?? m.set(x.classCode ?? '—', []).get(x.classCode ?? '—')!).push(x);
    return [...m].map(([k, v]) => ({ khoa: k, ten: k, viec: v }));
  };
  return (
    <>
      <HangO n={2}>
        <OCan ten={t('Điểm chưa đủ')} so={viec.data ? soBai : null} nguy={diem.some((x) => x.urgency === 'overdue')}
          phu={soBai ? t('bài · {n} lớp', { n: lop(diem) }) : undefined}
          onBam={() => setMoDiem(true)} />
        <OCan ten={t('Báo cáo PH chưa đủ')} so={viec.data ? bcph.length : null} nguy={bcph.some((x) => x.urgency === 'overdue')}
          phu={bcph.length ? <>{t('{n} lớp', { n: lop(bcph) })}{hanSom(bcph) && <> · <NgayHan han={hanSom(bcph)!} /></>}</> : undefined}
          onBam={() => setPanel({ tieuDe: t('Báo cáo PH chưa đủ'), phu: t('{n} việc', { n: bcph.length }), nhom: theoLop(bcph), chan: { to: congViec(`nhom=${bcph[0] ? tabCuaViec(bcph[0]) : 'van-hanh'}`), nhan: t('Công việc · Báo cáo PH') } })} />
      </HangO>
      {!viec.data ? null : (
        <div className="grid items-stretch gap-4 min-[1100px]:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <LopCanChuYC hang={hang} cot={['diem', 'bcph']} onMo={setPanel} xemHet={congViec('')} />
          <TinhHinh d={d} congTac={congTac} />
        </div>
      )}
      {panel && <PanelDsViec {...panel} onDong={() => setPanel(null)} />}
      {moDiem && <PanelDiemAdmin diem={diem} onDong={() => setMoDiem(false)} />}
    </>
  );
}

/**
 * ADMIN · panel "Điểm chưa đủ" (chủ SP, mockup T2c): BẢNG CỘT CỐ ĐỊNH — Lớp · Bài Test · Thiếu · Người phụ trách · số bài (mỗi người một dòng, chip kỹ năng) · Hạn;
 * hàng tổng "n lớp · Σ" = số ô. Một hàng = một lớp × một lượt (gộp các việc Nhập điểm của lượt đó). Bấm hàng → danh sách việc của hàng (thay nội dung panel).
 */
type HangDiem = { khoa: string; classId: number | null; lop: string; bai: string; thieu: number; han: string | null; nguoi: { ten: string; kns: string[]; n: number }[]; viec: Dong[] };
const COT_DIEM: readonly CotBang[] = [
  { key: 'lop', nhan: t('Lớp'), kieu: 'ten', rong: 120 }, { key: 'bai', nhan: t('Bài Test'), kieu: 'chu', linhHoat: true }, { key: 'thieu', nhan: t('Thiếu'), kieu: 'so', rong: 72 },
  { key: 'nguoi', nhan: t('Người phụ trách · số bài'), kieu: 'chu', rong: 300 }, { key: 'han', nhan: t('Hạn'), kieu: 'tuan', rong: 150 },
];
function PanelDiemAdmin({ diem, onDong }: { diem: Dong[]; onDong: () => void }) {
  const [mo, setMo] = useState<HangDiem | null>(null);
  const hang = useMemo(() => {
    const m = new Map<string, HangDiem>();
    for (const x of diem) {
      const k = `${x.classId}:${x.luot ?? x.attemptId ?? x.key}`;
      const h = m.get(k) ?? m.set(k, { khoa: k, classId: x.classId, lop: x.classCode ?? '—', bai: x.contextLabel || (x.tuanThi ? tuanLich(x.tuanThi) : dich(x.tieuDe)), thieu: 0, han: null, nguoi: [], viec: [] }).get(k)!;
      h.viec.push(x); h.thieu += x.soBai ?? 0;
      if (x.due && (!h.han || x.due < h.han)) h.han = x.due;
      const ten = x.owner ?? t('Chưa phân công');
      const ng = h.nguoi.find((y) => y.ten === ten) ?? (h.nguoi.push({ ten, kns: [], n: 0 }), h.nguoi[h.nguoi.length - 1]);
      ng.n += x.soBai ?? 0;
      for (const kn of x.kns ?? (x.kn ? [x.kn] : [])) if (ng.kns.indexOf(kn) < 0) ng.kns.push(kn);
    }
    return [...m.values()].sort((a, b) => (a.han ?? '9').localeCompare(b.han ?? '9') || a.lop.localeCompare(b.lop));
  }, [diem]);
  const tong = hang.reduce((s, h) => s + h.thieu, 0);
  const soLop = new Set(hang.map((h) => h.classId)).size;
  if (mo) return <PanelDsViec tieuDe={`${mo.lop} · ${mo.bai}`} phu={t('{n} bài', { n: mo.thieu })} nhom={[{ khoa: mo.khoa, ten: mo.lop, viec: mo.viec }]} chan={{ to: congViec('nhom=cham-diem'), nhan: t('Công việc · Điểm') }} onDong={onDong} />;
  return (
    <KhungPanel rong="bang" tieuDe={t('Điểm chưa đủ')} phu={t('{n} lớp · {m} bài', { n: soLop, m: tong })} onDong={onDong}
      chan={{ huy: null, chinh: <Link to={congViec('nhom=cham-diem')} className="btn min-h-[44px] sm:min-h-[36px]">{t('Công việc · Điểm')} ›</Link> }}>
      <Bang ten={t('Điểm chưa đủ')} khung={false} cot={COT_DIEM} hang={hang} khoa={(h) => h.khoa} onHang={setMo}
        oCua={(h, c) => {
          if (c.key === 'lop') return <b className="whitespace-nowrap font-semibold text-slate-100">{h.lop}</b>;
          if (c.key === 'bai') return h.bai;
          if (c.key === 'thieu') return <b className="tabular-nums">{h.thieu}</b>;
          if (c.key === 'han') return h.han ? <NgayHan han={h.han} /> : null;
          return <span className="grid gap-1">{h.nguoi.map((n) => (
            <span key={n.ten} className="inline-flex items-center gap-1 whitespace-nowrap text-[13px]">{n.ten}
              {n.kns.map((kn) => <span key={kn} className={CHIP_VUONG}>{tenMonNgan(null, kn)}</span>)}<span className="tabular-nums text-dim">· {n.n}</span></span>
          ))}</span>;
        }}
        cuoi={<tr><td className="td font-semibold text-dim">{t('{n} lớp', { n: soLop })}</td><td className="td" /><td className="td"><b className="block text-center tabular-nums">{tong}</b></td><td className="td" /><td className="td" /></tr>} />
    </KhungPanel>
  );
}

type SoHv = { phamVi: 'cua-toi' | 'chi-nhanh' | 'tat-ca'; tong: number; dem: Record<'da-thi' | 'cho-buoc-tiep', number> };
const COT_EM: readonly CotBang[] = [
  { key: 'hv', nhan: t('Học viên'), kieu: 'ten', rong: 260 }, { key: 'lop', nhan: t('Lớp'), kieu: 'tuan', rong: 160 }, { key: 'sos', nhan: 'SOS', kieu: 'chip', rong: 160 },
  /* NH9: dư chia đều (deu); việc còn treo dài xuống dòng, không cắt "…"; Hạn ở cột cuối căn phải sát mép. */
  { key: 'treo', nhan: t('Còn treo'), kieu: 'ten', rong: 360 }, { key: 'han', nhan: t('Hạn'), kieu: 'nut', rong: 160 },
];
type DongSos = { id: number; title: string; sub: string; href: string; sos?: { muc: number; tam: boolean } | null; lop?: string | null };
/** CX: Em SOS 2–3 · Meeting chờ kết quả · Chưa chốt bước tiếp › · Em cần chú ý · Tình hình (ngang). */
export function TongQuanCx({ d, congTac }: { d: TongQuanV5Data; congTac: ReactNode }) {
  const hv = useApi<SoHv>(`/tong-quan/hoc-vien${d.branchId ? `?branchId=${d.branchId}` : ''}`, [d.branchId]);
  const duongToi = useDuongViecCuaToi();
  const toi = useApi<ViecTatCa>(duongToi, [duongToi]).data;
  const [panel, setPanel] = useState<MoPanel | null>(null);
  const lopSosDs = d.lop ?? d.lopCn ?? [];
  const ids = [...new Set(lopSosDs.flatMap((l) => l.sos23Ids))];
  const s2 = lopSosDs.reduce((n, l) => n + l.sos[1], 0), s3 = lopSosDs.reduce((n, l) => n + l.sos[2], 0);
  const nguonSos = `/tong-quan/chi-nhanh/sos23?${thamSoTq(d.branchId, d.ct)}&ids=${ids.join(',')}`;
  /* "Em cần chú ý": danh sách em SOS 2–3 — CHÍNH đường panel SOS 2–3 (19 câu, đọc đúng các em đó), chỉ khi có em. */
  const em = useApi<{ rows: DongSos[] }>(ids.length ? nguonSos : null, [nguonSos]);
  const meeting = laViec(toi?.dong ?? []).filter((x) => x.group === 'meeting_ket_qua');
  const choBuoc = hv.data?.dem['cho-buoc-tiep'] ?? null;
  const cnQ = d.branchId ? `&cn=${d.branchId}` : '';
  const treoDau = (sid: number) => laViec(toi?.dong ?? []).filter((x) => x.studentId === sid).sort((a, b) => (a.due ?? '9').localeCompare(b.due ?? '9'))[0];
  const lopEm = (r: DongSos) => r.lop ?? r.sub.split(' · ')[0];
  const chipSos = (r: DongSos) => (r.sos ? <span className={`${CHIP_SOS} ${lopSos(r.sos.muc, r.sos.tam)}`}>SOS {r.sos.muc}</span> : null);
  return (
    <>
      <HangO n={3}>
        <OCan ten={t('Em SOS 2–3')} so={s2 + s3} phu={s2 + s3 ? [s3 ? `${s3} SOS 3` : null, s2 ? `${s2} SOS 2` : null].filter(Boolean).join(' · ') : undefined}
          o={<span className="text-[26px] font-bold leading-none"><OSo giaTri={s2 + s3} tieuDe={t('Em SOS 2–3')} nguon={nguonSos} className="so-chinh text-late" /></span>} />
        <OCan ten={t('Meeting chờ kết quả')} so={toi ? meeting.length : null} phu={hanSom(meeting) ? <>{t('gần nhất')} <NgayHan han={hanSom(meeting)!} /></> : undefined}
          onBam={() => setPanel({ tieuDe: t('Meeting chờ kết quả'), phu: t('{n} việc', { n: meeting.length }), nhom: [{ khoa: 'm', ten: t('Kết quả meeting'), viec: meeting }], chan: { to: '/cong-viec?nhom=kq-meeting', nhan: t('Công việc · Kết quả meeting') } })} />
        <OCan ten={t('Chưa chốt bước tiếp')} so={choBuoc} phu={choBuoc ? t('em') : undefined} to={`/hoc-vien?phamVi=${hv.data?.phamVi ?? 'tat-ca'}${cnQ}&view=cho-buoc-tiep`} />
      </HangO>
      {ids.length > 0 && (
        <Card bodyClass="p-0" title={<span className="inline-flex items-baseline gap-2">{t('Em cần chú ý')}<span className="text-[13px] font-medium text-dim">{t('{n} em', { n: ids.length })}</span></span>}
          action={<Link to={`/hoc-vien?view=sos&muc=23${cnQ}`} className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[color:var(--accent)] no-underline hover:underline sm:min-h-0">{t('Xem hết')} ›</Link>}>
          {em.error ? <ErrorState message={em.error.message} onRetry={em.reload} /> : !em.data ? <Skeleton rows={3} className="p-4" /> : (
            /* 375 (mockup T3b): `theRieng` — tên · chip SOS bên phải; lớp · việc còn treo · hạn ở dòng dưới. */
            <Bang ten={t('Em cần chú ý')} khung={false} deu cot={COT_EM} hang={em.data.rows.slice(0, 8)} khoa={(r) => r.id}
              oCua={(r, c) => {
                const treo = treoDau(r.id);
                if (c.key === 'hv') return <Link to={r.href} className="ten-ho-so font-semibold">{r.title}</Link>;
                if (c.key === 'lop') return lopEm(r);
                if (c.key === 'sos') return chipSos(r);
                if (c.key === 'treo') return treo ? dich(treo.tieuDe) : <span className="text-faint">—</span>;
                return treo?.due ? <NgayHan han={treo.due} /> : <span className="text-faint">—</span>;
              }}
              theRieng={(r) => { const treo = treoDau(r.id); return (
                <>
                  <div className="flex items-center justify-between gap-3"><Link to={r.href} className="ten-ho-so font-semibold">{r.title}</Link>{chipSos(r)}</div>
                  <span className="text-[13px] text-dim">{[lopEm(r), treo ? dich(treo.tieuDe) : null].filter(Boolean).join(' · ')}{treo?.due && <> · <NgayHan han={treo.due} /></>}</span>
                </>
              ); }} />
          )}
        </Card>
      )}
      <TinhHinh d={d} congTac={congTac} ngang />
      {panel && <PanelDsViec {...panel} onDong={() => setPanel(null)} />}
    </>
  );
}
