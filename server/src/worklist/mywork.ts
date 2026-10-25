import { phamViXemViec } from './xemViec.ts';
import { caseChuaCoNguoi } from '../cases/owner.ts';
import { db, theoLo } from '../db.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import {
  ATTEMPT_KIND_SHORT, CHAM_CHEO, KHOA_CHAM_SPEAKING, VIEC_CHAM_CHEO, chuViecChotLoTrinh, daiDienNhomBoTro, canChamCheo, khoiCham, laChamCheo, laViecChamCheo, mondayOfDate,
  INTERVENTION_KIND_LABEL, PERMISSIONS,
  SOS_LABEL, URGENCY_LABEL, URGENCY_TONE, caseHeadline, caseTopicLabel, cycleDeadline,
  duongCaseRieng, duongHoSoHocVien, duongLichTest, nhanDotNgan, hanThemPa,
  khungCua, laLanGhiCuoi, ghiNhanhDuoc, tenMon, tenNhomMon, REGULAR_SKILLS, nhanLoaiXuLy, soSanhLop,
  type Khung, type AttemptKind, type InterventionKind, nhanBaiThuong, chuTyLeXetLai, gopViecTheoLop, tuanLich, demViec, nhomViecCua, type ConGop } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, forbidden } from '../util.ts';
import { COT_PRINCIPAL, activeAt, bangLop, can, editableSkills, isCoreTeacherOf, loadPrincipal, lopFtChoGvSpeaking, napTruocPhamVi, principalTuDong, scopeFor, teachesClass, type Principal } from '../permissions.ts';
import { phamViHoSoGv } from '../giaoVien/phamVi.ts';
import { allProgrammes } from '../normal/regular.ts';
import { attemptHref, listAttempts } from '../fasttrack/attempts.ts';
import { viecBanGiao } from '../classes/banGiao.ts';
import { lopChoChotLoTrinh } from '../classes/lenhChuyen.ts';
import { canSeeBoard, myMgmtTasks } from './mgmttasks.ts';
import { CASE_THAT, CHO_DOI_PA, CO_THE_KHONG_THEO_DOI, LA_CASE_SOS, NOT_UNCONFIRMED_PRESET, UNCONFIRMED_PRESET, sosCaseStateMany } from '../cases/sosState.ts';
import { quyenBoTro } from '../cases/boTro.ts';
import { boKetQuaChoMiniTest, emXetLaiLoTrinh, nguoiGiuMiniTest, tyLeTongLo } from '../normal/cuoiKhoa.ts';
import { dongPhoiHopLop, myCoordinationLines } from '../yThuc/phoiHop.ts';
import { lopKyVong } from '../normal/kyVong.ts';
import { phanCongDangHieuLuc } from './scoreDebt.ts';
import { nguoiGiuKetQua } from '../cases/giuKetQua.ts';
import { dienMocQuyChe } from '../cases/sosAuto.ts';
import { ctxSuaCaseNhieu, laGvcnLopDangHoc } from '../cases/cases.ts';
import { sweepExpiredMoves } from '../fasttrack/absence.ts';
import { quetYeuCau } from '../duyet/yeuCau.ts';
import { mtLichSuChuaNhap } from '../cham/canCham.ts';
import { trangThaiYThuc, ungVienVaThe } from '../yThuc/trangThai.ts';
import { viecThiThat } from '../loTrinh/thiThat.ts';
import { viecBuocTiep } from '../loTrinh/buocTiep.ts';
import { viecHoSoTvv } from './viecTvv.ts';
import { khaiDuoc } from '../yThuc/xuLy.ts';
import { viecBaoPhCuaToi } from '../yThuc/baoPhTvv.ts';

/**
 * VIỆC CỦA CHÍNH NGƯỜI ĐANG XEM.
 *
 * Màn chính cũ là một bảng số theo tuần, và giáo viên với quản lý mở ra thấy Y HỆT NHAU —
 * cùng bốn ô số, cùng một danh sách. Tệ hơn, danh sách đó liệt kê cả những việc người xem
 * KHÔNG CÓ QUYỀN LÀM: giáo viên được bảo "cập nhật ngày MT thực tế", trong khi quyền đó
 * thuộc về Admin chi nhánh.
 *
 * Ở đây đảo lại: mỗi dòng là MỘT HỌC VIÊN, một câu lý do, và một nút mà chính người đang
 * xem bấm được. Việc nào người xem không làm được thì không xuất hiện — không phải ẩn nút
 * đi mà là không đưa vào danh sách ngay từ đầu.
 *
 * Ba quy tắc:
 *   1. Chỉ đưa vào việc mà người xem THỰC SỰ làm được, kiểm bằng đúng quyền đó.
 *   2. Nhóm theo LOẠI VIỆC, nhưng việc quá hạn hoặc tới hạn hôm nay TÁCH RA lên đầu —
 *      gấp thì phải thấy trước, không để lẫn giữa nhóm.
 *   3. Mỗi dòng chỉ một hành động. Không có dòng nào bắt người đọc tự đoán phải làm gì.
 */

export type WorkUrgency = 'overdue' | 'today' | 'normal';

export type WorkItem = {
  key: string;
  group: WorkGroupKey;
  urgency: WorkUrgency;
  studentId: number | null;
  studentName: string;
  classId: number | null;
  classCode: string | null;
  attemptId: number | null;
  attemptNo: number | null;
  caseId: number | null;
  /** Nhãn MỨC ĐỘ của học viên — chỉ có ở việc liên quan tới một vấn đề đang mở. */
  level: { tone: 'ok' | 'info' | 'warn' | 'danger' | 'neutral'; text: string } | null;
  reason: string;
  /** Nút động từ ngắn: "Nhập điểm", "Thêm PA", "Ghi kết quả". */
  actionLabel: string;
  /**
   * TIÊU ĐỀ DÒNG (PR-UX0, B-2): động từ + đối tượng — "Nhập điểm L, R", "Ghi kết quả PA Reading". Việc cần làm là
   * tiêu đề, không nằm trong badge. Quá hạn KHÔNG có nhãn riêng: `urgency` + `due` đủ để giao diện nối "⚠ quá hạn n ngày" sau hạn.
   */
  tieuDe: string;
  /** PR-DON: phần riêng của việc trong dòng gộp (`ViecGopDuoc.phu`) — dòng phụ của em, không cắt từ tiêu đề. */
  phu?: string | null;
  href: string;
  /*
   * NĂM Ô CỦA MỘT DÒNG VIỆC (mục 5.3): học viên/lớp · việc cần làm · người phụ trách · hạn ·
   * trạng thái. Trước vòng 5 ba ô sau nằm lẫn trong câu lý do, nên muốn biết "ai đang giữ
   * việc này" hay "hạn hôm nào" thì phải đọc cả câu — và không lọc theo chúng được.
   */
  ownerId: number | null;
  owner: string | null;
  /** Người đang xem CHÍNH LÀ người phụ trách việc này. */
  mine: boolean;
  /** MH4, K1-30: khung của lớp (Fast Track / Lớp thường). `null` = việc không gắn lớp → hiện ở mọi khung. */
  khung?: Khung | null;
  due: string | null;
  statusLabel: string;
  /**
   * BÀI/CASE LIÊN QUAN — ô thứ hai của một dòng việc (mục 3.3).
   *
   * "Nói rõ MT/Test nào" là yêu cầu nguyên văn: một dòng chỉ ghi "nhập điểm Reading" mà
   * không nói của bài nào thì người nhận phải mở ra mới biết mình đang được nhắc chuyện gì.
   */
  contextLabel: string | null;
  /**
   * SỐ HỌC VIÊN trong một dòng việc gom (mục 2.2 · 3.3).
   *
   * Một dòng nhập điểm cho sáu em là MỘT nhóm việc và SÁU học viên cần nhập — hai đơn vị
   * khác nhau, nên số em đi kèm dòng chứ không biến thành sáu dòng riêng.
   */
  count: number | null;
  /** PR-GOP: Case sinh từ SOS — ở lớp FT giữ từng dòng; Case GV/QL tự tạo thì gộp theo lớp (chủ sản phẩm 08/10). */
  caseSos?: boolean;
  /** CV-LOI (A13): Case chưa có người phụ trách vì lớp thiếu GV môn (`mon` = kỹ năng) hoặc thiếu GVCN (`mon` null) — panel Phân công đúng ô đó. */
  thieuNguoi?: { mon: string | null };
  /** PR-GOP (§5): dòng gộp "Loại việc · lớp · n em" — các việc thật của dòng (khoá, nút, hạn riêng). Chỉ có ở `dong`. */
  con?: ConGop<WorkItem>[];
  /** OV-5a (panel Công việc): PA của việc — Kết quả PA, Xác nhận PA, Ghi Mini Test mở đúng PA trong Ngăn Case. */
  paId?: number | null;
  /** OV-13b: Kết quả PA ghi nhanh được ngay dưới dòng (`ghiNhanhDuoc`). */
  ghiNhanh?: boolean;
  /** OV-5a: Nhập điểm mở panel một lớp · một lượt (`mt:2`, `thuong:progress`) · kỹ năng đầu tiên của dòng. */
  luot?: string;
  kn?: string;
  /** OV-15b: mọi kỹ năng của việc Nhập điểm (`kn` là kỹ năng đầu) — panel việc chỉ hiện các cột này. */
  kns?: string[];
  /** Nhập điểm: kỹ năng có ô quá hạn (≤ `kns`) — `viecQuaHan` đếm theo đây, không theo cả dòng (nợ #528). */
  knsQuaHan?: string[];
  /** OV-5a: số bài của dòng Nhập điểm (một kỹ năng của một em) — dòng phạm vi "m bài cần chấm". */
  soBai?: number;
  /** OV-11c (CV-1): id các em của việc cả lớp (`studentId` null) — dòng phạm vi đếm em KHÁC NHAU, không cộng dồn `count`. */
  emIds?: number[];
  /** OV-13c (Q4): thứ Hai tuần thi của lượt (Case SOS FT · Nhập điểm) · mức SOS 1/2/3 của Case — khoá dòng gộp (`gopViec.ts`). */
  tuanThi?: string | null; sos?: number | null;
  /** OV-13c: Nhập điểm — tuần thi (lưới Lịch Test `LuoiNhung`) + loại bài. */
  periodId?: number | null; kind?: string | null;
  /** OV-13c: Xác nhận PA — loại PA, nội dung máy gán, người dạy đã có (người chung không đè). */
  pa?: { kind: string; moTa: string | null; nguoiId: number | null; nguoi: string | null; soBuoi: number | null };
  /** SV-YT-TVV: id việc Báo PH (`viec_bao_ph`) — form ghi kết quả gửi đúng việc. */
  viecId?: number;
  /** UI-CV-TVV: số lần đã ghi "Chưa liên hệ được" của việc Báo PH đang mở — dòng "⚠ Chưa liên hệ được · lần n". */
  soLanThu?: number;
  /** V5 SV-SO1: việc của người khác mà người xem làm thay được (`lamThayDuoc`) — chỉ có khi xem người khác ("Của GV", "Tất cả"). */
  lamThay?: boolean;
};

/**
 * CHÍN LOẠI VIỆC, BA LOẠI ĐẦU LÀ HỌC THUẬT (mục 3.2).
 *
 * Ba nhóm học thuật chính — nhập điểm, thiếu phương án, cập nhật kết quả — là phần lớn việc
 * hằng ngày của giáo viên. Quản lý có thêm "Chờ tôi xử lý". Những nhóm còn lại ít gặp hơn
 * nhưng KHÔNG được bỏ: giấu một nghĩa vụ đi chỉ vì nó không thuộc ba nhóm chính là cách chắc
 * chắn nhất để nó không bao giờ được làm.
 */
export type WorkGroupKey =
  /* OV-12c: `cause` = "Xác nhận Case" Progress lớp thường; `ghi_nhan_xet` = Case MT cũ mà ô chưa có nhận xét (nguyên nhân Case MT = nhận xét). */
  | 'cause' | 'ghi_nhan_xet' | 'xac_nhan_pa' | 'phoi_hop' | 'mini_test' | 'score' | 'no_plan' | 'ghi_ket_qua_pa'
  | 'no_owner' | 'missing_data' | 'mgmt'
  /* PR-VAI-a: Phối hợp SOS là việc thật (K5-10); khai bậc Ý thức HS cũ (K1-15); kỳ vọng đầu ra (K5-11). */
  | 'phoi_hop_sos' | 'khai_bac' | 'ky_vong_dau_ra'
  /* PR-TK (TK-K): GVCN cập nhật kết quả thi thật (L R W S) của em FT đã qua mốc thi. */
  | 'thi_that'
  /* OV-8a: Quản lý chọn bước tiếp sau khi lộ trình FT có kết quả thi thật (Kết thúc · Học tiếp lộ trình mới · Học lại). */
  | 'buoc_tiep'
  /* PR-YT4 (K5 §3 dòng 6–8): việc Ý thức THẬT có hạn — thay nhắc mềm W01–W06. */
  | 'yt_xu_ly' | 'yt_xem' | 'yt_thuc_hien'
  /* PR-CT (Q30-2): bàn giao khi có quyết định chuyển lớp — một việc mỗi lớp (GVCN), mỗi (lớp, môn) (GVBM). */
  | 'ban_giao'
  /* PR-MT0 (T5b) → PR-LCb: "Chốt lộ trình" — Quản lý xác nhận hướng + lớp chuyển đến cho mọi em lớp thường (khoá giữ tên cũ `chot_len_ft`). */
  | 'chot_len_ft'
  /* PR-CL (B5): "Xét lại lộ trình" — em đã chuyển lớp cuối khoá mà Final không phù hợp lộ trình đã chốt (một việc mỗi lớp nguồn, Quản lý). */
  | 'xet_lai_lo_trinh'
  /* OV-13k: GV phụ trách Speaking xem nhận xét của người chấm chéo (ghi thêm nhận xét / sửa nhóm / Xác nhận PA). */
  | 'xem_nx_s'
  /* SV-TVV-VIEC (Q-D4 ①): TVV bổ sung 4 trường hồ sơ còn thiếu — một dòng tổng, không hạn. */
  | 'bo_sung_ho_so'
  /* SV-YT-TVV (luật 1–2): TVV của em (không có → QL chi nhánh) báo PH sau mỗi lần lưu xử lý vi phạm — hạn ngày lưu + 4. */
  | 'bao_ph_yt';

/**
 * Mỗi nhóm có MỘT DÒNG nói rõ nhóm đó nghĩa là gì.
 *
 * Nhãn cộc lốc kiểu "Ghi kết quả" bắt người đọc tự đoán chuyện gì đã xảy ra và mình phải
 * làm gì. Một dòng giải thích ở đầu nhóm rẻ hơn nhiều so với việc mỗi người tự hiểu một kiểu.
 */
