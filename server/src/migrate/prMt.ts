/**
 * PR-MT (T34, T78, K5-22, K5-67): một cột `assessment_attempts.lich_su` (MT lịch sử, lưu lúc tạo). KHÔNG đổi dòng nào — lượt đang có
 * giữ `0` (đã chạy theo luật cũ, không ai bị tính lại nợ ngược). Hai hàm đọc dưới chỉ để `chay-thu:mt` báo, không sửa.
 */
import { CO_DIEM_SQL } from '../../../shared/domain/index.ts';

export function migratePrMt(conn: any, applied: string[]) {
  const coCot = (conn.prepare('SELECT name FROM pragma_table_info(?)').all('assessment_attempts') as any[]).some((c) => c.name === 'lich_su');
  if (coCot) return;
  conn.exec('ALTER TABLE assessment_attempts ADD COLUMN lich_su INTEGER NOT NULL DEFAULT 0');
  applied.push('PR-MT: cột assessment_attempts.lich_su (MT lịch sử, T34). Dữ liệu cũ = lượt thường.');
}

const luotMock = (conn: any) => conn.prepare(
  `SELECT a.cycle_id, a.attempt_no, a.status, ${CO_DIEM_SQL('a')} AS coDiem,
          s.student_code AS hv, s.full_name AS ten, cy.route AS loTrinh,
          (SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id
            WHERE e.student_id = s.id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1) AS lop
     FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id JOIN students s ON s.id = a.student_id
    WHERE a.kind = 'mock' ORDER BY s.student_code, a.cycle_id, a.attempt_no`).all() as any[];

const theoLoTrinh = (rows: any[]) => {
  const m = new Map<number, any[]>();
  for (const r of rows) m.set(r.cycle_id, [...(m.get(r.cycle_id) ?? []), r]);
  return [...m.values()];
};

/** Lộ trình có số MT không liền mạch (ví dụ `MT1, MT3`) — dữ liệu tạo trước chốt đánh số (T36). Lượt huỷ không điểm không tính. */
export function lotrinhNhaySo(conn: any): { hv: string; ten: string; lop: string | null; loTrinh: string; so: string }[] {
  return theoLoTrinh(luotMock(conn)).flatMap((ds) => {
    const so = ds.filter((x) => x.status !== 'cancelled' || x.coDiem).map((x) => x.attempt_no as number);
    if (so.every((n, i) => n === i + 1)) return [];
    const r = ds[0];
    return [{ hv: r.hv, ten: r.ten, lop: r.lop, loTrinh: r.loTrinh ?? '—', so: so.map((n) => `MT${n}`).join(', ') }];
  });
}

/** Lượt đã huỷ mà KHÔNG phải số lớn nhất của lộ trình (kiểu cũ: huỷ ở giữa). Nay chỉ lượt lớn nhất mới "Huỷ cả lượt" được (M-12). */
export function luotHuyGiua(conn: any): { hv: string; mt: string; coDiem: number }[] {
  return theoLoTrinh(luotMock(conn)).flatMap((ds) => {
    const max = Math.max(0, ...ds.filter((x) => x.status !== 'cancelled').map((x) => x.attempt_no));
    return ds.filter((x) => x.status === 'cancelled' && x.attempt_no < max).map((x) => ({ hv: x.hv, mt: `MT${x.attempt_no}`, coDiem: x.coDiem }));
  });
}
