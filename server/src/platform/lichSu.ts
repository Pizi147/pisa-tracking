/**
 * OV-15g — LỊCH SỬ THAY ĐỔI (C22): MỘT đường đọc `GET /lich-su?loai=&id=&loc=&tiep=` cho mọi đối tượng, cùng một dạng mục
 * `{id, luc, nguoi, nguon, lyDo, truong[{ten, cu, moi, doiTuong?}]}` (mới nhất trước, 20 mục / trang). Chỉ đọc — Lịch sử ≠ Hoàn tác ≠ Thông báo.
 *  · hv        — hồ sơ HV: `lichSuSua` (OV-13j) + lịch thi (OV-15f).
 *  · lop       — thông tin lớp · tiến độ (mốc, tuần) · phân công GV (`audit_logs` entity `class`); `phan-cong` = lop lọc sẵn phân công.
 *  · gop-y     — góp ý tuần của lớp (`gop_y_tuan.*`, entity HV, nhãn bắt đầu bằng mã lớp).
 *  · bai-lop   — bài trên lớp của MỘT HV (`bai_tren_lop.*`, SV-BAI-LOP); quyền = xem hồ sơ HV.
 *  · s-ex     — lượt S Expert của MỘT HV (`s_expert.*`, SV-S-EXPERT); quyền = xem hồ sơ HV.
 *  · nhap-hv   — các lô nhập HV hàng loạt vào lớp: MỘT mục mỗi lô, mở ra từng em.
 *  · thi-that  — kết quả thi thật · Bước tiếp · Gia hạn của MỘT lộ trình.
 *  · o         — ô điểm của MỘT lượt Test (điểm, "-", nhận xét, GV chấm S — `scoreHistoryOf`) gộp lịch thi từng kỹ năng (`attempt_schedule_history`).
 * Quyền đọc = quyền xem đối tượng (máy chủ kiểm; ngoài phạm vi 403, không có 404). Lưu lại nguyên giá trị (cũ = mới) không thành mục.
 */
import { db, theoLo } from '../db.ts';
import { require_, requireXemLuotCham, type Principal } from '../permissions.ts';
import { badRequest, forbidden, notFound } from '../util.ts';
import { CYCLE_OUTCOME_LABEL, docMaLuot, kyThiCuaChuongTrinh, NHAN_SAU_THI, nhanMaLuot, PERMISSIONS, tenMon, tuanLich, type LuaChonSauThi } from '../../../shared/domain/index.ts';
import { demoToday, getConfig } from '../demoConfig.ts';
import { lichSuSua, truongSuaCaLop, xemLichSuHv } from '../students/lichSuSua.ts';
import { scoreHistoryOf } from '../fasttrack/attempts.ts';
import { MOC_LICH_SU } from '../migrate/prOv15g.ts';

/** `heThong`: giá trị là nhãn hệ thống (Có / Không, trạng thái, kết luận, "tuần n"…) — web dịch theo tiếng của trang; chữ người gõ giữ nguyên. */
export type TruongLs = { ten: string; cu: string | null; moi: string | null; doiTuong?: string; heThong?: true };
export type MucLs = { id: number | string; luc: string; nguoi: string; nguon: string | null; lyDo: string | null; truong: TruongLs[] };
export type TrangLs = { dong: MucLs[]; tiep: number | null; nhom: { key: string; nhan: string }[]; batDau: string | null };

const LOAI = ['hv', 'lop', 'phan-cong', 'gop-y', 'bai-lop', 's-ex', 'nhap-hv', 'thi-that', 'o'] as const;
const TRANG = 20;
const LO = 60;
const GOP_MS = 5000;

export function lichSu(p: Principal, q: { loai?: string | null; id?: number | null; loc?: string | null; tiep?: number | null }): TrangLs {
  const r = docLichSu(p, q);
  for (const m of r.dong) for (const x of m.truong) if (NHAN_HE_THONG.has(x.ten) || x.ten.startsWith('Lịch · ')) x.heThong = true;
  return r;
}

const NHAN_HE_THONG = new Set(['Trạng thái', 'KCK', 'Không thi', 'Kết luận', 'Bước tiếp', 'Trạng thái lớp', 'Kết luận lịch thi', 'Tuần Progress Test', 'Tuần Final Test']);

