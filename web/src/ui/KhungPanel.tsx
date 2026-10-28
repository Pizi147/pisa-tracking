import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import { docNhap, ghiNhap, taoKhoPanel, xoaNhapViec, type KhoNhap } from '@shared/domain/index.ts';
import { NutLuat } from './NutLuat.tsx';
import { HopBoChu } from './Drawer.tsx';
import { DongCanSua, useNoiLoi, type MucThieu } from './loiForm.tsx';
import { useGiuFocus } from './giuFocus.ts';
import { BaoOTrongNhan, coOTuNhan } from './ONgay.tsx';
import { XemCha } from '../lib/quayLai.ts';
import { t } from '@shared/i18n/index.ts';

/** Kho dùng chung toàn web: mở panel này thì panel đang mở phải đóng (G-8, N-4). */
export const khoPanelChung = taoKhoPanel();
/** Panel đang mở, mở sau ở cuối — Esc chỉ đóng panel cuối (panel vẽ qua portal nên không còn lồng nhau trong DOM). */
const nganPanel: string[] = [];
/**
 * PR-EN: panel đang sửa dở (`chan.daSua` hoặc còn nháp) — đổi ngôn ngữ (tải lại trang) hỏi trước khi bỏ chữ đang gõ.
 * NEN-PANEL (T16): mỗi panel ghi kèm cách HỎI của nó (hộp "Bỏ chữ đang gõ?" vẽ trong panel) — `boChuRoi` dùng khi đổi việc.
 */
const panelDangSua = new Map<string, (tiep: () => void) => void>();
export const coPanelDangSua = () => panelDangSua.size > 0;
/** Đổi việc / "‹ Công việc" / mở việc khác: còn chữ chưa lưu thì panel hỏi (Ở lại = nút chính); bỏ chữ hoặc không có chữ → `tiep`. */
export function boChuRoi(tiep: () => void) {
  const hoi = [...panelDangSua.values()].pop();
  if (hoi) hoi(tiep); else tiep();
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
export function useNhap<T>(o: string, dau: T): [T, Dispatch<SetStateAction<T>>] {
  const n = useContext(NhapCuaPanel);
  const [v, setV] = useState<T>(() => (n ? docNhap<T>(khoNhap(), n.viec, o) : undefined) ?? (traLaiNgoai.get(o) as T | undefined) ?? dau);
  const [goc] = useState(() => JSON.stringify(dau));
  const lanDau = useRef(true);
  useEffect(() => {
    if (!n) return;
    const trong = JSON.stringify(v) === goc;
    if (!lanDau.current) ghiNhap(khoNhap(), n.viec, o, v, trong);   // lần đầu: giá trị vừa đọc từ kho / ban đầu — không ghi lại
    lanDau.current = false;
    n.bao(o, !trong);
  }, [v]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { traLaiNgoai.delete(o); return () => n?.bao(o, false); }, []);   // eslint-disable-line react-hooks/exhaustive-deps -- trả lại dùng một lần · ô gỡ: không còn chữ để hỏi; nháp vẫn trong kho
  return [v, setV];
}
/**
 * Lưu xong: bỏ nháp của việc (mọi ô) — panel thôi coi là "đang sửa" tới khi gõ tiếp. Trả hàm ghi lại nháp đó (HOAN-TAC-XN: Hoàn tác lần lưu → mở lại
 * việc thì chữ còn). Ngoài panel việc: không có kho, hàm rỗng.
 */
export function useXoaNhap(): () => () => void {
  const n = useContext(NhapCuaPanel);
  return useCallback(() => n?.xoa() ?? (() => {}), [n]);
}

/**
 * T21 (375 + bàn phím): bàn phím ảo che phần dưới vùng nhìn — đo bằng `visualViewport`, đặt `--ban-phim` (px bị che) + `data-ban-phim` lên <html>:
 * panel phủ co lên trên bàn phím, chân lưu dính ngay trên bàn phím, thanh điều hướng dưới ẩn (`index.css`).
 */
function useBanPhim(bat: boolean) {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!bat || !vv) return undefined;
    const goc = document.documentElement;
    const bo = () => { delete goc.dataset.banPhim; goc.style.removeProperty('--ban-phim'); };
    const doi = () => {
      const che = Math.round(window.innerHeight - vv.height - vv.offsetTop);
      if (che > 80) {
        const moi = goc.dataset.banPhim === undefined;
        goc.dataset.banPhim = ''; goc.style.setProperty('--ban-phim', `${che}px`);
        /* UI-CON-LAI k8: bàn phím vừa mở → ô đang gõ cuộn vào giữa phần màn còn thấy (không bị chân Lưu / bàn phím che). */
        const o = document.activeElement as HTMLElement | null;
        if (moi && o?.matches('input, textarea, select')) requestAnimationFrame(() => o.scrollIntoView({ block: 'center' }));
      } else bo();   // < 80 px: thanh công cụ trình duyệt, không phải bàn phím
    };
    doi();
    vv.addEventListener('resize', doi); vv.addEventListener('scroll', doi);
    return () => { vv.removeEventListener('resize', doi); vv.removeEventListener('scroll', doi); bo(); };
  }, [bat]);
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
/** V5 UI-CONG-VIEC: trang Công việc nói panel việc đang mở thuộc nhóm nào ("VIỆC · CASE HỌC THUẬT" / "THEO DÕI · …") + dòng "Em này còn" dưới đầu. */
/** `khoa`: chế độ theo dõi — thân + chân panel chỉ xem (`fieldset disabled`), đầu panel (✕, "Em này còn", link hồ sơ) vẫn bấm được. */
/** M6 6b-3 `dai`: dải "✓ Đã lưu … · Hoàn tác" của việc vừa làm — đầu thân panel của việc kế (mockup panel-pilot ②b). */
export const DauViecCongViec = createContext<{ loai: string; them?: ReactNode; khoa?: boolean; dai?: ReactNode } | null>(null);
/** M6 6b-3: lớp panel đang ẨN (form việc khi đang "Xem Case" trong panel việc) — cần hỏi "Bỏ chữ?" thì hiện lại lớp đó trước (hộp hỏi vẽ trong panel). */
export const HienLaiPanel = createContext<(() => void) | null>(null);

