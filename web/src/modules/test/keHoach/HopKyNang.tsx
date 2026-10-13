import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, invalidate } from '../../../lib/api.ts';
import { useNgayNghiepVu } from '../../../ui/ngayNghiepVu.ts';
import { addDaysStr } from '../../../lib/format.ts';
import { useToast } from '../../../ui/Toast.tsx';
import { useSession } from '../../../lib/session.tsx';
import {
  CAU_TUAN_DA_QUA, CHU_MUC_HOP, PERMISSIONS, chipDongKyNang, duongDotTest, kiemTuanXep, menuHopKyNang, mondayOfDate,
  nhanTuanKhoa, tenMon, tenMonNgan, thaoTacKyNang, theoTuanChung, trangThaiTT, tuanDaSo, tuanLich, tuanMacDinhDotMoi,
  type BaiXemTruoc, type DongHangLoat, type KyNangKH, type MucHop, type OKyNang, type ThaoTac, type TrangThaiTT,
} from '@shared/domain/index.ts';
import { KY, khoaBaiThuong, thanDot, type DotChon, type KnO } from './kieu.ts';
import { Nhan } from '../../../ui/Nhan.tsx';
import { Truong } from '../../../ui/KhungPanel.tsx';
import { TuanNho, resolveTuan, type Tuan } from './TuanNho.tsx';
import { MenuDong } from '../../../ui/MenuDong.tsx';
import { useGiuFocus } from '../../../ui/giuFocus.ts';
import { HopThaoTacMt } from '../../fasttrack/HopThaoTacMt.tsx';
import { HopHuyMt } from '../../fasttrack/HopHuyMt.tsx';
import { NganLichSuBai } from '../../cham/NganLichSuBai.tsx';

type Dong = { tick: boolean; periodId: number | null; weekStart: string | null };

/**
 * HỘP MỘT ĐỢT (mockup test-MT 05/10 phần 2; trước là "hộp kỹ năng" mockup 14 (1), Q19) — hộp nhỏ NEO CẠNH chip vừa bấm (portal,
 * `position: fixed`, kẹp trong màn); 375px thì là tấm dưới đáy rộng hết màn. Dùng ở Kế hoạch Test và hồ sơ HV › Lộ trình.
 *   · đầu `{tên em} · MT{n}` + ✕ · hàng "Tuần chung" (đổi một lần cho mọi dòng còn hiệu lực — kể cả có điểm / đã thi, điểm giữ (luật 1, PR-HOP1) — trừ dòng đã "Đổi tuần" riêng, đã huỷ, vắng, chờ duyệt) ·
 *     bốn dòng `ô tích · L Listening · trạng thái · ⋯`:
 *       - có điểm → `W3 SEP · 6.5`; chưa điểm → chip tuần + chip trạng thái (`trễ chấm` · `chờ chấm` · `vắng` · `huỷ`, luật `oMt`);
 *       - ⋯ LUÔN hiện, năm mục cố định `menuHopKyNang` (một nguồn `thaoTacKyNang`); mục chưa làm được mờ, tooltip nói vì sao;
 *       - "Đổi tuần": dòng thường → bộ chọn tuần riêng ngay trên dòng; dòng vắng → Xếp lại bài vắng; dòng đã huỷ → Khôi phục và đặt tuần;
 *       - FT: bỏ tích = bỏ kỹ năng khỏi đợt; dòng đã tới tuần thi / đã có điểm tích sẵn, khoá; lớp thường không có ô tích (luôn đủ bộ môn).
 *   · mỗi lần đổi tuần gọi `/ke-hoach-test/dot/kiem` (đợt đã có) hoặc xem trước hàng loạt một em (đợt chưa có) → CHỈ dòng đỏ
 *     `Chặn: …` (Lưu tắt; PR-MTGON: dời vượt lượt sau cũng chặn ở đây) và dòng vàng (cảnh báo → nút đổi thành `Vẫn xếp vào tuần này`;
 *     chip "Tuần đã qua"). Hộp chỉ dành cho Quản lý / Quản trị: chọn được tuần đã qua ở mọi lượt (T4, T20 — rà #212).
 * PR-HOP1: một việc dời lịch một MT chỉ có hộp này và một đường lưu `/ke-hoach-test/dot` (Hồ sơ MT cũng mở nó). FT đợt đã có: ⋯ đầu
 *   hộp `Huỷ MT{n} · Nhật ký · Mở hồ sơ MT`. `doiTuanDau`: dòng `kyNangDau` mở sẵn bộ chọn tuần (⋯ "Dời lịch thi" một kỹ năng).
 * Bộ chọn tuần KHỞI TẠO bằng TUẦN HIỆN CÓ (Bổ sung sau rà #87): không để bộ chọn tự phát "tuần này" làm nút Lưu mở ngay.
 */
