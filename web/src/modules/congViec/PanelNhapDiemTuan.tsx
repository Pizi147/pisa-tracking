import { useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { LuoiTrongPanel } from '../../ui/LuoiTrongPanel.tsx';
import { DauViecCongViec, KhungPanel } from '../../ui/KhungPanel.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { MuiChev } from '../../ui/HangNhom.tsx';
import { ChuLuu, dauViec } from '../../ui/KhuonViec.tsx';
import { gioVnNay } from './gioVn.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { duongCham, type Cham } from '../cham/LuoiChamLop.tsx';
import { LuoiNhung } from '../test/lichTest/LuoiNhung.tsx';
import { khopKn } from '../cham/LuoiFT.tsx';
import { demBaiViec, LOAI_HAN_CUA_VIEC, duongLichTest, emCuaViec, tuanLich, quyCheNhapDiem } from '@shared/domain/index.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/** Chân panel việc chấm: "Việc tiếp ›" (nổi bật khi đã đủ phần người xem); không có việc kế → không chân. */
export const chanViecTiep = (onTiep: (() => void) | null | undefined, xong: boolean) => (onTiep ? {
  huy: null,
  /* Nút hành động kế (không phải nút lựa chọn — NEN B3): nổi bật khi đã đủ phần người xem. */
  chinh: <button type="button" className={xong ? 'btn btn-primary min-h-[44px] sm:min-h-0' : 'btn min-h-[44px] sm:min-h-0'} onClick={onTiep}>{t('Việc tiếp ›')}</button>,
} : undefined);
export const hetViec = (onTiep: (() => void) | null | undefined) => () => (onTiep ? { nhan: t('Việc tiếp ›'), onClick: onTiep } : null);

/**
 * NHẬP ĐIỂM THEO TUẦN THI (OV-13c, Q4; mockup OV-13 §3a): một dòng = một tuần thi của một người giữ việc, có thể nhiều lớp. Panel = lưới điểm của
 * tuần đó từng lớp (`LuoiNhung`, cùng lưới Lịch Test — luật chấm không đổi), lớp đầu mở sẵn. Danh sách lớp giữ như lúc mở: lớp vừa nhập xong
 * không biến khỏi panel khi Công việc tải lại.
 */
export function PanelNhapDiemTuan({ it, tuMo, onDong, onDaLam, onTiep }: { it: WorkItem; tuMo: boolean; onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null }) {
  const { homNay } = useNgayNghiepVu();
  const [lop] = useState(() => (it.con?.length ? it.con : [it]));
  /* R1-LUU-TIEP: hết bài của người xem ở một lớp → "Lớp tiếp: {mã} ›" (lớp kế của việc, theo thứ tự) mở lớp đó tại panel, con trỏ ô trống đầu;
     lớp cuối → "Việc tiếp ›". ponytail: lớp kế theo thứ tự, không đếm bài còn thiếu (dữ liệu từng lớp nằm trong `LuoiNhung`) — lớp kế đã xong thì hộp báo hết ngay. */
  const [conTro, setConTro] = useState<string | null>(null);
  const hetLop = (x: WorkItem) => () => {
    const ke = lop[lop.indexOf(x) + 1];
    if (!ke) return hetViec(onTiep)();
    return { nhan: t('Lớp tiếp: {lop} ›', { lop: ke.classCode ?? '' }), onClick: () => { setMo(new Set([ke.key])); setConTro(ke.key); } };
  };
  /* GD-3 (mockup v21 K2): một lớp → tiêu đề = tên việc ("Nhập điểm Listening, Reading"), dòng 2 "lớp · tuần · n bài", lưới ngay dưới (không hàng gập lớp). */
  const motLop = lop.length === 1;
  /* Mockup K2 dòng 2 "MB FT 104 · MT1 · W3 SEP · còn 4 / 10 bài": cùng URL lưới `LuoiNhung` đang đọc (`useApi` gộp GET đang bay / vừa xem) → 0 request thêm.
     Bài = ô kỹ năng của việc ở tuần thi này, sửa được; còn = `conThieuFt`. MT ghi khi cả lớp cùng một lượt. */
  const dsLop = useApi<Cham>(motLop && lop[0].classId ? duongCham(lop[0].classId, { periodId: lop[0].periodId ?? null, kind: lop[0].kind ?? null }) : null, [motLop]).data;
  const demBai = useMemo(() => {
    const x = lop[0]; const kns = x.kns ?? (x.kn ? [x.kn] : null);
    if (!dsLop?.ft || !it.tuanThi) return null;
    /* NT-SUA: `demBaiViec` — cùng bộ lọc với lưới (em của việc, không ngừng học) → "còn n / m" khớp dòng việc "n bài". */
    const o = demBaiViec(dsLop.ft.rows, { em: emCuaViec(x), tuan: it.tuanThi, cot: (s) => !kns || kns.some((k) => khopKn(s, k)) });
    if (!o.tong) return null;
    return { con: o.con, tong: o.tong, mt: o.mt.length === 1 ? `MT${o.mt[0]}` : null };
  }, [dsLop, it.tuanThi]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* A3-05: người xem không nhập được (CX) — tiêu đề "Điểm …", không mời "Nhập điểm"; lưới vẫn theo quyền máy chủ từng ô (chỉ xem). */
  const chiXem = !!useContext(DauViecCongViec)?.chiXem;
  const [tieuDe] = useState(() => (chiXem ? (motLop && it.tieuDe ? t('Điểm {skills}', { skills: dich(it.tieuDe.replace(/^Nhập điểm /, '')) }) : t('Điểm · {tuan}', { tuan: it.tuanThi ? tuanLich(it.tuanThi) : '' }))
    : motLop && it.tieuDe ? dich(it.tieuDe) : t('Nhập điểm · {tuan}', { tuan: it.tuanThi ? tuanLich(it.tuanThi) : '' })));
  const [mo, setMo] = useState<ReadonlySet<string>>(() => new Set([lop[0].key]));
  /* NHẸ HƠN (v23 C1 chân "✓ Đã lưu 15:40 · 9 / 16 bài"): giờ lưu ô gần nhất (ô đang lưu / lỗi báo ngay tại ô — không lặp ở chân). */
  const [luc, setLuc] = useState<string | null>(null);
  const daLuu = () => { setLuc(gioVnNay()); onDaLam(); };
  const periodId = lop[0].periodId ?? null;
  const dau = dauViec({
    han: it.due ? <ChipHan loai={LOAI_HAN_CUA_VIEC.score ?? 'nhap-diem'} han={it.due} /> : null,
    ngCanh: (
      <Link className="link" to={duongLichTest({ periodId })}>
        {motLop ? [lop[0].classCode, demBai?.mt, it.tuanThi ? tuanLich(it.tuanThi) : null].filter(Boolean).join(' · ') : t('{n} lớp', { n: new Set(lop.map((x) => x.classId)).size })} · {motLop && demBai ? t('còn {con} / {tong} bài', demBai) : t('{soBai} bài', { soBai: lop.reduce((n, x) => n + (x.soBai ?? 0), 0) })}
      </Link>
    ),
  });
  const luoiLop = (x: WorkItem, lopKhung: string) => (
    <LuoiTrongPanel className={lopKhung}>
      <LuoiNhung chiHv={emCuaViec(x)} classId={x.classId!} periodId={x.periodId ?? null} kind={x.kind ?? null} tuanDangXem={x.tuanThi ?? null} kn={x.kn ?? null}
                    hrefDayDu={duongLichTest({ classId: x.classId, periodId: x.periodId })} onDaLuu={daLuu} chiCot={x.kns ?? (x.kn ? [x.kn] : null)}
                    emCoBaiTuan={(x.kind ?? 'mock') === 'mock'} luoiGon
                    /* OV-14b: lớp đầu (mở sẵn) cuộn ngang tới cột của việc + con trỏ ở ô trống đầu cột đó; lớp mở sau không giật trang. */
                    datConTro={(!tuMo && !!x.kn && x.key === lop[0].key) || x.key === conTro} onHet={hetLop(x)} />
    </LuoiTrongPanel>
  );
  const trai = luc ? <span className="text-[13px]"><ChuLuu tt="da" luc={luc} />{motLop && demBai ? <span className="tabular-nums text-dim"> · {t('còn {con} / {tong} bài', demBai)}</span> : null}</span> : null;
  const chanTiep = chanViecTiep(onTiep, false);
  const chan = chanTiep || trai ? { ...(chanTiep ?? { huy: null }), trai } : undefined;
  return (
    /* NHẸ HƠN (v23 C1): panel bảng ~75 % (`rong="bang"`). */
    <KhungPanel hd="nhap-diem" rong="bang" tieuDe={tieuDe} dau={dau} onDong={onDong} chan={chan} quyChe={quyCheNhapDiem({ thuong: it.khung === 'thuong', mt0: it.kind === 'mt0', tuanThi: it.tuanThi ?? null, homNay, han: it.due })}>
      {chiXem && <p className="m-0 pt-2 text-[13px] text-dim">{t('Chỉ xem · GV / Head nhập')}</p>}
      {(
      /* NHẸ HƠN (v23 C1 `.kl` → `.pc-kl` ở index.css): MỖI LỚP MỘT KHỐI — đầu khối nổi (nền surface-2, vạch nhấn trái, mã lớp 16 / 700) · đợt + tuần · kỹ năng của bạn · số bài.
         Bấm đầu khối gập / mở (giữ: lưới chỉ tải khi mở — không thêm request). Không cắt chữ, xuống dòng khi chật. */
      <ul className="m-0 grid list-none gap-2 p-0 pt-3">
        {lop.map((x) => {
          const dangMo = mo.has(x.key);
          const mon = dich(x.phu ?? x.reason);
          return (
            <li key={x.key} className="pc-kl">
              <button type="button" aria-expanded={dangMo} onClick={() => setMo((s) => { const n = new Set(s); if (dangMo) n.delete(x.key); else n.add(x.key); return n; })}
                className="pc-kl-dau">
                <MuiChev mo={dangMo} cl="text-faint" />
                <span className="pc-kl-ma">{x.classCode}</span>
                <span className="pc-kl-meta">
                  {x.contextLabel && <span>{dich(x.contextLabel)}</span>}
                  {mon && <span>{chiXem ? mon : <>{t('Môn của bạn')}: <b>{mon}</b></>}</span>}
                  <span>{t('{soBai} bài', { soBai: x.soBai ?? 0 })}</span>
                </span>
              </button>
              {dangMo && luoiLop(x, 'luoi-trong-panel px-2 pb-2')}
            </li>
          );
        })}
      </ul>
      )}
    </KhungPanel>
  );
}
