import { useMemo, useState } from 'react';
import { cuoiTuan, dsNgayGan, dsThang, dsTuan, ngay, type LuaChon } from '@shared/domain/index.ts';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';

/**
 * BỘ CHỌN NGÀY / TUẦN / THÁNG (PR-UX3, G-6): `<select className="field">` liệt kê từ `chonNgay.ts`, không ô lịch của trình
 * duyệt (nó hiện `mm/dd/yyyy` theo máy). Nhãn luôn theo ngày nghiệp vụ; `value` luôn là ISO — thứ máy chủ đọc.
 * Giá trị đang có nhưng nằm ngoài danh sách (dữ liệu cũ) vẫn hiện, để select không nhảy về mục đầu.
 */

function Chon({ ds, value, onChange, disabled, ariaLabel, chuaChon }: {
  ds: LuaChon[]; value: string; onChange: (v: string) => void; disabled?: boolean; ariaLabel?: string; chuaChon?: string;
}) {
  const { homNay } = useNgayNghiepVu();
  const coTrongDs = ds.some((x) => x.giaTri === value);
  return (
    <select className="field w-full" value={value} disabled={disabled} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)}>
      {chuaChon && <option value="">{chuaChon}</option>}
      {value && !coTrongDs && <option value={value}>{/^\d{4}-\d{2}-\d{2}$/.test(value) ? ngay(value, homNay) : value}</option>}
      {ds.map((x) => <option key={x.giaTri} value={x.giaTri}>{x.phu ? `${x.nhan} · ${x.phu}` : x.nhan}</option>)}
    </select>
  );
}

