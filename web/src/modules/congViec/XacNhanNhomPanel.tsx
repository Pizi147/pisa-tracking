import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { fmtBand, skillShort, toneTheoNhan } from '../../lib/format.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, Level, NutChon, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { Han } from '../../ui/Han.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { FormPa, NgayKhoa, OKhoa } from '../cases/FormPa.tsx';
import { KhongTheoDoiForm } from '../yThuc/CaseSosControls.tsx';
import {
  datLaiNguoi, dsLoi, duongHoSoHocVien, issuesForTopic, khacNguoi, kiemGhiRoKhac, laKhac, loiFormPa, ngay, nguoiCuaPa, nguoiMacDinh, paMoi, paPayload,
  tuanLich, type GiaTriPa,
} from '@shared/domain/index.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';

type PaNhom = { id: number; kind: string; description: string | null; soBuoi: number | null; performer: string | null; performerUserId: number | null; mocChu: string; ten: string };
type EmNhom = {
  caseId: number; studentId: number; ten: string; band: number | null; raw: number | null; total: number | null; kyVong: number | null;
  sos: number | null; pa: PaNhom | null; lamRieng: boolean; cho: boolean;
};
/** `GET /cases/xac-nhan-nhom?ids=` (`nhomXacNhan`, server/src/cases/xacNhanNhom.ts). */
type Nhom = { lop: { id: number; code: string; ct: string | null; thuong: boolean }; luot: { kind: string; no: number | null; nhan: string }; kyNang: { topic: string; nhan: string }; paChung: PaNhom | null; em: EmNhom[] };

/** Cùng trần `TOI_DA_EM` của máy chủ: nhóm đông hơn gửi lần lượt từng lô (mỗi lô một giao dịch), dừng ở lô lỗi. */
const LO_EM = 6;

/**
 * XÁC NHẬN NGUYÊN NHÂN CẢ NHÓM (OV-5a, mockup M1 §1, chốt CV1) — panel phải của Công việc cho dòng gom lớp + kỹ năng + lượt.
 * Bảng em (✓ · điểm kỹ năng · kỳ vọng · SOS · ghi chú riêng): em khác mức PA quy chế tự bỏ chọn ("làm riêng"). Nguyên nhân chính (chip) + Mô tả;
 * Phương án theo quy chế (FormPa sẵn có: Loại khoá · Nội dung · Số buổi · người · Ngày bắt đầu tuần này) + "xác nhận cùng lúc" mặc định bật.
 * Lưu: dòng ở danh sách giữ chỗ (nơi gọi), panel giữ, câu "✓ Đã xác nhận n em · PA … chạy từ …"; chỉ "· việc tiếp ›" mới chuyển việc.
 * Lỗi: giữ chữ đã gõ, câu lỗi máy chủ nói đúng em. "Không cần theo dõi…" = đường cũ của MỘT Case (`KhongTheoDoiForm`).
 */
