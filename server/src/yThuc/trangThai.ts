/**
 * MỘT CỬA TRẠNG THÁI Ý THỨC (PR-YT4, T68, K1-26, M-08, T65) — mọi nhãn vi phạm, số "chưa xử lý / cần xử lý / quá hạn", việc `yt_*`,
 * thẻ Báo QL, huy hiệu, chỉ số và Phân tích đều đọc `trangThaiYThuc()` ở đây → luật thuần `shared/domain/yThuc.ts`. SQL ở file này
 * CHỈ nạp dữ liệu và lọc ứng viên; không chép luật (cửa sổ 2 tuần, 5 ngày, thứ tự nhãn) vào SQL.
 *
 * Nạp theo lô 400 id, BA câu cho cả lô (vi phạm + lần xử lý + liên kết · lộ trình + khai bậc · ghi danh hiện tại + ngày Quay lại),
 * nhớ theo request (`nho`) nên một request hỏi cùng em nhiều lần chỉ nạp một lần.
 */
import { DS_JSON, db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { coNho, coKhoa, datNho, nho, xoaNho } from '../platform/nguCanhRequest.ts';
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
  /** `cycleId` = lộ trình dòng khai trỏ tới (sửa / hoàn tác ghi đúng dòng này — N36: chuỗi nối dài thì dòng khai có thể không còn ở đầu chuỗi). */
  khai: { bac: number; thang: string | null; ghiChu: string; boi: string | null; luc: string; coTheSua: boolean; cycleId: number } | null;
  /** Em đã từng khai ở chuỗi nào chưa (Q8: không hỏi khai lại). */
  tungKhai: boolean;
  /** Số lần xử lý (mọi trạng thái trừ nháp) trong chuỗi hiện tại — khai bậc chỉ khi 0 (Q7, H5). */
  soXuLyChuoi: number;
  viPham: Map<number, TrangThaiViPhamKq>;
  dsViPham: ViPhamEm[];
  /** Lần xử lý còn hiệu lực (mọi trạng thái trừ nháp và `thu_hoi`) — MỌI số / bậc / nhãn vi phạm đọc từ đây. */
  xuLy: XuLyEm[];
  /** LUAT-5: lần "Đã thu hồi" — chỉ để hiện dòng thời gian (giữ dòng + lịch sử), không vào bậc, nhãn, số đếm nào. */
  thuHoi: XuLyEm[];
  nhom: NhomEm | null;
  /** Hạn sớm nhất trong các vi phạm bắt buộc (Cần xử lý / Quá hạn vì chưa xử lý). */
  han: string | null;
  soMoi: number; soBatBuoc: number;
  /** Hạn sớm nhất trong các vi phạm Mới chưa ai Ghi nhận (V4-5). */
  hanXem: string | null;
  /**
   * Đề xuất ĐẠI DIỆN (PR-S3F #7): đã duyệt có ngày duyệt SỚM NHẤT (chưa "Đã thực hiện" — không để đề xuất gửi thêm sau che mất nó); không có thì
   * đề xuất chờ QL mới nhất. `han`: hạn duyệt (chờ) / hạn thực hiện (đã duyệt). `quaHan`: BẤT KỲ đề xuất đã duyệt nào quá 5 ngày chưa thực hiện.
   */
  deXuat: { id: number; kind: string; customName: string | null; status: 'cho_duyet' | 'da_duyet'; han: string | null; quaHan: boolean } | null;
  /** MỌI đề xuất đã duyệt chờ "Đã thực hiện", cũ nhất trước — Công việc sinh một việc cho từng lần xử lý (khoá `yt_thuc_hien:{id}`). */
  daDuyet: { id: number; kind: string; customName: string | null; han: string | null; quaHan: boolean }[];
  /** Có đề xuất đang chờ QL duyệt (kể cả khi đề xuất đại diện là một đề xuất đã duyệt). */
  coChoDuyet: boolean;
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
  /* S5: danh sách em một tham số JSON (`DS_JSON`) — cùng chuỗi SQL cho mọi cỡ lô. */
  const ph = DS_JSON, json = JSON.stringify(lo);
  /*
   * Vi phạm (`loai` 0) và lần xử lý + liên kết (`loai` 1) chung MỘT câu UNION ALL — mỗi câu trên Turso ~20–50 ms. Cột chung đặt tên
   * trung tính; ý nghĩa theo `loai` ghi ngay dưới.
   *   loai 0: a = category · b = occurred_on · c = reported_on · d = ghi_nhan_luc · e = class_id
   *   loai 1: a = kind · b = status · c = performed_on · d = quyet_luc · e = violation_id · f = custom_name · g = created_at · h = hạn thẻ chờ
   */
  const vp = new Map<number, ViPhamEm[]>();
  const xl = new Map<number, Map<number, XuLyEm>>();
  for (const r of conn.prepare(
    /* VIEC-NHO 2: MỌI cột vế đầu có AS (cả cột trần `id`) — Turso đặt tên cột khác libsql file (như `scoreHistoryOf` #256; DTL1). */
    `SELECT 0 AS loai, id AS id, student_id AS student_id, cycle_id AS cycle_id,
            category AS a, occurred_on AS b, reported_on AS c, ghi_nhan_luc AS d, class_id AS e, NULL AS f, NULL AS g, NULL AS h
       FROM violations WHERE student_id IN (${ph})
     UNION ALL
     SELECT 1, m.id, m.student_id, m.cycle_id, m.kind, m.status, m.performed_on, m.quyet_luc, mv.violation_id, m.custom_name, m.created_at,
            (SELECT y.han_duyet FROM yeu_cau_duyet y WHERE y.loai = 'y_thuc' AND y.doi_tuong_loai = 'discipline_measure'
                AND y.doi_tuong_id = m.id AND y.trang_thai = 'cho')
       FROM discipline_measures m LEFT JOIN measure_violations mv ON mv.measure_id = m.id
      WHERE m.student_id IN (${ph}) AND m.status != 'nhap'
     ORDER BY 1, 6, 2`).all(json, json) as any[]) {
    if (r.loai === 0) {
      const a = vp.get(r.student_id) ?? []; vp.set(r.student_id, a);
      a.push({ id: r.id, category: r.a, occurredOn: r.b, reportedOn: r.c, ghiNhanLuc: r.d ?? null, cycleId: r.cycle_id ?? null, classId: r.e ?? null });
      continue;
    }
    const theoEm = xl.get(r.student_id) ?? new Map<number, XuLyEm>(); xl.set(r.student_id, theoEm);
    let m = theoEm.get(r.id);
    if (!m) {
      m = { id: r.id, kind: r.a, customName: r.f ?? null, status: r.b, performedOn: r.c ?? null,
        quyetLuc: r.d ?? null, cycleId: r.cycle_id ?? null, createdAt: r.g, violationIds: [], hanDuyet: r.h ?? null };
      theoEm.set(r.id, m);
    }
    if (r.e != null) m.violationIds.push(r.e);
  }
  /* Lộ trình + dòng khai bậc (nếu có) của lộ trình đó — một câu. Khai trỏ lộ trình ĐẦU chuỗi, luôn là lộ trình của chính em. */
  const lt = new Map<number, { id: number; seq: number; route: string | null; status: string; resetBac: boolean }[]>();
  const kb = new Map<number, any[]>();
  for (const r of conn.prepare(
    `SELECT lc.id, lc.student_id, lc.seq, lc.route, lc.status, lc.reset_bac_y_thuc, k.bac, k.thang, k.ghi_chu, k.khai_luc, u.full_name AS boi
       FROM learning_cycles lc LEFT JOIN y_thuc_khai_bac k ON k.chuoi_cycle_id = lc.id AND k.student_id = lc.student_id
       LEFT JOIN users u ON u.id = k.khai_boi
      WHERE lc.student_id IN (${ph})`).all(json) as any[]) {
    const a = lt.get(r.student_id) ?? []; lt.set(r.student_id, a);
    a.push({ id: r.id, seq: r.seq, route: r.route ?? null, status: r.status, resetBac: !!r.reset_bac_y_thuc });
    if (r.bac != null) {
      const k = kb.get(r.student_id) ?? []; kb.set(r.student_id, k);
      k.push({ chuoi_cycle_id: r.id, bac: r.bac, thang: r.thang, ghi_chu: r.ghi_chu, khai_luc: r.khai_luc, boi: r.boi });
    }
  }
  /* Ghi danh hiện tại (đang học hoặc tạm dừng) mới nhất + GVCN đang hiệu lực của lớp đó + trạng thái em + ngày Quay lại gần nhất. */
  const gd = new Map<number, { lopId: number | null; batDau: string | null; gvcn: number | null; tamDung: boolean }>();
  const quayLai = new Map<number, string>();
  for (const r of conn.prepare(
    `SELECT s.id, s.status AS s_status, e.class_id, e.started_at,
            (SELECT MAX(j.event_date) FROM journey_events j WHERE j.student_id = s.id AND j.event_type = 'resume') AS quay_lai,
            (SELECT ta.user_id FROM teacher_assignments ta WHERE ta.class_id = e.class_id AND ta.is_core = 1 AND ta.status = 'active'
                AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?) ORDER BY ta.id LIMIT 1) AS gvcn
       FROM students s LEFT JOIN enrollments e ON e.student_id = s.id AND e.status IN ('active', 'paused')
      WHERE s.id IN (${ph}) ORDER BY e.id`).all(homNay, homNay, json) as any[]) {
    gd.set(r.id, { lopId: r.class_id ?? null, batDau: r.started_at ?? null, gvcn: r.gvcn ?? null, tamDung: r.s_status === 'inactive' });
    if (r.quay_lai) quayLai.set(r.id, r.quay_lai);
  }

  const out = new Map<number, EmYThuc>();
  for (const sid of lo) {
    const g = gd.get(sid) ?? { lopId: null, batDau: null, gvcn: null, tamDung: false };
    const dsVp = vp.get(sid) ?? [];
    /* LUAT-5: tách lần đã thu hồi MỘT lần ở đây — mọi nơi đọc `xuLy` (bậc, vi phạm, chuỗi, đề xuất, Phân tích, Công việc) tự bỏ nó. */
    const tatCaXl = [...(xl.get(sid)?.values() ?? [])];
    const dsXl = tatCaXl.filter((m) => m.status !== 'thu_hoi');
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
    /* Em chưa có lộ trình nào (dữ liệu dựng tay): mọi lần xử lý tính vào một chuỗi. */
    const xlChuoi = chuoi.length ? dsXl.filter((m) => m.cycleId != null && trongChuoi.has(m.cycleId)) : dsXl;
    /* Khai trỏ lộ trình đầu chuỗi lúc khai. N36: lớp thường → FT nay nối chuỗi — dòng khai ở lộ trình FT (đầu chuỗi theo luật cũ) vẫn tính; nhiều dòng
       trong một chuỗi (dữ liệu cũ) → dòng ở lộ trình MỚI nhất, đúng bậc em đang thấy trước N36. */
    const khaiRow = (kb.get(sid) ?? []).filter((k) => trongChuoi.has(k.chuoi_cycle_id))
      .sort((a, b) => chuoi.indexOf(b.chuoi_cycle_id) - chuoi.indexOf(a.chuoi_cycle_id))[0] ?? null;
    const bac = bacHienTai(xlChuoi.filter((m) => m.status === 'done'), khaiRow?.bac ?? null);

    /* PR-S3F #7: V4-9 cho đề xuất bất cứ lúc nào nên có thể hai đề xuất cùng lúc — đã duyệt (sớm nhất) thắng, rồi mới tới chờ duyệt (mới nhất). */
    const hanThucHien = (m: XuLyEm) => (m.quyetLuc && !g.tamDung ? hanTheoNgay(m.quyetLuc.slice(0, 10), HAN_Y_THUC_NGAY) : null);
    const daDuyet = dsXl.filter((m) => m.status === 'da_duyet')
      .sort((a, b) => (a.quyetLuc ?? '').localeCompare(b.quyetLuc ?? '') || a.id - b.id)
      .map((m) => { const han = hanThucHien(m); return { id: m.id, kind: m.kind, customName: m.customName, han, quaHan: !!han && homNay > han }; });
    const choDuyet = dsXl.filter((m) => m.status === 'cho_duyet').sort((a, b) => b.id - a.id)[0] ?? null;
    const dx = daDuyet[0] ? { ...daDuyet[0], status: 'da_duyet' as const } : choDuyet ? { id: choDuyet.id, kind: choDuyet.kind, customName: choDuyet.customName, status: 'cho_duyet' as const } : null;
    const hanDx = daDuyet[0] ? daDuyet[0].han : choDuyet ? choDuyet.hanDuyet : null;
    const dxQuaHan = daDuyet.some((x) => x.quaHan);

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
        coTheSua: xlChuoi.length === 0, cycleId: khaiRow.chuoi_cycle_id,
      } : null,
      tungKhai: (kb.get(sid) ?? []).length > 0,
      soXuLyChuoi: xlChuoi.length,
      viPham, dsViPham: dsVp, xuLy: dsXl, thuHoi: tatCaXl.filter((m) => m.status === 'thu_hoi'),
      nhom: nhomEm({ ds, coDeXuatCho: !!dx, xuLyGanNhat: xong }, homNay),
      han: minHan(batBuoc), soMoi: moi.length, soBatBuoc: batBuoc.length, hanXem: minHan(moi),
      deXuat: dx ? { id: dx.id, kind: dx.kind, customName: dx.customName, status: dx.status, han: hanDx, quaHan: dxQuaHan } : null,
      daDuyet, coChoDuyet: !!choDuyet,
      xuLyGanNhat: xong,
    });
  }
  return out;
}

