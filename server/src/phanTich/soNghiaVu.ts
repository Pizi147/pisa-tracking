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

// ------------------------------------------------------------------ ghi sổ

const COT = ['loai', 'kieu', 'khoa', 'chi_nhanh', 'lop', 'hoc_vien', 'nguoi', 's_cheo', 'pc_nhap_sau', 'han_goc', 'han', 'tuan', 'xong_luc', 'nguoi_lam', 'khong_tinh'] as const;
/* Upsert theo `khoa`: `han_goc` giữ lần đầu (spec 1.5); chỉ ghi khi có cột đổi (đỡ ghi Turso, `cap_nhat` = lần đổi cuối). */
const UPSERT = `INSERT INTO nghia_vu (${COT.join(', ')}, cap_nhat) VALUES (${COT.map(() => '?').join(', ')}, ?)
  ON CONFLICT (khoa) DO UPDATE SET ${COT.filter((c) => c !== 'khoa' && c !== 'han_goc').map((c) => `${c} = excluded.${c}`).join(', ')},
    han_goc = COALESCE(nghia_vu.han_goc, excluded.han_goc), cap_nhat = excluded.cap_nhat
  WHERE ${COT.filter((c) => c !== 'khoa' && c !== 'han_goc').map((c) => `nghia_vu.${c} IS NOT excluded.${c}`).join(' OR ')}
    OR (nghia_vu.han_goc IS NULL AND excluded.han_goc IS NOT NULL)`;

function upsert(d: DongNv, luc: string): void {
  db().prepare(UPSERT).run(d.loai, d.kieu, d.khoa, d.chiNhanh, d.lop, d.hocVien, d.nguoi, d.sCheo ? 1 : 0, d.pcNhapSau ? 1 : 0, d.han, d.han, d.tuan,
    d.xongLuc, d.nguoiLam, d.khongTinh, luc);
}

/**
 * Ghi sổ KHÔNG BAO GIỜ làm hỏng thao tác của người dùng (nhập điểm, đổi lịch…): lỗi tính / ghi sổ chỉ ghi log — đối chiếu đêm (`doiChieuSo`) sửa lại.
 * Trong phép kiểm (`PISA_SO_NEM=1`) thì ném để thấy lỗi.
 */
function anToan(ten: string, fn: () => void): void {
  try { fn(); } catch (e) {
    if (process.env.PISA_SO_NEM) throw e;
    console.error(`[nghia_vu] ${ten} lỗi:`, (e as Error)?.message ?? e);
  }
}

/** Tính lại + ghi mọi ô của các lượt; ô không còn (lượt xoá, ô thôi bắt buộc / chưa xếp tuần) → giữ dòng, `khong_tinh = 'da-xoa'`. */
export function ghiSoLuot(ids: readonly (number | null | undefined)[]): void {
  const ds = [...new Set(ids.filter((x): x is number => typeof x === 'number'))];
  if (!ds.length) return;
  anToan('ghiSoLuot', () => {
    const luc = new Date().toISOString();
    const moi = tinhBaiNhieu(ds);
    const co = new Set<string>();
    for (const rows of moi.values()) for (const d of rows) { upsert(d, luc); co.add(d.khoa); }
    for (const r of db().prepare(`SELECT n.khoa FROM json_each(?) j JOIN nghia_vu n ON n.khoa >= 'bai:' || j.value || ':' AND n.khoa < 'bai:' || j.value || ';'
        WHERE n.khong_tinh IS NOT 'da-xoa'`).all(JSON.stringify(ds)) as any[]) {
      if (!co.has(r.khoa)) db().prepare(`UPDATE nghia_vu SET khong_tinh = 'da-xoa', cap_nhat = ? WHERE khoa = ?`).run(luc, r.khoa);
    }
  });
}

/** Một khoá sổ (`bai:<lượt>:<kỹ năng>`; việc: Task 4). */
export function ghiSo(khoa: string): void {
  const m = /^bai:(\d+):/.exec(khoa);
  if (m) ghiSoLuot([Number(m[1])]);
}

/**
 * Đổi phân công / mốc lớp: mọi lượt của lớp + của em từng ghi danh lớp (lớp lúc thi có thể là lớp này). Ghi lại MỌI dòng, không chỉ từ `tuNgay`:
 * phân công mới cũng lấp người cho ô cũ chưa có phân công (spec 1.2 a, `pcNhapSau`). Upsert chỉ ghi dòng đổi.
 */
export function ghiSoTheoLop(lop: number, _tuNgay?: string): void {
  anToan('ghiSoTheoLop', () => ghiSoLuot((db().prepare(`SELECT a.id FROM assessment_attempts a WHERE a.class_id = ?
      UNION SELECT a.id FROM assessment_attempts a JOIN enrollments e ON e.student_id = a.student_id WHERE e.class_id = ?`).all(lop, lop) as any[]).map((r) => r.id)));
}

/** Đổi trạng thái em (Tạm dừng, Kết thúc, Lưu trữ, Quay lại học…): mọi lượt của em. */
export function ghiSoHocVien(sids: readonly number[]): void {
  if (!sids.length) return;
  anToan('ghiSoHocVien', () => ghiSoLuot((db().prepare(`SELECT id FROM assessment_attempts WHERE student_id IN (SELECT value FROM json_each(?))`)
    .all(JSON.stringify([...new Set(sids)])) as any[]).map((r) => r.id)));
}
