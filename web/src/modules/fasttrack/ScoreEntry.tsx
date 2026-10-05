import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Info, SectionNote, Status } from '../../ui/ui.tsx';
import { useBaoHopLyDoMo, useTrangThaiLuuO } from '../../ui/SaveState.tsx';
import { Han } from '../../ui/Han.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { fmtBand, skillLabel } from '../../lib/format.ts';
import { useSession } from '../../lib/session.tsx';
import { DongGvCham, cungGvCham, gvChamPayload, gvChamThanhChon } from '../cham/GvCham.tsx';
import {
  BAI_CO_NHAN_XET, NHAN_XET_TOI_DA, NO_SHOW_HINT, demNguocSuaDau, kiemLyDo, oLuoiThuong, tieuChiCua, tieuChiNganCua, tuanLich,
  type EntrySkill, type NguoiChon,
} from '@shared/domain/index.ts';

export type Cell = {
  skill: EntrySkill;
  assessedSkill: string;
  /** false khi Quản lý đã chốt trước là đợt này không yêu cầu kỹ năng đó. */
  required: boolean;
  rawScore: number | null;
  criteria: (number | null)[];
  band: number | null;
  resultDate: string | null;
  enteredByName: string | null;
  enteredAt: string | null;
  /** Hạn chấm CỦA CHÍNH MÔN NÀY, tính từ tuần thi của nó — không phải hạn của cả đợt. */
  deadline: string | null;
  deadlineSource: 'skill_override' | 'attempt_override' | 'default' | 'none';
  overdue: boolean;
  progress: string;
  canEdit: boolean;
  /** R11: đợt đã hoàn tất (hết Chủ nhật của tuần bắt buộc muộn nhất) — khoá với người không có `PLAN_WEEK`/`SCORE_OVERRIDE`. */
  khoa?: boolean;
  /** Tuần thi riêng của môn này. W1 và W2 dùng chung lịch của môn Writing. */
  periodId?: number | null;
  periodCode?: string | null;
  weekStart?: string | null;
  weekRange?: string | null;
  sitStatus?: string;
  /**
   * DẤU '-' "KHÔNG CÓ BÀI" (rule book §17.1). `null` = không có dấu nào còn hiệu lực. `text` là câu đã dựng sẵn
   * ở máy chủ: "Không có bài · Có thể sửa đến hết Chủ nhật 20/09", "Không dự thi · Tuần W3 SEP 2026", …
   */
  noShow?: {
    state: 'khong-co-bai' | 'khong-du-thi' | 'cho-ql-hieu-chinh';
    text: string; effectiveOn: string | null; editableUntil: string | null;
  } | null;
  /** PR-HSM (YC-13.5): nhận xét của bài nhập (W1/W2/S). */
  nhanXet?: string | null;
  /** PR-HSM (T39): GV chấm Speaking — tài khoản (`userId`) hoặc người ngoài (`userId: null`). */
  gvCham?: { userId: number | null; ten: string } | null;
};

export type SavePatch = {
  rawScore?: number | null;
  criteria?: (number | null)[]; resultDate?: string | null;
  /** `true` = báo "-" (không có bài), `false` = gỡ dấu. Không phải điểm 0. */
  noShow?: boolean;
  /** RB-5 — lý do khi sửa một ô ĐÃ CÓ điểm chính thức (máy chủ đòi khi giá trị đổi hoặc bị xoá). */
  lyDo?: string;
  /** PR-HSM: nhận xét W1/W2/S (`null` = xoá) — không phải điểm: không lý do, không đổi "Nhập bởi". */
  nhanXet?: string | null;
  /** PR-HSM: GV chấm Speaking, dạng `nguoiThanhPayload` (`null` = xoá). */
  gvCham?: ReturnType<typeof gvChamPayload>;
};

/** Tuỳ chọn của một lần lưu. `nem` = ném lỗi ra cho nơi gọi (hộp lý do hiện câu lỗi ngay tại ô) thay vì chỉ toast. */
export type SaveOpts = { nem?: boolean };

/** Ô đã có điểm chính thức — sửa nó là hiệu chỉnh, phải qua `SuaDiemCoLyDo`. */
export const coDiemChinhThuc = (cell: Cell) => cell.band !== null || cell.rawScore !== null;

/** Ô đã chốt "không dự thi" hoặc đang chờ Quản lý: người nhập điểm không sửa được nữa (phải qua Quản lý). */
export const lockedByNoShow = (cell: Cell) =>
  cell.noShow?.state === 'khong-du-thi' || cell.noShow?.state === 'cho-ql-hieu-chinh';

/** R11 — ô của một đợt đã hoàn tất mà người xem không sửa được: thay cho câu "không được phân công". */
export const KHOA_HOAN_TAT_HINT = 'Đợt này đã hoàn tất. Chỉ Quản lý sửa được điểm — nhờ Quản lý hiệu chỉnh, kèm lý do.';
/** E8 (T53 Q6): bài đã xác nhận vắng không nhập điểm ở lưới — nhập bù thì Quản lý xếp lại bài trước. */
export const VANG_HINT = 'Đã xác nhận vắng — Quản lý xếp lại bài trước khi nhập.';

/** Vì sao ô này chỉ đọc — MỘT câu cho ô số câu và ô tiêu chí. */
const lyDoChiDoc = (cell: Cell) => (cell.sitStatus === 'absent' ? VANG_HINT
  : lockedByNoShow(cell) ? 'Đã chốt — cần Quản lý hiệu chỉnh'
  : cell.khoa ? KHOA_HOAN_TAT_HINT : 'Bạn không được phân công kỹ năng này');

/**
 * Chữ người dùng gõ ở ô SỐ CÂU ĐÚNG → lệnh gửi máy chủ. '-' LÀ MỘT LỆNH, KHÔNG PHẢI MỘT SỐ (rule book §17.1): "học
 * viên có lịch mà không làm bài". Ô trống vẫn chỉ là chưa nhập; xoá ô đang có dấu '-' là gỡ dấu, không phải chấm điểm.
 * MỘT hàm cho mọi nơi nhập (bảng cả lớp, hồ sơ Test) — không có luật thứ hai.
 *
 * `null` = chữ không hợp lệ ("--", "abc", "7.5"…): KHÔNG gửi gì. Trước đây `Number("--")` ra NaN, lên máy chủ thành
 * `null` — tức là xoá ô mà không ai định xoá.
 */
export const LOI_SO_CAU = 'Số câu đúng là số nguyên, hoặc "-" nếu học viên không làm bài.';
export function rawPatchFrom(text: string, cell: Cell): SavePatch | null {
  const t = text.trim();
  if (t !== '' && t !== '-' && !/^\d+$/.test(t)) return null;
  return t === '-' ? { noShow: true }
    : t === '' && cell.noShow ? { noShow: false }
    : { rawScore: t === '' ? null : Number(t) };
}

/**
 * Bốn ô tiêu chí → lệnh gửi máy chủ + band xem trước. MỘT DẤU '-' TRONG BỐN Ô LÀ ĐỦ báo chưa có bài cho ĐÚNG BÀI NÀY:
 * không ghi các tiêu chí thành 0, không xoá bài khác. Xoá sạch bốn ô của bài đang có dấu '-' là GỠ dấu; xoá bốn ô
 * của bài có điểm là xoá điểm như cũ.
 *
 * `patch: null` = có ô không hợp lệ (không phải số, không phải đúng một "-", ví dụ "--"): KHÔNG gửi gì — trước đây ô
 * đó thành NaN rồi thành `null` trên máy chủ, tức là xoá tiêu chí mà không ai định xoá.
 */
export const LOI_TIEU_CHI = 'Mỗi tiêu chí là một số, hoặc "-" nếu học viên không làm bài.';
export function criteriaPatchFrom(vals: string[], cell: Cell): { dash: boolean; preview: number | null; patch: SavePatch | null } {
  const hong = vals.some((v) => { const t = v.trim(); return t !== '' && t !== '-' && !Number.isFinite(Number(t)); });
  if (hong) return { dash: false, preview: null, patch: null };
  const dash = vals.some((v) => v.trim() === '-');
  const nums = vals.map((v) => (v.trim() === '' || v.trim() === '-' ? null : Number(v)));
  const filled = nums.filter((v) => v !== null) as number[];
  const preview = !dash && filled.length === 4 ? Math.round((filled.reduce((a, b) => a + b, 0) / 4) * 2 + 1e-9) / 2 : null;
  const allEmpty = vals.every((v) => v.trim() === '');
  const patch: SavePatch = dash ? { noShow: true }
    : allEmpty && cell.noShow ? { noShow: false }
    : { criteria: nums };
  return { dash, preview, patch };
}

/**
 * Lưu điểm một kỹ năng. Khi lỗi, giữ nguyên giá trị người dùng vừa gõ để họ bấm lại,
 * không âm thầm quay về giá trị cũ.
 */
