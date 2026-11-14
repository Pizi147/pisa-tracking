import { Children, type ReactNode, useState } from 'react';
import { LOP_DA_LUU } from '../../ui/KhuonViec.tsx';
import { Link } from 'react-router-dom';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { Level } from '../../ui/ui.tsx';
import { BadgeTabSo, CHIP_TRON, Nhan, NhanLich } from '../../ui/Nhan.tsx';
import { phimHangTab } from '../../ui/HangTab.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { mucSosTheoNhan } from '../../lib/format.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import {
  CHAM_CHEO, LOAI_HAN_CUA_VIEC, chiaVachHan, daysBetween, deadlineView, laViecChamCheo, nhanHan, shortDate, type BadgeTab, type MucTab,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';



type ChungDong = {
  onOpen: (it: WorkItem) => void; chon: string | null; xong: ReadonlySet<string>;
  moTrang: (it: WorkItem) => boolean; moCaDong: (it: WorkItem) => boolean; nutPhu?: (it: WorkItem) => ReactNode;
  /** V5 (brief 7): việc của người khác — dòng không nút động từ; chỉ "Làm thay" / "Nhập hộ" khi máy chủ báo `lamThay`. */
  theoDoi: (it: WorkItem) => boolean;
  /** v12 S3: đang xem việc của MỘT GV (id) — dòng của GV đó không lặp tên (dải "Đang xem việc của…" đã nói). */
  nguoiAn?: number | null;
  /** CV-TAB b (mockup `.cn`): mã chi nhánh của dòng — chỉ khi GV có việc ở > 1 chi nhánh. */
  theCn?: (it: WorkItem) => string | null;
};

/** Tên việc + thẻ mã chi nhánh nhỏ (mockup v17 `.cn`): thẻ dính chữ cuối của tên (không rơi một mình xuống dòng ở 375). */
const TenCn = ({ ten, ma }: { ten: string; ma: string | null | undefined }) => {
  if (!ma) return <>{ten}</>;
  const i = ten.lastIndexOf(' ');
  return <>{ten.slice(0, i + 1)}<span className="whitespace-nowrap">{ten.slice(i + 1)}
    <span className="ml-1.5 inline-flex h-[18px] items-center rounded-[5px] border px-1.5 align-[2px] text-xs font-semibold text-dim" style={{ borderColor: 'var(--line-strong)' }}>{ma}</span></span></>;
};

/* AUDIT-UI B4 (mockup `.viec`): [tên + thẻ phụ | hạn 136 px | nút 112 px] từ 640 px — nút dài hơn ("Bàn giao môn P" 122 px, RA-GD-0711) nới cột, không cắt.
   B5 (V18): 375 [tên + phụ, hạn dưới | "›"] — chạm cả dòng, nút ẩn (trừ "n ▾", nút phụ Gia hạn / Bỏ qua / Xuất). */
export const COT_VIEC = 'grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_136px_minmax(112px,auto)]';
const DONG = `grid min-h-[44px] cursor-pointer items-center gap-x-3 gap-y-0.5 px-3.5 py-2.5 sm:min-h-[50px] sm:px-4 sm:py-1.5 ${COT_VIEC}`;
const O_HAN = 'max-sm:col-start-1 max-sm:row-start-2';
const O_NUT = 'max-sm:col-start-2 max-sm:row-span-2 max-sm:row-start-1 max-sm:self-center';
/* Nét cây (tầng 3 dưới tên em): dọc ở 30 px (375: 26), ngang 12 px vào giữa dòng; dòng cuối dừng ở giữa. */
export const NET_CAY = "relative before:absolute before:left-[26px] sm:before:left-[30px] before:top-0 before:bottom-0 before:w-px before:bg-[color:var(--line-strong)] before:content-[''] last:before:bottom-1/2 "
  + "after:absolute after:left-[26px] sm:after:left-[30px] after:top-1/2 after:h-px after:w-3 after:bg-[color:var(--line-strong)] after:content-['']";

/** Biểu tượng nét 16 px của nhóm việc (mockup `IC`) — nhóm phân biệt bằng tên + biểu tượng, một màu nhấn. */
const DUONG_IC: Record<string, ReactNode> = {
  'cham-diem': <><path d="M3 13l.9-3.3L10.6 3a1.4 1.4 0 0 1 2 0l.4.4a1.4 1.4 0 0 1 0 2L6.3 12.1z" /><path d="M9.5 4.1l2.4 2.4" /></>,
  'case-hoc-thuat': <><path d="M3.5 14V2.5" /><path d="M3.5 3h8.5l-1.8 2.7L12 8.5H3.5" /></>,
  'y-thuc': <path d="M8 2l5 2v4c0 3-2.2 5-5 6-2.8-1-5-3-5-6V4z" />,
  'van-hanh': <><rect x="3.5" y="2.5" width="9" height="11" rx="1.5" /><path d="M6 6h4M6 9h4" /></>,
  'cham-cheo': <><rect x="6" y="2" width="4" height="8" rx="2" /><path d="M4 8a4 4 0 0 0 8 0M8 12v2" /></>,
  'bao-ph': <path d="M4.2 2.5h2l1 3-1.4 1a7 7 0 0 0 3.7 3.7l1-1.4 3 1v2a1.5 1.5 0 0 1-1.6 1.5A10 10 0 0 1 2.7 4.1 1.5 1.5 0 0 1 4.2 2.5z" />,
  'sau-thi': <><rect x="2.5" y="3.5" width="11" height="10" rx="1.5" /><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" /></>,
  'chot-ngay-thi': <><rect x="2.5" y="3.5" width="11" height="10" rx="1.5" /><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" /></>,
  'bo-sung': <><path d="M4 2.5h5l3 3v8H4z" /><path d="M9 2.5v3h3" /></>,
  duyet: <><circle cx="8" cy="8" r="5.5" /><path d="M5.6 8.2l1.7 1.7 3.2-3.4" /></>,
  /* BO-QUA-XEP-MT: "Đã bỏ qua" — mắt gạch. */
  'bo-qua': <><path d="M2 8s2.2-4 6-4 6 4 6 4-2.2 4-6 4-6-4-6-4z" /><circle cx="8" cy="8" r="1.8" /><path d="M3 13L13 3" /></>,
  /* U01 #3 (audit 03/11): dòng "Cả lớp" / dòng gộp — ô bảng (mockup `.av.vuong`), không số chồng. */
  'ca-lop': <><rect x="2.5" y="3" width="11" height="10" rx="1" /><path d="M2.5 7h11M6 3v10" /></>,
  /* AUDIT-UI CV6: "Lớp tôi dạy" — bảng lớp, không dùng biểu tượng người. */
  'lop-toi-day': <><rect x="2.5" y="2.5" width="11" height="8" rx="1" /><path d="M5 13.5l3-3 3 3M5.5 5.5h5M5.5 7.8h3" /></>,
  /* CV6 (mockup v18): "Yêu cầu của tôi" — phiếu gửi đi, không mượn biểu tượng người của lớp. */
  'yeu-cau': <><path d="M14 2L7 9" /><path d="M14 2l-4.5 12-2.5-5-5-2.5z" /></>,
  lop: <><circle cx="6" cy="6" r="2.2" /><circle cx="11.2" cy="6.6" r="1.7" /><path d="M2.5 13c.4-2.2 1.8-3.4 3.5-3.4s3.1 1.2 3.5 3.4M10.3 9.7c1.6 0 2.8 1 3.2 3" /></>,
};
export const IconNhom = ({ k }: { k: string }) => (
  <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">{DUONG_IC[k] ?? DUONG_IC.lop}</svg>
);
/**
 * GD-4a (mockup ⑤ B, `.av.vuong`): ô vuông 28 px biểu tượng đầu MỌI dòng việc (không có ở em trong khay) — dòng lớp / gộp: ô bảng; Chấm Speaking: micro;
 * Báo cáo PH: tờ giấy. Trang trí — trình đọc màn hình bỏ qua.
 */
const icDong = (it: WorkItem) => (laViecChamCheo(it) ? 'cham-cheo' : it.group === 'bao_cao_ph' || it.group === 'xuat_bc_ph' ? 'bo-sung' : 'ca-lop');
const AvViec = ({ it }: { it: WorkItem }) => (
  <span aria-hidden className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent)]"><IconNhom k={icDong(it)} /></span>
);
/** Chữ đầu tên em (vòng tròn tầng 2): hai từ cuối ("Vũ Hải Đăng" → "HĐ"). */
export const chuDau = (ten: string) => {
  const w = ten.trim().split(/\s+/);
  return (w.length > 1 ? w[w.length - 2][0] + w[w.length - 1][0] : w[0].slice(0, 2)).toUpperCase();
};

