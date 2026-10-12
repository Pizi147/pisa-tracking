import { programmeByCode } from '../normal/regular.ts';
import { db } from '../db.ts';
import { boMonLich, kyNangPhuTrach, mocLoTrinh, tenMonNgan } from '../../../shared/domain/index.ts';
import { addDays } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import type { Principal } from '../permissions.ts';
import type { DaiHocVien, DaiLop } from '../../../shared/domain/index.ts';
import { mocKetKhoa, type TienDoMoc } from './schedule.ts';
import { lopChoChotLoTrinh } from './lenhChuyen.ts';
import { coTheRaLenh, phanCongO } from './quyenChuyenLop.ts';

/**
 * DỮ LIỆU CÁC DẢI của mockup 20 — chỉ ĐỌC, cho hồ sơ lớp (A · H) và hồ sơ học viên (E). Chữ do web dựng từ các trường này (mã tuần qua `tuanLich`).
 * Nút theo QUYỀN ở `viewer`/`nut`: web không tự đoán vai (máy chủ vẫn kiểm lại ở từng đường).
 */

/** Hồ sơ lớp: tối đa 3 câu (phân công · lệnh nguồn/đích/dòng môn/GVCN gộp một UNION · đếm chưa lệnh khi tới Cuối khoá). */
export function daiLop(p: Principal, classId: number, o: { pr: TienDoMoc; ft: boolean; ct: string | null }): DaiLop {
  const conn = db();
  const homNay = demoToday();
  const pc = phanCongO(conn, p.userId, classId);
  const ra = coTheRaLenh(p, classId);
  const rows = conn.prepare(
    `SELECT 'nguon' AS k, l.id AS a, l.huong AS b, l.trang_thai AS c, l.tuan_bat_dau AS d, l.xac_nhan_luc AS e, l.han_gvcn AS f, l.han_gvbm AS g, l.loi AS h
       FROM lenh_chuyen_lop l WHERE l.lop_nguon_id = ? AND l.trang_thai != 'huy'
     UNION ALL SELECT 'dich', l.lop_nguon_id, n.code, l.trang_thai, l.tuan_bat_dau, l.xac_nhan_luc, NULL, NULL, NULL
       FROM lenh_chuyen_lop l JOIN classes n ON n.id = l.lop_nguon_id WHERE l.lop_dich_id = ? AND l.trang_thai = 'cho'
     UNION ALL SELECT 'mon', b.lenh_id, b.mon, NULL, NULL, NULL, NULL, NULL, NULL
       FROM ban_giao_mon b WHERE b.lam_lai = 0 AND b.lenh_id IN (SELECT id FROM lenh_chuyen_lop WHERE lop_nguon_id = ?)
     UNION ALL SELECT 'gvcn', COUNT(*), NULL, NULL, NULL, NULL, NULL, NULL, NULL
       FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`,
  ).all(classId, classId, classId, classId) as any[];
  const min = (xs: (string | null)[]) => xs.filter((x): x is string => !!x).sort()[0] ?? null;

  const nguon = rows.filter((r) => r.k === 'nguon' && r.b !== 'dung_hoc');
  const chuaXn = nguon.filter((r) => !r.e);
  const coGvcn = (rows.find((r) => r.k === 'gvcn')?.a ?? 0) > 0;
  const hanGvcn = min(chuaXn.map((r) => r.f));
  const qlThay = ra && (!coGvcn || (!!hanGvcn && homNay > hanGvcn));
  const banGiao = nguon.length && (chuaXn.length || nguon.some((r) => r.c === 'cho'))
    ? { daXacNhan: nguon.length - chuaXn.length, tong: nguon.length, hanGvcn } : null;

  const daGhi = new Map<string, Set<number>>();
  for (const r of rows.filter((x) => x.k === 'mon')) {
    if (!daGhi.has(r.b)) daGhi.set(r.b, new Set());
    daGhi.get(r.b)!.add(r.a);
  }
  const banGiaoMon = chuaXn.length
    ? boMonLich(o.ct, programmeByCode(o.ct)?.skills).filter((m) => kyNangPhuTrach(o.ct, m).some((k) => pc.kyNang.has(k))).map((m) => ({
      mon: m, monNgan: tenMonNgan(o.ct, m), daGhi: nguon.filter((r) => daGhi.get(m)?.has(r.a)).length, tong: nguon.length,
      han: min(chuaXn.filter((r) => !daGhi.get(m)?.has(r.a)).map((r) => r.g)),
    }))
    : [];

  const dich = rows.filter((r) => r.k === 'dich');
  const sapNhan = dich.length
    ? {
      n: dich.length, tuLop: [...new Map(dich.map((r) => [r.a as number, { id: r.a as number, code: r.b as string }])).values()],
      tuan: min(dich.map((r) => r.d))!, daXacNhan: dich.filter((r) => !!r.e).length,
    } : null;

  /* OV-3b: thanh nhắc "Lộ trình tiếp theo" (Quản lý, lớp thường) — CÙNG hàm với việc QL "Chốt lộ trình" (từ thứ Hai tuần Final − 2, còn em chưa chốt). */
  const den = o.pr?.finalWeekStart ? homNay >= mocLoTrinh(o.pr.finalWeekStart).nhacTu : mocKetKhoa(o.pr, homNay).hetKhoa;   // lọc rẻ trước khi đếm
  const chot = !o.ft && ra && den ? lopChoChotLoTrinh(p, null, homNay, classId)[0] : undefined;
  const loTrinh: DaiLop['loTrinh'] = chot ? { hanChot: chot.han, tong: chot.tong, daChot: chot.tong - chot.chuaLenh, do: !!chot.han && homNay > chot.han } : null;
  /* PR-S5F-a: lệnh lỗi (kể cả Dừng học hẳn) — Quản lý thấy ngay ở hồ sơ lớp để sửa, không phải mở từng hồ sơ em. */
  const loi = ra ? rows.filter((r) => r.k === 'nguon' && r.c === 'cho' && r.h) : [];
  const chuaChuyenDuoc = loi.length ? { n: loi.length, loi: loi[0].h as string } : null;
  return { loTrinh, banGiao, banGiaoMon, sapNhan, chuaChuyenDuoc, viewer: { coTheRaLenh: ra, coTheChuyenNhieuEm: ra && o.ft, laGvcn: pc.gvcn, xacNhanDuoc: pc.gvcn || qlThay } };
}

