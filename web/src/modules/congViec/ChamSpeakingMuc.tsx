import { type ReactNode, useMemo, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { t } from '@shared/i18n/index.ts';
import { type DuLieu, type Lop, duongChamSpeaking, gom, hanSom, locQ, soCho, soQua, tuanCuaLop } from './chamSpeakingChung.ts';

type Dai = { nhan: string; chip?: string; phu?: ReactNode; mo: boolean; onMo: () => void; dk?: string };

/** Số em còn bài của lớp (một em hai lượt = một em). */
const soEm = (l: Lop) => new Set(l.rows.filter((r) => r.cho).map((r) => r.studentId)).size;

/**
 * TAB CHẤM SPEAKING — KHUÔN A (chủ SP 25/11; mockup `thiet-ke/v26/cham-speaking.html` phương án A): MỖI LỚP MỘT DÒNG "lớp · n em · thông tin · hạn" xếp theo hạn sớm nhất
 * (quá hạn lên đầu). Thông tin CHỈ có mã tuần: "W4 AUG, W1 SEP · 8 bài · 6 quá hạn" (không ghi Mock / MT). Bấm dòng → panel của đúng lớp (`PanelChamSpeaking`, `?lc=`).
 * Ô "Tìm học viên" ở đầu danh sách, lọc xuyên lớp trên dữ liệu đã tải (không thêm request). "Chi nhánh khác" là mục gập — chỉ tải khi mở, không vào số việc.
 * Dữ liệu `/my-work/cham-speaking` dùng chung với panel (`chiNghe`): lưu ở panel xong, dòng lớp đổi theo (lớp hết bài rời danh sách).
 * Đầu mục / hạn vẽ bằng `veDai` / `han` do `DanhSachViec` đưa vào (cùng dáng mọi mục).
 */
export function ChamSpeakingMuc({ nguoi, moSan, lopChon, onMo, veDai, han, onTiep }: {
  nguoi: number | null;
  /** Panel Chấm Speaking đang mở (có `lopChon` hoặc lớp đầu mặc định của panel). */
  moSan: boolean; lopChon: number | null;
  onMo: (classId: number) => void;
  veDai: (d: Dai) => ReactNode;
  han: (due: string | null) => ReactNode;
  /** "Việc tiếp ›" khi hết bài (mẫu hết việc). */
  onTiep?: (() => void) | null;
}) {
  const { data, error, reload } = useApi<DuLieu>(duongChamSpeaking(nguoi, false), [nguoi], { chiNghe: true });
  const [moKhac, setMoKhac] = useState(false);
  const [gapChinh, setGapChinh] = useState(false);
  const khac = useApi<DuLieu>(moKhac ? duongChamSpeaking(nguoi, true) : null, [nguoi, moKhac], { chiNghe: true });
  const [q, setQ] = useState('');
  const loc = useMemo(() => gom(locQ(data?.rows ?? [], q)).filter((l) => soCho(l.rows) > 0), [data, q]);
  const locKhac = useMemo(() => gom(locQ(khac.data?.rows ?? [], q)).filter((l) => soCho(l.rows) > 0), [khac.data, q]);
  const tim = q.trim() !== '';
  const chonId = moSan ? lopChon ?? loc[0]?.classId ?? null : null;
  const tong = (ds: Lop[]) => ({ bai: ds.reduce((n, l) => n + soCho(l.rows), 0), qua: ds.reduce((n, l) => n + soQua(l.rows), 0) });
  const d = tong(loc), dk = tong(locKhac);
  const dong = (l: Lop, cn: boolean) => {
    const bai = soCho(l.rows), qua = soQua(l.rows);
    /* Tìm theo tên: cột "ai" ghi tên em khớp (A9); thông tin "n bài · tuần". Bình thường: "tuần · n bài · m quá hạn". */
    const ten = [...new Set(l.rows.filter((r) => r.cho).map((r) => r.studentName))].join(', ');
    const tuan = tuanCuaLop(l.rows);
    const tin = (tim ? [t('{n} bài', { n: bai }), tuan] : [tuan, t('{n} bài', { n: bai }), qua ? `${qua} ${t('quá hạn')}` : '']).filter(Boolean).join(' · ');
    const dangChon = chonId === l.classId;
    const mo = () => onMo(l.classId);
    return (
      <li key={l.khoa} className="cvA-sub">
        <div className="cvA-sub">
          <div data-hd="cv-dong" data-khoa={`cham-speaking:${l.classId}`} onClick={mo} className={`cvA-v ${dangChon ? 'dang-chon' : ''}`}>
            <span className="cvA-lop">{l.classCode}</span>
            <span className="cvA-ai">
              <button type="button" className="cvA-ten" aria-current={dangChon ? 'true' : undefined} onClick={(e) => { e.stopPropagation(); mo(); }}>{tim ? ten : t('{n} em', { n: soEm(l) })}</button>
            </span>
            <span className="cvA-ct" title={tin}>
              {cn && l.branchName && <span className="mr-1.5 inline-flex h-[18px] items-center rounded-[5px] border px-1.5 align-[1px] text-xs font-semibold text-dim" style={{ borderColor: 'var(--line-strong)' }}>{l.branchName}</span>}
              {tin}
            </span>
            {han(hanSom(l.rows))}
          </div>
        </div>
      </li>
    );
  };
  const hetBai = !!data && !loc.length && !tim;
  return (
    <>
      <div className="relative">
        <svg viewBox="0 0 16 16" aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-[color:var(--text-dim)]" strokeWidth={1.5} strokeLinecap="round"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg>
        <input className="field w-full pl-9 max-sm:min-h-[44px] max-sm:text-base" type="search" autoComplete="off" spellCheck={false} value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={t('Tìm học viên (tên, email)')} aria-label={t('Tìm học viên (tên, email)')} />
      </div>
      <section data-muc="cham-cheo" className="card cvA-sub overflow-clip p-0" aria-label={t('Chấm Speaking')}>
        {veDai({ nhan: t('Chấm Speaking'), chip: `${d.bai} ${t('bài')}`, phu: d.qua > 0 ? <span className="font-bold tabular-nums text-late">{d.qua} {t('quá hạn')}</span> : null, mo: !gapChinh, onMo: () => setGapChinh((x) => !x), dk: 'muc-cham-cheo' })}
        {!gapChinh && (
          error ? <div id="muc-cham-cheo" className="cvA-sub"><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div>
            : !data ? <div id="muc-cham-cheo" className="px-4 py-3"><Skeleton rows={4} /></div>
              : hetBai ? (
                <div id="muc-cham-cheo" className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                  <p className="m-0 text-[16px] font-semibold text-[color:var(--text)]">{t('Bạn hết bài Speaking chờ chấm')}</p>
                  {onTiep && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" onClick={onTiep}>{t('Việc tiếp ›')}</button>}
                </div>
              ) : !loc.length ? <p id="muc-cham-cheo" className="m-0 px-4 py-3 text-sm text-slate-400">{t('Không có học viên khớp')}</p>
                : <div id="muc-cham-cheo" className="cvA-sub"><ul className="cvA-sub">{loc.map((l) => dong(l, false))}</ul></div>
        )}
      </section>
      <section data-muc="cham-cheo-khac" className="card cvA-sub overflow-clip p-0" aria-label={t('Chi nhánh khác')}>
        {veDai({ nhan: t('Chi nhánh khác'), chip: khac.data ? `${dk.bai} ${t('bài')}` : undefined, phu: khac.data && dk.qua > 0 ? <span className="font-bold tabular-nums text-late">{dk.qua} {t('quá hạn')}</span> : null,
          mo: moKhac, onMo: () => setMoKhac((x) => !x), dk: 'muc-cham-cheo-khac' })}
        {moKhac && (
          <div id="muc-cham-cheo-khac" className="cvA-sub">
            {khac.error ? <ErrorState message={khac.error.message} hint={khac.error.hint} status={khac.error.status} onRetry={khac.reload} />
              : !khac.data ? <div className="px-4 py-3"><Skeleton rows={3} /></div>
                : !khac.data.rows.some((r) => r.cho) ? <Empty title={t('Không có bài Speaking chờ chấm')} />
                  : !locKhac.length ? <p className="m-0 px-4 py-3 text-sm text-slate-400">{t('Không có học viên khớp')}</p>
                    : <ul className="cvA-sub">{locKhac.map((l) => dong(l, true))}</ul>}
          </div>
        )}
      </section>
    </>
  );
}
