import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { CongTacKhung, khungDaNho } from '../../ui/CongTacKhung.tsx';
import { GOI_Y_DUOI_KY_VONG, khungLopToiDay } from '@shared/domain/index.ts';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * LỚP TÔI DẠY — tầng 3 của Tổng quan giáo viên (PR-VAI-a Q12, mockup 23 màn A/C; thay "Học viên cần hỗ trợ"). Tách hẳn hai khung: FT có SOS,
 * không cột tuần khoá; lớp thường có "tuần n/y", không SOS. Dạy một khung → ẩn công tắc; dạy cả hai → mặc định Fast Track. Mỗi số bấm ra
 * danh sách em qua `/tong-quan/lop-toi-day/o` (cùng hàm tính). "Bài chờ chấm / quá hạn" đếm BÀI ở máy chủ (cùng hàm hồ sơ GV), bấm ra đúng các bài đó.
 * Điện thoại: mỗi lớp một thẻ ba số.
 */
type Hang = {
  classId: number; code: string; route: string | null; ct: string | null; toiDay: string; tuanHoc: string | null; hocVien: number;
  duoiKyVong: number; sos: number | null; caseMo: number; baiCho: number; baiQuaHan: number; testKeTiep: string | null; testTuanNay: boolean;
};
type Data = { ct: 'ft' | 'thuong'; coFt: boolean; coThuong: boolean; soFt: number; soThuong: number; rows: Hang[] };