/**
 * DANH SÁCH MỘT TAB — AUDIT-UI B4 (chủ SP 08/11, mockup `thiet-ke/2026-11-08-audit-ui-mockup.html` khu B4; thay CV-TAB "một thẻ, mục Quá hạn trên cùng"):
 * MỖI MỤC LOẠI VIỆC MỘT THẺ (`chiaMucTab`, mục rỗng ẩn), quá hạn lên đầu mục. Đầu thẻ = dải nhóm (`.dai-nhom`: nền `--surface-2`, vạch trái 3 px nhấn, 15 / 700)
 * · chip "n việc" · "⚠ n quá hạn" đỏ (375: "n" · "⚠ n"). Dòng: tên = đối tượng 15 / 500 + thẻ phụ | hạn một dòng | nút. Dòng gộp giữ "n em ▾" + khay em.
 * Số đầu mục chỉ từ việc máy chủ trả (`dem`; dòng giữ chỗ vừa xong không đếm). Mỗi mục 10 dòng đầu + "Xem thêm".
 */
export function DanhSachViec({ muc, dem, soHien, cuoi, luat, ...dong }: ChungDong & {
  muc: readonly MucTab<WorkItem>[];
  dem: ReadonlyMap<string, { n: number; quaHan: number }>;
  soHien: number;
  /** Cuối thẻ cuối (QL "Việc quản lý": + Giao việc · Vận hành ›). */
  cuoi?: ReactNode;
  /** UI-CV-TVV (P1): luật của tab (vd hạn Báo PH) — ⓘ ở dải mục đầu, không thành câu trên màn. */
  luat?: ReactNode;
}) {
  const [them, setThem] = useState<Record<string, number>>({});
  const { homNay } = useNgayNghiepVu();
  const cuoiTuan = chiaVachHan([], homNay).cuoiTuan;
  /* GD-4a (mockup ⑤ B1): vạch hạn trong mục — Quá hạn · Hôm nay · Hạn đến {CN} · Hạn sau {CN} · Không hạn; mục đã xếp hạn sớm trước nên vạch đi một chiều. */
  const vach = (x: WorkItem) => (!x.due ? t('Không hạn') : x.urgency === 'overdue' ? t('Quá hạn') : x.urgency === 'today' ? t('Hôm nay')
    : x.due.slice(0, 10) <= cuoiTuan ? t('Hạn đến {ngay}', { ngay: shortDate(cuoiTuan, homNay) }) : t('Hạn sau {ngay}', { ngay: shortDate(cuoiTuan, homNay) }));
  return (
    <div className="flex flex-col gap-3.5">
      {muc.map((m, i) => {
        const n = soHien + (them[m.key] ?? 0);
        /* GD-1 (lời 11, 19) · GD-1b (lời 24: tên mục "Chấm Speaking"): mục Chấm Speaking là việc chung của nhóm GV Speaking — đếm BÀI (không phải việc), vạch trái trung tính. */
        const chung = m.key === 'cham-cheo';
        const d = chung ? { n: m.items.reduce((s, x) => s + (x.soBai ?? 0), 0), quaHan: m.items.reduce((s, x) => s + (x.baiQuaHan ?? 0), 0) } : dem.get(m.key) ?? { n: 0, quaHan: 0 };
        return (
          <section key={m.key} data-muc={m.key} className="card overflow-clip p-0" aria-label={m.label}>
            <h2 className="sticky top-0 z-[3] m-0 flex min-h-[48px] items-center gap-2 border-b border-l-[3px] pl-[13px] pr-2 text-[15px] font-bold leading-snug"
              style={{ background: 'var(--surface-2)', borderBottomColor: 'var(--line)', borderLeftColor: chung ? 'var(--text-faint)' : 'var(--accent)' }}>
              <span className="min-w-0 text-[color:var(--text)] max-sm:flex-1">{m.label}</span>
              <span className="inline-flex h-[22px] min-w-[22px] shrink-0 items-center justify-center whitespace-nowrap rounded border px-[7px] text-xs font-semibold tabular-nums text-[color:var(--text)]"
                style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>{d.n}<span className="max-sm:sr-only">&nbsp;{chung ? t('bài') : t('việc')}</span></span>
              {d.quaHan > 0 && (
                <span className="whitespace-nowrap text-[13px] font-bold tabular-nums text-late"><span aria-hidden>⚠ </span>{d.quaHan}<span className="max-sm:sr-only"> {t('quá hạn')}</span></span>
              )}
              {i === 0 && luat}
            </h2>
            <ul className="m-0 list-none p-0">
              {m.items.slice(0, n).map((x, j, ds) => {
                /* Chỉ vẽ vạch khi mục có ≥ 2 nhóm hạn (một nhóm: cột hạn đã nói đủ). */
                const coVach = new Set(ds.map(vach)).size > 1;
                const vachMoi = coVach && (j === 0 || vach(ds[j - 1]) !== vach(x));
                return [
                  vachMoi && <li key={`v:${vach(x)}`} className={`flex min-h-9 items-center px-4 text-[13px] font-semibold text-dim max-sm:min-h-10 max-sm:px-3.5 ${j ? 'border-t' : ''}`}
                    style={{ borderColor: 'var(--line-strong)' }}>{vach(x)}</li>,
                <li key={`${x.key}|${x.ownerId ?? ''}`} className={j && !vachMoi ? 'border-t' : ''} style={{ borderColor: 'var(--line)' }}>
                  {LA_GON.has(x.group) ? <DongGon it={x} {...dong} /> : x.con?.length || x.studentId === null ? <DongLop it={x} {...dong} /> : <DongViec it={x} {...dong} />}
                </li>,
                ];
              })}
            </ul>
            {m.items.length > n && (
              <div className="border-t px-4 py-2.5" style={{ borderColor: 'var(--line)' }}>
                <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" onClick={() => setThem((s) => ({ ...s, [m.key]: (s[m.key] ?? 0) + soHien }))}>
                  {t('Xem thêm {n} dòng', { n: Math.min(soHien, m.items.length - n) })}
                </button>
              </div>
            )}
            {cuoi && i === muc.length - 1 && <div className="border-t px-4 py-1" style={{ borderColor: 'var(--line)' }}>{cuoi}</div>}
          </section>
        );
      })}
    </div>
  );
}

/**
 * HÀNG TAB HẠNG MỤC (mockup `.tabs`): dưới hàng lọc, kẻ dưới hết bề ngang; tab 15 / 500, đang chọn 700 + gạch 2 px nhấn. 375: cuộn ngang, tên ngắn (`ngan`).
 * Bàn phím: phím chung `phimHangTab` (← → Home End chuyển focus, Enter / Space chọn — roving tabindex).
 */