export function useSaveScore(attemptId: number, onSaved?: () => void) {
  const toast = useToast();
  const [saving, setSaving] = useState<string | null>(null);
  /*
   * TRẠNG THÁI LƯU THEO TỪNG Ô (PR-UX1, lỗi thật bản chính 24/09): trước đây dòng chỉ nhớ lần lưu CUỐI — ô L hỏng rồi
   * ô R lưu được thì dòng hiện "Đã lưu". Nay mỗi ô một trạng thái (`o`, `loi`); dòng chỉ "đã lưu" khi không còn ô lỗi,
   * còn thì "n ô chưa lưu" + Lưu lại. Lỗi nói rõ ở ô nào, không một lỗi chung cho cả bảng.
   */
  const tt = useTrangThaiLuuO<SavePatch>(`ft:${attemptId}`);
  const inflight = useRef(new Set<string>());

  const save = async (skill: string, patch: SavePatch, opts: SaveOpts = {}): Promise<boolean> => {
    if (inflight.current.has(skill)) return false;   // chặn gửi lặp cùng một ô
    inflight.current.add(skill);
    setSaving(skill);
    tt.batDau(skill);
    try {
      await api.put(`/attempts/${attemptId}/scores/${skill}`, patch);
      invalidate('/attempts');
      invalidate('/tong-quan');
      invalidate('/classes');
      invalidate('/diem-theo-lop');   // PR-DL: số ô trống ở Test › Điểm theo lớp
      invalidate('/students');
      invalidate('/my-work');   // PR-S6F-a: badge quá hạn của GV tải lại sau khi nhập điểm
      tt.thanhCong(skill);
      onSaved?.();
      return true;
    } catch (e: any) {
      /*
       * Hộp lý do đang mở thì câu lỗi hiện ngay trong hộp — không toast, không bật "Lưu lại" ở ô (người dùng sửa ngay
       * trong hộp; Huỷ là bỏ, không còn gì để thử lại).
       */
      if (opts.nem) { tt.bo(skill); throw e; }
      /*
       * Máy chủ TỪ CHỐI lệnh "-" (sai luật lịch, quá hạn sửa dấu…): gửi lại y nguyên không bao giờ thành — báo đúng câu
       * của máy chủ, ô giữ nguyên, không có "Lưu lại". Lỗi mạng / 5xx vẫn có "Lưu lại".
       */
      if (patch.noShow !== undefined && laTuChoi(e)) {
        tt.bo(skill);
        toast.push('error', `${skillLabel(skill)}: ${e.message}`);
        return false;
      }
      tt.hongO(skill, patch, e.message);
      toast.push('error', `${skillLabel(skill)}: ${e.message}`);
      return false;
    } finally {
      inflight.current.delete(skill);
      setSaving(null);
    }
  };

  /** Gửi lại đúng lệnh đã hỏng của một ô / của mọi ô lỗi trên dòng. */
  const luuLai = (skill: string) => { const p = tt.hong.current.get(skill); if (p) void save(skill, p); };
  const retry = () => { for (const k of [...tt.hong.current.keys()]) luuLai(k); };

  return {
    save, saving, status: tt.status, lastError: tt.lastError, retry, o: tt.o, loi: tt.loi, luuLai, soLoi: tt.soLoi,
    loiNhap: tt.loiNhap, coGuiLai: tt.coGuiLai,
  };
}

/**
 * DÒNG NHỎ DƯỚI Ô FT ĐANG MANG DẤU "-" (DS02, Q17). Còn trong cửa sổ sửa thì đếm ngược bằng chữ xám — không tô đỏ;
 * câu đầy đủ của máy chủ ("Không có bài · Có thể sửa đến hết Chủ nhật 20/09") nằm ở tooltip và ở cột Hạn nhập, nên
 * ô chỉ giữ MỘT dòng phụ (G-3). Đã chốt "Không dự thi" thì không còn gì để đếm: hiện đúng câu đã chốt.
 */
function DongDau({ cell }: { cell: Cell }) {
  const { homNay } = useNgayNghiepVu();
  if (!cell.noShow) return null;
  const dem = cell.noShow.state === 'khong-co-bai' ? demNguocSuaDau(cell.noShow.editableUntil ?? null, homNay) : null;
  return (
    <span className="block max-w-[6rem] truncate text-xs text-slate-400 leading-tight" title={cell.noShow.text}>
      {dem ?? cell.noShow.text}
    </span>
  );
}

/**
 * NÚT "VẮNG" CỦA MÀN ĐIỆN THOẠI (`lon`, C2). Bàn phím số của iPhone (`inputMode="numeric"`/`"decimal"`) không có phím "-",
 * nên trên điện thoại lệnh "-" phải có một nút: bấm nút = gõ "-", đúng cùng một đường lưu — ghi ngay, toast có Hoàn tác
 * (Q11). Nút có chữ (dấu "−" trơ trọi không ai hiểu). `an` = ô này không nhận "-" lúc này (đã có điểm, đã mang dấu…) —
 * nút vẫn giữ chỗ cho các dòng thẳng cột, chỉ ẩn đi. `onMouseDown` chặn để ô số không mất con trỏ (không kích hoạt
 * lưu-khi-rời-ô). Máy tính không dùng nút này.
 */
function NutDau({ title, an, tat, onBam }: { title: string; an: boolean; tat: boolean; onBam: () => void }) {
  return (
    <button type="button" tabIndex={-1}
      className={`btn btn-ghost shrink-0 h-11 w-14 min-w-[44px] justify-center px-0 text-sm text-slate-300 ${an ? 'invisible' : ''}`}
      title={title} aria-label={`Vắng — ${title}`} aria-hidden={an || undefined} disabled={an || tat}
      onMouseDown={(e) => e.preventDefault()} onClick={onBam}>
      Vắng
    </button>
  );
}
const NUT_DAU_FT = 'Không có bài — em có lịch mà không làm bài';

/** Chỗ trống đúng bằng nút "Vắng" — dòng chỉ đọc / dòng chữ trạng thái của màn điện thoại vẫn thẳng cột với dòng có nút. */
export function ChoNutDau() {
  return <span aria-hidden className="inline-block shrink-0 w-14 h-11" />;
}

/**
 * C9 — CÂU LỖI NHẬP NGAY DƯỚI Ô (không chỉ ở tooltip): một dòng, chữ đầy đủ vẫn nằm trong DOM cho trình đọc màn hình
 * (`role="alert"`, ô trỏ tới bằng `aria-describedby`). Báo QL dòng (`onLoiNhap`) để dòng đếm "n ô chưa lưu".
 */
function DongLoiNhap({ id, cau }: { id: string; cau: string | null }) {
  if (!cau) return null;
  return <span id={id} role="alert" className="block max-w-[6.5rem] truncate text-xs leading-tight text-bad" title={cau}>{cau}</span>;
}
function useBaoLoiNhap(cau: string | null, onLoiNhap?: (cau: string | null) => void) {
  const bao = useRef(onLoiNhap);
  bao.current = onLoiNhap;
  useEffect(() => { bao.current?.(cau); }, [cau]);
  useEffect(() => () => { bao.current?.(null); }, []);
}
/** Toast "Đã ghi vắng … · Hoàn tác" (C2, Q11) — khoá theo ô để bấm hai ô liền không nuốt nhau. */
function useToastVang() {
  const toast = useToast();
  const khoa = useId();
  return (mon: string, tenHv: string | undefined, hoanTac: () => void, hauQua = '') =>
    toast.hoanTac(`Đã ghi vắng ${mon}${tenHv ? ` · ${tenHv}` : ''}${hauQua}`, hoanTac, { key: `vang:${khoa}` });
}

/**
 * GÕ "-" LÊN Ô SỐ ĐANG HIỆN "-": giá trị không đổi (đè lên "-" đang chọn) hoặc thành "--" (con trỏ sau "-") — cả hai
 * đều không phải điều người dùng muốn. Ô không bao giờ thành "--"; phím đó gọi `khiGoLai` (lớp thường: dời tiếp khi
 * được; FT: không làm gì — FT không có "dời tiếp").
 *
 * BA LỐI VÀO, MỖI PHÍM ĐI ĐÚNG MỘT LỐI: `phim` (keydown máy tính, bỏ qua Ctrl/Cmd/Alt + "-" là phím thu nhỏ trang —
 * chặn phím thì không còn `beforeinput`/`input`); `beforeinput` gắn qua `gan` (bàn phím ảo Android báo `key:
 * 'Unidentified'` nên keydown không nhận ra — chặn được thì không còn `input`); `doi` (onChange thấy "--": dự phòng khi
 * `beforeinput` không chặn được — lúc đó lối trước đã bỏ qua). `phim`/`doi` trả `true` khi đã xử lý.
 */
function useGoLaiDau(giaTri: string, khiGoLai: () => void, inputRef?: (el: HTMLInputElement | null) => void) {
  const moi = useRef({ giaTri, khiGoLai });
  moi.current = { giaTri, khiGoLai };
  const o = useRef<HTMLInputElement | null>(null);
  const nghe = useRef((ev: Event) => {
    const e = ev as InputEvent;
    if (!e.cancelable || e.data !== '-' || moi.current.giaTri.trim() !== '-') return;
    e.preventDefault();
    moi.current.khiGoLai();
  }).current;
  const gan = (el: HTMLInputElement | null) => {
    if (o.current !== el) {
      o.current?.removeEventListener('beforeinput', nghe);
      el?.addEventListener('beforeinput', nghe);
      o.current = el;
    }
    inputRef?.(el);
  };
  const phim = (e: React.KeyboardEvent<HTMLInputElement>): boolean => {
    if (e.key !== '-' || e.ctrlKey || e.metaKey || e.altKey || giaTri.trim() !== '-') return false;
    e.preventDefault();
    khiGoLai();
    return true;
  };
  const doi = (v: string): boolean => {
    const t = v.trim();
    if (giaTri.trim() !== '-' || t.length < 2 || !/^-+$/.test(t)) return false;
    khiGoLai();
    return true;
  };
  return { gan, phim, doi };
}

/** Lỗi máy chủ TỪ CHỐI (4xx: sai luật, thiếu quyền…) — thử lại y nguyên không bao giờ thành, nên không có "Thử lại". */
export const laTuChoi = (e: any) => typeof e?.status === 'number' && e.status >= 400 && e.status < 500;

/**
 * Ô nhập số câu đúng 0–40. Trống KHÁC 0: xoá ô là xoá điểm, không phải chấm 0.
 * `lon` = cỡ điện thoại (ô rộng 60px, cao 44px — chấm một kỹ năng một lúc); luật lưu, "-" và lý do y hệt.
 */
