import { db } from '../db.ts';
import { CHU_DA_XONG, CHU_THEM_PA, HAN_GAN_NGAY, PERMISSIONS, hanBanGiao, kyGhiKetQua, nhanLoaiXuLy, tenMon, type DaiHocVien, nhanBaiThuong } from '../../../shared/domain/index.ts';
import { boVaiCx, can, coVaiCx, isCoreTeacherOf, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, diffDays } from '../util.ts';
import type { EmYThuc } from '../yThuc/trangThai.ts';
import { viecBuocTiep } from '../loTrinh/buocTiep.ts';
import { chuViecTvv, tvvCuaEm } from '../worklist/viecTvv.ts';
import { hanGhiKetQuaToi, viecNhapDiemCuaEm } from '../worklist/mywork.ts';
import { viecHoiTinhHinhCuaToi } from '../yThuc/tinhHinh.ts';
import type { SauThiEm } from '../loTrinh/thiThat.ts';
import { duongHoSoHocVien, quaHanBaoPh } from '../../../shared/domain/index.ts';
import { dongPhoiHopTheoViec } from '../yThuc/phoiHop.ts';
import { viecBaoPhCuaToi } from '../yThuc/baoPhTvv.ts';
import { dongViecGiao, viecGiaoChoToi } from '../worklist/giaoViec.ts';
import { kem, type Bien } from '../../../shared/i18n/index.ts';

/** Độ gấp của hạn (V22) — MỘT hàm cho mọi dòng việc của hồ sơ; `quaHan` ép đỏ khi nguồn đã có cờ quá hạn riêng (ô Nhập điểm). */
const gapCua = (han: string | null, today: string, quaHan = false): ViecHocVien['gap'] =>
  quaHan || (han && han < today) ? 'qua-han' : !han ? null : han <= addDays(today, HAN_GAN_NGAY) ? 'gan' : 'chua';

