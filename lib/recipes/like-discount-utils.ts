export function suggestedDiscountFromLikes(likesCount: number) {
  return Math.min(Math.max(likesCount, 0), 100);
}
