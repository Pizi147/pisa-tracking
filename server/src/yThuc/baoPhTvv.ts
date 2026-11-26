/**
 * SV-YT-TVV (luật 1–2, Q-D1 ①, Q-D3 ①; chủ SP 21–22/10) — việc "Báo PH · {bậc} · {em}" của TVV sau MỖI lần lưu xử lý vi phạm.
 *
 *  · Sinh NGAY khi lưu (`luuXuLy` — một em / lô; `guiDeXuat` — lần chờ QL duyệt), mọi bậc. Hạn = ngày lưu (giờ VN) + 4 (`hanBaoPh`).
 *  · Người giữ suy khi đọc: TVV của em (`students.consultant_user_id`), không có → QL chi nhánh của em. Đổi TVV: việc theo người mới, hạn giữ.
 *  · Ghi kết quả: "Đã báo PH" (xong) / "Chưa liên hệ được" (một lần thử — việc vẫn mở, hạn giữ) + ngày (≤ hôm nay) + ghi chú; MỖI lần một dòng
 *    `viec_bao_ph_lan`. Trạng thái = lần ghi mới nhất (ghi "Chưa liên hệ được" sau "Đã báo PH" = sửa nhầm, mở lại).
 *  · Kết thúc ngoại lệ = Bỏ việc với lý do bỏ sẵn có (`COORDINATION_USER_REMOVE_REASONS`).
 *  · Xử lý bị thu hồi (được duyệt) / QL từ chối / GVCN rút: việc chưa xong → "Đã bỏ" kèm lý do hệ thống; việc đã xong giữ + nhãn + chuông để biết.
 * Quyền ghi kiểm ở MÁY CHỦ: TVV của em / TVV cùng chi nhánh làm thay (chủ SP 22/10), hoặc QL / Quản trị trong phạm vi em. GV / GVCN / CX không ghi.
 */
