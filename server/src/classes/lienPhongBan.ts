/**
 * LPB-0 (N73 + N74 / N76b / N77, chủ SP 26/11 — đặc tả `docs/superpowers/specs/2026-11-26-viec-lien-phong-ban/thiet-ke.md`, sửa bởi
 * `…/2026-11-26-vai-gdcn-lead-tvv-bpxl/thiet-ke.md`): VIỆC LIÊN PHÒNG BAN khi chuyển lớp / đổi GV, phần máy chủ.
 *
 *  · TVV "Báo PH · Chuyển lớp" = một nguồn nữa của `viec_bao_ph` (`lenh_chuyen_id`): mọi lệnh có lớp đích, thi hành "Từ tuần …" (`raLenh` — lẻ, Cuối khoá,
 *    Xét lại, duyệt đề xuất, Lộ trình mới). "Ngay hôm nay" / không lớp đích (Bảo lưu, Dừng học) / xếp lớp lần đầu: không việc. Hạn Chủ nhật (`hanChuNhat`).
 *    Em chưa có TVV → Lead TVV chốt lúc sinh (`chotLeadBaoPh`) → Head. Theo dõi: Head + CX + Lead TVV (`theoDoiVaiBaoPh`) + người ra lệnh.
 *    Gộp với "Kết quả Final" đang mở (một dòng hai nguồn, hạn muộn hơn) — chiều ngược ở `dongBoViecTvvLuot`.
 *    Lệnh sửa: việc mở đọc nội dung từ lệnh; đã báo mà lớp đích / tuần đổi → "Báo lại · Chuyển lớp". Huỷ: mở → tự đóng; đã báo → "Báo lại · Huỷ chuyển lớp".
 *    Sửa sang "Ngay hôm nay": mở → tự đóng, đã báo → không gì. Khôi phục lệnh → việc tự đóng mở lại.
 *  · BPXL "Nhận thông tin · Chuyển lớp" (`viec_nhan_tin`, loai chuyen_lop): một việc mỗi LỚP ĐÍCH còn mở (N77 — lệnh sau dồn vào, đã xác nhận → việc mới);
 *    người nhận MỘT người lúc sinh: CVXL nhận lớp đích → BPXL chi nhánh ít việc nhất → Head (`nguoiNhanTuDong`). CVXL lớp nguồn + người ra lệnh theo dõi.
 *    Lệnh đổi / huỷ: việc mở → bảng em đổi (hết em → tự đóng) · đã xác nhận → tin "Cập nhật" cho người giữ, lớp đích mới nhận việc của lớp đó.
 *  · BPXL "Nhận thông tin · Đổi GV" (loai doi_gv): một việc mỗi lần lưu phân công × lớp, gom các cặp có tích "Tạo việc bàn giao" (kể cả "Ngay hôm nay").
 *    Hoàn tác lưu / Huỷ lịch đổi: việc mở hết cặp → tự đóng (khôi phục → mở lại) · đã xác nhận → tin "Cập nhật". Đổi mốc: như sửa lệnh.
 * Không chặn, không làm chậm lệnh / lưu: chạy TRONG tx của nơi gọi, theo LÔ (số câu không theo số em).
 */
import { DS_JSON, db, tx } from '../db.ts';
import { hanChuNhat, tuanLich } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { badRequest, conflict, forbidden, nowIso } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { HOAT_DONG_O } from '../worklist/hieuLuc.ts';
import { CON_VAI_BPXL, cvxlCuaLop, headCua, itViecNhat, nguoiNhanTuDong, nhomVaiCn } from '../worklist/nguoiNhan.ts';
import { chotLeadBaoPh } from '../yThuc/baoPhTvv.ts';
import { HL_NHAN_TIN, baoTheoDoi, docViec, ghiLan, laLeadBpxl, theoDoiVaiBaoPh, themTheoDoiDong, vaiQuanLy, xemGiaoViec, type KhoiGiaoViec } from '../worklist/giaoViec.ts';

export const LOAI_NHAN_TIN = ['chuyen_lop', 'doi_gv'] as const;
export type LoaiNhanTin = (typeof LOAI_NHAN_TIN)[number];
export const TEN_NHAN_TIN: Record<LoaiNhanTin, string> = { chuyen_lop: 'Chuyển lớp', doi_gv: 'Đổi GV' };
/** Tên việc TVV theo nguồn chuyển lớp (`viec_bao_ph.nhan`) — gộp với Kết quả Final: "Kết quả Final · Chuyển lớp". */
export const NHAN_BAO_PH_CL = { moi: 'Chuyển lớp', baoLai: 'Báo lại · Chuyển lớp', huy: 'Báo lại · Huỷ chuyển lớp' } as const;
const GOP = ' · Chuyển lớp';
/** Lý do hệ thống tự đóng việc TVV theo lệnh (chữ ở `LY_DO_HE_THONG`, baoPhTvv) — lệnh trở lại "sinh việc" (khôi phục / sửa lại) thì mở lại. */
const LY_DO_LENH = { system_lenh_huy: 1, system_chuyen_ngay: 1, system_lenh_khoi_phuc: 1 } as const;
const NHAN_HUONG: Record<string, string> = { len_lop: 'Lên lớp', hoc_lai: 'Học lại', fast_track: 'Lên FT', chuyen_lop: 'Chuyển lớp' };

