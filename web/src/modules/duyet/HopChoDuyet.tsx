import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LOP_DA_LUU } from '../../ui/KhuonViec.tsx';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { ChonLop } from '../../ui/ChonLop.tsx';
import { DongDiem } from '../../ui/SoLieu.tsx';
import { KhungPanel, KhungTaiCho, boChuRoi } from '../../ui/KhungPanel.tsx';
import { HopBoChu } from '../../ui/Drawer.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { NganCase } from '../students/NganCaseLuoi.tsx';
import { useSession } from '../../lib/session.tsx';
import { TheYeuCau } from './TheYeuCau.tsx';
import { DsDuyet, type LenhDong } from './DsDuyet.tsx';
import { LichSuYeuCau } from './LichSuYeuCau.tsx';
import {
  LOAI_YC_META, bacDu, PHAN_LOAI_CAN_QUYET, PHAN_LOAI_LABEL, TRAN_HANG_LOAT, chiaLo, chonHet, chonMot, laPhanLoai, tomTatKetQuaHangLoat, laDaXuLy, hanDuyetNgay, quyCheDuyet,
  type KhoaChip, type LoaiYeuCau, type TheYeuCauDto,
} from '@shared/domain/index.ts';

type Hop = { the: TheYeuCauDto[]; dem: Record<KhoaChip, number>; demBiet: number; homNay: string; lopDangLoc?: { id: number; code: string } | null; khacChiNhanh?: number };

/** `?the=12` → cuộn tới thẻ, viền nhấn 2 giây. Dùng chung hộp và Yêu cầu của tôi. */
/** PR-LUI-a2: Từ chối nhiều gửi theo lô (mỗi thẻ ~16 câu SQL) — một request ≤ 200 câu. */
const LO_TU_CHOI = 6;

export function useTheNhanManh(ds: TheYeuCauDto[] | undefined, theGoc?: number | null): number | null {
  const [params] = useSearchParams();
  const the = theGoc !== undefined ? theGoc : Number(params.get('the')) || null;
  const [nhan, setNhan] = useState<number | null>(null);
  useEffect(() => {
    if (!the || !ds?.some((x) => x.id === the)) return;
    document.getElementById(`the-${the}`)?.scrollIntoView({ block: 'center' });
    setNhan(the);
    const t = setTimeout(() => setNhan(null), 2000);
    return () => clearTimeout(t);
  }, [the, ds]);
  return nhan;
}

/**
 * CÔNG VIỆC › CHỜ BẠN DUYỆT (PR-DUYET, M8, Q27-3 → AUDIT-UI B6, chủ SP 08/11: MỘT nơi làm việc — trang "Chờ duyệt" riêng đã bỏ, hộp là tab của Công việc).
 * HÀNG LỌC (mockup `.hang-loc .chip-loc`): phân loại phải quyết (đứng cố định kể cả số 0, Q12) · Báo QL · Đã xử lý · 30 ngày · Lớp ▾ (+ chip "Quá hạn ✕" từ
 * Tổng quan). Mọi bộ lọc trên URL (`xem` · `phan` · `lop` · `qua-han`; `cn` = chi nhánh của Công việc) — link cũ `/cong-viec/cho-duyet?…` giữ nguyên nghĩa.
 * Dưới hàng lọc: danh sách khối em (V8-CV) · panel duyệt ở cột phải (`?the=`). Thẻ quá hạn đứng đầu (máy chủ xếp).
 * Duyệt hàng loạt (PR-GVb D01/Q-B): chỉ ở Chờ duyệt, cùng MỘT loại `hangLoat`, tối đa `TRAN_HANG_LOAT`; kết quả một câu.
 */
