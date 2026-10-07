import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ENTRY_SKILLS, ENTRY_SKILL_SHORT, NHOM_VIEC_LABEL, duongHieuQuaPaGv, duongHoSoHocVien, duongViecCuaGv, laVaiQuanLy, tuanLich, viecTiepCuaEm,
  type ChipBanGiao, type NhomViec, type TrangThai, type ViecTiepCase,
} from '@shared/domain/index.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Card, Empty, ErrorState, NhanTrangThai, Skeleton, Th } from '../../ui/ui.tsx';
import { CHIP_TRON } from '../../ui/Nhan.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { ViecTiep } from '../../ui/ViecTiep.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { TenCase } from '../cases/SkillBoard.tsx';

/**
 * HỒ SƠ GIÁO VIÊN (PR-GV, kế hoạch 2026-09-30-pr-gv-ho-so-giao-vien, mockup 21). Một trang, năm khối: Việc đang có · Lớp đang dạy ·
 * Kết quả gần nhất · Case đang phụ trách · Yêu cầu đã gửi. Không điểm đánh giá người, không xếp hạng, không so với giáo viên khác (Q30-5).
 * Máy chủ trả ba lời gọi (hồ sơ · việc · kết quả) để mỗi lời gọi nằm dưới trần câu SQL; khối nào xong trước vẽ trước.
 * Mọi số bấm được ra đúng danh sách tạo nên nó (`/giao-vien/:id/o`, cùng hàm với số) — số ở ô = số dòng.
 */

type NhomSo = { nhom: NhomViec; n: number; quaHan: number };
type LopHs = {
  id: number; ma: string; khung: 'ft' | 'thuong'; ct: string | null; vai: string; hocVien: number; chuaNhap: number; quaHan: number;
  banGiao: ChipBanGiao | null;
};
type CaseHs = {
  id: number; studentId: number; topic: string | null; tieuDe: string; tenSos: { mt: number | null; giua: string; sos: number | null } | null;
  nguyenNhan: string | null; moTu: string; trangThai: { t: TrangThai; chu: string }; viecTiep: ViecTiepCase | null; quaHan: boolean;
  hocVien: string; maLop: string | null;
};
type HoSo = {
  gv: { id: number; ten: string; vai: string[]; chiNhanh: string[]; kyNang: string[]; laChinhMinh: boolean };
  phamVi: { chiNhanh: string[] | null; cn: number | null };
  lop: LopHs[]; tongHocVien: number; caseMo: CaseHs[];
  yeuCau: { cho: number; choQuaHan: number; tuChoi: number };
  homNay: string;
};
type OKetQua = { dong: string; nhan: string; dat: number; tong: number; cuaMinh: boolean };
type KetQuaLop = { classId: number; ma: string; khung: 'ft' | 'thuong'; ct: string | null; moc: { key: string; nhan: string } | null; o: OKetQua[] };

const nguon = (id: number, q: string) => `/giao-vien/${id}/o?${q}`;
const soDam = 'font-semibold';
/** Vùng bấm >= 44 px cho số nhỏ (chạm tay) mà không đổi nhịp dòng: đệm dọc + lề âm bù. */
const vung = 'inline-block py-2 -my-2';

/** ⓘ vẽ bằng SVG (ký tự ⓘ cỡ nhỏ của Inter chỉ còn như một dấu chấm); lời giải thích ở `title`, như mọi chú thích khác của web. */
function Goi({ chu }: { chu: string }) {
  return (
    <span className="ml-1.5 inline-flex cursor-help align-[-2px] text-slate-500" title={chu} role="img" aria-label={chu}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden>
        <circle cx="7" cy="7" r="5.7" /><path d="M7 6.2v3.4" /><circle cx="7" cy="4.2" r=".5" fill="currentColor" />
      </svg>
    </span>
  );
}

/** Dấu "môn của giáo viên": viền + nền accent — cùng token với ô đang chọn, không thêm màu mới. */
const MON_CUA_MINH = 'border border-[color:var(--accent)] bg-[color:var(--accent-soft)]';
const chipVai = 'rounded border border-[color:var(--line-strong)] px-1.5 text-xs font-semibold leading-5 tabular-nums text-slate-200 whitespace-nowrap';