export function HangTab({ tabs, dang, onChon, idPanel }: { tabs: readonly { key: string; nhan: string; ngan?: string; badge: BadgeTab | null }[]; dang: string | null; onChon: (k: string) => void; idPanel: string }) {
  return (
    <div role="tablist" aria-label={t('Hạng mục việc')} onKeyDown={phimHangTab}
      /* RA-GD-0711: `relative` — chữ `sr-only` (absolute) của badge bám vào hàng tab, không kéo <main> trượt ngang ở 375 (784/375);
         375 mép phải mờ như `ui/HangTab` (tab bị cắt ở mép thì biết còn tab để cuộn). */
      className="relative -mx-4 flex gap-1 overflow-x-auto border-b px-4 [scrollbar-width:none] max-sm:pr-8 max-sm:[mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] md:-mx-5 md:px-5" style={{ borderColor: 'var(--line)' }}>
      {tabs.map((x) => {
        const on = x.key === dang;
        return (
          <button key={x.key} type="button" role="tab" data-tab={x.key} aria-selected={on} aria-controls={idPanel} tabIndex={on ? 0 : -1} onClick={() => onChon(x.key)}
            /* AUDIT-UI B3 (mockup `.tab-hang .tb`): 15 px, chưa chọn 500 mờ, đang chọn 700 + gạch 2 px nhấn. */
            className={`-mb-px inline-flex min-h-[44px] shrink-0 appearance-none items-center gap-2 whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-3.5 py-2.5 text-[15px] ${
              on ? 'border-[color:var(--accent)] font-bold text-[color:var(--text)]' : 'border-transparent font-medium text-dim hover:text-[color:var(--text)]'}`}>
            {x.ngan ? <><span className="sm:hidden">{x.ngan}</span><span className="max-sm:hidden">{x.nhan}</span></> : x.nhan}{x.badge && <BadgeTabSo b={x.badge} />}
          </button>
        );
      })}
    </div>
  );
}

/**
 * TẦNG ① — DẢI NHÓM (mockup `.dai-nhom`): nền `--surface-2`, vạch trái 3 px một màu nhấn (`trungTinh` xám = không phải việc của bạn), biểu tượng,
 * tên 15 / 700, chip đếm vuông có đơn vị, phụ 13; dính khi cuộn (thẻ cha `overflow-clip`, không `overflow-hidden`). Bấm tên = gập / mở. Dùng chung cho
 * "Chờ bạn duyệt" và "Việc quản lý" rỗng ở `HoTroHocVienTab` — mọi nhóm cùng dáng.
 */
export function DaiNhom({ k, nhan, chip, mo, onMo, luat, phu, trungTinh = false }: {
  k: string; nhan: string; chip?: string; mo: boolean; onMo: () => void; luat?: ReactNode; phu?: ReactNode; trungTinh?: boolean;
}) {
  return (
    /* v12 S8: MỘT hàng cả ở 375 — tên · chip "n việc" · ⚠ quá hạn cùng hàng (không số phụ thứ hai); tên dài thì tên xuống dòng, không cắt (M2).
       CV6 (mockup v18, chủ SP 10/11): chevron 16 px NGAY SAU tên (sau chip), xoay khi mở; CẢ DẢI là một nút (lớp phủ `after:`) — rê / focus cả dải;
       ⓘ và phần phụ nằm trên lớp phủ (`relative z-[1]`) nên vẫn bấm riêng. */
    <h2 className={`sticky top-0 z-[3] m-0 flex min-h-[48px] items-center gap-x-2 border-l-[3px] pl-[13px] pr-2 text-[15px] font-bold leading-snug bg-[color:var(--surface-2)] hover:bg-[color:var(--accent-soft)] has-[:focus-visible]:shadow-[inset_0_0_0_2px_var(--accent)] max-sm:gap-x-1.5 max-sm:pr-1 ${mo ? 'border-b' : ''}`}
      style={{ borderBottomColor: 'var(--line)', borderLeftColor: trungTinh ? 'var(--text-faint)' : 'var(--accent)' }}>
      <button type="button" aria-expanded={mo} onClick={onMo}
        className="group flex min-h-[44px] min-w-0 appearance-none items-center gap-2 border-0 bg-transparent py-2.5 text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
        <span className={trungTinh ? 'text-faint' : 'text-[color:var(--accent)]'}><IconNhom k={k} /></span>
        <span className="min-w-0 text-[color:var(--text)]">{nhan}</span>
        {chip && <span className="inline-flex h-[22px] shrink-0 items-center whitespace-nowrap rounded border px-[7px] text-xs font-semibold tabular-nums text-[color:var(--text)]"
          style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>{chip}</span>}
        <svg viewBox="0 0 16 16" aria-hidden className={`h-4 w-4 shrink-0 fill-none stroke-[color:var(--text-dim)] group-hover:stroke-[color:var(--text)] motion-safe:transition-transform ${mo ? 'rotate-90' : ''}`}
          strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M6 3.5 10.5 8 6 12.5" /></svg>
      </button>
      {luat && <span className="relative z-[1] inline-flex">{luat}</span>}
      {phu && <span className="relative z-[1] flex shrink-0 items-center gap-x-2.5 whitespace-nowrap text-[13px] empty:hidden">{phu}</span>}
    </h2>
  );
}

/*
 * v12 S12 — RANH GIỚI HAI BẬC bằng đường kẻ (không nền xen kẽ: nền đã mang nghĩa dải nhóm / đang chọn / đang rê): bậc 1 giữa hai em, hai dòng "Cả lớp",
 * vạch hạn — 1 px viền ô (`--o-nhap-vien`, tối 3,8 : 1) hết bề ngang; bậc 2 giữa hai việc của CÙNG em — 1 px `--line` bắt đầu từ chữ tên việc.
 */
export const BAC_1 = { borderColor: 'var(--o-nhap-vien)' };
/** Kẻ bậc 2 (v12 S12): giữa hai việc của cùng em, từ chữ tên việc (54 px; 375: 46 px) tới mép phải. `li` cha đã `relative` (`NET_CAY`). */
export const KeBac2 = () => <span aria-hidden className="absolute left-[46px] right-3 top-0 h-px sm:left-[54px] sm:right-4" style={{ background: 'var(--line)' }} />;

/** v12 S5: nút một dòng — việc Phối hợp (nhãn máy chủ "Mở Phối hợp SOS") rút gọn "Phối hợp" ở dòng việc; panel / trang đích giữ chữ đủ. */
const laPhoiHop = (it: WorkItem) => it.group === 'phoi_hop' || it.group === 'phoi_hop_sos';

/** Chung của một dòng việc: nút động từ, hạn, đối tượng phụ, trạng thái đã lưu. */
function useDong(it: WorkItem, { chon, xong, moCaDong, theoDoi, nguoiAn }: ChungDong) {
  const con = it.con?.length && !moCaDong(it) ? it.con : null;
  const xem = theoDoi(it);
  const viecCaLop = it.group === 'chot_len_ft' || it.group === 'xet_lai_lo_trinh' || it.group === 'ky_vong_dau_ra';
  /* brief 7: chế độ theo dõi — không động từ; quyền làm thay thật (`lamThay`) mới có nút. */
  /* U01 #4: nút khay dòng gộp "4 em ▾" — số việc đã ở thẻ phụ. */
  const nut = con ? dich(it.actionLabel.split(' · ')[0]) : laViecChamCheo(it) && !xem ? t('Nhập điểm') : xem ? ((it as { lamThay?: boolean }).lamThay ? (it.group === 'score' ? t('Nhập hộ') : t('Làm thay')) : null) : laPhoiHop(it) ? t('Phối hợp') : dich(it.actionLabel);
  /* QL Tất cả: người giữ việc đứng dưới hạn (mockup `.h .ai`) — cột "khi nào · ai" thẳng hàng. v12 S3: không lặp điều đã biết — việc của tôi,
     việc của GV đang xem (`nguoiAn`), bài chấm chéo ("GV chấm chéo" = tên nhóm) không ghi người. */
  const cc = laViecChamCheo(it) || dich(it.statusLabel) === CHAM_CHEO;
  const nguoi = it.mine || cc || (nguoiAn != null && it.ownerId === nguoiAn) ? null : it.owner ?? (it.ownerId === null && !viecCaLop ? t('Chưa có người') : null);
  return { con, daXong: xong.has(it.key), dangChon: chon === it.key, nut, nguoi, viecCaLop };
}

