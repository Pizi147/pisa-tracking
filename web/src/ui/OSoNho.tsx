/**
 * Ô SỐ NHỎ (PR-HV, spec 2026-09-22 A3) — nhãn + số, dùng cho tóm tắt tab Ý thức & Phối hợp
 * (`Vi phạm 5` · `BTVN 3` · `PA đang chuẩn bị 1`). Nhỏ, không phải thẻ số lớn của đầu hồ sơ.
 * Nơi dùng bọc bằng `<div className="flex flex-wrap gap-2">`.
 */
export function OSoNho({ nhan, so, tone }: { nhan: string; so: number | string; tone?: 'warn' | 'danger' }) {
  const mau = tone === 'danger' ? 'text-rose-200' : tone === 'warn' ? 'text-amber-200' : 'text-slate-100';
  return (
    <div className="rounded-lg border px-3 py-2 min-w-[7rem]" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
      <span className="block text-[11px] text-slate-500">{nhan}</span>
      <span className={`block text-base font-semibold tabular-nums leading-tight mt-0.5 ${mau}`}>{so}</span>
    </div>
  );
}
