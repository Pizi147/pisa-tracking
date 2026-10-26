import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { LichSuThayDoi } from '../../ui/LichSuThayDoi.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { Field, Outcome, Th } from '../../ui/ui.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonLop } from '../../ui/ChonLop.tsx';
import {
  chuanOTarget, cotLuoiNhap, dsLoi, duongDotTest, nhanCotNhap, tuanBatDauMacDinh, type CachDoc, type CotNhap, type VanDeNhap,
  kyThiCuaChuongTrinh,
} from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ONgay } from '../../ui/ONgay.tsx';

/** Một dòng của lưới: chữ thô như người nhập gõ/dán — máy chủ đọc và kiểm lại (ngày `dd/mm/yyyy`, email, band). */
type Row = Partial<Record<CotNhap, string | number | null>>;
type PreviewRow = { row: number; issues: VanDeNhap[] };
type Preview = { rows: PreviewRow[]; issues: VanDeNhap[]; defaultStartWeek?: string | null };
type KetQua = {
  added: number; hangDaThem: number[];
  mt?: { soEm: number; soLuotLichSu: number; soEmCoLichSu: number; luotLichSuDau: number | null };
};

const ISO_NGAY = /^\d{4}-\d{2}-\d{2}$/;
const moiKhoa = () => `intake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const dongTrong = (r: Row) => Object.values(r).every((v) => !String(v ?? '').trim());

/* Bề rộng cột theo M2 (px). Cột Tình trạng do panel vẽ, không nằm trong `cotLuoiNhap`. */
const RONG: Partial<Record<CotNhap, number>> = {
  /* I3 (PR-SL): "Overall" và chữ mẫu "dd/mm/yyyy" không bị cắt. */
  fullName: 170, dob: 170, email: 190, baselineScore: 72, entryListening: 48, entryReading: 48, entryWriting: 48,
  entrySpeaking: 48, target: 80, examDate: 104, daThiToiMt: 104, startWeek: 172,   // OV-9: Target 80 cho "6.5 KCK"
};
const GOI_Y_COT: Partial<Record<CotNhap, string>> = {
  fullName: t('Em đã có hồ sơ thì dùng Chuyển lớp, không tạo mới.'),
  baselineScore: t('Con số trên phiếu điểm chính thức. Nhập độc lập với bốn môn — không phải trung bình cộng.'),
  entryWriting: t('Writing TỔNG trên phiếu điểm — không chia W1/W2.'),
  target: t('Band 0–9, bước 0,5. Em không cam kết đầu ra: thêm KCK (ví dụ 6.5 KCK; chưa có Target thì gõ KCK) — vẫn có kỳ vọng MT, không tính SOS. Bỏ trống = chưa có Target. Lớp thường: chỉ để theo dõi.'),
  examDate: t('Gõ dd/mm/yyyy nếu đã biết ngày, mm/yyyy nếu mới biết tháng.'),
  daThiToiMt: t('Em cũ đã thi tới MT mấy ngoài web — web tạo sẵn các lượt đó là MT cũ để nhập điểm bù. Bỏ trống = em mới.'),
  startWeek: t('Theo tuần chọn ở đầu panel; đổi riêng từng dòng được. Em vào muộn: cột Trạng thái báo trước MT nào sẽ là MT cũ.'),
};

/** Mũi tên nhỏ vẽ SVG (▸/▾ của Inter ở cỡ chữ nhỏ chỉ còn như một dấu chấm). */
function MuiTen({ mo }: { mo: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 7 5" width="7" height="5" className="inline-block"
      style={{ transform: mo ? undefined : 'rotate(-90deg)' }}>
      <path d="M0 0h7L3.5 5z" fill="currentColor" />
    </svg>
  );
}

/**
 * Thêm nhiều học viên trong một lần (M2, YC-5.1…5.4).
 *
 * Dán vùng bảng từ Excel/Google Sheets — có dòng tiêu đề thì cột nhận theo tên; không có thì theo MẪU EXCEL CHUNG — thứ tự cột Fast Track cho mọi lớp, lớp thường bỏ cột band (PR-SL 04/10) —
 * hoặc gõ thẳng vào lưới. Hàng cao đều: lỗi/lưu ý dồn về
 * cột Tình trạng, bấm mở một dòng chi tiết. Dòng lỗi không khoá cả lô — dòng sẵn sàng được thêm, dòng lỗi ở lại để sửa (K2-21).
 * Máy chủ soát lại từng dòng theo phạm vi quyền trước khi ghi.
 */
export function IntakePanel({ defaultClass, onClose, onDone }: {
  defaultClass: { id: number; code: string } | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { pathname } = useLocation();
  const classes = useApi<any[]>('/ref/classes');
  /* LỚP CHỌN MỘT LẦN, Ở ĐẦU PANEL (mục 12.1). Mở từ hồ sơ lớp thì chọn sẵn đúng lớp đó. */
  const [classId, setClassId] = useState<number | null>(defaultClass?.id ?? null);
  /** Tuần cả lô người nhập tự chọn; '' = theo mặc định (K2-19). */
  const [startWeek, setStartWeek] = useState('');
  const [rows, setRows] = useState<Row[]>([{}]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [moDong, setMoDong] = useState<number | null>(null);
  const [ketQua, setKetQua] = useState<KetQua | null>(null);
  const [busy, setBusy] = useState(false);
  const [lichSu, setLichSu] = useState(false);   // OV-15g: lịch sử các lô nhập vào lớp — thay nội dung panel, ← Thêm học viên (lưới giữ nguyên)
  /* O5: ô của cả lô báo lỗi dưới ô; lỗi từng dòng vẫn ở cột Trạng thái (máy chủ xem trước + kiểm lại khi thêm). */
  const lf = useLoiForm();
  const loiLo = dsLoi([{ khoa: 'lop', nhan: t('Thêm vào lớp'), chon: true }], { lop: classId });
  const [pasteText, setPasteText] = useState('');
  /* PR-NT: giữ nội dung vừa dán + cách đã đọc để đổi cách đọc (tiêu đề ↔ học viên) mà không phải dán lại. */
  const [daDan, setDaDan] = useState<{ text: string; cach: CachDoc | null } | null>(null);
  // Khoá idempotency giữ nguyên trong một lần thêm (bấm hai lần / thử lại sau lỗi mạng không tạo trùng); thêm xong thì đổi khoá.
  const idempotencyKey = useRef(moiKhoa());

  const pv = preview;
  const cls = (classes.data ?? []).find((c: any) => c.id === classId) ?? null;
  const lopThuong = cls?.scoring_mode === 'ratio';
  const ktLop = kyThiCuaChuongTrinh(cls?.programme_code);   // P13: lớp KET / PET — Target theo thang Cambridge
  const cols = cotLuoiNhap(lopThuong);
  const macDinh = cls ? tuanBatDauMacDinh({ lopThuong, khaiGiang: cls.start_date ?? null }, homNay) : null;
  const tuanChung = startWeek || macDinh || '';

  const doiLuoi = (f: (rs: Row[]) => Row[]) => { setRows(f); setPreview(null); };
  const setCell = (i: number, key: CotNhap, v: string) => doiLuoi((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: v } : r)));

  const handlePaste = async (text: string, coTieuDe?: boolean) => {
    if (!text.trim()) return;
    try {
      const r = await api.post<{ rows: Row[]; cotBoQua: string[]; cach: CachDoc | null }>('/intake/parse', { text, classId, coTieuDe });
      if (!r.rows.length) { toast.push('error', t('Không đọc được dòng nào từ nội dung đã dán.')); return; }
      doiLuoi(() => r.rows);
      setMoDong(null); setKetQua(null); setPasteText(''); setDaDan({ text, cach: r.cach });
    } catch (e: any) { toast.push('error', e.message); }
  };
  const cach = daDan?.cach ?? null;

  const runPreview = useCallback(async () => {
    if (!classId) { setPreview(null); return; }
    try {
      setPreview(await api.post<Preview>('/intake/preview', { rows, classId, defaultStartWeek: tuanChung || null }));
    } catch (e: any) { toast.push('error', e.message); }
  }, [rows, classId, tuanChung, toast]);

  /* Xem trước chạy TỰ ĐỘNG: người nhập thấy dòng nào cần sửa ngay khi vừa dán hoặc gõ xong, không đợi bấm Thêm. */
  useEffect(() => {
    const t = setTimeout(() => { void runPreview(); }, 400);
    return () => clearTimeout(t);
  }, [runPreview]);

  const vanDe = (i: number) => (dongTrong(rows[i]) ? [] : pv?.rows.find((x) => x.row === i + 1)?.issues ?? []);
  const coLoi = (i: number) => vanDe(i).some((x) => x.muc === 'loi');
  const hangCoDuLieu = rows.map((_, i) => i).filter((i) => !dongTrong(rows[i]));
  const san = pv ? hangCoDuLieu.filter((i) => !coLoi(i)).length : 0;
  const canSua = pv ? hangCoDuLieu.filter((i) => coLoi(i)).length : 0;

  const commit = async () => {
    lf.bam();
    if (busy || loiLo.length > 0) return;
    setBusy(true);
    try {
      const r = await api.post<KetQua>('/intake/commit', {
        rows, classId, defaultStartWeek: tuanChung || null, idempotencyKey: idempotencyKey.current,
      });
      /* K2-21: panel Ở LẠI — bỏ các dòng đã thêm, giữ dòng còn lỗi để sửa rồi thêm tiếp (khoá mới, không trả lại kết quả cũ). */
      idempotencyKey.current = moiKhoa();
      const daThem = new Set(r.hangDaThem);
      doiLuoi((rs) => { const con = rs.filter((_, j) => !daThem.has(j + 1)); return con.length ? con : [{}]; });
      setMoDong(null);
      setKetQua(r);
      if (r.added > 0) { onDone(); setDaDan(null); }
      else toast.push('info', t('Chưa thêm được dòng nào — xem cột Trạng thái.'));
    } catch (e: any) {
      toast.push('error', e.message);        // giữ nguyên lưới đang nhập để thử lại
    } finally { setBusy(false); }
  };

  const denDongCanSua = () =>
    document.querySelector('[data-needs-fix="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  /* CA2-10: bỏ câu giải thích dưới ô — chỉ giữ chỗ người nhập phải tự chọn. */
  const goiYTuan = cls && !macDinh ? t('Lớp chưa có ngày khai giảng.') : null;

  const hoSoLop = classId ? `/hoc-vien/lop/${classId}` : null;

  if (lichSu && classId) {
    return <LichSuThayDoi loai="nhap-hv" id={classId} dong2={[t('Thêm học viên'), cls?.code]} quayLai={{ nhan: t('Thêm học viên'), onClick: () => setLichSu(false) }} onClose={onClose} />;
  }
  return (
    <KhungPanel tieuDe={t('Thêm học viên')} lop={cls?.code} rong="toan" onDong={onClose}
      ngCanh={t('Chọn lớp, dán từ Excel hoặc gõ vào lưới')}
      chan={{
        /* Luật S3 (I1): có dòng đã gõ hoặc chữ trong ô dán → "Huỷ thay đổi". */
        daSua: !!pasteText.trim() || rows.some((r) => !dongTrong(r)), huy: { onClick: onClose, disabled: busy },
        conThieu: lf.conThieu(loiLo),
        phu: pv && hangCoDuLieu.length > 0 && (
          <span className="text-xs text-slate-400 tabular-nums">
            {t('{n} dòng sẵn sàng', { n: san })}
            {canSua > 0 && <> · <button type="button" className="link inline-flex min-h-[44px] items-center appearance-none border-0 bg-transparent p-0 text-xs sm:min-h-0"
              onClick={denDongCanSua}>{t('{n} dòng cần sửa', { n: canSua })}</button></>}
          </span>
        ),
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={commit}
            disabled={busy || (!!classId && (!pv || san === 0))}>
            {busy ? t('Đang lưu…') : san > 0 ? t('Thêm {n} học viên', { n: san }) : t('Thêm học viên')}
          </button>
        ),
      }}>
      <div className="space-y-4 pt-3">
        {/* LỚP VÀ TUẦN BẮT ĐẦU — hai quyết định của CẢ LÔ, đặt ở trên cùng: lớp quyết định lưới có những cột nào. */}
        <div className="surface-2 rounded-lg p-3 grid gap-3 sm:grid-cols-2">
          <Field label={t('Thêm vào lớp')} required loi={lf.loiCua(loiLo, 'lop')}>
            <ChonLop ariaLabel={t('Thêm vào lớp')} {...lf.o(loiLo, 'lop')} value={classId} khongKhop={classes.data ? undefined : t('Đang tải…')}
              onChange={(id) => { setClassId(id); setStartWeek(''); setKetQua(null); setPreview(null); setDaDan(null); }}
              ds={(classes.data ?? []).map((c: any) => ({ id: c.id, ma: c.code, phu: c.programme_name ?? undefined }))} />
          </Field>
          <Field label={t('Tuần bắt đầu học (mặc định cho mọi dòng)')} hint={goiYTuan ?? undefined}>
            <ONgay kieu="tuan" value={tuanChung} onChange={(v) => { setStartWeek(v); setPreview(null); }} />
          </Field>
        </div>

        {/* I3: ô dán phông thường, nút "Đọc nội dung đã dán" nằm DƯỚI ô dán. */}
        <div className="space-y-2">
          <label className="block">
            <span className="label">{t('Dán vùng bảng từ Excel / Google Sheets')}</span>
            <textarea
              className="field text-xs"
              rows={3}
              disabled={!classId}
              placeholder={classId ? t('Dán từ Excel') : t('Chọn lớp trước')}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text/plain');
                if (text.includes('\t') || text.includes('\n')) { e.preventDefault(); void handlePaste(text); }
              }}
            />
          </label>
          <div className="flex justify-end">
            <button type="button" className="btn btn-sm min-h-[44px] w-full justify-center sm:w-auto sm:min-h-0" onClick={() => void handlePaste(pasteText)} disabled={!classId || !pasteText.trim()}>
              {t('Đọc nội dung đã dán')}
            </button>
          </div>
        </div>

        {/* PR-NT: nói rõ web đã đọc vùng dán thế nào, đổi được bằng một nút (không dùng toast — toast tự tắt). */}
        {cach && daDan && (
          <div className="text-xs text-slate-300 space-y-1" role="status">
            <p className="m-0">
              {cach.coTieuDe
                ? <>{t('Đã đọc theo dòng tiêu đề')}{cach.boQua.length ? ` · ${t('bỏ qua cột {ds}', { ds: cach.boQua.join(', ') })}` : ''}.</>
                : <>{t('Đã đọc theo mẫu Excel chung: {ds}.', { ds: cach.thuTu.map((k) => dich(nhanCotNhap(k))).join(' · ') })}{cach.boQua.length ? ` ${t('Lớp thường bỏ qua cột {ds}.', { ds: cach.boQua.join(', ') })}` : ''}</>}
              {' '}
              <button type="button" className="link flex min-h-[44px] items-center appearance-none border-0 bg-transparent p-0 text-xs align-baseline sm:inline-flex sm:min-h-0"
                onClick={() => void handlePaste(daDan.text, !cach.coTieuDe)}>
                {cach.coTieuDe ? t('Dòng đầu là học viên?') : t('Dòng đầu là tiêu đề?')}
              </button>
            </p>
            {cach.thua > 0 && <p className="m-0 text-soon">{t('Mỗi dòng dư {n} ô ở cuối — đã bỏ. Kiểm lại thứ tự cột.', { n: cach.thua })}</p>}
            {cach.thieu > 0 && <p className="m-0 text-slate-400">{t('{n} cột cuối để trống — điền thêm trên lưới nếu cần.', { n: cach.thieu })}</p>}
          </div>
        )}

        {ketQua && ketQua.added > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Outcome tone="ok" mark="✓">
              {t('Đã thêm {n} học viên vào {lop}', { n: ketQua.added, lop: cls?.code ?? t('lớp') })}
              {ketQua.mt?.soEm ? ` · ${t('đã lên lịch MT cho {n} em', { n: ketQua.mt.soEm })}` : ''}
            </Outcome>
            {!!ketQua.mt?.soLuotLichSu && (
              <span className="text-xs text-soon tabular-nums">
                {t('{n} MT cũ chưa có điểm ({em})', { n: ketQua.mt.soLuotLichSu, em: t('{n} em', { n: ketQua.mt.soEmCoLichSu }) })}
              </span>
            )}
            {ketQua.mt?.luotLichSuDau && (
              <Link className="link text-xs" to={duongDotTest({ id: ketQua.mt.luotLichSuDau, kind: 'mock' })}>{t('Nhập điểm MT cũ')}</Link>
            )}
            {hoSoLop && pathname !== hoSoLop && <Link className="link text-xs" to={hoSoLop}>{t('Mở hồ sơ lớp')}</Link>}
            <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-xs max-sm:py-2" onClick={() => setLichSu(true)}>{t('Lịch sử')}</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm" style={{ minWidth: lopThuong ? 960 : 1300 }}>
            <colgroup>
              <col style={{ width: 32 }} />
              {cols.map((c) => <col key={c.key} style={{ width: RONG[c.key] }} />)}
              <col style={{ width: 120 }} />
            </colgroup>
            <thead>
              <tr>
                <th className="th">#</th>
                {cols.map((c) => (
                  <Th key={c.key} hint={c.key === 'target' && ktLop ? t('{ten}: số nguyên {min}–{max}, không KCK. Bỏ trống = chưa có Target.', { ten: ktLop.ten, min: ktLop.min, max: ktLop.max }) : GOI_Y_COT[c.key]} align={c.so ? 'right' : 'left'}>
                    {dich(c.nhan)}{c.batBuoc && <span className="text-bad"> *</span>}
                  </Th>
                ))}
                <Th>{t('Trạng thái')}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const ds = vanDe(i);
                const nLoi = ds.filter((x) => x.muc === 'loi').length;
                const nLuuY = ds.length - nLoi;
                const mo = moDong === i && ds.length > 0;
                const giaTriTuan = String(r.startWeek ?? '') || tuanChung;
                return (
                  <Fragment key={i}>
                    <tr data-needs-fix={nLoi > 0 ? 'true' : undefined}>
                      <td className="td px-2 py-1.5 text-xs tabular-nums text-slate-500">{i + 1}</td>
                      {cols.map((c) => {
                        const cua = ds.filter((x) => x.field === c.key);
                        const loiO = cua.some((x) => x.muc === 'loi');
                        const vien = loiO ? ' border-late' : cua.length ? ' border-soon' : '';
                        const title = cua.map((x) => dich(x.message)).join(' · ') || undefined;
                        const nhan = t('{cot} dòng {n}', { cot: dich(c.nhan), n: i + 1 });
                        return (
                          <td key={c.key} className="td px-1.5 py-1.5">
                            {c.key === 'startWeek' && (!giaTriTuan || ISO_NGAY.test(giaTriTuan)) ? (
                              <ONgay gon kieu="tuan" value={giaTriTuan} ariaLabel={nhan} invalid={loiO}
                                onChange={(v) => setCell(i, 'startWeek', v === tuanChung ? '' : v)} />
                            ) : c.key === 'dob' && (!r.dob || ISO_NGAY.test(String(r.dob))) ? (
                              /* Quyết định 06/10: ô ngày = gõ + nút lịch (như Sửa cả lớp). Chữ dán chưa phải ISO giữ ô gõ thường — máy chủ đọc. */
                              <ONgay gon kieu="ngay" value={String(r.dob ?? '')} ariaLabel={nhan} invalid={loiO}
                                toiDa={homNay} onChange={(v) => setCell(i, 'dob', v)} />
                            ) : (
                              <input
                                className={`field${c.so ? ' text-right tabular-nums' : ''}${c.key === 'email' ? ' placeholder:font-bold placeholder:text-late' : ''}${vien}`}
                                value={String(r[c.key] ?? '')}
                                type={c.key === 'email' ? 'email' : 'text'}
                                inputMode={c.key === 'target' ? undefined : c.so ? 'decimal' : c.key === 'email' ? 'email' : undefined}
                                placeholder={c.key === 'dob' ? 'dd/mm/yyyy' : c.key === 'email' && !dongTrong(r) ? t('Thiếu') : undefined}
                                autoComplete="off"
                                title={title}
                                aria-invalid={loiO || undefined}
                                aria-label={nhan}
                                onChange={(e) => setCell(i, c.key, e.target.value)}
                                onBlur={c.key === 'target' ? (e) => { const v = chuanOTarget(e.target.value); if (v !== e.target.value) setCell(i, 'target', v); } : undefined}
                              />
                            )}
                          </td>
                        );
                      })}
                      <td className="td px-2 py-1.5 whitespace-nowrap text-xs">
                        {dongTrong(r) || !pv ? <span className="text-slate-500">—</span>
                          : ds.length === 0 ? <span className="text-ok">✓ {t('Sẵn sàng')}</span>
                          : (
                            <button type="button" aria-expanded={mo} onClick={() => setMoDong(mo ? null : i)}
                              className={`inline-flex min-h-[44px] items-center gap-1.5 appearance-none border-0 bg-transparent p-0 text-xs sm:min-h-0 ${nLoi ? 'text-late' : 'text-soon'}`}>
                              {[nLoi && t('{n} lỗi', { n: nLoi }), nLuuY && t('{n} lưu ý', { n: nLuuY })].filter(Boolean).join(' · ')}
                              <MuiTen mo={mo} />
                            </button>
                          )}
                      </td>
                    </tr>
                    {mo && (
                      <tr>
                        <td colSpan={cols.length + 2} className="td surface-2 px-2 py-2 text-[13px] text-slate-200">
                          {/* Chi tiết trải ngang nhưng neo ở mép trái vùng cuộn — trên điện thoại vẫn đọc được, không phải cuộn ngang. */}
                          <div className="sticky left-0 max-w-[calc(100vw-4rem)] whitespace-normal">
                            {t('Dòng {n}', { n: i + 1 })}
                            {ds.map((x, k) => (
                              <span key={k}> · <b className={x.muc === 'loi' ? 'text-late' : 'text-soon'}>{dich(nhanCotNhap(x.field))}</b>: {dich(x.message)}</span>
                            ))}
                            <button type="button" className="link ml-3 inline-flex min-h-[44px] items-center appearance-none border-0 bg-transparent p-0 text-xs align-middle sm:min-h-0"
                              onClick={() => { doiLuoi((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : [{}])); setMoDong(null); }}>
                              {t('Xoá dòng này')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => doiLuoi((rs) => [...rs, {}])}>
            {t('+ Thêm dòng')}
          </button>
        </div>
      </div>
    </KhungPanel>
  );
}