export function RawScoreInput({ cell, onSave, inputRef, onKeyDown, lon = false, onLoiNhap, tenHv }: {
  cell: Cell;
  onSave: (patch: SavePatch, opts?: SaveOpts) => Promise<boolean>;
  inputRef?: (el: HTMLInputElement | null) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  lon?: boolean;
  /** C9: báo câu lỗi nhập (hoặc `null`) lên dòng — dòng đếm vào "n ô chưa lưu". */
  onLoiNhap?: (cau: string | null) => void;
  /** Tên em cho toast "Đã ghi vắng … · {em}" (điện thoại). */
  tenHv?: string;
}) {
  /* Bài đã báo "-" thì ô hiện đúng dấu '-' (không phải ô trống, không phải 0). */
  const shown = () => (cell.rawScore !== null ? String(cell.rawScore) : cell.noShow ? '-' : '');
  const [draft, setDraft] = useState(shown());
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  /* RB-5: ô ĐÃ CÓ điểm mà con số đổi (hoặc bị xoá) thì không lưu thẳng — mở hộp lý do ngay tại ô. */
  const [hoiLyDo, setHoiLyDo] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const idLoi = useId();
  useBaoLoiNhap(loi, onLoiNhap);
  const toastVang = useToastVang();

  useEffect(() => {
    if (!dirty) setDraft(shown());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `shown` chỉ đọc hai trường đã có trong danh sách
  }, [cell.rawScore, cell.noShow?.state, dirty]);

  const commit = async () => {
    if (!dirty || busy || hoiLyDo) return;
    const patch = rawPatchFrom(draft, cell);
    if (!patch) { setLoi(LOI_SO_CAU); return; }     // "--", "abc"…: không gửi gì
    setLoi(null);
    if (coDiemChinhThuc(cell) && 'rawScore' in patch && patch.rawScore !== cell.rawScore) {
      setHoiLyDo(true);
      return;
    }
    setBusy(true);
    const ok = await onSave(patch);
    setBusy(false);
    if (ok) setDirty(false);       // lỗi thì giữ nguyên bản nháp để người dùng sửa và thử lại
    /* Lệnh "-" không thành (máy chủ từ chối, hay lỗi mạng — "Thử lại" ở dòng gửi lại chính lệnh đó): ô về giá trị đã lưu. */
    else if (patch.noShow !== undefined) { setDraft(shown()); setDirty(false); }
  };
  const huy = () => { setDraft(shown()); setDirty(false); setHoiLyDo(false); setLoi(null); };
  /* FT không có "dời tiếp": gõ "-" lên ô đang là "-" chỉ không được thành "--". */
  const goLai = useGoLaiDau(draft, () => undefined, inputRef);
  /* Nút − (điện thoại): đúng lệnh của gõ "-". Ô đã có điểm (sửa phải qua lý do) hoặc đã mang dấu thì không nhận. */
  /* PR-DL: MT lịch sử không nhận "-" (máy chủ chặn) — không đưa nút Vắng. */
  const nhanDau = !coDiemChinhThuc(cell) && !cell.noShow && cell.progress !== 'lich_su';
  const bamDau = async () => {
    if (!nhanDau || busy || hoiLyDo) return;
    setBusy(true);
    const ok = await onSave({ noShow: true });
    setBusy(false);
    if (ok) { setDirty(false); toastVang(skillLabel(cell.skill), tenHv, () => void onSave({ noShow: false })); }
  };

  if (!cell.canEdit || lockedByNoShow(cell)) {
    /* Điện thoại: dồn phải cả cụm — dòng đếm ngược "Còn 6 ngày để sửa" rộng hơn "-" + chỗ nút, dồn trái thì dòng này
       lệch khỏi cột của các dòng khác. E5: ô chỉ đọc là CHỮ (không viền, không mờ); không có số thì "—", band trong ngoặc
       chỉ khi có số câu; bài đã xác nhận vắng ghi "vắng" (E8). */
    const vang = cell.sitStatus === 'absent' && cell.rawScore === null;   // sitStatus: 'absent' cả khi đang chờ duyệt dời (progress reschedule_pending)
    return (
      <span className="inline-flex flex-col items-end gap-0.5">
        <span className="inline-flex items-center gap-1.5">
          <span className={`tabular-nums ${vang ? 'text-slate-500' : 'text-slate-300'}`} title={lyDoChiDoc(cell)}>
            {vang ? 'vắng' : cell.rawScore === null ? (cell.noShow ? '-' : '—') : cell.rawScore}
            {cell.rawScore !== null && <span className="text-slate-500 text-[11px] ml-1">({fmtBand(cell.band)})</span>}
          </span>
          {lon && <ChoNutDau />}
        </span>
        <DongDau cell={cell} />
      </span>
    );
  }

  const moi = draft.trim();
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <span className="inline-flex items-center gap-1.5">
        <input
          ref={goLai.gan}
          aria-invalid={loi ? true : undefined}
          aria-describedby={loi ? idLoi : undefined}
          className={`field ${lon ? 'w-[60px] h-11 text-base font-semibold' : 'w-16'} text-center tabular-nums ${loi ? 'border-rose-400/70' : dirty ? 'border-amber-500/60' : ''}`}
          inputMode="numeric"
          value={draft}
          disabled={busy}
          title={loi ?? (coDiemChinhThuc(cell) ? `Đã có điểm — sửa thì phải ghi lý do. ${NO_SHOW_HINT}` : NO_SHOW_HINT)}
          aria-label={`${skillLabel(cell.skill)} — số câu đúng. ${NO_SHOW_HINT}`}
          onChange={(e) => { if (goLai.doi(e.target.value)) return; setDraft(e.target.value); setDirty(true); setLoi(null); }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (goLai.phim(e)) return;
            if (e.key === 'Enter') { void commit(); }
            /* Esc HUỶ ô đang sửa: trả về giá trị đã lưu, không gửi gì lên máy chủ. */
            if (e.key === 'Escape' && dirty) { e.preventDefault(); huy(); }
            onKeyDown?.(e);
          }}
        />
        {/* Điện thoại: ô trống không ghi "—" cạnh nút "−" (trông như hai gạch). */}
        <span className="tabular-nums text-slate-400 text-xs w-8">{cell.noShow || (lon && cell.band === null) ? '' : fmtBand(cell.band)}</span>
        {lon && <NutDau title={NUT_DAU_FT} an={!nhanDau} tat={busy} onBam={() => void bamDau()} />}
      </span>
      <DongLoiNhap id={idLoi} cau={loi} />
      {!loi && <DongDau cell={cell} />}
      {hoiLyDo && (
        <SuaDiemCoLyDo
          tieuDe={`Sửa ${skillLabel(cell.skill)}`}
          moTaCu={`Đang lưu: ${cell.rawScore} câu đúng (band ${fmtBand(cell.band)})`}
          loiGiaTri={moi === '' || /^\d+$/.test(moi) ? null : 'Số câu đúng là số nguyên từ 0 đến 40.'}
          onDong={huy}
          onLuu={async (lyDo) => {
            const p = rawPatchFrom(draft, cell);
            if (!p) return false;
            const ok = await onSave({ ...p, lyDo }, { nem: true });
            if (ok) { setDirty(false); setHoiLyDo(false); }
            return ok;
          }}
        >
          <label className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 w-20">Giá trị mới</span>
            <input className="field w-20 text-center tabular-nums py-1" inputMode="numeric" value={draft}
              aria-label={`${skillLabel(cell.skill)} — số câu đúng mới`}
              onChange={(e) => setDraft(e.target.value)} />
            <span className="text-[11px] text-slate-500">{moi === '' ? 'huỷ điểm' : ''}</span>
          </label>
        </SuaDiemCoLyDo>
      )}
    </span>
  );
}

