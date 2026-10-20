/**
 * OV-15g — LỊCH SỬ THAY ĐỔI (C22): MỘT đường đọc `GET /lich-su?loai=&id=&loc=&tiep=` cho mọi đối tượng, cùng một dạng mục
 * `{id, luc, nguoi, nguon, lyDo, truong[{ten, cu, moi, doiTuong?}]}` (mới nhất trước, 20 mục / trang). Chỉ đọc — Lịch sử ≠ Hoàn tác ≠ Thông báo.
 *  · hv        — hồ sơ HV: `lichSuSua` (OV-13j) + lịch thi (OV-15f).
 *  · lop       — thông tin lớp · tiến độ (mốc, tuần) · phân công GV (`audit_logs` entity `class`); `phan-cong` = lop lọc sẵn phân công.
 *  · gop-y     — góp ý tuần của lớp (`gop_y_tuan.*`, entity HV, nhãn bắt đầu bằng mã lớp).
 *  · nhap-hv   — các lô nhập HV hàng loạt vào lớp: MỘT mục mỗi lô, mở ra từng em.
 *  · thi-that  — kết quả thi thật · Bước tiếp · Gia hạn của MỘT lộ trình.
 *  · o         — ô điểm của MỘT lượt Test (điểm, "-", nhận xét, GV chấm S — `scoreHistoryOf`) gộp lịch thi từng kỹ năng (`attempt_schedule_history`).
 * Quyền đọc = quyền xem đối tượng (máy chủ kiểm; ngoài phạm vi 403, không có 404). Lưu lại nguyên giá trị (cũ = mới) không thành mục.
 */
import { db } from '../db.ts';
import { can, require_, requireXemLuotCham, type Principal } from '../permissions.ts';
import { badRequest, forbidden, notFound } from '../util.ts';
import { CYCLE_OUTCOME_LABEL, NHAN_SAU_THI, PERMISSIONS, tenMon, tuanLich, type LuaChonSauThi } from '../../../shared/domain/index.ts';
import { demoToday, getConfig } from '../demoConfig.ts';
import { lichSuSua } from '../students/lichSuSua.ts';
import { scoreHistoryOf } from '../fasttrack/attempts.ts';
import { MOC_LICH_SU } from '../migrate/prOv15g.ts';

export type TruongLs = { ten: string; cu: string | null; moi: string | null; doiTuong?: string };
export type MucLs = { id: number | string; luc: string; nguoi: string; nguon: string | null; lyDo: string | null; truong: TruongLs[] };
export type TrangLs = { dong: MucLs[]; tiep: number | null; nhom: { key: string; nhan: string }[]; batDau: string | null };

const LOAI = ['hv', 'lop', 'phan-cong', 'gop-y', 'nhap-hv', 'thi-that', 'o'] as const;
const TRANG = 20;
const LO = 60;
const GOP_MS = 5000;

export function lichSu(p: Principal, q: { loai?: string | null; id?: number | null; loc?: string | null; tiep?: number | null }): TrangLs {
  const loai = q.loai as (typeof LOAI)[number];
  if (!LOAI.includes(loai)) throw badRequest('Loại lịch sử không hợp lệ.');
  const id = q.id;
  if (!id || !Number.isInteger(id) || id < 1) throw badRequest('Thiếu đối tượng cần xem lịch sử.');
  const loc = q.loc || null;
  const tiep = q.tiep ?? null;
  switch (loai) {
    case 'hv': {
      const r = lichSuSua(p, id, { loai: loc ?? undefined, truoc: tiep });
      return { dong: r.dong.map((d) => ({ ...d, lyDo: null })), tiep: r.tiep, nhom: NHOM_HV, batDau: null };
    }
    case 'lop': case 'phan-cong': case 'gop-y': case 'nhap-hv': return cuaLop(p, loai, id, loai === 'phan-cong' ? 'phan-cong' : loc, tiep);
    case 'thi-that': return thiThat(p, id, tiep);
    case 'o': return oDiem(p, id, loc, tiep);
  }
}

