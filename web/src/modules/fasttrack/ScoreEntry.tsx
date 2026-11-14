import { useEffect, useId, useRef, useState } from 'react';
import { ODiem } from '../../ui/ODiem.tsx';
import { api, invalidate, invalidateGop } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { thongBaoVang } from '../cham/thongBaoVang.ts';
import { Info, Status } from '../../ui/ui.tsx';
import { useTrangThaiLuuO } from '../../ui/SaveState.tsx';
import { Han } from '../../ui/Han.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { fmtBand, skillLabel } from '../../lib/format.ts';
import type { gvChamPayload } from '../cham/GvCham.tsx';
import {
  oLuoiThuong, tuanLich, ENTRY_SKILL_SHORT, HOAN_TAC_VANG_MS, type EntrySkill, type ThieuNhanXet,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

export type Cell = {
  skill: EntrySkill;
  /** P8 (N13): em không học ô này — "Không học", không nhận gõ. */
  khongHoc?: boolean;
  assessedSkill: string;
  /** false khi Quản lý đã chốt trước là đợt này không yêu cầu kỹ năng đó. */
  required: boolean;
  rawScore: number | null;
  criteria: (number | null)[];
  band: number | null;
  resultDate: string | null;
  enteredByName: string | null;
  enteredAt: string | null;
  /** OV-14c: người nhập (id) — hộp chấm S "Đã chấm bởi … lúc …" khi là người khác. */
  enteredById?: number | null;
  /** Hạn chấm CỦA CHÍNH MÔN NÀY, tính từ tuần thi của nó — không phải hạn của cả đợt. */
  deadline: string | null;
  deadlineSource: 'skill_override' | 'attempt_override' | 'default' | 'none';
  overdue: boolean;
  progress: string;
  canEdit: boolean;
  /** LUAT-34: đợt "Đủ điểm" (hết Chủ nhật của tuần bắt buộc muộn nhất) — chỉ là trạng thái, không còn khoá (R11 bỏ). */
  khoa?: boolean;
  /** LUAT-34 (T20b): ô trống có điểm đã huỷ còn cất — hộp chấm có "Khôi phục điểm". */
  diemHuy?: boolean;
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
    state: 'khong-co-bai' | 'khong-du-thi' | 'cho-ql-hieu-chinh' | 'da-huy';
    text: string; effectiveOn: string | null; editableUntil: string | null;
  } | null;
  /**
   * PR-BV: dấu "-" ĐÃ CHỐT còn trên ô — ô hiện "-" (kèm `→ W3 SEP` khi đã dời) tới khi có điểm. Xoá "-" (tẩy ô + Lưu) = hết vắng,
   * máy chủ trả lịch như trước khi gõ. `goDuoc` = người xem gỡ được lúc này (QL, GV chấm, GVCN — mọi lúc từ OV-13h).
   */
  daChot?: {
    doiSang: string | null; goDuoc: boolean;
    /** OV-11a: mã tuần có "-" (tuần gốc) — hộp tuần thi bù ghi "vắng lần 1 · dời từ W2 SEP". */
    tuTuan?: string;
    /** OV-4b: lần vắng · lúc ghi "-" · người ghi (hộp ô Vắng). */
    lan: number; ghiLuc: string | null; ghiBoi: string | null;
  } | null;
  /** NEN-SUA: ô ĐÃ CÓ ĐIỂM ở tuần thi bù — mã tuần có "-" (tuần cũ), dòng "vắng W3 SEP". */
  doiTu?: string;
  /** PR-HSM (YC-13.5), OV-4b: nhận xét của bài nhập (L/R/W1/W2/S). */
  nhanXet?: string | null;
  /** OV-12b (máy chủ tính, `thieuNhanXetMt`): nhóm nguyên nhân đã chọn (thứ tự) · lượt MT đòi nhận xét · kỳ vọng lượt · ô có điểm còn thiếu. */
  nhomNguyenNhan?: string[];
  nenCoNhanXet?: boolean;
  /** SV-NX-CASE: ô Mock có chip nhóm nguyên nhân (mọi MT); `nenCoNhanXet` = chỉ NHẮC (MT mới nhất của em). */
  coNhom?: boolean;
  kyVong?: number | null;
  thieuNhanXet?: ThieuNhanXet | null;
  /** PR-HSM (T39): GV chấm Speaking — tài khoản (`userId`) hoặc người ngoài (`userId: null`). */
  gvCham?: { userId: number | null; ten: string } | null;
  /** OV-13k: "Nhận xét GV phụ trách" của ô S chấm chéo (lưu riêng, dưới nhận xét người chấm). */
  nhanXetPhuTrach?: { chu: string; ten: string | null } | null;
};

