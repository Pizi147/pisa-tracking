import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { nhanCanSua, type LoiTruong } from '@shared/domain/index.ts';

/** Một ô cần sửa ở chân form: `oId` để nút "n ô cần sửa ↑" nhảy tới ô đó. Chuỗi trơn (form cũ) vẫn nhận. */
export type MucThieu = { nhan: string; lyDo?: string; oId?: string };

/**
 * D11: lỗi dưới ô (`Truong`, `Field`) nối vào ô bằng `aria-describedby` — trình đọc màn hình đọc lý do khi vào ô. Một chỗ cho mọi nơi
 * gọi: ô đầu tiên trong khung bọc (`ref`) được thêm/gỡ id dòng lỗi, giữ các id `aria-describedby` sẵn có của ô.
 */
export function useNoiLoi(loi: string | null | undefined) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const o = ref.current?.querySelector<HTMLElement>('input, select, textarea, [aria-invalid]');
    if (!o) return undefined;
    const khac = (o.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((x) => x && x !== id);
    const ds = loi ? [...khac, id] : khac;
    if (ds.length) o.setAttribute('aria-describedby', ds.join(' ')); else o.removeAttribute('aria-describedby');
    return undefined;
  }, [loi, id]);
  return { id, ref };
}

/**
 * TRẠNG THÁI BÁO LỖI MỘT FORM (PR-N1, YC-12.5.2). Lỗi của một ô hiện khi người dùng đã RỜI ô đó (`roi` → `onBlur`) hoặc đã
 * bấm nút chính (`bam`). `oId` = id DOM của ô — một lúc chỉ mở một panel (`khoPanelChung`) nên không trùng.
 */
export function useLoiForm() {
  const [daBam, setDaBam] = useState(false);
  const [daRoi, setDaRoi] = useState<ReadonlySet<string>>(new Set());
  const roi = useCallback((khoa: string) => () => setDaRoi((s) => (s.has(khoa) ? s : new Set(s).add(khoa))), []);
  const hien = (khoa: string) => daBam || daRoi.has(khoa);
  const oId = (khoa: string) => `o-${khoa}`;
  /** Lý do dưới ô `khoa` (chỉ khi đã rời ô / đã bấm) — truyền vào `Truong loi`. */
  const loiCua = (loi: readonly LoiTruong[], khoa: string) => (hien(khoa) ? loi.find((l) => l.khoa === khoa)?.lyDo ?? null : null);
  return {
    daBam,
    bam: () => setDaBam(true),
    /** Đổi tab / làm lại form: quên hết lỗi đã hiện. */
    datLai: () => { setDaBam(false); setDaRoi(new Set()); },
    roi,
    hien,
    oId,
    loiCua,
    /** Thuộc tính gắn lên ô (input/select/textarea, hoặc khung bọc nhóm nút — `focusout` nổi bọt): id + rời ô + aria-invalid. */
    o: (loi: readonly LoiTruong[], khoa: string) => ({ id: oId(khoa), onBlur: roi(khoa), 'aria-invalid': !!loiCua(loi, khoa) }),
    /** Chân form: sau khi bấm mới có "n ô cần sửa ↑", bấm → ô lỗi đầu tiên. */
    conThieu: (loi: readonly LoiTruong[]): MucThieu[] | undefined => (daBam ? loi.map((l) => ({ nhan: l.nhan, oId: oId(l.khoa) })) : undefined),
  };
}

/**
 * Chân form sau khi bấm Lưu: MỘT dòng xám nhỏ "n ô cần sửa ↑" (tên ô ở tooltip); bấm → cuộn + focus ô lỗi ĐẦU TIÊN.
 * Câu CHẶN không gắn với ô nào (`{ lyDo }` không `oId`, ví dụ "Còn 1 PA đang chạy") thì nói thẳng câu đó, cùng kiểu xám.
 */
export function DongCanSua({ muc }: { muc: (string | MucThieu)[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const chan = muc.every((m) => typeof m !== 'string' && !m.oId && m.lyDo);
  if (chan) {
    return <div className="px-4 pt-2 text-right text-[11px] text-slate-400" role="status">{muc.map((m) => (m as MucThieu).lyDo).join(' · ')}</div>;
  }
  const toiO = () => {
    const dau = muc.find((m): m is MucThieu => typeof m !== 'string' && !!m.oId);
    const el = (dau && document.getElementById(dau.oId!))
      ?? ref.current?.closest('[role="dialog"]')?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? null;
    el?.scrollIntoView({ block: 'center' });
    el?.focus();
  };
  return (
    <div ref={ref} className="px-4 pt-2 text-right" role="status">
      <button type="button" onClick={toiO} title={muc.map((m) => (typeof m === 'string' ? m : m.nhan)).join(' · ')}
        className="appearance-none border-0 bg-transparent p-0 text-[11px] text-slate-500 hover:text-slate-300">{nhanCanSua(muc.length)}</button>
    </div>
  );
}
