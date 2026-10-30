import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { taoLuot } from '../../lib/luuChac.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { ErrorState, NutChon, Skeleton, Th } from '../../ui/ui.tsx';
import { NutMon } from '../../ui/NutMon.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { KCK, chuMon, LIEN_HE_TOI_DA, NHAN_LIEN_HE, QUAN_HE_GOI_Y, TRUONG_LIEN_HE, chiaLoSuaCaLop, chuTargetKck, chuanOTarget, kyThiCuaChuongTrinh, tachKck, type KyThi, type VanDeNhap } from '@shared/domain/index.ts';
import { ChonNguoi, type NguoiTrongDs } from '../../ui/PeoplePicker.tsx';
import { dich, t } from '@shared/i18n/index.ts';

type Cot = 'fullName' | 'dob' | 'email' | 'consultantUserId' | 'phone' | 'parentName' | 'parentRelation' | 'parentPhone' | 'startWeek' | 'examDate' | 'target' | 'baseline' | 'monDangKy';
type DongGoc = {
  studentId: number; fullName: string; dob: string | null; email: string | null; coLoTrinh: boolean;
  /** PR-OV2b: TVV = người; `consultantName` = chữ cũ, chỉ để đọc. */
  consultantUserId: number | null; consultantName: string | null;
  startWeek: string | null; examDate: string | null; target: number | string | null; baseline: number | null;
  phone: string | null; parentName: string | null; parentRelation: string | null; parentPhone: string | null;
  /** P8 (N13, N22 ④): môn đăng ký — chỉ lộ trình FT (`laFt`); null = đủ môn. */
  laFt?: boolean; monDangKy?: string[] | null;
};
/** `nhapLienHe` (OV-10b): cột Liên hệ — QL / Quản trị; GVCN không thấy (chủ SP 13/10). */
/** `chiThongTin` (OV-13i): TVV / CX — cột Tuần bắt đầu khoá (ngoài `CHI_SUA_THONG_TIN`). */
type DuLieu = { lop: { id: number; code: string }; lopThuong: boolean; kyThi?: KyThi | null; coTheSuaTarget: boolean; chiThongTin: boolean; nhapLienHe: boolean; rows: DongGoc[]; tvv: NguoiTrongDs[]; coMonHoc?: boolean; coTheDoiMon?: boolean };
type XemTruoc = { rows: { studentId: number; issues: VanDeNhap[] }[]; canhBaoMt: { studentId: number; cau: string }[]; monHoc?: { studentId: number; dong: string[] }[] };

