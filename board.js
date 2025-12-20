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
  
  // Load board content for public viewing
  await loadChatMessages();
  await loadIssues();
  setupSubscriptions();
  
  // Check for existing session
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await handleAuthSuccess();
  } else {
    // Show board interface even when not logged in (public viewing)
    document.getElementById('board-interface').style.display = 'block';
    document.getElementById('chat-form').style.display = 'none'; // Hide input for non-authenticated
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
  
  // Show chat form for authenticated users
  document.getElementById('chat-form').style.display = 'flex';
  
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
  
  // Show off-the-record toggle only for alpha members
  const offRecordToggleContainer = document.getElementById('off-record-toggle-container');
  if (member && member.member_class === 'alpha') {
    if (offRecordToggleContainer) offRecordToggleContainer.style.display = 'flex';
  } else {
    if (offRecordToggleContainer) offRecordToggleContainer.style.display = 'none';
  }
  
  // Show off-the-record toggle only for alpha members
  const offRecordToggleContainer = document.getElementById('off-record-toggle-container');
  if (member && member.member_class === 'alpha') {
    offRecordToggleContainer.style.display = 'flex';
  } else {
    offRecordToggleContainer.style.display = 'none';
  }

  await loadChatMessages();
  await loadIssues();
  setupSubscriptions();
}

