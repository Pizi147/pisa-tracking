import { Fragment, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.ts';
import { Info } from './ui.tsx';
import { BaoOTrongNhan } from './ONgay.tsx';
import { buocDanhSach, chotChuGo, locNguoiChon, skillShort, type NguoiChon } from '@shared/domain/index.ts';
import { useSession } from '../lib/session.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { useBamNgoai } from './useBamNgoai.ts';

export type Person = { id: number; name: string; title: string | null; role: string | null; branches: string[] };

/** `Nguyễn A · Admin CN · CP` — đủ để không chọn nhầm hai người trùng tên. */
function contextOf(p: Person): string {
  return [p.role, p.branches.join('/')].filter(Boolean).join(' · ');
}

function usePeopleSearch(term: string) {
  const [rows, setRows] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);
  useEffect(() => {
    const my = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await api.get<Person[]>(`/ref/people${term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ''}`);
        if (my === seq.current) setRows(r);          // bỏ qua kết quả của lần gõ cũ
      } catch { if (my === seq.current) setRows([]); } finally { if (my === seq.current) setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [term]);
  return { rows, loading };
}

/**
 * Chọn MỘT người — gõ để tìm, không kéo một dropdown dài.
 *
 * Một trung tâm có hàng chục tài khoản và nhiều người trùng tên, nên mỗi dòng kèm vai trò
 * và chi nhánh; một danh sách chỉ có tên là một danh sách chọn nhầm người.
 */
export function PersonPicker({ value, valueName, onChange, disabled, placeholder = t('Gõ tên để tìm…') }: {
  value: number | null; valueName?: string | null;
  onChange: (id: number | null, person: Person | null) => void;
  disabled?: boolean; placeholder?: string;
}) {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const { rows, loading } = usePeopleSearch(open ? term : '');
  const box = useRef<HTMLDivElement>(null);

  useBamNgoai(open, () => setOpen(false), box);

  if (value && !open) {
    return (
      <div className="field flex items-center justify-between gap-2">
        <span className="text-slate-100 truncate">{valueName ?? `#${value}`}</span>
        {!disabled && (
          <span className="flex gap-1 shrink-0">
            <button className="btn btn-sm" onClick={() => { setTerm(''); setOpen(true); }}>{t('Đổi')}</button>
            <button className="btn btn-sm" onClick={() => onChange(null, null)}>{t('Bỏ')}</button>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={box}>
      <input
        className="field" value={term} disabled={disabled} placeholder={placeholder}
        onFocus={() => setOpen(true)} onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
      />
      {open && (
        <div
          className="absolute z-30 mt-1 w-[min(24rem,calc(100vw-2rem))] max-h-64 overflow-y-auto surface-2 rounded-lg border shadow-xl"
          style={{ borderColor: 'var(--line-strong)' }}
        >
          {loading && <div className="px-3 py-2 text-xs text-slate-500">{t('Đang tìm…')}</div>}
          {!loading && rows.length === 0 && <div className="px-3 py-2 text-xs text-slate-500">{t('Không tìm thấy ai khớp.')}</div>}
          {rows.map((p) => (
            <button
              key={p.id}
              className="w-full text-left px-3 py-2 hover:bg-white/5 appearance-none bg-transparent border-0"
              onClick={() => { onChange(p.id, p); setOpen(false); setTerm(''); }}
            >
              <div className="text-sm text-slate-100">{p.name}</div>
              <div className="text-xs text-slate-500">{contextOf(p) || p.title || '—'}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Chọn NHIỀU người theo dõi.
 *
 * Người theo dõi không phải người làm và không chịu trách nhiệm hoàn thành — họ chỉ cần
 * biết khi tiến độ đổi. Quản lý của chính chi nhánh được hệ thống thêm sẵn (chip "tự động"),
 * vì đó là câu trả lời hệ thống đã biết; người tạo chỉ thêm ai ngoài danh sách đó.
 */
export function FollowerPicker({ value, onChange, autoNames = [], disabled }: {
  value: Person[]; onChange: (people: Person[]) => void;
  autoNames?: string[]; disabled?: boolean;
}) {
  const chosen = useMemo(() => new Set(value.map((p) => p.id)), [value]);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {autoNames.map((n) => (
          <Info key={`auto-${n}`} title={t('Quản lý chi nhánh — hệ thống tự thêm')}>{n} · {t('tự động')}</Info>
        ))}
        {value.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1">
            <Info>{p.name}</Info>
            {!disabled && (
              <button
                className="text-slate-500 hover:text-slate-200 text-xs"
                onClick={() => onChange(value.filter((x) => x.id !== p.id))}
                aria-label={t('Bỏ {ten} khỏi người theo dõi', { ten: p.name })}
              >✕</button>
            )}
          </span>
        ))}
        {value.length === 0 && autoNames.length === 0 && (
          <span className="text-xs text-slate-500">{t('Chưa có ai theo dõi thêm')}</span>
        )}
      </div>
      {!disabled && (
        <PersonPicker
          value={null}
          placeholder={t('Thêm người theo dõi…')}
          onChange={(_, p) => { if (p && !chosen.has(p.id)) onChange([...value, p]); }}
        />
      )}
    </div>
  );
}

// =========================================================================== ChonNguoi (PR-Form F-2)

type NguoiKetQua = { id: number; name: string; role: string | null; branches: string[]; cungLop: boolean; monDay: string[] };

function useNguoiSearch(
  term: string, nhom: 'giao_vien' | 'nhan_vien', studentId: number | null | undefined, active: boolean,
  /** PR-S5F-b: chỉ GV ở chi nhánh lớp của em (`studentId`) — người dạy bổ trợ. */
  cungChiNhanh = false,
) {
  const [rows, setRows] = useState<NguoiKetQua[]>([]);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);
  useEffect(() => {
    if (!active) { setRows([]); return; }
    const my = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ q: term.trim(), nhom });
        if (studentId) qs.set('studentId', String(studentId));
        if (cungChiNhanh) qs.set('cungChiNhanh', '1');
        const r = await api.get<NguoiKetQua[]>(`/ref/nguoi?${qs.toString()}`);
        if (my === seq.current) setRows(r);          // bỏ qua kết quả của lượt gõ cũ
      } catch { if (my === seq.current) setRows([]); } finally { if (my === seq.current) setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [term, nhom, studentId, active, cungChiNhanh]);
  return { rows, loading };
}

/** TU-a: một dòng của `GET /tutors/chon` (máy chủ `tutors/chon.ts`). */
export type TutorChon = { id: number; ten: string; noiDay: string | null; kyNang: string; sdtDuoi: string | null; goiY: boolean; hinhThuc: 'offline' | 'online' | null };
export type KetQuaTutorChon = { ds: TutorChon[]; dienSan: { tutorId: number | null; ten: string; hinhThuc: 'offline' | 'online' | null } | null; nhomGoiY: string | null };
/**
 * Tham số ô chọn tutor: `paId` (buổi của Ghi kết quả PA Tutor), `classId` (ô Người dạy chung của Xác nhận PA cùng lúc — lớp của nhóm, OV-15i2)
 * hoặc `studentId` (ô Người dạy PA Tutor). `chi`: chỉ tutor (ô Tutor của buổi).
 */
export type ThamSoTutor = { paId?: number | null; classId?: number | null; studentId?: number | null; chi?: boolean };

// ponytail: chép khuôn trễ + bộ đếm lượt của `useNguoiSearch` (khác kiểu trả về); gộp một hook chung khi có nơi gọi thứ ba.
function useTutorChon(term: string, tutor: ThamSoTutor | undefined, active: boolean) {
  const [kq, setKq] = useState<KetQuaTutorChon | null>(null);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);
  const khoa = tutor ? `${tutor.paId ?? ''}:${tutor.classId ?? ''}:${tutor.studentId ?? ''}` : '';
  useEffect(() => {
    if (!active || !khoa) { setKq(null); return; }
    const my = ++seq.current;
    setLoading(true);
    const h = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ q: term.trim() });
        if (tutor?.paId) qs.set('paId', String(tutor.paId));
        else if (tutor?.classId) qs.set('classId', String(tutor.classId));
        else if (tutor?.studentId) qs.set('studentId', String(tutor.studentId));
        const r = await api.get<KetQuaTutorChon>(`/tutors/chon?${qs.toString()}`);
        if (my === seq.current) setKq(r);
      } catch { if (my === seq.current) setKq(null); } finally { if (my === seq.current) setLoading(false); }
    }, 250);
    return () => clearTimeout(h);
  }, [term, khoa, active]); // eslint-disable-line react-hooks/exhaustive-deps
  return { kq, loading };
}