import { DS_JSON, db, docNho, tx } from '../db.ts';
import {
  COORDINATION_REMOVE_REASON_LABEL, COORDINATION_USER_REMOVE_REASONS, KET_QUA_BAO_PH, PERMISSIONS,
  GHI_CHU_MEETING_TOI_THIEU, VIEC_TVV_BAO_PH, buocTvvViec, laMeetingCx, laViecTvvBaoPh, tenViec, quaHanBaoPh, VIOLATION_CATEGORY_LABEL, duongHoSoHocVien, hanBaoPh, hanBaoPhHieuLuc, nhanLoaiXuLy, reasonNeedsText, tachTenMoTa, type KetQuaBaoPh,
} from '../../../shared/domain/index.ts';
import { boVaiBpxl, can, coQuyenBuocTiep, laTvvCuaEm, loadPrincipal, scopeFor, type Principal } from '../permissions.ts';
import { badRequest, chuTuDo, conflict, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { GhiDao, daoDuoc, daoLai, luuGhiDao, timGhiDao } from '../platform/ghiDao.ts';
import { demoToday } from '../demoConfig.ts';
import { notify, quanLyCuaChiNhanh, writeAudit } from '../platform/audit.ts';
import { HV_DANG_HOC_SQL, LUOT_SAU_THI_SQL, SU_KIEN_TAM_DUNG_SQL, khoangTamDung, khoangTuSuKien } from '../students/tamDung.ts';
import type { WorkItem } from '../worklist/mywork.ts';
import { laLeadTvv, tvvHieuLuc } from '../worklist/viecTvv.ts';
import { conVaiO, headCua, nguoiNhanTuDong } from '../worklist/nguoiNhan.ts';
import { VAI_LEAD_TVV } from '../../../shared/domain/index.ts';
import { canManageDiscipline, gvcnCuaEm } from './access.ts';
import { HOAT_DONG_O, NGUOI_VAI, VAI_THEO_DOI_BAO_PH, baoTheoDoi, conHieuLuc, donViec, laNguoiGiao, laNguoiTheoDoi, themTheoDoiDong, theoDoiVaiBaoPh } from '../worklist/giaoViec.ts';
import { banChupBaoPh, noiDungNguonTvv } from './phoiHop.ts';
import { CN_EM } from '../worklist/hieuLuc.ts';
import { coTheTraLai, dongTheoDuongSanCo, traLaiDangMo } from './traLai.ts';

/** A3-09 (AUDIT-2111): ngày giờ họp đã xếp của Meeting CX/GĐCN (phần Xếp lịch họp đã xong) — dòng Báo PH · Meeting của TVV ghi như dòng của CX.
    Câu con theo chỉ mục duy nhất `uq_meeting_phan (phoi_hop_id, phan)`: ≤ 1 dòng, chỉ dòng có `phoi_hop_id`. */
export const HOP_MEETING_SQL = (v: string) => `(SELECT y.ngay_gio FROM meeting_phan y WHERE y.phoi_hop_id = ${v}.phoi_hop_id AND y.phan = 'xep_lich' AND y.trang_thai = 'xong')`;
export const chuHop = (h: string | null | undefined): string | null => (h ? `họp ${h.slice(8, 10)}/${h.slice(5, 7)}${h.slice(10)}` : null);

export const NHAN_KET_QUA_BAO_PH: Record<KetQuaBaoPh, string> = { da_bao: 'Đã báo PH', chua_lien_he: 'Chưa liên hệ được' };
/** TL-1 (N61): việc đang có yêu cầu trả lại mở (`tra_lai_id`) — hạn tạm dừng, không quá hạn ở mọi nơi. */
export const CHO_GV_SUA = 'Chờ GV sửa';
/** Lý do hệ thống đóng việc theo lần xử lý (Q-D1 ①). */
export const LY_DO_HE_THONG = { system_thu_hoi: 'Xử lý đã thu hồi', system_tu_choi: 'Head từ chối xử lý', system_rut: 'Đề xuất đã rút', system_huy_thu_hoi: 'Head huỷ thu hồi',
  system_meeting_mo_lai: 'GVCN đưa Meeting về Cần xử lý', system_rut_tinh_hinh: 'GV đã rút', system_luu_tru: 'Học viên vào Lưu trữ',
  /* BAOPH-0 (N72 ⑤): nguồn việc TVV gỡ theo điểm (sửa điểm hết trượt / mức SOS đổi) · C8: việc Báo PH Meeting cũ gộp vào việc Trao đổi gia đình cùng lượt. */
  system_nguon_go: 'Nguồn việc đã gỡ theo điểm', system_gop_trao_doi: 'Gộp vào Trao đổi gia đình', system_sau_thi: 'Lộ trình đã có KQ thi thật' } as const;
/** PHOI-HOP-V2: việc TVV sau Meeting CX đóng vì GVCN đưa Meeting về Cần xử lý / bỏ — xác nhận lại thì mở lại (`phoiHop.ts dongBoViecTvv`). */
export const LY_DO_MEETING_MO_LAI = 'system_meeting_mo_lai';
type LyDoHeThong = keyof typeof LY_DO_HE_THONG;
const nhanLyDo = (code: string | null): string | null =>
  code ? (LY_DO_HE_THONG as Record<string, string>)[code] ?? (COORDINATION_REMOVE_REASON_LABEL as Record<string, string>)[code] ?? code : null;

/** Tên bậc của việc — đọc từ lần xử lý (rà #516: loại đổi thì tên theo); lần xử lý đã xoá (rút) → tên lưu lúc sinh việc. YT-BAO-PH: việc báo lại → "{bậc} đã thu hồi". */
const nhanViec = (r: { nhan: string; m_kind?: string | null; m_custom?: string | null; bao_lai_cua?: number | null }): string =>
  (r.m_kind ? `${nhanLoaiXuLy(r.m_kind, r.m_custom ?? null)}${r.bao_lai_cua ? ' đã thu hồi' : ''}` : r.nhan);

/** Chi nhánh của em = lớp đang học, không có thì chi nhánh hồ sơ. */
export const CHI_NHANH_EM = `COALESCE((SELECT c.branch_id FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = s.id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1), s.branch_id)`;

/** Người giữ việc của một em: TVV → Lead TVV chốt lúc sinh (`nguoi_luat`, còn vai ở CN em — VAI-0 N76b) → MỘT Head (N74) — cùng nguồn với Công việc / panel / Tuyến. */
export function nguoiGiuBaoPh(studentId: number, nguoiLuat?: number | null): number[] {
  const s = db().prepare(`SELECT s.consultant_user_id AS tvv, ${CHI_NHANH_EM} AS branch_id FROM students s WHERE s.id = ?`).get(studentId) as any;
  if (!s) return [];
  if (s.tvv) return [s.tvv as number];
  if (conVaiO(nguoiLuat, VAI_LEAD_TVV, s.branch_id)) return [nguoiLuat!];
  const h = s.branch_id ? headCua(s.branch_id) : null;
  return h ? [h] : [];
}

/**
 * VAI-0 (N76b, N74): TRONG tx — việc Báo PH vừa sinh của em CHƯA có TVV → chốt MỘT Lead TVV gán chi nhánh em (ít việc mở nhất) vào `nguoi_luat`. Không có Lead TVV → NULL
 * (Head giữ). Việc sinh trước khi có Lead TVV giữ ở Head (không nhảy). Em được gán TVV sau → việc về TVV (đọc).
 */
export function chotLeadBaoPh(ids: readonly number[]): void {
  if (!ids.length) return;
  for (const r of db().prepare(`SELECT v.id, ${CHI_NHANH_EM} AS cn FROM viec_bao_ph v JOIN students s ON s.id = v.student_id
      WHERE v.id IN (${DS_JSON}) AND v.nguoi_luat IS NULL AND s.consultant_user_id IS NULL`).all(JSON.stringify(ids)) as { id: number; cn: number | null }[]) {
    const u = nguoiNhanTuDong(VAI_LEAD_TVV, r.cn);
    if (u) db().prepare('UPDATE viec_bao_ph SET nguoi_luat = ? WHERE id = ?').run(u, r.id);
  }
}

/** TRONG tx của lần lưu: một việc cho lần xử lý (UNIQUE measure_id — gửi lại cùng khoá không sinh việc thứ hai). */
export function sinhViecBaoPh(m: { id: number; studentId: number; kind: string; customName?: string | null }, homNay: string): void {
  const nhan = nhanLoaiXuLy(m.kind, m.customName ?? null);
  const han = hanBaoPh(homNay);
  /* Chuông (CHUONG-V2): việc Báo PH của người giữ HIỆN TẠI đọc từ `/my-work` (`bao_ph_yt`) — đổi TVV thì chuông sang người mới. */
  db().prepare(
    /* TL-1 (rà #1927 (5)): vi phạm của lần này đã bị trả lại (yêu cầu còn mở) → việc sinh ra đã "Chờ GV sửa" — trong CÙNG câu (0 câu thêm mỗi em). */
    `INSERT INTO viec_bao_ph (measure_id, student_id, nhan, han, trang_thai, tao_luc, tra_lai_id) VALUES (?1, ?2, ?3, ?4, 'mo', ?5,
       (SELECT t.id FROM vi_pham_tra_lai t WHERE t.trang_thai = 'mo' AND (t.measure_id = ?1
          OR t.violation_id IN (SELECT mv.violation_id FROM measure_violations mv WHERE mv.measure_id = ?1)) ORDER BY t.id DESC LIMIT 1))
     ON CONFLICT(measure_id) DO NOTHING`,
  ).run(m.id, m.studentId, nhan, han, nowIso());
  chotLeadBaoPh([(db().prepare('SELECT id FROM viec_bao_ph WHERE measure_id = ?').get(m.id) as { id: number }).id]);   // VAI-0 (N76b)
  /* GV-1 (N58): người theo dõi mặc định của Báo PH vi phạm — GVCN lớp em + GV đã ghi vi phạm (nhận tin "Cập nhật" khi có kết quả; thay tin riêng N41). */
  /* MỘT câu (lô xác nhận xử lý: +1 câu / em): GVCN đang hiệu lực của lớp em đang học (nguồn `gvcn` — đổi GVCN thì chuyển theo) + người ghi các vi phạm
     (`gv_ghi` — giữ); GVCN cũng là người ghi → một dòng `gvcn`. Chỉ người còn hoạt động + còn vai ở chi nhánh của em.
     TD-HEAD-CX (chủ SP 21/11): + Head chi nhánh em (`head`) + CX chi nhánh em / toàn hệ thống (`cx`) — trừ người theo luật (`VAI_THEO_DOI_BAO_PH`); đổi vai / đổi
     chi nhánh chuyển theo (`theoDoiVaiBaoPh`). Một người nhiều nguồn → nguồn bền nhất (gvcn > gv_ghi > head > cx: hạng ở chữ đầu, MIN rồi bỏ chữ đầu). Vẫn MỘT câu. */
  db().prepare(
    `INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc)
     SELECT 'bao_ph', v.id, n.uid, substr(MIN(n.nguon), 2), NULL, ?1 FROM viec_bao_ph v JOIN students s ON s.id = v.student_id JOIN (
       SELECT x.reported_by AS uid, '2gv_ghi' AS nguon FROM measure_violations mv JOIN violations x ON x.id = mv.violation_id WHERE mv.measure_id = ?2
       UNION ALL SELECT ta.user_id, '1gvcn' FROM teacher_assignments ta WHERE ta.class_id = (SELECT e.class_id FROM enrollments e WHERE e.student_id = ?3 AND e.status = 'active' ORDER BY e.id DESC LIMIT 1)
         AND ta.is_core = 1 AND ta.status = 'active' AND ta.effective_from <= ?4 AND (ta.effective_to IS NULL OR ta.effective_to >= ?4)
       UNION ALL SELECT ur.user_id, CASE r.key WHEN 'manager' THEN '3head' ELSE '4cx' END FROM viec_bao_ph v2 JOIN students s2 ON s2.id = v2.student_id, ${NGUOI_VAI}
         WHERE v2.measure_id = ?2 AND ${VAI_THEO_DOI_BAO_PH('v2', 's2')}
     ) n WHERE v.measure_id = ?2 AND n.uid IS NOT NULL AND ${HOAT_DONG_O('n.uid', CHI_NHANH_EM)}
     GROUP BY n.uid
     ON CONFLICT(loai, ref_id, user_id) DO NOTHING`,
  ).run(nowIso(), m.id, m.studentId, homNay);
}

/**
 * TRONG tx: lần xử lý bị thu hồi (được duyệt) / QL từ chối / GVCN rút → việc chưa xong "Đã bỏ" kèm lý do; việc đã xong giữ + chuông để biết.
 * Rút xoá lần xử lý → gỡ `measure_id` (việc + lịch sử giữ, `nhan` còn tên bậc).
 */
export function dongViecTheoXuLy(measureId: number, lyDo: LyDoHeThong, chu: string | null, boi: number | null, o: { baoLai?: boolean } = {}): void {
  const v = db().prepare(`SELECT v.*, s.full_name, m.kind AS m_kind, m.custom_name AS m_custom FROM viec_bao_ph v JOIN students s ON s.id = v.student_id
    LEFT JOIN discipline_measures m ON m.id = v.measure_id WHERE v.measure_id = ?`).get(measureId) as any;
  if (!v) return;
  v.nhan = nhanViec(v);
  if (v.trang_thai === 'mo') {
    db().prepare(`UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = ?, bo_ly_do_chu = ?, bo_boi = ?, bo_luc = ? WHERE id = ? AND trang_thai = 'mo'`)
      .run(lyDo, chu?.slice(0, 2000) ?? null, boi, nowIso(), v.id);
  } else if (v.trang_thai === 'xong' && lyDo === 'system_thu_hoi' && o.baoLai) {
    /* YT-BAO-PH ([XM 1], chủ SP 11/11): PH đã nghe biện pháp nay thu hồi → việc "Báo lại PH" cho TVV (cùng loại việc, cùng hạn 5 ngày); chuông theo việc. */
    const bl = Number(db().prepare(`INSERT INTO viec_bao_ph (measure_id, bao_lai_cua, student_id, nhan, han, trang_thai, tao_luc) VALUES (NULL, ?, ?, ?, ?, 'mo', ?)`)
      .run(measureId, v.student_id, `${v.nhan} đã thu hồi`, hanBaoPh(demoToday()), nowIso()).lastInsertRowid);
    chotLeadBaoPh([bl]);   // VAI-0 (N76b)
    /* BAOPH-0 (N72 ⑤): theo dõi mặc định Báo lại PH — GVCN lớp em (người tạo lần xử lý) + người chốt thu hồi + Head + CX. */
    const g = gvcnCuaEm(v.student_id, demoToday());
    themTheoDoiDong('bao_ph', bl, [g.gvcn], 'gvcn', null, g.branchId ?? null);
    themTheoDoiDong('bao_ph', bl, [boi], 'tay', boi, g.branchId ?? null);
    theoDoiVaiBaoPh({ studentIds: [v.student_id] });
  } else if (v.trang_thai === 'xong') {
    for (const uid of nguoiGiuBaoPh(v.student_id, v.nguoi_luat)) {
      notify({ userId: uid, kind: 'discipline_de_biet', title: `${LY_DO_HE_THONG[lyDo]} · Báo PH · ${v.nhan} · ${v.full_name} · để biết`, body: chu?.slice(0, 120) ?? null,
        entityType: 'discipline_measure', entityId: lyDo === 'system_rut' ? null : measureId, dedupKey: `bao-ph-dong:${v.id}`,
        duong: duongHoSoHocVien(v.student_id, { tab: 'y-thuc' }) });
    }
  }
  if (lyDo === 'system_rut') db().prepare('UPDATE viec_bao_ph SET measure_id = NULL WHERE id = ?').run(v.id);
}

/** TRONG tx: QL huỷ quyết định thu hồi (trong ngày) → việc hệ thống đã bỏ vì thu hồi mở lại, hạn giữ. */
export function moLaiViecTheoXuLy(measureId: number): void {
  db().prepare(`UPDATE viec_bao_ph SET trang_thai = 'mo', bo_ly_do = NULL, bo_ly_do_chu = NULL, bo_boi = NULL, bo_luc = NULL
                 WHERE measure_id = ? AND trang_thai = 'bo' AND bo_ly_do = 'system_thu_hoi'`).run(measureId);
  /* YT-BAO-PH: việc "Báo lại PH" chưa ghi lần nào → gỡ hẳn (như chưa từng có); đã ghi → giữ lịch sử, "Đã bỏ" kèm lý do. */
  const xoa = (db().prepare(`SELECT id FROM viec_bao_ph WHERE bao_lai_cua = ? AND NOT EXISTS (SELECT 1 FROM viec_bao_ph_lan l WHERE l.viec_id = viec_bao_ph.id)`).all(measureId) as any[]).map((r) => r.id as number);
  donViec('bao_ph', xoa);   // GV-1: id được dùng lại — dọn người theo dõi / lịch sử của việc bị gỡ
  if (xoa.length) db().prepare(`DELETE FROM viec_bao_ph WHERE id IN (${DS_JSON})`).run(JSON.stringify(xoa));
  db().prepare(`UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = 'system_huy_thu_hoi', bo_luc = ? WHERE bao_lai_cua = ? AND trang_thai = 'mo'`).run(nowIso(), measureId);
}

/** Dòng lịch sử máy ghi cho Meeting CX/GĐCN có PH dự — khoá riêng để "Chưa thực hiện" gỡ đúng dòng này. */
const khoaMeeting = (measureId: number) => `meeting-ph-du:${measureId}`;

/**
 * TRONG tx (YT-BAO-PH, [XM 1] chủ SP 11/11): GVCN ghi "Đã thực hiện" Meeting CX/GĐCN có PH dự → việc Báo PH của lần đó tự xong — PH đã nghe ở cuộc họp.
 * Một dòng `viec_bao_ph_lan` (Đã báo PH · ngày họp · người ghi = GVCN) để GV / TVV đọc được vì sao xong. Việc đã xong / đã bỏ: không đụng.
 */
export function xongBaoPhViMeeting(measureId: number, ngay: string, ghiChu: string, boi: number): void {
  const v = db().prepare(`SELECT id, trang_thai FROM viec_bao_ph WHERE measure_id = ?`).get(measureId) as { id: number; trang_thai: string } | undefined;
  if (!v || v.trang_thai !== 'mo') return;
  db().prepare('INSERT INTO viec_bao_ph_lan (viec_id, ket_qua, ngay, ghi_chu, ghi_boi, ghi_luc, khoa) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(khoa) DO NOTHING')
    .run(v.id, 'da_bao', ngay, ghiChu.slice(0, 2000), boi, nowIso(), khoaMeeting(measureId));
  db().prepare(`UPDATE viec_bao_ph SET trang_thai = 'xong' WHERE id = ?`).run(v.id);
}

/** TRONG tx: "Chưa thực hiện" (bấm nhầm Đã thực hiện) → gỡ dòng máy ghi; việc về theo lần ghi còn lại (không còn → mở). */
export function moLaiBaoPhMeeting(measureId: number): void {
  const v = db().prepare(`SELECT id FROM viec_bao_ph WHERE measure_id = ?`).get(measureId) as { id: number } | undefined;
  if (!v) return;
  if (!db().prepare('DELETE FROM viec_bao_ph_lan WHERE viec_id = ? AND khoa = ?').run(v.id, khoaMeeting(measureId)).changes) return;
  const cuoi = db().prepare('SELECT ket_qua FROM viec_bao_ph_lan WHERE viec_id = ? ORDER BY id DESC LIMIT 1').get(v.id) as { ket_qua: string } | undefined;
  db().prepare(`UPDATE viec_bao_ph SET trang_thai = ? WHERE id = ? AND trang_thai != 'bo'`).run(cuoi?.ket_qua === 'da_bao' ? 'xong' : 'mo', v.id);
}

// ---------------------------------------------------------------- BAOPH-0 (N72 ⑤): việc TVV từ nguồn Phối hợp (Trao đổi gia đình · kết quả Progress / Final)

/** Tên việc TVV theo nguồn — `aKind` = loại bài của lượt (Báo PH kết quả Test: Progress / Final). */
const nhanViecTvvNguon = (kind: string, pb: number | null, aKind: string | null): string =>
  kind === 'bao_ph_tvv' ? `Kết quả ${aKind === 'final' ? 'Final' : 'Progress'}` : tenViec(kind, pb);

/**
 * TRONG tx — đồng bộ dòng nguồn (`VIEC_TVV_BAO_PH`) của các lượt với việc TVV (`viec_bao_ph.phoi_hop_id`), MỘT câu đọc; chạy lặp không đổi gì:
 *  · nguồn Cần xử lý, chưa có việc → sinh việc (hạn N2 từ hôm nay) + theo dõi mặc định: Head + CX (`theoDoiVaiBaoPh`) + người tạo (GVCN lớp em; `nguoiTao` — người chốt Final);
 *  · nguồn Cần xử lý, việc đã đóng vì nguồn gỡ → mở lại, hạn mới · nguồn do HỆ THỐNG bỏ (điểm sửa, mức SOS đổi) → việc còn mở "Đã bỏ" lý do hệ thống.
 * Nguồn người dùng bỏ / xong / Lưu trữ: việc đã theo cùng lúc (`nguonTheoViecTvv`, `dongViecLuuTru`) — không đụng.
 */
/** Lý do đóng việc TVV vì nguồn bị HỆ THỐNG gỡ (điểm sửa / mức SOS · huỷ lượt · Lộ trình mới / chốt Cuối khoá) — nguồn hồi thì việc mở lại. */
const NGUON_GO = new Set(['system_nguon_go', 'system_luot_huy', 'system_ket_thuc_lo_trinh', 'system_sau_thi']);
/** N46: việc TVV của các lộ trình vừa có / gỡ KQ thi thật — đóng / mở lại theo `dongBoViecTvvLuot`. TRONG tx; hai câu. */
export function dongBoViecTvvLoTrinh(cycleIds: readonly number[]): void {
  if (!cycleIds.length) return;
  dongBoViecTvvLuot((db().prepare(`SELECT DISTINCT x.attempt_id AS id FROM sos_coordination_actions x JOIN assessment_attempts a ON a.id = x.attempt_id
      WHERE a.cycle_id IN (SELECT value FROM json_each(?)) AND x.kind IN (SELECT value FROM json_each(?))`).all(JSON.stringify(cycleIds), JSON.stringify(VIEC_TVV_BAO_PH)) as any[]).map((r) => r.id as number));
}
export function dongBoViecTvvLuot(attemptIds: readonly number[], nguoiTao: number | null = null): number[] {
  if (!attemptIds.length) return [];
  const rows = db().prepare(
    `SELECT x.id, x.student_id, x.kind, x.pb_moc, x.status, x.remove_reason_code AS ly_do, a.kind AS a_kind, a.status AS a_tt, v.id AS viec, v.trang_thai, v.bo_ly_do,
            (a.status = 'cancelled' OR ${LUOT_SAU_THI_SQL('a')}) AS ngoai   -- N46 (rà #2233 P1-4): lượt huỷ / lộ trình đã thi thật không sinh việc
       FROM sos_coordination_actions x JOIN assessment_attempts a ON a.id = x.attempt_id LEFT JOIN viec_bao_ph v ON v.phoi_hop_id = x.id
      WHERE x.attempt_id IN (SELECT value FROM json_each(?)) AND x.kind IN (SELECT value FROM json_each(?))`,
  ).all(JSON.stringify(attemptIds), JSON.stringify(VIEC_TVV_BAO_PH)) as any[];
  const homNay = demoToday(), luc = nowIso();
  const moi: { id: number; sid: number }[] = [];
  for (const r of rows) {
    if (r.ngoai) {
      /* N46 (rà #2233 vòng 2 P1-A): lộ trình đã có KQ thi thật / lượt huỷ → việc còn mở ĐÓNG ở gốc (Việc được giao, KPI đọc DB) — KQ thi thật gỡ thì mở lại (nhánh dưới). */
      if (r.trang_thai === 'mo') db().prepare(`UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = ?, bo_boi = NULL, bo_luc = ? WHERE id = ? AND trang_thai = 'mo'`)
        .run(r.a_tt === 'cancelled' ? 'system_luot_huy' : 'system_sau_thi', luc, r.viec);
      continue;
    }
    if (r.status === 'pending' && !r.viec) {
      const k = db().prepare(`INSERT INTO viec_bao_ph (measure_id, phoi_hop_id, student_id, nhan, han, trang_thai, tao_luc) VALUES (NULL, ?, ?, ?, ?, 'mo', ?)`)
        .run(r.id, r.student_id, nhanViecTvvNguon(r.kind, r.pb_moc ?? null, r.a_kind ?? null), hanBaoPh(homNay), luc);
      moi.push({ id: Number(k.lastInsertRowid), sid: r.student_id });
      chotLeadBaoPh([Number(k.lastInsertRowid)]);   // VAI-0 (N76b)
    } else if (r.status === 'pending' && r.trang_thai === 'bo' && NGUON_GO.has(r.bo_ly_do)) {   // rà #2233 P1-1 / P1-2: cả huỷ lượt, kết thúc lộ trình
      db().prepare(`UPDATE viec_bao_ph SET trang_thai = 'mo', bo_ly_do = NULL, bo_ly_do_chu = NULL, bo_boi = NULL, bo_luc = NULL, han = ?, han_chon = NULL WHERE id = ?`).run(hanBaoPh(homNay), r.viec);
    } else if (r.status === 'removed' && r.trang_thai === 'mo' && r.ly_do !== 'system_luu_tru' && !laLyDoNguoiDung(r.ly_do)) {
      db().prepare(`UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = ?, bo_boi = NULL, bo_luc = ? WHERE id = ? AND trang_thai = 'mo'`)
        .run(NGUON_GO.has(r.ly_do) ? r.ly_do : 'system_nguon_go', luc, r.viec);
    }
  }
  if (moi.length) {
    /* Rà #2233 P2-3: theo dõi theo LÔ — GVCN hiệu lực lớp em đang học (nguồn `gvcn`) · người tạo (còn hoạt động ở chi nhánh em) · Head + CX — ba câu cho cả lô. */
    const ids = JSON.stringify(moi.map((m) => m.id));
    db().prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc)
        SELECT 'bao_ph', v.id, g.uid, 'gvcn', NULL, ?2 FROM viec_bao_ph v JOIN (SELECT v2.id AS vid, (SELECT ta.user_id FROM enrollments e JOIN teacher_assignments ta ON ta.class_id = e.class_id
            AND ta.is_core = 1 AND ta.status = 'active' AND ta.effective_from <= ?3 AND (ta.effective_to IS NULL OR ta.effective_to >= ?3)
          WHERE e.student_id = v2.student_id AND e.status = 'active' ORDER BY e.id DESC, ta.id LIMIT 1) AS uid FROM viec_bao_ph v2 WHERE v2.id IN (SELECT value FROM json_each(?1))) g ON g.vid = v.id
        WHERE g.uid IS NOT NULL AND ${HOAT_DONG_O('g.uid', CN_EM('v.student_id'))} ON CONFLICT(loai, ref_id, user_id) DO NOTHING`).run(ids, luc, homNay);   // rà vòng 2 P2 (4): như themTheoDoiDong
    if (nguoiTao) db().prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc) SELECT 'bao_ph', v.id, ?2, 'tay', ?2, ?3 FROM viec_bao_ph v
        WHERE v.id IN (SELECT value FROM json_each(?1)) AND ${HOAT_DONG_O('?2', CN_EM('v.student_id'))}
        ON CONFLICT(loai, ref_id, user_id) DO NOTHING`).run(ids, nguoiTao, luc);
    theoDoiVaiBaoPh({ studentIds: [...new Set(moi.map((m) => m.sid))] });
  }
  return moi.map((m) => m.id);
}

