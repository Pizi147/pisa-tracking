/**
 * THÔNG BÁO TỰ ĐỘNG THAY NHẮC (OV-15d, C03; thiết kế OV-14 mục 3.4). Ba sự kiện, mỗi thông báo trỏ MỘT đối tượng nghiệp vụ:
 *  · bài quá hạn chấm của CHÍNH GV — một thông báo mỗi lớp · đợt (cùng tập việc Nhập điểm quá hạn của `/my-work`);
 *  · Case chưa chốt PA quá hạn — người phụ trách Case (GVCN), cùng luật ⚠ cột Chờ duyệt (`xuLyCaseMany`, như chỉ số `case-xac-dinh-nguyen-nhan-qua-han`);
 *  · Chốt lộ trình tới hạn — QL (việc `chot_len_ft` có hạn trong `CHOT_TOI_HAN_NGAY` ngày tới, hoặc đã qua).
 *  · SV-YT-TVV: việc Báo PH sau lưu xử lý — người giữ HIỆN TẠI (TVV / QL khi em chưa có TVV), MỘT thông báo mỗi người (1 việc: tên em; nhiều: "· n em"),
 *    hạn sớm nhất, "Quá hạn · …" khi có việc quá hạn — không tràn chuông (50 dòng) khi QL giữ nhiều việc.
 * ĐỒNG BỘ, không chỉ thêm: thông báo của việc đã xong tự hết (xoá), thông báo còn việc thì cập nhật chữ; dedup theo (người, đối tượng).
 * Chạy khi người đó mở chuông (`GET /notifications`), tối đa một lần / `CHU_KY_MS` mỗi người. Không email / push.
 */
import { chenNhieuDong, db, theoLo } from '../db.ts';
import { tenMon } from '../../../shared/domain/index.ts';
import type { Principal } from '../permissions.ts';
import { myWork, type WorkItem } from '../worklist/mywork.ts';
import { xuLyCaseMany } from '../cases/sosState.ts';
import { addDays, nowIso } from '../util.ts';

/** "Tới hạn" Chốt lộ trình = hạn trong 7 ngày tới (hoặc đã qua). */
export const CHOT_TOI_HAN_NGAY = 7;
/** OV-15h1: một luật "tới hạn" cho thông báo Chốt lộ trình và "Cần bạn quyết" ở Tổng quan QL. Không có hạn → chưa tới hạn. */
export const toiHan = (han: string | null | undefined, homNay: string) => !!han && han <= addDays(homNay, CHOT_TOI_HAN_NGAY);
const KIND = ['cham_qua_han', 'case_chua_chot_pa', 'chot_lo_trinh', 'bao_ph_xu_ly'] as const;
type Muon = { kind: (typeof KIND)[number]; title: string; body: string; entityType: string; entityId: number | null; duong: string;
  /** SL1 (N1): hạn của việc — chuông sắp Cần làm theo hạn. */ han: string | null };

/** Một lớp · một đợt (lượt + tuần thi) — khoá gom việc Nhập điểm quá hạn thành MỘT thông báo. */
export const khoaChamQuaHan = (x: Pick<WorkItem, 'classId' | 'attemptNo' | 'periodId'> & { luot?: string }) =>
  `${x.classId ?? 0}:${x.luot ?? x.attemptNo ?? ''}:${x.periodId ?? ''}`;

/** Case đang mở của MỘT người phụ trách — Case thật (OV-13a), em chưa lưu trữ, như tập chỉ số; đi chỉ mục `idx_case_owner`. */
export const CAU_CASE_CUA_NGUOI = `SELECT sc.id, s.full_name AS ten, COALESCE(sc.category, sc.topic) AS mon, cy.programme_code AS ct
       FROM sos_cases sc JOIN students s ON s.id = sc.student_id LEFT JOIN learning_cycles cy ON cy.id = sc.cycle_id
      WHERE sc.owner_user_id = ? AND sc.status != 'done' AND sc.tam = 0 AND s.archived_at IS NULL`;

