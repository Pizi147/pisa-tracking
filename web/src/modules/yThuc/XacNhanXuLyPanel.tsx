import { useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, KhungPanel, Truong, useNhap, useXoaNhap } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { BoiCanh, CanLam, NutChu, TrangThaiLuu, dauViec } from '../../ui/KhuonViec.tsx';
import { TepCho, taiTepCho, type TepChoMuc } from '../../ui/TepCho.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { ErrorState, NutChon } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  KHAC_TOI_THIEU, MEASURE_KIND_LABEL, THANG, dsLoi, hanTheoNgay, kiemGhiRoKhac, ngay, nguoiThanhPayload, nguoiThieu, type NguoiChon,
} from '@shared/domain/index.ts';
import { MuiTenGap, NhanViPham } from './NhanViPham.tsx';
import { DUONG_LAM_MOI_Y_THUC, type ViPhamV4, type XuLyView, type YThucHocVien } from './kieu.ts';
import { ChipMon, TienTrinh } from './BangLan.tsx';
import { CanLamEm } from './khoiYThuc.tsx';
import { dich, t } from '@shared/i18n/index.ts';

const MO_TA_MIN = 10;
const lamMoi = () => DUONG_LAM_MOI_Y_THUC.forEach((d) => invalidate(d));

/** Loại cần QL duyệt (V4-9): WL 3 chỉ khi là bậc kế (Q11) — thứ tự bày theo độ nặng. */
const LOAI_DE_XUAT = ['wl_3', 'meeting_cx', 'suspension', 'other'] as const;
/** LUAT-5: loại ngoài thang mới bắt tệp bằng chứng; "không tăng bậc" (bậc thang ≤ bậc hiện tại) chỉ cần lý do. */
const canTep = (loai: string) => (LOAI_DE_XUAT as readonly string[]).includes(loai);
/** TINH-HINH (mockup v20 D, chủ SP 12/11): bốn cách xử lý chọn tại chỗ — Nâng 1 bậc (mặc định, lưu ngay) · ba cách còn lại gửi QL duyệt (5 ngày, hết hạn giữ quyết định GVCN). */
type Cach = 'nang' | 'giu' | 'vuot' | 'ngoai';

/**
 * XÁC NHẬN XỬ LÝ — MỘT BƯỚC (V4-7, mockup M6) + chế độ ĐỀ XUẤT QL DUYỆT (V4-9, V4-10).
 *
 * Xác nhận xử lý: bậc TỰ ĐIỀN (chỉ đọc — máy chủ quyết, `bacDaThay` lệch → 409), vi phạm tick theo `macDinhTick` (K3-36, nhóm
 * "Cũ hơn" gập), ngày ≤ hôm nay, người thực hiện (nhận tên ngoài), mô tả bắt buộc. Lưu xong ở lại panel để đính kèm tệp (tuỳ chọn).
 * Đề xuất (#6, mockup #1346 — MỘT màn): loại · vi phạm · lý do · bằng chứng (chọn trong form, BẮT BUỘC với loại ngoài thang) → `Gửi QL duyệt`.
 * Đóng panel khi nháp chưa gửi thì xoá nháp (Q10). Bậc kế cần QL (WL 3) hoặc hết thang → mở thẳng chế độ Đề xuất.
 * OV-12e (mockup v3 §8): khuôn panel v3 — đầu "Xác nhận xử lý" + chip hạn / tên em (link) · lớp · Ý thức; MỘT khối Cần làm (Bậc xử lý tự điền · vi phạm đưa vào
 * · Ngày * (ô ngày gõ được) · Người * · Mô tả * · nút chính; "Đề xuất QL duyệt" là nút chữ); Bối cảnh: Lần trước · Bậc tiếp theo; chân trạng thái lưu.
 */