function docLichSu(p: Principal, q: { loai?: string | null; id?: number | null; loc?: string | null; tiep?: number | null }): TrangLs {
  const loai = q.loai as (typeof LOAI)[number];
  if (!LOAI.includes(loai)) throw badRequest('Loại lịch sử không hợp lệ.');
  const id = q.id;
  if (!id || !Number.isInteger(id) || id < 1) throw badRequest('Thiếu đối tượng cần xem lịch sử.');
  const loc = q.loc || null;
  const tiep = q.tiep ?? null;
  switch (loai) {
    case 'hv': {
      const r = lichSuSua(p, id, { loai: loc ?? undefined, truoc: tiep });
      const tao = r.tiep === null ? (db().prepare('SELECT created_at t FROM students WHERE id = ?').get(id) as { t: string } | undefined)?.t : null;
      return { dong: r.dong.map((d) => ({ ...d, lyDo: null })), tiep: r.tiep, nhom: NHOM_HV, batDau: batDauNeu(tao, r.tiep) };
    }
    case 'lop': case 'phan-cong': case 'gop-y': case 'nhap-hv': return cuaLop(p, loai, id, loai === 'phan-cong' ? 'phan-cong' : loc, tiep);
    case 'bai-lop': return baiLop(p, id, tiep);
    case 's-ex': return sEx(p, id, tiep);
    case 'thi-that': return thiThat(p, id, tiep);
    case 'o': return oDiem(p, id, loc, tiep);
  }
}

const NHOM_HV = [{ key: 'thong-tin', nhan: 'Thông tin' }, { key: 'target', nhan: 'Target / lộ trình' }, { key: 'trang-thai', nhan: 'Trạng thái' }];
const NHOM_LOP = [{ key: 'thong-tin', nhan: 'Thông tin' }, { key: 'tien-do', nhan: 'Tiến độ' }, { key: 'phan-cong', nhan: 'Phân công' }];
const NHOM_O = [{ key: 'diem', nhan: 'Điểm' }, { key: 'nhan-xet', nhan: 'Nhận xét' }, { key: 'lich', nhan: 'Lịch Test' }];

/** Mốc bắt đầu ghi (migrate OV-15g) — chỉ báo ở TRANG CUỐI và khi đối tượng có từ trước mốc. OV-15i1: một mốc cho mọi loại (hv, lớp, góp ý,
 *  nhập HV, thi thật, ô điểm) — mốc OV-15g là lúc máy chủ ghi đủ mọi loại; trước đó loại nào cũng có thể thiếu dòng. */
function batDauNeu(coTu: string | null | undefined, tiep: number | null): string | null {
  const moc = getConfig(MOC_LICH_SU);
  return tiep === null && moc && coTu && coTu < moc ? moc.slice(0, 10) : null;
}

// ------------------------------------------------------------------ đọc nhật ký theo con trỏ id

type DongNk = { id: number; action: string; label: string | null; b: Record<string, any>; f: Record<string, any>; luc: string; uid: number | null; ten: string | null; hv: string | null };
/** `n` nhóm lọc · `hvId` em của dòng nhập HV · `lo` [tu, den] dòng nhật ký của một lần Sửa cả lớp — chỉ dùng trong máy chủ, bỏ trước khi trả. */
type TruongNhom = TruongLs & { n?: string; hvId?: number; lo?: [number, number] };
type Khoi = MucLs & { id: number; uid: number | null; action: string; truong: TruongNhom[] };

/**
 * Nhật ký `audit_logs` mới → cũ theo con trỏ `a.id < tiep`, mỗi dòng → một mục (`doi`); dòng của MỘT lần lưu (cùng người, cùng nguồn, ≤ 5 giây,
 * `gop` cho phép) gộp một mục — trường đổi hai lần lấy cũ của lần đầu, mới của lần sau (như OV-13j). Lọc nhóm có thể làm trống cả lô → đọc tối đa 4 lô.
 */
