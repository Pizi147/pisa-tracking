/**
 * LÕI HỘP CHỜ DUYỆT (PR-DUYET, T41, §5.5, Q-D) — tạo · chốt · danh sách · duyệt / từ chối / trả lời · quét.
 *
 * Bảng `yeu_cau_duyet` là HỘP THƯ (Q1): bảng nguồn của từng luồng vẫn là sự thật; thẻ chốt cùng giao dịch với nguồn qua
 * `chotYeuCau` (idempotent — `WHERE trang_thai = 'cho'`, lần hai trả 0, không ném, không báo lần hai). Luật riêng của từng loại
 * nằm ở `loaiYeuCau.ts` (giao kèo). Thẻ "chết" đóng bằng QUÉT KHI ĐỌC (Q2), không có tiến trình nền.
 */
import { db, tx } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, forbidden, notFound, nowIso, addDays, todayInBusinessTz } from '../util.ts';
import { can, napTruocPhamVi, require_, type Principal } from '../permissions.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import {
  PERMISSIONS, LOAI_YC_META, PHAN_LOAI_LABEL, demHop, duongHoSoHocVien, hanDuyetMacDinh, laPhanLoai, laTuDuyet, sapThe,
  type DemYeuCau, type LoaiYcMeta, type LoaiYeuCau, type PhanLoai, type TheYeuCauDto,
} from '../../../shared/domain/index.ts';
import { DINH_NGHIA_LOAI, dinhNghiaCua, type NguCanhThe, type YeuCauRow } from './loaiYeuCau.ts';

const P_DUYET = PERMISSIONS.REQUEST_APPROVE;
/** "Đã xử lý" trong hộp và "bị từ chối" ở Tổng quan GV nhìn lại 30 ngày; "Yêu cầu của tôi" 60 ngày. */
const NGAY_DA_XU_LY = 30;
const NGAY_CUA_TOI = 60;
const DO_DAI_LY_DO = 3;

/**
 * MỐC GỬI / MỐC XỬ LÝ của thẻ theo NGÀY NGHIỆP VỤ. Bản chính (ngày nghiệp vụ = hôm nay) → giờ thật. Bản demo (ngày demo cố định,
 * khác đồng hồ) → ngày demo + GIỜ THẬT theo giờ Việt Nam: thẻ không ghi "đề xuất 29/09" giữa ngày demo 14/09, lọc 30/60 ngày tính
 * đúng, và các thẻ vẫn có thứ tự thật trong ngày (Đã xử lý mới trước).
 */
export function mocNghiepVu(): string {
  const ngay = demoToday();
  if (ngay === todayInBusinessTz()) return nowIso();
  const gioVN = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(11, 23);
  return new Date(`${ngay}T${gioVN}+07:00`).toISOString();
}

function metaCua(loai: string): LoaiYcMeta {
  const m = (LOAI_YC_META as Record<string, LoaiYcMeta>)[loai];
  if (!m) throw new Error(`Loại yêu cầu chưa khai báo: ${loai}`);
  return m;
}
const ctxThe = (y: { lop_id: number | null; hoc_vien_id: number | null; chi_nhanh_id: number | null }) =>
  ({ classId: y.lop_id, studentId: y.hoc_vien_id, branchId: y.chi_nhanh_id });
const tenHocVien = (conn: any, id: number | null) =>
  id == null ? null : ((conn.prepare('SELECT full_name FROM students WHERE id = ?').get(id) as any)?.full_name ?? null) as string | null;

/** Người nhận thông báo của hộp: Quản lý chi nhánh (kể cả QL toàn hệ thống) + Quản trị (trừ khi `chiQuanLy`). Tài khoản đã xoá thì bỏ. */
function nguoiNhanHop(conn: any, chiNhanhId: number | null, chiQuanLy = false): number[] {
  return (conn.prepare(
    `SELECT DISTINCT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
      WHERE u.deleted_at IS NULL AND ur.status = 'active'
        AND ((r.key = 'manager' AND (ur.branch_id IS NULL OR ur.branch_id = ?)) OR (? = 0 AND r.key = 'system_admin'))`,
  ).all(chiNhanhId ?? -1, chiQuanLy ? 1 : 0) as any[]).map((r) => r.id as number);
}
function quanTri(conn: any): number[] {
  return (conn.prepare(
    `SELECT DISTINCT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
      WHERE u.deleted_at IS NULL AND ur.status = 'active' AND r.key = 'system_admin'`,
  ).all() as any[]).map((r) => r.id as number);
}

// ------------------------------------------------------------------------------------------------ tạo, chốt

