/**
 * THÔNG BÁO TỰ ĐỘNG THAY NHẮC (OV-15d, C03; thiết kế OV-14 mục 3.4). Ba sự kiện, mỗi thông báo trỏ MỘT đối tượng nghiệp vụ:
 *  · bài quá hạn chấm của CHÍNH GV — một thông báo mỗi lớp · đợt (cùng tập việc Nhập điểm quá hạn của `/my-work`);
 *  · Case chưa chốt PA quá hạn — người phụ trách Case (GVCN), cùng luật ⚠ cột Chờ duyệt (`xuLyCaseMany`, như chỉ số `case-xac-dinh-nguyen-nhan-qua-han`);
 *  · Chốt lộ trình tới hạn — QL (việc `chot_len_ft` có hạn trong `CHOT_TOI_HAN_NGAY` ngày tới, hoặc đã qua).
 * ĐỒNG BỘ, không chỉ thêm: thông báo của việc đã xong tự hết (xoá), thông báo còn việc thì cập nhật chữ; dedup theo (người, đối tượng).
 * Chạy khi người đó mở chuông (`GET /notifications`), tối đa một lần / `CHU_KY_MS` mỗi người. Không email / push.
 */
import { db } from '../db.ts';
import { ngay, tenMon } from '../../../shared/domain/index.ts';
import type { Principal } from '../permissions.ts';
import { myWork, type WorkItem } from '../worklist/mywork.ts';
import { xuLyCaseMany } from '../cases/sosState.ts';
import { notify } from './audit.ts';
import { addDays } from '../util.ts';

/** "Tới hạn" Chốt lộ trình = hạn trong 7 ngày tới (hoặc đã qua). */
export const CHOT_TOI_HAN_NGAY = 7;
const KIND = ['cham_qua_han', 'case_chua_chot_pa', 'chot_lo_trinh'] as const;
type Muon = { kind: (typeof KIND)[number]; title: string; body: string; entityType: string; entityId: number | null; duong: string };

/** Một lớp · một đợt (lượt + tuần thi) — khoá gom việc Nhập điểm quá hạn thành MỘT thông báo. */
export const khoaChamQuaHan = (x: Pick<WorkItem, 'classId' | 'attemptNo' | 'periodId'> & { luot?: string }) =>
  `${x.classId ?? 0}:${x.luot ?? x.attemptNo ?? ''}:${x.periodId ?? ''}`;

const NGAY_MS = 86_400_000;
const soNgay = (tu: string, den: string) => Math.round((Date.parse(`${den.slice(0, 10)}T00:00:00Z`) - Date.parse(`${tu.slice(0, 10)}T00:00:00Z`)) / NGAY_MS);

