import { db } from '../db.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import {
  ASSESSED_SKILLS, ATTEMPT_KIND_SHORT, chuViecChotLoTrinh, CAN_XU_LY, CHAM_CHEO, CHUA_CO_HAN, baiId, MOC_KE_TIEP_SQL, PERMISSIONS, type AttemptKind, tenMon, tenMonNgan, chonDiemDangChuY, sapCanXuLy,
  duongHoSoHocVien, nguoiGiuViecChu, NHOM_CASE_CHUA_CHOT_LABEL, soSanhLop, tuanCuaHanGhiKetQua, tuanLich,
  type ChuongTrinh, type DiemChuY, type DongCanXuLyGoc, type MaCanXuLy, type UngVienChuY,
} from '../../../shared/domain/index.ts';
import { lopChoChotLoTrinh } from '../classes/lenhChuyen.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, badRequest, forbidden } from '../util.ts';
import { activeAt, can, lopFtChoGvSpeaking, scopeFor, type Principal } from '../permissions.ts';
import { latestAttempts } from './danhGia.ts';
import { classProgressMany } from '../classes/schedule.ts';
import { mondayOf } from '../platform/week.ts';
import { CT_LOP, metricSet, nhomCaseChuaChot, rowsFor } from './metrics.ts';
import { xuLyCaseMany } from '../cases/sosState.ts';
import { lopCuaTap, tachTheoLop } from './chuongTrinh.ts';
import { demYeuCau, quetYeuCau } from '../duyet/yeuCau.ts';
import { noDiemCuaGv } from '../giaoVien/hoSo.ts';
import { chiSoHoSoGv } from '../phanTich/giaoVien.ts';
import { tapThiThangNayLop } from '../phanTich/baoCao.ts';
import { phamViXemViec } from './xemViec.ts';
import { viecBuocTiep } from '../loTrinh/buocTiep.ts';
import { toiHan } from '../platform/thongBaoTuDong.ts';

/**
 * TỔNG QUAN (PR-Pa, đặc tả §3.2). File này KHÔNG ĐẾM gì: mọi số lấy từ `metricSet` (hợp đồng số liệu luật 1), ở đây chỉ
 * chọn chỉ số nào lên khối nào, xếp thứ tự và viết dòng phụ.
 */

const laQuanLy = (p: Principal) => {
  if (scopeFor(p, PERMISSIONS.ANALYSIS_VIEW).none) throw forbidden('Khối này dành cho Quản lý.');
};
/* OV-11f (TQ-9): Cần xử lý + dải Chờ duyệt là VIỆC của Quản lý (GV nào trễ, nhắc ai) — đòi quyền xem việc người khác (`case.approve`, `phamViXemViec`
   = 'het'), không chỉ `analysis.view` (TVV / CX / Admin cũng có). Điểm đáng chú ý / bảng chi nhánh giữ `analysis.view`. */
const laViecQuanLy = (p: Principal) => {
  laQuanLy(p);
  if (phamViXemViec(p) !== 'het') throw forbidden('Khối này dành cho Quản lý.');
};

/**
 * TẦNG 1 CỦA QUẢN LÝ: Cần xử lý + Cần bạn quyết. SL2 (9.1-4 "một phạm vi một trang"): theo công tắc khung của trang (`ct`) — mọi chỉ số
 * nhận `program`, việc sau thi theo khung lớp; `khungKhac` = số việc Cần bạn quyết ở khung kia (dòng "Lớp thường: n việc ›", không giấu việc).
 * `ct` vắng = gộp hai khung (CX, link cũ). Chờ duyệt giữ mọi khung (hộp dùng chung với Công việc — web ghi "cả hai khung").
 */
/** Một dòng Cần xử lý đã dựng đủ bốn cột (K1-06, Q4, Q24): nhãn trạng thái · việc · Người giữ việc · Hạn · nút đúng việc. */
export type DongCanXuLy = DongCanXuLyGoc & {
  /** Chữ đứng TRƯỚC con số ("Chốt lộ trình · MB FOU 12 ·"). */
  truoc?: string;
  phu: string;
  /** Vế nối sau nhãn ("3 Case chưa có người nhận") — OV-11f (TQ-13): mỗi vế là một chỉ số, số bấm được ra đúng tập. */
  kem?: { metricId: string; n: number; nhan: string }[];
  /** Chú thích khi rê chuột. */
  goiY?: string;
  nguoi: 'ban' | { dau: string; phu: string; ids: number[] };
  han: { ngay: string; loai: 'cap-nhat-pa' | 'viec-van-hanh' | 'chot-len-ft' } | { chu: string; quaHan?: true };
  /** Nút mở thẳng chỗ làm; `null` = nhiều đích → mở panel danh sách của chỉ số. */
  den: string | null;
};