/** Dòng phụ của một tutor: `L · R · Monbay · …908` (3 số cuối SĐT, không đủ số — đặc tả Tutor mục 12.5). */
export const phuTutor = (x: TutorChon) =>
  [x.kyNang.split(',').join(' · '), x.noiDay ? dich(x.noiDay) : t('Chưa có nơi dạy'), x.sdtDuoi ? `…${x.sdtDuoi}` : null].filter(Boolean).join(' · ');

/** `dạy L · R lớp này` · hoặc `vai · chi nhánh` cho một dòng kết quả tìm. */
function nguoiContextOf(r: NguoiKetQua): string {
  if (r.cungLop && r.monDay.length) return t('dạy {mon} lớp này', { mon: r.monDay.map(skillShort).join(' · ') });
  return [r.role, r.branches.join('/')].filter(Boolean).join(' · ') || (r.cungLop ? t('dạy lớp này') : '—');
}

/** Một người trong danh sách của ô: tên + dòng phụ (vai · chi nhánh, "3 lớp — dạy được L", mã học viên…). */
export type NguoiTrongDs = { id: number; ten: string; phu?: string;
  /** TU-a: tiêu đề nhóm vẽ trước dòng đầu của nhóm ("Monbay · L", "Khác", "Tutor", "Giáo viên"). */
  nhom?: string;
  /** TU-a: dòng là một tutor (`/tutors/chon`), không phải tài khoản. */
  tutor?: TutorChon };

