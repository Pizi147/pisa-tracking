/**
 * CHUONG-V2 (chủ SP 11/11, mockup `thiet-ke/2026-11-11-chuong-v2/` duyệt vòng 2): chuông = Việc cần làm (gom theo loại, từ bản `/my-work` của badge)
 * + Cập nhật (tin một chiều của `/notifications`). "Dùng số chung": số chuông = badge Công việc (`summary.canLamNgay`).
 *  · V2-1 tên loại ở web (`NHAN_LOAI_VIEC`) = `GROUP_META.label` máy chủ, đủ mọi loại.
 *  · V2-2 mọi vai: tổng các dòng loại = `summary.viec`; quá hạn + hôm nay = `summary.canLamNgay` (số chuông = badge).
 *  · V2-3 tin việc (loại "Cần làm" cũ của `thongBao.ts`) không vào Cập nhật — trừ Báo QL (`bao_len`) / bị từ chối (`duyet_tu_choi`): tin cho người xin / QL biết.
 *  · V2-4 tách kết quả tin + nhóm ngày.
 *  · V2-5 web: chuông không tự tải `/notifications` khi mở trang (chỉ khi hộp mở), không GET `/my-work` riêng (nhận bản của App).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function runPrChuongV2Tests(t: any) {
  const { check, assert, conn } = t;
  console.log('\nCHUONG-V2 · chuông: Việc cần làm theo loại + Cập nhật');
  const d: any = await import('../../../shared/domain/index.ts');
  const { myWork, NHOM_VIEC_TVV } = await import('../worklist/mywork.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  const nguon = (f: string) => fs.readFileSync(path.join(ROOT, f), 'utf8');

  check('CHUONG-V2-1 · tên loại việc ở chuông = GROUP_META.label (đủ mọi loại)', () => {
    const src = nguon('server/src/worklist/mywork.ts');
    const khoi = src.slice(src.indexOf('const GROUP_META'), src.indexOf('};', src.indexOf('const GROUP_META')));
    const cap = [...khoi.matchAll(/^\s{2}([a-z_]+): \{[\s\S]*?label: '([^']+)'/gm)].map((m) => [m[1], m[2]] as const);
    assert(cap.length >= 20, `đọc được ${cap.length} loại`);
    const lech = cap.filter(([k, nhan]) => d.NHAN_LOAI_VIEC[k] !== nhan).map(([k, nhan]) => `${k}: "${d.NHAN_LOAI_VIEC[k]}" ≠ "${nhan}"`);
    assert(lech.length === 0, lech.join(' · '));
  });

  check('CHUONG-V2-2 · mọi vai: Σ dòng loại = summary.viec, Σ(quá hạn + hôm nay) = summary.canLamNgay (số chuông = badge Công việc)', () => {
    const nguoi = conn.prepare(`SELECT MIN(u.id) AS id, r.key FROM users u JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active' JOIN roles r ON r.id = ur.role_id
      WHERE u.status = 'active' AND u.deleted_at IS NULL GROUP BY r.key`).all() as any[];
    assert(nguoi.length >= 4, `seed có ${nguoi.length} vai`);
    let coViec = 0;
    for (const { id, key } of nguoi) {
      xoaNho();
      const p = loadPrincipal(id);
      /* cùng nhánh `GET /my-work` không tham số: TVV (không quyền Công việc) đọc nhóm việc TVV. */
      const kq: any = p.roleKeys.includes('consultant') && !p.roleKeys.some((r: string) => r === 'manager' || r === 'teacher' || r === 'admin')
        ? myWork(p, { chiNhom: NHOM_VIEC_TVV }) : myWork(p, {});
      if (!kq.dong) continue;
      const loai = d.gomViecChuong(kq.dong);
      const n = loai.reduce((a: number, l: any) => a + l.n, 0), gap = loai.reduce((a: number, l: any) => a + l.quaHan + l.homNay, 0);
      assert(n === kq.summary.viec, `${key}#${id}: Σ loại ${n} ≠ summary.viec ${kq.summary.viec}`);
      /* GD-9 [XM-9a]: đầu trang Công việc của GV / TVV đếm CÙNG hàm (`dongCuaToi` → `demDongViec`) — việc làm thay có trong danh sách nhưng không tính. */
      assert(d.demDongViec(d.dongCuaToi(kq.dong)).n === n, `${key}#${id}: đầu Công việc ${d.demDongViec(d.dongCuaToi(kq.dong)).n} ≠ chuông ${n}`);
      assert(gap === kq.summary.canLamNgay, `${key}#${id}: Σ quá hạn + hôm nay ${gap} ≠ canLamNgay ${kq.summary.canLamNgay}`);
      assert(loai.every((l: any) => l.ten && l.ten !== l.loai), `${key}#${id}: có loại chưa có tên — ${loai.filter((l: any) => l.ten === l.loai).map((l: any) => l.loai)}`);
      if (n) coViec++;
    }
    assert(coViec >= 2, `ít nhất 2 vai có việc trong seed (có ${coViec})`);
    xoaNho();
  });

  check('CHUONG-V2-3 · tin việc ("Cần làm" cũ) không vào Cập nhật; Báo QL / bị từ chối / tin một chiều thì vào', () => {
    const src = nguon('server/src/platform/thongBao.ts');
    const kinds = [...(src.match(/const KIND_CAN_LAM = \[([\s\S]*?)\]/)?.[1] ?? '').matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    assert(kinds.length >= 10, `đọc được ${kinds.length} loại Cần làm`);
    const giu = new Set(['bao_len', 'duyet_tu_choi', 'sos']);   // sos: gắn Case = việc, gắn lượt = tin (kiểm riêng dưới)
    const sot = kinds.filter((k) => !giu.has(k) && !d.laTinViec({ kind: k }));
    assert(sot.length === 0, `loại việc còn lọt vào Cập nhật: ${sot}`);
    assert(d.laTinViec({ kind: 'sos', entity_type: 'sos_case' }) && !d.laTinViec({ kind: 'sos', entity_type: 'assessment_attempt' }), 'sos: Case = việc, lượt = tin');
    for (const k of ['bao_len', 'duyet_tu_choi', 'duyet_ket_qua', 'transfer_in', 'doi_lich_lop', 'case_dong_gv', 'discipline_de_biet']) {
      assert(!d.laTinViec({ kind: k }), `${k} phải ở Cập nhật`);
    }
    assert(d.laViecTuTin({ kind: 'dang_ky', con_viec: 1 }) && !d.laViecTuTin({ kind: 'dang_ky', con_viec: 0 }), 'đăng ký chờ duyệt → dòng việc; đã duyệt → không');
  });

  check('CHUONG-V2-4 · tách kết quả tin (chữ + màu) và nhóm ngày Xem tất cả', () => {
    const a = d.tachTin({ kind: 'duyet_ket_qua', title: 'Yêu cầu Đổi Target · Nguyễn Minh An · Đã duyệt' });
    assert(a.kq?.tone === 'ok' && a.kq.chu === 'Đã duyệt' && a.chu === 'Đổi Target · Nguyễn Minh An', JSON.stringify(a));
    const b = d.tachTin({ kind: 'duyet_tu_choi', title: 'Yêu cầu Xin dời MT3 · Trịnh Quốc Bảo · Bị từ chối: trùng lịch' });
    assert(b.kq?.tone === 'bad' && b.chu === 'Xin dời MT3 · Trịnh Quốc Bảo — trùng lịch', JSON.stringify(b));
    const c = d.tachTin({ kind: 'transfer_in', title: 'Lê Gia Hân chuyển vào lớp MB FT 101' });
    assert(c.kq === null && c.chu === 'Lê Gia Hân chuyển vào lớp MB FT 101', JSON.stringify(c));
    assert(d.tachTin({ kind: 'lenh_loi', title: 'Chưa thi hành được' }).kq?.tone === 'bad', 'tin lỗi → Lỗi');
    const homNay = '2026-11-12';   // thứ Năm
    const nn = (iso: string) => d.nhomNgayTin(iso, homNay);
    assert(nn('2026-11-12T02:00:00Z') === 'hom-nay' && nn('2026-11-11T09:00:00Z') === 'hom-qua' && nn('2026-11-09T03:00:00Z') === 'tuan-nay'
      && nn('2026-11-08T03:00:00Z') === 'truoc', `nhóm ngày: ${['12', '11', '09', '08'].map((x) => nn(`2026-11-${x}T03:00:00Z`))}`);
    assert(d.soViecMoi(['a', 'b', 'c'], new Set(['a'])) === 2 && d.soViecMoi(['a'], null) === 0, 'mới: so với tập đã thấy; máy chưa từng mở → 0');
  });

  check('CHUONG-V2-5 · web: chuông nhận bản `/my-work` + `/yeu-cau/dem` của App, `/notifications` chỉ tải khi hộp mở; localStorage bọc try/catch', () => {
    const hd = nguon('web/src/modules/platform/Header.tsx'), hop = nguon('web/src/modules/platform/HopChuong.tsx'), app = nguon('web/src/App.tsx');
    assert(!hd.includes("'/notifications'") && !hd.includes("'/my-work'"), 'Header không tự GET /notifications hay /my-work');
    assert(/openMenu === 'notif' && <HopChuong /.test(hd), 'hộp (và GET /notifications) chỉ gắn khi chuông mở');
    assert(!hop.includes("'/my-work'") && hop.includes("useApi<any[]>('/notifications')"), 'HopChuong không GET /my-work');
    assert(/<Header viec=\{viecGv\} dem=\{dem\} so=\{so\} \/>/.test(app), 'App truyền bản badge (viecGv, dem, so)');
    const ls = [...hop.matchAll(/localStorage\.\w+\(/g)].length, tc = [...hop.matchAll(/try \{ [^\n]*localStorage/g)].length;
    assert(ls >= 2 && ls === tc, `localStorage ${ls} lần, trong try ${tc}`);
  });

  check('GD-9 · chuông: bấm một loại → Công việc ĐÚNG TAB (cả tab, mockup ⑤ G2) — Báo cáo PH, Bàn giao → Vận hành; "Báo PH kết quả Test", Xử lý vi phạm, Phối hợp SOS → Ý thức & Phối hợp; không dòng Chấm Speaking', () => {
    const tab = { score: 'cham-diem', no_plan: 'case-hoc-thuat', ghi_ket_qua_pa: 'case-hoc-thuat', yt_xu_ly: 'y-thuc', phoi_hop_sos: 'y-thuc', phoi_hop: 'y-thuc', bao_cao_ph: 'van-hanh', ban_giao: 'van-hanh' };
    for (const [l, k] of Object.entries(tab)) assert(d.nhomViecCua(l) === k, `${l} → ${d.nhomViecCua(l)}, cần ${k}`);
    assert(/demDongViec\(laQuanLy \? items : dongCuaToi\(items\)\)/.test(nguon('web/src/modules/congViec/HoTroHocVienTab.tsx')), '[XM-9a] đầu Công việc GV phải đếm dongCuaToi (cùng chuông)');
    const hop = nguon('web/src/modules/platform/HopChuong.tsx');
    assert(/chv-con-duoi/.test(hop) && /\.chv-con-duoi \{ -webkit-mask-image/.test(nguon('web/src/index.css')), 'vùng cuộn chuông: lớp mờ đáy khi còn dòng (375)');
    assert(/new URLSearchParams\(\{ nhom: tabCua\(l\.loai\) \}\)/.test(hop) && !/new URLSearchParams\(\{ loai: l\.loai \}\)/.test(hop), 'chuông chưa mở đúng tab (còn ?loai= lọc riêng loại)');
    assert(/const tabCua = !laQl && nav\?\.hvCuaToi \? nhomViecTvvCua : nhomViecCua;/.test(hop), 'TVV dùng tab của TVV — cùng hàm trang Công việc');
    const cheo = d.gomViecChuong([{ key: 'score:1|cc', group: 'score', urgency: 'overdue', mine: true, studentId: null, con: null }] as any);
    assert(!cheo.length, 'chuông không có dòng Chấm Speaking (việc chung)');
  });
}
