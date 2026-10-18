import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { duongHoSoHocVien, soSanhLop, tuanLich } from '@shared/domain/index.ts';
import { apDiemVuaLuu, suaDuoc, useSaveScore, type Cell } from '../fasttrack/ScoreEntry.tsx';
import { ODiemMt } from '../fasttrack/HopNhapDiem.tsx';
import { DauLuu, DauO, VIEN_LOI } from '../cham/LuoiFT.tsx';
import { t } from '@shared/i18n/index.ts';

/** `GET /my-work/cham-speaking` (`baiChamSpeaking`, server/src/fasttrack/attempts.ts). */
type Dong = {
  attemptId: number; studentId: number; studentName: string; studentEmail: string | null;
  classId: number; classCode: string; attemptNo: number; weekStart: string | null; kyVong: number | null;
  /** Chưa chấm (đếm vào "n bài"); false = đã có điểm, hiện "Nhập bởi …". */
  cho: boolean; cell: Cell & { enteredById?: number | null };
};

/** Tìm không dấu, không phân biệt hoa thường. */
const chuan = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
const sap = (a: Dong, b: Dong) => soSanhLop({ code: a.classCode }, { code: b.classCode }) || a.studentName.localeCompare(b.studentName, 'vi');

/**
 * CHẤM SPEAKING (OV-14c, chủ SP 18/10) — panel của việc "Chấm Speaking · n bài" (GV Speaking chấm chéo S Mock lớp FT chi nhánh mình).
 * Tìm học viên (tên / email, có / không dấu) + lọc lớp; mỗi dòng một em: tên · lớp · MT · tuần · "Nhập bởi …" khi đã có điểm. Ô S = hộp chấm
 * sẵn có (`ODiemMt` → `HopNhapDiem`: 4 tiêu chí + nhận xét), Enter / "Lưu · em tiếp ›" sang em chưa chấm kế tiếp trong danh sách đang lọc.
 * Dòng vừa lưu đứng nguyên chỗ (bài còn tồn cũ rời hàng đợi máy chủ sau khi chấm — vẫn giữ để thấy đã lưu).
 */
