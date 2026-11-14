import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LOAI_HAN_CUA_VIEC, bacNgan, chuKetQuaKyThi, chuPhuHuynh, chuTamDung, chuTuanHoc, ngay, type LienHe, type TheYeuCauDto } from '@shared/domain/index.ts';
import { IconNhom, ThePhu, thePhu } from '../congViec/DanhSachViec.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { LoiTaiNho, TargetText } from '../../ui/ui.tsx';
import { ChipHan, NhanLich } from '../../ui/Nhan.tsx';
import { NhanGt } from '../classes/DauTrangLop.tsx';
import { useApi } from '../../lib/useApi.ts';
import { TheYeuCau } from '../duyet/TheYeuCau.tsx';
import { IconGap, IconTamDung } from '../../ui/BieuTuong.tsx';
import { dich, dichChu, t, type Bien } from '@shared/i18n/index.ts';

/**
 * ĐẦU HỒ SƠ HỌC VIÊN "hiểu trong 30 giây" (PR-VAI-b, mockup 24) — máy chủ dựng mọi chữ (`dauHoSo`), web chỉ vẽ.
 *   1 · dòng thông tin (em là ai) · 2 · câu tóm tắt (em đang thế nào) · 3 · bốn ô · 4 · thanh việc của NGƯỜI XEM.
 */

