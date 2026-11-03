import { boMonBanGiaoCt, boMonCt } from '../normal/regular.ts';
import { DS_JSON, db, theoLo, theoLoJson, tx } from '../db.ts';
import {
  NHAN_XET_TOI_THIEU, PERMISSIONS, kindCuaBac, nhanLoaiXuLy, programmeOf, coPhieu, kyNangPhuTrach, tenMon, tenMonNgan, trangThaiPhieu,
} from '../../../shared/domain/index.ts';
import { badRequest, chuTuDo, conflict, forbidden, notFound, nowIso, loi } from '../util.ts';
import { can, phanCongDaNap, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import type { DiemHv, PhieuBanGiaoDto, PhieuEm, PhieuMon, TuDien } from '../../../shared/domain/index.ts';
import { standingFor, standingLine, type Standing } from '../students/standing.ts';
import { diemCuaLuot } from '../fasttrack/attempts.ts';
import { diemTuStanding } from '../worklist/diemDong.ts';
import { LUOT_HIEN_TAI_SQL } from '../students/tamDung.ts';
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

// ==================================================================== MÔN BÀN GIAO (audit 03/11 F05)

/** Môn đăng ký (N13) của lộ trình FT gần nhất của em lệnh `l` — cột đi cùng câu đọc lệnh, không thêm lượt. */
export const MDK_SQL = (l: string) =>
  `(SELECT lc.mon_dang_ky FROM learning_cycles lc WHERE lc.student_id = ${l}.student_id AND lc.route IS NOT NULL ORDER BY lc.seq DESC LIMIT 1)`;

/**
 * Môn bàn giao của MỘT lệnh: W1 · W2 riêng, bỏ môn em không học (`boMonBanGiaoCt`). Chủ SP 03/11 (câu 17.4): phiếu ĐÃ XÁC NHẬN chỉ có câu
 * Writing chung cũ (trước khi tách) → giữ bộ môn cũ, không mở lại; phiếu chưa xác nhận → W1 · W2 "chưa có", câu cũ chỉ đọc (`writingCu`).
 * `dong`: môn đã có dòng `ban_giao_mon`.
 */
export function monCuaLenh(ct: string | null, mdk: string | null | undefined, dong: { has(m: string): boolean }, daXacNhan: boolean): string[] {
  return daXacNhan && dong.has('writing') && !dong.has('writing1') && !dong.has('writing2') ? [...boMonCt(ct)] : boMonBanGiaoCt(ct, mdk);
}

// ==================================================================== CÙNG GV (chủ SP 30/10)

/** Phân công đang chạy theo lớp: chương trình + dòng (người, kỹ năng, GVCN). */
export type PhanCongLop = Map<number, { ct: string | null; rows: { user_id: number; skill: string | null; is_core: number }[] }>;
export type CungGv = { mon: Set<string>; gvcn: boolean };

/**
 * CHỦ SP 30/10: kỹ năng ở lớp mới vẫn do ĐÚNG GV cũ dạy → không cần bàn giao (dòng môn "Cùng GV · không cần bàn giao", không tính thiếu, không
 * tạo việc cho GV đó). Môn `m` của lệnh "cùng GV" khi mọi GV dạy `m` ở lớp nguồn cũng dạy `m` ở lớp chuyển đến. [PTA đoán] GVCN lớp cũ = GVCN lớp
 * mới → nhận xét chung không bắt buộc. Thuần — nơi gọi đọc phân công (`docPhanCongLop` hoặc một vế UNION sẵn có).
 */
export function cungGvTuPhanCong(lenh: readonly { id: number; lop_nguon_id: number; lop_dich_id: number | null }[], pc: PhanCongLop): Map<number, CungGv> {
  const out = new Map<number, CungGv>();
  const day = (classId: number, m: string) => {
    const x = pc.get(classId);
    return new Set((x?.rows ?? []).filter((r) => r.skill && kyNangPhuTrach(x!.ct, m).includes(r.skill)).map((r) => r.user_id));
  };
  const gvcn = (classId: number) => pc.get(classId)?.rows.find((r) => !!r.is_core)?.user_id ?? null;
  for (const l of lenh) {
    if (!l.lop_dich_id) continue;
    const mon = new Set(boMonBanGiaoCt(pc.get(l.lop_nguon_id)?.ct ?? null).filter((m) => {
      const a = day(l.lop_nguon_id, m);
      const b = day(l.lop_dich_id!, m);
      return a.size > 0 && [...a].every((u) => b.has(u));
    }));
    const g = gvcn(l.lop_nguon_id);
    out.set(l.id, { mon, gvcn: g !== null && g === gvcn(l.lop_dich_id) });
  }
  return out;
}

/** Phân công đang chạy của các lớp (kể cả lớp chưa ai dạy — để có chương trình). Một câu mỗi lô. */
export function docPhanCongLop(ids: readonly number[]): PhanCongLop {
  const m: PhanCongLop = new Map();
  theoLoJson([...new Set(ids)], (json) => {
    for (const r of db().prepare(
      `SELECT c.id AS class_id, c.programme_code AS ct, ta.user_id, ta.skill, ta.is_core FROM classes c
         LEFT JOIN teacher_assignments ta ON ta.class_id = c.id AND ta.status = 'active' WHERE c.id IN (${DS_JSON})`,
    ).all(json) as any[]) {
      const x = m.get(r.class_id) ?? { ct: (r.ct ?? null) as string | null, rows: [] as { user_id: number; skill: string | null; is_core: number }[] };
      if (r.user_id) x.rows.push({ user_id: r.user_id, skill: r.skill ?? null, is_core: r.is_core });
      m.set(r.class_id, x);
    }
  });
  return m;
}

export const cungGvTheoLo = (lenh: readonly { id: number; lop_nguon_id: number; lop_dich_id: number | null }[]) =>
  lenh.some((l) => l.lop_dich_id) ? cungGvTuPhanCong(lenh, docPhanCongLop(lenh.flatMap((l) => (l.lop_dich_id ? [l.lop_nguon_id, l.lop_dich_id] : [])))) : new Map<number, CungGv>();

// ==================================================================== phần TỰ ĐIỀN (chỉ đọc) — theo lô

/**
 * PR-S5F-a (T58): dòng "Kết quả" của phiếu. Lớp thường: % Cuối khoá (`chuCuoiKhoaLo` — đọc được cả sau khi em đã chuyển đi); chưa có bài Cuối khoá
 * thì dòng kết quả gần nhất KHÔNG kèm nhãn SOS (lớp thường không dùng mức SOS). FT: dòng kết quả như cũ.
 */
function ketQuaTheoLo(nguon: { id: number; ct: string | null }, sids: readonly number[], giu?: Map<number, Standing>): Map<number, string> {
  const out = new Map<number, string>();
  const thuong = !!programmeOf(nguon.ct) && programmeOf(nguon.ct) !== 'FT';
  const ck = thuong ? chuCuoiKhoaLo(nguon.id, sids) : new Map<number, string>();
  const con = sids.filter((s) => !ck.has(s));
  const standing = con.length ? standingFor([...con]) : new Map<number, Standing>();
  for (const [k, v] of standing) giu?.set(k, v);
  for (const sid of sids) {
    const st = standing.get(sid);
    out.set(sid, ck.get(sid) ?? (st ? standingLine(thuong && st.sosLevel ? { ...st, sosLevel: 0 } : st) : 'Chưa có kết quả'));
  }
  return out;
}

/** Kết quả gần nhất · Case đang mở + người nhận gợi ý · Ý thức · việc còn dở của MỌI em một lần (không hỏi lại theo em). Mọi lệnh cùng MỘT lớp nguồn. */
export function tuDienTheoLo(nguon: { id: number; ct: string | null }, ds: { id: number; student_id: number; lop_dich_id: number | null }[],
  /** Nơi gọi cần lại `standing` vừa tính (điểm từng môn của phiếu) — giữ vào đây, không tính lại. */
  giuStanding?: Map<number, Standing>): Map<number, TuDien> {
  const out = new Map<number, TuDien>();
  if (!ds.length) return out;
  const conn = db();
  const sids = [...new Set(ds.map((l) => l.student_id))];
  const ketQua = ketQuaTheoLo(nguon, sids, giuStanding);
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
      `SELECT a.student_id, COUNT(*) AS n FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND ${LUOT_HIEN_TAI_SQL('a', 's')}   -- lỗi chủ SP 28/10: chỉ lượt hiện tại
        WHERE a.status = 'planned' AND a.student_id IN (${ph}) GROUP BY a.student_id`,
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
    `SELECT l.*, s.full_name, s.student_code, d.code AS dich_code, xn.full_name AS xn_ten, ${MDK_SQL('l')} AS mdk
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
  const cung = cungGvTheoLo(thay);
  const chuaXacNhan = thay.filter((r) => !r.xac_nhan_luc);
  const stEm = new Map<number, Standing>();
  const tuDien = tuDienTheoLo({ id: lopId, ct }, chuaXacNhan, stEm);
  /*
   * Cột "Kết quả" của bảng GVBM (mockup v11, chủ SP duyệt 03/11): FT — điểm TỪNG môn (W1 · W2 riêng) của lượt mới nhất có điểm, ✓ / ✗ so kỳ vọng của
   * chính lượt đó. `standing` đã tính ở phần tự điền; thêm MỘT câu đọc điểm các lượt đó cho cả phiếu. Phiếu đã xác nhận đọc bản chụp → không có.
   */
  const luotSt = [...new Set([...stEm.values()].filter((s) => s.mode === 'ielts_band' && s.attemptId).map((s) => s.attemptId as number))];
  const diemLuot = luotSt.length ? diemCuaLuot(luotSt) : new Map<number, { skill: string; band: number | null }[]>();
  const diemMonCua = (sid: number, mons: readonly string[]): DiemHv | null => {
    const st = stEm.get(sid);
    const goc = st && st.mode === 'ielts_band' ? diemTuStanding(st) : null;
    if (!st || !goc) return null;
    const kv = st.expectation;
    const kn = mons.map((m) => {
      const v = diemLuot.get(st.attemptId as number)?.find((r) => r.skill === m)?.band ?? null;
      /* KCK dưới kỳ vọng: không ✗ (OV-9, như dòng điểm). */
      return { k: tenMonNgan(ct, m), v, dat: v === null || kv === null ? null : v >= kv ? true : st.kckDuoi ? null : false };
    });
    return { ...goc, kn };
  };
  /* PR-S5F-a: phiếu đã chụp vẫn đọc dòng Kết quả MỚI của lớp thường (sửa điểm Cuối khoá sau khi xác nhận) — không giữ chữ cũ. */
  const ketQuaMoi = programmeOf(ct) && programmeOf(ct) !== 'FT' && thay.length > chuaXacNhan.length
    ? ketQuaTheoLo({ id: lopId, ct }, thay.filter((r) => r.xac_nhan_luc).map((r) => r.student_id as number)) : new Map<number, string>();
  const gvbmCua = (ma: string) => gv.filter((r) => r.skill && kyNangPhuTrach(ct, ma).includes(r.skill)).map((r) => r.full_name as string);
  const monCua = (ma: string) => ({ ma, ten: tenMon(ct, ma), ngan: tenMonNgan(ct, ma) });
  const monDs = boMonBanGiaoCt(ct).map(monCua);

  const ds: PhieuEm[] = thay.map((r) => {
    const dong = dongMon.get(r.id) ?? new Map();
    const monEm = monCuaLenh(ct, r.mdk, dong, !!r.xac_nhan_luc);
    const cu = monEm.includes('writing') ? null : dong.get('writing');   // 17.4: câu Writing chung cũ — chỉ đọc
    const mon: PhieuMon[] = monEm.map(monCua).map((m) => {
      const x = dong.get(m.ma);
      return {
        ...m, noiDung: x?.noi_dung ?? null, nguoiGhi: x?.ten_ghi ?? null, ghiLuc: x?.ghi_luc ?? null, dienThay: !!x?.dien_thay, gvbm: gvbmCua(m.ma),
        lamLai: !!x?.lam_lai, id: (x?.id ?? null) as number | null, cungGv: !!cung.get(r.id)?.mon.has(m.ma),
      };
    });
    const daGhi = mon.filter((m) => (m.noiDung && !m.lamLai) || m.cungGv).length;
    const chup = r.tu_dien ? (JSON.parse(r.tu_dien) as { tuDien: TuDien; gvbmChuaBanGiao: string[] }) : null;
    return {
      lenhId: r.id, studentId: r.student_id, ten: r.full_name, maHv: r.student_code, huong: r.huong, trangThaiLenh: r.trang_thai,
      lopDich: r.lop_dich_id ? { id: r.lop_dich_id, code: r.dich_code } : null, tuan: r.tuan_bat_dau, ngayXemLai: r.ngay_xem_lai ?? null,
      hanGvbm: r.han_gvbm, hanGvcn: r.han_gvcn,
      phieu: trangThaiPhieu({ soMonDaGhi: daGhi, soMon: mon.length, daXacNhan: !!r.xac_nhan_luc }), soMonDaGhi: daGhi, soMon: mon.length,
      tuDien: chup ? { ...chup.tuDien, ketQua: ketQuaMoi.get(r.student_id) ?? chup.tuDien.ketQua } : tuDien.get(r.id) ?? null, tuDienDaChup: !!chup,
      mon, writingCu: cu ? { noiDung: cu.noi_dung, nguoiGhi: cu.ten_ghi, ghiLuc: cu.ghi_luc } : null, nhanXetChung: r.nhan_xet_chung ?? null,
      diemMon: chup ? null : diemMonCua(r.student_id, monEm),
      xacNhan: r.xac_nhan_luc ? { boi: r.xn_ten ?? null, luc: r.xac_nhan_luc, thay: !!r.xac_nhan_thay } : null,
      gvbmChuaBanGiao: chup?.gvbmChuaBanGiao ?? mon.filter((m) => (!m.noiDung || m.lamLai) && !m.cungGv).map((m) => m.ngan),
      suaDuoc: false, gvcnCung: !!cung.get(r.id)?.gvcn,
    };
  });

  const monGhi = q.doNguon ? monDs.filter((m) => q.laGvcn || q.qlThay || kyNangPhuTrach(ct, m.ma).some((k) => q.kyNang.has(k))).map((m) => m.ma) : [];
  /* OV-7a: phiếu đã xác nhận — người ghi được (GVCN / GVBM đúng môn) sửa tới ngày thi hành lệnh; Quản lý lớp nguồn sửa mọi lúc. */
  const ql = coTheRaLenh(p, lopId);
  /* OV-13h (chủ SP 15/10): không còn khoá theo ngày chuyển lớp — GVBM / GVCN lớp nguồn sửa mọi lúc. */
  for (const e of ds) e.suaDuoc = !!e.xacNhan && e.trangThaiLenh !== 'huy' && (ql || q.xacNhan || monGhi.length > 0);
  /* Lỗi chủ SP 30/10: hạn đầu panel = hạn SỚM NHẤT của em chưa xác nhận — trả kèm tên em đó. */
  const som = thay.filter((r) => !r.xac_nhan_luc && r.han_gvcn).sort((a, b) => a.han_gvcn.localeCompare(b.han_gvcn))[0];
  return {
    lop: { id: nguon.id, code: nguon.code, ct, ft: !!nguon.is_fast_track, mon: monDs },
    homNay,
    nguoiXem: { gvcn: q.laGvcn, qlThay: q.qlThay, monGhi, xacNhan: q.xacNhan, xemTuNguon: q.doNguon, ql },
    tong: ds.length, daXacNhan: ds.filter((e) => e.xacNhan).length,
    hanGvcn: som?.han_gvcn ?? null, hanGvcnEm: som?.full_name ?? null,
    theoMon: monDs.map((m) => ({
      ma: m.ma, daGhi: ds.filter((e) => { const x = e.mon.find((y) => y.ma === m.ma); return (!!x?.noiDung && !x.lamLai) || !!x?.cungGv; }).length,
      tong: ds.filter((e) => e.mon.some((y) => y.ma === m.ma)).length,   // em không học môn này không tính (N13)
      han: thay.map((r) => r.han_gvbm as string | null).filter(Boolean).sort()[0] ?? null,
    })),
    ds,
  };
}

// ==================================================================== ghi

function docLenhPhieu(id: number): any {
  const l = db().prepare(
    `SELECT l.*, c.programme_code AS ct, c.code AS nguon_code, s.full_name, ${MDK_SQL('l')} AS mdk FROM lenh_chuyen_lop l
       JOIN classes c ON c.id = l.lop_nguon_id JOIN students s ON s.id = l.student_id WHERE l.id = ?`,
  ).get(id);
  if (!l) throw notFound('Không tìm thấy quyết định chuyển lớp');
  return l;
}

/** Môn chưa có câu bàn giao (tên ngắn; bỏ môn cùng GV — chủ SP 30/10) — ghi vào bản chụp lúc xác nhận / sửa. */
function chuaBanGiaoCua(l: { id: number; lop_nguon_id: number; lop_dich_id: number | null; ct: string | null; mdk?: string | null; xac_nhan_luc?: string | null },
  cung = cungGvTheoLo([l]).get(l.id)): string[] {
  const da = new Set((db().prepare('SELECT mon FROM ban_giao_mon WHERE lenh_id = ? AND lam_lai = 0').all(l.id) as any[]).map((r) => r.mon as string));
  return monCuaLenh(l.ct, l.mdk, da, !!l.xac_nhan_luc).filter((m) => !da.has(m) && !cung?.mon.has(m)).map((m) => tenMonNgan(l.ct, m));
}

/** Một dòng môn (UPSERT). GVBM đúng môn ghi; GVCN (hoặc Quản lý khi thay được) điền thay → `dien_thay`. OV-7a / OV-13h: sau xác nhận vẫn sửa được, cả sau ngày chuyển lớp (chủ SP 15/10). */
export function ghiMon(p: Principal, lenhId: number, mon: string, noiDung: string): void {
  const l = docLenhPhieu(lenhId);
  const q = quyenBanGiao(p, l, mon, { ct: l.ct });
  const qlSua = !!l.xac_nhan_luc && coTheRaLenh(p, l.lop_nguon_id);
  if (!q.ghiMon && !qlSua) throw forbidden('Bạn chỉ ghi được bàn giao cho môn mình được phân công (GVCN điền thay được).');
  if (l.trang_thai === 'huy') throw badRequest('Quyết định chuyển lớp đã huỷ — không ghi bàn giao được.');
  if (!coPhieu(l.huong)) throw badRequest('Quyết định Dừng học hẳn không có phiếu bàn giao.');
  /* W1 · W2 riêng (F05); câu Writing chung cũ chỉ sửa được ở phiếu đã xác nhận giữ bộ môn cũ (17.4). */
  const coCu = mon === 'writing' && !boMonBanGiaoCt(l.ct).includes(mon)
    && !!db().prepare(`SELECT 1 FROM ban_giao_mon WHERE lenh_id = ? AND mon = 'writing'`).get(lenhId) && !!l.xac_nhan_luc;
  if (!boMonBanGiaoCt(l.ct).includes(mon) && !coCu) throw badRequest('Môn này không có ở lớp nguồn.');
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
      db().prepare('UPDATE lenh_chuyen_lop SET tu_dien = ?, sua_luc = ? WHERE id = ?').run(JSON.stringify({ ...chup, gvbmChuaBanGiao: chuaBanGiaoCua(l) }), mocNghiepVu(), lenhId);
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
  const cung = cungGvTheoLo([l]).get(l.id);
  /* Chủ SP 30/10 [PTA đoán]: GVCN lớp mới cũng là GVCN lớp cũ → nhận xét chung không bắt buộc. */
  if (!cung?.gvcn && nx.length < NHAN_XET_TOI_THIEU) throw loi(400, 'Nhận xét chung cần ít nhất {NHAN_XET_TOI_THIEU} ký tự.', { NHAN_XET_TOI_THIEU });
  tx(() => {
    const conn = db();
    const tuDien = tuDienTheoLo({ id: l.lop_nguon_id, ct: l.ct }, [l]).get(l.id)!;
    const chuaBanGiao = chuaBanGiaoCua(l, cung);
    const luc = mocNghiepVu();
    const r = conn.prepare(
      `UPDATE lenh_chuyen_lop SET nhan_xet_chung = ?, tu_dien = ?, xac_nhan_boi = ?, xac_nhan_luc = ?, xac_nhan_thay = ?, sua_luc = ?
        WHERE id = ? AND xac_nhan_luc IS NULL`,
    ).run(nx || null, JSON.stringify({ tuDien, gvbmChuaBanGiao: chuaBanGiao }), p.userId, luc, q.xacNhanThay ? 1 : 0, luc, lenhId);
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

/** PR-B: nhận xét chung của GVCN lưu NHÁP khi rời ô (chống mất chữ) — chỉ khi chưa xác nhận, KHÔNG kiểm ≥ 15 (Xác nhận vẫn kiểm). */
export function luuNhapNhanXet(p: Principal, lenhId: number, chu: unknown): void {
  const l = docLenhPhieu(lenhId);
  if (l.trang_thai === 'huy') throw badRequest('Quyết định chuyển lớp đã huỷ — không xác nhận bàn giao được.');
  if (!quyenBanGiao(p, l, undefined, { ct: l.ct }).xacNhan) throw forbidden('Chỉ GVCN lớp nguồn xác nhận bàn giao (Quản lý xác nhận thay khi lớp không có GVCN hoặc đã quá hạn).');
  const nx = chuTuDo(chu, 'Nhận xét chung', 2000);
  if (!db().prepare('UPDATE lenh_chuyen_lop SET nhan_xet_chung = ? WHERE id = ? AND xac_nhan_luc IS NULL').run(nx, lenhId).changes) throw badRequest('Phiếu đã xác nhận — dùng Sửa.');
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
  const cung = cungGvTheoLo([l]).get(l.id);
  if (!cung?.gvcn && nx.length < NHAN_XET_TOI_THIEU) throw loi(400, 'Nhận xét chung cần ít nhất {NHAN_XET_TOI_THIEU} ký tự.', { NHAN_XET_TOI_THIEU });
  tx(() => {
    const conn = db();
    const tuDien = tuDienTheoLo({ id: l.lop_nguon_id, ct: l.ct }, [l]).get(l.id)!;
    conn.prepare('UPDATE lenh_chuyen_lop SET nhan_xet_chung = ?, tu_dien = ?, sua_luc = ? WHERE id = ?')
      .run(nx || null, JSON.stringify({ tuDien, gvbmChuaBanGiao: chuaBanGiaoCua(l, cung) }), mocNghiepVu(), lenhId);
    if (nx !== (l.nhan_xet_chung ?? '')) {
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
  | { loai: 'gvbm'; userId: number; lopId: number; code: string; mon: string; monNgan: string; daGhi: number; n: number; han: string; emIds: number[];
      /** Việc gộp W1 · W2 (cùng GV): số em từng task. */
      tung?: { mon: string; monNgan: string; daGhi: number; n: number }[] };

/**
 * Việc bàn giao của MỘT người: GVCN — MỘT việc mỗi lớp nguồn có lệnh (không `huy`, có phiếu, còn phiếu chưa xác nhận); GVBM — MỘT việc mỗi (lớp,
 * môn) còn em chưa ghi. Ba câu đọc cho mọi lớp của người xem (phân công · lệnh · dòng môn), không hỏi lại theo em.
 * OV-11c (CV-8): `userId` null = việc của MỌI người được phân công (Công việc › Của GV) — vẫn ba câu, không hỏi lại theo người.
 */
export function viecBanGiao(userId: number | null, branchId?: number | null): ViecBanGiao[] {
  const conn = db();
  const dk = [`ta.status = 'active'`, ...(userId !== null ? ['ta.user_id = ?'] : []), ...(branchId ? ['c.branch_id = ?'] : [])];
  const da = phanCongDaNap();   // TL-VIEC: Công việc đã nạp mọi phân công một câu — lọc đúng WHERE dưới
  const pc = da
    ? da.filter((r) => (userId === null || r.userId === userId) && (!branchId || r.branchId === branchId))
      .map((r) => ({ user_id: r.userId, class_id: r.classId, is_core: r.isCore ? 1 : 0, skill: r.skill, code: r.code, ct: r.ct }))
    : conn.prepare(
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
  theoLoJson(ids, (json) => {
    lenh.push(...conn.prepare(
      `SELECT l.id, l.student_id, l.lop_nguon_id, l.lop_dich_id, l.han_gvbm, l.han_gvcn, l.xac_nhan_luc, s.full_name, d.code AS dich,
              n.programme_code AS ct_nguon, d.programme_code AS ct_dich, ${MDK_SQL('l')} AS mdk,
              CASE WHEN l.xac_nhan_luc IS NULL AND l.lop_dich_id IS NOT NULL THEN (SELECT json_group_array(json_array(ta.class_id, ta.user_id, ta.skill, ta.is_core))
                FROM teacher_assignments ta WHERE ta.status = 'active' AND ta.class_id IN (l.lop_nguon_id, l.lop_dich_id)) END AS pc_json
         FROM lenh_chuyen_lop l JOIN students s ON s.id = l.student_id JOIN classes n ON n.id = l.lop_nguon_id LEFT JOIN classes d ON d.id = l.lop_dich_id
        WHERE l.lop_nguon_id IN (${DS_JSON}) AND l.trang_thai != 'huy' AND l.huong != 'dung_hoc' ORDER BY s.full_name`,
    ).all(json) as any[]);
  });
  if (!lenh.length) return [];
  const daGhi = new Set<string>();   // `${lenhId}:${mon}`
  theoLoJson(lenh.map((l) => l.id as number), (json) => {
    for (const r of conn.prepare(`SELECT lenh_id, mon FROM ban_giao_mon WHERE lam_lai = 0 AND lenh_id IN (${DS_JSON})`).all(json) as any[]) daGhi.add(`${r.lenh_id}:${r.mon}`);
  });
  /* Chủ SP 30/10: môn ở lớp mới vẫn đúng GV cũ dạy → không cần bàn giao (phân công lớp nguồn + đích đi cùng câu lệnh — không thêm lượt). */
  const pcLop: PhanCongLop = new Map();
  for (const l of lenh.filter((x) => x.pc_json)) {
    if (!pcLop.has(l.lop_nguon_id)) pcLop.set(l.lop_nguon_id, { ct: l.ct_nguon ?? null, rows: [] });
    if (!pcLop.has(l.lop_dich_id)) pcLop.set(l.lop_dich_id, { ct: l.ct_dich ?? null, rows: [] });
    for (const [classId, user_id, skill, is_core] of JSON.parse(l.pc_json) as any[][]) {
      const x = pcLop.get(classId)!;
      if (!x.rows.some((r) => r.user_id === user_id && r.skill === skill && r.is_core === is_core)) x.rows.push({ user_id, skill, is_core });
    }
  }
  const cung = cungGvTuPhanCong(lenh.filter((l) => !l.xac_nhan_luc), pcLop);
  /* Em không học môn (N13) không thành việc của GV môn đó. */
  const hoc = (l: any, m: string) => boMonBanGiaoCt(l.ct_nguon ?? null, l.mdk).includes(m);
  const canMon = (l: any, m: string) => hoc(l, m) && !daGhi.has(`${l.id}:${m}`) && !cung.get(l.id)?.mon.has(m);
  const out: ViecBanGiao[] = [];
  for (const x of lop.values()) {
    const { lopId } = x;
    const cua = lenh.filter((l) => l.lop_nguon_id === lopId);
    const chuaXn = cua.filter((l) => !l.xac_nhan_luc);
    if (!chuaXn.length) continue;
    const mons = boMonBanGiaoCt(x.ct);
    if (x.gvcn) {
      const thieu = mons.filter((m) => chuaXn.some((l) => canMon(l, m))).map((m) => tenMonNgan(x.ct, m));
      out.push({
        loai: 'gvcn', userId: x.userId, lopId, code: x.code, n: cua.length, daXacNhan: cua.length - chuaXn.length, chua: thieu,
        han: chuaXn.map((l) => l.han_gvcn as string).filter(Boolean).sort()[0] ?? '',
        motEm: cua.length === 1 ? { ten: cua[0].full_name, lopDich: cua[0].dich ?? null } : null,
        emIds: cua.map((l) => l.student_id as number),
      });
    }
    for (const m of mons) {
      if (!kyNangPhuTrach(x.ct, m).some((k) => x.kyNang.has(k))) continue;
      const chua = chuaXn.filter((l) => canMon(l, m));
      if (!chua.length) continue;
      const canGhi = chuaXn.filter((l) => hoc(l, m) && !cung.get(l.id)?.mon.has(m));   // em cùng GV / không học môn không tính vào việc của GVBM
      out.push({
        loai: 'gvbm', userId: x.userId, lopId, code: x.code, mon: m, monNgan: tenMonNgan(x.ct, m), daGhi: canGhi.length - chua.length, n: canGhi.length,
        han: chua.map((l) => l.han_gvbm as string).filter(Boolean).sort()[0] ?? '',
        emIds: chua.map((l) => l.student_id as number),
      });
    }
  }
  return gopViecW(out);
}

/**
 * Chủ SP 03/11 (mockup v11 đã duyệt): GV dạy CẢ W1 + W2 của một lớp → MỘT việc "Bàn giao môn W1 · W2" (mở bảng hai cột), không hai việc / hai lần mở.
 * `mon` = "writing1,writing2" (panel tách theo dấu phẩy); số em giữ riêng từng task ở `tung`.
 */
function gopViecW(ds: ViecBanGiao[]): ViecBanGiao[] {
  const out: ViecBanGiao[] = [];
  for (const v of ds) {
    const w = v.loai === 'gvbm' && (v.mon === 'writing1' || v.mon === 'writing2');
    const cap = w ? out.find((x) => x.loai === 'gvbm' && x.userId === v.userId && x.lopId === v.lopId && (x.mon === 'writing1' || x.mon === 'writing2') && x.mon !== v.mon) : undefined;
    if (!w || !cap || cap.loai !== 'gvbm' || v.loai !== 'gvbm') { out.push(v); continue; }
    const [a, b] = cap.mon === 'writing1' ? [cap, v] : [v, cap];
    Object.assign(cap, {
      mon: 'writing1,writing2', monNgan: `${a.monNgan} · ${b.monNgan}`, daGhi: a.daGhi + b.daGhi, n: a.n + b.n,
      han: [a.han, b.han].filter(Boolean).sort()[0] ?? '', emIds: [...new Set([...a.emIds, ...b.emIds])],
      tung: [a, b].map((x) => ({ mon: x.mon, monNgan: x.monNgan, daGhi: x.daGhi, n: x.n })),
    });
  }
  return out;
}
