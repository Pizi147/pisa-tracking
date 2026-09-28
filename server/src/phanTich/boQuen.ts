import { db } from '../db.ts';
import {
  hoKyNang, categoryOf, nhanDot, programmeOf,
  type ChuongTrinh, type HoKyNang, type LoaiBoQuen,
} from '../../../shared/domain/index.ts';
import { ngay, tuanLich } from '../../../shared/domain/hienThiNgay.ts';
import type { Principal } from '../permissions.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { loadBundle } from '../fasttrack/attempts.ts';
import { allProgrammes } from '../normal/regular.ts';
import { attemptsNewestFirst, evaluateAttemptRow, studentsInScope } from '../worklist/danhGia.ts';
import { locTheoChuongTrinh } from '../worklist/chuongTrinh.ts';
import { phamViPhanTich } from './phamVi.ts';

export type { LoaiBoQuen };

/**
 * HAI VIỆC "BỎ QUÊN" CỦA "CHƯA AI NHẬN" cũ (PR-UX4, Q17–Q19) — không còn là góc nhìn riêng: thành hai dòng ở khối Cần xử lý của
 * Tổng quan QL (hai chỉ số trong sổ) và một bộ lọc ở Danh sách Case.
 *
 *  · `can-ho-tro-2-lan`: cùng HỌ kỹ năng (W1/W2/W = Writing) dưới kỳ vọng (FT) / chưa đạt (lớp thường) ở HAI lượt hợp lệ mới nhất
 *    (đã có điểm — kể cả tạm thời) mà KHÔNG có Case mở cùng họ.
 *  · `bo-qua-van-can-ho-tro`: tín hiệu lớp thường bị Bỏ qua (`noted`); lượt hợp lệ NGAY SAU lượt của tín hiệu vẫn chưa đạt cùng họ;
 *    không có Case mở cùng họ.
 *
 * Một hàm tính cả hai, nhớ trong request theo (người xem, chi nhánh, hôm nay) — `metricSet` và route dùng CHUNG nên số và danh sách
 * không thể lệch (G-10). Số câu SQL không đổi theo số học viên (lô 400): lượt, Case, tín hiệu, tên.
 */

export type DongBoQuen = { studentId: number; ten: string; lop: string | null; kyNang: string; chiTiet: string; tu: string };

const CHU_CAI: Record<HoKyNang, string> = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S' };
const THU_TU_HO: readonly HoKyNang[] = ['listening', 'reading', 'writing', 'speaking'];
const chunks = <T>(list: T[]): T[][] => Array.from({ length: Math.ceil(list.length / 400) }, (_, i) => list.slice(i * 400, i * 400 + 400));
const marks = (n: number) => Array.from({ length: n }, () => '?').join(',');
const cat = (s: string, max = 60) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

export function boQuen(p: Principal, branchId: number | null, today: string): Record<LoaiBoQuen, DongBoQuen[]> {
  return nho(`bo-quen:${p.userId}:${branchId}:${today}`, () => tinh(p, branchId, today));
}

