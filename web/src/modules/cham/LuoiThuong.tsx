/**
 * LƯỚI CHẤM LỚP THƯỜNG (spec §3.5, mockup 10b §2).
 *
 * Mỗi ô HAI SỐ: số câu đúng / tổng số câu, cả hai đều điền. Ô "tổng" trên đầu cột chỉ để ĐIỀN NHANH cả cột (nút ↓);
 * sửa riêng từng em vẫn được, và ô có tổng khác tổng của cột thì viền vàng. Không có tổng cố định theo chương trình.
 * Gõ "-" = em không làm bài: môn đó tự dời sang tuần sau (C08) — không phải điểm 0, không đụng môn khác.
 */
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { thongBaoVang } from './thongBaoVang.ts';
import { Empty, Info, Level, Status } from '../../ui/ui.tsx';
import { Bang, OBang } from '../../ui/Bang.tsx';
import type { DinhNghiaCot } from '@shared/domain/index.ts';
import { useTrangThaiLuuO } from '../../ui/SaveState.tsx';
import { KHOA_HOAN_TAT_HINT, ODiemThuong, laTuChoi, type SaveOpts } from '../fasttrack/ScoreEntry.tsx';
import { caseStatusLabel } from '../../lib/format.ts';
import {
  CHU_THAO_TAC, CHUONG_TRINH_KHONG_CHIA_MON, PERMISSIONS, duongDotTest, nhanBai, nhanGoiY, ketQuaThuong, ngay, tenMon, tenMonNgan, thaoTacKyNang, trangThaiTT, tuanLich,
  type AttemptKind, type ThaoTac,
} from '@shared/domain/index.ts';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { HopThaoTacMt, THAO_TAC_CO_HOP } from '../fasttrack/HopThaoTacMt.tsx';
import { NganLichSuBai } from './NganLichSuBai.tsx';
import { DauLuu, DauO, VIEN_LOI } from './LuoiFT.tsx';
import { DongThi } from './DongThi.tsx';
import { NutNhanXet } from '../fasttrack/HopNhapDiem.tsx';
import { dich, t } from '@shared/i18n/index.ts';

type SkillResult = {
  skill: string; label: string;
  score: number | null; total: number | null;
  ratio: number | null; outcome: 'pass' | 'fail' | 'missing';
};
/** Lịch, hạn, dấu "-" và quyền sửa của MỘT môn trong bài — bốn môn có thể ở ba tuần khác nhau. */
type SkillSchedule = {
  skill: string; label: string;
  periodCode: string | null; weekRange: string | null; weekStart: string | null;
  deadline: string | null; progress: string; sitStatus: string; overdue: boolean;
  noShow: boolean; movedFrom: string | null; movedFromStart: string | null; canEdit: boolean;
  /** OV-4b: nhận xét của môn (nút "Nhận xét" cạnh ô). */
  nhanXet?: string | null;
  /** PR-BV: người xem gỡ được dấu "-" lúc này. */
  goDau?: boolean;
  /** OV-11a (Q1): "-" ở tuần thi đã qua ≥ 2 tuần — Không dự thi (không dời, không nợ). */
  khongDuThi?: boolean;
  /** LUAT-34: lớp đã kết thúc — chỉ Quản lý sửa ("Đủ điểm" không còn khoá). */
  khoa?: boolean;
  /** LUAT-34 (T20b): ô trống có điểm đã huỷ còn cất → ⋯ "Khôi phục điểm". */
  diemHuy?: boolean;
  /** OV-13h (rà #410): nút Nhận xét — GV đúng môn ghi được cả khi ô đã khoá điểm. */
  nhanXetDuoc?: boolean;
  /** Rà #410: ô không nhận "-" (lớp đã kết thúc) — câu máy chủ. */
  khongVang?: string | null;
  /** CV-LOI (V4B H15): máy chủ cho đổi lịch môn này — nút "Xếp lại bài vắng". */
  doiLich?: boolean;
  /** HSL-MAY-CHU: người nhập điểm môn này (null = chưa có điểm). */
  nguoiNhap?: string | null;
};
type Row = {
  /** Khoá bài (`khoaBai`): `progress` / `final`; OV-6b2 Checkpoint kèm số (`checkpoint:2`). */
  attemptId: number; kind: string; kindLabel: string;
  /** OV-6b2: Checkpoint đủ điểm — chip "Đạt" / "SOS · L+S" (chỉ để nhìn, không Case). */
  chip?: { chu: string; dat: boolean } | null;
  studentId: number; studentName: string; studentCode: string; studentStatus: string; studentEmail?: string | null;
  periodCode: string | null; status: string;
  deadline: string | null; overdue: boolean;
  /** R11: đợt đã đủ điểm và qua Chủ nhật của tuần bắt buộc muộn nhất — chỉ Quản lý sửa được điểm nữa. */
  hoanTat?: boolean; chuNhatCuoi?: string | null;
  skillSchedule: SkillSchedule[];
  /** PR-LT2b: hướng gợi ý Cuối khoá (chỉ dòng Cuối khoá đủ điểm). */
  goiY?: { dai: string; nhan: string; nhanNgan: string } | null;
  result: {
    skills: SkillResult[]; scored: number; required: number; complete: boolean;
    failedCount: number | null; sosLevel: number | null; passThreshold: number;
    /** Σ điểm / Σ tổng — chỉ khi đủ mọi môn (K5-44). */
    tyLeTong?: number | null;
  };
  cases: { id: number; status: string; level: number | null; skill: string; category: string }[];
  caseId: number | null; caseStatus: string | null; caseLevel: number | null;
};
/** Dữ liệu lưới lớp thường — chính là `cham.thuong` (`regularSheet` ở máy chủ). */
export type ThuongSheet = {
  class: { id: number; code: string; branchName: string; startDate: string | null };
  programme: { code: string; name: string; weeks: number | null; skills: string[]; checkpoints: { kind: AttemptKind; studyWeek: number }[] };
  /** Tên môn theo chương trình (máy chủ dựng bằng `tenMon`/`tenMonNgan` — MH2). */
  skillLabels: Record<string, string>;
  monNgan?: Record<string, string>;
  editableSkills: string[];
  canPlan: boolean;
  /** PR-XLMT: người xem là GVCN của lớp (menu ⋯ ô: Báo vắng, Xếp lại bài vắng). */
  laGvcn?: boolean;
  passThreshold: number;
  rows: Row[];
  today: string;
};

