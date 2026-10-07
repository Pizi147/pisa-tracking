import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { NutChon, TargetText } from '../../ui/ui.tsx';
import { GIAI_THICH_KCK, KCK, dsLoi, type LuatTruong, type TruongDeXuat } from '@shared/domain/index.ts';

/**
 * ĐỀ XUẤT SỬA THÔNG TIN HV (PR-DUYET, T44) — GV của lớp gửi, Quản lý duyệt ở Công việc › Chờ duyệt.
 * Target và lộ trình phải qua đây (PR-CT: chuyển lớp có Đề xuất chuyển lớp… riêng, GVCN không còn tự chuyển). Mở từ ⋮ hồ sơ HV hoặc liên kết "Đề xuất sửa" ở panel Lộ trình.
 */
const TRUONG: { key: TruongDeXuat; nhan: string }[] = [
  { key: 'target', nhan: 'Target' }, { key: 'lo-trinh', nhan: 'Lộ trình' },
  { key: 'lich-mt', nhan: 'Lịch MT' }, { key: 'khac', nhan: 'Thông tin khác' },
];

export function DeXuatSuaPanel({ studentId, studentName, lop, truongDau, hienTai, onClose, onDone }: {
  studentId: number; studentName: string; lop?: string | null;
  truongDau?: TruongDeXuat;
  /** Giá trị đang có — hiện cạnh ô mới để người gửi thấy mình đổi từ đâu. */
  hienTai?: { target?: number | null; khongCamKet?: boolean; route?: string | null };
  onClose: () => void; onDone?: () => void;
}) {
  const toast = useToast();
  const lf = useLoiForm();
  const [truong, setTruong] = useState<TruongDeXuat | null>(truongDau ?? null);
  const [moi, setMoi] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const routes = useApi<{ code: string; name: string }[]>(truong === 'lo-trinh' ? '/ref/routes' : null, [truong]);

  const luat: LuatTruong[] = [
    { khoa: 'truong', nhan: 'Thông tin cần sửa', chon: true },
    truong === 'lo-trinh' ? { khoa: 'moi', nhan: 'Lộ trình mới', chon: true } : { khoa: 'moi', nhan: 'Giá trị mới', toiThieu: truong === 'target' ? 1 : 2 },
    { khoa: 'ly-do', nhan: 'Lý do', toiThieu: 1 },   // T7 (PR-MTa): bắt buộc, không tối thiểu ký tự
  ];
  const loi = [
    ...dsLoi(luat, { truong, moi, 'ly-do': lyDo }),
    ...(truong === 'target' && moi !== '' && moi !== KCK && !hopLeTarget(moi) ? [{ khoa: 'moi', nhan: 'Target mới', lyDo: 'Band từ 0 đến 9, bước 0.5 — hoặc chọn Không cam kết (KCK)' }] : []),
  ];

  const gui = async () => {
    lf.bam();
    if (loi.length > 0 || busy) return;
    setBusy(true);
    try {
      await api.post(`/students/${studentId}/de-xuat-sua`, { truong, moi: truong === 'target' && moi !== KCK ? Number(moi) : moi.trim(), lyDo: lyDo.trim() });
      invalidate('/yeu-cau');
      toast.push('ok', 'Đã gửi — xem ở Công việc › Yêu cầu của tôi');
      onDone?.();
      onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Đề xuất sửa thông tin" hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={gui} disabled={busy}>
          {busy ? 'Đang gửi…' : 'Gửi Quản lý'}
        </button>,
      }}>
      <Khoi tieuDe="Đề xuất sửa" luat="Target và lộ trình do Quản lý sửa. Quản lý duyệt trong 5 ngày; kết quả báo ở chuông và Yêu cầu của tôi.">
        <Truong nhan="Thông tin cần sửa" batBuoc loi={lf.loiCua(loi, 'truong')}>
          <div className="flex flex-wrap gap-1.5" {...lf.o(loi, 'truong')}>
            {TRUONG.map((x) => (
              <NutChon key={x.key} nho chon={truong === x.key} onClick={() => { setTruong(x.key); setMoi(''); }}>{x.nhan}</NutChon>
            ))}
          </div>
        </Truong>
        {truong && (
          <Truong nhan={truong === 'target' ? 'Target mới' : truong === 'lo-trinh' ? 'Lộ trình mới' : 'Giá trị mới'} batBuoc loi={lf.loiCua(loi, 'moi')}
            as={truong === 'target' ? 'div' : undefined} phu={truong === 'target' ? `KCK: ${GIAI_THICH_KCK}.` : undefined}>
            {truong === 'target' ? (
              <div className="flex flex-wrap items-center gap-2">
                <input className="field w-24 tabular-nums" aria-label="Target mới" type="number" inputMode="decimal" step="0.5" min={0} max={9}
                  {...lf.o(loi, 'moi')} value={moi === KCK ? '' : moi} disabled={moi === KCK} onChange={(e) => setMoi(e.target.value)} />
                {!hienTai?.khongCamKet && (
                  <NutChon nho chon={moi === KCK} onClick={() => setMoi(moi === KCK ? '' : KCK)}>Không cam kết (KCK)</NutChon>
                )}
                {(hienTai?.target != null || hienTai?.khongCamKet) && (
                  <span className="text-xs text-slate-400 tabular-nums">đang là <TargetText band={hienTai.target} kck={hienTai.khongCamKet} /></span>
                )}
              </div>
            ) : truong === 'lo-trinh' ? (
              <div className="flex flex-wrap gap-1.5" {...lf.o(loi, 'moi')}>
                {(routes.data ?? []).filter((r) => r.code !== hienTai?.route).map((r) => (
                  <NutChon key={r.code} nho chon={moi === r.code} onClick={() => setMoi(r.code)} title={r.name}>{r.code}</NutChon>
                ))}
                {hienTai?.route && <span className="self-center text-xs text-slate-400">đang là {hienTai.route}</span>}
              </div>
            ) : (
              <input className="field w-full" maxLength={200} {...lf.o(loi, 'moi')} value={moi} onChange={(e) => setMoi(e.target.value)}
                placeholder={truong === 'lich-mt' ? 'Ví dụ: MT3 dời sang W2 OCT' : 'Ghi rõ cần sửa gì'} />
            )}
          </Truong>
        )}
        <Truong nhan="Lý do" batBuoc loi={lf.loiCua(loi, 'ly-do')}>
          <textarea className="field w-full" rows={3} {...lf.o(loi, 'ly-do')} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
            placeholder="Ví dụ: PH đăng ký thi 12/2026, cần 7.0 để nộp hồ sơ" />
        </Truong>
      </Khoi>
    </KhungPanel>
  );
}

function hopLeTarget(s: string): boolean {
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n <= 9 && Math.round(n * 2) === n * 2;
}