const GROUP_META: Record<WorkGroupKey, { label: string; hint: string }> = {
  /*
   * XÁC ĐỊNH NGUYÊN NHÂN (rulebook v3, S04) — Case tự tạo từ Mock Test FT và từ Giữa khoá lớp thường (PR-LT2a).
   *
   * Mock FT nay TỰ TẠO Case cho kỹ năng trượt kèm phương án điền sẵn, nên không còn tín hiệu nào để "xác minh". Việc còn lại của GVBM đúng kỹ năng có
   * đúng hạn ba ngày: xác định nguyên nhân, hoặc đóng `Không cần theo dõi`. PA theo quy chế đã tự chạy từ lúc tạo (PR-N1, S4-1) — không còn vế
   * "xác nhận PA gợi ý". Không có dòng này thì hạn ba ngày vô hình.
   */
  cause: {
    label: 'Xác nhận Case',
    hint: 'Progress Test đã tự tạo Case cho môn này. Chọn nhóm nguyên nhân, ghi mô tả ngắn, xem PA Bổ trợ rồi Xác nhận Case — '
      + 'hoặc Không cần theo dõi (gửi Quản lý duyệt). Hạn 5 ngày, tính cả ngày Case ra đời.',
  },
  /* OV-12c: Case MT cũ (trước luật nhận xét bắt buộc) mà ô chưa có nhận xét — ghi nhận xét + nhóm ở hộp chấm, Case tự sang Xác nhận PA. */
  ghi_nhan_xet: {
    label: 'Ghi nhận xét',
    hint: 'Nguyên nhân Case Mock Test là nhận xét của bài. Ghi nhận xét và nhóm nguyên nhân — lưu xong Case sang Xác nhận PA.',
  },
  /* PR-SOS (§3.1d) → OV-12c: Case MT có nguyên nhân từ nhận xét — PA theo quy chế chờ xác nhận, chưa chạy tới khi bấm Xác nhận PA. */
  xac_nhan_pa: {
    label: 'Xác nhận PA',
    hint: 'Nguyên nhân đã có từ nhận xét Mock Test — xác nhận PA theo quy chế để PA bắt đầu, hoặc Không cần theo dõi (gửi Quản lý duyệt).',
  },
  /* OV-13k (chủ SP 15/10): người chấm chéo đã lưu bài Speaking có nhận xét — GV phụ trách S của lớp xem; không hạn, không đỏ. */
  xem_nx_s: {
    label: 'Xác nhận Case Speaking',
    hint: 'Người chấm chéo đã ghi nhận xét bài Speaking của em có Case. Dùng nhận xét đó làm mô tả Case, giữ mô tả đang có hoặc viết mô tả khác — hạn = hạn SOS.',
  },
  /* PR-LT2a (N3, T45): GVCN báo phụ huynh qua TVV — không hạn (M-05). */
  phoi_hop: {
    label: 'Báo phụ huynh qua TVV',
    hint: 'Nhờ TVV báo phụ huynh (4 nội dung), xong thì đánh dấu đã làm.',
  },

  /* PR-VAI-a (K5-10, Q14): Phối hợp SOS của GVCN là VIỆC THẬT — một dòng mỗi lớp chủ nhiệm, không hạn (P10). */
  phoi_hop_sos: {
    label: 'Phối hợp SOS',
    hint: 'Lượt Mock Test có SOS của lớp bạn chủ nhiệm còn việc phối hợp chưa xong. Không có hạn — làm xong từng việc thì dòng tự hết.',
  },
  /* PR-VAI-a (K1-15, Q15): em cũ mới vào web (14 ngày) mà chưa khai bậc Ý thức trước khi dùng web. */
  khai_bac: {
    label: 'Xác nhận cấp bậc vi phạm HV cũ',
    hint: 'Em đã học ở trung tâm trước khi có web — xác nhận cấp bậc vi phạm đã có để thang tính tiếp đúng. Không có hạn; qua 14 ngày thì thôi nhắc.',
  },
  /* PR-VAI-a (K5-11): em BE/ELE lên Fast Track — Quản lý đánh dấu Đạt / Không đạt kỳ vọng đầu ra. */
  /* N22 ② (P9b): tên "Kỳ vọng" (Kết quả đầu ra lớp thường là cột máy ghi ở trang Cuối khoá). Tiêu đề Case "Kỳ vọng đầu ra…" giữ (chống trùng `LIKE`). */
  ky_vong_dau_ra: {
    label: 'Kỳ vọng',
    hint: 'Lớp FOU/BE/ELE có em lên FT có MT0 đủ 3 kỹ năng có điểm — Đạt khi Overall MT0 > 3.5 (FOU) / ≥ 4.0 (BE) / ≥ 4.5 (ELE). Một lần lưu cho cả lớp.',
  },

  /* PR-TK → SV-TVV-VIEC (21/10-TVV): TVV của em (không có → QL chi nhánh) nhập kết quả thi thật — KHÔNG hạn. */
  thi_that: {
    label: 'Cập nhật kết quả thi thật',
    hint: 'Em Fast Track đã qua kỳ thi — nhập điểm L, R, W, S em báo về hoặc chọn Không thi. Không tính thời gian.',
  },
  /* OV-8a → SV-TVV-VIEC: TVV của em giữ; hạn = muộn hơn của (ngày thi + 7, ngày có kết quả + 7), đỏ không chặn. */
  buoc_tiep: {
    label: 'Chọn bước tiếp',
    hint: 'Em Fast Track đã có kết quả thi thật — chọn Lộ trình mới, Tạm dừng hoặc Thôi học. Hạn 7 ngày kể từ ngày có kết quả.',
  },
  bo_sung_ho_so: {
    label: 'Bổ sung hồ sơ thiếu',
    hint: 'Học viên của bạn còn thiếu Ngày sinh, Email, Tuần bắt đầu hoặc Target (FT). Không tính thời gian.',
  },
  /* PR-LT2b (M-05, T47): Mini Test sau bổ trợ miễn phí — hạn = ngày buổi cuối + 2. */
  mini_test: {
    label: 'Ghi Mini Test',
    hint: 'Em đã học bổ trợ miễn phí xong — ghi % và ngày làm Mini Test. Từ 70% thì Case tự hoàn thành, dưới 70% Quản lý được báo.',
  },

  /* ---------------------------------------------------- ba nhóm học thuật chính (mục 3.2) */
  score: {
    label: 'Nhập điểm',
    hint: 'Học viên đã làm bài rồi mà kỹ năng này chưa có điểm. Các em cùng lớp, cùng bài, cùng kỹ năng gom thành một dòng để nhập một lượt.',
  },
  no_plan: {
    label: 'Thiếu PA học thuật',
    hint: 'Vấn đề đã mở nhưng chưa ai ghi sẽ làm gì cho em.',
  },
  ghi_ket_qua_pa: {
    label: 'Kết quả PA',
    hint: 'Kết quả PA ghi hai tuần một lần, xong trước hết Thứ Ba sau kỳ (kỳ tính từ ngày bắt đầu PA). Kỳ chạm mốc PA là Kết quả cuối: kết luận PA.',
  },

  /* --------------------------------------------- những nghĩa vụ khác, vẫn phải thấy được */
  no_owner: {
    label: 'Chưa có người phụ trách',
    hint: 'Lớp chưa có GV dạy môn của Case (hoặc chưa có GVCN). Phân công xong thì Case tự về người đó.',
  },
  /* PR-LCb: khoá `chot_len_ft` = "Chốt lộ trình" (giữ tên để không chạm drilldown, nhắc việc, phép kiểm cũ). */
  chot_len_ft: {
    label: 'Chốt lộ trình',
    hint: 'Quản lý chốt hướng và lớp chuyển đến cho mọi em, hạn thứ Năm tuần trước tuần Final Test. Quá hạn vẫn làm được.',
  },
  xet_lai_lo_trinh: {
    label: 'Xét lại lộ trình',
    hint: 'Em đã chuyển lớp mà Final Test không phù hợp lộ trình đã chốt (lên mà dưới 50%, học lại mà từ 70%). Chỉ gợi ý xét lại, không bắt buộc đổi.',
  },
  missing_data: {
    label: 'Thiếu dữ liệu đánh giá',
    hint: 'Thiếu những thông tin mà không có thì không đánh giá hay lên kế hoạch được: bài chưa xếp vào tuần nào, học viên FT chưa có Target, MT cũ chưa nhập (không tính hạn).',
  },
  /* ---------------------------------------------------- Ý thức (PR-YT4, V4-2…V4-5, K3-37) — người nhận = GVCN lớp đang học */
  yt_xu_ly: {
    label: 'Xử lý vi phạm',
    hint: 'Em có 3 vi phạm trở lên trong tuần này + tuần trước — phải Xác nhận xử lý trong 5 ngày (tính cả ngày ghi). Quá hạn thì Quản lý được báo.',
  },
  yt_xem: {
    label: 'Ghi nhận vi phạm mới',
    hint: 'Vi phạm do người khác ghi mà bạn chưa xem. Ghi nhận (đã xem, không cần xử lý) hoặc Xác nhận xử lý trong 5 ngày.',
  },
  bao_ph_yt: {
    label: 'Báo PH vi phạm',
    hint: 'Em vừa được lưu xử lý vi phạm — báo phụ huynh rồi ghi kết quả (Đã báo PH / Chưa liên hệ được). Hạn 5 ngày, tính cả ngày lưu.',
  },
  yt_thuc_hien: {
    label: 'Ghi "Đã thực hiện"',
    hint: 'Quản lý đã duyệt đề xuất — ghi ngày đã thực hiện trong 5 ngày kể từ ngày duyệt.',
  },
  ban_giao: {
    label: 'Bàn giao',
    hint: 'Lớp có quyết định chuyển lớp: GVBM ghi một câu mỗi em cho môn mình (2 ngày), GVCN gom lại, viết nhận xét chung rồi GVCN xác nhận bàn giao (3 ngày, tính cả ngày ra quyết định). Quá hạn thì Quản lý được báo — em vẫn chuyển đúng tuần.',
  },
  mgmt: {
    label: 'Việc được giao',
    hint: 'Công việc quản lý hoặc việc con được giao cho bạn ở bảng Tiến độ công việc.',
  },
};

/**
 * Hạn xử lý một vấn đề suy thẳng từ mức độ ưu tiên: 7 · 5 · 3 ngày (owner chốt 10/09/2026).
 * Dùng chung một bảng với hạn Quản lý trả lời đề xuất — hai con số nói cùng một chuyện.
 */

function sosTone(level: number | null): 'ok' | 'info' | 'warn' | 'danger' {
  if (level === null) return 'info';
  return level === 0 ? 'ok' : level === 1 ? 'info' : level === 2 ? 'warn' : 'danger';
}

/**
 * Nhãn MỨC ĐỘ của em, lấy từ case: SOS 1/2/3 nếu vấn đề sinh ra từ một bài đánh giá,
 * còn giáo viên tự báo thì chưa có bài nên chỉ có mức độ gấp.
 */
export function levelOf(c: { sos_level: number | null; urgency: string | null }): WorkItem['level'] {
  if (c.sos_level !== null) return { tone: sosTone(c.sos_level), text: SOS_LABEL[c.sos_level as 0 | 1 | 2 | 3] };
  if (c.urgency && c.urgency !== 'normal') {
    return {
      tone: URGENCY_TONE[c.urgency] === 'danger' ? 'danger' : 'neutral',   // UX-G G2: "Bình thường" không tô vàng
      text: URGENCY_LABEL[c.urgency as keyof typeof URGENCY_LABEL],
    };
  }
  return null;
}

function urgencyOf(date: string | null, today: string): WorkUrgency {
  if (!date) return 'normal';
  if (date < today) return 'overdue';
  if (date === today) return 'today';
  return 'normal';
}

/** Đuôi tiêu đề: " Reading" hay "" khi Case không có kỹ năng. `ct` = chương trình lớp (FOU "Grammar + Vocabulary"). */
const duoiKyNang = (topic: string | null | undefined, ct: string | null) => (topic ? ` ${caseTopicLabel(topic, ct)}` : '');

/**
 * Nhãn đợt (mockup 17 #13): bài không phải Mock thì gọi đúng tên ("Giữa khoá", "Cuối khoá"), Mock thì "MT{n}" —
 * lớp thường không còn hiện "MT1".
 */
function nhanDot(kind: string | null | undefined, no: number | null | undefined, macDinh = 'Case'): string {
  return nhanDotNgan(kind, no) ?? macDinh;
}

/**
 * `chiNhom` (PR-NV, NV-2): chỉ dựng các nhóm trong tập — Admin (`cham-diem`) chỉ nhóm Chấm điểm.
 * Kết quả = đúng các dòng của `myWork(p)` thuộc nhóm đó (phép kiểm NV-2). Không truyền thì y hệt trước.
 */
