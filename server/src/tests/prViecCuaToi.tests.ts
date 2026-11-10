/**
 * VIEC-CUA-TOI (rà toàn bộ 11/11, đề xuất #1 "Một hàm việc của tôi cho mọi nơi" — chủ SP duyệt top 10):
 * G5-04 / G1-05 ô "Mọi hạn · Quá hạn n" đếm cùng tập với đầu trang Công việc (bộ lọc hạn áp mọi tab), ẩn ở tab Chờ bạn duyệt (lọc không tác dụng) ·
 * G5-05 chuông: tín hiệu `pending` (không còn việc nào đọc) không còn ở "Cần làm" · G5-11 Admin: "Xuất báo cáo PH" quá hạn có dòng "Cần làm" ở chuông ·
 * G1-13 / G4-18 dòng vừa xong ở Công việc giữ tên việc lúc mở · G4-23 chip việc ẩn của hồ sơ lớp không ghi sai đơn vị ·
 * hồ sơ HV: lần ghi cuối PA bổ trợ khi Mini Test chờ → chỉ "Ghi Mini Test" (như Công việc, `boKetQuaChoMiniTest`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function runPrViecCuaToiTests(t: any) {
  const { check, assert, conn } = t;
  console.log('\nVIEC-CUA-TOI · một hàm việc của tôi cho mọi nơi');
  const { thongBaoCua } = await import('../platform/thongBao.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  const nguon = (f: string) => fs.readFileSync(path.join(ROOT, f), 'utf8');
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };

  check('G5-05 · chuông: thông báo gắn tín hiệu `pending` → Để biết (không việc nào đọc tín hiệu chờ)', () => thu(() => {
    const cs = get(`SELECT id, owner_user_id FROM case_signals WHERE owner_user_id IS NOT NULL ORDER BY id LIMIT 1`);
    assert(cs, 'seed có tín hiệu');
    conn.prepare(`UPDATE case_signals SET status = 'pending' WHERE id = ?`).run(cs.id);
    const nid = Number(conn.prepare(`INSERT INTO notifications (user_id, kind, title, body, entity_type, entity_id, created_at, dedup_key) VALUES (?, 'sos', 'Case chờ xác nhận nguyên nhân · thử', '', 'case_signal', ?, ?, 'thu-g5-05')`)
      .run(cs.owner_user_id, cs.id, new Date().toISOString()).lastInsertRowid);
    const r = (thongBaoCua(cs.owner_user_id) as any[]).find((x) => x.id === nid);
    assert(r && r.con_viec === 0 && d.nhomThongBao(r) === 'de-biet', `dòng tín hiệu pending: ${JSON.stringify(r && { con_viec: r.con_viec })}`);
  }));

  check('G1-13 / G4-18 · dòng vừa xong giữ bản dòng lúc lưu LẦN ĐẦU (tên việc gốc), không bản sau lần lưu cuối', () => {
    assert(/setGiu\(\(m\) => \(m\.has\(it\.key\) \? m : new Map\(m\)\.set\(it\.key, it\)\)\)/.test(nguon('web/src/modules/congViec/HoTroHocVienTab.tsx')), 'daLam giữ bản đầu');
    assert(/daXong && \(it\.group === 'ban_giao' \|\| viecCaLop\)\) \? null/.test(nguon('web/src/modules/congViec/DanhSachViec.tsx')), 'dòng xong bỏ tiến độ cũ (bàn giao, việc cả lớp)');
  });

  check('G4-23 · hồ sơ lớp: một badge ẩn thì hiện thẳng; chip "+n" không ghi đơn vị "việc"', () => {
    const s = nguon('web/src/modules/classes/DauTrangLop.tsx');
    assert(!/'\+\{n\} việc'/.test(s) && /b\.an\.length === 1/.test(s), 'không "+n việc"; một badge ẩn → hiện thẳng');
  });

  check('Hồ sơ HV · lần ghi cuối PA bổ trợ khi Mini Test chờ → không có "Ghi kết quả" (cùng `boKetQuaChoMiniTest` của Công việc)', () => {
    const s = nguon('server/src/students/viecHocVien.ts');
    assert(/choMini = n\.miniTest && n\.miniTest\.tyLe === null/.test(s) && /!\(pl\.lanCuoi && choMini && pl\.nhom === choMini\)/.test(s), 'viecHocVien bỏ KQ PA lần cuối khi Mini Test chờ');
  });
}
