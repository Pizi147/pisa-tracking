import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ChipHan, ChipSoQuaHan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { addDaysIso, dotGvCham, mondayOfDate, ngay, soSanhLop, tuanLich } from '@shared/domain/index.ts';
import { suaDuoc, type Cell } from '../fasttrack/ScoreEntry.tsx';
import { LuoiFT, type FtSheet } from '../cham/LuoiFT.tsx';
import { NutGvCham, useGvChamCot } from '../cham/GvCham.tsx';
import { MuiTenGap } from '../yThuc/NhanViPham.tsx';
import { t } from '@shared/i18n/index.ts';

/** `GET /my-work/cham-speaking` (`baiChamSpeaking`, server/src/fasttrack/attempts.ts) — dòng lưới FT (`cells`, `result`) + ô S của hàng đợi. */
type Dong = FtSheet['rows'][number] & {
  classId: number; classCode: string; weekStart: string | null; kyVong: number | null;
  /** Chưa chấm (đếm vào "n bài"); false = đã có điểm (ngăn "Đã có điểm"). */
  cho: boolean; cell: Cell & { enteredById?: number | null };
};
type Ngan = { khoa: string; classId: number; classCode: string; periodId: number | null; rows: Dong[] };
type Tuan = { khoa: string; weekStart: string | null; periodId: number | null; code: string | null; ngan: Ngan[] };

/** Tìm không dấu, không phân biệt hoa thường. */
const chuan = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
const soCho = (rows: Dong[]) => rows.filter((r) => r.cho).length;
const soQua = (rows: Dong[]) => rows.filter((r) => r.cho && r.cell.overdue).length;
/** Hạn sớm nhất của bài còn chờ — đầu tuần ("hạn 23/09"). */
const hanSom = (rows: Dong[]) => rows.filter((r) => r.cho && r.cell.deadline).map((r) => r.cell.deadline!).sort()[0] ?? null;

/** Gom tuần Test của ô S (mới trên) → lớp theo thứ tự mã lớp mặc định (chủ SP 14/11: chấm chéo chủ yếu cho lớp khác — không đưa lớp tôi dạy lên đầu). */
function gom(rows: Dong[]): Tuan[] {
  const tuan = new Map<string, Tuan>();
  for (const r of rows) {
    const pid = r.cell.periodId ?? null;
    const kt = pid !== null ? `p${pid}` : `w${r.weekStart ?? ''}`;
    const t0 = tuan.get(kt) ?? { khoa: kt, weekStart: r.weekStart, periodId: pid, code: r.cell.periodCode ?? null, ngan: [] };
    tuan.set(kt, t0);
    const kn = `${kt}:${r.classId}`;
    let n = t0.ngan.find((x) => x.khoa === kn);
    if (!n) { n = { khoa: kn, classId: r.classId, classCode: r.classCode, periodId: pid, rows: [] }; t0.ngan.push(n); }
    n.rows.push(r);
  }
  const ds = [...tuan.values()].sort((a, b) => (b.weekStart ?? '').localeCompare(a.weekStart ?? ''));
  for (const x of ds) {
    x.ngan.sort((a, b) => soSanhLop({ code: a.classCode }, { code: b.classCode }));
    for (const n of x.ngan) n.rows.sort((a, b) => a.studentName.localeCompare(b.studentName, 'vi') || a.attemptNo - b.attemptNo);
  }
  return ds;
}

/**
 * CHẤM SPEAKING (OV-14c; V6 GD-2 — mockup `thiet-ke/v21/trang-dau-gv.html` K3, K8c; `04-thiet-ke.md` 5.5, 12) — panel của MỘT việc chung
 * "Chấm Speaking" (GV Speaking chấm chéo S Mock / MT0 lớp chi nhánh mình). Gom **tuần Test → lớp**: tuần mới trên, "Tuần cũ hơn" gập cuối;
 * mỗi lớp một ngăn gập / mở với ĐÚNG lưới FT (`LuoiFT`, cột Speaking + Kết quả — cùng hộp chấm, cùng "Lưu · bài tiếp ›"); ô "GV chấm" đầu ngăn
 * (lớp × tuần, `useGvChamCot` — cùng ô nhớ với lưới Nhập điểm); bài đã có điểm ở ngăn con "Đã có điểm · n bài" ghi "GV chấm: … · dd/mm".
 * Hết bài của ngăn → "Lớp tiếp: {mã} ›" (ngăn kế còn bài) hoặc "Việc tiếp ›".
 */
