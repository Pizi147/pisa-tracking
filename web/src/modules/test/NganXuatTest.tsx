import { useState, type ComponentProps } from 'react';
import { useSession } from '../../lib/session.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { NganXuatMt } from './NganXuatMt.tsx';
import { NganXuatKeHoach } from './keHoach/NganXuatKeHoach.tsx';
import { t } from '@shared/i18n/index.ts';

type Tab = 'diem' | 'lich';

/**
 * G1-08 (mockup `thiet-ke/2026-11-13-test-g1/g1-08-xuat.html`, chủ SP duyệt #1434): MỘT ngăn "Xuất Excel" cho khu Test, thay 3 ngăn / 3 nút cũ.
 * Tab Điểm Test (kết quả từng lượt — `NganXuatMt`) · Lịch Test (lịch MT1…MT10 — `NganXuatKeHoach`). Lịch chỉ người xếp lịch (QL, Quản trị;
 * GV không — chủ SP 05/11), chỉ khi nơi mở có phạm vi Fast Track (`lich` khác null). Không có tab Lịch → không vẽ hàng tab.
 */
export function NganXuatTest({ dau = 'diem', diem, lich, onDong }: {
  /** Tab mở sẵn: Lịch Test tuần → Điểm; Kế hoạch Test → Lịch. */
  dau?: Tab;
  diem: Omit<ComponentProps<typeof NganXuatMt>, 'onDong' | 'tieuDe' | 'tabs' | 'vungTab'>;
  lich: { branchId: number | null; classIds: number[] } | null;
  onDong: () => void;
}) {
  const { session } = useSession();
  const coLich = !!lich && !!session?.nav?.testPlan;
  const [tab, setTab] = useState<Tab>(coLich ? dau : 'diem');
  if (!coLich) return <NganXuatMt {...diem} onDong={onDong} />;
  const nhan: Record<Tab, string> = { diem: t('Điểm Test'), lich: t('Lịch Test') };
  const tabs = <HangTab<Tab> panelId="xuat-test-vung" ariaLabel={t('Xuất gì')} value={tab} onChange={setTab}
    tabs={(['diem', 'lich'] as const).map((k) => ({ key: k, label: nhan[k] }))} />;
  const vungTab = { id: 'xuat-test-vung', nhan: nhan[tab] };
  return tab === 'lich'
    ? <NganXuatKeHoach {...lich!} tabs={tabs} vungTab={vungTab} onDong={onDong} />
    : <NganXuatMt {...diem} tieuDe={t('Xuất Excel')} tabs={tabs} vungTab={vungTab} onDong={onDong} />;
}