function docNhatKy(where: string, thamSo: unknown[], tiep: number | null, loc: string | null,
  doi: (r: DongNk) => { nguon: string | null; lyDo: string | null; truong: TruongNhom[] } | null, gop: (a: string, b: string) => boolean = () => false): { dong: MucLs[]; tiep: number | null } {
  const cau = db().prepare(sqlNhatKy(where));
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

export const sqlNhatKy = (where: string) =>
  `SELECT a.id, a.action, a.entity_label label, a.before_json b, a.after_json f, a.created_at luc, a.actor_user_id uid, u.full_name ten, s.full_name hv
     FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id LEFT JOIN students s ON a.entity_type = 'student' AND s.id = a.entity_id
    WHERE ${where} AND a.id < ? ORDER BY a.id DESC LIMIT ?`;

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

// ------------------------------------------------------------------ bài trên lớp (SV-BAI-LOP)

function baiLop(p: Principal, studentId: number, tiep: number | null): TrangLs {
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  const today = demoToday();
  const diem = (x: Record<string, any>) => (x.diem == null ? null : `${x.diem} / ${x.thang}`);   // SV-BAI-LOP-2: điểm / thang trống được
  const tuan = (x: Record<string, any>) => (x.tuan ? tuanLich(x.tuan, today) : null);
  const r = docNhatKy(`a.entity_type = 'student' AND a.entity_id = ? AND a.action IN ('bai_tren_lop.them', 'bai_tren_lop.sua', 'bai_tren_lop.xoa')`, [studentId], tiep, null,
    ({ b, f, label }) => {
      const doiTuong = `${label ?? ''} · ${f.tenBai ?? b.tenBai ?? ''}`;
      return { nguon: null, lyDo: null, truong: ([
        ['Kỹ năng', chu(b.kyNang), chu(f.kyNang)], ['Tên bài', chu(b.tenBai), chu(f.tenBai)], ['Điểm', diem(b), diem(f)], ['Band', b.band == null ? null : String(b.band), f.band == null ? null : String(f.band)],
        ['Tuần', tuan(b), tuan(f)], ['Nhận xét', chu(b.nhanXet), chu(f.nhanXet)],
      ] as const).map(([ten, cu, moi]) => ({ ten, cu, moi, doiTuong })) };
    });
  return { ...r, nhom: [], batDau: null };
}

// ------------------------------------------------------------------ S Expert (SV-S-EXPERT)

function sEx(p: Principal, studentId: number, tiep: number | null): TrangLs {
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  const today = demoToday();
  const r = docNhatKy(`a.entity_type = 'student' AND a.entity_id = ? AND a.action IN ('s_expert.them', 's_expert.sua', 's_expert.cham', 's_expert.xoa', 's_expert.khoi_phuc')`, [studentId], tiep, null,
    ({ b, f, label }) => {
      const doiTuong = label ?? 'S Expert';
      return { nguon: null, lyDo: null, truong: ([
        ['Tuần', b.tuan ? tuanLich(b.tuan, today) : null, f.tuan ? tuanLich(f.tuan, today) : null], ['Ngày', chu(b.ngay), chu(f.ngay)],
        ['Điểm', chu(b.diem), chu(f.diem)], ['Nhận xét', chu(b.nhanXet), chu(f.nhanXet)],
      ] as const).map(([ten, cu, moi]) => ({ ten, cu, moi, doiTuong })) };
    });
  return { ...r, nhom: [], batDau: null };
}

// ------------------------------------------------------------------ lớp: thông tin · tiến độ · phân công · góp ý · nhập HV

const VIEC_LOP = ['class.create', 'class.info', 'class.progress', 'class.progress.doi_bai', 'class.assign', 'class.finished', 'class.reopened',
  'class.sua_ca_lop', 'score.dan_excel', 'score.dan_excel_hoan_tac'];
/** OV-15i1: góp ý tuần của lớp — đi chỉ mục `idx_audit_viec` (loại, việc, em) và so ĐẦU nhãn bằng `substr` (mã lớp có `_` / `%` không thành ký tự đại diện). */
export const DK_GOP_Y = `a.entity_type = 'student' AND a.action IN ('gop_y_tuan.ghi', 'gop_y_tuan.xoa')
  AND a.entity_id IN (SELECT student_id FROM enrollments WHERE class_id = ?) AND substr(a.entity_label, 1, ?) = ?`;
const TUAN_HOC = (v: unknown) => (v === null || v === undefined ? 'Mặc định' : `tuần ${v}`);

function cuaLop(p: Principal, loai: 'lop' | 'phan-cong' | 'gop-y' | 'nhap-hv', classId: number, loc: string | null, tiep: number | null): TrangLs {
  const c = db().prepare('SELECT id, code, programme_code ct, created_at FROM classes WHERE id = ?').get(classId) as { id: number; code: string; ct: string | null; created_at: string } | undefined;
  if (!c) throw notFound('Không tìm thấy lớp.');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');   // cùng quyền mở hồ sơ lớp (`classOverview`)

  if (loai === 'gop-y') {
    /* shortcut: nhật ký góp ý gắn em + nhãn "mã lớp · tuần · môn" — đổi mã lớp thì mục ghi dưới mã cũ không hiện; ghi thêm `lopId` vào nhật ký góp ý nếu việc đổi mã lớp có HV hay xảy ra. */
    const dau = `${c.code} · `;
    const r = docNhatKy(DK_GOP_Y, [classId, dau.length, dau], tiep, null,
      (r) => ({ nguon: null, lyDo: null, truong: [{ ten: `Góp ý · ${String(r.label).slice(dau.length)}`, doiTuong: r.hv ?? 'Học viên đã xoá', cu: chu(r.b.noiDung), moi: chu(r.f.noiDung) }] }));
    return { ...r, nhom: [], batDau: batDauNeu(c.created_at, r.tiep) };
  }
  if (loai === 'nhap-hv') {
    const r = docNhatKy(`a.action = 'student.bulk_add' AND a.entity_type = 'class' AND a.entity_id = ?`, [classId], tiep, null, (r) => ({
      nguon: `Thêm học viên hàng loạt · ${r.f.lop ?? c.code}`, lyDo: null,
      truong: [...(Array.isArray(r.f.hv) ? r.f.hv : []).map((h: any) => ({ ten: 'Lớp', doiTuong: String(h.ten), hvId: Number(h.id), cu: null, moi: String(r.f.lop ?? c.code) })),
        ...(r.f.skipped ? [{ ten: 'Dòng bỏ qua', cu: null, moi: String(r.f.skipped) }] : [])],
    }));
    /* OV-15i1: em đã xoá hẳn → "Học viên đã xoá" (như góp ý), không giữ tên — một câu cho cả trang. */
    const con = new Set<number>();
    theoLo([...new Set(r.dong.flatMap((d) => (d.truong as TruongNhom[]).flatMap((x) => (x.hvId ? [x.hvId] : []))))], (lo, ph) => {
      for (const x of db().prepare(`SELECT id FROM students WHERE id IN (${ph})`).all(...lo) as { id: number }[]) con.add(x.id);
    });   // trang 20 lô × tới 30 em có thể quá trần tham số Turso — chia lô
    const dong = r.dong.map((d) => ({ ...d, truong: (d.truong as TruongNhom[]).map(({ hvId, ...x }) => (hvId && !con.has(hvId) ? { ...x, doiTuong: 'Học viên đã xoá' } : x)) }));
    return { dong, tiep: r.tiep, nhom: [], batDau: batDauNeu(c.created_at, r.tiep) };
  }

  /* Phân công ghi ô:người (`listening:9`, `GVCN:12`) — đổi ra tên cả trang một câu. */
  const tho = docNhatKy(`a.entity_type = 'class' AND a.entity_id = ? AND a.action IN (${VIEC_LOP.map(() => '?').join(',')})`, [classId, ...VIEC_LOP], tiep, loc,
    (r) => truongLop(r, c.ct), (x, y) => x.startsWith('class.progress') && y.startsWith('class.progress'));
  const nguoi = tenTheoId('users', tho.dong.flatMap((d) => d.truong.flatMap((x) => [x.cu, x.moi]).flatMap((v) => (v?.match(/@\d+/g) ?? []).map((m) => Number(m.slice(1))))));
  const tuan = tenTheoId('report_periods', tho.dong.flatMap((d) => d.truong.flatMap((x) => [x.cu, x.moi]).flatMap((v) => (v?.match(/#\d+/g) ?? []).map((m) => Number(m.slice(1))))));
  const hien = (v: string | null) => v?.replace(/@(\d+)/g, (_m, i) => nguoi.get(Number(i)) ?? 'Người dùng đã xoá').replace(/#(\d+)/g, (_m, i) => tuan.get(Number(i)) ?? `#${i}`) ?? null;
  /* OV-15i1: một lần Sửa cả lớp = MỘT mục, mở ra từng em — trường đọc từ các dòng nhật ký của lô (một câu mỗi lô trên trang). Trường của em chỉ mở cho
   * người xem được lịch sử em (`xemLichSuHv`, như loai=hv); em còn lại gộp một dòng "Sửa cả lớp · n em" không có cũ → mới. */
  const moLo = (tu: number, den: number): TruongLs[] => {
    const ds = truongSuaCaLop(tu, den);
    const xem = new Map<string, boolean>();
    for (const x of ds) if (!xem.has(x.khoa)) xem.set(x.khoa, x.sid !== null && xemLichSuHv(p, x.sid));
    const an = [...xem.values()].filter((v) => !v).length;
    return [...ds.filter((x) => xem.get(x.khoa)).map(({ sid: _s, khoa: _k, ...x }) => x),
      ...(an ? [{ ten: `Sửa cả lớp · ${an} em`, cu: null, moi: null }] : [])];
  };
  const dong = tho.dong.map((d) => ({
    ...d, truong: (d.truong as TruongNhom[]).flatMap(({ lo, ...x }): TruongLs[] => (lo ? moLo(lo[0], lo[1]) : [{ ...x, cu: hien(x.cu), moi: hien(x.moi) }])),
  }));
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
      return { nguon: null, lyDo: null, truong: [{ ten: `Bài ${r.label === 'final' ? 'Final' : 'Progress'} Test chưa làm`, cu: chu(b.week), moi: chu(f.week), n: 'tien-do' }] };
    case 'class.assign': {
      const nguon = f.via === 'gvcn' ? 'GVCN đổi GV bộ môn' : f.via === 'tao_lop' ? 'Tạo lớp' : f.via === 'doi_ct' ? 'Đổi chương trình' : null;
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
    case 'class.sua_ca_lop':
      return { nguon: 'Sửa cả lớp', lyDo: null, truong: [{ ten: 'Sửa cả lớp', cu: null, moi: chu(f.daSua), lo: [Number(f.tu), r.id], n: 'thong-tin' }] };
    case 'score.dan_excel': case 'score.dan_excel_hoan_tac': {
      /* Một lần dán = một mục (số dòng · ô đã lưu); từng ô xem ở Lịch sử của ô điểm. */
      const ma = f.luot ? docMaLuot(String(f.luot)) : null;
      return { nguon: r.action === 'score.dan_excel' ? 'Dán từ Excel' : 'Hoàn tác dán Excel', lyDo: null,
        truong: [{ ten: ma ? nhanMaLuot(ma) : 'Điểm', cu: null, moi: `${f.soDaLuu ?? 0} dòng · ${f.soO ?? 0} ô` }] };
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
  const c = db().prepare('SELECT student_id, created_at, route, programme_code FROM learning_cycles WHERE id = ?').get(cycleId) as { student_id: number; created_at: string; route: string | null; programme_code: string | null } | undefined;
  if (!c) throw notFound('Không tìm thấy lộ trình.');
  /* OV-15i1: cùng cổng với lịch sử hồ sơ em (`loai=hv`) — GVBM không xem. */
  if (!xemLichSuHv(p, c.student_id)) throw forbidden('Chỉ Quản lý, GVCN, Tư vấn viên và CX của em xem được lịch sử.');
  const kt = !c.route && !!kyThiCuaChuongTrinh(c.programme_code);
  const r = docNhatKy(`a.entity_type = 'learning_cycle' AND a.entity_id = ? AND a.action IN (${VIEC_THI.map(() => '?').join(',')})`, [cycleId, ...VIEC_THI], tiep, null, (r) => ({
    nguon: null, lyDo: chu(r.f.lyDo),   // dòng hệ thống: người đã là "Hệ thống" — không lặp ở nguồn
    truong: Object.keys(r.f).filter((k) => TRUONG_THI[k]).map((k) => {
      const [ten, hien0, cuKhoa] = TRUONG_THI[k];
      const hien = kt && hien0 === band ? chu : hien0;   // P13: KET / PET — điểm Cambridge số nguyên, không định dạng band
      return { ten, cu: hien(r.b[cuKhoa ?? k] ?? (k === 'khongThi' ? false : null)), moi: hien(r.f[k]) };
    }),
  }));
  return { ...r, nhom: [], batDau: batDauNeu(c.created_at, r.tiep) };
}

// ------------------------------------------------------------------ ô điểm của một lượt (điểm · "-" · nhận xét · GV chấm · lịch)

const TRANG_THAI_THI: Record<string, string> = { scheduled: 'Theo lịch', sat: 'Đã làm bài', absent: 'Vắng', cancelled: 'Đã huỷ', excused: 'Vắng' };

function oDiem(p: Principal, attemptId: number, loc: string | null, tiep: number | null): TrangLs {
  const a = db().prepare('SELECT class_id, student_id, created_at FROM assessment_attempts WHERE id = ?').get(attemptId) as { class_id: number | null; student_id: number; created_at: string } | undefined;
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
    t: { ten: `Lịch · ${h.field === 'planned_period' ? 'Tuần Test' : tenMon(null, String(h.field))}`, cu: TRANG_THAI_THI[h.cu] ?? chu(h.cu), moi: TRANG_THAI_THI[h.moi] ?? chu(h.moi), n: 'lich' },
  }));
  /* Mới → cũ; dòng của MỘT lần lưu (cùng người, ≤ 5 giây) là một mục. OV-15i1: trang theo CON TRỎ `tiep` = mốc ms × 1000 + số dòng CÙNG mốc ms đã hiện
   * (dòng sắp theo ms rồi khoá) — có người lưu thêm giữa hai lần "Xem thêm" không lặp mục; nhiều dòng cùng mili-giây không mất. Mục gom từ dòng mới nhất
   * nên trang sau gom lại đúng như cũ. shortcut: ≤ 999 dòng cùng một mili-giây của một lượt. */
  const ms = (x: { luc: string }) => Date.parse(x.luc);
  const cMs = tiep === null ? Number.MAX_SAFE_INTEGER : Math.floor(tiep / 1000);
  let boQua = tiep === null ? 0 : tiep % 1000;
  const dsDong = [...diem, ...lich].filter((x) => (!loc || x.t.n === loc) && x.t.cu !== x.t.moi && ms(x) <= cMs)
    .sort((x, y) => ms(y) - ms(x) || y.khoa.localeCompare(x.khoa, 'en', { numeric: true }))
    .filter((x) => ms(x) < cMs || (boQua -= 1) < 0);
  type MucO = MucLs & { cuoi: number };   // `cuoi` = chỉ số dòng cũ nhất của mục trong `dsDong`
  const muc: MucO[] = [];
  dsDong.forEach((d, i) => {
    const tr = muc[muc.length - 1];
    const { n: _n, ...t } = d.t;
    if (tr && tr.nguoi === d.nguoi && Date.parse(tr.luc) - ms(d) <= GOP_MS) { tr.truong.push(t); tr.lyDo ??= d.lyDo; tr.cuoi = i; }
    else muc.push({ id: d.khoa, luc: d.luc, nguoi: d.nguoi, nguon: null, lyDo: d.lyDo, truong: [t], cuoi: i });
  });
  const trang: MucLs[] = muc.slice(0, TRANG).map(({ cuoi: _c, ...m }) => m);
  let tiepMoi: number | null = null;
  if (muc.length > TRANG) {
    const het = muc[TRANG - 1].cuoi;
    const m = ms(dsDong[het]);
    const daHien = dsDong.slice(0, het + 1).filter((x) => ms(x) === m).length + (m === cMs ? (tiep ?? 0) % 1000 : 0);
    tiepMoi = m * 1000 + daHien;
  }
  const ten = tenTheoId('users', trang.flatMap((m) => m.truong.flatMap((x) => [x.cu, x.moi])).filter((v) => /^@\d+$/.test(v ?? '')).map((v) => Number(v!.slice(1))));
  for (const m of trang) for (const x of m.truong) for (const k of ['cu', 'moi'] as const) if (/^@\d+$/.test(x[k] ?? '')) x[k] = ten.get(Number(x[k]!.slice(1))) ?? 'Người dùng đã xoá';
  return { dong: trang, tiep: tiepMoi, nhom: NHOM_O, batDau: batDauNeu(a.created_at, tiepMoi) };
}
