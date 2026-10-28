import { createContext, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { duongHoSoHocVien } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { useChoHoanTac } from './KhungPanel.tsx';
import { LOP_GIA_TRI, LOP_NHAN } from './ui.tsx';

/**
 * KHUÔN PANEL LÀM VIỆC v3 (OV-12c, mockup `thiet-ke/mockup-ov12-panel-v3-2026-10-14.html` §1) — phần dùng chung đặt trong `KhungPanel`:
 *   (ChipHan — chip hạn ở đầu panel — nằm ở `ui/Nhan.tsx` cùng các chip khác.)
 *   CanLam    Khối "Cần làm" — khối DUY NHẤT có màu (nền accent-soft + vạch trái 3 px); chứa đúng ô cần điền + một nút chính.
 *   BoiCanh   ≤ 3 dòng nhãn – giá trị (Nguyên nhân · Phương án · Kết quả gần nhất); "Xem thêm" mở ngay dưới, không chuyển trang.
 *             NEN-PANEL (P2, `09-anh1`, `v5-nen.css .khoi-ngu-canh`): khối nền nhạt, nhãn nhỏ xám / giá trị đậm; điểm trong giá trị tô màu kết quả (`DiemKq`).
 * Đầu panel 2 dòng = `KhungPanel dau`. Chân = `KhungPanel chan` (dòng trạng thái + nút chính dính đáy ở 375).
 */
export function CanLam({ children, trongDong }: { children: ReactNode; /** OV-12e: trong dòng mở rộng (nền dòng đã accent-soft) → nền surface. */ trongDong?: boolean }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[4px_10px_10px_4px] py-4 pl-[19px] pr-4 max-sm:py-3.5 max-sm:pl-[15px] max-sm:pr-3"
      style={{ background: trongDong ? 'var(--surface)' : 'var(--accent-soft)', boxShadow: 'inset 3px 0 0 var(--accent)' }}>
      {children}
    </div>
  );
}

export function BoiCanh({ dong, them }: { dong: [string, ReactNode][]; them?: ReactNode }) {
  const [mo, setMo] = useState(false);
  const co = dong.filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (!co.length && !them) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {co.length > 0 && (
        <dl className="m-0 grid grid-cols-[7.5rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1.5 rounded-lg px-3.5 py-3 text-sm max-sm:grid-cols-[6rem_minmax(0,1fr)]"
          style={{ background: 'var(--surface-2)' }}>
          {co.map(([nhan, gt]) => (
            <div key={nhan} className="contents">
              <dt className={LOP_NHAN}>{nhan}</dt>
              <dd className={`m-0 min-w-0 ${LOP_GIA_TRI}`}>{gt}</dd>
            </div>
          ))}
        </dl>
      )}
      {them && (
        <>
          <button type="button" aria-expanded={mo} onClick={() => setMo(!mo)}
            className="inline-flex min-h-[32px] w-fit appearance-none items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-semibold text-[color:var(--accent)] max-sm:min-h-[44px]">
            {mo ? t('Thu gọn') : t('Xem thêm')}
          </button>
          {mo && <div className="text-[13px] text-slate-400">{them}</div>}
        </>
      )}
    </div>
  );
}

/**
 * ĐẦU PANEL v3 (OV-12e) — cho `KhungPanel dau`: chip hạn (chỉ người làm) · dòng 2 = em ↗ (link xem hồ sơ, tách khỏi nút làm) · lớp · ngữ cảnh.
 * Không mã HV, không chi nhánh, không lặp ngày (mockup v3 §1).
 */
export function dauViec({ han, em, lop, ngCanh }: {
  han?: ReactNode; em?: { id: number; ten: string } | null; lop?: string | null; ngCanh?: ReactNode;
}): { han?: ReactNode; dong2: ReactNode[]; loai: string } {
  return {
    han, loai: t('VIỆC'),   // M6 6b-1: panel việc khai nhãn loại — khung không đoán theo `dau`
    dong2: [
      em ? <Link className="font-bold text-slate-100 no-underline hover:underline max-sm:-my-3 max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center" to={duongHoSoHocVien(em.id)}>{em.ten}<span aria-hidden className="ml-0.5 text-xs text-[color:var(--accent)]">↗</span></Link> : null,
      lop ?? null, ngCanh ?? null,
    ],
  };
}