/**
 * TRONG tx: việc TVV của nguồn (`VIEC_TVV_BAO_PH`) đổi trạng thái → dòng nguồn theo — lượt Phối hợp xong / chưa xong, hồ sơ, Xét lại lộ trình đọc NGÀY · NGƯỜI BÁO
 * (TVV thật) · nội dung như trước. Đã báo PH → xong (+ bản chụp 4 nội dung Báo PH kết quả Test) · còn mở → Cần xử lý · người dùng bỏ → bỏ cùng lý do.
 */
export function nguonTheoViecTvv(p: Principal, x: { phoi_hop_id: number | null; ph_kind?: string | null }, sau: 'mo' | 'xong' | 'bo', o: { ngay?: string; ghiChu?: string; lyDo?: string; lyDoChu?: string | null } = {}): void {
  if (x.phoi_hop_id == null || !laViecTvvBaoPh(x.ph_kind ?? '')) return;
  const luc = nowIso();
  if (sau === 'xong') {
    const chup = x.ph_kind === 'bao_ph_tvv' ? banChupBaoPh(p, x.phoi_hop_id, o.ngay!) : null;
    db().prepare(`UPDATE sos_coordination_actions SET status = 'done', performed_on = ?, performed_by = ?, performer_name = NULL, note = ?, noi_dung_luc_bao = ?,
        remove_reason_code = NULL, remove_reason_text = NULL, removed_by = NULL, removed_at = NULL, updated_at = ? WHERE id = ?`)
      .run(o.ngay, p.userId, o.ghiChu?.slice(0, 1000) ?? null, chup ? JSON.stringify(chup) : null, luc, x.phoi_hop_id);
  } else if (sau === 'mo') {
    db().prepare(`UPDATE sos_coordination_actions SET status = 'pending', performed_on = NULL, performed_by = NULL, performer_name = NULL, noi_dung_luc_bao = NULL,
        remove_reason_code = NULL, remove_reason_text = NULL, removed_by = NULL, removed_at = NULL, updated_at = ? WHERE id = ? AND status != 'pending'`).run(luc, x.phoi_hop_id);
  } else {
    db().prepare(`UPDATE sos_coordination_actions SET status = 'removed', remove_reason_code = ?, remove_reason_text = ?, removed_by = ?, removed_at = ?, updated_at = ? WHERE id = ?`)
      .run(o.lyDo, o.lyDoChu ?? null, p.userId, luc, luc, x.phoi_hop_id);
  }
}

