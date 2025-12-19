// Supabase configuration
// These should be set as environment variables or replaced with your actual values
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || window.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || '';

// Initialize Supabase client
let supabaseClient = null;

async function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase URL and Anon Key must be configured');
    return null;
  }

  // Dynamically import Supabase client
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function loadBoardMembers() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const containerEl = document.getElementById('board-container');
  const gridEl = document.getElementById('board-grid');

  try {
    // Initialize Supabase
    supabaseClient = await initSupabase();
    
    if (!supabaseClient) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Fetch colleges with their directors
    const { data: colleges, error: collegesError } = await supabaseClient
      .from('colleges')
      .select('*')
      .order('code');

    if (collegesError) throw collegesError;

    // Fetch board of directors
    const { data: directors, error: directorsError } = await supabaseClient
      .from('board_of_directors')
      .select('*, colleges(*)')
      .order('position_type');

    if (directorsError) throw directorsError;

    // Hide loading, show container
    loadingEl.style.display = 'none';
    containerEl.style.display = 'block';

    // Clear grid
    gridEl.innerHTML = '';

    // Create cards for college directors
    const collegeDirectors = directors.filter(d => d.position_type === 'college');
    collegeDirectors.forEach(director => {
      const card = createDirectorCard(director, director.colleges);
      gridEl.appendChild(card);
    });

    // Add heretic position
    const heretic = directors.find(d => d.position_type === 'heretic');
    if (heretic) {
      const hereticCard = createHereticCard(heretic);
      gridEl.appendChild(hereticCard);
    }

  } catch (error) {
    console.error('Error loading board members:', error);
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    errorEl.innerHTML = `
      <p><strong>Error loading board members:</strong></p>
      <p>${error.message}</p>
      <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.8;">
        Please ensure Supabase is configured correctly. Check the browser console for details.
      </p>
    `;
  }
}

function createDirectorCard(director, college) {
  const card = document.createElement('div');
  card.className = 'board-card';

  card.innerHTML = `
    <div class="college-code">${college?.code || 'N/A'}</div>
    <div class="college-name">${college?.name || 'Unknown College'}</div>
    <div class="director-name">${director.director_name || 'Vacant'}</div>
    ${director.rationale ? `<div class="rationale">${director.rationale}</div>` : ''}
  `;

  return card;
}

function createHereticCard(heretic) {
  const card = document.createElement('div');
  card.className = 'board-card heretic-card';

  card.innerHTML = `
    <div class="college-code">HERETIC</div>
    <div class="college-name">Heretic Position</div>
    <div class="director-name">${heretic.director_name || 'Vacant'}</div>
    ${heretic.rationale ? `<div class="rationale">${heretic.rationale}</div>` : ''}
  `;

  return card;
}

// Load board members when page loads
document.addEventListener('DOMContentLoaded', loadBoardMembers);
