import { db, theoLo } from '../db.ts';
import { ATTEMPT_KIND_SHORT, PERMISSIONS, emCuaViec, tachBaiId, tenMonNgan, tuanLich, vietMaLuot, type AttemptKind, type ChuongTrinh } from '../../../shared/domain/index.ts';
import { t } from '../../../shared/i18n/index.ts';
import { forbidden } from '../util.ts';
import { assessedSkillOf } from '../fasttrack/scoring.ts';
import { scopeFor, scoreEditPath, type Principal } from '../permissions.ts';
import { myWork } from './mywork.ts';
import { phamViXemViec } from './xemViec.ts';
import { viecQuaHanAdmin } from './tongQuanMt.ts';
import { treCham } from './tongQuanQl.ts';

/** Một dòng lớp · lượt · kỹ năng của panel — đủ để mở view "em còn trống" (lưới `diem-theo-luot`) và lưới Nhập hộ. */
export type DongGvTre = {
  key: string; classId: number | null; lop: string | null;
  /** Mã lượt của lưới (`mt:2`, `cp:1`, `thuong:final`); `luotChu` = "MT2"; `tuan` = tuần thi (thứ Hai). */
  luot: string | null; luotChu: string; tuan: string | null; periodId: number | null;
  kns: string[]; knChu: string; soBai: number; han: string | null; em: number[];
  /** Q5: người xem nhập hộ được (cùng `scoreEditPath` máy chủ kiểm khi lưu). */
  nhapHo: boolean;
};
/** `gvId`: id GV · 0 = chưa có GV (lớp chưa phân công) · -1 = Speaking chấm chéo (chỉ panel QL, như `treCham`). */
export type NhomGvTre = { gvId: number; ten: string; soBai: number; dong: DongGvTre[] };
export type PanelGvTre = { /** Phạm vi ở đầu panel (V11): tên chi nhánh; null = mọi chi nhánh trong quyền. */ chiNhanh: string | null; soGv: number; soBai: number; soBaiChuaCoGv: number; /** Admin (Q12): S chấm chéo chưa ai nhận — chờ chấm, không quá hạn. */ choCham: number; nhom: NhomGvTre[] };

const nhapHoDuoc = (p: Principal, classId: number | null, kns: readonly string[]) => !!classId && kns.some((k) => scoreEditPath(p, classId, k) !== null);
const ctCuaLop = (ids: number[]) => {
  const m = new Map<number, string | null>();
  theoLo([...new Set(ids)], (lo, ph) => {
    for (const r of db().prepare(`SELECT id, programme_code FROM classes WHERE id IN (${ph})`).all(...lo) as any[]) m.set(r.id, r.programme_code ?? null);
  });
  return m;
};
const monChu = (ct: string | null | undefined, kns: readonly string[]) => [...new Set(kns.map((k) => tenMonNgan(ct ?? null, k)))].join(', ');
/** Cột theo thứ tự lưới (L · R · W1 · W2 · S), môn lớp thường giữ thứ tự gặp. */
const MON = ['listening', 'reading', 'writing', 'writing1', 'writing2', 'speaking'];
const xepMon = (kns: string[]) => kns.sort((a, b) => (MON.includes(a) ? MON.indexOf(a) : MON.length) - (MON.includes(b) ? MON.indexOf(b) : MON.length));
/** Nhóm GV nhiều bài trước, rồi tên; "Chưa có GV" cuối. Trong nhóm: quá hạn lâu nhất (hạn sớm nhất) lên đầu. */
const xep = (nhom: NhomGvTre[]) => {
  for (const g of nhom) g.dong.sort((a, b) => (a.han ?? '').localeCompare(b.han ?? '') || (a.lop ?? '').localeCompare(b.lop ?? ''));
  return nhom.sort((a, b) => Number(a.gvId === 0) - Number(b.gvId === 0) || b.soBai - a.soBai || a.ten.localeCompare(b.ten, 'vi'));
};

