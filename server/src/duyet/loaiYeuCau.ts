/**
 * GIAO KÈO LOẠI THẺ CỦA HỘP CHỜ DUYỆT (PR-DUYET) — ĐÂY LÀ THỨ PR-SOS / YT4 / LT2 / MT ĐỌC.
 *
 * Một loại thẻ = một khoá ở cuối `LOAI_YEU_CAU` + một dòng `LOAI_YC_META` (shared/domain/yeuCauDuyet.ts) + MỘT phần tử ở cuối
 * `DINH_NGHIA_LOAI` dưới đây. Luồng nguồn tạo thẻ bằng `taoYeuCau` trong giao dịch của mình; quyết định đi qua hộp
 * (`duyetYeuCau` / `tuChoiYeuCau` / `traLoiYeuCau` ở yeuCau.ts) gọi `khiDuyet`/`khiTuChoi`/`khiTraLoi` TRONG giao dịch của hộp.
 * Hàm nguồn tự gọi `chotYeuCau` (idempotent) — đường cũ không qua hộp vẫn chốt đúng thẻ.
 */
import type { Principal } from '../permissions.ts';
import {
  ASSESSED_SKILL_LABEL, INTERVENTION_KIND_LABEL, caseTopicLabel, duongHoSoHocVien, nhanDotNgan, shortDate,
  type AssessedSkill, type InterventionKind, type LoaiYeuCau, type TrangThaiYc,
} from '../../../shared/domain/index.ts';
import { respondToPlan } from '../cases/cases.ts';
import { decideAbsenceMove } from '../fasttrack/absence.ts';
import { attemptHref } from '../fasttrack/attempts.ts';
import { ensurePeriod } from '../platform/week.ts';

export type YeuCauRow = {
  id: number; loai: LoaiYeuCau; doi_tuong_loai: string; doi_tuong_id: number; hoc_vien_id: number | null;
  lop_id: number | null; chi_nhanh_id: number | null; nguoi_xin: number | null; ly_do: string | null; du_lieu: string | null;
  han_duyet: string | null; trang_thai: TrangThaiYc; tao_luc: string;
};

/** Dữ liệu nạp TRƯỚC cho cả danh sách (một câu mỗi bảng) — `moTa` chỉ đọc từ đây. `them`: phần riêng của loại (từ `nap`). */
export type NguCanhThe = {
  homNay: string;
  hocVien: Map<number, string>;
  lop: Map<number, string>;
  nguoi: Map<number, string>;
  them: Map<number, any>;
};

export type DinhNghiaLoai = {
  loai: LoaiYeuCau;
  /** Áp quyết định vào bảng nguồn — chạy TRONG tx của hộp. Hàm nguồn tự gọi `chotYeuCau`; không gọi cũng được, hộp chốt sau. */
  khiDuyet?: (p: Principal, yc: YeuCauRow, vao: { ghiChu: string | null; duLieu?: unknown }) => void;
  khiTuChoi?: (p: Principal, yc: YeuCauRow, lyDo: string) => void;
  khiTraLoi?: (p: Principal, yc: YeuCauRow, traLoi: string) => void;
  /** Điều kiện SQL "đối tượng không còn ý nghĩa" trên bí danh `y` (một biểu thức, không tham số) + lý do hiện trên thẻ. */
  chet?: { sql: string; lyDo: string };
  /** Báo lên: tạo thẻ mới (ON CONFLICT DO NOTHING) + trả số thẻ tạo. Gọi trong `quetYeuCau`; không có gì để tạo thì không mở tx. */
  quet?: (conn: any, homNay: string) => number;
  /** Nạp phần riêng của loại cho MỘT lô thẻ (một câu) → `ngu.them.get(yc.id)`. */
  nap?: (conn: any, ds: YeuCauRow[]) => Map<number, any>;
  /** Chữ riêng của thẻ: dòng tiêu đề sau nhãn phân loại, các dòng phụ, câu "Nếu duyệt: …", đường "Mở". Chỉ đọc. */
  moTa: (yc: YeuCauRow, ngu: NguCanhThe) => {
    tieuDe: string; phu?: string | null; dong: string[]; neuDuyet?: string; mo?: string;
    /** Trộn vào `duLieu` của thẻ cho giao diện (ví dụ tuần đề nghị để ô chọn tuần mặc định). */
    duLieu?: Record<string, unknown>;
  };
};

/** Nạp dòng nguồn của một lô thẻ bằng MỘT câu (`sql` có `IN (?)` trên id đối tượng) → Map id thẻ → dòng nguồn. */
export function napTheoDoiTuong(conn: any, ds: YeuCauRow[], sql: string): Map<number, any> {
  const ids = [...new Set(ds.map((y) => y.doi_tuong_id))];
  const theoId = new Map((conn.prepare(sql.replace('IN (?)', `IN (${ids.map(() => '?').join(',')})`)).all(...ids) as any[])
    .map((r) => [r.id as number, r]));
  return new Map(ds.map((y) => [y.id, theoId.get(y.doi_tuong_id)]));
}
const ngay = (iso: string | null | undefined, ngu: NguCanhThe) => shortDate(iso ?? null, ngu.homNay);
const nguoiXin = (yc: YeuCauRow, ngu: NguCanhThe) => (yc.nguoi_xin == null ? 'Hệ thống' : ngu.nguoi.get(yc.nguoi_xin) ?? 'Giáo viên');

