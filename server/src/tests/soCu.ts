/**
 * SỔ NGHĨA VỤ PR-3 (Task 8): `tapChamDiem`, `oChamDiemGv`, `viecQuaHanMo` đã bỏ — phép kiểm luật nhập điểm / việc quá hạn cũ đọc qua đây, CÙNG luật với sổ
 * (`tinhBai` · `trangThai`), giữ hình dữ liệu các phép kiểm đang dùng. Mỗi lần gọi ghi lại sổ các lượt của lớp (phép kiểm hay sửa thẳng DB).
 */
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { ghiSoLuot } from '../phanTich/soNghiaVu.ts';
import { trangThai } from '../phanTich/demNghiaVu.ts';
import { VIEC_CO_HAN, quanLyCn } from '../phanTich/viecCoHan.ts';
import { myWork, type WorkItem } from '../worklist/mywork.ts';
import { baiId } from '../../../shared/domain/index.ts';

type NguCanh = { cn: number; khung: 'ft' | 'thuong'; tu: string; den: string; cuoi: string; lop: ReadonlyMap<number, unknown> };
/** `han` = hạn của sổ (mốc trễ `mocTreNhapDiem`, spec 1.3) — không phải hạn chấm gốc. `lop` = mã lớp lúc thi. */
export type DongChamSo = { id: number; gv: number; dung: boolean; nhapDau: string | null; han: string; lop: string | null; tuan: string | null; classId: number | null; studentId: number | null; tre: number | null };

const ngayCach = (tu: string, den: string) => Math.round((Date.parse(`${den.slice(0, 10)}T00:00:00Z`) - Date.parse(`${tu.slice(0, 10)}T00:00:00Z`)) / 86_400_000);

/** Như `tapChamDiem(c, nap).dong` cũ: ô có TUẦN THI trong khoảng ở lớp của ngữ cảnh, có người chịu, đang tính (không vắng / "-" / chưa tới hạn…). Khoá `baiId`. */
export function dongChamSo(c: NguCanh): Map<number, DongChamSo> {
  const lop = JSON.stringify([...c.lop.keys()]);
  ghiSoLuot((db().prepare(`SELECT id FROM assessment_attempts WHERE class_id IN (SELECT value FROM json_each(?))`).all(lop) as any[]).map((r) => r.id as number));
  const homNay = demoToday();
  const out = new Map<number, DongChamSo>();
  for (const r of db().prepare(`SELECT n.*, l.code AS ma_lop FROM nghia_vu n LEFT JOIN classes l ON l.id = n.lop WHERE n.loai = 'bai' AND n.khong_tinh IS NULL
      AND n.nguoi IS NOT NULL AND n.tuan BETWEEN ? AND ? AND n.lop IN (SELECT value FROM json_each(?))`).all(c.tu, c.den, lop) as any[]) {
    const t = trangThai({ han: r.han, hanGoc: r.han_goc, tuan: r.tuan, xongLuc: r.xong_luc }, homNay);
    if (t === 'chua-toi') continue;
    const [, a, skill] = String(r.khoa).split(':');
    const id = baiId(Number(a), skill);
    out.set(id, { id, gv: r.nguoi, dung: t === 'dung', nhapDau: r.xong_luc, han: r.han, lop: r.ma_lop ?? null, tuan: r.tuan, classId: r.lop, studentId: r.hoc_vien,
      tre: t === 'dung' ? null : ngayCach(r.han, r.xong_luc ?? homNay) });
  }
  return out;
}

/** Như `oChamDiemGv` cũ (panel V4 một GV): dòng + số trễ. */
export function panelChamSo(c: NguCanh, gv: number): { rows: DongChamSo[]; tre: number } {
  const rows = [...dongChamSo(c).values()].filter((d) => d.gv === gv).sort((a, b) => Number(a.dung) - Number(b.dung) || a.id - b.id);
  return { rows, tre: rows.filter((r) => !r.dung).length };
}

/** Như `viecQuaHanMo` cũ: việc Công việc "Tất cả" (QL chi nhánh) còn mở QUÁ HẠN, có người giữ, hạn trong [tu, cuoi], khung ngữ cảnh (không lớp: mọi khung). */
export function viecMoQuaHan(c: NguCanh): Map<number, WorkItem[]> {
  const items = ((myWork(quanLyCn(c.cn), { branchId: c.cn, nguoi: 'tat-ca', chiNhom: VIEC_CO_HAN }) as { items?: WorkItem[] }).items ?? []);
  const out = new Map<number, WorkItem[]>();
  for (const it of items) {
    if (it.urgency !== 'overdue' || it.ownerId == null || !it.due || it.due < c.tu || it.due > c.cuoi || (it.khung && it.khung !== c.khung)) continue;
    (out.get(it.ownerId) ?? out.set(it.ownerId, []).get(it.ownerId)!).push(it);
  }
  return out;
}