/**
 * PR-Pb2-b (Q14) — CHỐT HẠN XỬ LÝ vào `violations.han_xu_ly` để bảng Phân tích giáo viên đo "Xử lý vi phạm đúng hạn" theo hạn LÚC thành
 * "Cần xử lý", không theo hạn suy lại hôm nay. Luật hạn không chép: đọc `trangThaiYThuc` (không qua bộ nhớ request).
 *   · vi phạm bắt buộc (Cần xử lý / Quá hạn vì chưa xử lý) có hạn, chưa chốt → chốt; `ghiDe` (Quay lại học, T65) → chốt lại nếu chưa phản hồi.
 *   · vi phạm hết bắt buộc (sửa / xoá vi phạm khác, Q1) mà chưa phản hồi → bỏ hạn chốt.
 * Gọi TRONG giao dịch ghi của: ghi · sửa · xoá vi phạm, QL từ chối đề xuất, Quay lại học.
 */
export function chotHanXuLy(studentIds: readonly number[], o: { ghiDe?: boolean; /** Trạng thái đã tính SAU khi ghi (nơi gọi theo lô đã `xoaNho()`) — khỏi tính lại. */ trang?: Map<number, EmYThuc> } = {}): void {
  if (!studentIds.length) return;
  if (!o.trang) xoaNho();
  const theoHan = new Map<string, number[]>();
  const bo: number[] = [];
  for (const em of (o.trang ?? trangThaiYThuc(studentIds)).values()) {
    for (const [id, t] of em.viPham) {
      if (t.t === 'can_xu_ly' || t.lyDoQuaHan === 'xu-ly') {
        if (t.han) theoHan.set(t.han, [...(theoHan.get(t.han) ?? []), id]);
      } else if (t.t === 'moi' || t.t === 'da_ghi_nhan' || t.lyDoQuaHan === 'xem') bo.push(id);
    }
  }
  const conn = db();
  for (const [han, ids] of theoHan) {
    for (let i = 0; i < ids.length; i += LO) {
      const lo = ids.slice(i, i + LO);
      conn.prepare(`UPDATE violations SET han_xu_ly = ? WHERE id IN (${cho(lo.length)})
                      AND (han_xu_ly IS NULL${o.ghiDe ? ' OR phan_hoi_ngay IS NULL' : ''})`).run(han, ...lo);
    }
  }
  for (let i = 0; i < bo.length; i += LO) {
    const lo = bo.slice(i, i + LO);
    conn.prepare(`UPDATE violations SET han_xu_ly = NULL WHERE id IN (${cho(lo.length)}) AND han_xu_ly IS NOT NULL AND phan_hoi_ngay IS NULL`).run(...lo);
  }
}