export type SavePatch = {
  rawScore?: number | null;
  /** T10 (PR-MTa): band nhập thẳng (không cùng số câu / tiêu chí có giá trị). */
  band?: number | null;
  criteria?: (number | null)[]; resultDate?: string | null;
  /** `true` = báo "-" (không có bài), `false` = gỡ dấu. Không phải điểm 0. */
  noShow?: boolean;
  /** LUAT-34 (T20b): "Khôi phục điểm" — gọi `POST …/huy-diem { huy: false }` (Khôi phục, NHAP-DIEM-b) thay cho lưu điểm (cùng đường trạng thái lưu, không gửi máy chủ trường này). */
  khoiPhuc?: true;
  /** RB-5 — lý do khi sửa một ô ĐÃ CÓ điểm chính thức (máy chủ đòi khi giá trị đổi hoặc bị xoá). */
  lyDo?: string;
  /** PR-HSM, OV-4b: nhận xét (`null` = xoá) — không phải điểm: không lý do, không đổi "Nhập bởi". */
  nhanXet?: string | null;
  /** PR-HSM: GV chấm Speaking, dạng `nguoiThanhPayload` (`null` = xoá). */
  gvCham?: ReturnType<typeof gvChamPayload>;
  /** OV-12b: nhóm nguyên nhân (mã, thứ tự chọn) — ô MT dưới kỳ vọng. */
  nhomNguyenNhan?: string[];
};

/** Tuỳ chọn của một lần lưu. `nem` = ném lỗi ra cho nơi gọi (hộp lý do hiện câu lỗi ngay tại ô) thay vì chỉ toast. */
export type SaveOpts = { nem?: boolean };


/** Ô KHÔNG nhận lệnh "-" mới: đang mang dấu của chính tuần này. "-" đã chốt mà bài đã dời (`doiSang`) là dấu tuần cũ — tuần mới vẫn báo vắng được. */
export const chanDau = (cell: Cell) => !!cell.noShow || (!!cell.daChot && !cell.daChot.doiSang);
/** Ô sửa được ở lưới: quyền nhập thường, HOẶC gỡ được dấu "-" đã chốt (PR-BV). RKC: ô vắng / huỷ / lớp kết thúc / em lưu trữ — máy chủ quyết
 * `canEdit`, thao tác hậu quả lớn thì máy chủ hỏi (`canXacNhan`); web không tự khoá thêm. */
export const suaDuoc = (cell: Cell) => cell.canEdit || !!cell.daChot?.goDuoc;

/** Ô đã có điểm chính thức. */
export const coDiemChinhThuc = (cell: Cell) => cell.band !== null || cell.rawScore !== null;

/** T10: gợi ý band ở tooltip ô L/R. */

/** T10: ô Band của hộp tiêu chí — đầu vào là band đã lưu khi ô chỉ có band (bốn tiêu chí trống). */
export const bandBanDau = (cell: Cell) => (cell.band !== null && cell.criteria.every((v) => v === null) ? fmtBand(cell.band) : '');

/** Vì sao ô này chỉ đọc — MỘT câu cho ô số câu và ô tiêu chí (RKC: chỉ còn lý do quyền). */
export const LY_DO_CHI_DOC = t('Bạn không được phân công kỹ năng này');
/** NHAP-DIEM-b (đặc tả 5.5 "ô chỉ đọc nói đúng lý do"): kỹ năng ngoài đợt ≠ chưa phân công. */
export const lyDoChiDoc = (c: { required: boolean }) => (c.required ? LY_DO_CHI_DOC : t('Không có trong đợt này'));

/**
 * HOTFIX-3 (OV-13o): điểm vừa lưu (dòng `score` máy chủ trả về) đè lên ô cũ tới khi bảng tải lại được — tải lại hỏng thì ô vẫn hiện
 * điểm đã lưu, không quay về "Nhập" chờ Thử lại.
 */
export const apDiemVuaLuu = (cell: Cell, s?: { band?: number | null; raw_score?: number | null; c1?: number | null; c2?: number | null; c3?: number | null; c4?: number | null }): Cell =>
  (!s ? cell : { ...cell, band: s.band ?? null, rawScore: s.raw_score ?? null, criteria: [s.c1 ?? null, s.c2 ?? null, s.c3 ?? null, s.c4 ?? null] });

/**
 * Lưu điểm một kỹ năng. Khi lỗi, giữ nguyên giá trị người dùng vừa gõ để họ bấm lại,
 * không âm thầm quay về giá trị cũ.
 */
