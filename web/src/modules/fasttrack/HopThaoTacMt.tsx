import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Truong } from '../../ui/KhungPanel.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { TuanNho, type Tuan } from '../test/keHoach/TuanNho.tsx';
import {
  CHU_THAO_TAC, LY_DO_TOI_THIEU, canLyDo, kiemLyDoThaoTac, kiemTruong, ngay, tenMon, tuanLich, type LoiTruong, type ThaoTac,
} from '@shared/domain/index.ts';

/** Thao tác một kỹ năng mở bằng hộp này — Nhập/Sửa điểm làm tại chỗ, Xếp lại bài vắng / Trả lời đề nghị có hộp riêng. */
export const THAO_TAC_CO_HOP: readonly ThaoTac[] = ['dat-lich', 'doi-lich', 'doi-han', 'bo-ky-nang', 'dua-lai', 'bao-vang', 'huy-diem', 'khoi-phuc'];

/** Một câu nói hệ quả của thao tác — người bấm biết trước điều gì xảy ra (T38, clarify). */
function cauHeQua(t: ThaoTac, mon: string, laThuong: boolean): string {
  switch (t) {
    case 'dat-lich': return `Đặt tuần thi cho ${mon}; các kỹ năng khác giữ nguyên.`;
    case 'doi-lich': return `Chỉ ${mon} đổi tuần thi; các kỹ năng khác giữ nguyên. Không tính là một lần dời do vắng.`;
    case 'doi-han': return `Hạn chấm mới chỉ áp cho ${mon}; hết ngày hạn mới tính quá hạn.`;
    case 'bo-ky-nang': return `${mon} không thi trong đợt này và không tính vào kết quả đợt. Đưa lại được trước khi tới tuần thi.`;
    case 'dua-lai': return `${mon} trở lại danh sách thi của đợt này. Chưa có tuần thi thì xếp tuần ngay sau đó.`;
    case 'bao-vang': return laThuong
      ? `Ghi "-" cho ${mon}: môn này dời sang tuần sau ngay.`
      : `Ghi "-" cho ${mon} và chốt ngay. Lần vắng đầu máy tự dời sang tuần kế tiếp; từ lần 2 Quản lý duyệt.`;
    case 'huy-diem': return 'Ô điểm trở về trống. Điểm cũ vẫn nằm trong Lịch sử cùng lý do.';
    case 'khoi-phuc': return `Mở lại phần thi ${mon} đã huỷ và đặt tuần thi mới trong cùng một lần.`;
    default: return '';
  }
}

export type HopThaoTacProps = {
  thaoTac: ThaoTac | null; attemptId: number; skill: string; ct: string | null; laThuong: boolean;
  /** Tuần thi hiện tại của kỹ năng đã bắt đầu — Dời lịch thi lúc đó mới bắt lý do (K4-15). */
  tuanDaBatDau: boolean;
  row: { periodId: number | null; weekStart: string | null; deadline?: string | null };
  /** Huỷ điểm Writing (FT): ô W1/W2 đang có điểm; `oMacDinh` = ô tích sẵn (dòng W2 chỉ tích W2). */
  oCoDiem?: string[]; oMacDinh?: string[];
  onClose: () => void; onDone: () => void;
};

/**
 * HỘP THAO TÁC MỘT KỸ NĂNG DÙNG CHUNG (PR-XLMT, T38): hồ sơ Mock, hộp kỹ năng Kế hoạch Test và menu ⋯ ô lưới lớp thường mở
 * CÙNG hộp này — một tiêu đề `{thao tác} · {môn}`, một câu hệ quả, ô tuần / ngày khi cần, ô Lý do (bắt buộc đúng chỗ, K4-15).
 * Máy chủ kiểm lại mọi luật; câu lỗi của máy chủ hiện nguyên văn.
 */
