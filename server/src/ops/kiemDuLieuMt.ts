/**
 * KIỂM DỮ LIỆU MOCK TEST (PR-KIEM-DU-LIEU-MT) — CHỈ ĐỌC: chỉ `prepare(...).all()`, không ghi câu nào. Chủ sản phẩm chạy với database bản chính
 * trước khi dọn dữ liệu MT; script chỉ liệt kê, KHÔNG sửa.
 *
 * In bảng (HV · Mã · Lớp · Lượt · Vấn đề) theo 6 nhóm:
 *  1. Lượt MT 'planned' mà mọi kỹ năng bắt buộc đều đã huỷ phần thi hoặc không yêu cầu (lượt "xác sống").
 *  2. Hai lượt cùng lộ trình: tuần sớm nhất của MT(n+1) sớm hơn hoặc trùng tuần muộn nhất của MT(n).
 *  3. Kết quả huỷ (`ket_qua_huy`) chưa khôi phục mà lượt đã huỷ, hoặc lượt tạo SAU lúc huỷ (mồ côi).
 *  4. Nhật ký `score.huy_vuot` không còn dòng `ket_qua_huy` (điểm có thể đã mất do ghi dở).
 *  5. `assessment_attempts.planned_period_id` khác tuần muộn nhất của kỹ năng bắt buộc còn hiệu lực.
 *  6. (PR-OV1a) MT0 chưa huỷ có ô nhập kiểu đúng/tổng (không band) — nhập nhầm ở bảng lớp thường trước khi máy chủ chặn (lỗi 3.3).
 *
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2) rồi `npm run kiem-du-lieu-mt`. Không có biến Turso → DB cục bộ.
 * Không có câu `IN (…)` nên không cần chia lô (Turso: ≤ 900 tham số); mọi tham số là số vị trí, không có tham số đặt tên.
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';
import { nhanDot } from '../../../shared/domain/index.ts';

export type DongKiem = { nhom: 1 | 2 | 3 | 4 | 5 | 6; luotId: number; hocVien: string; ma: string; lop: string; mt: string; vanDe: string };

export const TIEU_DE_NHOM: Record<DongKiem['nhom'], string> = {
  1: '1. Lượt MT "xác sống" (đang xếp lịch nhưng không còn kỹ năng bắt buộc nào hiệu lực)',
  2: '2. Thứ tự tuần giữa các lượt cùng lộ trình bị ngược / trùng',
  3: '3. Kết quả MT đã huỷ chưa khôi phục mà lượt đã huỷ hoặc lượt tạo sau lúc huỷ (mồ côi)',
  4: '4. Nhật ký huỷ điểm do dời vượt nhưng không còn kết quả đã huỷ (điểm có thể đã mất)',
  5: '5. Tuần của lượt khác tuần muộn nhất của kỹ năng bắt buộc còn hiệu lực',
  6: '6. MT0 có điểm nhập kiểu đúng/tổng (không band) — nhập nhầm ở bảng lớp thường',
};

type Luot = { id: number; cycle_id: number; attempt_no: number | null; kind: string; status: string; planned_period_id: number | null; week_start: string | null;
  full_name: string; student_code: string; lop: string | null };

const COT_LUOT = `a.id AS id, a.cycle_id AS cycle_id, a.attempt_no AS attempt_no, a.kind AS kind, a.status AS status,
  a.planned_period_id AS planned_period_id, p.week_start AS week_start, s.full_name AS full_name, s.student_code AS student_code, c.code AS lop`;
const TU_LUOT = `assessment_attempts a JOIN students s ON s.id = a.student_id
  LEFT JOIN classes c ON c.id = a.class_id LEFT JOIN report_periods p ON p.id = a.planned_period_id`;

const dong = (nhom: DongKiem['nhom'], l: Luot, vanDe: string): DongKiem => ({
  nhom, luotId: l.id, hocVien: l.full_name, ma: l.student_code, lop: l.lop ?? '—', mt: nhanDot(l.kind, l.attempt_no), vanDe,
});

/** Kiểm một database đã mở. Hàm thuần (nhận `conn`, trả các dòng) để phép kiểm chạy được mà không cần tiến trình con. */
export function kiemDuLieuMt(conn: any): DongKiem[] {
  const ra: DongKiem[] = [];
  const luot = conn.prepare(`SELECT ${COT_LUOT} FROM ${TU_LUOT} WHERE a.kind = 'mock' ORDER BY a.cycle_id, a.attempt_no, a.id`).all() as Luot[];
  const kyNang = conn.prepare(
    `SELECT k.attempt_id AS attempt_id, k.required AS required, k.sit_status AS sit_status, p.week_start AS week_start
       FROM attempt_skills k JOIN assessment_attempts a ON a.id = k.attempt_id LEFT JOIN report_periods p ON p.id = k.planned_period_id
      WHERE a.kind = 'mock'`).all() as { attempt_id: number; required: number; sit_status: string; week_start: string | null }[];
  const theoLuot = new Map<number, typeof kyNang>();
  for (const k of kyNang) (theoLuot.get(k.attempt_id) ?? theoLuot.set(k.attempt_id, []).get(k.attempt_id)!).push(k);
  /* Kỹ năng còn hiệu lực = bắt buộc và chưa huỷ phần thi (đúng nghĩa `completionWeekOf`). */
  const conHieuLuc = (id: number) => (theoLuot.get(id) ?? []).filter((k) => k.required === 1 && k.sit_status !== 'cancelled');
  const tuan = (id: number) => conHieuLuc(id).map((k) => k.week_start).filter((w): w is string => !!w).sort();

  for (const l of luot) {
    /* (1) Lượt không có dòng kỹ năng nào thì chưa phải "xác sống" (kỹ năng sinh khi mở lượt) — chỉ xét lượt đã có dòng. */
    if (l.status === 'planned' && theoLuot.get(l.id)?.length && !conHieuLuc(l.id).length) {
      ra.push(dong(1, l, 'Mọi kỹ năng đều đã huỷ phần thi hoặc không bắt buộc — lượt vẫn "planned", chiếm chỗ trong lộ trình'));
    }
    /* (5) */
    const w = tuan(l.id);
    if (l.status !== 'cancelled' && w.length && (l.week_start ?? null) !== w[w.length - 1]) {
      ra.push(dong(5, l, `Tuần của lượt ${l.week_start ?? '(trống)'} ≠ tuần muộn nhất của kỹ năng ${w[w.length - 1]}`));
    }
  }

  /* (2) Mỗi lộ trình: các lượt chưa huỷ có tuần, xếp theo số MT; MT(n+1) phải bắt đầu SAU tuần muộn nhất của MT(n). */
  const theoLoTrinh = new Map<number, Luot[]>();
  for (const l of luot) {
    if (l.status === 'cancelled' || !tuan(l.id).length) continue;
    (theoLoTrinh.get(l.cycle_id) ?? theoLoTrinh.set(l.cycle_id, []).get(l.cycle_id)!).push(l);
  }
  for (const ds of theoLoTrinh.values()) {
    ds.sort((a, b) => (a.attempt_no ?? 0) - (b.attempt_no ?? 0));
    for (let i = 1; i < ds.length; i++) {
      const truoc = ds[i - 1], sau = ds[i];
      const muonTruoc = tuan(truoc.id).slice(-1)[0], somSau = tuan(sau.id)[0];
      if (somSau > muonTruoc) continue;
      ra.push(dong(2, sau, `${somSau === muonTruoc ? 'Trùng tuần' : 'Tuần ngược'}: ${nhanDot(sau.kind, sau.attempt_no)} sớm nhất ${somSau} ≤ ${nhanDot(truoc.kind, truoc.attempt_no)} muộn nhất ${muonTruoc}`));
    }
  }

  /* (3) Kết quả huỷ chưa khôi phục. */
  const mo = conn.prepare(
    `SELECT ${COT_LUOT}, q.huy_luc AS huy_luc, a.created_at AS tao_luc
       FROM ket_qua_huy q JOIN assessment_attempts a ON a.id = q.attempt_id JOIN students s ON s.id = a.student_id
       LEFT JOIN classes c ON c.id = a.class_id LEFT JOIN report_periods p ON p.id = a.planned_period_id
      WHERE q.khoi_phuc_luc IS NULL AND (a.status = 'cancelled' OR a.created_at > q.huy_luc)
      ORDER BY q.id`).all() as (Luot & { huy_luc: string; tao_luc: string })[];
  for (const l of mo) {
    ra.push(dong(3, l, l.status === 'cancelled' ? `Lượt đã huỷ nhưng kết quả huỷ (${l.huy_luc.slice(0, 10)}) chưa khôi phục`
      : `Lượt tạo ${l.tao_luc.slice(0, 10)} SAU lúc huỷ kết quả ${l.huy_luc.slice(0, 10)} — kết quả huỷ mồ côi`));
  }

  /* (4) `score.huy_vuot` mà không còn dòng kết quả huỷ nào của lượt (và không phải bị bỏ chủ ý: `ket_qua_huy.bo` về sau). Bỏ qua nhật ký của
   *     lượt đã xoá / số lượt dùng lại (lượt tạo sau dòng nhật ký). */
  const thieu = conn.prepare(
    `SELECT ${COT_LUOT}, COUNT(*) AS n, GROUP_CONCAT(l.entity_label) AS ky_nang, MIN(l.created_at) AS luc
       FROM audit_logs l JOIN assessment_attempts a ON a.id = l.entity_id AND a.created_at <= l.created_at
       JOIN students s ON s.id = a.student_id LEFT JOIN classes c ON c.id = a.class_id LEFT JOIN report_periods p ON p.id = a.planned_period_id
      WHERE l.action = 'score.huy_vuot' AND l.entity_type = 'assessment_attempt'
        AND NOT EXISTS (SELECT 1 FROM ket_qua_huy q WHERE q.attempt_id = l.entity_id)
        AND NOT EXISTS (SELECT 1 FROM audit_logs b WHERE b.action = 'ket_qua_huy.bo' AND b.entity_type = 'assessment_attempt' AND b.entity_id = l.entity_id AND b.id > l.id)
      GROUP BY l.entity_id ORDER BY l.entity_id`).all() as (Luot & { n: number; ky_nang: string; luc: string })[];
  for (const l of thieu) ra.push(dong(4, l, `${l.n} ô điểm bị huỷ do dời vượt (${l.ky_nang}) lúc ${l.luc.slice(0, 10)} mà không có kết quả huỷ để khôi phục`));

  /* (6) MT0 chấm band: ô có số câu đúng kèm tổng, hoặc ô `writing` một ô của bảng tỷ lệ (MT0 nhập W1/W2) = nhập nhầm kiểu đúng/tổng. */
  const mt0 = conn.prepare(
    `SELECT ${COT_LUOT}, GROUP_CONCAT(sc.skill || ' ' || sc.raw_score || '/' || COALESCE(sc.raw_total, '?') || COALESCE(' band ' || sc.band, ''), ', ') AS o
       FROM ${TU_LUOT} JOIN assessment_scores sc ON sc.attempt_id = a.id
      WHERE a.kind = 'mt0' AND a.status != 'cancelled' AND sc.raw_score IS NOT NULL AND (sc.raw_total IS NOT NULL OR sc.skill = 'writing')
      GROUP BY a.id ORDER BY a.id`).all() as (Luot & { o: string })[];
  for (const l of mt0) ra.push(dong(6, l, `Ô kiểu đúng/tổng: ${l.o}`));

  return ra;
}

