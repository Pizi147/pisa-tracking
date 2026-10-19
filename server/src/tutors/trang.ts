/**
 * TRANG TUTOR (TU-b, đặc tả Tutor mục 7, 8) — bảng tutor + panel một tutor, nhận xét / kết luận, thêm / sửa / xoá tutor, gộp tên gõ tay.
 * Quyền: đọc `tutor.view` (QL: chỉ BUỔI có `lop_id` thuộc chi nhánh mình — lớp chụp lúc ghi, mục 12.1); ghi `tutor.manage` (Head tutor, Quản trị).
 * Ngày của buổi = `case_followups.created_at` theo giờ VN. Nhóm chú ý = MỘT hàm (`canChuY`) cho bộ lọc, số menu và cột lý do.
 */
import { db, theoLo, tx } from '../db.ts';
import { addDays, badRequest, forbidden, loi, normalizeName, notFound, nowIso } from '../util.ts';
import { can, scopeFor, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { KN_TUTOR, PERMISSIONS, chuanSdt, knTutorCuaTopic } from '../../../shared/domain/index.ts';

export type Khoang = { tu: string; den: string };
export type KetLuan = 'on' | 'can_cai_thien' | 'ngung';
const KET_LUAN: readonly string[] = ['on', 'can_cai_thien', 'ngung'];
/** Tỉ lệ một tiêu chí: [số buổi "Có", số buổi có trả lời ô đó] — dòng cũ (NULL) không vào mẫu. */
export type TyLe = [number, number];
export type ChuY = { chuanBi: number; taiLieu: number; feedbackGv: number; sao: number[] };
export type NoiDay = { id: number; ten: string } | 'online' | null;
export type SoTutor = { buoi: number; chuanBi: TyLe; taiLieu: TyLe; feedbackGv: TyLe; danhGia: number | null };
export type DongTutor = SoTutor & {
  id: number; ten: string; sdt: string | null; noiDay: NoiDay; kyNang: string[];
  ketLuan: { kl: KetLuan; luc: string } | null; chuY: string | null; thieu: ('sdt' | 'noiDay')[];
};

/** Phạm vi đọc: `branchIds` null = toàn hệ thống. Không có `tutor.view` → 403. */
function phamVi(p: Principal): { branchIds: number[] | null; sua: boolean } {
  const s = scopeFor(p, PERMISSIONS.TUTOR_VIEW);
  if (s.none) throw forbidden('Bạn không có quyền xem trang Tutor.');
  return { branchIds: s.all ? null : s.branchIds, sua: coSua(p) };
}
const coSua = (p: Principal) => can(p, PERMISSIONS.TUTOR_MANAGE, { anyScope: true });
function canSua(p: Principal) {
  if (!coSua(p)) throw forbidden('Bạn không có quyền sửa danh sách tutor.');
}
/** Mảnh SQL lọc buổi theo chi nhánh của lớp chụp lúc ghi (alias `b`). */
const locLop = (branchIds: number[] | null) => (branchIds
  ? { sql: ` AND b.lop_id IN (SELECT id FROM classes WHERE branch_id IN (${branchIds.map(() => '?').join(',') || 'NULL'}))`, args: branchIds }
  : { sql: '', args: [] as number[] });
/** Khoảng ngày VN → mốc `created_at` (UTC ISO): [tu 00:00 VN, den + 1 00:00 VN). */
const mocKhoang = (k: Khoang): [string, string] => [`${addDays(k.tu, -1)}T17:00:00.000Z`, `${k.den}T17:00:00.000Z`];
const ngayVn = (iso: string) => new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 10);
/** Khoá gom tên (bỏ dấu, hoa thường, khoảng trắng) — tên gõ tay và khớp tên khi tải lên. */
export const khoaTen = (s: string) => normalizeName(String(s ?? ''));
const tron1 = (x: number | null) => (x == null ? null : Math.round(x * 10) / 10);

// ---------------------------------------------------------------- Nhóm chú ý

