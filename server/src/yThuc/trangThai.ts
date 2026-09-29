/**
 * MỘT CỬA TRẠNG THÁI Ý THỨC (PR-YT4, T68, K1-26, M-08, T65) — mọi nhãn vi phạm, số "chưa xử lý / cần xử lý / quá hạn", việc `yt_*`,
 * thẻ Báo lên, huy hiệu, chỉ số và Phân tích đều đọc `trangThaiYThuc()` ở đây → luật thuần `shared/domain/yThuc.ts`. SQL ở file này
 * CHỈ nạp dữ liệu và lọc ứng viên; không chép luật (cửa sổ 2 tuần, 5 ngày, thứ tự nhãn) vào SQL.
 *
 * Nạp theo lô 400 id, SÁU câu cho cả lô (vi phạm · lần xử lý + liên kết · lộ trình · khai bậc · ghi danh hiện tại · ngày Quay lại),
 * nhớ theo request (`nho`) nên một request hỏi cùng em nhiều lần chỉ nạp một lần.
 */
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { coNho, coKhoa, datNho, nho } from '../platform/nguCanhRequest.ts';
import {
  bacHienTai, bacKeTiep, batBuocTu, chuoiThang, nhomEm, trangThaiViPham, hanTheoNgay, HAN_Y_THUC_NGAY,
  type MeasureStatus, type NhanYThucEm, type NhomEm, type TrangThaiViPhamKq, type TrangThaiVp, type ViPhamVao,
} from '../../../shared/domain/index.ts';

export type XuLyEm = {
  id: number; kind: string; customName: string | null; status: MeasureStatus; performedOn: string | null; quyetLuc: string | null;
  cycleId: number | null; createdAt: string; violationIds: number[]; hanDuyet: string | null;
};
export type ViPhamEm = { id: number; category: string; occurredOn: string; reportedOn: string; ghiNhanLuc: string | null; cycleId: number | null; classId: number | null };

export type EmYThuc = {
  studentId: number; lopId: number | null; gvcnId: number | null; tamDung: boolean;
  /** Lộ trình hiện tại + chuỗi đếm thang (Q-C). */
  cycleId: number | null; chuoi: number[]; nhanChuoi: string;
  bac: number; keTiep: ReturnType<typeof bacKeTiep>;
  khai: { bac: number; thang: string | null; ghiChu: string; boi: string | null; luc: string; coTheSua: boolean } | null;
  /** Em đã từng khai ở chuỗi nào chưa (Q8: không hỏi khai lại). */
  tungKhai: boolean;
  /** Số lần xử lý (mọi trạng thái trừ nháp) trong chuỗi hiện tại — khai bậc chỉ khi 0 (Q7, H5). */
  soXuLyChuoi: number;
  viPham: Map<number, TrangThaiViPhamKq>;
  dsViPham: ViPhamEm[];
  xuLy: XuLyEm[];
  nhom: NhomEm | null;
  /** Hạn sớm nhất trong các vi phạm bắt buộc (Cần xử lý / Quá hạn vì chưa xử lý). */
  han: string | null;
  soMoi: number; soBatBuoc: number;
  /** Hạn sớm nhất trong các vi phạm Mới chưa ai Ghi nhận (V4-5). */
  hanXem: string | null;
  /** Đề xuất đang chờ QL hoặc đã duyệt chờ "Đã thực hiện". `han`: hạn duyệt (chờ) / hạn thực hiện (đã duyệt). */
  deXuat: { id: number; kind: string; customName: string | null; status: 'cho_duyet' | 'da_duyet'; han: string | null; quaHan: boolean } | null;
  /** Ngày lần xử lý xong gần nhất (mọi chuỗi) — nhóm "Đã xử lý (7 ngày)". */
  xuLyGanNhat: string | null;
};

const LO = 400;
const cho = (n: number) => Array.from({ length: n }, () => '?').join(',');

/**
 * Trạng thái Ý thức của các em (Map theo id). Em không tồn tại vẫn có một dòng rỗng (không vi phạm) để nơi gọi khỏi kiểm null.
 * `homNay` mặc định ngày nghiệp vụ.
 */
