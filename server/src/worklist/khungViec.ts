/**
 * LPB-1 (N73 ⑤, đặc tả `docs/superpowers/specs/2026-11-26-viec-lien-phong-ban/thiet-ke.md` 4.5) — tệp LÁ (chỉ db + bộ nhớ request + hieuLuc), để mọi hàm ghi
 * (lịch thi, Bước tiếp, thi thật, hồ sơ, bàn giao…) hỏi "người này có đang được giao đúng việc này không" mà không tạo vòng import.
 *
 * Mười loại việc có KHUNG (Phụ trách · Hạn · Theo dõi · Việc con) nhưng vẫn TÍNH khi đọc như nay (người mặc định, điều kiện xong giữ nguyên — N6, N20, N21, N57, N64):
 * bảng phụ chỉ có dòng khi có người giao / đặt hạn / mô tả / theo dõi (mẫu `viec_xu_ly`). Việc đã giao rời dòng của người mặc định; hạn đặt tay thắng hạn luật.
 */
import { db } from '../db.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { CN_EM, HOAT_DONG_O } from './hieuLuc.ts';
import type { Principal } from '../permissions.ts';

export const LOAI_KHUNG = ['chot_ngay_thi', 'buoc_tiep', 'thi_that', 'bo_sung_ho_so', 'ban_giao', 'ban_giao_mon', 'ban_giao_gv', 'chot_lo_trinh', 'xet_lai', 'xep_lich_mt'] as const;
export type LoaiKhung = (typeof LOAI_KHUNG)[number];
export const laKhung = (loai: string): loai is LoaiKhung => (LOAI_KHUNG as readonly string[]).includes(loai);

export const BANG_KHUNG: Record<LoaiKhung, string> = {
  chot_ngay_thi: 'viec_chot_ngay_thi', buoc_tiep: 'viec_buoc_tiep', thi_that: 'viec_thi_that', bo_sung_ho_so: 'viec_bo_sung_ho_so',
  ban_giao: 'viec_ban_giao', ban_giao_mon: 'viec_ban_giao_mon', ban_giao_gv: 'ban_giao_gv', chot_lo_trinh: 'viec_chot_lo_trinh', xet_lai: 'viec_xet_lai', xep_lich_mt: 'viec_xep_lich_mt',
};
export const NHAN_KHUNG: Record<LoaiKhung, string> = {
  chot_ngay_thi: 'Chốt ngày thi', buoc_tiep: 'Chọn bước tiếp', thi_that: 'Cập nhật KQ thi thật', bo_sung_ho_so: 'Bổ sung hồ sơ thiếu', ban_giao: 'Bàn giao',
  ban_giao_mon: 'Bàn giao môn', ban_giao_gv: 'Bàn giao đổi GV', chot_lo_trinh: 'Chốt lộ trình', xet_lai: 'Xét lại lộ trình', xep_lich_mt: 'Xếp lịch MT',
};
/** Việc của lớp (không một em). */
export const KHUNG_LOP: ReadonlySet<LoaiKhung> = new Set(['ban_giao', 'ban_giao_mon', 'ban_giao_gv', 'chot_lo_trinh', 'xet_lai']);
/** Rà PTA #2280 (bảo mật 3, [XM]): việc TVV + Bàn giao KHÔNG giao cho người chỉ có vai BPXL ở chi nhánh việc (BPXL không đọc Case / PA / Ý thức — N57). */
export const KHUNG_KHONG_BPXL: ReadonlySet<LoaiKhung> = new Set(['chot_ngay_thi', 'buoc_tiep', 'thi_that', 'bo_sung_ho_so', 'ban_giao', 'ban_giao_mon', 'ban_giao_gv']);
/** Việc Head (N63 ①): chỉ giao cho người có quyền chốt / xếp lịch — người nhận kiểm ở `kiemNguoiNhanKhung`. */
export const KHUNG_CO_QUYEN: ReadonlySet<LoaiKhung> = new Set(['chot_lo_trinh', 'xet_lai', 'xep_lich_mt']);

const SID_LT = (v: string) => `(SELECT lc_.student_id FROM learning_cycles lc_ WHERE lc_.id = ${v}.id)`;
const SID_MOC = (v: string) => `(SELECT COALESCE(sc_.student_id, a_.student_id) FROM case_interventions iv_ JOIN sos_cases sc_ ON sc_.id = iv_.case_id
  LEFT JOIN assessment_attempts a_ ON a_.id = sc_.attempt_id WHERE iv_.id = ${v}.id)`;
