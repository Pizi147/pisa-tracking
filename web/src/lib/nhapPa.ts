import { useEffect, useState } from 'react';

/**
 * TU2-4: form / lưới vừa LƯU NHÁP một PA chưa tới hạn → báo tại chỗ để khối "PA đang chạy" đổi nhãn nháp, KHÔNG tải lại `/my-work` (dòng đọc GV sát trần).
 * `nhap` = bản máy chủ trả về (null = nháp đã xoá). Dữ liệu `/my-work` mới về (`ds` đổi) thì khối bỏ bản báo này — máy chủ đã có.
 */
export type NhapPaMoi = { soBuoi?: number | null; buoiDuKien?: number | null; luc: string } | null;
const SU_KIEN = 'pisa:nhap-pa';
export const baoNhapPa = (paId: number, nhap: NhapPaMoi) => window.dispatchEvent(new CustomEvent(SU_KIEN, { detail: { paId, nhap } }));
/** Nghe `baoNhapPa` — trả hàm gỡ. */
export function ngheNhapPa(fn: (paId: number, nhap: NhapPaMoi) => void): () => void {
  const nghe = (e: Event) => { const d = (e as CustomEvent<{ paId: number; nhap: NhapPaMoi }>).detail; fn(d.paId, d.nhap); };
  window.addEventListener(SU_KIEN, nghe);
  return () => window.removeEventListener(SU_KIEN, nghe);
}
export function useNhapPaMoi(lamLai: unknown): ReadonlyMap<number, NhapPaMoi> {
  const [m, setM] = useState<ReadonlyMap<number, NhapPaMoi>>(new Map());
  useEffect(() => { setM(new Map()); }, [lamLai]);
  useEffect(() => ngheNhapPa((paId, nhap) => setM((x) => new Map(x).set(paId, nhap))), []);
  return m;
}