/** Việc của em theo người — cùng kiểu `ViecHocVien` ở `server/src/students/viecHocVien.ts`. */
export type Viec = {
  key: string; loai: string; chu: string; khoa?: string; bien?: Bien; kyNang: string | null; caseId: number | null; paId: number | null;
  han: string | null; quaHanNgay: number | null; tone: 'danger' | 'warn' | 'info' | 'wait';
  /** GD-7a (V22): độ gấp của hạn — màu viên hạn. */
  gap: 'qua-han' | 'gan' | 'chua' | null;
  nguoi: { id: number | null; ten: string; vai: string | null }; cuaBan: boolean; nut: string;
  /** U02: thẻ phụ dưới tên việc (kỳ, PA) — `viecHocVien.ts`. */
  the?: { chu: string; khoa?: string; bien?: Bien }[];
  mo: { loai: 'case'; caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa' | 'them-pa' }
    | { loai: 'tab'; tab: 'y-thuc'; sub?: 'phoi-hop' }
    | { loai: 'nhap-diem'; classId: number; luot: string; kns: string[]; tuanThi: string | null; periodId: number | null; kind: string | null; soBai: number | null }
    | { loai: 'tinh-hinh'; viecId: number; cauHoi: string }
    | { loai: 'duong'; href: string } | null;
};

/** PR-EN-c: chữ máy chủ dựng — có khoá thì dịch theo khoá, không thì theo chính chữ. */
/* EN-SOT: biến chữ máy chủ ghép sẵn ("đến MT2 · Listening", "OVR 7.0 · Đạt Target") dịch theo mẫu như `dich`; tên / mã giữ nguyên. */
const chuViec = (x: Viec) => dichChu(x.bien ? { ...x, bien: Object.fromEntries(Object.entries(x.bien).map(([k, v]) => [k, typeof v === 'string' ? dich(v) : v])) } : x);
const nutViec = (x: Viec) => dich(x.nut);

/**
 * DÒNG THÔNG TIN — "em là ai" (UI-HO-SO-HV, khu c `.dau-lop`): nhãn nhỏ xám / giá trị đậm (P2) —
 *   FT          Lớp MB FT 101 · Lộ trình LT1 · Target 6.5 · Tuần học 9 · Ngày thi (Dự kiến 02/2027 | Thi 21/11 | Chưa có lịch) · GVCN · TVV
 *   lớp thường  Lớp MB FOU 15 · Chương trình FOU · Tuần học 7/10 · Cuối khoá W4 OCT · Target 5.5 · thi IELTS 06/2027 · GVCN · TVV
 */
/** P8 (mockup k7): `mon` = "L · R · W2 · S" — chỉ khi em không học đủ 5 môn (null = đủ, không hiện). */
export function DongThongTin({ tt, tvv, mon, deXuatTarget }: { tt: any; tvv?: string | null; mon?: string | null;
  /** GD-7 (③ K5, R3.6 · L6 / 2.3): GV lớp, em chưa có Target — ô Target "Chưa có" màu nhắc + "Đề xuất sửa" tại chỗ (không thành việc). */
  deXuatTarget?: () => void }) {
  if (!tt?.lop) return <p className="m-0 text-[13px] text-slate-400">{t('Chưa xếp lớp')}</p>;
  const target = ((tt.target !== null && tt.target !== undefined) || (tt.kck && !tt.kyThi))   // OV-9: "6.5 · KCK" · "— · KCK"; P13: KET / PET số nguyên
    ? <NhanGt key="tg" n="Target" g={<span className="tabular-nums"><TargetText band={tt.target} kck={tt.kck} kyThi={tt.kyThi} /></span>} />
    : deXuatTarget && <NhanGt key="tg" n="Target" g={<span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className="font-semibold text-soon">{t('Chưa có')}</span>
      <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" onClick={deXuatTarget}>{t('Đề xuất sửa')}</button>
    </span>} />;
  /* P13 KET-PET: kết quả thi thật "159 · Grade B · B1" (máy tính khi hiện) — chưa đủ 4 điểm thì không hiện. */
  const thiThat = tt.kyThi && tt.thiThat
    && <NhanGt key="tt" n={t('Thi thật {ten}', { ten: tt.kyThi.ten })} g={<span className="tabular-nums">{chuKetQuaKyThi(tt.thiThat)}{tt.thiThat.dat != null && ` · ${tt.thiThat.dat ? t('Đạt Target') : t('Chưa đạt Target')}`}</span>} />;
  const thi = tt.thiDuKien
    ? <NhanGt key="thi" n={tt.lopThuong ? dich(tt.thiDuKien.nhan) : t('Thi thật')} g={<span className="tabular-nums">{tt.lopThuong ? tt.thiDuKien.gt : `${dich(tt.thiDuKien.nhan) === t('Dự kiến thi') ? t('Dự kiến') : dich(tt.thiDuKien.nhan)} ${tt.thiDuKien.gt}`.trim()}</span>} />
    : !tt.lopThuong && <NhanGt key="thi" n={t('Thi thật')} g={<NhanLich loai="chua">{t('Chưa có lịch')}</NhanLich>} />;
  const muc: ReactNode[] = [
    <NhanGt key="lop" n={t('Lớp')} g={tt.lopId ? <Link to={`/hoc-vien/lop/${tt.lopId}`} className="text-slate-100 no-underline hover:underline">{tt.lop}</Link> : tt.lop} />,
    tt.loTrinh && <NhanGt key="lt" n={tt.lopThuong ? t('Chương trình') : t('Lộ trình')} g={dich(tt.loTrinh)} />,
    !tt.lopThuong && target,
    !tt.lopThuong && mon && <NhanGt key="mon" n={t('Môn học')} g={mon} />,
    /* U02 dòng 1: nhãn "Tuần học", giá trị chỉ số (mockup `.fact`) — "đang dừng" giữ sau số. */
    tt.tuanHoc && <NhanGt key="tuan" n={t('Tuần học')} g={<span className="tabular-nums">{tt.tuanHoc.tuan === null ? chuTuanHoc(null, null, tt.tuanHoc.dangDung)
      : [tt.tuanHoc.tong ? `${tt.tuanHoc.tuan}/${tt.tuanHoc.tong}` : String(tt.tuanHoc.tuan), tt.tuanHoc.dangDung ? t('đang dừng') : null].filter(Boolean).join(' · ')}</span>} />,
    thi,
    tt.lopThuong && target,
    thiThat,
    tt.thiIelts && <NhanGt key="ielts" n={t('Thi IELTS dự kiến')} g={<span className="tabular-nums">{tt.thiIelts}</span>} />,
    tt.gvcn && <NhanGt key="gv" n={t('GVCN')} g={tt.gvcn} />,
    tvv && <NhanGt key="tvv" n={t('TVV')} g={tvv} />,
  ].filter(Boolean);
  /* U02 dòng 1 (mockup `.facts`): ô nhãn trên – giá trị dưới, vạch dọc ngăn ô. */
  return <div className="o-tin items-start">{muc}</div>;
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
  /* U02 dòng 1 (mockup `.lien-he`): liên hệ tách khỏi học thuật — mỗi mục một thẻ nhỏ mờ; chưa có PH ghi "PH: chưa có". */
  const muc: ReactNode[] = [
    l?.phone && <>{t('Em')} <So sdt={l.phone} /></>,
    (ph || l?.parentPhone) ? <>{t('PH')}{ph ? `: ${ph}` : ''}{l?.parentPhone && <>{ph ? ' · ' : ' '}<So sdt={l.parentPhone} /></>}</> : <>{t('PH: chưa có')}</>,
    email && <span className="truncate">{email}</span>,
    dob && <>{t('Sinh')} <span className="tabular-nums">{ngay(dob)}</span></>,
    tvv && <>{t('TVV')} {tvv}</>,
  ].filter(Boolean);
  return (
    <ul aria-label={t('Liên hệ')} className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
      {muc.map((m, i) => <li key={i} className="the-phu nhat min-w-0">{m}</li>)}
    </ul>
  );
}

/** Viên hạn (V22, ⑤ B1 `.han-v`): CÙNG `ChipHan vien` với dòng Công việc — đỏ quá hạn · vàng gần tới · xám chưa tới, chỉ màu. Không hạn → trống (trình đọc màn nghe). */
function HanGap({ x }: { x: Viec }) {
  if (!x.han) return <span className="sr-only">{t('không hạn')}</span>;
  return <ChipHan vien loai={LOAI_HAN_CUA_VIEC[NHOM_PANEL[x.loai] ?? ''] ?? 'viec-van-hanh'} han={x.han} />;
}

/* ③ K1 `.vl-luoi .viec.dt-lop`: [ô vuông 28 | tên + thẻ phụ | hạn 150 | nút 118] từ 640 px; 375 [ô | tên + thẻ phụ, hạn dưới | ›] — chạm cả dòng. */
const DONG_VIEC = 'grid min-h-[56px] grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-2 text-left sm:grid-cols-[28px_minmax(0,1fr)_150px_118px] sm:px-4 sm:py-1.5';

/**
 * THANH "VIỆC CẦN LÀM" (GD-7, mockup ③ K1 `.vl-hs` + ⑤ B — dòng việc chuẩn, lời 24): MỘT thẻ nhóm — dải "Việc cần làm · n việc · n quá hạn" rồi ĐỦ việc của
 * NGƯỜI XEM với em (máy chủ `viecHocVien.ts`: Case, Ý thức, Nhập điểm, Trả lời tình hình…), quá hạn lên đầu. Dòng: ô vuông · tên việc ngắn · thẻ phụ
 * (kỹ năng → kỳ / tuần → số) · viên hạn · nút động từ; lớp + tên em đã ở đầu hồ sơ nên không lặp ([XM-1]). ≥ 1024 hai cột dòng; 375 một cột.
 * Bấm dòng = panel việc tại chỗ (nơi gọi — `onLam`). Người xem không có việc → không vẽ (T72).
 */
export function ThanhViec({ viec, onLam, dangMo }: {
  viec: { cuaBan: Viec[]; nguoiKhac: Viec[] } | null | undefined; onLam: (x: Viec) => void;
  /** Khoá việc đang mở trong panel — dòng tô nhấn. */
  dangMo?: string | null;
}) {
  const ds = viec?.cuaBan ?? [];
  if (!ds.length) return null;
  const quaHan = ds.filter((x) => x.gap === 'qua-han').length;
  return (
    <section aria-label={t('Việc cần làm')} className="card overflow-clip p-0">
      <h2 className="m-0 flex min-h-[44px] items-center gap-2 border-b border-l-[3px] pl-[13px] pr-2 text-[15px] font-bold leading-snug"
        style={{ background: 'var(--surface-2)', borderBottomColor: 'var(--line)', borderLeftColor: 'var(--accent)' }}>
        <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4 shrink-0 fill-none stroke-current text-[color:var(--accent)]" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 4l1.5 1.5L7 3M3 9l1.5 1.5L7 8M9 4.5h4M9 9.5h4M3 13h10" /></svg>
        <span className="text-[color:var(--text)]">{t('Việc cần làm')}</span>
        <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center whitespace-nowrap rounded border px-[7px] text-xs font-semibold tabular-nums text-[color:var(--text)]"
          style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>{ds.length}<span className="max-sm:sr-only">&nbsp;{t('việc')}</span></span>
        {quaHan > 0 && <span className="whitespace-nowrap text-[13px] font-bold tabular-nums text-late">{quaHan}<span className="max-sm:sr-only"> {t('quá hạn')}</span></span>}
      </h2>
      <ul className="m-0 grid list-none p-0 lg:grid-cols-2">
        {ds.map((x, i) => (
          <li key={x.key} className={`min-w-0 ${i > 0 ? 'border-t' : ''} ${i === 1 ? 'lg:border-t-0' : ''} ${i % 2 === 1 ? 'lg:border-l' : ''}`} style={{ borderColor: 'var(--line)' }}>
            <DongViecHs x={x} onLam={onLam} dangMo={dangMo === x.key} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Một dòng việc: cả dòng bấm được (nút động từ bên phải cùng việc); việc không mở được tại hồ sơ → dòng chữ, không nút. */
function DongViecHs({ x, onLam, dangMo }: { x: Viec; onLam: (x: Viec) => void; dangMo: boolean }) {
  const chu = chuViec(x);
  const nut = nutViec(x).replace(/ ›$/, '');
  /* Tên việc thường bắt đầu bằng nhãn nút ("Ghi kết quả PA · Reading") → tên = nhãn, phần sau thành thẻ phụ; không thì đoạn đầu của chữ. */
  const ten = chu.startsWith(nut) ? nut : chu.split(' · ')[0];
  /* GD-4d (lời 35, ⑤ H5): tên bậc trong thẻ phụ VIẾT HOA, dạng tắt ("REPORT 2", "WL 1"). */
  const the = thePhu([chu.slice(ten.length).replace(/^[\s·]+/, ''), ...(x.the ?? []).map((th) => dichChu(th))]).map(bacNgan);
  const bam = x.mo ? () => onLam(x) : undefined;
  return (
    <div data-hd="hs-viec" data-khoa={x.key} onClick={bam} title={chu}
      className={`${DONG_VIEC} ${bam ? 'cursor-pointer hover:bg-[color:var(--accent-soft)]' : ''} ${dangMo ? 'bg-[color:var(--accent-soft)] shadow-[inset_3px_0_0_var(--accent)]' : ''}`}>
      <span aria-hidden className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent)] max-sm:self-start"><IconNhom k="ca-lop" /></span>
      <span className="grid min-w-0 gap-px">
        {bam
          ? <button type="button" aria-label={[ten, ...the].join(', ')} aria-expanded={dangMo} onClick={(e) => { e.stopPropagation(); bam(); }}
              className="min-w-0 appearance-none border-0 bg-transparent p-0 text-left text-[15px] font-semibold leading-snug text-[color:var(--text)]">{ten}</button>
          : <span className="text-[15px] font-semibold leading-snug text-[color:var(--text)]">{ten}</span>}
        <ThePhu ds={the} />
        <span className="mt-0.5 sm:hidden"><HanGap x={x} /></span>
      </span>
      <span className="max-sm:hidden"><HanGap x={x} /></span>
      {bam ? <>
        <span className="flex max-sm:hidden"><button type="button" tabIndex={-1} aria-hidden className="btn btn-sm h-[30px] min-h-[30px] w-full justify-center whitespace-nowrap px-2.5 text-[13px] font-semibold"
          onClick={(e) => { e.stopPropagation(); bam(); }}>{nut}</button></span>
        <span aria-hidden className="text-[15px] text-faint sm:hidden">›</span>
      </> : <span />}
    </div>
  );
}

/** Loại việc hồ sơ → nhóm việc của Công việc (`PanelViec` mở đúng panel theo `group`). Không có ở đây → mở như cũ (tab / trang). */
const NHOM_PANEL: Partial<Record<string, string>> = {
  'de-ra-pa': 'no_plan', 'xac-nhan-pa': 'xac_nhan_pa', 'ghi-ket-qua': 'ghi_ket_qua_pa', 'mini-test': 'mini_test',
  'y-thuc': 'yt_xu_ly', 'yt-xem': 'yt_xem', 'yt-thuc-hien': 'yt_thuc_hien', 'nhap-diem': 'score', 'tinh-hinh': 'yt_hoi_tinh_hinh',
  'buoc-tiep': 'buoc_tiep', 'thi-that': 'thi_that',
};

/**
 * GD-7 (③ R3.2, [XM-3]): việc của thanh "Việc cần làm" → `WorkItem` cho CÙNG panel việc của Công việc (`PanelViec`) — khoá việc trùng khoá `myWork` (Q2),
 * nên panel đọc / ghi đúng đường cũ, không đường mới. `null` = việc mở chỗ khác (Báo PH → tab Phối hợp, Bàn giao → trang lớp).
 */
export function viecSangPanel(x: Viec, em: { id: number; ten: string; lopId: number | null; lop: string | null }): WorkItem | null {
  const m = x.mo;
  const group = x.loai === 'nguyen-nhan' ? (x.key.startsWith('cause:') ? 'cause' : 'ghi_nhan_xet') : NHOM_PANEL[x.loai];
  if (!m || !group) return null;
  const nd = m.loai === 'nhap-diem' ? m : null;
  return {
    key: x.key, group, urgency: x.gap === 'qua-han' ? 'overdue' : x.han && x.gap === 'gan' ? 'today' : 'normal',
    studentId: em.id, studentName: em.ten, classId: nd?.classId ?? em.lopId, classCode: em.lop,
    attemptId: null, attemptNo: null, caseId: x.caseId, paId: x.paId, level: null,
    reason: m.loai === 'tinh-hinh' ? m.cauHoi : chuViec(x), actionLabel: x.nut, href: m.loai === 'duong' ? m.href : '',
    tieuDe: chuViec(x), ownerId: x.nguoi.id, owner: x.nguoi.ten, mine: x.cuaBan, due: x.han, statusLabel: '',
    contextLabel: null, count: null,
    ...(nd ? { luot: nd.luot, kn: nd.kns[0], kns: nd.kns, tuanThi: nd.tuanThi, periodId: nd.periodId, kind: nd.kind, soBai: nd.soBai ?? undefined, emIds: [em.id] } : {}),
    ...(m.loai === 'tinh-hinh' ? { viecId: m.viecId } : {}),
  };
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
  const { data, error, reload } = useApi<{ the: TheYeuCauDto[] }>(`/yeu-cau?studentId=${studentId}`, [studentId]);
  const [mo, setMo] = useState(true);
  const ds = data?.the ?? [];
  if (error) return <LoiTaiNho chu={t('Không tải được yêu cầu chờ duyệt.')} onRetry={reload} className="rounded-[10px] bg-muted-bg px-3 py-[9px]" />;
  if (!ds.length) return null;
  const quaHan = ds.filter((y) => !!y.hanDuyet && !!homNay && y.hanDuyet < homNay).length;
  return (
    <section aria-label={t('Yêu cầu chờ bạn duyệt')} className="rounded-[10px] bg-muted-bg">
      <button type="button" aria-expanded={mo} onClick={() => setMo(!mo)}
        className="flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 border-0 bg-transparent px-3 py-[9px] text-left text-[13px] text-slate-100">
        {/* CD-GON (M3, M5): "Chờ duyệt" + "n yêu cầu chờ bạn duyệt" nói hai lần → một tên "Chờ bạn duyệt" (như Công việc) + số + số quá hạn đỏ. */}
        <span className="whitespace-nowrap text-[13px] font-semibold text-slate-100">{t('Chờ bạn duyệt')}</span>
        <span className="text-dim">{t('{n} yêu cầu', { n: ds.length })}
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
