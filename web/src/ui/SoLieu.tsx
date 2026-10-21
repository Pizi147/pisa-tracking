import { Suspense, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { INTERVENTION_KIND_LABEL, METRIC_UNIT_LABEL, deadlineView, metricById, nhanQuaHan, thamSoCt, type ChiSo, type ChuongTrinh, type DeadlineKind } from '@shared/domain/index.ts';
import { useApi } from '../lib/useApi.ts';
import { useMoSoLieu, useThamSoUrl } from '../lib/quayLai.ts';
import { api, invalidate, type ApiError } from '../lib/api.ts';
import { useSession } from '../lib/session.tsx';
import { KhungPanel } from './KhungPanel.tsx';
import { CanLam, NutChu } from './KhuonViec.tsx';
import { ChipHan, ChipSoQuaHan } from './Nhan.tsx';
import { PhanTrang, usePhanTrang } from './PhanTrang.tsx';
import { Empty, ErrorState, OChiSo, Skeleton } from './ui.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { lazyTai } from '../lib/taiLaiManh.ts';

/**
 * KHUNG-LOI (B-02): vùng bấm của số ≥ 24 × 24 px máy tính, 44 × 44 px điện thoại — `after:` canh giữa chữ số (hình chữ không đổi; trước đây
 * chỉ đúng chữ số, 8 × 12 px). Mẫu chip của `MenuDong`.
 */
/** NEN-V5 — dáng số bấm được (`OSo`, ô chỉ số): màu nhấn, đậm, gạch chân liền 1 px; rê chuột nền nhấn nhạt. */
export const LOP_OSO = 'appearance-none rounded border-0 bg-transparent p-0 cursor-pointer tabular-nums font-bold text-[color:var(--accent)] underline decoration-1 underline-offset-[3px] hover:bg-[color:var(--accent-soft)]';
/** Màu chữ của nơi gọi: màu nghĩa (quá hạn, chưa đạt) giữ; màu chữ thường (`text-slate-*`, dáng cũ) bỏ để số bấm được cùng một màu nhấn. */
export const mauOSo = (lop: string) => (/\btext-(bad|late|soon)\b/.test(lop) ? `${LOP_OSO.replace('text-[color:var(--accent)] ', '')} ${lop}` : `${LOP_OSO} ${lop.replace(/\btext-slate-\d+\b/g, '')}`);
export const VUNG_BAM_SO = "relative after:absolute after:left-1/2 after:top-1/2 after:h-6 after:w-6 after:min-w-full after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] max-sm:after:h-11 max-sm:after:w-11";

const THOI_GIAN_NHAN: Record<ChiSo['thoiGian'], string> = {
  'hien-trang': t('Hiện trạng — tính tại ngày dữ liệu'),
  'phat-sinh-trong-ky': t('Phát sinh trong kỳ'),
  'ket-qua-trong-ky': t('Kết quả trong kỳ'),
};

export type PhamViSoLieu = { branchId?: number | null; chuongTrinh?: ChuongTrinh | null };
/** OV-12e (P12): việc của một dòng — máy chủ `ViecDong` (`server/src/worklist/metrics.ts`). `lam` = người xem làm được; máy chủ vẫn kiểm quyền khi lưu. */
export type ViecDongSoLieu = {
  chu: string;
  loai: 'xac-nhan' | 'ghi-nhan-xet' | 'xac-nhan-pa' | 'ghi-ket-qua' | 'them-pa' | 'hoan-thanh' | 'nhap-diem' | 'van-hanh';
  loaiHan: DeadlineKind | null; han: string | null; lam: boolean;
  caseId?: number; paId?: number;
  pa?: { kind: string; description: string | null; performer: string | null; performerUserId: number | null; soBuoi: number | null; mocChu: string | null };
  classId?: number; luot?: string; kn?: string; studentId?: number;
};
/** PR-VAI-a (Q26): dòng Case/PA có người phụ trách + hạn — panel ghi "người · quá hạn n ngày". OV-12e: đầu dòng v3 + việc của dòng. */
export type DongSoLieu = {
  id: number; title: string; sub: string; href: string; nguoi?: string | null; han?: string | null;
  em?: { id: number; ten: string } | null; lop?: string | null; ngCanh?: string | null; nguoiId?: number | null;
  viec?: ViecDongSoLieu | null; tinhTrang?: string | null;
};

type Drill = {
  id: string; unit: ChiSo['donVi']; n: number; numerator: number | null;
  empty: boolean; note: string | null; today: string;
  rows?: DongSoLieu[];
};

/** Tham số truy vấn của một lần mở danh sách — Y HỆT tham số đã dùng để tính con số. */
export function qsSoLieu(phamVi?: PhamViSoLieu, extra?: Record<string, string>): string {
  const b = phamVi?.branchId ?? null;
  const ex = extra ? Object.entries(extra).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join('') : '';
  return `rows=1${b ? `&branchId=${b}` : ''}${thamSoCt(phamVi?.chuongTrinh ?? null)}${ex}`;
}

/** Hộp "Cách tính" — chữ đọc thẳng từ sổ; nhãn theo THUAT_NGU g12-021/022. */
function CachTinh({ cs }: { cs: ChiSo }) {
  const { homNay, ngan } = useNgayNghiepVu();
  return (
    <div className="text-xs text-slate-400 leading-relaxed space-y-1">
      <div><strong className="text-slate-300">{t('Chỉ số:')}</strong> {cs.cauHoi}</div>
      <div><strong className="text-slate-300">{t('Đối tượng tính:')}</strong> {cs.tapDuDieuKien}</div>
      <div><strong className="text-slate-300">{t('Không đếm trùng:')}</strong> {cs.khuTrung}</div>
      <div><strong className="text-slate-300">{t('Thời gian:')}</strong> {THOI_GIAN_NHAN[cs.thoiGian]}</div>
      <div><strong className="text-slate-300">{t('Dữ liệu đến:')}</strong> {ngan(homNay)}</div>
    </div>
  );
}

/** Hạn trong câu tình trạng của dòng: quá hạn "⚠ quá hạn n ngày" · còn ≤ 3 ngày vàng · xa hơn thường — ngưỡng từ `deadlineView` (một chỗ). */
function HanDong({ han, loai }: { han: string; loai?: DeadlineKind | null }) {
  const { homNay, ngan } = useNgayNghiepVu();
  const v = deadlineView({ kind: loai ?? 'viec-van-hanh', due: han, today: homNay });
  return v.tone === 'overdue' ? <span className="font-semibold tabular-nums text-late">⚠ {nhanQuaHan(v.daysOverdue)}</span>
    : <span className={`tabular-nums ${v.ganHan ? 'font-semibold text-soon' : ''}`}>{t('hạn {ngay}', { ngay: ngan(han) })}</span>;
}

/* Việc dài của dòng (Ngăn Case, Nhập điểm, Vận hành) chỉ tải khi bấm — trang có ô số không kéo cả cây panel làm việc vào lần tải đầu. */
const LamDongSoLieu = lazyTai(() => import('../modules/worklist/LamDongSoLieu.tsx').then((m) => ({ default: m.LamDongSoLieu })));


/**
 * PANEL DANH SÁCH CỦA MỘT CON SỐ — hệ panel v3 (OV-12e, P12, mockup v3 §10). Đầu: tên số liệu + "⚠ n quá hạn" / "n Case · quá hạn lên đầu".
 * Mỗi dòng = đầu thu gọn (việc + chip hạn / em · lớp · ngữ cảnh · người làm nếu không phải bạn). Bấm dòng → MỞ RỘNG TẠI CHỖ: người làm được thấy
 * khối Cần làm (Xác nhận PA làm ngay trong dòng; việc dài → THAY nội dung panel bằng panel làm việc sẵn có, "← Danh sách" về đúng dòng);
 * người khác thấy câu tình trạng. Link "Xem hồ sơ ↗" tách khỏi nút làm. Số ở đầu = số dòng (cùng tập máy chủ trả; dòng vừa xong mà máy chủ không còn
 * trả vẫn giữ chỗ cũ với "✓", không đếm). "Cách tính" ở cuối danh sách.
 */
export function NganDanhSach({ tieuDe, dv, data, loading, error, reload, onDong, cachTinh, trong }: {
  tieuDe: string; dv?: string | null;
  data: { n: number; rows: DongSoLieu[] } | null; loading: boolean; error: ApiError | null; reload: () => void; onDong: () => void;
  cachTinh?: ReactNode; trong?: string;
}) {
  const { homNay } = useNgayNghiepVu();
  const toi = useSession().session?.user?.id ?? null;
  /* OV-13b: dòng đang mở rộng ghi lên URL (`?dong=`) — về từ hồ sơ (‹ Tổng quan) mở lại đúng dòng. */
  const [moChu, datMo] = useThamSoUrl('dong', '');
  const mo = moChu ? Number(moChu) : null;
  const setMo = (v: number | null) => datMo(v === null ? '' : String(v));
  const [lam, setLam] = useState<DongSoLieu | null>(null);
  const [giu, setGiu] = useState<Map<number, { dong: DongSoLieu; i: number; chu: string }>>(() => new Map());
  const [busy, setBusy] = useState<number | null>(null);
  const [loiDong, setLoiDong] = useState<{ id: number; loi: string } | null>(null);
  const [vuaXong, setVuaXong] = useState<string | null>(null);
  const ds = useRef<HTMLUListElement>(null);
  /* Về từ việc dài: cuộn tới đúng dòng vừa làm. */
  useEffect(() => {
    if (lam || mo === null) return;
    ds.current?.querySelector(`[data-dong="${mo}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [lam, mo]);

  const hanCua = (r: DongSoLieu) => r.viec ? r.viec.han : r.han ?? null;
  const tre = (r: DongSoLieu) => { const h = hanCua(r); return !!h && deadlineView({ kind: r.viec?.loaiHan ?? 'viec-van-hanh', due: h, today: homNay }).tone === 'overdue'; };
  const goc = data?.rows ?? [];
  const xep = [...goc.filter(tre), ...goc.filter((r) => !tre(r))];   // quá hạn lên đầu, giữ thứ tự máy chủ trong từng nhóm
  const hien: (DongSoLieu & { xong?: string })[] = [...xep];
  for (const [id, g] of giu) if (!xep.some((r) => r.id === id)) hien.splice(Math.min(g.i, hien.length), 0, { ...g.dong, xong: g.chu });
  const soTre = xep.filter(tre).length;
  /* OV-15e: panel số liệu phân trang 10 / 20 / 50 (thanh đầu + cuối); dòng đang mở (`?dong=`) ở trang sau vẫn mở được khi lật tới. */
  const pt = usePhanTrang(hien.length, tieuDe, dv ?? t('mục'));
  /* Dòng đang mở (về từ hồ sơ) nằm ở trang sau → lật tới trang đó. */
  const viTriMo = mo === null ? -1 : hien.findIndex((r) => r.id === mo);
  useEffect(() => {
    if (viTriMo >= 0 && (viTriMo < pt.thanh.dau || viTriMo >= pt.thanh.cuoi)) pt.thanh.onTrang(Math.floor(viTriMo / pt.thanh.co) + 1);
  }, [viTriMo]); // eslint-disable-line react-hooks/exhaustive-deps

  const daLam = (r: DongSoLieu, chu: string) => {
    const i = hien.findIndex((x) => x.id === r.id);
    setGiu((m) => new Map(m).set(r.id, { dong: r, i, chu }));
    invalidate('/metrics'); invalidate('/tong-quan'); invalidate('/my-work'); invalidate('/cases');
    reload();
  };
  const xacNhanPa = async (r: DongSoLieu) => {
    const v = r.viec!;
    setBusy(r.id); setLoiDong(null);
    try {
      /* Cùng đường "Xác nhận PA" bấm thẳng của Ngăn Case: gửi nội dung quy chế nguyên văn, người / số buổi giữ như máy gán. */
      await api.post(`/interventions/${v.paId}/xac-nhan-pa`, { description: v.pa?.description ?? '' });
      daLam(r, t('Đã xác nhận'));
      setVuaXong(t('Đã xác nhận PA · {ten}', { ten: r.em?.ten ?? r.title }));
      const i = hien.findIndex((x) => x.id === r.id);
      setMo(hien.slice(i + 1).find((x) => x.viec?.lam && !x.xong)?.id ?? null);   // dòng kế của bạn tự mở
    } catch (e: any) { setLoiDong({ id: r.id, loi: e?.message ?? t('Không lưu được') }); } finally { setBusy(null); }
  };

  if (lam) {
    return (
      <Suspense fallback={<KhungPanel tieuDe={tieuDe} onDong={onDong}><div className="pt-3"><Skeleton rows={6} /></div></KhungPanel>}>
        <LamDongSoLieu dong={lam} onDong={onDong} onVe={() => { setMo(lam.id); setLam(null); }}
          onDaLam={() => { daLam(lam, t('Đã lưu')); setVuaXong(`${dich(lam.viec?.chu ?? '')} · ${lam.em?.ten ?? lam.title}`); }} />
      </Suspense>
    );
  }

  const veDong = (r: DongSoLieu & { xong?: string }) => {
    const v = r.viec ?? null;
    const moRong = mo === r.id && !r.xong;
    const dong2 = r.em || r.lop || r.ngCanh
      ? [r.em?.ten, r.lop, r.ngCanh, r.nguoi && r.nguoiId !== toi && !v?.lam ? r.nguoi : null]
      : [r.sub];
    const nen = moRong ? { background: 'var(--accent-soft)' } : undefined;
    return (
      <li key={r.id} data-dong={r.id} className="border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
        <button type="button" aria-expanded={r.xong ? undefined : moRong} disabled={!!r.xong} onClick={() => setMo(moRong ? null : r.id)} style={nen}
          className="flex min-h-[44px] w-full appearance-none flex-col gap-0.5 border-0 bg-transparent px-4 py-2.5 text-left hover:bg-[color:var(--accent-soft)] disabled:hover:bg-transparent">
          <span className="flex w-full items-center gap-2.5">
            <span className={`min-w-0 flex-1 text-sm font-bold ${r.xong ? 'text-slate-300' : 'text-slate-100'}`}>{v ? dich(v.chu) : r.title}</span>
            {r.xong ? <span className="text-[13px] font-bold text-ok">✓ {r.xong}</span>
              : v?.loaiHan && v.han ? <ChipHan loai={v.loaiHan} han={v.han} /> : null}
          </span>
          {dong2.some(Boolean) && (
            <span className="text-[13px] leading-snug text-slate-400">
              {dong2.filter(Boolean).map((x, i) => <span key={i}>{i > 0 && <span aria-hidden className="mx-1.5 text-slate-500">·</span>}{i === 0 && r.em ? <b className="font-bold text-slate-200">{x}</b> : x}</span>)}
            </span>
          )}
        </button>
        {moRong && (
          <div className="flex flex-col gap-3 px-4 pb-4 pt-1" style={nen}>
            {v?.lam ? (
              <CanLam trongDong>
                {v.loai === 'xac-nhan-pa' && v.pa ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-[15px] font-bold text-slate-100">{dich(INTERVENTION_KIND_LABEL[v.pa.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? v.pa.kind)}</span>
                    {v.pa.description && <span className="text-sm text-slate-200">{v.pa.description}</span>}
                    <span className="text-[13px] text-slate-400">{[v.pa.performer, v.pa.mocChu].filter(Boolean).join(' · ')}</span>
                  </div>
                ) : r.title && r.title !== r.ngCanh ? <span className="text-sm text-slate-200">{r.title}</span> : null}
                <div className="flex flex-wrap items-center gap-1.5">
                  {v.loai === 'xac-nhan-pa' && v.pa ? (
                    <>
                      <button type="button" className="btn btn-primary min-h-[44px] px-4 font-bold max-sm:w-full sm:min-h-[40px]" disabled={busy === r.id} onClick={() => void xacNhanPa(r)}>
                        {busy === r.id ? t('Đang lưu…') : t('Xác nhận PA')}
                      </button>
                      <NutChu onClick={() => setLam(r)}>{t('Sửa PA')}</NutChu>
                    </>
                  ) : (
                    <button type="button" className="btn btn-primary min-h-[44px] px-4 font-bold max-sm:w-full sm:min-h-[40px]" onClick={() => setLam(r)}>{dich(v.chu)}</button>
                  )}
                </div>
                {loiDong?.id === r.id && <p role="alert" className="m-0 text-xs font-semibold text-bad">⚠ {loiDong.loi}</p>}
              </CanLam>
            ) : (
              /* Không làm được: câu tình trạng (chữ, không khối màu, không nút). */
              <p className="m-0 text-sm leading-relaxed text-slate-200">
                {[r.tinhTrang ? dich(r.tinhTrang) : r.sub, r.nguoi].filter(Boolean).join(' · ')}
                {hanCua(r) && <> · <HanDong han={hanCua(r)!} loai={r.viec?.loaiHan} /></>}
              </p>
            )}
            <Link to={r.href} className="link w-fit text-[13px] font-semibold max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
              {v ? t('Xem hồ sơ') : t('Mở trang')} <span aria-hidden>↗</span>
            </Link>
          </div>
        )}
      </li>
    );
  };

  return (
    <KhungPanel tieuDe={tieuDe} onDong={onDong}
      dau={{
        han: soTre ? <ChipSoQuaHan n={soTre} /> : null,
        dong2: [data && dv ? `${data.n} ${dv}` : null, soTre ? t('quá hạn lên đầu') : null],
      }}
      chan={vuaXong ? { v3: true, dongTren: <span className="font-semibold text-ok">✓ {vuaXong}</span> } : undefined}>
      {error ? <div className="pt-3"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
        : loading || !data ? <div className="pt-3"><Skeleton rows={5} /></div>
        : !hien.length ? <Empty title={trong ?? t('Không có mục nào')} />
        : (
          <>
            <PhanTrang {...pt.thanh} />
            <ul ref={ds} className="-mx-4 m-0 list-none p-0">{pt.cat(hien).map(veDong)}</ul>
            <PhanTrang {...pt.thanh} duoi />
          </>
        )}
      {cachTinh && (
        <details className="mt-4 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
          <summary className="min-h-[44px] cursor-pointer text-[13px] font-semibold text-[color:var(--accent)] sm:min-h-0">{t('Cách tính')}</summary>
          <div className="mt-2">{cachTinh}</div>
        </details>
      )}
    </KhungPanel>
  );
}

/** Panel "{tên}" · "{n} {đơn vị}": đúng tập ID sinh ra con số (cùng hàm, cùng quyền, cùng bộ lọc) — OV-12e: dòng mở rộng tại chỗ (`NganDanhSach`). */
export function DanhSachSoLieu({ id, giaTri, phamVi, extra, open, onClose, ten }: {
  id: string; giaTri: number; phamVi?: PhamViSoLieu; extra?: Record<string, string>; open: boolean; onClose: () => void;
  /** OV-11f (TQ-11): tên ở ô / dòng vừa bấm — panel nói đúng chữ người dùng vừa đọc (một khái niệm một tên). Không có → tên trong sổ. */
  ten?: string;
}) {
  const cs = metricById(id);
  const qs = qsSoLieu(phamVi, extra);
  const { data, loading, error, reload } = useApi<Drill>(open && cs ? `/metrics/${id}?${qs}` : null, [id, open, qs]);
  if (!cs || !open) return null;
  const dv = METRIC_UNIT_LABEL[cs.donVi];
  return (
    <NganDanhSach tieuDe={ten ?? cs.ten} dv={dv} onDong={onClose} cachTinh={<CachTinh cs={cs} />}
      data={data ? { n: data.n, rows: data.rows ?? [] } : null} loading={loading} error={error} reload={reload}
      trong={data?.empty ? t('Không có dữ liệu trong phạm vi') : t('Không có {dv} nào trong tập này', { dv })} />
  );
}

/**
 * MỖI CON SỐ TỰ GIẢI THÍCH ĐƯỢC (hợp đồng số liệu §3).
 *
 *   <SoLieu id="hv-co-case-mo" giaTri={18} phamVi={{ branchId: 1 }} />
 *
 * Hiển thị: số + tên + đơn vị. Hai hành vi bắt buộc:
 *   · "Cách tính" → đọc THẲNG từ sổ chỉ số (`ChiSo`): câu hỏi, tập đủ điều kiện, quy tắc khử trùng,
 *     mốc thời gian, ngày dữ liệu. Không có chữ giải thích nào nằm riêng trong component này.
 *   · Bấm số → panel bên phải `{n} {đơn vị} — {tên}`, danh sách đúng TẬP ID sinh ra con số (cùng hàm,
 *     cùng quyền, cùng bộ lọc), có đường quay lại.
 *
 * CẤM hiển thị một con số dashboard ngoài `<SoLieu>`: mã không có trong sổ thì KHÔNG vẽ số, để một
 * con số không có định nghĩa không lọt lên màn hình.
 */
export function SoLieu({ id, giaTri, phamVi, rong, className = '', extra, nhan, phu, tone }: {
  id: string; giaTri: number; phamVi?: PhamViSoLieu; rong?: boolean; className?: string; extra?: Record<string, string>;
  /** Nhãn hiện ở ô khi khác tên trong sổ (plan PR-Pa Q20). "Cách tính" vẫn ghi tên trong sổ. */
  nhan?: string;
  /** Một dòng phụ dưới số (G-3). */
  phu?: ReactNode;
  tone?: 'danger' | 'warn';
}) {
  const cs = metricById(id);
  const [open, setOpen] = useMoSoLieu(`${id}${extra ? `|${new URLSearchParams(extra)}` : ''}`);
  const [howTo, setHowTo] = useState(false);
  const idCachTinh = useId();
  if (!cs) return <span className="text-xs text-bad">{t('Chỉ số không có trong sổ: {id}', { id })}</span>;
  const dv = METRIC_UNIT_LABEL[cs.donVi];
  const clickable = giaTri > 0;
  const mau = tone === 'danger' ? '!text-bad' : tone === 'warn' ? '!text-soon' : '';
  return (
    <OChiSo className={className} ten={<>
      {nhan ?? cs.ten}
      {/* PR-VAI-a (K1-08): "Cách tính" là chú thích NỔI — rê chuột, Tab hoặc bấm; Esc đóng. Không đẩy giãn hàng ô. */}
      <span className="relative ml-1.5 inline-block" onMouseEnter={() => setHowTo(true)} onMouseLeave={() => setHowTo(false)}>
        {/* Bấm chỉ MỞ: chạm trên điện thoại phát mouseenter → focus → click, đảo trạng thái thì vừa mở đã đóng. Đóng: Esc, rời chuột, mất focus. */}
        <button type="button" onClick={() => setHowTo(true)} aria-expanded={howTo} aria-describedby={howTo ? idCachTinh : undefined}
          onFocus={() => setHowTo(true)} onBlur={() => setHowTo(false)}
          onKeyDown={(e) => { if (e.key === 'Escape' && howTo) { e.stopPropagation(); setHowTo(false); } }}
          aria-label={t('Cách tính')}
          className="appearance-none bg-transparent border-0 p-0 max-sm:p-3 max-sm:-m-3 cursor-pointer text-sm leading-none text-slate-500 hover:text-slate-300">ⓘ</button>
        {howTo && (
          <div id={idCachTinh} role="tooltip" className="card absolute left-0 top-full z-30 mt-1.5 w-[min(20rem,calc(100vw-2.5rem))] p-3 shadow-2xl">
            <CachTinh cs={cs} />
          </div>
        )}
      </span>
    </>}
      giaTri={<span className="inline-flex flex-wrap items-baseline gap-1.5">
        {clickable ? (
          <button type="button" onClick={() => setOpen(true)} className={`${VUNG_BAM_SO} ${LOP_OSO} ${mau}`}
            aria-label={t('{gt} {dv} — {ten}. Bấm để xem danh sách', { gt: giaTri, dv, ten: nhan ?? cs.ten })}>{giaTri}</button>
        ) : <span className="text-slate-500">{giaTri}</span>}
        <span className="text-xs font-normal text-slate-400">{dv}</span>
      </span>}
      mau={phu ?? ((rong || giaTri === 0) ? (rong ? t('Không có dữ liệu trong phạm vi') : t('Không có mục nào')) : null)}>
      <DanhSachSoLieu id={id} giaTri={giaTri} phamVi={phamVi} extra={extra} open={open} onClose={() => setOpen(false)} ten={nhan} />
    </OChiSo>
  );
}
