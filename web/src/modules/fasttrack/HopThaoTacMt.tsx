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
  CAU_TUAN_DA_QUA, CHU_THAO_TAC, canLyDo, cauDaGhiVang, kiemLyDoThaoTac, kiemTuanXep, luatVangThuong, mondayOfDate, ngay, tenMon, tuanLich,
  type LoiTruong, type ThaoTac,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** Thao tác một kỹ năng mở bằng hộp này — Nhập/Sửa điểm làm tại chỗ, Xếp lại bài vắng / Trả lời đề nghị có hộp riêng. */
export const THAO_TAC_CO_HOP: readonly ThaoTac[] = ['dat-lich', 'xep-lai', 'doi-lich', 'doi-han', 'bo-ky-nang', 'dua-lai', 'bao-vang', 'huy-diem', 'khoi-phuc', 'khong-mock-lai'];

/**
 * OV-11a (TE-5, Q1–Q2): "Vắng" theo đúng luật "-" — lớp thường tuần thi đã qua ≥ 2 tuần = Không dự thi (không dời), còn trong 2 tuần → dời
 * sang tuần sau của tuần hiện tại. LUAT-34: Mock không còn "Không dự thi" — ghi muộn vẫn chốt (máy chủ `chuyenVang`). `null` = chưa biết tuần.
 */
function vangSeRa(laThuong: boolean, weekStart: string | null, homNay: string): { khongDuThi: boolean; tuanMoi: string | null } | null {
  if (!weekStart || !homNay) return null;
  if (!laThuong) return { khongDuThi: false, tuanMoi: null };
  const l = luatVangThuong(weekStart, homNay);
  return l.khongDuThi ? { khongDuThi: true, tuanMoi: null } : { khongDuThi: false, tuanMoi: tuanLich(l.tuanMoi, homNay) };
}