/** Dữ liệu mẫu / phép kiểm: việc TVV của một nguồn báo xong — người ghi = TVV của em, không có → Head (người giữ theo luật). */
export function baoXongNguonTvv(actionId: number, ngay: string, ghiChu: string): void {
  const v = db().prepare('SELECT id, student_id, nguoi_luat FROM viec_bao_ph WHERE phoi_hop_id = ?').get(actionId) as { id: number; student_id: number; nguoi_luat: number | null } | undefined;
  if (!v) throw notFound('Nguồn này chưa có việc TVV.');
  ghiKetQuaBaoPh(loadPrincipal(nguoiGiuBaoPh(v.student_id, v.nguoi_luat)[0]), { viecIds: [v.id], ketQua: 'da_bao', ngay, ghiChu });
}

// ---------------------------------------------------------------- quyền + đọc

function loadViec(id: number): any {
  const v = db().prepare(
    `SELECT v.*, s.full_name, s.student_code, s.consultant_user_id, s.parent_name, s.parent_relation, s.parent_phone, m.status AS xu_ly_status, ${CHI_NHANH_EM} AS em_branch,
            m.kind AS m_kind, m.custom_name AS m_custom, m.note AS m_note, m.created_at AS m_luc, m.performed_on AS m_ngay, mu.full_name AS m_nguoi, mc.code AS m_lop,
            ph.note AS ph_note, ph.performed_on AS ph_ngay, COALESCE(ph.performer_name, pu.full_name) AS ph_nguoi, ph.kind AS ph_kind, ph.pb_moc AS ph_pb,
            th.noi_dung AS th_nd, th.tao_luc AS th_luc, th.nguoi_gui AS th_gui, thu.full_name AS th_nguoi, tc.code AS th_lop
       FROM viec_bao_ph v JOIN students s ON s.id = v.student_id LEFT JOIN discipline_measures m ON m.id = COALESCE(v.measure_id, v.bao_lai_cua)
       LEFT JOIN users mu ON mu.id = m.created_by LEFT JOIN classes mc ON mc.id = m.class_id
       LEFT JOIN sos_coordination_actions ph ON ph.id = v.phoi_hop_id LEFT JOIN users pu ON pu.id = ph.performed_by
       LEFT JOIN tinh_hinh_hoc_tap th ON th.id = v.tinh_hinh_id LEFT JOIN users thu ON thu.id = th.nguoi_gui LEFT JOIN classes tc ON tc.id = th.class_id WHERE v.id = ?`,
  ).get(id) as any;
  if (!v) throw notFound('Không tìm thấy việc Báo PH.');
  return { ...v, nhan: nhanViec(v) };
}

/**
 * Ghi được = TVV của em · TVV cùng chi nhánh làm thay (chủ SP 22/10 — như Chọn bước tiếp, `coQuyenBuocTiep`; lịch sử ghi người làm) · QL / Quản trị trong
 * phạm vi em. CX, GV, GVCN: không. Người GIỮ việc (việc của tôi, chuông) vẫn chỉ một: TVV của em / QL khi em chưa có TVV.
 */
export const coTheGhi = (p: Principal, v: { consultant_user_id: number | null; student_id: number; em_branch?: number | null; phoi_hop_id?: number | null; phu_trach_id?: number | null }): boolean =>
  /* GV-1 (N58): người được giao làm được đúng việc này dù vai thường không có quyền. */
  (v.phu_trach_id != null && v.phu_trach_id === p.userId && conHieuLuc(p.userId, v.student_id))
  /* BAOPH-0 (N72 ⑤): mọi nguồn (kể cả Meeting CX) em chưa có TVV → Head — GVCN thôi báo (bỏ nhánh PHOI-HOP-V2 "GVCN báo"). */
  || laTvvCuaEm(p, v) || coQuyenBuocTiep(p, v.student_id) || can(p, PERMISSIONS.REQUEST_APPROVE, { studentId: v.student_id });
/** HAN-BAO-PH (chủ SP 03/11, 17.1): sửa hạn = người ghi được + GVCN lớp em đang học / QL (`discipline.manage`). Tách quyền ghi — GVCN sửa hạn, không ghi kết quả. */
export const coTheSuaHan = (p: Principal, v: { consultant_user_id: number | null; student_id: number; em_branch?: number | null; phoi_hop_id?: number | null; phu_trach_id?: number | null; giao_boi?: number | null }): boolean =>
  coTheGhi(p, v) || canManageDiscipline(p, v.student_id) || laNguoiGiao(p, v);   // GV-1: + người giao (AU-2111 P0-01: còn hoạt động + còn vai)
function requireGhi(p: Principal, v: any): void {
  if (!coTheGhi(p, v)) throw forbidden('Chỉ TVV hoặc Head chi nhánh của em ghi được kết quả báo phụ huynh.');
}
/** Lần xử lý còn hiệu lực (không thu hồi / từ chối / rút). */
export const xuLyCon = (v: any): 'con' | 'thu_hoi' | 'tu_choi' | 'rut' =>
  v.bao_lai_cua != null || v.phoi_hop_id != null || v.tinh_hinh_id != null ? 'con' : v.measure_id == null ? 'rut' : v.xu_ly_status === 'thu_hoi' ? 'thu_hoi' : v.xu_ly_status === 'tu_choi' ? 'tu_choi' : 'con';

export type ViecBaoPhView = {
  id: number; measureId: number | null; studentId: number; ten: string; nhan: string; tieuDe: string;
  /** PHOI-HOP-V2: việc sau Meeting CX/GĐCN (id hành động phối hợp); null = Báo PH ý thức. */
  phoiHopId: number | null;
  /** TINH-HINH: việc "Báo PH · Tình hình học tập" (id `tinh_hinh_hoc_tap`, GV gửi). */
  tinhHinhId: number | null;
  han: string; quaHan: boolean; trangThai: 'mo' | 'xong' | 'bo'; nhanTrangThai: string;
  /** HAN-BAO-PH: hạn mặc định (lưu + 4, Quay lại học) · hạn người dùng chọn (null = mặc định) · sửa được không · mỗi lần đổi hạn. `han` = hạn hiệu lực. */
  hanMacDinh: string; hanChon: string | null; coTheSuaHan: boolean; lichSuHan: LanDoiHan[];
  /** Q-D1 ①: việc đã xong mà lần xử lý không còn → nhãn ("Xử lý đã thu hồi"…). */
  xuLy: 'con' | 'thu_hoi' | 'tu_choi' | 'rut'; nhanXuLy: string | null;
  bo: { lyDo: string; nhan: string | null; chu: string | null; luc: string } | null;
  lan: { ketQua: KetQuaBaoPh; nhan: string; ngay: string; ghiChu: string | null; nguoi: string | null; luc: string }[];
  lienHe: { ten: string | null; quanHe: string | null; sdt: string | null };
  coTheGhi: boolean;
  /** Q-RL2c: việc NGƯỜI DÙNG đã bỏ, người xem có quyền bỏ, lần xử lý còn, chưa ai đổi tiếp → nút "Khôi phục". */
  khoiPhucDuoc: boolean;
  /** UI-CV-TVV (mockup `tvv.html` khối bối cảnh): lần xử lý GVCN đã lưu — người lưu · giờ lưu · lớp · nội dung (vi phạm + ghi chú GVCN). */
  /** G3-13: `ngayLam` = ngày THỰC HIỆN xử lý (ngày nghiệp vụ) — ô ② ghi ngày này, không giờ máy lưu. */
  boiCanh: { nguoiLuu: string | null; luuLuc: string | null; ngayLam?: string | null; lop: string | null; noiDung: string | null;
    /** UI-1 (mockup U10 K5): vi phạm của lần xử lý, mỗi dòng một (ngày · tên) + ghi chú GVCN riêng — panel tách trường. */
    viPham: ViPhamXuLy[]; ghiChu: string | null;
    /** VI-PHAM-MO: lần xử lý nguồn của `ghiChu` (nút Dịch) — null khi ghi chú là của Meeting / tình hình. */
    xuLyId?: number | null };
  /** T22: GVCN đang xin thu hồi lần xử lý (thẻ chờ QL) — TVV chỉ cần biết, lịch sử báo PH giữ. */
  thuHoiCho: { lyDo: string | null } | null;
  /** P1 G3-2: lần xử lý còn CHỜ QL duyệt (đề xuất WL 3, Meeting…) — ô ② "Chờ QL duyệt", hạn QL trả lời; null = đã chốt. Việc vẫn sinh ngay (N1). */
  choQlDuyet: { han: string | null } | null;
  /** TL-1 (N61): "Chờ GV sửa" (hạn tạm dừng) · yêu cầu trả lại đang mở của vi phạm / lần xử lý này · người xem trả lại được (việc còn mở). */
  choGvSua: boolean; traLai: ReturnType<typeof traLaiDangMo>; coTheTraLai: boolean;
};

