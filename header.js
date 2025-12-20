// Shared header component for directors site
// Simplified version of Inquiry.Institute navigation

function createHeader() {
  const header = document.createElement('header');
  header.className = 'site-header';
  
  header.innerHTML = `
    <nav class="header-nav">
      <div class="header-container">
        <a href="/" class="header-logo">
          <img src="/favicon.ico" alt="Inquiry Institute" width="32" height="32" class="header-logo-img">
          <span class="header-logo-text">Inquiry Institute</span>
        </a>
        
        <div class="header-links">
          <a href="/" class="header-link">Home</a>
          <a href="/board/" class="header-link">Board</a>
          <a href="https://inquiry.institute" class="header-link" target="_blank" rel="noopener noreferrer">Main Site</a>
        </div>
      </div>
    </nav>
  `;
  
  return header;
}

// Insert header at the beginning of body
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const header = createHeader();
  body.insertBefore(header, body.firstChild);
});
