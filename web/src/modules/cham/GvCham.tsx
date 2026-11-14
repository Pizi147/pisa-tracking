/**
 * GV CHẤM SPEAKING (PR-HSM, T39 · K4-24 · YC-10).
 *
 * Nằm ở: Test › Lịch Test (lưới mở tại chỗ) / trang Nhập điểm cả lớp (lưới FT) → tiêu đề cột S; điện thoại (< 640 px) → đầu
 * danh sách khi chọn chip S; hộp 4 tiêu chí S (dòng "GV chấm · Đổi"); hồ sơ Mock → khối "Nhận xét Speaking".
 *
 * "Chọn một lần" = nhớ Ở MÁY CHỦ theo người × lớp × đợt (LG-5c, `gv_cham_cot`), gửi kèm mỗi lần lưu ô S (Q3). Sửa riêng một em ở hộp 4 tiêu chí.
 */
import { useState } from 'react';
import { nguoiThanhPayload, type NguoiChon } from '@shared/domain/index.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { MuiTenGap } from '../yThuc/NhanViPham.tsx';
import { useSession } from '../../lib/session.tsx';
import { api } from '../../lib/api.ts';
import { t } from '@shared/i18n/index.ts';

/** GV chấm đã lưu của một ô (máy chủ) → giá trị của ô chọn người. */
export const gvChamThanhChon = (g: { userId: number | null; ten: string } | null | undefined): NguoiChon | null =>
  !g ? null : g.userId ? { kieu: 'tai_khoan', id: g.userId, ten: g.ten } : { kieu: 'ngoai', ten: g.ten };

/** Lệnh gửi máy chủ (`gvCham` của `PUT /attempts/:id/scores/speaking`); `null` = xoá. */
export const gvChamPayload = (v: NguoiChon | null) => (v ? nguoiThanhPayload(v) : null);

/** Hai lựa chọn có trỏ cùng một người không (để chỉ gửi khi đổi). "Tôi" so bằng id người đang đăng nhập. */
export function cungGvCham(a: NguoiChon | null, b: NguoiChon | null, toiId: number | null | undefined): boolean {
  const khoa = (v: NguoiChon | null) => (!v ? '' : v.kieu === 'toi' ? `u${toiId ?? ''}` : v.kieu === 'tai_khoan' ? `u${v.id}` : `n${v.ten.trim()}`);
  return khoa(a) === khoa(b);
}

/**
 * GV chấm mặc định của cột S — người xem × lớp × đợt (đợt = id tuần hoặc "mt{n}", `dotGvCham`), NHỚ Ở MÁY CHỦ (LG-5c, chủ SP 13/11 — thay ô nhớ trên trình duyệt:
 * đổi máy / trình duyệt vẫn còn; máy dùng chung không kế thừa lựa chọn người trước). Giá trị đầu đọc kèm lưới (`FtSheet.gvChamCot`, 0 request thêm):
 * chưa chọn → GV Speaking "Tôi", người khác "chưa chọn" (2.4). Đổi = một PUT; lỗi thì trả về lựa chọn cũ (không giả là đã nhớ).
 */
export function useGvChamCot(classId: number | null | undefined, dot: string | null | undefined, tuMayChu: NguoiChon | null | undefined) {
  const khoa = classId && dot ? `${classId}:${dot}` : null;
  const [gt, setGt] = useState<{ khoa: string | null; v: NguoiChon | null }>(() => ({ khoa, v: tuMayChu ?? null }));
  /* Đổi tuần/MT/lớp: giá trị máy chủ của đúng đợt mới. */
  const v = gt.khoa === khoa ? gt.v : tuMayChu ?? null;
  const dat = (moi: NguoiChon | null) => {
    const cu = v;
    setGt({ khoa, v: moi });
    if (!classId || !dot) return;
    const gv = !moi ? null : moi.kieu === 'toi' ? { kieu: 'toi' } : moi.kieu === 'tai_khoan' ? { kieu: 'tai_khoan', id: moi.id } : { kieu: 'ngoai', ten: moi.ten };
    api.put('/cham/gv-cham-cot', { classId, dot, gv }).catch(() => setGt({ khoa, v: cu }));
  };
  return [v, dat] as const;
}

const GOI_Y_COT = t('Áp cho các bài Speaking lưu sau đó ở lớp này, tuần này. Sửa riêng một em trong hộp tiêu chí.');
/** Điểm theo lớp xem theo MT (VIEC-NHO-2): nhớ theo lớp × MT. */
export const GOI_Y_COT_MT = t('Áp cho các bài Speaking lưu sau đó ở lớp này, MT này. Sửa riêng một em trong hộp tiêu chí.');

/** Tên ngắn để hiện trên nút: "Tôi", tên tài khoản, tên người ngoài. */
export function tenNgan(v: NguoiChon | null): string | null {
  if (!v) return null;
  return v.kieu === 'toi' ? t('Tôi') : v.ten;
}

