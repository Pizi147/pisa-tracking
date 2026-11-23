import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import { bacDu, docNhap, docNhapChuyen, ghiNhap, taoKhoPanel, xoaNhapViec, type KhoNhap } from '@shared/domain/index.ts';
import { HopBoChu } from './Drawer.tsx';
import { khoRoiNhap } from './chanRoiNhap.tsx';
import { DongCanSua, useNoiLoi, type MucThieu } from './loiForm.tsx';
import { useGiuFocus } from './giuFocus.ts';
import { BaoOTrongNhan, coOTuNhan } from './ONgay.tsx';
import { XemCha } from '../lib/quayLai.ts';
import { t } from '@shared/i18n/index.ts';
import type { PanelHd } from '@shared/huongDan/kieu.ts';
import { ghiQuyCheMo, moHuongDan } from '../lib/hdNgCanh.ts';
import { NutLuat } from './NutLuat.tsx';

/**
 * NHẸ HƠN (v23 `.pn` top = dưới thanh menu): đáy thanh trên (`header.thanh-xanh`, cộng dải demo / mất mạng phía trên nếu có) — panel bám ngay dưới,
 * không hở, không che menu. Đo khi mở + mỗi lần thanh đổi cao (ResizeObserver) / đổi cỡ cửa sổ.
 */
function useDayThanhTren(): number {
  const [y, setY] = useState(0);
  useLayoutEffect(() => {
    const el = document.querySelector('header.thanh-xanh');
    if (!el) return undefined;
    const doLai = () => setY(Math.max(0, Math.round(el.getBoundingClientRect().bottom)));
    doLai();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(doLai);
    ro?.observe(el);
    window.addEventListener('resize', doLai);
    return () => { ro?.disconnect(); window.removeEventListener('resize', doLai); };
  }, []);
  return y;
}

/** Kho dùng chung toàn web: mở panel này thì panel đang mở phải đóng (G-8, N-4). */
export const khoPanelChung = taoKhoPanel();
/** Panel đang mở, mở sau ở cuối — Esc chỉ đóng panel cuối (panel vẽ qua portal nên không còn lồng nhau trong DOM). */
const nganPanel: string[] = [];
/**
 * HD-V2 (đặc tả 8 + 9.2): panel làm việc đang mở có mục Hướng dẫn riêng (`hd`); "?" đọc panel trên cùng lúc bấm. HD-V3: "trên cùng" = DỰNG SAU
 * (`thu` lấy lúc render — cha trước con): form trong panel (Ghi kết quả PA trong Case) mở cùng lần với panel thì effect của con chạy trước cha.
 */
let demHd = 0;
const panelHd: { hd: PanelHd; thu: number }[] = [];
export const panelHdTren = (): PanelHd | null => panelHd.reduce<{ hd: PanelHd; thu: number } | null>((a, x) => (!a || x.thu > a.thu ? x : a), null)?.hd ?? null;
/**
 * PR-EN: panel đang sửa dở (`chan.daSua` hoặc còn nháp) — đổi ngôn ngữ (tải lại trang) hỏi trước khi bỏ chữ đang gõ.
 * NEN-PANEL (T16): mỗi panel ghi kèm cách HỎI của nó (hộp "Bỏ chữ đang gõ?" vẽ trong panel) — `boChuRoi` dùng khi đổi việc.
 */
const panelDangSua = new Map<string, (tiep: () => void, o?: () => void, nut?: string) => void>();
export const coPanelDangSua = () => panelDangSua.size > 0;
/** Đổi việc / "‹ Công việc" / mở việc khác: còn chữ chưa lưu thì panel hỏi (Ở lại = nút chính); bỏ chữ hoặc không có chữ → `tiep`. */
export function boChuRoi(tiep: () => void, nut?: string) {
  const hoi = [...panelDangSua.values()].pop();
  if (hoi) hoi(tiep, undefined, nut); else tiep();
}

type NhapPanel = { viec: string; coChu: boolean; bao: (o: string, coChu: boolean) => void; xoa: () => () => void };
const NhapCuaPanel = createContext<NhapPanel | null>(null);
/** Đã ở trong một `KhungPanel` — panel con (hộp mở đè) không tính nháp của việc là "đang sửa" của nó. */
const TrongKhung = createContext(false);
/** 6C-NHO (bảng kê lỗi 4): hộp mở từ ô nằm trong panel (lưới điểm trong Nhập điểm / panel việc) phải `longTrong` — không đóng panel cha. */
export const useTrongKhung = () => useContext(TrongKhung);
const khoNhap = (): KhoNhap | null => { try { return window.sessionStorage; } catch { return null; } };

/**
 * NEN-PANEL (K12): bọc panel của MỘT việc (vd `PanelViec`, khoá = `it.key`) — ô `useNhap` bên trong (kể cả ở component vẽ `KhungPanel`) giữ chữ ở
 * máy theo khoá này; panel ngoài cùng biết còn chữ → ✕ / đổi việc hỏi trước.
 */
export function NhapViec({ khoa, children }: { khoa: string; children: ReactNode }) {
  const [coChu, bao, boHet] = useTapCoChu();
  const v = useMemo<NhapPanel>(() => ({ viec: khoa, coChu, bao, xoa: () => { const traLai = xoaNhapViec(khoNhap(), khoa); boHet(); return traLai; } }), [khoa, coChu, bao, boHet]);
  return <NhapCuaPanel.Provider value={v}>{children}</NhapCuaPanel.Provider>;
}
/** Tập ô (khoá `o`) đang còn chữ: [còn ô nào, báo một ô, bỏ hết]. */
function useTapCoChu(): [boolean, (o: string, co: boolean) => void, () => void] {
  const [oCoChu, setOCoChu] = useState<ReadonlySet<string>>(() => new Set());
  const bao = useCallback((o: string, co: boolean) => setOCoChu((x) => {
    if (x.has(o) === co) return x;
    const n = new Set(x); if (co) n.add(o); else n.delete(o);
    return n;
  }), []);
  const boHet = useCallback(() => setOCoChu(new Set()), []);
  return [oCoChu.size > 0, bao, boHet];
}

/** 6c (bảng kê lỗi 5): form nằm trong CON của `KhungPanel` (không qua `chan`) báo "còn chữ chưa lưu" lên panel gần nhất → ✕ / Esc / nền hỏi một lần. */
const BaoSuaPanel = createContext<((o: string, co: boolean) => void) | null>(null);
export function useBaoDangSua(co: boolean) {
  const bao = useContext(BaoSuaPanel);
  const o = useId();
  useEffect(() => { bao?.(o, co); }, [bao, o, co]);
  useEffect(() => () => bao?.(o, false), [bao, o]);
}

/**
 * HOAN-TAC-XN (luật không mất chữ): Hoàn tác một lần lưu đặt lại nội dung vừa gửi theo tên ô (`traLaiO`); ô đó gắn lại (form mở lại) thì điền sẵn MỘT lần —
 * dùng được cả ngoài panel việc (Ngăn Case, hồ sơ HV, toast), nơi không có kho nháp. Trong panel việc kho nháp đọc trước.
 */
const traLaiNgoai = new Map<string, unknown>();
export const traLaiO = (o: string, v: unknown): void => { traLaiNgoai.set(o, v); };

/**
 * Ô GIỮ NHÁP (K12, T15, T16): như `useState`, thêm — trong panel có khoá việc — chữ ghi vào `sessionStorage` theo khoá việc + `o`, mở lại
 * đúng việc thì chữ còn; panel biết còn chữ → ✕ / đổi việc hỏi trước. Lưu thành công thì nơi gọi gọi `useXoaNhap()`. Ngoài panel việc = `useState`.
 */