export type TaoYeuCauVao = {
  loai: LoaiYeuCau; doiTuongLoai: string; doiTuongId: number; hocVienId?: number | null;
  lopId?: number | null; chiNhanhId?: number | null; nguoiXin: number | null; lyDo?: string | null; bangChung?: unknown; duLieu?: unknown;
  /** Không truyền = hạn mặc định của loại; `null` = không hạn. */
  hanDuyet?: string | null;
};

/**
 * Tạo MỘT thẻ đang chờ. Đã có thẻ chờ cho (loại, đối tượng) → `null`, không tạo, không báo lại (`ux_ycd_dang_cho` + ON CONFLICT —
 * không SELECT rồi INSERT: hai request cùng lúc sẽ tạo đôi). Gửi `duyet_moi` (Báo lên: `bao_len`) cho người duyệt, trừ người xin.
 */
export function taoYeuCau(conn: any, v: TaoYeuCauVao): number | null {
  const meta = metaCua(v.loai);
  let hocVienId = v.hocVienId ?? null;
  let lopId = v.lopId ?? null;
  let chiNhanhId = v.chiNhanhId ?? null;
  if (hocVienId != null && (lopId == null || chiNhanhId == null)) {
    const r = conn.prepare(
      `SELECT e.class_id, c.branch_id, s.branch_id AS sb FROM students s
         LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' LEFT JOIN classes c ON c.id = e.class_id
        WHERE s.id = ? ORDER BY e.id DESC LIMIT 1`).get(hocVienId) as any;
    lopId ??= r?.class_id ?? null;
    chiNhanhId ??= r?.branch_id ?? r?.sb ?? null;
  }
  if (lopId != null && chiNhanhId == null) {
    chiNhanhId = (conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(lopId) as any)?.branch_id ?? null;
  }
  const han = v.hanDuyet !== undefined ? v.hanDuyet : hanDuyetMacDinh(v.loai, demoToday());
  const json = (x: unknown) => (x === undefined || x === null ? null : JSON.stringify(x));
  const info = conn.prepare(
    `INSERT INTO yeu_cau_duyet (loai, phan_loai, doi_tuong_loai, doi_tuong_id, hoc_vien_id, lop_id, chi_nhanh_id, nguoi_xin,
                                ly_do, bang_chung, du_lieu, han_duyet, trang_thai, tao_luc)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'cho', ?) ON CONFLICT DO NOTHING`,
  ).run(v.loai, meta.phanLoai, v.doiTuongLoai, v.doiTuongId, hocVienId, lopId, chiNhanhId, v.nguoiXin,
    v.lyDo?.trim() || null, json(v.bangChung), json(v.duLieu), han, mocNghiepVu());
  if (!info.changes) return null;
  const id = Number(info.lastInsertRowid);
  const hv = tenHocVien(conn, hocVienId);
  const baoLen = meta.kieuNut === 'nhac';
  for (const uid of nguoiNhanHop(conn, chiNhanhId, baoLen)) {
    if (uid === v.nguoiXin) continue;
    notify({
      userId: uid, kind: baoLen ? 'bao_len' : 'duyet_moi',
      title: `${baoLen ? 'Báo lên' : 'Chờ duyệt'}: ${meta.nhan}${hv ? ` — ${hv}` : ''}`,
      body: v.lyDo?.trim().slice(0, 120) || null,
      entityType: 'yeu_cau_duyet', entityId: id, dedupKey: `duyet_moi:${id}`,
    });
  }
  return id;
}

/**
 * BỔ SUNG vào thẻ ĐANG CHỜ của (loại, đối tượng) — khi luồng nguồn gửi lại lúc thẻ cũ chưa được quyết (ví dụ GV bấm "Xin hỗ trợ QL"
 * lần 2 trên cùng PA). Nối lý do mới vào thẻ (giữ câu cũ), trộn `duLieu`, báo lại người duyệt (thông báo trỏ thẻ). Không có thẻ
 * chờ → `null` (nơi gọi dùng `taoYeuCau`).
 */
