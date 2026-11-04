import type { ReactNode } from 'react';
import { ngay } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { MuiTenGap } from './NhanViPham.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import type { DongEm, ViPhamV4, YThucHocVien } from './kieu.ts';

/**
 * KHỐI Ý THỨC DÙNG CHUNG (mockup `thiet-ke/audit-0311/u10-y-thuc.html`, chủ SP duyệt 03/11) — tab Ý thức hồ sơ HV (UI-3) và hồ sơ lớp (UI-2)
 * dùng CÙNG thành phần (chủ SP 03/11: hai tab đồng bộ — cùng badge, cùng chữ, cùng thao tác; chỉ khác phạm vi một em / cả lớp).
 */

/** Thẻ meta nhỏ (mockup `.tag.nhat`) thay chuỗi "a · b · c". */
export const TAG = 'inline-flex h-[22px] items-center whitespace-nowrap rounded-md px-2 text-xs font-semibold text-slate-400 surface-2';

/** Badge việc: khung + chấm theo trạng thái + chữ (mockup `.bv`; chủ SP 03/11 U04). Quá hạn ⚠, xong ✓; Chưa xem = viền chấm. */
export type TongBv = 'cho' | 'qua' | 'dang' | 'xong' | 'xem' | 'xam';
const LOP_BV: Record<TongBv, string> = {
  cho: 'border-soon-line bg-soon-bg text-soon',
  qua: 'border-late-line bg-late-bg text-late',
  dang: 'border-[color:var(--accent)] text-doing',
  xong: 'border-ok-line text-ok',
  xem: 'border-dashed border-[color:var(--accent)] text-doing',
  xam: 'border-[color:var(--line-strong)] text-slate-500',
};
export function BadgeViec({ tong, children, onClick, title }: { tong: TongBv; children: ReactNode; onClick?: () => void; title?: string }) {
  /* Badge bấm được (Báo PH, đề xuất): `title` cũng là tên truy cập — nói việc sẽ mở, không chỉ trạng thái. */
  const dau = tong === 'qua' ? <span aria-hidden className="text-xs">⚠</span>
    : tong === 'xong' ? <span aria-hidden className="text-xs">✓</span>
    : <span aria-hidden className="h-[7px] w-[7px] shrink-0 rounded-full bg-current" />;
  const lop = `inline-flex h-6 max-w-full items-center gap-1.5 whitespace-nowrap rounded-md border px-2 text-xs font-semibold ${LOP_BV[tong]}`;
  if (onClick) return <button type="button" title={title} aria-label={title} className={`${lop} cursor-pointer appearance-none hover:brightness-110 max-sm:min-h-[44px]`} onClick={onClick}>{dau}{children} <span aria-hidden>›</span></button>;
  return <span title={title} className={lop}>{dau}{children}</span>;
}

type TomTatVao = Pick<YThucHocVien, 'nhom' | 'han' | 'hanXem' | 'quaHanNgay'> & { deXuat: Pick<NonNullable<YThucHocVien['deXuat']>, 'id' | 'nhan' | 'status' | 'han'> | null };

const ngayCach = (tu: string, den: string) => Math.round((Date.parse(`${den}T00:00:00Z`) - Date.parse(`${tu}T00:00:00Z`)) / 86_400_000);

/**
 * Ô "Cần làm" của một em: badge + hạn (cùng chữ ở hàng em tab lớp). null = không còn việc.
 * Mặc định hạn nằm TRONG badge ("Phải xử lý · hạn 05/11" — K2 / K3); `hanDuoi` (bảng lớp 1440, K1): badge rồi dòng hạn nhỏ bên dưới.
 */
