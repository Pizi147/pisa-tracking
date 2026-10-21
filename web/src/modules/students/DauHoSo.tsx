import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { chuPhuHuynh, chuTamDung, chuTuanHoc, deadlineView, ngay, type DeadlineKind, type LienHe, type TheYeuCauDto } from '@shared/domain/index.ts';
import { TargetText } from '../../ui/ui.tsx';
import { KetQuaDot } from '../../ui/KetQuaDot.tsx';
import { ChipDuoiKck } from '../../ui/KetQuaDot.tsx';
import { useApi } from '../../lib/useApi.ts';
import { TheYeuCau } from '../duyet/TheYeuCau.tsx';
import { IconCanhBao, IconGap, IconTamDung } from '../../ui/BieuTuong.tsx';
import { dich, dichChu, t, type Bien, type ChuKhoa } from '@shared/i18n/index.ts';

/**
 * ĐẦU HỒ SƠ HỌC VIÊN "hiểu trong 30 giây" (PR-VAI-b, mockup 24) — máy chủ dựng mọi chữ (`dauHoSo`), web chỉ vẽ.
 *   1 · dòng thông tin (em là ai) · 2 · câu tóm tắt (em đang thế nào) · 3 · bốn ô · 4 · thanh việc của NGƯỜI XEM.
 */

