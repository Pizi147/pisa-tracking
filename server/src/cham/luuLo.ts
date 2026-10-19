import { db, tx } from '../db.ts';
import { DAN_TOI_DA_DONG, ENTRY_SKILLS } from '../../../shared/domain/index.ts';
import { saveScore } from '../fasttrack/attempts.ts';
import { voiNguon, writeAudit } from '../platform/audit.ts';
import type { Principal } from '../permissions.ts';
import { HttpError, badRequest, loi } from '../util.ts';

const TRUONG = ['rawScore', 'band', 'criteria', 'noShow', 'nhanXet', 'nhomNguyenNhan'] as const;
type ODan = { skill: string } & Partial<Record<(typeof TRUONG)[number], unknown>>;
type DongLo = { attemptId: number; o: ODan[] };
export type KetQuaDong = { attemptId: number; ok: true } | { attemptId: number; ok: false; skill: string | null; loi: string; status: number };

/** Kiểm hình dạng lô ở cửa (400 cả lô) — luật từng ô để `saveScore` lo. */
function docLo(v: unknown): DongLo[] {
  if (!Array.isArray(v) || !v.length) throw badRequest('Không có dòng nào để lưu.');
  if (v.length > DAN_TOI_DA_DONG) throw loi(400, 'Mỗi lần lưu tối đa {n} dòng.', { n: DAN_TOI_DA_DONG });
  return v.map((d: any) => {
    if (!d || !Number.isInteger(d.attemptId) || d.attemptId <= 0) throw badRequest('Lượt Test không hợp lệ.');
    if (!Array.isArray(d.o) || d.o.length > ENTRY_SKILLS.length) throw badRequest('Ô điểm của dòng không hợp lệ.');
    const thay = new Set<string>();
    const o = d.o.map((x: any) => {
      if (!x || !(ENTRY_SKILLS as readonly string[]).includes(x.skill) || thay.has(x.skill)) throw badRequest('Kỹ năng không hợp lệ.');
      thay.add(x.skill);
      /* Chỉ nhận đúng các trường của ô (không lý do, không GV chấm, không lịch) — `noShow` chỉ đúng true. */
      const r: ODan = { skill: x.skill };
      for (const k of TRUONG) if (x[k] !== undefined) r[k] = k === 'noShow' ? (x[k] === true ? true : undefined) : x[k];
      return r;
    });
    return { attemptId: d.attemptId, o };
  });
}

/**
 * DÁN TỪ EXCEL — LƯU (OV-15b mục 2, `POST /attempts/scores/lo`). Mỗi dòng (một em) MỘT giao dịch: mọi ô của dòng qua `saveScore`
 * cửa người dùng (`tuNguoiDung`: nhận xét MT bắt buộc, nhóm nguyên nhân, band tự tính) với đúng quyền từng ô — một ô bị từ chối thì
 * cả dòng cuộn lại (dòng nằm lại nháp ở web), dòng khác vẫn lưu. Nhật ký từng ô mang nguồn "Dán từ Excel" + một mục `score.dan_excel`.
 */
export function luuDiemLo(p: Principal, body: unknown) {
  const dong = docLo(body);
  const lop = dong.length ? (db().prepare(`SELECT DISTINCT c.code FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
    WHERE a.id IN (${dong.map(() => '?').join(',')})`).all(...dong.map((d) => d.attemptId)) as { code: string }[]).map((r) => r.code).join(', ') : '';
  const nguon = lop ? `Dán từ Excel · ${lop}` : 'Dán từ Excel';
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
  if (soDaLuu) {
    writeAudit({
      actorUserId: p.userId, action: 'score.dan_excel', entityType: 'class', entityLabel: lop || null,
      after: { soDong: dong.length, soDaLuu, soO: dong.reduce((n, d, i) => n + (ket[i].ok ? d.o.length : 0), 0) },
    });
  }
  return { dong: ket, soDaLuu };
}
