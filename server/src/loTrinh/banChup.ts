/**
 * BẢN CHỤP LỘ TRÌNH (PR-TK) — khi một lộ trình đóng, ghi MỘT dòng `ban_chup_lo_trinh` + mỗi lượt × kỹ năng một dòng `ban_chup_luot`.
 *
 * Ngữ cảnh lấy LÚC ĐÓNG rồi đóng băng (Target lúc thi, kỳ vọng, route, chương trình + môn, lớp, GV, band đầu vào): sửa hồ sơ về sau không
 * làm lệch số cũ. Mọi con số tính bằng hàm có sẵn (`evaluateAttempt`, `evaluateRegular`, `ketQuaThiThat`, `daiCuoiKhoa`) — không có luật thứ hai.
 * `ghiBanChup` chạy trong giao dịch của nơi đóng; lỗi → cả giao dịch đóng lùi lại (không có lộ trình đóng mà thiếu bản chụp).
 */
import { theoLo } from '../db.ts';
import {
  ASSESSED_SKILLS, daiCuoiKhoa, huongTiep, ketQuaThiThat, type AssessedSkill, type LyDoDong,
} from '../../../shared/domain/index.ts';
import { assessedBands, evaluateAttempt } from '../fasttrack/scoring.ts';
import { evaluateRegular, nguongDatKhacMacDinh, nguongDatLop, programmeByCode } from '../normal/regular.ts';
import { examPlanOf } from '../fasttrack/cycles.ts';
import { nowIso } from '../util.ts';

/** `lopId`: lớp lúc đóng, khi nơi gọi đã đổi ghi danh (Chuyển lớp, Lên lớp cả lớp) — không suy từ ghi danh nữa. `routeMoi`: route của lộ trình mở ngay sau (Lên LT2). */
export type BanChupVao = { lyDo: LyDoDong; ngay: string; nguon?: 'luc_dong' | 'dien_nguoc'; routeMoi?: string | null; lopId?: number | null };

const LO = 400;
const KY_NANG_THO = ['writing1', 'writing2'];
const gocKyNang = (s: string | null | undefined) => (s ?? '').replace(/[12]$/, '');
const bangMot = (b: boolean | null | undefined) => (b === null || b === undefined ? null : b ? 1 : 0);

/** Ngữ cảnh ĐÃ ĐÓNG BĂNG của lộ trình — đủ để tính lại điểm một lượt mà không đọc hồ sơ hiện tại (TK-5). */
/** `nguong` = ngưỡng đạt của lớp (OV-6b1, `nguongDatLop`); thiếu → 70 %. */
/** `kck` (OV-9): lộ trình có dấu KCK — dưới kỳ vọng không SOS, kết quả "chưa đạt". */
export type NguCanhLuot = { laFt: boolean; route: string | null; mon: string[]; maCt: string | null; nguong?: number; kck?: boolean };

export type DongLuotTinh = {
  kyNang: string; batBuoc: number | null; boQua: number | null; diem: number | null; diemTho: number | null; diemTong: number | null; dat: number | null;
};
export type LuotTinh = {
  kyVong: number | null; overall: number | null; tyLeTong: number | null; sos: number | null; ketQua: 'dat' | 'chua_dat' | 'cho' | 'huy';
  dong: DongLuotTinh[];
};

const ketQuaTu = (huy: boolean, sos: number | null): LuotTinh['ketQua'] => (huy ? 'huy' : sos === null ? 'cho' : sos === 0 ? 'dat' : 'chua_dat');

/**
 * Điểm một lượt — CÙNG hàm với hồ sơ (`typedResult`): FT `evaluateAttempt`, lớp thường `evaluateRegular`. `huy` = lượt đã huỷ: không điểm.
 * `target` là `target_at_attempt` của lượt (hoặc giá trị đóng băng ở bản chụp).
 */
