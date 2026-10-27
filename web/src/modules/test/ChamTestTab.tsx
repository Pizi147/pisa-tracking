import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { KhungTaiCho, boChuRoi } from '../../ui/KhungPanel.tsx';
import { ChipHan, Nhan } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { PanelViec } from '../congViec/PanelViec.tsx';
import { PanelChamSpeaking } from '../congViec/PanelChamSpeaking.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { KHOA_CHAM_SPEAKING, LOAI_HAN_CUA_VIEC, addDaysIso, mondayOfDate, soSanhLop, tuanLich, viecKeTiep } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** `GET /my-work/cham-speaking` — chỉ trường cần để gom theo lớp × lượt × tuần (`PanelChamSpeaking` đọc đủ). */
type BaiS = { classId: number; classCode: string; attemptNo: number; weekStart: string | null; cho: boolean };
/** Một dòng Speaking chấm chéo: lớp × MT (tuần làm bài sớm nhất – muộn nhất của các bài chờ). */
type NhomS = { key: string; classId: number; classCode: string; attemptNo: number; tu: string | null; den: string | null; soBai: number };

const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const phang = (ds: readonly WorkItem[]) => ds.flatMap((x) => (x.con?.length ? x.con : [x]));
/** Việc Nhập điểm của chính người xem (Speaking chấm chéo không là nợ — R2). Một hàm cho danh sách và số trên tab. */
export const viecChamCuaToi = (dong: readonly WorkItem[]) => phang(dong).filter((x) => x.group === 'score' && x.mine && x.key !== KHOA_CHAM_SPEAKING);
const tongBai = (ds: readonly { soBai?: number }[]) => ds.reduce((n, x) => n + (x.soBai ?? 0), 0);

/**
 * TEST › CHẤM TEST (UI-CHAM-TEST, mockup `thiet-ke/v5/test.html` khu Chấm; 08 R2, C14; 10 P7) — GV. Danh sách trái 4 nhóm theo hạn chấm thật:
 * Quá hạn · Hạn đến {CN tuần này} · Speaking chấm chéo (mở) · Hạn sau {CN tuần này} (gập). "Của tôi" = việc Nhập điểm của chính người xem trên
 * `/my-work` (cùng nguồn badge / Công việc — số không lệch); Speaking chấm chéo KHÔNG là nợ của ai (R2, `scoreDebt.ts`) → nhóm riêng, "Có thể
 * chấm", không cộng vào "Của tôi". Bấm một dòng → khu chấm phải tại chỗ: panel sẵn có (`PanelViec` = lưới điểm `LuoiNhung` của đúng lớp · tuần ·
 * kỹ năng; `PanelChamSpeaking` lọc sẵn lớp) — luật chấm, lưu, nhận xét (LUAT-NX-MT: chỉ nhắc) không đổi. Dòng đang chấm nằm trong URL (`nhom`). Điện thoại
 * (< 1024): bấm dòng → khu chấm thay danh sách, "‹ Chấm Test" về lại.
 */
