import { useState, type ReactNode } from 'react';
import type { DinhNghiaCot } from '@shared/domain/index.ts';
import { Bang } from '../../ui/Bang.tsx';
import { ODiem } from '../../ui/ODiem.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { Nhan, NhanKq, NhanLich } from '../../ui/Nhan.tsx';
import { TyLe } from '../../ui/TyLe.tsx';
import { LOP_OSO } from '../../ui/SoLieu.tsx';
import { DaiChiXem, Empty, ErrorState, OChiSo } from '../../ui/ui.tsx';

/**
 * BẢNG MẪU V5 (NEN-V5, 08 mục 6) — bản web của `thiet-ke/v5/bang-mau.html`, dựng bằng THÀNH PHẦN THẬT (token `index.css`, `Nhan*`, `ChipSos`,
 * `Bang` / `ODiem`, `OChiSo`, `TyLe`, `OSo`). Chủ SP duyệt bằng ảnh cặp mockup | web (`scripts/anh-cap.mjs`). Dữ liệu demo cố định, không gọi API.
 * Mục 7 (panel việc) là dáng hiện có — NEN-PANEL sửa khung panel; mục này chỉ để so màu / chữ.
 */

const Muc = ({ so, ten, children, ghi }: { so: number; ten: ReactNode; children: ReactNode; ghi?: ReactNode }) => (
  <section className="flex flex-col gap-3" aria-labelledby={`v5-m${so}`}>
    <h2 id={`v5-m${so}`} className="m-0 flex items-baseline gap-2.5 text-lg font-bold text-slate-100">
      <span className="tabular-nums text-[color:var(--hong-chu)]">{so}</span><span>{ten}</span>
    </h2>
    {ghi && <p className="m-0 max-w-[880px] text-[13px] text-slate-400">{ghi}</p>}
    {children}
  </section>
);

const O_MAU: Array<[string, string, string?]> = [
  ['Nền đọc', '--surface'], ['Nền trang', '--bg'], ['Đầu bảng, ô phụ', '--surface-2'], ['Thanh điều hướng', '--dieu-huong-nen'],
  ['Nút chính, link', '--accent'], ['Đang chọn / đang mở', '--accent-soft', 'vạch'], ['Điểm nhấn (không chữ)', '--hong'], ['Hồng khi là chữ', '--hong-chu'],
  ['⚠ Lỗi · quá hạn · ✗', 'rgb(var(--bad-rgb))'], ['⚠ Sắp hạn · chú ý', 'rgb(var(--soon-rgb))'], ['✓ Đạt · đã lưu', 'rgb(var(--ok-rgb))'],
  ['– Thiếu dữ liệu', '--surface-2', 'dut'], ['Lịch thi', '--lich-nen'],
];
const nen = (v: string) => (v.startsWith('--') ? `var(${v})` : v);

const THANG: Array<[string, string, string, string?]> = [
  ['28 / 700', '75 %', 'text-2xl font-bold tabular-nums', 'số lớn chỉ số (chữ số Inter)'],
  ['22 / 700', 'Tổng quan', 'text-xl font-bold', 'tiêu đề trang'],
  ['17 / 700', 'Báo PH · Ngô Hải Yến', 'text-lg font-bold', 'tiêu đề panel, khối'],
  ['15 / 400', 'Chữ thường, ô bảng, nút — Nguyễn Minh An · MB FT 101', 'text-base'],
  ['14 / 400', 'Lưới dày, giá trị trong panel', 'text-sm'],
  ['13 / 600', 'Nhãn, đầu cột', 'text-[13px] font-semibold text-slate-400'],
  ['12 / 400', 'W1 5.5 · W2 6.0 · hạn 18/09 · GV Lê Minh Khoa', 'text-xs text-slate-500', 'tối thiểu — vẫn đọc được'],
];

const HangBd = ({ ten, phu, children, dau }: { ten: string; phu: string; children: ReactNode; dau?: boolean }) => (
  <div className={`grid grid-cols-[13rem_1fr] items-center gap-x-4 gap-y-2 px-4 py-3.5 max-sm:grid-cols-1 ${dau ? '' : 'border-t'}`}>
    <div className="text-[13px] font-semibold text-slate-400">{ten}<small className="block text-xs font-normal text-slate-500">{phu}</small></div>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);

