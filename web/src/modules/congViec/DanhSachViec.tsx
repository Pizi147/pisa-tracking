import { TheChoGv } from '../yThuc/TraLai.tsx';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { LOP_DA_LUU, NutHoanTac } from '../../ui/KhuonViec.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { Level } from '../../ui/ui.tsx';
import { DauQuaHan, NhanChoGv } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { mucSosTheoNhan } from '../../lib/format.ts';
import { ChamSpeakingMuc } from './ChamSpeakingMuc.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import {
  CASE_CATEGORY_SHORT, CHAM_CHEO, KHOA_CHAM_SPEAKING, LOAI_HAN_CUA_VIEC, demBai, bacNgan, deadlineView, laViecChamCheo, mucHan, shortDate, tuanLich, type MucTab,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';



type ChungDong = {
  onOpen: (it: WorkItem) => void; chon: string | null; xong: ReadonlySet<string>;
  moTrang: (it: WorkItem) => boolean; moCaDong: (it: WorkItem) => boolean;
  /** V5 (brief 7): việc của người khác — dòng không nút động từ; có nút (tên hành động như chủ việc — N64) khi máy chủ báo `lamThay`. */
  theoDoi: (it: WorkItem) => boolean;
  /** v12 S3: đang xem việc của MỘT GV (id) — dòng của GV đó không lặp tên (dải "Đang xem việc của…" đã nói). */
  nguoiAn?: number | null;
  /** NHẸ HƠN PR-2a (v23 ④ vòng 2): Admin — danh sách không ghi người phụ trách (người phụ trách ở panel lớp). */
  anNguoi?: boolean;
  /** CV-TAB b (mockup `.cn`): mã chi nhánh của dòng — chỉ khi GV có việc ở > 1 chi nhánh. */
  theCn?: (it: WorkItem) => string | null;
  /** VIEC-XONG-AN: dải "✓ Đã lưu · Hoàn tác" thay dòng vừa xong (`xong`) — danh sách việc cần làm; không có (vd "Xong hôm nay") thì dòng xong vẽ như cũ. */
  daiXong?: (it: WorkItem) => ReactNode;
  /** KHUÔN A (25/11): tab Chấm Speaking — mỗi lớp một dòng; `lop` = lớp đang mở ở panel (`?lc=`), `mo` mở panel của một lớp. */
  chamS?: { lop: number | null; /** QL nhiều GV S: GV (id) của lớp đang mở. */ nguoi: number | null; mo: (it: WorkItem, classId: number) => void;
    /** Rỗng: "Còn: …" và "Việc tiếp ›". */ con: string | null; onTiep: (() => void) | null };
};

/**
 * VIEC-XONG-AN (chủ SP 21/11 "nhảy vị trí… không ẩn đi khi hoàn thiện"): dải phủ ĐÚNG chỗ dòng vừa xong — dòng vẫn vẽ (ẩn) để giữ chiều cao,
 * nên các dòng khác không xê dịch tới khi dải hết giờ và dòng rời danh sách.
 */
function VeDong({ x, dong, children }: { x: WorkItem; dong: ChungDong; children: ReactNode }) {
  const dai = dong.xong.has(x.key) ? dong.daiXong?.(x) : null;
  if (!dai) return <>{children}</>;
  return <div className="cvA-sub relative" data-dai-xong={x.key}><div className="cvA-sub invisible">{children}</div><div className="absolute inset-0">{dai}</div></div>;
}

/** Nội dung dải: "✓ Đã lưu · {lớp · việc} · {em}" + Hoàn tác (chỉ khi panel có đường đảo); `hoan` = vừa hoàn tác, chờ dòng trở lại. */
export function DaiXongDong({ it, hoanTac, hoan, onHoanTac }: { it: WorkItem; hoanTac?: () => Promise<void>; hoan?: boolean; onHoanTac: () => void }) {
  return (
    <div role="status" className="flex h-full items-center gap-x-2 overflow-hidden bg-ok-bg pl-[15px] pr-3.5 text-[13px] leading-snug sm:pl-[17px] sm:pr-4"
      style={{ boxShadow: 'inset 3px 0 0 var(--ok)' }}>
      <b className="shrink-0 font-bold text-ok">{hoan ? <><span aria-hidden>↺ </span>{t('Đã hoàn tác')}</> : t('✓ Đã lưu')}</b>
      <span className="min-w-0 text-slate-300 [overflow-wrap:anywhere]">
        {voiLop(it, tenBoEm(it))}{it.studentId !== null && <> · <span className="ten-hv">{it.studentName}</span></>}
      </span>
      <span className="flex-1" />
      {hoanTac && !hoan && <span className="shrink-0"><NutHoanTac hoanTac={hoanTac} onHoanTac={onHoanTac} /></span>}
    </div>
  );
}

/** Tên việc + thẻ mã chi nhánh nhỏ (mockup v17 `.cn`): thẻ dính chữ cuối của tên (không rơi một mình xuống dòng ở 375). */
/** AUDIT-2111 A2-07: cụm "Final Test 45%" / "Progress Test" không bị xuống dòng giữa chừng — chỉ ngắt ở " · ". */
const CUM_TEST = /((?:Progress|Final) Test(?: \d+ ?%)?)/;
const giuCum = (ten: string): ReactNode => (CUM_TEST.test(ten)
  ? ten.split(CUM_TEST).map((x, i) => (i % 2 ? <span key={i} className="whitespace-nowrap">{x}</span> : x)) : ten);
const TenCn = ({ ten, ma }: { ten: string; ma: string | null | undefined }) => {
  if (!ma) return <>{giuCum(ten)}</>;
  const i = ten.lastIndexOf(' ');
  return <>{ten.slice(0, i + 1)}<span className="whitespace-nowrap">{ten.slice(i + 1)}
    <span className="ml-1.5 inline-flex h-[18px] items-center rounded-[5px] border px-1.5 align-[2px] text-xs font-semibold text-dim" style={{ borderColor: 'var(--line-strong)' }}>{ma}</span></span></>;
};

/* AUDIT-UI B4 (mockup `.viec`): [tên + thẻ phụ | hạn 136 px | nút 112 px] từ 640 px — nút dài hơn ("Bàn giao môn P" 122 px, RA-GD-0711) nới cột, không cắt.
   B5 (V18): 375 [tên + phụ, hạn dưới | "›"] — chạm cả dòng, nút ẩn (trừ "n ▾", nút phụ Gia hạn / Bỏ qua / Xuất). */
