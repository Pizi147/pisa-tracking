import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { ErrorState, Level, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ChipHan, Nhan } from '../../ui/Nhan.tsx';
import { BoiCanh, CanLam } from '../../ui/KhuonViec.tsx';
import { skillShort, sosTone } from '../../lib/format.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { NganCase } from './NganCase.tsx';
import { DongDaLuu, GhiNhanh, type DaLuuNhanh } from '../cases/GhiNhanh.tsx';
import { OPhuHuynh } from './HocVienTheoVai.tsx';
import { chuChuaNguyenNhan, type CaseTomTat } from './BangSos.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { LOAI_HAN_CUA_VIEC, NHAN_NHOM_XU_LY, thuNgay, vaiXemHocVien, type GiaiDoanSauThi, type LienHe } from '@shared/domain/index.ts';
import { HopGiaHan, NhanSauThi } from './HopGiaHan.tsx';
import { KetQuaThiThatPanel } from './KetQuaThiThatPanel.tsx';
import { PanelBuocTiep } from './PanelBuocTiep.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';

/** `GET /hoc-vien-lop/em/:id` (server/src/classes/hocVienSos.ts → panelMotEm). */
type DuLieuEm = {
  em: { id: number; ten: string; ma: string; lop: { id: number; code: string; ft: boolean } | null; tvv: string | null; lienHe: LienHe };
  luot: { nhan: string | null; sosLevel: number | null } | null;
  cases: CaseTomTat[];
  /** OV-13q: lộ trình FT mới nhất đã thi chưa xong (`sauThiCuaEm`) + nút người xem bấm được. */
  sauThi: { cycleId: number; giaiDoan: GiaiDoanSauThi; ngayThi: string | null; han: string | null; quaHan: boolean; daGiaHan: boolean;
    coTheNhap: boolean; coTheChon: boolean; coTheGiaHan: boolean } | null;
};
type ViecCase = NonNullable<Parameters<typeof NganCase>[0]['viec']>;

