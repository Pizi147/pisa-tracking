import { useEffect, useState, type ReactNode } from 'react';
import { deltaE, moPhongMuMau, tronMau, tuongPhan, type RGB } from '@shared/domain/index.ts';
import { Card } from '../../ui/ui.tsx';
import { DauKetQua, lopKq } from '../../ui/BieuTuong.tsx';
import { SaveIndicator } from '../../ui/SaveState.tsx';
import { KhoiDaLuu, TrangThaiLuu } from '../../ui/KhuonViec.tsx';

/**
 * SÂN MẪU NỀN (NEN-TYPO-MAU, 04 mục 18): thang chữ · 3 màu kết quả + tương phản ĐO THẬT trên 9 nền · hệ trạng thái HTT · một cách báo lưu.
 * Đặt đầu `/dev/thanh-phan`. Chủ SP duyệt một lần bằng ảnh 1440 tối + 375 sáng; các PR màn sau dùng đúng các mẫu này.
 */

const CHUOI = 'Nguyễn Thị Phương Thảo · Đỗ Vũ Tuấn Phong · ỖNG ẶC ỮA ẪN ỄNH · khuỷu, nghiễm, chuyện, quyết · 6.5 7.0 · W2 OCT · 18/09';
const THANG: Array<[number, string, string]> = [
  [28, 'Số lớn (thẻ chỉ số, điểm Mock Test)', 'font-bold'],
  [22, 'Tiêu đề trang', 'font-bold'],
  [17, 'Tiêu đề khối / panel', 'font-bold'],
  [15, 'Chữ thường · ô bảng · nút · số điểm', ''],
  [14, 'Lưới dày (lưới điểm) · giá trị panel', ''],
  [13, 'Nhãn · đầu cột · chip · nút nhỏ', 'font-semibold'],
  [12, 'Tối thiểu: badge · dòng phụ ô điểm', ''],
];
const NEN = ['Trang', 'Thẻ', 'Thẻ phụ', 'Nút rê', 'Hàng nhóm', 'Hàng con', 'Hàng đã thi', 'Cột nổi bật', 'Hàng rê'];

/** Đọc token màu đang áp (đổi theo sáng / tối) → RGB; token có độ trong thì trộn lên `--surface`. */
function docMau(): Record<string, RGB> {
  const cs = getComputedStyle(document.documentElement);
  const v = (ten: string) => cs.getPropertyValue(`--${ten}`).trim();
  const so = (s: string): number[] => (s.match(/[\d.]+/g) ?? []).map(Number);
  const rgb = (s: string): RGB => (s.startsWith('#') ? [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)) : so(s).slice(0, 3)) as RGB;
  const the = rgb(v('surface'));
  const phu = (ten: string): RGB => { const n = so(v(ten)); return tronMau([n[0], n[1], n[2]], the, n[3] ?? 1); };
  return {
    vuot: rgb(v('kq-vuot-rgb')), bang: rgb(v('kq-bang-rgb')), duoi: rgb(v('kq-duoi-rgb')), chu: rgb(v('text')),
    'Trang': rgb(v('bg')), 'Thẻ': the, 'Thẻ phụ': rgb(v('surface-2')), 'Nút rê': rgb(v('nut-hover')), 'Hàng nhóm': rgb(v('hang-lon-bg')),
    'Hàng con': rgb(v('hang-con-bg')), 'Hàng đã thi': rgb(v('da-thi-bg-rgb')), 'Cột nổi bật': phu('accent-soft'), 'Hàng rê': phu('phu-re'),
  };
}

/** Đo lại khi đổi sáng / tối (thuộc tính `data-theme` của <html>). */
function useMau() {
  const [mau, setMau] = useState(docMau);
  useEffect(() => {
    const ob = new MutationObserver(() => setMau(docMau()));
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => ob.disconnect();
  }, []);
  return mau;
}

/** Mẫu ô điểm chỉ đọc: chỗ ký hiệu giữ cả khi không có ký hiệu (số thẳng cột). `ODiem` thật = PR BANG-0. */
function Diem({ kq, so, mau }: { kq: 'vuot' | 'bang' | 'duoi' | null; so: string; mau?: string }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <span className="inline-flex w-[14px]">{kq && <DauKetQua kq={kq} />}</span>
      <span className={`text-[15px] font-bold ${lopKq(kq)}`}>{so}</span>
      {mau && <span className="text-[13px] text-faint">{mau}</span>}
    </span>
  );
}

function Muc({ tieuDe, children }: { tieuDe: string; children: ReactNode }) {
  return <div className="min-w-0 space-y-2"><h3 className="m-0 text-[13px] font-semibold text-slate-400">{tieuDe}</h3>{children}</div>;
}

