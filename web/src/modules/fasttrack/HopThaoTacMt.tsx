import { useState } from 'react';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { TuanNho, type Tuan } from '../test/keHoach/TuanNho.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { addDaysStr } from '../../lib/format.ts';
import { Nhan } from '../../ui/Nhan.tsx';
import {
  CAU_TUAN_DA_QUA, CHU_THAO_TAC, canLyDo, cauDaGhiVang, kiemLyDoThaoTac, kiemTuanXep, luatVangThuong, mondayOfDate, ngay, sauTuanThi, tenMon, tuanLich,
  type LoiTruong, type ThaoTac,
} from '@shared/domain/index.ts';

/** Thao tác một kỹ năng mở bằng hộp này — Nhập/Sửa điểm làm tại chỗ, Xếp lại bài vắng / Trả lời đề nghị có hộp riêng. */
export const THAO_TAC_CO_HOP: readonly ThaoTac[] = ['dat-lich', 'xep-lai', 'doi-lich', 'doi-han', 'bo-ky-nang', 'dua-lai', 'bao-vang', 'huy-diem', 'khoi-phuc', 'khong-mock-lai'];

/**
 * OV-11a (TE-5, Q1–Q2): "Vắng" theo đúng luật "-" — Mock sau tuần thi / lớp thường tuần thi đã qua ≥ 2 tuần = Không dự thi (không dời);
 * lớp thường còn trong 2 tuần → dời sang tuần sau của tuần hiện tại. `null` = chưa biết tuần (máy chủ vẫn quyết).
 */
function vangSeRa(laThuong: boolean, weekStart: string | null, homNay: string): { khongDuThi: boolean; tuanMoi: string | null } | null {
  if (!weekStart || !homNay) return null;
  if (!laThuong) return { khongDuThi: sauTuanThi(weekStart, homNay), tuanMoi: null };
  const l = luatVangThuong(weekStart, homNay);
  return l.khongDuThi ? { khongDuThi: true, tuanMoi: null } : { khongDuThi: false, tuanMoi: tuanLich(l.tuanMoi, homNay) };
}

/** Một câu nói hệ quả của thao tác — người bấm biết trước điều gì xảy ra (T38, clarify). */
function cauHeQua(t: ThaoTac, mon: string, laThuong: boolean, vang: ReturnType<typeof vangSeRa> = null): string {
  switch (t) {
    case 'dat-lich': return `Đặt tuần thi cho ${mon}; các kỹ năng khác giữ nguyên.`;
    case 'xep-lai': return `Đặt tuần thi mới cho bài vắng ${mon}. Tính là một lần dời do vắng.`;
    case 'doi-lich': return `Chỉ ${mon} đổi tuần thi; các kỹ năng khác giữ nguyên. Không tính là một lần dời do vắng.`;
    case 'doi-han': return `Hạn chấm mới chỉ áp cho ${mon}; hết ngày hạn mới tính quá hạn.`;
    case 'bo-ky-nang': return `${mon} bỏ khỏi đợt này, không tính vào kết quả đợt. "Đưa lại vào đợt" để thi lại.`;
    case 'dua-lai': return `${mon} trở lại danh sách thi của đợt này. Tuần cũ còn hợp lệ thì giữ, không thì về Chưa xếp lịch.`;
    case 'bao-vang': return vang?.khongDuThi
      ? `Tuần thi đã qua: ghi Không dự thi cho ${mon} — không dời, không tính lần vắng.`
      : laThuong
        ? `Ghi "-" cho ${mon}: môn này dời sang ${vang?.tuanMoi ?? 'tuần sau'} ngay.`
        : `Ghi "-" cho ${mon} và chốt ngay. Lần vắng đầu máy tự dời sang tuần kế tiếp; lần 2 huỷ phần thi này.`;
    case 'huy-diem': return 'Ô điểm trở về trống. Điểm cũ vẫn nằm trong Lịch sử cùng lý do.';
    case 'khong-mock-lai': return `${mon} đã huỷ vì vắng 2 lần sẽ không thi lại; đợt tính trên các kỹ năng còn lại.`;
    case 'khoi-phuc': return `Mở lại phần thi ${mon} đã huỷ và đặt tuần thi mới trong cùng một lần.`;
    default: return '';
  }
}

