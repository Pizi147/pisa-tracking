/**
 * CHIP SOS — MỘT MẪU CHỮ cho mọi màn (OV-15a, C08 + mục 6 chủ SP 19/10). Component `web/src/ui/ChipSos.tsx` chỉ vẽ;
 * chữ trên chip và chữ trong hộp "Vì sao SOS n" (bấm chip mở — tiêu đề → kết luận đậm → số → việc) dựng ở đây để kiểm được.
 */
import { t } from '../i18n/index.ts';
import { skillShort, tenMonNgan } from './normal.ts';
import type { KetQuaVao } from './hocVienLop.ts';

export type VaoChipSos = {
  muc: number;
  /** Kỹ năng / môn dưới kỳ vọng, chữ ngắn đã sẵn ("R", "W" · lớp thường "Reading"). */
  kyNang?: string[];
  /** SOS tạm: đợt chưa chốt (chưa đủ điểm) — viền đứt, chữ "tạm". */
  tam?: boolean;
  /** Tên đợt: "MT3" · "Progress Test". */
  dot?: string | null;
  ten?: string | null;
  /** Lớp thường: SOS theo số môn trượt Progress Test. */
  thuong?: boolean;
};

/** "SOS 2" · "SOS 2 · R, W" · "SOS 3 tạm". */
export function chuChipSos(v: VaoChipSos): string {
  const goc = v.tam ? t('SOS {n} tạm', { n: v.muc }) : `SOS ${v.muc}`;
  return v.kyNang?.length ? `${goc} · ${v.kyNang.join(', ')}` : goc;
}

export function giaiThichSos(v: VaoChipSos): { tieuDe: string; ketLuan: string; phu: string | null; luat: string } {
  const goc = v.tam ? t('Vì sao SOS {n} tạm', { n: v.muc }) : t('Vì sao SOS {n}', { n: v.muc });
  const n = v.kyNang?.length ?? 0;
  const ketLuan = v.thuong
    ? (v.dot ? t('{n} môn chưa đạt ở {dot}', { n: n || v.muc, dot: v.dot }) : t('{n} môn chưa đạt', { n: n || v.muc }))
    : n && v.dot ? t('{n} kỹ năng chưa đạt kỳ vọng ở {dot}', { n, dot: v.dot })
    : t('Có {n} kỹ năng chưa đạt kỳ vọng', { n: n || v.muc });
  return {
    tieuDe: v.ten ? `${goc} · ${v.ten}` : goc,
    ketLuan,
    phu: v.tam ? t('Tạm thời: đợt chưa đủ điểm, mức SOS còn đổi khi nhập đủ.') : null,
    luat: v.thuong ? t('SOS 1 = 1 môn · SOS 2 = 2 · SOS 3 = 3 môn trở lên chưa đạt ở Progress Test.')
      : t('SOS 1 = 1 kỹ năng · SOS 2 = 2 · SOS 3 = 3–4 kỹ năng dưới kỳ vọng. Lấy đợt gần nhất có kết quả.'),
  };
}

/**
 * Kỹ năng dưới kỳ vọng + dòng số cho hộp "Vì sao" từ kết quả một lượt MT (`AttemptResult`: `expectation`, `verdicts`):
 * ["Kỳ vọng MT3", "6.5"], ["L", "6.0"]… — đúng thứ tự kỹ năng của lượt.
 */
export function soLieuSos(r: { expectation: number | null; verdicts: { skill: string; band: number | null; passed: boolean | null; required?: boolean }[] },
  dot: string | null): { kyNang: string[]; soLieu: Array<[string, string]> } {
  const v = r.verdicts.filter((x) => x.required !== false);
  return {
    kyNang: v.filter((x) => x.passed === false).map((x) => skillShort(x.skill)),
    soLieu: [
      ...(r.expectation !== null ? [[dot ? t('Kỳ vọng {dot}', { dot }) : t('Kỳ vọng'), r.expectation.toFixed(1)] as [string, string]] : []),
      ...v.map((x) => [skillShort(x.skill), x.band === null ? '—' : x.band.toFixed(1)] as [string, string]),
    ],
  };
}

/** Chip SOS của cột "Kết quả gần nhất" (`Standing` → `KetQuaVao`): FT = kỹ năng dưới kỳ vọng + band; lớp thường = môn trượt Progress Test. */
export function chipSosTuKetQua(k: KetQuaVao | null): (VaoChipSos & { soLieu: Array<[string, string]> }) | null {
  if (!k || !k.sosLevel || k.sosLevel <= 0) return null;
  const dot = k.attemptLabel;
  if (k.mode === 'ratio') {
    const ct = k.chuongTrinh ?? null;
    return { muc: k.sosLevel, tam: k.provisional, dot, thuong: true,
      kyNang: k.failedSkills.map((f) => tenMonNgan(ct, f.skill)),
      soLieu: k.failedSkills.map((f) => [tenMonNgan(ct, f.skill), `${f.score}/${f.total}`] as [string, string]) };
  }
  return { muc: k.sosLevel, tam: k.provisional, dot,
    kyNang: k.belowSkills.map((b) => skillShort(b.skill)),
    soLieu: [
      ...(k.expectation !== null ? [[dot ? t('Kỳ vọng {dot}', { dot }) : t('Kỳ vọng'), k.expectation.toFixed(1)] as [string, string]] : []),
      ...k.belowSkills.map((b) => [skillShort(b.skill), b.band.toFixed(1)] as [string, string]),
    ] };
}

/**
 * SO VỚI KỲ VỌNG (C05, mục 6 chủ SP 19/10): ✓ xanh lá vượt · ✓ xanh dương bằng · ✗ đỏ dưới; thiếu band / kỳ vọng → null ("Chưa đủ điểm" chỉ chữ).
 * Hộp điểm lẻ (không có cột kỳ vọng) dùng ▲ vượt / ▼ dưới, bằng thì không mũi tên.
 */
export function soKyVong(band: number | null | undefined, kyVong: number | null | undefined): 'vuot' | 'bang' | 'duoi' | null {
  if (band == null || kyVong == null) return null;
  const d = Math.round((band - kyVong) * 10);
  return d > 0 ? 'vuot' : d < 0 ? 'duoi' : 'bang';
}