export function tinhLuot(
  nc: NguCanhLuot, a: { attempt_no: number; kck_at_attempt?: number | null }, target: number | null, rows: any[], skips: readonly string[], huy: boolean,
): LuotTinh {
  const diemRows = huy ? [] : rows;
  if (!nc.laFt) {
    const r = evaluateRegular(nc.mon, diemRows, nc.maCt, nc.nguong);
    const dong = r.skills.map((s) => ({
      kyNang: s.skill, batBuoc: 1, boQua: 0, diem: s.score, diemTho: null, diemTong: s.total,
      dat: s.outcome === 'missing' ? null : s.outcome === 'pass' ? 1 : 0,
    }));
    return { kyVong: null, overall: null, tyLeTong: r.tyLeTong, sos: huy ? null : r.sosLevel, ketQua: ketQuaTu(huy, r.sosLevel), dong };
  }
  const entry: Record<string, number | null> = {};
  for (const r of diemRows) entry[r.skill] = r.band ?? null;
  /* OV-11e (Q8): lượt có dấu KCK lúc chốt thì theo dấu đó; chưa có thì theo cờ của lộ trình (bản chụp). */
  const res = evaluateAttempt(target, a.attempt_no, entry, skips, nc.route, [], a.kck_at_attempt != null ? !!a.kck_at_attempt : !!nc.kck);
  const dong: DongLuotTinh[] = ASSESSED_SKILLS.map((k: AssessedSkill) => {
    const v = res.verdicts.find((x) => x.skill === k)!;
    const t = k === 'listening' || k === 'reading' ? diemRows.find((r) => r.skill === k) : null;
    return { kyNang: k, batBuoc: bangMot(v.required), boQua: bangMot(!v.required), diem: v.band, diemTho: t?.raw_score ?? null, diemTong: t?.raw_total ?? null, dat: bangMot(v.passed) };
  });
  const wReq = res.required.includes('writing');
  for (const k of KY_NANG_THO) {
    dong.push({ kyNang: k, batBuoc: bangMot(wReq), boQua: bangMot(!wReq), diem: entry[k] ?? null, diemTho: null, diemTong: null, dat: null });
  }
  return { kyVong: res.expectation, overall: res.overall, tyLeTong: null, sos: huy ? null : res.sosLevel, ketQua: !huy && res.kckDuoi ? 'chua_dat' : ketQuaTu(huy, res.sosLevel), dong };
}

const cot = (n: number) => Array(n).fill('?').join(',');
/** `INSERT … VALUES (…),(…)` theo lô — một lượt mạng cho nhiều dòng (Turso). */
function chenLo(conn: any, bang: string, cols: string[], dong: unknown[][]) {
  const moiLan = Math.max(1, Math.floor(800 / cols.length));
  for (let i = 0; i < dong.length; i += moiLan) {
    const lo = dong.slice(i, i + moiLan);
    conn.prepare(`INSERT INTO ${bang} (${cols.join(', ')}) VALUES ${lo.map(() => `(${cot(cols.length)})`).join(',')}`).run(...lo.flat());
  }
}

const COT_BC = ['cycle_id', 'student_id', 'lan', 'ly_do', 'dong_ngay', 'nguon', 'programme_code', 'programme_name', 'scoring_mode', 'route', 'mon_json',
  'class_id', 'class_code', 'branch_id', 'gvcn_user_id', 'gvcn_ten', 'bat_dau_ngay', 'target', 'khong_cam_ket',
  'dau_vao', 'dau_vao_nguon', 'dau_vao_l', 'dau_vao_r', 'dau_vao_w', 'dau_vao_s',
  'thi_du_kien_thang', 'thi_du_kien_tuan', 'thi_du_kien_ngay', 'thi_du_kien_nhan',
  'thi_that_ngay', 'thi_that_l', 'thi_that_r', 'thi_that_w', 'thi_that_s', 'thi_that_ovr', 'thi_that_khong_thi', 'thi_that_nhap_boi', 'thi_that_nhap_luc',
  'ket_luan', 'huong_tiep', 'ky_vong_dat', 'ty_le_cuoi_khoa', 'dai_cuoi_khoa', 'so_luot', 'lam_moi_luc', 'created_at'];
