/**
 * BƯỚC TIẾP SAU THI THẬT (OV-8a; OV-13m, chủ SP 15/10). Lộ trình FT có kết quả thi thật (đủ 4 kỹ năng / Không thi / kết quả cũ) = "Đã xong" — kể cả khi em còn
 * ghi danh (lộ trình còn mở). QL + TVV chi nhánh (`coQuyenBuocTiep`) chọn; lộ trình đóng thật khi chọn:
 *  · Thôi học (`ket_thuc`) — Kết thúc học + Lưu trữ. · Tạm dừng (`tam_dung`) — đóng lộ trình + Tạm dừng em; sau này "Quay lại học" = chọn Lộ trình mới.
 *  · Lộ trình mới (`lo_trinh_moi`) — Lớp này: `hocLai` về lớp cũ (Kết thúc học + Học lại một giao dịch, lộ trình MỚI); Lớp khác, em đang học: đúng đường
 *    Chuyển lớp (`raLenh`, OV-13l: "Ngay bây giờ" chuyển ngay, tuần sau = lệnh chờ + phiếu bàn giao), `apDungMotDong` đóng-mở vì lộ trình đã xong.
 *    Bắt đầu một Thứ Hai sau (không qua lệnh) = "Hẹn bắt đầu" (`buoc_tiep_hen`), tới tuần đó tự bắt đầu (`batDauHenDenHan`, cùng cron / quét khi đọc).
 *  · `hoc_tiep` / `hoc_lai` (OV-8a) — chỉ dữ liệu / API cũ.
 * P7 SV-LO-TRINH (N12): web hai hướng — "Tạm dừng/ Kết thúc học" (`tam_dung` / `ket_thuc` theo ô "Có thể quay lại học", ngày + lý do của hộp) · "Lộ trình mới" chọn
 *  LT1 / LT2 / RF / Khác (`route`, `routeTen`, `boTarget`): lớp đích phải hợp loại (`kiemLopLoTrinhMoi`), không chép ngày thi (E1), đầu vào = KQ thi thật (E3), Giữ lớp đã
 *  kết thúc → máy chủ tự mở lại lớp (E2), Case chưa xong của lộ trình cũ đóng "Kết thúc lộ trình" (PA "Dừng — kết thúc lộ trình", không vào Hiệu quả PA).
 * Mỗi lựa chọn MỘT giao dịch; đổi lựa chọn = hoàn tác đúng lựa chọn cũ (`buoc_tiep_json`) rồi làm cái mới. Target giữ (Sửa = `mucTieu`).
 * Việc "Chọn bước tiếp" (QL / TVV): lộ trình FT mới nhất có kết quả, chưa chọn, em chưa Lưu trữ; hạn = hạn sau thi (OV-13q `trangThaiSauThi`), đỏ không chặn.
 */
