import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate, onInvalidate } from '../../lib/api.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { useLoiForm, type MucThieu } from '../../ui/loiForm.tsx';
import { WeekPicker } from '../../ui/Filters.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import {
  CHO_TAO_PRE_FOU, ENTRY_SKILLS, PROGRAMME_TEMPLATES, TOI_DA_DONG_TAO_LOP, thuTuKyHieu,
  chuanHoaMaLop, ghepMaLop, goiYSoTiep, gopLoiTheoDong, kiemPhanCong, kiemSoLop, kyHieuLop, locSoLop, oPhanCong, slotsTuO,
  themDongGiong, type LoiDong, type OPhanCong, type TruongDongTaoLop,
} from '@shared/domain/index.ts';

type Branch = { id: number; code: string; name: string; phanCong?: boolean };
type Programme = { code: string; skills: readonly string[] };
type GiaoVien = { id: number; name: string; classCount: number };
type O = TruongDongTaoLop | 'chung';
type LoiO = Partial<Record<O, string>>;

/** Một dòng lưới. `soTay` = người dùng đã gõ số → đổi chi nhánh/chương trình không gợi ý lại số. */
export type DongLuoi = {
  k: number; branchId: number | null; chuongTrinh: string; loTrinh: string; so: string; soTay: boolean;
  startPeriodId: number | null; chon: Record<string, number | ''>;
};
export type TrangThaiLuoi = { dong: DongLuoi[]; daSua: boolean };

let demKhoa = 0;
export function dongMoi(p: Partial<Omit<DongLuoi, 'k'>> = {}): DongLuoi {
  demKhoa += 1;
  return { branchId: null, chuongTrinh: 'FT', loTrinh: 'LT1', so: '', soTay: false, startPeriodId: null, chon: {}, ...p, k: demKhoa };
}

const NHAN_CT: Record<string, string> = { FT: 'Fast Track' };
/** OV-6b2: chương trình lớp thường đang dùng — đọc `/ref/programmes` (gồm mã Quản trị tạo: PET, KET…), xếp như tên lớp. */
export const chuongTrinhThuong = (ds: readonly { code: string }[] | null | undefined): string[] =>
  (ds ?? []).map((p) => p.code).filter((c) => c !== 'FT').sort((a, b) => thuTuKyHieu(kyHieuLop(a, null)) - thuTuKyHieu(kyHieuLop(b, null)) || a.localeCompare(b));
const ltCua = (d: DongLuoi) => (d.chuongTrinh === 'FT' ? d.loTrinh : null);
const tienToCua = (d: DongLuoi, cn: Branch | undefined) => (cn ? ghepMaLop(cn.code, d.chuongTrinh, ltCua(d), '').trim() : null);

/** Một GET cho mỗi chi nhánh có trong lưới (`/ref/classes`, `/ref/teachers`); lỗi (403…) → 'loi'. Bị vô hiệu thì tải lại. */
function useTheoChiNhanh<T>(goc: string, ids: (number | null)[]): Record<number, T | 'loi'> {
  const [kq, setKq] = useState<Record<number, T | 'loi'>>({});
  const daGoi = useRef(new Set<number>());
  const conMo = useRef(true);
  useEffect(() => { conMo.current = true; return () => { conMo.current = false; }; }, []);
  const [lan, setLan] = useState(0);
  useEffect(() => onInvalidate((p) => {
    if (p === null || goc.startsWith(p)) { daGoi.current.clear(); setLan((x) => x + 1); }
  }), [goc]);
  const khoa = [...new Set(ids.filter((x): x is number => x !== null))].sort().join(',');
  useEffect(() => {
    for (const id of khoa ? khoa.split(',').map(Number) : []) {
      if (daGoi.current.has(id)) continue;
      daGoi.current.add(id);
      api.get<T>(`${goc}?branchId=${id}`).then(
        (d) => { if (conMo.current) setKq((m) => ({ ...m, [id]: d })); },
        () => { if (conMo.current) setKq((m) => ({ ...m, [id]: 'loi' })); });
    }
  }, [goc, khoa, lan]);
  return kq;
}

