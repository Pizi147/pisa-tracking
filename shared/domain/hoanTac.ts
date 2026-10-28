/** TOAST "HOÀN TÁC" DÙNG CHUNG (PR-N1, UX-C C1, §7.6): mọi thao tác hoàn tác được đều cho 5 giây, nút đếm lùi "Hoàn tác (n)". */
export const HOAN_TAC_MS = 5000;

/** Số giây còn lại trên nút, làm tròn LÊN (còn 4,2 giây → "5"); hết giờ → 0. */
export function giayHoanTacConLai(het: number, bayGio: number): number {
  return Math.max(0, Math.ceil((het - bayGio) / 1000));
}

/**
 * SV-BAI-LOP-2: Hoàn tác Thêm PA (form tại chỗ ở hồ sơ HV, "✓ Vừa thêm · Hoàn tác") — 10 giây trên web; máy chủ nhận thêm 5 giây cho mạng chậm.
 * HOAN-TAC-XN: cùng cửa sổ cho Hoàn tác Xác nhận PA / Case (dải "✓ Đã xác nhận … · Hoàn tác"); `themMs` = thời gian lô xác nhận đã chạy.
 */
export const HOAN_TAC_PA_MS = 10_000;
export function duocHoanTacPa(taoLuc: string | null | undefined, bayGio: number, themMs = 0): boolean {
  return !!taoLuc && bayGio - Date.parse(taoLuc) <= HOAN_TAC_PA_MS + 5_000 + themMs;
}