/** Chấm hồng "của tôi" (V5 `.cua-toi`). */
const CuaToi = () => <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--hong)] align-middle" />;
const NutViec = ({ children }: { children: ReactNode }) => <button type="button" className="btn btn-sm"><CuaToi />{children}</button>;
const SoBam = ({ children }: { children: ReactNode }) => <button type="button" className={LOP_OSO}>{children}</button>;

type Kq = 'vuot' | 'bang' | 'duoi' | null;
type HangHv = {
  id: number; ten: string; phuTen?: string; target: string; l: [string, Kq]; r: [string, Kq]; w: [string, Kq, string]; s: [string | null, Kq, string?]; ovr: [string | null, Kq];
  kq: ReactNode; thi: ReactNode; viec: ReactNode; daThi?: boolean;
};
const COT: DinhNghiaCot[] = [
  { key: 'ten', nhan: 'Học viên', kieu: 'ten' }, { key: 'target', nhan: 'Target', kieu: 'so' },
  { key: 'l', nhan: 'L', kieu: 'diem' }, { key: 'r', nhan: 'R', kieu: 'diem' }, { key: 'w', nhan: 'W', kieu: 'diem', rong: 124 }, { key: 's', nhan: 'S', kieu: 'diem' },
  { key: 'ovr', nhan: 'Overall', kieu: 'diem' }, { key: 'kq', nhan: 'Kết quả', kieu: 'chip', rong: 150 }, { key: 'thi', nhan: 'Ngày thi', kieu: 'chip', rong: 130 },
  { key: 'viec', nhan: 'Việc', kieu: 'viec' },
];
const khac = (s: string) => <span className="text-xs text-slate-500">{s}</span>;
const HANG: HangHv[] = [
  { id: 1, ten: 'Nguyễn Minh An', target: '6.5', l: ['6.0', 'bang'], r: ['6.0', 'bang'], w: ['6.0', 'bang', 'W1 5.5 · W2 6.0'], s: ['6.0', 'bang'], ovr: ['6.0', 'bang'],
    kq: <NhanKq kq="dat">Đạt</NhanKq>, thi: <NhanLich loai="du-kien">Dự kiến FEB</NhanLich>,
    viec: <span className="flex flex-col items-start gap-1"><NutViec>Nhập điểm L · MT3</NutViec>{khac('+ Ghi kết quả PA · R (Lê Minh Khoa)')}</span> },
  { id: 2, ten: 'Trần Thu Hà', target: '6.0', l: ['5.5', 'bang'], r: ['5.5', 'bang'], w: ['5.5', 'bang', 'W1 5.5 · W2 5.5'], s: ['5.0', 'duoi'], ovr: ['5.5', 'bang'],
    kq: <NhanKq kq="dat">Đạt</NhanKq>, thi: <NhanLich loai="du-kien">Dự kiến JAN</NhanLich>,
    viec: <span className="flex flex-col items-start gap-1"><Nhan tone="muted">Chờ QL duyệt · dời MT3 S</Nhan>{khac('Overall đạt → không SOS; S vẫn hiện ✗ 5.0 (T06)')}</span> },
  { id: 3, ten: 'Lê Quang Huy', target: '6.5', l: ['6.0', 'bang'], r: ['5.0', 'duoi'], w: ['5.5', 'duoi', 'W1 5.0 · W2 5.5'], s: ['6.0', 'bang'], ovr: ['5.5', 'duoi'],
    kq: <span className="flex flex-wrap gap-1"><NhanKq kq="chua-dat">Chưa đạt</NhanKq><ChipSos muc={2} kyNang={['R', 'W']} dot="MT2" tinh /></span>, thi: <NhanLich loai="chua">Chưa có lịch</NhanLich>,
    viec: <span className="flex flex-col items-start gap-1"><NutViec>Ghi kết quả PA · R</NutViec><NutViec>Xử lý vi phạm</NutViec>{khac('+ Ghi kết quả PA · W (Lê Minh Khoa)')}</span> },
  { id: 4, ten: 'Phạm Bảo Ngọc', target: '7.0', l: ['6.5', 'bang'], r: ['7.0', 'vuot'], w: ['6.5', 'bang', 'W1 6.5 · W2 6.5'], s: ['6.5', 'bang'], ovr: ['6.5', 'bang'],
    kq: <NhanKq kq="dat">Đạt</NhanKq>, thi: <NhanLich loai="du-kien">Dự kiến MAR</NhanLich>,
    viec: <span className="flex flex-col items-start gap-1"><NutViec>Xử lý vi phạm</NutViec><Nhan tone="late">Quá hạn 1 ngày</Nhan></span> },
  { id: 5, ten: 'Tô Ngọc Hân', target: '6.0', l: ['5.5', 'bang'], r: ['6.0', 'vuot'], w: ['5.5', 'bang', 'W1 5.5 · W2 5.5'], s: [null, null, 'Vắng'], ovr: [null, null],
    kq: <NhanKq kq="thieu">Chưa đủ dữ liệu</NhanKq>, thi: <NhanLich loai="chua">Chưa có lịch</NhanLich>, viec: khac('Không có việc của tôi') },
  { id: 6, ten: 'Dương Minh Quân', phuTen: 'UB FT 401 · ví dụ hàng đã thi', target: '7.0', l: ['—', null], r: ['—', null], w: ['—', null, ''], s: [null, null], ovr: [null, null],
    kq: <NhanLich loai="da-thi">Đã thi · chờ KQ</NhanLich>, thi: <NhanLich loai="co">Ngày thi 15/08</NhanLich>, viec: khac('TVV: Ghi KQ thi thật'), daThi: true },
];

