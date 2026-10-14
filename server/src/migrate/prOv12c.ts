/**
 * PR-OV12c (chủ SP 14/10) — CASE SOS THEO LUẬT MỚI. Đổi dữ liệu, chạy lặp không đổi, KHÔNG xoá lịch sử:
 *
 *   A. Case MT đang mở chưa có nguyên nhân: ô (lượt Case đang theo × bài) CÓ nhận xét → ô chưa chọn nhóm thì nhận nhóm "Khác" của kỹ năng, Case nhận
 *      nguyên nhân = nhận xét + nhóm (`dongBoNguyenNhanMt`) → sang "Chờ xác nhận PA". Ô TRỐNG → giữ nguyên (hạn cũ): Công việc tự hiện
 *      "Ghi nhận xét {kỹ năng} · MT{n}"; lưu nhận xét + nhóm xong Case tự sang bước tiếp.
 *   B. Thẻ "Báo lên nguyên nhân" đang chờ của Case MT → đóng (tự đóng, lý do "Đổi luật").
 *   C. Case Progress Test đang mở chưa có nhãn SOS → SOS theo số môn trượt của lượt (`regularResultOf`, tối đa 3). Progress cũ chờ nguyên nhân
 *      tự thành việc "Xác nhận Case" (giữ PA Bổ trợ đã có) — không cần đổi dữ liệu.
 *
 * In số dòng đổi từng phần; lần chạy sau không còn gì khớp.
 */
import { docNhomNguyenNhan, issuesForTopic, laKhac } from '../../../shared/domain/index.ts';
import { chotYeuCau } from '../duyet/yeuCau.ts';
import { dongBoNguyenNhanMt } from '../cases/nguyenNhanO.ts';
import { LA_CASE_MT, LA_CASE_SOS } from '../cases/sosState.ts';
import { regularResultOf } from '../normal/regular.ts';

export const LY_DO_DOI_LUAT = 'Đổi luật';

export function migratePrOv12c(conn: any, applied: string[]): { dienNguyenNhan: number; ghiNhanXet: number; dongThe: number; nhanSos: number } {
  const ra = { dienNguyenNhan: 0, ghiNhanXet: 0, dongThe: 0, nhanSos: 0 };
  if (!(conn.prepare('SELECT name FROM pragma_table_info(?)').all('assessment_scores') as any[]).some((c) => c.name === 'nhom_nguyen_nhan')) return ra;

  /* A. Case MT đang mở, chưa nguyên nhân (kể cả đang có thẻ Không cần theo dõi chờ — nguyên nhân vẫn là nhận xét của bài). */
  const cho = conn.prepare(
    `SELECT sc.id, sc.topic, sc.attempt_id, s.id AS o_id, s.comment, s.nhom_nguyen_nhan FROM sos_cases sc
       LEFT JOIN assessment_scores s ON s.attempt_id = sc.attempt_id AND s.skill = sc.topic
      WHERE sc.status != 'done' AND ${LA_CASE_SOS('sc')} AND ${LA_CASE_MT('sc')}
        AND NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id)`,
  ).all() as any[];
  const dien: number[] = [];
  for (const r of cho) {
    if (!String(r.comment ?? '').trim()) { ra.ghiNhanXet += 1; continue; }
    if (!docNhomNguyenNhan(r.nhom_nguyen_nhan).length) {
      const khac = issuesForTopic(r.topic ?? '').find((i) => laKhac(i.code))?.code;
      if (khac) conn.prepare('UPDATE assessment_scores SET nhom_nguyen_nhan = ? WHERE id = ?').run(JSON.stringify([khac]), r.o_id);
    }
    dien.push(r.id as number);
  }
  if (dien.length) ra.dienNguyenNhan = dongBoNguyenNhanMt({ caseIds: dien });

  /* B. Thẻ Báo lên nguyên nhân đang chờ của Case MT. */
  for (const y of conn.prepare(
    `SELECT y.doi_tuong_id AS id FROM yeu_cau_duyet y JOIN sos_cases sc ON sc.id = y.doi_tuong_id
      WHERE y.loai = 'bao_len_nguyen_nhan' AND y.doi_tuong_loai = 'sos_case' AND y.trang_thai = 'cho' AND ${LA_CASE_MT('sc')}`,
  ).all() as any[]) {
    ra.dongThe += chotYeuCau(conn, { loai: 'bao_len_nguyen_nhan', doiTuongLoai: 'sos_case', doiTuongId: y.id }, 'tu_dong', { lyDo: LY_DO_DOI_LUAT });
  }

  /* C. Nhãn SOS của Case Progress Test đang mở = số môn trượt của lượt (1 → SOS 1, 2 → SOS 2, ≥ 3 → SOS 3) — cùng hàm kết luận lượt (`regularResultOf`). */
  for (const c of conn.prepare(
    `SELECT sc.id, sc.attempt_id FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE sc.status != 'done' AND sc.kck = 0 AND sc.sos_level IS NULL AND sc.origin_kind = 'mock' AND a.kind = 'progress'`,
  ).all() as any[]) {
    const muc = regularResultOf(c.attempt_id).sosLevel;
    if (muc) ra.nhanSos += conn.prepare('UPDATE sos_cases SET sos_level = ? WHERE id = ?').run(muc, c.id).changes as number;
  }

  if (ra.dienNguyenNhan || ra.dongThe || ra.nhanSos) {
    applied.push(`PR-OV12c: Case SOS theo luật mới — ${ra.dienNguyenNhan} Case MT nhận nguyên nhân từ nhận xét (→ Chờ xác nhận PA) · `
      + `${ra.ghiNhanXet} Case MT bài chưa nhận xét (việc "Ghi nhận xét", giữ hạn) · ${ra.dongThe} thẻ "Báo lên nguyên nhân" đóng (Đổi luật) · `
      + `${ra.nhanSos} Case Progress Test nhận nhãn SOS.`);
  }
  return ra;
}