/** G-3: dòng phụ ≤ 60 ký tự — bớt mục cho tới khi vừa, phần còn lại thành "+k lớp". */
function dongPhuGon(muc: string[]): string {
  for (let k = Math.min(2, muc.length); k >= 1; k--) {
    const s = [...muc.slice(0, k), ...(muc.length > k ? [`+${muc.length - k} lớp`] : [])].join(' · ');
    if (s.length <= 60) return s;
    if (k === 1) return `${s.slice(0, 59)}…`;
  }
  return '';
}

const NGAY_MS = 86_400_000;
const soNgay = (tu: string, den: string) => Math.round((Date.parse(`${den.slice(0, 10)}T00:00:00Z`) - Date.parse(`${tu.slice(0, 10)}T00:00:00Z`)) / NGAY_MS);

export function tongQuanQuanLy(p: Principal, f: { branchId?: number | null; ct?: ChuongTrinh | null }) {
  laViecQuanLy(p);
  quetYeuCau();   // PR-DUYET (K5-17)
  const today = demoToday();
  const ct = f.ct ?? null;
  const base = { branchId: f.branchId ?? null, program: ct };
  const cn = `${f.branchId ? `&cn=${f.branchId}` : ''}`;
  const khung = ct ?? 'tat-ca';

  /* CẦN XỬ LÝ — mỗi dòng một chỉ số của sổ. */
  const sets = new Map<MaCanXuLy, ReturnType<typeof metricSet>>();
  const dem: Partial<Record<MaCanXuLy, number>> = {};
  for (const x of CAN_XU_LY) {
    const r = metricSet(p, x.metricId, base);
    sets.set(x.metricId, r);
    dem[x.metricId] = r.n;
  }
  /* Vận hành: tiêu đề + hạn đọc MỘT câu cho cả tập (rowsFor không trả hạn thô). Quá hạn khi có việc đã qua hạn. */
  const vh = sets.get('van-hanh-can-quyet-dinh')!.ids;
  const viecVh = vh.length
    ? db().prepare(`SELECT t.id, t.title, t.due_date, b.name AS cn FROM tasks t LEFT JOIN branches b ON b.id = t.branch_id
        WHERE t.id IN (${vh.map(() => '?').join(',')}) ORDER BY t.due_date IS NULL, t.due_date, t.id`).all(...vh) as any[]
    : [];
  const hanVh: string | null = viecVh.find((t) => t.due_date)?.due_date ?? null;
  const coQuyenDuyet = can(p, PERMISSIONS.CASE_APPROVE, { anyScope: true });
  /* PR-LCb: lớp cần Chốt lộ trình (cùng hàm với chỉ số) — quá hạn khi có lớp đã qua hạn (Chủ nhật trước tuần Final). */
  const lopChotMoi = metricSet(p, 'lop-chua-chot-len-ft', { branchId: base.branchId }).n ? lopChoChotLoTrinh(p, base.branchId, today) : [];
  const lopChot = theoKhung(lopChotMoi, ct);
  const dongs = sapCanXuLy(dem, coQuyenDuyet, {
    'van-hanh-can-quyet-dinh': !!hanVh && hanVh < today, 'lop-chua-chot-len-ft': lopChot.some((l) => !!l.han && l.han < today),
  });

  /* Tên người giữ việc của MỌI dòng GV trễ — một câu (Q4); tập người lấy từ `chiTiet` của chính tập ID. */
  const nguoiIds = [...new Set(dongs.filter((x) => !x.cuaNguoiXem).flatMap((x) => [...(sets.get(x.metricId)!.chiTiet?.values() ?? [])].flatMap((c) => c.nguoi)))];
  const ten = new Map<number, string>(nguoiIds.length
    ? (db().prepare(`SELECT id, full_name FROM users WHERE id IN (${nguoiIds.map(() => '?').join(',')})`).all(...nguoiIds) as any[]).map((u) => [u.id, u.full_name])
    : []);
  const chuaCoHan = { chu: CHUA_CO_HAN };

  const canXuLy: DongCanXuLy[] = dongs.map((x) => {
    const r = sets.get(x.metricId)!;
    if (!x.cuaNguoiXem) {
      const ct = [...(r.chiTiet?.values() ?? [])];
      const ids = [...new Set(ct.flatMap((c) => c.nguoi))];
      const g = nguoiGiuViecChu(ids.map((id) => ten.get(id) ?? `#${id}`));
      /* T18 (PR-LT3, D4): ô Speaking Mock quá hạn — người giữ việc "GV chấm chéo", không phải "chưa phân công". */
      if (ct.some((c) => c.chamCheo)) Object.assign(g, ids.length ? { phu: [g.phu, CHAM_CHEO].filter(Boolean).join(' · ') } : { dau: CHAM_CHEO, phu: '' });
      const nguoi = { ...g, ids };
      if (x.metricId === 'bai-qua-han-nhap-diem') {
        const ngay = ct.flatMap((c) => c.han).map((h) => soNgay(h, today)).filter((n) => n > 0);
        const a = Math.min(...ngay), b = Math.max(...ngay);
        return { ...x, phu: tachTheoLop(r.unit, r.ids), nguoi,
          han: ngay.length ? { chu: a === b ? `quá hạn ${a} ngày` : `quá hạn ${a}–${b} ngày`, quaHan: true as const } : chuaCoHan,
          den: `/cong-viec?nhom=cham-diem&loc=qua-han&khung=${khung}${cn}` };
      }
      /* UX-2 (2): Case chưa chốt PA quá hạn — cùng cách ghi hạn; nút mở danh sách Case của chỉ số (panel, `den` null). */
      if (x.metricId === 'phoi-hop-qua-han' || x.metricId === 'case-xac-dinh-nguyen-nhan-qua-han') {
        const ngay = ct.flatMap((c) => c.han).map((h) => soNgay(h, today)).filter((n) => n > 0);
        const a = Math.min(...ngay), b = Math.max(...ngay);
        return { ...x, phu: tachTheoLop(r.unit, r.ids), nguoi,
          han: ngay.length ? { chu: a === b ? `quá hạn ${a} ngày` : `quá hạn ${a}–${b} ngày`, quaHan: true as const } : chuaCoHan,
          den: x.metricId === 'phoi-hop-qua-han' ? `/cong-viec?loai=phoi_hop_sos&loc=qua-han&khung=${khung}${cn}` : null };
      }
      /* pa-can-cap-nhat: "PA chưa ghi kết quả tuần W4 SEP" — tuần của hạn cũ nhất (Q25); dòng phụ theo khung. */
      const lop = lopCuaTap(r.unit, r.ids);
      const soFt = r.ids.filter((id) => lop.get(id)?.isFt === true).length;
      const soThuong = r.ids.filter((id) => lop.get(id)?.isFt === false).length;
      return { ...x,
        nhan: r.hanCu ? `${x.nhan} ${tuanCuaHanGhiKetQua(r.hanCu, today)}` : x.nhan,
        phu: [soFt ? `Fast Track ${soFt}` : '', soThuong ? `Lớp thường ${soThuong}` : ''].filter(Boolean).join(' · '),
        nguoi, han: r.hanCu ? { ngay: r.hanCu, loai: 'cap-nhat-pa' as const } : chuaCoHan,
        den: `/cong-viec?loai=ghi_ket_qua_pa&loc=qua-han&khung=${khung}${cn}` };   // OV-11f (TQ-2): lọc đúng loại việc, không cả nhóm
    }
    const chung = { nguoi: 'ban' as const, han: chuaCoHan };
    switch (x.metricId) {
      case 'van-hanh-can-quyet-dinh':
        return { ...x, ...chung, phu: dongPhuGon(viecVh.map((t) => [t.title, t.cn].filter(Boolean).join(' · '))),
          han: hanVh ? { ngay: hanVh, loai: 'viec-van-hanh' as const } : chuaCoHan, den: `/cong-viec/van-hanh?hang=can-quyet-dinh${cn}` };
      case 'lop-chua-chot-len-ft': {
        /* PR-LCb (mockup cuối khoá 2 phần 4): một lớp → "Chốt lộ trình · CP ELE 30" + hạn; nhiều lớp → dòng phụ tên lớp, hạn sớm nhất. */
        const lop = lopChot;
        const han = lop.map((l) => l.han).filter((h): h is string => !!h).sort()[0];
        const h = han ? { ngay: han, loai: 'chot-len-ft' as const } : chuaCoHan;
        if (lop.length === 1) return { ...x, ...chung, truoc: `Chốt lộ trình · ${lop[0].code}`, nhan: '', phu: '', han: h, den: `/hoc-vien/lop/${lop[0].classId}?viec=lo-trinh-ca-lop` };
        return { ...x, ...chung, phu: dongPhuGon(lop.map((l) => l.code)), han: h, den: null };
      }
      case 'lop-thieu-gv-mon': {
        /* Q6: dòng phụ "MB BE 06 thiếu W · HD FT 108 thiếu S" — cùng dòng panel (`rowsFor('lop')`); kèm số Case chưa có người nhận (chỉ số giữ). */
        const lop = rowsFor('lop', r.ids);
        const k = metricSet(p, 'case-chua-co-nguoi-phu-trach', base).n;
        /* Q6 vế m: bài quá hạn KHÔNG có người chấm — chỉ số `bai-qua-han-chua-phan-cong` (tập con của `bai-qua-han-nhap-diem`) = hàng "Chưa phân công" bảng GV. */
        const m = metricSet(p, 'bai-qua-han-chua-phan-cong', base).n;
        const kem = [
          ...(k ? [{ metricId: 'case-chua-co-nguoi-phu-trach', n: k, nhan: 'Case chưa có người nhận' }] : []),
          ...(m ? [{ metricId: 'bai-qua-han-chua-phan-cong', n: m, nhan: 'bài chưa có người chấm' }] : []),
        ];
        return { ...x, ...chung, phu: dongPhuGon(lop.map((l) => `${l.title} ${l.sub}`.trim())),
          ...(kem.length ? { kem } : {}), den: lop.length === 1 ? lop[0].href : null };
      }
      default:   // hv-len-ft-chua-ky-vong
        return { ...x, ...chung, phu: tachTheoLop(r.unit, r.ids), den: r.ids.length === 1 ? duongHoSoHocVien(r.ids[0]) : null };
    }
  });

  /*
   * OV-15d "CẦN BẠN QUYẾT" (mockup 3, C23, Q5): Case chưa chốt PA quá hạn — dòng của CHÍNH tập chỉ số (mở Case tại chỗ); Chọn bước tiếp sau thi +
   * Chốt lộ trình (chỉ khi có) — đúng việc `buoc_tiep` / `chot_len_ft` của `/my-work` người xem (cùng hàm, mở panel / trang như Công việc).
   */
  const caseQh = sets.get('case-xac-dinh-nguyen-nhan-qua-han')!;
  /* OV-15h1 (C23): nhãn nhóm của từng Case ("Case trống PA", "PA chờ xác nhận"…) — cùng phân rã của chỉ số Case chưa chốt PA (nhớ trong request). */
  const nhomCase = nhomCaseChuaChot(caseQh.ids, xuLyCaseMany(caseQh.ids, today));
  /* OV-15h1: "Cần bạn quyết" chỉ lấy việc hạn ≤ 7 ngày (hoặc đã qua) — CÙNG ngưỡng thông báo tự động (`toiHan`). Dựng cả hai khung một lần (khungKhac). */
  const sauThiMoi = [
    ...viecBuocTiep(p, { today, branchId: base.branchId }),
    ...lopChotMoi.map((x) => ({
      key: `chotft:${x.classId}`, group: 'chot_len_ft', urgency: !x.han ? 'normal' : x.han < today ? 'overdue' : x.han === today ? 'today' : 'normal',
      classId: x.classId, classCode: x.code, studentName: `Lớp ${x.code}`, tieuDe: `Chốt lộ trình · ${x.code}`, contextLabel: chuViecChotLoTrinh(x),
      due: x.han, href: `/hoc-vien/lop/${x.classId}?viec=lo-trinh-ca-lop`,
    })),
  ].filter((x) => toiHan(x.due, today));
  const canQuyet = {
    caseQuaHan: rowsFor('case', caseQh.ids).map((r) => ({ ...r, nhom: nhomCase.has(r.id) ? NHOM_CASE_CHUA_CHOT_LABEL[nhomCase.get(r.id)!] : null })),   // không `p`: chỉ cần tên em · lớp · người · hạn để hiện, việc làm ở Ngăn Case
    /* Dựng thẳng từ hai hàm nguồn của `/my-work` (không chạy cả `myWork` — Turso): `viecBuocTiep` + `lopChot` đã tính ở trên. */
    sauThi: theoKhung(sauThiMoi, ct),
  };
  const kia = ct === 'ft' ? 'thuong' : ct === 'thuong' ? 'ft' : null;
  const khungKhac = kia && {
    ct: kia, n: metricSet(p, 'case-xac-dinh-nguyen-nhan-qua-han', { ...base, program: kia }).n + theoKhung(sauThiMoi, kia).length,
  };
  /* PR-DUYET (Q8): số của hộp Chờ duyệt — đọc từ hộp, không thêm chỉ số vào sổ. */
  return { canXuLy, canQuyet, khungKhac, choDuyet: demYeuCau(p, { branchId: base.branchId }) };
}

