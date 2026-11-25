/**
 * Rà ngoài `01-CRM-PISA-sua-loi.md` (25/11) B2–B7 — kiểm nguồn (các trang này không có phép kiểm dựng React; mỗi mẫu là đúng chỗ sửa, gỡ là lỗi quay lại).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8') as string;

export async function runPrSuaLoi01Tests(t: { check: any; assert: any }) {
  const { check, assert } = t;
  console.log('\nSUA-LOI-01 — B2–B7: lưu chậm giữ chữ mới · gập Case mở đích danh · lỗi tải danh mục phụ báo tại chỗ + Thử lại');
  check('B2 · Tutor: lưu nhận xét chỉ dọn form khi form còn đúng bản đã gửi; gõ tiếp vào nhận xét vừa tạo → lần sau sửa đúng nhận xét đó', () => {
    const s = doc('web/src/modules/tutor/PanelTutor.tsx');
    assert(s.includes('formNay.current = { kl, noiDung, dangSua };') && s.includes('const f = formNay.current;')
      && s.includes('if (f.kl === gui0.kl && f.noiDung === gui0.noiDung && f.dangSua === gui0.dangSua) boForm();'), 'thành công vẫn xoá chữ gõ trong lúc lưu');
    assert(s.includes('else if (f.dangSua === gui0.dangSua && !gui0.dangSua && moi?.id) setDangSua(moi.id);'), 'gõ tiếp sau khi tạo → lần Lưu sau tạo bản trùng');
    assert(!/await api\.post\(`\/tutors\/\$\{id\}\/nhan-xet`, than\);\s*boForm\(\);/.test(s), 'còn boForm() vô điều kiện sau lưu');
  });
  check('B3 · Cột Case: "Gập Case" khi Case mở theo yêu cầu (ep) tiêu yêu cầu đó — một lần bấm gập được; huỷ form trong Case giữ Case mở', () => {
    const s = doc('web/src/modules/students/CotCaseHv.tsx');
    assert(s.includes('if (ep && moRa) setDaDong((x) => ({ ...x, [c.id]: ep.n }));'), 'gập không tiêu ep → `!!ep` giữ Case mở');
    assert(s.includes('const ep = yeuCau?.caseId === c.id && daDong[c.id] !== yeuCau.n ? yeuCau : null;'), 'yêu cầu mới (mo.n khác) phải mở lại đúng PA');
    assert(s.includes('if (ep) { setDaDong((x) => ({ ...x, [c.id]: ep.n })); setTay((x) => ({ ...x, [c.id]: true })); }'), 'huỷ form trong Case mở theo yêu cầu làm gập cả Case');
  });
  check('B4 · danh sách lớp lỗi lần đầu: báo tại ô + Thử lại (Tiếp nhận HV, Lộ trình mới, Học tiếp) — không treo "Đang tải…"', () => {
    const lt = doc('web/src/modules/students/PanelLoTrinhMoi.tsx');
    assert((lt.match(/dsLop\.error && !dsLop\.data \? <LoiTaiNho chu=\{t\('Không tải được lớp\.'\)\} onRetry=\{dsLop\.reload\}/g) ?? []).length === 2, 'Lộ trình mới / Học tiếp');
    const ip = doc('web/src/modules/students/IntakePanel.tsx');
    assert(ip.includes("classes.error && !classes.data ? <LoiTaiNho chu={t('Không tải được lớp.')} onRetry={classes.reload}"), 'Tiếp nhận HV');
  });
  check('B5 · Tài khoản: danh mục chi nhánh lỗi → form duyệt / sửa báo lỗi + Thử lại tại chỗ chọn chi nhánh; Duyệt tắt tới khi tải được', () => {
    const s = doc('web/src/modules/platform/AccountsAdmin.tsx');
    assert(s.includes("const loiCn = branches.error && !branches.data ? <LoiTaiNho chu={t('Không tải được danh mục chi nhánh.')} onRetry={branches.reload}"), 'thiếu báo lỗi');
    assert((s.match(/<PendingRow [^>]*loiCn=\{loiCn\}/g) ?? []).length === 2 && (s.match(/<AccountDialog [^>]*loiCn=\{loiCn\}/g) ?? []).length === 2, 'form chưa nhận loiCn');
    assert(s.includes('disabled={busy || !!loiCn ||') && s.includes('{loiCn ?? <span className="inline-flex flex-wrap gap-1 align-middle">'), 'duyệt khi chưa thấy chi nhánh');
  });
  check('B6 · Chép mật khẩu ban đầu dùng NutSaoChep (trình duyệt chặn → hộp bôi đen sẵn), không còn nút nuốt lỗi', () => {
    const s = doc('web/src/modules/platform/AccountsAdmin.tsx');
    assert(s.includes("<NutSaoChep chu={form.password} nhan={t('Chép mật khẩu ban đầu')} />") && !s.includes('NutChepMatKhau') && !s.includes('() => undefined); }}'), 'còn nút chép im lặng');
    const n = doc('web/src/ui/NutSaoChep.tsx');
    assert(n.includes('catch { setChan(true); }') && n.includes("nhanRieng ?? t('Sao chép việc quá hạn của {gv} để nhắn'"), 'NutSaoChep mất nhánh lỗi / nhãn riêng');
  });
  check('B7 · Mock / lượt lớp thường: danh sách đợt lỗi báo tại chỗ + Thử lại; tải lại chung gọi lại danh sách đợt khi nó lỗi', () => {
    for (const f of ['web/src/modules/fasttrack/MockDetailPage.tsx', 'web/src/modules/fasttrack/LuotThuongPage.tsx']) {
      const s = doc(f);
      assert(s.includes("{dsDot.error && !dsDot.data && <LoiTaiNho chu={t('Không tải được các đợt khác.')} onRetry={dsDot.reload}"), `${f}: lỗi đợt bị ẩn`);
      assert(s.includes('if (bang.data) bang.reload(); if (dsDot.error) dsDot.reload(); };'), `${f}: tải lại chung bỏ sót danh sách đợt`);
    }
  });
}