export function myWork(p: Principal, f: { branchId?: number | null; nguoi?: 'toi' | 'tat-ca'; chiNhom?: ReadonlySet<WorkGroupKey> } = {}) {
  const today = demoToday();
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  /* OV-14c: GV Speaking không phân công (GV nước ngoài) vẫn có việc Chấm Speaking. */
  if (scope.none && !lopFtChoGvSpeaking(p, today).length) return { summary: demSo([], []), groups: [], scopeEmpty: true, xemNguoiKhac: false };
  /* PR-OV2a: Admin chỉ có nhóm Chấm điểm (của mình và của GV trong phạm vi, để Nhắc). */
  const xemViec = phamViXemViec(p);
  if (xemViec === 'cham-diem') f = { ...f, chiNhom: new Set<WorkGroupKey>(['score']) };

  const conn = db();
  quetYeuCau(today);   // PR-DUYET (K5-17): thẻ chết tự đóng, Báo QL tự tạo — một lần mỗi request
  const items: WorkItem[] = [];
  const co = (...g: WorkGroupKey[]) => !f.chiNhom || g.some((x) => f.chiNhom!.has(x));
  /*
   * Chương trình + cách chấm của MỌI lớp, nạp lười (MH2 tên môn, MH4 khung) — dùng lại bảng lớp và bảng chương trình
   * đã nhớ trong request (`bangLop`, `allProgrammes`), không thêm câu SQL. ponytail: cả bảng lớp (vài trăm dòng).
   */
  let lopMap: Map<number, { ct: string | null; mode: string | null }> | null = null;
  const lopCua = (classId: number | null | undefined) => {
    if (!lopMap) {
      lopMap = new Map();
      const programmes = allProgrammes();
      for (const [id, l] of bangLop()) lopMap.set(id, { ct: l.ct, mode: l.ct ? programmes.get(l.ct)?.scoringMode ?? null : null });
    }
    return classId ? lopMap.get(classId) ?? null : null;
  };
  const ctCua = (classId: number | null | undefined) => lopCua(classId)?.ct ?? null;
  /*
   * PR-Ra: "Tất cả trong phạm vi" (Q1) — chỉ người xem được người khác (Quản lý/Quản trị) mới
   * có chế độ này; GV luôn chỉ thấy việc của mình dù có gửi `nguoi=tat-ca` lên (chặn ở route).
   */
  const xemNguoiKhac = xemViec !== null;
  const tatCa = f.nguoi === 'tat-ca' && xemNguoiKhac;
  /* PR-UXF-a T65: em Tạm dừng không sinh việc nhập điểm. */
  /*
   * TD4: Công việc chỉ đọc lượt CÓ THỂ còn ô cần chấm (`chiConO`) + lượt chưa xếp tuần (Chốt tuần MT) — trước đọc mọi lượt trong phạm vi.
   * "Tất cả" đọc MỘT lần ở phạm vi quản lý: `myPendingDetail` (việc của mình) không phụ thuộc `scope`, `pendingDetail` (việc GV khác) theo nó.
   */
  /*
   * OV-13g (Q7): GV Speaking chấm S Mock chéo lớp FT cùng chi nhánh (`lopFtChoGvSpeaking`) — đọc các lớp đó trong CÙNG lần `listAttempts`
   * (`phamViCham`, như Lịch Test), không thêm lô. `managed` để `pendingDetail` có ô S Mock (không là việc của ai — T18).
   */
  const lopCheo = new Set<number>(!tatCa && co('score') ? lopFtChoGvSpeaking(p, today) : []);
  const attempts = !co('score', 'missing_data') ? [] : listAttempts(p, {
    branchId: f.branchId ?? undefined, chiDangHoc: true, chiConO: true, kemChuaTuan: true,
    ...((tatCa && co('score')) || lopCheo.size ? { scope: 'managed' as const } : {}), ...(lopCheo.size ? { phamViCham: true } : {}),
  }).rows.filter((a: any) => a.status !== 'cancelled');
  /*
   * OV-11c (CV-8, Q6): "Của GV" có cả việc của GVCN (Phối hợp SOS, Điền Target, Nhập điểm MT cũ) — như "Của một GV" (`viecCuaNguoi`). GVCN đang hiệu lực
   * của mỗi lớp trong phạm vi Quản lý, MỘT câu (nạp lười, chỉ khi cần).
   */
  let gvcnMap: Map<number, number> | null = null;
  const gvcnLop = (): Map<number, number> => {
    if (gvcnMap) return gvcnMap;
    gvcnMap = new Map();
    for (const r of conn.prepare(
      `SELECT ta.class_id, ta.user_id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
        WHERE ta.is_core = 1 AND ta.status = 'active' AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
          AND c.status = 'active' AND (? IS NULL OR c.branch_id = ?) ORDER BY ta.id`,
    ).all(today, today, f.branchId ?? null, f.branchId ?? null) as any[]) {
      if (!gvcnMap.has(r.class_id) && can(p, PERMISSIONS.CASE_APPROVE, { classId: r.class_id })) gvcnMap.set(r.class_id, r.user_id);
    }
    return gvcnMap;
  };

  // ---------------------------------------------------------------- 1. nhập điểm
  /*
   * GOM THEO LỚP · BÀI · KỸ NĂNG (mục 3.3).
   *
   * Trước đây mỗi học viên còn thiếu điểm là một dòng, nên một lớp mười hai em chưa nhập
   * Reading sinh ra mười hai dòng giống hệt nhau, đẩy mọi việc khác xuống dưới — trong khi
   * người nhập chỉ mở MỘT bảng điểm và gõ một lượt.
   *
   * Nay một dòng là một NHÓM VIỆC: "CP FT 110 · MT2 · Nhập điểm R cho 6 học viên". Số em là
   * thông tin của dòng, không phải số dòng (mục 2.2).
   *
   * Hạn của nhóm lấy hạn SỚM NHẤT trong nhóm — nhóm quá hạn khi có bất kỳ em nào quá hạn.
   */
  type ScoreBucket = {
    classId: number | null; classCode: string | null; attemptNo: number | null;
    kind: string | null; testLabel: string; skill: string; skillLabel: string;
    students: Map<number, string>; due: string | null; href: string; attemptId: number; ownerId: number | null;
    /** PR-S6F-a Q6: có ô quá hạn theo cờ ô (`quaHanNhapDiem`) — không so hạn trơn. */
    quaHan: boolean;
    /** OV-13c: tuần thi của môn (lưới Lịch Test). */
    periodId: number | null; weekStart: string | null;
  };
  type BaiChuaCham = {
    classId: number | null; classCode: string | null; attemptNo: number | null; kind: string | null;
    attemptId: number; studentId: number; studentName: string;
    skill: string; deadline: string | null; ownerId: number | null; overdue: boolean; periodId: number | null; weekStart: string | null;
  };
  /*
   * PR-Ra Q1: tách phần gom thành một hàm dùng chung cho "việc của mình" (ownerId luôn là
   * chính người xem) và "việc của người khác trong phạm vi" (ownerId theo `teacher_assignments`).
   * KHOÁ mỗi dòng kèm hậu tố người phụ trách (`|u…`) — để cùng một khoá dù nhìn từ Quản lý hay
   * từ chính giáo viên (nút Nhắc dựa vào khoá này để tìm lại đúng dòng).
   */
  const gomBaiChuaCham = (dongs: BaiChuaCham[]): WorkItem[] => {
    const buckets = new Map<string, ScoreBucket>();
    for (const d of dongs) {
      const testLabel = d.kind && d.kind !== 'mock'
        ? (ATTEMPT_KIND_SHORT[d.kind as AttemptKind] ?? 'Bài kiểm tra')
        : `MT${d.attemptNo}`;
      const skillLabel = tenMon(ctCua(d.classId), d.skill);
      /* OV-11c (TQ-1, TE-4): khoá có hạn + cờ quá hạn — bài quá hạn và bài chưa quá hạn (em thi bù tuần này) không chung một việc. */
      const k = `${d.classId ?? 0}|${d.kind ?? 'mock'}|${d.attemptNo ?? 0}|${d.skill}|u${d.ownerId ?? 0}|${d.deadline ?? ''}|${d.overdue ? 'q' : ''}`;
      let b = buckets.get(k);
      if (!b) {
        b = {
          classId: d.classId, classCode: d.classCode, attemptNo: d.attemptNo,
          kind: d.kind, testLabel, skill: d.skill, skillLabel,
          /* PR-UX1 Q13: bấm Chấm mở Lịch Test đúng lớp, con trỏ vào môn này; bài không có lớp giữ hồ sơ lượt. */
          students: new Map(), due: null,
          /* PR-LT3: không kèm tuần — Lịch Test ở tuần hiện tại có đủ ba khối (bài tuần trước ở khối 2, quá hạn ở khối 1); kèm tuần thi
             thì màn mở chế độ "tuần khác" (không có khối 2). */
          href: d.classId ? duongLichTest({ classId: d.classId, kn: d.skill }) : attemptHref({ id: d.attemptId, kind: d.kind, classId: d.classId }),
          attemptId: d.attemptId, ownerId: d.ownerId, quaHan: false, periodId: d.periodId, weekStart: d.weekStart,
        };
        buckets.set(k, b);
      }
      b.students.set(d.studentId, d.studentName);
      if (d.overdue) b.quaHan = true;
      if (d.deadline && (!b.due || d.deadline < b.due)) b.due = d.deadline;
    }
    /*
     * MỘT LỚP · MỘT TUẦN THI · CÙNG NGƯỜI PHỤ TRÁCH = MỘT dòng (OV-13c, Q4: gom theo tuần thi như lưới Lịch Test, không theo lượt) —
     * người nhập mở lưới điểm của tuần đó và gõ mọi cột, mọi lượt. Khác người phụ trách thì KHÔNG gộp. Môn chưa có tuần giữ khoá lượt + hạn cũ.
     */
    const byTest = new Map<string, ScoreBucket[]>();
    for (const b of buckets.values()) {
      const lich = b.periodId ? `p${b.periodId}` : `${b.attemptNo ?? 0}|${b.due ?? ''}${b.quaHan ? '|q' : ''}`;
      const k = `${b.classId ?? 0}|${b.kind ?? 'mock'}|${lich}|u${b.ownerId ?? 0}${laChamCheo(b.kind, b.skill) ? '|cc' : ''}`;
      (byTest.get(k) ?? byTest.set(k, []).get(k)!).push(b);
    }
    const out: WorkItem[] = [];
    for (const [k, list] of byTest) {
      const first = list[0];
      const skills = [...new Set(list.map((b) => b.skillLabel))].join(', ');
      const due = list.map((b) => b.due).filter((x): x is string => !!x).sort()[0] ?? null;
      const luotCua = [...new Set(list.map((b) => b.testLabel))].sort().join(', ');
      const students = new Map<number, string>();
      for (const b of list) for (const [sid, name] of b.students) students.set(sid, name);
      /* PR-S6F-a Q6: nhập điểm quá hạn ⇔ có ô `overdue` (tuần thi đã hết và qua hạn) — cùng cờ với Nợ điểm, Lịch Test, bảng GV. */
      const u: WorkUrgency = list.some((b) => b.quaHan) ? 'overdue' : due === today ? 'today' : 'normal';
      /*
       * ĐÚNG MỘT EM thì gọi tên em, không nói "Lớp X" — người đọc đi tìm một cái tên, và
       * "cả lớp" cho một học viên là một câu nói vòng vo.
       */
      const only = students.size === 1 ? [...students.entries()][0] : null;
      const where = only ? only[1] : (first.classCode ? `Lớp ${first.classCode}` : 'Bài kiểm tra');
      out.push({
        key: `score:${k}`,
        group: 'score', urgency: u,
        /*
         * Ô ĐẦU là LỚP, không phải một em đại diện: việc này làm cho cả nhóm cùng lúc. Chỉ khi
         * đúng một em còn thiếu thì mới nói tên em — lúc đó "lớp" là cách nói vòng vo.
         */
        studentId: only ? only[0] : null,
        studentName: where, emIds: only ? undefined : [...students.keys()],
        classId: first.classId, classCode: first.classCode,
        attemptId: first.attemptId, attemptNo: first.attemptNo, caseId: null, level: null,
        contextLabel: first.weekStart ? `${luotCua} ${tuanLich(first.weekStart)}` : luotCua,
        count: students.size,
        reason: skills,
        tieuDe: `Nhập điểm ${skills}`, phu: skills,
        actionLabel: 'Nhập điểm',
        href: first.href,
        /* Mã lượt của Điểm theo lớp (`docMaLuot`): MT `mt:n`, Checkpoint lớp liên tục `cp:n` (OV-6b2), lớp thường `thuong:{bài}`. */
        luot: first.kind === 'checkpoint' ? `cp:${first.attemptNo}` : first.kind && first.kind !== 'mock' ? `thuong:${first.kind}` : `mt:${first.attemptNo}`, kn: first.skill,
        kns: [...new Set(list.map((b) => b.skill))],
        knsQuaHan: [...new Set(list.filter((b) => b.quaHan).map((b) => b.skill))],
        soBai: list.reduce((n, b) => n + b.students.size, 0),   // OV-5a: "bài cần chấm" = kỹ năng × em
        ownerId: first.ownerId, owner: null, mine: first.ownerId === p.userId,
        due, tuanThi: first.weekStart, periodId: first.periodId, kind: first.kind ?? 'mock',
        statusLabel: laChamCheo(first.kind, first.skill) ? CHAM_CHEO : first.ownerId === null ? 'Chưa phân công giáo viên' : 'Chưa nhập điểm',
      });
    }
    return out;
  };

  const minhDongs: BaiChuaCham[] = [];
  for (const a of attempts as any[]) {
    for (const c of (a.myPendingDetail ?? []) as any[]) {
      minhDongs.push({
        classId: a.classId ?? null, classCode: a.classCode ?? null, attemptNo: a.attemptNo ?? null,
        kind: a.kind ?? null, attemptId: a.id, studentId: a.studentId, studentName: a.studentName,
        skill: c.skill, deadline: c.deadline, ownerId: p.userId, overdue: !!c.overdue, periodId: c.periodId ?? null, weekStart: c.weekStart ?? null,
      });
    }
  }
  items.push(...gomBaiChuaCham(minhDongs));

  /*
   * OV-14c (chủ SP 18/10; thay dòng gộp theo tuần của OV-13g): GV Speaking có MỘT việc "Chấm Speaking · n bài" — bài S Mock ở lớp FT
   * `lopFtChoGvSpeaking` từ thứ Hai tuần thi tới khi chấm (`canChamCheo`). Có số, KHÔNG hạn / quá hạn (T18: không là nợ của ai). Panel của việc
   * (`/my-work/cham-speaking`, `baiChamSpeaking` — cùng tập bài) liệt kê từng em. Không đổi luật ai chấm.
   */
  if (lopCheo.size) {
    const tuanHomNay = mondayOfDate(today);
    const ccDongs: BaiChuaCham[] = [];
    for (const a of attempts as any[]) {
      if (!lopCheo.has(a.classId)) continue;
      for (const c of (a.pendingDetail ?? []) as any[]) {
        if (!canChamCheo(laChamCheo(a.kind, c.skill), c.weekStart, tuanHomNay)) continue;
        ccDongs.push({
          classId: a.classId, classCode: a.classCode ?? null, attemptNo: a.attemptNo ?? null,
          kind: a.kind ?? null, attemptId: a.id, studentId: a.studentId, studentName: a.studentName,
          skill: c.skill, deadline: null, ownerId: p.userId, overdue: false, periodId: null, weekStart: c.weekStart,
        });
      }
    }
    const mau = gomBaiChuaCham(ccDongs)[0];
    if (mau) {
      const soBai = ccDongs.length;
      items.push({
        ...mau, key: KHOA_CHAM_SPEAKING, studentId: null, studentName: '', emIds: undefined, classId: null, classCode: null,
        /* Dòng phụ: số lớp (tiêu đề đã có số bài). */
        attemptId: null, attemptNo: null, contextLabel: `${new Set(ccDongs.map((x) => x.classId)).size} lớp`, phu: null, luot: undefined, periodId: null, tuanThi: null,
        tieuDe: `${VIEC_CHAM_CHEO} · ${soBai} bài`, reason: `${soBai} bài`, count: soBai, soBai, href: `/cong-viec?viec=${encodeURIComponent(KHOA_CHAM_SPEAKING)}`,
      });
    }
  }

  /* PR-Ra Q1: "Tất cả trong phạm vi" cộng thêm bài chưa chấm của GIÁO VIÊN KHÁC trong phạm vi. */
  if (tatCa && co('score')) {
    const classIds = [...new Set(attempts.map((a: any) => a.classId).filter((x: any): x is number => x !== null))];
    /* Người phụ trách môn — PR-Dọn (Q13): CÙNG luật với Nợ điểm và Lịch Test (`phanCongDangHieuLuc`). */
    const ownerOf = new Map([...phanCongDangHieuLuc(classIds, today)].map(([k, v]) => [k, v.userId]));
    const khacDongs: BaiChuaCham[] = [];
    for (const a of attempts as any[]) {
      for (const c of (a.pendingDetail ?? []) as any[]) {
        /* T18: Speaking Mock không có người phụ trách — không bị bỏ vì "đã có ở phần của mình" (GVBM S không có nó ở đó). */
        const ownerId = a.classId && !laChamCheo(a.kind, c.skill) ? (ownerOf.get(`${a.classId}|${c.skill}`) ?? null) : null;
        if (ownerId === p.userId) continue;   // đã có ở phần "của mình"
        khacDongs.push({
          classId: a.classId ?? null, classCode: a.classCode ?? null, attemptNo: a.attemptNo ?? null,
          kind: a.kind ?? null, attemptId: a.id, studentId: a.studentId, studentName: a.studentName,
          skill: c.skill, deadline: c.deadline, ownerId, overdue: !!c.overdue, periodId: c.periodId ?? null, weekStart: c.weekStart ?? null,
        });
      }
    }
    items.push(...gomBaiChuaCham(khacDongs));
  }

  /*
   * PR-DUYET: đề xuất PA và đề nghị dời lịch lần 2 KHÔNG còn là dòng việc — chúng là thẻ ở hộp Chờ duyệt (một nơi, K1-01/K1-32).
   * Hai lời quét ở đường đọc giữ nguyên: hết hạn duyệt → huỷ phần thi (mục 10.6); chốt "không dự thi" cuối Chủ nhật (PR-G).
   */
  /* ponytail: dựng một phần (`chiNhom`) bỏ hai lời quét ghi này — GET đầy đủ kế tiếp quét. */
  if (!f.chiNhom) {
    sweepExpiredMoves();
  }

  // ------------------------------------------- 2b. GHI KẾT QUẢ PA (K5-02, T75, §5.6; OV-12a: kỳ hai tuần) — một PA một dòng
  /*
   * Một nghĩa vụ: kết quả của kỳ hai tuần ghi xong trước HẾT THỨ BA sau kỳ (`action_due`, OV-12a). Hiện từ Chủ nhật (kỳ sắp hết, hạn − 2) tới khi
   * ghi. Mốc PA quy chế (`followup_due`) KHÔNG sinh việc riêng — tuần chạm mốc thành "Ghi kết quả cuối" (PR-SOS). Khoá dòng giữ
   * `action:{id}` để "đã nhắc hôm nay" của nút Nhắc khớp qua các PR (K5-12). QL chỉ thấy dòng của người khác khi đã quá hạn.
   */
  const reviewedCases = new Set<number>();
  const ghiKetQua = !co('ghi_ket_qua_pa', 'no_plan') ? [] : conn   // `reviewedCases` của 2b loại Case khỏi `no_plan`
    .prepare(
      `SELECT iv.id, iv.case_id, iv.kind, iv.description, iv.action_due, iv.followup_due, iv.preset, iv.nhom_bo_tro, iv.so_buoi,
              iv.performer_user_id, iv.performer_name, sc.owner_user_id,
              sc.topic, sc.sos_level, sc.urgency, sc.summary, sc.origin_kind, sc.attempt_id,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(cur.class_id, a.class_id) AS eff_class_id,   -- PR-PA (§8): lớp HIỆN TẠI trước, như LOP_CUA_CASE
              COALESCE(cc.branch_id, ac.branch_id) AS eff_branch_id,
              COALESCE(cc.code, ac.code) AS class_code,
              s.full_name, a.attempt_no, a.kind AS attempt_kind
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
        WHERE iv.status IN ('planned', 'started')
          AND iv.action_due IS NOT NULL AND iv.action_due <= ?
          AND sc.status != 'done'
          AND COALESCE(iv.approval_state, '') != 'pending'
          AND ${NOT_UNCONFIRMED_PRESET('iv')}
          AND ${HV_DANG_HOC_SQL('s')}`,   /* K3-41: em Tạm dừng dừng hạn */
    )
    .all(addDays(today, 2)) as any[];
  napTruocPhamVi(ghiKetQua.map((r) => r.eff_student_id));
  /* PR-PA (§8): người giữ việc — cùng hàm với chỉ số `pa-can-cap-nhat` và quyền ghi; tính một lần cho mọi dòng. */
  const giu = nguoiGiuKetQua(ghiKetQua.map((r) => ({ id: r.id, topic: r.topic ?? null, nhomBoTro: r.nhom_bo_tro ?? null, classId: r.eff_class_id ?? null, ownerUserId: r.owner_user_id ?? null })), today);
  for (const r of ghiKetQua) r.owner_id = giu.get(r.id) ?? null;
  /* PR-LT2a (M-03): PA bổ trợ chung gộp MỘT dòng mỗi nhóm — `reason` nêu các môn chung. */
  const monCuaNhom = new Map<string, string[]>();
  for (const r of ghiKetQua) {
    if (r.kind !== 'bo_tro' || !r.nhom_bo_tro) continue;
    monCuaNhom.set(r.nhom_bo_tro, [...(monCuaNhom.get(r.nhom_bo_tro) ?? []), r.topic]);
  }
  const duocThay = ghiKetQua.filter((iv) => {
    if (f.branchId && iv.eff_branch_id !== f.branchId) return false;
    /* PR-S5F-b: lọc rẻ trước (việc của mình · lớp mình dạy · QL quá hạn), quyền sau — tính từ cột đã JOIN, không đọc lại từng Case. */
    const mine = iv.owner_id === p.userId;
    if (mine) return true;   // PR-PA (§8): người giữ việc luôn thấy dòng của mình (không mồ côi)
    /* OV-11c (CV-8, Q6): "Của GV" có MỌI việc Kết quả PA của GV (cả chưa quá hạn) — cùng tập với "Của một GV" (`viecCuaNguoi`). */
    const qlCuaGv = tatCa && can(p, PERMISSIONS.CASE_APPROVE, { classId: iv.eff_class_id, studentId: iv.eff_student_id });
    if (!teachesClass(p, iv.eff_class_id) && !qlCuaGv) return false;
    return iv.kind === 'bo_tro'
      ? quyenBoTro(p, { ...iv, ctx: { classId: iv.eff_class_id ?? null, studentId: iv.eff_student_id ?? null, topic: iv.topic ?? null } })
      : can(p, PERMISSIONS.SOS_EDIT, { classId: iv.eff_class_id, studentId: iv.eff_student_id, skill: iv.topic ?? undefined });
  });
  /* PR-SO (D2): chọn PA đại diện nhóm SAU phạm vi/quyền — cùng hàm với chỉ số `pa-can-cap-nhat`. */
  for (const iv of daiDienNhomBoTro(duocThay, boKetQuaChoMiniTest(duocThay, today))) {   // OV-11c (CV-4): lần ghi cuối + Mini Test chờ → chỉ dòng Ghi Mini Test
    const u = urgencyOf(iv.action_due, today);
    const mine = iv.owner_id === p.userId;
    reviewedCases.add(iv.case_id);
    /* PR-SOS (T22, M-17): PA theo quy chế chạm mốc → "Ghi kết quả cuối" (PA thường không có mốc — Q28-4). */
    const tuanCuoi = laLanGhiCuoi({ preset: iv.preset === 1, followupDue: iv.followup_due ?? null, actionDue: iv.action_due ?? null, mienPhi: iv.kind === 'bo_tro_mien_phi' }, today);
    const tenPa = (iv.description ?? '').trim() || INTERVENTION_KIND_LABEL[iv.kind as InterventionKind] || 'PA học thuật';
    items.push({
      key: `action:${iv.id}`, group: 'ghi_ket_qua_pa', urgency: u, paId: iv.id,
      studentId: iv.eff_student_id, studentName: iv.full_name ?? 'Học viên',
      classId: iv.eff_class_id ?? null, classCode: iv.class_code ?? null,
      attemptId: iv.attempt_id ?? null, attemptNo: iv.attempt_no ?? null,
      caseId: iv.case_id as number, level: levelOf(iv),
      contextLabel: nhanDot(iv.attempt_kind, iv.attempt_no), count: null,
      reason: [tenPa, iv.kind === 'bo_tro' && iv.nhom_bo_tro && (monCuaNhom.get(iv.nhom_bo_tro)?.length ?? 0) > 1
        ? `PA chung · ${tenNhomMon(ctCua(iv.eff_class_id), REGULAR_SKILLS.filter((k) => monCuaNhom.get(iv.nhom_bo_tro)!.includes(k)))}` : null,
        mine ? null : 'chưa ghi'].filter(Boolean).join(' — '),
      tieuDe: tuanCuoi ? `Kết quả cuối · ${tenPa}` : `Kết quả PA${duoiKyNang(iv.topic, ctCua(iv.eff_class_id))}`,
      phu: tuanCuoi ? `Kết quả cuối · ${tenPa}` : duoiKyNang(iv.topic, ctCua(iv.eff_class_id)).trim(),
      actionLabel: tuanCuoi ? 'Kết quả cuối' : 'Kết quả PA',   // EN-e: một việc một tên — cùng tên nhóm Công việc
      /* PR-PA (§8): người giữ việc không xem được hồ sơ HV (vd. chủ Case, lớp mới chưa phân công môn) → Ngăn Case đứng riêng. */
      href: mine && !can(p, PERMISSIONS.STUDENT_VIEW, { studentId: iv.eff_student_id })
        ? duongCaseRieng(iv.case_id, { paId: iv.id, viec: 'ghi-ket-qua' })
        : duongHoSoHocVien(iv.eff_student_id, { caseId: iv.case_id, paId: iv.id, viec: 'ghi-ket-qua' }),
      ownerId: iv.owner_id ?? null,
      owner: iv.owner_id ? null : ((iv.performer_name ?? '').trim() || null),
      mine, due: iv.action_due, statusLabel: 'Chờ kết quả',
      /* OV-13b: Công việc mở ghi nhanh ngay dưới dòng (cùng luật với Case / panel một em). */
      ghiNhanh: ghiNhanhDuoc({ kind: iv.kind, soBuoi: iv.so_buoi ?? null, lanCuoi: tuanCuoi }),
    });
  }

  // ------------------------------------------------- 2d. PR-LCb: Chốt lộ trình (một việc mỗi lớp thường, Quản lý) — cùng hàm với chỉ số `lop-chua-chot-len-ft`
  /*
   * Thay hai việc "Chốt lên FT" (trước tuần Final) và "Chuyển tiếp lớp" (từ tuần Final): MỘT việc từ thứ Hai tuần trước Final (N20) tới khi mọi em đang học
   * có quyết định chuyển lớp; qua hạn vẫn còn, đỏ. Việc của cả lớp, không của riêng ai — không gán người phụ trách.
   */
  for (const x of co('chot_len_ft') ? lopChoChotLoTrinh(p, f.branchId ?? null, today) : []) {
    const chu = chuViecChotLoTrinh(x);
    items.push({
      key: `chotft:${x.classId}`, group: 'chot_len_ft', urgency: urgencyOf(x.han, today),
      studentId: null, studentName: `Lớp ${x.code}`, classId: x.classId, classCode: x.code,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: chu, count: x.chuaLenh, emIds: x.emIds,
      reason: chu,
      tieuDe: `Chốt lộ trình · ${x.code}`, actionLabel: 'Cuối khoá ›',
      href: `/hoc-vien/lop/${x.classId}?xem=cuoi-khoa`,
      ownerId: null, owner: null, mine: false, due: x.han, statusLabel: 'Chưa chốt',
    });
  }

  // ------------------------------------------------- 2d'. PR-CL (B5): Xét lại lộ trình — một việc mỗi lớp HIỆN TẠI của em (QL chi nhánh lớp đó), không hạn, tự mất (cùng hàm với GET /classes/:id/xet-lai-lo-trinh)
  for (const x of co('xet_lai_lo_trinh') ? emXetLaiLoTrinh(p, f.branchId ?? null, today) : []) {
    const ten = x.em.map((e) => `${e.ten} ${chuTyLeXetLai(e.tyLe)}`);
    items.push({
      key: `xetlai:${x.lopId}`, group: 'xet_lai_lo_trinh', urgency: 'normal',
      studentId: null, studentName: `Lớp ${x.code}`, classId: x.lopId, classCode: x.code,
      attemptId: null, attemptNo: null, caseId: null, level: null,
      contextLabel: ten.length > 3 ? `${ten.slice(0, 3).join(' · ')} · +${ten.length - 3}` : ten.join(' · '), count: x.em.length, emIds: x.em.map((e) => e.studentId),
      reason: 'Kết quả không phù hợp lộ trình',
      tieuDe: `Xét lại lộ trình · ${x.code} · ${x.em.length} em`, actionLabel: 'Chuyển lớp…',
      href: `/hoc-vien/lop/${x.lopId}?viec=xet-lai`,
      ownerId: null, owner: null, mine: false, due: null, statusLabel: 'Chưa có hạn',
    });
  }

  // ------------------------------------------------- 2e. bàn giao (PR-CT, Q30-2): GVCN một việc mỗi lớp nguồn, GVBM một việc mỗi (lớp, môn)
  /* OV-11c (CV-8, Q6): "Của GV" có Bàn giao của MỌI GV trong phạm vi — cùng hàm với "Của một GV" (`viecBanGiao` một lần cho mọi người). */
  for (const v of !co('ban_giao') ? [] : tatCa
    ? viecBanGiao(null, f.branchId).filter((v) => v.userId === p.userId || can(p, PERMISSIONS.CASE_APPROVE, { classId: v.lopId }))
    : viecBanGiao(p.userId, f.branchId)) {
    const han = v.han || null;
    const chung = {
      group: 'ban_giao' as const, urgency: urgencyOf(han, today), studentId: null, studentName: `Lớp ${v.code}`, classId: v.lopId, classCode: v.code,
      attemptId: null, attemptNo: null, caseId: null, level: null, ownerId: v.userId, owner: null, mine: v.userId === p.userId, due: han, emIds: v.emIds,
    };
    if (v.loai === 'gvcn') {
      items.push({
        ...chung, key: `ban_giao:${v.lopId}`, count: v.n,
        contextLabel: `GVCN · ${v.daXacNhan}/${v.n} đã xác nhận${v.chua.length ? ` · chờ môn ${v.chua.join(', ')}` : ''}`,
        reason: `${v.n - v.daXacNhan} em chưa xác nhận bàn giao`,
        tieuDe: v.motEm ? `Bàn giao ${v.motEm.ten}${v.motEm.lopDich ? ` → ${v.motEm.lopDich}` : ''}` : `Bàn giao ${v.n} em · ${v.code}`,
        actionLabel: 'Bàn giao', href: `/hoc-vien/lop/${v.lopId}?viec=ban-giao`, statusLabel: 'Chờ bàn giao',
      });
    } else {
      items.push({
        ...chung, key: `ban_giao_mon:${v.lopId}:${v.mon}`, count: v.n - v.daGhi,
        contextLabel: `GVBM · ${v.daGhi}/${v.n} em`, reason: `${v.n - v.daGhi} em chưa có câu bàn giao môn ${v.monNgan}`,
        tieuDe: `Bàn giao môn ${v.monNgan} · ${v.code}`, actionLabel: `Bàn giao môn ${v.monNgan}`,
        href: `/hoc-vien/lop/${v.lopId}?viec=ban-giao&mon=${v.mon}`, statusLabel: 'Chờ bàn giao',
      });
    }
  }

  // ------------------------------------------------- 4. vấn đề mở mà chưa có phương án nào
  const caseRows = !co('no_plan') ? [] : conn
    .prepare(
      `SELECT sc.*,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              COALESCE(ac.branch_id, cc.branch_id) AS eff_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              s.full_name, a.attempt_no, a.kind AS attempt_kind,
              (SELECT COUNT(*) FROM case_interventions iv
                WHERE iv.case_id = sc.id AND iv.status != 'cancelled') AS iv_count
         FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
        WHERE sc.status != 'done' AND COALESCE(sc.sos_level, 1) > 0 AND sc.kck = 0 AND sc.tam = 0   /* OV-9: Case nhẹ (KCK) không bắt Thêm PA, không hạn · OV-13a: Case tạm chờ chốt */
          AND sc.disposition IS NULL AND COALESCE(s.status, 'active') = 'active'   /* K3-41: em Tạm dừng dừng hạn */
        GROUP BY sc.id`,
    )
    .all() as any[];

  napTruocPhamVi(caseRows.map((r) => r.eff_student_id));
  /*
   * ĐỀ XUẤT PHƯƠNG ÁN là việc của người DẠY em, hoặc của Quản lý. Admin chi nhánh ghi hộ
   * được việc CS gọi phụ huynh nên vẫn có `sos.edit`, nhưng giao cho văn phòng năm dòng
   * "đề xuất phương án hỗ trợ" là giao một việc họ không có căn cứ chuyên môn để làm —
   * đúng kiểu danh sách việc mà người nhận chỉ biết bỏ qua.
   */
  const coTheThemPa = (u: Principal, c: any) => can(u, PERMISSIONS.SOS_EDIT, {
    classId: c.eff_class_id, studentId: c.eff_student_id, skill: c.topic ?? undefined,
  }) && (teachesClass(u, c.eff_class_id) || can(u, PERMISSIONS.CASE_APPROVE, { classId: c.eff_class_id, studentId: c.eff_student_id }));
  /* PR-VN3 (KV): người làm = chủ Case nếu chính họ thêm được PA (cùng `coTheThemPa`); không thì Quản lý của chi nhánh — chủ Case là GVCN dự phòng (lớp FT chưa
     phân công GVBM kỹ năng) không thấy dòng "Thêm PA" nên Nhắc 404. */
  const nguoiCoQuyen = new Map<number, Principal | null>(), qlChiNhanh = new Map<number, number | null>();
  /* OV-11c: nạp quyền các chủ Case MỘT câu cho cả lô (trước: một câu mỗi người) — dùng cho Thêm PA và "Của GV" (Xác nhận nguyên nhân / PA). */
  const napChu = (ids: readonly (number | null | undefined)[]) => {
    if (!nguoiCoQuyen.has(p.userId)) nguoiCoQuyen.set(p.userId, p);   // chính người xem: không hỏi lại
    const thieu = [...new Set(ids.filter((x): x is number => typeof x === 'number' && !nguoiCoQuyen.has(x)))];
    for (let i = 0; i < thieu.length; i += 400) {
      const lo = thieu.slice(i, i + 400);
      const co = new Map((conn.prepare(`SELECT ${COT_PRINCIPAL} FROM users u WHERE u.id IN (${lo.map(() => '?').join(',')})`).all(...lo) as any[])
        .map((r) => [r.u_id as number, principalTuDong(r)]));
      for (const id of lo) nguoiCoQuyen.set(id, co.get(id) ?? null);
    }
  };
  napChu(caseRows.filter((c) => !c.iv_count && !reviewedCases.has(c.id) && (!f.branchId || c.eff_branch_id === f.branchId) && coTheThemPa(p, c))
    .map((c) => c.owner_user_id));
  const nguoiLamThemPa = (c: any): number | null => {
    const o = (c.owner_user_id ?? null) as number | null;
    if (o === null || o === p.userId) return o;
    if (!nguoiCoQuyen.has(o)) napChu([o]);
    if (nguoiCoQuyen.get(o) && coTheThemPa(nguoiCoQuyen.get(o)!, c)) return o;
    const b = c.eff_branch_id as number | null;
    if (b === null) return o;
    if (!qlChiNhanh.has(b)) {
      qlChiNhanh.set(b, (conn.prepare(
        `SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
          WHERE r.key = 'manager' AND ur.status = 'active' AND u.status = 'active' AND u.deleted_at IS NULL AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 1`,
      ).get(b) as any)?.user_id ?? null);
    }
    const ql = qlChiNhanh.get(b) ?? null;
    if (ql !== null) napChu([ql]);
    return ql !== null && nguoiCoQuyen.get(ql) && coTheThemPa(nguoiCoQuyen.get(ql)!, c) ? ql : o;   // QL không đủ quyền ở lớp này thì giữ chủ Case, không giao vào ngõ cụt
  };
  for (const c of caseRows) {
    if (f.branchId && c.eff_branch_id !== f.branchId) continue;
    if (c.iv_count > 0 || reviewedCases.has(c.id)) continue;
    if (c.owner_user_id == null) continue;   // CV-LOI (CV-08, 9.2-10): Case chưa có người — một dòng "Phân công GV …" cho QL (mục 5), GV không thấy
    // Quyền GHI NHẬN xử lý, không phải quyền xem — việc chỉ hiện với người làm được. ĐỀ XUẤT PHƯƠNG ÁN: xem `coTheThemPa`.
    if (!coTheThemPa(p, c)) continue;

    /*
     * HẠN PHẢI CÓ PHƯƠNG ÁN THEO MỨC ĐỘ (`soNgayHanXacNhan`): Gấp / SOS 3 3 ngày, còn lại 5 ngày, tính cả
     * ngày đầu. Chỉ áp cho Case học thuật.
     *
     * Trước vòng 7 hạn này bằng nguyên một chu kỳ hỗ trợ (hai tuần), nên một Case Gấp nằm
     * im mười ba ngày vẫn chưa bị coi là chậm. Nay mức độ quyết định hạn — và đó là lý do
     * mức độ chỉ còn hai bậc, mỗi bậc một con số.
     */
    const deadline = hanThemPa(c);   // OV-11c (HV-14, Q10): một hàm với hồ sơ HV
    const u: WorkUrgency = deadline !== null && today > deadline ? 'overdue' : 'normal';
    const head = caseHeadline({
      summary: c.summary, originKind: c.origin_kind, sosLevel: c.sos_level, attemptNo: c.attempt_no,
      attemptKind: c.attempt_kind ?? null,
    });
    items.push({
      key: `support:${c.id}`, group: 'no_plan', urgency: u,
      studentId: c.eff_student_id, studentName: c.full_name ?? 'Học viên',
      classId: c.eff_class_id ?? null, classCode: c.class_code ?? null,
      attemptId: c.attempt_id ?? null, attemptNo: c.attempt_no ?? null,
      caseId: c.id as number, level: levelOf(c),
      reason: head,
      contextLabel: nhanDot(c.attempt_kind, c.attempt_no),
      count: null,
      tieuDe: `Thêm PA học thuật${duoiKyNang(c.topic, ctCua(c.eff_class_id))}`, phu: duoiKyNang(c.topic, ctCua(c.eff_class_id)).trim(),
      actionLabel: 'Thêm PA',
      href: duongHoSoHocVien(c.eff_student_id, { caseId: c.id, viec: 'them-pa' }),   // OV-11c (TQ-5): mở thẳng Case, chế độ Thêm PA
      /* PR-Dọn (Q10): người làm = người phụ trách Case (cùng `support:{caseId}` ở hồ sơ em); Case chưa ai phụ trách thì để trống. */
      ownerId: nguoiLamThemPa(c), owner: null, mine: c.owner_user_id != null && c.owner_user_id === p.userId,
      due: deadline, statusLabel: 'Chưa có PA học thuật',
      caseSos: c.origin_kind === 'mock',   // Case từ kết quả Test (cùng luật `cases.ts`); GV/QL tạo tay, chuyển cấp, khai bù → gộp
    });
  }

  // ------------------------------------- 3b. Case TỰ TẠO TỪ SOS: Xác nhận Case (Progress) · Ghi nhận xét (MT cũ) · Xác nhận PA (S4-2, §3.1d, OV-12c)
  /*
   * MỘT DÒNG MỖI CASE (Xác nhận Case / Ghi nhận xét) / MỖI PA (xác nhận PA). Hạn = `sos_cases.han_xac_nhan` (`hanXacNhan`: 5 ngày; MT Gấp / SOS 3: 3;
   * Progress cố định 5), hết ngày hạn mới tính quá hạn. Case chờ = `sosCaseStateMany` (đã loại thẻ Không cần theo dõi đang chờ). Case MT mới
   * có nguyên nhân từ nhận xét ngay khi ra đời → chỉ còn Xác nhận PA.
   *
   * AI THẤY: người phụ trách Case (GVBM đúng kỹ năng); "Của GV (nhắc)" liệt kê dòng của GV cho Quản lý. Em Tạm dừng không sinh dòng (K3-41).
   * Mọi trường hợp đều kiểm đúng quyền sửa Case theo kỹ năng (C02).
   */
  const cotCase = `sc.id, sc.topic, sc.summary, sc.origin_kind, sc.sos_level, sc.urgency, sc.owner_user_id, sc.attempt_id, sc.kck,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id, cur.class_id AS lop_dang_hoc,
              COALESCE(ac.branch_id, cc.branch_id) AS eff_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              s.full_name, a.attempt_no, a.kind AS attempt_kind, sc.han_xac_nhan AS due, rp.week_start AS tuan_thi`;
  const noiCase = `LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id`;
  const causeCandidates = !co('cause', 'ghi_nhan_xet') ? [] : conn
    .prepare(
      `SELECT ${cotCase} FROM sos_cases sc ${noiCase}
        WHERE sc.status != 'done' AND ${HV_DANG_HOC_SQL('s')}
          AND ${LA_CASE_SOS('sc')}
          AND NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary')`,
    )
    .all() as any[];
  /* OV-12c: MỘT định nghĩa (`sosCaseStateMany`) — Progress chờ "Xác nhận Case", MT cũ chờ "Ghi nhận xét"; thẻ Không cần theo dõi đang chờ thì không. */
  const stCho = sosCaseStateMany(causeCandidates.map((c) => c.id as number));
  const xacNhanPa = !co('xac_nhan_pa') ? [] : conn
    .prepare(
      `SELECT ${cotCase}, iv.id AS iv_id, iv.kind AS iv_kind, iv.description AS iv_mo_ta, iv.performer_user_id AS iv_nguoi_id, iv.so_buoi AS iv_so_buoi,
              COALESCE(pu.full_name, iv.performer_name) AS iv_nguoi
         FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id ${noiCase} LEFT JOIN users pu ON pu.id = iv.performer_user_id
        WHERE ${UNCONFIRMED_PRESET('iv')} AND iv.status = 'planned' AND iv.kind != 'bo_tro' AND NOT ${CHO_DOI_PA('iv')} AND sc.status != 'done' AND ${HV_DANG_HOC_SQL('s')}   /* PA bổ trợ chờ kế hoạch, không chờ "Xác nhận PA" (M8) */
          AND EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary')
          AND NOT ${CO_THE_KHONG_THEO_DOI('sc')}   /* OV-12c: Không cần theo dõi mở ở bước này — thẻ đang chờ thì việc ở Quản lý */`,
    )
    .all() as any[];
  napTruocPhamVi([...causeCandidates, ...xacNhanPa].map((r) => r.eff_student_id));
  if (tatCa) napChu([...causeCandidates, ...xacNhanPa].map((r) => r.owner_user_id));
  const dongCase = (c: any, loai: 'cause' | 'ghi_nhan_xet' | 'xac_nhan_pa') => {
    if (f.branchId && c.eff_branch_id !== f.branchId) return;
    /* OV-12c (đặc tả 7.2): "Xác nhận Case" Progress — GVCN lớp đang học làm được dù không dạy môn (cùng luật `coTheXacNhanCase`, không thêm câu SQL mỗi dòng). */
    const lamDuoc = (x: Principal) => can(x, PERMISSIONS.SOS_EDIT, { classId: c.eff_class_id, studentId: c.eff_student_id, skill: c.topic ?? undefined })
      || (loai === 'cause' && laGvcnLopDangHoc(x, c.lop_dang_hoc));
    if (!lamDuoc(p)) return;
    if (c.owner_user_id == null) return;   // CV-LOI (CV-08): Case chưa có người — chỉ dòng "Phân công GV …" (mục 5)
    const u = urgencyOf(c.due ?? null, today);
    const mine = c.owner_user_id === p.userId;
    /*
     * PR-DUYET (K1-57) + PR-SOS (K5-05): QL không có dòng này ở "Của tôi" — quá hạn thì nó là thẻ Báo QL ở hộp Chờ duyệt. "Của GV (nhắc)"
     * (`nguoi=tat-ca`) liệt kê dòng của GV kèm tên như mọi nhóm khác.
     */
    const cuaGv = tatCa && can(p, PERMISSIONS.CASE_APPROVE, { classId: c.eff_class_id, studentId: c.eff_student_id });
    if (!mine && !cuaGv) return;
    /* OV-11c (CV-8): chủ Case không còn quyền làm (C02: GVCN không dạy môn đó) — việc không của họ (họ không thấy, Nhắc 404): "Của GV" để trống người giữ. */
    const chu_ = c.owner_user_id ?? null;
    const chuLamDuoc = mine || chu_ === null || (() => { const x = nguoiCoQuyen.get(chu_); return !!x && lamDuoc(x); })();
    const laThuong = lopCua(c.eff_class_id)?.mode === 'ratio';
    /* T58/MH2: lớp thường nói tên môn ngắn (G+V, P) và "chưa đạt" — không "dưới kỳ vọng". */
    /* OV-11c (CV-17a): tên môn ĐỦ ở mọi khung ("Listening", "Grammar + Vocabulary") — cùng tên với "Thêm PA học thuật …". */
    const skillLabel = c.topic ? caseTopicLabel(c.topic, ctCua(c.eff_class_id)) : 'Kỹ năng';
    const hv = c.full_name ?? 'Học viên';
    const kck = c.kck ? ' · KCK' : '';   // OV-9: Case nhẹ — không hạn (`due` null), không đỏ
    const mt = `MT${c.attempt_no ?? ''}`;
    const chu = {
      cause: { key: `cause:${c.id}`, ly: `${skillLabel} ${laThuong ? 'chưa đạt' : 'dưới kỳ vọng'}${kck} — chưa xác nhận Case${kck ? ', không hạn' : ''}`,
        tieuDe: `Xác nhận Case ${skillLabel}${kck} · ${hv}`, nut: 'Xác nhận Case', tt: 'Chờ xác nhận Case' },
      ghi_nhan_xet: { key: `ghi_nhan_xet:${c.id}`, ly: `${skillLabel} dưới kỳ vọng${kck} — bài chưa có nhận xét (nguyên nhân Case)`,
        tieuDe: `Ghi nhận xét ${skillLabel}${kck} · ${mt} · ${hv}`, nut: 'Ghi nhận xét', tt: 'Chờ ghi nhận xét' },
      xac_nhan_pa: { key: `xnpa:${c.iv_id}`, ly: `${skillLabel} — PA theo quy chế chưa bắt đầu`,
        tieuDe: `Xác nhận PA · ${skillLabel} · ${hv}`, nut: 'Xác nhận PA', tt: 'Chờ xác nhận PA' },
    }[loai];
    items.push({
      key: chu.key, group: loai, urgency: u, paId: loai === 'xac_nhan_pa' ? c.iv_id : null,
      studentId: c.eff_student_id, studentName: hv,
      classId: c.eff_class_id ?? null, classCode: c.class_code ?? null,
      attemptId: c.attempt_id ?? null, attemptNo: c.attempt_no ?? null,
      caseId: c.id as number, level: levelOf(c),
      contextLabel: nhanDot(c.attempt_kind, c.attempt_no),
      count: null,
      reason: [chu.ly, mine ? null : 'người phụ trách chưa làm'].filter(Boolean).join(' — '),
      tieuDe: chu.tieuDe, phu: skillLabel,
      actionLabel: chu.nut,
      /* PR-DUYET (K5-12): mở thẳng Ngăn Case — Nhắc lưu đường này vào thông báo, chuông về đúng chỗ. */
      href: duongHoSoHocVien(c.eff_student_id, { caseId: c.id }),
      ownerId: chuLamDuoc ? chu_ : null, owner: null, mine,
      due: c.due ?? null, statusLabel: chu.tt,
      caseSos: true,   // LA_CASE_SOS / PA quy chế — luôn là Case sinh từ SOS
      /* OV-13c (Q4): dòng gộp theo tuần thi + mức SOS; Xác nhận PA cùng lúc cần loại PA, nội dung máy gán, người dạy đã có. */
      tuanThi: c.tuan_thi ?? null, sos: c.sos_level ?? null,
      ...(loai === 'xac_nhan_pa' ? { pa: { kind: c.iv_kind, moTa: c.iv_mo_ta ?? null, nguoiId: c.iv_nguoi_id ?? null, nguoi: c.iv_nguoi ?? null, soBuoi: c.iv_so_buoi ?? null } } : {}),
      /* OV-12c: Ghi nhận xét mở hộp chấm tại chỗ — bảng điểm một lớp · một lượt · đúng bài của Case (cùng panel Nhập điểm). */
      ...(loai === 'ghi_nhan_xet' ? { luot: `mt:${c.attempt_no}`, kn: c.topic ?? undefined } : {}),
    });
  };
  for (const c of causeCandidates) {
    const st = stCho.get(c.id);
    if (st?.awaitingCause) dongCase(c, 'cause');
    else if (st?.choNhanXet) dongCase(c, 'ghi_nhan_xet');
  }
  for (const c of xacNhanPa) dongCase(c, 'xac_nhan_pa');

  /*
   * OV-13k → SV-NX-CASE (plan.md 1.6 N8 ③, chủ SP 23/10): XÁC NHẬN CASE SPEAKING CHẤM CHÉO — người chấm chéo (không phải GV phụ trách S của em) lưu ô S Mock
   * có nhận xét (`cho_phu_trach_xem`) mà em có Case S thật đang mở theo lượt đó → việc của GV phụ trách S lớp (`phanCongDangHieuLuc`), hạn = hạn SOS của Case
   * (`han_xac_nhan`). GV chọn dùng nhận xét chấm chéo làm mô tả, giữ mô tả đang có, hoặc viết mô tả khác (`xacNhanCaseS`) → việc hết. Không có Case → không việc.
   * Thay việc "Xem nhận xét Speaking" (khoá nhóm `xem_nx_s` giữ để bộ lọc / Tổng quan không đổi). Quản lý ở "Tất cả" thấy dòng của GV trong phạm vi.
   */
  /* Chỉ người có phân công Speaking (của mình) hoặc "Tất cả" mới có dòng — vai khác không tốn câu SQL nào. */
  const lopS = [...new Set(p.assignments.filter((x) => x.skill === 'speaking' && activeAt(x, today)).map((x) => x.classId))];
  if (co('xem_nx_s') && (tatCa || lopS.length)) {
    /* "Của tôi": chỉ lớp mình có phân công Speaking (người giữ việc vẫn xét `phanCongDangHieuLuc` dưới); chi nhánh lọc trong SQL. */
    const loc = [
      ...(tatCa ? [] : [`a.class_id IN (${lopS.map(() => '?').join(',')})`]),
      ...(f.branchId ? ['c.branch_id = ?'] : []),
    ];
    const ds = conn.prepare(
      `SELECT a.id AS attempt_id, a.attempt_no, a.kind, a.class_id, c.code AS class_code, c.branch_id, a.student_id, st.full_name,
              sc.id AS case_id, sc.han_xac_nhan AS due, sc.sos_level
         /* TD7a: CROSS JOIN giữ assessment_scores làm bảng ngoài → đi chỉ mục một phần idx_score_cho_phu_trach (vài ô), không duyệt mọi lượt của lớp / chi nhánh. */
         FROM assessment_scores s CROSS JOIN assessment_attempts a ON a.id = s.attempt_id AND a.kind = 'mock' AND a.status != 'cancelled'
         JOIN students st ON st.id = a.student_id AND ${HV_DANG_HOC_SQL('st')}
         JOIN classes c ON c.id = a.class_id
         JOIN sos_cases sc ON sc.attempt_id = a.id AND sc.topic = 'speaking' AND sc.status != 'done' AND ${CASE_THAT('sc')}
        WHERE s.skill = 'speaking' AND s.cho_phu_trach_xem = 1${loc.map((x) => ` AND ${x}`).join('')}`,
    ).all(...(tatCa ? [] : lopS), ...(f.branchId ? [f.branchId] : [])) as any[];
    const gvS = ds.length ? phanCongDangHieuLuc([...new Set(ds.map((r) => r.class_id as number))], today) : new Map();
    if (tatCa) napTruocPhamVi(ds.map((r) => r.student_id));   // quyền theo em một lần cho cả danh sách (không N+1)
    const caseXnS = new Set<number>();
    for (const r of ds) {
      caseXnS.add(r.case_id as number);
      const chu_ = gvS.get(`${r.class_id}|speaking`)?.userId ?? null;
      const mine = chu_ === p.userId;
      if (!mine && !(tatCa && can(p, PERMISSIONS.CASE_APPROVE, { classId: r.class_id, studentId: r.student_id }))) continue;
      const mt = `MT${r.attempt_no}`;
      items.push({
        key: `xem_nx_s:${r.attempt_id}`, group: 'xem_nx_s', urgency: urgencyOf(r.due ?? null, today),
        studentId: r.student_id, studentName: r.full_name, classId: r.class_id, classCode: r.class_code,
        attemptId: r.attempt_id, attemptNo: r.attempt_no, caseId: r.case_id, level: r.sos_level ?? null,
        contextLabel: mt, count: null,
        reason: 'Người chấm chéo đã ghi nhận xét Speaking — chọn mô tả Case',
        tieuDe: `Xác nhận Case Speaking · ${r.full_name} · ${mt}`, phu: 'Speaking',
        actionLabel: 'Xác nhận Case', href: duongHoSoHocVien(r.student_id, { caseId: r.case_id }),
        ownerId: chu_, owner: null, mine, due: r.due ?? null, statusLabel: 'Chờ xác nhận Case',
        caseSos: true,
      });
    }
    /* Một Case một việc: Case S chưa có mô tả mà đang chờ xác nhận nhận xét chấm chéo — bỏ dòng "Ghi nhận xét" trùng. */
    for (let i = items.length - 1; i >= 0; i -= 1) if (items[i].group === 'ghi_nhan_xet' && caseXnS.has(items[i].caseId as number)) items.splice(i, 1);
  }

  // ------------------------------------- 3c. Giữa khoá lớp thường: BÁO PHỤ HUYNH QUA TVV (PR-LT2a; PR-CT2 bỏ nhóm Nộp kế hoạch bổ trợ)
  /* Báo phụ huynh qua TVV: GVCN lớp em ĐANG học (và Quản lý ở "Tất cả trong phạm vi"); KHÔNG hạn (M-05), không tính quá hạn. */
  const baoPh = !co('phoi_hop') ? [] : conn
    .prepare(
      `SELECT x.id, x.attempt_id, x.student_id, s.full_name, a.attempt_no, a.kind AS attempt_kind, cur.class_id AS cur_class_id, c.code AS class_code, c.branch_id,
              (SELECT ta.user_id FROM teacher_assignments ta WHERE ta.class_id = cur.class_id AND ta.is_core = 1 AND ta.status = 'active' ORDER BY ta.id LIMIT 1) AS gvcn_id
         FROM sos_coordination_actions x JOIN students s ON s.id = x.student_id AND ${HV_DANG_HOC_SQL('s')}
         JOIN assessment_attempts a ON a.id = x.attempt_id
         JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active' JOIN classes c ON c.id = cur.class_id
        WHERE x.kind = 'bao_ph_tvv' AND x.status = 'pending' ORDER BY x.id`,
    )
    .all() as any[];
  napTruocPhamVi(baoPh.map((r) => r.student_id));
  /* PR-S5F-a: Báo PH Giữa khoá là việc của GVCN lớp em ĐANG học (`gvcn_id` đọc cùng câu) — Quản lý xem "Tất cả" thấy người đó, không "chưa ai phụ trách". */
  const phanTramCuoi = new Map<number, string>();
  for (const [id, t] of tyLeTongLo(baoPh.filter((r) => r.attempt_kind === 'final').map((r) => r.attempt_id))) if (t.tyLe !== null) phanTramCuoi.set(id, ` ${Math.round(t.tyLe * 100)}%`);
  for (const r of baoPh) {
    if (f.branchId && r.branch_id !== f.branchId) continue;
    const laCuoiKhoa = r.attempt_kind === 'final';   // PR-LT2b: Final Test < 50% → việc của Quản lý (`request.approve`), không của GVCN
    const gvcn = !laCuoiKhoa && isCoreTeacherOf(p, r.cur_class_id, today);
    const cuaGv = (tatCa || laCuoiKhoa) && can(p, laCuoiKhoa ? PERMISSIONS.REQUEST_APPROVE : PERMISSIONS.CASE_APPROVE, { classId: r.cur_class_id, studentId: r.student_id });
    if (!gvcn && !cuaGv) continue;
    items.push({
      key: `baoph:${r.id}`, group: 'phoi_hop', urgency: 'normal',
      studentId: r.student_id, studentName: r.full_name ?? 'Học viên',
      classId: r.cur_class_id, classCode: r.class_code ?? null,
      attemptId: r.attempt_id, attemptNo: r.attempt_no ?? null, caseId: null, level: null,
      contextLabel: nhanDot(r.attempt_kind, r.attempt_no), count: null,
      reason: 'Nhờ TVV báo phụ huynh (4 nội dung), xong thì đánh dấu đã làm: kết quả, môn khó khăn, nguyên nhân, phương án hỗ trợ và khả năng học lại.',
      phu: laCuoiKhoa ? `${nhanBaiThuong('final')}${phanTramCuoi.get(r.attempt_id) ?? ''}` : nhanBaiThuong('progress'),
      tieuDe: `Báo phụ huynh qua TVV · ${r.full_name ?? 'Học viên'} · ${laCuoiKhoa ? `${nhanBaiThuong('final')}${phanTramCuoi.get(r.attempt_id) ?? ''}` : nhanBaiThuong('progress')}`,
      actionLabel: 'Mở Phối hợp SOS',
      href: duongHoSoHocVien(r.student_id, { tab: 'y-thuc', sub: 'phoi-hop' }),
      ownerId: gvcn || (laCuoiKhoa && cuaGv) ? p.userId : laCuoiKhoa ? null : r.gvcn_id ?? null, owner: null, mine: gvcn || (laCuoiKhoa && cuaGv),
      due: null, statusLabel: 'Chưa làm',
    });
  }
  /*
   * PR-VAI-a (K5-10, Q14): PHỐI HỢP SOS là việc thật — một dòng mỗi lớp GVCN chủ nhiệm còn lượt chưa xong, đếm bằng CHÍNH
   * `myCoordinationLines` (cùng số với tab Phối hợp của lớp). Không hạn (P10) — trừ OV-12h: meeting CX / GĐCN hạn 5 ngày từ lúc tạo (`hanPhoiHop`),
   * dòng lớp mang hạn sớm nhất, quá hạn tô như việc khác.
   */
  for (const l of !co('phoi_hop_sos') ? [] : tatCa ? dongPhoiHopLop([...gvcnLop().keys()]) : myCoordinationLines(p)) {
    if (f.branchId && bangLop().get(l.classId)?.branchId !== f.branchId) continue;
    const gv = tatCa ? gvcnLop().get(l.classId) ?? p.userId : p.userId;
    items.push({
      key: `phoi_hop_sos:${l.classId}`, group: 'phoi_hop_sos', urgency: urgencyOf(l.han, today),   // OV-12h: meeting CX có hạn 5 ngày
      studentId: null, studentName: `Lớp ${l.className}`, classId: l.classId, classCode: l.className,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: 'Phối hợp SOS', count: l.pendingCount,
      reason: `${l.pendingCount} lượt Phối hợp SOS chưa xong`,
      tieuDe: `Phối hợp SOS · ${l.className} · ${l.pendingCount} lượt`, actionLabel: 'Mở Phối hợp SOS',
      href: `/hoc-vien/lop/${l.classId}?tab=y-thuc&sub=phoi-hop`,
      ownerId: gv, owner: null, mine: gv === p.userId, due: l.han, statusLabel: 'Chưa xong',
    });
  }
  /*
   * PR-LT2b (K5 §3 #10): Ghi Mini Test — hết khi đã ghi; em Tạm dừng ẩn (T65). PR-CT2 (§8): người làm = người giữ việc của nhóm (`nguoiGiuMiniTest` — GVCN lớp em
   * ĐANG học; không có → chủ Case), không còn là Người dạy (GV cũ ở lớp của bài Final). Không ai giữ → GVCN lớp đang học.
   */
  const miniTest = !co('mini_test') ? [] : conn
    .prepare(
      `SELECT m.id, m.student_id, m.han, m.nhom_bo_tro, s.full_name, cur.class_id AS cur_class_id, c.code AS class_code, c.branch_id,
              (SELECT MIN(sc.owner_user_id) FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.nhom_bo_tro = m.nhom_bo_tro) AS owner,
              (SELECT MIN(iv.case_id) FROM case_interventions iv WHERE iv.nhom_bo_tro = m.nhom_bo_tro) AS case_id,
              (SELECT MIN(iv.id) FROM case_interventions iv WHERE iv.nhom_bo_tro = m.nhom_bo_tro AND iv.status IN ('planned', 'started')) AS pa_id
         FROM mini_test m JOIN students s ON s.id = m.student_id AND ${HV_DANG_HOC_SQL('s')}
         JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active' JOIN classes c ON c.id = cur.class_id
        WHERE m.ty_le IS NULL ORDER BY m.han, m.id`,
    )
    .all() as any[];
  napTruocPhamVi(miniTest.map((r) => r.student_id));
  const giuMt = nguoiGiuMiniTest(miniTest.map((m) => ({ id: m.id, nhom: m.nhom_bo_tro, lop: m.cur_class_id, owner: m.owner ?? null })));
  for (const m of miniTest) {
    m.gv = giuMt.get(m.id) ?? null;
    if (f.branchId && m.branch_id !== f.branchId) continue;
    const mine = m.gv ? m.gv === p.userId : isCoreTeacherOf(p, m.cur_class_id, today);
    const cuaGv = tatCa && can(p, PERMISSIONS.CASE_APPROVE, { classId: m.cur_class_id, studentId: m.student_id });
    if (!mine && !cuaGv) continue;
    items.push({
      key: `minitest:${m.id}`, group: 'mini_test', urgency: urgencyOf(m.han, today), paId: m.pa_id ?? null,
      studentId: m.student_id, studentName: m.full_name ?? 'Học viên',
      classId: m.cur_class_id, classCode: m.class_code ?? null,
      attemptId: null, attemptNo: null, caseId: m.case_id ?? null, level: null,
      contextLabel: 'Bổ trợ miễn phí', count: null,
      reason: 'Em đã học bổ trợ miễn phí — ghi Mini Test (% và ngày làm). Từ 70% thì Case tự hoàn thành.',
      tieuDe: `Ghi Mini Test · ${m.full_name ?? 'Học viên'}`,
      actionLabel: 'Ghi Mini Test',
      href: duongHoSoHocVien(m.student_id, { caseId: m.case_id ?? undefined, paId: m.pa_id ?? undefined, viec: 'ghi-ket-qua' }),
      ownerId: m.gv ?? null, owner: null, mine,
      due: m.han, statusLabel: 'Chờ ghi Mini Test',
    });
  }
  // ---------------------------------------------------------------- 4. chốt tuần MT
  for (const a of attempts as any[]) {
    if (a.period || a.status !== 'planned' || a.lichSu) continue;
    if (!can(p, PERMISSIONS.PLAN_WEEK, { classId: a.classId })) continue;
    items.push({
      key: `week:${a.id}`, group: 'missing_data', urgency: 'normal',
      studentId: a.studentId, studentName: a.studentName,
      classId: a.classId ?? null, classCode: a.classCode ?? null,
      attemptId: a.id, attemptNo: a.attemptNo, caseId: null, level: null,
      contextLabel: nhanDot(a.kind, a.attemptNo), count: null,
      reason: 'Bài chưa được xếp vào tuần nào nên chưa tính được hạn nhập điểm',
      tieuDe: 'Chốt tuần MT', phu: 'Chốt tuần MT',
      actionLabel: 'Chốt tuần MT', href: attemptHref(a),
      ownerId: p.userId, owner: null, mine: true,
      due: null, statusLabel: 'Chưa có tuần',
    });
  }

  /*
   * K5-09: HỌC VIÊN FT CHƯA CÓ TARGET — không có target thì không có kỳ vọng, SOS và Case không bao giờ sinh ra. Việc của GVCN lớp
   * (người điền hồ sơ), không hạn. Một câu cho mọi lớp người xem chủ nhiệm.
   */
  if (co('missing_data')) {
    const lopCn = tatCa ? [...gvcnLop().keys()] : [...new Set(p.assignments.filter((x) => x.isCore && activeAt(x, today)).map((x) => x.classId))];
    if (lopCn.length) {
      /* SV-TVV-VIEC: "Chốt ngày thi" chuyển sang TVV (`viecHoSoTvv`) — câu này chỉ còn "Điền Target" của GVCN. */
      const ds = conn.prepare(
        `SELECT s.id, s.full_name, e.class_id, c.code AS class_code, cy.target_score
           FROM learning_cycles cy
           JOIN students s ON s.id = cy.student_id AND ${HV_DANG_HOC_SQL('s')}
           JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
           JOIN classes c ON c.id = e.class_id
          WHERE cy.status = 'active' AND cy.route IS NOT NULL
            AND cy.target_score IS NULL   /* OV-9: em KCK chưa có Target cũng thiếu Target */
            AND e.class_id IN (${lopCn.map(() => '?').join(',')}) AND (? IS NULL OR c.branch_id = ?)`,
      ).all(...lopCn, f.branchId ?? null, f.branchId ?? null) as any[];
      /* PR-VAI-a (từ UXF-a, mywork.ts:927): sắp lớp theo `soSanhLop` (MB FT 9 trước MB FT 10), rồi tên em. */
      for (const h of ds
        .sort((x, y) => soSanhLop({ code: x.class_code }, { code: y.class_code }) || String(x.full_name).localeCompare(String(y.full_name), 'vi'))) {
        items.push({
          key: `target:${h.id}`, group: 'missing_data', urgency: 'normal',
          studentId: h.id, studentName: h.full_name, classId: h.class_id, classCode: h.class_code,
          attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: null, count: null,
          reason: 'Chưa có Target nên chưa tính được kỳ vọng từng MT',
          tieuDe: 'Điền Target', phu: 'Điền Target', actionLabel: 'Điền Target', href: `/hoc-vien/${h.id}`,
          ownerId: tatCa ? gvcnLop().get(h.class_id) ?? p.userId : p.userId, owner: null, mine: true, due: null, statusLabel: 'Chưa có Target',
        });
      }
    }
  }

  /* SV-TVV-VIEC: hai việc không hạn của TVV (em chưa có TVV → QL chi nhánh) — Chốt ngày thi · Bổ sung hồ sơ thiếu (một dòng tổng). */
  items.push(...viecHoSoTvv(p, { today, tatCa, branchId: f.branchId ?? null, chot: co('missing_data'), boSung: co('bo_sung_ho_so') }));

  /* K2-32: MT CŨ chưa nhập — một việc XÁM mỗi lớp (GVCN / Quản lý), không hạn, không quá hạn. Cùng hàm với dòng nhắc Lịch Test. */
  for (const l of co('missing_data') ? mtLichSuChuaNhap(p, { branchId: f.branchId ?? null }) : []) {
    items.push({
      key: `lich-su:${l.classId}`, group: 'missing_data', urgency: 'normal',
      studentId: null, studentName: `Lớp ${l.classCode}`, classId: l.classId, classCode: l.classCode,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: null, count: l.soEm, emIds: l.emIds,
      /* OV-11e (TE-8): số theo lượt — link mở lượt đầu, số đầu = số hàng ở đó. */
      reason: `Nhập MT cũ · ${l.luot.map((x) => `MT${x.so} · ${x.soEm} em`).join(' · ')} · không tính hạn`,
      tieuDe: 'Nhập điểm MT cũ', actionLabel: 'Nhập điểm', href: l.href,
      ownerId: tatCa ? gvcnLop().get(l.classId) ?? p.userId : p.userId, owner: null, mine: true, due: null, statusLabel: 'Không tính hạn',
    });
  }

  /*
   * PR-SOS (K3-14, Q8): PA theo quy chế đang chạy mà CHƯA CÓ MỐC (chưa có lịch MT kế / ngày thi) → việc của Quản lý: Nhập ngày thi dự
   * kiến / Xếp lịch MT. Điền mốc trước (có lịch rồi thì hết việc), rồi đọc lại. Một câu cho cả phạm vi.
   */
  if (xemNguoiKhac && co('missing_data')) {
    const sql = `SELECT iv.id, iv.case_id, iv.moc_quy_che, COALESCE(sc.student_id, a.student_id) AS sid, s.full_name,
              COALESCE(a.class_id, cur.class_id) AS class_id, COALESCE(ac.code, cc.code) AS class_code,
              COALESCE(ac.branch_id, cc.branch_id) AS branch_id, a.attempt_no
         FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
        WHERE iv.preset = 1 AND iv.status = 'started' AND iv.followup_due IS NULL AND iv.moc_quy_che IN ('until_next_mt', 'until_exam')
          AND sc.status != 'done' AND ${HV_DANG_HOC_SQL('s')}`;
    const truoc = conn.prepare(sql).all() as any[];
    if (truoc.length) {
      dienMocQuyChe({ caseIds: [...new Set(truoc.map((r) => r.case_id as number))] });
      const sau = conn.prepare(sql).all() as any[];
      napTruocPhamVi(sau.map((r) => r.sid));   // PR-S3F #4: `can()` từng dòng đọc bộ nhớ, không N+1
      for (const r of sau) {
        if (f.branchId && r.branch_id !== f.branchId) continue;
        if (!can(p, PERMISSIONS.CASE_APPROVE, { classId: r.class_id, studentId: r.sid })) continue;
        const thi = r.moc_quy_che === 'until_exam';
        items.push({
          key: `moc:${r.id}`, group: 'missing_data', urgency: 'normal',
          studentId: r.sid, studentName: r.full_name ?? 'Học viên', classId: r.class_id ?? null, classCode: r.class_code ?? null,
          attemptId: null, attemptNo: r.attempt_no ?? null, caseId: r.case_id, level: null, contextLabel: null, count: null,
          reason: `PA theo quy chế ${thi ? 'đến lúc thi' : `đến MT${(r.attempt_no ?? 0) + 1}`} đang chạy nhưng chưa có ${thi ? 'ngày thi' : 'lịch'}`,
          tieuDe: thi ? `Nhập dự kiến thi · ${r.full_name ?? 'Học viên'}` : `Xếp lịch MT${(r.attempt_no ?? 0) + 1} cho ${r.full_name ?? 'Học viên'}`,
          phu: thi ? 'Nhập dự kiến thi' : `Xếp lịch MT${(r.attempt_no ?? 0) + 1}`,
          actionLabel: thi ? 'Nhập ngày thi' : 'Xếp lịch', href: r.sid ? `/hoc-vien/${r.sid}` : '/hoc-vien',
          ownerId: p.userId, owner: null, mine: true, due: null, statusLabel: 'Chưa có lịch',
        });
      }
    }
  }

  // ------------------------------------------------- 5. Case chưa có người phụ trách
  /*
   * "CHƯA CÓ NGƯỜI PHỤ TRÁCH" LÀ MỘT VIỆC, KHÔNG PHẢI MỘT Ô TRỐNG (mục 2.3 · 3.2).
   *
   * Case không có người điều phối thì mọi việc sau đó — đề xuất phương án, làm, xem lại —
   * đều không có ai để nhắc. Nên nó phải nổi lên thành một dòng việc riêng, và người làm
   * được là người có quyền phân công.
   */
  /* CV-LOI: cùng nguồn với số Tổng quan `case-chua-co-nguoi-phu-trach` (`caseChuaCoNguoi`) — số trên Tổng quan = số dòng ở đây. */
  for (const c of !co('no_owner') ? [] : caseChuaCoNguoi(p, f.branchId ?? null)) {
    const head = caseHeadline({
      summary: c.summary, originKind: c.origin_kind, sosLevel: c.sos_level, attemptNo: c.attempt_no,
      attemptKind: c.attempt_kind ?? null,
    });
    const tenMon = c.mon ? caseTopicLabel(c.topic ?? c.mon, ctCua(c.eff_class_id)) : null;
    /* `chon` (dự phòng): lớp đủ người mà Case vẫn trống (dữ liệu cũ) hoặc em không có lớp — mở hồ sơ em, chọn người ở Case. */
    const chon = c.thieu === 'chon';
    items.push({
      key: `owner:${c.id}`, group: 'no_owner', urgency: 'normal',
      studentId: c.eff_student_id, studentName: c.full_name ?? 'Học viên',
      classId: c.eff_class_id ?? null, classCode: c.class_code ?? null,
      attemptId: c.attempt_id ?? null, attemptNo: c.attempt_no ?? null,
      caseId: c.id as number, level: levelOf(c),
      contextLabel: nhanDot(c.attempt_kind, c.attempt_no),
      count: null,
      reason: chon ? `${head} — chưa ai nhận điều phối` : `${head} — lớp chưa có ${tenMon ? `GV ${tenMon}` : 'GVCN'}`,
      tieuDe: chon ? 'Chọn người phụ trách' : tenMon ? `Phân công GV ${tenMon}` : 'Phân công GVCN',
      actionLabel: chon ? 'Chọn người phụ trách' : 'Phân công',
      href: chon ? duongHoSoHocVien(c.eff_student_id, { caseId: c.id }) : `/hoc-vien/lop/${c.eff_class_id}?viec=phan-cong`,
      ownerId: null, owner: null, mine: false,
      due: null, statusLabel: 'Chưa có người phụ trách', ...(chon ? {} : { thieuNguoi: { mon: c.mon } }),
    });
  }

  // ------------------------------------------------- 5b. Ý thức (PR-YT4) — việc thật có hạn, người nhận = GVCN lớp ĐANG học
  /*
   * Một cửa trạng thái (`trangThaiYThuc`): quét Báo QL ở đầu request đã nạp các em này, nên ở đây không tốn thêm câu nào ngoài câu
   * ứng viên. Em Tạm dừng không sinh việc (T65). Dòng hết khi làm xong ở bất cứ đâu (Ghi nhận / Xác nhận xử lý / Đề xuất / Đã thực hiện).
   */
  if (co('khai_bac', 'yt_xu_ly', 'yt_xem', 'yt_thuc_hien')) {
    const uv = ungVienVaThe({ branchId: f.branchId ?? null });
    /*
     * PR-VAI-a (K1-15, Q15): KHAI BẬC Ý THỨC HS CŨ — em lớp mình chủ nhiệm có hồ sơ tạo trong 14 ngày gần nhất mà còn khai được
     * (`coTheKhai`: có chuỗi, chưa lần xử lý nào, chưa khai). Một câu ứng viên; trạng thái đọc CÙNG lượt `trangThaiYThuc` với việc Ý thức.
     */
    const lopCn = [...new Set(p.assignments.filter((x) => x.isCore && activeAt(x, today)).map((x) => x.classId))];
    const emMoi = lopCn.length ? conn.prepare(
      `SELECT s.id, s.full_name, e.class_id, c.code, c.branch_id FROM enrollments e
         JOIN students s ON s.id = e.student_id AND ${HV_DANG_HOC_SQL('s')}
         JOIN classes c ON c.id = e.class_id
        WHERE e.status = 'active' AND e.class_id IN (${lopCn.map(() => '?').join(',')}) AND substr(s.created_at, 1, 10) BETWEEN ? AND ?
        ORDER BY s.full_name`,
    ).all(...lopCn, addDays(today, -13), today) as any[] : [];
    const trang = trangThaiYThuc([...new Set([...uv.map((r) => r.id), ...emMoi.map((r) => r.id as number)])], today);
    const khaiTheoLop = new Map<number, any[]>();
    for (const r of emMoi) {
      const em = trang.get(r.id);
      if (f.branchId && r.branch_id !== f.branchId) continue;
      if (!em || em.gvcnId !== p.userId || !khaiDuoc(em)) continue;   // PR-Dọn (6f): cùng luật với hồ sơ em
      khaiTheoLop.set(r.class_id, [...(khaiTheoLop.get(r.class_id) ?? []), r]);
    }
    for (const [lopId, ds] of khaiTheoLop) {
      items.push({
        key: `khai_bac:${lopId}`, group: 'khai_bac', urgency: 'normal',
        studentId: ds.length === 1 ? ds[0].id : null, studentName: ds.length === 1 ? ds[0].full_name : `Lớp ${ds[0].code}`,
        classId: lopId, classCode: ds[0].code, attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: 'Ý thức', count: ds.length, emIds: ds.map((e) => e.id as number),
        reason: `${ds.length} em mới vào web chưa xác nhận cấp bậc vi phạm đã có trước đó`,
        tieuDe: `Xác nhận cấp bậc vi phạm HV cũ · ${ds[0].code} · ${ds.length} em`, actionLabel: 'Xác nhận cấp bậc',
        /* Một em: tab Ý thức của lớp, chọn sẵn em, mở panel Khai bậc (`mo=khai`). OV-13d: nhiều em → panel Xác nhận cấp bậc theo lô (`mo=cap-bac`). */
        href: ds.length === 1 ? `/hoc-vien/lop/${lopId}?tab=y-thuc&hv=${ds[0].id}&mo=khai` : `/hoc-vien/lop/${lopId}?tab=y-thuc&mo=cap-bac&em=${ds.map((e) => e.id).join(',')}`,
        ownerId: p.userId, owner: null, mine: true, due: null, statusLabel: 'Chưa xác nhận cấp bậc',
      });
    }
    if (tatCa) napTruocPhamVi(uv.map((r) => r.id));   // `can()` từng em bên dưới đọc bộ nhớ, không N+1
    const duongLop = (lopId: number | null, sid: number, them: string) =>
      lopId ? `/hoc-vien/lop/${lopId}?tab=y-thuc&hv=${sid}${them}` : duongHoSoHocVien(sid, { tab: 'y-thuc' });
    for (const r of uv) {
      const em = trang.get(r.id);
      if (!em || em.tamDung || !em.gvcnId) continue;
      const mine = em.gvcnId === p.userId;
      if (!mine && !(tatCa && can(p, PERMISSIONS.CASE_APPROVE, { classId: em.lopId, studentId: r.id }))) continue;
      const chung = {
        studentId: r.id, studentName: r.ten, classId: em.lopId, classCode: r.lop,
        attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: 'Ý thức', count: null,
        ownerId: em.gvcnId, owner: null, mine,
      };
      const quaHan = [...em.viPham.values()];
      if (em.soBatBuoc > 0 && !em.coChoDuyet) {
        const ke = nhanLoaiXuLy(em.keTiep.kind);
        items.push({ ...chung, key: `yt_xu_ly:${r.id}`, group: 'yt_xu_ly', urgency: urgencyOf(em.han, today),
          reason: `${em.soBatBuoc} vi phạm trong 2 tuần — bắt buộc xử lý`,
          tieuDe: `Xử lý vi phạm · ${r.ten} (${em.soBatBuoc}) · bậc kế tiếp: ${ke}`, phu: `${em.soBatBuoc} vi phạm · bậc kế tiếp: ${ke}`, actionLabel: 'Xác nhận xử lý',
          href: duongLop(em.lopId, r.id, '&mo=xu-ly'), due: em.han,
          statusLabel: quaHan.some((x) => x.lyDoQuaHan === 'xu-ly') ? 'Quá hạn' : 'Bắt buộc xử lý' });
      }
      if (em.soMoi > 0) {
        items.push({ ...chung, key: `yt_xem:${r.id}`, group: 'yt_xem', urgency: urgencyOf(em.hanXem, today),
          reason: `${em.soMoi} vi phạm chưa xem`, tieuDe: `Ghi nhận ${em.soMoi} vi phạm mới · ${r.ten}`, phu: `${em.soMoi} vi phạm mới`, actionLabel: 'Ghi nhận',
          href: duongLop(em.lopId, r.id, '&loc=moi'), due: em.hanXem, statusLabel: 'Mới' });
      }
      /* PR-S3F #7: MỘT việc cho MỖI lần xử lý đã duyệt (khoá theo id lần xử lý) — hai đề xuất cùng lúc không che nhau. */
      for (const x of em.daDuyet) {
        const nhan = nhanLoaiXuLy(x.kind, x.customName);
        items.push({ ...chung, key: `yt_thuc_hien:${x.id}`, group: 'yt_thuc_hien', urgency: urgencyOf(x.han, today),
          reason: `QL đã duyệt ${nhan}`, tieuDe: `Ghi "Đã thực hiện" ${nhan} · ${r.ten}`, phu: nhan, actionLabel: 'Đã thực hiện',
          href: duongLop(em.lopId, r.id, `&mo=da-thuc-hien&xl=${x.id}`), due: x.han, statusLabel: 'Đã duyệt · chờ thực hiện' });
      }
    }
  }

  // ------------------------------------------------- 5c. kỳ vọng đầu ra (PR-KV, §3) — việc của Quản lý, MỘT dòng mỗi lớp BE/ELE nguồn
  /* CÙNG hàm `lopKyVong` với chỉ số `hv-len-ft-chua-ky-vong` (tập em chưa kết luận) — Σ `count` = số của chỉ số. Mở panel ở trang lớp. */
  for (const x of co('ky_vong_dau_ra') ? lopKyVong(p, f.branchId ?? null) : []) {
    const n = x.chua.length;
    const chu = x.choMt0 === n ? `Chờ MT0 ${n} em` : `MT0 đủ ${n - x.choMt0}/${n}`;
    items.push({
      key: `kyvong:${x.classId}`, group: 'ky_vong_dau_ra', urgency: 'normal',
      studentId: null, studentName: `Lớp ${x.code}`, classId: x.classId, classCode: x.code,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: chu, count: n, emIds: x.chua,
      reason: chu,
      tieuDe: `Kỳ vọng · ${x.code} · ${n} em`, actionLabel: 'Cuối khoá ›',
      href: `/hoc-vien/lop/${x.classId}?xem=cuoi-khoa`, ownerId: null, owner: null, mine: false, due: null, statusLabel: 'Chưa có hạn',
    });
  }

  // ------------------------------------------------- 5d. cập nhật kết quả thi thật (PR-TK, TK-K)
  if (co('thi_that')) items.push(...viecThiThat(p, { today, tatCa, branchId: f.branchId ?? null }));
  // ------------------------------------------------- 5e. chọn bước tiếp sau thi (OV-8a) — việc của Quản lý
  if (co('buoc_tiep')) items.push(...viecBuocTiep(p, { today, tatCa, branchId: f.branchId ?? null }));
  // ------------------------------------------------- 5f. Báo PH sau lưu xử lý vi phạm (SV-YT-TVV) — TVV của em / QL khi em chưa có TVV
  if (co('bao_ph_yt')) items.push(...viecBaoPhCuaToi(p, { today, tatCa, branchId: f.branchId ?? null }));

  // ------------------------------------------------- 6. công việc quản lý được giao
  /*
   * VIỆC Ở BẢNG "TIẾN ĐỘ CÔNG VIỆC" CŨNG LÀ VIỆC CỦA NGƯỜI NÀY (mục 3.2).
   *
   * Giáo viên không nhìn thấy cả bảng đó, nhưng việc con giao cho họ thì vẫn phải hiện ở
   * đây — nếu không, giao việc xong là việc biến mất khỏi tầm mắt người nhận.
   */
  /* OV-11c (CV-16): người có tab Vận hành (QL, Quản trị) không lặp việc Vận hành ở Hỗ trợ học viên. */
  for (const t of co('mgmt') && !canSeeBoard(p) ? myMgmtTasks(p) : []) {
    const u = urgencyOf(t.due, today);
    items.push({
      key: `mgmt:${t.id}`, group: 'mgmt', urgency: u,
      studentId: null, studentName: t.title,
      classId: null, classCode: null,
      attemptId: null, attemptNo: null, caseId: null, level: null,
      contextLabel: t.parentTitle ? `Việc con của: ${t.parentTitle}` : 'Công việc quản lý',
      count: null,
      reason: t.progressLabel,
      tieuDe: t.title,
      actionLabel: 'Cập nhật',
      href: `/cong-viec?mo-viec=${t.id}`,
      ownerId: p.userId, owner: null, mine: true,
      due: t.due, statusLabel: t.progressLabel,
    });
  }

  /*
   * XẾP NHÓM.
   *
   * Bản trước gom hết việc gấp vào một nhóm "Cần làm ngay" — nhưng "quá hạn nhập điểm" và
   * "chưa ai bắt tay vào" là hai chuyện khác hẳn nhau, gộp lại thì nhìn vào không biết cái
   * nào là cái nào. Nay GIỮ ĐÚNG LOẠI VIỆC, chỉ xếp việc gấp lên đầu TRONG nhóm của nó, và
   * xếp nhóm nào có việc gấp lên trước.
   */
  /*
   * Ba nhóm học thuật đứng trước, rồi tới việc chỉ Quản lý làm được, rồi những nghĩa vụ
   * còn lại. "Cần xếp lớp tiếp" đứng ngay sau ba nhóm chính vì nó treo cả một lớp.
   */
  /* Nhóm dựng kèm vì phụ thuộc (2b cho `no_plan`, bài cho `score`/`missing_data`) → bỏ dòng ngoài tập. */
  if (f.chiNhom) for (let i = items.length - 1; i >= 0; i--) if (!f.chiNhom.has(items[i].group)) items.splice(i, 1);
  /* OV-11c (CV-11): QL / Quản trị "Của tôi" = việc mình giữ (hoặc chưa ai giữ mà mình làm được); việc GV giữ chỉ ở "Của GV". */
  if (xemNguoiKhac && !tatCa) for (let i = items.length - 1; i >= 0; i--) if (items[i].ownerId !== null && items[i].ownerId !== p.userId) items.splice(i, 1);
  const order: WorkGroupKey[] = [
    'cause', 'ghi_nhan_xet', 'xac_nhan_pa', 'xem_nx_s', 'phoi_hop', 'phoi_hop_sos', 'mini_test', 'score', 'no_plan', 'ghi_ket_qua_pa', 'yt_xu_ly', 'yt_xem', 'yt_thuc_hien', 'bao_ph_yt', 'khai_bac',
    'chot_len_ft', 'xet_lai_lo_trinh', 'ky_vong_dau_ra', 'thi_that', 'buoc_tiep', 'ban_giao', 'no_owner', 'mgmt', 'missing_data', 'bo_sung_ho_so',
  ];
  const weight = (u: WorkUrgency) => (u === 'overdue' ? 0 : u === 'today' ? 1 : 2);

  /*
   * TÊN NGƯỜI PHỤ TRÁCH, LẤY MỘT LẦN CHO CẢ DANH SÁCH.
   *
   * Hỏi từng dòng một thì một màn ba trăm việc sinh ba trăm câu truy vấn — chậm mà không
   * màn nào báo lỗi, đúng kiểu khó tìm nhất.
   */
  const ownerIds = [...new Set(items.map((i) => i.ownerId).filter((x): x is number => x !== null))];
  if (ownerIds.length) {
    const names = new Map<number, string>();
    for (const r of conn
      .prepare(`SELECT id, full_name FROM users WHERE id IN (${ownerIds.map(() => '?').join(',')})`)
      .all(...ownerIds) as any[]) names.set(r.id, r.full_name);
    for (const it of items) {
      if (it.ownerId === null) continue;   // đã có tên chữ, hoặc thật sự chưa có ai
      it.owner = it.ownerId === p.userId ? null : (names.get(it.ownerId) ?? null);   // việc của chính người xem: không ghi tên (J7)
      it.mine = it.ownerId === p.userId;
    }
  }

  ganKhung(items, lopCua);
  if (tatCa) {
    const lt = lamThayCua(p, items.filter((it) => !it.mine));
    for (const it of items) if (!it.mine) it.lamThay = lt(it);
  }

  const groups = order
    .map((g) => {
      const list = items.filter((i) => i.group === g)
        .sort((a, b) => weight(a.urgency) - weight(b.urgency));
      return {
        key: g,
        label: GROUP_META[g].label,
        hint: GROUP_META[g].hint,
        items: list,
        overdue: list.filter((i) => i.urgency === 'overdue').length,
        today: list.filter((i) => i.urgency === 'today').length,
      };
    })
    .filter((g) => g.items.length > 0)
    .sort((a, b) => (b.overdue > 0 ? 1 : 0) - (a.overdue > 0 ? 1 : 0));

  /*
   * TRẢ VỀ CẢ DANH SÁCH PHẲNG.
   *
   * Màn Tổng quan bày MỘT khu "Việc cần làm" có bộ lọc, chứ không phải bảy danh sách mở
   * đồng thời (mục 5.3). Nhóm vẫn còn, nhưng chỉ dùng để đếm cho dải ô trên đầu và làm một
   * chiều lọc — không còn là bảy cái hộp xếp chồng nhau.
   *
   * Thứ tự: quá hạn trước, rồi tới hạn hôm nay, rồi hạn gần nhất. Việc không có hạn xuống
   * cuối — nó không cấp bằng việc có hạn đã trôi qua.
   */
  const flat = [...items].sort((a, b) => {
    const w = weight(a.urgency) - weight(b.urgency);
    if (w !== 0) return w;
    if (a.due && b.due) return a.due < b.due ? -1 : a.due > b.due ? 1 : 0;
    if (a.due) return -1;
    if (b.due) return 1;
    return 0;
  });

  /* PR-GOP (§5): dòng hiển thị — một lớp × một loại việc; `items` giữ từng việc (hồ sơ GV). V5 SV-SO1: số việc / bài / nhóm đếm trên `items` (`demSo`). */
  const dong = dungDong(flat);
  return {
    summary: demSo(dong, flat),
    items: flat,
    dong,
    groups,
    scopeEmpty: false,
    xemNguoiKhac,
  };
}

