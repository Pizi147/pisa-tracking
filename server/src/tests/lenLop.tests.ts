/**
 * PHÉP KIỂM PR-LT — Lên lớp, chuyển lớp.
 * Harness (`check`, `assert`, dữ liệu demo) do `run.ts` sở hữu và truyền vào.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runLenLopTests(t: YThucTestKit) {
  const { check, assert, conn } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-LT · Lên lớp, chuyển lớp: luật thuần');

  // ==================================================================== luatDoiLop — 6 dòng bảng luật

  check('PR-LT (1) · luatDoiLop: FT → FT giữ lộ trình, Case đi theo em, endKind chuyen_lop', () => {
    const r = d.luatDoiLop({ ma: 'FT', ft: true }, { ma: 'FT', ft: true }, 'giua-khoa');
    assert(r.khoa === 'giu' && r.dongCase === null && r.canMucTieu === false && r.endKind === 'chuyen_lop', JSON.stringify(r));
  });

  check('PR-LT (1) · luatDoiLop: FT → lớp thường đóng khoá FT, Case FT tự đóng "normal" (Q10)', () => {
    const r = d.luatDoiLop({ ma: 'FT', ft: true }, { ma: 'BE', ft: false }, 'giua-khoa');
    assert(r.khoa === 'dong-mo' && r.dongCase === 'normal' && r.canMucTieu === false && r.endKind === 'chuyen_lop', JSON.stringify(r));
  });

  check('PR-LT (1) · luatDoiLop: lớp thường → FT đóng khoá cũ, mở lộ trình FT, cần mục tiêu, endKind sang_ft (S17)', () => {
    const r = d.luatDoiLop({ ma: 'FOU', ft: false }, { ma: 'FT', ft: true }, 'giua-khoa');
    assert(r.khoa === 'dong-mo' && r.dongCase === 'ft' && r.canMucTieu === true && r.endKind === 'sang_ft', JSON.stringify(r));
  });

  check('PR-LT (1) · luatDoiLop: cuối khoá, lên chương trình kế → endKind len_lop', () => {
    const r = d.luatDoiLop({ ma: 'FOU', ft: false }, { ma: 'BE', ft: false }, 'cuoi-khoa');
    assert(r.khoa === 'dong-mo' && r.dongCase === null && r.endKind === 'len_lop', JSON.stringify(r));
  });

  check('PR-LT (1) · luatDoiLop: cuối khoá, cùng chương trình (học lại) → endKind hoc_lai', () => {
    const r = d.luatDoiLop({ ma: 'FOU', ft: false }, { ma: 'FOU', ft: false }, 'cuoi-khoa');
    assert(r.khoa === 'dong-mo' && r.endKind === 'hoc_lai', JSON.stringify(r));
  });

  check('PR-LT (1) · luatDoiLop: giữa khoá, cùng chương trình → giữ khoá, endKind chuyen_lop', () => {
    const r = d.luatDoiLop({ ma: 'FOU', ft: false }, { ma: 'FOU', ft: false }, 'giua-khoa');
    assert(r.khoa === 'giu' && r.dongCase === null && r.endKind === 'chuyen_lop', JSON.stringify(r));
  });

  check('PR-LT (1) · luatDoiLop: giữa khoá, khác chương trình (xếp lại trình độ) → đóng khoá cũ, Case đi theo em (Q11)', () => {
    const r = d.luatDoiLop({ ma: 'FOU', ft: false }, { ma: 'BE', ft: false }, 'giua-khoa');
    assert(r.khoa === 'dong-mo' && r.dongCase === null && r.endKind === 'chuyen_lop', JSON.stringify(r));
  });

  // ==================================================================== huongTiepKhaDung

  check('PR-LT (1) · huongTiepKhaDung: ELE không có bậc kế → không có "len_lop"; FOU có "len_lop"', () => {
    assert(!d.huongTiepKhaDung('ELE').includes('len_lop'), 'ELE không có bậc Normal kế');
    assert(d.huongTiepKhaDung('FOU').includes('len_lop'), 'FOU còn bậc kế (BE)');
  });

  // ==================================================================== nhanTiepTheo — 6 hướng (bao gồm không có bản ghi)

  check('PR-LT (1) · nhanTiepTheo: 6 hướng + không có bản ghi + chua_ro đều ra chữ đúng luật Q4', () => {
    assert(d.nhanTiepTheo({ huong: 'len_lop' }, 'FOU') === 'BE', 'len_lop → mã bậc kế');
    assert(d.nhanTiepTheo({ huong: 'fast_track' }, 'FOU') === 'Fast Track', 'fast_track');
    assert(d.nhanTiepTheo({ huong: 'hoc_lai' }, 'FOU') === 'học lại FOU', 'hoc_lai');
    assert(d.nhanTiepTheo({ huong: 'bao_luu' }, 'FOU') === 'bảo lưu', 'bao_luu');
    assert(d.nhanTiepTheo({ huong: 'dung_hoc' }, 'FOU') === 'dừng học', 'dung_hoc');
    assert(d.nhanTiepTheo({ huong: 'chua_ro' }, 'FOU') === null, 'chua_ro → null (Q4: không tắt nhắc)');
    assert(d.nhanTiepTheo(null, 'FOU') === null, 'Không có bản ghi → null');
  });

  // ==================================================================== kiemDongChuyenTiep — mỗi lỗi một phép

  check('PR-LT (1) · kiemDongChuyenTiep: thiếu hướng', () => {
    assert(typeof d.kiemDongChuyenTiep({ huong: null }, { maTu: 'FOU' }) === 'string', 'Phải báo lỗi');
  });

  check('PR-LT (1) · kiemDongChuyenTiep: len_lop/hoc_lai/fast_track thiếu lớp đích', () => {
    for (const huong of ['len_lop', 'hoc_lai', 'fast_track'] as const) {
      assert(typeof d.kiemDongChuyenTiep({ huong }, { maTu: 'FOU' }) === 'string', `${huong} thiếu lớp đích phải báo lỗi`);
    }
  });

  check('PR-LT (1) · kiemDongChuyenTiep: lớp đích sai loại — len_lop phải đúng chương trình kế, hoc_lai phải cùng chương trình, sang FT phải là lớp FT', () => {
    assert(typeof d.kiemDongChuyenTiep({ huong: 'len_lop', toClassId: 1, toClass: { ma: 'ELE', ft: false } }, { maTu: 'FOU' }) === 'string',
      'len_lop sang ELE (không phải bậc kế của FOU) phải báo lỗi');
    assert(typeof d.kiemDongChuyenTiep({ huong: 'hoc_lai', toClassId: 1, toClass: { ma: 'BE', ft: false } }, { maTu: 'FOU' }) === 'string',
      'hoc_lai khác chương trình phải báo lỗi');
    assert(typeof d.kiemDongChuyenTiep({ huong: 'fast_track', toClassId: 1, toClass: { ma: null, ft: false }, mucTieu: 6 }, { maTu: 'FOU' }) === 'string',
      'sang FT mà lớp đích không phải FT phải báo lỗi');
    assert(d.kiemDongChuyenTiep({ huong: 'len_lop', toClassId: 1, toClass: { ma: 'BE', ft: false } }, { maTu: 'FOU' }) === null,
      'len_lop đúng bậc kế thì hợp lệ');
  });

  check('PR-LT (1) · kiemDongChuyenTiep: sang FT thiếu mục tiêu hoặc mục tiêu ngoài 0–9/không chia hết 0.5', () => {
    assert(typeof d.kiemDongChuyenTiep({ huong: 'fast_track', toClassId: 1, toClass: { ma: 'FT', ft: true } }, { maTu: 'FOU' }) === 'string',
      'Thiếu mục tiêu phải báo lỗi');
    assert(typeof d.kiemDongChuyenTiep({ huong: 'fast_track', toClassId: 1, toClass: { ma: 'FT', ft: true }, mucTieu: 9.5 }, { maTu: 'FOU' }) === 'string',
      'Mục tiêu > 9 phải báo lỗi');
    assert(typeof d.kiemDongChuyenTiep({ huong: 'fast_track', toClassId: 1, toClass: { ma: 'FT', ft: true }, mucTieu: 6.3 }, { maTu: 'FOU' }) === 'string',
      'Mục tiêu không chia hết 0.5 phải báo lỗi');
    assert(d.kiemDongChuyenTiep({ huong: 'fast_track', toClassId: 1, toClass: { ma: 'FT', ft: true }, mucTieu: 6.5 }, { maTu: 'FOU' }) === null,
      'Mục tiêu hợp lệ thì qua');
  });

  check('PR-LT (1) · kiemDongChuyenTiep: bao_luu/xep_sau thiếu lý do hoặc ngày xem lại', () => {
    for (const huong of ['bao_luu', 'xep_sau'] as const) {
      assert(typeof d.kiemDongChuyenTiep({ huong }, { maTu: 'FOU' }) === 'string', `${huong} thiếu cả hai phải báo lỗi`);
      assert(typeof d.kiemDongChuyenTiep({ huong, lyDo: 'Ốm dài ngày' }, { maTu: 'FOU' }) === 'string', `${huong} thiếu ngày xem lại phải báo lỗi`);
      assert(d.kiemDongChuyenTiep({ huong, lyDo: 'Ốm dài ngày', ngayXemLai: '2026-11-01' }, { maTu: 'FOU' }) === null, `${huong} đủ thì qua`);
    }
  });

  check('PR-LT (1) · kiemDongChuyenTiep: dung_hoc thiếu lý do', () => {
    assert(typeof d.kiemDongChuyenTiep({ huong: 'dung_hoc' }, { maTu: 'FOU' }) === 'string', 'Thiếu lý do phải báo lỗi');
    assert(d.kiemDongChuyenTiep({ huong: 'dung_hoc', lyDo: 'Chuyển trường' }, { maTu: 'FOU' }) === null, 'Có lý do thì qua');
  });

  // ==================================================================== tomTatChuyenTiep — ví dụ mockup

  check('PR-LT (1) · tomTatChuyenTiep: 2 lên BE, 1 sang FT (mục tiêu 6.5, Case Writing đóng), 1 bảo lưu → đúng câu mockup', () => {
    const r = d.tomTatChuyenTiep([
      { huong: 'len_lop', toClassCode: 'MB-BE 14' },
      { huong: 'len_lop', toClassCode: 'MB-BE 14' },
      { huong: 'fast_track', toClassCode: 'MB-FT 105', mucTieu: 6.5, caseCount: 1, caseWillClose: true },
      { huong: 'bao_luu' },
    ]);
    assert(r.theoLop.length === 1 && r.theoLop[0].ma === 'MB-BE 14' && r.theoLop[0].n === 2, `theoLop: ${JSON.stringify(r.theoLop)}`);
    assert(r.sangFt === 1, `sangFt: ${r.sangFt}`);
    assert(r.khongChuyen.bao_luu === 1 && r.khongChuyen.dung_hoc === 0 && r.khongChuyen.xep_sau === 0, `khongChuyen: ${JSON.stringify(r.khongChuyen)}`);
    assert(r.caseDong === 1 && r.caseDiTheo === 0, `Case: đi theo=${r.caseDiTheo} đóng=${r.caseDong}`);
    assert(
      r.cau.join(' · ') === '2 em lên MB-BE 14 · 1 em sang MB-FT 105 (mở lộ trình FT, mục tiêu 6.5) · 1 em bảo lưu',
      `Câu bước Xác nhận: ${r.cau.join(' · ')}`,
    );
  });

  check('PR-LT (1) · tomTatChuyenTiep: baiChuaLam cộng dồn, không rơi mất dòng dung_hoc/xep_sau', () => {
    const r = d.tomTatChuyenTiep([
      { huong: 'dung_hoc', baiChuaLam: 2 },
      { huong: 'xep_sau', baiChuaLam: 1 },
    ]);
    assert(r.baiChuaLam === 3, `baiChuaLam: ${r.baiChuaLam}`);
    assert(r.khongChuyen.dung_hoc === 1 && r.khongChuyen.xep_sau === 1, JSON.stringify(r.khongChuyen));
    assert(r.cau.join(' · ') === '1 em dừng học · 1 em xếp sau', r.cau.join(' · '));
  });

  // ==================================================================== khoaLopThuong — ba nhánh phụ

  check('PR-LT (1) · khoaLopThuong: ưu tiên tiếp theo › nhắc › kết thúc khoá', () => {
    const base = { maChuongTrinh: 'FOU', tuanHienTai: 8, tongTuan: 8, tuanKetThuc: '2026-09-21', homNay: '2026-09-14' };
    assert(d.khoaLopThuong({ ...base, tiepTheo: 'BE', nhacLoTrinh: true }).phu === 'tiếp theo: BE', 'Có tiếp theo thì ưu tiên trên hết');
    assert(d.khoaLopThuong({ ...base, tiepTheo: null, nhacLoTrinh: true }).phu === 'chưa có lộ trình tiếp theo', 'Không tiếp theo, có nhắc');
    assert(d.khoaLopThuong({ ...base, tiepTheo: null, nhacLoTrinh: false }).phu === 'kết thúc W4 SEP', 'Không tiếp theo, không nhắc → kết thúc khoá');
  });

  // ==================================================================== badgeLop — thứ tự và cắt 2 badge

  check('PR-LT (1) · badgeLop: "chua-lo-trinh" đứng ngay sau "het-khoa", vẫn cắt tối đa 2 badge hiện', () => {
    const b = d.badgeLop({
      needsPlacement: true, canXepLop: 3, soChuaLoTrinhTiep: 5, missingSkills: ['writing'],
      needScoresText: null, soCaseMo: 0, phase: 'finished', missingCount: 0,
    });
    assert(b.hien.map((x: any) => x.key).join(',') === 'het-khoa,chua-lo-trinh', `Hai badge đầu: ${JSON.stringify(b.hien)}`);
    assert(b.an.map((x: any) => x.key).join(',') === 'thieu-gv', `Phần gom: ${JSON.stringify(b.an)}`);
    assert(b.hien[1].nhan === '5 HV chưa có lộ trình tiếp theo' && b.hien[1].tone === 'warn', JSON.stringify(b.hien[1]));
  });

  // ==================================================================== trongHaiTuanCuoi

  check('PR-LT (1) · trongHaiTuanCuoi: W6/8 sai, W7/8 đúng, đã hết khoá đúng dù không đủ tuần', () => {
    assert(d.trongHaiTuanCuoi(6, 8, 'running') === false, 'W6/8 chưa vào hai tuần cuối');
    assert(d.trongHaiTuanCuoi(7, 8, 'running') === true, 'W7/8 đã vào hai tuần cuối');
    assert(d.trongHaiTuanCuoi(8, 8, 'running') === true, 'W8/8 đã vào hai tuần cuối');
    assert(d.trongHaiTuanCuoi(1, 10, 'finished') === true, 'Đã hết khoá thì luôn đúng, kể cả tuần hiện tại thấp');
  });

  // ==================================================================== nhanKetThucVi — Q18 dòng cũ

  check('PR-LT (1) · nhanKetThucVi: có end_kind thì theo nhãn mới; dòng cũ không có cột thì suy từ status', () => {
    assert(d.nhanKetThucVi('len_lop', 'transferred') === 'Lên lớp', 'Có end_kind thì ưu tiên nhãn mới');
    assert(d.nhanKetThucVi(null, 'transferred') === 'Chuyển lớp', 'Dòng cũ transferred → Chuyển lớp');
    assert(d.nhanKetThucVi(null, 'completed') === 'Kết thúc học', 'Dòng cũ completed → Kết thúc học');
    assert(d.nhanKetThucVi(null, 'paused') === 'Tạm dừng học', 'Dòng cũ paused → Tạm dừng học');
    assert(d.nhanKetThucVi(null, 'active') === null, 'Đang học thì không có "kết thúc vì"');
  });

  // ==================================================================== chữ cấm §2/§6 (Normal, MT{n} cho lớp thường)

  check('PR-LT (1) · nhanHuong/nhanHuongNgan: không viết "Normal", lớp thường không có "MT{n}"', () => {
    for (const h of d.HUONG_CHUYEN_TIEP as readonly string[]) {
      const day = d.nhanHuong(h as any, { ma: 'FOU', maKe: 'BE' });
      const ngan = d.nhanHuongNgan(h as any, { ma: 'FOU', maKe: 'BE' });
      assert(!/Normal/i.test(day) && !/^MT\d/.test(day), `Nhãn đầy đủ "${day}" dính chữ cấm`);
      assert(!/Normal/i.test(ngan) && !/^MT\d/.test(ngan), `Nhãn ngắn "${ngan}" dính chữ cấm`);
    }
  });

  // ==================================================================== Task 2 — Migrate + schema

  console.log('\nPR-LT (2) · Migrate — bảng lo_trinh_tiep_theo, cột enrollments.end_kind, classes.finished_at');

  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const migrateMod: any = await import('../migrate.ts');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const SCHEMA = fsMod.readFileSync(pathMod.join(REPO, 'server/src/schema.sql'), 'utf8');
  const colsOf = (db: any, table: string): string[] =>
    (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c) => `${c.name}:${c.type}:${c.notnull}`);
  const idxOf = (db: any, table: string): string[] =>
    (db.prepare(`PRAGMA index_list(${table})`).all() as any[]).map((i) => i.name).sort();
  /** Database THỜI TRƯỚC PR-LT: schema hiện tại, gỡ đúng bảng + hai cột + chỉ mục PR-LT thêm. */
  const preLT = () => {
    const m = new SqliteDb(':memory:');
    m.exec(SCHEMA);
    m.exec(`DROP TABLE lo_trinh_tiep_theo;
            DROP INDEX idx_class_status;
            ALTER TABLE enrollments DROP COLUMN end_kind;
            ALTER TABLE classes DROP COLUMN finished_at;`);
    return m;
  };

  check('PR-LT (2) · Migrate: database dựng từ schema.sql có bảng lo_trinh_tiep_theo và hai cột mới', () => {
    const cols = colsOf(conn, 'lo_trinh_tiep_theo').map((c) => c.split(':')[0]);
    for (const c of ['student_id', 'class_id', 'huong', 'lop_du_kien_id', 'muc_tieu', 'thang_thi', 'ghi_chu', 'ly_do',
      'ngay_xem_lai', 'da_ap_dung_luc', 'updated_by', 'created_at', 'updated_at']) {
      assert(cols.includes(c), `lo_trinh_tiep_theo thiếu cột ${c}`);
    }
    assert(colsOf(conn, 'enrollments').map((c) => c.split(':')[0]).includes('end_kind'), 'enrollments thiếu end_kind');
    assert(colsOf(conn, 'classes').map((c) => c.split(':')[0]).includes('finished_at'), 'classes thiếu finished_at');
  });

  check('PR-LT (2) · Migrate: database cũ được nâng cấp đúng bảng/cột/chỉ mục như schema.sql (cùng tên, kiểu, chỉ mục)', () => {
    const m = preLT();
    const applied: string[] = [];
    migrateMod.migrateLenLop(m, applied);
    assert(applied.length === 1 && /PR-LT/.test(applied[0]), `Phải báo đúng một dòng PR-LT: ${applied.join(' | ')}`);
    const fresh = new SqliteDb(':memory:');
    fresh.exec(SCHEMA);
    for (const tb of ['lo_trinh_tiep_theo', 'enrollments', 'classes']) {
      assert(JSON.stringify(colsOf(m, tb)) === JSON.stringify(colsOf(fresh, tb)),
        `${tb} sau nâng cấp khác schema.sql:\n  ${colsOf(m, tb).join(',')}\n  ${colsOf(fresh, tb).join(',')}`);
    }
    for (const tb of ['lo_trinh_tiep_theo', 'classes']) {
      assert(JSON.stringify(idxOf(m, tb)) === JSON.stringify(idxOf(fresh, tb)), `Chỉ mục của ${tb} khác schema.sql`);
    }
  });

  check('PR-LT (2) · Migrate: chạy lần hai không làm gì; database mới từ schema.sql không có gì để nâng cấp; UNIQUE(student_id, class_id) chặn trùng', () => {
    const m = preLT();
    migrateMod.migrateLenLop(m, []);
    const again: string[] = [];
    migrateMod.migrateLenLop(m, again);
    assert(again.length === 0, `Lần hai phải không làm gì: ${again.join(' | ')}`);
    const fresh = new SqliteDb(':memory:');
    fresh.exec(SCHEMA);
    const none: string[] = [];
    migrateMod.migrateLenLop(fresh, none);
    assert(none.length === 0, `Database mới không được có gì để nâng cấp: ${none.join(' | ')}`);
    const now = new Date().toISOString();
    m.pragma('foreign_keys = OFF');   // chỉ kiểm UNIQUE của lo_trinh_tiep_theo, không cần dựng đủ branch/class thật
    m.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES ('PISA-LT2','x','x',1,'active',?)`).run(now);
    m.prepare(`INSERT INTO classes (code, branch_id, kind, status, created_at) VALUES ('PISA-LT2-CLS',1,'FOU','active',?)`).run(now);
    const sid = (m.prepare('SELECT id FROM students ORDER BY id DESC LIMIT 1').get() as any).id;
    const cid = (m.prepare('SELECT id FROM classes ORDER BY id DESC LIMIT 1').get() as any).id;
    const ins = () => m.prepare(
      `INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, created_at, updated_at) VALUES (?,?,'chua_ro',?,?)`,
    ).run(sid, cid, now, now);
    ins();
    let threw = false;
    try { ins(); } catch { threw = true; }
    assert(threw, 'UNIQUE(student_id, class_id) phải chặn dòng trùng');
  });

  check('PR-LT (2) · Migrate: `migrate()` trọn chuỗi chạy hai lần trên database đang dùng, lần hai không áp lại bước PR-LT', () => {
    migrateMod.migrate();
    const second = migrateMod.migrate();
    assert(!second.applied.some((x: string) => /PR-LT/.test(x)), `Lần hai áp lại PR-LT: ${second.applied.join(' | ')}`);
  });
}