export function boSungYeuCau(conn: any, doiTuong: { loai: LoaiYeuCau; doiTuongLoai: string; doiTuongId: number },
  v: { lyDo: string | null; duLieu?: Record<string, unknown>; ngay: string }): number | null {
  const r = conn.prepare(
    `SELECT y.id, y.ly_do, y.du_lieu, y.chi_nhanh_id, y.nguoi_xin, s.full_name AS hv FROM yeu_cau_duyet y
       LEFT JOIN students s ON s.id = y.hoc_vien_id
      WHERE y.trang_thai = 'cho' AND y.loai = ? AND y.doi_tuong_loai = ? AND y.doi_tuong_id = ?`,
  ).get(doiTuong.loai, doiTuong.doiTuongLoai, doiTuong.doiTuongId) as any;
  if (!r) return null;
  let cu: Record<string, unknown> = {};
  try { cu = r.du_lieu ? JSON.parse(r.du_lieu) : {}; } catch { cu = {}; }
  const them = v.lyDo?.trim();
  const lyDo = them ? (r.ly_do ? `${r.ly_do}\nBổ sung ${v.ngay.slice(8, 10)}/${v.ngay.slice(5, 7)}: ${them}` : them) : r.ly_do;
  conn.prepare('UPDATE yeu_cau_duyet SET ly_do = ?, du_lieu = ? WHERE id = ?').run(lyDo, JSON.stringify({ ...cu, ...(v.duLieu ?? {}) }), r.id);
  const meta = metaCua(doiTuong.loai);
  for (const uid of nguoiNhanHop(conn, r.chi_nhanh_id, meta.kieuNut === 'nhac')) {
    if (uid === r.nguoi_xin) continue;
    notify({
      userId: uid, kind: 'duyet_moi', title: `Bổ sung: ${meta.nhan}${r.hv ? ` — ${r.hv}` : ''}`, body: them?.slice(0, 120) ?? null,
      entityType: 'yeu_cau_duyet', entityId: r.id, dedupKey: `bo_sung:${r.id}:${JSON.stringify(v.duLieu ?? {})}`,
    });
  }
  return r.id as number;
}

/**
 * Chốt thẻ đang chờ của một đối tượng. Idempotent: chỉ đổi thẻ `cho`, trả số thẻ đổi (lần hai = 0, không ném, không báo lại).
 * `lyDo`: lý do từ chối (`tu_choi`) · lý do tự đóng (`tu_dong`) · ghi chú của người duyệt (`duyet`). `traLoi`: câu trả lời (`da_tra_loi`).
 * Báo người xin (`duyet_ket_qua`) — trừ Báo lên tự đóng, người xin là hệ thống, hoặc chính người duyệt. QL tự duyệt → báo Quản trị (Q-D).
 */
export function chotYeuCau(
  conn: any, doiTuong: { loai?: LoaiYeuCau; doiTuongLoai: string; doiTuongId: number },
  trangThai: 'duyet' | 'tu_choi' | 'tu_dong' | 'da_tra_loi',
  v: { nguoiDuyet?: number | null; lyDo?: string | null; traLoi?: string | null } = {},
): number {
  const rows = conn.prepare(
    `SELECT y.id, y.loai, y.nguoi_xin, s.full_name AS hv FROM yeu_cau_duyet y LEFT JOIN students s ON s.id = y.hoc_vien_id
      WHERE y.trang_thai = 'cho' AND y.doi_tuong_loai = ? AND y.doi_tuong_id = ?${doiTuong.loai ? ' AND y.loai = ?' : ''}`,
  ).all(...[doiTuong.doiTuongLoai, doiTuong.doiTuongId, ...(doiTuong.loai ? [doiTuong.loai] : [])]) as any[];
  if (!rows.length) return 0;
  const lyDo = v.lyDo?.trim() || null;
  const nguoiDuyet = v.nguoiDuyet ?? null;
  return tx(() => {
    let n = 0;
    for (const r of rows) {
      const meta = metaCua(r.loai);
      const tuDuyet = trangThai === 'duyet' && nguoiDuyet != null && laTuDuyet(r.nguoi_xin, nguoiDuyet);
      const doi = conn.prepare(
        `UPDATE yeu_cau_duyet SET trang_thai = ?, nguoi_duyet = ?, ly_do_tu_choi = ?, tra_loi = ?, ly_do_dong = ?, tu_duyet = ?, xu_ly_luc = ?
          WHERE id = ? AND trang_thai = 'cho'`,
      ).run(trangThai, nguoiDuyet, trangThai === 'tu_choi' ? lyDo : null,
        trangThai === 'da_tra_loi' ? (v.traLoi?.trim() || null) : trangThai === 'duyet' ? lyDo : null,
        trangThai === 'tu_dong' ? lyDo : null, tuDuyet ? 1 : 0, mocNghiepVu(), r.id).changes as number;
      if (!doi) continue;
      n += doi;
      const baoNguoiXin = r.nguoi_xin != null && r.nguoi_xin !== nguoiDuyet && !(trangThai === 'tu_dong' && meta.kieuNut === 'nhac');
      if (baoNguoiXin) {
        const ketQua = trangThai === 'duyet' ? 'Quản lý đã duyệt'
          : trangThai === 'tu_choi' ? `Quản lý từ chối: ${lyDo ?? ''}`
          : trangThai === 'da_tra_loi' ? `Quản lý đã trả lời: ${(v.traLoi ?? '').trim()}`
          : `tự đóng: ${lyDo ?? ''}`;
        notify({
          /* PR-VAI-a (Q19): từ chối là việc CẦN LÀM (sửa và gửi lại) — tách loại để chuông xếp đúng nhóm; duyệt / trả lời vẫn là tin để biết. */
          userId: r.nguoi_xin, kind: trangThai === 'tu_choi' ? 'duyet_tu_choi' : 'duyet_ket_qua',
          title: `Yêu cầu ${meta.nhan}${r.hv ? ` — ${r.hv}` : ''}: ${ketQua}`.slice(0, 200),
          entityType: 'yeu_cau_duyet', entityId: r.id, dedupKey: `duyet_ket_qua:${r.id}`,
        });
      }
      if (tuDuyet) {
        for (const uid of quanTri(conn)) {
          if (uid === nguoiDuyet) continue;
          notify({
            userId: uid, kind: 'duyet_tu_duyet',
            title: `Quản lý tự duyệt yêu cầu của mình: ${meta.nhan}${r.hv ? ` — ${r.hv}` : ''}`,
            entityType: 'yeu_cau_duyet', entityId: r.id, dedupKey: `tu_duyet:${r.id}`,
          });
        }
      }
    }
    return n;
  });
}

