import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Level } from '../../ui/ui.tsx';
import { Nhan, QuaHan } from '../../ui/Nhan.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { TheDong } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { skillShort, sosTone } from '../../lib/format.ts';
import { OPhuHuynh } from './HocVienTheoVai.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import {
  NHAN_NHOM_XU_LY, deadlineView, tuanLich, type DeadlineKind, type LienHe, type NguCanhDs, type NhomXuLy,
} from '@shared/domain/index.ts';

/** `GET /hoc-vien-lop?goc=sos` (server/src/classes/hocVienSos.ts → CaseTomTat / DongSos / TrangSos). */
export type CaseTomTat = {
  id: number; topic: string | null; kyNang: string | null; nguyenNhan: string | null; nhanXet: string | null;
  pa: { id: number; ten: string; nguoi: string | null; choXacNhan: boolean; xong: boolean }[];
  ketQua: string | null; ketQuaNgay: string | null; nhom: NhomXuLy; trangThai: string;
  viecTiep: { chu: string; han: string | null; loaiHan: DeadlineKind | null; quaHan: boolean } | null;
  attemptId: number | null; attemptNo: number | null; done: boolean;
};
export type DongSos = {
  attemptId: number; studentId: number; ten: string; ma: string; classId: number; classCode: string; branchName: string | null; ft: boolean;
  luot: string; tuan: string; sosLevel: number; kyNang: string[]; cases: CaseTomTat[]; tvv: string | null; lienHe: LienHe;
};
export type TrangSos = { tuan: string | null; toanBo: boolean; tuanGanNhat: string; tu: string; den: string; tuanCo: string[]; rows: DongSos[] };

/** Cột theo vai (mockup 3 v2 §10): QL / GV đủ cột · TVV chỉ đọc + Phụ huynh · CX như TVV + TVV, đầu nhóm ghi chi nhánh. */
export type CotSos = 'ql' | 'tvv' | 'cx';

/** Tên cột theo tiếng của trang (khoá cột giữ chữ Việt để tra độ rộng). */
const NHAN_COT: Record<string, string> = {
  'Học viên': t('Học viên'), 'MT · tuần': t('MT · tuần'), 'Nguyên nhân': t('Nguyên nhân'), 'Phương án': t('Phương án'), 'Kết quả đến nay': t('Kết quả đến nay'),
  'Trạng thái': t('Trạng thái'), 'Việc tiếp': t('Việc tiếp'), 'Phụ huynh': t('Phụ huynh'),
};
const TONE_NHOM: Record<NhomXuLy, 'wait' | 'doing' | 'done'> = { 'cho-duyet': 'wait', 'dang-xu-ly': 'doing', xong: 'done' };
const THU_NHOM: Record<NhomXuLy, number> = { 'cho-duyet': 0, 'dang-xu-ly': 1, xong: 2 };
/** Trạng thái của dòng = nhóm "gấp" nhất trong các Case của lượt (Chờ duyệt → Đang xử lý → Xong); chưa có Case thì Chờ duyệt. */
export const nhomDong = (r: DongSos): NhomXuLy => r.cases.reduce<NhomXuLy>((m, c) => (THU_NHOM[c.nhom] < THU_NHOM[m] ? c.nhom : m), r.cases.length ? 'xong' : 'cho-duyet');

/** Một dòng "kỹ năng · chữ" cho mỗi Case; kỹ năng người xem dạy đậm, còn lại mờ (GVBM — mockup 3 v2 §5). */
function TheoCase({ r, dam, chu }: { r: DongSos; dam: ((topic: string | null) => boolean) | null; chu: (c: CaseTomTat) => ReactNode }) {
  if (!r.cases.length) return <span className="text-slate-600">—</span>;
  return (
    <span className="flex flex-col gap-0.5">
      {r.cases.map((c) => {
        const mo = dam && !dam(c.topic);
        const x = chu(c);
        return (
          <span key={c.id} className={`flex min-w-0 items-baseline gap-1.5 ${c.done ? 'opacity-60' : ''}`}>
            <span className={`shrink-0 text-[11.5px] font-bold ${mo ? 'text-slate-500' : 'text-slate-200'}`}>{c.topic ? skillShort(c.topic) : 'Case'}</span>
            {/* OV-14b: chữ dài cắt — rê chuột đọc đủ (mẫu truncate + title, G4). */}
            <span className={`min-w-0 truncate text-xs ${mo ? 'text-slate-500' : 'text-slate-300'}`} title={typeof x === 'string' ? x : undefined}>{x}</span>
          </span>
        );
      })}
    </span>
  );
}