/**
 * CHÂN LƯU THỐNG NHẤT (NEN-PANEL, `v5-nen.css .tt-luu`, bảng mẫu mục 7) — MỘT dòng, chữ + ký hiệu (không chỉ màu), cùng chữ ở mọi panel:
 * ● Chưa lưu (Huỷ sửa) · ⟳ Đang lưu… · ✓ Đã lưu HH:MM · ⚠ Không lưu được — {lý do}. Chữ đang gõ vẫn giữ. (Thử lại). "Còn thiếu n ô" do
 * `KhungPanel chan.conThieu` vẽ. `SaveIndicator` (ô điểm, lưới) dùng cùng hàm vẽ.
 */
export type TtLuu = 'nhap' | 'dang' | 'da' | 'loi';
export function TrangThaiLuu({ tt, loi, luc, onHuy, onThuLai }: {
  tt: TtLuu | null; loi?: string | null; onHuy?: () => void; onThuLai?: () => void;
  /** Giờ đã lưu `HH:MM` (tt = 'da'). */
  luc?: string | null;
}) {
  if (!tt) return null;
  const nut = (chu: string, f: () => void) => (
    <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={f}>{chu}</button>
  );
  return (
    <>
      <ChuLuu tt={tt} loi={loi} luc={luc} />
      <span className="flex-1" />
      {tt === 'nhap' && onHuy && nut(t('Huỷ sửa'), onHuy)}
      {tt === 'loi' && onThuLai && nut(t('Thử lại'), onThuLai)}
    </>
  );
}

/** Chữ trạng thái lưu (không nút) — dùng chung cho chân panel và `SaveIndicator`. */
export function ChuLuu({ tt, loi, luc, gon }: { tt: TtLuu; loi?: string | null; luc?: string | null; /** Hàng lưới chật: lý do vào tooltip, không câu "vẫn giữ". */ gon?: boolean }) {
  if (tt === 'loi' && gon) return <span role="alert" title={loi ?? undefined} className="font-semibold text-bad">⚠ {t('Không lưu được')}</span>;
  if (tt === 'loi') return <span role="alert" className="font-semibold text-bad">⚠ {t('Không lưu được')}{loi ? ` — ${loi}` : ''}. {t('Chữ đang gõ vẫn giữ.')}</span>;
  if (tt === 'dang') {
    return (
      <span role="status" className="inline-flex items-center gap-1.5 font-semibold text-doing">
        <span aria-hidden className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />{t('Đang lưu…')}
      </span>
    );
  }
  if (tt === 'da') return <span role="status" className="font-semibold text-done">✓ {t('Đã lưu')}{luc ? <span className="tabular-nums"> {luc}</span> : null}</span>;
  return <span className="inline-flex items-center gap-1.5 font-semibold text-soon"><span aria-hidden>●</span>{t('Chưa lưu')}</span>;
}

/** Nút chữ (nút phụ v3) — đứng sau nút chính trong khối Cần làm; một nút chính duy nhất nổi. */
export function NutChu({ children, onClick, mo, disabled, title }: { children: ReactNode; onClick: () => void; mo?: boolean; disabled?: boolean; title?: string }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} title={title}
      className={`btn btn-ghost min-h-[44px] font-semibold sm:min-h-[40px] ${mo ? 'text-slate-400' : 'text-[color:var(--accent)]'}`}>{children}</button>
  );
}

/** Nhóm nguyên nhân có số thứ tự (1 = chính): "1 Kỹ năng làm bài · 2 Quản lý thời gian". */
export function NhomCoSo({ ds }: { ds: { code: string; label: string }[] }) {
  return <>{ds.map((x, i) => <span key={x.code}>{i > 0 && ' · '}<b className="font-semibold text-slate-300">{i + 1}</b> {dich(x.label)}</span>)}</>;
}

