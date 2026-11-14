/**
 * BẢNG PHÂN TÍCH GIÁO VIÊN (PR-Pb2-b, Q30-5, Q31-2, Q31-9, mockup 25) — một bảng, không phải chỉ số trong sổ. Mỗi cột ĐÚNG MỘT hàm tập trả
 * `Map<gvId, { dung: id[]; tong: id[] }>`; ô số, panel "Chấm điểm" và phép kiểm gọi cùng hàm (HOP_DONG_SO_LIEU §1). Nạp THEO LÔ cho cả chi nhánh +
 * khung + khoảng rồi gom theo người trong bộ nhớ: không câu SQL nào chạy một lần cho mỗi GV / lớp / em.
 *
 * Gán người (Q15): ô điểm → phân công ở HẠN NHẬP · kết quả, HV tiến bộ → phân công ở TUẦN THI ·
 * Ghi kết quả PA, PA hiệu quả → người phụ trách Case. Phân công hiệu lực ở ngày d: `effective_from ≤ d ≤ effective_to` (ngày đổi: dòng mới thắng).
 */
import {
  ratioResult, kyNangDaBo, boMonDaBo, COT_KET_QUA_GV, PERMISSIONS, baiId, khoangPtGv, mondayOfDate, nhanDotNgan, oTuTap, oTuSo3, tenMonNgan, boMonLich, duongHoSoHocVien,
  KN_DAY, type KnDay, type ChiSoHoSoGv, type HangPtGv, type KhungPtGv, type OPtGv, type PhanTichGvKq, boMonTheoLuot, daGhiLuot,
} from '../../../shared/domain/index.ts';
import { phamViHoSoGv } from '../giaoVien/phamVi.ts';
import { DS_JSON, db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { nhanNhomViec, type WorkGroupKey } from '../worklist/mywork.ts';
import { addDays, badRequest, forbidden, notFound } from '../util.ts';
import { loadBundle, regularSkillViews, skillCells } from '../fasttrack/attempts.ts';
import { allProgrammes, nguongDatLop } from '../normal/regular.ts';
import { danhGiaMon } from '../classes/phanTichLop.ts';
import { hvSosHienTaiTrong, metricSet, parseObligation, rowsFor, type MetricRow } from '../worklist/metrics.ts';
import { assessedSkillOf, expectationFor } from '../fasttrack/scoring.ts';
import { tuanLich as tuanLichNgan } from '../../../shared/domain/hienThiNgay.ts';
import { dongNghiaVu, dongPa, paCoKetQua } from './hieuQuaPa.ts';
import { khoangTamDung } from '../students/tamDung.ts';
import { dangHocLuc, lopLucThi, nguoiPcLuc } from './luatBai.ts';
import { caseCoPaTheoGv } from '../giaoVien/hoSo.ts';
import { chuaPhanCong, demTheoCnNguoi, demTheoNguoi, demTheoNguoiHaiLoai, dongCuaNguoi, dongMoiNguoi, type DongNvXem, type So3 } from './demNghiaVu.ts';
import { lamMoiViec } from './soNghiaVu.ts';
import { mucThiTheoGv, oThiGv, SKILL_KN, type MucThiGv } from './thiThatThongKe.ts';
import { t } from '../../../shared/i18n/index.ts';
import { dongBaiThuongCua, dongLuotDiemCua, ganLuotDiem, nguongCua } from './tongHop.ts';
import { KN_LUOT_CUA, NHAN_KN_LUOT, duongCaseRieng, duongDotTest, tabViecHanCua, tachBaiId, type DongTangGiam, type DongViecHan } from '../../../shared/domain/index.ts';

const LO = 400;
const KN_NGAN: Record<KnDay, string> = { l: 'L', r: 'R', w1: 'W1', w2: 'W2', s: 'S' };
const NHAN_MUC_THI = { exceed: t('Vượt'), dat: t('Đạt'), fail: t('Chưa đạt') } as const;   // Phân tích V2 (PTA chốt XM-1): Vượt · Đạt · Chưa đạt mọi nơi
const cho = (n: number) => Array.from({ length: n }, () => '?').join(',');
const theoLo = <T>(ds: readonly T[]) => Array.from({ length: Math.ceil(ds.length / LO) }, (_, i) => ds.slice(i * LO, (i + 1) * LO));
/** Thứ tự môn ở dòng phụ "R · W1 · W2 · GVCN …". */
const THU_TU = ['tong_hop', 'listening', 'reading', 'writing', 'writing1', 'writing2', 'speaking'];

/** `v2` (Phân tích V2 · Giáo viên, đặc tả 6): chỉ phần báo cáo cần — sổ nghĩa vụ + Đạt kỳ vọng Test; bỏ Tiến bộ / HV cần chú ý / Case có PA / PA / Thi thật / Ghi KQ PA. */
export type LocPtGv = { cn?: number | null; ct?: KhungPtGv; tu?: string | null; den?: string | null; thang?: string | null; v2?: boolean };
type Tap = Map<number, { dung: number[]; tong: number[] }>;
const them = (t: Tap, gv: number, id: number, dung: boolean) => {
  const x = t.get(gv) ?? { dung: [], tong: [] };
  t.set(gv, x);
  x.tong.push(id);
  if (dung) x.dung.push(id);
};

/** V5 (05 #8): "Việc đúng hạn" = gộp các tập việc có hạn (Kết quả PA + việc Công việc còn mở quá hạn — DEM-QUA-HAN) — đơn vị VIỆC, chỉ cộng độ dài (id các tập có thể trùng số). */
const gopTap = <T,>(...ts: ({ dung: readonly T[]; tong: readonly T[] } | undefined)[]) => ({ dung: ts.flatMap((t) => t?.dung ?? []), tong: ts.flatMap((t) => t?.tong ?? []) });

type PhanCong = { id: number; gv: number; ten: string; lop: number; skill: string | null; core: boolean; tu: string; den: string | null };
/** `khai`: tuần khai giảng (Thứ Hai tuần bắt đầu, vắng → ngày khai giảng) — bảng lớp hồ sơ GV xếp lớp lâu nhất lên đầu. */
type Lop = { id: number; ma: string; ct: string | null; xong: boolean; khai: string | null };
/** Ngữ cảnh một lần nạp: quyền, khoảng, lớp của chi nhánh + khung, MỌI phân công của các lớp đó (một câu). */
export type NguCanhPtGv = {
  cn: number; tenChiNhanh: string; khung: KhungPtGv; tu: string; den: string; cuoi: string; thang: string | null; homNay: string;
  lop: Map<number, Lop>; pc: PhanCong[];
  /** Người dạy ô `skill` (kỹ năng phân công) của lớp ở ngày `d`; `skill = null` → GVCN. */
  nguoiLuc: (lop: number, skill: string | null, d: string) => number | null;
};

export function nguCanhPtGv(p: Principal, f: LocPtGv): NguCanhPtGv {
  const scope = scopeFor(p, PERMISSIONS.ANALYSIS_VIEW_TEACHER);
  if (scope.none) throw forbidden('Phân tích giáo viên dành cho Quản lý và Quản trị hệ thống.');
  const cn = f.cn ?? (!scope.all && scope.branchIds.length === 1 ? scope.branchIds[0] : null);
  if (cn == null) throw badRequest('Chọn một chi nhánh.');
  if (!scope.all && !scope.branchIds.includes(cn)) throw forbidden('Chi nhánh này nằm ngoài phạm vi bạn được xem.');
  return nguCanhCn(cn, f);
}

/** Ngữ cảnh của MỘT chi nhánh + khung, KHÔNG kiểm quyền — nơi gọi đã kiểm (bảng: `nguCanhPtGv`; hồ sơ GV theo kỳ: `phamViHoSoGv`). */
function nguCanhCn(cn: number, f: LocPtGv): NguCanhPtGv {
  const homNay = demoToday();
  const k = khoangPtGv(f, homNay);
  if ('loi' in k) throw badRequest(k.loi);
  const conn = db();
  const cb = conn.prepare(`SELECT name FROM branches WHERE id = ?`).get(cn) as any;
  if (!cb) throw notFound('Không tìm thấy chi nhánh này.');
  const khung = f.ct ?? 'ft';
  /* Một câu: lớp của chi nhánh + khung kèm MỌI dòng phân công (kể cả đã kết thúc — gán người theo ngày). */
  const rows = conn.prepare(
    `SELECT ${COT_LOP_PC} ${TU_LOP_PC} WHERE c.branch_id = ? AND c.is_fast_track = ?`).all(cn, khung === 'ft' ? 1 : 0) as any[];
  return dungNguCanh(cn, cb.name, khung, k, f.thang ?? null, homNay, rows);
}

/** PTA rà #1414: ngữ cảnh của NHIỀU chi nhánh (`null` = mọi chi nhánh) — 1 câu tên + 1 câu lớp + phân công, chia theo chi nhánh trong bộ nhớ. Không kiểm quyền (nơi gọi đã kiểm). */
function nguCanhNhieuCn(cns: readonly number[] | null, f: LocPtGv): NguCanhPtGv[] {
  const homNay = demoToday();
  const k = khoangPtGv(f, homNay);
  if ('loi' in k) throw badRequest(k.loi);
  const conn = db();
  const khung = f.ct ?? 'ft';
  const cn = (conn.prepare(`SELECT id, name FROM branches${cns ? ` WHERE id IN (${DS_JSON})` : ''} ORDER BY id`).all(...(cns ? [JSON.stringify(cns)] : [])) as any[]);
  const theoCn = new Map<number, any[]>();
  for (const r of conn.prepare(`SELECT c.branch_id AS cn_, ${COT_LOP_PC} ${TU_LOP_PC} WHERE c.branch_id IN (${DS_JSON}) AND c.is_fast_track = ?`)
    .all(JSON.stringify(cn.map((b) => b.id)), khung === 'ft' ? 1 : 0) as any[]) (theoCn.get(r.cn_) ?? theoCn.set(r.cn_, []).get(r.cn_)!).push(r);
  return cn.map((b) => dungNguCanh(b.id, b.name, khung, k, f.thang ?? null, homNay, theoCn.get(b.id) ?? []));
}

/** Cột + nguồn của câu "lớp chi nhánh + khung kèm mọi dòng phân công" — `nguCanhCn` (một ngữ cảnh) và `nguCanhCuaGv` (mọi ngữ cảnh của GV, một câu) dùng chung. */
const COT_LOP_PC = `c.id AS lop, c.code, c.programme_code, c.status AS lop_status, COALESCE(sp.week_start, c.start_date) AS khai, ta.id, ta.user_id, u.full_name, ta.skill, ta.is_core, ta.effective_from, ta.effective_to`;
const TU_LOP_PC = `FROM classes c LEFT JOIN teacher_assignments ta ON ta.class_id = c.id AND ta.status IN ('active', 'ended')
       LEFT JOIN users u ON u.id = ta.user_id
       LEFT JOIN report_periods sp ON sp.id = c.start_period_id`;

function dungNguCanh(cn: number, tenChiNhanh: string, khung: KhungPtGv, k: { tu: string; den: string }, thang: string | null, homNay: string, rows: readonly any[]): NguCanhPtGv {
  const lop = new Map<number, Lop>();
  const pc: PhanCong[] = [];
  for (const r of rows) {
    lop.set(r.lop, { id: r.lop, ma: r.code, ct: r.programme_code ?? null, xong: r.lop_status !== 'active', khai: r.khai ?? null });
    if (r.id) pc.push({ id: r.id, gv: r.user_id, ten: r.full_name, lop: r.lop, skill: r.skill ?? null, core: !!r.is_core, tu: r.effective_from, den: r.effective_to ?? null });
  }
  const theoO = new Map<string, PhanCong[]>();
  for (const a of pc) {
    const key = `${a.lop}|${a.core ? '' : a.skill ?? ''}`;
    if (a.core || a.skill) theoO.set(key, [...(theoO.get(key) ?? []), a]);
  }
  const nguoiLuc = (l: number, skill: string | null, d: string) => nguoiPcLuc(theoO.get(`${l}|${skill ?? ''}`) ?? [], d);
  return { cn, tenChiNhanh, khung, tu: k.tu, den: k.den, cuoi: addDays(k.den, 6), thang, homNay, lop, pc, nguoiLuc };
}

// ------------------------------------------------------------------ bài thi trong khoảng: một lần nạp cho Chấm điểm, Kết quả, HV tiến bộ

type OBai = {
  id: number; attemptId: number; classId: number; studentId: number; hocVien: string; skill: string; tuan: string; han: string | null;
  nhapDau: string | null; band: number | null; coDiem: boolean; tienDo: string; noShow: boolean;
  /** Q2 + P12: em đang học TẠI HẠN NHẬP — chỉ tập Chấm điểm lọc theo cờ này; Kết quả / Tiến bộ giữ bài đã có điểm của em đã thôi học. */
  dangHoc: boolean; kck: boolean; bai: string;
  /** T18 (PR-LT3): loại lượt + GV chấm Speaking đã ghi (`examiner_user_id`) — ô Speaking Mock tính cho người chấm, không cho GVBM S. */
  kind: string; examinerUserId: number | null;
};
type NapBai = { o: OBai[]; attempts: Map<number, any>; bundle: ReturnType<typeof loadBundle> };
/** TL-NAPBAI: `napBai` cả chi nhánh khung FT đi theo kỳ (ô kỹ năng chi nhánh) khi khoảng ≤ số tuần này; dài hơn / khung thường đi theo lớp (ít bước hơn — PTA đo #759). */
export const NAP_THEO_KY_TUAN = 8;
/** S1: CHỈ phép kiểm bật — `napBai` của MỘT GV đi đường đủ (cả chi nhánh + khung) để so số với đường thu hẹp. */
export const napDayDuKhiKiem = { bat: false };
/** GIAM-DOC-HSGV: CHỈ phép kiểm bật — hồ sơ GV đọc TỪNG ngữ cảnh riêng (đường trước khi gộp: ngữ cảnh, lượt, phần nạp theo lượt / em, sổ bài + việc) để so số với đường gộp. */
export const tachNguCanhKhiKiem = { bat: false };

/**
 * Mọi ô điểm (một kỹ năng một lượt) có TUẦN THI CỦA CHÍNH Ô ĐÓ trong khoảng, ở lớp của chi nhánh + khung — `skillCells` / `regularSkillViews` như `scoreDebt.ts`.
 * PR-S6F-a Q19: `classId` của ô = LỚP EM HỌC Ở TUẦN THI (ghi danh hiệu lực trong tuần đó, một câu theo lô) — chuyển lớp giữ khoá dời lượt `planned`
 * sang lớp mới (`luatLoTrinh.ts`) nhưng ô đã thi vẫn tính cho người dạy em lúc thi. Không có ghi danh khớp → lớp của lượt.
 * ponytail: chỉ nạp lượt ĐANG ở lớp của chi nhánh + khung — lượt đã dời sang lớp chi nhánh khác không còn ở bảng chi nhánh cũ (chuyển chi nhánh giữ khoá hiếm);
 * cần thì nạp thêm theo ghi danh.
 */
export function napBai(p: Principal, c: NguCanhPtGv, gv?: number): NapBai {
  return napBaiNhieu(p, [c], gv)[0];
}

/**
 * GIAM-DOC-HSGV: `napBai` của NHIỀU ngữ cảnh (hồ sơ GV: FT + thường, nhiều chi nhánh) — câu lượt vẫn riêng từng ngữ cảnh (cùng điều kiện như cũ), phần nạp theo
 * lượt / em (lịch kỹ năng, điểm, Case theo lượt, ghi danh, tạm dừng) MỘT lượt cho mọi ngữ cảnh. Mọi phần đó tính theo từng lượt / từng em nên số không đổi.
 */
export function napBaiNhieu(p: Principal, cs: readonly NguCanhPtGv[], gv?: number): NapBai[] {
  if (tachNguCanhKhiKiem.bat && cs.length > 1) return cs.map((c) => napBaiNhieu(p, [c], gv)[0]);
  const luot = gv != null && !napDayDuKhiKiem.bat ? luotGv(cs, gv) : cs.length > 1 && cs.every(theoKyMotCau) ? luotTheoKyNhieuCn(cs) : cs.map((c) => luotCua(c, gv));
  const tatCa = luot.flat();
  const bundle = loadBundle(tatCa.map((r) => r.id));
  const programmes = allProgrammes();
  const em = [...new Set(tatCa.map((r) => r.student_id as number))];
  const ghiDanh = new Map<number, { lop: number; tu: string; den: string | null }[]>();
  for (const lo of theoLo(em)) {
    for (const e of db().prepare(
      `SELECT student_id, class_id, substr(started_at, 1, 10) AS tu, substr(ended_at, 1, 10) AS den FROM enrollments WHERE student_id IN (${cho(lo.length)})`,
    ).all(...lo) as any[]) (ghiDanh.get(e.student_id) ?? ghiDanh.set(e.student_id, []).get(e.student_id)!).push({ lop: e.class_id, tu: e.tu, den: e.den });
  }
  /* Lớp lúc thi + em đang học tại hạn: `luatBai.ts` (cùng sổ nghĩa vụ). */
  const tamDung = khoangTamDung(em);
  return cs.map((c, i) => dungNapBai(p, c, luot[i], bundle, programmes, ghiDanh, tamDung));
}

/** `kemKy` = lọc ô có tuần trong khoảng; đường theo kỳ bỏ vì `luot` dựng đúng từ điều kiện đó (đọc lại ô kỹ năng mỗi lượt là thừa). */
const sqlLuot = (loc: string, nguon = 'assessment_attempts a', cte = '', kemKy = true) =>
      `${cte}SELECT a.*, pg.scoring_mode, cl.programme_code, rp.week_start AS period_start, rp.week_end AS period_end, rp.code AS period_code,
              -- P12 (E6): Target + KCK LÚC LƯỢT (như resultOf) — đổi Target / KCK lộ trình sau đó không viết lại kỳ đã qua
              a.target_at_attempt AS target_score, COALESCE(a.kck_at_attempt, cy.khong_cam_ket) AS khong_cam_ket, COALESCE(a.route_at_attempt, cy.route) AS route, s.full_name AS hv_ten, s.status AS hv_status, s.finished_at AS hv_finished, s.archived_at AS hv_archived
         FROM ${nguon}
         JOIN classes cl ON cl.id = a.class_id
         JOIN students s ON s.id = a.student_id
         LEFT JOIN programmes pg ON pg.code = cl.programme_code
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
         LEFT JOIN learning_cycles cy ON cy.id = a.cycle_id
        WHERE ${loc} AND a.status != 'cancelled'${kemKy ? `
          AND (EXISTS (SELECT 1 FROM attempt_skills k JOIN report_periods r2 ON r2.id = k.planned_period_id
                        WHERE k.attempt_id = a.id AND r2.week_start BETWEEN ? AND ?)
               OR (NOT EXISTS (SELECT 1 FROM attempt_skills k2 WHERE k2.attempt_id = a.id) AND rp.week_start BETWEEN ? AND ?))` : ''}`;

/** Ngữ cảnh đi đường "cả chi nhánh theo kỳ" của `luotCua` (FT, khoảng ≤ NAP_THEO_KY_TUAN tuần). */
const theoKyMotCau = (c: NguCanhPtGv) => !napDayDuKhiKiem.bat && c.khung === 'ft' && (Date.parse(c.den) - Date.parse(c.tu)) / (7 * 864e5) + 1 <= NAP_THEO_KY_TUAN;
/**
 * PTA rà #1414: đường "cả chi nhánh theo kỳ" cho NHIỀU chi nhánh cùng khoảng (bảng GV tổng V2) — MỘT câu (cùng CTE, `branch_id IN` / `class_id IN` mọi chi nhánh)
 * rồi chia lượt theo lớp của từng ngữ cảnh. Các ngữ cảnh khác chi nhánh nên tập lớp rời nhau: mỗi lượt về đúng một ngữ cảnh như đi riêng.
 */
function luotTheoKyNhieuCn(cs: readonly NguCanhPtGv[]): any[][] {
  const lop = JSON.stringify(cs.flatMap((c) => [...c.lop.keys()]));
  const cte = `WITH ky(id) AS (SELECT id FROM report_periods WHERE week_start BETWEEN ? AND ?),
     luot(id) AS (SELECT DISTINCT k.attempt_id FROM attempt_skills k WHERE k.branch_id IN (${DS_JSON}) AND k.planned_period_id IN (SELECT id FROM ky)
                  UNION ALL SELECT a2.id FROM assessment_attempts a2 WHERE a2.class_id IN (${DS_JSON}) AND a2.planned_period_id IN (SELECT id FROM ky)
                    AND NOT EXISTS (SELECT 1 FROM attempt_skills k2 WHERE k2.attempt_id = a2.id))
`;
  const rows = db().prepare(sqlLuot(`a.class_id IN (${DS_JSON})`, 'luot x CROSS JOIN assessment_attempts a ON a.id = x.id', cte, false))
    .all(cs[0].tu, cs[0].den, JSON.stringify(cs.map((c) => c.cn)), lop, lop) as any[];
  return cs.map((c) => rows.filter((r) => c.lop.has(r.class_id)).sort((x, y) => x.class_id - y.class_id || x.id - y.id));
}

/** Lượt của một ngữ cảnh (ba đường: đủ theo lớp · cả chi nhánh theo kỳ · một GV) — xem chú thích từng nhánh. */
function luotCua(c: NguCanhPtGv, gv?: number): any[] {
  const conn = db();
  const rows: any[] = [];
  const chon = (...a: Parameters<typeof sqlLuot>) => conn.prepare(sqlLuot(...a));
  const soTuan = (Date.parse(c.den) - Date.parse(c.tu)) / (7 * 864e5) + 1;
  if (napDayDuKhiKiem.bat || (gv == null && (soTuan > NAP_THEO_KY_TUAN || c.khung !== 'ft'))) {
    for (const lo of theoLo([...c.lop.keys()])) rows.push(...chon(`a.class_id IN (${cho(lo.length)})`).all(...lo, c.tu, c.den, c.tu, c.den) as any[]);
  } else if (gv == null) {
    /*
     * TL-NAPBAI (Q2 làm lại sau #724): cả chi nhánh → đi từ Ô KỸ NĂNG CỦA CHI NHÁNH trong kỳ (`idx_attempt_skills_cn_tuan`, cột giữ bằng trigger) ∪ lượt
     * KHÔNG lịch kỹ năng của lớp chi nhánh + khung có tuần trong kỳ (`idx_attempt_lop_tuan`), không `class_id IN (cả chi nhánh)` + EXISTS từng lượt (mọi kỳ).
     * `CROSS JOIN` ép SQLite đi `luot` trước rồi tìm lượt theo khoá — không trông vào planner. `luot` dựng đúng từ vế EXISTS / NOT
     * EXISTS cũ (cùng luật) nên câu ngoài không kiểm lại; lớp ngoài khung (ô kỹ năng chi nhánh là mọi khung) lọc `c.lop` ngay sau khoá lượt, trước các phép nối. Khoảng > NAP_THEO_KY_TUAN tuần, hoặc khung thường, đi đường lớp ở trên:
     * kỳ dài thì ô kỹ năng trong kỳ ≈ mọi ô của chi nhánh (PTA đo #759); khung thường thì ô chi nhánh phần lớn là ô Mock FT phải bỏ (đo bước VM, prTlNapBai B2-d). Phép kiểm: prTlNapBai "B2".
     */
    const lop = JSON.stringify([...c.lop.keys()]);
    const cte = `WITH ky(id) AS (SELECT id FROM report_periods WHERE week_start BETWEEN ? AND ?),
     luot(id) AS (SELECT DISTINCT k.attempt_id FROM attempt_skills k WHERE k.branch_id = ? AND k.planned_period_id IN (SELECT id FROM ky)
                  UNION ALL SELECT a2.id FROM assessment_attempts a2 WHERE a2.class_id IN (${DS_JSON}) AND a2.planned_period_id IN (SELECT id FROM ky)
                    AND NOT EXISTS (SELECT 1 FROM attempt_skills k2 WHERE k2.attempt_id = a2.id))
`;
    if (c.lop.size) rows.push(...(chon(`a.class_id IN (${DS_JSON})`, 'luot x CROSS JOIN assessment_attempts a ON a.id = x.id', cte, false)
      .all(c.tu, c.den, c.cn, lop, lop) as any[]).sort((x, y) => x.class_id - y.class_id || x.id - y.id));
  } else return luotGv([c], gv)[0];
  return rows;
}

/**
 * Đường một GV cho MỘT hay NHIỀU ngữ cảnh. GIAM-DOC-HSGV: nhiều ngữ cảnh = MỘT câu (UNION ALL, mỗi vế đúng điều kiện của ngữ cảnh đó, nhãn `nc_` để tách lại) —
 * chia lô khi vế / tham số nhiều (Turso: ≤ 20 vế, ≤ 900 tham số). Một ngữ cảnh: câu như cũ.
 */
function luotGv(cs: readonly NguCanhPtGv[], gv: number): any[][] {
  const out: any[][] = cs.map(() => []);
  const phan = cs.map((c, i) => {
    /*
     * S1 (giảm dòng đọc Turso): MỘT GV → chỉ lượt có thể gán cho GV đó, không mọi lượt của chi nhánh + khung. Mọi tập dùng `napBai` gán người qua
     * `c.nguoiLuc(lớp lúc thi, …)` — trả người có dòng phân công Ở LỚP ĐÓ (`c.pc`) — hoặc qua `examiner_user_id` (Speaking Mock chấm chéo, T18).
     * Lớp lúc thi ∈ {lớp của lượt} ∪ {lớp em từng ghi danh} (`lopLucThi`) ⇒ lượt góp số cho GV thì: lớp của lượt ∈ G, HOẶC em từng ghi danh một lớp
     * ∈ G, HOẶC GV đã chấm một ô của lượt (G = lớp GV có phân công ở ngữ cảnh). Mỗi ô tính từ CHÍNH lượt đó + ghi danh / tạm dừng / điểm cũ của em
     * (nạp theo em) → tập nhỏ hơn cho cùng số. Lớp của lượt ngoài chi nhánh + khung bỏ như đường đủ. Không `class_id IN (cả chi nhánh)` để SQLite
     * đi MULTI-INDEX OR (chỉ mục lớp · em · rowid). Phép kiểm: prSvTqGv "S1".
     */
    const g = [...new Set(c.pc.filter((a) => a.gv === gv).map((a) => a.lop))];
    const loc = `(a.class_id IN (${cho(g.length)}) OR a.student_id IN (SELECT e.student_id FROM enrollments e WHERE e.class_id IN (${cho(g.length)}))
                OR a.id IN (SELECT sc.attempt_id FROM assessment_scores sc WHERE sc.examiner_user_id = ?))`;
    return { i, sql: sqlLuot(loc), args: [...g, ...g, gv, c.tu, c.den, c.tu, c.den] };
  });
  const chay = (lo: typeof phan) => {
    if (lo.length === 1) { out[lo[0].i].push(...db().prepare(lo[0].sql).all(...lo[0].args) as any[]); return; }
    for (const r of db().prepare(lo.map((x) => `SELECT ${x.i} AS nc_, q.* FROM (${x.sql}) q`).join(' UNION ALL ')).all(...lo.flatMap((x) => x.args)) as any[]) {
      const i = r.nc_ as number;
      delete r.nc_;
      out[i].push(r);
    }
  };
  let lo: typeof phan = [];
  for (const x of phan) {
    if (lo.length && (lo.length >= 10 || lo.reduce((n, y) => n + y.args.length, 0) + x.args.length > 800)) { chay(lo); lo = []; }
    lo.push(x);
  }
  if (lo.length) chay(lo);
  return cs.map((c, i) => out[i].filter((r) => c.lop.has(r.class_id)).sort((x, y) => x.class_id - y.class_id || x.id - y.id));
}

function dungNapBai(p: Principal, c: NguCanhPtGv, rows: readonly any[], bundle: NapBai['bundle'], programmes: ReturnType<typeof allProgrammes>,
  ghiDanh: ReadonlyMap<number, { lop: number; tu: string; den: string | null }[]>, tamDung: ReturnType<typeof khoangTamDung>): NapBai {
  const o: OBai[] = [];
  for (const a of rows) {
    const scores = bundle.scores.get(a.id) ?? [];
    const chung = (skill: string, v: { weekStart: string | null; deadline: string | null; progress: string; noShow: boolean }) => {
      if (!v.weekStart || v.weekStart < c.tu || v.weekStart > c.den) return;
      const lop = lopLucThi(ghiDanh.get(a.student_id) ?? [], v.weekStart, a.class_id);
      if (!c.lop.has(lop)) return;   // lớp lúc thi ngoài chi nhánh + khung đang xem
      const row = scores.find((s) => s.skill === skill);
      o.push({
        id: baiId(a.id, skill), attemptId: a.id, classId: lop, studentId: a.student_id, hocVien: a.hv_ten, skill, tuan: v.weekStart, han: v.deadline,
        nhapDau: (row?.band ?? null) !== null || (row?.raw_score ?? null) !== null ? row?.nhap_dau_ngay ?? null : null, band: row?.band ?? null,   // NHAP-DIEM-a: ô đã xoá giữ ngày nhập đầu
        coDiem: (row?.band ?? null) !== null || (row?.raw_score ?? null) !== null, tienDo: v.progress, noShow: v.noShow,
        dangHoc: dangHocLuc(a, tamDung[a.student_id] ?? [], v.deadline ?? c.homNay), kck: !!a.khong_cam_ket, bai: nhanDotNgan(a.kind, a.attempt_no) ?? '',
        kind: a.kind, examinerUserId: row?.examiner_user_id ?? null,
      });
    };
    if (a.scoring_mode === 'ratio') {
      const bo = boMonTheoLuot(boMonLich(a.programme_code, programmes.get(a.programme_code)?.skills), daGhiLuot(bundle.skillRows.get(a.id), scores), a.bo_mon);   // P13: bộ môn theo lượt
      const views = regularSkillViews(a, bundle.skillRows.get(a.id), scores, c.homNay, bo);
      for (const skill of bo) {
        const v = views.get(skill);
        if (v && v.required) chung(skill, { weekStart: v.weekStart, deadline: v.deadline, progress: v.progress, noShow: false });
      }
    } else {
      for (const x of skillCells(p, a, scores, bundle.skips.get(a.id) ?? [], c.homNay, bundle.skillRows.get(a.id))) {
        if (x.required) chung(x.skill, { weekStart: x.weekStart, deadline: x.deadline, progress: x.progress, noShow: x.noShow !== null });
      }
    }
  }
  return { o, attempts: new Map(rows.map((r) => [r.id, r])), bundle };
}

// ------------------------------------------------------------------ cột 5 · Kết quả môn (mục = ô có điểm, `baiId`) + cột 6 · HV tiến bộ

/** Một mục cột Kết quả: ô có điểm (MT / bài lớp thường) hoặc một kỹ năng thi thật; `ovr`, `kv` để panel ghi lý do. */
type MucKq = { x: OBai; dat: boolean; ovr: number | null; kv: number | null };

/**
 * V5 C09, C10 (brief mục 15 — chỉ cho đánh giá GV, KHÔNG đổi SOS / Case):
 *   FT MT       `danhGiaMon` (luật Overall một chỗ, cùng tab Phân tích lớp / hồ sơ GV): Overall lượt ≥ kỳ vọng → mọi kỹ năng có điểm Đạt (điểm thật
 *               vẫn hiện ở panel); chưa đạt → từng kỹ năng; Overall chưa có → "Chưa đủ dữ liệu", ra khỏi mẫu.
 *   Thi thật    KHÔNG ở đây — 2F (05/11) thay C10: `mucThiTheoGv` (`thiThatThongKe.ts`, cùng tab Thi thật).
 *   Lớp thường  `danhGiaMon` (≥ 70 % từng môn) như cũ. Em KCK (FT) không tính (OV-9).
 */
function mucKetQua(c: NguCanhPtGv, nap: NapBai): MucKq[] {
  const progs = allProgrammes();
  const kl = new Map<number, Omit<MucKq, 'x'>>();
  for (const a of nap.attempts.values()) {
    /* PR-NT: Target lớp thường không bật FT (chủ sản phẩm 04/10) — KCK chỉ bỏ lượt FT; lớp thường chấm tỷ lệ, không kỳ vọng nên vẫn tính. */
    if (a.khong_cam_ket && a.scoring_mode !== 'ratio') continue;
    const ratio = a.scoring_mode === 'ratio';
    const scores = nap.bundle.scores.get(a.id) ?? [];
    const g = danhGiaMon(a, scores, ratio ? progs.get(a.programme_code) ?? null : null, nap.bundle.skips.get(a.id) ?? [], nap.bundle.skillRows.get(a.id));
    if (!g) continue;
    for (const m of g.mon) kl.set(baiId(a.id, m.skill), { dat: m.dat, ovr: g.ovr, kv: g.kv });
  }
  const out = nap.o.flatMap((x) => { const k = kl.get(x.id); return k ? [{ x, ...k }] : []; });
  return out;
}

/**
 * Q15: mục của `mucKetQua`, gán cho người dạy môn đó ở TUẦN THI (thi thật: ngày thi). `theoLop` (P8, 22/10): cùng mục tách theo LỚP EM HỌC LÚC THI —
 * gom theo lượt của từng HV có tuần thi trong kỳ, không lấy "MT gần nhất của lớp".
 */
type TapKq = Tap & { lop?: Map<number, Set<number>>; theoLop?: Map<number, Map<number, { dung: number[]; tong: number[] }>> };
function tapKetQua(c: NguCanhPtGv, muc: readonly MucKq[]): Map<string, TapKq> {
  const out = new Map<string, TapKq>();
  for (const { x, dat: d } of muc) {
    if (!(COT_KET_QUA_GV[c.khung] as readonly string[]).includes(x.skill)) continue;   // ponytail: Pre FOU "Tổng hợp" không có cột
    const gv = c.nguoiLuc(x.classId, x.skill, x.tuan);
    if (gv == null) continue;
    const t: TapKq = out.get(x.skill) ?? Object.assign(new Map(), { lop: new Map(), theoLop: new Map() });
    out.set(x.skill, t);
    them(t, gv, x.id, d);
    t.lop!.set(gv, (t.lop!.get(gv) ?? new Set<number>()).add(x.classId));
    const tl = t.theoLop!.get(gv) ?? t.theoLop!.set(gv, new Map()).get(gv)!;
    const o = tl.get(x.classId) ?? tl.set(x.classId, { dung: [], tong: [] }).get(x.classId)!;
    o.tong.push(x.id);
    if (d) o.dung.push(x.id);
  }
  return out;
}

/** Q21 (FT): mục = ô có điểm mà em ĐÃ có điểm kỹ năng đó ở lượt MT gần nhất trước đó (bất kỳ lớp); tiến bộ ⇔ band cao hơn. W1, W2 riêng. KCK vẫn tính. */
/** PANEL-MC: `doi` — điểm hai lượt của từng mục (lượt trước → lượt này), dựng trong CÙNG vòng (0 câu) cho chip Tăng / Giảm ở panel. */
/** PT-PANEL: `truoc.mt` — số MT lượt trước (cột Trước "MT1 5.0" của panel Tăng / Giữ / Giảm). */
type DoiTb = Map<number, { truoc: { luot: string; v: number; mt: number }; sau: { luot: string; v: number } }>;
/** `lop`: bài → lớp của bài (Chi nhánh V2 chia Tiến bộ theo lớp — 0 câu thêm). */
type TapKn = Map<string, { dung: number[]; giam: number[]; tong: number[]; doi: DoiTb; lop: Map<number, number> }>;
function tapTienBo(c: NguCanhPtGv, nap: NapBai): Tap & { lop?: Map<number, Set<number>>; theoLop?: Map<number, Tap>; theoKyNang: TapKn } {
  const tap: Tap = new Map();
  const lop = new Map<number, Set<number>>();
  /* UI-HO-SO-GV: cùng mục tách theo LỚP EM HỌC LÚC THI (P8) — hàng lớp của bảng Học thuật hồ sơ GV. */
  const theoLop = new Map<number, Tap>();
  /* UI-PHAN-TICH (Báo cáo HV · Tiến bộ theo kỹ năng): CÙNG mục, gom theo kỹ năng cho cả chi nhánh (không cần người dạy): tăng (`dung`) · giảm · còn lại giữ nguyên. */
  const theoKyNang: TapKn = new Map();
  const kn = (skill: string) => theoKyNang.get(skill) ?? theoKyNang.set(skill, { dung: [], giam: [], tong: [], doi: new Map(), lop: new Map() }).get(skill)!;
  const coBand = nap.o.filter((x) => x.band !== null && (nap.attempts.get(x.attemptId)?.kind ?? 'mock') === 'mock');
  const em = [...new Set(coBand.map((x) => x.studentId))];
  const truoc = new Map<string, { tuan: string; id: number; band: number; no: number }[]>();
  for (const lo of theoLo(em)) {
    for (const r of db().prepare(
      `SELECT a.id, a.student_id, a.attempt_no, s.skill, s.band, COALESCE(rp.week_start, '') AS tuan
         FROM assessment_scores s JOIN assessment_attempts a ON a.id = s.attempt_id LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.student_id IN (${cho(lo.length)}) AND COALESCE(a.kind, 'mock') = 'mock' AND a.status != 'cancelled' AND s.band IS NOT NULL`,
    ).all(...lo) as any[]) {
      const k = `${r.student_id}|${r.skill}`;
      truoc.set(k, [...(truoc.get(k) ?? []), { tuan: r.tuan, id: r.id, band: r.band, no: r.attempt_no }]);
    }
  }
  for (const x of coBand) {
    const tuanBai = nap.attempts.get(x.attemptId)?.period_start ?? x.tuan;
    const cu = (truoc.get(`${x.studentId}|${x.skill}`) ?? [])
      .filter((t) => t.id !== x.attemptId && (t.tuan < tuanBai || (t.tuan === tuanBai && t.id < x.attemptId)))
      .sort((a, b) => a.tuan.localeCompare(b.tuan) || a.id - b.id).pop();
    if (!cu) continue;
    kn(x.skill).tong.push(x.id);
    kn(x.skill).lop.set(x.id, x.classId);
    kn(x.skill).doi.set(x.id, { truoc: { luot: `MT${cu.no}`, v: cu.band, mt: cu.no }, sau: { luot: `MT${nap.attempts.get(x.attemptId)?.attempt_no ?? '?'}`, v: x.band! } });
    if (x.band! > cu.band) kn(x.skill).dung.push(x.id);
    else if (x.band! < cu.band) kn(x.skill).giam.push(x.id);
    const gv = c.nguoiLuc(x.classId, x.skill, x.tuan);
    if (gv == null) continue;
    them(tap, gv, x.id, x.band! > cu.band);
    lop.set(gv, (lop.get(gv) ?? new Set<number>()).add(x.classId));
    them(theoLop.get(gv) ?? theoLop.set(gv, new Map()).get(gv)!, x.classId, x.id, x.band! > cu.band);
  }
  return Object.assign(tap, { lop, theoLop, theoKyNang });
}

/**
 * Báo cáo HV · Tiến bộ theo kỹ năng (UI-PHAN-TICH, khung `phan-tich.html`): CHÍNH mục "HV tiến bộ" của Phân tích GV (`tapTienBo`) cho MỘT chi nhánh FT,
 * gom theo kỹ năng. KHÔNG kiểm quyền — nơi gọi (`baoCao`) đã kiểm phạm vi Phân tích. Mục = id bài (`baiId`) → panel `rowsFor('bai')`.
 */
export function tienBoTheoKyNang(p: Principal, cn: number, k: { tu: string; den: string }): TapKn {
  const c = nguCanhCn(cn, { ct: 'ft', tu: mondayOfDate(k.tu), den: mondayOfDate(k.den) });
  return tapTienBo(c, napBai(p, c)).theoKyNang;
}

/** Lượt FT có band gần nhất (tuần, rồi id) của từng em — một câu theo lô (panel HV cần chú ý). */
function luotMoiCoDiem(em: readonly number[]): Map<number, number> {
  const out = new Map<number, { id: number; tuan: string }>();
  for (const lo of theoLo([...em])) {
    for (const r of db().prepare(
      `SELECT a.id, a.student_id, COALESCE(rp.week_start, '') AS tuan FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.student_id IN (${cho(lo.length)}) AND a.status != 'cancelled' AND c.is_fast_track = 1
          AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.band IS NOT NULL)`,
    ).all(...lo) as any[]) {
      const cu = out.get(r.student_id);
      if (!cu || r.tuan > cu.tuan || (r.tuan === cu.tuan && r.id > cu.id)) out.set(r.student_id, { id: r.id, tuan: r.tuan });
    }
  }
  return new Map([...out].map(([s, x]) => [s, x.id]));
}

/** Gộp `doi` mọi kỹ năng — panel Tiến bộ của một GV (nhiều kỹ năng). */
export const doiTienBo = (kn: TapKn): DoiTb => new Map([...kn.values()].flatMap((x) => [...x.doi]));

/**
 * PT-PANEL (PR-1, mockup v13 A2): dòng Tăng / Giữ / Giảm của MỘT mục Tiến bộ (bài = lượt × kỹ năng) — Trước (MTn · điểm) → Sau (MTn · ✓ / ✗ điểm, so kỳ vọng
 * lượt sau) · chênh · kỳ vọng. Lượt sau dựng bằng `dongLuotDiemCua` (cùng ô ✓ / ✗ của panel bảng lượt); chỉ chạy khi mở panel.
 */
export function ganTangGiam(p: Principal, rows: MetricRow[], doi: DoiTb): MetricRow[] {
  const ld = dongLuotDiemCua(p, rows.map((r) => tachBaiId(r.id).attemptId));
  return rows.map((r) => {
    const { attemptId, skill } = tachBaiId(r.id);
    const d = ld.get(attemptId), x = doi.get(r.id);
    const k = KN_LUOT_CUA[skill];
    if (!d || !x || !k) return r;
    const tangGiam: DongTangGiam = {
      attemptId, studentId: d.studentId, ten: d.ten, classId: d.classId, lop: d.lop, kn: NHAN_KN_LUOT[k],
      truoc: { mt: x.truoc.mt, v: x.truoc.v }, sau: { mt: d.mt, v: x.sau.v, kq: d.kn[k]?.kq ?? null }, chenh: x.sau.v - x.truoc.v, kyVong: d.kyVong,
    };
    return { ...r, tangGiam } as MetricRow;
  });
}

/** PT-PANEL: trường đầu panel bảng khi MỌI dòng có `luotDiem` / `tangGiam` (dòng thiếu → panel cũ, không lệch số = dòng). */
export function kieuBang(rows: readonly MetricRow[], cachTinh?: string | null): { bangLuot?: true; kieu?: 'luot' | 'tang-giam' | 'bai-thuong' | 'pa' | 'viec'; cachTinh?: string | null; nguong?: number | null } {
  if (!rows.length) return {};
  const kieu = rows.every((r: any) => r.dongViec) ? 'viec' : rows.every((r: any) => r.tangGiam) ? 'tang-giam' : rows.every((r: any) => r.luotDiem) ? 'luot' : rows.every((r: any) => r.baiThuong) ? 'bai-thuong'
    : rows.every((r: any) => r.pa) ? 'pa' : null;
  if (!kieu) return {};
  return { bangLuot: true, kieu, cachTinh: cachTinh ?? null,
    ...(kieu === 'bai-thuong' ? { nguong: nguongCua(new Map(rows.map((r: any) => [r.id, r.baiThuong]))) } : {}) };
}

// ------------------------------------------------------------------ cột 2 · Ghi kết quả PA (mục = nghĩa vụ cập nhật)

/**
 * Cùng tập `metricSet('dung-han-cap-nhat')` (hạn trong khoảng, cùng khung) → Case → người phụ trách. Nghĩa vụ của Case không người phụ trách: không hàng.
 * `paLop` (XM-VIEC-DUNG-HAN a): PA → em + lớp (lớp đang học, không thì lớp của lượt — như `napPa`) để gộp dòng "Việc đúng hạn" như Công việc; cùng câu, không thêm câu.
 */
export type PaLop = Map<number, { hv: number | null; lop: number | null; ma: string | null }>;
export function tapGhiKetQuaPa(p: Principal, c: NguCanhPtGv): { tap: Tap; khongNguoi: number; paLop: PaLop } {
  const r = metricSet(p, 'dung-han-cap-nhat', { branchId: c.cn, program: c.khung, from: c.tu, to: c.cuoi });
  const dung = new Set(r.numeratorIds ?? []);
  const chu = new Map<number, number | null>();
  const paLop: PaLop = new Map();
  const iv = [...new Set(r.ids.map((id) => parseObligation(id).interventionId))];
  for (const lo of theoLo(iv)) {
    for (const x of db().prepare(
      `SELECT iv.id, sc.owner_user_id, sc.student_id, lc.id AS lop, lc.code AS ma FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN classes lc ON lc.id = COALESCE((SELECT e.class_id FROM enrollments e WHERE e.student_id = sc.student_id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1), a.class_id)
        WHERE iv.id IN (${cho(lo.length)})`,
    ).all(...lo) as any[]) {
      chu.set(x.id, x.owner_user_id ?? null);
      paLop.set(x.id, { hv: x.student_id ?? null, lop: x.lop ?? null, ma: x.ma ?? null });
    }
  }
  const tap: Tap = new Map();
  let khongNguoi = 0;
  for (const id of r.ids) {
    const gv = chu.get(parseObligation(id).interventionId) ?? null;
    if (gv == null) khongNguoi += 1;
    else them(tap, gv, id, dung.has(id));
  }
  return { tap, khongNguoi, paLop };
}

/** id âm (dòng panel sổ nghĩa vụ) theo khoá. */
const idViec = (key: string) => -1 - Math.abs([...key].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 0));

