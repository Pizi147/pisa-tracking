import type { LoaiNhanLop, PhamViLichTest } from '@shared/domain/index.ts';
import type { ToneNhan } from '../../../ui/Nhan.tsx';

/** Trả lời của `GET /cham/lich-test` (`lichTest` ở server/src/cham/canCham.ts). */
export type LuiLich = {
  kyNang: string; hv: string[];
  tuTuan: string | null; sangTuan: string | null; tuTuanStart: string | null; sangTuanStart: string | null;
  /** Dời do vắng lần mấy (PR-MT) — `null` khi lùi lịch không vì vắng. */
  lanVang: number | null;
};
export type DongNo = {
  key: string; classId: number; classCode: string; mode: 'ielts_band' | 'ratio';
  kind: string; attemptNo: number | null; dotLabel: string;
  periodId: number | null; weekStart: string | null;
  kyNang: string[]; kyNangLabel: string;
  conBai: number; soHv: number; attemptIds: number[];
  han: string | null; quaHan: boolean; luiLich: LuiLich | null;
  cuaToi: boolean; duocCham: boolean; coDayLop: boolean; hrefDayDu: string;
};
export type LopLichTest = {
  key: string; classId: number; classCode: string; mode: 'ielts_band' | 'ratio'; branchName: string;
  kind: string | null; dotLabel: string; kyNangTuan: string[];
  tong: number; daCham: number; conBai: number; conBaiCuaToi: number;
  han: string | null; quaHan: boolean;
  nhan: { loai: LoaiNhanLop; chu: string };
  moSan: boolean; hrefDayDu: string;
  /** Số bài vắng tuần này đang chờ Quản lý duyệt dời (PR-MT). */
  choDuyetDoi: number;
};
export type LichTest = {
  scopeEmpty: boolean;
  tuan: { id: number; weekStart: string; weekEnd: string } | null;
  phamVi: PhamViLichTest; coPhamViRong: boolean; coPhanCong: boolean;
  lopDangLoc: { id: number; code: string } | null;
  tongQuan: { daCham: number; tong: number; conPhaiCham: number; no: { bai: number; lop: number }; quaHan: number };
  no: DongNo[];
  lop: LopLichTest[];
};

/** Màu badge theo loại nhãn (N-3): chờ mình = vàng · chờ người khác = chờ · xong = đã xong · chưa tới = xám. */
export const TONE_NHAN_LOP: Record<LoaiNhanLop, ToneNhan> = {
  'da-cham': 'done', 'chua-toi-han': 'muted', 'cho-ban': 'soon', 'cho-gv-khac': 'wait', 'cho-cham': 'wait',
};

/** Bốn môn đánh giá theo thứ tự cố định L · R · W · S — hàng lớp nào cũng đọc cùng một thứ tự. */
export const BON_MON = ['listening', 'reading', 'writing', 'speaking'] as const;