export function HopKyNang({ anchor, tieuDe, loai, classId, studentId, dot, attemptId, kn, kyNangDau, deXuat, khaiGiang, tongTuan, onClose, onSaved, onHienDien, ky = KY, ct = null, lichSu = false, doiTuanDau = false }: {
  anchor: HTMLElement; tieuDe: string; loai: 'ft' | 'thuong'; classId: number; studentId: number; dot: DotChon;
  /** Lớp thường: bộ môn của chương trình (Pre FOU một dòng Tổng hợp — PF6); FT: 4 kỹ năng. `ct` = mã chương trình (tên FOU G+V/P). */
  ky?: readonly KyNangKH[]; ct?: string | null;
  attemptId: number | null; kn: KnO; kyNangDau: KyNangKH | null;
  /** PR-XLMT: MT lịch sử — menu thao tác theo trạng thái `lich-su`. */
  lichSu?: boolean;
  doiTuanDau?: boolean;
  deXuat?: string | null; khaiGiang?: string | null; tongTuan?: number | null;
  onClose: () => void; onSaved: () => void; onHienDien: (open: boolean) => void;
}) {
  const toast = useToast();
  const moi = attemptId === null;
  const nghiepVu = useNgayNghiepVu().homNay;
  const homNay = nghiepVu ? mondayOfDate(nghiepVu) : null;
  const ngayNghiepVu = nghiepVu || null;
  const [thaoTac, setThaoTac] = useState<{ t: ThaoTac; k: KyNangKH } | null>(null);
  /** `ca-luot` = nhật ký cả lượt (⋯ đầu hộp). */
  const [nhatKy, setNhatKy] = useState<KyNangKH | 'ca-luot' | null>(null);
  const [huyMt, setHuyMt] = useState(false);
  /* PR-OV4a: "Huỷ MT{n}" chỉ Quản lý / Quản trị (`attempt.cancel`) — Admin mở được hộp xếp lịch nhưng không có nút Huỷ (máy chủ cũng 403). */
  const { can } = useSession();
  const coHuy = can(PERMISSIONS.ATTEMPT_CANCEL);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  /* PR-MTa T20: Quản lý dời được kỹ năng đã có điểm / đã thi (điểm đi theo) — chỉ phần đã huỷ là chỉ đọc. */
  const laKhoa = (k: KyNangKH) => !moi && kn[k]?.khoa === 'đã huỷ phần thi';
  /* Menu ⋯ từng dòng theo `thaoTacKyNang` qua `menuHopKyNang` (T38; mockup phần 2). Hộp là màn của Quản lý. */
  const quyen = { nhapDiem: true, quanLy: true, gvcn: false, laFt: loai === 'ft', dotHoanTat: false,
    huy: can(PERMISSIONS.ATTEMPT_SKIP_SKILL), han: can(PERMISSIONS.DEADLINE_OVERRIDE) };
  const ttCua = (k: KyNangKH): TrangThaiTT => {
    const o = kn[k];
    if (moi) return 'chua-xep';
    if (!o || !ngayNghiepVu) return 'khong-yeu-cau';
    return trangThaiTT({ batBuoc: o.batBuoc, tuanBatDau: o.tuan, coDiem: o.khoa === 'đã có điểm', sit: o.sit, choDuyet: o.choDuyet, lichSu, homNay: ngayNghiepVu, huyVang: o.huyVang });
  };
  const menuCua = (k: KyNangKH) => menuHopKyNang(ttCua(k), quyen, moi);
  /** Dòng đổi tuần thường (không qua Xếp lại / Khôi phục; không đã huỷ / vắng / chờ duyệt) — theo "Tuần chung", kể cả có điểm (điểm giữ, luật 1). */
  const theoChungDau = (k: KyNangKH) => !laKhoa(k) && theoTuanChung(ttCua(k), quyen, moi);

  const khoiTao = (): Record<KyNangKH, Dong> => {
    const o = {} as Record<KyNangKH, Dong>;
    for (const k of ky) o[k] = moi ? { tick: true, periodId: null, weekStart: null } : { tick: kn[k]?.batBuoc ?? false, periodId: kn[k]?.periodId ?? null, weekStart: kn[k]?.tuan ?? null };
    return o;
  };
  /** Giá trị đầu của "Tuần chung" = tuần nhiều dòng nhất trong các dòng đã tích, chưa điểm, không khoá (`tuanDaSo`). */
  const chungKhoiTao = (): Tuan | null => {
    if (moi) return null;
    const nhom = ky.filter((k) => (kn[k]?.batBuoc ?? false) && theoChungDau(k));
    const { tuan } = tuanDaSo(nhom.map((k) => kn[k]?.tuan ?? null));
    const o = nhom.map((k) => kn[k]).find((x) => x?.tuan === tuan);
    return tuan && o?.periodId ? { periodId: o.periodId, weekStart: tuan } : null;
  };

  const [rows, setRows] = useState<Record<KyNangKH, Dong>>(khoiTao);
  const [chung, setChung] = useState<Tuan | null>(chungKhoiTao);
  /** Dòng đã bấm "Đổi tuần" riêng: bộ chọn tuần hiện ngay trên dòng và không theo "Tuần chung" nữa. */
  const [rieng, setRieng] = useState<Partial<Record<KyNangKH, boolean>>>(() => (doiTuanDau && kyNangDau ? { [kyNangDau]: true } : {}));
  const [daChinh, setDaChinh] = useState(false);
  const macDinhMoi = useRef<{ rows: Record<KyNangKH, Dong>; chung: Tuan } | null>(null);
  const [force, setForce] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lyDo, setLyDo] = useState('');
  const [bai, setBai] = useState<BaiXemTruoc[] | null>(null);
  const seq = useRef(0);

  useEffect(() => { onHienDien(true); return () => onHienDien(false); }, []);   // eslint-disable-line react-hooks/exhaustive-deps


  /* Đợt CHƯA CÓ: đặt sẵn tuần mặc định — FT: cả 4 kỹ năng CÙNG tuần tới (K4-14, M9 `tuanMacDinhDotMoi`); lớp thường: tuần đề xuất. */
  useEffect(() => {
    if (!moi) return;
    let huy = false;
    const lam = async () => {
      const goc = loai === 'thuong' ? (deXuat ?? homNay) : ngayNghiepVu ? tuanMacDinhDotMoi(ngayNghiepVu) : null;
      if (!goc) return;
      const t = await resolveTuan(goc);
      if (huy) return;
      const r = Object.fromEntries(ky.map((k) => [k, { tick: true, periodId: t.periodId, weekStart: t.weekStart }])) as Record<KyNangKH, Dong>;
      macDinhMoi.current = { rows: r, chung: t };
      setRows(r); setChung(t);
    };
    void lam().catch(() => { /* người dùng vẫn chọn tay được */ });
    return () => { huy = true; };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const daDoi = (k: KyNangKH) => {
    if (laKhoa(k)) return false;
    const o = kn[k];
    if (moi) return true;
    const batBuoc = o?.batBuoc ?? false;
    if (batBuoc !== rows[k].tick) return true;
    return rows[k].tick && rows[k].periodId !== null && rows[k].periodId !== (o?.periodId ?? null);
  };
  const coDoi = ky.some(daDoi);
  const daSua = moi ? daChinh : coDoi;
  const bo = ky.filter((k) => !moi && !laKhoa(k) && (kn[k]?.batBuoc ?? false) && !rows[k].tick);
  const coTuan = ky.filter((k) => !laKhoa(k) && rows[k].tick && rows[k].periodId);
  const dungKy = ky.filter((k) => rows[k].tick);
  const thieuTuan = moi && dungKy.some((k) => !rows[k].periodId);

  /* Kiểm mỗi lần đổi tuần (trễ nhẹ, bỏ kết quả lượt cũ). */
  const khoaKiem = JSON.stringify(coTuan.map((k) => [k, rows[k].periodId, daDoi(k)]));
  useEffect(() => {
    setForce(false);
    const mySeq = ++seq.current;
    if (moi) {
      if (thieuTuan || !dungKy.length) { setBai(null); return; }
      const t = setTimeout(() => {
        const tuan: Record<string, number> = {};
        for (const k of dungKy) tuan[k] = rows[k].periodId!;
        api.post<{ dong: DongHangLoat[] }>('/ke-hoach-test/hang-loat', {
          classId, ...thanDot(dot), studentIds: [studentId], tuan, xemTruoc: true, ...(loai === 'ft' ? { kyNang: dungKy } : {}),
        }).then((r) => {
          if (mySeq !== seq.current) return;
          const d0 = r.dong[0];
          /* Em lỗi không có bài chặn cụ thể (vd chưa có lộ trình) → hiện câu lỗi như một bài chặn. */
          setBai(d0 && d0.hanhDong === 'loi' && d0.loi && !d0.bai.some((b) => b.ghiChu === 'chan')
            ? [{ skill: 'listening', tu: null, den: null, ghiChu: 'chan', cau: d0.loi }] : d0?.bai ?? []);
        })
          .catch(() => { if (mySeq === seq.current) setBai(null); });
      }, 250);
      return () => clearTimeout(t);
    }
    const doi = coTuan.filter(daDoi);
    if (!doi.length) { setBai([]); return; }
    api.post<{ bai: BaiXemTruoc[] }>('/ke-hoach-test/dot/kiem', {
      attemptId, kyNang: doi.map((k) => ({ skill: k, periodId: rows[k].periodId })),
    }).then((r) => { if (mySeq === seq.current) setBai(r.bai); })
      .catch(() => { if (mySeq === seq.current) setBai(null); });
  }, [khoaKiem, moi]);   // eslint-disable-line react-hooks/exhaustive-deps

  const chan = (bai ?? []).filter((b) => b.ghiChu === 'chan');
  const canhBao = !chan.length ? (bai ?? []).filter((b) => b.ghiChu === 'canh-bao') : [];
  const cauChan = chan.length ? `Chặn: ${[...new Set(chan.map((b) => b.cau))].join(' ')}` : '';
  const cauCanhBao = canhBao.length ? [...new Set(canhBao.map((b) => b.cau))].join(' ') : '';

  const luuDuoc = !busy && !chan.length && (moi ? !thieuTuan && dungKy.length > 0 && !!bai : coDoi);
  /* T4: Quản lý chọn tuần đã qua cho kỹ năng chưa thi → chip vàng (không chặn). Chỉ tính dòng vừa đổi — tuần cũ giữ nguyên không phải "chọn". */
  const quaTuan = !!nghiepVu && coTuan.some((k) => daDoi(k) && !!rows[k].weekStart && (moi || kn[k]?.khoa == null)
    && kiemTuanXep({ ketThuc: [addDaysStr(rows[k].weekStart.slice(0, 10), 6)], homNay: nghiepVu, quanLy: true }).quaTuan);

  const luu = async () => {
    if (!luuDuoc) return;
    setBusy(true);
    const dungForce = force || canhBao.length > 0;
    try {
      if (moi) {
        const tuan: Record<string, number> = {};
        for (const k of dungKy) tuan[k] = rows[k].periodId!;
        if (dot.loai === 'ft') {
          await api.post('/ke-hoach-test/xep-moi', { studentId, attemptNo: dot.attemptNo, tuan, bo: ky.filter((k) => !rows[k].tick), lyDoBo: null, force: dungForce });
        } else await api.post('/ke-hoach-test/xep-moi', { classId, studentId, kind: dot.kind, tuan, force: dungForce });
      } else {
        const kyNang = ky.filter((k) => daDoi(k) || (bo.includes(k))).map((k) => (
          !rows[k].tick ? { skill: k, bo: true }
            : !(kn[k]?.batBuoc ?? false) ? { skill: k, bo: false, periodId: rows[k].periodId }
              : { skill: k, periodId: rows[k].periodId }
        ));
        await api.post('/ke-hoach-test/dot', { attemptId, kyNang, lyDoBo: null, reason: lyDo.trim() || null, force: dungForce });
      }
      toast.push('ok', 'Đã lưu lịch.');
      invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham');
      onSaved(); onClose();
    } catch (e: any) {
      toast.push('error', e.message ?? 'Không lưu được — thử lại.');
    } finally {
      setBusy(false);
    }
  };

  /* Tuần chung: dòng theo chung = đã tích, chưa điểm / chưa thi, không "Đổi tuần" riêng. */
  const trongChung = (k: KyNangKH) => rows[k].tick && !rieng[k] && theoChungDau(k);
  const nhomChung = ky.filter(trongChung);
  const datChung = (t: Tuan) => {
    setChung(t); setDaChinh(true);
    setRows((s) => Object.fromEntries(ky.map((k) => [k, trongChung(k) ? { ...s[k], periodId: t.periodId, weekStart: t.weekStart } : s[k]])) as Record<KyNangKH, Dong>);
  };
  const datTuanDong = (k: KyNangKH, t: Tuan) => { setDaChinh(true); setRows((s) => ({ ...s, [k]: { ...s[k], periodId: t.periodId, weekStart: t.weekStart } })); };
  const datTick = (k: KyNangKH, v: boolean) => {
    setDaChinh(true);
    /* Đưa lại vào đợt: chưa có tuần thì lấy "Tuần chung" (máy chủ cần tuần cho kỹ năng được đưa lại). */
    setRows((s) => ({ ...s, [k]: { tick: v, periodId: v && !s[k].periodId && chung ? chung.periodId : s[k].periodId, weekStart: v && !s[k].periodId && chung ? chung.weekStart : s[k].weekStart } }));
  };
  const huyDoi = () => {
    setRows(moi ? (macDinhMoi.current?.rows ?? khoiTao()) : khoiTao());
    setChung(moi ? (macDinhMoi.current?.chung ?? null) : chungKhoiTao());
    setRieng({}); setDaChinh(false); setForce(false); setLyDo('');
  };
  const chonMuc = (k: KyNangKH, muc: MucHop, thay?: 'xep-lai' | 'khoi-phuc') => {
    if (muc === 'doi-tuan') { if (thay) setThaoTac({ t: thay, k }); else setRieng((s) => ({ ...s, [k]: true })); }
    else if (muc === 'nhat-ky') setNhatKy(k);
    else setThaoTac({ t: muc, k });
  };

  /* Vị trí: neo dưới chip, kẹp trong màn; hết chỗ thì lật lên. < 640px → tấm dưới đáy. */
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  /* Bàn phím: hộp nằm cuối `body` (portal) nên Tab từ ô MT không tới được — mở là đưa focus vào hộp, Tab vòng trong hộp, đóng thì trả focus về ô đã mở nó. */
  useGiuFocus(box);
  const dienThoai = typeof window !== 'undefined' && window.innerWidth < 640;
  const dat = () => {
    if (dienThoai) return;
    const r = anchor.getBoundingClientRect();
    const rong = Math.min(520, window.innerWidth - 32);
    const cao = box.current?.offsetHeight ?? 360;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - rong - 8);
    const duoi = r.bottom + 4;
    const top = duoi + cao > window.innerHeight - 8 ? Math.max(8, r.top - cao - 4) : duoi;
    setPos((p) => (p && p.top === top && p.left === left ? p : { top, left }));
  };
  useLayoutEffect(() => { dat(); });   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const away = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (box.current?.contains(t) || anchor.contains(t) || t.closest('[role="dialog"], [role="menu"]')) return;
      onClose();
    };
    /* Esc chỉ đóng lớp TRÊN CÙNG: có hộp / panel modal mở SAU hộp này (trong hộp, hoặc vẽ ra `body` sau nó) thì để lớp đó tự đóng. Panel mở
       TRƯỚC hộp (Lộ trình hồ sơ HV) không chặn — trước đây chặn nên Esc không đóng được hộp ở đó. */
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || !box.current) return;
      const phiaTren = [...document.querySelectorAll('[aria-modal="true"]')].some((m) => box.current!.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING);
      if (!phiaTren) onClose();
    };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    window.addEventListener('resize', dat);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); window.removeEventListener('resize', dat); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  /* ⋯ đầu hộp (PR-HOP1): chữ y như nơi khác — "Huỷ MT{n}" (Hồ sơ MT), "Nhật ký" (⋯ dòng), "Mở hồ sơ MT" (Lộ trình). */
  const hoSo = attemptId !== null && dot.loai === 'ft' ? duongDotTest({ id: attemptId, kind: 'mock', classId }, null) : null;
  const mucDau = attemptId === null || dot.loai !== 'ft' ? [] : [
    ...(coHuy ? [{ key: 'huy-mt', nhan: `Huỷ MT${dot.attemptNo}`, nguyHiem: true, onChon: () => setHuyMt(true) }] : []),
    { key: 'nhat-ky', nhan: CHU_MUC_HOP['nhat-ky'], onChon: () => setNhatKy('ca-luot') },
    ...(hoSo && hoSo !== pathname ? [{ key: 'ho-so', nhan: 'Mở hồ sơ MT', onChon: () => { onClose(); navigate(hoSo); } }] : []),
  ];
  const nutLuu = canhBao.length && !force ? 'Vẫn xếp vào tuần này' : 'Lưu';
  const nhanChung = loai === 'thuong' && chung?.weekStart ? nhanTuanKhoa(chung.weekStart, khaiGiang ?? null, tongTuan ?? null) : null;
  const coDongDuoi = !!cauChan || !!cauCanhBao || quaTuan;
  /* Chưa có vị trí: opacity 0 (không dùng visibility:hidden — phần tử ẩn không nhận focus của `useGiuFocus` lúc mở). */
  return createPortal(
    <div ref={box} role="dialog" aria-label={`Lịch ${tieuDe}`} tabIndex={-1}
      className={`surface-2 z-[60] border shadow-2xl outline-none ${dienThoai ? 'fixed inset-x-0 bottom-0 rounded-t-xl' : 'fixed w-[min(520px,calc(100vw-32px))] rounded-lg'}`}
      style={{ borderColor: 'var(--line-strong)', ...(dienThoai ? {} : { top: pos?.top ?? 0, left: pos?.left ?? 0, opacity: pos ? 1 : 0 }) }}>
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2" style={{ borderColor: 'var(--line)' }}>
        {/* Đợt đã có → tên là liên kết tới hồ sơ đợt (`duongDotTest`, một đường dẫn ở mọi màn); bấm thì đóng hộp. Đợt mới: chữ. */}
        <div className="min-w-0 flex-1 text-sm font-bold text-slate-100" title={tieuDe}>
          {attemptId !== null
            ? <Link to={duongDotTest({ id: attemptId, kind: dot.loai === 'thuong' ? khoaBaiThuong(dot.kind) : 'mock', classId }, null)} onClick={onClose}
                className="link flex min-h-[44px] items-center sm:min-h-0"><span className="truncate">{tieuDe}</span></Link>
            : <span className="block truncate">{tieuDe}</span>}
        </div>
        {mucDau.length > 0 && <MenuDong nhan={`Thao tác khác · ${tieuDe}`} muc={mucDau} />}
        <button type="button" className="btn btn-sm btn-ghost min-h-[44px] min-w-[44px] justify-center sm:min-h-[28px] sm:min-w-[28px]" onClick={onClose} aria-label="Đóng">✕</button>
      </div>
      <div className="max-h-[70vh] space-y-2 overflow-y-auto px-3 py-2.5">
        {nhomChung.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tuần chung</span>
            <div className="min-w-[220px] flex-1">
              <TuanNho d={{ periodId: chung?.periodId ?? null, weekStart: chung?.weekStart ?? null }} goc={homNay} onTuan={datChung} nhanKhoa={nhanChung} />
            </div>
          </div>
        )}
        <div>
          {ky.map((k) => (
            <DongKyNangHop key={k} k={k} o={kn[k]} khoa={laKhoa(k)} moi={moi} loai={loai} d={rows[k]} ct={ct} homNay={ngayNghiepVu} lichSu={lichSu}
              muc={menuCua(k)} riengTuan={!!rieng[k]} tickDuoc={moi || !(kn[k]?.batBuoc ?? false) || thaoTacKyNang(ttCua(k), quyen).menu.includes('bo-ky-nang')}
              noiBat={k === kyNangDau} khaiGiang={khaiGiang} tongTuan={tongTuan}
              onTick={(v) => datTick(k, v)} onTuan={(t) => datTuanDong(k, t)} onMuc={(muc, thay) => chonMuc(k, muc, thay)} goc={homNay} />
          ))}
        </div>
        {!moi && coDoi && (
          <Truong nhan="Lý do" tuyChon>
            <input className="field w-full" maxLength={300} value={lyDo} onChange={(e) => setLyDo(e.target.value)} placeholder="Ví dụ: trùng lịch phòng thi" />
          </Truong>
        )}
        {coDongDuoi && (
          <div className="space-y-1.5" role="status">
            {cauChan && <div className="text-xs leading-relaxed text-bad">{cauChan}</div>}
            {cauCanhBao && <div className="text-xs leading-relaxed text-soon">{cauCanhBao}</div>}
            {quaTuan && (
              <div className="flex flex-wrap gap-1.5">
                <Nhan tone="soon" title={CAU_TUAN_DA_QUA}>Tuần đã qua</Nhan>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t px-3 py-2" style={{ borderColor: 'var(--line)' }}>
        <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={daSua ? huyDoi : onClose} disabled={busy}>{daSua ? 'Huỷ thay đổi' : 'Đóng'}</button>
        <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => { if (canhBao.length) setForce(true); void luu(); }} disabled={!luuDuoc}>
          {busy ? 'Đang lưu…' : nutLuu}
        </button>
      </div>
      {thaoTac && attemptId !== null && (
        <HopThaoTacMt key={`${thaoTac.t}:${thaoTac.k}`} thaoTac={thaoTac.t} attemptId={attemptId} skill={thaoTac.k} ct={ct} laThuong={loai === 'thuong'}
          quanLy row={{ periodId: kn[thaoTac.k]?.periodId ?? null, weekStart: kn[thaoTac.k]?.tuan ?? null }}
          oCoDiem={thaoTac.k === 'writing' && loai === 'ft' ? ['writing1', 'writing2'] : [thaoTac.k]}
          trongHop hocVien={tieuDe}
          onClose={() => setThaoTac(null)} onDone={() => { onSaved(); onClose(); }} />
      )}
      {nhatKy && attemptId !== null && (
        <NganLichSuBai attemptId={attemptId} skill={nhatKy === 'ca-luot' ? null : nhatKy} ct={ct} tenHv={tieuDe} trongHop onClose={() => setNhatKy(null)} />
      )}
      {huyMt && attemptId !== null && dot.loai === 'ft' && (
        <HopHuyMt open attemptId={attemptId} attemptNo={dot.attemptNo} phu={tieuDe} trongHop onClose={() => setHuyMt(false)} onDone={() => { onSaved(); onClose(); }} />
      )}
    </div>,
    document.body,
  );
}

function DongKyNangHop({ k, o, khoa, moi, loai, d, noiBat, khaiGiang, tongTuan, onTick, onTuan, onMuc, goc, homNay, ct = null, muc, riengTuan, tickDuoc, lichSu }: {
  /** MT lịch sử: chip "chờ chấm" tím như mọi "chờ" (C2); tooltip không hạn. */
  lichSu: boolean;
  ct?: string | null; muc: ReturnType<typeof menuHopKyNang>; onMuc: (m: MucHop, thay?: 'xep-lai' | 'khoi-phuc') => void;
  /** Đã bấm "Đổi tuần" riêng → bộ chọn tuần ngay trên dòng. */
  riengTuan: boolean;
  /** Ô tích đổi được: đợt mới, kỹ năng chưa thuộc đợt (đưa lại) hoặc bảng thao tác cho "Bỏ kỹ năng khỏi đợt" (chưa tới tuần thi, chưa điểm). */
  tickDuoc: boolean;
  k: KyNangKH; o?: OKyNang; khoa: boolean; moi: boolean; loai: 'ft' | 'thuong'; d: Dong; noiBat: boolean; homNay: string | null;
  khaiGiang?: string | null; tongTuan?: number | null; onTick: (v: boolean) => void; onTuan: (t: Tuan) => void; goc: string | null;
}) {
  /* Lớp thường luôn đủ bộ môn — không có ô tích (Q3). OV-10a: bỏ / đưa lại kỹ năng cần `attempt.skip_skill` (Admin không có → không ô tích, máy chủ 403). */
  const { can } = useSession();
  const coTick = loai === 'ft' && can(PERMISSIONS.ATTEMPT_SKIP_SKILL);
  const bo = !d.tick;
  const nhanTuan = loai === 'thuong' && d.weekStart ? nhanTuanKhoa(d.weekStart, khaiGiang ?? null, tongTuan ?? null) : null;
  const coDiem = !moi && o?.khoa === 'đã có điểm';
  /* Tuần đã đổi (chưa lưu) thì trạng thái cũ (vắng, trễ chấm …) không còn đúng — chỉ hiện chip tuần mới. */
  const daDoiTuan = !moi && d.periodId !== (o?.periodId ?? null);
  const chip = !moi && o && !daDoiTuan && homNay ? chipDongKyNang(o, homNay, ct, lichSu) : null;
  const chuTuan = (iso: string) => tuanLich(iso, homNay);
  const grid = coTick ? 'grid-cols-[24px_104px_minmax(0,1fr)_auto]' : 'grid-cols-[0px_104px_minmax(0,1fr)_auto]';
  return (
    <div className={`grid ${grid} items-center gap-x-2 gap-y-1 border-t py-1.5 first:border-t-0 max-sm:min-h-[48px] ${noiBat ? 'rounded bg-white/5' : ''}`} style={{ borderColor: 'var(--line)' }}>
      {coTick ? (
        /* Điện thoại: nhãn bọc ô tích mở vùng bấm 44px (ô tích gốc chỉ 13px). */
        <label className="relative grid place-items-center max-sm:min-h-[44px] max-sm:after:absolute max-sm:after:-inset-x-2.5 max-sm:after:inset-y-0 max-sm:after:content-['']">
          <input type="checkbox" className="accent-sky-400 disabled:opacity-60" checked={d.tick} disabled={!tickDuoc} onChange={(e) => onTick(e.target.checked)}
            aria-label={`${tenMon(ct, k)} — ${d.tick ? 'bỏ khỏi đợt' : 'đưa lại vào đợt'}`}
            title={!tickDuoc ? (o?.khoa ?? 'Đã tới tuần thi') : d.tick ? 'Bỏ kỹ năng khỏi đợt' : 'Đưa lại vào đợt'} />
        </label>
      ) : <span />}
      <div className="text-xs text-slate-200">
        <b title={tenMon(ct, k)}>{tenMonNgan(ct, k)}</b>
        {tenMonNgan(ct, k) !== tenMon(ct, k) && <> <span className="text-slate-400">{tenMon(ct, k)}</span></>}
        {loai === 'ft' && k === 'writing' && <span className="ml-1 cursor-help text-slate-500" title="W = chấm cả W1 và W2">ⓘ</span>}
      </div>
      <div className="min-w-0 text-xs">
        {bo ? (
          <span className="text-slate-500">Bỏ kỹ năng khỏi đợt</span>
        ) : riengTuan ? (
          /* Rà #212 (T4/T20): hộp chỉ mở cho Quản lý / Quản trị (PLAN_WEEK) — chọn được cả tuần đã qua, máy chủ đã cho. */
          <TuanNho d={d} goc={goc} onTuan={onTuan} nhanKhoa={nhanTuan} />
        ) : coDiem && (d.weekStart ?? o?.tuan) ? (
          <span className="text-slate-400">{chuTuan((d.weekStart ?? o!.tuan)!)} · <b className="tabular-nums text-slate-100">{o.diem ?? 'có điểm'}</b></span>
        ) : (
          <span className="flex flex-wrap items-center gap-1">
            {d.weekStart && <Nhan tone="doing">{chuTuan(d.weekStart)}</Nhan>}
            {chip && !(chip.chu === 'chưa xếp' && d.weekStart) && <Nhan tone={chip.tone}>{chip.chu}</Nhan>}
            {!d.weekStart && !chip && <span className="text-slate-500">chưa xếp</span>}
          </span>
        )}
      </div>
      <MenuDong luonHien nhan={`Thao tác khác · ${tenMon(ct, k)}`} muc={muc.map((m) => ({
        key: m.muc, nhan: CHU_MUC_HOP[m.muc], nguyHiem: m.muc === 'huy-diem', tat: !m.duoc, title: m.viSao ?? undefined, onChon: () => onMuc(m.muc, m.thay),
      }))} />
    </div>
  );
}