/** Bốn tiêu chí mở trong khung riêng — bảng mặc định không bày 16 cột tiêu chí. `lon` = nút cỡ điện thoại (cao 44px). */
export function CriteriaButton({ cell, onSave, buttonRef, lon = false, gvMacDinh = null, tenHv }: {
  cell: Cell;
  onSave: (patch: SavePatch, opts?: SaveOpts) => Promise<boolean>;
  buttonRef?: (el: HTMLButtonElement | null) => void;
  lon?: boolean;
  /** GV chấm mặc định của cột S (`useGvChamCot`) — giá trị đầu của hộp tiêu chí khi ô chưa có GV chấm. */
  gvMacDinh?: NguoiChon | null;
  /** Tên em cho toast "Đã ghi vắng … · {em}" (điện thoại). */
  tenHv?: string;
}) {
  const [open, setOpen] = useState(false);
  const editable = cell.canEdit && !lockedByNoShow(cell);
  /* Ô đã có band: sửa là hiệu chỉnh → hộp lý do NGAY TẠI Ô (bốn tiêu chí nằm trong hộp), không mở khung lớn (G-8). */
  const hieuChinh = coDiemChinhThuc(cell);
  /* Nút − (điện thoại): bốn ô tiêu chí dùng bàn phím số thập phân — iPhone không gõ được "-". */
  const [dangBao, setDangBao] = useState(false);
  const nhanDau = editable && !hieuChinh && !cell.noShow && cell.progress !== 'lich_su';   // PR-DL: MT lịch sử không nhận "-"
  const toastVang = useToastVang();
  const bamDau = async () => {
    if (!nhanDau || dangBao) return;
    setDangBao(true);
    const ok = await onSave({ noShow: true });
    setDangBao(false);
    if (ok) toastVang(skillLabel(cell.skill), tenHv, () => void onSave({ noShow: false }));
  };
  /* E5: ô không sửa được là CHỮ SỐ (không viền nút, không mờ) — cùng câu "vì sao" với ô số câu; vắng ghi "vắng". */
  if (!editable) {
    const vang = cell.sitStatus === 'absent' && cell.band === null;
    return (
      <span className="inline-flex flex-col items-end gap-0.5">
        <span className="inline-flex items-center gap-1.5">
          <span className={`tabular-nums ${vang ? 'text-slate-500' : 'text-slate-300'} ${lon ? 'text-base font-semibold' : ''}`} title={lyDoChiDoc(cell)}>
            {vang ? 'vắng' : cell.noShow ? '-' : fmtBand(cell.band)}
          </span>
          {lon && <ChoNutDau />}
        </span>
        <DongDau cell={cell} />
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <span className="inline-flex items-center gap-1.5">
      <button
        ref={buttonRef}
        className={`btn ${lon ? 'min-h-[44px] min-w-[60px] justify-center text-base font-semibold' : 'btn-sm'} tabular-nums`}
        onClick={() => setOpen(true)}
        title={hieuChinh ? 'Sửa bốn tiêu chí — đã có điểm nên phải ghi lý do.' : `Mở bốn tiêu chí. ${NO_SHOW_HINT}`}
      >
        {cell.noShow ? '-' : lon && cell.band === null && nhanDau ? '' : fmtBand(cell.band)}
        <span className="text-slate-500 text-[11px]">sửa</span>
      </button>
      {lon && <NutDau title={NUT_DAU_FT} an={!nhanDau} tat={dangBao} onBam={() => void bamDau()} />}
      </span>
      <DongDau cell={cell} />
      {open && !hieuChinh && <CriteriaModal cell={cell} onSave={onSave} onClose={() => setOpen(false)} gvMacDinh={gvMacDinh} />}
      {open && hieuChinh && <SuaTieuChi cell={cell} onSave={onSave} onClose={() => setOpen(false)} />}
    </span>
  );
}

/** Hiệu chỉnh bốn tiêu chí của một ô đã có band: bốn ô số trong `SuaDiemCoLyDo`, band xem trước ngay dưới. */
function SuaTieuChi({ cell, onSave, onClose }: {
  cell: Cell; onSave: (patch: SavePatch, opts?: SaveOpts) => Promise<boolean>; onClose: () => void;
}) {
  const tc = tieuChiCua(cell.skill) ?? [], tcNgan = tieuChiNganCua(cell.skill) ?? [];
  const [vals, setVals] = useState<string[]>(cell.criteria.map((v) => (v === null ? '' : String(v))));
  const { dash, preview, patch } = criteriaPatchFrom(vals, cell);
  const doi = vals.some((v, i) => (v.trim() === '' ? null : Number(v)) !== cell.criteria[i]);
  return (
    <SuaDiemCoLyDo
      tieuDe={`Sửa ${skillLabel(cell.skill)}`}
      moTaCu={`Đang lưu: band ${fmtBand(cell.band)} (${cell.criteria.map((v) => v ?? '—').join(' · ')})`}
      loiGiaTri={!patch ? LOI_TIEU_CHI : dash ? 'Ô đã có điểm không nhận dấu "-".' : !doi ? 'Chưa đổi tiêu chí nào.' : null}
      onDong={onClose}
      onLuu={async (lyDo) => {
        if (!patch) return false;
        const ok = await onSave({ ...patch, lyDo }, { nem: true });
        if (ok) onClose();
        return ok;
      }}
    >
      <div className="flex items-end gap-1.5">
        {tc.map((label, i) => (
          <label key={i} className="block" title={label}>
            <span className="block text-[11px] text-slate-500">{tcNgan[i]}</span>
            <input className="field w-12 text-center tabular-nums px-1 py-1" inputMode="decimal" value={vals[i] ?? ''}
              aria-label={`${skillLabel(cell.skill)} — ${label}`}
              onChange={(e) => setVals((v) => v.map((x, j) => (j === i ? e.target.value : x)))} />
          </label>
        ))}
        <span className="pb-1.5 text-xs tabular-nums text-slate-300" title="Band xem trước">→ {fmtBand(preview)}</span>
      </div>
    </SuaDiemCoLyDo>
  );
}

export function CriteriaModal({ cell, onSave, onClose, gvMacDinh = null }: {
  cell: Cell; onSave: (patch: SavePatch) => Promise<boolean>; onClose: () => void;
  /** Speaking: GV chấm của cột (lớp × tuần) khi ô chưa có GV chấm riêng. */
  gvMacDinh?: NguoiChon | null;
}) {
  const tc = tieuChiCua(cell.skill) ?? [], tcNgan = tieuChiNganCua(cell.skill) ?? [];
  const { session } = useSession();
  /* PR-HSM (T39): "+ Nhận xét" gập sẵn (mở sẵn khi đã có) · Speaking có dòng GV chấm · lưu MỘT lệnh, chỉ trường đã đổi. */
  const coNhanXet = (BAI_CO_NHAN_XET as readonly string[]).includes(cell.skill);
  const [moNx, setMoNx] = useState(!!cell.nhanXet);
  const [nx, setNx] = useState(cell.nhanXet ?? '');
  const laS = cell.skill === 'speaking';
  const gvCu = gvChamThanhChon(cell.gvCham);
  const [gv, setGv] = useState<NguoiChon | null>(gvCu ?? gvMacDinh);
  /* Bài đã báo "-" thì mở ra thấy '-' ở ô đầu — không phải bốn ô trống dễ nhầm với chưa nhập. */
  const [vals, setVals] = useState<string[]>(
    cell.noShow && cell.criteria.every((v) => v === null)
      ? ['-', '', '', '']
      : cell.criteria.map((v) => (v === null ? '' : String(v))),
  );
  const [busy, setBusy] = useState(false);

  /* Có '-' thì bỏ qua các ô số còn lại (xem `criteriaPatchFrom`). */
  const { dash, preview, patch } = criteriaPatchFrom(vals, cell);

  const submit = async () => {
    if (!patch || busy) return;
    /* Nhận xét / GV chấm đi kèm lệnh điểm; lệnh "-" (không có bài) thì không — máy chủ bỏ qua ở nhánh đó. */
    const them: SavePatch = {};
    if ('criteria' in patch) {
      if (coNhanXet && nx.trim() !== (cell.nhanXet ?? '')) them.nhanXet = nx.trim() || null;
      if (laS && !cungGvCham(gv, gvCu, session?.user?.id)) them.gvCham = gvChamPayload(gv);
    }
    setBusy(true);
    const ok = await onSave({ ...patch, ...them });
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Modal open onClose={onClose} title={`${skillLabel(cell.skill)} — bốn tiêu chí`} width="max-w-md"
      footer={<>
        <button className="btn" onClick={onClose} disabled={busy}>Đóng</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy || !patch} title={patch ? undefined : LOI_TIEU_CHI}>
          {busy ? 'Đang lưu…' : 'Lưu'}
        </button>
      </>}>
      <div className="space-y-3">
        {tc.map((label, i) => (
          <label key={i} className="flex items-center gap-3">
            <span className="w-8 text-xs text-slate-500 shrink-0">{tcNgan[i]}</span>
            <span className="flex-1 text-sm text-slate-300">{label}</span>
            <input
              className="field w-20 text-center tabular-nums"
              inputMode="decimal"
              value={vals[i] ?? ''}
              title={NO_SHOW_HINT}
              onChange={(e) => setVals((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
              /* T39: Enter ở ô tiêu chí là Lưu (không ở ô nhận xét — ở đó Enter xuống dòng). */
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void submit(); } }}
            />
          </label>
        ))}
        <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--line)' }}>
          <span className="text-sm text-slate-400">Band kỹ năng</span>
          <strong className="tabular-nums text-lg">{dash ? '-' : fmtBand(preview)}</strong>
        </div>
        {!patch && <p className="text-xs text-rose-300 m-0">{LOI_TIEU_CHI}</p>}
        {laS && !dash && <DongGvCham value={gv} onChange={setGv} />}
        {coNhanXet && !dash && (moNx ? (
          <label className="block">
            <span className="flex items-baseline justify-between text-xs text-slate-400">
              <span>Nhận xét (không bắt buộc)</span>
              {nx.length > 800 && <span className="tabular-nums">{nx.length}/{NHAN_XET_TOI_DA}</span>}
            </span>
            <textarea className="field mt-1 w-full text-sm" rows={3} maxLength={NHAN_XET_TOI_DA} value={nx}
              onChange={(e) => setNx(e.target.value)} />
          </label>
        ) : (
          <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-sm" onClick={() => setMoNx(true)}>
            + Nhận xét
          </button>
        ))}
        {dash && (
          <p className="text-xs text-slate-300 m-0">
            Sẽ lưu là <strong>Không có bài</strong> cho đúng bài này. Sửa lại được đến hết Chủ nhật của tuần thi;
            còn nguyên khi hết Chủ nhật thì thành <strong>Không dự thi</strong>.
          </p>
        )}
        <SectionNote>
          {NO_SHOW_HINT}. Đủ bốn tiêu chí mới ra band. Để trống là chưa chấm, không phải điểm 0.
          {(cell.skill === 'writing1' || cell.skill === 'writing2') &&
            ' Band Writing của học viên = (Task 1 + Task 2 × 2) / 3, tính khi có cả hai task.'}
        </SectionNote>
      </div>
    </Modal>
  );
}

/**
 * SỬA ĐIỂM NGAY TẠI DÒNG (PR-I Step 4): L/R một ô, W1/W2/S bốn ô tiêu chí, cùng `Lưu`/`Huỷ` ở đúng dòng đó — không mở
 * khung riêng. `Enter` lưu, `Esc` huỷ. '-' là lệnh "không có bài" như ở bảng cả lớp; dựng lệnh bằng CÙNG hàm
 * (`rawPatchFrom` · `criteriaPatchFrom`) nên hai nơi nhập không thể lệch luật.
 */
