import { useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Empty, ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { NhanKq } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { HopNeo } from '../../ui/HopNeo.tsx';
import { ODiem } from '../../ui/ODiem.tsx';
import { Bang, OBang, type CotBang } from '../../ui/Bang.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { NGUONG_KY_VONG, REGULAR_SKILLS, duongCase, mocThuong, tenMon, tuanLich, type RegularSkill } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** `GET /classes/:id/ket-qua-dau-ra` (server/src/normal/kyVong.ts → kqdrLopFt). Kết quả = giá trị QL đã chốt, hoặc tự Đạt theo MT0 (`tuDong`). */
type KetQua = { dat: boolean; nguyenNhan: 'trung_tam' | 'hoc_sinh' | null; mon: string[]; ghiChu: string | null; tuDong?: true };
type Em = {
  id: number; ten: string; lopCu: { id: number; code: string }; final: number | null; finalDat: boolean | null;
  mt0: (Record<RegularSkill, number | null> & { overall: number | null; dat: boolean; monTruot: string[] }) | null;
  kqdr: KetQua | null; case: { id: number; mon: string }[]; banGiao: string | null;
  /** QL / Quản trị chốt được · MT0 quá tuần 2 FT mà chưa đủ 3 kỹ năng → chốt tay. */
  chotDuoc: boolean; moTay: boolean;
};
/** `hienToi` null = đợt quá 4 tuần, còn hiện vì có em chưa chốt. */
type Dot = { vao: string; hienToi: string | null; em: Em[] };
type Bang_ = { ct: string; lop: { id: number; code: string }[]; dot: Dot[] };
type Hang = { loai: 'dot'; dot: Dot } | { loai: 'em'; em: Em };

const NGAN: Record<string, string> = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S', writing2: 'W' };
const b1 = (n: number | null) => (n === null ? null : n.toFixed(1));
const BAN_GIAO_DAI = 110;   // hơn ~2 dòng ở cột Bàn giao → "Xem" mở đủ chữ

const COT: CotBang[] = [
  { key: 'ten', nhan: t('Học viên'), kieu: 'ten' },
  { key: 'final', nhan: 'Final', kieu: 'phan-tram', goiY: t('Final Test lớp cũ · % tổng') },
  ...REGULAR_SKILLS.map((k): CotBang => ({ key: k, nhan: NGAN[k], kieu: 'diem', nhom: 'MT0', rong: 60 })),
  { key: 'overall', nhan: 'Overall', kieu: 'diem', nhom: 'MT0', rong: 76 },
  { key: 'kq', nhan: t('Kết quả đầu ra'), kieu: 'chip', rong: 236 },
  { key: 'ho-tro', nhan: t('Hỗ trợ'), kieu: 'chu', rong: 150 },
  { key: 'ban-giao', nhan: t('Bàn giao từ GV cũ'), kieu: 'chu' },
];

/**
 * HỒ SƠ LỚP FT › Học viên › "Kết quả đầu ra" (OV-3c; KET-QUA-DAU-RA-b, đặc tả 2026-11-14 mục 5.2): mỗi chương trình nguồn một bảng, dải đợt (= tuần vào
 * lớp FT, hiện 4 tuần; đợt cũ hơn chỉ còn em chưa chốt). Điểm MT0 tách ô L · R · W · S · Overall như bảng Tổng hợp — chỉ đỏ khi CHƯA đạt mốc.
 * QL / Quản trị chốt / sửa ngay ở ô Kết quả (hộp nhỏ neo ô, `PUT /students/:id/ket-luan-ft`); em tự Đạt theo MT0 không cần chốt. GV chỉ xem.
 * 375: mỗi em một thẻ (tên · lớp cũ · Final · lưới MT0 5 ô · kết quả + nút · hỗ trợ / bàn giao).
 */
export function BangKqdrLopFt({ classId }: { classId: number }) {
  const { data, loading, error, reload } = useApi<{ bang: Bang_[] }>(`/classes/${classId}/ket-qua-dau-ra`, [classId]);
  const { homNay } = useNgayNghiepVu();
  const dt = useDienThoai();
  const [chot, setChot] = useState<{ em: Em; ct: string; neo: HTMLElement } | null>(null);
  const [xem, setXem] = useState<{ em: Em; neo: HTMLElement } | null>(null);
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (loading && !data) return <Skeleton rows={5} />;
  if (!data?.bang.length) return <div className="card"><Empty title={t('Không còn đợt nào trong 4 tuần')} hint={t('Tra Kết quả đầu ra ở Hồ sơ học viên › Hành trình.')} /></div>;
  const tuan = (d: string) => <span className="tabular-nums">{tuanLich(d, homNay)}</span>;

  const oBand = (e: Em, k: RegularSkill | 'overall', nguong: number) => {
    const m = e.mt0;
    if (!m) return <span className="text-faint">—</span>;
    const v = m[k];
    /* Chỉ đỏ khi CHƯA đạt (chủ SP 14/11): đạt mốc thì kỹ năng màu thường, Overall ✓; chưa đạt thì kỹ năng dưới mốc ✗ + Overall ✗. */
    const kq = v === null ? null : k === 'overall' ? (m.dat ? 'dat' as const : 'duoi' as const) : !m.dat && m.monTruot.includes(k) ? 'duoi' as const : null;
    return <ODiem kieu="gon" so={b1(v)} kq={kq} nhan={k === 'overall' ? 'Overall' : NGAN[k]} kyVong={b1(nguong) ?? undefined} />;
  };
  const oFinal = (e: Em) => (e.final === null ? <span className="text-faint">—</span>
    : <ODiem kieu="gon" so={`${Math.round(e.final * 100)}%`} kq={e.finalDat ? 'dat' : 'duoi'} nhan="Final" />);
  const chuKq = (k: KetQua) => (k.dat ? t('Đạt')
    : `${t('Không đạt')} · ${k.nguyenNhan === 'hoc_sinh' ? t('Học viên') : t('Trung tâm')}${k.mon.length ? ` · ${k.mon.map((m) => NGAN[m] ?? m).join(' ')}` : ''}`);
  const oKq = (e: Em, ct: string) => {
    const k = e.kqdr;
    const mo = (ev: MouseEvent<HTMLElement>) => setChot({ em: e, ct, neo: ev.currentTarget });
    if (!k) {
      if (!e.mt0 && !e.moTay) return <span className="text-[13px] text-faint" title={t('MT0 cần ít nhất 3 kỹ năng có điểm')}>{t('Chờ MT0')}</span>;
      return e.chotDuoc
        ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={mo}>{t('Chốt…')}</button>
        : <NhanKq kq="thieu" title={t('Quản lý chưa chốt Kết quả đầu ra')}>{t('Chưa chốt')}</NhanKq>;
    }
    const chip = <NhanKq kq={k.dat ? 'dat' : 'chua-dat'}>{chuKq(k)}</NhanKq>;
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5">
        {/* Đã chốt: bấm thẳng chip để sửa (không ⋯ một mục — Case – PA bấm thẳng); tự Đạt không có gì để chốt. */}
        {e.chotDuoc && !k.tuDong
          ? <button type="button" className="appearance-none rounded border-0 bg-transparent p-0 hover:brightness-125 max-sm:min-h-[44px]" onClick={mo}
              aria-label={t('Sửa Kết quả đầu ra · {ten}', { ten: e.ten })} title={t('Sửa')}>{chip}</button>
          : chip}
        {k.tuDong && e.mt0 && (
          <NutLuat label={t('Tự Đạt theo MT0')}>
            {e.mt0.overall === null
              ? t('MT0 có kỹ năng đã huỷ: các kỹ năng còn lại đều đạt mốc {ct} {n} — tự Đạt, không cần chốt.', { ct, n: b1(NGUONG_KY_VONG[ct] ?? null) ?? '' })
              : t('MT0 Overall {ov} ≥ mốc {ct} {n} — tự Đạt, không cần chốt.', { ov: b1(e.mt0.overall) ?? '', ct, n: b1(NGUONG_KY_VONG[ct] ?? null) ?? '' })}
          </NutLuat>
        )}
      </span>
    );
  };
  /* Một dòng gọn: "Case Tutor · L, R" — mỗi chữ kỹ năng là link Case của kỹ năng đó. */
  const oCase = (e: Em) => (e.case.length ? (
    <span className="text-[13px] text-slate-300">
      {e.kqdr?.nguyenNhan === 'trung_tam' ? t('Case Tutor') : 'Case'}{' · '}
      {e.case.map((c, i) => (
        <span key={c.id}>{i > 0 && ', '}<Link className="link" to={duongCase(e.id, c.id)} title={dich(tenMon(null, c.mon))}>{NGAN[c.mon] ?? c.mon}</Link></span>
      ))}
    </span>
  ) : <span className="text-faint">—</span>);
  const oBanGiao = (e: Em) => (e.banGiao
    ? (
      <span className="flex min-w-0 items-start gap-1.5">
        <span className="line-clamp-2 min-w-0 whitespace-pre-line break-words text-[13px] text-slate-300">{e.banGiao}</span>
        {(e.banGiao.length > BAN_GIAO_DAI || e.banGiao.split('\n').length > 2) && (
          <button type="button" className="link shrink-0 appearance-none border-0 bg-transparent p-0 text-[13px] max-sm:min-h-[44px]"
            onClick={(ev) => setXem({ em: e, neo: ev.currentTarget })}>{t('Xem')}</button>
        )}
      </span>
    )
    : <span className="text-[13px] text-faint">{t('Chưa bàn giao')}</span>);
  const tenEm = (e: Em) => <Link className="ten-ho-so min-w-0 truncate" title={e.ten} to={`/hoc-vien/${e.id}`}>{e.ten}</Link>;
  const dongDot = (d: Dot) => (
    <span className="flex flex-wrap items-baseline gap-x-2 text-[13px] text-slate-400">
      <b className="font-semibold text-slate-200">{t('Đợt')} {tuan(d.vao)}</b>
      {d.hienToi ? <span>{t('hiện tới hết')} {tuan(d.hienToi)}</span> : <span>{t('còn em chưa chốt')}</span>}
    </span>
  );

  return (
    <div className="space-y-3">
      {data.bang.map((b) => {
        const nguong = NGUONG_KY_VONG[b.ct] ?? 0;
        const hang: Hang[] = b.dot.flatMap((d) => [{ loai: 'dot' as const, dot: d }, ...d.em.map((em) => ({ loai: 'em' as const, em }))]);
        const oCua = (h: Hang, c: CotBang) => {
          if (h.loai === 'dot') return null;
          const e = h.em;
          switch (c.key) {
            case 'ten': return tenEm(e);
            case 'final': return oFinal(e);
            case 'overall': return oBand(e, 'overall', nguong);
            case 'kq': return oKq(e, b.ct);
            case 'ho-tro': return oCase(e);
            case 'ban-giao': return oBanGiao(e);
            default: return oBand(e, c.key as RegularSkill, nguong);
          }
        };
        return (
          <section key={b.ct} className="card overflow-clip" aria-label={t('Kết quả đầu ra {ct}', { ct: b.ct })}>
            <h3 className="m-0 flex flex-wrap items-baseline gap-x-2 px-3.5 py-3 text-[15px] font-bold text-slate-100">
              {t('Kết quả đầu ra {ct}', { ct: b.ct })}
              <span className="text-[13px] font-normal text-slate-400">{t('mốc MT0 {n}', { n: b1(nguong) ?? '' })}{!dt && ` · ${b.lop.map((l) => l.code).join(', ')}`}</span>
            </h3>
            <Bang ten={t('Kết quả đầu ra {ct}', { ct: b.ct })} cot={COT} hang={hang} khung={false}
              khoa={(h) => (h.loai === 'dot' ? `dot-${h.dot.vao}` : h.em.id)} oCua={oCua}
              lopHang={(h) => (h.loai === 'dot' ? '!py-2 bg-[color:var(--surface-2)]' : '')}
              hangRieng={(h) => (h.loai === 'dot'
                ? <tr><td colSpan={COT.length} className="td" style={{ background: 'var(--surface-2)' }}>{dongDot(h.dot)}</td></tr>
                : (
                  <tr>
                    {COT.map((c) => (
                      <OBang key={c.key} c={c}>
                        {oCua(h, c)}
                        {c.key === 'ten' && <span className="bang-phu" data-phu-odiem="">{h.em.lopCu.code}</span>}
                      </OBang>
                    ))}
                  </tr>
                ))}
              theRieng={(h) => (h.loai === 'dot' ? dongDot(h.dot) : (
                <div className="grid gap-2.5">
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-[15px]">{tenEm(h.em)}<span className="text-[13px] text-slate-400">{h.em.lopCu.code}</span></div>
                  <div className="grid grid-cols-6 gap-x-1.5" role="group" aria-label={t('Final và MT0')}>
                    {(['final', ...REGULAR_SKILLS, 'overall'] as const).map((k) => (
                      <span key={k} className="grid justify-items-start gap-px">
                        <span className="text-[12px] font-medium text-slate-400">{k === 'final' ? 'Final' : k === 'overall' ? 'OVR' : NGAN[k]}</span>
                        {k === 'final' ? oFinal(h.em) : oBand(h.em, k, nguong)}
                      </span>
                    ))}
                  </div>
                  <div className="flex min-h-[44px] flex-wrap items-center gap-2">{oKq(h.em, b.ct)}</div>
                  {h.em.case.length > 0 && <div className="text-[13px]"><span className="text-slate-400">{t('Hỗ trợ')} </span>{oCase(h.em)}</div>}
                  {h.em.banGiao && <div className="grid gap-0.5"><span className="text-[13px] font-medium text-slate-400">{t('Bàn giao từ GV cũ')}</span>{oBanGiao(h.em)}</div>}
                </div>
              ))} />
          </section>
        );
      })}
      {chot && <HopChot em={chot.em} ct={chot.ct} neo={chot.neo} onDong={() => setChot(null)} onXong={() => { setChot(null); reload(); }} />}
      {xem && (
        <HopNeo neo={{ current: xem.neo }} nhan={t('Bàn giao từ GV cũ · {ten}', { ten: xem.em.ten })} rong={420} onNgoai={() => setXem(null)}>
          <b className="text-[15px] text-slate-100">{t('Bàn giao từ GV cũ')} · {xem.em.ten}</b>
          <p className="m-0 whitespace-pre-line break-words text-[15px] text-slate-300">{xem.em.banGiao}</p>
          <div className="flex justify-end"><button type="button" className="btn" onClick={() => setXem(null)}>{t('Đóng')}</button></div>
        </HopNeo>
      )}
    </div>
  );
}

