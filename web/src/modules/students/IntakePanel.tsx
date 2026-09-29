import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { Field, Outcome, Th } from '../../ui/ui.tsx';
import {
  KCK, cotLuoiNhap, laKck, nhanCotNhap, tuanBatDauMacDinh, type CotNhap, type VanDeNhap,
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
  fullName: 170, dob: 104, email: 190, baselineScore: 56, entryListening: 48, entryReading: 48, entryWriting: 48,
  entrySpeaking: 48, target: 60, examDate: 104, daThiToiMt: 104, startWeek: 172,
};
const GOI_Y_COT: Partial<Record<CotNhap, string>> = {
  dob: 'Gõ dd/mm/yyyy.',
  baselineScore: 'Con số trên phiếu điểm chính thức. Nhập độc lập với bốn môn — không phải trung bình cộng.',
  entryWriting: 'Writing TỔNG trên phiếu điểm — không chia W1/W2.',
  target: `Band 0–9, bước 0,5. Gõ KCK (hoặc -) nếu em không cam kết đầu ra: không kỳ vọng MT, không tính SOS. Bỏ trống = chưa có target.`,
  examDate: 'Gõ dd/mm/yyyy nếu đã biết ngày, mm/yyyy nếu mới biết tháng.',
  daThiToiMt: 'Em cũ đã thi tới MT mấy ngoài web — web tạo sẵn các lượt đó là MT lịch sử để nhập điểm bù. Bỏ trống = em mới.',
  startWeek: 'Theo tuần chọn ở đầu panel; đổi riêng từng dòng được.',
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
 * Dán vùng bảng CÓ DÒNG TIÊU ĐỀ từ Excel/Google Sheets (cột nhận theo tên), hoặc gõ thẳng vào lưới. Hàng cao đều: lỗi/lưu ý dồn về
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
  const [pasteText, setPasteText] = useState('');
  // Khoá idempotency giữ nguyên trong một lần thêm (bấm hai lần / thử lại sau lỗi mạng không tạo trùng); thêm xong thì đổi khoá.
  const idempotencyKey = useRef(moiKhoa());

  const pv = preview;
  const cls = (classes.data ?? []).find((c: any) => c.id === classId) ?? null;
  const lopThuong = cls?.scoring_mode === 'ratio';
  const cols = cotLuoiNhap(lopThuong);
  const macDinh = cls ? tuanBatDauMacDinh({ lopThuong, khaiGiang: cls.start_date ?? null }, homNay) : null;
  const tuanChung = startWeek || macDinh || '';

  const doiLuoi = (f: (rs: Row[]) => Row[]) => { setRows(f); setPreview(null); };
  const setCell = (i: number, key: CotNhap, v: string) => doiLuoi((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: v } : r)));

  const handlePaste = async (text: string) => {
    if (!text.trim()) return;
    try {
      const r = await api.post<{ rows: Row[]; cotBoQua: string[] }>('/intake/parse', { text });
      if (!r.rows.length) { toast.push('error', 'Không đọc được dòng nào từ nội dung đã dán.'); return; }
      doiLuoi(() => r.rows);
      setMoDong(null); setKetQua(null); setPasteText('');
      toast.push('ok', `Đã đọc ${r.rows.length} dòng${r.cotBoQua.length ? ` · bỏ qua cột ${r.cotBoQua.join(', ')}` : ''}.`);
    } catch (e: any) { toast.push('error', e.message); }
  };

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
    if (busy) return;
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
      if (r.added > 0) onDone();
      else toast.push('info', 'Chưa thêm được dòng nào — xem cột Tình trạng.');
    } catch (e: any) {
      toast.push('error', e.message);        // giữ nguyên lưới đang nhập để thử lại
    } finally { setBusy(false); }
  };

  const denDongCanSua = () =>
    document.querySelector('[data-needs-fix="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const goiYTuan = !cls ? null
    : !macDinh ? 'Lớp chưa có ngày khai giảng — chọn tuần bắt đầu cho cả lô.'
    : startWeek ? 'Đổi ở đây thì mọi dòng chưa sửa tay đổi theo.'
    : !cls.start_date ? 'Lớp chưa có ngày khai giảng nên mặc định tuần này. Đổi ở đây thì mọi dòng chưa sửa tay đổi theo.'
    : lopThuong ? 'Lấy sẵn tuần khai giảng của lớp. Đổi ở đây thì mọi dòng chưa sửa tay đổi theo.'
    : 'Lấy sẵn tuần khai giảng của lớp. Em vào muộn thì đổi tuần — cột Tình trạng báo trước MT nào sẽ là MT lịch sử.';

  const hoSoLop = classId ? `/hoc-vien/lop/${classId}` : null;

  return (
    <KhungPanel tieuDe="Thêm học viên" lop={cls?.code} rong="toan" onDong={onClose}
      ngCanh="Chọn lớp, rồi dán từ Excel/Google Sheets hoặc gõ thẳng vào lưới"
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose, disabled: busy },
        phu: pv && hangCoDuLieu.length > 0 && (
          <span className="text-xs text-slate-400 tabular-nums">
            {san} dòng sẵn sàng
            {canSua > 0 && <> · <button type="button" className="link inline-flex min-h-[44px] items-center appearance-none border-0 bg-transparent p-0 text-xs sm:min-h-0"
              onClick={denDongCanSua}>{canSua} dòng cần sửa</button></>}
          </span>
        ),
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={commit}
            disabled={busy || !classId || !pv || san === 0}>
            {busy ? 'Đang lưu…' : san > 0 ? `Thêm ${san} học viên` : 'Thêm học viên'}
          </button>
        ),
      }}>
      <div className="space-y-4 pt-3">
        {/* LỚP VÀ TUẦN BẮT ĐẦU — hai quyết định của CẢ LÔ, đặt ở trên cùng: lớp quyết định lưới có những cột nào. */}
        <div className="surface-2 rounded-lg p-3 grid gap-3 sm:grid-cols-2">
          <Field label="Thêm vào lớp" required hint="Cột “Lớp” và “Lộ trình” trong file dán sẽ bị bỏ qua — theo lớp chọn ở đây.">
            <select className="field w-full" value={classId ?? ''}
              onChange={(e) => { setClassId(Number(e.target.value) || null); setStartWeek(''); setKetQua(null); setPreview(null); }}>
              <option value="">Chọn lớp…</option>
              {(classes.data ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.code}{c.programme_name ? ` · ${c.programme_name}` : ''}</option>
              ))}
            </select>
          </Field>
          <Field label="Tuần bắt đầu học (mặc định cho mọi dòng)" hint={goiYTuan ?? undefined}>
            <ONgay kieu="tuan" value={tuanChung} onChange={(v) => { setStartWeek(v); setPreview(null); }} />
          </Field>
          {!classId && (
            <p className="text-xs text-amber-200 m-0 sm:col-span-2">
              Chọn lớp trước thì lưới bên dưới mới biết phải hỏi những cột nào.
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className="label">Dán vùng bảng từ Excel / Google Sheets</span>
            <textarea
              className="field font-mono text-xs"
              rows={3}
              placeholder="Dán vùng bảng có dòng tiêu đề (Họ và tên, Ngày sinh, Email, …) — cột nhận theo tên, không theo thứ tự"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text/plain');
                if (text.includes('\t') || text.includes('\n')) { e.preventDefault(); void handlePaste(text); }
              }}
            />
          </label>
          <div className="flex items-end">
            <button type="button" className="btn btn-sm min-h-[44px] w-full justify-center sm:min-h-0" onClick={() => void handlePaste(pasteText)} disabled={!pasteText.trim()}>
              Đọc nội dung đã dán
            </button>
          </div>
        </div>

        {ketQua && ketQua.added > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Outcome tone="ok" mark="✓">
              Đã thêm {ketQua.added} học viên vào {cls?.code ?? 'lớp'}
              {ketQua.mt?.soEm ? ` · đã lên lịch MT cho ${ketQua.mt.soEm} em` : ''}
            </Outcome>
            {!!ketQua.mt?.soLuotLichSu && (
              <span className="text-xs text-soon tabular-nums">
                {ketQua.mt.soLuotLichSu} MT lịch sử chưa có điểm ({ketQua.mt.soEmCoLichSu} em)
              </span>
            )}
            {ketQua.mt?.luotLichSuDau && (
              <Link className="link text-xs" to={`/mock-test/${ketQua.mt.luotLichSuDau}`}>Nhập điểm MT lịch sử</Link>
            )}
            {hoSoLop && pathname !== hoSoLop && <Link className="link text-xs" to={hoSoLop}>Mở hồ sơ lớp</Link>}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm" style={{ minWidth: lopThuong ? 740 : 1300 }}>
            <colgroup>
              <col style={{ width: 32 }} />
              {cols.map((c) => <col key={c.key} style={{ width: RONG[c.key] }} />)}
              <col style={{ width: 120 }} />
            </colgroup>
            <thead>
              <tr>
                <th className="th">#</th>
                {cols.map((c) => (
                  <Th key={c.key} hint={GOI_Y_COT[c.key]} align={c.so ? 'right' : 'left'}>
                    {c.nhan}{c.batBuoc && <span className="text-bad"> *</span>}
                  </Th>
                ))}
                <Th>Tình trạng</Th>
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
                        const title = cua.map((x) => x.message).join(' · ') || undefined;
                        const nhan = `${c.nhan} dòng ${i + 1}`;
                        return (
                          <td key={c.key} className="td px-1.5 py-1.5">
                            {c.key === 'startWeek' && (!giaTriTuan || ISO_NGAY.test(giaTriTuan)) ? (
                              <ONgay gon kieu="tuan" value={giaTriTuan} ariaLabel={nhan} invalid={loiO}
                                onChange={(v) => setCell(i, 'startWeek', v === tuanChung ? '' : v)} />
                            ) : (
                              <input
                                className={`field${c.so ? ' text-right tabular-nums' : ''}${vien}`}
                                value={String(r[c.key] ?? '')}
                                type={c.key === 'email' ? 'email' : 'text'}
                                inputMode={c.key === 'target' ? undefined : c.so ? 'decimal' : c.key === 'email' ? 'email' : undefined}
                                placeholder={c.key === 'dob' ? 'dd/mm/yyyy' : undefined}
                                autoComplete="off"
                                title={title}
                                aria-invalid={loiO || undefined}
                                aria-label={nhan}
                                onChange={(e) => setCell(i, c.key, e.target.value)}
                                onBlur={c.key === 'target' ? (e) => { if (laKck(e.target.value) && e.target.value !== KCK) setCell(i, 'target', KCK); } : undefined}
                              />
                            )}
                          </td>
                        );
                      })}
                      <td className="td px-2 py-1.5 whitespace-nowrap text-xs">
                        {dongTrong(r) || !pv ? <span className="text-slate-500">—</span>
                          : ds.length === 0 ? <span className="text-ok">✓ Sẵn sàng</span>
                          : (
                            <button type="button" aria-expanded={mo} onClick={() => setMoDong(mo ? null : i)}
                              className={`inline-flex min-h-[44px] items-center gap-1.5 appearance-none border-0 bg-transparent p-0 text-xs sm:min-h-0 ${nLoi ? 'text-late' : 'text-soon'}`}>
                              {[nLoi && `${nLoi} lỗi`, nLuuY && `${nLuuY} lưu ý`].filter(Boolean).join(' · ')}
                              <MuiTen mo={mo} />
                            </button>
                          )}
                      </td>
                    </tr>
                    {mo && (
                      <tr>
                        <td colSpan={cols.length + 2} className="td surface-2 px-2 py-2 text-[12.5px] text-slate-200">
                          {/* Chi tiết trải ngang nhưng neo ở mép trái vùng cuộn — trên điện thoại vẫn đọc được, không phải cuộn ngang. */}
                          <div className="sticky left-0 max-w-[calc(100vw-4rem)] whitespace-normal">
                            Dòng {i + 1}
                            {ds.map((x, k) => (
                              <span key={k}> · <b className={x.muc === 'loi' ? 'text-late' : 'text-soon'}>{nhanCotNhap(x.field)}</b>: {x.message}</span>
                            ))}
                            <button type="button" className="link ml-3 inline-flex min-h-[44px] items-center appearance-none border-0 bg-transparent p-0 text-xs align-middle sm:min-h-0"
                              onClick={() => { doiLuoi((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : [{}])); setMoDong(null); }}>
                              Xoá dòng này
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
            + Thêm dòng
          </button>
          <p className="m-0 text-xs text-slate-400">
            Ô trống hoặc dấu “-” = chưa có, không phải 0. · Em đã có hồ sơ thì dùng Chuyển lớp, không tạo mới.
          </p>
        </div>
      </div>
    </KhungPanel>
  );
}
