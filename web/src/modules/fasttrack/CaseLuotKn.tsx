import { useEffect, useRef, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { FormPa } from '../cases/FormPa.tsx';
import { DongCanSua } from '../../ui/loiForm.tsx';
import { KhoiCase } from '../cases/TheKyNang.tsx';
import { NhanLoai, type CaseCard, type MoCase } from '../cases/SkillBoard.tsx';
import { phanNgayThemPa, useThemPa } from '../cases/ThaoTacCase.tsx';
import { HOAN_TAC_PA_MS, type GiaTriPa } from '@shared/domain/index.ts';

/* Nháp form Thêm PA theo Case: thu dòng / mở dòng khác / mở form Case khác đóng form, chữ đang gõ còn nguyên khi mở lại (không mất chữ). */
const NHAP = new Map<number, GiaTriPa>();
import { t } from '@shared/i18n/index.ts';

/**
 * CASE & PHƯƠNG ÁN CỦA MỘT KỸ NĂNG trong vùng mở của hồ sơ lượt (HSL-FT, mockup M4 khu A): khối Case + PA thụt như hồ sơ HV (`KhoiCase` của
 * `TheKyNang`, dữ liệu `skill-board` của lộ trình — cùng nguồn với hồ sơ HV). Việc "Thêm PA" của Case: nút "+ Thêm PA" → form ngay dưới khối Case
 * (ô của `FormPa`, logic `useThemPa` chung với panel), không panel. Lưu xong form đóng, PA mới viền nhấn + "✓ Vừa thêm · Hoàn tác" 10 giây
 * (`POST /interventions/:id/hoan-tac-them`). Bấm tên Case / PA → Ngăn Case (nơi gọi).
 */
export function CaseLuotKn({ cards, studentId, chiDoc, form, onForm, onMoCase, onDoi }: {
  cards: CaseCard[]; studentId: number; chiDoc: boolean;
  /** Case đang mở form Thêm PA (một form một lúc, nâng lên để "Còn lại › Thêm PA" mở đúng form). */
  form: number | null; onForm: (caseId: number | null) => void;
  onMoCase: (caseId: number, o?: MoCase) => void;
  /** Sau lưu / hoàn tác: tải lại trang lượt + bảng Case (Còn lại, cột Case, hai lịch sử cùng lúc). */
  onDoi: () => void;
}) {
  const [moi, setMoi] = useState<{ caseId: number; paId: number; het: number } | null>(null);
  const [baoSr, setBaoSr] = useState('');
  const goc = useRef<HTMLDivElement>(null);
  /** Trả focus về đúng chỗ khi phần tử đang focus bị gỡ (lưu / huỷ / hoàn tác). */
  const focusSau = (sel: string) => requestAnimationFrame(() => goc.current?.querySelector<HTMLElement>(sel)?.focus());
  const [hoanTac, setHoanTac] = useState<'dang' | string | null>(null);
  const [, nhip] = useState(0);
  /* Nút Hoàn tác tự ẩn khi hết 10 giây (máy chủ nhận thêm 5 giây cho mạng chậm). */
  useEffect(() => {
    if (!moi) return undefined;
    const id = window.setTimeout(() => nhip((x) => x + 1), Math.max(0, moi.het - Date.now()) + 50);
    return () => window.clearTimeout(id);
  }, [moi]);
  const conHoanTac = !!moi && Date.now() < moi.het;
  /* Lưu xong: nút Hoàn tác chỉ có khi bảng Case tải lại xong — focus nó lúc nó xuất hiện (một lần). */
  const choFocus = useRef(false);
  useEffect(() => {
    const el = choFocus.current ? goc.current?.querySelector<HTMLElement>('[data-hoan-tac]') : null;
    if (el) { el.focus(); choFocus.current = false; }
  });

  const huyThem = async () => {
    if (!moi || hoanTac === 'dang') return;
    setHoanTac('dang');
    try {
      await api.post(`/interventions/${moi.paId}/hoan-tac-them`);
      invalidate('/cases'); invalidate('/students'); invalidate('/tong-quan'); invalidate('/my-work'); invalidate('/attempts');
      const caseId = moi.caseId;
      setMoi(null); setHoanTac(null); setBaoSr(t('Hoàn tác'));
      onDoi();
      focusSau(`[data-them-pa="${caseId}"]`);
    } catch (e: any) { setHoanTac(e?.message ?? t('Không lưu được')); }
  };

  if (!cards.length) return <p className="m-0 text-xs text-slate-500">{t('Không có Case')}</p>;
  return (
    <div ref={goc} className="space-y-1">
      {/* Vùng đọc màn có sẵn từ đầu — "Vừa thêm" / "Hoàn tác" được đọc khi chữ đổi. */}
      <span className="sr-only" aria-live="polite">{baoSr}</span>
      {cards.map((c) => (
        <KhoiCase key={c.id} c={c} onMoCase={onMoCase}
          paMoi={moi?.caseId === c.id ? {
            id: moi.paId,
            bao: (
              <span className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs font-semibold text-ok">
                ✓ {t('Vừa thêm')}
                {conHoanTac && (
                  <button type="button" data-hoan-tac className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0"
                    disabled={hoanTac === 'dang'} onClick={() => void huyThem()}>{hoanTac === 'dang' ? t('Đang lưu…') : t('Hoàn tác')}</button>
                )}
                {hoanTac && hoanTac !== 'dang' && <span className="font-normal text-bad" role="alert">{hoanTac}</span>}
              </span>
            ),
          } : null}
          themPa={chiDoc || !c.canEdit ? undefined : form === c.id ? (
            <FormThemPaTaiCho caseId={c.id} studentId={studentId} onHuy={() => { NHAP.delete(c.id); onForm(null); focusSau(`[data-them-pa="${c.id}"]`); }}
              onXong={(paId) => {
                NHAP.delete(c.id); onForm(null); setHoanTac(null); onDoi();
                /* Máy chủ không trả được id PA mới (hiếm): chỉ tải lại, không có Hoàn tác. */
                if (paId === null) return;
                setMoi({ caseId: c.id, paId, het: Date.now() + HOAN_TAC_PA_MS }); setBaoSr(t('Vừa thêm'));
                choFocus.current = true;
              }} />
          ) : (
            <span className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              {t('Chưa có PA')}
              <button type="button" data-them-pa={c.id} className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onForm(c.id)}>+ {t('Thêm PA')}</button>
            </span>
          )} />
      ))}
    </div>
  );
}

