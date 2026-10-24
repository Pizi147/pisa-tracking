import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BaoLuuContext } from '../../ui/SaveState.tsx';
import { Card } from '../../ui/ui.tsx';
import { LuoiFT, tenDotFt, type FtSheet, type HangMo, type SExTuan } from './LuoiFT.tsx';
import { DanExcel, boDanFt, boDanThuong } from './DanExcel.tsx';
import { LuoiThuong, type ThuongSheet } from './LuoiThuong.tsx';
import { MotKyNang } from './MotKyNang.tsx';
import { ENTRY_SKILLS, nhanBai, type TomTatLuot } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** Trả lời của `GET /classes/:classId/cham` (`chamSheet` ở server/src/cham/canCham.ts). */
export type Cham = {
  classId: number; classCode: string; branchName: string; canPlanWeek: boolean; today: string;
  mode: 'ielts_band' | 'ratio';
  ft: FtSheet | null;
  thuong: ThuongSheet | null;
};

/** Đường API của lưới một lớp: FT theo tuần (`periodId`), lớp thường cả lớp (lọc bài ở web). */
export function duongCham(classId: number, o: { periodId?: number | null; kind?: string | null } = {}): string {
  const q = new URLSearchParams();
  if (o.periodId) q.set('periodId', String(o.periodId));
  if (o.kind) q.set('kind', o.kind);
  const s = q.toString();
  return `/classes/${classId}/cham${s ? `?${s}` : ''}`;
}

/** PR-DL — điểm theo lượt cả lớp: danh sách lượt (`luot` vắng) hoặc bảng một lượt (`mt:2`, `thuong:final`). */
export const duongDiemTheoLuot = (classId: number, luot?: string | null) =>
  `/classes/${classId}/diem-theo-luot${luot ? `/${encodeURIComponent(luot)}` : ''}`;
/** Trả lời của `GET /classes/:classId/diem-theo-luot` (`danhSachLuot` ở server/src/cham/diemTheoLuot.ts). */
export type DanhSachLuot = { classId: number; mode: 'ielts_band' | 'ratio'; luot: TomTatLuot[]; macDinh: string | null };
/** Trả lời của `GET /classes/:classId/diem-theo-luot/:luot` (`bangTheoLuot`): chính `Cham` + lượt + em chưa có lịch lượt đó. */
export type BangTheoLuot = Cham & {
  luot: TomTatLuot; chuaCoLich: { studentId: number; fullName: string; studentCode: string }[];
};

/**
 * MÀN HẸP (Q16): < 768px — cùng ngưỡng `md` của Tailwind, cho cả lớp FT và lớp thường. Theo dõi `change` của
 * `matchMedia` nên xoay ngang điện thoại hay kéo hẹp cửa sổ là đổi chế độ ngay.
 */
const MAN_HEP = '(max-width: 767px)';
export function useManHinhHep() {
  const [hep, setHep] = useState(() => typeof window !== 'undefined' && window.matchMedia(MAN_HEP).matches);
  useEffect(() => {
    const m = window.matchMedia(MAN_HEP);
    const doi = () => setHep(m.matches);
    doi();
    m.addEventListener('change', doi);
    return () => m.removeEventListener('change', doi);
  }, []);
  return hep;
}

/** Lưới lớp thường của MỘT bài (mockup 10b §2) — cột tổng và tuần thi chỉ có nghĩa trong một bài. */
export function thuongTheoBai(t: ThuongSheet | null | undefined, kind: string | null): ThuongSheet | null {
  return t ? { ...t, rows: t.rows.filter((r) => !kind || r.kind === kind) } : null;
}