type Lenh = { id: number; student_id: number; lop_nguon_id: number; lop_dich_id: number | null; tuan_bat_dau: string; trang_thai: string; nguoi_ra_lenh: number };
type TrangLenh = 'sinh' | 'ngay' | 'huy';
/** Lệnh SINH việc = chờ thi hành, có lớp đích, tuần bắt đầu sau hôm nay ("Từ tuần …"). Có lớp đích mà đã / sắp chuyển hôm nay = "Ngay hôm nay". */
const trangLenh = (l: Lenh, homNay: string): TrangLenh =>
  (l.lop_dich_id == null || l.trang_thai === 'huy' ? 'huy' : l.trang_thai === 'cho' && l.tuan_bat_dau > homNay ? 'sinh' : 'ngay');
const mauLenh = (l: Lenh) => `${l.lop_dich_id}|${l.tuan_bat_dau}`;
/** `viec_nhan_tin_dong.mau` = 'x': em đã RỜI bảng của việc đang mở (lệnh đổi lớp đích / huỷ / chuyển ngay) — giữ dòng (Hoàn tác), không tính. */
export const ROI = 'x';
/** Câu SQL: dòng còn trong bảng của việc (bí danh `d`). */
export const CON_DONG = (d: string) => `COALESCE(${d}.mau, '') != '${ROI}'`;
const J = (x: unknown) => JSON.stringify(x);

/**
 * TRONG tx của nơi đổi lệnh (`raLenh` — ra / sửa / chuyển ngay; huỷ; huỷ hệ thống; khôi phục): đồng bộ việc TVV + việc BPXL của các lệnh. Chạy lặp không đổi.
 * `boi` = người thao tác (null = hệ thống). Số câu theo LÔ: vài câu đọc + một câu ghi mỗi loại thay đổi (không một câu mỗi em).
 */
export function dongBoLienPhongLenh(lenhIds: readonly number[], boi: number | null): void {
  if (!lenhIds.length) return;
  /* Một câu đọc lệnh + cờ "đã có việc" — huỷ / sửa lệnh chưa từng sinh việc (Bảo lưu, Ngay hôm nay) dừng ở câu này. */
  const ls = db().prepare(`SELECT id, student_id, lop_nguon_id, lop_dich_id, tuan_bat_dau, trang_thai, nguoi_ra_lenh,
      EXISTS (SELECT 1 FROM viec_bao_ph v WHERE v.lenh_chuyen_id = l.id) AS co_tvv, EXISTS (SELECT 1 FROM viec_nhan_tin_dong d WHERE d.lenh_id = l.id) AS co_nt
    FROM lenh_chuyen_lop l WHERE id IN (${DS_JSON})`).all(J([...new Set(lenhIds)])) as (Lenh & { co_tvv: number; co_nt: number })[];
  const homNay = demoToday();
  const can = (c: 'co_tvv' | 'co_nt') => ls.some((l) => l[c] || trangLenh(l, homNay) === 'sinh');
  if (can('co_tvv')) dongBoBaoPh(ls, homNay);
  if (can('co_nt')) dongBoNhanTinLenh(ls, boi, homNay);
}

/** Id lệnh MỚI NHẤT của các em ở lớp nguồn — sau upsert / thi hành ngay của `raLenh` (một câu). */
export function lenhVuaLuu(lopNguonId: number, sids: readonly number[]): number[] {
  if (!sids.length) return [];
  return (db().prepare(`SELECT MAX(id) AS id FROM lenh_chuyen_lop WHERE lop_nguon_id = ? AND student_id IN (${DS_JSON}) GROUP BY student_id`)
    .all(lopNguonId, J(sids)) as { id: number }[]).map((r) => r.id);
}

// ---------------------------------------------------------------- TVV · Báo PH · Chuyển lớp

