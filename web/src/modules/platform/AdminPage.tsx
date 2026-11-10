import { useSearchParams } from 'react-router-dom';
import { HangTab } from '../../ui/HangTab.tsx';
import { invalidate } from '../../lib/api.ts';
import { AccountsAdmin } from './AccountsAdmin.tsx';
import { CatalogAdmin } from './CatalogAdmin.tsx';
import { ChiNhanhAdmin } from './ChiNhanhAdmin.tsx';
import { BangQuyDoiAdmin } from './BangQuyDoiAdmin.tsx';
import { MoSuaLichTest } from './MoSuaLichTest.tsx';
import { DaXoaAdmin } from './DaXoaAdmin.tsx';
import { QuyenTheoVai } from './QuyenTheoVai.tsx';
import { NhatKyChung } from './NhatKyChung.tsx';
import { t } from '@shared/i18n/index.ts';
import { useSession } from '../../lib/session.tsx';

/**
 * QUẢN TRỊ HỆ THỐNG — giữ vị trí cũ (menu tài khoản › `/quan-tri`, chủ SP 11/11: "vẫn ở vị trí cũ"), hàng tab trên URL (`?tab=`, OV-11b QT-10g).
 *
 *   TÀI KHOẢN  duyệt đăng ký, tạo tài khoản, đổi vai / kỹ năng tại dòng (QTV2-TK), quyền cấp riêng (mục 7.1, 7.3).
 *   CHI NHÁNH  tên hiển thị, địa chỉ, SĐT từng cơ sở — đầu tệp Báo cáo PH (CHI-NHANH-LIEN-HE, chủ SP 07/11) + đơn vị báo cáo.
 *   CHƯƠNG TRÌNH  chương trình + FT theo lộ trình — tên, đạt từ, số tuần, mốc Test; áp cho lớp mở sau (OV-6b1); không thêm mã lộ trình (K1-48).
 *   QUYỀN & NHẬT KÝ  công tắc Mở sửa lịch Test · quyền theo vai (QTV2-QUYEN: chọn vai → công tắc) · nhật ký chung có lọc (`/admin/nhat-ky`).
 *   BẢNG QUY ĐỔI  số câu L / R → band (BAND-QUY-DOI) — Quản lý (không có `nav.admin`) vào trang này chỉ thấy tab này + Đã xoá, chỉ đọc.
 *   ĐÃ XOÁ  thùng rác 30 ngày (Q-RL2a) — Case / PA / vi phạm / tệp, khôi phục tại dòng; máy chủ lọc mục theo quyền người xem.
 */
const TABS = [
  { key: 'accounts', label: t('Tài khoản') },
  { key: 'catalog', label: t('Chương trình') },
  { key: 'chi-nhanh', label: t('Chi nhánh') },
  { key: 'band', label: t('Bảng quy đổi') },
  { key: 'config', label: t('Quyền & nhật ký') },
  { key: 'da-xoa', label: t('Đã xoá') },
] as const;

export default function AdminPage() {
  const [params, setParams] = useSearchParams();
  const quanTri = !!useSession().session?.nav?.admin;
  const tabs = quanTri ? TABS : TABS.filter((x) => x.key === 'band' || x.key === 'da-xoa');
  const tab = tabs.find((x) => x.key === params.get('tab'))?.key ?? tabs[0].key;
  /* Đổi tab: bỏ bộ lọc của tab cũ (bộ lọc Tài khoản cũng ở URL), thêm một mục lịch sử để Quay lại về tab trước. */
  const setTab = (k: (typeof TABS)[number]['key']) => setParams(k === 'accounts' ? {} : { tab: k });

  return (
    <div className="page space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100">{quanTri ? t('Quản trị hệ thống') : tab === 'da-xoa' ? t('Quản trị') : t('Bảng quy đổi band')}</h1>
        {!quanTri && tab === 'band' && <p className="text-xs text-slate-500 mt-0.5">{t('Quản trị hệ thống sửa; Quản lý xem.')}</p>}
      </div>

      {tabs.length > 1 && (
        <div data-hd="qt-tab">
          <HangTab panelId="qt-vung" ariaLabel={t('Quản trị hệ thống')} value={tab} onChange={setTab}
            tabs={tabs.map((x) => ({ key: x.key, label: x.label }))} />
        </div>
      )}

      {/* DON-NHO-3 (TAB-A11Y): vùng tab cùng space-y-4 của trang → khoảng cách không đổi. */}
      <div id="qt-vung" role="tabpanel" aria-label={t('Quản trị hệ thống')} className="space-y-4">
        {tab === 'accounts' && <AccountsAdmin />}
        {tab === 'catalog' && <CatalogAdmin />}
        {tab === 'chi-nhanh' && <ChiNhanhAdmin />}
        {tab === 'band' && <BangQuyDoiAdmin />}
        {tab === 'da-xoa' && <DaXoaAdmin />}
        {tab === 'config' && (
          <>
            <MoSuaLichTest />
            {/* Sửa quyền xong → nhật ký chung có dòng mới. */}
            <QuyenTheoVai onDaLuu={() => invalidate('/admin/nhat-ky')} />
            <NhatKyChung />
          </>
        )}
      </div>
    </div>
  );
}