const NHOM_HV = [{ key: 'thong-tin', nhan: 'Thông tin' }, { key: 'target', nhan: 'Target / lộ trình' }, { key: 'trang-thai', nhan: 'Trạng thái' }];
const NHOM_LOP = [{ key: 'thong-tin', nhan: 'Thông tin' }, { key: 'tien-do', nhan: 'Tiến độ' }, { key: 'phan-cong', nhan: 'Phân công' }];
const NHOM_O = [{ key: 'diem', nhan: 'Điểm' }, { key: 'nhan-xet', nhan: 'Nhận xét' }, { key: 'lich', nhan: 'Lịch thi' }];

/** Mốc bắt đầu ghi (migrate OV-15g) — chỉ báo ở TRANG CUỐI và khi đối tượng có từ trước mốc. */
function batDauNeu(coTu: string | null | undefined, tiep: number | null): string | null {
  const moc = getConfig(MOC_LICH_SU);
  return tiep === null && moc && coTu && coTu < moc ? moc.slice(0, 10) : null;
}

// ------------------------------------------------------------------ đọc nhật ký theo con trỏ id

type DongNk = { id: number; action: string; label: string | null; b: Record<string, any>; f: Record<string, any>; luc: string; uid: number | null; ten: string | null; hv: string | null };
type TruongNhom = TruongLs & { n?: string };
type Khoi = MucLs & { id: number; uid: number | null; action: string; truong: TruongNhom[] };

/**
 * Nhật ký `audit_logs` mới → cũ theo con trỏ `a.id < tiep`, mỗi dòng → một mục (`doi`); dòng của MỘT lần lưu (cùng người, cùng nguồn, ≤ 5 giây,
 * `gop` cho phép) gộp một mục — trường đổi hai lần lấy cũ của lần đầu, mới của lần sau (như OV-13j). Lọc nhóm có thể làm trống cả lô → đọc tối đa 4 lô.
 */
function docNhatKy(where: string, thamSo: unknown[], tiep: number | null, loc: string | null,
  doi: (r: DongNk) => { nguon: string | null; lyDo: string | null; truong: TruongNhom[] } | null, gop: (a: string, b: string) => boolean = () => false): { dong: MucLs[]; tiep: number | null } {
  const cau = db().prepare(
    `SELECT a.id, a.action, a.entity_label label, a.before_json b, a.after_json f, a.created_at luc, a.actor_user_id uid, u.full_name ten, s.full_name hv
       FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id LEFT JOIN students s ON a.entity_type = 'student' AND s.id = a.entity_id
      WHERE ${where} AND a.id < ? ORDER BY a.id DESC LIMIT ?`,
  );
  const khoi: Khoi[] = [];
  let truoc = tiep ?? Number.MAX_SAFE_INTEGER;
  let conNua = true;
  for (let vong = 0; vong < 4 && conNua && khoi.length <= TRANG; vong += 1) {
    const rows = cau.all(...thamSo, truoc, LO) as any[];
    conNua = rows.length === LO;
    if (rows.length) truoc = rows[rows.length - 1].id;
    for (const r of rows) {
      const m = doi({ ...r, b: docJson(r.b), f: docJson(r.f) });
      const truong = m?.truong.filter((x) => (!loc || x.n === loc) && x.cu !== x.moi) ?? [];
      if (!m || !truong.length) continue;
      const tr = khoi[khoi.length - 1];
      if (tr && tr.uid === r.uid && tr.nguon === m.nguon && Math.abs(Date.parse(tr.luc) - Date.parse(r.luc)) <= GOP_MS && gop(tr.action, r.action)) {
        /* Sắp mới → cũ: dòng này CŨ hơn khối — giá trị cũ của nó là "cũ" của cả khối. */
        for (const x of truong) {
          const co = tr.truong.find((y) => y.ten === x.ten && y.doiTuong === x.doiTuong);
          if (co) co.cu = x.cu; else tr.truong.push(x);
        }
        tr.id = r.id; tr.lyDo ??= m.lyDo;
      } else {
        khoi.push({ id: r.id, luc: r.luc, uid: r.uid, action: r.action, nguoi: r.ten ?? 'Hệ thống', nguon: m.nguon, lyDo: m.lyDo, truong });
      }
    }
  }
  /* Còn dòng chưa đọc → khối cuối có thể nối tiếp ở trang sau: bỏ, đọc lại từ đó (con trỏ = id nhỏ nhất đã giữ). */
  if (conNua && khoi.length > 1) khoi.pop();
  const trang = khoi.slice(0, TRANG);
  return {
    dong: trang.map(({ uid: _u, action: _a, ...k }) => ({ ...k, truong: (k.truong as TruongNhom[]).filter((x) => x.cu !== x.moi).map(({ n: _n, ...x }) => x) }))
      .filter((k) => k.truong.length),
    tiep: conNua || khoi.length > TRANG ? trang[trang.length - 1]?.id ?? truoc : null,
  };
}

