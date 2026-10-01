/**
 * GIAO KÈO LOẠI THẺ CỦA HỘP CHỜ DUYỆT (PR-DUYET) — ĐÂY LÀ THỨ PR-SOS / YT4 / LT2 / MT ĐỌC.
 *
 * Một loại thẻ = một khoá ở cuối `LOAI_YEU_CAU` + một dòng `LOAI_YC_META` (shared/domain/yeuCauDuyet.ts) + MỘT phần tử ở cuối
 * `DINH_NGHIA_LOAI` dưới đây. Luồng nguồn tạo thẻ bằng `taoYeuCau` trong giao dịch của mình; quyết định đi qua hộp
 * (`duyetYeuCau` / `tuChoiYeuCau` / `traLoiYeuCau` ở yeuCau.ts) gọi `khiDuyet`/`khiTuChoi`/`khiTraLoi` TRONG giao dịch của hộp.
 * Hàm nguồn tự gọi `chotYeuCau` (idempotent) — đường cũ không qua hộp vẫn chốt đúng thẻ.
 */
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import type { Principal } from '../permissions.ts';
import {
  INTERVENTION_KIND_LABEL, REGULAR_SKILLS, caseTopicLabel, duongHoSoHocVien, moTaBoTro, nhanDotNgan, nhanLoaiXuLy, outcomeLabelFor, shortDate, tenMonNgan, tuanLich,
  type InterventionKind, type LoaiYeuCau, type TrangThaiYc,
  type TruongDeXuat,
} from '../../../shared/domain/index.ts';
import { caseTitleOf, respondToPlan } from '../cases/cases.ts';
import { apDungKhongTheoDoi, tuChoiKhongTheoDoi } from '../cases/sosAuto.ts';
import { chuTheDoiLan2, decideAbsenceMove } from '../fasttrack/absence.ts';
import { attemptHref } from '../fasttrack/attempts.ts';
import { ensurePeriod } from '../platform/week.ts';
import { addJourney } from '../platform/audit.ts';
import { db, tx } from '../db.ts';
import { chotHanXuLy } from '../yThuc/trangThai.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest } from '../util.ts';
import { reviseTarget, updateCycle } from '../fasttrack/cycles.ts';
import { NHAN_TRUONG_DE_XUAT, TRUONG_TU_AP, hienTaiCua } from './deXuatSua.ts';
import { CO_THE_KHONG_THEO_DOI, awaitingCauseCaseIds } from '../cases/sosState.ts';
import { khiDuyetKeHoach, khiTuChoiKeHoach } from '../cases/boTro.ts';
import { chotYeuCau, taoYeuCau } from './yeuCau.ts';
import { trangThaiYThuc, ungVienVaThe, type EmYThuc } from '../yThuc/trangThai.ts';
import { classProgressMany } from '../classes/schedule.ts';
import { apDungDeXuatChuyenLop, demChuaCoLenh, nguoiNhanCuaLop } from '../classes/lenhChuyen.ts';

/**
 * PR-YT4 — vì sao em cần Báo lên (null = không): bắt buộc quá hạn · Mới quá 5 ngày chưa ai xem · đã duyệt chưa thực hiện quá 5 ngày
 * (K3-37). Em Tạm dừng không Báo lên (T65). `viec` = tiền tố khoá việc trong Công việc của GVCN (Nhắc trỏ đúng dòng).
 */