// ------------------------------------------------------------------ cột 4 · PA hiệu quả (FT)

/**
 * Q16 (FT): PA giáo viên tự thêm (không PA theo quy chế) có kết quả trong khoảng — CHÍNH `paCoKetQua` của Hiệu quả PA (Pb2-a), cùng chi nhánh +
 * khung + khoảng, gán cho người phụ trách Case; đúng ⇔ nhóm "success". Ô = Hiệu quả PA lọc `gv` cùng khoảng.
 */
export function tapPaHieuQua(c: NguCanhPtGv): Tap {
  const tap: Tap = new Map();
  for (const r of paCoKetQua({ branchIds: [c.cn], ct: c.khung, tu: c.tu, den: c.den })) {
    if (!r.quyChe && r.chuCase != null) them(tap, r.chuCase, r.id, r.group === 'success');
  }
  return tap;
}

// ------------------------------------------------------------------ SỔ NGHĨA VỤ (PR-2, Task 7): Chấm Test · Việc

/**
 * Phạm vi đọc sổ: chi nhánh (một · nhiều · null = mọi chi nhánh) + khung (Phân tích GV; vắng = mọi khung — hồ sơ GV) + kỳ theo HẠN [tu, cuoi] (spec 1.7).
 * Bảng, panel, hồ sơ GV và Tổng quan › Giáo viên (đọc bảng này) cùng hàm `demTheoNguoi` / `dongCuaNguoi` (spec 1.7, `NV-CUNG-SO`).
 */
