/**
 * KIỂM TRƯỚC LT-SV — CHỈ ĐỌC (không ghi câu nào): lộ trình FT đang "Đã thi · chờ kết quả" CHỈ NHỜ tháng / tuần dự kiến (luật cũ: tháng → ngày cuối tháng,
 * tuần → Chủ nhật). Sau LT-SV các lộ trình này về B "Chưa chốt ngày thi" (việc "Cập nhật kết quả thi thật" của GVCN mất, có việc "Chốt ngày thi" không hạn).
 * Kèm: lộ trình có kết quả mà chưa có ngày thi — hạn Chọn bước tiếp đổi thành ngày có kết quả + 7.
 *
 * Chạy: `npm run kiem-truoc-lt-sv` — file cục bộ: `$env:PISA_DB` = đường dẫn file (không biến Turso); hoặc nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2).
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';
import { demoToday } from '../demoConfig.ts';
import { COT_SAU_THI, LO_TRINH_MOI_NHAT } from '../loTrinh/cotSauThi.ts';
import { addDaysIso, nhanThang, trangThaiSauThi, tuanLich } from '../../../shared/domain/index.ts';

/** Ngày thi theo luật CŨ (trước LT-SV) — chỉ để so. */
const ngayCu = (c: any): string | null => {
  if (c.exam_week) return addDaysIso(String(c.exam_week).slice(0, 10), 6);
  const m = c.exam_month;
  return m && /^\d{4}-\d{2}$/.test(m) ? addDaysIso(`${m}-01`, new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 0)).getUTCDate() - 1) : null;
};

export function loTrinhDoiLtSv(homNay: string) {
  const ds = db().prepare(
    `SELECT c.id, c.student_id, s.full_name AS ten, b.code AS chi_nhanh, ${COT_SAU_THI},
            (SELECT k.code FROM enrollments e JOIN classes k ON k.id = e.class_id WHERE e.student_id = c.student_id ORDER BY e.status = 'active' DESC, e.id DESC LIMIT 1) AS lop
       FROM learning_cycles c JOIN students s ON s.id = c.student_id LEFT JOIN branches b ON b.id = s.branch_id
       LEFT JOIN report_periods ep ON ep.id = c.exam_period_id
      WHERE c.route IS NOT NULL AND c.exam_date IS NULL AND c.thi_that_ngay IS NULL AND (c.exam_month IS NOT NULL OR c.exam_period_id IS NOT NULL)
        AND ${LO_TRINH_MOI_NHAT}
        AND NOT EXISTS (SELECT 1 FROM ban_chup_lo_trinh x WHERE x.cycle_id = c.id AND x.ly_do = 'chuyen_lop' AND x.lan = (SELECT MAX(lan) FROM ban_chup_lo_trinh WHERE cycle_id = c.id))
      ORDER BY b.code, lop, s.full_name`).all() as any[];
  const veB: any[] = []; const doiHan: any[] = [];
  for (const c of ds) {
    const cu = trangThaiSauThi({ ...c, exam_date: ngayCu(c) }, homNay);
    const moi = trangThaiSauThi(c, homNay);
    const duKien = c.exam_week ? tuanLich(c.exam_week, homNay) : c.exam_month ? nhanThang(c.exam_month) : '—';
    if (cu.giaiDoan === 'da_thi_cho_kq' && moi.giaiDoan !== 'da_thi_cho_kq') veB.push({ ...c, duKien, hanCu: cu.han });
    else if (cu.giaiDoan === 'cho_buoc_tiep' && cu.han !== moi.han) doiHan.push({ ...c, duKien, hanCu: cu.han, hanMoi: moi.han });
  }
  return { veB, doiHan };
}

if (process.argv[1] && /kiemTruocLtSv\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-truoc-lt-sv] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  try {
    const homNay = demoToday();
    const { veB, doiHan } = loTrinhDoiLtSv(homNay);
    console.log(`\nHôm nay ${homNay}: ${veB.length} lộ trình đang "Đã thi · chờ kết quả" CHỈ NHỜ tháng / tuần → về "Chưa chốt ngày thi"${veB.length ? ':' : '.'}`);
    for (const c of veB) console.log(`  ${c.chi_nhanh ?? '—'} · ${c.lop ?? '—'} · ${c.ten} · dự kiến ${c.duKien} · hạn cũ ${c.hanCu ?? '—'} (lộ trình ${c.id})`);
    console.log(`\n${doiHan.length} lộ trình có kết quả, chưa có ngày thi → hạn Chọn bước tiếp đổi${doiHan.length ? ':' : '.'}`);
    for (const c of doiHan) console.log(`  ${c.chi_nhanh ?? '—'} · ${c.lop ?? '—'} · ${c.ten} · dự kiến ${c.duKien} · hạn ${c.hanCu ?? '—'} → ${c.hanMoi ?? '—'} (lộ trình ${c.id})`);
  } catch (e) {
    console.error(`[kiem-truoc-lt-sv] ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