export function HopChoDuyet({ branchId, khuLoc, gon, dau }: {
  /** AUDIT-UI B6: ô hàng lọc hết bề ngang dưới hàng tab của Công việc (không có → vẽ ngay trên danh sách). */
  khuLoc?: HTMLElement | null;
  /** Không còn dùng (v24 H1: duyệt mở TẠI DÒNG, không panel phải) — giữ để chỗ gọi cũ không đổi. */
  khuPanel?: HTMLElement | null;
  /** SL1 (A7-01): chi nhánh của Công việc — số trên hàng lọc và thẻ cùng một phạm vi. `null` = mọi chi nhánh trong quyền. */
  branchId: number | null;
  /** PANEL TỔNG QUAN (chủ SP 25/11): CHÍNH danh sách này trong panel — chỉ thẻ đang chờ, không hàng lọc, không đọc / ghi bộ lọc trên địa chỉ trang; `dau` = thẻ mở sẵn. */
  gon?: boolean;
  dau?: number | null;
}) {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const thamXem = gon ? null : params.get('xem');
  const xem = thamXem === 'da-xu-ly' || thamXem === 'de-biet' ? thamXem : 'cho';
  /* Phân loại lọc ở Chờ duyệt và Đã xử lý; Báo QL chỉ có một phân loại. */
  const phan = !gon && xem !== 'de-biet' && laPhanLoai(params.get('phan')) && params.get('phan') !== 'bao-len' ? (params.get('phan') as KhoaChip) : 'tat-ca';
  /* PR-S4F #5: `?lop=` — từ badge "n chờ duyệt" của một lớp, hoặc ô "Lớp ▾". */
  const lopId = gon ? null : Number(params.get('lop')) || null;
  /* PR-VAI-a (Q17): `?qua-han=1` — từ số "k quá hạn" của dải Chờ duyệt ở Tổng quan. */
  const quaHan = !gon && params.get('qua-han') === '1' && xem !== 'da-xu-ly';
  /* C-2 (bảng kê 25/11): đổi bộ lọc làm `url` đổi → gập mọi dòng, bỏ chọn, xoá lý do Từ chối nhiều. Còn ô lý do đang mở thì HỎI trước ("Bỏ chữ đang gõ?"), không mất chữ âm thầm. */
  const [choDoi, setChoDoi] = useState<{ chay: () => void } | null>(null);
  const hoiTruocKhiDoi = (chay: () => void) => { if (dangO.size > 0 || !!lyDoTc?.trim()) setChoDoi({ chay }); else chay(); };
  const setParam = (k: string, v: string | null) => hoiTruocKhiDoi(() => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    next.delete('the');
    setParams(next, { replace: true });
  });
  /* Một chip đổi `xem` (+ `phan`): Báo QL không chia loại. */
  const chonLoc = (x: typeof xem, p: KhoaChip | null) => hoiTruocKhiDoi(() => {
    const next = new URLSearchParams(params);
    if (x === 'cho') next.delete('xem'); else next.set('xem', x);
    if (p && p !== 'tat-ca' && x !== 'de-biet') next.set('phan', p); else next.delete('phan');
    next.delete('the');
    setParams(next, { replace: true });
  });
  /* PR-GVb (J5b): link cũ `?phan=bao-len` (thông báo, Tổng quan cũ) → lọc Báo QL, không gãy. */
  useEffect(() => {
    if (params.get('phan') !== 'bao-len') return;
    const next = new URLSearchParams(params); next.delete('phan'); next.set('xem', 'de-biet');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const qs = new URLSearchParams({ hop: 'cho-duyet' });
  if (phan !== 'tat-ca') qs.set('phanLoai', phan);
  if (xem !== 'cho') qs.set('xem', xem);
  if (branchId) qs.set('branchId', String(branchId));
  if (lopId) qs.set('lop', String(lopId));
  if (quaHan) qs.set('quaHan', '1');
  /* DUYET-QL: dòng mở ra xin chip SOS + dòng điểm + số Lịch sử (PANEL-MC, +1 câu `latestAttempts`, Lịch sử đếm trong câu đọc thẻ). */
  qs.set('boiCanh', '1');
  const url = `/yeu-cau?${qs}`;
  const { data, loading, error, reload } = useApi<Hop>(url, [url]);
  /* Mở từ chuông (`?the=12`) mà thẻ không còn trong danh sách đang xem (đã có người xử lý / tự đóng / khác chi nhánh đang lọc). */
  const theTuLink = gon ? dau ?? null : Number(params.get('the')) || null;
  const theMo = theTuLink ? data?.the.find((x) => x.id === theTuLink) ?? null : null;

  /* Hàng loạt: một loại một lúc (luật ở `chonMot` / `chonHet`). */
  const [chon, setChon] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  /* PR-LUI-a2: Từ chối nhiều — hàng lý do chung mở ngay trong thanh chọn. `null` = đang đóng. */
  const [lyDoTc, setLyDoTc] = useState<string | null>(null);
  const [tcDaBam, setTcDaBam] = useState(false);
  /* Lỗi 7: thẻ lỗi của lần gửi lô gần nhất (id → lý do, hiện ngay dưới dòng) · `doiSoat` = chờ danh sách tải lại trước khi cho gửi tiếp. */
  const [loiThe, setLoiThe] = useState<ReadonlyMap<number, string>>(new Map());
  const [doiSoat, setDoiSoat] = useState(false);
  useEffect(() => { setChon(new Set()); setLoiThe(new Map()); }, [url]);
  useEffect(() => { if (!chon.size) { setLyDoTc(null); setTcDaBam(false); } }, [chon.size]);
  const ds = data?.the ?? [];
  /* C-6: sau khi danh sách tải lại (lô lỗi mạng giữa chừng, người khác vừa xử lý) chỉ giữ thẻ CÒN chờ — không để id ma trong thanh chọn. */
  useEffect(() => {
    if (!data) return;
    const cho = new Set(data.the.filter((x) => x.trangThai === 'cho').map((x) => x.id));
    setChon((s) => { const con = new Set([...s].filter((id) => cho.has(id))); return con.size === s.size ? s : con; });
    setDoiSoat(false);   // lỗi 7: đã đối soát với máy chủ — thẻ người khác vừa xử lý đã rời lựa chọn
  }, [data]);
  const [soHien, setSoHien] = useState(5);
  const loaiChon = useMemo(() => (ds.find((x) => chon.has(x.id))?.loai ?? null) as LoaiYeuCau | null, [ds, chon]);
  /* CV-LOI (A1-14): "Chọn hết" chỉ lấy thẻ ĐANG HIỆN — không duyệt thẻ chưa đọc sau "Xem thêm". */
  const dsChonHet = ds.slice(0, soHien);
  const nHet = loaiChon ? chonHet(dsChonHet, loaiChon).size : 0;
  const biCatTran = !!loaiChon && ds.filter((x) => x.loai === loaiChon && x.hangLoat && x.trangThai === 'cho').length > TRAN_HANG_LOAT;
  const choHangLoat = xem === 'cho';
  const [ngan, setNgan] = useState<number | null>(null);
  /* v24 H1: dòng nào đang mở tại chỗ · dòng nào có ô lý do / trả lời đang mở (khoá nút, không gập — không mất chữ đang gõ) · lệnh vừa bấm ở nút của dòng. */
  const [mo, setMo] = useState<ReadonlySet<number>>(new Set());
  const [dangO, setDangO] = useState<ReadonlySet<number>>(new Set());
  const [lenh, setLenh] = useState<LenhDong | null>(null);
  const soLenh = useRef(0);
  useEffect(() => { setMo(new Set()); setLenh(null); }, [url]);
  const [dangGui, setDangGui] = useState<number | null>(null);
  const { session } = useSession();
  const nhanId = useTheNhanManh(data?.the, gon ? dau ?? null : undefined);
  const boMo = (id: number) => { setMo((s) => { const n = new Set(s); n.delete(id); return n; }); setLenh((l) => (l?.id === id ? null : l)); };
  /* `?the=` từ chuông / Tổng quan: mở sẵn đúng dòng (kể cả thẻ nằm sau "Xem thêm"). */
  useEffect(() => {
    if (!theTuLink || !data) return;
    const i = data.the.findIndex((x) => x.id === theTuLink);
    if (i < 0) return;
    setSoHien((n) => Math.max(n, i + 1));
    setMo((s) => (s.has(theTuLink) ? s : new Set(s).add(theTuLink)));
  }, [theTuLink, data]);

  const xong = () => { reload(); invalidate('/yeu-cau/dem'); };
  const lamMoi = () => { invalidate('/yeu-cau'); invalidate('/my-work'); invalidate('/cases'); invalidate('/tong-quan'); };
  /* Quyết ở phần mở (TheYeuCau đã báo toast): gập dòng, tải lại danh sách. */
  const xongDong = (id: number) => { boMo(id); xong(); };
  const bamDong = (y: TheYeuCauDto) => {
    if (dangO.has(y.id)) return;   // đang soạn lý do: gập sẽ mất chữ — Huỷ / Gửi / Esc trước
    if (mo.has(y.id)) boMo(y.id); else setMo((s) => new Set(s).add(y.id));
  };
  /* Huỷ quyết định vừa bấm (loại máy chủ cho huỷ — cùng đường "Huỷ quyết định" của Đã xử lý). */
  const huyQd = async (id: number) => {
    try {
      await api.post(`/yeu-cau/${id}/huy-quyet-dinh`);
      lamMoi();
      toast.push('ok', t('Đã huỷ quyết định · thẻ về Chờ duyệt'), { key: `yc-${id}` });   // thay toast "Hoàn tác (n)" của cùng yêu cầu
      xong();
    } catch (e: any) {
      toast.push('error', e instanceof ApiError ? e.message : t('Mất kết nối, chưa huỷ được. Kiểm tra mạng rồi bấm lại.'));
    }
  };
  /* Nút "Duyệt" trơn của dòng: quyết ngay tại dòng; toast "✓ Đã duyệt · … · Hoàn tác" (loại cho huỷ — cờ `coTheHuy` của máy chủ). */
  const duyetNgay = async (y: TheYeuCauDto) => {
    if (dangGui) return;
    setDangGui(y.id);
    try {
      const kq = await api.post<{ coTheHuy?: boolean }>(`/yeu-cau/${y.id}/duyet`, {});
      lamMoi();
      const chu = t('Đã duyệt: {tieuDe}', { tieuDe: y.tieuDe });
      if (kq?.coTheHuy) toast.hoanTac(chu, () => { void huyQd(y.id); }, { key: `yc-${y.id}` }); else toast.push('ok', chu);
    } catch (e: any) {
      /* Chủ SP 07/11 (mục 7): thẻ đã xử lý / chết — báo trung tính, danh sách làm mới (`xong`). */
      if (laDaXuLy(e)) { toast.push('info', t('Yêu cầu này đã được xử lý.')); lamMoi(); return; }
      toast.push('error', e instanceof ApiError ? e.message : t('Mất kết nối, chưa lưu gì. Kiểm tra mạng rồi bấm lại.'));
    } finally { setDangGui(null); xong(); }
  };
  /* Nút Từ chối / Duyệt / Trả lời của dòng. Dòng đang mở: gửi lệnh cho phần mở (cùng đường cũ, giữ tick "Nhờ TVV báo lại PH"). Dòng đóng: Duyệt trơn quyết ngay,
     còn lại mở dòng ra với ô / bước tương ứng. */
  const bamNut = (y: TheYeuCauDto, loai: LenhDong['loai']) => {
    const lenhMoi = { id: y.id, loai, n: ++soLenh.current };
    if (mo.has(y.id)) return setLenh(lenhMoi);
    const coBuoc = y.loai === 'lich_thi' || !!y.duLieu?.canGhiChu || !!y.duLieu?.moPanelChuyenLop;
    if (loai === 'duyet' && !coBuoc) return void duyetNgay(y);
    setMo((s) => new Set(s).add(y.id));
    setLenh(lenhMoi);
  };
  /* Lỗi 7: một câu tổng (toast) + lý do TỪNG thẻ ngay dưới dòng; thẻ lỗi GIỮ trong lựa chọn (cùng chữ lý do Từ chối) để "Thử lại" chỉ gửi chúng.
     Chủ SP 07/11 (mục 7): thẻ đã được xử lý (người khác / tự đóng) và thẻ không còn (404) không phải lỗi — chỉ đếm trong câu tổng, rời lựa chọn.
     Trước lần gửi kế tiếp: danh sách tải lại (`xong`), effect `data` bỏ thẻ không còn chờ rồi mới mở lại nút (`doiSoat`). */
  const baoKetQua = (viec: 'duyet' | 'tu-choi', ok: number, loi: { id: number; loi: string; ma: number }[]) => {
    const giu = loi.filter((l) => l.ma !== 404 && !laDaXuLy({ status: l.ma, message: l.loi }));
    toast.push(giu.length ? 'error' : loi.length ? 'info' : 'ok', tomTatKetQuaHangLoat(viec, ok, loi));
    setLoiThe(new Map(giu.map((l) => [l.id, dich(l.loi)])));
    setChon(new Set(giu.map((l) => l.id)));
    if (giu.length) setDoiSoat(true);
  };
  const duyetNhieu = async () => {
    if (busy || !chon.size) return;
    setBusy(true);
    try {
      const r = await api.post<{ ok: number[]; loi: { id: number; loi: string; ma: number }[] }>('/yeu-cau/duyet-nhieu', { ids: [...chon] });
      invalidate('/yeu-cau'); invalidate('/my-work'); invalidate('/cases'); invalidate('/tong-quan');   // SL1 (A7-14): số "Chờ duyệt n" + dải
      baoKetQua('duyet', r.ok.length, r.loi);
      xong();
    } catch (e: any) {
      toast.push('error', e instanceof ApiError ? e.message : t('Mất kết nối giữa chừng — danh sách đã làm mới để thấy thẻ nào đã xong.'));
      setDoiSoat(true); xong();
    } finally { setBusy(false); }
  };
  const tuChoiNhieu = async () => {
    setTcDaBam(true);
    if (busy || !chon.size || !lyDoTc?.trim()) return;
    setBusy(true);
    try {
      /* Lô 6 thẻ mỗi request (~21 câu SQL mỗi thẻ, Case nhiều PA nhiều hơn → ≤ 200 câu, kịp trần 10 s). Lô lỗi mạng giữa chừng: báo, làm mới để thấy thẻ nào đã xong. */
      const r = { ok: [] as number[], loi: [] as { id: number; loi: string; ma: number }[] };
      for (const lo of chiaLo([...chon], LO_TU_CHOI)) {
        const k = await api.post<typeof r>('/yeu-cau/tu-choi-nhieu', { ids: lo, lyDo: lyDoTc.trim() });
        r.ok.push(...k.ok); r.loi.push(...k.loi);
        /* Lô sau lỗi mạng: thẻ của lô đã xong rời lựa chọn ngay — bấm lại chỉ gửi phần chưa gửi (chữ lý do giữ nguyên). */
        setChon((s) => { const n = new Set(s); for (const id of k.ok) n.delete(id); return n; });
      }
      invalidate('/yeu-cau'); invalidate('/my-work'); invalidate('/cases'); invalidate('/tong-quan');
      baoKetQua('tu-choi', r.ok.length, r.loi);
      xong();
    } catch (e: any) {
      toast.push('error', e instanceof ApiError ? e.message : t('Mất kết nối giữa chừng — danh sách đã làm mới để thấy thẻ nào đã xong.'));
      invalidate('/yeu-cau'); invalidate('/my-work'); invalidate('/cases'); invalidate('/tong-quan');
      setDoiSoat(true); xong();
    } finally { setBusy(false); }
  };
  const dem = data?.dem;
  const dsHien = ds.slice(0, soHien);
  const chonCua = (y: TheYeuCauDto) => (choHangLoat && y.hangLoat && y.trangThai === 'cho' ? {
    checked: chon.has(y.id), onChange: (v: boolean) => setChon((s) => chonMot(ds, s, y.id, v)),
  } : null);
  /* "Lớp ▾": lớp có trong danh sách đã nạp (không gọi thêm) + lớp đang lọc. */
  const dsLop = useMemo(() => {
    const m = new Map<number, string>();
    for (const y of ds) if (y.lopId != null && y.lop) m.set(y.lopId, y.lop);
    if (lopId && data?.lopDangLoc) m.set(data.lopDangLoc.id, data.lopDangLoc.code);
    return [...m].sort((a, b) => a[1].localeCompare(b[1], 'vi', { numeric: true }));
  }, [ds, lopId, data]);
  const xemDaXuLy = () => chonLoc('da-xu-ly', null);
  const hangLoc = (
    <>
      {/* AUDIT-UI B6 (mockup `.hang-loc`): một hàng chip — phân loại phải quyết · vạch · Báo QL · Đã xử lý · 30 ngày · Lớp ▾. Chip bật = nền nhấn nhạt + viền nhấn. */}
      {/* 375: một hàng cuộn ngang (như hàng tab), mép phải mờ — không gãy 4 dòng đẩy danh sách xuống. */}
      <div role="group" aria-label={t('Lọc yêu cầu')} data-hd="cd-loc"
        className="flex flex-wrap items-center gap-2 max-sm:-mx-4 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:px-4 max-sm:pr-8 max-sm:[mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] max-sm:[scrollbar-width:none]">
        {[{ key: 'tat-ca' as KhoaChip, nhan: t('Tất cả') }, ...PHAN_LOAI_CAN_QUYET.map((k) => ({ key: k as KhoaChip, nhan: PHAN_LOAI_LABEL[k] }))].map((c) => (
          <ChipLoc key={c.key} bat={xem !== 'de-biet' && phan === c.key} so={dem?.[c.key] ?? null} onClick={() => chonLoc(xem === 'de-biet' ? 'cho' : xem, c.key)}>{c.nhan}</ChipLoc>
        ))}
        <span aria-hidden className="h-6 w-px max-sm:hidden" style={{ background: 'var(--line-strong)' }} />
        <ChipLoc bat={xem === 'de-biet'} so={data?.demBiet ?? null} onClick={() => chonLoc(xem === 'de-biet' ? 'cho' : 'de-biet', null)}>{t('Báo Head')}</ChipLoc>
        <ChipLoc bat={xem === 'da-xu-ly'} onClick={() => chonLoc(xem === 'da-xu-ly' ? 'cho' : 'da-xu-ly', phan)}>{t('Đã xử lý · 30 ngày')}</ChipLoc>
        {(dsLop.length > 0 || lopId) && (
          /* GD-5 (R5.2 #50): ô lọc có tìm — lớp có thẻ đang chờ (suy từ dòng đã nạp + lớp đang lọc, không gọi thêm). */
          <ChonLop className="w-[160px] shrink-0" gon ariaLabel={t('Lọc theo lớp')} macDinhTrong={t('Lớp')} value={lopId ? Number(lopId) : null}
            onChange={(v) => setParam('lop', v ? String(v) : null)}
            ds={dsLop.map(([id, ma]) => { const n = ds.filter((y) => y.lopId === id && y.trangThai === 'cho').length; return { id, ma, ...(n ? { phu: t('{n} thẻ chờ', { n }) } : {}) }; })} />
        )}
        {quaHan && (
          <button type="button" className="nut-loc nut-loc-dang" title={t('Bỏ lọc quá hạn')} onClick={() => setParam('qua-han', null)}>
            {t('Quá hạn')} · <span className="tabular-nums">{ds.length}</span> <span aria-hidden>✕</span>
          </button>
        )}
      </div>
    </>
  );
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  return (
    <div className={`space-y-3${gon ? ' dyc-panel pt-3' : ''}`}>
      {gon ? null : khuLoc ? createPortal(hangLoc, khuLoc) : hangLoc}

      {/* v24 H1: thanh chọn nhiều — "Đã chọn n · Bỏ chọn · Duyệt n yêu cầu" (tick đầu = chọn / bỏ hết thẻ cùng loại đang hiện). */}
      {chon.size > 0 && (
        <div className="dyc">
          <div className="dyc-lo sticky top-2 z-10 shadow-lg">
            <input type="checkbox" aria-label={t('Chọn tất cả')} disabled={busy} checked={!!loaiChon && chon.size === nHet} ref={(el) => { if (el) el.indeterminate = chon.size > 0 && chon.size < nHet; }}
              onChange={(e) => setChon(e.target.checked && loaiChon ? chonHet(dsChonHet, loaiChon) : new Set())} />
            <span className="tabular-nums">
              {t('Đã chọn {n}', { n: chon.size })}{loaiChon && <span className="text-dim"> · {LOAI_YC_META[loaiChon]?.nhan ?? ''}</span>}
              {biCatTran && <span className="ml-2 text-[12px] text-dim">{t('Tối đa {n} một lần', { n: TRAN_HANG_LOAT })}</span>}
            </span>
            <span className="dyc-phai">
              <button type="button" className="btn btn-sm" onClick={() => setChon(new Set())} disabled={busy}>{t('Bỏ chọn')}</button>
              {loaiChon && LOAI_YC_META[loaiChon]?.kieuNut === 'duyet-tu-choi' && (
                <button type="button" className="btn btn-sm" aria-pressed={lyDoTc !== null} disabled={busy}
                  onClick={() => { setLyDoTc(lyDoTc === null ? '' : null); setTcDaBam(false); }}>{t('Từ chối {n}…', { n: chon.size })}</button>
              )}
              <button type="button" className="btn btn-sm btn-primary" onClick={duyetNhieu} disabled={busy || doiSoat || lyDoTc !== null}>
                {busy && lyDoTc === null ? t('Đang duyệt…') : t('Duyệt {n} yêu cầu', { n: chon.size })}
              </button>
            </span>
            {lyDoTc !== null && (
              <div className="w-full space-y-1.5 border-t py-2.5" style={{ borderColor: 'var(--line)' }}>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-[color:var(--text)]">{t('Lý do từ chối (người gửi sẽ đọc)')}<span aria-hidden className="text-bad"> *</span></span>
                  <textarea className="field w-full max-w-[640px]" rows={3} maxLength={2000} autoFocus aria-label={t('Lý do từ chối')} value={lyDoTc} aria-invalid={tcDaBam && !lyDoTc.trim()}
                    onChange={(e) => setLyDoTc(e.target.value)} />
                </label>
                {tcDaBam && !lyDoTc.trim() && <span className="block text-xs text-late">{t('Chưa điền')}</span>}
                <div className="flex gap-2">
                  <button type="button" className="btn" disabled={busy} onClick={() => { setLyDoTc(null); setTcDaBam(false); }}>{t('Huỷ')}</button>
                  <button type="button" className="btn btn-primary" disabled={busy || doiSoat} onClick={() => void tuChoiNhieu()}>
                    {busy ? t('Đang từ chối…') : t('Gửi từ chối {n}', { n: chon.size })}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Thẻ mở từ chuông không còn trong danh sách đang xem (đã xử lý / tự đóng / khác bộ lọc). */}
      {theTuLink && data && !theMo && (
        <div className="card flex flex-wrap items-center gap-2 px-4 py-3 text-sm text-slate-300" role="status">
          <span className="min-w-0 flex-1">{xem === 'cho' ? t('Yêu cầu vừa mở không còn trong danh sách này — có thể đã được xử lý hoặc tự đóng.') : t('Yêu cầu vừa mở không còn trong danh sách này.')}</span>
          {xem !== 'da-xu-ly' && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" onClick={xemDaXuLy}>{t('Xem ở Đã xử lý')}</button>}
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" onClick={() => setParam('the', null)}>{t('Đóng')}</button>
        </div>
      )}
      {loading && !data && <div className="card px-4 py-3"><Skeleton rows={4} /></div>}
      {data && ds.length === 0 && (
        <div className="card px-4 py-6">
          <Empty title={xem === 'cho' ? t('Không có yêu cầu nào đang chờ') : xem === 'de-biet' ? t('Không có thẻ Báo Head')
            : t('Chưa có yêu cầu nào được xử lý trong 30 ngày')} />
        </div>
      )}
      {dsHien.length > 0 && (
        <DsDuyet ds={dsHien} mo={mo} dangO={dangO} nhanId={nhanId} lenh={lenh} dangGui={dangGui} toi={session?.user?.id ?? null} chon={chonCua} loi={loiThe}
          onBam={bamDong} onNut={bamNut} onXong={(id) => xongDong(id)} onThemPa={setNgan}
          onO={(id, d) => setDangO((s) => { if (s.has(id) === d) return s; const n = new Set(s); if (d) n.add(id); else n.delete(id); return n; })} />
      )}
      {data && (ds.length > soHien || (!!data.khacChiNhanh && !gon)) && (
        /* V8-CV: chân danh sách — Xem thêm · n ở chi nhánh khác · Xem › (AUDIT-UI B6: bỏ "Mở hộp duyệt ›" — hộp là chính tab này). */
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[13px]">
          {ds.length > soHien && (
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" onClick={() => setSoHien((n) => n + 10)}>
              {t('Xem thêm {n} yêu cầu', { n: Math.min(10, ds.length - soHien) })}
            </button>
          )}
          {!!data.khacChiNhanh && !gon && (
            <span className="text-dim">{t('{n} yêu cầu ở chi nhánh khác', { n: data.khacChiNhanh })} · <button type="button"
              className="link appearance-none border-0 bg-transparent p-0 font-semibold max-sm:inline-block max-sm:py-3" onClick={() => setParam('cn', 'tat-ca')}>{t('Xem ›')}</button></span>
          )}
        </div>
      )}

      {ngan && <NganCase caseId={ngan} viec="them-pa" onClose={() => setNgan(null)} onChanged={xong} />}
      {choDoi && <HopBoChu viec={t('Lý do')} nut={t('Bỏ chữ, đổi bộ lọc')} onO={() => setChoDoi(null)} onBo={() => { const f = choDoi.chay; setChoDoi(null); f(); }} />}
    </div>
  );
}

/** Chip lọc của hàng lọc Chờ bạn duyệt (mockup `.chip-loc`: viên 32 px, 14 / 500, số mờ 13; bật = nền nhấn nhạt + viền nhấn, 600). */
function ChipLoc({ bat, so, onClick, children }: { bat: boolean; so?: number | null; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={bat} onClick={onClick}
      className={`nut-loc gap-1.5 text-[14px] text-[color:var(--text)] ${bat ? 'font-semibold' : 'font-medium'}`}>
      {children}{so != null && <span className="text-[13px] font-medium tabular-nums text-dim">{so}</span>}
    </button>
  );
}

type MoSan = 'duyet' | 'tu-choi' | 'tra-loi';

/** PANEL DUYỆT (UI-CON-LAI k3, V8-CV) — một khuôn cho Hộp duyệt và Công việc: loại · tên · em · lớp · chip hạn, thân là thẻ ở dạng panel.
 *  DUYET-QL (mockup v10 #cv): thân cuộn, CHÂN DÍNH "Tiếp: {yêu cầu kế}" · Từ chối… · Duyệt (nút của thẻ vẽ vào chân qua portal); đầu có chip SOS;
 *  "Lịch sử · n" gập cuối thân. `xong` = vừa quyết ở panel: khối "✓ … · Hoàn tác", chân "✓ Đã lưu · Yêu cầu tiếp ›". */
export function PanelDuyet({ yc, moSan, tiep, xong, onDong, onXong, onThemPa }: {
  yc: TheYeuCauDto; moSan?: MoSan; tiep?: TheYeuCauDto | null; onDong: () => void; onXong: (id: number, chu?: string, huy?: boolean, soLichSu?: number) => void; onThemPa?: (caseId: number) => void;
  xong?: { chu: string; onHoanTac?: () => void; onTiep: (y: TheYeuCauDto) => void };
}) {
  const [chanEl, setChanEl] = useState<HTMLElement | null>(null);
  /* Thẻ đã xử lý (tab Đã xử lý · Sửa trả lời… · Huỷ quyết định) giữ nút trong thân như cũ — chân dính chỉ cho thẻ đang chờ quyết. */
  const cho = yc.trangThai === 'cho';
  const { homNay } = useNgayNghiepVu();
  const chuTiep = tiep ? t('Tiếp: {tieuDe}', { tieuDe: [dich(tiep.tieuDe), tiep.hocVien].filter(Boolean).join(' · ') }) : null;
  return (
    <KhungTaiCho.Provider value>
      <KhungPanel hd="duyet" tieuDe={dich(yc.tieuDe)} loai={`${t('Việc · Duyệt')} · ${dich(yc.nhanPhanLoai)}`}
        dau={{ han: !xong && yc.trangThai === 'cho' && yc.hanDuyet ? <ChipHan loai="duyet" han={yc.hanDuyet} /> : undefined,
          dong2: [
            yc.hocVien && (yc.hocVienId != null ? <Link to={`/hoc-vien/${yc.hocVienId}`} className="link">{yc.hocVien}</Link> : yc.hocVien),
            yc.lop, yc.phu && dich(yc.phu),
            yc.sos && <ChipSos muc={yc.sos.muc} kyNang={yc.sos.kyNang} tam={yc.sos.tam} dot={yc.diemHv?.luot} ten={yc.hocVien} />,
          ].filter(Boolean) }}
        chan={xong ? {
          huy: tiep ? null : { nhan: t('Đóng'), onClick: onDong },
          trai: <span className="ten-hv min-w-0 text-dim"><b className={`font-semibold ${LOP_DA_LUU}`}>{t('✓ Đã lưu')}</b>{chuTiep && ` · ${chuTiep}`}</span>,
          chinh: tiep ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => xong.onTiep(tiep)}>{t('Yêu cầu tiếp ›')}</button> : undefined,
        } : !cho ? undefined : {
          huy: null,
          trai: chuTiep && <span className="ten-hv min-w-0 text-dim">{chuTiep}</span>,
          chinh: <span ref={setChanEl} className="flex flex-wrap items-center gap-2 max-sm:w-full max-sm:[&>.btn]:flex-1 max-sm:[&>.btn]:justify-center" />,
        }}
        /* GD-4b Q69–Q73: theo loại thẻ, chỉ thẻ đang chờ quyết. */
        quyChe={cho && !xong ? quyCheDuyet(yc.loai, yc.hanDuyet ?? null, homNay, hanDuyetNgay()) : null}
        onDong={onDong}>
        {xong ? (
          <div role="status" className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-ok-line bg-ok-bg px-3 py-2.5 text-[13px]">
            <b className="min-w-0 flex-1 font-semibold text-ok">✓ {dich(xong.chu)}</b>
            {xong.onHoanTac && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={xong.onHoanTac}>{t('Hoàn tác')}</button>}
          </div>
        ) : null}
        {/* Mockup #cv nth=1: bối cảnh vẫn đọc được sau khi quyết (bản chụp thẻ lúc quyết — chỉ đọc). */}
        {xong && (
          <div className="mt-3 rounded-lg bg-[color:var(--surface-2)] px-3 py-2.5 text-[13px] leading-snug text-slate-300">
            {yc.dong.map((d, i) => <p key={i} className="m-0 whitespace-pre-line">{bacDu(dich(d))}</p>)}
            {yc.diemHv && (
              <dl className="m-0 mt-2 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
                <dt className="pt-1.5 text-[13px] text-dim">{t('Điểm')}</dt><dd className="m-0 min-w-0"><DongDiem d={yc.diemHv} /></dd>
              </dl>
            )}
          </div>
        )}
        {xong ? null : <TheYeuCau yc={yc} panel moSan={moSan} onXong={onXong} onThemPa={onThemPa} chanEl={cho ? chanEl : undefined} />}
        <LichSuYeuCau id={yc.id} n={yc.soLichSu ?? 0} />
      </KhungPanel>
    </KhungTaiCho.Provider>
  );
}