/**
 * Tutor có ≥ 1 buổi (MỌI thời gian) có ô "Không" hoặc đánh giá ≤ 2, ghi SAU nhận xét gần nhất về tutor đó (sửa nhận xét không dời mốc `luc`);
 * kết luận mới nhất "Ngừng hợp tác" → không vào. `branchIds` (QL): chỉ buổi lớp chi nhánh đó. Chỉ đọc buổi "xấu" (ít dòng), nhận xét qua chỉ mục.
 */
/**
 * Câu đọc buổi "xấu": WHERE viết ĐÚNG biểu thức của chỉ mục một phần `idx_followup_buoi_chu_y` (migrate `prTub`) để SQLite dùng chỉ mục, không
 * quét cả bảng buổi (phép kiểm TUB-7 soi EXPLAIN). `tutorId` (panel một tutor): chỉ đọc buổi của tutor đó.
 */
export function cauChuY(branchIds: number[] | null, tutorId?: number): { sql: string; args: number[] } {
  const l = locLop(branchIds);
  return {
    sql: `SELECT b.tutor_id, b.chuan_bi, b.tai_lieu, b.feedback_gv, b.danh_gia, b.ghi_luc,
            (SELECT n.ket_luan FROM tutor_nhan_xet n WHERE n.tutor_id = b.tutor_id ORDER BY n.luc DESC, n.id DESC LIMIT 1) AS kl,
            (SELECT MAX(n.luc) FROM tutor_nhan_xet n WHERE n.tutor_id = b.tutor_id) AS moc
       FROM case_followup_buoi b
      WHERE (b.chuan_bi = 0 OR b.tai_lieu = 0 OR b.feedback_gv = 0 OR b.danh_gia <= 2) AND b.tutor_id ${tutorId ? '= ?' : 'IS NOT NULL'}${l.sql}`,
    args: [...(tutorId ? [tutorId] : []), ...l.args],
  };
}
export function canChuY(conn: any, branchIds: number[] | null, tutorId?: number): Map<number, ChuY> {
  const c = cauChuY(branchIds, tutorId);
  const hang = conn.prepare(c.sql).all(...c.args) as any[];
  const m = new Map<number, ChuY>();
  for (const r of hang) {
    if (r.kl === 'ngung' || (r.moc && !(String(r.ghi_luc ?? '') > r.moc))) continue;
    const c = m.get(r.tutor_id) ?? { chuanBi: 0, taiLieu: 0, feedbackGv: 0, sao: [] };
    if (r.chuan_bi === 0) c.chuanBi++;
    if (r.tai_lieu === 0) c.taiLieu++;
    if (r.feedback_gv === 0) c.feedbackGv++;
    if (r.danh_gia != null && r.danh_gia <= 2) c.sao.push(r.danh_gia);
    m.set(r.tutor_id, c);
  }
  return m;
}

/** Câu lý do theo loại nhiều buổi nhất ("3 buổi không gửi feedback cho GV", "1 buổi đánh giá 2/5"). */
export function lyDoChuY(c: ChuY): string {
  const saoMax = Math.max(...c.sao);
  const loai: [number, string][] = [
    [c.chuanBi, 'không chuẩn bị'], [c.taiLieu, 'không xin tài liệu đúng hạn'], [c.feedbackGv, 'không gửi feedback cho GV'],
    [c.sao.length, c.sao.every((s) => s === saoMax) ? `đánh giá ${saoMax}/5` : `đánh giá ≤ ${saoMax}/5`],
  ];
  const [n, chu] = loai.reduce((a, b) => (b[0] > a[0] ? b : a));
  return `${n} buổi ${chu}`;
}

/** Số "Tutor n" trên menu — chỉ người sửa danh sách (Head tutor, Quản trị; QL không có số). */
export function demChuY(p: Principal): { n: number } {
  canSua(p);
  return { n: canChuY(db(), null).size };
}

// ---------------------------------------------------------------- Bảng + panel

function docTutors(conn: any, id?: number): any[] {
  return conn.prepare(
    `SELECT t.id, t.ten, t.sdt, t.noi_day_branch_id, t.chi_online, t.ky_nang,
            (SELECT n.ket_luan || '|' || n.luc FROM tutor_nhan_xet n WHERE n.tutor_id = t.id ORDER BY n.luc DESC, n.id DESC LIMIT 1) AS kl
       FROM tutors t${id ? ' WHERE t.id = ?' : ''}`,
  ).all(...(id ? [id] : [])) as any[];
}
const docChiNhanh = (conn: any) => new Map((conn.prepare('SELECT id, name FROM branches').all() as any[]).map((b) => [b.id as number, b.name as string]));

