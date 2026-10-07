import { db } from '../db.ts';
import { CHU_THEM_PA, PERMISSIONS, hanBanGiao, nhanLoaiXuLy, tenMon, tuanLich, type DaiHocVien, nhanBaiThuong } from '../../../shared/domain/index.ts';
import { can, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, diffDays } from '../util.ts';
import type { EmYThuc } from '../yThuc/trangThai.ts';

export type ViecHocVien = {
  /** Đúng khoá của `myWork` (Q2) — phép kiểm so hai đường theo khoá. Việc "chờ Quản lý duyệt" không có ở Công việc → khoá `cho-duyet:…`. */
  key: string;
  loai: 'nguyen-nhan' | 'de-ra-pa' | 'xac-nhan-pa' | 'ghi-ket-qua' | 'ke-hoach' | 'cho-duyet' | 'bao-ph' | 'mini-test' | 'y-thuc' | 'yt-xem' | 'yt-thuc-hien'
    | 'ban-giao' | 'ban-giao-mon';
  /** "Ghi kết quả tuần W4 SEP · PA Tăng cường bài tập Writing Task 2" — động từ đầu câu. */
  chu: string;
  kyNang: string | null; caseId: number | null; paId: number | null;
  han: string | null; quaHanNgay: number | null; tone: 'danger' | 'warn' | 'info' | 'wait';
  /** "Đỗ Thanh Tùng · GVBM Speaking" · "Quản lý" (vai, không tên). */
  nguoi: { id: number | null; ten: string; vai: string | null };
  cuaBan: boolean;
  /** Nút động từ + chỗ mở (Ngăn Case / tab Ý thức / trang bàn giao). */
  nut: string;
  mo: { loai: 'case'; caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa' | 'ke-hoach' | 'them-pa' }
    | { loai: 'tab'; tab: 'y-thuc'; sub?: 'phoi-hop' } | { loai: 'duong'; href: string } | null;
};

type Nguon = {
  trangThaiEm: string; lopId: number | null; chuongTrinh: string | null;
  yThuc: EmYThuc | null | undefined;
  /** `gv` = người dạy bổ trợ có tài khoản đầu tiên của nhóm (cùng câu `myWork`), null → GVCN. */
  miniTest: { id: number; han: string | null; tyLe: number | null; nhom: string; caseId: number | null; paId: number | null; gv: number | null } | null;
  dai: DaiHocVien | null;
};

/**
 * VIỆC CỦA MỘT EM THEO NGƯỜI (PR-VAI-b Task 2, K3-01) — mọi việc đang mở của em, MỖI VIỆC CÓ NGƯỜI LÀM, cùng luật người làm với Công việc (Q2):
 *   Xác nhận nguyên nhân / Thêm PA / Xác nhận PA → người phụ trách Case · Ghi kết quả PA → `performer_user_id ?? recorded_by` · Nộp kế hoạch → người dạy
 *   bổ trợ · Báo PH qua TVV, Xử lý vi phạm, Ghi nhận vi phạm mới, Ghi "Đã thực hiện" → GVCN (Báo PH Cuối khoá → Quản lý) · Mini Test → người dạy bổ trợ, không có thì GVCN · Bàn giao → người xem
 *   theo `dai.nut` · "Chờ Quản lý duyệt…" → "Quản lý" (không ai trong số giáo viên, không vào thanh việc).
 * KHÔNG chạy `myWork` (quét cả phạm vi): Case/PA đọc từ `board` đã dựng, Ý thức / Mini Test / dải chuyển lớp do hồ sơ nạp sẵn.
 * Thêm hai câu: Báo PH của em · tên + vai người làm. Em Tạm dừng / đã kết thúc → rỗng (mọi hạn dừng, T65).
 */
export function viecCuaHocVien(p: Principal, sid: number, board: { rows: any[] }, n: Nguon): { cuaBan: ViecHocVien[]; nguoiKhac: ViecHocVien[] } {
  if (n.trangThaiEm !== 'active') return { cuaBan: [], nguoiKhac: [] };
  const today = demoToday();
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
  const khongTheKh = (c: any) => c.boTro?.keHoach?.trangThai === 'cho' || c.boTro?.keHoach?.trangThai === 'duyet';
  const minKh = minNhom((pl) => pl.status === 'planned');
  const daKh = new Set<string>();
  const daChoKh = new Set<string>();

  for (const { r, c } of cases) {
    const kn: string = r.label;
    const v = c.viecTiep as { chu: string; han: string | null } | null;
    if (v?.chu === 'Xác nhận nguyên nhân') {
      ds.push({ key: `cause:${c.id}`, loai: 'nguyen-nhan', chu: `Xác nhận nguyên nhân ${kn}`, kyNang: r.category, caseId: c.id, paId: null,
        han: v.han, tone: 'info', nguoiId: c.ownerId ?? null, nut: 'Xác nhận nguyên nhân', mo: { loai: 'case', caseId: c.id, viec: 'xac-nhan' } });
    }
    /* PR-S6F-b (Q5): Case chưa có PA → "Thêm PA" của người phụ trách Case; khoá `support:{caseId}` như Công việc (nhóm no_plan), hạn = hạn lập PA. */
    if (v?.chu === CHU_THEM_PA) {
      ds.push({ key: `support:${c.id}`, loai: 'de-ra-pa', chu: `${CHU_THEM_PA} ${kn}`, kyNang: r.category, caseId: c.id, paId: null,
        han: v.han, tone: 'info', nguoiId: c.ownerId ?? null, nut: CHU_THEM_PA, mo: { loai: 'case', caseId: c.id, viec: 'them-pa' } });
    }
    if (v?.chu === 'Chờ Quản lý duyệt · không theo dõi') {
      ds.push({ key: `cho-duyet:case:${c.id}`, loai: 'cho-duyet', chu: `Case ${kn} chờ Quản lý duyệt · không theo dõi`, kyNang: r.category, caseId: c.id, paId: null,
        han: null, tone: 'wait', nguoiId: null, vaiChu: 'Quản lý', nut: 'Mở Case', mo: { loai: 'case', caseId: c.id } });
    }
    for (const pl of c.plans) {
      if (pl.choXacNhan && c.sos?.hasCause) {
        ds.push({ key: `xnpa:${pl.id}`, loai: 'xac-nhan-pa', chu: `Xác nhận PA ${pl.name} · ${kn}`, kyNang: r.category, caseId: c.id, paId: pl.id,
          han: c.sos?.dueOn ?? null, tone: 'info', nguoiId: c.ownerId ?? null, nut: 'Xác nhận PA', mo: { loai: 'case', caseId: c.id, paId: pl.id, viec: 'xac-nhan-pa' } });
      }
      if (chayDuoc(pl) && !(pl.kind === 'bo_tro' && pl.nhom && minGhi.get(pl.nhom) !== pl.id)) {
        const cuoi = !!pl.lanCuoi;
        ds.push({ key: `action:${pl.id}`, loai: 'ghi-ket-qua',
          chu: cuoi ? `Ghi kết quả cuối · PA ${pl.name}` : `Ghi kết quả tuần ${tuanLich(addDays(pl.actionDue, -7), today)} · PA ${pl.name}`,
          kyNang: r.category, caseId: c.id, paId: pl.id, han: pl.actionDue, tone: 'info', nguoiId: pl.nguoiId ?? null,
          nut: cuoi ? 'Ghi kết quả cuối' : 'Ghi kết quả', mo: { loai: 'case', caseId: c.id, paId: pl.id, viec: 'ghi-ket-qua' } });
      }
      if (pl.pendingApproval) {
        ds.push({ key: `cho-duyet:pa:${pl.id}`, loai: 'cho-duyet', chu: `PA ${pl.name} chờ Quản lý duyệt`, kyNang: r.category, caseId: c.id, paId: pl.id,
          han: pl.approvalDue ?? null, tone: 'wait', nguoiId: null, vaiChu: 'Quản lý', nut: 'Mở Case', mo: { loai: 'case', caseId: c.id, paId: pl.id } });
      }
    }
    /* Kế hoạch bổ trợ: nhóm còn PA chờ, chưa có thẻ chờ/đã duyệt, ít nhất một môn đã có nguyên nhân (`mywork.ts` 3c). */
    const b = c.boTro;
    if (b?.nhom && !daKh.has(b.nhom) && minKh.has(b.nhom) && !khongTheKh(c)
      && cases.some((x) => x.c.boTro?.nhom === b.nhom && x.c.sos?.hasCause)) {
      daKh.add(b.nhom);
      /* Tên môn đầy đủ (mục 3, 22/09): "Grammar + Vocabulary và Pronunciation", không "G+V, P". */
      const mon = b.mon.filter((m: any) => cases.some((x) => x.c.id === m.caseId)).map((m: any) => tenMon(n.chuongTrinh, m.mon)).join(' và ');
      ds.push({ key: `kehoach:${minKh.get(b.nhom)}`, loai: 'ke-hoach', chu: `Nộp kế hoạch bổ trợ · ${mon}`, kyNang: r.category, caseId: c.id, paId: null,
        han: b.hanKeHoach, tone: 'info', nguoiId: b.nguoiDay?.userId ?? null, nut: 'Nộp kế hoạch', mo: { loai: 'case', caseId: c.id, viec: 'ke-hoach' } });
    }
    if (b?.nhom && b.keHoach?.trangThai === 'cho' && !daChoKh.has(b.nhom)) {
      daChoKh.add(b.nhom);
      ds.push({ key: `cho-duyet:kh:${b.nhom}`, loai: 'cho-duyet', chu: `PA Bổ trợ${b.chung ? ' chung' : ''} chờ Quản lý duyệt kế hoạch`, kyNang: r.category,
        caseId: c.id, paId: null, han: b.keHoach.hanDuyet ?? null, tone: 'wait', nguoiId: null, vaiChu: 'Quản lý', nut: 'Mở Case', mo: { loai: 'case', caseId: c.id } });
    }
  }

  /* Báo phụ huynh qua TVV — Giữa khoá: GVCN lớp em đang học · Cuối khoá < 50%: Quản lý (`mywork.ts` 3c). Không hạn (M-05). */
  const baoPh = conn.prepare(
    `SELECT x.id, a.kind FROM sos_coordination_actions x JOIN assessment_attempts a ON a.id = x.attempt_id
      WHERE x.kind = 'bao_ph_tvv' AND x.status = 'pending' AND x.student_id = ? ORDER BY x.id`,
  ).all(sid) as any[];
  for (const x of baoPh) {
    const cuoi = x.kind === 'final';
    ds.push({ key: `baoph:${x.id}`, loai: 'bao-ph', chu: `Báo phụ huynh qua TVV · kết quả ${nhanBaiThuong(cuoi ? 'final' : 'progress')}`, kyNang: null, caseId: null, paId: null,
      han: null, tone: 'info', nguoiId: cuoi ? null : -1, vaiChu: cuoi ? 'Quản lý' : undefined,
      cuaBanTheoVai: cuoi ? can(p, PERMISSIONS.REQUEST_APPROVE, { classId: n.lopId, studentId: sid }) : undefined,
      nut: 'Đánh dấu đã làm', mo: { loai: 'tab', tab: 'y-thuc', sub: 'phoi-hop' } });
  }
  /* Mini Test — người dạy bổ trợ (có tài khoản đầu tiên của nhóm, cùng câu `mywork.ts` Mini Test), không có thì GVCN. */
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
    ds.push({ key: `yt_xu_ly:${sid}`, loai: 'y-thuc', chu: `Xác nhận xử lý Ý thức · ${ke}`, kyNang: null, caseId: null, paId: null,
      han: em.han, tone: 'warn', nguoiId: em.gvcnId, nut: 'Xác nhận xử lý', mo: { loai: 'tab', tab: 'y-thuc' } });
  }
  /* PR-S6F-b (Q5): hai việc Ý thức còn lại của GVCN — cùng khoá, chữ, hạn với `mywork.ts` 5b (`yt_xem`, `yt_thuc_hien`). */
  if (em && !em.tamDung && em.gvcnId) {
    if (em.soMoi > 0) {
      ds.push({ key: `yt_xem:${sid}`, loai: 'yt-xem', chu: `Ghi nhận ${em.soMoi} vi phạm mới`, kyNang: null, caseId: null, paId: null,
        han: em.hanXem, tone: 'warn', nguoiId: em.gvcnId, nut: 'Ghi nhận', mo: { loai: 'tab', tab: 'y-thuc' } });
    }
    for (const x of em.daDuyet) {
      const nhan = nhanLoaiXuLy(x.kind, x.customName);
      ds.push({ key: `yt_thuc_hien:${x.id}`, loai: 'yt-thuc-hien', chu: `Ghi "Đã thực hiện" ${nhan}`, kyNang: null, caseId: null, paId: null,
        han: x.han, tone: 'warn', nguoiId: em.gvcnId, nut: 'Đã thực hiện',
        mo: { loai: 'duong', href: `/hoc-vien/${sid}?tab=y-thuc&mo=da-thuc-hien&xl=${x.id}` } });
    }
  }
  /* Bàn giao khi chuyển lớp — nút theo vai của NGƯỜI XEM (`daiHocVien`), hạn GVCN / GVBM của lệnh. */
  const dai = n.dai;
  if (dai?.nut.includes('ban-giao')) {
    ds.push({ key: `ban_giao:${dai.lopNguon.id}`, loai: 'ban-giao', chu: `Bàn giao sang ${dai.lopDich?.code ?? 'lớp mới'}`, kyNang: null, caseId: null, paId: null,
      han: dai.banGiao?.hanGvcn ?? null, tone: 'info', nguoiId: p.userId, nut: 'Bàn giao',
      mo: { loai: 'duong', href: `/hoc-vien/lop/${dai.lopNguon.id}?viec=ban-giao&lenh=${dai.lenhId}` } });
  }
  if (dai?.nut.includes('ban-giao-mon') && dai.mon) {
    ds.push({ key: `ban_giao_mon:${dai.lopNguon.id}:${dai.mon.ma}`, loai: 'ban-giao-mon', chu: `Bàn giao môn ${dai.mon.ngan}`, kyNang: null, caseId: null, paId: null,
      han: hanBanGiao(dai.ngayRaLenh).gvbm, tone: 'info', nguoiId: p.userId, nut: `Bàn giao môn ${dai.mon.ngan}`,
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
  return { cuaBan: ra.filter((x) => x.cuaBan), nguoiKhac: ra.filter((x) => !x.cuaBan) };
}