const COT_LUOT = ['ban_chup_id', 'attempt_id', 'attempt_no', 'kind', 'trang_thai', 'huy_ly_do', 'lich_su', 'class_id', 'class_code', 'tuan_bat_dau',
  'target_luc_thi', 'ky_vong', 'overall', 'ty_le_tong', 'sos', 'ket_qua', 'ky_nang', 'bat_buoc', 'bo_qua', 'diem', 'diem_tho', 'diem_tong', 'dat',
  'vang', 'han_cham', 'nhap_luc', 'nguoi_nhap_id', 'gv_id', 'gv_ten', 'case_id'];

/** Kết quả thi thật + OVR + kết luận của một lộ trình FT (cột `learning_cycles` hoặc `ban_chup_lo_trinh`) — một nơi cho ghi và làm mới. */
export function thiThatCuaCycle(c: {
  laFt: boolean; target: number | null; khongCamKet: boolean; l: number | null; r: number | null; w: number | null; s: number | null; khongThi: boolean;
  outcome: string | null; outcomeScore: number | null;
}): { ovr: number | null; ketLuan: 'reached' | 'not_reached' | 'unknown' } {
  if (!c.laFt) return { ovr: null, ketLuan: 'unknown' };
  if (c.khongThi || [c.l, c.r, c.w, c.s].some((x) => x !== null)) {
    const k = ketQuaThiThat({ l: c.l, r: c.r, w: c.w, s: c.s, khongThi: c.khongThi }, c.target)   /* OV-9: KCK giữ Target — so như thường */;
    return { ovr: k.ovr, ketLuan: k.ketLuan };
  }
  /* Dữ liệu CŨ (trước PR-TK): chỉ có Overall + kết luận chọn tay — chép nguyên, bốn kỹ năng để trống. */
  return { ovr: c.outcomeScore, ketLuan: (c.outcome as any) ?? 'unknown' };
}

export function ghiBanChup(conn: any, cycleIds: number[], o: BanChupVao): number[] {
  const ids = [...new Set(cycleIds)];
  const out: number[] = [];
  for (let i = 0; i < ids.length; i += LO) out.push(...ghiMotLo(conn, ids.slice(i, i + LO), o));
  return out;
}