export function HoSoGiaoVienPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi<HoSo>(`/giao-vien/${id}`, [id]);
  const { session } = useSession();
  const { homNay, ngan } = useNgayNghiepVu();
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={8} />;
  const { gv } = data;
  const nguoiXem = { userId: session?.user?.id ?? 0, laQuanLy: laVaiQuanLy(session?.roles) };
  const coNutViec = gv.laChinhMinh || !!session?.nav?.workOps;
  const tenGoi = gv.ten.split(' ').pop() ?? gv.ten;
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h1 className="m-0 text-xl font-bold text-slate-100">{gv.ten}</h1>
            <p className="m-0 text-sm text-slate-400">{[gv.vai.join(' · '), gv.chiNhanh.join(', ')].filter(Boolean).join(' · ')}</p>
            <p className="m-0 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400">Kỹ năng phụ trách được</span>
              {gv.kyNang.length ? gv.kyNang.map((k) => <span key={k} className={chipVai}>{k}</span>) : <span className="text-slate-500">chưa khai</span>}
            </p>
            {!gv.laChinhMinh && data.phamVi.chiNhanh && (
              <p className="m-0 text-xs text-slate-400">Quản lý đang xem · chỉ tính lớp, Case, yêu cầu ở {data.phamVi.chiNhanh.join(', ')}</p>
            )}
          </div>
          {coNutViec && (
            <Link to={duongViecCuaGv(gv.id, nguoiXem, null)} className="btn no-underline max-sm:min-h-11 max-sm:items-center">
              {gv.laChinhMinh ? 'Mở Công việc ›' : `Việc của ${tenGoi} ›`}
            </Link>
          )}
        </div>
      </Card>

      <KhoiViec gvId={gv.id} nguoiXem={nguoiXem} homNay={homNay} ngan={ngan} />
      <KhoiLopVaKetQua data={data} />
      <KhoiCase data={data} homNay={homNay}
        linkPa={!gv.laChinhMinh && session?.nav?.analysis && data.phamVi.cn
          ? { den: duongHieuQuaPaGv(data.phamVi.cn, gv.id, data.lop), chu: `Hiệu quả PA của ${tenGoi} ›` } : null} />
      <KhoiYeuCau data={data} coDuyet={!!session?.nav?.workApprove} />
    </div>
  );
}

// ------------------------------------------------------------------ 1 · Việc đang có

function KhoiViec({ gvId, nguoiXem, homNay, ngan }: {
  gvId: number; nguoiXem: { userId: number; laQuanLy: boolean }; homNay: string; ngan: (iso: string) => string;
}) {
  const { data, loading, error, reload } = useApi<{ viec: NhomSo[] }>(`/giao-vien/${gvId}/viec`, [gvId]);
  return (
    <Card
      title={<>Việc đang có<Goi chu="Việc lấy từ Công việc. Bấm để mở đúng danh sách. Ý thức & Phối hợp: chỉ việc có hạn." /></>}
      action={<span className="text-xs text-slate-400">hôm nay {ngan(homNay)} · tuần <span className="tabular-nums text-slate-200">{tuanLich(homNay, homNay)}</span></span>}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : loading || !data ? <Skeleton rows={2} />
        : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {data.viec.map((x) => {
              const link = (chiQuaHan: boolean) => duongViecCuaGv(gvId, nguoiXem, x.nhom, chiQuaHan);
              const trong = x.n === 0;
              return (
                <div key={x.nhom} className={`relative flex min-w-0 flex-col gap-0.5 rounded-lg border px-3 py-2.5 ${trong ? 'opacity-70' : 'hover:border-[color:var(--accent-line)]'}`}
                  style={{ borderColor: 'var(--line)' }}>
                  <span className="text-xs text-slate-400">{NHOM_VIEC_LABEL[x.nhom]}</span>
                  {trong
                    ? <span className="text-2xl font-bold leading-tight tabular-nums text-slate-500">0</span>
                    : <Link to={link(false)} className="text-2xl font-bold leading-tight tabular-nums text-slate-100 no-underline after:absolute after:inset-0 after:rounded-lg"
                        aria-label={`${x.n} việc ${NHOM_VIEC_LABEL[x.nhom]}. Bấm để mở Công việc`}>{x.n}</Link>}
                  {x.quaHan > 0
                    ? <Link to={link(true)} className={`relative z-10 w-fit py-2 -my-2 text-xs text-bad no-underline hover:underline ${soDam}`}>{x.quaHan} quá hạn</Link>
                    : <span className="text-xs text-slate-500">{trong ? '—' : 'không quá hạn'}</span>}
                </div>
              );
            })}
          </div>
        )}
    </Card>
  );
}