export type HopThaoTacProps = {
  thaoTac: ThaoTac | null; attemptId: number; skill: string; ct: string | null; laThuong: boolean;
  /** Quản lý / Quản trị xếp được tuần đã qua (T4, chip "Tuần đã qua"); người khác bị khoá từ tuần này (K2-33). */
  quanLy: boolean;
  row: { periodId: number | null; weekStart: string | null; deadline?: string | null };
  /** Huỷ điểm Writing (FT): ô W1/W2 đang có điểm; `oMacDinh` = ô tích sẵn (dòng W2 chỉ tích W2). */
  oCoDiem?: string[]; oMacDinh?: string[];
  /** Mở từ hộp xếp lịch nổi (`HopKyNang`, z-60): panel nằm trên hộp đó và không thay panel đang mở bên dưới (PR-LM). */
  trongHop?: boolean;
  /** Ngữ cảnh ở đầu panel (luật KhungPanel). */
  hocVien?: string | null; lop?: string | null;
  onClose: () => void; onDone: () => void;
};

/**
 * HỘP THAO TÁC MỘT KỸ NĂNG DÙNG CHUNG (PR-XLMT, T38): hồ sơ Mock, hộp kỹ năng Kế hoạch Test và menu ⋯ ô lưới lớp thường mở
 * CÙNG hộp này — một tiêu đề `{thao tác} · {môn}`, một câu hệ quả, ô tuần / ngày khi cần, ô Lý do (bắt buộc đúng chỗ, K4-15).
 * Máy chủ kiểm lại mọi luật; câu lỗi của máy chủ hiện nguyên văn TRONG panel (không đóng panel, không mất chữ đã gõ).
 * Khung: `KhungPanel` (I4, PR-LM) — chân theo luật S3: chưa sửa "Đóng", đã sửa "Huỷ thay đổi"; thao tác nguy hiểm nút chính đỏ.
 */
