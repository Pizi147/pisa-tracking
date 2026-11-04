import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, invalidate } from '../../../lib/api.ts';
import { useKhoaCuoiTuan, useNgayNghiepVu } from '../../../ui/ngayNghiepVu.ts';
import { addDaysStr } from '../../../lib/format.ts';
import { useToast } from '../../../ui/Toast.tsx';
import { useSession } from '../../../lib/session.tsx';
import {
  CAU_TUAN_DA_QUA, CHU_MUC_HOP, NUT_HOP, PERMISSIONS, chipDongKyNang, duongDotTest, kiemTuanXep, lyDoKhongXoa, menuHopKyNang, mondayOfDate,
  nhanTuanKhoa, tenMon, tenMonNgan, theoTuanChung, trangThaiTT, tuanDaSo, tuanMacDinhDotMoi, tuanNamChu,
  type BaiXemTruoc, type DongHangLoat, type KyNangKH, type MucHop, type OKyNang, type ThaoTac, type TrangThaiTT,
} from '@shared/domain/index.ts';
import { KY, khoaBaiThuong, khoaDot, nhanDot, thanDot, type DotChon, type GhiChuLich, type KnO } from './kieu.ts';
import { GHI_CHU_TOI_DA, chuTacGia, luuGhiChu } from './GhiChuLichThi.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { useBamNgoai } from '../../../ui/useBamNgoai.ts';
import { Nhan } from '../../../ui/Nhan.tsx';
import { Truong } from '../../../ui/KhungPanel.tsx';
import { HopBoChu } from '../../../ui/Drawer.tsx';
import { TuanNho, resolveTuan, type Tuan } from './TuanNho.tsx';
import { MenuDong } from '../../../ui/MenuDong.tsx';
import { useGiuFocus } from '../../../ui/giuFocus.ts';
import { HopThaoTacMt } from '../../fasttrack/HopThaoTacMt.tsx';
import { NganLichSuBai } from '../../cham/NganLichSuBai.tsx';

type Dong = { tick: boolean; periodId: number | null; weekStart: string | null };

/**
 * HỘP MỘT ĐỢT (mockup test-MT 05/10 phần 2; trước là "hộp kỹ năng" mockup 14 (1), Q19) — hộp nhỏ NEO CẠNH chip vừa bấm (portal,
 * `position: fixed`, kẹp trong màn); 375px thì là tấm dưới đáy rộng hết màn. Dùng ở Kế hoạch Test và hồ sơ HV › Lộ trình.
 *   · đầu `{tên em} · MT{n}` + ✕ · hàng "Tuần chung" (đổi một lần cho mọi dòng còn hiệu lực — kể cả có điểm / đã thi, điểm giữ (luật 1, PR-HOP1) — trừ dòng đã "Đổi tuần" riêng, đã huỷ, vắng, chờ duyệt) ·
 *     mỗi môn một dòng `L · tuần / trạng thái · [Dời] [Vắng] [Bỏ khỏi đợt] · ⋯` (N38, U05 chủ SP 05/11 "nút riêng cho từng môn"):
 *       - có điểm → `W3 SEP · 6.5`; chưa điểm → chip tuần + chip trạng thái (`trễ chấm` · `chờ chấm` · `vắng` · `huỷ · vắng 2 lần`, luật `oMt`);
 *       - ba nút + ⋯ (Dời hạn chấm · Huỷ điểm · Nhật ký) theo `menuHopKyNang` (một nguồn `thaoTacKyNang`); nút chưa làm được mờ, tooltip nói vì sao;
 *       - Dời = bộ chọn tuần ngay trên dòng = XẾP LẠI TỪ ĐẦU (L5) ở MỌI trạng thái — vắng, huỷ vắng 2 lần, Không dự thi, bỏ khỏi đợt (đưa lại);
 *         chọn đúng tuần đang có cũng lưu được (gửi `xepLai`). Vắng = "-" (hộp nhỏ). Bỏ khỏi đợt bật / tắt, lưu cùng nút Lưu; lớp thường không có.
 *   · mỗi lần đổi tuần gọi `/ke-hoach-test/dot/kiem` (đợt đã có) hoặc xem trước hàng loạt một em (đợt chưa có) → CHỈ dòng đỏ
 *     `Chặn: …` (Lưu tắt; PR-MTGON: dời vượt lượt sau cũng chặn ở đây) và dòng vàng (cảnh báo → nút đổi thành `Vẫn xếp vào tuần này`;
 *     chip "Tuần đã qua"). Hộp chỉ dành cho Quản lý / Quản trị: chọn được tuần đã qua ở mọi lượt (T4, T20 — rà #212).
 * PR-HOP1: một việc dời lịch một MT chỉ có hộp này và một đường lưu `/ke-hoach-test/dot` (Hồ sơ MT cũng mở nó). FT đợt đã có: ⋯ đầu
 *   hộp `Nhật ký · Mở hồ sơ MT`. `doiTuanDau`: dòng `kyNangDau` mở sẵn bộ chọn tuần (⋯ "Dời lịch thi" một kỹ năng).
 * OV-15c (mục 6, mockup 6 khung 8): chân hộp `Đóng · Xóa … Lưu` — Xóa = bỏ tuần (`/attempts/:id/bo-tuan`, đợt về Chưa xếp, lịch sử giữ),
 *   hỏi một lần NGAY TRONG hộp, xong có Hoàn tác; đã có điểm / đã thi → mờ + lý do. Không còn "Huỷ MT{n}". N38: bỏ `Khôi phục → Chưa xếp` ·
 *   `Giữ huỷ` (Dời thay). Ô "Ghi chú lịch thi" (C21) lưu cùng nút Lưu. Tuần luôn kèm năm (C20).
 * Bộ chọn tuần KHỞI TẠO bằng TUẦN HIỆN CÓ (Bổ sung sau rà #87): không để bộ chọn tự phát "tuần này" làm nút Lưu mở ngay.
 */
