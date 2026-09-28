/** TOAST "HOÀN TÁC" DÙNG CHUNG (PR-N1, UX-C C1, §7.6): mọi thao tác hoàn tác được đều cho 5 giây, nút đếm lùi "Hoàn tác (n)". */
export const HOAN_TAC_MS = 5000;

/** Số giây còn lại trên nút, làm tròn LÊN (còn 4,2 giây → "5"); hết giờ → 0. */
export function giayHoanTacConLai(het: number, bayGio: number): number {
  return Math.max(0, Math.ceil((het - bayGio) / 1000));
}
