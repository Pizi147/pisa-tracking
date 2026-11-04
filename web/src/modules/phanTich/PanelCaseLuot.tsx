import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import type { CaseTomTat } from '../students/BangSos.tsx';
import { KN_THI, NHAN_NHOM_XU_LY, duongHoSoHocVien, ngay, tuanLich, type DongMock } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

const TEN_KN: Record<(typeof KN_THI)[number], string> = { listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking' };
const TONE_NHOM = { 'cho-duyet': 'muted', 'dang-xu-ly': 'doing', xong: 'done' } as const;
/** Link chữ thường (U08-6): màu chữ, không gạch; rê / focus bàn phím → accent + gạch chân + vòng focus. */
export const LINK_CHU = 'rounded-sm text-[color:var(--text)] no-underline hover:text-[color:var(--accent)] hover:underline hover:underline-offset-[3px] focus-visible:text-[color:var(--accent)] focus-visible:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]';

/**
 * PANEL CASE THEO KỸ NĂNG CỦA MỘT LƯỢT MT (U08-4, mockup V11 `a3p`) — bấm chip SOS ở Kết quả Test › Mock Test. CHỈ ĐỌC (G8): mỗi kỹ năng dưới kỳ vọng
 * một khối mở rộng được, khối đầu mở sẵn — Case (trạng thái · nguyên nhân) · Phụ trách + hạn · PA · Kết quả PA; kỹ năng chưa có Case → "Chưa có Case".
 * Thay cột "Xử lý" (U08-3). Turso: MỘT `GET /hoc-vien-lop/em/:id` khi bấm (đường sẵn có của panel một em), không nạp sẵn.
 */
export function PanelCaseLuot({ r, onDong }: { r: DongMock; onDong: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const { data, error, reload } = useApi<{ cases: CaseTomTat[] }>(`/hoc-vien-lop/em/${r.studentId}`, [r.studentId]);
  const kn = KN_THI.filter((k) => r.kn[k].dat === false);
  const [mo, setMo] = useState<Set<string>>(() => new Set(kn.slice(0, 1)));
  const doi = (k: string) => setMo((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const caseCua = (k: string) => (data?.cases ?? []).filter((c) => c.attemptId === r.attemptId && (c.topic ?? '').startsWith(k));
  const dong = (nhan: string, v: ReactNode) => (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] items-baseline gap-2"><span className="text-[13px] text-faint">{nhan}</span><span>{v}</span></div>
  );
  return (
    <KhungPanel tieuDe={`${r.ten} · MT${r.mt}`} rong="rong" onDong={onDong} loai={t('CASE · KẾT QUẢ TEST')}
      dau={{
        tieu: <><Link className={LINK_CHU} to={duongHoSoHocVien(r.studentId)}>{r.ten}</Link><span className="text-dim">·</span>MT{r.mt}{r.sos ? <> <span className="text-dim">·</span> <ChipSos muc={r.sos} tam={r.sosTam} tinh /></> : null}</>,
        dong2: [<Link key="l" className={`${LINK_CHU} !text-dim`} to={`/hoc-vien/lop/${r.classId}`}>{r.lop}</Link>, tuanLich(r.tuan, homNay), t('{n} kỹ năng dưới kỳ vọng', { n: kn.length })],
      }}
      chan={{ huy: { nhan: t('Đóng'), onClick: onDong } }}>
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : !data ? <div className="pt-3"><Skeleton rows={4} /></div>
          : (
            <div className="grid gap-2.5 pt-3">
              {kn.map((k) => {
                const cs = caseCua(k);
                const m = mo.has(k);
                return (
                  <div key={k} className="rounded-[10px] border bg-[color:var(--bg)]" style={{ borderColor: 'var(--line)' }}>
                    <button type="button" aria-expanded={m} onClick={() => doi(k)}
                      className="flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent px-3.5 py-2.5 text-left text-[15px] font-semibold text-slate-100">
                      <span aria-hidden>{m ? '▾' : '▸'}</span>{TEN_KN[k]}
                      <span className="inline-flex h-[22px] items-center rounded border border-bad-line px-2 text-sm font-semibold text-bad tabular-nums">✗ {r.kn[k].band?.toFixed(1)}</span>
                      {r.kyVong != null && <span className="text-[13px] font-medium text-faint">{t('kỳ vọng {kv}', { kv: r.kyVong.toFixed(1) })}</span>}
                      <span className="ml-auto">{cs.length ? <Nhan tone={TONE_NHOM[cs[0].nhom]}>{t(NHAN_NHOM_XU_LY[cs[0].nhom])}</Nhan> : <span className="text-[13px] font-medium text-faint">{t('Chưa có Case')}</span>}</span>
                    </button>
                    {m && (
                      <div className="grid gap-2.5 pb-3 pl-[38px] pr-3.5 text-sm">
                        {!cs.length ? <span className="text-faint">{t('Chưa có Case')}</span> : cs.map((c) => {
                          const paDang = c.pa.filter((p) => !p.xong);
                          const nguoi = c.viecTiep?.nguoi ?? paDang[0]?.nguoi ?? null;
                          return (
                            <div key={c.id} className="grid gap-2.5" data-case-id={c.id}>
                              {dong('Case', [c.nguyenNhan && dich(c.nguyenNhan), c.nhanXet].filter(Boolean).join(' — ') || dich(c.trangThai))}
                              {dong(t('Phụ trách'), nguoi ? <>{nguoi}{c.viecTiep?.han ? ` · ${t('hạn {ngay}', { ngay: ngay(c.viecTiep.han, homNay) })}` : ''}</> : <span className="text-faint">—</span>)}
                              {dong('PA', paDang.length ? paDang.map((p) => p.ten).join(' · ') : <span className="text-faint">—</span>)}
                              {dong(t('Kết quả PA'), c.ketQua ? <>{dich(c.ketQua)}{c.ketQuaNgay ? <span className="text-faint"> · {tuanLich(c.ketQuaNgay, homNay)}</span> : null}</> : <span className="text-faint">–</span>)}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {!kn.length && <p className="m-0 text-sm text-faint">{t('Chưa có kỹ năng dưới kỳ vọng.')}</p>}
            </div>
          )}
    </KhungPanel>
  );
}