/** Vi phạm của lần xử lý (ngày tăng dần) — `noiDung` một câu ("Không làm bài tập về nhà (09/09, 10/09)") + danh sách cho panel tách trường. */
/** NHẸ HƠN PR-2b: `nhom` = mã nhóm vi phạm (`violations.category`, đã đọc cùng câu) — panel Báo PH mở dòng hiện "Nhóm". */
type ViPhamXuLy = { id: number; ngay: string; ten: string; moTa: string; skill: string | null; nhom: string; nguoiGhi: string | null; ghiLuc: string | null; daSua: boolean };
function viPhamXuLy(measureId: number | null): ViPhamXuLy[] {
  if (!measureId) return [];
  /* TL-2 (mockup v22 T1 / T6b): người ghi + lúc ghi + "đã sửa" (GV sửa rồi gửi lại) đọc CÙNG câu — panel mở chi tiết vi phạm không cần request thêm. */
  return (db().prepare(
    `SELECT x.id, x.ten, x.description, x.category, x.occurred_on, x.skill, x.created_at, u.full_name AS nguoi_ghi,
        EXISTS (SELECT 1 FROM violation_history h WHERE h.violation_id = x.id AND h.field = 'tra_lai_da_sua') AS da_sua
      FROM measure_violations mv JOIN violations x ON x.id = mv.violation_id LEFT JOIN users u ON u.id = x.reported_by
      WHERE mv.measure_id = ? ORDER BY x.occurred_on, x.id`,
  ).all(measureId) as any[]).map((r) => {
    const tm = tachTenMoTa(r.ten, r.description, r.category);   // VI-PHAM-MO: cùng chữ với các danh sách vi phạm khác; mô tả mở tại chỗ, không request thêm
    return { id: r.id as number, ngay: r.occurred_on as string, ten: tm.ten || ((VIOLATION_CATEGORY_LABEL as Record<string, string>)[r.category] ?? String(r.category)), moTa: tm.moTa, skill: r.skill ?? null, nhom: String(r.category),
      nguoiGhi: r.nguoi_ghi ?? null, ghiLuc: r.created_at ?? null, daSua: !!r.da_sua };
  });
}
function noiDungXuLy(vp: { ngay: string; ten: string }[], note: string | null): string | null {
  const theoTen = new Map<string, string[]>();
  for (const r of vp) theoTen.set(r.ten, [...(theoTen.get(r.ten) ?? []), `${r.ngay.slice(8, 10)}/${r.ngay.slice(5, 7)}`]);
  const cau = [...theoTen].map(([ten, ngay]) => `${ten} (${ngay.join(', ')})`).join('; ');
  return [cau, note?.trim()].filter(Boolean).join('. ') || null;
}

/** Một tên cho trạng thái việc Báo PH — panel (`xemViecBaoPh`) và hàng em ở tab Ý thức lớp (`bangYThucLop`) đọc chung. */
export const nhanTrangThaiBaoPh = (trangThai: string, coLan: boolean): string =>
  trangThai === 'xong' ? 'Đã báo PH' : trangThai === 'bo' ? 'Đã bỏ' : coLan ? 'Chưa liên hệ được' : 'Chưa báo';

export function xemViecBaoPh(p: Principal, id: number): ViecBaoPhView {
  const v = loadViec(id);
  const ghi = coTheGhi(p, v);
  /* GV-1: người theo dõi đọc được panel (chỉ xem — không SĐT phụ huynh, không nút ghi). */
  /* RA-2511 (N63 ⑤): BPXL không xem Ý thức — chỉ đọc khi được giao / theo dõi đúng việc này. */
  if (!ghi && !can(boVaiBpxl(p), PERMISSIONS.STUDENT_VIEW, { studentId: v.student_id }) && !laNguoiTheoDoi('bao_ph', id, p.userId, v.em_branch ?? null)) throw forbidden('Học viên ngoài phạm vi của bạn.');
  const homNay = demoToday();
  const khoang = khoangTamDung([v.student_id])[v.student_id];
  const hanMacDinh = hanBaoPhHieuLuc(v.han, khoang);
  const han = hanBaoPhHieuLuc(v.han, khoang, v.han_chon);
  const lan = (db().prepare(
    `SELECT l.ket_qua, l.ngay, l.ghi_chu, l.ghi_luc, u.full_name FROM viec_bao_ph_lan l LEFT JOIN users u ON u.id = l.ghi_boi WHERE l.viec_id = ? ORDER BY l.id`,
  ).all(id) as any[]).map((l) => ({ ketQua: l.ket_qua, nhan: NHAN_KET_QUA_BAO_PH[l.ket_qua as KetQuaBaoPh] ?? l.ket_qua, ngay: l.ngay, ghiChu: l.ghi_chu ?? null, nguoi: l.full_name ?? null, luc: l.ghi_luc }));
  const xl = xuLyCon(v);
  const the = v.measure_id
    ? db().prepare(`SELECT ly_do FROM yeu_cau_duyet WHERE loai = 'thu_hoi_y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'`).get(v.measure_id) as { ly_do: string | null } | undefined
    : undefined;
  const nhanTrangThai = nhanTrangThaiBaoPh(v.trang_thai, lan.length > 0);
  const vp = viPhamXuLy(v.measure_id ?? v.bao_lai_cua ?? null);
  /* P1 G3-2: hạn QL trả lời — một câu, chỉ khi lần xử lý đang chờ duyệt (đa số việc không thêm câu). */
  const choQl = v.xu_ly_status === 'cho_duyet'
    ? { han: ((db().prepare(`SELECT han_duyet FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_loai = 'discipline_measure' AND doi_tuong_id = ? AND trang_thai = 'cho'`)
      .get(v.measure_id) as { han_duyet: string | null } | undefined)?.han_duyet ?? null) }
    : null;
  return {
    id, measureId: v.measure_id ?? null, studentId: v.student_id, ten: v.full_name, nhan: v.nhan, tieuDe: `Báo PH · ${v.nhan} · ${v.full_name}`, phoiHopId: v.phoi_hop_id ?? null, tinhHinhId: v.tinh_hinh_id ?? null,
    han, quaHan: v.trang_thai === 'mo' && quaHanBaoPh(han, homNay, v.tra_lai_id), trangThai: v.trang_thai, nhanTrangThai: v.trang_thai === 'mo' && v.tra_lai_id ? CHO_GV_SUA : nhanTrangThai,
    hanMacDinh, hanChon: v.han_chon ?? null, coTheSuaHan: v.trang_thai === 'mo' && xl === 'con' && coTheSuaHan(p, v), lichSuHan: lichSuHan('bao_ph', id),
    xuLy: xl, nhanXuLy: xl === 'con' ? null : LY_DO_HE_THONG[`system_${xl}` as LyDoHeThong],
    bo: v.trang_thai === 'bo' ? { lyDo: v.bo_ly_do, nhan: nhanLyDo(v.bo_ly_do), chu: v.bo_ly_do_chu ?? null, luc: v.bo_luc } : null,
    /* SĐT phụ huynh chỉ cho người làm việc (TVV / QL) — người chỉ xem trạng thái (GV) không cần. */
    lan, lienHe: ghi ? { ten: v.parent_name ?? null, quanHe: v.parent_relation ?? null, sdt: v.parent_phone ?? null } : { ten: null, quanHe: null, sdt: null },
    coTheGhi: xl === 'con' && ghi,   // RKC-3a: việc đã bỏ vẫn ghi được (ghi = mở lại theo kết quả)
    khoiPhucDuoc: v.trang_thai === 'bo' && xl === 'con' && ghi && laLyDoNguoiDung(v.bo_ly_do) && daoDuocHoacCu(id),
    boiCanh: v.tinh_hinh_id != null
      /* TINH-HINH: bối cảnh = GV báo tình hình (người, ngày, nội dung). */
      ? { nguoiLuu: v.th_nguoi ?? null, luuLuc: v.th_luc ?? null, lop: v.th_lop ?? null, noiDung: v.th_nd ?? null, viPham: [], ghiChu: v.th_nd ?? null }
      : v.phoi_hop_id != null && laViecTvvBaoPh(v.ph_kind)
      /* BAOPH-0 (N72 ⑤): nội dung MÁY điền theo nguồn (Trao đổi gia đình: lượt · Overall · kỹ năng trượt; kết quả Test: 4 nội dung) — GVCN không xác nhận bước này. */
      ? { nguoiLuu: null, luuLuc: v.tao_luc ?? null, lop: null, noiDung: noiDungNguonTvv(p, v.phoi_hop_id), viPham: [], ghiChu: null }
      : v.phoi_hop_id != null
      /* PHOI-HOP-V2: bối cảnh = GVCN xác nhận Meeting (ngày, người, nội dung gửi TVV). */
      ? { nguoiLuu: v.ph_nguoi ?? null, luuLuc: v.ph_ngay ?? null, lop: null, noiDung: v.ph_note?.trim() || null, viPham: [], ghiChu: v.ph_note?.trim() || null }
      : { nguoiLuu: v.m_nguoi ?? null, luuLuc: v.m_luc ?? null, ngayLam: v.m_ngay ?? null, lop: v.m_lop ?? null, noiDung: noiDungXuLy(vp, v.m_note ?? null), viPham: vp, ghiChu: v.m_note?.trim() || null, xuLyId: v.measure_id ?? v.bao_lai_cua ?? null },
    thuHoiCho: the ? { lyDo: the.ly_do ?? null } : null,
    choQlDuyet: choQl,
    /* TL-1: một câu chỉ khi việc Báo PH vi phạm (có lần xử lý). */
    choGvSua: !!v.tra_lai_id,
    traLai: v.measure_id ? traLaiDangMo({ violationIds: vp.map((x) => x.id), measureIds: [v.measure_id] }) : [],
    coTheTraLai: v.trang_thai === 'mo' && !!v.measure_id && xl === 'con' && coTheTraLai(p, v),
  };
}

// ---------------------------------------------------------------- ghi kết quả / bỏ việc

/**
 * Ghi kết quả cho MỘT hoặc NHIỀU việc (K10: hai lần xử lý cùng em → một lần ghi, mỗi việc một dòng lịch sử). Ngày mặc định hôm nay, không sau hôm nay.
 * Mỗi việc kiểm quyền + trạng thái riêng; lỗi một việc → cả lần ghi lui (một giao dịch).
 */
