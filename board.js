// Board chat and voting functionality
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = window.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';

let supabase = null;
let currentUser = null;
let chatSubscription = null;
let issuesSubscription = null;

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

  document.getElementById('login-container').style.display = 'none';
  document.getElementById('board-interface').style.display = 'block';
  
  const userEmailEl = document.getElementById('user-email');
  if (member) {
    userEmailEl.textContent = `${member.name || member.email} (${member.member_class})`;
  } else {
    userEmailEl.textContent = currentUser.email;
  }
  
  document.getElementById('login-btn').style.display = 'none';
  document.getElementById('logout-btn').style.display = 'inline-block';
  
  // Show members link if custodian
  if (member && member.member_class === 'custodian') {
    document.getElementById('members-link').style.display = 'inline-block';
  }

  await loadChatMessages();
  await loadIssues();
  setupSubscriptions();
}

// Handle authentication failure
function handleAuthFailure() {
  document.getElementById('login-container').style.display = 'block';
  document.getElementById('board-interface').style.display = 'none';
  document.getElementById('user-email').textContent = '';
  document.getElementById('login-btn').style.display = 'inline-block';
  document.getElementById('logout-btn').style.display = 'none';

  if (chatSubscription) {
    supabase.removeChannel(chatSubscription);
    chatSubscription = null;
  }
  if (issuesSubscription) {
    supabase.removeChannel(issuesSubscription);
    issuesSubscription = null;
  }
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

// Logout handler
async function handleLogout() {
  await supabase.auth.signOut();
}

// Load chat messages
async function loadChatMessages() {
  const messagesEl = document.getElementById('chat-messages');
  
  try {
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    messagesEl.innerHTML = '';
    document.getElementById('message-count').textContent = `${messages.length} messages`;

    if (messages.length === 0) {
      messagesEl.innerHTML = '<div class="loading">No messages yet. Start the conversation!</div>';
      return;
    }

    messages.forEach(msg => {
      const messageEl = createMessageElement(msg);
      messagesEl.appendChild(messageEl);
    });

    // Scroll to bottom
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } catch (error) {
    console.error('Error loading messages:', error);
    messagesEl.innerHTML = '<div class="error">Error loading messages</div>';
  }
}

// Create message element
function createMessageElement(message) {
  const div = document.createElement('div');
  div.className = 'chat-message';
  
  if (message.off_the_record) {
    div.classList.add('off-the-record');
  }
  
  const time = new Date(message.created_at).toLocaleString();
  const offRecordBadge = message.off_the_record 
    ? '<span class="off-record-badge">🔒 Off the Record</span>' 
    : '';
  
  div.innerHTML = `
    <div class="chat-message-header">
      <span class="chat-message-author">${escapeHtml(message.user_name || message.user_email)}</span>
      <span class="chat-message-time">${time} ${offRecordBadge}</span>
    </div>
    <div class="chat-message-text">${escapeHtml(message.message)}</div>
  `;
  
  return div;
}

// Send message
async function sendMessage(messageText, offTheRecord = false) {
  if (!currentUser) return;

  // Get member info
  const { data: member } = await supabase
    .from('members')
    .select('id, name')
    .eq('email', currentUser.email)
    .single();

  const { error } = await supabase
    .from('chat_messages')
    .insert({
      user_email: currentUser.email,
      user_name: member?.name || currentUser.user_metadata?.name || currentUser.email.split('@')[0],
      message: messageText,
      member_id: member?.id || null,
      off_the_record: offTheRecord,
    });

  if (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message: ' + error.message);
  }
}

// Setup real-time subscriptions
function setupSubscriptions() {
  // Chat messages subscription
  chatSubscription = supabase
    .channel('chat_messages')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      (payload) => {
        const messageEl = createMessageElement(payload.new);
        const messagesEl = document.getElementById('chat-messages');
        messagesEl.appendChild(messageEl);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        
        const count = messagesEl.children.length;
        document.getElementById('message-count').textContent = `${count} messages`;
      }
    )
    .subscribe();

  // Issues subscription
  issuesSubscription = supabase
    .channel('issues')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'issues' },
      () => loadIssues()
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'votes' },
      () => loadIssues()
    )
    .subscribe();
}

