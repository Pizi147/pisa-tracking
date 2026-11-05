/**
 * PHÉP KIỂM V5 · UI-CON-LAI (nợ #528 — `08` bảng nợ): số "việc của tôi" (`/my-work` → `summary`) không đếm việc `mine:false`
 * (vd "Thêm PA" Case người khác phụ trách). S11 (UI-CV-V12): một dòng = 1 — dòng Nhập điểm nhiều kỹ năng là MỘT việc (thay `knsQuaHan` đếm kỹ năng).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export async function runPrUiConLaiTests(t: any) {
  const { check, assert, P } = t;
  const mw: any = await import('../worklist/mywork.ts');
  const pv: any = await import('../giaoVien/phamVi.ts');
  console.log('\nV5 · UI-CON-LAI — badge việc của tôi (nợ #528)');

  const viec = (o: any) => ({ key: o.key, group: o.group ?? 'cause', urgency: o.urgency ?? 'normal', studentId: o.studentId ?? 1, mine: o.mine ?? true,
    kns: o.kns, knsQuaHan: o.knsQuaHan, soBai: o.soBai });

  check('UICL-1 (#528) · demSo: việc mine:false (Thêm PA Case người khác) không vào viec / viecQuaHan', () => {
    const ds = [viec({ key: 'cause:1' }), viec({ key: 'support:2', group: 'no_plan', mine: false, urgency: 'overdue' })];
    const s = mw.demSo(ds);
    assert(s.viec === 1 && s.viecQuaHan === 0 && s.canLamNgay === 0, JSON.stringify(s));
  });

  check('UICL-2 → S11 (UI-CV-V12) · demSo: dòng Nhập điểm L + R quá hạn = MỘT việc → viec 1, viecQuaHan 1, canLamNgay 1 (không nhân kỹ năng)', () => {
    const ds = [viec({ key: 'score:1', group: 'score', studentId: null, urgency: 'overdue', kns: ['listening', 'reading'], knsQuaHan: ['listening'], soBai: 4 })];
    const s = mw.demSo(ds);
    assert(s.viec === 1 && s.viecQuaHan === 1 && s.canLamNgay === 1, JSON.stringify(s));
  });

  check('UICL-3 (#528) · /my-work GV seed: summary.viec = số DÒNG mine (S11); mọi dòng Nhập điểm quá hạn có knsQuaHan ⊆ kns, không rỗng', () => {
    for (const p of [P.lrTeacher, P.w1Teacher, P.sTeacher, P.coreTeacher]) {
      const w = mw.myWork(p, {});
      const s = mw.demSo(w.dong.filter((i: any) => i.mine), () => true);
      assert(w.summary.viec === s.viec, `${p.userId}: ${w.summary.viec} ≠ ${s.viec}`);
      for (const i of w.items.filter((x: any) => x.group === 'score' && x.urgency === 'overdue')) {
        assert(i.knsQuaHan?.length && i.knsQuaHan.every((k: string) => i.kns.includes(k)), `${i.key}: ${JSON.stringify(i.knsQuaHan)}`);
      }
    }
  });

  check('UICL-4 (k1) · tìm GV ở thanh trên: QL chỉ GV mở được hồ sơ (phamViHoSoGv không ném); GV / TVV rỗng; < 2 ký tự rỗng', () => {
    const ql = P.mbManager;
    const ds = pv.timGiaoVien(ql, 'ng');
    assert(ds.length > 0, 'QL Monbay phải thấy GV có chữ "ng"');
    for (const g of ds) pv.phamViHoSoGv(ql, g.id);   // ném 403 / 404 nếu lọt ngoài phạm vi
    assert(!pv.timGiaoVien(P.coreTeacher, 'ng').length, 'GV không có nhóm Giáo viên');
    assert(!pv.timGiaoVien(ql, 'n').length, '1 ký tự → rỗng');
  });

  check('UICL-5 (k3, Q-RL2c) · Hoàn tác 5 s ở thẻ duyệt theo cờ `coTheHuy` máy chủ trả về sau quyết định — web không hứa điều máy chủ từ chối (không danh sách loại cứng)', () => {
    const web = fs.readFileSync(path.join(REPO, 'web/src/modules/duyet/TheYeuCau.tsx'), 'utf8');
    assert(!/HUY_DUOC/.test(web) && /kq\?\.coTheHuy/.test(web), 'Hoàn tác 5 s phải theo cờ coTheHuy máy chủ trả về');
  });

  check('UICL-6 (chủ SP 24/10) · ô điểm thiếu nhận xét MT: viền vàng, KHÔNG chữ dưới điểm (lưới + ô lớn hồ sơ MT); câu nhắc còn ở tooltip / tên đọc màn', () => {
    const hop = fs.readFileSync(path.join(REPO, 'web/src/modules/fasttrack/HopNhapDiem.tsx'), 'utf8');
    const lon = fs.readFileSync(path.join(REPO, 'web/src/modules/fasttrack/ODiemLon.tsx'), 'utf8');
    assert(!/ChuThieu/.test(hop) && /cell\.thieuNhanXet \? VIEN_THIEU_NX/.test(hop) && /CHU_O_THIEU\[cell\.thieuNhanXet\]/.test(hop), 'lưới: viền vàng + tooltip, không chữ');
    assert(!/text-soon/.test(lon) && /--soon-rgb/.test(lon) && /aria-description=\{thieu/.test(lon), 'ô lớn: viền vàng + aria, không chữ');
  });

  check('UICL-7 (k3, chủ SP 24/10) · Hộp duyệt đầy đủ = danh sách dòng gọn + panel duyệt TẠI CHỖ (`?the=`, mẫu Chấm Test); bản gọn (V8-CV: dòng cây); hàng loạt giữ', () => {
    const h = fs.readFileSync(path.join(REPO, 'web/src/modules/duyet/HopChoDuyet.tsx'), 'utf8');
    assert(/<DongYeuCau /.test(h) && /<KhungTaiCho\.Provider value>/.test(h) && /<PanelDuyet key=\{theMo\.id\}/.test(h) && /<TheYeuCau yc=\{yc\} panel /.test(h), 'danh sách + panel');
    assert(/next\.set\('the', String\(id\)\)/.test(h) && /(ds|dsCay)\.length > 0 && gon &&/.test(h) && /chonMot\(ds, s, y\.id, v\)/.test(h), '?the= · bản gọn · hàng loạt');
  });

  check('V8-CV (mockup v8 cong-viec-ql, chủ SP duyệt 29/10) · Chờ bạn duyệt là nhóm đầu cột trái (dòng cây, panel duyệt ở cột phải); một panel một lúc; Mọi khung là ô chọn; giữ Duyệt tại dòng · Từ chối… · Trả lời… · Mở › · Hoàn tác', () => {
    const h = fs.readFileSync(path.join(REPO, 'web/src/modules/duyet/HopChoDuyet.tsx'), 'utf8');
    const cv = fs.readFileSync(path.join(REPO, 'web/src/modules/congViec/HoTroHocVienTab.tsx'), 'utf8');
    const the = fs.readFileSync(path.join(REPO, 'web/src/modules/duyet/TheYeuCau.tsx'), 'utf8');
    assert(/<CayDuyet ds=\{(dsHien|dsCay)\}/.test(h) && /createPortal\(/.test(h) && /\bkhuPanel,\r?\n/.test(h), 'bản gọn = cây + panel vào cột phải');
    assert(/onDuyet\(y\)/.test(h) && /onMo\(y, 'tu-choi'\)/.test(h) && /onMo\(y, 'tra-loi'\)/.test(h) && /t\('Mở ›'\)/.test(h), 'thao tác của dòng');
    assert(/huy-quyet-dinh/.test(h) && /t\('Yêu cầu tiếp ›'\)/.test(h) && /if \(gon && id\) \{ next\.delete\('viec'\)/.test(h), 'Hoàn tác · Yêu cầu tiếp · bỏ panel việc');
    assert(/moSan === 'tu-choi' \|\| moSan === 'tra-loi'/.test(the) && /onXong\(yc\.id, xongChu(, huyDuoc(, kq\?\.soLichSu)?)?\)/.test(the), 'panel mở sẵn ô + câu kết quả');
    const iTrai = cv.indexOf('{coDuyet && ('), iDs = cv.indexOf('<DanhSachViec nhom=');
    assert(iTrai > 0 && iTrai < iDs && cv.indexOf('lg:grid lg:grid-cols-[520px') < iTrai, 'Chờ bạn duyệt trong cột trái, trước nhóm việc');
    assert(!/chờ bạn duyệt', \{ n: demDuyet/.test(cv) && /kieu="chon" chuTatCa=\{t\('Mọi khung'\)\}/.test(cv) && /next\.delete\('the'\);/.test(cv), 'bỏ chữ trùng đầu trang · Mọi khung · mở việc bỏ panel duyệt');
  });
}
