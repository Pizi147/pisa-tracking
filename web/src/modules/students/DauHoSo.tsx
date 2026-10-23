import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { chuPhuHuynh, chuTamDung, deadlineView, ngay, type DeadlineKind, type LienHe, type TheYeuCauDto } from '@shared/domain/index.ts';
import { TargetText } from '../../ui/ui.tsx';
import { NhanLich } from '../../ui/Nhan.tsx';
import { NhanGt } from '../classes/DauTrangLop.tsx';
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
 * DÒNG THÔNG TIN — "em là ai" (UI-HO-SO-HV, khu c `.dau-lop`): nhãn nhỏ xám / giá trị đậm (P2) —
 *   FT          Lớp MB FT 101 · Lộ trình LT1 · Target 6.5 · Tuần học 9 · Ngày thi (Dự kiến 02/2027 | Thi 21/11 | Chưa có lịch) · GVCN · TVV
 *   lớp thường  Lớp MB FOU 15 · Chương trình FOU · Tuần học 7/10 · Cuối khoá W4 OCT · Target 5.5 · thi IELTS 06/2027 · GVCN · TVV
 */
export function DongThongTin({ tt, tvv }: { tt: any; tvv?: string | null }) {
  if (!tt?.lop) return <p className="m-0 text-[13px] text-slate-400">{t('Chưa xếp lớp')}</p>;
  const target = ((tt.target !== null && tt.target !== undefined) || tt.kck)   // OV-9: "6.5 · KCK" · "— · KCK"
    && <NhanGt key="tg" n="Target" g={<span className="tabular-nums"><TargetText band={tt.target} kck={tt.kck} /></span>} />;
  const thi = tt.thiDuKien
    ? <NhanGt key="thi" n={tt.lopThuong ? dich(tt.thiDuKien.nhan) : t('Ngày thi')} g={<span className="tabular-nums">{tt.lopThuong ? tt.thiDuKien.gt : `${dich(tt.thiDuKien.nhan)} ${tt.thiDuKien.gt}`.trim()}</span>} />
    : !tt.lopThuong && <NhanGt key="thi" n={t('Ngày thi')} g={<NhanLich loai="chua">{t('Chưa có lịch')}</NhanLich>} />;
  const muc: ReactNode[] = [
    <NhanGt key="lop" n={t('Lớp')} g={tt.lopId ? <Link to={`/hoc-vien/lop/${tt.lopId}`} className="text-slate-100 no-underline hover:underline">{tt.lop}</Link> : tt.lop} />,
    tt.loTrinh && <NhanGt key="lt" n={tt.lopThuong ? t('Chương trình') : t('Lộ trình')} g={dich(tt.loTrinh)} />,
    !tt.lopThuong && target,
    tt.tuanHoc && <NhanGt key="tuan" n={t('Tuần học')} g={<span className="tabular-nums">{[tt.tuanHoc.tuan === null ? null : tt.tuanHoc.tong ? `${tt.tuanHoc.tuan}/${tt.tuanHoc.tong}` : String(tt.tuanHoc.tuan), tt.tuanHoc.dangDung ? t('đang dừng') : null].filter(Boolean).join(' · ')}</span>} />,
    thi,
    tt.lopThuong && target,
    tt.thiIelts && <NhanGt key="ielts" n={t('Thi IELTS dự kiến')} g={<span className="tabular-nums">{tt.thiIelts}</span>} />,
    tt.gvcn && <NhanGt key="gv" n={t('GVCN')} g={tt.gvcn} />,
    tvv && <NhanGt key="tvv" n={t('TVV')} g={tvv} />,
  ].filter(Boolean);
  return <div className="flex flex-wrap items-start gap-x-[22px] gap-y-2.5">{muc}</div>;
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
 * THANH "VIỆC CẦN LÀM" (UI-HO-SO-HV, `ho-so-hv.html` `.thanh-viec` + ô việc của Hồ sơ lớp khu b) — CHỖ DUY NHẤT trên hồ sơ có việc: mỗi việc CỦA NGƯỜI XEM
 * với em một ô (tên việc · hạn `dd/mm` · nút động từ), vạch trái theo hạn (quá hạn đỏ · còn lại xanh), việc gấp nhất là nút chính. Bấm = mở đúng chỗ làm
 * ngay tại trang (ngăn Case / tab Ý thức / panel). Quá 3 việc → "+n việc khác của tôi"; việc của người khác gập. Người xem không có việc → không vẽ (T72).
 */
export function ThanhViec({ viec, homNay, onLam }: { viec: { cuaBan: Viec[]; nguoiKhac: Viec[] } | null | undefined; homNay: string | null; onLam: (x: Viec) => void }) {
  const [mo, setMo] = useState<'ban' | 'khac' | null>(null);
  if (!viec?.cuaBan.length) return null;
  const hien = mo === 'ban' ? viec.cuaBan : viec.cuaBan.slice(0, 3);
  const con = viec.cuaBan.length - 3;
  return (
    <section aria-label={t('Việc cần làm')} className="flex flex-col gap-1.5">
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {hien.map((x, i) => <OViec key={x.key} x={x} chinh={i === 0} homNay={homNay} onLam={onLam} />)}
      </div>
      {(con > 0 || viec.nguoiKhac.length > 0) && (
        <div className="flex flex-wrap items-center justify-end gap-x-3.5">
          {con > 0 && <NutGap mo={mo === 'ban'} onClick={() => setMo(mo === 'ban' ? null : 'ban')}>{t('{n} việc khác của tôi', { n: con })}</NutGap>}
          {viec.nguoiKhac.length > 0 && (
            <NutGap mo={mo === 'khac'} onClick={() => setMo(mo === 'khac' ? null : 'khac')}>{t('{n} việc của người khác', { n: viec.nguoiKhac.length })}</NutGap>
          )}
        </div>
      )}
      {mo === 'khac' && (
        <ul className="m-0 flex list-none flex-col gap-1.5 px-3 pb-0.5">
          {viec.nguoiKhac.map((x) => (
            <li key={x.key} className="grid grid-cols-1 items-baseline gap-x-3 gap-y-0.5 text-[13px] sm:grid-cols-[minmax(0,1fr)_auto]">
              <span className="text-slate-200">{chuViec(x)}<span className="text-[12px] text-slate-400"> · {tenNguoi(x)}{x.nguoi.vai ? `, ${vaiViec(x)}` : ''}</span></span>
              <span className="sm:text-right"><HanViec x={x} homNay={homNay} /></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Một ô việc (cùng dáng `OViec` của Hồ sơ lớp): tên đậm · hạn · nút bên phải. */
function OViec({ x, chinh, homNay, onLam }: { x: Viec; chinh: boolean; homNay: string | null; onLam: (x: Viec) => void }) {
  const vach = x.quaHanNgay !== null ? 'rgb(var(--bad-rgb))' : 'var(--accent)';
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 rounded-[10px] border border-l-4 bg-[color:var(--surface)] px-3 py-2.5"
      style={{ borderColor: 'var(--line)', borderLeftColor: vach }}>
      <span className="min-w-0 truncate text-[14px] text-slate-100" title={chuViec(x)}><ChuViec chu={chuViec(x)} /></span>
      {x.mo
        ? <button type="button" className={`btn btn-sm row-span-2 max-sm:min-h-[44px] ${chinh ? 'btn-primary' : ''}`} onClick={() => onLam(x)}>{nutViec(x)}</button>
        : <span className="row-span-2" />}
      <span className="min-w-0 text-[13px] text-slate-400">{x.han ? <HanViec x={x} homNay={homNay} /> : t('không hạn')}</span>
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
