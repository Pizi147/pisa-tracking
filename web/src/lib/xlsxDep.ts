import { dungXlsx, type SheetDep } from '@shared/xlsxDep.ts';

export type { MauXlsx, OXlsx, SheetDep } from '@shared/xlsxDep.ts';

/** Tải tệp về máy (trình duyệt). */
export function taiXlsxDep(tenTep: string, tieuDe: string, moTa: string, sheets: readonly SheetDep[]): void {
  const blob = new Blob([dungXlsx(tieuDe, moTa, sheets) as Uint8Array<ArrayBuffer>], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = tenTep.replace(/[\\/:*?"<>|]/g, '-');
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
