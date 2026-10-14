import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Nhan } from '../../ui/Nhan.tsx';
import { Han } from '../../ui/Han.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { OPhuHuynh } from './HocVienTheoVai.tsx';
import { maHocVienNgan, type DeadlineKind, type LienHe, type NguCanhDs } from '@shared/domain/index.ts';

/**
 * MỘT VIỆC của góc Cần làm — nguồn là việc của người xem ở Công việc (`/my-work`, cùng số Công việc) + hai lọc phụ của QL (Chờ duyệt, Thiếu thông tin)
 * và việc của TVV (Chọn bước tiếp · Kết quả thi · Thiếu thông tin). `mo` mở panel / hộp sẵn có ngay trang này.
 */
export type ViecCanLam = {
  key: string; studentId: number | null; ten: string; ma: string | null; classId: number | null; classCode: string | null;
  /** Dòng "Cả lớp · n em" (việc chung của lớp, Q6). */
  soEm?: number;
  viec: string; phu: string | null;
  /** Người giữ việc — null = của người xem ("Tôi"). */
  nguoi: string | null;
  han: string | null; loaiHan: DeadlineKind | null; quaHan: boolean;
  /** Kiểu chip việc (mockup 3 v2 §4): cam ⚠ quá hạn · tím chờ duyệt · viền đứt thiếu thông tin · còn lại trung tính. */
  kieu: 'qua-han' | 'cho-duyet' | 'thieu-tt' | null;
  lienHe?: LienHe | null;
  mo: () => void;
};

const THU_KIEU = (v: ViecCanLam) => (v.quaHan ? 0 : v.han ? 1 : v.kieu === 'cho-duyet' ? 2 : v.kieu === 'thieu-tt' ? 4 : 3);
const soSanh = (a: ViecCanLam, b: ViecCanLam) => THU_KIEU(a) - THU_KIEU(b) || (a.han ?? '9').localeCompare(b.han ?? '9');

function ChipViec({ v }: { v: ViecCanLam }) {
  const tone = v.quaHan ? 'late' : v.kieu === 'cho-duyet' ? 'wait' : 'muted';
  return (
    <span className="block min-w-0">
      <Nhan tone={tone} dut={v.kieu === 'thieu-tt'}>{v.quaHan ? '⚠ ' : ''}{v.viec}</Nhan>
      {v.phu && <span className="mt-0.5 block truncate text-xs text-slate-400" title={v.phu}>{v.phu}</span>}
    </span>
  );
}

function OHan({ v }: { v: ViecCanLam }) {
  if (!v.han) return <span className="text-slate-600">—</span>;
  if (v.loaiHan) return <Han loai={v.loaiHan} han={v.han} haiDong />;
  return <span className="text-xs tabular-nums text-slate-500">{v.han}</span>;
}

/**
 * GÓC "CẦN LÀM" (OV-12f, mockup 3 v2 §4 / §6 / §7b / §9): nhóm theo lớp (lớp có việc quá hạn trước), trong lớp mỗi em một khối (ô Học viên kéo dài),
 * em có việc gấp nhất trước; "Cả lớp · n em" đầu lớp. Cột: Học viên · Việc · Người giữ (QL / Admin) · Hạn · Phụ huynh (TVV) · Mở. Không Nhắc, không cột điểm.
 */
