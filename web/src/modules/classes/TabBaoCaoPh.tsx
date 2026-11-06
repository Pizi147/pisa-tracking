import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { api } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { taiXlsx, type SheetXuat } from '../test/keHoach/taiXlsx.ts';
import { quenBanXem, useApi } from '../../lib/useApi.ts';
import { fmtBand } from '../../lib/format.ts';
import { taoHangLuu, dongSauKhiLuu, type TrangThaiO } from '../../lib/luuChac.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { ChonDangNut } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ChuLuu, type TtLuu } from '../../ui/KhuonViec.tsx';
import { ODiem } from '../../ui/ODiem.tsx';
import { HopDotBaoCaoPh, guiDotBc, lamMoiBaoCaoPh } from './HopDotBaoCaoPh.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  MUC_BC, boPhanBc, chuBc, kqDiemBc, loiDiemSua, nhanMucBc, nhanOChu, ngay, phanDu, tieuChiPhan, tuanLich,
  type BanGhiBc, type DiemGocBc, type MucBc, type PhanBc,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

type OBc = 'du' | 'nhap' | null;
type PhanCot = { khoa: string; ngan: string; ten: string; gv: { id: number; ten: string }[]; cuaToi: boolean };
export type TrangBc = {
  lop: { id: number; ma: string; cn: number; ft: boolean }; dsDot: { ma: string; nhan: string; mo: string; han: string; them: boolean }[]; dot: string | null; dotDau: string | null;
  /** BC-DOT-QL: đợt đã bỏ (chỉ QL / Admin) · đợt bỏ đang xem · được bỏ / thêm đợt. */
  dsBo: { ma: string; nhan: string }[]; daBo: { ma: string; nhan: string } | null; quyetDot: boolean;
  phan: PhanCot[]; em: { id: number; ten: string; o: Record<string, OBc> }[]; vietHo: boolean; xuat: boolean;
};
type EmPhan = { id: number; ten: string; banGhi: BanGhiBc | null; du: boolean; mucTruoc: Record<string, MucBc> | null; goc: DiemGocBc | null; sua: { ten: string | null; luc: string } | null };
type DuLieuPhan = { lop: { id: number; ma: string }; dot: { ma: string; nhan: string; han: string }; dotTruoc: string | null; phan: string; viet: boolean; vietHo: boolean; ft: boolean; em: EmPhan[] };
type Mo = { phan: string; em: number; kieu: 'viet' | 'doc' };

const duongTrang = (lopId: number, dot: string | null) => `/classes/${lopId}/bao-cao-ph${dot ? `?dot=${encodeURIComponent(dot)}` : ''}`;
const emDuHet = (o: Record<string, OBc>, ds: readonly PhanCot[]) => ds.every((p) => o[p.khoa] === 'du');

/**
 * TAB "BÁO CÁO PH" CỦA HỒ SƠ LỚP (đặc tả BAO-CAO-PH mục 12, mockup v15 t1 · d1 · e1 · d5 · g2). Chọn đợt · "n/N em đủ" · Xuất lớp (PR b) · bảng em × phần.
 * Ô phần của mình (GV) / mọi ô (QL viết hộ) có viền khi còn thiếu; bấm ô phần của mình → panel viết; ô khác → panel đọc (QL: Viết hộ).
 * Đợt nằm trên URL (`?dot=`) — Quay lại về đúng đợt. Mở tab = một lớp × một đợt (đặc tả §7). Lưu trong panel cập nhật ô tại chỗ, không tải lại bảng.
 */
