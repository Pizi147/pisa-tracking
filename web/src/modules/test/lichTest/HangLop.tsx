import { Link } from 'react-router-dom';
import { HangCon, HangNhom } from '../../../ui/HangNhom.tsx';
import { Nhan } from '../../../ui/Nhan.tsx';
import { Han } from '../../../ui/Han.tsx';
import { chuOChuaLuu, tenMon, tenMonNgan } from '@shared/domain/index.ts';
import { TONE_NHAN_LOP, type LopLichTest } from './kieu.ts';
import { LuoiNhung } from './LuoiNhung.tsx';

/**
 * Một badge cho hàng lớp (N-3). "Đã chấm" thêm ✓ nhỏ, mảnh (G-1). Còn ô lưu hỏng trong lưới của lớp thì badge là
 * "n ô chưa lưu" (đỏ) — việc gấp hơn "của ai", và nhãn máy chủ tính trên điểm ĐÃ lưu nên không nói được điều này.
 */
function NhanLop({ l, chuaLuu = 0 }: { l: LopLichTest; chuaLuu?: number }) {
  if (chuaLuu > 0) return <Nhan tone="bad" title="Ô viền đỏ chưa lưu được — bấm Lưu lại ở ô đó.">{chuOChuaLuu(chuaLuu)}</Nhan>;
  return (
    <>
      <Nhan tone={TONE_NHAN_LOP[l.nhan.loai]}>
        {l.nhan.chu}
        {l.nhan.loai === 'da-cham' && <span className="ml-1 font-normal" aria-hidden>✓</span>}
      </Nhan>
      {/* PR-MT (YC-13.1): bài vắng tuần này đang chờ Quản lý duyệt dời lần 2 — dòng nhạt, không phải việc chấm. */}
      {l.choDuyetDoi > 0 && (
        <span className="block whitespace-nowrap text-[11px] text-wait" title="Đề nghị dời do vắng (từ lần 2) đang chờ Quản lý trả lời">
          {l.choDuyetDoi > 1 ? `${l.choDuyetDoi} bài ` : ''}vắng · chờ Quản lý duyệt dời
        </span>
      )}
    </>
  );
}

/** Bộ môn của lớp theo chương trình (FT L R W S · FOU L R G+V P · Pre FOU Tổng hợp) — môn không thi tuần này mờ đi (tooltip tên đủ, G-7). */
function KyNang({ l }: { l: LopLichTest }) {
  return (
    <span className="inline-flex gap-1.5 font-semibold tabular-nums">
      {l.boMon.map((k) => {
        const co = l.kyNangTuan.includes(k);
        const ten = tenMon(l.chuongTrinh, k);
        return (
          <span key={k} className={co ? 'text-slate-200' : 'text-slate-500'}
            title={co ? ten : `${ten} — không thi tuần này`}>
            {tenMonNgan(l.chuongTrinh, k)}
          </span>
        );
      })}
    </span>
  );
}

/** `.hang-lon > td` ép chữ đậm cho cả hàng; ô phụ (chi nhánh, hạn) về chữ thường cho dễ đọc. */
const THUONG = { fontWeight: 400 } as const;

const TienDo = ({ l }: { l: LopLichTest }) => (
  <span className="tabular-nums text-slate-200" title={`Đã chấm ${l.daCham} trong ${l.tong} bài của tuần này`}>
    {l.daCham}/{l.tong} <span className="text-[11px] font-normal text-slate-500">bài</span>
  </span>
);

/**
 * DANH SÁCH LỚP của một tab (PR-UX1, N-2): MỘT bảng, tiêu đề cột một lần; mỗi lớp một hàng lớn (`HangNhom`) thu gọn,
 * mở ra là lưới chấm tại chỗ trong `HangCon`. Cột cố định (G-2). Màn hẹp: hàng lớp gập hai dòng
 * `▾ mã · đợt · x/y` + `hạn · trạng thái` (G-3), lưới tự sang một kỹ năng một lúc.
 */
/** E5 (PR-HSM): độ rộng ba cột đầu (Lớp · Đợt · Kỹ năng) — dùng chung với bảng Nợ (`KhoiNo`) để hai bảng thẳng cột. */
export const COT_DAU_LICH_TEST = [190, 120, 110] as const;

