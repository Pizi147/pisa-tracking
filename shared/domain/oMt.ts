/**
 * LUẬT Ô MT (PR-MTb Task 2 · PR-OMT, mockup `mockup-xep-lich-mt-gon-2026-10-07` bản 2) — MỘT đợt Mock Test hiện thành MỘT ô
 * `MT2 · W4 SEP` + tối đa MỘT chữ việc (`chờ` · `trễ W` · `vắng S` · `huỷ S`); MÀU Ô = trạng thái. Xong / MT cũ / xong 3/4: chỉ màu xanh,
 * không chữ. Chưa có đợt và chưa xếp là MỘT kiểu (`MT3 · chưa xếp`). Thuần: không đọc DB, không tự đọc ngày (`homNay` truyền vào).
 * Component `web/src/ui/OMt.tsx` chỉ vẽ kết quả này.
 *
 * Thứ tự (KHÔNG đảo): chưa có lượt → mọi kỹ năng bắt buộc xong → trễ chấm → còn việc (vắng / chờ duyệt, rồi đã huỷ) → chờ chấm →
 * đang thi → có lịch → chưa xếp. Trễ chấm đứng TRƯỚC vắng vì hạn chấm quá là việc gấp hơn.
 */
import { docTuanLich, ngay, tuanLich } from './hienThiNgay.ts';
import { O_KE_HOACH, trangThaiKyNang, type KyNangKH, type OKyNang } from './keHoachTest.ts';
import { tenMon, tenMonNgan } from './normal.ts';
import { tuanNamChu } from './keHoachOv15c.ts';
import { addDaysIso } from './sos.ts';
import { lyDoHuy } from './vang.ts';
import { t } from '../i18n/index.ts';

/** `cho-cham-cu`: MT cũ chờ nhập bù điểm — chữ `chờ`, màu TÍM như `cho-cham` (C2 07/10; trước đây xám, trùng "chưa xếp"). Tooltip không hạn. */
export type KieuOMt = 'chua-lich' | 'co-lich' | 'dang-thi' | 'cho-cham' | 'cho-cham-cu' | 'tre-cham' | 'con-viec' | 'xong';
/** KHUNG-LOI (TST-05): nhãn chú giải từng kiểu ô — chú giải màu sinh từ đây + `MAU_O_MT` (một nguồn, không viết tay chữ màu). */
export const NHAN_KIEU_O_MT: Record<KieuOMt, string> = {
  'chua-lich': t('Chưa xếp'), 'co-lich': t('Đã xếp'), 'dang-thi': t('Đang làm bài'), 'cho-cham': t('Chờ chấm'), 'cho-cham-cu': t('Chờ nhập bù'),
  'tre-cham': t('Trễ chấm'), 'con-viec': t('Vắng · huỷ · chờ duyệt'), xong: t('Đã làm bài'),
};

/** `attemptId` null = chưa có lượt (cùng kiểu "chưa xếp", C5). `cu` chỉ còn đổi tooltip + `aria-label` (ô không ghi chữ "cũ", C3). */
export type OMtVao = {
  so: number; attemptId: number | null; kn: Partial<Record<KyNangKH, OKyNang>>; cu: boolean;
  /** PR-MT0: MT0 có điểm mà em không lên FT — ô mờ, tooltip thêm `MT0 · không dùng`. */
  khongDung?: boolean;
};

type Loai = 'xong' | 'khong-yeu-cau' | 'khong-du-thi' | 'da-huy' | 'vang' | 'het-tuan' | 'tuan-nay' | 'co-lich' | 'chua-lich';

const ngayCua = (s: string) => s.slice(0, 10);

