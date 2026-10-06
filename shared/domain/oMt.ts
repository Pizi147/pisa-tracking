/**
 * LUẬT Ô MT (PR-MTb Task 2, mockup phần 3) — MỘT đợt Mock Test hiện thành MỘT ô: chữ, kiểu (màu), tooltip từng kỹ năng.
 * Thuần: không đọc DB, không tự đọc ngày (`homNay` truyền vào). Component `web/src/ui/OMt.tsx` chỉ vẽ kết quả này.
 *
 * Thứ tự (KHÔNG đảo): chưa có lượt → mọi kỹ năng bắt buộc xong → trễ chấm → còn việc (vắng / chờ duyệt, rồi đã huỷ) → chờ chấm →
 * đang thi → có lịch → chưa xếp. Trễ chấm đứng TRƯỚC vắng vì hạn chấm quá là việc gấp hơn.
 */
import { ngay, tuanLich } from './hienThiNgay.ts';
import { O_KE_HOACH, trangThaiKyNang, type KyNangKH, type OKyNang } from './keHoachTest.ts';
import { tenMon, tenMonNgan } from './normal.ts';
import { addDaysIso } from './sos.ts';

/** `cho-cham-cu`: MT cũ chờ nhập bù điểm — cùng chữ "chờ chấm n" nhưng xám (MT cũ không có hạn; chủ sản phẩm 06/10). */
export type KieuOMt = 'chua-co-dot' | 'chua-lich' | 'co-lich' | 'dang-thi' | 'cho-cham' | 'cho-cham-cu' | 'tre-cham' | 'con-viec' | 'xong';

/** `attemptId` null = chưa có lượt (ô nét đứt, chỉ còn số). `cu` truyền thẳng ra nhãn "cũ". */
export type OMtVao = {
  so: number; attemptId: number | null; kn: Partial<Record<KyNangKH, OKyNang>>; cu: boolean;
  /** PR-MT0: MT0 có điểm mà em không lên FT — ô mờ, tooltip thêm `MT0 · không dùng`. */
  khongDung?: boolean;
};

type Loai = 'xong' | 'khong-yeu-cau' | 'da-huy' | 'vang' | 'het-tuan' | 'tuan-nay' | 'co-lich' | 'chua-lich';

const ngayCua = (s: string) => s.slice(0, 10);

/** Một kỹ năng đang ở đâu. Tuần đã hết = Chủ nhật tuần thi < hôm nay, chưa có điểm, không vắng / huỷ. */
function loaiKn(o: OKyNang, homNay: string): Loai {
  if (!o.batBuoc || o.khongDuThi) return 'khong-yeu-cau';   // khongDuThi: MT cũ "-" (PR-MTb sau rà I2)
  if (o.trangThai === 'xong') return 'xong';
  if (o.huyVang || o.trangThai === 'da-huy') return 'da-huy';
  if (o.choDuyet || o.trangThai === 'vang' || o.trangThai === 'cho-duyet') return 'vang';
  if (!o.tuan) return 'chua-lich';
  if (ngayCua(o.tuanKetThuc ?? addDaysIso(ngayCua(o.tuan), 6)) < homNay) return 'het-tuan';
  return ngayCua(o.tuan) <= homNay ? 'tuan-nay' : 'co-lich';
}

const troCham = (o: OKyNang, homNay: string) => !!o.hanCham && homNay > ngayCua(o.hanCham);

/** Tooltip một kỹ năng: `Listening: W3 SEP · xong`. */
function dongKn(ct: string | null | undefined, k: KyNangKH, o: OKyNang, loai: Loai, homNay: string, cu: boolean): string {
  const tt: Record<Loai, string | null> = {
    xong: 'xong', 'khong-yeu-cau': o.khongDuThi ? 'không dự thi' : 'không yêu cầu', 'tuan-nay': 'tuần này', 'co-lich': null, 'chua-lich': null,
    'da-huy': `${o.huyVang ? 'huỷ (vắng 2 lần)' : 'đã huỷ'}${o.choDuyet ? ' · chờ Quản lý duyệt' : ''}`,   // đề nghị dời đang chờ (I1)
    vang: o.choDuyet ? 'chờ Quản lý duyệt' : 'vắng',
    // Hạn chấm là hạn cụ thể → được hiện ngày (luật thời gian trên màn); null (MT cũ, không hạn) thì không ghi.
    'het-tuan': `${troCham(o, homNay) ? 'trễ chấm' : 'chờ chấm'}${o.hanCham ? ` · hạn ${ngay(o.hanCham, homNay)}` : ''}`,
  };
  const tuan = loai === 'khong-yeu-cau' ? null : o.tuan ? tuanLich(o.tuan, homNay) : loai === 'chua-lich' ? 'chưa xếp' : null;
  return `${tenMon(ct, k)}: ${[tuan, tt[loai], cu ? 'cũ' : null].filter(Boolean).join(' · ')}`;
}

