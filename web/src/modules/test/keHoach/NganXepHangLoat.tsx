import { useEffect, useMemo, useRef, useState } from 'react';
import { api, invalidate } from '../../../lib/api.ts';
import { useApi } from '../../../lib/useApi.ts';
import { useSession } from '../../../lib/session.tsx';
import { addDaysStr } from '../../../lib/format.ts';
import { KhungPanel, Khoi } from '../../../ui/KhungPanel.tsx';
import { Nhan, type ToneNhan } from '../../../ui/Nhan.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import {
  emGiuLaiSauLuu, gomBaiXemTruoc, gomChip, mondayOfDate, nhanTuanKhoa, tomTatHangLoat, tuanLich,
  type BaiXemTruoc, type DongHangLoat, type KyNangKH,
} from '@shared/domain/index.ts';
import {
  KY, TEN_KY_NANG, chuKyNang, chuTinhTrang, dotCuaEm, emXongDot, khoaDot, nhanDot, thanDot,
  type DotChon, type LuoiFTData, type LuoiThuongData,
} from './kieu.ts';
import { TuanNho, resolveTuan, type Tuan } from './TuanNho.tsx';

const TONE_GHI_CHU: Record<BaiXemTruoc['ghiChu'], { tone: ToneNhan; chu: string }> = {
  moi: { tone: 'muted', chu: 'Mới' }, doi: { tone: 'doing', chu: 'Đổi' }, giu: { tone: 'muted', chu: 'Giữ' },
  'canh-bao': { tone: 'soon', chu: 'Cảnh báo' }, chan: { tone: 'bad', chu: 'Chặn' },
};

type Hang = { studentId: number; ten: string; o: (d: DotChon) => { attemptId: number | null; kn: Parameters<typeof gomChip>[0] } };

/**
 * XẾP LỊCH HÀNG LOẠT (R9, mockup 14 (3)) — `KhungPanel` rộng 720px, bốn khối trên MỘT màn: Đợt · Học viên · Kỹ năng ·
 * Xem trước; chân dính: Đóng trái, `Lưu lịch cho {a} em · {b} bài` phải. Dùng chung cho FT (đợt = MT{n}) và lớp thường
 * (đợt = Giữa khoá / Cuối khoá). TỰ TẢI lưới của lớp — không nhận lưới từ cha.
 *
 * Xem trước gọi `/ke-hoach-test/hang-loat` với `xemTruoc:true` mỗi khi khối 1–3 đổi. Lưu theo EM (Q1): em có bài bị chặn
 * thì cả em không lưu. R9b: lưu xong mà còn em lỗi thì panel KHÔNG đóng và chỉ còn các em đó — tick mặc định chỉ đặt MỘT
 * LẦN khi đổi đợt (không theo dữ liệu lưới), nên lưới tải lại sau khi lưu không ghi đè danh sách "chỉ em lỗi".
 */
