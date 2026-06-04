/**
 * VibeNet UI Controller Module
 * Handles all dynamic DOM rendering, relative date formatting, toast messages, and interactive animations.
 */

import { Comments } from './api.js';

// Format timestamp into relative, readable text
export function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Show animated Toast alert
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' 
    ? '<i class="fa-solid fa-circle-check" style="color: var(--secondary-color)"></i>' 
    : '<i class="fa-solid fa-circle-exclamation" style="color: var(--accent-pink)"></i>';

  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);

  // Auto remove after 3.5s
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3500);
}

// Get initials for avatar placeholders
export function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

// Render dynamic Feed Posts
export function renderPosts({ posts, container, currentUser, onLike, onCommentSubmit, onDeletePost, navigateToProfile }) {
  container.innerHTML = '';
  
  if (posts.length === 0) {
    container.innerHTML = '<div class="empty-text"><i class="fa-regular fa-paper-plane" style="font-size: 2rem; display:block; margin-bottom:10px;"></i> No posts yet. Be the first to share your vibe!</div>';
    return;
  }

  posts.forEach(post => {
    const isLiked = currentUser && post.likes.includes(currentUser._id);
    const isAuthor = currentUser && post.author._id === currentUser._id;
    const authorName = post.author.username;
    
    const postEl = document.createElement('article');
    postEl.className = 'card post-card';
    postEl.dataset.id = post._id;
    
    postEl.innerHTML = `
      <div class="post-header">
        <div class="post-author-meta">
          <div class="avatar avatar-md user-profile-link" data-username="${authorName}">${getInitials(authorName)}</div>
          <div class="author-names">
            <h4 class="user-profile-link" data-username="${authorName}">${authorName}</h4>
            <span class="post-time">${formatTime(post.createdAt)}</span>
          </div>
        </div>
        ${isAuthor ? `
          <button class="btn-icon delete-post-btn" title="Delete post" data-id="${post._id}">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        ` : ''}
      </div>

      <div class="post-content">${escapeHTML(post.content)}</div>

      <div class="post-actions">
        <button class="post-action-btn btn-like ${isLiked ? 'liked' : ''}" data-id="${post._id}">
          <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          <span class="likes-count">${post.likes.length}</span>
        </button>
        <button class="post-action-btn toggle-comments-btn" data-id="${post._id}">
          <i class="fa-regular fa-comment-dots"></i>
          <span>Comments</span>
        </button>
      </div>

      <!-- Comments Thread Section (Initially Closed/Lazy Loaded) -->
      <div class="comments-section" id="comments-sec-${post._id}" style="display: none;">
        <div class="comments-list" id="comments-list-${post._id}">
          <div class="loader-container"><div class="spinner"></div></div>
        </div>
        
        ${currentUser ? `
          <div class="comment-input-row">
            <div class="avatar avatar-sm">${getInitials(currentUser.username)}</div>
            <form class="comment-form" data-postid="${post._id}">
              <input type="text" placeholder="Write a comment..." maxlength="500" required>
              <button type="submit" class="btn btn-primary btn-sm"><i class="fa-solid fa-arrow-right"></i></button>
            </form>
          </div>
        ` : `
          <p class="empty-comments-text">Please log in to add comments.</p>
        `}
      </div>
    `;

    // Hook events inside the post card
    postEl.querySelectorAll('.user-profile-link').forEach(el => {
      el.addEventListener('click', () => navigateToProfile(el.dataset.username));
    });

    if (isAuthor) {
      postEl.querySelector('.delete-post-btn').addEventListener('click', (e) => {
        if (confirm('Are you sure you want to delete this post?')) {
          onDeletePost(post._id);
        }
      });
    }

    const likeBtn = postEl.querySelector('.btn-like');
    likeBtn.addEventListener('click', () => {
      if (!currentUser) {
        showToast('Please log in to like posts', 'error');
        return;
      }
      onLike(post._id, likeBtn);
    });

    const commentToggleBtn = postEl.querySelector('.toggle-comments-btn');
    const commentsSec = postEl.querySelector('.comments-section');
    commentToggleBtn.addEventListener('click', () => {
      const isVisible = commentsSec.style.display !== 'none';
      if (isVisible) {
        commentsSec.style.display = 'none';
      } else {
        commentsSec.style.display = 'block';
        loadCommentsForPost(post._id, postEl.querySelector(`#comments-list-${post._id}`), currentUser, navigateToProfile);
      }
    });

    const commentForm = postEl.querySelector('.comment-form');
    if (commentForm) {
      commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = commentForm.querySelector('input');
        onCommentSubmit(post._id, input.value, () => {
          input.value = '';
          // Reload comments list on success
          loadCommentsForPost(post._id, postEl.querySelector(`#comments-list-${post._id}`), currentUser, navigateToProfile);
        });
      });
    }

    container.appendChild(postEl);
  });
}