export const lichCua = (r: Row, k: string) => r.skillSchedule.find((x) => x.skill === k);
export const ketQuaCua = (r: Row, k: string) => r.result.skills.find((x) => x.skill === k);

/**
 * MỘT Ô CỦA DÒNG — dữ liệu cho `ODiemThuong`, dùng chung cho lưới và màn điện thoại (MotKyNang) để hai nơi không lệch.
 * `trong` = ô còn phải nhập của người đang xem (cuộn tới em đầu tiên chưa có điểm, Q12). `dung` = môn vắng / đã huỷ phần
 * thi mà chưa có điểm: không có ô nhập, chỉ hiện `chuDung`.
 */
export function oThuong(r: Row, k: string, homNay: string) {
  const s = lichCua(r, k);
  const kq = ketQuaCua(r, k);
  const canEdit = s?.canEdit ?? false;
  const diem = kq?.score ?? null;
  const trong = canEdit && diem === null && s?.progress !== 'upcoming'
    && s?.progress !== 'cancelled' && s?.progress !== 'absent' && !s?.khongDuThi;
  const dung = diem === null && (s?.progress === 'absent' || s?.progress === 'cancelled');
  const chuDung = !dung ? null : s!.progress === 'absent' ? t('Đã vắng · chờ xếp lại') : t('Đã huỷ');
  /* Quá hạn chấm của CHÍNH môn này (hạn riêng từng môn, mục 10.5), ngày dạng dd/mm. */
  const quaHan = diem === null && s?.overdue && s.deadline ? t('Quá hạn {ngay}', { ngay: ngay(s.deadline, homNay) }) : null;
  const cell = {
    diem, tong: kq?.total ?? null,
    dau: !!s?.noShow,
    khongDuThi: !!s?.khongDuThi,
    goDau: !!s?.goDau,
    tuanDoiTu: s?.noShow ? (s.movedFromStart ? tuanLich(s.movedFromStart, homNay) : t('tuần cũ')) : null,
    tuanHienTai: s?.weekStart ? tuanLich(s.weekStart, homNay) : null,
    chuaToiTuan: s?.progress === 'upcoming',
    tiLe: kq?.ratio ?? null, ketQua: kq?.outcome,
    khoa: s?.khoa,
    khongVang: s?.khongVang ?? null,
  };
  return { s, kq, canEdit, trong, dung, chuDung, quaHan, cell };
}

/** Các bài (Giữa khoá / Cuối khoá) đang có trên lưới, đúng thứ tự mốc của chương trình. */
export function kindsThuong(data: ThuongSheet | null | undefined): { kind: string; label: string }[] {
  if (!data) return [];
  const co = new Set(data.rows.map((r) => r.kind as string));
  const thuTu = [...data.programme.checkpoints.map((c) => c.kind as string), ...co];
  return [...new Set(thuTu)].filter((k) => co.has(k))
    .map((k) => ({ kind: k, label: nhanBai(k) }));
}

/**
 * BÀI MỞ SẴN khi đường dẫn không nói bài nào: bài có môn ĐANG NỢ (đã tới tuần thi mà chưa có điểm) với hạn sớm nhất;
 * không còn môn nợ thì bài có môn sắp thi gần nhất; không còn gì thì bài cuối cùng — thứ người chấm cần nhìn trước.
 */
export function kindMacDinh(data: ThuongSheet | null | undefined): string | null {
  const ks = kindsThuong(data);
  if (!data || !ks.length) return null;
  const monNo = data.rows.flatMap((r) => r.skillSchedule
    .filter((s) => ketQuaCua(r, s.skill)?.outcome === 'missing' && s.progress !== 'cancelled' && s.progress !== 'absent')
    .map((s) => ({ kind: r.kind as string, s })));
  const dangNo = monNo.filter((x) => x.s.progress !== 'upcoming' && x.s.deadline)
    .sort((a, b) => a.s.deadline!.localeCompare(b.s.deadline!))[0];
  if (dangNo) return dangNo.kind;
  const sapThi = monNo.filter((x) => x.s.weekStart).sort((a, b) => a.s.weekStart!.localeCompare(b.s.weekStart!))[0];
  return sapThi?.kind ?? ks[ks.length - 1].kind;
}

/** Hạn chấm sớm nhất còn nợ trên lưới (đã lọc theo bài) — cho `<Han>` ở đầu trang. */
export function hanSomNhatThuong(data: ThuongSheet | null | undefined): string | null {
  const ds = (data?.rows ?? []).flatMap((r) => r.skillSchedule
    .filter((s) => ketQuaCua(r, s.skill)?.outcome === 'missing' && s.deadline
      && s.progress !== 'upcoming' && s.progress !== 'cancelled' && s.progress !== 'absent')
    .map((s) => s.deadline!.slice(0, 10)))
    .sort();
  return ds[0] ?? null;
}