/**
 * Cột hạn — AUDIT-UI B4 (mockup `.td-han`, 13 px): MỘT dòng mọi trạng thái — quá hạn đỏ 700 "⚠ 68 ngày · 08/07" · gần hạn (mốc sẵn có `ganHan`, ≤ 3 ngày)
 * vàng "⚠ còn 2 ngày · 16/09" / "⚠ hạn hôm nay" · còn xa "hạn 23/09" mờ 600 (V8 hạn = ngày thật) · "không hạn" mờ. Câu đủ ở `title` + trình đọc màn.
 * Người giữ việc ở ĐẦU dòng phụ (`NguoiGiu`, mockup v17 a2).
 */
function CotHan({ it, daXong }: { it: WorkItem; daXong: boolean }) {
  const { homNay } = useNgayNghiepVu();
  const v = it.due && !daXong ? deadlineView({ kind: LOAI_HAN_CUA_VIEC[it.group] ?? 'viec-van-hanh', due: it.due, today: homNay }) : null;
  const qua = v?.tone === 'overdue';
  return (
    <span className={`grid min-w-0 content-center justify-items-start text-[13px] leading-snug ${O_HAN}`}>
      {daXong ? <span className={`font-semibold ${LOP_DA_LUU}`}>{t('✓ Đã lưu')}</span>
        : v && it.due ? qua || v.homNay || v.ganHan ? (
          <span title={v.text} className={`inline-flex items-center gap-1 whitespace-nowrap tabular-nums ${qua ? 'font-bold text-late' : v.ganHan ? 'font-semibold text-soon' : 'font-semibold text-dim'}`}>
            {(qua || v.ganHan) && <span aria-hidden>⚠</span>}
            {qua ? <><span className="sr-only">{t('quá hạn')}</span>{t('{n} ngày', { n: v.daysOverdue ?? 0 })}</>
              : v.homNay ? t('hạn hôm nay') : t('còn {n} ngày', { n: daysBetween(homNay, it.due.slice(0, 10)) })}
            {!v.homNay && <span>· {shortDate(it.due, homNay)}</span>}
          </span>
        ) : <span title={v.text} className="whitespace-nowrap font-semibold tabular-nums text-dim">{nhanHan(it.due, homNay)}</span>
        /* BAO-CAO-PH b: lớp đủ báo cáo PH — viên xám "đủ 23/11" (ngày lớp đủ), không hạn. */
        : it.group === 'xuat_bc_ph' ? <Nhan tone="muted">{dich(it.statusLabel)}</Nhan>
        : laViecChamCheo(it) ? null : <span className="text-faint">{t('không hạn')}</span>}
    </span>
  );
}

/** v12 S13: NGƯỜI = chữ thường mờ (S1: 400) + biểu tượng người — nhận ra không cần đọc, khác tên việc / chip / hạn. */
export function NguoiGiu({ ten, vai }: { ten: string; vai?: string | null }) {
  const nhanVai = vai ? dich(vai) : null;
  return (
    /* RA-GD-0711: tên người xuống dòng thay vì "Phạm Thu T…" (cột 150 px của Chờ duyệt) — tên cắt mất nghĩa. */
    <span className="inline-flex min-w-0 max-w-full items-start gap-[5px] pl-0.5 text-[13px] font-normal leading-snug text-dim" title={nhanVai ? `${ten} · ${nhanVai}` : ten}>
      <svg aria-hidden viewBox="0 0 12 12" className="mt-[3px] h-3 w-3 shrink-0 fill-none stroke-[color:var(--text-faint)]" strokeWidth={1.5}>
        <circle cx="6" cy="4" r="2.2" /><path d="M1.8 11c.5-2.3 2.1-3.5 4.2-3.5s3.7 1.2 4.2 3.5" />
      </svg>
      {/* [XM] #939: vai người gửi với em (máy chủ gắn) — chữ mờ hơn tên, không đậm, cùng hàng (M10). NHAN-MOT-DONG (audit C5): "tên · vai" một dòng
        * khi cột đủ chỗ; tên quá dài mới xuống dòng (không cắt "…"). */}
      <span className="min-w-0 [overflow-wrap:anywhere]">{ten}{nhanVai && <span className="whitespace-nowrap text-faint">{' · '}{nhanVai}</span>}</span>
    </span>
  );
}

/**
 * Cột nút (mockup `.nut`): một nút động từ, chữ một dòng đủ (không "…"). Nút phụ (Gia hạn, Bỏ qua, Xuất) dưới nút chính.
 * AUDIT-UI B5 (V18): 375 ẩn nút động từ — chạm cả dòng mở đúng panel, "›" mờ bên phải; còn hiện: nút "n ▾" (`trieu`), nút phụ, "Xem lại".
 */
function CotNut({ it, nut, daXong, mo, trieu, nhanNut, onBam, nutPhu }: {
  it: WorkItem; nut: string | null; daXong: boolean; mo?: boolean; trieu?: boolean; nhanNut?: string; onBam: () => void; nutPhu?: ReactNode;
}) {
  /* U01 #7: dòng vừa xong đứng nguyên chỗ — "Xem lại" mở lại panel của việc đó. */
  if (daXong) {
    return (
      <span className={`flex ${O_NUT}`}>
        <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" aria-label={t('Xem lại: {viec}', { viec: tenBoEm(it) })} onClick={(e) => { e.stopPropagation(); onBam(); }}>{t('Xem lại')}</button>
      </span>
    );
  }
  const coTrieu = mo !== undefined || !!trieu;
  const an375 = !coTrieu;   // nút động từ ẩn ở 375 — cả dòng là nút
  const muiTen = an375 && !nutPhu && <span aria-hidden className="self-start text-[15px] leading-snug text-faint max-sm:col-start-2 max-sm:row-start-1 sm:hidden">›</span>;
  if (!nut && !nutPhu) return <>{muiTen}<span className={`${O_NUT} max-sm:hidden`} /></>;
  return (
    <>
      {muiTen}
      <span className={`flex flex-col items-stretch gap-1.5 ${O_NUT} ${an375 && !nutPhu ? 'max-sm:hidden' : ''}`} onClick={(e) => e.stopPropagation()}>
        {nut && (
          <button type="button" className={`btn btn-sm min-h-[44px] justify-center whitespace-nowrap px-2.5 text-[13px] font-semibold sm:h-[30px] sm:min-h-[30px] ${an375 ? 'max-sm:hidden' : ''}`} onClick={onBam}
            aria-label={nhanNut} aria-expanded={it.con?.length && mo !== undefined ? mo : undefined}>
            {nut}{coTrieu && <span aria-hidden className="ml-1">▾</span>}
          </button>
        )}
        {nutPhu}
      </span>
    </>
  );
}