/** SL2: việc / lớp theo khung của LỚP (`classId`); không rõ lớp → ở cả hai khung (không giấu việc). `ct` null = giữ hết. */
function theoKhung<T extends { classId?: number | null }>(ds: T[], ct: ChuongTrinh | null): T[] {
  if (!ct || !ds.length) return ds;
  const lop = lopCuaTap('lop', [...new Set(ds.map((x) => x.classId).filter((x): x is number => !!x))]);
  return ds.filter((x) => { const ft = x.classId ? lop.get(x.classId)?.isFt : null; return ft == null || ft === (ct === 'ft'); });
}

/**
 * ĐIỂM ĐÁNG CHÚ Ý (tầng 3, theo khung) — tách khỏi Cần xử lý (PR-VAI-a Q5) để đổi công tắc chỉ tải lại khối này.
 */
export function diemChuY(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh }): DiemChuY[] {
  laQuanLy(p);
  const base = { branchId: f.branchId ?? null, program: f.ct };
  /* ĐIỂM ĐÁNG CHÚ Ý — ba luật (plan Q6), mỗi ứng viên là một chỉ số có sẵn. */
  const ung: UngVienChuY[] = [];
  /* `hv-duoi-ky-vong-mon` là chỉ số khung Fast Track: 4 kỹ năng đánh giá (MH5). */
  for (const skill of f.ct === 'ft' ? ASSESSED_SKILLS : []) {
    const r = metricSet(p, 'hv-duoi-ky-vong-mon', { ...base, skill });
    ung.push({ loai: 'mon-duoi-ky-vong', metricId: 'hv-duoi-ky-vong-mon', extra: { skill }, tu: r.n,
      mau: r.denominatorIds?.length ?? 0, nhanMon: tenMon(null, skill) });
  }
  /* PR-VAI-a (Q11): lớp thường nói theo CHƯƠNG TRÌNH ("FOU: 5/22 học viên chưa đạt …") — cùng chỉ số, thêm `ctLop`; câu và danh sách một hàm. */
  for (const ctLop of f.ct === 'thuong' ? CT_LOP : []) {
    const r = metricSet(p, 'hv-duoi-ky-vong-mon', { ...base, ctLop });
    if (!r.n) continue;
    /* Tên bài chỉ khi mọi em trong câu cùng một loại bài ở lượt mới nhất; không thì "ở bài gần nhất". */
    const loai = new Set([...latestAttempts(r.ids, 'valid', demoToday()).values()].map((a) => a.kind));
    const tenBai = loai.size === 1 ? ATTEMPT_KIND_SHORT[[...loai][0] as AttemptKind] ?? null : null;
    ung.push({ loai: 'lop-chua-dat', metricId: 'hv-duoi-ky-vong-mon', extra: { ctLop }, tu: r.n, mau: r.denominatorIds?.length ?? 0,
      nhanMon: ctLop === 'PREFOU' ? 'Pre FOU' : ctLop, tenBai });
  }
  const tl = metricSet(p, 'ty-le-co-cai-thien', base);
  ung.push({ loai: 'pa-cai-thien', metricId: 'ty-le-co-cai-thien', tu: tl.numeratorIds?.length ?? 0, mau: tl.n });
  const from = addDays(demoToday(), -30);
  const dh = metricSet(p, 'dung-han-cap-nhat', { ...base, from });
  ung.push({ loai: 'dung-han', metricId: 'dung-han-cap-nhat', extra: { from }, tu: dh.numeratorIds?.length ?? 0, mau: dh.n });
  return chonDiemDangChuY(ung, f.ct);
}

