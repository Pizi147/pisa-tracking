/**
 * KIỂM Ô CỦA MỘT LỚP (PR-OV1a) — CHỈ ĐỌC: chỉ `prepare(...).all()` / `.get()`, không ghi câu nào. Chủ sản phẩm chạy trên database bản chính để
 * xem trạng thái TỪNG Ô nhập điểm của mọi em đang học ở một lớp (cho OV-1b / đặc tả mục 5.2), rồi gửi log cho planning.
 *
 * Một dòng mỗi ô nhập (Writing chấm band = W1 + W2; lớp thường một ô theo môn) của MỌI lượt của em — MT, MT0, Progress, Final, cả lượt đã huỷ,
 * kể cả lượt ở lớp cũ (nhãn lượt kèm mã lớp khi khác lớp đang xem). Lượt chưa có dòng kỹ năng → một dòng "(chưa có)".
 * `tru` = ≤ 5 dòng lịch sử lịch mới nhất của lượt (`attempt_schedule_history`), chỉ ghi ở dòng ô đầu tiên của lượt.
 *
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2) rồi `npm run kiem-o-lop -- "CP FT RF 01"`. Không có biến Turso → DB cục bộ.
 * `IN (…)` chia lô `theoLo` (≤ 900 tham số); mọi tham số là số vị trí.
 */
import { DB_PATH, closeDb, db, theoLo } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';
import { nhanDot, type AssessedSkill } from '../../../shared/domain/index.ts';
import { entrySkillsOf } from '../fasttrack/scoring.ts';

export type DongO = {
  hocVien: string; ma: string; luot: string; trangThaiLuot: string; lichSu: boolean;
  kyNang: string; o: string; tuanLich: string; sitStatus: string; batBuoc: boolean;
  soLanVang: number; huyVang: boolean; hanRieng: string; band: number | null; diem: number | null; tong: number | null;
  dauTru: boolean; tuanDauTru: string; daChot: string; nhapMuon: boolean; tru: string;
};

const LICH_SU_TOI_DA = 5;

export function kiemOLop(conn: any, maLop: string): DongO[] {
  const lop = conn.prepare('SELECT id, code FROM classes WHERE code = ?').get(maLop) as { id: number; code: string } | undefined;
  if (!lop) throw new Error(`Không thấy lớp "${maLop}"`);

  const em = (conn.prepare(
    `SELECT DISTINCT s.id, s.full_name, s.student_code FROM enrollments e JOIN students s ON s.id = e.student_id
      WHERE e.class_id = ? AND e.status = 'active' ORDER BY s.full_name`).all(lop.id) as any[]);
  const emCua = new Map(em.map((s) => [s.id as number, s]));

  const luot: any[] = [];
  theoLo(em.map((s) => s.id as number), (lo, ph) => {
    luot.push(...conn.prepare(
      `SELECT a.id, a.student_id, a.kind, a.attempt_no, a.status, a.lich_su, c.code AS lop
         FROM assessment_attempts a LEFT JOIN classes c ON c.id = a.class_id WHERE a.student_id IN (${ph})`).all(...lo));
  });
  const ids = luot.map((a) => a.id as number);
  const kyNang = new Map<number, any[]>();
  const diem = new Map<string, any>();
  const lichSu = new Map<number, string[]>();
  theoLo(ids, (lo, ph) => {
    for (const k of conn.prepare(
      `SELECT k.*, p.code AS tuan FROM attempt_skills k LEFT JOIN report_periods p ON p.id = k.planned_period_id
        WHERE k.attempt_id IN (${ph}) ORDER BY k.id`).all(...lo) as any[]) {
      (kyNang.get(k.attempt_id) ?? kyNang.set(k.attempt_id, []).get(k.attempt_id)!).push(k);
    }
    for (const sc of conn.prepare(
      `SELECT sc.*, p.code AS tuan_tru FROM assessment_scores sc LEFT JOIN report_periods p ON p.id = sc.no_show_period_id
        WHERE sc.attempt_id IN (${ph})`).all(...lo) as any[]) diem.set(`${sc.attempt_id}|${sc.skill}`, sc);
    for (const h of conn.prepare(
      `SELECT attempt_id, action, field, old_value, new_value, created_at FROM attempt_schedule_history
        WHERE attempt_id IN (${ph}) ORDER BY id DESC`).all(...lo) as any[]) {
      const ds = lichSu.get(h.attempt_id) ?? lichSu.set(h.attempt_id, []).get(h.attempt_id)!;
      if (ds.length < LICH_SU_TOI_DA) ds.push(`${h.action}${h.field ? ` ${h.field}` : ''} · ${h.old_value ?? '∅'} → ${h.new_value ?? '∅'} · ${String(h.created_at).slice(0, 16)}`);
    }
  });

  const thuTu = (a: any) => (a.kind === 'mock' ? 10 + (a.attempt_no ?? 0) : a.kind === 'progress' ? 1 : a.kind === 'final' ? 2 : 3);
  luot.sort((x, y) => String(emCua.get(x.student_id).full_name).localeCompare(emCua.get(y.student_id).full_name, 'vi')
    || x.student_id - y.student_id || thuTu(x) - thuTu(y) || x.id - y.id);

  const ra: DongO[] = [];
  for (const a of luot) {
    const s = emCua.get(a.student_id);
    /* MT và MT0 chấm band (ô W1, W2); Progress / Final lớp thường một ô theo môn của chương trình. */
    const band = a.kind === 'mock' || a.kind === 'mt0';
    const chung = {
      hocVien: s.full_name as string, ma: s.student_code as string,
      luot: `${nhanDot(a.kind, a.attempt_no)}${a.lop && a.lop !== lop.code ? ` (${a.lop})` : ''}`,
      trangThaiLuot: a.status as string, lichSu: !!a.lich_su,
    };
    let tru = (lichSu.get(a.id) ?? []).join(' | ');
    const ks = kyNang.get(a.id) ?? [];
    if (!ks.length) {
      ra.push({ ...chung, kyNang: '(chưa có)', o: '', tuanLich: '', sitStatus: '', batBuoc: false, soLanVang: 0, huyVang: false, hanRieng: '',
        band: null, diem: null, tong: null, dauTru: false, tuanDauTru: '', daChot: '', nhapMuon: false, tru });
      continue;
    }
    for (const k of ks) {
      for (const o of band ? entrySkillsOf(k.skill as AssessedSkill) : [k.skill as string]) {
        const sc = diem.get(`${a.id}|${o}`);
        ra.push({
          ...chung, kyNang: k.skill, o, tuanLich: k.tuan ?? '', sitStatus: k.sit_status, batBuoc: k.required === 1,
          soLanVang: k.absence_move_count, huyVang: !!k.huy_vang, hanRieng: k.deadline_override ?? '',
          band: sc?.band ?? null, diem: sc?.raw_score ?? null, tong: sc?.raw_total ?? null,
          dauTru: !!sc?.no_show_period_id, tuanDauTru: sc?.tuan_tru ?? '', daChot: sc?.no_show_settled_at ?? '', nhapMuon: !!sc?.no_show_late, tru,
        });
        tru = '';
      }
    }
  }
  return ra;
}

