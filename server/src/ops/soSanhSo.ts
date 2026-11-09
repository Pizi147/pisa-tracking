/**
 * `npm run so-sanh-so [tu] [den]` — SỔ NGHĨA VỤ, bảng chênh lệch (spec 2.4, plan Task 6): mỗi GV một dòng (mọi chi nhánh), cách đếm CŨ (hồ sơ GV theo kỳ:
 * "Điểm đúng hạn" `tapChamDiem` · "Việc đúng hạn" `dongViecHan`) so với SỔ (`demTheoNguoi`). Chỉ đọc. Không in tên thật: "GV #id".
 * Kỳ cũ: bài theo TUẦN THI trong khoảng; sổ: theo HẠN trong khoảng (hạn = mốc trễ). Cột lý do đếm từ dòng sổ của người đó.
 */
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { PERMISSIONS, khoangPtGv } from '../../../shared/domain/index.ts';
import { chiSoHoSoGv } from '../phanTich/giaoVien.ts';
import { demTheoNguoi, dongCuaNguoi, chuaPhanCong } from '../phanTich/demNghiaVu.ts';
import { truocMoc } from '../phanTich/soNghiaVu.ts';
import { addDays } from '../util.ts';
import { chayTrongRequest } from '../platform/nguCanhRequest.ts';
import type { Principal } from '../permissions.ts';

const homNay = demoToday();
const k = khoangPtGv({ tu: process.argv[2] ?? null, den: process.argv[3] ?? null }, homNay);
if ('loi' in k) throw new Error(k.loi);
const cuoi = addDays(k.den, 6);
const conn = db();
const cns = conn.prepare(`SELECT id, code FROM branches ORDER BY id`).all() as any[];
const P: Principal = { userId: 0, code: '', fullName: '', title: null, roleKeys: ['admin'], assignments: [],
  grants: cns.map((b) => ({ id: b.id, roleKey: 'admin', roleName: '', branchId: b.id, branchName: null, permissions: new Set(Object.values(PERMISSIONS)) })) };
const pt = (dung: number, tong: number) => (tong ? `${dung}/${tong} (${Math.round((100 * dung) / tong)} %)` : '—');
const o = (x: any) => (x?.k === 'so' ? { dung: x.dung, tong: x.tong } : { dung: 0, tong: 0 });
const so3 = (x: any) => ({ dung: x?.dung ?? 0, tong: (x?.dung ?? 0) + (x?.muon ?? 0) + (x?.chua ?? 0), muon: x?.muon ?? 0, chua: x?.chua ?? 0 });

const bai = demTheoNguoi({ chiNhanh: null, tu: k.tu, den: cuoi, loai: 'bai', homNay });
const viec = demTheoNguoi({ chiNhanh: null, tu: k.tu, den: cuoi, loai: 'viec', homNay });
const gvs = (conn.prepare(`SELECT DISTINCT ta.user_id AS id FROM teacher_assignments ta WHERE ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)`)
  .all(cuoi, k.tu) as any[]).map((r) => r.id as number);