function dongBoBaoPh(ls: Lenh[], homNay: string): void {
  const conn = db();
  const viec = conn.prepare(`SELECT v.id, v.lenh_chuyen_id AS lenh, v.trang_thai, v.bo_ly_do, v.lenh_mau, v.phoi_hop_id,
      EXISTS (SELECT 1 FROM viec_bao_ph_lan l WHERE l.viec_id = v.id) AS co_lan FROM viec_bao_ph v WHERE v.lenh_chuyen_id IN (${DS_JSON}) ORDER BY v.id`)
    .all(J(ls.map((l) => l.id))) as any[];
  const cua = new Map<number, any[]>();
  for (const v of viec) (cua.get(v.lenh) ?? cua.set(v.lenh, []).get(v.lenh)!).push(v);
  /* Em cần việc mới: tìm việc "Kết quả Final" đang mở để GỘP (một câu cho cả lô). */
  const canMoi = ls.filter((l) => trangLenh(l, homNay) === 'sinh' && !(cua.get(l.id) ?? []).some((v) => v.lenh_mau !== 'huy' || v.trang_thai === 'xong'));
  const final = new Map<number, number>();
  if (canMoi.length) {
    for (const r of conn.prepare(`SELECT v.student_id AS sid, MIN(v.id) AS id FROM viec_bao_ph v JOIN sos_coordination_actions x ON x.id = v.phoi_hop_id
        JOIN assessment_attempts a ON a.id = x.attempt_id WHERE v.student_id IN (${DS_JSON}) AND v.trang_thai = 'mo' AND v.lenh_chuyen_id IS NULL
        AND x.kind = 'bao_ph_tvv' AND a.kind = 'final' GROUP BY v.student_id`).all(J(canMoi.map((l) => l.student_id))) as any[]) final.set(r.sid, r.id);
  }
  const han = hanChuNhat(homNay);
  const luc = nowIso();
  const them: [number, string, number, string][] = [];   // em · nhãn · lệnh · mẫu
  const gop: [number, number, string][] = [];            // việc Final · lệnh · mẫu
  const tach: number[] = [];                             // việc gộp: bỏ phần chuyển lớp
  const dong: Record<string, number[]> = { system_lenh_huy: [], system_chuyen_ngay: [], system_lenh_khoi_phuc: [] };
  const moLai: number[] = [];

  const mau: [number, string][] = [];
  for (const l of ls) {
    const t = trangLenh(l, homNay);
    const ds = [...(cua.get(l.id) ?? [])];
    let cur = ds.at(-1);
    if (t === 'sinh') {
      /* Khôi phục / sửa lại sau huỷ: "Báo lại · Huỷ chuyển lớp" chưa báo → gỡ (chưa ghi lần nào) / tự đóng; việc trước đó là việc hiện tại. */
      while (cur && cur.lenh_mau === 'huy' && cur.trang_thai !== 'xong') {
        if (cur.trang_thai === 'mo') dong.system_lenh_khoi_phuc.push(cur.id);   // tự đóng (không xoá — Hoàn tác đảo được)
        ds.pop(); cur = ds.at(-1);
      }
      if (!cur) {
        const f = final.get(l.student_id);
        if (f) { gop.push([f, l.id, mauLenh(l)]); final.delete(l.student_id); } else them.push([l.student_id, NHAN_BAO_PH_CL.moi, l.id, mauLenh(l)]);
      } else if (cur.trang_thai === 'mo') { if (cur.lenh_mau !== mauLenh(l)) mau.push([cur.id, mauLenh(l)]); }
      else if (cur.trang_thai === 'bo' && cur.bo_ly_do in LY_DO_LENH) { moLai.push(cur.id); mau.push([cur.id, mauLenh(l)]); }
      else if (cur.trang_thai === 'xong' && cur.lenh_mau !== mauLenh(l)) them.push([l.student_id, NHAN_BAO_PH_CL.baoLai, l.id, mauLenh(l)]);
      /* Người dùng đã bỏ việc: giữ (Khôi phục ở panel Báo PH). */
    } else if (cur?.trang_thai === 'mo' && cur.lenh_mau !== 'huy') {
      if (cur.phoi_hop_id) tach.push(cur.id);   // gộp Kết quả Final: việc còn, chỉ bỏ phần chuyển lớp
      else dong[t === 'ngay' ? 'system_chuyen_ngay' : 'system_lenh_huy'].push(cur.id);
    } else if (t === 'huy' && cur?.trang_thai === 'xong' && cur.lenh_mau !== 'huy') {
      them.push([l.student_id, NHAN_BAO_PH_CL.huy, l.id, 'huy']);   // PH đã nghe em chuyển lớp — báo lại lệnh huỷ
    }
  }

  for (const [lyDo, ids] of Object.entries(dong)) if (ids.length) {
    conn.prepare(`UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = ?, bo_boi = NULL, bo_luc = ? WHERE trang_thai = 'mo' AND id IN (${DS_JSON})`).run(lyDo, luc, J(ids));
  }
  if (moLai.length) conn.prepare(`UPDATE viec_bao_ph SET trang_thai = 'mo', bo_ly_do = NULL, bo_boi = NULL, bo_luc = NULL WHERE trang_thai = 'bo' AND id IN (${DS_JSON})`).run(J(moLai));
  if (mau.length) conn.prepare(`UPDATE viec_bao_ph SET lenh_mau = (SELECT json_extract(j.value, '$[1]') FROM json_each(?1) j WHERE json_extract(j.value, '$[0]') = viec_bao_ph.id)
      WHERE id IN (SELECT json_extract(value, '$[0]') FROM json_each(?1))`).run(J(mau));
  if (tach.length) conn.prepare(`UPDATE viec_bao_ph SET lenh_chuyen_id = NULL, lenh_mau = NULL, nhan = REPLACE(nhan, '${GOP}', '') WHERE id IN (${DS_JSON})`).run(J(tach));
  /* Gộp: một dòng hai nguồn — hạn = hạn muộn hơn (không rút ngắn hạn đang có). */
  if (gop.length) conn.prepare(`UPDATE viec_bao_ph SET lenh_chuyen_id = json_extract(j.value, '$[1]'), lenh_mau = json_extract(j.value, '$[2]'), nhan = nhan || '${GOP}',
        han = MAX(han, ?2) FROM json_each(?1) j WHERE viec_bao_ph.id = json_extract(j.value, '$[0]') AND viec_bao_ph.lenh_chuyen_id IS NULL`).run(J(gop), han);
  if (!them.length) return;
  const moi = conn.prepare(`INSERT INTO viec_bao_ph (measure_id, student_id, nhan, han, trang_thai, tao_luc, lenh_chuyen_id, lenh_mau)
      SELECT NULL, json_extract(j.value, '$[0]'), json_extract(j.value, '$[1]'), ?2, 'mo', ?3, json_extract(j.value, '$[2]'), json_extract(j.value, '$[3]') FROM json_each(?1) j WHERE true
      RETURNING id`).all(J(them), han, luc) as { id: number }[];
  const ids = moi.map((r) => r.id);
  chotLeadBaoPh(ids);   // VAI-0 (N76b): em chưa có TVV → Lead TVV gán chi nhánh em → Head
  /* Theo dõi mặc định (N72 ⑤): Head + CX + Lead TVV chi nhánh em (`theoDoiVaiBaoPh`) + người ra lệnh — một câu cho cả lô. */
  conn.prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc)
      SELECT 'bao_ph', v.id, l.nguoi_ra_lenh, 'tay', l.nguoi_ra_lenh, ?2 FROM viec_bao_ph v JOIN lenh_chuyen_lop l ON l.id = v.lenh_chuyen_id
       WHERE v.id IN (SELECT value FROM json_each(?1)) AND ${HOAT_DONG_O('l.nguoi_ra_lenh', 'COALESCE((SELECT c.branch_id FROM classes c WHERE c.id = l.lop_nguon_id), 0)')}
      ON CONFLICT(loai, ref_id, user_id) DO NOTHING`).run(J(ids), luc);
  theoDoiVaiBaoPh({ studentIds: [...new Set(them.map((x) => x[0]))] });
}

/**
 * BAOPH-0 ↔ LPB-0 (chiều ngược của gộp, gọi trong `dongBoViecTvvLuot`): em sắp có việc "Kết quả Final" mà đang có việc Báo PH · Chuyển lớp còn mở → nhập nguồn Final
 * vào việc đó (một dòng hai nguồn, hạn muộn hơn) thay vì sinh việc thứ hai. Trả id việc đã nhập, không có → null. Một câu đọc + một câu ghi.
 */
export function gopFinalVaoChuyenLop(phoiHopId: number, studentId: number, nhanFinal: string, han: string): number | null {
  const v = db().prepare(`SELECT id FROM viec_bao_ph WHERE student_id = ? AND trang_thai = 'mo' AND lenh_chuyen_id IS NOT NULL AND phoi_hop_id IS NULL
      AND nhan = '${NHAN_BAO_PH_CL.moi}' ORDER BY id LIMIT 1`).get(studentId) as { id: number } | undefined;
  if (!v) return null;
  db().prepare(`UPDATE viec_bao_ph SET phoi_hop_id = ?, nhan = ? || '${GOP}', han = MAX(han, ?) WHERE id = ?`).run(phoiHopId, nhanFinal, han, v.id);
  return v.id;
}

// ---------------------------------------------------------------- BPXL · Nhận thông tin

/** Người nhận MỘT việc BPXL của lớp (N74 / N77): CVXL nhận lớp → BPXL chi nhánh lớp ít việc mở nhất → Head. */
const nguoiNhanLop = (classId: number, cn: number | null): number | null => nguoiNhanTuDong('scheduler', cn, { lopId: classId }) ?? headCua(cn);

/** TRONG tx: một việc Nhận thông tin mới của lớp (hạn Chủ nhật từ hôm nay). */
function taoViec(loai: LoaiNhanTin, lop: { id: number; branch_id: number | null }, boi: number | null): number {
  return Number(db().prepare(`INSERT INTO viec_nhan_tin (loai, class_id, branch_id, trang_thai, han, nguoi_luat, tao_boi, tao_luc) VALUES (?, ?, ?, 'mo', ?, ?, ?, ?)`)
    .run(loai, lop.id, lop.branch_id, hanChuNhat(demoToday()), nguoiNhanLop(lop.id, lop.branch_id), boi, nowIso()).lastInsertRowid);
}

/** Tin "Cập nhật" cho người đang giữ việc ĐÃ XÁC NHẬN (không mở lại, không thêm việc — N73 ①). */
function tinCapNhat(v: { viec_id: number; giu: number | null; loai: string; lop: string }, chu: string, khoa: string, boi: number | null): void {
  if (!v.giu || v.giu === boi) return;
  notify({ userId: v.giu, kind: 'giao_viec', title: `Cập nhật · Nhận thông tin · ${TEN_NHAN_TIN[v.loai as LoaiNhanTin]} · ${v.lop}`, body: chu.slice(0, 160),
    entityType: 'class', entityId: null, dedupKey: `nt:${v.viec_id}:${khoa}`, duong: `/cong-viec?theo-doi=nhan_tin:${v.viec_id}` });
}
const DONG_VIEC = `d.id, d.viec_id, d.lenh_id, d.doi_id, d.mau, v.class_id, v.trang_thai, v.loai, c.code AS lop, COALESCE(v.phu_trach_id, v.nguoi_luat) AS giu`;

function dongBoNhanTinLenh(ls: Lenh[], boi: number | null, homNay: string): void {
  const conn = db();
  const dongs = conn.prepare(`SELECT ${DONG_VIEC} FROM viec_nhan_tin_dong d JOIN viec_nhan_tin v ON v.id = d.viec_id JOIN classes c ON c.id = v.class_id
      WHERE d.lenh_id IN (${DS_JSON})`).all(J(ls.map((l) => l.id))) as any[];
  const dich = [...new Set(ls.filter((l) => trangLenh(l, homNay) === 'sinh').map((l) => l.lop_dich_id!))];
  const lop = new Map<number, any>();
  const mo = new Map<number, number>();
  if (dich.length) {
    for (const c of conn.prepare(`SELECT id, code, branch_id FROM classes WHERE id IN (${DS_JSON})`).all(J(dich)) as any[]) lop.set(c.id, c);
    for (const v of conn.prepare(`SELECT class_id, MAX(id) AS id FROM viec_nhan_tin WHERE loai = 'chuyen_lop' AND trang_thai = 'mo' AND class_id IN (${DS_JSON}) GROUP BY class_id`)
      .all(J(dich)) as any[]) mo.set(v.class_id, v.id);
  }
  /* Tên em chỉ cần cho tin "Cập nhật" (việc đã xác nhận) — đọc MỘT lần khi cần. */
  let tenCua: Map<number, string> | null = null;
  const ten = { get: (sid: number) => (tenCua ??= new Map((conn.prepare(`SELECT id, full_name FROM students WHERE id IN (${DS_JSON})`).all(J(ls.map((l) => l.student_id))) as any[])
    .map((r) => [r.id as number, r.full_name as string]))).get(sid) };
  const dongViec = new Set<number>(); const mau: [number, string][] = [];
  const them: [number, number, string][] = [];   // việc · lệnh · mẫu
  const theoDoi = new Map<number, Set<number>>();
  const cvCua = new Map<number, number | null>();
  for (const l of ls) {
    const t = trangLenh(l, homNay);
    const d = t === 'sinh' ? l.lop_dich_id : null;
    const moc = t === 'sinh' ? mauLenh(l) : t;   // 'huy' | 'ngay' khi rời lớp đích
    /* Dòng của việc đã tự đóng, và dòng đã rời bảng ('x') của việc không còn mở: như không có. */
    const hl = dongs.filter((y) => y.lenh_id === l.id && y.trang_thai !== 'bo' && !(y.mau === ROI && y.trang_thai !== 'mo'));
    const tin = (x: any) => {
      const chu = t === 'huy' ? 'huỷ chuyển lớp' : t === 'ngay' ? 'chuyển lớp ngay hôm nay' : x.class_id === d ? `vào lớp từ ${tuanLich(l.tuan_bat_dau, homNay)}`
        : `chuyển sang lớp khác (${lop.get(d!)?.code ?? ''})`;
      tinCapNhat(x, `${ten.get(l.student_id) ?? 'Học viên'}: ${chu}`, `${l.id}:${moc}`, boi);
    };
    for (const x of hl) {
      if (x.class_id === d) {
        /* Cùng lớp đích: tuần đổi (đã xác nhận → tin "Cập nhật") · em về lại bảng. */
        if (x.mau === moc) continue;
        if (x.trang_thai === 'xong' && x.mau !== ROI) tin(x);
        mau.push([x.id, moc]);
      } else if (x.trang_thai === 'mo') {
        /* Việc còn mở: em rời bảng — ĐÁNH DẤU, không xoá (bản chụp Hoàn tác chuyển ngay / duyệt đề xuất đảo được). */
        if (x.mau !== ROI) { mau.push([x.id, ROI]); dongViec.add(x.viec_id); }
      } else if (x.mau !== moc) {
        /* Đã xác nhận mà em đổi lớp đích / huỷ / chuyển ngay → tin "Cập nhật" (một lần mỗi mẫu), dòng giữ làm lịch sử. */
        tin(x);
        mau.push([x.id, moc]);
      }
    }
    if (!d || hl.some((y) => y.class_id === d)) continue;
    let vid = mo.get(d);
    if (!vid) { vid = taoViec('chuyen_lop', lop.get(d), boi); mo.set(d, vid); }
    them.push([vid, l.id, moc]);
    const td = theoDoi.get(vid) ?? theoDoi.set(vid, new Set()).get(vid)!;
    td.add(l.nguoi_ra_lenh);
    if (!cvCua.has(l.lop_nguon_id)) cvCua.set(l.lop_nguon_id, cvxlCuaLop(l.lop_nguon_id));   // một câu mỗi lớp nguồn (lô cả lớp: một)
    const cvNguon = cvCua.get(l.lop_nguon_id);   // N77: CVXL lớp nguồn chỉ theo dõi
    if (cvNguon) td.add(cvNguon);
  }

  if (mau.length) conn.prepare(`UPDATE viec_nhan_tin_dong SET mau = (SELECT json_extract(j.value, '$[1]') FROM json_each(?1) j WHERE json_extract(j.value, '$[0]') = viec_nhan_tin_dong.id)
      WHERE id IN (SELECT json_extract(value, '$[0]') FROM json_each(?1))`).run(J(mau));
  if (them.length) conn.prepare(`INSERT INTO viec_nhan_tin_dong (viec_id, lenh_id, mau) SELECT json_extract(j.value, '$[0]'), json_extract(j.value, '$[1]'), json_extract(j.value, '$[2]')
      FROM json_each(?) j WHERE true`).run(J(them));
  if (dongViec.size) conn.prepare(`UPDATE viec_nhan_tin SET trang_thai = 'bo', bo_ly_do = 'het_em', bo_luc = ? WHERE trang_thai = 'mo' AND id IN (${DS_JSON})
      AND NOT EXISTS (SELECT 1 FROM viec_nhan_tin_dong d WHERE d.viec_id = viec_nhan_tin.id AND ${CON_DONG('d')})`).run(nowIso(), J([...dongViec]));
  for (const [vid, uids] of theoDoi) themTheoDoiNhanTin(vid, [...uids], boi);
}

/** Người theo dõi việc Nhận thông tin (trừ người đang giữ). Ít người — vài câu. */
function themTheoDoiNhanTin(viecId: number, uids: readonly number[], boi: number | null): void {
  const v = db().prepare('SELECT branch_id, COALESCE(phu_trach_id, nguoi_luat) AS giu FROM viec_nhan_tin WHERE id = ?').get(viecId) as { branch_id: number | null; giu: number | null };
  themTheoDoiDong('nhan_tin', viecId, uids.filter((u) => u !== v.giu), 'tay', boi, v.branch_id);
}

/**
 * TRONG tx của `luuPhanCong` (N73 ②): mỗi lớp có cặp đổi GV tích "Tạo việc bàn giao" → MỘT việc "Nhận thông tin · Đổi GV" của lớp (kể cả "Ngay hôm nay"). Người lưu theo dõi.
 * Theo LÔ cả lần lưu (nhiều lớp): CVXL các lớp một câu · chèn việc / dòng / theo dõi mỗi loại một câu.
 */
export function sinhNhanTinDoiGv(p: Principal, ds: readonly { lop: { id: number; branch_id: number | null }; doi: readonly { id: number; hieuLuc: string }[] }[]): void {
  const co = ds.filter((x) => x.doi.length);
  if (!co.length) return;
  const conn = db();
  const cv = new Map((conn.prepare(`SELECT l.class_id AS c, l.user_id AS u FROM lop_xep_lich l JOIN users u ON u.id = l.user_id WHERE l.class_id IN (${DS_JSON})
      AND u.status = 'active' AND u.deleted_at IS NULL AND ${CON_VAI_BPXL('l.user_id')}`).all(J(co.map((x) => x.lop.id))) as { c: number; u: number }[]).map((r) => [r.c, r.u]));
  const theoCn = new Map<number | null, number | null>();
  const nguoi = (x: (typeof co)[number]) => cv.get(x.lop.id) ?? (theoCn.has(x.lop.branch_id) ? theoCn.get(x.lop.branch_id)!
    : theoCn.set(x.lop.branch_id, (x.lop.branch_id ? itViecNhat(nhomVaiCn('scheduler', x.lop.branch_id)) : null) ?? headCua(x.lop.branch_id)).get(x.lop.branch_id)!);
  const luc = nowIso();
  const viec = conn.prepare(`INSERT INTO viec_nhan_tin (loai, class_id, branch_id, trang_thai, han, nguoi_luat, tao_boi, tao_luc)
      SELECT 'doi_gv', json_extract(j.value, '$[0]'), json_extract(j.value, '$[1]'), 'mo', ?2, json_extract(j.value, '$[2]'), ?3, ?4 FROM json_each(?1) j WHERE true RETURNING id, class_id`)
    .all(J(co.map((x) => [x.lop.id, x.lop.branch_id, nguoi(x)])), hanChuNhat(demoToday()), p.userId, luc) as { id: number; class_id: number }[];
  const vid = new Map(viec.map((v) => [v.class_id, v.id]));
  conn.prepare(`INSERT INTO viec_nhan_tin_dong (viec_id, doi_id, mau) SELECT json_extract(j.value, '$[0]'), json_extract(j.value, '$[1]'), json_extract(j.value, '$[2]') FROM json_each(?) j WHERE true`)
    .run(J(co.flatMap((x) => x.doi.map((d) => [vid.get(x.lop.id), d.id, d.hieuLuc]))));
  conn.prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc) SELECT 'nhan_tin', v.id, ?2, 'tay', ?2, ?3 FROM viec_nhan_tin v
      WHERE v.id IN (SELECT value FROM json_each(?1)) AND v.nguoi_luat IS NOT ?2 AND ${HL_NHAN_TIN('?2', 'v.branch_id')} ON CONFLICT(loai, ref_id, user_id) DO NOTHING`)
    .run(J(viec.map((v) => v.id)), p.userId, luc);
}

