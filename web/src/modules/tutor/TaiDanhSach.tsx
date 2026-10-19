import { useState } from 'react';
import { api, ApiError, invalidate } from '../../lib/api.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { BoLocDoan } from '../../ui/ui.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { t } from '@shared/i18n/index.ts';
import { nhanKyNang, nhanSdt, type ChiNhanh } from './kieu.ts';

type Kq = 'moi' | 'capNhat' | 'giuNguyen' | 'loi';
type DongTai = { so: number; ten: string; sdt: string | null; noiDay: number | 'online' | null; kyNang: string; kq: Kq; doi?: string[]; loi?: string[] };
type Cot = 'ten' | 'sdt' | 'noiDay' | 'kyNang';
type XemTruoc = { dong: DongTai[]; cot: Record<Cot, number>; soMoi: number; soCapNhat: number; soLoi: number };
type Loc = 'tat-ca' | 'moi' | 'capNhat' | 'loi';

/**
 * TẢI DANH SÁCH TUTOR (TU-b, đặc tả mục 8 + 13, mockup mục 4) — Chọn tệp (.xlsx / .xls / .csv, sheet đầu, thư viện `xlsx` nạp động) hoặc Dán từ Excel
 * (TSV); Tải mẫu (.xlsx 4 cột). Máy chủ xem trước bằng cùng hàm kiểm với lúc lưu: Mới · Cập nhật (trước → sau) · Lỗi (lý do từng dòng). Sửa ô của
 * dòng lỗi ngay tại bảng (rời ô = kiểm lại) hoặc dán lại. "Lưu n dòng" = mọi dòng hợp lệ, một giao dịch; dòng lỗi ở lại để sửa tiếp.
 */