export function XacNhanXuLyPanel({ studentId, cheDo: cheDoMo = 'xu-ly', tickThem, lop, onClose, onDone, onKhai }: {
  studentId: number | null; cheDo?: 'xu-ly' | 'de-xuat';
  /** Rà 11/11 G3-6: mở từ dòng Đã xem — vi phạm đó tick sẵn (cùng tick mặc định), nằm ở "Cũ hơn" thì mở sẵn nhóm đó. */
  tickThem?: readonly number[];
  /** Mã lớp ở dòng 2 đầu panel (nơi gọi biết). */
  lop?: string | null;
  onClose: () => void; onDone?: () => void;
  /** Mở panel Xác nhận cấp bậc vi phạm (Q7): chuỗi chưa có lần xử lý nào và em chưa từng xác nhận. */
  onKhai?: (studentId: number) => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data: d, error: loiTai, reload } = useApi<YThucHocVien>(studentId ? `/students/${studentId}/y-thuc` : null, [studentId]);
  /* Một form (bỏ chế độ "Đề xuất QL duyệt" riêng): `cheDo` suy từ cách — Nâng 1 bậc = Xác nhận xử lý, cách khác = Đề xuất. */
  const [cach, setCach] = useState<Cach>(cheDoMo === 'de-xuat' ? 'ngoai' : 'nang');
  const cheDo: 'xu-ly' | 'de-xuat' = cach === 'nang' ? 'xu-ly' : 'de-xuat';
  const [chon, setChon] = useState<Set<number>>(new Set());
  const [moCu, setMoCu] = useState(false);
  const [ngayTh, setNgayTh] = useState(homNay);
  const [nguoi, setNguoi] = useState<NguoiChon | null>({ kieu: 'toi' });
  const [moTa, setMoTa] = useNhap('xu-ly-mo-ta', '');
  const xoaNhap = useXoaNhap();
  const daNapEm = useRef<number | null>(null);
  const [loai, setLoai] = useState<string>('');
  const [tenKhac, setTenKhac] = useState('');
  const [busy, setBusy] = useState(false);
  /** [XM 5] (chủ SP 11/11): tệp chọn NGAY trong form (như Ghi vi phạm), tải sau khi lưu — không tệp / tải xong thì panel tự đóng, không bước "Xong". */
  const [tep, setTep] = useState<TepChoMuc[]>([]);
  const [loiLuu, setLoiLuu] = useState<string | null>(null);
  /** Sau khi lưu xử lý mà tệp tải lỗi: lần xử lý vừa tạo (ở lại để Thử lại tệp). */
  const [daLuu, setDaLuu] = useState<{ id: number; loai: 'xu-ly'; nhan: string } | null>(null);
  /** #6: nháp đề xuất đã tạo nhưng chưa gửi (tệp lỗi) — đóng panel thì xoá. */
  const nhapDo = useRef<number | null>(null);
  const lf = useLoiForm();
  const idempotencyKey = useMemo(() => `xu-ly:${studentId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`, [studentId]);

  useEffect(() => {
    if (!d) return;
    const them = (tickThem ?? []).filter((id) => d.macDinh.tick.includes(id) || d.macDinh.cuHon.includes(id));
    setChon(new Set([...d.macDinh.tick, ...them]));
    if (daNapEm.current !== null) setMoTa('');   // NEN-PANEL: lần nạp đầu giữ nháp (K12); đổi em thì bỏ chữ của em trước
    daNapEm.current = d.studentId;
    setTep([]); setNgayTh(homNay); setNguoi({ kieu: 'toi' }); setLoai(''); setTenKhac(''); setDaLuu(null); setMoCu(them.some((id) => d.macDinh.cuHon.includes(id))); lf.datLai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d?.studentId]);

  if (!studentId) return null;
  const tieuDe = t('Xác nhận xử lý');
  if (loiTai) return <KhungPanel hd="xu-ly-vi-pham" tieuDe={tieuDe} onDong={onClose}><ErrorState message={loiTai.message} hint={loiTai.hint} status={loiTai.status} onRetry={reload} /></KhungPanel>;
  if (!d) return <KhungPanel hd="xu-ly-vi-pham" tieuDe={tieuDe} onDong={onClose}><p className="mt-3 text-sm text-slate-400">{t('Đang tải…')}</p></KhungPanel>;
  const dau = (han: boolean) => dauViec({ han: han ? <ChipHan loai="xu-ly-vi-pham" han={d.han} /> : null, em: { id: d.studentId, ten: d.ten }, lop, ngCanh: t('Ý thức') });

  const theoId = new Map(d.viPham.map((v) => [v.id, v]));
  const tick = d.macDinh.tick.map((id) => theoId.get(id)).filter((v): v is ViPhamV4 => !!v);
  const cuHon = d.macDinh.cuHon.map((id) => theoId.get(id)).filter((v): v is ViPhamV4 => !!v);
  const ngayVp = [...tick, ...cuHon].map((v) => v.occurredOn).sort();
  const doi = (id: number) => setChon((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const loi = dsLoi([
    { khoa: 'vi-pham', nhan: t('Vi phạm'), chon: true },
    ...(cheDo === 'de-xuat' ? [{ khoa: 'loai', nhan: t('Loại'), chon: true }] : []),
    ...(cheDo === 'de-xuat' && loai === 'other' ? [{ khoa: 'ghi-ro', nhan: t('Ghi rõ'), toiThieu: KHAC_TOI_THIEU }] : []),
    { khoa: 'mo-ta', nhan: t('Mô tả'), toiThieu: MO_TA_MIN },
  ], { 'vi-pham': chon.size ? 'co' : '', loai, 'ghi-ro': tenKhac, 'mo-ta': moTa }).concat(
    tep.some((m) => m.loi && !m.daGui) ? [{ khoa: 'tep', nhan: t('Tệp'), lyDo: t('Bỏ tệp lỗi') }]
      /* #6: đề xuất loại ngoài thang bắt bằng chứng (V4-10, LUAT-5) — báo ngay khi bấm Gửi, không gọi máy chủ. */
      : cheDo === 'de-xuat' && canTep(loai) && !tep.length ? [{ khoa: 'tep', nhan: t('Bằng chứng'), lyDo: t('Cần đính kèm tệp hoặc liên kết') }] : []);
  const loiNguoi = cheDo === 'xu-ly' ? nguoiThieu(nguoi, true) : null;

  /** Đóng: đề xuất dở (tệp tải lỗi, chưa gửi) thì xoá nháp máy chủ — chữ đang gõ vẫn ở nháp của panel. */
  const dong = async () => {
    if (nhapDo.current) {
      try { await api.del(`/y-thuc/xu-ly/${nhapDo.current}`); } catch { /* nháp đã gửi hoặc đã xoá — không có gì để dọn */ }
    }
    onClose();
  };

  const luuXuLy = async () => {
    lf.bam();
    if (loi.length || loiNguoi) return;
    setBusy(true);
    setLoiLuu(null);
    try {
      const m = await api.post<XuLyView>(`/students/${studentId}/y-thuc/xu-ly`, {
        violationIds: [...chon], performedOn: ngayTh, ...nguoiThanhPayload(nguoi), note: moTa.trim(), idempotencyKey, bacDaThay: d.bac,
      });
      /* OV-11c (CV-7): báo nơi gọi TRƯỚC khi làm mới — Công việc giữ chỗ dòng (mờ + gạch) và panel ở lại bước "Đã lưu · Tệp hoặc liên kết". */
      const traNhap = xoaNhap();
      onDone?.();
      lamMoi();
      await xongTep(m.id, m.nhan, tep, traNhap);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) {
        toast.push('error', t('Bậc vừa đổi — đã mở lại với bậc mới.'));
        reload();
      } else setLoiLuu(e.message);
    } finally { setBusy(false); }
  };

  const cauXong = (nhan: string) => t('Đã xác nhận {nhan} cho {ten}.', { nhan: dich(nhan), ten: d.ten });
  /** Tải tệp chờ vào lần xử lý vừa lưu; xong hết (hoặc không có tệp) → toast + đóng panel. Tệp lỗi → ở lại chỗ tệp, `Thử lại` (lần xử lý đã lưu). */
  /** [XM 5] (PTA 11/11 duyệt): Hoàn tác ở toast = xoá hẳn lần vừa lưu (máy chủ chỉ nhận khi người vừa lưu, TVV chưa ghi, chưa có lần sau); chữ Mô tả trả lại nháp. */
  const hoanTac = async (id: number, traNhap?: () => void) => {
    try {
      await api.post(`/y-thuc/xu-ly/${id}/hoan-tac`);
      traNhap?.(); lamMoi(); onDone?.();
      toast.push('ok', t('Đã hoàn tác — vi phạm về như trước.'));
    } catch (e: any) { toast.push('error', e.message); }
  };
  const xongTep = async (id: number, nhan: string, ds: TepChoMuc[], traNhap?: () => void) => {
    const kq = ds.some((x) => !x.xong) ? await taiTepCho(ds, { ownerType: 'discipline_measure', ownerIds: [id] }) : ds;
    setTep(kq);
    if (kq.every((x) => x.xong)) {
      toast.hoanTac(cauXong(nhan), () => void hoanTac(id, traNhap));
      /* Chữ đã lưu — xoá khỏi ô rồi mới đóng (đóng lúc ô còn chữ thì khung hỏi "Bỏ chữ đang gõ?"). */
      setMoTa(''); setTimeout(onClose, 0);
      return;
    }
    setDaLuu({ id, loai: 'xu-ly', nhan });
  };

  /**
   * #6 (mockup #1346 K1–K2): MỘT nút "Gửi QL duyệt" = tạo nháp (chủ của tệp) → tải tệp chờ → gửi. Tệp lỗi → chưa gửi (QL chưa thấy gì), ở lại, chữ giữ;
   * Thử lại = làm lại từ đầu (máy chủ dọn nháp cũ của cùng người · cùng em, tải lại mọi tệp) — form có thể đã sửa giữa hai lần.
   */
  const guiDeXuat = async () => {
    lf.bam();
    if (loi.length) return;
    setBusy(true); setLoiLuu(null);
    try {
      const m = await api.post<{ id: number; nhan: string }>(`/students/${studentId}/y-thuc/de-xuat`, {
        kind: loai, customName: loai === 'other' ? tenKhac.trim() : undefined, violationIds: [...chon], note: moTa.trim(),
      });
      nhapDo.current = m.id;
      const kq = await taiTepCho(tep.map((x) => ({ ...x, xong: undefined, tuId: undefined, loi: undefined, daGui: undefined })), { ownerType: 'discipline_measure', ownerIds: [m.id] });
      setTep(kq);
      const loiTep = kq.filter((x) => !x.xong).length;
      if (loiTep) { setLoiLuu(t('Chưa gửi — {n} tệp tải lỗi', { n: loiTep })); return; }
      await api.post(`/y-thuc/xu-ly/${m.id}/gui`);
      nhapDo.current = null;
      xoaNhap(); setMoTa(''); lamMoi(); onDone?.();
      toast.push('ok', t('Đã gửi QL duyệt {nhan} cho {ten}. QL trả lời trong 5 ngày.', { nhan: m.nhan, ten: d.ten }));
      setTimeout(onClose, 0);
    } catch (e: any) { setLoiLuu(e.message); } finally { setBusy(false); }
  };

  /* ---------------------------------------------------------------- bước 2: đã lưu */
  if (daLuu?.loai === 'xu-ly') {
    /* [XM 5]: chỉ còn khi tệp tải lỗi — lần xử lý ĐÃ lưu; Thử lại tải phần dở, Đóng = bỏ tệp lỗi (thêm sau ở panel lần xử lý). */
    const thuLai = async () => { setBusy(true); try { await xongTep(daLuu.id, daLuu.nhan, tep); } finally { setBusy(false); } };
    const xong = <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy} onClick={() => void thuLai()}>{t('Thử lại')}</button>;
    return (
      <KhungPanel hd="xu-ly-vi-pham" tieuDe={t('Xác nhận xử lý')} hocVien={d.ten} onDong={() => { toast.push('ok', cauXong(daLuu.nhan)); onClose(); }} dau={dau(false)}
        chan={{ v3: true, chinh: xong, dongTren: <span className="font-semibold text-done">✓ {t('Đã lưu')}</span> }}>
        <div className="flex flex-col gap-5 pt-4">
          <div className="flex flex-col gap-2 rounded-[10px] border px-4 py-3.5" style={{ background: 'var(--surface-2)', borderColor: 'var(--line)' }}>
            <span className="text-sm font-bold text-ok">✓ {t('Đã xác nhận')}</span>
            <p className="m-0 text-sm text-slate-200">{dich(daLuu.nhan)} · {t('{n} vi phạm', { n: chon.size })} · {ngay(ngayTh, homNay)}</p>
            <TepCho value={tep} onChange={setTep} khoa={busy} onThuLai={() => void thuLai()} />
          </div>
          <div className="max-sm:hidden">{xong}</div>
        </div>
      </KhungPanel>
    );
  }
  /* ---------------------------------------------------------------- bước 1 */
  const bacKe = d.keTiep;
  const dongVp = (v: ViPhamV4) => (
    <li key={v.id}>
      {/* Cả dòng là nhãn của ô tick — bấm vào chữ cũng chọn (vùng chạm ≥ 44px trên điện thoại). */}
      <label className="flex min-h-[44px] cursor-pointer items-start gap-2 py-1 sm:min-h-0">
        <input type="checkbox" className="mt-1" checked={chon.has(v.id)} onChange={() => doi(v.id)}
          aria-label={`${ngay(v.occurredOn, homNay)} ${dich(v.categoryLabel)}: ${v.ten}`} />
        <span className="w-11 shrink-0 pt-0.5 text-xs tabular-nums text-slate-500">{ngay(v.occurredOn, homNay)}</span>
        <span className="min-w-0 flex-1 text-sm text-slate-200">
          <ChipMon skill={v.skill} />{v.ten}
          <span className="block text-xs text-slate-500">{dich(v.categoryLabel)}{v.reportedByName ? ` · ${v.reportedByName} ghi` : ''}</span>
        </span>
        <NhanViPham t={v.trangThai} nhan={dich(v.nhanTrangThai)} />
      </label>
    </li>
  );

  /* Bối cảnh ≤ 3 dòng (mockup v3 §8): lần xử lý trước · bậc sau bậc này. */
  /* LUAT-5: lần "Đã thu hồi" vẫn ở dòng thời gian nhưng không phải "Lần trước". */
  const truoc = d.dongThoiGian.filter((x): x is Extract<typeof x, { loai: 'xu-ly' }> => x.loai === 'xu-ly' && x.status !== 'thu_hoi').sort((a, b) => b.ngay.localeCompare(a.ngay))[0];
  const iNay = d.dongThang.findIndex((x) => x.trangThai === 'lan-nay');
  const bacSau = iNay >= 0 ? d.dongThang[iNay + 1]?.nhan ?? null : null;
  const nutChinh = cheDo === 'xu-ly'
    ? <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy} onClick={luuXuLy}>{busy ? t('Đang lưu…') : bacKe ? t('Xác nhận · {nhan}', { nhan: dich(bacKe.nhan) }) : t('Xác nhận xử lý')}</button>
    : <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy} onClick={() => void guiDeXuat()}>{busy ? t('Đang gửi…') : t('Gửi QL duyệt')}</button>;
  /* Lựa chọn bậc của từng cách (máy chủ kiểm lại `deXuatHopLe`). */
  const bacGiu = THANG.slice(0, Math.min(d.bac, THANG.length)).reverse() as string[];
  const bacVuot = THANG.slice(Math.min(d.bac + 1, THANG.length)) as string[];
  const chipCua: Record<Exclude<Cach, 'nang'>, string[]> = { giu: bacGiu, vuot: bacVuot, ngoai: [...LOAI_DE_XUAT] };
  const chonCach = (c: Cach) => { setCach(c); setLoai(c === 'nang' ? '' : chipCua[c][0] ?? ''); lf.datLai(); };
  const tenBac = (k: string) => dich(MEASURE_KIND_LABEL[k as keyof typeof MEASURE_KIND_LABEL] ?? k);
  const hanQl = hanTheoNgay(homNay, 5);
  const CACH: { k: Cach; ten: string; phu: string; tat?: boolean }[] = [
    { k: 'nang', ten: t('Nâng 1 bậc'), phu: bacKe ? `${d.bacNhan ? dich(d.bacNhan) : t('Chưa có')} → ${dich(bacKe.nhan)}` : '' },
    { k: 'giu', ten: t('Không nâng'), phu: d.bacNhan ? t('Giữ {nhan}', { nhan: dich(d.bacNhan) }) : t('Chưa có bậc'), tat: !bacGiu.length },
    { k: 'vuot', ten: t('Vượt bậc'), phu: bacVuot.length ? t('Lên {nhan} trở lên', { nhan: tenBac(bacVuot[0]) }) : '—', tat: !bacVuot.length },
    { k: 'ngoai', ten: t('Ngoài thang'), phu: t('WL 3 · Meeting · Đình chỉ · Khác') },
  ];
  const nhanO = (chu: string, batBuoc = false) => <span className="mb-1.5 block text-[13px] font-semibold text-slate-300">{chu}{batBuoc && <span aria-hidden className="text-bad"> *</span>}</span>;
  return (
    <KhungPanel hd="xu-ly-vi-pham" tieuDe={tieuDe} hocVien={d.ten} onDong={() => void dong()} dau={dau(cheDo === 'xu-ly')}
      chan={{
        v3: true, chinh: nutChinh, daSua: !!moTa.trim(),
        conThieu: lf.conThieu(loi) ?? (lf.daBam && loiNguoi ? [{ nhan: t('Người thực hiện'), lyDo: loiNguoi }] : undefined),
        dongTren: busy || loiLuu ? <TrangThaiLuu tt={busy ? 'dang' : 'loi'} loi={loiLuu} onThuLai={() => void (cheDo === 'xu-ly' ? luuXuLy() : guiDeXuat())} /> : undefined,
      }}>
      <div className="flex flex-col gap-5 pt-4">
        {/* Y-THUC-V2 (mockup K8a / K8c): dải ①②③ cùng thứ tự tab Ý thức — bước GVCN là việc của người xem. */}
        <TienTrinh nay={1} buoc={[
          [t('{n} vi phạm', { n: tick.length + cuHon.length }), ngayVp.length ? `${ngay(ngayVp[0], homNay)} – ${ngay(ngayVp[ngayVp.length - 1], homNay)}` : null],
          /* #6 (mockup #1346 K1): đề xuất — ô ② nói việc đang làm (Gửi QL duyệt) + ai trả lời khi nào. */
          cheDo === 'de-xuat' ? [t('Gửi QL duyệt'), t('QL có 5 ngày')]
            : [d.nhom ? <CanLamEm x={d} homNay={homNay} hanDuoi /> : t('Xác nhận xử lý'),   /* G3-15: hạn xuống dưới chip — chip không tràn sang ô ③ */ bacKe ? <>{t('Lần này')} <b className="text-slate-100">{dich(bacKe.nhan)}</b></> : null],
          [<span className="font-medium text-slate-400">{cheDo === 'xu-ly' ? t('Sau khi lưu') : t('Sau khi chốt')}</span>, t('việc cho TVV của em, hạn 5 ngày')],
        ]} />
        <CanLam>
          <div>
            {nhanO(t('Vi phạm đưa vào · {n}', { n: chon.size }))}
            {tick.length + cuHon.length === 0 ? (
              <p className="m-0 text-sm text-slate-300">{t('Em không còn vi phạm nào chưa xử lý.')}</p>
            ) : (
              <div id={lf.oId('vi-pham')} tabIndex={-1}>
                <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>{tick.map(dongVp)}</ul>
                {cuHon.length > 0 && (
                  <>
                    <button type="button" className="mt-1 inline-flex min-h-[44px] items-center gap-1 appearance-none border-0 bg-transparent p-0 text-xs text-slate-300 hover:text-slate-100 sm:min-h-0"
                      aria-expanded={moCu} onClick={() => setMoCu((x) => !x)}>
                      {t('Cũ hơn · Đã ghi nhận ({n})', { n: cuHon.length })} <MuiTenGap mo={moCu} />
                    </button>
                    {moCu && <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>{cuHon.map(dongVp)}</ul>}
                  </>
                )}
                {lf.loiCua(loi, 'vi-pham') && <p className="m-0 mt-1 text-xs text-late">{t('Chọn ít nhất một vi phạm.')}</p>}
              </div>
            )}
          </div>

          {/* Mockup v20 D: cách xử lý chọn tại chỗ — 4 ô, "Nâng 1 bậc" mặc định. */}
          <div className="flex flex-col gap-2">
            {nhanO(t('Cách xử lý'))}
            <div role="radiogroup" aria-label={t('Cách xử lý')} className="grid grid-cols-2 gap-2 [@container(min-width:600px)]:grid-cols-4">
              {CACH.map((c) => (
                <button key={c.k} type="button" role="radio" aria-checked={cach === c.k} disabled={c.tat || busy} onClick={() => chonCach(c.k)}
                  className={`grid min-h-[68px] content-start gap-0.5 rounded-[10px] border px-3 pb-2.5 pt-2.5 text-left appearance-none disabled:cursor-not-allowed disabled:opacity-50 ${cach === c.k ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] shadow-[0_0_0_1px_var(--accent)]' : 'border-[color:var(--line-strong)] surface-2 hover:border-[color:var(--accent)]'}`}>
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <span aria-hidden className={`h-3.5 w-3.5 shrink-0 rounded-full border-[1.5px] ${cach === c.k ? 'border-[4px] border-[color:var(--accent)]' : 'border-[color:var(--o-vien,var(--line-strong))]'}`} />{c.ten}
                  </span>
                  <span className="pl-[22px] text-[13px] leading-snug text-slate-400">{c.phu}</span>
                  {c.k === 'nang' && <span className="ml-[22px] mt-1 justify-self-start rounded border px-[5px] text-[11px] font-semibold leading-4 text-slate-500" style={{ borderColor: 'var(--line-strong)' }}>{t('Mặc định')}</span>}
                </button>
              ))}
            </div>
            {d.chuoi.soXuLy === 0 && !d.khai && d.coTheKhai && onKhai && (
              <p className="m-0 text-xs text-slate-300">
                <button type="button" title={t('Đã có mức độ vi phạm từ trước?')} className="link inline-flex min-h-[44px] items-center appearance-none border-0 bg-transparent p-0 sm:min-h-0" onClick={() => onKhai(d.studentId)}>{t('Khai cấp bậc')}</button>
              </p>
            )}
          </div>
          {cach !== 'nang' && (
            <div className="flex flex-col gap-2">
              {cach !== 'giu' || chipCua.giu.length > 1 ? (
                <>
                  {nhanO(cach === 'vuot' ? t('Lên bậc') : cach === 'giu' ? t('Giữ bậc') : t('Loại'), true)}
                  <div className="flex flex-wrap gap-1.5" id={lf.oId('loai')}>
                    {chipCua[cach].map((k) => <NutChon key={k} chon={loai === k} onClick={() => setLoai(k)}>{tenBac(k)}</NutChon>)}
                  </div>
                </>
              ) : null}
              {lf.loiCua(loi, 'loai') && <p className="m-0 text-xs text-late">{lf.loiCua(loi, 'loai')}</p>}
              <OKhac hien={loai === 'other'} value={tenKhac} onChange={setTenKhac} goiY={t('Ví dụ: Gặp phụ huynh tại trung tâm')}
                id={lf.oId('ghi-ro')} onBlur={lf.roi('ghi-ro')} loi={lf.hien('ghi-ro') ? kiemGhiRoKhac(tenKhac) : null} />
              {/* Hậu quả đặt ngay dưới lựa chọn (chủ SP 12/11) — không chỉ bằng màu: có ⚠ + chữ. */}
              <p role="note" className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 rounded-lg border border-soon-line bg-soon-bg px-3 py-2.5 text-sm leading-snug text-slate-100">
                <span aria-hidden className="font-bold text-soon">⚠</span>
                <span><b className="font-semibold">{t('Khác mặc định → sẽ gửi QL duyệt.')}</b> {t('QL có 5 ngày (tới {ngay}); hết hạn giữ quyết định của bạn: {nhan}.', { ngay: ngay(hanQl, homNay), nhan: loai ? (loai === 'other' && tenKhac.trim() ? tenKhac.trim() : tenBac(loai)) : '—' })}
                  {' '}<NutLuat label={t('Sau khi chốt')}>{t('TVV nhận việc báo PH sau khi QL duyệt hoặc tự chốt. Bạn ghi "Đã thực hiện" sau khi chốt.')}</NutLuat></span>
              </p>
            </div>
          )}

          {cheDo === 'xu-ly' && (
            <Hang2>
              <Truong nhan={t('Ngày')} batBuoc>
                <ONgay kieu="ngay" value={ngayTh} onChange={setNgayTh} toiDa={homNay} />
              </Truong>
              <Truong nhan={t('Người')} batBuoc as="div" loi={lf.daBam ? loiNguoi : null}>
                <ChonNguoi nhom="nhan_vien" value={nguoi} onChange={setNguoi} studentId={studentId} />
              </Truong>
            </Hang2>
          )}
          <Truong nhan={cheDo === 'xu-ly' ? t('Mô tả') : t('Lý do')} batBuoc loi={lf.loiCua(loi, 'mo-ta')} dem={{ co: moTa.trim().length, can: MO_TA_MIN }}>
            <textarea className="field w-full" {...lf.o(loi, 'mo-ta')} rows={3} value={moTa} readOnly={busy} onChange={(e) => setMoTa(e.target.value)}
              placeholder={cheDo === 'xu-ly' ? t('Ví dụ: Đã đưa Report 1, nhắc em trước lớp')
                : t('Ví dụ: Vi phạm lần 4 sau WL 2, đã báo PH')} />
          </Truong>
          {/* [XM 5] / #6: bằng chứng chọn NGAY trong form — tải sau khi lưu / khi Gửi. Đề xuất loại ngoài thang: bắt buộc. */}
          <Truong nhan={t('Bằng chứng')} batBuoc={cheDo === 'de-xuat' && canTep(loai)} tuyChon={!(cheDo === 'de-xuat' && canTep(loai))} as="div" loi={lf.loiCua(loi, 'tep')}>
            <div id={lf.oId('tep')} tabIndex={-1}><TepCho value={tep} onChange={setTep} khoa={busy} /></div>
          </Truong>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="max-sm:hidden">{nutChinh}</span>
          </div>
        </CanLam>
        <BoiCanh dong={[
          [t('Lần trước'), truoc ? [dich(truoc.nhan), ngay(truoc.ngay, homNay), truoc.nguoi].filter(Boolean).join(' · ') : null],
          [t('Bậc tiếp theo'), cheDo === 'xu-ly' && bacSau ? dich(bacSau) : null],
        ]} />
      </div>
    </KhungPanel>
  );
}