// Load comments asynchronously
async function loadCommentsForPost(postId, listContainer, currentUser, navigateToProfile) {
  try {
    const data = await Comments.getComments(postId);

    listContainer.innerHTML = '';
    const comments = data.comments;

    if (comments.length === 0) {
      listContainer.innerHTML = '<p class="empty-comments-text">No comments yet. Start the conversation!</p>';
      return;
    }

    comments.forEach(comment => {
      const commentEl = document.createElement('div');
      commentEl.className = 'comment-item';
      const cAuthor = comment.author.username;

      commentEl.innerHTML = `
        <div class="avatar avatar-sm user-profile-link" data-username="${cAuthor}">${getInitials(cAuthor)}</div>
        <div class="comment-bubble">
          <div class="comment-author-row">
            <span class="comment-author-name user-profile-link" data-username="${cAuthor}">${cAuthor}</span>
            <span class="comment-time">${formatTime(comment.createdAt)}</span>
          </div>
          <div class="comment-content">${escapeHTML(comment.content)}</div>
        </div>
      `;

      commentEl.querySelectorAll('.user-profile-link').forEach(el => {
        el.addEventListener('click', () => navigateToProfile(el.dataset.username));
      });

      listContainer.appendChild(commentEl);
    });

    // Scroll to bottom of comments list
    listContainer.scrollTop = listContainer.scrollHeight;
  } catch (err) {
    listContainer.innerHTML = `<p class="empty-comments-text" style="color:var(--accent-pink)">Failed to load comments</p>`;
  }
}

// Render users grid (Explore)
export function renderUsers({ users, container, currentUser, onFollow, navigateToProfile }) {
  container.innerHTML = '';

  if (users.length === 0) {
    container.innerHTML = '<div class="empty-text">No users found.</div>';
    return;
  }

  // Filter out current user from explore grid list
  const filteredUsers = users.filter(u => !currentUser || u._id !== currentUser._id);

  if (filteredUsers.length === 0) {
    container.innerHTML = '<div class="empty-text">You are the only member in this network so far!</div>';
    return;
  }

  filteredUsers.forEach(user => {
    const isFollowing = currentUser && currentUser.following.includes(user._id);

    const card = document.createElement('div');
    card.className = 'card user-directory-card';
    card.innerHTML = `
      <div class="avatar avatar-lg user-profile-link" data-username="${user.username}">${getInitials(user.username)}</div>
      <div>
        <h3 class="user-profile-link" data-username="${user.username}">${user.username}</h3>
        <p class="user-bio">${user.bio ? escapeHTML(user.bio) : 'Vibing quietly...'}</p>
      </div>
      <div class="user-stats">
        <span><strong>${user.followers ? user.followers.length : 0}</strong> followers</span>
      </div>
      ${currentUser ? `
        <button class="btn btn-sm w-full follow-btn ${isFollowing ? 'btn-outline' : 'btn-primary'}" data-id="${user._id}">
          ${isFollowing ? '<i class="fa-solid fa-user-minus"></i> Unfollow' : '<i class="fa-solid fa-user-plus"></i> Follow'}
        </button>
      ` : `
        <button class="btn btn-outline btn-sm w-full follow-disabled-btn"><i class="fa-solid fa-user-plus"></i> Follow</button>
      `}
    `;

    card.querySelectorAll('.user-profile-link').forEach(el => {
      el.addEventListener('click', () => navigateToProfile(el.dataset.username));
    });

    const followBtn = card.querySelector('.follow-btn');
    if (followBtn) {
      followBtn.addEventListener('click', () => {
        onFollow(user._id, followBtn);
      });
    }

    const disabledBtn = card.querySelector('.follow-disabled-btn');
    if (disabledBtn) {
      disabledBtn.addEventListener('click', () => {
        showToast('Please log in to follow users', 'error');
      });
    }

    container.appendChild(card);
  });
}

// Render user suggestions in sidebar
export function renderSuggestions({ users, container, currentUser, onFollow, navigateToProfile }) {
  container.innerHTML = '';

  if (users.length === 0) {
    container.innerHTML = '<p class="empty-text">No suggestions.</p>';
    return;
  }

  // Filter out current user and already followed users
  const suggestions = users.filter(u => {
    if (currentUser && u._id === currentUser._id) return false;
    if (currentUser && currentUser.following.includes(u._id)) return false;
    return true;
  }).slice(0, 5); // Limit to 5 suggestions

  if (suggestions.length === 0) {
    container.innerHTML = '<p class="empty-text" style="padding:10px 0;">You follow everyone! 🎉</p>';
    return;
  }

  suggestions.forEach(user => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.innerHTML = `
      <div class="suggestion-user-info user-profile-link" data-username="${user.username}">
        <div class="avatar avatar-sm">${getInitials(user.username)}</div>
        <div class="names">
          <h4>${user.username}</h4>
          <span>@${user.username.toLowerCase()}</span>
        </div>
      </div>
      ${currentUser ? `
        <button class="btn btn-secondary btn-sm follow-btn" style="padding: 4px 10px; font-size:0.75rem;" data-id="${user._id}">
          <i class="fa-solid fa-plus"></i> Follow
        </button>
      ` : `
        <button class="btn btn-outline btn-sm follow-disabled-btn" style="padding: 4px 10px; font-size:0.75rem;"><i class="fa-solid fa-plus"></i></button>
      `}
    `;

    item.querySelector('.suggestion-user-info').addEventListener('click', () => {
      navigateToProfile(user.username);
    });

    const followBtn = item.querySelector('.follow-btn');
    if (followBtn) {
      followBtn.addEventListener('click', () => {
        onFollow(user._id, followBtn);
      });
    }

    const disabledBtn = item.querySelector('.follow-disabled-btn');
    if (disabledBtn) {
      disabledBtn.addEventListener('click', () => {
        showToast('Please log in to follow users', 'error');
      });
    }

    container.appendChild(item);
  });
}

// Escape HTML utility to prevent XSS
export function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
