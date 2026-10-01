import { useState, type ReactNode } from 'react';
import { chuTuanHoc, deadlineView, type DeadlineKind } from '@shared/domain/index.ts';
import { TargetText } from '../../ui/ui.tsx';
import { IconCanhBao, IconGap } from '../../ui/BieuTuong.tsx';

/**
 * ĐẦU HỒ SƠ HỌC VIÊN "hiểu trong 30 giây" (PR-VAI-b, mockup 24) — máy chủ dựng mọi chữ (`dauHoSo`), web chỉ vẽ.
 *   1 · dòng thông tin (em là ai) · 2 · câu tóm tắt (em đang thế nào) · 3 · bốn ô · 4 · thanh việc của NGƯỜI XEM.
 */

/** Việc của em theo người — cùng kiểu `ViecHocVien` ở `server/src/students/viecHocVien.ts`. */
export type Viec = {
  key: string; loai: string; chu: string; kyNang: string | null; caseId: number | null; paId: number | null;
  han: string | null; quaHanNgay: number | null; tone: 'danger' | 'warn' | 'info' | 'wait';
  nguoi: { id: number | null; ten: string; vai: string | null }; cuaBan: boolean; nut: string;
  mo: { loai: 'case'; caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa' | 'ke-hoach' }
    | { loai: 'tab'; tab: 'y-thuc'; sub?: 'phoi-hop' } | { loai: 'duong'; href: string } | null;
};

/**
 * DÒNG THÔNG TIN — "em là ai" (mockup 24 A/C/D1).
 *   FT          MB FT 101 · LT1 · target 6.5 · tuần học thứ 9 · thi dự kiến 06/2027 · GVCN …
 *   lớp thường  MB FOU 15 · FOU · tuần học 7/10 · Cuối khoá W4 OCT · GVCN …   (không target, FT không bao giờ "n/16")
 */
export function DongThongTin({ tt }: { tt: any }) {
  if (!tt?.lop) return <p className="mb-0 mt-1 text-[12.5px] text-slate-400">Chưa xếp lớp</p>;
  const muc: ReactNode[] = [
    <b key="lop">{tt.lop}</b>,
    tt.loTrinh && <b key="lt">{tt.loTrinh}</b>,
    tt.target !== null && <span key="tg">target <b><TargetText band={tt.target === 'KCK' ? null : tt.target} kck={tt.target === 'KCK'} /></b></span>,
    tt.tuanHoc && <span key="tuan"><b className="tabular-nums">{chuTuanHoc(tt.tuanHoc.tuan, tt.tuanHoc.tong)}</b>{tt.tuanHoc.dangDung ? ' · đang dừng' : ''}</span>,
    tt.thiDuKien && <span key="thi">{tt.thiDuKien.nhan} <b className="tabular-nums">{tt.thiDuKien.gt}</b></span>,
    tt.gvcn && <span key="gv">GVCN <b>{tt.gvcn}</b></span>,
  ].filter(Boolean);
  return (
    <ul className="m-0 mt-1 flex list-none flex-wrap gap-y-0.5 p-0 text-[12.5px] text-slate-400 [&_b]:font-semibold [&_b]:text-slate-100">
      {muc.map((m, i) => (
        <li key={i}>{m}{i < muc.length - 1 && <span aria-hidden className="px-[7px] opacity-70">·</span>}</li>
      ))}
    </ul>
  );
}

/** Loại hạn của từng loại việc — để chữ hạn đúng đồng hồ (HE_GIAO_DIEN §4). */
const LOAI_HAN: Record<string, DeadlineKind> = {
  'nguyen-nhan': 'xac-minh-sos', 'xac-nhan-pa': 'xac-minh-sos', 'ghi-ket-qua': 'cap-nhat-pa', 'ke-hoach': 'ke-hoach-bo-tro',
  'cho-duyet': 'duyet', 'mini-test': 'mini-test', 'y-thuc': 'xu-ly-vi-pham', 'ban-giao': 'viec-van-hanh', 'ban-giao-mon': 'viec-van-hanh',
};

/** Hạn 12 px (Q22): "hạn hết 02/10" mờ · quá hạn: ⚠ SVG + "quá hạn 3 ngày" đỏ (`chiQuaHan`: bỏ mốc, như thanh việc mockup 24 A). */
export function HanViec({ x, homNay, chiQuaHan }: { x: Viec; homNay: string | null; chiQuaHan?: boolean }) {
  if (!x.han) return null;
  const v = deadlineView({ kind: LOAI_HAN[x.loai] ?? 'viec-van-hanh', due: x.han, today: homNay ?? '' });
  if (v.quaHan) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-semibold tabular-nums text-bad" title={v.text}>
        <IconCanhBao />{chiQuaHan ? v.quaHan : `${v.han} · ${v.quaHan}`}
      </span>
    );
  }
  return <span className="whitespace-nowrap text-[12px] tabular-nums text-slate-400" title={v.text}>{v.han}{v.homNay ? ' · hôm nay' : ''}</span>;
}