/**
 * PR-QU (C) — TẠO NHIỀU LỚP MỘT LẦN trong panel "+ Lớp mới". Một lệnh `POST /classes/bulk`: tất cả hoặc không lớp nào.
 * "Kiểm tra" = `dryRun`, lỗi máy chủ gắn đúng ô của đúng dòng; lỗi phát hiện được ở web hiện trước, sau khi bấm. Khoá idempotency
 * một lần mở panel — bấm đúp / thử lại sau mất mạng không tạo trùng. Lỗi giữ nguyên lưới. 375px: mỗi dòng một thẻ dọc.
 */
export function LuoiTaoLop({ cheDo, luoi, setLuoi, branches, onClose }: {
  /** Nút chọn Một lớp / Nhiều lớp ở đầu thân. */
  cheDo: ReactNode;
  luoi: TrangThaiLuoi; setLuoi: (f: (l: TrangThaiLuoi) => TrangThaiLuoi) => void;
  /** Chỉ chi nhánh có `class.create` (`/ref/branches?muc=tao-lop`). */
  branches: Branch[];
  onClose: () => void;
}) {
  const toast = useToast();
  const routes = useApi<{ code: string; name: string }[]>('/ref/routes');
  const programmes = useApi<Programme[]>('/ref/programmes');
  const [khoaGui] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const dangGui = useRef(false);
  /* Cùng nhịp lỗi của mọi form (PR-N1): lỗi ô hiện sau lần bấm đầu. */
  const lf = useLoiForm();
  const daBam = lf.daBam;
  const [soThem, setSoThem] = useState(1);
  /** Lỗi máy chủ theo khoá dòng; sửa dòng nào thì bỏ lỗi máy chủ của dòng đó. */
  const [loiMayChu, setLoiMayChu] = useState<Record<number, LoiO>>({});
  const [kiemXong, setKiemXong] = useState<string | null>(null);

  const ds = luoi.dong;
  const cnCua = (d: DongLuoi) => branches.find((b) => b.id === d.branchId);
  const maCn = useTheoChiNhanh<{ code: string }[]>('/ref/classes', ds.map((d) => d.branchId));
  /* OV-13p: chỉ hỏi GV ở chi nhánh có `phanCong` (cờ máy chủ, `class.assign`) — TVV / CX không thấy ô phân công. */
  const gvCn = useTheoChiNhanh<GiaoVien[]>('/ref/teachers', ds.map((d) => (cnCua(d)?.phanCong ? d.branchId : null)));

  const kyNang = (ct: string): string[] => {
    if (ct === 'FT') return [...ENTRY_SKILLS];
    const p = (programmes.data ?? []).find((x) => x.code === ct) ?? (PROGRAMME_TEMPLATES as Record<string, Programme | undefined>)[ct];
    return [...(p?.skills ?? [])];
  };
  const oCua = (ct: string) => oPhanCong(ct, kyNang(ct), { tach: false });

  /* Gợi ý số cho dòng còn trống số (chưa gõ tay) khi đã có danh sách lớp của chi nhánh; điền lần lượt từ trên xuống. */
  useEffect(() => {
    const canDien = (d: DongLuoi) => !d.so && !d.soTay && d.branchId !== null && Array.isArray(maCn[d.branchId]) && !!cnCua(d);
    if (!ds.some(canDien)) return;
    setLuoi((l) => {
      const ra = l.dong.map((d) => ({ ...d }));
      for (const d of ra) {
        if (!canDien(d)) continue;
        const tt = tienToCua(d, cnCua(d))!;
        const khac = ra.filter((x) => x !== d && x.so && tienToCua(x, cnCua(x)) === tt).map((x) => x.so);
        d.so = goiYSoTiep((maCn[d.branchId!] as { code: string }[]).map((c) => c.code), khac, tt);
      }
      return { ...l, dong: ra };
    });
  }, [ds, maCn, branches]); // eslint-disable-line react-hooks/exhaustive-deps

  /* A2 §2.5: chỉ một chi nhánh → chọn sẵn (không tính là sửa). */
  useEffect(() => {
    if (branches.length === 1 && ds.some((d) => d.branchId === null)) {
      setLuoi((l) => ({ ...l, dong: l.dong.map((d) => (d.branchId === null ? { ...d, branchId: branches[0].id } : d)) }));
    }
  }, [branches, ds]); // eslint-disable-line react-hooks/exhaustive-deps

  const datDong = (f: (d: DongLuoi[]) => DongLuoi[], sua = true) => {
    setLuoi((l) => ({ dong: f(l.dong), daSua: l.daSua || sua }));
    if (sua) setKiemXong(null);
  };
  const sua = (k: number, p: Partial<DongLuoi>, laSua = true) => {
    datDong((dsCu) => dsCu.map((d) => {
      if (d.k !== k) return d;
      const moi = { ...d, ...p };
      /* Đổi chi nhánh / chương trình / lộ trình: số chưa gõ tay thì gợi ý lại; bỏ người ở ô không còn. */
      if (('branchId' in p || 'chuongTrinh' in p || 'loTrinh' in p) && !moi.soTay) moi.so = '';
      if ('chuongTrinh' in p) {
        const khoa = oCua(moi.chuongTrinh).map((o) => o.khoa);
        moi.chon = Object.fromEntries(Object.entries(moi.chon).filter(([x]) => khoa.includes(x)));
      }
      if ('branchId' in p) moi.chon = {};
      return moi;
    }), laSua);
    if (laSua) setLoiMayChu((m) => { const { [k]: _bo, ...con } = m; return con; });
  };
  const xoa = (k: number) => {
    datDong((d) => d.filter((x) => x.k !== k));
    setLoiMayChu((m) => { const { [k]: _bo, ...con } = m; return con; });
  };
  const conCho = TOI_DA_DONG_TAO_LOP - ds.length;
  const themGiong = () => {
    const n = Math.min(soThem, conCho);
    if (n <= 0) return;
    datDong((dsCu) => {
      const tren = dsCu[dsCu.length - 1];
      const tt = tienToCua(tren, cnCua(tren));
      const khac = dsCu.filter((x) => x !== tren && x.so && tienToCua(x, cnCua(x)) === tt).map((x) => x.so);
      /* Số dòng trên sai mẫu thì để trống cho máy gợi ý. */
      const goc = { ...tren, so: kiemSoLop(tren.so) ? '' : tren.so };
      const moi = goc.so ? themDongGiong(goc, n, khac) : Array.from({ length: n }, () => goc);
      return [...dsCu, ...moi.map((d) => dongMoi({ ...d, soTay: false, chon: { ...d.chon } }))];
    });
  };

  /* Lỗi phát hiện ở web: cùng luật máy chủ (số, tuần lớp thường, chi nhánh, phân công) + trùng tên với lớp đã có / dòng khác. */
  const daThay = new Map<string, number>();
  const tinh = ds.map((d, i) => {
    const cn = cnCua(d);
    const ma = cn && !kiemSoLop(d.so) ? ghepMaLop(cn.code, d.chuongTrinh, ltCua(d), d.so) : null;
    const oList = oCua(d.chuongTrinh);
    const coGv = d.branchId !== null && !!cn?.phanCong && Array.isArray(gvCn[d.branchId]);
    const slots = coGv ? slotsTuO(oList, d.chon) : [];
    const loiPc = kiemPhanCong(d.chuongTrinh, kyNang(d.chuongTrinh), slots);
    const loi: LoiO = {};
    if (!cn) loi.branchId = 'Chọn chi nhánh.';
    const loiSo = d.so ? kiemSoLop(d.so) : null;
    if (loiSo) loi.so = loiSo;
    else if (!d.so) loi.so = 'Chưa có số lớp.';
    if (ma) {
      const c = chuanHoaMaLop(ma);
      const ds0 = d.branchId !== null ? maCn[d.branchId] : undefined;
      if (Array.isArray(ds0) && ds0.some((l) => chuanHoaMaLop(l.code) === c)) loi.so = `Đã có lớp ${ma}.`;
      else if (daThay.has(c)) loi.so = `Trùng tên ${ma} với dòng ${daThay.get(c)}.`;
      else daThay.set(c, i + 1);
    }
    if (d.chuongTrinh !== 'FT' && !d.startPeriodId) loi.tuan = 'Chọn tuần khai giảng.';
    const loiO = (o: OPhanCong) => loiPc.find((l) => l.khoa === o.khoa || o.gop?.includes(l.khoa))?.lyDo ?? null;
    return { d, cn, ma, oList, coGv, slots, loi, loiPc, loiO, may: loiMayChu[d.k] ?? {} };
  });
  const soLoiWeb = tinh.reduce((n, t) => n + Object.keys(t.loi).length + t.loiPc.length, 0);
  const soLoiMay = tinh.reduce((n, t) => n + Object.keys(t.may).length, 0);
  const coLoi = soLoiWeb + soLoiMay > 0;
  const idO = (k: number, o: string) => `tl-${k}-${o}`;
  /* Lỗi ô hiện sau khi bấm Kiểm tra / Tạo; riêng số đã gõ và luật phân công hiện ngay (như form một lớp). */
  const hienLoi = (t: (typeof tinh)[number], o: O) => t.may[o] ?? ((daBam || (o === 'so' && t.d.so)) ? t.loi[o as TruongDongTaoLop] ?? null : null);

  const nhanTruong: Record<O, string> = {
    branchId: 'Chi nhánh', chuongTrinh: 'Chương trình', loTrinh: 'Lộ trình', so: 'Số lớp', tuan: 'Tuần khai giảng', slots: 'Phân công', chung: 'Dòng',
  };
  const conThieu: MucThieu[] | undefined = daBam
    ? tinh.flatMap((t, i) => [
      ...(Object.keys({ ...t.loi, ...t.may }) as O[]).map((o) => ({ nhan: `Dòng ${i + 1}: ${nhanTruong[o]}`, oId: idO(t.d.k, o) })),
      ...t.oList.filter((o) => t.loiO(o)).map((o) => ({ nhan: `Dòng ${i + 1}: ${o.nhan}`, oId: idO(t.d.k, o.khoa) })),
    ])
    : undefined;

  const anh = JSON.stringify(ds.map(({ k: _k, soTay: _s, ...r }) => r));
  const gui = async (dryRun: boolean) => {
    lf.bam();
    if (dangGui.current) return;
    if (soLoiWeb > 0) return;
    dangGui.current = true;
    setBusy(true);
    const khoaDong = ds.map((d) => d.k);
    const rows = tinh.map((t) => ({
      branchId: t.d.branchId, chuongTrinh: t.d.chuongTrinh, loTrinh: ltCua(t.d), so: t.d.so, startPeriodId: t.d.startPeriodId,
      ...(t.slots.length ? { slots: t.slots } : {}),
    }));
    try {
      const r = await api.post<{ ok: true; lop: { dong: number; id: number; code: string }[] } | { ok: false; loi: LoiDong[] }>(
        '/classes/bulk', { rows, idempotencyKey: khoaGui, dryRun });
      if (r.ok) {
        invalidate('/classes'); invalidate('/ref/classes'); invalidate('/hoc-vien-lop'); invalidate('/my-work');
        toast.push('ok', `Đã tạo ${r.lop.length} lớp`);
        onClose();
        return;
      }
      const theoDong = gopLoiTheoDong(r.loi);
      setLoiMayChu(Object.fromEntries(Object.entries(theoDong).map(([dong, l]) => [khoaDong[Number(dong) - 1], l])));
      if (r.loi.length) toast.push('error', `Còn ${r.loi.length} lỗi — sửa ở ô viền đỏ rồi bấm lại.`);
      else if (dryRun) setKiemXong(anh);
    } catch (e) {
      /* 403 cả lô (thiếu quyền một chi nhánh), mất mạng… — giữ nguyên lưới, bấm lại dùng cùng khoá. */
      toast.push('error', e instanceof Error ? e.message : 'Không gửi được — thử lại.');
    } finally { dangGui.current = false; setBusy(false); }
  };

  const nutChinh = (
    <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => void gui(false)}
      disabled={busy || (daBam && coLoi)}>{busy ? 'Đang gửi…' : `Tạo ${ds.length} lớp`}</button>
  );
  const nutKiem = (
    <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => void gui(true)} disabled={busy}>Kiểm tra</button>
  );

  return (
    <KhungPanel tieuDe="Tạo nhiều lớp" rong="toan" onDong={onClose}
      chan={{
        daSua: luoi.daSua, huy: { onClick: onClose, disabled: busy },
        phu: nutKiem, chinh: nutChinh, conThieu,
        dongTren: kiemXong === anh && !coLoi
          ? <div className="px-4 pt-2 text-right text-xs text-slate-400" role="status">Đã kiểm tra: tạo được cả {ds.length} lớp.</div>
          : null,
      }}>
      <div className="space-y-3 pt-3.5">
        {cheDo}
        <p className="m-0 text-xs text-slate-400">
          Tối đa {TOI_DA_DONG_TAO_LOP} lớp một lần. Tạo tất cả hoặc không lớp nào — một dòng lỗi thì chưa lớp nào được tạo.
        </p>
        <ol className="m-0 list-none space-y-2.5 p-0">
          {tinh.map((t, i) => (
            <DongThe key={t.d.k} t={t} i={i} soDong={ds.length} busy={busy} routes={routes.data ?? []} dsCt={['FT', ...chuongTrinhThuong(programmes.data)]} branches={branches}
              gv={t.d.branchId !== null ? gvCn[t.d.branchId] : undefined} hienLoi={(o) => hienLoi(t, o)} idO={(o) => idO(t.d.k, o)}
              sua={(p, laSua) => sua(t.d.k, p, laSua)} xoa={() => xoa(t.d.k)} />
          ))}
        </ol>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy || conCho <= 0} onClick={themGiong}>
            + Thêm {Math.min(soThem, Math.max(conCho, 1))} dòng giống dòng trên
          </button>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            Số dòng
            <select className="field w-16 tabular-nums" value={soThem} onChange={(e) => setSoThem(Number(e.target.value))} disabled={conCho <= 0}>
              {[1, 2, 3, 5, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          {conCho <= 0 && <span className="text-xs text-slate-500">Đã đủ {TOI_DA_DONG_TAO_LOP} dòng.</span>}
        </div>
      </div>
    </KhungPanel>
  );
}

