export function getDaysDiff(dateString) {
  if (!dateString || dateString === '-') return -1;
  let dateParts = dateString.includes('/') 
    ? new Date(dateString.split('/')[2], dateString.split('/')[1] - 1, dateString.split('/')[0])
    : new Date(dateString);
    
  if (isNaN(dateParts.getTime())) return -1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateParts.setHours(0, 0, 0, 0);
  return Math.floor((today - dateParts) / (1000 * 60 * 60 * 24));
}

export function getStageBucket(days) {
  if (days < 0) return null;
  if (days >= 3 && days < 7) return 3;
  if (days >= 7 && days < 30) return 7;
  if (days >= 30 && days < 90) return 30;
  if (days >= 90 && days < 360) return 90;
  if (days >= 360) return 360;
  return null;
}