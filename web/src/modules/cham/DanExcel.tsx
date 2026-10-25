import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { IconDat } from '../../ui/BieuTuong.tsx';
import { BoLocDoan } from '../../ui/ui.tsx';
import { ChonNhom } from '../fasttrack/NhanXet.tsx';
import { lyDoChiDoc } from '../fasttrack/ScoreEntry.tsx';
import type { FtSheet } from './LuoiFT.tsx';
import { lichCua, oThuong, tongPhoBien, type ThuongSheet } from './LuoiThuong.tsx';
import {
  COT_FT, LO_DAN, cotThuong, docBangDan, khopHocVien, xetODan, xetOThuong, chiaLo, tuanLich, patchTruoc, patchTruocThuong, oConNhuDan, oConNhuDanThuong,
  tenMon, tenMonNgan, type CheDoLR, type CotDan, type ODanThuong, type PatchDan, type PatchThuong,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * DÁN TỪ EXCEL (OV-15b mục 2, C15; mockup 2 khung 1d) — khối xem trước ngay cạnh lưới đang mở (không panel lồng panel). Dán (Ctrl V) vào
 * khung → bảng xem trước (em khớp / ô mới / ghi đè trước → sau / lỗi / trùng tên → chọn em / không có trong lớp); dưới kỳ vọng chọn nhóm
 * nguyên nhân tại chỗ; "Lưu n dòng" lưu dòng hợp lệ (mỗi request `LO_DAN` dòng, máy chủ kiểm lại mọi luật), dòng còn lại ở lại là nháp.
 * Lỗi mạng: bảng giữ nguyên, "Thử lại". Luật đọc / khớp / xét ô: `shared/domain/danExcel.ts`.
 * OV-15h2 (ý 10): CÙNG khối cho lớp thường — phần riêng từng loại lưới nằm ở bộ chuyển `BoDan` (`boDanFt` · `boDanThuong`).
 */
/** Một em (một lượt) của lưới đang dán. */
type Hang = { attemptId: number; studentId: number; studentName: string; studentEmail?: string | null; attemptNo?: number; kindLabel?: string };
type Lenh = Record<string, unknown>;
type XetDan = { loai: 'bo' } | { loai: 'loi'; loi: string }
  | { loai: 'ghi'; lenh: Lenh[]; band: number | null; truoc: string | null; sau: string; canNhom: boolean; canhBao?: string; kyVong?: number | null };
/**
 * BỘ CHUYỂN của một loại lưới: em của lưới, cột dán, đường lưu, và ba việc theo ô — xét ô dán, lệnh Hoàn tác, ô còn như dán.
 * FT: `saveScore` (band, tiêu chí, nhóm nguyên nhân); lớp thường: `saveRegularScore` (số câu đúng / tổng, "-", nhận xét).
 */
export type BoDan = {
  classId: number; classCode: string; hang: Hang[]; cot: readonly string[]; tenCot: CotDan; coLR: boolean; duong: string; luuY: string;
  xet: (h: Hang, skill: string, raw: { diem: string; nhanXet: string }, cheDo: CheDoLR) => XetDan;
  tra: (h: Hang, skill: string, lenh: Lenh[]) => Lenh[];
  conNhu: (h: Hang, skill: string, lenh: Lenh) => boolean;
};

/** Lưới FT (OV-15b) — giữ nguyên luật cũ. */
export function boDanFt(data: FtSheet, cot: readonly string[], homNay: string): BoDan {
  const theoId = new Map(data.rows.map((r) => [r.attemptId, r]));
  const oCua = (h: Hang, k: string) => {
    const c0 = theoId.get(h.attemptId)?.cells.find((cc) => cc.skill === k);
    /* Ô chỉ đọc: cùng câu với lưới (`lyDoChiDoc`); ô chưa tới tuần thi nói tuần. */
    return c0 && !c0.canEdit ? { ...c0, lyDoKhoa: c0.weekStart && c0.weekStart.slice(0, 10) > homNay
      ? t('Chưa tới tuần Test {tuan}', { tuan: tuanLich(c0.weekStart, homNay) }) : lyDoChiDoc(c0) } : c0;
  };
  return {
    classId: data.classId, classCode: data.classCode, hang: data.rows, cot, tenCot: COT_FT, duong: '/attempts/scores/lo',
    coLR: cot.includes('listening') || cot.includes('reading'),
    luuY: t('Một kỹ năng: Tên · điểm · nhận xét. Ô trống được bỏ qua, không thành 0. W1, W2, S: bốn tiêu chí số nguyên (6 7 6 7).'),
    xet: (h, k, raw, cheDo) => {
      const cell = oCua(h, k);
      if (!cell) return { loai: 'loi', loi: t('Lượt này không có kỹ năng này') };
      const r = xetODan(raw, cell, cheDo);
      return r.loai === 'ghi' ? { ...r, lenh: [r.patch], kyVong: cell.kyVong ?? null } : r;
    },
    /* FT: một lệnh mỗi ô (đã gộp nhóm nguyên nhân) — `patchTruoc` trả các lệnh ngược theo thứ tự. */
    tra: (h, k, lenh) => lenh.flatMap((p) => patchTruoc(oCua(h, k)!, p as PatchDan)),
    conNhu: (h, k, p) => { const c = theoId.get(h.attemptId)?.cells.find((cc) => cc.skill === k); return !!c && oConNhuDan(c, p as PatchDan); },
  };
}

/** Lưới lớp thường (OV-15h2 ý 10): cột theo môn của lớp; tổng câu của ô, không có thì tổng hay gặp của cột (ô "tổng" đầu cột của lưới). */
export function boDanThuong(data: ThuongSheet, cot: readonly string[], homNay: string): BoDan {
  const ct = data.programme.code;
  const theoId = new Map(data.rows.map((r) => [r.attemptId, r]));
  const tongCot = Object.fromEntries(cot.map((k) => [k, tongPhoBien(data.rows, k)]));
  const oCua = (h: Hang, k: string): ODanThuong | null => {
    const r = theoId.get(h.attemptId);
    const s = r && lichCua(r, k);
    if (!r || !s) return null;
    const { cell } = oThuong(r, k, homNay);
    return {
      skill: k, canEdit: s.canEdit, diem: cell.diem, tong: cell.tong, tongCot: tongCot[k] ?? null, dau: cell.dau, nhanXet: s.nhanXet ?? null,
      progress: s.progress, chuaToiTuan: cell.chuaToiTuan, khongVang: s.khongVang ?? null, nhanXetDuoc: s.nhanXetDuoc,
      lyDoKhoa: s.khoa ? t('Đợt đã hoàn tất — chỉ Quản lý sửa được điểm') : undefined,
    };
  };
  const ngan = (k: string) => data.monNgan?.[k] ?? tenMonNgan(ct, k);
  return {
    classId: data.class.id, classCode: data.class.code, cot, duong: '/regular/scores/lo', coLR: false,
    hang: data.rows.map((r) => ({ attemptId: r.attemptId, studentId: r.studentId, studentName: r.studentName, studentEmail: r.studentEmail ?? null, kindLabel: r.kindLabel })),
    tenCot: cotThuong(cot, { ngan, ten: (k) => data.skillLabels[k] ?? tenMon(ct, k) }),
    luuY: t('Điểm = số câu đúng (24 — tổng lấy từ cột) hoặc 24/40; "-" = em không làm bài (môn dời sang tuần sau). Ô trống được bỏ qua, không thành 0.'),
    xet: (h, k, raw) => {
      const c = oCua(h, k);
      if (!c) return { loai: 'loi', loi: t('Bài này không có môn này') };
      const r = xetOThuong(raw, c);
      return r.loai === 'ghi' ? { ...r, band: null, canNhom: false } : r;
    },
    tra: (h, k, lenh) => patchTruocThuong(oCua(h, k)!, lenh as PatchThuong[]),
    conNhu: (h, k, p) => { const c = oCua(h, k); return !!c && oConNhuDanThuong(c, p as PatchThuong); },
  };
}

type ODong = { skill: string; diem: string; nhanXet: string; x: XetDan };
type DongXem = {
  so: number; ten: string; hang: Hang | null; trung: Hang[]; khongCo: boolean; trungDong: number | null;
  /** Em do người dùng chọn (trùng tên) — có "Chọn lại". */
  daChon: boolean;
  o: ODong[]; loiMay: string | null;
  /** Mọi ô lỗi của dòng cùng một câu (≥ 2 ô) — nói một lần dưới tên, ô chỉ đỏ. */
  loiChung: string | null;
};
type KetQua = { dong: ({ attemptId: number; ok: true } | { attemptId: number; ok: false; skill: string | null; loi: string })[]; soO: number };
type DongGui = { so: number; attemptId: number; o: ({ skill: string } & Lenh)[] };
/** Lần dán bị đứt mạng giữa chừng: lô + tổng các request đã qua — Thử lại gửi tiếp vào đúng lô đó. */
type DangDo = { loId: string; truoc: { soDong: number; soDaLuu: number; soO: number } };
/** Dòng đã lưu: `o` = lệnh đã gửi (để so ô còn như dán), `tra` = lệnh Hoàn tác theo thứ tự. */
type DongVua = DongGui & { tra: DongGui['o'] };

export function DanExcel({ bo, tenLuot, luot, hep, hoiBanDau = false, onDong, onDaLuu }: {
  bo: BoDan; tenLuot: string; hep: boolean; hoiBanDau?: boolean; onDong: () => void; onDaLuu: () => void;
  /** Mã lượt đang mở (`mt:2`, `thuong:progress`…) — máy chủ ràng mọi dòng vào lớp + lượt này; lưới theo tuần: null (chỉ ràng lớp). */
  luot: string | null;
}) {
  const { cot, tenCot } = bo;
  const ngan = tenCot.ngan;
  /* Chữ dán giữ trong phiên theo lớp + lượt: đóng panel (Đóng / ✕) không mất bảng đang nháp; "Dán lại" xoá. */
  const khoaNhap = `pisa.dan-excel.${bo.classId}.${tenLuot}`;
  const [chu, datChu] = useState(() => { try { return sessionStorage.getItem(khoaNhap) ?? ''; } catch { return ''; } });
  const setChu = (v: string) => {
    datChu(v);
    try { if (v) sessionStorage.setItem(khoaNhap, v); else sessionStorage.removeItem(khoaNhap); } catch { /* chế độ riêng tư: chỉ giữ trong lúc mở */ }
  };
  const [cheDo, setCheDo] = useState<CheDoLR>('cau');
  const [chon, setChon] = useState<Record<number, number | 'bo' | null>>({});
  const [nhom, setNhom] = useState<Record<string, string[]>>({});
  const [daLuu, setDaLuu] = useState<Set<number>>(new Set());
  const [loiMay, setLoiMay] = useState<Record<number, string>>({});
  const [dang, setDang] = useState<{ xong: number; tong: number } | null>(null);
  const [loiMang, setLoiMang] = useState<string | null>(null);
  const [vua, setVua] = useState<{ n: number; luc: string; dong: DongVua[] } | null>(null);
  const [bao, setBao] = useState<string | null>(null);
  /* Vừa lưu: bảng đang tải lại — Hoàn tác phải so với bảng MỚI (`conNhu`), nên chờ lưới đổi rồi mới bấm được. */
  const [choTai, setChoTai] = useState(false);
  useEffect(() => { setChoTai(false); }, [bo]);
  const [hoi, setHoi] = useState(hoiBanDau);

  const bang = useMemo(() => docBangDan(chu, cot, tenCot), [chu, cot, tenCot]);
  const coLR = bo.coLR;
  const ds = useMemo(() => bo.hang.map((r) => ({ attemptId: r.attemptId, ten: r.studentName, email: r.studentEmail })), [bo.hang]);
  const theoId = useMemo(() => new Map(bo.hang.map((r) => [r.attemptId, r])), [bo.hang]);

  const dong = useMemo<DongXem[]>(() => {
    const dungBoi = new Map<number, number>();
    return bang.dong.filter((d) => !daLuu.has(d.so) && chon[d.so] !== 'bo').map((d) => {
      const k = khopHocVien(d.ten, ds);
      const c = chon[d.so];
      const hang = (k.attemptId ? theoId.get(k.attemptId) : typeof c === 'number' ? theoId.get(c) : undefined) ?? null;
      const trungDong = hang ? dungBoi.get(hang.attemptId) ?? null : null;
      if (hang && trungDong === null) dungBoi.set(hang.attemptId, d.so);
      /* Chưa có em (trùng tên / không có trong lớp): chưa xét — hiện số thô. */
      const o = d.o.map((x) => ({ ...x, x: !hang || !(x.diem || x.nhanXet) ? { loai: 'bo' as const } : bo.xet(hang, x.skill, x, cheDo) }));
      const cauLoi = [...new Set(o.flatMap((x) => (x.x.loai === 'loi' ? [x.x.loi] : [])))];
      const loiChung = cauLoi.length === 1 && o.filter((x) => x.x.loai === 'loi').length > 1 ? cauLoi[0] : null;
      return {
        loiChung, so: d.so, ten: d.ten, hang, daChon: !k.attemptId && !!hang, trung: (k.trung ?? []).map((id) => theoId.get(id)!).filter(Boolean), khongCo: !!k.khongCo, trungDong, o,
        loiMay: loiMay[d.so] ?? null,
      };
    });
  }, [bang, ds, theoId, chon, cheDo, daLuu, loiMay, bo]);

  const khoaNhom = (so: number, k: string) => `${so}:${k}`;
  const thieuNhom = (d: DongXem, o: ODong) => o.x.loai === 'ghi' && o.x.canNhom && !nhom[khoaNhom(d.so, o.skill)]?.length;
  const loiO = (d: DongXem) => d.o.filter((o) => o.x.loai === 'loi').length + (d.trungDong !== null ? 1 : 0);
  const ghi = (d: DongXem) => d.o.filter((o) => o.x.loai === 'ghi');
  /* LUAT-NX-MT: thiếu nhóm nguyên nhân chỉ nhắc (chữ vàng) — không giữ dòng lại. */
  const hopLe = (d: DongXem) => !!d.hang && d.trungDong === null && !loiO(d) && ghi(d).length > 0;
  const luuDuoc = dong.filter(hopLe);
  /* Mới / ghi đè: dòng khớp em, không lỗi (kể cả dòng còn chờ chọn nhóm nguyên nhân). */
  const sach = (d: DongXem) => !!d.hang && d.trungDong === null && !loiO(d) && !d.loiMay && ghi(d).length > 0;
  const coDe = (d: DongXem) => ghi(d).some((o) => o.x.loai === 'ghi' && o.x.truoc !== null);
  const dem = {
    moi: dong.filter((d) => sach(d) && !coDe(d)).length,
    ghiDe: dong.filter((d) => sach(d) && coDe(d)).length,
    trung: dong.filter((d) => !d.hang && d.trung.length).length,
    loi: dong.filter((d) => d.hang && (loiO(d) || d.loiMay)).length,
    khong: dong.filter((d) => !d.hang && d.khongCo).length,
  };
  const conNhap = dong.length - luuDuoc.length;

  /*
   * Một lần bấm Lưu / Hoàn tác = một `loId`; request cuối mang tổng các request trước → máy chủ ghi MỘT mục lịch sử.
   * OV-15h2 (ý 9): lỗi mạng giữa chừng → lần lưu sau (Thử lại) gửi tiếp CÙNG `loId` + tổng đã qua (`dangDo`), vẫn một mục cho cả lần dán.
   */
  const [dangDo, setDangDo] = useState<DangDo | null>(null);
  const goi = async (lo: DongGui[], hoanTac = false, tiep: DangDo | null = null) => {
    const ok: number[] = [], loi: Record<number, string> = {};
    const loId = tiep?.loId ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const phan = chiaLo(lo, LO_DAN);
    let soDong = tiep?.truoc.soDong ?? 0, soO = tiep?.truoc.soO ?? 0;
    const daLuuTruoc = tiep?.truoc.soDaLuu ?? 0;
    const doDang = (): DangDo => ({ loId, truoc: { soDong, soDaLuu: daLuuTruoc + ok.length, soO } });
    setDang({ xong: 0, tong: lo.length });
    try {
      for (const [i, p] of phan.entries()) {
        const r = await api.post<KetQua>(bo.duong, {
          dong: p.map(({ attemptId, o }) => ({ attemptId, o })), classId: bo.classId, luot, loId, hoanTac,
          cuoi: i === phan.length - 1, truoc: doDang().truoc,
        });
        r.dong.forEach((k, j) => {
          if (k.ok) ok.push(p[j].so);
          else loi[p[j].so] = `${k.skill ? `${ngan(k.skill)}: ` : ''}${dich(k.loi)}`;
        });
        soDong += p.length; soO += r.soO;
        setDang({ xong: ok.length + Object.keys(loi).length, tong: lo.length });
      }
      return { ok, loi, mang: null as string | null, doDang: null as DangDo | null };
    } catch (e: any) {
      return { ok, loi, mang: e.message as string, doDang: doDang() };
    } finally {
      setDang(null);
      if (ok.length) {
        for (const p of ['/attempts', '/tong-quan', '/classes', '/students', '/my-work', '/regular']) invalidate(p);
        setChoTai(true);
        onDaLuu();
      }
    }
  };

  const luu = async () => {
    const lo: DongVua[] = luuDuoc.map((d) => {
      const theoO = ghi(d).map((x) => {
        const lenh = (x.x as Extract<XetDan, { loai: 'ghi' }>).lenh;
        const n = nhom[khoaNhom(d.so, x.skill)];
        /* FT: nhóm nguyên nhân đi cùng lệnh điểm của ô (một lệnh mỗi ô). */
        return { skill: x.skill, lenh: n?.length ? lenh.map((p, i) => (i === 0 ? { ...p, nhomNguyenNhan: n } : p)) : lenh };
      });
      const o = theoO.flatMap((x) => x.lenh.map((p) => ({ skill: x.skill, ...p })));
      const tra = theoO.flatMap((x) => bo.tra(d.hang!, x.skill, x.lenh).map((p) => ({ skill: x.skill, ...p })));
      return { so: d.so, attemptId: d.hang!.attemptId, o, tra };
    });
    setLoiMang(null);
    setBao(null);
    const r = await goi(lo, false, dangDo);
    setDangDo(r.doDang);
    setLoiMay((m) => { const moi = { ...m, ...r.loi }; for (const so of r.ok) delete moi[so]; return moi; });
    setDaLuu((x) => new Set([...x, ...r.ok]));
    /* Lần lưu sau (Thử lại, dòng nháp vừa sửa) CỘNG vào lần trước — Hoàn tác vẫn trả được mọi dòng đã lưu. */
    if (r.ok.length) {
      const luc = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setVua((v) => ({ n: (v?.n ?? 0) + r.ok.length, luc, dong: [...(v?.dong ?? []), ...lo.filter((x) => r.ok.includes(x.so))] }));
    }
    if (r.mang) setLoiMang(r.mang);
  };

  /* Hoàn tác: chỉ dòng mà mọi ô (bảng vừa tải lại) còn đúng giá trị đã dán — ai đã sửa sau đó thì không trả ngược. */
  const hoanTac = async () => {
    if (!vua) return;
    const con = vua.dong.filter((x) => {
      const h = theoId.get(x.attemptId);
      return !!h && x.o.every(({ skill, ...p }) => bo.conNhu(h, skill, p));
    });
    const doi = vua.dong.filter((x) => !con.includes(x)).map((x) => theoId.get(x.attemptId)?.studentName ?? `#${x.so}`);
    const r = con.length ? await goi(con.map((x) => ({ so: x.so, attemptId: x.attemptId, o: x.tra })), true) : { ok: [] as number[], loi: {}, mang: null };
    setDangDo(null);   // Hoàn tác là lần lưu riêng: lần dán sau không nối vào lô đã dở
    setDaLuu((x) => { const moi = new Set(x); for (const so of r.ok) moi.delete(so); return moi; });
    const conLai = con.filter((x) => !r.ok.includes(x.so));
    setVua(conLai.length ? { ...vua, n: conLai.length, dong: conLai } : null);
    const cau = [
      ...(doi.length ? [t('Không hoàn tác {ten}: ô đã đổi sau khi dán', { ten: doi.join(', ') })] : []),
      ...Object.values(r.loi), ...(r.mang ? [r.mang] : []),
    ];
    setBao(cau.length ? cau.join(' · ') : null);
  };

  const huy = () => { setChu(''); setChon({}); setNhom({}); setDaLuu(new Set()); setLoiMay({}); setLoiMang(null); setVua(null); setBao(null); setDangDo(null); };
  const tieuDe = t('Dán từ Excel · {luot}', { luot: tenLuot });
  const kn = cot.filter((k) => bang.dong.some((d) => d.o.some((o) => o.skill === k)));

  return (
    <section aria-label={tieuDe} className="flex flex-col gap-3 rounded-lg border p-3 md:p-4" style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
      <div className="flex items-start gap-2">
        {hep && <button type="button" className="btn btn-ghost min-h-[44px] px-2" onClick={onDong}>{t('‹ Lưới điểm')}</button>}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-100">{tieuDe}</h3>
          <p className="text-xs text-slate-400">
            {bo.classCode}{bang.dong.length ? <> · <b className="text-slate-200">{t('{n} dòng', { n: bang.dong.length })}</b> · {bang.coTieuDe ? t('có hàng tiêu đề') : t('không hàng tiêu đề')}</> : null}
          </p>
        </div>
        <button type="button" className="btn btn-sm min-h-[44px] min-w-[44px] justify-center sm:min-h-0" aria-expanded={hoi} aria-label={t('Cách dán từ Excel')} onClick={() => setHoi((v) => !v)}>?</button>
        {!hep && <button type="button" className="btn btn-sm" onClick={onDong}>{t('Đóng')}</button>}
      </div>

      {hoi && <HuongDan cot={cot} ngan={ngan} luuY={bo.luuY} />}

      {!chu.trim() ? (
        <textarea className="field min-h-[160px] w-full font-mono text-xs" aria-label={tieuDe} autoFocus
          placeholder={t('Chọn vùng trong Excel, Ctrl C rồi Ctrl V vào đây')}
          value={chu} onChange={(e) => setChu(e.target.value)} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400">{t('Đã nhận {n} cột:', { n: bang.cot.length })}</span>
            {bang.cot.map((c, i) => <span key={i} className="rounded border px-1.5 py-0.5 text-slate-200" style={{ borderColor: 'var(--line-strong)' }}>{c}</span>)}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {coLR && (
              <>
                <span>{t('L, R là')}</span>
                <BoLocDoan ariaLabel={t('L, R là')} value={cheDo} onChange={setCheDo}
                  muc={[{ key: 'cau', nhan: t('Số câu · 0–40') }, { key: 'band', nhan: t('Band · 0–9') }]} />
              </>
            )}
            <span className="flex-1" />
            <Dem n={dem.moi} chu={t('mới')} />
            <Dem n={dem.ghiDe} chu={t('ghi đè')} />
            <Dem n={dem.trung} chu={t('trùng tên')} />
            <Dem n={dem.loi} chu={t('lỗi')} loi />
            <Dem n={dem.khong} chu={t('không có trong lớp')} />
          </div>

          {vua && (
            <div role="status" className="flex flex-wrap items-center gap-2 rounded-md px-3 py-2 text-sm surface-2">
              <span className="font-semibold text-done">✓ {t('Đã lưu {n} dòng lúc {luc}', { n: vua.n, luc: vua.luc })}</span>
              <button type="button" className="link max-sm:min-h-[44px]" disabled={!!dang || choTai} onClick={() => void hoanTac()}>{t('Hoàn tác')}</button>
              <span className="flex-1" />
              {!!dong.length && <span className="text-slate-400">{t('{n} dòng còn nháp ở dưới', { n: dong.length })}</span>}
            </div>
          )}

          {bao && <p role="status" className="text-sm text-bad">⚠ {bao}</p>}

          {!dong.length ? (
            <p className="text-sm text-slate-400">{bang.dong.length ? t('Đã lưu hết các dòng.') : t('Không đọc được dòng nào — kiểm lại vùng đã chép.')}</p>
          ) : hep ? (
            <ul className="flex flex-col gap-2">
              {[...dong].sort((a, b) => Number(hopLe(a)) - Number(hopLe(b))).map((d) => (
                <li key={d.so} className="flex flex-col gap-1.5 rounded-lg border p-3" style={{ borderColor: hopLe(d) ? 'var(--line)' : 'var(--accent)' }}>
                  <TenDong d={d} chon={(v) => setChon((c) => ({ ...c, [d.so]: v }))} />
                  <p className="text-xs text-slate-300">{d.o.map((o) => <span key={o.skill} className={o.x.loai === 'loi' && !d.loiChung ? 'block' : 'mr-2 inline-block'}><OCh o={o} ngan={ngan} gon tho={!d.hang} anLoi={!!d.loiChung} /></span>)}</p>
                  <NhomDong d={d} ngan={ngan} thieuNhom={thieuNhom} nhom={nhom} setNhom={setNhom} khoa={khoaNhom} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] table-fixed text-[13px]">
                <colgroup><col className="w-44" />{kn.map((k) => <col key={k} />)}</colgroup>
                <thead>
                  <tr className="text-left text-xs text-slate-400">
                    <th className="px-2 py-1.5 font-medium">{t('Học viên')}</th>
                    {kn.map((k) => <th key={k} className="px-2 py-1.5 font-medium">{ngan(k)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {dong.map((d) => (
                    <FragmentDong key={d.so} d={d} kn={kn} ngan={ngan}
                      ten={<TenDong d={d} chon={(v) => setChon((c) => ({ ...c, [d.so]: v }))} />}
                      nhom={<NhomDong d={d} ngan={ngan} thieuNhom={thieuNhom} nhom={nhom} setNhom={setNhom} khoa={khoaNhom} />}
                      coNhom={d.o.some((o) => o.x.loai === 'ghi' && o.x.canNhom)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {loiMang && (
            <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-bad">
              <span className="flex-1 min-w-0">⚠ {t('Không lưu được — {loi}. Bảng dán giữ nguyên.', { loi: loiMang })}</span>
              <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={() => void luu()} disabled={!!dang || !luuDuoc.length}>{t('Thử lại')}</button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-sm" style={{ borderColor: 'var(--line)' }}>
            <span className="min-w-0 flex-1 text-slate-400" aria-live="polite">
              {dang ? t('Đang lưu {x}/{n} dòng…', { x: dang.xong, n: dang.tong })
                : <>{t('Lưu được')} <b className="text-slate-100">{t('{n} dòng', { n: luuDuoc.length })}</b>{conNhap ? ` · ${t('{n} dòng còn nháp', { n: conNhap })}` : ''}</>}
            </span>
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={huy} disabled={!!dang}>{t('Dán lại')}</button>
            <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={() => void luu()} disabled={!!dang || !luuDuoc.length}>
              {t('Lưu {n} dòng', { n: luuDuoc.length })}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function Dem({ n, chu, loi }: { n: number; chu: string; loi?: boolean }) {
  if (!n) return null;
  return <span className={`rounded border px-1.5 py-0.5 text-xs ${loi ? 'text-bad' : 'text-slate-300'}`} style={{ borderColor: loi ? 'currentColor' : 'var(--line-strong)' }}><b>{n}</b> {chu}</span>;
}

/** Một dòng bảng + (nếu ô dưới kỳ vọng) dòng chọn nhóm nguyên nhân ngay dưới. */
function FragmentDong({ d, kn, ngan, ten, nhom, coNhom }: { d: DongXem; kn: readonly string[]; ngan: (k: string) => string; ten: ReactNode; nhom: ReactNode; coNhom: boolean }) {
  const mo = !d.hang;
  return (
    <>
      <tr className={`border-t align-top ${mo ? 'opacity-60' : ''}`} style={{ borderColor: 'var(--line)' }}>
        <td className="px-2 py-2">{ten}</td>
        {kn.map((k) => { const o = d.o.find((x) => x.skill === k); return <td key={k} className="px-2 py-2">{o ? <OCh o={o} ngan={ngan} tho={!d.hang} anLoi={!!d.loiChung} /> : null}</td>; })}
      </tr>
      {coNhom && d.hang && <tr><td colSpan={kn.length + 1} className="px-2 pb-2">{nhom}</td></tr>}
    </>
  );
}

function TenDong({ d, chon }: { d: DongXem; chon: (v: number | 'bo' | null) => void }) {
  if (d.hang) {
    const khac = d.ten && d.ten !== d.hang.studentName;
    return (
      <div className="min-w-0">
        <span className="inline-flex items-center gap-1 font-medium text-slate-100"><IconDat className="text-ok" />{d.hang.studentName}</span>
        {khac && <small className="block text-xs text-slate-400">{t('Excel: {ten}', { ten: d.ten })}</small>}
        {d.daChon && <button type="button" className="link text-xs max-sm:min-h-[44px]" onClick={() => chon(null)}>{t('Chọn lại')}</button>}
        {d.trungDong !== null && <small className="block text-xs text-bad">{t('Trùng em với dòng {so}', { so: d.trungDong })}</small>}
        {d.loiMay && <small className="block text-xs text-bad">⚠ {d.loiMay}</small>}
        {d.loiChung && <small className="block text-xs text-bad">⚠ {d.loiChung}</small>}
      </div>
    );
  }
  if (d.trung.length) {
    return (
      <label className="flex min-w-0 flex-col gap-1">
        <span className="font-medium text-slate-100">{t('{ten} · chọn em', { ten: d.ten })}</span>
        <small className="text-xs text-slate-400">{t('{n} em cùng tên trong lớp', { n: d.trung.length })}</small>
        <select className="field min-h-[44px] text-sm sm:min-h-0" defaultValue="" onChange={(e) => chon(e.target.value === 'bo' ? 'bo' : Number(e.target.value))}>
          <option value="" disabled>{t('Chọn em…')}</option>
          {d.trung.map((h) => (
            <option key={h.attemptId} value={h.attemptId}>
              {h.studentName}{h.studentEmail ? ` · ${h.studentEmail}` : ''}{d.trung.some((k) => k !== h && k.studentId === h.studentId) ? ` · ${h.kindLabel ?? `MT${h.attemptNo}`}` : ''}
            </option>
          ))}
          <option value="bo">{t('Không dán dòng này')}</option>
        </select>
      </label>
    );
  }
  return <span className="text-slate-300">{t('{ten} · không có trong lớp', { ten: d.ten || '—' })}</span>;
}

/** Ô xem trước: điểm (ghi đè: cũ gạch → mới) + nhận xét nhỏ; lỗi: chữ đỏ + lý do; bỏ qua: chữ mờ. */
function OCh({ o, ngan, gon, tho, anLoi }: { o: ODong; ngan: (k: string) => string; gon?: boolean; tho?: boolean; anLoi?: boolean }) {
  const ten = gon ? `${ngan(o.skill)} ` : '';
  if (tho) return o.diem ? <span className="tabular-nums">{ten}{o.diem}</span> : null;
  if (o.x.loai === 'bo') return gon ? null : <span className="whitespace-nowrap text-xs text-slate-500">{o.diem || o.nhanXet ? t('không đổi') : t('bỏ qua · ô trống')}</span>;
  if (o.x.loai === 'loi') {
    return (
      <span className="text-bad">
        {ten}<b className="tabular-nums">{o.diem || '—'}</b>
        {anLoi ? <span aria-hidden> ⚠</span> : <small className="block text-xs">⚠ {o.x.loi}</small>}
      </span>
    );
  }
  const x = o.x;
  return (
    <span>
      {ten}{x.truoc !== null ? <span className="tabular-nums"><s className="text-slate-500">{x.truoc}</s> → <b>{x.sau}</b></span> : <b className="tabular-nums">{x.sau}</b>}
      {!gon && (o.nhanXet || x.truoc !== null) && <small className="block max-w-[18ch] text-xs text-slate-400">{x.truoc !== null ? `${t('Ghi đè')}${o.nhanXet ? ' · ' : ''}` : ''}{o.nhanXet}</small>}
      {x.canNhom && <small className="block text-xs font-semibold text-soon">{t('Nguyên nhân')}</small>}
      {x.canhBao && <small className="block text-xs text-slate-400">{x.canhBao}</small>}
    </span>
  );
}

function NhomDong({ d, ngan, thieuNhom, nhom, setNhom, khoa }: {
  d: DongXem; ngan: (k: string) => string; thieuNhom: (d: DongXem, o: ODong) => boolean; nhom: Record<string, string[]>;
  setNhom: (f: (n: Record<string, string[]>) => Record<string, string[]>) => void; khoa: (so: number, k: string) => string;
}) {
  const can = d.o.filter((o) => o.x.loai === 'ghi' && o.x.canNhom);
  if (!d.hang || !can.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {can.map((o) => {
        const id = `nn-${d.so}-${o.skill}`;
        const thieu = o.x.loai === 'ghi' && o.x.kyVong != null && o.x.band !== null ? o.x.kyVong - o.x.band : null;
        return (
          <div key={o.skill} className="flex flex-wrap items-center gap-2">
            <span id={id} className={`text-xs font-semibold ${thieuNhom(d, o) ? 'text-soon' : 'text-slate-300'}`}>
              {ngan(o.skill)} · {d.hang!.studentName}{thieu !== null ? ` · ${t('thiếu {x}', { x: thieu.toFixed(1) })}` : ''} · {t('Nhóm nguyên nhân')}
            </span>
            <ChonNhom skill={o.skill} nhanId={id} value={nhom[khoa(d.so, o.skill)] ?? []}
              onChange={(v) => setNhom((n) => ({ ...n, [khoa(d.so, o.skill)]: v }))} />
          </div>
        );
      })}
    </div>
  );
}

/** Nút ? — 6 bước + "Sao chép mẫu" (tiêu đề cột của các kỹ năng đang mở). */
function HuongDan({ cot, ngan, luuY }: { cot: readonly string[]; ngan: (k: string) => string; luuY: string }) {
  const [daChep, setDaChep] = useState<'' | 'ok' | 'loi'>('');
  const mau = [t('Tên'), ...cot.flatMap((k) => [ngan(k), t('Nhận xét {k}', { k: ngan(k) })])];
  const chep = async () => {
    try { await navigator.clipboard.writeText(`${mau.join('\t')}\n`); setDaChep('ok'); } catch { setDaChep('loi'); }
  };
  return (
    <div role="note" aria-label={t('Cách dán từ Excel')} className="rounded-md px-3 py-2 text-sm surface-2">
      <p className="font-semibold text-slate-100">{t('Cách dán từ Excel')}</p>
      <p className="text-slate-300">{t('Mỗi em một dòng: Tên, rồi từng cặp điểm · nhận xét.')}</p>
      <p className="my-1.5 flex flex-wrap gap-1 text-xs">{mau.map((c, i) => <span key={i} className="rounded border px-1.5 py-0.5" style={{ borderColor: 'var(--line-strong)' }}>{c}</span>)}</p>
      <ol className="list-decimal pl-5 text-slate-300">
        <li>{t('Chọn đúng lớp, lượt Test và kỹ năng.')}</li>
        <li>{t('Sao chép mẫu có tiêu đề cột')} (<button type="button" className="link max-sm:min-h-[44px]" onClick={() => void chep()}>{t('Sao chép mẫu')}</button>{daChep === 'ok' ? ` ✓ ${t('đã chép')}` : daChep === 'loi' ? ` · ${t('trình duyệt chặn — gõ tiêu đề theo mẫu trên')}` : ''}).</li>
        <li>{t('Điền mỗi em một dòng; điểm và nhận xét cạnh nhau theo mẫu.')}</li>
        <li>{t('Chọn vùng dữ liệu trong Excel (có hoặc không hàng tiêu đề), Ctrl C rồi Ctrl V vào khung.')}</li>
        <li>{t('Kiểm bảng: em khớp, ô mới, ô ghi đè, dòng lỗi; trùng tên thì chọn em.')}</li>
        <li>{t('Bấm Lưu: dòng hợp lệ được lưu, dòng chưa đủ còn là nháp.')}</li>
      </ol>
      <p className="mt-1.5 text-xs text-slate-400">{luuY}</p>
    </div>
  );
}
