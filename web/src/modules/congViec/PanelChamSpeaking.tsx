import { useEffect, useMemo, useState } from 'react';
import { LOP_DA_LUU } from '../../ui/KhuonViec.tsx';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ChipHan, ChipSoQuaHan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { dotGvCham, ngay, quyCheChamSpeaking, soSanhLopCham } from '@shared/domain/index.ts';
import { suaDuoc, type Cell } from '../fasttrack/ScoreEntry.tsx';
import { LuoiFT, type FtSheet } from '../cham/LuoiFT.tsx';
import { NutGvCham, useGvChamCot } from '../cham/GvCham.tsx';
import type { NguoiChon } from '@shared/domain/index.ts';
import { MuiTenGap } from '../yThuc/NhanViPham.tsx';
import { t } from '@shared/i18n/index.ts';

/** `GET /my-work/cham-speaking` (`baiChamSpeaking`, server/src/fasttrack/attempts.ts) — dòng lưới FT (`cells`, `result`) + ô S của hàng đợi. */
type Dong = FtSheet['rows'][number] & {
  classId: number; classCode: string; weekStart: string | null; kyVong: number | null;
  /** Lớp thường (MT0) — lên đầu khi có bài (`soSanhLopCham`). */
  laThuong?: boolean;
  /** S-CHEO-CN: chỉ có ở `?cn=khac` (mục "Chi nhánh khác"). */
  branchName?: string;
  /** Chưa chấm (đếm vào "n bài"); false = đã có điểm (ngăn "Đã có điểm"). */
  cho: boolean; cell: Cell & { enteredById?: number | null };
};
/** Một ngăn = một lớp. */
type Lop = { khoa: string; classId: number; classCode: string; branchName: string; thuong: boolean; rows: Dong[] };
type DuLieu = { rows: Dong[]; soBai: number;
  /** LG-5c / GD-2: "GV chấm" đã chọn của người xem theo "lớp:đợt" (`docGvChamCotLo`); ô chưa chọn → `macDinh`. */
  gvChamCot?: { chon: Record<string, NguoiChon | null>; macDinh: NguoiChon | null } };

/** Tìm không dấu, không phân biệt hoa thường. */
const chuan = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
const soCho = (rows: Dong[]) => rows.filter((r) => r.cho).length;
const soQua = (rows: Dong[]) => rows.filter((r) => r.cho && r.cell.overdue).length;
/** Hạn sớm nhất của bài còn chờ — đầu ngăn lớp ("hạn 23/09"). */
const hanSom = (rows: Dong[]) => rows.filter((r) => r.cho && r.cell.deadline).map((r) => r.cell.deadline!).sort()[0] ?? null;
const locQ = (rows: Dong[], q: string) => {
  const k = chuan(q);
  return k ? rows.filter((r) => chuan(r.studentName).includes(k) || chuan(r.studentEmail ?? '').includes(k)) : rows;
};

/**
 * S-CHEO-CN (chủ SP 16/11, thay GD-2 tuần → lớp): gom **theo lớp** như các kỹ năng khác — lớp thường có bài lên đầu, rồi mã lớp số nhỏ trước
 * (`soSanhLopCham`, chung với chấm Test); trong lớp: tuần gần nhất lên đầu, rồi tên em. Tuần ghi dưới tên em (không ngăn tuần — "hiện luôn tên + ô điểm").
 */
function gom(rows: Dong[]): Lop[] {
  const lop = new Map<number, Lop>();
  for (const r of rows) {
    const l = lop.get(r.classId) ?? { khoa: `l${r.classId}`, classId: r.classId, classCode: r.classCode, branchName: r.branchName ?? '', thuong: !!r.laThuong, rows: [] };
    lop.set(r.classId, l);
    l.rows.push(r);
  }
  const ds = [...lop.values()].sort((a, b) => soSanhLopCham({ code: a.classCode, thuong: a.thuong, coBai: soCho(a.rows) > 0 }, { code: b.classCode, thuong: b.thuong, coBai: soCho(b.rows) > 0 }));
  for (const l of ds) {
    l.rows.sort((a, b) => (b.weekStart ?? '').localeCompare(a.weekStart ?? '') || a.studentName.localeCompare(b.studentName, 'vi') || a.attemptNo - b.attemptNo);
  }
  return ds;
}