export function useNhap<T>(o: string, dau: T, oCu?: string): [T, Dispatch<SetStateAction<T>>, (daGui: T) => void] {
  const n = useContext(NhapCuaPanel);
  /* `oCu`: khoá cũ của chính ô này (đổi khoá) — chữ còn dưới khoá cũ chuyển sang khoá mới một lần (`docNhapChuyen`). */
  const [v, setV] = useState<T>(() => (n ? (oCu ? docNhapChuyen<T>(khoNhap(), n.viec, o, oCu) : docNhap<T>(khoNhap(), n.viec, o)) : undefined) ?? (traLaiNgoai.get(o) as T | undefined) ?? dau);
  const [goc] = useState(() => JSON.stringify(dau));
  const lanDau = useRef(true);
  /* AUDIT-1454 (N02): máy chủ vừa nhận `daGui` → bỏ nháp trình duyệt của RIÊNG ô này, chỉ khi ô vẫn đúng chữ đã gửi (gõ tiếp trong lúc gửi thì giữ). */
  const moi = useRef(v);
  moi.current = v;
  const daLuu = useCallback((daGui: T) => {
    if (!n || JSON.stringify(moi.current) !== JSON.stringify(daGui)) return;
    ghiNhap(khoNhap(), n.viec, o, daGui, true);
    n.bao(o, false);
  }, [n, o]);
  useEffect(() => {
    if (!n) return;
    const trong = JSON.stringify(v) === goc;
    if (!lanDau.current) ghiNhap(khoNhap(), n.viec, o, v, trong);   // lần đầu: giá trị vừa đọc từ kho / ban đầu — không ghi lại
    lanDau.current = false;
    n.bao(o, !trong);
  }, [v]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { traLaiNgoai.delete(o); return () => n?.bao(o, false); }, []);   // eslint-disable-line react-hooks/exhaustive-deps -- trả lại dùng một lần · ô gỡ: không còn chữ để hỏi; nháp vẫn trong kho
  return [v, setV, daLuu];
}
/**
 * Lưu xong: bỏ nháp của việc (mọi ô) — panel thôi coi là "đang sửa" tới khi gõ tiếp. Trả hàm ghi lại nháp đó (HOAN-TAC-XN: Hoàn tác lần lưu → mở lại
 * việc thì chữ còn). Ngoài panel việc: không có kho, hàm rỗng.
 */
export function useXoaNhap(): () => () => void {
  const n = useContext(NhapCuaPanel);
  return useCallback(() => n?.xoa() ?? (() => {}), [n]);
}

/** CV-LOI (CV-05): panel đang hiện "✓ Đã lưu · Hoàn tác" còn bấm được — hàng đợi Công việc không tự sang việc kế (Hoàn tác không bị thay). */
const choHoanTac = new Set<symbol>();
export function useChoHoanTac(con: boolean) {
  useEffect(() => {
    if (!con) return undefined;
    const k = Symbol('hoan-tac');
    choHoanTac.add(k);
    return () => { choHoanTac.delete(k); };
  }, [con]);
}

/**
 * OV-5a: PANEL TẠI CHỖ — cột phải trang Công việc (mockup M1 §1). Panel nằm ngay trong context này vẽ trong luồng trang (thẻ dính, cao tối đa
 * một màn), không phủ nền, không khoá cuộn, không giữ focus, không vào `khoPanelChung` (mở việc khác = nơi gọi thay nội dung). Panel mở TỪ BÊN
 * TRONG nó (hộp con, ngăn phụ) vẫn phủ như cũ — context bị đặt lại `false` trong thân. Nơi gọi đặt cột dính (`sticky`) — thẻ cao tối đa vùng nhìn của
 * `<main>` (trừ thanh trên). Điện thoại: thẻ thay chỗ danh sách, nơi gọi có "‹ Công việc".
 */
export const KhungTaiCho = createContext(false);
/**
 * UI-HO-SO-HV-2: panel đặt THẲNG trong một cột của trang (cột Case & PA hồ sơ HV — Case A + form tại chỗ): như `KhungTaiCho` nhưng không vỏ thẻ, không ✕
 * (nơi gọi giữ khối luôn mở; ‹ / Huỷ / Esc về view trước), không dòng loại "VIỆC", không dòng em · lớp (đang ở chính hồ sơ em), cao theo nội dung.
 */
export const KhungTrongCot = createContext(false);
/** U02: thân của panel đang đặt trong cột (KhungTrongCot bị đặt lại false cho panel con) — thân Case vẽ dạng khung trường (`DauMuc`). */
export const ThanTrongCot = createContext(false);
/**
 * CASE-PA-UI (mockup v16 d1 · e1 · h2 · k5): form việc của Case (Xác nhận PA, Ghi kết quả, Thêm PA, Hoàn thành…) đặt THẲNG trong thẻ PA / mục của panel Case —
 * như `KhungTrongCot` nhưng không đầu panel (một dòng đầu mục `.muc-h` thay), không đệm ngang, chân không dính đáy. Không đổi view, không panel lồng panel.
 */
export const KhungTrongThe = createContext(false);
/** V5 UI-CONG-VIEC: trang Công việc nói panel việc đang mở thuộc nhóm nào ("VIỆC · CASE HỌC THUẬT" / "THEO DÕI · …"). */
/** M6 6b-3 `dai`: dải "✓ Đã lưu … · Hoàn tác" của việc vừa làm — đầu thân panel của việc kế (mockup panel-pilot ②b). */
export const DauViecCongViec = createContext<{ loai: string; dai?: ReactNode;
  /** N56 ① (PTA rà #1880): dải "Bạn đang làm thay … · Chỉ xem" — LUÔN thấy: ngay dưới đầu panel, ngoài vùng cuộn (1440), dính đầu vùng nhìn (375). */
  daiLamThay?: ReactNode;
  /** UI-CONG-VIEC (khung A3): đang làm thay — dải sự kiện thêm "Phụ trách {tên}". */
  nguoiLam?: string | null;
  /** A3-05: người xem không làm được việc (CX với việc chấm chưa có người) — panel đổi tiêu đề "Điểm …" + một dòng "Chỉ xem · GV / Head nhập". */
  chiXem?: boolean } | null>(null);
/** UI-CONG-VIEC (mockup `.truong > .nhan` 15 / 700): panel việc ở Công việc — nhãn ô nhập đậm, sáng; nơi khác giữ nhãn nhỏ. */
export const NhanTruongDam = createContext(false);
/** M6 6b-3: lớp panel đang ẨN (form việc khi đang "Xem Case" trong panel việc) — cần hỏi "Bỏ chữ?" thì hiện lại lớp đó trước (hộp hỏi vẽ trong panel). */
export const HienLaiPanel = createContext<(() => void) | null>(null);
/** HV-LOP-VIEC: nơi mở một panel việc THAY nội dung panel của mình (panel một em → PanelViec) cấp "← tên em" cho panel NGOÀI CÙNG bên trong
 *  (không phải sửa từng panel việc); prop `quayLai` riêng thắng; panel / hộp lồng trong không nhận lại. */
/** GD-4b (lời 36, dòng 40c ⓪): hàm đóng của panel đang chứa (cùng đường ✕ / Esc — đang gõ dở thì hỏi "Bỏ chữ, đóng"). `NutVaTiep` đọc để vẽ nút "Đóng"
 *  trước nút việc; null khi panel trong cột hồ sơ (`trongCot`, không có ✕) HOẶC chân thường đã có nút "Đóng" mặc định (`huy`) — một chân một nút "Đóng" (GD-4d). */
export const DongKhungPanel = createContext<(() => void) | null>(null);
export const QuayLaiPanel = createContext<{ nhan: string; onClick: () => void; xem?: boolean } | null>(null);
/** GD-6 (mockup ② K2 `.dem-pn`): panel việc mở từ chip "Việc cần làm" — "i / n" trong các việc cùng loại ở lớp, đứng trước ✕ (dòng loại việc). */
export const DemViecPanel = createContext<{ i: number; n: number; nhan: string } | null>(null);