/**
 * PANEL "GV CHẤM QUÁ HẠN" (M6 6b-4, mockup `thiet-ke/v7/panel-pilot.html` khu ③) — ai · lớp · bài · quá hạn bao lâu · ai xử lý.
 * Q8 (chủ SP 27/10): mỗi vai giữ hàm đếm của mình, không đổi số —
 *  · không `gv` (Admin, Tổng quan › Mock Test): CHÍNH các việc Chấm điểm quá hạn của `myWork` mà khối "GV chấm quá hạn" đọc (`viecQuaHanAdmin`);
 *    nhóm GV = số "n giáo viên" của khối, Σ bài = ô "n quá hạn";
 *  · `gv` (QL, cột "Quá hạn" bảng GV cần chú ý): CHÍNH tập bài của GV đó trong `treCham`, gom lớp · lượt · kỹ năng; Σ bài = số ô "⚠ n".
 */
export function gvTre(p: Principal, f: { branchId?: number | null; ct?: ChuongTrinh; gv?: number }): PanelGvTre {
  const branchId = f.branchId ?? null;
  /* Không chọn chi nhánh mà quyền chỉ một chi nhánh (Admin, QL một nơi) → vẫn ghi tên chi nhánh đó, không "Mọi chi nhánh". */
  const sc = scopeFor(p, PERMISSIONS.WORK_VIEW);
  const mot = branchId ?? (!sc.all && sc.branchIds.length === 1 ? sc.branchIds[0] : null);
  const chiNhanh = mot ? ((db().prepare('SELECT name FROM branches WHERE id = ?').get(mot) as any)?.name ?? null) : null;
  if (f.gv === undefined) {
    if (phamViXemViec(p) !== 'cham-diem') throw forbidden('Khối Mock Test chỉ dành cho Admin.');
    const w = myWork(p, { branchId, nguoi: 'tat-ca' }) as any;
    const { quaHan, choCham } = viecQuaHanAdmin(w.items ?? []);
    const ct = ctCuaLop(quaHan.map((it) => it.classId).filter(Boolean));
    const nhom = new Map<number, NhomGvTre>();
    for (const it of quaHan) {
      const gvId = it.ownerId ?? 0;
      const g = nhom.get(gvId) ?? nhom.set(gvId, { gvId, ten: gvId ? it.owner ?? '' : t('Chưa có GV'), soBai: 0, dong: [] }).get(gvId)!;
      const kns = xepMon([...(it.kns ?? (it.kn ? [it.kn] : []))]);
      const tuan = it.tuanThi ?? null;
      g.soBai += it.soBai ?? 0;
      g.dong.push({
        key: it.key, classId: it.classId ?? null, lop: it.classCode ?? null, luot: it.luot ?? null,
        /* `contextLabel` của việc = "MT2 W1 SEP" — tuần tách riêng (`tuan`). */
        luotChu: tuan ? String(it.contextLabel ?? '').replace(` ${tuanLich(tuan)}`, '') : it.contextLabel ?? '', tuan, periodId: it.periodId ?? null,
        kns, knChu: monChu(ct.get(it.classId), kns), soBai: it.soBai ?? 0, han: it.due ?? null, em: [...(emCuaViec(it) ?? [])],
        nhapHo: nhapHoDuoc(p, it.classId ?? null, kns),
      });
    }
    const ds = xep([...nhom.values()]);
    const co = ds.filter((g) => g.gvId > 0);
    return {
      chiNhanh, soGv: co.length, soBai: co.reduce((n, g) => n + g.soBai, 0), soBaiChuaCoGv: ds.filter((g) => g.gvId === 0).reduce((n, g) => n + g.soBai, 0),
      choCham: choCham.reduce((n, it) => n + (it.soBai ?? 0), 0), nhom: ds,
    };
  }

  if (scopeFor(p, PERMISSIONS.ANALYSIS_VIEW).none) throw forbidden('Bảng này dành cho Quản lý.');
  const { dong, baiCua, hanCua } = treCham(p, branchId, f.ct ?? 'ft');
  const g = dong.find((x) => x.khoa === f.gv);
  const rong: PanelGvTre = { chiNhanh, soGv: 0, soBai: 0, soBaiChuaCoGv: 0, choCham: 0, nhom: [] };
  if (!g) return rong;   // vừa nhập đủ / bộ lọc vừa đổi — web giữ dòng "✓ Đã đủ"
  const ids = baiCua.get(g.khoa)!;
  const luot = new Map<number, any>();
  const tuanMon = new Map<string, { planned_period_id: number; week_start: string }>();
  theoLo([...new Set(ids.map((b) => tachBaiId(b).attemptId))], (lo, ph) => {
    for (const a of db().prepare(
      `SELECT a.id, a.kind, a.attempt_no, a.class_id, a.student_id, a.planned_period_id, c.code, c.programme_code, pr.week_start
         FROM assessment_attempts a LEFT JOIN classes c ON c.id = a.class_id LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
        WHERE a.id IN (${ph})`,
    ).all(...lo) as any[]) luot.set(a.id, a);
    /* Tuần thi CỦA MÔN (ô thi bù khác tuần lượt) — như dòng phụ `rowsFor('bai')`; W1 / W2 dùng tuần của Writing khi không có dòng riêng. */
    for (const k of db().prepare(`SELECT k.attempt_id, k.skill, k.planned_period_id, rp.week_start FROM attempt_skills k
        JOIN report_periods rp ON rp.id = k.planned_period_id WHERE k.attempt_id IN (${ph})`).all(...lo) as any[]) tuanMon.set(`${k.attempt_id}|${k.skill}`, k);
  });
  const theoDong = new Map<string, DongGvTre & { ct?: string | null }>();
  for (const b of ids) {
    const x = tachBaiId(b);
    const a = luot.get(x.attemptId);
    if (!a) continue;
    const ma = vietMaLuot(a.kind === 'mock' ? { loai: 'mt', so: a.attempt_no } : a.kind === 'checkpoint' ? { loai: 'cp', so: a.attempt_no } : { loai: 'thuong', kind: a.kind });
    const tm = tuanMon.get(`${x.attemptId}|${x.skill}`) ?? tuanMon.get(`${x.attemptId}|${assessedSkillOf(x.skill)}`);
    const tuan = tm?.week_start ?? a.week_start ?? null;
    /* Một lớp · lượt · tuần thi = một dòng, mọi môn của GV trong đó (như việc Chấm điểm của Admin: một lưới nhập; em thi bù tuần khác là dòng khác). */
    const key = `${a.class_id ?? 0}|${ma}|${tuan ?? ''}`;
    const d = theoDong.get(key) ?? theoDong.set(key, {
      key, classId: a.class_id ?? null, lop: a.code ?? null, luot: a.class_id ? ma : null,
      luotChu: a.kind === 'mock' ? `MT${a.attempt_no}` : ATTEMPT_KIND_SHORT[a.kind as AttemptKind] ?? a.kind, tuan, periodId: tm?.planned_period_id ?? a.planned_period_id ?? null,
      kns: [], knChu: '', soBai: 0, han: null, em: [], nhapHo: false, ct: a.programme_code ?? null,
    }).get(key)!;
    d.soBai += 1;
    if (!d.kns.includes(x.skill)) d.kns.push(x.skill);
    if (!d.em.includes(a.student_id)) d.em.push(a.student_id);
    for (const h of hanCua.get(b) ?? []) if (!d.han || h < d.han) d.han = h;
  }
  for (const d of theoDong.values()) { d.nhapHo = nhapHoDuoc(p, d.classId, d.kns); d.knChu = monChu(d.ct, xepMon(d.kns)); delete d.ct; }
  const nhom = xep([{ gvId: g.khoa, ten: g.ten, soBai: g.bai, dong: [...theoDong.values()] }]);
  return { ...rong, soGv: g.khoa > 0 ? 1 : 0, soBai: g.khoa === 0 ? 0 : g.bai, soBaiChuaCoGv: g.khoa === 0 ? g.bai : 0, nhom };
}
