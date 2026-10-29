import { boMonCt } from '../normal/regular.ts';
import { db } from '../db.ts';
import { kyNangPhuTrach, mocLoTrinh, nhanCotBg, tenMonNgan } from '../../../shared/domain/index.ts';
import { addDays } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { lopXemTam, type Principal } from '../permissions.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { cungGvTuPhanCong, type PhanCongLop } from './banGiao.ts';
import type { DaiHocVien, DaiLop } from '../../../shared/domain/index.ts';
import { mocKetKhoa, type TienDoMoc } from './schedule.ts';
import { lopChoChotLoTrinh } from './lenhChuyen.ts';
import { coTheRaLenh, phanCongO } from './quyenChuyenLop.ts';
import { EM_KQDR_FT_SQL, KQDR_HIEN_NGAY, laChiAdmin } from '../normal/kyVong.ts';

/**
 * DỮ LIỆU CÁC DẢI của mockup 20 — chỉ ĐỌC, cho hồ sơ lớp (A · H) và hồ sơ học viên (E). Chữ do web dựng từ các trường này (mã tuần qua `tuanLich`).
 * Nút theo QUYỀN ở `viewer`/`nut`: web không tự đoán vai (máy chủ vẫn kiểm lại ở từng đường).
 */

/**
 * Hồ sơ lớp: tối đa 3 câu (phân công · lệnh nguồn/đích/dòng môn/GVCN/số đợt KQĐR gộp một UNION · đếm chưa lệnh khi tới Cuối khoá).
 * PR-B: cùng UNION thêm phân công lớp nguồn + lớp đích (môn cùng GV — chủ SP 30/10), việc bàn giao đổi GV của lớp, GV cũ chỉ xem — không thêm lượt.
 */
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
       FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'
     UNION ALL SELECT 'ld', l.id, l.lop_dich_id, NULL, NULL, NULL, NULL, NULL, NULL
       FROM lenh_chuyen_lop l WHERE l.lop_nguon_id = ? AND l.trang_thai != 'huy' AND l.xac_nhan_luc IS NULL AND l.lop_dich_id IS NOT NULL
     UNION ALL SELECT 'ta', ta.class_id, c.programme_code, ta.user_id, ta.skill, ta.is_core, NULL, NULL, NULL
       FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      WHERE ta.status = 'active' AND (ta.class_id = ? OR ta.class_id IN (SELECT lop_dich_id FROM lenh_chuyen_lop WHERE lop_nguon_id = ? AND trang_thai != 'huy' AND xac_nhan_luc IS NULL))
     UNION ALL SELECT 'bgv', b.id, uc.full_name, b.trang_thai, b.han, b.nguoi_lam, b.xong_luc, b.nguoi_cu, b.hieu_luc
       FROM ban_giao_gv b JOIN users uc ON uc.id = b.nguoi_cu WHERE b.class_id = ? AND (b.trang_thai = 'mo' OR (b.trang_thai = 'xong' AND b.xong_luc >= ?))
     UNION ALL SELECT 'bgm', m.ban_giao_id, m.mon, um.full_name, m.nguoi_moi, NULL, NULL, NULL, NULL
       FROM ban_giao_gv_mon m JOIN ban_giao_gv b ON b.id = m.ban_giao_id JOIN users um ON um.id = m.nguoi_moi
      WHERE b.class_id = ? AND m.trang_thai = 'mo' AND (b.trang_thai = 'mo' OR (b.trang_thai = 'xong' AND b.xong_luc >= ?))
     UNION ALL SELECT 'bge', x.ban_giao_id, x.mon, x.student_id, NULL, NULL, NULL, NULL, NULL
       FROM ban_giao_gv_em x JOIN ban_giao_gv b ON b.id = x.ban_giao_id AND b.class_id = ? AND b.trang_thai = 'mo'
       JOIN enrollments e ON e.student_id = x.student_id AND e.class_id = b.class_id AND e.status = 'active' JOIN students s ON s.id = x.student_id AND ${HV_DANG_HOC_SQL('s')}
     UNION ALL SELECT 'hv', COUNT(*), NULL, NULL, NULL, NULL, NULL, NULL, NULL
       FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.class_id = ? AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')}
         AND EXISTS (SELECT 1 FROM ban_giao_gv b WHERE b.class_id = e.class_id AND b.trang_thai = 'mo')
     UNION ALL SELECT 'xt', d.khoa, um.full_name, d.nguoi_moi, d.hieu_luc, d.xem_den, NULL, NULL, NULL
       FROM doi_phan_cong d JOIN users um ON um.id = d.nguoi_moi WHERE d.class_id = ? AND d.nguoi_cu = ? AND d.trang_thai = 'da_ap' AND d.xem_den IS NOT NULL
     UNION ALL SELECT 'kqdr', COUNT(DISTINCT substr(e.started_at, 1, 10)), NULL, NULL, NULL, NULL, NULL, NULL, NULL ${EM_KQDR_FT_SQL}`,
  ).all(classId, classId, classId, classId, classId, classId, classId, classId, addDays(homNay, -14), classId, addDays(homNay, -14), classId, classId, classId, p.userId,
    classId, addDays(homNay, -KQDR_HIEN_NGAY)) as any[];
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
  /* Chủ SP 30/10: môn ở lớp mới vẫn đúng GV cũ dạy → không cần bàn giao (không tính vào số em của GVBM). */
  const pcLop: PhanCongLop = new Map([[classId, { ct: o.ct, rows: [] }]]);
  for (const r of rows.filter((x) => x.k === 'ta')) {
    const x = pcLop.get(r.a) ?? { ct: (r.b ?? null) as string | null, rows: [] };
    x.rows.push({ user_id: r.c, skill: r.d ?? null, is_core: r.e });
    pcLop.set(r.a, x);
  }
  const cung = cungGvTuPhanCong(rows.filter((x) => x.k === 'ld').map((r) => ({ id: r.a as number, lop_nguon_id: classId, lop_dich_id: r.b as number })), pcLop);
  const banGiaoMon = chuaXn.length
    ? boMonCt(o.ct).filter((m) => kyNangPhuTrach(o.ct, m).some((k) => pc.kyNang.has(k))).map((m) => {
      const can = nguon.filter((r) => !cung.get(r.a)?.mon.has(m));
      return {
        mon: m, monNgan: tenMonNgan(o.ct, m), daGhi: can.filter((r) => daGhi.get(m)?.has(r.a)).length, tong: can.length,
        han: min(chuaXn.filter((r) => !daGhi.get(m)?.has(r.a) && !cung.get(r.a)?.mon.has(m)).map((r) => r.g)),
      };
    }).filter((x) => x.tong > 0)
    : [];
  const { banGiaoGv, xemTam } = daiBanGiaoGv(p, classId, o.ct, rows, ra, homNay);

  const dich = rows.filter((r) => r.k === 'dich');
  const sapNhan = dich.length
    ? {
      n: dich.length, tuLop: [...new Map(dich.map((r) => [r.a as number, { id: r.a as number, code: r.b as string }])).values()],
      tuan: min(dich.map((r) => r.d))!, daXacNhan: dich.filter((r) => !!r.e).length,
    } : null;

  /* OV-3b: thanh nhắc "Lộ trình tiếp theo" (Quản lý, lớp thường) — CÙNG hàm với việc QL "Chốt lộ trình" (N20: từ thứ Hai tuần trước Final, còn em chưa chốt). */
  const den = o.pr?.finalWeekStart ? homNay >= mocLoTrinh(o.pr.finalWeekStart).nhacTu : mocKetKhoa(o.pr, homNay).hetKhoa;   // lọc rẻ trước khi đếm
  const chot = !o.ft && ra && den ? lopChoChotLoTrinh(p, null, homNay, classId)[0] : undefined;
  const loTrinh: DaiLop['loTrinh'] = chot ? { hanChot: chot.han, tong: chot.tong, daChot: chot.tong - chot.chuaLenh, do: !!chot.han && homNay > chot.han } : null;
  /* PR-S5F-a: lệnh lỗi (kể cả Dừng học hẳn) — Quản lý thấy ngay ở hồ sơ lớp để sửa (trang Cuối khoá). R5.3: lớp FT không còn dải này (không còn Chuyển tiếp lớp). */
  const loi = ra && !o.ft ? rows.filter((r) => r.k === 'nguon' && r.c === 'cho' && r.h) : [];
  const chuaChuyenDuoc = loi.length ? { n: loi.length, loi: loi[0].h as string } : null;
  /* OV-3c: số đợt "Kết quả đầu ra" lớp FT còn trong 4 tuần — 0 thì web ẩn cách xem (Admin luôn 0, máy chủ chặn đường đọc). */
  const kqdrDot = laChiAdmin(p) ? 0 : rows.find((r) => r.k === 'kqdr')?.a ?? 0;   // đường đọc kiểm `attempt.view`; ở đây không gọi `can()` (thêm câu tra chi nhánh)
  return { loTrinh, banGiao, kqdrDot, banGiaoMon, sapNhan, chuaChuyenDuoc, banGiaoGv, xemTam, viewer: { coTheRaLenh: ra, laGvcn: pc.gvcn, xacNhanDuoc: pc.gvcn || qlThay } };
}

/**
 * PR-B: dải bàn giao đổi GV của hồ sơ lớp (từ các vế UNION của `daiLop`). Việc đang mở: người viết (`viet`) + QL / GV cũ (`doc`); việc xong
 * ≤ 14 ngày: GV mới + QL (`doc`). GV cũ chỉ xem (đã hết ô ở lớp, còn hạn xem): dải "Chỉ xem · …" + việc bàn giao của chính người đó.
 */
function daiBanGiaoGv(p: Principal, classId: number, ct: string | null, rows: any[], ql: boolean, homNay: string): Pick<DaiLop, 'banGiaoGv' | 'xemTam'> {
  const cot = rows.filter((r) => r.k === 'bgm');
  const gop = rows.filter((r) => r.k === 'bge');
  const tong = rows.find((r) => r.k === 'hv')?.a ?? 0;
  const banGiaoGv: DaiLop['banGiaoGv'] = [];
  for (const b of rows.filter((r) => r.k === 'bgv')) {
    const c = cot.filter((x) => x.a === b.a).sort((x, y) => Number(x.b === 'gvcn') - Number(y.b === 'gvcn'));   // kỹ năng trước, GVCN cuối (như phiếu)
    if (!c.length) continue;
    const mo = b.c === 'mo';
    const viet = mo && (b.e === p.userId || (ql && (b.e === null || homNay > b.d)));
    const thay = mo ? viet || ql || b.g === p.userId : ql || c.some((x) => x.d === p.userId);
    if (!thay) continue;
    const em = new Map<number, Set<string>>();
    for (const x of gop.filter((y) => y.a === b.a)) em.set(x.c, (em.get(x.c) ?? new Set()).add(x.b));
    banGiaoGv.push({
      id: b.a, monNgan: c.map((x) => nhanCotBg(ct, x.b)), nguoiMoi: [...new Set(c.map((x) => x.c as string))].join(', '), nguoiCu: b.b,
      du: mo ? [...em.values()].filter((s) => c.every((x) => s.has(x.b))).length : tong, tong: mo ? tong : 0, han: b.d, vai: viet ? 'viet' : 'doc', xong: !mo,
    });
  }
  const xt = rows.filter((r) => r.k === 'xt');
  const con = lopXemTam(p, homNay).find((x) => x.classId === classId);
  const cua = banGiaoGv.find((x) => !x.xong && rows.some((r) => r.k === 'bgv' && r.a === x.id && r.g === p.userId)) ?? null;
  const xemTam: DaiLop['xemTam'] = con && xt.length ? {
    monNgan: [...new Set(xt.map((r) => nhanCotBg(ct, r.a)))], nguoiMoi: { id: xt[xt.length - 1].c, ten: xt[xt.length - 1].b },
    tu: xt.map((r) => r.d as string).sort()[0], den: xt.map((r) => r.e as string).sort().reverse()[0],
    banGiao: cua ? { id: cua.id, du: cua.du, tong: cua.tong } : null,
  } : null;
  return { banGiaoGv, xemTam };
}

/** Hồ sơ HV (E): lệnh đang chờ hoặc đã chuyển ≤ 14 ngày (Q17) — 2 câu. */
export function daiHocVien(p: Principal, studentId: number): DaiHocVien | null {
  const conn = db();
  const homNay = demoToday();
  const l = conn.prepare(
    `SELECT l.*, n.code AS nguon, n.programme_code AS ct, d.code AS dich, d.programme_code AS ct_dich, u.full_name AS ra, xn.full_name AS xn_ten,
            (SELECT GROUP_CONCAT(b.mon) FROM ban_giao_mon b WHERE b.lenh_id = l.id AND b.lam_lai = 0) AS mon_da_ghi,
            (SELECT json_group_array(json_array(ta.class_id, ta.user_id, ta.skill, ta.is_core)) FROM teacher_assignments ta
              WHERE ta.status = 'active' AND ta.class_id IN (l.lop_nguon_id, l.lop_dich_id)) AS pc_json
       FROM lenh_chuyen_lop l JOIN classes n ON n.id = l.lop_nguon_id LEFT JOIN classes d ON d.id = l.lop_dich_id
       LEFT JOIN users u ON u.id = l.nguoi_ra_lenh LEFT JOIN users xn ON xn.id = l.xac_nhan_boi
      WHERE l.student_id = ? AND (l.trang_thai = 'cho' OR (l.trang_thai = 'da_chuyen' AND l.tuan_bat_dau >= ?))
      ORDER BY l.id DESC LIMIT 1`,
  ).get(studentId, addDays(homNay, -14)) as any;
  if (!l) return deXuatDangCho(conn, studentId);
  const pc = phanCongO(conn, p.userId, l.lop_nguon_id);
  const ra = coTheRaLenh(p, l.lop_nguon_id);
  /* Chủ SP 30/10: môn cùng GV ở lớp mới tính như đã bàn giao (không cần câu). */
  const pcLop: PhanCongLop = new Map();
  pcLop.set(l.lop_nguon_id, { ct: l.ct ?? null, rows: [] });
  if (l.lop_dich_id) pcLop.set(l.lop_dich_id, { ct: l.ct_dich ?? null, rows: [] });
  for (const [classId, user_id, skill, is_core] of JSON.parse(l.pc_json ?? '[]') as any[][]) pcLop.get(classId)?.rows.push({ user_id, skill, is_core });
  const cung = !l.xac_nhan_luc ? cungGvTuPhanCong([l], pcLop).get(l.id) : undefined;   // cùng câu, không thêm lượt
  const daGhi = new Set<string>([...String(l.mon_da_ghi ?? '').split(',').filter(Boolean), ...(cung?.mon ?? [])]);
  const mons = boMonCt(l.ct);
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