export function TabBaoCaoPh({ lopId, ct, dot, onDot, onDuHet, onDoiDot }: {
  lopId: number; ct: string | null; dot: string | null; onDot: (ma: string | null) => void;
  /** BC-DOT-QL: đợt vừa bỏ / thêm / khôi phục — chip trên tab (ở trang lớp) đọc lại. */
  onDoiDot?: () => void;
  /** RA-LOI-0611 (PTA 06/11): đợt đang xem đủ mọi em mọi phần? — tính từ bảng đã nạp + ô vừa lưu, không thêm request (chip "quá hạn" trên tab tắt tại chỗ). */
  onDuHet?: (dot: string, du: boolean) => void;
}) {
  const { data, loading, error, reload } = useApi<TrangBc>(duongTrang(lopId, dot), [lopId, dot]);
  const [mo, setMo] = useState<Mo | null>(null);
  /* Lưu trong panel → ô bảng đổi tại chỗ (khoá `em:phần`). */
  const [doi, setDoi] = useState<Record<string, OBc>>({});
  useEffect(() => setDoi({}), [data]);
  useEffect(() => {
    if (!data?.dot || !onDuHet) return;
    onDuHet(data.dot, data.em.length > 0 && data.em.every((e) => data.phan.every((p) => (doi[`${e.id}:${p.khoa}`] ?? e.o[p.khoa]) === 'du')));
  }, [data, doi]);   // eslint-disable-line react-hooks/exhaustive-deps
  const [them, setThem] = useState(false);
  const [hop, setHop] = useState<'bo' | 'them' | null>(null);
  const dt = useDienThoai();
  const bo = useMemo(() => boPhanBc(ct), [ct]);
  const toast = useToast();
  /* Xuất Excel (PR b): `null` = không đang xuất · 0 = cả lớp · id em. File = ảnh lúc bấm; không đánh dấu "đã xuất". */
  const [dangXuat, setDangXuat] = useState<number | null>(null);
  const xuat = async (emId: number | null) => {
    if (dangXuat !== null || !data?.dot) return;
    setDangXuat(emId ?? 0);
    try {
      toast.push('ok', t('Đã tạo {tep}', { tep: await taiBaoCaoPh(lopId, data.dot, emId) }));
    } catch (e: any) {
      toast.push('error', e?.message ?? t('Chưa tạo được file.'));
    } finally { setDangXuat(null); }
  };
  /* RA-LOI-0611: `?dot=` không còn trong lịch lớp (tuần thi đã dời, link cũ) → về đợt mặc định thay vì kẹt ở màn lỗi 404. */
  useEffect(() => { if (error?.status === 404 && dot) onDot(null); }, [error, dot]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (loading || !data || !bo) return <Skeleton rows={6} />;
  const em = data.em.map((e) => ({ ...e, o: { ...e.o, ...Object.fromEntries(data.phan.flatMap((p) => (`${e.id}:${p.khoa}` in doi ? [[p.khoa, doi[`${e.id}:${p.khoa}`]]] : []))) } }));
  const soDu = em.filter((e) => emDuHet(e.o, data.phan)).length;
  const dotHien = data.dsDot.find((d) => d.ma === data.dot);
  const mo_ = (phan: PhanCot, emId: number) => setMo({ phan: phan.khoa, em: emId, kieu: phan.cuaToi ? 'viet' : 'doc' });
  const tenGv = (p: PhanCot) => (p.cuaToi ? t('Bạn') : p.gv.length ? p.gv.map((g) => g.ten).join(', ') : t('Chưa phân công'));
  const nhanO = (e: { ten: string }, p: PhanCot, o: OBc) => `${e.ten} · ${p.ngan} · ${o === 'du' ? t('Đủ') : o === 'nhap' ? t('Nháp') : t('Chưa viết')}`;

  /* BC-DOT-QL: QL / Quản trị / Admin bỏ đợt (hoặc xoá đợt thêm) · thêm đợt bất chợt · khôi phục đợt bỏ. Mọi việc có Hoàn tác (toast). */
  const sauDoi = (ma?: string | null) => { onDoiDot?.(); if (ma !== undefined && ma !== dot) onDot(ma); else reload(); };
  const loiToast = (e: any) => toast.push('error', e?.message ?? t('Không lưu được'));
  const khoiPhuc = async () => {
    const d = data.daBo!;
    try {
      await guiDotBc({ viec: 'khoi-phuc', classIds: [lopId], ma: d.ma }); lamMoiBaoCaoPh();
      toast.hoanTac(t('Đã khôi phục đợt {dot}', { dot: dich(d.nhan) }), async () => {
        try { await guiDotBc({ viec: 'bo', classIds: [lopId], ma: d.ma }); lamMoiBaoCaoPh(); toast.push('ok', t('Đã hoàn tác')); sauDoi(null); } catch (e) { loiToast(e); }
      }, { key: `bc-dot:${lopId}` });
      sauDoi(d.ma);
    } catch (e) { loiToast(e); }
  };
  const xoaDotThem = async () => {
    if (!dotHien) return;
    const ids = [Number(dotHien.ma.slice(5))];
    try {
      await guiDotBc({ viec: 'xoa', dotIds: ids }); lamMoiBaoCaoPh();
      toast.hoanTac(t('Đã xoá đợt {dot}', { dot: dich(dotHien.nhan) }), async () => {
        try { await guiDotBc({ viec: 'hoan-xoa', dotIds: ids }); lamMoiBaoCaoPh(); toast.push('ok', t('Đã hoàn tác')); sauDoi(dotHien.ma); } catch (e) { loiToast(e); }
      }, { key: `bc-dot:${lopId}` });
      sauDoi(null);
    } catch (e) { loiToast(e); }
  };
  const nutDot = 'btn btn-sm min-h-[44px] font-semibold sm:min-h-0';
  const congCu = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-3">
      <ChonDangNut aria-label={t('Đợt báo cáo')} value={data.dot ?? data.daBo?.ma ?? ''} onChange={(ev) => onDot(ev.target.value === data.dsDot[0]?.ma ? null : ev.target.value)}>
        {!data.dot && !data.daBo && <option value="">—</option>}
        {data.dsDot.map((d) => <option key={d.ma} value={d.ma}>{dich(d.nhan)}</option>)}
        {data.dsBo.length > 0 && <optgroup label={t('Không báo cáo')}>{data.dsBo.map((d) => <option key={d.ma} value={d.ma}>{dich(d.nhan)}</option>)}</optgroup>}
      </ChonDangNut>
      {data.dot && <span className="text-[15px] text-slate-300"><b className="tabular-nums text-slate-100">{soDu}/{em.length}</b> {t('em đủ')}</span>}
      <span className="flex-1" />
      {data.quyetDot && data.dot && dotHien && (dotHien.them
        ? <button type="button" className={nutDot} onClick={() => void xoaDotThem()}>{t('Xoá đợt')}</button>
        : <button type="button" className={nutDot} onClick={() => setHop('bo')}>{t('Không báo cáo đợt này')}</button>)}
      {data.quyetDot && <button type="button" className={nutDot} onClick={() => setHop('them')}>{t('+ Đợt báo cáo')}</button>}
      {data.xuat && data.dot && <button type="button" className="btn btn-sm min-h-[44px] font-semibold sm:min-h-0" disabled={dangXuat !== null} onClick={() => void xuat(null)}>
        {dangXuat === 0 ? t('Đang tạo file…') : t('Xuất lớp')}</button>}
    </div>
  );
  const hopDot = hop && (
    <HopDotBaoCaoPh kieu={hop} lopId={lopId} lopMa={data.lop.ma} chiNhanh={data.lop.cn} ft={data.lop.ft}
      dot={hop === 'bo' && dotHien ? { ma: dotHien.ma, nhan: dotHien.nhan } : undefined} onClose={() => setHop(null)} onDone={sauDoi} />
  );
  if (!data.dot) {
    return (
      <section className="card p-4">
        {congCu}
        {data.daBo ? (
          <div className="rounded-lg border px-4 py-5 text-center" style={{ borderColor: 'var(--line)' }}>
            <h2 className="m-0 text-[17px] font-bold text-slate-300">{dich(data.daBo.nhan)} · {t('Không báo cáo')}</h2>
            <p className="m-0 mt-1 text-sm text-slate-400">{t('Bài đã viết vẫn còn; khôi phục là hiện lại.')}</p>
            <button type="button" className={`${nutDot} mt-3`} onClick={() => void khoiPhuc()}>{t('Khôi phục')}</button>
          </div>
        ) : (
          <div className="px-4 py-6 text-center">
            <h2 className="m-0 text-[17px] font-bold text-slate-100">{t('Chưa có đợt')}</h2>
            {data.dotDau && <p className="m-0 mt-1 text-sm text-slate-400">{t('Đợt đầu: {dot}', { dot: dich(data.dotDau) })}</p>}
          </div>
        )}
        {hopDot}
      </section>
    );
  }

  const panel = mo && (() => {
    const ph = bo.find((p) => p.khoa === mo.phan)!;
    const cot = data.phan.find((p) => p.khoa === mo.phan)!;
    const capNhat = (sid: number, o: OBc) => setDoi((x) => ({ ...x, [`${sid}:${mo.phan}`]: o }));
    if (mo.kieu === 'doc') {
      return <PanelDocBc lopId={lopId} lopMa={data.lop.ma} dot={data.dot!} phan={ph} gv={cot.gv} emId={mo.em} vietHo={data.vietHo}
        onVietHo={() => setMo({ ...mo, kieu: 'viet' })} onDong={() => setMo(null)} />;
    }
    const phanTiep = data.phan.filter((p) => p.cuaToi && p.khoa !== mo.phan);
    return <PanelVietBc key={`${mo.phan}:${data.dot}`} lopId={lopId} lopMa={data.lop.ma} dot={data.dot!} phan={ph} emDau={mo.em} onDoi={capNhat}
      phanTiep={phanTiep.map((p) => ({ khoa: p.khoa, ten: p.ten, thieu: em.filter((e) => e.o[p.khoa] !== 'du').map((e) => e.id) }))}
      onPhanTiep={(k, emId) => setMo({ phan: k, em: emId, kieu: 'viet' })} onDong={() => setMo(null)} />;
  })();

  if (dt) {
    /* 375 (mockup g2): hàng "Phần của bạn" (lối viết) + thẻ em (Thiếu / Nháp theo phần; tên phần bấm được) + dòng đếm Đủ. */
    const cuaToi = data.phan.filter((p) => p.cuaToi);
    const hien = them ? em : em.slice(0, 8);
    return (
      <section className="card p-3">
        {congCu}
        {cuaToi.length > 0 && (
          <div className="mb-2">
            <p className="m-0 mb-1.5 text-[13px] font-medium text-slate-400">{t('Phần của bạn')}</p>
            <div className="grid grid-cols-2 gap-2">
              {cuaToi.map((p) => {
                const n = em.filter((e) => e.o[p.khoa] === 'du').length;
                const dau = em.find((e) => e.o[p.khoa] !== 'du') ?? em[0];
                return <button key={p.khoa} type="button" className="btn min-h-[44px] justify-center font-semibold" disabled={!dau}
                  onClick={() => dau && setMo({ phan: p.khoa, em: dau.id, kieu: 'viet' })}>{t('Viết {phan} · {n}/{tong}', { phan: p.ngan, n, tong: em.length })}</button>;
              })}
            </div>
          </div>
        )}
        <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>
          {hien.map((e) => {
            const thieu = data.phan.filter((p) => !e.o[p.khoa]);
            const nhap = data.phan.filter((p) => e.o[p.khoa] === 'nhap');
            const nutPhan = (p: PhanCot) => (
              <button key={p.khoa} type="button" onClick={() => mo_(p, e.id)} aria-label={nhanO(e, p, e.o[p.khoa])}
                className={`inline-flex min-h-[32px] appearance-none items-center border-0 bg-transparent px-0.5 font-bold ${p.cuaToi ? 'text-[color:var(--accent)] hover:underline' : 'text-slate-100'}`}>{p.ngan}</button>
            );
            return (
              <li key={e.id} className="py-2">
                <div className="text-[15px] font-semibold text-slate-100">{e.ten}</div>
                {!thieu.length && !nhap.length && <div className="text-[13px] text-slate-400">✓ {t('đủ')}</div>}
                {thieu.length > 0 && <div className="flex flex-wrap items-center gap-x-1 text-[13px] text-slate-400">{t('Thiếu')} {thieu.map((p, i) => <Fragment key={p.khoa}>{i > 0 && <span aria-hidden>·</span>}{nutPhan(p)}</Fragment>)}</div>}
                {nhap.length > 0 && <div className="flex flex-wrap items-center gap-x-1 text-[13px] text-soon">{t('Nháp')} {nhap.map((p, i) => <Fragment key={p.khoa}>{i > 0 && <span aria-hidden>·</span>}{nutPhan(p)}</Fragment>)}</div>}
              </li>
            );
          })}
        </ul>
        {!them && em.length > 8 && <button type="button" className="btn mt-2 min-h-[44px] font-semibold" onClick={() => setThem(true)}>{t('Xem thêm {n} em', { n: em.length - 8 })}</button>}
        <div className="mt-3 flex flex-wrap gap-x-3 border-t pt-2 text-[12px] text-slate-400" style={{ borderColor: 'var(--line-strong)' }}>
          <span>{t('Đủ')} /{em.length}</span>
          {data.phan.map((p) => <span key={p.khoa}>{p.ngan} <b className="tabular-nums text-slate-100">{em.filter((e) => e.o[p.khoa] === 'du').length}</b></span>)}
        </div>
        {panel}
        {hopDot}
      </section>
    );
  }

  return (
    <section className="card p-4" aria-label={`${t('Báo cáo PH')} · ${dich(dotHien!.nhan)}`}>
      {congCu}
      {/* BANG-3: bảng chung `Bang` (thẻ 375 riêng ở trên). Đầu cột hai dòng: mã phần + GV (`.bang-bc .bang-chu-thich` xuống dòng). */}
      <div className="bang-bc">
        <Bang ten={`${t('Báo cáo PH')} · ${dich(dotHien!.nhan)}`} khung={false} the375={false} deu khoa={(e) => e.id} hang={em}
          cot={[
            { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 300 },
            ...data.phan.map((p): CotBang => ({ key: p.khoa, nhan: p.ngan, phu: tenGv(p), kieu: 'so', rong: 120, goiY: p.ten })),
            ...(data.xuat ? [{ key: 'xuat', nhan: t('Xuất'), kieu: 'nut', rong: 72 } as CotBang] : []),
          ]}
          oCua={(e, c) => {
            if (c.key === 'ten') return <span className="font-semibold text-slate-100">{e.ten}</span>;
            if (c.key === 'xuat') {
              return <button type="button" className="link-nho min-h-[44px] font-medium sm:min-h-0" disabled={dangXuat !== null}
                aria-label={t('Xuất báo cáo · {ten}', { ten: e.ten })} onClick={() => void xuat(e.id)}>{dangXuat === e.id ? t('Đang tạo…') : t('Xuất')}</button>;
            }
            const p = data.phan.find((x) => x.khoa === c.key)!;
            const o = e.o[p.khoa];
            return (
              <button type="button" aria-label={nhanO(e, p, o)} onClick={() => mo_(p, e.id)}
                className={`o-bc ${o === 'du' ? 'du' : o === 'nhap' ? `nhap${p.cuaToi ? ' cua' : ''}` : `chua${p.cuaToi || data.vietHo ? '' : ' doc'}`}`}>
                {o === 'du' ? '✓' : o === 'nhap' ? t('nháp') : '–'}
              </button>
            );
          }}
          cuoi={(
            <tr className="hang-du">
              <td className="td" data-kieu="ten">{t('Đủ')}</td>
              {data.phan.map((p) => <td key={p.khoa} className="td" data-kieu="so">{em.filter((e) => e.o[p.khoa] === 'du').length}/{em.length}</td>)}
              {data.xuat && <td className="td" data-kieu="nut" />}
            </tr>
          )} />
      </div>
      {panel}
      {hopDot}
    </section>
  );
}