// Handle authentication failure (but still allow public viewing)
function handleAuthFailure() {
  document.getElementById('login-container').style.display = 'block';
  document.getElementById('board-interface').style.display = 'block'; // Show board even when not logged in
  document.getElementById('user-email').textContent = '';
  document.getElementById('login-btn').style.display = 'inline-block';
  document.getElementById('logout-btn').style.display = 'none';
  document.getElementById('members-link').style.display = 'none';
  document.getElementById('off-record-toggle-container').style.display = 'none';
  
  // Hide chat input for non-authenticated users
  const chatForm = document.getElementById('chat-form');
  if (chatForm) {
    chatForm.style.display = currentUser ? 'flex' : 'none';
  }

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
    
    // Add system message with director principles
    const systemMessage = createSystemMessage();
    messagesEl.appendChild(systemMessage);
    
    document.getElementById('message-count').textContent = `${messages.length} messages`;

    if (messages.length === 0) {
      messagesEl.innerHTML += '<div class="loading">No messages yet. Start the conversation!</div>';
      messagesEl.scrollTop = messagesEl.scrollHeight;
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

// Create system message with director principles
function createSystemMessage() {
  const div = document.createElement('div');
  div.className = 'chat-message system-message';
  
  div.innerHTML = `
    <div class="chat-message-header">
      <span class="chat-message-author">📜 System</span>
      <span class="chat-message-time">Director Principles</span>
    </div>
    <div class="chat-message-text">
      <strong>Director Principles for Board Proceedings:</strong>
      <ol style="margin: 0.5rem 0; padding-left: 1.5rem;">
        <li><strong>Institute First:</strong> Prioritize what is best for the Inquiry Institute as a whole.</li>
        <li><strong>College Representation:</strong> Represent your college's interests and views. Convene faculty meetings to elucidate college positions when needed.</li>
        <li><strong>Platform Adherence:</strong> Adhere to your platform statement, which guides your decision-making and representation.</li>
        <li><strong>Decision Hierarchy:</strong> Consider in order: (1) Institute's best interest, (2) College's best interest, (3) College's views, (4) Personal platform.</li>
      </ol>
      <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.8;">These principles guide all board discussions and decisions.</p>
    </div>
  `;
  
  return div;
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
  if (!currentUser) {
    alert('Please log in to send messages');
    return;
  }

  // Get member info
  const { data: member } = await supabase
    .from('members')
    .select('id, name, member_class')
    .eq('email', currentUser.email)
    .single();

  // Only alpha members can post off-the-record
  if (offTheRecord && (!member || member.member_class !== 'alpha')) {
    alert('Only alpha members can post off-the-record messages');
    return;
  }

  const { error } = await supabase
    .from('chat_messages')
    .insert({
      user_email: currentUser.email,
      user_name: member?.name || currentUser.user_metadata?.name || currentUser.email.split('@')[0],
      message: messageText,
      member_id: member?.id || null,
      off_the_record: offTheRecord && member?.member_class === 'alpha', // Ensure only alpha can post off-record
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
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'action_items' },
      () => {
        if (document.getElementById('action-items-tab').classList.contains('active')) {
          loadActionItems();
        }
      }
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

  // Get detailed vote summary with weights
  const { data: voteSummary } = await supabase.rpc('get_detailed_vote_summary', {
    issue_uuid: issue.id
  });

  const time = new Date(issue.created_at).toLocaleString();
  
  let voteSummaryHtml = '';
  if (voteSummary && voteSummary.length > 0) {
    const totalVotes = voteSummary[0]?.total_votes || 0;
    const totalWeighted = voteSummary[0]?.total_weighted || 0;
    
    const voteCounts = voteSummary.map(v => {
      const directors = v.directors.join(', ');
      const weightedInfo = v.weighted_votes > v.vote_count ? ` (weighted: ${v.weighted_votes})` : '';
      return `
        <div class="vote-count ${v.vote_type}">
          <strong>${v.vote_type.toUpperCase()}:</strong> ${v.vote_count}${weightedInfo}
          ${directors ? `<div class="vote-directors">${directors}</div>` : ''}
        </div>
      `;
    }).join('');
    
    voteSummaryHtml = `
      <div class="vote-summary">
        <div class="vote-summary-title">Votes: ${totalVotes} total${totalWeighted > totalVotes ? ` (${totalWeighted} weighted)` : ''}</div>
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
      <button class="btn-secondary btn-small action-item-btn" data-issue-id="${issue.id}">+ Action Item</button>
    </div>
  `;

  // Add vote button handler
  div.querySelector('.vote-btn').addEventListener('click', () => openVoteModal(issue));
  div.querySelector('.action-item-btn').addEventListener('click', () => openActionItemModal(issue.id));

  return div;
}

// Load action items
async function loadActionItems() {
  const actionItemsEl = document.getElementById('action-items-list');
  
  try {
    const { data: actionItems, error } = await supabase
      .from('action_items')
      .select('*, issues(title)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    actionItemsEl.innerHTML = '';

    if (actionItems.length === 0) {
      actionItemsEl.innerHTML = '<div class="loading">No action items yet. Create one to track tasks!</div>';
      return;
    }

    actionItems.forEach(item => {
      const itemEl = createActionItemElement(item);
      actionItemsEl.appendChild(itemEl);
    });
  } catch (error) {
    console.error('Error loading action items:', error);
    actionItemsEl.innerHTML = '<div class="error">Error loading action items</div>';
  }
}

// Create action item element
function createActionItemElement(item) {
  const div = document.createElement('div');
  div.className = 'action-item-card';
  div.dataset.actionItemId = item.id;

  const dueDate = item.due_date ? new Date(item.due_date) : null;
  const isOverdue = dueDate && dueDate < new Date() && item.status !== 'completed' && item.status !== 'cancelled';
  const dueDateStr = dueDate ? dueDate.toLocaleDateString() : 'No due date';
  const createdDate = new Date(item.created_at).toLocaleDateString();

  div.innerHTML = `
    <div class="action-item-header">
      <div>
        <div class="action-item-title">${escapeHtml(item.title)}</div>
        <div class="action-item-meta">
          <span>Created: ${createdDate}</span>
          ${item.issues ? `<span>Issue: ${escapeHtml(item.issues.title)}</span>` : ''}
          ${item.assigned_to ? `<span>Assigned: ${escapeHtml(item.assigned_to)}</span>` : '<span>Unassigned</span>'}
        </div>
      </div>
      <span class="action-item-status ${item.status}">${item.status.replace('_', ' ')}</span>
    </div>
    ${item.description ? `<div class="action-item-description">${escapeHtml(item.description)}</div>` : ''}
    ${item.assigned_to ? `<div class="action-item-assigned"><strong>Assigned to:</strong> ${escapeHtml(item.assigned_to)}</div>` : ''}
    <div class="action-item-due-date ${isOverdue ? 'overdue' : ''}">
      ${isOverdue ? '⚠️ ' : ''}Due: ${dueDateStr}
    </div>
    <div class="action-item-actions">
      <select class="action-item-status-select" data-id="${item.id}" data-current="${item.status}">
        <option value="open" ${item.status === 'open' ? 'selected' : ''}>Open</option>
        <option value="in_progress" ${item.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
        <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>Completed</option>
        <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
      </select>
    </div>
  `;

  // Add status change handler
  const select = div.querySelector('.action-item-status-select');
  select.addEventListener('change', async (e) => {
    const newStatus = e.target.value;
    const oldStatus = e.target.dataset.current;
    
    if (newStatus === oldStatus) return;
    
    if (await updateActionItemStatus(item.id, newStatus)) {
      e.target.dataset.current = newStatus;
      await loadActionItems();
    } else {
      e.target.value = oldStatus;
    }
  });

  return div;
}

// Create action item
async function createActionItem(title, description, assignedTo, dueDate, issueId) {
  if (!currentUser) return;

  const actionItem = {
    title,
    description: description || null,
    assigned_to: assignedTo || null,
    due_date: dueDate || null,
    issue_id: issueId || null,
    created_by: currentUser.email,
    status: 'open',
  };

  const { error } = await supabase
    .from('action_items')
    .insert(actionItem);

  if (error) {
    console.error('Error creating action item:', error);
    alert('Failed to create action item: ' + error.message);
    return false;
  }

  return true;
}

// Update action item status
async function updateActionItemStatus(actionItemId, newStatus) {
  const update = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'completed') {
    update.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('action_items')
    .update(update)
    .eq('id', actionItemId);

  if (error) {
    console.error('Error updating action item:', error);
    alert('Failed to update action item: ' + error.message);
    return false;
  }

  return true;
}

// Open action item modal
function openActionItemModal(issueId = null) {
  const modal = document.getElementById('action-item-modal');
  const issueIdEl = document.getElementById('action-item-issue-id');
  
  issueIdEl.value = issueId || '';
  modal.style.display = 'flex';
}

// Close action item modal
function closeActionItemModal() {
  document.getElementById('action-item-modal').style.display = 'none';
  document.getElementById('new-action-item-form').reset();
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
async function submitVote(issueId, directorName, voteType, rationale, voteWeight = 1, notes = null) {
  const { error } = await supabase
    .from('votes')
    .upsert({
      issue_id: issueId,
      director_name: directorName,
      vote_type: voteType,
      rationale: rationale || null,
      vote_weight: voteWeight || 1,
      notes: notes || null,
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
    const voteWeight = parseInt(document.getElementById('vote-weight').value) || 1;
    const notes = document.getElementById('vote-notes').value;
    
    if (await submitVote(issueId, directorName, voteType, rationale, voteWeight, notes)) {
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

  // Guidelines toggle
  document.getElementById('toggle-guidelines').addEventListener('click', () => {
    const panel = document.getElementById('guidelines-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('close-guidelines').addEventListener('click', () => {
    document.getElementById('guidelines-panel').style.display = 'none';
  });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      // Update button states
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update content visibility
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
      });
      
      const targetTab = document.getElementById(`${tabName}-tab`);
      if (targetTab) {
        targetTab.classList.add('active');
        targetTab.style.display = 'block';
      }
      
      // Load data if needed
      if (tabName === 'action-items') {
        loadActionItems();
      }
    });
  });

  // Action item form
  document.getElementById('new-action-item-btn').addEventListener('click', () => openActionItemModal());
  document.getElementById('new-action-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('action-item-title').value;
    const description = document.getElementById('action-item-description').value;
    const assignedTo = document.getElementById('action-item-assigned').value;
    const dueDate = document.getElementById('action-item-due-date').value;
    const issueId = document.getElementById('action-item-issue-id').value || null;
    
    if (await createActionItem(title, description, assignedTo, dueDate, issueId)) {
      closeActionItemModal();
      await loadActionItems();
    }
  });
  document.getElementById('close-action-item-modal').addEventListener('click', closeActionItemModal);
  document.getElementById('cancel-action-item').addEventListener('click', closeActionItemModal);

  // Close action item modal on outside click
  document.getElementById('action-item-modal').addEventListener('click', (e) => {
    if (e.target.id === 'action-item-modal') closeActionItemModal();
  });
});