/**
 * TRONG tx sau khi lịch đổi GV đổi (Huỷ lịch đổi · Đổi mốc · Hoàn tác lưu · lần lưu sau thay lịch chờ): việc mở hết cặp còn hiệu lực → tự đóng, có lại → mở lại ·
 * việc đã xác nhận mà cặp đổi hiệu lực / bị huỷ → tin "Cập nhật". Ba câu cho cả lô.
 */
export function dongBoNhanTinDoi(doiIds: readonly number[], boi: number | null): void {
  if (!doiIds.length) return;
  const conn = db();
  const rows = conn.prepare(`SELECT ${DONG_VIEC}, p.trang_thai AS doi_tt, p.hieu_luc, p.khoa FROM viec_nhan_tin_dong d JOIN viec_nhan_tin v ON v.id = d.viec_id
      JOIN classes c ON c.id = v.class_id LEFT JOIN doi_phan_cong p ON p.id = d.doi_id WHERE d.doi_id IN (${DS_JSON})`).all(J([...new Set(doiIds)])) as any[];
  if (!rows.length) return;
  const mau: [number, string][] = [];
  for (const x of rows) {
    const moc = !x.doi_tt ? 'mat' : x.doi_tt === 'huy' ? 'huy' : x.hieu_luc;
    if (moc === x.mau) continue;
    mau.push([x.id, moc]);
    if (x.trang_thai === 'xong') tinCapNhat(x, `${x.khoa === 'gvcn' ? 'GVCN' : x.khoa ?? 'Phân công'}: ${moc === 'huy' || moc === 'mat' ? 'lịch đổi GV đã huỷ' : `hiệu lực ${tuanLich(moc, demoToday())}`}`, `${x.id}:${moc}`, boi);
  }
  if (mau.length) conn.prepare(`UPDATE viec_nhan_tin_dong SET mau = (SELECT json_extract(j.value, '$[1]') FROM json_each(?1) j WHERE json_extract(j.value, '$[0]') = viec_nhan_tin_dong.id)
      WHERE id IN (SELECT json_extract(value, '$[0]') FROM json_each(?1))`).run(J(mau));
  const viec = J([...new Set(rows.map((r) => r.viec_id))]);
  const CON = `EXISTS (SELECT 1 FROM viec_nhan_tin_dong d JOIN doi_phan_cong p ON p.id = d.doi_id WHERE d.viec_id = viec_nhan_tin.id AND p.trang_thai IN ('cho', 'da_ap'))`;
  conn.prepare(`UPDATE viec_nhan_tin SET trang_thai = 'bo', bo_ly_do = 'het_doi', bo_luc = ? WHERE trang_thai = 'mo' AND id IN (${DS_JSON}) AND NOT ${CON}`).run(nowIso(), viec);
  conn.prepare(`UPDATE viec_nhan_tin SET trang_thai = 'mo', bo_ly_do = NULL, bo_luc = NULL WHERE trang_thai = 'bo' AND bo_ly_do = 'het_doi' AND id IN (${DS_JSON}) AND ${CON}`).run(viec);
}