function thanhDong(r: any, cn: Map<number, string>, so: SoTutor, chuY: ChuY | undefined, sua: boolean): DongTutor {
  const [kl, luc] = r.kl ? String(r.kl).split('|') : [];
  const noiDay: NoiDay = r.chi_online ? 'online' : r.noi_day_branch_id ? { id: r.noi_day_branch_id, ten: cn.get(r.noi_day_branch_id) ?? '' } : null;
  return {
    id: r.id, ten: r.ten, sdt: r.sdt ?? null, noiDay, kyNang: String(r.ky_nang).split(',').filter(Boolean), ...so,
    ketLuan: kl ? { kl: kl as KetLuan, luc } : null, chuY: chuY ? lyDoChuY(chuY) : null,
    thieu: sua ? [...(r.sdt ? [] : ['sdt' as const]), ...(noiDay ? [] : ['noiDay' as const])] : [],
  };
}
const SO_RONG: SoTutor = { buoi: 0, chuanBi: [0, 0], taiLieu: [0, 0], feedbackGv: [0, 0], danhGia: null };

/**
 * Bảng tutor trong khoảng. Head tutor / Quản trị: mọi tutor. QL: tutor có ≥ 1 buổi em chi nhánh mình trong khoảng (kể cả tutor nơi dạy chi nhánh khác)
 * + tutor nơi dạy = chi nhánh mình (cho "Tất cả"); số chỉ tính buổi chi nhánh mình. Lọc / tìm / phân trang ở web trên danh sách này.
 */
export function bangTutor(p: Principal, k: Khoang) {
  const { branchIds, sua } = phamVi(p);
  const conn = db();
  const [tu, den] = mocKhoang(k);
  const l = locLop(branchIds);
  // ponytail: đọc mọi buổi có tutor rồi lọc ngày qua case_followups (bảng buổi tutor nhỏ); nâng cấp = chỉ mục case_followups(created_at) khi bảng lớn.
  const so = new Map<number, SoTutor>((conn.prepare(
    `SELECT b.tutor_id AS id, COUNT(*) AS buoi, SUM(b.chuan_bi = 1) AS cb, COUNT(b.chuan_bi) AS cbn, SUM(b.tai_lieu = 1) AS tl, COUNT(b.tai_lieu) AS tln,
            SUM(b.feedback_gv = 1) AS fb, COUNT(b.feedback_gv) AS fbn, AVG(b.danh_gia) AS sao
       FROM case_followup_buoi b JOIN case_followups f ON f.id = b.followup_id
      WHERE b.tutor_id IS NOT NULL AND f.created_at >= ? AND f.created_at < ?${l.sql}
      GROUP BY b.tutor_id`,
  ).all(tu, den, ...l.args) as any[]).map((r) => [r.id, {
    buoi: r.buoi, chuanBi: [r.cb ?? 0, r.cbn], taiLieu: [r.tl ?? 0, r.tln], feedbackGv: [r.fb ?? 0, r.fbn], danhGia: tron1(r.sao),
  }]));
  const cn = docChiNhanh(conn);
  const chuY = canChuY(conn, branchIds);
  const dong = docTutors(conn)
    .filter((r) => !branchIds || so.has(r.id) || chuY.has(r.id) || branchIds.includes(r.noi_day_branch_id))   // chuY: Cần chú ý tính mọi thời gian
    .map((r) => thanhDong(r, cn, so.get(r.id) ?? SO_RONG, chuY.get(r.id), sua))
    .sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
  let goTay: { soTen: number; soBuoi: number } | null = null;
  if (sua) {
    const ten = new Map<string, number>();
    for (const r of conn.prepare('SELECT tutor_ten, COUNT(*) AS n FROM case_followup_buoi WHERE tutor_id IS NULL GROUP BY tutor_ten').all() as any[]) {
      ten.set(khoaTen(r.tutor_ten), (ten.get(khoaTen(r.tutor_ten)) ?? 0) + r.n);
    }
    goTay = { soTen: ten.size, soBuoi: [...ten.values()].reduce((a, b) => a + b, 0) };
  }
  return {
    dong, goTay, coSua: sua, chiNhanh: branchIds ? branchIds.map((id) => cn.get(id)).join(', ') : null,
    dsChiNhanh: [...cn].map(([id, ten]) => ({ id, ten })),
  };
}