/**
 * LỚP TÔI DẠY — tầng 3 của Tổng quan giáo viên (PR-VAI-a Q12, mockup 23 màn A/C; thay "Học viên cần hỗ trợ"). Một hàng mỗi lớp người xem có
 * phân công HIỆU LỰC HÔM NAY, theo khung. Mỗi cột số là tập của CHÍNH chỉ số trong sổ (`hv-duoi-ky-vong-mon`, `hv-sos-hien-tai`, `case-mo`) chia theo
 * lớp bằng `lopCuaTap` — cùng hàm bộ lọc khung và bảng chi nhánh — nên bấm số (`oLopToiDay`) ra đúng những em tạo nên nó.
 * FT: không cột tuần khoá (FT không giới hạn tuần); lớp thường: không SOS. PR-S6F-b (D10): "Bài chờ chấm / bài quá hạn" đếm BÀI (`baiId`) của
 * chính người xem ở lớp đó — `noDiemCuaGv` (cùng hàm cột "Chưa nhập / Bài quá hạn" hồ sơ GV), bấm số ra cùng tập.
 */
type TapLop = { duoiKyVong: number[]; sos: number[]; caseMo: number[]; baiCho: number[]; baiQuaHan: number[] };
function tinhLopToiDay(p: Principal, ct: 'ft' | 'thuong') {
  const today = demoToday();
  const conn = db();
  const cua = new Map<number, { core: boolean; skills: string[] }>();
  for (const a of p.assignments) {
    if (!activeAt(a, today)) continue;
    const x = cua.get(a.classId) ?? { core: false, skills: [] };
    if (a.isCore) x.core = true;
    if (a.skill && !x.skills.includes(a.skill)) x.skills.push(a.skill);
    cua.set(a.classId, x);
  }
  const ids = [...cua.keys()];
  const lop = ids.length ? (conn.prepare(
    `SELECT c.id, c.code, c.programme_code AS ct, c.is_fast_track AS ft, c.route, c.branch_id,
            (SELECT COUNT(*) FROM enrollments e JOIN students s ON s.id = e.student_id
              WHERE e.class_id = c.id AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')}) AS so_hv
       FROM classes c WHERE c.status = 'active' AND c.id IN (${ids.map(() => '?').join(',')})`,
  ).all(...ids) as any[]) : [];
  const soFt = lop.filter((l) => !!l.ft).length, soThuong = lop.length - soFt;
  const coFt = soFt > 0, coThuong = soThuong > 0;
  const trong = lop.filter((l) => !!l.ft === (ct === 'ft')).sort((a, b) => soSanhLop({ code: a.code }, { code: b.code }));
  const tap = new Map<number, TapLop>(trong.map((l) => [l.id as number, { duoiKyVong: [], sos: [], caseMo: [], baiCho: [], baiQuaHan: [] }]));
  const chia = (metricId: string, cot: keyof TapLop) => {
    const r = metricSet(p, metricId, { program: ct });
    for (const [id, l] of lopCuaTap(r.unit, r.ids)) if (l.classId && tap.has(l.classId)) tap.get(l.classId)![cot].push(id);
  };
  if (trong.length) {
    chia('hv-duoi-ky-vong-mon', 'duoiKyVong');
    if (ct === 'ft') chia('hv-sos-hien-tai', 'sos');
    chia('case-mo', 'caseMo');
    /* OV-13o: GV Speaking — bài S chấm chéo ở lớp mình dạy cũng là "bài chờ chấm" (cùng số với Công việc); chấm chéo không quá hạn (T18). */
    const lopCheo = new Set(ct === 'ft' ? lopFtChoGvSpeaking(p, today) : []);
    for (const o of noDiemCuaGv(p, p.userId, today, trong.map((l) => ({ id: l.id as number, branchId: (l.branch_id ?? null) as number | null })), lopCheo)) {
      const x = tap.get(o.classId)!;
      const id = baiId(o.attemptId, o.skill);
      x.baiCho.push(id);
      if (o.overdue && !o.chamCheo) x.baiQuaHan.push(id);
    }
  }
  return { cua, trong, tap, coFt, coThuong, soFt, soThuong, today };
}

