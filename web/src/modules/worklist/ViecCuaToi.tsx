import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, NhanTrangThai, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { baViecDau, duongThe, gomNhomViec, trongKhoiHomNay, tuanLich, type DemYeuCau, type TheYeuCauDto } from '@shared/domain/index.ts';
import { DongViec, type WorkItem } from './WorkList.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * VIỆC CỦA TÔI · HÔM NAY — tầng 1 của Tổng quan giáo viên (PR-VAI-a Q1, mockup 23 màn A). Chỉ việc QUÁ HẠN + việc hạn đến hết Chủ nhật tuần
 * này (`trongKhoiHomNay`, cùng luật chip "Đến hết tuần" ở Công việc); 4 nhóm cố định, nhóm trống ẩn; bốn cột thẳng qua mọi nhóm (nhãn · việc
 * · hạn · nút). Phần còn lại ở Công việc. Điện thoại (Q2): 3 việc đầu của CÙNG danh sách, không chia nhóm, cả dòng là nút.
 */
/** `/my-work` chỉ trả `summary` + `dong` (PR-VN3: bỏ `items`, `groups`); GV chưa có phạm vi: `scopeEmpty` và không có `dong`. */
export type Work = { summary: { total: number; overdue: number }; dong?: WorkItem[]; scopeEmpty: boolean };

const DAY = 86_400_000;
/** Một mốc hạn ngắn cho dòng điện thoại: "quá hạn 3 ngày" · "hạn hôm nay" · "hạn 03/10". */
function hanNgan(it: WorkItem, homNay: string, ngan: (d: string) => string): { chu: string; mau: string } {
  if (!it.due) return { chu: t('quá hạn'), mau: 'text-late' };
  const n = Math.round((Date.parse(homNay) - Date.parse(it.due.slice(0, 10))) / DAY);
  if (it.urgency === 'overdue') return { chu: n > 0 ? t('quá hạn {n} ngày', { n }) : t('quá hạn'), mau: 'text-late' };
  if (it.due.slice(0, 10) === homNay) return { chu: t('Hạn hôm nay'), mau: 'text-soon' };
  return { chu: t('hạn {ngan}', { ngan: ngan(it.due) }), mau: 'text-slate-400' };
}

/** OV-11f (CA1-10): GV chưa có lớp — một câu đúng lý do, máy tính và điện thoại cùng chữ. */
const CHUA_CO_LOP = t('Chưa có lớp được phân công');

