/**
 * TẢI DANH SÁCH TUTOR (TU-b, đặc tả Tutor mục 8 + 13) — `POST /tutors/tai-len { rows: string[][], luu }`. Web đọc tệp (.xlsx / .xls / .csv, sheet đầu)
 * hoặc vùng dán TSV thành `rows`; máy chủ xem trước và lưu bằng CÙNG một hàm (`xemTruoc`), lưu chạy lại trong giao dịch nên dữ liệu đổi sau xem trước
 * vẫn đúng. Cột Tên · SĐT · Nơi dạy · Kỹ năng, có / không hàng tiêu đề. Khớp: có SĐT → theo SĐT, SĐT chưa có → tên (bỏ dấu) khớp đúng một tutor CHƯA có
 * SĐT (bổ sung SĐT, chốt planning 20/10); không SĐT → tên khớp đúng một tutor. Hai dòng cùng một tutor → lỗi cả hai.
 * Ô trống trong tệp không xoá giá trị đang có. Tutor không có trong tệp: giữ nguyên. ≤ 500 dòng.
 */
import { chenNhieuDong, db, tx } from '../db.ts';
import { badRequest, conflict, forbidden, loi, normalizeName, notFound, nowIso } from '../util.ts';
import { type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { KN_TUTOR, chuanSdt } from '../../../shared/domain/index.ts';
import { khoaTen, kiemQuyenDanhBa, kiemTutor, noiDayHopLe, suaDuocTutor, type QuyenDanhBa, type TraSan } from './trang.ts';

const TOI_DA = 500;
type Cot = 'ten' | 'sdt' | 'noiDay' | 'kyNang';
/** Bí danh tiêu đề (bỏ dấu, chữ thường) — như nhập học viên. */
const BI_DANH: Record<Cot, string[]> = {
  ten: ['ten', 'ho ten', 'ho va ten', 'ten tutor', 'tutor', 'name'],
  sdt: ['sdt', 'so dien thoai', 'dien thoai', 'so dt', 'phone'],
  noiDay: ['noi day', 'noi day chinh', 'chi nhanh', 'co so'],
  kyNang: ['ky nang', 'kn', 'skill', 'skills'],
};
const COT: readonly Cot[] = ['ten', 'sdt', 'noiDay', 'kyNang'];

export type DongTai = {
  so: number; ten: string; sdt: string | null; noiDay: number | 'online' | null; kyNang: string;
  kq: 'moi' | 'capNhat' | 'giuNguyen' | 'loi'; doi?: string[]; loi?: string[]; id?: number;
};

/** "L, R" · "L · R" · "W" (= W1 + W2) → mã theo thứ tự cố định; chữ lạ → lỗi. */
function docKyNang(s: string): { kn: string[] } | { loi: string } {
  const tu = s.toUpperCase().split(/[\s,·;/+]+/).filter(Boolean);
  if (!tu.length) return { loi: 'Thiếu kỹ năng' };
  const kn = new Set<string>();
  for (const x of tu) {
    if (x === 'W') { kn.add('W1'); kn.add('W2'); } else if ((KN_TUTOR as readonly string[]).includes(x)) kn.add(x);
    else return { loi: `Kỹ năng "${x}" không có (L, R, W1, W2, S)` };
  }
  return { kn: KN_TUTOR.filter((k) => kn.has(k)) };
}

const nhanNoi = (cn: Map<number, string>, id: number | null, online: number) => (online ? 'Chỉ online' : id ? cn.get(id) ?? '' : 'chưa có');
const nhanKn = (s: string) => s.split(',').join(' · ');

function xemTruoc(conn: any, rows: unknown, p: Principal, q: QuyenDanhBa) {
  if (!Array.isArray(rows)) throw badRequest('Không đọc được dữ liệu tải lên.');
  const bang = rows.map((r) => (Array.isArray(r) ? r : []).map((c) => String(c ?? '').trim()));
  const dau = bang[0] ?? [];
  const laTieuDe = dau.some((c) => BI_DANH.ten.includes(normalizeName(c)) || BI_DANH.kyNang.includes(normalizeName(c)));
  const cot: Record<Cot, number> = { ten: 0, sdt: 1, noiDay: 2, kyNang: 3 };
  if (laTieuDe) {
    for (const k of COT) cot[k] = dau.findIndex((c) => BI_DANH[k].includes(normalizeName(c)));
    if (cot.ten < 0 || cot.kyNang < 0) throw badRequest('Dòng tiêu đề cần cột "Tên" và "Kỹ năng".');
  }
  const vao = bang.map((r, i) => ({ r, so: i + 1 })).slice(laTieuDe ? 1 : 0).filter(({ r }) => r.some(Boolean));
  if (vao.length > TOI_DA) throw loi(400, 'Tối đa {n} dòng một lần — tách tệp rồi tải lần lượt.', { n: TOI_DA });

  const tatCaTutor = conn.prepare('SELECT id, ten, sdt, noi_day_branch_id, chi_online, ky_nang, user_id, created_by, updated_by, updated_at FROM tutors').all() as any[];
  /* TU2-5: dòng danh bạ của GV (`user_id`) không khớp / không sửa bằng tệp tải lên — tên, kỹ năng lấy từ tài khoản. */
  const tutors = tatCaTutor.filter((t) => t.user_id == null);
  const chiNhanh = conn.prepare('SELECT id, code, name FROM branches').all() as any[];
  const cn = new Map(chiNhanh.map((b) => [b.id as number, b.name as string]));
  const maCn = new Map<string, number>();
  for (const b of chiNhanh) { maCn.set(normalizeName(b.code), b.id); maCn.set(normalizeName(b.name), b.id); }
  const tra: TraSan = { sdt: new Map(tutors.filter((t) => t.sdt).map((t) => [t.sdt, { id: t.id, ten: t.ten }])), chiNhanh: new Set(cn.keys()) };
  const theoKhoa = new Map<string, any[]>();
  for (const t of tutors) theoKhoa.set(khoaTen(t.ten), [...(theoKhoa.get(khoaTen(t.ten)) ?? []), t]);
  const o = (r: string[], k: Cot) => (cot[k] >= 0 ? r[cot[k]] ?? '' : '');

  const dong: (DongTai & { _sach?: any; _cu?: any })[] = vao.map(({ r, so }) => {
    const loi: string[] = [];
    const ten = o(r, 'ten');
    const sdtChu = o(r, 'sdt');
    const sdt = chuanSdt(sdtChu);
    if (sdt === false) loi.push('SĐT cần 9–11 chữ số');
    const noiChu = o(r, 'noiDay');
    let noiDay: number | 'online' | null | undefined;   // undefined = ô trống (không đổi / chưa có)
    if (noiChu) {
      const n = normalizeName(noiChu);
      noiDay = n === 'online' || n === 'chi online' ? 'online' : maCn.get(n) ?? null;
      if (noiDay === null) loi.push(`Nơi dạy "${noiChu}" không có`);
    }
    const kn = docKyNang(o(r, 'kyNang'));
    if ('loi' in kn) loi.push(kn.loi);
    const d: DongTai & { _sach?: any; _cu?: any } = {
      so, ten, sdt: sdt || (sdtChu || null), noiDay: noiDay ?? null, kyNang: 'kn' in kn ? kn.kn.join(',') : o(r, 'kyNang'), kq: 'loi',
    };
    if (!ten) loi.push('Thiếu tên');
    if (loi.length) return { ...d, loi };
    /* Khớp tutor có sẵn. */
    let cu: any = null;
    if (sdt) {
      cu = tutors.find((t) => t.sdt === sdt) ?? null;
      /* SĐT chưa có: tutor nhập trước chưa có SĐT, cùng tên (đúng một) → bổ sung SĐT, không tạo tutor trùng (mục 13.2 "sau phải bổ sung"). */
      if (!cu) {
        const chuaSdt = (theoKhoa.get(khoaTen(ten)) ?? []).filter((t) => !t.sdt);
        if (chuaSdt.length === 1) cu = chuaSdt[0];
      }
    } else {
      const ds = theoKhoa.get(khoaTen(ten)) ?? [];
      if (ds.length > 1) return { ...d, loi: ['Trùng tên — thêm SĐT'] };
      cu = ds[0] ?? null;
    }
    /* TU13: Head chỉ sửa tutor chi nhánh mình (hoặc Chỉ online do mình tạo) và chỉ đặt nơi dạy = chi nhánh mình / Chỉ online. */
    if (cu && !suaDuocTutor(q, p, cu)) return { ...d, loi: ['Tutor không thuộc chi nhánh của bạn — không sửa được'] };
    const v = {
      ten, sdt: sdt || cu?.sdt || null, kyNang: (kn as { kn: string[] }).kn,
      noiDay: noiDay !== undefined ? noiDay : cu ? (cu.chi_online ? 'online' : cu.noi_day_branch_id) : null,
    };
    const k = kiemTutor(conn, v, cu?.id ?? null, tra);
    if ('loi' in k) return { ...d, loi: Object.values(k.loi) as string[] };
    if (!noiDayHopLe(q, k.ok)) return { ...d, loi: ['Nơi dạy cần là chi nhánh của bạn hoặc Chỉ online'] };
    return { ...d, kq: cu ? 'capNhat' : 'moi', id: cu?.id, _sach: k.ok, _cu: cu };
  });

  /* Trùng trong tệp: cùng SĐT → lỗi cả hai; không SĐT cùng tên → lỗi cả hai (lưu lần sau sẽ không khớp được). */
  const trung = (khoa: (x: DongTai) => string | null, chu: string) => {
    const gap = new Map<string, number[]>();
    dong.forEach((x, i) => { const k = khoa(x); if (k) gap.set(k, [...(gap.get(k) ?? []), i]); });
    for (const ds of gap.values()) {
      if (ds.length < 2) continue;
      for (const i of ds) {
        const khac = dong[ds.find((j) => j !== i)!].so;
        dong[i] = { ...dong[i], kq: 'loi', loi: [...(dong[i].loi ?? []), `${chu} với dòng ${khac}`], _sach: undefined };
      }
    }
  };
  trung((x) => (x.sdt && chuanSdt(x.sdt) ? chuanSdt(x.sdt) as string : null), 'Trùng SĐT');
  trung((x) => (!chuanSdt(x.sdt) && x.ten ? khoaTen(x.ten) : null), 'Trùng tên');
  trung((x) => (x.kq === 'capNhat' ? String(x.id) : null), 'Trùng tutor');

  /* Cập nhật: ghi trước → sau từng trường đổi; không đổi gì → Giữ nguyên. */
  for (const x of dong) {
    if (x.kq !== 'capNhat') continue;
    const c = x._cu, s = x._sach;
    const doi: string[] = [];
    if (c.ten !== s.ten) doi.push(`Tên: ${c.ten} → ${s.ten}`);
    if ((c.sdt ?? null) !== s.sdt) doi.push(`SĐT: ${c.sdt ?? 'trống'} → ${s.sdt}`);
    if ((c.noi_day_branch_id ?? null) !== s.noiDayBranchId || !!c.chi_online !== !!s.chiOnline) {
      doi.push(`Nơi dạy: ${nhanNoi(cn, c.noi_day_branch_id, c.chi_online)} → ${nhanNoi(cn, s.noiDayBranchId, s.chiOnline)}`);
    }
    if (c.ky_nang !== s.kyNang) doi.push(`Kỹ năng: ${nhanKn(c.ky_nang)} → ${nhanKn(s.kyNang)}`);
    if (doi.length) x.doi = doi; else x.kq = 'giuNguyen';
  }
  const dem = (k: DongTai['kq']) => dong.filter((x) => x.kq === k).length;
  return { dong, cot, soMoi: dem('moi'), soCapNhat: dem('capNhat'), soLoi: dem('loi') };
}

/** Xem trước (`luu` false) hoặc lưu mọi dòng hợp lệ trong MỘT giao dịch + một mục nhật ký (`luu` true). */
export function taiLenTutor(p: Principal, v: { rows?: unknown; luu?: unknown }) {
  const q = kiemQuyenDanhBa(p);   // TU13: Quản trị, Head tutor, Head (chỉ chi nhánh mình)
  const conn = db();
  let nhatKyId: number | null = null;
  const lam = () => {
    const kq = xemTruoc(conn, v?.rows, p, q);
    if (v?.luu === true) {
      const luc = nowIso();
      const moi = kq.dong.filter((x) => x.kq === 'moi').map((x) => x._sach);
      const sua = kq.dong.filter((x) => x.kq === 'capNhat');
      /* Mới + Cập nhật gom theo lô (≤ 900 tham số một câu): dòng có id → ON CONFLICT(id) cập nhật 5 trường, giữ created_*. */
      chenNhieuDong('INSERT INTO tutors (id, ten, sdt, noi_day_branch_id, chi_online, ky_nang, created_at, created_by, updated_at, updated_by)', [
        ...moi.map((s) => [null, s.ten, s.sdt, s.noiDayBranchId, s.chiOnline, s.kyNang, luc, p.userId, null, null]),
        ...sua.map((x) => [x.id, x._sach.ten, x._sach.sdt, x._sach.noiDayBranchId, x._sach.chiOnline, x._sach.kyNang, luc, p.userId, luc, p.userId]),
      ], ` ON CONFLICT(id) DO UPDATE SET ten = excluded.ten, sdt = excluded.sdt, noi_day_branch_id = excluded.noi_day_branch_id,
        chi_online = excluded.chi_online, ky_nang = excluded.ky_nang, updated_at = excluded.updated_at, updated_by = excluded.updated_by`);
      /* E-8: nhật ký giữ đủ để Hoàn tác ngắn — id tutor MỚI (created_at = mốc lưu) + bản TRƯỚC của dòng Cập nhật (chỉ đảo khi chưa ai sửa tiếp: updated_at còn = mốc lưu). */
      const moiIds = (conn.prepare('SELECT id FROM tutors WHERE created_at = ? AND created_by = ? AND updated_at IS NULL').all(luc, p.userId) as { id: number }[]).map((r) => r.id);
      const cu = sua.map((x) => ({ id: x.id, ten: x._cu.ten, sdt: x._cu.sdt ?? null, noi: x._cu.noi_day_branch_id ?? null, online: x._cu.chi_online ? 1 : 0, kn: x._cu.ky_nang,
        ub: x._cu.updated_by ?? null, ua: x._cu.updated_at ?? null }));
      nhatKyId = writeAudit({ actorUserId: p.userId, action: 'tutor.tai_len', entityType: 'tutor',
        after: { moi: moi.map((s) => s.ten), capNhat: kq.dong.filter((y) => y.kq === 'capNhat').map((y) => ({ id: y.id, doi: y.doi })), hoanTac: { luc, moiIds, cu } } });
    }
    return { ...kq, dong: kq.dong.map(({ _sach, _cu, ...x }) => x), daLuu: v?.luu === true, nhatKyId };
  };
  return v?.luu === true ? tx(lam) : lam();
}

/** E-8: Hoàn tác tải danh sách chỉ trong ngần này phút (như Hoàn tác Thêm HV). */
export const HOAN_TAC_PHUT_TAI_LEN = 15;
/**
 * E-8 (rà 25/11): Hoàn tác "Tải danh sách tutor" — chỉ CHÍNH người tải, trong 15 phút, đọc ĐÚNG nhật ký `tutor.tai_len` (không tin danh sách web gửi): xoá tutor MỚI còn trống
 * (chưa có buổi / nhận xét — có rồi thì giữ, đếm `giu`) và trả dòng Cập nhật về bản trước nếu chưa ai sửa tiếp. Mỗi lần tải hoàn tác MỘT lần.
 */
export function hoanTacTaiLen(p: Principal, v: { nhatKyId?: unknown }): { xoa: number; khoiPhuc: number; giu: number } {
  kiemQuyenDanhBa(p);
  const id = Number(v?.nhatKyId);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Không tìm thấy lần tải để hoàn tác.');
  const conn = db();
  const nk = conn.prepare('SELECT actor_user_id, action, after_json, created_at FROM audit_logs WHERE id = ?').get(id) as any;
  if (!nk || nk.action !== 'tutor.tai_len') throw notFound('Không tìm thấy lần tải để hoàn tác.');
  if (nk.actor_user_id !== p.userId) throw forbidden('Chỉ người tải hoàn tác được lần tải này.');
  if (Date.now() - Date.parse(nk.created_at) > HOAN_TAC_PHUT_TAI_LEN * 60_000) throw conflict(`Đã quá ${HOAN_TAC_PHUT_TAI_LEN} phút — xoá / sửa từng tutor ở danh sách.`);
  const h = (JSON.parse(nk.after_json ?? '{}').hoanTac ?? {}) as { luc?: string; moiIds?: number[]; cu?: { id: number; ten: string; sdt: string | null; noi: number | null; online: number; kn: string; ub: number | null; ua: string | null }[] };
  return tx(() => {
    if (conn.prepare(`SELECT 1 AS x FROM audit_logs WHERE action = 'tutor.tai_len_hoan_tac' AND entity_id = ? LIMIT 1`).get(id)) throw badRequest('Lần tải này đã hoàn tác rồi.');
    let xoa = 0, khoiPhuc = 0, giu = 0;
    for (const tid of h.moiIds ?? []) {
      const r = conn.prepare(`DELETE FROM tutors WHERE id = ? AND user_id IS NULL AND NOT EXISTS (SELECT 1 FROM case_followup_buoi WHERE tutor_id = ?) AND NOT EXISTS (SELECT 1 FROM tutor_nhan_xet WHERE tutor_id = ?)`).run(tid, tid, tid);
      if (r.changes) xoa += 1; else giu += 1;
    }
    for (const c of h.cu ?? []) {
      const r = conn.prepare(`UPDATE tutors SET ten = ?, sdt = ?, noi_day_branch_id = ?, chi_online = ?, ky_nang = ?, updated_by = ?, updated_at = ? WHERE id = ? AND updated_at = ?`)
        .run(c.ten, c.sdt, c.noi, c.online, c.kn, c.ub, c.ua, c.id, h.luc ?? '');
      if (r.changes) khoiPhuc += 1; else giu += 1;
    }
    writeAudit({ actorUserId: p.userId, action: 'tutor.tai_len_hoan_tac', entityType: 'tutor', entityId: id, after: { xoa, khoiPhuc, giu } });
    return { xoa, khoiPhuc, giu };
  });
}
