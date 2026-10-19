import { db, tx } from '../db.ts';
import { DAN_TOI_DA_DONG, ENTRY_SKILLS, docMaLuot } from '../../../shared/domain/index.ts';
import { saveScore } from '../fasttrack/attempts.ts';
import { voiNguon, writeAudit } from '../platform/audit.ts';
import type { Principal } from '../permissions.ts';
import { HttpError, badRequest, loi } from '../util.ts';

const TRUONG = ['rawScore', 'band', 'criteria', 'noShow', 'nhanXet', 'nhomNguyenNhan'] as const;
type ODan = { skill: string } & Partial<Record<(typeof TRUONG)[number], unknown>>;
type DongLo = { attemptId: number; o: ODan[] };
export type KetQuaDong = { attemptId: number; ok: true } | { attemptId: number; ok: false; skill: string | null; loi: string; status: number };
/** Tổng các request TRƯỚC của cùng một lần dán (web cộng từ kết quả máy chủ trả) — chỉ để ghi vào mục lịch sử tổng. */
type TongTruoc = { soDong: number; soDaLuu: number; soO: number };

const soDem = (v: unknown) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 10_000;

/** Kiểm hình dạng lô ở cửa (400 cả lô) — luật từng ô để `saveScore` lo. */
function docLo(v: unknown): DongLo[] {
  if (!Array.isArray(v) || !v.length) throw badRequest('Không có dòng nào để lưu.');
  if (v.length > DAN_TOI_DA_DONG) throw loi(400, 'Mỗi lần lưu tối đa {n} dòng.', { n: DAN_TOI_DA_DONG });
  return v.map((d: any) => {
    if (!d || !Number.isInteger(d.attemptId) || d.attemptId <= 0) throw badRequest('Lượt Test không hợp lệ.');
    /* Hoàn tác "- → điểm" cần hai lệnh cùng ô (xoá điểm, đặt lại "-") — tối đa hai lệnh mỗi kỹ năng. */
    if (!Array.isArray(d.o) || !d.o.length || d.o.length > ENTRY_SKILLS.length * 2) throw badRequest('Ô điểm của dòng không hợp lệ.');
    const o = d.o.map((x: any) => {
      if (!x || !(ENTRY_SKILLS as readonly string[]).includes(x.skill)) throw badRequest('Kỹ năng không hợp lệ.');
      /* Chỉ nhận đúng các trường của ô (không lý do, không GV chấm, không lịch); `noShow` chỉ true / false (gỡ dấu: `saveScore` kiểm quyền). */
      const r: ODan = { skill: x.skill };
      for (const k of TRUONG) {
        if (x[k] === undefined || (k === 'noShow' && x[k] !== true && x[k] !== false)) continue;
        r[k] = x[k];
      }
      if (Object.keys(r).length === 1) throw badRequest('Ô điểm của dòng không hợp lệ.');
      return r;
    });
    return { attemptId: d.attemptId, o };
  });
}

/**
 * DÁN TỪ EXCEL — LƯU (OV-15b mục 2, `POST /attempts/scores/lo`). Thân: `{ dong, classId, luot?, loId, cuoi?, truoc?, hoanTac? }`.
 *  · Mọi lượt phải thuộc đúng lớp (và đúng lượt `luot` = `mt:2` / `thuong:final`… khi web gửi) — sai một dòng là 400 cả lô.
 *  · Mỗi dòng (một em) MỘT giao dịch: mọi ô qua `saveScore` cửa người dùng (`tuNguoiDung`: nhận xét MT bắt buộc, nhóm nguyên nhân, band tự tính)
 *    với đúng quyền từng ô — một ô bị từ chối thì cả dòng cuộn lại (dòng nằm lại nháp ở web), dòng khác vẫn lưu.
 *  · Nhật ký từng ô mang nguồn "Dán từ Excel · lớp"; một lần dán (nhiều request cùng `loId`) = MỘT mục tổng ở request cuối (`cuoi`), gắn lớp;
 *    Hoàn tác (`hoanTac`) ghi mục riêng.
 */
