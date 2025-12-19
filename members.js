// Member management functionality
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = window.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';

let supabase = null;
let currentUser = null;
let currentMember = null;

// Initialize Supabase
async function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase URL and Anon Key must be configured');
    return null;
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Check for existing session
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await handleAuthSuccess();
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      handleAuthSuccess();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentMember = null;
      handleAuthFailure();
    }
  });

  return supabase;
}

// Handle successful authentication
async function handleAuthSuccess() {
  // Ensure member record exists
  try {
    await supabase.rpc('ensure_member_exists');
  } catch (error) {
    console.warn('Could not ensure member exists:', error);
  }

  // Get member info
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('email', currentUser.email)
    .single();

  currentMember = member;

  document.getElementById('login-container').style.display = 'none';
  document.getElementById('signup-container').style.display = 'none';
  
  const userEmailEl = document.getElementById('user-email');
  if (member) {
    userEmailEl.textContent = `${member.name || member.email} (${member.member_class})`;
  } else {
    userEmailEl.textContent = currentUser.email;
  }
  
  document.getElementById('login-btn').style.display = 'none';
  document.getElementById('logout-btn').style.display = 'inline-block';

  // Check if custodian
  if (member && member.member_class === 'custodian') {
    document.getElementById('member-interface').style.display = 'block';
    document.getElementById('access-denied').style.display = 'none';
    await loadMembers();
  } else {
    document.getElementById('member-interface').style.display = 'block';
    document.getElementById('access-denied').style.display = 'block';
    document.getElementById('members-list').style.display = 'none';
  }
}

// Handle authentication failure
function handleAuthFailure() {
  document.getElementById('login-container').style.display = 'block';
  document.getElementById('signup-container').style.display = 'none';
  document.getElementById('member-interface').style.display = 'none';
  document.getElementById('user-email').textContent = '';
  document.getElementById('login-btn').style.display = 'inline-block';
  document.getElementById('logout-btn').style.display = 'none';
}

// Login handler
async function handleLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = error.message;
    errorEl.style.display = 'block';
    return false;
  }

  return true;
}

// Signup handler
async function handleSignup(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
      }
    }
  });

  if (error) {
    const errorEl = document.getElementById('signup-error');
    errorEl.textContent = error.message;
    errorEl.style.display = 'block';
    return false;
  }

  // Ensure member record is created
  try {
    await supabase.rpc('ensure_member_exists');
  } catch (err) {
    console.warn('Could not ensure member exists:', err);
  }

  return true;
}

// Logout handler
async function handleLogout() {
  await supabase.auth.signOut();
}

// Load members (custodian only)
async function loadMembers() {
  const membersEl = document.getElementById('members-list');
  
  try {
    const { data: members, error } = await supabase.rpc('list_members');

    if (error) {
      if (error.message.includes('Only custodian')) {
        membersEl.innerHTML = '<div class="error">Access denied. Only custodian can view members.</div>';
        return;
      }
      throw error;
    }

    membersEl.innerHTML = '';

    if (members.length === 0) {
      membersEl.innerHTML = '<div class="loading">No members found.</div>';
      return;
    }

    members.forEach(member => {
      const memberEl = createMemberElement(member);
      membersEl.appendChild(memberEl);
    });
  } catch (error) {
    console.error('Error loading members:', error);
    membersEl.innerHTML = '<div class="error">Error loading members: ' + error.message + '</div>';
  }
}

// Create member element
function createMemberElement(member) {
  const div = document.createElement('div');
  div.className = 'issue-card';
  div.dataset.memberId = member.id;

  const time = new Date(member.created_at).toLocaleString();
  const classBadge = `<span class="issue-status ${member.member_class}">${member.member_class}</span>`;

  div.innerHTML = `
    <div class="issue-header">
      <div>
        <div class="issue-title">${escapeHtml(member.name || member.email)}</div>
        <div class="issue-meta">
          <span>${escapeHtml(member.email)}</span>
          <span>Joined: ${time}</span>
        </div>
      </div>
      ${classBadge}
    </div>
    <div class="issue-actions">
      <select class="member-class-select" data-email="${member.email}" data-current="${member.member_class}">
        <option value="member" ${member.member_class === 'member' ? 'selected' : ''}>Member</option>
        <option value="observer" ${member.member_class === 'observer' ? 'selected' : ''}>Observer</option>
        <option value="custodian" ${member.member_class === 'custodian' ? 'selected' : ''}>Custodian</option>
      </select>
    </div>
  `;

  // Add change handler
  const select = div.querySelector('.member-class-select');
  select.addEventListener('change', async (e) => {
    const email = e.target.dataset.email;
    const newClass = e.target.value;
    const oldClass = e.target.dataset.current;

    if (newClass === oldClass) return;

    if (await updateMemberClass(email, newClass)) {
      e.target.dataset.current = newClass;
      // Reload to update display
      await loadMembers();
    } else {
      // Revert selection
      e.target.value = oldClass;
    }
  });

  return div;
}

// Add member
async function addMember(email, name, memberClass) {
  try {
    const { data, error } = await supabase.rpc('add_member', {
      member_email: email,
      member_name: name,
      member_class: memberClass
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding member:', error);
    alert('Failed to add member: ' + error.message);
    return false;
  }
}

// Update member class
async function updateMemberClass(email, newClass) {
  try {
    const { error } = await supabase.rpc('update_member_class', {
      member_email: email,
      new_class: newClass
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating member class:', error);
    alert('Failed to update member class: ' + error.message);
    return false;
  }
}

// Utility: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
  await initSupabase();

  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await handleLogin(email, password);
  });

  // Signup form
  document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const name = document.getElementById('signup-name').value;
    
    if (await handleSignup(email, password, name)) {
      alert('Account created! Please check your email to verify your account, then login.');
      document.getElementById('signup-container').style.display = 'none';
      document.getElementById('login-container').style.display = 'block';
    }
  });

  // Show signup
  document.getElementById('show-signup').addEventListener('click', () => {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('signup-container').style.display = 'block';
  });

  // Show login
  document.getElementById('show-login').addEventListener('click', () => {
    document.getElementById('signup-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
  });

  // Logout button
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('login-btn').addEventListener('click', () => {
    document.getElementById('login-container').style.display = 'block';
  });

  // Add member
  document.getElementById('add-member-btn').addEventListener('click', () => {
    document.getElementById('add-member-modal').style.display = 'flex';
  });

  document.getElementById('add-member-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('member-email').value;
    const name = document.getElementById('member-name').value;
    const memberClass = document.getElementById('member-class').value;
    
    if (await addMember(email, name, memberClass)) {
      closeAddMemberModal();
      await loadMembers();
    }
  });

  document.getElementById('close-add-member-modal').addEventListener('click', closeAddMemberModal);
  document.getElementById('cancel-add-member').addEventListener('click', closeAddMemberModal);

  // Close modal on outside click
  document.getElementById('add-member-modal').addEventListener('click', (e) => {
    if (e.target.id === 'add-member-modal') closeAddMemberModal();
  });
});

function closeAddMemberModal() {
  document.getElementById('add-member-modal').style.display = 'none';
  document.getElementById('add-member-form').reset();
}