const knCua = (topic: string | null) => {
  const ks = knTutorCuaTopic(topic);
  return ks.length === 2 && ks[0] === 'W1' ? 'W' : ks.join('/');
};
const coKhong = (v: number | null) => (v == null ? null : v === 1);
const tyLe = (ds: any[], cot: string): TyLe => [ds.filter((b) => b[cot] === 1).length, ds.filter((b) => b[cot] != null).length];
const trong24h = (luc: string) => Date.now() - new Date(luc).getTime() < 24 * 3600_000;

/** Panel một tutor: đầu + 5 ô số + nhận xét (dòng thời gian) + buổi trong khoảng (QL: chỉ buổi chi nhánh mình; ngoài phạm vi → 404). */
export function panelTutor(p: Principal, id: number, k: Khoang) {
  const { branchIds, sua } = phamVi(p);
  const conn = db();
  const r = docTutors(conn, id)[0];
  const l = locLop(branchIds);
  if (!r || (branchIds && !branchIds.includes(r.noi_day_branch_id)
    && !conn.prepare(`SELECT 1 AS x FROM case_followup_buoi b WHERE b.tutor_id = ?${l.sql} LIMIT 1`).get(id, ...l.args))) {
    throw notFound('Không tìm thấy tutor.');
  }
  const [tu, den] = mocKhoang(k);
  const hang = conn.prepare(
    `SELECT b.id, f.created_at, s.full_name AS hv, c.code AS lop, u.full_name AS nguoi_ghi, sc.topic,
            b.hinh_thuc, b.chuan_bi, b.tai_lieu, b.feedback_gv, b.danh_gia, b.nhan_xet, b.nhan_xet_tutor
       FROM case_followup_buoi b JOIN case_followups f ON f.id = b.followup_id
       JOIN sos_cases sc ON sc.id = f.case_id LEFT JOIN students s ON s.id = sc.student_id
       LEFT JOIN classes c ON c.id = b.lop_id LEFT JOIN users u ON u.id = f.observer_user_id
      WHERE b.tutor_id = ? AND f.created_at >= ? AND f.created_at < ?${l.sql}
      ORDER BY f.created_at DESC, b.buoi_so DESC`,
  ).all(id, tu, den, ...l.args) as any[];
  const sao = hang.filter((b) => b.danh_gia != null);
  const so: SoTutor = {
    buoi: hang.length, chuanBi: tyLe(hang, 'chuan_bi'), taiLieu: tyLe(hang, 'tai_lieu'), feedbackGv: tyLe(hang, 'feedback_gv'),
    danhGia: sao.length ? tron1(sao.reduce((a, b) => a + b.danh_gia, 0) / sao.length) : null,
  };
  const nhanXet = (conn.prepare(
    `SELECT n.id, n.ket_luan, n.noi_dung, n.luc, n.sua_luc, n.nguoi_id, u.full_name FROM tutor_nhan_xet n LEFT JOIN users u ON u.id = n.nguoi_id
      WHERE n.tutor_id = ? ORDER BY n.luc DESC, n.id DESC`,
  ).all(id) as any[]).map((n) => ({
    id: n.id, kl: n.ket_luan as KetLuan, noiDung: n.noi_dung, luc: n.luc, suaLuc: n.sua_luc ?? null, nguoi: n.full_name ?? '',
    coSua: sua && n.nguoi_id === p.userId && trong24h(n.luc),
  }));
  return {
    tutor: thanhDong(r, docChiNhanh(conn), so, canChuY(conn, branchIds, id).get(id), sua), so, coSua: sua, nhanXet,
    coBuoi: sua ? !!conn.prepare('SELECT 1 AS x FROM case_followup_buoi WHERE tutor_id = ? LIMIT 1').get(id) : true,
    buoi: hang.map((b) => ({
      id: b.id, ngay: ngayVn(b.created_at), hocVien: b.hv ?? '', lop: b.lop ?? null, nguoiGhi: b.nguoi_ghi ?? null, kn: knCua(b.topic),
      hinhThuc: b.hinh_thuc ?? null, chuanBi: coKhong(b.chuan_bi), taiLieu: coKhong(b.tai_lieu), feedbackGv: coKhong(b.feedback_gv),
      danhGia: b.danh_gia ?? null, nhanXet: b.nhan_xet, nhanXetTutor: b.nhan_xet_tutor ?? null,
    })),
  };
}

