import { useState, type ReactNode } from 'react';
import type { DinhNghiaCot } from '@shared/domain/index.ts';
import { Bang } from '../../ui/Bang.tsx';
import { ODiem } from '../../ui/ODiem.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { ChipHan, Nhan, NhanKq, NhanLich } from '../../ui/Nhan.tsx';
import { TyLe } from '../../ui/TyLe.tsx';
import { LOP_OSO } from '../../ui/SoLieu.tsx';
import { DaiChiXem, Empty, ErrorState, NhanGiaTri, OChiSo } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { luuRoiTiep, nhanHan, nhanThangDuKien } from '@shared/domain/index.ts';
import { KhungPanel, NhapViec, KhungTaiCho, Truong, useNhap, useXoaNhap } from '../../ui/KhungPanel.tsx';
import { BoiCanh, ChuLuu, type TtLuu } from '../../ui/KhuonViec.tsx';
import { ONgay } from '../../ui/ONgay.tsx';

/**
 * BẢNG MẪU V5 (NEN-V5, 08 mục 6) — bản web của `thiet-ke/v5/bang-mau.html`, dựng bằng THÀNH PHẦN THẬT (token `index.css`, `Nhan*`, `ChipSos`,
 * `Bang` / `ODiem`, `OChiSo`, `TyLe`, `OSo`). Chủ SP duyệt bằng ảnh cặp mockup | web (`scripts/anh-cap.mjs`). Dữ liệu demo cố định, không gọi API.
 * Mục 7 (panel việc) dựng bằng khung panel thật (NEN-PANEL) — lưu giả lập, không gọi API.
 */

const Muc = ({ so, ten, children, ghi }: { so: number; ten: ReactNode; children: ReactNode; ghi?: ReactNode }) => (
  <section className="flex flex-col gap-3" aria-labelledby={`v5-m${so}`}>
    <h2 id={`v5-m${so}`} className="m-0 flex items-baseline gap-2.5 text-lg font-bold text-slate-100">
      <span className="tabular-nums text-[color:var(--hong-chu)]">{so}</span><span>{ten}</span>
      {/* P1 (chủ SP 22/10): câu giải thích không nằm trên màn — mở bằng ⓘ. */}
      {ghi && <NutLuat label="Giải thích">{ghi}</NutLuat>}
    </h2>
    {children}
  </section>
);

