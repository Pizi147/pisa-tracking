/**
 * GD-4b DÒNG QUY CHẾ — nhóm VanHanh: câu theo bảng 83 câu `thiet-ke/v21/bang-mau-ghi-chu.md` mục 2 (số Q ghi cạnh từng hàm). Câu ở `shared/`, không viết tay ở panel.
 * Giá trị `{…}` lấy từ dữ liệu panel đã nạp (không thêm request); thiếu thì dùng câu không có giá trị đó.
 */
import { t } from '../i18n/index.ts';
import type { QuyChe } from './quyChe.ts';
import type { LoaiYeuCau } from './yeuCauDuyet.ts';
import { daysBetween, shortDate } from './display.ts';
import { tuanLich } from './hienThiNgay.ts';
import { thuNgay } from './chuyenLop.ts';
import { mondayOfDate } from './week.ts';
import { laMtCuKyNang } from './vang.ts';

const CHI_TIET_MT_CU = (): string => t('Tuần Test đã qua 2 tuần: "-" ghi Không dự thi — không dời, không tính lần vắng.');

/**
 * NHẬP ĐIỂM (Q1, Q2, Q5, Q6, Q7, Q9, Q58). Chủ SP 14/11 (plan.md, #1619): "đã có chữ MT thì tức là Mock test, tính như luật MT bình thường" —
 * Mock + MT0 (KỂ CẢ lớp thường): "-" lần 1 dời sang tuần sau · lần 2 huỷ; Progress / Final lớp thường: dời, không tự huỷ · cần thì ⋯ › Huỷ điểm (NHAP-DIEM-b);
 * tuần Test qua ≥ 2 tuần = Không dự thi (`laMtCuKyNang`). Thứ tự: MT cũ › tuần đã qua 2 tuần › chưa tới tuần › quá hạn › mặc định.
 */
export function quyCheNhapDiem(o: {
  /** Lớp thường. */ thuong: boolean;
  mt0?: boolean; tuanThi?: string | null; homNay?: string | null; han?: string | null;
  /** Q7: ngưỡng Đạt (%) của lớp thường, nếu bảng đã trả. */ nguongDat?: number | null;
  /** Q58: lượt MT cũ (nhập lịch sử). */ mtCu?: boolean;
  /** Q82: người xem làm việc của người khác (QL / Admin nhập hộ — `WorkItem.mine === false`). */ nhapHo?: boolean;
}): QuyChe {
  const qc = quyCheNhapDiemGoc(o);
  /* QC-Q82: "Bạn nhập hộ · " đứng đầu mọi biến thể — câu sau vẫn đúng luật của lượt (máy chủ kiểm quyền từng ô). */
  return o.nhapHo ? { ...qc, chu: t('Bạn nhập hộ · {cau}', { cau: qc.chu }) } : qc;
}

function quyCheNhapDiemGoc(o: Parameters<typeof quyCheNhapDiem>[0]): QuyChe {
  const h = o.homNay ?? null;
  /* Luật vắng Mock áp cho Mock FT và MỌI MT0; chỉ Progress / Final lớp thường là "dời, không tự huỷ". */
  const theoMock = !o.thuong || !!o.mt0;
  if (o.mtCu) return { chu: t('MT cũ: không hạn · MT trong 4 tuần gần đây vẫn sinh Case') };
  if (o.tuanThi && h && laMtCuKyNang(o.tuanThi, h)) return { chu: t('"-" lúc này = Không dự thi, không dời'), chiTiet: CHI_TIET_MT_CU() };
  if (o.tuanThi && h && mondayOfDate(h) < mondayOfDate(o.tuanThi)) {
    /* QC-Q82 [XM]: theo mã NHAP-DIEM-a (`doiVeTuanNayNeuChua`) — lưu điểm trước tuần Test thì máy TỰ dời về tuần này, không hỏi, không cần QL
       (bảng 83 câu ghi "hỏi dời về tuần này rồi lưu"; câu cũ "nhờ QL dời lịch" là luật trước 14/11). */
    return { chu: t('Chưa tới tuần Test {tuan} · lưu điểm thì máy dời về tuần này', { tuan: tuanLich(o.tuanThi, h) }) };
  }
  const quaHan = !!o.han && !!h && o.han < h;
  if (quaHan) {
    return {
      chu: theoMock ? t('Quá hạn từ {ngay}, vẫn nhập được · "-" = vắng, lần 2 huỷ', { ngay: shortDate(o.han, h!) })
        : t('Quá hạn từ {ngay}, vẫn nhập được · "-" = vắng, dời sang tuần sau', { ngay: shortDate(o.han, h!) }),
      chiTiet: CHI_TIET_MT_CU(),
    };
  }
  const chu = o.mt0 ? t('MT0: "-" = vắng: lần 1 dời sang tuần sau · lần 2 huỷ')
    : theoMock ? t('"-" = vắng: lần 1 dời sang tuần sau · lần 2 huỷ')
      : o.nguongDat != null ? t('Đạt từ {n} % · "-" = vắng: dời sang tuần sau, không tự huỷ', { n: o.nguongDat })
        : t('"-" = vắng: dời sang tuần sau, không tự huỷ');
  /* Progress / Final lớp thường: Huỷ điểm bằng tay ở ⋯ (NHAP-DIEM-b) — nói ở ⓘ. */
  const chiTiet = theoMock ? CHI_TIET_MT_CU() : `${t('Cần thì ⋯ › Huỷ điểm.')} ${CHI_TIET_MT_CU()}`;
  return { chu, chiTiet };
}