export function HopKyNang({ anchor, tieuDe, tenHv = tieuDe.split(' · ')[0], maLop = null, ghiChu, loai, classId, studentId, dot, attemptId, kn, kyNangDau, deXuat, khaiGiang, tongTuan, onClose, onSaved, onHienDien, ky = KY, ct = null, lichSu = false, doiTuanDau = false }: {
  /** U05 (mockup khu C): mã lớp ở góc phải đầu hộp. */
  maLop?: string | null;
  anchor: HTMLElement; tieuDe: string; loai: 'ft' | 'thuong'; classId: number; studentId: number; dot: DotChon;
  /** OV-15c: tên em cho câu hỏi Xóa ("Xóa lịch MT4 của Đỗ Trọng Tiến?") và ghi chú lịch thi hiện tại của em × đợt (C21). */
  tenHv?: string;
  /** Không truyền (hồ sơ MT, Lộ trình) = không có ô ghi chú — ô trống không được đè ghi chú đang có mà nơi đó không tải. */
  ghiChu?: GhiChuLich | null;
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
  const khoaCt = useKhoaCuoiTuan();
  const homNay = nghiepVu ? mondayOfDate(nghiepVu) : null;
  const ngayNghiepVu = nghiepVu || null;
  const [thaoTac, setThaoTac] = useState<{ t: ThaoTac; k: KyNangKH } | null>(null);
  /** `ca-luot` = nhật ký cả lượt (⋯ đầu hộp). */
  const [nhatKy, setNhatKy] = useState<KyNangKH | 'ca-luot' | null>(null);
  const { can } = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();

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
  /** Dòng đổi tuần thường (không đã huỷ / vắng / chờ duyệt / bỏ khỏi đợt) — theo "Tuần chung", kể cả có điểm (điểm giữ, luật 1). */
  const theoChungDau = (k: KyNangKH) => theoTuanChung(ttCua(k), quyen, moi);
  /** N38 L5: dòng có gì để xếp lại (vắng, huỷ, chờ thẻ cũ, đã dời do vắng, Không dự thi) — Dời chọn đúng tuần cũ vẫn là một lần lưu. */
  const coXepLai = (k: KyNangKH) => loai === 'ft' && !moi && !!kn[k] && (kn[k]!.sit === 'absent' || kn[k]!.sit === 'cancelled' || kn[k]!.choDuyet || !!kn[k]!.doiTu || !!kn[k]!.khongDuThi);

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
  /* C21: ghi chú lịch thi — sửa trong hộp, lưu cùng nút Lưu (chỉ ghi chú, không dời lịch). */
  const [ghi, setGhi] = useState(ghiChu?.noiDung ?? '');
  const doiGhi = ghiChu !== undefined && ghi.trim() !== (ghiChu?.noiDung ?? '');
  const [lichSuGhi, setLichSuGhi] = useState<GhiChuLich[] | null>(null);
  /* Xóa (mục 6): `hoi` = đang hỏi lại trong hộp; `loiXoa` = câu lỗi (lịch giữ nguyên, bấm lại được). */
  const [hoi, setHoi] = useState(false);
  const [loiXoa, setLoiXoa] = useState<string | null>(null);
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
    const o = kn[k];
    if (moi) return true;
    const batBuoc = o?.batBuoc ?? false;
    if (batBuoc !== rows[k].tick) return true;
    if (!rows[k].tick || rows[k].periodId === null) return false;
    return rows[k].periodId !== (o?.periodId ?? null) || (!!rieng[k] && coXepLai(k));
  };
  const coDoi = ky.some(daDoi);
  const daSua = moi ? daChinh : coDoi;   // OV-15c: ghi chú đổi tính riêng ở nút (`doiGhi`) — khai báo sau
  const bo = ky.filter((k) => !moi && (kn[k]?.batBuoc ?? false) && !rows[k].tick);
  const coTuan = ky.filter((k) => rows[k].tick && rows[k].periodId);
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
  /* P6 N15: FT T6 → CN — tuần đợt thuộc 3 tuần khoá → chip; bỏ kỹ năng khỏi đợt (huỷ lịch) chặn ngay (dời: máy chủ báo qua xem trước). */
  const khoaDotNay = loai === 'ft' && !moi ? khoaCt(...ky.map((k) => kn[k]?.tuan)) : null;
  const khoaBo = loai === 'ft' ? khoaCt(...bo.map((k) => kn[k]?.tuan)) : null;
  const cauChan = chan.length ? t('Chặn: {cau}', { cau: [...new Set(chan.map((b) => (b.cau ? dich(b.cau) : '')))].join(' ') }) : khoaBo ? t('Chặn: {cau}', { cau: khoaBo }) : '';
  const cauCanhBao = canhBao.length ? [...new Set(canhBao.map((b) => (b.cau ? dich(b.cau) : '')))].join(' ') : '';

  const luuLich = !chan.length && !khoaBo && (moi ? !thieuTuan && dungKy.length > 0 && !!bai : coDoi);
  const luuDuoc = !busy && (luuLich || (doiGhi && !coDoi && !(moi && daChinh)));
  /* T4: Quản lý chọn tuần đã qua cho kỹ năng chưa thi → chip vàng (không chặn). Chỉ tính dòng vừa đổi — tuần cũ giữ nguyên không phải "chọn". */
  const quaTuan = !!nghiepVu && coTuan.some((k) => daDoi(k) && !!rows[k].weekStart && (moi || kn[k]?.khoa == null)
    && kiemTuanXep({ ketThuc: [addDaysStr(rows[k].weekStart.slice(0, 10), 6)], homNay: nghiepVu, quanLy: true }).quaTuan);

  const luu = async () => {
    if (!luuDuoc) return;
    setBusy(true);
    const dungForce = force || canhBao.length > 0;
    /* OV-15h2 (ý 5): ghi chú đi CÙNG lần lưu lịch (một giao dịch máy chủ) — lỗi ghi chú thì lịch cũng chưa lưu, bấm Lưu lại không gửi lịch hai lần. */
    const ghiChu = doiGhi ? { classId, studentId, dot: khoaDot(dot), noiDung: ghi } : undefined;
    try {
      if (!luuLich) {
        await luuGhiChu({ classId, studentId, dot: khoaDot(dot) }, ghi);   // chỉ đổi ghi chú: không gọi đường lịch
      } else if (moi) {
        const tuan: Record<string, number> = {};
        for (const k of dungKy) tuan[k] = rows[k].periodId!;
        if (dot.loai === 'ft') {
          await api.post('/ke-hoach-test/xep-moi', { studentId, attemptNo: dot.attemptNo, tuan, bo: ky.filter((k) => !rows[k].tick), lyDoBo: null, force: dungForce, ghiChu });
        } else await api.post('/ke-hoach-test/xep-moi', { classId, studentId, kind: dot.kind, tuan, force: dungForce, ghiChu });
      } else {
        const kyNang = ky.filter(daDoi).map((k) => (
          !rows[k].tick ? { skill: k, bo: true }
            : !(kn[k]?.batBuoc ?? false) ? { skill: k, bo: false, periodId: rows[k].periodId }
              /* N38 L5: Dời chọn đúng tuần đang có = xếp lại từ đầu (máy chủ không coi là "giữ nguyên"). */
              : { skill: k, periodId: rows[k].periodId, ...(rows[k].periodId === (kn[k]?.periodId ?? null) ? { xepLai: true } : {}) }
        ));
        await api.post('/ke-hoach-test/dot', { attemptId, kyNang, lyDoBo: null, reason: lyDo.trim() || null, force: dungForce, ghiChu });
      }
      toast.push('ok', luuLich ? t('Đã lưu lịch.') : t('Đã lưu ghi chú.'));
      invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham');
      onSaved(); onClose();
    } catch (e: any) {
      toast.push('error', e.message ?? t('Không lưu được — thử lại.'));
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
    /* Đưa lại vào đợt (Dời trên dòng đang bỏ — L6): chưa có tuần thì lấy "Tuần chung" (máy chủ cần tuần cho kỹ năng được đưa lại). */
    setRows((s) => ({ ...s, [k]: { tick: v, periodId: v && !s[k].periodId && chung ? chung.periodId : s[k].periodId, weekStart: v && !s[k].periodId && chung ? chung.weekStart : s[k].weekStart } }));
  };
  /* Dời (L5): mở bộ chọn tuần trên dòng (dòng đang bỏ → đưa lại); bấm lần nữa = thôi, dòng về như lúc mở hộp. */
  const doiDong = (k: KyNangKH) => {
    if (rieng[k]) {
      setRieng((s) => ({ ...s, [k]: false }));
      setRows((s) => ({ ...s, [k]: moi ? { tick: true, periodId: chung?.periodId ?? null, weekStart: chung?.weekStart ?? null } : khoiTao()[k] }));
      return;
    }
    setDaChinh(true);
    setRieng((s) => ({ ...s, [k]: true }));
    if (!rows[k].tick) datTick(k, true);
  };
  const huyDoi = () => {
    setRows(moi ? (macDinhMoi.current?.rows ?? khoiTao()) : khoiTao());
    setChung(moi ? (macDinhMoi.current?.chung ?? null) : chungKhoiTao());
    setRieng({}); setDaChinh(false); setForce(false); setLyDo(''); setGhi(ghiChu?.noiDung ?? '');
  };

  /* Xóa (mục 6): bỏ tuần mọi kỹ năng chưa thi — máy chủ chặn có điểm / đã thi / đề nghị dời chờ duyệt. Hoàn tác = đặt lại đúng tuần cũ. */
  const lyDoXoa = attemptId === null ? null : lyDoKhongXoa(kn)
    ?? (loai === 'ft' ? khoaCt(...ky.map((k) => (kn[k]?.batBuoc && kn[k]?.sit === 'scheduled' ? kn[k]?.tuan : null))) : null);
  const xoa = async () => {
    if (attemptId === null || busy) return;
    setBusy(true); setLoiXoa(null);
    const cu = ky.filter((k) => kn[k]?.batBuoc && kn[k]?.periodId && kn[k]?.sit === 'scheduled').map((k) => ({ skill: k, periodId: kn[k]!.periodId }));
    try {
      await api.post(`/attempts/${attemptId}/bo-tuan`, { lyDo: t('Xóa lịch') });
      invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham'); invalidate('/cycles');
      toast.hoanTac(t('Đã xóa lịch {dot} · {ten}', { dot: nhanDot(dot), ten: tenHv }), () => {
        void api.post('/ke-hoach-test/dot', { attemptId, kyNang: cu, lyDoBo: null, reason: t('Hoàn tác xóa lịch'), force: true })
          .then(() => { invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham'); invalidate('/cycles'); onSaved(); })
          .catch((e: any) => toast.push('error', e.message ?? t('Chưa hoàn tác được — thử lại.')));
      });
      onSaved(); onClose();
    } catch (e: any) {
      setLoiXoa(t('Chưa xóa được — {loi} Lịch giữ nguyên.', { loi: e.message ?? '' }));
    } finally {
      setBusy(false);
    }
  };
  const moLichSuGhi = () => {
    if (lichSuGhi) { setLichSuGhi(null); return; }
    void api.get<{ dong: GhiChuLich[] }>(`/ke-hoach-test/ghi-chu/lich-su?classId=${classId}&studentId=${studentId}&dot=${khoaDot(dot)}`)
      .then((r) => setLichSuGhi(r.dong)).catch(() => setLichSuGhi([]));
  };
  const chonMuc = (k: KyNangKH, muc: MucHop) => {
    if (muc === 'doi-tuan') doiDong(k);
    else if (muc === 'bo-ky-nang') datTick(k, !rows[k].tick);   // lưu cùng nút Lưu, bấm lại = thôi
    else if (muc === 'nhat-ky') setNhatKy(k);
    else setThaoTac({ t: muc, k });
  };

  /* Vị trí: neo dưới chip, kẹp trong màn; hết chỗ thì lật lên. < 640px → tấm dưới đáy. */
  const box = useRef<HTMLDivElement>(null);
  /* Bàn phím: hộp nằm cuối `body` (portal) nên Tab từ ô MT không tới được — mở là đưa focus vào hộp, Tab vòng trong hộp, đóng thì trả focus về ô đã mở nó. */
  useGiuFocus(box);
  const dienThoai = typeof window !== 'undefined' && window.innerWidth < 640;
  /* Hotfix 19/10 (như `KhungHop` hộp điểm): vị trí ghi thẳng vào style, không setState trong layout effect mỗi lần vẽ (vòng lặp vô hạn). */
  const dat = () => {
    if (dienThoai || !box.current) return;
    const r = anchor.getBoundingClientRect();
    const rong = Math.min(520, window.innerWidth - 32);
    const cao = box.current?.offsetHeight ?? 360;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - rong - 8);
    const duoi = r.bottom + 4;
    const top = duoi + cao > window.innerHeight - 8 ? Math.max(8, r.top - cao - 4) : duoi;
    box.current.style.top = `${top}px`;
    box.current.style.left = `${left}px`;
  };
  useLayoutEffect(() => { dat(); });   // eslint-disable-line react-hooks/exhaustive-deps
  const neo = useRef<Element>(anchor);
  neo.current = anchor;
  /* Hộp / menu nổi khác (kể cả không phải con React của hộp) vẫn không tính là ngoài — giữ luật cũ. */
  /* 6c (bảng kê lỗi 5): bấm ngoài / Esc / ✕ khi còn thay đổi chưa lưu → hỏi MỘT lần (cùng hộp `HopBoChu` của panel), không mất âm thầm. */
  const [hoiDong, setHoiDong] = useState(false);
  const dongHop = useRef(onClose);
  dongHop.current = () => { if (daSua || doiGhi) setHoiDong(true); else onClose(); };
  useBamNgoai(true, (e) => { if (!(e.target as HTMLElement).closest('[role="dialog"], [role="menu"]')) dongHop.current(); }, box, neo);
  useEffect(() => {
    /* Esc chỉ đóng lớp TRÊN CÙNG: có hộp / panel modal mở SAU hộp này (trong hộp, hoặc vẽ ra `body` sau nó) thì để lớp đó tự đóng. Panel mở
       TRƯỚC hộp (Lộ trình hồ sơ HV) không chặn — trước đây chặn nên Esc không đóng được hộp ở đó. */
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || !box.current) return;
      const phiaTren = [...document.querySelectorAll('[aria-modal="true"]')].some((m) => box.current!.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING);
      if (!phiaTren) dongHop.current();
    };
    document.addEventListener('keydown', esc);
    window.addEventListener('resize', dat);
    return () => { document.removeEventListener('keydown', esc); window.removeEventListener('resize', dat); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  /* ⋯ đầu hộp (PR-HOP1): chữ y như nơi khác — "Nhật ký" (⋯ dòng), "Mở hồ sơ MT" (Lộ trình). OV-15c: bỏ "Huỷ MT{n}".
     SUA-NHO-UI U3 (critique 30/10): "Xóa lịch" ít dùng, rời chân hộp (tránh bấm nhầm cạnh Lưu) vào ⋯ — FT + lớp thường; mục mờ, lý do ở `title`. */
  const hoSo = attemptId !== null && dot.loai === 'ft' ? duongDotTest({ id: attemptId, kind: 'mock', classId }, null) : null;
  /* U05 (mockup khu C): "Lịch sử" · "Mở hồ sơ MT ›" là link ở chân hộp (luôn thấy); ⋯ chỉ còn "Xóa lịch" (ít dùng, xa nút Lưu — U3 30/10). */
  const moHoSo = hoSo && hoSo !== pathname ? hoSo : null;
  const mucDau = attemptId === null ? [] : [
    { key: 'xoa', nhan: t('Xóa lịch'), nguyHiem: true, tat: !!(lyDoXoa || daSua || doiGhi || busy),
      title: lyDoXoa ?? (daSua || doiGhi ? t('Lưu hoặc huỷ thay đổi trước') : undefined), onChon: () => setHoi(true) },
  ];
  const nutLuu = canhBao.length && !force ? t('Vẫn xếp vào tuần này') : t('Lưu');
  const nhanChung = loai === 'thuong' && chung?.weekStart ? nhanTuanKhoa(chung.weekStart, khaiGiang ?? null, tongTuan ?? null) : null;
  const coDongDuoi = !!cauChan || !!cauCanhBao || quaTuan || !!khoaDotNay;
  return createPortal(
    <div ref={box} role="dialog" aria-label={t('Lịch {ten}', { ten: tieuDe })} tabIndex={-1}
      className={`surface-2 z-[60] border shadow-2xl outline-none ${dienThoai ? 'fixed inset-x-0 bottom-0 rounded-t-xl' : 'fixed w-[min(520px,calc(100vw-32px))] rounded-lg'}`}
      style={{ borderColor: 'var(--line-strong)' }}>
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2" style={{ borderColor: 'var(--line)' }}>
        {/* Đợt đã có → tên là liên kết tới hồ sơ đợt (`duongDotTest`, một đường dẫn ở mọi màn); bấm thì đóng hộp. Đợt mới: chữ. */}
        <div className="min-w-0 flex-1 text-[17px] font-bold text-slate-100" title={tieuDe}>
          {attemptId !== null
            ? <Link to={duongDotTest({ id: attemptId, kind: dot.loai === 'thuong' ? khoaBaiThuong(dot.kind) : 'mock', classId }, null)} onClick={onClose}
                className="ten-ho-so flex min-h-[44px] items-center sm:min-h-0"><span className="truncate">{tieuDe}</span></Link>
            : <span className="block truncate">{tieuDe}</span>}
        </div>
        {maLop && <span className="shrink-0 text-[13px] text-dim">{maLop}</span>}
        {mucDau.length > 0 && <MenuDong nhan={t('Thao tác khác · {skillLabel}', { skillLabel: tieuDe })} muc={mucDau} />}
        <button type="button" className="btn btn-sm btn-ghost min-h-[44px] min-w-[44px] justify-center sm:min-h-[28px] sm:min-w-[28px]" onClick={() => dongHop.current()} aria-label={t('Đóng')}>✕</button>
      </div>
      <div className="max-h-[70vh] space-y-2 overflow-y-auto px-3 py-2.5">
        {/* U05 (mockup khu C, nghiệm thu): thao tác CẢ LƯỢT tách khỏi thao tác TỪNG MÔN — không nhầm dời / huỷ cả lượt với một môn. */}
        {nhomChung.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[13px] font-semibold text-dim">{t('Cả lượt {dot}', { dot: nhanDot(dot) })} · {t('Tuần chung')}</span>
            <div className="min-w-[220px] flex-1">
              <TuanNho nam d={{ periodId: chung?.periodId ?? null, weekStart: chung?.weekStart ?? null }} goc={homNay} onTuan={datChung} nhanKhoa={nhanChung} />
            </div>
          </div>
        )}
        <div className={nhomChung.length > 0 ? 'border-t pt-2' : ''} style={{ borderColor: 'var(--line)' }}>
          <span className="text-[13px] font-semibold text-dim">{t('Từng môn')}</span>
          {ky.map((k) => (
            <DongKyNangHop key={k} k={k} o={kn[k]} moi={moi} loai={loai} d={rows[k]} ct={ct} homNay={ngayNghiepVu} lichSu={lichSu}
              muc={menuCua(k)} riengTuan={!!rieng[k]} noiBat={k === kyNangDau} khaiGiang={khaiGiang} tongTuan={tongTuan} coSua={daSua || doiGhi}
              onTuan={(t) => datTuanDong(k, t)} onMuc={(muc) => chonMuc(k, muc)} goc={homNay} busy={busy} />
          ))}
        </div>
        {!moi && coDoi && (
          <Truong nhan={t('Lý do')} tuyChon>
            <input className="field w-full" maxLength={300} value={lyDo} onChange={(e) => setLyDo(e.target.value)} placeholder={t('Ví dụ: trùng lịch phòng')} />
          </Truong>
        )}
        {/* C21 (mockup 4): ghi chú lịch thi — chỉ là ghi chú, không dời lịch; lưu cùng nút Lưu. */}
        {ghiChu !== undefined && <div className="border-t pt-2" style={{ borderColor: 'var(--line)' }}>
          <label className="block">
            <span className="text-[12px] font-bold text-slate-400">{t('Ghi chú lịch Test')}</span>
            <input className="field mt-1 w-full" maxLength={GHI_CHU_TOI_DA} value={ghi} onChange={(e) => setGhi(e.target.value)} placeholder={t('Thêm ghi chú…')} />
          </label>
          {ghiChu && (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] text-slate-500">
              <span>{chuTacGia(ghiChu)}</span>
              <button type="button" className="link min-h-[44px] sm:min-h-0" aria-expanded={!!lichSuGhi} onClick={moLichSuGhi}>{t('Lịch sử')}</button>
            </div>
          )}
          {lichSuGhi && (
            <ul className="m-0 mt-1 list-none space-y-1 p-0 text-[12px]" aria-label={t('Lịch sử ghi chú')}>
              {lichSuGhi.map((g, i) => (
                <li key={i}><span className="text-slate-300">{g.noiDung || t('(đã xoá)')}</span> <span className="text-slate-500">· {chuTacGia(g)}</span></li>
              ))}
            </ul>
          )}
        </div>}
        {coDongDuoi && (
          <div className="space-y-1.5" role="status">
            {cauChan && <div className="text-xs leading-relaxed text-bad">{cauChan}</div>}
            {cauCanhBao && <div className="text-xs leading-relaxed text-soon">{cauCanhBao}</div>}
            {(quaTuan || khoaDotNay) && (
              <div className="flex flex-wrap gap-1.5">
                {quaTuan && <Nhan tone="soon" title={CAU_TUAN_DA_QUA}>{t('Tuần đã qua')}</Nhan>}
                {khoaDotNay && <Nhan tone="soon" title={khoaDotNay}>{t('Khoá đổi lịch T6 – CN')}</Nhan>}
              </div>
            )}
          </div>
        )}
      </div>
      {hoi && attemptId !== null ? (
        /* Mục 6: hỏi lại MỘT lần ngay trong hộp (không panel chồng panel) — nêu đúng em + đợt. */
        <div className="space-y-2 border-t px-3 py-2.5" style={{ borderColor: 'var(--line)' }} role="alertdialog" aria-label={t('Xóa lịch')}>
          <p className="m-0 text-sm font-bold text-slate-100">{t('Xóa lịch {dot} của {ten}?', { dot: nhanDot(dot), ten: tenHv })}</p>
          <p className="m-0 text-xs text-slate-400">{t('Đợt về Chưa xếp, lịch sử vẫn xem được.')}</p>
          {loiXoa && <p className="m-0 text-xs text-bad" role="alert">⚠ {loiXoa}</p>}
          <div className="flex items-center justify-end gap-2">
            {/* Menu ⋯ vừa đóng — đưa focus vào câu hỏi (nút an toàn), không rơi về body. */}
            <button type="button" autoFocus className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => { setHoi(false); setLoiXoa(null); }}>{t('Đóng')}</button>
            <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void xoa()}>{busy ? t('Đang xóa…') : t('Xóa')}</button>
          </div>
        </div>
      ) : (
        <div className="border-t px-3 py-2" style={{ borderColor: 'var(--line)' }}>
          {attemptId !== null && (dot.loai === 'ft' || moHoSo) && (
            <div className="mb-2 flex items-center justify-between gap-2 text-[13px]">
              {dot.loai === 'ft' ? <button type="button" className="link appearance-none border-0 bg-transparent p-0 font-semibold max-sm:min-h-[44px]" onClick={() => setNhatKy('ca-luot')}>{CHU_MUC_HOP['nhat-ky']}</button> : <span />}
              {moHoSo && <button type="button" className="link appearance-none border-0 bg-transparent p-0 font-semibold max-sm:min-h-[44px]" onClick={() => { onClose(); navigate(moHoSo); }}>{t('Mở hồ sơ MT')} ›</button>}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={daSua || doiGhi ? huyDoi : onClose} disabled={busy}>{daSua || doiGhi ? t('Huỷ thay đổi') : t('Đóng')}</button>
            <span className="flex-1" />
            <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => { if (canhBao.length) setForce(true); void luu(); }} disabled={!luuDuoc}>
              {busy ? t('Đang lưu…') : nutLuu}
            </button>
          </div>
        </div>
      )}
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
      {hoiDong && <HopBoChu viec={tieuDe} nut={t('Bỏ chữ, đóng')} onO={() => setHoiDong(false)} onBo={onClose} />}
    </div>,
    document.body,
  );
}

