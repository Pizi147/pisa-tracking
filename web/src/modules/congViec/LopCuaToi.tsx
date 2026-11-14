import { Link } from 'react-router-dom';
import { useSession, type Assignment } from '../../lib/session.tsx';
import { ChipHan, ChipKy } from '../../ui/Nhan.tsx';
import { Skeleton } from '../../ui/ui.tsx';
import { IconNhom } from './DanhSachViec.tsx';
import { lamTaiCho } from './lamTaiCho.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { LOAI_HAN_CUA_VIEC, dongTab, laViecChamCheo, tabCuaViec, tuanLich } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** LG-8: "Test sắp tới" từng lớp GV đang dạy hôm nay (`/my-work`, chỉ vai GV) — cũng là danh sách lớp còn hiệu lực. */
export type TestSapToi = { classId: number; testKeTiep: string | null; testTuanNay: boolean };

/** Chủ SP 14/11 (lời 17, 20): chip "Việc cần làm" theo LOẠI việc, thứ tự cố định; không có Chấm Speaking (chỉ ở tab của nó); Báo cáo PH nằm trong Vận hành. */
const LOAI_CHIP = [
  ['cham-diem', t('Nhập điểm')], ['case-hoc-thuat', t('Case')], ['y-thuc', t('Ý thức')], ['van-hanh', t('Vận hành')],
] as const;
const TEN_BAI: Record<string, string> = { mock: 'MT', mt0: 'MT0', progress: 'Progress', final: 'Final', checkpoint: 'Checkpoint' };
const nang = (u: WorkItem['urgency']) => (u === 'overdue' ? 0 : u === 'today' ? 1 : 2);
const xepHan = (a: WorkItem, b: WorkItem) => nang(a.urgency) - nang(b.urgency) || (a.due ?? '9999').localeCompare(b.due ?? '9999');

/** `so` = chỉ số trên nút (chủ SP 15/11: "Nhập điểm · 6" như "Case · 2", không chữ "bài"); `doc` = nghĩa đủ cho tooltip / trình đọc màn hình. */
type Chip = { tab: string; nhan: string; so: number; doc: string; quaHan: boolean; dau: WorkItem };
type Dong = { classId: number; code: string; mon: string[]; chuNhiem: boolean; test: { chu: string; han: WorkItem | null } | null; chip: Chip[] };

/**
 * Dựng dòng "Lớp của tôi" — dữ liệu ĐÃ NẠP (phiên + `/my-work`), không request thêm (`04-thiet-ke.md` 11.2). Một lớp một dòng; lớp có việc lên trên.
 * Chip Nhập điểm đếm BÀI (`soBai`, đơn vị dòng Nhập điểm); chip khác đếm DÒNG của tab có lớp đó (`dongTab`, cùng đơn vị badge).
 */
