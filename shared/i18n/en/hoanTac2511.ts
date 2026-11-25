/** Rà Hoàn tác 25/11: Hoàn tác Rút yêu cầu · tự thêm lại theo dõi · Hoàn tác cấp bậc theo bản máy chủ ghi. Khoá = chữ Việt trên web / máy chủ. */
export const EN_HOAN_TAC_2511 = {
  'Đã hoàn tác · yêu cầu về Chờ duyệt': 'Undone · request back to Pending',
  'Mất kết nối, chưa hoàn tác được. Kiểm tra mạng rồi bấm lại.': 'Connection lost, not undone. Check your network and try again.',
  'Chỉ người vừa rút mới hoàn tác được yêu cầu này.': 'Only the person who just withdrew this request can undo it.',
  'Yêu cầu này không có lần rút nào để hoàn tác.': 'This request has no withdrawal to undo.',
  'Đã quá lâu sau khi rút — gửi lại yêu cầu nếu vẫn cần.': 'Too long since the withdrawal — send the request again if still needed.',
  'Đã có yêu cầu mới đang chờ cho cùng việc này — không hoàn tác lần rút cũ được.': 'A newer request for the same item is pending — the old withdrawal cannot be undone.',
  'Hoàn tác rút yêu cầu': 'Undo request withdrawal',
  '{lyDo} — không hoàn tác rút được; gửi yêu cầu mới nếu vẫn cần.': '{lyDo} — the withdrawal cannot be undone; send a new request if still needed.',
  'Case đã có PA hoặc mốc mới sau lúc rút — không hoàn tác được; gửi lại "Không cần theo dõi" nếu vẫn cần.': 'The Case has a new plan or milestone since the withdrawal — cannot undo; send "No follow-up needed" again if still needed.',
} as const;