/**
 * KHUÔN PANEL CHUNG (PR-UX0, N-4 — mockup 15 (1)). Ngăn phải 480px (V5 07 mục 4: 420–480; form dạng bảng `rong` = 720px), 375px toàn màn.
 * Đầu 52px MỘT dòng: tiêu đề · tên HV · lớp (mờ, cắt "…") · ✕; tab (nếu có) dính dưới đầu; ngữ cảnh ≤ 1 dòng.
 * Thân chia KHỐI (`Khoi`, tiêu đề nhỏ, luật dài vào ⓘ), nhãn TRÊN ô (`Truong`), ≤ 2 ô một hàng (`Hang2`).
 * Chân CỐ ĐỊNH: trái Huỷ / Xoá (viền đỏ), phải nút phụ + MỘT nút chính; dòng xám "n ô cần sửa ↑" trên chân (PR-N1,
 * `DongCanSua`) — chỉ truyền `conThieu` SAU khi bấm Lưu; lý do từng ô nằm dưới ô (`Truong loi`). CHỈ thân cuộn, trang sau khoá cuộn. Mở việc khác thì THAY nội dung, không
 * chồng panel (`khoPanelChung`). Không chữ dev; chữ mẫu bắt đầu "Ví dụ:".
 */
export function KhungPanel({ tieuDe, hocVien, lop, rong: rongRieng, tabs, ngCanh, quayLai, chan, daSua: daSuaRieng, longTrong, z = 'z-50', dau, loai, onDong, children }: {
  tieuDe: string; hocVien?: string | null; lop?: string | null;
  /** NEN-PANEL (07 mục 3, `v5-nen.css .panel-loai`): dòng loại trên tiêu đề, vạch hồng — "VIỆC · …" / "BÁO CÁO · CHỈ ĐỌC". M6 6b-1: khung KHÔNG
   *  đoán theo `dau` — panel việc khai qua `dauViec` (`dau.loai`) hoặc prop này; `null` = không vẽ. */
  loai?: string | null;
  /** OV-12c — ĐẦU PANEL v3 (mockup panel v3 §1): dòng 1 tên việc 17 px + MỘT chip hạn (`ChipHan`) + ✕; dòng 2 em (link) · lớp · ngữ cảnh.
   *  Có `dau` thì `hocVien` / `lop` không vẽ ở đầu một dòng cũ. */
  dau?: { han?: ReactNode; dong2: ReactNode[]; loai?: string };
  /** Lớp z — panel mở từ một popover `z-[60]` (hộp xếp lịch `HopKyNang`) cần nằm trên popover đó (PR-LM). */
  z?: string;
  /** Không vào `khoPanelChung`: panel con mở đè (Chuyển tiếp → Tạo lớp) không đóng panel này, state giữ nguyên.
   *  Esc chỉ đóng panel mở sau cùng (`nganPanel`) — panel dưới không cần tự chặn Esc. */
  longTrong?: boolean;
  /** `toan`: lưới nhập hàng loạt nhiều cột (Thêm học viên) — rộng theo màn tới 1440px, không ép 10 cột vào ngăn hẹp. */
  rong?: 'hep' | 'rong' | 'toan';
  tabs?: ReactNode; ngCanh?: ReactNode;
  /** M6 6b-3: `xem` = không phải lùi mà vào view kế ("Xem Case" của panel việc) — vẽ thành link cuối dòng 2 của đầu, không thành nút ‹. */
  quayLai?: { nhan: string; onClick: () => void; xem?: boolean };
  chan?: {
    /** `null` = không vẽ nút trái (panel tự có nút Đóng ở `chinh`, ví dụ ngăn Tổng kết lộ trình). */
    huy?: { nhan?: string; onClick: () => void; disabled?: boolean } | null; xoa?: { onClick: () => void; nhan?: string };
    phu?: ReactNode; chinh?: ReactNode; conThieu?: (string | MucThieu)[];
    /** NEN-PANEL (`.panel-chan .trai`): trạng thái lưu (`TrangThaiLuu` / `ChuLuu`) đầu hàng nút, trước Lưu / Lưu · việc tiếp ›. */
    trai?: ReactNode;
    /** Luật S3 (I1): form đã sửa → nút trái mặc định "Huỷ thay đổi", chưa sửa → "Đóng". `huy.nhan` riêng (Xong, ‹ Sửa…) thắng. */
    daSua?: boolean;
    /** OV-14a (F12): nơi gọi tự hỏi khi đóng (hộp nêu đúng số em bị ảnh hưởng) — khung không hỏi thêm lần nữa ở ✕ / Esc / nền. */
    tuHoi?: boolean;
    /** Một dòng riêng NGAY TRÊN hàng nút (ví dụ dòng xem trước trên điện thoại — PR-XLMT). Nơi gọi tự ẩn/hiện theo cỡ màn. */
    dongTren?: ReactNode;
    /** OV-12c — CHÂN v3: không nút trái; ≥ 640 px nút chính nằm trong khối Cần làm (nơi gọi) nên chân chỉ hiện khi có `dongTren`
     *  (trạng thái lưu); 375: dòng trạng thái trên nút chính rộng hết khung, dính đáy. */
    v3?: boolean;
  };
  /** 6c (lỗi 5): như `chan.daSua` cho panel KHÔNG có chân (form + nút lưu nằm trong thân). */
  daSua?: boolean;
  onDong: () => void; children: ReactNode;
}) {
  const id = useId();
  const khung = useRef<HTMLDivElement>(null);
  const dongRef = useRef(onDong);
  dongRef.current = onDong;
  const trongCot = useContext(KhungTrongCot);
  const taiCho = useContext(KhungTaiCho) || trongCot;
  /* M6 6b-2 (khu K D6): một chuỗi view một bề rộng — panel trong chuỗi `XemCha` lấy bề rộng của chuỗi khi không tự đặt. */
  const chuoi = useContext(XemCha);
  const rong = rongRieng ?? chuoi?.rong ?? 'hep';
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
  const [hoi, setHoi] = useState<{ nut: string; tiep: () => void } | null>(null);
  const daSuaRef = useRef(false);
  daSuaRef.current = daSua && !chan?.tuHoi;
  const dong = () => { if (daSuaRef.current) setHoi({ nut: t('Bỏ chữ, đóng'), tiep: () => dongRef.current() }); else dongRef.current(); };
  const boChu = () => { const h = hoi; setHoi(null); nhap?.xoa(); h?.tiep(); };

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

  useEffect(() => {
    if (!daSua) return undefined;
    panelDangSua.set(id, (tiep) => { hienLaiRef.current?.(); setHoi({ nut: t('Bỏ chữ, sang việc khác'), tiep }); });
    return () => { panelDangSua.delete(id); };
  }, [id, daSua]);
  useBanPhim(!trongKhung);   // rà #530: một nơi đo — panel con đóng không gỡ `--ban-phim` khi panel ngoài còn mở

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
  const dongLoai = loai === undefined ? (cvNgoai?.loai ?? dau?.loai ?? null) : loai;
  const vachLoai = dongLoai && !trongCot && (
    <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-[.02em] text-slate-500">
      <span aria-hidden className="h-[3px] w-3.5 shrink-0 rounded-sm bg-[color:var(--hong)]" />{dongLoai}
    </div>
  );
  const ngu = [hocVien, lop].filter(Boolean).join(' · ');
  const huy = chan?.huy === null ? null : chan?.huy ?? { onClick: onDong };
  useGiuFocus(khung, !taiCho);
  /* `!mt-0`: panel đứng trong trang có `space-y-*` thì bị cộng margin-top 12–16 px → lệch xuống, lộ dải demo bar/đầu trang (PR-DH, DH-13).
     Vẽ qua portal ra <body>: panel mở từ ô bảng (GV chấm ở tiêu đề cột dính, hộp bốn tiêu chí trong ô điểm) không bị kẹt dưới
     lớp xếp chồng của ô, không kế thừa chữ in hoa / căn phải của ô. Sự kiện React vẫn nổi theo cây React như cũ. */
  const nutDong = trongCot ? null : <button type="button" className={`btn btn-sm btn-ghost min-h-[44px] min-w-[44px] justify-center sm:min-h-[32px] sm:min-w-[32px] ${dau && !lui ? '-my-1' : ''} ${lui ? 'ml-auto' : ''}`} onClick={dong} aria-label={t('Đóng')}>✕</button>;
  /* M6 6b-1 (mockup panel-pilot khu K ①): "‹ {view trước}" cùng hàng ✕ ở đầu panel, ✕ luôn góc phải — thay dòng "← …" riêng dưới đầu. */
  const hangLui = lui && (
    <div className="-ml-2 flex min-h-9 w-[calc(100%+0.5rem)] items-center gap-2">
      <button type="button" onClick={veLai} aria-label={t('Quay lại {x}', { x: lui.nhan })}
        className="inline-flex min-h-[44px] min-w-0 appearance-none items-center gap-1 rounded-md border-0 bg-transparent px-2 py-1.5 text-left text-sm font-semibold text-[color:var(--accent)] hover:bg-[color:var(--accent-soft)] sm:min-h-0">
        <span aria-hidden className="text-[17px] leading-none">‹</span><span className="min-w-0 truncate">{lui.nhan}</span>
      </button>
      {nutDong}
    </div>
  );
  const than = (
    <>
        {dau ? (
          <header className={`flex shrink-0 flex-col gap-1.5 border-b px-4 pb-3.5 sm:px-5 ${lui ? 'pt-2' : 'pt-4'}`} style={{ borderColor: 'var(--line)' }}>
            {hangLui}
            {vachLoai && <div className="-mb-1.5">{vachLoai}</div>}
            <div className="flex items-start gap-2.5">
              {/* RA-UI-6 (critique A4): panel nằm trong cột hồ sơ (`trongCot`) dưới đầu mục 15 → tiêu đề 15, không lớn hơn tầng cha. */}
              <h2 className={`m-0 min-w-0 flex-1 font-bold leading-6 text-slate-100 ${trongCot ? 'text-[15px]' : 'text-[17px]'}`}>{tieuDe}</h2>
              {dau.han}
              {!lui && nutDong}
            </div>
            {/* 6c (#641 XM-3): mỗi mục mang "·" rộng cố định ĐỨNG TRƯỚC, hàng lùi trái đúng bề rộng đó, khung cắt ngang → mục đầu mỗi dòng
                (kể cả khi xuống hàng ở 375) mất dấu, không còn "·" mồ côi đầu dòng. "· Xem Case" không tách dòng. */}
            {/* `-ml-1 pl-1`: chừa 4 px cho vòng focus của link đầu dòng (dấu "·" vẫn nằm ngoài vùng cắt). */}
            {!trongCot && <div className="-ml-1 overflow-x-clip pl-1 text-sm leading-snug text-slate-400">
              <p className="m-0 -ml-5 flex flex-wrap items-baseline">
                {[...dau.dong2.filter(Boolean), ...(nutXem ? [nutXem] : [])].map((x, i, ds) => (
                  <span key={i} className={nutXem && i === ds.length - 1 ? 'whitespace-nowrap' : 'min-w-0'}><span aria-hidden className="inline-block w-5 text-center text-slate-500">·</span>{x}</span>
                ))}
              </p>
            </div>}
            {cvNgoai?.them}
          </header>
        ) : (
        <header className={`flex shrink-0 items-center gap-2 border-b px-4 ${lui ? 'flex-wrap pb-2.5 pt-1.5' : vachLoai || cvNgoai?.them ? 'flex-wrap pb-2.5 pt-3' : 'h-[52px]'}`} style={{ borderColor: 'var(--line)' }}>
          {hangLui}
          {vachLoai && <div className="-mb-1 w-full">{vachLoai}</div>}
          <h2 className="m-0 min-w-0 truncate text-[17px] font-bold text-slate-100" title={tieuDe}>{tieuDe}</h2>
          {ngu && <span className="min-w-0 flex-1 truncate text-xs text-slate-400" title={ngu}>{ngu}</span>}
          {!ngu && <span className="flex-1" />}
          {nutXem}
          {/* Rà #530: ✕ ở mọi cỡ như mockup V5 (375 có thêm "‹ Công việc" của nơi gọi — cùng đường đóng). */}
          {!lui && nutDong}
          {cvNgoai?.them && <div className="w-full pb-1">{cvNgoai.them}</div>}
        </header>
        )}
        {tabs && <div className="shrink-0 border-b px-4" style={{ borderColor: 'var(--line)' }}>{tabs}</div>}
        {/* PR-KHUNG: pb-2 — thân cuộn bắt đầu cách dòng ngữ cảnh; không có thì ô bị cắt ngay sát chữ, trông như đè nhãn (rà LUI-a1, 375). */}
        {ngCanh && <div className="shrink-0 truncate px-4 pb-2 pt-2 text-xs text-slate-400 max-sm:whitespace-normal">{ngCanh}</div>}
        <fieldset disabled={!!cvNgoai?.khoa} className="contents">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{cvNgoai?.dai && <div className="pt-3">{cvNgoai.dai}</div>}<BaoSuaPanel.Provider value={baoSua}>{children}</BaoSuaPanel.Provider></div>
        {chan?.v3 && (
          /* Tại chỗ ở 375 (thẻ trong `main` cuộn): chân dính đáy, sát trên thanh điều hướng dưới — mép dính tính từ đệm `pb-20` (80 px) của `main`,
             thanh dưới cao 57 px + vùng an toàn → lùi 23 px. */
          <footer className={`flex shrink-0 flex-col gap-2 border-t px-4 pb-3.5 pt-2.5 ${chan.dongTren || chan.conThieu?.length ? '' : 'sm:hidden'} ${taiCho ? 'chan-dinh-375' : ''}`} style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
            {chan.conThieu?.length ? <DongCanSua muc={chan.conThieu} /> : null}
            {chan.dongTren && <div className="flex min-h-6 items-center gap-2 text-[13px] text-slate-400">{chan.dongTren}</div>}
            {chan.chinh && <div className="sm:hidden [&>button]:min-h-[48px] [&>button]:w-full [&>button]:justify-center [&>button]:text-[15px] [&>button]:font-bold">{chan.chinh}</div>}
          </footer>
        )}
        {chan && !chan.v3 && (
          <footer className={`shrink-0 border-t ${taiCho ? 'chan-dinh-375' : ''}`} style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
            {chan.conThieu?.length ? <DongCanSua muc={chan.conThieu} /> : null}
            {chan.dongTren}
            {/* RA-UI-1 (mockup `v7/khai-bac-lo.html` #w375): 375 — dòng trạng thái / đếm lên đầu chân, mọi nút chia đều MỘT hàng (Huỷ | Lưu, Lưu không còn nhỏ lệch trái). */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 max-sm:[&>.btn]:flex-1 max-sm:[&>.btn]:justify-center">
              {huy && <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={huy.onClick} disabled={huy.disabled}>{huy.nhan ?? (chan.daSua ? t('Huỷ thay đổi') : t('Đóng'))}</button>}
              {chan.xoa && <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" onClick={chan.xoa.onClick}>{chan.xoa.nhan ?? t('Xoá')}</button>}
              {chan.trai ? <span className="flex min-w-0 flex-1 items-center gap-2 text-[13px] max-sm:order-first max-sm:basis-full">{chan.trai}</span> : <span className="flex-1 max-sm:hidden" />}
              {chan.phu}
              {chan.chinh}
            </div>
          </footer>
        )}
        </fieldset>
        {hoi && <HopBoChu viec={tieuDe} nut={hoi.nut} onO={() => setHoi(null)} onBo={boChu} />}
    </>
  );
  const voi = (x: ReactNode) => <TrongKhung.Provider value>{x}</TrongKhung.Provider>;
  if (taiCho) {
    /* OV-14c: Esc từ hộp nằm trong portal (hộp nhập điểm) nổi bọt qua cây React — chỉ đóng panel khi Esc phát ra TRONG khung panel. */
    return (
      /* 375 toàn màn (08 NEN-PANEL, `.dt-toan`): `-mx-4` bù đệm `p-4` của <main> — thẻ tràn sát hai mép, không bo góc. */
      <section ref={khung} tabIndex={-1} aria-label={tieuDe} onKeyDown={(e) => { if (e.key === 'Escape' && !e.defaultPrevented && khung.current?.contains(e.target as Node) && !khung.current.querySelector('[aria-modal="true"]')) dong(); }}
        className={trongCot ? 'flex min-w-0 flex-col -outline-offset-2' : `card flex flex-col -outline-offset-2 max-sm:-mx-4 max-sm:rounded-none max-sm:border-x-0 lg:max-h-[calc(100dvh-8rem)] ${chan ? 'max-sm:overflow-visible sm:overflow-hidden' : 'overflow-hidden'}`}>
        <KhungTrongCot.Provider value={false}><KhungTaiCho.Provider value={false}>{voi(than)}</KhungTaiCho.Provider></KhungTrongCot.Provider>
      </section>
    );
  }
  return createPortal(
    /* T21: `bottom` = phần bàn phím ảo che (`useBanPhim`) — panel co lên, chân lưu nằm ngay trên bàn phím. */
    <div className={`fixed inset-0 !mt-0 ${z} flex justify-end`} style={{ bottom: 'var(--ban-phim, 0px)' }} role="dialog" aria-modal="true" aria-label={tieuDe}>
      <div className="absolute inset-0 bg-black/60" onClick={dong} />
      <div ref={khung} tabIndex={-1} className={`relative flex h-full w-full flex-col rounded-none border-l shadow-2xl -outline-offset-2 ${rong === 'toan' ? 'max-w-[1440px]' : rong === 'rong' ? 'sm:w-[720px]' : 'sm:w-[480px]'}`}
        style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
        {voi(than)}
      </div>
    </div>,
    document.body,
  );
}

/** Một KHỐI trong thân panel: tiêu đề nhỏ (luật dài vào ⓘ), khối sau có vạch trên. */
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

/**
 * Một TRƯỜNG: nhãn ở TRÊN ô, `*` khi bắt buộc, chữ phụ ≤ 1 dòng, `loi` chỉ khi người gọi truyền (sau khi bấm Lưu / rời ô).
 * Có `loi` → ô viền đỏ + lý do dưới ô (YC-12.5.2; người gọi đặt `aria-invalid` lên ô). `dem` = bộ đếm ký tự `8/15` bên phải.
 */
export function Truong({ nhan, batBuoc, tuyChon, thieu, phu, loi, dem, as = 'label', children }: {
  /** OV-13f: ô bắt buộc mà trống vẫn lưu được (Email) — chữ "Thiếu" cam cạnh nhãn. */
  thieu?: boolean;
  nhan: string; batBuoc?: boolean; tuyChon?: boolean; phu?: string; loi?: string | null; dem?: { co: number; can: number };
  as?: 'label' | 'div'; children: ReactNode;
}) {
  /* Ô ngày / ô chọn người bên trong báo id → nhãn `<label htmlFor>`, không bọc nút lịch (`BaoOTrongNhan`). Thẻ khung chỉ theo props. */
  const [idO, setIdO] = useState<string | null>(null);
  const Vo = as === 'div' || coOTuNhan(children) ? 'div' : 'label';
  /* `as="div"` không có ô để nhãn trỏ vào (nhóm NutChon…) → nhóm mang tên của nhãn, trình đọc màn hình đọc "Mức độ, nhóm". */
  const idNhan = useId();
  const troO = Vo === 'div' ? idO : null;
  const nhom = Vo === 'div' && !idO ? { role: 'group', 'aria-labelledby': idNhan } : {};
  const chu = <>
    <span className="min-w-0 flex-1">
      {nhan}{batBuoc && <><span aria-hidden className="text-bad"> *</span><span className="sr-only"> {t('(bắt buộc)')}</span></>}
      {tuyChon && <span className="font-normal text-slate-500"> {t('(không bắt buộc)')}</span>}
      {thieu && <span className="ml-1.5 text-xs font-semibold text-late">{t('Thiếu')}</span>}
    </span>
    {dem && dem.co < dem.can && <span className="text-xs font-normal tabular-nums text-slate-500">{dem.co}/{dem.can}</span>}
  </>;
  const lopNhan = 'mb-1 flex items-baseline gap-2 text-[12px] font-medium text-slate-200';   // D10: nhãn trường 500 (luật chữ: nhãn 500)
  const noi = useNoiLoi(loi);
  return (
    <BaoOTrongNhan.Provider value={setIdO}>
      <Vo className="block min-w-0" {...nhom}>
        {troO ? <label htmlFor={troO} className={lopNhan}>{chu}</label> : <span id={idNhan} className={lopNhan}>{chu}</span>}
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
