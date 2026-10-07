import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { CHO_TAO_PRE_FOU, ghepMaLop, kiemSoLop, kyHieuLop, locSoLop, tachSoLop, type LoiTruong } from '@shared/domain/index.ts';
import { PhanDoan } from './ClassCreatePanel.tsx';

/**
 * ⋮ › SỬA THÔNG TIN LỚP (PR-LOP YC-2, K2-18; mockup 21 mục 4). Tên lớp máy ghép `{CN} {ký hiệu} {số}` — người dùng chỉ sửa
 * phần SỐ. Chương trình và lộ trình chỉ đổi được khi lớp chưa có học viên (Q6: khoá, không "đổi kèm cảnh báo"). Máy chủ kiểm
 * lại mọi luật (`PATCH /classes/:id/thong-tin`) và nói rõ vì sao khi từ chối.
 */
export function SuaThongTinLopPanel({ lop, onClose, onDone }: {
  lop: {
    id: number; code: string; branchCode: string; route: string | null; note: string | null;
    programmeCode: string | null; soHocVien: number;
  };
  onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const programmes = useApi<{ code: string; name: string }[]>('/ref/programmes');
  const routes = useApi<{ code: string; name: string }[]>('/ref/routes');
  /** Lớp tên lạ (chưa theo mẫu) → null: không sửa số ở đây. */
  const soCu = tachSoLop(lop.code, lop.branchCode);
  const [so, setSo] = useState(soCu ?? '');
  const [chuongTrinh, setChuongTrinh] = useState(lop.programmeCode ?? '');
  const [loTrinh, setLoTrinh] = useState(lop.route ?? 'LT1');
  const [note, setNote] = useState(lop.note ?? '');
  const [busy, setBusy] = useState(false);
  const lf = useLoiForm();
  const doiDuoc = lop.soHocVien === 0;
  const ft = chuongTrinh === 'FT';

  const loiSo = soCu === null ? null : kiemSoLop(so);
  const loi: LoiTruong[] = loiSo ? [{ khoa: 'so', nhan: 'Số lớp', lyDo: loiSo }] : [];
  /* Số đã gõ mà sai mẫu → hiện ngay; ô trống → khi rời ô / sau khi bấm Lưu (YC-12.5.2). */
  const loiSoHien = so !== '' ? loiSo : lf.loiCua(loi, 'so');
  const kh = kyHieuLop(chuongTrinh, ft ? loTrinh : null);
  const ma = soCu !== null && !loiSo && kh ? ghepMaLop(lop.branchCode, chuongTrinh, ft ? loTrinh : null, so) : null;

  const luu = async () => {
    lf.bam();
    if (loi.length) return;   // báo tại ô + "1 ô cần sửa ↑" ở chân, không khoá nút
    setBusy(true);
    try {
      await api.patch(`/classes/${lop.id}/thong-tin`, {
        ...(soCu !== null ? { so } : {}),
        note: note.trim() || null,
        ...(chuongTrinh && chuongTrinh !== lop.programmeCode ? { programmeCode: chuongTrinh } : {}),
        ...(ft && loTrinh !== lop.route ? { loTrinh } : {}),   // lớp FT cũ chưa có lộ trình: không gửi thì không bị khoá Q6
      });
      invalidate('/classes'); invalidate('/ref/classes'); invalidate('/hoc-vien-lop');
      toast.push('ok', 'Đã lưu thông tin lớp');
      onDone(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Sửa thông tin lớp" lop={lop.code} onDong={onClose}
      chan={{
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>Lưu</button>,
        conThieu: lf.conThieu(loi),
      }}>
      <Khoi tieuDe="Thông tin lớp"
        luat={doiDuoc ? undefined : 'Lớp đã có học viên nên không đổi được chương trình. Lớp thường học tiếp khoá sau thì dùng Chuyển tiếp lớp.'}>
        {soCu === null ? (
          <Truong nhan="Tên lớp" phu="Tên lớp cũ chưa theo mẫu — Quản trị đổi lúc nâng cấp">
            <input className="field w-full" value={lop.code} readOnly />
          </Truong>
        ) : (
          <div>
            <Truong nhan="Số lớp" batBuoc phu="1–4 chữ số, được thêm một chữ cái cuối (101A)" loi={loiSoHien}>
              <input className="field w-28 tabular-nums" {...lf.o(loi, 'so')} aria-invalid={!!loiSoHien} inputMode="numeric" autoComplete="off"
                value={so} onChange={(e) => setSo(locSoLop(e.target.value))} />
            </Truong>
            <p className="m-0 mt-2 text-sm tabular-nums" aria-live="polite">
              {ma
                ? <>Lớp sẽ là <strong className="text-slate-100">{ma}</strong></>
                : <span className="text-slate-500">Lớp sẽ là {lop.branchCode} {kh ?? ''} …</span>}
            </p>
          </div>
        )}
        <Truong nhan="Chương trình">
          <select className="field w-full" value={chuongTrinh} disabled={!doiDuoc} onChange={(e) => setChuongTrinh(e.target.value)}>
            {(programmes.data ?? []).map((p) => (
              <option key={p.code} value={p.code} disabled={p.code === 'PREFOU' && !CHO_TAO_PRE_FOU && p.code !== lop.programmeCode}>
                {p.name}
              </option>
            ))}
          </select>
        </Truong>
        {ft && (
          <Truong nhan="Lộ trình" as="div">
            <PhanDoan nhan="Lộ trình" giaTri={loTrinh} onChon={setLoTrinh}
              muc={(routes.data ?? []).map((r) => ({ v: r.code, nhan: r.code, title: r.name, tat: !doiDuoc && r.code !== loTrinh }))} />
            {!doiDuoc && (
              <span className="mt-1 block text-xs text-slate-400">
                Lớp đã có {lop.soHocVien} học viên — muốn đổi lộ trình thì chuyển các em sang lớp {kyHieuLop('FT', lop.route === 'RF' ? 'LT1' : 'RF')} khác
              </span>
            )}
          </Truong>
        )}
        <Truong nhan="Ghi chú" tuyChon>
          <textarea className="field w-full" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Truong>
      </Khoi>
    </KhungPanel>
  );
}
