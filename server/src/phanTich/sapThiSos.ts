/**
 * GD-12b-a (Overhaul V6, mockup ⑨ C1 / C4–C6, lời 37): ô "Sắp thi · tới hết T{tháng sau} · còn SOS" của Phân tích › Thi thật + panel em.
 * Tập = em đang học trong phạm vi (cùng `studentsInScope` của "SOS hiện tại") có lộ trình đang chạy chưa thi, lịch thi trong THÁNG NÀY + THÁNG SAU —
 * ngày đã chốt (`exam_date` từ hôm nay tới hết tháng sau) HOẶC tháng dự kiến (`exam_month`, chưa chốt ngày) — VÀ đang SOS ở lượt mới nhất (luật `hvSosHienTai`,
 * chỉ đánh giá các em đó). Đếm EM theo hiện trạng (không theo kỳ) → không trùng số lượt SOS trong kỳ của tab SOS (ghi chú ⑨ mục 4).
 * Ô và panel đi qua CÙNG `tapSapThiSos` → số ô = số dòng panel. Đọc: một câu em có lịch thi trong phạm vi (chỉ dòng khớp) + lượt mới nhất của các em đó;
 * panel thêm lớp hiện tại + tên / TVV (chỉ khi bấm).
 */
import { db } from '../db.ts';
import { PERMISSIONS, tenMonNgan } from '../../../shared/domain/index.ts';
import { t } from '../../../shared/i18n/index.ts';
import { demoToday } from '../demoConfig.ts';
import { classScopeSql, scopeFor, type Principal } from '../permissions.ts';
import { badRequest, forbidden } from '../util.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { latestAttempts } from '../worklist/danhGia.ts';
import { lopCuaTap } from '../worklist/chuongTrinh.ts';
import { sosCuaLuot, thongTinEm } from '../classes/hocVienSos.ts';
import { tenChiNhanh } from './tongHop.ts';
import type { LocKetQuaThi } from './ketQuaThi.ts';

/** Ô trên tab: số em · chia mức SOS 1 · 2 · 3 · đã chốt ngày / dự kiến; `den` = tháng sau ('YYYY-MM') cho nhãn "tới hết T{n}". */
export type SapThiSos = { n: number; sos: [number, number, number]; chot: number; duKien: number; den: string };
/** Một em của panel. `lichThi.ngay` có = đã chốt ngày; không = tháng dự kiến `thang`. */
export type DongSapThi = {
  id: number; em: { id: number; ten: string }; href: string; classId: number | null; lop: string | null;
  lichThi: { ngay: string | null; thang: string }; sos: { muc: 1 | 2 | 3; kyNang: string[]; luot: string }; tvv: string | null;
};

/** 'YYYY-MM' của tháng sau. */
export const thangSau = (thang: string): string => {
  const [y, m] = thang.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
};

type Em = { sid: number; ngay: string | null; thang: string; muc: 1 | 2 | 3; luot: string; kyNang: string[] };