/** PR-Pb2-b (Q14): ngày nghiệp vụ lần đầu GVCN phản hồi (xác nhận xử lý / gửi đề xuất) các vi phạm này — lần sau không đổi. */
export function ghiPhanHoi(violationIds: readonly number[], homNay = demoToday()): void {
  for (let i = 0; i < violationIds.length; i += LO) {
    const lo = violationIds.slice(i, i + LO);
    db().prepare(`UPDATE violations SET phan_hoi_ngay = ? WHERE id IN (${cho(lo.length)}) AND phan_hoi_ngay IS NULL`).run(homNay, ...lo);
  }
}

/**
 * ỨNG VIÊN (chỉ lọc, không luật): em chưa lưu trữ có vi phạm chưa nằm trong lần xử lý xong / chờ / đã duyệt, hoặc có đề xuất đang
 * chờ / đã duyệt. Lọc thêm theo lớp đang học hoặc chi nhánh (lớp đang học, không thì chi nhánh của em).
 * ponytail: tập ứng viên gồm cả em chỉ còn vi phạm "Đã ghi nhận" cũ (luật dính không cho lọc theo ngày ở SQL) — lọc thêm khi dữ liệu lớn.
 */
export function ungVienYThuc(f: { branchId?: number | null; classId?: number | null } = {}): number[] {
  return ungVienVaThe(f).map((r) => r.id);
}