/**
 * TUẦN THI TỪNG MÔN ở đầu lưới, gom môn cùng tuần (Ruling 4, mockup 10b §2): "L, R: W3 SEP · W, S: W4 SEP". Tuần của
 * một môn là tuần mà đa số em thi môn đó — em bị dời bằng "-" không kéo cả cột đi (em đó có dòng phụ riêng ở Kết quả).
 * Cả bài một tuần thì chỉ ghi tuần đó. Luôn qua `tuanLich` (G-6), không bao giờ hiện mã tuần có năm.
 */
export function tuanThiTheoMon(data: ThuongSheet | null | undefined, homNay: string): string | null {
  if (!data?.rows.length) return null;
  const tuanCuaMon = data.programme.skills.map((k) => {
    const dem = new Map<string, number>();
    for (const r of data.rows) {
      const s = lichCua(r, k);
      if (!s?.weekStart || (s.noShow && s.movedFromStart && !s.khongDuThi)) continue;
      dem.set(s.weekStart, (dem.get(s.weekStart) ?? 0) + 1);
    }
    const nhieuNhat = [...dem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
    return { k, tuan: nhieuNhat ? tuanLich(nhieuNhat, homNay) : null };
  }).filter((x) => x.tuan);
  if (!tuanCuaMon.length) return null;
  const nhom: { tuan: string; mon: string[] }[] = [];
  for (const x of tuanCuaMon) {
    const cu = nhom.find((n) => n.tuan === x.tuan);
    const ten = tenMonNgan(data.programme.code, x.k);
    if (cu) cu.mon.push(ten); else nhom.push({ tuan: x.tuan!, mon: [ten] });
  }
  if (nhom.length === 1) return nhom[0].tuan;
  return nhom.map((n) => `${n.mon.join(', ')}: ${n.tuan}`).join(' · ');
}

/** Tổng hay gặp nhất của một cột — giá trị ban đầu của ô "tổng" đầu cột (không phải tổng cố định, Q8). */
export function tongPhoBien(rows: Row[], k: string): number | null {
  const dem = new Map<number, number>();
  for (const r of rows) {
    const t = ketQuaCua(r, k)?.total;
    if (t !== null && t !== undefined) dem.set(t, (dem.get(t) ?? 0) + 1);
  }
  return [...dem.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0] ?? null;
}

/* BANG-1: rộng cột theo kiểu của `Bang`; ô môn sửa được chứa Nhận xét · đúng / tổng · ⋯ trên MỘT hàng → 236 px. */
const COT_MON = 236;
const COT_KQ = 260;

/**
 * Lưu một ô của lưới lớp thường cho MỘT dòng — cùng dáng `useSaveScore` của FT: trạng thái lưu riêng TỪNG Ô,
 * chặn gửi lặp cùng một ô, lỗi thì giữ bản nháp. `nem` = ném lỗi cho hộp lý do hiện câu lỗi tại ô.
 */
export function useLuuThuong(attemptId: number, onReload: () => void, ct: string | null = null, tenHv?: string) {
  const tenO = (k: string) => tenMon(ct, k);
  const toast = useToast();
  /* Trạng thái lưu THEO TỪNG Ô (PR-UX1): một ô hỏng không bị ô lưu sau che thành "Đã lưu". */
  const tt = useTrangThaiLuuO<Record<string, unknown>>(`thuong:${attemptId}`);
  const inflight = useRef(new Set<string>());

  const gui = async (skill: string, body: Record<string, unknown>, opts: SaveOpts = {}): Promise<any | null> => {
    if (inflight.current.has(skill)) return null;
    inflight.current.add(skill);
    tt.batDau(skill);
    try {
      const r = await api.put<any>(`/regular/attempts/${attemptId}/scores/${skill}`, body);
      /* Không `invalidate('/cham')`: Lịch Test tự tải lại dải số GỘP 1,5 s sau lần lưu cuối (PR-UX1 Q14) qua `onReload` —
         tải lại mỗi ô làm nặng Turso. Lưới (`/classes/:id/cham`) vẫn tải lại qua `/classes`. */
      invalidate('/regular'); invalidate('/classes'); invalidate('/attempts');
      invalidate('/students'); invalidate('/tong-quan');
      invalidate('/my-work');   // PR-S6F-a: badge quá hạn của GV tải lại sau khi nhập điểm
      tt.thanhCong(skill);
      onReload();
      return r ?? {};
    } catch (e: any) {
      /* Hộp lý do đang mở: câu lỗi hiện trong hộp, ô không bật "Lưu lại". */
      if (opts.nem) { tt.bo(skill); throw e; }
      /*
       * Máy chủ TỪ CHỐI lệnh "-" (ví dụ Q5: dời vượt qua đợt kế tiếp; chưa tới tuần thi): gửi lại y nguyên không bao giờ
       * thành — báo đúng câu của máy chủ, ô về giá trị đã lưu, không có "Lưu lỗi · Thử lại". Lỗi mạng / 5xx vẫn có.
       */
      if ('noShow' in body && laTuChoi(e)) {
        tt.bo(skill);
        toast.push('error', `${tenO(skill)}: ${e.message}`);
        return null;
      }
      tt.hongO(skill, body, e.message);
      toast.push('error', `${tenO(skill)}: ${e.message}`);
      return null;
    } finally {
      inflight.current.delete(skill);
    }
  };

  const luu = async (skill: string, p: { score: number | null; total: number | null; lyDo?: string }, opts?: SaveOpts) =>
    (await gui(skill, p.lyDo ? { score: p.score, total: p.total, lyDo: p.lyDo } : { score: p.score, total: p.total }, opts)) !== null;

  /* Dấu "-" gửi RIÊNG (máy chủ không nhận kèm điểm/tổng): ghi dấu là dời môn sang tuần sau, gỡ dấu là trả về tuần cũ. */
  const dau = async (skill: string, bat: boolean) => {
    const r = await gui(skill, { noShow: bat });
    if (r && bat) {
      thongBaoVang(toast, `${attemptId}:${skill}`, tenMonNgan(ct, skill), tenHv,   // K4: gõ "-" và nút Vắng cùng một thông báo
        r.khongDuThi ? { kq: 'khong-du-thi' } : r.moved ? { kq: 'doi', tuanMoi: r.tuanMoi } : null);
    } else if (r && r.moved) {
      toast.push('ok', t('Đã bỏ vắng {tenMonNgan}{x} · về {x2}', { tenMonNgan: tenMonNgan(ct, skill), x: tenHv ? ` · ${tenHv}` : '', x2: r.tuanMoi ?? t('tuần cũ') }));
    } else if (r && r.giuLich) {
      toast.push('ok', t('Đã bỏ vắng {tenMonNgan}{x} · giữ {x2}', { tenMonNgan: tenMonNgan(ct, skill), x: tenHv ? ` · ${tenHv}` : '', x2: r.tuanMoi ?? t('tuần mới') }));   // PR-BV: tuần mới đã có điểm
    } else if (r) {
      toast.push('ok', t('Đã bỏ vắng {tenMonNgan}{x}', { tenMonNgan: tenMonNgan(ct, skill), x: tenHv ? ` · ${tenHv}` : '' }));   // OV-11a: gỡ Không dự thi — tuần không đổi
    }
    return r !== null;
  };

  /** Gửi lại đúng lệnh đã hỏng của một ô / của mọi ô lỗi trên dòng. */
  const luuLai = (skill: string) => { const b = tt.hong.current.get(skill); if (b) void gui(skill, b); };
  const retry = () => { for (const k of [...tt.hong.current.keys()]) luuLai(k); };
  /* OV-4b: nhận xét lưu riêng (hộp "Nhận xét"); lỗi ném ra để hộp giữ chữ đã gõ. */
  const nhanXet = async (skill: string, v: string | null) => (await gui(skill, { nhanXet: v }, { nem: true })) !== null;

  return {
    luu, dau, nhanXet, status: tt.status, lastError: tt.lastError, retry, o: tt.o, loi: tt.loi, luuLai, soLoi: tt.soLoi,
    loiNhap: tt.loiNhap, coGuiLai: tt.coGuiLai,
  };
}

/**
 * `tuanDangXem` (Lịch Test, PR-UX1 Q10): ô chưa có điểm của môn thi tuần khác → chữ mờ `W4 SEP`, không ô nhập — chưa
 * phải việc của tuần đang xem. Môn mang "-" giữ nguyên ô (có `→ tuần mới`).
 */
export function LuoiThuong({ data, onReload, kn = null, hv = null, tuanDangXem = null, anNutTao = false }: {
  data: ThuongSheet; onReload: () => void; kn?: string | null; hv?: number | null; tuanDangXem?: string | null;
  /** PR-DL: Điểm theo lớp không tạo bài ("không tự tạo lịch") — ẩn nút "Tạo bài kiểm tra theo chương trình" và câu nhắc nút. */
  anNutTao?: boolean;
}) {
  const toast = useToast();
  const skills = data.programme.skills;
  const grid = useRef<(HTMLInputElement | null)[][]>([]);
  /* Ô "tổng" đầu cột: người dùng gõ thì giữ đúng chữ đã gõ; chưa gõ thì lấy tổng hay gặp nhất của cột. */
  const [tongGo, setTongGo] = useState<Record<string, string>>({});
  const [dien, setDien] = useState<Record<string, { gt: number; lan: number }>>({});
  const [busy, setBusy] = useState(false);

  const tongMacDinh = useMemo(
    () => Object.fromEntries(skills.map((k) => [k, tongPhoBien(data.rows, k)])) as Record<string, number | null>,
    [data.rows, skills],
  );
  const chuTong = (k: string) => tongGo[k] ?? (tongMacDinh[k] === null ? '' : String(tongMacDinh[k]));
  const soTong = (k: string) => (/^\d+$/.test(chuTong(k).trim()) && Number(chuTong(k)) > 0 ? Number(chuTong(k)) : null);
  const cotSuaDuoc = (k: string) => data.rows.some((r) => lichCua(r, k)?.canEdit);

  const plan = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ created: number; students: number }>(`/regular/classes/${data.class.id}/plan`, {});
      toast.push(r.created > 0 ? 'ok' : 'info',
        r.created > 0 ? t('Đã tạo {created} bài kiểm tra cho {students} học viên.', { created: r.created, students: r.students })
                      : t('Mọi học viên đều đã có đủ bài kiểm tra.'));
      /* `invalidate('/classes')` tự tải lại lưới (đường `/classes/:id/cham`) — không gọi `onReload`, vì đó là tín hiệu "vừa lưu điểm". */
      invalidate('/regular'); invalidate('/classes');
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  /* OV-6b2: lớp liên tục (chương trình không có mốc cố định) — Checkpoint tự sinh, không nút tạo bài. */
  const nutTao = data.canPlan && !anNutTao && data.programme.checkpoints.length > 0 && (
    <button className="btn btn-sm" onClick={plan} disabled={busy}>
      {busy ? t('Đang tạo…') : t('Tạo bài kiểm tra theo chương trình')}
    </button>
  );

  if (data.rows.length === 0) {
    return (
      <Empty
        title={t('Lớp này chưa có bài kiểm tra nào')}
        hint={anNutTao ? undefined : data.canPlan
          ? t('Bấm "Tạo bài kiểm tra theo chương trình" để sinh bài Progress Test và Final Test theo đúng mốc tuần học.')
          : t('Quản lý cần tạo kế hoạch kiểm tra cho lớp này.')}
        action={nutTao || undefined}
      />
    );
  }

  /* R1-LUU-TIEP: Enter (`boChiDoc`) bỏ qua ô chỉ đọc (đã có điểm — gõ số ở đó mở hộp sửa có lý do), sang ô còn nhập được; ↑ / ↓ đi qua mọi ô. */
  const move = (row: number, col: number, dr: number, boChiDoc = false) => {
    for (let r = row + dr; r >= 0 && r < grid.current.length; r += dr) {
      const el = grid.current[r]?.[col];
      if (el && !(boChiDoc && el.readOnly)) { el.focus(); el.select(); return; }
    }
  };
  /* OV-6b2 (mockup §6): lưới Checkpoint có thêm cột "% tổng" trước Kết quả. */
  const laCp = data.rows.some((r) => r.kind.startsWith('checkpoint'));
  const cotDs: DinhNghiaCot[] = [
    { key: 'hv', nhan: t('Học viên'), kieu: 'ten', goiY: t('Cột này đứng yên khi cuộn ngang.') },
    ...skills.map((k): DinhNghiaCot => ({
      key: k, nhan: tenMonNgan(data.programme.code, k), kieu: 'diem-ti-le', rong: cotSuaDuoc(k) ? COT_MON : 128,   /* chỉ đọc: "✗ 17/25" + ⋯ */ sang: kn === k,
      phu: soTong(k) !== null ? `/${soTong(k)}` : undefined, goiY: tenMon(data.programme.code, k),
    })),
    ...(laCp ? [{ key: 'pt', nhan: t('% tổng'), kieu: 'phan-tram', goiY: t('Tổng điểm các môn / tổng số câu — khi đủ mọi môn.') } as const] : []),
    { key: 'kq', nhan: t('Kết quả'), kieu: 'chip', rong: COT_KQ, goiY: t('Đạt từ 70% trở lên. Thiếu điểm khác chưa đạt: môn chưa chấm không bị tính là chưa đạt.') },
  ];
  const cc = Object.fromEntries(cotDs.map((c) => [c.key, c])) as Record<string, DinhNghiaCot>;
  /* BANG-1 (cấm điều khiển trong tiêu đề): tổng số câu từng môn + "Điền ô trống" là CÔNG CỤ trên bảng, không ở đầu cột.
     Điền: ô CÒN TRỐNG tổng của mọi môn có tổng lấy số đó; ô đã có tổng giữ nguyên (như nút cũ của từng cột). */
  const monSua = skills.filter(cotSuaDuoc);
  const dienHet = () => setDien((d) => Object.fromEntries([...Object.entries(d),
    ...monSua.flatMap((k) => { const n = soTong(k); return n === null ? [] : [[k, { gt: n, lan: (d[k]?.lan ?? 0) + 1 }]]; })]));
  const congCu = monSua.length > 0 && (
    <>
      <span className="text-[13px] font-semibold text-slate-400">{t('Tổng số câu')}</span>
      {monSua.map((k) => (
        <label key={k} className="inline-flex items-center gap-1 text-[13px] text-slate-300">
          {tenMonNgan(data.programme.code, k)}
          <input className="field w-12 px-1 py-0.5 text-center tabular-nums" inputMode="numeric" value={chuTong(k)} placeholder="—"
            title={t('Tổng số câu của đề cả lớp làm — ô còn trống tổng lấy sẵn số này; bấm Điền cả cột để điền luôn.')}
            aria-label={t('Tổng số câu chung của cột {tenMon}', { tenMon: tenMon(data.programme.code, k) })}
            onChange={(e) => setTongGo((x) => ({ ...x, [k]: e.target.value }))} />
        </label>
      ))}
      <button type="button" className="btn btn-sm" disabled={!monSua.some((k) => soTong(k) !== null)}
        title={t('Điền tổng này vào mọi ô còn trống tổng của cột. Ô đã có tổng giữ nguyên.')} onClick={dienHet}>{t('Điền ô trống')}</button>
    </>
  );

  return (
    <div>
      <Bang ten={t('Bảng điểm {x}', { x: data.class.code })} cot={cotDs} hang={data.rows} khoa={(r) => r.attemptId} the375={false} khung={false} dinh congCu={congCu}
        hangRieng={(r) => {
          const ri = data.rows.indexOf(r);
          return (
            <DongThuong
              row={r} rowIndex={ri} sheet={data} laCp={laCp} cc={cc}
              active={hv !== null && r.studentId === hv}
              tongCot={soTong} dien={dien} onReload={onReload} tuanDangXem={tuanDangXem}
              register={(ci, el) => { grid.current[ri] = grid.current[ri] ?? []; grid.current[ri][ci] = el; }}
              onMove={move}
            />
          );
        }} />
      {nutTao && <div className="flex justify-end px-3 py-2 border-t" style={{ borderColor: 'var(--line)' }}>{nutTao}</div>}
    </div>
  );
}

