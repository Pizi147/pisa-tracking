/**
 * SỔ NGHĨA VỤ (chủ SP 09/11 — spec `docs/superpowers/specs/2026-11-09-so-nghia-vu-design.md`, plan `docs/superpowers/plans/2026-11-09-so-nghia-vu.md`).
 * Mỗi bài phải chấm / việc có hạn = một dòng `nghia_vu`. Tệp này TÍNH dòng từ dữ liệu gốc bằng chính hàm luật đang có (`skillCells`,
 * `regularSkillViews`, `mocTreNhapDiem`, `kyNangPhuTrach`, `luatBai.ts`) rồi ghi sổ (`ghiSo`). Trạng thái (Đúng hạn / Làm muộn / Chưa làm) tính lúc đọc.
 */
import { DS_JSON, db, henTruocCommit } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { loadBundle, regularSkillViews, skillCells } from '../fasttrack/attempts.ts';
import { scoringModeOf } from '../fasttrack/skillSchedule.ts';
import { allProgrammes } from '../normal/regular.ts';
import { mocTreNhapDiem } from '../platform/week.ts';
import { khoangTamDung } from '../students/tamDung.ts';
import { trongBoNho } from '../platform/nguCanhRequest.ts';
import type { Principal } from '../permissions.ts';
import { boMonLich, boMonTheoLuot, daGhiLuot, kyNangPhuTrach, laChamCheo } from '../../../shared/domain/index.ts';
import { dangHocLuc, lopLucThi, nguoiPcLuc, nguoiPcSau, type DongPc, type GhiDanh } from './luatBai.ts';
import { myWork, type WorkItem } from '../worklist/mywork.ts';
import { nghiaVuKetQuaPa, parseObligation } from '../worklist/metrics.ts';
import { viecXongCn } from './viecDaXong.ts';
import { VIEC_CO_HAN, quanLyCn } from './viecCoHan.ts';
import { LA_CASE_MT } from '../cases/sosState.ts';

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
  /* Bộ nhớ tạm cho lời gọi (đề nghị dời, quyền theo lớp… `skillCells` hỏi mỗi lượt) — trong request ghi `nho` không mở, không có thì mỗi lượt một câu. */
  return trongBoNho(() => {
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
  });
}

// ------------------------------------------------------------------ ghi sổ

const COT = ['loai', 'kieu', 'khoa', 'chi_nhanh', 'lop', 'hoc_vien', 'nguoi', 's_cheo', 'pc_nhap_sau', 'han_goc', 'han', 'tuan', 'xong_luc', 'nguoi_lam', 'khong_tinh', 'cap_nhat'] as const;
const DOI = COT.filter((c) => c !== 'khoa' && c !== 'han_goc' && c !== 'cap_nhat');
/* Upsert MỘT câu theo `khoa` (dòng gửi dạng JSON — một tham số, không chia lô theo trần tham số): `han_goc` giữ lần đầu (spec 1.5); chỉ ghi dòng có cột đổi
   (đỡ ghi Turso, `cap_nhat` = lần đổi cuối). `WHERE true`: SQLite cần để tách SELECT khỏi ON CONFLICT. */
const UPSERT = `INSERT INTO nghia_vu (${COT.join(', ')})
  SELECT ${COT.map((_, i) => `json_extract(j.value, '$[${i}]')`).join(', ')} FROM json_each(?) j WHERE true
  ON CONFLICT (khoa) DO UPDATE SET ${DOI.map((c) => `${c} = excluded.${c}`).join(', ')}, han_goc = COALESCE(nghia_vu.han_goc, excluded.han_goc), cap_nhat = excluded.cap_nhat
  WHERE ${DOI.map((c) => `nghia_vu.${c} IS NOT excluded.${c}`).join(' OR ')} OR (nghia_vu.han_goc IS NULL AND excluded.han_goc IS NOT NULL)`;