/** Q10 Chấm Speaking (lời 20 / bảng ⑤ mục 0 ý 2); Q12 khi người xem nhập hộ hàng đợi của GV khác (QL / Admin). Q11 là câu theo ô có nhận xét — không ở dòng panel. */
export const quyCheChamSpeaking = (nhapHo: boolean): QuyChe => ({
  chu: nhapHo ? t('Bạn nhập hộ: chọn GV chấm trước khi lưu') : t('Mọi GV Speaking chi nhánh chấm được · GV chấm mặc định là bạn'),
});

/** Q37–Q40 Viết Báo cáo PH (luat/3 Y-21; lời 12–16): quá hạn › phần Chung (GVCN) › FT › lớp thường. */
export function quyCheBaoCaoPh(o: { ft: boolean; chung: boolean; dot: string; han: string | null; homNay: string | null }): QuyChe {
  const h = o.homNay;
  if (o.han && h && o.han < h) return { chu: t('Quá hạn vẫn viết được · việc rời sau 7 ngày') };
  if (o.chung) return { chu: t('Bạn viết phần Chung · GV kỹ năng viết phần môn mình') };
  const han = o.han && h ? shortDate(o.han, h) : null;
  if (o.ft) return { chu: han ? t('{dot} · hạn {ngay} · bạn viết phần mình cho mọi em', { dot: o.dot, ngay: han }) : t('{dot} · bạn viết phần mình cho mọi em', { dot: o.dot }) };
  return { chu: han ? t('{dot} · hạn {ngay}', { dot: o.dot, ngay: han }) : o.dot };
}

/** Q41 Bàn giao môn (GVBM) · Q57 Bàn giao n em (GVCN) — luat/4 L-17: quá hạn em vẫn chuyển. */
export const quyCheBanGiao = (gvcn: boolean, han: string | null, homNay: string | null): QuyChe => {
  const ngay = han && homNay ? shortDate(han, homNay) : null;
  const dau = gvcn ? t('Nhận xét chung + Xác nhận') : t('Một câu mỗi em');
  return { chu: [dau, ngay ? t('hạn {ngay}', { ngay }) : null, t('quá hạn em vẫn chuyển')].filter(Boolean).join(' · ') };
};

/** Q42 Bàn giao khi đổi GV (luat/4 L-18). */
export const quyCheBanGiaoGv = (): QuyChe => ({ chu: t('Hạn 5 ngày · xác nhận xong GV mới nhận tin') });

/** Q43 Việc được giao (việc mgmt). */
export const quyCheViecGiao = (): QuyChe => ({ chu: t('Hạn do QL đặt · ghi Hoàn thành khi xong') });

/** Q59 Đề xuất chuyển lớp (GVCN) · Q78 / Q79 Chuyển lớp (QL) — luat/4 L-15, L-17; luat/2 C-07. */
export const quyCheChuyenLop = (o: { deXuat: boolean; ngayNay: boolean; tuan: string | null; homNay: string | null }): QuyChe => (
  o.deXuat ? { chu: t('QL lớp nguồn quyết định · duyệt xong bạn nhận việc bàn giao') }
    : o.ngayNay ? { chu: t('Ngay hôm nay: em sang lớp mới từ hôm nay') }
      : { chu: o.tuan && o.homNay ? t('Bắt đầu {tuan} · Case, PA mở sang GV lớp mới', { tuan: tuanLich(o.tuan, o.homNay) }) : t('Bắt đầu Thứ Hai tuần sau · Case, PA mở sang GV lớp mới') }
);

