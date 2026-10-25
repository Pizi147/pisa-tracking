import { boMonCt } from '../normal/regular.ts';
import { db, theoLo, tx } from '../db.ts';
import {
  NHAN_XET_TOI_THIEU, PERMISSIONS, kindCuaBac, nhanLoaiXuLy, programmeOf, coPhieu, kyNangPhuTrach, tenMon, tenMonNgan, trangThaiPhieu,
} from '../../../shared/domain/index.ts';
import { badRequest, conflict, forbidden, notFound, nowIso } from '../util.ts';
import { can, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import type { PhieuBanGiaoDto, PhieuEm, PhieuMon, TuDien } from '../../../shared/domain/index.ts';
import { standingFor, standingLine } from '../students/standing.ts';
import { chuCuoiKhoaLo } from '../normal/cuoiKhoa.ts';
import { trangThaiYThuc } from '../yThuc/trangThai.ts';
import { nguoiNhanGoiY } from './luatLoTrinh.ts';
import { nguoiNhanCuaLop } from './lenhChuyen.ts';
import { mocNghiepVu } from '../duyet/yeuCau.ts';
import { coTheRaLenh, phanCongO } from './quyenChuyenLop.ts';

/**
 * BÀN GIAO (PR-CT, §3.1f Q30-2): có quyết định chuyển lớp → mỗi GVBM ghi MỘT CÂU mỗi em cho môn mình (hạn 2 ngày), GVCN lớp cũ gom lại, viết nhận xét
 * chung rồi Xác nhận (hạn 3 ngày, tính cả ngày ra lệnh). Quá hạn không chặn việc chuyển — lệnh vẫn chạy đúng tuần. Phiếu = một dòng của
 * `lenh_chuyen_lop` (nhận xét chung + bản chụp phần tự điền + xác nhận) và các dòng `ban_giao_mon`.
 */

type LenhPhieu = {
  id: number; lop_nguon_id: number; lop_dich_id: number | null; trang_thai: string; huong: string;
  han_gvcn: string | null; han_gvbm: string | null; xac_nhan_luc: string | null;
};

const coGvcn = (lopId: number) => !!db().prepare(`SELECT 1 FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`).get(lopId);

/**
 * Quyền trên phiếu theo phân công Ở LỚP NGUỒN của lệnh (không theo ghi danh hiện tại). Planning 30/09 (Câu 1 = A): Quản lý phạm vi lớp nguồn được điền
 * thay và xác nhận thay khi lớp KHÔNG có GVCN hoặc quá hạn 3 ngày. `doc` không tính GV lớp chuyển đến — phần đó cần biết phiếu đã xác nhận/đã chuyển (Q15).
 */
export function quyenBanGiao(p: Principal, l: { lop_nguon_id: number; han_gvcn: string | null }, mon?: string, o: { coGvcn?: boolean; ct?: string | null } = {}) {
  const pc = phanCongO(db(), p.userId, l.lop_nguon_id);
  const ql = coTheRaLenh(p, l.lop_nguon_id);
  const qlThay = ql && (!(o.coGvcn ?? coGvcn(l.lop_nguon_id)) || (!!l.han_gvcn && demoToday() > l.han_gvcn));
  const dungMon = !!mon && kyNangPhuTrach(o.ct ?? null, mon).some((k) => pc.kyNang.has(k));
  return {
    ghiMon: !!mon && (pc.gvcn || dungMon || qlThay), gvbmDungMon: dungMon,
    xacNhan: pc.gvcn || qlThay, xacNhanThay: !pc.gvcn && qlThay,
    doNguon: pc.gvcn || pc.kyNang.size > 0 || can(p, PERMISSIONS.STUDENT_VIEW, { classId: l.lop_nguon_id }),
    laGvcn: pc.gvcn, kyNang: pc.kyNang, qlThay,
  };
}

// ==================================================================== phần TỰ ĐIỀN (chỉ đọc) — theo lô

/**
 * PR-S5F-a (T58): dòng "Kết quả" của phiếu. Lớp thường: % Cuối khoá (`chuCuoiKhoaLo` — đọc được cả sau khi em đã chuyển đi); chưa có bài Cuối khoá
 * thì dòng kết quả gần nhất KHÔNG kèm nhãn SOS (lớp thường không dùng mức SOS). FT: dòng kết quả như cũ.
 */
function ketQuaTheoLo(nguon: { id: number; ct: string | null }, sids: readonly number[]): Map<number, string> {
  const out = new Map<number, string>();
  const thuong = !!programmeOf(nguon.ct) && programmeOf(nguon.ct) !== 'FT';
  const ck = thuong ? chuCuoiKhoaLo(nguon.id, sids) : new Map<number, string>();
  const con = sids.filter((s) => !ck.has(s));
  const standing = con.length ? standingFor([...con]) : new Map();
  for (const sid of sids) {
    const st = standing.get(sid);
    out.set(sid, ck.get(sid) ?? (st ? standingLine(thuong && st.sosLevel ? { ...st, sosLevel: 0 } : st) : 'Chưa có kết quả'));
  }
  return out;
}

/** Kết quả gần nhất · Case đang mở + người nhận gợi ý · Ý thức · việc còn dở của MỌI em một lần (không hỏi lại theo em). Mọi lệnh cùng MỘT lớp nguồn. */
function tuDienTheoLo(nguon: { id: number; ct: string | null }, ds: { id: number; student_id: number; lop_dich_id: number | null }[]): Map<number, TuDien> {
  const out = new Map<number, TuDien>();
  if (!ds.length) return out;
  const conn = db();
  const sids = [...new Set(ds.map((l) => l.student_id))];
  const ketQua = ketQuaTheoLo(nguon, sids);
  const yt = trangThaiYThuc(sids);
  const cases: { id: number; student_id: number; title: string | null; category: string | null; owner: string | null }[] = [];
  theoLo(sids, (lo, ph) => {
    cases.push(...conn.prepare(
      `SELECT sc.id, sc.student_id, sc.title, sc.category, u.full_name AS owner FROM sos_cases sc LEFT JOIN users u ON u.id = sc.owner_user_id
        WHERE sc.status != 'done' AND sc.student_id IN (${ph}) ORDER BY sc.id`,
    ).all(...lo) as any[]);
  });
  const baiChuaLam = new Map<number, number>();
  theoLo(sids, (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT student_id, COUNT(*) AS n FROM assessment_attempts WHERE status = 'planned' AND student_id IN (${ph}) GROUP BY student_id`,
    ).all(...lo) as any[]) baiChuaLam.set(r.student_id, r.n);
  });
  /* PR-S5F-a (planning chốt): PA bổ trợ Giữa khoá CHƯA ghi kết quả cuối không tự khép khi chuyển — người dạy cũ ghi tiếp; phiếu nói rõ. */
  const paDo = new Map<number, string[]>();
  theoLo(sids, (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT sc.student_id, sc.category, COALESCE(u.full_name, iv.performer_name) AS gv FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN users u ON u.id = iv.performer_user_id
        WHERE iv.kind = 'bo_tro' AND iv.status IN ('planned', 'started') AND sc.status != 'done' AND sc.student_id IN (${ph}) ORDER BY iv.id`,
    ).all(...lo) as any[]) {
      paDo.set(r.student_id, [...(paDo.get(r.student_id) ?? []), `PA bổ trợ Progress Test ${tenMonNgan(nguon.ct, r.category)} chờ Kết quả cuối${r.gv ? ` (${r.gv})` : ''}`]);
    }
  });
  /* Người nhận gợi ý: MỘT lần mỗi lớp chuyển đến (không mỗi em). */
  const goiYTheoDich = new Map<number, Map<number, { id: number; ten: string } | null>>();
  for (const dich of new Set(ds.map((l) => l.lop_dich_id).filter((x): x is number => !!x))) {
    goiYTheoDich.set(dich, nguoiNhanGoiY(cases.map((c) => ({ id: c.id, category: c.category })), dich));
  }
  for (const l of ds) {
    const em = yt.get(l.student_id);
    const goiY = l.lop_dich_id ? goiYTheoDich.get(l.lop_dich_id) : undefined;
    const bacTen = em && em.bac > 0 ? `Đã qua ${nhanLoaiXuLy(kindCuaBac(em.bac))}` : 'Chưa có xử lý';
    const cho = em ? em.soBatBuoc + em.soMoi : 0;
    const n = baiChuaLam.get(l.student_id) ?? 0;
    out.set(l.id, {
      ketQua: ketQua.get(l.student_id) ?? 'Chưa có kết quả',
      caseMo: cases.filter((c) => c.student_id === l.student_id).map((c) => ({
        id: c.id, ten: c.title ?? 'Case', nguoiNhan: goiY?.get(c.id)?.ten ?? c.owner ?? null,
      })),
      yThuc: `${bacTen} · ${cho > 0 ? `${cho} vi phạm chờ xử lý` : 'không có vi phạm chờ xử lý'}`,
      viecConDo: [...(n > 0 ? [`${n} bài chưa làm`] : []), ...(paDo.get(l.student_id) ?? [])].join(' · ') || 'Không có',
    });
  }
  return out;
}