export function NganXepHangLoat({ loai, classId, classCode, onClose, onDone }: {
  loai: 'ft' | 'thuong'; classId: number; classCode: string; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const { session } = useSession();
  const ft = useApi<LuoiFTData>(loai === 'ft' ? `/ke-hoach-test/ft/${classId}` : null);
  const th = useApi<LuoiThuongData>(loai === 'thuong' ? `/ke-hoach-test/thuong/${classId}` : null);
  const sanSang = loai === 'ft' ? !!ft.data : !!th.data;

  const dots: DotChon[] = useMemo(() => {
    if (loai === 'ft') return (ft.data?.cot ?? []).map((n) => ({ loai: 'ft' as const, attemptNo: n }));
    return (th.data?.cot ?? []).map((c) => ({ loai: 'thuong' as const, kind: c.kind }));
  }, [loai, ft.data, th.data]);

  const hangs: Hang[] = useMemo(() => {
    if (loai === 'ft') {
      return (ft.data?.hang ?? []).map((h) => ({ studentId: h.studentId, ten: h.ten, o: (d) => dotCuaEm({ loai: 'ft', luoi: ft.data!, hang: h }, d) }));
    }
    return (th.data?.hang ?? []).map((h) => ({ studentId: h.studentId, ten: h.ten, o: (d) => dotCuaEm({ loai: 'thuong', luoi: th.data!, hang: h }, d) }));
  }, [loai, ft.data, th.data]);

  const dotXongCaLop = (d: DotChon) => hangs.length > 0 && hangs.every((h) => emXongDot(h.o(d)));
  const dotConXep = useMemo(() => dots.filter((d) => !dotXongCaLop(d)), [dots, hangs]);   // eslint-disable-line react-hooks/exhaustive-deps

  const [dot, setDot] = useState<DotChon | null>(null);
  useEffect(() => { if (!dot && dotConXep.length) setDot(dotConXep[0]); }, [dot, dotConXep]);
  const dotKey = dot ? khoaDot(dot) : null;

  const emChuaXong = useMemo(
    () => (dot ? hangs.filter((h) => !emXongDot(h.o(dot))) : []),
    [hangs, dot],   // eslint-disable-line react-hooks/exhaustive-deps
  );

  /* R9b — tick mặc định CHỈ đặt lần đầu của mỗi đợt; `giuLoi` (chỉ em lỗi sau khi lưu) không bị lưới tải lại ghi đè. */
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const [giuLoi, setGiuLoi] = useState<number[] | null>(null);
  const [loiCuoi, setLoiCuoi] = useState<Map<number, string>>(new Map());
  const daDatTick = useRef<string | null>(null);
  useEffect(() => {
    if (!sanSang || !dotKey || daDatTick.current === dotKey) return;
    daDatTick.current = dotKey;
    setGiuLoi(null); setLoiCuoi(new Map());
    setTicked(new Set(emChuaXong.map((h) => h.studentId)));
  }, [dotKey, sanSang]);   // eslint-disable-line react-hooks/exhaustive-deps

  const dsEm = giuLoi ? emChuaXong.filter((h) => giuLoi.includes(h.studentId)) : emChuaXong;

  /* Kỹ năng + tuần. Mặc định theo Q18 (đặt lại mỗi lần đổi đợt). */
  const [chonKn, setChonKn] = useState<Record<KyNangKH, boolean>>({ listening: true, reading: true, writing: true, speaking: true });
  const [tuan, setTuan] = useState<Record<KyNangKH, Tuan | null>>({ listening: null, reading: null, writing: null, speaking: null });
  const [ap, setAp] = useState<Tuan | null>(null);
  const homNay = session?.demoDate ? mondayOfDate(session.demoDate) : null;
  useEffect(() => {
    if (!dotKey || !dot) return;
    let huy = false;
    const dat = (sIso: string | null, lrwIso: string | null) => {
      const lam = async () => {
        const s = sIso ? await resolveTuan(sIso) : null;
        const l = lrwIso ? (lrwIso === sIso ? s : await resolveTuan(lrwIso)) : null;
        if (!huy && l) setAp(l);
        if (!huy) setTuan({ listening: l, reading: l, writing: l, speaking: s });
      };
      void lam().catch(() => { /* người dùng vẫn chọn tay được */ });
    };
    if (dot.loai === 'thuong') {
      const de = th.data?.cot.find((c) => c.kind === dot.kind)?.deXuat ?? homNay;
      dat(de, de);
    } else {
      dat(homNay ? addDaysStr(homNay, 7) : null, homNay);      // L R W = tuần hiện tại, S = tuần sau (Q18)
    }
    return () => { huy = true; };
  }, [dotKey, sanSang, homNay]);   // eslint-disable-line react-hooks/exhaustive-deps

  const [force, setForce] = useState(true);
  const [dong, setDong] = useState<DongHangLoat[] | null>(null);
  const [dangXem, setDangXem] = useState(false);
  const [busy, setBusy] = useState(false);
  const [daBamLuu, setDaBamLuu] = useState(false);
  const soDangXem = useRef(0);

  const studentIds = dsEm.filter((h) => ticked.has(h.studentId)).map((h) => h.studentId);
  const tuanGui = useMemo(() => {
    const o: Partial<Record<KyNangKH, number>> = {};
    for (const k of KY) if (chonKn[k] && tuan[k]) o[k] = tuan[k]!.periodId;
    return o;
  }, [chonKn, tuan]);
  const khoaTuan = JSON.stringify(tuanGui);

  useEffect(() => {
    if (!dot || !Object.keys(tuanGui).length || !studentIds.length) { setDong(null); setDangXem(false); return; }
    const seq = ++soDangXem.current;
    setDangXem(true);
    const timer = setTimeout(() => {
      api.post<{ dong: DongHangLoat[]; daLuu: number }>('/ke-hoach-test/hang-loat', {
        classId, ...thanDot(dot), studentIds, tuan: tuanGui, xemTruoc: true,
      })
        .then((r) => { if (seq === soDangXem.current) { setDong(r.dong); setDangXem(false); } })
        .catch(() => { if (seq === soDangXem.current) { setDong(null); setDangXem(false); } });
    }, 300);
    return () => clearTimeout(timer);
  }, [classId, dotKey, khoaTuan, studentIds.join(',')]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* Bỏ tick "Vẫn xếp bài có cảnh báo" thì em có cảnh báo không lưu (thành dòng lỗi) — số bài ở nút Lưu theo đó. */
  const dongLuu = useMemo(() => (dong ?? []).map((d) => (
    !force && d.hanhDong !== 'loi' && d.bai.some((b) => b.ghiChu === 'canh-bao') ? { ...d, hanhDong: 'loi' as const } : d
  )), [dong, force]);
  const tomTat = useMemo(() => tomTatHangLoat(dong ?? []), [dong]);
  const luuDuoc = useMemo(() => tomTatHangLoat(dongLuu), [dongLuu]);

  const thieu: string[] = [];
  if (!dot) thieu.push('đợt');
  if (!studentIds.length) thieu.push('học viên');
  if (!Object.values(chonKn).some(Boolean)) thieu.push('kỹ năng');
  else if (KY.some((k) => chonKn[k] && !tuan[k])) thieu.push('tuần');

  const luu = async () => {
    setDaBamLuu(true);
    if (busy || thieu.length || !dot) return;
    if (luuDuoc.soEmLuu === 0) { toast.push('error', 'Chưa có bài nào lưu được — xem cột Ghi chú ở Xem trước.'); return; }
    setBusy(true);
    try {
      const r = await api.post<{ dong: DongHangLoat[]; daLuu: number }>('/ke-hoach-test/hang-loat', {
        classId, ...thanDot(dot), studentIds, tuan: tuanGui, force, xemTruoc: false,
      });
      invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham');
      const conLai = emGiuLaiSauLuu(r.dong);
      toast.push(r.daLuu > 0 ? 'ok' : 'error', `Đã xếp ${r.daLuu} em${conLai.length ? `, còn ${conLai.length} em lỗi` : ''}.`);
      onDone();
      if (!conLai.length) { onClose(); return; }
      /* R9b: giữ panel, chỉ còn các em lỗi được tick sẵn để sửa tuần rồi lưu lại. */
      setLoiCuoi(new Map(r.dong.filter((d) => d.hanhDong === 'loi').map((d) => [d.studentId, d.loi ?? ''])));
      setGiuLoi(conLai); setTicked(new Set(conLai)); setDong(r.dong); setDaBamLuu(false);
    } catch (e: any) {
      toast.push('error', e.message ?? 'Không lưu được — thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const chinh = (
    <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => void luu()} disabled={busy}>
      {busy ? 'Đang lưu…' : `Lưu lịch cho ${luuDuoc.soEmLuu} em · ${luuDuoc.soBaiLuu} bài`}
    </button>
  );
  const tatCaKn = Object.values(chonKn).every(Boolean);

  return (
    <KhungPanel tieuDe={`Xếp lịch hàng loạt · ${classCode}`} rong="rong" onDong={onClose}
      chan={{ huy: { nhan: 'Đóng', onClick: onClose }, chinh, conThieu: daBamLuu && thieu.length ? thieu : undefined }}>
      {!sanSang ? <div className="py-6 text-sm text-slate-500">Đang tải lớp…</div> : (
        <>
          <Khoi tieuDe="Đợt">
            <div className="flex flex-wrap gap-1.5">
              {dots.map((d) => {
                const xong = dotXongCaLop(d);
                return (
                  <button key={khoaDot(d)} type="button" disabled={xong}
                    className={`btn min-h-[44px] sm:min-h-0 ${dot && khoaDot(dot) === khoaDot(d) ? 'btn-primary' : ''} ${xong ? 'opacity-50' : ''}`}
                    title={xong ? 'Cả lớp đã xong đợt này' : undefined}
                    onClick={() => setDot(d)}>{nhanDot(d)}{xong && <span aria-hidden> ✓</span>}</button>
                );
              })}
              {!dots.length && <span className="text-xs text-slate-500">Lớp chưa có đợt nào.</span>}
            </div>
          </Khoi>

          <Khoi tieuDe={`Học viên · ${studentIds.length}/${dsEm.length} đã chọn`}>
            <div className="flex justify-end">
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0"
                onClick={() => setTicked(ticked.size === dsEm.length ? new Set() : new Set(dsEm.map((h) => h.studentId)))}>
                {ticked.size === dsEm.length && dsEm.length > 0 ? 'Bỏ chọn' : 'Chọn cả'}
              </button>
            </div>
            <div className="surface-2 rounded-lg p-2">
              {dsEm.map((h) => {
                const o = dot ? h.o(dot) : { attemptId: null, kn: {} };
                const tinhTrang = o.attemptId ? chuTinhTrang(o.kn) : `${dot ? nhanDot(dot) : ''} chưa xếp`;
                const loi = loiCuoi.get(h.studentId);
                return (
                  <div key={h.studentId}>
                    <label className="flex min-h-[44px] items-center gap-2 py-1 text-sm text-slate-200 sm:min-h-[32px]">
                      <input type="checkbox" className="accent-sky-400" checked={ticked.has(h.studentId)}
                        onChange={(e) => setTicked((s) => {
                          const n = new Set(s);
                          if (e.target.checked) n.add(h.studentId); else n.delete(h.studentId);
                          return n;
                        })} />
                      <span className="min-w-0 flex-1 truncate">{h.ten}</span>
                      <span className="shrink-0 text-[11px] text-slate-500">{tinhTrang}</span>
                    </label>
                    {loi && <div className="truncate pb-1 pl-6 text-[11px] text-bad" title={loi}>{loi}</div>}
                  </div>
                );
              })}
              {!dsEm.length && <span className="text-xs text-slate-500">Không có em nào để xếp.</span>}
            </div>
          </Khoi>

          <Khoi tieuDe="Kỹ năng" luat={<span className="block">W = chấm cả W1 và W2 — một lịch W đặt cho cả hai.</span>}>
            <label className="flex min-h-[44px] items-center gap-2 text-sm text-slate-200 sm:min-h-[32px]">
              <input type="checkbox" className="accent-sky-400" checked={tatCaKn}
                onChange={(e) => setChonKn({ listening: e.target.checked, reading: e.target.checked, writing: e.target.checked, speaking: e.target.checked })} />
              Chọn cả 4 kỹ năng
            </label>
            {KY.map((k) => (
              <DongKyNang key={k} k={k} tick={chonKn[k]} onTick={(v) => setChonKn((s) => ({ ...s, [k]: v }))}
                tuan={tuan[k]} goc={homNay} onTuan={(t) => setTuan((s) => ({ ...s, [k]: t }))}
                nhanKhoa={dot?.loai === 'thuong' && tuan[k]
                  ? nhanTuanKhoa(tuan[k]!.weekStart, th.data?.khaiGiang ?? null, th.data?.tongTuan ?? null) : null} />
            ))}
            <div className="grid items-start gap-2" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
              <div className="min-w-0">
                <span className="mb-1 block text-[11.5px] font-bold text-slate-200">Áp một tuần cho mọi kỹ năng đã chọn</span>
                <TuanNho d={ap ?? { periodId: null, weekStart: null }} goc={homNay} onTuan={setAp} />
              </div>
              <button type="button" className="btn mt-[22px] min-h-[44px] sm:min-h-[32px]" disabled={!ap}
                onClick={() => setTuan((s) => {
                  const n = { ...s };
                  for (const k of KY) if (chonKn[k]) n[k] = ap;
                  return n;
                })}>Áp</button>
            </div>
          </Khoi>

          <Khoi tieuDe="Xem trước">
            {dangXem ? (
              <div className="text-xs text-slate-500">Đang tính…</div>
            ) : !dong ? (
              <div className="text-xs text-slate-500">Chọn đợt, học viên và tuần để xem trước.</div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-slate-300">
                  {tomTat.tongBai} bài · {tomTat.luuDuoc} lưu được ({tomTat.coCanhBao} có cảnh báo) · {tomTat.biChan} bị chặn
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" style={{ tableLayout: 'fixed', minWidth: 520 }}>
                    <colgroup><col style={{ width: 150 }} /><col style={{ width: 80 }} /><col style={{ width: 140 }} /><col /></colgroup>
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500">
                        <th className="py-1 font-bold">Học viên</th><th className="py-1 font-bold">Kỹ năng</th>
                        <th className="py-1 font-bold">Tuần cũ → mới</th><th className="py-1 font-bold">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dong.map((d) => <DongXemTruoc key={d.studentId} d={d} />)}
                    </tbody>
                  </table>
                </div>
                {tomTat.coCanhBao > 0 && (
                  <label className="flex min-h-[44px] items-center gap-2 text-xs text-soon sm:min-h-0">
                    <input type="checkbox" className="accent-sky-400" checked={force} onChange={(e) => setForce(e.target.checked)} />
                    Vẫn xếp {tomTat.coCanhBao} bài có cảnh báo
                  </label>
                )}
                {tomTat.biChan > 0 && (
                  <div className="text-xs text-bad">Bài bị chặn không lưu — sửa tuần ở khối Kỹ năng hoặc bỏ tích em đó.</div>
                )}
              </div>
            )}
          </Khoi>
        </>
      )}
    </KhungPanel>
  );
}

/** Một dòng kỹ năng: ô tích · chữ · bộ chọn tuần gọn (+ nhãn tuần trong khoá của lớp thường). */
function DongKyNang({ k, tick, onTick, tuan, goc, onTuan, nhanKhoa }: {
  k: KyNangKH; tick: boolean; onTick: (v: boolean) => void; tuan: Tuan | null; goc: string | null;
  onTuan: (t: Tuan) => void; nhanKhoa: string | null;
}) {
  return (
    <div className={`grid grid-cols-[20px_92px_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[20px_108px_minmax(0,1fr)] ${tick ? '' : 'opacity-50'}`}>
      <input type="checkbox" className="mt-3 accent-sky-400" checked={tick} onChange={(e) => onTick(e.target.checked)}
        aria-label={`Chọn ${TEN_KY_NANG[k]}`} />
      <div className="mt-2 text-sm text-slate-200">
        <b title={TEN_KY_NANG[k]}>{chuKyNang(k)}</b> <span className="text-slate-400">{TEN_KY_NANG[k]}</span>
        {k === 'writing' && <span className="ml-1 cursor-help text-slate-500" title="W = chấm cả W1 và W2">ⓘ</span>}
      </div>
      <div className={`min-w-0 max-w-[320px] ${tick ? '' : 'pointer-events-none'}`}>
        <TuanNho d={tuan ?? { periodId: null, weekStart: null }} goc={goc} onTuan={onTuan} nhanKhoa={nhanKhoa} />
      </div>
    </div>
  );
}

/** Các dòng xem trước của MỘT em: bài cùng tuần/ghi chú gộp một dòng (`L R W — → W1 OCT`). */
function DongXemTruoc({ d }: { d: DongHangLoat }) {
  const nhom = gomBaiXemTruoc(d.bai);
  if (!nhom.length) {
    return (
      <tr className="border-t" style={{ borderColor: 'var(--line)' }}>
        <td className="truncate py-1.5 pr-2 text-slate-200" title={d.ten}>{d.ten}</td>
        <td className="py-1.5">—</td><td className="py-1.5">—</td>
        <td className="py-1.5"><Nhan tone="bad">Chặn</Nhan> <span className="text-slate-400" title={d.loi ?? ''}>{d.loi}</span></td>
      </tr>
    );
  }
  return (
    <>
      {nhom.map((g, i) => {
        const t = TONE_GHI_CHU[g.ghiChu];
        return (
          <tr key={i} className={i === 0 ? 'border-t' : ''} style={{ borderColor: 'var(--line)' }}>
            <td className="truncate py-1.5 pr-2 text-slate-200" title={d.ten}>{i === 0 ? d.ten : ''}</td>
            <td className="py-1.5 font-bold text-slate-300">{g.kyNang.map(chuKyNang).join(' ')}</td>
            <td className="py-1.5 text-slate-300">{g.tu ? tuanLich(g.tu) : '—'} → {g.den ? tuanLich(g.den) : '—'}</td>
            <td className="min-w-0 py-1.5">
              <span className="flex min-w-0 items-center gap-1.5">
                <Nhan tone={t.tone}>{t.chu}</Nhan>
                {g.cau && <span className="truncate text-[11px] text-slate-400" title={g.cau}>{g.cau}</span>}
              </span>
            </td>
          </tr>
        );
      })}
    </>
  );
}