export function HopThaoTacMt({ thaoTac, attemptId, skill, ct, laThuong, quanLy, row, oCoDiem = [], oMacDinh, trongHop, hocVien, lop, onClose, onDone }: HopThaoTacProps) {
  const toast = useToast();
  const lf = useLoiForm();
  const { homNay } = useNgayNghiepVu();
  const [tuan, setTuan] = useState<Tuan | null>(row.periodId && row.weekStart ? { periodId: row.periodId, weekStart: row.weekStart } : null);
  const [han, setHan] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [o, setO] = useState<string[]>(oMacDinh ?? oCoDiem);
  const [canhBao, setCanhBao] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loiMay, setLoiMay] = useState<string | null>(null);
  /** PR-MTGON: Huỷ kỹ năng đã có điểm → máy chủ 409; hỏi "Xoá điểm và huỷ kỹ năng?", lần bấm sau gửi `xoaDiem`. */
  const [xoaDiem, setXoaDiem] = useState(false);
  if (!thaoTac) return null;
  const t = thaoTac;
  const vang = t === 'bao-vang' ? vangSeRa(laThuong, row.weekStart, homNay) : null;
  const ten = vang?.khongDuThi ? 'Không dự thi' : CHU_THAO_TAC[t];
  const mon = tenMon(ct, skill);
  const batBuoc = canLyDo(t);
  const coTuan = t === 'dat-lich' || t === 'xep-lai' || t === 'doi-lich' || t === 'khoi-phuc';
  /* K2-33: GVCN dời / xếp lại lượt có sẵn không vào tuần đã qua — tuần sớm nhất là tuần này. Quản lý được (T4): chỉ hiện chip vàng.
     PR-MTa T21: Khôi phục (chỉ Quản lý) cũng chọn được tuần đã qua — em đã thi thật. */
  const tuanNay = homNay && !quanLy && t !== 'khoi-phuc' ? mondayOfDate(homNay) : null;
  const quaTuan = quanLy && coTuan && t !== 'khoi-phuc' && !!tuan && tuan.periodId !== row.periodId && !!homNay
    && kiemTuanXep({ ketThuc: [addDaysStr(tuan.weekStart.slice(0, 10), 6)], homNay, quanLy: true }).quaTuan;
  const chonW = t === 'huy-diem' && !laThuong && oCoDiem.length > 1;

  const loi: LoiTruong[] = [
    ...(kiemLyDoThaoTac(t, lyDo) ? [{ khoa: 'ly-do', nhan: 'Lý do', lyDo: 'Chưa điền' }] : []),
    ...(coTuan && (!tuan || (t === 'doi-lich' && tuan.periodId === row.periodId)) ? [{ khoa: 'tuan', nhan: 'Tuần thi mới', lyDo: 'Chọn tuần khác tuần hiện tại' }]
      : coTuan && tuanNay && tuan!.weekStart < tuanNay ? [{ khoa: 'tuan', nhan: 'Tuần thi mới', lyDo: 'Tuần đã qua — chọn từ tuần này trở đi' }] : []),
    ...(t === 'doi-han' && !han ? [{ khoa: 'han', nhan: 'Hạn chấm mới', lyDo: 'Chưa chọn' }] : []),
    ...(chonW && !o.length ? [{ khoa: 'o', nhan: 'Ô cần huỷ', lyDo: 'Chưa chọn' }] : []),
  ];
  const lyDoGui = lyDo.trim() || undefined;

  const goi = async (force: boolean): Promise<string> => {
    const goc = `/attempts/${attemptId}/skills/${skill}`;
    switch (t) {
      case 'dat-lich':
      case 'xep-lai':
      case 'doi-lich':
        await api.post(`${goc}/week`, { periodId: tuan!.periodId, reason: lyDoGui ?? null, force });
        return `${t === 'doi-lich' ? 'Đã dời lịch thi' : 'Đã lên lịch thi'} ${mon} ${t === 'doi-lich' ? 'sang' : 'vào'} ${tuanLich(tuan!.weekStart, homNay)}`;
      case 'khoi-phuc':
        await api.post(`${goc}/restore`, { periodId: tuan!.periodId, reason: lyDoGui ?? null });
        return `Đã khôi phục ${mon} và đặt ${tuanLich(tuan!.weekStart, homNay)}`;
      case 'doi-han':
        await api.post(`${goc}/deadline`, { deadline: han, reason: lyDoGui ?? null });
        return `Đã dời hạn chấm ${mon} tới ${ngay(han)}`;
      case 'bo-ky-nang':
        await api.post(`${goc}/skip`, { skipped: true, reason: lyDoGui, xoaDiem });
        return `Đã huỷ ${mon}`;
      case 'dua-lai':
        await api.post(`${goc}/skip`, { skipped: false });
        return `${mon} đã đưa lại vào đợt`;
      case 'bao-vang': {
        /* OV-11a (CA3-1): một câu thông báo cho mọi cổng ghi vắng — nói đúng hậu quả máy chủ trả (`cauDaGhiVang`). */
        if (laThuong) {
          const r = await api.put<any>(`/regular/attempts/${attemptId}/scores/${skill}`, { noShow: true, lyDo: lyDoGui });
          return cauDaGhiVang(mon, hocVien ?? undefined, r?.khongDuThi ? { kq: 'khong-du-thi' } : r?.moved ? { kq: 'doi', tuanMoi: r.tuanMoi } : null);
        }
        const r = await api.post<{ daDoi: boolean; tuanMoi: string | null; choDuyet: boolean; huyVang?: boolean; khongDuThi?: boolean }>(`${goc}/bao-vang`, { lyDo: lyDoGui });
        return cauDaGhiVang(mon, hocVien ?? undefined, r.khongDuThi ? { kq: 'khong-du-thi' }
          : r.daDoi ? { kq: 'doi', tuanMoi: tuanLich(r.tuanMoi, homNay) }
          : r.huyVang ? { kq: 'huy' }   // PR-MTa T3: vắng lần 2 → huỷ (ô MT "S huỷ")
          : r.choDuyet ? { kq: 'cho-ql' } : null);
      }
      case 'khong-mock-lai':
        await api.post(`${goc}/khong-mock-lai`, { lyDo: lyDoGui ?? null });
        return `${mon}: không mock lại`;
      case 'huy-diem': {
        if (laThuong) {
          await api.put(`/regular/attempts/${attemptId}/scores/${skill}`, { score: null, total: null, lyDo: lyDoGui });
        } else {
          /* Một yêu cầu, một giao dịch ở máy chủ — W1 + W2 không bao giờ còn nửa điểm (rà #126). */
          await api.post(`${goc}/huy-diem`, { o: chonW ? o : oCoDiem.length ? oCoDiem : undefined, lyDo: lyDoGui });
        }
        return `Đã huỷ điểm ${mon}`;
      }
      default: return '';
    }
  };

  const dong = () => { lf.datLai(); onClose(); };
  const luu = async () => {
    lf.bam();
    if (loi.length || busy) return;
    setBusy(true); setLoiMay(null);
    try {
      const cau = await goi(!!canhBao);
      invalidate('/attempts'); invalidate('/tong-quan'); invalidate('/classes'); invalidate('/ke-hoach-test'); invalidate('/my-work'); invalidate('/cycles');
      toast.push('ok', cau);
      onDone(); dong();
    } catch (e: any) {
      /* T15: cảnh báo (hai đợt quá gần) cần người xác nhận lại — lần bấm sau gửi `force`. */
      if ((t === 'doi-lich' || t === 'dat-lich' || t === 'xep-lai') && /Xác nhận lại/.test(e.message)) setCanhBao(e.message);
      else if (t === 'bo-ky-nang' && e instanceof ApiError && e.status === 409) setXoaDiem(true);
      else setLoiMay(e.message);
    } finally { setBusy(false); }
  };
  const nguyHiem = t === 'bo-ky-nang' || t === 'huy-diem' || t === 'khong-mock-lai';
  /* Luật S3: chưa sửa ô nào → "Đóng"; đã sửa → "Huỷ thay đổi". */
  const daSua = lyDo !== '' || han !== '' || (coTuan && (tuan?.periodId ?? null) !== row.periodId)
    || (chonW && o.join() !== (oMacDinh ?? oCoDiem).join());

  return (
    <KhungPanel tieuDe={`${ten} · ${mon}`} hocVien={hocVien} lop={lop} onDong={dong} longTrong={trongHop} z={trongHop ? 'z-[70]' : undefined}
      chan={{
        daSua: daSua, huy: { onClick: dong, disabled: busy },
        dongTren: loiMay ? <p className="m-0 px-4 pt-2 text-xs font-semibold text-bad" role="alert">{loiMay}</p> : undefined,
        chinh: (
          <button type="button" className={`btn min-h-[44px] sm:min-h-0 ${nguyHiem ? 'btn-danger' : 'btn-primary'}`} disabled={busy} onClick={() => void luu()}>
            {busy ? 'Đang lưu…' : canhBao ? 'Vẫn dời vào tuần này' : xoaDiem ? 'Xoá điểm và huỷ kỹ năng' : ten}
          </button>
        ),
      }}>
      <div className="space-y-3 pt-3">
        <p className="m-0 text-sm text-slate-300">{cauHeQua(t, mon, laThuong, vang)}</p>
        {coTuan && (
          <Truong nhan="Tuần thi mới" batBuoc as="div" loi={lf.loiCua(loi, 'tuan')}>
            <div {...lf.o(loi, 'tuan')}>
              <TuanNho d={{ periodId: tuan?.periodId ?? null, weekStart: tuan?.weekStart ?? null }} goc={row.weekStart} toiThieu={tuanNay}
                onTuan={(x) => { setTuan(x); setCanhBao(null); }} />
            </div>
            {t === 'doi-lich' && row.weekStart && <span className="mt-1 block text-xs text-slate-500">Đang thi {tuanLich(row.weekStart)}</span>}
          </Truong>
        )}
        {t === 'doi-han' && (
          <Truong nhan="Hạn chấm mới" batBuoc loi={lf.loiCua(loi, 'han')}>
            <ONgay kieu="ngay" value={han} onChange={setHan} id={lf.oId('han')} onBlur={lf.roi('han')} invalid={!!lf.loiCua(loi, 'han')} />
            {row.deadline && <span className="mt-1 block text-xs text-slate-500">Hạn đang áp dụng {ngay(row.deadline)}</span>}
          </Truong>
        )}
        {chonW && (
          <Truong nhan="Ô cần huỷ" batBuoc as="div" loi={lf.loiCua(loi, 'o')}>
            <div className="flex gap-4" {...lf.o(loi, 'o')}>
              {oCoDiem.map((e) => (
                <label key={e} className="flex min-h-[44px] items-center gap-2 text-sm text-slate-200 sm:min-h-0">
                  <input type="checkbox" checked={o.includes(e)} onChange={(ev) => setO(ev.target.checked ? [...o, e] : o.filter((x) => x !== e))} />
                  {e === 'writing1' ? 'W1' : 'W2'}
                </label>
              ))}
            </div>
          </Truong>
        )}
        {t !== 'dua-lai' && (
          <Truong nhan="Lý do" batBuoc={batBuoc} tuyChon={!batBuoc} loi={lf.loiCua(loi, 'ly-do')}>
            <textarea className="field w-full" rows={2} maxLength={300} {...lf.o(loi, 'ly-do')} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
              placeholder={t === 'bao-vang' || t === 'khong-mock-lai' ? 'Ví dụ: em ốm, phụ huynh đã báo' : t === 'huy-diem' ? 'Ví dụ: nhập nhầm bài của em khác' : 'Ví dụ: trùng lịch phòng thi'} />
          </Truong>
        )}
        {canhBao && <p className="m-0 text-xs text-amber-200" role="status">{canhBao}</p>}
        {xoaDiem && <p className="m-0 text-xs text-amber-200" role="status">{mon} đã có điểm. Xoá điểm và huỷ kỹ năng?</p>}
        {quaTuan && (
          <div className="flex flex-wrap gap-1.5">
            <Nhan tone="soon" title={CAU_TUAN_DA_QUA}>Tuần đã qua</Nhan>
          </div>
        )}
      </div>
    </KhungPanel>
  );
}