export function ViecCuaToi() {
  const navigate = useNavigate();
  const dienThoai = useDienThoai();
  const { homNay, ngan } = useNgayNghiepVu();
  const { data, loading, error, reload } = useApi<Work>('/my-work');
  /* PR-GOP (§5): dòng đã gộp theo lớp × loại việc — mọi số ở khối này đếm dòng, cùng badge. */
  const tatCa = data?.dong ?? [];
  const khoi = useMemo(() => tatCa.filter((it) => trongKhoiHomNay(it, homNay)), [tatCa, homNay]);
  const nhom = useMemo(() => gomNhomViec(khoi), [khoi]);
  const quaHan = khoi.filter((it) => it.urgency === 'overdue').length;
  const homNayN = khoi.filter((it) => it.urgency === 'today').length;
  const tuan = tuanLich(homNay, homNay);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;

  const tong = (
    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-slate-400 tabular-nums">
      <span><b className="text-lg font-bold text-late">{quaHan}</b>{' '}{t('quá hạn')}</span>
      <span><b className="text-lg font-bold text-soon">{homNayN}</b> {dienThoai ? t('hôm nay') : t('hạn hôm nay')}</span>
      {!dienThoai && <span><b className="text-lg font-bold text-slate-100">{khoi.length}</b>{' '}{t('việc đến hết {tuan}', { tuan })}</span>}
    </span>
  );

  if (dienThoai) {
    const { ds, soXemHet } = baViecDau(tatCa, homNay);
    return (
      <section className="card" aria-labelledby="viec-hom-nay">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2.5" style={{ borderColor: 'var(--line)' }}>
          <h2 id="viec-hom-nay" className="m-0 text-sm font-semibold text-slate-200">{t('Hôm nay')}</h2>
          {data && tong}
        </header>
        {loading || !data ? <div className="p-3"><Skeleton rows={3} /></div> : data.scopeEmpty ? (
          <p className="m-0 px-3.5 py-3 text-sm text-slate-400">{CHUA_CO_LOP}</p>
        ) : !ds.length ? (
          <p className="m-0 px-3.5 py-3 text-sm text-slate-400">{t('Không có việc quá hạn hay đến hạn tuần này.')}</p>
        ) : ds.map((it) => {
          const h = hanNgan(it, homNay, ngan);
          return (
            <button key={it.key} type="button" onClick={() => navigate(it.href)}
              className="flex min-h-[44px] w-full flex-col gap-1 border-0 border-t bg-transparent px-3.5 py-2.5 text-left first-of-type:border-t-0 hover:bg-white/5"
              style={{ borderColor: 'var(--line)' }}>
              <span className="flex items-center justify-between gap-2">
                <NhanTrangThai t={it.urgency === 'overdue' ? 'qua-han' : 'can-lam'} />
                <span className={`text-xs font-semibold tabular-nums ${h.mau}`}>{h.chu}</span>
              </span>
              {/* Dòng phụ ẩn (Q2) — nên tên việc tự mang lớp khi tiêu đề chưa có ("Nhập điểm Reading · MB FT 101"). */}
              <b className="text-sm font-semibold leading-snug text-slate-100">
                {dich(it.tieuDe)}{it.classCode && !it.tieuDe.includes(it.classCode) ? ` · ${it.classCode}` : ''}
              </b>
            </button>
          );
        })}
        {data && (
          <div className="border-t px-3.5 py-2.5" style={{ borderColor: 'var(--line)' }}>
            <Link to="/cong-viec?loc=den-het-tuan&khung=tat-ca" className="btn btn-sm flex min-h-[44px] w-full justify-center no-underline">{t('Xem hết ({soXemHet})', { soXemHet })}</Link>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="card" aria-labelledby="viec-cua-toi">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h2 id="viec-cua-toi" className="sr-only">{t('Việc hôm nay')}</h2>
        {data && tong}
      </header>
      {loading || !data ? <div className="p-4"><Skeleton rows={5} /></div> : data.scopeEmpty ? (
        <div className="p-4"><Empty title={CHUA_CO_LOP} /></div>
      ) : !khoi.length ? (
        <p className="m-0 px-4 py-3 text-sm text-slate-400">{t('Không có việc quá hạn hay đến hạn trong tuần {tuan}.', { tuan })}</p>
      ) : nhom.map((g) => (
        <div key={g.key}>
          <div className="flex items-baseline gap-2.5 border-t px-4 py-1.5 text-[13px] first:border-t-0" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
            <b className="font-semibold text-slate-200">{dich(g.label)}</b>
            <span className="tabular-nums text-slate-500">{g.n}</span>
            {g.quaHan > 0 && <span className="text-xs font-semibold text-late">{t('{quaHan} quá hạn', { quaHan: g.quaHan })}</span>}
            {g.homNay > 0 && <span className="text-xs font-semibold text-soon">{t('{homNay} hôm nay', { homNay: g.homNay })}</span>}
          </div>
          <ul className="m-0 list-none divide-y p-0 pl-4" style={{ borderColor: 'var(--line)' }}>
            {g.items.map((it) => <li key={it.key}><DongViec it={it} onOpen={(x) => navigate(x.href)} /></li>)}
          </ul>
        </div>
      ))}
      {data && !data.scopeEmpty && (
        <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t px-4 py-2.5 text-xs" style={{ borderColor: 'var(--line)' }}>
          <span className="text-slate-500">{tatCa.length - khoi.length > 0 ? t('{x} việc khác chưa đến hạn tuần này', { x: tatCa.length - khoi.length }) : ''}</span>
          <Link to="/cong-viec?khung=tat-ca" className="link">{t('Tất cả việc ({length}) trong Công việc →', { length: tatCa.length })}</Link>
        </footer>
      )}
    </section>
  );
}

/**
 * YÊU CẦU CỦA TÔI — cạnh khối việc (mockup 23 màn A): thứ giáo viên đang chờ người khác. Bị từ chối đứng đầu và là việc CẦN LÀM ("Sửa và gửi
 * lại"); tối đa 3 thẻ gọn. Ẩn khi không có gì chờ và không có gì bị từ chối. Điện thoại: một dòng.
 */
export function YeuCauCuaToi() {
  const dienThoai = useDienThoai();
  const dem = useApi<DemYeuCau>('/yeu-cau/dem').data;
  const coGi = !!dem && (dem.cuaToiCho > 0 || dem.cuaToiTuChoi > 0);
  const ds = useApi<{ the: TheYeuCauDto[] }>(coGi && !dienThoai ? '/yeu-cau?hop=cua-toi' : null, [coGi, dienThoai]).data;
  if (!dem || !coGi) return null;
  const so = (
    <span className="flex flex-wrap items-baseline gap-x-3 text-xs text-slate-400 tabular-nums">
      <span><b className="text-base font-bold text-slate-100">{dem.cuaToiCho}</b>{' '}{t('chờ duyệt')}</span>
      {dem.cuaToiTuChoi > 0 && <span><b className="text-base font-bold text-late">{dem.cuaToiTuChoi}</b>{' '}{t('bị từ chối')}</span>}
    </span>
  );
  if (dienThoai) {
    return (
      <Link to="/cong-viec/yeu-cau" className="card flex min-h-[44px] items-center justify-between gap-2 px-3.5 no-underline text-sm text-slate-200">
        <span>{t('Yêu cầu của tôi · {cuaToiCho} chờ duyệt', { cuaToiCho: dem.cuaToiCho })}{dem.cuaToiTuChoi > 0 ? <> · <b className="text-late">{dem.cuaToiTuChoi}</b>{' '}{t('bị từ chối')}</> : null}</span>
        <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0 text-slate-500"><path d="m6 3.5 4.5 4.5L6 12.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </Link>
    );
  }
  const the = (ds?.the ?? []).filter((x) => x.trangThai === 'cho' || x.trangThai === 'tu_choi')
    .sort((a, b) => Number(b.trangThai === 'tu_choi') - Number(a.trangThai === 'tu_choi')).slice(0, 3);
  return (
    <section className="card" aria-labelledby="yeu-cau-cua-toi">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h2 id="yeu-cau-cua-toi" className="m-0 text-sm font-semibold text-slate-200">{t('Yêu cầu của tôi')}</h2>
        {so}
      </header>
      {!ds ? <div className="p-4"><Skeleton rows={3} /></div> : the.map((x) => (
        <div key={x.id} className="grid grid-cols-[78px_minmax(0,1fr)] items-start gap-x-3 gap-y-1 border-t px-4 py-2.5 first-of-type:border-t-0" style={{ borderColor: 'var(--line)' }}>
          <NhanTrangThai t={x.trangThai === 'tu_choi' ? 'can-lam' : 'cho-duyet'} chu={x.trangThai === 'tu_choi' ? t('Bị từ chối') : undefined} />   {/* còn việc phải làm (Sửa và gửi lại) → kiểu "Cần làm", chữ nói đúng trạng thái (G2) */}
          <span className="min-w-0">
            <b className="block text-[13px] font-semibold text-slate-100">{dich([x.nhanLoai, x.hocVien, x.lop].filter(Boolean).join(' · '))}</b>
            <span className="block text-xs text-slate-500">
              {x.trangThai === 'tu_choi' ? t('Bị từ chối{x}', { x: x.lyDoTuChoi ? `: "${x.lyDoTuChoi}"` : '' }) : dich(x.tieuDe)}
            </span>
          </span>
          {x.trangThai === 'tu_choi' && (
            <Link to={duongThe(x.id, 'nguoi-xin')} className="btn btn-sm col-start-2 justify-self-start no-underline">{t('Sửa và gửi lại')}</Link>
          )}
        </div>
      ))}
      <footer className="flex justify-end border-t px-4 py-2.5 text-xs" style={{ borderColor: 'var(--line)' }}>
        <Link to="/cong-viec/yeu-cau" className="link">{t('Mở Yêu cầu của tôi →')}</Link>
      </footer>
    </section>
  );
}