const KHAC = '__khac__';
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** "12/09" hoặc "12/09/2025" → ISO; năm bỏ trống = năm của hôm nay. Ngày không có thật → `null`. */
function docNgayGo(text: string, homNay: string): string | null {
  const m = /^\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\s*$/.exec(text);
  if (!m) return null;
  const iso = `${m[3] ?? homNay.slice(0, 4)}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso ? null : iso;
}

/**
 * Ngày: gợi ý nhanh trong `soNgay` ngày gần nhất ("Hôm nay, 14/09" · "Hôm qua, 13/09" · "Thứ Bảy, 12/09") + mục "Ngày khác…" để gõ BẤT KỲ
 * ngày nào không quá hôm nay (`dd/mm` hoặc `dd/mm/yyyy`) — ngày trong lộ trình có thể cách xa hơn danh sách gợi ý. Không ô lịch trình duyệt.
 */
export function ChonNgayGan({ value, onChange, soNgay = 14, disabled, ariaLabel, chuaChon }: {
  value: string; onChange: (v: string) => void; soNgay?: number; disabled?: boolean; ariaLabel?: string; chuaChon?: string;
}) {
  const { homNay } = useNgayNghiepVu();
  const ds = useMemo(() => dsNgayGan(homNay, soNgay), [homNay, soNgay]);
  /* Đã có ngày ngoài danh sách gợi ý (dữ liệu cũ hoặc vừa gõ) thì mở sẵn ô gõ. */
  const ngoaiDs = !!value && ISO.test(value) && !ds.some((x) => x.giaTri === value);
  const [go, setGo] = useState(ngoaiDs);
  const [text, setText] = useState(ngoaiDs ? ngay(value, homNay) : '');
  const iso = go && text.trim() ? docNgayGo(text, homNay) : null;
  const loi = go && text.trim() && (iso === null ? 'Gõ dạng dd/mm hoặc dd/mm/yyyy' : iso > homNay ? 'Không được sau hôm nay' : null);
  const dsKhac: LuaChon[] = [...ds, { giaTri: KHAC, nhan: 'Ngày khác…' }];
  return (
    <span className="block">
      <select className="field w-full" value={go ? KHAC : value} disabled={disabled} aria-label={ariaLabel}
        onChange={(e) => {
          if (e.target.value === KHAC) { setGo(true); return; }
          setGo(false); setText(''); onChange(e.target.value);
        }}>
        {chuaChon && <option value="">{chuaChon}</option>}
        {dsKhac.map((x) => <option key={x.giaTri} value={x.giaTri}>{x.nhan}</option>)}
      </select>
      {go && (
        <>
          <input className="field mt-1.5 w-full" inputMode="numeric" value={text} disabled={disabled} placeholder="Ví dụ: 12/09 hoặc 12/09/2025"
            aria-label={ariaLabel ? `${ariaLabel} (gõ ngày)` : 'Gõ ngày'}
            onChange={(e) => {
              setText(e.target.value);
              const v = docNgayGo(e.target.value, homNay);
              if (v && v <= homNay) onChange(v);
            }} />
          {loi && <span className="mt-1 block text-[11px] text-late">{loi}</span>}
        </>
      )}
    </span>
  );
}

/**
 * Tuần lịch "W4 SEP · 24/08 – 30/08". `moc="dau"` (mặc định): giá trị là thứ Hai. `moc="cuoi"`: giá trị là Chủ nhật của tuần đó,
 * cắt về hôm nay khi là tuần hiện tại (máy chủ chặn ngày tương lai) — dùng cho ô "Đến".
 */
export function ChonTuan({ value, onChange, lui = 8, toi = 0, moc = 'dau', catHomNay = true, disabled, ariaLabel, chuaChon }: {
  value: string; onChange: (v: string) => void; lui?: number; toi?: number; moc?: 'dau' | 'cuoi';
  /** `moc="cuoi"`: cắt Chủ nhật về hôm nay cho tuần hiện tại (mặc định, cho việc ĐÃ xảy ra). `false` cho hạn tương lai. */
  catHomNay?: boolean;
  disabled?: boolean; ariaLabel?: string; chuaChon?: string;
}) {
  const { homNay } = useNgayNghiepVu();
  const ds = useMemo(() => {
    const t = dsTuan(homNay, lui, toi);
    return moc === 'dau' ? t : t.map((x) => ({ ...x, giaTri: cuoiTuan(x.giaTri, catHomNay ? homNay : undefined) }));
  }, [homNay, lui, toi, moc, catHomNay]);
  return <Chon ds={ds} value={value} onChange={onChange} disabled={disabled} ariaLabel={ariaLabel} chuaChon={chuaChon} />;
}

/** Tháng "11/2026", `soThang` tháng từ tháng này. Giá trị `2026-11`. */
export function ChonThang({ value, onChange, soThang = 18, disabled, ariaLabel, chuaChon }: {
  value: string; onChange: (v: string) => void; soThang?: number; disabled?: boolean; ariaLabel?: string; chuaChon?: string;
}) {
  const { homNay } = useNgayNghiepVu();
  const ds = useMemo(() => dsThang(homNay, soThang), [homNay, soThang]);
  return <Chon ds={ds} value={value} onChange={onChange} disabled={disabled} ariaLabel={ariaLabel} chuaChon={chuaChon} />;
}

/**
 * Một dòng chữ "{tien} hôm nay, 14/09 · Đổi" — bấm Đổi mới hiện ô chọn. Cho ngày mà hầu như luôn là mặc định
 * (ngày ghi kết quả, ngày bắt đầu theo dõi), để không chiếm một ô nhập.
 */
export function NgayDoiDuoc({ tien, value, onChange, soNgay = 14, khiMo }: {
  tien: string; value: string; onChange: (v: string) => void; soNgay?: number; khiMo?: boolean;
}) {
  const { homNay } = useNgayNghiepVu();
  const [mo, setMo] = useState(!!khiMo);
  const ds = useMemo(() => dsNgayGan(homNay, soNgay), [homNay, soNgay]);
  if (mo) {
    return (
      <label className="block">
        <span className="mb-1 block text-[11.5px] font-bold text-slate-200">{tien}</span>
        <ChonNgayGan value={value} onChange={onChange} soNgay={soNgay} ariaLabel={tien} />
      </label>
    );
  }
  const nhan = ds.find((x) => x.giaTri === value)?.nhan ?? value;
  return (
    <p className="m-0 text-xs text-slate-400">
      {tien}: <span className="text-slate-200">{nhan.charAt(0).toLowerCase() + nhan.slice(1)}</span>
      {' · '}<button type="button" className="link appearance-none border-0 bg-transparent p-0" onClick={() => setMo(true)}>Đổi</button>
    </p>
  );
}