// ---------------------------------------------------------------- panel · Xác nhận · Mở lại

/** Làm được (Xác nhận / Mở lại): người đang giữ · lead BPXL (toàn hệ thống — N77) · Head / Quản trị / CX của chi nhánh lớp (làm hộ). */
const coTheLam = (p: Principal, v: ReturnType<typeof docViec>) => v.phuTrach.includes(p.userId) || laLeadBpxl(p) || vaiQuanLy(p, v.branchId);

export type DongEmNhanTin = { lenhId: number; studentId: number; ten: string; lopCu: { id: number; code: string }; lopMoi: { id: number; code: string } | null;
  tuan: string; huong: string | null; trangThai: 'cho' | 'da_chuyen' | 'huy' | 'roi';
  /** Lịch Mock đã xếp (chưa thi) và điều máy làm khi thi hành: đi theo em (FT → FT giữa khoá) · ở lại lớp cũ (mở khoá mới) · huỷ (FT → lớp thường). */
  lichMock: { ten: string; kieu: 'di_theo' | 'o_lai' | 'huy' }[] };
export type DongDoiNhanTin = { doiId: number; khoa: string; gvCu: string | null; gvMoi: string | null; hieuLuc: string; trangThai: string };
export type NhanTinView = { id: number; loai: LoaiNhanTin; tieuDe: string; lop: { id: number; code: string }; trangThai: 'mo' | 'xong' | 'bo';
  xong: { nguoi: string | null; luc: string } | null; coTheXacNhan: boolean; coTheMoLai: boolean; em: DongEmNhanTin[]; doi: DongDoiNhanTin[] };

