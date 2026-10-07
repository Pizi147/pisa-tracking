/**
 * LUẬT Ô MT (PR-MTb Task 2 · PR-OMT, mockup `mockup-xep-lich-mt-gon-2026-10-07` bản 2) — MỘT đợt Mock Test hiện thành MỘT ô
 * `MT2 · W4 SEP` + tối đa MỘT chữ việc (`chờ` · `trễ W` · `vắng S` · `huỷ S`); MÀU Ô = trạng thái. Xong / MT cũ / xong 3/4: chỉ màu xanh,
 * không chữ. Chưa có đợt và chưa xếp là MỘT kiểu (`MT3 · chưa xếp`). Thuần: không đọc DB, không tự đọc ngày (`homNay` truyền vào).
 * Component `web/src/ui/OMt.tsx` chỉ vẽ kết quả này.
 *
 * Thứ tự (KHÔNG đảo): chưa có lượt → mọi kỹ năng bắt buộc xong → trễ chấm → còn việc (vắng / chờ duyệt, rồi đã huỷ) → chờ chấm →
 * đang thi → có lịch → chưa xếp. Trễ chấm đứng TRƯỚC vắng vì hạn chấm quá là việc gấp hơn.
 */
import { ngay, tuanLich } from './hienThiNgay.ts';
import { O_KE_HOACH, trangThaiKyNang, type KyNangKH, type OKyNang } from './keHoachTest.ts';
import { tenMon, tenMonNgan } from './normal.ts';
import { addDaysIso } from './sos.ts';

/** `cho-cham-cu`: MT cũ chờ nhập bù điểm — cùng chữ "chờ chấm n" nhưng xám (MT cũ không có hạn; chủ sản phẩm 06/10). */
export type KieuOMt = 'chua-lich' | 'co-lich' | 'dang-thi' | 'cho-cham' | 'cho-cham-cu' | 'tre-cham' | 'con-viec' | 'xong';

/** `attemptId` null = chưa có lượt (cùng kiểu "chưa xếp", C5). `cu` chỉ còn đổi màu "chờ" sang xám + tooltip (ô không ghi chữ "cũ", C3). */
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

export type OMtRa = {
  kieu: KieuOMt;
  /** Tuần hiện sau `MT2 ·` (null: chưa xếp ghi ở `viec`, hoặc không có tuần). */
  tuan: string | null;
  /** Đúng MỘT chữ việc còn lại: `chờ` · `trễ W` · `vắng S` · `huỷ S` · `chưa xếp`; xong / có lịch / đang thi: null. */
  viec: string | null;
  /** `tuan · viec` — phần chữ sau số MT (rỗng khi chỉ còn màu). */
  chu: string;
  cu: boolean; title: string;
  /** Câu cho người đọc màn hình (màu không có chữ): `MT2, W4 SEP, trễ chấm W`. */
  doc: string;
};

/** Chữ việc: bỏ danh sách kỹ năng khi đủ MỌI kỹ năng bắt buộc của đợt (`chờ`, không `chờ L R W S`). */
const chuViec = (viec: string, ten: string, du: boolean) => (du || !ten ? viec : `${viec} ${ten}`);

/** Tuần MUỘN nhất (đã đổi ra mã `W4 SEP`) của các kỹ năng; null nếu không kỹ năng nào có tuần. */
const tuanMuon = (xs: Array<{ o: OKyNang }>, homNay: string) => {
  const t = xs.map((x) => (x.o.tuan ? ngayCua(x.o.tuan) : null)).filter((x): x is string => !!x).sort().pop();
  return t ? tuanLich(t, homNay) : null;
};

