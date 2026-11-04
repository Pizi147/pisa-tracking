import { NhanTrangThai } from '../../ui/ui.tsx';
import { ViecTiep } from '../../ui/ViecTiep.tsx';
import { TheDong } from '../../ui/TheDong.tsx';
import { KhoaQuyChe, TenCase } from '../cases/SkillBoard.tsx';
import { viecTiepCuaEm, type HangKyNang, type ViecTiepCase } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/*
 * DÒNG CASE THEO KỸ NĂNG (trước là bảng cách xem "Cần hỗ trợ" — bỏ: FT 03/11 U03, lớp thường 04/11). Còn dùng: mở rộng một em ở bảng lớp thường
 * (`BangDiemLopThuong` › `MoRongThuong`) và hồ sơ MT (`MockDetailPage`).
 */
type PaCase = { id: number; ten: string; batBuoc: boolean; choXacNhan: boolean; choDuyet: boolean; xong: boolean; nguoi: string | null; mocChu: string | null };
export type CaseCua = {
  id: number; studentId: number; topic: string | null; sosLevel: number | null; tieuDe: string;
  tenSos: { mt: number | null; giua: string; sos: number | null } | null;
  nguyenNhan: string | null; moTu: string; trangThai: { k: string; t: any; chu: string; han: string | null };
  viecTiep: ViecTiepCase | null; quaHan: boolean; pas: PaCase[]; banGiaoTu: string | null;
  /** OV-12d (hồ sơ MT): Case trượt lại ở lượt đang xem — MT của lượt gốc ("lặp từ MT1"). */
  lapTu?: number | null;
};
/** `GET /classes/:id/can-ho-tro` (server/src/classes/canHoTro.ts) — lớp thường đọc khi mở một em (BangDiemLopThuong). */
export type CanHoTro = {
  ct: string | null; boMon: string[]; kyNangToi: string[]; laGvbmThuan: boolean;
  tong: { soEm: number; soCase: number; choDuyet: number; quaHan: number };
  em: { id: number; ten: string; ma: string; cases: CaseCua[] }[];
};
/** Lưới bốn cột thẳng nhau giữa mọi khối: Kỹ năng · Case · Phương án đang làm · Việc tiếp + hạn. */
export const LUOI = 'md:grid md:grid-cols-[3.5rem_minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,1fr)] md:gap-x-3';
/** OV-10b: TVV / CX / Admin chỉ đọc — bỏ cột Việc tiếp (việc của GV / QL). */
export const LUOI_DOC = 'md:grid md:grid-cols-[3.5rem_minmax(0,1.5fr)_minmax(0,1.2fr)] md:gap-x-3';