// ---------------------------------------------------------------- Thêm / sửa / xoá tutor

export type TutorVao = { ten?: unknown; sdt?: unknown; noiDay?: unknown; kyNang?: unknown };
export type TutorSach = { ten: string; sdt: string | null; noiDayBranchId: number | null; chiOnline: 0 | 1; kyNang: string };
export type LoiTutor = Partial<Record<'ten' | 'sdt' | 'noiDay' | 'kyNang', string>>;

/** Một hàm kiểm cho hộp Thêm / Sửa và từng dòng tải lên. Chỉ Tên + Kỹ năng bắt buộc (mục 13.2); SĐT (khi có) không trùng tutor khác. */
export type TraSan = { sdt: Map<string, { id: number; ten: string }>; chiNhanh: Set<number> };
export function kiemTutor(conn: any, v: TutorVao, boQuaId: number | null, tra?: TraSan): { ok: TutorSach } | { loi: LoiTutor } {
  const loi: LoiTutor = {};
  const ten = String(v.ten ?? '').trim();
  if (!ten) loi.ten = 'Nhập tên tutor.';
  else if (ten.length > 100) loi.ten = 'Tên tối đa 100 ký tự.';
  const sdt = chuanSdt(v.sdt);
  if (sdt === false) loi.sdt = 'SĐT cần 9–11 chữ số.';
  else if (sdt) {
    /* `tra` (tải lên): bảng SĐT nạp một lần — không hỏi DB từng dòng. */
    const trung = tra ? tra.sdt.get(sdt) : conn.prepare('SELECT id, ten FROM tutors WHERE sdt = ?').get(sdt) as any;
    if (trung && trung.id !== boQuaId) loi.sdt = `SĐT đã có: ${trung.ten}`;
  }
  let noiDayBranchId: number | null = null;
  const chiOnline = v.noiDay === 'online' ? 1 : 0;
  if (typeof v.noiDay === 'number') {
    if (tra ? tra.chiNhanh.has(v.noiDay) : conn.prepare('SELECT 1 AS x FROM branches WHERE id = ?').get(v.noiDay)) noiDayBranchId = v.noiDay;
    else loi.noiDay = 'Chi nhánh không có.';
  } else if (v.noiDay != null && v.noiDay !== '' && v.noiDay !== 'online') loi.noiDay = 'Nơi dạy không hợp lệ.';
  const kn = Array.isArray(v.kyNang) ? v.kyNang.map(String) : [];
  if (!kn.length) loi.kyNang = 'Chọn ít nhất một kỹ năng.';
  else if (kn.some((x) => !(KN_TUTOR as readonly string[]).includes(x))) loi.kyNang = 'Kỹ năng là L, R, W1, W2, S.';
  if (Object.keys(loi).length) return { loi };
  return { ok: { ten, sdt: sdt || null, noiDayBranchId, chiOnline, kyNang: KN_TUTOR.filter((x) => kn.includes(x)).join(',') } };
}

