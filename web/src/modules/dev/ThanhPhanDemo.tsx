import { useState, type ReactNode } from 'react';
import { BoLocDoan, Card, Empty, ErrorState, Forbidden, NhanTrangThai, NutChon, Skeleton } from '../../ui/ui.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { WeekPicker } from '../../ui/Filters.tsx';
import { Han } from '../../ui/Han.tsx';
import { Nhan, QuaHan, type ToneNhan } from '../../ui/Nhan.tsx';
import { HangCon, HangNhom, KhoiNhom } from '../../ui/HangNhom.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { KetQuaDot } from '../../ui/KetQuaDot.tsx';
import { TyLe } from '../../ui/TyLe.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { addDaysStr } from '../../lib/format.ts';
import { DEADLINE_KINDS, KIEU_O_NGAY, TRANG_THAI, type KieuONgay } from '@shared/domain/index.ts';

/**
 * TRANG THỬ THÀNH PHẦN DÙNG CHUNG — chỉ có khi chạy `npm run dev` (PR-E Step 9, đóng DS18).
 *
 * Địa chỉ: `/dev/thanh-phan`. Không có trong bản dựng thật (`vite build`): route được gắn theo
 * `import.meta.env.DEV`. Trang này là chỗ DUY NHẤT nhìn được một component ở đủ sáu trạng thái
 * mà không phải dựng dữ liệu thật — không có nó thì nghiệm thu mục 15.3 không làm được.
 *
 * SÁU TRẠNG THÁI MỖI THÀNH PHẦN: rỗng · một bản ghi · nhiều · tên dài · lỗi tải · không quyền.
 * Hai trạng thái cuối không phải việc của component nhỏ (nó không tự tải gì) mà của KHỐI chứa
 * nó — nên ô hiện đúng `ErrorState` / `Forbidden` chuẩn, để người viết màn mới biết chúng
 * trông thế nào và không tự chế bản khác.
 */

// ---------------------------------------------------------------- bằng chứng lúc dựng

/**
 * Hai dòng dưới đây KHÔNG BAO GIỜ được chạy — chúng tồn tại để `tsc` kiểm.
 * Nếu `loai` thôi bắt buộc, hoặc `<TyLe>` nhận thêm prop xếp hạng, `@ts-expect-error` sẽ báo
 * "unused" và `npm run typecheck` gãy. Đó là cách biến "không được sai" thành "không dựng được".
 */
export function KiemTraLucDung() {
  return (
    <>
      {/* @ts-expect-error — thiếu `loai` PHẢI là lỗi biên dịch, không phải cảnh báo lúc chạy */}
      <Han han="2026-09-23" />
      {/* @ts-expect-error — <TyLe> không nhận prop xếp hạng: rule book §11 cấm xếp hạng bằng tỷ lệ thô */}
      <TyLe n={1} N={2} xepHang />
    </>
  );
}

// ---------------------------------------------------------------- khung

function Cell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border p-3 min-w-0" style={{ borderColor: 'var(--line)' }}>
      <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/** Bốn ô do component quyết định + hai ô do khối chứa quyết định. */
function SixStates({ empty, one, many, long }: {
  empty: ReactNode; one: ReactNode; many: ReactNode; long: ReactNode;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Cell title="1 · Rỗng">{empty}</Cell>
      <Cell title="2 · Một bản ghi">{one}</Cell>
      <Cell title="3 · Nhiều bản ghi">{many}</Cell>
      <Cell title="4 · Tên dài">{long}</Cell>
      <Cell title="5 · Lỗi tải (khối chứa)"><ErrorState message="Không tải được dữ liệu" hint="Thử lại sau ít phút." onRetry={() => undefined} /></Cell>
      <Cell title="6 · Không quyền (khối chứa)"><Forbidden message="Bạn không có quyền xem phần này" hint="Phạm vi của tài khoản không gồm lớp này." /></Cell>
    </div>
  );
}

