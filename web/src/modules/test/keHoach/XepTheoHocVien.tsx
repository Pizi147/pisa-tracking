import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, invalidate } from '../../../lib/api.ts';
import { addDaysStr } from '../../../lib/format.ts';
import { useNgayNghiepVu } from '../../../ui/ngayNghiepVu.ts';
import { KhungPanel } from '../../../ui/KhungPanel.tsx';
import { LichNho } from '../../../ui/LichNho.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import { Nhan } from '../../../ui/Nhan.tsx';
import { useLoiForm } from '../../../ui/loiForm.tsx';
import { ChonLop } from '../../../ui/ChonLop.tsx';
import {
  KY_NANG_KE_HOACH, MT_TOI_DA, mondayOfDate, tenMon, tenMonNgan, thuTuLuuLuot, tuanLich,
  type BaiXemTruoc, type DongHangLoat, type KyNangKH, type LoiTruong, type OKyNang,
} from '@shared/domain/index.ts';
import type { HangFT, KnO, LopKH, LuoiFTData } from './kieu.ts';
import { TuanNho, resolveTuan, type Tuan } from './TuanNho.tsx';
/* `t` trùng tên biến tuần / hẹn giờ trong tệp → đặt tên khác. */
import { t as tChu } from '@shared/i18n/index.ts';

const KY = KY_NANG_KE_HOACH;
const TOI_DA_EM = 3;
type Hang = HangFT & { classId: number; classCode: string };
/** `/cycles/:id/suggested-mocks` (PR-LM `lichMtLoTrinh`): lịch gợi ý 6/12/16 ghép lượt thật — chỉ các trường tab này dùng. */
type HangGoiY = { attemptNo: number; periodId: number | null; weekStart: string | null; luot: { attemptId: number; kyVong: number | null; kn: KnO } | null };
type BangLich = { hang: HangGoiY[]; soKeTiep: number };
/** Nháp một lượt: tuần mới từng kỹ năng; `moi` = lượt chưa có (lưu bằng `/xep-moi`). */
type NhapLuot = { moi: boolean; kn: Partial<Record<KyNangKH, Tuan>> };
type Loc = 'tat' | 'chua' | 'xep-lai';
type KetQuaKiem = { loi: string | null; canhBao: string | null };

/** Ô sửa được ở tab này: kỹ năng bắt buộc, chưa xong, chưa có điểm, chưa thi. Ô có điểm chỉ đọc (dời ô có điểm dùng hộp một đợt). */
const suaDuoc = (o: OKyNang | undefined): o is OKyNang =>
  !!o && o.trangThai !== 'khong-yeu-cau' && o.trangThai !== 'xong' && !o.diem && o.khoa !== 'đã có điểm' && o.khoa !== 'đã làm bài';
const doiThat = (o: OKyNang | undefined, t: Tuan | undefined) => !!t && (!o || t.periodId !== o.periodId || o.sit === 'cancelled');
const coLichTiep = (h: Hang) => Object.values(h.dot).some((o) => o.trangThaiDot === 'planned' && Object.values(o.kn).some((k) => !!k?.tuan));
/** Cùng luật "Cần xếp lại" của lưới Kế hoạch Test (`LuoiKeHoach`). */
const canXepLai = (h: Hang) => Object.values(h.dot).some((d) => !d.lichSu && Object.values(d.kn).some((o) => o?.trangThai === 'vang' || o?.trangThai === 'da-huy'));
const minTuan = (ds: (string | null | undefined)[]) => ds.filter((x): x is string => !!x).map((x) => x.slice(0, 10)).sort()[0] ?? null;

/** Một hàng của bảng một em: lượt có sẵn (từ `bang`) hoặc lượt mới trong nháp. */
type Dong = { n: number; luot: HangGoiY['luot']; goiY: HangGoiY | undefined; nhap: NhapLuot | undefined };

/**
 * TAB "XẾP THEO HỌC VIÊN" (PR-XTHV, mockup MT quy trình 08/10 vấn đề 4) — panel "Xếp nhiều MT", khung Fast Track, chỉ Quản lý / Quản trị.
 * Trái: lớp · tìm em · chip "Tất cả · Chưa có MT tiếp · Cần xếp lại" · tick tối đa 3 em. Phải: mỗi em một bảng Lượt × Tuần chung × L R W S
 * × Sẽ đổi × ⋯; "+ MT{n}" và "Điền gợi ý" (lịch đề xuất của lộ trình, chỉ điền nháp ô chưa có điểm). Lưu bằng API có sẵn: lượt có sẵn
 * `/ke-hoach-test/dot`, lượt mới `/xep-moi`, theo `thuTuLuuLuot`; lượt lỗi thì dừng em đó và báo lượt đã lưu. Không đánh số lại
 * (luật 08/10: vượt thì báo). Lưu xong panel KHÔNG đóng. 375: hai màn (danh sách → chi tiết em).
 */