/** SV-YT-TVV + SV-TVV-VIEC: nhóm việc của TVV — đọc ở Tổng quan TVV (`/tong-quan/viec-cua-toi`), TVV không có khu Công việc. `missing_data` của TVV chỉ có Chốt ngày thi. */
export const NHOM_VIEC_TVV: ReadonlySet<WorkGroupKey> = new Set<WorkGroupKey>(['bao_ph_yt', 'missing_data', 'thi_that', 'buoc_tiep', 'bo_sung_ho_so']);
export const nhanNhomViec = (g: string) => GROUP_META[g as WorkGroupKey]?.label ?? g;

/** PR-GOP: gộp dòng (hàm chung `gopViecTheoLop`). OV-12h: bỏ Nhắc trên dòng. */
const dungDong = (items: WorkItem[]): WorkItem[] => gopViecTheoLop(items, nhanNhomViec) as WorkItem[];

/**
 * `total` / `overdue` / `today` / `mine` = DÒNG hiển thị (sau gộp). V5 SV-SO1: `viec` · `bai` · `nhom` · `hv` (`demViec`, trên việc thật, trước gộp — T17)
 * và `viecQuaHan` = việc quá hạn trong số đó — badge Công việc đọc `viec`, không đọc số dòng.
 */
export const demSo = (dong: WorkItem[], items: WorkItem[], cuaToi: (i: WorkItem) => boolean = (i) => i.mine) => {
  /* Nợ #528: số việc = việc CỦA người đó (`mine`) — không đếm việc người khác giữ / chưa ai giữ (vd "Thêm PA" Case người khác). */
  const minh = items.filter(cuaToi);
  return {
    total: dong.length,
    overdue: dong.filter((i) => i.urgency === 'overdue').length,
    today: dong.filter((i) => i.urgency === 'today').length,
    mine: dong.filter((i) => i.mine).length,
    ...demViec(minh),
    /* Nhập điểm: chỉ kỹ năng thật sự quá hạn của dòng (`knsQuaHan`), không cả dòng. */
    viecQuaHan: demViec(minh.filter((i) => i.urgency === 'overdue').map((i) => (i.group === 'score' ? { ...i, kns: i.knsQuaHan } : i))).viec,
  };
};

