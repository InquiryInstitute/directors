// Header component matching Inquiry.Institute navigation exactly

function createHeader() {
  const header = document.createElement('nav');
  header.className = 'site-header';
  
  header.innerHTML = `
    <div class="header-container">
      <!-- Main header row -->
      <div class="header-row">
        <a href="/" class="header-logo">
          <div class="header-logo-wrapper">
            <img src="/favicon.ico" alt="Inquiry Institute" width="32" height="32" class="header-logo-img header-logo-light">
            <img src="/favicon.ico" alt="Inquiry Institute" width="32" height="32" class="header-logo-img header-logo-dark">
          </div>
          <span class="header-logo-text">Inquiry Institute</span>
        </a>
        
        <div class="header-right">
          <!-- Desktop nav links -->
          <div class="header-desktop-links">
            <a href="/" class="header-link">Home</a>
            <a href="/board/" class="header-link">Board</a>
          </div>
          <a href="https://inquiry.institute" class="header-support-btn header-support-desktop" target="_blank" rel="noopener noreferrer">
            Main Site
          </a>
          <button class="header-menu-btn" aria-label="Toggle menu" aria-expanded="false" aria-controls="global-navigation-drawer">
            <svg class="header-menu-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" x2="20" y1="12" y2="12"></line>
              <line x1="4" x2="20" y1="6" y2="6"></line>
              <line x1="4" x2="20" y1="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Navigation Drawer -->
    <div id="navigation-drawer" class="navigation-drawer" style="display: none;">
      <button class="drawer-backdrop" aria-label="Close menu overlay"></button>
      <aside class="drawer-panel" aria-label="Site navigation">
        <div class="drawer-header">
          <p class="drawer-menu-label">Menu</p>
          <button class="drawer-close-btn" aria-label="Close navigation">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" x2="6" y1="6" y2="18"></line>
              <line x1="6" x2="18" y1="6" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <nav class="drawer-nav" aria-label="Primary">
          <ul class="drawer-nav-list">
            <li>
              <a href="/" class="drawer-nav-item">Home</a>
            </li>
            <li>
              <a href="/board/" class="drawer-nav-item">Board</a>
            </li>
            <li>
              <a href="https://inquiry.institute" class="drawer-nav-item drawer-nav-external" target="_blank" rel="noopener noreferrer">
                Main Site
                <svg class="drawer-external-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 3h6v6"></path>
                  <path d="M10 14 21 3"></path>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                </svg>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  `;
  
  // Add event listeners
  const menuBtn = header.querySelector('.header-menu-btn');
  const drawer = header.querySelector('#navigation-drawer');
  const backdrop = header.querySelector('.drawer-backdrop');
  const closeBtn = header.querySelector('.drawer-close-btn');
  const drawerLinks = header.querySelectorAll('.drawer-nav-item');
  
  function openDrawer() {
    drawer.style.display = 'block';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    menuBtn.setAttribute('aria-expanded', 'true');
  }
  
  function closeDrawer() {
    drawer.style.display = 'none';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    menuBtn.setAttribute('aria-expanded', 'false');
  }
  
  menuBtn.addEventListener('click', openDrawer);
  backdrop.addEventListener('click', closeDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
  
  return header;
}

// Insert header at the beginning of body
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const header = createHeader();
  body.insertBefore(header, body.firstChild);
});