function viecMuon(p: Principal, homNay: string): Map<string, Muon> {
  const muon = new Map<string, Muon>();
  const items = (myWork(p, { chiNhom: new Set(['score', 'chot_len_ft']) }).items ?? []) as WorkItem[];

  /* 1. Bài quá hạn chấm của chính GV — gom theo lớp · đợt; bấm mở việc đầu của nhóm trong Công việc. */
  const cham = new Map<string, WorkItem[]>();
  for (const x of items) {
    if (x.group !== 'score' || !x.mine || x.urgency !== 'overdue') continue;
    const k = khoaChamQuaHan(x);
    cham.set(k, [...(cham.get(k) ?? []), x]);
  }
  for (const [k, ds] of cham) {
    const dau = ds[0];
    const bai = ds.reduce((s, x) => s + (x.soBai ?? x.count ?? 1), 0);
    const han = ds.map((x) => x.due).filter((h): h is string => !!h).sort()[0];
    muon.set(`tudong:cham:${k}`, {
      kind: 'cham_qua_han', title: `Quá hạn chấm · ${dau.classCode ?? dau.studentName}`,
      body: [dau.contextLabel, `${bai} bài`, han ? `quá hạn ${soNgay(han, homNay)} ngày` : null].filter(Boolean).join(' · '),
      entityType: 'class', entityId: dau.classId, duong: `/cong-viec?viec=${encodeURIComponent(dau.key)}`,
    });
  }

  /* 2. Chốt lộ trình tới hạn — QL (việc của cả lớp, không gán người: chỉ người có việc này trong `/my-work` mới nhận). */
  const moc = addDays(homNay, CHOT_TOI_HAN_NGAY);
  for (const x of items) {
    if (x.group !== 'chot_len_ft' || !x.due || x.due > moc) continue;
    muon.set(`tudong:chot:${x.classId}`, {
      kind: 'chot_lo_trinh', title: x.tieuDe, body: `hạn ${ngay(x.due, homNay)}${x.due < homNay ? ` · quá hạn ${soNgay(x.due, homNay)} ngày` : ''}`,
      entityType: 'class', entityId: x.classId, duong: `/cong-viec?viec=${encodeURIComponent(x.key)}`,
    });
  }

  /* 3. Case chưa chốt PA quá hạn — Case người này phụ trách; một câu đọc Case đang mở của người đó. */
  const cs = db().prepare(
    `SELECT sc.id, s.full_name AS ten, COALESCE(sc.category, sc.topic) AS mon, cy.programme_code AS ct
       FROM sos_cases sc JOIN students s ON s.id = sc.student_id LEFT JOIN learning_cycles cy ON cy.id = sc.cycle_id
      WHERE sc.owner_user_id = ? AND sc.status != 'done' AND sc.tam = 0 AND s.archived_at IS NULL`,   /* Case thật (OV-13a), em chưa lưu trữ — như tập chỉ số */
  ).all(p.userId) as any[];
  const xl = xuLyCaseMany(cs.map((c) => c.id as number), homNay);
  for (const c of cs) {
    const x = xl.get(c.id);
    if (x?.cot !== 'choDuyet' || !x.quaHan) continue;
    muon.set(`tudong:case:${c.id}`, {
      kind: 'case_chua_chot_pa', title: `Case chưa chốt PA quá hạn · ${c.ten}`,
      body: [c.mon ? tenMon(c.ct ?? null, c.mon) : null, x.han ? `quá hạn ${soNgay(x.han, homNay)} ngày` : null].filter(Boolean).join(' · '),
      entityType: 'sos_case', entityId: c.id, duong: `/hoc-thuat/case/${c.id}`,
    });
  }
  return muon;
}

/** Đồng bộ thông báo tự động của MỘT người: thêm cái mới, sửa chữ cái đổi, xoá cái đã hết việc. Trả số dòng đã ghi. */
export function dongBoThongBaoTuDong(p: Principal, homNay: string): number {
  const muon = viecMuon(p, homNay);
  const co = db().prepare(
    `SELECT id, dedup_key, title, body FROM notifications WHERE user_id = ? AND kind IN (${KIND.map(() => '?').join(',')})`,
  ).all(p.userId, ...KIND) as any[];
  let ghi = 0;
  const het = co.filter((n) => !muon.has(n.dedup_key)).map((n) => n.id as number);
  if (het.length) {
    db().prepare(`DELETE FROM notifications WHERE id IN (${het.map(() => '?').join(',')})`).run(...het);
    ghi += het.length;
  }
  const cu = new Map(co.map((n) => [n.dedup_key as string, n]));
  for (const [dedupKey, m] of muon) {
    const n = cu.get(dedupKey);
    if (n && n.title === m.title && (n.body ?? '') === m.body) continue;
    notify({ userId: p.userId, ...m, dedupKey });
    ghi += 1;
  }
  return ghi;
}

/** Lần đồng bộ gần nhất của mỗi người (bộ nhớ tiến trình) — mở chuông liên tục không tính lại việc mỗi lần. */
const CHU_KY_MS = 5 * 60_000;
const lanCuoi = new Map<number, number>();
export function dongBoKhiMoChuong(p: Principal, homNay: string) {
  const now = Date.now();
  if (now - (lanCuoi.get(p.userId) ?? 0) < CHU_KY_MS) return;
  lanCuoi.set(p.userId, now);
  try { dongBoThongBaoTuDong(p, homNay); } catch (e) { console.error('[thong-bao-tu-dong]', e); }   // lỗi không làm hỏng chuông
}