export function XepTheoHocVien({ lopDs, lopMoSan, tabs, onClose, onDone }: {
  lopDs: LopKH[]; lopMoSan: number | null; tabs: ReactNode; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const homNay = useNgayNghiepVu().homNay || null;
  const lopFT = useMemo(() => lopDs.filter((l) => l.loai === 'ft'), [lopDs]);
  const [lopChon, setLopChon] = useState<number[]>(() => {
    const dau = lopMoSan ?? (lopFT.length === 1 ? lopFT[0].id : undefined);
    return dau ? [dau] : [];
  });
  const [tim, setTim] = useState('');
  const [loc, setLoc] = useState<Loc>('tat');
  const [luoi, setLuoi] = useState<Map<number, LuoiFTData>>(new Map());
  const [taiLai, setTaiLai] = useState(0);
  useEffect(() => {
    let huy = false;
    Promise.all(lopChon.map((id) => api.get<LuoiFTData>(`/ke-hoach-test/ft/${id}`).then((d) => [id, d] as const)))
      .then((ds) => { if (!huy) setLuoi(new Map(ds)); })
      .catch((e) => { if (!huy) toast.push('error', e.message ?? tChu('Không tải được lớp.')); });
    return () => { huy = true; };
  }, [lopChon.join(','), taiLai]);   // eslint-disable-line react-hooks/exhaustive-deps

  const hangs: Hang[] = useMemo(() => lopChon.flatMap((id) => {
    const l = luoi.get(id);
    return l ? l.hang.map((h) => ({ ...h, classId: id, classCode: l.classCode })) : [];
  }).sort((a, b) => a.classCode.localeCompare(b.classCode, 'vi') || a.ten.localeCompare(b.ten, 'vi')), [luoi, lopChon]);
  const khopTim = (h: Hang) => !tim.trim() || `${h.ten} ${h.ma}`.toLowerCase().includes(tim.trim().toLowerCase());
  const dem = { tat: hangs.length, chua: hangs.filter((h) => !coLichTiep(h)).length, 'xep-lai': hangs.filter(canXepLai).length };
  const hienThi = hangs.filter((h) => khopTim(h) && (loc === 'tat' || (loc === 'chua' ? !coLichTiep(h) : canXepLai(h))));

  /* Em đã tick (theo thứ tự tick) + bảng lịch MT của từng em. */
  const [chon, setChon] = useState<number[]>([]);
  const [bang, setBang] = useState<Map<number, BangLich | { loi: string }>>(new Map());
  const taiBang = (ids: number[]) => {
    for (const sid of ids) {
      const h = hangs.find((x) => x.studentId === sid);
      if (!h?.cycleId) { setBang((m) => new Map(m).set(sid, { loi: tChu('Em chưa có lộ trình đang chạy.') })); continue; }
      api.get<BangLich>(`/cycles/${h.cycleId}/suggested-mocks`)
        .then((b) => setBang((m) => new Map(m).set(sid, b)))
        .catch((e) => setBang((m) => new Map(m).set(sid, { loi: e.message ?? tChu('Không tải được lịch MT.') })));
    }
  };
  const doiChon = (sid: number, v: boolean) => {
    setChon((s) => (v ? (s.length >= TOI_DA_EM || s.includes(sid) ? s : [...s, sid]) : s.filter((x) => x !== sid)));
    if (v && !bang.has(sid)) taiBang([sid]);
  };

  /* Nháp: em → số MT → nháp lượt. Kết quả kiểm trước (máy chủ) theo `${em}:${n}`. Lỗi lưu / đã lưu theo em. */
  const [nhap, setNhap] = useState<Record<number, Record<number, NhapLuot>>>({});
  const [kiem, setKiem] = useState<Record<string, KetQuaKiem>>({});
  const [loiLuu, setLoiLuu] = useState<Record<number, string>>({});
  const [daLuu, setDaLuu] = useState<Set<number>>(new Set());
  const datNhap = (sid: number, n: number, f: (x: NhapLuot | undefined) => NhapLuot | undefined) => {
    setNhap((s) => {
      const em = { ...(s[sid] ?? {}) };
      const x = f(em[n]);
      if (x) em[n] = x; else delete em[n];
      return { ...s, [sid]: em };
    });
    setDaLuu((s) => { const m = new Set(s); m.delete(sid); return m; });
  };

  const dongCua = (sid: number): Dong[] => {
    const b = bang.get(sid);
    if (!b || 'loi' in b) return [];
    const ns = new Set([...b.hang.filter((g) => g.luot && g.attemptNo > 0).map((g) => g.attemptNo),
      ...Object.keys(nhap[sid] ?? {}).map(Number)]);
    return [...ns].sort((x, y) => x - y).map((n) => {
      const g = b.hang.find((x) => x.attemptNo === n);
      return { n, luot: g?.luot ?? null, goiY: g, nhap: nhap[sid]?.[n] };
    });
  };
  /* Một lượt có đổi thật không (nháp trùng tuần đang có thì không tính). */
  const coDoi = (d: Dong) => !!d.nhap && (d.nhap.moi
    ? KY.every((k) => !!d.nhap!.kn[k])
    : KY.some((k) => doiThat(d.luot?.kn[k], d.nhap!.kn[k])));
  const thieuTuan = (d: Dong) => !!d.nhap?.moi && KY.some((k) => !d.nhap!.kn[k]);
  const doiCua = (sid: number) => dongCua(sid).filter(coDoi);
  const emCoDoi = chon.filter((sid) => doiCua(sid).length > 0);
  const soThayDoi = emCoDoi.reduce((s, sid) => s + doiCua(sid).length, 0);
  /* Ô bắt buộc duy nhất: lượt mới phải đủ tuần 4 kỹ năng (PR-N1: báo sau khi bấm Lưu, "n ô cần sửa ↑"). */
  const lf = useLoiForm();
  const loiO: LoiTruong[] = chon.flatMap((sid) => dongCua(sid).filter(thieuTuan).map((d) => ({
    khoa: `xthv-${sid}-${d.n}`, nhan: `MT${d.n} · ${hangs.find((h) => h.studentId === sid)?.ten ?? ''}`, lyDo: tChu('Chọn tuần cho đủ 4 kỹ năng.'),
  })));
  const coThieu = loiO.length > 0;

  /* KIỂM TRƯỚC (máy chủ, không ghi): lượt có sẵn → `/dot/kiem`; lượt mới đầu tiên của em → `/hang-loat` xem trước. Lượt mới sau đó
     phụ thuộc lượt trước chưa có, nên kiểm khi lưu. Mỗi lượt kiểm riêng trên dữ liệu hiện tại. */
  const khoaKiem = JSON.stringify(chon.map((sid) => [sid, doiCua(sid).map((d) => [d.n, d.nhap])]));
  const soKiem = useRef(0);
  useEffect(() => {
    const seq = ++soKiem.current;
    const t = setTimeout(() => {
      const viec: Promise<[string, KetQuaKiem]>[] = [];
      for (const sid of chon) {
        const h = hangs.find((x) => x.studentId === sid);
        const ds = doiCua(sid);
        const moiDau = ds.filter((d) => d.nhap!.moi).map((d) => d.n)[0];
        for (const d of ds) {
          const khoa = `${sid}:${d.n}`;
          const gom = (bai: BaiXemTruoc[], loi: string | null): KetQuaKiem => ({
            loi: loi ?? cauChan(bai.filter((x) => x.ghiChu === 'chan')),
            canhBao: [...new Set(bai.filter((x) => x.ghiChu === 'canh-bao').map((x) => x.cau))].join(' ') || null,
          });
          if (!d.nhap!.moi && d.luot) {
            const kyNang = KY.filter((k) => doiThat(d.luot!.kn[k], d.nhap!.kn[k])).map((k) => ({ skill: k, periodId: d.nhap!.kn[k]!.periodId }));
            viec.push(api.post<{ bai: BaiXemTruoc[] }>('/ke-hoach-test/dot/kiem', { attemptId: d.luot.attemptId, kyNang })
              .then((r): [string, KetQuaKiem] => [khoa, gom(r.bai, null)])
              .catch((e): [string, KetQuaKiem] => [khoa, { loi: e.message ?? tChu('Không kiểm được.'), canhBao: null }]));
          } else if (d.n === moiDau && h) {
            const tuan = Object.fromEntries(KY.map((k) => [k, d.nhap!.kn[k]!.periodId]));
            viec.push(api.post<{ dong: DongHangLoat[] }>('/ke-hoach-test/hang-loat', {
              classId: h.classId, studentIds: [sid], attemptNo: d.n, kyNang: [...KY], tuan, xemTruoc: true,
            }).then((r): [string, KetQuaKiem] => {
              const x = r.dong[0];
              return [khoa, x ? gom(x.bai, x.hanhDong === 'loi' ? x.loi ?? tChu('Không xếp được.') : null) : { loi: null, canhBao: null }];
            }).catch((e): [string, KetQuaKiem] => [khoa, { loi: e.message ?? tChu('Không kiểm được.'), canhBao: null }]));
          }
        }
      }
      void Promise.all(viec).then((kq) => { if (seq === soKiem.current) setKiem(Object.fromEntries(kq)); });
    }, 400);
    return () => clearTimeout(t);
  }, [khoaKiem]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* "+ MT{n}": lượt kế tiếp sau lượt lớn nhất (có sẵn hoặc nháp). Tuần mặc định: tuần gợi ý của lộ trình; ngoài lịch gợi ý thì 4 tuần sau lượt trước. */
  const soMoi = (sid: number) => {
    const b = bang.get(sid);
    if (!b || 'loi' in b) return null;
    const n = Math.max(b.soKeTiep, ...dongCua(sid).map((d) => d.n + 1));
    return n <= MT_TOI_DA ? n : null;
  };
  const themMt = async (sid: number) => {
    const n = soMoi(sid);
    if (!n) return;
    const goi = (bang.get(sid) as BangLich).hang.find((x) => x.attemptNo === n);
    const muonNhat = dongCua(sid).filter((d) => d.n === n - 1)
      .flatMap((d) => KY.map((k) => d.nhap?.kn[k]?.weekStart ?? d.luot?.kn[k]?.tuan)).filter((x): x is string => !!x).sort().pop();
    let t: Tuan | null = goi?.periodId && goi.weekStart ? { periodId: goi.periodId, weekStart: goi.weekStart } : null;
    if (!t && muonNhat) t = await resolveTuan(addDaysStr(mondayOfDate(muonNhat), 28)).catch(() => null);
    datNhap(sid, n, () => ({ moi: true, kn: t ? Object.fromEntries(KY.map((k) => [k, t])) : {} }));
  };

  /* "Điền gợi ý": tuần đề xuất của lộ trình (LT 6/12/16, RF 4/8) — chỉ ô chưa có điểm, chỉ tuần từ tuần này trở đi; lượt chưa có thì thêm nháp. */
  const dienGoiY = (sid: number) => {
    const b = bang.get(sid);
    if (!b || 'loi' in b || !homNay) return;
    const tuanNay = mondayOfDate(homNay);
    const goiY = b.hang.filter((g) => g.attemptNo > 0 && g.periodId && g.weekStart && g.weekStart.slice(0, 10) >= tuanNay);
    if (!goiY.length) { toast.push('error', tChu('Lộ trình chưa có lịch gợi ý từ tuần này trở đi (chưa khai tuần bắt đầu, hoặc đã qua MT cuối).')); return; }
    let them = 0;
    for (const g of goiY) {
      const t: Tuan = { periodId: g.periodId!, weekStart: g.weekStart! };
      if (g.luot) {
        const ks = KY.filter((k) => suaDuoc(g.luot!.kn[k]) && g.luot!.kn[k]!.periodId !== t.periodId);
        if (!ks.length) continue;
        datNhap(sid, g.attemptNo, (x) => ({ moi: false, kn: { ...(x?.kn ?? {}), ...Object.fromEntries(ks.map((k) => [k, t])) } }));
        them++;
      } else if (g.attemptNo >= b.soKeTiep) {
        datNhap(sid, g.attemptNo, () => ({ moi: true, kn: Object.fromEntries(KY.map((k) => [k, t])) }));
        them++;
      }
    }
    if (!them) toast.push('ok', tChu('Lịch đã khớp gợi ý — không có gì để điền.'));
  };

  /* LƯU: từng em; trong một em theo `thuTuLuuLuot`, dừng ở lượt lỗi và giữ nháp các lượt chưa lưu. Panel không đóng. */
  const [busy, setBusy] = useState(false);
  const [chiTiet, setChiTiet] = useState(false);
  const luu = async () => {
    lf.bam();
    if (busy || !emCoDoi.length || coThieu) return;
    setBusy(true);
    let ok = 0;
    const loi: Record<number, string> = {};
    const xong = new Set<number>();
    try {
      for (const sid of emCoDoi) {
        const buoc = thuTuLuuLuot(doiCua(sid).map((d) => {
          /* Cùng một bộ kỹ năng (bắt buộc) cho tuần trước và sau khi sửa, để so chiều dời cho đúng. */
          const ks = KY.filter((k) => d.nhap!.moi || (d.luot?.kn[k] && d.luot.kn[k]!.trangThai !== 'khong-yeu-cau'));
          return {
            d, attemptNo: d.n, taoMoi: d.nhap!.moi,
            cu: d.luot ? minTuan(ks.map((k) => d.luot!.kn[k]?.tuan)) : null,
            moi: minTuan(ks.map((k) => d.nhap!.kn[k]?.weekStart ?? d.luot?.kn[k]?.tuan)) ?? '',
          };
        }));
        const da: number[] = [];
        for (const { d } of buoc) {
          try {
            if (d.nhap!.moi) {
              await api.post('/ke-hoach-test/xep-moi', {
                studentId: sid, attemptNo: d.n, tuan: Object.fromEntries(KY.map((k) => [k, d.nhap!.kn[k]!.periodId])), force: true,
              });
            } else {
              await api.post('/ke-hoach-test/dot', {
                attemptId: d.luot!.attemptId, force: true,
                kyNang: KY.filter((k) => doiThat(d.luot!.kn[k], d.nhap!.kn[k])).map((k) => ({ skill: k, periodId: d.nhap!.kn[k]!.periodId })),
              });
            }
            da.push(d.n);
          } catch (e: any) {
            /* Câu lỗi đã hiện ở hàng (kiểm trước) thì không nhắc lại nguyên văn. */
            const daBao = !!kiem[`${sid}:${d.n}`]?.loi;
            loi[sid] = (da.length ? tChu('Đã lưu {maMt}.', { maMt: da.map((n) => `MT${n}`).join(', ') }) + ' ' : '')
              + (daBao ? tChu('MT{n} chưa lưu — xem lỗi ở hàng MT{n}.', { n: d.n }) : tChu('MT{n} chưa lưu: {loi}', { n: d.n, loi: e.message ?? tChu('lỗi không rõ.') }));
            break;
          }
        }
        /* Bỏ nháp các lượt đã lưu; lượt lỗi và lượt sau nó giữ nguyên để sửa rồi lưu lại. */
        setNhap((s) => { const em = { ...(s[sid] ?? {}) }; for (const n of da) delete em[n]; return { ...s, [sid]: em }; });
        if (!loi[sid]) { ok++; xong.add(sid); }
      }
      invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham'); invalidate('/cycles');
      setLoiLuu(loi);
      setDaLuu(xong);
      taiBang(emCoDoi);
      setTaiLai((n) => n + 1);
      onDone();
      const soLoi = Object.keys(loi).length;
      toast.push(ok ? 'ok' : 'error', ok ? tChu('Đã lưu lịch {n} em.', { n: ok }) + (soLoi ? ' ' + tChu('{n} em còn lỗi.', { n: soLoi }) : '') : tChu('{n} em chưa lưu được — xem câu lỗi dưới tên em.', { n: soLoi }));
    } finally { setBusy(false); }
  };

  const huyNhap = () => { setNhap({}); setKiem({}); setLoiLuu({}); };
  const soLoiKiem = emCoDoi.filter((sid) => doiCua(sid).some((d) => kiem[`${sid}:${d.n}`]?.loi)).length;
  const nutLuu = (
    <button type="button" className={`btn btn-primary min-h-[44px] sm:min-h-0 ${chiTiet ? '' : 'max-sm:hidden'}`} onClick={() => void luu()}
      disabled={busy || !emCoDoi.length}>
      {busy ? tChu('Đang lưu…') : tChu('Lưu {n} em · {m} thay đổi', { n: emCoDoi.length, m: soThayDoi })}
    </button>
  );
  const nutXep = !chiTiet && (
    <button type="button" className="btn btn-primary min-h-[44px] sm:hidden" disabled={!chon.length} onClick={() => setChiTiet(true)}>{tChu('Xếp {n} em ›', { n: chon.length })}</button>
  );

  return (
    <KhungPanel tieuDe={tChu('Xếp lịch Mock Test')} rong="toan" onDong={onClose} tabs={tabs}
      chan={{
        huy: soThayDoi ? { nhan: tChu('Huỷ thay đổi'), onClick: huyNhap } : { nhan: tChu('Đóng'), onClick: onClose }, daSua: soThayDoi > 0,
        phu: soLoiKiem ? <span className="text-xs text-bad">{tChu('{n} em còn lỗi', { n: soLoiKiem })}</span> : undefined,
        chinh: <>{nutXep}{nutLuu}</>, conThieu: lf.conThieu(loiO),
      }}>
      <div className="grid gap-4 pt-3 sm:grid-cols-[300px_minmax(0,1fr)]">
        <aside className={`min-w-0 space-y-2 ${chiTiet ? 'max-sm:hidden' : ''}`} aria-label={tChu('Danh sách học viên')}>
          <div role="group" aria-label={tChu('Lớp')} className="flex flex-wrap items-center gap-1.5">
            {lopChon.map((id) => {
              const l = lopFT.find((x) => x.id === id);
              return (
                <span key={id} className="inline-flex h-7 items-center gap-1 rounded border px-2 text-xs text-slate-200" style={{ borderColor: 'var(--line-strong)' }}>
                  {l?.code ?? id}
                  <button type="button" className="btn btn-sm btn-ghost relative -mr-1 min-h-[28px] min-w-[28px] justify-center px-0 max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
                    aria-label={tChu('Bỏ lớp {ma}', { ma: l?.code ?? id })} onClick={() => setLopChon((s) => s.filter((x) => x !== id))}>✕</button>
                </span>
              );
            })}
            {lopFT.some((l) => !lopChon.includes(l.id)) && (
              <ChonLop noi className="w-44 max-sm:w-full" ariaLabel={tChu('Thêm lớp')} value={null} placeholder={lopChon.length ? tChu('+ lớp') : tChu('Gõ tên lớp…')}
                onChange={(id) => { if (id) setLopChon((s) => [...s, id]); }}
                ds={lopFT.filter((l) => !lopChon.includes(l.id)).map((l) => ({ id: l.id, ma: l.code, phu: tChu('{n} em', { n: l.soHv }) }))} />
            )}
          </div>
          {!lopChon.length ? (
            <div className="rounded-[10px] border px-3 py-6 text-center text-xs text-slate-400" style={{ borderColor: 'var(--line)' }}>
              <b className="block text-slate-200">{tChu('Chọn lớp để xếp lịch')}</b>{tChu('Sau đó tick 1–3 học viên.')}
            </div>
          ) : (
            <>
              <label className="block">
                <span className="sr-only">{tChu('Tìm học viên')}</span>
                <input className="field w-full" value={tim} onChange={(e) => setTim(e.target.value)} placeholder={tChu('Tìm học viên · tên hoặc mã')} />
              </label>
              <div role="group" aria-label={tChu('Lọc học viên')} className="flex flex-wrap gap-1.5">
                {([['tat', tChu('Tất cả')], ['chua', tChu('Chưa có MT tiếp')], ['xep-lai', tChu('Cần xếp lại')]] as const).map(([k, nhan]) => (
                  <button key={k} type="button" aria-pressed={loc === k} onClick={() => setLoc(k)}
                    className={`nut-loc tabular-nums ${loc === k ? 'border-doing-line bg-doing-bg text-doing' : ''}`}>{nhan} {dem[k]}</button>
                ))}
              </div>
              {!luoi.size ? <div className="text-xs text-slate-500">{tChu('Đang tải lớp…')}</div> : (
                <ul className="m-0 list-none space-y-1 p-0">
                  {hienThi.map((h) => {
                    const da = chon.includes(h.studentId);
                    const het = !da && chon.length >= TOI_DA_EM;
                    const mt = Object.entries(h.dot).filter(([, o]) => o.attemptId).slice(-2);
                    return (
                      <li key={h.studentId}>
                        <label className={`flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-2 ${da ? 'border-doing-line bg-doing-bg' : ''} ${het ? 'cursor-not-allowed opacity-60' : ''}`}
                          style={da ? undefined : { borderColor: 'var(--line)' }} title={het ? tChu('Chọn tối đa {n} em một lần.', { n: TOI_DA_EM }) : undefined}>
                          <input type="checkbox" className="mt-0.5 h-4 w-4 flex-none accent-sky-400 max-sm:h-5 max-sm:w-5" checked={da} disabled={het}
                            onChange={(e) => doiChon(h.studentId, e.target.checked)} aria-label={tChu('Chọn {ten}', { ten: h.ten })} />
                          <span className="min-w-0 flex-1">
                            <span className="font-bold text-slate-100">{h.ten}</span> {lopChon.length > 1 && <span className="text-xs text-slate-500">{h.classCode}</span>}
                            <span className="mt-1 flex flex-wrap gap-1">
                              {mt.map(([n, o]) => {
                                const t = minTuan(Object.values(o.kn).map((k) => k?.tuan));
                                const xepLai = !o.lichSu && Object.values(o.kn).some((k) => k?.trangThai === 'vang' || k?.trangThai === 'da-huy');
                                return <Nhan key={n} tone={xepLai ? 'soon' : o.trangThaiDot === 'xong' ? 'done' : 'muted'}>MT{n} · {xepLai ? tChu('cần xếp lại') : t ? tuanLich(t, homNay) : tChu('chưa xếp')}</Nhan>;
                              })}
                              {!mt.length && <Nhan tone="muted">{tChu('Chưa có MT')}</Nhan>}
                              {daLuu.has(h.studentId) && <Nhan tone="ok">{tChu('Đã lưu')}</Nhan>}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                  {!hienThi.length && <li className="px-1 py-2 text-xs text-slate-500">{tChu('Không có em.')}</li>}
                </ul>
              )}
              <p className="m-0 text-xs text-slate-500">{tChu('Chọn tối đa {n} em một lần.', { n: TOI_DA_EM })}</p>
            </>
          )}
        </aside>

        <main className={`min-w-0 space-y-3 ${chiTiet ? '' : 'max-sm:hidden'}`}>
          <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:hidden" onClick={() => setChiTiet(false)}>{tChu('‹ Danh sách')}</button>
          {!chon.length && <div className="rounded-[10px] border px-3 py-8 text-center text-xs text-slate-500" style={{ borderColor: 'var(--line)' }}>{tChu('Tick 1–3 học viên ở cột trái để xếp lịch.')}</div>}
          {chon.map((sid) => {
            const h = hangs.find((x) => x.studentId === sid);
            const b = bang.get(sid);
            const ds = dongCua(sid);
            const n = soMoi(sid);
            return (
              <section key={sid} className="rounded-[10px] border" style={{ borderColor: 'var(--line)' }} aria-label={h?.ten}>
                <header className="flex flex-wrap items-baseline gap-x-2 border-b px-3 py-2" style={{ borderColor: 'var(--line)' }}>
                  <b className="text-sm text-slate-100">{h?.ten ?? sid}</b>
                  {h && <span className="text-xs text-slate-500">{h.classCode}</span>}
                </header>
                {!b ? <div className="px-3 py-3 text-xs text-slate-500">{tChu('Đang tải lịch MT…')}</div>
                  : 'loi' in b ? <div className="px-3 py-3 text-xs text-bad">{b.loi}</div> : (
                    <>
                      <BangEm sid={sid} ds={ds} homNay={homNay} kiem={kiem} lf={lf} loiO={loiO}
                        onTuan={(n2, ks, t) => datNhap(sid, n2, (x) => ({ moi: x?.moi ?? false, kn: { ...(x?.kn ?? {}), ...Object.fromEntries(ks.map((k) => [k, t])) } }))}
                        onBo={(n2) => datNhap(sid, n2, () => undefined)} />
                      <div className="flex flex-wrap gap-2 px-3 py-2">
                        {n && <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => void themMt(sid)}>+ MT{n}</button>}
                        <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => dienGoiY(sid)}
                          title={tChu('Theo lịch đề xuất của lộ trình (MT ở tuần học 6/12/16; RF 4/8). Chỉ điền nháp ô chưa có điểm.')}>{tChu('Điền gợi ý')}</button>
                      </div>
                      {loiLuu[sid] && <p role="alert" className="m-0 px-3 pb-2 text-xs text-bad">{loiLuu[sid]}</p>}
                    </>
                  )}
              </section>
            );
          })}
        </main>
      </div>
    </KhungPanel>
  );
}

/** Bảng một em (màn rộng) / thẻ từng lượt (điện thoại). */
function BangEm({ sid, ds, homNay, kiem, lf, loiO, onTuan, onBo }: {
  sid: number; ds: Dong[]; homNay: string | null; kiem: Record<string, KetQuaKiem>; lf: ReturnType<typeof useLoiForm>; loiO: LoiTruong[];
  onTuan: (n: number, ks: KyNangKH[], t: Tuan) => void; onBo: (n: number) => void;
}) {
  if (!ds.length) return <div className="px-3 py-3 text-xs text-slate-500">{tChu('Chưa có MT nào. Bấm "+ MT" hoặc "Điền gợi ý".')}</div>;
  const hang = ds.map((d) => {
    const ks = KY.filter((k) => (d.nhap?.moi ? true : suaDuoc(d.luot?.kn[k])));
    const tuanKn = (k: KyNangKH) => d.nhap?.kn[k] ?? (d.luot?.kn[k]?.periodId && d.luot.kn[k]!.tuan ? { periodId: d.luot.kn[k]!.periodId!, weekStart: d.luot.kn[k]!.tuan! } : undefined);
    const tuanSua = ks.map((k) => tuanKn(k)?.weekStart?.slice(0, 10) ?? '');
    const chung = ks.length && tuanSua.every((x) => x && x === tuanSua[0]) ? tuanKn(ks[0])! : null;
    const doi = d.nhap ? KY.filter((k) => (d.nhap!.moi ? !!d.nhap!.kn[k] : doiThat(d.luot?.kn[k], d.nhap!.kn[k]))) : [];
    const seDoi = d.nhap?.moi
      ? `${tChu('Tạo mới')}${chung ? ` · ${tuanLich(chung.weekStart, homNay)}` : KY.some((k) => !d.nhap!.kn[k]) ? ` · ${tChu('chọn tuần')}` : ''}`
      : doi.length ? gomTheoTuan(doi, (k) => d.nhap!.kn[k]!.weekStart).map(([t, kk]) => {
        const khoiPhuc = kk.some((k) => d.luot?.kn[k]?.sit === 'cancelled');
        return `${kk.map((k) => tenMonNgan(null, k)).join(' ')}: ${khoiPhuc ? `${tChu('Khôi phục')} → ` : ''}${tuanLich(t, homNay)}`;
      }).join(' · ') : '—';
    return { d, ks, tuanKn, chung, doi, seDoi, kq: kiem[`${sid}:${d.n}`] };
  });
  const oKn = (x: (typeof hang)[number], k: (typeof KY)[number]) => {
    const o = x.d.luot?.kn[k];
    if (!x.ks.includes(k)) {
      if (!o || o.trangThai === 'khong-yeu-cau') return <span className="text-slate-500">—</span>;
      return <span className="tabular-nums text-slate-400">{o.tuan ? tuanLich(o.tuan, homNay) : '—'}{o.diem ? ` · ${o.diem}` : ''}</span>;
    }
    return <OTuan t={x.tuanKn(k)} doi={x.doi.includes(k)} homNay={homNay} nhan={`${tenMon(null, k)} MT${x.d.n}`} onTuan={(t) => onTuan(x.d.n, [k], t)} />;
  };
  const cau = (x: (typeof hang)[number]) => (
    <>
      {x.kq?.loi && <p className="m-0 text-xs text-bad">MT{x.d.n}: {x.kq.loi}</p>}
      {!x.kq?.loi && x.kq?.canhBao && <p className="m-0 text-xs text-soon">MT{x.d.n}: {x.kq.canhBao}</p>}
    </>
  );
  const menu = (x: (typeof hang)[number]) => x.d.nhap && (
    <MenuDong nhan={x.d.nhap.moi ? tChu('Bỏ MT{n}', { n: x.d.n }) : tChu('Bỏ thay đổi')} aria={tChu('Thao tác MT{n}', { n: x.d.n })} onClick={() => onBo(x.d.n)} />
  );
  const tuanChung = (x: (typeof hang)[number]) => {
    if (!x.ks.length) return <span className="text-xs text-slate-500">{tChu('Không còn ô sửa được')}</span>;
    const khoa = `xthv-${sid}-${x.d.n}`;
    const loi = lf.loiCua(loiO, khoa);
    return (
      <div {...lf.o(loiO, khoa)} tabIndex={-1} className={x.doi.length ? 'rounded ring-1 ring-[color:var(--doing-line,var(--accent))]' : ''}>
        <TuanNho nam gon d={{ periodId: x.chung?.periodId ?? null, weekStart: x.chung?.weekStart ?? null }} goc={homNay} onTuan={(t) => onTuan(x.d.n, x.ks, t)} />
        {loi && <p className="m-0 mt-0.5 text-xs text-bad">{loi}</p>}
      </div>
    );
  };

  return (
    <>
      <div className="overflow-x-auto max-sm:hidden">
        <table className="w-full min-w-[860px] border-separate border-spacing-0 text-xs" aria-label={tChu('Lịch MT của em')}>
          <thead>
            <tr className="text-left text-xs  text-slate-500">
              {[tChu('Lượt'), tChu('Tuần chung'), ...KY.map((k) => tenMonNgan(null, k)), tChu('Sẽ đổi'), ''].map((c, i) => (
                <th key={i} className={`px-2.5 py-2 font-semibold ${i === 1 ? 'w-[230px]' : ''}`} style={{ background: 'var(--surface-2)' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hang.map((x) => (
              <tr key={x.d.n} className="align-middle">
                <td className="whitespace-nowrap border-t px-2.5 py-1.5" style={{ borderColor: 'var(--line)' }}>
                  <b className="text-slate-100">MT{x.d.n}</b>
                  {x.d.luot?.kyVong != null && <div className="text-xs text-slate-500">{tChu('kỳ vọng {kv}', { kv: x.d.luot.kyVong.toFixed(1) })}</div>}
                </td>
                <td className="border-t px-2.5 py-1.5" style={{ borderColor: 'var(--line)' }}>{tuanChung(x)}</td>
                {KY.map((k) => <td key={k} className="whitespace-nowrap border-t px-2.5 py-1.5" style={{ borderColor: 'var(--line)' }}>{oKn(x, k)}</td>)}
                <td className="border-t px-2.5 py-1.5 text-slate-300" style={{ borderColor: 'var(--line)' }}>{x.seDoi}{cau(x)}</td>
                <td className="w-[44px] border-t px-1 py-1.5" style={{ borderColor: 'var(--line)' }}>{menu(x)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 p-2 sm:hidden">
        {hang.map((x) => (
          <div key={x.d.n} className="rounded-lg border p-2" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2">
              <b className="text-slate-100">MT{x.d.n}</b>
              <span className="text-xs text-slate-500">{x.d.nhap?.moi ? tChu('Tạo mới') : x.d.luot?.kyVong != null ? tChu('kỳ vọng {kv}', { kv: x.d.luot.kyVong.toFixed(1) }) : ''}</span>
              <span className="ml-auto">{menu(x)}</span>
            </div>
            <div className="mt-1.5">{tuanChung(x)}</div>
            <ul className="m-0 mt-1.5 list-none space-y-1 p-0 text-xs">
              {KY.map((k) => (
                <li key={k} className="flex min-h-[44px] items-center justify-between gap-2">
                  <span className="text-slate-200"><b>{tenMonNgan(null, k)}</b> {tenMon(null, k)}</span>{oKn(x, k)}
                </li>
              ))}
            </ul>
            <div className="mt-1 text-xs text-slate-400">{x.seDoi !== '—' && x.seDoi}{cau(x)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/** Câu chặn của nhiều kỹ năng: cùng một câu thì nói một lần, khác nhau thì ghi theo kỹ năng. */
const cauChan = (bai: BaiXemTruoc[]): string | null => {
  const cau = [...new Set(bai.map((x) => x.cau ?? ''))];
  if (!bai.length) return null;
  return cau.length === 1 ? cau[0] : bai.map((x) => `${tenMonNgan(null, x.skill)}: ${x.cau}`).join(' ');
};

const gomTheoTuan = (ks: KyNangKH[], tuan: (k: KyNangKH) => string): [string, KyNangKH[]][] => {
  const m = new Map<string, KyNangKH[]>();
  for (const k of ks) m.set(tuan(k), [...(m.get(tuan(k)) ?? []), k]);
  return [...m.entries()];
};

/** Ô tuần một kỹ năng: nút mã tuần, bấm mở lịch tháng (`LichNho`). Ô đã đổi có viền + ✓. */
function OTuan({ t, doi, homNay, nhan, onTuan }: { t: Tuan | undefined; doi: boolean; homNay: string | null; nhan: string; onTuan: (t: Tuan) => void }) {
  const [mo, setMo] = useState(false);
  const neo = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={neo} type="button" aria-haspopup="dialog" aria-expanded={mo} aria-label={tChu('{nhan}: {tuan} — đổi tuần', { nhan, tuan: t ? tuanLich(t.weekStart, homNay) : tChu('chưa chọn tuần') })}
        onClick={() => setMo((v) => !v)}
        className={`field inline-flex !w-auto min-h-[44px] items-center gap-1 whitespace-nowrap px-2 py-0 text-xs tabular-nums sm:min-h-[28px] ${doi ? 'border-doing-line bg-doing-bg text-doing' : 'text-slate-100'}`}>
        {t ? tuanLich(t.weekStart, homNay) : tChu('Chọn tuần')}{doi && <span aria-hidden> ✓</span>}
      </button>
      {mo && homNay && (
        <LichNho kieu="tuan" goNgay value={t?.weekStart ?? null} homNay={homNay} luat={{}} neo={neo}
          onChon={(w) => { void resolveTuan(w).then((x) => { onTuan(x); setMo(false); }).catch(() => { /* giữ tuần cũ */ }); }} onDong={() => setMo(false)} />
      )}
    </>
  );
}

/** Nút ⋯ của một hàng: một thao tác (bỏ thay đổi / bỏ MT mới trong nháp). */
function MenuDong({ nhan, aria, onClick }: { nhan: string; aria: string; onClick: () => void }) {
  const [mo, setMo] = useState(false);
  return (
    <span className="relative inline-block">
      <button type="button" className="btn btn-sm btn-ghost min-h-[44px] min-w-[44px] justify-center sm:min-h-[28px] sm:min-w-[28px]" aria-label={aria} aria-expanded={mo}
        onClick={() => setMo((v) => !v)}>⋯</button>
      {mo && (
        <span className="absolute right-0 top-full z-10 mt-1 block rounded-lg border p-1 shadow-xl" style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
          <button type="button" className="btn btn-sm btn-ghost min-h-[44px] whitespace-nowrap sm:min-h-[32px]" onClick={() => { setMo(false); onClick(); }}>{nhan}</button>
        </span>
      )}
    </span>
  );
}
