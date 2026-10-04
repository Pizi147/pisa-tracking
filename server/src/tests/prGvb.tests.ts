/** PHÉP KIỂM PR-GVb — Chờ duyệt: duyệt nhiều ở Tất cả, Để QL biết, chip đếm, tone chờ chấm, Bị từ chối. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrGvbTests(t: YThucTestKit) {
  const { check, checkAsync, assert, P, conn, classId } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-GVb · Chờ duyệt');

  check('GVb (1) · nhomCuaLoai: mọi loại kieuNut "nhac" → de-biet, còn lại can-quyet; PHAN_LOAI_CAN_QUYET bỏ bao-len', () => {
    for (const k of d.LOAI_YEU_CAU) {
      const m = d.LOAI_YC_META[k];
      assert(d.nhomCuaLoai(k) === (m.kieuNut === 'nhac' ? 'de-biet' : 'can-quyet'), k);
    }
    assert(!d.PHAN_LOAI_CAN_QUYET.includes('bao-len') && d.PHAN_LOAI_CAN_QUYET.includes('hoc-thuat'), String(d.PHAN_LOAI_CAN_QUYET));
  });

  check('GVb (1) · demHop: tong/chip "Tất cả" chỉ thẻ phải quyết; deBiet đếm riêng; quaHan không lẫn Báo QL', () => {
    const h = '2026-10-03';
    const r = d.demHop([
      { loai: 'de_xuat_pa', phanLoai: 'hoc-thuat', hanDuyet: '2026-10-01' },
      { loai: 'xin_y_kien', phanLoai: 'hoc-thuat', hanDuyet: null },
      { loai: 'bao_len_mini_test', phanLoai: 'bao-len', hanDuyet: '2026-09-30' },
      { loai: 'bao_len_y_thuc', phanLoai: 'bao-len', hanDuyet: null },
    ], h);
    assert(r.tong === 2 && r.chip['tat-ca'] === 2 && r.deBiet === 2 && r.quaHan === 1 && r.deBietQuaHan === 1, JSON.stringify(r));
  });

  check('GVb (1) · chonMot: khác loại → bắt đầu lại từ thẻ mới; loại không hangLoat → không chọn; trần 50', () => {
    const ds = [
      ...Array.from({ length: 60 }, (_, i) => ({ id: i + 1, loai: 'de_xuat_pa', hangLoat: true, trangThai: 'cho' })),
      { id: 100, loai: 'lich_thi', hangLoat: true, trangThai: 'cho' },
      { id: 200, loai: 'xin_y_kien', hangLoat: false, trangThai: 'cho' },
    ];
    let s = d.chonMot(ds, new Set(), 1, true);
    s = d.chonMot(ds, s, 2, true);
    assert([...s].join() === '1,2', [...s].join());
    s = d.chonMot(ds, s, 100, true);
    assert([...s].join() === '100', 'đổi loại phải bắt đầu lại: ' + [...s].join());
    assert(d.chonMot(ds, s, 200, true).size === 1 && d.chonMot(ds, s, 200, true).has(100), 'loại không hàng loạt lọt vào');
    const het = d.chonHet(ds, 'de_xuat_pa');
    assert(het.size === d.TRAN_HANG_LOAT && !het.has(100), `chonHet ${het.size}`);
    let day = het;
    day = d.chonMot(ds, day, 55, true);
    assert(day.size === d.TRAN_HANG_LOAT && !day.has(55), 'vượt trần 50');
    assert(d.chonHet(ds, 'xin_y_kien').size === 0, 'chonHet loại không hàng loạt');
  });

  check('GVb (1) · tomTatKetQuaHangLoat: "Đã duyệt 7/9 — 2 không có quyền"; gom theo mã; toàn bộ xong không có vế sau', () => {
    const q = (n: number, ma: number, loi = 'x') => Array.from({ length: n }, () => ({ ma, loi }));
    assert(d.tomTatKetQuaHangLoat('duyet', 7, q(2, 403)) === 'Đã duyệt 7/9 — 2 không có quyền', d.tomTatKetQuaHangLoat('duyet', 7, q(2, 403)));
    assert(d.tomTatKetQuaHangLoat('duyet', 5, []) === 'Đã duyệt 5/5', d.tomTatKetQuaHangLoat('duyet', 5, []));
    const s = d.tomTatKetQuaHangLoat('nhac', 3, [...q(1, 403), ...q(2, 400, 'Yêu cầu này đã được xử lý.'), ...q(1, 404)]);
    assert(s === 'Đã nhắc 3/7 — 1 không có quyền, 2 đã có người xử lý, 1 không còn', s);
  });

  // ---------------------------------------------------------------- GVb-2: một nguồn đếm, tab Để QL biết, duyetNhieu trả mã
  const yc = await import('../duyet/yeuCau.ts');
  const { DINH_NGHIA_LOAI } = await import('../duyet/loaiYeuCau.ts');
  const maLoi = (f: () => unknown) => { try { f(); return 0; } catch (e: any) { return e?.status ?? -1; } };

  check('GVb (2) · J5b: badge (demYeuCau.cho) = số thẻ tab Chờ duyệt = số thẻ có nút Duyệt/Trả lời; Để QL biết tách riêng', () => {
    for (const p of [P.mbManager, P.admin]) {
      const dem = yc.demYeuCau(p);
      const cho = yc.hopChoDuyet(p, { xem: 'cho' });
      const biet = yc.hopChoDuyet(p, { xem: 'de-biet' });
      const coNut = cho.the.filter((x) => x.kieuNut === 'duyet-tu-choi' || x.kieuNut === 'tra-loi').length;
      assert(dem.cho === cho.the.length && cho.the.length === coNut && cho.dem['tat-ca'] === dem.cho,
        `badge ${dem.cho} · hộp ${cho.the.length} · có nút ${coNut} · chip ${cho.dem['tat-ca']}`);
      assert(biet.the.length > 0 && biet.the.every((x) => x.kieuNut === 'nhac') && biet.the.length === dem.deBiet && cho.demBiet === dem.deBiet,
        `de-biet ${biet.the.length} vs ${dem.deBiet}`);
      assert(!cho.the.some((x) => x.kieuNut === 'nhac'), 'thẻ Báo QL còn lọt vào Chờ duyệt');
    }
  });

  await checkAsync('GVb (2) · tongQuanQuanLy.choDuyet === demYeuCau (một nguồn)', async () => {
    const { tongQuanQuanLy } = await import('../worklist/tongQuan.ts');
    const tq = (await tongQuanQuanLy(P.mbManager, {})) as any;
    const dem = yc.demYeuCau(P.mbManager);
    assert(tq.choDuyet.cho === dem.cho && tq.choDuyet.deBiet === dem.deBiet && tq.choDuyet.quaHan === dem.quaHan, JSON.stringify(tq.choDuyet));
  });

  {
    /* Loại GIẢ hàng loạt (mẫu prDuyet.tests.ts khối 3): hai thẻ cùng loại — một học viên Monbay, một học viên chi nhánh khác. */
    const GIA = 'thu_gvb' as any;
    (d.LOAI_YC_META as any)[GIA] = { phanLoai: 'hoc-thuat', nhan: 'Thử GVb', kieuNut: 'duyet-tu-choi', hanNgay: 5, hangLoat: true };
    DINH_NGHIA_LOAI.push({ loai: GIA, chet: { sql: 'y.doi_tuong_id < 0', lyDo: 'thử' }, moTa: () => ({ tieuDe: 'Thử GVb', dong: [] }) } as any);
    const motEm = (lop: string) => (conn.prepare(`SELECT student_id AS id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY id LIMIT 1`).get(classId(lop)) as any).id as number;
    const hvNgoai = (conn.prepare(`SELECT e.student_id AS id FROM enrollments e JOIN classes c ON c.id = e.class_id
        WHERE e.status = 'active' AND c.branch_id != (SELECT branch_id FROM classes WHERE id = ?) ORDER BY e.id LIMIT 1`).get(classId('MB FT 101')) as any).id as number;
    let seq = 950000;
    const tao = (hocVienId: number) => yc.taoYeuCau(conn, { loai: GIA, doiTuongLoai: 'thu', doiTuongId: ++seq, hocVienId, nguoiXin: P.coreTeacher.userId, lyDo: 'thử' })!;
    try {
      check('GVb (2) · duyetNhieu: >50 → 400; thẻ ngoài phạm vi → lỗi riêng mã 403, thẻ trong phạm vi vẫn duyệt', () => {
        assert(maLoi(() => yc.duyetNhieu(P.mbManager, Array.from({ length: d.TRAN_HANG_LOAT + 1 }, (_, i) => i + 1))) === 400, 'trần 50');
        const trong = tao(motEm('MB FT 101'));
        const ngoai = tao(hvNgoai);
        const r = yc.duyetNhieu(P.mbManager, [trong, ngoai]);
        assert(r.ok.includes(trong) && r.loi.some((l) => l.id === ngoai && l.ma === 403), JSON.stringify(r));
        assert(d.tomTatKetQuaHangLoat('duyet', r.ok.length, r.loi) === 'Đã duyệt 1/2 — 1 không có quyền', d.tomTatKetQuaHangLoat('duyet', r.ok.length, r.loi));
        const r2 = yc.duyetNhieu(P.mbManager, [trong, 99999999]);
        assert(r2.loi.some((l) => l.id === trong && l.ma === 400) && r2.loi.some((l) => l.id === 99999999 && l.ma === 404), JSON.stringify(r2));
      });
    } finally {
      DINH_NGHIA_LOAI.splice(DINH_NGHIA_LOAI.findIndex((x) => x.loai === GIA), 1);
      conn.prepare('DELETE FROM notifications WHERE entity_type = ? AND entity_id IN (SELECT id FROM yeu_cau_duyet WHERE loai = ?)').run('yeu_cau_duyet', GIA);
      conn.prepare('DELETE FROM yeu_cau_duyet WHERE loai = ?').run(GIA);
      delete (d.LOAI_YC_META as any)[GIA];
    }
  }

  // ---------------------------------------------------------------- GVb-3: Nhắc tất cả
  check('GVb (3) · nhacNhieu: GV → 403; >50 → 400; chỉ thẻ "nhac"; nhắc lần hai trong ngày không tạo thông báo mới', () => {
    assert(maLoi(() => yc.nhacNhieu(P.coreTeacher, [1])) === 403, 'GV');
    assert(maLoi(() => yc.nhacNhieu(P.mbManager, Array.from({ length: d.TRAN_HANG_LOAT + 1 }, (_, i) => i + 1))) === 400, 'trần');
    const biet = yc.hopChoDuyet(P.mbManager, { xem: 'de-biet' }).the
      .filter((x) => typeof x.duLieu?.ownerId === 'number' && typeof x.duLieu?.viecKey === 'string').slice(0, d.TRAN_HANG_LOAT - 1);
    assert(biet.length >= 1, 'seed cần ít nhất một thẻ Báo QL có người nhận');
    const quyet = yc.hopChoDuyet(P.mbManager, { xem: 'cho' }).the[0];
    const demTb = () => (conn.prepare(`SELECT COUNT(*) AS n FROM notifications WHERE kind = 'nhac_viec'`).get() as any).n as number;
    const truoc = demTb();
    const r1 = yc.nhacNhieu(P.mbManager, [...biet.map((x) => x.id), ...(quyet ? [quyet.id] : [])]);
    const sau1 = demTb();
    assert(r1.ok.length + r1.loi.length === biet.length + (quyet ? 1 : 0), JSON.stringify(r1));
    assert(r1.ok.some((x) => x.moi) && sau1 > truoc, `lần một phải gửi ít nhất một nhắc: ${JSON.stringify(r1)}`);
    if (quyet) assert(r1.loi.some((l) => l.id === quyet.id && l.ma === 400), 'thẻ phải quyết không được nhắc hàng loạt');
    const r2 = yc.nhacNhieu(P.mbManager, biet.map((x) => x.id));
    assert(demTb() === sau1 && r2.ok.every((x) => !x.moi), `nhắc lặp trong ngày: ${truoc}→${sau1}→${demTb()}`);
  });

  // ---------------------------------------------------------------- GVb-6, 7, 8: chip dải Tổng quan, tone chờ chấm, Bị từ chối
  check('GVb (6) · J5: chipChoDuyet — phân loại 0 bỏ; Để QL biết là chip riêng mở ?xem=de-biet; không còn câu "gồm … (…)"', () => {
    const dem = { cho: 4, quaHan: 1, baoLen: 3, deBiet: 3, deBietQuaHan: 1, cuaToiCho: 0, cuaToiTuChoi: 0,
      chip: { 'tat-ca': 4, 'hoc-thuat': 3, 'y-thuc': 0, 'lich-thi': 1, 'thong-tin-hv': 0, 'bao-len': 0 } } as any;
    const c = d.chipChoDuyet(dem);
    assert(c.map((x) => `${x.nhan} ${x.so}`).join(' | ') === 'Học thuật 3 | Lịch thi 1 | Quá hạn 1 | Để QL biết 3', c.map((x) => `${x.nhan} ${x.so}`).join(' | '));
    assert(c.find((x) => x.key === 'de-biet')!.den === '?xem=de-biet' && c.find((x) => x.key === 'qua-han')!.den === '?qua-han=1', JSON.stringify(c));
    assert(!('dongPhuChoDuyet' in d), 'hàm câu tóm tắt cũ còn sót');
  });

  check('GVb (7) · U01: badge lớp "n bài chờ chấm" cùng tone với "Chờ chấm" ở Lịch Test (tím wait)', () => {
    const b = d.badgeLop({ vai: 'gv', needsPlacement: false, canXepLop: 0, missingSkills: [], soBaiChoCham: 3, needScoresTitle: null, phase: 'running', missingCount: 0 } as any);
    const cham = [...b.hien, ...b.an].find((x) => x.key === 'cham')!;
    assert(cham && cham.tone === d.TONE_BADGE_TRANG_THAI['cho-cham'], `tone ${cham?.tone}`);
    /* Lịch Test (KhoiNo) dùng TONE_TRANG_THAI['cho-cham']; danh sách lớp đi qua toneNhanTuBadge('wait') → TONE_TRANG_THAI['cho-duyet'] — cùng 'wait'. */
    assert(d.TONE_TRANG_THAI['cho-cham'] === 'wait' && d.TONE_BADGE_TRANG_THAI['cho-cham'] === 'wait' && d.TONE_TRANG_THAI['cho-duyet'] === 'wait', 'bảng tone lệch');
  });

  check('GVb (8) · "Bị từ chối" kiểu Cần làm ở hộp duyệt và Yêu cầu của tôi (cùng nhãn với Tổng quan GV)', () => {
    const n = d.nhanTrangThaiYc('tu_choi');
    assert(n.t === 'can-lam' && n.chu === 'Bị từ chối', JSON.stringify(n));
  });
}
