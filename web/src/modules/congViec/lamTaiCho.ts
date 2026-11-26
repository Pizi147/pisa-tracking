import { KHOA_CHAM_SPEAKING, laViecChamCheo } from '@shared/domain/index.ts';
import { VIEC_LO_Y_THUC, type WorkItem } from '../worklist/WorkList.tsx';

/* TAI-NHANH-0711: tách khỏi PanelViec.tsx — danh sách việc biết việc nào làm tại chỗ mà không kéo cả mảnh panel (PanelViecLuoi tải lười). */
/** Số sau dấu `:` cuối của khoá việc (`yt_thuc_hien:12`, `mgmt:5`). */
export const soCuaKhoa = (k: string) => Number(k.slice(k.lastIndexOf(':') + 1)) || null;

/**
 * VIỆC NÀO LÀM TẠI CHỖ (OV-5a, mockup M1 §2; OV-12c): Xác nhận Case (Progress) · Mô tả Case (Case MT chưa mô tả) · Thêm PA / Kết quả PA / Xác nhận PA /
 * Mini Test (Ngăn Case, khuôn panel v3 cho Xác nhận Case · Xác nhận PA · Mô tả Case) · Nhập điểm
 * (một lớp · một lượt) · Bàn giao · Ý thức (xử lý, đã thực hiện, khai bậc một em) · việc Vận hành. Còn lại (Phối hợp, Thiếu dữ liệu, thi thật…) mở trang như cũ. OV-13m: Chọn bước tiếp = panel Bước tiếp (`PanelBuocTiep`).
 * R3 (rà 24/11): + Xét lại lộ trình (panel Xét lại cả lớp, T2) · Xác nhận Case Speaking (panel Case, như Mô tả Case, W1) · mốc PA `moc:` (Nhập dự kiến thi =
 * Chốt ngày thi · Xếp lịch MTn = panel Lịch MT, W2).
 */
export function lamTaiCho(it: WorkItem): boolean {
  if (moCaDong(it) || it.key === KHOA_CHAM_SPEAKING) return true;   // OV-14c: Chấm Speaking — panel hàng đợi từng em
  switch (it.group) {
    case 'cause': case 'ghi_nhan_xet': case 'xem_nx_s': return it.caseId !== null;
    case 'xet_lai_lo_trinh': case 'chot_len_ft': case 'ky_vong_dau_ra': return it.classId !== null;   // CHOT-LO-TRINH-PANEL (v25): panel Chốt lộ trình tại chỗ
    case 'xac_nhan_pa': case 'ghi_ket_qua_pa': case 'mini_test': return it.caseId !== null && !!it.paId;
    case 'no_plan': return it.caseId !== null;
    case 'score': return (!!it.luot || !!it.periodId) && it.classId !== null;
    case 'ban_giao': return it.classId !== null;
    case 'yt_xu_ly': return it.studentId !== null || laLo(it);
    case 'yt_xem': return laLo(it) || it.studentId !== null;   // OV-13d lô · OV-13b (11.1e): Ghi nhận một em — tại chỗ
    case 'khai_bac': return it.studentId !== null || it.classId !== null;   // OV-13d: nhiều em → Xác nhận cấp bậc theo lô
    case 'phoi_hop_sos': case 'phoi_hop_tvv': return it.classId !== null;   // OV-12h: xác nhận meeting CX tại chỗ
    case 'meeting_xep_lich': case 'meeting_ket_qua': return !!it.phoiHopId;   // GV-2: panel Meeting ba phần tại chỗ
    case 'yt_hoi_tinh_hinh': return soCuaKhoa(it.key) !== null;   // TINH-HINH: GVCN ghi kết quả TVV hỏi tại chỗ
    case 'yt_tra_lai': return soCuaKhoa(it.key) !== null;   // TL-2 (N61): Vi phạm bị trả lại — ba lựa chọn tại chỗ
    case 'yt_thuc_hien': case 'mgmt': case 'buoc_tiep': case 'thi_that': return soCuaKhoa(it.key) !== null;   // OV-13q: Kết quả thi thật tại chỗ
    /* OV-13b (đặc tả OV-13 §1): Ghi nhận vi phạm · Báo PH kết quả Test · Điền Target (Thiếu thông tin) · Chọn người phụ trách — tại chỗ.
       Thiếu thông tin khác (Nhập điểm MT cũ, mốc thi) cần cả trang — mở trang như cũ. */
    case 'phoi_hop': return it.studentId !== null;
    case 'bo_sung_ho_so': return !!it.emIds?.length;   // 06/11: sửa thông tin từng em tại chỗ, "Lưu · em tiếp ›"
    case 'missing_data': return it.studentId !== null && (it.key.startsWith('chot-ngay-thi:') || ((it.key.startsWith('moc:') || it.key.startsWith('mt-thi:')) && !!it.cycleId));   // UI-CV-TVV: Chốt ngày thi · R3-W2: mốc PA · MT-QUA-THI: Lịch MT
    case 'bao_ph_yt': return !!it.viecId && it.studentId !== null;   // UI-CV-TVV: Báo PH (TVV / QL khi em chưa có TVV)
    /* CV-LOI: Phân công GV môn / GVCN còn thiếu — tại chỗ · R1-NO-CU: "Chọn người phụ trách" (lớp đủ người) — hộp đổi người tại chỗ.
       Em không có lớp → hồ sơ em như cũ (không có ai để chọn). */
    case 'no_owner': return it.classId !== null && (!!it.thieuNguoi || it.caseId !== null);
    default: return false;
  }
}

/** OV-13d: dòng gộp Ý thức theo lớp (Xác nhận xử lý · Ghi nhận) → panel lô của đúng các em trong dòng. */
export const laLo = (it: WorkItem) => !!it.con?.length && it.classId !== null && VIEC_LO_Y_THUC.has(it.group);

/**
 * OV-13c (mockup OV-13 §3a): dòng gộp làm CẢ DÒNG trong một panel — Xác nhận PA cùng lúc (Case SOS FT cùng lớp + tuần thi + mức SOS) · Nhập điểm theo tuần
 * thi (lưới điểm từng lớp của tuần đó). Bấm dòng mở panel, không mở danh sách em; "việc tiếp" đi qua cả dòng.
 */
/* OV-13g: Speaking chấm chéo KHÔNG mở lưới cả tuần — bấm mở danh sách lớp, mỗi lớp "Chấm" → panel nhập điểm S (mockup OV-13 §3b). */
export const moCaDong = (it: WorkItem): boolean => !!it.con?.length && !laViecChamCheo(it)
  && (it.group === 'xac_nhan_pa' ? it.con.every((c) => !!c.paId)
    /* GD-20c (mockup ⑫ C1–C2): Ghi kết quả PA cùng lớp + cùng kỳ — bấm dòng mở LƯỚI (mỗi dòng một PA), thay khay "n em ▾". */
    : it.group === 'ghi_ket_qua_pa' ? it.con.every((c) => !!c.paId && c.caseId !== null)
    : it.group === 'score' ? it.con.every((c) => !!c.periodId && c.classId !== null)
    /* TUYEN-2 (mockup v27 T11a): Báo PH lớp × nguồn "n em" — bấm dòng mở panel nhiều em (khay từng em), như Phối hợp SOS cả lớp. */
    : it.group === 'bao_ph_yt' && it.con.every((c) => !!c.viecId && !!c.gopNguon));