/** MỖI PR THÊM MỘT PHẦN TỬ VÀO CUỐI MẢNG — không sửa phần tử của PR khác. */
export const DINH_NGHIA_LOAI: DinhNghiaLoai[] = [
  /* ------------------------------------------------------------ PR-DUYET · Đề xuất PA (T43) */
  {
    loai: 'de_xuat_pa',
    khiDuyet: (p, yc, v) => { respondToPlan(p, yc.doi_tuong_id, { decision: 'approved', note: v.ghiChu }); },
    khiTuChoi: (p, yc, lyDo) => { respondToPlan(p, yc.doi_tuong_id, { decision: 'declined', note: lyDo }); },
    /* K5-58, Q2: MỘT câu cho mọi đường huỷ PA / đóng Case — kể cả đường của PR sau. */
    chet: {
      sql: `NOT EXISTS (SELECT 1 FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
             WHERE iv.id = y.doi_tuong_id AND iv.status != 'cancelled' AND sc.status != 'done' AND iv.approval_state = 'pending')`,
      lyDo: 'Case đã đóng hoặc PA không còn chờ duyệt',
    },
    nap: (conn, ds) => napTheoDoiTuong(conn, ds,
      `SELECT iv.id, iv.kind, iv.case_id, sc.topic, a.attempt_no, a.kind AS attempt_kind
         FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE iv.id IN (?)`),
    moTa: (yc, ngu) => {
      const x = ngu.them.get(yc.id);
      const moTa = yc.ly_do || (x ? INTERVENTION_KIND_LABEL[x.kind as InterventionKind] ?? 'PA học thuật' : 'PA học thuật');
      return {
        tieuDe: `Đề xuất PA${x?.topic ? ` · ${caseTopicLabel(x.topic)}` : ''}`,
        phu: x ? nhanDotNgan(x.attempt_kind, x.attempt_no) : null,
        dong: [`${nguoiXin(yc, ngu)} đề xuất ${ngay(yc.tao_luc, ngu)}: “${moTa}”`],
        neuDuyet: 'PA bắt đầu hôm nay, ghi kết quả hằng tuần hạn hết T2.',
        mo: yc.hoc_vien_id && x ? duongHoSoHocVien(yc.hoc_vien_id, { caseId: x.case_id }) : undefined,
      };
    },
  },
  /* ------------------------------------------------------------ PR-DUYET · Dời lịch thi lần 2 (K4-04 phần thẻ). Hạn = decide_by (PR-MT). */
  {
    loai: 'lich_thi',
    khiDuyet: (p, yc, v) => {
      const d = (v.duLieu ?? {}) as { periodId?: unknown; tuan?: unknown };
      const periodId = Number.isInteger(d.periodId) ? (d.periodId as number)
        : typeof d.tuan === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.tuan) ? ensurePeriod(d.tuan).id : null;
      decideAbsenceMove(p, yc.doi_tuong_id, { approve: true, note: v.ghiChu, periodId });
    },
    khiTuChoi: (p, yc, lyDo) => { decideAbsenceMove(p, yc.doi_tuong_id, { approve: false, note: lyDo }); },
    /* Đề nghị đã được trả lời ở trang lượt thi (modal cũ) hoặc hết hạn qua đường khác → thẻ tự đóng. */
    chet: {
      sql: `NOT EXISTS (SELECT 1 FROM skill_move_requests r WHERE r.id = y.doi_tuong_id AND r.status = 'pending')`,
      lyDo: 'Đề nghị dời không còn chờ',
    },
    nap: (conn, ds) => napTheoDoiTuong(conn, ds,
      `SELECT r.id, r.skill, r.move_no, r.attempt_id, a.attempt_no, a.kind, a.class_id, pr.code AS tuan, pr.week_start
         FROM skill_move_requests r JOIN assessment_attempts a ON a.id = r.attempt_id
         LEFT JOIN report_periods pr ON pr.id = r.to_period_id
        WHERE r.id IN (?)`),
    moTa: (yc, ngu) => {
      const x = ngu.them.get(yc.id);
      const kn = x ? ASSESSED_SKILL_LABEL[x.skill as AssessedSkill] ?? x.skill : 'kỹ năng';
      const dot = x ? nhanDotNgan(x.kind, x.attempt_no) : null;
      return {
        tieuDe: `Dời ${kn}${dot ? ` ${dot}` : ''} lần ${x?.move_no ?? 2}`,
        dong: [
          `${nguoiXin(yc, ngu)}: ${yc.ly_do || 'vắng'}${x?.tuan ? ` · đề nghị ${x.tuan}` : ''}`,
          `Hết ${ngay(yc.han_duyet, ngu)} không duyệt thì yêu cầu tự huỷ, phần thi bị huỷ.`,
        ],
        neuDuyet: x?.tuan ? `${kn} thi tuần ${x.tuan}.` : undefined,
        mo: x ? attemptHref({ id: x.attempt_id, kind: x.kind, classId: x.class_id }) : undefined,
        duLieu: x?.week_start ? { tuanDeNghi: x.week_start } : undefined,
      };
    },
  },
];

export function dinhNghiaCua(loai: string): DinhNghiaLoai | undefined {
  return DINH_NGHIA_LOAI.find((d) => d.loai === loai);
}