type PhamViSo = { cn: number | readonly number[] | null; khung?: KhungPtGv | null; tu: string; cuoi: string; homNay: string };
const cnCua = (cn: PhamViSo['cn']): number[] => (cn == null ? (db().prepare('SELECT id FROM branches').all() as any[]).map((r) => r.id as number)
  : typeof cn === 'number' ? [cn] : [...cn]);
/** Task 7a: ghi lại sổ việc của chi nhánh có lần ghi mới (`lamMoiViec`) — gọi TRƯỚC mọi câu đọc khác của request (ghi xoá bộ nhớ request). */
const moiViec = (v: PhamViSo) => lamMoiViec(cnCua(v.cn), v.homNay);
const qSo = (v: PhamViSo, loai: 'bai' | 'viec', nguoi?: number) =>
  ({ chiNhanh: v.cn, tu: v.tu, den: v.cuoi, homNay: v.homNay, khung: v.khung ?? null, loai, ...(nguoi != null ? { nguoi } : {}) });
/** 3 số Chấm Test (bài) + Việc của mọi người (hoặc một người) trong phạm vi. */
function soCuaKy(v: PhamViSo, nguoi?: number): { bai: Map<number, So3 & { sChung: number }>; viec: Map<number, So3 & { sChung: number }> } {
  if (tachNguCanhKhiKiem.bat) return { bai: demTheoNguoi(qSo(v, 'bai', nguoi)), viec: demTheoNguoi(qSo(v, 'viec', nguoi)) };
  return demTheoNguoiHaiLoai({ chiNhanh: v.cn, tu: v.tu, den: v.cuoi, homNay: v.homNay, khung: v.khung ?? null, ...(nguoi != null ? { nguoi } : {}) });   // GIAM-DOC-HSGV: một câu sổ cho cả hai số
}
/** Cộng các ô cùng loại (bảng tổng V2): có ô số → cộng; chỉ ô rỗng → rỗng; còn lại không áp dụng. */
const congO = (ds: readonly OPtGv[]): OPtGv => {
  const so = ds.filter((o): o is Extract<OPtGv, { k: 'so' }> => o.k === 'so');
  const sChung = ds.reduce((n, o) => n + (o.k !== 'na' ? o.sChung ?? 0 : 0), 0);
  if (so.length) return { k: 'so', dung: so.reduce((n, o) => n + o.dung, 0), tong: so.reduce((n, o) => n + o.tong, 0),
    muon: so.reduce((n, o) => n + (o.muon ?? 0), 0), chua: so.reduce((n, o) => n + (o.chua ?? 0), 0), ...(sChung ? { sChung } : {}) };
  return ds.some((o) => o.k === 'rong') ? { k: 'rong', ...(sChung ? { sChung } : {}) } : { k: 'na' };
};
const so3Tu = (ds: readonly DongNvXem[]) => ({ dung: ds.filter((d) => d.trangThai === 'dung').length, muon: ds.filter((d) => d.trangThai === 'muon').length,
  chua: ds.filter((d) => d.trangThai === 'chua').length });