/**
 * FORM THÊM PA TẠI CHỖ — đúng các ô của `FormPa` (Loại · Số buổi · Nội dung · Người thực hiện · Bắt đầu · "PA đã làm trước đây"), cùng khoá gửi
 * một lần mở. Đang lưu: khoá nút, giữ chữ. Lỗi: ở lại, giữ chữ, "⚠ Không lưu được" + lý do, nút thành "Thử lại". Huỷ = đóng form.
 * 375: mở form là cuộn khối vào giữa màn (bàn phím ảo không che nút chính).
 */
function FormThemPaTaiCho({ caseId, studentId, onHuy, onXong }: {
  caseId: number; studentId: number; onHuy: () => void; onXong: (paId: number | null) => void;
}) {
  const h = useThemPa({
    caseId, v0: NHAP.get(caseId),
    /* PA mới = `paId` hook tính từ Case máy chủ trả (cùng luật Hoàn tác của panel Thêm PA). */
    onSaved: (_c, x) => onXong(x.paId ?? null),
  });
  const { v, setV, lf, busy, loiLuu, deXuat, loi, luu, daSua } = h;
  useEffect(() => { NHAP.set(caseId, v); }, [caseId, v]);
  const { ngay, cuoi } = phanNgayThemPa(h);
  const khung = useRef<HTMLDivElement>(null);
  useEffect(() => {
    khung.current?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    khung.current?.querySelector<HTMLElement>('select, textarea')?.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={khung} role="group" aria-label={t('Thêm PA')} aria-busy={busy || undefined}
      className="ml-3 space-y-3 rounded-lg border bg-[color:var(--surface-2)] p-3 max-sm:scroll-mb-[calc(var(--ban-phim,0px)+5rem)]" style={{ borderColor: 'var(--accent-strong)' }}
      onFocus={(e) => { if (e.isTrusted && matchMedia('(max-width: 639px)').matches) (e.target as HTMLElement).scrollIntoView({ block: 'center' }); }}>
      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-100"><NhanLoai loai="PA" />{t('Thêm PA')}</div>
      <FormPa phang v={v} dat={(p) => setV((x) => ({ ...x, ...p }))} lf={lf} loi={loi} chonLoai studentId={studentId} ngay={ngay} />
      {loiLuu && (
        <p className="m-0 text-xs text-bad" role="alert"><b>⚠ {t('Không lưu được')}</b> · {loiLuu}</p>
      )}
      {!!lf.conThieu(loi)?.length && <div className="-mx-3 -mt-2"><DongCanSua muc={lf.conThieu(loi)!} /></div>}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto max-sm:w-full">{cuoi}</span>
        <span className="flex gap-2 max-sm:grid max-sm:w-full max-sm:grid-cols-2">
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={onHuy}>{daSua ? t('Huỷ thay đổi') : t('Đóng')}</button>
        <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luu()}>
          {busy ? t('Đang lưu…') : loiLuu ? t('Thử lại') : deXuat ? t('Gửi Quản lý duyệt') : t('Thêm PA')}
        </button>
        </span>
      </div>
    </div>
  );
}