// ==================================================================== đọc phiếu

/**
 * Màn F/G và "Đọc bàn giao": mọi lệnh có phiếu của MỘT lớp nguồn (hoặc một lệnh). Số câu SQL KHÔNG tăng theo số em.
 * Người đọc: GV/QL lớp nguồn; GV/QL lớp chuyển đến chỉ khi phiếu đã xác nhận hoặc lệnh đã chuyển (Q15). Còn lại 403.
 */
export function phieuBanGiao(p: Principal, f: { lopNguonId?: number; lenhId?: number; mon?: string }): PhieuBanGiaoDto {
  const conn = db();
  let lopId = f.lopNguonId ?? 0;
  if (f.lenhId) {
    const r = conn.prepare('SELECT lop_nguon_id FROM lenh_chuyen_lop WHERE id = ?').get(f.lenhId) as any;
    if (!r) throw notFound('Không tìm thấy quyết định chuyển lớp');
    lopId = r.lop_nguon_id;
  }
  const nguon = conn.prepare('SELECT id, code, programme_code, is_fast_track FROM classes WHERE id = ?').get(lopId) as any;
  if (!nguon) throw notFound('Không tìm thấy lớp');
  const homNay = demoToday();
  const ct = (nguon.programme_code ?? null) as string | null;

  const rows = conn.prepare(
    `SELECT l.*, s.full_name, s.student_code, d.code AS dich_code, xn.full_name AS xn_ten
       FROM lenh_chuyen_lop l JOIN students s ON s.id = l.student_id
       LEFT JOIN classes d ON d.id = l.lop_dich_id LEFT JOIN users xn ON xn.id = l.xac_nhan_boi
      WHERE l.lop_nguon_id = ? AND l.trang_thai != 'huy' AND l.huong != 'dung_hoc' ${f.lenhId ? 'AND l.id = ?' : ''}
      ORDER BY s.full_name, l.id`,
  ).all(...(f.lenhId ? [lopId, f.lenhId] : [lopId])) as any[];

  const gv = conn.prepare(
    `SELECT ta.user_id, ta.is_core, ta.skill, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
      WHERE ta.class_id = ? AND ta.status = 'active'`,
  ).all(lopId) as any[];
  const coGvcnLop = gv.some((r) => !!r.is_core);

  /* Quyền đọc: phía nguồn xem hết; phía đích chỉ dòng đã xác nhận/đã chuyển của lớp chuyển đến mình có quyền. */
  /* Quản lý xác nhận thay theo hạn của dòng CHƯA xác nhận (PR-S5F-a) — dòng đã xác nhận quá hạn cũ không mở quyền thay cho dòng mới. */
  const q = quyenBanGiao(p, { lop_nguon_id: lopId, han_gvcn: rows.filter((r) => !r.xac_nhan_luc).map((r) => r.han_gvcn).filter(Boolean).sort()[0] ?? null }, undefined, { coGvcn: coGvcnLop, ct });
  let thay = rows;
  if (!q.doNguon) {
    const dich = [...new Set(rows.map((r) => r.lop_dich_id).filter((x): x is number => !!x))];
    const laGvDich = new Set<number>();
    if (dich.length) {
      theoLo(dich, (lo, ph) => {
        for (const r of conn.prepare(`SELECT DISTINCT class_id FROM teacher_assignments WHERE user_id = ? AND status = 'active' AND class_id IN (${ph})`).all(p.userId, ...lo) as any[]) laGvDich.add(r.class_id);
      });
      for (const id of dich) if (!laGvDich.has(id) && can(p, PERMISSIONS.STUDENT_VIEW, { classId: id })) laGvDich.add(id);
    }
    thay = rows.filter((r) => r.lop_dich_id && laGvDich.has(r.lop_dich_id) && (r.xac_nhan_luc || r.trang_thai === 'da_chuyen'));
    if (!thay.length) throw forbidden('Bạn không có quyền đọc bàn giao của lớp này.');
  }
  if (f.lenhId && !thay.length) throw forbidden('Bạn không có quyền đọc bàn giao này.');

  const dongMon = new Map<number, Map<string, any>>();
  if (thay.length) {
    theoLo(thay.map((r) => r.id as number), (lo, ph) => {
      for (const m of conn.prepare(
        `SELECT b.*, u.full_name AS ten_ghi FROM ban_giao_mon b JOIN users u ON u.id = b.nguoi_ghi WHERE b.lenh_id IN (${ph})`,
      ).all(...lo) as any[]) {
        if (!dongMon.has(m.lenh_id)) dongMon.set(m.lenh_id, new Map());
        dongMon.get(m.lenh_id)!.set(m.mon, m);
      }
    });
  }
  const chuaXacNhan = thay.filter((r) => !r.xac_nhan_luc);
  const tuDien = tuDienTheoLo({ id: lopId, ct }, chuaXacNhan);
  /* PR-S5F-a: phiếu đã chụp vẫn đọc dòng Kết quả MỚI của lớp thường (sửa điểm Cuối khoá sau khi xác nhận) — không giữ chữ cũ. */
  const ketQuaMoi = programmeOf(ct) && programmeOf(ct) !== 'FT' && thay.length > chuaXacNhan.length
    ? ketQuaTheoLo({ id: lopId, ct }, thay.filter((r) => r.xac_nhan_luc).map((r) => r.student_id as number)) : new Map<number, string>();
  const bang = boMonCt(ct);
  const gvbmCua = (ma: string) => gv.filter((r) => r.skill && kyNangPhuTrach(ct, ma).includes(r.skill)).map((r) => r.full_name as string);
  const monDs = bang.map((ma) => ({ ma, ten: tenMon(ct, ma), ngan: tenMonNgan(ct, ma) }));

  const ds: PhieuEm[] = thay.map((r) => {
    const dong = dongMon.get(r.id) ?? new Map();
    const mon: PhieuMon[] = monDs.map((m) => {
      const x = dong.get(m.ma);
      return {
        ...m, noiDung: x?.noi_dung ?? null, nguoiGhi: x?.ten_ghi ?? null, ghiLuc: x?.ghi_luc ?? null, dienThay: !!x?.dien_thay, gvbm: gvbmCua(m.ma),
        lamLai: !!x?.lam_lai, id: (x?.id ?? null) as number | null,
      };
    });
    const daGhi = mon.filter((m) => m.noiDung && !m.lamLai).length;
    const chup = r.tu_dien ? (JSON.parse(r.tu_dien) as { tuDien: TuDien; gvbmChuaBanGiao: string[] }) : null;
    return {
      lenhId: r.id, studentId: r.student_id, ten: r.full_name, maHv: r.student_code, huong: r.huong, trangThaiLenh: r.trang_thai,
      lopDich: r.lop_dich_id ? { id: r.lop_dich_id, code: r.dich_code } : null, tuan: r.tuan_bat_dau, ngayXemLai: r.ngay_xem_lai ?? null,
      hanGvbm: r.han_gvbm, hanGvcn: r.han_gvcn,
      phieu: trangThaiPhieu({ soMonDaGhi: daGhi, soMon: mon.length, daXacNhan: !!r.xac_nhan_luc }), soMonDaGhi: daGhi, soMon: mon.length,
      tuDien: chup ? { ...chup.tuDien, ketQua: ketQuaMoi.get(r.student_id) ?? chup.tuDien.ketQua } : tuDien.get(r.id) ?? null, tuDienDaChup: !!chup,
      mon, nhanXetChung: r.nhan_xet_chung ?? null,
      xacNhan: r.xac_nhan_luc ? { boi: r.xn_ten ?? null, luc: r.xac_nhan_luc, thay: !!r.xac_nhan_thay } : null,
      gvbmChuaBanGiao: chup?.gvbmChuaBanGiao ?? mon.filter((m) => !m.noiDung || m.lamLai).map((m) => m.ngan),
      suaDuoc: false,
    };
  });

  const monGhi = q.doNguon ? monDs.filter((m) => q.laGvcn || q.qlThay || kyNangPhuTrach(ct, m.ma).some((k) => q.kyNang.has(k))).map((m) => m.ma) : [];
  /* OV-7a: phiếu đã xác nhận — người ghi được (GVCN / GVBM đúng môn) sửa tới ngày thi hành lệnh; Quản lý lớp nguồn sửa mọi lúc. */
  const ql = coTheRaLenh(p, lopId);
  /* OV-13h (chủ SP 15/10): không còn khoá theo ngày chuyển lớp — GVBM / GVCN lớp nguồn sửa mọi lúc. */
  for (const e of ds) e.suaDuoc = !!e.xacNhan && e.trangThaiLenh !== 'huy' && (ql || q.xacNhan || monGhi.length > 0);
  return {
    lop: { id: nguon.id, code: nguon.code, ct, ft: !!nguon.is_fast_track, mon: monDs },
    homNay,
    nguoiXem: { gvcn: q.laGvcn, qlThay: q.qlThay, monGhi, xacNhan: q.xacNhan, xemTuNguon: q.doNguon, ql },
    tong: ds.length, daXacNhan: ds.filter((e) => e.xacNhan).length,
    hanGvcn: thay.filter((r) => !r.xac_nhan_luc).map((r) => r.han_gvcn as string | null).filter(Boolean).sort()[0] ?? null,
    theoMon: monDs.map((m) => ({
      ma: m.ma, daGhi: ds.filter((e) => { const x = e.mon.find((y) => y.ma === m.ma); return !!x?.noiDung && !x.lamLai; }).length, tong: ds.length,
      han: thay.map((r) => r.han_gvbm as string | null).filter(Boolean).sort()[0] ?? null,
    })),
    ds,
  };
}

