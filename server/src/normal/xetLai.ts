import { db, theoLo, tx } from '../db.ts';
import {
  NORMAL_LADDER, PERMISSIONS, chuTyLeXetLai, ghepMucTieu, goiYCuoiKhoa, hanXetLai, kyHieuLop, lyDoXetLai, tenBacKe, tenMonNgan, tuanHopLe, type LyDoXetLai, type MucTieuLenh, type ProgrammeCode,
} from '../../../shared/domain/index.ts';
import { HttpError, badRequest, chuTuDo, conflict, forbidden, isIsoDate, notFound, nowIso, todayInBusinessTz, loi } from '../util.ts';
import { isCoreTeacherOf, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
import { coTheRaLenh } from '../classes/quyenChuyenLop.ts';
import { huongChuyenMotEm, lopDichHopLe, lopHienTaiCua, danhSachLopDich } from '../classes/luatLoTrinh.ts';
import { huyLenh, khoiPhucLenh as khoiPhucLenhHuy, raLenh, soHoacKck, thongBaoSapNhan } from '../classes/lenhChuyen.ts';
import { hoanTacKetThuc, hoanTacTamDung, setStudentStatus } from '../students/students.ts';
import { dongBoCheTaiFinal, tyLeTongLo } from './cuoiKhoa.ts';
import { dongBoMt0 } from '../fasttrack/mt0.ts';

/**
 * XÉT LẠI LỘ TRÌNH (P9a, N21) — MỘT CỬA phía máy chủ: tập em (`tapXetLai`, cùng hàm cho việc QL, GET panel, quét hết hạn), quyết định theo lô
 * (Tiếp tục · Học lại · Tạm dừng/ Kết thúc học), Hoàn tác / Sửa tới khi lệnh mới thi hành, nhận xét GVCN lớp mới. Luật thuần: `lyDoXetLai`,
 * `hanXetLai` (shared). Học lại / Lên (dòng (c)) = đúng đường Chuyển lớp (`huongChuyenMotEm` + `raLenh`, như POST /students/:id/transfer): em đã thi
 * hành → lệnh mới ở lớp đang học; lệnh chưa thi hành → SỬA lệnh đó (upsert theo em) — trước khi sửa chụp nguyên dòng lệnh + phiếu bàn giao + Lộ trình
 * tiếp theo để Hoàn tác / Sửa trả lại ĐÚNG như trước (`khoiPhucLenh`, không đi qua `raLenh`).
 */

export type QuyetXetLai = 'tiep_tuc' | 'hoc_lai' | 'len' | 'dung';
const CHUYEN: readonly QuyetXetLai[] = ['hoc_lai', 'len'];
export type EmXetLai = {
  studentId: number; ten: string; lenhId: number; lyDo: { ma: LyDoXetLai['ma']; chu: string; moc: string }; han: string;
  lopHienTai: { id: number; code: string; ft: boolean; ct: string | null; chiNhanhId: number };
  lopNguon: { id: number; code: string; ct: string | null }; daThiHanh: boolean; tuanBatDau: string;
  final: { tyLe: number | null; mon: { mon: string; pt: number | null; dat: boolean }[] };
  daChot: { huong: string; chu: string; lopDich: string | null; lopDichId: number | null; luc: string; nguoi: string | null; lyDo: string | null };
  goiY: string | null;
  phuHuynh: { tvv: string | null; luc: string | null; ketQua: string | null } | null;
  banGiaoGvcnCu: string | null;
  boTro: { mon: string[]; daHoc: number; tong: number; miniTest: { tyLe: number | null; ngayDuKien: string; ngayLam: string | null } } | null;
  nhanXetGvcnMoi: string | null;
  /** Lần xét lại trước (dòng (d) sau Tiếp tục): chữ + người + ngày. */
  xetLaiTruoc: { quyetDinh: QuyetXetLai; chu: string | null; tuDong: boolean; luc: string; nguoi: string | null } | null;
  /** GVCN lớp ĐÍCH của lệnh (người xem) — ô nhận xét. */
  coTheNhanXet?: boolean;
  /** Quyết định còn sửa được (Học lại mà lệnh mới chưa thi hành) — dòng vẫn hiện để Sửa / Hoàn tác. */
  quyetDinh: { id: number; quyetDinh: QuyetXetLai; lopDich: string | null; tuan: string | null; luc: string; nguoi: string | null } | null;
  /** Dòng (d): Mini Test gây ra dòng (thẻ Báo QL chỉ bỏ cho đúng Mini Test đó). */
  miniTestId?: number;
};
export type LopXetLai = { lopId: number; code: string; han: string; em: EmXetLai[] };

const CUA_SO_NGAY = 70;   // lệnh Cuối khoá có tuần bắt đầu trong 70 ngày gần nhất — đủ cho Mini Test (≤ 2 tuần bổ trợ + ghi muộn)
const ngayNgan = (d: string | null | undefined) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : '');
/**
 * Ngày nghiệp vụ (giờ VN) của mốc mở dòng, không quá hôm nay demo (điểm ghi bằng giờ thật khi ngày demo đứng trước ngày thật = hôm nay demo).
 * Không phụ thuộc ngày thật hay ngày đang tra → hạn cố định. Bản chính: ngày demo = ngày thật.
 */
function ngayCuaMoc(luc: string | null | undefined): string | null {
  const t = luc ? Date.parse(luc) : NaN;
  if (Number.isNaN(t)) return null;
  const d = todayInBusinessTz(new Date(t));
  const demo = demoToday();
  return d < demo ? d : demo;
}

/**
 * Tập em đang có dòng Xét lại (mọi chi nhánh, KHÔNG lọc quyền) + dòng đã quyết còn sửa được. Nhớ trong request; số câu cố định cho cả hệ thống.
 * Dòng quá hạn rời tập ở MỌI đường đọc (việc, panel, chip cùng một tập); chỉ quét định kỳ (`ghi`, `quetXetLaiHetHan`) mới ghi "Tiếp tục" tự giữ.
 */