export function dungLopCuaToi(phanCong: readonly Assignment[], viec: readonly WorkItem[], testSapToi: readonly TestSapToi[] | undefined,
  caDong: (it: WorkItem) => boolean): Dong[] {
  const conHieuLuc = testSapToi ? new Set(testSapToi.map((x) => x.classId)) : null;
  const lop = new Map<number, Dong>();
  for (const a of phanCong) {
    if (conHieuLuc && !conHieuLuc.has(a.classId)) continue;
    const d = lop.get(a.classId) ?? { classId: a.classId, code: a.classCode ?? `#${a.classId}`, mon: [], chuNhiem: false, test: null, chip: [] };
    if (a.isCore) d.chuNhiem = true;
    const mon = a.nhanMon ?? a.skill;
    if (mon && !d.mon.includes(mon)) d.mon.push(mon);
    lop.set(a.classId, d);
  }
  const cuaToi = viec.filter((x) => !laViecChamCheo(x));
  const la = cuaToi.flatMap((x) => (x.con?.length ? x.con : [x]));
  for (const d of lop.values()) {
    const cuaLop = (x: WorkItem) => x.classId === d.classId;
    for (const [tab, nhan] of LOAI_CHIP) {
      const laTab = la.filter((x) => cuaLop(x) && tabCuaViec(x) === tab).sort(xepHan);
      if (!laTab.length) continue;
      const bai = tab === 'cham-diem';
      const so = bai ? laTab.reduce((n, x) => n + (x.soBai ?? x.count ?? 1), 0)
        : dongTab(cuaToi.filter((x) => tabCuaViec(x) === tab), caDong).filter((x) => cuaLop(x) || !!x.con?.some(cuaLop)).length;
      const doc = bai ? t('{n} bài chờ nhập điểm', { n: so }) : t('{n} việc', { n: so });
      d.chip.push({ tab, nhan, so, doc, quaHan: laTab.some((x) => x.urgency === 'overdue'), dau: laTab[0] });
    }
    /* Cột Test: có bài của tôi → bài gần hạn nhất (loại · tuần + chip hạn); không có → Test sắp tới của lớp (LG-8), chữ mờ. */
    const bai = la.filter((x) => cuaLop(x) && x.group === 'score').sort(xepHan)[0];
    const sapToi = testSapToi?.find((x) => x.classId === d.classId)?.testKeTiep ?? null;
    d.test = bai ? { chu: [TEN_BAI[bai.kind ?? ''] ?? bai.contextLabel, bai.tuanThi ? tuanLich(bai.tuanThi) : null].filter(Boolean).join(' · '), han: bai }
      : sapToi ? { chu: sapToi, han: null } : null;
  }
  const hanSom = (d: Dong) => d.chip.map((c) => c.dau).sort(xepHan)[0];
  return [...lop.values()].sort((a, b) => {
    const x = hanSom(a), y = hanSom(b);
    if (!!x !== !!y) return x ? -1 : 1;
    if (x && y) { const k = xepHan(x, y); if (k) return k; }
    if (!!a.test !== !!b.test) return a.test ? -1 : 1;
    return a.code.localeCompare(b.code, 'vi', { numeric: true });
  });
}

const COT = 'grid grid-cols-[104px_150px_152px_minmax(0,1fr)] items-center gap-x-3 px-4';

/**
 * LỚP CỦA TÔI — khung phải trang Công việc khi chưa chọn việc (GD-1, mockup v21 ① K1 + `04-thiet-ke.md` mục 12, 13).
 * Cột: Lớp (link hồ sơ lớp) · Tôi dạy (chip kỹ năng; "chủ nhiệm") · Test (tình trạng + hạn) · Việc cần làm (nút-chip "{loại} · {số}", đỏ khi quá hạn (V22: chỉ màu), "›" khi đổi trang — dòng 19).
 * Bấm chip = việc đầu (hạn sớm nhất) của loại đó ở lớp đó: mở panel tại chỗ, hoặc sang trang khi việc không làm tại chỗ (`onMo`).
 * 375: mỗi lớp một thẻ, chip cao 44.
 */
export function LopCuaToi({ dong, onMo, dangTai, loi }: {
  dong: Dong[]; onMo: (x: WorkItem) => void; dangTai: boolean; loi: React.ReactNode;
}) {
  const { session } = useSession();
  const chuaPhanCong = !dangTai && !loi && !dong.length;
  return (
    <section className="card overflow-clip p-0" aria-labelledby="lop-cua-toi" data-hd="cv-lop-cua-toi">
      <h2 id="lop-cua-toi" className="m-0 flex min-h-[48px] items-center gap-2 border-b border-l-[3px] pl-[13px] pr-2 text-[15px] font-bold leading-snug bg-[color:var(--surface-2)]"
        style={{ borderBottomColor: 'var(--line)', borderLeftColor: 'var(--accent)' }}>
        <span className="text-[color:var(--accent)]"><IconNhom k="lop-toi-day" /></span>
        <span className="text-[color:var(--text)]">{t('Lớp của tôi')}</span>
        {dong.length > 0 && <span className="inline-flex h-[22px] items-center whitespace-nowrap rounded border px-[7px] text-xs font-semibold tabular-nums text-[color:var(--text)]"
          style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>{t('{n} lớp', { n: dong.length })}</span>}
      </h2>
      {loi ? <div className="p-4">{loi}</div>
        : dangTai ? <div className="p-4"><Skeleton rows={4} /></div>
          : chuaPhanCong ? <p className="m-0 px-4 py-6 text-[15px] text-dim">{session?.assignments?.length ? t('Không có lớp nào đang mở.') : t('Chưa được phân công lớp nào')}</p>
            : <>
              <div className={`${COT} min-h-[34px] border-b text-xs font-semibold text-faint max-sm:hidden`} style={{ borderColor: 'var(--line)' }} aria-hidden>
                <span>{t('Lớp')}</span><span>{t('Tôi dạy')}</span><span>{t('Test')}</span><span>{t('Việc cần làm')}</span>
              </div>
              <ul className="m-0 list-none p-0">
                {dong.map((d, i) => <DongLop key={d.classId} d={d} dau={i === 0} onMo={onMo} />)}
              </ul>
            </>}
    </section>
  );
}

