/**
 * TẢI DANH SÁCH TUTOR (TU-b, đặc tả Tutor mục 8 + 13) — `POST /tutors/tai-len { rows: string[][], luu }`. Web đọc tệp (.xlsx / .xls / .csv, sheet đầu)
 * hoặc vùng dán TSV thành `rows`; máy chủ xem trước và lưu bằng CÙNG một hàm (`xemTruoc`), lưu chạy lại trong giao dịch nên dữ liệu đổi sau xem trước
 * vẫn đúng. Cột Tên · SĐT · Nơi dạy · Kỹ năng, có / không hàng tiêu đề. Khớp: có SĐT → theo SĐT; không SĐT → tên (bỏ dấu) khớp đúng một tutor.
 * Ô trống trong tệp không xoá giá trị đang có. Tutor không có trong tệp: giữ nguyên. ≤ 500 dòng.
 */
import { chenNhieuDong, db, tx } from '../db.ts';
import { badRequest, forbidden, normalizeName, nowIso } from '../util.ts';
import { can, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { KN_TUTOR, PERMISSIONS, chuanSdt } from '../../../shared/domain/index.ts';
import { khoaTen, kiemTutor, type TraSan } from './trang.ts';

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

function xemTruoc(conn: any, rows: unknown) {
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
  if (vao.length > TOI_DA) throw badRequest(`Tối đa ${TOI_DA} dòng một lần — tách tệp rồi tải lần lượt.`);

  const tutors = conn.prepare('SELECT id, ten, sdt, noi_day_branch_id, chi_online, ky_nang FROM tutors').all() as any[];
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
    if (sdt) cu = tutors.find((t) => t.sdt === sdt) ?? null;
    else {
      const ds = theoKhoa.get(khoaTen(ten)) ?? [];
      if (ds.length > 1) return { ...d, loi: ['Trùng tên — thêm SĐT'] };
      cu = ds[0] ?? null;
    }
    const v = {
      ten, sdt: sdt || cu?.sdt || null, kyNang: (kn as { kn: string[] }).kn,
      noiDay: noiDay !== undefined ? noiDay : cu ? (cu.chi_online ? 'online' : cu.noi_day_branch_id) : null,
    };
    const k = kiemTutor(conn, v, cu?.id ?? null, tra);
    if ('loi' in k) return { ...d, loi: Object.values(k.loi) as string[] };
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
  if (!can(p, PERMISSIONS.TUTOR_MANAGE, { anyScope: true })) throw forbidden('Bạn không có quyền sửa danh sách tutor.');
  const conn = db();
  const lam = () => {
    const kq = xemTruoc(conn, v?.rows);
    if (v?.luu === true) {
      const luc = nowIso();
      const moi = kq.dong.filter((x) => x.kq === 'moi').map((x) => x._sach);
      chenNhieuDong('INSERT INTO tutors (ten, sdt, noi_day_branch_id, chi_online, ky_nang, created_at, created_by)',
        moi.map((s) => [s.ten, s.sdt, s.noiDayBranchId, s.chiOnline, s.kyNang, luc, p.userId]));
      // ponytail: mỗi dòng Cập nhật một câu UPDATE (≤ 500, chỉ dòng có đổi) — gom CASE nếu tải lại tệp lớn chậm trên Turso.
      for (const x of kq.dong.filter((y) => y.kq === 'capNhat')) {
        const s = x._sach;
        conn.prepare('UPDATE tutors SET ten = ?, sdt = ?, noi_day_branch_id = ?, chi_online = ?, ky_nang = ?, updated_at = ?, updated_by = ? WHERE id = ?')
          .run(s.ten, s.sdt, s.noiDayBranchId, s.chiOnline, s.kyNang, luc, p.userId, x.id);
      }
      writeAudit({ actorUserId: p.userId, action: 'tutor.tai_len', entityType: 'tutor',
        after: { moi: moi.map((s) => s.ten), capNhat: kq.dong.filter((y) => y.kq === 'capNhat').map((y) => ({ id: y.id, doi: y.doi })) } });
    }
    return { ...kq, dong: kq.dong.map(({ _sach, _cu, ...x }) => x), daLuu: v?.luu === true };
  };
  return v?.luu === true ? tx(lam) : lam();
}