const COT: { key: Cot; nhan: string; rong: number; so?: boolean }[] = [
  { key: 'fullName', nhan: t('Họ và tên'), rong: 210 },
  /* P8 (mockup k5): Môn học ngay sau tên — thấy được không cần cuộn ngang. */
  { key: 'monDangKy', nhan: t('Môn học'), rong: 300 },
  { key: 'dob', nhan: t('Ngày sinh'), rong: 190 },
  { key: 'email', nhan: 'Email', rong: 250 }, { key: 'consultantUserId', nhan: 'TVV', rong: 210 },
  { key: 'phone', nhan: dich(NHAN_LIEN_HE.phone), rong: 150 }, { key: 'parentName', nhan: dich(NHAN_LIEN_HE.parentName), rong: 190 },
  { key: 'parentRelation', nhan: dich(NHAN_LIEN_HE.parentRelation), rong: 110 }, { key: 'parentPhone', nhan: dich(NHAN_LIEN_HE.parentPhone), rong: 150 },
  { key: 'startWeek', nhan: t('Tuần bắt đầu học'), rong: 172 },
  { key: 'examDate', nhan: t('Dự kiến thi'), rong: 190 }, { key: 'target', nhan: 'Target', rong: 100, so: true },
  { key: 'baseline', nhan: t('Điểm đầu vào'), rong: 112, so: true },
];
/* Mockup 05/10: cột đủ cho ô đã sửa có ↺ (không cắt chữ). PR-OV2b thêm cột TVV → bảng rộng hơn panel 1440 thì cuộn ngang trong khung bảng. */
const RONG_LUU_Y = 150;
/* Ô lộ trình (tuần, dự kiến thi, Target, điểm đầu vào): em chưa có lộ trình thì không sửa được ở đây. */
const O_LO_TRINH = new Set<Cot>(['startWeek', 'examDate', 'target', 'baseline', 'monDangKy']);
/* P8: ô Môn học giữ dạng chữ như mọi ô của lưới — '' = đủ môn, còn lại JSON mảng ('[]' = tắt hết → máy chủ báo lỗi tại ô). */
const chuMonO = (v: readonly string[] | null) => (v === null ? '' : JSON.stringify(v));
const monCuaO = (v: string): string[] | null => (v ? JSON.parse(v) : null);
const moiKhoa = () => `suacalop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const chuGoc = (d: DongGoc, k: Cot) => (k === 'monDangKy' ? chuMonO(d.monDangKy ?? null) : d[k] === null || d[k] === undefined ? '' : String(d[k]));
/** Ô số (Target, điểm đầu vào) nhận dấu phẩy; "6,50" = "6.5" (không tính là đã sửa). OV-9: Target "6,5 kck" = "6.5 KCK". */
const chuan = (k: Cot, v: string) => {
  const t = v.trim();
  if ((k !== 'target' && k !== 'baseline') || !t) return t;
  const { so, kck } = k === 'target' ? tachKck(t) : { so: t, kck: false };
  const s = String(so ?? '');
  const n = Number(s.replace(',', '.'));
  const goc = s && Number.isFinite(n) ? String(n) : s;
  return kck ? chuTargetKck(goc || null, true) : goc;
};

/**
 * PR-SL (Q-0310-3): SỬA THÔNG TIN CẢ LỚP trên một panel — lưới giống Thêm học viên, KHÔNG dán Excel. Một hàng một em đang học (A→Z),
 * tám ô: Họ tên · Ngày sinh · Email · TVV (chọn người, PR-OV2b) · Tuần bắt đầu · Dự kiến thi · Target · Điểm đầu vào (lớp thường không có điểm đầu vào — `lopThuong`).
 * Ô đã đổi tô nhấn + chấm, mỗi ô có Hoàn tác về giá trị gốc. Xem trước tự động (400 ms) → lỗi đỏ dưới ô, cảnh báo MT dời vàng cuối hàng.
 * Một nút Lưu, gửi THEO LÔ `LO_LUU_SUA_CA_LOP` em (mỗi lô một request, một giao dịch, một khoá chống gửi trùng — 10 s của Netlify).
 * Lô lỗi thì dừng: chân panel "Đã lưu n em · m em chưa lưu"; em đã lưu thôi tô nhấn, em chưa lưu giữ nguyên để bấm Lưu lại.
 * Đổi Target → một ô lý do chung. Đóng khi đang sửa → hỏi trước (chống mất dữ liệu). Mockup `thiet-ke/mockup-sua-thong-tin-hoc-vien-2026-10-05.html`.
 */
export function SuaCaLopPanel({ classId, onClose, onDone }: { classId: number; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const du = useApi<DuLieu>(`/classes/${classId}/sua-ca-lop`, [classId]);
  /** Chữ đã sửa theo em → ô. Ô không có trong đây = giữ giá trị gốc. */
  const [sua, setSua] = useState<Record<number, Partial<Record<Cot, string>>>>({});
  const [lyDo, setLyDo] = useState('');
  const [xem, setXem] = useState<XemTruoc | null>(null);
  const [busy, setBusy] = useState(false);
  /** Tiến độ khi đang lưu theo lô: đã lưu / tổng số em. */
  const [tienDo, setTienDo] = useState<{ xong: number; tong: number } | null>(null);
  /** Lưu dở: em đã lưu (giá trị đã ghi → làm gốc mới) và câu báo ở chân panel. */
  const [luuRoi, setLuuRoi] = useState<Record<number, Partial<Record<Cot, string>>>>({});
  const [luuDo, setLuuDo] = useState<{ cau: string; lyDo: string } | null>(null);
  const [hoiDong, setHoiDong] = useState(false);
  /* P8 (mockup k5): chọn em → "Áp cho n em" một bộ môn (chỉ em lộ trình FT); ô từng em vẫn bật / tắt riêng. */
  const [chon, setChon] = useState<Set<number>>(new Set());
  const [apMon, setApMon] = useState<string[] | null>(null);
  const lf = useLoiForm();
  const khoa = useRef(moiKhoa());
  const batLuotXem = useRef(taoLuot()).current;

  const d = du.data;
  const cot = COT.filter((c) => !(d?.lopThuong && c.key === 'baseline') && (d?.coMonHoc || c.key !== 'monDangKy') && (d?.nhapLienHe || !(TRUONG_LIEN_HE as readonly string[]).includes(c.key)));
  const goc = useMemo(() => new Map((d?.rows ?? []).map((r) => [r.studentId, r])), [d]);
  /** Cả cột khoá theo vai — máy chủ kiểm lại (`duocDoiTarget`, `CHI_SUA_THONG_TIN`). */
  const khoaCot = (k: Cot) => (k === 'target' && !d?.coTheSuaTarget ? t('Chỉ Quản lý, TVV hoặc CX đổi Target')
    : k === 'startWeek' && d?.chiThongTin ? t('Chỉ Quản lý hoặc GVCN sửa Tuần bắt đầu')
    : k === 'monDangKy' && !d?.coTheDoiMon ? t('Chỉ Quản lý, GVCN hoặc TVV đổi Môn học') : null);

  /** Giá trị gốc của ô: đã lưu ở lô trước (lưu dở) thì lấy giá trị đó. */
  const nen = (g: DongGoc, k: Cot) => luuRoi[g.studentId]?.[k] ?? chuGoc(g, k);
  /** Chỉ những ô KHÁC giá trị gốc (gõ lại đúng giá trị cũ = không đổi). */
  const daDoi = (sid: number): Partial<Record<Cot, string>> => {
    const g = goc.get(sid);
    if (!g) return {};
    return Object.fromEntries(Object.entries(sua[sid] ?? {}).filter(([k, v]) => chuan(k as Cot, v) !== chuan(k as Cot, nen(g, k as Cot)))) as Partial<Record<Cot, string>>;
  };
  const dongDoi = (d?.rows ?? []).map((r) => ({ sid: r.studentId, doi: daDoi(r.studentId) })).filter((x) => Object.keys(x.doi).length);
  const soEm = dongDoi.length;
  const soDoiTarget = dongDoi.filter((x) => x.doi.target !== undefined).length;
  const doiTarget = soDoiTarget > 0;

  /* Gửi lên máy chủ: chuỗi đã cắt; ô trống → null (xoá); Target theo chữ (KCK / số); điểm đầu vào nhận dấu phẩy. */
  const payload = dongDoi.map(({ sid, doi }) => {
    const r: Record<string, unknown> & { studentId: number } = { studentId: sid };
    for (const [k, v0] of Object.entries(doi)) {
      const v = chuan(k as Cot, v0!);
      r[k] = k === 'fullName' ? v : k === 'monDangKy' ? monCuaO(v) : v || null;
    }
    return r;
  });
  const payloadKey = JSON.stringify(payload);

  /* OV-14a (F04): dữ liệu đổi → bỏ xem trước cũ (Lưu mờ tới khi có bản khớp); phản hồi của lần xem trước cũ về sau thì bỏ. */
  useEffect(() => {
    const conMoi = batLuotXem();
    setXem(null);
    if (!payload.length) return undefined;
    const t = setTimeout(() => {
      api.post<XemTruoc>(`/classes/${classId}/sua-ca-lop/xem-truoc`, { rows: payload })
        .then((x) => { if (conMoi()) setXem(x); }).catch((e: any) => { if (conMoi()) toast.push('error', e.message); });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadKey, classId]);

  const vanDe = (sid: number, k: Cot) => xem?.rows.find((x) => x.studentId === sid)?.issues.filter((i) => i.field === k) ?? [];
  const soLoi = xem ? xem.rows.reduce((n, x) => n + x.issues.filter((i) => i.muc === 'loi').length, 0) : 0;
  /* RA-LUONG-15 (lô lỗi một phần): em có ô lỗi ở lại lưới để sửa, các em khác vẫn lưu được — một ô lỗi không chặn cả bảng. */
  const emLoi = new Set((xem?.rows ?? []).filter((x) => x.issues.some((i) => i.muc === 'loi')).map((x) => x.studentId));
  const guiDuoc = payload.filter((r) => !emLoi.has(r.studentId));
  const loiLyDo = doiTarget && !lyDo.trim() ? t('Ghi lý do đổi Target.') : null;   // T7 (PR-MTa): không tối thiểu ký tự
  const loiForm = loiLyDo ? [{ khoa: 'ly-do-target', nhan: t('Lý do đổi Target'), lyDo: loiLyDo }] : [];

  const datO = (sid: number, k: Cot, v: string) => setSua((s) => ({ ...s, [sid]: { ...s[sid], [k]: v } }));
  const hoanTac = (sid: number, k: Cot) => setSua((s) => {
    const { [k]: _bo, ...con } = s[sid] ?? {};
    return { ...s, [sid]: con };
  });

  /* Đang lưu thì không đóng (Esc, nền, ✕): lưu lỗi còn giữ nguyên lưới để thử lại. */
  const dong = () => { if (busy) return; if (soEm) setHoiDong(true); else onClose(); };
  const luu = async () => {
    lf.bam();
    if (busy || !guiDuoc.length || !xem || loiLyDo) return;
    setBusy(true);
    setLuuDo(null);
    /* F05: em đổi email cho nhau chung một lô (một giao dịch) — xem trước đã báo nhóm quá một lô. */
    const lo = chiaLoSuaCaLop(guiDuoc, (sid) => (luuRoi[sid]?.email ?? goc.get(sid)?.email) || null).lo;
    let xong = 0, daSua = 0;
    setTienDo({ xong, tong: guiDuoc.length });
    try {
      for (const [i, rows] of lo.entries()) {
        const r = await api.post<{ daSua: number }>(`/classes/${classId}/sua-ca-lop`, {
          rows, lyDoTarget: doiTarget ? lyDo.trim() : undefined, idempotencyKey: `${khoa.current}-${i}`,
        });
        daSua += r.daSua;
        xong += rows.length;
        setTienDo({ xong, tong: guiDuoc.length });
        /* Lô này đã ghi: giá trị vừa gửi thành gốc mới → ô thôi tô nhấn (ô gõ thêm trong lúc lưu vẫn còn là "đã sửa"). */
        const ghi = new Map(rows.map(({ studentId, ...o }) => [studentId, Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v == null ? '' : String(v)]))]));
        setLuuRoi((m) => ({ ...m, ...Object.fromEntries([...ghi].map(([sid, o]) => [sid, { ...m[sid], ...o }])) }));
        setSua((m) => Object.fromEntries(Object.entries(m).map(([sid, o]) => [sid, ghi.has(Number(sid))
          ? Object.fromEntries(Object.entries(o).filter(([k, v]) => ghi.get(Number(sid))![k] === undefined || chuan(k as Cot, v!) !== ghi.get(Number(sid))![k]))
          : o])));
      }
      toast.push('ok', t('Đã cập nhật {n} học viên', { n: daSua }));
      onDone();
      if (emLoi.size) { khoa.current = moiKhoa(); setLuuDo({ cau: t('Đã lưu {ok} em · {loi} em chưa lưu', { ok: xong, loi: emLoi.size }), lyDo: t('{n} ô cần sửa', { n: soLoi }) }); }
      else onClose();
    } catch (e: any) {
      /* Dừng ở lô lỗi; em chưa lưu giữ nguyên để bấm Lưu lại (khoá mới = lần lưu mới). Chưa lưu em nào → báo như cũ. */
      khoa.current = moiKhoa();
      if (xong) {
        setLuuDo({ cau: t('Đã lưu {ok} em · {loi} em chưa lưu', { ok: xong, loi: payload.length - xong }), lyDo: e.message });
        onDone();
      } else toast.push('error', e.message);
    } finally { setBusy(false); setTienDo(null); }
  };

  return (
    <KhungPanel tieuDe={t('Sửa thông tin học viên')} lop={d ? t('Lớp {code}', { code: d.lop.code }) : null} rong="toan" onDong={dong}
      ngCanh={soEm ? t('Đã sửa {n} em', { n: soEm }) : undefined}
      chan={{
        daSua: soEm > 0, tuHoi: true, huy: { onClick: dong, disabled: busy },
        conThieu: lf.conThieu(loiForm),
        phu: soLoi > 0 ? <span className="text-xs text-late tabular-nums">{t('{n} ô cần sửa', { n: soLoi })}</span>
          : luuDo && soEm ? <span className="text-xs text-late tabular-nums" title={luuDo.lyDo}>{luuDo.cau}</span>
          /* P8 (mockup k5 chân): tóm tắt đổi môn của em đầu tiên + số em còn lại (đủ từng em ở cột Lưu ý). */
          : xem?.monHoc?.length ? (() => {
            const m = xem.monHoc[0], ten = goc.get(m.studentId)?.fullName ?? '';
            return <span className="text-xs text-slate-300">{`${ten}: ${m.dong.map((x) => dich(x)).join(' · ')}`}{xem.monHoc.length > 1 ? ` · +${t('{n} em', { n: xem.monHoc.length - 1 })}` : ''}</span>;
          })() : null,
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => void luu()}
            disabled={busy || !guiDuoc.length || !xem}>
            {busy ? (tienDo ? t('Đang lưu {xong}/{tong}…', { xong: tienDo.xong, tong: tienDo.tong }) : t('Đang lưu…')) : guiDuoc.length ? t('Lưu {n} em', { n: guiDuoc.length }) : t('Lưu')}
          </button>
        ),
      }}>
      {du.error ? <ErrorState message={du.error.message} hint={du.error.hint} status={du.error.status} onRetry={du.reload} />
        : !d ? <Skeleton rows={6} />
        : !d.rows.length ? <p className="pt-3 text-sm text-slate-400">{t('Lớp chưa có học viên đang học.')}</p>
        : (
          /* OV-14a (F02): đang lưu thì khoá mọi ô (chữ, ngày, TVV, ↺) — lưu xong panel đóng, chữ gõ thêm lúc lưu sẽ mất. */
          <fieldset disabled={busy} className="m-0 min-w-0 space-y-3 border-0 p-0 pt-3">
            {doiTarget && (
              <div className="max-w-xl">
                <Truong nhan={`${t('Lý do đổi Target')} · ${t('{n} em', { n: soDoiTarget })}`} batBuoc loi={lf.loiCua(loiForm, 'ly-do-target')}>
                  <input className="field w-full" {...lf.o(loiForm, 'ly-do-target')} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
                    placeholder={t('Ví dụ: Phụ huynh đổi Target sau buổi tư vấn')} />
                </Truong>
              </div>
            )}
            {d.coMonHoc && d.coTheDoiMon && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--line)' }} role="group" aria-label={t('Áp môn học cho em đã chọn')}>
                <span className="text-sm font-semibold tabular-nums text-slate-200">{t('{n} em đã chọn', { n: chon.size })}</span>
                <NutChon nho chon={chon.size > 0 && chon.size === d.rows.filter((r) => r.laFt).length}
                  onClick={() => setChon(chon.size === d.rows.filter((r) => r.laFt).length ? new Set() : new Set(d.rows.filter((r) => r.laFt).map((r) => r.studentId)))}>
                  {t('Chọn tất cả · {n}', { n: d.rows.filter((r) => r.laFt).length })}
                </NutChon>
                <span className="flex flex-wrap items-center gap-2"><span className="text-xs text-slate-400">{t('Môn học')}</span><NutMon nho ariaLabel={t('Môn học áp cho em đã chọn')} value={apMon} onChange={setApMon} /></span>
                <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={!chon.size || apMon?.length === 0}
                  onClick={() => { for (const sid of chon) datO(sid, 'monDangKy', chuMonO(apMon)); }}>{t('Áp cho {n} em', { n: chon.size })}</button>
                {chon.size > 0 && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm font-semibold sm:min-h-0" onClick={() => setChon(new Set())}>{t('Bỏ chọn')}</button>}
              </div>
            )}
            {d.nhapLienHe && <datalist id="quan-he-goi-y-lop">{QUAN_HE_GOI_Y.map((x) => <option key={x} value={x} />)}</datalist>}
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm" style={{ minWidth: cot.reduce((n, c) => n + c.rong, 0) + RONG_LUU_Y }}>
                <colgroup>
                  {d.coMonHoc && d.coTheDoiMon && <col style={{ width: 44 }} />}
                  {cot.map((c) => <col key={c.key} style={{ width: c.rong }} />)}
                  <col style={{ width: RONG_LUU_Y }} />
                </colgroup>
                <thead>
                  <tr>
                    {d.coMonHoc && d.coTheDoiMon && <Th><span className="sr-only">{t('Chọn')}</span></Th>}
                    {cot.map((c) => (
                      <Th key={c.key} align={c.so ? 'right' : 'left'}
                        className={c.key === 'fullName' ? 'sticky-col' : ''}
                        hint={khoaCot(c.key) ?? (c.key === 'target' ? (du.data?.kyThi ? t('{ten}: số nguyên {min}–{max}, không KCK. Bỏ trống = chưa có Target.', { ten: du.data.kyThi.ten, min: du.data.kyThi.min, max: du.data.kyThi.max }) : t('Band 0–9, bước 0,5. Em không cam kết đầu ra: thêm {kck} (ví dụ 6.5 {kck}).', { kck: KCK })) : undefined)}>
                        {c.nhan}{c.key === 'email' && <span className="text-bad"> *</span>}
                      </Th>
                    ))}
                    <Th>{t('Lưu ý')}</Th>
                  </tr>
                </thead>
                <tbody>
                  {d.rows.map((r) => {
                    const doi = daDoi(r.studentId);
                    const mt = xem?.canhBaoMt.find((x) => x.studentId === r.studentId);
                    const monTom = xem?.monHoc?.find((x) => x.studentId === r.studentId)?.dong ?? [];
                    return (
                      <tr key={r.studentId} style={chon.has(r.studentId) ? { background: 'var(--accent-soft)', boxShadow: 'inset 3px 0 0 var(--accent)' } : undefined}>
                        {d.coMonHoc && d.coTheDoiMon && (
                          <td className="td px-1.5 py-1.5 align-top">
                            <input type="checkbox" className="h-4 w-4 sm:mt-1.5" aria-label={t('Chọn {ten}', { ten: r.fullName })} disabled={!r.laFt} checked={chon.has(r.studentId)}
                              onChange={(e) => setChon((s) => { const n = new Set(s); if (e.target.checked) n.add(r.studentId); else n.delete(r.studentId); return n; })} />
                          </td>
                        )}
                        {cot.map((c) => {
                          const v = sua[r.studentId]?.[c.key] ?? nen(r, c.key);
                          const daSuaO = doi[c.key] !== undefined;
                          const loi = daSuaO
                            ? vanDe(r.studentId, c.key).find((i) => i.muc === 'loi')?.message ?? null : null;
                          const khoaO = (O_LO_TRINH.has(c.key) && !r.coLoTrinh) || !!khoaCot(c.key) || (c.key === 'monDangKy' && !r.laFt);
                          const nhan = `${c.nhan} · ${r.fullName}`;
                          const idLoi = `loi-${r.studentId}-${c.key}`;
                          return (
                            <td key={c.key} className={`td px-1.5 py-1.5 align-top${c.key === 'fullName' ? ' sticky-col' : ''}`}
                              style={daSuaO ? { background: 'var(--accent-soft)' } : undefined}>
                              <div className="flex items-center gap-1">
                                <span className="min-w-0 flex-1">
                                  {c.key === 'consultantUserId' ? (
                                    <>
                                      <ChonNguoi nhom="nhan_vien" choToi={false} choNgoai={false} ds={d.tvv} choTrong={t('— Chưa chọn —')} placeholder={t('Chọn')}
                                        ariaLabel={nhan} invalid={!!loi}
                                        value={v ? { kieu: 'tai_khoan', id: Number(v), ten: d.tvv.find((t) => t.id === Number(v))?.ten ?? `#${v}` } : null}
                                        onChange={(x) => datO(r.studentId, c.key, x?.kieu === 'tai_khoan' ? String(x.id) : '')} />
                                      {!v && r.consultantName && <span className="mt-0.5 block truncate text-xs text-slate-500" title={r.consultantName}>{t('cũ: “{ten}”', { ten: r.consultantName })}</span>}
                                    </>
                                  ) : c.key === 'monDangKy' ? (
                                    r.laFt
                                      ? <NutMon nho ariaLabel={nhan} value={monCuaO(v)} disabled={khoaO} onChange={(x) => datO(r.studentId, c.key, chuMonO(x))} />
                                      : <span className="block pt-1.5 text-xs text-slate-500">{t('Chỉ lộ trình FT')}</span>
                                  ) : c.key === 'dob' || c.key === 'startWeek' || c.key === 'examDate' ? (
                                    <ONgay gon kieu={c.key === 'dob' ? 'ngay' : c.key === 'startWeek' ? 'tuan' : 'ngay-hoac-thang'}
                                      value={v} ariaLabel={nhan} invalid={!!loi} moTa={loi ? idLoi : undefined} disabled={khoaO}
                                      onChange={(x) => datO(r.studentId, c.key, x)} />
                                  ) : (
                                    <input className={`field w-full${c.so ? ' text-right tabular-nums' : ''}${c.key === 'email' ? ' placeholder:font-bold placeholder:text-late' : ''}${loi ? ' border-late' : ''}`}
                                      placeholder={c.key === 'email' ? t('Thiếu') : undefined}
                                      value={v} aria-label={nhan} aria-invalid={!!loi || undefined} aria-describedby={loi ? idLoi : undefined}
                                      disabled={khoaO} title={khoaO ? khoaCot(c.key) ?? t('Em chưa có lộ trình') : undefined}
                                      type={c.key === 'email' ? 'email' : c.key === 'phone' || c.key === 'parentPhone' ? 'tel' : 'text'} autoComplete="off"
                                      inputMode={c.key === 'baseline' ? 'decimal' : c.key === 'email' ? 'email' : c.key === 'phone' || c.key === 'parentPhone' ? 'tel' : undefined}
                                      list={c.key === 'parentRelation' ? 'quan-he-goi-y-lop' : undefined}
                                      maxLength={c.key === 'parentName' || c.key === 'parentRelation' ? LIEN_HE_TOI_DA[c.key] : c.key === 'phone' || c.key === 'parentPhone' ? LIEN_HE_TOI_DA.sdt : undefined}
                                      onChange={(e) => datO(r.studentId, c.key, e.target.value)}
                                      onBlur={c.key === 'target' ? (e) => { const v = chuanOTarget(e.target.value); if (v !== e.target.value) datO(r.studentId, 'target', v); } : undefined} />
                                  )}
                                </span>
                                {daSuaO && (
                                  <button type="button" className="btn btn-sm btn-ghost min-h-[44px] min-w-[32px] justify-center px-0 sm:min-h-[28px] sm:min-w-[28px] sm:px-1"
                                    title={t('Hoàn tác — về "{goc}"', { goc: c.key === 'monDangKy' ? dich(chuMon(monCuaO(nen(r, c.key)))) : nen(r, c.key) || t('trống') })} aria-label={t('Hoàn tác {nhan}', { nhan })}
                                    onClick={() => hoanTac(r.studentId, c.key)}>↺</button>
                                )}
                              </div>
                              {loi && <span id={idLoi} className="mt-1 block text-xs text-late">{dich(loi)}</span>}
                            </td>
                          );
                        })}
                        <td className="td px-2 py-1.5 align-top text-xs">
                          {/* R1-NO-NHO: một dòng (cắt + title) — câu dài làm dòng đã chọn cao gấp đôi; đủ câu ở chân panel. */}
                          {monTom.length ? <span className="block truncate pt-1.5 text-soon" title={monTom.map((x) => dich(x)).join(' · ')}>{monTom.map((x) => dich(x)).join(' · ')}</span>
                            : mt ? <span className="block truncate pt-1.5 text-soon" title={dich(mt.cau)}>{dich(mt.cau)}</span>
                            : Object.keys(doi).length ? <span className="inline-flex items-center gap-1.5 text-slate-300"><span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'rgb(var(--soon-rgb))' }} />{t('đã sửa')}</span>
                            : <span className="text-slate-500">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </fieldset>
        )}
      <ConfirmDialog open={hoiDong} onClose={() => setHoiDong(false)} onConfirm={() => { setHoiDong(false); onClose(); }} danger
        title={t('Bỏ những gì vừa sửa?')} closeLabel={t('Tiếp tục sửa')} confirmLabel={t('Bỏ thay đổi')}
        body={t('Đã sửa {n} em nhưng chưa lưu. Đóng panel thì các thay đổi này mất.', { n: soEm })} />
    </KhungPanel>
  );
}