// ------------------------------------------------------------------ 2 · Lớp đang dạy  +  3 · Kết quả gần nhất

function KhoiLopVaKetQua({ data }: { data: HoSo }) {
  const dienThoai = useDienThoai();
  const kq = useApi<{ ketQua: KetQuaLop[] }>(`/giao-vien/${data.gv.id}/ket-qua`, [data.gv.id]);
  const ketQuaCua = (id: number) => kq.data?.ketQua.find((k) => k.classId === id) ?? null;
  return (
    <>
      <KhoiLop data={data} dienThoai={dienThoai} ketQuaCua={ketQuaCua} />
      {/* Điện thoại: năm ô kết quả đã nằm trong thẻ từng lớp (mockup 21 màn E) nên không lặp lại khối riêng. */}
      {!dienThoai && <KhoiKetQua data={data} kq={kq} />}
    </>
  );
}

/** Q31-6: vai ở lớp là MỘT chip "GVCN · L R G+V". */
function VaiChip({ vai }: { vai: string }) {
  return vai ? <span className={chipVai}>{vai}</span> : null;
}
/** O6: chip "Bàn giao n/m em" cạnh mã lớp (12 px) — còn dở mới có; bấm mở hồ sơ lớp ở việc Bàn giao. */
function ChipBanGiaoLop({ l }: { l: LopHs }) {
  const b = l.banGiao;
  if (!b) return null;
  return (
    <Link to={`/hoc-vien/lop/${l.id}?viec=ban-giao${b.maMon ? `&mon=${b.maMon}` : ''}`} className={`${CHIP_TRON} bg-soon-bg tabular-nums text-soon no-underline hover:underline`}
      title={b.loai === 'gvcn' ? 'Phiếu bàn giao đã xác nhận / số em có quyết định chuyển lớp' : `Môn ${b.mon}: số em đã ghi bàn giao / số em cần ghi`}>
      Bàn giao{b.mon ? ` ${b.mon} ·` : ''} {b.da}/{b.n} em
    </Link>
  );
}
const chipKhung = (k: 'ft' | 'thuong') => (
  <span className={`${CHIP_TRON} ${k === 'ft' ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : '!border-[color:var(--line-strong)] text-slate-300'}`}>
    {k === 'ft' ? 'FT' : 'Lớp thường'}
  </span>
);

