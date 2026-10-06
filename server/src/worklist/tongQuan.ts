import { db } from '../db.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import {
  ASSESSED_SKILLS, ATTEMPT_KIND_SHORT, CAN_XU_LY, CHAM_CHEO, CHUA_CO_HAN, baiId, MOC_KE_TIEP_SQL, PERMISSIONS, type AttemptKind, tenMon, tenMonNgan, chonDiemDangChuY, sapCanXuLy,
  duongHoSoHocVien, nguoiGiuViecChu, soSanhLop, tuanCuaHanGhiKetQua, tuanLich,
  type ChuongTrinh, type DiemChuY, type DongCanXuLyGoc, type MaCanXuLy, type UngVienChuY,
} from '../../../shared/domain/index.ts';
import { lopChoLenhChuyen } from '../classes/lenhChuyen.ts';
import { lopChoChotLenFt } from '../fasttrack/mt0.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, badRequest, forbidden } from '../util.ts';
import { activeAt, can, scopeFor, type Principal } from '../permissions.ts';
import { latestAttempts } from './danhGia.ts';
import { classProgressMany } from '../classes/schedule.ts';
import { mondayOf } from '../platform/week.ts';
import { CT_LOP, metricSet, rowsFor } from './metrics.ts';
import { lopCuaTap, tachTheoLop } from './chuongTrinh.ts';
import { demYeuCau, quetYeuCau } from '../duyet/yeuCau.ts';
import { noDiemCuaGv } from '../giaoVien/hoSo.ts';

/**
 * TỔNG QUAN (PR-Pa, đặc tả §3.2). File này KHÔNG ĐẾM gì: mọi số lấy từ `metricSet` (hợp đồng số liệu luật 1), ở đây chỉ
 * chọn chỉ số nào lên khối nào, xếp thứ tự và viết dòng phụ.
 */

const laQuanLy = (p: Principal) => {
  if (scopeFor(p, PERMISSIONS.MEETING_VIEW).none) throw forbidden('Khối này dành cho Quản lý.');
};

/**
 * TẦNG 1 CỦA QUẢN LÝ (PR-VAI-a Q5): Cần xử lý + dải Chờ duyệt — LUÔN GỘP HAI KHUNG (không nhận `ct`, không truyền `program`), nên đổi
 * công tắc Fast Track · Lớp thường ở phần Số liệu không làm số ở đây đổi.
 */