/** Việc tiếp của dòng: việc gấp nhất (quá hạn trước) + "+n việc". */
function ViecTiepDong({ r }: { r: DongSos }) {
  const { homNay } = useNgayNghiepVu();
  const ds = r.cases.filter((c) => c.viecTiep).sort((a, b) => Number(b.viecTiep!.quaHan) - Number(a.viecTiep!.quaHan) || (a.viecTiep!.han ?? '9').localeCompare(b.viecTiep!.han ?? '9'));
  if (!ds.length) return <span className="text-slate-600">—</span>;
  const v = ds[0].viecTiep!;
  const d = v.han ? deadlineView({ kind: v.loaiHan ?? 'xac-minh-sos', due: v.han, today: homNay }) : null;
  return (
    <span className="block text-xs">
      <span className="block truncate text-slate-200" title={dich(v.chu)}>{dich(v.chu)}</span>
      <span className="block text-slate-500">
        {v.quaHan && d ? <QuaHan ngay={d.daysOverdue} /> : d ? d.han : null}
        {ds.length > 1 && <span>{d ? ' · ' : ''}{t('+{n} việc', { n: ds.length - 1 })}</span>}
      </span>
    </span>
  );
}

function OSos({ r, toanBo }: { r: DongSos; toanBo: boolean }) {
  const { homNay } = useNgayNghiepVu();
  return (
    <>
      <span className="flex flex-wrap items-center gap-1.5">
        <Level tone={sosTone(r.sosLevel)}>SOS {r.sosLevel}</Level>
        <span className="text-xs font-semibold text-slate-200">{r.kyNang.map((k) => skillShort(k)).join(', ')}</span>
      </span>
      {!toanBo && <span className="block text-xs text-slate-500">{r.ft ? `${r.luot} · ${tuanLich(r.tuan, homNay)}` : `Progress · ${tuanLich(r.tuan, homNay)}`}</span>}
    </>
  );
}

/** Case chưa có nguyên nhân: Case MT cũ chưa nhận xét → "Chờ ghi nhận xét" (máy chủ: `trangThaiCaseV4`), còn lại (Progress) "chưa xác nhận". */
export const chuChuaNguyenNhan = (c: CaseTomTat, dai = false) =>
  c.trangThai === 'Chờ ghi nhận xét' ? t('Chờ ghi nhận xét') : dai ? t('chưa xác nhận nguyên nhân') : t('chưa xác nhận');
const chuNguyenNhan = (c: CaseTomTat) => (c.nguyenNhan && dich(c.nguyenNhan)) ?? <span className="text-slate-500">{chuChuaNguyenNhan(c)}</span>;
const chuPa = (c: CaseTomTat) => (c.pa.length
  ? `${dich(c.pa[0].ten)}${c.pa[0].nguoi ? ` · ${c.pa[0].nguoi}` : ''}${c.pa.length > 1 ? ` +${c.pa.length - 1} PA` : ''}`
  : <span className="text-slate-500">{t('Chưa có PA')}</span>);
const chuKetQua = (c: CaseTomTat) => (c.done && c.ketQua ? `${t('Xong')} · ${dich(c.ketQua)}` : (c.ketQua && dich(c.ketQua)) ?? <span className="text-slate-500">{c.done ? t('Xong') : t('Chưa có kết quả')}</span>);

/**
 * GÓC "ĐANG SOS" (OV-12f, mockup 3 v2 §3 / §5 / §7 / §8): nhóm theo lớp (Fast Track trước, lớp thường sau), mỗi lượt SOS một dòng — Toàn bộ thêm cột
 * MT · tuần. Cột: Học viên · SOS · Nguyên nhân · Phương án (QL / GV) · Kết quả đến nay · Trạng thái (chữ Tổng hợp) · Việc tiếp (QL / GV) · Phụ huynh
 * (TVV / CX) · TVV (CX) · Mở (panel một em). Không Nhắc. < 640 px: mỗi em một thẻ.
 */