export function ChamTestTab() {
  const [params, setParams] = useSearchParams();
  const { homNay } = useNgayNghiepVu();
  const { data, error, reload } = useApi<{ dong: WorkItem[]; scopeEmpty: boolean }>('/my-work');
  const coS = !!data?.dong.some((x) => x.key === KHOA_CHAM_SPEAKING);
  const sp = useApi<{ rows: BaiS[]; soBai: number }>(coS ? '/my-work/cham-speaking' : null, [coS]);

  const cuoiTuan = homNay ? addDaysIso(mondayOfDate(homNay), 6) : null;
  const nhom = useMemo(() => {
    const viec = viecChamCuaToi(data?.dong ?? [])
      .sort((a, b) => (a.due ?? '9').localeCompare(b.due ?? '9') || soSanhLop({ code: a.classCode ?? '' }, { code: b.classCode ?? '' }));
    const qua = viec.filter((x) => x.urgency === 'overdue');
    const nay = viec.filter((x) => x.urgency !== 'overdue' && !!x.due && !!cuoiTuan && x.due <= cuoiTuan);
    const sau = viec.filter((x) => !qua.includes(x) && !nay.includes(x));
    const s = new Map<string, NhomS>();
    for (const r of sp.data?.rows ?? []) {
      if (!r.cho) continue;
      const k = `s:${r.classId}|${r.attemptNo}`;
      const g = s.get(k) ?? s.set(k, { key: k, classId: r.classId, classCode: r.classCode, attemptNo: r.attemptNo, tu: r.weekStart, den: r.weekStart, soBai: 0 }).get(k)!;
      g.soBai += 1;
      if (r.weekStart && (!g.tu || r.weekStart < g.tu)) g.tu = r.weekStart;
      if (r.weekStart && (!g.den || r.weekStart > g.den)) g.den = r.weekStart;
    }
    const cheo = [...s.values()].sort((a, b) => soSanhLop({ code: a.classCode }, { code: b.classCode }) || a.attemptNo - b.attemptNo);
    return { qua, nay, sau, cheo };
  }, [data, sp.data, cuoiTuan]);

  /* Dòng đang chấm giữ ở state (không suy từ danh sách): chấm xong bài cuối, máy chủ bỏ việc khỏi `/my-work` — khu chấm vẫn mở, dòng hiện "✓ Xong". */
  const [chon, setChon] = useState<WorkItem | NhomS | null>(null);
  const khoa = params.get('nhom');
  /* Máy tính (mockup `veCham`): chưa chọn thì mở sẵn nhóm đầu Quá hạn → Hạn đến → Speaking (không nhóm gập Hạn sau — T14); trang tự mở → `tuMo`. */
  const [tuMo, setTuMo] = useState<string | null>(null);
  const daTuMo = useRef(false);   // chỉ tự mở một lần — đóng khu chấm rồi tải lại không mở lại
  useEffect(() => {
    if (daTuMo.current) return;
    if (khoa || chon) { daTuMo.current = true; return; }
    if (!data || !window.matchMedia('(min-width: 1024px)').matches) return;
    const dau = nhom.qua[0] ?? nhom.nay[0] ?? nhom.cheo[0];
    if (dau && (!coS || sp.data || nhom.qua[0] || nhom.nay[0])) { daTuMo.current = true; setTuMo(dau.key); mo(dau); }
  }, [data, sp.data]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!khoa) { setChon(null); return; }
    if (chon && chon.key === khoa) return;
    const x = [...nhom.qua, ...nhom.nay, ...nhom.sau, ...nhom.cheo].find((y) => y.key === khoa);
    if (x) setChon(x);
  }, [khoa, nhom]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* R1-LUU-TIEP [KIỂM]: thứ tự việc CHỤP lúc mở từ danh sách — việc vừa xong rời `/my-work` vẫn tìm được vị trí (findIndex + 1 cũ về việc đầu). */
  const anhChup = useRef<(WorkItem | NhomS)[]>([]);
  const mo = (x: WorkItem | NhomS | null, giuAnh = false) => {
    if (!giuAnh) anhChup.current = [...nhom.qua, ...nhom.nay, ...nhom.cheo, ...nhom.sau];
    const next = new URLSearchParams(params);
    if (x) next.set('nhom', x.key); else next.delete('nhom');
    setParams(next, { replace: true });
    setChon(x);
  };
  const thuTu = [...nhom.qua, ...nhom.nay, ...nhom.cheo, ...nhom.sau];
  const conTrenMayChu = new Set(thuTu.map((x) => x.key));

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (!data || !homNay || !cuoiTuan) return <Skeleton rows={8} />;

  const cua = [...nhom.qua, ...nhom.nay, ...nhom.sau];
  const baiCheo = tongBai(nhom.cheo);
  const rong = !cua.length && !nhom.cheo.length;
  const anh = chon && anhChup.current.some((x) => x.key === chon.key) ? anhChup.current : thuTu;   // mở từ đường dẫn: chưa có ảnh chụp
  const keTiep = chon ? viecKeTiep(anh.map((x) => ({ ...x, nhom: '', mine: true })), chon.key, (x) => conTrenMayChu.has(x.key)) : null;
  const dong = (x: WorkItem | NhomS) => (
    <DongCham key={x.key} x={x} homNay={homNay} chon={chon?.key === x.key} xong={!conTrenMayChu.has(x.key)}
      onMo={() => { if (chon?.key === x.key) return; boChuRoi(() => mo(x)); }} />
  );
  /* Dòng vừa chấm xong (máy chủ đã bỏ) vẫn đứng ở nhóm của nó — không nhảy mất khi đang nhìn. */
  const giu = (ds: (WorkItem | NhomS)[], cuaNhom: (x: WorkItem | NhomS) => boolean) =>
    (chon && !conTrenMayChu.has(chon.key) && cuaNhom(chon) ? [...ds, chon] : ds);
  const laCheo = (x: WorkItem | NhomS): x is NhomS => x.key.startsWith('s:');
  const dsQua = giu(nhom.qua, (x) => !laCheo(x) && x.urgency === 'overdue');
  const dsNay = giu(nhom.nay, (x) => !laCheo(x) && x.urgency !== 'overdue' && !!x.due && x.due <= cuoiTuan);
  const dsSau = giu(nhom.sau, (x) => !laCheo(x) && x.urgency !== 'overdue' && (!x.due || x.due > cuoiTuan));
  const dsCheo = giu(nhom.cheo, laCheo);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[440px_minmax(0,1fr)]">
      <section aria-label={t('Bài cần chấm')} className={`card overflow-hidden p-0 ${chon ? 'max-lg:hidden' : ''}`}>
        {rong ? (
          <Empty title={t('Không còn bài nào cần chấm')} />
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b px-4 py-3 text-sm text-slate-300" style={{ borderColor: 'var(--line)' }}>
              <span>{t('Của tôi')}: <b className="tabular-nums text-slate-100">{cua.length}</b> {t('việc')} · <b className="tabular-nums text-slate-100">{tongBai(cua)}</b> {t('bài')}</span>
              {coS && <span>{t('Có thể chấm')}: <b className="tabular-nums text-slate-100">{baiCheo}</b> {t('bài Speaking')}</span>}
              <NutLuat label={t('Cách đếm')}>{t('Bài = một kỹ năng của một HV trong một lượt. "Của tôi" chỉ gồm phần được phân công cho bạn; Speaking chấm chéo không tính nợ.')}</NutLuat>
            </div>
            <Nhom ten={t('Quá hạn')} dem={dsQua.length ? <span className="font-semibold text-late">⚠ {demNhom(nhom.qua)}</span> : null} rong={t('Không có bài quá hạn.')}>
              {dsQua.map(dong)}
            </Nhom>
            <Nhom ten={t('Hạn đến {d}', { d: ddmm(cuoiTuan) })} dem={nhom.nay.length ? demNhom(nhom.nay) : null} rong={t('Không có bài hạn đến {d}.', { d: ddmm(cuoiTuan) })}>
              {dsNay.map(dong)}
            </Nhom>
            {coS && (
              <Nhom ten={t('Speaking chấm chéo')} dem={nhom.cheo.length ? demNhom(nhom.cheo) : null} gap={false} rong={t('Không có bài Speaking chờ chấm.')}>
                {dsCheo.map(dong)}
              </Nhom>
            )}
            <Nhom ten={t('Hạn sau {d}', { d: ddmm(cuoiTuan) })} dem={nhom.sau.length ? demNhom(nhom.sau) : t('không có')} gap={!dsSau.some((x) => x.key === chon?.key)}>
              {dsSau.map(dong)}
            </Nhom>
          </>
        )}
      </section>
      <div className={`lg:sticky lg:top-3 ${chon ? 'space-y-2' : 'max-lg:hidden'}`}>
        {chon ? (
          <>
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <button type="button" autoFocus className="link flex min-h-[44px] items-center gap-1.5 appearance-none border-0 bg-transparent p-0 text-[13px] lg:hidden"
              onClick={() => boChuRoi(() => mo(null))}>{t('‹ Chấm Test')}</button>
            <KhungTaiCho.Provider value>
              {laCheo(chon)
                ? <PanelChamSpeaking key={chon.key} lopDau={chon.classId} onDong={() => mo(null)} onDaLam={() => { sp.reload(); reload(); }} onTiep={keTiep ? () => mo(keTiep, true) : null} />
                : <PanelViec key={chon.key} it={chon} tuMo={tuMo === chon.key} onDong={() => mo(null)} onDaLam={reload} onTiep={keTiep ? () => mo(keTiep, true) : null} />}
            </KhungTaiCho.Provider>
          </>
        ) : !rong ? <Card><Empty title={t('Chọn một việc bên trái để chấm')} /></Card> : null}
      </div>
    </div>
  );
}