/**
 * Như `ungVienYThuc` + em đang có thẻ Báo QL Ý thức chờ (để quét đóng thẻ khi hết lý do) — MỘT câu, cờ `coThe` cho từng em.
 */
export function ungVienVaThe(f: { branchId?: number | null; classId?: number | null; kemThe?: boolean } = {}): { id: number; coThe: boolean; ten: string; lop: string | null }[] {
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
  /* TD6: lọc bằng `s.id IN (…)` thay `EXISTS … = s.id` lồng OR — câu cũ quét MỌI học viên; nay chỉ đọc vi phạm / biện pháp / thẻ đang mở. */
  const THE = `EXISTS (SELECT 1 FROM yeu_cau_duyet y WHERE y.loai = 'bao_len_y_thuc' AND y.doi_tuong_id = s.id AND y.trang_thai = 'cho')`;
  return (db().prepare(
    `SELECT s.id, s.full_name AS ten, ${f.kemThe ? THE : '0'} AS co_the,
            (SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id
              WHERE e.student_id = s.id AND e.status IN ('active', 'paused') ORDER BY e.id DESC LIMIT 1) AS lop
       FROM students s
      WHERE (s.archived_at IS NULL${loc.map((x) => ` AND ${x}`).join('')}
        AND s.id IN (SELECT v.student_id FROM violations v
                      WHERE NOT EXISTS (SELECT 1 FROM measure_violations mv JOIN discipline_measures m ON m.id = mv.measure_id
                                         WHERE mv.violation_id = v.id AND m.status IN ('done', 'cho_duyet', 'da_duyet'))
          UNION SELECT m.student_id FROM discipline_measures m WHERE m.status IN ('cho_duyet', 'da_duyet')))
        ${f.kemThe ? `OR s.id IN (SELECT y.doi_tuong_id FROM yeu_cau_duyet y WHERE y.loai = 'bao_len_y_thuc' AND y.trang_thai = 'cho')` : ''}
      ORDER BY s.id`).all(...args) as any[]).map((r) => ({ id: r.id as number, coThe: !!r.co_the, ten: r.ten, lop: r.lop ?? null }));
}