/** Một kỹ năng đang ở đâu. Tuần đã hết = Chủ nhật tuần thi < hôm nay, chưa có điểm, không vắng / huỷ. */
function loaiKn(o: OKyNang, homNay: string): Loai {
  if (!o.batBuoc) return 'khong-yeu-cau';
  /* Không dự thi ("-" sau tuần thi / MT cũ): ô MT tính như xong (PR-MTb I2); chip kỹ năng vẫn ghi "không dự thi" (OV-11a CA3-5). */
  if (o.khongDuThi) return 'khong-du-thi';
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
    xong: 'xong', 'khong-yeu-cau': t('không yêu cầu'), 'khong-du-thi': cu ? t('đã huỷ') : t('vắng'), 'tuan-nay': t('tuần này'), 'co-lich': null, 'chua-lich': null,
    'da-huy': `${o.huyVang ? t('huỷ (vắng 2 lần)') : t('đã huỷ')}${o.choDuyet ? t(' · chờ Quản lý duyệt') : ''}`,   // đề nghị dời đang chờ (I1)
    vang: o.choDuyet ? t('chờ Quản lý duyệt') : t('vắng'),
    // Hạn chấm là hạn cụ thể → được hiện ngày (luật thời gian trên màn); null (MT cũ, không hạn) thì không ghi.
    'het-tuan': `${troCham(o, homNay) ? t('trễ chấm') : t('chờ chấm')}${o.hanCham ? t(' · hạn {ngay}', { ngay: ngay(o.hanCham, homNay) }) : ''}`,
  };
  const tuan = loai === 'khong-yeu-cau' ? null : o.tuan ? tuanLich(o.tuan, homNay) : loai === 'chua-lich' ? t('chưa xếp') : null;
  return `${tenMon(ct, k)}: ${[tuan, tt[loai]].filter(Boolean).join(' · ')}`;
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

/** "chờ …" → "chờ chấm …", "trễ …" → "trễ chấm …" (chữ đọc cho trình đọc màn hình) — so bằng t() để đúng cả bản Anh. */
const chuCham = (viec: string) => {
  for (const [a, b] of [[t('chờ'), t('chờ chấm')], [t('trễ'), t('trễ chấm')]]) if (viec.startsWith(a)) return b + viec.slice(a.length);
  return viec;
};

export function oMt(v: OMtVao, homNay: string, ct?: string | null): OMtRa {
  const ra = (kieu: KieuOMt, tuan: string | null, viec: string | null, title: string): OMtRa => {
    const chu = [tuan, viec].filter(Boolean).join(' · ');
    const dai = viec ? chuCham(viec) : null;
    const tt = kieu === 'xong' ? [t('xong'), tuan] : kieu === 'dang-thi' ? [t('đang làm bài'), tuan] : kieu === 'co-lich' ? [t('có lịch'), tuan] : [tuan, dai];
    return { kieu, tuan, viec, chu, cu: v.cu, title, doc: [`MT${v.so}`, ...tt].filter(Boolean).join(', ') };
  };
  if (v.attemptId === null) return ra('chua-lich', null, t('chưa xếp'), t('Chưa có đợt'));

  const ds = O_KE_HOACH.flatMap((k) => (v.kn[k] ? [{ k, o: v.kn[k]!, loai: loaiKn(v.kn[k]!, homNay) }] : []));
  const title = [v.khongDung ? t('MT0 · không dùng') : null, ds.map((x) => dongKn(ct, x.k, x.o, x.loai, homNay, v.cu)).join('\n') || t('Chưa có kỹ năng')]
    .filter(Boolean).join('\n');
  const cua = (...l: Loai[]) => ds.filter((x) => l.includes(x.loai));
  const ten = (xs: typeof ds) => xs.map((x) => tenMonNgan(ct, x.k)).join(' ');
  const batBuoc = ds.filter((x) => x.loai !== 'khong-yeu-cau' && x.loai !== 'khong-du-thi');
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
  if (tre.length) return ra('tre-cham', tuanSom(tre), viec(t('trễ'), tre), title);
  const vang = cua('vang');
  if (vang.length) return ra('con-viec', tuanSom(vang), viec(t('vắng'), vang), title);
  const huy = cua('da-huy');
  if (huy.length) return ra('con-viec', tuanSom(huy), viec(t('huỷ'), huy), title);
  const cho = cua('het-tuan');
  if (cho.length) return ra(v.cu ? 'cho-cham-cu' : 'cho-cham', tuanSom(cho), viec(t('chờ'), cho), title);
  if (cua('tuan-nay').length) return ra('dang-thi', tuanSom(cua('tuan-nay')), null, title);
  const som = cua('co-lich').map((x) => ngayCua(x.o.tuan!)).sort()[0];
  if (som) return ra('co-lich', tuanLich(som, homNay), null, title);
  return ra('chua-lich', null, t('chưa xếp'), title);
}