export function lopToiDay(p: Principal, f: { ct: 'ft' | 'thuong' }) {
  const { cua, trong, tap, coFt, coThuong, soFt, soThuong, today } = tinhLopToiDay(p, f.ct);
  const conn = db();
  /* Test kế tiếp — FT: lượt mốc kế tiếp sớm nhất của lớp (`MOC_KE_TIEP_SQL`); lớp thường: mốc Giữa/Cuối khoá kế tiếp của lớp. */
  const keTiep = new Map<number, string>();
  if (trong.length && f.ct === 'ft') {
    for (const r of conn.prepare(
      `SELECT a.class_id, a.attempt_no, rp.week_start FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.kind = 'mock' AND a.class_id IN (${trong.map(() => '?').join(',')}) AND ${MOC_KE_TIEP_SQL('a', 'rp')}
        ORDER BY rp.week_start, a.attempt_no`,
    ).all(...trong.map((l) => l.id), mondayOf(today)) as any[]) {
      if (!keTiep.has(r.class_id)) keTiep.set(r.class_id, `MT${r.attempt_no} · ${tuanLich(r.week_start, today)}`);
    }
  }
  const tienDo = f.ct === 'thuong' && trong.length ? classProgressMany(trong.map((l) => l.id)) : new Map();
  const thu2 = mondayOf(today);
  return {
    ct: f.ct, coFt, coThuong,
    rows: trong.map((l) => {
      const c = cua.get(l.id)!;
      const ten = (k: string) => (f.ct === 'ft' ? tenMon(l.ct, k) : tenMonNgan(l.ct, k));
      const pr = tienDo.get(l.id);
      const moc = pr?.progressWeekStart && pr.progressWeekStart >= thu2 ? `Progress Test · ${tuanLich(pr.progressWeekStart, today)}`
        : pr?.finalWeekStart && pr.finalWeekStart >= thu2 ? `Final Test · ${tuanLich(pr.finalWeekStart, today)}` : null;
      const t = tap.get(l.id)!;
      return {
        classId: l.id as number, code: l.code as string, route: l.route ?? null, ct: l.ct ?? null,
        gvcn: c.core, kyNang: c.skills.map((k) => tenMonNgan(l.ct, k)),
        toiDay: [c.core ? 'GVCN' : null, c.skills.map(ten).join(', ') || null].filter(Boolean).join(' · '),
        tuanHoc: f.ct === 'thuong' && pr?.currentWeek && pr.totalWeeks ? `tuần ${Math.min(pr.currentWeek, pr.totalWeeks)}/${pr.totalWeeks}` : null,
        hocVien: l.so_hv as number,
        duoiKyVong: t.duoiKyVong.length, sos: f.ct === 'ft' ? t.sos.length : null, caseMo: t.caseMo.length,
        baiCho: t.baiCho.length, baiQuaHan: t.baiQuaHan.length,
        testKeTiep: f.ct === 'ft' ? keTiep.get(l.id) ?? null : moc,
        testTuanNay: (f.ct === 'ft' ? keTiep.get(l.id) : moc)?.endsWith(tuanLich(thu2, today)) ?? false,
      };
    }),
  };
}