function docJson(s: string | null): Record<string, any> {
  try { const v = JSON.parse(s ?? 'null'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch { return {}; }
}

const chu = (v: unknown): string | null => (v === null || v === undefined || v === '' ? null : String(v));
const band = (v: unknown): string | null => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? chu(v) : Number(v).toFixed(1));
const ngay = (v: unknown): string | null => { const s = chu(v); return s && /^\d{4}-\d{2}-\d{2}/.test(s) ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : s; };
const coKhong = (v: unknown): string => (v ? 'Có' : 'Không');

/** Tên của các id — MỘT câu mỗi bảng (không N+1). */
function tenTheoId(bang: 'users' | 'report_periods', ids: Iterable<number>): Map<number, string> {
  const ds = [...new Set(ids)].filter((x) => Number.isInteger(x)).slice(0, 400);
  if (!ds.length) return new Map();
  const cot = bang === 'users' ? 'full_name' : 'code';
  return new Map((db().prepare(`SELECT id, ${cot} t FROM ${bang} WHERE id IN (${ds.map(() => '?').join(',')})`).all(...ds) as any[]).map((r) => [r.id, r.t]));
}

// ------------------------------------------------------------------ lớp: thông tin · tiến độ · phân công · góp ý · nhập HV

const VIEC_LOP = ['class.create', 'class.info', 'class.progress', 'class.progress.doi_bai', 'class.assign', 'class.finished', 'class.reopened'];
const TUAN_HOC = (v: unknown) => (v === null || v === undefined ? 'Mặc định' : `tuần ${v}`);

function cuaLop(p: Principal, loai: 'lop' | 'phan-cong' | 'gop-y' | 'nhap-hv', classId: number, loc: string | null, tiep: number | null): TrangLs {
  const c = db().prepare('SELECT id, code, programme_code ct, created_at FROM classes WHERE id = ?').get(classId) as { id: number; code: string; ct: string | null; created_at: string } | undefined;
  if (!c) throw notFound('Không tìm thấy lớp.');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');   // cùng quyền mở hồ sơ lớp (`classOverview`)

  if (loai === 'gop-y') {
    const r = docNhatKy(`a.action IN ('gop_y_tuan.ghi', 'gop_y_tuan.xoa') AND a.entity_type = 'student'
        AND a.entity_id IN (SELECT student_id FROM enrollments WHERE class_id = ?) AND a.entity_label LIKE ?`, [classId, `${c.code} · %`], tiep, null,
    (r) => ({ nguon: null, lyDo: null, truong: [{ ten: `Góp ý ${String(r.label).slice(c.code.length + 3)}`, doiTuong: r.hv ?? 'Học viên đã xoá', cu: chu(r.b.noiDung), moi: chu(r.f.noiDung) }] }));
    return { ...r, nhom: [], batDau: null };
  }
  if (loai === 'nhap-hv') {
    const r = docNhatKy(`a.action = 'student.bulk_add' AND a.entity_type = 'class' AND a.entity_id = ?`, [classId], tiep, null, (r) => ({
      nguon: `Thêm học viên hàng loạt · ${r.f.lop ?? c.code}`, lyDo: null,
      truong: [...(Array.isArray(r.f.hv) ? r.f.hv : []).map((h: any) => ({ ten: 'Học viên', doiTuong: String(h.ten), cu: null, moi: 'Đã thêm vào lớp' })),
        ...(r.f.skipped ? [{ ten: 'Dòng bỏ qua', cu: null, moi: String(r.f.skipped) }] : [])],
    }));
    return { ...r, nhom: [], batDau: batDauNeu(c.created_at, r.tiep) };
  }

  /* Phân công ghi ô:người (`listening:9`, `GVCN:12`) — đổi ra tên cả trang một câu. */
  const tho = docNhatKy(`a.entity_type = 'class' AND a.entity_id = ? AND a.action IN (${VIEC_LOP.map(() => '?').join(',')})`, [classId, ...VIEC_LOP], tiep, loc,
    (r) => truongLop(r, c.ct), (x, y) => x.startsWith('class.progress') && y.startsWith('class.progress'));
  const nguoi = tenTheoId('users', tho.dong.flatMap((d) => d.truong.flatMap((x) => [x.cu, x.moi]).flatMap((v) => (v?.match(/@\d+/g) ?? []).map((m) => Number(m.slice(1))))));
  const tuan = tenTheoId('report_periods', tho.dong.flatMap((d) => d.truong.flatMap((x) => [x.cu, x.moi]).flatMap((v) => (v?.match(/#\d+/g) ?? []).map((m) => Number(m.slice(1))))));
  const hien = (v: string | null) => v?.replace(/@(\d+)/g, (_m, i) => nguoi.get(Number(i)) ?? 'Người dùng đã xoá').replace(/#(\d+)/g, (_m, i) => tuan.get(Number(i)) ?? `#${i}`) ?? null;
  const dong = tho.dong.map((d) => ({ ...d, truong: d.truong.map((x) => ({ ...x, cu: hien(x.cu), moi: hien(x.moi) })) }));
  return { dong, tiep: tho.tiep, nhom: loai === 'phan-cong' ? [] : NHOM_LOP, batDau: batDauNeu(c.created_at, tho.tiep) };
}

function truongLop(r: DongNk, ct: string | null): { nguon: string | null; lyDo: string | null; truong: TruongNhom[] } | null {
  const { b, f } = r;
  const tt = (ten: string, cu: unknown, moi: unknown): TruongNhom => ({ ten, cu: chu(cu), moi: chu(moi), n: 'thong-tin' });
  switch (r.action) {
    case 'class.create':
      return { nguon: 'Tạo lớp', lyDo: null, truong: [tt('Mã lớp', null, r.label), tt('Chương trình', null, f.kind), tt('Lộ trình', null, f.route), tt('Ghi chú', null, f.note)] };
    case 'class.info': {
      const ds: TruongNhom[] = [];
      if ('code' in f) ds.push(tt('Mã lớp', b.code, f.code));
      if ('programme_code' in f) ds.push(tt('Chương trình', b.programmeCode, f.programme_code));
      if ('route' in f) ds.push(tt('Lộ trình', b.route, f.route));
      if ('note' in f) ds.push(tt('Ghi chú', b.note, f.note));
      return { nguon: null, lyDo: null, truong: ds };
    }
    case 'class.progress': {
      const ds: TruongNhom[] = [];
      if ('startPeriodId' in f) ds.push({ ten: 'Tuần khai giảng', cu: b.startPeriodId ? `#${b.startPeriodId}` : null, moi: f.startPeriodId ? `#${f.startPeriodId}` : null, n: 'tien-do' });
      if ('progressWeek' in f) ds.push({ ten: 'Tuần Progress Test', cu: TUAN_HOC(b.progressWeek), moi: TUAN_HOC(f.progressWeek), n: 'tien-do' });
      if ('finalWeek' in f) ds.push({ ten: 'Tuần Final Test', cu: TUAN_HOC(b.finalWeek), moi: TUAN_HOC(f.finalWeek), n: 'tien-do' });
      return { nguon: null, lyDo: null, truong: ds };
    }
    case 'class.progress.doi_bai':
      /* Cùng lần lưu đổi mốc: bài chưa thi của các em dời theo (PR-LTGON luật 6). */
      return { nguon: null, lyDo: null, truong: [{ ten: `Bài ${r.label === 'final' ? 'Final' : 'Progress'} Test chưa thi (${f.kyNang ?? 0} kỹ năng)`, cu: chu(b.week), moi: chu(f.week), n: 'tien-do' }] };
    case 'class.assign': {
      const nguon = f.via === 'gvcn' ? 'GVCN đổi GV bộ môn' : f.via === 'tao_lop' ? 'Tạo lớp' : null;
      if (!Array.isArray(f.sau)) {
        /* Dòng cũ (trước OV-15g) chỉ ghi số dòng thêm / kết thúc — không bịa tên. */
        return { nguon, lyDo: null, truong: [{ ten: 'Phân công GV', cu: null, moi: `thêm ${f.added ?? 0} · kết thúc ${f.ended ?? 0}`, n: 'phan-cong' }] };
      }
      const theoO = (ds: unknown) => {
        const m = new Map<string, string[]>();
        for (const x of Array.isArray(ds) ? ds : []) { const [o, u] = String(x).split(':'); m.set(o, [...(m.get(o) ?? []), `@${u}`]); }
        return m;
      };
      const cu = theoO(b.truoc ?? f.truoc), moi = theoO(f.sau);
      return {
        nguon, lyDo: null, truong: [...new Set([...cu.keys(), ...moi.keys()])].map((o) => ({
          ten: o === 'GVCN' ? 'GVCN' : tenMon(ct, o), cu: cu.get(o)?.sort().join(', ') ?? null, moi: moi.get(o)?.sort().join(', ') ?? null, n: 'phan-cong',
        })),
      };
    }
    case 'class.finished': case 'class.reopened': {
      const ket = r.action === 'class.finished';
      return { nguon: null, lyDo: chu(f.lyDo), truong: [tt('Trạng thái lớp', ket ? 'Đang học' : 'Đã kết thúc', ket ? 'Đã kết thúc' : 'Đang học')] };
    }
    default: return null;
  }
}

// ------------------------------------------------------------------ thi thật · Bước tiếp · Gia hạn (một lộ trình)

const VIEC_THI = ['cycle.thi_that', 'cycle.outcome', 'cycle.buoc_tiep', 'cycle.han_sau_thi'];
/** Khoá trong `after` → [tên, cách hiện, khoá cũ trong `before` nếu khác]. */
const TRUONG_THI: Record<string, [string, (v: unknown) => string | null, string?]> = {
  ngayThi: ['Ngày thi', ngay], khongThi: ['Không thi', coKhong],
  l: ['L', band], r: ['R', band], w: ['W', band], s: ['S', band], ovr: ['OVR', band],
  ketLuan: ['Kết luận', (v) => (v ? CYCLE_OUTCOME_LABEL[v as keyof typeof CYCLE_OUTCOME_LABEL] ?? String(v) : null)],
  outcome: ['Kết luận', (v) => (v ? CYCLE_OUTCOME_LABEL[v as keyof typeof CYCLE_OUTCOME_LABEL] ?? String(v) : null)],
  score: ['Điểm', band, 'outcome_score'], note: ['Ghi chú', chu, 'outcome_note'], ghiChu: ['Ghi chú', chu],
  buocTiep: ['Bước tiếp', (v) => (v ? NHAN_SAU_THI[v as LuaChonSauThi] ?? String(v) : null)],
  buocTiepHen: ['Hẹn bắt đầu', (v) => (v ? tuanLich(String(v), demoToday()) : null)],
  hanSauThi: ['Hạn sau thi', ngay],
};

function thiThat(p: Principal, cycleId: number, tiep: number | null): TrangLs {
  const c = db().prepare('SELECT student_id FROM learning_cycles WHERE id = ?').get(cycleId) as { student_id: number } | undefined;
  if (!c) throw notFound('Không tìm thấy lộ trình.');
  if (!can(p, PERMISSIONS.STUDENT_VIEW, { studentId: c.student_id })) throw forbidden('Học viên này nằm ngoài phạm vi bạn được xem.');
  const r = docNhatKy(`a.entity_type = 'learning_cycle' AND a.entity_id = ? AND a.action IN (${VIEC_THI.map(() => '?').join(',')})`, [cycleId, ...VIEC_THI], tiep, null, (r) => ({
    nguon: r.uid === null ? 'Hệ thống' : null, lyDo: chu(r.f.lyDo),
    truong: Object.keys(r.f).filter((k) => TRUONG_THI[k]).map((k) => {
      const [ten, hien, cuKhoa] = TRUONG_THI[k];
      return { ten, cu: hien(r.b[cuKhoa ?? k] ?? (k === 'khongThi' ? false : null)), moi: hien(r.f[k]) };
    }),
  }));
  return { ...r, nhom: [], batDau: null };
}

// ------------------------------------------------------------------ ô điểm của một lượt (điểm · "-" · nhận xét · GV chấm · lịch)

const TRANG_THAI_THI: Record<string, string> = { scheduled: 'Theo lịch', sat: 'Đã thi', absent: 'Vắng', cancelled: 'Huỷ', excused: 'Không dự thi' };

function oDiem(p: Principal, attemptId: number, loc: string | null, tiep: number | null): TrangLs {
  const a = db().prepare('SELECT class_id, student_id FROM assessment_attempts WHERE id = ?').get(attemptId) as { class_id: number | null; student_id: number } | undefined;
  if (!a) throw notFound('Không tìm thấy lượt Test.');
  requireXemLuotCham(p, { classId: a.class_id, studentId: a.student_id }, 'Lượt Test này nằm ngoài phạm vi bạn được xem.');   // cùng quyền hồ sơ MT
  type Dong = { luc: string; nguoi: string; lyDo: string | null; khoa: string; t: TruongNhom };
  const trong = (v: string) => (v === 'Trống' ? null : v);
  const diem: Dong[] = scoreHistoryOf(attemptId, true).map((h) => ({
    luc: h.createdAt, nguoi: h.actorName ?? 'Hệ thống', lyDo: h.lyDo, khoa: `d${h.id}`,
    t: {
      ten: `${h.skillLabel} · ${h.kind !== 'nhan_xet' ? 'Điểm' : h.phan === 'nhom' ? 'Nhóm nguyên nhân' : h.phan === 'gv' ? 'GV chấm' : 'Nhận xét'}`,
      cu: trong(h.before), moi: trong(h.after), n: h.kind === 'nhan_xet' ? 'nhan-xet' : 'diem',
    },
  }));
  /* shortcut: đọc tối đa 300 dòng lịch của MỘT lượt (thực tế < 30), quá thì cắt cũ nhất — nâng lên con trỏ nếu lượt nào chạm trần. */
  const lich: Dong[] = (db().prepare(
    `SELECT h.id, h.field, h.old_value cu, h.new_value moi, h.reason, h.created_at luc, u.full_name ten FROM attempt_schedule_history h
       LEFT JOIN users u ON u.id = h.actor_user_id WHERE h.attempt_id = ? ORDER BY h.id DESC LIMIT 300`,
  ).all(attemptId) as any[]).map((h) => ({
    luc: h.luc, nguoi: h.ten ?? 'Hệ thống', lyDo: chu(h.reason), khoa: `l${h.id}`,
    t: { ten: `Lịch · ${h.field === 'planned_period' ? 'Tuần thi' : tenMon(null, String(h.field))}`, cu: TRANG_THAI_THI[h.cu] ?? chu(h.cu), moi: TRANG_THAI_THI[h.moi] ?? chu(h.moi), n: 'lich' },
  }));
  /* Mới → cũ; dòng của MỘT lần lưu (cùng người, ≤ 5 giây) là một mục. Trang theo vị trí (`tiep` = số mục đã xem) — một lượt chỉ vài chục dòng. */
  const muc: MucLs[] = [];
  for (const d of [...diem, ...lich].filter((x) => (!loc || x.t.n === loc) && x.t.cu !== x.t.moi).sort((x, y) => y.luc.localeCompare(x.luc))) {
    const tr = muc[muc.length - 1];
    const { n: _n, ...t } = d.t;
    if (tr && tr.nguoi === d.nguoi && Date.parse(tr.luc) - Date.parse(d.luc) <= GOP_MS) { tr.truong.push(t); tr.lyDo ??= d.lyDo; }
    else muc.push({ id: d.khoa, luc: d.luc, nguoi: d.nguoi, nguon: null, lyDo: d.lyDo, truong: [t] });
  }
  const tu = tiep ?? 0;
  const trang = muc.slice(tu, tu + TRANG);
  const ten = tenTheoId('users', trang.flatMap((m) => m.truong.flatMap((x) => [x.cu, x.moi])).filter((v) => /^@\d+$/.test(v ?? '')).map((v) => Number(v!.slice(1))));
  for (const m of trang) for (const x of m.truong) for (const k of ['cu', 'moi'] as const) if (/^@\d+$/.test(x[k] ?? '')) x[k] = ten.get(Number(x[k]!.slice(1))) ?? 'Người dùng đã xoá';
  return { dong: trang, tiep: muc.length > tu + TRANG ? tu + TRANG : null, nhom: NHOM_O, batDau: null };
}