export function PanelChamSpeaking({ onDong, onDaLam, lopDau = null, onTiep = null, nguoi = null }: { onDong: () => void; onDaLam: () => void;
  /** CV-SUA-1011: QL theo dõi việc GV này ("Của GV") — hàng đợi của GV đó; ô sửa được theo quyền người xem. */
  nguoi?: number | null;
  /** R1-LUU-TIEP: việc kế (Công việc) — "Việc tiếp ›" ở chân panel và khi hết bài. */
  onTiep?: (() => void) | null;
  /** UI-CHAM-TEST: mở từ một lớp ở Chấm Test — mở sẵn ngăn của lớp đó. */
  lopDau?: number | null;
}) {
  const { data, error, reload } = useApi<{ rows: Dong[]; soBai: number }>(`/my-work/cham-speaking${nguoi ? `?nguoi=${nguoi}` : ''}`, [nguoi]);
  const { homNay } = useNgayNghiepVu();
  const [q, setQ] = useState('');
  const [mo, setMo] = useState<ReadonlySet<string> | null>(null);
  const rows = useMemo(() => {
    const k = chuan(q);
    return (data?.rows ?? []).filter((r) => !k || chuan(r.studentName).includes(k) || chuan(r.studentEmail ?? '').includes(k));
  }, [data, q]);
  const tuan = useMemo(() => gom(rows), [rows]);
  /* "Tuần cũ hơn": tuần Test trước tuần trước (bài còn tồn — server giữ tới khi chấm). */
  const moc = homNay ? addDaysIso(mondayOfDate(homNay), -7) : '';
  const moi = tuan.filter((x) => !x.weekStart || x.weekStart >= moc), cu = tuan.filter((x) => x.weekStart && x.weekStart < moc);
  const nganPhang = [...moi, ...cu].flatMap((x) => x.ngan);
  /* Mở sẵn: ngăn của `lopDau`, không thì ngăn đầu còn bài chờ. */
  useEffect(() => {
    if (mo !== null || !data) return;
    const dau = nganPhang.find((n) => lopDau !== null && n.classId === lopDau && soCho(n.rows)) ?? nganPhang.find((n) => soCho(n.rows));
    setMo(new Set(dau ? [dau.khoa] : []));
  }, [data, mo, lopDau, nganPhang]);
  const dangMo = (n: Ngan) => !!q.trim() || !!mo?.has(n.khoa);
  const doi = (n: Ngan, m: boolean) => setMo((s) => { const x = new Set(s ?? []); if (m) x.add(n.khoa); else x.delete(n.khoa); return x; });
  /* K3 chân: "✓ Đã lưu n bài" — số lần lưu trong lần mở panel này. */
  const [soLuu, setSoLuu] = useState(0);
  const daLuu = () => { setSoLuu((n) => n + 1); reload(); onDaLam(); };
  const onHet = (n: Ngan) => () => {
    const ke = nganPhang.slice(nganPhang.indexOf(n) + 1).find((x) => soCho(x.rows)) ?? nganPhang.find((x) => x !== n && soCho(x.rows));
    if (ke) return { nhan: t('Lớp tiếp: {lop} ›', { lop: ke.classCode }), onClick: () => setMo(new Set([ke.khoa])) };
    return onTiep ? { nhan: t('Việc tiếp ›'), onClick: onTiep } : null;
  };
  const tatCa = data?.rows ?? [];
  const quaHan = soQua(tatCa);
  const dau = {
    loai: t('Việc chung · Chấm Speaking'),
    dong2: data ? [t('{n} bài', { n: data.soBai }), ...(quaHan ? [<ChipSoQuaHan key="q" n={quaHan} />] : [])] : [],
  };
  const veNgan = (n: Ngan) => <NganLop key={n.khoa} n={n} mo={dangMo(n)} onMo={(m) => doi(n, m)} onDaLuu={daLuu} onHet={onHet(n)} homNay={homNay} />;
  const veTuan = (x: Tuan) => (
    <section key={x.khoa} aria-label={tuanLich(x.weekStart, homNay)}>
      <div className="flex items-center gap-2 px-4 pt-4 pb-2 text-[15px] font-bold" style={{ color: 'var(--text)' }}>
        <span className="tabular-nums">{x.weekStart ? tuanLich(x.weekStart, homNay) : x.code}</span>
        <span className="text-[13px] font-medium text-slate-400">{t('{n} bài', { n: soCho(x.ngan.flatMap((n) => n.rows)) })}</span>
        <span className="ml-1"><ChipHan loai="nhap-diem" han={hanSom(x.ngan.flatMap((n) => n.rows))} vien /></span>
      </div>
      {x.ngan.map(veNgan)}
    </section>
  );
  const cuRows = cu.flatMap((x) => x.ngan.flatMap((n) => n.rows));
  return (
    <KhungPanel hd="nhap-diem" tieuDe={t('Chấm Speaking')} dau={dau} loai={dau.loai} onDong={onDong}
      chan={onTiep ? { huy: null, phu: soLuu > 0 ? <span role="status" className="text-[13px] font-semibold text-slate-400">✓ {t('Đã lưu {n} bài', { n: soLuu })}</span> : undefined, chinh: <button type="button" className={data?.soBai === 0 ? 'btn btn-primary min-h-[44px] sm:min-h-0' : 'btn min-h-[44px] sm:min-h-0'} onClick={onTiep}>{t('Việc tiếp ›')}</button> } : undefined}>
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : !data ? <div className="pt-3"><Skeleton rows={6} /></div>
          : !tatCa.length ? <div className="pt-3"><Empty title={t('Không có bài Speaking chờ chấm')} /></div>
            : (
              <div className="-mx-4 pb-3">
                <div className="px-4 pt-3 pb-1">
                  <input className="field w-full max-w-[360px] max-sm:min-h-[44px] max-sm:max-w-none max-sm:text-base" type="search" autoComplete="off" spellCheck={false} value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder={t('Tìm học viên (tên, email)')} aria-label={t('Tìm học viên (tên, email)')} />
                </div>
                {!rows.length ? <p className="m-0 px-4 py-3 text-sm text-slate-400">{t('Không có học viên khớp')}</p> : (
                  <>
                    {moi.map(veTuan)}
                    {cu.length > 0 && (
                      <details className="group/cu mx-4 mt-4 rounded-lg border" style={{ borderColor: 'var(--line)' }} open={!!q.trim() || undefined}>
                        <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 px-3 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          {t('Tuần cũ hơn')}
                          <span className="text-[13px] font-medium text-slate-400">{t('{n} bài', { n: soCho(cuRows) })}</span>
                          {soQua(cuRows) > 0 && <ChipSoQuaHan n={soQua(cuRows)} />}
                          <span aria-hidden className="ml-auto text-slate-500 group-open/cu:rotate-90"><MuiTenGap mo={false} /></span>
                        </summary>
                        <div className="-mx-px pb-2">{cu.map(veTuan)}</div>
                      </details>
                    )}
                  </>
                )}
              </div>
            )}
    </KhungPanel>
  );
}

