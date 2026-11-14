/**
 * GD-4b DÒNG QUY CHẾ — nhóm YThuc: câu theo bảng 83 câu `thiet-ke/v21/bang-mau-ghi-chu.md` mục 2 (số Q ghi cạnh từng hàm). Câu ở `shared/`, không viết tay ở panel.
 * `{…}` = giá trị panel đã nạp (không thêm request); thiếu thì dùng câu không có giá trị đó. Ngày truyền vào đã định dạng sẵn (`ngay` / `shortDate`).
 */
import { t } from '../i18n/index.ts';
import type { QuyChe } from './quyChe.ts';

/** Q36 (luat/3 Y-17): GV › Báo tình hình học tập. */
export const quyCheBaoTinhHinh = (): QuyChe => ({ chu: t('TVV báo PH trong 5 ngày · kết quả về chuông của bạn') });

/** Q63 (luat/3 Y-18): TVV › Hỏi tình hình học tập. */
export const quyCheHoiTinhHinh = (): QuyChe => ({ chu: t('GVCN trả lời trong 3 ngày · kết quả về chuông của bạn') });

/** Q52 (luat/3 Y-18): GVCN ghi kết quả tình hình TVV hỏi — hạn thật của việc. */
export const quyCheTraLoiTinhHinh = (han: string | null): QuyChe => ({
  chu: han ? t('Hạn {han} (3 ngày) · lưu xong TVV nhận chuông', { han }) : t('Trả lời trong 3 ngày · lưu xong TVV nhận chuông'),
});

/** Q44 (luat/3 Y-04, Y-05): GVCN › Xem vi phạm mới; cũng cho lô Ghi nhận. */
export const quyCheXemViPham = (): QuyChe => ({ chu: t('Đã xem vẫn đếm · đủ 3 trong 2 tuần thì phải xử lý') });

/**
 * Q45 / Q46 / Q47 (luat/3 Y-06…Y-10, Y-14): Xác nhận xử lý theo cách đang chọn. `soNgay` = Hạn mặc định QL duyệt (`hanDuyetNgay`) — máy chủ quá hạn
 * tự chốt theo GVCN (`quetYThucHetHan`). Lô (nhiều em, nhiều TVV): `tvv` = null.
 */
export const quyCheXuLy = (cach: 'nang' | 'giu' | 'vuot' | 'ngoai', o: { tvv: string | null; han: string; soNgay: number }): QuyChe => {
  if (cach === 'nang') return { chu: o.tvv ? t('Nâng 1 bậc: xong ngay · TVV {tvv} báo PH, hạn {han}', { tvv: o.tvv, han: o.han }) : t('Nâng 1 bậc: xong ngay · TVV báo PH, hạn {han}', { han: o.han }) };
  const chiTiet = t('Quá {n} ngày QL chưa duyệt: giữ quyết định của bạn. TVV nhận việc báo PH sau khi chốt.', { n: o.soNgay });
  return cach === 'ngoai'
    ? { chu: t('Ngoài thang: cần tệp bằng chứng · QL duyệt {n} ngày', { n: o.soNgay }), chiTiet }
    : { chu: t('Gửi QL duyệt {n} ngày · hết hạn giữ cách của bạn · TVV chưa có việc', { n: o.soNgay }), chiTiet };
};

/** Q48 / Q49 (luat/3 mục 2 (a), mục 4): GVCN ghi "Đã thực hiện". `nhan` = tên bậc đã dịch; lần ngoài thang (không bậc) → câu không có bậc. */
export const quyCheDaThucHien = (nhan: string | null, phDuMeeting: boolean): QuyChe => phDuMeeting
  ? { chu: t('PH dự Meeting: TVV khỏi báo PH') }
  : { chu: nhan ? t('Lưu xong bậc {nhan} mới được tính', { nhan }) : t('Lưu xong lần xử lý mới được tính') };

/**
 * Q50 (luat/3 Y-11) + lời 33 / LG-10 (chủ SP 15/11): thu hồi lần xử lý. GVCN → thẻ QL duyệt, quá hạn tự chốt theo GVCN (`quetYThucHetHan` — bậc tính lại,
 * "Báo lại PH" bật). QL (`thuHoiThang`) → thu hồi ngay.
 */