// Load issues
async function loadIssues() {
  const issuesEl = document.getElementById('issues-list');
  
  try {
    const { data: issues, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    issuesEl.innerHTML = '';

    if (issues.length === 0) {
      issuesEl.innerHTML = '<div class="loading">No issues yet. Create one to start voting!</div>';
      return;
    }

    for (const issue of issues) {
      const issueEl = await createIssueElement(issue);
      issuesEl.appendChild(issueEl);
    }
  } catch (error) {
    console.error('Error loading issues:', error);
    issuesEl.innerHTML = '<div class="error">Error loading issues</div>';
  }
}

// Create issue element
async function createIssueElement(issue) {
  const div = document.createElement('div');
  div.className = 'issue-card';
  div.dataset.issueId = issue.id;

  // Get vote summary
  const { data: voteSummary } = await supabase.rpc('get_issue_vote_summary', {
    issue_uuid: issue.id
  });

  const time = new Date(issue.created_at).toLocaleString();
  
  let voteSummaryHtml = '';
  if (voteSummary && voteSummary.length > 0) {
    const voteCounts = voteSummary.map(v => {
      const directors = v.directors.join(', ');
      return `
        <div class="vote-count ${v.vote_type}">
          <strong>${v.vote_type.toUpperCase()}:</strong> ${v.count}
          ${directors ? `<div class="vote-directors">${directors}</div>` : ''}
        </div>
      `;
    }).join('');
    
    voteSummaryHtml = `
      <div class="vote-summary">
        <div class="vote-summary-title">Votes:</div>
        <div class="vote-counts">${voteCounts}</div>
      </div>
    `;
  }

  div.innerHTML = `
    <div class="issue-header">
      <div>
        <div class="issue-title">${escapeHtml(issue.title)}</div>
        <div class="issue-meta">
          <span>Created by ${escapeHtml(issue.created_by)}</span>
          <span>${time}</span>
        </div>
      </div>
      <span class="issue-status ${issue.status}">${issue.status}</span>
    </div>
    ${issue.description ? `<div class="issue-description">${escapeHtml(issue.description)}</div>` : ''}
    ${voteSummaryHtml}
    <div class="issue-actions">
      <button class="btn-primary btn-small vote-btn" data-issue-id="${issue.id}">Cast Vote</button>
    </div>
  `;

  // Add vote button handler
  div.querySelector('.vote-btn').addEventListener('click', () => openVoteModal(issue));

  return div;
}

// Open vote modal
async function openVoteModal(issue) {
  const modal = document.getElementById('vote-modal');
  const detailsEl = document.getElementById('vote-issue-details');
  const issueIdEl = document.getElementById('vote-issue-id');
  const directorSelect = document.getElementById('vote-director');

  issueIdEl.value = issue.id;
  
  detailsEl.innerHTML = `
    <div class="issue-card" style="margin-bottom: 1.5rem;">
      <div class="issue-title">${escapeHtml(issue.title)}</div>
      ${issue.description ? `<div class="issue-description">${escapeHtml(issue.description)}</div>` : ''}
    </div>
  `;

  // Load directors
  const { data: directors } = await supabase
    .from('board_of_directors')
    .select('director_name, colleges(code)')
    .order('director_name');

  directorSelect.innerHTML = '<option value="">Select a director...</option>';
  directors.forEach(dir => {
    const option = document.createElement('option');
    option.value = dir.director_name;
    option.textContent = `${dir.director_name}${dir.colleges ? ` (${dir.colleges.code})` : ''}`;
    directorSelect.appendChild(option);
  });

  modal.style.display = 'flex';
}

// Close vote modal
function closeVoteModal() {
  document.getElementById('vote-modal').style.display = 'none';
  document.getElementById('vote-form').reset();
}

// Submit vote
async function submitVote(issueId, directorName, voteType, rationale) {
  const { error } = await supabase
    .from('votes')
    .upsert({
      issue_id: issueId,
      director_name: directorName,
      vote_type: voteType,
      rationale: rationale || null,
    }, {
      onConflict: 'issue_id,director_name'
    });

  if (error) {
    console.error('Error submitting vote:', error);
    alert('Failed to submit vote: ' + error.message);
    return false;
  }

  return true;
}

// Create new issue
async function createIssue(title, description) {
  if (!currentUser) return;

  const { error } = await supabase
    .from('issues')
    .insert({
      title,
      description: description || null,
      created_by: currentUser.email,
      status: 'open',
    });

  if (error) {
    console.error('Error creating issue:', error);
    alert('Failed to create issue: ' + error.message);
    return false;
  }

  return true;
}

// Open new issue modal
function openNewIssueModal() {
  document.getElementById('issue-modal').style.display = 'flex';
}

// Close new issue modal
function closeNewIssueModal() {
  document.getElementById('issue-modal').style.display = 'none';
  document.getElementById('new-issue-form').reset();
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

  // Logout button
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('login-btn').addEventListener('click', () => {
    document.getElementById('login-container').style.display = 'block';
  });

  // Record toggle
  const offRecordToggle = document.getElementById('off-the-record-toggle');
  const toggleLabel = document.getElementById('toggle-label');
  
  offRecordToggle.addEventListener('change', (e) => {
    toggleLabel.textContent = e.target.checked ? 'Off the Record' : 'On the Record';
  });

  // Chat form
  document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    const offTheRecord = offRecordToggle.checked;
    
    if (message) {
      await sendMessage(message, offTheRecord);
      input.value = '';
      // Reset toggle after sending
      offRecordToggle.checked = false;
      toggleLabel.textContent = 'On the Record';
    }
  });

  // New issue
  document.getElementById('new-issue-btn').addEventListener('click', openNewIssueModal);
  document.getElementById('new-issue-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('issue-title').value;
    const description = document.getElementById('issue-description').value;
    if (await createIssue(title, description)) {
      closeNewIssueModal();
    }
  });
  document.getElementById('close-issue-modal').addEventListener('click', closeNewIssueModal);
  document.getElementById('cancel-issue').addEventListener('click', closeNewIssueModal);

  // Vote form
  document.getElementById('vote-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const issueId = document.getElementById('vote-issue-id').value;
    const directorName = document.getElementById('vote-director').value;
    const voteType = document.querySelector('input[name="vote-type"]:checked').value;
    const rationale = document.getElementById('vote-rationale').value;
    
    if (await submitVote(issueId, directorName, voteType, rationale)) {
      closeVoteModal();
    }
  });
  document.getElementById('close-vote-modal').addEventListener('click', closeVoteModal);
  document.getElementById('cancel-vote').addEventListener('click', closeVoteModal);

  // Close modals on outside click
  document.getElementById('issue-modal').addEventListener('click', (e) => {
    if (e.target.id === 'issue-modal') closeNewIssueModal();
  });
  document.getElementById('vote-modal').addEventListener('click', (e) => {
    if (e.target.id === 'vote-modal') closeVoteModal();
  });
});