/** Bảng của panel (sau `docViec` đã kiểm quyền đọc ở `xemGiaoViec`) — hai câu. Em vào Lưu trữ không còn trong bảng. */
export function xemNhanTin(p: Principal, id: number): NhanTinView {
  const v = docViec('nhan_tin', id);
  const r = v.row;
  const homNay = demoToday();
  const em: DongEmNhanTin[] = r.loai !== 'chuyen_lop' ? [] : (db().prepare(`SELECT d.lenh_id, l.student_id, s.full_name, l.lop_nguon_id, cn.code AS nguon, cn.is_fast_track AS nguon_ft,
        l.lop_dich_id, cd.code AS dich, cd.is_fast_track AS dich_ft, l.tuan_bat_dau, l.trang_thai, l.huong, l.boi_canh, d.mau,
        (SELECT json_group_array(json_object('no', a.attempt_no, 'tuan', rp.week_start)) FROM assessment_attempts a LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
          WHERE a.student_id = l.student_id AND a.status = 'planned' AND a.kind = 'mock' AND a.class_id = l.lop_nguon_id) AS mt
      FROM viec_nhan_tin_dong d JOIN lenh_chuyen_lop l ON l.id = d.lenh_id JOIN students s ON s.id = l.student_id AND s.archived_at IS NULL
      JOIN classes cn ON cn.id = l.lop_nguon_id LEFT JOIN classes cd ON cd.id = l.lop_dich_id WHERE d.viec_id = ? AND ${CON_DONG('d')} ORDER BY s.full_name, d.id`).all(id) as any[]).map((x) => {
    const kieu = x.boi_canh === 'cuoi-khoa' ? 'o_lai' : x.nguon_ft && !x.dich_ft ? 'huy' : x.nguon_ft ? 'di_theo' : 'o_lai';
    return {
      lenhId: x.lenh_id, studentId: x.student_id, ten: x.full_name, lopCu: { id: x.lop_nguon_id, code: x.nguon }, lopMoi: x.lop_dich_id ? { id: x.lop_dich_id, code: x.dich } : null,
      tuan: x.tuan_bat_dau, huong: NHAN_HUONG[x.huong] ?? null,
      trangThai: x.trang_thai === 'huy' ? 'huy' : x.lop_dich_id !== r.class_id ? 'roi' : x.trang_thai,
      lichMock: (JSON.parse(x.mt ?? '[]') as { no: number; tuan: string | null }[]).filter((m) => m.no != null).sort((a, b) => a.no - b.no)
        .map((m) => ({ ten: `MT${m.no}${m.tuan ? ` · ${tuanLich(m.tuan, homNay)}` : ''}`, kieu })),
    } as DongEmNhanTin;
  });
  const doi: DongDoiNhanTin[] = r.loai !== 'doi_gv' ? [] : (db().prepare(`SELECT d.doi_id, p.khoa, uc.full_name AS cu, um.full_name AS moi, p.hieu_luc, p.trang_thai
      FROM viec_nhan_tin_dong d JOIN doi_phan_cong p ON p.id = d.doi_id LEFT JOIN users uc ON uc.id = p.nguoi_cu LEFT JOIN users um ON um.id = p.nguoi_moi
      WHERE d.viec_id = ? ORDER BY d.id`).all(id) as any[]).map((x) => ({ doiId: x.doi_id, khoa: x.khoa, gvCu: x.cu ?? null, gvMoi: x.moi ?? null, hieuLuc: x.hieu_luc, trangThai: x.trang_thai }));
  const lam = coTheLam(p, v);
  return {
    id, loai: r.loai, tieuDe: v.tieuDe, lop: { id: r.class_id, code: r.lop_code }, trangThai: r.trang_thai,
    xong: r.trang_thai === 'xong' ? { nguoi: r.xong_ten ?? null, luc: r.xong_luc } : null,
    coTheXacNhan: r.trang_thai === 'mo' && lam, coTheMoLai: r.trang_thai === 'xong' && lam, em, doi,
  };
}

