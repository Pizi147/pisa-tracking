import { createContext, useContext } from 'react';

/**
 * Số "Việc của tôi" của người đang đăng nhập — `summary` của `/my-work` mà khung App đã tải cho badge Công việc (một GET, `demDongViec`).
 * Ô "Việc của tôi ›" ở Tổng quan đọc từ đây (XM 3, rà 11/11) — không tự gọi `/my-work` lần nữa. `null` = chưa tải / vai không có Công việc.
 */
export type SoViecCuaToi = { viec: number; viecQuaHan: number; canLamNgay: number };
export const ViecCuaToiCtx = createContext<SoViecCuaToi | null>(null);
export const useSoViecCuaToi = () => useContext(ViecCuaToiCtx);