export function lyDoBaoLenYThuc(em: EmYThuc | undefined): { viec: 'yt_xu_ly' | 'yt_xem' | 'yt_thuc_hien'; ngan: string; cau: string; viecId: number } | null {
  /* PR-S3F #12: lớp CHƯA có GVCN vẫn Báo lên (thẻ không có `ownerId`) — đúng là lúc QL cần biết nhất. */
  if (!em || em.tamDung) return null;
  const tt = [...em.viPham.values()];
  const xuLy = tt.filter((x) => x.lyDoQuaHan === 'xu-ly').length;
  if (xuLy) return { viec: 'yt_xu_ly', viecId: em.studentId, ngan: `${em.soBatBuoc} vi phạm chưa xử lý`, cau: `${em.soBatBuoc} vi phạm bắt buộc xử lý đã quá hạn` };
  const xem = tt.filter((x) => x.lyDoQuaHan === 'xem').length;
  if (xem) return { viec: 'yt_xem', viecId: em.studentId, ngan: `${xem} vi phạm chưa ai xem`, cau: `${xem} vi phạm mới quá 5 ngày chưa ai ghi nhận` };
  /* PR-S3F #7: quá hạn tính trên MỌI đề xuất đã duyệt — nêu lần xử lý quá hạn sớm nhất; khoá việc theo id lần xử lý (`yt_thuc_hien:{id}`). */
  const qua = em.daDuyet.find((x) => x.quaHan);
  if (qua) {
    const nhan = nhanLoaiXuLy(qua.kind, qua.customName);
    return { viec: 'yt_thuc_hien', viecId: qua.id, ngan: `${nhan} đã duyệt chưa thực hiện`, cau: `${nhan} QL đã duyệt, quá 5 ngày chưa thực hiện` };
  }
  return null;
}

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
    /* Đề nghị đã được trả lời ở trang lượt thi (modal cũ) hoặc hết hạn qua đường khác → thẻ tự đóng.
     * PR-MT: lượt đã huỷ hoặc MT lịch sử (không vào luồng vắng) cũng không còn thẻ chờ. */
    chet: {
      sql: `NOT EXISTS (SELECT 1 FROM skill_move_requests r JOIN assessment_attempts a ON a.id = r.attempt_id
                          WHERE r.id = y.doi_tuong_id AND r.status = 'pending' AND a.status != 'cancelled' AND a.lich_su = 0)`,
      lyDo: 'Đề nghị dời không còn chờ',
    },
    nap: (conn, ds) => napTheoDoiTuong(conn, ds,
      `SELECT r.id, r.skill, r.move_no, r.attempt_id, a.attempt_no, a.kind, a.class_id, pr.code AS tuan, pr.week_start,
              c.programme_code AS ct
         FROM skill_move_requests r JOIN assessment_attempts a ON a.id = r.attempt_id
         LEFT JOIN classes c ON c.id = a.class_id
         LEFT JOIN report_periods pr ON pr.id = r.to_period_id
        WHERE r.id IN (?)`),
    moTa: (yc, ngu) => {
      const x = ngu.them.get(yc.id);
      const kn = x ? tenMonNgan(x.ct ?? null, x.skill) : 'kỹ năng';   // MH2: G+V / P / Tổng hợp theo chương trình lớp
      const dot = x ? nhanDotNgan(x.kind, x.attempt_no) : null;
      return {
        /* PR-MT (K4-04): thẻ Mock nói đủ trong một dòng — `Dời L · MT1 · lần 2 · Duyệt = L thi W1 OCT` (chuTheDoiLan2). */
        tieuDe: x?.kind === 'mock'
          ? chuTheDoiLan2({ skill: x.skill, attemptNo: x.attempt_no, moveNo: x.move_no, tuanDich: x.week_start ?? null, homNay: ngu.homNay, ct: x.ct ?? null })
          : `Dời ${kn}${dot ? ` ${dot}` : ''} lần ${x?.move_no ?? 2}`,
        dong: [
          `${nguoiXin(yc, ngu)}: ${yc.ly_do || 'em vắng buổi thi'}${x?.tuan ? ` · đề nghị ${x.tuan}` : ''}`,
          /* Chỉ nói "tự huỷ" khi thẻ còn chờ — thẻ đã quyết thì câu này sai. */
          ...(yc.trang_thai === 'cho' ? [`Hết ${ngay(yc.han_duyet, ngu)} chưa duyệt thì yêu cầu tự huỷ và phần thi bị huỷ.`] : []),
        ],
        neuDuyet: x?.tuan ? `${kn} thi tuần ${x.tuan}.` : undefined,
        mo: x ? attemptHref({ id: x.attempt_id, kind: x.kind, classId: x.class_id }) : undefined,
        duLieu: x?.week_start ? { tuanDeNghi: x.week_start } : undefined,
      };
    },
  },
  /* ------------------------------------------------------------ PR-DUYET · Xin ý kiến (T64) — PA KHÔNG dừng, QL chỉ Trả lời */
  {
    loai: 'xin_y_kien',
    khiTraLoi: (p, yc, traLoi) => {
      const iv = db().prepare(
        `SELECT iv.case_id, iv.description, COALESCE(sc.cycle_id, a.cycle_id) AS cycle_id FROM case_interventions iv
           JOIN sos_cases sc ON sc.id = iv.case_id LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE iv.id = ?`,
      ).get(yc.doi_tuong_id) as any;
      if (!yc.hoc_vien_id || !iv) return;
      addJourney({
        studentId: yc.hoc_vien_id, cycleId: iv.cycle_id ?? null, eventType: 'note', eventDate: demoToday(),
        title: `Quản lý trả lời: ${traLoi.slice(0, 80)}`, detail: yc.ly_do ? `Giáo viên hỏi: ${yc.ly_do}` : null,
        refTable: 'case_interventions', refId: yc.doi_tuong_id, createdBy: p.userId, dedupKey: `xin-y-kien:${yc.id}`,
      });
    },
    chet: {
      sql: `NOT EXISTS (SELECT 1 FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
             WHERE iv.id = y.doi_tuong_id AND iv.status != 'cancelled' AND sc.status != 'done')`,
      lyDo: 'PA đã huỷ hoặc Case đã đóng',
    },
    nap: (conn, ds) => {
      const ids = ds.map((y) => y.id);
      return new Map((conn.prepare(
        `SELECT y.id, iv.kind, iv.description, iv.case_id, fu.outcome, fu.note, fu.observed_on
           FROM yeu_cau_duyet y JOIN case_interventions iv ON iv.id = y.doi_tuong_id
           LEFT JOIN case_followups fu ON fu.id = json_extract(y.du_lieu, '$.followupId')
          WHERE y.id IN (${ids.map(() => '?').join(',')})`).all(...ids) as any[]).map((r) => [r.id as number, r]));
    },
    moTa: (yc, ngu) => {
      const x = ngu.them.get(yc.id);
      const tenPa = x ? (x.description || INTERVENTION_KIND_LABEL[x.kind as InterventionKind] || 'PA học thuật') : 'PA học thuật';
      return {
        tieuDe: `Xin ý kiến · PA ${tenPa.length > 60 ? `${tenPa.slice(0, 57)}…` : tenPa}`,
        dong: [
          `${nguoiXin(yc, ngu)} (${ngay(yc.tao_luc, ngu)}): “${yc.ly_do ?? ''}”`,
          ...(x?.outcome ? [`Kết quả tuần: ${outcomeLabelFor(x.outcome)}${x.note ? ` — ${x.note}` : ''}`] : []),
        ],
        mo: yc.hoc_vien_id && x ? duongHoSoHocVien(yc.hoc_vien_id, { caseId: x.case_id }) : undefined,
        duLieu: x ? { caseId: x.case_id } : undefined,
      };
    },
  },
  /* ------------------------------------------------------------ PR-DUYET · Đề xuất sửa thông tin HV (T44, Q6) */
  {
    loai: 'sua_thong_tin',
    khiDuyet: (p, yc, v) => {
      const d = JSON.parse(yc.du_lieu ?? '{}') as { truong: TruongDeXuat; moi: string | number };
      if (!TRUONG_TU_AP.includes(d.truong)) {
        /* Q6: lớp / lịch MT / khác cần chọn chi tiết ở màn gốc — Duyệt chỉ ghi nhận Quản lý đã làm gì. */
        if ((v.ghiChu ?? '').length < 3) throw badRequest('Làm ở màn gốc trước, rồi ghi đã làm gì (ví dụ "Đã chuyển sang lớp MB FT 102") và bấm Duyệt.');
        return;
      }
      const cyc = hienTaiCua(db(), yc.hoc_vien_id!).cycle;
      if (!cyc) throw badRequest('Em không còn lộ trình đang chạy — không áp được đề xuất.');
      if (d.truong === 'target') reviseTarget(p, cyc.id, { newTarget: d.moi, reason: yc.ly_do });   // số hoặc KCK (Q29-1)
      else updateCycle(p, cyc.id, { route: String(d.moi) });
    },
    /* Em thôi học / lưu trữ, hoặc giá trị hiện tại đã bằng giá trị đề xuất (ai đó đã sửa rồi). */
    chet: {
      sql: `EXISTS (SELECT 1 FROM students s WHERE s.id = y.hoc_vien_id AND (s.status != 'active' OR s.archived_at IS NOT NULL))
         OR (y.doi_tuong_loai = 'student:target' AND EXISTS (SELECT 1 FROM learning_cycles lc WHERE lc.student_id = y.hoc_vien_id
               AND lc.status = 'active' AND (json_extract(y.du_lieu, '$.moi') = 'KCK' AND lc.khong_cam_ket = 1
                 OR json_extract(y.du_lieu, '$.moi') != 'KCK' AND lc.target_score = CAST(json_extract(y.du_lieu, '$.moi') AS REAL))))
         OR (y.doi_tuong_loai = 'student:lo-trinh' AND EXISTS (SELECT 1 FROM learning_cycles lc WHERE lc.student_id = y.hoc_vien_id
               AND lc.status = 'active' AND lc.route = json_extract(y.du_lieu, '$.moi')))`,
      lyDo: 'Học viên không còn học hoặc thông tin đã được sửa',
    },
    moTa: (yc, ngu) => {
      const d = JSON.parse(yc.du_lieu ?? '{}') as { truong: TruongDeXuat; cu: unknown; moi: unknown };
      const nhan = NHAN_TRUONG_DE_XUAT[d.truong] ?? 'thông tin';
      const tuAp = TRUONG_TU_AP.includes(d.truong);
      const hien = (x: unknown) => (x === null || x === undefined || x === '' ? 'chưa có' : typeof x === 'number' ? x.toFixed(1) : String(x));
      return {
        /* Không có giá trị cũ (lịch MT, khác) thì không ghi "chưa có →" — nói thẳng nội dung đề xuất. */
        tieuDe: d.truong === 'khac' ? `Đề xuất sửa: ${hien(d.moi)}`
          : d.cu == null && !tuAp ? `Đề xuất sửa ${nhan}: ${hien(d.moi)}` : `Đề xuất sửa ${nhan} ${hien(d.cu)} → ${hien(d.moi)}`,
        dong: [`${nguoiXin(yc, ngu)} (${ngay(yc.tao_luc, ngu)}): “${yc.ly_do ?? ''}”`],
        neuDuyet: tuAp
          ? (d.truong === 'target' ? 'Target đổi từ hôm nay; kỳ vọng của các lượt đã thi giữ nguyên.' : 'Lộ trình đổi ngay.')
          : 'hệ thống không tự đổi — sửa ở màn gốc trước, rồi Duyệt và ghi đã làm gì.',
        duLieu: { canGhiChu: !tuAp },
      };
    },
  },
  /* ------------------------------------------------------------ PR-DUYET · Báo lên: Case chờ nguyên nhân quá hạn (K1-57, T77) */
  {
    loai: 'bao_len_nguyen_nhan',
    /* PR-SOS: hạn ở `sos_cases.han_xac_nhan`; "chờ nguyên nhân" (đã loại thẻ Không cần theo dõi đang chờ) là của `awaitingCauseCaseIds`. */
    quet: (conn, homNay) => {
      const ung = conn.prepare(
        `SELECT sc.id, sc.owner_user_id, COALESCE(sc.student_id, a.student_id) AS sid, a.class_id, sc.han_xac_nhan AS han
           FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
           JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
          WHERE sc.status != 'done' AND ${HV_DANG_HOC_SQL('s')}   /* K3-41: em Tạm dừng không bị Báo lên */
            AND sc.han_xac_nhan < ?
            AND NOT EXISTS (SELECT 1 FROM yeu_cau_duyet y WHERE y.loai = 'bao_len_nguyen_nhan' AND y.doi_tuong_loai = 'sos_case'
                             AND y.doi_tuong_id = sc.id AND y.trang_thai = 'cho')`,
      ).all(homNay) as any[];
      if (!ung.length) return 0;
      const cho = new Set(awaitingCauseCaseIds(ung.map((r) => r.id as number)));
      const tao = ung.filter((r) => cho.has(r.id));
      if (!tao.length) return 0;
      return tx(() => tao.filter((r) => taoYeuCau(conn, {
        loai: 'bao_len_nguyen_nhan', doiTuongLoai: 'sos_case', doiTuongId: r.id, hocVienId: r.sid, lopId: r.class_id ?? null,
        nguoiXin: null, hanDuyet: r.han, duLieu: { viecKey: `cause:${r.id}`, ownerId: r.owner_user_id ?? null },
      }) !== null).length);
    },
    chet: {
      sql: `NOT EXISTS (SELECT 1 FROM sos_cases sc WHERE sc.id = y.doi_tuong_id AND sc.status != 'done'
             AND NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary')
             AND NOT ${CO_THE_KHONG_THEO_DOI('sc')})`,
      lyDo: 'Việc gốc đã xong',
    },
    nap: (conn, ds) => {
      const ids = ds.map((y) => y.id);
      return new Map((conn.prepare(
        `SELECT y.id, sc.topic, sc.owner_user_id, u.full_name AS ten_gv, n.created_at AS da_nhac
           FROM yeu_cau_duyet y JOIN sos_cases sc ON sc.id = y.doi_tuong_id LEFT JOIN users u ON u.id = sc.owner_user_id
           LEFT JOIN notifications n ON n.user_id = sc.owner_user_id AND n.dedup_key = 'nhac:cause:' || sc.id || ':' || ?
          WHERE y.id IN (${ids.map(() => '?').join(',')})`).all(demoToday(), ...ids) as any[]).map((r) => [r.id as number, r]));
    },
    moTa: (yc, ngu) => {
      const x = ngu.them.get(yc.id);
      return {
        tieuDe: `Case chờ nguyên nhân quá hạn${x?.topic ? ` · ${caseTopicLabel(x.topic)}` : ''}`,
        phu: x?.ten_gv ? `GVBM ${x.ten_gv}` : null,
        dong: ['Không cần duyệt — để QL biết và nhắc.'],
        mo: yc.hoc_vien_id ? duongHoSoHocVien(yc.hoc_vien_id, { caseId: yc.doi_tuong_id }) : undefined,
        duLieu: { tenGv: x?.ten_gv ?? null, daNhacLuc: x?.da_nhac ?? null, ownerId: x?.owner_user_id ?? null },
      };
    },
  },
  /* ------------------------------------------------------------ PR-SOS · Không cần theo dõi (S4-5…S4-7, T23, YC-12.4) */
  {
    loai: 'khong_theo_doi',
    khiDuyet: (p, yc) => apDungKhongTheoDoi(db(), yc, p.userId),
    khiTuChoi: (p, yc, lyDo) => tuChoiKhongTheoDoi(db(), yc, p.userId, lyDo),
    /* S4-7: Case đóng vì lý do khác (điểm sửa thành đạt, lượt huỷ, đổi chương trình) → thẻ tự đóng. */
    chet: { sql: `NOT EXISTS (SELECT 1 FROM sos_cases sc WHERE sc.id = y.doi_tuong_id AND sc.status != 'done')`, lyDo: 'Case đã đóng' },
    nap: (conn, ds) => napTheoDoiTuong(conn, ds,
      `SELECT sc.id, sc.topic, sc.category, sc.title, sc.origin_kind, sc.sos_level, sc.student_id, sc.cycle_id FROM sos_cases sc WHERE sc.id IN (?)`),
    moTa: (yc, ngu) => {
      const x = ngu.them.get(yc.id);
      return {
        tieuDe: `Không cần theo dõi${x?.topic ? ` · ${caseTopicLabel(x.topic)}` : ''}`,
        dong: [...(x ? [caseTitleOf(x)] : []), `${nguoiXin(yc, ngu)} (${ngay(yc.tao_luc, ngu)}) · Lý do: ${yc.ly_do ?? ''}`],
        neuDuyet: 'Case và PA theo quy chế huỷ — không tính thất bại.',
        mo: yc.hoc_vien_id ? duongHoSoHocVien(yc.hoc_vien_id, { caseId: yc.doi_tuong_id }) : undefined,
      };
    },
  },
  /* ------------------------------------------------------------ PR-YT4 · Xử lý Ý thức cần duyệt (V4-9, V4-10, M-11, T29, T30) */
  {
    loai: 'y_thuc',
    khiDuyet: (_p, yc) => {
      db().prepare(`UPDATE discipline_measures SET status = 'da_duyet', quyet_luc = ?, updated_at = ? WHERE id = ? AND status = 'cho_duyet'`)
        .run(demoToday(), new Date().toISOString(), yc.doi_tuong_id);
    },
    /* Từ chối → vi phạm về Cần xử lý từ ngày quyết (batBuocTu), bậc giữ; lý do nằm ở thẻ (Q13). */
    khiTuChoi: (_p, yc) => {
      db().prepare(`UPDATE discipline_measures SET status = 'tu_choi', quyet_luc = ?, updated_at = ? WHERE id = ? AND status = 'cho_duyet'`)
        .run(demoToday(), new Date().toISOString(), yc.doi_tuong_id);
      /* PR-Pb2-b (Q14): vi phạm chưa từng bắt buộc nay thành Cần xử lý → chốt hạn; đã chốt thì giữ. */
      if (yc.hoc_vien_id) chotHanXuLy([yc.hoc_vien_id]);
    },
    chet: {
      sql: `NOT EXISTS (SELECT 1 FROM discipline_measures m WHERE m.id = y.doi_tuong_id AND m.status = 'cho_duyet')
         OR EXISTS (SELECT 1 FROM students s WHERE s.id = y.hoc_vien_id AND s.archived_at IS NOT NULL)`,
      lyDo: 'Không còn chờ duyệt',
    },
    /* Không `nap`: loại, tên, số vi phạm, bậc kế lưu ở `du_lieu` lúc gửi (guiDeXuat) — thẻ nói đúng điều QL được xin duyệt. */
    moTa: (yc, ngu) => {
      const d = (() => { try { return JSON.parse(yc.du_lieu ?? '{}'); } catch { return {}; } })() as
        { kind?: string; customName?: string | null; bacKe?: string | null; soViPham?: number; soTep?: number };
      const nhan = nhanLoaiXuLy(d.kind ?? '', d.customName ?? null);
      return {
        tieuDe: `Đề xuất ${nhan}`,
        phu: d.soViPham ? `${d.soViPham} vi phạm` : null,
        dong: [
          `${nguoiXin(yc, ngu)} đề xuất ${ngay(yc.tao_luc, ngu)}: “${yc.ly_do ?? ''}”`,
          ...(d.bacKe ? [`Bậc thang kế tiếp đang là ${d.bacKe} — duyệt đề xuất này không đổi bậc`] : []),
          /* Bằng chứng bắt buộc khi gửi (V4-10): đếm lúc gửi, xem ở tab Ý thức của em (nút Mở) — không thêm câu SQL mỗi thẻ. */
          ...(d.soTep ? [`Kèm ${d.soTep} bằng chứng (tệp / liên kết) — bấm Mở để xem`] : []),
        ],
        neuDuyet: 'GVCN ghi "Đã thực hiện" trong 5 ngày.',
        mo: yc.hoc_vien_id ? duongHoSoHocVien(yc.hoc_vien_id, { tab: 'y-thuc' }) : undefined,
      };
    },
  },
  /* ------------------------------------------------------------ PR-YT4 · Báo lên: Ý thức quá hạn — một thẻ mỗi em (V4-4, V4-5, K3-37, Q9) */
  {
    loai: 'bao_len_y_thuc',
    /* Luật ở JS (một cửa trạng thái) nên không viết được thành `chet` SQL: tạo VÀ đóng đều ở đây. Không có gì để làm → không mở tx. */
    quet: (conn, homNay) => {
      const uv = ungVienVaThe({ kemThe: true });
      if (!uv.length) return 0;
      const ids = uv.map((r) => r.id);
      const dangCho = new Map(uv.filter((r) => r.coThe).map((r) => [r.id, true]));
      const trang = trangThaiYThuc(ids, homNay);
      const lyDo = (sid: number) => lyDoBaoLenYThuc(trang.get(sid));
      const tao = ids.filter((sid) => !dangCho.has(sid) && lyDo(sid));
      const dong = [...dangCho.keys()].filter((sid) => !lyDo(sid));
      if (!tao.length && !dong.length) return 0;
      return tx(() => {
        for (const sid of dong) {
          chotYeuCau(conn, { loai: 'bao_len_y_thuc', doiTuongLoai: 'hoc_vien_y_thuc', doiTuongId: sid }, 'tu_dong', { lyDo: 'Việc gốc đã xong' });
        }
        return tao.filter((sid) => {
          const em = trang.get(sid)!;
          const l = lyDo(sid)!;
          return taoYeuCau(conn, {
            loai: 'bao_len_y_thuc', doiTuongLoai: 'hoc_vien_y_thuc', doiTuongId: sid, hocVienId: sid, lopId: em.lopId,
            nguoiXin: null, hanDuyet: null, lyDo: l.cau, duLieu: { viecKey: `${l.viec}:${l.viecId}`, ownerId: em.gvcnId ?? null, lyDo: l.cau },
          }) !== null;
        }).length;
      });
    },
    nap: (conn, ds) => {
      const ids = ds.map((y) => y.id);
      const hom = demoToday();
      /* Chỉ thẻ đang chờ cần trạng thái sống (thẻ đã đóng đọc lý do đã lưu) — trong request GET, quét vừa nạp nên không tốn thêm câu. */
      const trang = trangThaiYThuc(ds.filter((y) => y.trang_thai === 'cho').map((y) => y.doi_tuong_id), hom);
      const rows = conn.prepare(
        `SELECT y.id, y.doi_tuong_id AS sid, json_extract(y.du_lieu, '$.ownerId') AS owner, u.full_name AS ten_gv, n.created_at AS da_nhac
           FROM yeu_cau_duyet y LEFT JOIN users u ON u.id = json_extract(y.du_lieu, '$.ownerId')
           LEFT JOIN notifications n ON n.user_id = json_extract(y.du_lieu, '$.ownerId')
                 AND n.dedup_key = 'nhac:' || json_extract(y.du_lieu, '$.viecKey') || ':' || ?
          WHERE y.id IN (${ids.map(() => '?').join(',')})`).all(hom, ...ids) as any[];
      return new Map(rows.map((r) => [r.id as number, { ...r, em: trang.get(r.sid) }]));
    },
    moTa: (yc, ngu) => {
      const x = ngu.them.get(yc.id);
      const l = lyDoBaoLenYThuc(x?.em);
      return {
        tieuDe: `Ý thức quá hạn · ${l?.ngan ?? (yc.ly_do || 'đã hết quá hạn')}`,
        phu: x?.ten_gv ? `GVCN ${x.ten_gv}` : null,
        dong: ['Không cần duyệt — để QL biết và nhắc.'],
        mo: yc.hoc_vien_id ? duongHoSoHocVien(yc.hoc_vien_id, { tab: 'y-thuc' }) : undefined,
        duLieu: { tenGv: x?.ten_gv ?? null, daNhacLuc: x?.da_nhac ?? null, ownerId: x?.owner ?? null },
      };
    },
  },
  /* ------------------------------------------------------------ PR-CT · Đề xuất chuyển lớp (Q30-1, Q14) — Duyệt = ra lệnh, Quản lý sửa được lớp và tuần */
  {
    loai: 'de_xuat_chuyen_lop',
    khiDuyet: (p, yc, v) => { apDungDeXuatChuyenLop(p, yc, v.duLieu); },
    /* Em không còn học, hoặc đã có lệnh chuyển lớp từ đường khác → thẻ không còn ý nghĩa. */
    chet: {
      sql: `NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = y.hoc_vien_id AND e.status = 'active')
         OR EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = y.hoc_vien_id AND l.trang_thai = 'cho' AND l.loi IS NULL AND l.tu_yeu_cau_id IS NOT y.id)`,
      lyDo: 'Học viên không còn học hoặc đã có lệnh chuyển lớp',
    },
    nap: (conn, ds) => {
      const ids = ds.map((y) => y.id);
      return new Map((conn.prepare(
        `SELECT y.id, c.code AS lop FROM yeu_cau_duyet y LEFT JOIN classes c ON c.id = json_extract(y.du_lieu, '$.lopDichId') WHERE y.id IN (${ids.map(() => '?').join(',')})`,
      ).all(...ids) as any[]).map((r) => [r.id as number, r]));
    },
    moTa: (yc, ngu) => {
      const d = (() => { try { return JSON.parse(yc.du_lieu ?? '{}'); } catch { return {}; } })() as { lopDichId?: number | null; tuan?: string | null };
      const lop = ngu.them.get(yc.id)?.lop as string | undefined;
      return {
        tieuDe: `Đề xuất chuyển lớp · ${lop ?? 'chưa chọn lớp'}${d.tuan ? ` · từ ${tuanLich(d.tuan, ngu.homNay)}` : ''}`,
        dong: [`${nguoiXin(yc, ngu)} (${ngay(yc.tao_luc, ngu)}): “${yc.ly_do ?? ''}”`],
        neuDuyet: 'Mở panel ra lệnh — sửa được lớp, tuần.',
        mo: yc.hoc_vien_id ? duongHoSoHocVien(yc.hoc_vien_id) : undefined,
        duLieu: { moPanelChuyenLop: true, lopDichId: d.lopDichId ?? null, tuan: d.tuan ?? null },
      };
    },
  },
  /* ------------------------------------------------------------ PR-CT · Báo lên: Bàn giao quá hạn 3 ngày — MỘT thẻ mỗi lớp nguồn (Q12) */
  {
    loai: 'bao_len_ban_giao',
    /* Lệnh vẫn chạy đúng tuần — thẻ chỉ để Quản lý biết và nhắc GVCN. Quét chỉ TẠO (một câu, và thường ra rỗng); ĐÓNG là việc của `chet` dưới đây, chạy chung câu
       "thẻ chết" của hộp nên không tốn thêm câu nào. Không có gì để tạo → không mở tx. */
    quet: (conn, homNay) => {
      const tao = conn.prepare(
        `SELECT l.lop_nguon_id AS lop, MIN(l.han_gvcn) AS han, c.branch_id FROM lenh_chuyen_lop l JOIN classes c ON c.id = l.lop_nguon_id
          WHERE l.trang_thai != 'huy' AND l.huong != 'dung_hoc' AND l.xac_nhan_luc IS NULL AND l.han_gvcn < ?
            AND NOT EXISTS (SELECT 1 FROM yeu_cau_duyet y WHERE y.loai = 'bao_len_ban_giao' AND y.doi_tuong_id = l.lop_nguon_id AND y.trang_thai = 'cho')
          GROUP BY l.lop_nguon_id`,
      ).all(homNay) as any[];
      if (!tao.length) return 0;
      const gv = nguoiNhanCuaLop(tao.map((r) => r.lop as number));
      return tx(() => tao.filter((r) => taoYeuCau(conn, {
        loai: 'bao_len_ban_giao', doiTuongLoai: 'lop:ban-giao', doiTuongId: r.lop, lopId: r.lop, chiNhanhId: r.branch_id, nguoiXin: null, hanDuyet: r.han,
        duLieu: { viecKey: `ban_giao:${r.lop}`, ownerId: [...(gv.get(r.lop) ?? [])][0] ?? null },
      }) !== null).length);
    },
    chet: {
      sql: `NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.lop_nguon_id = y.doi_tuong_id AND l.trang_thai != 'huy' AND l.huong != 'dung_hoc' AND l.xac_nhan_luc IS NULL)`,
      lyDo: 'Việc gốc đã xong',
    },
    nap: (conn, ds) => {
      const ids = ds.map((y) => y.id);
      return new Map((conn.prepare(
        `SELECT y.id, c.code AS lop, json_extract(y.du_lieu, '$.ownerId') AS owner, u.full_name AS ten_gv, n.created_at AS da_nhac,
                (SELECT COUNT(*) FROM lenh_chuyen_lop l WHERE l.lop_nguon_id = y.doi_tuong_id AND l.trang_thai != 'huy' AND l.huong != 'dung_hoc' AND l.xac_nhan_luc IS NULL) AS n
           FROM yeu_cau_duyet y JOIN classes c ON c.id = y.doi_tuong_id LEFT JOIN users u ON u.id = json_extract(y.du_lieu, '$.ownerId')
           LEFT JOIN notifications n ON n.user_id = json_extract(y.du_lieu, '$.ownerId') AND n.dedup_key = 'nhac:' || json_extract(y.du_lieu, '$.viecKey') || ':' || ?
          WHERE y.id IN (${ids.map(() => '?').join(',')})`,
      ).all(demoToday(), ...ids) as any[]).map((r) => [r.id as number, r]));
    },
    moTa: (yc, ngu) => {
      const x = ngu.them.get(yc.id);
      return {
        tieuDe: `Bàn giao quá hạn${x?.lop ? ` · ${x.lop}` : ''}`,
        phu: x?.ten_gv ? `GVCN ${x.ten_gv}` : 'Lớp chưa có GVCN',
        dong: [`${x?.n ?? 0} em chưa được xác nhận bàn giao (hạn hết ${ngay(yc.han_duyet, ngu)}). Em vẫn chuyển đúng tuần — không cần duyệt, để QL biết và nhắc.`],
        mo: `/hoc-vien/lop/${yc.doi_tuong_id}?viec=ban-giao`,
        duLieu: { tenGv: x?.ten_gv ?? null, daNhacLuc: x?.da_nhac ?? null, ownerId: x?.owner ?? null },
      };
    },
  },
  /* ------------------------------------------------------------ PR-CT · Báo lên: lớp thường HẾT tuần kết thúc còn em chưa có lệnh (Q30-4, Q13) */
  {
    loai: 'bao_len_chua_lenh',
    /* Quét chỉ TẠO: một câu ra các lớp thường CÓ THỂ đã hết khoá (ngày bắt đầu + số tuần ≤ hôm nay — tập rộng hơn `phase = finished` một chút), còn em chưa có lệnh
       và chưa có thẻ; thường rỗng → không tính tiến độ lớp. ĐÓNG do `chet` (hết em chưa có lệnh, hoặc lớp đã kết thúc). */
    quet: (conn, homNay) => {
      const lop = (conn.prepare(
        `SELECT c.id FROM classes c LEFT JOIN report_periods rp ON rp.id = c.start_period_id
          WHERE c.status = 'active' AND c.is_fast_track = 0
            AND (c.so_tuan IS NULL OR rp.week_start IS NULL OR date(rp.week_start, '+' || (c.so_tuan * 7) || ' days') <= ?)
            AND EXISTS (SELECT 1 FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.class_id = c.id AND e.status = 'active'
                          AND ${HV_DANG_HOC_SQL('s')}
                          AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = e.student_id AND l.trang_thai = 'cho'))
            AND NOT EXISTS (SELECT 1 FROM yeu_cau_duyet y WHERE y.loai = 'bao_len_chua_lenh' AND y.doi_tuong_id = c.id AND y.trang_thai = 'cho')`,
      ).all(homNay) as any[]).map((r) => r.id as number);
      if (!lop.length) return 0;
      const tienDo = classProgressMany(lop);
      const tao = lop.filter((id) => tienDo.get(id)?.phase === 'finished');
      if (!tao.length) return 0;
      return tx(() => tao.filter((id) => taoYeuCau(conn, {
        loai: 'bao_len_chua_lenh', doiTuongLoai: 'lop:chua-lenh', doiTuongId: id, lopId: id, nguoiXin: null, hanDuyet: null,
        duLieu: { viecKey: `chua_lenh:${id}`, ownerId: null },
      }) !== null).length);
    },
    chet: {
      sql: `NOT EXISTS (SELECT 1 FROM classes c WHERE c.id = y.doi_tuong_id AND c.status = 'active')
         OR NOT EXISTS (SELECT 1 FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.class_id = y.doi_tuong_id AND e.status = 'active'
              AND ${HV_DANG_HOC_SQL('s')} AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = e.student_id AND l.trang_thai = 'cho'))`,
      lyDo: 'Việc gốc đã xong',
    },
    nap: (conn, ds) => {
      const ids = ds.map((y) => y.id);
      return new Map((conn.prepare(
        `SELECT y.id, c.code AS lop, (SELECT COUNT(*) FROM enrollments e JOIN students s ON s.id = e.student_id
            WHERE e.class_id = y.doi_tuong_id AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')}
              AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = e.student_id AND l.trang_thai = 'cho')) AS n
           FROM yeu_cau_duyet y JOIN classes c ON c.id = y.doi_tuong_id WHERE y.id IN (${ids.map(() => '?').join(',')})`,
      ).all(...ids) as any[]).map((r) => [r.id as number, r]));
    },
    moTa: (yc, ngu) => {
      const x = ngu.them.get(yc.id);
      return {
        tieuDe: `Lớp hết khoá còn em chưa có lệnh${x?.lop ? ` · ${x.lop}` : ''}`,
        dong: [`${x?.n ?? 0} em chưa có lệnh chuyển. Không cần duyệt — Quản lý ra lệnh ở hồ sơ lớp.`],
        mo: `/hoc-vien/lop/${yc.doi_tuong_id}?viec=chuyen-tiep`,
      };
    },
  },
  /* ------------------------------------------------------------ PR-LT2a · Kế hoạch bổ trợ lớp thường Giữa khoá (T54, M-05, M-03) — một thẻ mỗi NHÓM PA */
  {
    loai: 'ke_hoach_bo_tro',
    /* Duyệt → PA của các Case ĐÃ có nguyên nhân chạy từ hôm nay; Từ chối → giữ nguyên nhân, nộp lại (hạn mới 3 ngày). Cả hai TRONG tx của hộp. */
    khiDuyet: (p, yc) => khiDuyetKeHoach(p, yc),
    khiTuChoi: (p, yc, lyDo) => khiTuChoiKeHoach(p, yc, lyDo),
    chet: {
      sql: `NOT EXISTS (SELECT 1 FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
             WHERE iv.nhom_bo_tro = (SELECT nhom_bo_tro FROM case_interventions WHERE id = y.doi_tuong_id)
               AND iv.status = 'planned' AND sc.status != 'done')`,
      lyDo: 'Các Case của nhóm đã đóng hoặc PA đã huỷ',
    },
    /* MỘT câu cho cả lô thẻ: môn các Case của nhóm, người dạy, chương trình, Case đầu (để mở Ngăn Case). */
    nap: (conn, ds) => {
      const ids = ds.map((y) => y.id);
      return new Map((conn.prepare(
        `SELECT y.id, GROUP_CONCAT(sc.topic) AS mon, MIN(sc.id) AS case_id, MIN(COALESCE(u.full_name, iv.performer_name)) AS nguoi_day, MIN(cy.programme_code) AS ct
           FROM yeu_cau_duyet y JOIN case_interventions iv ON iv.nhom_bo_tro = json_extract(y.du_lieu, '$.nhom') AND iv.kind = 'bo_tro' AND iv.status != 'cancelled'
           JOIN sos_cases sc ON sc.id = iv.case_id LEFT JOIN users u ON u.id = iv.performer_user_id LEFT JOIN learning_cycles cy ON cy.id = sc.cycle_id
          WHERE y.id IN (${ids.map(() => '?').join(',')}) GROUP BY y.id`).all(...ids) as any[]).map((r) => [r.id as number, r]));
    },
    moTa: (yc, ngu) => {
      const x = ngu.them.get(yc.id);
      const d = (() => { try { return JSON.parse(yc.du_lieu ?? '{}'); } catch { return {}; } })() as { noiDungYeu?: string; keHoach?: string };
      const mon = ((x?.mon ?? '') as string).split(',').filter(Boolean).sort((a, b) => REGULAR_SKILLS.indexOf(a as any) - REGULAR_SKILLS.indexOf(b as any));
      const ten = mon.map((m) => tenMonNgan(x?.ct ?? null, m)).join(', ');
      return {
        tieuDe: `Kế hoạch bổ trợ${ten ? ` · ${ten}` : ''}`,
        phu: 'Giữa khoá',
        dong: [
          `Người dạy bổ trợ: ${x?.nguoi_day ?? 'chưa chọn'}${mon[0] ? ` · ${moTaBoTro(x?.ct ?? null, mon[0])}` : ''}`,
          `Nội dung yếu: ${d.noiDungYeu ?? ''}`,
          `Kế hoạch: ${d.keHoach ?? ''}`,
        ],
        neuDuyet: 'PA bổ trợ bắt đầu hôm nay, ghi kết quả hằng tuần hạn hết T2.',
        mo: yc.hoc_vien_id && x ? duongHoSoHocVien(yc.hoc_vien_id, { caseId: x.case_id }) : undefined,
      };
    },
  },
  /* ------------------------------------------------------------ PR-LT2b · Báo lên: Mini Test dưới 70% (M-05, T76, K1-41) — tạo lúc ghi Mini Test, không cần duyệt */
  {
    loai: 'bao_len_mini_test',
    /* Hết ý nghĩa khi Mini Test đã đạt (sửa điểm) hoặc mọi Case của nhóm đã Hoàn thành (QL xử lý xong). */
    chet: {
      sql: `NOT EXISTS (SELECT 1 FROM mini_test m WHERE m.id = y.doi_tuong_id AND m.ty_le < 0.7
             AND EXISTS (SELECT 1 FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.nhom_bo_tro = m.nhom_bo_tro AND sc.status != 'done'))`,
      lyDo: 'Case đã hoàn thành hoặc Mini Test đã đạt',
    },
    nap: (conn, ds) => napTheoDoiTuong(conn, ds,
      `SELECT m.id, m.ty_le, m.ngay_lam, m.han, s.full_name, (SELECT MIN(iv.case_id) FROM case_interventions iv WHERE iv.nhom_bo_tro = m.nhom_bo_tro) AS case_id
         FROM mini_test m JOIN students s ON s.id = m.student_id WHERE m.id IN (?)`),
    moTa: (yc, ngu) => {
      const x = ngu.them.get(yc.id);
      const pt = x?.ty_le != null ? `${Math.round(x.ty_le * 100)}%` : '';
      return {
        tieuDe: `Mini Test chưa đạt${pt ? ` · ${pt}` : ''}`,
        phu: x?.full_name ?? null,
        dong: [`Mini Test ${pt} ngày ${ngay(x?.ngay_lam, ngu)} (cần từ 70%) — Case để mở, Quản lý xử lý từng trường hợp.`, 'Không cần duyệt — để QL biết và nhắc.'],
        mo: yc.hoc_vien_id ? duongHoSoHocVien(yc.hoc_vien_id, x?.case_id ? { caseId: x.case_id } : undefined) : undefined,
      };
    },
  },
  /* ------------------------------------------------------------ PR-LT2b · Báo lên: Cuối khoá dời quá tuần cuối khoá (K4-23 vế 2) — một thẻ mỗi bài */
  {
    loai: 'bao_len_cuoi_khoa',
    chet: {
      sql: `NOT EXISTS (SELECT 1 FROM assessment_attempts a WHERE a.id = y.doi_tuong_id AND a.status = 'planned')`,
      lyDo: 'Bài đã có điểm đủ hoặc đã huỷ',
    },
    nap: (conn, ds) => napTheoDoiTuong(conn, ds,
      `SELECT a.id, s.full_name, rp.week_start FROM assessment_attempts a JOIN students s ON s.id = a.student_id LEFT JOIN report_periods rp ON rp.id = a.planned_period_id WHERE a.id IN (?)`),
    moTa: (yc, ngu) => {
      const x = ngu.them.get(yc.id);
      return {
        tieuDe: 'Cuối khoá dời quá tuần cuối khoá',
        phu: x?.full_name ?? null,
        dong: [`Bài Cuối khoá bị dời tới ${x?.week_start ? tuanLich(x.week_start, ngu.homNay) : 'tuần sau'} — sau tuần cuối khoá của lớp.`, 'Không cần duyệt — để QL biết và nhắc.'],
        mo: yc.hoc_vien_id ? duongHoSoHocVien(yc.hoc_vien_id) : undefined,
      };
    },
  },
];

export function dinhNghiaCua(loai: string): DinhNghiaLoai | undefined {
  return DINH_NGHIA_LOAI.find((d) => d.loai === loai);
}