function BangDiem() {
  const [mo, setMo] = useState<number | null>(2);
  const o = (h: HangHv, c: DinhNghiaCot): ReactNode => {
    switch (c.key) {
      case 'ten': return <a href="#v5-m5" className="font-semibold text-slate-100 no-underline hover:underline">{h.ten} <span aria-hidden className="font-normal text-slate-500">↗</span></a>;
      case 'target': return h.target;
      case 'l': case 'r': case 'w': case 's': case 'ovr': {
        const [so, kq] = h[c.key];
        return h.daThi ? <span className="text-slate-500">—</span> : <ODiem so={so} kq={kq} nhan={c.nhan} kyVong={h.target} />;
      }
      default: return h[c.key as 'kq' | 'thi' | 'viec'];
    }
  };
  const phu = (h: HangHv, c: DinhNghiaCot) => (c.key === 'ten' ? h.phuTen : c.key === 'w' ? h.w[2] : c.key === 's' ? h.s[2] : null);
  return (
    <Bang ten="Điểm MT2 MB FT 101" cot={COT} hang={HANG} khoa={(h) => h.id} oCua={o} phuCua={phu}
      onHang={(h) => setMo(h.id === mo ? null : h.id)} dangMo={(h) => h.id === mo}
      congCu={<>
        <span className="text-[15px] font-bold text-slate-100">MB FT 101 · MT2 · W3 AUG</span>
        <Nhan tone="muted">Kỳ vọng = Target − 0,5</Nhan>
        <span className="flex-1" />
        <span className="text-[13px] text-slate-400">5 / 22 HV · 4 việc của tôi</span>
      </>} />
  );
}

