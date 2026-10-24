/** PHÉP KIỂM SUA-CHAM-LAI — Đ4: lý do ngắn của "Chưa đủ dữ liệu" (tooltip ô Kết quả hồ sơ lớp) theo đúng cờ máy chủ. (L4 ở SV-TQ-GV + OV13o-4, L9 ở OV10c-6.) */
export async function runPrSuaChamLaiTests(t: any) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nSUA-CHAM-LAI');
  check('SUA-CHAM-LAI Đ4 · lyDoChuaDu: chưa lượt · thiếu kỹ năng · chưa kỳ vọng · chưa Overall · tạm · đủ thì null', () => {
    const k = { mode: 'ielts_band', attemptLabel: 'MT2', sosLevel: null, provisional: false, scored: 4, required: 4, failed: null, overall: 6, expectation: 6.5, belowSkills: [], failedSkills: [] };
    assert(d.lyDoChuaDu(null) === 'chưa có lượt Test có điểm', 'không lượt');
    assert(d.lyDoChuaDu({ ...k, scored: 3 }) === 'thiếu điểm 1 kỹ năng', 'thiếu kỹ năng');
    assert(d.lyDoChuaDu({ ...k, expectation: null }) === 'chưa có kỳ vọng (thiếu Target)', 'chưa kỳ vọng');
    assert(d.lyDoChuaDu({ ...k, overall: null }) === 'chưa tính được Overall', 'chưa Overall');
    assert(d.lyDoChuaDu({ ...k, provisional: true }) === 'kết quả tạm, lượt chưa đủ điểm', 'tạm');
    assert(d.lyDoChuaDu(k) === null, 'đủ mọi thứ → không lý do riêng');
    assert(d.lyDoChuaDu({ ...k, mode: 'ratio', expectation: null, overall: null }) === null, 'lớp thường không xét kỳ vọng / Overall');
  });
}
