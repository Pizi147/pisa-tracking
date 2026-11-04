import { db } from '../db.ts';
import { CHU_DA_XONG, CHU_THEM_PA, PERMISSIONS, hanBanGiao, kyGhiKetQua, nhanLoaiXuLy, tenMon, type DaiHocVien, nhanBaiThuong } from '../../../shared/domain/index.ts';
import { can, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { diffDays } from '../util.ts';
import type { EmYThuc } from '../yThuc/trangThai.ts';
import { viecBuocTiep } from '../loTrinh/buocTiep.ts';
import { chuViecTvv, tvvCuaEm } from '../worklist/viecTvv.ts';
import type { SauThiEm } from '../loTrinh/thiThat.ts';
import { duongHoSoHocVien } from '../../../shared/domain/index.ts';
import { kem, type Bien } from '../../../shared/i18n/index.ts';

export type ViecHocVien = {
  /** Đúng khoá của `myWork` (Q2) — phép kiểm so hai đường theo khoá. Việc "chờ Quản lý duyệt" không có ở Công việc → khoá `cho-duyet:…`. */
  key: string;
  loai: 'nguyen-nhan' | 'de-ra-pa' | 'xac-nhan-pa' | 'ghi-ket-qua' | 'cho-duyet' | 'bao-ph' | 'mini-test' | 'y-thuc' | 'yt-xem' | 'yt-thuc-hien'
    | 'ban-giao' | 'ban-giao-mon' | 'buoc-tiep' | 'thi-that';
  /** "Kết quả W3–W4 SEP · PA Tăng cường bài tập Writing Task 2" — động từ đầu câu. */
  chu: string;
  /** PR-EN-c: khoá + biến của `chu` (câu có biến) — web dịch bằng `dichChu`. Câu không biến dịch theo chính `chu`. */
  khoa?: string; bien?: Bien;
  /** U02 (mockup `audit-0311/u02` dòng 3): thẻ phụ dưới tên việc — "Kỳ W5 OCT – W1 NOV" · "PA Học Tutor" (chữ, tên PA giữ nguyên). */
  the?: { chu: string; khoa?: string; bien?: Bien }[];
  kyNang: string | null; caseId: number | null; paId: number | null;
  han: string | null; quaHanNgay: number | null; tone: 'danger' | 'warn' | 'info' | 'wait';
  /** "Đỗ Thanh Tùng · GVBM Speaking" · "Quản lý" (vai, không tên). */
  nguoi: { id: number | null; ten: string; vai: string | null };
  cuaBan: boolean;
  /** Nút động từ + chỗ mở (Ngăn Case / tab Ý thức / trang bàn giao). */
  nut: string;
  mo: { loai: 'case'; caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa' | 'them-pa' }
    | { loai: 'tab'; tab: 'y-thuc'; sub?: 'phoi-hop' } | { loai: 'duong'; href: string } | null;
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
};

/**
 * VIỆC CỦA MỘT EM THEO NGƯỜI (PR-VAI-b Task 2, K3-01) — mọi việc đang mở của em, MỖI VIỆC CÓ NGƯỜI LÀM, cùng luật người làm với Công việc (Q2):
 *   Xác nhận nguyên nhân / Thêm PA / Xác nhận PA → người phụ trách Case · Ghi kết quả PA → người giữ việc (`nguoiGiuKetQua`, đọc từ `plan.nguoiId` của bảng)
 *   · Báo PH qua TVV, Xử lý vi phạm, Ghi nhận vi phạm mới, Ghi "Đã thực hiện" → GVCN (Báo PH Cuối khoá → Quản lý) · Mini Test → người giữ việc (`nguoiGiuMiniTest`, PR-CT2), không có thì GVCN · Bàn giao → người xem
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
    return { key: v.key, loai: 'buoc-tiep', chu: kq ? `Chọn bước tiếp · ${kq}` : 'Chọn bước tiếp', ...(kq ? { khoa: 'Chọn bước tiếp · {kq}', bien: { kq } } : {}), kyNang: null, caseId: null, paId: null, han: v.due, quaHanNgay,
      tone: quaHanNgay !== null ? 'danger' : 'info', nguoi: { id: p.userId, ten: p.fullName, vai: null }, cuaBan: true, nut: 'Chọn bước tiếp ›', mo: { loai: 'duong', href: v.href } };
  });
  /* OV-13q: "Cập nhật kết quả thi thật ›" mở panel Kết quả thi thật ngay trong hồ sơ (`?viec=thi-that`); hạn = hạn sau thi (cùng việc Công việc). */
  const st = n.sauThi;
  /* SV-TVV-VIEC: việc của người giữ (TVV của em / QL khi em chưa có TVV) — GVCN vẫn nhập được ở panel nhưng không còn là việc của GVCN. */
  if (st && st.giaiDoan === 'da_thi_cho_kq' && st.coTheNhap && chuViecTvv(p, sid, tvvCuaEm([sid]).get(sid) ?? null)) {
    const quaHanNgay = st.quaHan && st.han ? diffDays(today, st.han) : null;
    bt.push({ key: `thi_that:${st.cycleId}`, loai: 'thi-that', chu: 'Cập nhật kết quả thi thật', kyNang: null, caseId: null, paId: null, han: st.han, quaHanNgay,
      tone: quaHanNgay !== null ? 'danger' : 'info', nguoi: { id: p.userId, ten: p.fullName, vai: null }, cuaBan: true, nut: 'Cập nhật kết quả thi thật ›',
      mo: { loai: 'duong', href: duongHoSoHocVien(sid, { loTrinh: st.cycleId, viec: 'thi-that' }) } });
  }
  if (n.trangThaiEm !== 'active') return { cuaBan: bt, nguoiKhac: [] };
  const conn = db();
  type Nhap = Omit<ViecHocVien, 'nguoi' | 'cuaBan' | 'quaHanNgay'> & { nguoiId: number | null; vaiChu?: string; cuaBanTheoVai?: boolean };
  const ds: Nhap[] = [];

  const cases = board.rows.flatMap((r) => r.cases.filter((c: any) => c.status !== 'done').map((c: any) => ({ r, c })));
  /* Nhóm PA bổ trợ chung: MỘT dòng mỗi nhóm (id nhỏ nhất) như Công việc (`mywork.ts` 2b, 3c). */
  const minNhom = (loc: (pl: any) => boolean) => {
    const m = new Map<string, number>();
    for (const { c } of cases) for (const pl of c.plans) if (pl.kind === 'bo_tro' && pl.nhom && loc(pl)) m.set(pl.nhom, Math.min(m.get(pl.nhom) ?? Infinity, pl.id));
    return m;
  };
  const chayDuoc = (pl: any) => (pl.status === 'planned' || pl.status === 'started') && !!pl.actionDue && !pl.pendingApproval && !(pl.preset && !pl.confirmedAt);
  const minGhi = minNhom(chayDuoc);

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
    if (v?.chu === 'Chờ Quản lý duyệt · không theo dõi') {
      ds.push({ key: `cho-duyet:case:${c.id}`, loai: 'cho-duyet', ...kem('Case {kn} chờ Quản lý duyệt · không theo dõi', { kn }), kyNang: r.category, caseId: c.id, paId: null,
        han: null, tone: 'wait', nguoiId: null, vaiChu: 'Quản lý', nut: 'Mở Case', mo: { loai: 'case', caseId: c.id } });
    }
    for (const pl of c.plans) {
      if (pl.choXacNhan && c.sos?.hasCause) {
        ds.push({ key: `xnpa:${pl.id}`, loai: 'xac-nhan-pa', ...kem('Xác nhận PA {pa} · {kn}', { pa: pl.name, kn }), kyNang: r.category, caseId: c.id, paId: pl.id,
          han: c.sos?.dueOn ?? null, tone: 'info', nguoiId: c.ownerId ?? null, nut: 'Xác nhận PA', mo: { loai: 'case', caseId: c.id, paId: pl.id, viec: 'xac-nhan-pa' } });
      }
      if (chayDuoc(pl) && !(pl.kind === 'bo_tro' && pl.nhom && minGhi.get(pl.nhom) !== pl.id)) {
        const cuoi = !!pl.lanCuoi;
        ds.push({ key: `action:${pl.id}`, loai: 'ghi-ket-qua',
          /* U02 dòng 3, 8: tên việc nói kỹ năng ("Ghi kết quả PA · Writing Task 2"), kỳ + PA thành thẻ phụ; nút cùng tên việc (không nút trần "Kết quả"). */
          ...(cuoi ? kem('Ghi kết quả cuối · {kn}', { kn }) : kem('Ghi kết quả PA · {kn}', { kn })),
          the: [...(cuoi ? [] : [kem('Kỳ {ky}', { ky: kyGhiKetQua(pl.actionDue, today) })]), { chu: `PA ${pl.name}` }],
          kyNang: r.category, caseId: c.id, paId: pl.id, han: pl.actionDue, tone: 'info', nguoiId: pl.nguoiId ?? null,
          nut: cuoi ? 'Ghi kết quả cuối' : 'Ghi kết quả PA', mo: { loai: 'case', caseId: c.id, paId: pl.id, viec: 'ghi-ket-qua' } });
      }
      if (pl.pendingApproval) {
        ds.push({ key: `cho-duyet:pa:${pl.id}`, loai: 'cho-duyet', ...kem('PA {pa} chờ Quản lý duyệt', { pa: pl.name }), kyNang: r.category, caseId: c.id, paId: pl.id,
          han: pl.approvalDue ?? null, tone: 'wait', nguoiId: null, vaiChu: 'Quản lý', nut: 'Mở Case', mo: { loai: 'case', caseId: c.id, paId: pl.id } });
      }
    }
  }

  /* Báo phụ huynh qua TVV — Giữa khoá: GVCN lớp em đang học · Cuối khoá < 50%: Quản lý (`mywork.ts` 3c). Không hạn (M-05). */
  const baoPh = conn.prepare(
    `SELECT x.id, a.kind FROM sos_coordination_actions x JOIN assessment_attempts a ON a.id = x.attempt_id
      WHERE x.kind = 'bao_ph_tvv' AND x.status = 'pending' AND x.student_id = ? ORDER BY x.id`,
  ).all(sid) as any[];
  for (const x of baoPh) {
    const cuoi = x.kind === 'final';
    ds.push({ key: `baoph:${x.id}`, loai: 'bao-ph', ...kem('Báo phụ huynh qua TVV · kết quả {bai}', { bai: nhanBaiThuong(cuoi ? 'final' : 'progress') }), kyNang: null, caseId: null, paId: null,
      han: null, tone: 'info', nguoiId: cuoi ? null : -1, vaiChu: cuoi ? 'Quản lý' : undefined,
      cuaBanTheoVai: cuoi ? can(p, PERMISSIONS.REQUEST_APPROVE, { classId: n.lopId, studentId: sid }) : undefined,
      nut: 'Đánh dấu đã làm', mo: { loai: 'tab', tab: 'y-thuc', sub: 'phoi-hop' } });
  }
  /* Mini Test — người giữ việc (`emConMiniTest().gv` = `nguoiGiuMiniTest`, cùng `mywork.ts`), không có thì GVCN. */
  const mt = n.miniTest;
  if (mt && mt.tyLe === null) {
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
  /* PR-S6F-b (Q5): hai việc Ý thức còn lại của GVCN — cùng khoá, chữ, hạn với `mywork.ts` 5b (`yt_xem`, `yt_thuc_hien`). */
  if (em && !em.tamDung && em.gvcnId) {
    if (em.soMoi > 0) {
      ds.push({ key: `yt_xem:${sid}`, loai: 'yt-xem', ...kem('Xem {n} vi phạm mới', { n: em.soMoi }), kyNang: null, caseId: null, paId: null,
        han: em.hanXem, tone: 'warn', nguoiId: em.gvcnId, nut: 'Đã xem', mo: { loai: 'tab', tab: 'y-thuc' } });
    }
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

  /* Tên + vai người làm — MỘT câu: người có việc + GVCN lớp đang học (Báo PH / Mini Test không người dạy dùng `-1` = GVCN). */
  const ids = [...new Set(ds.map((x) => x.nguoiId).filter((x): x is number => !!x && x > 0))];
  const nguoi = new Map<number, { ten: string; gvcn: boolean; mon: string[] }>();
  let gvcnId: number | null = null;
  for (const u of conn.prepare(
    `SELECT u.id, u.full_name, ta.is_core, ta.skill FROM users u
       LEFT JOIN teacher_assignments ta ON ta.user_id = u.id AND ta.class_id = ? AND ta.status = 'active'
      WHERE u.id IN (${ids.map(() => '?').join(',') || 'NULL'}) OR (ta.is_core = 1)
      ORDER BY u.id, ta.is_core DESC, ta.id`,
  ).all(n.lopId ?? -1, ...ids) as any[]) {
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

  const ra: ViecHocVien[] = ds.map(({ nguoiId, vaiChu, cuaBanTheoVai, ...x }) => {
    const id = nguoiId === -1 ? gvcnId : nguoiId;
    const quaHanNgay = x.han && x.han < today ? diffDays(today, x.han) : null;
    return {
      ...x, quaHanNgay, tone: quaHanNgay !== null ? 'danger' : x.tone,
      nguoi: id ? { id, ten: nguoi.get(id)?.ten ?? '—', vai: vaiCua(id, x.kyNang) } : { id: null, ten: vaiChu ?? 'Chưa có người phụ trách', vai: null },
      cuaBan: cuaBanTheoVai ?? (x.loai !== 'cho-duyet' && !!id && id === p.userId),
    };
  });
  /* Quá hạn → hạn sớm → không hạn (T72). */
  ra.sort((a, b) => (a.han ? 0 : 1) - (b.han ? 0 : 1) || (a.han ?? '').localeCompare(b.han ?? ''));
  return { cuaBan: [...bt, ...ra.filter((x) => x.cuaBan)], nguoiKhac: ra.filter((x) => !x.cuaBan) };
}
