/* TOC-DO-2511: phần nhẹ của KhungPanel mà gói đầu cần (Toast: nút ✕; lib/ngonNgu: hỏi bỏ chữ khi đổi ngôn ngữ) — tách để KhungPanel ra khỏi gói đầu. */
/**
 * PR-EN: panel đang sửa dở (`chan.daSua` hoặc còn nháp) — đổi ngôn ngữ (tải lại trang) hỏi trước khi bỏ chữ đang gõ.
 * NEN-PANEL (T16): mỗi panel ghi kèm cách HỎI của nó (hộp "Bỏ chữ đang gõ?" vẽ trong panel) — `boChuRoi` dùng khi đổi việc.
 */
export const panelDangSua = new Map<string, (tiep: () => void, o?: () => void, nut?: string) => void>();
export const coPanelDangSua = () => panelDangSua.size > 0;
/** Đổi việc / "‹ Công việc" / mở việc khác: còn chữ chưa lưu thì panel hỏi (Ở lại = nút chính); bỏ chữ hoặc không có chữ → `tiep`. */
export function boChuRoi(tiep: () => void, nut?: string) {
  const hoi = [...panelDangSua.values()].pop();
  if (hoi) hoi(tiep, undefined, nut); else tiep();
}

/**
 * NÚT ✕ ĐẦU HỘP / PANEL — MỘT dáng (mockup v21 `.x`; chủ SP 15/11 "mấy nút ⋯ hay ✕ hay bị lệch"): ô 36 × 36 (điện thoại 44) không viền, nền trong,
 * ✕ 17 px giữa ô, rê mới có nền. Nơi đặt để ô cùng HÀNG với dòng tiêu đề (`items-center`) — tâm ✕ thẳng tâm chữ tiêu đề; mép phải cách hộp 12 px.
 */
export const NUT_DONG = 'grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg border-0 bg-transparent p-0 text-[16px] leading-none text-dim hover:bg-[rgb(var(--phu-rgb)/0.1)] hover:text-[color:var(--text)] max-sm:h-11 max-sm:w-11';

/** Bản nhỏ của `NUT_DONG` — ✕ xoá chữ TRONG ô gõ (mockup ⑤ `.oc .bo`: ô 28, ✕ 14; điện thoại 36 trong ô 44). Nơi đặt căn giữa theo chiều cao ô. */
export const NUT_DONG_NHO = 'grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-sm leading-none text-dim hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text)] max-sm:h-9 max-sm:w-9';
