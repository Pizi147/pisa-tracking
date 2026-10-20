import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { duongHoSoHocVien } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { useChoHoanTac } from './KhungPanel.tsx';

/**
 * KHUÔN PANEL LÀM VIỆC v3 (OV-12c, mockup `thiet-ke/mockup-ov12-panel-v3-2026-10-14.html` §1) — phần dùng chung đặt trong `KhungPanel`:
 *   (ChipHan — chip hạn ở đầu panel — nằm ở `ui/Nhan.tsx` cùng các chip khác.)
 *   CanLam    Khối "Cần làm" — khối DUY NHẤT có màu (nền accent-soft + vạch trái 3 px); chứa đúng ô cần điền + một nút chính.
 *   BoiCanh   ≤ 3 dòng nhãn – giá trị (Nguyên nhân · Phương án · Kết quả gần nhất); "Xem thêm" mở ngay dưới, không chuyển trang.
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
      <dl className="m-0 grid grid-cols-[132px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[13px] max-sm:grid-cols-1 max-sm:gap-y-0.5">
        {co.map(([nhan, gt]) => (
          <div key={nhan} className="contents">
            <dt className="text-slate-500">{nhan}</dt>
            <dd className="m-0 text-slate-400 max-sm:mb-1.5">{gt}</dd>
          </div>
        ))}
      </dl>
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
}): { han?: ReactNode; dong2: ReactNode[] } {
  return {
    han,
    dong2: [
      em ? <Link className="font-bold text-slate-100 no-underline hover:underline max-sm:-my-3 max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center" to={duongHoSoHocVien(em.id)}>{em.ten}<span aria-hidden className="ml-0.5 text-xs text-[color:var(--accent)]">↗</span></Link> : null,
      lop ?? null, ngCanh ?? null,
    ],
  };
}

/**
 * CHÂN v3 — trạng thái lưu MỘT dòng, chữ + ký hiệu (không chỉ màu): Chưa lưu (Huỷ sửa) · Đang lưu… · ⚠ Không lưu được (Thử lại). Chữ đã gõ giữ nguyên
 * khi lỗi. "Còn thiếu n ô" do `KhungPanel chan.conThieu` vẽ.
 */
export function TrangThaiLuu({ tt, loi, onHuy, onThuLai }: { tt: 'nhap' | 'dang' | 'loi' | null; loi?: string | null; onHuy?: () => void; onThuLai?: () => void }) {
  if (!tt) return null;
  const nut = (chu: string, f: () => void) => (
    <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={f}>{chu}</button>
  );
  return (
    <>
      {tt === 'loi'
        ? <span role="alert" className="font-semibold text-bad">⚠ {t('Không lưu được')}{loi ? ` — ${loi}` : ''}</span>
        : <span className={tt === 'nhap' ? 'inline-flex items-center gap-1.5 text-slate-300' : ''}>
            {tt === 'nhap' && <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-soon" />}{tt === 'dang' ? t('Đang lưu…') : t('Chưa lưu')}
          </span>}
      <span className="flex-1" />
      {tt === 'nhap' && onHuy && nut(t('Huỷ sửa'), onHuy)}
      {tt === 'loi' && onThuLai && nut(t('Thử lại'), onThuLai)}
    </>
  );
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
export type DaLuuPanel = { chu: string; phu?: string | null; hoanTac?: () => Promise<void> };

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

function ChanDaLuu({ luc, hoanTac, onHoanTac }: { luc: string; hoanTac?: () => Promise<void>; onHoanTac?: () => void }) {
  const [con, setCon] = useState(!!hoanTac);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  useChoHoanTac(con);
  useEffect(() => {
    if (!con) return undefined;
    const h = setTimeout(() => setCon(false), 10_000);   // mockup OV-13 §1: Hoàn tác 10 giây
    return () => clearTimeout(h);
  }, [con]);
  const bam = async () => {
    setBusy(true); setLoi(null);
    try { await hoanTac!(); onHoanTac?.(); } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  return (
    <p className="m-0 flex min-h-6 flex-wrap items-center gap-2 border-t pt-2.5 text-[13px] text-slate-400" style={{ borderColor: 'var(--line)' }}>
      <span className="font-semibold text-ok">✓ {t('Đã lưu')} <span className="tabular-nums">{luc}</span></span>
      <span className="flex-1" />
      {loi && <span role="alert" className="text-bad">⚠ {loi}</span>}
      {con && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" disabled={busy} onClick={() => void bam()}>{busy ? t('Đang lưu…') : t('Hoàn tác')}</button>}
    </p>
  );
}