/** Tải Excel báo cáo PH một lớp (`emId` null) / một em — trả tên tệp. Dùng ở tab và việc Admin ở Công việc. */
export async function taiBaoCaoPh(lopId: number, dot: string, emId: number | null): Promise<string> {
  const r = await api.get<{ sheets: SheetXuat[]; tenTep: string }>(`/classes/${lopId}/bao-cao-ph/xuat?dot=${encodeURIComponent(dot)}${emId ? `&em=${emId}` : ''}`);
  await taiXlsx(r.sheets, r.tenTep);
  return r.tenTep;
}

/** Việc Admin (Công việc) "Xuất báo cáo PH" của lớp đã đủ: nút Xuất lớp tải ngay (PTA chốt 05/11) — không chuyển trang, không dấu "đã xuất". */
export function NutXuatLopBc({ lopId, dot }: { lopId: number; dot: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    /* 375 (mockup g3): ẩn — chạm cả dòng mở tab Báo cáo PH, Xuất lớp bấm trong tab. */
    <button type="button" className="btn btn-sm min-h-[44px] font-semibold max-sm:hidden sm:min-h-[30px]" disabled={busy}
      onClick={async () => {
        setBusy(true);
        try { toast.push('ok', t('Đã tạo {tep}', { tep: await taiBaoCaoPh(lopId, dot, null) })); }
        catch (e: any) { toast.push('error', e?.message ?? t('Chưa tạo được file.')); }
        finally { setBusy(false); }
      }}>{busy ? t('Đang tạo file…') : t('Xuất lớp')}</button>
  );
}