/** Câu SQL: id em của dòng việc (`v` = bí danh bảng phụ); việc của lớp → NULL. */
export const SID_KHUNG: Record<LoaiKhung, (v: string) => string> = {
  chot_ngay_thi: SID_LT, buoc_tiep: SID_LT, thi_that: SID_LT, bo_sung_ho_so: (v) => `${v}.id`, xep_lich_mt: SID_MOC,
  ban_giao: () => 'NULL', ban_giao_mon: () => 'NULL', ban_giao_gv: () => 'NULL', chot_lo_trinh: () => 'NULL', xet_lai: () => 'NULL',
};
const CN_LOP = (lop: string) => `(SELECT cl_.branch_id FROM classes cl_ WHERE cl_.id = ${lop})`;
/** Câu SQL: chi nhánh HIỆN TẠI của việc — chi nhánh em; việc của lớp = chi nhánh lớp. */
export const CN_KHUNG = (loai: LoaiKhung, v: string): string =>
  loai === 'ban_giao_mon' ? CN_LOP(`${v}.lop_id`) : loai === 'ban_giao_gv' ? CN_LOP(`${v}.class_id`) : KHUNG_LOP.has(loai) ? CN_LOP(`${v}.id`) : CN_EM(SID_KHUNG[loai](v));

/** Câu SQL: tên em (việc của em) / mã lớp (việc của lớp) của dòng bảng phụ `v`. */
const TEN_KHUNG = (l: LoaiKhung, v: string) => (KHUNG_LOP.has(l)
  ? `(SELECT c_.code FROM classes c_ WHERE c_.id = ${l === 'ban_giao_mon' ? `${v}.lop_id` : l === 'ban_giao_gv' ? `${v}.class_id` : `${v}.id`})`
  : `(SELECT s_.full_name FROM students s_ WHERE s_.id = ${SID_KHUNG[l](v)})`);
export type GiaoKhung = { loai: LoaiKhung; id: number; pt: number | null; han: string | null; giaoTen: string | null; sid: number | null; lop: number | null; mon: string | null;
  /** Rà #2280 vòng 3: người được giao đã làm (dòng còn 'mo' — Hoàn tác ngắn) + trường đã lưu (Bổ sung hồ sơ). */ lamBoi: number | null; lamTruong: string[];
  /** PTA 28/11 (a): chi nhánh hiện tại của việc + tên em / mã lớp (Head / GĐCN theo dõi mặc định việc đã giao — tab Đang theo dõi dựng dòng gọn, rà #2334 P2-1). */
  cn: number | null; ten: string | null };
const khoa = (loai: LoaiKhung, id: number | string) => `${loai}:${id}`;

/**
 * MỌI việc khung đang mở có người giao / hạn đặt tay (thường vài dòng) — MỘT câu mỗi request (chỉ mục một phần `phu_trach_id`; dòng chỉ hạn quét bảng nhỏ).
 * `pt` chỉ khi người được giao còn hoạt động + còn vai ở chi nhánh của việc (hết hiệu lực → như chưa giao: việc về người mặc định).
 * Khoá `loai:id`; Bàn giao môn thêm khoá `ban_giao_mon:{lớp}:{môn}` (Công việc tính theo lớp × môn).
 */
export function giaoKhung(): Map<string, GiaoKhung> {
  return nho('lpb1:giao-khung', () => {
    const ve = LOAI_KHUNG.map((l) => {
      const b = BANG_KHUNG[l];
      return `SELECT '${l}' AS loai, v.id AS id, CASE WHEN v.phu_trach_id IS NOT NULL AND ${HOAT_DONG_O('v.phu_trach_id', CN_KHUNG(l, 'v'))} THEN v.phu_trach_id END AS pt,
          v.han_chon AS han, v.giao_boi, ${SID_KHUNG[l]('v')} AS sid, ${CN_KHUNG(l, 'v')} AS cn, ${TEN_KHUNG(l, 'v')} AS ten, ${l === 'ban_giao_mon' ? 'v.lop_id' : 'NULL'} AS lop, ${l === 'ban_giao_mon' ? 'v.mon' : 'NULL'} AS mon,
          ${l === 'ban_giao_gv' ? 'NULL AS lam_boi, NULL AS lam_truong' : 'v.lam_boi AS lam_boi, v.lam_truong AS lam_truong'}
        FROM ${b} v WHERE v.trang_thai = 'mo' AND (v.phu_trach_id IS NOT NULL OR v.han_chon IS NOT NULL)`;
    });
    const m = new Map<string, GiaoKhung>();
    for (const r of db().prepare(`SELECT x.*, g.full_name AS giao_ten FROM (${ve.join(' UNION ALL ')}) x LEFT JOIN users g ON g.id = x.giao_boi`).all() as any[]) {
      const g: GiaoKhung = { loai: r.loai, id: r.id, pt: r.pt ?? null, han: r.han ?? null, giaoTen: r.pt ? r.giao_ten ?? null : null, sid: r.sid ?? null, lop: r.lop ?? null, mon: r.mon ?? null,
        lamBoi: r.pt && r.lam_boi === r.pt ? r.lam_boi : null, lamTruong: r.lam_truong ? JSON.parse(r.lam_truong) : [], cn: r.cn ?? null, ten: r.ten ?? null };
      m.set(khoa(g.loai, g.id), g);
      if (g.loai === 'ban_giao_mon') m.set(khoa('ban_giao_mon', `${g.lop}:${g.mon}`), g);
    }
    return m;
  });
}
export const giaoCua = (loai: LoaiKhung, id: number | string): GiaoKhung | undefined => giaoKhung().get(khoa(loai, id));
/** Việc khung giao cho `uid` (còn hiệu lực) của các loại `loai`. */
export const giaoChoNguoi = (uid: number, ...loai: LoaiKhung[]): GiaoKhung[] => [...new Set(giaoKhung().values())].filter((g) => g.pt === uid && loai.includes(g.loai));

