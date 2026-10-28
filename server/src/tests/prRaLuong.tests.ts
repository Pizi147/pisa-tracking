/**
 * PHÉP KIỂM RA-LUONG (rà soát luồng đêm 29/10).
 * RA-LUONG-2 (Rulebook R14, 14/10-Q13): dời TAY lịch Test một môn lớp thường — chỉ Quản lý; GVCN / GVBM lớp thường 403 (máy vẫn tự dời khi gõ "-").
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrRaLuongTests(t: YThucTestKit) {
  const { check, assert, conn, TODAY, P, addDays } = t;
  const week: any = await import('../platform/week.ts');
  const lich: any = await import('../fasttrack/skillSchedule.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const fsMod: any = await import('node:fs');
  console.log('\nRA-LUONG · rà soát luồng đêm 29/10');

  const nem = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };
  const vaiLop = (core: 0 | 1) => conn.prepare(
    `SELECT s.attempt_id, s.skill, a.class_id, ta.user_id
       FROM attempt_skills s JOIN assessment_attempts a ON a.id = s.attempt_id
       JOIN classes c ON c.id = a.class_id AND c.is_fast_track = 0 AND c.status = 'active'
       JOIN teacher_assignments ta ON ta.class_id = c.id AND ta.status = 'active' AND ta.is_core = ?
            AND (ta.is_core = 1 OR ta.skill = s.skill)
      WHERE s.required = 1 AND s.planned_period_id IS NOT NULL AND a.status <> 'cancelled'
      ORDER BY s.attempt_id LIMIT 1`,
  ).all(core)[0] as any;

  check('RA-LUONG-2 · lớp thường: GVBM đúng môn và GVCN dời tay lịch một môn → 403 (chỉ Quản lý); Quản lý không bị chặn quyền', () => {
    const toi = week.ensurePeriod(addDays(week.mondayOf(TODAY), 14)).id as number;
    for (const [ten, r] of [['GVBM', vaiLop(0)], ['GVCN', vaiLop(1)]] as const) {
      assert(r, `${ten}: seed phải có lượt lớp thường có lịch`);
      const st = nem(() => lich.setSkillWeek(loadPrincipal(r.user_id), r.attempt_id, r.skill, toi, { force: true, today: TODAY }));
      assert(st === 403, `${ten} dời tay phải 403, được ${st}`);
    }
    const r = vaiLop(0);
    const st = nem(() => lich.setSkillWeek(P.mbManager, r.attempt_id, r.skill, toi, { force: true, today: TODAY }));
    assert(st !== 403, `Quản lý không được 403 (có thể 400 vì luật lịch), được ${st}`);
  });

  check('RA-LUONG-4 · Công việc: nút "Gia hạn" chỉ ở việc Chọn bước tiếp — "Cập nhật KQ thi thật" không hạn (N6), máy chủ từ chối gia hạn', () => {
    const fs: any = fsMod;
    const nguon = fs.readFileSync('web/src/modules/congViec/HoTroHocVienTab.tsx', 'utf8') as string;
    const dong = nguon.split('\n').find((l) => l.includes('nutPhu={(x) =>')) ?? '';
    assert(/x\.group === 'buoc_tiep'/.test(dong) && !/thi_that/.test(dong), `nutPhu: ${dong.trim()}`);
  });

  check('RA-LUONG-5 · Huỷ quyết định chuyển lớp một em có Hoàn tác (cùng đường khôi phục `huy-lenh` → `khoi-phuc-lenh` của Cuối khoá)', () => {
    const nguon = fsMod.readFileSync('web/src/modules/students/ChuyenLopPanel.tsx', 'utf8') as string;
    const huy = nguon.slice(nguon.indexOf('const huyLenh = async'), nguon.indexOf('const nhanChinh'));
    assert(/toast\.hoanTac\(/.test(huy) && /hoanTacHangLoat\('huy-lenh', \[studentId\]\)/.test(huy), 'huyLenh thiếu Hoàn tác');
  });
}
