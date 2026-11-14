import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { chuKetQuaKyThi, chuPhuHuynh, chuTamDung, chuTuanHoc, deadlineView, ngay, type DeadlineKind, type LienHe, type TheYeuCauDto } from '@shared/domain/index.ts';
import { LoiTaiNho, TargetText } from '../../ui/ui.tsx';
import { NhanLich } from '../../ui/Nhan.tsx';
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
  nguoi: { id: number | null; ten: string; vai: string | null }; cuaBan: boolean; nut: string;
  /** U02: thẻ phụ dưới tên việc (kỳ, PA) — `viecHocVien.ts`. */
  the?: { chu: string; khoa?: string; bien?: Bien }[];
  mo: { loai: 'case'; caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa' | 'them-pa' }
    | { loai: 'tab'; tab: 'y-thuc'; sub?: 'phoi-hop' } | { loai: 'duong'; href: string } | null;
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
export function DongThongTin({ tt, tvv, mon }: { tt: any; tvv?: string | null; mon?: string | null }) {
  if (!tt?.lop) return <p className="m-0 text-[13px] text-slate-400">{t('Chưa xếp lớp')}</p>;
  const target = ((tt.target !== null && tt.target !== undefined) || (tt.kck && !tt.kyThi))   // OV-9: "6.5 · KCK" · "— · KCK"; P13: KET / PET số nguyên
    && <NhanGt key="tg" n="Target" g={<span className="tabular-nums"><TargetText band={tt.target} kck={tt.kck} kyThi={tt.kyThi} /></span>} />;
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

/** Loại hạn của từng loại việc — để chữ hạn đúng đồng hồ (HE_GIAO_DIEN §4). */
const LOAI_HAN: Record<string, DeadlineKind> = {
  'nguyen-nhan': 'xac-minh-sos', 'de-ra-pa': 'lap-pa', 'xac-nhan-pa': 'xac-minh-sos', 'ghi-ket-qua': 'cap-nhat-pa',
  'cho-duyet': 'duyet', 'mini-test': 'mini-test', 'y-thuc': 'xu-ly-vi-pham', 'yt-xem': 'xu-ly-vi-pham', 'yt-thuc-hien': 'xu-ly-vi-pham', 'ban-giao': 'viec-van-hanh', 'ban-giao-mon': 'viec-van-hanh',
};

/** Hạn 12 px (Q22): "hạn hết 02/10" mờ · quá hạn: "quá hạn 3 ngày" đỏ (V22: không biểu tượng) (`chiQuaHan`: bỏ mốc, như thanh việc mockup 24 A). */
export function HanViec({ x, homNay, chiQuaHan }: { x: Viec; homNay: string | null; chiQuaHan?: boolean }) {
  if (!x.han) return null;
  const v = deadlineView({ kind: LOAI_HAN[x.loai] ?? 'viec-van-hanh', due: x.han, today: homNay ?? '' });
  if (v.quaHan) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-semibold tabular-nums text-bad" title={v.text}>
        {chiQuaHan ? v.quaHan : `${v.han} · ${v.quaHan}`}
      </span>
    );
  }
  return <span className={`whitespace-nowrap text-[12px] tabular-nums ${v.ganHan ? 'font-semibold text-soon' : 'text-slate-400'}`} title={v.text}>{v.han}{v.homNay ? ` · ${t('hôm nay')}` : ''}</span>;
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
 * với em một ô một dòng (MOCKUP-1111: cả ô là nút — tên việc · phần phụ · hạn), vạch trái theo hạn (quá hạn đỏ · còn lại xanh). Bấm = mở đúng chỗ làm
 * ngay tại trang (cột Case & PA / ngăn Case / tab Ý thức / panel). Quá 3 việc → "+n việc khác của tôi". UI-HO-SO-HV-2 (mockup M5): CHỈ việc của người xem — bỏ
 * "n việc của người khác" (TVV / CX / Admin vẫn có khối Đang xử lý). Người xem không có việc → không vẽ (T72).
 */
export function ThanhViec({ viec, homNay, onLam }: { viec: { cuaBan: Viec[]; nguoiKhac: Viec[] } | null | undefined; homNay: string | null; onLam: (x: Viec) => void }) {
  const [mo, setMo] = useState(false);
  if (!viec?.cuaBan.length) return null;
  const hien = mo ? viec.cuaBan : viec.cuaBan.slice(0, 3);
  const con = viec.cuaBan.length - 3;
  /* MOCKUP-1111 K5: "+n việc khác" mở thêm tại chỗ (việc của một em ít) — 1440 dưới nhãn, 375 cuối dải. */
  const nutCon = (lop: string) => con > 0 && <span className={lop}><NutGap mo={mo} onClick={() => setMo(!mo)}>{t('{n} việc khác của tôi', { n: con })}</NutGap></span>;
  return (
    /* MOCKUP-1111 màn 1 K5 (chủ SP duyệt 11/11): CÙNG ô việc một dòng với hồ sơ lớp — nhãn "Việc của tôi · n" + ô cao 40 px (375: hai dòng 56 px). */
    <section aria-label={t('Việc của tôi')} className="grid items-start gap-1.5 lg:grid-cols-[auto_repeat(3,minmax(0,1fr))] lg:gap-2">
      <span className="grid gap-px pr-1 text-[13px] font-medium leading-[1.3] text-slate-400 lg:row-span-full lg:pt-2.5">
        <span className="whitespace-nowrap">{t('Việc của tôi')} · <b className="tabular-nums text-slate-100">{viec.cuaBan.length}</b></span>
        {nutCon('max-lg:hidden')}
      </span>
      {hien.map((x) => <OViec key={x.key} x={x} homNay={homNay} onLam={onLam} />)}
      {nutCon('justify-self-end lg:hidden')}
    </section>
  );
}

/**
 * Một ô việc (MOCKUP-1111, cùng dáng `ThanhViecLop`): CẢ Ô là nút làm việc — tên việc = nhãn hành động (14/600, không cắt trước) · phần phụ
 * (kỹ năng, kỳ, PA — 13 mờ, cắt "…" trước) · hạn bên phải. Vạch trái 3 px: quá hạn đỏ, còn lại nhấn. Việc không mở được tại hồ sơ → ô không bấm.
 */
function OViec({ x, homNay, onLam }: { x: Viec; homNay: string | null; onLam: (x: Viec) => void }) {
  const vach = x.quaHanNgay !== null ? 'rgb(var(--bad-rgb))' : 'var(--accent)';
  const chu = chuViec(x);
  const nut = nutViec(x);
  /* Tên việc thường bắt đầu bằng nhãn nút ("Ghi kết quả PA · Reading") → tên = nhãn, phần còn lại vào phần phụ; không thì giữ cả chữ. */
  const ten = chu.startsWith(nut) ? nut : chu;
  const phu = [chu.startsWith(nut) ? chu.slice(nut.length).replace(/^[\s·]+/, '') : '', ...(x.the ?? []).map((th) => dichChu(th))].filter(Boolean).join(' · ');
  const lop = 'grid min-w-0 grid-cols-[minmax(0,1fr)_auto] content-center gap-x-2 gap-y-0.5 rounded-lg border border-l-[3px] bg-[color:var(--surface)] px-3 text-left max-lg:h-14 lg:flex lg:h-10 lg:items-center';
  const trong = (
    <>
      <span className="truncate text-sm font-semibold text-slate-100 lg:max-w-[72%] lg:shrink-0">{ten}</span>
      {x.han && <span className="col-start-2 row-start-1 shrink-0 lg:order-last lg:ml-auto"><HanViec x={x} homNay={homNay} chiQuaHan /></span>}
      {phu && <span className="col-span-2 min-w-0 truncate text-[13px] font-medium text-slate-400">{phu}</span>}
    </>
  );
  const nhan = [ten, phu].filter(Boolean).join(', ');
  return x.mo
    ? <button type="button" className={`${lop} hover:bg-[color:var(--nut-hover)]`} style={{ borderColor: 'var(--line)', borderLeftColor: vach }} title={chu} aria-label={nhan} onClick={() => onLam(x)}>{trong}</button>
    : <div className={lop} style={{ borderColor: 'var(--line)', borderLeftColor: vach }} title={chu}>{trong}</div>;
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
