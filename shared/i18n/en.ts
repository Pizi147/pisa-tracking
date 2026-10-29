/**
 * Từ điển tiếng Anh. KHOÁ = CHÍNH CHỮ VIỆT đang hiện trên web (kể cả `{biến}`): bản Việt không thể lệch khỏi khoá, `t()` có kiểu
 * `keyof typeof EN` nên tsc báo mọi chữ chưa có bản Anh. Mỗi đợt PR-EN một file vùng (`en/a.ts`…) — bốn PR nối tiếp không đè nhau.
 * Chữ theo `thiet-ke/THUAT_NGU_EN.md`.
 */
import { EN_A } from './en/a.ts';
import { EN_B } from './en/b.ts';
import { EN_C } from './en/c.ts';
import { EN_F } from './en/f.ts';
import { EN_D } from './en/d.ts';
import { EN_OV12E } from './en/ov12e.ts';
import { EN_HD } from './en/hd.ts';
import { EN_HDB } from './en/hdb.ts';
import { EN_OV13B } from './en/ov13b.ts';
import { EN_OV13C } from './en/ov13c.ts';
import { EN_OV13G } from './en/ov13g.ts';
import { EN_OV13K } from './en/ov13k.ts';
import { EN_OV13D } from './en/ov13d.ts';
import { EN_OV13J } from './en/ov13j.ts';
import { EN_OV13L } from './en/ov13l.ts';
import { EN_OV13M } from './en/ov13m.ts';
import { EN_OV13O } from './en/ov13o.ts';
import { EN_UX1 } from './en/ux1.ts';
import { EN_UX2 } from './en/ux2.ts';
import { EN_OV13Q } from './en/ov13q.ts';
import { EN_ENE } from './en/ene.ts';
import { EN_OV14A } from './en/ov14a.ts';
import { EN_OV14C } from './en/ov14c.ts';
import { EN_OV15A } from './en/ov15a.ts';
import { EN_OV15B } from './en/ov15b.ts';
import { EN_OV15D } from './en/ov15d.ts';
import { EN_OV15C } from './en/ov15c.ts';
import { EN_OV15E } from './en/ov15e.ts';
import { EN_NEN_V5 } from './en/nenV5.ts';
import { EN_NEN_PANEL } from './en/nenPanel.ts';
import { EN_PILOT_CASE } from './en/pilotCase.ts';
import { EN_PILOT_VIEC } from './en/pilotViec.ts';
import { EN_PILOT_GV_TRE } from './en/pilotGvTre.ts';
import { EN_PANEL_AP } from './en/panelAp.ts';
import { EN_UI_Y_THUC_LOP } from './en/uiYThucLop.ts';
import { EN_UI_Y_THUC_HV } from './en/uiYThucHv.ts';
import { EN_KHAI_BAC_LO } from './en/khaiBacLo.ts';
import { EN_UI_CONG_VIEC } from './en/uiCongViec.ts';
import { EN_UI_HO_SO_LOP } from './en/uiHoSoLop.ts';
import { EN_UI_CV_TVV } from './en/uiCvTvv.ts';
import { EN_LUAT_NX_MT } from './en/luatNxMt.ts';
import { EN_KHT_GON } from './en/khtGon.ts';
import { EN_Q_RL2A } from './en/qRl2a.ts';
import { EN_V8_PT_TEST_SOS } from './en/v8PtTestSos.ts';
import { EN_V8_PT_KET_QUA } from './en/v8PtKetQua.ts';
import { EN_V8_PT_PA_Y_THUC } from './en/v8PtPaYThuc.ts';
import { EN_V8_PT_BAO_CAO_GV } from './en/v8PtBaoCaoGv.ts';
import { EN_V8_CONG_VIEC } from './en/v8CongViec.ts';
import { EN_SV_NX_CASE } from './en/svNxCase.ts';
import { EN_R1_EN, EN_R1_EN_MAU } from './en/r1En.ts';
import { EN_R1_EN_LOI } from './en/r1EnLoi.ts';
import { EN_HSL_MAY_CHU } from './en/hslMayChu.ts';
import { EN_HSL_FT } from './en/hslFt.ts';
import { EN_HSL_LT } from './en/hslLt.ts';
import { EN_OV15F } from './en/ov15f.ts';
import { EN_OV15H1 } from './en/ov15h1.ts';   // OV-15h1
import { EN_OV15H2 } from './en/ov15h2.ts';
import { EN_TU } from './en/tu.ts';
import { EN_TUB } from './en/tub.ts';
import { EN_BAND_QUY_DOI } from './en/bandQuyDoi.ts';
import { EN_LUAT34 } from './en/luat34.ts';
import { EN_LUAT5 } from './en/luat5.ts';
import { EN_OV15G } from './en/ov15g.ts';
import { EN_CV_LOI } from './en/cvLoi.ts';
import { EN_CASE_NHIEU } from './en/caseNhieu.ts';
import { EN_SL1 } from './en/sl1.ts';
import { EN_SL2 } from './en/sl2.ts';
import { EN_KHUNG_LOI } from './en/khungLoi.ts';
import { EN_CHU_THI } from './en/chuThi.ts';
import { EN_SV_SO2 } from './en/svSo2.ts';
import { EN_SV_SO3 } from './en/svSo3.ts';
import { EN_UI_HV_LOP } from './en/uiHvLop.ts';
import { EN_UI_HO_SO_HV } from './en/uiHoSoHv.ts';
import { EN_UI_CHART_D } from './en/uiChartD.ts';
import { EN_UI_HO_SO_HV_2 } from './en/uiHoSoHv2.ts';
import { EN_UI_TONG_QUAN } from './en/uiTongQuan.ts';
import { EN_SUA_CHAM_LAI } from './en/suaChamLai.ts';
import { EN_P1_DIEM_TIEU_CHI } from './en/p1DiemTieuChi.ts';
import { EN_P11_VIEC_DUNG_VAI } from './en/p11ViecDungVai.ts';
import { EN_HV_LOP_SUA } from './en/hvLopSua.ts';
import { EN_P6_KHOA_LICH } from './en/p6KhoaLich.ts';
import { EN_P9A_XET_LAI } from './en/p9aXetLai.ts';
import { EN_P7_SV_LO_TRINH } from './en/p7SvLoTrinh.ts';
import { EN_P8_MON_DANG_KY } from './en/p8MonDangKy.ts';
import { EN_P14_DICH } from './en/p14Dich.ts';
import { EN_P13_KET_PET } from './en/p13KetPet.ts';
import { EN_P9B_CUOI_KHOA } from './en/p9bCuoiKhoa.ts';
import { EN_TL_V5 } from './en/tlV5.ts';
import { EN_SV_TQ_GV } from './en/svTqGv.ts';
import { EN_UI_HO_SO_GV } from './en/uiHoSoGv.ts';
import { EN_UI_PHAN_TICH } from './en/uiPhanTich.ts';
import { EN_UI_CON_LAI } from './en/uiConLai.ts';
import { EN_UI_CHAM_TEST } from './en/uiChamTest.ts';
import { EN_UI_LICH_TUAN } from './en/uiLichTuan.ts';
import { EN_R1_LUU_TIEP } from './en/r1LuuTiep.ts';
import { EN_CONG_VIEC_2 } from './en/congViec2.ts';
import { EN_R1_NO_NHO } from './en/r1NoNho.ts';
import { EN_TEN_CHI_SO } from './en/tenChiSo.ts';
import { EN_R1_NO_CU } from './en/r1NoCu.ts';
import { EN_R1_EN_2B } from './en/r1En2b.ts';