export function oMt(v: OMtVao, homNay: string, ct?: string | null): { kieu: KieuOMt; chu: string; cu: boolean; title: string } {
  const ra = (kieu: KieuOMt, chu: string, title: string) => ({ kieu, chu, cu: v.cu, title });
  if (v.attemptId === null) return ra('chua-co-dot', '', 'Chưa có đợt');

  const ds = O_KE_HOACH.flatMap((k) => (v.kn[k] ? [{ k, o: v.kn[k]!, loai: loaiKn(v.kn[k]!, homNay) }] : []));
  const title = [v.khongDung ? 'MT0 · không dùng' : null, ds.map((x) => dongKn(ct, x.k, x.o, x.loai, homNay, v.cu)).join('\n') || 'Chưa có kỹ năng']
    .filter(Boolean).join('\n');
  const cua = (...l: Loai[]) => ds.filter((x) => l.includes(x.loai));
  const ten = (xs: typeof ds) => xs.map((x) => tenMonNgan(ct, x.k)).join(' ');
  const batBuoc = ds.filter((x) => x.loai !== 'khong-yeu-cau');

  if (batBuoc.length && batBuoc.every((x) => x.loai === 'xong')) {
    return ra('xong', batBuoc.length < ds.length ? `✓ ${batBuoc.length}/${ds.length}` : '✓', title);
  }
  const tre = cua('het-tuan').filter((x) => troCham(x.o, homNay));
  if (tre.length) return ra('tre-cham', `trễ chấm ${ten(tre)}`, title);
  const vang = cua('vang');
  if (vang.length) return ra('con-viec', `vắng ${ten(vang)}`, title);
  const huy = cua('da-huy');
  if (huy.length) return ra('con-viec', `${ten(huy)} huỷ`, title);
  const cho = cua('het-tuan');
  if (cho.length) return ra(v.cu ? 'cho-cham-cu' : 'cho-cham', `chờ chấm ${cho.length}`, title);
  if (cua('tuan-nay').length) return ra('dang-thi', 'tuần này', title);
  const som = cua('co-lich').map((x) => ngayCua(x.o.tuan!)).sort()[0];
  if (som) return ra('co-lich', tuanLich(som, homNay), title);
  return ra('chua-lich', 'chưa xếp', title);
}

/**
 * Chip trạng thái MỘT dòng kỹ năng của hộp một đợt (mockup phần 2: `trễ chấm`, `chờ chấm`, `vắng`, `huỷ`, `chưa xếp`) — cùng luật `oMt`
 * (một nguồn: nhãn ô MT và chip dòng không lệch). Đang thi / có lịch / xong / không yêu cầu → null (dòng chỉ có chip tuần hoặc điểm).
 */
export function chipDongKyNang(o: OKyNang, homNay: string, ct?: string | null, cu = false): { chu: string; tone: 'bad' | 'wait' | 'soon' | 'muted' } | null {
  if (!o.batBuoc || o.khongDuThi) return null;
  // Ô MT cần một khe kỹ năng; dùng `listening` làm khe tạm cho đúng MỘT kỹ năng này.
  const r = oMt({ so: 0, attemptId: 0, kn: { listening: o }, cu }, homNay, ct);
  switch (r.kieu) {
    case 'tre-cham': return { chu: 'trễ chấm', tone: 'bad' };
    case 'cho-cham': return { chu: 'chờ chấm', tone: 'wait' };
    case 'cho-cham-cu': return { chu: 'chờ chấm', tone: 'muted' };   // MT cũ chưa điểm: xám như ô MT
    case 'con-viec': return { chu: o.huyVang || o.trangThai === 'da-huy' ? 'huỷ' : 'vắng', tone: 'soon' };
    case 'chua-lich': return { chu: 'chưa xếp', tone: 'muted' };
    default: return null;
  }
}

/**
 * Hàng lịch một kỹ năng của hồ sơ Mock (`GET /attempts/:id` › `skillSchedule`) → `OKyNang`, để đầu trang hồ sơ dùng cùng ô MT.
 * Dùng `trangThaiKyNang` như lưới nên nhãn hai nơi không lệch.
 */
export function oKyNangTuLich(r: {
  required: boolean; periodId: number | null; weekStart: string | null; weekEnd?: string | null; sitStatus: string; scored: boolean;
  pendingMove: unknown; absenceMoveCount: number; deadline: string | null; doiTu: string | null; huyVang?: boolean;
}, khongDuThi = false): OKyNang {
  const choDuyet = !!r.pendingMove;
  return {
    trangThai: trangThaiKyNang({
      batBuoc: r.required, tuan: r.weekStart, xong: r.scored, daDoi: r.absenceMoveCount > 0,
      huy: r.sitStatus === 'cancelled', vang: r.sitStatus === 'absent' && !choDuyet, choDuyet,
    }),
    tuan: r.weekStart, periodId: r.periodId, doiTu: r.doiTu, batBuoc: r.required, khoa: null,
    sit: r.sitStatus, tuanKetThuc: r.weekEnd ?? null, choDuyet,
    ...(r.huyVang ? { huyVang: true } : {}),
    ...(khongDuThi ? { khongDuThi: true } : {}),
    hanCham: r.deadline,
  };
}

/**
 * MT cũ: kỹ năng có dấu "-" ở MỌI ô nhập của nó (Writing: cả W1 và W2) và chưa có điểm = không dự thi (PR-MTb sau rà I2; máy chủ
 * `khongDuThiCua` cùng luật). `cells` = ô của hồ sơ Mock (`attemptDetail.cells`). Lượt thường: false (vắng có luồng riêng).
 */
export function khongDuThiTuO(
  cells: Array<{ assessedSkill: string; band: number | null; rawScore: number | null; noShow?: { state?: string } | null }>,
  skill: string, lichSu: boolean,
): boolean {
  const o = cells.filter((c) => c.assessedSkill === skill);
  return lichSu && o.length > 0 && o.every((c) => c.noShow?.state === 'khong-du-thi' && c.band === null && c.rawScore === null);
}
