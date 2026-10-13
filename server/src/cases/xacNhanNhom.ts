/**
 * XÁC NHẬN NGUYÊN NHÂN CẢ NHÓM (OV-5a — đặc tả OV mục 4 "Công việc", mockup M1 §1, chốt CV1). Công việc gom việc Xác nhận nguyên nhân theo
 * LỚP + KỸ NĂNG + LƯỢT (`gopViec.ts`); panel phải đọc nhóm (`nhomXacNhan`) rồi xác nhận các em đã chọn (`xacNhanNhom`).
 *
 * Không luật mới: mỗi Case đi qua đúng `xacNhanCase` (+ `xacNhanPaQuyChe` khi "xác nhận cùng lúc") trong MỘT giao dịch — một em lỗi thì không em
 * nào được ghi. Trước khi ghi: quyền từng Case (403 cả lô, nói tên em), cùng lớp + kỹ năng + lượt, cùng MỨC PA quy chế (loại + mốc của PA chờ xác
 * nhận); em khác mức → 400 nói đúng em (panel đã tự bỏ chọn em đó, "làm riêng"). Mức gấp: giữ mức Case đã có, không có thì theo SOS (SOS 3 = Gấp,
 * cùng luật hạn `hanXacNhan`) — panel không hỏi thêm ô (mockup). Tên Case giữ phần giữa mặc định (`tenGiuaCua`).
 */
