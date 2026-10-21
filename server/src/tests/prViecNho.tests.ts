/**
 * VIEC-NHO (08/10) — 6 việc nhỏ sau rà:
 *  1. Chip lưới FT (ChipDotFT) đọc màn hình: chip không có chữ việc vẫn nói trạng thái ("xong" / "có lịch" / "đang thi").
 *  2. Câu UNION của Ý thức đặt AS mọi cột (DTL1 mở rộng ở fixDtlOmt.tests.ts).
 *  3. Sửa thông tin tài khoản: 409 trùng email hiện dưới ô "Email đăng nhập".
 *  4. Nút ⋯ dòng: vùng bấm ≥ 44 px ở điện thoại (ảnh thật trong mô tả PR; ở đây chỉ giữ luật CSS).
 *  5. Việc "Chốt lên FT · lớp" (PR-LCb: "Chốt lộ trình"): em chỉ có đề xuất GVCN chờ duyệt ghi tách "n em chờ duyệt đề xuất".
 *  6. Lỗi kho tệp (`fetch failed` của fetch Node — Netlify Blobs) không bị nhận là mất kết nối Turso.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

export async function runPrViecNhoTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, TODAY, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nVIEC-NHO · 6 việc nhỏ (chip FT đọc màn hình, 409 email, ⋯ 44px, Chốt lên FT đề xuất, lỗi kho tệp ≠ Turso)');

  check('VN1 · nhomKyNang: mỗi chip có câu đọc màn hình nói trạng thái kể cả khi không có chữ việc (xong / có lịch / đang thi)', () => {
    const homNay = '2026-09-16';
    const o = (x: object) => ({ trangThai: 'da-xep', tuan: '2026-09-21', tuanKetThuc: '2026-09-27', periodId: 1, doiTu: null, batBuoc: true, khoa: null, sit: 'scheduled', choDuyet: false, hanCham: null, ...x });
    const docCua = (kn: object) => d.nhomKyNang(kn, homNay).map((g: any) => g.doc);
    const xong = docCua({ listening: o({ trangThai: 'xong', tuan: '2026-09-07', tuanKetThuc: '2026-09-13' }) });
    assert(xong.length === 1 && /, xong,/.test(xong[0]), `xong: ${xong}`);
    const coLich = docCua({ listening: o({}) });
    assert(/, có lịch,/.test(coLich[0]), `có lịch: ${coLich}`);
    const dangThi = docCua({ listening: o({ tuan: '2026-09-14', tuanKetThuc: '2026-09-20' }) });
    assert(/, đang làm bài,/.test(dangThi[0]), `đang thi: ${dangThi}`);
    const cho = docCua({ listening: o({ tuan: '2026-09-07', tuanKetThuc: '2026-09-13' }) });
    assert(/, chờ chấm,/.test(cho[0]) && !/có lịch|xong/.test(cho[0]), `chờ: ${cho}`);
    const tach = docCua({ listening: o({ trangThai: 'xong', tuan: '2026-09-07', tuanKetThuc: '2026-09-13' }), reading: o({}) });
    assert(tach.length === 2 && /, xong,/.test(tach[0]) && /, có lịch,/.test(tach[1]), `tách nhóm: ${tach}`);
    const chua = docCua({ listening: o({ tuan: null, tuanKetThuc: null, periodId: null }) });
    assert(/chưa xếp$/.test(chua[0]) && !/chưa xếp.*chưa xếp/.test(chua[0]), `chưa xếp: ${chua}`);
    const c = doc('web/src/modules/test/keHoach/ChipKyNang.tsx');
    assert(/aria-label=\{`MT\$\{so\}, \$\{g\.doc\}`\}/.test(c.slice(c.indexOf('export function ChipDotFT'))), 'ChipDotFT chưa dùng g.doc');
  });

  /* ---------------------------------------------------------------- 5. Chốt lên FT: tách em chờ duyệt đề xuất */
  const week: any = await import('../platform/week.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const lenhSvc: any = await import('../classes/lenhChuyen.ts');
  const yeuCau: any = await import('../duyet/yeuCau.ts');
  const QL = P.mbManager;
  const MB = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const thu2 = (n: number) => addDays(week.mondayOf(TODAY), -7 * (n - 1));
  let seq = 0;
  /** Lớp FOU đang ở tuần 8 (cửa sổ Chốt lên FT), `soEm` em chưa có hướng — như `fixChotLenFt.tests.ts`. */
  /* PR-LCa (R1): FOU tuần 7 — "Chốt lên FT" chỉ còn trước tuần Final (tuần 8 đã sang "Chuyển tiếp lớp"). */
  const taoLop = (soEm: number) => {
    seq += 1;
    const lop = intake.createClass(P.admin, { code: `MB VN5-${seq}`, branchId: MB, kind: 'FOU', isFastTrack: false, startDate: thu2(7), startPeriodId: week.ensurePeriod(thu2(7)).id });
    const now = new Date().toISOString();
    const sids: number[] = [];
    for (let i = 0; i < soEm; i++) {
      const tag = `VN5-${seq}-${i}`;
      const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
        .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, MB, now).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop.id, thu2(7), now);
      conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', 6, ?, 'active', ?)`)
        .run(sid, thu2(7), now);
      sids.push(sid);
    }
    regular.planRegularTests(P.admin, lop.id);
    return { classId: lop.id as number, sids };
  };
  /** Đề xuất chuyển lớp của GVCN, CHỜ Quản lý duyệt (như `guiDeXuatChuyenLop` của GVCN). */
  const deXuat = (sid: number) => yeuCau.taoYeuCau(conn, {
    loai: 'de_xuat_chuyen_lop', doiTuongLoai: 'student:chuyen-lop', doiTuongId: sid, hocVienId: sid, nguoiXin: P.admin.userId, lyDo: 'VN5', duLieu: { lopDichId: null, tuan: null },
  });
  const viec = (lop: number) => mywork.myWork(QL, { branchId: MB }).groups.flatMap((g: any) => g.items).find((i: any) => i.group === 'chot_len_ft' && i.classId === lop);

  check('VN5 · Chốt lộ trình (trước: Chốt lên FT): em chỉ có đề xuất GVCN chờ duyệt → chữ việc tách "n em chờ duyệt đề xuất" khỏi "m em chưa chọn" (OV-3b: chữ mới); số đếm đúng', () => {
    const l = taoLop(3);
    assert(viec(l.classId)?.reason === '3 em chưa chọn', `trước đề xuất: ${viec(l.classId)?.reason}`);
    assert(deXuat(l.sids[0]) !== null, 'tạo đề xuất');
    const x = lenhSvc.lopChoChotLoTrinh(QL, MB, TODAY).find((r: any) => r.classId === l.classId);
    assert(x?.chuaLenh === 3 && x?.choDuyet === 1 && x?.chuaHuong === 2, JSON.stringify(x));
    const v = viec(l.classId);
    /* PR-LCb (chữ mới, mockup cuối khoá 2 phần 1a + 4): "{tổng} em · m em chưa có hướng · n em chờ duyệt đề xuất". */
    assert(v?.reason === '3 em · 2 em chưa chọn · 1 em chờ duyệt đề xuất' && v?.contextLabel === v?.reason && v?.count === 3, `${v?.reason} · count ${v?.count}`);
    deXuat(l.sids[1]); deXuat(l.sids[2]);
    assert(viec(l.classId)?.reason === '3 em chờ duyệt đề xuất', `chỉ còn đề xuất: ${viec(l.classId)?.reason}`);
  });

  /* ---------------------------------------------------------------- 6. Lỗi kho tệp ≠ mất kết nối Turso */
  const dbMod: any = await import('../db.ts');
  const appMod: any = await import('../app.ts');
  await checkAsync('VN6 · `fetch failed` THẬT của fetch Node (Netlify Blobs đi qua nó) ở GET tải tệp → không nhận là mất kết nối Turso: giữ kết nối, không thử lại, lỗi đi tiếp', async () => {
    /* Cổng 9 (discard) trên 127.0.0.1 không có máy nghe → fetch ném đúng lỗi `TypeError: fetch failed` như kho tệp gặp. */
    const loi = await fetch('http://127.0.0.1:9/').then(() => null, (e: unknown) => e);
    assert(loi instanceof TypeError && /fetch failed/.test((loi as Error).message), `cần lỗi fetch thật: ${String(loi)}`);
    assert(!dbMod.laLoiMatKetNoiTurso(loi), 'lỗi fetch (kho tệp) bị nhận là mất kết nối Turso');
    const cu = dbMod.db();
    let goiLai = 0;
    let tiep: unknown = null;
    try {
      appMod.thuLaiKhiMatKetNoi(() => { goiLai++; })(loi, { method: 'GET', path: '/api/attachments/1/file' }, { headersSent: false }, (e: unknown) => { tiep = e; });
      assert(goiLai === 0 && tiep === loi && dbMod.db() === cu, `goiLai=${goiLai}, bỏ kết nối=${dbMod.db() !== cu}`);
    } finally {
      const moi = dbMod.db();
      if (moi !== cu) { try { moi.close(); } catch { /* đã đóng */ } dbMod.datKetNoiChoPhepKiem(cu); }
    }
    /* Lỗi cùng chữ do libsql ném (Error thường / SqliteError) vẫn là mất kết nối — giữ nguyên #236 (anToan Z2c-b/c). */
    const lib: any = await import('libsql');
    const SqliteError = lib.SqliteError ?? lib.default.SqliteError;
    assert(dbMod.laLoiMatKetNoiTurso(new Error('fetch failed')) && dbMod.laLoiMatKetNoiTurso(new SqliteError('Hrana(Http("connection closed before message completed"))', 'SQLITE_UNKNOWN')),
      'lỗi libsql phải vẫn nhận là mất kết nối');
  });

  /* ---------------------------------------------------------------- 4. Nút ⋯ / chip +n: vùng bấm 44px ở điện thoại */
  check('VN4 · MenuDong ở điện thoại (< 640px): nút ⋯ vùng bấm 28 - 2 + 18 = 44; chip "+n" vùng bấm ≥ 44×44 giữa chip (đo ảnh thật: 30×43 → 44×44)', () => {
    const c = doc('web/src/ui/MenuDong.tsx');
    const chip = /\? `\$\{CHIP_TRON\}([^`]*)`/.exec(c)?.[1] ?? '';
    for (const l of ['max-sm:after:absolute', 'max-sm:after:h-11', 'max-sm:after:w-11', 'max-sm:after:min-w-full', 'max-sm:after:-translate-x-1/2', 'max-sm:after:-translate-y-1/2'])
      assert(chip.includes(l), `chip +n thiếu ${l}: ${chip}`);
    assert(/after:-inset-\[9px\][^"]*sm:after:hidden/.test(c), 'nút ⋯ mất vùng bấm 44px');
  });

  /* ---------------------------------------------------------------- 3. Sửa thông tin: 409 trùng email dưới ô */
  check('VN3 · Sửa thông tin tài khoản: lỗi 409 (trùng email) thành lỗi của ô "Email đăng nhập" (dưới ô, chặn Lưu tới khi đổi email), không toast', () => {
    const c = doc('web/src/modules/platform/AccountsAdmin.tsx');
    const p = c.slice(c.indexOf('function SuaThongTinPanel'));
    assert(/e\?\.status === 409/.test(p) && /setTrung\(/.test(p), '409 chưa bắt riêng');
    assert(/trung === email \? \[\{ khoa: 'email'/.test(p), 'lỗi trùng chưa nằm trong danh sách lỗi ô email');
  });
}