/** Ghi các dòng (một câu). `hanGoc` của dòng (việc đã đặt lại hạn) thắng `han` cho lần ghi đầu. */
export function ghiDong(ds: readonly (DongNv & { hanGoc?: string | null })[], luc = new Date().toISOString()): void {
  if (!ds.length) return;
  db().prepare(UPSERT).run(JSON.stringify(ds.map((d) => [d.loai, d.kieu, d.khoa, d.chiNhanh, d.lop, d.hocVien, d.nguoi, d.sCheo ? 1 : 0, d.pcNhapSau ? 1 : 0,
    d.hanGoc ?? d.han, d.han, d.tuan, d.xongLuc, d.nguoiLam, d.khongTinh, luc])));
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

/* Chờ ghi trong giao dịch đang mở: lượt · lớp (lượt của lớp + của em từng ghi danh lớp) · em. Ghi MỘT lô ngay trước COMMIT (`henTruocCommit`). */
const cho = { luot: new Set<number>(), lop: new Set<number>(), hv: new Set<number>() };
function hen(): void {
  if (!henTruocCommit('nghia-vu', xaCho)) xaCho();
}
function xaCho(): void {
  const luot = [...cho.luot], lop = [...cho.lop], hv = [...cho.hv];
  cho.luot.clear(); cho.lop.clear(); cho.hv.clear();
  if (!luot.length && !lop.length && !hv.length) return;
  anToan('ghi sổ bài', () => {
    const ids = new Set(luot);
    if (lop.length || hv.length) {
      for (const r of db().prepare(`SELECT a.id AS id FROM assessment_attempts a WHERE a.class_id IN (SELECT value FROM json_each(?)) OR a.student_id IN (SELECT value FROM json_each(?))
          UNION SELECT a.id AS id FROM assessment_attempts a JOIN enrollments e ON e.student_id = a.student_id WHERE e.class_id IN (SELECT value FROM json_each(?))`)
        .all(JSON.stringify(lop), JSON.stringify(hv), JSON.stringify(lop)) as any[]) ids.add(r.id);
    }
    ghiBaiNgay([...ids]);
  });
}

/** Tính lại + ghi mọi ô của các lượt NGAY; ô không còn (lượt xoá, ô thôi bắt buộc / chưa xếp tuần) → giữ dòng, `khong_tinh = 'da-xoa'`. */
function ghiBaiNgay(ds: number[]): void {
  if (!ds.length) return;
  const luc = new Date().toISOString();
  const moi = [...tinhBaiNhieu(ds).values()].flat();
  ghiDong(moi, luc);
  db().prepare(`UPDATE nghia_vu SET khong_tinh = 'da-xoa', cap_nhat = ? WHERE khong_tinh IS NOT 'da-xoa' AND khoa NOT IN (SELECT value FROM json_each(?))
      AND khoa IN (SELECT n.khoa FROM json_each(?) j JOIN nghia_vu n ON n.khoa >= 'bai:' || j.value || ':' AND n.khoa < 'bai:' || j.value || ';')`)
    .run(luc, JSON.stringify(moi.map((d) => d.khoa)), JSON.stringify(ds));
}

/** Ghi sổ các lượt (trong giao dịch `tx`: một lô trước COMMIT; ngoài giao dịch: ngay). */
export function ghiSoLuot(ids: readonly (number | null | undefined)[]): void {
  for (const x of ids) if (typeof x === 'number') cho.luot.add(x);
  if (cho.luot.size) hen();
}

/** Một khoá sổ (`bai:<lượt>:<kỹ năng>` · `viec:<khoá Công việc>`). */
export function ghiSo(khoa: string): void {
  const m = /^bai:(\d+):/.exec(khoa);
  if (m) return ghiSoLuot([Number(m[1])]);
  /* Việc: ghi lại cả chi nhánh của dòng (một lượt Công việc — xem `ghiSoViecChiNhanh`). */
  const cn = khoa.startsWith('viec:') ? (db().prepare('SELECT chi_nhanh FROM nghia_vu WHERE khoa = ?').get(khoa) as any)?.chi_nhanh : null;
  if (cn != null) ghiSoViecChiNhanh(cn);
}

/**
 * Đổi phân công / mốc lớp: mọi lượt của lớp + của em từng ghi danh lớp (lớp lúc thi có thể là lớp này). Ghi lại MỌI dòng, không chỉ từ `tuNgay`:
 * phân công mới cũng lấp người cho ô cũ chưa có phân công (spec 1.2 a, `pcNhapSau`). Upsert chỉ ghi dòng đổi.
 */
export function ghiSoTheoLop(lop: number): void {
  cho.lop.add(lop);
  hen();
}

/** Đổi trạng thái em (Tạm dừng, Kết thúc, Lưu trữ, Quay lại học…): mọi lượt của em. */
export function ghiSoHocVien(sids: readonly number[]): void {
  for (const s of sids) cho.hv.add(s);
  if (cho.hv.size) hen();
}

// ------------------------------------------------------------------ VIỆC (spec 1.1 · 1.2 b · 1.3 · 1.5)

/**
 * Mốc bắt đầu tính trễ (chủ SP 09/11, spec 1.6): hạn gốc (bài: tuần thi) TRƯỚC thứ Hai W4 OCT 2026 mà đã xong = Đúng hạn. Một hằng; đọc ở `truocMoc`.
 * Phép kiểm trên seed (ngày 2026-09) đặt `ngay = ''` để tắt, bật lại với ngày riêng khi kiểm luật này.
 */
export const MOC_TINH_TRE = { ngay: '2026-10-19' };
export const truocMoc = (ngay: string | null | undefined): boolean => !!MOC_TINH_TRE.ngay && !!ngay && ngay.slice(0, 10) < MOC_TINH_TRE.ngay;

export const khoaViec = (khoaCongViec: string) => `viec:${khoaCongViec}`;

/**
 * NGƯỜI CHỊU MỘT VIỆC (spec 1.2 b) — MỘT chỗ chọn: hiện = người Công việc giao (việc mở) / người giữ lúc hạn (`viecDaXong`, việc xong) / chủ Case (Kết quả PA).
 * PTA 09/11: luật có thể đổi sang "chốt lúc việc sinh ra" — chỉ sửa ở đây.
 */
export function nguoiChiuViec(nguon: { ownerId: number | null | undefined }): number | null {
  return nguon.ownerId != null && nguon.ownerId > 0 ? nguon.ownerId : null;
}

/** Hạn gốc từ nhật ký đặt lại hạn (`viec_han_lan`, lần đầu): theo loại việc. */
function hanGocCn(): (loai: string, id: number | null | undefined) => string | null {
  const m = new Map<string, string>();
  for (const r of db().prepare(`SELECT h.loai, h.viec_id, h.han_cu FROM viec_han_lan h WHERE h.han_cu IS NOT NULL
      AND h.id IN (SELECT MIN(id) FROM viec_han_lan GROUP BY loai, viec_id)`).all() as any[]) m.set(`${r.loai}|${r.viec_id}`, String(r.han_cu).slice(0, 10));
  return (loai, id) => (id == null ? null : m.get(`${loai}|${id}`) ?? null);
}

/** Loại viec_han_lan + id của một khoá Công việc / việc đã xong (Case: id Case; Báo PH: id việc; Phối hợp: id hành động). */
const NHAT_KY_HAN: [RegExp, string][] = [
  [/^(?:cause|ghi_nhan_xet|xnpa-case):(\d+)$/, 'reset_case:han_xac_nhan'],
  [/^support:(\d+)$/, 'reset_case:han_them_pa'],
  [/^(?:baoph|bao-ph):(\d+)$/, 'bao_ph'],
  [/^phoi-hop-xong:(\d+)$/, 'phoi_hop'],
];

/**
 * EM CHUYỂN LỚP (chủ SP 10/11, spec 1.2 b) — từ nhật ký `viec_han_lan` loai `chuyen_lop:*` (`cases/hanChuyenLop.ts`, ghi lúc Case đổi chủ theo lớp mới):
 *   · dòng "GV cũ" mỗi việc còn mở lúc chuyển (`viec:chuyen:<id>`): hạn cũ, người cũ; đã quá hạn lúc chuyển → Chưa làm (giữ), chưa tới hạn → `chuyen-lop`;
 *   · phân đoạn khoá việc Case: sau n lần chuyển, việc của GV mới mang khoá `…~c<n>` (việc mới, hạn gốc = hạn tính lại);
 *   · người theo ngày: việc xong / Kết quả PA có ngày trước lần chuyển → người giữ cũ.
 * Lần chuyển trước khi có nhật ký này không tách (không biết hạn lúc chuyển).
 */
function chuyenLopCn(cn: number) {
  const rows = db().prepare(`SELECT h.id, h.loai, h.han_cu, h.han_moi, h.nguoi_cu, h.ngay, h.luc, sc.id AS case_id, sc.student_id, ${LA_CASE_MT('sc')} AS mt, sc.mo_ta_luc
      FROM viec_han_lan h LEFT JOIN case_interventions iv ON h.loai = 'chuyen_lop:action_due' AND iv.id = h.viec_id
      JOIN sos_cases sc ON sc.id = COALESCE(iv.case_id, h.viec_id) JOIN students s ON s.id = sc.student_id
     WHERE h.loai LIKE 'chuyen_lop:%' AND s.branch_id = ? ORDER BY h.ngay, h.id`).all(cn) as any[];
  const suKien = new Map<number, { luc: string; ngay: string; nguoiCu: number | null }[]>();
  const hanMoi = new Map<string, string>();
  for (const r of rows) {
    const ds = suKien.get(r.case_id) ?? suKien.set(r.case_id, []).get(r.case_id)!;
    if (!ds.some((x) => x.luc === r.luc)) ds.push({ luc: r.luc, ngay: r.ngay, nguoiCu: r.nguoi_cu ?? null });
    hanMoi.set(`${r.loai}|${r.case_id}`, r.han_moi);
  }
  const cot = (loai: string, r: any) => (loai === 'chuyen_lop:han_them_pa' ? 'no_plan' : loai === 'chuyen_lop:action_due' ? 'ghi_ket_qua_pa'
    : r.mo_ta_luc && String(r.mo_ta_luc).slice(0, 10) <= r.ngay ? 'xac_nhan_pa' : r.mt ? 'ghi_nhan_xet' : 'cause');
  const cu: (DongNv & { hanGoc: string | null })[] = rows.map((r) => ({
    loai: 'viec', kieu: cot(r.loai, r), khoa: khoaViec(`chuyen:${r.id}`), chiNhanh: cn, lop: null, hocVien: r.student_id ?? null,
    nguoi: nguoiChiuViec({ ownerId: r.nguoi_cu }), sCheo: false, pcNhapSau: false, han: r.han_cu, tuan: null, xongLuc: null, nguoiLam: null,
    khongTinh: r.han_cu < r.ngay ? null : 'chuyen-lop', hanGoc: null,
  }));
  /** Số lần chuyển của Case tới ngày `d` (phân đoạn khoá). */
  const doan = (caseId: number | null, d: string) => (caseId == null ? 0 : (suKien.get(caseId) ?? []).filter((x) => x.ngay <= d).length);
  /** Người giữ Case tại ngày `d`: trước lần chuyển đầu SAU `d` là người cũ của lần đó; không có → người hiện tại. */
  const chuLuc = (caseId: number | null, d: string, hienTai: number | null | undefined) =>
    (caseId == null ? hienTai : (suKien.get(caseId) ?? []).find((x) => x.ngay > d)?.nguoiCu ?? hienTai) ?? null;
  return { cu, doan, chuLuc, hanMoi: (loai: string, caseId: number | null) => (caseId == null ? null : hanMoi.get(`${loai}|${caseId}`) ?? null) };
}

/** Case + cột hạn của một khoá việc tuyến Case (`xnpa:<PA>` lấy Case từ dòng Công việc). */
const CASE_KHOA = /^(cause|ghi_nhan_xet|support|xnpa-case):(\d+)$/;
function caseCua(key: string, caseId?: number | null): { caseId: number | null; loai: string } {
  const m = CASE_KHOA.exec(key);
  if (m) return { caseId: Number(m[2]), loai: m[1] === 'support' ? 'chuyen_lop:han_them_pa' : 'chuyen_lop:han_xac_nhan' };
  return key.startsWith('xnpa:') ? { caseId: caseId ?? null, loai: 'chuyen_lop:han_xac_nhan' } : { caseId: null, loai: '' };
}

/**
 * Mọi việc có hạn của MỘT chi nhánh (spec 1.1):
 *   CÒN MỞ   — CHÍNH dòng Công việc "Tất cả" của QL chi nhánh (`myWork`, nhóm `VIEC_CO_HAN`, có hạn): người giữ + hạn như Công việc đang giao.
 *   ĐÃ XONG  — CHÍNH `viecXongCn` (ngày xong, người giữ lúc hạn). Không có ngày xong: hạn trước mốc → coi xong đúng hạn; sau mốc → `thieu-ngay-xong`.
 *   Kết quả PA — CHÍNH nghĩa vụ `dung-han-cap-nhat` (`nghiaVuKetQuaPa`), mỗi kỳ một dòng, người = chủ Case.
 * Hạn gốc: lần đặt lại hạn đầu (`viec_han_lan`).
 */
export function tinhViecChiNhanh(cn: number): (DongNv & { hanGoc: string | null })[] {
  const homNay = demoToday();
  const ql = quanLyCn(cn);
  const hanGoc = hanGocCn();
  const goc = (key: string, caseId?: number | null) => {
    for (const [re, loai] of NHAT_KY_HAN) { const m = re.exec(key); if (m) return hanGoc(loai, Number(m[1])); }
    return key.startsWith('xnpa:') ? hanGoc('reset_case:han_xac_nhan', caseId) : null;
  };
  const out = new Map<string, DongNv & { hanGoc: string | null }>();
  const ch = chuyenLopCn(cn);
  for (const d of ch.cu) out.set(d.khoa, d);
  /* Khoá + hạn gốc theo phân đoạn chuyển lớp (ngày `d`: hôm nay cho việc mở, ngày xong cho việc xong). */
  const theoDoan = (key: string, d: string, caseId?: number | null) => {
    const c = caseCua(key, caseId);
    const n = ch.doan(c.caseId, d);
    return { khoa: khoaViec(key) + (n ? `~c${n}` : ''), hanGoc: n ? ch.hanMoi(c.loai, c.caseId) : goc(key, caseId), caseId: c.caseId };
  };
  const items = ((myWork(ql, { branchId: cn, nguoi: 'tat-ca', chiNhom: VIEC_CO_HAN }) as { items?: WorkItem[] }).items ?? []);
  for (const it of items) {
    if (!it.due || !VIEC_CO_HAN.has(it.group)) continue;
    const { khoa, hanGoc: hg } = theoDoan(it.key, homNay, it.caseId);
    out.set(khoa, { loai: 'viec', kieu: it.group, khoa, chiNhanh: cn, lop: it.classId ?? null, hocVien: it.studentId ?? null,
      nguoi: nguoiChiuViec(it), sCheo: false, pcNhapSau: false, han: it.due, tuan: null,
      xongLuc: null, nguoiLam: null, khongTinh: null, hanGoc: hg });
  }
  for (const it of viecXongCn({ cn, khung: 'ft', tu: '2000-01-01', cuoi: '2100-12-31', homNay }, true)) {
    const thieu = !it.xong;
    const { khoa, hanGoc: hg, caseId } = theoDoan(it.key, it.xong || it.due!);
    out.set(khoa, { loai: 'viec', kieu: it.group, khoa, chiNhanh: cn, lop: it.classId ?? null, hocVien: it.studentId ?? null,
      nguoi: nguoiChiuViec({ ownerId: ch.chuLuc(caseId, it.xong || it.due!, it.ownerId) }),
      sCheo: false, pcNhapSau: false, han: it.due, tuan: null,
      xongLuc: thieu ? (truocMoc(goc(it.key) ?? it.due) ? it.due : null) : it.xong, nguoiLam: null,
      khongTinh: thieu && !truocMoc(goc(it.key) ?? it.due) ? 'thieu-ngay-xong' : null, hanGoc: hg });
  }
  const pa = nghiaVuKetQuaPa(ql, cn, homNay);
  const chu = new Map<number, { owner: number | null; hv: number | null; lop: number | null; caseId: number }>();
  for (const r of db().prepare(`SELECT iv.id, sc.id AS case_id, sc.owner_user_id, sc.student_id, COALESCE((SELECT e.class_id FROM enrollments e WHERE e.student_id = sc.student_id AND e.status = 'active'
        ORDER BY e.id DESC LIMIT 1), a.class_id) AS lop
      FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE iv.id IN (SELECT value FROM json_each(?))`)
    .all(JSON.stringify([...new Set([...pa.values()].map((x) => x.iv))])) as any[]) chu.set(r.id, { owner: r.owner_user_id ?? null, hv: r.student_id ?? null, lop: r.lop ?? null, caseId: r.case_id });
  for (const [id, x] of pa) {
    const c = chu.get(x.iv);
    const khoa = khoaViec(`ket_qua_pa:${id}`);
    out.set(khoa, { loai: 'viec', kieu: 'ghi_ket_qua_pa', khoa, chiNhanh: cn, lop: c?.lop ?? null, hocVien: c?.hv ?? null, nguoi: nguoiChiuViec({ ownerId: ch.chuLuc(c?.caseId ?? null, x.han, c?.owner) }),
      sCheo: false, pcNhapSau: false, han: x.han, tuan: null, xongLuc: x.ghi, nguoiLam: null, khongTinh: null,
      hanGoc: parseObligation(id).k === 0 ? hanGoc('reset_case:action_due', x.iv) : null });
  }
  return [...out.values()];
}

/**
 * Ghi lại mọi việc của một chi nhánh; việc không còn (Case xoá, việc rời Công việc mà không có ngày xong…) → giữ dòng, `khong_tinh = 'da-xoa'`.
 * Ruling PR-1: việc ghi theo CHI NHÁNH (nạp, đối chiếu đêm, `ghiSo(viec:…)`) — một lượt Công việc cho cả chi nhánh; gắn từng đường ghi việc để PR-2.
 */
export function ghiSoViecChiNhanh(cn: number): void {
  anToan('ghiSoViecChiNhanh', () => {
    const luc = new Date().toISOString();
    const ds = tinhViecChiNhanh(cn);
    ghiDong(ds, luc);
    db().prepare(`UPDATE nghia_vu SET khong_tinh = 'da-xoa', cap_nhat = ? WHERE loai = 'viec' AND chi_nhanh = ? AND khong_tinh IS NOT 'da-xoa'
        AND khoa NOT IN (SELECT value FROM json_each(?))`).run(luc, cn, JSON.stringify(ds.map((d) => d.khoa)));
  });
}