/** OV-13b: kết quả một lần lưu ở panel làm việc — câu chính, dòng phụ, Hoàn tác (nếu có đường đảo). */
/** M6 6b-2: `paId` = PA vừa thêm / vừa ghi (Ngăn Case về Case, viền thẻ PA đó). */
export type DaLuuPanel = { chu: string; phu?: string | null; hoanTac?: () => Promise<void>; paId?: number };

/**
 * M6 6b-3 (mockup panel-pilot ②): trang Công việc nghe việc vừa lưu bằng "· việc tiếp ›" — `bao` trước khi sang việc kế, dải "✓ … · Hoàn tác" của nó
 * hiện ở đầu việc kế (`oLai`: việc kế cùng Case — PA kế, panel không đổi). `ten` = "Tiếp: {việc} · {em}" (V12 ⑥). Ngoài Công việc: không có.
 */
export const ViecVuaLuu = createContext<{ ten: string | null; bao: (x: DaLuuPanel, oLai?: boolean) => void } | null>(null);

/**
 * M6 6b-3 (mockup panel-pilot ②b): form của panel việc có việc kế — thêm nút "{việc} · việc tiếp ›" (V12 ②: chỉ chuyển khi máy chủ đã nhận); `lam` nhận
 * kết quả để dải "✓ … · Hoàn tác" hiện ở đầu việc kế. `ten` = "Tiếp: {việc} · {em}" (V12 ⑥).
 */
export type TiepViec = { ten: string | null; lam: (x: DaLuuPanel) => void };
/** Nút thường + "{việc} · việc tiếp ›" (nút chính khi có việc kế); "Đang lưu…" chỉ ở nút đã bấm (V12 ⑨). */
export function NutVaTiep({ chu, chuTiep, busy, tiep, bam, luu }: {
  chu: string; chuTiep: string; busy: boolean; tiep?: TiepViec; bam: 'luu' | 'tiep' | null; luu: (diTiep: boolean) => void;
}) {
  return <>
    <button type="button" className={`btn ${tiep ? '' : 'btn-primary'} min-h-[40px] px-4 font-bold`} disabled={busy} onClick={() => luu(false)}>{busy && bam !== 'tiep' ? t('Đang lưu…') : chu}</button>
    {tiep && <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy} onClick={() => luu(true)}>{busy && bam === 'tiep' ? t('Đang lưu…') : chuTiep}</button>}
  </>;
}
/** "Tiếp: {việc} · {em}" — dưới hàng nút trong khối Cần làm (≥ 640); `chan`: bản ở chân dính 375, trên nút (không bị chân che). */
export function DongTiep({ tiep, chan = false }: { tiep?: TiepViec; chan?: boolean }) {
  if (!tiep?.ten) return null;
  return <p className={`m-0 truncate text-[13px] text-slate-400 ${chan ? '' : '-mt-1.5 max-sm:hidden'}`} title={tiep.ten}>{t('Tiếp: {x}', { x: tiep.ten })}</p>;
}

/**
 * SAU KHI LƯU Ở PANEL (OV-13b, mockup OV-13 §1 "Sau khi lưu", §7, §9) — ở lại panel, không nhảy sang Case đầy đủ: khối "✓ Đã lưu · …" + nút chính
 * "Việc tiếp ›" (việc kế của danh sách) / về nơi mở / Đóng. Chân: "✓ Đã lưu HH:MM · Hoàn tác" (10 giây, chỉ khi có đường đảo). Toast không dùng — chân đã nói.
 */
