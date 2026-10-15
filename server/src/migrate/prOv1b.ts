/**
 * PR-OV1b: DỌN DẤU "-" CŨ THEO LUẬT MỚI (đặc tả OV 3.3) — ĐỔI DỮ LIỆU, chạy lặp được (lần hai không còn ô nào khớp). Chạy cùng lần deploy cuối OV.
 * Chỉ Mock Test (kind `mock`), lượt chưa huỷ, ô "-" chưa có điểm, chưa là "Không dự thi" (`no_show_cu = 0`). Mỗi buổi (lượt × kỹ năng đánh giá):
 *
 *   A. MT cũ (`lich_su`)                         → "Không dự thi".
 *   B. "-" NHẬP BÙ sau tuần thi (`no_show_late`):
 *        chưa chốt (ca Phượng: ô `sat` không điểm) → "Không dự thi".
 *        đã chốt theo luật cũ (vắng + máy dời / chờ QL / huỷ) → "Không dự thi"; lần vắng do chính dấu đó sinh ra −1; chưa ai quyết định gì
 *        sau lần chốt thì bài về tuần có "-", `scheduled`; đã có quyết định của người (ca Thảo: dời cả lượt về tuần cũ) thì giữ lịch.
 *        Đề nghị dời đang chờ của buổi rút. Lịch không dời thêm.
 *        OV-1e → OV-11e: bài ĐÃ CÓ LỊCH THI LẠI (đang xếp ở tuần khác tuần "-", còn `scheduled` / `sat`) → bỏ qua, không đổi gì (giữ "-",
 *        lần vắng, lịch thi lại) — KHÔNG theo ngày: tuần thi lại đã qua (đã thi chờ chấm / chưa nhập = nợ chấm thường) cũng giữ (`giuLichThiLai`).
 *   C. "-" TRONG TUẦN chưa chốt (luật cũ chờ hết Chủ nhật), đủ mọi ô của buổi, đúng tuần đang xếp → chốt MỘT lần theo luật mới
 *      (`settleGroup`: lần 1 dời tuần sau, lần 2 huỷ phần thi). Buổi Writing mới một task "-" giữ nguyên (đã là "xong" ở ô, không quá hạn).
 *
 * In từng ô đổi: em · mã · lớp · lượt · ô · trước → sau. `kiemTruocOv1b` = CÙNG danh sách mà KHÔNG ghi gì (lệnh `kiem-truoc-ov1b`,
 * chủ SP chạy trên bản chính trước deploy) — cột "sau" của buổi C ở bản chỉ đọc ghi luật, bản ghi thật ghi tuần cụ thể.
 */
import { nowIso } from '../util.ts';
import { tuanLich } from '../../../shared/domain/index.ts';
import { rutDeNghiDoi, sauLanChot, settleGroup } from '../fasttrack/absence.ts';
import { ensureSkillRows, recomputeCompletionWeek, logSchedule } from '../fasttrack/skillSchedule.ts';
import { assessedSkillOf, entrySkillsOf } from '../fasttrack/scoring.ts';
import { demoToday } from '../demoConfig.ts';
import type { AssessedSkill } from '../../../shared/domain/index.ts';

export type DongDoiOv1b = { attemptId: number; o: string; hocVien: string; ma: string; lop: string; luot: string; truoc: string; sau: string };

type Buoi = {
  loai: 'A' | 'B-chua' | 'B-da' | 'B-giu' | 'C';
  attemptId: number; assessed: string; kId: number; plannedPeriodId: number | null; weekEnd: string | null; tuanLich: string;
  sit: string; lan: number; dau: any[]; ten: { hocVien: string; ma: string; lop: string; luot: string };
  daCong?: boolean; giuLich?: boolean;
};

/**
 * OV-1e, OV-11e (đặc tả rà soát 14/10 — bền khi deploy muộn): "-" nhập bù đã chốt mà máy đã dời bài sang TUẦN KHÁC tuần "-" (có lịch thi lại), còn
 * `scheduled` / `sat` (chưa huỷ / chưa chờ QL) → migrate không đụng, BẤT KỂ hôm nay (tuần thi lại đã qua vẫn giữ). Một điều kiện cho migrate và
 * `kiemTruocOv1b`.
 */
export function giuLichThiLai(ky: { planned_period_id: number | null; sit_status: string }, dauPeriodId: number | null): boolean {
  return !!ky.planned_period_id && ky.planned_period_id !== dauPeriodId && (ky.sit_status === 'scheduled' || ky.sit_status === 'sat');
}