/** Đường mở một việc của sổ (như Công việc): khoá `viec:<khoá Công việc>[~c<n>]`. */
function duongViecSo(d: DongNvXem, caseCuaPa: ReadonlyMap<number, number>): string {
  const k = d.khoa.replace(/^viec:/, '').replace(/~c\d+$/, '');
  const id = Number(/^[^:]+:(\d+)/.exec(k)?.[1] ?? 0);
  const hv = d.hocVien;
  if (/^(cause|ghi_nhan_xet|support|xnpa-case):/.test(k) && hv) return duongHoSoHocVien(hv, { caseId: id });
  if (k.startsWith('ket_qua_pa:')) {
    const iv = parseObligation(id).interventionId, c = caseCuaPa.get(iv);
    return c ? duongCaseRieng(c, { paId: iv }) : hv ? duongHoSoHocVien(hv) : '/cong-viec';
  }
  if (k.startsWith('buoc_tiep:') && hv) return duongHoSoHocVien(hv, { buocTiep: id });
  if (/^(bao-ph|yt_xu_ly):/.test(k) && hv) return duongHoSoHocVien(hv, { tab: 'y-thuc' });
  if (k.startsWith('ban_giao') && d.lop) return `/hoc-vien/lop/${d.lop}?viec=ban-giao`;
  if (k.startsWith('phoi_hop_sos:') && d.lop) return `/hoc-vien/lop/${d.lop}?tab=y-thuc&sub=phoi-hop`;
  return hv ? duongHoSoHocVien(hv) : d.lop ? `/hoc-vien/lop/${d.lop}` : '/cong-viec';
}

/**
 * Dòng panel (kiểu `viec`) của các dòng sổ: tab Chưa làm · Làm muộn · Đúng hạn (`trangThai`), "hạn gốc …" khi khác hạn, cờ phân công nhập sau, bài S chéo chung
 * (bấm mở thẳng lưới chấm). Một lô câu cho tên em / lớp / lượt / PA / chi nhánh (không theo số dòng).
 */
function dongPanelSo(ds: readonly DongNvXem[], kemCn: boolean): { dung: boolean; row: MetricRow }[] {
  if (!ds.length) return [];
  const conn = db();
  const ids = (f: (d: DongNvXem) => number | null) => JSON.stringify([...new Set(ds.map(f).filter((x): x is number => x != null))]);
  const em = new Map((conn.prepare(`SELECT id, full_name FROM students WHERE id IN (${DS_JSON})`).all(ids((d) => d.hocVien)) as any[])
    .map((r) => [r.id as number, r.full_name as string]));
  const lop = new Map((conn.prepare(`SELECT id, code, programme_code FROM classes WHERE id IN (${DS_JSON})`).all(ids((d) => d.lop)) as any[]).map((r) => [r.id as number, r]));
  const luotId = (d: DongNvXem) => (d.loai === 'bai' ? Number(d.khoa.split(':')[1]) : null);
  const luot = new Map(ds.some((d) => d.loai === 'bai') ? (conn.prepare(`SELECT id, kind, attempt_no FROM assessment_attempts WHERE id IN (${DS_JSON})`)
    .all(ids(luotId)) as any[]).map((r) => [r.id as number, r]) : []);
  const pa = ds.filter((d) => d.khoa.startsWith('viec:ket_qua_pa:')).map((d) => parseObligation(Number(d.khoa.split(':')[2])).interventionId);
  const caseCuaPa = new Map(pa.length ? (conn.prepare(`SELECT id, case_id FROM case_interventions WHERE id IN (${DS_JSON})`).all(JSON.stringify([...new Set(pa)])) as any[])
    .map((r) => [r.id as number, r.case_id as number]) : []);
  const cn = kemCn ? new Map((conn.prepare(`SELECT id, name FROM branches`).all() as any[]).map((r) => [r.id as number, r.name as string])) : null;
  return ds.map((d) => {
    const l = d.lop != null ? lop.get(d.lop) : undefined;
    const e = d.hocVien != null ? { id: d.hocVien, ten: em.get(d.hocVien) ?? '' } : null;
    const a = luot.get(luotId(d) ?? -1);
    const ten = d.loai === 'bai' ? [a ? nhanDotNgan(a.kind, a.attempt_no) : null, tenMonNgan(l?.programme_code ?? null, d.kieu)].filter(Boolean).join(' · ')
      : nhanNhomViec(d.kieu as WorkGroupKey);
    const href = d.loai === 'bai' && a ? duongDotTest({ id: a.id, kind: a.kind, classId: d.lop, studentId: d.hocVien }, d.kieu) : duongViecSo(d, caseCuaPa);
    const dongViec: DongViecHan = {
      tab: d.loai === 'bai' ? 'cham' : tabViecHanCua(d.kieu), mo: d.trangThai === 'chua', ten, phu: d.loai === 'bai' && d.tuan ? tuanLichNgan(d.tuan) : null,
      em: e, lop: l ? { id: l.id, ma: l.code } : null, han: d.han, ngayXong: d.xongLuc, dung: d.trangThai === 'dung', treNgay: d.soNgay, href,
      trangThai: d.trangThai, hanGoc: d.hanGoc, ...(d.pcNhapSau ? { pcNhapSau: true } : {}), ...(d.sChung ? { sChung: true } : {}),
      ...(cn ? { chiNhanh: cn.get(d.chiNhanh) ?? null } : {}),
    };
    return { dung: d.trangThai === 'dung', row: { id: idViec(d.khoa), title: e?.ten || ten, href, lop: l?.code ?? null, sub: ten, dongViec } as MetricRow };
  });
}

/** Panel "Chấm Test đúng hạn" / "Việc đúng hạn" của MỘT người — cùng tập với 3 số ở ô (`dongCuaNguoi`). Tiêu đề đếm 3 số riêng (không gồm S chéo chung). */
function oSoCua(v: PhamViSo, gv: number, cot: 'cham-diem' | 'viec-dung-han', kemCn = false) {
  const loai = cot === 'cham-diem' ? 'bai' : 'viec';
  const ds = dongCuaNguoi({ ...qSo(v, loai), nguoi: gv });
  const rieng = ds.filter((d) => !d.sChung);
  return { nhan: cot === 'cham-diem' ? t('Chấm Test đúng hạn') : t('Việc đúng hạn'), donVi: loai === 'bai' ? 'bài' : 'việc',
    dung: rieng.filter((d) => d.trangThai === 'dung').length, tong: rieng.length, dong: dongPanelSo(ds, kemCn) };
}

// ------------------------------------------------------------------ bảng

/** Đang dạy (Q17): phân công hiệu lực ở min(cuối khoảng, hôm nay) → GV → lớp; lớp → HV đang học — một câu theo lô. Bảng + panel "HV cần chú ý" gọi chung. */
function dangDay(c: NguCanhPtGv): { lopDay: Map<number, Set<number>>; hvLop: Map<number, Set<number>> } {
  const ngayDay = c.cuoi < c.homNay ? c.cuoi : c.homNay;
  const lopDay = new Map<number, Set<number>>();
  for (const a of c.pc) if (!c.lop.get(a.lop)!.xong && a.tu <= ngayDay && (!a.den || a.den >= ngayDay)) lopDay.set(a.gv, (lopDay.get(a.gv) ?? new Set<number>()).add(a.lop));
  const hvLop = new Map<number, Set<number>>();
  for (const lo of theoLo([...new Set([...lopDay.values()].flatMap((s) => [...s]))])) {
    for (const r of db().prepare(
      `SELECT e.class_id, e.student_id FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.class_id IN (${cho(lo.length)}) AND e.status = 'active' AND s.archived_at IS NULL`).all(...lo) as any[]) {
      hvLop.set(r.class_id, (hvLop.get(r.class_id) ?? new Set<number>()).add(r.student_id));
    }
  }
  return { lopDay, hvLop };
}
const hvCuaGv = (d: ReturnType<typeof dangDay>, gv: number) => new Set([...(d.lopDay.get(gv) ?? [])].flatMap((l) => [...(d.hvLop.get(l) ?? [])]));

/**
 * UI-PHAN-TICH "HV cần chú ý" (tự quyết, ghi khop-khac): HV ĐANG SOS (chỉ số `hv-sos-hien-tai` — cùng số "Đang SOS" của Tổng quan) ở lớp GV đang dạy.
 * Số hiện tại, không theo kỳ. Bảng + panel gọi chung. DOC-PT: chỉ đánh giá em `hv` (em ở lớp đang dạy) — số của từng em như chỉ số đủ.
 */
const sosHienTai = (p: Principal, c: NguCanhPtGv, hv: ReadonlySet<number>) => hvSosHienTaiTrong(p, c.cn, c.khung, hv);

/**
 * Người có phân công trong khoảng ở MỘT ngữ cảnh + Đạt kỳ vọng Test (FT) / ô Kết quả (lớp thường) — CÙNG luật các dòng đó của bảng một chi nhánh (`ptGvMotCn`) (người = phân công
 * trong khoảng, lớp đã kết thúc chỉ khi còn bài; `coMon` = có kỹ năng). Bảng tổng V2 dùng, không gọi lại cả bảng từng chi nhánh.
 */