function ghiMotLo(conn: any, ids: number[], o: BanChupVao): number[] {
  const hoi = <T>(sql: (ph: string) => string, dsId: number[]): T[] => {
    const r: T[] = [];
    theoLo(dsId, (lo, ph) => { r.push(...(conn.prepare(sql(ph)).all(...lo) as T[])); }, LO);
    return r;
  };
  const gom = <T extends { [k: string]: any }>(rows: T[], khoa: string): Map<number, T[]> => {
    const m = new Map<number, T[]>();
    for (const r of rows) { const l = m.get(r[khoa]) ?? []; l.push(r); m.set(r[khoa], l); }
    return m;
  };
  const cycles = hoi<any>((ph) => `SELECT * FROM learning_cycles WHERE id IN (${ph})`, ids);
  if (!cycles.length) return [];
  const sids = [...new Set(cycles.map((c) => c.student_id as number))];
  const attempts = hoi<any>((ph) => `SELECT a.*, rp.week_start AS period_start FROM assessment_attempts a LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
      WHERE a.cycle_id IN (${ph}) ORDER BY a.cycle_id, a.attempt_no, a.id`, ids);
  const luotCua = gom(attempts, 'cycle_id');

  const baseIds = cycles.map((c) => c.baseline_attempt_id as number | null).filter((x): x is number => !!x);
  const idLuot = attempts.map((a) => a.id as number);
  const diemCua = gom(hoi<any>((ph) => `SELECT * FROM assessment_scores WHERE attempt_id IN (${ph})`, [...new Set([...idLuot, ...baseIds])]), 'attempt_id');
  const batBuocCua = gom(hoi<any>((ph) => `SELECT attempt_id, skill, required FROM attempt_skills WHERE attempt_id IN (${ph})`, idLuot), 'attempt_id');
  const boCu = gom(hoi<any>((ph) => `SELECT attempt_id, skill FROM attempt_skill_skips WHERE attempt_id IN (${ph})`, idLuot), 'attempt_id');
  /** Cùng luật `skipsOf`: có dòng `attempt_skills` thì lấy dòng không bắt buộc; không có thì bảng cũ. */
  const boQuaCua = (id: number): string[] => {
    const rows = batBuocCua.get(id);
    if (rows?.length) return rows.filter((r) => !r.required).map((r) => r.skill);
    return (boCu.get(id) ?? []).map((r) => r.skill).filter((s) => (ASSESSED_SKILLS as readonly string[]).includes(s));
  };
  const caseCua = new Map<string, number>();
  for (const r of hoi<any>((ph) => `SELECT id, attempt_id, topic FROM sos_cases WHERE attempt_id IN (${ph}) ORDER BY id`, idLuot)) {
    caseCua.set(`${r.attempt_id}:${gocKyNang(r.topic)}`, r.id);
  }

  const lopCuoiCua = new Map<number, number>();
  for (const e of hoi<any>((ph) => `SELECT student_id, class_id, started_at FROM enrollments WHERE student_id IN (${ph}) ORDER BY id`, sids)) {
    if (e.started_at < o.ngay || !lopCuoiCua.has(e.student_id)) lopCuoiCua.set(e.student_id, e.class_id);
  }
  const nguongKhac = nguongDatKhacMacDinh();
  const lopCuoi = (c: any): number | null => o.lopId ?? (luotCua.get(c.id) ?? []).filter((a) => a.class_id).at(-1)?.class_id ?? lopCuoiCua.get(c.student_id) ?? null;
  const idLop = [...new Set([...attempts.map((a) => a.class_id), ...cycles.map(lopCuoi)].filter((x): x is number => !!x))];
  const lopTheoId = new Map<number, any>();
  for (const l of hoi<any>((ph) => `SELECT id, code, branch_id, programme_code FROM classes WHERE id IN (${ph})`, idLop)) lopTheoId.set(l.id, l);
  const phanCong = gom(hoi<any>((ph) => `SELECT ta.*, u.full_name AS ten FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id WHERE ta.class_id IN (${ph})`, idLop), 'class_id');
  const moiNhat = (rows: any[]) => rows.sort((a, b) => b.effective_from.localeCompare(a.effective_from))[0] ?? null;
  const hieuLuc = (r: any, ngay: string) => r.effective_from <= ngay && (!r.effective_to || r.effective_to >= ngay);
  const gvCua = (classId: number | null, kyNang: string, ngay: string) => (classId
    ? moiNhat((phanCong.get(classId) ?? []).filter((r) => hieuLuc(r, ngay) && gocKyNang(r.skill) === gocKyNang(kyNang))) : null);
  const gvcnCua = (classId: number | null, ngay: string) => (classId
    ? moiNhat((phanCong.get(classId) ?? []).filter((r) => r.is_core && hieuLuc(r, ngay))) : null);
  const kyVongDat = new Map<string, any>();
  for (const r of hoi<any>((ph) => `SELECT student_id, class_id, ky_vong_dat FROM lo_trinh_tiep_theo WHERE student_id IN (${ph})`, sids)) kyVongDat.set(`${r.student_id}:${r.class_id}`, r);
  const cungEm = o.lyDo === 'lo_trinh_moi' && o.routeMoi === undefined
    ? gom(hoi<any>((ph) => `SELECT student_id, seq, route FROM learning_cycles WHERE student_id IN (${ph}) ORDER BY seq`, sids), 'student_id') : new Map<number, any[]>();
  const lanCuoi = new Map<number, number>();
  for (const r of hoi<any>((ph) => `SELECT cycle_id, MAX(lan) AS m FROM ban_chup_lo_trinh WHERE cycle_id IN (${ph}) GROUP BY cycle_id`, ids)) lanCuoi.set(r.cycle_id, r.m);

  const ngayGhi = nowIso();
  /* Chương trình: hỏi một lần cho mỗi mã (không mỗi lộ trình — số câu SQL không tăng theo số em). */
  const ctCache = new Map<string, ReturnType<typeof programmeByCode>>();
  const ctCua = (ma: string | null) => (ma ? (ctCache.has(ma) ? ctCache.get(ma)! : (ctCache.set(ma, programmeByCode(ma)), ctCache.get(ma)!)) : null);
  /* Gom dòng rồi ghi MỘT lô cho cả hai bảng. */
  const cho: { cid: number; lan: number; dong: unknown[]; luot: unknown[][] }[] = [];
  for (const c of cycles) {
    const laFt = !!c.route;
    const lopId = lopCuoi(c);
    const lop = lopId ? lopTheoId.get(lopId) : null;
    const luot = luotCua.get(c.id) ?? [];
    const maCt = c.programme_code ?? (laFt ? null : luot.map((a) => lopTheoId.get(a.class_id)?.programme_code).find(Boolean) ?? null);
    const ct = ctCua(maCt);
    const mon: string[] = laFt ? [...ASSESSED_SKILLS] : [...(ct?.skills ?? [])];
    const nc: NguCanhLuot = { laFt, route: c.route ?? null, mon, maCt: ct?.code ?? maCt, nguong: nguongDatLop(lopId, nguongKhac), kck: !!c.khong_cam_ket };
    const gvcn = gvcnCua(lopId, o.ngay);

    // điểm đầu vào: nhập tay, hoặc bài đánh giá làm căn cứ
    let dauVao: number | null = c.baseline_score ?? null;
    let bandCoSo: Record<AssessedSkill, number | null> = { listening: null, reading: null, writing: null, speaking: null };
    if (c.baseline_attempt_id) {
      const e: Record<string, number | null> = {};
      for (const r of diemCua.get(c.baseline_attempt_id) ?? []) e[r.skill] = r.band ?? null;
      bandCoSo = assessedBands(e);
      if (dauVao === null) dauVao = evaluateAttempt(null, 1, e).overall;
    }
    const thi = thiThatCuaCycle({
      laFt, target: c.target_score ?? null, khongCamKet: !!c.khong_cam_ket, l: c.thi_that_l ?? null, r: c.thi_that_r ?? null, w: c.thi_that_w ?? null, s: c.thi_that_s ?? null,
      khongThi: !!c.thi_that_khong_thi, outcome: c.outcome ?? null, outcomeScore: c.outcome_score ?? null,
    });
    const plan = laFt ? examPlanOf(c) : null;
    const luotCuoiKhoa = luot.filter((a) => a.kind === 'final' && a.status !== 'cancelled').at(-1);
    const tyLe = !laFt && luotCuoiKhoa ? evaluateRegular(mon, diemCua.get(luotCuoiKhoa.id) ?? [], nc.maCt, nc.nguong).tyLeTong : null;
    const routeMoi = o.routeMoi !== undefined ? o.routeMoi : (cungEm.get(c.student_id) ?? []).find((x) => x.seq > c.seq)?.route ?? null;
    const lan = (lanCuoi.get(c.id) ?? 0) + 1;

    const dong = [c.id, c.student_id, lan, o.lyDo, o.ngay, o.nguon ?? 'luc_dong', ct?.code ?? maCt, ct?.name ?? (laFt ? 'Fast Track' : null), ct?.scoringMode ?? (laFt ? 'ielts_band' : null),
      c.route ?? null, JSON.stringify(mon),
      lopId, lop?.code ?? null, lop?.branch_id ?? null, gvcn?.user_id ?? null, gvcn?.ten ?? null, c.started_at, c.target_score ?? null, c.khong_cam_ket ? 1 : 0,
      dauVao, c.baseline_source ?? null, c.baseline_listening ?? bandCoSo.listening, c.baseline_reading ?? bandCoSo.reading,
      c.baseline_writing ?? bandCoSo.writing, c.baseline_speaking ?? bandCoSo.speaking,
      laFt ? c.exam_month ?? null : null, laFt ? c.exam_period_id ?? null : null, laFt ? c.exam_date ?? null : null, plan && plan.confidence !== 'none' ? plan.label : null,
      c.thi_that_ngay ?? null, c.thi_that_l ?? null, c.thi_that_r ?? null, c.thi_that_w ?? null, c.thi_that_s ?? null, thi.ovr, c.thi_that_khong_thi ? 1 : 0,
      c.thi_that_nhap_boi ?? null, c.thi_that_nhap_luc ?? null,
      laFt ? thi.ketLuan : null, huongTiep(o.lyDo, routeMoi),
      !laFt && lopId ? kyVongDat.get(`${c.student_id}:${lopId}`)?.ky_vong_dat ?? null : null, tyLe, tyLe === null ? null : daiCuoiKhoa(tyLe, nc.nguong),
      luot.length, null, ngayGhi];
    const dongLuot: unknown[][] = [];
    for (const a of luot) {
      const huy = a.status === 'cancelled';
      const rows = diemCua.get(a.id) ?? [];
      const t = tinhLuot(nc, a, a.target_at_attempt ?? null, rows, boQuaCua(a.id), huy);
      const tuan = a.period_start ?? o.ngay;
      for (const d of t.dong) {
        /* Kỹ năng gộp (writing) lấy cả W1 + W2 để biết người nhập / lúc nhập / dấu vắng; dòng thô W1, W2 chỉ lấy đúng ô của nó. */
        const rieng = huy ? [] : rows.filter((r) => (KY_NANG_THO.includes(d.kyNang) ? r.skill === d.kyNang : gocKyNang(r.skill) === d.kyNang));
        const nhap = rieng.filter((r) => r.entered_at).sort((x, y) => String(y.entered_at).localeCompare(String(x.entered_at)))[0];
        const gv = gvCua(a.class_id ?? lopId, d.kyNang, tuan);
        /* PR-MT0: MT0 còn ở khoá lớp thường lúc chụp (MT0 dùng đã sang lộ trình FT trước khi chụp) = `khong_dung`. */
        dongLuot.push([0, a.id, a.attempt_no, a.kind, a.kind === 'mt0' && !huy ? 'khong_dung' : a.status, huy ? a.cancel_reason ?? null : null, a.lich_su ?? 0, a.class_id ?? null,
          a.class_id ? lopTheoId.get(a.class_id)?.code ?? null : null, a.period_start ?? null, a.target_at_attempt ?? null,
          t.kyVong, t.overall, t.tyLeTong, t.sos, t.ketQua, d.kyNang, d.batBuoc, d.boQua, d.diem, d.diemTho, d.diemTong, d.dat,
          rieng.some((r) => r.no_show_at) ? 1 : 0, a.deadline_override ?? null, nhap?.entered_at ?? null, nhap?.entered_by ?? null,
          gv?.user_id ?? null, gv?.ten ?? null, caseCua.get(`${a.id}:${gocKyNang(d.kyNang)}`) ?? null]);
      }
    }
    cho.push({ cid: c.id, lan, dong, luot: dongLuot });
  }
  chenLo(conn, 'ban_chup_lo_trinh', COT_BC, cho.map((x) => x.dong));
  const idTheoKhoa = new Map<string, number>();
  for (const r of hoi<any>((ph) => `SELECT id, cycle_id, lan FROM ban_chup_lo_trinh WHERE cycle_id IN (${ph})`, cho.map((x) => x.cid))) idTheoKhoa.set(`${r.cycle_id}:${r.lan}`, r.id);
  const idMoi = cho.map((x) => idTheoKhoa.get(`${x.cid}:${x.lan}`)!);
  chenLo(conn, 'ban_chup_luot', COT_LUOT, cho.flatMap((x, i) => x.luot.map((r) => [idMoi[i], ...r.slice(1)])));
  return idMoi;
}