/** Đọc mọi buổi cần dọn — CHỈ `SELECT`. */
function lapKeHoach(conn: any): Buoi[] {
  const rows = conn.prepare(
    `SELECT s.id, s.attempt_id, s.skill, s.no_show_period_id, s.no_show_late, s.no_show_settled_at, rp.code AS tuan_tru, rp.week_start AS tru_start,
            a.attempt_no, a.lich_su, st.full_name, st.student_code, c.code AS lop
       FROM assessment_scores s
       JOIN assessment_attempts a ON a.id = s.attempt_id AND a.status != 'cancelled' AND a.kind = 'mock'
       JOIN students st ON st.id = a.student_id
       LEFT JOIN classes c ON c.id = a.class_id
       LEFT JOIN report_periods rp ON rp.id = s.no_show_period_id
      WHERE s.no_show_period_id IS NOT NULL AND s.no_show_cu = 0 AND s.band IS NULL AND s.raw_score IS NULL
      ORDER BY s.attempt_id, s.id`,
  ).all() as any[];
  const theoBuoi = new Map<string, any[]>();
  for (const r of rows) {
    const k = `${r.attempt_id}:${assessedSkillOf(r.skill)}`;
    (theoBuoi.get(k) ?? theoBuoi.set(k, []).get(k)!).push(r);
  }
  const ra: Buoi[] = [];
  for (const [k, dau] of theoBuoi) {
    const [aid, assessed] = k.split(':');
    const attemptId = Number(aid);
    const ky = conn.prepare(
      `SELECT k.*, p.code AS tuan, p.week_start AS ws, p.week_end AS we FROM attempt_skills k LEFT JOIN report_periods p ON p.id = k.planned_period_id
        WHERE k.attempt_id = ? AND k.skill = ?`,
    ).get(attemptId, assessed) as any;
    if (!ky) continue;
    const d0 = dau[0];
    const chung = {
      attemptId, assessed, kId: ky.id, plannedPeriodId: ky.planned_period_id, weekEnd: ky.we ?? null, tuanLich: ky.ws ? tuanLich(ky.ws) : '—',
      sit: ky.sit_status, lan: ky.absence_move_count ?? 0, dau,
      ten: { hocVien: d0.full_name, ma: d0.student_code, lop: d0.lop ?? '—', luot: `MT${d0.attempt_no}${d0.lich_su ? ' ·LS' : ''}` },
    };
    if (d0.lich_su) { ra.push({ ...chung, loai: 'A' }); continue; }
    if (dau.some((d) => d.no_show_late)) {
      const daChot = dau.some((d) => d.no_show_settled_at);
      ra.push(!daChot ? { ...chung, loai: 'B-chua' } : giuLichThiLai(ky, d0.no_show_period_id) ? { ...chung, loai: 'B-giu' }
        : { ...chung, loai: 'B-da', ...sauLanChot(conn, attemptId, assessed) });
      continue;
    }
    /* C: "-" trong tuần chưa chốt — chỉ khi đủ mọi ô của buổi, đúng tuần đang xếp, buổi còn ngồi thi. */
    const conDau = dau.filter((d) => !d.no_show_settled_at && d.no_show_period_id === ky.planned_period_id);
    const du = entrySkillsOf(assessed as AssessedSkill).every((o) => conDau.some((d) => d.skill === o));
    if (du && (ky.sit_status === 'scheduled' || ky.sit_status === 'sat')) ra.push({ ...chung, dau: conDau, loai: 'C' });
  }
  return ra;
}

const truocCua = (b: Buoi, d: any) =>
  `"-" ${d.tru_start ? tuanLich(d.tru_start) : d.tuan_tru ?? '?'} · ${d.no_show_settled_at ? 'đã chốt' : 'chưa chốt'}${d.no_show_late ? ' · nhập bù' : ''}`
  + ` · ${b.sit} ${b.tuanLich} · vắng ${b.lan}`;

function sauDuKien(b: Buoi): string {
  if (b.loai === 'A' || b.loai === 'B-chua') return 'Không dự thi';
  if (b.loai === 'B-giu') return `giữ lịch thi lại ${b.tuanLich}`;
  const lan = Math.max(0, b.lan - (b.daCong ? 1 : 0));
  if (b.loai === 'B-da') return `Không dự thi · ${b.giuLich ? `giữ lịch ${b.tuanLich}` : `về ${b.dau[0].tru_start ? tuanLich(b.dau[0].tru_start) : '?'}`} · vắng ${lan}`;
  return b.lan + 1 >= 2 ? `Vắng lần ${b.lan + 1} · huỷ phần thi` : 'Vắng lần 1 · dời tuần sau';
}

const dongCua = (b: Buoi, sau: (d: any) => string): DongDoiOv1b[] =>
  b.dau.map((d) => ({ attemptId: b.attemptId, o: d.skill as string, ...b.ten, truoc: truocCua(b, d), sau: sau(d) }));

