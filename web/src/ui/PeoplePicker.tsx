import { Fragment, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api.ts';
import { BaoOTrongNhan } from './ONgay.tsx';
import { ToKhop } from './ToKhop.tsx';
import { useDienThoai } from './TheDong.tsx';
import { buocDanhSach, chotChuGo, locNguoiChon, skillShort, type NguoiChon } from '@shared/domain/index.ts';
import { useSession } from '../lib/session.tsx';
import { dich, t } from '@shared/i18n/index.ts';

export type Person = { id: number; name: string; title: string | null; role: string | null; branches: string[] };


// =========================================================================== ChonNguoi (PR-Form F-2 · GD-5 ô chọn có tìm)

/** `cungCn` (GD-5): có vai ở chi nhánh tham chiếu của lần tìm; `null` = không có chi nhánh tham chiếu (Quản trị). */
type NguoiKetQua = { id: number; name: string; role: string | null; branches: string[]; cungLop: boolean; monDay: string[]; cungCn?: boolean | null; lopMa?: string | null; cnMa?: string | null };

function useNguoiSearch(
  term: string, nhom: 'giao_vien' | 'nhan_vien' | 'gv_speaking', studentId: number | null | undefined, active: boolean,
  /** PR-S5F-b: chỉ GV ở chi nhánh lớp của em (`studentId`) — người dạy bổ trợ. */
  cungChiNhanh = false,
  /** GIAO-VIEC-CN (B' 9): chỉ người có vai ở chi nhánh này (Việc quản lý của một chi nhánh). */
  chiNhanh: number | null = null,
) {
  const [rows, setRows] = useState<NguoiKetQua[]>([]);
  const [loading, setLoading] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [lan, setLan] = useState(0);
  const seq = useRef(0);
  useEffect(() => {
    if (!active) { setRows([]); setLoi(null); return; }
    const my = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ q: term.trim(), nhom });
        if (studentId) qs.set('studentId', String(studentId));
        if (cungChiNhanh) qs.set('cungChiNhanh', '1');
        if (chiNhanh) qs.set('chiNhanh', String(chiNhanh));
        const r = await api.get<NguoiKetQua[]>(`/ref/nguoi?${qs.toString()}`);
        if (my === seq.current) { setRows(r); setLoi(null); }          // bỏ qua kết quả của lượt gõ cũ
      } catch (e: any) { if (my === seq.current) { setRows([]); setLoi(e?.message ?? ''); } } finally { if (my === seq.current) setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [term, nhom, studentId, active, cungChiNhanh, chiNhanh, lan]);
  return { rows, loading, loi, thuLai: () => setLan((n) => n + 1) };
}

/**
 * GD-5: tìm ở máy chủ do nơi gọi đưa (em: `/tim/hoc-vien`, có LIMIT) — trễ 250 ms, bỏ kết quả lượt gõ cũ; chữ ngắn hơn `toiThieu` thì không gọi.
 * Nhóm "liên quan trước" do nơi gọi gắn vào `nhom` của từng dòng (đã xếp đúng thứ tự).
 */