/** Việc của em theo người — cùng kiểu `ViecHocVien` ở `server/src/students/viecHocVien.ts`. */
export type Viec = {
  key: string; loai: string; chu: string; khoa?: string; bien?: Bien; kyNang: string | null; caseId: number | null; paId: number | null;
  han: string | null; quaHanNgay: number | null; tone: 'danger' | 'warn' | 'info' | 'wait';
  nguoi: { id: number | null; ten: string; vai: string | null }; cuaBan: boolean; nut: string;
  mo: { loai: 'case'; caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa' | 'them-pa' }
    | { loai: 'tab'; tab: 'y-thuc'; sub?: 'phoi-hop' } | { loai: 'duong'; href: string } | null;
};

/** PR-EN-c: chữ máy chủ dựng — có khoá thì dịch theo khoá, không thì theo chính chữ. */
const dk = (s: string | null | undefined, k?: ChuKhoa | null): string | null => (k ? dichChu(k) : s ? dich(s) : null);
const chuViec = (x: Viec) => dichChu(x);
const nutViec = (x: Viec) => dich(x.nut);
const vaiViec = (x: Viec) => (x.nguoi.vai ? dich(x.nguoi.vai) : null);
/** Người không tài khoản ("Quản lý", "Chưa có người phụ trách") là vai — dịch; tên người giữ nguyên. */
const tenNguoi = (x: Viec) => (x.nguoi.id ? x.nguoi.ten : dich(x.nguoi.ten));

/**
 * DÒNG THÔNG TIN — "em là ai" (mockup 24 A/C/D1).
 *   FT          MB FT 101 · LT1 · target 6.5 · tuần học 9 · dự kiến thi 06/2027 · GVCN …
 *   lớp thường  MB FOU 15 · FOU · tuần học 7/10 · Cuối khoá W4 OCT · Target 5.5 · thi IELTS dự kiến 06/2027 · GVCN …
 *               (PR-NT 04/10: Target + thi IELTS chỉ hiện khi có; FT không bao giờ "n/16")
 */
export function DongThongTin({ tt }: { tt: any }) {
  if (!tt?.lop) return <p className="mb-0 mt-1 text-[13px] text-slate-400">{t('Chưa xếp lớp')}</p>;
  const target = ((tt.target !== null && tt.target !== undefined) || tt.kck)   // OV-9: "6.5 · KCK" · "— · KCK"
    && <span key="tg">Target <b><TargetText band={tt.target} kck={tt.kck} /></b></span>;
  const muc: ReactNode[] = [
    <b key="lop">{tt.lop}</b>,
    tt.loTrinh && <b key="lt">{dich(tt.loTrinh)}</b>,
    !tt.lopThuong && target,
    tt.tuanHoc && <span key="tuan"><b className="tabular-nums">{chuTuanHoc(tt.tuanHoc.tuan, tt.tuanHoc.tong, tt.tuanHoc.dangDung)}</b></span>,
    tt.thiDuKien && <span key="thi">{dich(tt.thiDuKien.nhan)} <b className="tabular-nums">{tt.thiDuKien.gt}</b></span>,
    tt.lopThuong && target,
    tt.thiIelts && <span key="ielts">{t('thi IELTS dự kiến')} <b className="tabular-nums">{tt.thiIelts}</b></span>,
    tt.gvcn && <span key="gv">{t('GVCN')} <b>{tt.gvcn}</b></span>,
  ].filter(Boolean);
  return (
    <ul className="m-0 mt-1 flex list-none flex-wrap gap-y-0.5 p-0 text-[13px] text-slate-400 [&_b]:font-semibold [&_b]:text-slate-100">
      {muc.map((m, i) => (
        <li key={i}>{m}{i < muc.length - 1 && <span aria-hidden className="px-[7px] opacity-70">·</span>}</li>
      ))}
    </ul>
  );
}

/** Số gọi được trên điện thoại (`tel:`), chữ giữ nguyên như người nhập. */
function So({ sdt }: { sdt: string }) {
  return <a href={`tel:${sdt.replace(/[^\d+]/g, '')}`} className="font-semibold tabular-nums text-slate-100 no-underline hover:underline">{sdt}</a>;
}

/**
 * DÒNG LIÊN HỆ (OV-10b, mockup vai 13/10 mục 3) — MỌI vai, chỉ đọc: SĐT em · PH tên (quan hệ) · SĐT · email · ngày sinh · TVV. Chưa có SĐT / phụ huynh
 * → "Chưa có liên hệ" mờ (không đỏ, không bắt nhập). Nhập ở Sửa thông tin.
 */
export function DongLienHe({ l, email, dob, tvv }: { l: LienHe | null | undefined; email?: string | null; dob?: string | null; tvv?: string | null }) {
  const ph = chuPhuHuynh(l);
  const muc: ReactNode[] = [
    l?.phone && <span key="em">{t('Em')} <So sdt={l.phone} /></span>,
    (ph || l?.parentPhone) && <span key="ph">{t('PH')}{ph ? `: ${ph}` : ''}{l?.parentPhone && <>{ph ? ' · ' : ' '}<So sdt={l.parentPhone} /></>}</span>,
    !l?.phone && !ph && !l?.parentPhone && <span key="chua" className="text-slate-500">{t('Chưa có liên hệ')}</span>,
    email && <span key="mail" className="break-all">{email}</span>,
    dob && <span key="dob">{t('Sinh')} <span className="tabular-nums">{ngay(dob)}</span></span>,
    tvv && <span key="tvv">{t('TVV')} {tvv}</span>,
  ].filter(Boolean);
  return (
    <ul aria-label={t('Liên hệ')} className="m-0 mt-1 flex list-none flex-wrap items-baseline gap-y-0.5 p-0 text-[13px] text-slate-300">
      <li className="pr-2 text-[12px] font-semibold tracking-[.03em] text-slate-500">{t('Liên hệ')}</li>
      {muc.map((m, i) => (
        <li key={i}>{m}{i < muc.length - 1 && <span aria-hidden className="px-[7px] text-slate-500">·</span>}</li>
      ))}
    </ul>
  );
}

/**
 * KHỐI "ĐANG XỬ LÝ" (OV-10b, mockup vai mục 3) — TVV / CX / Admin, chỉ đọc: ai đang làm việc gì với em và hạn — để trả lời phụ huynh không phải hỏi
 * từng người. Cùng nguồn với thanh "Việc của tôi" (`dauHoSo.viec` — luật người làm như Công việc, việc đã xong không có). Không có việc → không vẽ.
 */
export function DangXuLy({ viec, homNay }: { viec: { cuaBan: Viec[]; nguoiKhac: Viec[] } | null | undefined; homNay: string | null }) {
  /* Người xem có việc với em → thanh "Việc của tôi" đã có "việc của người khác" (gập) — không vẽ hai lần. */
  const ds = viec?.cuaBan.length ? [] : viec?.nguoiKhac ?? [];
  if (!ds.length) return null;
  return (
    <section aria-label={t('Đang xử lý')} className="rounded-[10px] bg-[color:var(--surface-2)] px-3 py-[9px]">
      <h2 className="m-0 mb-1 text-[12px] font-bold  text-slate-400">{t('Đang xử lý')}</h2>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {ds.map((x) => (
          <li key={x.key} className="grid grid-cols-1 items-baseline gap-x-3 gap-y-0.5 text-[13px] sm:grid-cols-[minmax(0,1fr)_auto]">
            <span className="min-w-0 text-slate-200">
              <b className="font-semibold text-slate-100">{tenNguoi(x)}</b>{x.nguoi.vai && <span className="text-slate-400"> ({vaiViec(x)})</span>}
              <span className="text-slate-400"> · </span>{chuViec(x)}
            </span>
            <span className="sm:text-right"><HanViec x={x} homNay={homNay} /></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Loại hạn của từng loại việc — để chữ hạn đúng đồng hồ (HE_GIAO_DIEN §4). */
const LOAI_HAN: Record<string, DeadlineKind> = {
  'nguyen-nhan': 'xac-minh-sos', 'de-ra-pa': 'lap-pa', 'xac-nhan-pa': 'xac-minh-sos', 'ghi-ket-qua': 'cap-nhat-pa',
  'cho-duyet': 'duyet', 'mini-test': 'mini-test', 'y-thuc': 'xu-ly-vi-pham', 'yt-xem': 'xu-ly-vi-pham', 'yt-thuc-hien': 'xu-ly-vi-pham', 'ban-giao': 'viec-van-hanh', 'ban-giao-mon': 'viec-van-hanh',
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
  return <span className={`whitespace-nowrap text-[12px] tabular-nums ${v.ganHan ? 'font-semibold text-soon' : 'text-slate-400'}`} title={v.text}>{v.han}{v.homNay ? ` · ${t('hôm nay')}` : ''}</span>;
}

/** "Ghi kết quả tuần W4 SEP · PA …" → phần động từ đậm, phần sau thường (mockup 24 A). */
function ChuViec({ chu }: { chu: string }) {
  const i = chu.indexOf(' · ');
  return i < 0 ? <b className="font-semibold">{chu}</b> : <><b className="font-semibold">{chu.slice(0, i)}</b>{chu.slice(i)}</>;
}

function NutGap({ mo, onClick, children }: { mo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-expanded={mo} onClick={onClick}
      className="inline-flex min-h-[44px] items-center gap-[5px] border-0 bg-transparent p-0 text-[12px] font-semibold text-[color:var(--accent)] hover:underline sm:min-h-[28px]">
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
    <section aria-label={t('Việc của tôi với học viên này')}>
      <div className={`flex flex-wrap items-center gap-x-3.5 gap-y-2 rounded-[10px] px-3 py-[9px] ${qh
        ? 'bg-bad-bg shadow-[inset_3px_0_0_rgb(var(--bad-rgb))]' : 'bg-[color:var(--surface-2)] shadow-[inset_3px_0_0_var(--accent)]'}`}>
        <span className="whitespace-nowrap text-[12px] font-bold  text-slate-400">{t('Việc của tôi')}</span>
        <span className="min-w-0 flex-1 basis-full text-[14px] text-slate-100 sm:basis-auto">
          <ChuViec chu={chuViec(dau)} /> {dau.han && <HanViec x={dau} homNay={homNay} chiQuaHan />}
        </span>
        {dau.mo && <button type="button" className="btn btn-primary btn-sm min-h-[44px] w-full sm:min-h-0 sm:w-auto" onClick={() => onLam(dau)}>{nutViec(dau)}</button>}
        {con.length > 0 && <NutGap mo={mo === 'ban'} onClick={() => setMo(mo === 'ban' ? null : 'ban')}>{t('{n} việc khác của tôi', { n: con.length })}</NutGap>}
        {viec.nguoiKhac.length > 0 && (
          <NutGap mo={mo === 'khac'} onClick={() => setMo(mo === 'khac' ? null : 'khac')}>{t('{n} việc của người khác', { n: viec.nguoiKhac.length })}</NutGap>
        )}
      </div>
      {ds.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1.5 pb-0.5 pl-[15px] pr-3 pt-1.5">
          {ds.map((x) => (
            <li key={x.key} className="grid grid-cols-1 items-baseline gap-x-3 gap-y-0.5 text-[13px] sm:grid-cols-[minmax(0,1fr)_auto]">
              {x.cuaBan && x.mo
                ? <button type="button" className="border-0 bg-transparent p-0 text-left text-slate-100 hover:underline" onClick={() => onLam(x)} title={nutViec(x) ?? undefined}>{chuViec(x)}</button>
                : <span className="text-slate-200">{chuViec(x)}{!x.cuaBan && (
                  <span className="text-[12px] text-slate-400"> · {tenNguoi(x)}{x.nguoi.vai ? `, ${vaiViec(x)}` : ''}</span>
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
  danger: 'text-bad', warn: 'text-soon', sos1: 'text-sos1-chu', sos2: 'text-sos2-chu', sos3: 'text-sos3-chu', wait: 'text-muted', accent: 'text-doing',
};

/** CÂU TÓM TẮT (Q6) — máy viết, tối đa 3 mảnh, mỗi mảnh một màu theo nghĩa, ngăn bằng `·` mờ. 14 px, dưới vạch mảnh của khung thông tin. */
export function CauTomTat({ manh }: { manh: (ChuKhoa & { tone: string | null })[] | null | undefined }) {
  if (!manh?.length) return null;
  return (
    <p className="m-0 mt-2.5 border-t pt-2.5 text-[14px] leading-[1.55] text-slate-200" style={{ borderColor: 'var(--line)' }}>
      {manh.map((m, i) => (
        <span key={i}>
          {i > 0 && <span aria-hidden className="px-1.5 text-slate-500">·</span>}
          <span className={m.tone ? `font-semibold ${MAU_MANH[m.tone] ?? ''}` : ''}>{dichChu(m)}</span>
        </span>
      ))}
    </p>
  );
}

const MAU_NHAN: Record<string, string> = {
  'qua-han': 'bg-bad-bg text-bad', 'can-lam': 'border border-[color:var(--line-strong)] text-slate-200', 'cho-duyet': 'bg-muted-bg text-muted',
  'dang-lam': 'bg-[color:var(--surface-2)] text-slate-200', 'tam-dung': 'bg-soon-bg text-soon',
};

/** Một ô: nhãn 11,5 px · dòng trên 12 px · giá trị 17 px đậm · dòng phụ 12 px. Là `<button>` khi có chỗ để mở (mở đúng chỗ sinh ra số). */
function O({ nhan, tren, children, phu, onClick, title, phuNgoai }: {
  nhan: string; tren?: ReactNode; children: ReactNode; phu?: ReactNode; onClick?: () => void; title: string;
  /** Dòng phụ có liên kết (G5) → nằm NGOÀI nút (không lồng liên kết trong nút); phần trên vẫn bấm được. */
  phuNgoai?: boolean;
}) {
  if (phuNgoai) {
    return (
      <div className="flex min-w-0 flex-col gap-[3px] rounded-[10px] border bg-[color:var(--surface)] px-3 py-2.5" style={{ borderColor: 'var(--line)' }}>
        <button type="button" onClick={onClick} disabled={!onClick} title={title}
          className="flex flex-col gap-[3px] border-0 bg-transparent p-0 text-left enabled:cursor-pointer">
          <span className="text-[12px] font-semibold tracking-[.03em] text-slate-400">{nhan}</span>
          {tren && <span className="text-[12px] text-slate-400">{tren}</span>}
          <span className="flex flex-wrap items-center gap-1.5 text-[17px] font-bold leading-[1.35] text-slate-100">{children}</span>
        </button>
        {phu && <span className="text-[12px] leading-[1.45] text-slate-400">{phu}</span>}
      </div>
    );
  }
  const Khung = onClick ? 'button' : 'div';
  return (
    <Khung type={onClick ? 'button' : undefined} onClick={onClick} title={title}
      className={`flex min-w-0 flex-col gap-[3px] rounded-[10px] border bg-[color:var(--surface)] px-3 py-2.5 text-left ${onClick ? 'cursor-pointer hover:border-[color:var(--line-strong)]' : ''}`}
      style={{ borderColor: 'var(--line)' }}>
      <span className="text-[12px] font-semibold tracking-[.03em] text-slate-400">{nhan}</span>
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
  kyNangHref?: (kn: string, attemptId: number | null) => string | null;
}) {
  if (!o) return null;
  const k = o.ketQua;
  const kq = k.kq;
  const h = o.hocThuat;
  const y = o.yThuc;
  const s = o.sapToi;
  /* OV-9: em KCK có Target thì có kỳ vọng như thường; chỉ em KCK CHƯA có Target (không kỳ vọng) mới hiện OVR trơn. */
  const kckKhongKyVong = k.kck && !!kq && !kq.kckDuoi && kq.sos === null;
  const giaTriKq = !kq ? '—'
    : k.ratio ? (kq.phanTram !== null ? `Final Test ${kq.phanTram}%` : kq.dat === null ? t('{a}/{b} môn có điểm', { a: kq.coDiem, b: kq.yeuCau }) : t('{a}/{b} môn đạt', { a: kq.yeuCau - (kq.soMonChuaDat ?? 0), b: kq.yeuCau }))
    : kq.kckDuoi ? <ChipDuoiKck />
    : kckKhongKyVong ? null
    : kq.sos ? <KetQuaDot coDiem={kq.coDiem} yeuCau={kq.yeuCau} dat={kq.dat} sos={kq.sos} chot={kq.chot} />   /* G1: một câu chung, giữ "tạm thời" + viền đứt */
    : kq.dat ? <span className="text-ok">{t('Đạt kỳ vọng')}</span> : t('Chưa đủ điểm');
  /* Chưa có đợt nào chấm xong (kq null) mà vẫn có kỹ năng "dưới kỳ vọng" từ bảng Học thuật: không có tên đợt để ghi → không vẽ dòng này (trước đây sập cả hồ sơ). */
  const duoi = kq && k.duoi?.length ? (
    <>{t('dưới kỳ vọng:')} {k.duoi.map((d: any, i: number) => {
      const href = kyNangHref?.(d.kn, d.attemptId ?? null) ?? null;
      return (
        <span key={d.kn}>{i > 0 && ' · '}{href
          ? <Link to={href} className="link max-sm:inline-block max-sm:px-1.5 max-sm:py-3 max-sm:-my-3" title={`${t('Mở Hồ sơ Mock Test')} · ${kq.nhan.split(' · ')[0]} · ${d.ngan}`}>{d.ngan}</Link>
          : d.ngan}</span>
      );
    })}</>
  ) : null;
  const phuKq = !kq ? t('chưa có điểm nào')
    : k.ratio ? (k.huong ? <>{dich(k.huong)}{k.duoi?.length ? <> · {t('không đạt: {ds}', { ds: k.duoi.map((d: any) => d.ngan).join(' · ') })}</> : null}</>
      : k.duoi?.length ? <>{t('Không đạt: {ds}', { ds: k.duoi.map((d: any) => d.ngan).join(' · ') })}</> : null)
    : kckKhongKyVong ? t('KCK · chưa có Target')
    : kq.sos && kq.coDiem < kq.yeuCau ? duoi   /* KetQuaDot đã ghi "n/4 kỹ năng" */
    : <>{t('{a}/{b} phần có điểm', { a: kq.coDiem, b: kq.yeuCau })}{duoi && <> · {duoi}</>}</>;
  const gap = h.dong[0];
  return (
    <div className="grid grid-cols-2 gap-2.5 min-[760px]:grid-cols-4">
      <O nhan={t('Kết quả gần nhất')} tren={kq?.nhan} phu={phuKq} title={t('Mở đợt Test này ở bảng Học thuật')} phuNgoai={!!kyNangHref && !!k.duoi?.length}
        onClick={kq ? () => onDot(kq.attemptId) : undefined}>
        {kckKhongKyVong
          ? <span className="rounded-md border px-2 text-[15px] leading-6 tabular-nums text-slate-300" style={{ borderColor: 'var(--line-strong)' }}>OVR {k.overall !== null ? k.overall.toFixed(1) : '—'}</span>
          : giaTriKq}
      </O>
      <O nhan={t('Học thuật')} title={t('Mở bảng kỹ năng ở Case gấp nhất')}
        onClick={gap ? () => onKn(gap.category) : undefined}
        phu={h.dong.length ? (
          <span className="flex flex-col gap-[3px]">
            {h.dong.slice(0, 3).map((d: any, i: number) => (
              <span key={i} className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="min-w-[30px] font-bold tabular-nums text-slate-100">{d.kn}</span>
                <span className={`whitespace-nowrap rounded-md px-1.5 text-[12px] font-semibold leading-[18px] ${MAU_NHAN[d.t] ?? ''}`}>{dk(d.nhan, d.nhanK)}</span>
                {d.viec && <span>{dich(d.viec)}</span>}
              </span>
            ))}
            {h.dong.length > 3 && <span>{t('+{n} Case khác', { n: h.dong.length - 3 })}</span>}
            {h.phu && <span>{dich(h.phu)}</span>}
          </span>
        ) : dk(h.phu)}>
        {h.so} Case
      </O>
      <O nhan={t('Ý thức')} tren={dk(y.tren)} title={t('Mở tab Ý thức & Phối hợp')} onClick={onYThuc}
        phu={<span className={y.tone === 'danger' ? 'font-semibold text-bad' : y.tone === 'warn' ? 'font-semibold text-soon' : y.tone === 'wait' ? 'text-muted' : ''}>{dk(y.phu, y.phuK)}</span>}>
        <span className={y.tren ? '' : 'text-[15px]'}>{dk(y.gt)}</span>
      </O>
      <O nhan={t('Sắp tới')} tren={dk(s.tren)} phu={dk(s.phu, s.phuK)} title={t('Mở đợt Test sắp tới ở bảng Học thuật')}
        onClick={s.attemptId ? () => onDot(s.attemptId) : undefined}>
        <span className="text-[15px] tabular-nums">{dk(s.gt, s.gtK)}</span>
      </O>
    </div>
  );
}

/**
 * DẢI TẠM DỪNG (T65, K3-41, mockup 24 D1) — ngay dưới khung thông tin, trên bốn ô: mọi hạn của em đang dừng. Nền vàng nhạt, biểu tượng
 * tạm dừng SVG; dòng phụ nói hạn tính lại thế nào khi quay lại. < 640 px chữ xuống dòng trọn, không dồn.
 */
export function DaiTamDung({ tamDung, onQuayLai }: {
  tamDung: { tu: string; lyDo: string | null; boi: string | null } | null | undefined;
  /** OV-11d (CA2-12): người được Quay lại học (máy chủ `lopHoc.quyen.quayLai`) có nút ngay trên dải. */
  onQuayLai?: () => void;
}) {
  if (!tamDung) return null;
  const ngayDung = `${tamDung.tu.slice(8, 10)}/${tamDung.tu.slice(5, 7)}`;
  return (
    <section aria-label={t('Học viên đang tạm dừng')} className="flex items-start gap-2.5 rounded-[10px] bg-soon-bg px-3 py-2.5 shadow-[inset_3px_0_0_rgb(var(--soon-rgb))]">
      <span className="mt-[3px] text-soon"><IconTamDung /></span>
      <span className="min-w-0 text-[13px] text-slate-100">
        <b className="font-semibold text-soon">{chuTamDung(ngayDung)}</b> · {t('mọi hạn đang dừng')}
        {tamDung.lyDo && <> · {t('lý do:')} <span lang="vi">{tamDung.lyDo}</span></>}
        {tamDung.boi && <> · {t('người ghi:')} {tamDung.boi}</>}
        <span className="block text-[12px] text-slate-400">{t('Quay lại học thì hạn tính lại từ ngày quay lại')}</span>
      </span>
      {onQuayLai && <button type="button" className="btn btn-sm ml-auto shrink-0 min-h-[44px] sm:min-h-0" onClick={onQuayLai}>{t('Quay lại học')}</button>}
    </section>
  );
}

/**
 * DẢI "n YÊU CẦU CHỜ BẠN DUYỆT" (V1/K3-47, mockup 24 B) — Quản lý quyết ngay trong hồ sơ, đúng thẻ của hộp Chờ duyệt (`TheYeuCau`: Duyệt /
 * Từ chối… / Duyệt = ra lệnh). Nguồn `GET /yeu-cau?studentId=` (đã lọc quyền, quá hạn lên đầu). Nơi gọi chỉ vẽ khi `viewer.coTheDuyet`.
 * Không có thẻ → không vẽ. Xong một thẻ → tải lại dải + hồ sơ.
 */
export function DaiChoDuyet({ studentId, homNay, onDoi, onThemPa }: {
  studentId: number; homNay: string | null; onDoi: () => void;
  /** Thẻ Xin ý kiến có nút "+ Thêm PA" như hộp Chờ duyệt (Q9 — đúng thẻ của hộp). */
  onThemPa?: (caseId: number) => void;
}) {
  const { data, reload } = useApi<{ the: TheYeuCauDto[] }>(`/yeu-cau?studentId=${studentId}`, [studentId]);
  const [mo, setMo] = useState(true);
  const ds = data?.the ?? [];
  if (!ds.length) return null;
  const quaHan = ds.filter((y) => !!y.hanDuyet && !!homNay && y.hanDuyet < homNay).length;
  return (
    <section aria-label={t('Yêu cầu chờ bạn duyệt')} className="rounded-[10px] bg-muted-bg">
      <button type="button" aria-expanded={mo} onClick={() => setMo(!mo)}
        className="flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 border-0 bg-transparent px-3 py-[9px] text-left text-[13px] text-slate-100">
        <span className="whitespace-nowrap text-[12px] font-bold  text-muted">{t('Chờ duyệt')}</span>
        <span><b className="font-semibold">{t('{n} yêu cầu chờ bạn duyệt', { n: ds.length })}</b>
          {quaHan > 0 && <span className="font-semibold text-bad"> · {t('{n} quá hạn', { n: quaHan })}</span>}</span>
        <span className="text-muted"><IconGap mo={mo} /></span>
      </button>
      {mo && (
        <div className="flex flex-col gap-2 px-2.5 pb-2.5">
          {ds.map((y) => <TheYeuCau key={y.id} yc={y} gon onXong={() => { reload(); onDoi(); }} onThemPa={onThemPa} />)}
        </div>
      )}
    </section>
  );
}