export function ghiKetQuaBaoPh(p: Principal, v: { viecIds?: unknown; ketQua?: unknown; ngay?: unknown; ghiChu?: unknown; khoa?: unknown }): { ok: true; viec: ViecBaoPhView[] } {
  const ids = [...new Set((Array.isArray(v.viecIds) ? v.viecIds : [v.viecIds]).map(Number))];
  if (!ids.length || ids.length > 50 || ids.some((x) => !Number.isInteger(x) || x <= 0)) throw badRequest('Chọn việc Báo PH cần ghi.');
  const ketQua = String(v.ketQua ?? '') as KetQuaBaoPh;
  if (!(KET_QUA_BAO_PH as readonly string[]).includes(ketQua)) throw badRequest('Chọn kết quả: Đã báo PH hoặc Chưa liên hệ được.');
  const homNay = demoToday();
  const ngay = v.ngay == null || v.ngay === '' ? homNay : String(v.ngay);
  if (!isIsoDate(ngay)) throw badRequest('Ngày không hợp lệ.');
  if (ngay > homNay) throw badRequest('Ngày báo không được sau hôm nay.');
  const ghiChu = chuTuDo(v.ghiChu, 'Nội dung', 2000);
  /* Y-THUC-V2 (chủ SP 11/11): MỘT ô "Nội dung" cho mọi kết quả, BẮT BUỘC — GV của lớp đọc được TVV báo gì, PH nói gì. */
  if (!ghiChu?.trim()) throw badRequest('Ghi Nội dung: đã báo PH gì, PH nói gì.');
  /* X04 (audit 03/11): web gửi MỘT khoá cho mỗi ý định ghi; gửi lại sau mất phản hồi (máy chủ đã lưu) → trả bản đã lưu, không thêm lần liên hệ.
     Hai lần liên hệ thật = hai khoá. */
  const khoa = v.khoa == null || v.khoa === '' ? null : String(v.khoa).slice(0, 80);
  if (khoa && ids.every((id) => db().prepare('SELECT 1 FROM viec_bao_ph_lan WHERE khoa = ?').get(`${khoa}:${id}`))) {
    for (const id of ids) requireGhi(p, loadViec(id));
    return { ok: true, viec: ids.map((id) => xemViecBaoPh(p, id)) };
  }
  tx(() => {
    for (const id of ids) {
      const x = loadViec(id);
      requireGhi(p, x);
      /* RKC-3a: việc đã kết thúc (bỏ) vẫn ghi lần liên hệ được — ghi = việc mở lại theo kết quả (xong / còn mở); nhật ký giữ trạng thái trước. */
      const xl = xuLyCon(x);
      if (xl !== 'con') throw badRequest(`${LY_DO_HE_THONG[`system_${xl}` as LyDoHeThong]} — việc Báo PH chỉ xem.`);
      /* PHOI-HOP-V2: kết quả buổi Meeting CX/GĐCN — luật ≥ 10 ký tự (OV-12h) chuyển từ bước GVCN sang bước TVV. */
      const toiThieu = x.phoi_hop_id != null && laMeetingCx(x.ph_kind) ? buocTvvViec({ kind: x.ph_kind, pb_moc: x.ph_pb ?? null })?.toiThieu ?? GHI_CHU_MEETING_TOI_THIEU : 0;   // CAU-HINH-CASE-SOS
      if (ketQua === 'da_bao' && ghiChu.trim().length < toiThieu) throw badRequest(`Meeting CX/GĐCN: Nội dung ít nhất ${toiThieu} ký tự.`);
      const lanId = Number(db().prepare('INSERT INTO viec_bao_ph_lan (viec_id, ket_qua, ngay, ghi_chu, ghi_boi, ghi_luc, khoa) VALUES (?,?,?,?,?,?,?)')
        .run(id, ketQua, ngay, ghiChu, p.userId, nowIso(), khoa ? `${khoa}:${id}` : null).lastInsertRowid);
      const sau = ketQua === 'da_bao' ? 'xong' : 'mo';
      /* 2.7 (chủ SP 13/11): GVCN lớp em nhận MỘT tin khi TVV báo PH vi phạm xong (khối dưới) — GV-1 (N58): người được giao + người theo dõi khác nhận tin
         "Có kết quả" cùng lúc (GVCN không nhận lần hai — một nguồn). Chưa liên hệ được: không tin. */
      const gvcnVp = sau === 'xong' && x.tinh_hinh_id == null && x.phoi_hop_id == null ? gvcnCuaEm(x.student_id, homNay).gvcn : null;
      if (sau === 'xong') {
        baoTheoDoi('bao_ph', id, p.userId, { suKien: 'ket_qua', tieuDe: `Báo PH · ${x.nhan} · ${x.full_name}`, chiTiet: ghiChu, khoa: lanId, studentId: x.student_id,
          duong: duongHoSoHocVien(x.student_id, { tab: 'y-thuc' }), boQua: [gvcnVp, x.th_gui ?? null] });   // BAOPH-0: người gửi tình hình nhận tin riêng dưới
      }
      /* TL-1 (N61): TVV không bị chặn — báo PH xong khi đang "Chờ GV sửa" → yêu cầu trả lại còn mở tự đóng "TVV đã báo PH". Gọi TRƯỚC khi việc sang xong:
         hạn tính lại (hôm nay + 4) nên lần báo này không bị tính trễ ở sổ nghĩa vụ / "Báo PH đúng hạn" (rà #1927 (3)). */
      if (sau === 'xong' && x.tra_lai_id) dongTheoDuongSanCo({ baoPhId: id }, 'tvv_da_bao', p.userId);
      /* B-6 (N24 ②): ghi lại lần liên hệ trên việc đã bỏ = việc mở lại / xong → xoá dấu "bỏ" (không vừa xong vừa mang lý do bỏ). */
      db().prepare('UPDATE viec_bao_ph SET trang_thai = ?, bo_ly_do = NULL, bo_ly_do_chu = NULL, bo_boi = NULL, bo_luc = NULL WHERE id = ?').run(sau, id);
      nguonTheoViecTvv(p, x, sau, { ngay, ghiChu });   // BAOPH-0: lượt Phối hợp / Xét lại đọc kết quả TVV
      if (x.tinh_hinh_id != null) {
        /* TINH-HINH: kết quả về GV đã báo (chuông khi Đã báo PH). */
        db().prepare(`UPDATE tinh_hinh_hoc_tap SET trang_thai = ? WHERE id = ? AND trang_thai != 'rut'`).run(sau, x.tinh_hinh_id);
        if (sau === 'xong' && x.th_gui && x.th_gui !== p.userId) {
          notify({ userId: x.th_gui, kind: 'tinh_hinh', title: `TVV đã báo PH tình hình học tập · ${x.full_name}`, body: ghiChu.slice(0, 120),
            entityType: 'student', entityId: x.student_id, dedupKey: `tinh-hinh-bao:${x.tinh_hinh_id}`, duong: duongHoSoHocVien(x.student_id, { tab: 'y-thuc' }) });
        }
      }
      /* 2.7 (chủ SP 13/11): TVV báo PH về VI PHẠM xong → GVCN lớp em đang học nhận MỘT tin Cập nhật (không vào số việc) — cùng kiểu tin tình hình học tập. */
      if (gvcnVp) {
        const gvcn = gvcnVp;
        if (gvcn !== p.userId) {
          notify({ userId: gvcn, kind: 'discipline_de_biet', title: `TVV đã báo PH vi phạm · ${x.nhan} · ${x.full_name}`, body: ghiChu.slice(0, 120),
            entityType: 'student', entityId: x.student_id, dedupKey: `bao-ph-vp:${id}`, duong: duongHoSoHocVien(x.student_id, { tab: 'y-thuc' }) });
        }
      }
      writeAudit({ actorUserId: p.userId, action: 'discipline.bao_ph', entityType: 'discipline_measure', entityId: x.measure_id,
        entityLabel: `${x.student_code} · Báo PH · ${x.nhan}`, before: { trangThai: x.trang_thai }, after: { trangThai: sau, ketQua, ngay, ghiChu } });
    }
  });
  return { ok: true, viec: ids.map((id) => xemViecBaoPh(p, id)) };
}

/** Kết thúc ngoại lệ (thao tác phụ): lý do bỏ sẵn có, "Khác" bắt chữ. Chỉ việc đang mở. */
export function boViecBaoPh(p: Principal, id: number, v: { lyDo?: unknown; lyDoKhac?: unknown }): ViecBaoPhView {
  const lyDo = String(v.lyDo ?? '');
  if (!(COORDINATION_USER_REMOVE_REASONS as readonly string[]).includes(lyDo)) throw badRequest('Chọn lý do bỏ việc.');
  const chu = chuTuDo(v.lyDoKhac, 'Lý do', 2000);
  if (reasonNeedsText(lyDo) && !chu) throw badRequest('Ghi rõ lý do "Khác".');
  const x = loadViec(id);
  requireGhi(p, x);
  if (x.trang_thai !== 'mo') throw badRequest('Chỉ bỏ được việc đang mở.');
  tx(() => {
    const g = new GhiDao(db());   // Q-RL2c: chụp dòng trước khi bỏ → Hoàn tác / Khôi phục trả y nguyên
    g.sua('viec_bao_ph', 'id = ?', id);
    const doi = db().prepare(`UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = ?, bo_ly_do_chu = ?, bo_boi = ?, bo_luc = ? WHERE id = ? AND trang_thai = 'mo'`)
      .run(lyDo, reasonNeedsText(lyDo) ? chu : null, p.userId, nowIso(), id).changes;
    if (!doi) throw badRequest('Việc vừa được cập nhật — mở lại.');
    if (x.phoi_hop_id != null && laViecTvvBaoPh(x.ph_kind)) {
      g.sua('sos_coordination_actions', 'id = ?', x.phoi_hop_id);   // BAOPH-0: nguồn bỏ cùng — Hoàn tác / Khôi phục trả y nguyên cả hai
      nguonTheoViecTvv(p, x, 'bo', { lyDo, lyDoChu: reasonNeedsText(lyDo) ? chu : null });
    }
    luuGhiDao(db(), { loai: LOAI_BO, bang: 'viec_bao_ph', id, nguoi: p.userId, ghi: g });
    baoTheoDoi('bao_ph', id, p.userId, { suKien: 'bo', tieuDe: `Báo PH · ${x.nhan} · ${x.full_name}`, chiTiet: nhanLyDo(lyDo), khoa: nowIso(), studentId: x.student_id });
    writeAudit({ actorUserId: p.userId, action: 'discipline.bao_ph_bo', entityType: 'discipline_measure', entityId: x.measure_id,
      entityLabel: `${x.student_code} · bỏ Báo PH · ${x.nhan}`, before: { trangThai: 'mo' }, after: { trangThai: 'bo', lyDo, chu } });
  });
  return xemViecBaoPh(p, id);
}

const LOAI_BO = 'bo_bao_ph';
const laLyDoNguoiDung = (code: string | null): boolean => (COORDINATION_USER_REMOVE_REASONS as readonly string[]).includes(code ?? '');
/** Có bản ghi đảo → còn đảo được; không có (việc bỏ trước Q-RL2c) → mở lại theo cách cũ được. */
const daoDuocHoacCu = (id: number): boolean => { const r = timGhiDao(db(), LOAI_BO, 'viec_bao_ph', id); return !r || daoDuoc(r); };