/** "Xác nhận đã nhận" — không ô nhập nào. Gửi lại khi đã xác nhận = trả bản đã lưu. */
export function xacNhanNhanTin(p: Principal, id: number): KhoiGiaoViec & { nhanTin: NhanTinView } {
  const v = docViec('nhan_tin', id);
  if (!coTheLam(p, v)) throw forbidden('Chỉ người phụ trách, lead BPXL hoặc Head chi nhánh xác nhận được việc này.');
  if (v.row.trang_thai === 'bo') throw conflict('Việc đã tự đóng (không còn em / lịch đổi đã huỷ).');
  if (v.row.trang_thai === 'mo') tx(() => {
    if (!db().prepare(`UPDATE viec_nhan_tin SET trang_thai = 'xong', xong_boi = ?, xong_luc = ? WHERE id = ? AND trang_thai = 'mo'`).run(p.userId, nowIso(), id).changes) {
      throw conflict('Việc vừa được cập nhật — mở lại.');
    }
    ghiLan('nhan_tin', id, 'xong', null, p.userId, p.userId);
    const aid = writeAudit({ actorUserId: p.userId, action: 'nhan_tin.xac_nhan', entityType: 'viec_nhan_tin', entityId: id, entityLabel: v.tieuDe, before: { trangThai: 'mo' }, after: { trangThai: 'xong' } });
    baoTheoDoi('nhan_tin', id, p.userId, { suKien: 'xong', tieuDe: v.tieuDe, khoa: aid });
  });
  return { ...xemGiaoViec(p, 'nhan_tin', id), nhanTin: xemNhanTin(p, id) };
}