function datCuaNguCanh(c: NguCanhPtGv, nap: NapBai): Map<number, { coMon: boolean; datMt?: OPtGv; ketQua: HangPtGv['ketQua'] }> {
  const lopCoBai = new Set(nap.o.map((x) => x.classId));
  const trongKhoang = c.pc.filter((a) => a.tu <= c.cuoi && (!a.den || a.den >= c.tu) && (!c.lop.get(a.lop)!.xong || lopCoBai.has(a.lop)));
  const kq = tapKetQua(c, mucKetQua(c, nap));
  const out = new Map<number, { coMon: boolean; datMt?: OPtGv; ketQua: HangPtGv['ketQua'] }>();
  for (const id of new Set(trongKhoang.map((a) => a.gv))) {
    const mon = [...new Set(trongKhoang.filter((a) => a.gv === id && !a.core && a.skill).map((a) => a.skill!))];
    const ketQua: HangPtGv['ketQua'] = {};
    for (const k of COT_KET_QUA_GV[c.khung]) ketQua[k] = oTuTap(mon.includes(k), kq.get(k)?.get(id));
    out.set(id, { coMon: mon.length > 0, ketQua, ...(c.khung === 'ft' ? { datMt: oTuTap(mon.length > 0, gopTap(...[...kq.values()].map((x) => x.get(id)))) } : {}) });
  }
  return out;
}

export function phanTichGiaoVien(p: Principal, f: LocPtGv): PhanTichGvKq {
  if (f.cn == null) { const tong = phamViTong(p); if (tong) return phanTichGiaoVienTong(p, f, tong.cns); }
  return ptGvMotCn(p, f);
}
/** Bảng một chi nhánh. */
function ptGvMotCn(p: Principal, f: LocPtGv): PhanTichGvKq {
  const c = nguCanhPtGv(p, f);
  /* Sổ nghĩa vụ (PR-2): Chấm Test · Việc = 3 số của sổ. Ghi lại sổ việc (nếu có lần ghi mới) TRƯỚC mọi câu đọc khác. */
  const v: PhamViSo = { cn: c.cn, khung: c.khung, tu: c.tu, cuoi: c.cuoi, homNay: c.homNay };
  moiViec(v);
  const so = soCuaKy(v);
  /* Hàng: người có phân công ở lớp của khung trong khoảng. Lớp đã kết thúc (dòng phân công không đóng ngày) chỉ tính khi còn bài trong khoảng. */
  const nap = napBai(p, c);
  const lopCoBai = new Set(nap.o.map((x) => x.classId));
  const trongKhoang = c.pc.filter((a) => a.tu <= c.cuoi && (!a.den || a.den >= c.tu) && (!c.lop.get(a.lop)!.xong || lopCoBai.has(a.lop)));
  const nguoi = new Map<number, string>();
  for (const a of trongKhoang) nguoi.set(a.gv, a.ten);
  const v2 = !!f.v2;
  const ghi = v2 ? new Map() : tapGhiKetQuaPa(p, c).tap;
  const ft = c.khung === 'ft';
  const muc = mucKetQua(c, nap);
  const kq = tapKetQua(c, muc);
  /* UI-PHAN-TICH: "Đạt MT" = CHÍNH tập Kết quả (chỉ Test). Thi thật (2F): `mucThiTheoGv` — cùng hàm tab Thi thật + hồ sơ GV. */
  const kqMt = ft ? kq : null;
  const thiGv = ft && !v2 ? mucThiTheoGv(c.cn, c.tu, c.cuoi) : null;
  const gopKn = (m: Map<string, TapKq>, gv: number) => gopTap(...[...m.values()].map((t) => t.get(gv)));
  const tb = ft && !v2 ? tapTienBo(c, nap) : null;
  const pa = ft && !v2 ? tapPaHieuQua(c) : null;
  /* Case có PA = CHÍNH `caseCoPaTheoGv` của Tổng quan. */
  const casePa = v2 ? new Map<number, { coPa: number; mo: number }>() : caseCoPaTheoGv(p, c.cn, c.khung);
  const day = dangDay(c);
  const sos = v2 ? new Set<number>() : sosHienTai(p, c, new Set([...day.hvLop.values()].flatMap((s) => [...s])));

  const hang: HangPtGv[] = [];
  for (const [id, ten] of nguoi) {
    const cua = trongKhoang.filter((a) => a.gv === id);
    const mon = [...new Set(cua.filter((a) => !a.core && a.skill).map((a) => a.skill!))];
    const lopCn = [...new Set(cua.filter((a) => a.core).map((a) => c.lop.get(a.lop)!.ma))].sort((x, y) => x.localeCompare(y, 'vi'));
    const nhanMon = [...new Set(mon.sort((x, y) => THU_TU.indexOf(x) - THU_TU.indexOf(y))
      .map((k) => tenMonNgan(c.lop.get(cua.find((a) => a.skill === k)!.lop)!.ct, k)))];
    const lopGv = day.lopDay.get(id) ?? new Set<number>();
    const hvGv = hvCuaGv(day, id);
    const cp = casePa.get(id);
    const coMon = mon.length > 0;
    const ketQua: HangPtGv['ketQua'] = {};
    for (const k of COT_KET_QUA_GV[c.khung]) {
      const t = kq.get(k);
      const o: OPtGv & { lop?: number[] } = oTuTap(mon.includes(k), t?.get(id));
      if (o.k === 'so') o.lop = [...(t?.lop?.get(id) ?? [])];
      ketQua[k] = o;
    }
    const h: HangPtGv = {
      id, ten,
      phu: [...nhanMon, ...(lopCn.length ? [`GVCN ${lopCn.join(', ')}`] : [])].join(' · '),
      mon: nhanMon.join(' · '), lopCn,
      dangDay: { lop: lopGv.size, hv: hvGv.size },
      hvChuY: [...hvGv].filter((s) => sos.has(s)).length,
      casePa: cp?.mo ? { k: 'so', dung: cp.coPa, tong: cp.mo } : { k: 'rong' },
      chamDiem: oTuSo3(coMon || so.bai.has(id), so.bai.get(id)),
      ghiKetQuaPa: oTuTap(true, ghi.get(id)),
      /* Sổ nghĩa vụ (PR-2): mọi việc có hạn của người (spec 1.1), một khoá một việc như Công việc. */
      viecDungHan: oTuSo3(true, so.viec.get(id)),
      ketQua,
    };
    if (ft) {
      h.datMt = oTuTap(coMon, gopKn(kqMt!, id));
      if (!v2) {
        h.paHieuQua = oTuTap(true, pa!.get(id));
        /* 2F (05/11): mục thi thật của GV (em × kỹ năng GV từng dạy) — CHÍNH `oThiGv` của hồ sơ GV. */
        h.thiThat = coMon ? oThiGv(thiGv!.get(id) ?? []) : { k: 'na' };
        const t = oTuTap(coMon, tb!.get(id));
        h.tienBo = t.k === 'so' ? { ...t, lop: [...(tb!.lop?.get(id) ?? [])] } : t;
      }
    }
    hang.push(h);
  }
  hang.sort((a, b) => a.ten.localeCompare(b.ten, 'vi') || a.id - b.id);
  /* Spec 1.2 a: bài / việc không ai chịu — QL thấy, đếm riêng (không mất). */
  const cp = chuaPhanCong(c.cn, c.tu, c.cuoi, c.homNay, c.khung);
  const chuaPc = cp.length ? { chamDiem: oTuSo3(true, so3Tu(cp.filter((d) => d.loai === 'bai'))), viecDungHan: oTuSo3(true, so3Tu(cp.filter((d) => d.loai === 'viec'))) } : null;
  return { cn: c.cn, tenChiNhanh: c.tenChiNhanh, khung: c.khung, tu: c.tu, den: c.den, thang: c.thang, homNay: c.homNay, hang, chuaPhanCong: chuaPc };
}

/** Xem TỔNG MỌI CHI NHÁNH (spec 1.7): người xem có quyền nhiều chi nhánh. `cns = null` = mọi chi nhánh. Một chi nhánh → không có chế độ này. */
function phamViTong(p: Principal): { cns: number[] | null } | null {
  const scope = scopeFor(p, PERMISSIONS.ANALYSIS_VIEW_TEACHER);
  if (scope.none) throw forbidden('Phân tích giáo viên dành cho Quản lý và Quản trị hệ thống.');
  return scope.all ? { cns: null } : scope.branchIds.length > 1 ? { cns: [...scope.branchIds] } : null;
}
function phamViSoTong(f: LocPtGv, cns: number[] | null): PhamViSo & { khung: KhungPtGv; tu: string; den: string } {
  const homNay = demoToday();
  const k = khoangPtGv(f, homNay);
  if ('loi' in k) throw badRequest(k.loi);
  return { cn: cns, khung: f.ct ?? 'ft', tu: k.tu, den: k.den, cuoi: addDays(k.den, 6), homNay };
}

/**
 * Tổng mọi chi nhánh (sổ nghĩa vụ, spec 1.7): mỗi người MỘT dòng, chỉ Việc · Chấm Test (3 số cộng các chi nhánh); bấm số → panel ghi chi nhánh từng dòng.
 * Người: có phân công ở lớp khung trong khoảng (phạm vi) + mọi người có số (TVV, QL giữ việc). Cột khác `na` (học thuật đọc theo chi nhánh).
 */
function phanTichGiaoVienTong(p: Principal, f: LocPtGv, cns: number[] | null): PhanTichGvKq {
  const v = phamViSoTong(f, cns);
  /*
   * KHÔNG ghi lại sổ việc ở đây (đo seed: ghi lại 5 chi nhánh = 136 câu, trần cứng 100): đọc sổ đang có — bài luôn mới (ghi sổ ở đường ghi), việc mới theo lần mở
   * bảng / hồ sơ GV của chi nhánh (`lamMoiViec`) + đối chiếu đêm. [XM] chờ PTA nếu cần số việc tổng "không trễ".
   */
  /*
   * V2 (đặc tả 6, mockup D2; PTA rà #1414): Đạt kỳ vọng Test + Chưa phân công + số từng chi nhánh tính MỘT lần cho mọi chi nhánh — ngữ cảnh 2 câu,
   * lượt qua `napBaiNhieu` (phần nạp theo lượt / em dùng chung), sổ một câu chia theo chi nhánh; 3 số của người = Σ chi nhánh (cùng sổ, không đọc lại).
   */
  const theoCn = new Map<number, NonNullable<HangPtGv['chiNhanh']>>();
  const cpcCn: NonNullable<NonNullable<PhanTichGvKq['chuaPhanCong']>['chiNhanh']> = [];
  let so: ReturnType<typeof soCuaKy>;
  let pcV2: PhanCong[] | null = null;
  if (f.v2) {
    const cs = nguCanhNhieuCn(cns, f);
    pcV2 = cs.flatMap((c) => c.pc);
    const naps = napBaiNhieu(p, cs);
    const s = demTheoCnNguoi({ chiNhanh: cs.map((c) => c.cn), tu: v.tu, den: v.cuoi, homNay: v.homNay, khung: v.khung });
    cs.forEach((c, i) => {
      const sc = s.dem.get(c.cn);
      for (const [id, x] of datCuaNguCanh(c, naps[i])) {
        (theoCn.get(id) ?? theoCn.set(id, []).get(id)!).push({ id: c.cn, ten: c.tenChiNhanh, chamDiem: oTuSo3(x.coMon || !!sc?.bai.has(id), sc?.bai.get(id)),
          viecDungHan: oTuSo3(true, sc?.viec.get(id)), ...(x.datMt ? { datMt: x.datMt } : {}), ...(c.khung === 'thuong' ? { ketQua: x.ketQua } : {}) });
      }
      const dong = s.chuaPc.get(c.cn) ?? [];
      if (dong.length) cpcCn.push({ id: c.cn, ten: c.tenChiNhanh, chamDiem: oTuSo3(true, so3Tu(dong.filter((d) => d.loai === 'bai'))), viecDungHan: oTuSo3(true, so3Tu(dong.filter((d) => d.loai === 'viec'))) });
    });
    const cong = (k: 'bai' | 'viec') => {
      const m = new Map<number, So3 & { sChung: number }>();
      for (const x of s.dem.values()) for (const [id, y] of x[k]) { const z = m.get(id) ?? m.set(id, { dung: 0, muon: 0, chua: 0, sChung: 0 }).get(id)!; z.dung += y.dung; z.muon += y.muon; z.chua += y.chua; z.sChung += y.sChung; }
      return m;
    };
    so = { bai: cong('bai'), viec: cong('viec') };
  } else so = soCuaKy(v);
  const conn = db();
  const ten = new Map<number, string>();
  const mon = new Map<number, Set<string>>();
  /* V2: người + môn lấy từ phân công đã nạp ở ngữ cảnh (cùng điều kiện câu dưới: lớp khung, phân công giao khoảng) — không đọc lại. */
  if (pcV2) for (const a of pcV2) if (a.tu <= v.cuoi && (!a.den || a.den >= v.tu)) { ten.set(a.gv, a.ten); if (a.skill) (mon.get(a.gv) ?? mon.set(a.gv, new Set()).get(a.gv)!).add(a.skill); }
  if (!pcV2) for (const r of conn.prepare(`SELECT ta.user_id AS id, u.full_name AS ten, ta.skill FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id JOIN users u ON u.id = ta.user_id
      WHERE ta.status IN ('active', 'ended') AND c.is_fast_track = ? AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
        ${cns ? `AND c.branch_id IN (${DS_JSON})` : ''}`).all(v.khung === 'ft' ? 1 : 0, v.cuoi, v.tu, ...(cns ? [JSON.stringify(cns)] : [])) as any[]) {
    ten.set(r.id, r.ten);
    if (r.skill) (mon.get(r.id) ?? mon.set(r.id, new Set()).get(r.id)!).add(r.skill);
  }
  const them = [...new Set([...so.bai.keys(), ...so.viec.keys()])].filter((id) => !ten.has(id));
  if (them.length) for (const r of conn.prepare(`SELECT id, full_name FROM users WHERE id IN (${DS_JSON})`).all(JSON.stringify(them)) as any[]) ten.set(r.id, r.full_name);
  /* Đạt kỳ vọng Test (FT) / Đạt Test (lớp thường, gộp các ô Kết quả) của người = Σ các chi nhánh. */
  const cnGv = (id: number): Partial<HangPtGv> => {
    const ds = theoCn.get(id);
    if (!ds?.length) return {};
    return { chiNhanh: ds, ...(v.khung === 'ft' ? { datMt: congO(ds.map((x) => x.datMt ?? { k: 'na' })) } : { ketQua: { tong: congO(ds.flatMap((x) => Object.values(x.ketQua ?? {}))) } }) };
  };
  const hang: HangPtGv[] = [...ten].map(([id, tenGv]) => {
    const nhanMon = [...new Set([...(mon.get(id) ?? [])].sort((x, y) => THU_TU.indexOf(x) - THU_TU.indexOf(y)).map((k) => tenMonNgan(null, k)))].join(' · ');
    return { id, ten: tenGv, phu: nhanMon, mon: nhanMon, lopCn: [], dangDay: { lop: 0, hv: 0 }, hvChuY: 0, casePa: { k: 'na' } as OPtGv,
      chamDiem: oTuSo3(true, so.bai.get(id)), ghiKetQuaPa: { k: 'na' } as OPtGv, viecDungHan: oTuSo3(true, so.viec.get(id)), ketQua: {},
      ...(cnGv(id)) };
  }).sort((a, b) => a.ten.localeCompare(b.ten, 'vi') || a.id - b.id);
  const chuaPc = cpcCn.length ? { chamDiem: congO(cpcCn.map((x) => x.chamDiem)), viecDungHan: congO(cpcCn.map((x) => x.viecDungHan)), chiNhanh: cpcCn } : null;
  return { cn: null, tenChiNhanh: t('Tất cả chi nhánh'), khung: v.khung, tu: v.tu, den: v.den, thang: f.thang ?? null, homNay: v.homNay, hang, chuaPhanCong: chuaPc };
}

