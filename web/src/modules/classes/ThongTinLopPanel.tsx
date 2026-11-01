import { useEffect, useRef, useState, type ReactNode } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel, Truong, useBaoDangSua } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { CHO_TAO_PRE_FOU, ghepMaLop, kiemSoLop, kyHieuLop, locSoLop, tachSoLop, type LoiTruong } from '@shared/domain/index.ts';
import { PhanDoan } from './ClassCreatePanel.tsx';
import { PhanPhanCong } from './TeacherAssignPanel.tsx';
import { PhanLichTest } from './ClassProgressPanel.tsx';
import type { HoSoLop } from './DauTrangLop.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * ⋯ › THÔNG TIN LỚP (PR-OV3a, M2 §2) — MỘT panel, ba phần theo thứ tự Lớp → Phân công → Lịch Test của lớp (FT: Tuần khai giảng).
 * Mỗi phần xem trước, nút Sửa riêng, Lưu riêng: phần đang sửa giữ chữ của mình, phần khác lưu / lỗi không đụng tới (state riêng từng phần,
 * tải lại hồ sơ lớp không gỡ panel). Ba đường API cũ: `PATCH /thong-tin` · `PUT /teachers` · `PATCH /progress`.
 * `phan`: lối cũ mở thẳng một phần (badge "Thiếu GV" / `?viec=phan-cong` → Phân công đang sửa).
 */
export function ThongTinLopPanel({ lop, phan, onClose, onDone, onChuyenTiep }: {
  lop: HoSoLop; phan?: 'phan-cong' | null; onClose: () => void; onDone: () => void;
  /** Lớp hết khoá: nút "Lộ trình tiếp theo" trong phần Lịch Test (chỉ khi người xem chuyển tiếp được). */
  onChuyenTiep?: () => void;
}) {
  return (
    <KhungPanel tieuDe={t('Thông tin lớp')} lop={lop.code} onDong={onClose}>
      <NoiDungThongTinLop lop={lop} phan={phan} onDone={onDone} onChuyenTiep={onChuyenTiep} />
    </KhungPanel>
  );
}

/** Ba phần Lớp → Phân công → Lịch Test; nút Sửa theo quyền. OV-10b: cách xem "Thông tin lớp" (TVV / CX / Admin) vẽ chỉ đọc ngay trong tab (`chiDoc`). */
export function NoiDungThongTinLop({ lop, phan, onDone, onChuyenTiep, chiDoc = false }: {
  lop: HoSoLop; phan?: 'phan-cong' | null; onDone: () => void; onChuyenTiep?: () => void; chiDoc?: boolean;
}) {
  const thuong = lop.programme?.scoringMode === 'ratio';
  return (
    <>
      <PhanLop suaDuoc={!chiDoc && lop.viewer.canEditProgress} onDone={onDone}
        lop={{ id: lop.id, code: lop.code, branchCode: lop.branchCode, route: lop.route, programmeCode: lop.programme?.code ?? null,
          programmeName: lop.programme?.name ?? null, soHocVien: lop.summary?.studentCount ?? 0 }} />
      <PhanPhanCong lop={lop} suaDuoc={!chiDoc && (lop.viewer.canAssign || !!lop.viewer.canAssignSubject)} moSua={phan === 'phan-cong'} onDone={onDone} />
      <PhanLichTest classId={lop.id} tieuDe={thuong ? t('Lịch Test của lớp') : t('Tuần khai giảng')} suaDuoc={!chiDoc && lop.viewer.canEditProgress}
        onDone={onDone} onChuyenTiep={chiDoc ? undefined : onChuyenTiep} />
    </>
  );
}

/**
 * MỘT PHẦN của panel: tiêu đề · Sửa (xem) hoặc Huỷ + Lưu (đang sửa) ngay trên đầu phần; lỗi lưu hiện trong phần (chữ đã gõ giữ nguyên).
 * `moSua`: mở sẵn chế độ sửa + cuộn tới (lối cũ "Sửa phân công").
 */