export function InlineScoreEditor({ cell, onSave, onClose }: {
  cell: Cell; onSave: (patch: SavePatch) => Promise<boolean>; onClose: () => void;
}) {
  const isRaw = cell.skill === 'listening' || cell.skill === 'reading';
  const tc = tieuChiCua(cell.skill) ?? [], tcNgan = tieuChiNganCua(cell.skill) ?? [];
  const [vals, setVals] = useState<string[]>(() => (isRaw
    ? [cell.rawScore !== null ? String(cell.rawScore) : cell.noShow ? '-' : '']
    : cell.noShow && cell.criteria.every((v) => v === null)
      ? ['-', '', '', '']
      : cell.criteria.map((v) => (v === null ? '' : String(v)))));
  const [busy, setBusy] = useState(false);
  const [lyDo, setLyDo] = useState('');
  const built = isRaw
    ? { dash: vals[0].trim() === '-', preview: null as number | null, patch: rawPatchFrom(vals[0], cell) }
    : criteriaPatchFrom(vals, cell);
  /*
   * RB-5 — ô ĐÃ CÓ điểm mà giá trị đổi (hoặc bị xoá) thì phải ghi lý do; ô lý do hiện ngay trong dòng đang sửa (không
   * mở thêm khung). Lưu lại đúng số cũ không phải hiệu chỉnh nên không hỏi.
   */
  const canLyDo = coDiemChinhThuc(cell) && !built.dash && (isRaw
    ? (vals[0].trim() === '' ? null : Number(vals[0])) !== cell.rawScore
    : vals.some((v, i) => (v.trim() === '' ? null : Number(v)) !== cell.criteria[i]));
  const loiLyDo = !built.patch ? (isRaw ? LOI_SO_CAU : LOI_TIEU_CHI) : canLyDo ? kiemLyDo(lyDo) : null;

  const submit = async () => {
    if (busy || loiLyDo || !built.patch) return;
    setBusy(true);
    const ok = await onSave(canLyDo ? { ...built.patch, lyDo: lyDo.trim() } : built.patch);
    setBusy(false);
    if (ok) onClose();              // lỗi thì giữ nguyên bản nháp để sửa và thử lại
  };
  const setAt = (i: number, value: string) => setVals((v) => v.map((x, j) => (j === i ? value : x)));

  return (
    <div className="space-y-1.5"
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); void submit(); }
        if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      }}>
      <div className="flex flex-wrap items-end gap-2">
        {isRaw ? (
          <label className="block">
            <span className="block text-[11px] text-slate-500">Số câu đúng</span>
            <input autoFocus className="field w-20 text-center tabular-nums" inputMode="numeric" value={vals[0]}
              title={NO_SHOW_HINT} aria-label={`${skillLabel(cell.skill)} — số câu đúng. ${NO_SHOW_HINT}`}
              onChange={(e) => setAt(0, e.target.value)} />
          </label>
        ) : tc.map((label, i) => (
          <label key={i} className="block" title={label}>
            <span className="block text-[11px] text-slate-500">{tcNgan[i]}</span>
            <input autoFocus={i === 0} className="field w-14 text-center tabular-nums" inputMode="decimal"
              value={vals[i] ?? ''} aria-label={`${skillLabel(cell.skill)} — ${label}. ${NO_SHOW_HINT}`}
              onChange={(e) => setAt(i, e.target.value)} />
          </label>
        ))}
        {!isRaw && (
          <span className="pb-1.5 text-sm tabular-nums text-slate-300">Band {built.dash ? '-' : fmtBand(built.preview)}</span>
        )}
        {canLyDo && (
          <label className="block">
            <span className="block text-[11px] text-slate-500">Lý do sửa</span>
            <input className="field w-56" value={lyDo} placeholder="Ví dụ: chấm lại bài, nhập nhầm"
              aria-label="Lý do sửa điểm đã nhập" onChange={(e) => setLyDo(e.target.value)} />
          </label>
        )}
        <span title={loiLyDo ?? undefined}>
          <button type="button" className="btn btn-sm btn-primary" disabled={busy || !!loiLyDo}
            title={loiLyDo ?? undefined} onClick={() => void submit()}>
            {busy ? 'Đang lưu…' : 'Lưu'}
          </button>
        </span>
        <button type="button" className="btn btn-sm" disabled={busy} onClick={onClose}>Đóng</button>
      </div>
      <p className="m-0 text-[11px] text-slate-500">
        {built.dash
          ? 'Sẽ lưu là Không có bài cho đúng bài này; sửa lại được đến hết Chủ nhật của tuần thi.'
          : `${NO_SHOW_HINT}. Để trống là chưa chấm, không phải điểm 0.`} Enter để lưu · Esc để huỷ.
      </p>
    </div>
  );
}

/**
 * HẠN CHẤM CỦA CHÍNH MÔN NÀY — không phải hạn của cả đợt.
 *
 * Môn chưa tới tuần thi thì chưa nợ ai cái gì, nên nó hiện tuần thi chứ không hiện một
 * cái hạn trông như đang đếm ngược. Đây là chỗ dễ đọc nhầm nhất của lịch tách tuần.
 */
export function DeadlinePill({ cell }: { cell: Cell }) {
  const { homNay } = useNgayNghiepVu();
  if (!cell.required) return <Info pending>Ngoài phạm vi</Info>;
  if (cell.progress === 'cancelled') return <Info pending>Đã huỷ phần thi</Info>;
  /* MT lịch sử (T34): không hạn, không "Quá hạn" — chỉ là nhập bù. */
  if (cell.progress === 'lich_su') return <Info pending>Nhập bù, không tính hạn</Info>;
  /*
   * HAI MỐC KHÔNG THAY NHAU (rule book §17.1): "Hạn nhập điểm 23/09" là hạn cho bài CÓ thực hiện; còn bài GV đã
   * báo "-" thì không nợ điểm mà có mốc chốt Chủ nhật — hai cái tên khác nhau, không dùng chung một chỗ.
   */
  if (cell.noShow) return <Info>{cell.noShow.text}</Info>;
  /* "Đã nhập" là TRẠNG THÁI CÔNG VIỆC, không phải điểm tốt — nên không tô xanh lá. */
  if (cell.band !== null) return <Status kind="done">Đã nhập</Status>;
  if (cell.progress === 'absent') return <Info pending>Đã vắng — chờ xếp lại</Info>;
  if (!cell.deadline) return <Info pending>Chưa xếp tuần</Info>;
  /*
   * Giữ NGUYÊN NGHĨA, đổi ĐƯỜNG RENDER (PR-E Step 2): bốn nhánh chuỗi tự dựng ở đây ("Hạn
   * riêng môn này" / "Hạn riêng cả đợt" / "Hạn" / "Quá hạn") nay đi qua `<Han>` — nên hạn nhập
   * điểm nói rõ là hạn NHẬP ĐIỂM, quá hạn nói rõ bao nhiêu ngày, và cùng một câu ở mọi màn.
   * Nguồn hạn (riêng môn / riêng cả đợt) chuyển thành ghi chú đứng sau, không mất thông tin.
   */
  if (cell.progress === 'upcoming') {
    return <Han loai="nhap-diem" han={cell.deadline} tienTo={`Thi ${cell.weekStart ? tuanLich(cell.weekStart, homNay) : cell.weekRange ?? cell.periodCode ?? ''}`.trim()} />;
  }
  const ghiChu = cell.deadlineSource === 'skill_override' ? 'riêng môn này'
    : cell.deadlineSource === 'attempt_override' ? 'riêng cả đợt'
    : undefined;
  return <Han loai="nhap-diem" han={cell.deadline} ghiChu={ghiChu} />;
}


/**
 * RB-5 — SỬA MỘT Ô ĐÃ CÓ ĐIỂM. Hộp nhỏ ngay tại ô: giá trị mới + ô lý do bắt buộc. Nút Lưu mờ khi lý do chưa đủ, rê
 * chuột thấy đúng câu của `kiemLyDo` — không để người dùng bấm rồi mới biết mình thiếu gì.
 *
 * Hộp neo vào phần tử CHA của chỗ nó được đặt (chính là ô điểm) và vẽ qua portal với `position: fixed`, nên bảng cuộn
 * ngang trong thẻ (`overflow-x-auto`) không cắt được nó; hết chỗ bên dưới thì lật lên trên. Đây là một hộp nổi nhỏ,
 * không phải một khung chồng lên khung (G-8). Esc hoặc bấm ra ngoài = huỷ; Enter = Lưu khi đã hợp lệ.
 *
 * `loiGiaTri` (không bắt buộc): giá trị mới chưa hợp lệ thì Lưu cũng mờ, tooltip nói vì sao. Lỗi máy chủ trả về (ví dụ
 * 400 "Sửa điểm đã nhập thì phải ghi lý do.") hiện ngay dưới ô lý do — `onLuu` ném lỗi thì hộp bắt lấy câu đó.
 */
