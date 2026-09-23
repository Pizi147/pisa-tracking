/**
 * LUẬT THUẦN CỦA KẾ HOẠCH TEST — khu vực Test (spec §3.5 "Kế hoạch Test").
 *
 * Ở đây chỉ có luật KHÔNG ĐỌC DATABASE và KHÔNG TỰ ĐỌC NGÀY GIỜ: trạng thái một nhóm kỹ năng (RLW/S) trên lưới Fast
 * Track, tuần đa số của một nhóm học viên, đợt đã hoàn tất hay chưa (R11), tiêu đề tab theo phạm vi lớp, tóm tắt màn
 * xem trước của Xếp lịch hàng loạt, và "vào muộn". Máy chủ và giao diện cùng gọi một nơi.
 */

export type TrangThaiO = 'xong' | 'da-xep' | 'da-doi' | 'chua-xep' | 'khong-yeu-cau';

/**
 * Trạng thái một Ô NHÓM (RLW hoặc S) của một đợt: không có kỹ năng bắt buộc nào trong nhóm → `khong-yeu-cau`;
 * mọi kỹ năng bắt buộc đã `xong` → `xong`; còn kỹ năng bắt buộc chưa có tuần → `chua-xep`; còn lại mà có kỹ năng
 * đã bị dời vì vắng (Q5) → `da-doi`; hết các trường hợp trên → `da-xep`.
 */
export function trangThaiNhom(
  kn: Array<{ batBuoc: boolean; tuan: string | null; xong: boolean; daDoi: boolean }>,
): TrangThaiO {
  const batBuoc = kn.filter((k) => k.batBuoc);
  if (batBuoc.length === 0) return 'khong-yeu-cau';
  if (batBuoc.every((k) => k.xong)) return 'xong';
  if (batBuoc.some((k) => k.tuan === null)) return 'chua-xep';
  if (batBuoc.some((k) => k.daDoi)) return 'da-doi';
  return 'da-xep';
}

/** Hai nhóm kỹ năng của lưới Fast Track (mockup 05b): RLW gộp một ô, Speaking một ô riêng (G-7). */
export const NHOM_KY_NANG = { rlw: ['listening', 'reading', 'writing'], s: ['speaking'] } as const;

/**
 * TUẦN NHIỀU EM NHẤT của một nhóm (dùng cho ô nhóm RLW khi L/R/W lệch tuần — Q6). Hoà phiếu thì chọn tuần SỚM HƠN:
 * một quyết định phải có, và "sớm hơn" là lựa chọn an toàn (không đẩy ai qua muộn hơn nhu cầu). `khac` liệt kê các
 * tuần còn lại kèm số em, để giao diện viết "+1" và tooltip từng kỹ năng.
 */
export function tuanDaSo(
  tuan: Array<string | null>,
): { tuan: string | null; khac: Array<{ tuan: string; n: number }> } {
  const dem = new Map<string, number>();
  for (const t of tuan) { if (t) dem.set(t, (dem.get(t) ?? 0) + 1); }
  if (dem.size === 0) return { tuan: null, khac: [] };
  let best: string | null = null;
  let bestN = -1;
  for (const [t, n] of dem) {
    if (n > bestN || (n === bestN && best !== null && t < best)) { best = t; bestN = n; }
  }
  const khac = [...dem.entries()]
    .filter(([t]) => t !== best)
    .map(([t, n]) => ({ tuan: t, n }))
    .sort((a, b) => a.tuan.localeCompare(b.tuan));
  return { tuan: best, khac };
}

/**
 * ĐỢT ĐÃ HOÀN TẤT (R11, Q2): mọi kỹ năng BẮT BUỘC, CHƯA HUỶ phần thi, đều có điểm (FT: đủ band theo `coDiem`; lớp
 * thường: có `raw_score` theo `coDiem`) hoặc — CHỈ Fast Track (`ielts_band`) — đã có dấu "-"/đã chốt vắng (`coDau`);
 * VÀ hôm nay đã qua Chủ nhật của tuần muộn nhất trong các kỹ năng đó. Kỹ năng đã huỷ phần thi không tính vào yêu
 * cầu — bỏ hết mọi kỹ năng bắt buộc (toàn bộ đã huỷ) thì KHÔNG BAO GIỜ coi là hoàn tất (an toàn hơn khoá nhầm).
 */
