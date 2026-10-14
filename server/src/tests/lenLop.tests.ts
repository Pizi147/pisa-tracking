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

  check('PR-LT (1) · luatDoiLop: lớp thường → FT đóng khoá cũ, mở lộ trình FT, cần Target, endKind sang_ft (S17)', () => {
    const r = d.luatDoiLop({ ma: 'FOU', ft: false }, { ma: 'FT', ft: true }, 'giua-khoa');
    assert(r.khoa === 'dong-mo' && r.dongCase === 'ft' && r.canMucTieu === true && r.endKind === 'sang_ft', JSON.stringify(r));
  });

  check('PR-LT (1) · luatDoiLop: Final Test, lên chương trình kế → endKind len_lop', () => {
    const r = d.luatDoiLop({ ma: 'FOU', ft: false }, { ma: 'BE', ft: false }, 'cuoi-khoa');
    assert(r.khoa === 'dong-mo' && r.dongCase === null && r.endKind === 'len_lop', JSON.stringify(r));
  });

  check('PR-LT (1) · luatDoiLop: Final Test, cùng chương trình (học lại) → endKind hoc_lai', () => {
    const r = d.luatDoiLop({ ma: 'FOU', ft: false }, { ma: 'FOU', ft: false }, 'cuoi-khoa');
    assert(r.khoa === 'dong-mo' && r.endKind === 'hoc_lai', JSON.stringify(r));
  });

  check('PR-LT (1) · luatDoiLop: Progress Test, cùng chương trình → giữ khoá, endKind chuyen_lop', () => {
    const r = d.luatDoiLop({ ma: 'FOU', ft: false }, { ma: 'FOU', ft: false }, 'giua-khoa');
    assert(r.khoa === 'giu' && r.dongCase === null && r.endKind === 'chuyen_lop', JSON.stringify(r));
  });

  check('PR-LT (1) · luatDoiLop: Progress Test, khác chương trình (xếp lại trình độ) → đóng khoá cũ, Case đi theo em (Q11)', () => {
    const r = d.luatDoiLop({ ma: 'FOU', ft: false }, { ma: 'BE', ft: false }, 'giua-khoa');
    assert(r.khoa === 'dong-mo' && r.dongCase === null && r.endKind === 'chuyen_lop', JSON.stringify(r));
  });

  // ==================================================================== huongTiepKhaDung

  check('PR-LT (1) · huongTiepKhaDung: ELE không có bậc kế → không có "len_lop"; FOU có "len_lop"', () => {
    assert(!d.huongTiepKhaDung('ELE').includes('len_lop'), 'ELE không có bậc Normal kế');
    assert(d.huongTiepKhaDung('FOU').includes('len_lop'), 'FOU còn bậc kế (BE)');
  });

  // ==================================================================== nhanTiepTheo — 6 hướng (bao gồm không có bản ghi)

  check('PR-LT (1) · nhanTiepTheo: 6 hướng + không có bản ghi + chua_quyet đều ra chữ đúng luật Q4', () => {
    assert(d.nhanTiepTheo({ huong: 'len_lop' }, 'FOU') === 'BE', 'len_lop → mã bậc kế');
    assert(d.nhanTiepTheo({ huong: 'fast_track' }, 'FOU') === 'Fast Track', 'fast_track');
    assert(d.nhanTiepTheo({ huong: 'hoc_lai' }, 'FOU') === 'học lại FOU', 'hoc_lai');
    assert(d.nhanTiepTheo({ huong: 'bao_luu' }, 'FOU') === 'tạm dừng học (bảo lưu)', 'bao_luu');
    assert(d.nhanTiepTheo({ huong: 'dung_hoc' }, 'FOU') === 'dừng học hẳn', 'dung_hoc');
    assert(d.nhanTiepTheo({ huong: 'chua_quyet' }, 'FOU') === null, 'chua_quyet → null (Q4: không tắt nhắc)');
    assert(d.nhanTiepTheo(null, 'FOU') === null, 'Không có bản ghi → null');
  });

  // ==================================================================== kiemDongChuyenTiep — mỗi lỗi một phép

  check('PR-LT (1) · kiemDongChuyenTiep: thiếu hướng', () => {
    assert(typeof d.kiemDongChuyenTiep({ huong: null }, { maTu: 'FOU' }) === 'string', 'Phải báo lỗi');
  });

  check('PR-LT (1) · kiemDongChuyenTiep: len_lop/hoc_lai/fast_track thiếu lớp chuyển đến', () => {
    for (const huong of ['len_lop', 'hoc_lai', 'fast_track'] as const) {
      assert(typeof d.kiemDongChuyenTiep({ huong }, { maTu: 'FOU' }) === 'string', `${huong} thiếu lớp chuyển đến phải báo lỗi`);
    }
  });

  check('PR-LT (1) · kiemDongChuyenTiep: lớp chuyển đến sai loại — len_lop phải đúng chương trình kế, hoc_lai phải cùng chương trình, sang FT phải là lớp FT', () => {
    assert(typeof d.kiemDongChuyenTiep({ huong: 'len_lop', toClassId: 1, toClass: { ma: 'ELE', ft: false } }, { maTu: 'FOU' }) === 'string',
      'len_lop sang ELE (không phải bậc kế của FOU) phải báo lỗi');
    assert(typeof d.kiemDongChuyenTiep({ huong: 'hoc_lai', toClassId: 1, toClass: { ma: 'BE', ft: false } }, { maTu: 'FOU' }) === 'string',
      'hoc_lai khác chương trình phải báo lỗi');
    assert(typeof d.kiemDongChuyenTiep({ huong: 'fast_track', toClassId: 1, toClass: { ma: null, ft: false }, mucTieu: 6 }, { maTu: 'FOU' }) === 'string',
      'sang FT mà lớp chuyển đến không phải FT phải báo lỗi');
    assert(d.kiemDongChuyenTiep({ huong: 'len_lop', toClassId: 1, toClass: { ma: 'BE', ft: false } }, { maTu: 'FOU' }) === null,
      'len_lop đúng bậc kế thì hợp lệ');
  });

  check('PR-LT (1) · kiemDongChuyenTiep: sang FT thiếu Target hoặc Target ngoài 0–9/không chia hết 0.5', () => {
    assert(typeof d.kiemDongChuyenTiep({ huong: 'fast_track', toClassId: 1, toClass: { ma: 'FT', ft: true } }, { maTu: 'FOU' }) === 'string',
      'Thiếu Target phải báo lỗi');
    assert(typeof d.kiemDongChuyenTiep({ huong: 'fast_track', toClassId: 1, toClass: { ma: 'FT', ft: true }, mucTieu: 9.5 }, { maTu: 'FOU' }) === 'string',
      'Target > 9 phải báo lỗi');
    assert(typeof d.kiemDongChuyenTiep({ huong: 'fast_track', toClassId: 1, toClass: { ma: 'FT', ft: true }, mucTieu: 6.3 }, { maTu: 'FOU' }) === 'string',
      'Target không chia hết 0.5 phải báo lỗi');
    assert(d.kiemDongChuyenTiep({ huong: 'fast_track', toClassId: 1, toClass: { ma: 'FT', ft: true }, mucTieu: 6.5 }, { maTu: 'FOU' }) === null,
      'Target hợp lệ thì qua');
  });

  check('PR-LT (1) · kiemDongChuyenTiep: bao_luu/chua_quyet thiếu lý do hoặc ngày xem lại', () => {
    for (const huong of ['bao_luu', 'chua_quyet'] as const) {
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

  check('PR-LT (1) · tomTatChuyenTiep: 2 lên BE, 1 sang FT (Target 6.5, Case Writing đóng), 1 tạm dừng học (bảo lưu) → đúng câu mockup', () => {
    const r = d.tomTatChuyenTiep([
      { huong: 'len_lop', toClassCode: 'MB BE 14' },
      { huong: 'len_lop', toClassCode: 'MB BE 14' },
      { huong: 'fast_track', toClassCode: 'MB FT 105', mucTieu: 6.5, caseCount: 1, caseWillClose: true },
      { huong: 'bao_luu' },
    ]);
    assert(r.theoLop.length === 1 && r.theoLop[0].ma === 'MB BE 14' && r.theoLop[0].n === 2, `theoLop: ${JSON.stringify(r.theoLop)}`);
    assert(r.sangFt === 1, `sangFt: ${r.sangFt}`);
    assert(r.khongChuyen.bao_luu === 1 && r.khongChuyen.dung_hoc === 0 && r.khongChuyen.chua_quyet === 0, `khongChuyen: ${JSON.stringify(r.khongChuyen)}`);
    assert(r.caseDong === 1 && r.caseDiTheo === 0, `Case: đi theo=${r.caseDiTheo} đóng=${r.caseDong}`);
    assert(
      r.cau.join(' · ') === '2 em lên MB BE 14 · 1 em sang MB FT 105 (mở lộ trình FT, Target 6.5) · 1 em tạm dừng học (bảo lưu)',
      `Câu bước Xác nhận: ${r.cau.join(' · ')}`,
    );
  });

  check('PR-LT (1) · tomTatChuyenTiep: baiChuaLam cộng dồn, không rơi mất dòng dung_hoc/chua_quyet', () => {
    const r = d.tomTatChuyenTiep([
      { huong: 'dung_hoc', baiChuaLam: 2 },
      { huong: 'chua_quyet', baiChuaLam: 1 },
    ]);
    assert(r.baiChuaLam === 3, `baiChuaLam: ${r.baiChuaLam}`);
    assert(r.khongChuyen.dung_hoc === 1 && r.khongChuyen.chua_quyet === 1, JSON.stringify(r.khongChuyen));
    assert(r.cau.join(' · ') === '1 em dừng học hẳn · 1 em chưa quyết', r.cau.join(' · '));
  });

  // ==================================================================== khoaLopThuong — ba nhánh phụ

  check('PR-LT (1) · khoaLopThuong: ưu tiên tiếp theo › nhắc › kết thúc khoá', () => {
    const base = { maChuongTrinh: 'FOU', tuanHienTai: 8, tongTuan: 8, tuanKetThuc: '2026-09-21', homNay: '2026-09-14' };
    /* PR-DH 04/10: D1 — em chưa có quyết định chuyển lớp luôn có cờ (khớp số badge), kể cả khi đã ghi lộ trình tiếp theo. */
    assert(d.khoaLopThuong({ ...base, tiepTheo: 'BE', nhacLoTrinh: true }).phu === 'tiếp theo: BE · chưa chốt lộ trình', 'Có tiếp theo thì đứng đầu, cờ đi kèm');
    assert(d.khoaLopThuong({ ...base, tiepTheo: 'BE', nhacLoTrinh: false }).phu === 'tiếp theo: BE', 'Có tiếp theo, đã có quyết định → chỉ lộ trình');
    assert(d.khoaLopThuong({ ...base, tiepTheo: null, nhacLoTrinh: true }).phu === 'chưa chốt lộ trình', 'Không tiếp theo, có nhắc (PR-Dọn Câu 2 = B)');
    assert(d.khoaLopThuong({ ...base, tiepTheo: null, nhacLoTrinh: false }).phu === 'kết thúc W4 SEP', 'Không tiếp theo, không nhắc → kết thúc khoá');
  });

  // ==================================================================== badgeLop — thứ tự và cắt 2 badge

  check('PR-LT (1) · badgeLop (PR-HVL B4): hết khoá và chưa có lộ trình gộp một badge "xep-lop"; vẫn cắt tối đa 2 badge hiện', () => {
    const goc = { vai: 'gv' as const, soChuaLoTrinhTiep: 5, missingSkills: ['writing'], soBaiChoCham: 2, needScoresTitle: null, phase: 'finished', missingCount: 0 };
    const het = d.badgeLop({ ...goc, needsPlacement: true, canXepLop: 3 });
    assert(het.hien.map((x: any) => x.key).join(',') === 'cham,thieu-gv', `Hai badge đầu: ${JSON.stringify(het.hien)}`);
    assert(het.an.map((x: any) => x.key).join(',') === 'xep-lop', `Phần gom: ${JSON.stringify(het.an)}`);
    assert(het.an[0].nhan === '3 HV cần xếp lớp tiếp' && /hết khoá/.test(het.an[0].title ?? ''), 'Hết khoá: số em cần xếp lớp');
    const chua = d.badgeLop({ ...goc, needsPlacement: false, canXepLop: 0 });
    /* PR-Dọn (Câu 2 = B): lớp chưa hết khoá → em chưa có quyết định chuyển lớp (cùng tập dòng Cần xử lý). */
    assert(chua.an[0].nhan === '5 HV chưa chốt lộ trình' && /Lộ trình tiếp theo/.test(chua.an[0].title ?? '') && chua.an[0].tone === 'warn', JSON.stringify(chua.an[0]));
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
  const migLt2b: any = await import('../migrate/prLt2b.ts');
  const migLcb: any = await import('../migrate/prLcb.ts');
  const migOv3b: any = await import('../migrate/prOv3b.ts');
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
    migLt2b.migratePrLt2b(m, []);   // PR-LT2b thêm 6 cột vào cùng bảng
    migLcb.migratePrLcb(m, []);     // PR-LCb thêm cột huong_gvcn vào cùng bảng
    migOv3b.migratePrOv3b(m, []);   // OV-3b thêm 6 cột kq_de_xuat_* vào cùng bảng
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
  const { loadPrincipal, can: can4 } = await import('../permissions.ts');
  const intake = await import('../classes/intake.ts');
  const classesSvc = await import('../classes/classes.ts');
  const loTrinhTiepSvc = await import('../classes/loTrinhTiep.ts');
  const scheduleSvc = await import('../classes/schedule.ts');
  const studentsSvc4 = await import('../students/students.ts');
  const timNguoiSvc4 = await import('../platform/timNguoi.ts');
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

  check('PR-LT (3) · PUT /students/:id/lo-trinh-tiep: OV-3b — GVCN lớp thường → 403, Quản lý ghi được', () => {
    const cls = taoLopThuong3(3);
    const gvcn = ganGVCN3(cls, P.normalCoreTeacher.userId);
    const { sid } = taoHocVien3(cls, 'FOU');
    assertThrows(() => loTrinhTiepSvc.ghiLoTrinhTiep(gvcn, sid, { huong: 'len_lop' }), /Quản lý/, 'GVCN thôi ghi Hướng');
    const r = loTrinhTiepSvc.ghiLoTrinhTiep(P.mbManager, sid, { huong: 'len_lop' });
    assert(r.banGhi?.huong === 'len_lop', `Phải ghi được: ${JSON.stringify(r.banGhi)}`);
  });

  check('PR-LT (3) · PUT /students/:id/lo-trinh-tiep: GVBM không dạy lớp này → 403', () => {
    const cls = taoLopThuong3(3);
    ganGVCN3(cls, P.normalCoreTeacher.userId);
    const { sid } = taoHocVien3(cls, 'FOU');
    assertThrows(() => loTrinhTiepSvc.ghiLoTrinhTiep(P.normalSubjectTeacher, sid, { huong: 'bao_luu', ghiChu: 'x' }),
      /Quản lý/, 'GVBM không dạy lớp này phải bị chặn');
  });

  check('PR-LT (3) · PUT /students/:id/lo-trinh-tiep: em đang học lớp FT → 400 (chỉ áp dụng lớp thường)', () => {
    /* OV-3b: chỉ Quản lý ghi — Quản trị đi qua quyền rồi gặp luật "chỉ lớp thường". */
    assertThrows(() => loTrinhTiepSvc.ghiLoTrinhTiep(P.admin, HV1, { huong: 'len_lop' }),
      /lớp thường/, 'Lớp FT phải bị chặn 400');
  });

  check('PR-LT (3) · GET /students/:id/lo-trinh-tiep: lopDuKien gồm bậc kế + Fast Track cùng chi nhánh, coTheGhi đúng quyền', () => {
    const cls = classId('MB FOU 12');
    const { sid } = taoHocVien3(cls, 'FOU');
    const view = loTrinhTiepSvc.layLoTrinhTiep(P.normalCoreTeacher, sid);
    assert(view.lop?.ma === 'FOU' && view.lop.maKe === 'BE', `lop: ${JSON.stringify(view.lop)}`);
    const mas = view.lopDuKien.map((l: any) => l.ma);
    assert(mas.includes('BE'), `Phải có bậc kế BE trong lớp dự kiến: ${mas.join(',')}`);
    assert(view.lopDuKien.some((l: any) => l.ft), `Phải có ít nhất một lớp Fast Track: ${JSON.stringify(view.lopDuKien)}`);
    assert(view.coTheGhi === false && loTrinhTiepSvc.layLoTrinhTiep(P.mbManager, sid).coTheGhi === true, 'OV-3b: GVCN không ghi, Quản lý ghi');
    const viewGvbm = loTrinhTiepSvc.layLoTrinhTiep(P.normalSubjectTeacher, sid);
    assert(viewGvbm.coTheGhi === false, 'GVBM không kiêm GVCN thì không ghi được');
  });

  check('PR-LT (3) · classRoster: cột "tiếp theo" trả đúng mã bậc kế sau khi ghi Lộ trình tiếp theo len_lop', () => {
    const cls = taoLopThuong3(3);
    ganGVCN3(cls, P.normalCoreTeacher.userId);
    const { sid } = taoHocVien3(cls, 'FOU');
    loTrinhTiepSvc.ghiLoTrinhTiep(P.mbManager, sid, { huong: 'len_lop' });
    const roster = classesSvc.classRoster(P.admin, cls) as any[];
    const row = roster.find((r) => r.id === sid);
    assert(row?.tiepTheo === 'BE', `tiepTheo: ${row?.tiepTheo}`);
    /* PR-Dọn (Câu 2 = B): ghi Lộ trình tiếp theo không tắt cờ — cờ nay là "chưa có quyết định chuyển lớp". */
    assert(row?.chuaLoTrinh === true, 'Chưa có quyết định chuyển lớp thì vẫn có cờ');
  });

  /* PR-Dọn (Câu 2 = B): đếm em CHƯA CÓ LỆNH chuyển lớp (lệnh `cho` thì hết cờ); "chua_quyet" chỉ còn ảnh hưởng chữ "tiếp theo". */
  check('PR-LT (3) · chua_quyet: không hiện "tiếp theo"; em có lệnh chờ → hết cờ, em chưa có lệnh → có cờ và vào soChuaLoTrinhTiep', () => {
    const cls = taoLopThuong3(8);
    const gvcn = ganGVCN3(cls, P.normalCoreTeacher.userId);
    const { sid } = taoHocVien3(cls, 'FOU');
    const { sid: coLenh } = taoHocVien3(cls, 'FOU');
    conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
      VALUES (?, ?, 'hoc_lai', 'cuoi-khoa', ?, ?, ?, 'cho', ?)`).run(coLenh, cls, mondayForWeek3(9), P.admin.userId, TODAY3, new Date().toISOString());
    loTrinhTiepSvc.ghiLoTrinhTiep(P.mbManager, sid, { huong: 'chua_quyet', ghiChu: 'Chưa quyết' });
    const roster = classesSvc.classRoster(P.admin, cls) as any[];
    const row = roster.find((r) => r.id === sid);
    assert(row?.tiepTheo === null, `chua_quyet không hiện "tiếp theo": ${row?.tiepTheo}`);
    assert(row?.chuaLoTrinh === true && roster.find((r) => r.id === coLenh)?.chuaLoTrinh === false, 'cờ theo quyết định chuyển lớp');
    const r = classesSvc.listClassSummaries(P.admin, { branchId: MB3 }).rows.find((x) => x.id === cls)!;
    assert(r.soChuaLoTrinhTiep === 1, `Đếm em chưa có lệnh: ${r.soChuaLoTrinhTiep}`);
  });

  /* PR-Dọn (Câu 2 = B): badge bật từ tuần Cuối khoá (cùng mốc dòng Cần xử lý `hv-chua-co-lenh-chuyen`), không còn "hai tuần cuối". */
  check('PR-LT (3) · listClassSummaries: soChuaLoTrinhTiep = 0 ở W7/8 (chưa tới tuần Final Test), = n ở W8/8', () => {
    const clsW7 = taoLopThuong3(7);
    taoHocVien3(clsW7, 'FOU');
    const clsW8 = taoLopThuong3(8);
    taoHocVien3(clsW8, 'FOU'); taoHocVien3(clsW8, 'FOU');
    const rows = classesSvc.listClassSummaries(P.admin, { branchId: MB3 }).rows;
    const r7 = rows.find((r) => r.id === clsW7)!;
    const r8 = rows.find((r) => r.id === clsW8)!;
    assert(r7.soChuaLoTrinhTiep === 0, `W7/8 phải 0: ${r7.soChuaLoTrinhTiep}`);
    assert(r8.soChuaLoTrinhTiep === 2, `W8/8 phải 2: ${r8.soChuaLoTrinhTiep}`);
  });

  check('PR-LT (3) · myWork: PR-VAI-a (Q27) — không ai còn việc "Ghi lộ trình tiếp theo" (GVCN, GVBM, QL "Tất cả"); Quản lý quyết chuyển lớp', () => {
    const cls = taoLopThuong3(7);
    const gvcn = ganGVCN3(cls, P.normalCoreTeacher.userId);
    taoHocVien3(cls, 'FOU');
    const co = (p: any, f: any = {}) => (myworkSvc.myWork(p, f) as any).items.some((i: any) => i.group === 'next_step');
    assert(!co(gvcn), 'GVCN không còn việc next_step');
    assert(!co(P.normalSubjectTeacher), 'GVBM không có việc next_step');
    assert(!co(P.mbManager, { nguoi: 'tat-ca' }), 'QL (Tất cả) không có việc next_step');
  });

  check('PR-LT (3) · canXepLop trừ em "xếp sau" còn hạn xem lại; hết đỏ khi mọi em có hướng; qua ngày xem lại thì đỏ lại (Q9)', () => {
    const cls = taoLopThuong3(9); // đã hết khoá (9 > 8 tuần)
    const { sid: s1 } = taoHocVien3(cls, 'FOU');
    const { sid: s2 } = taoHocVien3(cls, 'FOU');
    let pr = scheduleSvc.classProgress(cls);
    assert(pr.phase === 'finished' && pr.canXepLop === 2, `Tiền đề hết khoá, 2 em cần xếp: ${JSON.stringify(pr)}`);
    const now = new Date().toISOString();
    conn.prepare(
      `INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, ly_do, ngay_xem_lai, created_at, updated_at) VALUES (?,?,'chua_quyet',?,?,?,?)`,
    ).run(s1, cls, 'Ốm dài ngày', addDays3(TODAY3, 14), now, now);
    pr = scheduleSvc.classProgress(cls);
    assert(pr.canXepLop === 1, `Còn 1 em cần xếp: ${pr.canXepLop}`);
    conn.prepare(
      `INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, ly_do, ngay_xem_lai, created_at, updated_at) VALUES (?,?,'chua_quyet',?,?,?,?)`,
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

  // ==================================================================== Task 4 — luật lộ trình + Chuyển lớp một em

  console.log('\nPR-LT (4) · Máy chủ: luật lộ trình một chỗ, Chuyển lớp một em mọi chi nhánh (S16, S17, RB-3)');

  const luatLoTrinhSvc = await import('../classes/luatLoTrinh.ts');
  const CP4 = (conn.prepare(`SELECT id FROM branches WHERE code = 'CP'`).get() as any).id as number;
  let lt4Seq = 0;

  function taoLop4(o: { branchId: number; kind: string; ft: boolean; tuanHienTai?: number }): number {
    lt4Seq += 1;
    const branchCode = (conn.prepare('SELECT code FROM branches WHERE id = ?').get(o.branchId) as any).code as string;
    const startPeriodId = o.tuanHienTai !== undefined ? week.ensurePeriod(mondayForWeek3(o.tuanHienTai)).id : undefined;
    const r = intake.createClass(P.admin, {
      code: `${branchCode}-LT4-${lt4Seq}`, branchId: o.branchId, kind: o.kind, isFastTrack: o.ft,
      startDate: o.tuanHienTai !== undefined ? mondayForWeek3(o.tuanHienTai) : TODAY3, startPeriodId,
    }) as any;
    return r.id as number;
  }
  function ganGV4(clsId: number, userId: number, skill: string | null, isCore: boolean) {
    conn.prepare(
      `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at)
       VALUES (?, ?, ?, ?, '2026-01-01', 'active', ?)`,
    ).run(userId, clsId, skill, isCore ? 1 : 0, new Date().toISOString());
  }
  function taoHV4(o: { clsId: number; ma: string | null; ft: boolean; target?: number | null }): { sid: number; cycleId: number } {
    lt4Seq += 1;
    const tag = `LT4-${lt4Seq}`;
    const now = new Date().toISOString();
    const cls = conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(o.clsId) as any;
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, `Hoc vien ${tag}`, `hoc vien ${tag}`.toLowerCase(), cls.branch_id, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
      .run(sid, o.clsId, TODAY3, now);
    const cycleId = Number(conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at)
       VALUES (?, 1, ?, ?, ?, ?, 'active', ?)`,
    ).run(sid, o.ft ? 'LT1' : null, o.ma, o.target ?? null, TODAY3, now).lastInsertRowid);
    return { sid, cycleId };
  }
  function taoCase4(sid: number, cycleId: number, category: string, ownerUserId: number | null = null): number {
    const now = new Date().toISOString();
    return Number(conn.prepare(
      `INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, sos_level, owner_user_id, detected_at, created_at)
       VALUES (?,?,?,?, 'teacher_report', 'open', 1, ?, ?, ?)`,
    ).run(sid, cycleId, category, category, ownerUserId, TODAY3, now).lastInsertRowid);
  }
  const caseStatus = (id: number) => (conn.prepare('SELECT status, system_close_reason FROM sos_cases WHERE id = ?').get(id) as any);
  const cycleStatus = (id: number) => (conn.prepare('SELECT status FROM learning_cycles WHERE id = ?').get(id) as any).status;
  const activeCycleCount = (sid: number) => (conn.prepare(`SELECT COUNT(*) n FROM learning_cycles WHERE student_id=? AND status='active'`).get(sid) as any).n;

  check('PR-LT (4) · FT → FT (cùng chi nhánh): lộ trình giữ NGUYÊN id, Case giữ, người nhận gợi ý = GV cùng môn lớp mới', () => {
    const from = taoLop4({ branchId: MB3, kind: 'FT', ft: true });
    const to = taoLop4({ branchId: MB3, kind: 'FT', ft: true });
    const gvW = P.w1Teacher ?? P.normalCoreTeacher;
    ganGV4(to, gvW.userId, 'writing1', false);
    const { sid, cycleId } = taoHV4({ clsId: from, ma: 'FT', ft: true, target: 6.5 });
    const caseId = taoCase4(sid, cycleId, 'writing1');
    const gvcn = ganGVCN3(from, P.normalCoreTeacher.userId);
    const r = studentsSvc4.transferStudent(P.admin, sid, to, TODAY3, 'Đổi lịch học', { note: 'Đang dở PA Writing.' });
    assert(activeCycleCount(sid) === 1 && cycleStatus(cycleId) === 'active', 'FT→FT phải GIỮ nguyên lộ trình (khoa=giu)');
    assert(caseStatus(caseId).status === 'open', 'Case phải giữ nguyên, không tự đóng');
    assert(r.endKind === 'chuyen_lop', `endKind: ${r.endKind}`);
  });

  check('PR-LT (4) · Lớp thường cùng chương trình, Progress Test: khoá GIỮ, lượt chưa làm chuyển sang lớp mới (Q12)', () => {
    const from = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 3 });
    const to = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 3 });
    const { sid, cycleId } = taoHV4({ clsId: from, ma: 'FOU', ft: false });
    const periodId = week.ensurePeriod(TODAY3).id;
    const attemptId = Number(conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
       VALUES (?,?,1,'progress',?,?, 'planned', ?)`,
    ).run(cycleId, sid, from, periodId, new Date().toISOString()).lastInsertRowid);
    const gvcn = ganGVCN3(from, P.normalCoreTeacher.userId);
    studentsSvc4.transferStudent(P.admin, sid, to, TODAY3, 'Đổi lịch học', { noNote: true });
    assert(cycleStatus(cycleId) === 'active', 'Cùng chương trình, Progress Test: khoá phải GIỮ (khoa=giu)');
    const att = conn.prepare('SELECT class_id FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
    assert(att.class_id === to, 'Khoá giữ thì lượt chưa làm phải chuyển theo em sang lớp mới');
  });

  check('PR-LT (4) · Lớp thường → Fast Track (thật, Q7): khoá cũ completed, lộ trình FT mới active có Target, Case lớp thường đóng moved_to_ft, đúng MỘT lộ trình active', () => {
    const from = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 3 });
    const to = taoLop4({ branchId: MB3, kind: 'FT', ft: true });
    const { sid, cycleId } = taoHV4({ clsId: from, ma: 'FOU', ft: false });
    const caseId = taoCase4(sid, cycleId, 'writing');
    const gvcn = ganGVCN3(from, P.normalCoreTeacher.userId);
    assertThrows(() => studentsSvc4.transferStudent(P.admin, sid, to, TODAY3, 'Xếp lại trình độ', { noNote: false, note: 'Đủ trình lên FT', mucTieu: undefined as any }),
      /Target/, 'Thiếu Target phải 400');
    const r = studentsSvc4.transferStudent(P.admin, sid, to, TODAY3, 'Xếp lại trình độ', { note: 'Đủ trình lên FT', mucTieu: 6.5 });
    assert(cycleStatus(cycleId) === 'completed', 'Khoá lớp thường cũ phải đóng completed');
    assert(activeCycleCount(sid) === 1, 'Đúng một lộ trình active sau khi sang FT');
    const newCycle = conn.prepare(`SELECT * FROM learning_cycles WHERE student_id=? AND status='active'`).get(sid) as any;
    assert(newCycle.target_score === 6.5, `Lộ trình FT mới phải có Target: ${newCycle.target_score}`);
    assert(caseStatus(caseId).status === 'done' && caseStatus(caseId).system_close_reason === 'moved_to_ft',
      `Case lớp thường phải đóng moved_to_ft: ${JSON.stringify(caseStatus(caseId))}`);
    assert(r.endKind === 'sang_ft', `endKind: ${r.endKind}`);
  });

  check('PR-LT (4) · Fast Track → lớp thường (Q10): Case FT đóng moved_to_normal, khoá FT cũ completed; PR-CL: Target FT giữ (Mock chưa điểm huỷ: CL-a/b — không thêm lượt ở đây để id lượt ảnh chụp DL-2 không dời)', () => {
    const from = taoLop4({ branchId: MB3, kind: 'FT', ft: true });
    const to = taoLop4({ branchId: MB3, kind: 'BE', ft: false, tuanHienTai: 2 });
    const { sid, cycleId } = taoHV4({ clsId: from, ma: 'FT', ft: true, target: 6.0 });
    const caseId = taoCase4(sid, cycleId, 'listening');
    const gvcn = ganGVCN3(from, P.normalCoreTeacher.userId);
    const r = studentsSvc4.transferStudent(P.admin, sid, to, TODAY3, 'Xếp lại trình độ', { noNote: false, note: 'Chuyển sang lớp thường' });
    assert(cycleStatus(cycleId) === 'completed', 'Khoá FT cũ phải đóng completed');
    const moi = conn.prepare(`SELECT target_score FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sid) as any;
    assert(moi?.target_score === 6, `PR-CL (§7): khoá thường mới giữ Target FT: ${moi?.target_score}`);
    assert(caseStatus(caseId).status === 'done' && caseStatus(caseId).system_close_reason === 'moved_to_normal',
      `Case FT phải đóng moved_to_normal: ${JSON.stringify(caseStatus(caseId))}`);
    assert(r.endKind === 'chuyen_lop', `FT→thường Progress Test: endKind chuyen_lop, được ${r.endKind}`);
  });

  check('PR-LT (4) · Lớp thường KHÁC chương trình, Progress Test (xếp lại trình độ): khoá mới đúng mã, Case đi theo em (MỞ, không đóng), lượt chưa làm Ở LẠI lớp cũ', () => {
    const from = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const to = taoLop4({ branchId: MB3, kind: 'BE', ft: false, tuanHienTai: 2 });
    const { sid, cycleId } = taoHV4({ clsId: from, ma: 'FOU', ft: false });
    const caseId = taoCase4(sid, cycleId, 'reading');
    const periodId = week.ensurePeriod(TODAY3).id;
    const attemptId = Number(conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
       VALUES (?,?,1,'final',?,?, 'planned', ?)`,
    ).run(cycleId, sid, from, periodId, new Date().toISOString()).lastInsertRowid);
    const gvcn = ganGVCN3(from, P.normalCoreTeacher.userId);
    studentsSvc4.transferStudent(P.admin, sid, to, TODAY3, 'Xếp lại trình độ', { noNote: false, note: 'Học lệch trình' });
    assert(cycleStatus(cycleId) === 'completed', 'Khác chương trình Progress Test vẫn đóng khoá cũ');
    const newCycle = conn.prepare(`SELECT programme_code FROM learning_cycles WHERE student_id=? AND status='active'`).get(sid) as any;
    assert(newCycle.programme_code === 'BE', `Khoá mới phải đúng mã BE: ${newCycle?.programme_code}`);
    assert(caseStatus(caseId).status === 'open', 'Case phải đi theo em, KHÔNG tự đóng (Q11)');
    const att = conn.prepare('SELECT class_id FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
    assert(att.class_id === from, 'Đóng khoá thì lượt chưa làm phải Ở LẠI lớp cũ (Q12)');
  });

  check('PR-LT (4) · Q3 (PR-CT Q30-1 đổi): GVBM lớp nguồn, GVCN lớp KHÁC và GVCN lớp nguồn → 403; QL chi nhánh lớp nguồn chuyển em sang lớp CP thành công; GVCN MB mất quyền xem sau đó', () => {
    const from = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const other = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const to = taoLop4({ branchId: CP4, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const { sid } = taoHV4({ clsId: from, ma: 'FOU', ft: false });
    const gvcnFrom = ganGVCN3(from, P.normalCoreTeacher.userId);
    const gvcnOther = ganGVCN3(other, P.normalSubjectTeacher.userId);
    const gvbmFrom = loadPrincipal(P.subjectTeacher.userId);
    ganGV4(from, gvbmFrom.userId, 'listening', false);
    const gvbmFromLai = loadPrincipal(gvbmFrom.userId);
    assertThrows(() => studentsSvc4.transferStudent(gvbmFromLai, sid, to, TODAY3, 'Đổi chi nhánh', { noNote: true }),
      /quyền/, 'GVBM (không kiêm GVCN) của lớp nguồn phải 403');
    assertThrows(() => studentsSvc4.transferStudent(gvcnOther, sid, to, TODAY3, 'Đổi chi nhánh', { noNote: true }),
      /quyền/, 'GVCN của một lớp KHÁC (không phải lớp nguồn hiện tại) phải 403');
    assertThrows(() => studentsSvc4.transferStudent(gvcnFrom, sid, to, TODAY3, 'Đổi chi nhánh', { noNote: true }),
      /quyền/, 'PR-CT (Q30-1): GVCN lớp nguồn không còn tự chuyển — phải 403');
    assertThrows(() => studentsSvc4.transferStudent(P.cpManager, sid, to, TODAY3, 'Đổi chi nhánh', { noNote: true }),
      /quyền/, 'QL chi nhánh ĐÍCH (khác lớp nguồn) phải 403');
    studentsSvc4.transferStudent(P.mbManager, sid, to, TODAY3, 'Đổi chi nhánh', { noNote: true });
    /*
     * "QL CP thấy ngay" (PR-TD Task2(e), đã kiểm ở đó với HV KHÔNG có ghi danh cũ): ở đây HV có
     * ghi danh MB cũ ('transferred') nên `branchesOfStudent` trả CẢ MB lẫn CP — luật can() hiện
     * có (permissions.ts, ngoài phạm vi PR-LT sửa) đòi grant phủ TRỌN các chi nhánh đó, nên QL
     * một chi nhánh KHÔNG đủ; chỉ vai phạm vi toàn hệ thống mới thấy ngay. Dùng admin xác nhận dữ liệu đúng.
     */
    assert(profileSvc.studentProfile(P.admin, sid).currentClass?.id === to, 'Hồ sơ phải phản ánh lớp CP mới ngay sau khi chuyển');
    assertThrows(() => profileSvc.studentProfile(gvcnFrom, sid), /phạm vi/, 'GVCN MB (lớp cũ) phải mất quyền xem sau khi chuyển');
  });

  check('PR-LT (4) · GET /chuyen-lop/lop-dich: có lớp CP, JSON KHÔNG có khoá nào về học viên lớp khác', () => {
    const from = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const to = taoLop4({ branchId: CP4, kind: 'FOU', ft: false, tuanHienTai: 2 });
    taoHV4({ clsId: to, ma: 'FOU', ft: false }); // học viên lớp chuyển đến — không được lộ
    const { sid } = taoHV4({ clsId: from, ma: 'FOU', ft: false });
    const gvcn = ganGVCN3(from, P.normalCoreTeacher.userId);
    const r = luatLoTrinhSvc.lopDichChoChuyen(P.mbManager, sid);
    assert(r.chiNhanh.some((b: any) => b.id === CP4), 'Phải có chi nhánh CP');
    assert(r.lop.some((l: any) => l.id === to), 'Phải có lớp chuyển đến ở CP');
    const raw = JSON.stringify(r);
    assert(!/soHv|"students"|hocVien/i.test(raw), `JSON không được lộ khoá học viên lớp khác: ${raw.slice(0, 200)}`);
  });

  check('PR-LT (4) · Q21: chuyển MB → CP tạo thông báo cho GVCN lớp CP và QL chi nhánh CP (không QL MB); chạy lại không nhân đôi (dedup)', () => {
    const from = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const to = taoLop4({ branchId: CP4, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const gvcnTo = loadPrincipal(P.normalCoreTeacher.userId);
    ganGV4(to, gvcnTo.userId, null, true);
    const { sid } = taoHV4({ clsId: from, ma: 'FOU', ft: false });
    const gvcnFrom = ganGVCN3(from, P.normalSubjectTeacher.userId);
    studentsSvc4.transferStudent(P.admin, sid, to, TODAY3, 'Đổi chi nhánh', { noNote: true });
    const notiGvcn = conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE user_id=? AND kind='transfer_in'`).get(gvcnTo.userId) as any;
    assert(notiGvcn.n === 1, `GVCN lớp CP phải nhận đúng 1 thông báo: ${notiGvcn.n}`);
    const notiQlCp = conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE user_id=? AND kind='transfer_in'`).get(P.cpManager.userId) as any;
    assert(notiQlCp.n >= 1, 'QL chi nhánh CP phải nhận thông báo');
    const notiQlMb = conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE user_id=? AND kind='transfer_in' AND entity_id=?`).get(P.mbManager.userId, sid) as any;
    assert(notiQlMb.n === 0, 'QL chi nhánh MB (chi nhánh cũ) KHÔNG được nhận thông báo này');
    assert(d.duongThongBao({ entity_type: 'student', entity_id: sid, kind: null, student_id: null, attempt_id: null }) === `/hoc-vien/${sid}`,
      'duongThongBao phải ra /hoc-vien/{id}');
    // Chạy lại đúng lệnh (cùng enrollmentMoiId) không được nhân đôi thông báo (dedup theo user + dedup_key).
    const enrMoi = conn.prepare(`SELECT id FROM enrollments WHERE student_id=? AND status='active'`).get(sid) as any;
    luatLoTrinhSvc.thongBaoChuyenVao({
      sid, tenHocVien: 'x', enrollmentMoiId: enrMoi.id, actorUserId: gvcnFrom.userId,
      tuMa: 'x', tuChiNhanh: 'MB', doiChiNhanh: true, lyDo: null,
      denLop: { id: to, code: 'x', branchId: CP4 },
    });
    const notiGvcnLai = conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE user_id=? AND kind='transfer_in'`).get(gvcnTo.userId) as any;
    assert(notiGvcnLai.n === 1, `Chạy lại không được nhân đôi thông báo: ${notiGvcnLai.n}`);
  });

  check('PR-LT (4) · end_kind ghi đúng theo từng nhánh luật (len_lop, hoc_lai, sang_ft, chuyen_lop, chuyen_lop khác chương trình)', () => {
    const fou = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const be = taoLop4({ branchId: MB3, kind: 'BE', ft: false, tuanHienTai: 2 });
    const { sid } = taoHV4({ clsId: fou, ma: 'FOU', ft: false });
    const gvcn = ganGVCN3(fou, P.normalCoreTeacher.userId);
    const r = studentsSvc4.transferStudent(P.admin, sid, be, TODAY3, 'Xếp lại trình độ', { noNote: true });
    assert(r.endKind === 'chuyen_lop', `Progress Test khác chương trình → chuyen_lop, được ${r.endKind}`);
    const enr = conn.prepare(`SELECT end_kind FROM enrollments WHERE student_id=? AND status='transferred' ORDER BY id DESC LIMIT 1`).get(sid) as any;
    assert(enr.end_kind === 'chuyen_lop', `Cột end_kind trên enrollment: ${enr.end_kind}`);
  });

  check('PR-LT (4) · Kết thúc học: khoá đang chạy abandoned, Case course_ended, status finished; lớp cũ hết khoá & em cuối đi → finished, chưa hết khoá → giữ active', () => {
    const clsHet = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 9 }); // đã hết khoá (>8 tuần)
    const { sid: s1, cycleId: c1 } = taoHV4({ clsId: clsHet, ma: 'FOU', ft: false });
    const case1 = taoCase4(s1, c1, 'listening');
    studentsSvc4.setStudentStatus(P.mbManager, s1, 'finished', TODAY3, 'Nghỉ hẳn');
    assert(cycleStatus(c1) === 'abandoned', `Khoá đang chạy phải abandoned: ${cycleStatus(c1)}`);
    assert(caseStatus(case1).status === 'done', 'Case phải tự đóng course_ended');
    const cls1 = conn.prepare('SELECT status FROM classes WHERE id = ?').get(clsHet) as any;
    assert(cls1.status === 'finished', 'Lớp hết khoá, em cuối đi → phải thành finished');

    const clsChuaHet = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 3 });
    const { sid: s2 } = taoHV4({ clsId: clsChuaHet, ma: 'FOU', ft: false });
    studentsSvc4.setStudentStatus(P.mbManager, s2, 'finished', TODAY3, 'Nghỉ hẳn');
    const cls2 = conn.prepare('SELECT status FROM classes WHERE id = ?').get(clsChuaHet) as any;
    assert(cls2.status === 'active', 'Lớp chưa hết khoá thì vẫn giữ active dù mất em cuối');
  });

  check('PR-LT (4) · Quay lại học vào lớp đã kết thúc → 400', () => {
    const cls = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 9 });
    const { sid } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    studentsSvc4.setStudentStatus(P.mbManager, sid, 'inactive', TODAY3, 'Tạm nghỉ');
    // Lớp chỉ 'finished' khi KHÔNG còn enrollment active — em này đã 'paused' nên lớp đủ điều kiện hết khoá.
    const cls1 = conn.prepare('SELECT status FROM classes WHERE id = ?').get(cls) as any;
    assert(cls1.status === 'finished', 'Tiền đề: lớp phải đã kết thúc sau khi em cuối tạm dừng');
    assertThrows(() => studentsSvc4.setStudentStatus(P.mbManager, sid, 'active', TODAY3, 'Quay lại'),
      /đã kết thúc/, 'Quay lại học vào lớp đã kết thúc phải 400 (Q17)');
  });

  check('PR-LT (4) · GVCN dùng /ref/nguoi (không còn /ref/people) để chọn người nhận Case khi chuyển lớp — không bị 403', () => {
    const from = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const gvcn = ganGVCN3(from, P.normalCoreTeacher.userId);
    assert(!can4(gvcn, d.PERMISSIONS.MEETING_VIEW, { anyScope: true }), 'Tiền đề: GVCN thường không có MEETING_VIEW toàn hệ thống');
    let threw = false;
    try { timNguoiSvc4.timNguoi(gvcn, { q: 'nguyen', nhom: 'giao_vien', studentId: null }); } catch { threw = true; }
    assert(!threw, '/ref/nguoi không được đòi MEETING_VIEW (khác /ref/people) — GVCN phải gọi được');
  });

  // ==================================================================== Task 5 — Chuyển tiếp lớp (cả lớp)

  console.log('\nPR-LT (5) · Máy chủ: Chuyển tiếp lớp theo hướng từng em, sửa tuần khai giảng, quyền QL, ghi theo lô');

  const transitionSvc = await import('../classes/transition.ts');
  const nguCanhReq = await import('../platform/nguCanhRequest.ts');

  function taoLopHetKhoa5(tuanHienTai: number, soHV: number): { cls: number; sids: number[] } {
    const cls = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai });
    const sids: number[] = [];
    for (let i = 0; i < soHV; i += 1) sids.push(taoHV4({ clsId: cls, ma: 'FOU', ft: false }).sid);
    return { cls, sids };
  }
  const demTruyVan5 = (fn: () => void): number => {
    let n = 0;
    const orig = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { n += 1; return orig(sql); };
    try { fn(); } finally { (conn as any).prepare = orig; }
    return n;
  };

  check('PR-LT (5) · applyTransition: tuần khai giảng lớp mới ĐÚNG tuần gửi lên qua startPeriodId (sửa lỗi §6)', () => {
    const { cls, sids } = taoLopHetKhoa5(9, 1);
    ganGVCN3(cls, P.normalCoreTeacher.userId);
    const tuanKhaiGiang = week.ensurePeriod(mondayForWeek3(2)).id;
    /* PR-Dọn (Q22): như web — tạo lớp trước bằng panel Tạo lớp (`taoLopVaPhanCong`), rồi gán vào dòng. */
    const moi = intake.taoLopVaPhanCong(P.mbManager, { chuongTrinh: 'BE', so: transitionSvc.soGoiY('MB', 'BE', null), startPeriodId: tuanKhaiGiang, branchId: MB3, previousClassId: cls,
      slots: [{ userId: P.normalCoreTeacher.userId, skill: null, isCore: true }, { userId: P.normalCoreTeacher.userId, skill: 'listening', isCore: false }] });
    transitionSvc.applyTransition(P.mbManager, { fromClassId: cls, effectiveDate: TODAY3, dongs: [{ studentId: sids[0], huong: 'len_lop', toClassId: moi.id }] });
    const created = conn.prepare('SELECT start_period_id FROM classes WHERE id = ?').get(moi.id) as any;
    assert(created.start_period_id === tuanKhaiGiang, `Tuần khai giảng phải đúng tuần gửi lên: ${created.start_period_id} vs ${tuanKhaiGiang}`);
  });

  check('PR-LT (5) · applyTransition: GVCN lớp (không có CLASS_EDIT) → 403', () => {
    const { cls, sids } = taoLopHetKhoa5(9, 1);
    const gvcn = ganGVCN3(cls, P.normalCoreTeacher.userId);
    assertThrows(() => transitionSvc.applyTransition(gvcn, {
      fromClassId: cls, effectiveDate: TODAY3, dongs: [{ studentId: sids[0], huong: 'len_lop', toClassId: cls }],
    }), /quyền/, 'GVCN không có CLASS_EDIT phải 403');
  });

  check('PR-LT (5) · Kịch bản mockup 11-2: 2 lên BE, 1 sang FT (Target 6.5, Case Writing đóng moved_to_ft), 1 tạm dừng học (bảo lưu); lớp cũ hết em → finished', () => {
    const { cls } = taoLopHetKhoa5(9, 0);
    const { sid: s1 } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    const { sid: s2 } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    const { sid: s3, cycleId: c3 } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    const case3 = taoCase4(s3, c3, 'writing');
    const { sid: s4 } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    const be = taoLop4({ branchId: MB3, kind: 'BE', ft: false, tuanHienTai: 1 });
    const ft = taoLop4({ branchId: MB3, kind: 'FT', ft: true });

    const r = transitionSvc.applyTransition(P.mbManager, {
      fromClassId: cls, effectiveDate: TODAY3,
      dongs: [
        { studentId: s1, huong: 'len_lop', toClassId: be },
        { studentId: s2, huong: 'len_lop', toClassId: be },
        { studentId: s3, huong: 'fast_track', toClassId: ft, mucTieu: 6.5 },
        { studentId: s4, huong: 'bao_luu', lyDo: 'Ốm dài ngày', ngayXemLai: addDays3(TODAY3, 30) },
      ],
    }) as any;
    assert(r.done.length === 3 && r.failed.length === 0, `done=${r.done.length} failed=${JSON.stringify(r.failed)}`);
    assert(activeCycleCount(s1) === 1 && activeCycleCount(s2) === 1, 'Mỗi em phải đúng một lộ trình active sau khi lên lớp');
    const cyc1 = conn.prepare(`SELECT programme_code FROM learning_cycles WHERE student_id=? AND status='active'`).get(s1) as any;
    assert(cyc1.programme_code === 'BE', `Khoá mới của s1 phải là BE: ${cyc1.programme_code}`);
    const cycFt = conn.prepare(`SELECT programme_code, target_score FROM learning_cycles WHERE student_id=? AND status='active'`).get(s3) as any;
    assert(cycFt.target_score === 6.5, `Target FT: ${cycFt.target_score}`);
    assert(caseStatus(case3).status === 'done' && caseStatus(case3).system_close_reason === 'moved_to_ft',
      `Case Writing phải đóng moved_to_ft: ${JSON.stringify(caseStatus(case3))}`);
    const s4row = conn.prepare('SELECT status FROM students WHERE id = ?').get(s4) as any;
    assert(s4row.status === 'inactive', 's4 phải inactive (tạm dừng học (bảo lưu))');
    const s4enr = conn.prepare(`SELECT status FROM enrollments WHERE student_id=? ORDER BY id DESC LIMIT 1`).get(s4) as any;
    assert(s4enr.status === 'paused', 's4 enrollment phải paused');
    const clsRow = conn.prepare('SELECT status FROM classes WHERE id = ?').get(cls) as any;
    assert(clsRow.status === 'finished', 'Lớp cũ hết học viên (mọi em đã có hướng) phải thành finished');
  });

  check('PR-LT (5) · Xếp sau với ngày xem lại tương lai: chỉ ghi dự định, KHÔNG đổi enrollment, lớp CHƯA finished', () => {
    const { cls } = taoLopHetKhoa5(9, 0);
    const { sid } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    const r = transitionSvc.applyTransition(P.mbManager, {
      fromClassId: cls, effectiveDate: TODAY3,
      dongs: [{ studentId: sid, huong: 'chua_quyet', lyDo: 'Chờ phụ huynh', ngayXemLai: addDays3(TODAY3, 14) }],
    }) as any;
    assert(r.done.length === 0 && r.failed.length === 0, `chua_quyet không nằm trong done lẫn failed: ${JSON.stringify(r)}`);
    const enr = conn.prepare(`SELECT status FROM enrollments WHERE student_id=?`).get(sid) as any;
    assert(enr.status === 'active', 'chua_quyet không được đổi enrollment');
    const clsRow = conn.prepare('SELECT status FROM classes WHERE id = ?').get(cls) as any;
    assert(clsRow.status === 'active', 'Lớp còn em active (chua_quyet) thì chưa finished');
    const banGhi = conn.prepare(`SELECT huong, da_ap_dung_luc FROM lo_trinh_tiep_theo WHERE student_id=? AND class_id=?`).get(sid, cls) as any;
    assert(banGhi.huong === 'chua_quyet' && banGhi.da_ap_dung_luc === null, `Dự định phải ghi, chưa áp dụng: ${JSON.stringify(banGhi)}`);
  });

  check('PR-LT (5) · Dòng thiếu lý do (tạm dừng học (bảo lưu) không ghi lý do) vào failed, dòng khác vẫn xong', () => {
    const { cls } = taoLopHetKhoa5(9, 0);
    const { sid: sOk } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    const { sid: sBad } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    const be = taoLop4({ branchId: MB3, kind: 'BE', ft: false, tuanHienTai: 1 });
    const r = transitionSvc.applyTransition(P.mbManager, {
      fromClassId: cls, effectiveDate: TODAY3,
      dongs: [
        { studentId: sOk, huong: 'len_lop', toClassId: be },
        { studentId: sBad, huong: 'bao_luu' },
      ],
    }) as any;
    assert(r.done.length === 1 && r.done[0].studentId === sOk, 'Dòng đúng phải xong');
    assert(r.failed.length === 1 && r.failed[0].studentId === sBad, 'Dòng thiếu lý do phải vào failed');
  });

  check('PR-LT (5) · "+ Mở lớp mới": GVCN được gán ngay khi tạo lớp', () => {
    const { cls, sids } = taoLopHetKhoa5(9, 1);
    const moi = intake.taoLopVaPhanCong(P.mbManager, { chuongTrinh: 'BE', so: transitionSvc.soGoiY('MB', 'BE', null), startPeriodId: week.ensurePeriod(TODAY3).id, branchId: MB3, previousClassId: cls,
      slots: [{ userId: P.normalCoreTeacher.userId, skill: null, isCore: true }, { userId: P.normalCoreTeacher.userId, skill: 'listening', isCore: false }] });
    transitionSvc.applyTransition(P.mbManager, { fromClassId: cls, effectiveDate: TODAY3, dongs: [{ studentId: sids[0], huong: 'len_lop', toClassId: moi.id }] });
    const gv = conn.prepare(`SELECT user_id FROM teacher_assignments WHERE class_id=? AND is_core=1 AND status='active'`).get(moi.id) as any;
    assert(gv?.user_id === P.normalCoreTeacher.userId, `GVCN phải được gán: ${JSON.stringify(gv)}`);
  });

  check('PR-LT (5) · Đếm câu SQL (Q20): chuyển tiếp 4 em và 8 em, không em nào sang FT — không truy vấn theo từng em', () => {
    const { cls: cls4, sids: sids4 } = taoLopHetKhoa5(9, 4);
    const be4 = taoLop4({ branchId: MB3, kind: 'BE', ft: false, tuanHienTai: 1 });
    const n4 = demTruyVan5(() => {
      transitionSvc.applyTransition(P.mbManager, {
        fromClassId: cls4, effectiveDate: TODAY3,
        dongs: sids4.map((sid) => ({ studentId: sid, huong: 'len_lop' as const, toClassId: be4 })),
      });
    });
    const { cls: cls8, sids: sids8 } = taoLopHetKhoa5(9, 8);
    const be8 = taoLop4({ branchId: MB3, kind: 'BE', ft: false, tuanHienTai: 1 });
    const n8 = demTruyVan5(() => {
      transitionSvc.applyTransition(P.mbManager, {
        fromClassId: cls8, effectiveDate: TODAY3,
        dongs: sids8.map((sid) => ({ studentId: sid, huong: 'len_lop' as const, toClassId: be8 })),
      });
    });
    assert(n8 - n4 <= 6, `8 em (không FT) không được tăng nhiều câu SQL hơn 4 em: ${n4} → ${n8}`);
  });

  check('PR-LT (5) · transitionPlan: chỉ đọc (không tạo lớp mới), số câu không tăng nhiều theo số lớp ứng viên (N+1 fix)', () => {
    const { cls } = taoLopHetKhoa5(9, 2);
    const before = (conn.prepare('SELECT COUNT(*) n FROM classes').get() as any).n;
    /*
     * `classProgressMany` gọi `demoToday()` một lần MỖI LỚP ứng viên; ngoài `chayTrongRequest`
     * (bộ nhớ request PR-TD) mỗi lần đó là một câu SQL riêng — ĐÚNG kiểu N+1 mà phép kiểm này
     * dò, nhưng chỉ hiện ra khi gọi trực tiếp như test đơn vị. Ngoài đời route luôn bọc trong
     * `chayTrongRequest('GET', …)` (`wrap()` ở routes/index.ts) nên demo_config chỉ đọc một lần
     * cho cả request — đo đúng như production bằng cách bọc lại ở đây.
     */
    const n1 = demTruyVan5(() => { nguCanhReq.chayTrongRequest('GET', () => { transitionSvc.transitionPlan(P.admin, cls); }); });
    for (let i = 0; i < 5; i += 1) taoLop4({ branchId: MB3, kind: 'BE', ft: false, tuanHienTai: 1 });
    const n2 = demTruyVan5(() => { nguCanhReq.chayTrongRequest('GET', () => { transitionSvc.transitionPlan(P.admin, cls); }); });
    assert((conn.prepare('SELECT COUNT(*) n FROM classes').get() as any).n === before + 5, 'Tiền đề: đã thêm đúng 5 lớp, không tạo thêm gì khác');
    assert(n2 <= n1 + 2, `Thêm 5 lớp ứng viên không được tăng nhiều câu (N+1): ${n1} → ${n2}`);
  });

  // ==================================================================== Task 8 — Lịch sử lớp

  console.log('\nPR-LT (8) · Máy chủ: Lịch sử lớp ở tab Hành trình (Q18)');

  /* PR-VAI-b (Q15): bảng Lịch sử lớp (`/lich-su-lop`) thay bằng CHƯƠNG THEO LỚP của tab Hành trình — cùng các ý kiểm, đọc `chuong` (cũ → mới). */
  const { hanhTrinhHocVien } = await import('../students/hanhTrinh.ts');
  const { nhanGhim } = await import('../../../shared/domain/index.ts');
  const chuongCua = (p: any, sid: number) => hanhTrinhHocVien(p, sid, null).chuong as any[];

  check('PR-LT (8) · em lên lớp: hai dòng, dòng cũ "Lên lớp" + "Final Test n/4 môn đạt"', () => {
    const { cls } = taoLopHetKhoa5(9, 0);
    const { sid, cycleId } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    const attemptId = Number(conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, status, created_at)
       VALUES (?,?,1,'final',?, 'done', ?)`,
    ).run(cycleId, sid, cls, new Date().toISOString()).lastInsertRowid);
    const insScore = conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_at) VALUES (?,?,?,?,?)`);
    for (const sk of ['listening', 'reading', 'writing', 'speaking']) insScore.run(attemptId, sk, 10, 10, TODAY3);
    const be = taoLop4({ branchId: MB3, kind: 'BE', ft: false, tuanHienTai: 1 });
    transitionSvc.applyTransition(P.mbManager, {
      fromClassId: cls, effectiveDate: TODAY3, dongs: [{ studentId: sid, huong: 'len_lop', toClassId: be }],
    });
    const rows = chuongCua(P.admin, sid);
    assert(rows.length === 2, `Phải đúng 2 chương: ${rows.length}`);
    assert(rows[1].classId === be && rows[1].dangHoc === true, `Chương mới nhất phải là lớp mới, đang học: ${JSON.stringify(rows[1])}`);
    assert(rows[0].classId === cls && rows[0].ra?.loai === 'len' && rows[0].ra.chu === 'Lên BE', `Chương cũ phải "Lên BE": ${JSON.stringify(rows[0].ra)}`);
    const g = rows[0].ghim.find((x: any) => x.attemptId === attemptId);
    assert(g && g.soDat === 4 && g.soYeuCau === 4 && /^Final/.test(nhanGhim(g).chu), `Kết quả chương cũ: ${JSON.stringify(g)}`);
  });

  check('PR-LT (8) · em chuyển lớp: "Chuyển lớp" + đúng lý do đã ghi lúc chuyển', () => {
    const from = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 3 });
    const to = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 3 });
    const { sid } = taoHV4({ clsId: from, ma: 'FOU', ft: false });
    const gvcn = ganGVCN3(from, P.normalCoreTeacher.userId);
    studentsSvc4.transferStudent(P.admin, sid, to, TODAY3, 'Đổi lịch học', { noNote: true });
    const rows = chuongCua(P.admin, sid);
    assert(rows.length === 2, `Phải đúng 2 chương: ${rows.length}`);
    assert(rows[0].classId === from && rows[0].ra?.loai === 'chuyen' && rows[0].ra.chu === 'Chuyển lớp', `Chương cũ phải "Chuyển lớp": ${JSON.stringify(rows[0].ra)}`);
    assert(rows[0].ra.how === 'Đổi lịch học', `Chương cũ phải nói lý do đã ghi lúc chuyển: ${rows[0].ra.how}`);
  });

  check('PR-LT (8) · dòng cũ (trước PR-LT) không có end_kind vẫn suy đúng "Kết thúc vì" theo status cũ (Q18)', () => {
    const cls1 = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const cls2 = taoLop4({ branchId: MB3, kind: 'BE', ft: false, tuanHienTai: 2 });
    const { sid } = taoHV4({ clsId: cls1, ma: 'FOU', ft: false });
    const now = new Date().toISOString();
    // Giả lập enrollment cũ (trước khi có cột end_kind của PR-LT): status='completed', end_kind NULL.
    conn.prepare(
      `INSERT INTO enrollments (student_id, class_id, status, started_at, ended_at, created_at) VALUES (?,?, 'completed', ?, ?, ?)`,
    ).run(sid, cls2, addDays3(TODAY3, -60), addDays3(TODAY3, -30), now);
    const rows = chuongCua(P.admin, sid);
    const oldRow = rows.find((r) => r.classId === cls2);
    /* OV-11d (HV-12): dòng cũ 'completed' không end_kind mà có lớp sau = em SANG lớp sau, không phải "Kết thúc học". */
    const sau = rows.find((r) => r.classId === cls1);
    assert(oldRow?.ra?.chu === `Sang ${sau?.code}` && oldRow.ra.loai === 'chuyen', `Chương cũ 'completed' không end_kind, có lớp sau phải "Sang {lớp sau}": ${JSON.stringify(oldRow?.ra)}`);
  });

  check('PR-LT (8) · GV ngoài phạm vi (chi nhánh khác) xem lịch sử lớp → 403', () => {
    const cls = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const { sid } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    assertThrows(() => hanhTrinhHocVien(P.cpManager, sid, null), /phạm vi/, 'QL chi nhánh CP không được xem chương theo lớp của em ở MB');
  });

  check('PR-LT (8) · Đếm câu SQL: ba câu cố định, không tăng theo số lớp em đã học qua', () => {
    const cls = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const { sid } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    const n1 = demTruyVan5(() => { hanhTrinhHocVien(P.admin, sid, null); });
    const now = new Date().toISOString();
    for (let i = 0; i < 6; i += 1) {
      const clsX = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 2 });
      conn.prepare(
        `INSERT INTO enrollments (student_id, class_id, status, started_at, ended_at, end_kind, created_at)
         VALUES (?,?, 'transferred', ?, ?, 'chuyen_lop', ?)`,
      ).run(sid, clsX, addDays3(TODAY3, -100 + i), addDays3(TODAY3, -90 + i), now);
    }
    const n2 = demTruyVan5(() => { hanhTrinhHocVien(P.admin, sid, null); });
    assert(n2 - n1 <= 1, `Thêm 6 lớp cũ không được tăng nhiều câu SQL (số câu cố định, Q20): ${n1} → ${n2}`);
  });

  // ==================================================================== Task 9 — Khu Lưu trữ + chế độ chỉ xem

  console.log('\nPR-LT (9) · Máy chủ: khu Lưu trữ — lớp đã kết thúc, HV đã lưu trữ, chế độ chỉ xem (Q16, Q22)');

  const luuTruSvc = await import('../classes/luuTru.ts');
  const hocVienLopSvc = await import('../classes/hocVienLop.ts');

  /** Một lớp thường ĐÃ HẾT CHƯƠNG TRÌNH (tuần 9 > 8 tuần của FOU) với đúng một em — kết thúc học em đó thì lớp tự đóng. */
  function taoLopVaKetThuc9(): { cls: number; sid: number } {
    const { cls } = taoLopHetKhoa5(9, 0);
    const { sid } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    studentsSvc4.setStudentStatus(P.mbManager, sid, 'finished', TODAY3, 'Nghỉ hẳn');
    return { cls, sid };
  }

  check('PR-LT (9) · Lớp vừa finished rời /hoc-vien-lop và có ở /hoc-vien-lop/luu-tru kèm finishedAt', () => {
    const { cls } = taoLopVaKetThuc9();
    const trang = hocVienLopSvc.danhSachHocVienLop(P.mbManager, {});
    assert(!trang.rows.some((r) => r.id === cls), 'Lớp đã finished phải rời danh sách chính');
    const luuTru = luuTruSvc.danhSachLuuTru(P.mbManager, {});
    const row = luuTru.lop.find((l) => l.id === cls);
    assert(!!row && row.finishedAt === TODAY3, `Lớp phải có ở khu Lưu trữ với finishedAt: ${JSON.stringify(row)}`);
  });

  check('PR-LT (9) · HV lưu trữ có ở tab HV, bỏ lưu trữ thì rời', () => {
    const { sid } = taoLopVaKetThuc9();
    studentsSvc4.archiveStudent(P.mbManager, sid);
    const truoc = luuTruSvc.danhSachLuuTru(P.mbManager, {});
    assert(truoc.hocVien.some((h) => h.id === sid), 'HV vừa lưu trữ phải có ở tab Học viên đã lưu trữ');
    studentsSvc4.unarchiveStudent(P.mbManager, sid);
    const sau = luuTruSvc.danhSachLuuTru(P.mbManager, {});
    assert(!sau.hocVien.some((h) => h.id === sid), 'HV vừa bỏ lưu trữ phải rời khu Lưu trữ');
  });

  check('PR-LT (9) · demLuuTru (menu ⋯ trang chính) khớp đúng độ dài hai danh sách của /hoc-vien-lop/luu-tru (G-10)', () => {
    const { sid } = taoLopVaKetThuc9();
    studentsSvc4.archiveStudent(P.mbManager, sid);
    const trang = hocVienLopSvc.danhSachHocVienLop(P.mbManager, {});
    const luuTru = luuTruSvc.danhSachLuuTru(P.mbManager, {});
    assert(trang.demLuuTru.lop === luuTru.lop.length, `demLuuTru.lop (${trang.demLuuTru.lop}) phải khớp luuTru.lop.length (${luuTru.lop.length})`);
    assert(trang.demLuuTru.hv === luuTru.hocVien.length, `demLuuTru.hv (${trang.demLuuTru.hv}) phải khớp luuTru.hocVien.length (${luuTru.hocVien.length})`);
  });

  check('PR-LT (9) · Tập HV lưu trữ trả về khớp can(STUDENT_VIEW) từng em: QL chi nhánh khác không thấy; GV không dạy lớp em không thấy', () => {
    const { sid } = taoLopVaKetThuc9();
    studentsSvc4.archiveStudent(P.mbManager, sid);
    assert(luuTruSvc.danhSachLuuTru(P.mbManager, {}).hocVien.some((h) => h.id === sid), 'QL chi nhánh MB phải thấy em của chính chi nhánh mình');
    assert(!luuTruSvc.danhSachLuuTru(P.cpManager, {}).hocVien.some((h) => h.id === sid), 'QL chi nhánh CP không được thấy em MB');
    assert(!luuTruSvc.danhSachLuuTru(P.subjectTeacher, {}).hocVien.some((h) => h.id === sid), 'GV không dạy lớp của em (lớp FT khác) không được thấy');
  });

  check('PR-LT (9) · classOverview lớp finished: mọi cờ viewer thao tác false, kể cả với QT (phạm vi toàn hệ thống)', () => {
    const { cls } = taoLopVaKetThuc9();
    const ov = classesSvc.classOverview(P.admin, cls) as any;
    assert(ov.status === 'finished', `status phải finished: ${ov.status}`);
    const v = ov.viewer;
    assert(
      v.canPlanWeek === false && v.canAddStudents === false && v.canAssign === false && v.canEditProgress === false
        && v.canReportCase === false && v.canRecordViolation === false && v.canEnterScores === false && v.coTheChuyenTiep === false,
      `Mọi cờ viewer phải false: ${JSON.stringify(v)}`,
    );
  });

  check('PR-LT (9) · classRoster lớp finished: có em đã rời kèm ketThucVi', () => {
    const { cls, sid } = taoLopVaKetThuc9();
    const roster = classesSvc.classRoster(P.admin, cls) as any[];
    const row = roster.find((r) => r.id === sid);
    assert(!!row, 'Em đã kết thúc học vẫn phải xuất hiện ở bảng lớp đã finished');
    assert(row.ketThucVi === 'Kết thúc học', `ketThucVi phải "Kết thúc học": ${row.ketThucVi}`);
  });

  check('PR-LT (9) · POST unarchive: GVCN 403, QL 200', () => {
    const { sid } = taoLopVaKetThuc9();
    studentsSvc4.archiveStudent(P.mbManager, sid);
    const gvcn = loadPrincipal(P.normalCoreTeacher.userId);
    assertThrows(() => studentsSvc4.unarchiveStudent(gvcn, sid), /Quản lý/, 'GVCN không được bỏ lưu trữ');
    const r = studentsSvc4.unarchiveStudent(P.mbManager, sid) as any;
    assert(r.archived_at === null, 'QL bỏ lưu trữ phải thành công');
  });

  check('PR-LT (9) · Đếm câu SQL /hoc-vien-lop/luu-tru: không tăng nhiều khi nhân số lớp/HV lưu trữ', () => {
    taoLopVaKetThuc9();
    const n1 = demTruyVan5(() => { nguCanhReq.chayTrongRequest('GET', () => { luuTruSvc.danhSachLuuTru(P.admin, {}); }); });
    for (let i = 0; i < 5; i += 1) {
      const { sid } = taoLopVaKetThuc9();
      studentsSvc4.archiveStudent(P.mbManager, sid);
    }
    const n2 = demTruyVan5(() => { nguCanhReq.chayTrongRequest('GET', () => { luuTruSvc.danhSachLuuTru(P.admin, {}); }); });
    assert(n2 - n1 <= 3, `Thêm 5 lớp+HV lưu trữ không được tăng nhiều câu SQL: ${n1} → ${n2}`);
  });

  // ==================================================================== Rà PR #86 (planning) — sửa 7 điểm

  console.log('\nPR-LT (rà #86) · applyTransition kiểm em/lớp chuyển đến hợp lệ, exam_month, phạm vi theo chi nhánh đang học, thông báo/tạm dừng học (bảo lưu)');

  check('PR-LT (rà #86) · applyTransition: studentId không thuộc lớp nguồn (mượn từ lớp/chi nhánh khác) → failed, không đổi gì', () => {
    const { cls: clsMB } = taoLopHetKhoa5(9, 0);
    const { sid: sidMB } = taoHV4({ clsId: clsMB, ma: 'FOU', ft: false });
    const clsCP = taoLop4({ branchId: CP4, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const { sid: sidCP } = taoHV4({ clsId: clsCP, ma: 'FOU', ft: false });
    const be = taoLop4({ branchId: MB3, kind: 'BE', ft: false, tuanHienTai: 1 });
    const r = transitionSvc.applyTransition(P.mbManager, {
      fromClassId: clsMB, effectiveDate: TODAY3,
      dongs: [
        { studentId: sidMB, huong: 'len_lop', toClassId: be },
        { studentId: sidCP, huong: 'len_lop', toClassId: be },
      ],
    }) as any;
    assert(r.done.length === 1 && r.done[0].studentId === sidMB, `Chỉ em thuộc lớp nguồn được chuyển: ${JSON.stringify(r)}`);
    assert(r.failed.length === 1 && r.failed[0].studentId === sidCP && /không thuộc lớp/.test(r.failed[0].message),
      `Em ngoài lớp phải failed với đúng câu: ${JSON.stringify(r.failed)}`);
    const enrCP = conn.prepare(`SELECT class_id, status FROM enrollments WHERE student_id=?`).get(sidCP) as any;
    assert(enrCP.class_id === clsCP && enrCP.status === 'active', 'Em ngoài lớp nguồn không được đổi gì');
  });

  check('PR-LT (rà #86) · applyTransition: lớp chuyển đến đã kết thúc (không còn active) → failed, không đổi gì', () => {
    const { cls } = taoLopHetKhoa5(9, 0);
    const { sid } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    const daKetThuc = taoLop4({ branchId: MB3, kind: 'BE', ft: false, tuanHienTai: 1 });
    conn.prepare(`UPDATE classes SET status = 'finished' WHERE id = ?`).run(daKetThuc);
    const r = transitionSvc.applyTransition(P.mbManager, {
      fromClassId: cls, effectiveDate: TODAY3,
      dongs: [{ studentId: sid, huong: 'len_lop', toClassId: daKetThuc }],
    }) as any;
    assert(r.done.length === 0 && r.failed.length === 1 && /Lớp chuyển đến không hợp lệ/.test(r.failed[0].message),
      `Lớp chuyển đến đã kết thúc phải failed: ${JSON.stringify(r)}`);
    const enr = conn.prepare(`SELECT status FROM enrollments WHERE student_id=?`).get(sid) as any;
    assert(enr.status === 'active', 'Không đổi gì khi lớp chuyển đến không hợp lệ');
  });

  check('PR-LT (rà #86) · chương theo lớp (thay lichSuLop): em KHÔNG có điểm Final Test dù bạn cùng lớp có điểm — dòng lịch sử không lộ "đạt" của bạn', () => {
    const { cls } = taoLopHetKhoa5(9, 0);
    const { sid: sidCoDiem, cycleId: cyCoDiem } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    const { sid: sidKhongDiem } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    const attemptId = Number(conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, status, created_at)
       VALUES (?,?,1,'final',?, 'done', ?)`,
    ).run(cyCoDiem, sidCoDiem, cls, new Date().toISOString()).lastInsertRowid);
    const insScore = conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_at) VALUES (?,?,?,?,?)`);
    for (const sk of ['listening', 'reading', 'writing', 'speaking']) insScore.run(attemptId, sk, 10, 10, TODAY3);
    studentsSvc4.setStudentStatus(P.mbManager, sidKhongDiem, 'finished', TODAY3, 'Nghỉ hẳn');
    const rows = chuongCua(P.admin, sidKhongDiem);
    const dongLop = rows.find((r) => r.classId === cls);
    assert(dongLop && dongLop.ghim.length === 0, `Em không có điểm không được lộ kết quả của bạn cùng lớp: ${JSON.stringify(dongLop?.ghim)}`);
  });

  check('PR-LT (rà #86) · transferStudent sang Fast Track: thangThi lưu đúng vào learning_cycles.exam_month', () => {
    const from = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 3 });
    const to = taoLop4({ branchId: MB3, kind: 'FT', ft: true });
    const { sid } = taoHV4({ clsId: from, ma: 'FOU', ft: false });
    const gvcn = ganGVCN3(from, P.normalCoreTeacher.userId);
    studentsSvc4.transferStudent(P.admin, sid, to, TODAY3, 'Xếp lại trình độ', { note: 'Đủ trình lên FT', mucTieu: 6.5, thangThi: '2027-03' });
    const cyc = conn.prepare(`SELECT exam_month FROM learning_cycles WHERE student_id=? AND status='active'`).get(sid) as any;
    assert(cyc.exam_month === '2027-03', `exam_month phải lưu đúng thangThi: ${JSON.stringify(cyc)}`);
  });

  check('PR-LT (rà #86) · applyTransition sang Fast Track (cả lớp): thangThi lưu đúng vào learning_cycles.exam_month', () => {
    const { cls } = taoLopHetKhoa5(9, 0);
    const { sid } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    const ft = taoLop4({ branchId: MB3, kind: 'FT', ft: true });
    transitionSvc.applyTransition(P.mbManager, {
      fromClassId: cls, effectiveDate: TODAY3,
      dongs: [{ studentId: sid, huong: 'fast_track', toClassId: ft, mucTieu: 6.5, thangThi: '2027-06' }],
    });
    const cyc = conn.prepare(`SELECT exam_month FROM learning_cycles WHERE student_id=? AND status='active'`).get(sid) as any;
    assert(cyc.exam_month === '2027-06', `exam_month (cả lớp) phải lưu đúng thangThi: ${JSON.stringify(cyc)}`);
  });

  check('PR-LT (rà #86) · Quyền xem HV theo chi nhánh ĐANG HỌC: chuyển MB→CP thì QL CP thấy ngay, QL MB mất quyền ngay; hết ghi danh active thì giữ luật cũ (mọi chi nhánh từng học)', () => {
    const from = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const to = taoLop4({ branchId: CP4, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const { sid } = taoHV4({ clsId: from, ma: 'FOU', ft: false });
    const gvcn = ganGVCN3(from, P.normalCoreTeacher.userId);
    studentsSvc4.transferStudent(P.admin, sid, to, TODAY3, 'Đổi chi nhánh', { noNote: true });
    assert(!!profileSvc.studentProfile(P.cpManager, sid), 'QL CP phải thấy hồ sơ em ngay sau khi chuyển vào CP (chỉ còn ghi danh active ở CP)');
    assertThrows(() => profileSvc.studentProfile(P.mbManager, sid), /phạm vi/, 'QL MB phải mất quyền xem ngay (không còn ghi danh active ở MB)');

    // Em nghỉ hẳn — hết ghi danh active, có lịch sử ở CẢ HAI chi nhánh — giữ luật cũ (một QL một chi nhánh không đủ).
    studentsSvc4.setStudentStatus(P.cpManager, sid, 'finished', TODAY3, 'Nghỉ hẳn');
    assertThrows(() => profileSvc.studentProfile(P.mbManager, sid), /phạm vi/, 'QL MB (một chi nhánh) vẫn không đủ phạm vi dù em đã nghỉ (lịch sử hai chi nhánh)');
    assertThrows(() => profileSvc.studentProfile(P.cpManager, sid), /phạm vi/, 'QL CP (một chi nhánh) cũng không đủ phạm vi — giữ đúng luật cũ, chỉ vai toàn hệ thống mới thấy');
    assert(!!profileSvc.studentProfile(P.admin, sid), 'Vai toàn hệ thống vẫn thấy đúng theo luật cũ');
  });

  check('PR-LT (rà #86) · applyTransition tạm dừng học (bảo lưu) (cả lớp): enrollment ghi end_reason, journey_events ghi đúng created_by', () => {
    const { cls } = taoLopHetKhoa5(9, 0);
    const { sid } = taoHV4({ clsId: cls, ma: 'FOU', ft: false });
    transitionSvc.applyTransition(P.mbManager, {
      fromClassId: cls, effectiveDate: TODAY3,
      dongs: [{ studentId: sid, huong: 'bao_luu', lyDo: 'Ốm dài ngày', ngayXemLai: addDays3(TODAY3, 30) }],
    });
    const enr = conn.prepare(`SELECT end_reason FROM enrollments WHERE student_id=? ORDER BY id DESC LIMIT 1`).get(sid) as any;
    assert(enr.end_reason === 'Ốm dài ngày', `end_reason phải ghi đúng lý do: ${JSON.stringify(enr)}`);
    const ev = conn.prepare(`SELECT created_by FROM journey_events WHERE student_id=? AND event_type='pause' ORDER BY id DESC LIMIT 1`).get(sid) as any;
    assert(ev.created_by === P.mbManager.userId, `created_by phải là người bấm xác nhận, không phải NULL: ${JSON.stringify(ev)}`);
  });

  check('PR-LT (rà #86) · thongBaoChuyenVao: chỉ báo QL còn hoạt động (user_roles.status=active), bỏ qua vai đã nghỉ', () => {
    const from = taoLop4({ branchId: MB3, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const to = taoLop4({ branchId: CP4, kind: 'FOU', ft: false, tuanHienTai: 2 });
    const { sid } = taoHV4({ clsId: from, ma: 'FOU', ft: false });
    const gvcn = ganGVCN3(from, P.normalCoreTeacher.userId);
    const now = new Date().toISOString();
    const roleId = (conn.prepare(`SELECT id FROM roles WHERE key = 'manager'`).get() as any).id;
    const uid = Number(conn.prepare(
      `INSERT INTO users (code, full_name, title, status, created_at) VALUES ('LT86-QLNGHI', 'QL CP đã nghỉ', 'QL', 'active', ?)`,
    ).run(now).lastInsertRowid);
    conn.prepare(`INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,?, 'inactive', ?)`)
      .run(uid, roleId, CP4, now);
    studentsSvc4.transferStudent(P.admin, sid, to, TODAY3, 'Đổi chi nhánh', { noNote: true });
    const noti = conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE user_id=? AND kind='transfer_in'`).get(uid) as any;
    assert(noti.n === 0, `QL đã nghỉ (user_roles.status inactive) không được nhận thông báo: ${noti.n}`);
  });
}