const demNhom = (ds: readonly { soBai?: number }[]) => t('{n} việc · {bai} bài', { n: ds.length, bai: tongBai(ds) });

/**
 * Một nhóm theo hạn: tên + số ở đầu; `gap` (true/false) = nhóm gập được (`<details>`), mở sẵn khi false. Nhóm trống: MỘT dòng chữ.
 * Đầu nhóm = thanh `--cap-nhom`, cùng dáng thanh nhóm Lịch Test (R1-PHAN-CAP-TEST, M2 A2).
 */
function Nhom({ ten, dem, rong, gap, children }: { ten: string; dem: ReactNode; rong?: string; gap?: boolean; children: ReactNode[] }) {
  const dau = (
    <>
      <span className="text-sm font-semibold text-slate-100">{ten}</span>
      {dem && <span className="text-[13px] font-medium tabular-nums text-slate-400">{dem}</span>}
    </>
  );
  const than = children.length ? <ul className="m-0 list-none p-0">{children}</ul>
    : rong ? <p className="m-0 px-4 pb-3 text-[13px] text-slate-500">{rong}</p> : null;
  if (gap === undefined) {
    return (
      <div className="border-b last:border-b-0" style={{ borderColor: 'var(--line)' }}>
        <div className="flex min-h-[40px] items-baseline gap-2 bg-[color:var(--cap-nhom)] px-4 py-2.5">{dau}</div>
        {than}
      </div>
    );
  }
  return (
    <details className="group border-b last:border-b-0" style={{ borderColor: 'var(--line)' }} open={!gap}>
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 bg-[color:var(--cap-nhom)] px-4 py-2.5 sm:min-h-[40px] [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="w-3 text-slate-500 group-open:rotate-90 transition-transform">▸</span>{dau}
      </summary>
      {than}
    </details>
  );
}

/** "MT2 · làm bài W2 SEP" (Rulebook §21.4 T13) — `contextLabel` của việc là "MT2 W2 SEP" (lượt + tuần làm bài). */
function nhanLuot(x: WorkItem): string {
  const m = /^(.*) (W\d [A-Z]{3}(?: \d{4})?)$/.exec(x.contextLabel ?? '');
  return m ? t('{luot} · làm bài {tuan}', { luot: dich(m[1]), tuan: m[2] }) : dich(x.contextLabel ?? '');
}

function DongCham({ x, homNay, chon, xong, onMo }: { x: WorkItem | NhomS; homNay: string; chon: boolean; xong: boolean; onMo: () => void }) {
  const cheo = x.key.startsWith('s:');
  const w = x as WorkItem, s = x as NhomS;
  return (
    <li>
      <button type="button" onClick={onMo} aria-current={chon ? 'true' : undefined}
        className={`grid w-full appearance-none grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-0 border-t bg-transparent px-4 py-2.5 text-left row-hover ${chon ? 'row-active shadow-[inset_3px_0_0_var(--accent)]' : ''} ${xong ? 'row-muted' : ''}`}
        style={{ borderColor: 'var(--line)' }}>
        <span className="min-w-0 break-words text-[15px] font-semibold text-slate-100">
          {cheo ? `${s.classCode} · Speaking` : `${w.classCode ?? w.studentName} · ${dich(w.reason)}`}
        </span>
        <span className="row-span-2 flex flex-col items-end gap-1">
          <span className="text-[13px] tabular-nums text-slate-300">{xong ? <span className="font-semibold text-ok">✓ {t('Xong')}</span> : t('{soBai} bài', { soBai: x.soBai ?? 0 })}</span>
          {!cheo && !xong && <ChipHan loai={LOAI_HAN_CUA_VIEC.score ?? 'nhap-diem'} han={w.due} />}
        </span>
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-400">
          {cheo ? (
            <>
              <span>{t('{luot} · làm bài {tuan}', { luot: `MT${s.attemptNo}`, tuan: [s.tu, s.den].filter((x, i, a): x is string => !!x && a.indexOf(x) === i).map((x) => tuanLich(x, homNay)).join(' – ') || '—' })}</span>
              <Nhan tone="muted">{t('chấm chéo · không tính nợ')}</Nhan>
            </>
          ) : <span>{nhanLuot(w)}</span>}
        </span>
      </button>
    </li>
  );
}