// ------------------------------------------------------------------------------------------------ quét khi đọc

/**
 * MỘT hàm quét, gọi ở mọi đường đọc hộp (my-work, hộp, đếm, Tổng quan QL — K5-17); nhớ theo request nên một request chỉ quét một lần.
 * (a) thẻ "chết" → `tu_dong` · (b) Báo lên: loại có `quet` tự tạo thẻ · (c) quá hạn duyệt → một thông báo cho QL + Quản trị (dedup).
 * Không có gì để ghi thì không mở giao dịch.
 */
export function quetYeuCau(homNay = demoToday()): void {
  nho(`quet-yeu-cau:${homNay}`, () => { quetThat(homNay); return true; });
}

function quetThat(homNay: string) {
  const conn = db();
  const coChet = DINH_NGHIA_LOAI.filter((d) => d.chet);
  if (coChet.length) {
    const chet = conn.prepare(
      `SELECT y.id, y.loai, y.doi_tuong_loai, y.doi_tuong_id FROM yeu_cau_duyet y
        WHERE y.trang_thai = 'cho' AND (${coChet.map((d) => `(y.loai = ? AND (${d.chet!.sql}))`).join(' OR ')})`,
    ).all(...coChet.map((d) => d.loai)) as any[];
    if (chet.length) {
      tx(() => {
        for (const r of chet) {
          chotYeuCau(conn, { loai: r.loai, doiTuongLoai: r.doi_tuong_loai, doiTuongId: r.doi_tuong_id }, 'tu_dong',
            { lyDo: dinhNghiaCua(r.loai)!.chet!.lyDo });
        }
      });
    }
  }
  for (const d of DINH_NGHIA_LOAI) d.quet?.(conn, homNay);

  const coHan = Object.entries(LOAI_YC_META as Record<string, LoaiYcMeta>).filter(([, m]) => m.kieuNut !== 'nhac').map(([k]) => k);
  const qua = conn.prepare(
    `SELECT y.id, y.loai, y.chi_nhanh_id, y.han_duyet, s.full_name AS hv FROM yeu_cau_duyet y LEFT JOIN students s ON s.id = y.hoc_vien_id
      WHERE y.trang_thai = 'cho' AND y.han_duyet IS NOT NULL AND y.han_duyet < ? AND y.loai IN (${coHan.map(() => '?').join(',')})
        AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.dedup_key = 'qua_han_duyet:' || y.id)`,
  ).all(homNay, ...coHan) as any[];
  if (!qua.length) return;
  tx(() => {
    for (const r of qua) {
      for (const uid of nguoiNhanHop(conn, r.chi_nhanh_id)) {
        notify({
          userId: uid, kind: 'duyet_qua_han',
          title: `Quá hạn duyệt: ${metaCua(r.loai).nhan}${r.hv ? ` — ${r.hv}` : ''} (hạn ${r.han_duyet.slice(8, 10)}/${r.han_duyet.slice(5, 7)})`,
          entityType: 'yeu_cau_duyet', entityId: r.id, dedupKey: `qua_han_duyet:${r.id}`,
        });
      }
    }
  });
}