export function useSaveScore(attemptId: number, onSaved?: () => void, tenHv?: string) {
  const toast = useToast();
  const [saving, setSaving] = useState<string | null>(null);
  /*
   * TRẠNG THÁI LƯU THEO TỪNG Ô (PR-UX1, lỗi thật bản chính 24/09): trước đây dòng chỉ nhớ lần lưu CUỐI — ô L hỏng rồi
   * ô R lưu được thì dòng hiện "Đã lưu". Nay mỗi ô một trạng thái (`o`, `loi`); dòng chỉ "đã lưu" khi không còn ô lỗi,
   * còn thì "n ô chưa lưu" + Lưu lại. Lỗi nói rõ ở ô nào, không một lỗi chung cho cả bảng.
   */
  const tt = useTrangThaiLuuO<SavePatch>(`ft:${attemptId}`);
  const inflight = useRef(new Set<string>());
  /* HOTFIX-3: dòng điểm vừa lưu theo kỹ năng — nơi gọi xoá khi dữ liệu bảng đổi (`xoaVuaLuu`). */
  const [vuaLuu, setVuaLuu] = useState<Record<string, any>>({});

  /** `'trung'` = cùng ô đang gửi (R1-LUU-TIEP: hộp nhập coi là "đang lưu", không báo lỗi). */
  const save = async (skill: string, patch: SavePatch, opts: SaveOpts = {}): Promise<boolean | 'trung'> => {
    if (inflight.current.has(skill)) return 'trung';   // chặn gửi lặp cùng một ô
    inflight.current.add(skill);
    setSaving(skill);
    tt.batDau(skill);
    try {
      const r = patch.khoiPhuc
        ? await api.post<any>(`/attempts/${attemptId}/skills/${skill}/huy-diem`, { huy: false })   // NHAP-DIEM-b: một đường Huỷ điểm ⇄ Khôi phục
        : await api.put<any>(`/attempts/${attemptId}/scores/${skill}`, patch);
      if (patch.khoiPhuc) toast.push('ok', t('Đã khôi phục điểm {x}{x2}', { x: ((r?.o as string[] | undefined) ?? [skill]).map((k) => ENTRY_SKILL_SHORT[k as EntrySkill]).join(' + '), x2: tenHv ? ` · ${tenHv}` : '' }));
      /* PR-BV: xoá "-" đã chốt — máy chủ trả tuần bài về / giữ (mockup bản 2). */
      if (r?.goVang?.tuanVe) {
        /* CV-SUA-1011: "Đã bỏ vắng · Hoàn tác" như gõ "-" — Hoàn tác = ghi lại "-" (máy chủ chốt lại theo luật vắng). */
        toast.push('ok', t('Đã bỏ vắng {x}{x2} · {x3} {tuanVe}', { x: ENTRY_SKILL_SHORT[skill as EntrySkill], x2: tenHv ? ` · ${tenHv}` : '', x3: r.goVang.giuLich ? t('giữ') : t('về'), tuanVe: r.goVang.tuanVe }),
          { key: `vang:${attemptId}:${skill}`, ms: HOAN_TAC_VANG_MS, demLui: true, hanhDong: { nhan: t('Hoàn tác'), onBam: () => void save(skill, { noShow: true }) } });
      } else if (r?.boKhongDuThi) {
        /* KIEM-TAY-1011: gỡ "Không dự thi" (MT0 / MT cũ) — tuần không đổi; Hoàn tác = ghi lại "-" (máy chủ chốt lại Không dự thi). */
        toast.push('ok', t('Đã bỏ vắng {tenMonNgan}{x}', { tenMonNgan: ENTRY_SKILL_SHORT[skill as EntrySkill], x: tenHv ? ` · ${tenHv}` : '' }),
          { key: `vang:${attemptId}:${skill}`, ms: HOAN_TAC_VANG_MS, demLui: true, hanhDong: { nhan: t('Hoàn tác'), onBam: () => void save(skill, { noShow: true }) } });
      }
      /* W1: điểm thường → gộp vô hiệu 1,5 s (mỗi ô từng kéo cả lưới lớp + /my-work tải lại); "-" / bỏ vắng / khôi phục đổi lịch → ngay.
         PR-S6F-a: /my-work có trong danh sách — badge quá hạn của GV vẫn tải lại sau khi nhập điểm. */
      const ds = ['/attempts', '/tong-quan', '/classes', '/students', '/my-work'];
      if (patch.noShow !== undefined || patch.khoiPhuc || r?.goVang) ds.forEach(invalidate); else invalidateGop(...ds);
      /* K4: gõ "-" và nút "Vắng" (điện thoại) cùng đi qua đây — một thông báo ngắn; LUAT-34: kèm "Hoàn tác" 10 giây (= gỡ "-"). */
      /* G1-06: "-" ở một task Writing là vắng cả buổi (W1 + W2 cùng dời) — toast nói đúng điều đã xảy ra. */
      const caBuoi = skill === 'writing1' || skill === 'writing2';
      if (patch.noShow === true) {
        /* NHAP-DIEM-b: "-" đè lên điểm (máy chủ cất điểm, `daCat`) → Hoàn tác = Khôi phục (điểm về + bỏ vắng), không chỉ gỡ "-". */
        thongBaoVang(toast, `${attemptId}:${skill}`, caBuoi ? `${ENTRY_SKILL_SHORT.writing1} · ${ENTRY_SKILL_SHORT.writing2}` : ENTRY_SKILL_SHORT[skill as EntrySkill], tenHv, r?.vang,
          () => void save(skill, r?.daCat ? { khoiPhuc: true } : { noShow: false }));
      }
      if (r?.score && patch.noShow === undefined) setVuaLuu((v) => ({ ...v, [skill]: r.score }));
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
    vuaLuu, xoaVuaLuu: () => setVuaLuu((v) => (Object.keys(v).length ? {} : v)),
  };
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
      title={title} aria-label={t('Vắng — {title}', { title })} aria-hidden={an || undefined} disabled={an || tat}
      onMouseDown={(e) => e.preventDefault()} onClick={onBam}>
      {t('Vắng')}
    </button>
  );
}

