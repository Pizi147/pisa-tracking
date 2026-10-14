import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { ErrorState, Level, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { Han } from '../../ui/Han.tsx';
import { skillShort, sosTone } from '../../lib/format.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { NganCase } from './NganCase.tsx';
import { OPhuHuynh } from './HocVienTheoVai.tsx';
import type { CaseTomTat } from './BangSos.tsx';
import { LOAI_HAN_CUA_VIEC, NHAN_NHOM_XU_LY, vaiXemHocVien, type LienHe } from '@shared/domain/index.ts';

/** `GET /hoc-vien-lop/em/:id` (server/src/classes/hocVienSos.ts → panelMotEm). */
type DuLieuEm = {
  em: { id: number; ten: string; ma: string; lop: { id: number; code: string; ft: boolean } | null; tvv: string | null; lienHe: LienHe };
  luot: { nhan: string | null; sosLevel: number | null } | null;
  cases: CaseTomTat[];
};
type ViecCase = NonNullable<Parameters<typeof NganCase>[0]['viec']>;

const TONE_NHOM = { 'cho-duyet': 'wait', 'dang-xu-ly': 'doing', xong: 'done' } as const;
/** Việc ở Công việc → view của Ngăn Case (cùng `PanelViec`). */
const VIEC_CUA_NHOM: Record<string, ViecCase> = { xac_nhan_pa: 'xac-nhan-pa', ghi_ket_qua_pa: 'ghi-ket-qua', mini_test: 'ghi-ket-qua', no_plan: 'them-pa', cause: 'xac-nhan' };
/** Nút chính = động từ của việc (panel v3 §1: một nút chính, chữ = động từ việc). */
const NUT_CUA_NHOM: Record<string, string> = { xac_nhan_pa: 'Xác nhận PA', ghi_ket_qua_pa: 'Ghi kết quả', mini_test: 'Ghi Mini Test', no_plan: 'Thêm PA', cause: 'Xác nhận Case' };

/**
 * PANEL MỘT EM (OV-12f, mockup panel v3 §9, mockup 3 v2 P1–P3) — Học viên & Lớp › Mở ở MỌI góc. Một `KhungPanel`: đầu = tên em (↗ hồ sơ là link xem,
 * tách khỏi nút làm việc) · lớp · lượt · SOS. Mỗi Case một dòng (kỹ năng · nguyên nhân · trạng thái chữ); Case có việc của người xem mở sẵn với khối
 * Cần làm (việc lấy từ `/my-work` — cùng nguồn Công việc / góc Cần làm), Case khác gập. Bấm việc → Ngăn Case sẵn có THAY nội dung panel ("← tên em"),
 * lưu xong về đúng panel này (không panel lồng panel). TVV / CX chỉ đọc + Phụ huynh.
 */
export function PanelMotEm({ studentId, caseMo, onClose, onDoi }: {
  studentId: number;
  /** Case của việc vừa bấm — mở sẵn, đưa lên đầu. */
  caseMo?: number | null;
  onClose: () => void; onDoi?: () => void;
}) {
  const { session } = useSession();
  const vai = vaiXemHocVien(session?.roles);
  const chiDoc = vai === 'tvv' || vai === 'cx';
  /* QL / Quản trị làm thay được mọi việc trong phạm vi → đọc "Của GV" (tất cả); GV chỉ việc của mình. */
  const xemTatCa = !!session?.nav?.workOps;
  const { data, error, reload } = useApi<DuLieuEm>(`/hoc-vien-lop/em/${studentId}`, [studentId]);
  const work = useApi<{ dong: WorkItem[] }>(chiDoc ? null : `/my-work${xemTatCa ? '?nguoi=tat-ca' : ''}`);
  const [view, setView] = useState<{ caseId: number; viec?: ViecCase; paId?: number | null } | null>(null);
  const [mo, setMo] = useState<Set<number>>(() => new Set(caseMo ? [caseMo] : []));

  const daDoi = () => { reload(); work.reload(); invalidate('/hoc-vien-lop'); onDoi?.(); };
  const ten = data?.em.ten ?? 'Học viên';
  const lop = data?.em.lop?.code ?? null;

  if (view) {
    return (
      <NganCase key={`${view.caseId}:${view.viec ?? ''}:${view.paId ?? ''}`} caseId={view.caseId} viec={view.viec} paId={view.paId}
        hocVien={ten} lop={lop} onClose={onClose} onChanged={daDoi} veNguon={{ nhan: ten, onClick: () => setView(null) }} />
    );
  }

  const viecCua = (caseId: number) => (work.data?.dong ?? []).flatMap((x) => (x.con?.length ? x.con : [x]))
    .filter((x) => x.caseId === caseId && x.studentId === studentId && VIEC_CUA_NHOM[x.group]);
  const cases = [...(data?.cases ?? [])].sort((a, b) => Number(b.id === caseMo) - Number(a.id === caseMo)
    || Number(viecCua(b.id).length > 0) - Number(viecCua(a.id).length > 0));
  /* Case có việc của người xem mở sẵn (TVV / CX gập hết). */
  const dangMo = (c: CaseTomTat) => mo.has(c.id) || (!chiDoc && viecCua(c.id).length > 0 && !mo.has(-c.id));
  const doiMo = (c: CaseTomTat) => setMo((cu) => {
    const s = new Set(cu);
    if (dangMo(c)) { s.delete(c.id); s.add(-c.id); } else { s.add(c.id); s.delete(-c.id); }
    return s;
  });
  const nganCanh = data && (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <Link className="link" to={`/hoc-vien/${studentId}`}>Hồ sơ <span aria-hidden className="text-xs">↗</span></Link>
      {lop && <><span aria-hidden>·</span><span>{lop}</span></>}
      {data.luot?.nhan && <><span aria-hidden>·</span><span>{data.luot.nhan}</span></>}
      {!!data.luot?.sosLevel && <Level tone={sosTone(data.luot.sosLevel)}>SOS {data.luot.sosLevel}</Level>}
    </span>
  );

  return (
    <KhungPanel tieuDe={ten} ngCanh={nganCanh} onDong={onClose} chan={{ huy: { nhan: 'Đóng', onClick: onClose } }}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : !data ? <div className="pt-3"><Skeleton rows={6} /></div>
          : (
            <div className="space-y-2 pt-2">
              {chiDoc && (
                <div className="flex items-start gap-3 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--line)' }}>
                  <span className="w-20 shrink-0 text-xs text-slate-500">Phụ huynh</span>
                  <span className="min-w-0 flex-1"><OPhuHuynh l={data.em.lienHe} /></span>
                  {data.em.lienHe.parentPhone && <a className="btn btn-sm min-h-[44px] sm:min-h-[32px]" href={`tel:${data.em.lienHe.parentPhone.replace(/[^\d+]/g, '')}`}>Gọi</a>}
                </div>
              )}
              {!cases.length && <p className="m-0 py-3 text-sm text-slate-400">Em chưa có Case nào.</p>}
              {cases.map((c) => {
                const viec = viecCua(c.id);
                const m = dangMo(c);
                return (
                  <section key={c.id} className={`rounded-lg border ${c.done ? 'opacity-70' : ''}`} style={{ borderColor: 'var(--line)' }} aria-label={`Case ${c.kyNang ?? ''}`}>
                    <button type="button" aria-expanded={m} onClick={() => doiMo(c)}
                      className="flex min-h-[44px] w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-3 py-2 text-left">
                      <svg aria-hidden viewBox="0 0 8 8" width="8" height="8" className={`shrink-0 text-slate-400 transition-transform ${m ? 'rotate-90' : ''}`}>
                        <path d="M2.5 1 6 4 2.5 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="shrink-0 text-sm font-bold text-slate-100">{c.topic ? skillShort(c.topic) : 'Case'}{c.attemptNo ? <span className="font-normal text-slate-400"> · MT{c.attemptNo}</span> : null}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-slate-300">{c.nguyenNhan ?? 'chưa xác nhận nguyên nhân'}</span>
                      {!m && viec.length > 0 && <span className="shrink-0 text-xs font-semibold text-[color:var(--accent)]">{viec[0].tieuDe}</span>}
                      <Nhan tone={TONE_NHOM[c.nhom]}>{NHAN_NHOM_XU_LY[c.nhom]}</Nhan>
                    </button>
                    {m && (
                      <div className="space-y-2.5 border-t px-3 pb-3 pt-2.5" style={{ borderColor: 'var(--line)' }}>
                        {viec.map((v) => (
                          /* Khối Cần làm — khối DUY NHẤT có màu (panel v3 §1): tên việc + chip hạn, một nút chính = động từ việc. */
                          <div key={v.key} className="flex flex-wrap items-center gap-2 rounded-[4px_10px_10px_4px] border-l-[3px] px-3 py-2.5"
                            style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold text-slate-100">{v.tieuDe}</span>
                              <span className="block text-xs text-slate-400">
                                {v.owner ? `${v.owner} · ` : ''}{v.due && LOAI_HAN_CUA_VIEC[v.group] ? <Han loai={LOAI_HAN_CUA_VIEC[v.group]!} han={v.due} /> : null}
                              </span>
                            </span>
                            <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-[36px]"
                              onClick={() => setView({ caseId: c.id, viec: VIEC_CUA_NHOM[v.group], paId: v.paId ?? null })}>
                              {NUT_CUA_NHOM[v.group] ?? 'Mở'}
                            </button>
                          </div>
                        ))}
                        {!viec.length && c.viecTiep && (
                          <p className="m-0 text-xs text-slate-400">Việc tiếp: <span className="text-slate-200">{c.viecTiep.chu}</span>
                            {c.viecTiep.quaHan && <span className="font-semibold text-late"> · ⚠ quá hạn</span>}</p>
                        )}
                        <dl className="m-0 grid grid-cols-[6.5rem_minmax(0,1fr)] sm:grid-cols-[8.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13px]">
                          <dt className="text-slate-500">Nguyên nhân</dt>
                          <dd className="m-0 text-slate-300">{c.nguyenNhan ?? 'chưa xác nhận'}{c.nhanXet && <span className="block text-slate-400">“{c.nhanXet}”</span>}</dd>
                          <dt className="text-slate-500">Phương án</dt>
                          <dd className="m-0 text-slate-300">{c.pa.length ? c.pa.map((p) => (
                            <span key={p.id} className="block">{p.ten}{p.nguoi ? ` · ${p.nguoi}` : ''}{p.choXacNhan ? ' · chờ xác nhận' : p.xong ? ' · đã khép' : ''}</span>
                          )) : 'Chưa có PA'}</dd>
                          <dt className="text-slate-500">Kết quả gần nhất</dt>
                          <dd className="m-0 text-slate-300">{c.ketQua ?? 'Chưa có kết quả'}</dd>
                        </dl>
                        <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-xs" onClick={() => setView({ caseId: c.id })}>Xem thêm ›</button>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
    </KhungPanel>
  );
}