export function KhoiDaLuu({ x, luc, nutChinh, phu, onHoanTac }: {
  x: DaLuuPanel; luc: string; nutChinh: ReactNode; phu?: ReactNode;
  /** Hoàn tác xong — nơi gọi đưa panel về form (chữ cũ giữ). */
  onHoanTac?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="flex flex-col gap-1 rounded-[4px_10px_10px_4px] bg-ok-bg py-3.5 pl-[19px] pr-4" style={{ boxShadow: 'inset 3px 0 0 var(--ok)' }} role="status">
        <b className="text-[15px] font-bold text-ok">✓ {x.chu}</b>
        {x.phu && <span className="text-[13px] text-slate-300">{x.phu}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2 [&>button:first-child]:max-sm:w-full [&>button:first-child]:max-sm:justify-center">{nutChinh}{phu}</div>
      <ChanDaLuu luc={luc} hoanTac={x.hoanTac} onHoanTac={onHoanTac} />
    </div>
  );
}

/** Hoàn tác 10 giây (mockup OV-13 §1) — chân "✓ Đã lưu" và dải việc vừa lưu (6b-3) dùng chung. */
function useHoanTac(hoanTac: (() => Promise<void>) | undefined, onHoanTac?: () => void) {
  const [con, setCon] = useState(!!hoanTac);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  useChoHoanTac(con);
  useEffect(() => {
    if (!con) return undefined;
    const h = setTimeout(() => setCon(false), 10_000);
    return () => clearTimeout(h);
  }, [con]);
  const bam = async () => {
    setBusy(true); setLoi(null);
    try { await hoanTac!(); onHoanTac?.(); } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  return { con, busy, loi, bam };
}

/** Nút "Hoàn tác" 10 giây + câu lỗi của lần đảo (403 / 409 nói lý do + bước tiếp) — chân "✓ Đã lưu", dải việc vừa lưu, dòng "✓ …" của Số liệu. */
export function NutHoanTac({ hoanTac, onHoanTac }: { hoanTac?: () => Promise<void>; onHoanTac?: () => void }) {
  const { con, busy, loi, bam } = useHoanTac(hoanTac, onHoanTac);
  return <>
    {loi && <span role="alert" className="text-bad">⚠ {loi}</span>}
    {con && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" disabled={busy} onClick={() => void bam()}>{busy ? t('Đang lưu…') : t('Hoàn tác')}</button>}
  </>;
}

function ChanDaLuu({ luc, hoanTac, onHoanTac }: { luc: string; hoanTac?: () => Promise<void>; onHoanTac?: () => void }) {
  return (
    <p className="m-0 flex min-h-6 flex-wrap items-center gap-2 border-t pt-2.5 text-[13px] text-slate-400" style={{ borderColor: 'var(--line)' }}>
      <span className="font-semibold text-done">✓ {t('Đã lưu')} <span className="tabular-nums">{luc}</span></span>
      <span className="flex-1" />
      <NutHoanTac hoanTac={hoanTac} onHoanTac={onHoanTac} />
    </p>
  );
}

/**
 * DẢI VIỆC VỪA LƯU (M6 6b-3, mockup panel-pilot ②b `.dai-xong`): đầu thân việc kế — "✓ {câu} · {em · chi tiết}" + Hoàn tác 10 giây (chỉ khi việc đó
 * có đường đảo máy chủ). Hoàn tác xong nơi gọi mở lại việc đó để làm lại.
 */
export function DaiVuaLuu({ x, ai, onHoanTac }: { x: DaLuuPanel; ai: string | null; onHoanTac: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[4px_10px_10px_4px] bg-ok-bg py-2.5 pl-[15px] pr-3 text-[13px]" style={{ boxShadow: 'inset 3px 0 0 var(--ok)' }} role="status">
      <b className="font-bold text-ok">✓ {x.chu}</b>
      <span className="min-w-0 text-slate-300">{[ai, x.phu].filter(Boolean).join(' · ')}</span>
      <span className="flex-1" />
      <NutHoanTac hoanTac={x.hoanTac} onHoanTac={onHoanTac} />
    </div>
  );
}

/** Điểm trong dòng bối cảnh (P2): dưới kỳ vọng = đỏ ✗, đạt = xanh ✓ (cùng token `kq-*` của ô điểm); không kỳ vọng → số thường. */
export function DiemKq({ diem, kyVong }: { diem: number; kyVong?: number | null }) {
  const so = diem.toFixed(1);
  if (kyVong == null) return <span className="tabular-nums">{so}</span>;
  const dat = diem >= kyVong;
  return <span className={`font-bold tabular-nums ${dat ? 'text-kq-bang' : 'text-kq-duoi'}`}><span aria-hidden>{dat ? '✓ ' : '✗ '}</span>{so}</span>;
}