/**
 * NÚT "GV chấm: {tên} ▾" — gọn, dưới chữ "S (band)" của tiêu đề cột (máy tính) hoặc đầu danh sách (điện thoại, `lon`).
 * Luôn ghi "GV chấm: {tên thật}" (mockup HK2 J9): "Tôi" hiện bằng tên tài khoản. Tên dài xuống dòng (không cắt); tooltip có đủ tên.
 * Bấm mở hộp nhỏ chọn người (`ChonNguoi nhom="gv_speaking" choNgoai` — GV Speaking theo N7, L4).
 */
export function NutGvCham({ value, onChange, lon = false, hang = false, oChon = false, goiY = GOI_Y_COT, nhan = t('GV chấm') }: {
  /** Chữ trước tên (lưới FT: "GV chấm S" — nút nằm trên bảng, không trong đầu cột S). */
  nhan?: string;
  value: NguoiChon | null; onChange: (v: NguoiChon | null) => void; lon?: boolean;
  /** VIEC-NHO-2 (điện thoại, dưới hàng chip): hàng "GV chấm S [tên ▾]" — nhãn + ô có viền cao 44 px như ô chọn khác. */
  hang?: boolean;
  /** GD-11a (⑦ A3 `.gvs`, lời 17): ô chọn có tìm NGAY TẠI CHỖ ("GV chấm S [ô 300 px]") — không mở panel; GV Speaking chi nhánh trước. */
  oChon?: boolean;
  /** Câu giải thích dưới ô chọn — cột S (mặc định) hay một bài (hồ sơ Mock). */
  goiY?: string;
}) {
  const [mo, setMo] = useState(false);
  const { session } = useSession();
  const ten = value?.kieu === 'toi' ? session?.user?.fullName ?? t('Tôi') : tenNgan(value);
  const cut = ten ? ten.lastIndexOf(' ') + 1 : 0;   // từ cuối dính mũi tên: mũi tên không rơi xuống dòng riêng
  const dau = ten ? ten.slice(0, cut) : '', cuoi = ten ? ten.slice(cut) : <span className="text-slate-500">{t('chưa chọn')}</span>;
  const dong = () => setMo(false);   // DON-CHU: một hàm cho ✕ và "Xong" — nút chân đi chung đường hỏi của KhungPanel
  const panel = mo && (
    /* I4 (PR-SL): khung panel chung. Chọn là lưu ngay (nhớ trên máy) → chân chỉ có "Xong". Mở được từ trong panel khác → `longTrong`. */
    <KhungPanel tieuDe={t('GV chấm Speaking')} longTrong z="z-[60]" onDong={dong}
      chan={{ huy: { nhan: t('Xong'), onClick: dong } }}>
      <div className="space-y-2 pt-3">
        <ChonNguoi value={value} onChange={(v) => { onChange(v); }} nhom="gv_speaking" choNgoai ariaLabel={t('GV chấm Speaking')} />
        <p className="m-0 text-xs text-slate-400">{goiY}</p>
      </div>
    </KhungPanel>
  );
  if (oChon) {
    return (
      <div className="flex items-center gap-2.5" title={goiY}>
        <span className="whitespace-nowrap text-[13px] font-semibold text-dim">{nhan}</span>
        <div className="w-[300px] max-w-full"><ChonNguoi value={value} onChange={(v) => onChange(v)} nhom="gv_speaking" choNgoai ariaLabel={nhan} /></div>
      </div>
    );
  }
  if (hang) {
    return (
      <div className="flex items-center gap-2.5 px-3 pb-2">
        <span className="whitespace-nowrap text-xs font-bold text-slate-300">{nhan}</span>
        <button type="button" onClick={() => setMo(true)} aria-haspopup="dialog" title={`${goiY}`}
          aria-label={`${nhan}: ${ten ?? t('chưa chọn')}`} className="field flex min-h-[44px] min-w-0 flex-1 items-center gap-1.5 py-2 text-left text-sm">
          {/* Tên dài xuống dòng, không cắt. */}
          <span className="min-w-0 flex-1 whitespace-normal break-words">{ten ?? <span className="text-slate-500">{t('chưa chọn')}</span>}</span>
          <span aria-hidden className="shrink-0 text-slate-500"><MuiTenGap mo /></span>
        </button>
        {panel}
      </div>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setMo(true)} aria-haspopup="dialog"
        title={t('GV chấm Speaking: {x} — {goiY}', { x: ten ?? t('chưa chọn'), goiY })} aria-label={t('GV chấm Speaking: {x}', { x: ten ?? t('chưa chọn') })}
        className={`inline-flex max-w-full items-start gap-1 text-left font-normal normal-case tracking-normal text-xs text-slate-400 hover:text-slate-200 ${lon ? 'min-h-[44px] items-center px-1' : 'max-sm:py-3 max-sm:-my-3'}`}>
        {/* Mũi tên cùng dòng chữ (không phải cột flex riêng): ô S hẹp nên tên xuống dòng chiếm trọn bề rộng. */}
        <span className="min-w-0 whitespace-normal break-words">{`${nhan}: `}{dau}<span className="whitespace-nowrap">{cuoi}{' '}<span className="inline-block align-middle text-slate-500"><MuiTenGap mo /></span></span></span>
      </button>
      {panel}
    </>
  );
}

