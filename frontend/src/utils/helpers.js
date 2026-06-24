/**
 * Returns CSS class based on match rank string or numeric score.
 */
export function getMatchClass(rank) {
  if (!rank) return 'match-low';
  const r = rank.toLowerCase();
  if (r.includes('excellent')) return 'match-excellent';
  if (r.includes('good')) return 'match-good';
  if (r.includes('moderate')) return 'match-moderate';
  return 'match-low';
}

export function getMatchClassByScore(score) {
  if (score >= 85) return 'match-excellent';
  if (score >= 70) return 'match-good';
  if (score >= 50) return 'match-moderate';
  return 'match-low';
}

/**
 * Returns CSS class for application status.
 */
export function getStatusClass(status) {
  return `status-${status?.replace(' ', '_') || 'applied'}`;
}

export function getStatusLabel(status) {
  const labels = {
    applied: 'Applied',
    under_review: 'Under Review',
    shortlisted: 'Shortlisted',
    interview: 'Interview',
    selected: 'Selected ✅',
    rejected: 'Rejected',
  };
  return labels[status] || status;
}

/**
 * Format a date string to a readable format.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(str, maxLen = 120) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}