// ==================================================================== ghi

function docLenhPhieu(id: number): any {
  const l = db().prepare(
    `SELECT l.*, c.programme_code AS ct, c.code AS nguon_code, s.full_name FROM lenh_chuyen_lop l
       JOIN classes c ON c.id = l.lop_nguon_id JOIN students s ON s.id = l.student_id WHERE l.id = ?`,
  ).get(id);
  if (!l) throw notFound('Không tìm thấy quyết định chuyển lớp');
  return l;
}

/** Môn chưa có câu bàn giao (tên ngắn) — ghi vào bản chụp lúc xác nhận / sửa. */
function chuaBanGiaoCua(lenhId: number, ct: string | null): string[] {
  const da = new Set((db().prepare('SELECT mon FROM ban_giao_mon WHERE lenh_id = ? AND lam_lai = 0').all(lenhId) as any[]).map((r) => r.mon as string));
  return boMonCt(ct).filter((m) => !da.has(m)).map((m) => tenMonNgan(ct, m));
}

/** Một dòng môn (UPSERT). GVBM đúng môn ghi; GVCN (hoặc Quản lý khi thay được) điền thay → `dien_thay`. OV-7a / OV-13h: sau xác nhận vẫn sửa được, cả sau ngày chuyển lớp (chủ SP 15/10). */
export function ghiMon(p: Principal, lenhId: number, mon: string, noiDung: string): void {
  const l = docLenhPhieu(lenhId);
  const q = quyenBanGiao(p, l, mon, { ct: l.ct });
  const qlSua = !!l.xac_nhan_luc && coTheRaLenh(p, l.lop_nguon_id);
  if (!q.ghiMon && !qlSua) throw forbidden('Bạn chỉ ghi được bàn giao cho môn mình được phân công (GVCN điền thay được).');
  if (l.trang_thai === 'huy') throw badRequest('Quyết định chuyển lớp đã huỷ — không ghi bàn giao được.');
  if (!coPhieu(l.huong)) throw badRequest('Quyết định Dừng học hẳn không có phiếu bàn giao.');
  if (!boMonCt(l.ct).includes(mon)) throw badRequest('Môn này không có ở lớp nguồn.');
  const text = String(noiDung ?? '').trim();
  if (!text) throw badRequest('Viết một câu bàn giao.');
  if (text.length > 300) throw badRequest('Câu bàn giao tối đa 300 ký tự.');
  tx(() => {
    const cu = db().prepare('SELECT noi_dung FROM ban_giao_mon WHERE lenh_id = ? AND mon = ?').get(lenhId, mon) as any;
    db().prepare(
      `INSERT INTO ban_giao_mon (lenh_id, mon, noi_dung, nguoi_ghi, dien_thay, ghi_luc) VALUES (?,?,?,?,?,?)
       ON CONFLICT (lenh_id, mon) DO UPDATE SET noi_dung = excluded.noi_dung, nguoi_ghi = excluded.nguoi_ghi, dien_thay = excluded.dien_thay, ghi_luc = excluded.ghi_luc,
         lam_lai = 0`,
    ).run(lenhId, mon, text, p.userId, q.gvbmDungMon ? 0 : 1, mocNghiepVu());   // ngày nghiệp vụ (bản demo: ngày demo + giờ thật)
    const tuDien = (db().prepare('SELECT tu_dien FROM lenh_chuyen_lop WHERE id = ?').get(lenhId) as any).tu_dien as string | null;   // đọc trong tx: không đè bản chụp mới hơn
    if (tuDien) {
      /* Phiếu đã chụp: "GVBM chưa bàn giao" đếm lại — phần tự điền giữ bản chụp. */
      const chup = JSON.parse(tuDien);
      db().prepare('UPDATE lenh_chuyen_lop SET tu_dien = ?, sua_luc = ? WHERE id = ?').run(JSON.stringify({ ...chup, gvbmChuaBanGiao: chuaBanGiaoCua(lenhId, l.ct) }), mocNghiepVu(), lenhId);
    }
    writeAudit({ actorUserId: p.userId, action: 'ban_giao.ghi_mon', entityType: 'student', entityId: l.student_id, entityLabel: l.full_name,
      before: cu ? { lenhId, mon, noiDung: cu.noi_dung } : undefined, after: { lenhId, mon, noiDung: text, dienThay: !q.gvbmDungMon } });
  });
}