export function tapXetLai(today = demoToday(), cn: readonly number[] | null = null, ghi = false): EmXetLai[] {
  if (cn && !cn.length) return [];
  return nho(`xet-lai:${today}:${cn ? [...cn].sort().join(',') : '*'}:${ghi ? 'ghi' : 'doc'}`, () => {
    const ds = tinhTapXetLai(today, { cn });
    const het = ds.filter((e) => !e.quyetDinh && e.han < today);
    if (!het.length) return ds;
    if (ghi) {
      /* Mốc deploy (migrate `prXetLai`): mục hết hạn TRƯỚC mốc không tự ghi — chỉ rời tập như luật cũ (dòng tự mất). */
      const moc = (db().prepare(`SELECT value FROM demo_config WHERE key = '${MOC_TU_GIU}'`).get() as any)?.value as string | undefined;
      try { tuGiu(het.filter((e) => !moc || e.han >= moc), today); } catch (e) { console.error('[xet-lai] tự giữ khi hết hạn', e); }
    }
    return ds.filter((e) => !het.includes(e));
  });
}
export const MOC_TU_GIU = 'xet_lai_tu_giu_tu';
/** Chỉ đọc (không tự giữ, không nhớ) — migrate dùng để đóng thẻ Mini Test cũ mà không ghi gì khác. */
export const tapXetLaiChiDoc = (today = demoToday()): EmXetLai[] => tinhTapXetLai(today);
/** Em có dòng (d) "Mini Test chưa đạt" ở Xét lại (ghi Mini Test < 70 % — `ghiMiniTestTrongTx`): QL quyết ở đó, không cần thẻ Báo QL. */
export const coXetLaiMiniTest = (studentId: number, miniTestId: number, today = demoToday()): boolean =>
  tinhTapXetLai(today, { chiEm: studentId }).some((e) => e.lyDo.ma === 'd' && e.miniTestId === miniTestId);

/** Chi nhánh QL / Quản trị được quyết (grant `class.edit`): null = mọi chi nhánh. */
export function phamViQuyet(p: Principal): number[] | null {
  const g = p.grants.filter((x) => x.permissions.has(PERMISSIONS.CLASS_EDIT));
  return g.some((x) => x.branchId === null) ? null : [...new Set(g.map((x) => x.branchId as number))];
}
const chiNhanhLop = (classId: number) => (db().prepare('SELECT branch_id FROM classes WHERE id = ?').get(classId) as any)?.branch_id as number | undefined;