/** Tên việc bỏ tên em (máy chủ ghép "Xác nhận Case R · {em}") — tên em đã ở tầng ②. */
const tenBoEmGoc = (it: WorkItem) => {
  const vi = it.group === 'bao_ph_yt' && it.phu ? it.phu : it.tieuDe;
  return vi.split(' · ').filter((x) => !x.startsWith(it.studentName)).join(' · ') || vi;
};
export const tenBoEm = (it: WorkItem) => tenViec(tenBoEmGoc(it));
/** GD-1b (chủ SP lời 24, `04-thiet-ke.md` mục 14; mockup ⑤ B): MỌI dòng việc một dạng "Lớp · tên việc ngắn" — kể cả việc của một em (tên em là thẻ phụ). */
const voiLop = (it: WorkItem, ten: string) => (it.classCode && !ten.split(' · ').includes(it.classCode) ? `${it.classCode} · ${ten}` : ten);
/** U01 #15: tên việc máy chủ đã ghép "{thao tác} · {kỹ năng}" (`mywork.ts sauCham`) — web chỉ dịch. */
export const tenViec = (vi: string) => vi.split(' · ').map((x) => dich(x)).join(' · ');
/**
 * AUDIT-UI B4 (CV1, chủ SP 08/11): ở DANH SÁCH, tên dòng = đối tượng ("Nhập điểm Listening, Reading" → "Listening, Reading") — động từ đã ở tên mục và ở nút.
 * Chỉ loại việc mà tên mục nói đúng động từ đó (Chấm điểm › Mock Test…, Phương án › Thêm PA, Mô tả Case, Kết quả PA). Panel, "Tiếp: …" giữ tên đủ (`tenBoEm`).
 */
const DONG_TU: Partial<Record<string, RegExp>> = { score: /^Nhập điểm /, no_plan: /^Thêm (?=PA )/, ghi_nhan_xet: /^Mô tả Case · /, ghi_ket_qua_pa: /^Ghi kết quả PA · / };
const boDongTu = (group: string, vi: string) => { const r = DONG_TU[group]; return (r && vi.replace(r, '')) || vi; };
/* U01 #18: chip mức Case báo tay chỉ hiện "Gấp" (tông `danger`, `levelOf`) — "Bình thường" (tông `neutral`) không mang tin. */
const chipMuc = (it: WorkItem, boSos: boolean) => (!it.level ? null : mucSosTheoNhan(it.level.text)
  ? (boSos ? null : <ChipSos muc={mucSosTheoNhan(it.level.text)!} tinh />) : (it.level.tone as string) !== 'neutral' ? <Level tone={it.level.tone}>{dich(it.level.text)}</Level> : null);

/**
 * Tuần là MỘT thẻ riêng "W4 JUL" (AUDIT-UI B4 — mockup bỏ chữ "tuần" của U01 #3: thẻ tách riêng, có tháng, không lẫn W1 Writing).
 * Lượt Progress / Final đi liền tuần trong một thẻ: "Progress Test W3 AUG" → "Progress W3 AUG".
 */
const MA_TUAN = /\b(W[1-5] [A-Z]{3})\b/;
const LA_SO = /^\d+ (em|việc|bài|HV|lớp)$/;
const tachTuan = (x: string): string[] => {
  const m = MA_TUAN.exec(x);
  if (!m) return [dich(x)];
  const truoc = x.slice(0, m.index).trim();
  const sau = x.slice(m.index + m[0].length).trim();
  const loai = /^(Progress|Final) Test$/.exec(truoc);
  return [loai ? `${loai[1]} ${m[1]}` : truoc ? dich(truoc) : '', loai ? '' : m[1], sau ? dich(sau) : ''].filter(Boolean);
};
/** Chuỗi phụ "a · b · c" của máy chủ → thẻ phụ (mockup `.the-phu .tag.nhat`): lượt · tuần · số bài / em / việc. */
export const thePhu = (ds: readonly (string | null | undefined)[]) => ds.filter((x): x is string => !!x).flatMap((x) => x.split(' · ')).flatMap(tachTuan);
/**
 * Thẻ phụ — v12 S2: MỘT hàng, thiếu chỗ thì cắt "…" (rê chuột thấy đủ, `title`); S1: chữ 500 mờ; S13: lượt / tuần / số = chip NỀN NHẠT góc 6,
 * loại việc (`vien`, Chờ bạn duyệt) = chip VIỀN — hai dáng, không ghép thành chuỗi "a · b · c".
 */
export function ThePhu({ ds, vien = [] }: { ds: readonly string[]; vien?: readonly string[] }) {
  if (!ds.length && !vien.length) return null;
  const the = 'h-5 min-w-0 shrink truncate rounded-md px-1.5 text-xs font-medium leading-5 text-dim';
  return (
    <span className="mt-[3px] flex min-w-0 flex-nowrap items-center gap-[3px] overflow-hidden">
      {vien.map((x, i) => <span key={`v${i}`} title={x} className={`${the} border leading-[18px]`} style={{ borderColor: 'var(--line-strong)' }}>{x}</span>)}
      {ds.map((x, i) => <span key={i} title={x} className={the} style={{ background: 'var(--surface-2)' }}>{x}</span>)}
    </span>
  );
}

/**
 * "›" sau tên = dòng này mở TRANG (không phải panel). 06/11: dòng đã có nút động từ bên phải thì tên không thêm "›" (nút đã nói).
 * AUDIT-UI B5: 375 mọi dòng có "›" mờ bên phải (`CotNut`) — "›" sau tên chỉ còn ≥ 640. Dính vào chữ cuối của tên (khoảng trắng không ngắt).
 */
function MuiTenMoTrang({ it, dong, nut }: { it: WorkItem; dong: ChungDong; nut: string | null }) {
  if (!dong.moTrang(it) || it.group === 'xuat_bc_ph' || nut) return null;
  return <span aria-label={t('mở trang')} className="text-[13px] font-normal text-[color:var(--accent)] max-sm:hidden">{' '}›</span>;
}

/**
 * Dòng phụ — AUDIT-UI B4 (mockup `.the-phu .tag.nhat`): ≥ 640 mỗi mẩu là MỘT THẺ nền nhạt 12 / 500 (em · lớp · tuần · n bài), một hàng
 * (rê chuột thấy đủ chữ — `title` lấy chữ của dòng; thẻ không đủ chỗ ẩn cả thẻ); người giữ việc (`nguoi`, v12 S13) đứng đầu, chữ mờ + biểu tượng, không thẻ.
 * < 640 (mockup B5): chữ 13 mờ nối " · ", xuống dòng khi thiếu chỗ — không cắt (RA-GD-0711, điện thoại không rê được); "·" dính CUỐI mẩu trước.
 * Dòng có huy hiệu TVV (`children`) giữ xuống dòng — huy hiệu không bị cắt.
 */
