import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm, type MucThieu } from '../../ui/loiForm.tsx';
import { WeekPicker } from '../../ui/Filters.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { LuoiTaoLop, chuongTrinhThuong, dongMoi, type TrangThaiLuoi } from './LuoiTaoLop.tsx';
import {
  CHO_TAO_PRE_FOU, ENTRY_SKILLS, PROGRAMME_TEMPLATES,
  chonKhiDoiTach, chuanHoaMaLop, dsLoi, ghepMaLop, kiemPhanCong, kiemSoLop, kyHieuLop, kyNangGoiY, locSoLop, nhanDayDuoc, oPhanCong, slotsTuO,
  type LoiPhanCong, type LoiTruong, type NguoiChon, type OPhanCong,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

type Branch = { id: number; code: string; name: string; phanCong?: boolean };
type Programme = {
  code: string; name: string; weeks: number | null; skills: readonly string[]; checkpoints: readonly { kind: string; studyWeek: number }[];
  /** OV-6b2: liên tục — Checkpoint mỗi n tuần. */
  lapMoiTuan?: number | null;
};
type Kieu = 'FT' | 'THUONG';

/**
 * TẠO LỚP MỚI (PR-LOP, mockup 21 mục 1–3) — MỘT lệnh `POST /classes` tạo lớp + phân công cùng giao dịch (YC-1).
 * Tên lớp do máy ghép `{CN} {ký hiệu} {số}`: người dùng chỉ chọn kiểu lớp/lộ trình/chương trình và gõ số (T1).
 * Mỗi ô phân công MỘT người (YC-4); lỗi luật phân công hiện ngay tại ô và khoá nút Tạo lớp (Q2) — cùng hàm máy chủ kiểm.
 * Lỗi ô thường theo PR-N1 (YC-12.5.2, `useLoiForm`): hiện khi rời ô / sau khi bấm; chân một dòng xám `n ô cần sửa ↑`.
 * PR-QU (C): "Nhiều lớp" = lưới `LuoiTaoLop` (một lớp là trường hợp riêng); chỉ hiện khi mở từ "+ Lớp mới" (không `macDinh`).
 */
export function ClassCreatePanel({ onClose, onDone, macDinh, moHoSo, khoa }: {
  onClose: () => void;
  /** P9b (trang Cuối khoá, "+ Mở lớp mới…"): chương trình (suy từ hướng) + chi nhánh (lớp nguồn) khoá theo `macDinh`; `khoa` = ngữ cảnh dưới tiêu đề. */
  khoa?: string;
  onDone?: (lop: { id: number; code: string }) => void;
  macDinh?: { branchId?: number; chuongTrinh?: string; loTrinh?: string | null; so?: string; startPeriodId?: number | null; previousClassId?: number };
  /** Mặc định true: tạo xong mở hồ sơ lớp. Chuyển tiếp truyền false. */
  moHoSo?: boolean;
}) {
  const toast = useToast();
  const navigate = useNavigate();
  /* PR-QU (B): chỉ chi nhánh người này có `class.create`. */
  const branches = useApi<Branch[]>('/ref/branches?muc=tao-lop');
  const routes = useApi<{ code: string; name: string }[]>('/ref/routes');
  const programmes = useApi<Programme[]>('/ref/programmes');

  const [branchId, setBranchId] = useState<number | null>(macDinh?.branchId ?? null);
  const [kieu, setKieu] = useState<Kieu>(macDinh?.chuongTrinh && macDinh.chuongTrinh !== 'FT' ? 'THUONG' : 'FT');
  const [loTrinh, setLoTrinh] = useState(macDinh?.loTrinh ?? 'LT1');
  const [chuongTrinh, setChuongTrinh] = useState(macDinh?.chuongTrinh && macDinh.chuongTrinh !== 'FT' ? macDinh.chuongTrinh : 'FOU');
  const [so, setSo] = useState(locSoLop(macDinh?.so ?? ''));
  const [startPeriodId, setStartPeriodId] = useState<number | null>(macDinh?.startPeriodId ?? null);
  const [chon, setChon] = useState<Record<string, number | ''>>({});
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  const [cheDo, setCheDo] = useState<'mot' | 'nhieu'>('mot');
  /* Lưới giữ ở đây: đổi qua lại Một lớp / Nhiều lớp không mất dòng đang soạn. */
  const [luoi, setLuoi] = useState<TrangThaiLuoi | null>(null);

  const lopDaCo = useApi<{ code: string }[]>(branchId ? `/ref/classes?branchId=${branchId}` : null, [branchId]);

  /* A2 §2.5: người tạo chỉ có một chi nhánh → chọn sẵn. */
  const dsCn = branches.data ?? [];
  useEffect(() => { if (branchId === null && dsCn.length === 1) setBranchId(dsCn[0].id); }, [branches.data, branchId]); // eslint-disable-line react-hooks/exhaustive-deps
  const branch = dsCn.find((b) => b.id === branchId) ?? null;
  /* OV-13p: khối Phân công theo cờ máy chủ `phanCong` (`class.assign` ở chi nhánh) — TVV / CX, GV được cấp riêng `class.create` không có. */
  const ganDuoc = !!branch?.phanCong;
  const teachers = useApi<{ id: number; name: string; classCount: number; skills?: string[] }[]>(
    ganDuoc && branchId ? `/ref/teachers?branchId=${branchId}` : null, [branchId, ganDuoc]);

  const ct = kieu === 'FT' ? 'FT' : chuongTrinh;
  const lt = kieu === 'FT' ? loTrinh : null;
  const prog = (programmes.data ?? []).find((p) => p.code === ct);
  const mau = prog ?? (PROGRAMME_TEMPLATES as Record<string, Programme | undefined>)[ct];
  const kyNang: string[] = ct === 'FT' ? [...ENTRY_SKILLS] : [...(mau?.skills ?? [])];
  const fou = useTachFou(ct, kyNang, chon, setChon);
  const oList = fou.oList;
  const khoaO = oList.map((o) => o.khoa).join('|');
  /* Đổi kiểu lớp/chương trình → bỏ chọn của ô không còn. */
  useEffect(() => {
    setChon((c) => Object.fromEntries(Object.entries(c).filter(([k]) => khoaO.split('|').includes(k))));
  }, [khoaO]);
  const slots = ganDuoc ? slotsTuO(oList, chon) : [];

  const ma = branch && !kiemSoLop(so) ? ghepMaLop(branch.code, ct, lt, so) : null;
  const trung = !!ma && (lopDaCo.data ?? []).some((l) => chuanHoaMaLop(l.code) === chuanHoaMaLop(ma));
  const loiPc = kiemPhanCong(ct, kyNang, slots);
  const loiPcO = (khoa: string) => loiTaiO(loiPc, oList, khoa);

  /* Lỗi ô thường: hiện khi rời ô / sau khi bấm Tạo lớp; riêng số sai mẫu / trùng tên hiện ngay khi đã gõ. */
  const kiemSo = kiemSoLop(so);
  const loiSo = kiemSo ? dich(kiemSo) : trung ? t('Đã có lớp {ma}', { ma }) : null;
  const loi: LoiTruong[] = [
    ...dsLoi([{ khoa: 'chi-nhanh', nhan: t('Chi nhánh'), chon: true }], { 'chi-nhanh': branchId }),
    ...(loiSo ? [{ khoa: 'so', nhan: t('Số lớp'), lyDo: loiSo }] : []),
    ...dsLoi(kieu === 'THUONG' ? [{ khoa: 'tuan', nhan: t('Tuần khai giảng'), chon: true }] : [], { tuan: startPeriodId }),
  ];
  const loiHien = (khoa: string) => (khoa === 'so' && so !== '' ? loiSo : lf.loiCua(loi, khoa));
  const o = (khoa: string) => ({ ...lf.o(loi, khoa), 'aria-invalid': !!loiHien(khoa) });
  /* Chân: ô thường sau khi bấm; lỗi LUẬT phân công (ô đã chọn, sai luật) tính ngay — hiện tại ô + khoá nút (Q2). */
  const conThieu: MucThieu[] = [
    ...(lf.conThieu(loi) ?? []), ...oList.filter((x) => loiPcO(x.khoa)).map((x) => ({ nhan: x.nhan, oId: lf.oId(x.khoa) })),
  ];

  const moc = (k: string) => mau?.checkpoints.find((c) => c.kind === k)?.studyWeek;
  const lopSeCo = ct === 'FT'
    ? t('Lịch MT theo từng HV')
    : prog?.lapMoiTuan ? t('Liên tục · Checkpoint mỗi {n} tuần', { n: prog.lapMoiTuan })
    : [mau?.weeks && t('{n} tuần', { n: mau.weeks }), moc('progress') && t('Progress Test tuần {n}', { n: moc('progress') }), moc('final') && t('Final Test tuần {n}', { n: moc('final') })]
      .filter(Boolean).join(' · ');

  const tao = async () => {
    lf.bam();
    if (loi.length || loiPc.length) return;
    setBusy(true);
    try {
      const r = await api.post<{ id: number; code: string }>('/classes', {
        branchId, chuongTrinh: ct, loTrinh: lt, so, startPeriodId, slots, previousClassId: macDinh?.previousClassId,
      });
      invalidate('/classes'); invalidate('/ref/classes'); invalidate('/hoc-vien-lop'); invalidate('/my-work');
      toast.push('ok', t('Đã tạo lớp {code}', { code: r.code }));
      onDone?.(r);
      if (moHoSo !== false) navigate(`/hoc-vien/lop/${r.id}`); else onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };


  const nutCheDo = macDinh ? null : (
    <PhanDoan nhan={t('Số lớp tạo')} giaTri={cheDo} muc={[{ v: 'mot', nhan: t('Một lớp') }, { v: 'nhieu', nhan: t('Nhiều lớp') }]}
      onChon={(v) => {
        /* Lần đầu sang Nhiều lớp: dòng 1 lấy theo form một lớp. */
        if (v === 'nhieu' && !luoi) {
          setLuoi({ daSua: false, dong: [dongMoi({ branchId, chuongTrinh: ct, loTrinh, so, soTay: so !== '', startPeriodId })] });
        }
        setCheDo(v as 'mot' | 'nhieu');
      }} />
  );
  if (cheDo === 'nhieu' && luoi) {
    return (
      <LuoiTaoLop cheDo={nutCheDo} luoi={luoi} branches={dsCn} onClose={onClose}
        setLuoi={(f) => setLuoi((l) => (l ? f(l) : l))} />
    );
  }

  const loiPcDau = loiPc[0] ? `${oList.find((o) => o.khoa === loiPc[0].khoa || o.gop?.includes(loiPc[0].khoa))?.nhan ?? ''}: ${dich(loiPc[0].lyDo)}` : undefined;

  return (
    <KhungPanel tieuDe={khoa ? t('Mở lớp mới') : t('Tạo lớp mới')} ngCanh={khoa} longTrong={!!khoa} onDong={onClose}
      chan={{
        /* 6c (lỗi 5): số lớp đã gõ hoặc GV đã chọn chưa tạo lớp → ✕ hỏi. */
        daSua: so !== locSoLop(macDinh?.so ?? '') || Object.values(chon).some((v) => v !== ''),
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={tao}
            disabled={busy || loiPc.length > 0} title={loiPcDau}>{khoa ? t('Mở lớp') : t('Tạo lớp')}</button>
        ),
        conThieu,
      }}>
      <div className="space-y-3 pt-3.5">
        {nutCheDo}
        {khoa ? (
          <div className="grid grid-cols-2 gap-2.5">
            <Truong nhan={t('Chương trình')}><input className="field w-full" value={kieu === 'FT' ? 'Fast Track' : kyHieuLop(ct, lt) ?? ct} disabled /></Truong>
            <Truong nhan={t('Chi nhánh')}><input className="field w-full" value={branch?.name ?? '…'} disabled /></Truong>
            {kieu === 'FT' && (
              <div className="col-span-2"><Truong nhan={t('Lộ trình')} as="div">
                <PhanDoan nhan={t('Lộ trình')} giaTri={loTrinh} onChon={setLoTrinh} muc={(routes.data ?? []).map((r) => ({ v: r.code, nhan: r.code, title: r.name }))} />
              </Truong></div>
            )}
          </div>
        ) : <>
        <Truong nhan={t('Chi nhánh')} batBuoc loi={loiHien('chi-nhanh')}>
          <select className="field w-full" {...o('chi-nhanh')} value={branchId ?? ''}
            onChange={(e) => { setBranchId(e.target.value ? Number(e.target.value) : null); setChon({}); }}>
            <option value="">{t('— Chọn chi nhánh —')}</option>
            {dsCn.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
          </select>
        </Truong>

        <Truong nhan={t('Kiểu lớp')} as="div">
          <PhanDoan nhan={t('Kiểu lớp')} giaTri={kieu} onChon={(v) => setKieu(v as Kieu)}
            muc={[{ v: 'FT', nhan: 'Fast Track' }, { v: 'THUONG', nhan: t('Lớp thường') }]} />
        </Truong>

        {kieu === 'FT' ? (
          <Truong nhan={t('Lộ trình')} as="div">
            <PhanDoan nhan={t('Lộ trình')} giaTri={loTrinh} onChon={setLoTrinh}
              muc={(routes.data ?? []).map((r) => ({ v: r.code, nhan: r.code, title: r.name }))} />
          </Truong>
        ) : (
          <Truong nhan={t('Chương trình')} as="div" phu={CHO_TAO_PRE_FOU ? undefined : t('Mở cùng đợt cập nhật hệ môn học')}>
            <PhanDoan nhan={t('Chương trình')} giaTri={chuongTrinh} onChon={setChuongTrinh}
              muc={chuongTrinhThuong(programmes.data).map((c) => ({
                v: c, nhan: kyHieuLop(c, null) ?? c, tat: c === 'PREFOU' && !CHO_TAO_PRE_FOU,
                title: c === 'PREFOU' && !CHO_TAO_PRE_FOU ? t('Mở cùng đợt cập nhật hệ môn học') : undefined,
              }))} />
          </Truong>
        )}
        </>}

        <div>
          <Truong nhan={t('Số lớp')} batBuoc phu={t('1–4 chữ số, được thêm một chữ cái cuối (101A)')} loi={loiHien('so')}>
            <input className="field w-28 tabular-nums" {...o('so')} inputMode="numeric" autoComplete="off"
              value={so} onChange={(e) => setSo(locSoLop(e.target.value))} />
          </Truong>
          <p className="m-0 mt-2 text-sm tabular-nums" aria-live="polite">
            {ma
              ? <>{t('Lớp sẽ là')} <strong className="text-slate-100">{ma}</strong></>
              : <span className="text-slate-500">{t('Lớp sẽ là')} {branch?.code ?? '…'} {kyHieuLop(ct, lt)} …</span>}
          </p>
        </div>

        <Truong nhan={t('Tuần khai giảng')} as="div" batBuoc={kieu === 'THUONG'} loi={loiHien('tuan')}>
          <div {...o('tuan')}><WeekPicker periodId={startPeriodId} label={null} scope="planning" onPeriod={setStartPeriodId} /></div>
        </Truong>
        {lopSeCo && <p className="m-0 text-xs text-slate-400 tabular-nums">{t('Lớp này sẽ có: {x}', { x: lopSeCo })}</p>}
      </div>

      {ganDuoc && <Khoi tieuDe={t('Phân công')}>
        <LuoiPhanCong oList={oList} chon={chon} nguoi={teachers.data ?? []} loi={loiPcO} oId={lf.oId} chuongTrinh={ct}
          onChon={(khoa, v) => setChon((c) => ({ ...c, [khoa]: v }))} />
        <NutTachFou fou={fou} />
        <p className="m-0 text-xs text-slate-500">
          {oList.length === 1
            ? t('Lớp Pre FOU không chia môn — GVCN dạy luôn.')
            : t('Mỗi ô một người. Một người nhận nhiều ô được. Thiếu ô nào vẫn tạo được lớp — bổ sung ở hồ sơ lớp.')}
        </p>
      </Khoi>}
    </KhungPanel>
  );
}

/** Lỗi luật phân công của một ô; ô gộp (FOU "L · R · G+V") nhận lỗi của môn nó chứa. */
export function loiTaiO(loiPc: readonly LoiPhanCong[], oList: readonly OPhanCong[], khoa: string): string | null {
  const gop = oList.find((o) => o.khoa === khoa)?.gop ?? [];
  return loiPc.find((l) => l.khoa === khoa || gop.includes(l.khoa))?.lyDo ?? null;
}

/**
 * Q31-5 — lớp FOU mặc định 2 ô môn "L · R · G+V" và "P"; "Tách từng môn" ra 4 ô (người đã chọn đi theo). Gộp lại chỉ được khi L, R, G+V
 * cùng một người (hoặc trống). `gop` null = chương trình không có ô gộp (không hiện nút).
 */
export function useTachFou(ct: string | null, kyNang: readonly string[], chon: Record<string, number | ''>,
  setChon: (f: (c: Record<string, number | ''>) => Record<string, number | ''>) => void) {
  const [tach, setTach] = useState(false);
  const gop = oPhanCong(ct, kyNang, { tach: false }).find((o) => o.gop)?.gop ?? null;
  const coTheGop = !!gop && new Set(gop.map((k) => chon[k]).filter(Boolean)).size <= 1;
  return {
    oList: oPhanCong(ct, kyNang, { tach }), tach, gop, coTheGop, setTach,
    doi: () => { if (gop) setChon((c) => chonKhiDoiTach(c, gop, !tach)); setTach(!tach); },
  };
}

/** Link nhỏ dưới lưới phân công lớp FOU: "Tách từng môn" / "Gộp L · R · G+V" + câu dẫn hai giáo viên (Q31-5). */
export function NutTachFou({ fou, chiXem }: { fou: ReturnType<typeof useTachFou>; chiXem?: boolean }) {
  if (!fou.gop) return null;
  const tat = fou.tach && !fou.coTheGop;
  return (
    <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
      <span>{t('Lớp FOU thường có hai giáo viên: một người L · R · G+V, một người P.')}</span>
      {!chiXem && (
        <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-xs disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0"
          disabled={tat} title={tat ? t('L, R, G+V đang do nhiều người dạy') : undefined} onClick={fou.doi}>
          {fou.tach ? t('Gộp L · R · G+V') : t('Tách từng môn')}
        </button>
      )}
    </div>
  );
}

/**
 * Lưới ô phân công (mockup 21 mục 1, 4) — Tạo lớp và Sửa phân công dùng chung: nhãn trái cùng bề rộng, mỗi ô MỘT người,
 * lỗi một dòng dưới ô. `nhanTrong` thay chữ mục rỗng (dữ liệu cũ nhiều người một ô hiện cả tên).
 * PR-O-CHON (chủ sản phẩm 07/10): ô là `ChonNguoi` kiểu `ds` — gõ tên rồi chọn ở danh sách bên dưới, đúng danh sách `nguoi`.
 */
export function LuoiPhanCong({ oList, chon, onChon, nguoi, loi, oId, nhanTrong, chiXem, chuongTrinh = null }: {
  oList: OPhanCong[]; chon: Record<string, number | ''>; onChon: (khoa: string, v: number | '') => void; oId: (khoa: string) => string;
  nguoi: { id: number; name: string; classCount: number; skills?: string[] }[];
  loi: (khoa: string) => string | null; nhanTrong?: (khoa: string) => string | undefined; chiXem?: boolean;
  /** Mã chương trình lớp — gợi ý theo `kyNangGoiY` (ô W/G+V → người khai W1/W2; ô P → S). */
  chuongTrinh?: string | null;
}) {
  /* MH6, T55, Q7: GỢI Ý = người khai kỹ năng hợp ô đứng trước + dòng phụ "dạy được …"; KHÔNG tự điền. Ô GVCN không gợi ý. */
  const hop = (o: OPhanCong, t: { skills?: string[] }) => {
    /* Ô gộp FOU: người khai MỘT trong L / R / W1 / W2 là gợi ý (Q31-5). */
    const can = (o.gop ?? (o.skill ? [o.skill] : [])).flatMap((k) => kyNangGoiY(chuongTrinh, k));
    return (t.skills ?? []).filter((k) => can.includes(k));
  };
  const xep = (o: OPhanCong) => [...nguoi].sort((a, b) => Number(hop(o, b).length > 0) - Number(hop(o, a).length > 0));
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-x-2.5 gap-y-1.5">
      {oList.map((o) => {
        const l = loi(o.khoa);
        return (
          <div key={o.khoa} className="contents">
            <label htmlFor={oId(o.khoa)} className="pt-3 text-xs font-bold text-slate-200 max-sm:pt-4">{o.nhan}</label>
            <ChonNguoi id={oId(o.khoa)} nhom="giao_vien" choToi={false} choNgoai={false} disabled={chiXem} invalid={!!l}
              ariaLabel={t('{nhan}: chọn giáo viên', { nhan: o.nhan })} choTrong={t('— Chưa chọn —')} macDinhTrong={nhanTrong?.(o.khoa)}
              ds={xep(o).map((t) => ({ id: t.id, ten: t.name, phu: phuGv(t, nhanDayDuoc(chuongTrinh, o, t.skills ?? [])) }))}
              value={chonNguoi(chon[o.khoa], nguoi, (t) => phuGv(t, nhanDayDuoc(chuongTrinh, o, t.skills ?? [])))}
              onChange={(v) => onChon(o.khoa, v?.kieu === 'tai_khoan' ? v.id : '')} />
            {l && <span className="col-start-2 -mt-0.5 text-xs text-late">{dich(l)}</span>}
          </div>
        );
      })}
    </div>
  );
}

/** Dòng phụ một GV trong ô phân công: `3 lớp · dạy được L, R` (PR-S6F-a: tên môn theo chương trình lớp, không mã FT). */
export function phuGv(gv: { classCount: number }, dayDuoc: string[] = []): string {
  return [gv.classCount ? t('{n} lớp', { n: gv.classCount }) : '', dayDuoc.length ? t('dạy được {ds}', { ds: dayDuoc.join(', ') }) : ''].filter(Boolean).join(' · ');
}

/** Giá trị ô `ChonNguoi` từ id đã chọn; id không có trong danh sách (đang tải) hiện "…". */
export function chonNguoi<T extends { id: number; name: string }>(id: number | '' | undefined, ds: T[], phu: (t: T) => string): NguoiChon | null {
  if (!id) return null;
  const t = ds.find((x) => x.id === id);
  return { kieu: 'tai_khoan', id, ten: t?.name ?? '…', phu: t ? phu(t) : undefined };
}

/** Một hàng lựa chọn trong form: `NutChon` (đang chọn nền nhấn nhạt + viền nhấn + ✓, không `btn-primary` — B3, Q19). */
export function PhanDoan({ nhan, giaTri, onChon, muc }: {
  nhan: string; giaTri: string; onChon: (v: string) => void;
  muc: { v: string; nhan: string; tat?: boolean; title?: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={nhan}>
      {muc.map((m) => (
        <NutChon key={m.v} nho chon={m.v === giaTri} disabled={m.tat} title={m.title} className="disabled:opacity-40"
          onClick={() => onChon(m.v)}>{m.nhan}</NutChon>
      ))}
    </div>
  );
}