/**
 * KHUÔN PANEL CHUNG (PR-UX0, N-4 → NHẸ HƠN v23 `khung-panel.html`, chủ SP 22/11). Cao từ ngay dưới thanh menu tới đáy, không hở. Rộng (≥ 640,
 * PANEL-GON chủ SP 24/11 "panel to quá" — thay 58 % / 75 % của v23): panel việc MỘT cỡ 600 px (`rong` 'viec' — 'hep' / 'rong' / 'nguoi-day' là tên cũ
 * cùng nghĩa); panel bảng / lưới ('bang' — 'vua' / 'so' cùng nghĩa) rộng THEO NỘI DUNG (cột tên + n ô + kết quả), sàn 600, trần 75 % — đầu / tab / chân
 * không đẩy bề rộng (`.pn-than` là phần duy nhất đo, index.css); 'toan' tới 1440; 375 toàn màn. Panel tại chỗ của Công việc (≥ 1024) bám mép phải cùng
 * luật, ghi bề rộng thật vào `--pn-w` để danh sách trái lấy phần còn lại.
 * Đầu ≥ 52 px MỘT dòng: ‹ · tên việc · em · lớp · hạn (`phu` / `dau.dong2` / `dau.han`) · ⓘ quy chế · ⋯ · ✕; tab (nếu có) dính dưới đầu.
 * Thân chia KHỐI (`Khoi`, tiêu đề nhỏ, luật dài vào ⓘ), nhãn TRÊN ô (`Truong`), ≤ 2 ô một hàng (`Hang2`).
 * Chân CỐ ĐỊNH: trái Huỷ / Xoá (viền đỏ), phải nút phụ + MỘT nút chính; dòng xám "n ô cần sửa ↑" trên chân (PR-N1,
 * `DongCanSua`) — chỉ truyền `conThieu` SAU khi bấm Lưu; lý do từng ô nằm dưới ô (`Truong loi`). CHỈ thân cuộn, trang sau khoá cuộn. Mở việc khác thì THAY nội dung, không
 * chồng panel (`khoPanelChung`). Không chữ dev; chữ mẫu bắt đầu "Ví dụ:".
 */
/**
 * NÚT ✕ ĐẦU HỘP / PANEL — MỘT dáng (mockup v21 `.x`; chủ SP 15/11 "mấy nút ⋯ hay ✕ hay bị lệch"): ô 36 × 36 (điện thoại 44) không viền, nền trong,
 * ✕ 17 px giữa ô, rê mới có nền. Nơi đặt để ô cùng HÀNG với dòng tiêu đề (`items-center`) — tâm ✕ thẳng tâm chữ tiêu đề; mép phải cách hộp 12 px.
 */
export const NUT_DONG = 'grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg border-0 bg-transparent p-0 text-[16px] leading-none text-dim hover:bg-[rgb(var(--phu-rgb)/0.1)] hover:text-[color:var(--text)] max-sm:h-11 max-sm:w-11';

/** Bản nhỏ của `NUT_DONG` — ✕ xoá chữ TRONG ô gõ (mockup ⑤ `.oc .bo`: ô 28, ✕ 14; điện thoại 36 trong ô 44). Nơi đặt căn giữa theo chiều cao ô. */
export const NUT_DONG_NHO = 'grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-sm leading-none text-dim hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text)] max-sm:h-9 max-sm:w-9';