/** Thêm (không `id`) hoặc sửa một tutor. `trungTen`: đã có tutor khác cùng tên (bỏ dấu) — chỉ nhắc, vẫn lưu. */
export function luuTutor(p: Principal, v: TutorVao, id?: number): { id: number; trungTen: boolean } {
  canSua(p);
  const conn = db();
  const truoc = id ? conn.prepare('SELECT ten, sdt, noi_day_branch_id, chi_online, ky_nang FROM tutors WHERE id = ?').get(id) as any : null;
  if (id && !truoc) throw notFound('Không tìm thấy tutor.');
  const k = kiemTutor(conn, v ?? {}, id ?? null);
  if ('loi' in k) throw badRequest(Object.values(k.loi).join(' · '), { loi: k.loi });
  const t = k.ok;
  const luc = nowIso();
  try {
  return tx(() => {
    let ma = id ?? 0;
    if (id) {
      conn.prepare('UPDATE tutors SET ten = ?, sdt = ?, noi_day_branch_id = ?, chi_online = ?, ky_nang = ?, updated_at = ?, updated_by = ? WHERE id = ?')
        .run(t.ten, t.sdt, t.noiDayBranchId, t.chiOnline, t.kyNang, luc, p.userId, id);
    } else {
      ma = Number(conn.prepare('INSERT INTO tutors (ten, sdt, noi_day_branch_id, chi_online, ky_nang, created_at, created_by) VALUES (?,?,?,?,?,?,?)')
        .run(t.ten, t.sdt, t.noiDayBranchId, t.chiOnline, t.kyNang, luc, p.userId).lastInsertRowid);
    }
    writeAudit({ actorUserId: p.userId, action: id ? 'tutor.sua' : 'tutor.them', entityType: 'tutor', entityId: ma, entityLabel: t.ten, before: truoc ?? undefined, after: t });
    const trungTen = (conn.prepare('SELECT ten FROM tutors WHERE id <> ?').all(ma) as any[]).some((r) => khoaTen(r.ten) === khoaTen(t.ten));
    return { id: ma, trungTen };
  });
  } catch (e) {
    /* Hai người lưu cùng SĐT cùng lúc: chỉ mục UNIQUE chặn người sau — báo tại ô SĐT, không 500. */
    if (t.sdt && /UNIQUE/i.test(String((e as Error)?.message))) {
      const ai = conn.prepare('SELECT ten FROM tutors WHERE sdt = ?').get(t.sdt) as any;
      throw loi(400, 'SĐT đã có: {ten}', { ten: ai?.ten ?? t.sdt }, { loi: { sdt: `SĐT đã có: ${ai?.ten ?? t.sdt}` } });
    }
    throw e;
  }
}

/** Xoá tutor CHỈ khi chưa có buổi nào trỏ tới (có buổi → dùng kết luận "Ngừng hợp tác"); nhận xét của tutor xoá theo. */
export function xoaTutor(p: Principal, id: number): { ok: true } {
  canSua(p);
  const conn = db();
  const t = conn.prepare('SELECT ten, sdt, noi_day_branch_id, chi_online, ky_nang FROM tutors WHERE id = ?').get(id) as any;
  if (!t) throw notFound('Không tìm thấy tutor.');
  tx(() => {
    /* Kiểm trong giao dịch: GV vừa ghi buổi trỏ tutor này thì không xoá. */
    if (conn.prepare('SELECT 1 AS x FROM case_followup_buoi WHERE tutor_id = ? LIMIT 1').get(id)) {
      throw badRequest('Tutor đã có buổi dạy — không xoá được. Dùng kết luận "Ngừng hợp tác".');
    }
    conn.prepare('DELETE FROM tutor_nhan_xet WHERE tutor_id = ?').run(id);
    conn.prepare('DELETE FROM tutors WHERE id = ?').run(id);
    writeAudit({ actorUserId: p.userId, action: 'tutor.xoa', entityType: 'tutor', entityId: id, entityLabel: t.ten, before: t });
  });
  return { ok: true };
}

// ---------------------------------------------------------------- Nhận xét

function kiemNhanXet(v: any): { ketLuan: KetLuan; noiDung: string } {
  if (!KET_LUAN.includes(v?.ketLuan)) throw badRequest('Chọn Kết luận: Ổn · Cần cải thiện · Ngừng hợp tác.');
  const noiDung = String(v?.noiDung ?? '').trim();
  if (noiDung.length < 10) throw badRequest('Nhận xét cần ít nhất 10 ký tự.');
  if (noiDung.length > 1000) throw badRequest('Nhận xét tối đa 1000 ký tự.');
  return { ketLuan: v.ketLuan, noiDung };
}