export function HangLop({ lop, moCua, onMo, coChiNhanh, hep, periodId, tuanDangXem, urlClassId, urlKn, conTro, onDaLuu, chuaLuu, baoChuaLuu }: {
  lop: LopLichTest[];
  moCua: (l: LopLichTest) => boolean;
  onMo: (l: LopLichTest) => void;
  coChiNhanh: boolean; hep: boolean;
  periodId: number; tuanDangXem: string;
  urlClassId: number | null; urlKn: string | null;
  /** Lớp được đặt con trỏ khi mở (mở bằng tay, hoặc lớp trên đường dẫn) — lớp tự mở thì không, trang khỏi nhảy. */
  conTro: ReadonlySet<string>;
  onDaLuu: () => void;
  /** Số ô lưu hỏng theo hàng lớp; lớp còn ô hỏng mà bị thu thì lưới vẫn giữ (ẩn) để không mất giá trị đã gõ. */
  chuaLuu: Readonly<Record<string, number>>;
  baoChuaLuu: (khoa: string, n: number) => void;
}) {
  const cot = hep
    ? [null]
    : [...COT_DAU_LICH_TEST, ...(coChiNhanh ? [110] : []), 96, 190, null, 44];   // cột trạng thái tự giãn (như bảng Nợ) — ba cột đầu giữ đúng số
  const soCot = cot.length;

  return (
    <div className="card overflow-hidden p-0">
      <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
        <colgroup>{cot.map((w, i) => <col key={i} style={w ? { width: w } : undefined} />)}</colgroup>
        {!hep && (
          <thead>
            <tr>
              <th className="th">Lớp</th>
              <th className="th">Đợt</th>
              <th className="th" title="Môn thi tuần này — môn mờ là không thi tuần này">Kỹ năng</th>
              {coChiNhanh && <th className="th">Chi nhánh</th>}
              <th className="th" title="Số bài đã chấm / số bài của tuần này">Tiến độ</th>
              <th className="th">Hạn chấm</th>
              <th className="th"><span className="sr-only">Trạng thái</span></th>
              <th className="th"><span className="sr-only">Mở lưới đầy đủ</span></th>
            </tr>
          </thead>
        )}
        {lop.map((l) => {
          const mo = moCua(l);
          return (
            <tbody key={l.key}>
              <HangNhom mo={mo} onMo={() => onMo(l)} nhan={`lớp ${l.classCode}`}
                tieuDe={hep ? (
                  <span className="block min-w-0 py-1">
                    <span className="block truncate">
                      {l.classCode} · {l.dotLabel} · <TienDo l={l} />
                    </span>
                    <span className="flex min-w-0 flex-wrap items-center gap-x-2" style={THUONG}>
                      <Han loai="nhap-diem" han={l.han} />
                      <NhanLop l={l} chuaLuu={chuaLuu[l.key]} />
                    </span>
                  </span>
                ) : <span className="block truncate" title={l.classCode}>{l.classCode}</span>}>
                {!hep && (
                  <>
                    <td className="px-3 whitespace-nowrap font-semibold text-slate-200">{l.dotLabel}</td>
                    <td className="px-3"><KyNang l={l} /></td>
                    {coChiNhanh && <td className="px-3 truncate text-slate-400" style={THUONG} title={l.branchName}>{l.branchName}</td>}
                    <td className="px-3"><TienDo l={l} /></td>
                    <td className="px-3 whitespace-nowrap" style={THUONG}><Han loai="nhap-diem" han={l.han} /></td>
                    <td className="px-3"><NhanLop l={l} chuaLuu={chuaLuu[l.key]} /></td>
                    <td className="px-1 text-center">
                      <Link to={l.hrefDayDu} title="Mở lưới đầy đủ" aria-label={`Mở lưới đầy đủ lớp ${l.classCode}`}
                        className="inline-flex h-8 w-8 items-center justify-center font-normal text-slate-400 no-underline hover:text-slate-100">↗</Link>
                    </td>
                  </>
                )}
              </HangNhom>
              {(mo || (chuaLuu[l.key] ?? 0) > 0) && (
                <HangCon className={mo ? '' : 'hidden'}>
                  <td colSpan={soCot} style={{ paddingLeft: hep ? 0 : 16, paddingRight: 0 }}>
                    <LuoiNhung classId={l.classId} periodId={l.mode === 'ielts_band' ? periodId : null} kind={l.kind}
                      tuanDangXem={tuanDangXem} kn={l.classId === urlClassId ? urlKn : null} hrefDayDu={l.hrefDayDu}
                      datConTro={conTro.has(l.key)} onDaLuu={onDaLuu} coLinkRieng
                      onSoOChuaLuu={(n) => baoChuaLuu(l.key, n)} />
                  </td>
                </HangCon>
              )}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