/** Một dòng Cần xử lý đã dựng đủ bốn cột (K1-06, Q4, Q24): nhãn trạng thái · việc · Người giữ việc · Hạn · nút đúng việc. */
export type DongCanXuLy = DongCanXuLyGoc & {
  /** Chữ đứng TRƯỚC con số ("Chuyển tiếp lớp · MB FOU 12 ·"). */
  truoc?: string;
  phu: string;
  /** Vế nối sau nhãn ("3 Case chưa có người nhận"). */
  kem?: string;
  /** Chú thích khi rê chuột (Q9: "Lộ trình RF: xong MT2"). */
  goiY?: string;
  nguoi: 'ban' | { dau: string; phu: string; ids: number[] };
  han: { ngay: string; loai: 'cap-nhat-pa' | 'viec-van-hanh' } | { chu: string; quaHan?: true };
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

export function tongQuanQuanLy(p: Principal, f: { branchId?: number | null }) {
  laQuanLy(p);
  quetYeuCau();   // PR-DUYET (K5-17)
  const today = demoToday();
  const base = { branchId: f.branchId ?? null };
  const cn = f.branchId ? `&cn=${f.branchId}` : '';

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
  /* Q8b + Q24: lớp hết khoá còn em chưa có lệnh — cùng hàm với chỉ số; hạn "trước {tuần sau tuần kết thúc}" đã qua → dòng Quá hạn (như Vận hành). */
  const lopLenh = dem['hv-chua-co-lenh-chuyen'] ? lopChoLenhChuyen(p, base.branchId, today) : [];
  const ketThuc = lopLenh.map((l) => l.moc.tuanKetThuc).filter((w): w is string => !!w).sort()[0] ?? null;
  const lenhQuaHan = !!ketThuc && addDays(ketThuc, 7) <= today;
  /* PR-MT0: lớp cần Chốt lên FT — quá hạn khi hạn sớm nhất đã qua. */
  const lopChot = dem['lop-chua-chot-len-ft'] ? lopChoChotLenFt(p, base.branchId, today) : [];
  const dongs = sapCanXuLy(dem, coQuyenDuyet, {
    'van-hanh-can-quyet-dinh': !!hanVh && hanVh < today, 'hv-chua-co-lenh-chuyen': lenhQuaHan, 'lop-chua-chot-len-ft': lopChot.some((l) => l.han < today),
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
          den: `/cong-viec?nhom=cham-diem&loc=qua-han&khung=tat-ca${cn}` };
      }
      /* pa-can-cap-nhat: "PA chưa ghi kết quả tuần W4 SEP" — tuần của hạn cũ nhất (Q25); dòng phụ theo khung. */
      const lop = lopCuaTap(r.unit, r.ids);
      const soFt = r.ids.filter((id) => lop.get(id)?.isFt === true).length;
      const soThuong = r.ids.filter((id) => lop.get(id)?.isFt === false).length;
      return { ...x,
        nhan: r.hanCu ? `${x.nhan} ${tuanCuaHanGhiKetQua(r.hanCu, today)}` : x.nhan,
        phu: [soFt ? `Fast Track ${soFt}` : '', soThuong ? `Lớp thường ${soThuong}` : ''].filter(Boolean).join(' · '),
        nguoi, han: r.hanCu ? { ngay: r.hanCu, loai: 'cap-nhat-pa' as const } : chuaCoHan,
        den: `/cong-viec?nhom=case-hoc-thuat&loc=qua-han&khung=tat-ca${cn}` };
    }
    const chung = { nguoi: 'ban' as const, han: chuaCoHan };
    switch (x.metricId) {
      case 'van-hanh-can-quyet-dinh':
        return { ...x, ...chung, phu: dongPhuGon(viecVh.map((t) => [t.title, t.cn].filter(Boolean).join(' · '))),
          han: hanVh ? { ngay: hanVh, loai: 'viec-van-hanh' as const } : chuaCoHan, den: `/cong-viec/van-hanh?hang=can-quyet-dinh${cn}` };
      case 'hv-chua-co-lenh-chuyen': {
        const lop = lopLenh;
        const han = !ketThuc ? chuaCoHan
          : lenhQuaHan ? { chu: `quá hạn từ ${tuanLich(addDays(ketThuc, 7), today)}`, quaHan: true as const }
          : { chu: `trước ${tuanLich(addDays(ketThuc, 7), today)}` };
        if (lop.length === 1) {
          return { ...x, ...chung, truoc: `Chuyển tiếp lớp · ${lop[0].code} ·`, nhan: 'em chưa có quyết định chuyển lớp',
            phu: ketThuc ? `Lớp kết thúc ${tuanLich(ketThuc, today)}` : '', han, den: `/hoc-vien/lop/${lop[0].classId}?viec=chuyen-tiep` };
        }
        return { ...x, ...chung, truoc: `${lop.length} lớp ·`, phu: tachTheoLop(r.unit, r.ids), han, den: null };
      }
      case 'lop-chua-chot-len-ft': {
        /* PR-MT0 (mockup ③): một lớp → "Chốt lên FT · BE 04" + hạn; nhiều lớp → dòng phụ tên lớp, hạn sớm nhất. */
        const lop = lopChot;
        const han = lop.map((l) => l.han).sort()[0];
        const h = han ? { ngay: han, loai: 'viec-van-hanh' as const } : chuaCoHan;
        if (lop.length === 1) return { ...x, ...chung, truoc: `Chốt lên FT · ${lop[0].code}`, nhan: '', phu: '', han: h, den: `/hoc-vien/lop/${lop[0].classId}?viec=lo-trinh-tiep` };
        return { ...x, ...chung, phu: dongPhuGon(lop.map((l) => l.code)), han: h, den: null };
      }
      case 'lop-thieu-gv-mon': {
        /* Q6: dòng phụ "MB BE 06 thiếu W · HD FT 108 thiếu S" — cùng dòng panel (`rowsFor('lop')`); kèm số Case chưa có người nhận (chỉ số giữ). */
        const lop = rowsFor('lop', r.ids);
        const k = metricSet(p, 'case-chua-co-nguoi-phu-trach', base).n;
        /* Q6 vế m: bài quá hạn KHÔNG có người chấm — cùng tập `bai-qua-han-nhap-diem` (ô chưa phân công không có người trong `chiTiet`) = hàng "Chưa phân công" bảng GV. */
        const bai = sets.get('bai-qua-han-nhap-diem')!;
        const m = bai.ids.filter((id) => !bai.chiTiet?.get(id)?.nguoi.length && !bai.chiTiet?.get(id)?.chamCheo).length;
        const kem = [k ? `${k} Case chưa có người nhận` : '', m ? `${m} bài chưa có người chấm` : ''].filter(Boolean).join(' · ');
        return { ...x, ...chung, phu: dongPhuGon(lop.map((l) => `${l.title} ${l.sub}`.trim())),
          ...(kem ? { kem } : {}), den: lop.length === 1 ? lop[0].href : null };
      }
      case 'hv-ft-xong-mt-cuoi-chua-mt-ke': {
        const lop = [...new Set([...lopCuaTap(r.unit, r.ids).values()].map((l) => l.classId).filter((id): id is number => !!id))];
        return { ...x, ...chung, phu: tachTheoLop(r.unit, r.ids), goiY: 'Lộ trình RF: xong MT2',
          den: lop.length === 1 ? `/test/ke-hoach?classId=${lop[0]}` : null };
      }
      default:   // hv-len-ft-chua-ky-vong
        return { ...x, ...chung, phu: tachTheoLop(r.unit, r.ids), den: r.ids.length === 1 ? duongHoSoHocVien(r.ids[0]) : null };
    }
  });

  /* PR-DUYET (Q8): số của hộp Chờ duyệt — đọc từ hộp, không thêm chỉ số vào sổ. */
  return { canXuLy, choDuyet: demYeuCau(p, { branchId: base.branchId }) };
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
    for (const o of noDiemCuaGv(p, p.userId, today, trong.map((l) => ({ id: l.id as number, branchId: (l.branch_id ?? null) as number | null })))) {
      const x = tap.get(o.classId)!;
      const id = baiId(o.attemptId, o.skill);
      x.baiCho.push(id);
      if (o.overdue) x.baiQuaHan.push(id);
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
      const moc = pr?.progressWeekStart && pr.progressWeekStart >= thu2 ? `Giữa khoá · ${tuanLich(pr.progressWeekStart, today)}`
        : pr?.finalWeekStart && pr.finalWeekStart >= thu2 ? `Cuối khoá · ${tuanLich(pr.finalWeekStart, today)}` : null;
      const t = tap.get(l.id)!;
      return {
        classId: l.id as number, code: l.code as string, route: l.route ?? null, ct: l.ct ?? null,
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

/** Một ô của "Lớp tôi dạy" → đúng những em/Case tạo nên số đó (cùng `tinhLopToiDay`). Lớp không dạy → 403. */
export function oLopToiDay(p: Principal, f: { ct: 'ft' | 'thuong'; classId: number; cot: string }) {
  const COT: Record<string, keyof TapLop> = { duoiKyVong: 'duoiKyVong', sos: 'sos', caseMo: 'caseMo', 'bai-cho': 'baiCho', 'bai-qua-han': 'baiQuaHan' };
  const cot = COT[f.cot];
  if (!cot) throw badRequest('Cột không hợp lệ.');
  const { trong, tap } = tinhLopToiDay(p, f.ct);
  const l = trong.find((x) => x.id === f.classId);
  if (!l) throw forbidden('Bạn không dạy lớp này.');
  const ids = tap.get(f.classId)![cot];
  const unit = cot === 'caseMo' ? 'case' : cot === 'baiCho' || cot === 'baiQuaHan' ? 'bai' : 'hoc-vien';
  const nhan = cot === 'caseMo' ? 'Case đang mở' : cot === 'sos' ? 'học viên có SOS' : cot === 'baiCho' ? 'bài chờ chấm' : cot === 'baiQuaHan' ? 'bài quá hạn chưa nhập điểm'
    : f.ct === 'thuong' ? 'học viên chưa đạt' : 'học viên dưới kỳ vọng';
  return { n: ids.length, tieuDe: `${l.code} · ${ids.length} ${nhan}`, rows: rowsFor(unit, ids) };
}