export function XacNhanNhomPanel({ it, onDong, onDaLuu, onTiep }: {
  it: WorkItem; onDong: () => void; onDaLuu: () => void;
  /** Việc kế tiếp ở danh sách (null = hết). */
  onTiep: (() => void) | null;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const ids = (it.con ?? []).map((c) => c.caseId).filter((x): x is number => x !== null).sort((a, b) => a - b).join(',');
  const { data, error, reload } = useApi<Nhom>(ids ? `/cases/xac-nhan-nhom?ids=${ids}` : null, [ids]);
  const [chon, setChon] = useState<Set<number>>(new Set());
  const [code, setCode] = useState('');
  const [ghiRo, setGhiRo] = useState('');
  const [moTa, setMoTa] = useState('');
  const [cungLuc, setCungLuc] = useState(true);
  /* Form PA theo TỪNG PA quy chế (khoá id PA): chọn em mức khác thì form đổi sang PA của mức đó, chữ đã gõ của mức kia còn nguyên. */
  const [vs, setVs] = useState<Record<number, GiaTriPa>>({});
  const [busy, setBusy] = useState(false);
  const [loiGui, setLoiGui] = useState<string | null>(null);
  const [daLuu, setDaLuu] = useState<{ soEm: number; tenPa: string | null; ngay: string } | null>(null);
  const [khongTheoDoi, setKhongTheoDoi] = useState<number | null>(null);
  const lf = useLoiForm();

  const cho = (data?.em ?? []).filter((e) => e.cho);
  /* Tải (lại) nhóm: chọn sẵn em còn chờ cùng mức chung (sau khi xác nhận bớt em, em "làm riêng" có thể thành mức chung). */
  useEffect(() => {
    if (data) setChon(new Set(data.em.filter((e) => e.cho && !e.lamRieng).map((e) => e.caseId)));
  }, [data]);
  const emChon = cho.filter((e) => chon.has(e.caseId));
  const muc = (e: EmNhom) => (e.pa ? `${e.pa.kind}|${e.pa.mocChu}` : '-');
  /* Mức chuẩn của lựa chọn: mức chung nếu có em mức chung được chọn, không thì em đầu tiên; em lệch mức → không gửi (máy chủ chỉ kiểm trong một lô). */
  const chuan = emChon.find((e) => !e.lamRieng) ?? emChon[0] ?? null;
  const lech = chuan ? emChon.filter((e) => muc(e) !== muc(chuan)) : [];
  const pa = chuan ? chuan.pa : data?.paChung ?? null;
  const v: GiaTriPa | null = pa
    ? vs[pa.id] ?? { ...paMoi(pa.kind), soBuoi: pa.soBuoi == null ? '' : String(pa.soBuoi), nguoi: nguoiCuaPa(pa) ?? nguoiMacDinh(pa.kind) }
    : null;

  const dongTieuDe = `${it.tieuDe}`;
  const ngCanh = data ? (
    <span className="flex flex-wrap items-center gap-x-1.5">
      <Link className="link" to={`/hoc-vien/lop/${data.lop.id}`}>{data.lop.code} <span aria-hidden className="text-xs">↗</span></Link>
      <span aria-hidden>·</span>
      <Link className="link" to={`/test/diem-lop?lop=${data.lop.id}${data.luot.kind === 'mock' && data.luot.no ? `&luot=mt:${data.luot.no}` : `&luot=thuong:${data.luot.kind}`}`}>
        {data.luot.nhan} <span aria-hidden className="text-xs">↗</span>
      </Link>
      {it.due && <><span aria-hidden>·</span><Han loai="xac-minh-sos" han={it.due} /></>}
    </span>
  ) : null;

  if (error) return <KhungPanel tieuDe={dongTieuDe} onDong={onDong}><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></KhungPanel>;
  if (!data) return <KhungPanel tieuDe={dongTieuDe} onDong={onDong}><div className="pt-3"><Skeleton rows={6} /></div></KhungPanel>;

  const causes = issuesForTopic(data.kyNang.topic, data.lop.ct);
  const coPa = !!pa && cungLuc;
  const loiPa = coPa && v ? loiFormPa(v, { toiThieu: 15 }) : [];
  const loi = [
    ...dsLoi([
      { khoa: 'nguyen-nhan', nhan: 'Nguyên nhân chính', chon: true },
      ...(laKhac(code) ? [{ khoa: 'ghi-ro', nhan: 'Ghi rõ nguyên nhân', toiThieu: 3 }] : []),
      { khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: 15 },
    ], { 'nguyen-nhan': code, 'ghi-ro': ghiRo, 'mo-ta': moTa }),
    ...loiPa,
  ];
  const n = chon.size;

  const gui = async (tiep: boolean) => {
    lf.bam();
    setLoiGui(null);
    if (loi.length > 0 || !n) return;
    if (lech.length) { setLoiGui(`${lech.map((e) => e.ten).join(', ')}: PA theo quy chế khác mức các em còn lại — bỏ chọn, xác nhận riêng.`); return; }
    setBusy(true);
    const dsChon = emChon.map((e) => e.caseId);
    const paGui = coPa && v && pa ? (() => {
      const { description, soBuoi } = paPayload(v);
      return { description, soBuoi, ...(khacNguoi(v.nguoi, nguoiCuaPa(pa)) ? datLaiNguoi(v.nguoi) : {}) };
    })() : null;
    let xong = 0;
    let kq: { soEm: number; tenPa: string | null; ngay: string } | null = null;
    try {
      for (let i = 0; i < dsChon.length; i += LO_EM) {
        const r = await api.post<{ soEm: number; tenPa: string | null; ngay: string }>('/cases/xac-nhan-nhom', {
          caseIds: dsChon.slice(i, i + LO_EM), primaryCode: code, observation: laKhac(code) ? ghiRo.trim() : undefined, moTa: moTa.trim(), pa: paGui,
        });
        xong += r.soEm;
        kq = { soEm: xong, tenPa: r.tenPa, ngay: r.ngay };
      }
    } catch (e: any) {
      /* Lỗi: chữ đã gõ giữ nguyên; câu máy chủ nói đúng em. Lô trước đã lưu (mỗi lô một giao dịch) thì nói rõ. */
      setLoiGui(xong ? `Đã xác nhận ${xong} em. Lỗi ở lô sau: ${e.message}` : e.message);
    }
    if (kq) {
      setDaLuu(kq);
      lf.datLai();
      invalidate('/cases'); invalidate('/students'); invalidate('/tong-quan'); invalidate('/my-work'); invalidate('/yeu-cau');
      onDaLuu();
      reload();
      if (tiep && onTiep && xong === dsChon.length) onTiep();
    }
    setBusy(false);
  };

  const doiChon = (id: number) => setChon((s) => { const m = new Set(s); if (m.has(id)) m.delete(id); else m.add(id); return m; });
  const tatCaChon = cho.length > 0 && cho.every((e) => chon.has(e.caseId));
  const knNgan = data.lop.thuong ? data.kyNang.nhan : skillShort(data.kyNang.topic);
  const diem = (e: EmNhom) => (data.lop.thuong ? (e.raw !== null && e.total ? `${e.raw}/${e.total}` : '—') : e.band !== null ? fmtBand(e.band) : '—');

  return (
    <KhungPanel tieuDe={dongTieuDe} ngCanh={ngCanh} onDong={onDong}
      chan={cho.length ? {
        huy: { nhan: 'Không cần theo dõi…', onClick: () => setKhongTheoDoi(cho.find((e) => chon.has(e.caseId))?.caseId ?? cho[0].caseId) },
        conThieu: lf.conThieu(loi),
        phu: onTiep ? <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy || !n} onClick={() => void gui(false)}>Xác nhận {n} em</button> : undefined,
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !n} onClick={() => void gui(!!onTiep)}>
            {busy ? 'Đang lưu…' : onTiep ? 'Xác nhận · việc tiếp ›' : `Xác nhận ${n} em`}
          </button>
        ),
      } : {
        huy: null,
        chinh: onTiep ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onTiep}>Việc tiếp ›</button>
          : <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong}>Đóng</button>,
      }}>
      <div className="space-y-4 pt-3">
        {daLuu && (
          <p role="status" className="m-0 inline-flex flex-wrap items-center gap-1.5 rounded-lg border border-ok-line px-3 py-2 text-[13px] text-ok" style={{ background: 'var(--surface)' }}>
            ✓ Đã xác nhận {daLuu.soEm} em{daLuu.tenPa ? ` · PA ${daLuu.tenPa} chạy từ ${ngay(daLuu.ngay, homNay)}` : ''}
          </p>
        )}
        {loiGui && <p role="alert" className="m-0 rounded-lg border border-bad-line bg-bad-bg px-3 py-2 text-[13px] text-slate-200">{loiGui}</p>}

        {cho.length > 0 && (
          <>
            <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line)' }}>
              <div className="hidden grid-cols-[32px_minmax(0,1fr)_52px_64px_64px_minmax(0,96px)] items-center gap-2 border-b px-2.5 py-1.5 text-xs font-bold uppercase tracking-[.04em] text-slate-500 sm:grid"
                style={{ borderColor: 'var(--line)' }}>
                <input type="checkbox" className="h-[18px] w-[18px]" aria-label="Chọn tất cả" checked={tatCaChon}
                  onChange={() => setChon(tatCaChon ? new Set() : new Set(cho.map((e) => e.caseId)))} />
                <span>Học viên</span><span className="text-right">{knNgan}</span><span className="text-right">{data.lop.thuong ? '' : 'Kỳ vọng'}</span>
                <span>SOS</span><span>Ghi chú riêng</span>
              </div>
              <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>
                {cho.map((e) => {
                  const on = chon.has(e.caseId);
                  return (
                    <li key={e.caseId} className={`grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5 px-2.5 py-2 text-[13px] sm:grid-cols-[32px_minmax(0,1fr)_52px_64px_64px_minmax(0,96px)] ${on ? '' : 'text-slate-400'}`}>
                      {/* Vùng bấm 44 px trên điện thoại (ô vẽ 22 px). */}
                      <label className="-my-2 flex min-h-[44px] items-center sm:my-0 sm:min-h-0">
                        <input type="checkbox" className="h-[22px] w-[22px] sm:h-[18px] sm:w-[18px]" checked={on} onChange={() => doiChon(e.caseId)} aria-label={`Chọn ${e.ten}`} />
                      </label>
                      <span className="min-w-0">
                        <Link className={`font-semibold ${on ? 'text-slate-100' : 'text-slate-400'} hover:underline`} to={duongHoSoHocVien(e.studentId)}>
                          {e.ten} <span aria-hidden className="text-xs text-[color:var(--accent)]">↗</span>
                        </Link>
                        {/* Điện thoại: điểm · kỳ vọng · làm riêng dưới tên (mockup 375). */}
                        <span className="block text-xs tabular-nums text-slate-500 sm:hidden">
                          {knNgan} {diem(e)}{e.kyVong !== null ? ` · kỳ vọng ${fmtBand(e.kyVong)}` : ''}{e.lamRieng ? ' · làm riêng' : ''}
                        </span>
                      </span>
                      <span className={`hidden text-right tabular-nums sm:block ${e.kyVong !== null && e.band !== null && e.band < e.kyVong - 1 ? 'font-bold text-bad' : ''}`}>{diem(e)}</span>
                      <span className="hidden text-right tabular-nums sm:block">{e.kyVong !== null ? fmtBand(e.kyVong) : ''}</span>
                      <span>{e.sos ? <Level tone={toneTheoNhan(`SOS ${e.sos}`, 'info')}>SOS {e.sos}</Level> : null}</span>
                      <span className="hidden text-xs text-slate-400 sm:block">{e.lamRieng ? <span title={e.pa ? `PA theo quy chế: ${e.pa.ten} · ${e.pa.mocChu}` : undefined}>làm riêng</span> : '—'}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <Truong nhan={`Nguyên nhân chính · ${n} em đã chọn`} batBuoc as="div" loi={lf.loiCua(loi, 'nguyen-nhan')}>
              <div className="flex flex-wrap gap-1.5" id={lf.oId('nguyen-nhan')} tabIndex={-1}>
                {causes.map((c) => <NutChon key={c.code} nho chon={code === c.code} title={c.hint} onClick={() => setCode(c.code)}>{c.label}</NutChon>)}
              </div>
            </Truong>
            <OKhac hien={laKhac(code)} value={ghiRo} onChange={setGhiRo} goiY="Ví dụ: Chưa quen dạng bài mới"
              id={lf.oId('ghi-ro')} onBlur={lf.roi('ghi-ro')} loi={lf.hien('ghi-ro') ? kiemGhiRoKhac(ghiRo) : null} />
            <Truong nhan="Mô tả" batBuoc loi={lf.loiCua(loi, 'mo-ta')} dem={{ co: moTa.trim().length, can: 15 }}>
              <textarea className="field w-full" rows={2} {...lf.o(loi, 'mo-ta')} value={moTa} onChange={(e) => setMoTa(e.target.value)}
                placeholder="Ví dụ: Sai nhiều dạng True / False / Not Given" />
            </Truong>

            {pa && v && (
              <section className="space-y-3 rounded-[10px] border p-3" style={{ borderColor: 'var(--line-strong)' }}>
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-[13.5px] text-slate-100">Phương án</b>
                  <span className="text-xs text-slate-500">theo quy chế {data.luot.nhan}</span>
                  <span className="flex-1" />
                  <label className="inline-flex min-h-[44px] items-center gap-2 text-xs text-slate-300 sm:min-h-0">
                    xác nhận cùng lúc
                    <input type="checkbox" className="h-[18px] w-[18px]" checked={cungLuc} onChange={(e) => setCungLuc(e.target.checked)} />
                  </label>
                </div>
                {cungLuc && (
                  <>
                    <OKhoa nhan="Loại PA" chu={pa.ten} sau="theo quy chế" phu={`Kết thúc theo quy chế: ${pa.mocChu}`} />
                    <FormPa phang v={v} dat={(p) => setVs((m) => ({ ...m, [pa.id]: { ...v, ...p } }))} lf={lf} loi={loiPa} toiThieu={15}
                      ngay={<NgayKhoa chu={`Tuần này · ${tuanLich(homNay, homNay)}`} />}
                      cuoi={<p className="m-0 text-xs text-slate-500">Áp chung cho {n} em đã chọn; sửa riêng từng em sau trong Ngăn Case.</p>} />
                  </>
                )}
              </section>
            )}

            {khongTheoDoi !== null && (
              <section className="space-y-2">
                {cho.length > 1 && (
                  <label className="flex items-center gap-2 text-xs text-slate-300">
                    Em
                    <select className="field h-9 !py-0" value={khongTheoDoi} onChange={(e) => setKhongTheoDoi(Number(e.target.value))}>
                      {cho.map((e) => <option key={e.caseId} value={e.caseId}>{e.ten}</option>)}
                    </select>
                  </label>
                )}
                <KhongTheoDoiForm key={khongTheoDoi} caseId={khongTheoDoi} onClose={() => setKhongTheoDoi(null)} onDone={() => { onDaLuu(); reload(); }} />
              </section>
            )}
          </>
        )}
      </div>
    </KhungPanel>
  );
}