export function LopToiDay() {
  const dienThoai = useDienThoai();
  const [khung, setKhung] = useState<'ft' | 'thuong' | null>(() => {
    const k = khungDaNho('tong-quan');
    return k === 'ft' || k === 'thuong' ? k : null;
  });
  const ct = khung ?? 'ft';
  const { data, loading, error, reload } = useApi<Data>(`/tong-quan/lop-toi-day?ct=${ct}`, [ct]);
  /* Q31-1 + D7: chưa chọn, hoặc khung đã nhớ không có lớp nào của mình → khung mặc định theo lớp mình dạy (chỉ lớp thường → Lớp thường). */
  /* UX-2 (5): công tắc hiện theo phạm vi — khung người xem VỪA BẤM giữ nguyên dù 0 lớp (ghi "· 0"), không bị ép về khung có lớp. */
  const daBam = useRef(false);
  useEffect(() => {
    if (data && !daBam.current && khungLopToiDay(khung, data.coFt, data.coThuong) !== ct) setKhung(khungLopToiDay(khung, data.coFt, data.coThuong));
  }, [data, khung, ct]);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (data && !data.coFt && !data.coThuong) return null;
  const so = (h: Hang, cot: 'duoiKyVong' | 'sos' | 'caseMo' | 'bai-cho' | 'bai-qua-han', n: number, ten: string, className = 'font-semibold') => (
    <OSo giaTri={n} nguon={`/tong-quan/lop-toi-day/o?ct=${ct}&classId=${h.classId}&cot=${cot}`} tieuDe={`${h.code} · ${ten}`} className={`${className} max-sm:relative max-sm:before:absolute max-sm:before:-inset-x-2 max-sm:before:-inset-y-3 max-sm:before:content-['']`} />
  );
  /**
   * D10: số BÀI (máy chủ) — có bài quá hạn thì hiện phần quá hạn (đỏ), không thì số bài chờ chấm; bấm ra đúng các bài đó. Bảng: "15 quá hạn"
   * một dòng; thẻ điện thoại (`gon`): số trên, nhãn "bài quá hạn / bài chờ chấm" dưới — luôn có nhãn, kể cả 0.
   */
  const baiCham = (h: Hang, gon = false) => {
    const qua = h.baiQuaHan > 0;
    const nhan = gon ? (qua ? t('bài quá hạn') : t('bài chờ chấm')) : (qua ? t('quá hạn') : t('chờ chấm'));
    if (!h.baiCho && !gon) return <span className="tabular-nums text-slate-500">0</span>;
    return (
      <>
        {qua ? so(h, 'bai-qua-han', h.baiQuaHan, t('bài quá hạn chưa nhập điểm'), `font-semibold text-late ${gon ? 'font-bold' : ''}`)
          : so(h, 'bai-cho', h.baiCho, t('bài chờ chấm'), `font-semibold ${gon ? 'font-bold' : ''}`)}
        <span className="text-xs text-slate-500">{gon ? nhan : ` ${nhan}`}</span>
      </>
    );
  };
  const laThuong = ct === 'thuong';
  const nhanDuoi = laThuong ? t('Chưa đạt') : t('Dưới kỳ vọng');

  return (
    <section className="card" aria-labelledby="lop-toi-day" data-hd="tq-lop-toi-day">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="lop-toi-day" className="m-0 text-sm font-semibold text-slate-200">{t('Lớp tôi dạy')}</h2>
          {data && <CongTacKhung trang="tong-quan" value={ct} dem={{ ft: data.soFt, thuong: data.soThuong }} donVi={t('lớp')} onChange={(k) => { daBam.current = true; setKhung(k === 'thuong' ? 'thuong' : 'ft'); }} />}
        </div>
      </header>
      {loading || !data ? <div className="p-4"><Skeleton rows={3} /></div> : !data.rows.length ? (
        <p className="m-0 px-4 py-3 text-sm text-slate-400">{t('Bạn không dạy lớp')}{' '}{laThuong ? t('thường') : 'Fast Track'}{' '}{t('nào đang mở.')}</p>
      ) : dienThoai ? (
        <div>
          {data.rows.map((h) => (
            <article key={h.classId} className="flex flex-col gap-2 border-t px-3.5 py-2.5 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
              <span className="flex items-baseline justify-between gap-2">
                <Link to={`/hoc-vien/lop/${h.classId}`} className="font-semibold text-slate-100 no-underline">{h.code}</Link>
                <span className="text-xs text-slate-500">{dich([h.toiDay, h.tuanHoc].filter(Boolean).join(' · '))}</span>
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-lg">
                <div className="flex flex-col items-start">{so(h, 'duoiKyVong', h.duoiKyVong, nhanDuoi.toLowerCase())}<span className="text-xs text-slate-500">{nhanDuoi.toLowerCase()}</span></div>
                {laThuong
                  ? <div className="flex flex-col items-start">{so(h, 'caseMo', h.caseMo, t('Case đang mở'))}<span className="text-xs text-slate-500">{t('Case đang mở')}</span></div>
                  : <div className="flex flex-col items-start">{so(h, 'sos', h.sos ?? 0, 'SOS')}<span className="text-xs text-slate-500">SOS</span></div>}
                <div className="flex flex-col items-start">{baiCham(h, true)}</div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="table-scroll">   {/* CV-LOI (CV-10): bỏ `bang-dinh` — bảng trong thẻ 560 px cuộn ngang trong thẻ, không tràn ra ngoài */}
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-[12px] font-semibold text-slate-400">
                <th className="px-4 py-2 font-semibold">{t('Lớp')}</th><th className="px-3 py-2 font-semibold">{t('Tôi dạy')}</th>
                {laThuong && <th className="px-3 py-2 font-semibold">{t('Tuần học')}</th>}
                <th className="px-3 py-2 text-right font-semibold">{t('Học viên')}</th><th className="px-3 py-2 text-right font-semibold">{nhanDuoi} <NutLuat phai label={nhanDuoi}>{GOI_Y_DUOI_KY_VONG[ct]}</NutLuat></th>
                {!laThuong && <th className="px-3 py-2 text-right font-semibold">SOS</th>}
                <th className="px-3 py-2 text-right font-semibold">{t('Case đang mở')}</th><th className="px-3 py-2 text-right font-semibold">{t('Bài chờ chấm')}</th>
                <th className="px-4 py-2 font-semibold">{t('Test sắp tới')}</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {data.rows.map((h) => (
                <tr key={h.classId} className="border-t" style={{ borderColor: 'var(--line)' }}>
                  <td className="px-4 py-2"><Link to={`/hoc-vien/lop/${h.classId}`} className="font-semibold text-slate-100 no-underline hover:underline">{h.code}</Link>
                    {(h.route || h.ct) && <span className="ml-1.5 text-xs text-slate-500">{laThuong ? h.ct : h.route}</span>}</td>
                  <td className="px-3 py-2 text-slate-300">{dich(h.toiDay)}</td>
                  {laThuong && <td className="px-3 py-2 text-slate-300">{h.tuanHoc ?? '—'}</td>}
                  <td className="px-3 py-2 text-right text-slate-300">{h.hocVien}</td>
                  <td className="px-3 py-2 text-right">{so(h, 'duoiKyVong', h.duoiKyVong, nhanDuoi.toLowerCase())}</td>
                  {!laThuong && <td className="px-3 py-2 text-right">{so(h, 'sos', h.sos ?? 0, t('học viên có SOS'))}</td>}
                  <td className="px-3 py-2 text-right">{so(h, 'caseMo', h.caseMo, t('Case đang mở'))}</td>
                  <td className="px-3 py-2 text-right">{baiCham(h)}</td>
                  <td className="px-4 py-2 text-slate-300">{h.testKeTiep ?? <span className="text-slate-500">{t('chưa có lịch')}</span>}
                    {h.testTuanNay && <span className="ml-1.5 text-xs text-slate-500">{t('tuần này')}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
