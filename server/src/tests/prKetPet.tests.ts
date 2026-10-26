/**
 * PHÉP KIỂM P13 KET-PET (plan.md 1.6 N18; plan `2026-10-26-p13-ket-pet.md`): thang Cambridge (A2 Key 100–150, B1 Preliminary 120–170),
 * Target + kết quả thi thật KET / PET theo điểm Cambridge, Checkpoint tách R · W · L · S (migrate `prKetPet`).
 */
export async function runPrKetPetTests(t: any) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nP13 KET-PET — thang Cambridge + Checkpoint 4 môn');

  check('KP-1 · kyThi: thang, kiểm điểm, Overall, Grade + CEFR (Cambridge)', () => {
    const KET = d.kyThiCuaChuongTrinh('KET'); const PET = d.kyThiCuaChuongTrinh('PET');
    assert(KET.min === 100 && KET.max === 150 && PET.min === 120 && PET.max === 170, 'thang');
    assert(d.kyThiCuaChuongTrinh('FOU') === null && d.kyThiCuaChuongTrinh(null) === null && d.kyThiCuaChuongTrinh('FT') === null, 'không kỳ thi');
    assert(d.kiemDiemKyThi(KET, 99) && d.kiemDiemKyThi(KET, 151) && d.kiemDiemKyThi(KET, 120.5) && d.kiemDiemKyThi(KET, NaN), 'ngoài thang / số lẻ → lỗi');
    assert(d.kiemDiemKyThi(KET, 99) === 'A2 Key: 100–150', d.kiemDiemKyThi(KET, 99));
    assert(d.kiemDiemKyThi(KET, 150) === null && d.kiemDiemKyThi(KET, 100) === null, 'trong thang → null');
    assert(d.tongKyThi(KET, { l: 140, r: 133, w: 133, s: 150 }) === 139, 'Overall KET');
    assert(d.tongKyThi(PET, { l: 170, r: 160, w: 155, s: 150 }) === 159, 'Overall PET làm tròn 158.75 → 159');
    assert(d.tongKyThi(PET, { l: 170, r: null, w: 155, s: 150 }) === null, 'thiếu môn → null');
    assert(d.gradeKyThi(PET, 160) === 'A' && d.gradeKyThi(PET, 159) === 'B' && d.gradeKyThi(PET, 140) === 'C' && d.gradeKyThi(PET, 139) === null, 'Grade PET');
    assert(d.gradeKyThi(KET, 140) === 'A' && d.gradeKyThi(KET, 133) === 'B' && d.gradeKyThi(KET, 120) === 'C' && d.gradeKyThi(KET, 119) === null, 'Grade KET');
    assert(d.cefrKyThi(PET, 160) === 'B2' && d.cefrKyThi(PET, 159) === 'B1' && d.cefrKyThi(PET, 139) === 'A2' && d.cefrKyThi(PET, 120) === 'A2', 'CEFR PET');
    assert(d.cefrKyThi(KET, 140) === 'B1' && d.cefrKyThi(KET, 120) === 'A2' && d.cefrKyThi(KET, 100) === 'A1', 'CEFR KET');
  });
}