/**
 * EXCEL GIÁO VIÊN · sheet Danh sách (Phân tích V2 · PR-5): mọi bài / việc có hạn trong kỳ của mọi người — dòng = dòng panel sổ nghĩa vụ (`dongPanelSo`)
 * + tên người chịu (`gv`, null = Chưa phân công). Một chi nhánh: ghi lại sổ việc như bảng; Tất cả chi nhánh: đọc sổ đang có như bảng tổng.
 * Chỉ gọi lúc bấm Xuất. Một câu sổ + 4 câu tên (em, lớp, lượt, người).
 */
export function danhSachSoGv(p: Principal, f: LocPtGv): { rows: (MetricRow & { gv: string | null })[] } {
  let v: PhamViSo;
  const tong = f.cn == null ? phamViTong(p) : null;
  if (tong) v = phamViSoTong(f, tong.cns);
  else {
    const c = nguCanhPtGv(p, f);
    v = { cn: c.cn, khung: c.khung, tu: c.tu, cuoi: c.cuoi, homNay: c.homNay };
    moiViec(v);
  }
  const ds = dongMoiNguoi({ chiNhanh: v.cn, tu: v.tu, den: v.cuoi, homNay: v.homNay, khung: v.khung ?? null });
  const ids = [...new Set(ds.map((d) => d.nguoi).filter((x): x is number => x != null))];
  const ten = new Map(ids.length ? (db().prepare(`SELECT id, full_name FROM users WHERE id IN (${DS_JSON})`).all(JSON.stringify(ids)) as any[]).map((r) => [r.id as number, r.full_name as string]) : []);
  const dong = dongPanelSo(ds, !!tong);
  return { rows: dong.map((d, i) => ({ ...d.row, gv: ds[i].nguoi != null ? ten.get(ds[i].nguoi!) ?? null : null })) };
}

/** Tiêu đề panel "{nhãn} · {ai / kỳ} · {đúng}/{tổng} {đơn vị}" — qua `t()` để web tiếng Anh dịch theo mẫu (K5: đơn vị ghi đúng chữ). */
function tieuDeChiSo(nhan: string, ai: string, dung: number, tong: number, donVi: string): string {
  const b = { nhan, ai, dung, tong };
  if (donVi === 'lượt Test') return t('{nhan} · {ai} · {dung}/{tong} lượt Test', b);
  if (donVi === 'việc') return t('{nhan} · {ai} · {dung}/{tong} việc', b);
  if (donVi === 'bài') return t('{nhan} · {ai} · {dung}/{tong} bài', b);
  return `${nhan} · ${ai} · ${dung}/${tong}`;
}

/** Dòng của một tập (đúng / trễ) kèm cờ `dung` và loại việc ở đầu dòng phụ — panel gộp nhiều tập (Việc đúng hạn). */
function dongTheoTap(tap: { dung: number[]; tong: number[] } | undefined, dong: (ids: number[]) => MetricRow[], loai?: string) {
  const dung = new Set(tap?.dung ?? []);
  const ids = [...(tap?.tong ?? [])].sort((a, b) => Number(dung.has(a)) - Number(dung.has(b)) || a - b);
  return dong(ids).map((row, i) => ({
    dung: dung.has(ids[i]),
    row: loai ? { ...row, sub: [loai, row.sub, dung.has(ids[i]) ? t('Đúng hạn') : t('Quá hạn')].filter(Boolean).join(' · ') } : row,
  }));
}


/**
 * OV-15e (C30, mockup 3 mục 4c): PANEL CỦA MỘT CHỈ SỐ KHÁC "Chấm điểm" — đúng GV + đúng khoảng, CÙNG hàm tập với ô bảng (số = số dòng; `0/20` mở 20 mục).
 * `cot`: `ket-qua:<kỹ năng>` · `tien-bo` · `ghi-pa` · `pa-hieu-qua`. Dòng chưa đạt / trễ lên đầu.
 */
/** PT-PANEL: khối Cách tính của panel bảng (web dịch). */
const CACH_TINH_SO = 'Bài, việc có hạn trong kỳ: Đúng hạn (xong trước / đúng hạn) · Làm muộn (xong sau hạn) · Chưa làm (quá hạn chưa xong). Tỉ lệ = đúng hạn / cả ba. Bài Speaking chấm chéo chưa ai nhận là việc chung của mọi GV có kỹ năng S ở chi nhánh — nhóm riêng, không tính vào tỉ lệ. Hạn gốc ghi khi đã đặt lại hạn. Việc / bài trước tuần W4 OCT 2026 đã làm = đúng hạn.';
const CACH_TINH_GV: Record<string, string> = {
  'tien-bo': 'Điểm kỹ năng ở lượt MT so lượt MT liền trước có điểm kỹ năng đó của chính HV. Ô "Sau" ✓ / ✗ so kỳ vọng của lượt đó.',
  'dat-mt': 'Lượt Test đạt khi Overall đạt kỳ vọng của lượt (mọi kỹ năng tính Đạt); Overall chưa đạt thì xét từng kỹ năng. Cột tô nền là kỹ năng GV phụ trách.',
  'hv-chu-y': 'HV đang SOS ở lớp GV đang dạy; bảng hiện lượt Mock có điểm gần nhất của HV.',
  'ket-qua': 'Mỗi dòng là một môn GV phụ trách (viền nhấn) ở một bài Progress Test / Final Test. Môn đạt khi tỷ lệ đúng từ ngưỡng của lớp.',
  /* DEM-QUA-HAN b. */
  /* XM-VIEC-DUNG-HAN a: đếm DÒNG như Công việc. */
  /* XM-VIEC-DUNG-HAN b: + việc đã làm (có ngày làm). */
  /* SỔ NGHĨA VỤ (PR-2): một câu cho hai panel (cùng luật đếm, spec 1.3 · 1.6 · 1.7). */
  'viec-dung-han': CACH_TINH_SO,
  'cham-diem': CACH_TINH_SO,
};
export function oChiSoGv(p: Principal, f: LocPtGv & { gv: number; cot: string }): { n: number; tieuDe: string; rows: MetricRow[]; chiNhanh?: string } {
  const so = f.cot === 'cham-diem' || f.cot === 'viec-dung-han' ? f.cot : null;
  /* Sổ nghĩa vụ: tổng mọi chi nhánh — panel một người qua mọi chi nhánh, mỗi dòng ghi chi nhánh. */
  const tong = f.cn == null && so ? phamViTong(p) : null;
  if (tong && so) {
    const v = phamViSoTong(f, tong.cns);   // như bảng tổng: đọc sổ đang có, không ghi lại sổ việc
    /* `gv = 0` (V2): Chưa phân công của mọi chi nhánh trong phạm vi — cùng tập với hàng tổng, mỗi dòng ghi chi nhánh. */
    if (f.gv === 0) {
      const ds = [...demTheoCnNguoi({ chiNhanh: tong.cns, tu: v.tu, den: v.cuoi, homNay: v.homNay, khung: v.khung }).chuaPc.values()].flat().filter((d) => d.loai === (so === 'cham-diem' ? 'bai' : 'viec'));   // cùng tập với hàng tổng, một câu sổ
      const rows = dongPanelSo(ds, true).map((d) => d.row);
      return { n: rows.length, tieuDe: tieuDeChiSo(so === 'cham-diem' ? t('Chấm Test đúng hạn') : t('Việc đúng hạn'), t('Chưa phân công'), so3Tu(ds).dung, ds.length, so === 'cham-diem' ? 'bài' : 'việc'),
        rows, ...kieuBang(rows, CACH_TINH_GV[so]), chiNhanh: t('Tất cả chi nhánh') };
    }
    const r = oSoCua(v, f.gv, so, true);
    /* Chỉ người có dòng sổ trong phạm vi (hoặc phân công ở lớp khung trong khoảng) — không trả tên tài khoản bất kỳ qua `gv=`. */
    const ten = (db().prepare(`SELECT u.full_name FROM users u WHERE u.id = ? AND (? OR EXISTS (SELECT 1 FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
        WHERE ta.user_id = u.id AND ta.status IN ('active', 'ended') AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
          ${tong.cns ? `AND c.branch_id IN (${DS_JSON})` : ''}))`).get(f.gv, r.dong.length ? 1 : 0, v.cuoi, v.tu, ...(tong.cns ? [JSON.stringify(tong.cns)] : [])) as any)?.full_name;
    if (!ten) throw notFound('Không tìm thấy giáo viên này trong phạm vi bạn được xem.');
    const rows = r.dong.map((d) => d.row);
    return { n: rows.length, tieuDe: tieuDeChiSo(r.nhan, ten, r.dung, r.tong, r.donVi), rows, ...kieuBang(rows, CACH_TINH_GV[so]), chiNhanh: t('Tất cả chi nhánh') };
  }
  const c = nguCanhPtGv(p, f);
  if (so) {
    moiViec({ cn: c.cn, khung: c.khung, tu: c.tu, cuoi: c.cuoi, homNay: c.homNay });
    /* `gv = 0`: bài / việc CHƯA PHÂN CÔNG của chi nhánh (spec 1.2 a) — cùng tập với dòng "Chưa phân công" của bảng. */
    if (f.gv === 0) {
      const ds = chuaPhanCong(c.cn, c.tu, c.cuoi, c.homNay, c.khung).filter((d) => d.loai === (so === 'cham-diem' ? 'bai' : 'viec'));
      const rows = dongPanelSo(ds, false).map((d) => d.row);
      return { n: rows.length, tieuDe: tieuDeChiSo(so === 'cham-diem' ? t('Chấm Test đúng hạn') : t('Việc đúng hạn'), t('Chưa phân công'), so3Tu(ds).dung, ds.length, so === 'cham-diem' ? 'bài' : 'việc'),
        rows, ...kieuBang(rows, CACH_TINH_GV[so]), chiNhanh: c.tenChiNhanh };
    }
  }
  const ten = c.pc.find((a) => a.gv === f.gv)?.ten;
  if (!ten) throw notFound('Giáo viên không có lớp ở chi nhánh này.');
  const r = oChiSoCua(p, c, f.gv, f.cot);
  const tieuDe = f.cot === 'hv-chu-y' ? t('HV cần chú ý · {ai} · {n} HV', { ai: ten, n: r.dong.length }) : tieuDeChiSo(r.nhan, ten, r.dung, r.tong ?? r.dong.length, r.donVi);
  const rows = r.dong.map((d) => d.row);
  return { n: rows.length, tieuDe, rows, ...kieuBang(rows, CACH_TINH_GV[f.cot] ?? null), chiNhanh: c.tenChiNhanh };
}

/**
 * Dòng của MỘT cột cho MỘT GV trong MỘT ngữ cảnh (chi nhánh + khung + khoảng) — panel bảng (`oChiSoGv`) và hồ sơ GV theo kỳ (`oChiSoHoSoGv`) gọi chung,
 * cùng hàm tập với số ở ô. `cot` thêm cho hồ sơ: `cham-diem` (Điểm đúng hạn, bài) · `ket-qua` (mọi kỹ năng của khung). Dòng trễ / chưa đạt trước.
 * K5: đơn vị ghi sau tử / mẫu — kết quả, tiến bộ đếm "lượt kỹ năng" (một lượt × một kỹ năng GV dạy), không gọi chung "HV".
 */