export function trangThaiYThuc(studentIds: readonly number[], homNay = demoToday()): Map<number, EmYThuc> {
  const ids = [...new Set(studentIds)];
  const khoa = (id: number) => `yt4:${homNay}:${id}`;
  const out = new Map<number, EmYThuc>();
  const canNap = coNho() ? ids.filter((id) => !coKhoa(khoa(id))) : ids;
  for (let i = 0; i < canNap.length; i += LO) {
    for (const [id, em] of napLo(canNap.slice(i, i + LO), homNay)) {
      datNho(khoa(id), em);
      out.set(id, em);
    }
  }
  for (const id of ids) if (!out.has(id)) out.set(id, nho(khoa(id), () => napLo([id], homNay).get(id)!));
  return out;
}

function napLo(lo: number[], homNay: string): Map<number, EmYThuc> {
  const conn = db();
  const ph = cho(lo.length);
  const vp = new Map<number, ViPhamEm[]>();
  for (const r of conn.prepare(
    `SELECT id, student_id, category, occurred_on, reported_on, ghi_nhan_luc, cycle_id, class_id FROM violations
      WHERE student_id IN (${ph}) ORDER BY occurred_on, id`).all(...lo) as any[]) {
    const a = vp.get(r.student_id) ?? []; vp.set(r.student_id, a);
    a.push({ id: r.id, category: r.category, occurredOn: r.occurred_on, reportedOn: r.reported_on, ghiNhanLuc: r.ghi_nhan_luc ?? null,
      cycleId: r.cycle_id ?? null, classId: r.class_id ?? null });
  }
  const xl = new Map<number, Map<number, XuLyEm>>();
  for (const r of conn.prepare(
    `SELECT m.id, m.student_id, m.kind, m.custom_name, m.status, m.performed_on, m.quyet_luc, m.cycle_id, m.created_at, mv.violation_id,
            (SELECT y.han_duyet FROM yeu_cau_duyet y WHERE y.loai = 'y_thuc' AND y.doi_tuong_loai = 'discipline_measure'
                AND y.doi_tuong_id = m.id AND y.trang_thai = 'cho') AS han_duyet
       FROM discipline_measures m LEFT JOIN measure_violations mv ON mv.measure_id = m.id
      WHERE m.student_id IN (${ph}) AND m.status != 'nhap' ORDER BY m.id`).all(...lo) as any[]) {
    const theoEm = xl.get(r.student_id) ?? new Map<number, XuLyEm>(); xl.set(r.student_id, theoEm);
    let m = theoEm.get(r.id);
    if (!m) {
      m = { id: r.id, kind: r.kind, customName: r.custom_name ?? null, status: r.status, performedOn: r.performed_on ?? null,
        quyetLuc: r.quyet_luc ?? null, cycleId: r.cycle_id ?? null, createdAt: r.created_at, violationIds: [], hanDuyet: r.han_duyet ?? null };
      theoEm.set(r.id, m);
    }
    if (r.violation_id != null) m.violationIds.push(r.violation_id);
  }
  const lt = new Map<number, { id: number; seq: number; route: string | null; status: string }[]>();
  for (const r of conn.prepare(`SELECT id, student_id, seq, route, status FROM learning_cycles WHERE student_id IN (${ph})`).all(...lo) as any[]) {
    const a = lt.get(r.student_id) ?? []; lt.set(r.student_id, a);
    a.push({ id: r.id, seq: r.seq, route: r.route ?? null, status: r.status });
  }
  const kb = new Map<number, any[]>();
  for (const r of conn.prepare(
    `SELECT k.student_id, k.chuoi_cycle_id, k.bac, k.thang, k.ghi_chu, k.khai_luc, u.full_name AS boi
       FROM y_thuc_khai_bac k LEFT JOIN users u ON u.id = k.khai_boi WHERE k.student_id IN (${ph})`).all(...lo) as any[]) {
    const a = kb.get(r.student_id) ?? []; kb.set(r.student_id, a); a.push(r);
  }
  /* Ghi danh hiện tại (đang học hoặc tạm dừng) mới nhất + GVCN đang hiệu lực của lớp đó + trạng thái em. */
  const gd = new Map<number, { lopId: number | null; batDau: string | null; gvcn: number | null; tamDung: boolean }>();
  for (const r of conn.prepare(
    `SELECT s.id, s.status AS s_status, e.class_id, e.started_at,
            (SELECT ta.user_id FROM teacher_assignments ta WHERE ta.class_id = e.class_id AND ta.is_core = 1 AND ta.status = 'active'
                AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?) ORDER BY ta.id LIMIT 1) AS gvcn
       FROM students s LEFT JOIN enrollments e ON e.student_id = s.id AND e.status IN ('active', 'paused')
      WHERE s.id IN (${ph}) ORDER BY e.id`).all(homNay, homNay, ...lo) as any[]) {
    gd.set(r.id, { lopId: r.class_id ?? null, batDau: r.started_at ?? null, gvcn: r.gvcn ?? null, tamDung: r.s_status === 'inactive' });
  }
  const quayLai = new Map<number, string>();
  for (const r of conn.prepare(
    `SELECT student_id, MAX(event_date) AS d FROM journey_events WHERE event_type = 'resume' AND student_id IN (${ph}) GROUP BY student_id`,
  ).all(...lo) as any[]) quayLai.set(r.student_id, r.d);

  const out = new Map<number, EmYThuc>();
  for (const sid of lo) {
    const g = gd.get(sid) ?? { lopId: null, batDau: null, gvcn: null, tamDung: false };
    const dsVp = vp.get(sid) ?? [];
    const dsXl = [...(xl.get(sid)?.values() ?? [])];
    const theoVp = new Map<number, ViPhamVao['xuLy']>();
    for (const m of dsXl) {
      for (const v of m.violationIds) {
        const a = theoVp.get(v) ?? []; theoVp.set(v, a);
        a.push({ id: m.id, kind: m.kind, status: m.status, performedOn: m.performedOn, quyetLuc: m.quyetLuc });
      }
    }
    const vao: ViPhamVao[] = dsVp.map((v) => ({ id: v.id, occurredOn: v.occurredOn, reportedOn: v.reportedOn, ghiNhanLuc: v.ghiNhanLuc, xuLy: theoVp.get(v.id) ?? [] }));
    const bb = batBuocTu(vao);
    const mocLop = [g.batDau?.slice(0, 10), quayLai.get(sid)?.slice(0, 10)].filter((x): x is string => !!x).sort().pop() ?? null;
    const n = { homNay, mocLop, tamDung: g.tamDung };
    const viPham = new Map(vao.map((v) => [v.id, trangThaiViPham(v, bb.get(v.id) ?? null, n)]));

    const cycles = lt.get(sid) ?? [];
    const hienTai = [...cycles].sort((a, b) => Number(b.status === 'active') - Number(a.status === 'active') || b.seq - a.seq)[0] ?? null;
    const chuoi = hienTai ? chuoiThang(cycles, hienTai.id) : [];
    const trongChuoi = new Set(chuoi);
    const xlChuoi = dsXl.filter((m) => m.cycleId != null && trongChuoi.has(m.cycleId));
    const khaiRow = (kb.get(sid) ?? []).find((k) => k.chuoi_cycle_id === chuoi[0]) ?? null;
    const bac = bacHienTai(xlChuoi.filter((m) => m.status === 'done'), khaiRow?.bac ?? null);

    const dx = dsXl.filter((m) => m.status === 'cho_duyet' || m.status === 'da_duyet').sort((a, b) => b.id - a.id)[0] ?? null;
    const hanDx = dx ? (dx.status === 'cho_duyet' ? dx.hanDuyet : dx.quyetLuc && !g.tamDung ? hanTheoNgay(dx.quyetLuc.slice(0, 10), HAN_Y_THUC_NGAY) : null) : null;
    const dxQuaHan = !!dx && dx.status === 'da_duyet' && !!hanDx && homNay > hanDx;

    const ds: TrangThaiVp[] = [...viPham.values()].map((x) => x.t);
    if (dxQuaHan) ds.push('qua_han');
    const xong = dsXl.filter((m) => m.status === 'done' && m.performedOn).map((m) => m.performedOn!).sort().pop() ?? null;
    const batBuoc = [...viPham.values()].filter((x) => x.t === 'can_xu_ly' || x.lyDoQuaHan === 'xu-ly');
    const moi = [...viPham.values()].filter((x) => x.t === 'moi' || x.lyDoQuaHan === 'xem');
    const minHan = (a: TrangThaiViPhamKq[]) => a.map((x) => x.han).filter((h): h is string => !!h).sort()[0] ?? null;
    const route = hienTai?.route ?? null;

    out.set(sid, {
      studentId: sid, lopId: g.lopId, gvcnId: g.gvcn, tamDung: g.tamDung,
      cycleId: hienTai?.id ?? null, chuoi, nhanChuoi: route ?? 'lớp thường',
      bac, keTiep: bacKeTiep(bac),
      khai: khaiRow ? {
        bac: khaiRow.bac, thang: khaiRow.thang ?? null, ghiChu: khaiRow.ghi_chu, boi: khaiRow.boi ?? null, luc: khaiRow.khai_luc,
        coTheSua: xlChuoi.length === 0,
      } : null,
      tungKhai: (kb.get(sid) ?? []).length > 0,
      soXuLyChuoi: xlChuoi.length,
      viPham, dsViPham: dsVp, xuLy: dsXl,
      nhom: nhomEm({ ds, coDeXuatCho: !!dx, xuLyGanNhat: xong }, homNay),
      han: minHan(batBuoc), soMoi: moi.length, soBatBuoc: batBuoc.length, hanXem: minHan(moi),
      deXuat: dx ? { id: dx.id, kind: dx.kind, customName: dx.customName, status: dx.status as 'cho_duyet' | 'da_duyet', han: hanDx, quaHan: dxQuaHan } : null,
      xuLyGanNhat: xong,
    });
  }
  return out;
}