export function PanelChamSpeaking({ onDong, onDaLam }: { onDong: () => void; onDaLam: () => void }) {
  const { data, error, reload } = useApi<{ rows: Dong[]; soBai: number }>('/my-work/cham-speaking');
  const [q, setQ] = useState('');
  const [lop, setLop] = useState<number | null>(null);
  const [mo, setMo] = useState<number | null>(null);
  const [giu, setGiu] = useState<ReadonlyMap<number, Dong>>(new Map());
  const rows = useMemo(() => {
    const co = new Set((data?.rows ?? []).map((r) => r.attemptId));
    return [...(data?.rows ?? []), ...[...giu.values()].filter((r) => !co.has(r.attemptId))].sort(sap);
  }, [data, giu]);
  const dsLop = useMemo(() => [...new Map(rows.map((r) => [r.classId, r.classCode])).entries()], [rows]);
  const ds = useMemo(() => {
    const k = chuan(q);
    return rows.filter((r) => (lop === null || r.classId === lop) && (!k || chuan(r.studentName).includes(k) || chuan(r.studentEmail ?? '').includes(k)));
  }, [rows, q, lop]);
  /* Lớp đang lọc không còn bài nào (đã chấm hết, rời hàng đợi) → bỏ lọc. */
  useEffect(() => { if (lop !== null && !dsLop.some(([id]) => id === lop)) setLop(null); }, [dsLop, lop]);

  const dau = { dong2: [data ? t('{n} bài chờ chấm', { n: data.soBai }) : null] };
  return (
    <KhungPanel tieuDe={t('Chấm Speaking')} dau={dau} onDong={onDong}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : !data ? <div className="pt-3"><Skeleton rows={6} /></div>
          : !rows.length ? <div className="pt-3"><Empty title={t('Không có bài Speaking chờ chấm')} /></div>
            : (
              <div className="-mx-4">
                <div className="flex flex-wrap items-end gap-2 px-4 pt-3 pb-2">
                  <input className="field min-w-0 flex-1 max-sm:min-h-[44px] max-sm:text-base" type="search" value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder={t('Tìm học viên (tên, email)')} aria-label={t('Tìm học viên (tên, email)')} />
                  {dsLop.length > 1 && (
                    <select className="field w-auto max-sm:min-h-[44px] max-sm:w-full" aria-label={t('Lọc lớp')} value={lop ?? ''}
                      onChange={(e) => setLop(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">{t('Mọi lớp ({n})', { n: dsLop.length })}</option>
                      {dsLop.map(([id, ma]) => <option key={id} value={id}>{ma}</option>)}
                    </select>
                  )}
                </div>
                {!ds.length ? <p className="m-0 px-4 py-3 text-sm text-slate-400">{t('Không có học viên khớp')}</p> : (
                  <ul className="m-0 list-none p-0">
                    {ds.map((r, i) => (
                      <DongSpeaking key={r.attemptId} r={r} mo={mo === r.attemptId} onMo={(m) => setMo(m ? r.attemptId : null)}
                        onTiep={() => setMo(ds.slice(i + 1).find((x) => x.cho && suaDuoc(x.cell))?.attemptId ?? null)}
                        onDaLuu={() => { setGiu((m) => new Map(m).set(r.attemptId, r)); reload(); onDaLam(); }} />
                    ))}
                  </ul>
                )}
              </div>
            )}
    </KhungPanel>
  );
}

function DongSpeaking({ r, mo, onMo, onTiep, onDaLuu }: { r: Dong; mo: boolean; onMo: (mo: boolean) => void; onTiep: () => void; onDaLuu: () => void }) {
  const { save, status, lastError, retry, o, loi, luuLai, soLoi, coGuiLai, vuaLuu, xoaVuaLuu } = useSaveScore(r.attemptId, onDaLuu, r.studentName);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- dữ liệu mới của dòng thì bỏ điểm tạm
  useEffect(() => { xoaVuaLuu(); }, [r]);
  const c = apDiemVuaLuu(r.cell, vuaLuu.speaking);
  const nhapBoi = c.band !== null ? (vuaLuu.speaking ? t('vừa lưu') : r.cell.enteredByName ? t('Nhập bởi {ten}', { ten: r.cell.enteredByName }) : null) : null;
  return (
    <li className={`flex min-h-[60px] items-center gap-3 border-t px-4 py-2 ${!r.cho && !mo ? 'row-muted' : ''}`} style={{ borderColor: 'var(--line)' }} data-hv={r.studentId}>
      <div className="min-w-0 flex-1">
        <Link className="link block break-words max-sm:-my-3 max-sm:py-3" to={duongHoSoHocVien(r.studentId)}>{r.studentName}</Link>
        <div className="flex min-w-0 items-center gap-1.5 text-xs tabular-nums text-slate-500">
          <span className="truncate">{[r.classCode, `MT${r.attemptNo}`, r.weekStart ? tuanLich(r.weekStart) : null, nhapBoi].filter(Boolean).join(' · ')}</span>
          <DauLuu lon status={status} error={lastError} onRetry={coGuiLai ? retry : undefined} soLoi={soLoi} />
        </div>
      </div>
      <div className={`flex shrink-0 items-center justify-end gap-1 rounded-md ${o.speaking === 'loi' ? VIEN_LOI : ''}`} data-kn="speaking" data-luu={o.speaking}>
        <DauO lon tt={o.speaking} loi={loi.speaking} onLuuLai={() => luuLai('speaking')} />
        <ODiemMt lon cell={c} mo={mo} onMo={onMo} onTiep={onTiep} onSave={(p, x) => save('speaking', p, x)} tuanXem={r.weekStart}
          ctx={{ tenHv: r.studentName, lop: r.classCode, luot: `MT${r.attemptNo}`, kyVong: r.kyVong }} />
      </div>
    </li>
  );
}