/** MH4: gán khung cho mọi dòng việc từ bảng tra lớp đã nạp (không thêm câu SQL). Dòng không gắn lớp → `null`. */
function ganKhung(items: WorkItem[], lopCua: (classId: number | null | undefined) => { mode: string | null } | null) {
  for (const it of items) {
    const l = it.classId ? lopCua(it.classId) : null;
    it.khung = l ? khungCua(l.mode) : null;
  }
}

/**
 * VIỆC CỦA MỘT GIÁO VIÊN KHÁC, người xem là Quản lý/Quản trị (`/my-work?nguoi={id}` và hồ sơ GV — PR-GV Q4).
 * Chuyển nguyên từ route; phép kiểm chi nhánh dùng `phamViHoSoGv` (vai hoặc phân công đang hiệu lực) để Công việc
 * không 403 khi hồ sơ GV trả 200.
 */
export function viecCuaNguoi(p: Principal, nguoi: number, branchId?: number | null) {
  const xemViec = phamViXemViec(p);
  if (!xemViec) throw forbidden('Bạn chỉ xem được việc của mình.');
  phamViHoSoGv(p, nguoi);
  const x = loadPrincipal(nguoi);
  /* PR-OV2a: Admin chỉ thấy nhóm Chấm điểm của GV. */
  const w = myWork(x, { branchId, ...(xemViec === 'cham-diem' ? { chiNhom: new Set<WorkGroupKey>(['score']) } : {}) }) as any;
  napTruocPhamVi(w.items.map((it: any) => it.studentId));   // `can()` từng dòng bên dưới đọc bộ nhớ, không N+1
  /*
   * OV-11c (PT-7): việc Vận hành giao cho GV (không gắn lớp) được tính — người xem đã qua `phamViHoSoGv` (GV thuộc chi nhánh mình); hồ sơ GV và
   * "Của một GV" cùng số. Dòng khác: theo phạm vi lớp / em của người xem.
   */
  /* OV-13g: Speaking chấm chéo không là việc của GV (T18) — không vào "Của một GV" / hồ sơ GV. */
  const loc = (w.items as WorkItem[]).filter((it) => !laViecChamCheo(it));
  const lt = lamThayCua(p, loc);
  const cuaGv = new Set(loc.filter((it) => it.mine).map((it) => it.key));   // `mine` gốc (của GV đó) — bị ghi đè `false` bên dưới
  const items = loc
    .filter((it: any) => (it.group === 'mgmt' && it.classId === null && it.studentId === null)
      || ((it.classId !== null || it.studentId !== null) && can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: it.classId, studentId: it.studentId })))
    .map((it: any) => ({
      ...it,
      owner: it.ownerId === x.userId ? x.fullName : it.owner,
      mine: false,
      lamThay: lt(it),
    }));
  const groupsByKey = new Map<string, any[]>();
  for (const it of items) (groupsByKey.get(it.group) ?? groupsByKey.set(it.group, []).get(it.group)!).push(it);
  const groups = w.groups
    .map((g: any) => ({ ...g, items: groupsByKey.get(g.key) ?? [] }))
    .filter((g: any) => g.items.length > 0)
    .map((g: any) => ({
      ...g,
      overdue: g.items.filter((i: any) => i.urgency === 'overdue').length,
      today: g.items.filter((i: any) => i.urgency === 'today').length,
    }));
  const dong = dungDong(items);
  /* V5 SV-SO1 (brief 7): xem việc người khác = chế độ theo dõi (`chiXem`); dòng nào người xem làm thay được thì `lamThay` (quyền máy chủ thật). */
  return { summary: { ...demSo(dong, items, (i) => cuaGv.has(i.key)), mine: 0 }, items, dong, groups, scopeEmpty: false, xemNguoiKhac: true, chiXem: true };
}