/**
 * "Thi tháng này" theo lớp của GV — CHÍNH `tapThiThangNayLop` (Tổng quan QL / Báo cáo), phạm vi = lớp GV có phân công hôm nay. GV không có `analysis.view`,
 * nên gọi qua một người xem chỉ mang grant vai giáo viên (`scopeFor` → lớp của `p.assignments`) — không mở thêm dữ liệu ngoài lớp của mình.
 */
function thiThangNayCuaGv(p: Principal, ct: 'ft' | 'thuong') {
  const xem: Principal = { ...p, grants: [{ id: 0, roleKey: 'teacher', roleName: '', branchId: null, branchName: null, permissions: new Set([PERMISSIONS.ANALYSIS_VIEW]) }] };
  return tapThiThangNayLop(xem, { ct });
}

/**
 * SV-TQ-GV (XM-5, mockup `tong-quan.html?k=gv`): Tổng quan GV HAI khối — **Kỹ năng tôi dạy** (lớp có phân công kỹ năng: Đạt kỳ vọng Test · Tiến bộ ·
 * bài chờ chấm · Test sắp tới) và **Lớp tôi chủ nhiệm** (lớp GVCN: Dưới kỳ vọng · SOS · Case đang mở · Thi tháng này). Không đếm lại: hàng lớp = `lopToiDay`
 * (V4, cả hai khung), Đạt / Tiến bộ = `chiSoHoSoGv(...).hocThuatTheoLop` (cùng số hồ sơ GV, kỳ mặc định), Thi tháng này = `tapThiThangNayLop`.
 * Mỗi số bấm được: cột V4 + Thi tháng này → `/tong-quan/lop-toi-day/o`; Đạt / Tiến bộ → `/giao-vien/:id/chi-so/o?cot=ket-qua-lop|tien-bo-lop:<lớp>`.
 */
