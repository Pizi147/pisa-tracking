import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { NutChon, TargetText } from '../../ui/ui.tsx';
import { chuTargetKck, dsLoi, tachKck, type LuatTruong, type TruongDeXuat } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * ĐỀ XUẤT SỬA THÔNG TIN HV (PR-DUYET, T44) — GV của lớp gửi, Quản lý duyệt ở Công việc › Chờ duyệt.
 * Target và lộ trình phải qua đây (PR-CT: chuyển lớp có Đề xuất chuyển lớp… riêng, GVCN không còn tự chuyển). Mở từ ⋮ hồ sơ HV hoặc liên kết "Đề xuất sửa" ở panel Lộ trình.
 */
const TRUONG: { key: TruongDeXuat; nhan: string }[] = [
  { key: 'target', nhan: 'Target' }, { key: 'lo-trinh', nhan: t('Lộ trình') },
  { key: 'khac', nhan: t('Thông tin khác') },
];

export function DeXuatSuaPanel({ studentId, studentName, lop, truongDau, hienTai, sua, onClose, onDone }: {
  studentId: number; studentName: string; lop?: string | null;
  truongDau?: TruongDeXuat;
  /** Giá trị đang có — hiện cạnh ô mới để người gửi thấy mình đổi từ đâu. */
  hienTai?: { target?: number | null; khongCamKet?: boolean; route?: string | null };
  /** OV-7a: người gửi Sửa thẻ còn chờ — điền sẵn, giữ trường (đổi trường thì Rút rồi gửi lại). */
  sua?: { id: number; truong: TruongDeXuat; moi: string; lyDo: string };
  onClose: () => void; onDone?: () => void;
}) {
  const toast = useToast();
  const lf = useLoiForm();
  const [truong, setTruong] = useState<TruongDeXuat | null>(sua?.truong ?? truongDau ?? null);
  /* OV-9: Target = số + ô tích KCK riêng; thẻ cũ "6.5 KCK" / "KCK" tách ra khi Sửa. */
  const tachSua = sua?.truong === 'target' ? tachKck(sua.moi) : null;
  const [moi, setMoi] = useState(tachSua ? String(tachSua.so ?? '') : sua?.moi ?? '');
  /* OV-11d (Q8): dấu KCK chỉ QL / Quản trị / TVV đổi — đề xuất của GV giữ dấu đang có (chỉ đọc; máy chủ 403 nếu khác). */
  const kck = tachSua ? tachSua.kck : !!hienTai?.khongCamKet;
  const moiGui = truong === 'target' ? chuTargetKck(moi.trim() || null, kck) : moi;
  const [lyDo, setLyDo] = useState(sua?.lyDo ?? '');
  const [busy, setBusy] = useState(false);
  const routes = useApi<{ code: string; name: string }[]>(truong === 'lo-trinh' ? '/ref/routes' : null, [truong]);

  const luat: LuatTruong[] = [
    { khoa: 'truong', nhan: t('Thông tin cần sửa'), chon: true },
    truong === 'lo-trinh' ? { khoa: 'moi', nhan: t('Lộ trình mới'), chon: true } : { khoa: 'moi', nhan: t('Giá trị mới'), toiThieu: truong === 'target' ? 1 : 2 },
    { khoa: 'ly-do', nhan: t('Lý do'), toiThieu: 1 },   // T7 (PR-MTa): bắt buộc, không tối thiểu ký tự
  ];
  const loi = [
    ...dsLoi(luat, { truong, moi: moiGui, 'ly-do': lyDo }),
    ...(truong === 'target' && moi !== '' && !hopLeTarget(moi) ? [{ khoa: 'moi', nhan: t('Target mới'), lyDo: t('Band từ 0 đến 9, bước 0.5') }] : []),
  ];

  const gui = async () => {
    lf.bam();
    if (loi.length > 0 || busy) return;
    setBusy(true);
    try {
      const than = { truong, moi: truong === 'target' ? (kck ? moiGui : Number(moi)) : moi.trim(), lyDo: lyDo.trim() };
      if (sua) await api.put(`/yeu-cau/${sua.id}`, than);
      else await api.post(`/students/${studentId}/de-xuat-sua`, than);
      invalidate('/yeu-cau');
      toast.push('ok', sua ? t('Đã lưu đề xuất') : t('Đã gửi — xem ở Công việc › Yêu cầu của tôi'));
      onDone?.();
      onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={sua ? t('Sửa đề xuất') : t('Đề xuất sửa thông tin')} hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={gui} disabled={busy}>
          {busy ? t('Đang lưu…') : sua ? t('Lưu') : t('Gửi Quản lý')}
        </button>,
      }}>
      <Khoi tieuDe={t('Đề xuất sửa')} luat={t('Target và lộ trình do Quản lý sửa. Quản lý duyệt trong 5 ngày; kết quả báo ở chuông và Yêu cầu của tôi.')}>
        <Truong nhan={t('Thông tin cần sửa')} batBuoc loi={lf.loiCua(loi, 'truong')}>
          <div className="flex flex-wrap gap-1.5" {...lf.o(loi, 'truong')}>
            {TRUONG.map((x) => (
              <NutChon key={x.key} nho chon={truong === x.key} disabled={!!sua && sua.truong !== x.key} onClick={() => { setTruong(x.key); setMoi(''); }}>{dich(x.nhan)}</NutChon>
            ))}
          </div>
        </Truong>
        {truong && (
          <Truong nhan={truong === 'target' ? t('Target mới') : truong === 'lo-trinh' ? t('Lộ trình mới') : t('Giá trị mới')} batBuoc loi={lf.loiCua(loi, 'moi')}
            as={truong === 'target' ? 'div' : undefined}>
            {truong === 'target' ? (
              <div className="flex flex-wrap items-center gap-2">
                <input className="field w-24 tabular-nums" aria-label={t('Target mới')} type="number" inputMode="decimal" step="0.5" min={0} max={9}
                  {...lf.o(loi, 'moi')} value={moi} onChange={(e) => setMoi(e.target.value)} />
                {kck && <span className="text-sm text-slate-300">KCK</span>}
                {(hienTai?.target != null || hienTai?.khongCamKet) && (
                  <span className="text-xs text-slate-400 tabular-nums">{t('đang là')}{' '}<TargetText band={hienTai.target} kck={hienTai.khongCamKet} /></span>
                )}
              </div>
            ) : truong === 'lo-trinh' ? (
              <div className="flex flex-wrap gap-1.5" {...lf.o(loi, 'moi')}>
                {(routes.data ?? []).filter((r) => r.code !== hienTai?.route).map((r) => (
                  <NutChon key={r.code} nho chon={moi === r.code} onClick={() => setMoi(r.code)} title={r.name}>{r.code}</NutChon>
                ))}
                {hienTai?.route && <span className="self-center text-xs text-slate-400">{t('đang là {route}', { route: hienTai.route })}</span>}
              </div>
            ) : (
              <input className="field w-full" maxLength={200} {...lf.o(loi, 'moi')} value={moi} onChange={(e) => setMoi(e.target.value)}
                placeholder={t('Ghi rõ cần sửa gì')} />
            )}
          </Truong>
        )}
        <Truong nhan={t('Lý do')} batBuoc loi={lf.loiCua(loi, 'ly-do')}>
          <textarea className="field w-full" rows={3} {...lf.o(loi, 'ly-do')} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
            placeholder={t('Ví dụ: PH đăng ký thi 12/2026, cần 7.0 để nộp hồ sơ')} />
        </Truong>
      </Khoi>
    </KhungPanel>
  );
}

function hopLeTarget(s: string): boolean {
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n <= 9 && Math.round(n * 2) === n * 2;
}
