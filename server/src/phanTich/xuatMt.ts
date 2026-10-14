import { db } from '../db.ts';
import {
  PERMISSIONS, ROUTE_NAME, chuTargetKck, XUAT_TOI_DA_BYTE, XUAT_TOI_DA_LUOT, soTenVi, chuNhomNguyenNhan, docNhomNguyenNhan, tenGvCham, bangBoLoc, bangFT, bangThuong, goiYCuoiKhoa, dongXemTruoc, dongXemTruocThuong, moTaBoLoc, nhanDot, phanTram,
  soSanhLop, tenMon, tenSheetThuong, tenTepXuatMt, trangThaiLuotXuat,
  type BoLocXuatMt, type Cell, type DongFT, type DongThuong,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { activeAt, type Principal } from '../permissions.ts';
import { badRequest, forbidden, nowIso } from '../util.ts';
import { writeAudit } from '../platform/audit.ts';
import { demHienTai } from '../platform/nguCanhRequest.ts';
import { loadBundle, resultOf, type AttemptBundle, type ScoreRow } from '../fasttrack/attempts.ts';
import { allProgrammes, evaluateRegular, nguongDatLop } from '../normal/regular.ts';
import { luotKck } from '../worklist/danhGia.ts';

/**
 * XUẤT EXCEL KẾT QUẢ TEST (PR-XUAT · YC-13.9 · T40). Lọc + quyền + tính dòng ở ĐÂY; bộ cột và dựng mảng hai chiều ở
 * `shared/domain/xuatMt.ts`. Xem trước và xuất gọi CÙNG `duLieuXuatMt` nên số dòng không thể lệch nhau.
 *
 * Chỉ ĐỌC (trừ một `writeAudit` ở `xuatExcel`). Số câu SQL không tăng theo số lượt: một câu lấy lượt + `loadBundle` (theo lô 900).
 */

// ------------------------------------------------------------------ phạm vi (K5-35, Q2)

export type PhamViXuat = { tatCa: boolean; chiNhanh: number[]; lopGvcn: number[] };

/**
 * Không dùng `scopeFor(ATTEMPT_VIEW)` thẳng: vai GV nhận MỌI lớp được phân công (kể cả GVBM). Xuất chỉ cho Quản lý / Quản trị (theo
 * chi nhánh của grant) và GVCN (lớp mình, phân công còn hiệu lực) — dựng từ quyền có sẵn, không quyền mới (không migrate).
 */
export function phamViXuatMt(p: Principal, homNay?: string): PhamViXuat {
  let tatCa = false; let laGv = false; const cn = new Set<number>();
  for (const g of p.grants) {
    if (!g.permissions.has(PERMISSIONS.ATTEMPT_VIEW)) continue;
    /* PR-OV2a: vai không có khu Test (TVV, CX) không xuất kết quả Test; quyền cấp riêng giữ như cũ (mỗi grant riêng chỉ một quyền). */
    if (!g.permissions.has(PERMISSIONS.TEST_VIEW) && g.roleKey !== 'granted') continue;
    if (g.roleKey === 'teacher') { laGv = true; continue; }          // GV: chỉ lớp mình là GVCN (dưới)
    if (g.branchId === null) tatCa = true; else cn.add(g.branchId);  // QL chi nhánh · Quản trị · quyền cấp riêng
  }
  const lopGvcn = laGv ? [...new Set(p.assignments.filter((a) => a.isCore && activeAt(a, homNay ??= demoToday())).map((a) => a.classId))] : [];
  return { tatCa, chiNhanh: [...cn], lopGvcn };
}
export const coPhamViXuat = (v: PhamViXuat) => v.tatCa || v.chiNhanh.length > 0 || v.lopGvcn.length > 0;

const dauHoi = (n: number) => Array.from({ length: n }, () => '?').join(',');

/** Mảnh SQL phạm vi trên bảng `c` (classes) — `1=1` khi toàn hệ thống. */
function manhPhamVi(v: PhamViXuat): { sql: string; params: number[] } {
  if (v.tatCa) return { sql: '1=1', params: [] };
  const vế: string[] = []; const params: number[] = [];
  if (v.chiNhanh.length) { vế.push(`c.branch_id IN (${dauHoi(v.chiNhanh.length)})`); params.push(...v.chiNhanh); }
  if (v.lopGvcn.length) { vế.push(`c.id IN (${dauHoi(v.lopGvcn.length)})`); params.push(...v.lopGvcn); }
  return { sql: `(${vế.join(' OR ')})`, params };
}

export type PhamViDanhSach = {
  chiNhanh: { id: number; ten: string }[];
  lop: { id: number; ma: string; chiNhanhId: number; ft: boolean; daKetThuc: boolean; soHv: number }[];
};

/** Chi nhánh và lớp trong phạm vi — hai câu (để ngăn vẽ nút chọn; cũng là nơi kiểm 403). */
function danhSachPhamVi(v: PhamViXuat): PhamViDanhSach {
  const conn = db();
  const cs = manhPhamVi(v);
  const lop = (conn.prepare(
    `SELECT c.id, c.code, c.branch_id, c.is_fast_track, c.status,
            (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active') AS so_hv
       FROM classes c WHERE ${cs.sql}`,
  ).all(...cs.params) as any[]).map((r) => ({ id: r.id, ma: r.code, chiNhanhId: r.branch_id, ft: !!r.is_fast_track, daKetThuc: r.status === 'finished', soHv: r.so_hv }))
    .sort((a, b) => soSanhLop({ code: a.ma }, { code: b.ma }));   // PR-UXF-a U1
  const ids = v.tatCa ? [] : [...new Set([...v.chiNhanh, ...lop.map((l) => l.chiNhanhId)])];
  const chiNhanh = ((v.tatCa || ids.length)
    ? conn.prepare(v.tatCa ? `SELECT id, name FROM branches WHERE status = 'active' ORDER BY name`
      : `SELECT id, name FROM branches WHERE id IN (${dauHoi(ids.length)}) ORDER BY name`).all(...ids) as any[]
    : []).map((r) => ({ id: r.id, ten: r.name }));
  return { chiNhanh, lop };
}

// ------------------------------------------------------------------ dòng dữ liệu

export type DuLieuXuat = {
  dem: { luot: number; hocVien: number; lop: number };
  sheets: { ten: string; aoa: Cell[][] }[];
  dauDong: string[];
  tenTep: string;
  moTa: [string, string][];
  phamVi: PhamViDanhSach;
};

const THU_TU_NHAP = ['listening', 'reading', 'writing1', 'writing2', 'speaking'];
const nguoiNhapCua = (scores: ScoreRow[]) => {
  const ten = THU_TU_NHAP.map((k) => scores.find((s) => s.skill === k)?.entered_by_name).filter((x): x is string => !!x);
  return ten.length ? [...new Set(ten)].join(', ') : null;
};
const nhanXetCua = (scores: ScoreRow[], k: string) => scores.find((s) => s.skill === k)?.comment ?? null;
const bandCua = (scores: ScoreRow[], k: string) => scores.find((s) => s.skill === k)?.band ?? null;
const tieuChiCua = (scores: ScoreRow[], k: string) => {
  const r = scores.find((s) => s.skill === k);
  return [r?.c1 ?? null, r?.c2 ?? null, r?.c3 ?? null, r?.c4 ?? null];
};

function dongFT(a: any, b: AttemptBundle): { d: DongFT; du: boolean } {
  const scores = b.scores.get(a.id) ?? [];
  const skillRows = b.skillRows.get(a.id) ?? [];
  const r = resultOf(a, scores, b.skips.get(a.id) ?? [], skillRows);
  const kck = luotKck(a);
  const gvS = scores.find((s) => s.skill === 'speaking');
  const tuanKn = (k: string) => skillRows.find((x) => x.skill === k)?.period_code ?? null;
  const d: DongFT = {
    ma: a.student_code, ten: a.full_name, chiNhanh: a.branch_name ?? '', lop: a.class_code, loTrinh: ROUTE_NAME[a.route as keyof typeof ROUTE_NAME] ?? a.route ?? '',
    mt: a.attempt_no, tuan: a.tuan_code, tuanBd: a.week_start,
    l: r.bands.listening, r: r.bands.reading, w: r.bands.writing, s: r.bands.speaking, overall: r.overall,
    /* OV-9: KCK giữ Target + kỳ vọng; vẫn không tính SOS. */
    target: kck ? chuTargetKck(a.target_at_attempt ?? null, true) : a.target_at_attempt ?? null, kyVong: r.expectation, sos: kck ? null : r.sosLevel,
    trangThai: trangThaiLuotXuat({
      coDiem: r.scoredRequired, yeuCau: r.required.length, du: r.complete, lichSu: !!a.lich_su,
      huyPhan: skillRows.some((x) => x.required && x.sit_status === 'cancelled'), tamThoi: r.provisional, kck,
    }),
    w1: bandCua(scores, 'writing1'), w2: bandCua(scores, 'writing2'),
    tieuChi: { writing1: tieuChiCua(scores, 'writing1'), writing2: tieuChiCua(scores, 'writing2'), speaking: tieuChiCua(scores, 'speaking') },
    tuanKn: { listening: tuanKn('listening'), reading: tuanKn('reading'), writing: tuanKn('writing'), speaking: tuanKn('speaking') },
    nguoiNhap: nguoiNhapCua(scores),
    nhanXet: { listening: nhanXetCua(scores, 'listening'), reading: nhanXetCua(scores, 'reading'), writing1: nhanXetCua(scores, 'writing1'),
      writing2: nhanXetCua(scores, 'writing2'), speaking: nhanXetCua(scores, 'speaking') },
    nhom: chuNhomNguyenNhan(Object.fromEntries(scores.map((x) => [x.skill, docNhomNguyenNhan(x.nhom_nguyen_nhan)]))),
    gvChamS: tenGvCham({ examinerUserName: gvS?.examiner_user_name, examinerName: gvS?.examiner_name }),
  };
  return { d, du: r.complete };
}

function dongThuong(a: any, b: AttemptBundle, prog: { code: string; skills: string[] }): { d: DongThuong; du: boolean } {
  const scores = b.scores.get(a.id) ?? [];
  const skillRows = b.skillRows.get(a.id) ?? [];
  const r = evaluateRegular(prog.skills, scores, prog.code, nguongDatLop(a.class_id));
  const d: DongThuong = {
    ma: a.student_code, ten: a.full_name, chiNhanh: a.branch_name ?? '', lop: a.class_code, bai: nhanDot(a.kind, a.attempt_no), tuan: a.tuan_code, tuanBd: a.week_start,
    mon: r.skills.map((m) => ({
      ten: tenMon(prog.code, m.skill), pct: phanTram(m.ratio), diem: m.score, tong: m.total,
      tuan: skillRows.find((x) => x.skill === m.skill)?.period_code ?? null,
    })),
    tyLeTong: phanTram(r.tyLeTong),
    /* PR-LT2b: cùng luật `goiYCuoiKhoa` với lưới / hồ sơ HV — chỉ Cuối khoá đủ điểm. */
    huong: a.kind === 'final' && r.tyLeTong !== null
      ? goiYCuoiKhoa({ ct: prog.code, tyLe: r.tyLeTong, monTruot: r.skills.filter((m) => m.outcome === 'fail').map((m) => m.skill), nguong: r.passThreshold })?.nhanExcel ?? null : null,
    // T58: lớp thường không có SOS — `tamThoi: false`, không "SOS tạm thời" trong trạng thái.
    trangThai: trangThaiLuotXuat({
      coDiem: r.scored, yeuCau: r.required, du: r.complete, lichSu: !!a.lich_su,
      huyPhan: skillRows.some((x) => x.required && x.sit_status === 'cancelled'), tamThoi: false, kck: false,
    }),
    nguoiNhap: nguoiNhapCua(scores),
  };
  return { d, du: r.complete };
}

/** Điều kiện + tham số của bộ lọc thời gian, trên bảng `a` (lượt) và `t` (tuần của lượt). */
function manhThoiGian(f: BoLocXuatMt): { sql: string; params: (string | number)[] } {
  const t = f.thoiGian;
  if (t.kieu === 'tuan') return { sql: 't.week_start BETWEEN ? AND ?', params: [t.tu, t.den] };
  if (t.kieu === 'thang') return { sql: '(t.year * 100 + t.month) BETWEEN ? AND ?', params: [Number(t.tu.replace('-', '')), Number(t.den.replace('-', ''))] };
  if (f.khung === 'ft') return { sql: `a.attempt_no IN (${dauHoi(t.dot.length)})`, params: t.dot.map((k) => Number(k.slice(3))) };
  return { sql: `a.kind IN (${dauHoi(t.dot.length)})`, params: t.dot.map((k) => (k === 'giua' ? 'progress' : 'final')) };
}

/**
 * Cùng một hàm cho xem trước và xuất. Chi nhánh/lớp ngoài phạm vi → 403; quá `toiDa` lượt → 400.
 * Tuần của lượt = tuần SỚM NHẤT trong các kỹ năng phải thi (K4-35(b)) — KHÔNG dùng `a.planned_period_id` (tuần hoàn tất = muộn nhất,
 * `skillSchedule.ts:386-405`); lượt cũ không có dòng kỹ năng thì lấy tuần của đợt. Lượt chưa xếp tuần không vào tệp (Q6).
 */
export function duLieuXuatMt(p: Principal, f: BoLocXuatMt, toiDa = XUAT_TOI_DA_LUOT, luc = nowIso()): DuLieuXuat {
  const homNay = demoToday();   // một lần — `demoToday()` là một câu SQL, không gọi theo từng dòng
  const v = phamViXuatMt(p, homNay);
  if (!coPhamViXuat(v)) throw forbidden('Bạn chưa có phạm vi xuất kết quả Test — chỉ Quản lý, Quản trị và GVCN (lớp mình).');
  const phamVi = danhSachPhamVi(v);
  if (f.chiNhanh.some((id) => !phamVi.chiNhanh.some((c) => c.id === id))) throw forbidden('Chi nhánh này nằm ngoài phạm vi bạn được xuất.');
  const lopChon = f.lop.map((id) => phamVi.lop.find((l) => l.id === id));
  if (lopChon.some((l) => !l)) throw forbidden('Có lớp nằm ngoài phạm vi bạn được xuất.');

  const cs = manhPhamVi(v);
  const tg = manhThoiGian(f);
  const dk: [string, (string | number)[]][] = [
    [`a.status != 'cancelled'`, []], [f.khung === 'ft' ? `a.kind = 'mock'` : `a.kind IN ('progress','final','checkpoint')`, []], [cs.sql, cs.params], [tg.sql, tg.params],
  ];
  if (f.chiNhanh.length) dk.push([`c.branch_id IN (${dauHoi(f.chiNhanh.length)})`, f.chiNhanh]);
  if (f.lop.length) dk.push([`c.id IN (${dauHoi(f.lop.length)})`, f.lop]);
  const where = dk.map(([sql]) => sql), params = dk.flatMap(([, ps]) => ps);
  const luot = db().prepare(
    `SELECT a.id, a.kind, a.attempt_no, a.lich_su, a.class_id, a.target_at_attempt, a.kck_at_attempt, a.student_id, a.cycle_id,
            cy.route, cy.khong_cam_ket AS kck, cy.khong_cam_ket AS cy_kck, st.student_code, st.full_name,
            c.code AS class_code, c.branch_id, c.programme_code, b.name AS branch_name,
            t.week_start, t.code AS tuan_code
       FROM assessment_attempts a
       JOIN learning_cycles cy ON cy.id = a.cycle_id
       JOIN students st ON st.id = a.student_id
       JOIN classes c ON c.id = a.class_id
       LEFT JOIN branches b ON b.id = c.branch_id
       JOIN report_periods t ON t.id = COALESCE(
            (SELECT k.planned_period_id FROM attempt_skills k JOIN report_periods r2 ON r2.id = k.planned_period_id
              WHERE k.attempt_id = a.id AND k.required = 1 ORDER BY r2.week_start LIMIT 1),
            a.planned_period_id)
      WHERE ${where.join(' AND ')}
      ORDER BY b.name, c.code, st.full_name, a.kind, a.attempt_no
      LIMIT ?`,
  ).all(...params, toiDa + 1) as any[];
  if (luot.length > toiDa) throw badRequest(`Quá ${String(toiDa).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} lượt — thu hẹp chi nhánh hoặc thời gian.`);
  /* PR-S4F #12: trong mỗi chi nhánh × lớp, xếp theo TÊN rồi họ (SQL chỉ xếp được theo chuỗi họ tên đầy đủ). */
  const thuTuKind = (k: string) => (k === 'progress' ? 0 : k === 'final' ? 1 : 2);
  luot.sort((a, b) => String(a.branch_name ?? '').localeCompare(String(b.branch_name ?? ''), 'vi') || soSanhLop({ code: String(a.class_code ?? '') }, { code: String(b.class_code ?? '') })
    || soTenVi(a.full_name, b.full_name) || a.student_id - b.student_id || thuTuKind(a.kind) - thuTuKind(b.kind) || a.attempt_no - b.attempt_no);

  const bundle = loadBundle(luot.map((a) => a.id));
  const soLuot = new Set<number>(), hv = new Set<number>(), lop = new Set<number>();
  const dauDong: string[] = [];
  const dem = (a: any, xem: string) => {
    soLuot.add(a.id); hv.add(a.student_id); lop.add(a.class_id);
    if (dauDong.length < 5) dauDong.push(xem);
  };
  const sheets: { ten: string; aoa: Cell[][] }[] = [];
  if (f.khung === 'ft') {
    const dong: DongFT[] = [];
    for (const a of luot) {
      const x = dongFT(a, bundle);
      if (f.chiDuDiem && !x.du) continue;
      dong.push(x.d); dem(a, dongXemTruoc(x.d, homNay));
    }
    sheets.push({ ten: 'Mock Test', aoa: bangFT(dong, f.cot) });
  } else {
    const chuongTrinh = allProgrammes();
    const theoCt = new Map<string, DongThuong[]>();
    for (const a of luot) {
      const prog = a.programme_code ? chuongTrinh.get(a.programme_code) : null;
      if (!prog || prog.scoringMode !== 'ratio') continue;
      const x = dongThuong(a, bundle, prog);
      if (f.chiDuDiem && !x.du) continue;
      if (!theoCt.has(prog.code)) theoCt.set(prog.code, []);
      theoCt.get(prog.code)!.push(x.d); dem(a, dongXemTruocThuong(x.d, homNay));
    }
    for (const ct of [...theoCt.keys()].sort()) sheets.push({ ten: tenSheetThuong(ct), aoa: bangThuong(theoCt.get(ct)!, f.cot) });
  }

  /* Không chọn chi nhánh mà phạm vi chỉ có MỘT chi nhánh (Quản lý, GVCN): tên chi nhánh đó vào tên tệp và bộ lọc — "Monbay", không "mọi chi nhánh". */
  const cnTen = f.chiNhanh.length ? f.chiNhanh.map((id) => phamVi.chiNhanh.find((c) => c.id === id)!.ten) : phamVi.chiNhanh.length === 1 ? [phamVi.chiNhanh[0].ten] : [];
  const ten = { chiNhanh: cnTen, lop: lopChon.map((l) => l!.ma) };
  const moTa = moTaBoLoc(f, ten);
  sheets.push({ ten: 'Bộ lọc đã dùng', aoa: bangBoLoc({ khung: f.khung, nguoiXuat: p.fullName, luc, moTa, soLuot: soLuot.size }) });
  return {
    dem: { luot: soLuot.size, hocVien: hv.size, lop: lop.size }, sheets, dauDong, moTa, phamVi,
    tenTep: tenTepXuatMt({ khung: f.khung, chiNhanhTen: ten.chiNhanh, lopMa: ten.lop, thoiGian: f.thoiGian }),
  };
}

/** GET — chỉ đọc, không ghi nhật ký. Trả danh sách phạm vi để ngăn vẽ nút chọn. */
export function xemTruoc(p: Principal, f: BoLocXuatMt) {
  const d = duLieuXuatMt(p, f);
  return { phamVi: d.phamVi, dem: d.dem, dauDong: d.dauDong, tenTep: d.tenTep };
}

/** POST — trả mảng hai chiều đã dựng + MỘT dòng nhật ký (`mt.xuat_excel`). */
export function xuatExcel(p: Principal, f: BoLocXuatMt, tranByte = XUAT_TOI_DA_BYTE) {
  const t0 = performance.now(), n0 = demHienTai()?.n ?? 0;
  const d = duLieuXuatMt(p, f);
  /* PR-S4F #12: cột Đầy đủ (có nhận xét) dễ vượt trần phản hồi 6 MB của Netlify — đo trước, báo rõ cách thu hẹp. */
  const co = Buffer.byteLength(JSON.stringify(d.sheets));
  if (co > tranByte) {
    throw badRequest(`Tệp quá lớn (~${(co / 1e6).toFixed(1)} MB) — Thu hẹp phạm vi: chọn ít chi nhánh/lớp, khoảng thời gian ngắn hơn${f.cot === 'day-du' ? ', hoặc chọn cột Gọn' : ''}.`);
  }
  writeAudit({
    actorUserId: p.userId, action: 'mt.xuat_excel', entityType: 'xuat_mt', after: f,
    entityLabel: `${d.dem.luot} lượt · ${d.moTa[1][1]} · ${d.moTa[3][1]} · ${d.moTa[5][1].toLowerCase()}`,
  });
  /* Chẩn đoán trên bản chính: chỉ số lượt · số câu · ms — không tên người, không dữ liệu học viên. */
  console.info(`[xuat-mt] ${d.dem.luot} lượt · ${(demHienTai()?.n ?? 0) - n0} câu SQL · ${Math.round(performance.now() - t0)} ms`);
  return { sheets: d.sheets, tenTep: d.tenTep, dem: d.dem };
}