export function CanLamEm({ x, homNay, onXem, hanDuoi = false, laQl = false }: {
  x: TomTatVao; homNay: string; onXem?: (id: number) => void; hanDuoi?: boolean;
  /** K4: người duyệt thấy "Đề xuất" (việc của mình), người gửi thấy "Chờ QL duyệt". */
  laQl?: boolean;
}) {
  const o = (bv: ReactNode, h: string | null, duoi?: string | null) => hanDuoi
    ? <span className="flex flex-col items-start gap-1.5">{bv}{(duoi ?? h) && <span className="text-xs tabular-nums text-slate-500">{duoi ?? t('hạn {ngay}', { ngay: ngay(h!, homNay) })}</span>}</span>
    : bv;
  const han = (h: string | null) => !hanDuoi && h ? ` · ${t('hạn {ngay}', { ngay: ngay(h, homNay) })}` : '';
  if (x.deXuat) {
    const dx = x.deXuat;
    return o(<BadgeViec tong="dang" title={onXem ? t('Xem lần xử lý') : undefined} onClick={onXem ? () => onXem(dx.id) : undefined}>{dx.status === 'da_duyet' ? t('QL đã duyệt') : laQl ? t('Đề xuất') : t('Chờ QL duyệt')}{han(dx.han)}</BadgeViec>,
      dx.han, dx.han ? (dx.status === 'da_duyet' ? t('thực hiện trước {ngay}', { ngay: ngay(dx.han, homNay) }) : t('duyệt trước {ngay}', { ngay: ngay(dx.han, homNay) })) : null);
  }
  switch (x.nhom) {
    case 'qua_han': return o(<BadgeViec tong="qua">{t('Quá hạn {n} ngày', { n: x.quaHanNgay ?? 1 })}{han(x.han ?? x.hanXem)}</BadgeViec>, x.han ?? x.hanXem);
    case 'bat_buoc': {
      const con = x.han ? ngayCach(homNay, x.han) : null;
      return o(<BadgeViec tong="cho">{t('Phải xử lý')}{han(x.han)}</BadgeViec>, x.han,
        x.han && con != null && con > 0 ? `${t('hạn {ngay}', { ngay: ngay(x.han, homNay) })} · ${t('còn {n} ngày', { n: con })}` : null);
    }
    case 'moi': return o(<BadgeViec tong="xem">{t('Chưa xem')}{han(x.hanXem)}</BadgeViec>, x.hanXem);
    default: return <span className="text-slate-500">—</span>;
  }
}

/** Ô "Báo PH" — ghi rõ của LẦN xử lý nào (U10.7); bấm được khi người xem ghi kết quả được (TVV / QL). `coLan={false}`: nhãn ô đã nói lần (K3). */
export function BaoPhEm({ b, homNay, onMo, coLan = true }: { b: DongEm['baoPh']; homNay: string; onMo?: () => void; coLan?: boolean }) {
  if (!b) return <span className="text-slate-500">—</span>;
  const mo = b.trangThai === 'mo' && b.coTheGhi ? onMo : undefined;
  const bv = b.trangThai === 'xong' ? <BadgeViec tong="xong">{b.ngayXong ? t('Đã báo {ngay}', { ngay: ngay(b.ngayXong, homNay) }) : t('Đã báo PH')}</BadgeViec>
    : b.trangThai === 'bo' ? <BadgeViec tong="xam">{t('Đã bỏ')}</BadgeViec>
    : <BadgeViec tong={b.quaHan ? 'qua' : 'cho'} onClick={mo} title={mo ? t('Ghi kết quả báo PH') : undefined}>{dich(b.nhanTrangThai)}</BadgeViec>;
  return (
    /* Mockup K1 `.bph`: lần · badge · hạn — ba dòng (hạn đã sửa ghi "đã chỉnh"). */
    <span className="flex flex-col items-start gap-[5px]">
      {coLan && <span className="text-xs font-medium text-slate-500">{t('Lần')} <b className="font-semibold text-slate-400">{dich(b.nhan)}</b></span>}
      {bv}
      {b.trangThai === 'mo' && <span className="text-xs tabular-nums text-slate-500">{t('hạn {ngay}', { ngay: ngay(b.han, homNay) })}{b.daChinh ? ` · ${t('đã chỉnh')}` : ''}</span>}
    </span>
  );
}