export function BangSos({ data, cot, dam, dienThoai, ds, onMo, dangMo = null }: {
  data: TrangSos; cot: CotSos; dienThoai: boolean;
  /** OV-14b: em đang mở panel — hàng / thẻ tô `row-active` như các bảng khác. */
  dangMo?: number | null;
  /** GVBM / GVCN: kỹ năng mình dạy đậm, còn lại mờ (null = không làm mờ). */
  dam: ((topic: string | null) => boolean) | null;
  ds: NguCanhDs; onMo: (r: DongSos) => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const [gap, setGap] = useState<Set<number>>(new Set());
  const toanBo = data.toanBo;
  const nhom = (['ft', 'thuong'] as const).map((k) => {
    const lop = new Map<number, DongSos[]>();
    for (const r of data.rows.filter((x) => x.ft === (k === 'ft'))) lop.set(r.classId, [...(lop.get(r.classId) ?? []), r]);
    return { k, lop: [...lop.values()].sort((a, b) => a[0].classCode.localeCompare(b[0].classCode, 'vi')) };
  }).filter((g) => g.lop.length);
  /* Tự mở ≤ 5 lớp (mockup 3 v2 §1); nhiều hơn thì gập sẵn, bấm đầu nhóm để mở. */
  const soLop = nhom.reduce((s, g) => s + g.lop.length, 0);
  const mo = (id: number) => (soLop <= 5 || data.rows.length <= 40) !== gap.has(id);
  const doi = (id: number) => setGap((cu) => { const s = new Set(cu); if (s.has(id)) s.delete(id); else s.add(id); return s; });

  const dauLop = (em: DongSos[]) => {
    const r = em[0];
    const soEm = new Set(em.map((x) => x.studentId)).size;
    const cho = em.filter((x) => nhomDong(x) === 'cho-duyet').length;
    const tre = em.filter((x) => x.cases.some((c) => c.viecTiep?.quaHan)).length;
    return (
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
        <Link to={`/hoc-vien/lop/${r.classId}`} className="shrink-0 font-extrabold text-slate-100 underline decoration-dotted underline-offset-4">{r.classCode}</Link>
        {cot === 'cx' && r.branchName && <span className="text-xs text-slate-400">{r.branchName}</span>}
        <Nhan tone="muted">{toanBo ? t('{n} em · {m} lượt SOS', { n: soEm, m: em.length }) : t('{n} em SOS', { n: soEm })}</Nhan>
        {cot === 'ql' && cho > 0 && <Nhan tone="wait">{t('{n} chờ duyệt', { n: cho })}</Nhan>}
        {cot === 'ql' && tre > 0 && <Nhan tone="late">⚠ {t('{n} quá hạn', { n: tre })}</Nhan>}
      </span>
    );
  };
  const nutMo = (r: DongSos) => (
    <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" aria-label={t('Mở {ten}', { ten: r.ten })} onClick={() => onMo(r)}>{t('Mở')}</button>
  );
  const tenEm = (r: DongSos, lap: boolean) => (
    <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
      <Link className={`link max-w-full truncate font-semibold ${lap ? 'opacity-60' : ''}`} title={r.ten} to={`/hoc-vien/${r.studentId}`} state={{ ds }}>{r.ten}</Link>
    </span>
  );
  const trangThai = (r: DongSos) => { const n = nhomDong(r); return <Nhan tone={TONE_NHOM[n]}>{t(NHAN_NHOM_XU_LY[n])}</Nhan>; };
  const ketQua = (r: DongSos) => <TheoCase r={r} dam={dam} chu={chuKetQua} />;

  if (dienThoai) {
    return (
      <div className="space-y-2">
        {nhom.map((g) => (
          <section key={g.k} className="space-y-2" aria-label={g.k === 'ft' ? t('Lớp Fast Track') : t('Lớp thường')}>
            {nhom.length > 1 && <h2 className="m-0 px-1 text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">{g.k === 'ft' ? 'Fast Track' : t('Lớp thường')}</h2>}
            {g.lop.map((em) => (
              <div key={em[0].classId} className="card overflow-hidden">
                <button type="button" aria-expanded={mo(em[0].classId)} onClick={() => doi(em[0].classId)}
                  className="flex min-h-[44px] w-full cursor-pointer items-start gap-2 border-0 bg-transparent p-3 text-left">
                  <svg aria-hidden viewBox="0 0 8 8" width="8" height="8" className={`mt-[7px] shrink-0 text-slate-400 transition-transform ${mo(em[0].classId) ? 'rotate-90' : ''}`}>
                    <path d="M2.5 1 6 4 2.5 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="min-w-0 flex-1">{dauLop(em)}</span>
                </button>
                {mo(em[0].classId) && em.map((r) => (
                  <TheDong key={r.attemptId} className={r.studentId === dangMo ? 'row-active' : ''}
                    dau={<span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">{tenEm(r, false)}<Level tone={sosTone(r.sosLevel)}>SOS {r.sosLevel}</Level>{trangThai(r)}</span>}
                    hanhDong={nutMo(r)}
                    dong={[
                      { nhan: r.ft ? t('Kỹ năng') : t('Môn'), noiDung: `${r.kyNang.map((k) => skillShort(k)).join(', ')} · ${r.luot} · ${tuanLich(r.tuan, homNay)}` },
                      { nhan: t('Nguyên nhân'), noiDung: <TheoCase r={r} dam={dam} chu={chuNguyenNhan} /> },
                      ...(cot === 'ql' ? [{ nhan: t('Phương án'), noiDung: <TheoCase r={r} dam={dam} chu={chuPa} /> }] : []),
                      { nhan: t('Kết quả'), noiDung: ketQua(r) },
                      ...(cot === 'ql' ? [{ nhan: t('Việc tiếp'), noiDung: <ViecTiepDong r={r} /> }] : []),
                      ...(cot === 'cx' ? [{ nhan: 'TVV', noiDung: r.tvv ?? '—' }] : []),
                      ...(cot !== 'ql' ? [{ nhan: t('Phụ huynh'), noiDung: <OPhuHuynh l={r.lienHe} /> }] : []),
                    ]} />
                ))}
              </div>
            ))}
          </section>
        ))}
      </div>
    );
  }

  const tieuDe = ['Học viên', ...(toanBo ? ['MT · tuần'] : []), 'SOS', 'Nguyên nhân', ...(cot === 'ql' ? ['Phương án'] : []), 'Kết quả đến nay', 'Trạng thái',
    ...(cot === 'ql' ? ['Việc tiếp'] : []), ...(cot === 'cx' ? ['TVV'] : []), ...(cot !== 'ql' ? ['Phụ huynh'] : []), ''];
  const rong: Record<string, string> = {
    'Học viên': 'w-[15%]', 'MT · tuần': 'w-[9%]', SOS: 'w-[12%]', 'Nguyên nhân': 'w-[16%]', 'Phương án': 'w-[15%]', 'Kết quả đến nay': 'w-[13%]',
    'Trạng thái': 'w-[9%]', 'Việc tiếp': 'w-[14%]', TVV: 'w-[10%]', 'Phụ huynh': 'w-[14%]', '': 'w-16',
  };
  return (
    <div className="space-y-3">
      {nhom.map((g) => (
        <section key={g.k} className="card overflow-x-auto" aria-label={g.k === 'ft' ? t('Lớp Fast Track') : t('Lớp thường')}>
          <table className="w-full min-w-[1000px] table-fixed text-sm">
            <colgroup>{tieuDe.map((x, i) => <col key={i} className={rong[x]} />)}</colgroup>
            <thead><tr>{tieuDe.map((x, i) => <th key={i} className="th">{x === 'SOS' && g.k === 'thuong' ? t('SOS · môn') : x ? (NHAN_COT[x] ?? x) : <span className="sr-only">{t('Thao tác')}</span>}</th>)}</tr></thead>
            {g.lop.map((em) => (
              <tbody key={em[0].classId}>
                <HangNhom mo={mo(em[0].classId)} onMo={() => doi(em[0].classId)} nhan={t('lớp {ma}', { ma: em[0].classCode })} soCotDau={tieuDe.length} tieuDe={dauLop(em)} />
                {mo(em[0].classId) && em.map((r, i) => {
                  const lap = toanBo && i > 0 && em[i - 1].studentId === r.studentId;
                  return (
                    <HangCon key={r.attemptId} className={`row-hover ${nhomDong(r) === 'xong' ? 'row-muted' : ''} ${r.studentId === dangMo ? 'row-active' : ''}`}>
                      <td className="td h-14">{tenEm(r, lap)}</td>
                      {toanBo && <td className="td text-xs tabular-nums text-slate-300">{r.luot} · {tuanLich(r.tuan, homNay)}</td>}
                      <td className="td"><OSos r={r} toanBo={toanBo} /></td>
                      <td className="td"><TheoCase r={r} dam={dam} chu={chuNguyenNhan} /></td>
                      {cot === 'ql' && <td className="td"><TheoCase r={r} dam={dam} chu={chuPa} /></td>}
                      <td className="td">{ketQua(r)}</td>
                      <td className="td">{trangThai(r)}</td>
                      {cot === 'ql' && <td className="td"><ViecTiepDong r={r} /></td>}
                      {cot === 'cx' && <td className="td truncate text-xs text-slate-300" title={r.tvv ?? undefined}>{r.tvv ?? <span className="text-slate-600">—</span>}</td>}
                      {cot !== 'ql' && <td className="td text-sm"><OPhuHuynh l={r.lienHe} /></td>}
                      <td className="td text-center">{nutMo(r)}</td>
                    </HangCon>
                  );
                })}
              </tbody>
            ))}
          </table>
        </section>
      ))}
    </div>
  );
}