function tinh(p: Principal, branchId: number | null, today: string): Record<LoaiBoQuen, DongBoQuen[]> {
  const ketQua: Record<LoaiBoQuen, DongBoQuen[]> = { 'can-ho-tro-2-lan': [], 'bo-qua-van-can-ho-tro': [] };
  const hvIds = studentsInScope(p, branchId);
  if (!hvIds.length) return ketQua;
  const conn = db();

  // Lượt (mới nhất trước) của cả nhóm học viên, và bộ nhớ đệm đánh giá từng lượt — đánh giá trong bộ nhớ, không SQL.
  const luotCua = attemptsNewestFirst(hvIds);
  const bundle = loadBundle([...luotCua.values()].flat().map((a) => a.id));
  const programmes = allProgrammes();
  const bo = new Map<number, ReturnType<typeof evaluateAttemptRow>>();
  const evOf = (a: any) => { let e = bo.get(a.id); if (!e) { e = evaluateAttemptRow(a, bundle, programmes); bo.set(a.id, e); } return e; };
  const duoi = (ev: ReturnType<typeof evaluateAttemptRow>, ho: HoKyNang) =>
    Object.entries(ev.skills).some(([k, v]) => hoKyNang(k) === ho && v.evaluable && v.under);
  const dongChu = (a: any) => nhanDot(a.kind, a.attempt_no);
  const laLopThuong = (a: any) => programmes.get(a.programme_code)?.scoringMode === 'ratio';
  /* K5-57: "cùng họ" theo khoá môn — FOU (G+V, P) không nối với W/S của BE/ELE, lớp thường không nối với FT. */
  const khoaHo = (a: any) => (laLopThuong(a) ? (programmeOf(a.programme_code) === 'FOU' ? 'FOU' : 'thuong') : 'ft');

  // Case của các học viên đó → họ kỹ năng đang mở, và ngày đóng gần nhất theo họ.
  const moCua = new Map<number, Set<HoKyNang>>();
  const dongGanNhat = new Map<string, string>();     // `${sid}:${ho}` → ngày đóng mới nhất
  for (const chunk of chunks(hvIds)) {
    for (const r of conn.prepare(
      `SELECT student_id, category, topic, status, closed_at FROM sos_cases WHERE student_id IN (${marks(chunk.length)})`,
    ).all(...chunk) as any[]) {
      const ho = hoKyNang(r.category ?? categoryOf(r.topic));
      if (!ho) continue;
      if (r.status !== 'done') {
        if (!moCua.has(r.student_id)) moCua.set(r.student_id, new Set());
        moCua.get(r.student_id)!.add(ho);
      } else if (r.closed_at) {
        const k = `${r.student_id}:${ho}`, ngayDong = String(r.closed_at).slice(0, 10);
        if (!dongGanNhat.has(k) || ngayDong > dongGanNhat.get(k)!) dongGanNhat.set(k, ngayDong);
      }
    }
  }
  const coCaseMo = (sid: number, ho: HoKyNang) => moCua.get(sid)?.has(ho) ?? false;

  // Tín hiệu lớp thường bị Bỏ qua.
  const boQuaCua = new Map<number, { attemptId: number; ho: HoKyNang; resolvedAt: string | null }[]>();
  for (const chunk of chunks(hvIds)) {
    for (const r of conn.prepare(
      `SELECT sg.student_id, sg.attempt_id, sg.skill, sg.category, sg.resolved_at
         FROM case_signals sg JOIN classes c ON c.id = sg.class_id
        WHERE sg.status = 'noted' AND c.is_fast_track = 0 AND sg.student_id IN (${marks(chunk.length)})
          AND EXISTS (SELECT 1 FROM enrollments e2 JOIN classes c2 ON c2.id = e2.class_id
                       WHERE e2.student_id = sg.student_id AND e2.status = 'active' AND c2.is_fast_track = 0)`,
    ).all(...chunk) as any[]) {
      const ho = hoKyNang(r.skill ?? r.category);
      if (!ho || !r.attempt_id) continue;
      if (!boQuaCua.has(r.student_id)) boQuaCua.set(r.student_id, []);
      boQuaCua.get(r.student_id)!.push({ attemptId: r.attempt_id, ho, resolvedAt: r.resolved_at ?? null });
    }
  }

  const dong1 = new Map<number, { ho: HoKyNang[]; moi: any; cu: any; lopThuong: boolean; daDong: string | null }>();
  const dong2 = new Map<number, { ho: HoKyNang[]; ngayBoQua: string | null; sau: any }>();

  for (const [sid, list] of luotCua) {
    const hopLe = list.filter((a) => evOf(a).scored > 0);          // mới nhất trước
    // 1) hai lượt hợp lệ mới nhất cùng dưới kỳ vọng / chưa đạt một họ, không Case mở cùng họ
    if (hopLe.length >= 2 && khoaHo(hopLe[0]) === khoaHo(hopLe[1])) {   // hai lượt phải CÙNG khoá họ (FT ≠ lớp thường; FOU ≠ BE/ELE)
      const [moi, cu] = hopLe;
      const ho = THU_TU_HO.filter((h) => duoi(evOf(moi), h) && duoi(evOf(cu), h) && !coCaseMo(sid, h));
      if (ho.length) {
        const ngayDong = ho.map((h) => dongGanNhat.get(`${sid}:${h}`)).filter(Boolean).sort().pop() ?? null;
        dong1.set(sid, { ho, moi, cu, lopThuong: laLopThuong(moi), daDong: ngayDong });
      }
    }
    // 2) tín hiệu bị Bỏ qua, lượt hợp lệ ngay sau vẫn chưa đạt cùng họ, không Case mở cùng họ
    const tinHieu = boQuaCua.get(sid) ?? [];
    if (tinHieu.length) {
      const ho: HoKyNang[] = []; let ngayBoQua: string | null = null; let sau: any = null;
      for (const t of tinHieu) {
        const i = hopLe.findIndex((a) => a.id === t.attemptId);
        if (i <= 0) continue;                                       // không có lượt hợp lệ NGAY SAU (mới hơn)
        const tiep = hopLe[i - 1];
        if (!laLopThuong(tiep)) continue;                          // lượt ngay sau phải là lớp thường (em đã lên FT thì hết "bỏ quên")
        if (!duoi(evOf(tiep), t.ho) || coCaseMo(sid, t.ho)) continue;
        if (!ho.includes(t.ho)) ho.push(t.ho);
        if (!sau || (tiep.period_start ?? '') > (sau.period_start ?? '')) { sau = tiep; ngayBoQua = t.resolvedAt; }
      }
      if (ho.length) dong2.set(sid, { ho: THU_TU_HO.filter((h) => ho.includes(h)), ngayBoQua, sau });
    }
  }

  // Tên + lớp đang học, một lô cho các em đã chọn.
  const chon = [...new Set([...dong1.keys(), ...dong2.keys()])];
  const ten = new Map<number, { ten: string; lop: string | null }>();
  for (const chunk of chunks(chon)) {
    for (const r of conn.prepare(
      `SELECT s.id, s.full_name,
              (SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id
                WHERE e.student_id = s.id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1) AS lop
         FROM students s WHERE s.id IN (${marks(chunk.length)})`,
    ).all(...chunk) as any[]) ten.set(r.id, { ten: r.full_name, lop: r.lop ?? null });
  }
  const nhan = (h: HoKyNang[]) => h.map((x) => CHU_CAI[x]).join(', ');

  for (const [sid, x] of [...dong1].sort((a, b) => a[0] - b[0])) {
    const dongTu = x.lopThuong ? 'chưa đạt' : 'dưới kỳ vọng';
    const phanCase = x.daDong ? `Case đóng ${ngay(x.daDong, today)}` : 'chưa có Case';
    ketQua['can-ho-tro-2-lan'].push({
      studentId: sid, ten: ten.get(sid)?.ten ?? `#${sid}`, lop: ten.get(sid)?.lop ?? null, kyNang: nhan(x.ho),
      chiTiet: cat(`${dongChu(x.cu)}, ${dongChu(x.moi)} ${dongTu} · ${phanCase}`), tu: tuanLich(x.moi.period_start, today),
    });
  }
  for (const [sid, x] of [...dong2].sort((a, b) => a[0] - b[0])) {
    ketQua['bo-qua-van-can-ho-tro'].push({
      studentId: sid, ten: ten.get(sid)?.ten ?? `#${sid}`, lop: ten.get(sid)?.lop ?? null, kyNang: nhan(x.ho),
      chiTiet: cat(`Bỏ qua ${x.ngayBoQua ? ngay(x.ngayBoQua, today) : '—'} · ${dongChu(x.sau)} vẫn chưa đạt`), tu: tuanLich(x.sau.period_start, today),
    });
  }
  return ketQua;
}

export type FilterBoQuen = { branchId?: number | null; ct: ChuongTrinh; loai: LoaiBoQuen };

/** Đường `/phan-tich/bo-quen`: phạm vi 403 như các đường Phân tích khác, lọc chương trình bằng CHÍNH bộ lọc của sổ. */
export function danhSachBoQuen(p: Principal, f: FilterBoQuen, today: string): { n: number; rows: DongBoQuen[] } {
  phamViPhanTich(p, f.branchId ?? null, null);
  const rows = boQuen(p, f.branchId ?? null, today)[f.loai];
  const giu = new Set(locTheoChuongTrinh('hoc-vien', rows.map((r) => r.studentId), f.ct));
  const loc = rows.filter((r) => giu.has(r.studentId));
  return { n: loc.length, rows: loc };
}