function DongLop({ d, dau, onMo }: { d: Dong; dau: boolean; onMo: (x: WorkItem) => void }) {
  const ranh = !d.chip.length;
  const nhat = ranh && !d.test;
  return (
    <li className={`${COT} min-h-[58px] py-2 ${dau ? '' : 'border-t'} max-sm:flex max-sm:flex-col max-sm:items-start max-sm:gap-2 max-sm:py-3`}
      style={{ borderColor: 'var(--line)' }}>
      <span className="flex min-w-0 items-center gap-2 max-sm:w-full">
        <Link to={`/hoc-vien/lop/${d.classId}`} className={`whitespace-nowrap text-[15px] leading-snug !text-[color:var(--text)] no-underline hover:!text-[color:var(--accent)] hover:underline ${nhat ? 'font-medium !text-[color:var(--text-dim)]' : 'font-semibold'}`}>{d.code}</Link>
        <span className="hidden max-sm:flex max-sm:gap-1">{monCua(d, nhat)}</span>
      </span>
      <span className="flex flex-nowrap items-center gap-1 max-sm:hidden">{monCua(d, nhat)}</span>
      <span className="grid min-w-0 justify-items-start gap-1 max-sm:flex max-sm:flex-wrap max-sm:items-center max-sm:gap-2 max-sm:empty:hidden">
        {d.test && <span className={`whitespace-nowrap text-sm leading-snug ${d.test.han ? 'font-medium text-[color:var(--text)]' : 'text-dim'}`}>{d.test.chu}</span>}
        {d.test?.han?.due && <ChipHan vien loai={LOAI_HAN_CUA_VIEC[d.test.han.group] ?? 'nhap-diem'} han={d.test.han.due} />}
      </span>
      <span className="flex flex-wrap gap-1.5 max-sm:w-full max-sm:empty:hidden">
        {d.chip.map((c) => (
          <button key={c.tab} type="button" onClick={() => onMo(c.dau)}
            title={c.doc} aria-label={`${c.quaHan ? `${t('Quá hạn')}: ` : ''}${c.nhan} · ${c.so} · ${d.code} · ${c.doc}`}
            className={`inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-[13px] font-semibold max-sm:h-11 max-sm:px-3 max-sm:text-sm ${c.quaHan
              ? 'border-late-line bg-late-bg text-late hover:brightness-110' : 'surface-2 text-[color:var(--text)] hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)]'}`}
            style={c.quaHan ? undefined : { borderColor: 'var(--line-strong)' }}>
            {c.nhan} · <span className="tabular-nums">{c.so}</span>{!lamTaiCho(c.dau) && <span aria-hidden> ›</span>}
          </button>
        ))}
      </span>
    </li>
  );
}

const monCua = (d: Dong, nhat: boolean) => (
  <>
    {d.mon.map((m) => (nhat
      ? <span key={m} className="inline-flex h-5 min-w-6 items-center justify-center rounded px-1.5 text-xs font-bold text-faint shadow-[inset_0_0_0_1px_var(--line)]">{m}</span>
      : <ChipKy key={m} k={m} />))}
    {d.chuNhiem && <span className="inline-flex h-5 items-center whitespace-nowrap rounded border px-1.5 text-xs font-semibold text-dim" style={{ borderColor: 'var(--line-strong)' }}>{t('chủ nhiệm')}</span>}
  </>
);