/**
 * ỨNG VIÊN (chỉ lọc, không luật): em chưa lưu trữ có vi phạm chưa nằm trong lần xử lý xong / chờ / đã duyệt, hoặc có đề xuất đang
 * chờ / đã duyệt. Lọc thêm theo lớp đang học hoặc chi nhánh (lớp đang học, không thì chi nhánh của em).
 * ponytail: tập ứng viên gồm cả em chỉ còn vi phạm "Đã ghi nhận" cũ (luật dính không cho lọc theo ngày ở SQL) — lọc thêm khi dữ liệu lớn.
 */
export function ungVienYThuc(f: { branchId?: number | null; classId?: number | null } = {}): number[] {
  const loc: string[] = [];
  const args: unknown[] = [];
  if (f.classId) {
    loc.push(`EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.class_id = ? AND e.status IN ('active', 'paused'))`);
    args.push(f.classId);
  }
  if (f.branchId) {
    loc.push(`COALESCE((SELECT c.branch_id FROM enrollments e JOIN classes c ON c.id = e.class_id
                         WHERE e.student_id = s.id AND e.status IN ('active', 'paused') ORDER BY e.id DESC LIMIT 1), s.branch_id) = ?`);
    args.push(f.branchId);
  }
  return (db().prepare(
    `SELECT s.id FROM students s
      WHERE s.archived_at IS NULL${loc.map((x) => ` AND ${x}`).join('')}
        AND (EXISTS (SELECT 1 FROM violations v WHERE v.student_id = s.id
                      AND NOT EXISTS (SELECT 1 FROM measure_violations mv JOIN discipline_measures m ON m.id = mv.measure_id
                                       WHERE mv.violation_id = v.id AND m.status IN ('done', 'cho_duyet', 'da_duyet')))
          OR EXISTS (SELECT 1 FROM discipline_measures m WHERE m.student_id = s.id AND m.status IN ('cho_duyet', 'da_duyet')))
      ORDER BY s.id`).all(...args) as any[]).map((r) => r.id as number);
}

/** Em ĐANG HỌC (hoặc tạm dừng) ở một lớp. */
export function emCuaLop(classId: number): number[] {
  return (db().prepare(`SELECT DISTINCT student_id AS id FROM enrollments WHERE class_id = ? AND status IN ('active', 'paused') ORDER BY student_id`)
    .all(classId) as any[]).map((r) => r.id as number);
}

/** Nhãn ngắn cho dòng em ở danh sách lớp / Tổng quan (K1-17): chỉ hai nhóm cần hành động; nhóm khác → null. */
export function nhanNhomEm(em: EmYThuc | undefined): NhanYThucEm | null {
  if (!em || (em.nhom !== 'qua_han' && em.nhom !== 'bat_buoc')) return null;
  const quaHan = Math.max(0, ...[...em.viPham.values()].map((t) => t.quaHanNgay ?? 0)) || null;
  return em.nhom === 'qua_han'
    ? { nhom: 'qua_han', so: em.soBatBuoc || em.soMoi || 1, han: em.han ?? em.hanXem ?? em.deXuat?.han ?? null, quaHanNgay: quaHan }
    : { nhom: 'bat_buoc', so: em.soBatBuoc, han: em.han, quaHanNgay: null };
}