/** GVCN lớp nguồn (hoặc Quản lý xác nhận thay) chốt phiếu: nhận xét chung ≥ 15 ký tự, chụp phần tự điền, một sự kiện Hành trình. Được cả SAU khi lệnh đã chuyển. */
export function xacNhanBanGiao(p: Principal, lenhId: number, nhanXetChung: string): void {
  const l = docLenhPhieu(lenhId);
  if (l.trang_thai === 'huy') throw badRequest('Quyết định chuyển lớp đã huỷ — không xác nhận bàn giao được.');
  if (!coPhieu(l.huong)) throw badRequest('Quyết định Dừng học hẳn không có phiếu bàn giao.');
  const q = quyenBanGiao(p, l, undefined, { ct: l.ct });
  if (!q.xacNhan) throw forbidden('Chỉ GVCN lớp nguồn xác nhận bàn giao (Quản lý xác nhận thay khi lớp không có GVCN hoặc đã quá hạn).');
  if (l.xac_nhan_luc) throw conflict('Phiếu đã được xác nhận.');
  const nx = String(nhanXetChung ?? '').trim();
  if (nx.length < NHAN_XET_TOI_THIEU) throw badRequest(`Nhận xét chung cần ít nhất ${NHAN_XET_TOI_THIEU} ký tự.`);
  tx(() => {
    const conn = db();
    const tuDien = tuDienTheoLo({ id: l.lop_nguon_id, ct: l.ct }, [l]).get(l.id)!;
    const chuaBanGiao = chuaBanGiaoCua(lenhId, l.ct);
    const luc = mocNghiepVu();
    const r = conn.prepare(
      `UPDATE lenh_chuyen_lop SET nhan_xet_chung = ?, tu_dien = ?, xac_nhan_boi = ?, xac_nhan_luc = ?, xac_nhan_thay = ?, sua_luc = ?
        WHERE id = ? AND xac_nhan_luc IS NULL`,
    ).run(nx, JSON.stringify({ tuDien, gvbmChuaBanGiao: chuaBanGiao }), p.userId, luc, q.xacNhanThay ? 1 : 0, luc, lenhId);
    if (!r.changes) throw conflict('Phiếu vừa được xác nhận.');
    writeAudit({ actorUserId: p.userId, action: 'ban_giao.xac_nhan', entityType: 'student', entityId: l.student_id, entityLabel: l.full_name, after: { lenhId, thay: q.xacNhanThay, gvbmChuaBanGiao: chuaBanGiao } });
    baoBanGiao(p, l, nx);
  });
}