/** `chiEm`: chỉ một em, không nhớ (Sửa — đọc lại sau khi đảo quyết định cũ trong cùng giao dịch). `cn`: chi nhánh lớp em đang học. `lop`: lớp em đang học. */
function tinhTapXetLai(today: string, o: { chiEm?: number; cn?: readonly number[] | null; lop?: number } = {}): EmXetLai[] {
  const { chiEm, cn, lop } = o;
  const conn = db();
  const lenh = conn.prepare(
    `SELECT l.id, l.student_id, l.huong, l.lop_nguon_id, l.lop_dich_id, l.tuan_bat_dau, l.trang_thai, l.ngay_ra_lenh, l.ly_do, l.nhan_xet_chung,
            u.full_name AS nguoi, s.full_name AS ten, cn.code AS nguon_code, cn.programme_code AS nguon_ct, cd.code AS dich_code,
            ch.id AS ht_id, ch.code AS ht_code, ch.is_fast_track AS ht_ft, ch.programme_code AS ht_ct, ch.branch_id AS ht_cn
       FROM lenh_chuyen_lop l
       JOIN classes cn ON cn.id = l.lop_nguon_id AND cn.is_fast_track = 0
       LEFT JOIN classes cd ON cd.id = l.lop_dich_id
       JOIN students s ON s.id = l.student_id AND ${HV_DANG_HOC_SQL('s')}
       JOIN enrollments e ON e.student_id = l.student_id AND e.status = 'active'
        AND e.class_id = CASE WHEN l.trang_thai = 'da_chuyen' THEN l.lop_dich_id ELSE l.lop_nguon_id END
       JOIN classes ch ON ch.id = e.class_id
       LEFT JOIN users u ON u.id = l.nguoi_ra_lenh
      WHERE l.boi_canh = 'cuoi-khoa' AND l.trang_thai IN ('cho', 'da_chuyen') AND l.huong IN ('len_lop', 'fast_track', 'hoc_lai')
        AND l.tuan_bat_dau >= date(?, '-${CUA_SO_NGAY} day')${chiEm ? ' AND l.student_id = ?' : ''}${cn ? ` AND ch.branch_id IN (${cn.map(() => '?').join(',')})` : ''}${lop ? ' AND ch.id = ?' : ''}
        AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop k WHERE k.student_id = l.student_id AND k.id > l.id AND k.trang_thai != 'huy'
                          AND NOT EXISTS (SELECT 1 FROM xet_lai_lo_trinh x WHERE x.lenh_id = l.id AND x.lenh_moi_id = k.id))`,
  ).all(today, ...(chiEm ? [chiEm] : []), ...(cn ?? []), ...(lop ? [lop] : [])) as any[];
  if (!lenh.length) return [];
  const sids = lenh.map((l) => l.student_id as number);
  /* Final mới nhất của em ở LỚP NGUỒN + mốc: điểm nhập / sửa cuối (giờ thật) và ngày nghiệp vụ ô cuối có điểm. */
  const nguonCua = new Map(lenh.map((l) => [l.student_id as number, l.lop_nguon_id as number]));
  /* MỘT câu: Final mới nhất của em ở mọi lớp (lọc lớp nguồn ở JS) + mốc (giờ thật điểm nhập / sửa cuối, ngày nghiệp vụ ô cuối có điểm) + Mini Test + Báo PH của TVV. */
  const finalCua = new Map<number, number>();
  const moc = new Map<number, { luc: string | null; ngay: string | null }>();
  const mini = new Map<number, any>();
  const ph = new Map<number, any>();
  theoLo(sids, (lo, q) => {
    for (const r of conn.prepare(
      `SELECT a.student_id, a.class_id, a.id,
              (SELECT MAX(sc.entered_at) FROM assessment_scores sc WHERE sc.attempt_id = a.id) AS moc_luc,
              (SELECT MAX(sc.nhap_dau_ngay) FROM assessment_scores sc WHERE sc.attempt_id = a.id) AS moc_ngay,
              m.id AS mt_id, m.ty_le AS mt_ty_le, m.ngay_lam AS mt_ngay_lam, m.ghi_luc AS mt_ghi_luc, m.so_buoi AS mt_so_buoi, m.ngay_du_kien AS mt_ngay_du_kien, m.nhom_bo_tro AS mt_nhom,
              b.performed_on AS ph_luc, b.note AS ph_note, COALESCE(u.full_name, b.performer_name) AS ph_tvv, b.id AS ph_id
         FROM assessment_attempts a
         LEFT JOIN mini_test m ON m.tu_attempt_id = a.id
         LEFT JOIN sos_coordination_actions b ON b.attempt_id = a.id AND b.kind = 'bao_ph_tvv' AND b.status = 'done'
         LEFT JOIN users u ON u.id = b.performed_by
        WHERE a.kind = 'final' AND a.status != 'cancelled' AND a.student_id IN (${q})
          AND a.id = (SELECT MAX(x.id) FROM assessment_attempts x WHERE x.student_id = a.student_id AND x.class_id = a.class_id AND x.kind = 'final' AND x.status != 'cancelled')`,
    ).all(...lo) as any[]) {
      if (nguonCua.get(r.student_id) !== r.class_id) continue;
      finalCua.set(r.student_id, r.id);
      moc.set(r.id, { luc: r.moc_luc ?? null, ngay: r.moc_ngay ?? null });
      if (r.mt_id) mini.set(r.id, { id: r.mt_id, ty_le: r.mt_ty_le, ngay_lam: r.mt_ngay_lam, ghi_luc: r.mt_ghi_luc, so_buoi: r.mt_so_buoi, ngay_du_kien: r.mt_ngay_du_kien, nhom_bo_tro: r.mt_nhom });
      if (r.ph_id) ph.set(r.id, { performed_on: r.ph_luc, note: r.ph_note, tvv: r.ph_tvv });
    }
  });
  const tyLe = tyLeTongLo([...finalCua.values()]);
  /* Quyết định Xét lại (mới nhất trước) + trạng thái lệnh mới. */
  const qd = new Map<number, any[]>();
  theoLo(lenh.map((l) => l.id as number), (lo, q) => {
    for (const r of conn.prepare(
      `SELECT x.*, u.full_name AS nguoi, lm.trang_thai AS lm_tt, lm.tuan_bat_dau AS lm_tuan, cm.code AS lm_code
         FROM xet_lai_lo_trinh x LEFT JOIN users u ON u.id = x.nguoi_id
         LEFT JOIN lenh_chuyen_lop lm ON lm.id = x.lenh_moi_id LEFT JOIN classes cm ON cm.id = lm.lop_dich_id
        WHERE x.lenh_id IN (${q}) ORDER BY x.id DESC`,
    ).all(...lo) as any[]) { if (!qd.has(r.lenh_id)) qd.set(r.lenh_id, []); qd.get(r.lenh_id)!.push(r); }
  });

  const out: EmXetLai[] = [];
  for (const l of lenh) {
    const fid = finalCua.get(l.student_id);
    const t = fid ? tyLe.get(fid) : undefined;
    const m = fid ? moc.get(fid) : undefined;
    const mt = fid ? mini.get(fid) : undefined;
    const ds = qd.get(l.id) ?? [];
    const quyet = ds.filter((x) => x.quyet_dinh);
    const suaDuoc = quyet[0] && CHUYEN.includes(quyet[0].quyet_dinh) && quyet[0].lm_tt === 'cho' ? quyet[0] : null;
    const ly = lyDoXetLai({
      huong: l.huong, tyLe: t?.tyLe ?? null, du: !!t?.du, ngayRaLenh: l.ngay_ra_lenh, mocFinal: m?.luc ?? null, ngayFinal: m?.ngay ?? null,
      miniTest: mt && mt.ty_le !== null ? { tyLe: mt.ty_le, luc: mt.ghi_luc ?? mt.ngay_lam } : null, quyetLuc: quyet[0]?.luc ?? null,
    });
    const lyDo = ly ?? (suaDuoc ? { ma: suaDuoc.ly_do_ma, chu: '', moc: suaDuoc.moc } : null);
    if (!lyDo) continue;
    const ct = t?.ct ?? l.nguon_ct ?? null;
    const goiY = t && t.tyLe !== null ? goiYCuoiKhoa({ ct, tyLe: t.tyLe, monTruot: t.monTruot, nguong: t.nguong }) : null;
    /* Hạn tính từ NGÀY của mốc mở dòng (điểm Final nhập / sửa cuối, ghi Mini Test) — dòng mở lại sau hạn có hạn mới. */
    const mo = ngayCuaMoc(lyDo.moc) ?? l.ngay_ra_lenh;
    const ngayMoc = lyDo.ma === 'd' && mt?.ngay_lam && mt.ngay_lam > mo ? mt.ngay_lam : mo;
    out.push({
      studentId: l.student_id, ten: l.ten, lenhId: l.id, lyDo: { ma: lyDo.ma, chu: ly?.chu ?? '', moc: lyDo.moc ?? '' }, ...(ly?.ma === 'd' && mt ? { miniTestId: mt.id } : {}),
      han: hanXetLai({ ma: lyDo.ma, tuanBatDau: l.tuan_bat_dau, moc: ngayMoc }),
      lopHienTai: { id: l.ht_id, code: l.ht_code, ft: !!l.ht_ft, ct: l.ht_ct ?? null, chiNhanhId: l.ht_cn },
      lopNguon: { id: l.lop_nguon_id, code: l.nguon_code, ct }, daThiHanh: l.trang_thai === 'da_chuyen', tuanBatDau: l.tuan_bat_dau,
      final: {
        tyLe: t?.tyLe ?? null,
        mon: (t?.mon ?? []).map((x) => ({ mon: ct ? tenMonNgan(ct, x.skill) : x.skill, pt: x.ratio === null ? null : Math.round(x.ratio * 100), dat: x.ratio !== null && x.ratio >= (t?.nguong ?? 0.7) })),
      },
      daChot: {
        huong: l.huong, chu: l.huong === 'hoc_lai' ? `Học lại ${kyHieuLop(ct, null) ?? ct ?? ''}`.trim() : l.huong === 'fast_track' ? 'Lên FT' : `Lên ${ct ? tenBacKe(ct as any) : ''}`.trim(),
        lopDich: l.dich_code ?? null, lopDichId: l.lop_dich_id ?? null, luc: l.ngay_ra_lenh, nguoi: l.nguoi ?? null, lyDo: l.ly_do ?? null,
      },
      goiY: goiY?.nhanHuong ?? null,
      phuHuynh: fid && ph.has(fid) ? { tvv: ph.get(fid).tvv ?? null, luc: ph.get(fid).performed_on ?? null, ketQua: ph.get(fid).note ?? null } : null,
      banGiaoGvcnCu: l.nhan_xet_chung ?? null,
      boTro: mt ? { mon: [], daHoc: 0, tong: mt.so_buoi, miniTest: { tyLe: mt.ty_le ?? null, ngayDuKien: mt.ngay_du_kien, ngayLam: mt.ngay_lam ?? null }, nhom: mt.nhom_bo_tro, ct } as any : null,
      nhanXetGvcnMoi: ds.find((x) => x.nhan_xet_gvcn_moi)?.nhan_xet_gvcn_moi ?? null,
      xetLaiTruoc: ly && quyet[0] ? { quyetDinh: quyet[0].quyet_dinh, chu: quyet[0].chu ?? null, tuDong: !!quyet[0].tu_dong, luc: quyet[0].luc, nguoi: quyet[0].nguoi ?? null } : null,
      quyetDinh: suaDuoc && !ly
        ? { id: suaDuoc.id, quyetDinh: suaDuoc.quyet_dinh, lopDich: suaDuoc.lm_code ?? null, tuan: suaDuoc.lm_tuan ?? null, luc: suaDuoc.luc, nguoi: suaDuoc.nguoi ?? null }
        : null,
    });
  }
  /* Bổ trợ Final: môn (chủ đề Case của nhóm) + số buổi đã học — một câu cho mọi nhóm. */
  const nhom = out.map((e) => (e.boTro as any)?.nhom).filter(Boolean) as string[];
  const monCua = new Map<string, Set<string>>(), hocCua = new Map<string, number>();
  theoLo([...new Set(nhom)], (lo, q) => {
    for (const r of conn.prepare(
      `SELECT iv.nhom_bo_tro AS nhom, sc.topic, (SELECT COALESCE(SUM(f.so_buoi), 0) FROM case_followups f WHERE f.intervention_id = iv.id) AS n
         FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.nhom_bo_tro IN (${q})`,
    ).all(...lo) as any[]) {
      if (!monCua.has(r.nhom)) monCua.set(r.nhom, new Set());
      if (r.topic) monCua.get(r.nhom)!.add(r.topic);
      hocCua.set(r.nhom, (hocCua.get(r.nhom) ?? 0) + Number(r.n));
    }
  });
  for (const e of out) {
    const b = e.boTro as any;
    if (!b) continue;
    e.boTro = { mon: [...(monCua.get(b.nhom) ?? [])].map((k) => (b.ct ? tenMonNgan(b.ct, k) : k)), daHoc: Math.min(hocCua.get(b.nhom) ?? 0, b.tong), tong: b.tong, miniTest: b.miniTest };
  }
  const hang = (e: EmXetLai) => (e.lyDo.ma === 'a' || e.lyDo.ma === 'd' ? 0 : 1);   // đỏ (dưới 50 % / Mini Test) trước — mockup khung 2
  return out.sort((a, b) => hang(a) - hang(b) || a.ten.localeCompare(b.ten, 'vi'));
}