const O_MAU: Array<[string, string, string?]> = [
  ['Nền đọc', '--surface'], ['Nền trang', '--bg'], ['Đầu bảng, ô phụ', '--surface-2'], ['Thanh điều hướng', '--dieu-huong-nen'],
  ['Nút chính, link', '--accent'], ['Đang chọn / đang mở', '--accent-soft', 'vạch'], ['Điểm nhấn (không chữ)', '--hong'], ['Hồng khi là chữ', '--hong-chu'],
  ['⚠ Lỗi · quá hạn · ✗', 'rgb(var(--bad-rgb))'], ['⚠ Sắp hạn · chú ý', 'rgb(var(--soon-rgb))'], ['✓ Đạt · đã lưu', 'rgb(var(--ok-rgb))'],
  ['– Thiếu dữ liệu', '--surface-2', 'dut'], ['Lịch thi', '--lich-nen'],
];
const HOM_NAY = '2026-09-14';
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
    kq: <NhanKq kq="dat">Đạt</NhanKq>, thi: <NhanLich loai="du-kien">{nhanThangDuKien('2027-02')}</NhanLich>,
    viec: <span className="flex flex-col items-start gap-1"><NutViec>Nhập điểm L · MT3</NutViec>{khac('+ Ghi kết quả PA · R (Lê Minh Khoa)')}</span> },
  { id: 2, ten: 'Trần Thu Hà', target: '6.0', l: ['5.5', 'bang'], r: ['5.5', 'bang'], w: ['5.5', 'bang', 'W1 5.5 · W2 5.5'], s: ['5.0', 'duoi'], ovr: ['5.5', 'bang'],
    kq: <NhanKq kq="dat">Đạt</NhanKq>, thi: <NhanLich loai="du-kien">{nhanThangDuKien('2027-01')}</NhanLich>,
    viec: <Nhan tone="muted">Chờ QL duyệt · dời MT3 S</Nhan> },
  { id: 3, ten: 'Lê Quang Huy', target: '6.5', l: ['6.0', 'bang'], r: ['5.0', 'duoi'], w: ['5.5', 'duoi', 'W1 5.0 · W2 5.5'], s: ['6.0', 'bang'], ovr: ['5.5', 'duoi'],
    kq: <span className="flex flex-wrap gap-1"><NhanKq kq="chua-dat">Chưa đạt</NhanKq><ChipSos muc={2} kyNang={['R', 'W']} dot="MT2" tinh /></span>, thi: <NhanLich loai="chua">Chưa có lịch</NhanLich>,
    viec: <span className="flex flex-col items-start gap-1"><NutViec>Ghi kết quả PA · R</NutViec><NutViec>Xử lý vi phạm</NutViec>{khac('+ Ghi kết quả PA · W (Lê Minh Khoa)')}</span> },
  { id: 4, ten: 'Phạm Bảo Ngọc', target: '7.0', l: ['6.5', 'bang'], r: ['7.0', 'vuot'], w: ['6.5', 'bang', 'W1 6.5 · W2 6.5'], s: ['6.5', 'bang'], ovr: ['6.5', 'bang'],
    kq: <NhanKq kq="dat">Đạt</NhanKq>, thi: <NhanLich loai="du-kien">{nhanThangDuKien('2027-03')}</NhanLich>,
    viec: <span className="flex flex-col items-start gap-1"><NutViec>Xử lý vi phạm</NutViec><Nhan tone="late">Quá hạn 1 ngày</Nhan></span> },
  { id: 5, ten: 'Tô Ngọc Hân', target: '6.0', l: ['5.5', 'bang'], r: ['6.0', 'vuot'], w: ['5.5', 'bang', 'W1 5.5 · W2 5.5'], s: [null, null, 'Vắng'], ovr: [null, null],
    kq: <NhanKq kq="thieu">Chưa đủ dữ liệu</NhanKq>, thi: <NhanLich loai="chua">Chưa có lịch</NhanLich>, viec: khac('Không có việc của tôi') },
  { id: 6, ten: 'Dương Minh Quân', phuTen: 'UB FT 401', target: '7.0', l: ['—', null], r: ['—', null], w: ['—', null, ''], s: [null, null], ovr: [null, null],
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
      </header>

      <Muc so={1} ten="Màu PISA từ logo" ghi={<>Xanh logo = cấu trúc (thanh điều hướng, nút chính, link, focus, đang chọn) · hồng logo = điểm nhấn nhận diện (vạch menu đang mở, mốc "tuần này", dấu "của tôi") — <b>hồng không bao giờ nghĩa là lỗi hay SOS</b>.</>}>
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
          <HangBd ten="Mức SOS" phu="viền mảnh · viền dày + nền · nền đặc">
            <ChipSos muc={1} kyNang={['S']} dot="MT2" tinh /><ChipSos muc={2} kyNang={['R', 'W']} dot="MT2" tinh />
            <ChipSos muc={3} kyNang={['L', 'R', 'W']} dot="MT2" tinh /><ChipSos muc={2} tam dot="MT2" tinh />
          </HangBd>
          <HangBd ten="Trạng thái lịch thi" phu="nền đặc · góc vuông">
            <NhanLich loai="co">Ngày thi 10/10</NhanLich><NhanLich loai="du-kien">{nhanThangDuKien('2026-11')}</NhanLich><NhanLich loai="chua">Chưa có lịch</NhanLich>
            <NhanLich loai="da-thi">Đã thi · chờ KQ</NhanLich><NhanLich loai="co">Có KQ · chờ bước tiếp</NhanLich>
          </HangBd>
          <HangBd ten="Tiến độ xử lý" phu="viên tròn · chấm / ⚠">
            <Nhan tone="muted">Chờ duyệt</Nhan><Nhan tone="doing">Đang làm</Nhan><Nhan tone="ok">Xong</Nhan><Nhan tone="soon">{nhanHan('2026-09-14', HOM_NAY)}</Nhan>
            <Nhan tone="late">Quá hạn 2 ngày</Nhan><Nhan tone="muted">Chưa liên hệ được · lần 1</Nhan>
          </HangBd>
        </div>
      </Muc>

      <Muc so={4} ten="Bấm vào đâu thì ra gì">
        <div className="card">
          <div className="flex flex-wrap items-center gap-2.5 px-4 py-3.5">
            <button type="button" className="btn btn-primary">Ghi kết quả PA</button>
            <button type="button" className="btn">Chốt ngày</button><button type="button" className="btn">Nhập điểm</button><button type="button" className="btn">Ghi báo PH</button>
            <button type="button" className="btn btn-ghost text-[color:var(--accent)]">Đóng</button><button type="button" className="btn" disabled>Lưu</button>
          </div>
          
          <HangBd ten="Tên + ↗" phu="mở hồ sơ"><a href="#v5-m4" className="font-semibold text-slate-100 no-underline hover:underline">Nguyễn Minh An <span aria-hidden className="font-normal text-slate-500">↗</span></a></HangBd>
          <HangBd ten="Số gạch chân" phu="OSo"><SoBam>15/20</SoBam><span className="font-medium tabular-nums text-slate-500">0</span></HangBd>
          <HangBd ten="ⓘ" phu="giải thích"><NutLuat label="Giải thích Đạt MT">Đạt MT = Overall ≥ kỳ vọng của lượt.</NutLuat></HangBd>
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
              <OChiSo ten="Thi tháng này" giaTri="2" mau={<><SoBam>2</SoBam> HV · 09/2026</>} />
            </div>
            <div className="flex flex-wrap items-baseline gap-6 text-[13px]"><TyLe n={15} N={20} nhan="HV đủ dữ liệu" /><TyLe n={0} N={0} /></div>
          </div>
          <aside className="card overflow-hidden shadow-2xl" aria-label="Panel báo cáo">
            <div className="border-b px-5 pb-3 pt-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-500"><span className="h-[3px] w-3.5 rounded-sm bg-[color:var(--hong)]" />BÁO CÁO · CHỈ ĐỌC</div>
              <div className="flex items-start gap-2.5"><h3 className="m-0 flex-1 text-lg font-bold text-slate-100">Đạt MT2 · 75 % = 15/20</h3><button type="button" className="btn btn-sm btn-ghost" aria-label="Đóng">✕</button></div>
              <div className="mt-1 text-[13px] text-slate-400">Monbay · MB FT 101 · MT2 (W3 AUG) · số chốt lúc lưu MT2</div>
            </div>
            <div className="flex flex-col gap-4 px-5 py-4">
              <NhanGiaTri hang={[['Lớp', 'MB FT 101'], ['Lượt', 'MT2 · W3 AUG'], ['Kỳ vọng', 'Target − 0,5'], ['Cách tính', <NutLuat key="l" label="Cách tính">HV có Overall MT2 ≥ kỳ vọng của lượt / HV đủ 4 kỹ năng MT2. Không tính: HV chưa đủ dữ liệu, HV đã nghỉ.</NutLuat>]]} />
              <div className="flex flex-wrap items-baseline gap-6 tabular-nums">
                <span><b className="text-2xl">15</b> <span className="text-slate-400">đạt</span></span><span><b className="text-2xl">5</b> <span className="text-slate-400">chưa đạt</span></span>
                <span><b className="text-2xl text-slate-500">2</b> <span className="text-slate-400">chưa đủ dữ liệu (ngoài mẫu)</span></span>
              </div>
            </div>
          </aside>
        </div>
      </Muc>

      <Muc so={7} ten="Panel việc · bối cảnh · form · lịch sử gập · trạng thái lưu"
        ghi={<>Khung thật (<code>KhungPanel</code>, NEN-PANEL): dòng loại, bối cảnh nhãn / giá trị, chân lưu. <b>Lưu</b> ở lại panel; <b>Lưu và tiếp</b> chỉ sang việc kế sau khi lưu xong, lỗi thì ở lại và giữ chữ. Chữ đang gõ giữ ở máy theo khoá việc; ✕ khi còn chữ → hộp &quot;Bỏ chữ đang gõ?&quot;. Không tự chuyển theo giờ.</>}>
        <div className="grid grid-cols-[480px_minmax(0,1fr)] items-start gap-4 max-[1100px]:grid-cols-1">
          <KhungTaiCho.Provider value>
            <NhapViec khoa="dev:bao-ph-yen"><PanelViecMau /></NhapViec>
          </KhungTaiCho.Provider>
          <div className="card flex flex-col gap-2.5 px-4 py-3.5">
            <b className="text-sm">Trạng thái ở chân panel — cùng một chỗ, chữ + ký hiệu</b>
            {([
              ['nhap', <><button type="button" className="btn btn-sm">Lưu</button><button type="button" className="btn btn-sm btn-primary">Lưu và tiếp</button></>],
              ['dang', <><button type="button" className="btn btn-sm" disabled>Lưu</button><button type="button" className="btn btn-sm btn-primary" disabled>Lưu và tiếp</button></>],
              ['da', <><button type="button" className="btn btn-sm">Đóng</button><button type="button" className="btn btn-sm btn-primary">Việc kế: Báo PH · Lý Tuấn Bình</button></>],
              ['loi', <button type="button" className="btn btn-sm btn-primary">Thử lại</button>],
            ] as const).map(([tt, nut]) => (
              <div key={tt} className={`flex flex-wrap items-center gap-2.5 rounded-lg border px-4 py-2.5 text-[13px] ${tt === 'loi' ? 'border-bad-line bg-bad-bg' : ''}`} style={tt === 'loi' ? undefined : { borderColor: 'var(--line)' }}>
                <span className="min-w-0 flex-1"><ChuLuu tt={tt} luc="10:42" loi="mất mạng" /></span>{nut}
              </div>
            ))}
          </div>
        </div>
      </Muc>

      <Muc so={8} ten="Rỗng · lỗi tải · chỉ xem">
        <div className="grid grid-cols-3 items-start gap-4 max-[1100px]:grid-cols-1">
          <div className="card"><Empty title="Không còn việc quá hạn" hint="7 việc còn hạn ở nhóm dưới." /></div>
          <div className="card p-4"><ErrorState message="Không tải được danh sách." hint="Kiểm tra mạng rồi bấm Tải lại. Dữ liệu đã lưu không mất." onRetry={() => undefined} /></div>
          <div className="card flex flex-col gap-2.5 p-4"><DaiChiXem>Chỉ xem · QL Nguyễn Khánh Vy xem việc của cô Hà</DaiChiXem></div>
        </div>
      </Muc>
    </div>
  );
}

