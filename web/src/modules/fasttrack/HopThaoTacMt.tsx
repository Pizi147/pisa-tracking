import { useEffect, useState } from 'react';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { HopXacNhanHuyLich, type LuotSeHuyLich } from '../test/keHoach/HopXacNhanHuyLich.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { TuanNho, type Tuan } from '../test/keHoach/TuanNho.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { addDaysStr } from '../../lib/format.ts';
import { Nhan } from '../../ui/Nhan.tsx';
import {
  CAU_TUAN_DA_QUA, CHU_THAO_TAC, canLyDo, cauSeHuyLich, chuDoiVuot, chuLuuVuot, kiemLyDoThaoTac, kiemTuanXep, mondayOfDate, ngay, tenMon, tuanLich, type LoiTruong, type ThaoTac,
} from '@shared/domain/index.ts';

/** Thao tác một kỹ năng mở bằng hộp này — Nhập/Sửa điểm làm tại chỗ, Xếp lại bài vắng / Trả lời đề nghị có hộp riêng. */
export const THAO_TAC_CO_HOP: readonly ThaoTac[] = ['dat-lich', 'xep-lai', 'doi-lich', 'doi-han', 'bo-ky-nang', 'dua-lai', 'bao-vang', 'huy-diem', 'khoi-phuc', 'xin-doi', 'khong-mock-lai'];