/** TL-HVL: ghi danh của MỘT lớp (mọi trạng thái), một câu mỗi request — hồ sơ lớp lọc bằng JS theo điều kiện từng nơi. */
export function ghiDanhLop(classId: number): readonly { studentId: number; status: string; archived: boolean }[] {
  return nho('ghi-danh-lop:' + classId, () => (db().prepare(
    `SELECT e.student_id, e.status, s.archived_at FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.class_id = ? ORDER BY e.id`,
  ).all(classId) as any[]).map((r) => ({ studentId: r.student_id as number, status: r.status as string, archived: !!r.archived_at })));
}

/** Em ĐANG HỌC (hoặc tạm dừng) ở một lớp. */
export function emCuaLop(classId: number): number[] {
  return [...new Set(ghiDanhLop(classId).filter((e) => e.status === 'active' || e.status === 'paused').map((e) => e.studentId))].sort((a, b) => a - b);
}

/** Nhãn ngắn cho dòng em ở danh sách lớp / Tổng quan (K1-17): chỉ hai nhóm cần hành động; nhóm khác → null. */
export function nhanNhomEm(em: EmYThuc | undefined): NhanYThucEm | null {
  if (!em || (em.nhom !== 'qua_han' && em.nhom !== 'bat_buoc')) return null;
  const quaHan = Math.max(0, ...[...em.viPham.values()].map((t) => t.quaHanNgay ?? 0)) || null;
  return em.nhom === 'qua_han'
    ? { nhom: 'qua_han', so: em.soBatBuoc || em.soMoi || 1, han: em.han ?? em.hanXem ?? em.deXuat?.han ?? null, quaHanNgay: quaHan }
    : { nhom: 'bat_buoc', so: em.soBatBuoc, han: em.han, quaHanNgay: null };
}