type ChonNguoiOption =
  | { kind: 'trong' }
  | { kind: 'toi' }
  | { kind: 'nguoi'; row: NguoiTrongDs }
  | { kind: 'ngoai'; text: string };

/**
 * Ô chọn MỘT người thực hiện/phụ trách — dùng chung cho Case học thuật và Ý thức (PR-Form F-2, §22.5).
 *
 * Khác `PersonPicker` (gọi `/ref/people`, đòi `MEETING_VIEW`): đây gọi `/ref/nguoi` — mọi người đăng nhập gọi được,
 * vào ô là có danh sách (T14: chưa gõ → 20 người, GV cùng lớp đầu), tìm không dấu. `choNgoai` → LUÔN có dòng cuối
 * "Dùng tên ngoài hệ thống" (tên cần ≥ 2 ký tự, Q11). ↑/↓ đi vòng, Enter chốt, Esc đóng danh sách (không đóng panel).
 * Mở panel không tự nhảy vào ô gõ (Q18 — không bật bàn phím điện thoại; panel đang giữ focus ở khung): danh sách mở khi focus/bấm
 * vào ô, hoặc ngay khi bấm "Đổi". `tuMo`: nơi gọi vừa được bấm để chọn người (menu "Chọn giáo viên…") → focus + mở ngay.
 * `ds` (PR-O-CHON, chủ sản phẩm 07/10): danh sách người CÓ SẴN của nơi gọi (GV phân công được theo chi nhánh, học viên của lớp)
 * — lọc không dấu tại chỗ, không gọi `/ref/nguoi`, giữ đúng danh sách + quyền của nơi gọi. `choTrong`: dòng đầu = bỏ chọn.
 */