export function BangCanLam({ viec, coNguoi, coPhuHuynh, dienThoai, ds }: {
  viec: ViecCanLam[]; coNguoi: boolean; coPhuHuynh: boolean; dienThoai: boolean; ds: NguCanhDs;
}) {
  const [gap, setGap] = useState<Set<string>>(new Set());
  const lop = new Map<string, ViecCanLam[]>();
  for (const v of viec) { const k = String(v.classId ?? 'khac'); lop.set(k, [...(lop.get(k) ?? []), v]); }
  const nhom = [...lop.entries()].map(([k, ds]) => {
    const em = new Map<string, ViecCanLam[]>();
    for (const v of [...ds].sort(soSanh)) { const kk = v.studentId === null ? `ca-lop:${v.key}` : String(v.studentId); em.set(kk, [...(em.get(kk) ?? []), v]); }
    /* "Cả lớp" đầu lớp, rồi em theo việc gấp nhất của em. */
    const dsEm = [...em.values()].sort((a, b) => Number(b[0].studentId === null) - Number(a[0].studentId === null) || soSanh(a[0], b[0]));
    return { k, code: ds[0].classCode ?? 'Không gắn lớp', classId: ds[0].classId, em: dsEm, tre: ds.filter((v) => v.quaHan).length, cho: ds.filter((v) => v.kieu === 'cho-duyet').length };
  }).sort((a, b) => Number(b.tre > 0) - Number(a.tre > 0) || a.code.localeCompare(b.code, 'vi'));
  /* Tự mở khi ít (≤ 5 lớp hoặc ≤ 40 việc — đang lọc thường rơi vào đây); nhiều hơn thì gập, bấm đầu lớp để mở. */
  const mo = (k: string) => (nhom.length <= 5 || viec.length <= 40) !== gap.has(k);
  const doi = (k: string) => setGap((cu) => { const s = new Set(cu); if (s.has(k)) s.delete(k); else s.add(k); return s; });
  const dauLop = (g: (typeof nhom)[number]) => (
    <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
      {g.classId ? <Link to={`/hoc-vien/lop/${g.classId}`} className="shrink-0 font-extrabold text-slate-100 underline decoration-dotted underline-offset-4">{g.code}</Link>
        : <span className="font-extrabold text-slate-100">{g.code}</span>}
      {g.tre > 0 && <Nhan tone="late">⚠ {g.tre} quá hạn</Nhan>}
      {g.cho > 0 && <Nhan tone="wait">{g.cho} chờ duyệt</Nhan>}
      {g.em.some((e) => e[0].studentId !== null) && <Nhan tone="muted">{g.em.filter((e) => e[0].studentId !== null).length} em</Nhan>}
    </span>
  );
  const tenEm = (v: ViecCanLam) => (v.studentId === null
    ? <span className="font-semibold text-slate-200">Cả lớp · {v.soEm ?? 0} em</span>
    : (
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
        <Link className="link max-w-full truncate font-semibold" title={v.ten} to={`/hoc-vien/${v.studentId}`} state={{ ds }}>{v.ten}</Link>
        {v.ma && <span className="shrink-0 text-[11.5px] tabular-nums text-slate-500">{maHocVienNgan(v.ma)}</span>}
      </span>
    ));
  const nut = (v: ViecCanLam) => <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" aria-label={`Mở · ${v.viec} · ${v.ten}`} onClick={v.mo}>Mở</button>;
  const nguoi = (v: ViecCanLam) => (v.nguoi ? <span className="text-xs text-slate-300">{v.nguoi}</span> : <span className="text-xs text-slate-500">Tôi</span>);

  if (dienThoai) {
    return (
      <div className="space-y-2">
        {nhom.map((g) => (
          <div key={g.k} className="card overflow-hidden">
            <button type="button" aria-expanded={mo(g.k)} onClick={() => doi(g.k)} className="flex min-h-[44px] w-full cursor-pointer items-start gap-2 border-0 bg-transparent p-3 text-left">
              <svg aria-hidden viewBox="0 0 8 8" width="8" height="8" className={`mt-[7px] shrink-0 text-slate-400 transition-transform ${mo(g.k) ? 'rotate-90' : ''}`}>
                <path d="M2.5 1 6 4 2.5 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="min-w-0 flex-1">{dauLop(g)}</span>
            </button>
            {mo(g.k) && g.em.map((e) => (
              <article key={e[0].key} className="border-t px-3 py-2.5" style={{ borderColor: 'var(--line)' }}>
                <div>{tenEm(e[0])}</div>
                {e.map((v) => (
                  <div key={v.key} className="mt-1.5 flex items-start gap-2">
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <ChipViec v={v} />
                      {(coNguoi || v.han) && <span className="block text-xs text-slate-500">{coNguoi && <>{v.nguoi ?? 'Tôi'} · </>}<OHan v={v} /></span>}
                    </span>
                    {nut(v)}
                  </div>
                ))}
                {coPhuHuynh && e[0].lienHe && <div className="mt-1 text-xs text-slate-400">Phụ huynh: <OPhuHuynh l={e[0].lienHe} /></div>}
              </article>
            ))}
          </div>
        ))}
      </div>
    );
  }

  const tieuDe = ['Học viên', 'Việc', ...(coNguoi ? ['Người giữ'] : []), 'Hạn', ...(coPhuHuynh ? ['Phụ huynh'] : []), ''];
  const rong: Record<string, string> = { 'Học viên': 'w-[22%]', Việc: 'w-[34%]', 'Người giữ': 'w-[16%]', Hạn: 'w-[14%]', 'Phụ huynh': 'w-[18%]', '': 'w-20' };
  return (
    <section className="card overflow-x-auto" aria-label="Cần làm theo lớp">
      <table className="w-full min-w-[860px] table-fixed text-sm">
        <colgroup>{tieuDe.map((t, i) => <col key={i} className={rong[t]} />)}</colgroup>
        <thead><tr>{tieuDe.map((t, i) => <th key={i} className="th">{t || <span className="sr-only">Thao tác</span>}</th>)}</tr></thead>
        {nhom.map((g) => (
          <tbody key={g.k}>
            <HangNhom mo={mo(g.k)} onMo={() => doi(g.k)} nhan={`lớp ${g.code}`} soCotDau={tieuDe.length} tieuDe={dauLop(g)} />
            {mo(g.k) && g.em.flatMap((e) => e.map((v, i) => (
              <HangCon key={v.key} className="row-hover">
                {i === 0 && <td className="td align-top" rowSpan={e.length}>{tenEm(v)}</td>}
                <td className="td"><ChipViec v={v} /></td>
                {coNguoi && <td className="td">{nguoi(v)}</td>}
                <td className="td"><OHan v={v} /></td>
                {coPhuHuynh && (i === 0 ? <td className="td align-top text-sm" rowSpan={e.length}>{v.lienHe ? <OPhuHuynh l={v.lienHe} /> : null}</td> : null)}
                <td className="td text-center">{nut(v)}</td>
              </HangCon>
            )))}
          </tbody>
        ))}
      </table>
    </section>
  );
}