type Chon = 'dat' | 'trung_tam' | 'hoc_sinh' | '';

/**
 * HỘP CHỐT KẾT QUẢ ĐẦU RA (KET-QUA-DAU-RA-b) — neo ô Kết quả: Đạt · Không đạt · Trung tâm (kỹ năng, điền sẵn kỹ năng MT0 dưới mốc; mỗi kỹ năng một Case +
 * Tutor n buổi theo cấu hình) · Không đạt · Học viên (phương án, không Case — N17). MT0 đạt mốc → hai lựa chọn Không đạt tắt, có lý do (máy chủ cũng chặn).
 * Cùng đường hồ sơ HV (`ghiKetLuanFt`). Đã sửa mà bấm ngoài / Esc → giữ hộp (không mất chữ đang gõ); "Đóng" mới bỏ.
 */
function HopChot({ em, ct, neo, onDong, onXong }: { em: Em; ct: string; neo: HTMLElement; onDong: () => void; onXong: () => void }) {
  const toast = useToast();
  const k = em.kqdr;
  const dau: Chon = k ? (k.dat ? 'dat' : k.nguyenNhan ?? '') : '';
  const [chon, setChon] = useState<Chon>(dau);
  const [mon, setMon] = useState<string[]>(k && !k.dat && k.mon.length ? k.mon : em.mt0?.monTruot ?? []);
  const [phuongAn, setPhuongAn] = useState(k?.ghiChu ?? '');
  const [loi, setLoi] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLElement | null>(neo);
  const datMoc = !!em.mt0?.dat;
  const tutor = mocThuong().khongDatKyVong.tutor;
  const daSua = chon !== dau || phuongAn !== (k?.ghiChu ?? '') || (chon === 'trung_tam' && mon.join() !== (k?.mon ?? []).join());
  const lyDoTat = datMoc ? t('MT0 đã đạt mốc {ct} — Kết quả đầu ra là Đạt.', { ct }) : undefined;
  const luu = async () => {
    if (!daSua) { onDong(); return; }   // V12 ③: không đổi gì → đóng, không gọi máy chủ
    if (!chon) { setLoi(t('Chọn Đạt hoặc Không đạt.')); return; }
    if (chon === 'trung_tam' && !mon.length) { setLoi(t('Chọn ít nhất một kỹ năng chưa đạt')); return; }
    if (chon === 'hoc_sinh' && !phuongAn.trim()) { setLoi(t('Ghi phương án.')); return; }
    setBusy(true); setLoi(null);
    try {
      const r: any = await api.put(`/students/${em.id}/ket-luan-ft`, chon === 'dat' ? { dat: true }
        : { dat: false, nguyenNhan: chon, mon: chon === 'trung_tam' ? mon : [], ...(chon === 'hoc_sinh' ? { ghiChu: phuongAn.trim() } : {}) });
      invalidate('/classes'); invalidate('/students'); invalidate('/cases'); invalidate('/my-work');
      toast.push('ok', r?.taoCaseTutor ? t('Đã lưu — tạo {n} Case', { n: r.taoCaseTutor }) : t('Đã lưu'));
      if (r?.luuY) toast.push('info', dich(r.luuY));
      onXong();
    } catch (e: any) { setLoi(e.message); } finally { setBusy(false); }
  };
  return (
    <HopNeo neo={ref} nhan={t('Kết quả đầu ra · {ten}', { ten: em.ten })} rong={380} mui onNgoai={() => { if (!daSua) onDong(); }}>
      <div className="grid gap-0.5">
        <b className="text-[15px] text-slate-100">{t('Kết quả đầu ra')} · {em.ten}</b>
        <span className="text-[13px] text-slate-400">
          {!em.mt0 ? t('MT0 chưa đủ 3 kỹ năng') : em.mt0.overall === null
            ? t('MT0 có kỹ năng huỷ · mốc {ct} {n}', { ct, n: (NGUONG_KY_VONG[ct] ?? 0).toFixed(1) })
            : t('MT0 Overall {ov} · mốc {ct} {n}', { ov: em.mt0.overall.toFixed(1), ct, n: (NGUONG_KY_VONG[ct] ?? 0).toFixed(1) })}
        </span>
      </div>
      <div role="radiogroup" aria-label={t('Kết quả đầu ra')} className="grid gap-2">
        <NutChon chon={chon === 'dat'} onClick={() => setChon('dat')} className="justify-start">{t('Đạt')}</NutChon>
        <NutChon chon={chon === 'trung_tam'} onClick={() => setChon('trung_tam')} disabled={datMoc} title={lyDoTat} className="justify-start">{t('Không đạt · Trung tâm')}</NutChon>
        <NutChon chon={chon === 'hoc_sinh'} onClick={() => setChon('hoc_sinh')} disabled={datMoc} title={lyDoTat} className="justify-start">{t('Không đạt · Học viên')}</NutChon>
        {lyDoTat && <span className="text-[13px] text-slate-400">{lyDoTat}</span>}
      </div>
      {chon === 'trung_tam' && (
        <div className="grid gap-1.5">
          <span className="text-[13px] font-medium text-slate-400">{t('Kỹ năng chưa đạt')}</span>
          <div className="flex flex-wrap gap-2">
            {REGULAR_SKILLS.map((s) => (
              <NutChon key={s} nho chon={mon.includes(s)} title={dich(tenMon(ct, s))}
                onClick={() => setMon((m) => (m.includes(s) ? m.filter((x) => x !== s) : REGULAR_SKILLS.filter((x) => x === s || m.includes(x))))}>{NGAN[s]}</NutChon>
            ))}
          </div>
          <span className="text-[13px] text-slate-400">{t('Lưu: mỗi kỹ năng một Case + Tutor {n} buổi.', { n: tutor })}</span>
        </div>
      )}
      {chon === 'hoc_sinh' && (
        <label className="grid gap-1">
          <span className="text-[13px] font-medium text-slate-400">{t('Phương án')}</span>
          <textarea name="phuong-an" autoComplete="off" className="field w-full" rows={3} maxLength={2000} value={phuongAn} onChange={(e) => setPhuongAn(e.target.value)}
            placeholder={t('Ví dụ: Nghỉ 5 buổi trước Final Test')} />
        </label>
      )}
      {loi && <span role="alert" className="text-[13px] text-late">{loi}</span>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>
        <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
      </div>
    </HopNeo>
  );
}