/**
 * TK-5 (chủ sản phẩm Q1 = A): điểm nhập / sửa SAU khi lộ trình đã đóng → cập nhật bản chụp MỚI NHẤT của lộ trình đó. CHỈ điểm đổi
 * (`diem`, `dat`, `overall`, `sos`, `ket_qua`, `ty_le_tong`, người / lúc nhập); Target, kỳ vọng, route, chương trình + môn, lớp, GV giữ theo bản chụp.
 * Gọi ở `refreshOutcome` / `refreshRegularOutcome` — nơi MỌI đường ghi / xoá / khôi phục điểm đều đi qua. Lộ trình đang chạy: một câu rồi thoát.
 */
export function lamMoiDiemBanChup(conn: any, attemptIds: number[]): void {
  if (!attemptIds.length) return;
  const dong: any[] = [];
  theoLo(attemptIds, (lo, ph) => {
    dong.push(...conn.prepare(`SELECT a.id, a.attempt_no, a.status, a.cycle_id, a.kind, a.kck_at_attempt FROM assessment_attempts a JOIN learning_cycles c ON c.id = a.cycle_id
      WHERE a.id IN (${ph}) AND c.status <> 'active'`).all(...lo));
  }, LO);
  const ngay = nowIso();
  for (const a of dong) {
    const bc = conn.prepare('SELECT * FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY lan DESC LIMIT 1').get(a.cycle_id) as any;
    if (!bc) continue;
    const cu = conn.prepare('SELECT * FROM ban_chup_luot WHERE ban_chup_id = ? AND attempt_id = ?').all(bc.id, a.id) as any[];
    if (!cu.length || cu[0].trang_thai === 'cancelled') continue;   // PR-VN5: lượt vừa huỷ vẫn ghi một lần để bản chụp thành `cancelled`
    const nc: NguCanhLuot = { laFt: !!bc.route, route: bc.route ?? null, mon: JSON.parse(bc.mon_json ?? '[]'), maCt: bc.programme_code ?? null, nguong: nguongDatLop(bc.class_id), kck: !!bc.khong_cam_ket };
    const rows = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ?').all(a.id) as any[];
    const boQua = cu.filter((r) => r.bo_qua === 1 && (ASSESSED_SKILLS as readonly string[]).includes(r.ky_nang)).map((r) => r.ky_nang as string);
    const t = tinhLuot(nc, a, cu[0].target_luc_thi ?? null, rows, boQua, false);
    for (const d of t.dong) {
      const rieng = rows.filter((r) => (KY_NANG_THO.includes(d.kyNang) ? r.skill === d.kyNang : gocKyNang(r.skill) === d.kyNang));
      const nhap = rieng.filter((r) => r.entered_at).sort((x, y) => String(y.entered_at).localeCompare(String(x.entered_at)))[0];
      conn.prepare(`UPDATE ban_chup_luot SET diem = ?, diem_tho = ?, diem_tong = ?, dat = ?, overall = ?, ty_le_tong = ?, sos = ?, ket_qua = ?, trang_thai = ?,
          vang = ?, nhap_luc = ?, nguoi_nhap_id = ? WHERE ban_chup_id = ? AND attempt_id = ? AND ky_nang = ?`)
        .run(d.diem, d.diemTho, d.diemTong, d.dat, t.overall, t.tyLeTong, t.sos, t.ketQua, a.status,
          rieng.some((r) => r.no_show_at) ? 1 : 0, nhap?.entered_at ?? null, nhap?.entered_by ?? null, bc.id, a.id, d.kyNang);
    }
    let tyLe: number | null = bc.ty_le_cuoi_khoa;
    if (!nc.laFt && a.kind === 'final') tyLe = t.tyLeTong;
    conn.prepare('UPDATE ban_chup_lo_trinh SET lam_moi_luc = ?, ty_le_cuoi_khoa = ?, dai_cuoi_khoa = ? WHERE id = ?')
      .run(ngay, tyLe, tyLe === null ? null : daiCuoiKhoa(tyLe, nc.nguong), bc.id);
  }
}
