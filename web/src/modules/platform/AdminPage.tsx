import { useSearchParams } from 'react-router-dom';
import { HangTab } from '../../ui/HangTab.tsx';
import { invalidate } from '../../lib/api.ts';
import { AccountsAdmin } from './AccountsAdmin.tsx';
import { CatalogAdmin } from './CatalogAdmin.tsx';
import { ChiNhanhAdmin } from './ChiNhanhAdmin.tsx';
import { BangQuyDoiAdmin } from './BangQuyDoiAdmin.tsx';
import { HanMacDinhAdmin } from './HanMacDinhAdmin.tsx';
import { KyVongNguongAdmin } from './KyVongNguongAdmin.tsx';
import { MoSuaLichTest } from './MoSuaLichTest.tsx';
import { DaXoaAdmin } from './DaXoaAdmin.tsx';
import { CauHinhCaseSos } from './CauHinhCaseSos.tsx';
import { QuyenTheoVai } from './QuyenTheoVai.tsx';
import { NhatKyChung, NhatKyMuc } from './NhatKyChung.tsx';
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
  { key: 'band', label: t('Band & ngưỡng') },
  { key: 'han', label: t('Hạn mặc định') },
  /* CAU-HINH-CASE-SOS (chủ SP 11/11): nhóm nguyên nhân / PA / mốc SOS — Quản trị sửa, Quản lý xem; đặt ở trang Quản trị hiện có, không khung mới. */
  { key: 'case-sos', label: 'Case & SOS' },   // tên riêng (EN giống VI)
  { key: 'config', label: t('Quyền & nhật ký') },
  { key: 'da-xoa', label: t('Đã xoá') },
] as const;

export default function AdminPage() {
  const [params, setParams] = useSearchParams();
  const quanTri = !!useSession().session?.nav?.admin;
  /* QTV2-CAU-HINH (chủ SP 11/11 "QL xem"): Quản lý thấy các tab cấu hình (chỉ đọc) + Đã xoá. */
  const tabs = quanTri ? TABS : TABS.filter((x) => x.key === 'catalog' || x.key === 'chi-nhanh' || x.key === 'band' || x.key === 'han' || x.key === 'da-xoa' || x.key === 'case-sos');
  const tab = tabs.find((x) => x.key === params.get('tab'))?.key ?? tabs[0].key;
  /* Đổi tab: bỏ bộ lọc của tab cũ (bộ lọc Tài khoản cũng ở URL), thêm một mục lịch sử để Quay lại về tab trước. */
  const setTab = (k: (typeof TABS)[number]['key']) => setParams(k === tabs[0].key ? {} : { tab: k });

  return (
    <div className="page space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100">{quanTri ? t('Quản trị hệ thống') : t('Cấu hình hệ thống')}</h1>
        {!quanTri && tab !== 'da-xoa' && <p className="text-xs text-slate-500 mt-0.5">{t('Quản trị hệ thống sửa; Quản lý xem.')}</p>}
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
        {tab === 'band' && <BangQuyDoiAdmin dau={<KyVongNguongAdmin />} phai={<NhatKyMuc muc="band" quanTri={quanTri} />} />}
        {tab === 'han' && <HanMacDinhAdmin />}
        {tab === 'case-sos' && <CauHinhCaseSos />}
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
