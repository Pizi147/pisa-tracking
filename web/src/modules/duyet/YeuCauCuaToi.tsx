import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { TheYeuCau } from './TheYeuCau.tsx';
import { useTheNhanManh } from './HopChoDuyet.tsx';
import { DaiNhom } from '../congViec/DanhSachViec.tsx';
import { DauQuaHan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { mucHan, nhanTrangThaiYc, ngay as ngayHien, type TheYeuCauDto } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * CÔNG VIỆC › YÊU CẦU CỦA TÔI (PR-DUYET, M8) — yêu cầu mình đã gửi Quản lý: đang chờ, bị từ chối (+ lý do), đã xử lý 60 ngày (Đã duyệt · Đã trả lời · Tự đóng).
 * Không có nút quyết định. Chuông "QL đã duyệt/từ chối/trả lời" mở đúng dòng ở đây (`?the=`).
 *
 * v26 (mockup `thiet-ke/v26/yeu-cau-cua-toi.html`, phương án A): MỖI YÊU CẦU MỘT DÒNG khuôn A — Lớp · Tên HV · Thông tin · ngày, cùng lưới `.cvA` với các tab Công việc.
 * Đề mục nhóm = trạng thái (Bị từ chối · Đang chờ · Đã xử lý) nên dòng không có chip trạng thái. Phản hồi của người duyệt (lý do từ chối / câu trả lời) = dòng phụ luôn hiện,
 * xuống dòng đủ chữ. Bấm dòng → nội dung đã gửi + Sửa… · Rút · Mở › mở TẠI DÒNG (`TheYeuCau dong`, cùng mẫu Chờ bạn duyệt).
 */
const NHOM = [
  { k: 'tc', nhan: () => t('Bị từ chối'), co: (y: TheYeuCauDto) => y.trangThai === 'tu_choi' },
  { k: 'cho', nhan: () => t('Đang chờ'), co: (y: TheYeuCauDto) => y.trangThai === 'cho' },
  { k: 'xl', nhan: () => t('Đã xử lý'), co: (y: TheYeuCauDto) => y.trangThai !== 'cho' && y.trangThai !== 'tu_choi' },
] as const;

/** Phản hồi hiện ngay dưới dòng: lý do từ chối, hoặc câu trả lời / ghi chú của người duyệt. */
function phanHoi(y: TheYeuCauDto): { ai: string; chu: string } | null {
  const ai = y.nguoiDuyet ?? t('Head');
  if (y.trangThai === 'tu_choi' && y.lyDoTuChoi) return { ai, chu: y.lyDoTuChoi };
  if ((y.trangThai === 'da_tra_loi' || y.trangThai === 'duyet') && y.traLoi) return { ai, chu: y.traLoi };
  return null;
}

/** Ô thông tin: loại · việc · ngữ cảnh — bỏ phần đã lặp (tiền tố loại trong tên việc). */
function thongTin(y: TheYeuCauDto): string {
  const loai = dich(y.nhanLoai);
  const td = dich(y.tieuDe);
  const viec = td.startsWith(`${loai} · `) ? td.slice(loai.length + 3) : td.startsWith(`${loai}: `) ? td.slice(loai.length + 2) : td === loai ? '' : td;
  return [...new Set([loai, viec, y.phu ? dich(y.phu) : ''].filter(Boolean))].join(' · ');
}

function DongYc({ y, mo, nhan, onBam, onXong }: { y: TheYeuCauDto; mo: boolean; nhan: boolean; onBam: () => void; onXong: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const cho = y.trangThai === 'cho';
  const tuChoi = y.trangThai === 'tu_choi';
  const ph = phanHoi(y);
  const muc = cho && y.hanDuyet ? mucHan(y.hanDuyet, homNay) : 'xa';
  const ngayXl = ngayHien(y.xuLyLuc ?? y.taoLuc);
  /* Cột cuối: đang chờ = hạn Head duyệt; còn lại = ngày xử lý (nhóm Đã xử lý ghi kết quả bằng chữ — không chỉ màu). */
  const cuoi = cho ? (y.hanDuyet ? ngayHien(y.hanDuyet) : '') : tuChoi ? ngayXl : `${dich(nhanTrangThaiYc(y.trangThai, y.tuDuyet).chu)} ${ngayXl}`;
  const tin = thongTin(y);
  return (
    <li className="cvA-sub" id={`the-${y.id}`} style={nhan ? { boxShadow: 'inset 0 0 0 2px var(--accent-strong)' } : undefined}>
      <div data-hd="yc-dong" className={`cvA-v ${mo ? 'dang-chon' : ''}`} onClick={onBam}>
        <span className="cvA-lop">{y.lop}</span>
        <span className="cvA-ai"><button type="button" className="cvA-ten" aria-expanded={mo} aria-controls={mo ? `the-ct-${y.id}` : undefined} aria-label={[y.lop, y.hocVien, tin].filter(Boolean).join(' · ')} onClick={(e) => { e.stopPropagation(); onBam(); }}>{y.hocVien}</button></span>
        <span className="cvA-ct" title={tin}>{tin}</span>
        <span className={`cvA-hn ${muc === 'xa' ? '' : muc}`}>{muc === 'qua' && <DauQuaHan />}{cuoi}</span>
      </div>
      {ph && (
        <div className="cvA-sub" style={{ padding: '0 24px 12px 20px' }}>
          <p className={`m-0 text-[13px] leading-snug text-[color:var(--text)] sm:[grid-column:3/5] ${tuChoi ? 'border-l-2 pl-2.5' : ''}`}
            style={tuChoi ? { borderColor: 'rgb(var(--late-line-rgb))' } : undefined}>
            <b className="mr-1 font-semibold text-dim">{ph.ai}:</b>“{ph.chu}”
            {tuChoi && y.mo && <Link to={y.mo} className="link ml-2 whitespace-nowrap font-semibold">{t('Mở ›')}</Link>}
          </p>
        </div>
      )}
      {mo && <TheYeuCau yc={y} dong laNguoiXin boKetQua={!!ph && !y.lyDoDong} onXong={onXong} />}
    </li>
  );
}

function DanhSach({ ds, nhanId, reload }: { ds: TheYeuCauDto[]; nhanId: number | null; reload: () => void }) {
  const [mo, setMo] = useState<number | null>(null);
  const [gap, setGap] = useState<Record<string, boolean>>({});
  const { homNay } = useNgayNghiepVu();
  /* Chuông / `?the=`: mở sẵn đúng dòng. */
  useEffect(() => { if (nhanId != null) setMo(nhanId); }, [nhanId]);
  return (
    <div className="cvA-cq"><div className="cvA yc-A">
      {NHOM.map((g) => {
        const the = ds.filter(g.co);
        if (!the.length) return null;
        const qua = g.k === 'cho' ? the.filter((y) => !!y.hanDuyet && mucHan(y.hanDuyet, homNay) === 'qua').length : 0;
        const dong = !!gap[g.k];
        return (
          <section key={g.k} data-muc={`yc-${g.k}`} className="card cvA-sub overflow-clip p-0" aria-label={g.nhan()}>
            <DaiNhom k="pa-chay" nhan={g.nhan()} chip={`${the.length}${g.k === 'xl' ? ` · ${t('60 ngày')}` : ''}`} mo={!dong} onMo={() => setGap((s) => ({ ...s, [g.k]: !s[g.k] }))} trungTinh={g.k === 'xl'} chevPhai
              phuPhai={qua > 0 ? <span className="font-semibold text-late">{t('{n} quá hạn', { n: qua })}</span> : undefined} />
            {!dong && <ul className="cvA-sub">{the.map((y) => <DongYc key={y.id} y={y} mo={mo === y.id} nhan={nhanId === y.id} onBam={() => setMo((c) => (c === y.id ? null : y.id))} onXong={() => { setMo(null); reload(); }} />)}</ul>}
          </section>
        );
      })}
    </div></div>
  );
}

export function YeuCauCuaToi({ gon = false }: {
  /** OV-15d: phần cuối Công việc của GV — chỉ thẻ Bị từ chối (việc: Sửa và gửi lại) + một dòng "n yêu cầu chờ duyệt ›"; đủ ở `/cong-viec/yeu-cau`. */
  gon?: boolean;
} = {}) {
  const { data, loading, error, reload } = useApi<{ the: TheYeuCauDto[] }>('/yeu-cau?hop=cua-toi');
  const nhan = useTheNhanManh(data?.the);
  if (gon) {
    if (!data) return null;
    /* Bị từ chối CÒN VIỆC: chưa có thẻ cùng loại, cùng em / lớp gửi sau nó (đã sửa gửi lại → hết) — gần luật `con_viec` của chuông (thông báo.ts). */
    const tuChoi = data.the.filter((x) => x.trangThai === 'tu_choi'
      && !data.the.some((y) => y.id > x.id && y.loai === x.loai && y.hocVienId === x.hocVienId && y.lopId === x.lopId));
    const dangCho = data.the.filter((x) => x.trangThai === 'cho').length;
    if (!tuChoi.length && !dangCho) return null;
    return (
      <section className="space-y-2" aria-label={t('Yêu cầu của tôi')}>
        {tuChoi.length > 0 && <h2 className="m-0 text-sm font-semibold text-slate-200">{t('Bị từ chối')} <span className="tabular-nums text-slate-400">{tuChoi.length}</span></h2>}
        {tuChoi.map((y) => <TheYeuCau key={y.id} yc={y} laNguoiXin nhanManh={nhan === y.id} onXong={reload} />)}
        {dangCho > 0 && <Link to="/cong-viec/yeu-cau" className="link inline-block text-[13px] max-sm:py-3">{t('{n} yêu cầu chờ duyệt ›', { n: dangCho })}</Link>}
      </section>
    );
  }
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (loading) return <Card><Skeleton rows={5} /></Card>;
  const ds = data?.the ?? [];
  if (!ds.length) {
    return <Card><Empty title={t('Bạn chưa gửi yêu cầu nào cho Head')}
      hint={t('Đề xuất PA cần duyệt, Xin hỗ trợ Head ở Kết quả tuần, hoặc Đề xuất sửa ở ⋯ hồ sơ học viên — mọi yêu cầu đều hiện ở đây.')} /></Card>;
  }
  return <DanhSach ds={ds} nhanId={nhan} reload={reload} />;
}
