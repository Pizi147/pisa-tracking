import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KhungPanel, NhapViec } from '../../ui/KhungPanel.tsx';
import { dauViec } from '../../ui/KhuonViec.tsx';
import { LOP_MUC_HAN } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { duongHoSoHocVien, mucHan, ngay } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { PanelBaoPhTvv } from './PanelBaoPhTvv.tsx';

/**
 * BÁO PH NHIỀU EM (TUYEN-2, mockup v27 T11a — N72 ⑤, khuôn A): một dòng lớp × nguồn × đợt ("4 em · Trao đổi gia đình · MT2") → bảng em; bấm "Ghi" mở khay NGAY dưới
 * dòng em: khối Phụ trách · Hạn · Theo dõi + Tuyến + Máy điền sẵn + form Kết quả + Việc con của RIÊNG em đó (`PanelBaoPhTvv nhung` — cùng đường máy chủ một em, không đường mới).
 * Một khay mở một lúc; chữ đang gõ giữ theo việc từng em (`NhapViec`). Em lưu xong (Đã báo PH) rời danh sách ở lần tải lại sau.
 */
export function PanelBaoPhNhieu({ it, onDong, onDaLam, onTiep }: { it: WorkItem; onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null }) {
  const { homNay } = useNgayNghiepVu();
  const ds = it.con ?? [];
  const [mo, setMo] = useState<string | null>(ds[0]?.key ?? null);
  const nguon = ds[0]?.contextLabel ?? it.contextLabel ?? '';
  const dau = dauViec({ lop: it.classCode, ngCanh: t('{n} em', { n: ds.length }) });
  return (
    <KhungPanel hd="bao-ph" tieuDe={t('Báo PH · {bac}', { bac: nguon })} dau={dau} onDong={onDong}
      chan={{ huy: null, chinh: onTiep ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onTiep}>{t('Việc tiếp ›')}</button> : undefined }}>
      <div className="pt-4">
        <div role="table" aria-label={t('Học viên')} className="overflow-hidden rounded-[10px] border text-sm" style={{ borderColor: 'var(--line)' }}>
          <div role="row" className="grid h-9 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_max-content_64px] items-center gap-x-4 px-3.5 text-xs font-semibold text-faint max-sm:hidden">
            <span role="columnheader">{t('Học viên')}</span><span role="columnheader">{t('Trạng thái')}</span><span role="columnheader">{t('Hạn')}</span><span role="columnheader"><span className="sr-only">{t('Ghi')}</span></span>
          </div>
          {ds.map((c) => {
            const dangMo = mo === c.key;
            const muc = c.due && homNay ? mucHan(c.due, homNay) : 'xa';
            return (
              <div key={c.key} className="border-t" style={{ borderColor: 'var(--line)' }}>
                <div role="row" className={`grid min-h-[52px] grid-cols-[minmax(0,1fr)_minmax(0,1fr)_max-content_64px] items-center gap-x-4 px-3.5 py-1.5 max-sm:grid-cols-[minmax(0,1fr)_max-content] max-sm:gap-y-1 ${dangMo ? 'bg-[color:var(--accent-soft)] shadow-[inset_3px_0_0_var(--accent)]' : ''}`}>
                  <span role="cell" className="min-w-0">
                    <Link to={duongHoSoHocVien(c.studentId!, { tab: 'y-thuc', sub: 'phoi-hop' })} className="ten-hv font-semibold text-[color:var(--text)] no-underline hover:underline">{c.studentName}</Link>
                  </span>
                  <span role="cell" className="text-[13px] text-dim max-sm:col-start-1 max-sm:row-start-2">{c.statusLabel}</span>
                  <span role="cell" className={`whitespace-nowrap text-[13px] tabular-nums ${LOP_MUC_HAN[muc]} max-sm:col-start-2 max-sm:row-start-2 max-sm:justify-self-end`}>{c.due ? ngay(c.due) : ''}</span>
                  <span role="cell" className="justify-self-end max-sm:col-start-2 max-sm:row-start-1">
                    <button type="button" className={`btn btn-sm min-h-[44px] sm:min-h-[30px] ${dangMo ? '' : 'btn-primary'}`} aria-expanded={dangMo}
                      onClick={() => setMo(dangMo ? null : c.key)}>{dangMo ? t('Đóng') : t('Ghi')}</button>
                  </span>
                </div>
                {dangMo && (
                  <div className="border-t px-3.5 py-3" style={{ borderColor: 'var(--line)', background: 'color-mix(in srgb, var(--accent-soft) 38%, var(--surface))' }}>
                    <NhapViec khoa={c.key}>
                      <PanelBaoPhTvv nhung it={{ ...it, ...c, con: undefined } as WorkItem} onDong={() => setMo(null)} onDaLam={onDaLam} onTiep={null} />
                    </NhapViec>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </KhungPanel>
  );
}