/**
 * CHẤM SPEAKING (OV-14c; V6 GD-2; S-CHEO-CN 16/11 — mockup `thiet-ke/v21/trang-dau-gv.html` K3, K8c) — panel của MỘT việc chung "Chấm Speaking"
 * (GV Speaking chấm chéo S Mock / MT0). Mỗi lớp một ngăn gập / mở với ĐÚNG lưới FT (`LuoiFT`, cột Speaking + Kết quả), tuần Test dưới tên em;
 * ô "GV chấm" đầu ngăn (lớp × đợt mới nhất, lưu máy chủ — `useGvChamCot`); bài đã có điểm ở ngăn con "Đã có điểm · n bài". Hết bài của lớp →
 * "Lớp tiếp: {mã} ›" hoặc "Việc tiếp ›". Cuối panel "Chi nhánh khác" gập — chỉ tải khi mở (`?cn=khac`), không vào số việc.
 */
export function PanelChamSpeaking({ onDong, onDaLam, lopDau = null, onTiep = null, nguoi = null }: { onDong: () => void; onDaLam: () => void;
  /** CV-SUA-1011: QL theo dõi việc GV này ("Của GV") — hàng đợi của GV đó; ô sửa được theo quyền người xem. */
  nguoi?: number | null;
  /** R1-LUU-TIEP: việc kế (Công việc) — "Việc tiếp ›" ở chân panel và khi hết bài. */
  onTiep?: (() => void) | null;
  /** UI-CHAM-TEST: mở từ một lớp ở Chấm Test — mở sẵn ngăn của lớp đó. */
  lopDau?: number | null;
}) {
  const duong = (cnKhac: boolean) => {
    const x = [nguoi ? `nguoi=${nguoi}` : '', cnKhac ? 'cn=khac' : ''].filter(Boolean).join('&');
    return `/my-work/cham-speaking${x ? `?${x}` : ''}`;
  };
  const { data, error, reload } = useApi<DuLieu>(duong(false), [nguoi]);
  /* S-CHEO-CN: "Chi nhánh khác" chỉ tải khi mở lần đầu — mở panel không thêm câu đọc. */
  const [moKhac, setMoKhac] = useState(false);
  const khac = useApi<DuLieu>(moKhac ? duong(true) : null, [nguoi, moKhac]);
  const { homNay } = useNgayNghiepVu();
  const [q, setQ] = useState('');
  const [mo, setMo] = useState<ReadonlySet<string> | null>(null);
  const lop = useMemo(() => gom(locQ(data?.rows ?? [], q)), [data, q]);
  const lopKhac = useMemo(() => gom(locQ(khac.data?.rows ?? [], q)), [khac.data, q]);
  /* Mở sẵn: ngăn của `lopDau`, không thì ngăn đầu còn bài chờ. */
  useEffect(() => {
    if (mo !== null || !data) return;
    const dau = lop.find((n) => lopDau !== null && n.classId === lopDau && soCho(n.rows)) ?? lop.find((n) => soCho(n.rows));
    setMo(new Set(dau ? [dau.khoa] : []));
  }, [data, mo, lopDau, lop]);
  const dangMo = (n: Lop) => !!q.trim() || !!mo?.has(n.khoa);
  const doi = (n: Lop, m: boolean) => setMo((s) => { const x = new Set(s ?? []); if (m) x.add(n.khoa); else x.delete(n.khoa); return x; });
  /* K3 chân: "✓ Đã lưu n bài" — số lần lưu trong lần mở panel này (cả chi nhánh khác). */
  const [soLuu, setSoLuu] = useState(0);
  const daLuu = () => { setSoLuu((n) => n + 1); reload(); onDaLam(); };
  /* Chi nhánh khác không vào số việc — chỉ tải lại phần đó. */
  const daLuuKhac = () => { setSoLuu((n) => n + 1); khac.reload(); };
  const onHet = (ds: Lop[], n: Lop) => () => {
    const ke = ds.slice(ds.indexOf(n) + 1).find((x) => soCho(x.rows)) ?? ds.find((x) => x !== n && soCho(x.rows));
    if (ke) return { nhan: t('Lớp tiếp: {lop} ›', { lop: ke.classCode }), onClick: () => setMo(new Set([ke.khoa])) };
    return onTiep ? { nhan: t('Việc tiếp ›'), onClick: onTiep } : null;
  };
  const tatCa = data?.rows ?? [];
  const quaHan = soQua(tatCa);
  const dau = {
    /* GD-1b (lời 24): không ghi "Việc chung" — cùng dạng đầu panel việc khác ("Việc · {tab}"). */
    loai: t('Việc · Chấm Speaking'),
    dong2: data ? [t('{n} bài', { n: data.soBai }), ...(quaHan ? [<ChipSoQuaHan key="q" n={quaHan} />] : [])] : [],
  };
  const veLop = (ds: Lop[], onLuu: () => void, gvChamCot: DuLieu['gvChamCot']) => (l: Lop) =>
    <NganLop key={l.khoa} n={l} mo={dangMo(l)} onMo={(m) => doi(l, m)} onDaLuu={onLuu} onHet={onHet(ds, l)} homNay={homNay} gvChamCot={gvChamCot} />;
  /* Chi nhánh khác: chi nhánh → lớp; thứ tự lớp `gom` áp trong mỗi chi nhánh (chi nhánh theo lớp đầu của nó). */
  const theoCn = [...lopKhac.reduce((m, l) => m.set(l.branchName, [...(m.get(l.branchName) ?? []), l]), new Map<string, Lop[]>())];
  return (
    <KhungPanel hd="nhap-diem" tieuDe={t('Chấm Speaking')} dau={dau} loai={dau.loai} onDong={onDong}
      /* GD-4b Q10 / Q12: `nguoi` = hàng đợi của GV khác (QL theo dõi, nhập hộ). */
      quyChe={tatCa.length ? quyCheChamSpeaking(nguoi != null) : null}
      chan={onTiep ? { huy: null, phu: soLuu > 0 ? <span role="status" className={`text-[13px] font-semibold ${LOP_DA_LUU}`}>✓ {t('Đã lưu {n} bài', { n: soLuu })}</span> : undefined, chinh: <button type="button" className={data?.soBai === 0 ? 'btn btn-primary min-h-[44px] sm:min-h-0' : 'btn min-h-[44px] sm:min-h-0'} onClick={onTiep}>{t('Việc tiếp ›')}</button> } : undefined}>
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : !data ? <div className="pt-3"><Skeleton rows={6} /></div>
          : (
            <div className="-mx-4 pb-3">
              <div className="px-4 pt-3 pb-2">
                <input className="field w-full max-w-[360px] max-sm:min-h-[44px] max-sm:max-w-none max-sm:text-base" type="search" autoComplete="off" spellCheck={false} value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder={t('Tìm học viên (tên, email)')} aria-label={t('Tìm học viên (tên, email)')} />
              </div>
              {!tatCa.length ? <div className="px-4"><Empty title={t('Không có bài Speaking chờ chấm')} /></div>
                : !lop.length ? <p className="m-0 px-4 py-3 text-sm text-slate-400">{t('Không có học viên khớp')}</p>
                  : lop.map(veLop(lop, daLuu, data.gvChamCot))}
              <details className="group/khac mt-4" onToggle={(e) => { if (e.currentTarget.open) setMoKhac(true); }}>
                <summary className="mx-4 flex min-h-[44px] cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-sm font-semibold" style={{ color: 'var(--text)', borderColor: 'var(--line)' }}>
                  {t('Chi nhánh khác')}
                  {khac.data && <span className="text-[13px] font-medium text-slate-400">{t('{n} bài', { n: khac.data.soBai })}</span>}
                  <span aria-hidden className="ml-auto text-slate-500 group-open/khac:rotate-90"><MuiTenGap mo={false} /></span>
                </summary>
                <div className="pb-2">
                  {khac.error ? <div className="px-4 pt-2"><ErrorState message={khac.error.message} hint={khac.error.hint} status={khac.error.status} onRetry={khac.reload} /></div>
                    : !khac.data ? <div className="px-4 pt-2"><Skeleton rows={3} /></div>
                      : !khac.data.rows.length ? <p className="m-0 px-4 py-3 text-sm text-slate-400">{t('Không có bài Speaking chờ chấm')}</p>
                        : !lopKhac.length ? <p className="m-0 px-4 py-3 text-sm text-slate-400">{t('Không có học viên khớp')}</p>
                          : theoCn.map(([ten, ds]) => (
                            <section key={ten} aria-label={ten}>
                              <div className="px-4 pt-3 pb-2 text-[13px] font-semibold text-slate-400">{ten}</div>
                              {ds.map(veLop(lopKhac, daLuuKhac, khac.data!.gvChamCot))}
                            </section>
                          ))}
                </div>
              </details>
            </div>
          )}
    </KhungPanel>
  );
}