const TONE_NHOM = { 'cho-duyet': 'wait', 'dang-xu-ly': 'doing', xong: 'done' } as const;
/** Việc ở Công việc → view của Ngăn Case (cùng `PanelViec`). */
const VIEC_CUA_NHOM: Record<string, ViecCase> = { xac_nhan_pa: 'xac-nhan-pa', ghi_ket_qua_pa: 'ghi-ket-qua', mini_test: 'ghi-ket-qua', no_plan: 'them-pa', cause: 'xac-nhan', ghi_nhan_xet: 'ghi-nhan-xet' };
/** Nút chính = động từ của việc (panel v3 §1: một nút chính, chữ = động từ việc). */
const NUT_CUA_NHOM: Record<string, string> = {
  xac_nhan_pa: t('Xác nhận PA'), ghi_ket_qua_pa: t('Ghi kết quả'), mini_test: t('Ghi Mini Test'), no_plan: t('Thêm PA'), cause: t('Xác nhận Case'), ghi_nhan_xet: t('Ghi nhận xét'),
};

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
  /* OV-13b: lần ghi nhanh vừa lưu theo Case — dòng "✓ Đã lưu · … · Hoàn tác" đứng lại sau khi việc rời danh sách. */
  const [daLuu, setDaLuu] = useState<ReadonlyMap<number, DaLuuNhanh>>(new Map());
  /* OV-13q: việc sau thi THAY nội dung panel (như Ngăn Case, "← tên em"); Gia hạn là hộp nhỏ đè. */
  const [sauThiMo, setSauThiMo] = useState<'thi-that' | 'buoc-tiep' | null>(null);
  const [giaHan, setGiaHan] = useState(false);
  const { homNay } = useNgayNghiepVu();

  const daDoi = () => { reload(); work.reload(); invalidate('/hoc-vien-lop'); onDoi?.(); };
  const ten = data?.em.ten ?? t('Học viên');
  const lop = data?.em.lop?.code ?? null;

  const veEm = { nhan: ten, onClick: () => { setSauThiMo(null); reload(); } };
  if (sauThiMo && data?.sauThi) {
    return sauThiMo === 'thi-that'
      ? <KetQuaThiThatPanel cycleId={data.sauThi.cycleId} studentName={ten} lop={lop} quayLai={veEm} onClose={onClose} onDone={daDoi} />
      : <PanelBuocTiep cycleId={data.sauThi.cycleId} hocVien={{ id: studentId, ten }} lop={lop} quayLai={veEm} onClose={onClose} onDone={daDoi} />;
  }
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
  /* OV-12e — đầu panel v3 chung (mockup v3 §9): tên em · chip hạn = việc gấp nhất của người xem / Hồ sơ ↗ · lớp · lượt · SOS. */
  const gapNhat = (work.data?.dong ?? []).flatMap((x) => (x.con?.length ? x.con : [x]))
    .filter((x) => x.studentId === studentId && VIEC_CUA_NHOM[x.group] && x.due && LOAI_HAN_CUA_VIEC[x.group])
    .sort((a, b) => a.due!.localeCompare(b.due!))[0];
  const dau = {
    han: gapNhat ? <ChipHan loai={LOAI_HAN_CUA_VIEC[gapNhat.group]!} han={gapNhat.due} /> : null,
    dong2: data ? [
      <Link className="link inline-flex min-h-[44px] items-center sm:min-h-0" to={`/hoc-vien/${studentId}`}>{t('Hồ sơ')} <span aria-hidden className="text-xs">↗</span></Link>,
      lop, data.luot?.nhan ? dich(data.luot.nhan) : null,
      data.luot?.sosLevel ? <Level tone={sosTone(data.luot.sosLevel)}>SOS {data.luot.sosLevel}</Level> : null,
    ] : [],
  };

  return (
    <KhungPanel tieuDe={ten} dau={dau} onDong={onClose} chan={{ huy: { nhan: t('Đóng'), onClick: onClose } }}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : !data ? <div className="pt-3"><Skeleton rows={6} /></div>
          : (
            <div className="space-y-2 pt-2">
              {data.sauThi && (
                /* OV-13q: dòng trạng thái sau thi + nút làm việc (cùng hàm với việc Công việc; nút theo quyền máy chủ). */
                <CanLam>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 max-sm:basis-full">
                      <NhanSauThi s={data.sauThi} />
                      {data.sauThi.ngayThi && <span className="mt-1 block text-xs text-slate-400">{t('Đã thi {ngay}', { ngay: thuNgay(data.sauThi.ngayThi, homNay) })}</span>}
                    </span>
                    {data.sauThi.coTheGiaHan && <button type="button" className="btn min-h-[44px] max-sm:flex-1 sm:min-h-[36px]" onClick={() => setGiaHan(true)}>{t('Gia hạn')}</button>}
                    {data.sauThi.giaiDoan === 'da_thi_cho_kq' && data.sauThi.coTheNhap && (
                      <button type="button" className="btn btn-primary min-h-[44px] max-sm:flex-1 sm:min-h-[36px]" onClick={() => setSauThiMo('thi-that')}>{t('Nhập kết quả')}</button>
                    )}
                    {data.sauThi.giaiDoan === 'cho_buoc_tiep' && data.sauThi.coTheChon && (
                      <button type="button" className="btn btn-primary min-h-[44px] max-sm:flex-1 sm:min-h-[36px]" onClick={() => setSauThiMo('buoc-tiep')}>{t('Chọn bước tiếp')}</button>
                    )}
                  </div>
                  {giaHan && <HopGiaHan x={data.sauThi} hocVien={ten} lop={lop} onClose={() => setGiaHan(false)} onDone={daDoi} />}
                </CanLam>
              )}
              {chiDoc && (
                <div className="flex items-start gap-3 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--line)' }}>
                  <span className="w-20 shrink-0 text-xs text-slate-500">{t('Phụ huynh')}</span>
                  <span className="min-w-0 flex-1"><OPhuHuynh l={data.em.lienHe} /></span>
                  {data.em.lienHe.parentPhone && <a className="btn btn-sm min-h-[44px] sm:min-h-[32px]" href={`tel:${data.em.lienHe.parentPhone.replace(/[^\d+]/g, '')}`}>{t('Gọi')}</a>}
                </div>
              )}
              {!cases.length && <p className="m-0 py-3 text-sm text-slate-400">{t('Em chưa có Case nào.')}</p>}
              {cases.map((c) => {
                const viec = viecCua(c.id);
                const m = dangMo(c);
                return (
                  <section key={c.id} className={`rounded-lg border ${c.done ? 'opacity-70' : ''}`} style={{ borderColor: 'var(--line)' }} aria-label={`Case ${c.kyNang ? dich(c.kyNang) : ''}`}>
                    <button type="button" aria-expanded={m} onClick={() => doiMo(c)}
                      className="flex min-h-[44px] w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-3 py-2 text-left">
                      <svg aria-hidden viewBox="0 0 8 8" width="8" height="8" className={`shrink-0 text-slate-400 transition-transform ${m ? 'rotate-90' : ''}`}>
                        <path d="M2.5 1 6 4 2.5 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="shrink-0 text-sm font-bold text-slate-100">{c.topic ? skillShort(c.topic) : 'Case'}{c.attemptNo ? <span className="font-normal text-slate-400"> · MT{c.attemptNo}</span> : null}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-slate-300 max-sm:overflow-visible max-sm:whitespace-normal max-sm:break-words">{c.nguyenNhan ? dich(c.nguyenNhan) : chuChuaNguyenNhan(c, true)}</span>
                      {!m && viec.length > 0 && <span className="shrink-0 text-xs font-semibold text-[color:var(--accent)]">{dich(viec[0].tieuDe)}</span>}
                      <Nhan tone={TONE_NHOM[c.nhom]}>{t(NHAN_NHOM_XU_LY[c.nhom])}</Nhan>
                    </button>
                    {m && (
                      <div className="space-y-2.5 border-t px-3 pb-3 pt-2.5" style={{ borderColor: 'var(--line)' }}>
                        {daLuu.get(c.id) && (
                          <DongDaLuu kq={daLuu.get(c.id)!} onHoanTac={() => { setDaLuu((m) => { const x = new Map(m); x.delete(c.id); return x; }); daDoi(); }} />
                        )}
                        {viec.map((v) => v.group === 'ghi_ket_qua_pa' && v.ghiNhanh && v.paId ? (
                          /* OV-13b (mockup OV-13 §1): Kết quả PA ghi nhanh ngay trong khối; "Điều chỉnh / Kết thúc…" mở Ngăn Case (panel lớn). */
                          <div key={v.key} className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="min-w-0 flex-1 text-sm font-bold text-slate-100">{dich(v.tieuDe)}</span>
                              {v.due && <ChipHan loai="cap-nhat-pa" han={v.due} />}
                            </div>
                            <GhiNhanh paId={v.paId} onDaLuu={(kq) => { setDaLuu((m) => new Map(m).set(c.id, kq)); daDoi(); }}
                              onMoPanel={() => setView({ caseId: c.id, viec: 'ghi-ket-qua', paId: v.paId ?? null })} />
                          </div>
                        ) : (
                          /* Khối Cần làm chung (`CanLam`, panel v3 §1): tên việc + chip hạn (`ChipHan`, 3 mức), một nút chính = động từ việc. */
                          <CanLam key={v.key}>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-slate-100">{dich(v.tieuDe)}</span>
                                {v.owner && <span className="block text-xs text-slate-400">{dich(v.owner)}</span>}
                              </span>
                              {v.due && LOAI_HAN_CUA_VIEC[v.group] && <ChipHan loai={LOAI_HAN_CUA_VIEC[v.group]!} han={v.due} />}
                              <button type="button" className="btn btn-primary min-h-[44px] max-sm:w-full sm:min-h-[36px]"
                                onClick={() => setView({ caseId: c.id, viec: VIEC_CUA_NHOM[v.group], paId: v.paId ?? null })}>
                                {NUT_CUA_NHOM[v.group] ?? t('Mở')}
                              </button>
                            </div>
                          </CanLam>
                        ))}
                        {!viec.length && c.viecTiep && (
                          <p className="m-0 text-xs text-slate-400">{t('Việc tiếp')}: <span className="text-slate-200">{dich(c.viecTiep.chu)}</span>
                            {c.viecTiep.quaHan && <span className="font-semibold text-late"> · ⚠ {t('quá hạn')}</span>}</p>
                        )}
                        {/* Bối cảnh chung (`BoiCanh`, ≤ 3 dòng). */}
                        <BoiCanh dong={[
                          [t('Nguyên nhân'), <>{c.nguyenNhan ? dich(c.nguyenNhan) : chuChuaNguyenNhan(c)}{c.nhanXet && <span className="block text-slate-400">“{c.nhanXet}”</span>}</>],
                          [t('Phương án'), c.pa.length ? c.pa.map((p) => (
                            <span key={p.id} className="block">{dich(p.ten)}{p.nguoi ? ` · ${p.nguoi}` : ''}{p.choXacNhan ? ` · ${t('chờ xác nhận')}` : p.xong ? ` · ${t('đã khép')}` : ''}</span>
                          )) : t('Chưa có PA')],
                          [t('Kết quả gần nhất'), c.ketQua ? dich(c.ketQua) : t('Chưa có kết quả')],
                        ]} />
                        <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-xs sm:min-h-0" onClick={() => setView({ caseId: c.id })}>{t('Xem thêm ›')}</button>
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

