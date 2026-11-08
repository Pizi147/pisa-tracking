/**
 * SỔ NGHĨA VỤ (chủ SP 09/11 — spec `docs/superpowers/specs/2026-11-09-so-nghia-vu-design.md`, plan `docs/superpowers/plans/2026-11-09-so-nghia-vu.md`).
 * Mỗi bài phải chấm / việc có hạn = một dòng `nghia_vu`. Tệp này TÍNH dòng từ dữ liệu gốc bằng chính hàm luật đang có (`skillCells`,
 * `regularSkillViews`, `mocTreNhapDiem`, `kyNangPhuTrach`, `luatBai.ts`) rồi ghi sổ (`ghiSo`). Trạng thái (Đúng hạn / Làm muộn / Chưa làm) tính lúc đọc.
 */
import { DS_JSON, db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { loadBundle, regularSkillViews, skillCells } from '../fasttrack/attempts.ts';
import { scoringModeOf } from '../fasttrack/skillSchedule.ts';
import { allProgrammes } from '../normal/regular.ts';
import { mocTreNhapDiem } from '../platform/week.ts';
import { khoangTamDung } from '../students/tamDung.ts';
import type { Principal } from '../permissions.ts';
import { boMonLich, boMonTheoLuot, daGhiLuot, kyNangPhuTrach, laChamCheo } from '../../../shared/domain/index.ts';
import { dangHocLuc, lopLucThi, nguoiPcLuc, nguoiPcSau, type DongPc, type GhiDanh } from './luatBai.ts';

/** Một dòng sổ (chưa có trạng thái — trạng thái so `han` với hôm nay lúc đọc). */
export type DongNv = {
  loai: 'bai' | 'viec'; kieu: string; khoa: string; chiNhanh: number; lop: number | null; hocVien: number | null;
  /** Người chịu trách nhiệm (spec 1.2); null = chưa phân công, hoặc S chéo chưa ai nhận (`sCheo`). */
  nguoi: number | null; sCheo: boolean;
  /** Phân công lấy từ dòng hiệu lực SAU hạn (phân công nhập muộn — spec 1.2 a). */
  pcNhapSau: boolean;
  /** Hạn hiện tại (bài: mốc trễ `mocTreNhapDiem`); null = ô không còn hạn (huỷ, MT lịch sử). */
  han: string | null;
  /** Bài: Thứ Hai tuần thi (mốc W4 OCT xét theo tuần thi — spec 1.6); việc: null. */
  tuan: string | null;
  xongLuc: string | null; nguoiLam: number | null;
  /** Mã lý do không tính (spec 1.4): vang · dau-tru · huy · cho-doi · lich-su · nghi-truoc-han · nguoi-ngoai · khong-ghi-nguoi-cham. */
  khongTinh: string | null;
};

export const khoaBai = (attemptId: number, skill: string) => `bai:${attemptId}:${skill}`;

/** Người xem "hệ thống" cho `skillCells` (chỉ cần tiến độ / hạn / dấu "-", không cần quyền sửa ô). */
const HE_THONG: Principal = { userId: 0, code: '', fullName: '', title: null, roleKeys: [], assignments: [], grants: [] };

const KHONG_TINH_TIEN_DO: Record<string, string> = { cancelled: 'huy', lich_su: 'lich-su', absent: 'vang', reschedule_pending: 'cho-doi' };

/** Mọi ô BẮT BUỘC có tuần thi của một lượt (spec 1.1 · 1.2 · 1.4). */
export function tinhBai(attemptId: number): DongNv[] {
  return tinhBaiNhieu([attemptId]).get(attemptId) ?? [];
}

/** Như `tinhBai` cho nhiều lượt — nạp theo lô (lượt, điểm, lịch, ghi danh, tạm dừng, phân công, lớp): số câu không theo số lượt. */
export function tinhBaiNhieu(ids: readonly number[]): Map<number, DongNv[]> {
  const out = new Map<number, DongNv[]>();
  if (!ids.length) return out;
  const conn = db();
  const rows = conn.prepare(
    `SELECT a.*, pg.scoring_mode, cl.programme_code, rp.week_start AS period_start, rp.week_end AS period_end, rp.code AS period_code,
            (SELECT cy.route FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS route,
            s.status AS hv_status, s.finished_at AS hv_finished, s.archived_at AS hv_archived
       FROM assessment_attempts a JOIN classes cl ON cl.id = a.class_id JOIN students s ON s.id = a.student_id
       LEFT JOIN programmes pg ON pg.code = cl.programme_code LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
      WHERE a.id IN (${DS_JSON})`,
  ).all(JSON.stringify(ids)) as any[];
  if (!rows.length) return out;
  const today = demoToday();
  const bundle = loadBundle(rows.map((r) => r.id as number), { boCase: true });
  const programmes = allProgrammes();
  const sids = [...new Set(rows.map((r) => r.student_id as number))];
  const ghiDanh = new Map<number, GhiDanh[]>();
  for (const e of conn.prepare(`SELECT student_id, class_id, substr(started_at, 1, 10) AS tu, substr(ended_at, 1, 10) AS den FROM enrollments WHERE student_id IN (${DS_JSON})`)
    .all(JSON.stringify(sids)) as any[]) (ghiDanh.get(e.student_id) ?? ghiDanh.set(e.student_id, []).get(e.student_id)!).push({ lop: e.class_id, tu: e.tu, den: e.den });
  const lopCo = [...new Set([...rows.map((r) => r.class_id as number), ...[...ghiDanh.values()].flat().map((g) => g.lop)])];
  const lop = new Map<number, { cn: number; ct: string | null }>();
  for (const c of conn.prepare(`SELECT id, branch_id, programme_code FROM classes WHERE id IN (${DS_JSON})`).all(JSON.stringify(lopCo)) as any[]) {
    lop.set(c.id, { cn: c.branch_id, ct: c.programme_code ?? null });
  }
  /* Phân công theo ô `lớp|kỹ năng` — chỉ kỹ năng (GVCN không giữ bài). Cả dòng đã kết thúc: gán người theo ngày. */
  const pc = new Map<string, DongPc[]>();
  for (const a of conn.prepare(`SELECT id, user_id, class_id, skill, effective_from, effective_to FROM teacher_assignments
      WHERE class_id IN (${DS_JSON}) AND status IN ('active', 'ended') AND skill IS NOT NULL`).all(JSON.stringify(lopCo)) as any[]) {
    const k = `${a.class_id}|${a.skill}`;
    (pc.get(k) ?? pc.set(k, []).get(k)!).push({ id: a.id, gv: a.user_id, tu: a.effective_from, den: a.effective_to ?? null });
  }
  const tamDung = khoangTamDung(sids);
  for (const a of rows) {
    const scores = bundle.scores.get(a.id) ?? [];
    const skillRows = bundle.skillRows.get(a.id);
    const o: { skill: string; weekStart: string | null; deadline: string | null; progress: string; noShow: boolean }[] = [];
    if (scoringModeOf(a) === 'ratio') {
      const bo = boMonTheoLuot(boMonLich(a.programme_code, programmes.get(a.programme_code)?.skills), daGhiLuot(skillRows, scores));
      const views = regularSkillViews(a, skillRows, scores, today, bo);
      for (const skill of bo) { const v = views.get(skill); if (v?.required) o.push({ skill, weekStart: v.weekStart, deadline: v.deadline, progress: v.progress, noShow: false }); }
    } else {
      for (const x of skillCells(HE_THONG, a, scores, bundle.skips.get(a.id) ?? [], today, skillRows)) {
        if (x.required) o.push({ skill: x.skill, weekStart: x.weekStart, deadline: x.deadline, progress: x.progress, noShow: x.noShow !== null });
      }
    }
    const ds: DongNv[] = [];
    for (const x of o) {
      if (!x.weekStart) continue;   // chưa xếp tuần: chưa là nghĩa vụ
      const tuan = x.weekStart.slice(0, 10);
      const l = lopLucThi(ghiDanh.get(a.student_id) ?? [], tuan, a.class_id);
      const li = lop.get(l) ?? lop.get(a.class_id)!;
      const row = scores.find((s: any) => s.skill === x.skill) as any;
      const xongLuc = row?.nhap_dau_ngay ?? null;
      const cheo = laChamCheo(a.kind, x.skill);
      const ngayPc = x.deadline ?? tuan;
      let nguoi: number | null = null, pcNhapSau = false;
      if (cheo) nguoi = xongLuc ? row?.examiner_user_id ?? null : null;
      else {
        const ks = kyNangPhuTrach(li.ct, x.skill);
        nguoi = ks.map((k) => nguoiPcLuc(pc.get(`${l}|${k}`) ?? [], ngayPc)).find((g) => g != null) ?? null;
        if (nguoi == null) {
          nguoi = ks.map((k) => nguoiPcSau(pc.get(`${l}|${k}`) ?? [], ngayPc)).find((g) => g != null) ?? null;
          pcNhapSau = nguoi != null;
        }
      }
      const khongTinh = a.status === 'cancelled' ? 'huy'
        : KHONG_TINH_TIEN_DO[x.progress] ?? (x.noShow ? 'dau-tru'
          : !dangHocLuc(a, tamDung[a.student_id] ?? [], ngayPc) ? 'nghi-truoc-han'
          : cheo && xongLuc && nguoi == null ? (row?.examiner_name ? 'nguoi-ngoai' : 'khong-ghi-nguoi-cham') : null);
      ds.push({
        loai: 'bai', kieu: x.skill, khoa: khoaBai(a.id, x.skill), chiNhanh: li.cn, lop: l, hocVien: a.student_id, nguoi, sCheo: cheo, pcNhapSau,
        han: x.deadline ? mocTreNhapDiem(x.deadline, tuan) : null, tuan, xongLuc, nguoiLam: row?.entered_by ?? null, khongTinh,
      });
    }
    out.set(a.id, ds);
  }
  return out;
}
