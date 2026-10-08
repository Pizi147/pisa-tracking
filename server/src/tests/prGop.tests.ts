/**
 * PR-GOP (đặc tả 2026-10-08 §5, §7 Q1; mockup `thiet-ke/mockup-cuoi-khoa-2-2026-10-08.html` phần 4; kế hoạch tổng X10):
 * Công việc / Việc của tôi / badge — MỘT DÒNG = MỘT LỚP × MỘT LOẠI VIỆC (cùng người giữ việc). Bên trong là danh sách em; hạn = sớm nhất;
 * có em quá hạn → dòng quá hạn. Giữ từng dòng: Case SOS Fast Track (Xác nhận nguyên nhân · Xác nhận PA · Thêm PA ở lớp FT), việc không gắn lớp.
 * Badge / summary đếm DÒNG; số việc thật (`items`) không đổi. Nhắc một dòng gộp = một chuông.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrGopTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const nv: any = await import('../worklist/nhacViec.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  console.log('\nPR-GOP · Gộp việc theo lớp × loại việc');

  const v = (o: Record<string, unknown>) => ({
    key: 'k', group: 'phoi_hop', urgency: 'normal', due: null, studentId: 1, studentName: 'An', classId: 10, classCode: 'MB FOU 15',
    khung: 'thuong', ownerId: 7, owner: null, mine: true, tieuDe: 'Báo phụ huynh qua TVV · An · Progress Test', contextLabel: 'Progress Test',
    count: null, href: '/hoc-vien/1', actionLabel: 'Mở Phối hợp SOS', statusLabel: 'Chưa làm', reason: 'r', level: null,
    attemptId: 5, attemptNo: null, caseId: null, ...o,
  });
  const nhan = (g: string) => ({ phoi_hop: 'Báo phụ huynh qua TVV', ghi_ket_qua_pa: 'Kết quả PA', score: 'Nhập điểm', cause: 'Xác nhận nguyên nhân' } as any)[g] ?? g;

  check('GOP-1a · hai em cùng lớp × loại × người → MỘT dòng "Loại · lớp · n em", con giữ nguyên khoá; một em → dòng như cũ', () => {
    const ds = [
      v({ key: 'baoph:1', studentId: 1, studentName: 'An', tieuDe: 'Báo phụ huynh qua TVV · An · Progress Test' }),
      v({ key: 'baoph:2', studentId: 2, studentName: 'Bình', tieuDe: 'Báo phụ huynh qua TVV · Bình · Progress Test' }),
      v({ key: 'baoph:3', studentId: 3, studentName: 'Chi', classId: 11, classCode: 'MB BE 03', tieuDe: 'Báo phụ huynh qua TVV · Chi · Progress Test' }),
    ];
    const r = d.gopViecTheoLop(ds, nhan);
    assert(r.length === 2, `số dòng: ${r.length}`);
    const g = r.find((x: any) => x.con);
    assert(g && g.key === 'gop:phoi_hop:10:u7', `khoá dòng gộp: ${g?.key}`);
    assert(g.tieuDe === 'Báo phụ huynh qua TVV · MB FOU 15 · 2 em', `tiêu đề: ${g.tieuDe}`);
    assert(g.con.map((x: any) => x.key).join() === 'baoph:1,baoph:2', 'con giữ khoá từng em');
    assert(g.studentId === null && g.classId === 10 && g.ownerId === 7 && g.count === 2 && g.actionLabel === '2 em', 'đầu dòng = lớp, đếm em');
    assert(g.contextLabel === 'Progress Test', `dòng phụ chung: ${g.contextLabel}`);
    assert(g.con[0].conTen === 'An' && g.con[0].conPhu === 'Progress Test', `tên/phụ của em: ${g.con[0].conTen} / ${g.con[0].conPhu}`);
    const mot = r.find((x: any) => !x.con);
    assert(mot.key === 'baoph:3' && mot === ds[2], 'lớp một em: chính dòng cũ');
  });

  check('GOP-1b · hạn = sớm nhất; có em quá hạn → dòng quá hạn, dòng phụ "n em quá hạn"; em quá hạn đứng đầu danh sách', () => {
    const ds = [
      v({ key: 'action:2', group: 'ghi_ket_qua_pa', studentId: 2, studentName: 'Minh', due: TODAY, urgency: 'today', tieuDe: 'Kết quả PA Reading', contextLabel: 'Case' }),
      v({ key: 'action:1', group: 'ghi_ket_qua_pa', studentId: 1, studentName: 'Châu', due: '2026-09-07', urgency: 'overdue', tieuDe: 'Kết quả PA Reading', contextLabel: 'MT2' }),
    ];
    const [g] = d.gopViecTheoLop(ds, nhan);
    assert(g.urgency === 'overdue' && g.due === '2026-09-07', `${g.urgency} ${g.due}`);
    assert(g.contextLabel === '1 em quá hạn', `dòng phụ: ${g.contextLabel}`);
    assert(g.con[0].key === 'action:1', 'em quá hạn trước');
    assert(g.con[0].conPhu === 'Reading · MT2', `phụ của em: ${g.con[0].conPhu}`);
  });

  check('GOP-1c · khác người giữ việc / không gắn lớp / Case SOS FT → KHÔNG gộp; Case FT GV tạo tay, Xác nhận nguyên nhân lớp thường → gộp', () => {
    const khacNguoi = d.gopViecTheoLop([v({ key: 'a', ownerId: 7 }), v({ key: 'b', ownerId: 9, studentId: 2 })], nhan);
    assert(khacNguoi.length === 2, 'khác người: hai dòng');
    const khongLop = d.gopViecTheoLop([v({ key: 'a', classId: null, group: 'mgmt' }), v({ key: 'b', classId: null, group: 'mgmt', studentId: 2 })], nhan);
    assert(khongLop.length === 2, 'không lớp: hai dòng');
    for (const group of ['cause', 'xac_nhan_pa', 'no_plan']) {
      const ft = d.gopViecTheoLop([v({ key: 'a', group, khung: 'ft', caseSos: true }), v({ key: 'b', group, khung: 'ft', caseSos: true, studentId: 2 })], nhan);
      assert(ft.length === 2, `${group} FT Case SOS: giữ từng dòng`);
    }
    /* Chủ sản phẩm 08/10: Case GV tự tạo (Bình thường / Gấp) ở lớp FT gộp theo lớp như việc khác. */
    const tay = d.gopViecTheoLop([v({ key: 'a', group: 'no_plan', khung: 'ft', caseSos: false }), v({ key: 'b', group: 'no_plan', khung: 'ft', caseSos: false, studentId: 2 })], nhan);
    assert(tay.length === 1 && tay[0].con.length === 2, 'Thêm PA lớp FT, Case GV tạo tay: gộp');
    assert(d.khoaGopCua(v({ group: 'no_plan', khung: 'ft', caseSos: true })) === null && d.khoaGopCua(v({})) === 'gop:phoi_hop:10:u7', 'khoaGopCua');
    const thuong = d.gopViecTheoLop([v({ key: 'a', group: 'cause' }), v({ key: 'b', group: 'cause', studentId: 2 })], nhan);
    assert(thuong.length === 1 && thuong[0].con.length === 2, 'Xác nhận nguyên nhân lớp thường: gộp');
  });

  check('GOP-1d · dòng đã gom sẵn (Nhập điểm theo bài) cùng lớp → một dòng "n việc", con tên theo việc', () => {
    const ds = [
      v({ key: 'score:1', group: 'score', studentId: null, studentName: 'Lớp MB FT 101', count: 6, tieuDe: 'Nhập điểm L, R', contextLabel: 'MT2' }),
      v({ key: 'score:2', group: 'score', studentId: null, studentName: 'Lớp MB FT 101', count: 3, tieuDe: 'Nhập điểm W', contextLabel: 'MT3' }),
    ];
    const [g] = d.gopViecTheoLop(ds, nhan);
    assert(g.tieuDe === 'Nhập điểm · MB FOU 15 · 2 việc', `tiêu đề: ${g.tieuDe}`);
    assert(g.actionLabel === '2 việc', g.actionLabel);
    assert(g.con[0].conTen === 'L, R · MT2' && g.con[0].conPhu === '6 HV', `${g.con[0].conTen} / ${g.con[0].conPhu}`);
  });

  check('GOP-1e · hai việc của CÙNG một em (hai PA) → "2 việc", không "2 em"', () => {
    const ds = [
      v({ key: 'action:1', group: 'ghi_ket_qua_pa', studentId: 5, studentName: 'Ngọc', tieuDe: 'Kết quả PA Writing' }),
      v({ key: 'action:2', group: 'ghi_ket_qua_pa', studentId: 5, studentName: 'Ngọc', tieuDe: 'Kết quả PA Speaking' }),
    ];
    const [g] = d.gopViecTheoLop(ds, nhan);
    assert(g.tieuDe === 'Kết quả PA · MB FOU 15 · 2 việc' && g.actionLabel === '2 việc', `${g.tieuDe} / ${g.actionLabel}`);
    assert(g.con[0].conTen === 'Ngọc', 'con vẫn mang tên em');
  });

  /* ---------------------------------------------------------------- máy chủ: myWork trả `dong`, summary đếm dòng */
  const kiemDong = (w: any, ten: string) => {
    const phang = (w.dong as any[]).flatMap((x) => x.con ?? [x]).map((x) => x.key).sort();
    const goc = (w.items as any[]).map((x) => x.key).sort();
    assert(JSON.stringify(phang) === JSON.stringify(goc), `${ten}: mọi việc có mặt đúng một lần trong dòng (${phang.length}/${goc.length})`);
    assert(w.summary.total === w.dong.length, `${ten}: summary.total = số dòng (${w.summary.total}/${w.dong.length})`);
    assert(w.summary.overdue === w.dong.filter((x: any) => x.urgency === 'overdue').length, `${ten}: summary.overdue = số dòng quá hạn`);
    assert(w.summary.today === w.dong.filter((x: any) => x.urgency === 'today').length, `${ten}: summary.today = số dòng hôm nay`);
  };

  check('GOP-2 · myWork: `dong` phủ đúng mọi việc; summary (badge) đếm dòng — GVCN, GVBM, QL (Của tôi + Của GV), xem một GV', () => {
    const gvcn = loadPrincipal(7), gvbm = loadPrincipal(9), ql = loadPrincipal(2);
    kiemDong(mywork.myWork(gvcn), 'GVCN 7');
    kiemDong(mywork.myWork(gvbm), 'GVBM 9');
    kiemDong(mywork.myWork(ql), 'QL 2');
    kiemDong(mywork.myWork(ql, { nguoi: 'tat-ca' }), 'QL 2 tất cả');
    kiemDong(mywork.viecCuaNguoi(ql, 7), 'QL xem GV 7');
  });

  check('GOP-3 · số dòng giảm trên DB test (GVCN 7, QL 2) — in trước/sau; số đo seed 14/09 sạch ghi ở mô tả PR', () => {
    for (const id of [7, 2, 9]) {
      const w = mywork.myWork(loadPrincipal(id));
      console.log(`    userId ${id}: ${w.items.length} việc → ${w.dong.length} dòng`);
      if (id !== 9) assert(w.dong.length < w.items.length, `userId ${id}: phải giảm`);
    }
  });

  /* ---------------------------------------------------------------- Nhắc dòng gộp */
  check('GOP-4a · nhomCuaKhoa đọc nhóm từ khoá dòng gộp; nhóm lạ → dựng đủ', () => {
    const s = nv.nhomCuaKhoa(['gop:ghi_ket_qua_pa:12:u7']);
    assert(s && s.size === 1 && s.has('ghi_ket_qua_pa'), `nhóm: ${s && [...s]}`);
    assert(nv.nhomCuaKhoa(['gop:khong_co:1:u1']) === undefined, 'nhóm lạ');
  });

  await checkAsync('GOP-4b · QL Nhắc một dòng gộp → MỘT chuông về người giữ việc; dòng gộp hiện "đã nhắc"; Nhắc tất cả theo dòng', async () => {
    const homNay = `nhac:%:${TODAY}`;
    conn.prepare(`DELETE FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`).run(homNay);
    const ql = P.mbManager;
    const w = mywork.myWork(ql, { nguoi: 'tat-ca' });
    const g = (w.dong as any[]).find((x) => x.con && x.nhac);
    assert(!!g, 'seed có dòng gộp của GV khác để nhắc');
    const truoc = (conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`).get(homNay) as any).n;
    const r = nv.nhacViec(ql, { key: g.key, ownerId: g.nhac.ownerId });
    assert(!!r.daNhacLuc, 'đã nhắc');
    const sau = (conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`).get(homNay) as any).n;
    assert(sau - truoc === 1, `một chuông (thêm ${sau - truoc})`);
    const bao = conn.prepare(`SELECT title, duong FROM notifications WHERE dedup_key = ?`).get(`nhac:${g.key}:${TODAY}`) as any;
    assert(bao && bao.title.includes(g.tieuDe.split(' · ')[0]), `chuông nói đúng loại việc: ${bao?.title}`);
    const lai = (mywork.myWork(ql, { nguoi: 'tat-ca' }).dong as any[]).find((x) => x.key === g.key);
    assert(lai?.nhac?.daNhacLuc, 'dòng gộp hiện đã nhắc hôm nay');
    const lo = d.lapNhacTatCa((mywork.myWork(ql, { nguoi: 'tat-ca' }).dong as any[]));
    assert(!lo.gui.some((x: any) => x.key === g.key), 'Nhắc tất cả bỏ dòng đã nhắc');
    conn.prepare(`DELETE FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`).run(homNay);
  });

  check('GOP-4c · dòng gộp chỉ còn 1 việc (trang QL chưa tải lại) → Nhắc khoá gop: vẫn gửi một chuông cho việc còn lại; khoá gop: không còn việc nào → 404', () => {
    const homNay = `nhac:%:${TODAY}`;
    conn.prepare(`DELETE FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`).run(homNay);
    const ql = P.mbManager;
    /* Việc lẻ của GV khác: khoá gộp của nó KHÔNG có trong `dong` của chính GV đó (chỉ còn 1 việc) — đúng tình huống "đã làm xong 1 em". */
    const viec = ((mywork.myWork(ql, { nguoi: 'tat-ca' }).items as any[])).find((it) => {
      const k = d.khoaGopCua(it);
      if (!it.nhac || !k) return false;
      const cua = mywork.myWork(loadPrincipal(it.nhac.ownerId)) as any;
      return !(cua.dong as any[]).some((x) => x.key === k) && (cua.items as any[]).some((x) => x.key === it.key);
    });
    assert(!!viec, 'seed có việc lẻ để thử');
    const k = d.khoaGopCua(viec);
    const r = nv.nhacViecNhieu(ql, [{ the: null, key: k, ownerId: viec.nhac.ownerId }], { boQuaDaNhacTruoc: false });
    assert(r.loi.length === 0 && r.ok.length === 1 && r.ok[0].moi, `gửi được: ${JSON.stringify(r.loi)}`);
    const bao = conn.prepare(`SELECT duong FROM notifications WHERE dedup_key = ?`).get(`nhac:${k}:${TODAY}`) as any;
    assert(bao && bao.duong === viec.href, `chuông về chỗ làm của việc còn lại: ${bao?.duong}`);
    const gia = nv.nhacViecNhieu(ql, [{ the: null, key: `gop:${viec.group}:999999:u${viec.nhac.ownerId}`, ownerId: viec.nhac.ownerId }], { boQuaDaNhacTruoc: false });
    assert(gia.loi.length === 1 && gia.loi[0].ma === 404, `khoá gộp không còn việc: ${JSON.stringify(gia.loi)}`);
    conn.prepare(`DELETE FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`).run(homNay);
  });
}