/** Một dòng Case trong hàng kỹ năng: Kỹ năng (chỉ dòng đầu) · Case · Phương án đang làm · Việc tiếp + hạn. OV-12d: dùng lại ở hồ sơ MT. */
export function DongCase({ h, c, dau, ct, homNay, onMo, the = false, chiDoc = false }: {
  h: HangKyNang<CaseCua>; c: CaseCua; dau: boolean; ct: string | null; homNay: string; chiDoc?: boolean;
  /** Điện thoại (D2): mỗi Case của hàng kỹ năng là một `TheDong` (mockup M4 "trên điện thoại"). */
  the?: boolean;
  onMo: (viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa', paId?: number) => void;
}) {
  const [viec] = viecTiepCuaEm({ nhapDiem: null, cases: [{ caseId: c.id, topic: c.topic, viecTiep: c.viecTiep }], yThuc: null, homNay, chuongTrinh: ct });
  const d = viec?.dich?.loai === 'case' ? viec.dich : null;
  /* So trên chữ GỐC của máy chủ (`viecTiep.chu`, tiếng Việt) — `viec.viec` đã theo tiếng của trang. */
  const goc = c.viecTiep?.chu ?? '';
  const loai = !viec ? undefined : goc.startsWith('Xác nhận Case') || goc.startsWith('Mô tả Case') ? 'xac-nhan' as const
    : goc.startsWith('Xác nhận PA') ? 'xac-nhan-pa' as const : d?.ghiKetQua && d.paId != null ? 'ghi-ket-qua' as const : undefined;
  const dangLam = c.pas.filter((p) => !p.xong);
  const cacPa = dangLam.length === 0 ? <span className="text-slate-500">—</span> : dangLam.map((p) => (
    <span key={p.id} className="block" data-pa-id={p.id}>
      <span className="text-slate-200">{p.batBuoc && <span title={t('PA theo quy chế')} className="mr-1 inline-flex align-middle"><KhoaQuyChe /></span>}{p.ten}</span>
      {p.choXacNhan ? <span className="text-slate-500"> · {t('Chờ xác nhận')}</span>
        : p.choDuyet ? <span className="text-slate-500"> · {t('Chờ Quản lý duyệt')}</span>
        : <span className="text-slate-500">{[p.nguoi, p.mocChu && dich(p.mocChu)].filter(Boolean).map((x) => ` · ${x}`).join('')}</span>}
    </span>
  ));
  const cauViec = viec ? <ViecTiep v={viec} onBam={() => onMo(loai, d?.paId)} /> : <span className="text-slate-500">—</span>;
  const lap = c.lapTu ? <span className="text-slate-400">{t('lặp từ MT{n}', { n: c.lapTu })}</span> : null;
  if (the) {
    return (
      <TheDong
        dau={(
          <span className="block min-w-0">
            <span className="text-xs font-semibold text-slate-300" title={h.tenDu}>{h.nhan}</span>{' · '}
            <button type="button" className="link cursor-pointer border-0 bg-transparent p-0 text-left text-xs font-semibold" title={c.tieuDe}
              onClick={() => onMo()}><TenCase c={{ title: c.tieuDe, tenSos: c.tenSos }} /></button>
            {(c.nguyenNhan || c.moTu) && <span className="block text-[12px] text-slate-500">{[c.nguyenNhan && dich(c.nguyenNhan), c.moTu && dich(c.moTu)].filter(Boolean).join(' · ')}</span>}
          </span>
        )}
        dong={[
          { nhan: t('Trạng thái'), noiDung: (
            <span className="flex flex-wrap items-center gap-x-1.5"><NhanTrangThai t={c.trangThai.t} title={dich(c.trangThai.chu)} />
              {c.banGiaoTu && <span className="text-slate-500" title={t('Case bàn giao')}>{t('từ {lop}', { lop: c.banGiaoTu })}</span>}{lap}</span>
          ) },
          { nhan: 'PA', noiDung: <span className="text-[12px]">{cacPa}</span> },
          ...(chiDoc ? [] : [{ nhan: t('Việc tiếp'), noiDung: cauViec }]),
        ]} />
    );
  }
  return (
    <div className={`px-3 py-2 ${chiDoc ? LUOI_DOC : LUOI}`}>
      <span className={`text-xs font-semibold text-slate-300 ${dau ? '' : 'md:invisible'}`} title={h.tenDu}>{h.nhan}</span>
      <span className="min-w-0">
        <button type="button" className="link block max-w-full cursor-pointer truncate border-0 bg-transparent p-0 text-left text-xs font-semibold" title={c.tieuDe}
          onClick={() => onMo()}><TenCase c={{ title: c.tieuDe, tenSos: c.tenSos }} /></button>
        {(c.nguyenNhan || c.moTu) && <span className="block text-[12px] text-slate-500">{[c.nguyenNhan && dich(c.nguyenNhan), c.moTu && dich(c.moTu)].filter(Boolean).join(' · ')}</span>}
        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
          <NhanTrangThai t={c.trangThai.t} title={dich(c.trangThai.chu)} />
          {c.banGiaoTu && <span title={t('Case bàn giao')}>{t('từ {lop}', { lop: c.banGiaoTu })}</span>}{lap}
        </span>
      </span>
      <span className="min-w-0 text-[12px] text-slate-300">{cacPa}</span>
      {!chiDoc && <span className="min-w-0">{cauViec}</span>}
    </div>
  );
}