/** Một câu nói hệ quả của thao tác — người bấm biết trước điều gì xảy ra (T38, clarify). */
function cauHeQua(tt: ThaoTac, mon: string, laThuong: boolean, vang: ReturnType<typeof vangSeRa> = null): string {
  switch (tt) {
    case 'dat-lich': return t('Đặt tuần thi cho {mon}; các kỹ năng khác giữ nguyên.', { mon });
    case 'xep-lai': return t('Đặt tuần thi mới cho bài vắng {mon}. Tính là một lần dời do vắng.', { mon });
    case 'doi-lich': return t('Chỉ {mon} đổi tuần thi; các kỹ năng khác giữ nguyên. Không tính là một lần dời do vắng.', { mon });
    case 'doi-han': return t('Hạn chấm mới chỉ áp cho {mon}; hết ngày hạn mới tính quá hạn.', { mon });
    case 'bo-ky-nang': return t('{mon} bỏ khỏi đợt này, không tính vào kết quả đợt. "Đưa lại vào đợt" để thi lại.', { mon });
    case 'dua-lai': return t('{mon} trở lại danh sách thi của đợt này. Tuần cũ còn hợp lệ thì giữ, không thì về Chưa xếp lịch.', { mon });
    case 'bao-vang': return vang?.khongDuThi
      ? t('Tuần thi đã qua: ghi Không dự thi cho {mon} — không dời, không tính lần vắng.', { mon })
      : laThuong
        ? t('Ghi "-" cho {mon}: môn này dời sang {x} ngay.', { mon, x: vang?.tuanMoi ?? t('tuần sau') })
        : t('Ghi "-" cho {mon} và chốt ngay. Lần vắng đầu máy tự dời sang tuần kế tiếp; lần 2 huỷ phần thi này.', { mon });
    case 'huy-diem': return t('Ô điểm trở về trống. Điểm cũ vẫn nằm trong Lịch sử cùng lý do.');
    case 'khong-mock-lai': return t('{mon} đã huỷ vì vắng 2 lần sẽ không thi lại; đợt tính trên các kỹ năng còn lại.', { mon });
    case 'khoi-phuc': return t('Mở lại phần thi {mon} đã huỷ và đặt tuần thi mới trong cùng một lần.', { mon });
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
  const tt = thaoTac;
  const vang = tt === 'bao-vang' ? vangSeRa(laThuong, row.weekStart, homNay) : null;
  const ten = vang?.khongDuThi ? t('Không dự thi') : CHU_THAO_TAC[tt];
  const mon = tenMon(ct, skill);
  const batBuoc = canLyDo(tt);
  const coTuan = tt === 'dat-lich' || tt === 'xep-lai' || tt === 'doi-lich' || tt === 'khoi-phuc';
  /* K2-33: GVCN dời / xếp lại lượt có sẵn không vào tuần đã qua — tuần sớm nhất là tuần này. Quản lý được (T4): chỉ hiện chip vàng.
     PR-MTa T21: Khôi phục (chỉ Quản lý) cũng chọn được tuần đã qua — em đã thi thật. */
  const tuanNay = homNay && !quanLy && tt !== 'khoi-phuc' ? mondayOfDate(homNay) : null;
  const quaTuan = quanLy && coTuan && tt !== 'khoi-phuc' && !!tuan && tuan.periodId !== row.periodId && !!homNay
    && kiemTuanXep({ ketThuc: [addDaysStr(tuan.weekStart.slice(0, 10), 6)], homNay, quanLy: true }).quaTuan;
  const chonW = tt === 'huy-diem' && !laThuong && oCoDiem.length > 1;

  const loi: LoiTruong[] = [
    ...(kiemLyDoThaoTac(tt, lyDo) ? [{ khoa: 'ly-do', nhan: t('Lý do'), lyDo: t('Chưa điền') }] : []),
    ...(coTuan && (!tuan || (tt === 'doi-lich' && tuan.periodId === row.periodId)) ? [{ khoa: 'tuan', nhan: t('Tuần thi mới'), lyDo: t('Chọn tuần khác tuần hiện tại') }]
      : coTuan && tuanNay && tuan!.weekStart < tuanNay ? [{ khoa: 'tuan', nhan: t('Tuần thi mới'), lyDo: t('Tuần đã qua — chọn từ tuần này trở đi') }] : []),
    ...(tt === 'doi-han' && !han ? [{ khoa: 'han', nhan: t('Hạn chấm mới'), lyDo: t('Chưa chọn') }] : []),
    ...(chonW && !o.length ? [{ khoa: 'o', nhan: t('Ô cần huỷ'), lyDo: t('Chưa chọn') }] : []),
  ];
  const lyDoGui = lyDo.trim() || undefined;

  const goi = async (force: boolean): Promise<string> => {
    const goc = `/attempts/${attemptId}/skills/${skill}`;
    switch (tt) {
      case 'dat-lich':
      case 'xep-lai':
      case 'doi-lich':
        await api.post(`${goc}/week`, { periodId: tuan!.periodId, reason: lyDoGui ?? null, force });
        return `${tt === 'doi-lich' ? t('Đã dời lịch thi') : t('Đã lên lịch thi')} ${mon} ${tt === 'doi-lich' ? t('sang') : t('vào')} ${tuanLich(tuan!.weekStart, homNay)}`;
      case 'khoi-phuc':
        await api.post(`${goc}/restore`, { periodId: tuan!.periodId, reason: lyDoGui ?? null });
        return t('Đã khôi phục {mon} và đặt {tuanLich}', { mon, tuanLich: tuanLich(tuan!.weekStart, homNay) });
      case 'doi-han':
        await api.post(`${goc}/deadline`, { deadline: han, reason: lyDoGui ?? null });
        return t('Đã dời hạn chấm {mon} tới {ngay}', { mon, ngay: ngay(han) });
      case 'bo-ky-nang':
        await api.post(`${goc}/skip`, { skipped: true, reason: lyDoGui, xoaDiem });
        return t('Đã huỷ {mon}', { mon });
      case 'dua-lai':
        await api.post(`${goc}/skip`, { skipped: false });
        return t('{mon} đã đưa lại vào đợt', { mon });
      case 'bao-vang': {
        /* OV-11a (CA3-1): một câu thông báo cho mọi cổng ghi vắng — nói đúng hậu quả máy chủ trả (`cauDaGhiVang`). */
        if (laThuong) {
          const r = await api.put<any>(`/regular/attempts/${attemptId}/scores/${skill}`, { noShow: true, lyDo: lyDoGui });
          return cauDaGhiVang(mon, hocVien ?? undefined, r?.khongDuThi ? { kq: 'khong-du-thi' } : r?.moved ? { kq: 'doi', tuanMoi: r.tuanMoi } : null);
        }
        const r = await api.post<{ daDoi: boolean; tuanMoi: string | null; choDuyet: boolean; huyVang?: boolean; huyCu?: boolean }>(`${goc}/bao-vang`, { lyDo: lyDoGui });
        return cauDaGhiVang(mon, hocVien ?? undefined, r.huyCu ? { kq: 'huy-cu' }
          : r.daDoi ? { kq: 'doi', tuanMoi: tuanLich(r.tuanMoi, homNay) }
          : r.huyVang ? { kq: 'huy' }   // PR-MTa T3: vắng lần 2 → huỷ (ô MT "S huỷ")
          : r.choDuyet ? { kq: 'cho-ql' } : null);
      }
      case 'khong-mock-lai':
        await api.post(`${goc}/khong-mock-lai`, { lyDo: lyDoGui ?? null });
        return t('{mon}: không mock lại', { mon });
      case 'huy-diem': {
        if (laThuong) {
          await api.put(`/regular/attempts/${attemptId}/scores/${skill}`, { score: null, total: null, lyDo: lyDoGui });
        } else {
          /* Một yêu cầu, một giao dịch ở máy chủ — W1 + W2 không bao giờ còn nửa điểm (rà #126). */
          await api.post(`${goc}/huy-diem`, { o: chonW ? o : oCoDiem.length ? oCoDiem : undefined, lyDo: lyDoGui });
        }
        return t('Đã huỷ điểm {mon}', { mon });
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
      if ((tt === 'doi-lich' || tt === 'dat-lich' || tt === 'xep-lai') && /Xác nhận lại/.test(e.message)) setCanhBao(e.message);
      else if (tt === 'bo-ky-nang' && e instanceof ApiError && e.status === 409) setXoaDiem(true);
      else setLoiMay(e.message);
    } finally { setBusy(false); }
  };
  const nguyHiem = tt === 'bo-ky-nang' || tt === 'huy-diem' || tt === 'khong-mock-lai';
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
            {busy ? t('Đang lưu…') : canhBao ? t('Vẫn dời vào tuần này') : xoaDiem ? t('Xoá điểm và huỷ kỹ năng') : ten}
          </button>
        ),
      }}>
      <div className="space-y-3 pt-3">
        <p className="m-0 text-sm text-slate-300">{cauHeQua(tt, mon, laThuong, vang)}</p>
        {coTuan && (
          <Truong nhan={t('Tuần thi mới')} batBuoc as="div" loi={lf.loiCua(loi, 'tuan')}>
            <div {...lf.o(loi, 'tuan')}>
              <TuanNho d={{ periodId: tuan?.periodId ?? null, weekStart: tuan?.weekStart ?? null }} goc={row.weekStart} toiThieu={tuanNay}
                onTuan={(x) => { setTuan(x); setCanhBao(null); }} />
            </div>
            {tt === 'doi-lich' && row.weekStart && <span className="mt-1 block text-xs text-slate-500">{t('Đang thi')}{' '}{tuanLich(row.weekStart)}</span>}
          </Truong>
        )}
        {tt === 'doi-han' && (
          <Truong nhan={t('Hạn chấm mới')} batBuoc loi={lf.loiCua(loi, 'han')}>
            <ONgay kieu="ngay" value={han} onChange={setHan} id={lf.oId('han')} onBlur={lf.roi('han')} invalid={!!lf.loiCua(loi, 'han')} />
            {row.deadline && <span className="mt-1 block text-xs text-slate-500">{t('Hạn đang áp dụng')}{' '}{ngay(row.deadline)}</span>}
          </Truong>
        )}
        {chonW && (
          <Truong nhan={t('Ô cần huỷ')} batBuoc as="div" loi={lf.loiCua(loi, 'o')}>
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
        {tt !== 'dua-lai' && (
          <Truong nhan={t('Lý do')} batBuoc={batBuoc} tuyChon={!batBuoc} loi={lf.loiCua(loi, 'ly-do')}>
            <textarea className="field w-full" rows={2} maxLength={300} {...lf.o(loi, 'ly-do')} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
              placeholder={tt === 'bao-vang' || tt === 'khong-mock-lai' ? t('Ví dụ: em ốm, phụ huynh đã báo') : tt === 'huy-diem' ? t('Ví dụ: nhập nhầm bài của em khác') : t('Ví dụ: trùng lịch phòng thi')} />
          </Truong>
        )}
        {canhBao && <p className="m-0 text-xs text-amber-200" role="status">{canhBao}</p>}
        {xoaDiem && <p className="m-0 text-xs text-amber-200" role="status">{t('{mon} đã có điểm. Xoá điểm và huỷ kỹ năng?', { mon })}</p>}
        {quaTuan && (
          <div className="flex flex-wrap gap-1.5">
            <Nhan tone="soon" title={CAU_TUAN_DA_QUA}>{t('Tuần đã qua')}</Nhan>
          </div>
        )}
      </div>
    </KhungPanel>
  );
}