/** Chỗ trống đúng bằng nút "Vắng" — dòng chỉ đọc / dòng chữ trạng thái của màn điện thoại vẫn thẳng cột với dòng có nút. */
export function ChoNutDau() {
  return <span aria-hidden className="inline-block shrink-0 w-14 h-11" />;
}

/**
 * C9 — CÂU LỖI NHẬP NGAY DƯỚI Ô (không chỉ ở tooltip): xuống dòng, không cắt (OV-11e, CA3-11), chữ đầy đủ nằm trong DOM cho trình đọc màn hình
 * (`role="alert"`, ô trỏ tới bằng `aria-describedby`). Báo QL dòng (`onLoiNhap`) để dòng đếm "n ô chưa lưu".
 */
function DongLoiNhap({ id, cau }: { id: string; cau: string | null }) {
  if (!cau) return null;
  return <span id={id} role="alert" data-phu-odiem="" className="block max-w-[10rem] text-xs leading-4 text-bad [overflow-wrap:anywhere] max-sm:max-w-[14rem] max-sm:text-right">{cau}</span>;
}
function useBaoLoiNhap(cau: string | null, onLoiNhap?: (cau: string | null) => void) {
  const bao = useRef(onLoiNhap);
  bao.current = onLoiNhap;
  useEffect(() => { bao.current?.(cau); }, [cau]);
  useEffect(() => () => { bao.current?.(null); }, []);
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
    const tt = v.trim();
    if (giaTri.trim() !== '-' || tt.length < 2 || !/^-+$/.test(tt)) return false;
    khiGoLai();
    return true;
  };
  return { gan, phim, doi };
}

/** Lỗi máy chủ TỪ CHỐI (4xx: sai luật, thiếu quyền…) — thử lại y nguyên không bao giờ thành, nên không có "Thử lại". */
export const laTuChoi = (e: any) => typeof e?.status === 'number' && e.status >= 400 && e.status < 500;

/**
 * HẠN CHẤM CỦA CHÍNH MÔN NÀY — không phải hạn của cả đợt.
 *
 * Môn chưa tới tuần thi thì chưa nợ ai cái gì, nên nó hiện tuần thi chứ không hiện một
 * cái hạn trông như đang đếm ngược. Đây là chỗ dễ đọc nhầm nhất của lịch tách tuần.
 */
export function DeadlinePill({ cell, mo }: { cell: Cell; mo?: boolean }) {
  const { homNay } = useNgayNghiepVu();
  if (!cell.required) return <Info pending>{t('Ngoài phạm vi')}</Info>;
  if (cell.progress === 'cancelled') return <Info pending>{t('Đã huỷ')}</Info>;
  /* MT lịch sử (T34): không hạn, không "Quá hạn" — chỉ là nhập bù. */
  if (cell.progress === 'lich_su') return <Info pending>{t('Nhập bù, không tính hạn')}</Info>;
  /*
   * HAI MỐC KHÔNG THAY NHAU (rule book §17.1): "Hạn nhập điểm 23/09" là hạn cho bài CÓ thực hiện; còn bài GV đã
   * báo "-" thì không nợ điểm mà có mốc chốt Chủ nhật — hai cái tên khác nhau, không dùng chung một chỗ.
   */
  if (cell.noShow) return <Info>{dich(cell.noShow.text)}</Info>;
  /* "Đã nhập" là TRẠNG THÁI CÔNG VIỆC, không phải điểm tốt — nên không tô xanh lá. */
  if (cell.band !== null) return <Status kind="done">{t('Đã nhập')}</Status>;
  if (cell.progress === 'absent') return <Info pending>{t('Đã vắng — chờ xếp lại')}</Info>;
  if (!cell.deadline) return <Info pending>{t('Chưa xếp tuần')}</Info>;
  /*
   * Giữ NGUYÊN NGHĨA, đổi ĐƯỜNG RENDER (PR-E Step 2): bốn nhánh chuỗi tự dựng ở đây ("Hạn
   * riêng môn này" / "Hạn riêng cả đợt" / "Hạn" / "Quá hạn") nay đi qua `<Han>` — nên hạn nhập
   * điểm nói rõ là hạn NHẬP ĐIỂM, quá hạn nói rõ bao nhiêu ngày, và cùng một câu ở mọi màn.
   * Nguồn hạn (riêng môn / riêng cả đợt) chuyển thành ghi chú đứng sau, không mất thông tin.
   */
  if (cell.progress === 'upcoming') {
    return <Han loai="nhap-diem" han={cell.deadline} tienTo={t('Làm bài {tuan}', { tuan: cell.weekStart ? tuanLich(cell.weekStart, homNay) : cell.weekRange ?? cell.periodCode ?? '' }).trim()} mo={mo} />;
  }
  const ghiChu = cell.deadlineSource === 'skill_override' ? t('riêng môn này')
    : cell.deadlineSource === 'attempt_override' ? t('riêng cả đợt')
    : undefined;
  return <Han loai="nhap-diem" han={cell.deadline} ghiChu={ghiChu} mo={mo} />;
}