/** Hành trình + chuông lớp chuyển đến (khoá `ban_giao:{lệnh}` — lưu lại không báo lại người đã nhận, chỉ người mới của lớp đích). */
function baoBanGiao(p: Principal, l: any, nx: string) {
  addJourney({
    studentId: l.student_id, eventType: 'handover', eventDate: demoToday(), title: `Bàn giao từ ${l.nguon_code}`,
    detail: nx, refTable: 'lenh_chuyen_lop', refId: l.id, createdBy: p.userId, dedupKey: `ban_giao:${l.id}`,
  });
  if (!l.lop_dich_id) return;
  for (const userId of nguoiNhanCuaLop([l.lop_dich_id]).get(l.lop_dich_id) ?? []) {
    if (userId === p.userId) continue;
    notify({
      userId, kind: 'ban_giao', title: `Đã có bàn giao · ${l.full_name}`, body: `Từ ${l.nguon_code}`,
      entityType: 'student', entityId: l.student_id, dedupKey: `ban_giao:${l.id}`, duong: `/hoc-vien/lop/${l.lop_dich_id}`,
    });
  }
}

/**
 * OV-7a: SỬA phiếu đã xác nhận — GVCN lớp nguồn (hoặc Quản lý xác nhận thay), mọi lúc (OV-13h, chủ SP 15/10 — bỏ khoá ngày chuyển lớp). Lưu lại = nhận xét chung
 * mới + chụp lại phần tự điền; người / lúc xác nhận đầu giữ. Hành trình: sự kiện cũ đổi khoá (giữ làm lịch sử) rồi ghi sự kiện mới.
 */