export function PhanThongTin({ tieuDe, nhanPhu, suaDuoc, dangSua, daDoi = true, busy, nhanLuu = t('Lưu'), loi, onSua, onHuy, onLuu, cuonToi, children }: {
  tieuDe: string; /** Chip cạnh tiêu đề (vd "Nháp · 1 ô đổi"). */ nhanPhu?: ReactNode; suaDuoc: boolean; dangSua: boolean; busy: boolean; nhanLuu?: string; loi: string | null;
  /** 6c (lỗi 5): phần đang sửa có đổi thật — ✕ panel hỏi trước khi bỏ. Không truyền = mở Sửa là coi như đã đổi. */
  daDoi?: boolean;
  onSua: () => void; onHuy: () => void; onLuu: () => void; cuonToi?: boolean; children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useBaoDangSua(dangSua && daDoi);
  useEffect(() => { if (cuonToi) ref.current?.scrollIntoView({ block: 'start' }); }, [cuonToi]);
  return (
    <section ref={ref} aria-label={tieuDe} className="border-t py-3.5 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
      <div className="mb-2.5 flex min-h-[32px] flex-wrap items-center gap-2">
        <h3 className="m-0 text-sm font-semibold text-slate-100">{tieuDe}</h3>
        {nhanPhu}
        <span className="flex-1" />
        {dangSua ? (
          <>
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={onHuy} disabled={busy}>{t('Huỷ thay đổi')}</button>
            <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={onLuu} disabled={busy}>{busy ? t('Đang lưu…') : nhanLuu}</button>
          </>
        ) : suaDuoc && (
          <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={onSua} aria-label={t('Sửa {ten}', { ten: tieuDe.toLowerCase() })}>{t('Sửa')}</button>
        )}
      </div>
      {loi && <p role="alert" className="m-0 mb-2.5 rounded-md border px-3 py-2 text-xs text-rose-200" style={{ borderColor: 'var(--line)' }}>{t('Không lưu được: {loi}', { loi })}</p>}
      {children}
    </section>
  );
}

/** Xem dạng hai cột nhãn | giá trị (M2 §2); 375 nhãn hẹp lại. */
export function DongXem({ dong }: { dong: [string, ReactNode][] }) {
  return (
    <dl className="m-0 grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
      {dong.map(([k, v]) => [
        <dt key={`${k}-k`} className="text-slate-400">{k}</dt>,
        <dd key={`${k}-v`} className="m-0 min-w-0 break-words text-slate-100">{v}</dd>,
      ])}
    </dl>
  );
}

/**
 * PHẦN "LỚP" (PR-LOP YC-2, K2-18 — trước là panel "Sửa thông tin lớp"): Số lớp + Chương trình (+ Lộ trình lớp FT). Tên lớp máy ghép
 * `{CN} {ký hiệu} {số}` — chỉ sửa phần SỐ. Chương trình / lộ trình chỉ đổi khi lớp chưa có học viên (Q6). PR-OV3a: bỏ ô Ghi chú (cột DB giữ,
 * không gửi `note` thì máy chủ giữ nguyên). Máy chủ kiểm lại mọi luật.
 */
function PhanLop({ lop, suaDuoc, onDone }: {
  lop: { id: number; code: string; branchCode: string; route: string | null; programmeCode: string | null; programmeName: string | null; soHocVien: number };
  suaDuoc: boolean; onDone: () => void;
}) {
  const toast = useToast();
  const [dangSua, setDangSua] = useState(false);
  const programmes = useApi<{ code: string; name: string }[]>(dangSua ? '/ref/programmes' : null);
  const routes = useApi<{ code: string; name: string }[]>(dangSua ? '/ref/routes' : null);
  /** Lớp tên lạ (chưa theo mẫu) → null: không sửa số ở đây. */
  const soCu = tachSoLop(lop.code, lop.branchCode);
  const [so, setSo] = useState(soCu ?? '');
  const [chuongTrinh, setChuongTrinh] = useState(lop.programmeCode ?? '');
  const [loTrinh, setLoTrinh] = useState(lop.route ?? 'LT1');
  const [busy, setBusy] = useState(false);
  const [loiLuu, setLoiLuu] = useState<string | null>(null);
  const lf = useLoiForm();
  const doiDuoc = lop.soHocVien === 0;
  const ft = chuongTrinh === 'FT';

  const loiSo = soCu === null ? null : kiemSoLop(so);
  const loi: LoiTruong[] = loiSo ? [{ khoa: 'so', nhan: t('Số lớp'), lyDo: dich(loiSo) }] : [];
  /* Số đã gõ mà sai mẫu → hiện ngay; ô trống → khi rời ô / sau khi bấm Lưu (YC-12.5.2). */
  const loiSoHien = so !== '' ? loiSo && dich(loiSo) : lf.loiCua(loi, 'so');
  const kh = kyHieuLop(chuongTrinh, ft ? loTrinh : null);
  const ma = soCu !== null && !loiSo && kh ? ghepMaLop(lop.branchCode, chuongTrinh, ft ? loTrinh : null, so) : null;

  const huy = () => {
    setDangSua(false); setLoiLuu(null);
    setSo(soCu ?? ''); setChuongTrinh(lop.programmeCode ?? ''); setLoTrinh(lop.route ?? 'LT1');
  };
  const luu = async () => {
    lf.bam();
    if (loi.length) return;   // báo tại ô, không khoá nút
    setBusy(true); setLoiLuu(null);
    try {
      await api.patch(`/classes/${lop.id}/thong-tin`, {
        ...(soCu !== null ? { so } : {}),
        ...(chuongTrinh && chuongTrinh !== lop.programmeCode ? { programmeCode: chuongTrinh } : {}),
        ...(ft && loTrinh !== lop.route ? { loTrinh } : {}),   // lớp FT cũ chưa có lộ trình: không gửi thì không bị khoá Q6
      });
      invalidate('/classes'); invalidate('/ref/classes'); invalidate('/hoc-vien-lop');
      toast.push('ok', t('Đã lưu thông tin lớp'));
      setDangSua(false);
      onDone();
    } catch (e: any) { setLoiLuu(e.message); toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <PhanThongTin tieuDe={t('Lớp')} suaDuoc={suaDuoc} dangSua={dangSua} busy={busy} loi={loiLuu}
      daDoi={so !== (soCu ?? '') || chuongTrinh !== (lop.programmeCode ?? '') || loTrinh !== (lop.route ?? 'LT1')}
      onSua={() => setDangSua(true)} onHuy={huy} onLuu={luu}>
      {!dangSua ? (
        <DongXem dong={[
          [t('Số lớp'), <span className="tabular-nums">{soCu ?? lop.code}</span>],
          [t('Chương trình'), lop.programmeName ?? lop.programmeCode ?? '—'],
          ...(lop.programmeCode === 'FT' ? [[t('Lộ trình'), lop.route ?? '—'] as [string, ReactNode]] : []),
        ]} />
      ) : (
        <div className="space-y-3">
          {soCu === null ? (
            <Truong nhan={t('Tên lớp')} phu={t('Tên lớp cũ chưa theo mẫu — Quản trị đổi lúc nâng cấp')}>
              <input className="field w-full" value={lop.code} readOnly />
            </Truong>
          ) : (
            <div>
              <Truong nhan={t('Số lớp')} batBuoc phu={t('1–4 chữ số, được thêm một chữ cái cuối (101A)')} loi={loiSoHien}>
                <input className="field w-28 tabular-nums" {...lf.o(loi, 'so')} aria-invalid={!!loiSoHien} inputMode="numeric" autoComplete="off"
                  value={so} onChange={(e) => setSo(locSoLop(e.target.value))} />
              </Truong>
              <p className="m-0 mt-2 text-sm tabular-nums" aria-live="polite">
                {ma
                  ? <>{t('Lớp sẽ là')} <strong className="text-slate-100">{ma}</strong></>
                  : <span className="text-slate-500">{t('Lớp sẽ là')} {lop.branchCode} {kh ?? ''} …</span>}
              </p>
            </div>
          )}
          <Truong nhan={t('Chương trình')} phu={doiDuoc ? undefined : t('🔒 Đổi chương trình khi lớp chưa có học viên / bài Test')}>
            <select className="field w-full" value={chuongTrinh} disabled={!doiDuoc} onChange={(e) => setChuongTrinh(e.target.value)}>
              {(programmes.data ?? (lop.programmeCode ? [{ code: lop.programmeCode, name: lop.programmeName ?? lop.programmeCode }] : [])).map((p) => (
                <option key={p.code} value={p.code} disabled={p.code === 'PREFOU' && !CHO_TAO_PRE_FOU && p.code !== lop.programmeCode}>
                  {p.name}
                </option>
              ))}
            </select>
          </Truong>
          {ft && (
            <Truong nhan={t('Lộ trình')} as="div">
              <PhanDoan nhan={t('Lộ trình')} giaTri={loTrinh} onChon={setLoTrinh}
                muc={(routes.data ?? []).map((r) => ({ v: r.code, nhan: r.code, title: r.name, tat: !doiDuoc && r.code !== loTrinh }))} />
              {!doiDuoc && (
                <span className="mt-1 block text-xs text-slate-400">
                  {t('Lớp đã có {n} học viên — muốn đổi lộ trình thì chuyển các em sang lớp {kh} khác', { n: lop.soHocVien, kh: kyHieuLop('FT', lop.route === 'RF' ? 'LT1' : 'RF') })}
                </span>
              )}
            </Truong>
          )}
        </div>
      )}
    </PhanThongTin>
  );
}
