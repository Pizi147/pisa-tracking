/**
 * XUẤT EXCEL DANH SÁCH HỌC VIÊN (OV-15f, C31, mockup 5 khung 2) — "lọc ở đâu, xuất ở đó".
 *
 * Nhận ĐÚNG danh sách em web đang hiện theo bộ lọc của trang (nên số em trong nút = số trong tệp) — máy chủ KIỂM QUYỀN XEM từng em (một em ngoài
 * phạm vi → 403, không âm thầm bỏ), rồi dựng chữ từ cùng nguồn trang dùng. Cột SOS (mức · tạm / chính thức · MT · kỹ năng) = "SOS hiện tại" của từng em
 * trong tệp (`latestAttempts`, cùng hàm Đang SOS — SL2), kể cả lớp thường.
 * Kết quả gần nhất / điểm: `standingFor` + `loadBundle`; Case / PA: `listCases` CHỈ của các em trong tệp (`studentIds`) + `tomTatCase`; lịch thi: `examPlanOf`
 * + cột `lich_thi_*`. Một hàng một em (em học hai lớp: cột Lớp ghi cả hai). `xemTruoc` không ghi nhật ký.
 * Dòng đọc: mỗi lô ≤ 900 em một câu em + lớp, một câu lộ trình; `standingFor` chỉ khi có cột điểm / kết quả / MT; `latestAttempts` chỉ khi có cột SOS.
 */