function inBang(ds: DongKiem[]): string[] {
  const cot: (keyof DongKiem)[] = ['hocVien', 'ma', 'lop', 'mt', 'vanDe'];
  const tieu = ['Học viên', 'Mã', 'Lớp', 'Lượt', 'Vấn đề'];
  const rong = cot.map((c, i) => Math.max(tieu[i].length, ...ds.map((d) => String(d[c]).length)));
  const hang = (v: string[]) => `  ${v.map((x, i) => (i === v.length - 1 ? x : x.padEnd(rong[i]))).join(' │ ')}`;
  return [hang(tieu), `  ${rong.map((r, i) => '─'.repeat(i === rong.length - 1 ? Math.min(r, 60) : r)).join('─┼─')}`, ...ds.map((d) => hang(cot.map((c) => String(d[c]))))];
}

/* Chỉ chạy khi được gọi như lệnh (phép kiểm import hàm mà không kích hoạt). */
if (process.argv[1] && /kiemDuLieuMt\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-du-lieu-mt] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  const ra = kiemDuLieuMt(db());
  closeDb();
  for (const n of [1, 2, 3, 4, 5, 6] as const) {
    const ds = ra.filter((d) => d.nhom === n);
    console.log(`\n${TIEU_DE_NHOM[n]} — ${ds.length ? `${ds.length} dòng` : 'không có'}`);
    if (ds.length) for (const l of inBang(ds)) console.log(l);
  }
  console.log(`\n[kiem-du-lieu-mt] ${ra.length ? `Tổng ${ra.length} dòng cần xem` : 'Không thấy vấn đề.'}`);
}