/** Một câu nói hệ quả của thao tác — người bấm biết trước điều gì xảy ra (T38, clarify). */
function cauHeQua(t: ThaoTac, mon: string, laThuong: boolean): string {
  switch (t) {
    case 'dat-lich': return `Đặt tuần thi cho ${mon}; các kỹ năng khác giữ nguyên.`;
    case 'xep-lai': return `Đặt tuần thi mới cho bài vắng ${mon}. Tính là một lần dời do vắng.`;
    case 'doi-lich': return `Chỉ ${mon} đổi tuần thi; các kỹ năng khác giữ nguyên. Không tính là một lần dời do vắng.`;
    case 'doi-han': return `Hạn chấm mới chỉ áp cho ${mon}; hết ngày hạn mới tính quá hạn.`;
    case 'bo-ky-nang': return `${mon} không thi trong đợt này và không tính vào kết quả đợt. Đưa lại được trước khi tới tuần thi.`;
    case 'dua-lai': return `${mon} trở lại danh sách thi của đợt này. Chưa có tuần thi thì xếp tuần ngay sau đó.`;
    case 'bao-vang': return laThuong
      ? `Ghi "-" cho ${mon}: môn này dời sang tuần sau ngay.`
      : `Ghi "-" cho ${mon} và chốt ngay. Lần vắng đầu máy tự dời sang tuần kế tiếp; lần 2 huỷ phần thi này.`;
    case 'huy-diem': return 'Ô điểm trở về trống. Điểm cũ vẫn nằm trong Lịch sử cùng lý do.';
    case 'xin-doi': return `Gửi Quản lý duyệt xếp lại ${mon} đã huỷ vì vắng 2 lần.`;
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
  /** Nhãn đợt đang dời ('MT1') cho tiêu đề hộp dời vượt; thiếu thì 'MT này'. */
  nhanMt?: string;
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
export function HopThaoTacMt({ thaoTac, attemptId, skill, ct, laThuong, quanLy, row, oCoDiem = [], oMacDinh, trongHop, nhanMt = 'MT này', hocVien, lop, onClose, onDone }: HopThaoTacProps) {
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
  /** Q-0310-1: dời kỹ năng này vượt lượt sau → máy chủ trả 409 kèm lượt sẽ bị huỷ lịch; xác nhận rồi gửi lại. */
  const [xacNhan, setXacNhan] = useState<LuotSeHuyLich[] | null>(null);
  /** Kiểm trước (PR-MTb T6): tuần mới vượt lượt sau → chip vàng / hộp xác nhận. Chỉ Quản lý có quyền kiểm (403 → bỏ qua, 409 lúc lưu vẫn bắt). */
  const [seHuyLich, setSeHuyLich] = useState<LuotSeHuyLich[]>([]);
  const dangDoiTuan = !!thaoTac && !laThuong && (thaoTac === 'dat-lich' || thaoTac === 'xep-lai' || thaoTac === 'doi-lich');
  const periodMoi = tuan?.periodId ?? null;
  useEffect(() => {
    if (!dangDoiTuan || !periodMoi || periodMoi === row.periodId) { setSeHuyLich([]); return undefined; }
    let huy = false;
    api.post<{ seHuyLich?: LuotSeHuyLich[] }>('/ke-hoach-test/dot/kiem', { attemptId, kyNang: [{ skill, periodId: periodMoi }] })
      .then((r) => { if (!huy) setSeHuyLich(r.seHuyLich ?? []); })
      .catch(() => { if (!huy) setSeHuyLich([]); });
    return () => { huy = true; };
  }, [dangDoiTuan, periodMoi, attemptId, skill]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (!thaoTac) return null;
  const t = thaoTac;
  const ten = CHU_THAO_TAC[t];
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
  const vuot = chuDoiVuot({ nhan: nhanMt, tuanMoi: tuan?.weekStart ?? '', ds: dangDoiTuan ? seHuyLich : [] }, homNay);
  const vuotXacNhan = xacNhan ? chuDoiVuot({ nhan: nhanMt, tuanMoi: tuan?.weekStart ?? '', ds: xacNhan }, homNay) : null;

  const goi = async (force: boolean, xacNhanHuyLich: boolean, lyDoVuot?: string): Promise<string> => {
    const goc = `/attempts/${attemptId}/skills/${skill}`;
    switch (t) {
      case 'dat-lich':
      case 'xep-lai':
      case 'doi-lich':
        await api.post(`${goc}/week`, { periodId: tuan!.periodId, reason: lyDoVuot || lyDoGui || null, force, xacNhanHuyLich });
        return `${t === 'doi-lich' ? 'Đã dời lịch thi' : 'Đã lên lịch thi'} ${mon} ${t === 'doi-lich' ? 'sang' : 'vào'} ${tuanLich(tuan!.weekStart, homNay)}`;
      case 'khoi-phuc':
        await api.post(`${goc}/restore`, { periodId: tuan!.periodId, reason: lyDoGui ?? null });
        return `Đã khôi phục ${mon} và đặt ${tuanLich(tuan!.weekStart, homNay)}`;
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
        const r = await api.post<{ daDoi: boolean; tuanMoi: string | null; choDuyet: boolean; huyVang?: boolean }>(`${goc}/bao-vang`, { lyDo: lyDoGui });
        if (r.daDoi) return `Đã tự dời ${mon} sang ${tuanLich(r.tuanMoi, homNay)} (vắng lần 1)`;
        if (r.huyVang) return `${mon} huỷ`;   // PR-MTa T3: vắng lần 2 → huỷ (ô MT "S huỷ")
        return r.choDuyet ? `Đã gửi Quản lý duyệt dời ${mon} (vắng lần 2)` : `Đã báo vắng ${mon}`;
      }
      case 'xin-doi':
        await api.post(`${goc}/xin-doi`, { reason: lyDoGui ?? null });
        return `Đã gửi Quản lý xin dời ${mon}`;
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
  const luu = async (xacNhanHuyLich = false, lyDoVuot?: string) => {
    lf.bam();
    if (loi.length || busy) return;
    if (vuot.canPopup && !xacNhanHuyLich) { setXacNhan(seHuyLich); return; }   // lượt bị vượt có điểm → hộp xác nhận trước khi gửi
    setBusy(true); setLoiMay(null);
    try {
      /* Chưa điểm (chip vàng) → lưu thẳng; nếu dữ liệu vừa đổi có điểm thì máy chủ trả 409 → mở hộp xác nhận. */
      const cau = await goi(!!canhBao, xacNhanHuyLich, lyDoVuot);
      invalidate('/attempts'); invalidate('/tong-quan'); invalidate('/classes'); invalidate('/ke-hoach-test'); invalidate('/my-work'); invalidate('/cycles');
      toast.push('ok', dangDoiTuan ? chuLuuVuot(xacNhan ?? seHuyLich, cau) : cau);
      onDone(); dong();
    } catch (e: any) {
      /* T15: cảnh báo (hai đợt quá gần) cần người xác nhận lại — lần bấm sau gửi `force`. */
      if ((t === 'doi-lich' || t === 'dat-lich' || t === 'xep-lai') && /Xác nhận lại/.test(e.message)) setCanhBao(e.message);
      else if (e instanceof ApiError && e.status === 409 && e.details?.seHuyLich?.length) { setSeHuyLich(e.details.seHuyLich); setXacNhan(e.details.seHuyLich); }   // dữ liệu đổi giữa chừng: mở lại với danh sách mới, giữ chữ Lý do
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
        dongTren: loiMay && !xacNhan ? <p className="m-0 px-4 pt-2 text-xs font-semibold text-bad" role="alert">{loiMay}</p> : undefined,
        chinh: (
          <button type="button" className={`btn min-h-[44px] sm:min-h-0 ${nguyHiem ? 'btn-danger' : 'btn-primary'}`} disabled={busy} onClick={() => void luu()}>
            {busy ? 'Đang lưu…' : canhBao ? 'Vẫn dời vào tuần này' : ten}
          </button>
        ),
      }}>
      <div className="space-y-3 pt-3">
        <p className="m-0 text-sm text-slate-300">{cauHeQua(t, mon, laThuong)}</p>
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
        {t !== 'dua-lai' && !vuot.canPopup && (
          <Truong nhan="Lý do" batBuoc={batBuoc} tuyChon={!batBuoc} loi={lf.loiCua(loi, 'ly-do')}>
            <textarea className="field w-full" rows={2} maxLength={300} {...lf.o(loi, 'ly-do')} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
              placeholder={t === 'bao-vang' || t === 'xin-doi' || t === 'khong-mock-lai' ? 'Ví dụ: em ốm, phụ huynh đã báo' : t === 'huy-diem' ? 'Ví dụ: nhập nhầm bài của em khác' : 'Ví dụ: trùng lịch phòng thi'} />
          </Truong>
        )}
        {canhBao && <p className="m-0 text-xs text-amber-200" role="status">{canhBao}</p>}
        {(vuot.chip || quaTuan) && (
          <div className="flex flex-wrap gap-1.5">
            {vuot.chip && <Nhan tone="soon" title={cauSeHuyLich(seHuyLich, homNay)}>{vuot.chip}</Nhan>}
            {quaTuan && <Nhan tone="soon" title={CAU_TUAN_DA_QUA}>Tuần đã qua</Nhan>}
          </div>
        )}
      </div>
      {vuotXacNhan && (
        <HopXacNhanHuyLich tieuDe={vuotXacNhan.tieuDe} cau={vuotXacNhan.cau} dong={vuotXacNhan.dong} busy={busy} loiMay={loiMay} lyDoDau={lyDo}
          onDong={() => { setXacNhan(null); setLoiMay(null); }} onXacNhan={(ly) => void luu(true, ly)} />
      )}
    </KhungPanel>
  );
}