/** Một nhóm kỹ năng CÙNG tuần + CÙNG trạng thái của một đợt — một chip ở lưới FT Kế hoạch Test (C6, mockup G1). */
export type NhomKyNang = {
  kyNang: KyNangKH[]; ten: string; kieu: KieuOMt; tuan: string | null; viec: string | null; title: string;
  /** Câu đọc màn hình (sau `MT2, `): `L R W S, xong, W4 SEP` — chip không chữ việc vẫn nói trạng thái, như `doc` của `oMt` (VIEC-NHO 1). */
  doc: string;
};

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
    const tuan = tuanMuon(ds, homNay);
    return [{ kyNang: ds.map((x) => x.k), ten: ten(ds), kieu: 'xong', tuan, viec: null, title: dong(ds), doc: [ten(ds), 'xong', tuan].filter(Boolean).join(', ') }];
  }
  const nhom = new Map<string, typeof ds>();
  for (const x of ds) {
    const tre = x.loai === 'het-tuan' && troCham(x.o, homNay);
    /* UI-CHAM-TEST (Rulebook §21.4 T5): "huỷ" khác lý do thì khác chip. */
    const key = `${x.loai}${tre ? '!' : ''}|${x.o.tuan ? ngayCua(x.o.tuan) : ''}|${x.loai === 'da-huy' ? lyDoHuy(x.o) : ''}`;
    nhom.set(key, [...(nhom.get(key) ?? []), x]);
  }
  return [...nhom.values()].map((xs) => {
    const x = xs[0]!;
    const tre = x.loai === 'het-tuan' && troCham(x.o, homNay);
    const [kieu, viec]: [KieuOMt, string | null] = x.loai === 'xong' ? ['xong', null]
      : tre ? ['tre-cham', t('trễ')] : x.loai === 'het-tuan' ? [cu ? 'cho-cham-cu' : 'cho-cham', t('chờ')]
      : x.loai === 'vang' ? ['con-viec', t('vắng')] : x.loai === 'da-huy' ? ['con-viec', [t('huỷ'), lyDoHuy(x.o)].filter(Boolean).join(' · ')]
      : x.loai === 'tuan-nay' ? ['dang-thi', null] : x.loai === 'co-lich' ? ['co-lich', null]
      : x.loai === 'khong-du-thi' ? ['chua-lich', cu ? `${t('đã huỷ')} · ${lyDoHuy({ mtCu: true })}` : t('vắng')] : ['chua-lich', null];   // LUAT-34: MT cũ "-" = Đã huỷ
    const tuan = x.o.tuan ? tuanLich(x.o.tuan, homNay) : null;
    const tt = (viec ? chuCham(viec) : null) ?? ({ xong: t('xong'), 'dang-thi': t('đang làm bài'), 'co-lich': t('có lịch') } as Partial<Record<KieuOMt, string>>)[kieu] ?? null;
    return { kyNang: xs.map((y) => y.k), ten: ten(xs), kieu, tuan, viec, title: dong(xs), doc: [ten(xs), tt, tuan ?? t('chưa xếp')].filter(Boolean).join(', ') };
  });
}

/**
 * Chip trạng thái MỘT dòng kỹ năng của hộp một đợt (mockup phần 2: `trễ chấm`, `chờ chấm`, `vắng`, `huỷ`, `chưa xếp`) — cùng luật `oMt`
 * (một nguồn: nhãn ô MT và chip dòng không lệch). Đang thi / có lịch / xong / không yêu cầu → null (dòng chỉ có chip tuần hoặc điểm).
 */