function viecMuon(p: Principal, homNay: string): Map<string, Muon> {
  const muon = new Map<string, Muon>();
  const items = (myWork(p, { chiNhom: new Set(['score', 'chot_len_ft', 'bao_ph_yt']) }).items ?? []) as WorkItem[];

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
      /* SL1: hạn không viết vào thân — chuông vẽ `han` bằng `Han` (cùng một kiểu cho mọi dòng Cần làm). */
      body: [dau.contextLabel, `${bai} bài`].filter(Boolean).join(' · '),
      entityType: 'class', entityId: dau.classId, duong: `/cong-viec?viec=${encodeURIComponent(dau.key)}`, han: han ?? null,
    });
  }

  /* 2. Chốt lộ trình tới hạn — QL (việc của cả lớp, không gán người: chỉ người có việc này trong `/my-work` mới nhận). */
  for (const x of items) {
    if (x.group !== 'chot_len_ft' || !toiHan(x.due, homNay) || !x.due) continue;
    muon.set(`tudong:chot:${x.classId}`, {
      kind: 'chot_lo_trinh', title: x.tieuDe, body: '',
      entityType: 'class', entityId: x.classId, duong: `/cong-viec?viec=${encodeURIComponent(x.key)}`, han: x.due,
    });
  }

  /* SV-YT-TVV: Báo PH — việc của chính người xem (đổi TVV → chuông sang người mới; em Tạm dừng / ghi xong / bỏ → hết). MỘT dòng mỗi người. */
  const bp = items.filter((x) => x.group === 'bao_ph_yt' && x.mine).sort((a, b) => String(a.due).localeCompare(String(b.due)));
  if (bp.length) {
    const dau = bp[0];
    const chu = bp.length === 1 ? dau.tieuDe : `Báo PH vi phạm · ${bp.length} em`;
    muon.set('tudong:bao-ph', {
      kind: 'bao_ph_xu_ly', title: bp.some((x) => x.urgency === 'overdue') ? `Quá hạn · ${chu}` : chu, body: '',
      entityType: 'viec_bao_ph', entityId: dau.viecId ?? null,
      duong: bp.length === 1 ? dau.href : p.roleKeys.includes('consultant') ? '/' : `/cong-viec?viec=${encodeURIComponent(dau.key)}`, han: dau.due,
    });
  }

  /* 3. Case chưa chốt PA quá hạn — Case người này phụ trách; một câu đọc Case đang mở của người đó. */
  const cs = db().prepare(CAU_CASE_CUA_NGUOI).all(p.userId) as any[];
  const xl = xuLyCaseMany(cs.map((c) => c.id as number), homNay);
  for (const c of cs) {
    const x = xl.get(c.id);
    if (x?.cot !== 'choDuyet' || !x.quaHan) continue;
    muon.set(`tudong:case:${c.id}`, {
      kind: 'case_chua_chot_pa', title: `Case chưa chốt PA quá hạn · ${c.ten}`,
      body: c.mon ? tenMon(c.ct ?? null, c.mon) : '',
      entityType: 'sos_case', entityId: c.id, duong: `/hoc-thuat/case/${c.id}`, han: x.han ?? null,
    });
  }
  return muon;
}

/**
 * Đồng bộ thông báo tự động của MỘT người: thêm cái mới, sửa chữ cái đổi, xoá cái đã hết việc. Trả số dòng đã ghi.
 * OV-15h1: thêm + sửa là MỘT câu upsert cho cả lô (`chenNhieuDong`, trùng khoá → chỉ đổi chữ / đường; `read_at` giữ nguyên — không reset đã đọc).
 */
export function dongBoThongBaoTuDong(p: Principal, homNay: string): number {
  const muon = viecMuon(p, homNay);
  const co = db().prepare(
    `SELECT id, dedup_key, title, body, duong, han FROM notifications WHERE user_id = ? AND kind IN (${KIND.map(() => '?').join(',')})`,
  ).all(p.userId, ...KIND) as any[];
  const het = co.filter((n) => !muon.has(n.dedup_key)).map((n) => n.id as number);
  theoLo(het, (lo, ph) => { db().prepare(`DELETE FROM notifications WHERE id IN (${ph})`).run(...lo); });   // ≤ THAM_SO_TOI_DA tham số mỗi câu (Turso)
  const cu = new Map(co.map((n) => [n.dedup_key as string, n]));
  const luc = nowIso();
  const doi = [...muon].filter(([k, m]) => { const n = cu.get(k); return !n || n.title !== m.title || (n.body ?? '') !== m.body || n.duong !== m.duong || (n.han ?? null) !== m.han; })
    .map(([k, m]) => [p.userId, m.kind, m.title, m.body, m.entityType, m.entityId, k, luc, m.duong, m.han]);
  chenNhieuDong('INSERT INTO notifications (user_id, kind, title, body, entity_type, entity_id, dedup_key, created_at, duong, han)', doi,
    ' ON CONFLICT(user_id, dedup_key) DO UPDATE SET title = excluded.title, body = excluded.body, duong = excluded.duong, han = excluded.han');
  return het.length + doi.length;
}

/** Lần đồng bộ gần nhất của mỗi người (bộ nhớ tiến trình) — mở chuông liên tục không tính lại việc mỗi lần. */
const CHU_KY_MS = 5 * 60_000;
const lanCuoi = new Map<number, number>();
/**
 * OV-15h1: người này vừa ghi thành công (POST/PUT/PATCH/DELETE) — việc của họ có thể vừa xong, nên lần mở chuông kế đồng bộ ngay (không chờ 5 phút).
 * shortcut: nhớ theo tiến trình — việc xong do NGƯỜI KHÁC làm (QL nhập điểm thay GV) vẫn chờ chu kỳ; bản chính nhiều bản hàm thì có thể trượt
 * sang bản khác. Cần chặt hơn thì lưu mốc ghi vào DB.
 * ponytail: OV-15i1 ý 12 — chưa làm "hết ngay khi người khác làm xong": cách rẻ duy nhất là mọi lần ghi xoá mốc của MỌI người, khi đó mỗi lần mở chuông
 * sau bất kỳ lần ghi nào đều đồng bộ (~30 câu `myWork`, đo QT 33 vs 4) — nặng hơn cái lợi; muốn đúng người thì đường ghi điểm / Case phải tự gọi `daGhi(gv)`.
 */
export function daGhi(userId: number) { lanCuoi.delete(userId); }
export function dongBoKhiMoChuong(p: Principal, homNay: string) {
  const now = Date.now();
  if (now - (lanCuoi.get(p.userId) ?? 0) < CHU_KY_MS) return;
  lanCuoi.set(p.userId, now);
  try { dongBoThongBaoTuDong(p, homNay); } catch (e) { console.error('[thong-bao-tu-dong]', e); }   // lỗi không làm hỏng chuông
}