/** Giá trị biến: chữ / số, hoặc một chữ máy chủ dựng có khoá riêng (`ChuKhoa`, lồng được) — PR-EN-c. null / undefined in ra như chuỗi
 *  ghép `${x}` cũ (giữ đúng chữ bản Việt) — PR-EN-b. */
export type Bien = Record<string, string | number | ChuKhoa | null | undefined>;
/** PR-EN-c: chữ máy chủ dựng — câu Việt (`chu`) + khoá + biến để web dịch (`dichChu`). Không khoá = câu không biến, dịch theo chính `chu`. */
export type ChuKhoa = { chu: string; khoa?: string; bien?: Bien };
/** Chữ thường, hoặc hàm khi cần số ít / số nhiều. */
export type Dich = string | ((b: Bien) => string);

export const EN = { ...EN_A, ...EN_B, ...EN_C, ...EN_F, ...EN_D, ...EN_OV12E, ...EN_HD, ...EN_HDB, ...EN_OV13B, ...EN_OV13C, ...EN_OV13D, ...EN_OV13G, ...EN_OV13J, ...EN_OV13L, ...EN_OV13K, ...EN_OV13M, ...EN_OV13O, ...EN_UX1, ...EN_UX2, ...EN_OV13Q, ...EN_ENE, ...EN_OV14A, ...EN_OV14C, ...EN_OV15A, ...EN_OV15C, ...EN_OV15D, ...EN_OV15E, ...EN_OV15F, ...EN_OV15B, ...EN_TU, ...EN_TUB, ...EN_OV15H2, ...EN_OV15G, ...EN_OV15H1, ...EN_LUAT5, ...EN_KHUNG_LOI, ...EN_CV_LOI, ...EN_CASE_NHIEU, ...EN_SL1, ...EN_LUAT34, ...EN_SL2, ...EN_NEN_V5, ...EN_SV_SO2, ...EN_SV_SO3, ...EN_CHU_THI, ...EN_NEN_PANEL, ...EN_UI_CONG_VIEC, ...EN_UI_CHAM_TEST, ...EN_UI_LICH_TUAN, ...EN_UI_CV_TVV, ...EN_LUAT_NX_MT, ...EN_UI_HO_SO_LOP, ...EN_SV_NX_CASE, ...EN_UI_HV_LOP, ...EN_UI_HO_SO_HV, ...EN_UI_TONG_QUAN, ...EN_UI_HO_SO_GV, ...EN_UI_PHAN_TICH, ...EN_SV_TQ_GV, ...EN_UI_CON_LAI, ...EN_TL_V5, ...EN_SUA_CHAM_LAI, ...EN_P1_DIEM_TIEU_CHI, ...EN_P6_KHOA_LICH, ...EN_P7_SV_LO_TRINH, ...EN_P14_DICH, ...EN_P11_VIEC_DUNG_VAI, ...EN_P9B_CUOI_KHOA, ...EN_P9A_XET_LAI, ...EN_P13_KET_PET, ...EN_R1_LUU_TIEP, ...EN_P8_MON_DANG_KY, ...EN_R1_EN, ...EN_R1_EN_MAU, ...EN_R1_EN_LOI, ...EN_R1_NO_CU, ...EN_R1_NO_NHO, ...EN_R1_EN_2B, ...EN_TEN_CHI_SO, ...EN_HSL_MAY_CHU, ...EN_HSL_FT, ...EN_HSL_LT, ...EN_HV_LOP_SUA, ...EN_CONG_VIEC_2, ...EN_UI_CHART_D, ...EN_PILOT_CASE, ...EN_UI_HO_SO_HV_2, ...EN_PILOT_GV_TRE, ...EN_PILOT_VIEC, ...EN_PANEL_AP, ...EN_UI_Y_THUC_LOP, ...EN_BAND_QUY_DOI, ...EN_UI_Y_THUC_HV, ...EN_KHAI_BAC_LO, ...EN_KHT_GON, ...EN_Q_RL2A, ...EN_V8_PT_TEST_SOS, ...EN_V8_PT_KET_QUA, ...EN_V8_PT_PA_Y_THUC, ...EN_V8_PT_BAO_CAO_GV, ...EN_V8_CONG_VIEC };
/** R1-EN-2: khoá chỉ dùng qua t() — `dich()` không lấy làm mẫu (xem `EN_R1_EN`). */
export const KHOA_CHI_T: ReadonlySet<string> = new Set(Object.keys(EN_R1_EN));