export function ghiNhanXet(p: Principal, tutorId: number, v: unknown): { id: number } {
  canSua(p);
  const n = kiemNhanXet(v);
  const conn = db();
  const t = conn.prepare('SELECT ten FROM tutors WHERE id = ?').get(tutorId) as any;
  if (!t) throw notFound('Không tìm thấy tutor.');
  return tx(() => {
    const id = Number(conn.prepare('INSERT INTO tutor_nhan_xet (tutor_id, ket_luan, noi_dung, nguoi_id, luc) VALUES (?,?,?,?,?)')
      .run(tutorId, n.ketLuan, n.noiDung, p.userId, nowIso()).lastInsertRowid);
    writeAudit({ actorUserId: p.userId, action: 'tutor.nhan_xet', entityType: 'tutor_nhan_xet', entityId: id, entityLabel: t.ten, after: n });
    return { id };
  });
}

/** Sửa / xoá: chỉ người ghi, trong 24 giờ kể từ `luc` (mục 3.1). Sửa không dời `luc` (mốc nhóm chú ý). */
function nhanXetSuaDuoc(p: Principal, id: number): any {
  canSua(p);
  const n = db().prepare('SELECT id, tutor_id, ket_luan, noi_dung, nguoi_id, luc FROM tutor_nhan_xet WHERE id = ?').get(id) as any;
  if (!n) throw notFound('Không tìm thấy nhận xét.');
  if (n.nguoi_id !== p.userId) throw forbidden('Chỉ người ghi sửa / xoá được nhận xét này.');
  if (!trong24h(n.luc)) throw badRequest('Quá 24 giờ — không sửa / xoá được nữa. Ghi nhận xét mới.');
  return n;
}
export function suaNhanXet(p: Principal, id: number, v: unknown): { ok: true } {
  const cu = nhanXetSuaDuoc(p, id);
  const n = kiemNhanXet(v);
  tx(() => {
    db().prepare('UPDATE tutor_nhan_xet SET ket_luan = ?, noi_dung = ?, sua_luc = ? WHERE id = ?').run(n.ketLuan, n.noiDung, nowIso(), id);
    writeAudit({ actorUserId: p.userId, action: 'tutor.nhan_xet_sua', entityType: 'tutor_nhan_xet', entityId: id,
      before: { ketLuan: cu.ket_luan, noiDung: cu.noi_dung }, after: n });
  });
  return { ok: true };
}
export function xoaNhanXet(p: Principal, id: number): { ok: true } {
  const cu = nhanXetSuaDuoc(p, id);
  tx(() => {
    db().prepare('DELETE FROM tutor_nhan_xet WHERE id = ?').run(id);
    writeAudit({ actorUserId: p.userId, action: 'tutor.nhan_xet_xoa', entityType: 'tutor_nhan_xet', entityId: id,
      before: { tutorId: cu.tutor_id, ketLuan: cu.ket_luan, noiDung: cu.noi_dung, luc: cu.luc } });
  });
  return { ok: true };
}

// ---------------------------------------------------------------- Gộp tên gõ tay

const docGoTay = (conn: any) => conn.prepare(
  `SELECT b.id, b.tutor_ten, f.created_at, c.code AS lop FROM case_followup_buoi b JOIN case_followups f ON f.id = b.followup_id
     LEFT JOIN classes c ON c.id = b.lop_id WHERE b.tutor_id IS NULL ORDER BY f.created_at`,
).all() as any[];

/** Tên gõ tay ("Tutor khác") chưa có trong danh sách, gom theo `khoaTen`: số buổi, lớp, ngày. */
export function tenGoTay(p: Principal) {
  canSua(p);
  const nhom = new Map<string, { khoa: string; ten: string; soBuoi: number; lop: string[]; ngay: string[] }>();
  for (const r of docGoTay(db())) {
    const khoa = khoaTen(r.tutor_ten);
    const g = nhom.get(khoa) ?? { khoa, ten: String(r.tutor_ten).trim().replace(/\s+/g, ' '), soBuoi: 0, lop: [], ngay: [] };
    g.soBuoi++;
    if (r.lop && !g.lop.includes(r.lop)) g.lop.push(r.lop);
    const ng = ngayVn(r.created_at);
    if (!g.ngay.includes(ng)) g.ngay.push(ng);
    nhom.set(khoa, g);
  }
  return [...nhom.values()].sort((a, b) => b.soBuoi - a.soBuoi || a.ten.localeCompare(b.ten, 'vi'));
}