/** Dải tóm tắt một em (mockup K3 `.facts`): mỗi trường một ô, nhãn trên – giá trị dưới, kẻ dọc giữa các ô. */
export function TomTatEm({ d, homNay, onBaoPh, onXem, thang }: {
  d: TomTatVao & Pick<YThucHocVien, 'bacNhan' | 'keTiep' | 'canManage' | 'gvcn'> & { baoPh: DongEm['baoPh'] };
  homNay: string; onBaoPh?: () => void; onXem?: (id: number) => void;
  /** Thang xử lý đầy đủ — trong ⓘ cạnh "Đã tới" (mockup K3 không vẽ thang trên tab). */
  thang?: ReactNode;
}) {
  const o = (nhan: ReactNode, gt: ReactNode) => (
    <div className="grid min-w-0 content-start gap-1 py-0.5 [@container(min-width:900px)]:border-l [@container(min-width:900px)]:px-[18px] [@container(min-width:900px)]:first:border-l-0 [@container(min-width:900px)]:first:pl-0" style={{ borderColor: 'var(--line)' }}>
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-slate-500">{nhan}</span>
      <span className="text-[15px] font-semibold text-slate-100">{gt}</span>
    </div>
  );
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3 [@container(min-width:900px)]:gap-x-0">
      {o(t('Cần làm'), <CanLamEm x={d} homNay={homNay} onXem={onXem} />)}
      {!d.canManage && d.gvcn && o(t('Người xử lý'), t('GVCN {ten}', { ten: d.gvcn }))}
      {o(<>{t('Đã tới')}{thang && <NutLuat label={t('Thang xử lý vi phạm')}>{thang}</NutLuat>}</>, d.bacNhan ? dich(d.bacNhan) : <span className="font-medium text-slate-400">{t('chưa có')}</span>)}
      {o(t('Lần này'), dich(d.keTiep.nhan))}
      {o(d.baoPh ? t('Báo PH · lần {nhan}', { nhan: dich(d.baoPh.nhan) }) : t('Báo PH'), <BaoPhEm b={d.baoPh} homNay={homNay} onMo={onBaoPh} coLan={false} />)}
    </div>
  );
}

/**
 * Danh sách vi phạm chờ (mockup K1 "Vi phạm của lần này", K3): ngày | tên + thẻ (nhóm · người ghi) | thao tác. Bấm tên → mở tại chỗ (mô tả,
 * bằng chứng, Sửa / Xoá, Đã xem một vi phạm). Không badge lặp ở từng dòng — trạng thái nói ở ô Cần làm; chỉ in nhãn khi khác trạng thái chung.
 */