const ids = [...new Set([...gvs, ...bai.keys(), ...viec.keys()])].sort((a, b) => a - b);
console.log(`Kỳ ${k.tu} → ${cuoi} · hôm nay ${homNay}\n`);
console.log('| GV | Chấm Test cũ | Chấm Test sổ (đúng · muộn · chưa làm) | Việc cũ | Việc sổ (đúng · muộn · chưa làm) | Lý do chênh (dòng sổ) |\n|---|---|---|---|---|---|');
const tong = { chamCu: [0, 0], chamSo: [0, 0], viecCu: [0, 0], viecSo: [0, 0] };
for (const id of ids) {
  let cu: any = null;
  try { cu = chayTrongRequest('GET', () => chiSoHoSoGv(P, id, { tu: k.tu, den: k.den })); } catch { /* GV không còn phân công trong phạm vi */ }
  const c = o(cu?.diemDungHan), v = o(cu?.viecDungHan), b = so3(bai.get(id)), w = so3(viec.get(id));
  if (!c.tong && !v.tong && !b.tong && !w.tong) continue;
  tong.chamCu[0] += c.dung; tong.chamCu[1] += c.tong; tong.chamSo[0] += b.dung; tong.chamSo[1] += b.tong;
  tong.viecCu[0] += v.dung; tong.viecCu[1] += v.tong; tong.viecSo[0] += w.dung; tong.viecSo[1] += w.tong;
  const d = dongCuaNguoi({ nguoi: id, chiNhanh: null, tu: k.tu, den: cuoi, loai: 'bai', homNay });
  const ly: string[] = [];
  const n = (f: (x: any) => boolean) => d.filter(f).length;
  if (n((x) => x.sCheo && x.trangThai === 'chua')) ly.push(`S chéo chưa ai chấm (cả nhóm) ${n((x) => x.sCheo && x.trangThai === 'chua')}`);
  if (n((x) => x.pcNhapSau)) ly.push(`phân công nhập sau ${n((x) => x.pcNhapSau)}`);
  if (n((x) => x.trangThai === 'dung' && x.xongLuc && x.xongLuc > x.han)) ly.push(`mốc W4 OCT (xong muộn → đúng) ${n((x) => x.trangThai === 'dung' && !!x.xongLuc && x.xongLuc > x.han)}`);
  if (n((x) => x.trangThai === 'chua' && !x.sCheo)) ly.push(`chưa làm ${n((x) => x.trangThai === 'chua' && !x.sCheo)}`);
  console.log(`| GV #${id} | ${pt(c.dung, c.tong)} | ${b.tong ? `${pt(b.dung, b.tong)} · ${b.muon} · ${b.chua}` : '—'} | ${pt(v.dung, v.tong)} | ${w.tong ? `${pt(w.dung, w.tong)} · ${w.muon} · ${w.chua}` : '—'} | ${ly.join(' · ')} |`);
}
console.log(`| **Tổng** | ${pt(tong.chamCu[0], tong.chamCu[1])} | ${pt(tong.chamSo[0], tong.chamSo[1])} | ${pt(tong.viecCu[0], tong.viecCu[1])} | ${pt(tong.viecSo[0], tong.viecSo[1])} | |`);
console.log('\nChưa phân công (bài / việc không có người, theo chi nhánh):');
for (const b of cns) {
  const ds = chuaPhanCong(b.id, k.tu, cuoi, homNay);
  if (ds.length) console.log(`- ${b.code}: ${ds.length} (${ds.filter((x) => x.trangThai === 'chua').length} chưa làm)`);
}
/* PTA 09/11: nhóm "đặt lại hạn" — việc có hạn gốc trước ngày đặt lại (RESET-HAN-CASE) mà hạn hiện tại khác: quá hạn lúc đặt lại, nay tính theo hạn mới. */
const ngayReset = String((conn.prepare(`SELECT value FROM demo_config WHERE key = 'pr_reset_han_case_da_chay'`).get() as any)?.value ?? '').slice(0, 10);
if (ngayReset) {
  console.log(`
Đặt lại hạn ${ngayReset} (việc quá hạn lúc đặt lại, nay theo hạn mới):`);
  for (const r of conn.prepare(`SELECT kieu, COUNT(*) AS n, SUM(xong_luc IS NULL AND han >= ?) AS chua_toi, SUM(xong_luc IS NULL AND han < ?) AS chua_lam, SUM(xong_luc IS NOT NULL) AS da_lam
      FROM nghia_vu WHERE loai = 'viec' AND khong_tinh IS NULL AND han_goc < ? AND han_goc IS NOT han GROUP BY kieu ORDER BY n DESC`).all(homNay, homNay, ngayReset) as any[]) {
    console.log(`- ${r.kieu}: ${r.n} việc · đã làm ${r.da_lam} · chưa tới hạn mới ${r.chua_toi} · quá hạn mới chưa làm ${r.chua_lam}`);
  }
}
void truocMoc;