/** Hồ sơ HV (E): lệnh đang chờ hoặc đã chuyển ≤ 14 ngày (Q17) — 2 câu. */
export function daiHocVien(p: Principal, studentId: number): DaiHocVien | null {
  const conn = db();
  const homNay = demoToday();
  const l = conn.prepare(
    `SELECT l.*, n.code AS nguon, n.programme_code AS ct, d.code AS dich, u.full_name AS ra, xn.full_name AS xn_ten,
            (SELECT GROUP_CONCAT(b.mon) FROM ban_giao_mon b WHERE b.lenh_id = l.id AND b.lam_lai = 0) AS mon_da_ghi
       FROM lenh_chuyen_lop l JOIN classes n ON n.id = l.lop_nguon_id LEFT JOIN classes d ON d.id = l.lop_dich_id
       LEFT JOIN users u ON u.id = l.nguoi_ra_lenh LEFT JOIN users xn ON xn.id = l.xac_nhan_boi
      WHERE l.student_id = ? AND (l.trang_thai = 'cho' OR (l.trang_thai = 'da_chuyen' AND l.tuan_bat_dau >= ?))
      ORDER BY l.id DESC LIMIT 1`,
  ).get(studentId, addDays(homNay, -14)) as any;
  if (!l) return deXuatDangCho(conn, studentId);
  const pc = phanCongO(conn, p.userId, l.lop_nguon_id);
  const ra = coTheRaLenh(p, l.lop_nguon_id);
  const daGhi = new Set<string>(String(l.mon_da_ghi ?? '').split(',').filter(Boolean));
  const mons = boMonLich(l.ct, programmeByCode(l.ct)?.skills);
  const phieu = l.huong !== 'dung_hoc';
  const qlThay = ra && (!!l.han_gvcn && homNay > l.han_gvcn);   // lớp không GVCN được `daiLop` xử lý ở phía lớp; ở đây chỉ quá hạn
  const nut: DaiHocVien['nut'] = [];
  const monToi = mons.find((m) => !daGhi.has(m) && kyNangPhuTrach(l.ct, m).some((k) => pc.kyNang.has(k))) ?? null;
  if (phieu && !l.xac_nhan_luc && l.trang_thai !== 'huy') {
    if (pc.gvcn || qlThay) nut.push('ban-giao');
    if (monToi) nut.push('ban-giao-mon');
  }
  if (ra && l.trang_thai === 'cho') nut.push('huy-lenh');   // PR-S5F-a: cả lệnh đã tới tuần mà chưa chuyển được
  if (phieu && (l.xac_nhan_luc || l.trang_thai === 'da_chuyen')) nut.push('doc-ban-giao');   // ai xem được hồ sơ thì đọc được phiếu đã xác nhận / đã chuyển (Q15)
  return {
    loai: l.trang_thai === 'cho' ? 'sap' : 'da', lenhId: l.id, lopNguon: { id: l.lop_nguon_id, code: l.nguon },
    lopDich: l.lop_dich_id ? { id: l.lop_dich_id, code: l.dich } : null, huong: l.huong, tuan: l.tuan_bat_dau, nguoiRaLenh: l.ra ?? null, ngayRaLenh: l.ngay_ra_lenh,
    banGiao: phieu ? {
      soMon: mons.length, daGhi: daGhi.size, hanGvcn: l.han_gvcn ?? null, daXacNhan: !!l.xac_nhan_luc, nguoiXacNhan: l.xn_ten ?? null,
      ngayXacNhan: l.xac_nhan_luc ?? null, thay: !!l.xac_nhan_thay,
    } : null,
    loi: ra ? l.loi ?? null : null,   // "Chưa chuyển được: …" chỉ cho Quản lý
    nut,
    mon: monToi ? { ma: monToi, ngan: tenMonNgan(l.ct, monToi) } : null,
  };
}