import { db, tx } from '../db.ts';
import {
  LOI_TUAN_BAT_DAU, LUA_CHON_SAU_THI, ROUTE_KHAC, ROUTE_LO_TRINH_MOI, ghepMucTieu, kiemLopLoTrinhMoi, routeGoiYLoTrinhMoi, tenRoute, tenMonNgan, ngay, LUA_CHON_SAU_THI_CU, NHAN_SAU_THI, PERMISSIONS, chuTargetKck, duongHoSoHocVien, goiYSauThi, huongTiep, nhanDaXong, thuNgay, trangThaiSauThi, tuanHopLe, tuanLich,
  type DongSauThi, type HuongSauThi, type LuaChonSauThi,
  chuMon, luuMon, type MonVao,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { HttpError, addDays, badRequest, conflict, forbidden, notFound, nowIso, chuTuDo } from '../util.ts';
import { can, loadPrincipal, napTruocPhamVi, type Principal } from '../permissions.ts';
import { archiveStudent, coQuyenBuocTiep, hoanTacHocLai, hoanTacKetThuc, hoanTacTamDung, hocLai, setStudentStatus, unarchiveStudent } from '../students/students.ts';
import { huyLenh, raLenh } from '../classes/lenhChuyen.ts';
import { dauVaoTuLoTrinh, type LoTrinhMoiSauThi } from '../classes/luatLoTrinh.ts';
import { lichMtCua } from '../classes/schedule.ts';
import { mondayOf } from '../platform/week.ts';
import { thongBaoTrangThai } from '../students/trangThaiHv.ts';
import { closeCasesBySystem, moLaiCaseHeThongDong, type ChupCaseDong } from '../cases/systemClose.ts';
import { ghiBanChup } from './banChup.ts';
import { docTarget } from '../fasttrack/cycles.ts';
import { COT_SAU_THI, NGAY_CO_KQ } from './cotSauThi.ts';
import { chuViecTvv, coTheGiuViecTvv } from '../worklist/viecTvv.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import { nho } from '../platform/nguCanhRequest.ts';

/** Lộ trình FT có kết quả thi thật (cùng nghĩa `!canChoThiThat`): đủ 4 kỹ năng, "Không thi", hoặc kết quả CŨ (Overall / kết luận chọn tay). */
const CO_KET_QUA = `(c.thi_that_khong_thi = 1 OR (c.thi_that_l IS NOT NULL AND c.thi_that_r IS NOT NULL AND c.thi_that_w IS NOT NULL AND c.thi_that_s IS NOT NULL)
  OR c.outcome_score IS NOT NULL OR COALESCE(c.outcome, 'unknown') != 'unknown')`;
/** Cùng nghĩa `CO_KET_QUA` trên một dòng `learning_cycles` đã nạp — hồ sơ hỏi trước khi chạy câu Bước tiếp (trần câu SQL của `GET /students/:id`). */
export const coKetQuaThi = (c: any): boolean => !!c && (!!c.thi_that_khong_thi || [c.thi_that_l, c.thi_that_r, c.thi_that_w, c.thi_that_s].every((x) => x !== null && x !== undefined)
  || (c.outcome_score ?? null) !== null || (!!c.outcome && c.outcome !== 'unknown'));
const BAN_CHUP_CUOI = 'b.cycle_id = c.id AND b.lan = (SELECT MAX(lan) FROM ban_chup_lo_trinh WHERE cycle_id = c.id)';
/** Ghi danh đang giữ của em (đang học / tạm dừng) — lớp "Lớp này" và lớp nguồn của Chuyển lớp. */
const GHI_DANH = `(SELECT e.id FROM enrollments e WHERE e.student_id = c.student_id AND e.status IN ('active', 'paused') ORDER BY e.id DESC LIMIT 1)`;

function docLoTrinh(cycleId: number) {
  return db().prepare(
    `SELECT c.*, ${CO_KET_QUA} AS co_kq, b.ly_do AS bc_ly_do, b.ket_luan AS bc_ket_luan, b.class_id AS bc_class_id, b.class_code AS bc_class_code, ${NGAY_CO_KQ} AS ngay_kq, ep.week_start AS exam_week,
            (SELECT MAX(seq) FROM learning_cycles x WHERE x.student_id = c.student_id) AS seq_cuoi, u.full_name AS boi_ten,
            s.status AS em_status, s.archived_at AS em_archived, e.class_id AS lop_id, e.status AS ghi_danh, l.code AS lop_code
       FROM learning_cycles c JOIN students s ON s.id = c.student_id LEFT JOIN ban_chup_lo_trinh b ON ${BAN_CHUP_CUOI} LEFT JOIN users u ON u.id = c.buoc_tiep_boi
       LEFT JOIN report_periods ep ON ep.id = c.exam_period_id LEFT JOIN enrollments e ON e.id = ${GHI_DANH} LEFT JOIN classes l ON l.id = e.class_id WHERE c.id = ?`,
  ).get(cycleId) as any;
}
/** Lộ trình có mục Bước tiếp: FT, không đóng vì chuyển lớp (em không đi thi), có kết quả — hoặc đã chọn (kết quả bị xoá sau vẫn hiện lựa chọn). OV-13m: cả khi còn mở. */
const coMuc = (c: any) => !!c && !!c.route && (c.status === 'active' || c.bc_ly_do !== 'chuyen_lop') && (!!c.co_kq || !!c.buoc_tiep);
const ketLuanCua = (c: any): string | null => (c.status !== 'active' ? c.bc_ket_luan : null) ?? c.outcome ?? null;
const daXongCua = (c: any) => nhanDaXong({ khongThi: !!c.thi_that_khong_thi, ovr: c.outcome_score ?? null, ketLuan: ketLuanCua(c) });

export type TrangThaiBuocTiep = {
  chon: LuaChonSauThi | null; luc: string | null; boi: string | null; goiY: HuongSauThi | null; coTheChon: boolean;
  /** OV-13m: "Đã xong · OVR 6.5 · Đạt Target" · hạn chọn (ngày có kết quả + 7) · Thứ Hai hẹn bắt đầu + lớp hẹn · lớp đang giữ ("Lớp này") · Target giữ. */
  daXong: string; han: string; hen: string | null; henLop: string | null; lopNay: { id: number; code: string } | null; target: string; ngayThi: string | null;
  studentId: number; cycleId: number;
  /** 'reached' · 'not_reached' · null — màu nhãn "Đã xong" (không so chữ). */
  ketLuan: string | null;
  /** false khi lựa chọn không hoàn tác được nữa (Lộ trình mới · Lớp khác đã chuyển lớp) — web ẩn nút. */
  hoanTacDuoc: boolean;
  /** OV-13q: hạn đã gia hạn (chữ "đã gia hạn") · nút Gia hạn (chưa chọn, người làm được việc — `coTheGiaHanSauThi`). */
  daGiaHan: boolean; coTheGiaHan: boolean;
};

/** Mục "Bước tiếp" (ngăn Tổng kết, panel Bước tiếp, Các lộ trình) — null khi lộ trình không có mục. `coTheChon` = `coQuyenBuocTiep`, máy chủ kiểm lại khi chọn. */
export function trangThaiBuocTiep(p: Principal, cycleId: number): TrangThaiBuocTiep | null {
  const c = docLoTrinh(cycleId);
  if (!coMuc(c)) return null;
  const g = JSON.parse(c.buoc_tiep_json ?? '{}') as GhiBuocTiep;
  const coTheChon = coQuyenBuocTiep(p, c.student_id);
  return {
    chon: (c.buoc_tiep ?? null) as LuaChonSauThi | null, luc: c.buoc_tiep_luc ?? null, boi: c.boi_ten ?? null,
    goiY: goiYSauThi({ khongThi: !!c.thi_that_khong_thi, ketLuan: ketLuanCua(c) }),
    coTheChon, daGiaHan: trangThaiSauThi({ ...c, buoc_tiep: null }, demoToday()).daGiaHan,
    coTheGiaHan: !c.buoc_tiep && coTheChon,   // rà #436: giai đoạn chờ bước tiếp — chỉ người chọn được (`coTheGiaHanSauThi`)
    daXong: daXongCua(c), han: hanBuocTiep(c, demoToday()), hen: c.buoc_tiep_hen ?? null, henLop: c.buoc_tiep_hen ? g.lopMoiCode ?? c.lop_code ?? null : null,
    lopNay: c.lop_id ? { id: c.lop_id, code: c.lop_code } : c.bc_class_id ? { id: c.bc_class_id, code: c.bc_class_code } : null,
    target: chuTargetKck(c.target_score ?? null, !!c.khong_cam_ket), ngayThi: c.thi_that_ngay ?? null, studentId: c.student_id, cycleId: c.id, ketLuan: c.thi_that_khong_thi ? null : ketLuanCua(c),
    hoanTacDuoc: !(c.buoc_tiep === 'lo_trinh_moi' && g.lenhId && (db().prepare('SELECT trang_thai FROM lenh_chuyen_lop WHERE id = ?').get(g.lenhId) as any)?.trang_thai === 'da_chuyen'),
  };
}

export type ChonBuocTiepVao = {
  chon?: unknown; lopMoiId?: unknown; mucTieu?: number | string | null; thangThi?: string | null; date?: string; lyDo?: unknown; moLaiLop?: boolean;
  /** OV-13m (Lộ trình mới): 'ngay' / trống = Ngay bây giờ (tuần này là tuần 1), hoặc Thứ Hai từ tuần sau = Hẹn bắt đầu. */
  batDau?: unknown;
  /** UI-CV-TVV (mockup `tvv.html` Sau thi ②): ghi chú trao đổi với HV / PH — lưu cùng lựa chọn (`buoc_tiep_json`, nhật ký). */
  ghiChu?: unknown;
  /** P7 (N12): Lộ trình mới — LT1 · LT2 · RF · KHAC (trống = gợi ý: LT1 xong → LT2, còn lại giữ) · tên lộ trình Khác (bắt buộc) · Bỏ Target (chỉ Khác). */
  route?: unknown; routeTen?: unknown; boTarget?: unknown;
  /** P8 (N13): môn đăng ký của lộ trình mới (mảng L R W1 W2 S; null = đủ) — không gửi = môn của lộ trình cũ. */
  monDangKy?: unknown;
};

const CHI_QL = 'Chỉ Quản lý hoặc TVV của chi nhánh chọn được bước tiếp sau thi.';
const LY_DO_MOI = 'Lộ trình mới sau thi';

/** Ngày của hộp "Tạm dừng/ Kết thúc học" trong panel Bước tiếp: trống → hôm nay; sai dạng / sau hôm nay → 400. */
function docNgayDung(v: unknown, homNay: string): string {
  if (v === undefined || v === null || v === '') return homNay;
  const s = String(v);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw badRequest('Ngày không hợp lệ.');
  if (s > homNay) throw badRequest('Ngày hiệu lực không được sau hôm nay.');
  return s;
}

/** Lớp "Giữ lớp" của Lộ trình mới: lớp đang giữ, không có thì lớp cuối của bản chụp (có thể đã kết thúc — E2). */
const lopGiuCua = (c: any): any => {
  const id = c.lop_id ?? c.bc_class_id ?? null;
  return id ? db().prepare('SELECT id, code, is_fast_track, route, status, lich_mt, branch_id FROM classes WHERE id = ?').get(id) : null;
};

/** P7 (N12): đọc + kiểm lựa chọn Lộ trình mới (lộ trình, tên Khác, Bỏ Target, lớp đích hợp loại). Một hàm cho chọn (400) và xem trước (câu `loi`). */
function docLoTrinhMoi(c: any, input: ChonBuocTiepVao, lopMoiId: number | null, chiKiem = false): { route: string; routeTen: string | null; boTarget: boolean; monDangKy: string | null; lopDich: any; loi: string | null } {
  const raw = input.route === undefined || input.route === null || input.route === '' ? routeGoiYLoTrinhMoi(c.route) : String(input.route);
  if (!(ROUTE_LO_TRINH_MOI as readonly string[]).includes(raw)) throw badRequest('Lộ trình không hợp lệ — chọn LT1, LT2, RF hoặc Khác.');
  const khac = raw === ROUTE_KHAC;
  const routeTen = khac ? chuTuDo(input.routeTen, 'Tên lộ trình', 80) : null;
  const lopDich = lopMoiId ? db().prepare('SELECT id, code, is_fast_track, route, status, lich_mt, branch_id FROM classes WHERE id = ?').get(lopMoiId) as any : lopGiuCua(c);
  /* P8 (N13): mặc định môn của lộ trình cũ; gửi rỗng / lạ → lỗi (xem trước trả ở `loi`). */
  let monDangKy: string | null = c.mon_dang_ky ?? null, loiMon: string | null = null;
  if (input.monDangKy !== undefined) try { monDangKy = luuMon(input.monDangKy as MonVao); } catch (e: any) { loiMon = e.message; }
  const loi = (khac && !routeTen ? 'Ghi tên lộ trình "Khác".' : null) ?? loiMon
    ?? (lopDich ? kiemLopLoTrinhMoi(raw, { code: lopDich.code, ft: !!lopDich.is_fast_track, route: lopDich.route }) : 'Chọn lớp cho lộ trình mới.');
  if (loi && !chiKiem) throw badRequest(loi);
  return { route: raw, routeTen, boTarget: khac && input.boTarget === true, monDangKy, lopDich, loi };
}


/**
 * GET /cycles/:id/lo-trinh-moi/xem-truoc — khối "Khi lưu, web sẽ" của panel Lộ trình mới (k1–k3), đọc CÙNG hàm lúc thi hành: lộ trình gợi ý, lớp đích + kiểm loại
 * (`docLoTrinhMoi`), lịch MT của lớp đích (`lichMtCua`, Khác = 0), đầu vào (`dauVaoTuLoTrinh`), Case / PA của lộ trình cũ sẽ đóng (phạm vi `closeCasesBySystem` theo lộ trình).
 * Ai xem được panel Bước tiếp thì đọc được; lỗi chọn (lớp sai loại, thiếu tên) trả ở `loi`, không ném.
 */
export function xemTruocLoTrinhMoi(p: Principal, cycleId: number, input: ChonBuocTiepVao & { lopMoiId?: unknown }) {
  const c = docLoTrinh(cycleId);
  if (!coMuc(c)) throw notFound('Lộ trình không có Bước tiếp');
  const conn = db();
  const homNay = demoToday();
  const lopMoiId = input.lopMoiId ? Number(input.lopMoiId) : null;
  if (lopMoiId !== null && (!Number.isInteger(lopMoiId) || lopMoiId <= 0)) throw badRequest('Lớp không hợp lệ.');
  /* Lớp khác chỉ trong phạm vi người xem — không lộ mã / lịch của lớp ngoài phạm vi. */
  if (lopMoiId !== null && !can(p, PERMISSIONS.STUDENT_VIEW, { classId: lopMoiId })) throw forbidden('Lớp này nằm ngoài phạm vi bạn được xem.');
  const lt = docLoTrinhMoi(c, input, lopMoiId, true);
  const batDau = input.batDau === undefined || input.batDau === null || input.batDau === '' || input.batDau === 'ngay' ? homNay : String(input.batDau);
  if (!tuanHopLe(batDau, homNay)) throw badRequest(LOI_TUAN_BAT_DAU);
  const mucTieu = input.mucTieu === undefined || input.mucTieu === null || input.mucTieu === '' ? null : input.mucTieu;
  const tg = lt.boTarget ? '' : mucTieu !== null ? String(mucTieu) : chuTargetKck(c.target_score ?? null, !!c.khong_cam_ket);
  const ten = lt.route === ROUTE_KHAC ? `"${lt.routeTen ?? 'Khác'}"` : `FT ${lt.route}`;
  const lich = lt.lopDich ? lichMtCua(lt.lopDich, lt.route) : [];
  const t2 = mondayOf(batDau);
  const dv = dauVaoTuLoTrinh(c);
  const caseMo = (conn.prepare(`SELECT sc.id, sc.category FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
    WHERE COALESCE(sc.student_id, a.student_id) = ? AND sc.status != 'done' AND COALESCE(sc.cycle_id, a.cycle_id) = ?`).all(c.student_id, cycleId) as any[]);
  const soPa = caseMo.length ? (conn.prepare(`SELECT COUNT(*) n FROM case_interventions WHERE status IN ('planned', 'started') AND case_id IN (${caseMo.map(() => '?').join(',')})`)
    .get(...caseMo.map((x) => x.id)) as any).n as number : 0;
  const mon = [...new Set(caseMo.filter((x) => x.category).map((x) => tenMonNgan(null, x.category)))].join(', ');
  const tenCu = tenRoute(c) ?? 'lộ trình cũ';
  const dong = [
    `Mở ${ten} ở ${lt.lopDich?.code ?? '—'} từ ${batDau === homNay ? ngay(batDau, homNay) : `Thứ Hai ${ngay(batDau, homNay)}`}${tg ? ` · Target ${tg}` : ''}`,
    ...(lt.monDangKy ? [`Môn học ${chuMon(lt.monDangKy)}`] : []),
    lich.length ? `Tạo MT1–MT${lich.length}: ${lich.map((w) => tuanLich(addDays(t2, 7 * (w - 1)), homNay)).join(' · ')}` : 'Không tạo MT · thêm "+ MT" ở Kế hoạch Test khi cần',
    ...(dv ? [dv.attemptId ? `Đầu vào = ${dv.nguon.split(' ')[0]} (Overall ${dv.score?.toFixed(1)}) — chưa có KQ thi thật`
      : `Đầu vào = KQ thi ${ngay(c.thi_that_ngay, homNay)}: L ${dv.l?.toFixed(1)} · R ${dv.r?.toFixed(1)} · W ${dv.w?.toFixed(1)} · S ${dv.s?.toFixed(1)}`] : []),
    ...(lopMoiId && c.lop_id && lopMoiId !== c.lop_id ? [`Rời ${c.lop_code}`] : []),
    caseMo.length ? `Kết thúc ${tenCu} · đóng ${caseMo.length} Case${mon ? ` (${mon})` : ''} — Kết thúc lộ trình` : `Kết thúc ${tenCu}`,
    ...(soPa ? [`Dừng ${soPa} PA — Dừng · kết thúc lộ trình`] : []),
  ];
  const giu = lopMoiId ? lopGiuCua(c) : lt.lopDich;   // không chọn lớp khác → lớp đích chính là lớp giữ (đã đọc một lần)
  return {
    routeGoiY: routeGoiYLoTrinhMoi(c.route), route: lt.route, loi: lt.loi, dong, lopGiu: giu ? { id: giu.id as number, code: giu.code as string } : null,
    /** P8: môn đang chọn (mặc định của lộ trình cũ) — panel bật sẵn 5 nút theo đây; null = đủ môn. */
    monDangKy: (lt.monDangKy ? JSON.parse(lt.monDangKy) : null) as string[] | null,
  };
}

/**
 * Ai thực hiện các hàm một em bên dưới (Kết thúc học, Lưu trữ, Học lại, Tạm dừng, Chuyển lớp và hoàn tác — vốn đòi `cycle.edit` / `class.edit` / `student.edit`). Quản lý: chính họ.
 * TVV (đã qua `coQuyenBuocTiep`): cấp TẠM đúng các quyền đó, phạm vi chi nhánh của vai TVV, CHỈ trong lần gọi Bước tiếp này — TVV không có đường Học lại / chuyển lớp / xếp lớp /
 * Case chung (các đường đó vẫn kiểm quyền thật của người gọi). Nhật ký ghi đúng người bấm.
 */
function nguoiLam(p: Principal, studentId: number): Principal {
  if (can(p, PERMISSIONS.CYCLE_EDIT, { studentId })) return p;
  const g = p.grants.find((x) => x.roleKey === 'consultant' && can({ ...p, grants: [x] }, PERMISSIONS.STUDENT_EDIT_MORE, { studentId }));
  if (!g) throw forbidden(CHI_QL);
  const quyen = new Set<string>([PERMISSIONS.CYCLE_EDIT, PERMISSIONS.CLASS_EDIT, PERMISSIONS.STUDENT_EDIT, PERMISSIONS.STUDENT_EDIT_MORE]);
  return { ...p, grants: [...p.grants, { ...g, id: -1, roleKey: 'buoc_tiep', roleName: 'Bước tiếp sau thi', permissions: quyen }] };
}
type GhiBuocTiep = {
  ketThucHoc?: boolean; luuTru?: boolean; dongHan?: boolean; huongCu?: string | null;
  /** OV-13m: Tạm dừng — lộ trình đóng lần này · em Tạm dừng lần này. */
  dongLoTrinh?: boolean; tamDung?: boolean;
  /** OV-13m: Lộ trình mới — lệnh Chuyển lớp (lớp khác) · hẹn chưa bắt đầu (lớp + Target để bắt đầu) · từ Tạm dừng (Quay lại học; hoàn tác = Tạm dừng lại). */
  /** UI-CV-TVV: ghi chú của lần chọn. */
  ghiChu?: string | null;
  lenhId?: number; lopMoiId?: number | null; lopMoiCode?: string | null; mucTieu?: number | string | null; tuTamDung?: boolean;
  /** Lựa chọn Tạm dừng trước đó (dữ liệu hoàn tác + ngày + người) — hoàn tác Lộ trình mới trả đúng về nó. */
  tamDungCu?: { json: string | null; luc: string | null; boi: number | null };
  /** P7: ngày Tạm dừng (ngày vào Lưu trữ) trước Lộ trình mới — hoàn tác Tạm dừng lại đúng ngày đó. */
  tamDungNgay?: string | null;
  /** Tham số lần chọn (lớp · bắt đầu · Target) — lưu lại đúng lựa chọn này thì không làm lại (bấm đúp). */
  thamSo?: string;
  /** P7 (N12): lựa chọn panel Lộ trình mới (đường hẹn / lệnh chuyển lớp đọc lại) · Case lộ trình cũ đóng "Kết thúc lộ trình" lần này (Hoàn tác mở lại đúng chúng). */
  loTrinhMoi?: LoTrinhMoiSauThi;
  dongCaseLt?: { chup: ChupCaseDong[]; tinHieu: number[] };
};
/** Bản chụp mới nhất của lộ trình (hai tham số: cycle_id, cycle_id). */
const BAN_CHUP_MOI = 'cycle_id = ? AND lan = (SELECT MAX(lan) FROM ban_chup_lo_trinh WHERE cycle_id = ?)';

/** Hoàn tác đúng lựa chọn đang có (trong giao dịch của nơi gọi). Vướng (Học lại đã có điểm / em đã đổi trạng thái / đã chuyển lớp) → 409 nói rõ. */
function hoanTac(p: Principal, c: any) {
  const g = JSON.parse(c.buoc_tiep_json ?? '{}') as GhiBuocTiep;
  const conn = db();
  try {
    if (c.buoc_tiep === 'ket_thuc') {
      if (g.ketThucHoc) hoanTacKetThuc(p, c.student_id);
      else if (g.luuTru) unarchiveStudent(p, c.student_id);
    } else if (c.buoc_tiep === 'tam_dung') {
      if (g.tamDung) hoanTacTamDung(p, c.student_id);
      if (g.dongLoTrinh) conn.prepare(`UPDATE learning_cycles SET status = 'active', ended_at = NULL WHERE id = ? AND status = 'completed'`).run(c.id);
    } else if (c.buoc_tiep === 'lo_trinh_moi' && g.lenhId) {
      const l = conn.prepare('SELECT trang_thai FROM lenh_chuyen_lop WHERE id = ?').get(g.lenhId) as any;
      if (l?.trang_thai === 'da_chuyen') throw conflict('Em đã chuyển sang lớp mới (chuyển lớp không hoàn tác).');
      if (l?.trang_thai === 'cho') {
        conn.prepare('UPDATE learning_cycles SET buoc_tiep = NULL WHERE id = ?').run(c.id);   // nhật ký do nơi gọi ghi — `huyMotLenh` không ghi lần hai
        huyLenh(p, g.lenhId, 'Hoàn tác bước tiếp sau thi');
      }
    } else if (!(c.buoc_tiep === 'lo_trinh_moi' && c.buoc_tiep_hen)) {   // hẹn chưa bắt đầu: chưa đổi gì để gỡ
      hoanTacHocLai(p, c.student_id);
      if (g.dongHan) conn.prepare(`UPDATE learning_cycles SET status = 'abandoned' WHERE id = ? AND status = 'completed'`).run(c.id);
      if (g.ketThucHoc) hoanTacKetThuc(p, c.student_id);   // OV-11d: em còn ghi danh lúc chọn → trả về đang học như trước
      /* P7: Case của lộ trình cũ đóng "Kết thúc lộ trình" lần này → mở lại đúng chúng (PA về trạng thái cũ). */
      if (g.dongCaseLt?.chup.length) moLaiCaseHeThongDong({ actorUserId: p.userId, studentId: c.student_id, reason: 'ket_thuc_lo_trinh', chup: g.dongCaseLt.chup, tinHieu: g.dongCaseLt.tinHieu, lyDo: 'Hoàn tác Lộ trình mới' });
    }
    /* Lộ trình mới chọn lúc em Tạm dừng (Quay lại học) → hoàn tác = Tạm dừng lại, lựa chọn về "Tạm dừng". */
    if (g.tuTamDung && (conn.prepare('SELECT status FROM students WHERE id = ?').get(c.student_id) as any)?.status === 'active') {
      setStudentStatus(p, c.student_id, 'inactive', demoToday(), 'Hoàn tác Lộ trình mới');   // mốc hôm nay (không được trước lần Quay lại học)
      if (g.tamDungNgay) conn.prepare('UPDATE students SET archived_at = ? WHERE id = ?').run(g.tamDungNgay, c.student_id);   // P7: Lưu trữ đúng ngày Tạm dừng cũ
    }
  } catch (e) {
    if (e instanceof HttpError && e.status === 409) {
      throw conflict(`Không đổi được "${NHAN_SAU_THI[c.buoc_tiep as LuaChonSauThi]}": ${e.message} Giữ lựa chọn cũ, hoặc đổi ở hồ sơ học viên (Chuyển lớp / Kết thúc học).`);
    }
    throw e;
  }
  if (g.huongCu !== undefined) conn.prepare(`UPDATE ban_chup_lo_trinh SET huong_tiep = ? WHERE ${BAN_CHUP_MOI}`).run(g.huongCu, c.id, c.id);
  /* Lộ trình đã thi mở lại (hoàn tác Thôi học / Tạm dừng) → bỏ bản chụp lúc đóng lần này (lộ trình đang mở không có bản chụp). */
  const bc = conn.prepare(`SELECT b.id FROM ban_chup_lo_trinh b JOIN learning_cycles c ON c.id = b.cycle_id
    WHERE b.cycle_id = ? AND c.status = 'active' AND b.ly_do IN ('ket_thuc', 'tam_dung') ORDER BY b.lan DESC LIMIT 1`).get(c.id) as any;
  if (bc) { conn.prepare('DELETE FROM ban_chup_luot WHERE ban_chup_id = ?').run(bc.id); conn.prepare('DELETE FROM ban_chup_lo_trinh WHERE id = ?').run(bc.id); }
  const cu = g.tuTamDung ? g.tamDungCu ?? { json: '{}', luc: c.buoc_tiep_luc, boi: c.buoc_tiep_boi } : null;
  conn.prepare('UPDATE learning_cycles SET buoc_tiep = ?, buoc_tiep_luc = ?, buoc_tiep_boi = ?, buoc_tiep_json = ?, buoc_tiep_hen = NULL WHERE id = ?')
    .run(cu ? 'tam_dung' : null, cu?.luc ?? null, cu?.boi ?? null, cu ? cu.json ?? '{}' : null, c.id);
}

/**
 * Bắt đầu Lộ trình mới bằng `hocLai` (Lớp này, hoặc Lớp khác khi em không còn ghi danh đang học): Kết thúc học (nếu còn học) + Học lại cùng giao dịch, lộ trình MỚI
 * bắt đầu `date` (tuần đó là tuần 1). Target giữ; `mucTieu` (Sửa) → Target của lộ trình mới.
 */
function batDauBangHocLai(q: Principal, c: any, o: { date: string; lopMoiId: number | null; mucTieu?: number | string | null; moLaiLop?: boolean; lyDo?: unknown; thangThi?: string | null }, ghi: GhiBuocTiep) {
  const conn = db();
  /* P7 (N12): Lộ trình mới — Case chưa xong của lộ trình cũ đóng "Kết thúc lộ trình" TRƯỚC Kết thúc học (Kết thúc học chỉ còn đóng Case không thuộc lộ trình nào, như cũ). */
  if (ghi.loTrinhMoi) {
    const cs = closeCasesBySystem({ actorUserId: q.userId, studentId: c.student_id, reason: 'ket_thuc_lo_trinh', on: o.date, cycleIds: [c.id] });
    if (cs.chup.length || cs.withdrawnSignalIds.length) ghi.dongCaseLt = { chup: cs.chup, tinHieu: cs.withdrawnSignalIds };
  }
  if ((conn.prepare('SELECT status FROM students WHERE id = ?').get(c.student_id) as any).status !== 'finished') {
    setStudentStatus(q, c.student_id, 'finished', o.date, LY_DO_MOI);
    ghi.ketThucHoc = true;
  }
  /* Về lớp cũ: lộ trình đã thi KHÔNG chạy tiếp → đóng hẳn trước, `hocLai` thấy không còn lộ trình để chạy tiếp thì mở lộ trình mới ở lớp cũ. */
  if (!o.lopMoiId) ghi.dongHan = conn.prepare(`UPDATE learning_cycles SET status = 'completed' WHERE id = ? AND status = 'abandoned'`).run(c.id).changes > 0;
  /* P7 (E2): Lộ trình mới "Giữ lớp" khi lớp cũ đã kết thúc → máy chủ tự mở lại lớp (web không phải gửi `moLaiLop`). */
  hocLai(q, c.student_id, { date: o.date, lyDo: o.lyDo ?? LY_DO_MOI, moLaiLop: o.moLaiLop === true || !!ghi.loTrinhMoi, lopMoiId: o.lopMoiId, mucTieu: o.mucTieu ?? null, thangThi: o.thangThi ?? null, sauThi: ghi.loTrinhMoi ?? null });
}

/** "Hướng tiếp" của bản chụp mới nhất theo lựa chọn (một nguồn cho Tổng kết, Các lộ trình, Tổng kết lớp); nhớ hướng cũ để hoàn tác. Chưa có bản chụp (hẹn chưa bắt đầu) → không làm gì. */
function datHuong(cycleId: number, chon: LuaChonSauThi, routeMoi: string | null, ghi: GhiBuocTiep) {
  const conn = db();
  const bc = conn.prepare(`SELECT huong_tiep FROM ban_chup_lo_trinh WHERE ${BAN_CHUP_MOI}`).get(cycleId, cycleId) as any;
  if (!bc) return;
  ghi.huongCu = bc.huong_tiep ?? null;
  const huong = chon === 'hoc_tiep' || chon === 'lo_trinh_moi' ? huongTiep('lo_trinh_moi', routeMoi) : chon;
  conn.prepare(`UPDATE ban_chup_lo_trinh SET huong_tiep = ? WHERE ${BAN_CHUP_MOI}`).run(huong, cycleId, cycleId);
}

/** POST /cycles/:id/buoc-tiep — chọn (hoặc đổi) bước tiếp. Một giao dịch: hoàn tác lựa chọn cũ → làm cái mới → ghi lựa chọn + mốc Hành trình + nhật ký. */
export function chonBuocTiep(p: Principal, cycleId: number, input: ChonBuocTiepVao) {
  const c0 = docLoTrinh(cycleId);
  if (!c0) throw notFound('Không tìm thấy lộ trình');
  if (!coQuyenBuocTiep(p, c0.student_id)) throw forbidden(CHI_QL);
  const q = nguoiLam(p, c0.student_id);
  const chon = input.chon as LuaChonSauThi;
  if (![...LUA_CHON_SAU_THI, ...LUA_CHON_SAU_THI_CU].includes(chon)) throw badRequest('Bước tiếp không hợp lệ.');
  if (!coMuc(c0) || !c0.co_kq) throw badRequest('Lộ trình chưa có kết quả thi thật — nhập kết quả (hoặc Không thi) trước khi chọn bước tiếp.');
  const lopMoiId = input.lopMoiId ? Number(input.lopMoiId) : null;
  if (chon === 'hoc_tiep' && !lopMoiId) throw badRequest('Học tiếp lộ trình mới: chọn lớp.');
  /* OV-12a: TVV chỉ xếp sang lớp thuộc chi nhánh của mình (quyền tạm `nguoiLam` theo chi nhánh TVV); QL giữ luật cũ (Q3: không đòi quyền lớp mới). */
  if (lopMoiId && q !== p && !can(q, PERMISSIONS.CLASS_EDIT, { classId: lopMoiId })) throw forbidden('Lớp chuyển đến nằm ngoài chi nhánh của bạn.');
  const conn = db();
  const homNay = demoToday();
  const batDau = chon !== 'lo_trinh_moi' || input.batDau === undefined || input.batDau === null || input.batDau === '' || input.batDau === 'ngay' ? homNay : String(input.batDau);
  if (!tuanHopLe(batDau, homNay)) throw badRequest(LOI_TUAN_BAT_DAU);
  const hen = batDau !== homNay ? batDau : null;
  /* Target (Sửa) kiểm TRƯỚC khi ghi — cùng luật `docTarget` của hocLai / lệnh: sai → 400 ngay, không để lượt hẹn / lệnh mang Target hỏng. */
  const mucTieu = input.mucTieu === undefined || input.mucTieu === null || input.mucTieu === '' ? null : input.mucTieu;
  const tg = mucTieu === null ? null : docTarget(mucTieu);
  const tgLenh = tg ? ghepMucTieu(tg.target, tg.kck) : null;
  const ghiChu = chuTuDo(input.ghiChu, 'Ghi chú', 2000);
  /* P7 (N12): Lộ trình mới — lộ trình + lớp đích hợp loại, kiểm TRƯỚC khi ghi (cùng hàm panel xem trước). Hộp "Tạm dừng/ Kết thúc học": ngày + lý do. */
  const lt = chon === 'lo_trinh_moi' ? docLoTrinhMoi(c0, input, lopMoiId) : null;
  const lyDoDung = chon === 'tam_dung' || chon === 'ket_thuc' ? chuTuDo(input.lyDo, 'Lý do', 2000) : null;
  const ngayDung = chon === 'tam_dung' || chon === 'ket_thuc' ? docNgayDung(input.date, homNay) : homNay;
  /* Ghi chú vào khoá chỉ khi có — lựa chọn cũ (không ghi chú) gửi lại vẫn là "không làm lại gì". */
  const thamSo = JSON.stringify([lopMoiId, hen, mucTieu === null ? null : String(mucTieu), ...(ghiChu ? [ghiChu] : []), ...(lt ? [lt.route, lt.routeTen, lt.boTarget, ...(lt.monDangKy ? [lt.monDangKy] : [])] : [])]);
  return tx(() => {
    /* Đọc lại TRONG giao dịch: hai người bấm cùng lúc thì người sau hoàn tác đúng lựa chọn người trước vừa ghi. */
    const cu = docLoTrinh(cycleId);
    /* Lưu lại ĐÚNG lựa chọn đang có (bấm đúp, gửi lại) → không làm lại gì. */
    if (cu.buoc_tiep === chon && (JSON.parse(cu.buoc_tiep_json ?? '{}') as GhiBuocTiep).thamSo === thamSo) return trangThaiBuocTiep(p, cycleId);
    const ghi: GhiBuocTiep = { thamSo, ...(ghiChu ? { ghiChu } : {}), ...(lt ? { loTrinhMoi: { route: lt.route, routeTen: lt.routeTen, boTarget: lt.boTarget, monDangKy: lt.monDangKy, cuoiId: cycleId } } : {}) };
    /* OV-13m: em Tạm dừng sau thi → Lộ trình mới = Quay lại học (hạn tính lại từ hôm nay), không gỡ Tạm dừng; hoàn tác thì Tạm dừng lại. */
    if (cu.buoc_tiep === 'tam_dung' && chon === 'lo_trinh_moi') {
      if (cu.em_status === 'inactive') setStudentStatus(q, cu.student_id, 'active', homNay, 'Quay lại học', null, { lopKetThucDuoc: true });   // P7 (E2): lớp giữ đã kết thúc → mở lại ở dưới
      ghi.tuTamDung = true;
      ghi.tamDungNgay = cu.em_archived ?? null;
      ghi.tamDungCu = { json: cu.buoc_tiep_json ?? null, luc: cu.buoc_tiep_luc ?? null, boi: cu.buoc_tiep_boi ?? null };
    } else if (cu.buoc_tiep) hoanTac(q, cu);
    const c = docLoTrinh(cycleId);
    if (c.seq !== c.seq_cuoi) throw badRequest('Em đã có lộ trình sau lộ trình này — bước tiếp chọn ở lộ trình mới nhất.');
    if (chon === 'tam_dung' && c.em_status === 'finished') throw badRequest('Em đã Kết thúc học — chọn Lộ trình mới hoặc Thôi học.');
    /* Ghi lựa chọn TRƯỚC khi làm: "Ngay bây giờ" ở lớp khác chuyển ngay trong cùng giao dịch, `apDungMotDong` đọc lựa chọn này để đóng lộ trình đã xong, mở lộ trình mới. */
    conn.prepare('UPDATE learning_cycles SET buoc_tiep = ?, buoc_tiep_luc = ?, buoc_tiep_boi = ?, buoc_tiep_hen = ?, buoc_tiep_json = ? WHERE id = ?').run(chon, homNay, p.userId, hen, JSON.stringify(ghi), cycleId);
    if (chon === 'ket_thuc') {
      if (c.em_status !== 'finished') { setStudentStatus(q, c.student_id, 'finished', ngayDung, lyDoDung ?? 'Kết thúc sau thi'); ghi.ketThucHoc = true; }
      if (!(conn.prepare('SELECT archived_at FROM students WHERE id = ?').get(c.student_id) as any).archived_at) { archiveStudent(q, c.student_id); ghi.luuTru = true; }
    } else if (chon === 'tam_dung') {
      if (c.status === 'active') {
        conn.prepare(`UPDATE learning_cycles SET status = 'completed', ended_at = ? WHERE id = ?`).run(ngayDung, cycleId);
        ghiBanChup(conn, [cycleId], { lyDo: 'tam_dung', ngay: ngayDung });
        ghi.dongLoTrinh = true;
      }
      if (c.em_status === 'active') { setStudentStatus(q, c.student_id, 'inactive', ngayDung, lyDoDung ?? 'Tạm dừng sau thi'); ghi.tamDung = true; }
    } else if (chon === 'lo_trinh_moi' && lopMoiId && c.ghi_danh === 'active' && (conn.prepare('SELECT status FROM students WHERE id = ?').get(c.student_id) as any).status === 'active') {
      /* Lớp khác, em đang học: đúng đường Chuyển lớp (OV-13l) — cùng luật lớp đích, phiếu bàn giao, hạn ≥ 7 ngày; "Ngay bây giờ" = chuyển ngay. */
      const r = raLenh(q, {
        lopNguonId: c.lop_id, boiCanh: 'giua-khoa', tuanChung: null,
        dongs: [{ studentId: c.student_id, huong: 'chuyen_lop', toClassId: lopMoiId, tuan: batDau, lyDo: LY_DO_MOI, mucTieu: tgLenh }],
      });
      if (r.failed.length) throw badRequest(r.failed[0].message);
      ghi.lenhId = (conn.prepare('SELECT id FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1').get(c.student_id) as any).id;
    } else if (chon === 'lo_trinh_moi' && hen) {
      /* Hẹn bắt đầu: chưa đổi gì — tới Thứ Hai đó `batDauHenDenHan` bắt đầu bằng đúng đường "Ngay bây giờ". */
      Object.assign(ghi, { lopMoiId, mucTieu });
    } else if (chon === 'lo_trinh_moi' || chon === 'hoc_tiep' || chon === 'hoc_lai') {
      batDauBangHocLai(q, c, { date: chon === 'lo_trinh_moi' ? homNay : typeof input.date === 'string' && input.date ? input.date : homNay, lopMoiId,
        mucTieu, moLaiLop: input.moLaiLop, lyDo: chon === 'lo_trinh_moi' ? undefined : input.lyDo, thangThi: input.thangThi }, ghi);
    }
    const lopMoi = lopMoiId ? conn.prepare('SELECT code, route FROM classes WHERE id = ?').get(lopMoiId) as any : null;
    if (lopMoi) ghi.lopMoiCode = lopMoi.code;
    const lop = lopMoi?.code ?? null;
    datHuong(cycleId, chon, lt?.route ?? lopMoi?.route ?? null, ghi);   // P7: hướng theo lộ trình đã chọn (LT2 ở lớp LT1 vẫn "Lên LT2")
    conn.prepare('UPDATE learning_cycles SET buoc_tiep_json = ? WHERE id = ?').run(JSON.stringify(ghi), cycleId);
    addJourney({
      studentId: c.student_id, cycleId, eventType: 'buoc_tiep', eventDate: homNay, title: `Sau thi: ${NHAN_SAU_THI[chon]}`,
      detail: [lop ? `lớp ${lop}` : null, hen ? `hẹn bắt đầu ${tuanLich(hen, homNay)}` : null, cu.buoc_tiep ? `đổi từ ${NHAN_SAU_THI[cu.buoc_tiep as LuaChonSauThi]}` : null, ghiChu]
        .filter(Boolean).join(' · ') || null,
      refTable: 'learning_cycles', refId: cycleId, createdBy: p.userId, dedupKey: `buoc_tiep:${cycleId}:${nowIso()}`,
    });
    /* OV-13j: nhật ký theo trường (Lịch sử sửa đọc `buoc_tiep` / `buoc_tiep_hen`). */
    writeAudit({ actorUserId: p.userId, action: 'cycle.buoc_tiep', entityType: 'learning_cycle', entityId: cycleId,
      before: { buocTiep: cu.buoc_tiep ?? null, buocTiepHen: cu.buoc_tiep_hen ?? null }, after: { buocTiep: chon, buocTiepHen: hen, lopMoiId, ...ghi } });
    const kq = trangThaiBuocTiep(p, cycleId);
    /* P7: "Tạm dừng/ Kết thúc học" — câu báo theo trạng thái thật của em (cùng hàm hộp hồ sơ). */
    return chon === 'tam_dung' || chon === 'ket_thuc'
      ? { ...kq, thongBao: thongBaoTrangThai(conn.prepare('SELECT status, archived_at FROM students WHERE id = ?').get(c.student_id) as any) } : kq;
  });
}

/** DELETE /cycles/:id/buoc-tiep — Hoàn tác lựa chọn / Huỷ hẹn (về "chờ chọn"; Lộ trình mới chọn lúc Tạm dừng → về Tạm dừng). */
export function boChonBuocTiep(p: Principal, cycleId: number) {
  const c = docLoTrinh(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  if (!coQuyenBuocTiep(p, c.student_id)) throw forbidden(CHI_QL);
  if (!c.buoc_tiep) return trangThaiBuocTiep(p, cycleId);
  return tx(() => {
    hoanTac(nguoiLam(p, c.student_id), c);
    addJourney({
      studentId: c.student_id, cycleId, eventType: 'buoc_tiep', eventDate: demoToday(), title: `Sau thi: ${c.buoc_tiep_hen ? 'huỷ hẹn' : 'hoàn tác'} ${NHAN_SAU_THI[c.buoc_tiep as LuaChonSauThi]}`,
      refTable: 'learning_cycles', refId: cycleId, createdBy: p.userId, dedupKey: `buoc_tiep:${cycleId}:${nowIso()}`,
    });
    const sau = db().prepare('SELECT buoc_tiep FROM learning_cycles WHERE id = ?').get(cycleId) as any;
    writeAudit({ actorUserId: p.userId, action: 'cycle.buoc_tiep', entityType: 'learning_cycle', entityId: cycleId,
      before: { buocTiep: c.buoc_tiep, buocTiepHen: c.buoc_tiep_hen ?? null }, after: { buocTiep: sau?.buoc_tiep ?? null, buocTiepHen: null } });
    return trangThaiBuocTiep(p, cycleId);
  });
}

/**
 * HẸN BẮT ĐẦU tới tuần (OV-13m) — cron Thứ Hai (`chotVangDinhKy`) + quét khi đọc (`quetLenhDenHan`). Một câu rẻ khi không có gì đến hạn; mỗi lộ trình một giao dịch, đọc lại
 * trong giao dịch (chạy hai lần liền → lần hai không làm gì). Ngày bắt đầu = đúng Thứ Hai đã hẹn (tuần đó là tuần 1), kể cả khi quét muộn. Thực hiện dưới tên người đã chọn.
 */
export function batDauHenDenHan(homNay = demoToday()): number {
  const ds = db().prepare(`SELECT id FROM learning_cycles WHERE buoc_tiep = 'lo_trinh_moi' AND buoc_tiep_hen IS NOT NULL AND buoc_tiep_hen <= ? ORDER BY buoc_tiep_hen, id LIMIT 20`)
    .all(homNay) as any[];   // shortcut: 20 em / lượt quét, lượt sau làm tiếp
  let n = 0;
  for (const { id } of ds) {
    try {
      tx(() => {
        const c = docLoTrinh(id);
        if (!c || c.buoc_tiep !== 'lo_trinh_moi' || !c.buoc_tiep_hen || c.buoc_tiep_hen > homNay) return;
        const g = JSON.parse(c.buoc_tiep_json ?? '{}') as GhiBuocTiep;
        if (!g.lenhId) {
          batDauBangHocLai(nguoiLam(loadPrincipal(c.buoc_tiep_boi), c.student_id), c, { date: c.buoc_tiep_hen, lopMoiId: g.lopMoiId ?? null, mucTieu: g.mucTieu ?? null }, g);   // P7: `g.loTrinhMoi` đi theo
          datHuong(id, 'lo_trinh_moi', g.loTrinhMoi?.route ?? (g.lopMoiId ? (db().prepare('SELECT route FROM classes WHERE id = ?').get(g.lopMoiId) as any)?.route ?? null : null), g);
          n++;
        }
        db().prepare('UPDATE learning_cycles SET buoc_tiep_hen = NULL, buoc_tiep_json = ? WHERE id = ?').run(JSON.stringify(g), id);
      });
    } catch (e) {
      /* Không bắt đầu được (Target / lớp / quyền đổi sau khi hẹn): ghi MỘT lần, lộ trình về "Chọn bước tiếp" (việc hiện lại, hạn cũ), báo người đã chọn — không thử lại mãi. */
      const loi = String((e as Error)?.message ?? e).slice(0, 300);
      console.error('[buoc-tiep] hẹn bắt đầu', id, loi);
      try {
        tx(() => {
          const c = db().prepare('SELECT id, student_id, buoc_tiep_boi, buoc_tiep_hen FROM learning_cycles WHERE id = ? AND buoc_tiep_hen IS NOT NULL').get(id) as any;
          if (!c) return;
          db().prepare('UPDATE learning_cycles SET buoc_tiep = NULL, buoc_tiep_luc = NULL, buoc_tiep_boi = NULL, buoc_tiep_json = NULL, buoc_tiep_hen = NULL WHERE id = ?').run(id);
          addJourney({ studentId: c.student_id, cycleId: id, eventType: 'buoc_tiep', eventDate: homNay, title: 'Sau thi: hẹn bắt đầu không thành', detail: loi,
            refTable: 'learning_cycles', refId: id, createdBy: null, dedupKey: `buoc_tiep_loi:${id}:${c.buoc_tiep_hen}` });
          writeAudit({ actorUserId: null, action: 'cycle.buoc_tiep', entityType: 'learning_cycle', entityId: id,
            before: { buocTiep: 'lo_trinh_moi', buocTiepHen: c.buoc_tiep_hen }, after: { buocTiep: null, buocTiepHen: null, loi } });
          const ten = (db().prepare('SELECT full_name FROM students WHERE id = ?').get(c.student_id) as any)?.full_name ?? 'học viên';
          if (c.buoc_tiep_boi) notify({ userId: c.buoc_tiep_boi, kind: 'buoc_tiep_loi', title: `Chưa bắt đầu được lộ trình mới · ${ten}`, body: `${loi} Chọn lại bước tiếp.`,
            entityType: 'student', entityId: c.student_id, dedupKey: `buoc_tiep_loi:${id}:${c.buoc_tiep_hen}`, duong: duongHoSoHocVien(c.student_id, { buocTiep: id }) });
        });
      } catch (e2) { console.error('[buoc-tiep] ghi lỗi hẹn', id, e2); }
    }
  }
  return n;
}

/**
 * OV-11d (HV-6) — KIỂM TRƯỚC DEPLOY, CHỈ ĐỌC: em có lộ trình FT mới nhất ĐÃ ĐÓNG mà còn ghi danh (đang học / tạm dừng), chưa Kết thúc học, chưa Lưu trữ —
 * những em Bước tiếp sẽ cho Kết thúc học + Học lại cùng giao dịch. Một câu `SELECT` (chạy được thẳng trên bản chính).
 */
export const SQL_DONG_CON_GHI_DANH = `SELECT s.id, s.student_code, s.full_name, c.code AS lop, cy.id AS cycle_id, cy.route, cy.status AS cycle_status
  FROM students s
  JOIN learning_cycles cy ON cy.student_id = s.id AND cy.route IS NOT NULL AND cy.status IN ('completed', 'abandoned')
   AND cy.seq = (SELECT MAX(x.seq) FROM learning_cycles x WHERE x.student_id = s.id)
  JOIN enrollments e ON e.id = (SELECT MAX(e2.id) FROM enrollments e2 WHERE e2.student_id = s.id AND e2.status IN ('active', 'paused'))
  JOIN classes c ON c.id = e.class_id
 WHERE s.status != 'finished' AND s.archived_at IS NULL
 ORDER BY c.code, s.full_name`;
export const emDongConGhiDanh = (conn: any): any[] => conn.prepare(SQL_DONG_CON_GHI_DANH).all() as any[];

// ------------------------------------------------------------------ việc QL / TVV "Chọn bước tiếp"
/** OV-13q: hạn chọn bước tiếp = hạn sau thi (ngày thi + 7, gia hạn) hoặc ngày có kết quả nếu muộn hơn (`trangThaiSauThi`) — việc Công việc, góc Cần làm của TVV,
 * panel Bước tiếp, hồ sơ cùng hàm. Không có ngày nào (dữ liệu cũ) → hôm nay. */
export const hanBuocTiep = (c: DongSauThi, today: string): string => trangThaiSauThi({ ...c, buoc_tiep: null }, today).han ?? today;

/**
 * Lộ trình chờ chọn bước tiếp (chưa lọc quyền) — một nguồn cho việc QL / TVV (`viecBuocTiep`), ô "Chờ chọn bước tiếp" (OV-10c) và đếm trước deploy (`SQL_CHO_BUOC_TIEP`).
 * OV-13m: sinh NGAY khi có kết quả, cả khi em còn ghi danh (lộ trình còn mở); lộ trình đã đóng thì không đóng vì chuyển lớp. Lớp = lớp cuối (bản chụp) hoặc lớp đang giữ.
 */
export const SQL_CHO_BUOC_TIEP = `SELECT c.id, c.student_id, s.full_name AS ten, s.consultant_user_id AS tvv, ${COT_SAU_THI}, c.status, b.ket_luan,
       COALESCE(b.class_id, e.class_id) AS class_id, COALESCE(b.class_code, l.code) AS class_code, COALESCE(b.branch_id, l.branch_id) AS branch_id
  FROM learning_cycles c JOIN students s ON s.id = c.student_id LEFT JOIN ban_chup_lo_trinh b ON ${BAN_CHUP_CUOI} LEFT JOIN report_periods ep ON ep.id = c.exam_period_id
  LEFT JOIN enrollments e ON e.id = ${GHI_DANH} LEFT JOIN classes l ON l.id = e.class_id
 WHERE c.route IS NOT NULL AND c.buoc_tiep IS NULL AND (s.archived_at IS NULL OR s.status = 'inactive')   -- P7: em Tạm dừng (Lưu trữ) vẫn có việc
   AND (c.status = 'active' OR COALESCE(b.ly_do, '') != 'chuyen_lop') AND ${CO_KET_QUA}
   AND c.seq = (SELECT MAX(seq) FROM learning_cycles x WHERE x.student_id = c.student_id)`;
/** TD7: cả hệ thống nhớ trong request GET (Công việc, Học viên & Lớp gọi nhiều lần). Người gọi không sửa kết quả. */
export function choBuocTiep(studentId?: number): any[] {
  if (studentId) return db().prepare(`${SQL_CHO_BUOC_TIEP} AND c.student_id = ?`).all(studentId) as any[];
  return nho('cho-buoc-tiep', () => db().prepare(SQL_CHO_BUOC_TIEP).all() as any[]);
}

/**
 * Một dòng mỗi lộ trình chờ chọn. Ai thấy: người chọn được (`coQuyenBuocTiep` — Quản lý / Quản trị / TVV của chi nhánh), là việc của chính họ. Một câu cho cả tập;
 * quyền hỏi theo em (tập nhỏ: em có kết quả, chưa chọn). Dòng: "Chọn bước tiếp" · em · lớp · "đã thi T7 10/10 · OVR 6.5 · Đạt Target" (mockup OV-13 bước tiếp §3).
 */
export function viecBuocTiep(p: Principal, f: { today: string; branchId: number | null; studentId?: number; tatCa?: boolean }): any[] {
  if (!coTheGiuViecTvv(p)) return [];
  const ds = choBuocTiep(f.studentId);
  napTruocPhamVi(ds.map((c) => c.student_id));   // quyền theo em đọc phạm vi một câu cho cả tập — không N+1
  const out: any[] = [];
  for (const c of ds) {
    if ((f.branchId && c.branch_id && c.branch_id !== f.branchId) || (f.studentId && c.student_id !== f.studentId)) continue;
    /* SV-TVV-VIEC: MỘT người giữ = TVV của em (không có → QL chi nhánh) — QL / TVV khác của chi nhánh vẫn chọn được (`coQuyenBuocTiep`) nhưng không là việc của họ. */
    const chu = chuViecTvv(p, c.student_id, c.tvv ?? null, f.tatCa);
    if (!chu) continue;
    const st = trangThaiSauThi(c, f.today);
    const han = st.han ?? f.today;
    const kq = daXongCua({ ...c, bc_ket_luan: c.ket_luan });
    const ketQua = nhanDaXong({ khongThi: !!c.thi_that_khong_thi, ovr: c.outcome_score ?? null, ketLuan: c.ket_luan ?? c.outcome ?? null }, true);
    const thi = c.thi_that_ngay ? `đã thi ${thuNgay(c.thi_that_ngay, f.today)}` : null;
    out.push({
      key: `buoc_tiep:${c.id}`, group: 'buoc_tiep', urgency: f.today > han ? 'overdue' : 'normal', cycleId: c.id, daGiaHan: st.daGiaHan,
      studentId: c.student_id, studentName: c.ten, classId: c.class_id ?? null, classCode: c.class_code ?? null,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: st.daGiaHan ? `${kq} · đã gia hạn` : kq, count: null,
      reason: [c.class_code ?? null, thi, ketQua].filter(Boolean).join(' · '),
      tieuDe: 'Chọn bước tiếp', phu: null, actionLabel: 'Chốt bước tiếp',
      href: duongHoSoHocVien(c.student_id, { buocTiep: c.id }), ownerId: chu.ownerId, owner: null, mine: chu.mine,
      due: han, statusLabel: `hạn ${tuanLich(han, f.today)}`,
    });
  }
  return out;
}