/**
 * Tỉ lệ để HIỆN, viết kiểu Việt: dấu phẩy thập phân ("82,5%"). Làm tròn chỉ để hiện — xét đạt/chưa đạt đã làm ở máy
 * chủ trên số chính xác.
 */
const phanTram = (r: number | null | undefined) =>
  (r === null || r === undefined ? null : `${String(Math.round(r * 1000) / 10).replace('.', ',')}%`);

/** "Đạt · 82,5%" / "Chưa đạt · 67,5%" — chữ kết quả đứng trước (bấm thử C10). Chưa có kết quả thì null. */
export function datPhanTram(ketQua: 'pass' | 'fail' | 'missing' | undefined, tiLe: number | null | undefined): string | null {
  const chu = ketQua === 'pass' ? t('Đạt') : ketQua === 'fail' ? t('Chưa đạt') : null;
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
 * đang có là gỡ dấu và trả lịch về tuần cũ. Ô đã có điểm thì không nhận dấu "-" — muốn sửa thì bấm vào ô.
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
  cell, tongCot, canEdit, onSave, onDau, inputRef, onKeyDown, dienTong = null, tenMon = t('Môn'), tenHv,
  lon = false, tongLaySan = false, chiChuKetQua = false, onLoiNhap,
}: {
  cell: {
    diem: number | null; tong: number | null; tuanDoiTu: string | null; tuanHienTai: string | null;
    dau?: boolean; chuaToiTuan?: boolean; tiLe?: number | null; ketQua?: 'pass' | 'fail' | 'missing';
    /** OV-11a (Q1): ô "-" ở tuần thi đã qua ≥ 2 tuần — Không dự thi (không dời). */
    khongDuThi?: boolean;
    /** PR-BV: người xem gỡ được dấu "-" lúc này · `oTuanCu` = đang xem đúng tuần có dấu (tuần mới có thể đã có điểm). */
    goDau?: boolean; oTuanCu?: boolean;
  };
  tongCot: number | null;
  canEdit: boolean;
  onSave: (patch: { score: number | null; total: number | null; lyDo?: string }, opts?: SaveOpts) => Promise<boolean>;
  /** `hoanTac`: lệnh gỡ "-" ĐI QUA Ô (để ô bỏ "-" ngay khi lưới chưa tải lại) — nơi gọi dùng cho nút Hoàn tác của toast (#1418). */
  onDau: (bat: boolean, hoanTac?: () => void) => Promise<boolean>;
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
  const idLoi = useId();
  /* Rà 11/11 G1-03: "-" vừa ghi / gỡ thành công — ô theo ngay, không chờ lưới tải lại (xoá "-" nhanh sau khi ghi trước đây không gửi gì). */
  const [dauTam, setDauTam] = useState<boolean | null>(null);
  useEffect(() => { setDauTam(null); }, [cell.dau, cell.tuanDoiTu]);
  const dau = dauTam ?? (cell.dau ?? cell.tuanDoiTu !== null);
  const doiDau = async (bat: boolean): Promise<boolean> => {
    const ok = await onDau(bat, bat ? () => void doiDau(false) : undefined);
    if (ok) setDauTam(bat);
    return ok;
  };
  const coDiem = cell.diem !== null;
  const diemDaLuu = () => (coDiem ? String(cell.diem) : dau ? '-' : '');
  const tongDaLuu = () => (cell.tong !== null ? String(cell.tong)
    : tongLaySan && !coDiem && tongCot !== null ? String(tongCot) : '');
  const [diem, setDiem] = useState(diemDaLuu());
  const [tong, setTong] = useState(tongDaLuu());
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [canhBao, setCanhBao] = useState<{ o: 'diem' | 'tong'; cau: string } | null>(null);
  const cap = useRef<HTMLSpanElement>(null);
  const dangGui = useRef(false);
  const lanDaDien = useRef(dienTong?.lan ?? 0);
  /* Ô trái vừa được GÕ thật — ↓ điền tổng hay con trỏ đi qua không bao giờ tính là gõ lại "-". */
  const goDiem = useRef(false);
  const tongRef = useRef<HTMLInputElement>(null);
  /* PR-BV (L2): ô "-" của tuần cũ khi tuần mới đã có điểm — chỉ nhận xoá. */
  const [conDau, setConDau] = useState(true);
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
  const ketQuaChu = cell.ketQua === 'pass' ? t('Đạt') : cell.ketQua === 'fail' ? t('Chưa đạt') : null;
  const lamBu = dau && coDiem && cell.tuanHienTai
    ? t('Làm bù ở {tuanHienTai}{x}.', { tuanHienTai: cell.tuanHienTai, x: cell.tuanDoiTu ? t(' (dời từ {tuanDoiTu})', { tuanDoiTu: cell.tuanDoiTu }) : '' }) : '';

  /* `laDau` = lệnh "-" (ghi/gỡ dấu): không thành thì ô về giá trị đã lưu — không để một "-" nằm đó như đã ghi. */
  const gui = async (lam: () => Promise<boolean>, laDau = false) => {
    dangGui.current = true;
    setBusy(true);
    const ok = await lam();
    dangGui.current = false;
    setBusy(false);
    if (ok || laDau) { setDirty(false); goDiem.current = false; }   // lỗi điểm thì giữ bản nháp để sửa và thử lại
  };

  /** Lỗi nhập của cặp ô chưa có điểm (ngoài lệnh "-") — một luật cho `commit` và cho phím Enter (A5). */
  const loiNhap = (d: string, tt: string): { o: 'diem' | 'tong'; cau: string } | null => {
    if (d !== '' && !SO_NGUYEN.test(d)) return { o: 'diem', cau: t('Số câu đúng là số nguyên, hoặc "-" nếu em không làm bài.') };
    if (tt !== '' && (!SO_NGUYEN.test(tt) || Number(tt) <= 0)) return { o: 'tong', cau: t('Tổng số câu là số nguyên lớn hơn 0.') };
    if (d !== '' && tt === '') return { o: 'tong', cau: t('Nhập cả tổng số câu.') };
    if (d !== '' && Number(d) > Number(tt)) return { o: 'diem', cau: t('Số câu đúng ({d}) không thể lớn hơn tổng ({t}).', { d, t: tt }) };
    return null;
  };

  const commit = async () => {
    if (!dirty || dangGui.current) return;
    const d = diem.trim();
    const tt = tong.trim();
    if (d === '-') {
      /* Đã mang dấu: chỉ dời tiếp khi tuần mới đã tới VÀ người dùng thật sự gõ lại "-" (Q4). NHAP-DIEM-b: "-" lần đầu trước tuần thi = báo trước
         (máy chủ ghi đúng tuần thi, dời tuần sau nó) — không còn chặn. */
      if (dau && (cell.chuaToiTuan || !goDiem.current)) { setDirty(false); goDiem.current = false; return; }
      setCanhBao(null);
      return gui(() => doiDau(true), true);
    }
    if (d === '' && dau) { setCanhBao(null); return gui(() => doiDau(false), true); }
    const loi = loiNhap(d, tt);
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
    const total = tt === '' ? null : Number(tt);
    setCanhBao(null);
    if (score === cell.diem && total === cell.tong) { setDirty(false); return; }
    return gui(() => onSave({ score, total }));
  };
  const huy = () => { setDiem(diemDaLuu()); setTong(tongDaLuu()); setDirty(false); setCanhBao(null); goDiem.current = false; };

  /*
   * LỆNH "-" KHÔNG QUA CHỮ TRONG Ô — một đường cho nút − của điện thoại và cho "gõ '-' lên ô đang hiện '-'". Ghi ngay
   * (có toast báo). NHAP-DIEM-b: ô có điểm cũng nhận (máy chủ cất điểm), chưa tới tuần thi = báo trước; chỉ không nhận khi đang gửi.
   */
  const ghiDau = () => {
    if (dangGui.current) return;
    setCanhBao(null);
    void gui(() => doiDau(true), true);
  };
  /*
   * GÕ "-" LÊN Ô ĐANG HIỆN "-": giá trị không đổi (đè lên "-" đang chọn) hoặc thành "--" (con trỏ sau "-") — cả hai
   * đều không phải điều người dùng muốn. Ô mang dấu → đó là lệnh gõ lại "-" (dời tiếp khi tuần mới đã tới); "-" đang gõ
   * dở của ô chưa có dấu → chỉ chặn "--", "-" đó lưu khi rời ô như thường. Ba lối vào: xem `useGoLaiDau`.
   */
  const goLaiDau = () => { if (dau) ghiDau(); };
  /* Nút "Vắng" (điện thoại, C2): đúng lệnh của gõ "-" — thông báo ngắn do `onDau` lo (K4, không Hoàn tác). */
  const bamVang = () => {
    if (dangGui.current) return;
    setCanhBao(null);
    void gui(() => doiDau(true), true);
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
      const loi = dirty && d !== '-' && !(d === '' && dau) ? loiNhap(d, tong.trim()) : null;
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
  const nutDauTitle = dau ? t('Em lại không làm bài — môn này dời tiếp sang tuần sau')
    : t('Em không làm bài — môn này dời sang tuần sau');

  /*
   * ---- PR-BV (L2, rủi ro 1): xem TUẦN CÓ "-" mà tuần mới đã có điểm — ô hiện "-" kèm tuần mới. Xoá "-" (tẩy ô + Enter / rời ô) = hết
   * vắng: lần vắng −1, lịch và điểm ở tuần mới giữ nguyên. Gõ khác thì ô về "-" (điểm sửa ở tuần mới).
   */
  if (cell.oTuanCu && dau && coDiem) {
    const duoi = cell.tuanHienTai ? <span className="text-xs tabular-nums text-slate-400 leading-4" data-phu-odiem="">→ {cell.tuanHienTai}</span> : null;
    const tieuDe = t('Đã có điểm ở {x}. Xoá "-" = hết vắng, giữ lịch và điểm.', { x: cell.tuanHienTai ?? t('tuần mới') });
    if (!cell.goDau) {
      return <span className="inline-flex flex-col items-center tabular-nums text-slate-400" title={tieuDe}><span>-</span>{duoi}</span>;
    }
    /* Máy chủ từ chối (quá khung, mạng…) → ô về "-": không để một ô trống trông như đã gỡ. */
    const goNgay = () => {
      if (conDau || dangGui.current) return;
      void gui(async () => { const ok = await doiDau(false); if (!ok) setConDau(true); return ok; }, true);
    };
    return (
      <span className="inline-flex flex-col items-end gap-0.5">
        <input ref={inputRef} className={oSo} inputMode="numeric" value={conDau ? '-' : ''} disabled={busy} title={tieuDe}
          aria-label={t('{tenMon} — dấu "-" tuần này. Xoá để bỏ vắng', { tenMon })}
          onChange={(e) => setConDau(e.target.value.trim() !== '')}
          onBlur={goNgay}
          onKeyDown={(e) => {
            if (e.key === 'Enter') goNgay();
            if (e.key === 'Escape') { e.preventDefault(); setConDau(true); }
            onKeyDown?.(e);
          }} />
        {duoi}
      </span>
    );
  }

  /* ---- Chỉ đọc: môn không được phân công. */
  if (!canEdit) {
    const khongDay = t('Bạn không được phân công kỹ năng này.');
    if (coDiem) {
      return (
        <span className="inline-flex flex-col items-center justify-center tabular-nums text-slate-400"
          title={[khongDay, pt && ketQuaChu ? `${ketQuaChu} · ${pt}.` : '', lamBu].filter(Boolean).join(' ')}>
          {lon ? (
            <>
              <span className="inline-flex items-center gap-1">
                <span className={cell.ketQua === 'fail' ? 'text-kq-duoi' : ''}>{o.hien || `${cell.diem}/?`}</span>
                <ChoNutDau />
              </span>
              <DongDatPhanTram ketQua={cell.ketQua} tiLe={cell.tiLe} chiChu={chiChuKetQua} />
            </>
          ) : (
            <ODiem kieu="ti-le" so={String(cell.diem)} tong={cell.tong ?? undefined} tongCot={tongCot ?? undefined} nhan={tenMon}
              kq={cell.ketQua === 'pass' ? 'dat' : cell.ketQua === 'fail' ? 'duoi' : null} />
          )}
        </span>
      );
    }
    /* OV-15b (4 dáng ô): ô của người khác chưa có điểm = trống (chữ chỉ cho trình đọc màn hình). */
    const chu = cell.khongDuThi ? t('Vắng') : dau ? '-' : cell.chuaToiTuan && cell.tuanHienTai ? cell.tuanHienTai : <><span className="sr-only">{t('Chưa có')}</span><span className="text-transparent" aria-hidden>0</span></>;
    const title = cell.khongDuThi ? t('{khongDay} Vắng · {x}', { khongDay, x: cell.tuanHienTai ?? '' }).trim()
      : dau && cell.tuanHienTai ? t('{khongDay} Đã dời sang {tuanHienTai}.', { khongDay, tuanHienTai: cell.tuanHienTai })
      : cell.chuaToiTuan && cell.tuanHienTai ? t('{khongDay} Làm bài {tuan}.', { khongDay, tuan: cell.tuanHienTai }) : khongDay;
    const chuDoc = <span className="text-xs text-slate-500 tabular-nums" title={title}>{chu}</span>;
    /* Điện thoại: giữ chỗ nút "−" để chữ thẳng cột với ô nhập của các dòng khác. */
    return lon ? <span className="inline-flex items-center gap-1">{chuDoc}<ChoNutDau /></span> : chuDoc;
  }

  /* ---- Hai ô nhập. Ô trái nhận số câu đúng hoặc "-". NHAP-DIEM-b (chủ SP 14/11, thay RB-5 "hộp lý do"): ô ĐÃ CÓ điểm sửa ngay tại ô — đổi số +
   * Enter lưu, xoá trống = xoá điểm, gõ "-" = vắng (máy chủ cất điểm; Hoàn tác / Khôi phục trả lại). */
  const dangDau = diem.trim() === '-';
  const titleDiem = canhBao?.o === 'diem' ? canhBao.cau
    : coDiem ? [pt && ketQuaChu ? `${ketQuaChu} · ${pt}.` : '', t('Đã có điểm — bấm để sửa.'), lamBu].filter(Boolean).join(' ')
    : cell.khongDuThi ? t('Vắng · {x}. Xoá "-" để bỏ; gõ số khi em đã làm bài.', { x: cell.tuanHienTai ?? '' })
    : dau && !cell.chuaToiTuan
      ? t('Đã dời sang {x} (từ {x2}). Gõ số khi em đã làm bài; em lại không làm bài thì gõ lại "-" để dời tiếp.', { x: cell.tuanHienTai ?? t('tuần này'), x2: cell.tuanDoiTu ?? t('tuần cũ') })
    : dau ? t('Đã dời sang {x}. Xoá dấu "-" để trả lịch về {x2}; gõ số khi em đã làm bài.', { x: cell.tuanHienTai ?? t('tuần sau'), x2: cell.tuanDoiTu ?? t('tuần cũ') })
    : t('Số câu đúng. Gõ "-" nếu em không làm bài: môn này dời sang tuần sau.');
  const titleTong = canhBao?.o === 'tong' ? canhBao.cau
    : o.vienVang ? t('Khác tổng của cột ({tongCot}) — em làm đề khác.', { tongCot }) : t('Tổng số câu của đề em làm.');
  return (
    <span className="inline-flex flex-col items-center">
    <span ref={cap} className="inline-flex items-center justify-center gap-1"
      onBlur={(e) => { if (!cap.current?.contains(e.relatedTarget as Node)) void commit(); }}>
      <input ref={goLai.gan}
        className={`${oSo} ${canhBao?.o === 'diem' ? 'border-rose-400/70' : ''} ${dangDau ? 'text-slate-400' : ''} ${coDiem && !dirty ? `font-bold ${cell.ketQua === 'fail' ? 'text-kq-duoi' : cell.ketQua === 'pass' ? 'text-kq-bang' : ''}` : ''}`}
        aria-invalid={canhBao?.o === 'diem' ? true : undefined} aria-describedby={canhBao?.o === 'diem' ? idLoi : undefined}
        inputMode="numeric" value={diem} disabled={busy} title={titleDiem}
        /* NHAP-DIEM-b: ô đã có điểm — vào ô là chọn cả số, gõ là thay (như hộp sửa cũ); bấm chuột không bỏ chọn. */
        onFocus={coDiem ? (e) => e.currentTarget.select() : undefined}
        onMouseUp={coDiem && !dirty ? (e) => e.preventDefault() : undefined}
        aria-label={t('{tenMon} — số câu đúng. Gõ "-" nếu em không làm bài', { tenMon })}
        onChange={(e) => {
          const v = e.target.value.trim();
          /* Dự phòng: "--" lọt vào ô (bàn phím ảo không cho chặn trước) → giữ "-", đi đúng đường gõ lại "-". */
          if (goLai.doi(v)) return;
          setDiem(e.target.value); setDirty(true); goDiem.current = true; 
          if (canhBao?.o === 'diem') setCanhBao(null);
        }} onKeyDown={phim} />
      <span className="text-slate-500">/</span>
      <input ref={tongRef} className={`${oSo} ${canhBao?.o === 'tong' ? 'border-rose-400/70' : o.vienVang ? 'border-amber-400/80' : ''}`}
        inputMode="numeric" value={dangDau ? '' : tong} disabled={busy || dangDau} placeholder={dangDau ? '' : t('tổng')}
        title={dangDau ? t('Ô mang dấu "-" chưa cần tổng.') : titleTong}
        aria-invalid={canhBao?.o === 'tong' ? true : undefined} aria-describedby={canhBao?.o === 'tong' ? idLoi : undefined}
        aria-label={t('{tenMon} — tổng số câu', { tenMon })}
        onChange={(e) => { setTong(e.target.value); setDirty(true); }} onKeyDown={phim} />
      {lon && <NutDau title={nutDauTitle} an={!!cell.khongDuThi} tat={busy} onBam={bamVang} />}
    </span>
    {lon && coDiem && <DongDatPhanTram ketQua={cell.ketQua} tiLe={cell.tiLe} chiChu={chiChuKetQua} />}
    {cell.khongDuThi && dangDau && <span className="text-xs leading-4 text-slate-400" data-phu-odiem="">{t('Vắng')}</span>}
    <DongLoiNhap id={idLoi} cau={canhBao?.cau ?? null} />
    </span>
  );
}
