/**
 * PHÉP KIỂM UX-G — "Trạng thái nói đúng, một màu một nghĩa" (kế hoạch 2026-10-02-ux-sau-critique, gói G: G1–G5).
 * Phần luật thuần gọi thẳng hàm `shared/domain`; phần giao diện quét nguồn (bỏ chú thích) như các PR trước.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const boChuThich = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const doc = (rel: string) => boChuThich(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

export async function runPrUxGTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { studentProfile } = await import('../students/profile.ts');

  // ------------------------------------------------------------------ G1 · SOS tạm thời không mất chữ "tạm thời" ở hồ sơ HV
  console.log('\nUX-G · G1 SOS tạm thời ở hồ sơ học viên');
  const KQ = { dau: 'MT3', ratio: false, sos: 1, dat: false, overall: 5.5, kck: false, soDat: 0, soMon: 4, monTruot: [], phanTram: null };
  const cau = (ketQua: Record<string, unknown>) => d.cauTomTat({ dacBiet: null, ketQua, hoTro: ['Speaking'], viec: [], yThuc: null, homNay: '2026-09-14' }) as { chu: string; tone: string | null }[];
  check('G1a · cauTomTat: mới có 1/4 kỹ năng mà SOS 1 → "MT3 SOS 1 tạm thời" (màu SOS 1); đủ 4/4 → "MT3 SOS 1" không "tạm thời"', () => {
    const tam = cau({ ...KQ, coDiem: 1 })[0];
    assert(tam.chu === 'MT3 SOS 1 tạm thời: đang hỗ trợ Speaking' && tam.tone === 'sos1', JSON.stringify(tam));
    const du = cau({ ...KQ, coDiem: 4 })[0];
    assert(du.chu === 'MT3 SOS 1: đang hỗ trợ Speaking' && du.tone === 'sos1', JSON.stringify(du));
  });
  check('G1b · mọi hồ sơ FT có lượt chưa chốt mà có SOS: banner và ô Kết quả gần nhất đều có "tạm thời"; không hồ sơ nào trả "SOS n" trơn', () => {
    let coTam = 0;
    for (const { id } of conn.prepare(`SELECT id FROM students`).all() as { id: number }[]) {
      const dh = (studentProfile(P.admin, id) as any).dauHoSo;
      const kq = dh?.o?.ketQua?.kq;
      /* KCK không có SOS trên câu. OV-1c: "tạm thời" = lượt CHƯA CHỐT (cờ máy chủ), không còn = thiếu điểm (chốt nhờ kỹ năng dời thì không tạm). */
      if (!kq || dh.o.ketQua.ratio || dh.o.ketQua.kck || !kq.sos || kq.chot) continue;
      coTam++;
      const banner = dh.tomTat.find((m: any) => /SOS \d/.test(m.chu));
      assert(banner && /SOS \d tạm thời/.test(banner.chu), `em ${id}: banner "${banner?.chu}" thiếu "tạm thời" (${kq.coDiem}/${kq.yeuCau}) ${JSON.stringify(dh.tomTat)}`);
    }
    assert(coTam > 0, 'bộ demo không có em nào SOS tạm thời — phép kiểm rỗng');
  });
  check('G1c · ô "Kết quả gần nhất" của hồ sơ HV vẽ SOS qua <KetQuaDot> (không tự dựng chip "SOS n")', () => {
    const s = doc('web/src/modules/students/DauHoSo.tsx');
    assert(/import \{ KetQuaDot \}/.test(s) && /<KetQuaDot\b/.test(s), 'DauHoSo chưa dùng KetQuaDot');
    assert(!/CHIP_SOS_O/.test(s) && !/>SOS \{kq\.sos\}</.test(s), 'DauHoSo còn chip SOS tự dựng');
  });

  // ------------------------------------------------------------------ G2 · một trạng thái, một màu
  console.log('\nUX-G · G2 một trạng thái một màu');
  check('G2a · Nhan.tsx có MỘT bảng TONE_TRANG_THAI; "Chờ chấm", "Chờ bạn chấm", "Chờ GV khác" ở Lịch Test cùng tra bảng đó', () => {
    /* PR-GVb U01: bảng chuyển sang shared (`trangThai.ts`) để badge lớp cùng đọc; Nhan.tsx re-export. */
    assert(/export const TONE_TRANG_THAI\b/.test(doc('shared/domain/trangThai.ts')) && /export \{ TONE_TRANG_THAI \}/.test(doc('web/src/ui/Nhan.tsx')),
      'thiếu TONE_TRANG_THAI ở shared/domain/trangThai.ts hoặc re-export ở Nhan.tsx');
    const s = doc('web/src/modules/test/lichTest/KhoiNo.tsx');
    const dong = s.split('\n').filter((l) => /Chờ bạn chấm|Chờ GV khác|Chờ chấm/.test(l));
    assert(dong.length === 2, `KhoiNo: ${dong.length} dòng nhãn chờ chấm (mong 2)`);
    for (const l of dong) assert(/TONE_TRANG_THAI\['cho-cham'\]/.test(l), `nhãn chờ chấm chưa tra bảng: ${l.trim()}`);
  });
  check('G2b · badge "n chờ duyệt" ở hộp lớp / đầu hồ sơ lớp mang tone chờ (OV-15a: xám `muted`), không phải xanh dương (đang chạy)', () => {
    const b = d.badgeLop({ vai: 'ql', needsPlacement: false, canXepLop: 0, missingSkills: [], soBaiChoCham: 0, needScoresTitle: null, phase: 'running', missingCount: 0, soChoDuyet: 3 });
    const x = [...b.hien, ...b.an].find((k: any) => k.key === 'cho-duyet');
    assert(x?.tone === 'muted', `tone cho-duyet = ${x?.tone}`);
    assert(/'wait'/.test(doc('web/src/ui/Nhan.tsx').split('toneNhanTuBadge')[1] ?? ''), 'toneNhanTuBadge chưa nhận tone wait');
  });
  await checkAsync('G2c · mức độ Case "Bình thường" ở Tổng quan GV là chip trung tính (không vàng); "Gấp" vẫn đỏ', async () => {
    const { levelOf } = await import('../worklist/mywork.ts');
    const bt = levelOf({ sos_level: null, urgency: 'attention' }) as any;
    assert(bt?.text === 'Bình thường' && bt.tone === 'neutral', JSON.stringify(bt));
    const gap = levelOf({ sos_level: null, urgency: 'urgent' }) as any;
    assert(gap?.text === 'Gấp' && gap.tone === 'danger', JSON.stringify(gap));
  });
  check('G2d · "Yêu cầu của tôi" (Tổng quan GV): yêu cầu bị từ chối ghi "Bị từ chối", không "Cần làm" — nhãn ghi đúng chữ', () => {
    const s = doc('web/src/modules/worklist/ViecCuaToi.tsx');
    assert(/chu=\{x\.trangThai === 'tu_choi' \? t\('Bị từ chối'\)/.test(s), 'nhãn yêu cầu bị từ chối chưa ghi "Bị từ chối"');
  });

  // ------------------------------------------------------------------ G3 · thông báo: giờ và chữ
  console.log('\nUX-G · G3 thông báo');
  check('G3a · thoiGianThongBao: cùng ngày nghiệp vụ → chỉ giờ; ngày trước → "dd/mm giờ"; ghi nhận SAU ngày nghiệp vụ (demo) → "Ghi nhận dd/mm giờ", không giả làm ngày nghiệp vụ', () => {
    const f = d.thoiGianThongBao;
    assert(typeof f === 'function', 'thiếu thoiGianThongBao');
    assert(f('2026-09-14T03:05:00Z', '2026-09-14') === '10:05', f('2026-09-14T03:05:00Z', '2026-09-14'));
    assert(f('2026-09-10T03:05:00Z', '2026-09-14') === '10/09 10:05', f('2026-09-10T03:05:00Z', '2026-09-14'));
    assert(f('2026-10-02T15:57:00Z', '2026-09-14') === 'Ghi nhận 02/10 22:57', f('2026-10-02T15:57:00Z', '2026-09-14'));
    assert(f(null, '2026-09-14') === '', 'null → rỗng');
  });
  check('G3b · Header dùng thoiGianThongBao (không tự dựng giờ), tooltip nói cả ngày nghiệp vụ', () => {
    const s = doc('web/src/modules/platform/Header.tsx');
    assert(/thoiGianThongBao\(/.test(s) && !/function gioThongBao/.test(s), 'Header chưa dùng thoiGianThongBao');
  });
  check('G3c · việc "Báo phụ huynh qua TVV": không còn "Tạo task cho TVV trên Base"; câu mới nhờ TVV báo + đánh dấu đã làm (thông báo, hint Việc cần làm, lý do)', () => {
    const CAU = 'Nhờ TVV báo phụ huynh (4 nội dung), xong thì đánh dấu đã làm';
    for (const f of ['server/src/yThuc/phoiHop.ts', 'server/src/worklist/mywork.ts']) {
      const s = doc(f);
      assert(!/Tạo task cho TVV/.test(s) && !/trên Base/.test(s), `${f}: còn câu cũ`);
    }
    assert(doc('server/src/yThuc/phoiHop.ts').includes(CAU), 'phoiHop.ts thiếu câu mới');
    assert(doc('server/src/worklist/mywork.ts').includes(CAU), 'mywork.ts thiếu câu mới');
  });

  // ------------------------------------------------------------------ G4 · Lịch Test: cột thao tác nằm trong khung
  console.log('\nUX-G · G4 Lịch Test không cắt nút Nhập điểm');
  check('G4 · bảng Nợ tuần trước: cột thao tác rộng ≥ 110 px (nút "Nhập điểm" 86 px + đệm 2×12) ở cả bảng rộng lẫn hẹp; cột GV chấm xuống dòng, không cắt "…"', () => {
    const s = doc('web/src/modules/test/lichTest/KhoiNo.tsx');
    const m = /const COT_THAO_TAC = (\d+)/.exec(s);
    assert(m && Number(m[1]) >= 110, `COT_THAO_TAC = ${m?.[1]}`);
    assert((s.match(/width: COT_THAO_TAC/g) ?? []).length === 2, 'cả hai colgroup phải dùng COT_THAO_TAC');
    /* PR-LT3: ô GV chấm vẽ bằng <GvCham> (tô "GV chấm chéo") — vẫn xuống dòng, không cắt. */
    const gv = s.split('\n').find((l) => /<td[^>]*><GvCham gv=\{d\.gvNo\} \/><\/td>/.test(l)) ?? '';
    assert(gv && !/truncate/.test(gv), `ô GV chấm còn truncate: ${gv.trim()}`);
  });

  // ------------------------------------------------------------------ G5 · 0 vi phạm: không hai nút chính, ô nói "Không có vi phạm"
  console.log('\nUX-G · G5 em không có vi phạm');
  check('G5a · oYThuc: chưa bậc, 0 vi phạm mở → "Không có vi phạm" (không "Chưa xử lý lần nào", không dòng phụ lặp); có vi phạm mà chưa xử lý lần nào → vẫn "Chưa xử lý lần nào"; có bậc → bậc', () => {
    const y0 = d.oYThuc(null);
    assert(y0.gt === 'Không có vi phạm' && y0.phu === '' && y0.tone === null, JSON.stringify(y0));
    const y1 = d.oYThuc({ bacTen: null, nhom: null, soBatBuoc: 0, keTiep: null, han: null, quaHanNgay: null, deXuat: null, soMo: 0, tamDung: false });
    assert(y1.gt === 'Không có vi phạm', JSON.stringify(y1));
    const y2 = d.oYThuc({ bacTen: null, nhom: 'moi', soBatBuoc: 0, keTiep: null, han: null, quaHanNgay: null, deXuat: null, soMo: 1, tamDung: false });
    assert(y2.gt === 'Chưa xử lý lần nào' && y2.phu === '1 vi phạm mở · chưa bắt buộc', JSON.stringify(y2));
    const y3 = d.oYThuc({ bacTen: 'Report 1', nhom: null, soBatBuoc: 0, keTiep: null, han: null, quaHanNgay: null, deXuat: null, soMo: 0, tamDung: false });
    assert(y3.gt === 'Report 1' && y3.phu === 'không có vi phạm mở', JSON.stringify(y3));
  });
  check('G5b · khối Thang xử lý: hai nút "Xác nhận xử lý" / "Đề xuất QL duyệt" chỉ hiện khi có vi phạm chưa xử lý xong (≥ 1; quyết định 02/10 xử lý được cả khi mới 1 vi phạm)', () => {
    const s = doc('web/src/modules/yThuc/ThangYThuc.tsx');
    assert(/viPham/.test(s) && /da_xu_ly/.test(s) && /const coNut = [^;]*coViPhamMo/.test(s), 'ThangYThuc chưa chặn nút theo vi phạm mở');
  });
}