function DongKyNangHop({ k, o, moi, loai, d, noiBat, khaiGiang, tongTuan, onTuan, onMuc, goc, homNay, ct = null, muc: muc0, riengTuan, lichSu, busy, coSua }: {
  /** Hộp còn thay đổi chưa lưu: Vắng / Dời hạn chấm / Huỷ điểm lưu NGAY rồi đóng hộp — chặn để không mất phần đang sửa (như Xóa lịch). */
  coSua: boolean;
  /** MT lịch sử: chip "chờ chấm" tím như mọi "chờ" (C2); tooltip không hạn. */
  lichSu: boolean;
  ct?: string | null; muc: ReturnType<typeof menuHopKyNang>; onMuc: (m: MucHop) => void;
  /** Đã bấm Dời → bộ chọn tuần ngay trên dòng. */
  riengTuan: boolean;
  k: KyNangKH; o?: OKyNang; moi: boolean; loai: 'ft' | 'thuong'; d: Dong; noiBat: boolean; homNay: string | null; busy: boolean;
  khaiGiang?: string | null; tongTuan?: number | null; onTuan: (t: Tuan) => void; goc: string | null;
}) {
  /* Lớp thường luôn đủ bộ môn — không có "Bỏ khỏi đợt" (Q3). OV-10a: Admin không có `attempt.skip_skill` → nút mờ "Chỉ Quản lý" (máy chủ 403). */
  const bo = !d.tick;
  const nhanTuan = loai === 'thuong' && d.weekStart ? nhanTuanKhoa(d.weekStart, khaiGiang ?? null, tongTuan ?? null) : null;
  const coDiem = !moi && o?.khoa === 'đã có điểm';
  /* Tuần đã đổi (chưa lưu) thì trạng thái cũ (vắng, trễ chấm …) không còn đúng — chỉ hiện chip tuần mới. */
  const daDoiTuan = !moi && d.periodId !== (o?.periodId ?? null);
  const chip = !moi && o && !daDoiTuan && homNay ? chipDongKyNang(o, homNay, ct, lichSu) : null;
  const chuTuan = (iso: string) => tuanNamChu(iso);   // C20: hộp lịch luôn kèm năm
  const ten = tenMon(ct, k);
  const muc = muc0.map((m) => (coSua && m.duoc && (m.muc === 'bao-vang' || m.muc === 'doi-han' || m.muc === 'huy-diem')
    ? { ...m, duoc: false, viSao: t('Lưu hoặc huỷ thay đổi trước') } : m));
  /* N38 (U05): ba nút trên dòng; ⋯ giữ Dời hạn chấm · Huỷ điểm · Nhật ký. Nút mờ vẫn nhận focus + tooltip vì sao (aria-disabled). */
  const nut = muc.filter((m) => NUT_HOP.includes(m.muc) && (m.muc !== 'bo-ky-nang' || loai === 'ft'));
  const dangBat = (m: MucHop) => (m === 'doi-tuan' && riengTuan) || (m === 'bo-ky-nang' && bo);
  return (
    <div className={`grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 border-t py-1.5 first:border-t-0 max-sm:grid-cols-[44px_minmax(0,1fr)] ${noiBat ? 'rounded bg-white/5' : ''}`} style={{ borderColor: 'var(--line)' }}>
      <div className="break-words text-[14px] text-slate-100">
        <b title={ten}>{tenMonNgan(ct, k)}</b>
        {loai === 'ft' && k === 'writing' && <span className="ml-1 cursor-help text-slate-500" title={t('W = chấm cả W1 và W2')}>ⓘ</span>}
      </div>
      <div className="min-w-0 text-xs">
        {bo ? (
          <span className="text-slate-500">{t('Bỏ khỏi đợt')}</span>
        ) : riengTuan ? (
          /* Rà #212 (T4/T20): hộp chỉ mở cho Quản lý / Quản trị (PLAN_WEEK) — chọn được cả tuần đã qua, máy chủ đã cho. */
          <TuanNho nam d={d} goc={goc} onTuan={onTuan} nhanKhoa={nhanTuan} />
        ) : coDiem && (d.weekStart ?? o?.tuan) ? (
          <span className="text-slate-400">{chuTuan((d.weekStart ?? o!.tuan)!)} · <b className="tabular-nums text-slate-100">{o.diem ?? t('có điểm')}</b></span>
        ) : (
          <span className="flex flex-wrap items-center gap-1">
            {d.weekStart && <Nhan tone="doing">{chuTuan(d.weekStart)}</Nhan>}
            {chip && !(chip.chu === t('chưa xếp') && d.weekStart) && <Nhan tone={chip.tone}>{chip.chu}</Nhan>}
            {!d.weekStart && !chip && <span className="text-slate-500">{t('chưa xếp')}</span>}
          </span>
        )}
      </div>
      <div className="flex items-center justify-end gap-1.5 max-sm:col-span-2">
        {nut.map((m) => (
          <button key={m.muc} type="button" aria-disabled={!m.duoc || busy || undefined} aria-pressed={m.muc === 'bao-vang' ? undefined : dangBat(m.muc)}
            aria-label={`${CHU_MUC_HOP[m.muc]} · ${ten}`} title={m.viSao ?? undefined}
            className={`btn btn-sm min-h-[44px] sm:min-h-0 ${!m.duoc ? 'cursor-not-allowed opacity-50' : ''} ${dangBat(m.muc) ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}
            onClick={() => { if (m.duoc && !busy) onMuc(m.muc); }}>{CHU_MUC_HOP[m.muc]}</button>
        ))}
        <MenuDong luonHien nhan={t('Thao tác khác · {skillLabel}', { skillLabel: ten })} muc={muc.filter((m) => !NUT_HOP.includes(m.muc)).map((m) => ({
          key: m.muc, nhan: CHU_MUC_HOP[m.muc], nguyHiem: m.muc === 'huy-diem', tat: !m.duoc, title: m.viSao ?? undefined, onChon: () => onMuc(m.muc),
        }))} />
      </div>
    </div>
  );
}