export const quyCheThuHoi = (o: { ql: boolean; soNgay: number; daBaoPh: boolean; baoLai: boolean }): QuyChe => o.ql
  ? { chu: !o.daBaoPh ? t('Thu hồi ngay · bậc tính lại') : o.baoLai ? t('Thu hồi ngay · bậc tính lại · TVV báo lại PH') : t('Thu hồi ngay · bậc tính lại · TVV không báo lại PH') }
  : {
    chu: o.daBaoPh ? t('Gửi QL duyệt {n} ngày · quá hạn tự thu hồi · bậc tính lại · TVV báo lại PH', { n: o.soNgay })
      : t('Gửi QL duyệt {n} ngày · quá hạn tự thu hồi · bậc tính lại', { n: o.soNgay }),
    chiTiet: t('Quá {n} ngày QL chưa duyệt: thu hồi theo bạn. TVV đã báo PH thì nhận việc báo lại.', { n: o.soNgay }),
  };

/** Q51 (luat/3 Y-12, việc khai_bac): Xác nhận cấp bậc HV cũ (một em hoặc cả lớp). */
export const quyCheKhaiBac = (): QuyChe => ({ chu: t('Khai một lần cho chuỗi này · quá 14 ngày việc tự hết') });

/** Q53 / Q54 / Q55 (luat/2 C-21, mục 4; luat/3 Y-19): GVCN › Phối hợp SOS theo lựa chọn. */
export const quyChePhoiHopSos = (chon: 'xac-nhan' | 'meeting' | 'bo', han: string | null): QuyChe => ({
  chu: chon === 'bo' ? t('Bỏ: chọn lý do · em rời dòng')
    : chon === 'meeting' ? (han ? t('Meeting: hạn {han} · xác nhận xong TVV nhận việc báo PH', { han }) : t('Meeting: xác nhận xong TVV nhận việc báo PH'))
    : t('Ghi ngày làm + nội dung · em rời dòng'),
});

/** Q62 (luat/2 việc phoi_hop_tvv): TVV › Báo PH sau Meeting CX/GĐCN. */
export const quyChePhoiHopTvv = (han: string | null): QuyChe => ({
  chu: han ? t('Hạn {han} (5 ngày từ ngày GVCN xác nhận) · GV đọc được nội dung', { han }) : t('Hạn 5 ngày từ ngày GVCN xác nhận · GV đọc được nội dung'),
});

/** Q56 (luat/3 Y-20): GVCN › Báo PH kết quả Test (lớp thường). */
export const quyCheBaoPhTest = (): QuyChe => ({ chu: t('Không hạn · đánh dấu khi đã báo PH') });

/** Q60 / Q61 (luat/3 Y-14, Y-15; mục 6.3): TVV › Báo PH (vi phạm · tình hình) theo kết quả đang chọn. */
export const quyCheBaoPhTvv = (chuaLienHe: boolean, han: string | null): QuyChe => chuaLienHe
  ? { chu: han ? t('Chưa liên hệ được: việc còn mở · thử lại trước {han}', { han }) : t('Chưa liên hệ được: việc còn mở, hạn giữ') }
  : { chu: han ? t('Hạn {han} · GV của lớp đọc được nội dung', { han }) : t('GV của lớp đọc được nội dung') };

/** Q64 (luat/4 L-19): TVV › Chốt ngày thi. "Dời tháng dự kiến" không có trong bảng — câu suy từ đường lưu `chuyen-thang`. */
export const quyCheChotNgayThi = (doiThang: boolean): QuyChe => ({
  chu: doiThang ? t('Không hạn · lưu xong lịch thi giữ Dự kiến tháng mới') : t('Không hạn · lưu xong lịch thi thành Đã chốt ngày'),
});

/** Q65 (luat/3 mục 3 thi_that; luat/4 L-20): TVV › Cập nhật kết quả thi thật. */
export const quyCheKqThiThat = (): QuyChe => ({ chu: t('Đủ 4 kỹ năng hoặc Không thi · lưu xong bạn chọn Bước tiếp') });

/** Q66 (luat/4 L-21): Chọn bước tiếp › Lộ trình mới. */
export const quyCheLoTrinhMoi = (): QuyChe => ({ chu: t('Lộ trình mới: Target giữ, đầu vào = KQ thi thật, Case cũ đóng') });

/** Q67 (luat/4 L-09, L-21): Chọn bước tiếp › Tạm dừng / Kết thúc học — hạn của việc Bước tiếp. */
export const quyCheDungHoc = (han: string | null): QuyChe => ({ chu: han ? t('Em vào Lưu trữ · hạn {han}', { han }) : t('Em vào Lưu trữ') });

/** Q68 (luat/3 mục 3 bo_sung_ho_so): TVV › Bổ sung hồ sơ thiếu. */
export const quyCheBoSungHoSo = (): QuyChe => ({ chu: t('Không hạn · đủ Ngày sinh, Email, Tuần bắt đầu, Target là xong') });