export function dotDaHoanTat(i: {
  cheDo: 'ielts_band' | 'ratio';
  kn: Array<{ batBuoc: boolean; huy: boolean; coDiem: boolean; coDau: boolean }>;
  chuNhatCuoi: string | null;
  homNay: string;
}): boolean {
  const batBuoc = i.kn.filter((k) => k.batBuoc && !k.huy);
  if (batBuoc.length === 0) return false;
  const xong = batBuoc.every((k) => k.coDiem || (i.cheDo === 'ielts_band' && k.coDau));
  if (!xong) return false;
  if (!i.chuNhatCuoi) return false;
  return i.homNay > i.chuNhatCuoi;
}

/** Tiêu đề trong tab (Q10): chỉ có lớp Fast Track thì gọi đúng tên "Mock Test"; có cả lớp thường thì gọi chung. */
export function tieuDeKeHoach(coFT: boolean, coThuong: boolean): string {
  return coFT && !coThuong ? 'Kế hoạch Mock Test' : 'Kế hoạch Test';
}

/** Ngày vào lớp (`enrollments.started_at`) muộn hơn khai giảng lớp quá 14 ngày (Q15). */
export function laVaoMuon(vaoLop: string | null, khaiGiang: string | null): boolean {
  if (!vaoLop || !khaiGiang) return false;
  const soNgay = Math.round(
    (Date.parse(`${vaoLop.slice(0, 10)}T00:00:00Z`) - Date.parse(`${khaiGiang.slice(0, 10)}T00:00:00Z`)) / 86400000,
  );
  return soNgay > 14;
}

export type DongXemTruoc = {
  hanhDong: 'tao' | 'doi' | 'giu' | 'loi';
  tu?: { rlw: string | null; s: string | null } | null;
  den?: { rlw: string | null; s: string | null } | null;
};

/** Gộp tuần RLW và S thành một chuỗi: cùng tháng thì gộp "W3/W4 OCT", khác tháng thì viết đủ cả hai. */
function ganTuan(rlw: string | null, s: string | null, tuanLich: (d: string | null) => string): string {
  if (!rlw) return s ? tuanLich(s) : '';
  const trlw = tuanLich(rlw);
  if (!s || s === rlw) return trlw;
  const ts = tuanLich(s);
  const [wR, ...restR] = trlw.split(' ');
  const [wS, ...restS] = ts.split(' ');
  if (restR.join(' ') === restS.join(' ')) return `${wR}/${wS} ${restR.join(' ')}`;
  return `${trlw}/${ts}`;
}

/**
 * TÓM TẮT MÀN XEM TRƯỚC của Xếp lịch hàng loạt (bước 4, R9): gộp các dòng `tao`/`doi` theo cùng tuần đích thành
 * một câu, cộng một câu cho các dòng `loi`. KHÔNG tự đọc ngày — nhận `tuanLich` qua tham số để giữ hàm thuần.
 */
export function tomTatXemTruoc(dong: DongXemTruoc[], tuanLich: (d: string | null) => string): string[] {
  const cau: string[] = [];

  const nhomTao = new Map<string, number>();
  for (const d of dong) {
    if (d.hanhDong !== 'tao') continue;
    const key = `${d.den?.rlw ?? ''}|${d.den?.s ?? ''}`;
    nhomTao.set(key, (nhomTao.get(key) ?? 0) + 1);
  }
  for (const [key, n] of nhomTao) {
    const [rlw, s] = key.split('|');
    cau.push(`${n} em chưa có → ${ganTuan(rlw || null, s || null, tuanLich)}`);
  }

  const nhomDoi = new Map<string, number>();
  for (const d of dong) {
    if (d.hanhDong !== 'doi') continue;
    const key = `${d.tu?.rlw ?? ''}→${d.den?.rlw ?? ''}`;
    nhomDoi.set(key, (nhomDoi.get(key) ?? 0) + 1);
  }
  for (const [key, n] of nhomDoi) {
    const [tu, den] = key.split('→');
    cau.push(`${n} em ${tuanLich(tu || null)} → ${tuanLich(den || null)} (đổi)`);
  }

  const loi = dong.filter((d) => d.hanhDong === 'loi').length;
  if (loi > 0) cau.push(`${loi} em không xếp được`);

  return cau;
}