export type ViecHocVien = {
  /** Đúng khoá của `myWork` (Q2) — phép kiểm so hai đường theo khoá. Việc "chờ Quản lý duyệt" không có ở Công việc → khoá `cho-duyet:…`. */
  key: string;
  loai: 'nguyen-nhan' | 'de-ra-pa' | 'xac-nhan-pa' | 'ghi-ket-qua' | 'cho-duyet' | 'bao-ph' | 'mini-test' | 'y-thuc' | 'yt-xem' | 'yt-thuc-hien'
    | 'ban-giao' | 'ban-giao-mon' | 'buoc-tiep' | 'thi-that' | 'nhap-diem' | 'tinh-hinh'
    /* P1-04 (B2-06, B2-07): cùng nhóm Công việc `phoi_hop_sos` · `phoi_hop_tvv` · `bao_ph_yt` · `bo_sung_ho_so`. */
    | 'phoi-hop-sos' | 'phoi-hop-tvv' | 'bao-ph-yt' | 'bo-sung';
  /** "Kết quả W3–W4 SEP · PA Tăng cường bài tập Writing Task 2" — động từ đầu câu. */
  chu: string;
  /** PR-EN-c: khoá + biến của `chu` (câu có biến) — web dịch bằng `dichChu`. Câu không biến dịch theo chính `chu`. */
  khoa?: string; bien?: Bien;
  /** U02 (mockup `audit-0311/u02` dòng 3): thẻ phụ dưới tên việc — "Kỳ W5 OCT – W1 NOV" · "PA Học Tutor" (chữ, tên PA giữ nguyên). */
  the?: { chu: string; khoa?: string; bien?: Bien }[];
  kyNang: string | null; caseId: number | null; paId: number | null;
  /** P1-04: id việc Báo PH (`viec_bao_ph`) — panel Ghi báo PH của Công việc ghi đúng việc. */
  viecId?: number;
  han: string | null; quaHanNgay: number | null;
  /** GD-7a (luật hạn V22): độ gấp để web tô màu — đỏ quá hạn · vàng gần tới hạn (≤ `HAN_GAN_NGAY`) · thường chưa tới · null không hạn. KHÔNG chuỗi ⚠. */
  gap: 'qua-han' | 'gan' | 'chua' | null;
  tone: 'danger' | 'warn' | 'info' | 'wait';
  /** "Đỗ Thanh Tùng · GVBM Speaking" · "Quản lý" (vai, không tên). */
  nguoi: { id: number | null; ten: string; vai: string | null };
  cuaBan: boolean;
  /** Nút động từ + chỗ mở (Ngăn Case / tab Ý thức / trang bàn giao). */
  nut: string;
  mo: { loai: 'case'; caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa' | 'them-pa' }
    | { loai: 'tab'; tab: 'y-thuc'; sub?: 'phoi-hop' }
    /** GD-7a: panel Nhập điểm lớp × tuần của việc (như Công việc: `classId` · `luot` · `kns` · `tuanThi`). */
    | { loai: 'nhap-diem'; classId: number; luot: string; kns: string[]; tuanThi: string | null; periodId: number | null; kind: string | null; soBai: number | null }
    /** GD-7a: panel Trả lời tình hình (`viecId` = id câu hỏi, như `yt_hoi_tinh_hinh:{id}` của Công việc) · GD-7: `cauHoi` = câu TVV hỏi (đầu panel). */
    | { loai: 'tinh-hinh'; viecId: number; cauHoi: string }
    | { loai: 'duong'; href: string } | null;
};

type Nguon = {
  /** OV-13m: lộ trình FT mới nhất có kết quả thi thật, chưa chọn bước tiếp — chỉ khi đó mới hỏi việc "Chọn bước tiếp" (một câu). */
  choBuocTiep?: boolean;
  /** OV-13q: lộ trình FT mới nhất "Đã thi · chờ kết quả" (`sauThiCuaEm`) — việc "Cập nhật kết quả thi thật" của người nhập được. */
  sauThi?: SauThiEm | null;
  trangThaiEm: string; lopId: number | null; chuongTrinh: string | null;
  yThuc: EmYThuc | null | undefined;
  /** `gv` = người dạy bổ trợ có tài khoản đầu tiên của nhóm (cùng câu `myWork`), null → GVCN. */
  miniTest: { id: number; han: string | null; tyLe: number | null; nhom: string; caseId: number | null; paId: number | null; gv: number | null } | null;
  dai: DaiHocVien | null;
  /** P1-04: TVV của em + các trường hồ sơ còn thiếu (cùng `missingForStudent` của việc "Bổ sung hồ sơ thiếu", `viecHoSoTvv`) — hồ sơ đã nạp, 0 câu. */
  boSung?: { tvv: number | null; thieu: string[] } | null;
};

/**
 * VIỆC CỦA MỘT EM THEO NGƯỜI (PR-VAI-b Task 2, K3-01) — mọi việc đang mở của em, MỖI VIỆC CÓ NGƯỜI LÀM, cùng luật người làm với Công việc (Q2):
 *   Xác nhận nguyên nhân / Thêm PA / Xác nhận PA → người phụ trách Case · Ghi kết quả PA → người giữ việc (`nguoiGiuKetQua`, đọc từ `plan.nguoiId` của bảng)
 *   · Báo PH kết quả Test, Xử lý vi phạm, Ghi nhận vi phạm mới, Ghi "Đã thực hiện" → GVCN (Báo PH Cuối khoá → Quản lý) · Mini Test → người giữ việc (`nguoiGiuMiniTest`, PR-CT2), không có thì GVCN · Bàn giao → người xem
 *   theo `dai.nut` · "Chờ Quản lý duyệt…" → "Quản lý" (không ai trong số giáo viên, không vào thanh việc).
 * KHÔNG chạy `myWork` (quét cả phạm vi): Case/PA đọc từ `board` đã dựng, Ý thức / Mini Test / dải chuyển lớp do hồ sơ nạp sẵn.
 * Thêm hai câu: Báo PH của em · tên + vai người làm. Em Tạm dừng / đã kết thúc → rỗng (mọi hạn dừng, T65) — trừ "Chọn bước tiếp sau thi" (OV-12a).
 */
export function viecCuaHocVien(p: Principal, sid: number, board: { rows: any[] }, n: Nguon): { cuaBan: ViecHocVien[]; nguoiKhac: ViecHocVien[] } {
  const today = demoToday();
  /* OV-12a → OV-13m: lộ trình FT có kết quả thi thật (em còn học, Tạm dừng hay đã Kết thúc học) — "Chọn bước tiếp" của người xem; cùng tập + quyền với Công việc
     (`viecBuocTiep`: QL / TVV của chi nhánh). Dòng: "Đã xong · OVR 6.5 · Đạt Target" + nút mở panel Bước tiếp. */
  const bt: ViecHocVien[] = (n.choBuocTiep === false ? [] : viecBuocTiep(p, { today, branchId: null, studentId: sid })).map((v) => {
    const quaHanNgay = v.due < today ? diffDays(today, v.due) : null;
    /* UI-HO-SO-HV (nợ #515): câu bắt đầu bằng động từ như mọi việc — "Chọn bước tiếp · OVR 6.5 · Đạt Target" (không "Đã xong · …"). */
    const kq = String(v.contextLabel ?? '').replace(new RegExp(`^${CHU_DA_XONG}( · )?`), '');   // contextLabel = nhanDaXong(…) [· đã gia hạn]
    return { key: v.key, loai: 'buoc-tiep', chu: kq ? `Chọn bước tiếp · ${kq}` : 'Chọn bước tiếp', ...(kq ? { khoa: 'Chọn bước tiếp · {kq}', bien: { kq } } : {}), kyNang: null, caseId: null, paId: null, han: v.due, quaHanNgay, gap: gapCua(v.due, today),
      tone: quaHanNgay !== null ? 'danger' : 'info', nguoi: { id: p.userId, ten: p.fullName, vai: null }, cuaBan: true, nut: 'Chọn bước tiếp ›', mo: { loai: 'duong', href: v.href } };
  });
  /* OV-13q: "Cập nhật kết quả thi thật ›" mở panel Kết quả thi thật ngay trong hồ sơ (`?viec=thi-that`); hạn = hạn sau thi (cùng việc Công việc). */
  const st = n.sauThi;
  /* SV-TVV-VIEC: việc của người giữ (TVV của em / QL khi em chưa có TVV) — GVCN vẫn nhập được ở panel nhưng không còn là việc của GVCN. */
  if (st && st.giaiDoan === 'da_thi_cho_kq' && st.coTheNhap && chuViecTvv(p, sid, tvvCuaEm([sid]).get(sid) ?? null)) {
    const quaHanNgay = st.quaHan && st.han ? diffDays(today, st.han) : null;
    bt.push({ key: `thi_that:${st.cycleId}`, loai: 'thi-that', chu: 'Cập nhật kết quả thi thật', kyNang: null, caseId: null, paId: null, han: st.han, quaHanNgay, gap: gapCua(st.han, today),
      tone: quaHanNgay !== null ? 'danger' : 'info', nguoi: { id: p.userId, ten: p.fullName, vai: null }, cuaBan: true, nut: 'Cập nhật kết quả thi thật ›',
      mo: { loai: 'duong', href: duongHoSoHocVien(sid, { loTrinh: st.cycleId, viec: 'thi-that' }) } });
  }
  if (n.trangThaiEm !== 'active') return { cuaBan: bt, nguoiKhac: [] };
  const conn = db();
  type Nhap = Omit<ViecHocVien, 'nguoi' | 'cuaBan' | 'quaHanNgay' | 'gap'> & { nguoiId: number | null; vaiChu?: string; cuaBanTheoVai?: boolean; quaHan?: boolean;
    /** TL-1 (rà #1927 (3)): Báo PH "Chờ GV sửa" — hạn tạm dừng (`quaHanBaoPh`). */ tamDung?: boolean };
  const ds: Nhap[] = [];

  /* N46: Case của lộ trình đã có KQ thi thật (`sauThi`, cùng `CASE_SAU_THI_SQL` với Công việc) không sinh việc. */
  const cases = board.rows.flatMap((r) => r.cases.filter((c: any) => c.status !== 'done' && !c.sauThi).map((c: any) => ({ r, c })));
  /* Nhóm PA bổ trợ chung: MỘT dòng mỗi nhóm (id nhỏ nhất) như Công việc (`mywork.ts` 2b, 3c). */
  const minNhom = (loc: (pl: any) => boolean) => {
    const m = new Map<string, number>();
    for (const { c } of cases) for (const pl of c.plans) if (pl.kind === 'bo_tro' && pl.nhom && loc(pl)) m.set(pl.nhom, Math.min(m.get(pl.nhom) ?? Infinity, pl.id));
    return m;
  };
  /* P1 G2-03 (rà 11/11): "Ghi kết quả PA" chỉ thành việc từ hạn − 2 — cùng khung Công việc (`hanGhiKetQuaToi`); sớm hơn thì PA có nút "Cập nhật trước hạn". */
  const khungKq = hanGhiKetQuaToi(today);
  const chayDuoc = (pl: any) => (pl.status === 'planned' || pl.status === 'started') && !!pl.actionDue && pl.actionDue <= khungKq && !pl.pendingApproval && !(pl.preset && !pl.confirmedAt);
  const minGhi = minNhom(chayDuoc);
  /* Đề xuất #1 (rà 11/11): lần ghi cuối PA bổ trợ mà nhóm có Mini Test chờ → việc là "Ghi Mini Test", không "Ghi kết quả" (cùng `boKetQuaChoMiniTest` của Công việc). */
  const choMini = n.miniTest && n.miniTest.tyLe === null ? n.miniTest.nhom : null;

  for (const { r, c } of cases) {
    const kn: string = r.label;
    const v = c.viecTiep as { chu: string; han: string | null } | null;
    /* OV-12c: Progress "Xác nhận Case" (một bước); Case MT chưa mô tả → "Mô tả Case" (MO-TA-CASE, N8). */
    if (v?.chu === 'Xác nhận Case' || v?.chu === 'Mô tả Case') {
      const xn = v.chu === 'Xác nhận Case';
      ds.push({ key: `${xn ? 'cause' : 'ghi_nhan_xet'}:${c.id}`, loai: 'nguyen-nhan', ...(xn ? kem('Xác nhận Case {kn}', { kn }) : kem('Mô tả Case {kn}', { kn })), kyNang: r.category, caseId: c.id, paId: null,
        han: v.han, tone: 'info', nguoiId: c.ownerId ?? null, nut: v.chu, mo: { loai: 'case', caseId: c.id, viec: 'xac-nhan' } });   // Ngăn Case mở đúng khối theo trạng thái
    }
    /* PR-S6F-b (Q5): Case chưa có PA → "Thêm PA" của người phụ trách Case; khoá `support:{caseId}` như Công việc (nhóm no_plan), hạn = hạn lập PA. */
    if (v?.chu === CHU_THEM_PA) {
      ds.push({ key: `support:${c.id}`, loai: 'de-ra-pa', ...kem('Thêm PA {kn}', { kn }), kyNang: r.category, caseId: c.id, paId: null,
        han: v.han, tone: 'info', nguoiId: c.ownerId ?? null, nut: CHU_THEM_PA, mo: { loai: 'case', caseId: c.id, viec: 'them-pa' } });
    }
    if (v?.chu === 'Chờ Head duyệt · không theo dõi') {
      ds.push({ key: `cho-duyet:case:${c.id}`, loai: 'cho-duyet', ...kem('Case {kn} chờ Head duyệt · không theo dõi', { kn }), kyNang: r.category, caseId: c.id, paId: null,
        han: null, tone: 'wait', nguoiId: null, vaiChu: 'Head', nut: 'Mở Case', mo: { loai: 'case', caseId: c.id } });
    }
    for (const pl of c.plans) {
      /* P1 G2-02: Case chờ QL duyệt "không theo dõi" — việc ở Quản lý, không giao Xác nhận PA (cùng `viecTiepCuaCase` và `mywork.ts` `CO_THE_KHONG_THEO_DOI`). */
      if (pl.choXacNhan && c.sos?.hasCause && !c.sos?.choDuyetKhongTheoDoi) {
        ds.push({ key: `xnpa:${pl.id}`, loai: 'xac-nhan-pa', ...kem('Xác nhận PA {pa} · {kn}', { pa: pl.name, kn }), kyNang: r.category, caseId: c.id, paId: pl.id,
          han: c.sos?.dueOn ?? null, tone: 'info', nguoiId: c.ownerId ?? null, nut: 'Xác nhận PA', mo: { loai: 'case', caseId: c.id, paId: pl.id, viec: 'xac-nhan-pa' } });
      }
      if (chayDuoc(pl) && !(pl.kind === 'bo_tro' && pl.nhom && minGhi.get(pl.nhom) !== pl.id) && !(pl.lanCuoi && choMini && pl.nhom === choMini)) {
        const cuoi = !!pl.lanCuoi;
        ds.push({ key: `action:${pl.id}`, loai: 'ghi-ket-qua',
          /* U02 dòng 3, 8: tên việc nói kỹ năng ("Ghi kết quả PA · Writing Task 2"), kỳ + PA thành thẻ phụ; nút cùng tên việc (không nút trần "Kết quả"). */
          ...(cuoi ? kem('Ghi kết quả cuối · {kn}', { kn }) : kem('Ghi kết quả PA · {kn}', { kn })),
          the: [...(cuoi ? [] : [kem('Kỳ {ky}', { ky: kyGhiKetQua(pl.actionDue, today) })]), { chu: `PA ${pl.name}` }],
          kyNang: r.category, caseId: c.id, paId: pl.id, han: pl.actionDue, tone: 'info', nguoiId: pl.nguoiId ?? null,
          nut: cuoi ? 'Ghi kết quả cuối' : 'Ghi kết quả PA', mo: { loai: 'case', caseId: c.id, paId: pl.id, viec: 'ghi-ket-qua' } });
      }
      if (pl.pendingApproval) {
        ds.push({ key: `cho-duyet:pa:${pl.id}`, loai: 'cho-duyet', ...kem('PA {pa} chờ Head duyệt', { pa: pl.name }), kyNang: r.category, caseId: c.id, paId: pl.id,
          han: pl.approvalDue ?? null, tone: 'wait', nguoiId: null, vaiChu: 'Head', nut: 'Mở Case', mo: { loai: 'case', caseId: c.id, paId: pl.id } });
      }
    }
  }

  /* Báo PH kết quả Test — Giữa khoá: GVCN lớp em đang học · Cuối khoá < 50%: Quản lý (`mywork.ts` 3c). Không hạn (M-05). */
  const baoPh = conn.prepare(
    `SELECT x.id, a.kind, x.phu_trach_id FROM sos_coordination_actions x JOIN assessment_attempts a ON a.id = x.attempt_id
      WHERE x.kind = 'bao_ph_tvv' AND x.status = 'pending' AND x.student_id = ? ORDER BY x.id`,
  ).all(sid) as any[];
  for (const x of baoPh) {
    const cuoi = x.kind === 'final';
    ds.push({ key: `baoph:${x.id}`, loai: 'bao-ph', ...kem('Báo PH kết quả Test · kết quả {bai}', { bai: nhanBaiThuong(cuoi ? 'final' : 'progress') }), kyNang: null, caseId: null, paId: null,
      han: null, tone: 'info', nguoiId: x.phu_trach_id ?? (cuoi ? null : -1), vaiChu: cuoi && !x.phu_trach_id ? 'Head' : undefined,   // GV-1: việc đã giao đứng tên người được giao
      cuaBanTheoVai: cuoi ? can(p, PERMISSIONS.REQUEST_APPROVE, { classId: n.lopId, studentId: sid }) : undefined,
      nut: 'Đánh dấu đã làm', mo: { loai: 'tab', tab: 'y-thuc', sub: 'phoi-hop' } });
  }
  /* P1-04 (B2-06): Phối hợp SOS của em — CÙNG hàm, khoá với dòng Công việc (`phoi_hop_sos:{lớp}:{việc}`), GVCN lớp em đang học giữ. Lượt của lộ trình đã thi
     thật không vào (N46, trong câu). +1 câu. */
  /* Rà #1788: chỉ người giữ được (GVCN hiệu lực của lớp · QL lớp — "Của GV" / nhận thay khi lớp chưa có GVCN) mới đọc — vai khác 0 câu. Người giữ như Công việc:
     GVCN hiệu lực (`-2`), lớp chưa có GVCN → người xem (QL). */
  if (n.lopId && (isCoreTeacherOf(p, n.lopId, today) || can(p, PERMISSIONS.CASE_APPROVE, { classId: n.lopId }))) {
    const giaoPh: any[] = [];   // GV-1: Phối hợp đã giao — cùng câu, đứng tên người được giao
    for (const l of dongPhoiHopTheoViec([n.lopId], sid, giaoPh)) {
      ds.push({ key: `phoi_hop_sos:${l.classId}:${l.khoa}`, loai: 'phoi-hop-sos', chu: l.ten, kyNang: null, caseId: null, paId: null,
        han: l.han, tone: 'info', nguoiId: -2, nut: 'Xác nhận', mo: { loai: 'tab', tab: 'y-thuc', sub: 'phoi-hop' } });
    }
    for (const r of giaoPh) {
      const v = dongViecGiao(r, today, r.phu_trach_id, r.phu_trach_id === p.userId);
      ds.push({ key: v.key, loai: 'phoi-hop-sos', chu: v.tieuDe.split(' · ')[0], kyNang: null, caseId: null, paId: null,
        han: v.due, tone: 'info', nguoiId: r.phu_trach_id, nut: 'Xác nhận', mo: { loai: 'tab', tab: 'y-thuc', sub: 'phoi-hop' } });
    }
  }
  /* P1-04 (B2-07): Báo PH vi phạm / tình hình / sau Meeting CX — CÙNG hàm Công việc (`viecBaoPhCuaToi`: người giữ TVV của em → GVCN / QL), khoá `bao-ph:{id}`.
     `tatCa`: QL thấy cả việc TVV giữ (dòng "người khác"). Người xem không giữ được việc này (GV) → 0 câu; còn lại +1 câu. */
  for (const v of viecBaoPhCuaToi(p, { today, tatCa: true, branchId: null, studentId: sid })) {
    const tvv = v.group === 'phoi_hop_tvv';
    ds.push({ key: v.key, loai: tvv ? 'phoi-hop-tvv' : 'bao-ph-yt', chu: tvv ? 'Báo PH · Meeting CX/GĐCN' : v.phu ?? v.tieuDe, kyNang: null, caseId: null, paId: null,
      viecId: v.viecId ?? undefined, han: v.due, tone: 'info', nguoiId: v.ownerId, nut: tvv ? 'Ghi KQ' : 'Ghi báo PH', tamDung: !!v.choGvSua,
      mo: { loai: 'tab', tab: 'y-thuc', ...(tvv ? { sub: 'phoi-hop' as const } : {}) } });
  }
  /* P1-04 (B2-07): Bổ sung hồ sơ thiếu — người giữ như Công việc (`chuViecTvv`: TVV của em, chưa có TVV → QL), khoá dòng tổng của người giữ (`bo-sung-ho-so:{người}`). */
  const chuBs = n.boSung?.thieu.length ? chuViecTvv(p, sid, n.boSung.tvv, true) : null;
  if (chuBs) {
    ds.push({ key: `bo-sung-ho-so:${chuBs.ownerId ?? 'ql'}`, loai: 'bo-sung', chu: 'Bổ sung hồ sơ', the: n.boSung!.thieu.map((chu) => ({ chu })), kyNang: null, caseId: null, paId: null,
      han: null, tone: 'info', nguoiId: chuBs.ownerId, nut: 'Bổ sung hồ sơ', mo: { loai: 'duong', href: duongHoSoHocVien(sid) } });
  }
  /* Mini Test — người giữ việc (`emConMiniTest().gv` = `nguoiGiuMiniTest`, cùng `mywork.ts`), không có thì GVCN. */
  const mt = n.miniTest;
  /* N46: Case của nhóm bổ trợ thuộc lộ trình đã có KQ thi thật → không việc Ghi Mini Test (như Công việc). */
  if (mt && mt.tyLe === null && !board.rows.some((r) => r.cases.some((c: any) => c.id === mt.caseId && c.sauThi))) {
    const gv = mt.gv ?? -1;
    ds.push({ key: `minitest:${mt.id}`, loai: 'mini-test', chu: 'Ghi Mini Test · bổ trợ miễn phí', kyNang: null, caseId: mt.caseId, paId: mt.paId,
      han: mt.han, tone: 'info', nguoiId: gv, nut: 'Ghi Mini Test',
      mo: mt.caseId ? { loai: 'case', caseId: mt.caseId, paId: mt.paId ?? undefined, viec: 'ghi-ket-qua' } : null });
  }
  /* Ý thức: bắt buộc xử lý, chưa có đề xuất chờ duyệt → GVCN (`mywork.ts` 5b). */
  const em = n.yThuc;
  if (em && !em.tamDung && em.gvcnId && em.soBatBuoc > 0 && !em.coChoDuyet) {
    const ke = nhanLoaiXuLy(em.keTiep.kind);
    ds.push({ key: `yt_xu_ly:${sid}`, loai: 'y-thuc', ...kem('Xác nhận xử lý Ý thức · {ke}', { ke }), kyNang: null, caseId: null, paId: null,
      han: em.han, tone: 'warn', nguoiId: em.gvcnId, nut: 'Xác nhận xử lý', mo: { loai: 'tab', tab: 'y-thuc' } });
  }
  /* PR-S6F-b (Q5): việc Ý thức còn lại của GVCN — cùng khoá, chữ, hạn với `mywork.ts` 5b (`yt_thuc_hien`; LG-11 bỏ `yt_xem`). */
  if (em && !em.tamDung && em.gvcnId) {
    for (const x of em.daDuyet) {
      const nhan = nhanLoaiXuLy(x.kind, x.customName);
      ds.push({ key: `yt_thuc_hien:${x.id}`, loai: 'yt-thuc-hien', ...kem('Ghi "Đã thực hiện" {nhan}', { nhan }), kyNang: null, caseId: null, paId: null,
        han: x.han, tone: 'warn', nguoiId: em.gvcnId, nut: 'Đã thực hiện',
        mo: { loai: 'duong', href: `/hoc-vien/${sid}?tab=y-thuc&mo=da-thuc-hien&xl=${x.id}` } });
    }
  }
  /* Bàn giao khi chuyển lớp — nút theo vai của NGƯỜI XEM (`daiHocVien`), hạn GVCN / GVBM của lệnh. */
  const dai = n.dai;
  if (dai?.nut.includes('ban-giao')) {
    ds.push({ key: `ban_giao:${dai.lopNguon.id}`, loai: 'ban-giao', ...(dai.lopDich?.code ? kem('Bàn giao sang {lop}', { lop: dai.lopDich.code }) : { chu: 'Bàn giao sang lớp mới' }), kyNang: null, caseId: null, paId: null,
      han: dai.banGiao?.hanGvcn ?? null, tone: 'info', nguoiId: p.userId, nut: 'Bàn giao',
      mo: { loai: 'duong', href: `/hoc-vien/lop/${dai.lopNguon.id}?viec=ban-giao&lenh=${dai.lenhId}` } });
  }
  if (dai?.nut.includes('ban-giao-mon') && dai.mon) {
    ds.push({ key: `ban_giao_mon:${dai.lopNguon.id}:${dai.mon.ma}`, loai: 'ban-giao-mon', ...kem('Bàn giao môn {mon}', { mon: dai.mon.ngan }), kyNang: null, caseId: null, paId: null,
      /* OV-11d (HV-13): hạn ĐÃ LƯU trên lệnh (`hanBanGiaoLenh` lúc ra lệnh) — cùng số với dải Sắp chuyển và Công việc; lệnh cũ không có thì luật cũ. */
      han: (conn.prepare('SELECT han_gvbm FROM lenh_chuyen_lop WHERE id = ?').get(dai.lenhId) as any)?.han_gvbm ?? hanBanGiao(dai.ngayRaLenh).gvbm,
      tone: 'info', nguoiId: p.userId, nut: `Bàn giao môn ${dai.mon.ngan}`,
      mo: { loai: 'duong', href: `/hoc-vien/lop/${dai.lopNguon.id}?viec=ban-giao&lenh=${dai.lenhId}&mon=${dai.mon.ma}` } });
  }

  /* GD-7a (XM-10): Nhập điểm + Trả lời tình hình của NGƯỜI XEM với em này — cùng hàm với Công việc (`viecNhapDiemCuaEm` = `listAttempts` + `gomBaiNhapDiem`,
     `viecHoiTinhHinhCuaToi`), cùng khoá → hai nơi không lệch; việc xong thì nguồn không còn trả. Chỉ đọc đúng em này (thêm ~2 câu). */
  for (const v of viecNhapDiemCuaEm(p, sid, today, n.lopId)) {
    const nhieu = (v.soBai ?? 0) > 1;
    ds.push({ key: v.key, loai: 'nhap-diem', chu: 'Nhập điểm',
      the: [...(v.kns ?? []).map((k) => ({ chu: tenMon(n.chuongTrinh, k) })), ...(v.contextLabel ? [{ chu: v.contextLabel }] : []),
        ...(nhieu ? [kem('{n} bài', { n: v.soBai! })] : [])],
      kyNang: v.kn ?? null, caseId: null, paId: null, han: v.due, tone: 'info', quaHan: v.urgency === 'overdue', nguoiId: p.userId, nut: 'Nhập điểm',
      mo: v.classId && v.luot ? { loai: 'nhap-diem', classId: v.classId, luot: v.luot, kns: v.kns ?? [], tuanThi: v.tuanThi ?? null, periodId: v.periodId ?? null, kind: v.kind ?? null, soBai: v.soBai ?? null } : { loai: 'duong', href: v.href } });
  }
  for (const v of viecHoiTinhHinhCuaToi(p, { today, tatCa: false, branchId: null, studentId: sid })) {
    const hoi = String(v.due ? addDays(v.due, -2) : '');   // hạn = ngày hỏi + 2 (`hanHoiTinhHinh`)
    ds.push({ key: v.key, loai: 'tinh-hinh', chu: 'Trả lời tình hình', the: [{ chu: 'TVV hỏi' }, ...(hoi ? [{ chu: `${hoi.slice(8, 10)}/${hoi.slice(5, 7)}` }] : [])],
      kyNang: null, caseId: null, paId: null, han: v.due ?? null, tone: 'info', nguoiId: p.userId, nut: 'Trả lời',
      mo: v.viecId ? { loai: 'tinh-hinh', viecId: v.viecId, cauHoi: String(v.reason ?? '') } : { loai: 'duong', href: v.href } });
  }

  /* GV-1 (N58): việc người khác giao cho NGƯỜI XEM với em này (+ phần Meeting của người xem) — cùng hàm Công việc (`viecGiaoChoToi`, một câu), cùng khoá. */
  const LOAI_GIAO_HV: Record<string, ViecHocVien['loai']> = { bao_ph_yt: 'bao-ph-yt', phoi_hop_tvv: 'phoi-hop-tvv', phoi_hop: 'bao-ph', phoi_hop_sos: 'phoi-hop-sos',
    yt_hoi_tinh_hinh: 'tinh-hinh', meeting_xep_lich: 'phoi-hop-sos', meeting_ket_qua: 'phoi-hop-sos', yt_tra_lai: 'y-thuc' };   // TL-1: Vi phạm bị trả lại — tab Ý thức
  const coKhoa = new Set(ds.map((x) => x.key));
  for (const v of viecGiaoChoToi(p, { today, studentId: sid })) {
    const hien = ds.find((x) => x.key === v.key);
    if (hien) { hien.nguoiId = p.userId; continue; }
    if (coKhoa.has(v.key)) continue;
    ds.push({ key: v.key, loai: LOAI_GIAO_HV[v.group] ?? 'phoi-hop-sos', chu: v.phu ?? v.tieuDe.split(' · ')[0], kyNang: null, caseId: null, paId: null, viecId: v.viecId ?? undefined,
      han: v.due, tone: 'info', nguoiId: p.userId, nut: v.actionLabel, tamDung: !!v.choGvSua,   // TL-1 (rà #1927 lần 2): Báo PH đã giao, đang chờ GV sửa
      mo: v.group === 'yt_hoi_tinh_hinh' && v.viecId ? { loai: 'tinh-hinh', viecId: v.viecId, cauHoi: String(v.reason ?? '') }
        : { loai: 'tab', tab: 'y-thuc', ...(v.group === 'bao_ph_yt' || v.group === 'yt_tra_lai' ? {} : { sub: 'phoi-hop' as const }) } });
  }

  /* Tên + vai người làm — MỘT câu: người có việc + GVCN lớp đang học (Báo PH / Mini Test không người dạy dùng `-1` = GVCN). */
  const ids = [...new Set(ds.map((x) => x.nguoiId).filter((x): x is number => !!x && x > 0))];
  const nguoi = new Map<number, { ten: string; gvcn: boolean; mon: string[] }>();
  let gvcnId: number | null = null;
  for (const u of conn.prepare(
    `SELECT u.id, u.full_name, ta.is_core, ta.skill FROM users u
       LEFT JOIN teacher_assignments ta ON ta.user_id = u.id AND ta.class_id = ? AND ta.status = 'active'
        AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)   -- rà #1788: phân công còn hiệu lực (GVCN như Công việc)
      WHERE u.id IN (${ids.map(() => '?').join(',') || 'NULL'}) OR (ta.is_core = 1)
      ORDER BY u.id, ta.is_core DESC, ta.id`,
  ).all(n.lopId ?? -1, today, today, ...ids) as any[]) {
    const x = nguoi.get(u.id) ?? { ten: u.full_name as string, gvcn: false, mon: [] as string[] };
    if (u.is_core) { x.gvcn = true; gvcnId ??= u.id; }
    if (u.skill) x.mon.push(u.skill);
    nguoi.set(u.id, x);
  }
  /* Vai theo lớp em đang học: GVCN · GVBM {môn của việc} (GV dạy hai môn thì lấy đúng môn của việc) · người ngoài lớp → không vai. */
  const vaiCua = (id: number, kn: string | null) => {
    const x = nguoi.get(id);
    if (!x) return null;
    if (x.gvcn) return 'GVCN';
    const mon = kn && x.mon.includes(kn) ? kn : x.mon[0];
    return mon ? `GVBM ${tenMon(n.chuongTrinh, mon)}` : null;
  };

  const ra: ViecHocVien[] = ds.map(({ nguoiId, vaiChu, cuaBanTheoVai, quaHan, tamDung, ...x }) => {
    const id = nguoiId === -1 ? gvcnId : nguoiId === -2 ? gvcnId ?? p.userId : nguoiId;
    const quaHanNgay = quaHanBaoPh(x.han, today, tamDung) ? diffDays(today, x.han!) : null;
    return {
      ...x, quaHanNgay, gap: tamDung ? 'chua' : gapCua(x.han, today, quaHan), tone: quaHanNgay !== null || quaHan ? 'danger' : x.tone,
      nguoi: id ? { id, ten: nguoi.get(id)?.ten ?? '—', vai: vaiCua(id, x.kyNang) } : { id: null, ten: vaiChu ?? 'Chưa có người phụ trách', vai: null },
      cuaBan: cuaBanTheoVai ?? (x.loai !== 'cho-duyet' && !!id && id === p.userId),
    };
  });
  /* Quá hạn → hạn sớm → không hạn (T72). */
  ra.sort((a, b) => (a.han ? 0 : 1) - (b.han ? 0 : 1) || (a.han ?? '').localeCompare(b.han ?? ''));
  const kq = { cuaBan: [...bt, ...ra.filter((x) => x.cuaBan)], nguoiKhac: ra.filter((x) => !x.cuaBan) };
  if (!coVaiCx(p)) return kq;
  /* N52: CX không là chủ việc — "của bạn" chỉ khi vai KHÁC của tài khoản giữ việc; còn lại sang "người khác" (CX làm thay được, không hạn của CX). */
  const chu = boVaiCx(p);
  const that = new Set(chu.grants.length ? viecCuaHocVien(chu, sid, board, n).cuaBan.map((x) => x.key) : []);
  const lamThay = kq.cuaBan.filter((x) => !that.has(x.key))
    .map((x) => ({ ...x, cuaBan: false, nguoi: x.nguoi.id === p.userId ? { id: null, ten: 'Chưa có người phụ trách', vai: null } : x.nguoi }));
  return { cuaBan: kq.cuaBan.filter((x) => that.has(x.key)), nguoiKhac: [...lamThay, ...kq.nguoiKhac] };
}
