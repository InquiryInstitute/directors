// Patronage Lantern - simplified version
// Floating lantern icon in lower left corner

function createLantern() {
  const lantern = document.createElement('div');
  lantern.className = 'patronage-lantern';
  lantern.innerHTML = `
    <button class="lantern-button" aria-label="View patrons" title="View patrons">
      <svg class="lantern-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v4M12 18v4M8 6h8M8 18h8" />
        <rect x="6" y="6" width="12" height="12" rx="2" />
        <path d="M12 8v4M10 10h4" />
      </svg>
    </button>
  `;
  
  const button = lantern.querySelector('.lantern-button');
  button.addEventListener('click', () => {
    window.open('https://opencollective.com/inquiry-institute', '_blank', 'noopener,noreferrer');
  });
  
  return lantern;
}

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const lantern = createLantern();
  body.appendChild(lantern);
});