// ------------------------------------------------------------------------------------------------ đọc

function napNguCanh(conn: any, rows: YeuCauRow[], homNay: string): NguCanhThe {
  const map = (sql: string, ids: (number | null)[]) => {
    const ds = [...new Set(ids.filter((x): x is number => x != null))];
    if (!ds.length) return new Map<number, string>();
    return new Map((conn.prepare(sql.replace('(?)', `(${ds.map(() => '?').join(',')})`)).all(...ds) as any[]).map((r) => [r.id, r.ten]));
  };
  const them = new Map<number, any>();
  for (const d of DINH_NGHIA_LOAI) {
    const cua = rows.filter((r) => r.loai === d.loai);
    if (cua.length && d.nap) for (const [k, v] of d.nap(conn, cua)) them.set(k, v);
  }
  return {
    homNay, them,
    hocVien: map('SELECT id, full_name AS ten FROM students WHERE id IN (?)', rows.map((r) => r.hoc_vien_id)),
    lop: map('SELECT id, code AS ten FROM classes WHERE id IN (?)', rows.map((r) => r.lop_id)),
    nguoi: map('SELECT id, full_name AS ten FROM users WHERE id IN (?)', rows.flatMap((r: any) => [r.nguoi_xin, r.nguoi_duyet])),
  };
}

function theRa(r: any, ngu: NguCanhThe): TheYeuCauDto {
  const meta = metaCua(r.loai);
  const def = dinhNghiaCua(r.loai);
  const mt: ReturnType<NonNullable<typeof def>['moTa']> = def ? def.moTa(r, ngu) : { tieuDe: meta.nhan, dong: r.ly_do ? [r.ly_do] : [] };
  let duLieu: Record<string, unknown> | null = null;
  try { duLieu = r.du_lieu ? JSON.parse(r.du_lieu) : null; } catch { duLieu = null; }
  return {
    id: r.id, loai: r.loai, nhanLoai: meta.nhan, phanLoai: meta.phanLoai, nhanPhanLoai: PHAN_LOAI_LABEL[meta.phanLoai], doiTuongId: r.doi_tuong_id ?? null,
    kieuNut: meta.kieuNut, hangLoat: meta.hangLoat,
    tieuDe: mt.tieuDe, phu: mt.phu ?? null, dong: mt.dong, neuDuyet: mt.neuDuyet ?? null,
    mo: mt.mo ?? (r.hoc_vien_id ? duongHoSoHocVien(r.hoc_vien_id) : null),
    hocVienId: r.hoc_vien_id, hocVien: ngu.hocVien.get(r.hoc_vien_id) ?? null,
    lopId: r.lop_id, lop: ngu.lop.get(r.lop_id) ?? null,
    nguoiXinId: r.nguoi_xin, nguoiXin: r.nguoi_xin == null ? null : ngu.nguoi.get(r.nguoi_xin) ?? null,
    nguoiDuyet: r.nguoi_duyet == null ? null : ngu.nguoi.get(r.nguoi_duyet) ?? null,
    lyDo: r.ly_do, lyDoTuChoi: r.ly_do_tu_choi, traLoi: r.tra_loi, lyDoDong: r.ly_do_dong,
    hanDuyet: r.han_duyet, trangThai: r.trang_thai, tuDuyet: !!r.tu_duyet, taoLuc: r.tao_luc, xuLyLuc: r.xu_ly_luc,
    duLieu: mt.duLieu ? { ...(duLieu ?? {}), ...mt.duLieu } : duLieu,
  };
}

/**
 * Mọi thẻ (mọi trạng thái, mới trước) của một nhóm đối tượng — ví dụ các PA của một Case (Ngăn Case: thẻ Đề xuất PA chờ duyệt,
 * dòng Xin ý kiến). Một câu cho cả nhóm + các câu nạp chữ. Không lọc quyền: nơi gọi đã kiểm quyền xem đối tượng.
 */
export function theCuaDoiTuong(doiTuongLoai: string, ids: readonly number[]): (TheYeuCauDto & { doiTuongId: number })[] {
  if (!ids.length) return [];
  const conn = db();
  const rows = conn.prepare(
    `SELECT * FROM yeu_cau_duyet WHERE doi_tuong_loai = ? AND doi_tuong_id IN (${ids.map(() => '?').join(',')}) ORDER BY id DESC`,
  ).all(doiTuongLoai, ...ids) as any[];
  if (!rows.length) return [];
  const ngu = napNguCanh(conn, rows, demoToday());
  return rows.map((r) => ({ ...theRa(r, ngu), doiTuongId: r.doi_tuong_id as number }));
}