function DongThuong({ row, rowIndex, sheet, laCp, cc, active, tongCot, dien, onReload, tuanDangXem, register, onMove }: {
  row: Row; rowIndex: number; sheet: ThuongSheet; laCp?: boolean; cc: Record<string, DinhNghiaCot>; active: boolean; tuanDangXem: string | null;
  tongCot: (k: string) => number | null;
  dien: Record<string, { gt: number; lan: number }>;
  onReload: () => void;
  register: (col: number, el: HTMLInputElement | null) => void;
  onMove: (row: number, col: number, dr: number, boChiDoc?: boolean) => void;
}) {
  const { luu, dau, nhanXet, status, lastError, retry, o, loi, luuLai, soLoi, loiNhap, coGuiLai } = useLuuThuong(row.attemptId, onReload, sheet.programme.code, row.studentName);
  const homNay = sheet.today;
  const { can } = useSession();
  const ct = sheet.programme.code;
  const [hop, setHop] = useState<{ t: ThaoTac; k: string } | null>(null);
  const [lichSu, setLichSu] = useState<string | null>(null);
  const toast = useToast();
  const dangKhoiPhuc = useRef(false);   // chống bấm đúp
  /* LUAT-34 (T20b): "Khôi phục điểm" một bấm — máy chủ ghi lại điểm cất qua đúng đường lưu điểm (quyền, nhật ký). */
  const khoiPhuc = async (k: string) => {
    try {
      if (dangKhoiPhuc.current) return;
      dangKhoiPhuc.current = true;
      await api.post(`/attempts/${row.attemptId}/skills/${k}/khoi-phuc-diem`, {});
      invalidate('/regular'); invalidate('/classes'); invalidate('/attempts'); invalidate('/students'); invalidate('/my-work');
      toast.push('ok', t('Đã khôi phục điểm {x}{x2}', { x: tenMonNgan(ct, k), x2: ` · ${row.studentName}` }));
      onReload();
    } catch (e: any) { toast.push('error', e.message); } finally { dangKhoiPhuc.current = false; }
  };
  /*
   * MENU ⋯ TỪNG Ô (K4-32): thao tác theo `thaoTacKyNang` (laFt = false → không bao giờ có "Bỏ kỹ năng khỏi đợt") + mục cuối
   * "Lịch sử" (không phải thao tác, ngoài ≤ 3 — Q5). Nhập/Sửa điểm làm ngay trong ô nên không lặp trong menu. Nút ⋯ đứng SAU ô nhập
   * trong DOM: Tab đi qua ô nhập trước, Enter/mũi tên của ô giữ nguyên.
   */
  const menuO = (k: string) => {
    const s = lichCua(row, k);
    const coDiem = (ketQuaCua(row, k)?.score ?? null) !== null;
    const tt = trangThaiTT({ batBuoc: true, tuanBatDau: s?.weekStart ?? null, coDiem, sit: s?.sitStatus ?? null, choDuyet: false, lichSu: false, homNay });
    const tat = thaoTacKyNang(tt, { nhapDiem: s?.canEdit ?? false, quanLy: sheet.canPlan, gvcn: !!sheet.laGvcn, laFt: false, dotHoanTat: !!row.hoanTat, doiLich: s?.doiLich,
      huy: can(PERMISSIONS.ATTEMPT_SKIP_SKILL), han: can(PERMISSIONS.DEADLINE_OVERRIDE), diemHuy: !!s?.diemHuy });
    const ds = [...(tat.chinh && THAO_TAC_CO_HOP.includes(tat.chinh) ? [tat.chinh] : []), ...tat.menu];
    /* OV-11i (P3-3): chỉ ẩn chờ rê chuột khi thiết bị rê được — máy tính bảng cảm ứng ≥ 640 px vẫn thấy ⋯. */
    return (
      <span className="absolute right-1 top-1/2 -translate-y-1/2 sm:[@media(hover:hover)]:hidden sm:[@media(hover:hover)]:group-hover:block sm:[@media(hover:hover)]:group-focus-within:block">
        <MenuDong nhan={t('Thao tác · {tenMon} · {studentName}', { tenMon: tenMon(ct, k), studentName: row.studentName })} muc={[
          ...ds.map((x) => ({ key: x, nhan: CHU_THAO_TAC[x], onChon: () => (x === 'khoi-phuc-diem' ? void khoiPhuc(k) : setHop({ t: x, k })), nguyHiem: x === 'huy-diem' })),
          { key: 'lich-su', nhan: t('Lịch sử'), onChon: () => setLichSu(k), keTruoc: ds.length > 0 },
        ]} />
      </span>
    );
  };
  const hopO = hop && (() => {
    const s = lichCua(row, hop.k);
    return (
      <HopThaoTacMt key={`${hop.t}:${hop.k}`} thaoTac={hop.t} attemptId={row.attemptId} skill={hop.k} ct={ct} laThuong
        quanLy={sheet.canPlan}
        row={{ periodId: null, weekStart: s?.weekStart ?? null, deadline: s?.deadline ?? null }}
        onClose={() => setHop(null)} onDone={onReload} />
    );
  })();

  return (
    <tr className={`do-hang ${row.studentStatus !== 'active' ? 'row-muted' : ''} ${active ? 'dang-mo' : ''}`}
      data-hv={row.studentId}>
      {/* Tên + chip "Đủ điểm" một dòng; MỘT dòng phụ: dòng thi · trạng thái lưu của dòng (BANG-1). */}
      <OBang c={cc.hv}>
        <span className="inline-flex max-w-full items-center gap-1.5 align-baseline">
          {/* HSL-LT: tên em mở hồ sơ lượt lớp thường (như tên em ở lưới FT → hồ sơ lượt Mock); hồ sơ HV là tên ↗ ở đầu trang đó. */}
          <Link className="ten-ho-so min-w-0 truncate max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center" to={duongDotTest({ id: row.attemptId, kind: row.kind.split(':')[0], classId: sheet.class.id })} title={row.studentName}>{row.studentName}</Link>
          {row.hoanTat && <Info title={t('Hết Chủ nhật {ngay}. {x}', { ngay: ngay(row.chuNhatCuoi), x: KHOA_HOAN_TAT_HINT })}>{t('Đủ điểm')}</Info>}
        </span>
        <div className="bang-phu !flex items-center gap-1.5" data-phu-odiem="">
          <DongThi muc={row.skillSchedule.filter((s) => s.progress !== 'cancelled' && s.progress !== 'skipped')
            .map((s) => ({ nhan: tenMonNgan(sheet.programme.code, s.skill), weekStart: s.weekStart }))} />
          <DauLuu status={status} error={lastError} onRetry={coGuiLai ? retry : undefined} soLoi={soLoi} />
        </div>
      </OBang>
      {sheet.programme.skills.map((k, ci) => {
        const { s, canEdit, trong, dung, chuDung, quaHan, cell } = oThuong(row, k, homNay);
        /*
         * MÔN VẮNG / ĐÃ HUỶ PHẦN THI mà chưa có điểm: không phải một ô trống chờ nhập — hiện đúng trạng thái, không có ô
         * nhập (việc tiếp theo là xếp lại lịch, không phải chấm). Đã có điểm thì vẫn là ô điểm như thường.
         */
        if (tuanDangXem && s?.weekStart && s.weekStart !== tuanDangXem && cell.diem === null && !s.noShow) {
          return (
            <OBang key={k} c={cc[k]} className="group relative text-slate-500" data-kn={k} tabIndex={0}
              title={t('{tenMon}: làm bài tuần {tuanLich}', { tenMon: tenMon(sheet.programme.code, k), tuanLich: tuanLich(s.weekStart, homNay) })}>
              <span className="inline-flex items-baseline gap-1">{tuanLich(s.weekStart, homNay)}{menuO(k)}</span>
            </OBang>
          );
        }
        if (dung) {
          return (
            <OBang key={k} c={cc[k]} className="group relative" data-kn={k} tabIndex={0}>
              <span className="inline-flex items-center gap-1">
                <span className="text-xs text-slate-500" title={`${tenMon(sheet.programme.code, k)}: ${chuDung}`}>{chuDung}</span>
                {menuO(k)}
              </span>
            </OBang>
          );
        }
        return (
          <OBang key={k} c={cc[k]} className={`group relative ${o[k] === 'loi' ? VIEN_LOI : ''}`} data-kn={k} tabIndex={canEdit ? undefined : 0}
            data-trong={trong ? '1' : undefined} data-luu={o[k]}>
            <DauO tt={o[k]} loi={loi[k]} onLuuLai={() => luuLai(k)} />
            {/* BANG-1: Nhận xét · đúng / tổng một hàng; ⋯ ở mép phải ô, ẩn tới khi rê chuột / focus vào ô (điện thoại luôn hiện). */}
            <div className={`inline-flex items-baseline justify-center gap-1 ${(s?.nhanXetDuoc ?? canEdit) && s ? 'pr-1.5' : ''}`}>{/* bù đệm trái nút Nhận xét → hai mép cân, số thẳng tâm cột */}
            {(s?.nhanXetDuoc ?? canEdit) && s && (
              <NutNhanXet tenMon={tenMon(sheet.programme.code, k)} giaTri={s.nhanXet ?? null}
                phu={[row.studentName, sheet.class.code, s.weekStart ? tuanLich(s.weekStart, homNay) : null].filter(Boolean).join(' · ')}
                nguon={{ bang: 'assessment_scores', id: row.attemptId, cot: 'comment', kyNang: k }} onLuu={(v) => nhanXet(k, v)} />
            )}
            <ODiemThuong
              /* PR-BV (L2): đang xem đúng tuần có dấu "-" mà tuần mới đã có điểm — ô hiện "-" để gỡ được. */
              cell={{ ...cell, oTuanCu: !!tuanDangXem && s?.movedFromStart === tuanDangXem }}
              tongCot={tongCot(k)}
              /* C9: ô tổng trống hiện sẵn tổng chung của cột (chưa là bản nháp) — gõ số câu đúng là lưu kèm tổng đó. */
              tongLaySan={tongCot(k) !== null}
              canEdit={canEdit}
              dienTong={dien[k] ?? null}
              chiChuKetQua={CHUONG_TRINH_KHONG_CHIA_MON.includes(sheet.programme.code)}
              tenMon={tenMon(sheet.programme.code, k)}
              tenHv={row.studentName}
              onSave={(p, o) => luu(k, p, o)}
              onDau={(bat) => dau(k, bat)}
              onLoiNhap={(c) => loiNhap(k, c)}
              inputRef={(el) => register(ci, el)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); onMove(rowIndex, ci, 1, e.key === 'Enter'); }
                if (e.key === 'ArrowUp') { e.preventDefault(); onMove(rowIndex, ci, -1); }
              }}
            />
            </div>
            {menuO(k)}
            {quaHan && (
              <div className="text-xs leading-4 text-slate-400" data-phu-odiem=""
                title={t('{tenMon}: hạn chấm {ngay} đã qua', { tenMon: tenMon(sheet.programme.code, k), ngay: ngay(s!.deadline, homNay) })}>{quaHan}</div>
            )}
          </OBang>
        );
      })}
      {laCp && (
        <OBang c={cc.pt} className={`font-bold ${row.chip ? (row.chip.dat ? 'text-kq-vuot' : 'text-kq-duoi') : 'text-slate-500'}`}>
          {row.result.tyLeTong != null ? `${Math.round(row.result.tyLeTong * 100)}%` : '—'}
        </OBang>
      )}
      <OBang c={cc.kq}>
        <KetQua row={row} sheet={sheet} />
        {hopO}
        {lichSu && <NganLichSuBai attemptId={row.attemptId} skill={lichSu} ct={ct} tenHv={row.studentName} onClose={() => setLichSu(null)} />}
      </OBang>
    </tr>
  );
}

