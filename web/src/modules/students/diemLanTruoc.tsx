import { docLayLai, kyNangLayLai, tuanLich } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * THI-LAI-1-KN (chủ SP 05/11) — em thi lại một / vài kỹ năng: ô kỹ năng em không thi lại lấy điểm KQ thi thật LẦN TRƯỚC (`thiTruoc` của GET /cycles/:id).
 * Dùng chung cho panel Kết quả thi thật (hồ sơ) và Sau thi (Công việc). Máy chủ chỉ giữ kỹ năng có điểm đúng bằng lần trước.
 */
export type KyNangThi = 'l' | 'r' | 'w' | 's';
export const KY_NANG_THI: readonly KyNangThi[] = ['l', 'r', 'w', 's'];
type ThiTruoc = Record<KyNangThi, number> & { ngay: string | null };

/** Mở form: danh sách đang lưu; không có thì ô TRỐNG của kỹ năng em KHÔNG học (môn đăng ký) tự lấy điểm lần trước; đủ môn → không tự lấy. */
export function layLaiBanDau(c: any): KyNangThi[] {
  const luu = docLayLai(c.thi_that_lay_lai);
  if (luu) return luu.kn;
  return c.thiTruoc && !c.thi_that_khong_thi ? kyNangLayLai(c.mon_dang_ky).filter((k) => c[`thi_that_${k}`] == null) : [];
}
/** Chữ của 4 ô lúc mở form: điểm đang lưu, không có thì điểm lần trước của ô lấy lại. */
export function diemBanDau(c: any, layLai: KyNangThi[], fmt: (v: number | null | undefined) => string): Record<KyNangThi, string> {
  const o = {} as Record<KyNangThi, string>;
  for (const k of KY_NANG_THI) o[k] = fmt(c[`thi_that_${k}`] ?? (layLai.includes(k) ? c.thiTruoc?.[k] : null));
  return o;
}

/** Dòng dưới 4 ô: "L · R · S: điểm lần trước · W2 SEP" và / hoặc một bấm lấy điểm lần trước cho ô còn trống. */
export function DongLanTruoc({ truoc, layLai, trong, onLay }: { truoc: ThiTruoc | null | undefined; layLai: KyNangThi[]; trong: KyNangThi[]; onLay: () => void }) {
  if (!truoc || (!layLai.length && !trong.length)) return null;
  const ten = (ds: KyNangThi[]) => ds.map((k) => k.toUpperCase()).join(' · ');
  const tuan = truoc.ngay ? tuanLich(truoc.ngay) : null;
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
      {layLai.length > 0 && <span>{t('{kn}: điểm lần trước', { kn: ten(layLai) })}{tuan ? ` · ${tuan}` : ''}</span>}
      {trong.length > 0 && (
        <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-xs font-semibold sm:min-h-0" onClick={onLay}>
          {t('Lấy điểm lần trước cho {kn}', { kn: ten(trong) })}{tuan && !layLai.length ? ` (${tuan})` : ''}
        </button>
      )}
    </p>
  );
}