/**
 * Q-RL2c (N24 ②): Hoàn tác / Khôi phục việc NGƯỜI DÙNG đã bỏ → dòng y như trước khi bỏ (đang mở, hạn giữ). Quyền = quyền bỏ, theo việc HIỆN TẠI.
 * Việc hệ thống đóng (thu hồi / từ chối / rút) hay lần xử lý không còn: không khôi phục tay. Việc bỏ trước Q-RL2c (không có bản ghi đảo): mở lại cách cũ.
 */
export function khoiPhucViecBaoPh(p: Principal, id: number): ViecBaoPhView {
  const x = loadViec(id);
  requireGhi(p, x);
  if (x.trang_thai !== 'bo') throw conflict('Việc Báo PH này không ở trạng thái Đã bỏ — không có gì để khôi phục.');
  if (!laLyDoNguoiDung(x.bo_ly_do)) throw conflict('Việc này do hệ thống đóng theo lần xử lý — muốn mở lại: Thu hồi lần xử lý ở tab Ý thức của em.');
  const xl = xuLyCon(x);
  if (xl !== 'con') throw conflict(`${LY_DO_HE_THONG[`system_${xl}` as LyDoHeThong]} — không khôi phục việc Báo PH được.`);
  tx(() => {
    const r = timGhiDao(db(), LOAI_BO, 'viec_bao_ph', id);
    if (r) daoLai(db(), r, p.userId);
    else if (!db().prepare(`UPDATE viec_bao_ph SET trang_thai = 'mo', bo_ly_do = NULL, bo_ly_do_chu = NULL, bo_boi = NULL, bo_luc = NULL
                 WHERE id = ? AND trang_thai = 'bo' AND bo_ly_do = ?`).run(id, x.bo_ly_do).changes) throw conflict('Việc vừa được cập nhật — mở lại.');
    if (!r) nguonTheoViecTvv(p, x, 'mo');   // BAOPH-0: bản ghi đảo đã trả cả nguồn; cách cũ mở nguồn theo
    writeAudit({ actorUserId: p.userId, action: 'discipline.bao_ph_khoi_phuc', entityType: 'discipline_measure', entityId: x.measure_id,
      entityLabel: `${x.student_code} · khôi phục Báo PH · ${x.nhan}`, before: { trangThai: 'bo', lyDo: x.bo_ly_do, chu: x.bo_ly_do_chu ?? null }, after: { trangThai: 'mo' } });
  });
  return xemViecBaoPh(p, id);
}

// ---------------------------------------------------------------- sửa hạn (HAN-BAO-PH, chủ SP 03/11 — dùng chung Meeting CX ở `phoiHop.ts`)

export type LanDoiHan = { cu: string | null; moi: string; macDinh: boolean; nguoi: string | null; luc: string };
export type LoaiViecHan = 'bao_ph' | 'phoi_hop';

/** Mỗi lần đổi hạn của một việc, cũ nhất trước. */
export function lichSuHan(loai: LoaiViecHan, id: number): LanDoiHan[] {
  return (db().prepare(
    `SELECT l.han_cu, l.han_moi, l.mac_dinh, l.luc, u.full_name FROM viec_han_lan l LEFT JOIN users u ON u.id = l.boi WHERE l.loai = ? AND l.viec_id = ? ORDER BY l.id`,
  ).all(loai, id) as any[]).map((l) => ({ cu: l.han_cu ?? null, moi: l.han_moi, macDinh: l.mac_dinh === 1, nguoi: l.full_name ?? null, luc: l.luc }));
}

/**
 * Thân yêu cầu sửa hạn: `han` = ngày YYYY-MM-DD hoặc null (về mặc định) · `hanCu` = `hanChon` người dùng đang thấy (null = mặc định); khác giá trị hiện
 * tại → 409 (hai người sửa cùng lúc không đè nhau trong im lặng). Không trần, không lý do; ngày đã qua vẫn nhận (hiện "quá hạn").
 */
export function docSuaHan(v: { han?: unknown; hanCu?: unknown }): { han: string | null; hanCu: string | null } {
  if (!('hanCu' in v)) throw badRequest('Thiếu hạn đang xem — mở lại việc rồi sửa.');
  const han = v.han == null || v.han === '' ? null : String(v.han);
  if (han !== null && !isIsoDate(han)) throw badRequest('Ngày hạn không hợp lệ.');
  return { han, hanCu: v.hanCu == null || v.hanCu === '' ? null : String(v.hanCu) };
}

/** TRONG tx: đổi `han_chon` (so-và-đổi theo `hanCu`) + một dòng lịch sử. Trả false khi không có gì đổi. */
export function doiHanChon(o: { loai: LoaiViecHan; bang: 'viec_bao_ph' | 'sos_coordination_actions'; id: number; han: string | null; hanCu: string | null; cuHieuLuc: string | null; moiHieuLuc: string; boi: number }): boolean {
  if (o.han === o.hanCu) return false;
  const doi = db().prepare(`UPDATE ${o.bang} SET han_chon = ? WHERE id = ? AND han_chon IS ?`).run(o.han, o.id, o.hanCu).changes;
  if (!doi) throw conflict('Hạn vừa được người khác sửa — mở lại việc để xem hạn mới.');
  db().prepare('INSERT INTO viec_han_lan (loai, viec_id, han_cu, han_moi, mac_dinh, boi, luc) VALUES (?,?,?,?,?,?,?)')
    .run(o.loai, o.id, o.cuHieuLuc, o.moiHieuLuc, o.han === null ? 1 : 0, o.boi, nowIso());
  return true;
}

/** Sửa hạn việc Báo PH đang mở (17.1). Việc xong / bỏ / lần xử lý không còn: không sửa (không mở lại việc). */
export function suaHanBaoPh(p: Principal, id: number, body: { han?: unknown; hanCu?: unknown }): ViecBaoPhView {
  const { han, hanCu } = docSuaHan(body);
  const x = loadViec(id);
  if (!coTheSuaHan(p, x)) throw forbidden('Chỉ TVV, GVCN lớp em đang học, người phụ trách, người giao hoặc Head sửa được hạn báo phụ huynh.');
  if (x.trang_thai !== 'mo') throw badRequest('Việc Báo PH đã kết thúc — không sửa hạn.');
  const xl = xuLyCon(x);
  if (xl !== 'con') throw badRequest(`${LY_DO_HE_THONG[`system_${xl}` as LyDoHeThong]} — việc Báo PH chỉ xem.`);
  const khoang = khoangTamDung([x.student_id])[x.student_id];
  tx(() => {
    const cu = hanBaoPhHieuLuc(x.han, khoang, hanCu), moi = hanBaoPhHieuLuc(x.han, khoang, han);
    if (doiHanChon({ loai: 'bao_ph', bang: 'viec_bao_ph', id, han, hanCu, cuHieuLuc: cu, moiHieuLuc: moi, boi: p.userId })) {
      const aid = writeAudit({ actorUserId: p.userId, action: 'discipline.bao_ph_han', entityType: 'discipline_measure', entityId: x.measure_id,
        entityLabel: `${x.student_code} · hạn Báo PH · ${x.nhan}`, before: { han: cu, hanChon: hanCu }, after: { han: moi, hanChon: han } });
      baoTheoDoi('bao_ph', id, p.userId, { suKien: 'han', tieuDe: `Báo PH · ${x.nhan} · ${x.full_name}`, chiTiet: `Hạn mới: ${moi.slice(8, 10)}/${moi.slice(5, 7)}`, khoa: aid, studentId: x.student_id });
    }
  });
  return xemViecBaoPh(p, id);
}

// ---------------------------------------------------------------- việc của tôi (`/my-work`)

/** S3: chỉ phép kiểm bật — câu cũ `(x = ? OR ? = 1)` (quét cả bảng) để so với câu theo nhánh: TVV đi chỉ mục idx_student_consultant. */
export const baoPhCuKhiKiem = { bat: false };

/**
 * Việc Báo PH đang mở, em đang học (Tạm dừng → ẩn — K7). Người giữ: TVV của em; em không có TVV → QL trong phạm vi em là người giữ.
 * `tatCa` (QL "Của GV"): cả việc TVV giữ trong phạm vi. Một câu; TVV chỉ đọc em của mình.
 */