export const COT_VIEC = 'grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_136px_minmax(112px,auto)]';
export const DONG = `grid min-h-[44px] cursor-pointer items-center gap-x-3 gap-y-0.5 px-3.5 py-2.5 sm:min-h-[50px] sm:px-4 sm:py-1.5 ${COT_VIEC}`;
export const O_HAN = 'max-sm:col-start-1 max-sm:row-start-2';
export const O_NUT = 'o-nut max-sm:col-start-2 max-sm:row-span-2 max-sm:row-start-1 max-sm:self-center';
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
  /* GD-4a (mockup ⑤ F1 `i-bao`): Tình hình học tập — bóng lời. */
  'tinh-hinh': <path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" />,
  /* GD-4a (mockup ⑤ `i-tim`): kính lúp đầu ô gõ tìm. */
  tim: <><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></>,
  duyet: <><circle cx="8" cy="8" r="5.5" /><path d="M5.6 8.2l1.7 1.7 3.2-3.4" /></>,
  /* BO-QUA-XEP-MT: "Đã bỏ qua" — mắt gạch. */
  'bo-qua': <><path d="M2 8s2.2-4 6-4 6 4 6 4-2.2 4-6 4-6-4-6-4z" /><circle cx="8" cy="8" r="1.8" /><path d="M3 13L13 3" /></>,
  /* U01 #3 (audit 03/11): dòng "Cả lớp" / dòng gộp — ô bảng (mockup `.av.vuong`), không số chồng. */
  'ca-lop': <><rect x="2.5" y="3" width="11" height="10" rx="1" /><path d="M2.5 7h11M6 3v10" /></>,
  /* AUDIT-UI CV6: "Lớp tôi dạy" — bảng lớp, không dùng biểu tượng người. */
  'lop-toi-day': <><rect x="2.5" y="2.5" width="11" height="8" rx="1" /><path d="M5 13.5l3-3 3 3M5.5 5.5h5M5.5 7.8h3" /></>,
  /* CV6 (mockup v18): "Yêu cầu của tôi" — phiếu gửi đi, không mượn biểu tượng người của lớp. */
  'yeu-cau': <><path d="M14 2L7 9" /><path d="M14 2l-4.5 12-2.5-5-5-2.5z" /></>,
  /* TU2-4: "PA đang chạy" — đồng hồ (chưa tới hạn). */
  'pa-chay': <><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3.2l2 1.3" /></>,
  /* GV-2 (mockup v22 G5): tab "Đang theo dõi" — mắt ở dải mục / ô đầu dòng; "Vừa xong 7 ngày" — danh sách đã đánh dấu. */
  'theo-doi': <><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" /><circle cx="8" cy="8" r="2" /></>,
  'vua-xong': <><path d="M2.5 4.5l1.2 1.2 2.1-2.4M2.5 10.5l1.2 1.2 2.1-2.4" /><path d="M8 4.5h5.5M8 10.5h5.5" /></>,
  lop: <><circle cx="6" cy="6" r="2.2" /><circle cx="11.2" cy="6.6" r="1.7" /><path d="M2.5 13c.4-2.2 1.8-3.4 3.5-3.4s3.1 1.2 3.5 3.4M10.3 9.7c1.6 0 2.8 1 3.2 3" /></>,
};
/** GAP-MO (mockup v22 G6): biểu tượng đầu dải mục theo mã mục (`MUC_CV`). */
const ICON_MUC: Record<string, string> = {
  mock: 'cham-diem', pf: 'cham-diem', cp: 'cham-diem', 'cham-cheo': 'cham-cheo', 'mo-ta': 'case-hoc-thuat', pa: 'duyet', 'kq-pa': 'duyet',
  'bao-ph': 'bao-ph', 'bao-ph-test': 'bao-ph', 'vi-pham': 'y-thuc', 'tinh-hinh': 'tinh-hinh', 'phoi-hop': 'y-thuc', 'phan-cong': 'van-hanh', 'ban-giao': 'van-hanh',
  'xep-lich': 'chot-ngay-thi', 'kq-meeting': 'y-thuc',
  'sau-thi': 'sau-thi', 'lo-trinh': 'sau-thi', 'chot-ngay': 'chot-ngay-thi', thieu: 'bo-sung', 'bo-sung': 'bo-sung', giao: 'van-hanh', 'bc-ph': 'bo-sung',
};
export const docGap = (k: string | null): ReadonlySet<string> => {
  try { const v = k && JSON.parse(localStorage.getItem(k) ?? '[]'); return new Set(Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []); } catch { return new Set(); }
};
export const ghiGap = (k: string | null, s: ReadonlySet<string>) => {
  try { if (k) { if (s.size) localStorage.setItem(k, JSON.stringify([...s])); else localStorage.removeItem(k); } } catch { /* không lưu được: lần sau về mặc định mở */ }
};
export const IconNhom = ({ k }: { k: string }) => (
  <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">{DUONG_IC[k] ?? DUONG_IC.lop}</svg>
);
/**
 * GD-4a (mockup ⑤ B, `.av.vuong`): ô vuông 28 px biểu tượng đầu MỌI dòng việc (không có ở em trong khay) — dòng lớp / gộp: ô bảng; Chấm Speaking: micro;
 * Báo cáo PH: tờ giấy. Trang trí — trình đọc màn hình bỏ qua.
 */
/* NHẸ HƠN PR-2a (v23 `.dong`, 60-30-10): bỏ ô biểu tượng đầu dòng — loại việc đã ở đầu mục; mỗi dòng tối đa một điểm màu. */
const AvViec = (_: { it: WorkItem }) => null;
/** Chữ đầu tên em (vòng tròn tầng 2): hai từ cuối ("Vũ Hải Đăng" → "HĐ"). */
export const chuDau = (ten: string) => {
  const w = ten.trim().split(/\s+/);
  return (w.length > 1 ? w[w.length - 2][0] + w[w.length - 1][0] : w[0].slice(0, 2)).toUpperCase();
};

/**
 * NHÓM = ĐỘNG TỪ VIỆC (mockup v24 A1 / V4, chủ SP 24/11): mục gộp nhiều loại ("Mô tả Case" · "Phương án" · "Kết quả PA" · "Lộ trình" · "Vi phạm") tách ở MỨC HIỂN THỊ thành
 * nhóm theo loại việc — Thêm PA · Xác nhận PA · Ghi Mini Test · Xác nhận Case · Chốt lộ trình… Số đếm tab / badge vẫn theo mục (`chiaMucTab`, `dem`); số ở đầu nhóm con đếm lại từ
 * chính các dòng (cùng luật `dem`: dòng giữ chỗ vừa xong và dòng làm thay không vào `n`). Khoá gập / mở = khoá nhóm con.
 */
const MUC_TACH = new Set(['mo-ta', 'pa', 'kq-pa', 'lo-trinh', 'vi-pham']);
const loaiNhom = (it: WorkItem): [string, string, number] => {
  switch (it.group) {
    case 'ghi_nhan_xet': return ['mo-ta', t('Mô tả Case'), 0];
    case 'cause': case 'xem_nx_s': return ['xn-case', t('Xác nhận Case'), 1];
    case 'no_plan': return ['them-pa', t('Thêm PA'), 2];
    case 'xac_nhan_pa': case 'do_plan': return ['xn-pa', t('Xác nhận PA'), 3];
    case 'mini_test': return ['mini-test', t('Ghi Mini Test'), 4];
    case 'ghi_ket_qua_pa': return ['kq-pa', t('Ghi kết quả PA'), 5];
    case 'chot_len_ft': return ['chot-lo-trinh', t('Chốt lộ trình'), 6];
    case 'ky_vong_dau_ra': return ['ky-vong', t('Kỳ vọng'), 6.5];   // 28/11: việc riêng (N22 ②) — không gộp Chốt lộ trình, không mở panel Chốt lộ trình
    case 'xet_lai_lo_trinh': return ['xet-lai', t('Xét lại lộ trình'), 7];
    case 'yt_xu_ly': return ['xu-ly', t('Xử lý vi phạm'), 8];
    case 'yt_thuc_hien': return ['da-lam', t('Đã thực hiện'), 9];
    case 'khai_bac': return ['khai-bac', t('Khai cấp bậc'), 10];
    default: return [it.group, dich(it.tieuDe.split(' · ')[0]), 11];
  }
};
type NhomHien = { key: string; mk: string; label: string; items: WorkItem[]; d: { n: number; quaHan: number; lamThay?: number } };
function tachNhom(muc: readonly MucTab<WorkItem>[], dem: ReadonlyMap<string, { n: number; quaHan: number; lamThay?: number }>, xong: ReadonlySet<string>): NhomHien[] {
  return muc.flatMap((m): NhomHien[] => {
    if (!MUC_TACH.has(m.key)) return [{ key: m.key, mk: m.key, label: m.label, items: m.items, d: m.key === 'cham-cheo' ? demBai(m.items) : dem.get(m.key) ?? { n: 0, quaHan: 0 } }];
    const theo = new Map<string, { label: string; ord: number; items: WorkItem[] }>();
    for (const x of m.items) { const [k, label, ord] = loaiNhom(x); (theo.get(k) ?? theo.set(k, { label, ord, items: [] }).get(k)!).items.push(x); }
    return [...theo].sort(([, a], [, b]) => a.ord - b.ord).map(([k, g]) => {
      const tinh = g.items.filter((x) => !xong.has(x.key));
      const lt = tinh.filter((x) => (x as { lamThay?: boolean }).lamThay).length;
      const dd = tinh.filter((x) => !(x as { lamThay?: boolean }).lamThay);
      return { key: k === m.key ? k : `${m.key}:${k}`, mk: m.key, label: g.label, items: g.items, d: { n: dd.length, quaHan: dd.filter((x) => x.urgency === 'overdue').length, lamThay: lt || undefined } };
    });
  });
}