export function SanMauNen() {
  const mau = useMau();
  const [chon, setChon] = useState(1);
  const nen = (n: string) => ({ background: `rgb(${mau[n].join(' ')})` });
  return (
    <div id="san-mau-nen" className="space-y-6">
      <Card title="Thang chữ — 12 · 13 · 14 · 15 · 17 · 22 · 28 (không IN HOA)">
        <div className="space-y-3">
          {THANG.map(([co, vai, dam]) => (
            <div key={co} className="min-w-0">
              <div className="text-[13px] font-semibold text-slate-400"><span className="tabular-nums">{co} px</span> · {vai}</div>
              <div className={`truncate ${dam}`} style={{ fontSize: co }}>{CHUOI}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Màu kết quả điểm — tô chính con số, ✓ / ✗ trước số">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <Muc tieuDe="Mẫu (kỳ vọng 6.5)">
            <div className="grid grid-cols-[132px_minmax(0,1fr)] items-center gap-y-2 text-[15px]">
              <span className="text-slate-400">Vượt</span><Diem kq="vuot" so="7.0" />
              <span className="text-slate-400">Bằng (vẫn Đạt)</span><Diem kq="bang" so="6.5" />
              <span className="text-slate-400">Dưới</span><Diem kq="duoi" so="5.5" />
              <span className="text-slate-400">Chưa kỳ vọng</span><Diem kq={null} so="6.0" />
              <span className="text-slate-400">Đúng / tổng</span><Diem kq="duoi" so="17" mau="/25" />
              <span className="text-slate-400">Đúng / tổng</span><Diem kq="vuot" so="21" mau="/25" />
            </div>
          </Muc>
          <Muc tieuDe="Tương phản đo trên nền thật (cần ≥ 4,5)">
            <div className="table-scroll">
              <table className="w-full tabular-nums">
                <thead><tr>{['Nền', 'Vượt', 'Bằng', 'Dưới', 'Chữ'].map((x) => <th key={x} className="th">{x}</th>)}</tr></thead>
                <tbody>
                  {NEN.map((n) => (
                    <tr key={n}>
                      <td className="td whitespace-nowrap" style={nen(n)}>{n}</td>
                      {(['vuot', 'bang', 'duoi', 'chu'] as const).map((k) => {
                        const r = tuongPhan(mau[k], mau[n]);
                        return (
                          <td key={k} className="td" style={nen(n)}>
                            <span className={k === 'chu' ? '' : lopKq(k)}>{r.toFixed(2)}</span>{r < 4.5 && <span className="text-late"> ⚠</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="m-0 text-[13px] text-slate-400">
              Mù màu đỏ–lục, vượt ↔ dưới: deutan ΔE {deltaE(moPhongMuMau(mau.vuot, 'deutan'), moPhongMuMau(mau.duoi, 'deutan'))} (cần ≥ 10) ·
              protan ΔE {deltaE(moPhongMuMau(mau.vuot, 'protan'), moPhongMuMau(mau.duoi, 'protan'))} — luôn kèm ✓ / ✗.
            </p>
          </Muc>
        </div>
      </Card>

      <Card title="Trạng thái — rê chuột chỉ cho thứ bấm được · đang chọn · focus · tắt">
        <div className="grid gap-6 md:grid-cols-2">
          <Muc tieuDe="Hàng (rê chuột; Tab để thấy focus)">
            <table className="w-full">
              <tbody>
                {['Bấm được', 'Bấm được · đang chọn', 'Đã thi · đang chọn'].map((x, i) => (
                  <tr key={x} tabIndex={0} onClick={() => setChon(i)} onKeyDown={(e) => { if (e.key === 'Enter') setChon(i); }}
                    className={`bam ${i === 2 ? 'hang-da-thi' : ''} ${chon === i || i === 2 ? 'dang-mo' : ''}`} aria-current={chon === i || undefined}>
                    <td className="td">{x}</td><td className="td whitespace-nowrap tabular-nums">W2 OCT</td>
                  </tr>
                ))}
                <tr className="do-hang"><td className="td">Không bấm được · bảng dày (dò hàng)</td><td className="td whitespace-nowrap tabular-nums">W3 OCT</td></tr>
                <tr><td className="td">Không bấm được</td><td className="td whitespace-nowrap tabular-nums">W4 OCT</td></tr>
              </tbody>
            </table>
          </Muc>
          <Muc tieuDe="Nút">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn btn-primary">Lưu kết quả</button>
              <button type="button" className="btn">Thêm PA</button>
              <button type="button" className="btn btn-sm">Nhập</button>
              <button type="button" className="btn btn-ghost">Đóng</button>
              <button type="button" className="btn" disabled title="Lớp đã kết thúc">Duyệt</button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="nut-loc" aria-pressed="true">✓ Cần làm 4</button>
              <button type="button" className="nut-loc" aria-pressed="false">Tất cả 12</button>
            </div>
          </Muc>
        </div>
      </Card>

      <Card title="Báo lưu — một cách cho mọi ô / panel (đã lưu màu xám)">
        <div className="grid gap-6 md:grid-cols-2">
          <Muc tieuDe="Ô / dòng">
            <div className="flex flex-wrap items-center gap-4">
              <SaveIndicator status="saving" />
              <SaveIndicator status="saved" />
              <SaveIndicator status="error" error="Mất kết nối" onRetry={() => undefined} />
            </div>
          </Muc>
          <Muc tieuDe="Chân panel">
            <div className="flex items-center gap-2 text-[13px]"><TrangThaiLuu tt="nhap" onHuy={() => undefined} /></div>
            <div className="flex items-center gap-2 text-[13px]"><TrangThaiLuu tt="dang" /></div>
            <div className="flex items-center gap-2 text-[13px]"><TrangThaiLuu tt="loi" loi="mất kết nối" onThuLai={() => undefined} /></div>
            <KhoiDaLuu x={{ chu: 'Đã lưu kết quả', hoanTac: async () => undefined }} luc="14:32"
              nutChinh={<button type="button" className="btn btn-primary">Việc kế</button>} />
          </Muc>
        </div>
      </Card>
    </div>
  );
}