function inBang(ds: DongO[]): string[] {
  const tieu = ['Học viên', 'Mã', 'Lượt', 'TT lượt', 'Ô', 'Tuần', 'Phần thi', 'BB', 'Vắng', 'Huỷ vắng', 'Hạn riêng', 'Band', 'Đúng/Tổng', '"-"', 'Chốt "-"', 'Muộn'];
  const co = (b: boolean) => (b ? 'có' : '');
  const hang = ds.map((d) => [
    d.hocVien, d.ma, d.luot + (d.lichSu ? ' ·LS' : ''), d.trangThaiLuot, d.o || d.kyNang, d.tuanLich, d.sitStatus, co(d.batBuoc),
    d.soLanVang ? String(d.soLanVang) : '', co(d.huyVang), d.hanRieng, d.band === null ? '' : String(d.band),
    d.diem === null ? '' : `${d.diem}/${d.tong ?? '?'}`, d.dauTru ? `- ${d.tuanDauTru}` : '', d.daChot.slice(0, 10), co(d.nhapMuon),
  ]);
  const rong = tieu.map((t, i) => Math.max(t.length, ...hang.map((h) => h[i].length)));
  const dong = (v: string[]) => `  ${v.map((x, i) => x.padEnd(rong[i])).join(' │ ')}`.trimEnd();
  const ra = [dong(tieu), `  ${rong.map((r) => '─'.repeat(r)).join('─┼─')}`];
  hang.forEach((h, i) => {
    ra.push(dong(h));
    if (ds[i].tru) for (const x of ds[i].tru.split(' | ')) ra.push(`      ↳ ${x}`);
  });
  return ra;
}

/* Chỉ chạy khi được gọi như lệnh (phép kiểm import hàm mà không kích hoạt). */
if (process.argv[1] && /kiemOLop\.[jt]s$/.test(process.argv[1])) {
  const maLop = process.argv.slice(2).join(' ').trim();
  console.log(`[kiem-o-lop] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  if (!maLop) {
    console.error('[kiem-o-lop] Thiếu mã lớp. Ví dụ: npm run kiem-o-lop -- "CP FT RF 01"');
    process.exit(2);
  }
  try {
    const ds = kiemOLop(db(), maLop);
    console.log(`\n${maLop} — ${new Set(ds.map((d) => d.ma)).size} em đang học · ${ds.length} ô`);
    for (const l of inBang(ds)) console.log(l);
  } catch (e) {
    console.error(`[kiem-o-lop] ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