export function lopToiDayHaiKhoi(p: Principal) {
  const hang = (['ft', 'thuong'] as const).flatMap((khung) => lopToiDay(p, { ct: khung }).rows.map((r) => ({ ...r, khung })));
  /* Lớp chỉ GVCN (không kỹ năng) mà còn bài chờ chấm của tôi vẫn vào khối dạy — không giấu bài. */
  const day = hang.filter((r) => r.kyNang.length || r.baiCho);
  const cs = day.length ? chiSoHoSoGv(p, p.userId, {}) : null;
  const ht = new Map(cs?.hocThuatTheoLop.map((h) => [h.classId, h]) ?? []);
  const cn = hang.filter((r) => r.gvcn);
  const thi = new Map<number, number>();
  for (const khung of ['ft', 'thuong'] as const) {
    if (!cn.some((r) => r.khung === khung)) continue;
    for (const x of thiThangNayCuaGv(p, khung).values()) thi.set(x.lop, (thi.get(x.lop) ?? 0) + 1);
  }
  return {
    ky: cs ? { tu: cs.tu, den: cs.den } : null,
    day: day.map((r) => {
      const h = ht.get(r.classId);
      return {
        classId: r.classId, code: r.code, khung: r.khung, route: r.route, ct: r.ct, kyNang: r.kyNang, tuanHoc: r.tuanHoc,
        testKeTiep: r.testKeTiep, testTuanNay: r.testTuanNay, baiCho: r.baiCho, baiQuaHan: r.baiQuaHan,
        ketQua: h?.ketQua ?? null, tienBo: r.khung === 'ft' ? h?.tienBo ?? null : null,
      };
    }),
    chuNhiem: cn.map((r) => ({
      classId: r.classId, code: r.code, khung: r.khung, route: r.route, ct: r.ct, hocVien: r.hocVien,
      duoiKyVong: r.duoiKyVong, sos: r.sos, caseMo: r.caseMo, thiThangNay: thi.get(r.classId) ?? 0,
    })),
  };
}