/** Hoàn tác / Mở lại (⋯) — việc đã xác nhận về đang mở (hạn giữ). */
export function moLaiNhanTin(p: Principal, id: number): KhoiGiaoViec & { nhanTin: NhanTinView } {
  const v = docViec('nhan_tin', id);
  if (!coTheLam(p, v)) throw forbidden('Chỉ người phụ trách, lead BPXL hoặc Head chi nhánh mở lại được việc này.');
  if (v.row.trang_thai !== 'xong') throw badRequest('Việc chưa xác nhận — không có gì để mở lại.');
  tx(() => {
    if (!db().prepare(`UPDATE viec_nhan_tin SET trang_thai = 'mo', xong_boi = NULL, xong_luc = NULL WHERE id = ? AND trang_thai = 'xong'`).run(id).changes) throw conflict('Việc vừa được cập nhật — mở lại.');
    ghiLan('nhan_tin', id, 'mo_lai', v.row.xong_boi ?? null, null, p.userId);
    writeAudit({ actorUserId: p.userId, action: 'nhan_tin.mo_lai', entityType: 'viec_nhan_tin', entityId: id, entityLabel: v.tieuDe, before: { trangThai: 'xong' }, after: { trangThai: 'mo' } });
  });
  return { ...xemGiaoViec(p, 'nhan_tin', id), nhanTin: xemNhanTin(p, id) };
}