function tapSapThiSos(p: Principal, f: LocKetQuaThi, homNay: string): { em: Em[]; den: string } {
  if (scopeFor(p, PERMISSIONS.ANALYSIS_VIEW).none) throw forbidden('Phân tích dành cho Quản lý.');
  const thang = homNay.slice(0, 7), den = thangSau(thang);
  return nho(`sap-thi-sos:${p.userId}:${f.branchId ?? ''}:${f.classId ?? ''}:${homNay}`, () => {
    /* MỘT câu: em đang học trong phạm vi (CÙNG điều kiện `studentsInScope` — quyền xem lượt, ghi danh active, chưa lưu trữ, chi nhánh) có lộ trình đang chạy
       (`status = 'active'`), chưa thi / không ghi Không thi, lịch trong cửa sổ — chỉ trả em khớp (không đọc cả danh sách em của chi nhánh). Lọc lớp = lớp em đang học. */
    const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
    if (scope.none) return { em: [], den };
    const cs = classScopeSql(scope);
    const branchId = f.branchId ?? (!scope.all && scope.branchIds.length === 1 && !scope.classIds.length ? scope.branchIds[0] : null);
    const lich = new Map<number, { ngay: string | null; thang: string }>();
    for (const r of db().prepare(
      `SELECT DISTINCT cy.student_id, cy.exam_date, cy.exam_month FROM learning_cycles cy
         JOIN enrollments e ON e.student_id = cy.student_id AND e.status = 'active'
         JOIN students s ON s.id = cy.student_id AND s.archived_at IS NULL
         JOIN classes c ON c.id = e.class_id
        WHERE ${cs.sql}${branchId ? ' AND c.branch_id = ?' : ''}${f.classId ? ' AND c.id = ?' : ''}
          AND cy.status = 'active' AND cy.thi_that_khong_thi = 0 AND cy.thi_that_ngay IS NULL AND cy.outcome_score IS NULL
          AND ((cy.exam_date >= ? AND cy.exam_date <= ?) OR (cy.exam_date IS NULL AND cy.exam_month IN (?, ?)))`,
    ).all(...cs.params, ...(branchId ? [branchId] : []), ...(f.classId ? [f.classId] : []), homNay, `${den}-31`, thang, den) as any[]) {
      lich.set(r.student_id, r.exam_date ? { ngay: r.exam_date, thang: String(r.exam_date).slice(0, 7) } : { ngay: null, thang: r.exam_month });
    }
    if (!lich.size) return { em: [], den };
    /* "SOS hiện tại" = CÙNG luật `hvSosHienTai` (lượt mới nhất hợp lệ, gồm SOS tạm) — chỉ đánh giá các em này (em đã trong phạm vi ở câu trên). */
    const luot = latestAttempts([...lich.keys()].sort((a, b) => a - b), 'valid', homNay);
    const em: Em[] = [];
    for (const [sid, a] of luot) {
      if ((a.sosLevel ?? 0) <= 0) continue;
      const s = sosCuaLuot(a);
      em.push({ sid, ...lich.get(sid)!, muc: s.sosLevel as 1 | 2 | 3, luot: s.luot, kyNang: s.kyNang.map((k) => tenMonNgan(null, k)) });
    }
    return { em, den };
  });
}

/** Ô của tab Thi thật (kèm `GET /phan-tich/thi-that`). */
export function sapThiSos(p: Principal, f: LocKetQuaThi): SapThiSos {
  const { em, den } = tapSapThiSos(p, f, demoToday());
  return {
    n: em.length, sos: [1, 2, 3].map((m) => em.filter((x) => x.muc === m).length) as [number, number, number],
    chot: em.filter((x) => x.ngay).length, duKien: em.filter((x) => !x.ngay).length, den,
  };
}

/**
 * Panel `GET /phan-tich/thi-that/o?o=sap-thi[:1|2|3]` — CÙNG tập với ô (chip SOS n = lọc mức). Đã chốt ngày trước (ngày tăng dần), dự kiến cuối (tháng), rồi tên.
 */
export function oSapThiSos(p: Principal, f: LocKetQuaThi & { o: string }): {
  n: number; tieuDe: string; rows: DongSapThi[]; sapThi: true; dem: string; chiNhanh: string | null; den: string;
} {
  const m = /^sap-thi(?::([123]))?$/.exec(f.o);
  if (!m) throw badRequest('Số này không có trong Thi thật — có thể bộ lọc vừa đổi.');
  const { em: tap, den } = tapSapThiSos(p, f, demoToday());
  const em = m[1] ? tap.filter((x) => x.muc === Number(m[1])) : tap;
  const ids = em.map((x) => x.sid);
  const lop = lopCuaTap('hoc-vien', ids);
  const tt = thongTinEm(ids);
  const rows = em.map((x): DongSapThi => {
    const l = lop.get(x.sid);
    return {
      id: x.sid, em: { id: x.sid, ten: tt.get(x.sid)?.ten ?? '' }, href: `/hoc-vien/${x.sid}`, classId: l?.classId ?? null, lop: l?.code ?? null,
      lichThi: { ngay: x.ngay, thang: x.thang }, sos: { muc: x.muc, kyNang: x.kyNang, luot: x.luot }, tvv: tt.get(x.sid)?.tvv ?? null,
    };
  }).sort((a, b) => Number(!a.lichThi.ngay) - Number(!b.lichThi.ngay) || (a.lichThi.ngay ?? a.lichThi.thang).localeCompare(b.lichThi.ngay ?? b.lichThi.thang)
    || a.em.ten.localeCompare(b.em.ten, 'vi'));
  const chot = rows.filter((r) => r.lichThi.ngay).length;
  return {
    n: rows.length, tieuDe: t('Sắp thi · còn SOS{muc} · {n} HV', { muc: m[1] ? ` ${m[1]}` : '', n: rows.length }), rows, sapThi: true,
    dem: t('đã chốt ngày {a} · dự kiến {b}', { a: chot, b: rows.length - chot }), chiNhanh: tenChiNhanh(f.branchId), den,
  };
}
