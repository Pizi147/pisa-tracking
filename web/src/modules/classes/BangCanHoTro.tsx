import { NutLuat } from '../../ui/NutLuat.tsx';
import { NhanVienCase, QuaHan } from '../../ui/Nhan.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { KhoaQuyChe, TenCase } from '../cases/SkillBoard.tsx';
import { viecTiepCuaEm, type HangKyNang, type ViecTiepCase } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/*
 * DÒNG CASE THEO KỸ NĂNG — mở rộng một em ở bảng lớp thường (`BangDiemLopThuong` › `MoRongThuong`).
 * HSL-THUONG (mockup HSL-THUONG trong `thiet-ke/`, chủ SP duyệt 09/11): TÁCH TRƯỜNG — mỗi loại thông tin một cột
 * Môn · Case · Trạng thái (viên) · Phương án (một dòng ngắn + ⓘ) · Phụ trách PA · Việc tiếp (nút) · Hạn; 375 xếp dọc cùng thứ tự.
 */
type PaCase = { id: number; ten: string; batBuoc: boolean; choXacNhan: boolean; choDuyet: boolean; xong: boolean; nguoi: string | null; mocChu: string | null };
export type CaseCua = {
  id: number; studentId: number; topic: string | null; sosLevel: number | null; tieuDe: string;
  tenSos: { mt: number | null; giua: string; sos: number | null } | null;
  /** `urgency` (mã) · `moTu` = chữ mức gấp (tên giữ để không đổi hợp đồng API — `server/src/cases/caseLop.ts`). */
  nguyenNhan: string | null; urgency?: string | null; moTu: string; trangThai: { k: string; t: any; chu: string; han: string | null };
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
/** Lưới cột (mockup `.kc-luoi`): Môn 48 · Case · Trạng thái 104 · Phương án · Phụ trách 140 · Việc tiếp 168 · Hạn 120. Chỉ đọc (TVV / CX): bỏ hai cột cuối. */
export const LUOI = 'md:grid md:grid-cols-[48px_minmax(0,1.55fr)_104px_minmax(0,1.65fr)_140px_168px_120px] md:items-center md:gap-x-4';
export const LUOI_DOC = 'md:grid md:grid-cols-[48px_minmax(0,1.6fr)_112px_minmax(0,1.6fr)_170px] md:items-center md:gap-x-4';

/** Hàng nhãn cột trên các dòng Case (mockup `.kc-h`) — chữ 12 mờ, không điều khiển. */
export function NhanCotCase({ chiDoc }: { chiDoc: boolean }) {
  return (
    <div aria-hidden className={`border-b pb-1.5 pt-0.5 text-xs font-medium text-faint max-md:hidden ${chiDoc ? LUOI_DOC : LUOI}`} style={{ borderColor: 'var(--line)' }}>
      <span>{t('Môn')}</span><span>Case</span><span>{t('Trạng thái')}</span><span>{t('Phương án')}</span><span>{t('Phụ trách PA')}</span>
      {!chiDoc && <><span>{t('Việc tiếp')}</span><span className="text-right">{t('Hạn')}</span></>}
    </div>
  );
}

/* Viên trạng thái (`NhanVienCase`). Tên = tên trạng thái chung (PTA 08/11: "Chờ xác nhận", một khái niệm một tên); câu đủ ở title. */
function VienTrangThai({ tt }: { tt: CaseCua['trangThai'] }) {
  const chu = tt.t === 'cho-duyet' ? t('Chờ duyệt') : dich(tt.chu).split(' · ')[0].replace(/ Case$/, '');
  return <NhanVienCase tt={tt.t} title={dich(tt.chu)}>{chu}</NhanVienCase>;
}

const ICON_NGUOI = (
  <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" className="shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="8" cy="5.5" r="2.8" /><path d="M2.8 14c.6-2.8 2.7-4.3 5.2-4.3s4.6 1.5 5.2 4.3" />
  </svg>
);

/** "Kết quả PA L · kỳ W4 SEP – W1 OCT" → nút "Ghi kết quả PA" + dòng phụ "kỳ …" (môn đã ở cột Môn). */
function tachViec(viec: string, kn: string): { nut: string; ky: string | null } {
  const [chinh, ...sau] = viec.split(' · ');
  const bo = chinh.endsWith(` ${kn}`) ? chinh.slice(0, -kn.length - 1) : chinh;
  return { nut: /^Kết quả/.test(bo) ? `Ghi k${bo.slice(1)}` : bo, ky: sau[0] ?? null };
}

/** Một dòng Case. 375 (`the`): xếp dọc — môn + tên (+ SOS, Gấp) · nguyên nhân · viên · PA · người · nút việc full rộng + hạn. */
export function DongCase({ h, c, ct, homNay, onMo, the = false, chiDoc = false }: {
  h: HangKyNang<CaseCua>; c: CaseCua; ct: string | null; homNay: string; chiDoc?: boolean; the?: boolean;
  onMo: (viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa', paId?: number) => void;
}) {
  const [viec] = viecTiepCuaEm({ nhapDiem: null, cases: [{ caseId: c.id, topic: c.topic, viecTiep: c.viecTiep }], yThuc: null, homNay, chuongTrinh: ct });
  const d = viec?.dich?.loai === 'case' ? viec.dich : null;
  /* So trên chữ GỐC của máy chủ (`viecTiep.chu`, tiếng Việt) — `viec.viec` đã theo tiếng của trang. */
  const goc = c.viecTiep?.chu ?? '';
  const loai = !viec ? undefined : goc.startsWith('Xác nhận Case') || goc.startsWith('Mô tả Case') ? 'xac-nhan' as const
    : goc.startsWith('Xác nhận PA') ? 'xac-nhan-pa' as const : d?.ghiKetQua && d.paId != null ? 'ghi-ket-qua' as const : undefined;
  const pa = c.pas.filter((p) => !p.xong);
  const gap = c.urgency === 'urgent';
  const mon = <span className="inline-flex h-6 min-w-[36px] items-center justify-center justify-self-start rounded-md border bg-[color:var(--surface-2)] px-1.5 text-xs font-bold text-slate-100" style={{ borderColor: 'var(--line-strong)' }} title={h.tenDu}>{h.nhan}</span>;
  const lap = c.lapTu ? <span className="text-xs text-faint">{t('lặp từ MT{n}', { n: c.lapTu })}</span> : null;
  const tenCase = (
    <span className="grid min-w-0 gap-0.5">
      <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
        <button type="button" className={`link !py-0 min-w-0 cursor-pointer border-0 bg-transparent p-0 text-left text-sm font-semibold leading-snug [display:-webkit-box] [-webkit-box-orient:vertical] overflow-hidden ${the ? '[-webkit-line-clamp:3]' : '[-webkit-line-clamp:2]'}`}
          title={c.tieuDe} onClick={() => onMo()}><TenCase c={{ title: c.tieuDe, tenSos: c.tenSos }} /></button>
        {!c.tenSos && c.sosLevel ? <ChipSos muc={c.sosLevel} tinh /> : null}
        {/* PTA 08/11: mức "Gấp" hiện ngay trên dòng; mức khác chỉ trong ⓘ của PA. */}
        {gap && <span title={t('Mức: {m}', { m: dich(c.moTu) })} className="inline-flex h-5 shrink-0 items-center rounded border px-1.5 text-xs font-bold bg-late-bg text-late border-late-line">⚠ {dich(c.moTu) || t('Gấp')}</span>}
        {c.banGiaoTu && <span className="text-xs text-faint" title={t('Case bàn giao')}>{t('từ {lop}', { lop: c.banGiaoTu })}</span>}{lap}
      </span>
      {c.nguyenNhan && <span className="truncate text-xs font-medium text-faint">{dich(c.nguyenNhan)}</span>}
    </span>
  );
  const cotPa = !pa.length ? <span className="text-sm text-faint">{t('Chưa có PA')}</span> : (
    <span className="grid min-w-0 gap-1">
      {pa.map((p) => {
        const doan = p.ten.split(' · ');
        return (
          <span key={p.id} className="grid min-w-0 gap-0.5" data-pa-id={p.id}>
            <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-100">
              {p.batBuoc && <span title={t('PA theo quy chế')} className="inline-flex"><KhoaQuyChe /></span>}
              <span className="min-w-0 truncate">{doan[0]}</span>
              <NutLuat label={t('Chi tiết PA – {kn}', { kn: h.tenDu ?? h.nhan })}>
                <span className="block text-sm font-bold text-slate-100">{doan[0]}</span>
                {p.batBuoc && <span className="inline-flex h-[22px] items-center rounded-md border px-2 text-xs font-semibold text-dim" style={{ borderColor: 'var(--line-strong)' }}>{t('theo quy chế')}</span>}
                <ul className="m-0 grid gap-0.5 pl-4">
                  {/* Bỏ đoạn trùng mốc ("đến Cuối khoá" đã có trong `mocChu` — chủ SP 08/11 chê lặp). */}
                  {doan.slice(1).filter((x) => !p.mocChu?.startsWith(x)).map((x, i) => <li key={i}>{x}</li>)}
                  {p.mocChu && <li>{dich(p.mocChu)}</li>}
                  {p.choXacNhan && <li>{t('Chờ xác nhận')}</li>}{p.choDuyet && <li>{t('Chờ Quản lý duyệt')}</li>}
                  {c.moTu && !gap && <li>{t('Mức: {m}', { m: dich(c.moTu) })}</li>}
                </ul>
              </NutLuat>
            </span>
            {p.mocChu && <span className="whitespace-nowrap text-xs font-medium tabular-nums text-faint">{dich(p.mocChu)}</span>}
          </span>
        );
      })}
    </span>
  );
  const nguoi = [...new Set(pa.map((p) => p.nguoi).filter(Boolean))].join(', ');
  const cotNguoi = nguoi ? <span className="inline-flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-dim">{ICON_NGUOI}<span className="truncate">{nguoi}</span></span> : <span className="text-faint">–</span>;
  const tach = viec ? tachViec(viec.viec, h.nhan) : null;
  const choQl = goc.startsWith('Chờ Quản lý duyệt');
  const cotViec = !viec || !tach ? <span className="text-faint">–</span> : (
    <span className="grid min-w-0 justify-items-start gap-0.5">
      {/* Cùng việc, cùng panel như trước (loai / paId); "Chờ Quản lý duyệt" chữ mờ nhưng vẫn bấm mở panel (QL duyệt tại đó). */}
      <button type="button" onClick={() => onMo(loai, d?.paId)} title={viec.title}
        className={choQl ? 'cursor-pointer border-0 bg-transparent p-0 text-left text-[13px] font-medium text-dim hover:text-slate-100 max-sm:min-h-[44px]'
          : `btn h-[30px] whitespace-nowrap px-2.5 text-[13px] ${the ? 'h-11 w-full flex-1 justify-center text-sm' : ''}`}>
        {choQl ? t('Chờ Quản lý duyệt') : tach.nut}<span className="sr-only"> – {h.tenDu ?? h.nhan}</span>
      </button>
      {tach.ky && !the && <span className="whitespace-nowrap text-xs font-medium tabular-nums text-faint">{tach.ky}</span>}
    </span>
  );
  const cotHan = !viec ? <span className="text-faint">–</span> : viec.quaHanNgay != null && viec.quaHanNgay > 0
    ? <QuaHan ngay={viec.quaHanNgay} />
    : viec.han ? <span className="whitespace-nowrap text-[13px] font-semibold tabular-nums text-slate-100">{the ? viec.han : viec.han.replace(/^hạn /, '')}</span> : <span className="text-faint">–</span>;

  if (the) {
    return (
      <div className="grid gap-1.5 border-t py-2.5" style={{ borderColor: 'var(--line)' }} data-case-id={c.id}>
        <div className="flex items-start gap-2">{mon}{tenCase}</div>
        <div className="grid justify-items-start gap-1.5 pl-11">
          <VienTrangThai tt={c.trangThai} />
          {cotPa}
          {nguoi && cotNguoi}
        </div>
        {!chiDoc && viec && <div className="flex items-center gap-2.5 pl-11"><span className="flex flex-1">{cotViec}</span>{cotHan}</div>}
      </div>
    );
  }
  return (
    <div className={`border-b py-2.5 last:border-b-0 ${chiDoc ? LUOI_DOC : LUOI}`} style={{ borderColor: 'var(--line)' }} data-case-id={c.id}>
      {mon}{tenCase}<VienTrangThai tt={c.trangThai} />{cotPa}{cotNguoi}
      {!chiDoc && <>{cotViec}<span className="justify-self-end text-right">{cotHan}</span></>}
    </div>
  );
}