export function TaiDanhSach({ dsChiNhanh, onDong }: { dsChiNhanh: ChiNhanh[]; onDong: () => void }) {
  const toast = useToast();
  const [cach, setCach] = useState<'tep' | 'dan'>('tep');
  const [tenTep, setTenTep] = useState<string | null>(null);
  const [dan, setDan] = useState('');
  const [rows, setRows] = useState<string[][] | null>(null);
  const [kq, setKq] = useState<XemTruoc | null>(null);
  const [loc, setLoc] = useState<Loc>('tat-ca');
  const [loi, setLoi] = useState<string | null>(null);
  const [gui, setGui] = useState(false);

  async function xemTruoc(r: string[][], luu = false) {
    setGui(true);
    setLoi(null);
    try {
      const x = await api.post<XemTruoc & { daLuu: boolean }>('/tutors/tai-len', { rows: r, luu });
      setRows(r);
      if (luu) {
        invalidate('/tutors');
        toast.push('ok', t('Đã lưu danh sách: {a} mới · {b} cập nhật', { a: x.soMoi, b: x.soCapNhat }));
        if (!x.soLoi) { onDong(); return; }
        const lai = await api.post<XemTruoc>('/tutors/tai-len', { rows: r, luu: false });
        setKq(lai);
        setLoc('loi');
        return;
      }
      setKq(x);
      setLoc(x.soLoi ? 'loi' : 'tat-ca');
    } catch (e) {
      setLoi(e instanceof ApiError ? e.message : t('Chưa đọc được dữ liệu — thử lại.'));
    } finally { setGui(false); }
  }
  async function chonTep(f: File | undefined) {
    if (!f) return;
    setLoi(null);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: '' }).map((r) => r.map((c) => String(c ?? '')));
      setTenTep(`${f.name} · ${t('sheet "{ten}"', { ten: wb.SheetNames[0] })}`);
      await xemTruoc(aoa);
    } catch {
      setLoi(t('Không đọc được tệp — chọn tệp .xlsx, .xls hoặc .csv.'));
    }
  }
  async function taiMau() {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Tên', 'SĐT', 'Nơi dạy', 'Kỹ năng'],
      ['Nguyễn Thu Lan', '0912 345 678', dsChiNhanh[0]?.ten ?? 'Monbay', 'L, R'],
      ['Trần Mai Anh', '', 'Chỉ online', 'W1, W2, S'],
    ]), 'Tutor');
    XLSX.writeFile(wb, 'mau-danh-sach-tutor.xlsx');
  }
  const suaO = (so: number, c: Cot, v: string) => {
    if (!rows || !kq || kq.cot[c] < 0) return;
    const r = rows.map((x) => [...x]);
    r[so - 1][kq.cot[c]] = v;
    setRows(r);
  };

  const NHAN_COT: Record<Cot, string> = { ten: t('Tên'), sdt: t('SĐT'), noiDay: t('Nơi dạy'), kyNang: t('Kỹ năng') };
  const nhanNoi = (d: DongTai) => (d.noiDay === 'online' ? t('Chỉ online') : d.noiDay ? dsChiNhanh.find((c) => c.id === d.noiDay)?.ten ?? '' : '');
  const dong = (kq?.dong ?? []).filter((d) => loc === 'tat-ca' || d.kq === loc);
  const soLuu = (kq?.soMoi ?? 0) + (kq?.soCapNhat ?? 0);
  const ketQua = (d: DongTai) => (
    d.kq === 'loi' ? <span className="text-xs text-late"><b className="font-semibold">{t('Lỗi')}</b><span className="block">{(d.loi ?? []).join(' · ')}</span></span>
      : d.kq === 'capNhat' ? <span className="text-xs text-slate-200"><b className="font-semibold">{t('Cập nhật')}</b><span className="block text-slate-400">{(d.doi ?? []).join(' · ')}</span></span>
        : d.kq === 'moi' ? <b className="text-xs font-semibold text-ok">{t('Mới')}</b> : <span className="text-xs text-slate-500">{t('Không đổi')}</span>
  );
  const o = (d: DongTai, c: Cot, hien: string) => (d.kq === 'loi' && kq && kq.cot[c] >= 0 && rows
    ? <input className="field w-full text-xs" aria-label={`${t('Dòng')} ${d.so} · ${NHAN_COT[c]}`} value={rows[d.so - 1]?.[kq.cot[c]] ?? ''}
      onChange={(e) => suaO(d.so, c, e.target.value)} onBlur={() => rows && xemTruoc(rows)} />
    : <span className="text-slate-300">{hien || '—'}</span>);

  return (
    <KhungPanel tieuDe={t('Tải danh sách tutor')} rong="rong" onDong={onDong}
      chan={{ huy: { onClick: onDong, nhan: t('Đóng') }, daSua: !!kq && soLuu > 0,
        dongTren: kq?.soLoi ? <span className="text-xs text-slate-400">{t('{n} dòng lỗi chưa lưu', { n: kq.soLoi })}</span> : undefined,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={gui || !soLuu || !rows} onClick={() => rows && xemTruoc(rows, true)}>
          {t('Lưu {n} dòng', { n: soLuu })}</button> }}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <BoLocDoan<'tep' | 'dan'> ariaLabel={t('Cách nhập')} value={cach} onChange={setCach}
            muc={[{ key: 'tep', nhan: t('Chọn tệp') }, { key: 'dan', nhan: t('Dán từ Excel') }]} />
          <span className="flex-1" />
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={taiMau}>⤓ {t('Tải mẫu')}</button>
        </div>
        <p className="m-0 text-xs text-slate-400">{t('Cột: Tên · SĐT · Nơi dạy (tên hoặc mã chi nhánh, "Chỉ online") · Kỹ năng (L, R, W1, W2, S; "W" = W1 + W2). Bắt buộc Tên + Kỹ năng; có hay không có dòng tiêu đề đều được. Tối đa 500 dòng.')}</p>
        {cach === 'tep' ? (
          <label className="flex min-h-[44px] cursor-pointer flex-wrap items-center gap-2 rounded-lg border border-dashed px-3 py-3 text-sm focus-within:ring-2 focus-within:ring-[color:var(--accent)]" style={{ borderColor: 'var(--line-strong)' }}>
            <input type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={(e) => { chonTep(e.target.files?.[0]); e.target.value = ''; }} />
            <span className="btn btn-sm">{tenTep ? t('Chọn tệp khác') : t('Chọn tệp')}</span>
            <span className="min-w-0 truncate text-slate-300">{tenTep ?? t('.xlsx, .xls hoặc .csv — đọc sheet đầu tiên')}</span>
          </label>
        ) : (
          <div className="space-y-2">
            <textarea className="field w-full font-mono text-xs" rows={5} value={dan} onChange={(e) => setDan(e.target.value)}
              placeholder={t('Chọn vùng 4 cột trong Excel / Google Sheets, Ctrl + C rồi dán vào đây.')} aria-label={t('Dán từ Excel')} />
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={!dan.trim() || gui}
              onClick={() => xemTruoc(dan.replace(/\r/g, '').split('\n').map((l) => l.split('\t')))}>{t('Xem trước')}</button>
          </div>
        )}
        {loi && <p role="alert" className="m-0 text-sm text-late">{loi}</p>}
        {kq && (
          <>
            <BoLocDoan<Loc> ariaLabel={t('Kết quả xem trước')} value={loc} onChange={setLoc}
              muc={[{ key: 'tat-ca', nhan: t('Tất cả'), so: kq.dong.length }, { key: 'moi', nhan: t('Mới'), so: kq.soMoi },
                { key: 'capNhat', nhan: t('Cập nhật'), so: kq.soCapNhat }, { key: 'loi', nhan: t('Lỗi'), so: kq.soLoi }]} />
            {!dong.length ? <p className="m-0 text-xs text-slate-500">{t('Không có dòng nào.')}</p> : (
              <div className="table-scroll">
                <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 640 }}>
                  <colgroup><col style={{ width: 48 }} /><col style={{ width: 150 }} /><col style={{ width: 118 }} /><col style={{ width: 100 }} /><col style={{ width: 92 }} /><col /></colgroup>
                  <thead><tr>
                    <th className="th">{t('Dòng')}</th><th className="th">{t('Tên')}</th><th className="th">{t('SĐT')}</th><th className="th">{t('Nơi dạy')}</th>
                    <th className="th">{t('Kỹ năng')}</th><th className="th">{t('Kết quả')}</th>
                  </tr></thead>
                  <tbody>{dong.map((d) => (
                    <tr key={d.so} className="align-top">
                      <td className="td tabular-nums text-xs text-slate-500">{d.so}</td>
                      <td className="td">{o(d, 'ten', d.ten)}</td>
                      <td className="td tabular-nums">{o(d, 'sdt', nhanSdt(d.sdt))}</td>
                      <td className="td">{o(d, 'noiDay', nhanNoi(d))}</td>
                      <td className="td">{o(d, 'kyNang', d.kq === 'loi' ? d.kyNang : nhanKyNang(d.kyNang.split(',')))}</td>
                      <td className="td">{ketQua(d)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </KhungPanel>
  );
}