export function BangMauV5() {
  return (
    <div className="bang-mau-v5 mx-auto flex max-w-[1360px] flex-col gap-7 pb-16">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="m-0 text-xl font-bold text-slate-100">Bảng mẫu V5</h1>
          <Nhan tone="soon">ĐỀ XUẤT THIẾT KẾ · chờ chủ SP duyệt</Nhan>
        </div>
        <p className="m-0 max-w-[880px] text-[13px] text-slate-400">Nền chung V5 trong mã (<code>web/src/index.css</code> ← <code>thiet-ke/v5/v5-nen.css</code>). Dữ liệu demo cố định (hôm nay T2 14/09/2026 · W3 SEP) — không gọi API.</p>
      </header>

      <Muc so={1} ten="Màu PISA từ logo" ghi={<>Xanh <b>#273C8F</b> = cấu trúc (thanh điều hướng, nút chính, link, focus, đang chọn) · hồng <b>#F25A98</b> = điểm nhấn nhận diện (vạch menu đang mở, mốc "tuần này", dấu "của tôi") — <b>hồng không bao giờ nghĩa là lỗi hay SOS</b>.</>}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
          {O_MAU.map(([ten, v, kieu]) => (
            <div key={ten} className="card flex items-center gap-2.5 p-2 text-[13px]">
              <i className={`h-7 w-7 shrink-0 rounded-md border ${kieu === 'dut' ? 'border-dashed !border-[color:var(--thieu-vien)]' : ''}`}
                style={{ background: nen(v), boxShadow: kieu === 'vach' ? 'inset 3px 0 0 var(--accent)' : undefined }} />
              <span>{ten}<code className="block text-xs text-slate-500">{v.replace(/^rgb\(var\((--[a-z-]+)-rgb\)\)$/, '$1')}</code></span>
            </div>
          ))}
        </div>
      </Muc>

      <Muc so={2} ten="Chữ — giữ thang trong mã (12 · 13 · 14 · 15 · 17 · 22 · 28)">
        <div className="card">
          {THANG.map(([ma, mau, lop, phu]) => (
            <div key={ma} className="flex items-baseline gap-4 border-b px-4 py-1.5 last:border-b-0">
              <code className="w-16 shrink-0 text-xs text-slate-500">{ma}</code><span className={lop}>{mau}</span>{phu && <span className="text-xs text-slate-500">{phu}</span>}
            </div>
          ))}
        </div>
      </Muc>

      <Muc so={3} ten="Badge — một kích thước (cao 22, chữ 12 / 600), bốn nhóm khác dáng"
        ghi={'Nhóm nhận ra bằng dáng trước, màu sau: viền (kết quả, SOS) · nền đặc góc vuông (lịch thi) · viên tròn có chấm (tiến độ). Đạt cùng họ với SOS (C23); "Đã thi · chờ KQ" thuộc nhóm lịch thi — không thể đọc thành kết quả.'}>
        <div className="card">
          <HangBd dau ten="Kết quả học tập" phu="viền 1 px · ✓ ✗ –">
            <NhanKq kq="dat">Đạt</NhanKq><NhanKq kq="chua-dat">Chưa đạt</NhanKq><NhanKq kq="thieu">Chưa đủ dữ liệu</NhanKq><NhanKq kq="dat">Đạt Target</NhanKq>
          </HangBd>
          <HangBd ten="Mức SOS" phu={'viền dày dần · chữ "SOS n"'}>
            <ChipSos muc={1} kyNang={['S']} dot="MT2" tinh /><ChipSos muc={2} kyNang={['R', 'W']} dot="MT2" tinh />
            <ChipSos muc={3} kyNang={['L', 'R', 'W']} dot="MT2" tinh /><ChipSos muc={2} tam dot="MT2" tinh />
          </HangBd>
          <HangBd ten="Trạng thái lịch thi" phu="nền đặc · góc vuông">
            <NhanLich loai="co">Ngày thi 10/10</NhanLich><NhanLich loai="du-kien">Dự kiến NOV</NhanLich><NhanLich loai="chua">Chưa có lịch</NhanLich>
            <NhanLich loai="da-thi">Đã thi · chờ KQ</NhanLich><NhanLich loai="co">Có KQ · chờ bước tiếp</NhanLich>
          </HangBd>
          <HangBd ten="Tiến độ xử lý" phu="viên tròn · chấm / ⚠">
            <Nhan tone="muted">Chờ duyệt</Nhan><Nhan tone="doing">Đang làm</Nhan><Nhan tone="ok">Đã xong</Nhan><Nhan tone="soon">Hạn hôm nay</Nhan>
            <Nhan tone="late">Quá hạn 2 ngày</Nhan><Nhan tone="muted">Chưa liên hệ được · lần 1</Nhan>
          </HangBd>
        </div>
      </Muc>

      <Muc so={4} ten="Bấm vào đâu thì ra gì">
        <div className="card">
          <div className="flex flex-wrap items-center gap-2.5 px-4 py-3.5">
            <button type="button" className="btn btn-primary">Ghi kết quả PA</button>
            <button type="button" className="btn">Chốt ngày</button><button type="button" className="btn">Nhập điểm</button><button type="button" className="btn">Ghi báo PH</button>
            <button type="button" className="btn btn-ghost text-[color:var(--accent)]">Huỷ</button><button type="button" className="btn" disabled>Lưu</button>
          </div>
          <HangBd ten="Nút động từ" phu="mở panel việc"><span className="text-[13px] text-slate-400">Tên = việc sẽ làm. Không còn nút "Mở". Nút chính chỉ một trên mỗi vùng.</span></HangBd>
          <HangBd ten="Tên + ↗" phu="mở hồ sơ"><a href="#v5-m4" className="font-semibold text-slate-100 no-underline hover:underline">Nguyễn Minh An <span aria-hidden className="font-normal text-slate-500">↗</span></a><span className="text-[13px] text-slate-400">mở hồ sơ (đổi trang, Quay lại về đúng chỗ)</span></HangBd>
          <HangBd ten="Số gạch chân" phu="OSo"><SoBam>15/20</SoBam><span className="text-[13px] text-slate-400">mở panel dữ liệu <b>chỉ đọc</b> · số 0 không bấm:</span><span className="font-medium tabular-nums text-slate-500">0</span></HangBd>
          <HangBd ten="ⓘ" phu="giải thích"><button type="button" className="btn btn-sm btn-ghost" aria-label="Giải thích Đạt MT">ⓘ</button><span className="text-[13px] text-slate-400">giải thích cách tính, không đổi dữ liệu</span></HangBd>
        </div>
      </Muc>

      <Muc so={5} ten={<>Bảng (<code>Bang</code>) · ô điểm W1 / W2 · nhiều việc một HV</>}
        ghi={<>Hàng 44 px, 64 px khi có dòng phụ; căn theo kiểu cột; công cụ ở hàng ngoài khung. Người xem: <b>cô Trần Ngọc Hà</b> (GVCN MB FT 101, dạy L · R). Điểm tô chính con số + ✓ / ✗ so với kỳ vọng MT2 (Target − 0,5).</>}>
        <BangDiem />
      </Muc>

      <Muc so={6} ten="Ô số → panel báo cáo chỉ đọc">
        <div className="grid grid-cols-[minmax(0,1fr)_420px] items-start gap-4 max-[1100px]:grid-cols-1">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-sm:grid-cols-1">
              <OChiSo ten="Đạt MT2" giaTri="75 %" mau={<><SoBam>15/20</SoBam> HV đủ dữ liệu</>} />
              <OChiSo ten="Case có PA" giaTri="83 %" mau={<><SoBam>5/6</SoBam> Case</>} />
              <OChiSo ten="Đạt Target thi thật" giaTri={<span className="text-lg font-semibold leading-[42px] text-slate-500">Chưa có dữ liệu</span>} mau="0 HV có kết quả · 0 không bấm" />
              <OChiSo ten="Thi tuần này" giaTri="2" mau={<><SoBam>2</SoBam> HV · W3 SEP</>} />
            </div>
            <p className="m-0 text-[13px] text-slate-400">Phần trăm là số chính (C03), tử / mẫu ngay dưới: <TyLe n={15} N={20} nhan="HV đủ dữ liệu" /> · mẫu 0: <TyLe n={0} N={0} />. Số trên trang = số dòng panel, cùng hàm, cùng phạm vi (G7).</p>
          </div>
          <aside className="card overflow-hidden shadow-2xl" aria-label="Panel báo cáo">
            <div className="border-b px-5 pb-3 pt-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-500"><span className="h-[3px] w-3.5 rounded-sm bg-[color:var(--hong)]" />BÁO CÁO · CHỈ ĐỌC</div>
              <div className="flex items-start gap-2.5"><h3 className="m-0 flex-1 text-lg font-bold text-slate-100">Đạt MT2 · 75 % = 15/20</h3><button type="button" className="btn btn-sm btn-ghost" aria-label="Đóng">✕</button></div>
              <div className="mt-1 text-[13px] text-slate-400">Monbay · MB FT 101 · MT2 (W3 AUG) · số chốt lúc lưu MT2</div>
            </div>
            <div className="flex flex-col gap-4 px-5 py-4">
              <div className="surface-2 rounded-lg px-3 py-2.5 text-[13px] text-slate-400"><b className="text-slate-100">Cách tính:</b> HV có Overall MT2 ≥ kỳ vọng của lượt (Target − 0,5) / HV đủ 4 kỹ năng MT2. <b className="text-slate-100">Không tính:</b> 2 HV chưa đủ dữ liệu, HV đã nghỉ.</div>
              <div className="flex flex-wrap items-baseline gap-6 tabular-nums">
                <span><b className="text-2xl">15</b> <span className="text-slate-400">đạt</span></span><span><b className="text-2xl">5</b> <span className="text-slate-400">chưa đạt</span></span>
                <span><b className="text-2xl text-slate-500">2</b> <span className="text-slate-400">chưa đủ dữ liệu (ngoài mẫu)</span></span>
              </div>
            </div>
            <div className="border-t px-5 py-3 text-xs text-slate-500">Không có nút xử lý trong panel báo cáo (C22).</div>
          </aside>
        </div>
      </Muc>

      <Muc so={7} ten="Panel việc · trạng thái lưu (khung hiện có — NEN-PANEL sửa)">
        <div className="card flex flex-col gap-2.5 px-4 py-3.5">
          {([
            [<span key="n" className="font-semibold text-soon">● Chưa lưu</span>, <><button type="button" className="btn btn-sm">Lưu</button><button type="button" className="btn btn-sm btn-primary">Lưu và tiếp</button></>],
            [<span key="d" className="font-semibold text-doing">Đang lưu…</span>, <><button type="button" className="btn btn-sm" disabled>Lưu</button><button type="button" className="btn btn-sm btn-primary" disabled>Lưu và tiếp</button></>],
            [<span key="x" className="font-semibold text-dim">✓ Đã lưu 10:42</span>, <><button type="button" className="btn btn-sm">Đóng</button><button type="button" className="btn btn-sm btn-primary">Việc kế: Báo PH · Lý Tuấn Bình</button></>],
            [<span key="l" className="font-semibold text-bad">⚠ Chưa lưu được — mất mạng. Chữ đang gõ vẫn giữ.</span>, <button type="button" className="btn btn-sm btn-primary">Thử lại</button>],
          ] as const).map(([tt, nut], i) => (
            <div key={i} className={`flex flex-wrap items-center gap-2.5 rounded-lg border px-4 py-2.5 text-[13px] ${i === 3 ? 'border-bad-line bg-bad-bg' : ''}`}>
              <span className="min-w-0 flex-1">{tt}</span>{nut}
            </div>
          ))}
        </div>
      </Muc>

      <Muc so={8} ten="Rỗng · lỗi tải · chỉ xem">
        <div className="grid grid-cols-3 items-start gap-4 max-[1100px]:grid-cols-1">
          <div className="card"><Empty title="Không còn việc quá hạn" hint="7 việc hạn tuần này đang ở nhóm dưới." /></div>
          <div className="card p-4"><ErrorState message="Không tải được danh sách." hint="Kiểm tra mạng rồi bấm Tải lại. Dữ liệu đã lưu không mất." onRetry={() => undefined} /></div>
          <div className="card flex flex-col gap-2.5 p-4"><DaiChiXem>Chỉ xem · QL Nguyễn Khánh Vy xem việc của cô Hà</DaiChiXem><span className="text-sm">Nút động từ ẩn; chỉ hiện "Làm thay" nếu quyền máy chủ cho phép (brief 7).</span></div>
        </div>
      </Muc>
    </div>
  );
}