/** LỆNH CHỈ ĐỌC `kiem-truoc-ov1b`: danh sách ô migrate sẽ đổi — không ghi câu nào. */
export function kiemTruocOv1b(conn: any): DongDoiOv1b[] {
  return lapKeHoach(conn).flatMap((b) => dongCua(b, () => sauDuKien(b)));
}

/** Ghi "Không dự thi" cho các ô "-" của buổi. */
function ghiKhongDuThi(conn: any, dau: any[]) {
  const now = nowIso();
  for (const d of dau) {
    conn.prepare('UPDATE assessment_scores SET no_show_cu = 1, no_show_settled_at = COALESCE(no_show_settled_at, ?) WHERE id = ?').run(now, d.id);
  }
}

export function migratePrOv1b(conn: any, applied: string[], today: string = demoToday()): DongDoiOv1b[] {
  const ra: DongDoiOv1b[] = [];
  const giu: DongDoiOv1b[] = [];
  for (const b of lapKeHoach(conn)) {
    if (b.loai === 'B-giu') {
      giu.push(...dongCua(b, () => sauDuKien(b)));
      continue;
    }
    if (b.loai === 'A' || b.loai === 'B-chua') {
      ghiKhongDuThi(conn, b.dau);
      ra.push(...dongCua(b, () => 'Không dự thi'));
      continue;
    }
    if (b.loai === 'B-da') {
      const lan = Math.max(0, b.lan - (b.daCong ? 1 : 0));
      if (b.giuLich) {
        conn.prepare('UPDATE attempt_skills SET absence_move_count = ?, absent_from_no_show = 0, updated_at = ? WHERE id = ?').run(lan, nowIso(), b.kId);
      } else {
        conn.prepare(
          `UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', sit_note = NULL, absent_from_no_show = 0, huy_vang = 0,
                  absence_move_count = ?, updated_at = ? WHERE id = ?`,
        ).run(b.dau[0].no_show_period_id, lan, nowIso(), b.kId);
      }
      rutDeNghiDoi(b.attemptId, b.assessed);
      ghiKhongDuThi(conn, b.dau);
      logSchedule(b.attemptId, {
        action: 'skill_absence_undone', field: b.assessed, oldValue: b.tuanLich, newValue: null,
        reason: 'OV-1b: "-" nhập bù = Không dự thi (luật mới) — gỡ lần vắng do dấu này', actor: null,
      });
      recomputeCompletionWeek(b.attemptId, null);
      ra.push(...dongCua(b, () => sauDuKien(b)));
      continue;
    }
    /* C: chốt một lần theo luật mới — cùng hàm với gõ "-" trong tuần. */
    settleGroup(conn, b.attemptId, b.kId, b.assessed, b.weekEnd ?? '', b.tuanLich, b.dau.map((d) => d.id), null,
      'Vắng — dấu "-" trong tuần thi (dọn OV-1b)', today);
    const sau = ensureSkillRows(b.attemptId).find((r) => r.skill === b.assessed)!;
    const chu = sau.sit_status === 'cancelled' ? `Vắng lần ${sau.absence_move_count + 1} · huỷ phần thi`
      : sau.sit_status === 'absent' ? 'Vắng · chờ Quản lý xếp lại'
      : `Vắng lần ${sau.absence_move_count} · dời ${sau.week_start ? tuanLich(sau.week_start) : '?'}`;
    ra.push(...dongCua(b, () => chu));
  }
  const inDong = (d: DongDoiOv1b) => applied.push(`  ${d.hocVien} · ${d.ma} · ${d.lop} · ${d.luot} · ${d.o}: ${d.truoc} → ${d.sau}`);
  if (ra.length) {
    applied.push(`PR-OV1b: ${ra.length} ô "-" dọn theo luật mới (Không dự thi / vắng chốt ngay):`);
    ra.forEach(inDong);
  }
  if (giu.length) {
    applied.push(`PR-OV1b: ${giu.length} ô "-" em đang chờ thi lại — không đổi:`);
    giu.forEach(inDong);
  }
  return [...ra, ...giu];
}

export const KHOA_PR_OV1B = 'pr_ov1b_da_chay';
/**
 * HOTFIX-3: `migratePrOv1b` không chạy nữa (trước đây chạy MỌI lần migrate — deploy 15/10 gom nhầm "ca trộn": buổi có "-" cũ nhập bù + "-" mới
 * trong tuần thi lại bị xếp loại B, "-" mới thành Không dự thi). Như `khoaPrOv1c`: chỉ ghi khoá, không đổi dữ liệu (DB cũ lẫn DB mới).
 */
export function khoaPrOv1b(conn: any, _applied: string[]) {
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_OV1B)) return;
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_OV1B, nowIso(), nowIso());
}
