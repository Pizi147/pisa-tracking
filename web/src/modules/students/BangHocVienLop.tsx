/**
 * KIỂU DÒNG `/classes/:id/roster` + `dichViec` — dùng chung (hồ sơ lớp, Học viên & Lớp TVV / CX, Cần hỗ trợ, Lộ trình tiếp).
 * UI-HV-LOP: bảng học viên theo lớp của Học viên & Lớp đã thay bằng danh sách gọn (`DanhSachHvLop.tsx`) — thân bảng cũ gỡ khỏi tệp này.
 */
import type { ExamPlan, GiaiDoanSauThi, LichThi, NhanYThucEm } from '@shared/domain/index.ts';
import type { KetQuaVao, ViecTiepTheo } from '@shared/domain/index.ts';
import { dich } from '@shared/i18n/index.ts';

/** Các trường của một dòng `GET /classes/:id/roster` mà bảng này đọc. */
export type NhanSauThiEm = { giaiDoan: GiaiDoanSauThi; han: string | null; quaHan: boolean; daGiaHan: boolean };
export type DongRoster = {
  id: number; studentCode: string; fullName: string; status: string; archived: boolean;
  cycle: { target: number | null; khongCamKet?: boolean } | null;
  /** + mốc kế tiếp cho cột "Sắp tới" (`nextAttemptLabel` · tuần của `nextWeekStart` · kỳ vọng `nextKyVong`; `nhanLuotChuaXep` khi lượt đã bỏ tuần). */
  standing: (KetQuaVao & { nextAttemptLabel?: string | null; nextWeekStart?: string | null; nextKyVong?: number | null; nhanLuotChuaXep?: string | null }) | null;
  /** Dự kiến thi ở đúng mức chắc chắn đang có (cột "Dự kiến thi"; roster FT và lớp thường đều trả). */
  examPlan: ExamPlan;
  lichThi?: LichThi | null;
  /** OV-14b: "Đã thi · chờ kết quả" / "Đã xong · chờ bước tiếp" (`sauThiTheoEm`, cùng hàm panel một em) — dưới Dự kiến thi. */
  sauThi?: NhanSauThiEm | null;
  openCases: number; handoverCases: number;
  missing: { key: string; label: string; who: string }[];
  canhBaoYThuc: NhanYThucEm | null;
  timeline: {
    id: number; kind: string; kindLabel: string; myPending: string[]; overdueSkills: number;
    /** OV-10b: cột Admin "Lượt MT gần nhất" · "Ô chưa nhập". */
    weekStart?: string | null; status?: string; scoredRequired?: number; requiredCount?: number;
  }[];
  /** PR-LT: cột Khoá "tiếp theo: …" và cờ chưa có lộ trình tiếp theo (chỉ lớp thường). */
  tiepTheo: string | null;
  chuaLoTrinh: boolean;
  choDuyetChuyen?: boolean;
  /** OV-15b (C13): lượt MT có điểm, mới nhất đầu (`roster` ở classes.ts) — lớp FT hiện OVR · L · R · W · S của lượt đầu. */
  history?: { id: number; overall: number | null; expectation: number | null; writing: number | null; bands: Record<string, number | null> | null; lichSu?: boolean }[];
};

/** PR-EN-c: việc tiếp theo máy chủ dựng (chữ Việt) → tiếng của trang. */
export const dichViec = (v: ViecTiepTheo): ViecTiepTheo => ({ ...v, viec: dich(v.viec), han: v.han && dich(v.han), title: dich(v.title) });