/**
 * LƯỚI CHẤM CỦA MỘT LỚP — phần dùng chung của Lịch Test tuần (PR-UX1; UI-LICH-TUAN: là lưới đầy đủ, `/nhap-diem/*` chuyển về đây — lưới mở
 * tại chỗ dưới hàng lớp / dòng Nợ). Chọn lưới theo `mode` máy chủ trả; màn hẹp (< 768px) chuyển sang MỘT KỸ NĂNG MỘT
 * LÚC (`MotKyNang`), nút chữ nhỏ "Xem dạng bảng" mở lại lưới (cuộn ngang TRONG THẺ, G-11).
 *
 * Con trỏ (Q12): `kn` → ô trống đầu tiên của cột đó; `hv` → dòng của em đó; không có cả hai → ô trống đầu tiên mình
 * sửa được. Lịch Test tắt việc này (`datConTro = false`) cho lớp tự mở, để trang không nhảy tới lưới tải sau cùng.
 *
 * Lịch Test thêm: `gon` (bỏ cột Trạng thái/Hạn của FT — hàng lớp đã nói), `tuanDangXem` (ô chưa có điểm thi tuần khác
 * → chữ mờ `W4 SEP`), `chiAttempt` (khối Nợ: chỉ các em còn nợ). Luật chấm không đổi.
 */