function KhoiLop({ data, dienThoai, ketQuaCua }: { data: HoSo; dienThoai: boolean; ketQuaCua: (id: number) => KetQuaLop | null }) {
  const id = data.gv.id;
  const so = (l: LopHs, cot: 'chua-nhap' | 'qua-han', n: number, ten: string, className = '') => (
    <SoLieuO giaTri={n} tieuDe={`${ten} · ${l.ma}`} nguon={nguon(id, `cot=${cot}&lop=${l.id}`)} className={`${vung} ${className}`} />
  );
  const tong = (
    <span className="text-xs text-slate-400">
      <span className="tabular-nums text-slate-200">{data.lop.length}</span> lớp · <SoLieuO giaTri={data.tongHocVien} tieuDe="Học viên đang học" nguon={nguon(id, 'cot=hoc-vien')} className={`${vung} text-slate-200`} /> học viên
    </span>
  );
  return (
    <Card title="Lớp đang dạy" action={data.lop.length ? tong : undefined} bodyClass="p-0">
      {!data.lop.length ? <Empty title="Chưa có phân công lớp nào đang hiệu lực." />
        : dienThoai ? (
          <div>
            {data.lop.map((l) => {
              const k = ketQuaCua(l.id);
              return (
                <TheDong key={l.id}
                  dau={(
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Link to={`/hoc-vien/lop/${l.id}`} className="link font-semibold">{l.ma}</Link>
                      <VaiChip vai={l.vai} />
                      <ChipBanGiaoLop l={l} />
                    </span>
                  )}
                  dong={[
                    { nhan: 'Học viên', noiDung: <span className="tabular-nums">{l.hocVien}</span> },
                    { nhan: 'Bài chưa nhập điểm', noiDung: <span className="inline-flex items-baseline gap-2">{so(l, 'chua-nhap', l.chuaNhap, 'Bài chưa nhập điểm')}
                      {l.quaHan > 0 && <span className="text-bad">{so(l, 'qua-han', l.quaHan, 'Bài quá hạn chưa nhập điểm', `${soDam} text-bad`)} quá hạn</span>}</span> },
                    ...(k?.moc ? [{ nhan: k.moc.nhan, noiDung: <MiniKetQua id={id} k={k} /> }] : []),
                  ]} />
              );
            })}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '40rem' }}>
              <colgroup><col style={{ width: '17%' }} /><col style={{ width: '15%' }} /><col style={{ width: '20%' }} /><col style={{ width: '12%' }} /><col style={{ width: '19%' }} /><col style={{ width: '17%' }} /></colgroup>
              <thead><tr>
                <Th>Lớp</Th><Th>Khung</Th><Th>Vai trò</Th><Th align="right">Học viên</Th>
                <Th align="right" hint="Một bài = một kỹ năng của một em trong một lượt, tuần thi đã bắt đầu. Cùng số với Lịch Test. Khác với số ở khối Việc đang có, vốn đếm việc.">Bài chưa nhập điểm</Th>
                <Th align="right">Bài quá hạn</Th>
              </tr></thead>
              <tbody>
                {data.lop.map((l) => (
                  <tr key={l.id} className="row-hover">
                    <td className="td"><span className="flex flex-wrap items-center gap-x-2 gap-y-1"><Link to={`/hoc-vien/lop/${l.id}`} className="link">{l.ma}</Link><ChipBanGiaoLop l={l} /></span></td>
                    <td className="td">{chipKhung(l.khung)}</td>
                    <td className="td"><VaiChip vai={l.vai} /></td>
                    <td className="td text-right tabular-nums">{l.hocVien}</td>
                    <td className="td text-right tabular-nums">{so(l, 'chua-nhap', l.chuaNhap, 'Bài chưa nhập điểm')}</td>
                    <td className="td text-right tabular-nums">{so(l, 'qua-han', l.quaHan, 'Bài quá hạn chưa nhập điểm', `${soDam} text-bad`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </Card>
  );
}

/** Một ô kết quả: `đạt/tổng` bấm được mở danh sách học viên; chưa ai có điểm → "—" (chưa có điểm KHÁC chưa đạt). */
function OKq({ id, k, o }: { id: number; k: KetQuaLop; o: OKetQua }) {
  if (o.tong <= 0) return <span className="text-slate-500">—</span>;
  return (
    <SoLieuO giaTri={o.tong} nhan={`${o.dat}/${o.tong}`} tieuDe={`${o.nhan} · ${k.ma} · ${k.moc!.nhan}`}
      nguon={nguon(id, `cot=ket-qua&lop=${k.classId}&dong=${o.dong}&moc=${k.moc!.key}`)} className={`${vung} ${soDam} text-slate-100`} />
  );
}
const thap = (o: OKetQua) => o.tong > 0 && o.dat * 2 < o.tong;
/** Q31-6: bảng lớp thường bốn cột CỐ ĐỊNH theo khoá môn — ô chỉ còn số, tên môn theo chương trình nằm ở đầu cột. */
const COT_THUONG = [
  { k: 'listening', nhan: 'L', phu: null }, { k: 'reading', nhan: 'R', phu: null },
  { k: 'writing', nhan: 'W', phu: '(G+V)' }, { k: 'speaking', nhan: 'S', phu: '(P)' },
] as const;

function MiniKetQua({ id, k }: { id: number; k: KetQuaLop }) {
  return (
    <span className="block">
      <span className="grid gap-1" style={{ gridTemplateColumns: `repeat(${k.o.length}, minmax(0, 1fr))` }}>
        {k.o.map((o) => (
          <span key={o.dong} className={`rounded-md border px-0.5 py-1 text-center text-xs tabular-nums ${o.cuaMinh ? MON_CUA_MINH : ''} ${thap(o) ? 'bg-bad-bg' : ''}`}
            style={o.cuaMinh ? undefined : { borderColor: 'var(--line)' }}>
            <OKq id={id} k={k} o={o} />
            {/* PR-S5F-b: cách số một nhịp — gạch chấm dưới số (underline-offset-4) không chạm nhãn môn ở 375 px. */}
            <span className="mt-1 block text-xs leading-4 text-slate-400">{o.nhan}</span>
          </span>
        ))}
      </span>
      <span className="mt-1 block text-xs text-slate-500">{k.khung === 'ft' ? 'đạt kỳ vọng / có điểm' : 'đạt / có điểm'}</span>
    </span>
  );
}

function KhoiKetQua({ data, kq }: { data: HoSo; kq: { data: { ketQua: KetQuaLop[] } | null; loading: boolean; error: { message: string; hint?: string } | null; reload: () => void } }) {
  const id = data.gv.id;
  const ft = kq.data?.ketQua.filter((k) => k.khung === 'ft') ?? [];
  const thuong = kq.data?.ketQua.filter((k) => k.khung === 'thuong') ?? [];
  const laMinh = data.gv.laChinhMinh;
  return (
    <Card title="Kết quả gần nhất của lớp đang dạy"
      action={(
        <span className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5"><span className={`inline-block h-2.5 w-2.5 rounded-[3px] ${MON_CUA_MINH}`} aria-hidden />{laMinh ? 'môn bạn dạy' : 'môn giáo viên này dạy'}</span>
          <span>· nền đỏ nhạt = dưới một nửa đạt</span>
        </span>
      )}>
      {kq.error ? <ErrorState message={kq.error.message} hint={kq.error.hint} onRetry={kq.reload} />
        : kq.loading || !kq.data ? <Skeleton rows={3} />
        : !ft.length && !thuong.length ? <Empty title="Chưa có lớp nào để hiện kết quả." />
        : (
          <div className="grid gap-4 lg:grid-cols-2">
            {ft.length > 0 && (
              <div className="table-scroll rounded-lg border" style={{ borderColor: 'var(--line)' }}>
                <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '24rem' }}>
                  <colgroup><col style={{ width: '30%' }} />{ENTRY_SKILLS.map((k) => <col key={k} />)}</colgroup>
                  <thead><tr>
                    <Th hint="Mỗi ô: số học viên đạt kỳ vọng của đợt đó / số học viên đã có điểm kỹ năng đó. W1, W2 so từng bài với kỳ vọng.">Fast Track</Th>
                    {ENTRY_SKILLS.map((k) => <Th key={k} align="center">{ENTRY_SKILL_SHORT[k]}</Th>)}
                  </tr></thead>
                  <tbody>
                    {ft.map((k) => (
                      <tr key={k.classId}>
                        <td className="td"><Link to={`/hoc-vien/lop/${k.classId}`} className="link">{k.ma}</Link>
                          <div className="text-xs text-slate-500">{k.moc ? k.moc.nhan : 'Chưa có điểm'}</div></td>
                        {ENTRY_SKILLS.map((s) => {
                          const o = k.o.find((x) => x.dong === s);
                          return (
                            <td key={s} className={`td text-center tabular-nums ${o?.cuaMinh ? MON_CUA_MINH : ''} ${o && thap(o) ? 'bg-bad-bg' : ''}`}>
                              {o ? <OKq id={id} k={k} o={o} /> : <span className="text-slate-500">—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {thuong.length > 0 && (
              <div className="table-scroll rounded-lg border" style={{ borderColor: 'var(--line)' }}>
                <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '24rem' }}>
                  <colgroup><col style={{ width: '30%' }} /><col /><col /><col /><col /></colgroup>
                  <thead><tr>
                    <Th hint="Mỗi ô: số học viên đạt (từ 70%) / số học viên đã có điểm môn đó. Bốn cột cố định: BE, ELE dùng W và S; FOU dùng G+V ở chỗ W và P ở chỗ S.">Lớp thường</Th>
                    {COT_THUONG.map((c) => (
                      <Th key={c.k} align="center" hint={c.phu ? 'BE, ELE: Writing, Speaking. FOU: Grammar + Vocabulary, Pronunciation.' : undefined}>
                        {c.nhan}{c.phu && <span className="font-medium text-slate-500"> {c.phu}</span>}
                      </Th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {thuong.map((k) => {
                      /* Q24: lớp không chia môn (Pre FOU) — MỘT ô kéo cả bốn cột, ô duy nhất còn chữ "Tổng hợp". */
                      const tongHop = k.o.length === 1 && !COT_THUONG.some((c) => c.k === k.o[0].dong) ? k.o[0] : null;
                      return (
                        <tr key={k.classId}>
                          <td className="td"><Link to={`/hoc-vien/lop/${k.classId}`} className="link">{k.ma}</Link>
                            <div className="text-xs text-slate-500">{k.moc ? k.moc.nhan : 'Chưa có điểm'}</div></td>
                          {!k.o.length ? <td className="td text-slate-500" colSpan={4}>Chưa có điểm</td>
                            : tongHop ? (
                              <td colSpan={4} className={`td text-center tabular-nums ${tongHop.cuaMinh ? MON_CUA_MINH : ''} ${thap(tongHop) ? 'bg-bad-bg' : ''}`}>
                                <span className="block text-xs leading-4 text-slate-400">{tongHop.nhan}</span>
                                <OKq id={id} k={k} o={tongHop} />
                              </td>
                            )
                            : COT_THUONG.map((c) => {
                              const o = k.o.find((x) => x.dong === c.k);
                              return (
                                <td key={c.k} className={`td text-center tabular-nums ${o?.cuaMinh ? MON_CUA_MINH : ''} ${o && thap(o) ? 'bg-bad-bg' : ''}`}>
                                  {o ? <OKq id={id} k={k} o={o} /> : <span className="text-slate-500">—</span>}
                                </td>
                              );
                            })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
    </Card>
  );
}

// ------------------------------------------------------------------ 4 · Case đang phụ trách

function KhoiCase({ data, homNay, linkPa }: { data: HoSo; homNay: string; linkPa: { den: string; chu: string } | null }) {
  const dienThoai = useDienThoai();
  const id = data.gv.id;
  const ds = data.caseMo;
  const quaHan = ds.filter((c) => c.quaHan).length;
  const viec = (c: CaseHs) => {
    const [v] = viecTiepCuaEm({ nhapDiem: null, cases: [{ caseId: c.id, topic: c.topic, viecTiep: c.viecTiep }], yThuc: null, homNay, chuongTrinh: null });
    return v ? <ViecTiep v={v} den={duongHoSoHocVien(c.studentId, { caseId: c.id })} /> : <span className="text-slate-600">—</span>;
  };
  const ten = (c: CaseHs) => (
    <Link to={duongHoSoHocVien(c.studentId, { caseId: c.id })} className="link inline-flex min-w-0 max-w-full text-left font-semibold" title={c.tieuDe}><TenCase c={{ title: c.tieuDe, tenSos: c.tenSos }} /></Link>
  );
  const trangThai = (c: CaseHs) => <NhanTrangThai t={c.trangThai.t} title={c.trangThai.chu} />;
  return (
    <Card title="Case đang phụ trách" bodyClass="p-0"
      action={ds.length || linkPa ? (
        <span className="flex flex-wrap items-baseline gap-x-3 text-xs text-slate-400">
          {ds.length > 0 && <span>
          {/* PR-S5F-b: mỗi cụm `17 Case` · `2 việc tiếp quá hạn` giữ liền một dòng — hẹp thì xuống dòng GIỮA hai cụm, không giữa số và chữ. */}
          <span className="whitespace-nowrap"><SoLieuO giaTri={ds.length} tieuDe="Case đang phụ trách" nguon={nguon(id, 'cot=case-mo')} className={`${vung} text-slate-200`} /> Case</span> ·{' '}
          {quaHan > 0
            ? <span className="whitespace-nowrap"><SoLieuO giaTri={quaHan} tieuDe="Case có việc quá hạn" nguon={nguon(id, 'cot=case-qua-han')} className={`${vung} ${soDam} text-bad`} /> <span className="text-bad">việc tiếp quá hạn</span></span>
            : <span className="whitespace-nowrap">không có việc tiếp quá hạn</span>}
          </span>}
          {/* P6 (Q26): Quản lý, Quản trị xem → Hiệu quả PA lọc theo giáo viên này (URL hợp đồng Pb2-a). */}
          {linkPa && <Link to={linkPa.den} className="link whitespace-nowrap py-2 -my-2 text-xs">{linkPa.chu}</Link>}
        </span>
      ) : undefined}>
      {!ds.length ? <Empty title="Không có Case nào đang mở." />
        : dienThoai ? (
          <div>
            {ds.map((c) => (
              <TheDong key={c.id} className={c.quaHan ? 'shadow-[inset_3px_0_0_rgb(var(--bad-rgb))]' : ''}
                dau={<span className="block min-w-0"><Link to={`/hoc-vien/${c.studentId}`} className="link font-semibold">{c.hocVien}</Link>{c.maLop && <span className="text-xs text-slate-400"> · {c.maLop}</span>}</span>}
                dong={[{ nhan: 'Case', noiDung: ten(c) }, { nhan: 'Trạng thái', noiDung: trangThai(c) }, { nhan: 'Việc tiếp', noiDung: viec(c) }]} />
            ))}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '47rem' }}>
              <colgroup><col style={{ width: '17%' }} /><col style={{ width: '12%' }} /><col style={{ width: '28%' }} /><col style={{ width: '14%' }} /><col style={{ width: '29%' }} /></colgroup>
              <thead><tr><Th>Học viên</Th><Th>Lớp</Th><Th>Case</Th><Th>Trạng thái</Th><Th>Việc tiếp</Th></tr></thead>
              <tbody>
                {ds.map((c) => (
                  <tr key={c.id} className="row-hover" style={c.quaHan ? { boxShadow: 'inset 3px 0 0 rgb(var(--bad-rgb))' } : undefined}>
                    <td className="td"><Link to={`/hoc-vien/${c.studentId}`} className="link">{c.hocVien}</Link></td>
                    <td className="td text-slate-300">{c.maLop ?? '—'}</td>
                    <td className="td min-w-0">{ten(c)}
                      {(c.nguyenNhan || c.moTu) && <span className="block truncate text-xs text-slate-500">{[c.nguyenNhan, c.moTu].filter(Boolean).join(' · ')}</span>}</td>
                    <td className="td">{trangThai(c)}</td>
                    <td className="td min-w-0">{viec(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </Card>
  );
}

// ------------------------------------------------------------------ 5 · Yêu cầu đã gửi

function KhoiYeuCau({ data, coDuyet }: { data: HoSo; coDuyet: boolean }) {
  const { gv, yeuCau: y } = data;
  const id = gv.id;
  const link: ReactNode = gv.laChinhMinh
    ? <Link to="/cong-viec/yeu-cau" className="link text-xs">Yêu cầu của tôi ›</Link>
    : coDuyet ? <Link to="/cong-viec/cho-duyet" className="link text-xs">Chờ duyệt ›</Link> : null;
  return (
    <Card title={gv.laChinhMinh ? 'Yêu cầu đã gửi' : `Yêu cầu ${gv.ten.split(' ').pop()} đã gửi`} action={link}>
      {y.cho === 0 && y.tuChoi === 0 ? <p className="m-0 text-sm text-slate-400">Không có yêu cầu nào đang chờ.</p> : (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span><SoLieuO giaTri={y.cho} tieuDe="Yêu cầu đang chờ duyệt" nguon={nguon(id, 'cot=yc-cho')} className={`${vung} ${soDam} text-slate-100`} /> chờ duyệt
            {y.choQuaHan > 0 && <span className={`ml-1 text-xs text-bad ${soDam}`}>({y.choQuaHan} quá hạn duyệt)</span>}</span>
          <span className="text-slate-600" aria-hidden>·</span>
          <span><SoLieuO giaTri={y.tuChoi} tieuDe="Yêu cầu bị từ chối trong 60 ngày" nguon={nguon(id, 'cot=yc-tu-choi')} className={`${vung} ${soDam} text-slate-100`} /> bị từ chối trong 60 ngày</span>
        </div>
      )}
    </Card>
  );
}