/** Quyết được: QL / Quản trị chi nhánh lớp em ĐANG học (`class.edit` lớp đó — cùng quyền ra lệnh). */
const quyetDuoc = (p: Principal, lopId: number) => coTheRaLenh(p, lopId);
const CHI_QL = 'Chỉ Quản lý chi nhánh của lớp em đang học mới xét lại lộ trình.';

/** Việc QL: một dòng mỗi lớp em đang học (chỉ dòng CHƯA quyết), hạn sớm nhất. Cùng tập với GET panel. */
export function emXetLaiLoTrinh(p: Principal, branchId: number | null, today: string): LopXetLai[] {
  const theoLop = new Map<number, LopXetLai>();
  const pv = phamViQuyet(p);
  for (const e of tapXetLai(today, branchId ? (pv && !pv.includes(branchId) ? [] : [branchId]) : pv)) {
    if (e.quyetDinh || !quyetDuoc(p, e.lopHienTai.id)) continue;
    const g = theoLop.get(e.lopHienTai.id) ?? { lopId: e.lopHienTai.id, code: e.lopHienTai.code, han: e.han, em: [] };
    g.em.push(e);
    if (e.han < g.han) g.han = e.han;
    theoLop.set(g.lopId, g);
  }
  return [...theoLop.values()].sort((a, b) => a.code.localeCompare(b.code, 'vi'));
}

/**
 * GET /classes/:id/xet-lai — panel. QL lớp đó: đủ dòng + lớp Học lại (chương trình cũ) / Lên (bậc kế · FT, dòng (c)), cùng chi nhánh. GVCN lớp ĐÍCH
 * (em đã vào lớp này): chỉ xem, không gợi ý / phụ huynh / lý do chốt / bàn giao (`chiXem`) + ô nhận xét. Người khác: `em: []` (không 403 — như đường cũ).
 * `studentId`: chỉ em đó (lối vào từ hồ sơ HV).
 */
export function xemXetLai(p: Principal, classId: number, studentId: number | null, today = demoToday()) {
  const lop = db().prepare('SELECT id, code, branch_id, is_fast_track FROM classes WHERE id = ?').get(classId) as any;
  if (!lop) throw notFound('Không tìm thấy lớp');
  const ql = quyetDuoc(p, classId);
  const gvcn = !ql && isCoreTeacherOf(p, classId);
  /* Một em / một lớp: tính đúng phạm vi đó (không cả chi nhánh); dòng quá hạn rời tập như `tapXetLai`. */
  const tap = ql || gvcn
    ? tinhTapXetLai(today, studentId ? { chiEm: studentId } : { lop: classId }).filter((e) => e.lopHienTai.id === classId && (!!e.quyetDinh || e.han >= today))
    : [];
  const em: EmXetLai[] = ql ? tap : tap.filter((e) => e.daChot.lopDichId === classId).map((e) => ({
    ...e, goiY: null, phuHuynh: null, banGiaoGvcnCu: null, daChot: { ...e.daChot, lyDo: null }, coTheNhanXet: true,
  }));
  const lopHocLai: Record<string, { id: number; code: string; phu: string }[]> = {};
  const lopLen: Record<string, { id: number; code: string; phu: string }[]> = {};
  const ctCu = [...new Set(em.map((e) => e.lopNguon.ct).filter(Boolean))] as string[];
  if (ql && ctCu.length) {
    const ds = danhSachLopDich(classId, true).lop.filter((x) => x.chiNhanhId === lop.branch_id);
    const chon = (f: (x: (typeof ds)[number]) => boolean) => ds.filter(f)
      .map((x) => ({ id: x.id, code: x.code, ft: !!x.ft, phu: [x.ft ? `FT${x.route ? ` ${x.route}` : ''}` : x.ma, x.branchCode, x.tuan ? `tuần ${x.tuan.slice(1).split('/')[0]}` : null, `${(x as any).siSo ?? 0} em`].filter(Boolean).join(' · ') }));
    for (const ct of ctCu) {
      lopHocLai[ct] = chon((x) => x.ma === ct && !x.ft);
      if (em.some((e) => e.lopNguon.ct === ct && e.lyDo.ma === 'c')) lopLen[ct] = chon((x) => x.ft || x.ma === NORMAL_LADDER[ct as ProgrammeCode]);
    }
  }
  const nguon = em[0]?.lopNguon ?? null;
  return {
    lop: { id: lop.id, code: lop.code, ft: !!lop.is_fast_track }, chiXem: !ql, han: em.reduce<string | null>((h, e) => (!e.quyetDinh && (!h || e.han < h) ? e.han : h), null),
    nguon: nguon && { code: nguon.code }, em, lopHocLai, lopLen,
  };
}

