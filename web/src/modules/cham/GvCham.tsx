/**
 * GV CHẤM SPEAKING (PR-HSM, T39 · K4-24 · YC-10).
 *
 * Nằm ở: Test › Lịch Test (lưới mở tại chỗ) / trang Nhập điểm cả lớp (lưới FT) → tiêu đề cột S; điện thoại (< 640 px) → đầu
 * danh sách khi chọn chip S; hộp 4 tiêu chí S (dòng "GV chấm · Đổi"); hồ sơ Mock → khối "Nhận xét Speaking".
 *
 * "Chọn một lần" = nhớ TRÊN MÁY (localStorage) theo lớp × tuần, gửi kèm mỗi lần lưu ô S (Q3) — không bảng mới cho một lựa chọn
 * giao diện. Sửa riêng một em ở hộp 4 tiêu chí.
 */
import { useState } from 'react';
import { nguoiThanhPayload, type NguoiChon } from '@shared/domain/index.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { MuiTenGap } from '../yThuc/NhanViPham.tsx';
import { useSession } from '../../lib/session.tsx';

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

/** Ô nhớ trên máy: người dùng × lớp × tuần (PR-S4F #10 — máy dùng chung: đổi tài khoản không kế thừa lựa chọn của người trước). */
export const khoaGvChamCot = (userId: number | null | undefined, classId: number | null | undefined, periodId: number | null | undefined) =>
  userId && classId && periodId ? `pisa:gv-cham:${userId}:${classId}:${periodId}` : null;

/**
 * GV chấm mặc định của cột S — lớp × tuần, nhớ trên máy. Không có/hỏng → CHÍNH người đang xem (Q3, PR-LT3, chủ sản phẩm 06/10: Speaking
 * Mock không có GV mặc định — người lưu không đổi thì ghi chính người đó, trễ tính cho người đó).
 */
export function useGvChamCot(classId: number | null | undefined, periodId: number | null | undefined) {
  const { session } = useSession();
  const khoa = khoaGvChamCot(session?.user?.id, classId, periodId);
  const doc = (): NguoiChon | null => {
    const macDinh: NguoiChon = { kieu: 'toi' };
    if (!khoa) return macDinh;
    try {
      const v = JSON.parse(localStorage.getItem(khoa) ?? 'null');
      return v && (v.kieu === 'toi' || (v.kieu === 'tai_khoan' && v.id) || (v.kieu === 'ngoai' && v.ten)) ? v : macDinh;
    } catch { return macDinh; }
  };
  const [gt, setGt] = useState<{ khoa: string | null; v: NguoiChon | null }>(() => ({ khoa, v: doc() }));
  /* Đổi tuần/lớp thì đọc lại đúng ô nhớ của lớp × tuần mới. */
  const v = gt.khoa === khoa ? gt.v : doc();
  const dat = (moi: NguoiChon | null) => {
    setGt({ khoa, v: moi });
    if (!khoa) return;
    try { if (moi) localStorage.setItem(khoa, JSON.stringify(moi)); else localStorage.removeItem(khoa); } catch { /* chế độ riêng tư: chỉ nhớ trong phiên */ }
  };
  return [v, dat] as const;
}

const GOI_Y_COT = 'Áp cho các bài Speaking lưu sau đó ở lớp này, tuần này. Sửa riêng một em trong hộp tiêu chí.';

/** Tên ngắn để hiện trên nút: "Tôi", tên tài khoản, tên người ngoài. */
export function tenNgan(v: NguoiChon | null): string | null {
  if (!v) return null;
  return v.kieu === 'toi' ? 'Tôi' : v.ten;
}

/**
 * NÚT "GV chấm: {tên} ▾" — gọn, dưới chữ "S (band)" của tiêu đề cột (máy tính) hoặc đầu danh sách (điện thoại, `lon`).
 * Luôn ghi "GV chấm: {tên thật}" (mockup HK2 J9): "Tôi" hiện bằng tên tài khoản. Tên dài xuống dòng (không cắt); tooltip có đủ tên.
 * Bấm mở hộp nhỏ chọn người (`ChonNguoi nhom="nhan_vien" choNgoai`).
 */
export function NutGvCham({ value, onChange, lon = false, goiY = GOI_Y_COT }: {
  value: NguoiChon | null; onChange: (v: NguoiChon | null) => void; lon?: boolean;
  /** Câu giải thích dưới ô chọn — cột S (mặc định) hay một bài (hồ sơ Mock). */
  goiY?: string;
}) {
  const [mo, setMo] = useState(false);
  const { session } = useSession();
  const ten = value?.kieu === 'toi' ? session?.user?.fullName ?? 'Tôi' : tenNgan(value);
  const cut = ten ? ten.lastIndexOf(' ') + 1 : 0;   // từ cuối dính mũi tên: mũi tên không rơi xuống dòng riêng
  const dau = ten ? ten.slice(0, cut) : '', cuoi = ten ? ten.slice(cut) : <span className="text-slate-500">chưa chọn</span>;
  return (
    <>
      <button type="button" onClick={() => setMo(true)} aria-haspopup="dialog"
        title={`GV chấm Speaking: ${ten ?? 'chưa chọn'} — ${goiY}`} aria-label={`GV chấm Speaking: ${ten ?? 'chưa chọn'}`}
        className={`inline-flex max-w-full items-start gap-1 text-left font-normal normal-case tracking-normal text-xs text-slate-400 hover:text-slate-200 ${lon ? 'min-h-[44px] items-center px-1' : 'max-sm:py-3 max-sm:-my-3'}`}>
        {/* Mũi tên cùng dòng chữ (không phải cột flex riêng): ô S hẹp nên tên xuống dòng chiếm trọn bề rộng. */}
        <span className="min-w-0 whitespace-normal break-words">{'GV chấm: '}{dau}<span className="whitespace-nowrap">{cuoi}{' '}<span className="inline-block align-middle text-slate-500"><MuiTenGap mo /></span></span></span>
      </button>
      {/* I4 (PR-SL): khung panel chung. Chọn là lưu ngay (nhớ trên máy) → chân chỉ có "Xong". Mở được từ trong panel khác → `longTrong`. */}
      {mo && (
        <KhungPanel tieuDe="GV chấm Speaking" longTrong z="z-[60]" onDong={() => setMo(false)}
          chan={{ huy: { nhan: 'Xong', onClick: () => setMo(false) } }}>
          <div className="space-y-2 pt-3">
            <ChonNguoi value={value} onChange={(v) => { onChange(v); }} nhom="nhan_vien" choNgoai ariaLabel="GV chấm Speaking" />
            <p className="m-0 text-xs text-slate-400">{goiY}</p>
          </div>
        </KhungPanel>
      )}
    </>
  );
}

/** Dòng "GV chấm: {tên} · Đổi" trong hộp 4 tiêu chí / hồ sơ Mock — `ChonNguoi` có sẵn nút "Đổi". */
export function DongGvCham({ value, onChange, disabled }: { value: NguoiChon | null; onChange: (v: NguoiChon | null) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-slate-400">GV chấm</span>
      <div className="min-w-0 flex-1">
        <ChonNguoi value={value} onChange={onChange} nhom="nhan_vien" choNgoai macDinhTrong="Chưa chọn" ariaLabel="GV chấm Speaking" disabled={disabled} />
      </div>
    </div>
  );
}