/**
 * DANH SÁCH MỘT TAB — AUDIT-UI B4 (chủ SP 08/11, mockup `thiet-ke/2026-11-08-audit-ui-mockup.html` khu B4; thay CV-TAB "một thẻ, mục Quá hạn trên cùng"):
 * MỖI MỤC LOẠI VIỆC MỘT THẺ (`chiaMucTab`, mục rỗng ẩn), quá hạn lên đầu mục. Đầu thẻ = dải nhóm (`.dai-nhom`: nền `--surface-2`, vạch trái 3 px nhấn, 15 / 700)
 * · chip "n việc" · "n quá hạn" đỏ (375 cũng ghi đủ chữ — AU-GON A1-11). Dòng: tên = đối tượng 15 / 500 + thẻ phụ | hạn một dòng | nút. Dòng gộp giữ "n em ▾" + khay em.
 * Số đầu mục chỉ từ việc máy chủ trả (`dem`; dòng giữ chỗ vừa xong không đếm). Mỗi mục 10 dòng đầu + "Xem thêm".
 */
export function DanhSachViec({ muc, dem, soHien, dauPhai, luat, nho, cuoi, ...dong }: ChungDong & {
  /** Khối nối sau mục cuối, CÙNG lưới cột (`.cvA`): "PA đang chạy" — thẳng cột với các mục trên. */
  cuoi?: ReactNode;
  /** GAP-MO (N60): khoá nhớ gập / mở ở trình duyệt = người + tab (vd `u7:bao-ph`); không có = không nhớ. Mục theo khoá mục; mặc định mở. */
  nho?: string;
  muc: readonly MucTab<WorkItem>[];
  /** `lamThay` (AUDIT-1611 P1-03): dòng làm thay trong mục — vẽ nhưng không vào `n`. */
  dem: ReadonlyMap<string, { n: number; quaHan: number; lamThay?: number }>;
  soHien: number;
  /** Đầu bên phải dải mục đầu (QL "Việc quản lý": Tất cả việc đã giao ›) — đầu mục "Việc được giao"; không có mục đó thì một dòng cuối danh sách. */
  dauPhai?: ReactNode;
  /** UI-CV-TVV (P1): luật của tab (vd hạn Báo PH) — ⓘ ở dải mục đầu, không thành câu trên màn. */
  luat?: ReactNode;
}) {
  const [them, setThem] = useState<Record<string, number>>({});
  /* GAP-MO: tập mục đang gập — đọc lại khi đổi người / tab (đặt state ngay lúc vẽ, không nháy "mở" rồi gập). */
  const khoaNho = nho ? `pisa.cv.gap.${nho}` : null;
  const [gapSt, setGapSt] = useState(() => ({ k: khoaNho, s: docGap(khoaNho) }));
  if (gapSt.k !== khoaNho) setGapSt({ k: khoaNho, s: docGap(khoaNho) });
  const gap = gapSt.s;
  const datGap = (mk: string, g: boolean) => {
    const s = new Set(gap); if (g) s.add(mk); else s.delete(mk);
    setGapSt({ k: khoaNho, s }); ghiGap(khoaNho, s);
  };
  /* Mở panel việc nằm trong mục đang gập (`?viec=`, "Việc tiếp ›") → mục tự mở; chỉ khi việc ĐỔI — người dùng vẫn gập được mục chứa việc đang mở. */
  const nhom = tachNhom(muc, dem, dong.xong);
  const daMo = useRef<string | null>(null);   // việc đã xử lý — dữ liệu về muộn (`muc` đổi) vẫn tìm được mục, nhưng mỗi việc chỉ tự mở một lần
  useEffect(() => {
    if (!dong.chon) { daMo.current = null; return; }
    const m = nhom.find((x) => x.items.some((y) => y.key === dong.chon || y.con?.some((c) => c.key === dong.chon)));
    if (!m || daMo.current === dong.chon) return;
    daMo.current = dong.chon;
    if (gap.has(m.key)) datGap(m.key, false);
  }, [dong.chon, nhom]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* KHUÔN A (24/11): bỏ vạch hạn "Quá hạn / Hạn đến… / Hạn sau…" — quá hạn lên đầu nhóm (máy chủ đã xếp), hạn là ngày tô màu ở mỗi dòng. */
  /* VH-2 (V5): mục "Việc được giao" — nhóm của việc Vận hành xếp theo thứ tự Head sắp, "Không phân loại" cuối; trong nhóm giữ thứ tự hạn. */
  const theoNhom = (ds: WorkItem[]) => ds.map((x, i) => [x, i] as const)
    .sort(([a, i], [b, j]) => (a.nhomViec?.thuTu ?? Infinity) - (b.nhomViec?.thuTu ?? Infinity) || (a.nhomViec?.id ?? 0) - (b.nhomViec?.id ?? 0) || i - j).map(([x]) => x);
  return (
    <div className="cvA-cq"><div className="cvA">
      {nhom.map((m, i) => {
        const n = soHien + (them[m.key] ?? 0);
        const giao = m.mk === 'giao';
        const items = giao ? theoNhom(m.items) : m.items;
        const nhieuLoai = !MUC_TACH.has(m.mk) && new Set(m.items.map((x) => x.group)).size > 1;
        /* GD-1 (lời 11, 19) · GD-1b (lời 24: tên mục "Chấm Speaking"): mục Chấm Speaking là việc chung của nhóm GV Speaking — đếm BÀI (không phải việc), vạch trái trung tính. */
        const chung = m.mk === 'cham-cheo';
        const dongGap = gap.has(m.key), maMuc = `muc-${m.key.replace(':', '-')}`;
        const d = m.d;
        /* KHUÔN A (25/11): việc Chấm Speaking của MỘT người → mỗi lớp một dòng + ô tìm + Chi nhánh khác gập (`ChamSpeakingMuc`); nhiều người (QL "Tất cả") giữ dòng gộp cũ. */
        if (chung && dong.chamS && items.length && items.every((x) => x.key === KHOA_CHAM_SPEAKING)) {
          const cs = dong.chamS;
          return <>{items.map((itCham, j) => (
            <ChamSpeakingMuc key={`${m.key}|${itCham.ownerId ?? ''}`} nguoi={itCham.mine ? null : itCham.ownerId ?? null} gv={items.length > 1 ? itCham.owner ?? null : null} stt={j}
              moSan={dong.chon === itCham.key && (!cs.nguoi || cs.nguoi === itCham.ownerId)} lopChon={cs.lop} onMo={(id) => cs.mo(itCham, id)} con={cs.con} onTiep={cs.onTiep}
              veDai={(o) => <DaiNhom k="cham-cheo" nhan={o.nhan} chip={o.chip} mo={o.mo} onMo={o.onMo} trungTinh chevSauTen dieuKhien={o.mo ? o.dk : undefined} phu={o.phu} luat={i === 0 && j === 0 && o.dk === 'muc-cham-cheo-0' ? luat : undefined} />}
              han={(due) => (due ? <HanA it={{ due, group: 'score', key: itCham.key } as unknown as WorkItem} daXong={false} /> : <span className="cvA-hn" />)} />
          ))}</>;
        }
        return (
          <section key={m.key} data-muc={m.key} className="card cvA-sub overflow-clip p-0" aria-label={m.label}>
            <DaiNhom k={ICON_MUC[m.mk] ?? 'van-hanh'} nhan={m.label} chip={`${d.n} ${chung ? t('bài') : t('việc')}`} mo={!dongGap} onMo={() => datGap(m.key, !dongGap)}
              phuPhai={giao ? dauPhai : undefined} trungTinh={chung} chevSauTen dieuKhien={dongGap ? undefined : maMuc} luat={i === 0 ? luat : undefined}
              phu={d.quaHan > 0 || !!d.lamThay ? <>
                {d.quaHan > 0 && <span className="font-bold tabular-nums text-late">{d.quaHan} {t('quá hạn')}</span>}
                {!!d.lamThay && <span className="font-medium text-slate-400">· {t('{n} làm thay', { n: d.lamThay })}</span>}
              </> : null} />
            {!dongGap && <div id={maMuc} className="cvA-sub">
            <ul className="cvA-sub">
              {items.slice(0, n).map((x) => (
                <li key={`${x.key}|${x.ownerId ?? ''}`} className="cvA-sub">
                  <VeDong x={x} dong={dong}><DongA it={x} ghiLoai={nhieuLoai} mk={m.mk} {...dong} /></VeDong>
                </li>
              ))}
            </ul>
            {m.items.length > n && (
              <div className="border-t px-5 py-2.5" style={{ borderColor: 'var(--line)' }}>
                <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" onClick={() => setThem((s) => ({ ...s, [m.key]: (s[m.key] ?? 0) + soHien }))}>
                  {t('Xem thêm {n} dòng', { n: Math.min(soHien, m.items.length - n) })}
                </button>
              </div>
            )}
            </div>}
          </section>
        );
      })}
      {cuoi}
      {dauPhai && !nhom.some((m) => m.mk === 'giao') && <div className="flex justify-end px-1">{dauPhai}</div>}
    </div></div>
  );
}

/**
 * TẦNG ① — DẢI NHÓM (mockup `.dai-nhom`): nền `--surface-2`, vạch trái 3 px một màu nhấn (`trungTinh` xám = không phải việc của bạn), biểu tượng,
 * tên 15 / 700, chip đếm vuông có đơn vị, phụ 13; dính khi cuộn (thẻ cha `overflow-clip`, không `overflow-hidden`). Bấm tên = gập / mở. Dùng chung cho
 * "Chờ bạn duyệt" và "Việc quản lý" rỗng ở `HoTroHocVienTab` — mọi nhóm cùng dáng.
 */
export function DaiNhom({ k, nhan, chip, mo, onMo, luat, phu, phuPhai, trungTinh = false, chevPhai = false, chevSauTen = false, dieuKhien }: {
  k: string; nhan: string; chip?: string; mo: boolean; onMo: () => void; luat?: ReactNode; phu?: ReactNode; phuPhai?: ReactNode; trungTinh?: boolean;
  /** TU2-4 (mockup Ⓣ1 D1, duyệt 19/11): chevron ở mép phải dải (sau ⓘ) thay vì ngay sau tên — chỉ khối "PA đang chạy". */
  chevPhai?: boolean;
  /** GAP-MO (mockup v22 G6): chevron sát tên, TRƯỚC chip đếm — dải mục của danh sách việc. */
  chevSauTen?: boolean;
  /** `id` vùng được gập / mở (chỉ truyền khi vùng đang vẽ) → `aria-controls`. */
  dieuKhien?: string;
}) {
  const chev = (
    <svg viewBox="0 0 16 16" aria-hidden className={`h-4 w-4 shrink-0 fill-none stroke-[color:var(--text-dim)] group-hover:stroke-[color:var(--text)] motion-safe:transition-transform ${mo ? 'rotate-90' : ''}`}
          strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M6 3.5 10.5 8 6 12.5" /></svg>
  );
  return (
    /* v12 S8: MỘT hàng cả ở 375 — tên · chip "n việc" · số quá hạn cùng hàng (không số phụ thứ hai); tên dài thì tên xuống dòng, không cắt (M2).
       CV6 (mockup v18, chủ SP 10/11): chevron 16 px NGAY SAU tên (sau chip), xoay khi mở; CẢ DẢI là một nút (lớp phủ `after:`) — rê / focus cả dải;
       ⓘ và phần phụ nằm trên lớp phủ (`relative z-[1]`) nên vẫn bấm riêng. */
    <h2 className={`sticky -top-4 z-[3] md:-top-5 m-0 flex min-h-[48px] items-center gap-x-2 border-l-[3px] pl-[13px] pr-2 text-[14px] font-bold leading-snug bg-[color:var(--surface-2)] hover:bg-[color:var(--accent-soft)] has-[:focus-visible]:shadow-[inset_0_0_0_2px_var(--accent)] max-sm:flex-wrap max-sm:gap-x-1.5 max-sm:pr-1 ${mo ? 'border-b' : ''}`}
      style={{ borderBottomColor: 'var(--line)', borderLeftColor: trungTinh ? 'var(--text-faint)' : 'var(--accent)' }}>
      <button type="button" aria-expanded={mo} aria-controls={dieuKhien} onClick={onMo}
        className="group flex min-h-[44px] min-w-0 appearance-none items-center gap-2 border-0 bg-transparent py-2.5 text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
        {/* NHẸ HƠN PR-2a (v23 `.ds-dau`, PTA rà #2001): tên đầu mục 16 / 700 MỘT dòng; số "n việc" là chữ phụ (không ô); biểu tượng ẩn ở 375 cho đủ chỗ. */}
        <span className={`max-sm:hidden ${trungTinh ? 'text-faint' : 'text-[color:var(--accent)]'}`}><IconNhom k={k} /></span>
        <span className="min-w-0 whitespace-nowrap text-[16px] text-[color:var(--text)]">{nhan}</span>
        {chevSauTen && chev}
        {chip && <span className="shrink-0 whitespace-nowrap text-[13px] font-medium tabular-nums text-dim">{chip}</span>}
        {!chevPhai && !chevSauTen && chev}
      </button>
      {luat && <span className="relative z-[1] inline-flex">{luat}</span>}
      {phu && <span className="relative z-[1] flex shrink-0 items-center gap-x-2.5 whitespace-nowrap text-[13px] empty:hidden">{phu}</span>}
      {phuPhai && <span className="relative z-[1] ml-auto shrink-0 whitespace-nowrap text-[13px] max-sm:basis-full max-sm:pb-2 max-sm:text-right">{phuPhai}</span>}
      {chevPhai && <span aria-hidden className="pointer-events-none ml-auto inline-flex pr-1">{chev}</span>}
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

/** Chung của một dòng việc: dòng gộp (`con`), đã xong, đang chọn, người giữ việc. */
function useDong(it: WorkItem, { chon, xong, moCaDong, nguoiAn, anNguoi }: ChungDong) {
  const con = it.con?.length && !moCaDong(it) ? it.con : null;
  const viecCaLop = it.group === 'chot_len_ft' || it.group === 'xet_lai_lo_trinh' || it.group === 'ky_vong_dau_ra';
  /* QL Tất cả: người giữ việc cuối ô chi tiết. v12 S3: không lặp điều đã biết — việc của tôi, việc của GV đang xem (`nguoiAn`),
     bài chấm chéo ("GV chấm chéo" = tên nhóm), Admin (người phụ trách ở panel lớp) không ghi người. */
  const cc = laViecChamCheo(it) || dich(it.statusLabel) === CHAM_CHEO;
  const nguoi = anNguoi || it.mine || cc || (nguoiAn != null && it.ownerId === nguoiAn) ? null : it.owner ?? (it.ownerId === null && !viecCaLop ? t('Chưa có người') : null);
  return { con, daXong: xong.has(it.key), dangChon: chon === it.key, nguoi };
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

/** Tên việc bỏ tên em (máy chủ ghép "Xác nhận Case R · {em}") — tên em đã ở tầng ②. */
const tenBoEmGoc = (it: WorkItem) => {
  const vi = it.group === 'bao_ph_yt' && it.phu ? it.phu : it.tieuDe;
  return vi.split(' · ').filter((x) => !x.startsWith(it.studentName)).join(' · ') || vi;
};
export const tenBoEm = (it: WorkItem) => tenViec(tenBoEmGoc(it));
/** GD-1b (chủ SP lời 24, `04-thiet-ke.md` mục 14; mockup ⑤ B): MỌI dòng việc một dạng "Lớp · tên việc ngắn" — kể cả việc của một em (tên em là thẻ phụ). */
const voiLop = (it: WorkItem, ten: string) => (it.classCode && !ten.split(' · ').includes(it.classCode) ? `${it.classCode} · ${ten}` : ten);
/** U01 #15: tên việc máy chủ đã ghép "{thao tác} · {kỹ năng}" (`mywork.ts sauCham`) — web chỉ dịch. */
/* GD-4d (lời 35, ⑤ H5): tên bậc trong tên việc VIẾT HOA, dạng tắt (dòng việc là nơi chật) — "Báo PH · REPORT 1", "WL 1". */
export const tenViec = (vi: string) => bacNgan(vi.split(' · ').map((x) => dich(x)).join(' · '));
/**
 * AUDIT-UI B4 (CV1, chủ SP 08/11): ở DANH SÁCH, tên dòng = đối tượng ("Nhập điểm Listening, Reading" → "Listening, Reading") — động từ đã ở tên mục và ở nút.
 * Chỉ loại việc mà tên mục nói đúng động từ đó (Chấm điểm › Mock Test…, Phương án › Thêm PA, Mô tả Case, Kết quả PA). Panel, "Tiếp: …" giữ tên đủ (`tenBoEm`).
 */
/* AUDIT-1611 A1-13: tab Case một khuôn "Lớp · Kỹ năng · Lượt" — bỏ cả động từ của Xác nhận Case / Xác nhận PA / Chọn PA (động từ ở nút). */
const DONG_TU: Partial<Record<string, RegExp>> = { score: /^Nhập điểm /, no_plan: /^Thêm (?=PA )/, ghi_nhan_xet: /^Mô tả Case · /, ghi_ket_qua_pa: /^Ghi kết quả PA · /,
  cause: /^Xác nhận Case · /, xem_nx_s: /^Xác nhận Case · /, xac_nhan_pa: /^(Xác nhận|Chọn) PA · / };
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
  if (x.startsWith(t('Kỳ {ky}', { ky: '' }))) return [dich(x)];   // A1-10: thẻ kỳ ("{kỳ} W4 AUG – W1 SEP") một chip, không tách mã tuần
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
export function ThePhu({ ds, vien = [], xuong = false }: { ds: readonly string[]; vien?: readonly string[]; /** AU-GON A1-20: thẻ xuống dòng, không cắt "…" (dải việc hồ sơ HV). */ xuong?: boolean }) {
  if (!ds.length && !vien.length) return null;
  const the = `min-w-0 shrink rounded-md px-1.5 text-xs font-medium leading-5 text-dim ${xuong ? 'break-words' : 'h-5 truncate'}`;
  return (
    <span className={`mt-[3px] flex min-w-0 items-center gap-[3px] ${xuong ? 'flex-wrap' : 'flex-nowrap overflow-hidden'}`}>
      {vien.map((x, i) => <span key={`v${i}`} title={x} className={`${the} border leading-[18px]`} style={{ borderColor: 'var(--line-strong)' }}>{x}</span>)}
      {ds.map((x, i) => <span key={i} title={x} className={the} style={{ background: 'var(--surface-2)' }}>{x}</span>)}
    </span>
  );
}

/* ───────────────────────── KHUÔN A (v24 `cong-viec-gon`, chủ SP 24/11) ─────────────────────────
 * Mỗi dòng MỘT lớp: bốn ô lớp · ai (tên em / "n em") · chi tiết · hạn, không cột nút. Cả dòng bấm được; "n em" có mũi tên mở ra từng em ngay dưới (cùng bộ cột).
 * Hạn luôn là ngày dd/mm/yyyy, chỉ tô màu chữ. Chi tiết ở `index.css` (`.cvA*`). Thao tác phụ (Hoàn thành · Gia hạn · Bỏ qua · Không thi · Xuất) vẫn có — một hàng nút nhỏ
 * ngay dưới dòng, không thành cột ([XM] khop-khac.md). */
export function HanA({ it, daXong }: { it: WorkItem; daXong: boolean }) {
  const { homNay } = useNgayNghiepVu();
  if (daXong) return <span className={`cvA-hn !font-semibold ${LOP_DA_LUU}`}>{t('✓ Đã lưu')}</span>;
  if (!it.due) {
    /* MT-QUA-THI (PTA 26/11): việc MT sau ngày thi (lẻ, không gộp) — ngày thi ở cột ngày (ô chi tiết "MT2, 3 sau ngày thi" một dòng). Chỉ dd/mm/yyyy
       (`statusLabel` "Thi dd/mm/yyyy" ở title): chữ "Thi" làm cột ngày chung của cả danh sách rộng thêm, đẩy dòng khác xuống hai dòng khi panel mở. */
    if (it.key.startsWith('mt-thi:')) return <span className="cvA-hn" title={dich(it.statusLabel)}>{it.statusLabel.slice(-10)}</span>;
    return <span className="cvA-hn">{it.group === 'xuat_bc_ph' ? dich(it.statusLabel) : laViecChamCheo(it) ? null : <span className="sr-only">{t('không hạn')}</span>}</span>;
  }
  /* GV-2 / TL-1: "Chờ GV sửa" — hạn tạm dừng, không tự so ngày ra "quá hạn" (viên "tạm dừng", ngày ở title). */
  if (it.choGvSua && it.urgency !== 'overdue') return <span className="cvA-hn"><NhanChoGv title={t('hạn {ngay}', { ngay: shortDate(it.due, homNay) })}>{t('tạm dừng')}</NhanChoGv></span>;
  const v = deadlineView({ kind: LOAI_HAN_CUA_VIEC[it.group] ?? 'viec-van-hanh', due: it.due, today: homNay });
  const muc = mucHan(it.due, homNay);
  return <span title={v.text} className={`cvA-hn ${muc === 'xa' ? '' : muc}`}>{muc === 'qua' && <DauQuaHan />}{shortDate(it.due, homNay)}</span>;
}

/** Chip SOS / mức Case sau tên em — chip duy nhất của dòng. */
const chipMucA = (it: WorkItem) => chipMuc(it, false);
const MuiXo = () => <svg viewBox="0 0 16 16" aria-hidden className="cvA-xo"><path d="M6 3.5 10.5 8 6 12.5" /></svg>;
const MuiDi = () => <svg viewBox="0 0 16 16" aria-hidden className="cvA-di"><path d="M6 3.5 10.5 8 6 12.5" /></svg>;
const duyNhat = (ds: readonly (string | null | undefined | false)[]) => [...new Set(ds.filter((x): x is string => !!x))];

/** Kỹ năng gộp "L R W1 W2 S" của việc điểm (thứ tự cố định; dòng gộp Admin nối nhiều dòng). */
const MON_GON = CASE_CATEGORY_SHORT as Record<string, string>;
const THU_KN = ['listening', 'reading', 'writing', 'writing1', 'writing2', 'speaking', 'listening_speaking', 'reading_writing'];
const thuKn = (k: string) => { const i = THU_KN.indexOf(k); return i < 0 ? THU_KN.length : i; };
/** Tuần của dòng: mã tuần trong nhãn · không có thì từ `tuanThi`. Dòng gộp nhiều tuần → null (không ghi tuần của một con lên cả dòng). */
function tuanDong(it: WorkItem): string | null {
  const ds = it.con?.length ? it.con : [it];
  const tuan = new Set(ds.map((x) => MA_TUAN.exec(x.contextLabel ?? '')?.[1] ?? (x.tuanThi ? tuanLich(x.tuanThi) : null)));
  return tuan.size === 1 ? [...tuan][0] : null;
}
const LOAI_BAI: Record<string, string> = { mock: 'Mock', progress: 'Progress', final: 'Final', checkpoint: 'Checkpoint' };
function dongDiem(it: WorkItem): { n: number; tuan: string | null; loai: string | null; mon: string } | null {
  if (it.group !== 'score' || !it.classCode) return null;
  const ds = it.con?.length ? it.con : [it];
  const em = new Set(ds.flatMap((x) => x.emIds ?? (x.studentId !== null ? [x.studentId] : [])));
  const kns = [...new Set(ds.flatMap((x) => x.kns ?? (x.kn ? [x.kn] : [])))].sort((x, y) => thuKn(x) - thuKn(y));
  return { n: em.size || it.count || 0, tuan: tuanDong(it), loai: LOAI_BAI[it.kind ?? 'mock'] ?? null, mon: kns.map((k) => MON_GON[k] ?? k).join(' ') };
}

/**
 * Ô THÔNG TIN — MỘT thứ tự cho mọi dòng, cha lẫn con (chủ SP 25/11): `{tuần} - {loại test} · {chi tiết…} · {GV}`.
 * Loại test chỉ ghi khi đề mục chưa nói (`loaiDaNoi`: Mock Test · Checkpoint · Chấm Speaking); không có tuần thì loại đứng đầu, không dấu "-" treo.
 */
const LOAI_THI = /^(?:(?:Progress|Final)(?: Test)?(?: \d+ ?%)?|Checkpoint|Mock(?: Test)?|MT\d+|Case)$/;
export function xepTin(mau: readonly string[], loaiDaNoi: boolean, tuan: string | null): string[] {
  let loai: string | null = null;
  let tuanTin = tuan;
  const rest: string[] = [];
  for (const m of mau) {
    for (const x of m.split(' · ').map((y) => y.trim()).filter(Boolean)) {
      if (x.startsWith(t('Kỳ {ky}', { ky: '' }))) { rest.push(dich(x)); continue; }   // thẻ kỳ ("{kỳ} W4 AUG – W1 SEP") giữ nguyên
      const w = MA_TUAN.exec(x);
      const y = w ? `${x.slice(0, w.index)}${x.slice(w.index + w[0].length)}`.trim() : x;
      if (w) tuanTin ??= w[1];
      if (!y) continue;
      if (LOAI_THI.test(y)) loai ??= y.replace(/^(Progress|Final) Test/, '$1');
      else rest.push(y);
    }
  }
  const phan = duyNhat([loaiDaNoi ? null : loai, ...rest]);
  /* Có tuần: MỘT dấu " - " ngay sau tuần, các phần sau cách nhau " · " (chủ SP 25/11: "W3 AUG - Progress · R", "W3 SEP - 3 bài"). */
  return tuanTin ? (phan.length ? [`${tuanTin} - ${phan[0]}`, ...phan.slice(1)] : [tuanTin]) : phan;
}
const LA_MA_TUAN = /^W[1-5] [A-Z]{3}$/;
/** Ghép các phần thông tin (đã có "tuần - …" ở phần đầu): `·` giữa các phần; chỉ có mỗi tuần mà còn phần sau (GV…) thì vẫn " - " sau tuần. */
export const ghepChu = (parts: readonly (string | null | undefined | false)[]): string => {
  const p = parts.filter((x): x is string => !!x);
  return LA_MA_TUAN.test(p[0] ?? '') && p.length > 1 ? `${p[0]} - ${p.slice(1).join(' · ')}` : p.join(' · ');
};
/** Dấu đứng trước tên GV (phần cuối) cho ô thông tin `chu`. */
const dauGv = (chu: string) => (!chu ? '' : LA_MA_TUAN.test(chu) ? ' - ' : ' · ');

/** Việc TVV theo từng em (Báo PH · Sau thi · Chốt ngày thi). */
const laViecTvvTheoEm = (it: WorkItem) => it.studentId !== null && !it.con?.length
  && (it.group === 'bao_ph_yt' || it.group === 'thi_that' || it.group === 'buoc_tiep' || it.key.startsWith('chot-ngay-thi:'));
/* Việc Ý thức & Phối hợp / TVV sau Meeting: tên việc ngắn thay chữ máy chủ (chữ qua `t` lúc vẽ — đổi ngôn ngữ không tải lại mô-đun). */
const LA_GON = new Set(['phoi_hop_sos', 'phoi_hop_tvv', 'yt_xu_ly', 'yt_xem', 'yt_thuc_hien', 'khai_bac', 'yt_tra_lai', /* LPB-2a: chữ dòng từ máy chủ, không lặp tên nhóm */ 'nhan_tin']);

/** Đoạn đầu tên việc là ĐỘNG TỪ ("Thêm PA học thuật", "Xác nhận Case", "Nhập điểm …") — tên nhóm đã nói; ở nhóm gộp nhiều loại thì ghi lại bản ngắn ở đầu chi tiết. */
const DONG_TU_DAU = /^(Thêm PA(?: học thuật)?|Xác nhận PA|Chọn PA|Xác nhận Case|Mô tả Case|Ghi kết quả PA|Ghi Mini Test|Nhập điểm|Viết Báo cáo PH|Xử lý vi phạm|Bàn giao|Báo PH kết quả Test|Báo PH|Chốt lộ trình|Bổ sung hồ sơ thiếu)(?: |$)/;
const tenLoaiNgan = (it: WorkItem) => {
  const tg = ({ yt_xu_ly: t('Xử lý vi phạm'), yt_xem: t('Xem vi phạm mới'), yt_thuc_hien: t('Đã thực hiện'), khai_bac: t('Khai cấp bậc'), yt_tra_lai: t('Vi phạm bị trả lại') } as Record<string, string>)[it.group];
  return tg ?? dich(it.tieuDe.split(' · ')[0]).replace(t('Thêm PA học thuật'), t('Thêm PA')).replace(t('Ghi Mini Test'), 'Mini Test');
};

/** Việc có kỹ năng ở `phu` — dòng gộp ghi hợp các kỹ năng của em con ("Listening, Reading"). */
const CO_MON = new Set(['ghi_nhan_xet', 'cause', 'xem_nx_s', 'xac_nhan_pa', 'no_plan', 'ghi_ket_qua_pa']);
/** Chữ đề mục đã nói thì dòng không ghi lại: Chấm Speaking → "Speaking" / "S" ("Ý thức" bỏ ở mọi dòng — đề mục Ý thức & Phối hợp đã nói). */
const TU_DE_MUC: Record<string, readonly string[]> = { 'cham-cheo': ['Speaking', 'S'] };

/**
 * Các mẩu thông tin (chữ, không chip) của một dòng — trừ lớp, tên em, số em (đã ở ô riêng). Cha và con cùng hàm này → cùng thứ tự (`xepTin`).
 * `ghiLoai`: nhóm có nhiều loại việc → thêm tên loại · `mk`: mã mục (đề mục đã nói gì).
 */
function chiTiet(it: WorkItem, gop: boolean, diem: ReturnType<typeof dongDiem>, ghiLoai: boolean, daXong: boolean, mk: string): string[] {
  const cheo = mk === 'cham-cheo';
  const loaiDaNoi = mk === 'mock' || mk === 'cp' || cheo;
  if (diem) {
    /* Chấm Speaking: tuần · số bài (môn S đã ở đề mục); cha nhiều tuần: "n bài · m quá hạn". */
    if (cheo) return xepTin([it.soBai ? t('{soBai} bài', { soBai: it.soBai }) : '', gop && it.baiQuaHan ? `${it.baiQuaHan} ${t('quá hạn')}` : ''], true, diem.tuan);
    return xepTin([diem.loai ?? '', diem.mon], loaiDaNoi, diem.tuan);
  }
  if (it.group === 'bo_sung_ho_so') return it.reason ? [t('Thiếu: {x}', { x: it.reason.split(' · ').map((m) => dich(m.replace(/ \d+$/, ''))).join(', ') })] : [];   // reason "Email 1 · Target 1" → "Thiếu: Email, Target"
  /* 06/11: Xét lại lộ trình không liệt kê tên em (chỉ "n em"); G4-18: dòng vừa xong không ghi tiến độ cũ (bàn giao, việc cả lớp). */
  const boNgucCanh = it.group === 'xet_lai_lo_trinh' || (daXong && (it.group === 'ban_giao' || it.group === 'chot_len_ft' || it.group === 'ky_vong_dau_ra'));
  const lead = ghiLoai ? tenLoaiNgan(it).replace(/^Báo PH\s*/, '').replace(/^./, (c) => c.toUpperCase()) : '';
  if (boNgucCanh) return lead ? [lead] : [];
  /* Xử lý vi phạm (cha · con · lẻ): số vi phạm + bậc kế tiếp của chính dòng; cha = tổng số vi phạm của các em. */
  if (it.group === 'yt_xu_ly') {
    if (!it.con?.length) return it.phu ? [dich(it.phu)] : [];
    const so = it.con.map((c) => Number(/^(\d+) vi phạm/.exec(c.phu ?? '')?.[1] ?? NaN));
    return so.some(Number.isNaN) ? [] : [t('{n} vi phạm', { n: so.reduce((a, b) => a + b, 0) })];
  }
  const laThe = (x: string) => LA_SO.test(x);
  const phan = (it.group === 'bao_ph_yt' && it.phu ? it.phu : it.tieuDe).split(' · ').map((x) => x.trim());
  const meet = it.group.startsWith('meeting_');
  const tenCon = LA_GON.has(it.group) && it.group !== 'phoi_hop_sos' ? [] : phan.map((x, i) => (i === 0 ? x.replace(DONG_TU_DAU, '').trim() : x)).filter((x) => x && x !== it.classCode && x !== t('Công việc quản lý') && !x.startsWith(it.studentName) && !laThe(x) && !MA_TUAN.test(x)).map((x) => tenViec(x));
  const ctx = laViecTvvTheoEm(it) && it.group === 'bao_ph_yt' ? null : it.group === 'thi_that' ? it.contextLabel?.replace(/^Đã thi (?:T[2-7]|CN) /, t('Thi') + ' ') : meet ? it.phu : it.contextLabel ?? it.phu;
  const monCon = gop && CO_MON.has(it.group) ? [duyNhat(it.con!.map((c) => c.phu && dich(c.phu))).join(', ')] : [];
  const bo = (x: string) => { const y = x.replace(/^\d+ (?:em|HV) (?=\S)/, ''); return y === x ? y : y.charAt(0).toUpperCase() + y.slice(1); };   // "1 em chưa chọn" → "Chưa chọn" (số em đã ở ô ai)
  const deMuc = TU_DE_MUC[mk] ?? [];
  const hang = [lead, ...tenCon, ...monCon, ctx]
    .flatMap((x) => (x ? x.split(' · ').map((y) => bo(dich(y))) : []))
    .filter((x) => !laThe(x) && !/^SOS \d/.test(x) && x !== it.studentName && x !== t('Công việc quản lý') && x !== t('Ý thức') && !deMuc.includes(x));
  /* LPB-2b (mockup v28 L2a / L2c): Báo PH · Chuyển lớp — dòng gộp ghi "vào {tuần}" (chỉ khi cả lô cùng một tuần); dòng em ghi hướng · lớp mới ("Lên MB ELE 02"). */
  const sau: string[] = [];
  if (it.group === 'bao_ph_yt') {
    const vao = [...new Set((it.con ?? [it]).map((c) => c.nhomChuyenLop?.vao ?? null))];
    const them = gop ? (vao.length === 1 ? vao[0] && t('vào {tuan}', { tuan: vao[0] }) : null) : it.nhomChuyenLop?.chiTiet;
    if (them) sau.push(them);   // sau `xepTin`: mã tuần không bị đẩy lên đầu dòng
  }
  const xep = xepTin(hang, loaiDaNoi, tuanDong(it));
  /* Dòng em của lô Chuyển lớp: chỉ "Lên MB ELE 02" (tên lô đã ở dòng cha — mockup L2c). */
  if (sau.length && !gop && 'conTen' in it) return [...xep.filter((x) => x !== t('Chuyển lớp')), ...sau].slice(0, 2);
  return (sau.length ? [...xep.slice(0, 1), ...sau] : xep).slice(0, 2);   // bốn ô, một dòng chữ: tuần - loại · kỹ năng / chi tiết — nhiều hơn thì ở panel
}

/** MỘT DÒNG (mọi loại việc, mọi vai): lớp · ai · chi tiết · hạn. */
function DongA({ it, ghiLoai, mk, ...dong }: ChungDong & { it: WorkItem; ghiLoai: boolean; /** Mã mục chứa dòng — đề mục đã nói gì thì dòng không ghi lại. */ mk: string }) {
  const [mo, setMo] = useState(false);
  const { con, daXong, dangChon, nguoi } = useDong(it, dong);
  const gop = !!it.con?.length;
  const diem = dongDiem(it);
  const bam = () => (con ? setMo(!mo) : dong.onOpen(it));
  const maDs = `con-${it.key}`;
  const phan = (it.group === 'bao_ph_yt' && it.phu ? it.phu : it.tieuDe).split(' · ');
  const soTong = Number(phan.find((x) => LA_SO.test(x))?.split(' ')[0]) || 0;
  const emCon = gop ? new Set(it.con!.map((c) => c.studentId)).size : 0;
  const moiEm = it.studentId !== null && !gop && !(it.emTen && it.emTen.length > 1);
  const motEm = moiEm || (gop && emCon === 1 && !diem);
  /* Chấm Speaking của GV S: MỘT dòng nhiều lớp — ô lớp "n lớp", ô em "n em", thông tin "n bài · m quá hạn" (cùng bốn ô với dòng lớp). */
  const chamS = it.key === KHOA_CHAM_SPEAKING;
  const boSung = it.group === 'bo_sung_ho_so';   // Bổ sung hồ sơ: không lớp — ô lớp trống, ô em "n em", thông tin "Thiếu: …" (tên việc đã ở đề mục)
  /* [XM7] #2070 (SUA-GOP-2511): một em → ô lớp + ô em ghi đúng lớp · tên em (máy chủ trả `emBoSung`); nhiều em giữ "n em", panel ghi tên + lớp từng em. */
  const motBs = boSung && it.emBoSung?.length === 1 ? it.emBoSung[0] : null;
  const soEm = diem ? diem.n : gop ? emCon : chamS ? it.count ?? 0 : it.emTen?.length ? it.count ?? it.emTen.length : soTong || it.count || 0;
  const aiChu = motEm ? it.studentName : it.gopLop && it.soBai ? t('{n} bài', { n: it.soBai }) : soEm ? t('{n} em', { n: soEm }) : null;
  const tenViecKl = !it.classCode && !motEm && !chamS && !boSung;   // việc không lớp (Task Vận hành được giao): tên việc chiếm ô lớp + ô em
  const lopChu = it.classCode ?? motBs?.lop ?? (chamS && it.contextLabel ? dich(it.contextLabel) : null);
  const ct = chamS ? xepTin([t('{soBai} bài', { soBai: it.soBai ?? 0 }), it.baiQuaHan ? `${it.baiQuaHan} ${t('quá hạn')}` : ''], true, null) : chiTiet(it, gop, diem, ghiLoai, daXong, mk);
  const giao = !daXong && (it.giaoBoi ? t('{ten} giao', { ten: it.giaoBoi }) : it.nguoiTra ? t('{ten} trả', { ten: it.nguoiTra }) : null);
  const tvv = laViecTvvTheoEm(it) && !daXong && !it.choGvSua ? chuTvv(it) : null;
  const chu = ghepChu([...ct, tvv, giao, it.coNhap ? t('Có nháp') : null]);
  const tenNut = tenViecKl ? tenViec(tenBoEmGoc(it)) : motBs ? motBs.ten : aiChu ?? '';
  const sosChip = motEm && !daXong ? chipMucA(it) : null;
  return (
    <div className="cvA-sub">
      <div data-hd="cv-dong" data-khoa={it.key} onClick={bam} title={bacNgan(dich(it.reason))}
        className={`cvA-v ${tenViecKl ? 'cvA-kl' : ''} ${dangChon ? 'dang-chon' : ''} ${daXong ? 'cvA-xong' : ''}`}>
        <span className="cvA-lop">{lopChu}{dong.theCn?.(it) && <span className="ml-1.5 inline-flex h-[18px] items-center rounded-[5px] border px-1.5 align-[1px] text-xs font-semibold text-dim" style={{ borderColor: 'var(--line-strong)' }}>{dong.theCn(it)}</span>}</span>
        <span className="cvA-ai">
          <button type="button" className={`cvA-ten ${tenViecKl ? '!font-semibold' : ''}`} aria-expanded={con ? mo : undefined} aria-controls={con && mo ? maDs : undefined}
            aria-current={dangChon ? 'true' : undefined} onClick={(e) => { e.stopPropagation(); bam(); }}>
            {daXong && <span aria-hidden className="text-ok">✓ </span>}<span className={daXong ? 'line-through' : undefined}>{motEm ? it.studentName : tenNut}</span>{con && <MuiXo />}
          </button>
          {sosChip}
        </span>
        <span className="cvA-ct" title={chu}>{chu}{it.choGvSua && !daXong && <span className="ml-2 inline-flex align-middle"><TheChoGv /></span>}{nguoi && !daXong && <span className="text-faint">{dauGv(chu)}{nguoi}</span>}</span>
        <HanA it={it} daXong={daXong} />
        {dong.moTrang(it) && it.group !== 'xuat_bc_ph' && !con && !daXong && <MuiDi />}
      </div>
      {con && mo && (
        <ul id={maDs} className="cvA-sub cvA-con" aria-label={dich(it.tieuDe)}>
          {con.map((x) => <li key={x.key} className="cvA-sub"><VeDong x={x} dong={dong}><DongCon it={x as WorkItem & { conTen: string; conPhu: string }} mk={mk} ghiLoai={ghiLoai} {...dong} /></VeDong></li>)}
        </ul>
      )}
    </div>
  );
}

/** Một em (hoặc một tuần / một nhóm) trong dòng gộp đã mở: ô lớp trống (thẳng cột) · tên em hoặc "n em" · thông tin CÙNG thứ tự với dòng cha · hạn. */
function DongCon({ it, mk, ghiLoai, ...dong }: ChungDong & { it: WorkItem & { conTen: string; conPhu: string }; mk: string; ghiLoai: boolean }) {
  const { daXong, dangChon, nguoi } = useDong(it, dong);
  const bam = () => dong.onOpen(it);
  const diem = dongDiem(it);
  const nEm = diem?.n || it.emIds?.length || it.count || 0;
  const ai = it.studentId !== null || !nEm ? dich(it.conTen) : t('{n} em', { n: nEm });
  const ct = chiTiet(it, false, diem, ghiLoai, daXong, mk);
  const chu = ghepChu([...ct, it.coNhap ? t('Có nháp') : null]);
  return (
    <div data-hd="cv-dong" data-khoa={it.key} onClick={bam} title={bacNgan(dich(it.reason))} className={`cvA-v ${dangChon ? 'dang-chon' : ''} ${daXong ? 'cvA-xong' : ''}`}>
      <span className="cvA-lop" aria-hidden />
      <span className="cvA-ai">
        <button type="button" className="cvA-ten" aria-current={dangChon ? 'true' : undefined} onClick={(e) => { e.stopPropagation(); bam(); }}>
          {daXong && <span aria-hidden className="text-ok">✓ </span>}<span className={daXong ? 'line-through' : undefined}>{ai}</span></button>
        {!daXong && chipMucA(it)}
      </span>
      <span className="cvA-ct" title={chu}>{chu}{nguoi && !daXong && <span className="text-faint">{dauGv(chu)}{nguoi}</span>}</span>
      <HanA it={it} daXong={daXong} />
    </div>
  );
}

/** Trạng thái của việc TVV (mockup): "Chưa liên hệ được · lần n" (sắp hạn) · "Đã thi · chờ KQ" (lịch thi) — chữ cuối chi tiết, không chip (≤ 1 chip / dòng). SAU-THI-GON (A3-13): dòng Chọn bước tiếp
 *  KHÔNG nhãn tiến độ — tên việc + hạn đã nói còn việc. */
const chuTvv = (it: WorkItem): string | null => (it.group === 'bao_ph_yt' && it.soLanThu ? t('Chưa liên hệ được · lần {n}', { n: it.soLanThu }) : it.group === 'thi_that' ? t('Đã thi · chờ KQ') : null);