/** Q76 Xét lại lộ trình (luat/4 L-14). */
export const quyCheXetLai = (): QuyChe => ({ chu: t('Không làm gì = Tiếp tục · Tiếp tục khi Final < 50 cần lý do') });

/**
 * Q74 / Q75 / Q77 Chốt lộ trình · Kỳ vọng đầu ra — trang Cuối khoá (QC-GAN; luat/4 L-12, L-13, mục 5). Ưu tiên theo lựa chọn đang sửa:
 * Kỳ vọng Không đạt do Trung tâm (Q77) › có dòng khác gợi ý (Q75) › mặc định (Q74). Q74 theo mã: hạn chốt lấy `mocLoTrinh` (cấu hình được, không cứng
 * "thứ Năm"); lệnh thi hành vào Thứ Hai của TUẦN BẮT ĐẦU đã chọn (`lenhChuyen.ts`), không phải luôn "Thứ Hai sau" → câu nói đúng như vậy.
 */
export function quyCheChotLoTrinh(o: { trungTam: boolean; tutor: number; khacGoiY: boolean; hanChot: string | null; homNay: string | null }): QuyChe {
  if (o.trungTam) return { chu: t('Do Trung tâm: Case + Tutor {n} buổi mỗi kỹ năng cho GV lớp FT', { n: o.tutor }) };
  if (o.khacGoiY) return { chu: t('Khác gợi ý: cần lý do') };
  return {
    chu: o.hanChot && o.homNay ? t('Hạn {ngay} · tới Thứ Hai tuần bắt đầu máy tự chuyển lớp', { ngay: thuNgay(o.hanChot, o.homNay) })
      : t('Tới Thứ Hai tuần bắt đầu máy tự chuyển lớp'),
  };
}

/**
 * Q83 Xuất báo cáo PH (luat/3 mục 3, `xuatBaoCaoPh.ts` `viecXuatBaoCaoPh`): việc Admin hiện 7 ngày từ ngày lớp đủ; đợt quá hạn còn thiếu em thì 7 ngày từ hạn.
 * Nút Xuất không có panel → câu đặt trong ⓘ cạnh nút (luật ⓘ = giải thích), không thêm đoạn chú thích.
 */
export const quyCheXuatBaoCaoPh = (du: boolean): QuyChe => (du
  ? { chu: t('Lớp đủ báo cáo · việc tự rời sau 7 ngày') }
  : { chu: t('Đợt quá hạn còn thiếu em: việc Xuất hiện 7 ngày từ hạn') });

/** Q81 Case chưa có người phụ trách (việc no_owner). */
export const quyChePhanCong = (): QuyChe => ({ chu: t('Phân công xong, Case về người đó') });

/**
 * Q69–Q73 Duyệt theo loại thẻ (luat/4 mục 4, L-25; luat/3 Y-09). Q72: LG-10 (#1599, lời 33) — thẻ thu hồi hết hạn tự chốt theo GVCN như thẻ xử lý
 * (`server/src/yThuc/xuLy.ts` `quetYThucHetHan`), thay câu cũ "Không tự chốt". Loại khác: không có câu.
 */
export function quyCheDuyet(loai: LoaiYeuCau, han: string | null, homNay: string | null, hanNgay: number): QuyChe | null {
  const con = han && homNay ? Math.max(0, daysBetween(homNay, han)) : null;
  const conChu = con != null ? t('Còn {n} ngày', { n: con }) : null;
  const ghep = (...x: (string | null)[]) => ({ chu: x.filter(Boolean).join(' · ') });
  switch (loai) {
    case 'y_thuc': return ghep(conChu, t('hết hạn máy chốt theo GVCN'), t('từ chối cần lý do'));
    case 'thu_hoi_y_thuc': return ghep(conChu, t('hết hạn máy chốt theo GVCN'), t('duyệt thì bậc tính lại'));
    case 'giu_pa_gv': return ghep(conChu, t('quá hạn máy chốt theo PA của GV'));
    case 'de_xuat_pa': case 'khong_theo_doi': case 'xin_xoa': case 'sua_thong_tin':
      return ghep(t('Hạn {n} ngày', { n: hanNgay }), t('quá hạn vẫn chờ'), t('từ chối cần lý do'));
    case 'de_xuat_chuyen_lop': return { chu: t('Duyệt = mở Chuyển lớp điền sẵn') };
    default: return null;
  }
}