/** Chưa có lệnh nhưng GVCN đã gửi đề xuất chuyển lớp còn chờ Quản lý (`yeu_cau_duyet`) → dải "Chờ QL duyệt đề xuất". */
function deXuatDangCho(conn: ReturnType<typeof db>, studentId: number): DaiHocVien | null {
  const y = conn.prepare(
    `SELECT y.lop_id, y.du_lieu, y.tao_luc, u.full_name AS gui, n.code AS nguon
       FROM yeu_cau_duyet y LEFT JOIN users u ON u.id = y.nguoi_xin LEFT JOIN classes n ON n.id = y.lop_id
      WHERE y.trang_thai = 'cho' AND y.loai = 'de_xuat_chuyen_lop' AND y.doi_tuong_loai = 'student:chuyen-lop' AND y.doi_tuong_id = ?`,
  ).get(studentId) as any;
  if (!y) return null;
  let d: { lopDichId?: number | null; tuan?: string | null } = {};
  try { d = y.du_lieu ? JSON.parse(y.du_lieu) : {}; } catch { d = {}; }
  const dich = d.lopDichId ? conn.prepare('SELECT id, code FROM classes WHERE id = ?').get(d.lopDichId) as any : null;
  return {
    loai: 'cho-duyet', lenhId: 0, lopNguon: { id: y.lop_id, code: y.nguon }, lopDich: dich ? { id: dich.id, code: dich.code } : null, huong: '',
    tuan: d.tuan ?? '', nguoiRaLenh: y.gui ?? null, ngayRaLenh: y.tao_luc, banGiao: null, loi: null, nut: [], mon: null,
  };
}