export function suaBanGiao(p: Principal, lenhId: number, nhanXetChung: string): void {
  const l = docLenhPhieu(lenhId);
  if (l.trang_thai === 'huy') throw badRequest('Quyết định chuyển lớp đã huỷ — không sửa bàn giao được.');
  if (!l.xac_nhan_luc) throw badRequest('Phiếu chưa xác nhận — viết nhận xét chung rồi Xác nhận bàn giao.');
  const q = quyenBanGiao(p, l, undefined, { ct: l.ct });
  if (!q.xacNhan && !coTheRaLenh(p, l.lop_nguon_id)) throw forbidden('Chỉ GVCN lớp nguồn hoặc Quản lý sửa được nhận xét chung của bàn giao.');
  const nx = String(nhanXetChung ?? '').trim();
  if (nx.length < NHAN_XET_TOI_THIEU) throw badRequest(`Nhận xét chung cần ít nhất ${NHAN_XET_TOI_THIEU} ký tự.`);
  tx(() => {
    const conn = db();
    const tuDien = tuDienTheoLo({ id: l.lop_nguon_id, ct: l.ct }, [l]).get(l.id)!;
    conn.prepare('UPDATE lenh_chuyen_lop SET nhan_xet_chung = ?, tu_dien = ?, sua_luc = ? WHERE id = ?')
      .run(nx, JSON.stringify({ tuDien, gvbmChuaBanGiao: chuaBanGiaoCua(lenhId, l.ct) }), mocNghiepVu(), lenhId);
    if (nx !== l.nhan_xet_chung) {
      conn.prepare(`UPDATE journey_events SET dedup_key = dedup_key || ? WHERE dedup_key = ?`).run(`:sua:${nowIso()}`, `ban_giao:${lenhId}`);
      baoBanGiao(p, l, nx);
    }
    writeAudit({ actorUserId: p.userId, action: 'ban_giao.sua', entityType: 'student', entityId: l.student_id, entityLabel: l.full_name,
      before: { lenhId, nhanXetChung: l.nhan_xet_chung }, after: { lenhId, nhanXetChung: nx } });
  });
}

