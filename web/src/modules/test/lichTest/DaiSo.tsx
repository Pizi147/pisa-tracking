import type { TongQuanLich } from './kieu.ts';
import { DaiChiSo, ODai, SoTinh } from '../../../ui/DaiChiSo.tsx';
import { mauOSo, VUNG_BAM_SO } from '../../../ui/SoLieu.tsx';
import { t } from '@shared/i18n/index.ts';

export type OSo = 'da-cham' | 'no';

/**
 * DẢI SỐ của Lịch tuần — AUDIT-UI B8 (T1, chủ SP 08/11): HAI ô "Đã chấm 117 / 177" · "Quá hạn 3" (đỏ khi > 0) — GD-4 e: dải chỉ số chung (`ui/DaiChiSo`).
 * Ô "còn chấm" bỏ (= tổng − đã chấm): số còn ở `title` ô đã chấm; bấm ô đã chấm mở nhóm Test tuần này và các hàng còn bài (thao tác cũ của ô bỏ).
 * Ô hai = Tổng quan "Bài quá hạn" của khung đang xem (UX-2, OV-14b) → mở DANH SÁCH các ô đó. Số đã cộng sẵn ở máy chủ.
 */
export function DaiSo({ tq, onBam, dangTaiNo = false, nhom }: {
  tq: TongQuanLich; onBam: (o: OSo) => void;
  /** B13 (U06 #1): MỘT nhãn nhóm đứng đầu dải — "Của bạn:" / "Cả chi nhánh:" (chữ "Bạn" không lặp trong ô). */
  nhom?: string;
  /** UX-2 (1): số "Quá hạn chấm" đến từ đường riêng — đang tải thì "…", không hiện tạm một số khác. */
  dangTaiNo?: boolean;
}) {
  return (
    /* GD-4 e (mockup v21 `test.html` `.dai-cs.tst`, H3): dải mỏng một hàng — nhãn nhóm đậm · "Đã chấm n / N" · "Quá hạn n" (đỏ khi > 0). Số 0 không bấm. */
    <DaiChiSo nhan={t('Tiến độ chấm điểm')}>
      {nhom && <ODai nhom nhan={nhom.replace(/:$/, '')} />}
      <ODai nhan={t('Đã chấm')} title={tq.conPhaiCham > 0 ? t('Còn {conBai} bài', { conBai: tq.conPhaiCham }) : undefined}>
        <SoBam n={tq.tong} onClick={() => onBam('da-cham')} nhan={`${tq.daCham} / ${tq.tong}`} />
      </ODai>
      <ODai nhan={t('Quá hạn')}>
        {dangTaiNo ? <SoTinh n="…" /> : <SoBam n={tq.no.bai} onClick={() => onBam('no')} xau />}
      </ODai>
    </DaiChiSo>
  );
}

/** Ô số của dải (cùng dáng `OSo`): bấm → mở nhóm / danh sách ngay trang. 0 không bấm. */
function SoBam({ n, nhan, onClick, xau }: { n: number; nhan?: string; onClick: () => void; xau?: boolean }) {
  if (n <= 0) return <SoTinh n={nhan ?? n} />;
  return <button type="button" onClick={onClick} className={`${VUNG_BAM_SO} ${mauOSo(xau ? 'text-bad' : '')}`}>{nhan ?? n}</button>;
}