/** Một ô của "Lớp tôi dạy" → đúng những em/Case tạo nên số đó (cùng `tinhLopToiDay`). Lớp không dạy → 403. */
export function oLopToiDay(p: Principal, f: { ct: 'ft' | 'thuong'; classId: number; cot: string }) {
  const COT: Record<string, keyof TapLop> = { duoiKyVong: 'duoiKyVong', sos: 'sos', caseMo: 'caseMo', 'bai-cho': 'baiCho', 'bai-qua-han': 'baiQuaHan' };
  const cot = COT[f.cot];
  if (!cot && f.cot !== 'thi-thang-nay') throw badRequest('Cột không hợp lệ.');
  const { trong, tap } = tinhLopToiDay(p, f.ct);
  const l = trong.find((x) => x.id === f.classId);
  if (!l) throw forbidden('Bạn không dạy lớp này.');
  if (!cot) {
    /* SV-TQ-GV: "Thi tháng này" của lớp chủ nhiệm — cùng `thiThangNayCuaGv` với số. */
    const ids = [...thiThangNayCuaGv(p, f.ct)].filter(([, x]) => x.lop === f.classId).map(([s]) => s).sort((a, b) => a - b);
    return { n: ids.length, tieuDe: `${l.code} · ${ids.length} HV thi tháng này`, rows: rowsFor('hoc-vien', ids, undefined, p) };
  }
  const ids = tap.get(f.classId)![cot];
  const unit = cot === 'caseMo' ? 'case' : cot === 'baiCho' || cot === 'baiQuaHan' ? 'bai' : 'hoc-vien';
  const nhan = cot === 'caseMo' ? 'Case đang mở' : cot === 'sos' ? 'học viên có SOS' : cot === 'baiCho' ? 'bài chờ chấm' : cot === 'baiQuaHan' ? 'bài quá hạn chưa nhập điểm'
    : f.ct === 'thuong' ? 'học viên chưa đạt' : 'học viên dưới kỳ vọng';
  return { n: ids.length, tieuDe: `${l.code} · ${ids.length} ${nhan}`, rows: rowsFor(unit, ids, undefined, p) };
}