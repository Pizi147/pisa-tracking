import type { ExamPlan, LichThi, LienHe, NhanYThucEm } from '@shared/domain/index.ts';
import { CHIP_VUONG } from '../../ui/Nhan.tsx';
import { ChipDuoiKck } from '../../ui/KetQuaDot.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { GIAI_THICH_KCK } from '@shared/domain/index.ts';
import type { NhanSauThiEm } from './BangHocVienLop.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/*
 * DÒNG `GET /classes/:id/roster` (bảng lớp) + kết luận dưới tên. UI-HO-SO-LOP: bảng FT cũ (`ClassRoster` — Stack 2 mốc, cột Theo dõi `viecTiepTheo`) đã thay
 * bằng `classes/BangHoSoLop.tsx` (mockup V5 khu b); tệp này giữ kiểu dòng + `KetLuan` cho các bảng còn đọc.
 */
type Timeline = {
  id: number; attemptNo: number; cycleSeq: number; route: string | null;
  kind: string; kindLabel: string;
  periodCode: string | null; status: string;
  scoredRequired: number; requiredCount: number;
  overall: number | null;
  passedCount: number | null; failedCount: number | null;
  sosLevel: number | null; evaluable: boolean;
  caseStatus: string | null; myPending: string[]; overdueSkills: number;
};

/** Một mốc trong lịch sử điểm của lớp Fast Track — lớp thường có bảng riêng (`BangDiemLopThuong`, không dùng type này). */
type HistoryRow = {
  id: number; label: string; kind: string; periodCode: string | null;
  sosLevel: number | null; evaluable: boolean;
  scoredRequired: number; requiredCount: number;
  overall: number | null;
  /** Kỳ vọng của đúng mốc này (PR-N1 K2-10) — ô band so với số này, không so target. */
  expectation: number | null;
  /** Writing tổng của mốc (SOS xét cột này). */
  writing: number | null;
  bands: Record<string, number | null> | null;
  /** Rà #119: MT lịch sử (tuần thi trước khi lượt được tạo) — điểm thật nhưng không phải hiện trạng: ô xám, nhãn "lịch sử". */
  lichSu?: boolean;
  /** UI-HO-SO-LOP: kỹ năng (listening|reading|writing|speaking) đã dời do vắng → mã tuần cũ — dòng "vắng W3 SEP" (`chuDoiVang`). */
  vangCu?: Record<string, string> | null;
};

export type RosterRow = {
  missing: { key: string; label: string; who: string }[];
  id: number; studentCode: string; fullName: string; status: string; archived: boolean; moiVao?: boolean;
  /** "Kết thúc vì" (Q18/Q22) — chỉ có ở bảng lớp ĐÃ KẾT THÚC, thay cho nhãn chung "Đã kết thúc". */
  ketThucVi?: string | null;
  skills: string[] | null;
  cycle: { id: number; seq: number; route: string | null; target: number | null; khongCamKet?: boolean } | null;
  standingLine: string | null;
  sosLevel: number | null; provisional: boolean;
  /** OV-9: em KCK dưới kỳ vọng — chip trung tính "Dưới kỳ vọng · KCK". */
  kckDuoi?: boolean;
  openCases: number; handoverCases: number; examPlan: ExamPlan;
  /** OV-14b: "Đã thi · chờ kết quả" / "Đã xong · chờ bước tiếp" (`sauThiTheoEm`, cùng hàm panel một em) — dưới Dự kiến thi. */
  sauThi?: NhanSauThiEm | null;
  latest: Timeline | null; next: Timeline | null; timeline: Timeline[];
  history: HistoryRow[];
  myPending: string[];
  canhBaoYThuc: NhanYThucEm | null;
  /** OV-15f: trạng thái lịch thi thật — cột Ngày thi (`NhanLich`). UI-HO-SO-LOP: `viecTiepTheo` đã bỏ — việc của em ở `/classes/:id/viec-theo-em`. */
  lichThi?: LichThi;
  /** PR-OV3a (M2 §5): điểm đầu vào của lộ trình khi em CHƯA có MT0 — dòng "Đầu vào" chỉ để nhìn (không SOS, không so kỳ vọng). */
  dauVao?: DauVao | null;
  /** OV-10b: cột Phụ huynh (TVV / CX / Admin) thay cột Theo dõi (việc của GV). */
  lienHe?: LienHe;
};
type DauVao = { overall: number | null; listening: number | null; reading: number | null; writing: number | null; speaking: number | null };

/**
 * KẾT LUẬN DƯỚI TÊN — dựng từ ba trường có sẵn (sosLevel · provisional · status), không gọi thêm máy chủ:
 *   SOS {n} · tạm thời (vàng) · SOS {n} (vàng) · Đạt kỳ vọng (xám; thêm "· tạm thời" khi mới có một phần điểm)
 *   · Chưa có kết quả (xám) · Dưới kỳ vọng · KCK (trung tính, OV-9) · Không tính SOS (xám, em KCK chưa có Target) · Đã kết thúc (xám).
 */
export function KetLuan({ row, cotMocTrong }: { row: RosterRow; /** CA2-7: cột Mốc đã ghi "chưa có điểm" → không lặp chip "Chưa có kết quả". */ cotMocTrong: boolean }) {
  const xam = `${CHIP_VUONG} border-muted-line bg-muted-bg text-muted`;
  if (row.status !== 'active') return <span className={xam}>{row.ketThucVi ? dich(row.ketThucVi) : t('Đã kết thúc')}</span>;
  if (row.kckDuoi) return <ChipDuoiKck />;
  /* Q29-1: em KCK chưa có Target có điểm vẫn không có kỳ vọng — nói rõ "không tính SOS", không để đọc thành "chưa chấm". */
  if (row.sosLevel === null && row.cycle?.khongCamKet) return <span className={xam} title={dich(GIAI_THICH_KCK)}>{t('Không tính SOS')}</span>;
  if (row.sosLevel === null) return cotMocTrong ? null : <span className={xam}>{t('Chưa có kết quả')}</span>;
  const tamThoi = row.provisional ? ` · ${t('tạm thời')}` : '';
  /* PR-N1 A2: màu theo đúng mức SOS (hết vàng cho mọi mức); tạm thời = viền đứt + chữ "tạm thời". */
  if (row.sosLevel > 0) return <ChipSos muc={row.sosLevel} tam={row.provisional} ten={row.fullName} />;
  return <span className={xam}>{t('Đạt kỳ vọng')}{tamThoi}</span>;
}