export function DsViPhamCho({ ds, homNay, moId, onMo, chiTiet, nhanRieng, nguoiGhi = false }: {
  ds: ViPhamV4[]; homNay: string; moId: number | null; onMo: (id: number) => void; chiTiet: (v: ViPhamV4) => ReactNode;
  /** Tab lớp (mockup K1): thẻ "… ghi" — cả lớp nhiều người ghi; tab HV (K3) không in. */
  nguoiGhi?: boolean;
  /** Nhãn cuối dòng khi vi phạm khác trạng thái chung của em (vd một vi phạm đã trong đề xuất). */
  nhanRieng?: (v: ViPhamV4) => ReactNode;
}) {
  return (
    <ul className="m-0 list-none p-0">
      {ds.map((v) => {
        const mo = moId === v.id;
        return (
          <li key={v.id} className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-start gap-x-2.5 border-t py-2.5 first:border-t-0 first:pt-0" style={{ borderColor: 'var(--line)' }}>
            <span className="pt-0.5 text-[13px] font-semibold tabular-nums text-slate-400">{ngay(v.occurredOn, homNay)}</span>
            <span className="min-w-0">
              <button type="button" aria-expanded={mo} onClick={() => onMo(v.id)}
                className="inline-flex min-h-[44px] items-center gap-1 border-0 bg-transparent p-0 text-left text-[15px] font-semibold text-slate-100 appearance-none hover:underline sm:min-h-0">
                {v.ten}
              </button>
              <span className="mt-1 flex flex-wrap gap-1.5">
                <span className={TAG}>{dich(v.categoryLabel)}</span>
                {nguoiGhi && v.reportedByName && <span className={TAG}>{t('{ten} ghi', { ten: v.reportedByName })}</span>}
                {!!v.soTep && <button type="button" className={`${TAG} cursor-pointer appearance-none border-0 hover:text-slate-200`} onClick={() => onMo(v.id)}>{t('{soTep} tệp', { soTep: v.soTep })} ›</button>}
              </span>
            </span>
            <span className="flex items-center justify-end">{nhanRieng?.(v)}</span>
            {mo && <div className="col-start-2 col-end-4 pt-2">{chiTiet(v)}</div>}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Dòng "Lần trước" (mockup K1 khối Lần xử lý · K3): lần xử lý gần nhất là link mở Xem lần xử lý (nơi Thu hồi…); chỉ thêm chữ khi đổi quyết định —
 * đang xin thu hồi / đã thu hồi / QL từ chối. Bỏ "Thu hồi được · QL duyệt" (audit U10.2: chip thừa).
 */
export function LanTruoc({ x, homNay, onXem }: { x: Pick<DongEm, 'xuLyGanNhat' | 'thuHoi' | 'tuChoi'>; homNay: string; onXem: (id: number) => void }) {
  const link = (id: number, chu: ReactNode) => (
    <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-left text-sm font-semibold sm:min-h-0" onClick={() => onXem(id)}>
      <span className="sr-only">{t('Xem lần xử lý')} </span>{chu} ›
    </button>
  );
  if (x.thuHoi) return <span className="flex flex-wrap items-center gap-2">{link(x.thuHoi.id, dich(x.thuHoi.nhan))}<BadgeViec tong={x.thuHoi.cho ? 'dang' : 'xam'}>{x.thuHoi.cho ? t('Đang xin thu hồi') : t('Đã thu hồi')}</BadgeViec></span>;
  if (x.tuChoi) return <span className="flex flex-wrap items-center gap-2">{link(x.tuChoi.id, dich(x.tuChoi.nhan))}<BadgeViec tong="qua">{t('QL từ chối · chọn cách khác')}</BadgeViec></span>;
  if (x.xuLyGanNhat) return <span className="flex flex-wrap items-center gap-2"><b className="font-semibold text-slate-100">{dich(x.xuLyGanNhat.nhan)}</b><span className="text-[13px] tabular-nums text-slate-400">{ngay(x.xuLyGanNhat.ngay, homNay)}</span>{link(x.xuLyGanNhat.id, t('Xem'))}</span>;
  return null;
}

/** Chip lọc Lịch sử (mockup `.lua`): mỗi mục một nút viền riêng, có số; mục chọn viền nhấn + nền nhấn nhạt. */
export function ChipLoc<K extends string>({ muc, value, onChange, ariaLabel }: { muc: { key: K; nhan: string; so: number }[]; value: K; onChange: (k: K) => void; ariaLabel: string }) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {muc.map((m) => {
        const chon = m.key === value;
        return (
          <button key={m.key} type="button" aria-pressed={chon} onClick={() => onChange(m.key)}
            className={`inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-lg border px-3 text-sm max-sm:h-11 ${chon
              ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] font-bold text-[color:var(--accent)] shadow-[inset_0_0_0_1px_var(--accent)]'
              : 'border-[color:var(--o-nhap-vien)] bg-[color:var(--o-nhap-nen)] font-medium text-slate-100'}`}>
            {m.nhan} <span className="tabular-nums">{m.so}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * BẢNG LỊCH SỬ (mockup K6): ba loại dòng — Đã xem (vi phạm) · Đã xử lý / Đã thu hồi / đang chờ (lần xử lý) — mỗi dòng: Ngày · Loại (badge) ·
 * Nội dung (tên + trường phụ có nhãn) · Ai · lúc nào · thao tác. Vi phạm đã xử lý xem qua "Xem" lần xử lý (Sửa / Thu hồi ở đó).
 * `coTen`: tab lớp (UI-2) thêm cột Học viên. `vuaXem`: dòng vừa "Đã xem" sáng + "vừa xong" (đến từ "Xem lại").
 */
export type DongLs = { key: string; ngay: string; ten?: ReactNode; tong: TongBv; loai: string; kieu: 'xem' | 'xu-ly' | 'thu-hoi' | 'khac';
  tieuDe: ReactNode; truong: [string, ReactNode][]; ai: string | null; luc: string | null; vua?: boolean; cuoi?: ReactNode;
  /** Dòng "Đã xem" mở tại chỗ (mô tả, bằng chứng, Sửa / Xoá — người ghi vẫn sửa được sau khi GVCN đã xem). */
  mo?: boolean; onMo?: () => void; chiTiet?: ReactNode };
/* Lớp của BangLichSu theo ngưỡng khung (viết đủ chữ — Tailwind chỉ sinh CSS cho tên lớp thấy được trong mã). */
const LS_HV = {
  dau: '[@container(min-width:720px)]:grid [@container(min-width:720px)]:grid-cols-[72px_130px_minmax(0,1fr)_200px_120px]',
  hang: '[@container(min-width:720px)]:grid-cols-[72px_130px_minmax(0,1fr)_200px_120px]',
  ten: '[@container(min-width:720px)]:col-span-1', loai: '[@container(min-width:720px)]:col-start-auto',
  o: '[@container(min-width:720px)]:col-span-1 [@container(min-width:720px)]:col-start-auto',
  cuoi: '[@container(min-width:720px)]:col-start-auto [@container(min-width:720px)]:row-start-auto',
};
const LS_LOP = {
  dau: '[@container(min-width:900px)]:grid [@container(min-width:900px)]:grid-cols-[90px_200px_130px_minmax(0,1fr)_200px_140px]',
  hang: '[@container(min-width:900px)]:grid-cols-[90px_200px_130px_minmax(0,1fr)_200px_140px]',
  ten: '[@container(min-width:900px)]:col-span-1', loai: '[@container(min-width:900px)]:col-start-auto',
  o: '[@container(min-width:900px)]:col-span-1 [@container(min-width:900px)]:col-start-auto',
  cuoi: '[@container(min-width:900px)]:col-start-auto [@container(min-width:900px)]:row-start-auto',
};
export function BangLichSu({ dong, coTen, homNay, rong }: { dong: DongLs[]; coTen?: boolean; homNay: string; rong: ReactNode }) {
  if (!dong.length) return <>{rong}</>;
  /* Lưới (không <table> — BANG-3). Theo KHUNG (container), không theo màn: panel Công việc 480 px dùng bản hẹp — "Ai · lúc nào" xuống dưới nội dung. */
  /* Lớp viết đủ chữ (Tailwind chỉ sinh CSS cho tên lớp thấy được trong mã). */
  /* Có cột Học viên (tab lớp): bảng từ khung 900 px — 6 cột cố định cần ~850 px; tab HV / panel: 720 px. */
  const L = coTen ? LS_LOP : LS_HV;
  const dau = 'text-[13px] font-semibold text-slate-400';
  return (
    <div role="list" aria-label={t('Lịch sử')}>
      <div aria-hidden className={`hidden gap-x-3 border-b px-4 py-2 ${L.dau}`} style={{ borderColor: 'var(--line)' }}>
        <span className={dau}>{t('Ngày')}</span>{coTen && <span className={dau}>{t('Học viên')}</span>}<span className={dau}>{t('Loại')}</span>
        <span className={dau}>{t('Nội dung')}</span><span className={dau}>{t('Ai · lúc nào')}</span><span />
      </div>
      {dong.map((x) => (
        <div key={x.key} role="listitem" className={`grid grid-cols-[56px_minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b px-4 py-2.5 last:border-b-0 ${L.hang} ${x.vua ? 'bg-ok-bg' : ''}`} style={{ borderColor: 'var(--line)' }}>
          <span className="text-[13px] font-semibold tabular-nums text-slate-400">{ngay(x.ngay, homNay)}</span>
          {coTen && <span className={`font-semibold text-slate-100 col-span-2 ${L.ten}`}>{x.ten}</span>}
          <span className={`col-start-2 ${L.loai}`}><BadgeViec tong={x.tong}>{x.loai}</BadgeViec></span>
          <span className={`min-w-0 col-span-2 col-start-2 ${L.o}`}>
            {x.onMo
              ? <button type="button" aria-expanded={!!x.mo} onClick={x.onMo} className="inline-flex min-h-[44px] items-center gap-1 border-0 bg-transparent p-0 text-left font-semibold text-slate-100 appearance-none hover:underline sm:min-h-0">{x.tieuDe}<span className="text-slate-500"><MuiTenGap mo={!!x.mo} /></span></button>
              : <span className="font-semibold text-slate-100">{x.tieuDe}</span>}
            {x.vua && <span className="block text-xs font-semibold text-ok">{t('vừa xong')}</span>}
            {x.truong.length > 0 && (
              <dl className="m-0 mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 gap-y-0.5">
                {x.truong.map(([n, g]) => <div key={n} className="contents"><dt className="text-xs font-medium leading-5 text-slate-500">{n}</dt><dd className="m-0 text-[13px] text-slate-300">{g}</dd></div>)}
              </dl>
            )}
          </span>
          <span className={`min-w-0 col-span-2 col-start-2 ${L.o}`}>
            <span className="text-sm text-slate-200">{x.ai ?? '—'}</span>{x.luc && <span className="block text-xs tabular-nums text-slate-500">{x.luc}</span>}
          </span>
          <span className={`flex items-start justify-end col-start-3 row-start-1 ${L.cuoi}`}>{x.cuoi}</span>
          {x.mo && x.chiTiet && <div className="col-span-full pt-1">{x.chiTiet}</div>}
        </div>
      ))}
    </div>
  );
}