export function luuDiemLo(p: Principal, body: any) {
  const dong = docLo(body?.dong);
  const classId = body?.classId;
  if (!Number.isInteger(classId) || classId <= 0) throw badRequest('Lớp không hợp lệ.');
  const ma = body?.luot == null ? null : docMaLuot(String(body.luot));
  if (body?.luot != null && !ma) throw badRequest('Lượt Test không hợp lệ.');
  const loId = typeof body?.loId === 'string' && /^[\w-]{1,40}$/.test(body.loId) ? body.loId : null;
  const truoc: TongTruoc | null = body?.truoc && ['soDong', 'soDaLuu', 'soO'].every((k) => soDem(body.truoc[k])) ? body.truoc : null;
  const hoanTac = body?.hoanTac === true;

  /* Một câu: lớp + lượt của mọi dòng (câu duy nhất thêm vào các câu của `saveScore`). */
  const ids = [...new Set(dong.map((d) => d.attemptId))];
  const hang = db().prepare(`SELECT a.id, a.class_id, a.kind, a.attempt_no, c.code FROM assessment_attempts a LEFT JOIN classes c ON c.id = a.class_id
    WHERE a.id IN (${ids.map(() => '?').join(',')})`).all(...ids) as { id: number; class_id: number | null; kind: string; attempt_no: number; code: string | null }[];
  const dungLuot = (h: (typeof hang)[number]) => !ma
    || (ma.loai === 'mt' ? h.kind === 'mock' && h.attempt_no === ma.so
      : ma.loai === 'cp' ? h.kind === 'checkpoint' && h.attempt_no === ma.so
        : h.kind === ma.kind);
  if (hang.length !== ids.length || hang.some((h) => h.class_id !== classId || !dungLuot(h))) {
    throw badRequest('Có dòng không thuộc lớp / lượt đang mở — tải lại bảng rồi dán lại.');
  }
  const lop = hang[0].code ?? '';
  const nguon = `${hoanTac ? 'Hoàn tác dán Excel' : 'Dán từ Excel'} · ${lop}`;

  const ket: KetQuaDong[] = dong.map((d) => {
    let skill: string | null = null;
    try {
      voiNguon(nguon, () => tx(() => {
        for (const o of d.o) {
          skill = o.skill;
          const { skill: _k, ...patch } = o;
          saveScore(p, d.attemptId, o.skill, patch as any, undefined, { tuNguoiDung: true });
        }
      }));
      return { attemptId: d.attemptId, ok: true as const };
    } catch (e) {
      if (!(e instanceof HttpError)) console.error('[dan-excel] dòng', d.attemptId, e);
      return {
        attemptId: d.attemptId, ok: false as const, skill,
        loi: e instanceof HttpError ? e.message : 'Lỗi máy chủ — dòng này chưa lưu.', status: e instanceof HttpError ? e.status : 500,
      };
    }
  });
  const soDaLuu = ket.filter((k) => k.ok).length;
  const soO = dong.reduce((n, d, i) => n + (ket[i].ok ? d.o.length : 0), 0);
  /* Request cuối của lần dán: một mục tổng (cộng các request trước web gửi kèm), gắn lớp — không dòng nào lưu thì không ghi. */
  const tong = { soDong: (truoc?.soDong ?? 0) + dong.length, soDaLuu: (truoc?.soDaLuu ?? 0) + soDaLuu, soO: (truoc?.soO ?? 0) + soO };
  if (body?.cuoi === true && tong.soDaLuu) {
    writeAudit({
      actorUserId: p.userId, action: hoanTac ? 'score.dan_excel_hoan_tac' : 'score.dan_excel', entityType: 'class', entityId: classId,
      entityLabel: lop || null, after: { ...tong, ...(ma ? { luot: String(body.luot) } : {}), ...(loId ? { loId } : {}) },
    });
  }
  return { dong: ket, soDaLuu, soO };
}