/** Một ngăn lớp × tuần: đầu ngăn (mã · n bài · ⚠ quá hạn) bấm gập / mở; thân = ô "GV chấm" + lưới FT bài chờ + ngăn con "Đã có điểm". */
function NganLop({ n, mo, onMo, onDaLuu, onHet, homNay }: {
  n: Ngan; mo: boolean; onMo: (mo: boolean) => void; onDaLuu: () => void; onHet: () => { nhan: string; onClick: () => void } | null; homNay: string | null;
}) {
  const dot = dotGvCham(n.periodId, n.rows.map((r) => r.attemptNo));
  const [gv, setGv] = useGvChamCot(n.classId, dot);
  /* Ảnh chụp tập bài chờ lúc mở ngăn: bài vừa chấm đứng nguyên trong lưới (không nhảy sang "Đã có điểm" giữa phiên chấm). */
  const [choLucMo, setChoLucMo] = useState<ReadonlySet<number>>(() => new Set(n.rows.filter((r) => r.cho).map((r) => r.attemptId)));
  useEffect(() => { if (mo) setChoLucMo(new Set(n.rows.filter((r) => r.cho).map((r) => r.attemptId))); }, [mo]);   // eslint-disable-line react-hooks/exhaustive-deps -- chỉ chụp lúc mở
  const cho = n.rows.filter((r) => r.cho || choLucMo.has(r.attemptId));
  const daCo = n.rows.filter((r) => !r.cho && !choLucMo.has(r.attemptId))
    .map((r) => {
      const ten = r.cell.gvCham?.ten ?? r.cell.enteredByName;
      return { ...r, phu: ten ? `${t('GV chấm: {ten}', { ten })}${r.cell.enteredAt ? ` · ${ngay(r.cell.enteredAt, homNay)}` : ''}` : null };
    });
  const sua = n.rows.some((r) => suaDuoc(r.cell));
  const sheet = (rs: Dong[]): FtSheet => ({
    classId: n.classId, classCode: n.classCode, branchName: '',
    period: n.periodId !== null && rs[0]?.weekStart ? { id: n.periodId, code: rs[0].cell.periodCode ?? '', weekStart: rs[0].weekStart, weekEnd: '' } : null,
    editableSkills: sua ? ['speaking'] : [], rows: rs,
  });
  const so = soCho(n.rows), qua = soQua(n.rows);
  return (
    <div className="mx-4 mb-2 overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line)' }}>
      <button type="button" aria-expanded={mo} onClick={() => onMo(!mo)}
        className="flex min-h-[44px] w-full items-center gap-2 border-0 bg-[color:var(--surface-2)] px-3 text-left text-sm hover:bg-[color:var(--nut-hover)]">
        <span className="font-semibold" style={{ color: 'var(--text)' }}>{n.classCode}</span>
        <span className="text-[13px] font-medium text-slate-400">{so ? t('{n} bài', { n: so }) : t('Đã có điểm · {n} bài', { n: n.rows.length })}</span>
        {qua > 0 && <ChipSoQuaHan n={qua} />}
        <span aria-hidden className="ml-auto text-slate-500"><MuiTenGap mo={mo} /></span>
      </button>
      {mo && (
        <div className="border-t pb-1" style={{ borderColor: 'var(--line)' }}>
          {sua && dot && cho.length > 0 && <div className="max-w-[420px] pt-2"><NutGvCham hang nhan={t('GV chấm')} value={gv} onChange={setGv} /></div>}
          {cho.length > 0 && <LuoiFT data={sheet(cho)} onReload={onDaLuu} chiCot={['speaking']} gon gvCham={gv} onHet={onHet} />}
          {daCo.length > 0 && (
            <details className="group/da mt-1" open={!cho.length || undefined}>
              <summary className="flex min-h-[44px] cursor-pointer list-none sm:min-h-[40px] items-center gap-2 px-3 text-[13px] font-semibold text-slate-400">
                {t('Đã có điểm · {n} bài', { n: daCo.length })}<span aria-hidden className="group-open/da:rotate-90"><MuiTenGap mo={false} /></span>
              </summary>
              <LuoiFT data={sheet(daCo)} onReload={onDaLuu} chiCot={['speaking']} gon gvCham={gv} />
            </details>
          )}
        </div>
      )}
    </div>
  );
}