/** Mục 7: panel việc Báo PH (TVV Hương mở việc của em Yến) — khung thật, lưu giả lập 600 ms, "Lưu và tiếp" chỉ sau khi lưu xong. */
function PanelViecMau() {
  const [kq, setKq] = useNhap('kq', 'da-bao');
  const [ngay, setNgay] = useNhap('ngay', HOM_NAY);
  const [ghiChu, setGhiChu] = useNhap('ghi-chu', '');
  const xoaNhap = useXoaNhap();
  const [tt, setTt] = useState<TtLuu | null>(null);
  const [mat, setMat] = useState(false);
  const daGo = !!ghiChu.trim() || kq !== 'da-bao' || ngay !== HOM_NAY;
  const luu = () => new Promise<boolean>((xong) => {
    setTt('dang');
    setTimeout(() => {
      if (mat) { setTt('loi'); xong(false); return; }
      xoaNhap(); setTt('da'); xong(true);
    }, 600);
  });
  const trangThai: TtLuu | null = tt ?? (daGo ? 'nhap' : null);
  return (
    <KhungPanel tieuDe="Báo PH · Ngô Hải Yến" loai="VIỆC · BÁO PH" onDong={() => undefined}
      dau={{ dong2: ['CP FT 110', 'Lần 1', <ChipHan key="h" loai="phoi-hop" han="2026-09-16" />] }}
      chan={{
        huy: null, daSua: daGo && tt !== 'da',
        trai: trangThai && <ChuLuu tt={trangThai} luc="10:42" loi="mất mạng" />,
        phu: tt === 'loi' ? null : <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void luu()}>Lưu</button>,
        chinh: tt === 'loi'
          ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => void luu()}>Thử lại</button>
          : <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void luuRoiTiep(luu, () => { setGhiChu(''); setKq('da-bao'); setNgay(HOM_NAY); setTt(null); })}>Lưu và tiếp</button>,
      }}>
      <div className="flex flex-col gap-4 pt-4">
        <BoiCanh dong={[
          ['GVCN ghi', 'Report 1 · nghỉ không phép 2 buổi (10/09, 12/09)'],
          ['Người ghi', 'Ngô Bảo Nam · 14/09 10:00'],
          ['Liên hệ PH', <span key="p" className="tabular-nums">Mẹ · 0912 *** 418</span>],
        ]} />
        {/* Mockup `.lua-chon`: nút radio thật (một nhóm, ↑ ↓ đổi), mục chọn viền + nền nhấn. */}
        <Truong nhan="Kết quả" as="div">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kết quả">
            {([['da-bao', 'Đã báo PH'], ['chua-lien-he', 'Chưa liên hệ được']] as const).map(([v, chu]) => (
              <label key={v} className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3.5 text-sm max-sm:min-h-[44px] ${kq === v ? 'font-semibold text-[color:var(--accent)] shadow-[inset_0_0_0_1px_var(--accent)]' : ''}`}
                style={kq === v ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : { borderColor: 'var(--o-nhap-vien)' }}>
                <input type="radio" name="dev-bao-ph-kq" checked={kq === v} onChange={() => setKq(v)} className="accent-[color:var(--accent)]" />{chu}
              </label>
            ))}
          </div>
        </Truong>
        <Truong nhan="Ngày"><div className="max-w-[220px]"><ONgay kieu="ngay" value={ngay} onChange={setNgay} toiDa={HOM_NAY} /></div></Truong>
        <Truong nhan="Ghi chú kết quả">
          <textarea className="field w-full" rows={3} value={ghiChu} placeholder="Ví dụ: Đã gọi mẹ em Yến, mẹ biết và sẽ nhắc em." onChange={(e) => { setGhiChu(e.target.value); setTt(null); }} />
        </Truong>
        <label className="flex items-center gap-2 text-[13px] text-slate-400"><input type="checkbox" checked={mat} onChange={(e) => setMat(e.target.checked)} /> Giả lập mất mạng khi lưu</label>
        <details className="border-t pt-3" style={{ borderColor: 'var(--line)' }}>
          <summary className="cursor-pointer text-sm font-semibold text-slate-400">Lịch sử (2)</summary>
          <NhanGiaTri className="mt-2 text-[13px]" hang={[['14/09 10:00', 'Ngô Bảo Nam lưu xử lý Report 1 → tạo việc Báo PH'], ['12/09 18:20', 'Ngô Bảo Nam ghi vi phạm lần 2 (nghỉ không phép)']]} />
        </details>
      </div>
    </KhungPanel>
  );
}
