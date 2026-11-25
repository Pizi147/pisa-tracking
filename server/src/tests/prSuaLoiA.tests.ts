/**
 * SUA-LOI-A (tệp rà ngoài `01-CRM-PISA-sua-loi.md` mục A + B1, PTA Plan giao 25/11): 5 lỗi phía web — kiểm nguồn
 * (trang không có phép kiểm dựng React; mỗi mẫu là đúng chỗ sửa, gỡ là lỗi quay lại).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8') as string;

export async function runPrSuaLoiATests(t: any) {
  const { check, assert } = t;
  console.log('\nSUA-LOI-A — Xuất Excel · tìm nhanh · Hồ sơ cá nhân · Quá hạn chấm · Hoàn tác theo dõi Meeting');

  check('SLA-1 · Xuất Excel: "Thử lại" lặp đúng bước lỗi (đếm trước / Báo cáo PH / danh sách), không gọi cứng xuất danh sách', () => {
    const src = doc('web/src/modules/students/NganXuatDs.tsx');
    assert(!src.includes('onClick={() => void tai()}>{t(\'Thử lại\')}'), 'Thử lại còn gọi cứng tai() (xuất danh sách)');
    assert(src.includes("setBuocLoi('dem')") && src.includes("setBuocLoi('bc')") && src.includes("setBuocLoi('ds')"), 'bước lỗi chưa ghi ở cả 3 nhánh');
    assert(src.includes("const thuLai = () => { if (buocLoi === 'dem') setDemLai((x) => x + 1); else void (buocLoi === 'bc' ? taiBc() : tai()); };")
      && src.includes('}, [loai, thang, pham, demLai]);') && src.includes('onClick={thuLai}'), 'Thử lại đếm trước phải chạy lại đúng effect đếm (giữ tháng / phạm vi)');
    assert(src.includes("if (loai !== 'bc' || !dsId.length) { setDem(null); setLoi(null); return undefined; }"), 'lỗi đếm treo khi đổi sang phạm vi 0 HV (PTA rà #2162)');
  });

  check('SLA-2 · tìm nhanh: bỏ phản hồi (cả lỗi) của từ khoá cũ; danh sách chỉ của câu đang gõ', () => {
    const src = doc('web/src/modules/platform/Header.tsx');
    assert(src.includes('.then(([d, g]) => { if (!con) return;') && src.includes('.catch(() => { if (!con) return;')
      && src.includes('return () => { con = false; clearTimeout(t); };'), 'phản hồi cũ còn ghi đè kết quả');
    assert(src.includes('const hits = daTim === q ? hitsDaTim : [];') && src.includes('const gvs = daTim === q ? gvsDaTim : [];'),
      'chuột / mũi tên còn dùng kết quả của câu trước trong lúc chờ');
    assert(src.includes('onChange={(e) => { setQ(e.target.value); setMoTim(true); setDong(-1); }}'), 'đổi câu phải bỏ dòng đang sáng');
  });

  check('SLA-3 · Hồ sơ cá nhân: lưu xong chỉ dọn đúng bản đã gửi — chữ gõ thêm trong lúc chờ còn nguyên', () => {
    const src = doc('web/src/modules/platform/ProfilePage.tsx');
    assert(!src.includes('setDraft(null); reload();'), 'lưu xong xoá cả bản đang gõ');
    assert(src.includes('const daGui = draft;') && src.includes('setDraft((x) => (x === daGui ? null : x));'), 'thiếu so bản đã gửi');
  });

  check('SLA-4 · Lịch Test: ô Quá hạn phân biệt đang tải "…" / lỗi "—" + Thử lại / số thật', () => {
    const tab = doc('web/src/modules/test/LichTestTab.tsx');
    const dai = doc('web/src/modules/test/lichTest/DaiSo.tsx');
    assert(tab.includes('dangTaiNo={!quaHan && !oQuaHan.error} thuLaiNo={!quaHan && oQuaHan.error ? oQuaHan.reload : undefined}'), 'lỗi đường quá hạn vẫn bị coi là đang tải');
    assert(dai.includes('{thuLaiNo') && dai.includes('<SoTinh n="—" />') && dai.includes('onClick={thuLaiNo}'), 'ô lỗi thiếu "—" + Thử lại');
  });

  check('SLA-5 · Meeting: Hoàn tác bỏ theo dõi chỉ thêm lại đúng các phần đã bỏ thành công; lỗi một phần → tải lại', () => {
    const src = doc('web/src/modules/congViec/KhoiGiaoViec.tsx');
    assert(!src.includes("void goi((g) => (g.coTheSuaTheoDoi && g.mo ? thaoTac.themTheoDoi(g, [n.id]) : null))"), 'Hoàn tác còn thêm vào mọi phần mở');
    assert(src.includes('const kq = await Promise.allSettled(chon.map(f));') && src.includes("if (loi) { toast.push('error', loi?.message ?? t('Không lưu được')); reload(); }"),
      'mỗi phần phải lưu riêng; lỗi một phần thì tải lại trạng thái');
    assert(src.includes('daBo.includes(khoaPhan(g)) && (g.coTheSuaTheoDoi || n.id === toi) && g.mo') && src.includes('dsMoi.current = ds;'), 'Hoàn tác phải lọc đúng tập đã bỏ, đọc danh sách mới nhất');
    /* PTA rà #2162: không phần nào thêm lại được → không hiện Hoàn tác; hai lượt về sát nhau không đè nhau. */
    assert(src.includes("if (!themLai().length) { toast.push('ok', chu); return; }"), 'Hoàn tác hiện cả khi không còn phần nào thêm lại được');
    assert(src.includes('dsMoi.current = dsMoi.current.map((g) => moi.get(khoaPhan(g)) ?? g); dat(dsMoi.current);'), 'lượt lưu sau đè lượt trước khi chưa vẽ lại');
  });
}