/* Thẻ giữ đủ chữ; hàng ≥ 640 cao đúng một thẻ — thẻ không đủ chỗ rơi xuống hàng ẩn (thứ tự quan trọng trước), không thẻ nào bị cắt nửa / "Phan Khánh Li…". */
const THE_PHU = 'sm:h-5 sm:rounded-md sm:bg-[color:var(--surface-2)] sm:px-1.5 sm:text-xs sm:font-medium sm:leading-5';
const DongPhu = ({ nguoi, ds, children }: { nguoi?: ReactNode; ds: readonly ReactNode[]; children?: ReactNode }) => {
  const coHuy = Children.toArray(children).length > 0;   // `{tvv && …}` = false khi không phải TVV — không tính
  const cham = (i: number) => i < ds.length - 1 && <span aria-hidden className="sm:hidden"> ·</span>;
  return ds.length || coHuy || nguoi ? (
  <span onMouseEnter={(e) => { e.currentTarget.title = e.currentTarget.textContent ?? ''; }}
    className={`flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[13px] leading-snug text-dim sm:mt-[3px] sm:gap-[3px] ${coHuy ? '' : 'sm:h-5 sm:overflow-hidden'}`}>
    {nguoi && <span className="shrink-0 whitespace-nowrap sm:mr-1">{nguoi}{ds.length > 0 && <span aria-hidden className="sm:hidden"> ·</span>}</span>}
    {ds.map((x, i) => <span key={i} className={`whitespace-nowrap sm:shrink-0 ${THE_PHU}`}>{x}{cham(i)}</span>)}
    {children}
  </span>
) : null;
};
/* AUDIT-UI B4 (mockup `.viec .t1`): tên dòng 15 / 500. */
const TEN = 'min-w-0 scroll-mt-14 appearance-none border-0 bg-transparent p-0 text-left text-[15px] font-medium leading-snug disabled:cursor-default';

/**
 * MỘT VIỆC CỦA MỘT EM (mockup v17 `.viec`): tên việc (không lặp tên em) · dòng phụ = em (link hồ sơ — tách xem hồ sơ / làm việc) · lớp · SOS · lượt / tuần.
 * Tên là nút thật (bàn phím); bấm chỗ trống của dòng = bấm tên (một kiểu mở).
 */
function DongViec({ it, ...dong }: ChungDong & { it: WorkItem }) {
  const { daXong, dangChon, nut, nguoi } = useDong(it, dong);
  const tvv = laViecTvvTheoEm(it);
  const ten = voiLop(it, tenViec(boDongTu(it.group, tenBoEmGoc(it))));
  const sos = it.level ? mucSosTheoNhan(it.level.text) : null;
  /* Phụ không lặp tên việc (TVV: "Báo PH · Report 1" / phụ "Report 1"). GD-1b: lớp đã ở tên dòng. */
  const phu = [...thePhu([sos ? `SOS ${sos}` : null, it.contextLabel ?? it.phu, it.group === 'score' && it.soBai ? t('{soBai} bài', { soBai: it.soBai }) : null])
    .filter((x) => !ten.includes(x)), ...(it.coNhap ? [t('Có nháp')] : [])];
  const muc = chipMuc(it, true);
  const bam = () => dong.onOpen(it);
  return (
    <div data-hd="cv-dong" data-khoa={it.key} onClick={daXong ? undefined : bam} title={dich(it.reason)}
      className={`${DONG} ${dangChon ? 'row-active' : daXong ? 'cursor-default' : 'bam'}`}>
      <span className="flex min-w-0 items-center gap-3 max-sm:items-start"><AvViec it={it} />
      <span className="grid min-w-0 gap-0.5">
        <button type="button" disabled={daXong} onClick={(e) => { e.stopPropagation(); bam(); }} aria-current={dangChon ? 'true' : undefined}
          className={`${TEN} ${daXong ? 'text-dim' : 'text-[color:var(--text)]'}`}>
          <span className={daXong ? 'line-through' : ''}>{daXong && <span aria-hidden className="text-ok">✓ </span>}<TenCn ten={ten} ma={dong.theCn?.(it)} /></span>
          <MuiTenMoTrang it={it} dong={dong} nut={nut} />
          {muc && <span className="ml-2 inline-flex align-middle">{muc}</span>}
        </button>
        <DongPhu nguoi={nguoi && !daXong ? <NguoiGiu ten={nguoi} /> : null} ds={[
          <Link key="em" to={`/hoc-vien/${it.studentId}`} title={t('Mở hồ sơ {ten}', { ten: it.studentName })} onClick={(e) => e.stopPropagation()}
            className="text-dim no-underline hover:text-[color:var(--accent)] hover:underline">{it.studentName}</Link>,
          ...phu,
        ]}>
          {tvv && !daXong && <span className="min-w-0 max-w-full empty:hidden [&>span]:h-auto [&>span]:min-h-[22px] [&>span]:whitespace-normal [&>span]:py-0.5 [&>span]:leading-snug"><BadgeViecTvv it={it} /></span>}
          {tvv && !daXong && <ConNgay it={it} />}
        </DongPhu>
      </span></span>
      <CotHan it={it} daXong={daXong} />
      <CotNut it={it} nut={nut} daXong={daXong} onBam={bam} nutPhu={dong.nutPhu?.(it)} />
    </div>
  );
}

/**
 * DÒNG LỚP / NHÓM EM — chính dòng là việc (mockup v17 `.viec`): tên việc · dòng phụ = lớp · lượt · tuần · n em / n bài. Dòng gộp: "n em ▾" mở khay em nền chìm
 * có viền bên dưới; `moCaDong` (Xác nhận PA lô, Nhập điểm theo tuần) bấm mở một panel lô.
 */