export type MucXetLai = {
  studentId: number; quyetDinh: QuyetXetLai; toClassId?: number | null; tuan?: string | null; lyDo?: string | null; trangThai?: 'inactive' | 'finished'; suaId?: number | null;
  /** Lên FT (dòng (c)) mà em chưa có Target — ô Target / KCK tại thẻ (`canHoiTarget`). */ mucTieu?: MucTieuLenh | null;
};
export const LO_XET_LAI = 10;   // một lời gọi ≤ 10 em (web chia lô — Học lại một em ~70–125 câu khi "Ngay hôm nay")

function docMuc(x: any): MucXetLai {
  const sid = Number(x?.studentId);
  if (!Number.isInteger(sid) || sid <= 0) throw badRequest('Học viên không hợp lệ.');
  if (!['tiep_tuc', 'hoc_lai', 'len', 'dung'].includes(x?.quyetDinh)) throw badRequest('Chọn Tiếp tục, Học lại hoặc Tạm dừng/ Kết thúc học.');
  const so = (v: unknown, ten: string) => {
    if (v == null) return null;
    if (typeof v !== 'number' || !Number.isInteger(v) || v <= 0) throw loi(400, '{ten} không hợp lệ.', { ten });
    return v;
  };
  if (x.tuan != null && !isIsoDate(x.tuan)) throw badRequest('Tuần bắt đầu không hợp lệ.');
  return {
    studentId: sid, quyetDinh: x.quyetDinh, toClassId: so(x.toClassId, 'Lớp'), tuan: x.tuan ?? null,
    lyDo: chuTuDo(x.lyDo, 'Lý do', 2000) ?? null, trangThai: x.trangThai === 'finished' ? 'finished' : 'inactive',
    suaId: so(x.suaId, 'Quyết định cần sửa'), mucTieu: soHoacKck(x.mucTieu),
  };
}

/**
 * POST /classes/:id/xet-lai — lô ≤ LO_XET_LAI em. Mỗi em một savepoint: em lỗi vào `failed` (giữ dòng, giữ lựa chọn ở web), em khác vẫn lưu.
 * Sửa (`suaId` = quyết định trước của em): đảo quyết định đó rồi ghi quyết định mới — cùng giao dịch, lỗi thì quyết định cũ còn nguyên.
 */
export function luuXetLai(p: Principal, classId: number, itemsVao: unknown) {
  if (!Array.isArray(itemsVao) || !itemsVao.length) throw badRequest('Chưa chọn học viên nào.');
  if (itemsVao.length > LO_XET_LAI) throw loi(400, 'Tối đa {LO_XET_LAI} học viên một lần.', { LO_XET_LAI });
  if (!quyetDuoc(p, classId)) throw forbidden(CHI_QL);
  const items = itemsVao.map(docMuc);
  if (new Set(items.map((x) => x.studentId)).size !== items.length) throw badRequest('Mỗi học viên chỉ một quyết định trong một lần lưu.');
  const today = demoToday();
  const cn = chiNhanhLop(classId);
  const tap = new Map(tapXetLai(today, cn === undefined ? [] : [cn]).filter((e) => e.lopHienTai.id === classId).map((e) => [e.studentId, e]));
  const ok: { studentId: number; id: number; chu: string; daChuyen: boolean }[] = [];
  const failed: { studentId: number; message: string }[] = [];
  for (const it of items) {
    try {
      ok.push(tx(() => {
        /* Sửa: quyết định cũ đảo lại, giữ trong dòng mới (`quyet_cu`) — Hoàn tác lần Sửa trả lại đúng nó. */
        const cu = it.suaId ? daoQuyet(p, it.suaId, it.studentId) : null;
        const e = it.suaId ? tinhTapXetLai(today, { chiEm: it.studentId }).find((x) => x.lopHienTai.id === classId) : tap.get(it.studentId);
        if (!e || e.quyetDinh) throw new HttpError(409, 'Em không còn cần xét lại.');
        return motEm(p, e, it, today, classId, cu && JSON.stringify(cu));
      }));
    } catch (err) {
      if (!(err instanceof HttpError) || err.status >= 500) throw err;
      failed.push({ studentId: it.studentId, message: err.message });
    }
  }
  return { ok, failed };
}