/** "Ghi kết quả tuần W4 SEP · PA …" → phần động từ đậm, phần sau thường (mockup 24 A). */
function ChuViec({ chu }: { chu: string }) {
  const i = chu.indexOf(' · ');
  return i < 0 ? <b className="font-semibold">{chu}</b> : <><b className="font-semibold">{chu.slice(0, i)}</b>{chu.slice(i)}</>;
}

function NutGap({ mo, onClick, children }: { mo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-expanded={mo} onClick={onClick}
      className="inline-flex min-h-[28px] items-center gap-[5px] border-0 bg-transparent p-0 text-[12px] font-semibold text-[color:var(--accent)] hover:underline">
      {children}<IconGap mo={mo} />
    </button>
  );
}

/**
 * THANH "VIỆC CỦA BẠN" (K3-01, Q31-8, T72) — việc gấp nhất của NGƯỜI XEM với em này (quá hạn → hạn sớm → không hạn), nút động từ mở đúng
 * chỗ làm. "n việc khác của bạn" và "m việc của người khác" gập bên dưới. Người xem không có việc nào với em → KHÔNG VẼ GÌ (T72): việc của
 * người khác xem ở cột Việc tiếp và trong câu tóm tắt.
 */
export function ThanhViec({ viec, homNay, onLam }: { viec: { cuaBan: Viec[]; nguoiKhac: Viec[] } | null | undefined; homNay: string | null; onLam: (x: Viec) => void }) {
  const [mo, setMo] = useState<'ban' | 'khac' | null>(null);
  if (!viec?.cuaBan.length) return null;
  const [dau, ...con] = viec.cuaBan;
  const qh = dau.quaHanNgay !== null;
  const ds = mo === 'ban' ? con : mo === 'khac' ? viec.nguoiKhac : [];
  return (
    <section aria-label="Việc của bạn với học viên này">
      <div className={`flex flex-wrap items-center gap-x-3.5 gap-y-2 rounded-[10px] px-3 py-[9px] ${qh
        ? 'bg-bad-bg shadow-[inset_3px_0_0_rgb(var(--bad-rgb))]' : 'bg-[color:var(--surface-2)] shadow-[inset_3px_0_0_var(--accent)]'}`}>
        <span className="whitespace-nowrap text-[11.5px] font-bold uppercase tracking-[.04em] text-slate-400">Việc của bạn</span>
        <span className="min-w-0 flex-1 basis-full text-[13.5px] text-slate-100 sm:basis-auto">
          <ChuViec chu={dau.chu} /> {dau.han && <HanViec x={dau} homNay={homNay} chiQuaHan />}
        </span>
        {dau.mo && <button type="button" className="btn btn-primary btn-sm min-h-[36px] sm:min-h-0" onClick={() => onLam(dau)}>{dau.nut}</button>}
        {con.length > 0 && <NutGap mo={mo === 'ban'} onClick={() => setMo(mo === 'ban' ? null : 'ban')}>{con.length} việc khác của bạn</NutGap>}
        {viec.nguoiKhac.length > 0 && (
          <NutGap mo={mo === 'khac'} onClick={() => setMo(mo === 'khac' ? null : 'khac')}>{viec.nguoiKhac.length} việc của người khác</NutGap>
        )}
      </div>
      {ds.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1.5 pb-0.5 pl-[15px] pr-3 pt-1.5">
          {ds.map((x) => (
            <li key={x.key} className="grid grid-cols-1 items-baseline gap-x-3 gap-y-0.5 text-[13px] sm:grid-cols-[minmax(0,1fr)_auto]">
              {x.cuaBan && x.mo
                ? <button type="button" className="border-0 bg-transparent p-0 text-left text-slate-100 hover:underline" onClick={() => onLam(x)} title={x.nut}>{x.chu}</button>
                : <span className="text-slate-200">{x.chu}{!x.cuaBan && (
                  <span className="text-[12px] text-slate-400"> · {x.nguoi.ten}{x.nguoi.vai ? `, ${x.nguoi.vai}` : ''}</span>
                )}</span>}
              <span className="sm:text-right"><HanViec x={x} homNay={homNay} /></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ====================================================================== câu tóm tắt + bốn ô (Task 3)

const MAU_MANH: Record<string, string> = {
  danger: 'text-bad', warn: 'text-soon', sos1: 'text-sos1', sos2: 'text-sos2', sos3: 'text-sos3', wait: 'text-wait', accent: 'text-doing',
};

/** CÂU TÓM TẮT (Q6) — máy viết, tối đa 3 mảnh, mỗi mảnh một màu theo nghĩa, ngăn bằng `·` mờ. 14 px, dưới vạch mảnh của khung thông tin. */
export function CauTomTat({ manh }: { manh: { chu: string; tone: string | null }[] | null | undefined }) {
  if (!manh?.length) return null;
  return (
    <p className="m-0 mt-2.5 border-t pt-2.5 text-[14px] leading-[1.55] text-slate-200" style={{ borderColor: 'var(--line)' }}>
      {manh.map((m, i) => (
        <span key={i}>
          {i > 0 && <span aria-hidden className="px-1.5 text-slate-500">·</span>}
          <span className={m.tone ? `font-semibold ${MAU_MANH[m.tone] ?? ''}` : ''}>{m.chu}</span>
        </span>
      ))}
    </p>
  );
}

const CHIP_SOS_O: Record<number, string> = { 1: 'bg-sos1-bg text-sos1', 2: 'bg-sos2-bg text-sos2', 3: 'bg-sos3-bg text-sos3' };
const MAU_NHAN: Record<string, string> = {
  'qua-han': 'bg-bad-bg text-bad', 'can-lam': 'border border-[color:var(--line-strong)] text-slate-200', 'cho-duyet': 'bg-wait-bg text-wait',
  'dang-lam': 'bg-[color:var(--surface-2)] text-slate-200',
};

/** Một ô: nhãn 11,5 px · dòng trên 12 px · giá trị 17 px đậm · dòng phụ 12 px. Là `<button>` khi có chỗ để mở (mở đúng chỗ sinh ra số). */
function O({ nhan, tren, children, phu, onClick, title }: {
  nhan: string; tren?: ReactNode; children: ReactNode; phu?: ReactNode; onClick?: () => void; title: string;
}) {
  const Khung = onClick ? 'button' : 'div';
  return (
    <Khung type={onClick ? 'button' : undefined} onClick={onClick} title={title}
      className={`flex min-w-0 flex-col gap-[3px] rounded-[10px] border bg-[color:var(--surface)] px-3 py-2.5 text-left ${onClick ? 'cursor-pointer hover:border-[color:var(--line-strong)]' : ''}`}
      style={{ borderColor: 'var(--line)' }}>
      <span className="text-[11.5px] font-semibold tracking-[.03em] text-slate-400">{nhan}</span>
      {tren && <span className="text-[12px] text-slate-400">{tren}</span>}
      <span className="flex flex-wrap items-center gap-1.5 text-[17px] font-bold leading-[1.35] text-slate-100">{children}</span>
      {phu && <span className="text-[12px] leading-[1.45] text-slate-400">{phu}</span>}
    </Khung>
  );
}

/**
 * BỐN Ô (K3-03, T72): Kết quả gần nhất · Học thuật · Ý thức · Sắp tới — mỗi ô MỘT nguồn (máy chủ `dauHoSo.o`), bấm mở đúng chỗ:
 * đợt Test · bảng kỹ năng ở Case gấp nhất · tab Ý thức · đợt Test kế tiếp. < 760 px: lưới 2×2.
 */
export function BonO({ o, homNay, onDot, onKn, onYThuc, kyNangHref }: {
  o: any; homNay: string | null; onDot: (attemptId: number) => void; onKn: (kn: string) => void; onYThuc: () => void;
  /** G5 (Task 8): đường tới hồ sơ Mock cuộn tới kỹ năng — null thì mã kỹ năng chỉ là chữ. */
  kyNangHref?: (kn: string) => string | null;
}) {
  if (!o) return null;
  const k = o.ketQua;
  const kq = k.kq;
  const h = o.hocThuat;
  const y = o.yThuc;
  const s = o.sapToi;
  const giaTriKq = !kq ? '—'
    : k.ratio ? (kq.phanTram !== null ? `Cuối khoá ${kq.phanTram}%` : kq.dat === null ? `${kq.coDiem}/${kq.yeuCau} môn có điểm` : `${kq.yeuCau - (kq.soMonChuaDat ?? 0)}/${kq.yeuCau} môn đạt`)
    : k.kck ? null
    : kq.sos ? <span className={`rounded-md px-2 font-bold leading-6 tabular-nums ${CHIP_SOS_O[Math.min(3, kq.sos)]}`}>SOS {kq.sos}</span>
    : kq.dat ? <span className="text-ok">Đạt kỳ vọng</span> : 'Chưa đủ điểm';
  const duoi = k.duoi?.length ? (
    <>dưới kỳ vọng: {k.duoi.map((d: any, i: number) => {
      const href = kyNangHref?.(d.kn) ?? null;
      return (
        <span key={d.kn}>{i > 0 && ' · '}{href
          ? <a href={href} className="link" onClick={(e) => e.stopPropagation()} title={`Mở hồ sơ Mock · ${d.ngan}`}>{d.ngan}</a>
          : d.ngan}</span>
      );
    })}</>
  ) : null;
  const phuKq = !kq ? 'chưa có điểm nào'
    : k.ratio ? (k.huong ? <>{k.huong}{k.duoi?.length ? <> · không đạt: {k.duoi.map((d: any) => d.ngan).join(' · ')}</> : null}</>
      : k.duoi?.length ? <>Không đạt: {k.duoi.map((d: any) => d.ngan).join(' · ')}</> : null)
    : k.kck ? 'KCK · không đặt kỳ vọng MT'
    : <>{kq.coDiem}/{kq.yeuCau} phần có điểm{duoi && <> · {duoi}</>}</>;
  const gap = h.dong[0];
  return (
    <div className="grid grid-cols-2 gap-2.5 min-[760px]:grid-cols-4">
      <O nhan="Kết quả gần nhất" tren={kq?.nhan} phu={phuKq} title="Mở đợt Test này ở bảng Học thuật"
        onClick={kq ? () => onDot(kq.attemptId) : undefined}>
        {k.kck && kq
          ? <span className="rounded-md border px-2 text-[15px] leading-6 tabular-nums text-slate-300" style={{ borderColor: 'var(--line-strong)' }}>Overall {k.overall !== null ? k.overall.toFixed(1) : '—'}</span>
          : giaTriKq}
      </O>
      <O nhan="Học thuật" title="Mở bảng kỹ năng ở Case gấp nhất"
        onClick={gap ? () => onKn(gap.category) : undefined}
        phu={h.dong.length ? (
          <span className="flex flex-col gap-[3px]">
            {h.dong.slice(0, 3).map((d: any, i: number) => (
              <span key={i} className="flex min-w-0 items-center gap-1.5">
                <span className="min-w-[30px] font-bold tabular-nums text-slate-100">{d.kn}</span>
                <span className={`whitespace-nowrap rounded-md px-1.5 text-[11.5px] font-semibold leading-[18px] ${MAU_NHAN[d.t] ?? ''}`}>{d.nhan}</span>
                {d.viec && <span className="truncate">{d.viec}</span>}
              </span>
            ))}
            {h.dong.length > 3 && <span>+{h.dong.length - 3} Case khác</span>}
            {h.phu && <span>{h.phu}</span>}
          </span>
        ) : h.phu}>
        {h.so} Case
      </O>
      <O nhan="Ý thức" tren={y.tren} title="Mở tab Ý thức & Phối hợp" onClick={onYThuc}
        phu={<span className={y.tone === 'danger' ? 'font-semibold text-bad' : y.tone === 'warn' ? 'font-semibold text-soon' : y.tone === 'wait' ? 'text-wait' : ''}>{y.phu}</span>}>
        <span className={y.tren ? '' : 'text-[15px]'}>{y.gt}</span>
      </O>
      <O nhan="Sắp tới" tren={s.tren} phu={s.phu} title="Mở đợt Test kế tiếp ở bảng Học thuật"
        onClick={s.attemptId ? () => onDot(s.attemptId) : undefined}>
        <span className="text-[15px] tabular-nums">{s.gt}</span>
      </O>
    </div>
  );
}