/** Một ngăn lớp: đầu ngăn (mã · n bài · quá hạn / hạn) bấm gập / mở; thân = ô "GV chấm" + lưới FT bài chờ (tuần dưới tên em) + ngăn con "Đã có điểm". */
function NganLop({ n, mo, onMo, onDaLuu, onHet, homNay, gvChamCot }: {
  gvChamCot?: { chon: Record<string, NguoiChon | null>; macDinh: NguoiChon | null };
  n: Lop; mo: boolean; onMo: (mo: boolean) => void; onDaLuu: () => void; onHet: () => { nhan: string; onClick: () => void } | null; homNay: string | null;
}) {
  /* Ô "GV chấm" nhớ theo lớp × đợt: đợt của tuần mới nhất (dòng đầu — `gom` xếp tuần mới trên); chọn một lần dùng cho mọi bài lưu ở ngăn này. */
  const moi = n.rows.filter((r) => r.weekStart === n.rows[0]?.weekStart);
  const periodId = moi[0]?.cell.periodId ?? null;
  const dot = dotGvCham(periodId, moi.map((r) => r.attemptNo));
  const tuMayChu = !gvChamCot ? null : dot && `${n.classId}:${dot}` in gvChamCot.chon ? gvChamCot.chon[`${n.classId}:${dot}`] : gvChamCot.macDinh;
  const [gv, setGv] = useGvChamCot(n.classId, dot, tuMayChu);
  /* Ảnh chụp tập bài chờ lúc mở ngăn: bài vừa chấm đứng nguyên trong lưới (không nhảy sang "Đã có điểm" giữa phiên chấm). */
  const [choLucMo, setChoLucMo] = useState<ReadonlySet<number>>(() => new Set(n.rows.filter((r) => r.cho).map((r) => r.attemptId)));
  useEffect(() => { if (mo) setChoLucMo(new Set(n.rows.filter((r) => r.cho).map((r) => r.attemptId))); }, [mo]);   // eslint-disable-line react-hooks/exhaustive-deps -- chỉ chụp lúc mở
  /* Tuần dưới tên em: `LuoiFT hienTuan` (`DongVang` — "vắng W2 SEP → W3 SEP" / chỉ tuần), không ghép vào `phu`. */
  const cho = n.rows.filter((r) => r.cho || choLucMo.has(r.attemptId));
  const daCo = n.rows.filter((r) => !r.cho && !choLucMo.has(r.attemptId))
    .map((r) => {
      const ten = r.cell.gvCham?.ten ?? r.cell.enteredByName;
      return { ...r, phu: ten ? `${t('GV chấm: {ten}', { ten })}${r.cell.enteredAt ? ` · ${ngay(r.cell.enteredAt, homNay)}` : ''}` : null };
    });
  const sua = n.rows.some((r) => suaDuoc(r.cell));
  const sheet = (rs: Dong[]): FtSheet => ({
    classId: n.classId, classCode: n.classCode, branchName: '',
    /* Một tuần trong lưới → đợt đó; nhiều tuần → không gắn đợt (tuần ghi ở từng dòng). */
    period: periodId !== null && rs.length && rs.every((r) => r.cell.periodId === periodId) && rs[0].weekStart
      ? { id: periodId, code: rs[0].cell.periodCode ?? '', weekStart: rs[0].weekStart, weekEnd: '' } : null,
    editableSkills: sua ? ['speaking'] : [], rows: rs,
  });
  const so = soCho(n.rows), qua = soQua(n.rows);
  return (
    <div className="mx-4 mb-2 overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line)' }}>
      <button type="button" aria-expanded={mo} onClick={() => onMo(!mo)}
        className="flex min-h-[44px] w-full items-center gap-2 border-0 bg-[color:var(--surface-2)] px-3 text-left text-sm hover:bg-[color:var(--nut-hover)]">
        <span className="font-semibold" style={{ color: 'var(--text)' }}>{n.classCode}</span>
        <span className="text-[13px] font-medium text-slate-400">{so ? t('{n} bài', { n: so }) : t('Đã có điểm · {n} bài', { n: n.rows.length })}</span>
        {qua > 0 ? <ChipSoQuaHan n={qua} /> : so > 0 && <ChipHan loai="nhap-diem" han={hanSom(n.rows)} vien />}
        <span aria-hidden className="ml-auto text-slate-500"><MuiTenGap mo={mo} /></span>
      </button>
      {mo && (
        <div className="border-t pb-1" style={{ borderColor: 'var(--line)' }}>
          {sua && dot && cho.length > 0 && <div className="max-w-[420px] pt-2"><NutGvCham hang nhan={t('GV chấm')} value={gv} onChange={setGv} /></div>}
          {cho.length > 0 && <LuoiFT data={sheet(cho)} onReload={onDaLuu} chiCot={['speaking']} gon hienTuan gvCham={gv} onHet={onHet} />}
          {daCo.length > 0 && (
            <details className="group/da mt-1" open={!cho.length || undefined}>
              <summary className="flex min-h-[44px] cursor-pointer list-none sm:min-h-[40px] items-center gap-2 px-3 text-[13px] font-semibold text-slate-400">
                {t('Đã có điểm · {n} bài', { n: daCo.length })}<span aria-hidden className="group-open/da:rotate-90"><MuiTenGap mo={false} /></span>
              </summary>
              <LuoiFT data={sheet(daCo)} onReload={onDaLuu} chiCot={['speaking']} gon hienTuan gvCham={gv} />
            </details>
          )}
        </div>
      )}
    </div>
  );
}
