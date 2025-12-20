// Feedback Candle - simplified version
// Floating candle icon in lower right corner

function createCandle() {
  const candle = document.createElement('div');
  candle.className = 'feedback-candle';
  candle.innerHTML = `
    <button class="candle-button" aria-label="Provide feedback" title="Share feedback or report an issue">
      <svg class="candle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="10" y="18" width="4" height="4" rx="1" />
        <rect x="9" y="8" width="6" height="10" rx="1" />
        <path d="M12 4v4M11 6h2" />
        <circle cx="12" cy="6" r="1.5" fill="currentColor" />
      </svg>
    </button>
  `;
  
  const button = candle.querySelector('.candle-button');
  button.addEventListener('click', () => {
    const currentPath = window.location.pathname;
    const repo = 'InquiryInstitute/directors';
    const title = encodeURIComponent(`Feedback for ${currentPath}`);
    const body = encodeURIComponent(`Page: ${currentPath}\n\n[Your feedback here]`);
    const url = `https://github.com/${repo}/issues/new?title=${title}&body=${body}&labels=feedback`;
    window.open(url, '_blank', 'noopener,noreferrer');
  });
  
  return candle;
}

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const candle = createCandle();
  body.appendChild(candle);
});