/** Một dòng = một thẻ: điện thoại xếp dọc; màn rộng các ô nằm một hàng, phân công một hàng dưới. */
function DongThe({ t, i, soDong, busy, routes, dsCt, branches, gv, hienLoi, idO, sua, xoa }: {
  t: { d: DongLuoi; cn: Branch | undefined; ma: string | null; oList: OPhanCong[]; coGv: boolean; loiO: (o: OPhanCong) => string | null; may: LoiO };
  i: number; soDong: number; busy: boolean; routes: { code: string; name: string }[]; dsCt: string[]; branches: Branch[];
  gv: GiaoVien[] | 'loi' | undefined; hienLoi: (o: O) => string | null; idO: (o: string) => string;
  sua: (p: Partial<DongLuoi>, laSua?: boolean) => void; xoa: () => void;
}) {
  const { d } = t;
  const o = (k: O) => ({ id: idO(k), 'aria-invalid': !!hienLoi(k) || undefined });
  const ft = d.chuongTrinh === 'FT';
  const dsGv = Array.isArray(gv) ? gv : [];
  const dsChon = dsGv.map((g) => ({ id: g.id, ten: g.name, phu: g.classCount ? `${g.classCount} lớp` : undefined }));
  return (
    <li className={`rounded-lg border p-3 ${hienLoi('chung') ? 'border-late' : ''}`} style={hienLoi('chung') ? undefined : { borderColor: 'var(--line)' }}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400 tabular-nums">Dòng {i + 1}</span>
        <span className="min-w-0 flex-1 truncate text-sm tabular-nums" aria-live="polite">
          {t.ma
            ? <strong className="text-slate-100">{t.ma}</strong>
            : <span className="text-slate-500">{t.cn?.code ?? '…'} {kyHieuLop(d.chuongTrinh, ltCua(d))} …</span>}
        </span>
        <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" disabled={busy || soDong <= 1}
          onClick={xoa} aria-label={`Xoá dòng ${i + 1}`}>Xoá dòng</button>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(9rem,1.2fr)_8.5rem_6rem_6.5rem_minmax(17rem,2.2fr)]">
        <O1 nhan="Chi nhánh" batBuoc htmlFor={idO('branchId')} loi={hienLoi('branchId')}>
          <select className="field w-full" {...o('branchId')} value={d.branchId ?? ''}
            onChange={(e) => sua({ branchId: e.target.value ? Number(e.target.value) : null, chon: {} /* GV cũ không thuộc chi nhánh mới */ })}>
            <option value="">— Chọn —</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
          </select>
        </O1>
        <O1 nhan="Chương trình" htmlFor={idO('chuongTrinh')} loi={hienLoi('chuongTrinh')}>
          <select className="field w-full" {...o('chuongTrinh')} value={d.chuongTrinh}
            onChange={(e) => sua({ chuongTrinh: e.target.value })}>
            {dsCt.map((c) => (
              <option key={c} value={c} disabled={c === 'PREFOU' && !CHO_TAO_PRE_FOU}>{NHAN_CT[c] ?? kyHieuLop(c, null) ?? c}</option>
            ))}
          </select>
        </O1>
        {ft ? (
          <O1 nhan="Lộ trình" htmlFor={idO('loTrinh')} loi={hienLoi('loTrinh')}>
            <select className="field w-full" {...o('loTrinh')} value={d.loTrinh} onChange={(e) => sua({ loTrinh: e.target.value })}>
              {(routes.length ? routes : [{ code: d.loTrinh, name: d.loTrinh }]).map((r) => <option key={r.code} value={r.code} title={r.name}>{r.code}</option>)}
            </select>
          </O1>
        ) : <div className="hidden lg:block" aria-hidden />}
        <O1 nhan="Số lớp" batBuoc htmlFor={idO('so')} loi={hienLoi('so')}>
          <input className="field w-full tabular-nums" {...o('so')} inputMode="numeric" autoComplete="off" placeholder="Ví dụ: 05"
            value={d.so} onChange={(e) => sua({ so: locSoLop(e.target.value), soTay: true })} />
        </O1>
        <div className="sm:col-span-2 lg:col-span-1">
          <O1 nhan="Tuần khai giảng" batBuoc={!ft} loi={hienLoi('tuan')}>
            <div {...o('tuan')} tabIndex={-1}>
              {/* WeekPicker tự đặt tuần hiện tại khi còn trống — không tính là người dùng sửa. */}
              <WeekPicker periodId={d.startPeriodId} label={null} scope="planning"
                onPeriod={(id) => sua({ startPeriodId: id }, d.startPeriodId !== null)} />
            </div>
          </O1>
        </div>
      </div>
      {t.coGv && (
        <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" id={idO('slots')} tabIndex={-1}>
          {t.oList.map((x) => {
            const l = t.loiO(x);
            return (
              <O1 key={x.khoa} nhan={x.nhan} htmlFor={idO(x.khoa)} loi={l}>
                {/* PR-O-CHON: gõ tên rồi chọn ở danh sách bên dưới — đúng danh sách GV của chi nhánh dòng này. */}
                <ChonNguoi id={idO(x.khoa)} nhom="giao_vien" choToi={false} choNgoai={false} invalid={!!l}
                  ariaLabel={`${x.nhan}: chọn giáo viên`} choTrong="— Chưa chọn —" ds={dsChon}
                  value={(() => { const id = d.chon[x.khoa]; const g = id ? dsChon.find((z) => z.id === id) : undefined;
                    return id ? { kieu: 'tai_khoan' as const, id, ten: g?.ten ?? '…', phu: g?.phu } : null; })()}
                  onChange={(v) => sua({ chon: { ...d.chon, [x.khoa]: v?.kieu === 'tai_khoan' ? v.id : '' } })} />
              </O1>
            );
          })}
        </div>
      )}
      {hienLoi('slots') && <p className="m-0 mt-1 text-xs text-late">{hienLoi('slots')}</p>}
      {hienLoi('chung') && <p className="m-0 mt-1.5 text-xs text-late" id={idO('chung')} tabIndex={-1}>{hienLoi('chung')}</p>}
    </li>
  );
}

/** Ô nhỏ trong thẻ dòng: nhãn trên, lỗi một dòng dưới; có lỗi → viền đỏ (cùng kiểu `Truong`). */
function O1({ nhan, batBuoc, htmlFor, loi, children }: {
  nhan: string; batBuoc?: boolean; htmlFor?: string; loi?: string | null; children: ReactNode;
}) {
  const Nhan = htmlFor ? 'label' : 'span';
  return (
    <div className="min-w-0">
      <Nhan htmlFor={htmlFor} className="mb-1 block text-xs font-bold text-slate-300">
        {nhan}{batBuoc && <><span aria-hidden className="text-bad"> *</span><span className="sr-only"> (bắt buộc)</span></>}
      </Nhan>
      <div className={loi ? 'contents [&_.field]:border-late [&_.field]:ring-1 [&_.field]:ring-late/40' : 'contents'}>{children}</div>
      {loi && <span className="mt-1 block text-xs text-late">{loi}</span>}
    </div>
  );
}