function DongLop({ it, ...dong }: ChungDong & { it: WorkItem }) {
  const [mo, setMo] = useState(false);
  const { con, daXong, dangChon, nut, nguoi, viecCaLop } = useDong(it, dong);
  const gop = !!it.con?.length;
  const bam = () => (con ? setMo(!mo) : dong.onOpen(it));
  const maDs = `con-${it.key}`;
  /* AUDIT-UI B4 (CV5): Nhập điểm theo tuần nhiều lớp (`moCaDong`) — tên "Cả lớp", nút "4 lớp ▾" (dáng "n em ▾") mở panel lô như cũ; dòng phụ không lặp "4 lớp". */
  const caTuan = gop && !con && it.group === 'score' && /^\d+ lớp$/.test(it.contextLabel ?? '');
  /* U01 #3–#4: tên việc máy chủ ghép "Mô tả Case · MB FT 101 · 4 em · 8 việc" — mã lớp / số / tuần sang dòng phụ (mockup v17: "MB FT 101 · MT3 · W1 NOV · 8 bài"). */
  const caLop = !!it.classCode && (gop || viecCaLop || it.studentName === 'Lớp ' + it.classCode);
  const phan = (it.group === 'bao_ph_yt' && it.phu ? it.phu : it.tieuDe).split(' · ');
  const laThe = (x: string) => LA_SO.test(x) || MA_TUAN.test(x);
  /* SOS ghi ở từng em trong khay — dòng gộp không lặp. 06/11: Xét lại lộ trình không liệt kê tên em — chỉ "n em"; tên mở ở panel. */
  const soTong = Number(phan.find((x) => LA_SO.test(x))?.split(' ')[0]);
  /* 06/11: thẻ "n em quá hạn" bằng đúng tổng thì bỏ (cột hạn đỏ đã nói); chỉ giữ khi quá hạn MỘT PHẦN. */
  /* P1 rà 11/11 G4-18: dòng vừa xong không ghi tiến độ cũ ("GVCN · 0/1 đã xác nhận · chờ môn…", "n em chưa chọn") — tiến độ là của lúc trước khi lưu. */
  const ngCanh = it.group === 'xet_lai_lo_trinh' || caTuan || (daXong && (it.group === 'ban_giao' || viecCaLop)) ? null : gop
    ? it.contextLabel?.split(' · ').filter((x) => !/^SOS \d/.test(x) && !(soTong && dich(x) === t('{n} em quá hạn', { n: soTong }))).join(' · ') : it.contextLabel;
  const tenGoc = phan.filter((x) => x !== it.classCode && !laThe(x)).join(' · ') || phan[0];
  /* 06/11: số em chỉ ghi MỘT lần — tên việc đã có "n em", hoặc việc cả lớp có thẻ ngữ cảnh "n em chưa chọn" thì không thêm "n HV". */
  const daCoSoEm = phan.some((x) => /^\d+ (em|HV)$/.test(x)) || (viecCaLop && !!ngCanh && /^\d+ em/.test(ngCanh));
  /* GD-1b: lớp lên tên dòng ("MB FT 101 · Listening, Reading") — dòng phụ không lặp lớp. */
  const phu = thePhu([
    caLop || gop || viecCaLop || it.studentName === 'Lớp ' + it.classCode ? null : it.studentName,
    ngCanh,
    /* AUDIT-UI CV8: nút khay đã ghi "3 em ▾" → dòng phụ không lặp "· 3 em". */
    ...phan.filter((x) => x !== it.classCode && laThe(x) && !(gop && /^\d+ việc$/.test(x) && phan.some((y) => /^\d+ em$/.test(y))) && !(con && nut === dich(x))),   // "4 em · 8 việc" → chỉ "4 em"
    !gop && it.group === 'score' && it.soBai && !phan.some((x) => / bài$/.test(x)) ? t('{soBai} bài', { soBai: it.soBai }) : !gop && it.count !== null && it.count > 1 && !daCoSoEm ? t('{n} HV', { n: it.count }) : null,
  ]);
  const muc = chipMuc(it, false);
  return (
    <div className={con && mo ? 'bg-[color:var(--bg)]' : ''}>
      <div data-hd="cv-dong" data-khoa={it.key} onClick={daXong ? undefined : bam} title={con ? undefined : dich(it.reason)}
        className={`${DONG} ${dangChon ? 'row-active' : daXong ? 'cursor-default' : 'bam'}`}>
        <span className="flex min-w-0 items-center gap-3 max-sm:items-start"><AvViec it={it} />
        <span className="grid min-w-0 gap-0.5">
          <button type="button" disabled={daXong} onClick={(e) => { e.stopPropagation(); bam(); }} aria-expanded={con ? mo : undefined} aria-controls={con && mo ? maDs : undefined}
            aria-current={dangChon ? 'true' : undefined} className={`${TEN} ${daXong ? 'text-dim' : 'text-[color:var(--text)]'}`}>
            <span className={daXong ? 'line-through' : ''}>{daXong && <span aria-hidden className="text-ok">✓ </span>}<TenCn ten={caTuan ? t('Cả lớp') : voiLop(it, tenViec(boDongTu(it.group, tenGoc)))} ma={dong.theCn?.(it)} /></span>
            {!con && <MuiTenMoTrang it={it} dong={dong} nut={nut} />}
            {muc && <span className="ml-2 inline-flex align-middle">{muc}</span>}
          </button>
          <DongPhu nguoi={nguoi && !daXong ? <NguoiGiu ten={nguoi} /> : null} ds={phu} />
        </span></span>
        {/* UA-03: dòng gộp cũng ghi người phụ trách (QL "Tất cả" phân biệt ba dòng giống nhau) — ở đầu dòng phụ. */}
        <CotHan it={it} daXong={daXong} />
        <CotNut it={it} nut={caTuan && nut ? dich(it.contextLabel!) : nut} trieu={caTuan} nhanNut={caTuan ? `${t('Nhập điểm')} · ${dich(it.contextLabel!)}` : undefined}
          daXong={daXong} mo={con ? mo : undefined} onBam={bam} nutPhu={dong.nutPhu?.(it)} />
      </div>
      {con && mo && (
        <ul id={maDs} className="m-0 list-none border-t border-dashed p-0 pb-1.5" style={{ borderColor: 'var(--line-strong)' }} aria-label={dich(it.tieuDe)}>
          {con.map((x, i) => <li key={x.key} className={i ? 'border-t' : ''} style={{ borderColor: 'var(--line)' }}><DongCon it={x} {...dong} /></li>)}
        </ul>
      )}
    </div>
  );
}

/*
 * PHOI-HOP-V2 (chủ SP 11/11: "trường thông tin khác nhau, nhưng nhìn y như nhau… chú ý cả phần ý thức"; mockup #1368 K1) — Ô VIỆC GỌN cho tab
 * "Ý thức & Phối hợp" (+ việc TVV sau Meeting CX): MỖI TRƯỜNG MỘT KIỂU — dòng 1 tên việc 15 / 600 + số em 13 mờ (không ghi khi 1 em); dòng 2 lớp chữ mờ
 * không khung + tên em là chip TRÒN viền mảnh (≤ 2, không đủ chỗ → 1, còn lại "+n"; tên không bao giờ cắt); hạn cột riêng; MỘT nút động từ. Không điểm,
 * không kỹ năng trượt trong ô; ô cao đều 64 px (375: ba tầng). Chip tên ở dòng gộp mở đúng việc của em đó.
 */
const LA_GON = new Set(['phoi_hop_sos', 'phoi_hop_tvv', 'yt_xu_ly', 'yt_xem', 'yt_thuc_hien', 'khai_bac']);
/* Chữ qua `t` lúc vẽ (đổi ngôn ngữ không tải lại mô-đun). */
const tenGon = (g: string): string | null => ({
  yt_xu_ly: t('Xử lý vi phạm'), yt_xem: t('Xem vi phạm mới'), yt_thuc_hien: t('Ghi đã thực hiện'), khai_bac: t('Xác nhận cấp bậc'), phoi_hop_tvv: t('Báo PH · Meeting CX/GĐCN'),
} as Record<string, string>)[g] ?? null;
const nutGon = (g: string): string | null => ({
  yt_xu_ly: t('Xử lý'), yt_xem: t('Xem'), yt_thuc_hien: t('Ghi'), khai_bac: t('Xác nhận'), phoi_hop_tvv: t('Ghi KQ'), phoi_hop_sos: t('Xác nhận'),
} as Record<string, string>)[g] ?? null;
/** ponytail: đo chữ bằng số ký tự (hai tên ≤ 26 ký tự thì hai chip) — đổi sang đo DOM khi cột danh sách đổi bề rộng. */
const HAI_CHIP_TOI_DA = 26;
/* Chip tên em: dáng tròn chung `CHIP_TRON` (ui/Nhan), viền mảnh + chữ mờ 500 — khác thẻ lớp / thẻ phụ góc 6. */
const CHIP = `${CHIP_TRON} shrink-0 px-[9px] !font-medium text-dim max-sm:h-6`;