export type TimXa = { goi: (q: string) => Promise<NguoiTrongDs[]>; toiThieu?: number; goiY?: string };
// ponytail: cùng khuôn trễ + bộ đếm lượt của `useNguoiSearch` / `useTutorChon` (kiểu trả về khác); gộp một hook chung khi thêm nguồn thứ tư.
function useTimXa(term: string, tim: TimXa | undefined, active: boolean) {
  const [rows, setRows] = useState<NguoiTrongDs[]>([]);
  const [loading, setLoading] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [lan, setLan] = useState(0);
  const seq = useRef(0);
  const goi = useRef(tim?.goi);
  goi.current = tim?.goi;
  const q = term.trim();
  const ngan = !!tim && q.length < (tim.toiThieu ?? 0);
  useEffect(() => {
    const my = ++seq.current;
    if (!active || !goi.current || ngan) { setRows([]); setLoi(null); setLoading(false); return undefined; }
    setLoading(true);
    const h = setTimeout(() => {
      goi.current!(q)
        .then((r) => { if (my === seq.current) { setRows(r); setLoi(null); } })
        .catch((e: any) => { if (my === seq.current) { setRows([]); setLoi(e?.message ?? ''); } })
        .finally(() => { if (my === seq.current) setLoading(false); });
    }, 250);
    return () => clearTimeout(h);
  }, [q, active, ngan, lan]);
  return { rows, loading, loi, ngan, thuLai: () => setLan((n) => n + 1) };
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

/** GD-5 (mockup ⑤ A2, A5): nhóm "liên quan trước" của `/ref/nguoi` — GV của lớp → cùng chi nhánh → chi nhánh khác (máy chủ đã xếp). */
function nhomNguoiXa(r: NguoiKetQua, nhom: 'giao_vien' | 'nhan_vien' | 'gv_speaking'): string | undefined {
  const sp = nhom === 'gv_speaking';
  const kem = (s: string, ma?: string | null, noi = ' · ') => (ma ? `${s}${noi}${ma}` : s);
  if (r.cungLop) return kem(sp ? t('GV Speaking của lớp') : t('GV của lớp'), r.lopMa);
  if (r.cungCn === true) return kem(sp ? t('GV Speaking chi nhánh') : t('Cùng chi nhánh'), r.cnMa, ' ');
  if (r.cungCn === false) return t('Chi nhánh khác');
  return undefined;
}

/** Một người trong danh sách của ô: tên + dòng phụ (vai · chi nhánh, "3 lớp — dạy được L", mã học viên…). */
export type NguoiTrongDs = { id: number; ten: string; phu?: string;
  /** TU-a · GD-5: nhãn nhóm vẽ trước dòng đầu của nhóm, kèm số mục ("Lớp này · MB FT 101 3", "Cùng chi nhánh", "Tutor"). Dòng cùng nhóm phải liền nhau. */
  nhom?: string;
  /** TU-a: dòng là một tutor (`/tutors/chon`), không phải tài khoản. */
  tutor?: TutorChon;
  /** SUA-NHO-UI U4: dòng hiện mờ, không chọn được (bấm, ↑ ↓, Enter, rời ô bỏ qua); chữ = lý do ngắn, đứng bên phải (mockup ⑤ `.ben`). */
  tat?: string };

/** GD-5 (mockup ⑤ A4): chọn nhiều — chip ✕ trong ô, đếm "n / trần", tới trần mục còn lại tắt; Backspace ở ô trống chọn rồi bỏ chip cuối. */
export type ChonNhieu = { chon: NguoiTrongDs[]; toiDa: number; onDoi: (ds: NguoiTrongDs[]) => void;
  /** Chữ đơn vị cho câu trần / nút Xong ("em" → "Tối đa 8 em một lần", "Xong · 2 em"). */
  donVi?: string };

type ChonNguoiOption =
  | { kind: 'trong' }
  | { kind: 'toi' }
  | { kind: 'nguoi'; row: NguoiTrongDs }
  | { kind: 'ngoai'; text: string }
  | { kind: 'them' }
  | { kind: 'dau' };

const IcTim = () => (
  <svg viewBox="0 0 16 16" aria-hidden className="ic h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg>
);
const IcXuong = () => (
  <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4 fill-none stroke-current" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4" /></svg>
);

/**
 * Ô chọn có tìm — MỘT thành phần cho mọi chỗ chọn người / lớp / em (PR-Form F-2, §22.5; GD-5 mockup v21 ⑤ khu A, lời 17).
 *
 * Nguồn (một trong): `/ref/nguoi` theo `nhom` (mọi người đăng nhập gọi được; chưa gõ 20 người, có gõ 12 — LIMIT ở máy chủ) · `ds` (danh sách CÓ SẴN của
 * nơi gọi — lọc không dấu tại chỗ, không gọi máy chủ, giữ quyền / chi nhánh của nơi gọi; PR-O-CHON 07/10) · `tim` (đường tìm máy chủ của nơi gọi, có LIMIT —
 * em: `/tim/hoc-vien`) · `tutor` (`/tutors/chon`). Nhóm "liên quan trước" có nhãn + số (`nhom` của dòng; `/ref/nguoi`: GV của lớp → cùng chi nhánh → khác).
 * `choNgoai` → LUÔN có dòng cuối "Dùng tên ngoài hệ thống" (tên cần ≥ 2 ký tự, Q11). Phím: ↓ ↑ đi qua mục (bỏ qua mục tắt), Enter chọn, Esc đóng danh sách
 * (không đóng panel; Esc lần 2 xoá chữ gõ), Tab / bấm ra ngoài = rời ô. Mở panel không tự nhảy vào ô gõ (Q18 — không bật bàn phím điện thoại):
 * danh sách mở khi focus / bấm vào ô, hoặc ngay khi bấm ✕ (Đổi). `tuMo`: nơi gọi vừa được bấm để chọn → focus + mở ngay. `choTrong`: dòng đầu = bỏ chọn.
 * Đã chọn: "tên · dòng phụ" + ✕ (= Đổi: mở lại ô, giữ người cũ tới khi chọn người khác; `xBo` → ✕ bỏ chọn — ô lọc). `nhieu`: chọn nhiều (chip + trần).
 * `gon`: cỡ ô lọc 36 trong hàng lọc. `tinh`: danh sách nằm trong hộp (bước chọn em của "+ Task"), không nổi. < 640 px: mở toàn màn (`tieuDe`).
 */
export function ChonNguoi({
  value, onChange, nhom, studentId, choToi = true, choNgoai = true, cungChiNhanh = false, chiNhanh = null,
  khongDoi, macDinhTrong, ariaLabel, disabled, tuMo, ds, choTrong, placeholder, id, onBlur, invalid, khongKhop, tutor, them,
  tim, nhieu, xBo, gon, tinh, tieuDe, dau,
}: {
  value: NguoiChon | null;
  onChange: (v: NguoiChon | null, tutor?: TutorChon) => void;
  nhom: 'giao_vien' | 'nhan_vien' | 'gv_speaking';
  studentId?: number | null;
  choToi?: boolean; choNgoai?: boolean;
  /** PR-S5F-b: chỉ GV cùng chi nhánh lớp của em — ô Người dạy bổ trợ. */
  cungChiNhanh?: boolean;
  /** GIAO-VIEC-CN (B' 9): chỉ người có vai ở chi nhánh này — ô người phụ trách / theo dõi của Việc quản lý một chi nhánh. */
  chiNhanh?: number | null;
  /** Ô Điều chỉnh: khi `value = null` hiện "Không đổi · hiện: {khongDoi}". */
  khongDoi?: string;
  /** Ô Phụ trách: khi `value = null` hiện nguyên câu này (ví dụ "Mặc định: GVCN của lớp"; ô lọc: "Mọi lớp"). */
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
  /** P9b: dòng việc cuối danh sách, luôn hiện ("+ Mở lớp mới…" của `ChonLop`) — chọn chạy `onChon`, không đổi giá trị ô. */
  them?: { nhan: string; onChon: () => void; phu?: string };
  tim?: TimXa;
  /** GD-5: dòng việc ĐẦU danh sách, trước nhóm đầu ("Cả lớp · n" của Ghi vi phạm) — chọn chạy `onChon`; `bat` = đang bật (hiện "✓ đã chọn"). Ẩn khi đang gõ. */
  dau?: { nhan: string; onChon: () => void; bat?: boolean; nhom?: string };
  nhieu?: ChonNhieu;
  xBo?: boolean; gon?: boolean; tinh?: boolean;
  /** Tên ô ở đầu màn toàn màn (375); vắng → `ariaLabel`. */
  tieuDe?: string;
}) {
  const { session } = useSession();
  /* KIEM-TAY-1011: "Tôi" chỉ khi chính mình qua được `laNguoiHopLe` của máy chủ (vai GV / QL, đúng chi nhánh của việc, GV S có S) — Quản trị chỉ có
     vai hệ thống chọn "Tôi" thì Tạo bị trả "Người phụ trách không hợp lệ". Chưa có phiên thì giữ như cũ. */
  const vaiHopLe = nhom === 'nhan_vien' ? ['teacher', 'manager'] : ['teacher'];
  const toiHopLe = !session?.grants || (session.grants.some((g) => vaiHopLe.includes(g.role) && (!chiNhanh || g.branchId === chiNhanh))
    && (nhom !== 'gv_speaking' || !!session.gvS));
  const [suaState, setEditing] = useState(!value && khongDoi === undefined && macDinhTrong === undefined);
  const editing = !!nhieu || suaState;   // chọn nhiều: luôn là ô gõ (chip nằm trong ô)
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(!!tuMo);
  const [activeIndex, setActiveIndex] = useState(-1);
  /** Backspace lần một ở ô trống (chọn nhiều): chip cuối được chọn (viền nhấn) — lần hai mới bỏ. */
  const [tron, setTron] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const dt = useDienThoai();
  const chiTutor = !!tutor?.chi;
  const xa = useNguoiSearch(term, nhom, studentId, editing && !ds && !tim && !chiTutor, cungChiNhanh, chiNhanh);
  const tx = useTimXa(term, tim, editing && open && !ds);
  const tt = useTutorChon(term, tutor, editing && open && !!tutor);   // chỉ nạp khi danh sách mở
  const rows = useMemo<NguoiTrongDs[]>(() => {
    /* TU-a: tutor — gợi ý (nơi dạy = chi nhánh lớp + kỹ năng PA) rồi "Khác"; ô Người dạy: nhóm "Tutor" trước người. */
    const dsTutor: NguoiTrongDs[] = (tt.kq?.ds ?? []).map((x) => ({
      id: x.id, ten: x.ten, phu: phuTutor(x), tutor: x,
      nhom: chiTutor ? (x.goiY ? tt.kq?.nhomGoiY ?? t('Gợi ý') : t('Khác')) : t('Tutor'),
    }));
    if (chiTutor) return dsTutor;
    const nguoi: NguoiTrongDs[] = ds ? locNguoiChon(ds, term) : tim ? tx.rows
      : xa.rows.map((r) => {
        const n = nhomNguoiXa(r, nhom) ?? (dsTutor.length ? (nhom === 'giao_vien' ? t('Giáo viên') : t('Nhân viên')) : undefined);
        return { id: r.id, ten: r.name, phu: nguoiContextOf(r), ...(n ? { nhom: n } : {}) };
      });
    return [...dsTutor, ...nguoi];
  }, [ds, term, xa.rows, tx.rows, tim, tt.kq, chiTutor, nhom]);
  const loading = (!ds && !chiTutor && (tim ? tx.loading : xa.loading)) || (!!tutor && tt.loading && !tt.kq);
  const loiTai = ds || chiTutor ? null : tim ? tx.loi : xa.loi;
  const oId = id ?? `${uid}-o`;
  /* Nằm dưới Truong/Field: nhãn trỏ vào ô gõ (label htmlFor), không bọc cả danh sách + nút ✕ (`BaoOTrongNhan`). */
  const bao = useContext(BaoOTrongNhan);
  /* Đang hiện tên (chưa sửa): nhãn trỏ vào nút ✕ / ▾; không có nút (disabled) thì không trỏ đâu. */
  const coO = editing || !disabled;
  useLayoutEffect(() => { bao?.(coO ? oId : null); return () => bao?.(null); }, [bao, oId, coO]);

  /* Chỉ khi VỪA chuyển sang sửa (bấm ✕ / ô) mới focus + mở; lúc vẽ đầu thì không, trừ `tuMo`. */
  const suaTruoc = useRef(tuMo ? false : editing);
  useEffect(() => {
    if (editing && !suaTruoc.current) {
      setOpen(true);
      setActiveIndex(-1);
      inputRef.current?.focus();
    }
    suaTruoc.current = editing;
  }, [editing]);

  /* 375 (mockup ⑤ A7): danh sách mở = màn riêng phủ cả màn; ô gõ dời vào màn đó → đưa focus theo. Rời màn chỉ bằng ‹ · Xong · chọn · Esc. */
  const manMo = dt && editing && open && !disabled;
  const manRef = useRef(manMo);
  manRef.current = manMo;
  useEffect(() => { if (manMo) inputRef.current?.focus(); }, [manMo]);

  /* Giá trị đến sau khi ô đã vẽ (panel nạp phân công hiện tại) → hiện tên, trừ khi người dùng đang gõ trong danh sách.
     So theo người (kiểu/id), không theo object: nơi gọi dựng lại object mỗi lần vẽ. */
  const khoaGiaTri = !value ? '' : value.kieu === 'tai_khoan' ? `u${value.id}` : value.kieu === 'ngoai' ? `n${value.ten}` : value.kieu;
  useEffect(() => { if (khoaGiaTri && !open) setEditing(false); }, [khoaGiaTri]); // eslint-disable-line react-hooks/exhaustive-deps
  const coChuThayThe = !!value || khongDoi !== undefined || macDinhTrong !== undefined;

  const daChonIds = useMemo(() => new Set((nhieu?.chon ?? []).map((x) => x.id)), [nhieu?.chon]);
  const day = !!nhieu && nhieu.chon.length >= nhieu.toiDa;
  const options = useMemo<ChonNguoiOption[]>(() => {
    const out: ChonNguoiOption[] = [];
    if (choTrong && !term.trim()) out.push({ kind: 'trong' });
    if (dau && !term.trim()) out.push({ kind: 'dau' });   // đang gõ tên → ↓ Enter chọn người khớp đầu, không phải dòng trống
    if (choToi && toiHopLe && !nhieu) out.push({ kind: 'toi' });
    for (const r of rows) out.push({ kind: 'nguoi', row: r });
    if (choNgoai && !nhieu) out.push({ kind: 'ngoai', text: term.trim() });
    if (them) out.push({ kind: 'them' });
    return out;
  }, [choTrong, choToi, toiHopLe, rows, choNgoai, term, them, nhieu, dau]);
  /** Dòng "tên ngoài" chưa đủ 2 ký tự / dòng nơi gọi tắt (`row.tat`) / tới trần chọn nhiều: hiện mờ, bấm không làm gì, mũi tên bỏ qua. */
  const tat = (opt: ChonNguoiOption) => (opt.kind === 'ngoai' && opt.text.length < 2)
    || (opt.kind === 'nguoi' && (!!opt.row.tat || (day && !daChonIds.has(opt.row.id))));
  const chonDuoc = options.flatMap((o, i) => (tat(o) ? [] : [i]));
  /* Đang gõ: TÔ SÁNG SẴN người khớp đầu — thấy trước Enter sẽ chọn ai (không chọn ngầm dòng không tô sáng). */
  useEffect(() => { setActiveIndex(term.trim() ? options.findIndex((o) => o.kind === 'nguoi' && !tat(o)) : -1); }, [term, options]);   // eslint-disable-line react-hooks/exhaustive-deps

  const chon = (opt: ChonNguoiOption) => {
    if (tat(opt)) return;
    if (nhieu && opt.kind === 'nguoi') {
      nhieu.onDoi(daChonIds.has(opt.row.id) ? nhieu.chon.filter((x) => x.id !== opt.row.id) : [...nhieu.chon, opt.row]);
      setTerm('');
      setTron(false);
      inputRef.current?.focus();
      return;
    }
    if (opt.kind === 'them') { setTerm(''); setOpen(false); them?.onChon(); return; }
    if (opt.kind === 'dau') { dau?.onChon(); inputRef.current?.focus(); return; }
    if (opt.kind === 'trong') onChange(null);
    else if (opt.kind === 'toi') onChange({ kieu: 'toi' });
    else if (opt.kind === 'nguoi' && opt.row.tutor && !chiTutor) onChange({ kieu: 'ngoai', ten: opt.row.ten, phu: t('Tutor') }, opt.row.tutor);
    else if (opt.kind === 'nguoi') onChange({ kieu: 'tai_khoan', id: opt.row.id, ten: opt.row.ten, phu: opt.row.phu }, opt.row.tutor);
    else onChange({ kieu: 'ngoai', ten: opt.text, ...(chiTutor ? { phu: t('Tutor khác') } : {}) });
    setTerm('');
    setOpen(false);
    /* Bỏ chọn ở ô không có chữ thay thế (phân công GV trống): ở lại ô gõ, không hiện "—" + ✕. */
    if (opt.kind !== 'trong' || khongDoi !== undefined || macDinhTrong !== undefined) setEditing(false);
  };

  /**
   * Rời ô (bấm ra ngoài, Tab, ‹ / Xong ở màn 375) — MỘT đường cho mọi cách rời: đóng danh sách; chữ gõ khớp đúng một người thì chọn người đó
   * (gõ đủ tên rồi bấm Lưu không mất ý định), không thì xoá chữ gõ — ô không bao giờ hiện chữ như đã chọn mà thật ra trống.
   */
  const roiO = () => {
    setOpen(false);
    setActiveIndex(-1);
    setTron(false);
    const nguoi = loading || nhieu ? null : chotChuGo(term, options.filter((o) => o.kind === 'nguoi' && !tat(o)));
    if (nguoi) { chon(nguoi); return; }
    setTerm('');
    if (coChuThayThe) setEditing(false);
  };

  const nguoiLabel = nhom === 'giao_vien' ? t('giáo viên') : t('người');
  const gonLop = gon ? ' gon' : '';

  /* Chỉ xem mà trống: hiện "Chưa chọn", không hiện ô gõ khoá có chữ gợi ý. */
  if (!editing || (disabled && !value)) {
    let chinh: string; let phu: string;
    if (value?.kieu === 'toi') { chinh = t('Tôi'); phu = session?.user?.fullName ?? ''; }
    else if (value?.kieu === 'tai_khoan') { chinh = value.ten; phu = value.phu ?? ''; }
    else if (value?.kieu === 'ngoai') { chinh = value.ten; phu = value.phu ?? t('ngoài hệ thống'); }
    else if (khongDoi !== undefined) { chinh = t('Không đổi · hiện: {gt}', { gt: khongDoi }); phu = ''; }
    else { chinh = macDinhTrong ?? (disabled ? t('Chưa chọn') : '—'); phu = ''; }
    const coGt = !!value;

    return (
      /* Mockup ⑤ A3 "đã chọn một": tên đậm · dòng phụ + ✕ (cùng cao ô gõ — lưới Tạo nhiều lớp); vùng bấm = cả ô. Chưa có giá trị: chữ mờ + ▾. */
      <div className={`oc${gonLop}${gon && coGt ? ' dang' : ''}${invalid ? ' loi' : ''}${disabled ? ' tat' : ' bam'}`} aria-disabled={disabled || undefined}
        onBlur={onBlur} onClick={disabled ? undefined : () => setEditing(true)}>
        {coGt ? <span className="da"><b>{chinh}</b>{phu && <small>{phu}</small>}</span> : <span className="goi">{chinh}</span>}
        {/* Nhãn ô trỏ vào nút này (htmlFor): ✕ = Đổi (mở lại ô, giữ người cũ tới khi chọn người khác); `xBo` (ô lọc) = bỏ chọn. */}
        {!disabled && <button id={oId} type="button" className={coGt ? 'bo' : 'bo mui-xuong'}
          aria-label={!coGt ? ariaLabel ?? t('Chọn') : xBo ? t('Bỏ chọn {ma} · {o}', { ma: chinh, o: ariaLabel ?? t('Chọn') }) : ariaLabel ? t('Đổi · {o}', { o: ariaLabel }) : t('Đổi')}
          onClick={(e) => { e.stopPropagation(); if (coGt && xBo) onChange(null); else setEditing(true); }}>{coGt ? '✕' : <IcXuong />}</button>}
      </div>
    );
  }

  const activeId = activeIndex >= 0 && activeIndex < options.length ? `${uid}-opt-${activeIndex}` : undefined;
  const q = term.trim();
  const donVi = nhieu?.donVi ?? t('mục');
  /* Dòng trạng thái nằm dưới danh sách người, TRÊN dòng "Dùng tên ngoài hệ thống" (mockup 22 §4) — mockup ⑤ A3: tải · lỗi tải · rỗng. */
  const trangThai: ReactNode = loading && !rows.length
    ? <div className="oc-tai" role="status"><span className="chu">{t('Đang tìm…')}</span>{[0, 1, 2].map((k) => <span key={k} className="xd"><i /><i /></span>)}</div>
    : loiTai !== null && !rows.length
      ? <div className="oc-loi" role="alert"><span><b>{t('Không tải được')}</b>{loiTai ? ` · ${loiTai}` : ''}</span>
          <button type="button" className="btn btn-sm" onClick={() => (tim ? tx.thuLai() : xa.thuLai())}>{t('Thử lại')}</button></div>
      : tim && tx.ngan && !rows.length
        ? <div className="oc-rong">{tim.goiY ?? t('Gõ tên để tìm')}</div>
        : q && rows.length === 0
          ? <div className="oc-rong" role="status"><b>{khongKhop ? khongKhop(q) : t('Không thấy “{chu}”', { chu: q })}</b>
              {!khongKhop && !ds && !tim && <span>{t('Chỉ tìm {ai} có vai trong phạm vi của bạn', { ai: nguoiLabel })}</span>}</div>
          : !q && rows.length === 0 && !loading && (ds || tim) && !them && !choTrong
            ? <div className="oc-rong">{khongKhop ? khongKhop('') : t('Chưa có ai để chọn')}</div>
            : null;
  /* Nhóm có nhãn + số (mockup ⑤ A2): số = số mục của nhóm đang hiện; dòng cùng nhóm liền nhau. */
  const nhomCua = (o: ChonNguoiOption | undefined) => (o?.kind === 'nguoi' ? o.row.nhom : o?.kind === 'dau' ? dau?.nhom : undefined);
  const dauNhom: Record<number, number> = {};
  for (let i = 0, d = -1; i < options.length; i++) {
    const n = nhomCua(options[i]);
    if (n && nhomCua(options[i - 1]) !== n) { d = i; dauNhom[i] = 0; }
    if (n && d >= 0 && options[i].kind === 'nguoi') dauNhom[d]++;
  }
  const chanChu = !q && !ds && !tim && !chiTutor && xa.rows.length >= 20 ? t('Gõ để tìm thêm') : null;
  let tatTran = false;   // tới trần: dòng tắt đầu tiên ghi "bỏ bớt một …"

  const oGo = (
    <div className={`oc${nhieu ? ' nhieu' : ''}${gonLop}${invalid ? ' loi' : ''}${disabled ? ' tat' : ''}`} onClick={() => inputRef.current?.focus()}>
      {!nhieu && <IcTim />}
      {nhieu?.chon.map((x, k) => (
        <span key={x.id} className={`chip-em${tron && k === nhieu.chon.length - 1 ? ' tron' : ''}`}>
          <span>{x.ten}</span>
          <button type="button" aria-label={t('Bỏ {ten}', { ten: x.ten })} onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); nhieu.onDoi(nhieu.chon.filter((y) => y.id !== x.id)); inputRef.current?.focus(); }}>✕</button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={oId}
        aria-invalid={invalid || undefined}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${uid}-listbox`}
        aria-activedescendant={activeId}
        aria-autocomplete="list"
        aria-label={ariaLabel ?? t('Chọn người')}
        autoComplete="off"
        spellCheck={false}
        value={term}
        disabled={disabled}
        placeholder={placeholder ?? (nhom === 'giao_vien' ? t('Gõ tên giáo viên…') : t('Gõ tên…'))}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setTerm(e.target.value); setOpen(true); setActiveIndex(-1); setTron(false); }}
        onKeyDown={(e) => {
          if (e.key !== 'Backspace') setTron(false);
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {           // Home/End để nguyên cho con trỏ trong ô gõ
            e.preventDefault();
            setOpen(true);
            const k = buocDanhSach(chonDuoc.length, chonDuoc.indexOf(activeIndex), e.key);
            if (k !== null) {
              setActiveIndex(chonDuoc[k]);
              /* aria-activedescendant không tự cuộn: dòng đang chọn phải thấy được khi đi quá chiều cao danh sách bằng mũi tên. */
              document.getElementById(`${uid}-opt-${chonDuoc[k]}`)?.scrollIntoView({ block: 'nearest' });
            }
          } else if (e.key === 'Enter') {
            /* Enter chọn ĐÚNG dòng đang tô sáng (đang gõ thì người khớp đầu đã tô sẵn); không tô sáng → không chọn. */
            if (activeIndex >= 0 && activeIndex < options.length) { e.preventDefault(); chon(options[activeIndex]); }
          } else if (e.key === 'Escape') {
            /* Esc lần 1 đóng danh sách (375: đóng màn), lần 2 xoá chữ gõ — không đóng panel chứa ô. */
            if (open) { e.stopPropagation(); setOpen(false); } else if (term) { e.stopPropagation(); setTerm(''); }
          } else if (e.key === 'Backspace' && nhieu && !term && nhieu.chon.length) {
            e.preventDefault();
            if (tron) { nhieu.onDoi(nhieu.chon.slice(0, -1)); setTron(false); } else setTron(true);
          }
        }}
      />
      {/* 375 toàn màn: số đếm ở đầu màn (mockup ⑤ A7), không lặp trong ô. ✕ xoá chữ luôn sát mép phải (#1602: lề 7, tâm = tâm ô). */}
      {nhieu && !manMo && <span className={`dem-chon${day ? ' day' : ''}`}>{nhieu.chon.length} / {nhieu.toiDa}</span>}
      {term
        ? <button type="button" className="bo" aria-label={t('Xoá chữ')} onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); setTerm(''); setOpen(true); inputRef.current?.focus(); }}>✕</button>
        : !nhieu && <span className="mui-xuong" aria-hidden><IcXuong /></span>}
    </div>
  );

  const danhSach = open && (
    /* mousedown không lấy focus khỏi ô gõ (Safari không focus nút khi bấm) → rời ô không chạy trước cú bấm chọn. */
    <div id={`${uid}-listbox`} role="listbox" aria-label={tieuDe ?? ariaLabel} aria-multiselectable={nhieu ? true : undefined} aria-busy={loading || undefined}
      onMouseDown={(e) => e.preventDefault()} className={`oc-ds${tinh && !manMo ? ' tinh' : ''}`}>
      {day && <div className="oc-rong tran" role="status"><b>{t('Tối đa {n} {dv} một lần', { n: nhieu!.toiDa, dv: donVi })}</b></div>}
      {options.map((opt, i) => {
        const daChon = opt.kind === 'nguoi' && (nhieu ? daChonIds.has(opt.row.id)
          : value?.kieu === 'tai_khoan' && !opt.row.tutor && value.id === opt.row.id);
        let ben: string | undefined;
        if (opt.kind === 'dau' && dau?.bat) ben = t('✓ đã chọn');
        if (opt.kind === 'nguoi') {
          if (daChon) ben = nhieu ? t('✓ đã chọn') : '✓';
          else if (opt.row.tat) ben = opt.row.tat;
          else if (day && !tatTran) { tatTran = true; ben = t('bỏ bớt một {dv}', { dv: donVi }); }
        }
        return (
          <Fragment key={opt.kind === 'nguoi' ? `${opt.row.tutor ? 't' : 'u'}${opt.row.id}` : opt.kind}>
            {(opt.kind === 'ngoai' || (opt.kind === 'them' && !choNgoai)) && trangThai}
            {/* TU-a · GD-5: nhãn nhóm + số trước dòng đầu của mỗi nhóm (không bấm, mũi tên bỏ qua; dính đầu khi cuộn). */}
            {dauNhom[i] !== undefined && <div role="presentation" className="oc-nhom">{nhomCua(opt)} <span className="so">{dauNhom[i]}</span></div>}
            <button
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={nhieu ? daChon : i === activeIndex}
              aria-disabled={tat(opt) || undefined}
              tabIndex={-1}
              type="button"
              className={`oc-muc${i === activeIndex ? ' re' : ''}${daChon || (opt.kind === 'dau' && dau?.bat) ? ' da-chon' : ''}${opt.kind === 'them' ? ' them' : ''}${opt.kind === 'trong' ? ' trong' : ''}`}
              onMouseEnter={() => { if (!tat(opt)) setActiveIndex(i); }}
              onClick={() => chon(opt)}
            >
              {opt.kind === 'trong' && <span className="t">{choTrong}</span>}
              {opt.kind === 'toi' && <><span className="t">{t('Tôi')}</span>{session?.user?.fullName && <span className="p">{session.user.fullName}</span>}</>}
              {opt.kind === 'nguoi' && <><span className="t"><ToKhop chu={opt.row.ten} q={term} /></span>{opt.row.phu && <span className="p">{opt.row.phu}</span>}</>}
              {opt.kind === 'ngoai' && <span className="t">{tat(opt)
                ? (chiTutor ? t('Tutor khác: gõ tên ở ô trên') : t('Dùng tên ngoài hệ thống: gõ tên ở ô trên'))
                : (chiTutor ? t('Tutor khác: «{ten}»', { ten: opt.text }) : t('Dùng tên ngoài hệ thống: «{ten}»', { ten: opt.text }))}</span>}
              {opt.kind === 'dau' && <span className="t">{dau?.nhan}</span>}
              {opt.kind === 'them' && <><span className="t">{them?.nhan}</span>{them?.phu && <span className="p">{them.phu}</span>}</>}
              {ben && <span className="ben">{ben}</span>}
            </button>
          </Fragment>
        );
      })}
      {!choNgoai && !them && trangThai}
      {chanChu && <div className="oc-chan">{chanChu}</div>}
    </div>
  );

  const ten = tieuDe ?? ariaLabel ?? t('Chọn');
  return (
    <div ref={box} className="oc-vung" onBlur={(e) => {
      if (manRef.current) return;                                    // 375: màn toàn màn đang mở — rời bằng ‹ / Xong / chọn
      if (box.current?.contains(e.relatedTarget as Node)) return;   // focus còn trong ô (dòng danh sách) → chưa rời
      roiO();
      onBlur?.();
    }}>
      {manMo
        ? <div className={`oc${gonLop} go`} aria-hidden><IcTim /><span className="goi">{placeholder ?? t('Gõ tên…')}</span></div>
        : <>{oGo}{danhSach}</>}
      {manMo && createPortal(
        <div className="oc-man" role="dialog" aria-modal="true" aria-label={ten}
          onKeyDown={(e) => { if (e.key === 'Escape') e.stopPropagation(); }}>
          <div className="oc-man-dau">
            <button type="button" className="nut-lui" aria-label={t('Quay lại')} onClick={() => { roiO(); onBlur?.(); }}>‹</button>
            <h2>{ten}</h2>
            {nhieu && <span className="dem-chon">{nhieu.chon.length} / {nhieu.toiDa}</span>}
          </div>
          <div className="oc-man-tim">{oGo}</div>
          {danhSach}
          {nhieu && <div className="oc-man-chan"><button type="button" className="btn btn-primary" onClick={() => { roiO(); onBlur?.(); }}>
            {t('Xong · {n} {dv}', { n: nhieu.chon.length, dv: donVi })}</button></div>}
        </div>,
        document.body,
      )}
    </div>
  );
}
ChonNguoi.tuNhan = true;

/**
 * GD-5: ô LỌC có tìm trong hàng lọc (thay `<select>` "Mọi TVV" / "Người: Tất cả"): giữ giá trị chuỗi như select cũ ('' = tất cả), danh sách có sẵn
 * của trang (không gọi máy chủ). Đóng: "Mọi …" + ▾; đã lọc: tên đậm + ✕ bỏ lọc (viền nhấn như `OChon dangLoc`).
 */
export function ChonLoc({ ds, value, onChange, ariaLabel, tatCa, placeholder, className = '' }: {
  ds: { gt: string; ten: string; phu?: string; nhom?: string }[]; value: string; onChange: (v: string) => void;
  ariaLabel: string; tatCa: string; placeholder?: string; className?: string;
}) {
  const i = ds.findIndex((x) => x.gt === value);
  return (
    <div className={className}>
      <ChonNguoi value={i >= 0 ? { kieu: 'tai_khoan', id: i + 1, ten: ds[i].ten, phu: ds[i].phu } : null} nhom="nhan_vien" choToi={false} choNgoai={false} gon xBo
        ds={ds.map((x, k) => ({ id: k + 1, ten: x.ten, phu: x.phu, nhom: x.nhom }))} macDinhTrong={tatCa} ariaLabel={ariaLabel} placeholder={placeholder}
        onChange={(v) => onChange(v?.kieu === 'tai_khoan' ? ds[v.id - 1]?.gt ?? '' : '')} />
    </div>
  );
}
ChonLoc.tuNhan = true;
