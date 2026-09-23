/**
 * PHÉP KIỂM PR-LT — Lên lớp, chuyển lớp.
 * Harness (`check`, `assert`, dữ liệu demo) do `run.ts` sở hữu và truyền vào.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runLenLopTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn } = t;
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

  // ==================================================================== Task 3 — Máy chủ: Lộ trình tiếp theo

  console.log('\nPR-LT (3) · Máy chủ: Lộ trình tiếp theo, nhắc hai tuần cuối, việc đỏ Hết khoá theo hướng');

  const { P, TODAY: TODAY3, addDays: addDays3, classId } = t;
  const week = await import('../platform/week.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const intake = await import('../classes/intake.ts');
  const classesSvc = await import('../classes/classes.ts');
  const loTrinhTiepSvc = await import('../classes/loTrinhTiep.ts');
  const scheduleSvc = await import('../classes/schedule.ts');
  const myworkSvc = await import('../worklist/mywork.ts');
  const profileSvc = await import('../students/profile.ts');

  const MB3 = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const thisMonday3 = week.mondayOf(TODAY3);
  const mondayForWeek3 = (n: number) => addDays3(thisMonday3, -7 * (n - 1));
  let lt3Seq = 0;

  /** Lớp thường FOU 8 tuần, tuần hiện tại = `tuanHienTai` (âm/ngoài [1,10] cho hết khoá). */
  function taoLopThuong3(tuanHienTai: number): number {
    lt3Seq += 1;
    const startPeriodId = week.ensurePeriod(mondayForWeek3(tuanHienTai)).id;
    const r = intake.createClass(P.admin, {
      code: `MB-LT3-${lt3Seq}`, branchId: MB3, kind: 'FOU', isFastTrack: false,
      startDate: mondayForWeek3(tuanHienTai), startPeriodId,
    }) as any;
    return r.id as number;
  }
  /** Gán GVCN rồi trả về Principal NẠP LẠI — `P.*` được nạp một lần lúc dựng harness, không tự thấy phân công mới. */
  function ganGVCN3(clsId: number, userId: number) {
    conn.prepare(
      `INSERT INTO teacher_assignments (user_id, class_id, is_core, effective_from, status, created_at)
       VALUES (?, ?, 1, '2026-01-01', 'active', ?)`,
    ).run(userId, clsId, new Date().toISOString());
    return loadPrincipal(userId);
  }
  function taoHocVien3(clsId: number, ma: string): { sid: number } {
    lt3Seq += 1;
    const tag = `LT3-${lt3Seq}`;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, `Hoc vien ${tag}`, `hoc vien ${tag}`.toLowerCase(), MB3, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
      .run(sid, clsId, mondayForWeek3(8), now);
    conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at)
       VALUES (?, 1, NULL, ?, NULL, ?, 'active', ?)`,
    ).run(sid, ma, mondayForWeek3(8), now);
    return { sid };
  }

  const HV1 = 1; // seed: FOU→BE→FT, lộ trình đang chạy hiện tại là FT (hanhTrinh.tests.ts)

  check('PR-LT (3) · PUT /students/:id/lo-trinh-tiep: GVCN lớp thường ghi được', () => {
    const cls = taoLopThuong3(3);
    const gvcn = ganGVCN3(cls, P.normalCoreTeacher.userId);
    const { sid } = taoHocVien3(cls, 'FOU');
    const r = loTrinhTiepSvc.ghiLoTrinhTiep(gvcn, sid, { huong: 'len_lop' });
    assert(r.banGhi?.huong === 'len_lop', `Phải ghi được: ${JSON.stringify(r.banGhi)}`);
  });

  check('PR-LT (3) · PUT /students/:id/lo-trinh-tiep: GVBM không dạy lớp này → 403', () => {
    const cls = taoLopThuong3(3);
    ganGVCN3(cls, P.normalCoreTeacher.userId);
    const { sid } = taoHocVien3(cls, 'FOU');
    assertThrows(() => loTrinhTiepSvc.ghiLoTrinhTiep(P.normalSubjectTeacher, sid, { huong: 'bao_luu', ghiChu: 'x' }),
      /quyền/, 'GVBM không dạy lớp này phải bị chặn');
  });

  check('PR-LT (3) · PUT /students/:id/lo-trinh-tiep: em đang học lớp FT → 400 (chỉ áp dụng lớp thường)', () => {
    const enr = conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`).get(HV1) as any;
    const gvcnId = (conn.prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 LIMIT 1`).get(enr.class_id) as any).user_id;
    assertThrows(() => loTrinhTiepSvc.ghiLoTrinhTiep(loadPrincipal(gvcnId), HV1, { huong: 'len_lop' }),
      /lớp thường/, 'Lớp FT phải bị chặn 400');
  });

  check('PR-LT (3) · GET /students/:id/lo-trinh-tiep: lopDuKien gồm bậc kế + Fast Track cùng chi nhánh, coTheGhi đúng quyền', () => {
    const cls = classId('MB-FOU 12');
    const { sid } = taoHocVien3(cls, 'FOU');
    const view = loTrinhTiepSvc.layLoTrinhTiep(P.normalCoreTeacher, sid);
    assert(view.lop?.ma === 'FOU' && view.lop.maKe === 'BE', `lop: ${JSON.stringify(view.lop)}`);
    const mas = view.lopDuKien.map((l: any) => l.ma);
    assert(mas.includes('BE'), `Phải có bậc kế BE trong lớp dự kiến: ${mas.join(',')}`);
    assert(view.lopDuKien.some((l: any) => l.ft), `Phải có ít nhất một lớp Fast Track: ${JSON.stringify(view.lopDuKien)}`);
    assert(view.coTheGhi === true, 'GVCN của lớp phải ghi được');
    const viewGvbm = loTrinhTiepSvc.layLoTrinhTiep(P.normalSubjectTeacher, sid);
    assert(viewGvbm.coTheGhi === false, 'GVBM không kiêm GVCN thì không ghi được');
  });

  check('PR-LT (3) · classRoster: cột "tiếp theo" trả đúng mã bậc kế sau khi ghi Lộ trình tiếp theo len_lop', () => {
    const cls = taoLopThuong3(3);
    const gvcn = ganGVCN3(cls, P.normalCoreTeacher.userId);
    const { sid } = taoHocVien3(cls, 'FOU');
    loTrinhTiepSvc.ghiLoTrinhTiep(gvcn, sid, { huong: 'len_lop' });
    const roster = classesSvc.classRoster(P.admin, cls) as any[];
    const row = roster.find((r) => r.id === sid);
    assert(row?.tiepTheo === 'BE', `tiepTheo: ${row?.tiepTheo}`);
    assert(row?.chuaLoTrinh === false, 'Đã ghi rồi thì không còn tính là chưa có lộ trình');
  });

  check('PR-LT (3) · chua_ro: không hiện "tiếp theo" nhưng VẪN tính vào soChuaLoTrinhTiep (Q4 — không tắt nhắc)', () => {
    const cls = taoLopThuong3(7);
    const gvcn = ganGVCN3(cls, P.normalCoreTeacher.userId);
    const { sid } = taoHocVien3(cls, 'FOU');
    loTrinhTiepSvc.ghiLoTrinhTiep(gvcn, sid, { huong: 'chua_ro', ghiChu: 'Chưa quyết' });
    const roster = classesSvc.classRoster(P.admin, cls) as any[];
    const row = roster.find((r) => r.id === sid);
    assert(row?.tiepTheo === null, `chua_ro không hiện "tiếp theo": ${row?.tiepTheo}`);
    assert(row?.chuaLoTrinh === true, 'chua_ro vẫn tính là chưa có lộ trình');
    const r = classesSvc.listClassSummaries(P.admin, { branchId: MB3 }).rows.find((x) => x.id === cls)!;
    assert(r.soChuaLoTrinhTiep === 1, `Vẫn đếm vào nhắc: ${r.soChuaLoTrinhTiep}`);
  });

  check('PR-LT (3) · listClassSummaries: soChuaLoTrinhTiep = 0 ở W6/8 (chưa vào hai tuần cuối), = n ở W7/8', () => {
    const clsW6 = taoLopThuong3(6);
    taoHocVien3(clsW6, 'FOU');
    const clsW7 = taoLopThuong3(7);
    taoHocVien3(clsW7, 'FOU'); taoHocVien3(clsW7, 'FOU');
    const rows = classesSvc.listClassSummaries(P.admin, { branchId: MB3 }).rows;
    const r6 = rows.find((r) => r.id === clsW6)!;
    const r7 = rows.find((r) => r.id === clsW7)!;
    assert(r6.soChuaLoTrinhTiep === 0, `W6/8 phải 0: ${r6.soChuaLoTrinhTiep}`);
    assert(r7.soChuaLoTrinhTiep === 2, `W7/8 phải 2: ${r7.soChuaLoTrinhTiep}`);
  });

  check('PR-LT (3) · myWork: việc "Chưa có lộ trình tiếp theo" chỉ có với GVCN của lớp, không có với GVBM và QL', () => {
    const cls = taoLopThuong3(7);
    const gvcn = ganGVCN3(cls, P.normalCoreTeacher.userId);
    taoHocVien3(cls, 'FOU');
    const co = (p: any) => (myworkSvc.myWork(p, {}) as any).items.some((i: any) => i.group === 'next_step' && i.classId === cls);
    assert(co(gvcn), 'GVCN phải thấy việc');
    assert(!co(P.normalSubjectTeacher), 'GVBM không thấy việc (không phải GVCN của lớp)');
    assert(!co(P.mbManager), 'QL không thấy việc next_step (đã có việc đỏ Hết khoá riêng — Q5)');
  });

  check('PR-LT (3) · canXepLop trừ em "xếp sau" còn hạn xem lại; hết đỏ khi mọi em có hướng; qua ngày xem lại thì đỏ lại (Q9)', () => {
    const cls = taoLopThuong3(9); // đã hết khoá (9 > 8 tuần)
    const { sid: s1 } = taoHocVien3(cls, 'FOU');
    const { sid: s2 } = taoHocVien3(cls, 'FOU');
    let pr = scheduleSvc.classProgress(cls);
    assert(pr.phase === 'finished' && pr.canXepLop === 2, `Tiền đề hết khoá, 2 em cần xếp: ${JSON.stringify(pr)}`);
    const now = new Date().toISOString();
    conn.prepare(
      `INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, ly_do, ngay_xem_lai, created_at, updated_at) VALUES (?,?,'xep_sau',?,?,?,?)`,
    ).run(s1, cls, 'Ốm dài ngày', addDays3(TODAY3, 14), now, now);
    pr = scheduleSvc.classProgress(cls);
    assert(pr.canXepLop === 1, `Còn 1 em cần xếp: ${pr.canXepLop}`);
    conn.prepare(
      `INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, ly_do, ngay_xem_lai, created_at, updated_at) VALUES (?,?,'xep_sau',?,?,?,?)`,
    ).run(s2, cls, 'Chờ phụ huynh', addDays3(TODAY3, 7), now, now);
    pr = scheduleSvc.classProgress(cls);
    assert(pr.canXepLop === 0 && pr.needsPlacement === false, `Hết đỏ khi mọi em có hướng: ${JSON.stringify(pr)}`);
    conn.prepare(`UPDATE lo_trinh_tiep_theo SET ngay_xem_lai = ? WHERE student_id = ?`).run(addDays3(TODAY3, -1), s1);
    pr = scheduleSvc.classProgress(cls);
    assert(pr.canXepLop === 1 && pr.needsPlacement === true, `Qua ngày xem lại thì đỏ lại: ${JSON.stringify(pr)}`);
  });

  check('PR-LT (3) · profile.lopHoc.quyen: luuTru chỉ QL (PLAN_WEEK) với em đã kết thúc, GVCN luôn false', () => {
    const cls = taoLopThuong3(3);
    const gvcn = ganGVCN3(cls, P.normalCoreTeacher.userId);
    const { sid } = taoHocVien3(cls, 'FOU');
    conn.prepare(`UPDATE students SET status = 'finished' WHERE id = ?`).run(sid);
    const profGvcn = profileSvc.studentProfile(gvcn, sid) as any;
    const profQl = profileSvc.studentProfile(P.mbManager, sid) as any;
    assert(profGvcn.lopHoc.quyen.luuTru === false, `GVCN không có PLAN_WEEK: ${profGvcn.lopHoc.quyen.luuTru}`);
    assert(profQl.lopHoc.quyen.luuTru === true, `QL + em đã kết thúc: ${profQl.lopHoc.quyen.luuTru}`);
  });

  check('PR-LT (3) · classRoster: số câu SQL không tăng theo số học viên (tiepTheoTheoHocVien không phá N+1)', () => {
    const cls = taoLopThuong3(3);
    taoHocVien3(cls, 'FOU');
    const demTruyVan = (fn: () => void): number => {
      let n = 0;
      const orig = conn.prepare.bind(conn);
      (conn as any).prepare = (sql: string) => { n += 1; return orig(sql); };
      try { fn(); } finally { (conn as any).prepare = orig; }
      return n;
    };
    const truoc = demTruyVan(() => { classesSvc.classRoster(P.admin, cls); });
    taoHocVien3(cls, 'FOU'); taoHocVien3(cls, 'FOU');
    const sau = demTruyVan(() => { classesSvc.classRoster(P.admin, cls); });
    assert(sau <= truoc + 1, `Thêm 2 em không được tăng nhiều câu lệnh: ${truoc} → ${sau}`);
  });
}