import { db, theoLo } from '../db.ts';
import {
  ATTEMPT_KIND_SHORT, MAU_XUAT_DS, PERMISSIONS, vaiXemHocVien, ketLuanHienTai, bangThongTinXuatDs, bangXuatDanhSach, chuTep, chuoiLop, cotXuatDs, ketQuaLuot, tuanNam, nhanLichThi, trangThaiLichThi,
  type AttemptKind, type HvXuatDs, type MauXuatDs,
} from '../../../shared/domain/index.ts';
import { gioVn } from '../../../shared/domain/xuatMt.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, forbidden, nowIso } from '../util.ts';
import { can, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { standingFor } from '../students/standing.ts';
import { examPlanOf } from '../fasttrack/cycles.ts';
import { loadBundle, resultOf } from '../fasttrack/attempts.ts';
import { lopTheoLoTrinh } from '../keHoach/keHoachTest.ts';
import { listCases } from '../cases/cases.ts';
import { COT_LICH_THI_SQL, luuTuCot } from './lichThi.ts';
import { latestAttempts } from '../worklist/danhGia.ts';
import { tomTatCase } from './hocVienSos.ts';

const TOI_DA = 5000;
const KET_LUAN_NHAN: Record<string, string> = { 'giu-thang': 'Giữ tháng', 'chot-ngay': 'Chốt ngày', 'chuyen-thang': 'Chuyển tháng', 'can-xac-nhan': 'Cần xác nhận' };
const KY_HIEU: Record<string, string> = { listening: 'L', reading: 'R', writing: 'W', writing1: 'W', writing2: 'W', speaking: 'S' };

export function xuatDanhSach(
  p: Principal, i: { ids: number[]; mau: unknown; cot: unknown; boLoc: unknown; pham: unknown; xemTruoc: boolean; sos?: unknown },
  luc = nowIso(),
) {
  const mau = MAU_XUAT_DS.find((m) => m === i.mau);
  if (!mau) throw badRequest('Chọn mẫu cột.');
  const ids = [...new Set(i.ids)];
  if (!ids.length) throw badRequest('Không có học viên phù hợp để xuất.');
  if (ids.length > TOI_DA) throw badRequest(`Xuất tối đa ${TOI_DA} học viên một lần — thu hẹp bộ lọc.`);
  const pham: 'loc' | 'chon' = i.pham === 'chon' ? 'chon' : 'loc';
  const cot = cotXuatDs(mau as MauXuatDs, i.cot);
  const dieuKien = String(i.boLoc ?? '').trim().slice(0, 300) || 'Không lọc';
  const conn = db();
  const homNay = demoToday();   // LT-SV: một lần cho cả tệp (đọc cấu hình là một câu SQL)

  /* Em + lớp đang học (đủ lớp, theo thứ tự vào lớp) + lộ trình đang chạy. */
  const hs = new Map<number, any>();
  const lopHienTai = new Map<number, { code: string; coSo: string | null; branchId: number | null; classId: number; dang: boolean }[]>();
  theoLo(ids, (lo, ph) => {
    for (const s of conn.prepare(
      `SELECT s.id, s.full_name, s.email, cy.id AS cycle_id, cy.target_score, cy.khong_cam_ket, cy.exam_month, cy.exam_date, cy.thi_that_ngay, cy.exam_period_id,
              rp.week_start AS exam_week_start, rp.code AS exam_week_code, ${COT_LICH_THI_SQL}
         FROM students s LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
         LEFT JOIN report_periods rp ON rp.id = cy.exam_period_id LEFT JOIN users gu ON gu.id = cy.lich_thi_ghi_chu_boi WHERE s.id IN (${ph})`).all(...lo) as any[]) hs.set(s.id, s);
    for (const e of conn.prepare(
      `SELECT e.student_id, e.status, c.id AS class_id, c.code, c.branch_id, b.name AS co_so FROM enrollments e JOIN classes c ON c.id = e.class_id
         LEFT JOIN branches b ON b.id = c.branch_id WHERE e.student_id IN (${ph}) AND e.status IN ('active', 'completed') ORDER BY e.id`).all(...lo) as any[]) {
      const d = lopHienTai.get(e.student_id) ?? [];
      const x = { code: e.code, coSo: e.co_so, branchId: e.branch_id, classId: e.class_id, dang: e.status === 'active' };
      /* Có lớp đang học thì chỉ lấy các lớp đang học; em đã kết thúc thì lấy lớp cuối. */
      lopHienTai.set(e.student_id, x.dang ? [...d.filter((y) => y.dang), x] : d.some((y) => y.dang) ? d : [x]);
    }
  });
  /* Quyền xem kiểm theo LỚP (một lần mỗi lớp, không 2 câu mỗi em); em không có lớp nào thì kiểm theo em. Một em ngoài phạm vi → 403, không âm thầm bỏ. */
  const xemLop = new Map<number, boolean>();
  const xemDuoc = (id: number) => {
    const ds = lopHienTai.get(id);
    if (!ds?.length) return can(p, PERMISSIONS.STUDENT_VIEW, { studentId: id });
    return ds.some((x) => { if (!xemLop.has(x.classId)) xemLop.set(x.classId, can(p, PERMISSIONS.STUDENT_VIEW, { classId: x.classId })); return xemLop.get(x.classId)!; });
  };
  if (ids.some((id) => !hs.has(id) || !xemDuoc(id))) throw forbidden('Có học viên nằm ngoài phạm vi bạn được xuất.');
  const coCot = (k: string) => (cot as string[]).includes(k);
  /*
   * SOS: "SOS hiện tại" (SL2, 9.1-4) — CHÍNH hàm dưới `hv-sos-hien-tai` / Đang SOS (`latestAttempts` 'valid': đợt mới nhất hợp lệ, gồm tạm), chỉ cho
   * các em trong tệp (không tính cả chi nhánh). Người không theo dõi Case (Admin) không có Đang SOS → cột để trống, như trước.
   */
  const nguonSos = coCot('sos') || coCot('tamChinh') || coCot('kyNang');
  const sosCua = new Map<number, { sosLevel: number; tam: boolean; luot: string; tuan: string; kyNang: string[] }>();
  if (nguonSos && vaiXemHocVien(p.roleKeys) !== 'admin' && can(p, PERMISSIONS.CASE_VIEW, { anyScope: true })) {
    for (const [id, a] of latestAttempts(ids, 'valid', demoToday())) {
      if ((a.sosLevel ?? 0) <= 0) continue;
      sosCua.set(id, {
        sosLevel: Math.min(3, a.sosLevel!), tam: a.provisional, tuan: a.weekStart ?? '',
        luot: a.kind === 'mock' ? `MT${a.attemptNo}` : ATTEMPT_KIND_SHORT[a.kind as AttemptKind] ?? a.kind,
        kyNang: Object.entries(a.skills).filter(([, x]) => x.evaluable && x.under).map(([k]) => k),
      });
    }
  }
  const standing = coCot('diem') || coCot('ketQua') || coCot('tuanThi') || (coCot('mt') && !nguonSos) ? standingFor(ids) : standingFor([]);
  const cycleIds = [...hs.values()].map((s) => s.cycle_id).filter((x): x is number => !!x);
  const lopLoTrinh = lopTheoLoTrinh(cycleIds, p);   // rà #484: không in mã lớp ngoài phạm vi người xuất

  /* Điểm lượt gần nhất (Mock): một lần `loadBundle` cho cả lô. */
  const luotIds = [...standing.values()].filter((s) => s.attemptKind === 'mock' && s.attemptId).map((s) => s.attemptId as number);
  const luotRow = new Map<number, any>();
  theoLo([...new Set(luotIds)], (lo, ph) => { for (const a of conn.prepare(`SELECT * FROM assessment_attempts WHERE id IN (${ph})`).all(...lo) as any[]) luotRow.set(a.id, a); });
  const bundle = luotRow.size && (coCot('diem') || coCot('ketQua') || coCot('tuanThi')) ? loadBundle([...luotRow.keys()]) : null;

  /* GVCN (Người phụ trách) và Case / PA — chỉ đọc khi tệp có cột đó. */
  const gvcn = new Map<number, string>();
  if (coCot('phuTrach')) {
    const lopIds = [...new Set([...lopHienTai.values()].flat().map((x) => x.classId))];
    theoLo(lopIds, (lo, ph) => {
      for (const g of conn.prepare(
        `SELECT ta.class_id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
          WHERE ta.class_id IN (${ph}) AND ta.is_core = 1 AND ta.status = 'active' ORDER BY ta.id`).all(...lo) as any[]) if (!gvcn.has(g.class_id)) gvcn.set(g.class_id, g.full_name);
    });
  }
  const caseCua = new Map<number, { caseTt: string; paTt: string }>();
  if (coCot('caseTt') || coCot('paTt')) {
    const mo: ReturnType<typeof listCases>['rows'] = [];
    for (let k = 0; k < ids.length; k += 500) mo.push(...listCases(p, { studentIds: ids.slice(k, k + 500) }).rows.filter((c) => c.studentId !== null && c.status !== 'done'));
    const tt = tomTatCase(mo);
    for (const c of mo) {
      const x = tt.get(c.id);
      if (!x) continue;
      const cu = caseCua.get(c.studentId!) ?? { caseTt: '', paTt: '' };
      const nhan = x.kyNang ? `${x.kyNang}: ` : '';
      caseCua.set(c.studentId!, {
        caseTt: [cu.caseTt, `${nhan}${x.trangThai}`].filter(Boolean).join('; '),
        paTt: [cu.paTt, ...x.pa.map((a) => `${nhan}${a.ten}${a.choXacNhan ? ' (chờ xác nhận)' : a.xong ? ' (xong)' : ''}`)].filter(Boolean).join('; '),
      });
    }
  }

  const hv: HvXuatDs[] = ids.map((id) => {
    const s = hs.get(id);
    const ds = lopHienTai.get(id) ?? [];
    const st = standing.get(id) ?? null;
    const a = st?.attemptId ? luotRow.get(st.attemptId) : null;
    const r = a && bundle ? resultOf(a, bundle.scores.get(a.id) ?? [], bundle.skips.get(a.id) ?? [], bundle.skillRows.get(a.id) ?? []) : null;
    const diemW = (k: string) => (bundle && a ? (bundle.scores.get(a.id) ?? []).find((x: any) => x.skill === k)?.band ?? null : null);
    const tuan = a && bundle
      ? (bundle.skillRows.get(a.id) ?? []).filter((x: any) => x.required && x.week_start).map((x: any) => String(x.week_start).slice(0, 10)).sort()[0] ?? null : null;
    const sc = sosCua.get(id);
    const k = (sc?.kyNang ?? []).map((x) => KY_HIEU[x] ?? x);
    const luu = luuTuCot(s);
    const plan = examPlanOf(s);
    const target = s?.target_score != null ? `${s.target_score}${s.khong_cam_ket ? ' KCK' : ''}` : s?.khong_cam_ket ? 'KCK' : null;
    return {
      ten: s?.full_name ?? '', gmail: s?.email ?? null,
      lop: chuoiLop([...(s?.cycle_id ? lopLoTrinh.get(s.cycle_id) ?? [] : []), ...ds.map((x) => x.code)]),
      coSo: [...new Set(ds.map((x) => x.coSo).filter(Boolean))].join(', ') || null,
      sos: sc ? `SOS ${sc.sosLevel}` : null, tamChinh: sc ? (sc.tam ? 'Tạm' : 'Chính thức') : null,
      mt: nguonSos ? sc?.luot ?? null : st?.attemptLabel ?? null, kyNang: k.length ? [...new Set(k)].join(', ') : null,
      caseTt: caseCua.get(id)?.caseTt || null, paTt: caseCua.get(id)?.paTt || null,
      phuTrach: ds.map((x) => gvcn.get(x.classId)).find(Boolean) ?? null,
      diem: { OVR: r?.overall ?? null, L: r?.bands.listening ?? null, R: r?.bands.reading ?? null, W1: diemW('writing1'), W2: diemW('writing2'), S: r?.bands.speaking ?? null },
      target, lichThi: plan.confidence === 'none' && !s?.exam_date ? null : /* LT-SV: một hàm nhãn */ nhanLichThi(trangThaiLichThi(s, plan, homNay), homNay, true), tuanThi: tuan ? tuanNam(tuan) : null,
      ketQua: r ? ketQuaLuot({ ovr: r.overall, kyVong: r.expectation, danhGiaDuoc: r.evaluable }) : null,
      ketLuan: KET_LUAN_NHAN[ketLuanHienTai({ coNgay: !!s?.exam_date, thangDuKien: plan.month, luu }) ?? ''] ?? null,
      ghiChuHop: luu?.ghiChu ?? null,
    };
  });
  hv.sort((x, y) => x.lop.localeCompare(y.lop, 'vi', { numeric: true }) || x.ten.localeCompare(y.ten, 'vi'));
  const ngayTep = demoToday();
  const nhanTep = chuTep(dieuKien.split(' · ')[0] || 'DS', '');
  const sheets = [
    { ten: 'Danh sách', aoa: bangXuatDanhSach(hv, cot) },
    { ten: 'Thông tin xuất', aoa: bangThongTinXuatDs({ dieuKien, luc: gioVn(luc), pham, soHv: hv.length, mau: mau as MauXuatDs, soCot: cot.length, nguoi: p.fullName }) },
  ];
  if (!i.xemTruoc) {
    writeAudit({ actorUserId: p.userId, action: 'hoc_vien.xuat_excel', entityType: 'xuat_hoc_vien', entityLabel: `${hv.length} học viên · ${dieuKien}`, after: { mau, cot, pham, soHv: hv.length } });
  }
  return { sheets, tenTep: `PISA_HV_${nhanTep}_${ngayTep}.xlsx`, dem: { hocVien: hv.length }, dieuKien };
}