export function SuaDiemCoLyDo({ tieuDe, moTaCu, children, onLuu, onDong, loiGiaTri = null }: {
  tieuDe: string; moTaCu: string; children: ReactNode;
  onLuu: (lyDo: string) => Promise<boolean>; onDong: () => void;
  loiGiaTri?: string | null;
}) {
  const moc = useRef<HTMLSpanElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const dong = useRef(onDong);
  dong.current = onDong;
  const dangLuu = useRef(false);
  /* Giá trị mới đang nằm trong hộp, chưa gửi: bảng điểm theo lượt coi là "ô chưa lưu" và chặn đổi lượt (không mất điểm đang gõ). */
  useBaoHopLyDoMo(busy);

  const loiLyDo = kiemLyDo(lyDo);
  /* Câu của `kiemLyDo` đứng trước: tooltip của nút Lưu mờ luôn nói đúng câu lý do còn thiếu (RB-5). */
  const chan = loiLyDo ?? loiGiaTri;

  const dat = useCallback(() => {
    const neo = moc.current?.parentElement;
    const hop = pop.current;
    if (!neo || !hop) return;
    const r = neo.getBoundingClientRect();
    const w = hop.offsetWidth;
    const h = hop.offsetHeight;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    const top = r.bottom + 4 + h > window.innerHeight - 8 ? Math.max(8, r.top - h - 4) : r.bottom + 4;
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => { dat(); }, [dat]);

  useEffect(() => {
    const dau = pop.current?.querySelector<HTMLInputElement>('input');
    dau?.focus();
    dau?.select();
    const away = (e: MouseEvent) => {
      if (!dangLuu.current && pop.current && !pop.current.contains(e.target as Node)) dong.current();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || dangLuu.current) return;
      e.stopPropagation(); e.preventDefault();
      dong.current();
    };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc, true);
    window.addEventListener('resize', dat);
    window.addEventListener('scroll', dat, true);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc, true);
      window.removeEventListener('resize', dat);
      window.removeEventListener('scroll', dat, true);
    };
  }, [dat]);

  const luu = async () => {
    if (chan || dangLuu.current) return;
    dangLuu.current = true;
    setBusy(true); setLoi(null);
    try {
      const ok = await onLuu(lyDo.trim());
      if (!ok) setLoi('Không lưu được — thử lại.');
    } catch (e: any) {
      setLoi(e?.message ?? 'Không lưu được — thử lại.');
    } finally {
      dangLuu.current = false;
      setBusy(false);
    }
  };

  return (
    <span ref={moc} className="hidden" aria-hidden>
      {createPortal(
        <div
          ref={pop} role="dialog" aria-label={tieuDe}
          className="fixed z-[70] surface-2 rounded-lg border shadow-xl p-3 w-72 text-left normal-case tracking-normal"
          style={{ borderColor: 'var(--line-strong)', top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') { e.preventDefault(); void luu(); }
          }}
        >
          <div className="text-sm font-medium text-slate-100">{tieuDe}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">{moTaCu}</div>
          <div className="mt-2">{children}</div>
          <label className="block mt-2">
            <span className="block text-[11px] text-slate-500 mb-0.5">Lý do sửa (bắt buộc)</span>
            <input className="field py-1 text-sm" value={lyDo} placeholder="Ví dụ: chấm lại bài, nhập nhầm cột"
              aria-label="Lý do sửa điểm đã nhập" onChange={(e) => setLyDo(e.target.value)} />
          </label>
          {loi && <p className="m-0 mt-1 text-[11px] text-rose-300">{loi}</p>}
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" className="btn btn-sm" disabled={busy} onClick={() => dong.current()}>Đóng</button>
            <span title={chan ?? undefined}>
              <button type="button" className="btn btn-sm btn-primary" disabled={busy || !!chan}
                title={chan ?? undefined} onClick={() => void luu()}>
                {busy ? 'Đang lưu…' : 'Lưu'}
              </button>
            </span>
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
}

/**
 * Tỉ lệ để HIỆN, viết kiểu Việt: dấu phẩy thập phân ("82,5%"). Làm tròn chỉ để hiện — xét đạt/chưa đạt đã làm ở máy
 * chủ trên số chính xác.
 */
const phanTram = (r: number | null | undefined) =>
  (r === null || r === undefined ? null : `${String(Math.round(r * 1000) / 10).replace('.', ',')}%`);

/** "Đạt · 82,5%" / "Chưa đạt · 67,5%" — chữ kết quả đứng trước (bấm thử C10). Chưa có kết quả thì null. */
export function datPhanTram(ketQua: 'pass' | 'fail' | 'missing' | undefined, tiLe: number | null | undefined): string | null {
  const chu = ketQua === 'pass' ? 'Đạt' : ketQua === 'fail' ? 'Chưa đạt' : null;
  const pt = phanTram(tiLe);
  return chu && pt ? `${chu} · ${pt}` : null;
}

/**
 * DÒNG PHỤ DUY NHẤT dưới hai số của ô đã có điểm trên LƯỚI (G-3). Ô chưa có điểm không bao giờ có dòng này, nên không
 * tranh chỗ với "Quá hạn dd/mm" (chỉ hiện khi CHƯA có điểm). `leading-none` để ô hai dòng vẫn vừa hàng cao 56px — mọi
 * dòng của lưới cao bằng nhau (G-2). Màn điện thoại (`lon`) không vẽ dòng này dưới ô: câu đó nằm ở dòng phụ dưới tên em.
 */
function DongDatPhanTram({ ketQua, tiLe, chiChu = false }: { ketQua?: 'pass' | 'fail' | 'missing'; tiLe?: number | null; chiChu?: boolean }) {
  /* `chiChu`: chỉ "Đạt"/"Chưa đạt" (lưới Pre FOU: % đã ở cột Kết quả — không hiện hai lần). */
  const chu = chiChu ? datPhanTram(ketQua, tiLe)?.split(' · ')[0] ?? null : datPhanTram(ketQua, tiLe);
  if (!chu) return null;
  return (
    <span className={`block text-xs leading-none mt-0.5 whitespace-nowrap tabular-nums ${ketQua === 'fail' ? 'text-rose-300' : 'text-slate-400'}`}>
      {chu}
    </span>
  );
}
const SO_NGUYEN = /^\d+$/;

/**
 * MỘT Ô CỦA LƯỚI LỚP THƯỜNG: số câu đúng / tổng số câu.
 *
 * Gõ "-" ở ô trái là một LỆNH, không phải một số: em không làm bài → môn này dời sang tuần sau (C08). Xoá dấu "-"
 * đang có là gỡ dấu và trả lịch về tuần cũ. Ô đã có điểm thì không nhận dấu "-" — muốn sửa phải qua hộp lý do.
 * Ô đang mang dấu mà tuần thi mới ĐÃ TỚI: gõ lại "-" là em lại không làm bài — môn dời tiếp (Q4). Tuần mới chưa tới
 * thì gõ lại không làm gì. Ô CHƯA TỚI TUẦN THI không nhận "-" lần đầu (phán quyết controller, máy chủ cũng chặn).
 * Máy chủ từ chối lệnh "-" (ví dụ Q5: vượt qua đợt kế tiếp) → câu của máy chủ hiện ở toast, ô về giá trị đã lưu.
 *
 * KHÔNG BAO GIỜ GỬI một ô chưa có điểm mà ô số câu đúng vẫn trống: con trỏ đi qua ô vừa được ↓ điền tổng không được
 * thành một dòng chỉ có tổng (và người nhập) cho bài chưa chấm. Tổng vừa điền vẫn hiện trong ô, lưu cùng số câu đúng.
 *
 * Lưu khi rời CẢ CẶP ô (hoặc Enter), không lưu khi chỉ nhảy từ ô trái sang ô tổng — nếu không, gõ xong số câu đúng rồi
 * Tab sang ô tổng là máy chủ đã báo "thiếu tổng". Ô tổng viền vàng khi khác tổng đầu cột (em làm đề khác — Q7).
 * `dienTong` là lệnh "↓" của đầu cột: mỗi lần `lan` đổi thì ô CÒN TRỐNG tổng lấy `gt`; ô đã có tổng giữ nguyên.
 *
 * Các trường thêm của `cell` (không bắt buộc): `dau` (ô đang mang dấu "-", mặc định suy từ `tuanDoiTu`), `chuaToiTuan`
 * (chưa tới tuần thi — ô chỉ đọc hiện tuần thi thay cho "—"), `tiLe`/`ketQua` (để tô và ghi tooltip đạt/chưa đạt).
 *
 * `lon` = cỡ điện thoại (hai ô cao 44px). `tongLaySan` = ô tổng CÒN TRỐNG hiện sẵn `tongCot` (chưa phải bản nháp: không
 * gõ gì thì không gửi gì; gõ số câu đúng thì lưu kèm tổng đó) — màn điện thoại không có ô tổng đầu cột + nút ↓.
 */
export function ODiemThuong({
  cell, tongCot, canEdit, onSave, onDau, inputRef, onKeyDown, dienTong = null, tenMon = 'Môn', tenHv,
  lon = false, tongLaySan = false, chiChuKetQua = false, onLoiNhap,
}: {
  cell: {
    diem: number | null; tong: number | null; tuanDoiTu: string | null; tuanHienTai: string | null;
    dau?: boolean; chuaToiTuan?: boolean; tiLe?: number | null; ketQua?: 'pass' | 'fail' | 'missing';
    /** R11: đợt đã hoàn tất — khoá với người không có `PLAN_WEEK`/`SCORE_OVERRIDE`. */
    khoa?: boolean;
  };
  tongCot: number | null;
  canEdit: boolean;
  onSave: (patch: { score: number | null; total: number | null; lyDo?: string }, opts?: SaveOpts) => Promise<boolean>;
  /** `im` = không toast "Đã dời …" (nút Vắng tự báo bằng toast Hoàn tác). */
  onDau: (bat: boolean, im?: boolean) => Promise<boolean>;
  inputRef?: (el: HTMLInputElement | null) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  dienTong?: { gt: number; lan: number } | null;
  tenMon?: string;
  tenHv?: string;
  lon?: boolean;
  tongLaySan?: boolean;
  /** Dưới ô chỉ "Đạt"/"Chưa đạt", không % (Pre FOU: % ở cột Kết quả). */
  chiChuKetQua?: boolean;
  /** C9: báo câu lỗi nhập (hoặc `null`) lên dòng — dòng đếm vào "n ô chưa lưu". */
  onLoiNhap?: (cau: string | null) => void;
}) {
  const toast = useToast();
  const toastVang = useToastVang();
  const idLoi = useId();
  const dau = cell.dau ?? cell.tuanDoiTu !== null;
  const coDiem = cell.diem !== null;
  const diemDaLuu = () => (coDiem ? String(cell.diem) : dau ? '-' : '');
  const tongDaLuu = () => (cell.tong !== null ? String(cell.tong)
    : tongLaySan && !coDiem && tongCot !== null ? String(tongCot) : '');
  const [diem, setDiem] = useState(diemDaLuu());
  const [tong, setTong] = useState(tongDaLuu());
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [canhBao, setCanhBao] = useState<{ o: 'diem' | 'tong'; cau: string } | null>(null);
  const [sua, setSua] = useState<{ diem: string; tong: string } | null>(null);
  const cap = useRef<HTMLSpanElement>(null);
  const dangGui = useRef(false);
  const lanDaDien = useRef(dienTong?.lan ?? 0);
  /* Ô trái vừa được GÕ thật — ↓ điền tổng hay con trỏ đi qua không bao giờ tính là gõ lại "-". */
  const goDiem = useRef(false);
  const daBaoChuaToi = useRef(false);
  const tongRef = useRef<HTMLInputElement>(null);
  useBaoLoiNhap(canhBao?.cau ?? null, onLoiNhap);

  useEffect(() => {
    if (!dirty) { setDiem(diemDaLuu()); setTong(tongDaLuu()); }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hai hàm chỉ đọc ba trường đã có trong danh sách
  }, [cell.diem, cell.tong, dau, dirty, tongLaySan ? tongCot : null]);

  /* Lệnh ↓ của đầu cột — KHÔNG đè ô đã có tổng (Q7), kể cả tổng đang gõ dở. */
  useEffect(() => {
    if (!dienTong || dienTong.lan === lanDaDien.current) return;
    lanDaDien.current = dienTong.lan;
    if (!canEdit || coDiem || cell.tong !== null || tong.trim() !== '') return;
    setTong(String(dienTong.gt));
    setDirty(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi có lệnh ↓ mới
  }, [dienTong?.lan]);

  const soTong = SO_NGUYEN.test(tong.trim()) ? Number(tong.trim()) : null;
  const o = oLuoiThuong({ diem: cell.diem, tong: coDiem ? cell.tong : soTong, tongCot });
  const pt = phanTram(cell.tiLe);
  const ketQuaChu = cell.ketQua === 'pass' ? 'Đạt' : cell.ketQua === 'fail' ? 'Chưa đạt' : null;
  const lamBu = dau && coDiem && cell.tuanHienTai
    ? `Làm bù ở ${cell.tuanHienTai}${cell.tuanDoiTu ? ` (dời từ ${cell.tuanDoiTu})` : ''}.` : '';

  /* `laDau` = lệnh "-" (ghi/gỡ dấu): không thành thì ô về giá trị đã lưu — không để một "-" nằm đó như đã ghi. */
  const gui = async (lam: () => Promise<boolean>, laDau = false) => {
    dangGui.current = true;
    setBusy(true);
    const ok = await lam();
    dangGui.current = false;
    setBusy(false);
    if (ok || laDau) { setDirty(false); goDiem.current = false; }   // lỗi điểm thì giữ bản nháp để sửa và thử lại
  };
  const chuaToiCau = `Chưa tới tuần thi${cell.tuanHienTai ? ` ${cell.tuanHienTai}` : ''} — chưa ghi "-" được.`;

  /** Lỗi nhập của cặp ô chưa có điểm (ngoài lệnh "-") — một luật cho `commit` và cho phím Enter (A5). */
  const loiNhap = (d: string, t: string): { o: 'diem' | 'tong'; cau: string } | null => {
    if (d !== '' && !SO_NGUYEN.test(d)) return { o: 'diem', cau: 'Số câu đúng là số nguyên, hoặc "-" nếu em không làm bài.' };
    if (t !== '' && (!SO_NGUYEN.test(t) || Number(t) <= 0)) return { o: 'tong', cau: 'Tổng số câu là số nguyên lớn hơn 0.' };
    if (d !== '' && t === '') return { o: 'tong', cau: 'Nhập cả tổng số câu.' };
    if (d !== '' && Number(d) > Number(t)) return { o: 'diem', cau: `Số câu đúng (${d}) không thể lớn hơn tổng (${t}).` };
    return null;
  };

  const commit = async () => {
    if (!dirty || dangGui.current || coDiem) return;
    const d = diem.trim();
    const t = tong.trim();
    if (d === '-') {
      /* Đã mang dấu: chỉ dời tiếp khi tuần mới đã tới VÀ người dùng thật sự gõ lại "-" (Q4). */
      if (dau && (cell.chuaToiTuan || !goDiem.current)) { setDirty(false); goDiem.current = false; return; }
      /* Chưa tới tuần thi: không ghi "-" lần đầu, không gửi gì — ô về như cũ, báo bằng toast như một lần máy chủ từ chối
         (Enter còn đưa con trỏ xuống dòng dưới, nên tooltip/viền tại ô không ai thấy). */
      if (cell.chuaToiTuan) {
        /* Enter gọi commit rồi con trỏ rời ô gọi commit lần nữa trước khi `dirty` kịp đổi — chỉ báo MỘT lần. */
        if (daBaoChuaToi.current) return;
        daBaoChuaToi.current = true;
        setDirty(false); goDiem.current = false; setCanhBao(null);
        toast.push('error', `${tenMon}: ${chuaToiCau}`);
        return;
      }
      setCanhBao(null);
      return gui(() => onDau(true), true);
    }
    if (d === '' && dau) { setCanhBao(null); return gui(() => onDau(false), true); }
    const loi = loiNhap(d, t);
    if (loi) { setCanhBao(loi); return; }
    /*
     * Ô CHƯA CÓ ĐIỂM mà số câu đúng vẫn trống: không gửi gì. Lưới máy tính GIỮ bản nháp để tổng vừa ↓ điền còn hiện
     * (lưu cùng số câu đúng khi gõ); điện thoại thì ô tổng trống tự hiện lại tổng của cột nên bỏ bản nháp luôn.
     */
    if (d === '' && cell.diem === null) {
      setCanhBao(null);
      if (tongLaySan && cell.tong === null) setDirty(false);
      return;
    }
    const score = d === '' ? null : Number(d);
    const total = t === '' ? null : Number(t);
    setCanhBao(null);
    if (score === cell.diem && total === cell.tong) { setDirty(false); return; }
    return gui(() => onSave({ score, total }));
  };
  const huy = () => { setDiem(diemDaLuu()); setTong(tongDaLuu()); setDirty(false); setCanhBao(null); goDiem.current = false; };

  /*
   * LỆNH "-" KHÔNG QUA CHỮ TRONG Ô — một đường cho nút − của điện thoại và cho "gõ '-' lên ô đang hiện '-'". Ghi ngay
   * (có toast báo). Không nhận khi: ô đã có điểm, đang gửi, hoặc tuần thi hiện tại của môn CHƯA TỚI (lần đầu: phán
   * quyết controller; lần hai: Q4).
   */
  const nhanDau = !coDiem && !cell.chuaToiTuan;
  const ghiDau = () => {
    if (!nhanDau || dangGui.current) return;
    setCanhBao(null);
    void gui(() => onDau(true), true);
  };
  /*
   * GÕ "-" LÊN Ô ĐANG HIỆN "-": giá trị không đổi (đè lên "-" đang chọn) hoặc thành "--" (con trỏ sau "-") — cả hai
   * đều không phải điều người dùng muốn. Ô mang dấu → đó là lệnh gõ lại "-" (dời tiếp khi tuần mới đã tới); "-" đang gõ
   * dở của ô chưa có dấu → chỉ chặn "--", "-" đó lưu khi rời ô như thường. Ba lối vào: xem `useGoLaiDau`.
   */
  const goLaiDau = () => { if (dau) ghiDau(); };
  /* Nút "Vắng" (điện thoại, C2): ghi ngay + toast Hoàn tác (gỡ dấu, lịch về tuần cũ). */
  const bamVang = () => {
    if (!nhanDau || dangGui.current) return;
    setCanhBao(null);
    void gui(async () => {
      const ok = await onDau(true, true);
      if (ok) toastVang(tenMon, tenHv, () => void onDau(false), ' — dời sang tuần sau');
      return ok;
    }, true);
  };
  const goLai = useGoLaiDau(diem, goLaiDau, inputRef);

  const phim = (e: React.KeyboardEvent<HTMLInputElement>) => {
    /* Ô tổng bị khoá khi ô trái đang là "-", nên phím này chỉ có thể tới từ ô trái. */
    if (goLai.phim(e)) return;
    if (e.key === 'Enter') {
      void commit();
      /*
       * A5 (Z2c-c): cặp ô còn lỗi (thiếu tổng, sai số…) thì Enter KHÔNG nhảy dòng — câu cảnh báo nằm ở ô vừa rời thì không
       * ai thấy, dễ bỏ sót cả em đó. Thiếu hoặc sai tổng thì đưa con trỏ sang ô tổng.
       */
      const d = diem.trim();
      const loi = dirty && !coDiem && d !== '-' && !(d === '' && dau) ? loiNhap(d, tong.trim()) : null;
      if (loi) {
        e.preventDefault();
        if (loi.o === 'tong') tongRef.current?.focus();
        return;
      }
    }
    /* Esc HUỶ ô đang sửa: trả về giá trị đã lưu, không gửi gì lên máy chủ. */
    if (e.key === 'Escape' && dirty) { e.preventDefault(); huy(); }
    onKeyDown?.(e);
  };

  const oSo = lon
    ? 'field w-[52px] h-11 px-1 text-center tabular-nums text-base'
    : 'field w-11 px-1 py-1 text-center tabular-nums text-[13px]';
  const nutDauTitle = dau ? 'Em lại không làm bài — môn này dời tiếp sang tuần sau'
    : 'Em không làm bài — môn này dời sang tuần sau';

  /* ---- Chỉ đọc: môn không được phân công. */
  if (!canEdit) {
    const khongDay = cell.khoa ? KHOA_HOAN_TAT_HINT : 'Bạn không được phân công kỹ năng này.';
    if (coDiem) {
      return (
        <span className="inline-flex flex-col items-end justify-center tabular-nums text-slate-400"
          title={[khongDay, pt && ketQuaChu ? `${ketQuaChu} · ${pt}.` : '', lamBu].filter(Boolean).join(' ')}>
          <span className="inline-flex items-center gap-1">
            <span className={cell.ketQua === 'fail' ? 'text-rose-300' : ''}>{o.hien || `${cell.diem}/?`}</span>
            {lon && <ChoNutDau />}
          </span>
          {!lon && <DongDatPhanTram ketQua={cell.ketQua} tiLe={cell.tiLe} chiChu={chiChuKetQua} />}
        </span>
      );
    }
    const chu = dau ? '-' : cell.chuaToiTuan && cell.tuanHienTai ? cell.tuanHienTai : '—';
    const title = dau && cell.tuanHienTai ? `${khongDay} Đã dời sang ${cell.tuanHienTai}.`
      : cell.chuaToiTuan && cell.tuanHienTai ? `${khongDay} Thi ${cell.tuanHienTai}.` : khongDay;
    const chuDoc = <span className="text-[11px] text-slate-500 tabular-nums" title={title}>{chu}</span>;
    /* Điện thoại: giữ chỗ nút "−" để chữ thẳng cột với ô nhập của các dòng khác. */
    return lon ? <span className="inline-flex items-center gap-1">{chuDoc}<ChoNutDau /></span> : chuDoc;
  }

  /* ---- Ô đã có điểm: hai ô chỉ đọc; bấm (hoặc gõ số) mở hộp lý do ngay tại ô (RB-5). */
  if (coDiem) {
    const mo = (d: string) => setSua({ diem: d, tong: tongDaLuu() });
    const loiGiaTri = (() => {
      if (!sua) return null;
      const d = sua.diem.trim(); const t = sua.tong.trim();
      if (d === '-') return 'Ô đã có điểm không nhận dấu "-" — muốn đổi thì sửa số.';
      if (d !== '' && !SO_NGUYEN.test(d)) return 'Số câu đúng là số nguyên.';
      if (t !== '' && (!SO_NGUYEN.test(t) || Number(t) <= 0)) return 'Tổng số câu là số nguyên lớn hơn 0.';
      if (d !== '' && t === '') return 'Nhập cả tổng số câu.';
      if (d !== '' && Number(d) > Number(t)) return `Số câu đúng (${d}) không thể lớn hơn tổng (${t}).`;
      if ((d === '' ? null : Number(d)) === cell.diem && (t === '' ? null : Number(t)) === cell.tong) return 'Chưa đổi gì.';
      return null;
    })();
    const title = [pt && ketQuaChu ? `${ketQuaChu} · ${pt}.` : '', 'Đã có điểm — bấm để sửa, phải ghi lý do.', lamBu]
      .filter(Boolean).join(' ');
    return (
      <span className="inline-flex flex-col items-end justify-center" title={title}>
        <span className="inline-flex items-center justify-end gap-1">
          <input ref={inputRef} readOnly className={`${oSo} cursor-pointer ${cell.ketQua === 'fail' ? 'text-rose-300' : ''}`}
            value={String(cell.diem)} aria-label={`${tenMon} — số câu đúng (đã có điểm, sửa phải ghi lý do)`}
            onClick={() => mo(String(cell.diem))}
            onKeyDown={(e) => {
              if (/^[0-9]$/.test(e.key)) { e.preventDefault(); mo(e.key); return; }
              if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); mo(''); return; }
              if (e.key === 'F2') { e.preventDefault(); mo(String(cell.diem)); return; }
              onKeyDown?.(e);
            }} />
          <span className="text-slate-600">/</span>
          <input readOnly tabIndex={-1} className={`${oSo} cursor-pointer ${o.vienVang ? 'border-amber-400/80' : ''}`}
            value={tongDaLuu()} placeholder="?" aria-label={`${tenMon} — tổng số câu`}
            title={o.vienVang ? `Khác tổng của cột (${tongCot}) — em làm đề khác.` : undefined}
            onClick={() => mo(String(cell.diem))} />
          {/* Ô đã có điểm không nhận "-": nút chỉ giữ chỗ để các dòng thẳng cột. */}
          {lon && <NutDau title={nutDauTitle} an tat onBam={() => undefined} />}
          {sua && (
            <SuaDiemCoLyDo
              tieuDe={`Sửa ${tenMon}${tenHv ? ` · ${tenHv}` : ''}`}
              moTaCu={`Đang lưu: ${cell.diem}/${cell.tong ?? '?'}${pt ? ` (${pt})` : ''}`}
              loiGiaTri={loiGiaTri}
              onDong={() => setSua(null)}
              onLuu={async (lyDo) => {
                const d = sua.diem.trim(); const t = sua.tong.trim();
                const ok = await onSave({ score: d === '' ? null : Number(d), total: t === '' ? null : Number(t), lyDo }, { nem: true });
                if (ok) setSua(null);
                return ok;
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 w-20">Giá trị mới</span>
                <input className={oSo} inputMode="numeric" value={sua.diem} aria-label={`${tenMon} — số câu đúng mới`}
                  onChange={(e) => setSua({ ...sua, diem: e.target.value })} />
                <span className="text-slate-600">/</span>
                <input className={oSo} inputMode="numeric" value={sua.tong} aria-label={`${tenMon} — tổng số câu mới`}
                  onChange={(e) => setSua({ ...sua, tong: e.target.value })} />
                {sua.diem.trim() === '' && <span className="text-[11px] text-slate-500">huỷ điểm</span>}
              </div>
            </SuaDiemCoLyDo>
          )}
        </span>
        {!lon && <DongDatPhanTram ketQua={cell.ketQua} tiLe={cell.tiLe} chiChu={chiChuKetQua} />}
      </span>
    );
  }

  /* ---- Ô chưa có điểm: hai ô nhập. Ô trái nhận số câu đúng hoặc "-". */
  const dangDau = diem.trim() === '-';
  const titleDiem = canhBao?.o === 'diem' ? canhBao.cau
    : dau && !cell.chuaToiTuan
      ? `Đã dời sang ${cell.tuanHienTai ?? 'tuần này'} (từ ${cell.tuanDoiTu ?? 'tuần cũ'}). Gõ số khi em đã làm bài; em lại không làm bài thì gõ lại "-" để dời tiếp.`
    : dau ? `Đã dời sang ${cell.tuanHienTai ?? 'tuần sau'}. Xoá dấu "-" để trả lịch về ${cell.tuanDoiTu ?? 'tuần cũ'}; gõ số khi em đã làm bài.`
    : cell.chuaToiTuan ? `Số câu đúng. Thi ${cell.tuanHienTai ?? 'tuần sau'} — tới tuần thi mới ghi được "-".`
    : 'Số câu đúng. Gõ "-" nếu em không làm bài: môn này dời sang tuần sau.';
  const titleTong = canhBao?.o === 'tong' ? canhBao.cau
    : o.vienVang ? `Khác tổng của cột (${tongCot}) — em làm đề khác.` : 'Tổng số câu của đề em làm.';
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
    <span ref={cap} className="inline-flex items-center justify-end gap-1"
      onBlur={(e) => { if (!cap.current?.contains(e.relatedTarget as Node)) void commit(); }}>
      <input ref={goLai.gan}
        className={`${oSo} ${canhBao?.o === 'diem' ? 'border-rose-400/70' : ''} ${dangDau ? 'text-slate-400' : ''}`}
        aria-invalid={canhBao?.o === 'diem' ? true : undefined} aria-describedby={canhBao?.o === 'diem' ? idLoi : undefined}
        inputMode="numeric" value={diem} disabled={busy} title={titleDiem}
        aria-label={`${tenMon} — số câu đúng. Gõ "-" nếu em không làm bài`}
        onChange={(e) => {
          const v = e.target.value.trim();
          /* Dự phòng: "--" lọt vào ô (bàn phím ảo không cho chặn trước) → giữ "-", đi đúng đường gõ lại "-". */
          if (goLai.doi(v)) return;
          setDiem(e.target.value); setDirty(true); goDiem.current = true; daBaoChuaToi.current = false;
          if (canhBao?.o === 'diem') setCanhBao(null);
        }} onKeyDown={phim} />
      <span className="text-slate-600">/</span>
      <input ref={tongRef} className={`${oSo} ${canhBao?.o === 'tong' ? 'border-rose-400/70' : o.vienVang ? 'border-amber-400/80' : ''}`}
        inputMode="numeric" value={dangDau ? '' : tong} disabled={busy || dangDau} placeholder={dangDau ? '' : 'tổng'}
        title={dangDau ? 'Ô mang dấu "-" chưa cần tổng.' : titleTong}
        aria-invalid={canhBao?.o === 'tong' ? true : undefined} aria-describedby={canhBao?.o === 'tong' ? idLoi : undefined}
        aria-label={`${tenMon} — tổng số câu`}
        onChange={(e) => { setTong(e.target.value); setDirty(true); }} onKeyDown={phim} />
      {lon && <NutDau title={nutDauTitle} an={!nhanDau} tat={busy} onBam={bamVang} />}
    </span>
    <DongLoiNhap id={idLoi} cau={canhBao?.cau ?? null} />
    </span>
  );
}