/**
 * V5 SV-SO1: người xem LÀM THAY được việc này không — cùng quyền máy chủ kiểm khi lưu: Nhập điểm = `editableSkills` (QL / Admin / QT nhập hộ qua
 * `score.override` / `plan.week` — `06` điểm 1) đủ mọi kỹ năng của việc; Case học thuật = `SOS_EDIT` theo ngữ cảnh Case (`ctxSuaCaseNhieu` — như `cases.ts`). Việc chưa phân công / việc khác: chỉ theo dõi.
 */
export function lamThayCua(p: Principal, items: readonly WorkItem[]): (it: WorkItem) => boolean {
  const ctx = ctxSuaCaseNhieu(items.filter((it) => it.caseId && nhomViecCua(it.group) === 'case-hoc-thuat').map((it) => it.caseId!));
  return (it) => {
    if (it.ownerId === null) return false;   // việc chưa có người giữ (chưa phân công): không "làm thay" ai
    if (it.group === 'score') return !!it.classId && !!it.kns?.length && editableSkills(p, it.classId, it.kns).length === it.kns.length;
    const c = it.caseId ? ctx.get(it.caseId) : undefined;
    return !!c && nhomViecCua(it.group) === 'case-hoc-thuat' && can(p, PERMISSIONS.SOS_EDIT, c);
  };
}