export default function ThanhPhanDemo() {
  const { homNay, nhan } = useNgayNghiepVu();
  const d = (n: number) => addDaysStr(homNay, n);
  const [p1, setP1] = useState<number | null>(null);
  const [p2, setP2] = useState<number | null>(null);
  const [p3, setP3] = useState<number | null>(null);
  const [p4, setP4] = useState<number | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [ngay, setNgay] = useState<Record<KieuONgay, string | null>>({ ngay: null, tuan: null, thang: null, 'ngay-hoac-thang': null });
  const [lyDo, setLyDo] = useState<'muon' | 'vang' | 'khac'>('muon');
  const [ghiRo, setGhiRo] = useState('');
  const [loc, setLoc] = useState<'tat-ca' | 'mo' | 'dong'>('tat-ca');
  const [modal, setModal] = useState(false);
  const [panel, setPanel] = useState<'dong' | 'hep' | 'rong' | 'hai'>('dong');
  const [moNhom, setMoNhom] = useState<Record<string, boolean>>({ a: true, b: false });

  return (
    <div className="max-w-[1100px] space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-100 m-0">Thành phần dùng chung — trang thử</h1>
        <p className="text-xs text-slate-500 mt-1">
          Chỉ có khi chạy <code>npm run dev</code>. Ngày nghiệp vụ hôm nay: <strong>{homNay}</strong>.
          Chụp trang này sang thang xám: mọi trạng thái vẫn phải đọc được (không tín hiệu nào chỉ bằng màu).
        </p>
      </div>

      {/* ------------------------------------------------------------ <Han> */}
      <Card title="<Han> — mọi hạn đều có loại">
        <SixStates
          empty={<Han loai="nhap-diem" han={null} coViec />}
          one={<Han loai="nhap-diem" han={d(9)} coViec />}
          many={<>{DEADLINE_KINDS.map((k) => <div key={k}><Han loai={k} han={d(9)} coViec /></div>)}</>}
          long={<Han loai="lap-pa" han={d(3)} tienTo="Thi W3 SEP tuần Speaking của lớp Fast Track MB FT 101"
            ghiChu="hạn riêng cả đợt do quản lý chi nhánh đặt" />}
        />
        <div className="grid gap-3 sm:grid-cols-2 mt-3">
          <Cell title="Quá hạn — đếm từ hạn gốc">
            <div><Han loai="nhap-diem" han={d(-2)} coViec /></div>
            <div><Han loai="nhap-diem" han={d(7)} hanGoc={d(-2)} coViec /></div>
            <div><Han loai="cap-nhat-pa" han={d(-8)} coViec /></div>
            <div><Han loai="nhap-diem" han={d(0)} coViec /></div>
          </Cell>
          <Cell title="Hẹn xử lý — hiện cả hai, không ghi đè hạn gốc">
            <div><Han loai="nhap-diem" han={d(9)} hen={d(16)} coViec /></div>
            <div><Han loai="nhap-diem" han={d(-1)} hen={d(6)} coViec /></div>
          </Cell>
          <Cell title="Dự kiến kết thúc — KHÔNG phải hạn, không bao giờ đỏ">
            <div><Han loai="du-kien-ket-thuc" han={d(-15)} /></div>
            <div><Han loai="du-kien-ket-thuc" han={d(20)} /></div>
          </Cell>
        </div>
      </Card>

      {/* ------------------------------------------------------------ PR-UX0: Nhan · QuaHan · hàng lớn/nhỏ · KhungPanel */}
      <Card title="Nền giao diện — Nhan · QuaHan · hàng lớn/nhỏ · khuôn panel">
        <div className="grid gap-3 sm:grid-cols-2">
          <Cell title="Nhan — bảy màu nghĩa + viền đứt (số tạm)">
            <div className="flex flex-wrap gap-1.5">
              {(['ok', 'done', 'bad', 'soon', 'doing', 'muted'] as ToneNhan[]).map((t) => <Nhan key={t} tone={t}>{t}</Nhan>)}
              <Nhan tone="muted" dut>tạm thời</Nhan>
              <Nhan tone="soon" onClick={() => undefined}>bấm được</Nhan>
            </div>
          </Cell>
          <Cell title="QuaHan + hạn — chữ, không nền, không khung">
            <div><QuaHan ngay={15} /> · <QuaHan ngay={3} gon /></div>
            <div><Han loai="cap-nhat-pa" han={d(-15)} coViec /></div>
          </Cell>
        </div>
        <div className="mt-3 overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--line)' }}>
          <table className="w-full min-w-[560px] table-fixed text-sm">
            <thead><tr><th className="th">Học viên</th><th className="th text-right">Điểm</th><th className="th text-right">Case</th></tr></thead>
            {(['a', 'b'] as const).map((k) => (
              <tbody key={k}>
                <HangNhom mo={moNhom[k]} onMo={() => setMoNhom((s2) => ({ ...s2, [k]: !s2[k] }))} nhan={`lớp ${k.toUpperCase()}`}
                  tieuDe={`Lớp ${k.toUpperCase()} · 12 HV`}>
                  <td className="px-3 text-right tabular-nums">7.5</td><td className="px-3 text-right tabular-nums">3</td>
                </HangNhom>
                {moNhom[k] && ['Nguyễn Văn An', 'Trần Thu Hà'].map((ten, i) => (
                  <HangCon key={ten}><td className="td">{ten}</td><td className="td text-right tabular-nums">{6 + i}.5</td><td className="td text-right tabular-nums">{i}</td></HangCon>
                ))}
              </tbody>
            ))}
          </table>
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line)' }}>
          <KhoiNhom id="demo-khoi" mo={moNhom.a} onMo={() => setMoNhom((s2) => ({ ...s2, a: !s2.a }))} nhan="Nhập điểm" tieuDe="Nhập điểm" dem={2}
            phu={<span className="font-bold text-late">⚠ 1 quá hạn</span>}>
            <div className="py-2 pr-3 text-xs">Dòng việc mẫu <QuaHan ngay={4} /></div>
          </KhoiNhom>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn" onClick={() => setPanel('hep')}>Mở panel hẹp (560px)</button>
          <button type="button" className="btn" onClick={() => setPanel('rong')}>Mở panel rộng (720px)</button>
        </div>
      </Card>

      {panel !== 'dong' && (
        <KhungPanel tieuDe={panel === 'hai' ? 'Panel thứ hai' : 'Panel mẫu'} hocVien="Nguyễn Văn An" lop="MB FT 101"
          rong={panel === 'rong' ? 'rong' : 'hep'} onDong={() => setPanel('dong')}
          ngCanh="Ngữ cảnh một dòng, cắt nếu quá dài…"
          chan={{ xoa: { onClick: () => undefined }, phu: <button type="button" className="btn" onClick={() => setPanel('hai')}>Mở panel thứ hai</button>,
            chinh: <button type="button" className="btn btn-primary" onClick={() => setPanel('dong')}>Lưu</button>, conThieu: [{ nhan: 'Mã lớp', oId: 'o-ma-lop' }] }}>
          <Khoi tieuDe="Thông tin chung" luat="Luật dài nằm trong ⓘ, không thành khối chữ dưới ô.">
            <Hang2>
              <Truong nhan="Mã lớp" batBuoc phu="Ví dụ: MB FT 101" loi="Chưa điền"><input id="o-ma-lop" aria-invalid className="field" defaultValue="" /></Truong>
              <Truong nhan="Lộ trình"><select className="field"><option>LT1</option><option>LT2</option></select></Truong>
            </Hang2>
            <Truong nhan="Ghi chú" tuyChon><textarea className="field" rows={3} /></Truong>
          </Khoi>
          <Khoi tieuDe="Khối thứ hai">
            <Truong nhan="Ví dụ dài để thân cuộn"><textarea className="field" rows={14} /></Truong>
          </Khoi>
        </KhungPanel>
      )}

      {/* ------------------------------------------------------------ <KetQuaDot> */}
      <Card title="<KetQuaDot> — một câu duy nhất cho tiến độ một đợt Test">
        <SixStates
          empty={<KetQuaDot coDiem={0} yeuCau={4} dat={null} sos={null} />}
          one={<KetQuaDot coDiem={4} yeuCau={4} dat sos={0} />}
          many={
            <>
              <div><KetQuaDot coDiem={2} yeuCau={4} dat={null} sos={0} /></div>
              <div><KetQuaDot coDiem={2} yeuCau={4} dat={null} sos={1} /></div>
              <div><KetQuaDot coDiem={4} yeuCau={4} dat={false} sos={2} /></div>
              <div><KetQuaDot coDiem={4} yeuCau={4} dat={null} sos={null} /></div>
            </>
          }
          long={<KetQuaDot coDiem={3} yeuCau={4} dat={null} sos={3} />}
        />
        <div className="grid gap-3 sm:grid-cols-2 mt-3">
          <Cell title="MT-P01 — ÉP coDiem=1, yeuCau=4, dat=true: KHÔNG được có badge đạt">
            <div><KetQuaDot coDiem={1} yeuCau={4} dat sos={0} /></div>
            <div>Ô Overall: <KetQuaDot coDiem={1} yeuCau={4} dat sos={0} phan="overall" /></div>
          </Cell>
          <Cell title="MT-P02 — đếm bằng bài nhập (1/5) bị chặn, không vẽ ra">
            <div><KetQuaDot coDiem={1} yeuCau={5} dat={null} sos={null} /></div>
          </Cell>
        </div>
      </Card>

      {/* ------------------------------------------------------------ <TyLe> */}
      <Card title="<TyLe> — phần trăm không đứng một mình">
        <SixStates
          empty={<TyLe n={0} N={0} nhan="PA có cải thiện" />}
          one={<TyLe n={1} N={1} />}
          many={
            <>
              <div><TyLe n={12} N={18} nhan="PA có cải thiện" /></div>
              <div><TyLe n={4} N={5} /></div>
              <div><TyLe n={3} N={4} /></div>
              <div><TyLe n={0} N={7} /></div>
            </>
          }
          long={<TyLe n={12} N={18} nhan="phương án hỗ trợ kết thúc có cải thiện ở kỹ năng Listening của lớp Fast Track" />}
        />
        <div className="mt-3">
          <Cell title="Số vô lý (n > N) — báo lỗi thay vì vẽ phần trăm">
            <div><TyLe n={5} N={3} /></div>
          </Cell>
        </div>
      </Card>

      {/* ------------------------------------------------------------ ngày nghiệp vụ */}
      <Card title="useNgayNghiepVu — ngày nghiệp vụ và ngày ghi nhận">
        <div className="grid gap-3 sm:grid-cols-2">
          <Cell title="Khác ngày — hiện cả hai">
            <div className="text-sm text-slate-200">{nhan(d(0), addDaysStr(homNay, 5) + 'T10:00:00Z')}</div>
          </Cell>
          <Cell title="Cùng ngày — một ngày">
            <div className="text-sm text-slate-200">{nhan(d(0), d(0) + 'T03:00:00Z')}</div>
          </Cell>
        </div>
      </Card>

      {/* ------------------------------------------------------------ WeekPicker */}
      <Card title="Bộ chọn tuần — một hàng, popover không bị cắt">
        <div className="grid gap-4">
          <Cell title="Panel rộng ~600px">
            <div style={{ maxWidth: 600 }}><WeekPicker periodId={p1} onPeriod={setP1} label="Tuần MT" scope="planning" /></div>
          </Cell>
          <Cell title="Panel hẹp ~300px (chỉ 'Tuần này' được xuống hàng)">
            <div style={{ maxWidth: 300 }}><WeekPicker periodId={p2} onPeriod={setP2} label="Tuần khai giảng" scope="planning" /></div>
          </Cell>
          <Cell title="Cho bỏ trống (clearable) — chưa chọn thì ghi 'Chưa xác định'">
            <div style={{ maxWidth: 600 }}><WeekPicker periodId={p3} onPeriod={setP3} label="Dự kiến thi" scope="planning" clearable /></div>
          </Cell>
          <Cell title="Trong panel và hộp thoại — popover phải nổi lên trên, không bị cắt">
            <div className="flex gap-2">
              <button type="button" className="btn" onClick={() => setDrawer(true)}>Mở trong panel</button>
              <button type="button" className="btn" onClick={() => setModal(true)}>Mở trong hộp thoại</button>
            </div>
          </Cell>
        </div>
      </Card>

      {drawer && (
        <KhungPanel tieuDe="Bộ chọn tuần trong panel" onDong={() => setDrawer(false)}>
          <div className="pt-3">
            <WeekPicker periodId={p4} onPeriod={setP4} label="Tuần" scope="planning" />
            <p className="text-xs text-slate-500 mt-3">Bấm vào trường tuần: lịch phải hiện đủ, kể cả khi panel cuộn hoặc hẹp.</p>
          </div>
        </KhungPanel>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Bộ chọn tuần trong hộp thoại" width="max-w-md">
        <WeekPicker periodId={p4} onPeriod={setP4} label="Tuần" scope="planning" />
        <p className="text-xs text-slate-500 mt-3">Nhấn Esc khi lịch đang mở: chỉ lịch đóng, hộp thoại vẫn còn.</p>
      </Modal>

      {/* ------------------------------------------------------------ PR-NEN: ô ngày · Khác · đang chọn · bộ lọc · 6 nhãn */}
      <Card title="Ô ngày · Khác · đang chọn · bộ lọc · nhãn trạng thái">
        <div className="grid gap-3 sm:grid-cols-2">
          <Cell title="ONgay — bốn kiểu (gõ dd/mm/yyyy hoặc bấm lịch)">
            {KIEU_O_NGAY.map((k) => (
              <label key={k} className="block">
                <span className="mb-1 block text-[11.5px] font-bold text-slate-200">{{ ngay: 'Ngày', tuan: 'Tuần', thang: 'Tháng', 'ngay-hoac-thang': 'Ngày hoặc tháng' }[k]}</span>
                <ONgay kieu={k} value={ngay[k]} onChange={(iso) => setNgay((s2) => ({ ...s2, [k]: iso }))} />
              </label>
            ))}
          </Cell>
          <Cell title="NutChon + OKhac — chọn Khác thì hiện Ghi rõ (≥ 3 ký tự)">
            <div className="flex flex-wrap gap-1.5">
              {([['muon', 'Đi muộn'], ['vang', 'Vắng không phép'], ['khac', 'Khác']] as const).map(([k, t]) => (
                <NutChon key={k} chon={lyDo === k} onClick={() => setLyDo(k)}>{t}</NutChon>
              ))}
            </div>
            <OKhac hien={lyDo === 'khac'} value={ghiRo} onChange={setGhiRo} />
          </Cell>
          <Cell title="BoLocDoan — một kiểu cho mọi bộ lọc">
            <BoLocDoan ariaLabel="Lọc mẫu" value={loc} onChange={setLoc}
              muc={[{ key: 'tat-ca', nhan: 'Tất cả', so: 12 }, { key: 'mo', nhan: 'Đang mở', so: 5 }, { key: 'dong', nhan: 'Đã đóng', so: 7 }]} />
          </Cell>
          <Cell title="NhanTrangThai — sáu nhãn">
            <div className="flex flex-wrap gap-1.5">
              {TRANG_THAI.map((t) => <NhanTrangThai key={t} t={t} soNgay={t === 'qua-han' ? 3 : null} />)}
            </div>
          </Cell>
        </div>
      </Card>

      {/* ------------------------------------------------------------ trạng thái chuẩn */}
      <Card title="Bốn trạng thái dữ liệu chuẩn (bắt buộc cho mọi khối đọc dữ liệu)">
        <div className="grid gap-3 sm:grid-cols-2">
          <Cell title="Đang tải"><Skeleton rows={3} /></Cell>
          <Cell title="Rỗng"><Empty title="Chưa có phương án hỗ trợ" hint="Giáo viên chủ nhiệm hoặc quản lý thêm phương án đầu tiên." /></Cell>
        </div>
      </Card>
    </div>
  );
}