/* P1-04: `studentId` — chỉ việc của một em (thanh "Việc cần làm" hồ sơ HV), cùng luật người giữ, cùng khoá. */
export function viecBaoPhCuaToi(p: Principal, o: { today: string; tatCa: boolean; branchId: number | null; studentId?: number }): WorkItem[] {
  /* MỘT câu, không thêm câu phạm vi / Tạm dừng (TD4-b): phạm vi QL tính từ quyền đã nạp (`scopeFor`, chi nhánh của em); lần Quay lại học sau ngày lưu
     (có Tạm dừng trước hạn) đọc ngay trong câu → `hanBaoPhHieuLuc`. X05 (audit 03/11): QL không toàn quyền → lọc chi nhánh của em NGAY trong câu. */
  const pv = scopeFor(p, PERMISSIONS.REQUEST_APPROVE, o.today);
  const ql = !pv.none;
  const tvv = p.roleKeys.includes('consultant');
  const lead = laLeadTvv(p);   // VAI-0 (N76b): việc Lead TVV giữ = `nguoi_luat` là tôi
  if (!ql && !tvv && !lead) return [];   // GV không giữ việc này — khỏi tốn câu (BAOPH-0: em chưa có TVV → Head, GVCN thôi giữ việc sau Meeting)
  const trongPv = (branchId: number | null) => pv.all || (branchId !== null && pv.branchIds.includes(branchId));
  const COT = `SELECT v.id, v.student_id, v.phu_trach_id, v.nguoi_luat, v.tra_lai_id, v.nhan, v.bao_lai_cua, v.phoi_hop_id, v.tinh_hinh_id, (SELECT u.full_name FROM tinh_hinh_hoc_tap th JOIN users u ON u.id = th.nguoi_gui WHERE th.id = v.tinh_hinh_id) AS th_nguoi, m.kind AS m_kind, m.custom_name AS m_custom, v.han, v.han_chon, s.full_name, s.consultant_user_id AS tvv, ${CHI_NHANH_EM} AS branch_id,
            e.class_id, c.code AS class_code, (SELECT COUNT(*) FROM viec_bao_ph_lan l WHERE l.viec_id = v.id) AS so_lan, ${HOP_MEETING_SQL('v')} AS hop,
            ${SU_KIEN_TAM_DUNG_SQL('s.id')} AS dung,   -- rà 25/11 PR 2 (N34 ③): ĐỦ khoảng Tạm dừng như panel / bảng lớp (khoangTuSuKien), không ghép một khoảng
            ph.kind AS ph_kind, pa.kind AS ph_a_kind, pa.attempt_no AS ph_luot   -- BAOPH-0: nguồn của việc TVV (Trao đổi gia đình · kết quả Progress / Final)
       FROM viec_bao_ph v JOIN students s ON s.id = v.student_id AND ${HV_DANG_HOC_SQL('s')}
       LEFT JOIN sos_coordination_actions ph ON ph.id = v.phoi_hop_id LEFT JOIN assessment_attempts pa ON pa.id = ph.attempt_id
       LEFT JOIN discipline_measures m ON m.id = COALESCE(v.measure_id, v.bao_lai_cua)
       LEFT JOIN enrollments e ON e.id = (SELECT MAX(x.id) FROM enrollments x WHERE x.student_id = s.id AND x.status = 'active')
       LEFT JOIN classes c ON c.id = e.class_id
      WHERE v.trang_thai = 'mo'${o.studentId ? ' AND v.student_id = ?' : ''}
        AND (pa.id IS NULL OR (pa.status != 'cancelled' AND NOT ${LUOT_SAU_THI_SQL('pa')}))`;   // N46 (rà #2233 P1-4): việc theo lượt sau thi thật / lượt huỷ không còn là việc
  const em = o.studentId ? [o.studentId] : [];
  const rows = docNho(   // TOC-DO-2511: nhớ trong request; chép dòng — dưới còn push + gán `r.nhan`
    `${COT}${baoPhCuKhiKiem.bat ? ' AND (s.consultant_user_id = ? OR ? = 1)' : !ql ? ` AND (s.consultant_user_id = ?${lead ? ' OR v.nguoi_luat = ?' : ''})`
        : pv.all ? '' : ` AND (s.consultant_user_id = ? OR v.nguoi_luat = ? OR ${CHI_NHANH_EM} IN (${DS_JSON}))`} ORDER BY v.han, v.id`,
  ...em, ...(baoPhCuKhiKiem.bat ? [p.userId, ql ? 1 : 0] : !ql ? [p.userId, ...(lead ? [p.userId] : [])] : pv.all ? [] : [p.userId, p.userId, JSON.stringify(pv.branchIds)])).map((r) => ({ ...r }));
  const items: WorkItem[] = [];
  for (const r of rows) {
    if (o.branchId && r.branch_id !== o.branchId) continue;
    let ownerId: number | null;
    /* AUDIT-2111 (rà #1960): TVV hết hiệu lực ở chi nhánh em = chưa có TVV → Head giữ (không mồ côi); chính người xem: grant đã nạp, 0 câu. */
    const tvv = r.phu_trach_id != null ? r.tvv : tvvHieuLuc(p, r.tvv, r.student_id, r.branch_id ?? undefined, () => null);
    /* GV-1 (N58): việc đã giao rời danh sách người theo luật — người được giao thấy qua `viecGiaoChoToi`; "Tất cả" của QL thấy tên người được giao. */
    if (r.phu_trach_id != null) { if (!o.tatCa || r.phu_trach_id === p.userId || !trongPv(r.branch_id)) continue; ownerId = r.phu_trach_id; }
    else if (tvv !== null && tvv === p.userId) ownerId = p.userId;
    /* VAI-0 (N76b): em chưa có TVV, Lead TVV chốt lúc sinh còn vai ở CN em → Lead TVV giữ; Head / Quản trị chỉ thấy ở "Tất cả". */
    else if (!tvv && conVaiO(r.nguoi_luat, VAI_LEAD_TVV, r.branch_id) && r.nguoi_luat === p.userId) ownerId = p.userId;
    else if (!trongPv(r.branch_id)) continue;
    else if (!tvv && conVaiO(r.nguoi_luat, VAI_LEAD_TVV, r.branch_id)) { if (o.tatCa) ownerId = r.nguoi_luat; else continue; }
    /* DEM-VIEC: em chưa có TVV → QL chi nhánh giữ; Quản trị chỉ giữ khi chi nhánh không có QL (`giuViecQl`), còn lại thấy ở "Tất cả" (chưa ai giữ). */
    else if (!tvv) { if (headCua(r.branch_id) === p.userId) ownerId = p.userId; else if (o.tatCa) ownerId = headCua(r.branch_id); else continue; }   // VAI-0 (N74): một Head
    else if (o.tatCa) ownerId = tvv;
    else continue;
    const han = hanBaoPhHieuLuc(r.han, khoangTuSuKien(r.dung), r.han_chon);
    /* TL-1 (N61): "Chờ GV sửa" — hạn tạm dừng (không quá hạn, không "hôm nay"), cờ cho web. */
    const urgency = r.tra_lai_id ? 'normal' : quaHanBaoPh(han, o.today) ? 'overdue' : han === o.today ? 'today' : 'normal';
    const cho = r.tra_lai_id ? { choGvSua: true as const } : {};
    if (r.phoi_hop_id != null && laViecTvvBaoPh(r.ph_kind ?? '')) {
      /* BAOPH-0 (N72 ⑤): Trao đổi gia đình (Phối hợp SOS — một lần báo PH mỗi em × lượt, nói luôn việc họp CX) · kết quả Progress / Final (Báo PH). */
      const traoDoi = r.ph_kind === 'talk_family';
      items.push({
        key: `bao-ph:${r.id}`, group: traoDoi ? 'phoi_hop_tvv' : 'bao_ph_yt', urgency,
        studentId: r.student_id, studentName: r.full_name, classId: r.class_id ?? null, classCode: r.class_code ?? null,
        attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: r.nhan, count: null,
        reason: traoDoi ? `Phối hợp SOS sau MT${r.ph_luot ?? ''} — báo gia đình (cả việc họp CX / GĐCN nếu có) và ghi kết quả` : `${r.nhan} lớp thường — báo phụ huynh và ghi kết quả`,
        tieuDe: `Báo PH · ${traoDoi ? 'Trao đổi gia đình' : r.nhan} · ${r.full_name}`, phu: `Báo PH · ${r.nhan}`, actionLabel: 'Ghi báo PH',
        href: traoDoi && r.class_id ? `/hoc-vien/lop/${r.class_id}?tab=y-thuc&sub=phoi-hop` : duongHoSoHocVien(r.student_id, { tab: 'y-thuc', sub: 'phoi-hop' }),
        ownerId, owner: null, mine: ownerId === p.userId,
        due: han, statusLabel: r.so_lan ? 'Chưa liên hệ được' : 'Chưa báo', viecId: r.id, soLanThu: r.so_lan,
      });
      continue;
    }
    if (r.phoi_hop_id != null) {
      /* PHOI-HOP-V2: việc sau Meeting CX — nhóm riêng (mục Phối hợp SOS), gộp theo lớp như việc khác; khoá `bao-ph:{id}` như Báo PH (sổ nghĩa vụ, đúng hạn). */
      items.push({
        key: `bao-ph:${r.id}`, group: 'phoi_hop_tvv', urgency,
        studentId: r.student_id, studentName: r.full_name, classId: r.class_id ?? null, classCode: r.class_code ?? null,
        attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: chuHop(r.hop), count: null,   // A3-09: dòng phụ "họp {ngày giờ}"
        reason: `GVCN đã xác nhận ${r.nhan} — báo gia đình, sắp xếp buổi họp và ghi kết quả`,
        tieuDe: `Báo PH · Meeting CX/GĐCN · ${r.full_name}`, phu: chuHop(r.hop), actionLabel: 'Ghi KQ',
        href: r.class_id ? `/hoc-vien/lop/${r.class_id}?tab=y-thuc&sub=phoi-hop` : duongHoSoHocVien(r.student_id, { tab: 'y-thuc', sub: 'phoi-hop' }),
        ownerId, owner: null, mine: ownerId === p.userId,
        due: han, statusLabel: r.so_lan ? 'Chưa liên hệ được' : 'Chưa báo', viecId: r.id, soLanThu: r.so_lan,
      });
      continue;
    }
    if (r.tinh_hinh_id != null) {
      /* TINH-HINH: GV báo tình hình học tập — cùng nhóm, cùng mục Báo PH, khoá `bao-ph:{id}` (sổ nghĩa vụ, đúng hạn như Báo PH). */
      items.push({
        key: `bao-ph:${r.id}`, group: 'bao_ph_yt', urgency,
        studentId: r.student_id, studentName: r.full_name, classId: r.class_id ?? null, classCode: r.class_code ?? null,
        attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: r.nhan, count: null,
        reason: `${r.th_nguoi ?? 'GV'} báo tình hình học tập — báo phụ huynh và ghi kết quả`,
        tieuDe: `Báo PH · ${r.nhan} · ${r.full_name}`, phu: `Báo PH · ${r.nhan}`, actionLabel: 'Ghi báo PH',
        href: duongHoSoHocVien(r.student_id, { tab: 'y-thuc' }), ownerId, owner: null, mine: ownerId === p.userId,
        due: han, statusLabel: r.so_lan ? 'Chưa liên hệ được' : 'Chưa báo', viecId: r.id, soLanThu: r.so_lan,
      });
      continue;
    }
    r.nhan = nhanViec(r);
    items.push({
      key: `bao-ph:${r.id}`, group: 'bao_ph_yt', urgency,
      studentId: r.student_id, studentName: r.full_name, classId: r.class_id ?? null, classCode: r.class_code ?? null,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: r.nhan, count: null,
      reason: r.bao_lai_cua ? `${r.nhan} — báo lại phụ huynh và ghi kết quả` : `Đã lưu xử lý ${r.nhan} — báo phụ huynh và ghi kết quả`,
      tieuDe: `Báo PH · ${r.nhan} · ${r.full_name}`, phu: `Báo PH · ${r.nhan}`, actionLabel: 'Ghi báo PH',
      href: duongHoSoHocVien(r.student_id, { tab: 'y-thuc' }), ownerId, owner: null, mine: ownerId === p.userId,
      due: han, statusLabel: r.tra_lai_id ? CHO_GV_SUA : r.so_lan ? 'Chưa liên hệ được' : 'Chưa báo', viecId: r.id, soLanThu: r.so_lan, ...cho,
    });
  }
  return items;
}