function oChiSoCua(p: Principal, c: NguCanhPtGv, gv: number, cot: string, pTap: Principal = p): { nhan: string; donVi: string; dung: number; tong?: number; dong: { dung: boolean; row: MetricRow }[] } {
  const ra = (nhan: string, donVi: string, dong: { dung: boolean; row: MetricRow }[]) => ({ nhan, donVi, dung: dong.filter((d) => d.dung).length, dong });
  const theoBai = (o: Map<number, OBai>, dung: Set<number>, phu: (x: OBai) => string, them?: (x: OBai) => Partial<MetricRow>) => (ids: number[]): MetricRow[] => {
    return ids.map((id) => {
      const x = o.get(id)!;
      return {
        id, title: x.hocVien, href: `/hoc-vien/${x.studentId}`, lop: c.lop.get(x.classId)?.ma ?? null,
        sub: [c.lop.get(x.classId)?.ma, `${x.bai} · ${tuanLichNgan(x.tuan)}`, phu(x), dung.has(id) ? 'Đạt' : 'Chưa đạt'].filter(Boolean).join(' · '),
        ketQua: dung.has(id) ? 'dat' : 'chua', ...them?.(x),
      };
    });
  };
  /* `dat-mt` (UI-PHAN-TICH): CHÍNH tập Kết quả — cùng ô bảng. Thi thật (2F) ở panel hồ sơ GV `thi-that` (`mucThiTheoGv`). */
  const kq = /^(ket-qua|dat-mt)(?::(\w+))?$/.exec(cot);
  if (kq || cot === 'tien-bo') {
    const nap = napBai(p, c, gv);
    const muc = kq ? mucKetQua(c, nap) : [];
    const tapKq = kq ? tapKetQua(c, muc) : null;
    const tb = !kq ? tapTienBo(c, nap) : null;
    const tap = tb ? tb.get(gv) : kq![2] ? tapKq!.get(kq![2])?.get(gv) : gopTap(...[...tapKq!.values()].map((t) => t.get(gv)));
    const theoMuc = new Map(muc.map((m) => [m.x.id, m]));
    const diem = (x: OBai) => (x.band !== null ? `${tenMonNgan(c.lop.get(x.classId)?.ct ?? null, x.skill)} ${x.band.toFixed(1)}` : null);
    /* V5 C09: dòng phụ ghi Overall + kỳ vọng / Target — đọc được vì sao kỹ năng dưới kỳ vọng vẫn tính Đạt. */
    const ky = (x: OBai) => {
      const m = theoMuc.get(x.id);
      if (m) return [diem(x), m.ovr !== null ? `Overall ${m.ovr.toFixed(1)}` : null, m.kv !== null ? `kỳ vọng ${m.kv.toFixed(1)}` : null].filter(Boolean).join(' · ');
      const a = nap.attempts.get(x.attemptId);
      const kv = a && a.scoring_mode !== 'ratio' ? expectationFor(a.target_score ?? null, a.attempt_no, a.route, a.created_at) : null;
      return [diem(x), kv !== null ? `kỳ vọng ${kv.toFixed(1)}` : null].filter(Boolean).join(' · ');
    };
    const o = new Map(nap.o.map((x) => [x.id, x]));
    const diemLuot = (x: OBai): Partial<MetricRow> => {
      const ct = c.lop.get(x.classId)?.ct ?? null;
      if (c.khung === 'thuong') {
        /* Lớp thường: % từng môn (điểm / tổng) so với ngưỡng đạt của lớp — cùng `ratioResult` của bảng điểm. */
        const sc = (nap.bundle.scores.get(x.attemptId) ?? []).filter((r: any) => r.raw_score != null && r.raw_total);
        if (!sc.length) return {};
        /* PANEL-MC (T3): `diemHv` thay `diem` / `donVi`; đạt = % ≥ ngưỡng lớp (cùng `ratioResult`). */
        const nguong = Math.round(nguongDatLop(x.classId) * 100);
        return {
          ngCanh: `${x.bai} · ${tuanLichNgan(x.tuan)}`,
          diemHv: {
            luot: x.bai, tuan: x.tuan, tam: false, overall: null, soVoi: { nhan: 'ngưỡng', v: nguong }, donVi: '%',
            /* Đạt xét trên tỷ lệ CHÍNH XÁC (`ratioResult`), không trên % đã làm tròn để hiện. */
            kn: sc.map((r: any) => ({ k: tenMonNgan(ct, r.skill), v: Math.round((1000 * r.raw_score) / r.raw_total) / 10,
              dat: ratioResult(r.raw_score, r.raw_total, nguongDatLop(x.classId)).outcome === 'pass', cua: r.skill === x.skill })),
          },
          soVoi: { nhan: t('Đạt từ'), v: nguong },
        };
      }
      const band = new Map((nap.bundle.scores.get(x.attemptId) ?? []).map((r: any) => [r.skill as string, (r.band ?? null) as number | null]));
      if (![...band.values()].some((v) => v !== null)) return {};
      const ds = COT_KET_QUA_GV[c.khung].filter((k) => band.has(k)).map((k) => ({ sk: k, k: tenMonNgan(ct, k), v: band.get(k) ?? null, cua: k === x.skill }));
      const m = theoMuc.get(x.id);
      const kv = m?.kv ?? null;
      /* PANEL-MC (T3): ✓ / ✗ từng kỹ năng so kỳ vọng của lượt; `cua` (viền nhấn kỹ năng của GV — XM-2) giữ trên từng kỹ năng. */
      return { ngCanh: `${x.bai} · ${tuanLichNgan(x.tuan)}`, soVoi: kv !== null ? { nhan: t('kỳ vọng'), v: kv } : null,
        diemHv: { luot: x.bai, tuan: x.tuan, tam: false, overall: m?.ovr ?? null, soVoi: kv !== null ? { nhan: 'KV', v: kv } : null,
          /* Task Writing lẻ (W1 / W2 ở MT) không có kết luận riêng — kỳ vọng xét trên W gộp — và môn em đã bỏ (P8): không ✓ / ✗. */
          kn: ds.map(({ sk, ...k }) => ({ ...k, dat: k.v === null || kv === null || sk === 'writing1' || sk === 'writing2'
            || kyNangDaBo(boMonDaBo(nap.bundle.skips.get(x.attemptId) ?? []), assessedSkillOf(sk)) ? null : k.v >= kv })) } };
    };
    const nhan = !kq ? t('HV tiến bộ') : kq[1] === 'dat-mt' ? t('Đạt kỳ vọng Test')
      : kq[2] ? t('Đạt kỳ vọng Test {mon}', { mon: tenMonNgan(null, kq[2]) }) : t('Đạt kỳ vọng Test');
    const dong = dongTheoTap(tap, theoBai(o, new Set(tap?.dung ?? []), ky, kq ? diemLuot : undefined));
    /* PT-PANEL (PR-1): FT — Tiến bộ → dòng Trước → Sau (`tangGiam`); Đạt kỳ vọng Test (Phân tích GV) → bảng lượt, kỹ năng của GV tô nền (`knCua`). */
    const gan = (rows: MetricRow[]) => dong.map((d, i) => ({ ...d, row: rows[i] }));
    if (c.khung === 'ft' && tb) return ra(nhan, 'lượt Test', gan(ganTangGiam(p, dong.map((d) => d.row), doiTienBo(tb.theoKyNang))));
    if (c.khung === 'ft' && kq?.[1] === 'dat-mt') {
      return ra(nhan, 'lượt Test', gan(ganLuotDiem(p, dong.map((d) => d.row), (id) => o.get(id)?.attemptId || null,
        (r) => ({ knCua: [KN_LUOT_CUA[o.get(r.id)!.skill]].filter(Boolean) }))));
    }
    /* PT-LOP-THUONG (PR-2): lớp thường — bảng bài theo môn của chương trình, môn GV phụ trách viền nhấn (`monCua`). */
    if (c.khung === 'thuong' && kq) {
      const bai = dongBaiThuongCua(dong.map((d) => o.get(d.row.id)?.attemptId ?? 0).filter(Boolean));
      return ra(nhan, 'lượt Test', gan(dong.map((d) => {
        const x = o.get(d.row.id), b = x ? bai.get(x.attemptId) : undefined;
        return b ? ({ ...d.row, baiThuong: { ...b, monCua: [tenMonNgan(c.lop.get(x!.classId)?.ct ?? null, x!.skill)] } } as MetricRow) : d.row;
      })));
    }
    return ra(nhan, 'lượt Test', dong);
  }
  if (cot === 'cham-diem' || cot === 'viec-dung-han') {
    /* Sổ nghĩa vụ (PR-2): panel = dòng sổ của người (cùng 3 số ở ô). Hồ sơ GV đọc sổ ở `oChiSoHoSoGvDu` (không qua đây). */
    const r = oSoCua({ cn: c.cn, khung: c.khung, tu: c.tu, cuoi: c.cuoi, homNay: c.homNay }, gv, cot);
    return { nhan: r.nhan, donVi: r.donVi, dung: r.dung, tong: r.tong, dong: r.dong };
  }
  if (cot === 'ghi-pa') { const x = tapGhiKetQuaPa(pTap, c).tap.get(gv); return ra(t('Kết quả PA đúng hạn'), '', dongTheoTap(x, (ids) => dongNghiaVu(ids, new Set(x?.dung ?? []), c.homNay))); }
  if (cot === 'hv-chu-y') {
    const hv = hvCuaGv(dangDay(c), gv);
    const sos = sosHienTai(p, c, hv);
    const ids = [...hv].filter((s) => sos.has(s)).sort((a, b) => a - b);
    const rows = rowsFor('hoc-vien', ids, undefined, p);
    /* PT-PANEL (PR-1): FT — bảng lượt của lượt Mock có điểm GẦN NHẤT của em (lượt làm em đang SOS); kỹ năng ✗ là lý do. */
    const moi = c.khung === 'ft' ? luotMoiCoDiem(ids) : null;
    return ra(t('HV cần chú ý'), '', (moi ? ganLuotDiem(p, rows, (s) => moi.get(s) ?? null) : rows).map((row) => ({ dung: true, row })));
  }
  if (cot === 'pa-hieu-qua') return ra(t('PA hiệu quả'), '', dongTheoTap(tapPaHieuQua(c).get(gv), (ids) => dongPa(ids)));
  throw badRequest(`Cột "${cot}" không có trong bảng.`);
}

// ------------------------------------------------------------------ hồ sơ GV theo kỳ (V5 SV-SO2 — Từ tuần – Đến tuần)

/**
 * Mọi (chi nhánh, khung) GV có phân công giao kỳ, trong phạm vi người xem (`phamViHoSoGv` — GV xem mình, QL / QT chi nhánh mình) — mỗi cặp một ngữ cảnh
 * của bảng Phân tích GV. Số hồ sơ = Σ tử / Σ mẫu của các ngữ cảnh (05 mục 1.3), cùng hàm tập với ô bảng (một GV một chi nhánh: số ở hồ sơ = số ở bảng).
 */
/**
 * Người xem CHỈ ĐỌC phạm vi MỘT chi nhánh (`attempt.view`): hồ sơ GV theo kỳ tính tập Kết quả PA (`metricSet` → phạm vi người gọi) đúng như QL chi nhánh đó thấy —
 * quyền đã kiểm ở `phamViHoSoGv`; không theo phân công hôm nay của người xem (GV tự xem kỳ cũ ở lớp đã thôi dạy). userId âm: khoá nhớ của `metricSet` riêng.
 */
const xemChiNhanh = (cn: number): Principal => ({
  userId: -cn, code: '', fullName: '', title: null, roleKeys: [], assignments: [],
  grants: [{ id: 0, roleKey: 'manager', roleName: '', branchId: cn, branchName: null, permissions: new Set([PERMISSIONS.ATTEMPT_VIEW]) }],
});


function nguCanhCuaGv(p: Principal, gvId: number, q: { tu?: string | null; den?: string | null }) {
  const { branchIds } = phamViHoSoGv(p, gvId);
  const homNay = demoToday();
  const k = khoangPtGv(q, homNay);
  if ('loi' in k) throw badRequest(k.loi);
  /*
   * GIAM-DOC-HSGV: MỘT câu — (chi nhánh, khung) GV có phân công trong kỳ kèm tên chi nhánh, lớp + mọi dòng phân công của từng ngữ cảnh (cùng cột / nguồn
   * `nguCanhCn`). Trước: một câu tìm ngữ cảnh + hai câu mỗi ngữ cảnh (tên chi nhánh, lớp + phân công). Thứ tự ngữ cảnh như cũ: chi nhánh tăng, FT trước.
   */
  if (tachNguCanhKhiKiem.bat) {
    const ck = db().prepare(
      `SELECT DISTINCT c.branch_id, c.is_fast_track FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
        WHERE ta.user_id = ? AND ta.status IN ('active', 'ended') AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
          ${branchIds ? `AND c.branch_id IN (${cho(branchIds.length)})` : ''}
        ORDER BY c.branch_id, c.is_fast_track DESC`).all(gvId, addDays(k.den, 6), k.tu, ...(branchIds ?? [])) as any[];
    return ketNguCanhGv(branchIds, homNay, k, ck.map((r) => nguCanhCn(r.branch_id, { ct: r.is_fast_track ? 'ft' : 'thuong', tu: k.tu, den: k.den })));
  }
  const rows = db().prepare(
    `WITH ck AS (SELECT DISTINCT c.branch_id, c.is_fast_track FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      WHERE ta.user_id = ? AND ta.status IN ('active', 'ended') AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
        ${branchIds ? `AND c.branch_id IN (${cho(branchIds.length)})` : ''})
     SELECT ck.branch_id AS ck_cn, ck.is_fast_track AS ck_ft, b.name AS ck_ten, ${COT_LOP_PC}
       FROM ck JOIN branches b ON b.id = ck.branch_id CROSS JOIN classes c ON c.branch_id = ck.branch_id AND c.is_fast_track = ck.is_fast_track
       ${TU_LOP_PC.replace(/^FROM classes c /, '')}`).all(gvId, addDays(k.den, 6), k.tu, ...(branchIds ?? [])) as any[];
  const nhom = new Map<string, any[]>();
  for (const r of rows) (nhom.get(`${r.ck_cn}|${r.ck_ft}`) ?? nhom.set(`${r.ck_cn}|${r.ck_ft}`, []).get(`${r.ck_cn}|${r.ck_ft}`)!).push(r);
  return ketNguCanhGv(branchIds, homNay, k, [...nhom.values()].sort((a, b) => a[0].ck_cn - b[0].ck_cn || b[0].ck_ft - a[0].ck_ft)
    .map((g) => dungNguCanh(g[0].ck_cn, g[0].ck_ten, g[0].ck_ft ? 'ft' : 'thuong', k, null, homNay, g)));
}
function ketNguCanhGv(branchIds: number[] | null, homNay: string, k: { tu: string; den: string }, ds: NguCanhPtGv[]) {
  /*
   * Sổ nghĩa vụ (PR-2): Chấm Test · Việc của hồ sơ = dòng sổ của GV trong phạm vi người xem (`branchIds`, null = mọi chi nhánh), kỳ theo hạn. Ghi lại sổ việc
   * (`lamMoiViec`) chỉ ở chi nhánh GV dạy trong kỳ (phạm vi rộng: GV tự xem).
   * ponytail: việc GV giữ ở chi nhánh không dạy trong kỳ đọc sổ đã ghi (≤ lần ghi sổ kế / đêm) — thêm chi nhánh theo vai nếu chủ SP báo lệch.
   */
  const so: PhamViSo = { cn: branchIds, tu: k.tu, cuoi: addDays(k.den, 6), homNay };
  const lamMoi = () => lamMoiViec(branchIds ?? [...new Set(ds.map((c) => c.cn))], homNay);
  return { tu: k.tu, den: k.den, homNay, ds, so, lamMoi, nhieuCn: branchIds == null ? new Set(ds.map((c) => c.cn)).size > 1 : branchIds.length > 1 };
}

/**
 * RA-DOC-0611: `chiHocThuat` — Tổng quan GV chỉ đọc `tu`, `den`, `ketQua`, `tienBo`, `hocThuatTheoLop`: bỏ ba tập Chấm điểm đúng hạn, Ghi KQ PA
 * (`dung-han-cap-nhat` cả chi nhánh), PA hiệu quả (`paCoKetQua` cả chi nhánh) — các trường đó khi ấy là tập rỗng, người gọi không được đọc.
 */