function DongGon({ it, ...dong }: ChungDong & { it: WorkItem }) {
  const [mo, setMo] = useState(false);
  const { daXong, dangChon, nguoi } = useDong(it, dong);
  const con = it.con?.length && !dong.moCaDong(it) ? it.con : null;
  const xem = dong.theoDoi(it);
  /* Ô gọn: em của dòng — dòng gộp (khay), dòng Phối hợp lớp × việc (`emTen`), hay một em. */
  const em = con ? [...new Map(con.map((c) => [c.studentId, { ten: c.studentName, x: c as WorkItem }])).values()]
    : it.emTen ? it.emTen.map((ten) => ({ ten, x: it })) : it.studentId !== null ? [{ ten: it.studentName, x: it }] : [];
  const n = con ? em.length : it.count ?? em.length;
  const ten = voiLop(it, tenGon(it.group) ?? dich(it.tieuDe.split(' · ')[0]));
  const hai = em.length > 1 && em[0].ten.length + em[1].ten.length <= HAI_CHIP_TOI_DA;
  const hien = em.slice(0, hai ? 2 : 1);
  const dongTu = nutGon(it.group) ?? dich(it.actionLabel);
  /* V5 brief 7: việc người khác — chỉ khi máy chủ cho làm thay; QL làm Phối hợp như GVCN (chủ SP 11/11: không chữ "làm thay"). */
  const nut = xem && !(it as { lamThay?: boolean }).lamThay ? null : dongTu;
  const bam = () => (con ? setMo(!mo) : dong.onOpen(it));
  const maDs = `con-${it.key}`;
  return (
    <div className={con && mo ? 'bg-[color:var(--bg)]' : ''}>
      <div data-hd="cv-dong" data-khoa={it.key} onClick={daXong ? undefined : bam} title={dich(it.reason)}
        className={`${DONG} sm:min-h-16 ${dangChon ? 'row-active' : daXong ? 'cursor-default' : 'bam'}`}>
        <span className="flex min-w-0 items-center gap-3 max-sm:items-start"><AvViec it={it} />
        <span className="grid min-w-0 gap-[5px]">
          <button type="button" disabled={daXong} onClick={(e) => { e.stopPropagation(); bam(); }} aria-expanded={con ? mo : undefined} aria-controls={con && mo ? maDs : undefined}
            aria-current={dangChon ? 'true' : undefined} className={`${TEN} flex min-w-0 items-baseline gap-2`}>
            <span className={`min-w-0 font-semibold ${daXong ? 'text-dim line-through' : 'text-[color:var(--text)]'}`}>{daXong && <span aria-hidden className="text-ok">✓ </span>}<TenCn ten={ten} ma={dong.theCn?.(it)} /></span>
            {n > 1 && <span className="shrink-0 whitespace-nowrap text-[13px] font-semibold tabular-nums text-dim">{t('{n} em', { n })}</span>}
          </button>
          <span className="flex h-[22px] min-w-0 items-center gap-1.5 overflow-hidden max-sm:h-auto max-sm:flex-wrap max-sm:overflow-visible">
            {nguoi && !daXong && <span className="mr-1 shrink-0"><NguoiGiu ten={nguoi} /></span>}
            {hien.map((e, i) => (
              <button key={i} type="button" className={`${CHIP} cursor-pointer appearance-none bg-transparent hover:border-[color:var(--accent)] hover:text-[color:var(--text)] ${i ? 'max-sm:hidden' : ''}`}
                style={{ borderColor: 'var(--line-strong)' }} title={t('Mở việc của {ten}', { ten: e.ten })} onClick={(ev) => { ev.stopPropagation(); dong.onOpen(e.x); }}>{e.ten}</button>
            ))}
            {n > hien.length && <span className={`${CHIP} border-dashed font-semibold tabular-nums text-[color:var(--accent)] ${hai ? 'max-sm:hidden' : ''}`} style={{ borderColor: 'var(--line-strong)' }}>+{n - hien.length}</span>}
            {hai && n > 1 && <span className={`${CHIP} border-dashed font-semibold tabular-nums text-[color:var(--accent)] sm:hidden`} style={{ borderColor: 'var(--line-strong)' }}>+{n - 1}</span>}
          </span>
        </span></span>
        <CotHan it={it} daXong={daXong} />
        {/* 375: dòng gộp — chạm cả dòng mở khay, "▾" mờ thay nút (nút chiếm chỗ làm chip tên xuống dòng). */}
        {con ? (
          <>
            <span aria-hidden className={`self-start text-[15px] leading-snug text-faint max-sm:col-start-2 max-sm:row-start-1 sm:hidden ${mo ? 'rotate-180' : ''}`}>▾</span>
            <span className="contents max-sm:[&>*]:hidden"><CotNut it={it} nut={nut} daXong={daXong} mo={mo} onBam={bam} nutPhu={dong.nutPhu?.(it)} /></span>
          </>
        ) : <CotNut it={it} nut={nut} daXong={daXong} onBam={bam} nutPhu={dong.nutPhu?.(it)} />}
      </div>
      {con && mo && (
        <ul id={maDs} className="m-0 list-none border-t border-dashed p-0 pb-1.5" style={{ borderColor: 'var(--line-strong)' }} aria-label={ten}>
          {con.map((x, i) => <li key={x.key} className={i ? 'border-t' : ''} style={{ borderColor: 'var(--line)' }}><DongCon it={x} {...dong} /></li>)}
        </ul>
      )}
    </div>
  );
}

/** Một em trong khay dòng gộp: tên em (`conTen`) · phụ (`conPhu`) · hạn · nút — thẳng cột hạn / nút với dòng trên, thụt 16 px. */
function DongCon({ it, ...dong }: ChungDong & { it: WorkItem & { conTen: string; conPhu: string } }) {
  const { daXong, dangChon, nut, nguoi } = useDong(it, dong);
  const bam = () => dong.onOpen(it);
  return (
    <div data-hd="cv-dong" data-khoa={it.key} onClick={daXong ? undefined : bam} title={dich(it.reason)}
      className={`${DONG} min-h-[48px] pl-8 max-sm:py-2 sm:pl-8 ${dangChon ? 'row-active' : daXong ? 'cursor-default' : 'bam'}`}>
      <span className="grid min-w-0 gap-0.5">
        <button type="button" disabled={daXong} onClick={(e) => { e.stopPropagation(); bam(); }} aria-current={dangChon ? 'true' : undefined}
          className={`${TEN} font-medium ${daXong ? 'text-dim' : 'text-[color:var(--text)]'}`}>{daXong && <span aria-hidden className="text-ok">✓ </span>}{dich(it.conTen)}</button>
        <DongPhu nguoi={nguoi && !daXong ? <NguoiGiu ten={nguoi} /> : null} ds={[...(it.conPhu ? [dich(it.conPhu)] : []), ...(it.coNhap ? [t('Có nháp')] : [])]} />
      </span>
      <CotHan it={it} daXong={daXong} />
      <CotNut it={it} nut={nut} daXong={daXong} onBam={bam} nutPhu={dong.nutPhu?.(it)} />
    </div>
  );
}

/** Việc TVV theo từng em (Báo PH · Sau thi · Chốt ngày thi) — dòng kiểu `tvv.html .viec`. */
const laViecTvvTheoEm = (it: WorkItem) => it.studentId !== null && !it.con?.length
  && (it.group === 'bao_ph_yt' || it.group === 'thi_that' || it.group === 'buoc_tiep' || it.key.startsWith('chot-ngay-thi:'));

/** Báo PH hạn xa "còn n ngày" ở dòng phụ của việc (mockup `v7/cong-viec-2.html` `t2`), cột hạn một dòng. Quá hạn / sắp hạn đã có tín hiệu của `ChipHan`. */
function ConNgay({ it }: { it: WorkItem }) {
  const { homNay } = useNgayNghiepVu();
  if (it.group !== 'bao_ph_yt' || it.urgency !== 'normal' || !it.due || !homNay) return null;
  return <span>{t('còn {n} ngày', { n: daysBetween(homNay, it.due) })}</span>;
}

/** Badge trạng thái của việc TVV (mockup): "⚠ Chưa liên hệ được · lần n" (sắp hạn) · "Đã có kết quả · Chưa chốt bước tiếp" (tiến độ) · "Đã thi · chờ KQ" (lịch thi). */
function BadgeViecTvv({ it }: { it: WorkItem }) {
  if (it.group === 'bao_ph_yt' && it.soLanThu) {
    return <span className={`${CHIP_TRON} gap-1 bg-soon-bg text-soon`}><span aria-hidden>⚠</span>{t('Chưa liên hệ được · lần {n}', { n: it.soLanThu })}</span>;
  }
  if (it.group === 'buoc_tiep') return <Nhan tone="doing">{t('Đã có kết quả · Chưa chốt bước tiếp')}</Nhan>;
  if (it.group === 'thi_that') return <NhanLich loai="da-thi">{t('Đã thi · chờ KQ')}</NhanLich>;
  return null;
}
