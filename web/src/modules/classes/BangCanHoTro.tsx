import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, Level, NhanTrangThai, Skeleton, TargetText } from '../../ui/ui.tsx';
import { ChipDuoiKck } from '../../ui/KetQuaDot.tsx';
import { ViecTiep } from '../../ui/ViecTiep.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { sosTone } from '../../lib/format.ts';
import { KhoaQuyChe, TenCase } from '../cases/SkillBoard.tsx';
import { NganCase } from '../students/NganCase.tsx';
import { nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from './thaoTacDongHocVien.tsx';
import {
  ROUTE_NAME, ketQuaGanNhat, locCanHoTro, maHocVienNgan, viecTiepCuaEm,
  type HangKyNang, type KetQuaVao, type ViecTiepCase,
} from '@shared/domain/index.ts';

type PaCase = { id: number; ten: string; batBuoc: boolean; choXacNhan: boolean; choDuyet: boolean; xong: boolean; nguoi: string | null; mocChu: string | null };
type CaseCua = {
  id: number; studentId: number; topic: string | null; sosLevel: number | null; tieuDe: string;
  tenSos: { mt: number | null; giua: string; sos: number | null } | null;
  nguyenNhan: string | null; moTu: string; trangThai: { k: string; t: any; chu: string; han: string | null };
  viecTiep: ViecTiepCase | null; quaHan: boolean; pas: PaCase[]; banGiaoTu: string | null;
};
/** `GET /classes/:id/can-ho-tro` (server/src/classes/canHoTro.ts). */
type CanHoTro = {
  ct: string | null; boMon: string[]; kyNangToi: string[]; laGvbmThuan: boolean;
  tong: { soEm: number; soCase: number; choDuyet: number; quaHan: number };
  em: { id: number; ten: string; ma: string; cases: CaseCua[] }[];
};
type DongRoster = {
  id: number; fullName: string; status: string; archived: boolean; standing: KetQuaVao | null;
  cycle: { route: string | null; target: number | null; khongCamKet?: boolean } | null;
  timeline: { kind: string; kindLabel: string; myPending: string[] }[];
};
type MoNgan = { caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa'; em: string };

/** Lưới bốn cột thẳng nhau giữa mọi khối: Kỹ năng · Case · Phương án đang làm · Việc tiếp + hạn. */
const LUOI = 'md:grid md:grid-cols-[3.5rem_minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,1fr)] md:gap-x-3';
/** OV-10b: TVV / CX / Admin chỉ đọc — bỏ cột Việc tiếp (việc của GV / QL). */
const LUOI_DOC = 'md:grid md:grid-cols-[3.5rem_minmax(0,1.5fr)_minmax(0,1.2fr)] md:gap-x-3';
const CAO_TRAI = 'md:grid md:grid-cols-[13.5rem_minmax(0,1fr)]';

/**
 * TAB HỌC VIÊN · CHẾ ĐỘ CẦN HỖ TRỢ (M4, T19, K2-36/37/42; mockup 19). Nằm ở: Học viên & Lớp → Hồ sơ lớp → tab Học viên → nút chế độ
 * `Điểm | Cần hỗ trợ`. Chỉ em có Case mở; mỗi em MỘT KHỐI: cột trái (tên · lộ trình · target · SOS gần nhất · n Case), cột phải các hàng theo KỸ NĂNG
 * (`hangCanHoTro`: số hàng theo chương trình) — mỗi Case một dòng có Trạng thái, Phương án đang làm và Việc tiếp + hạn.
 * Bấm tên Case hoặc việc mở Ngăn Case TẠI CHỖ (không rời trang lớp). Mức SOS/lộ trình/target lấy từ roster (đã tải cho menu ⋯), không hỏi lại máy chủ.
 */
export function BangCanHoTro({ classId, maLop, laLopThuong, quyen, onDoi, chuongTrinh = null }: {
  classId: number; maLop?: string; laLopThuong: boolean; quyen: QuyenDong; onDoi: () => void;
  /** Mã chương trình lớp — dự phòng khi máy chủ chưa trả `ct` (MH2). */
  chuongTrinh?: string | null;
}) {
  const { homNay } = useNgayNghiepVu();
  const trang = useApi<CanHoTro>(`/classes/${classId}/can-ho-tro`, [classId]);
  const roster = useApi<DongRoster[]>(`/classes/${classId}/roster`, [classId]);
  const [ngan, setNgan] = useState<MoNgan | null>(null);
  const [chiToi, setChiToi] = useState<boolean | null>(null);
  const [moThem, setMoThem] = useState<Set<string>>(new Set());
  const tai = () => { trang.reload(); roster.reload(); onDoi(); };
  const tt = useThaoTacDongHocVien({ laLopThuong, quyen, maLop, classId, onDone: tai });
  const dienThoai = useDienThoai();
  const chiDoc = !!quyen.theoVai;
  const luoi = chiDoc ? LUOI_DOC : LUOI;
  const rosterTheoEm = useMemo(() => new Map((roster.data ?? []).map((s) => [s.id, s])), [roster.data]);
  const d = trang.data;
  const ct = d ? d.ct ?? chuongTrinh : chuongTrinh;
  /* Q12: bật sẵn khi người xem CHỈ là GVBM và dạy 1–2 kỹ năng; không nhớ qua lần mở. */
  const coCongTac = !!d && d.kyNangToi.length > 0 && d.kyNangToi.length < d.boMon.length;
  const bat = coCongTac && (chiToi ?? (!!d?.laGvbmThuan && d.kyNangToi.length <= 2));
  /* PR-S4F #5: lọc em + đếm SAU `hangCanHoTro` — số ở dòng tổng và cột trái theo Case đang hiện. */
  const { em, tong } = useMemo(() => locCanHoTro({ ct, em: d?.em ?? [], chiKyNang: bat ? d!.kyNangToi : null }), [d, ct, bat]);

  if (trang.error || roster.error) {
    const e = (trang.error ?? roster.error)!;
    return <ErrorState message={e.message} hint={e.hint} onRetry={() => { trang.reload(); roster.reload(); }} />;
  }
  if (!d || !roster.data) return <Skeleton rows={4} />;
  if (!d.em.length) return <Empty title="Không có học viên nào đang có Case mở" />;
  const dong = [`${tong.soEm} em`, `${tong.soCase} Case`,
    tong.choDuyet > 0 ? `${tong.choDuyet} Case chờ Quản lý duyệt` : null, tong.quaHan > 0 ? `${tong.quaHan} quá hạn` : null].filter(Boolean).join(' · ');
  const soEmHoc = roster.data.filter((s) => !s.archived).length;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className="m-0 text-xs text-slate-400 tabular-nums">{dong}</p>
        {coCongTac && (
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-slate-300">
            <input type="checkbox" checked={bat} onChange={(e) => setChiToi(e.target.checked)} />Chỉ kỹ năng tôi dạy
          </label>
        )}
      </div>

      <div className={`hidden px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 ${CAO_TRAI}`}>
        <span>Học viên</span>
        <span className={luoi}><span>Kỹ năng</span><span>Case</span><span>PA đang làm</span>{!chiDoc && <span>Việc tiếp · hạn</span>}</span>
      </div>

      {em.map((e) => {
        const r = rosterTheoEm.get(e.id);
        const k = ketQuaGanNhat(r?.standing ?? null);
        const hang = e.hang;
        const nQuaHan = e.cases.filter((c) => c.quaHan).length;
        return (
          <article key={e.id} className={`card overflow-hidden ${CAO_TRAI}`} aria-label={`Cần hỗ trợ: ${e.ten}`}>
            <div className="space-y-1 border-b p-3 md:border-b-0 md:border-r" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-start gap-1.5">
                <span className="min-w-0 flex-1">
                  <Link className="link font-semibold" to={`/hoc-vien/${e.id}`}>{e.ten}</Link>{' '}
                  <span className="text-[11px] tabular-nums text-slate-500">{maHocVienNgan(e.ma)}</span>
                </span>
                {r && (
                  <MenuDong muc={tt.mucCua({ id: e.id, ten: e.ten, dangHoc: r.status === 'active', nhapDiem: nhapDiemCua(classId, laLopThuong, r.timeline ?? []), status: r.status })} />
                )}
              </div>
              {r?.cycle && (
                <p className="m-0 text-xs text-slate-400">
                  {r.cycle.route && <><abbr title={ROUTE_NAME[r.cycle.route as keyof typeof ROUTE_NAME] ?? r.cycle.route} className="no-underline">{r.cycle.route}</abbr> · </>}
                  target <span className="tabular-nums"><TargetText band={r.cycle.target} kck={r.cycle.khongCamKet} /></span>
                </p>
              )}
              <p className="m-0 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                {k.sos ? <Level tone={sosTone(r?.standing?.sosLevel ?? null)} dut={k.sosTamThoi}>{k.sos}{k.sosTamThoi ? ' tạm thời' : ''}</Level>
                  : <span className="tabular-nums text-slate-300">{k.chinh}</span>}
                {k.kckDuoi && <ChipDuoiKck />}
                {r?.standing?.attemptLabel && <span>{r.standing.attemptLabel}</span>}
              </p>
              <p className="m-0 text-xs tabular-nums text-slate-500">
                {e.cases.length} Case{nQuaHan > 0 && <> · <span className="font-semibold text-late">{nQuaHan} việc quá hạn</span></>}
              </p>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
              {hang.map((h) => {
                if (h.kind === 'rong') {
                  return <div key={h.khoa.join()} className="px-3 py-1 text-[11.5px] text-slate-500">{h.nhan}</div>;
                }
                if (!h.cases.length) {
                  return (
                    <div key={h.khoa} className={`px-3 py-1 ${luoi}`}>
                      <span className="text-xs font-semibold text-slate-500" title={h.tenDu}>{h.nhan}</span>
                      <span className="text-[11.5px] text-slate-600">—</span>
                    </div>
                  );
                }
                const khoaMo = `${e.id}:${h.khoa}`;
                const hienHet = moThem.has(khoaMo);
                return (
                  <div key={h.khoa}>
                    {(hienHet ? h.cases : h.hien).map((c, i) => (
                      <DongCase key={c.id} h={h} c={c} dau={i === 0} ct={ct} homNay={homNay} the={dienThoai} chiDoc={chiDoc}
                        onMo={(viec, paId) => setNgan({ caseId: c.id, viec, paId, em: e.ten })} />
                    ))}
                    {h.them > 0 && (
                      <div className="px-3 pb-1.5 md:pl-[4.5rem]">
                        <button type="button" className="link cursor-pointer border-0 bg-transparent p-0 text-[11.5px] max-sm:min-h-[44px]"
                          onClick={() => setMoThem((s) => { const n = new Set(s); if (n.has(khoaMo)) n.delete(khoaMo); else n.add(khoaMo); return n; })}>
                          {hienHet ? 'Thu gọn' : `+${h.them} Case`}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
      {soEmHoc > em.length && <p className="m-0 text-xs text-slate-500">{soEmHoc - em.length} học viên không có Case đang mở{bat ? ' ở kỹ năng bạn dạy' : ''}.</p>}
      {tt.panels}
      {ngan && (
        <NganCase caseId={ngan.caseId} paId={ngan.paId} viec={ngan.viec} hocVien={ngan.em} lop={maLop}
          onClose={() => { setNgan(null); tai(); }} onChanged={tai} />
      )}
    </div>
  );
}

/** Một dòng Case trong hàng kỹ năng: Kỹ năng (chỉ dòng đầu) · Case · Phương án đang làm · Việc tiếp + hạn. */
function DongCase({ h, c, dau, ct, homNay, onMo, the = false, chiDoc = false }: {
  h: HangKyNang<CaseCua>; c: CaseCua; dau: boolean; ct: string | null; homNay: string; chiDoc?: boolean;
  /** Điện thoại (D2): mỗi Case của hàng kỹ năng là một `TheDong` (mockup M4 "trên điện thoại"). */
  the?: boolean;
  onMo: (viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa', paId?: number) => void;
}) {
  const [viec] = viecTiepCuaEm({ nhapDiem: null, cases: [{ caseId: c.id, topic: c.topic, viecTiep: c.viecTiep }], yThuc: null, homNay, chuongTrinh: ct });
  const d = viec?.dich?.loai === 'case' ? viec.dich : null;
  const loai = !viec ? undefined : viec.viec.startsWith('Xác nhận nguyên nhân') ? 'xac-nhan' as const
    : viec.viec.startsWith('Xác nhận PA') ? 'xac-nhan-pa' as const : d?.ghiKetQua && d.paId != null ? 'ghi-ket-qua' as const : undefined;
  const dangLam = c.pas.filter((p) => !p.xong);
  const cacPa = dangLam.length === 0 ? <span className="text-slate-600">—</span> : dangLam.map((p) => (
    <span key={p.id} className="block" data-pa-id={p.id}>
      <span className="text-slate-200">{p.batBuoc && <span title="PA theo quy chế" className="mr-1 inline-flex align-middle"><KhoaQuyChe /></span>}{p.ten}</span>
      {p.choXacNhan ? <span className="text-slate-500"> · Chờ xác nhận</span>
        : p.choDuyet ? <span className="text-slate-500"> · Chờ Quản lý duyệt</span>
        : <span className="text-slate-500">{[p.nguoi, p.mocChu].filter(Boolean).map((x) => ` · ${x}`).join('')}</span>}
    </span>
  ));
  const cauViec = viec ? <ViecTiep v={viec} onBam={() => onMo(loai, d?.paId)} /> : <span className="text-slate-600">—</span>;
  if (the) {
    return (
      <TheDong
        dau={(
          <span className="block min-w-0">
            <span className="text-xs font-semibold text-slate-300" title={h.tenDu}>{h.nhan}</span>{' · '}
            <button type="button" className="link cursor-pointer border-0 bg-transparent p-0 text-left text-xs font-semibold" title={c.tieuDe}
              onClick={() => onMo()}><TenCase c={{ title: c.tieuDe, tenSos: c.tenSos }} /></button>
            {(c.nguyenNhan || c.moTu) && <span className="block text-[11.5px] text-slate-500">{[c.nguyenNhan, c.moTu].filter(Boolean).join(' · ')}</span>}
          </span>
        )}
        dong={[
          { nhan: 'Trạng thái', noiDung: (
            <span className="flex flex-wrap items-center gap-x-1.5"><NhanTrangThai t={c.trangThai.t} title={c.trangThai.chu} />
              {c.banGiaoTu && <span className="text-slate-500" title="Case bàn giao">từ {c.banGiaoTu}</span>}</span>
          ) },
          { nhan: 'PA', noiDung: <span className="text-[11.5px]">{cacPa}</span> },
          ...(chiDoc ? [] : [{ nhan: 'Việc tiếp', noiDung: cauViec }]),
        ]} />
    );
  }
  return (
    <div className={`px-3 py-2 ${chiDoc ? LUOI_DOC : LUOI}`}>
      <span className={`text-xs font-semibold text-slate-300 ${dau ? '' : 'md:invisible'}`} title={h.tenDu}>{h.nhan}</span>
      <span className="min-w-0">
        <button type="button" className="link block max-w-full cursor-pointer truncate border-0 bg-transparent p-0 text-left text-xs font-semibold" title={c.tieuDe}
          onClick={() => onMo()}><TenCase c={{ title: c.tieuDe, tenSos: c.tenSos }} /></button>
        {(c.nguyenNhan || c.moTu) && <span className="block text-[11.5px] text-slate-500">{[c.nguyenNhan, c.moTu].filter(Boolean).join(' · ')}</span>}
        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
          <NhanTrangThai t={c.trangThai.t} title={c.trangThai.chu} />
          {c.banGiaoTu && <span title="Case bàn giao">từ {c.banGiaoTu}</span>}
        </span>
      </span>
      <span className="min-w-0 text-[11.5px] text-slate-300">{cacPa}</span>
      {!chiDoc && <span className="min-w-0">{cauViec}</span>}
    </div>
  );
}