// ---------------------------------------------------------------- panel viết

type Form = BanGhiBc;
const rong = (): Form => ({ muc: {}, datSan: [], chu: '', diemSua: null });
/** Bản đầu của form một em: bản đã lưu, không có thì mức đặt sẵn như đợt trước (ô chữ luôn trống — đặc tả §6). */
const formDau = (e: EmPhan): Form => e.banGhi
  ? { ...e.banGhi }
  : e.mucTruoc ? { muc: { ...e.mucTruoc }, datSan: Object.keys(e.mucTruoc), chu: '', diemSua: null } : rong();
const json = (f: Form) => JSON.stringify(f);

/**
 * PANEL VIẾT MỘT PHẦN (mockup a2 · a3 · a5 · c1 · g1): trái danh sách em (✓ đủ / nháp), phải form một em — Điểm (tự điền, Sửa) → tiêu chí (hàng 4 nút,
 * đặt sẵn = viền đứt) → ô chữ → "Lưu · em tiếp ›". Tự lưu khi chọn mức / rời ô (`taoOLuu` xếp lượt — gõ tiếp khi đang lưu không mất chữ); lỗi lưu giữ chữ.
 */
function PanelVietBc({ lopId, lopMa, dot, phan, emDau, onDoi, phanTiep, onPhanTiep, onDong }: {
  lopId: number; lopMa: string; dot: string; phan: PhanBc; emDau: number; onDoi: (sid: number, o: OBc) => void;
  phanTiep: { khoa: string; ten: string; thieu: number[] }[]; onPhanTiep: (khoa: string, emId: number) => void; onDong: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const dt = useDienThoai();
  const { data, loading, error, reload } = useApi<DuLieuPhan>(`/classes/${lopId}/bao-cao-ph/phan?dot=${encodeURIComponent(dot)}&phan=${phan.khoa}`, [lopId, dot, phan.khoa]);
  const [chon, setChon] = useState(emDau);
  const [xong, setXong] = useState(false);
  const [, ve] = useState(0);
  /* Mỗi em: form đang sửa + hàng lưu riêng (đổi em không mất chữ / lần lưu đang chạy). */
  const hang = useState(() => taoHangLuu(() => ve((x) => x + 1)))[0];
  const ban = useRef(new Map<number, { form: Form; daLuu: Form; o: ReturnType<typeof hang.o>; tt: TrangThaiO; loi: string; luc: string | null }>());
  const lay = (e: EmPhan) => {
    let b = ban.current.get(e.id);
    if (!b) {
      const dau = formDau(e);
      const moi = { form: dau, daLuu: e.banGhi ?? rong(), tt: 'idle' as TrangThaiO, loi: '', luc: null as string | null, o: null as any };
      moi.o = hang.o(String(e.id), json(dau), async (v) => {
        const f: Form = JSON.parse(v ?? json(rong()));
        try {
          const r = await api.put<{ du: boolean; suaLuc: string }>(`/classes/${lopId}/bao-cao-ph`, { dot, phan: phan.khoa, studentId: e.id, ...f });
          moi.daLuu = f; moi.luc = r.suaLuc;
          /* RA-LOI-0611: quên bản vừa xem của tab + panel — mở lại panel trong 10 s không dựng form từ bản cũ (lưu tiếp sẽ xoá chữ vừa lưu). Không tải lại. */
          quenBanXem(`/classes/${lopId}/bao-cao-ph`);
          onDoi(e.id, r.du ? 'du' : 'nhap');
          return null;
        } catch (err: any) { return err?.message ?? ''; }
      }, (tt, lyDo) => { moi.tt = tt; moi.loi = lyDo; ve((x) => x + 1); });
      ban.current.set(e.id, moi);
      b = moi;
    }
    return b;
  };
  const chuaLuu = [...ban.current.values()].some((b) => b.tt !== 'dang' && (b.o.chuaLuu() || b.tt === 'loi'));
  /* RA-LOI-0611: còn ô lưu lỗi → về em đó + nói rõ (trước chỉ vẽ lại, bấm như không có tác dụng). ✕ / Esc / Quay lại đã qua hộp "Bỏ chữ, đóng" → `nut` = false. */
  const toast = useToast();
  const baoChuaLuu = (n: number) => {
    const k = [...hang.chuaLuu.keys()][0];
    if (k) { setXong(false); setChon(Number(k)); }
    toast.push('error', t('Còn {n} ô chưa lưu được — chữ vẫn giữ. Rời ô để lưu lại; bấm Đóng lần nữa thì chữ ở ô lỗi sẽ mất.', { n }));
  };
  const dongPanel = dongSauKhiLuu(hang, onDong, baoChuaLuu);
  const dongNut = dongSauKhiLuu(hang, onDong, baoChuaLuu, true);

  const tieuDe = `${t('Báo cáo PH')} · ${lopMa} · ${phan.khoa === 'chung' ? t('Nhận xét chung') : phan.ten}`;
  const ds = data?.em ?? [];
  const duCua = (e: EmPhan) => phanDu(phan, ban.current.get(e.id)?.daLuu ?? e.banGhi);
  const soDu = ds.filter(duCua).length;
  const ngCanh = data && [dich(data.dot.nhan), <span key="du"><b className="text-slate-100">{soDu}/{ds.length}</b> {t('em đủ')}</span>, t('hạn {ngay}', { ngay: ngay(data.dot.han, homNay) })];
  const em = ds.find((e) => e.id === chon) ?? ds[0];
  const b = em ? lay(em) : null;
  const i = em ? ds.indexOf(em) : -1;
  /* Em kế tiếp còn thiếu (sau em này, vòng lại); hết → thẻ "Đã xong phần của bạn". */
  const keTiep = em ? [...ds.slice(i + 1), ...ds.slice(0, i)].find((e) => !duCua(e)) ?? null : null;

  /* Đổi theo bản MỚI NHẤT của form (bấm nhanh nhiều mức liên tiếp không ghi đè nhau). */
  const doiForm = (doi: (f: Form) => Form, luuNgay: boolean) => {
    if (!b) return;
    b.form = doi(b.form); b.o.go(json(b.form)); ve((x) => x + 1);
    if (luuNgay) void b.o.luu();
  };
  /* Không khoá nút khi đang lưu: rời ô chữ (bấm nút) đã bắt đầu lưu — khoá thì cú bấm bị nuốt. Lưu xếp lượt nên bấm hai lần không gửi trùng. */
  const luuTiep = async () => {
    if (!b) return;
    await b.o.luu();
    if (b.tt === 'loi') return;   // V12 ②: lỗi → ở lại em này, chữ còn
    /* Hết em thiếu khác → thẻ "Xong phần của bạn" (Phần tiếp › · Đóng; dòng đếm "n/N em đủ" nói thật số còn thiếu) — PTA 06/11: không đứng im. */
    if (keTiep) setChon(keTiep.id); else setXong(true);
  };
  const tt: TtLuu | null = !b ? null : b.tt === 'dang' ? 'dang' : b.tt === 'loi' ? 'loi' : b.o.chuaLuu() ? 'nhap' : b.luc ? 'da' : null;
  const gio = b?.luc ? new Date(b.luc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }) : null;

  const chan = xong || !em ? { huy: { nhan: t('Đóng'), onClick: dongNut } } : {
    huy: null, daSua: chuaLuu, tuHoi: false,
    trai: <span className="flex flex-wrap items-center gap-x-2 text-[13px] text-slate-400">{t('Tự lưu khi rời ô')}{tt && <ChuLuu tt={tt} loi={b?.loi} luc={gio} gon />}</span>,
    dongTren: keTiep && dt ? <span className="block px-4 text-[13px] text-slate-400">{t('Tiếp:')} <b className="text-slate-100">{keTiep.ten}</b></span> : undefined,
    phu: keTiep && !dt ? <span className="text-[13px] text-slate-400">{t('Tiếp:')} <b className="text-slate-100">{keTiep.ten}</b></span> : undefined,
    chinh: <button type="button" className="btn btn-primary min-h-[44px] font-semibold max-sm:w-full sm:min-h-0" onClick={() => void luuTiep()}>
      {b?.tt === 'dang' ? t('Đang lưu…') : t('Lưu · em tiếp ›')}</button>,
  };

  return (
    <KhungPanel tieuDe={tieuDe} loai={t('BÁO CÁO PH · VIẾT')} rong="bang" onDong={dongPanel} quayLai={dt ? { nhan: lopMa, onClick: dongPanel } : undefined}
      dau={{ dong2: ngCanh ?? [] }} chan={chan}>
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : loading || !data ? <Skeleton rows={6} />
        : !em ? <p className="m-0 text-sm text-slate-400">{t('Đợt này không có học viên.')}</p>
        : xong ? <HetEm lopMa={lopMa} phan={phan} dotNhan={dich(data.dot.nhan)} so={`${soDu}/${ds.length}`} phanTiep={phanTiep} onPhanTiep={onPhanTiep} onDong={dongNut} />
        : (
          <div className="grid gap-0 sm:grid-cols-[200px_minmax(0,1fr)] sm:-mx-4 sm:-my-3">
            {dt ? (
              <div className="mb-3 flex items-center gap-2">
                <button type="button" className="btn h-11 w-11 justify-center" aria-label={t('Em trước')} disabled={i <= 0} onClick={() => setChon(ds[i - 1].id)}>‹</button>
                <select className="field min-h-[44px] flex-1" aria-label={t('Học viên')} value={em.id} onChange={(ev) => setChon(Number(ev.target.value))}>
                  {ds.map((e, k) => <option key={e.id} value={e.id}>{t('Em {n}', { n: k + 1 })} · {e.ten}{duCua(e) ? ' ✓' : ''}</option>)}
                </select>
                <button type="button" className="btn h-11 w-11 justify-center" aria-label={t('Em sau')} disabled={i >= ds.length - 1} onClick={() => setChon(ds[i + 1].id)}>›</button>
              </div>
            ) : (
              <ul className="m-0 list-none border-r py-2.5 pl-0" style={{ borderColor: 'var(--line)' }} aria-label={t('Học viên')}>
                <li className="px-4 pb-2 text-[13px] font-medium text-slate-500">{t('{n} em', { n: ds.length })}</li>
                {ds.map((e) => {
                  const bb = ban.current.get(e.id);
                  const du = duCua(e);
                  const nhap = !du && (!!e.banGhi || !!bb?.luc || !!bb?.o.chuaLuu());
                  return (
                    <li key={e.id}>
                      <button type="button" aria-current={e.id === em.id || undefined} onClick={() => setChon(e.id)}
                        className={`flex min-h-[38px] w-full appearance-none items-center gap-2 border-0 py-1 pl-4 pr-3 text-left text-sm text-slate-100 hover:bg-[color:var(--accent-soft)] ${e.id === em.id ? 'bg-[color:var(--accent-soft)] font-semibold shadow-[inset_3px_0_0_var(--accent)]' : 'bg-transparent'}`}>
                        <span className="min-w-0 flex-1">{e.ten}</span>
                        {du ? <span className="shrink-0 text-[12px] font-medium text-slate-500">✓ {t('đủ')}</span>
                          : nhap ? <span className="shrink-0 text-[12px] font-semibold text-soon">{t('nháp')}</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <FormEm key={em.id} em={em} phan={phan} form={b!.form} dotTruoc={data.dotTruoc && dich(data.dotTruoc)} thang={data.ft} homNay={homNay} du={duCua(em)} nhap={!!em.banGhi || !!b!.luc || b!.o.chuaLuu()}
              onDoi={doiForm} onRoiChu={() => void b!.o.luu()} />
          </div>
        )}
    </KhungPanel>
  );
}

function HetEm({ lopMa, phan, dotNhan, so, phanTiep, onPhanTiep, onDong }: {
  lopMa: string; phan: PhanBc; dotNhan: string; so: string; phanTiep: { khoa: string; ten: string; thieu: number[] }[];
  onPhanTiep: (khoa: string, emId: number) => void; onDong: () => void;
}) {
  const tiep = phanTiep.find((p) => p.thieu.length) ?? phanTiep[0];
  return (
    <div className="py-2">
      <h3 className="m-0 text-[17px] font-bold text-slate-100">{t('Xong phần của bạn')}</h3>
      <p className="m-0 mt-1 text-sm text-slate-400">{lopMa} · {phan.khoa === 'chung' ? t('Nhận xét chung') : phan.ten} · {dotNhan}: {t('{so} em đủ', { so })}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tiep && <button type="button" className="btn btn-primary min-h-[44px] font-semibold sm:min-h-0" onClick={() => onPhanTiep(tiep.khoa, tiep.thieu[0] ?? 0)}>
          {t('Phần tiếp: {phan} ›', { phan: tiep.khoa === 'chung' ? t('Nhận xét chung') : tiep.ten })}</button>}
        <button type="button" className="btn min-h-[44px] font-semibold sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>
      </div>
    </div>
  );
}

/** Form MỘT em: Điểm → tiêu chí → ô chữ (ghi chú mockup mục 5). */
function FormEm({ em, phan, form, dotTruoc, thang, homNay, du, nhap, onDoi, onRoiChu }: {
  em: EmPhan; phan: PhanBc; form: Form; dotTruoc: string | null; thang: boolean; homNay: string; du: boolean; nhap: boolean;
  onDoi: (doi: (f: Form) => Form, luuNgay: boolean) => void; onRoiChu: () => void;
}) {
  const chonMuc = (k: string, m: MucBc) => onDoi((f) => ({ ...f, muc: { ...f.muc, [k]: m }, datSan: f.datSan.filter((x) => x !== k) }), true);
  return (
    <div className="min-w-0 sm:px-6 sm:py-4">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="m-0 flex-1 text-[17px] font-bold text-slate-100">{em.ten}</h3>
        {du ? <Nhan tone="done">{t('Đủ')}</Nhan> : nhap ? <Nhan tone="soon">{t('Nháp')}</Nhan> : null}
      </div>
      {phan.coDiem && <DongDiem goc={em.goc} thang={thang} diemSua={form.diemSua} homNay={homNay} onDoi={(v) => onDoi((f) => ({ ...f, diemSua: v }), true)} />}
      {phan.nhom.map((n, gi) => {
        const san = n.ds.some((x) => form.datSan.includes(x.khoa));
        return (
          <div key={gi} className="mt-3">
            <p className="m-0 mb-1 flex flex-wrap items-center gap-2">
              <span className="border-l-[3px] pl-2 text-[15px] font-bold text-slate-100" style={{ borderColor: 'var(--accent)' }}>{n.vi ? chuBc(n) : t('Tiêu chí')}</span>
              {san && dotTruoc && <span className="rounded surface-2 px-1.5 py-0.5 text-[12px] font-medium text-slate-400">{t('Đặt sẵn như {dot}', { dot: dotTruoc })}</span>}
            </p>
            {n.ds.map((x) => (
              <HangThang key={x.khoa} ten={chuBc(x)} muc={form.muc[x.khoa] ?? null} san={form.datSan.includes(x.khoa)} dotTruoc={dotTruoc} onChon={(m) => chonMuc(x.khoa, m)} />
            ))}
          </div>
        );
      })}
      <label className="mt-4 block">
        <span className="mb-1.5 block text-[15px] font-bold text-slate-100">{nhanOChu(phan)}</span>
        <textarea className="field w-full" rows={4} value={form.chu} onChange={(ev) => { const chu = ev.target.value; onDoi((f) => ({ ...f, chu }), false); }} onBlur={onRoiChu} />
      </label>
    </div>
  );
}

/** Hàng một tiêu chí: tên + nhóm radio 4 mức (roving tabindex; ← → / phím 1–4). Đặt sẵn = viền đứt; còn trống = chấm vàng + viền nhóm vàng. */
function HangThang({ ten, muc, san, dotTruoc, onChon }: { ten: string; muc: MucBc | null; san: boolean; dotTruoc: string | null; onChon: (m: MucBc) => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  const phim = (ev: KeyboardEvent<HTMLSpanElement>) => {
    const so = Number(ev.key);
    const i = muc ? MUC_BC.indexOf(muc) : -1;
    let j: number | null = null;
    if (so >= 1 && so <= 4) j = so - 1;
    else if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') j = Math.min(3, i + 1);
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') j = Math.max(0, i < 0 ? 0 : i - 1);
    if (j === null) return;
    ev.preventDefault();
    onChon(MUC_BC[j]);
    ref.current?.querySelectorAll<HTMLElement>('[role="radio"]')[j]?.focus();
  };
  const id = useRef(`tc-${Math.random().toString(36).slice(2)}`).current;
  return (
    <div className="grid items-center gap-x-3.5 gap-y-2 border-t py-2 first-of-type:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto]" style={{ borderColor: 'var(--line)' }}>
      <span id={id} className="text-sm leading-[1.45] text-slate-100">{!muc && <span aria-hidden className="mr-1.5 align-[2px] text-[12px] leading-none text-soon">●</span>}{ten}</span>
      <span ref={ref} role="radiogroup" aria-labelledby={id} onKeyDown={phim} className={`thang-bc${muc ? '' : ' trong'}`}>
        {MUC_BC.map((m, k) => {
          const on = muc === m;
          return (
            <button key={m} type="button" role="radio" aria-checked={on} tabIndex={on || (!muc && k === 0) ? 0 : -1} aria-keyshortcuts={String(k + 1)}
              className={on && san ? 'san' : undefined} aria-description={on && san && dotTruoc ? t('như {dot}', { dot: dotTruoc }) : undefined}
              onClick={() => onChon(m)}>{nhanMucBc(m)}</button>
          );
        })}
      </span>
    </div>
  );
}

/** Dòng Điểm: "✓ 6.5 · MT4 · W3 NOV · Sửa"; đã sửa: "✗ 6.0 · đã sửa · gốc 6.5 · Về điểm gốc"; ô sửa tại chỗ (Enter / rời ô lưu, sai thì viền đỏ, không lưu). */
function DongDiem({ goc, thang, diemSua, homNay, onDoi }: { goc: DiemGocBc | null; thang: boolean; diemSua: number | null; homNay: string; onDoi: (v: number | null) => void }) {
  const [sua, setSua] = useState(false);
  const [chu, setChu] = useState('');
  const [loi, setLoi] = useState<string | null>(null);
  const tong = goc?.tong ?? null;
  /* RA-LOI-0611: chưa có điểm gốc → theo loại đợt (lớp thường không có điểm bài thì máy chủ không cho sửa tay — trước hiện "Sửa", lưu là lỗi mãi). */
  const ft = goc ? goc.tong == null : thang;
  const so = diemSua ?? goc?.so ?? null;
  const chuSo = (v: number) => (ft ? fmtBand(v) : String(v));
  const xong = () => {
    const v = chu.trim() === '' ? null : Number(chu.replace(',', '.'));
    if (v !== null) { const l = loiDiemSua(v, ft ? null : tong); if (l) { setLoi(l); return; } }
    setSua(false); setLoi(null);
    onDoi(v === null || v === goc?.so ? null : v);
  };
  const coTheSua = thang || tong != null;   // RA-LOI-0611: đúng luật máy chủ (đợt tháng, hoặc có tổng điểm bài)
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="w-14 text-[13px] font-medium text-slate-400">{t('Điểm')}</span>
      {sua ? (
        <span className="inline-flex flex-col">
          <span className="inline-flex items-center gap-1.5">
            <input autoFocus className={`field h-9 w-20 tabular-nums ${loi ? '!border-bad' : ''}`} inputMode="decimal" aria-label={t('Điểm')} aria-invalid={!!loi}
              value={chu} onChange={(ev) => { setChu(ev.target.value); setLoi(null); }} onBlur={xong}
              onKeyDown={(ev) => { if (ev.key === 'Enter') { ev.preventDefault(); xong(); } if (ev.key === 'Escape') { ev.stopPropagation(); setSua(false); setLoi(null); } }} />
            {!ft && <span className="text-sm text-slate-400">/{tong}</span>}
          </span>
          {loi && <span role="alert" className="mt-0.5 text-[12px] font-semibold text-bad">{loi}</span>}
        </span>
      ) : so == null ? <span className="text-sm text-slate-500">{t('Chưa có điểm')}</span>
        : <ODiem kieu={ft ? 'doc' : 'ti-le'} so={chuSo(so)} tong={tong ?? undefined} kq={kqDiemBc(so, goc)} nhan={t('Điểm')} />}
      {!sua && diemSua != null && goc && <span className="rounded surface-2 px-1.5 py-0.5 text-[12px] font-medium text-slate-400">{t('đã sửa · gốc {so}', { so: chuSo(goc.so) })}</span>}
      {!sua && diemSua == null && goc && <span className="rounded surface-2 px-1.5 py-0.5 text-[12px] font-semibold text-slate-300">{goc.luot}{goc.tuan ? ` · ${tuanLich(goc.tuan, homNay)}` : ''}</span>}
      {!sua && coTheSua && (diemSua != null && goc
        ? <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" onClick={() => onDoi(null)}>{t('Về điểm gốc')}</button>
        : <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" onClick={() => { setChu(so == null ? '' : chuSo(so)); setSua(true); }}>{t('Sửa')}</button>)}
    </div>
  );
}

// ---------------------------------------------------------------- panel đọc

/** PANEL ĐỌC MỘT PHẦN của một em (mockup d3): Điểm · Tiêu chí · ô chữ · Lần sửa cuối; QL: Viết hộ. */
function PanelDocBc({ lopId, lopMa, dot, phan, gv, emId, vietHo, onVietHo, onDong }: {
  lopId: number; lopMa: string; dot: string; phan: PhanBc; gv: { id: number; ten: string }[]; emId: number; vietHo: boolean; onVietHo: () => void; onDong: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const { data, loading, error, reload } = useApi<DuLieuPhan>(`/classes/${lopId}/bao-cao-ph/phan?dot=${encodeURIComponent(dot)}&phan=${phan.khoa}`, [lopId, dot, phan.khoa]);
  const em = data?.em.find((e) => e.id === emId);
  const ten = phan.khoa === 'chung' ? t('Nhận xét chung') : phan.ten;
  const b = em?.banGhi ?? null;
  const tc = tieuChiPhan(phan);
  const chon = tc.filter((x) => b?.muc[x.khoa]);
  const ft = !em?.goc || em.goc.tong == null;
  const so = b?.diemSua ?? em?.goc?.so ?? null;
  const hang = (nhan: string, giaTri: ReactNode) => (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 border-t py-3 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
      <dt className="text-[13px] font-medium text-slate-400">{nhan}</dt><dd className="m-0 min-w-0 text-sm text-slate-100">{giaTri}</dd>
    </div>
  );
  return (
    <KhungPanel tieuDe={em ? `${em.ten} · ${ten}` : ten} loai={t('BÁO CÁO PH · ĐỌC')} onDong={onDong}
      dau={{ dong2: [lopMa, data ? dich(data.dot.nhan) : '', gv.map((g) => g.ten).join(', ') || t('Chưa phân công')] }}
      chan={{ huy: { nhan: t('Đóng'), onClick: onDong }, chinh: vietHo && em ? <button type="button" className="btn btn-primary min-h-[44px] font-semibold sm:min-h-0" onClick={onVietHo}>{t('Viết hộ')}</button> : undefined }}>
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : loading || !data ? <Skeleton rows={4} />
        : !em ? <p className="m-0 text-sm text-slate-400">{t('Học viên không có trong đợt báo cáo này')}</p>
        : (
          <dl className="m-0">
            {phan.coDiem && hang(t('Điểm'), so == null ? <span className="text-slate-500">{t('Chưa có điểm')}</span> : (
              <span className="inline-flex flex-wrap items-center gap-2">
                <ODiem kieu={ft ? 'doc' : 'ti-le'} so={ft ? fmtBand(so) : String(so)} tong={em.goc?.tong ?? undefined} kq={kqDiemBc(so, em.goc)} nhan={t('Điểm')} />
                {b?.diemSua != null ? <span className="text-[12px] text-slate-400">{t('đã sửa')}</span>
                  : em.goc && <span className="rounded surface-2 px-1.5 py-0.5 text-[12px] font-semibold text-slate-300">{em.goc.luot}{em.goc.tuan ? ` · ${tuanLich(em.goc.tuan, homNay)}` : ''}</span>}
              </span>
            ))}
            {tc.length > 0 && hang(t('Tiêu chí'), (
              <div className="space-y-0.5">
                {chon.map((x) => <div key={x.khoa}>{chuBc(x)} <b>{nhanMucBc(b!.muc[x.khoa])}</b></div>)}
                {chon.length < tc.length && <div className="text-slate-400">{t('{n} tiêu chí chưa chọn', { n: tc.length - chon.length })}</div>}
              </div>
            ))}
            {hang(nhanOChu(phan), b?.chu.trim() ? <span className="whitespace-pre-wrap break-words">{b.chu}</span> : <span className="text-slate-400">{t('Chưa viết')}</span>)}
            {em.sua && hang(t('Lần sửa cuối'), `${em.sua.ten ?? '—'} · ${ngay(em.sua.luc, homNay)} · ${em.du ? t('đủ') : t('nháp')}`)}
          </dl>
        )}
    </KhungPanel>
  );
}
