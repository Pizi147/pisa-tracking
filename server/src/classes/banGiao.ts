import { db, theoLo, tx } from '../db.ts';
import {
  MEASURE_KIND_LABEL, NHAN_XET_TOI_THIEU, PERMISSIONS, THANG, boMonLich, coPhieu, kyNangGoiY, tenMon, tenMonNgan, trangThaiPhieu,
} from '../../../shared/domain/index.ts';
import { badRequest, conflict, forbidden, notFound, nowIso } from '../util.ts';
import { can, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import { standingFor, standingLine } from '../students/standing.ts';
import { trangThaiYThuc } from '../yThuc/trangThai.ts';
import { nguoiNhanGoiY } from './luatLoTrinh.ts';
import { nguoiNhanCuaLop } from './lenhChuyen.ts';
import { coTheRaLenh, phanCongO } from './quyenChuyenLop.ts';

/**
 * BÀN GIAO (PR-CT, §3.1f Q30-2): có lệnh chuyển lớp → mỗi GVBM ghi MỘT CÂU mỗi em cho môn mình (hạn 2 ngày), GVCN lớp cũ gom lại, viết nhận xét
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
 * thay và xác nhận thay khi lớp KHÔNG có GVCN hoặc quá hạn 3 ngày. `doc` không tính GV lớp đích — phần đó cần biết phiếu đã xác nhận/đã chuyển (Q15).
 */
export function quyenBanGiao(p: Principal, l: { lop_nguon_id: number; han_gvcn: string | null }, mon?: string, o: { coGvcn?: boolean; ct?: string | null } = {}) {
  const pc = phanCongO(db(), p.userId, l.lop_nguon_id);
  const ql = coTheRaLenh(p, l.lop_nguon_id);
  const qlThay = ql && (!(o.coGvcn ?? coGvcn(l.lop_nguon_id)) || (!!l.han_gvcn && demoToday() > l.han_gvcn));
  const dungMon = !!mon && kyNangGoiY(o.ct ?? null, mon).some((k) => pc.kyNang.has(k));
  return {
    ghiMon: !!mon && (pc.gvcn || dungMon || qlThay), gvbmDungMon: dungMon,
    xacNhan: pc.gvcn || qlThay, xacNhanThay: !pc.gvcn && qlThay,
    doNguon: pc.gvcn || pc.kyNang.size > 0 || can(p, PERMISSIONS.STUDENT_VIEW, { classId: l.lop_nguon_id }),
    laGvcn: pc.gvcn, kyNang: pc.kyNang, qlThay,
  };
}

// ==================================================================== phần TỰ ĐIỀN (chỉ đọc) — theo lô

export type TuDien = {
  ketQua: string;
  caseMo: { id: number; ten: string; nguoiNhan: string | null }[];
  yThuc: string; viecConDo: string;
};

/** Kết quả gần nhất · Case đang mở + người nhận gợi ý · Ý thức · việc còn dở của MỌI em một lần (không hỏi lại theo em). */
function tuDienTheoLo(ds: { id: number; student_id: number; lop_dich_id: number | null }[]): Map<number, TuDien> {
  const out = new Map<number, TuDien>();
  if (!ds.length) return out;
  const conn = db();
  const sids = [...new Set(ds.map((l) => l.student_id))];
  const standing = standingFor(sids);
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
  /* Người nhận gợi ý: MỘT lần mỗi lớp đích (không mỗi em). */
  const goiYTheoDich = new Map<number, Map<number, { id: number; ten: string } | null>>();
  for (const dich of new Set(ds.map((l) => l.lop_dich_id).filter((x): x is number => !!x))) {
    goiYTheoDich.set(dich, nguoiNhanGoiY(cases.map((c) => ({ id: c.id, category: c.category })), dich));
  }
  for (const l of ds) {
    const st = standing.get(l.student_id);
    const em = yt.get(l.student_id);
    const goiY = l.lop_dich_id ? goiYTheoDich.get(l.lop_dich_id) : undefined;
    const bacTen = em && em.bac > 0 ? `Đã qua ${MEASURE_KIND_LABEL[THANG[em.bac - 1]] ?? `bậc ${em.bac}`}` : 'Chưa có xử lý';
    const cho = em ? em.soBatBuoc + em.soMoi : 0;
    const n = baiChuaLam.get(l.student_id) ?? 0;
    out.set(l.id, {
      ketQua: st ? standingLine(st) : 'Chưa có kết quả',
      caseMo: cases.filter((c) => c.student_id === l.student_id).map((c) => ({
        id: c.id, ten: c.title ?? 'Case', nguoiNhan: goiY?.get(c.id)?.ten ?? c.owner ?? null,
      })),
      yThuc: `${bacTen} · ${cho > 0 ? `${cho} vi phạm chờ xử lý` : 'không có vi phạm chờ xử lý'}`,
      viecConDo: n > 0 ? `${n} bài chưa làm` : 'Không có',
    });
  }
  return out;
}

// ==================================================================== đọc phiếu

export type PhieuMon = {
  ma: string; ten: string; ngan: string; noiDung: string | null; nguoiGhi: string | null; ghiLuc: string | null; dienThay: boolean;
  gvbm: string[];
};
export type PhieuEm = {
  lenhId: number; studentId: number; ten: string; maHv: string; huong: string; trangThaiLenh: string;
  lopDich: { id: number; code: string } | null; tuan: string; ngayXemLai: string | null;
  hanGvbm: string | null; hanGvcn: string | null;
  phieu: { khoa: string; nhan: string }; soMonDaGhi: number; soMon: number;
  tuDien: TuDien | null; tuDienDaChup: boolean;
  mon: PhieuMon[];
  nhanXetChung: string | null;
  xacNhan: { boi: string | null; luc: string; thay: boolean } | null;
  gvbmChuaBanGiao: string[];
};
export type PhieuBanGiaoDto = {
  lop: { id: number; code: string; ct: string | null; ft: boolean; mon: { ma: string; ten: string; ngan: string }[] };
  homNay: string;
  nguoiXem: { gvcn: boolean; qlThay: boolean; monGhi: string[]; xacNhan: boolean; xemTuNguon: boolean };
  tong: number; daXacNhan: number; hanGvcn: string | null;
  theoMon: { ma: string; daGhi: number; tong: number; han: string | null }[];
  ds: PhieuEm[];
};

/**
 * Màn F/G và "Đọc bàn giao": mọi lệnh có phiếu của MỘT lớp nguồn (hoặc một lệnh). Số câu SQL KHÔNG tăng theo số em.
 * Người đọc: GV/QL lớp nguồn; GV/QL lớp đích chỉ khi phiếu đã xác nhận hoặc lệnh đã chuyển (Q15). Còn lại 403.
 */
export function phieuBanGiao(p: Principal, f: { lopNguonId?: number; lenhId?: number; mon?: string }): PhieuBanGiaoDto {
  const conn = db();
  let lopId = f.lopNguonId ?? 0;
  if (f.lenhId) {
    const r = conn.prepare('SELECT lop_nguon_id FROM lenh_chuyen_lop WHERE id = ?').get(f.lenhId) as any;
    if (!r) throw notFound('Không tìm thấy lệnh chuyển lớp');
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

  /* Quyền đọc: phía nguồn xem hết; phía đích chỉ dòng đã xác nhận/đã chuyển của lớp đích mình có quyền. */
  const q = quyenBanGiao(p, { lop_nguon_id: lopId, han_gvcn: rows.map((r) => r.han_gvcn).filter(Boolean).sort()[0] ?? null }, undefined, { coGvcn: coGvcnLop, ct });
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
  const tuDien = tuDienTheoLo(chuaXacNhan);
  const bang = boMonLich(ct);
  const gvbmCua = (ma: string) => gv.filter((r) => r.skill && kyNangGoiY(ct, ma).includes(r.skill)).map((r) => r.full_name as string);
  const monDs = bang.map((ma) => ({ ma, ten: tenMon(ct, ma), ngan: tenMonNgan(ct, ma) }));

  const ds: PhieuEm[] = thay.map((r) => {
    const dong = dongMon.get(r.id) ?? new Map();
    const mon: PhieuMon[] = monDs.map((m) => {
      const x = dong.get(m.ma);
      return { ...m, noiDung: x?.noi_dung ?? null, nguoiGhi: x?.ten_ghi ?? null, ghiLuc: x?.ghi_luc ?? null, dienThay: !!x?.dien_thay, gvbm: gvbmCua(m.ma) };
    });
    const daGhi = mon.filter((m) => m.noiDung).length;
    const chup = r.tu_dien ? (JSON.parse(r.tu_dien) as { tuDien: TuDien; gvbmChuaBanGiao: string[] }) : null;
    return {
      lenhId: r.id, studentId: r.student_id, ten: r.full_name, maHv: r.student_code, huong: r.huong, trangThaiLenh: r.trang_thai,
      lopDich: r.lop_dich_id ? { id: r.lop_dich_id, code: r.dich_code } : null, tuan: r.tuan_bat_dau, ngayXemLai: r.ngay_xem_lai ?? null,
      hanGvbm: r.han_gvbm, hanGvcn: r.han_gvcn,
      phieu: trangThaiPhieu({ soMonDaGhi: daGhi, soMon: mon.length, daXacNhan: !!r.xac_nhan_luc }), soMonDaGhi: daGhi, soMon: mon.length,
      tuDien: chup?.tuDien ?? tuDien.get(r.id) ?? null, tuDienDaChup: !!chup,
      mon, nhanXetChung: r.nhan_xet_chung ?? null,
      xacNhan: r.xac_nhan_luc ? { boi: r.xn_ten ?? null, luc: r.xac_nhan_luc, thay: !!r.xac_nhan_thay } : null,
      gvbmChuaBanGiao: chup?.gvbmChuaBanGiao ?? mon.filter((m) => !m.noiDung).map((m) => m.ngan),
    };
  });

  const monGhi = q.doNguon ? monDs.filter((m) => q.laGvcn || q.qlThay || kyNangGoiY(ct, m.ma).some((k) => q.kyNang.has(k))).map((m) => m.ma) : [];
  return {
    lop: { id: nguon.id, code: nguon.code, ct, ft: !!nguon.is_fast_track, mon: monDs },
    homNay,
    nguoiXem: { gvcn: q.laGvcn, qlThay: q.qlThay, monGhi, xacNhan: q.xacNhan, xemTuNguon: q.doNguon },
    tong: ds.length, daXacNhan: ds.filter((e) => e.xacNhan).length,
    hanGvcn: thay.filter((r) => !r.xac_nhan_luc).map((r) => r.han_gvcn as string | null).filter(Boolean).sort()[0] ?? null,
    theoMon: monDs.map((m) => ({
      ma: m.ma, daGhi: ds.filter((e) => e.mon.find((x) => x.ma === m.ma)?.noiDung).length, tong: ds.length,
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
  if (!l) throw notFound('Không tìm thấy lệnh chuyển lớp');
  return l;
}

/** Một dòng môn (UPSERT). GVBM đúng môn ghi; GVCN (hoặc Quản lý khi thay được) điền thay → `dien_thay`. */
export function ghiMon(p: Principal, lenhId: number, mon: string, noiDung: string): void {
  const l = docLenhPhieu(lenhId);
  const q = quyenBanGiao(p, l, mon, { ct: l.ct });
  if (!q.ghiMon) throw forbidden('Bạn chỉ ghi được bàn giao cho môn mình được phân công (GVCN điền thay được).');
  if (l.trang_thai === 'huy') throw badRequest('Lệnh đã huỷ — không ghi bàn giao được.');
  if (!coPhieu(l.huong)) throw badRequest('Lệnh Dừng học không có phiếu bàn giao.');
  if (l.xac_nhan_luc) throw badRequest('Phiếu đã được xác nhận — không ghi thêm được.');
  if (!boMonLich(l.ct).includes(mon)) throw badRequest('Môn này không có ở lớp nguồn.');
  const text = String(noiDung ?? '').trim();
  if (!text) throw badRequest('Viết một câu bàn giao.');
  if (text.length > 300) throw badRequest('Câu bàn giao tối đa 300 ký tự.');
  tx(() => {
    db().prepare(
      `INSERT INTO ban_giao_mon (lenh_id, mon, noi_dung, nguoi_ghi, dien_thay, ghi_luc) VALUES (?,?,?,?,?,?)
       ON CONFLICT (lenh_id, mon) DO UPDATE SET noi_dung = excluded.noi_dung, nguoi_ghi = excluded.nguoi_ghi, dien_thay = excluded.dien_thay, ghi_luc = excluded.ghi_luc`,
    ).run(lenhId, mon, text, p.userId, q.gvbmDungMon ? 0 : 1, nowIso());
    writeAudit({ actorUserId: p.userId, action: 'ban_giao.ghi_mon', entityType: 'student', entityId: l.student_id, entityLabel: l.full_name, after: { lenhId, mon, dienThay: !q.gvbmDungMon } });
  });
}

/** GVCN lớp nguồn (hoặc Quản lý xác nhận thay) chốt phiếu: nhận xét chung ≥ 15 ký tự, chụp phần tự điền, một sự kiện Hành trình. Được cả SAU khi lệnh đã chuyển. */
export function xacNhanBanGiao(p: Principal, lenhId: number, nhanXetChung: string): void {
  const l = docLenhPhieu(lenhId);
  if (l.trang_thai === 'huy') throw badRequest('Lệnh đã huỷ — không xác nhận bàn giao được.');
  if (!coPhieu(l.huong)) throw badRequest('Lệnh Dừng học không có phiếu bàn giao.');
  const q = quyenBanGiao(p, l, undefined, { ct: l.ct });
  if (!q.xacNhan) throw forbidden('Chỉ GVCN lớp nguồn xác nhận bàn giao (Quản lý xác nhận thay khi lớp không có GVCN hoặc đã quá hạn).');
  if (l.xac_nhan_luc) throw conflict('Phiếu đã được xác nhận.');
  const nx = String(nhanXetChung ?? '').trim();
  if (nx.length < NHAN_XET_TOI_THIEU) throw badRequest(`Nhận xét chung cần ít nhất ${NHAN_XET_TOI_THIEU} ký tự.`);
  tx(() => {
    const conn = db();
    const tuDien = tuDienTheoLo([l]).get(l.id)!;
    const da = new Set((conn.prepare('SELECT mon FROM ban_giao_mon WHERE lenh_id = ?').all(lenhId) as any[]).map((r) => r.mon as string));
    const chuaBanGiao = boMonLich(l.ct).filter((m) => !da.has(m)).map((m) => tenMonNgan(l.ct, m));
    const luc = nowIso();
    const r = conn.prepare(
      `UPDATE lenh_chuyen_lop SET nhan_xet_chung = ?, tu_dien = ?, xac_nhan_boi = ?, xac_nhan_luc = ?, xac_nhan_thay = ?, sua_luc = ?
        WHERE id = ? AND xac_nhan_luc IS NULL`,
    ).run(nx, JSON.stringify({ tuDien, gvbmChuaBanGiao: chuaBanGiao }), p.userId, luc, q.xacNhanThay ? 1 : 0, luc, lenhId);
    if (!r.changes) throw conflict('Phiếu vừa được xác nhận.');
    addJourney({
      studentId: l.student_id, eventType: 'handover', eventDate: demoToday(), title: `Bàn giao từ ${l.nguon_code}`,
      detail: nx, refTable: 'lenh_chuyen_lop', refId: lenhId, createdBy: p.userId, dedupKey: `ban_giao:${lenhId}`,
    });
    writeAudit({ actorUserId: p.userId, action: 'ban_giao.xac_nhan', entityType: 'student', entityId: l.student_id, entityLabel: l.full_name, after: { lenhId, thay: q.xacNhanThay, gvbmChuaBanGiao: chuaBanGiao } });
    if (l.lop_dich_id) {
      for (const userId of nguoiNhanCuaLop([l.lop_dich_id]).get(l.lop_dich_id) ?? []) {
        if (userId === p.userId) continue;
        notify({
          userId, kind: 'ban_giao', title: `Đã có bàn giao · ${l.full_name}`, body: `Từ ${l.nguon_code}`,
          entityType: 'student', entityId: l.student_id, dedupKey: `ban_giao:${lenhId}`, duong: `/hoc-vien/lop/${l.lop_dich_id}`,
        });
      }
    }
  });
}

/** GVCN nhắc GVBM của một môn (dedup mỗi ngày một lần). */
export function nhacGvbm(p: Principal, lenhId: number, mon: string): { soNguoi: number } {
  const l = docLenhPhieu(lenhId);
  if (!coPhieu(l.huong) || l.trang_thai === 'huy') throw badRequest('Lệnh này không có phiếu cần nhắc.');
  const q = quyenBanGiao(p, l, undefined, { ct: l.ct });
  if (!q.xacNhan) throw forbidden('Chỉ GVCN lớp nguồn nhắc được GVBM.');
  if (!boMonLich(l.ct).includes(mon)) throw badRequest('Môn này không có ở lớp nguồn.');
  const nguoi = db().prepare(
    `SELECT DISTINCT user_id, skill FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND skill IS NOT NULL`,
  ).all(l.lop_nguon_id) as any[];
  const dich = nguoi.filter((r) => kyNangGoiY(l.ct, mon).includes(r.skill));
  const homNay = demoToday();
  for (const r of dich) {
    notify({
      userId: r.user_id, kind: 'nhac_ban_giao', title: `Nhắc bàn giao môn ${tenMonNgan(l.ct, mon)} · ${l.nguon_code}`,
      body: `Hạn hết ${(l.han_gvbm ?? '').slice(8, 10)}/${(l.han_gvbm ?? '').slice(5, 7)}`,
      entityType: 'class', entityId: l.lop_nguon_id, dedupKey: `nhac_ban_giao:${lenhId}:${mon}:${homNay}`, duong: `/hoc-vien/lop/${l.lop_nguon_id}?viec=ban-giao&mon=${mon}`,
    });
  }
  return { soNguoi: dich.length };
}