/**
 * CỘT KẾT QUẢ: một dòng chính từ `ketQuaThuong` (Q9 — "Đạt 2/2 môn đã chấm", thiếu điểm KHÁC chưa đạt) và TỐI ĐA MỘT
 * dòng phụ (G-3): môn đang mang "-" mà chưa có điểm ("L dời sang W4 SEP", Ruling 5), nếu không thì môn còn thiếu.
 *
 * CASE KHÔNG TRANH CHỖ DÒNG PHỤ (Task 4, spec §6 dòng 4): một em trượt L có Case trong khi W, S còn ở tuần sau là tình
 * huống thường gặp — nếu Case đứng cuối hàng ưu tiên thì nó biến mất đúng lúc cần thấy. Nên Case là một nhãn trạng thái
 * nhỏ đứng CẠNH dòng chính ("Case L"), màu theo Case đại diện (đang mở trước — `cases[0]`), tooltip ghi đủ từng Case.
 */
export function KetQua({ row, sheet, anCase = false }: { row: Row; sheet: ThuongSheet; anCase?: boolean }) {
  const r = row.result;
  const ngan = (k: string) => tenMonNgan(sheet.programme.code, k);
  const du = (k: string) => tenMon(sheet.programme.code, k);
  const dat = r.skills.filter((s) => s.outcome === 'pass').length;
  const thieu = r.skills.filter((s) => s.outcome === 'missing').map((s) => ngan(s.skill));
  /* MH7: Pre FOU không chia môn — kết quả là % tổng, tông đạt/chưa đạt (không SOS). */
  const khongChiaMon = CHUONG_TRINH_KHONG_CHIA_MON.includes(sheet.programme.code);
  const kq = ketQuaThuong({ dat, daCham: r.scored, tong: r.required, thieu, tyLe: r.tyLeTong ?? null, khongChiaMon });
  const truot = (r.failedCount ?? 0) > 0;

  /* Dòng phụ — một dòng, ≤ ~60 ký tự. */
  const doi = new Map<string, string[]>();
  /* OV-11a: môn Không dự thi không "dời" — dòng phụ ghi đúng tên. */
  const kdt = row.skillSchedule.filter((s) => s.khongDuThi).map((s) => s.skill);
  for (const s of row.skillSchedule) {
    if (!s.noShow || s.khongDuThi || ketQuaCua(row, s.skill)?.outcome !== 'missing' || !s.weekStart) continue;
    const t = tuanLich(s.weekStart, sheet.today);
    doi.set(t, [...(doi.get(t) ?? []), s.skill]);
  }
  const doiDau = [...doi.entries()][0];
  const phu: { chu: string; tone: string; title: string } | null = doiDau
    ? {
      chu: t('{x} dời sang {x2}', { x: doiDau[1].map(ngan).join(', '), x2: doiDau[0] }), tone: 'text-slate-400',
      title: t('{x}: em không làm bài, môn đã dời sang {x2}.', { x: doiDau[1].map(du).join(', '), x2: doiDau[0] }),
    }
    : kdt.length ? { chu: t('{x} vắng', { x: kdt.map(ngan).join(', ') }), tone: 'text-slate-400', title: t('{x}: Vắng.', { x: kdt.map(du).join(', ') }) }
    : row.goiY
      ? { chu: dich(row.goiY.nhanNgan), tone: 'text-slate-500', title: `${nhanGoiY(row.goiY)}${kq.phu ? ` — ${kq.phu}` : ''}` }
    : kq.phu && !row.chip
      ? {
        chu: `${kq.phu}${row.overdue ? t(' · quá hạn') : ''}`, tone: row.overdue ? 'text-rose-300' : 'text-slate-500',
        title: `${kq.phu}${row.overdue ? t(' — có môn đã quá hạn chấm') : ''}`,
      }
      : null;

  const chiTiet = r.skills.map((s) => `${ngan(s.skill)} ${s.score === null ? '—' : `${s.score}/${s.total ?? '?'}`}`).join(' · ');
  /* OV-15a: màu SOS chỉ ở chip SOS (viền) — kết quả lớp thường: Đạt xanh lá · có môn trượt đỏ (chưa đạt) · chưa đủ điểm xám. */
  const tone = khongChiaMon ? (truot ? 'warn' : r.complete ? 'ok' : 'muted')
    : truot ? 'danger' : r.complete ? 'ok' : 'muted';
  const chinh = row.chip
    /* OV-6b2: Checkpoint đủ điểm — chip "Đạt" / "SOS · L+S" (chưa đạt chỉ chip, không Case). Chữ nói kết quả, màu chỉ đi kèm. */
    ? <Level tone={row.chip.dat ? 'ok' : 'danger'} title={chiTiet}>{dich(row.chip.chu)}</Level>
    : r.scored === 0
    ? <span className="text-xs text-slate-500">{kq.chinh}</span>
    : (
      <Level tone={tone} title={chiTiet}>
        {/* PR-LT2b: Cuối khoá đủ điểm → tầng 1 là % tổng (hướng gợi ý ở dòng phụ); Giữa khoá giữ `n/4 môn đạt`. */}
        {row.kind === 'final' && r.tyLeTong != null && !khongChiaMon ? `${Math.round(r.tyLeTong * 100)}%` : kq.chinh}
      </Level>
    );

  /* Nhãn Case: một nhãn cho cả dòng, liệt kê môn; tooltip "Case Listening · Đang xử lý" cho từng Case. */
  const cases = row.cases;
  const dauCase = cases[0] ?? null;
  const nhanCase = dauCase && !anCase && (
    <Status
      kind={dauCase.status === 'done' ? 'done' : dauCase.status === 'open' ? 'idle' : 'doing'}
      title={cases.map((c) => `Case ${du(c.skill)} · ${dich(caseStatusLabel(c.status))}`).join('\n')}>
      Case {sheet.programme.skills.filter((k) => cases.some((c) => c.skill === k)).map(ngan).join(', ')}
    </Status>
  );

  return (
    <div className="flex flex-col items-start gap-0.5 min-w-0">
      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
        {chinh}
        {nhanCase}
      </div>
      {/* OV-11e (CA3-11): dòng phụ xuống dòng, không cắt. */}
      {phu && <span className={`block max-w-full truncate text-xs leading-4 ${phu.tone}`} data-phu-odiem="" title={phu.title}>{dich(phu.chu)}</span>}
    </div>
  );
}