/** Thẻ trong phạm vi duyệt của người xem (quyền theo TỪNG thẻ, không anyScope). */
export function trongPhamVi(p: Principal, rows: any[]): any[] {
  napTruocPhamVi(rows.map((r) => r.hoc_vien_id));
  return rows.filter((r) => can(p, P_DUYET, ctxThe(r)));
}

const tuNgay = (n: number) => `${addDays(demoToday(), -n)}T00:00:00.000Z`;
const xepDaXuLy = (a: TheYeuCauDto, b: TheYeuCauDto) => ((b.xuLyLuc ?? '') < (a.xuLyLuc ?? '') ? -1 : 1);

export function hopChoDuyet(p: Principal, f: {
  phanLoai?: PhanLoai | null; xem?: 'cho' | 'da-xu-ly'; studentId?: number | null; branchId?: number | null; classId?: number | null;
  /** PR-VAI-a (Q17): chỉ thẻ quá hạn — cùng điều kiện `quaHan` của `demHop`; chip vẫn đếm cả hộp (như lọc phân loại). */
  quaHan?: boolean;
} = {}) {
  require_(p, P_DUYET, { anyScope: true }, 'Chỉ Quản lý và Quản trị hệ thống mở được hộp Chờ duyệt.');
  const homNay = demoToday();
  quetYeuCau(homNay);
  const conn = db();
  const xem = f.xem === 'da-xu-ly' ? 'da-xu-ly' : 'cho';
  let rows = trongPhamVi(p, xem === 'cho'
    ? conn.prepare(`SELECT * FROM yeu_cau_duyet WHERE trang_thai = 'cho'`).all() as any[]
    : conn.prepare(`SELECT * FROM yeu_cau_duyet WHERE trang_thai != 'cho' AND xu_ly_luc >= ?`).all(tuNgay(NGAY_DA_XU_LY)) as any[]);
  if (f.studentId) rows = rows.filter((r) => r.hoc_vien_id === f.studentId);
  if (f.branchId) rows = rows.filter((r) => r.chi_nhanh_id === f.branchId);
  /* PR-S4F #5: badge "n chờ duyệt" của một lớp mở hộp lọc ĐÚNG lớp đó — cùng luật đếm `viecHocVienTheoLop` (thẻ theo lớp, thẻ không lớp thì lớp em đang học). */
  let lopDangLoc: { id: number; code: string } | null = null;
  if (f.classId) {
    lopDangLoc = (conn.prepare('SELECT id, code FROM classes WHERE id = ?').get(f.classId) as any) ?? null;
    const emLop = new Set((conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active'`).all(f.classId) as any[]).map((r) => r.student_id));
    rows = rows.filter((r) => (r.lop_id ?? null) === f.classId || (r.lop_id == null && emLop.has(r.hoc_vien_id)));
  }
  const dem = demHop(rows.map((r) => ({ phanLoai: metaCua(r.loai).phanLoai, hanDuyet: r.han_duyet })), homNay).chip;
  if (f.phanLoai && laPhanLoai(f.phanLoai)) rows = rows.filter((r) => metaCua(r.loai).phanLoai === f.phanLoai);
  if (f.quaHan && xem === 'cho') rows = rows.filter((r) => !!r.han_duyet && r.han_duyet < homNay);
  const ngu = napNguCanh(conn, rows, homNay);
  const the = rows.map((r) => theRa(r, ngu));
  return { the: xem === 'cho' ? sapThe(the) : the.sort(xepDaXuLy), dem, homNay, lopDangLoc };
}

/** Yêu cầu của tôi: mọi thẻ đang chờ + thẻ đã xử lý trong 60 ngày gần nhất. */
export function yeuCauCuaToi(p: Principal) {
  const homNay = demoToday();
  quetYeuCau(homNay);
  const conn = db();
  const rows = conn.prepare(
    `SELECT * FROM yeu_cau_duyet WHERE nguoi_xin = ? AND (trang_thai = 'cho' OR tao_luc >= ?)`).all(p.userId, tuNgay(NGAY_CUA_TOI)) as any[];
  const ngu = napNguCanh(conn, rows, homNay);
  const the = rows.map((r) => theRa(r, ngu));
  return { the: [...sapThe(the.filter((x) => x.trangThai === 'cho')), ...the.filter((x) => x.trangThai !== 'cho').sort(xepDaXuLy)], homNay };
}

export function demYeuCau(p: Principal, f: { branchId?: number | null } = {}): DemYeuCau {
  const homNay = demoToday();
  quetYeuCau(homNay);
  const conn = db();
  const kq: DemYeuCau = { cho: 0, quaHan: 0, baoLen: 0, cuaToiCho: 0, cuaToiTuChoi: 0 };
  if (can(p, P_DUYET, { anyScope: true })) {
    /* PR-VAI-a (Q17, VN05): dải Chờ duyệt theo chi nhánh đang chọn — hỏi chi nhánh ngoài phạm vi thì 403, không trả số rỗng. */
    if (f.branchId && !can(p, P_DUYET, { branchId: f.branchId })) throw forbidden('Chi nhánh này nằm ngoài phạm vi bạn được duyệt.');
    let rows = trongPhamVi(p, conn.prepare(
      `SELECT loai, han_duyet, hoc_vien_id, lop_id, chi_nhanh_id FROM yeu_cau_duyet WHERE trang_thai = 'cho'`).all() as any[]);
    if (f.branchId) rows = rows.filter((r) => r.chi_nhanh_id === f.branchId);
    /* CÙNG hàm đếm với chip của hộp — badge, dải Tổng quan và chip "Tất cả" luôn một số. */
    const d = demHop(rows.map((r) => ({ phanLoai: metaCua(r.loai).phanLoai, hanDuyet: r.han_duyet })), homNay);
    kq.cho = d.tong; kq.quaHan = d.quaHan; kq.baoLen = d.baoLen;
    kq.chip = d.chip;
    kq.baoLenTheoLoai = {};
    for (const r of rows) if (metaCua(r.loai).phanLoai === 'bao-len') kq.baoLenTheoLoai[r.loai] = (kq.baoLenTheoLoai[r.loai] ?? 0) + 1;
  }
  for (const r of conn.prepare(
    `SELECT trang_thai, COUNT(*) AS n FROM yeu_cau_duyet WHERE nguoi_xin = ? AND (trang_thai = 'cho' OR (trang_thai = 'tu_choi' AND xu_ly_luc >= ?))
      GROUP BY trang_thai`).all(p.userId, tuNgay(NGAY_DA_XU_LY)) as any[]) {
    if (r.trang_thai === 'cho') kq.cuaToiCho = r.n; else kq.cuaToiTuChoi = r.n;
  }
  return kq;
}

// ------------------------------------------------------------------------------------------------ quyết định

function docThe(id: number): YeuCauRow {
  const r = db().prepare('SELECT * FROM yeu_cau_duyet WHERE id = ?').get(id) as YeuCauRow | undefined;
  if (!r) throw notFound('Không tìm thấy yêu cầu này.');
  return r;
}
/** Đọc thẻ, kiểm quyền theo phạm vi CỦA THẺ; trong giao dịch đọc lại để hai người bấm cùng lúc chỉ một người chốt. */
function quyetDinh<T>(p: Principal, id: number, lam: (yc: YeuCauRow, meta: LoaiYcMeta) => T): T {
  const truoc = docThe(id);
  require_(p, P_DUYET, ctxThe(truoc), 'Yêu cầu này nằm ngoài phạm vi bạn được duyệt.');
  return tx(() => {
    const yc = docThe(id);
    if (yc.trang_thai !== 'cho') throw badRequest('Yêu cầu này đã được xử lý. Danh sách đã được làm mới.');
    return lam(yc, metaCua(yc.loai));
  });
}
const doiTuongCua = (yc: YeuCauRow) => ({ loai: yc.loai, doiTuongLoai: yc.doi_tuong_loai, doiTuongId: yc.doi_tuong_id });

export function duyetYeuCau(p: Principal, id: number, v: { ghiChu?: string | null; duLieu?: unknown } = {}) {
  return quyetDinh(p, id, (yc, meta) => {
    if (meta.kieuNut === 'tra-loi') throw badRequest('Xin ý kiến chỉ cần Trả lời, không có Duyệt.');
    if (meta.kieuNut === 'nhac') throw badRequest('Báo lên không cần duyệt — bấm Nhắc để nhắc giáo viên.');
    const ghiChu = (v.ghiChu ?? '').trim() || null;
    dinhNghiaCua(yc.loai)?.khiDuyet?.(p, yc, { ghiChu, duLieu: v.duLieu });
    chotYeuCau(db(), doiTuongCua(yc), 'duyet', { nguoiDuyet: p.userId, lyDo: ghiChu });
    const tuDuyet = laTuDuyet(yc.nguoi_xin, p.userId);
    writeAudit({ actorUserId: p.userId, action: 'request.approve', entityType: 'yeu_cau_duyet', entityId: id, entityLabel: meta.nhan,
      after: { ghiChu, tuDuyet } });
    return { ok: true, id, trangThai: 'duyet' as const, tuDuyet };
  });
}

export function tuChoiYeuCau(p: Principal, id: number, lyDo: unknown) {
  const ld = typeof lyDo === 'string' ? lyDo.trim() : '';
  if (ld.length < DO_DAI_LY_DO) throw badRequest(`Ghi lý do từ chối (ít nhất ${DO_DAI_LY_DO} ký tự).`);
  return quyetDinh(p, id, (yc, meta) => {
    if (meta.kieuNut !== 'duyet-tu-choi') throw badRequest('Yêu cầu này không có Từ chối.');
    dinhNghiaCua(yc.loai)?.khiTuChoi?.(p, yc, ld);
    chotYeuCau(db(), doiTuongCua(yc), 'tu_choi', { nguoiDuyet: p.userId, lyDo: ld });
    writeAudit({ actorUserId: p.userId, action: 'request.decline', entityType: 'yeu_cau_duyet', entityId: id, entityLabel: meta.nhan, after: { lyDo: ld } });
    return { ok: true, id, trangThai: 'tu_choi' as const };
  });
}

export function traLoiYeuCau(p: Principal, id: number, traLoi: unknown) {
  const tl = typeof traLoi === 'string' ? traLoi.trim() : '';
  if (tl.length < DO_DAI_LY_DO) throw badRequest(`Ghi câu trả lời (ít nhất ${DO_DAI_LY_DO} ký tự).`);
  return quyetDinh(p, id, (yc, meta) => {
    if (meta.kieuNut !== 'tra-loi') throw badRequest('Yêu cầu này cần Duyệt hoặc Từ chối, không phải Trả lời.');
    dinhNghiaCua(yc.loai)?.khiTraLoi?.(p, yc, tl);
    chotYeuCau(db(), doiTuongCua(yc), 'da_tra_loi', { nguoiDuyet: p.userId, traLoi: tl });
    writeAudit({ actorUserId: p.userId, action: 'request.answer', entityType: 'yeu_cau_duyet', entityId: id, entityLabel: meta.nhan, after: { traLoi: tl } });
    return { ok: true, id, trangThai: 'da_tra_loi' as const };
  });
}

/** Duyệt hàng loạt — cùng MỘT loại có `hangLoat`. Mỗi thẻ một giao dịch: thẻ lỗi báo riêng, thẻ khác vẫn xong. */
export function duyetNhieu(p: Principal, ids: unknown): { ok: number[]; loi: { id: number; loi: string }[] } {
  /* PR-Dọn (Q1): kiểm quyền TRƯỚC mọi bước đọc thân yêu cầu (GV → 403, không phải 400). Từng thẻ vẫn kiểm theo phạm vi ở `duyetYeuCau`. */
  require_(p, P_DUYET, { anyScope: true }, 'Chỉ Quản lý và Quản trị hệ thống duyệt được yêu cầu.');
  if (!Array.isArray(ids) || !ids.length || ids.length > 50) throw badRequest('Chọn từ 1 đến 50 yêu cầu để duyệt.');
  const ok: number[] = [];
  const loi: { id: number; loi: string }[] = [];
  /* Mã sai dạng chỉ lỗi riêng dòng đó (trả lại nguyên giá trị đã gửi), các mã đúng vẫn duyệt. */
  for (const x of ids) if (!(Number.isInteger(x) && x > 0)) loi.push({ id: x as number, loi: 'Mã yêu cầu không hợp lệ.' });
  const ds = [...new Set(ids.filter((x): x is number => Number.isInteger(x) && x > 0))];
  if (!ds.length) return { ok, loi };
  const conn = db();
  const theo = new Map((conn.prepare(`SELECT id, loai FROM yeu_cau_duyet WHERE id IN (${ds.map(() => '?').join(',')})`).all(...ds) as any[])
    .map((r) => [r.id as number, r.loai as string]));
  /* Thẻ không tồn tại chỉ lỗi riêng thẻ đó — không làm hỏng cả lô. */
  for (const id of ds) if (!theo.has(id)) loi.push({ id, loi: 'Không tìm thấy yêu cầu này.' });
  const loai = new Set(theo.values());
  if (loai.size > 1 || (loai.size === 1 && !metaCua([...loai][0]).hangLoat)) throw badRequest('Chỉ duyệt hàng loạt các yêu cầu cùng một loại.');
  for (const id of ds) {
    if (!theo.has(id)) continue;
    try { duyetYeuCau(p, id); ok.push(id); } catch (e: any) { loi.push({ id, loi: e?.message ?? 'Không duyệt được.' }); }
  }
  return { ok, loi };
}