export function HopThaoTacMt({ thaoTac, attemptId, skill, ct, laThuong, tuanDaBatDau, row, oCoDiem = [], oMacDinh, onClose, onDone }: HopThaoTacProps) {
  const toast = useToast();
  const lf = useLoiForm();
  const [tuan, setTuan] = useState<Tuan | null>(row.periodId && row.weekStart ? { periodId: row.periodId, weekStart: row.weekStart } : null);
  const [han, setHan] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [o, setO] = useState<string[]>(oMacDinh ?? oCoDiem);
  const [canhBao, setCanhBao] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!thaoTac) return null;
  const t = thaoTac;
  const ten = CHU_THAO_TAC[t];
  const mon = tenMon(ct, skill);
  const batBuoc = canLyDo(t, tuanDaBatDau);
  const coTuan = t === 'dat-lich' || t === 'doi-lich' || t === 'khoi-phuc';
  const chonW = t === 'huy-diem' && !laThuong && oCoDiem.length > 1;

  const loi: LoiTruong[] = [
    ...(batBuoc && kiemLyDoThaoTac(ten, lyDo) ? [{ khoa: 'ly-do', nhan: 'Lý do', lyDo: kiemTruong({ khoa: 'ly-do', nhan: 'Lý do', toiThieu: LY_DO_TOI_THIEU }, lyDo)! }] : []),
    ...(coTuan && (!tuan || (t === 'doi-lich' && tuan.periodId === row.periodId)) ? [{ khoa: 'tuan', nhan: 'Tuần thi mới', lyDo: 'Chọn tuần khác tuần hiện tại' }] : []),
    ...(t === 'doi-han' && !han ? [{ khoa: 'han', nhan: 'Hạn chấm mới', lyDo: 'Chưa chọn' }] : []),
    ...(chonW && !o.length ? [{ khoa: 'o', nhan: 'Ô cần huỷ', lyDo: 'Chưa chọn' }] : []),
  ];
  const lyDoGui = lyDo.trim() || undefined;

  const goi = async (force: boolean): Promise<string> => {
    const goc = `/attempts/${attemptId}/skills/${skill}`;
    switch (t) {
      case 'dat-lich':
      case 'doi-lich':
        await api.post(`${goc}/week`, { periodId: tuan!.periodId, reason: lyDoGui ?? null, force });
        return `${t === 'dat-lich' ? 'Đã xếp' : 'Đã dời'} lịch thi ${mon} sang ${tuanLich(tuan!.weekStart)}`;
      case 'khoi-phuc':
        await api.post(`${goc}/restore`, { periodId: tuan!.periodId, reason: lyDoGui ?? null });
        return `Đã khôi phục ${mon} và đặt ${tuanLich(tuan!.weekStart)}`;
      case 'doi-han':
        await api.post(`${goc}/deadline`, { deadline: han, reason: lyDoGui ?? null });
        return `Đã dời hạn chấm ${mon} tới ${ngay(han)}`;
      case 'bo-ky-nang':
        await api.post(`${goc}/skip`, { skipped: true, reason: lyDoGui });
        return `${mon} đã bỏ khỏi đợt`;
      case 'dua-lai':
        await api.post(`${goc}/skip`, { skipped: false });
        return `${mon} đã đưa lại vào đợt`;
      case 'bao-vang': {
        if (laThuong) {
          const r = await api.put<any>(`/regular/attempts/${attemptId}/scores/${skill}`, { noShow: true, lyDo: lyDoGui });
          return r?.moved ? `Đã báo vắng ${mon} — dời sang ${r.tuanMoi ?? 'tuần sau'}` : `Đã báo vắng ${mon}`;
        }
        const r = await api.post<{ daDoi: boolean; tuanMoi: string | null; choDuyet: boolean }>(`${goc}/bao-vang`, { lyDo: lyDoGui });
        if (r.daDoi) return `Đã tự dời ${mon} sang ${tuanLich(r.tuanMoi)} (vắng lần 1)`;
        return r.choDuyet ? `Đã gửi Quản lý duyệt dời ${mon} (vắng lần 2)` : `Đã báo vắng ${mon}`;
      }
      case 'huy-diem': {
        if (laThuong) {
          await api.put(`/regular/attempts/${attemptId}/scores/${skill}`, { score: null, total: null, lyDo: lyDoGui });
        } else {
          for (const e of chonW ? o : oCoDiem.length ? oCoDiem : [skill]) {
            await api.put(`/attempts/${attemptId}/scores/${e}`, { rawScore: null, criteria: [null, null, null, null], lyDo: lyDoGui });
          }
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
    setBusy(true);
    try {
      const cau = await goi(!!canhBao);
      invalidate('/attempts'); invalidate('/overview'); invalidate('/classes'); invalidate('/ke-hoach-test'); invalidate('/my-work');
      toast.push('ok', cau);
      onDone(); dong();
    } catch (e: any) {
      /* T15: cảnh báo (hai đợt quá gần) cần người xác nhận lại — lần bấm sau gửi `force`. */
      if ((t === 'doi-lich' || t === 'dat-lich') && /Xác nhận lại/.test(e.message)) setCanhBao(e.message);
      else toast.push('error', e.message);
    } finally { setBusy(false); }
  };
  const nguyHiem = t === 'bo-ky-nang' || t === 'huy-diem';

  return (
    <Modal open onClose={dong} title={`${ten} · ${mon}`} width="max-w-md"
      footer={<>
        <button type="button" className="btn mr-auto" onClick={dong} disabled={busy}>Đóng</button>
        <button type="button" className={`btn ${nguyHiem ? 'btn-danger' : 'btn-primary'}`} disabled={busy} onClick={luu}>
          {busy ? 'Đang lưu…' : canhBao ? 'Vẫn dời vào tuần này' : ten}
        </button>
      </>}>
      <div className="space-y-3">
        <p className="m-0 text-sm text-slate-300">{cauHeQua(t, mon, laThuong)}</p>
        {coTuan && (
          <Truong nhan="Tuần thi mới" batBuoc as="div" loi={lf.loiCua(loi, 'tuan')}>
            <div {...lf.o(loi, 'tuan')}>
              <TuanNho d={{ periodId: tuan?.periodId ?? null, weekStart: tuan?.weekStart ?? null }} goc={row.weekStart}
                onTuan={(x) => { setTuan(x); setCanhBao(null); }} />
            </div>
            {t === 'doi-lich' && row.weekStart && <span className="mt-1 block text-[11px] text-slate-500">Đang thi {tuanLich(row.weekStart)}</span>}
          </Truong>
        )}
        {t === 'doi-han' && (
          <Truong nhan="Hạn chấm mới" batBuoc loi={lf.loiCua(loi, 'han')}>
            <ONgay kieu="ngay" value={han} onChange={setHan} id={lf.oId('han')} onBlur={lf.roi('han')} invalid={!!lf.loiCua(loi, 'han')} />
            {row.deadline && <span className="mt-1 block text-[11px] text-slate-500">Hạn đang áp dụng {ngay(row.deadline)}</span>}
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
          <Truong nhan="Lý do" batBuoc={batBuoc} tuyChon={!batBuoc} loi={lf.loiCua(loi, 'ly-do')}
            dem={batBuoc ? { co: lyDo.trim().length, can: LY_DO_TOI_THIEU } : undefined}>
            <textarea className="field w-full" rows={2} maxLength={300} {...lf.o(loi, 'ly-do')} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
              placeholder={t === 'bao-vang' ? 'Ví dụ: em ốm, phụ huynh đã báo' : t === 'huy-diem' ? 'Ví dụ: nhập nhầm bài của em khác' : 'Ví dụ: trùng lịch phòng thi'} />
          </Truong>
        )}
        {canhBao && <p className="m-0 text-xs text-amber-200" role="status">{canhBao}</p>}
      </div>
    </Modal>
  );
}