export function ChonNguoi({
  value, onChange, nhom, studentId, choToi = true, choNgoai = true, cungChiNhanh = false,
  khongDoi, macDinhTrong, ariaLabel, disabled, tuMo, ds, choTrong, placeholder, id, onBlur, invalid, khongKhop, tutor,
}: {
  value: NguoiChon | null;
  onChange: (v: NguoiChon | null, tutor?: TutorChon) => void;
  nhom: 'giao_vien' | 'nhan_vien';
  studentId?: number | null;
  choToi?: boolean; choNgoai?: boolean;
  /** PR-S5F-b: chỉ GV cùng chi nhánh lớp của em — ô Người dạy bổ trợ. */
  cungChiNhanh?: boolean;
  /** Ô Điều chỉnh: khi `value = null` hiện "Không đổi · hiện: {khongDoi}". */
  khongDoi?: string;
  /** Ô Phụ trách: khi `value = null` hiện nguyên câu này (ví dụ "Mặc định: GVCN của lớp"). */
  macDinhTrong?: string;
  ariaLabel?: string;
  disabled?: boolean;
  tuMo?: boolean;
  /** Danh sách có sẵn — không gọi máy chủ (xem trên). */
  ds?: NguoiTrongDs[];
  /** Nhãn dòng đầu danh sách, chọn → `onChange(null)` (ví dụ "— Chưa chọn —"). */
  choTrong?: string;
  placeholder?: string;
  /** Như `ONgay`: id cho nhãn / "n ô cần sửa ↑", rời ô, viền lỗi. */
  id?: string; onBlur?: () => void; invalid?: boolean;
  /** Chữ khi gõ không khớp ai (ô gõ tên lớp, PR-LCb: `Không có lớp khớp “…”`). */
  khongKhop?: (go: string) => string;
  /**
   * TU-a (đặc tả Tutor mục 5, 6): danh sách tutor. `chi` — ô Tutor của một buổi: chỉ tutor (gợi ý trước, "Khác" sau), dòng cuối "Tutor khác: «…»";
   * chọn tutor → `{ kieu: 'tai_khoan', id: tutorId }`. Không `chi` — ô Người dạy PA Tutor: nhóm "Tutor" đứng đầu, chọn tutor lưu như người ngoài (tên).
   * Đối số thứ hai của `onChange` là dòng tutor đã chọn (hình thức tự suy, điền sẵn buổi).
   */
  tutor?: ThamSoTutor;
}) {
  const { session } = useSession();
  const [editing, setEditing] = useState(!value && khongDoi === undefined && macDinhTrong === undefined);
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(!!tuMo);
  const [activeIndex, setActiveIndex] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const chiTutor = !!tutor?.chi;
  const tim = useNguoiSearch(term, nhom, studentId, editing && !ds && !chiTutor, cungChiNhanh);
  const tt = useTutorChon(term, tutor, editing && open && !!tutor);   // chỉ nạp khi danh sách mở
  const rows = useMemo<NguoiTrongDs[]>(() => {
    /* TU-a: tutor — gợi ý (nơi dạy = chi nhánh lớp + kỹ năng PA) rồi "Khác"; ô Người dạy: nhóm "Tutor" trước người. */
    const dsTutor: NguoiTrongDs[] = (tt.kq?.ds ?? []).map((x) => ({
      id: x.id, ten: x.ten, phu: phuTutor(x), tutor: x,
      nhom: chiTutor ? (x.goiY ? tt.kq?.nhomGoiY ?? t('Gợi ý') : t('Khác')) : t('Tutor'),
    }));
    if (chiTutor) return dsTutor;
    const nguoi: NguoiTrongDs[] = ds ? locNguoiChon(ds, term)
      : tim.rows.map((r) => ({ id: r.id, ten: r.name, phu: nguoiContextOf(r), ...(dsTutor.length ? { nhom: nhom === 'giao_vien' ? t('Giáo viên') : t('Nhân viên') } : {}) }));
    return [...dsTutor, ...nguoi];
  }, [ds, term, tim.rows, tt.kq, chiTutor, nhom]);
  const loading = (!ds && !chiTutor && tim.loading) || (!!tutor && tt.loading && !tt.kq);
  const oId = id ?? `${uid}-o`;
  /* Nằm dưới Truong/Field: nhãn trỏ vào ô gõ (label htmlFor), không bọc cả danh sách + nút "Đổi" (`BaoOTrongNhan`). */
  const bao = useContext(BaoOTrongNhan);
  /* Đang hiện tên (chưa sửa): nhãn trỏ vào nút "Đổi"; không có nút (disabled) thì không trỏ đâu. */
  const coO = editing || !disabled;
  useLayoutEffect(() => { bao?.(coO ? oId : null); return () => bao?.(null); }, [bao, oId, coO]);

  /* Chỉ khi VỪA chuyển sang sửa (bấm "Đổi") mới focus + mở; lúc vẽ đầu thì không, trừ `tuMo`. */
  const suaTruoc = useRef(tuMo ? false : editing);
  useEffect(() => {
    if (editing && !suaTruoc.current) {
      setOpen(true);
      setActiveIndex(-1);
      inputRef.current?.focus();
    }
    suaTruoc.current = editing;
  }, [editing]);

  /* Giá trị đến sau khi ô đã vẽ (panel nạp phân công hiện tại) → hiện tên, trừ khi người dùng đang gõ trong danh sách.
     So theo người (kiểu/id), không theo object: nơi gọi dựng lại object mỗi lần vẽ. */
  const khoaGiaTri = !value ? '' : value.kieu === 'tai_khoan' ? `u${value.id}` : value.kieu === 'ngoai' ? `n${value.ten}` : value.kieu;
  useEffect(() => { if (khoaGiaTri && !open) setEditing(false); }, [khoaGiaTri]); // eslint-disable-line react-hooks/exhaustive-deps
  const coChuThayThe = !!value || khongDoi !== undefined || macDinhTrong !== undefined;

  const options = useMemo<ChonNguoiOption[]>(() => {
    const out: ChonNguoiOption[] = [];
    if (choTrong && !term.trim()) out.push({ kind: 'trong' });   // đang gõ tên → ↓ Enter chọn người khớp đầu, không phải dòng trống
    if (choToi) out.push({ kind: 'toi' });
    for (const r of rows) out.push({ kind: 'nguoi', row: r });
    if (choNgoai) out.push({ kind: 'ngoai', text: term.trim() });
    return out;
  }, [choTrong, choToi, rows, choNgoai, term]);
  /** Dòng "tên ngoài" chưa đủ 2 ký tự: hiện mờ, bấm không làm gì, mũi tên bỏ qua. */
  const tat = (opt: ChonNguoiOption) => opt.kind === 'ngoai' && opt.text.length < 2;
  const chonDuoc = options.flatMap((o, i) => (tat(o) ? [] : [i]));
  /* Đang gõ: TÔ SÁNG SẴN người khớp đầu — thấy trước Enter sẽ chọn ai (không chọn ngầm dòng không tô sáng). */
  useEffect(() => { setActiveIndex(term.trim() ? options.findIndex((o) => o.kind === 'nguoi') : -1); }, [term, options]);

  const chon = (opt: ChonNguoiOption) => {
    if (tat(opt)) return;
    if (opt.kind === 'trong') onChange(null);
    else if (opt.kind === 'toi') onChange({ kieu: 'toi' });
    else if (opt.kind === 'nguoi' && opt.row.tutor && !chiTutor) onChange({ kieu: 'ngoai', ten: opt.row.ten, phu: t('Tutor') }, opt.row.tutor);
    else if (opt.kind === 'nguoi') onChange({ kieu: 'tai_khoan', id: opt.row.id, ten: opt.row.ten, phu: opt.row.phu }, opt.row.tutor);
    else onChange({ kieu: 'ngoai', ten: opt.text, ...(chiTutor ? { phu: t('Tutor khác') } : {}) });
    setTerm('');
    setOpen(false);
    /* Bỏ chọn ở ô không có chữ thay thế (phân công GV trống): ở lại ô gõ, không hiện "—" + Đổi. */
    if (opt.kind !== 'trong' || khongDoi !== undefined || macDinhTrong !== undefined) setEditing(false);
  };

  /**
   * Rời ô (bấm ra ngoài, Tab) — MỘT đường cho mọi cách rời: đóng danh sách; chữ gõ khớp đúng một người thì chọn người đó
   * (gõ đủ tên rồi bấm Lưu không mất ý định), không thì xoá chữ gõ — ô không bao giờ hiện chữ như đã chọn mà thật ra trống.
   */
  const roiO = () => {
    setOpen(false);
    setActiveIndex(-1);
    const nguoi = loading ? null : chotChuGo(term, options.filter((o) => o.kind === 'nguoi'));
    if (nguoi) { chon(nguoi); return; }
    setTerm('');
    if (coChuThayThe) setEditing(false);
  };

  const nguoiLabel = nhom === 'giao_vien' ? t('giáo viên') : t('người');

  /* Chỉ xem mà trống: hiện "Chưa chọn", không hiện ô gõ khoá có chữ gợi ý. */
  if (!editing || (disabled && !value)) {
    let chinh: string; let phu: string;
    if (value?.kieu === 'toi') { chinh = t('Tôi'); phu = session?.user?.fullName ?? ''; }
    else if (value?.kieu === 'tai_khoan') { chinh = value.ten; phu = value.phu ?? ''; }
    else if (value?.kieu === 'ngoai') { chinh = value.ten; phu = value.phu ?? t('ngoài hệ thống'); }
    else if (khongDoi !== undefined) { chinh = t('Không đổi · hiện: {gt}', { gt: khongDoi }); phu = ''; }
    else { chinh = macDinhTrong ?? (disabled ? t('Chưa chọn') : '—'); phu = ''; }

    return (
      /* Cùng chiều cao ô gõ (lưới Tạo nhiều lớp): nút Đổi -my-1 nằm gọn trong dòng chữ; vùng bấm điện thoại = cả ô (bấm đâu cũng mở). */
      <div className={`field flex items-center justify-between gap-2${invalid ? ' border-late' : ''}${disabled ? '' : ' cursor-pointer'}`}
        onBlur={onBlur} onClick={disabled ? undefined : () => setEditing(true)}>
        <span className="min-w-0 truncate">
          <span className="text-slate-100">{chinh}</span>
          {phu && <span className="text-slate-500 text-xs"> · {phu}</span>}
        </span>
        {/* Nhãn ô trỏ vào nút này (htmlFor) — aria-label giữ chữ "Đổi" trong tên đọc, không thành tên ô trơn. */}
        {!disabled && <button id={oId} type="button" className="btn btn-sm -my-1 h-7 shrink-0 !py-0 max-sm:min-h-0" aria-label={ariaLabel ? t('Đổi · {o}', { o: ariaLabel }) : undefined}
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}>{t('Đổi')}</button>}
      </div>
    );
  }

  const activeId = activeIndex >= 0 && activeIndex < options.length ? `${uid}-opt-${activeIndex}` : undefined;
  /* Dòng trạng thái nằm dưới danh sách người, TRÊN dòng "Dùng tên ngoài hệ thống" (mockup 22 §4). */
  const trangThai = loading
    ? <div className="px-3 py-2 text-xs text-slate-500">{t('Đang tìm…')}</div>
    : term.trim() && rows.length === 0
      ? <div className="px-3 py-2 text-xs text-slate-500">{khongKhop ? khongKhop(term.trim()) : t('Không tìm thấy {ai} khớp «{chu}»', { ai: nguoiLabel, chu: term.trim() })}</div>
      : null;

  return (
    <div ref={box} onBlur={(e) => {
      if (box.current?.contains(e.relatedTarget as Node)) return;   // focus còn trong ô (dòng danh sách) → chưa rời
      roiO();
      onBlur?.();
    }}>
      <input
        ref={inputRef}
        id={oId}
        className={`field${invalid ? ' border-late' : ''}`}
        aria-invalid={invalid || undefined}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${uid}-listbox`}
        aria-activedescendant={activeId}
        aria-label={ariaLabel ?? t('Chọn người')}
        autoComplete="off"
        value={term}
        disabled={disabled}
        placeholder={placeholder ?? (nhom === 'giao_vien' ? t('Gõ tên giáo viên…') : t('Gõ tên…'))}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setTerm(e.target.value); setOpen(true); setActiveIndex(-1); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {           // Home/End để nguyên cho con trỏ trong ô gõ
            e.preventDefault();
            setOpen(true);
            const k = buocDanhSach(chonDuoc.length, chonDuoc.indexOf(activeIndex), e.key);
            if (k !== null) {
              setActiveIndex(chonDuoc[k]);
              /* aria-activedescendant không tự cuộn: dòng đang chọn phải thấy được khi đi quá 56 (max-h) bằng mũi tên. */
              document.getElementById(`${uid}-opt-${chonDuoc[k]}`)?.scrollIntoView({ block: 'nearest' });
            }
          } else if (e.key === 'Enter') {
            /* Enter chọn ĐÚNG dòng đang tô sáng (đang gõ thì người khớp đầu đã tô sẵn); không tô sáng → không chọn. */
            if (activeIndex >= 0 && activeIndex < options.length) { e.preventDefault(); chon(options[activeIndex]); }
          } else if (e.key === 'Escape' && open) {
            e.stopPropagation();
            setOpen(false);
          }
        }}
      />
      {open && (
        /* mousedown không lấy focus khỏi ô gõ (Safari không focus nút khi bấm) → rời ô không chạy trước cú bấm chọn. */
        <div id={`${uid}-listbox`} role="listbox" onMouseDown={(e) => e.preventDefault()} className="mt-1 max-h-56 overflow-y-auto surface-2 rounded-lg border" style={{ borderColor: 'var(--line-strong)' }}>
          {options.map((opt, i) => (
            <Fragment key={opt.kind === 'nguoi' ? `${opt.row.tutor ? 't' : 'u'}${opt.row.id}` : opt.kind}>
              {opt.kind === 'ngoai' && trangThai}
              {/* TU-a: tiêu đề nhóm trước dòng đầu của mỗi nhóm (không bấm, mũi tên bỏ qua). */}
              {opt.kind === 'nguoi' && opt.row.nhom && (options[i - 1]?.kind !== 'nguoi' || (options[i - 1] as { row: NguoiTrongDs }).row.nhom !== opt.row.nhom) && (
                <div role="presentation" className="px-3 pt-2 pb-0.5 text-[11.5px] font-semibold text-slate-500">{opt.row.nhom}</div>
              )}
              <button
                id={`${uid}-opt-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                aria-disabled={tat(opt) || undefined}
                tabIndex={-1}
                type="button"
                className={`w-full text-left px-3 py-2 appearance-none bg-transparent border-0 ${
                  tat(opt) ? 'cursor-default' : i === activeIndex ? 'bg-white/5' : 'hover:bg-white/5'}`}
                onMouseEnter={() => { if (!tat(opt)) setActiveIndex(i); }}
                onClick={() => chon(opt)}
              >
                {opt.kind === 'trong' && <div className="text-sm text-slate-400">{choTrong}</div>}
                {opt.kind === 'toi' && (
                  <>
                    <div className="text-sm text-slate-100">{t('Tôi')}</div>
                    {session?.user?.fullName && <div className="text-xs text-slate-500">{session.user.fullName}</div>}
                  </>
                )}
                {opt.kind === 'nguoi' && (
                  <>
                    <div className="text-sm text-slate-100">{opt.row.ten}</div>
                    {opt.row.phu && <div className="text-xs text-slate-500">{opt.row.phu}</div>}
                  </>
                )}
                {opt.kind === 'ngoai' && (tat(opt)
                  ? <div className="text-sm text-slate-500">{chiTutor ? t('Tutor khác: gõ tên ở ô trên') : t('Dùng tên ngoài hệ thống: gõ tên ở ô trên')}</div>
                  : <div className="text-sm text-slate-100">{chiTutor ? t('Tutor khác: «{ten}»', { ten: opt.text }) : t('Dùng tên ngoài hệ thống: «{ten}»', { ten: opt.text })}</div>)}
              </button>
            </Fragment>
          ))}
          {!choNgoai && trangThai}
        </div>
      )}
    </div>
  );
}
ChonNguoi.tuNhan = true;