export function LuoiChamLop({
  data, kind, kn = null, hv = null, onReload, gon = false, tuanDangXem = null, chiAttempt = null, datConTro = true, thanhTren,
  onSoOChuaLuu, hangMo, anNutTao, chiCot = null, nutCaLop = true, sEx,
}: {
  data: Cham; kind: string | null; kn?: string | null; hv?: number | null; onReload: () => void;
  gon?: boolean; tuanDangXem?: string | null; chiAttempt?: ReadonlySet<number> | null; datConTro?: boolean;
  /** Chữ nhỏ ở hàng trên lưới, cùng hàng với nút "Xem dạng bảng" (Lịch Test: "Mở lưới đầy đủ ›"). */
  thanhTren?: ReactNode;
  /** Tổng số ô lưu hỏng của cả lưới (mọi dòng) — đầu trang / hàng lớp nói "n ô chưa lưu" cho tới khi hết. */
  onSoOChuaLuu?: (n: number) => void;
  /** PR-DL: hàng mờ cuối bảng FT — em chưa có lịch lượt đang xem. */
  hangMo?: HangMo[];
  /** PR-DL: ẩn nút "Tạo bài kiểm tra theo chương trình" của lưới lớp thường (Điểm theo lớp). */
  anNutTao?: boolean;
  /** OV-15b (mục 1, mockup 2 khung 1a): mở từ việc — chỉ cột kỹ năng của việc + Kết quả; nút "Cả lớp" mở đủ cột. */
  chiCot?: readonly string[] | null;
  /** Nơi gọi có bộ chọn môn riêng (panel Nhập điểm lớp) — không vẽ nút "Cả lớp". */
  nutCaLop?: boolean;
  /** UI-LICH-TUAN: lượt S Ex của tuần (Lịch tuần) — cột S Ex của lưới FT. */
  sEx?: SExTuan;
}) {
  const hep = useManHinhHep();
  /* Mỗi dòng báo số ô lỗi của nó (`useBaoLuu`); cộng lại rồi báo lên trên. */
  const [loiTheoDong, setLoiTheoDong] = useState<Record<string, number>>({});
  const bao = useCallback((khoa: string, n: number) => setLoiTheoDong((x) => {
    if ((x[khoa] ?? 0) === n) return x;
    const moi = { ...x };
    if (n) moi[khoa] = n; else delete moi[khoa];
    return moi;
  }), []);
  const soOChuaLuu = Object.values(loiTheoDong).reduce((a, b) => a + b, 0);
  useEffect(() => { onSoOChuaLuu?.(soOChuaLuu); }, [soOChuaLuu, onSoOChuaLuu]);
  const [xemBang, setXemBang] = useState(false);
  const [caLop, setCaLop] = useState(false);
  const cotHien = chiCot?.length && !caLop ? chiCot : null;
  const laFt = data.mode === 'ielts_band';
  /*
   * OV-15b (mục 2, mockup 2 khung 1d): Dán từ Excel — người xem sửa được ít nhất một ô; cột dán = cột đang mở.
   * OV-15h2 (ý 10): lớp thường cùng khối — cột theo môn của lớp, máy chủ ràng vào lớp + bài (`thuong:<bài>`).
   */
  const [dan, setDan] = useState<null | { hoi: boolean }>(null);
  const luotMo = 'luot' in data ? (data as BangTheoLuot).luot : null;
  const coDan = (laFt ? !!data.ft?.rows.some((r) => r.cells.some((c) => c.canEdit))
    : !!data.thuong?.rows.some((r) => (kind === null || r.kind === kind) && r.skillSchedule.some((s) => s.canEdit)));
  const tenLuot = luotMo ? luotMo.nhan : laFt ? data.ft?.period?.code ?? tenDotFt(data.ft) : kind ? nhanBai(kind) : t('Lớp thường');

  /* "Cả lớp" (chỉ có khi mở từ việc) mở cả mọi em của lượt, không chỉ em của việc. */
  const locLuot = caLop ? null : chiAttempt;
  const ft = useMemo<FtSheet | null>(
    () => (data.ft && locLuot ? { ...data.ft, rows: data.ft.rows.filter((r) => locLuot.has(r.attemptId)) } : data.ft),
    [data.ft, locLuot],
  );
  const thuong = useMemo<ThuongSheet | null>(() => {
    const t = thuongTheoBai(data.thuong, kind);
    const loc = t && locLuot ? { ...t, rows: t.rows.filter((r) => locLuot.has(r.attemptId)) } : t;
    /* Cột của việc: lưới lớp thường vẽ cột theo `programme.skills` — bớt môn ở đó (kết quả vẫn của máy chủ). */
    return loc && cotHien ? { ...loc, programme: { ...loc.programme, skills: loc.programme.skills.filter((k) => cotHien.includes(k)) } } : loc;
  }, [data.thuong, kind, locLuot, cotHien]);

  /* Cuộn tới ô cần chấm MỘT LẦN cho mỗi ngữ cảnh mở lưới. `data-trong` chỉ gắn cho ô còn trống VÀ mình được sửa. */
  const khung = useRef<HTMLDivElement>(null);
  const daCuon = useRef<string | null>(null);
  const khoaCuon = `${data.classId}|${data.ft?.period?.id ?? ''}|${kind}|${kn}|${hv}`;
  useEffect(() => {
    if (!datConTro || daCuon.current === khoaCuon) return;
    const id = requestAnimationFrame(() => {
      const root = khung.current;
      if (!root) return;
      /* Không gắn tên thẻ: cùng bộ chọn cho lưới (tr/td) và màn điện thoại (li/div). */
      const hang = hv !== null ? `[data-hv="${hv}"] ` : '';
      const tim = (chon: string) => root.querySelector<HTMLElement>(chon);
      const o = kn
        ? tim(`${hang}[data-kn="${kn}"][data-trong]`)
          ?? (kn === 'writing' ? tim(`${hang}[data-kn^="writing"][data-trong]`) : null)
          ?? (hang ? tim(`[data-kn="${kn}"][data-trong]`) : null)
        : hv !== null ? tim(`[data-hv="${hv}"]`) : tim('[data-trong]');
      if (!o) return;
      /* OV-14b: chỉ đánh dấu khi đã thấy ô — lưới trong panel vẽ ô sau lần chạy đầu, đánh dấu sớm thì không bao giờ đặt con trỏ. */
      daCuon.current = khoaCuon;
      o.scrollIntoView({ block: 'center', inline: 'nearest' });
      /* OV-14b: ô điểm trước nút "Nhận xét" cùng ô (bộ chọn gộp lấy phần tử đứng trước trong trang). */
      const f = o.querySelector<HTMLElement>('input:not([readonly]):not([disabled])') ?? o.querySelector<HTMLElement>('button:not([disabled]), input');
      f?.focus();
      if (f instanceof HTMLInputElement) f.select();
    });
    return () => cancelAnimationFrame(id);
  }, [data, thuong, kn, hv, khoaCuon, datConTro]);

  /* UI-LICH-TUAN (mockup 375 khu a): lưới FT ở Lịch tuần (có `sEx`) trên điện thoại = thẻ từng em, không "một kỹ năng một lúc". */
  const theHv = hep && laFt && sEx !== undefined && !xemBang;
  const tungKyNang = hep && !xemBang && !theHv;
  const luoi = (
    <>
      {tungKyNang && laFt && ft && <MotKyNang mode="ielts_band" data={ft} onReload={onReload} kn={kn} hv={hv} hangMo={hangMo} tuanDangXem={tuanDangXem} />}
      {tungKyNang && !laFt && thuong && <MotKyNang mode="ratio" data={thuong} onReload={onReload} kn={kn} hv={hv} anNutTao={anNutTao} tuanDangXem={tuanDangXem} />}
      {!tungKyNang && laFt && ft && <LuoiFT data={ft} onReload={onReload} kn={kn} hv={hv} gon={gon} tuanDangXem={tuanDangXem} hangMo={hangMo} chiCot={cotHien} sEx={sEx} the={theHv} />}
      {!tungKyNang && !laFt && thuong && <LuoiThuong data={thuong} onReload={onReload} kn={kn} hv={hv} tuanDangXem={tuanDangXem} anNutTao={anNutTao} />}
    </>
  );

  const bo = useMemo(() => (!dan ? null
    : laFt ? data.ft && boDanFt(data.ft, (cotHien ?? ENTRY_SKILLS).filter((k) => (ENTRY_SKILLS as readonly string[]).includes(k)), data.today)
      : thuong && boDanThuong(thuong, thuong.programme.skills, data.today)), [dan, laFt, data.ft, data.today, cotHien, thuong]);
  const khoiDan = dan && bo && (
    <DanExcel bo={bo} tenLuot={tenLuot} luot={luotMo ? luotMo.ma : !laFt && kind ? `thuong:${kind}` : null} hep={hep} hoiBanDau={dan.hoi}
      onDong={() => setDan(null)} onDaLuu={onReload} />
  );
  const luoiKhung = gon ? luoi : <Card bodyClass="p-0" className="xl:overflow-clip">{luoi}</Card>;

  return (
    <BaoLuuContext.Provider value={bao}>
    <div ref={khung}>
      {(hep || thanhTren || coDan || (nutCaLop && !!chiCot?.length)) && !(hep && dan) && (
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          {thanhTren}
          {coDan && (
            <span className="inline-flex items-center gap-1.5">
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-expanded={!!dan} onClick={() => setDan(dan ? null : { hoi: false })}>
                {t('Dán từ Excel')}
              </button>
              <button type="button" className="btn btn-sm min-h-[44px] min-w-[44px] justify-center sm:min-h-0" aria-label={t('Cách dán từ Excel')}
                onClick={() => setDan({ hoi: true })}>?</button>
            </span>
          )}
          {nutCaLop && !!chiCot?.length && !tungKyNang && (
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-pressed={caLop} onClick={() => setCaLop((v) => !v)}>
              {t('Cả lớp')}
            </button>
          )}
          {hep && (
            <button type="button" className="min-h-[44px] px-1 text-xs text-slate-500 hover:text-slate-200"
              onClick={() => setXemBang((v) => !v)}
              title={xemBang ? t('Quay lại chấm từng kỹ năng, mỗi em một ô to') : t('Mở lưới đủ các cột; lưới cuộn ngang trong thẻ')}>
              {xemBang ? t('Chấm từng kỹ năng') : t('Xem dạng bảng')}
            </button>
          )}
        </div>
      )}
      {!dan ? luoiKhung : hep ? khoiDan : (
        /* 1440: lưới trái, khối dán phải (mockup 1d); dưới xl xếp chồng, khối dán trước. */
        <div className="mt-2 flex flex-col gap-3 xl:flex-row-reverse xl:items-start">
          <div className="xl:w-[56rem] xl:shrink-0">{khoiDan}</div>
          <div className="min-w-0 flex-1 overflow-x-auto">{luoiKhung}</div>
        </div>
      )}
    </div>
    </BaoLuuContext.Provider>
  );
}