/**
 * Người giữ việc sau khi xét giao: giao cho tôi → của tôi; giao người khác → bỏ (người mặc định không thấy), "Tất cả" (`tatCa`, người xem có phạm vi — `goc` khác null)
 * đứng tên người được giao; chưa giao → `goc` (người mặc định như nay). `han` = hạn đặt tay (thắng hạn luật).
 */
export function chuKhung(p: Principal, tatCa: boolean, loai: LoaiKhung, id: number | string, goc: { ownerId: number | null; mine: boolean } | null):
  { ownerId: number | null; mine: boolean; giaoBoi?: string | null; han?: string | null; viec?: { loai: LoaiKhung; id: number } } | null {
  const g = giaoCua(loai, id);
  if (!g) return goc;
  const them = { ...(g.han ? { han: g.han } : {}), viec: { loai, id: g.id } };
  if (!g.pt) return goc ? { ...goc, ...them } : null;
  if (g.pt === p.userId) return { ownerId: p.userId, mine: true, giaoBoi: g.giaoTen, ...them };
  return tatCa && goc ? { ownerId: g.pt, mine: false, giaoBoi: g.giaoTen, ...them } : null;
}

/**
 * Người xem ĐANG là người được giao (còn hiệu lực) của đúng việc này — quyền ghi mở cho đúng việc đó (N58, N73 ⑤). Đọc `giaoKhung` (một câu mỗi request,
 * chung với Công việc). Bàn giao môn: `id` = `{lớp}:{môn}`. Nơi gọi hỏi SAU quyền vai (người có vai: 0 câu).
 */
export function duocGiao(p: Principal, loai: LoaiKhung, id: number | string): boolean {
  const g = giaoCua(loai, id);
  /* Rà PTA #2280 (bảo mật 1): quyền theo việc đóng khi việc xong (không chờ lượt quét ngày) — "còn việc" cùng hàm Công việc (`khungDoc`, đăng ký lúc nạp;
     chưa nạp → chặn). P1-A (luật "không khoá cứng"): người được giao ĐÃ LÀM việc (`lam_boi`) giữ quyền Hoàn tác / sửa lại như người giữ mặc định; người được giao
     mà việc hết do người khác làm / giao đi / Lưu trữ thì không. */
  /* Rà #2280 vòng 3: "người đã làm" = Hoàn tác NGẮN — chỉ khi dòng còn 'mo' (trước lượt quét ngày đóng dòng); dòng 'xong' / 'bo' không mở quyền. */
  if (g?.pt !== p.userId) return false;
  return g.lamBoi === p.userId || (!!conMo && nho(`lpb1:con-mo:${loai}:${g.id}`, () => conMo!(loai, g.id)));
}
/** Câu điều kiện một dòng bảng phụ theo id (Bàn giao môn: `{lớp}:{môn}`). */
const dongTheo = (loai: LoaiKhung, id: number | string): [string, unknown[]] =>
  loai === 'ban_giao_mon' && typeof id === 'string' ? ['v.lop_id = ? AND v.mon = ?', [Number(id.split(':')[0]), id.split(':').slice(1).join(':')]] : ['v.id = ?', [Number(id)]];
/** Trường người xem đã lưu cho việc này (người được giao đã làm, dòng còn 'mo') — Bổ sung hồ sơ chỉ sửa lại được đúng các trường đó. Đọc `giaoKhung` (0 câu thêm). */
export function truongDaLam(p: Principal, loai: LoaiKhung, id: number | string): string[] {
  const g = giaoCua(loai, id);
  return g?.pt === p.userId && g.lamBoi === p.userId ? g.lamTruong : [];
}
/**
 * Đường ghi mở bằng `duocGiao`: ghi người được giao là người đã làm (+ trường vừa lưu, gộp với lần trước) — một câu theo khoá chính; dòng không giao cho người này
 * → không đổi. Gọi TRONG giao dịch lưu, sau câu ghi chính.
 */
export function ghiNguoiLam(p: Principal, loai: LoaiKhung, id: number | string, truong: readonly string[] = []): void {
  if (loai === 'ban_giao_gv') return;
  const [dk, ts] = dongTheo(loai, id);
  const cu = truong.length ? truongDaLam(p, loai, id) : [];
  db().prepare(`UPDATE ${BANG_KHUNG[loai]} AS v SET lam_boi = ?, lam_truong = ? WHERE ${dk} AND v.trang_thai = 'mo' AND v.phu_trach_id = ?`)
    .run(p.userId, truong.length ? JSON.stringify([...new Set([...cu, ...truong])]) : null, ...ts, p.userId);
}
/** `khungDoc.ts` đăng ký hàm "việc còn mở" (tệp này là tệp lá — không import ngược). */
let conMo: ((loai: LoaiKhung, id: number) => boolean) | null = null;
export const datConMo = (f: (loai: LoaiKhung, id: number) => boolean) => { conMo = f; };