import { db, tx } from '../db.ts';
import {
  URGENCY_LEVELS, caseTopicLabel, mocChuPa, nhanDotNgan, tenMonNgan, INTERVENTION_KIND_LABEL, type InterventionKind,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { HttpError, badRequest, forbidden, notFound } from '../util.ts';
import { napTruocPhamVi, type Principal } from '../permissions.ts';
import { allProgrammes } from '../normal/regular.ts';
import { expectationFor } from '../fasttrack/scoring.ts';
import { routeCuaLuot } from '../fasttrack/attempts.ts';
import { caseAccess } from './cases.ts';
import { awaitingCauseCaseIds } from './sosState.ts';
import { kiemNoiDungCase, tenGiuaCua, xacNhanCase, xacNhanPaQuyChe } from './sosAuto.ts';

/**
 * Số em tối đa MỘT lần xác nhận (một giao dịch): mỗi em ~30 câu SQL (xác nhận Case + PA đi đúng hàm một Case), Turso ~20–50 ms/câu, Netlify 10 s
 * → ≤ 200 câu (phép kiểm OV5a-6 đo). Nhóm đông hơn: panel gửi lần lượt từng lô (mỗi lô một giao dịch), dừng ở lô lỗi.
 */
export const TOI_DA_EM = 6;
const SUA = 'Bạn chỉ xử lý được Case của kỹ năng mình được phân công (hoặc là Quản lý trong phạm vi).';

function docIds(v: unknown): number[] {
  const ds = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [];
  const ids = [...new Set(ds.map((x) => Number(x)))];
  if (!ids.length || ids.some((x) => !Number.isInteger(x) || x <= 0)) throw badRequest('Chọn ít nhất một em để xác nhận.');
  if (ids.length > TOI_DA_EM) throw badRequest(`Mỗi lần xác nhận tối đa ${TOI_DA_EM} em.`);
  return ids;
}

/** MỘT câu cho cả nhóm: Case · em · lớp của lượt (như dòng việc) · lượt · điểm kỹ năng · PA quy chế chờ xác nhận (đầu tiên, không phải Bổ trợ). */
function napNhom(ids: number[]) {
  const rows = db().prepare(
    `SELECT sc.id, sc.topic, sc.sos_level, sc.urgency, sc.status, sc.title, sc.category, sc.cycle_id, sc.attempt_id,
            COALESCE(sc.student_id, a.student_id) AS sid, s.full_name,
            COALESCE(a.class_id, cur.class_id) AS lop, COALESCE(ac.code, cc.code) AS lop_code, COALESCE(ac.programme_code, cc.programme_code) AS ct,
            a.kind AS attempt_kind, a.attempt_no, a.target_at_attempt, a.cycle_id AS a_cycle_id, cy.route,
            sco.band, sco.raw_score, sco.raw_total,
            iv.id AS iv_id, iv.kind AS pa_kind, iv.moc_quy_che, iv.description AS pa_mo_ta, iv.performer_user_id, iv.performer_name, iv.so_buoi,
            u.full_name AS performer_account
       FROM sos_cases sc
       LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
       LEFT JOIN learning_cycles cy ON cy.id = a.cycle_id
       LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
       LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
       LEFT JOIN classes ac ON ac.id = a.class_id
       LEFT JOIN classes cc ON cc.id = cur.class_id
       LEFT JOIN assessment_scores sco ON sco.attempt_id = a.id AND sco.skill = sc.topic
       LEFT JOIN case_interventions iv ON iv.id = (SELECT x.id FROM case_interventions x WHERE x.case_id = sc.id AND x.preset = 1
                                                     AND x.confirmed_at IS NULL AND x.status = 'planned' AND x.kind != 'bo_tro' ORDER BY x.id LIMIT 1)
       LEFT JOIN users u ON u.id = iv.performer_user_id
      WHERE sc.id IN (${ids.map(() => '?').join(',')})
      GROUP BY sc.id`,
  ).all(...ids) as any[];
  const theoId = new Map(rows.map((r) => [r.id as number, r]));
  const thieu = ids.find((id) => !theoId.has(id));
  if (thieu) throw notFound('Không tìm thấy Case');
  return ids.map((id) => theoId.get(id)!);
}

/** Mức PA quy chế = loại + mốc của PA chờ xác nhận; không có PA chờ (Bổ trợ lớp thường, PA đã xác nhận) → '-'. */
const mucCua = (r: any) => (r.iv_id ? `${r.pa_kind}|${r.moc_quy_che ?? ''}` : '-');
const nhomCua = (r: any) => `${r.lop ?? 0}|${r.attempt_kind ?? 'mock'}${r.attempt_no ?? ''}|${r.topic ?? ''}`;
/** Mức của nhiều em nhất (bằng nhau → em đứng trước) — "chung"; em khác mức làm riêng. */
function mucChung(rows: any[]): string {
  const dem = new Map<string, number>();
  for (const r of rows) dem.set(mucCua(r), (dem.get(mucCua(r)) ?? 0) + 1);
  return [...dem.entries()].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

/**
 * ĐỌC NHÓM cho panel (GET /cases/xac-nhan-nhom?ids=): lớp · lượt · kỹ năng · hạn; mỗi em điểm kỹ năng, kỳ vọng (FT), SOS, PA quy chế chờ xác
 * nhận, `lamRieng` (khác mức chung), `cho` (còn chờ nguyên nhân). Quyền: sửa Case đúng kỹ năng từng em (như xác nhận một Case).
 */
export function nhomXacNhan(p: Principal, idsVao: unknown) {
  const rows = napNhom(docIds(idsVao));
  napTruocPhamVi(rows.map((r) => r.sid));
  for (const r of rows) caseAccess(r.id).requireEdit(p, `${r.full_name ?? 'Học viên'}: ${SUA}`);
  const dau = rows[0];
  if (rows.some((r) => nhomCua(r) !== nhomCua(dau))) throw badRequest('Các em không cùng lớp, kỹ năng và lượt — mở từng việc để xác nhận.');
  const homNay = demoToday();
  const cho = new Set(awaitingCauseCaseIds(rows.map((r) => r.id)));
  const thuong = allProgrammes().get(dau.ct)?.scoringMode === 'ratio';
  const chung = mucChung(rows);
  const paCua = (r: any) => (r.iv_id ? {
    id: r.iv_id as number, kind: r.pa_kind as string, description: r.pa_mo_ta ?? null, soBuoi: r.so_buoi ?? null,
    performer: r.performer_account ?? r.performer_name ?? null, performerUserId: r.performer_user_id ?? null,
    mocChu: mocChuPa({ span: r.moc_quy_che ?? null, followupDue: null, mtKe: r.attempt_no ? r.attempt_no + 1 : null, daXacNhan: false }, homNay),
    ten: INTERVENTION_KIND_LABEL[r.pa_kind as InterventionKind] ?? r.pa_kind,
  } : null);
  const em = rows.map((r) => ({
    caseId: r.id as number, studentId: r.sid as number, ten: r.full_name ?? 'Học viên',
    band: r.band ?? null, raw: r.raw_score ?? null, total: r.raw_total ?? null,
    kyVong: thuong ? null : expectationFor(r.target_at_attempt ?? null, r.attempt_no ?? 1, routeCuaLuot({ cycle_id: r.a_cycle_id, route: r.route })),
    sos: r.sos_level ?? null, pa: paCua(r), lamRieng: mucCua(r) !== chung, cho: cho.has(r.id),
  }));
  const paChung = em.find((e) => !e.lamRieng)?.pa ?? null;
  return {
    lop: { id: dau.lop as number, code: dau.lop_code as string, ct: dau.ct ?? null, thuong },
    luot: { kind: dau.attempt_kind ?? 'mock', no: dau.attempt_no ?? null, nhan: nhanDotNgan(dau.attempt_kind, dau.attempt_no) ?? 'Case' },
    kyNang: { topic: dau.topic as string, nhan: thuong ? tenMonNgan(dau.ct ?? null, dau.topic) : caseTopicLabel(dau.topic, dau.ct ?? null) },
    paChung, em,
  };
}

/** Lỗi nghiệp vụ của một Case trong lô → nói tên em (người bấm biết em nào); lỗi lạ giữ nguyên. */
function theoEm<T>(ten: string, fn: () => T): T {
  try { return fn(); } catch (e) {
    if (e instanceof HttpError) throw new HttpError(e.status, `${ten}: ${e.message}`);
    throw e;
  }
}

/**
 * XÁC NHẬN NHÓM (POST /cases/xac-nhan-nhom). `pa` có = "xác nhận cùng lúc" (mặc định bật ở panel): cùng Nội dung / Số buổi / người cho PA quy chế
 * của mọi em đã chọn (người không gửi = giữ người máy gán từng em). Trả số em + PA chạy từ ngày nào cho dòng "✓ Đã xác nhận…".
 */
export function xacNhanNhom(p: Principal, input: {
  caseIds?: unknown; primaryCode?: string | null; observation?: string | null; moTa?: string | null;
  pa?: { description?: string | null; soBuoi?: unknown; performerSelf?: boolean; performerUserId?: number | null; performerName?: string | null } | null;
}) {
  const ids = docIds(input?.caseIds);
  const pa = input.pa ?? null;
  if (pa) {
    const moTaPa = typeof pa.description === 'string' ? pa.description.trim() : '';
    if (moTaPa.length < 15) throw badRequest('Nội dung PA cần ít nhất 15 ký tự — nêu hướng dẫn, trọng tâm và ai thực hiện.');
    if (moTaPa.length > 2000) throw badRequest('Nội dung PA tối đa 2000 ký tự.');
  }
  const noiDung = { primaryCode: input.primaryCode, observation: input.observation, moTa: input.moTa };
  /* Kiểm và ghi trong CÙNG giao dịch (giữ khoá ghi): quyền đã kiểm ở đây thì từng Case không kiểm lại (`daKiemQuyen`). */
  return tx(() => {
    const rows = napNhom(ids);
    napTruocPhamVi(rows.map((r) => r.sid));
    for (const r of rows) caseAccess(r.id).requireEdit(p, `${r.full_name ?? 'Học viên'}: ${SUA}`);
    const dau = rows[0];
    const khac = rows.filter((r) => nhomCua(r) !== nhomCua(dau));
    if (khac.length) throw badRequest(`${khac.map((r) => r.full_name).join(', ')}: không cùng lớp, kỹ năng và lượt với các em còn lại — xác nhận riêng.`);
    const chung = mucChung(rows);
    const lech = rows.filter((r) => mucCua(r) !== chung);
    if (lech.length) {
      throw badRequest(`${lech.map((r) => r.full_name).join(', ')}: PA theo quy chế khác mức các em còn lại — bỏ chọn, xác nhận riêng.`);
    }
    if (pa && !dau.iv_id) throw badRequest('Các em này không có PA theo quy chế chờ xác nhận — bỏ "xác nhận cùng lúc".');
    /* Tên Case mặc định chung cả nhóm (cùng kỹ năng + lượt) — tính một lần; nội dung kiểm một lần (câu lỗi chung, không tên em). */
    const giua = tenGiuaCua({ ...dau, title: null });
    kiemNoiDungCase(dau.topic, dau.ct ?? null, { ...noiDung, urgency: URGENCY_LEVELS[0], tenGiua: giua });
    const mucGap = (r: any) => ((URGENCY_LEVELS as readonly string[]).includes(r.urgency) ? r.urgency : (r.sos_level ?? 0) >= 3 ? 'urgent' : 'attention');
    const lo = { chiGhi: true, daKiemQuyen: true };
    for (const r of rows) {
      const ten = r.full_name ?? 'Học viên';
      theoEm(ten, () => xacNhanCase(p, r.id, { ...noiDung, urgency: mucGap(r), tenGiua: (r.title ?? '').trim() || giua }, lo));
      if (pa) theoEm(ten, () => xacNhanPaQuyChe(p, r.iv_id, pa, lo));
    }
    return {
      soEm: rows.length, caseIds: rows.map((r) => r.id as number), paChay: !!pa, ngay: demoToday(),
      tenPa: pa ? INTERVENTION_KIND_LABEL[dau.pa_kind as InterventionKind] ?? null : null,
    };
  });
}