export function chipDongKyNang(o: OKyNang, homNay: string, ct?: string | null, cu = false): { chu: string; tone: 'bad' | 'soon' | 'muted' } | null {
  if (!o.batBuoc) return null;
  if (o.khongDuThi) return { chu: cu ? `${t('Đã huỷ')} · ${lyDoHuy({ mtCu: true })}` : t('Vắng'), tone: 'muted' };   // LUAT-34: MT cũ = Đã huỷ · OV-11a (CA3-5): dòng kỹ năng hộp một đợt "W2 SEP · Không dự thi"
  // Ô MT cần một khe kỹ năng; dùng `listening` làm khe tạm cho đúng MỘT kỹ năng này.
  const r = oMt({ so: 0, attemptId: 0, kn: { listening: o }, cu }, homNay, ct);
  switch (r.kieu) {
    case 'tre-cham': return { chu: t('trễ chấm'), tone: 'bad' };
    case 'cho-cham': return { chu: t('chờ chấm'), tone: 'muted' };
    case 'cho-cham-cu': return { chu: t('chờ chấm'), tone: 'muted' };   // MT cũ chưa điểm (C2; OV-15a: xám, bỏ tím)
    case 'con-viec': return { chu: o.huyVang || o.trangThai === 'da-huy' ? [t('huỷ'), lyDoHuy(o)].filter(Boolean).join(' · ') : t('vắng'), tone: 'soon' };
    case 'chua-lich': return { chu: t('chưa xếp'), tone: 'muted' };
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
 * Kỹ năng có "Không dự thi" ở MỌI ô nhập của nó (Writing: cả W1 và W2) và chưa có điểm (PR-MTb sau rà I2; máy chủ `khongDuThiCua` cùng
 * luật). `cells` = ô của hồ sơ Mock (`attemptDetail.cells`). OV-11a (CA3-5): mọi lượt, không chỉ MT cũ — "-" nhập bù sau tuần thi cũng là
 * Không dự thi; vắng đã chốt (`daChot`, chờ Quản lý / huỷ) không phải.
 */
export function khongDuThiTuO(
  cells: Array<{ assessedSkill: string; band: number | null; rawScore: number | null; noShow?: { state?: string } | null; daChot?: unknown }>,
  skill: string,
): boolean {
  const o = cells.filter((c) => c.assessedSkill === skill);
  return o.length > 0 && o.every((c) => c.noShow?.state === 'khong-du-thi' && !c.daChot && c.band === null && c.rawScore === null);
}

/** Ô GỌN — trạng thái chữ (Kế hoạch Test, mockup `thiet-ke/v7/ke-hoach-test.html`). `vang` = cần Quản lý xếp lại / chờ duyệt (vàng). */
export type LoaiTtGon = 'nay' | 'tre' | 'cho' | 'vang' | 'xong' | 'chua' | 'xep';
/** Một môn trong ô (ô nhỏ có khung): `co` có điểm "L ✓" · `cho` chưa có điểm, chưa trễ "L" · `tre` trễ chấm "S trễ chấm". */
export type MonGon = { k: KyNangKH; ten: string; loai: 'co' | 'cho' | 'tre' };
/** Một DÒNG của ô = một tuần thi: tuần + các môn thi tuần đó + trạng thái chung của dòng (nếu có). */
export type DongGon = { tuan: string | null; tuanDu: string | null; mon: MonGon[]; tt: { chu: string; loai: LoaiTtGon } | null };
export type OGon = {
  /** Dòng theo tuần thi, tuần sớm trước; môn chưa xếp tuần → dòng `tuan: null`. */
  dong: DongGon[];
  /** false = MT tương lai một tuần, chưa môn nào xong: chỉ tuần + "đã xếp", không hàng môn (chủ SP 28/10). */
  hienMon: boolean;
  /** Tuần chính (tóm tắt / câu đọc): xong → tuần muộn nhất; chưa xong → tuần dòng đầu. */
  tuan: string | null;
  tuanDu: string | null;
  xong: boolean;
  /** Trạng thái chung của ô (vạch trái, câu đọc): trễ chấm · xếp lại / chờ duyệt · tuần này. */
  tt: { chu: string; loai: LoaiTtGon } | null;
  /** Đợt chỉ thi vài môn: `không thi W S` (chữ mờ, không khung). */
  khongThi: string | null;
  /** Vắng (chữ thường, không khung, dòng dưới cùng): `vắng S · W2 OCT` · `vắng L R W S · W2 OCT`; luôn ghi, kể cả đã đủ điểm. */
  vang: string | null;
};

/**
 * KẾ HOẠCH TEST — ô một đợt (FT và lớp thường; chủ SP chốt 28/10 qua mẫu PTA): chia DÒNG THEO TUẦN THI, mỗi môn một ô nhỏ có khung
 * (`L ✓` · `L` · `S trễ chấm`), điểm tổng sau các môn (web), vắng ghi chữ thường ở dòng cuối, đợt thiếu môn ghi "không thi W S".
 * Cùng `loaiKn` / `troCham` với ô MT (một luật trạng thái). null = đợt không có kỹ năng nào phải thi.
 */
export function oGon(kn: OMtVao['kn'], homNay: string, ct?: string | null): OGon | null {
  const ds = O_KE_HOACH.flatMap((k) => (kn[k] ? [{ k, o: kn[k]!, loai: loaiKn(kn[k]!, homNay) }] : []));
  const req = ds.filter((x) => x.loai !== 'khong-yeu-cau');
  if (!req.length) return null;
  type X = (typeof ds)[number];
  const ten = (xs: readonly X[]) => xs.map((x) => tenMonNgan(ct, x.k)).join(' ');
  const ma = (w: string) => tuanLich(w);
  const daXong = (x: X) => x.loai === 'xong' || x.loai === 'khong-du-thi';
  const xong = req.every(daXong);
  const vangNay = req.filter((x) => x.loai === 'vang' || x.loai === 'da-huy');   // đang vắng / phần thi huỷ — chờ xếp lại
  const thi = req.filter((x) => !vangNay.includes(x) && x.loai !== 'khong-du-thi');

  /* Dòng theo tuần thi của từng môn (môn chưa có tuần → một dòng "chưa xếp"). */
  const theoTuan = new Map<string, X[]>();
  for (const x of thi) { const w = x.o.tuan ? ngayCua(x.o.tuan) : ''; theoTuan.set(w, [...(theoTuan.get(w) ?? []), x]); }
  const dong: DongGon[] = [...theoTuan].sort((a, b) => (a[0] || '9').localeCompare(b[0] || '9')).map(([w, xs]) => {
    const mon = xs.map((x): MonGon => ({ k: x.k, ten: tenMonNgan(ct, x.k), loai: x.loai === 'xong' ? 'co' : x.loai === 'het-tuan' && troCham(x.o, homNay) ? 'tre' : 'cho' }));
    const con = xs.filter((x) => x.loai !== 'xong');
    const tt: DongGon['tt'] = !w ? { chu: t('chưa xếp'), loai: 'chua' }
      : !con.length || mon.some((m) => m.loai === 'tre') ? null
      : con.some((x) => x.loai === 'het-tuan') ? { chu: t('chờ chấm'), loai: 'cho' }
      : con.some((x) => x.loai === 'tuan-nay') ? { chu: t('tuần này'), loai: 'nay' }
      : { chu: t('đã xếp'), loai: 'xep' };
    return { tuan: w ? ma(w) : null, tuanDu: w ? tuanNamChu(w) : null, mon, tt };
  });

  const chinh = xong ? req.map((x) => x.o.tuan && ngayCua(x.o.tuan)).filter((w): w is string => !!w).sort().pop() ?? null
    : [...theoTuan.keys()].filter(Boolean).sort()[0] ?? null;
  const tt: OGon['tt'] = xong ? { chu: t('xong'), loai: 'xong' }
    : dong.some((d) => d.mon.some((m) => m.loai === 'tre')) ? { chu: t('trễ chấm'), loai: 'tre' }
    : vangNay.length ? { chu: vangNay.some((x) => x.o.choDuyet) ? t('chờ duyệt') : t('xếp lại {x}', { x: ten(vangNay) }), loai: 'vang' }
    : dong.some((d) => d.tt?.loai === 'nay') ? { chu: t('tuần này'), loai: 'nay' } : null;

  /* Vắng: môn đã dời do vắng (`doiTu`, có thể là mã tuần) + môn đang vắng (tuần của nó) — gộp theo tuần vắng. LUÔN ghi, kể cả đã đủ điểm (chủ SP 28/10 mới nhất: "cái gì vắng cũng nên ghi thêm"). */
  const ngayVang = (x: X) => (x.o.doiTu ? (/^\d{4}-\d{2}-\d{2}/.test(x.o.doiTu) ? x.o.doiTu : docTuanLich(x.o.doiTu, homNay)) : vangNay.includes(x) ? x.o.tuan : null);
  const nhomVang = new Map<string, X[]>();
  for (const x of req) { const w = ngayVang(x); if (w) nhomVang.set(ngayCua(w), [...(nhomVang.get(ngayCua(w)) ?? []), x]); }
  const vang = [...nhomVang].sort((a, b) => a[0].localeCompare(b[0])).map(([w, xs]) => t('vắng {x} · {tuan}', { x: ten(xs), tuan: ma(w) })).join(' · ');

  const boMon = ds.filter((x) => x.loai === 'khong-yeu-cau');
  const tuongLai = dong.length === 1 && dong[0].tt?.loai === 'xep' && !req.some(daXong);
  return {
    dong, hienMon: !tuongLai, tuan: chinh ? ma(chinh) : null, tuanDu: chinh ? tuanNamChu(chinh) : null, xong, tt,
    khongThi: boMon.length ? t('không thi {x}', { x: ten(boMon) }) : null,
    vang: vang || null,
  };
}
