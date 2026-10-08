/**
 * PR-CT2 (§8).
 * Phần A: Kết quả cũ của PA Tutor kỳ vọng đầu ra (PA có Số buổi) chưa ghi Số buổi tuần này → 1 buổi, để đếm "đã dạy" khớp.
 * Chạy ĐÚNG MỘT LẦN nhờ khoá `demo_config` (khuôn `prQu.ts`): `case_followups` còn đường khác chèn dòng không `so_buoi`, chạy lại sẽ đếm oan.
 * Không đụng Bổ trợ miễn phí. Deploy: chạy SAU `migratePrPa` (điền Số buổi 10 cho PA) — thứ tự trong `migrate.ts` đảm bảo.
 * Phần B: bỏ nộp / duyệt kế hoạch bổ trợ — nhóm PA Bổ trợ Giữa khoá còn chờ kế hoạch (Case chưa đóng, đã có nguyên nhân) chạy ngay; thẻ
 * `ke_hoach_bo_tro` đang chờ tự đóng. Chạy lặp được: lần sau không còn nhóm / thẻ nào → không ghi gì.
 */
import { nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { chayPaBoTro } from '../cases/boTro.ts';
import { chotYeuCau } from '../duyet/yeuCau.ts';

export const KHOA_PR_CT2_DIEN_BUOI = 'pr_ct2_dien_buoi';

export function migratePrCt2(conn: any, applied: string[]) {
  dienBuoiTutor(conn, applied);
  chayBoTroChoKeHoach(conn, applied);
}

function dienBuoiTutor(conn: any, applied: string[]) {
  if (!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'demo_config'").get()) return;
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_CT2_DIEN_BUOI)) return;
  const n = conn.prepare(
    `UPDATE case_followups SET so_buoi = 1
      WHERE so_buoi IS NULL AND intervention_id IN (SELECT id FROM case_interventions WHERE kind = 'tutor' AND so_buoi IS NOT NULL
        AND case_id IN (SELECT id FROM sos_cases WHERE origin_kind = 'chuyen_cap' AND title LIKE 'Kỳ vọng đầu ra%'))`,
  ).run().changes;
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_CT2_DIEN_BUOI, nowIso(), nowIso());
  if (n) applied.push(`PR-CT2: điền Số buổi tuần này = 1 cho ${n} Kết quả cũ của PA Tutor kỳ vọng đầu ra. Một lần.`);
}

function chayBoTroChoKeHoach(conn: any, applied: string[]) {
  /* DB chưa có nhóm bổ trợ / hộp Chờ duyệt (DB rất cũ, DB thử trong bộ kiểm) → không có gì để chạy. */
  if (!conn.prepare("SELECT 1 FROM pragma_table_info('case_interventions') WHERE name = 'nhom_bo_tro'").get()) return;
  if (!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'yeu_cau_duyet'").get()) return;
  const nhom = conn.prepare(
    `SELECT DISTINCT iv.nhom_bo_tro AS nhom FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
      WHERE iv.kind = 'bo_tro' AND iv.status = 'planned' AND iv.nhom_bo_tro IS NOT NULL AND sc.status != 'done'
        AND EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary')`,
  ).all() as { nhom: string }[];
  const the = conn.prepare(`SELECT id, doi_tuong_id FROM yeu_cau_duyet WHERE loai = 'ke_hoach_bo_tro' AND trang_thai = 'cho'`).all() as any[];
  if (!nhom.length && !the.length) return;
  const homNay = demoToday();
  let soPa = 0;
  for (const { nhom: n } of nhom) {
    /* Người chạy = người xin thẻ mới nhất của nhóm; không có thẻ → người ghi nguyên nhân chính (sớm nhất) của nhóm. */
    const nguoi = (conn.prepare(
      `SELECT y.nguoi_xin u FROM yeu_cau_duyet y WHERE y.loai = 'ke_hoach_bo_tro' AND y.doi_tuong_loai = 'nhom_bo_tro'
          AND y.doi_tuong_id = (SELECT MIN(id) FROM case_interventions WHERE nhom_bo_tro = ?) AND y.nguoi_xin IS NOT NULL
        ORDER BY y.id DESC LIMIT 1`,
    ).get(n) as any)?.u ?? (conn.prepare(
      `SELECT ci.created_by u FROM case_issues ci JOIN case_interventions iv ON iv.case_id = ci.case_id
        WHERE iv.nhom_bo_tro = ? AND ci.role = 'primary' AND ci.created_by IS NOT NULL ORDER BY ci.id LIMIT 1`,
    ).get(n) as any)?.u ?? null;
    soPa += chayPaBoTro(conn, n, nguoi, homNay);   // ponytail: ~6 câu mỗi PA, theo từng nhóm; migrate chạy từ CLI trong MỘT tx nên số câu không bị chặn bởi tx — trần 200 câu là trần của MỘT lời gọi HTTP. Số nhóm chờ kế hoạch nhỏ (vài chục); lớn thì gom câu
  }
  let soThe = 0;
  for (const y of the) {
    soThe += chotYeuCau(conn, { loai: 'ke_hoach_bo_tro', doiTuongLoai: 'nhom_bo_tro', doiTuongId: y.doi_tuong_id }, 'tu_dong',
      { lyDo: 'Bỏ bước duyệt kế hoạch — PA bổ trợ đã chạy' });
  }
  if (soPa || soThe) applied.push(`PR-CT2: bỏ duyệt kế hoạch bổ trợ — chạy ${soPa} PA bổ trợ còn chờ, tự đóng ${soThe} thẻ kế hoạch đang chờ.`);
}