function motEm(p: Principal, e: EmXetLai, it: MucXetLai, today: string, classId: number, quyetCu: string | null = null): { studentId: number; id: number; chu: string; daChuyen: boolean } {
  const conn = db();
  const cot = { lenhMoi: null as number | null, lenhCu: null as string | null, chu: '', daChuyen: false };
  if (it.quyetDinh === 'tiep_tuc') {
    if (e.lyDo.ma === 'a' && !it.lyDo) throw badRequest('Ghi lý do ngắn');   // khác gợi ý (Final < 50 %) — `khacGoiY`
    cot.chu = e.daThiHanh ? `Tiếp tục ${e.lopHienTai.ft ? 'FT' : kyHieuLop(e.lopHienTai.ct, null) ?? e.lopHienTai.code}` : `Giữ ${e.daChot.chu}`;
  } else if (it.quyetDinh === 'hoc_lai' || it.quyetDinh === 'len') {
    const len = it.quyetDinh === 'len';
    if (len && e.lyDo.ma !== 'c') throw badRequest('Lên lớp chỉ dùng cho em đang học lại mà Final từ 60 %.');
    const dich = it.toClassId ? lopDichHopLe(it.toClassId, e.lopHienTai.id) : null;
    if (!dich) throw badRequest(len ? 'Chọn lớp' : 'Chọn lớp học lại');
    const ke = NORMAL_LADDER[e.lopNguon.ct as ProgrammeCode] ?? null;
    const dung = len ? (!!dich.is_fast_track || dich.programme_code === ke) : (dich.programme_code === e.lopNguon.ct && !dich.is_fast_track);
    if (!dung || dich.branch_id !== e.lopHienTai.chiNhanhId) {
      throw badRequest(len ? `Lớp phải là lớp ${ke ?? ''} hoặc FT cùng chi nhánh.` : `Lớp học lại phải là lớp ${e.lopNguon.ct ?? ''} cùng chi nhánh.`);
    }
    if (!it.tuan || !tuanHopLe(it.tuan, today)) throw badRequest('Chọn tuần bắt đầu.');
    const enr = lopHienTaiCua(e.studentId);
    const { boiCanh, huong } = huongChuyenMotEm(enr, dich);
    /* Em đang có lệnh `cho` (lệnh Cuối khoá chưa thi hành, hoặc lệnh của một quyết định Xét lại trước) → `raLenh` SỬA chính lệnh đó: chụp nguyên trạng
       để Hoàn tác trả lại (không huỷ lệnh không phải của quyết định này). */
    const cho = conn.prepare(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`).get(e.studentId) as any;
    const anh = cho ? chupLenh(cho.id) : null;
    const nhan = len ? `Lên ${dich.is_fast_track ? 'FT' : kyHieuLop(ke, null) ?? ke ?? ''}` : `Học lại ${kyHieuLop(e.lopNguon.ct, null) ?? e.lopNguon.ct ?? ''}`;
    const r = raLenh(p, { lopNguonId: enr.class_id, boiCanh, tuanChung: null, dongs: [{ studentId: e.studentId, huong, toClassId: dich.id, tuan: it.tuan, mucTieu: it.mucTieu ?? null, lyDo: it.lyDo || `Xét lại lộ trình: ${nhan}` }] });
    if (r.failed.length) throw badRequest(r.failed[0].message);
    /* `lenhSau` = dòng lệnh ngay sau lần sửa này: Hoàn tác chỉ khi lệnh chưa bị đổi tiếp (ở Chuyển lớp…). */
    if (anh) cot.lenhCu = JSON.stringify({ ...anh, jeSau: maxId('journey_events'), lenhSau: conn.prepare('SELECT * FROM lenh_chuyen_lop WHERE id = ?').get(cho.id) });
    cot.daChuyen = r.daChuyen.includes(e.studentId);
    cot.lenhMoi = (conn.prepare(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai IN ('cho', 'da_chuyen') ORDER BY id DESC LIMIT 1`).get(e.studentId) as any).id;
    cot.chu = `${nhan} → ${dich.code}`;
  } else {
    if (!it.lyDo) throw badRequest('Ghi lý do ngắn');
    cot.chu = it.trangThai === 'finished' ? 'Kết thúc học' : 'Tạm dừng';
    /* RA-LUONG-16: lệnh chuyển lớp chưa thi hành của em → huỷ cùng quyết định (trước đây treo: bàn giao, "Sắp nhận" vẫn chạy cho em đã nghỉ); Hoàn tác khôi phục lệnh. */
    const cho = conn.prepare(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`).get(e.studentId) as any;
    if (cho) { huyLenh(p, cho.id, `Xét lại lộ trình: ${cot.chu}`); cot.lenhCu = JSON.stringify({ huyId: cho.id }); }
    setStudentStatus(p, e.studentId, it.trangThai ?? 'inactive', today, it.lyDo);
  }
  const id = Number(conn.prepare(
    `INSERT INTO xet_lai_lo_trinh (student_id, lenh_id, lop_id, ly_do_ma, moc, quyet_dinh, chu, lenh_moi_id, lenh_cu, quyet_cu, ly_do_text, tu_dong, nguoi_id, luc) VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?,?)`,
  ).run(e.studentId, e.lenhId, classId, e.lyDo.ma, e.lyDo.moc, it.quyetDinh, cot.chu, cot.lenhMoi, cot.lenhCu, quyetCu, it.lyDo ?? null, p.userId, nowIso()).lastInsertRowid);
  ghiHanhTrinh(p.userId, e, id, `QL xét lại: ${cot.chu}`, today);
  writeAudit({ actorUserId: p.userId, action: 'xet_lai.quyet', entityType: 'student', entityId: e.studentId, entityLabel: e.ten,
    after: { quyetDinh: it.quyetDinh, lyDo: e.lyDo.ma, lenhId: e.lenhId, lenhMoiId: cot.lenhMoi, ghiChu: it.lyDo ?? null } });
  return { studentId: e.studentId, id, chu: cot.chu, daChuyen: cot.daChuyen };
}

const maxId = (bang: 'journey_events') => Number((db().prepare(`SELECT COALESCE(MAX(id), 0) AS m FROM ${bang}`).get() as any).m);

/** Ảnh nguyên trạng trước khi `raLenh` sửa lệnh chưa thi hành: dòng lệnh · phiếu bàn giao môn (`lam_lai`) · Lộ trình tiếp theo · mốc id Hành trình. */
function chupLenh(lenhId: number) {
  const conn = db();
  const lenh = conn.prepare('SELECT * FROM lenh_chuyen_lop WHERE id = ?').get(lenhId) as any;
  return {
    lenh,
    bg: conn.prepare('SELECT id, lam_lai FROM ban_giao_mon WHERE lenh_id = ?').all(lenhId),
    ltt: conn.prepare('SELECT * FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?').get(lenh.student_id, lenh.lop_nguon_id) ?? null,
    je: maxId('journey_events'),
  };
}

/**
 * Hoàn tác / Sửa Học lại khi lệnh chưa thi hành: trả NGUYÊN dòng lệnh (hướng, lớp, tuần, Target, xác nhận bàn giao GVCN, hạn…), `lam_lai` của phiếu môn,
 * Lộ trình tiếp theo; xoá Hành trình của em do lần sửa sinh (khoảng id đã chụp). Chuông: bỏ "Cần làm lại bàn giao" của chính lần sửa (khoá theo giờ sửa),
 * "Sắp nhận" của lớp chuyển đến cũ / mới đếm lại từ bảng lệnh (`thongBaoSapNhan`). Lệnh đã bị đổi tiếp sau quyết định (Chuyển lớp…) → 409.
 */
const COT_XET_LAI = ['huong', 'lop_dich_id', 'tuan_bat_dau', 'ly_do', 'muc_tieu', 'trang_thai'] as const;
function khoiPhucLenh(p: Principal, anh: any): void {
  const conn = db();
  const { id, ...cot } = anh.lenh;
  const hien = conn.prepare('SELECT * FROM lenh_chuyen_lop WHERE id = ?').get(id) as any;
  if (!hien || hien.trang_thai !== 'cho') throw conflict('Quyết định chuyển lớp vừa được thi hành hoặc đã huỷ.');
  /* Chỉ trường quyết định Xét lại đặt ra — bàn giao (xác nhận, hạn) hay cron (`loi`, `thu_ngay`) đổi dòng không chặn Hoàn tác. */
  if (anh.lenhSau && COT_XET_LAI.some((k) => hien[k] !== anh.lenhSau[k])) throw conflict('Quyết định đã đổi ở Chuyển lớp — dùng Chuyển lớp.');
  const ten = Object.keys(cot);
  conn.prepare(`UPDATE lenh_chuyen_lop SET ${ten.map((k) => `${k} = ?`).join(', ')} WHERE id = ? AND trang_thai = 'cho'`).run(...ten.map((k) => cot[k]), id);
  for (const b of anh.bg) conn.prepare('UPDATE ban_giao_mon SET lam_lai = ? WHERE id = ?').run(b.lam_lai, b.id);
  if (anh.ltt) {
    const { id: lid, ...l } = anh.ltt;
    const k = Object.keys(l);
    conn.prepare(`UPDATE lo_trinh_tiep_theo SET ${k.map((x) => `${x} = ?`).join(', ')} WHERE id = ?`).run(...k.map((x) => l[x]), lid);
  } else conn.prepare('DELETE FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?').run(cot.student_id, cot.lop_nguon_id);
  conn.prepare('DELETE FROM journey_events WHERE student_id = ? AND id > ? AND id <= ?').run(cot.student_id, anh.je, anh.jeSau);
  if (hien.sua_luc) conn.prepare(`DELETE FROM notifications WHERE kind = 'lam_lai_ban_giao' AND dedup_key = ?`).run(`lam_lai_ban_giao:${cot.lop_nguon_id}:${hien.sua_luc}`);
  tinhLaiSapNhan(p, cot.lop_nguon_id, [cot.lop_dich_id, hien.lop_dich_id]);
  /* MT0 + bổ trợ Final theo lệnh vừa trả lại — chỉ lệnh Cuối khoá từ lớp thường (lệnh giữa khoá của quyết định trước thì không, như `huyMotLenh`). */
  const ma = cot.boi_canh === 'cuoi-khoa'
    ? (conn.prepare('SELECT programme_code FROM classes WHERE id = ? AND is_fast_track = 0').get(cot.lop_nguon_id) as any)?.programme_code as ProgrammeCode | undefined : undefined;
  if (ma) {
    dongBoMt0(p.userId, [{ studentId: cot.student_id, classId: cot.lop_nguon_id, ma, huong: cot.huong, mucTieu: cot.muc_tieu ?? null }]);
    dongBoCheTaiFinal(p, cot.lop_nguon_id, [cot.student_id]);
  }
}

/**
 * "Sắp nhận n em" hôm nay của từng lớp chuyển đến (của lớp nguồn này) theo bảng lệnh: còn em → cùng chuông cập nhật số; hết em → bỏ chuông hôm nay
 * (chuông ngày trước giữ nguyên, như `raLenh`). Chuông dùng chung của em khác vẫn còn, chỉ đổi số.
 */
function tinhLaiSapNhan(p: Principal, nguonId: number, dichIds: readonly (number | null)[]): void {
  const conn = db();
  const homNay = demoToday();
  const con: number[] = [];
  const dich = new Map<number, any>();
  for (const id of new Set(dichIds.filter((x): x is number => !!x))) {
    const khoa = `sap_nhan:${id}:${nguonId}:${homNay}`;
    const n = Number((conn.prepare(`SELECT COUNT(*) AS n FROM lenh_chuyen_lop WHERE lop_nguon_id = ? AND lop_dich_id = ? AND (trang_thai = 'cho' OR (trang_thai = 'da_chuyen' AND tuan_bat_dau = ?))`)
      .get(nguonId, id, homNay) as any).n);
    if (!n) { conn.prepare(`DELETE FROM notifications WHERE kind = 'sap_nhan' AND dedup_key = ?`).run(khoa); continue; }
    if (!conn.prepare(`SELECT 1 FROM notifications WHERE kind = 'sap_nhan' AND dedup_key = ? LIMIT 1`).get(khoa)) continue;
    con.push(id);
    dich.set(id, conn.prepare('SELECT id, code, branch_id FROM classes WHERE id = ?').get(id));
  }
  if (con.length) thongBaoSapNhan(p, conn.prepare('SELECT * FROM classes WHERE id = ?').get(nguonId), con, dich, homNay);
}

/** Hành trình: "QL xét lại: Học lại FOU" · (đã lên BE 17/09 · Final 46 %). Hoàn tác xoá theo khoá. */
function ghiHanhTrinh(nguoi: number | null, e: EmXetLai, id: number, title: string, today: string) {
  const detail = [`đã ${e.daChot.huong === 'hoc_lai' ? 'học lại' : `lên ${e.daChot.huong === 'fast_track' ? 'FT' : e.daChot.chu.replace(/^Lên /, '')}`} ${ngayNgan(e.daChot.luc)}`,
    e.final.tyLe !== null ? `Final ${chuTyLeXetLai(e.final.tyLe)}` : null].filter(Boolean).join(' · ');
  addJourney({ studentId: e.studentId, eventType: 'xet_lai', eventDate: today, title, detail, refTable: 'xet_lai_lo_trinh', refId: id, createdBy: nguoi, dedupKey: `xet_lai:${id}` });
}

/** Quyết định đã đảo, đủ để ghi lại y như cũ (Hoàn tác một lần Sửa). */
type QuyetCu = { lopId: number; nguoiId: number | null; luc: string; quyetCu: string | null; muc: MucXetLai };

/** Đảo MỘT quyết định (Hoàn tác / Sửa) trong tx nơi gọi, trả quyết định đó. Học lại mà lệnh mới đã thi hành → 409 (đã chuyển, dùng Chuyển lớp). */
function daoQuyet(p: Principal, id: number, studentId?: number): QuyetCu {
  const conn = db();
  const x = conn.prepare(`SELECT x.*, lm.trang_thai AS lm_tt, lm.lop_dich_id AS lm_dich, lm.tuan_bat_dau AS lm_tuan, lm.muc_tieu AS lm_mt, lm.khong_cam_ket AS lm_kck
      FROM xet_lai_lo_trinh x LEFT JOIN lenh_chuyen_lop lm ON lm.id = x.lenh_moi_id WHERE x.id = ? AND x.quyet_dinh IS NOT NULL AND x.tu_dong = 0`).get(id) as any;
  if (!x || (studentId !== undefined && x.student_id !== studentId)) throw notFound('Không tìm thấy quyết định xét lại.');
  if (!quyetDuoc(p, x.lop_id)) throw forbidden(CHI_QL);   // quyền theo lớp LÚC QUYẾT (em có thể đã đổi lớp)
  if (CHUYEN.includes(x.quyet_dinh)) {
    if (x.lm_tt !== 'cho') throw new HttpError(409, 'Em đã chuyển lớp — dùng Chuyển lớp để đổi.');
    if (x.lenh_cu) khoiPhucLenh(p, JSON.parse(x.lenh_cu));
    else huyLenh(p, x.lenh_moi_id, 'Hoàn tác xét lại lộ trình');
  } else if (x.quyet_dinh === 'dung') {
    /* Đảo đúng việc quyết định này đã làm; em đã sang trạng thái khác (người khác đổi) → không đảo việc của người khác. */
    const quyet = x.chu === 'Kết thúc học' ? 'finished' : 'inactive';
    const st = (conn.prepare('SELECT status FROM students WHERE id = ?').get(x.student_id) as any)?.status;
    if (st !== quyet) throw conflict('Trạng thái học viên đã đổi sau quyết định — sửa ở hồ sơ học viên.');
    if (quyet === 'finished') hoanTacKetThuc(p, x.student_id); else hoanTacTamDung(p, x.student_id);
    const huyId = x.lenh_cu ? JSON.parse(x.lenh_cu).huyId : null;
    if (huyId) { const r = khoiPhucLenhHuy(p, [huyId]); if (r.failed.length) throw conflict(r.failed[0].message); }
  }
  conn.prepare('DELETE FROM journey_events WHERE dedup_key = ?').run(`xet_lai:${id}`);
  conn.prepare('DELETE FROM xet_lai_lo_trinh WHERE id = ?').run(id);
  writeAudit({ actorUserId: p.userId, action: 'xet_lai.hoan_tac', entityType: 'student', entityId: x.student_id, before: { quyetDinh: x.quyet_dinh, lenhMoiId: x.lenh_moi_id } });
  return {
    lopId: x.lop_id, nguoiId: x.nguoi_id ?? null, luc: x.luc, quyetCu: x.quyet_cu ?? null,
    muc: {
      studentId: x.student_id, quyetDinh: x.quyet_dinh, toClassId: x.lm_dich ?? null, tuan: x.lm_tuan ?? null, lyDo: x.ly_do_text ?? null,
      trangThai: x.chu === 'Kết thúc học' ? 'finished' : 'inactive', mucTieu: x.lm_dich ? ghepMucTieu(x.lm_mt ?? null, !!x.lm_kck) : null,
    },
  };
}

/** Hoàn tác một lần Sửa: ghi lại quyết định trước Sửa (cùng người, cùng giờ quyết) — trong tx nơi gọi. */
function traLaiQuyetCu(p: Principal, cu: QuyetCu): void {
  const today = demoToday();
  const e = tinhTapXetLai(today, { chiEm: cu.muc.studentId }).find((x) => x.lopHienTai.id === cu.lopId);
  if (!e || e.quyetDinh) throw conflict('Không trả lại được quyết định trước khi Sửa — em đã đổi lớp.');
  const r = motEm(p, e, cu.muc, today, cu.lopId, cu.quyetCu);
  db().prepare('UPDATE xet_lai_lo_trinh SET nguoi_id = ?, luc = ? WHERE id = ?').run(cu.nguoiId, cu.luc, r.id);
}

/** POST /classes/:id/xet-lai/hoan-tac `{ ids }` — Hoàn tác (10 s ở web). Mỗi quyết định một savepoint. */
export function hoanTacXetLai(p: Principal, classId: number, idsVao: unknown) {
  if (!Array.isArray(idsVao) || !idsVao.length || idsVao.length > LO_XET_LAI) throw badRequest('Danh sách hoàn tác không hợp lệ.');
  if (!quyetDuoc(p, classId)) throw forbidden(CHI_QL);
  const ok: number[] = [];
  const failed: { id: number; message: string }[] = [];
  for (const id of [...new Set(idsVao.map(Number))]) {
    try {
      if (!Number.isInteger(id) || id <= 0) throw badRequest('Danh sách hoàn tác không hợp lệ.');
      tx(() => { const x = daoQuyet(p, id); if (x.quyetCu) traLaiQuyetCu(p, JSON.parse(x.quyetCu)); }); ok.push(id);
    } catch (err) { if (!(err instanceof HttpError) || err.status >= 500) throw err; failed.push({ id, message: err.message }); }
  }
  return { ok, failed };
}

/** GVCN lớp ĐÍCH (lớp mới em đã vào): một nhận xét, không bắt buộc, không thành việc. Ghi vào dòng nhận xét (quyet_dinh NULL) của lệnh. */
export function ghiNhanXetGvcnMoi(p: Principal, classId: number, studentId: number, chu: unknown) {
  const cn = chiNhanhLop(classId);
  const e = tapXetLai(demoToday(), cn === undefined ? [] : [cn]).find((x) => x.lopHienTai.id === classId && x.studentId === studentId);
  if (!e || e.daChot.lopDichId !== classId || !isCoreTeacherOf(p, classId)) throw forbidden('Chỉ GVCN lớp mới của em ghi được nhận xét này.');
  const nd = chuTuDo(chu, 'Nhận xét', 1000) ?? null;
  return tx(() => {
    const conn = db();
    const r = conn.prepare(`UPDATE xet_lai_lo_trinh SET nhan_xet_gvcn_moi = ?, nguoi_id = ?, luc = ? WHERE lenh_id = ? AND quyet_dinh IS NULL`).run(nd, p.userId, nowIso(), e.lenhId);
    if (!r.changes) conn.prepare(`INSERT INTO xet_lai_lo_trinh (student_id, lenh_id, nhan_xet_gvcn_moi, nguoi_id, luc) VALUES (?,?,?,?,?)`).run(studentId, e.lenhId, nd, p.userId, nowIso());
    writeAudit({ actorUserId: p.userId, action: 'xet_lai.nhan_xet', entityType: 'student', entityId: studentId, entityLabel: e.ten, after: { nhanXet: nd } });
    return { nhanXet: nd };
  });
}

/**
 * Hết hạn → tự ghi "Tiếp tục" (`tu_dong = 1`, Hành trình "… · tự giữ (hết hạn xét lại)"). Gọi từ `tapXetLai` (quét khi đọc) và cron Chủ nhật
 * (`quetXetLaiHetHan`). Chạy lặp không ghi trùng (chỉ mục duy nhất theo mốc; dòng đã ghi rời tập). Em đã chuyển / thôi học trước hạn không còn trong tập.
 */
function tuGiu(het: readonly EmXetLai[], today: string): number {
  return tx(() => {
    const conn = db();
    let n = 0;
    for (const e of het) {
      const chu = e.daThiHanh ? `Tiếp tục ${e.lopHienTai.ft ? 'FT' : kyHieuLop(e.lopHienTai.ct, null) ?? e.lopHienTai.code}` : `Giữ ${e.daChot.chu}`;
      const r = conn.prepare(
        `INSERT INTO xet_lai_lo_trinh (student_id, lenh_id, lop_id, ly_do_ma, moc, quyet_dinh, chu, tu_dong, ly_do_text, luc) VALUES (?,?,?,?,?, 'tiep_tuc', ?, 1, 'Tự giữ · hết hạn xét lại', ?)
         ON CONFLICT (student_id, lenh_id, moc) WHERE tu_dong = 1 DO NOTHING`,
      ).run(e.studentId, e.lenhId, e.lopHienTai.id, e.lyDo.ma, e.lyDo.moc, chu, nowIso());
      if (!r.changes) continue;
      n += 1;
      ghiHanhTrinh(null, e, Number(r.lastInsertRowid), `QL xét lại: ${chu} · tự giữ (hết hạn xét lại)`, today);
    }
    return n;
  });
}

/** Cron (`chotVangDinhKy`): một lượt quét mọi chi nhánh — trả số em còn dòng sau quét. */
export const quetXetLaiHetHan = (today = demoToday()): number => tapXetLai(today, null, true).length;