export function oMt(v: OMtVao, homNay: string, ct?: string | null): OMtRa {
  const ra = (kieu: KieuOMt, tuan: string | null, viec: string | null, title: string): OMtRa => {
    const chu = [tuan, viec].filter(Boolean).join(' · ');
    const dai = viec?.replace(/^(chờ|trễ)/, '$1 chấm') ?? null;
    const tt = kieu === 'xong' ? ['xong', tuan] : kieu === 'dang-thi' ? ['đang thi', tuan] : kieu === 'co-lich' ? ['có lịch', tuan] : [tuan, dai];
    return { kieu, tuan, viec, chu, cu: v.cu, title, doc: [`MT${v.so}`, ...tt].filter(Boolean).join(', ') };
  };
  if (v.attemptId === null) return ra('chua-lich', null, 'chưa xếp', 'Chưa có đợt');

  const ds = O_KE_HOACH.flatMap((k) => (v.kn[k] ? [{ k, o: v.kn[k]!, loai: loaiKn(v.kn[k]!, homNay) }] : []));
  const title = [v.khongDung ? 'MT0 · không dùng' : null, ds.map((x) => dongKn(ct, x.k, x.o, x.loai, homNay, v.cu)).join('\n') || 'Chưa có kỹ năng']
    .filter(Boolean).join('\n');
  const cua = (...l: Loai[]) => ds.filter((x) => l.includes(x.loai));
  const ten = (xs: typeof ds) => xs.map((x) => tenMonNgan(ct, x.k)).join(' ');
  const batBuoc = ds.filter((x) => x.loai !== 'khong-yeu-cau');
  /** Tuần SỚM nhất của nhóm kỹ năng (null nếu không kỹ năng nào có tuần). */
  const tuanSom = (xs: typeof ds) => {
    const t = xs.map((x) => (x.o.tuan ? ngayCua(x.o.tuan) : null)).filter((x): x is string => !!x).sort()[0];
    return t ? tuanLich(t, homNay) : null;
  };
  const viec = (cho: string, xs: typeof ds) => chuViec(cho, ten(xs), xs.length === batBuoc.length);

  if (batBuoc.length && batBuoc.every((x) => x.loai === 'xong')) {
    return ra('xong', tuanMuon(batBuoc, homNay), null, title);
  }
  const tre = cua('het-tuan').filter((x) => troCham(x.o, homNay));
  if (tre.length) return ra('tre-cham', tuanSom(tre), viec('trễ', tre), title);
  const vang = cua('vang');
  if (vang.length) return ra('con-viec', tuanSom(vang), viec('vắng', vang), title);
  const huy = cua('da-huy');
  if (huy.length) return ra('con-viec', tuanSom(huy), viec('huỷ', huy), title);
  const cho = cua('het-tuan');
  if (cho.length) return ra(v.cu ? 'cho-cham-cu' : 'cho-cham', tuanSom(cho), viec('chờ', cho), title);
  if (cua('tuan-nay').length) return ra('dang-thi', tuanSom(cua('tuan-nay')), null, title);
  const som = cua('co-lich').map((x) => ngayCua(x.o.tuan!)).sort()[0];
  if (som) return ra('co-lich', tuanLich(som, homNay), null, title);
  return ra('chua-lich', null, 'chưa xếp', title);
}

/** Một nhóm kỹ năng CÙNG tuần + CÙNG trạng thái của một đợt — một chip ở lưới FT Kế hoạch Test (C6, mockup G1). */
export type NhomKyNang = { kyNang: KyNangKH[]; ten: string; kieu: KieuOMt; tuan: string | null; viec: string | null; title: string };

/**
 * LƯỚI FT (C6, kiểu G1): `L R W S · W4 SEP` khi cả đợt cùng tuần + cùng trạng thái; tách tuần / khác trạng thái → một chip mỗi nhóm
 * (`L R W · W4 SEP`, `S · vắng · W4 SEP`). Đợt xong hết = MỘT chip xanh với tuần muộn nhất (như `gomChip`). Không yêu cầu: bỏ.
 * Màu + chữ việc dùng đúng luật `oMt` (một nguồn). Thứ tự nhóm = thứ tự kỹ năng đầu nhóm (L → S).
 */
export function nhomKyNang(kn: OMtVao['kn'], homNay: string, ct?: string | null, cu = false): NhomKyNang[] {
  const ds = O_KE_HOACH.flatMap((k) => (kn[k] ? [{ k, o: kn[k]!, loai: loaiKn(kn[k]!, homNay) }] : [])).filter((x) => x.loai !== 'khong-yeu-cau');
  const dong = (xs: typeof ds) => xs.map((x) => dongKn(ct, x.k, x.o, x.loai, homNay, cu)).join('\n');
  const ten = (xs: typeof ds) => xs.map((x) => tenMonNgan(ct, x.k)).join(' ');
  if (ds.length && ds.every((x) => x.loai === 'xong')) {
    return [{ kyNang: ds.map((x) => x.k), ten: ten(ds), kieu: 'xong', tuan: tuanMuon(ds, homNay), viec: null, title: dong(ds) }];
  }
  const nhom = new Map<string, typeof ds>();
  for (const x of ds) {
    const tre = x.loai === 'het-tuan' && troCham(x.o, homNay);
    const key = `${x.loai}${tre ? '!' : ''}|${x.o.tuan ? ngayCua(x.o.tuan) : ''}`;
    nhom.set(key, [...(nhom.get(key) ?? []), x]);
  }
  return [...nhom.values()].map((xs) => {
    const x = xs[0]!;
    const tre = x.loai === 'het-tuan' && troCham(x.o, homNay);
    const [kieu, viec]: [KieuOMt, string | null] = x.loai === 'xong' ? ['xong', null]
      : tre ? ['tre-cham', 'trễ'] : x.loai === 'het-tuan' ? [cu ? 'cho-cham-cu' : 'cho-cham', 'chờ']
      : x.loai === 'vang' ? ['con-viec', 'vắng'] : x.loai === 'da-huy' ? ['con-viec', 'huỷ']
      : x.loai === 'tuan-nay' ? ['dang-thi', null] : x.loai === 'co-lich' ? ['co-lich', null] : ['chua-lich', null];
    return { kyNang: xs.map((y) => y.k), ten: ten(xs), kieu, tuan: x.o.tuan ? tuanLich(x.o.tuan, homNay) : null, viec, title: dong(xs) };
  });
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