// ==================================================================== VIỆC (Công việc › Vận hành) — gộp theo lớp, đọc theo lô

export type ViecBanGiao =
  | { loai: 'gvcn'; userId: number; lopId: number; code: string; n: number; daXacNhan: number; chua: string[]; han: string; motEm: { ten: string; lopDich: string | null } | null; emIds: number[] }
  | { loai: 'gvbm'; userId: number; lopId: number; code: string; mon: string; monNgan: string; daGhi: number; n: number; han: string; emIds: number[] };

/**
 * Việc bàn giao của MỘT người: GVCN — MỘT việc mỗi lớp nguồn có lệnh (không `huy`, có phiếu, còn phiếu chưa xác nhận); GVBM — MỘT việc mỗi (lớp,
 * môn) còn em chưa ghi. Ba câu đọc cho mọi lớp của người xem (phân công · lệnh · dòng môn), không hỏi lại theo em.
 * OV-11c (CV-8): `userId` null = việc của MỌI người được phân công (Công việc › Của GV) — vẫn ba câu, không hỏi lại theo người.
 */
export function viecBanGiao(userId: number | null, branchId?: number | null): ViecBanGiao[] {
  const conn = db();
  const dk = [`ta.status = 'active'`, ...(userId !== null ? ['ta.user_id = ?'] : []), ...(branchId ? ['c.branch_id = ?'] : [])];
  const pc = conn.prepare(
    `SELECT ta.user_id, ta.class_id, ta.is_core, ta.skill, c.code, c.programme_code AS ct FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      WHERE ${dk.join(' AND ')}`,
  ).all(...[userId, branchId].filter((x) => x !== null && x !== undefined)) as any[];
  if (!pc.length) return [];
  /* Khoá (người, lớp). */
  const lop = new Map<string, { userId: number; lopId: number; code: string; ct: string | null; gvcn: boolean; kyNang: Set<string> }>();
  for (const r of pc) {
    const k = `${r.user_id}|${r.class_id}`;
    const x = lop.get(k) ?? { userId: r.user_id as number, lopId: r.class_id as number, code: r.code as string, ct: (r.ct ?? null) as string | null, gvcn: false, kyNang: new Set<string>() };
    if (r.is_core) x.gvcn = true;
    if (r.skill) x.kyNang.add(r.skill);
    lop.set(k, x);
  }
  const ids = [...new Set(pc.map((r) => r.class_id as number))];
  const lenh: any[] = [];
  theoLo(ids, (lo, ph) => {
    lenh.push(...conn.prepare(
      `SELECT l.id, l.student_id, l.lop_nguon_id, l.han_gvbm, l.han_gvcn, l.xac_nhan_luc, s.full_name, d.code AS dich
         FROM lenh_chuyen_lop l JOIN students s ON s.id = l.student_id LEFT JOIN classes d ON d.id = l.lop_dich_id
        WHERE l.lop_nguon_id IN (${ph}) AND l.trang_thai != 'huy' AND l.huong != 'dung_hoc' ORDER BY s.full_name`,
    ).all(...lo) as any[]);
  });
  if (!lenh.length) return [];
  const daGhi = new Set<string>();   // `${lenhId}:${mon}`
  theoLo(lenh.map((l) => l.id as number), (lo, ph) => {
    for (const r of conn.prepare(`SELECT lenh_id, mon FROM ban_giao_mon WHERE lam_lai = 0 AND lenh_id IN (${ph})`).all(...lo) as any[]) daGhi.add(`${r.lenh_id}:${r.mon}`);
  });
  const out: ViecBanGiao[] = [];
  for (const x of lop.values()) {
    const { lopId } = x;
    const cua = lenh.filter((l) => l.lop_nguon_id === lopId);
    const chuaXn = cua.filter((l) => !l.xac_nhan_luc);
    if (!chuaXn.length) continue;
    const mons = boMonCt(x.ct);
    if (x.gvcn) {
      const thieu = mons.filter((m) => chuaXn.some((l) => !daGhi.has(`${l.id}:${m}`))).map((m) => tenMonNgan(x.ct, m));
      out.push({
        loai: 'gvcn', userId: x.userId, lopId, code: x.code, n: cua.length, daXacNhan: cua.length - chuaXn.length, chua: thieu,
        han: chuaXn.map((l) => l.han_gvcn as string).filter(Boolean).sort()[0] ?? '',
        motEm: cua.length === 1 ? { ten: cua[0].full_name, lopDich: cua[0].dich ?? null } : null,
        emIds: cua.map((l) => l.student_id as number),
      });
    }
    for (const m of mons) {
      if (!kyNangPhuTrach(x.ct, m).some((k) => x.kyNang.has(k))) continue;
      const chua = chuaXn.filter((l) => !daGhi.has(`${l.id}:${m}`));
      if (!chua.length) continue;
      out.push({
        loai: 'gvbm', userId: x.userId, lopId, code: x.code, mon: m, monNgan: tenMonNgan(x.ct, m), daGhi: chuaXn.length - chua.length, n: chuaXn.length,
        han: chua.map((l) => l.han_gvbm as string).filter(Boolean).sort()[0] ?? '',
        emIds: chua.map((l) => l.student_id as number),
      });
    }
  }
  return out;
}