export type GoiGop = { tutorId: number; buoiIds: number[] }[];
const laId = (x: unknown) => Number.isInteger(x) && (x as number) > 0;

/** Gộp: mỗi tên (khoá) → một tutor có sẵn; đặt `tutor_id` cho các buổi đó (giữ `tutor_ten`), một giao dịch. Trả id mục nhật ký để Hoàn tác. */
export function gopTen(p: Principal, v: { muc?: unknown }): { nhatKyId: number; soBuoi: number } {
  canSua(p);
  const muc = Array.isArray(v?.muc) ? v.muc as any[] : [];
  if (!muc.length || muc.some((m) => typeof m?.khoa !== 'string' || !laId(m?.tutorId))) throw badRequest('Chọn tutor cho ít nhất một tên.');
  const conn = db();
  const co = new Set((conn.prepare('SELECT id FROM tutors').all() as any[]).map((r) => r.id));
  if (muc.some((m) => !co.has(m.tutorId))) throw badRequest('Tutor đã chọn không còn trong danh sách.');
  return tx(() => {
    const ds = docGoTay(conn);
    const hoanTac = muc.map((m) => {
      const buoiIds = ds.filter((r) => khoaTen(r.tutor_ten) === m.khoa).map((r) => r.id as number);
      theoLo(buoiIds, (lo, ph) => conn.prepare(`UPDATE case_followup_buoi SET tutor_id = ? WHERE tutor_id IS NULL AND id IN (${ph})`).run(m.tutorId, ...lo), 800);
      return { tutorId: m.tutorId as number, buoiIds };
    }).filter((h) => h.buoiIds.length);
    writeAudit({ actorUserId: p.userId, action: 'tutor.gop_ten', entityType: 'tutor', after: { hoanTac } });
    const nhatKyId = (conn.prepare('SELECT last_insert_rowid() AS id').get() as any).id as number;
    return { nhatKyId, soBuoi: hoanTac.reduce((a, h) => a + h.buoiIds.length, 0) };
  });
}

/**
 * Hoàn tác gộp: đọc ĐÚNG mục nhật ký `tutor.gop_ten` của chính người gọi (không tin danh sách buổi web gửi) rồi đặt lại NULL các dòng của lần
 * gộp còn trỏ tutor đó (dòng đã đổi sang tutor khác giữ nguyên).
 */
export function hoanTacGop(p: Principal, v: { nhatKyId?: unknown }): { ok: true } {
  canSua(p);
  if (!laId(v?.nhatKyId)) throw badRequest('Không tìm thấy lần gộp để hoàn tác.');
  const conn = db();
  const nk = conn.prepare('SELECT actor_user_id, action, after_json FROM audit_logs WHERE id = ?').get(v.nhatKyId) as any;
  if (!nk || nk.action !== 'tutor.gop_ten') throw notFound('Không tìm thấy lần gộp để hoàn tác.');
  if (nk.actor_user_id !== p.userId) throw forbidden('Chỉ người gộp hoàn tác được lần gộp này.');
  const ds = ((JSON.parse(nk.after_json ?? '{}').hoanTac ?? []) as GoiGop).filter((h) => laId(h?.tutorId) && Array.isArray(h?.buoiIds));
  tx(() => {
    for (const h of ds) {
      theoLo(h.buoiIds.filter(laId), (lo, ph) => conn.prepare(`UPDATE case_followup_buoi SET tutor_id = NULL WHERE tutor_id = ? AND id IN (${ph})`).run(h.tutorId, ...lo), 800);
    }
    writeAudit({ actorUserId: p.userId, action: 'tutor.gop_hoan_tac', entityType: 'tutor', entityId: v.nhatKyId as number, after: { hoanTac: ds } });
  });
  return { ok: true };
}