export function chiSoHoSoGv(p: Principal, gvId: number, q: { tu?: string | null; den?: string | null }, chiHocThuat = false): ChiSoHoSoGv {
  const g = nguCanhCuaGv(p, gvId, q);
  if (!chiHocThuat) g.lamMoi();
  const so = chiHocThuat ? null : soCuaKy(g.so, gvId);
  const ghi: ({ dung: number[]; tong: number[] } | undefined)[] = [], tb: ({ dung: number[]; tong: number[] } | undefined)[] = [], pa: ({ dung: number[]; tong: number[] } | undefined)[] = [];
  const kq = new Map<string, { khung: KhungPtGv; skill: string; tap: ({ dung: number[]; tong: number[] } | undefined)[] }>();
  const theoLop: ChiSoHoSoGv['ketQuaTheoLop'] = [];
  const hang = new Map<number, { ma: string; khung: KhungPtGv; ct: string | null; khai: string | null; xong: boolean; skill: Set<string>; kq: { dung: number[]; tong: number[] }[]; tb?: { dung: number[]; tong: number[] }; luot: Map<string, string> }>();
  const thi: MucThiGv[] = [];
  const hangCua = (c: NguCanhPtGv, classId: number) => hang.get(classId)
    ?? hang.set(classId, { ma: c.lop.get(classId)!.ma, khung: c.khung, ct: c.lop.get(classId)!.ct, khai: c.lop.get(classId)!.khai, xong: c.lop.get(classId)!.xong, skill: new Set(), kq: [], luot: new Map() }).get(classId)!;
  const naps = napBaiNhieu(p, g.ds, gvId);   // GIAM-DOC-HSGV: phần nạp theo lượt / em một lượt cho mọi ngữ cảnh
  for (const [i, c] of g.ds.entries()) {
    const nap = naps[i];
    if (!chiHocThuat) ghi.push(tapGhiKetQuaPa(xemChiNhanh(c.cn), c).tap.get(gvId));
    /* Chủ SP 23/10: thi thật (IELTS thật) KHÁC phạm trù Test — kết quả / lượt chỉ tính MT, Progress, Final. Thi thật (2F): `mucThiTheoGv`, hàng lớp = lớp lúc thi. */
    const muc = mucKetQua(c, nap);
    const theoId = new Map(muc.map((m) => [m.x.id, m.x]));
    const t = tapKetQua(c, muc);
    if (c.khung === 'ft') for (const m of mucThiTheoGv(c.cn, c.tu, c.cuoi).get(gvId) ?? []) {
      thi.push(m);
      if (m.x.dong.classId != null && c.lop.has(m.x.dong.classId)) hangCua(c, m.x.dong.classId);
    }
    for (const skill of COT_KET_QUA_GV[c.khung]) {
      const khoa = `${c.khung}:${skill}`;
      (kq.get(khoa) ?? kq.set(khoa, { khung: c.khung, skill, tap: [] }).get(khoa)!).tap.push(t.get(skill)?.get(gvId));
      for (const [classId, o] of t.get(skill)?.theoLop?.get(gvId) ?? []) {
        theoLop.push({ classId, ma: c.lop.get(classId)!.ma, khung: c.khung, skill, nhan: tenMonNgan(c.lop.get(classId)!.ct, skill), o: oTuTap(true, o) });
        const h = hangCua(c, classId);
        h.skill.add(skill);
        h.kq.push(o);
        /* Lượt = một lượt Test của một HV — đếm khác nhau qua các kỹ năng GV dạy. */
        for (const id of o.tong) { const x = theoId.get(id)!; h.luot.set(`a${x.attemptId}`, x.bai); }
      }
    }
    if (c.khung === 'ft') {
      const tbc = tapTienBo(c, nap);
      tb.push(tbc.get(gvId));
      for (const [classId, o] of tbc.theoLop?.get(gvId) ?? []) hangCua(c, classId).tb = o;
      if (!chiHocThuat) pa.push(tapPaHieuQua(c).get(gvId));
    }
  }
  const coFt = g.ds.some((c) => c.khung === 'ft');
  const theoKyNang = [...kq.values()].map((x) => ({ khung: x.khung, skill: x.skill, nhan: tenMonNgan(null, x.skill), o: oTuTap(true, gopTap(...x.tap)) }))
    .filter((x) => x.o.k === 'so');
  return {
    tu: g.tu, den: g.den, homNay: g.homNay,
    /* Sổ nghĩa vụ (PR-2): 3 số riêng + S chéo chung — cùng hàm bảng Phân tích GV. */
    diemDungHan: oTuSo3(true, so?.bai.get(gvId)),
    viecDungHan: oTuSo3(true, so?.viec.get(gvId)),
    ghiKetQuaPa: oTuTap(true, gopTap(...ghi)),
    ketQua: oTuTap(true, gopTap(...[...kq.values()].flatMap((x) => x.tap))),
    ketQuaTheoKyNang: theoKyNang,
    ketQuaTheoLop: theoLop.sort((a, b) => a.ma.localeCompare(b.ma, 'vi', { numeric: true }) || COT_KET_QUA_GV[a.khung].indexOf(a.skill) - COT_KET_QUA_GV[b.khung].indexOf(b.skill)),
    tienBo: oTuTap(coFt, gopTap(...tb)),
    paHieuQua: oTuTap(coFt, gopTap(...pa)),
    /* 2F: mục = em × kỹ năng GV từng dạy; Đạt Target = Vượt + Đạt; số to `pt` = số em (V2: không trọng số). */
    thiThat: coFt ? oThiGv(thi) : { k: 'na' },
    thiThatVuot: thi.filter((m) => m.muc === 'exceed').length,
    thiThatTheoKyNang: coFt ? COT_KET_QUA_GV.ft.map((skill) => {
      const ds = thi.filter((m) => SKILL_KN[m.kn] === skill);
      return { skill, nhan: tenMonNgan(null, skill), o: oThiGv(ds), vuot: ds.filter((m) => m.muc === 'exceed').length };
    }).filter((x) => x.o.k === 'so') : [],
    hocThuatTheoLop: [...hang].map(([classId, h]) => {
      const bai = new Map<string, number>();
      for (const b of h.luot.values()) bai.set(b, (bai.get(b) ?? 0) + 1);
      return {
        classId, ma: h.ma, khung: h.khung, khai: h.khai, xong: h.xong,
        kyNang: COT_KET_QUA_GV[h.khung].filter((k) => h.skill.has(k)).map((k) => tenMonNgan(h.ct, k)),
        luot: h.luot.size, theoBai: [...bai].map(([ten, n]) => ({ bai: ten, n })).sort((a, b) => b.n - a.n || b.bai.localeCompare(a.bai, 'vi', { numeric: true })),
        ketQua: oTuTap(true, gopTap(...h.kq)), tienBo: oTuTap(h.khung === 'ft', h.tb),
        thiThat: h.khung === 'ft' ? oThiGv(thi.filter((m) => m.x.dong.classId === classId)) : { k: 'na' } as OPtGv,
      };
    }).sort((a, b) => (a.khung === b.khung ? a.ma.localeCompare(b.ma, 'vi', { numeric: true }) : a.khung === 'ft' ? -1 : 1)),
  };
}

/** Panel chỉ đọc của một số ở hồ sơ GV theo kỳ — CÙNG `oChiSoCua` qua mọi ngữ cảnh của `chiSoHoSoGv` (số = số dòng). `cot` thêm `ket-qua:<khung>:<kỹ năng>[:<lớp>]`. */
export function oChiSoHoSoGv(p: Principal, gvId: number, q: { tu?: string | null; den?: string | null; cot: string; loc?: string | null; /** 6C-NHO: Phân tích GV — chỉ chi nhánh đang chọn. */ cn?: number | null }): { n: number; tieuDe: string; rows: MetricRow[] } {
  if (q.loc != null && q.loc !== 'dat' && q.loc !== 'chua' && q.loc !== 'vuot') throw badRequest('Lọc phải là "dat", "chua" hoặc "vuot".');
  const r = oChiSoHoSoGvDu(p, gvId, q);
  /*
   * G5-06 (chủ SP 13/11, thay luật gộp 23/10): panel liệt kê ĐÚNG tập của ô — một dòng một lượt × kỹ năng GV dạy (`cua` chỉ nhấn kỹ năng của dòng), số dòng = mẫu ô,
   * tab Đạt / Chưa đạt = tử / (mẫu − tử).
   */
  /* UI-HO-SO-GV: bấm "Đạt" / "Chưa đạt" → chỉ dòng có kết luận đó (cùng tập). */
  const rows = r.rows.filter((x) => !q.loc || (q.loc === 'vuot' ? x.vuot : x.ketQua === q.loc));
  /* PT-PANEL (PR-1): Tổng quan "HV tiến bộ" + ô Tiến bộ Lớp tôi dạy → panel Trước → Sau (giữ tab Chưa đạt · Đạt). */
  const tienBo = q.cot === 'tien-bo' || q.cot.startsWith('tien-bo-lop:');
  /* DEM-QUA-HAN b: Việc đúng hạn / Điểm đúng hạn — cùng panel dòng việc (`viec`) như Phân tích GV. */
  const viec = q.cot === 'viec-dung-han' || q.cot === 'cham-diem';
  return { n: rows.length, tieuDe: r.tieuDe, rows, ...(tienBo ? kieuBang(rows, CACH_TINH_GV['tien-bo']) : viec ? kieuBang(rows, CACH_TINH_GV[q.cot]) : {}) };
}

function oChiSoHoSoGvDu(p: Principal, gvId: number, q: { tu?: string | null; den?: string | null; cot: string; cn?: number | null }): { n: number; tieuDe: string; rows: MetricRow[] } {
  const g = nguCanhCuaGv(p, gvId, q);
  const kyChu = `${tuanLichNgan(g.tu)} – ${tuanLichNgan(g.den)}`;
  if (q.cot === 'cham-diem' || q.cot === 'viec-dung-han') {
    /* Sổ nghĩa vụ (PR-2): dòng sổ của GV — một lần qua mọi chi nhánh (6C-NHO `cn`: chỉ chi nhánh đang chọn); nhiều chi nhánh → mỗi dòng ghi chi nhánh. */
    const ph = g.so.cn as readonly number[] | null;
    if (q.cn && ph && !ph.includes(q.cn)) throw forbidden('Chi nhánh này nằm ngoài phạm vi bạn được xem.');
    g.lamMoi();
    const r = oSoCua(q.cn ? { ...g.so, cn: q.cn } : g.so, gvId, q.cot, !q.cn && g.nhieuCn);
    return { n: r.dong.length, tieuDe: tieuDeChiSo(r.nhan, kyChu, r.dung, r.tong, r.donVi), rows: r.dong.map((d) => d.row) };
  }
  /*
   * 2F: `thi-that[-lop:<lớp>|-ky:<kỹ năng>]` — một dòng một MỤC (em × kỹ năng GV dạy, W1 / W2 riêng), CHÍNH `mucThiTheoGv` của ô. Fail trước.
   * `loc` (ở `oChiSoHoSoGv`): dat = Exceed + Đạt (Pass) · chua = Fail · vuot = Exceed.
   */
  const mt = /^thi-that(?:-lop:(\d+)|-ky:(\w+))?$/.exec(q.cot);
  if (mt) {
    const ds = g.ds.filter((x) => x.khung === 'ft' && (!q.cn || x.cn === q.cn)).flatMap((c) => mucThiTheoGv(c.cn, c.tu, c.cuoi).get(gvId) ?? [])
      .filter((m) => (!mt[1] || m.x.dong.classId === Number(mt[1])) && (!mt[2] || SKILL_KN[m.kn] === mt[2]))
      .sort((a, b) => Number(a.muc !== 'fail') - Number(b.muc !== 'fail') || (a.x.dong.ngayThi ?? '').localeCompare(b.x.dong.ngayThi ?? '') || a.x.dong.ten.localeCompare(b.x.dong.ten, 'vi') || KN_DAY.indexOf(a.kn) - KN_DAY.indexOf(b.kn));
    const rows: MetricRow[] = ds.map((m, i) => {
      const { dong: x, kq } = m.x;
      const ngay = x.ngayThi ? `${x.ngayThi.slice(8, 10)}/${x.ngayThi.slice(5, 7)}` : '';
      const kn = KN_NGAN[m.kn];
      const soVoi = kq.target !== null ? { nhan: 'Target' as const, v: kq.target } : null;
      return {
        ketQua: m.muc === 'fail' ? 'chua' : 'dat', vuot: m.muc === 'exceed', ngCanh: `${t('Thi thật')} ${ngay} · ${kn}`, ngayThiThat: ngay, soVoi,
        diemHv: { luot: t('Thi thật'), tuan: x.ngayThi ?? '', tam: false, overall: kq.ovr, soVoi,
          kn: (['l', 'r', 'w', 's'] as const).map((k) => ({ k: k.toUpperCase(), v: kq[k], dat: kq[k] === null || kq.target === null ? null : kq[k]! >= kq.target, cua: k === m.kn[0] })), thiThat: { cycleId: x.cycleId, ten: x.ten } },
        /* một em có thể có nhiều mục (nhiều kỹ năng, hai lần thi) — id theo dòng */ id: i + 1, title: x.ten, href: `/hoc-vien/${x.studentId}`, lop: x.lop,
        sub: [x.lop, `${t('Thi thật')} ${ngay}`, `${kn} ${m.band.toFixed(1)}`, soVoi ? `Target ${soVoi.v.toFixed(1)}` : null,
          NHAN_MUC_THI[m.muc]].filter(Boolean).join(' · '),   // V2: bỏ trọng số tuần dạy
      };
    });
    const nhan = mt[2] ? `${t('Kết quả thi thật')} ${tenMonNgan(null, mt[2])}` : t('Kết quả thi thật');
    return { n: rows.length, tieuDe: t('{nhan} · {ai} · {dung}/{tong} lượt kỹ năng', { nhan, ai: kyChu, dung: ds.filter((m) => m.muc !== 'fail').length, tong: ds.length }), rows };
  }
  const m = /^ket-qua:(ft|thuong):(\w+)(?::(\d+))?$/.exec(q.cot);
  /* UI-HO-SO-GV: `ket-qua-lop:<lớp>` · `tien-bo-lop:<lớp>` = ô một hàng bảng Học thuật (`hocThuatTheoLop`) — mọi kỹ năng GV dạy ở lớp đó. */
  const ml = /^(ket-qua|tien-bo)-lop:(\d+)$/.exec(q.cot);
  if (!m && !ml && !['ghi-pa', 'ket-qua', 'tien-bo', 'pa-hieu-qua'].includes(q.cot)) throw badRequest(`Cột "${q.cot}" không có ở hồ sơ.`);
  const lopId = m?.[3] ? Number(m[3]) : ml ? Number(ml[2]) : null;
  const ds = g.ds.filter((c) => (m ? c.khung === m[1] : lopId !== null ? c.lop.has(lopId) : ['tien-bo', 'pa-hieu-qua'].includes(q.cot) ? c.khung === 'ft' : true));
  const phan = ds.map((c) => oChiSoCua(p, c, gvId, m ? `ket-qua:${m[2]}` : ml ? ml[1] : q.cot, xemChiNhanh(c.cn)));
  /* P8: `ket-qua:<khung>:<kỹ năng>:<lớp>` = ô một lớp của `ketQuaTheoLop` — dòng của chính các mục em học lớp đó lúc thi. */
  const maLop = lopId !== null ? ds.find((c) => c.lop.has(lopId))?.lop.get(lopId)?.ma : null;
  if (lopId !== null && !maLop) throw badRequest('Lớp này không có trong kỳ của giáo viên.');
  const dong = phan.flatMap((x) => x.dong).filter((d) => !maLop || d.row.lop === maLop).sort((a, b) => Number(a.dung) - Number(b.dung));
  /* TEN-CHI-SO: panel hồ sơ GV và Phân tích GV cùng tên "Đạt kỳ vọng Test" · đơn vị "lượt Test" (THUAT_NGU HSGV-1, 6) — đặt ở `oChiSoCua`. */
  const dau = phan[0] ?? { nhan: t('Đạt kỳ vọng Test'), donVi: '' };
  const dung = dong.filter((d) => d.dung).length;
  return { n: dong.length, tieuDe: tieuDeChiSo(dau.nhan, `${tuanLichNgan(g.tu)} – ${tuanLichNgan(g.den)}`, dung, dong.length, dau.donVi), rows: dong.map((d) => d.row) };
}
