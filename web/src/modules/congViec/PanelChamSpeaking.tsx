import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { duongHoSoHocVien, soSanhLop, tuanLich } from '@shared/domain/index.ts';
import { apDiemVuaLuu, suaDuoc, useSaveScore, type Cell } from '../fasttrack/ScoreEntry.tsx';
import { ODiemMt } from '../fasttrack/HopNhapDiem.tsx';
import { DauLuu, DauO, VIEN_LOI, type PhienO } from '../cham/LuoiFT.tsx';
import { usePhienCham } from '../cham/phienCham.ts';
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
const sap = (a: Dong, b: Dong) => soSanhLop({ code: a.classCode }, { code: b.classCode }) || a.studentName.localeCompare(b.studentName, 'vi') || a.attemptNo - b.attemptNo;

/**
 * CHẤM SPEAKING (OV-14c, chủ SP 18/10) — panel của việc "Chấm Speaking · n bài" (GV Speaking chấm chéo S Mock lớp FT chi nhánh mình).
 * Tìm học viên (tên / email, có / không dấu) + lọc lớp; mỗi dòng một em: tên · lớp · MT · tuần · "Nhập bởi …" khi đã có điểm. Ô S = hộp chấm
 * sẵn có (`ODiemMt` → `HopNhapDiem`: 4 tiêu chí + nhận xét), Enter / "Lưu · bài tiếp ›" sang em chưa chấm kế tiếp trong danh sách đang lọc (R1-LUU-TIEP:
 * ảnh chụp thứ tự lúc mở hộp, vòng lên; hết → "Đã xong phần của bạn").
 * Dòng vừa lưu đứng nguyên chỗ (bài còn tồn cũ rời hàng đợi máy chủ sau khi chấm — vẫn giữ để thấy đã lưu).
 */
export function PanelChamSpeaking({ onDong, onDaLam, lopDau = null }: { onDong: () => void; onDaLam: () => void;
  /** UI-CHAM-TEST: mở từ một lớp ở Chấm Test — lọc sẵn lớp đó (đổi được). */
  lopDau?: number | null;
}) {
  const { data, error, reload } = useApi<{ rows: Dong[]; soBai: number }>('/my-work/cham-speaking');
  const [q, setQ] = useState('');
  const [lop, setLop] = useState<number | null>(lopDau);
  const [mo, setMo] = useState<number | null>(null);
  const phien = usePhienCham();
  const [giu, setGiu] = useState<ReadonlyMap<number, Dong>>(new Map());
  const rows = useMemo(() => {
    const co = new Set((data?.rows ?? []).map((r) => r.attemptId));
    return [...(data?.rows ?? []), ...[...giu.values()].filter((r) => !co.has(r.attemptId))].sort(sap);
  }, [data, giu]);
  const dsLop = useMemo(() => [...new Map(rows.map((r) => [r.classId, r.classCode])).entries()], [rows]);
  /* SUA-CHAM-LAI Đ9: bài chờ chấm trước, bài đã có điểm (xem lại) thành nhóm riêng sau — số đầu panel = nhóm đầu. Dòng vừa lưu ở phiên này (`giu`)
     đứng nguyên trong nhóm đầu, không nhảy xuống. */
  const ds = useMemo(() => {
    const k = chuan(q);
    const loc = rows.filter((r) => (lop === null || r.classId === lop) && (!k || chuan(r.studentName).includes(k) || chuan(r.studentEmail ?? '').includes(k)));
    const dau = (r: Dong) => r.cho || giu.has(r.attemptId);
    return [...loc.filter(dau), ...loc.filter((r) => !dau(r))];
  }, [rows, q, lop, giu]);
  const soDau = ds.filter((r) => r.cho || giu.has(r.attemptId)).length;
  /* Lớp đang lọc không còn bài nào (đã chấm hết, rời hàng đợi) → bỏ lọc. */
  useEffect(() => { if (lop !== null && !dsLop.some(([id]) => id === lop)) setLop(null); }, [dsLop, lop]);

  const dau = { dong2: [data ? t('{n} bài chờ chấm', { n: data.soBai }) : null] };
  /* R1-LUU-TIEP: khoá = lượt (một dòng một bài S); còn thiếu = máy chủ còn báo chờ (`cho`) và người xem sửa được. */
  const dsAid = () => ds.map((r) => r.attemptId);
  const conThieu = (v: { khoa: number }) => { const x = ds.find((r) => r.attemptId === v.khoa); return !!x && x.cho && suaDuoc(x.cell); };
  const keMo = mo !== null && !phien.het ? phien.ke({ khoa: mo, kyNang: 'speaking' }, conThieu, [], dsAid) : null;
  const hop: PhienO = {
    nhanTiep: keMo ? ds.find((r) => r.attemptId === keMo.khoa)?.studentName ?? null : null,
    ketThuc: phien.het ? { phamVi: t('Chấm Speaking'), daLuu: phien.soDaLuu(), nut: null } : null,
  };
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
                      <Fragment key={r.attemptId}>
                        {i === soDau && (
                          <li className="border-t px-4 pt-3 pb-1.5 text-[13px] font-semibold text-slate-400" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
                            {t('Đã có điểm · {n} bài', { n: ds.length - soDau })}
                          </li>
                        )}
                        <DongSpeaking r={r} mo={mo === r.attemptId} hop={mo === r.attemptId ? hop : null}
                          onMo={(m) => { if (m) phien.mo(dsAid); else phien.dong(); setMo(m ? r.attemptId : null); }}
                          onTiep={(d) => { const k = phien.tiep({ khoa: r.attemptId, kyNang: 'speaking' }, d, conThieu, [], dsAid); if (k) setMo(k.khoa); }}
                          onDaLuu={() => { setGiu((m) => new Map(m).set(r.attemptId, r)); reload(); onDaLam(); }} />
                      </Fragment>
                    ))}
                  </ul>
                )}
              </div>
            )}
    </KhungPanel>
  );
}

function DongSpeaking({ r, mo, hop, onMo, onTiep, onDaLuu }: { r: Dong; mo: boolean; hop: PhienO | null; onMo: (mo: boolean) => void; onTiep: (daLuu: boolean) => void; onDaLuu: () => void }) {
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
        <ODiemMt lon cell={c} mo={mo} onMo={onMo} onTiep={onTiep} onSave={(p, x) => save('speaking', p, x)} tuanXem={r.weekStart} {...hop}
          ctx={{ tenHv: r.studentName, lop: r.classCode, luot: `MT${r.attemptNo}`, kyVong: r.kyVong }} />
      </div>
    </li>
  );
}