export function KhungPanel({ tieuDe: tieuDeGoc, hocVien, lop, phu, rong: rongRieng, tabs, vungTab, ngCanh, daiLamThay: daiRieng, quayLai: quayLaiRieng, chan, quyChe, daSua: daSuaRieng, longTrong, z = 'z-50', dau, anDau = false, hd, nutHd = true, onDong, children }: {
  tieuDe: string;
  /** NHẸ HƠN: phần phụ CÙNG DÒNG đầu panel, sau tên việc (em · lớp · hạn) — chữ phụ, "·" giữa các mục. */
  phu?: ReactNode;
  /** U02: khung trong cột đã có dòng đầu riêng (dòng tóm tắt Case) — không vẽ đầu panel khi không có "‹ view trước". */
  anDau?: boolean; hocVien?: string | null; lop?: string | null;
  /** Dòng loại "Việc · …" — NHẸ HƠN (v23: đầu một dòng) KHÔNG còn vẽ; giữ cho chỗ gọi cũ. */
  loai?: string | null;
  /** OV-12c — ĐẦU PANEL v3 (mockup panel v3 §1): dòng 1 tên việc 17 px + MỘT chip hạn (`ChipHan`) + ✕; dòng 2 em (link) · lớp · ngữ cảnh.
   *  Có `dau` thì `hocVien` / `lop` không vẽ ở đầu một dòng cũ. */
  dau?: { han?: ReactNode; /** A3-16: nút ⋯ ghim cạnh ✕ (không xuống dòng khi tiêu đề dài — EN 375). */ ghim?: ReactNode; dong2: ReactNode[]; loai?: string;
    /** U01 #6 (audit 03/11, mockup `.facts`): DẢI SỰ KIỆN thay dòng 2 — nhãn nhỏ trên, giá trị đậm dưới (Học viên · Lớp · Lượt · Mức · Hạn · Phụ trách). */
    su?: [string, ReactNode][];
    /** PANEL-RIENG (XM-1, mockup v10 `.pn-tieu`): nội dung dòng tiêu đề thay chữ `tieuDe` — tên em là link + chip SOS, hay tên số liệu + số + đơn vị + ⓘ. */
    tieu?: ReactNode };
  /** Lớp z — panel mở từ một popover `z-[60]` (hộp xếp lịch `HopKyNang`) cần nằm trên popover đó (PR-LM). */
  z?: string;
  /** Không vào `khoPanelChung`: panel con mở đè (Chuyển tiếp → Tạo lớp) không đóng panel này, state giữ nguyên.
   *  Esc chỉ đóng panel mở sau cùng (`nganPanel`) — panel dưới không cần tự chặn Esc. */
  longTrong?: boolean;
  /** `toan`: lưới nhập hàng loạt nhiều cột (Thêm học viên) — rộng theo màn tới 1440px, không ép 10 cột vào ngăn hẹp. */
  /** `vua` 1180 px: panel bàn giao (mockup v11 — bảng hai cột không trải hết 1440). */
  rong?: 'viec' | 'hep' | 'rong' | 'vua' | 'toan' | /** PT-a (mockup v19 khung 2a): panel sổ nghĩa vụ bài chấm của một GV — 640. */ 'so' | /** PT-PANEL (mockup v13 A1) + chủ SP 09/11: panel bảng số rộng 1040 — cột ngắn co theo nội dung, cột tên / việc thoải mái, không cắt chữ. */ 'bang' | /** TU2-6 (mockup Ⓣ2 P1): panel một người dạy — 880. */ 'nguoi-day';
  tabs?: ReactNode; ngCanh?: ReactNode;
  /** N64: dải làm thay của chính panel (vd bàn giao: "Đang giao cho … — bạn làm thay") — cùng chỗ, thắng dải chung của Công việc. */
  daiLamThay?: ReactNode;
  /** DON-NHO-3 (TAB-A11Y): thân cuộn là vùng của `tabs` (`role="tabpanel"`, id = `panelId` của HangTab) — chỉ gắn thuộc tính, không bọc thêm (Khoi `first:` giữ khoảng cách). */
  vungTab?: { id: string; nhan: string };
  /** M6 6b-3: `xem` = không phải lùi mà vào view kế ("Xem Case" của panel việc) — vẽ thành link cuối dòng 2 của đầu, không thành nút ‹. */
  quayLai?: { nhan: string; onClick: () => void; xem?: boolean };
  chan?: {
    /** `null` = không vẽ nút trái (panel tự có nút Đóng ở `chinh`, ví dụ ngăn Tổng kết lộ trình). */
    huy?: { nhan?: string; onClick: () => void; disabled?: boolean; /** GD-20c ([XM-8] ⑫): 375 ẩn nút Đóng (✕ / ‹ ở đầu panel) — chân còn hai nút. */ an375?: boolean } | null; xoa?: { onClick: () => void; nhan?: string };
    phu?: ReactNode; chinh?: ReactNode; conThieu?: (string | MucThieu)[];
    /** NEN-PANEL (`.panel-chan .trai`): trạng thái lưu (`TrangThaiLuu` / `ChuLuu`) đầu hàng nút, trước Lưu / Lưu · việc tiếp ›. */
    trai?: ReactNode;
    /** Luật S3 (I1): form đã sửa → nút trái mặc định "Huỷ thay đổi", chưa sửa → "Đóng". `huy.nhan` riêng (Xong, ‹ Sửa…) thắng. */
    daSua?: boolean;
    /** TINH-HINH (mockup v20 D1): nút Đóng / Huỷ đứng bên PHẢI cạnh nút chính, trạng thái lưu (`trai`) ở mép trái. */
    huyPhai?: boolean;
    /** OV-14a (F12): nơi gọi tự hỏi khi đóng (hộp nêu đúng số em bị ảnh hưởng) — khung không hỏi thêm lần nữa ở ✕ / Esc / nền. */
    tuHoi?: boolean;
    /** Một dòng riêng NGAY TRÊN hàng nút (ví dụ dòng xem trước trên điện thoại — PR-XLMT). Nơi gọi tự ẩn/hiện theo cỡ màn. */
    dongTren?: ReactNode;
    /** OV-12c — CHÂN v3: không nút trái; ≥ 640 px nút chính nằm trong khối Cần làm (nơi gọi) nên chân chỉ hiện khi có `dongTren`
     *  (trạng thái lưu); 375: dòng trạng thái trên nút chính rộng hết khung, dính đáy. */
    v3?: boolean;
  };
  /** Quy chế của việc (`shared/domain/quyChe.ts`) — NHẸ HƠN (bỏ hàng "Quy chế …"): ⓘ ở góc đầu panel; rê thấy câu, bấm mở Hướng dẫn đúng thẻ việc. */
  quyChe?: { chu: string; chiTiet?: string } | null;
  /** 6c (lỗi 5): như `chan.daSua` cho panel KHÔNG có chân (form + nút lưu nằm trong thân). */
  daSua?: boolean;
  /** HD-V2: panel Case (`ngan-case`) / Nhập điểm — bấm "?" khi panel này mở thì tab Màn này đưa mục của panel lên trước (kể cả panel trong cột hồ sơ). */
  hd?: PanelHd;
  /** HD3-1 (15 mục 8.3): panel nổi có nút "?" nổi trên nền mờ, sát mép trái panel — "?" thanh trên bị panel che. `false`: chính panel Hướng dẫn. */
  nutHd?: boolean;
  onDong: () => void; children: ReactNode;
}) {
  const id = useId();
  const khung = useRef<HTMLDivElement>(null);
  const quayLaiNgoai = useContext(QuayLaiPanel);
  const quayLai = quayLaiRieng ?? quayLaiNgoai ?? undefined;
  /* GD-4d (⑤ H5): tên bậc trong tiêu đề panel viết hoa, viết đủ (panel là nơi quyết) — chuỗi máy chủ "Báo PH · Report 1" → "REPORT 1". */
  const tieuDe = bacDu(tieuDeGoc);
  const dongRef = useRef(onDong);
  dongRef.current = onDong;
  const trongThe = useContext(KhungTrongThe);
  const trongCot = useContext(KhungTrongCot) || trongThe;
  const taiCho = useContext(KhungTaiCho) || trongCot;
  /* M6 6b-2 (khu K D6): một chuỗi view một bề rộng — panel trong chuỗi `XemCha` lấy bề rộng của chuỗi khi không tự đặt. */
  const chuoi = useContext(XemCha);
  const rong = rongRieng ?? chuoi?.rong ?? 'viec';
  const laBang = rong === 'bang' || rong === 'vua' || rong === 'so';
  const top = useDayThanhTren();
  /* NEN-PANEL (K12): panel ngoài cùng của việc — ô `useNhap` còn chữ → coi là đang sửa như `chan.daSua`. */
  const nhap = useContext(NhapCuaPanel);
  const trongKhung = useContext(TrongKhung);
  /* 6c (lỗi 5): form trong con báo qua `useBaoDangSua` — chữ chỉ ở state như `chan.daSua`. */
  const [conSua, baoSua] = useTapCoChu();
  const daSua = !!chan?.daSua || !!daSuaRieng || conSua || (!trongKhung && !!nhap?.coChu);
  const hienLai = useContext(HienLaiPanel);
  const hienLaiRef = useRef(hienLai);
  hienLaiRef.current = hienLai;
  /* Hotfix 15/10 (L5) · NEN-PANEL (T16): ✕ / Esc / bấm nền / ← / đổi việc đi chung một đường — đang sửa dở thì hộp "Bỏ chữ đang gõ?" (Ở lại /
     Bỏ chữ), không mất chữ âm thầm. Bỏ chữ = xoá nháp của việc rồi làm tiếp. */
  const [hoi, setHoi] = useState<{ nut: string; tiep: () => void; o?: () => void } | null>(null);
  const daSuaRef = useRef(false);
  daSuaRef.current = daSua && !chan?.tuHoi;
  /* CHAN-ROI-NHAP-2: đã trả lời "Bỏ chữ" ở hộp này → việc vừa bấm (đóng, sang việc khác, rời trang) không bị bộ chặn gốc hỏi lần hai. */
  const daBo = useRef(false);
  const dong = () => { if (daSuaRef.current) setHoi({ nut: t('Bỏ chữ, đóng'), tiep: () => dongRef.current() }); else dongRef.current(); };
  /* Bấm đúp "Bỏ chữ, …": lần hai còn đọc `hoi` cũ (chưa vẽ lại) → đóng / quay lại / rời trang hai lần. Mỗi hộp chạy một lần. */
  const daTra = useRef<typeof hoi>(null);
  const boChu = () => { const h = hoi; if (!h || daTra.current === h) return; daTra.current = h; setHoi(null); daBo.current = true; nhap?.xoa(); h.tiep(); };

  const [thuHd] = useState(() => ++demHd);
  useEffect(() => {
    if (!hd) return undefined;
    const o = { hd, thu: thuHd };
    panelHd.push(o);
    return () => { panelHd.splice(panelHd.indexOf(o), 1); };
  }, [hd, thuHd]);

  /* PANEL-GON: panel tại chỗ (Công việc ≥ 1024, `fixed` mép phải) ghi bề rộng thật vào `--pn-w` — cột danh sách trái = phần còn lại. */
  useLayoutEffect(() => {
    const el = khung.current;
    if (!taiCho || trongCot || !el || typeof ResizeObserver === 'undefined') return undefined;
    const goc = document.documentElement.style;
    const ro = new ResizeObserver(() => goc.setProperty('--pn-w', `${Math.round(el.getBoundingClientRect().width)}px`));
    ro.observe(el);
    return () => { ro.disconnect(); goc.removeProperty('--pn-w'); };
  }, [taiCho, trongCot]);

  useEffect(() => {
    if (longTrong || taiCho) return undefined;
    khoPanelChung.mo(id, () => dongRef.current());
    return () => khoPanelChung.dong(id);
  }, [id, longTrong, taiCho]);

  useEffect(() => {
    if (taiCho) return undefined;
    const cu = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = cu; };
  }, [taiCho]);

  useEffect(() => {
    if (taiCho) return undefined;   // tại chỗ: Esc chỉ khi focus trong panel (`onKeyDown` dưới)
    /* Esc chỉ đóng lớp TRÊN CÙNG: panel mở sau cùng (`nganPanel`); `Modal` mở chồng trong panel (không portal) tự đóng bằng Esc — panel đứng yên. */
    nganPanel.push(id);
    const onKey = (e: KeyboardEvent) => {
      /* M6 6b-4: hộp nổi vẽ qua portal NGOÀI panel (hộp điểm của lưới Nhập điểm) nghe Esc sau panel — focus đang ở đó thì để hộp tự đóng,
         không đóng cả panel (mất ô đang gõ). */
      const hop = (document.activeElement as HTMLElement | null)?.closest('[role="dialog"]');
      if (hop && khung.current && !khung.current.contains(hop) && !hop.contains(khung.current)) return;
      if (e.key === 'Escape' && !e.defaultPrevented && nganPanel[nganPanel.length - 1] === id
        && !khung.current?.querySelector('[aria-modal="true"]')) dong();
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); nganPanel.splice(nganPanel.indexOf(id), 1); };
  }, [id, taiCho]);

  /* Chữ chỉ ở state (không qua `useNhap`): rời trang là mất. Chữ ở nháp máy: rời trang còn (mở lại việc là thấy), chỉ đổi tài khoản / đăng xuất mới mất. */
  const mat = !!chan?.daSua || !!daSuaRieng || conSua;
  useEffect(() => {
    if (!daSua) { daBo.current = false; return undefined; }
    const hoiBo = (nut: string) => (tiep: () => void, o?: () => void, nutRieng?: string) => { hienLaiRef.current?.(); setHoi({ nut: nutRieng ?? nut, tiep, o }); };
    panelDangSua.set(id, hoiBo(t('Bỏ chữ, sang việc khác')));
    /* CHAN-ROI-NHAP-2: link sang trang khác, Back / tiến của trình duyệt (kể cả cùng trang — đóng panel), đổi tài khoản → bộ chặn gốc (`ChanRoiNhapGoc`)
       gọi chính hộp này. App tự đổi URL trong cùng trang (đổi việc, lọc, việc tiếp sau khi lưu) thì panel tự lo như cũ. */
    khoRoiNhap.dat(id, { moTa: tieuDe, conTrong: (a, b, kieu) => daBo.current || !mat || (kieu !== 'POP' && a.pathname === b.pathname), hoi: hoiBo(t('Bỏ chữ, rời đi')) });
    return () => { panelDangSua.delete(id); khoRoiNhap.dat(id, null); };
  }, [id, daSua, mat, tieuDe]);

  /* M6 6b-1 (luật Quay lại): ‹ lùi một view KHÔNG hỏi khi chữ đã ở nháp (`useNhap` — mở lại view là còn); form chỉ giữ chữ trong state (`chan.daSua`)
     thì vẫn hỏi (cùng hộp), không mất chữ âm thầm — kể cả khi nơi gọi `tuHoi` (nơi gọi chỉ tự hỏi ở ✕ / Esc / nền). */
  const lui = quayLai && !quayLai.xem ? quayLai : undefined;
  const veLai = () => {
    if (chan?.daSua || daSuaRieng || conSua) setHoi({ nut: t('Bỏ chữ, quay lại'), tiep: () => lui?.onClick() });
    else lui?.onClick();
  };
  /* 6b-3: "Xem Case" — form việc vẫn gắn (ẩn) dưới view Case, không mất chữ nên không hỏi. */
  const nutXem = quayLai?.xem && (
    <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-left text-sm font-semibold sm:min-h-0" onClick={quayLai.onClick}>{quayLai.nhan}</button>
  );
  const dauCv = useContext(DauViecCongViec);
  const cvNgoai = dauCv && !trongKhung ? dauCv : null;
  const ngu = [hocVien, lop].filter(Boolean).join(' · ');
  /* AUDIT-LOI (PTA 03/11): nút Đóng / Huỷ ở chân gọi đúng `onDong` (mặc định, hoặc nơi gọi truyền lại chính hàm đó) → đi đường `dong` như ✕ / Esc:
     đang có chữ thì hộp "Bỏ chữ, đóng". DON-CHU: gọi đúng hàm của ‹ Quay lại (vd Sửa công việc: Huỷ = về việc) → đi đường `veLai` như ‹.
     Nơi gọi tự truyền hàm khác (vd `dongSauKhiLuu` của bàn giao — chờ lưu xong, báo ô chưa lưu) tự lo, giữ nguyên. */
  const huyGoc = chan?.huy === null ? null : chan?.huy ?? { onClick: onDong };
  const huy = !huyGoc ? huyGoc
    : huyGoc.onClick === onDong ? { ...huyGoc, onClick: dong }
    : lui && huyGoc.onClick === lui.onClick ? { ...huyGoc, onClick: veLai } : huyGoc;
  const nutHuy = (huy: { nhan?: string; onClick: () => void; disabled?: boolean; an375?: boolean }, chan: { daSua?: boolean }) =>
    <button type="button" className={`btn min-h-[44px] sm:min-h-0 ${huy.an375 ? 'max-sm:!hidden' : ''}`} onClick={huy.onClick} disabled={huy.disabled}>{huy.nhan ?? (chan.daSua ? t('Huỷ thay đổi') : t('Đóng'))}</button>;
  useGiuFocus(khung, !taiCho);
  /* `!mt-0`: panel đứng trong trang có `space-y-*` thì bị cộng margin-top 12–16 px → lệch xuống, lộ dải demo bar/đầu trang (PR-DH, DH-13).
     Vẽ qua portal ra <body>: panel mở từ ô bảng (GV chấm ở tiêu đề cột dính, hộp bốn tiêu chí trong ô điểm) không bị kẹt dưới
     lớp xếp chồng của ô, không kế thừa chữ in hoa / căn phải của ô. Sự kiện React vẫn nổi theo cây React như cũ. */
  const dem = useContext(DemViecPanel);
  const oDem = dem && dem.n > 1 && (
    <span className="mx-1 inline-flex h-[22px] shrink-0 items-center whitespace-nowrap rounded-full bg-[color:var(--surface-2)] px-2 text-xs font-semibold tabular-nums text-dim"
      title={dem.nhan}><span className="sr-only">{dem.nhan}: </span>{dem.i} / {dem.n}</span>
  );
  /* GD-4a: ✕ một dáng `NUT_DONG` (36 / 44), cùng ô với ⋯ (`dau.ghim`) và ⓘ quy chế — cùng tâm dọc trong hàng đầu. */
  const nutDong = trongCot ? null : <button type="button" className={NUT_DONG} onClick={dong} aria-label={t('Đóng')}>✕</button>;
  /* NHẸ HƠN (v23 `.pn-dau`): ĐẦU MỘT DÒNG ≥ 52 px — ‹ view trước · tên việc 16 / 700 · phần phụ (em · lớp · hạn, chữ phụ 14, "·" giữa) · góc ⓘ · i / n · ⋯ · ✕.
     Bỏ dòng loại "Việc · …". Thiếu chỗ thì phần phụ xuống dòng (375: tên + góc dòng 1, phần phụ dòng 2). Mỗi mục mang "·" ĐỨNG TRƯỚC, khung cắt ngang
     (6c #641 XM-3) → mục đầu mỗi dòng mất dấu, không "·" mồ côi. */
  const nutLui = lui && (
    <button type="button" onClick={veLai} aria-label={t('Quay lại {x}', { x: lui.nhan })}
      className="-ml-2 inline-flex min-h-[44px] max-w-[40%] shrink-0 appearance-none items-center gap-1 rounded-md border-0 bg-transparent px-2 text-left text-sm font-semibold text-[color:var(--accent)] hover:bg-[color:var(--accent-soft)] sm:min-h-9">
      <span aria-hidden className="text-[16px] leading-none">‹</span><span className="ten-hv min-w-0">{lui.nhan}</span>
    </button>
  );
  const nguoiLam = cvNgoai?.nguoiLam ? [[t('Phụ trách'), cvNgoai.nguoiLam] as [string, ReactNode]] : [];
  const meta = (trongCot ? [] : [
    phu, ...(dau ? dau.dong2 : [ngu]), dau?.han,
    ...[...(dau?.su ?? []), ...nguoiLam].filter(([, v]) => v !== null && v !== undefined && v !== '').map(([n, v]) => (
      <span key={n} className="inline-flex items-baseline gap-1.5"><span className="text-xs font-semibold text-faint">{n}</span><span className="font-semibold text-[color:var(--text)]">{v}</span></span>
    )),
    nutXem,
  ]).filter((x) => x !== null && x !== undefined && x !== false && x !== '');
  const dauMot = (
    <header className={`flex min-h-[52px] shrink-0 flex-wrap items-center gap-x-3.5 gap-y-0.5 border-b py-1.5 pr-2 sm:items-start sm:py-2 max-sm:pr-1 ${trongCot ? 'pl-0' : 'pl-5 max-sm:pl-4'}`} style={{ borderColor: 'var(--line)' }}>
      {nutLui}
      {/* PANEL-GON: tên + phần phụ trong MỘT khối co giãn — panel 600 thiếu chỗ thì phần phụ xuống dòng dưới tên; ≥ 640 đầu căn trên, dòng tên cao 36
          = cùng tâm với ‹ và góc ⓘ · ⋯ · ✕ (vẫn ở dòng 1, mép phải). */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3.5 gap-y-0.5">
      <h2 className={`m-0 min-w-0 font-bold leading-snug text-slate-100 max-sm:flex-1 max-sm:py-2 sm:flex sm:min-h-9 sm:max-w-full sm:shrink-0 sm:items-center ${trongCot ? 'text-[14px]' : 'text-[16px]'}${dau?.tieu ? ' flex flex-wrap items-center gap-x-2 gap-y-1' : ''}`}>{dau?.tieu ?? tieuDe}</h2>
      {meta.length > 0 && (
        <div className="-ml-1 min-w-0 overflow-x-clip pl-1 text-sm leading-snug text-dim max-sm:order-3 max-sm:basis-full max-sm:pb-1">
          <p className="m-0 -ml-5 flex flex-wrap items-center gap-y-0.5">
            {meta.map((x, i) => (
              <span key={i} className="flex min-w-0 items-center"><span aria-hidden className="w-5 flex-none text-center text-faint">·</span><span className="min-w-0">{x}</span></span>
            ))}
          </p>
        </div>
      )}
      </div>
      {(quyChe || oDem || dau?.ghim || nutDong) && (
        <span className="ml-auto flex shrink-0 items-center max-sm:self-start">{quyChe && <NutQuyChe qc={quyChe} />}{oDem}{dau?.ghim}{nutDong}</span>
      )}
    </header>
  );
  const than = (
    <>
        {trongThe ? (
          /* Chỉ form có hạn riêng (Kết quả PA · tuần + hạn — v16 e1) mới cần dòng đầu; Thêm PA / Hoàn thành đã có tên ở thẻ / mục. */
          dau?.han ? <div className="muc-h mt-3 flex-wrap">{dau.tieu ?? tieuDe}<span className="phai-h">{dau.han}</span></div> : null
        ) : anDau && !lui ? null : dauMot}
        {(daiRieng ?? cvNgoai?.daiLamThay) && (
          <div className="shrink-0 px-4 pt-2.5 max-sm:sticky max-sm:-top-4 max-sm:z-20 max-sm:pb-1" style={{ background: 'var(--surface)' }}>{daiRieng ?? cvNgoai?.daiLamThay}</div>
        )}
        {tabs && <div className="shrink-0 border-b px-4" style={{ borderColor: 'var(--line)' }}>{tabs}</div>}
        {/* PR-KHUNG: pb-2 — thân cuộn bắt đầu cách dòng ngữ cảnh; không có thì ô bị cắt ngay sát chữ, trông như đè nhãn (rà LUI-a1, 375). */}
        {ngCanh && <div className="shrink-0 truncate px-4 pb-2 pt-2 text-xs text-slate-400 max-sm:whitespace-normal">{ngCanh}</div>}
        {/* AUDIT-LOI F06: luật cuộn theo loại khung. Nổi: thân cuộn riêng, chặn cuộn xuyên xuống nền. Tại chỗ: cuộn riêng khi bị giới hạn cao (lg),
            hết thì cuộn tiếp trang. Trong cột: cao theo nội dung, không cuộn riêng — `overscroll-contain` trên khung không cuộn được vẫn nuốt
            bánh xe chuột, trỏ vào Case là trang đứng yên. */}
        <div id={vungTab?.id} role={vungTab ? 'tabpanel' : undefined} aria-label={vungTab?.nhan} className={`pn-than min-h-0 flex-1 ${trongThe ? 'px-0' : 'px-4 sm:px-5'} ${trongCot ? 'pb-1' : taiCho ? 'pb-4 overflow-y-auto' : 'pb-4 overflow-y-auto overscroll-contain'}`}>{cvNgoai?.dai && <div className="pt-3">{cvNgoai.dai}</div>}<BaoSuaPanel.Provider value={baoSua}>{children}</BaoSuaPanel.Provider></div>
        {chan?.v3 && (
          /* Tại chỗ ở 375 (thẻ trong `main` cuộn): chân dính đáy, sát trên thanh điều hướng dưới — mép dính tính từ đệm `pb-20` (80 px) của `main`,
             thanh dưới cao 57 px + vùng an toàn → lùi 23 px. */
          <footer className={`flex shrink-0 flex-col gap-2 border-t ${trongThe ? 'px-0' : 'px-4'} pb-3.5 pt-2.5 ${chan.dongTren || chan.conThieu?.length ? '' : 'sm:hidden'} ${taiCho && !trongThe ? 'chan-dinh-375' : ''}`} style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
            {chan.conThieu?.length ? <DongCanSua muc={chan.conThieu} /> : null}
            {chan.dongTren && <div className="flex min-h-6 items-center gap-2 text-[13px] text-slate-400">{chan.dongTren}</div>}
            {chan.chinh && <div className="sm:hidden [&>button]:min-h-[48px] [&>button]:w-full [&>button]:justify-center [&>button]:text-[14px] [&>button]:font-bold">{chan.chinh}</div>}
          </footer>
        )}
        {chan && !chan.v3 && (
          /* U02 (mockup c2, PTA 04/11): trong cột — chân không nền, không kẻ, không dải trống: nút về phải ngay dưới hàng cuối. */
          <footer className={`shrink-0 ${trongCot ? `${trongThe ? '' : 'mx-4'} [&>div]:min-h-0 [&>div]:px-0 [&>div]:pb-3 [&>div]:pt-0` : 'border-t'} ${taiCho && !trongThe ? 'chan-dinh-375' : ''}`} style={{ borderColor: 'var(--line)', background: trongCot ? 'transparent' : 'var(--surface)' }}>
            {chan.conThieu?.length ? <DongCanSua muc={chan.conThieu} /> : null}
            {chan.dongTren}
            {/* RA-UI-1 (mockup `v7/khai-bac-lo.html` #w375): 375 — dòng trạng thái / đếm lên đầu chân, mọi nút chia đều MỘT hàng (Huỷ | Lưu, Lưu không còn nhỏ lệch trái). */}
            {/* NHẸ HƠN (v23 `.pn-chan`): chân MỘT hàng mỏng ≥ 52 px — trái trạng thái lưu, phải nút. */}
            <div className="flex min-h-[52px] flex-wrap items-center gap-2 py-2 pl-5 pr-3 max-sm:px-4 max-sm:[&>.btn]:flex-1 max-sm:[&>.btn]:justify-center">
              {huy && !chan.huyPhai && nutHuy(huy, chan)}
              {chan.xoa && <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" onClick={chan.xoa.onClick}>{chan.xoa.nhan ?? t('Xoá')}</button>}
              {chan.trai ? <span className="flex min-w-0 flex-1 items-center gap-2 text-[13px] max-sm:order-first max-sm:basis-full has-[[role=alert]]:order-first has-[[role=alert]]:basis-full">{chan.trai}</span> : <span className="flex-1 max-sm:hidden" />}
              {huy && chan.huyPhai && nutHuy(huy, chan)}
              {chan.phu}
              {chan.chinh}
            </div>
          </footer>
        )}
        {hoi && <HopBoChu viec={tieuDe} nut={hoi.nut} onO={() => { setHoi(null); hoi.o?.(); }} onBo={boChu} />}
    </>
  );
  const voi = (x: ReactNode) => <TrongKhung.Provider value><QuayLaiPanel.Provider value={null}><DongKhungPanel.Provider value={trongCot || (chan && !chan.v3 && huy) ? null : dong}>{x}</DongKhungPanel.Provider></QuayLaiPanel.Provider></TrongKhung.Provider>;
  if (taiCho) {
    /* OV-14c: Esc từ hộp nằm trong portal (hộp nhập điểm) nổi bọt qua cây React — chỉ đóng panel khi Esc phát ra TRONG khung panel. */
    return (
      /* 375 toàn màn (08 NEN-PANEL, `.dt-toan`): `-mx-4` bù đệm `p-4` của <main> — thẻ tràn sát hai mép, không bo góc. */
      <section ref={khung} tabIndex={-1} aria-label={tieuDe} onKeyDown={(e) => { if (e.key === 'Escape' && !e.defaultPrevented && khung.current?.contains(e.target as Node) && !khung.current.querySelector('[aria-modal="true"]')) dong(); }}
        /* NHẸ HƠN (v23 P1) + PANEL-GON: ≥ 1024 panel tại chỗ BÁM MÉP PHẢI từ ngay dưới thanh menu tới đáy, 600 px (bảng theo nội dung) — danh sách
           trái (nơi gọi, theo `--pn-w`) lấy phần còn lại, bấm dòng khác = đổi việc. < 1024 giữ thẻ trong luồng trang (375 toàn màn). */
        style={{ '--pn-top': `${top}px` } as CSSProperties} data-pn={laBang ? 'bang' : 'viec'}
        className={trongCot ? 'flex min-w-0 flex-col -outline-offset-2' : `card flex flex-col -outline-offset-2 max-sm:-mx-4 max-sm:rounded-none max-sm:border-x-0 sm:max-lg:max-h-[calc(100dvh-8rem)] lg:fixed lg:bottom-0 lg:right-0 lg:top-[var(--pn-top)] lg:z-30 lg:rounded-none lg:border-y-0 lg:border-r-0 lg:shadow-2xl ${laBang ? 'lg:w-fit lg:min-w-[600px] lg:max-w-[75%]' : 'lg:w-[600px]'} ${chan ? 'max-sm:overflow-visible sm:overflow-hidden' : 'overflow-hidden'}`}>
        <KhungTrongThe.Provider value={trongThe}><KhungTrongCot.Provider value={false}><KhungTaiCho.Provider value={false}><ThanTrongCot.Provider value={trongCot && !trongThe}>{voi(than)}</ThanTrongCot.Provider></KhungTaiCho.Provider></KhungTrongCot.Provider></KhungTrongThe.Provider>
      </section>
    );
  }
  return createPortal(
    /* T21: `bottom` = phần bàn phím ảo che (`useBanPhim` — đo một nơi ở `App`, `ui/banPhim.ts`) — panel co lên, chân lưu nằm ngay trên bàn phím. */
    /* NHẸ HƠN (v23): khung bắt đầu NGAY DƯỚI thanh menu (menu không bị phủ), tới đáy. */
    <div className={`fixed inset-x-0 !mt-0 ${z} flex justify-end`} style={{ top, bottom: 'var(--ban-phim, 0px)' }} role="dialog" aria-modal="true" aria-label={tieuDe}>
      <div className="absolute inset-0 bg-black/60" onClick={dong} />
      <div ref={khung} tabIndex={-1} data-pn={rong === 'toan' ? undefined : laBang ? 'bang' : 'viec'} className={`relative flex h-full w-full flex-col rounded-none border-l shadow-2xl -outline-offset-2 ${rong === 'toan' ? 'max-w-[1440px]' : laBang ? 'sm:w-fit sm:min-w-[min(600px,100%)] sm:max-w-[75%]' : 'sm:w-[600px] sm:max-w-full'}`}
        style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
        {/* HD3-1 (15 mục 8.3): "?" nổi trên nền mờ, sát mép trái panel, cùng dáng "?" thanh trên — "?" thanh trên bị panel che. ≥ 640 px (375 panel phủ hết). */}
        {nutHd && rong !== 'toan' && (
          <button type="button" onClick={moHuongDan} aria-label={t('Hướng dẫn')} title={t('Hướng dẫn')} data-hd="nut-hd-noi"
            className="absolute -left-12 top-2.5 grid h-9 w-9 cursor-pointer place-items-center bam rounded-full border-0 bg-transparent text-white max-sm:hidden">
            <span aria-hidden className="grid h-[22px] w-[22px] place-items-center rounded-full border-[1.5px] border-current text-[13px] font-bold leading-none">?</span>
          </button>
        )}
        {voi(than)}
      </div>
    </div>,
    document.body,
  );
}

/** Một KHỐI trong thân panel: tiêu đề nhỏ (luật dài vào ⓘ), khối sau có vạch trên. */
/**
 * DÒNG QUY CHẾ (GD-3, mockup v21 `.quy-che`): "Quy chế" · một câu · ⓘ chi tiết. `KhungPanel` vẽ ngay trên chân (`quyChe`); panel có chân v3 (nút nằm
 * trong thân) vẽ trực tiếp ngay trên hàng nút với `px="px-0"`.
 */
/** HD3-1: ⓘ dòng quy chế = mở panel "?" đúng thẻ việc (thẻ có câu quy chế + chi tiết ở đầu). Dáng ⓘ như `NutLuat`. */
/** NHẸ HƠN: ⓘ quy chế ở góc đầu panel (thay hàng "Quy chế …"): cùng ô 36 × 36 với ⋯ / ✕; rê thấy câu quy chế; bấm mở Hướng dẫn đúng thẻ việc. */
function NutQuyChe({ qc }: { qc: { chu: string; chiTiet?: string } }) {
  useEffect(() => ghiQuyCheMo({ chu: qc.chu, chiTiet: qc.chiTiet }), [qc.chu, qc.chiTiet]);
  return (
    <button type="button" className={NUT_DONG} title={qc.chu} aria-label={t('Hướng dẫn việc này')} onClick={moHuongDan}>
      <span aria-hidden className="grid h-[18px] w-[18px] place-items-center rounded-full border-[1.5px] border-current text-[12px] font-bold leading-none">i</span>
    </button>
  );
}
const NutHdQuyChe = () => (
  <button type="button" className="-m-[15px] cursor-pointer border-0 bg-transparent p-[15px] text-sm font-normal leading-none text-slate-500 hover:text-slate-200 sm:m-0 sm:p-0"
    title={t('Hướng dẫn việc này')} aria-label={t('Hướng dẫn việc này')} onClick={moHuongDan}>ⓘ</button>
);
export function DongQuyChe({ qc, px = 'px-4', vien = true }: { qc: { chu: string; chiTiet?: string }; px?: string; /** false: đứng đầu chân (chân đã có vạch trên) — vạch DƯỚI tách khỏi hàng nút. */ vien?: boolean }) {
  /* HD3-1: "?" đọc câu quy chế đang hiện (dòng gắn sau cùng) cho đầu thẻ việc. */
  useEffect(() => ghiQuyCheMo({ chu: qc.chu, chiTiet: qc.chiTiet }), [qc.chu, qc.chiTiet]);
  return (
    <div data-quy-che className={`flex min-h-9 shrink-0 items-center gap-2 ${vien ? 'border-t' : 'border-b'} ${px} py-1.5 text-[13px] leading-snug text-dim`} style={{ borderColor: 'var(--line)' }}>
      <span className="shrink-0 text-xs font-semibold text-faint">{t('Quy chế')}</span>
      {/* GD-20c (PTA rà #1738) + PANEL-GON (panel 600): câu xuống dòng đủ chữ, không "…" ở mọi bề rộng. HD3-1 (15 mục 8.1): ⓘ mở panel "?" chồng lên,
          đúng thẻ việc (thẻ có câu này + chi tiết ở đầu) — không còn hộp chữ riêng; ⓘ vẫn chỉ khi có chi tiết. */}
      <span className="min-w-0 flex-1">{qc.chu}</span>
      {qc.chiTiet && <NutHdQuyChe />}
    </div>
  );
}

export function Khoi({ tieuDe, luat, so, children }: { tieuDe: string; luat?: ReactNode; /** Số bước trong vòng tròn nhỏ trước tiêu đề (panel nhiều bước, mockup MT phần 1). */ so?: number; children: ReactNode }) {
  return (
    <section className="mt-3.5 border-t pt-3.5 first:mt-0 first:border-t-0 first:pt-3.5" style={{ borderColor: 'var(--line)' }}>
      <h3 className="mb-2.5 mt-0 flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
        {so !== undefined && <span aria-hidden className="inline-grid h-[18px] w-[18px] place-items-center rounded-full bg-doing-bg text-[12px] font-bold tabular-nums text-doing">{so}</span>}
        {tieuDe}{luat && <NutLuat>{luat}</NutLuat>}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/** N35: bộ đếm `212 / 200` — hiện từ 80 % trần (không rối lúc gõ vài câu), quá trần chữ đỏ + đậm (không chỉ bằng màu: số vượt trần đứng đầu). */
export function DemChu({ n, toiDa }: { n: number; toiDa: number }) {
  /* UI-CONG-VIEC (mockup U01 `.dem-chu`): panel việc ở Công việc luôn hiện "n / trần"; nơi khác từ 80 % trần. */
  const luon = useContext(NhanTruongDam);
  if (!luon && n < toiDa * 0.8) return null;
  return <span className={`text-xs tabular-nums ${n > toiDa ? 'font-semibold text-bad' : 'font-normal text-slate-500'}`} aria-live="polite">{n} / {toiDa}</span>;
}

/**
 * Một TRƯỜNG: nhãn ở TRÊN ô, `*` khi bắt buộc, chữ phụ ≤ 1 dòng, `loi` chỉ khi người gọi truyền (sau khi bấm Lưu / rời ô).
 * Có `loi` → ô viền đỏ + lý do dưới ô (YC-12.5.2; người gọi đặt `aria-invalid` lên ô). `dem.toiDa` (N35): từ 80 % trần hiện `212 / 200`, quá trần chữ đỏ;
 * `dem.can` (tối thiểu) không vẽ — kiểm khi lưu (AUDIT-1611 A1-19). `tuyChon`: chỉ đánh dấu ở nơi gọi, không vẽ "(không bắt buộc)" — ô bắt buộc đã có * (A3-20).
 */
export function Truong({ nhan, batBuoc, thieu, phu, phuNhan, luat, loi, dem, as = 'label', children }: {
  /** OV-13f: ô bắt buộc mà trống vẫn lưu được (Email) — chữ "Thiếu" cam cạnh nhãn. */
  thieu?: boolean;
  nhan: string; batBuoc?: boolean; tuyChon?: boolean; phu?: string; loi?: string | null; dem?: { co: number; can?: number; toiDa?: number };
  /** GD-19 (mockup ⑪ K6a "Lý do * gửi Vũ Thu Lan"): chữ mờ CẠNH nhãn (khác `phu` — dưới ô). */
  phuNhan?: string;
  /** AUDIT-1611 A3-20: giải thích tĩnh (luật nhập) → ⓘ cạnh nhãn, không chữ dưới ô. */
  luat?: ReactNode;
  as?: 'label' | 'div'; children: ReactNode;
}) {
  /* Ô ngày / ô chọn người bên trong báo id → nhãn `<label htmlFor>`, không bọc nút lịch (`BaoOTrongNhan`). Thẻ khung chỉ theo props. */
  const [idO, setIdO] = useState<string | null>(null);
  /* AUDIT-1611 A3-20: có ⓘ (`luat`) thì khung là div — nút trong <label> sẽ thành ô được nhãn trỏ tới (ô nhập mất tên). */
  const Vo = as === 'div' || luat || coOTuNhan(children) ? 'div' : 'label';
  /* `as="div"` không có ô để nhãn trỏ vào (nhóm NutChon…) → nhóm mang tên của nhãn, trình đọc màn hình đọc "Mức độ, nhóm". */
  const idNhan = useId();
  const dam = useContext(NhanTruongDam);   // UI-CONG-VIEC: ô không bắt buộc không ghi "(không bắt buộc)" — ô bắt buộc đã có *
  /* UI-CONG-VIEC → AUDIT-1611 A1-19 (mọi nơi): MỘT bộ đếm "n / trần"; mức tối thiểu không vào bộ đếm — báo lỗi khi lưu. */
  const troO = Vo === 'div' ? idO : null;
  const nhom = Vo === 'div' && !idO ? { role: 'group', 'aria-labelledby': idNhan } : {};
  const chu = <>
    <span className="min-w-0 flex-1">
      {nhan}{batBuoc && <><span aria-hidden className="text-bad"> *</span><span className="sr-only"> {t('(bắt buộc)')}</span></>}
      {phuNhan && <span className="font-normal text-slate-400"> {phuNhan}</span>}
      {thieu && <span className="ml-1.5 text-xs font-semibold text-late">{t('Thiếu')}</span>}
    </span>
    {dem?.toiDa ? <DemChu n={dem.co} toiDa={dem.toiDa} /> : null}
  </>;
  const lopNhan = dam ? 'mb-2 flex items-baseline gap-2 text-[14px] font-bold leading-snug text-[color:var(--text)]'
    : 'mb-1 flex items-baseline gap-2 text-[12px] font-medium text-slate-200';   // D10: nhãn trường 500 (luật chữ: nhãn 500)
  const noi = useNoiLoi(loi);
  const the = troO ? <label htmlFor={troO} className={lopNhan}>{chu}</label> : <span id={idNhan} className={lopNhan}>{chu}</span>;
  return (
    <BaoOTrongNhan.Provider value={setIdO}>
      <Vo className="block min-w-0" {...nhom}>
        {luat ? <span className="flex items-baseline gap-1">{the}<NutLuat label={nhan}>{luat}</NutLuat></span> : the}
        {/* Luôn cùng một lớp bọc (`contents`, không đổi bố cục): bọc/bỏ bọc theo `loi` làm ô dựng lại → mất focus khi đang gõ. */}
        <div ref={noi.ref} className={loi ? 'contents [&_.field]:border-late [&_.field]:ring-1 [&_.field]:ring-late/40' : 'contents'}>{children}</div>
        {phu && <span className="mt-1 block truncate text-xs text-slate-500">{phu}</span>}
        {loi && <span id={noi.id} className="mt-1 block text-xs text-late">{loi}</span>}
      </Vo>
    </BaoOTrongNhan.Provider>
  );
}

/** Hai ô một hàng khi thật ngắn: 2 cột từ sm, 1 cột dưới sm. */
export function Hang2({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}
