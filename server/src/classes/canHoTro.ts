/**
 * CẦN HỖ TRỢ CỦA MỘT LỚP (PR-HVL, M4, T19, K2-36/37/42) — `GET /classes/:id/can-ho-tro`. Nằm ở: Học viên & Lớp → Hồ sơ lớp → tab Học viên →
 * nút chế độ `Điểm | Cần hỗ trợ`. Mỗi em có Case mở một KHỐI; web xếp Case vào hàng theo kỹ năng bằng `hangCanHoTro` (shared).
 *
 * Case lấy qua `listCases(p, { classId })` (đã lọc phạm vi — không đọc `sos_cases` trần) rồi `chiTietCaseMo` (theo lô: số câu SQL cố định,
 * không N+1). Mức SOS gần nhất / lộ trình / target của em KHÔNG đọc lại ở đây: tab Học viên đã tải `/classes/:id/roster` (cần `timeline` cho menu ⋯) —
 * web ghép `standing` + `cycle` từ đó, giữ trần câu SQL của đường này ≤ `/cases?classId=` + 8 (kế hoạch PR-HVL, Global Constraints).
 */
import { ENTRY_SKILLS, PERMISSIONS, nguongMiniTest } from '../../../shared/domain/index.ts';
import { DS_JSON, db, theoLoJson } from '../db.ts';
import { editableSkills, isCoreTeacherOf, can, require_, type Principal } from '../permissions.ts';
import { programmeOfClass } from '../normal/regular.ts';
import { listCases } from '../cases/cases.ts';
import { chiTietCaseMo, type CaseChiTiet, type PaCase } from '../cases/caseLop.ts';

/** XM-K6: kết quả của một PA ở tóm tắt môn lớp thường — lần ghi có kết luận gần nhất, buổi đã dạy / dự kiến, Mini Test (PA Bổ trợ miễn phí `mt:`). */
type KetQuaPa = {
  ketQua: { outcome: string; ngay: string } | null;
  buoi: { da: number; tong: number } | null;
  miniTest: { tyLe: number | null; dat: boolean | null; ngay: string } | null;
};
type PaCanHoTro = PaCase & KetQuaPa;

/**
 * XM-K6: MỘT câu cho mọi PA (không huỷ) của các Case đã đọc — không N+1. Câu con theo `idx_followup_iv`; Mini Test ≤ 1 dòng mỗi PA
 * (UNIQUE em + bài gốc, cùng phép nối `planOutcomes`). `ORDER BY iv.id` giữ thứ tự ổn định.
 */
function ketQuaPaTheoLo(caseIds: number[]): Map<number, KetQuaPa> {
  const out = new Map<number, KetQuaPa>();
  theoLoJson(caseIds, (json) => {
    for (const r of db().prepare(
      `SELECT iv.id, iv.so_buoi,
              (SELECT SUM(f.so_buoi) FROM case_followups f WHERE f.intervention_id = iv.id) AS da_day,
              (SELECT f.outcome || '|' || f.observed_on FROM case_followups f WHERE f.intervention_id = iv.id AND f.outcome IS NOT NULL
                ORDER BY f.observed_on DESC, f.id DESC LIMIT 1) AS kq,
              mt.ty_le, mt.ngay_lam, mt.ngay_du_kien, mt.id AS mt_id, mt.so_buoi AS mt_buoi
         FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN mini_test mt ON mt.nhom_bo_tro = iv.nhom_bo_tro AND mt.student_id = sc.student_id
        WHERE iv.case_id IN (${DS_JSON}) AND iv.status != 'cancelled' ORDER BY iv.id`).all(json) as any[]) {
      const [outcome, ngay] = r.kq ? String(r.kq).split('|') : [];
      const tong = r.so_buoi ?? r.mt_buoi;
      out.set(r.id, {
        ketQua: outcome ? { outcome, ngay } : null,
        buoi: tong ? { da: Number(r.da_day ?? 0), tong } : null,
        miniTest: r.mt_id ? {
          tyLe: r.ty_le ?? null, dat: r.ty_le == null ? null : r.ty_le >= nguongMiniTest(r.ngay_lam),
          ngay: r.ngay_lam ?? r.ngay_du_kien,
        } : null,
      });
    }
  });
  return out;
}

export function canHoTroLop(p: Principal, classId: number) {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const prog = programmeOfClass(classId);
  const boMon = prog?.skills ?? [...ENTRY_SKILLS];
  /* Em ĐANG HỌC lớp này = lớp hiện tại của em (`homeClassId`, ghi danh `active`) — không tính em Tạm dừng (Case rơi về lớp lúc đánh giá). */
  const mo = listCases(p, { classId }).rows.filter((c) => c.status !== 'done' && c.studentId !== null && c.homeClassId === classId);
  const chiTiet = chiTietCaseMo(mo);
  const theoEm = new Map<number, { id: number; ten: string; ma: string; cases: CaseChiTiet[] }>();
  for (const c of mo) {
    const x = chiTiet.get(c.id);
    if (!x) continue;
    const e = theoEm.get(x.studentId) ?? { id: x.studentId, ten: c.studentName ?? '', ma: c.studentCode ?? '', cases: [] };
    e.cases.push(x);
    theoEm.set(x.studentId, e);
  }
  /* FT đọc Kết quả PA theo từng Case khi mở (`/cases/:id`) — chỉ lớp thường (`ratio`) thêm câu này. */
  const kqPa = prog?.scoringMode === 'ratio' ? ketQuaPaTheoLo([...theoEm.values()].flatMap((e) => e.cases.map((c) => c.id))) : new Map<number, KetQuaPa>();
  const em = [...theoEm.values()].map((e) => ({ ...e, cases: e.cases.map((c) => ({
    ...c, pas: c.pas.map((pa): PaCanHoTro => ({ ...pa, ...(kqPa.get(pa.id) ?? { ketQua: null, buoi: null, miniTest: null }) })),
  })) }));
  const tatCa = em.flatMap((e) => e.cases);
  return {
    ct: (prog?.code ?? null) as string | null,
    boMon,
    /** Kỹ năng người xem sửa được ở lớp — công tắc "Chỉ kỹ năng tôi dạy". */
    kyNangToi: editableSkills(p, classId, boMon),
    /** GVBM thuần: không chủ nhiệm, không Quản lý — công tắc bật sẵn khi dạy 1–2 kỹ năng (Q12). */
    laGvbmThuan: !isCoreTeacherOf(p, classId) && !can(p, PERMISSIONS.PLAN_WEEK, { classId }),
    tong: {
      soEm: em.length, soCase: tatCa.length,
      /** K2-42: Case "Chờ Quản lý duyệt · không theo dõi" + PA đang chờ Quản lý duyệt. */
      choDuyet: tatCa.filter((c) => c.trangThai.k === 'cho-duyet-khong-theo-doi').length + tatCa.reduce((n, c) => n + c.pas.filter((x) => x.choDuyet && !x.xong).length, 0),
      quaHan: tatCa.filter((c) => c.quaHan).length,
    },
    em,
  };
}
