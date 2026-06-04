/**
 * VibeNet Application Entry Point & Controller
 * Integrates API client modules, state management, event hooks, and DOM page routers.
 */

import { Auth, Posts, Users, Comments } from './js/api.js';
import { 
  showToast, 
  getInitials, 
  renderPosts, 
  renderUsers, 
  renderSuggestions, 
  escapeHTML 
} from './js/ui.js';

// Global Application State
const state = {
  currentUser: null,
  currentPage: 'feed',
  viewingProfileUsername: null,
  allUsers: []
};

// DOM Cache
const dom = {
  // Navigation
  logoBtn: document.getElementById('logo-btn'),
  feedNavBtn: document.getElementById('feed-nav-btn'),
  exploreNavBtn: document.getElementById('explore-nav-btn'),
  profileNavBtn: document.getElementById('profile-nav-btn'),
  authStatusContainer: document.getElementById('auth-status-container'),
  loginTriggerBtn: document.getElementById('login-trigger-btn'),
  
  // Pages & Viewports
  pageFeed: document.getElementById('page-feed'),
  pageExplore: document.getElementById('page-explore'),
  pageProfile: document.getElementById('page-profile'),
  postsContainer: document.getElementById('posts-container'),
  usersDirectoryContainer: document.getElementById('users-directory-container'),
  userPostsContainer: document.getElementById('user-posts-container'),
  
  // Sidebar (Left & Right)
  sidebarUserCard: document.getElementById('sidebar-user-card'),
  sidebarAvatar: document.getElementById('sidebar-avatar'),
  sidebarUsername: document.getElementById('sidebar-username'),
  sidebarHandle: document.getElementById('sidebar-handle'),
  sidebarBio: document.getElementById('sidebar-bio'),
  sidebarStats: document.getElementById('sidebar-stats'),
  sidebarFollowersCount: document.getElementById('sidebar-followers-count'),
  sidebarFollowingCount: document.getElementById('sidebar-following-count'),
  sidebarActionBtn: document.getElementById('sidebar-action-btn'),
  suggestionsContainer: document.getElementById('suggestions-container'),
  
  // Post Composer
  composeContainer: document.getElementById('compose-container'),
  composeAvatar: document.getElementById('compose-avatar'),
  createPostForm: document.getElementById('create-post-form'),
  postContent: document.getElementById('post-content'),
  charCount: document.getElementById('char-count'),
  refreshFeedBtn: document.getElementById('refresh-feed-btn'),
  
  // Profile Detail Page
  profileAvatar: document.getElementById('profile-avatar'),
  profileActionsContainer: document.getElementById('profile-actions-container'),
  profileName: document.getElementById('profile-name'),
  profileHandle: document.getElementById('profile-handle'),
  profileBioText: document.getElementById('profile-bio-text'),
  bioEditFormContainer: document.getElementById('bio-edit-form-container'),
  bioEditInput: document.getElementById('bio-edit-input'),
  bioCancelBtn: document.getElementById('bio-cancel-btn'),
  bioSaveBtn: document.getElementById('bio-save-btn'),
  profileFollowersNum: document.getElementById('profile-followers-num'),
  profileFollowingNum: document.getElementById('profile-following-num'),
  profilePostsNum: document.getElementById('profile-posts-num'),
  profileFeedTitle: document.getElementById('profile-feed-title'),

  // Auth Modals
  authModal: document.getElementById('auth-modal'),
  authModalCloseBtn: document.getElementById('auth-modal-close-btn'),
  tabLoginBtn: document.getElementById('tab-login-btn'),
  tabSignupBtn: document.getElementById('tab-signup-btn'),
  formLoginContainer: document.getElementById('form-login-container'),
  formSignupContainer: document.getElementById('form-signup-container'),
  loginForm: document.getElementById('login-form'),
  signupForm: document.getElementById('signup-form'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  signupUsername: document.getElementById('signup-username'),
  signupEmail: document.getElementById('signup-email'),
  signupPassword: document.getElementById('signup-password'),
  signupBio: document.getElementById('signup-bio')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  setupTheme();
  setupNavigation();
  setupAuthModal();
  setupPostComposer();
  setupProfileBioEditor();
  
  // Check auth session
  await checkSession();
  
  // Load initial view
  navigateTo('feed');
  
  // Fetch secondary sidebar users
  loadSidebarSuggestions();
});

// Check Session & Adjust Global State
async function checkSession() {
  try {
    const data = await Auth.getMe();
    if (data.success && data.user) {
      state.currentUser = data.user;
      updateAuthUI(true);
    } else {
      state.currentUser = null;
      updateAuthUI(false);
    }
  } catch (err) {
    state.currentUser = null;
    updateAuthUI(false);
  }
}

// Update authentication dependent UI states
function updateAuthUI(isLoggedIn) {
  if (isLoggedIn && state.currentUser) {
    const user = state.currentUser;
    const initials = getInitials(user.username);

    // Header updates
    dom.authStatusContainer.innerHTML = `
      <div class="auth-user-widget">
        <div class="auth-user-info" id="header-user-trigger">
          <span class="username">${user.username}</span>
          <span class="logout-link" id="logout-btn"><i class="fa-solid fa-power-off"></i> Logout</span>
        </div>
        <div class="avatar avatar-sm user-profile-link" data-username="${user.username}" style="cursor:pointer">${initials}</div>
      </div>
    `;

    // Hook header profile click
    dom.authStatusContainer.querySelectorAll('.user-profile-link, .username').forEach(el => {
      el.addEventListener('click', () => navigateTo('profile', user.username));
    });

    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Left Sidebar Update
    dom.sidebarAvatar.textContent = initials;
    dom.sidebarAvatar.className = 'avatar avatar-lg user-profile-link';
    dom.sidebarAvatar.dataset.username = user.username;
    dom.sidebarUsername.textContent = user.username;
    dom.sidebarHandle.textContent = `@${user.username.toLowerCase()}`;
    dom.sidebarBio.textContent = user.bio || 'Sharing positive vibes only.';
    
    dom.sidebarStats.style.display = 'grid';
    dom.sidebarFollowersCount.textContent = user.followers ? user.followers.length : 0;
    dom.sidebarFollowingCount.textContent = user.following ? user.following.length : 0;
    
    dom.sidebarActionBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Profile';
    dom.sidebarActionBtn.className = 'btn btn-outline btn-sm w-full';
    
    // Post compose widget
    dom.composeContainer.style.display = 'block';
    dom.composeAvatar.textContent = initials;
    dom.profileNavBtn.style.display = 'inline-flex';

  } else {
    // Guest User UI Reset
    dom.authStatusContainer.innerHTML = `
      <button class="btn btn-primary" id="login-trigger-btn"><i class="fa-solid fa-right-to-bracket"></i> Login</button>
    `;
    document.getElementById('login-trigger-btn').addEventListener('click', () => showAuthModal('login'));

    dom.sidebarAvatar.textContent = '?';
    dom.sidebarAvatar.className = 'avatar avatar-lg';
    dom.sidebarAvatar.removeAttribute('data-username');
    dom.sidebarUsername.textContent = 'Guest User';
    dom.sidebarHandle.textContent = '@guest';
    dom.sidebarBio.textContent = 'Log in to post, comment, follow other users and share your vibe.';
    
    dom.sidebarStats.style.display = 'none';
    dom.sidebarActionBtn.innerHTML = '<i class="fa-solid fa-sign-in-alt"></i> Sign In';
    dom.sidebarActionBtn.className = 'btn btn-primary btn-sm w-full';

    dom.composeContainer.style.display = 'none';
    dom.profileNavBtn.style.display = 'none';
  }

  // Hook sidebar main action
  dom.sidebarActionBtn.onclick = () => {
    if (state.currentUser) {
      navigateTo('profile', state.currentUser.username);
      // Wait for navigation animation, then scroll and trigger edit bio
      setTimeout(() => {
        const editTrigger = document.getElementById('edit-bio-btn');
        if (editTrigger) editTrigger.click();
      }, 300);
    } else {
      showAuthModal('login');
    }
  };

  // Re-hook sidebar profile links
  const sidebarProfileLink = dom.sidebarUserCard.querySelector('.user-profile-link');
  if (sidebarProfileLink && isLoggedIn) {
    sidebarProfileLink.onclick = () => navigateTo('profile', state.currentUser.username);
  }
  dom.sidebarUsername.onclick = () => {
    if (state.currentUser) navigateTo('profile', state.currentUser.username);
  };
}

// Client Side Router & Page Loader
export function navigateTo(page, extra = null) {
  state.currentPage = page;
  
  // Remove active from all nav links
  dom.feedNavBtn.classList.remove('active');
  dom.exploreNavBtn.classList.remove('active');
  dom.profileNavBtn.classList.remove('active');
  
  // Set active nav button
  if (page === 'feed') dom.feedNavBtn.classList.add('active');
  if (page === 'explore') dom.exploreNavBtn.classList.add('active');
  if (page === 'profile' && extra === state.currentUser?.username) dom.profileNavBtn.classList.add('active');

  // Deactivate all page view DOM containers
  dom.pageFeed.classList.remove('active');
  dom.pageExplore.classList.remove('active');
  dom.pageProfile.classList.remove('active');

  // Activate & load page
  if (page === 'feed') {
    dom.pageFeed.classList.add('active');
    loadFeed();
  } else if (page === 'explore') {
    dom.pageExplore.classList.add('active');
    loadExplore();
  } else if (page === 'profile') {
    dom.pageProfile.classList.add('active');
    state.viewingProfileUsername = extra || state.currentUser?.username;
    loadProfile(state.viewingProfileUsername);
  }
  
  // Smooth scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load Global Feed Posts
async function loadFeed() {
  dom.postsContainer.innerHTML = '<div class="loader-container"><div class="spinner"></div><p>Loading vibes...</p></div>';
  try {
    const data = await Posts.getAll();
    if (data.success) {
      renderPosts({
        posts: data.posts,
        container: dom.postsContainer,
        currentUser: state.currentUser,
        onLike: handleLikePost,
        onCommentSubmit: handleCommentPost,
        onDeletePost: handleDeletePost,
        navigateToProfile: (username) => navigateTo('profile', username)
      });
    } else {
      dom.postsContainer.innerHTML = `<div class="empty-text" style="color:var(--accent-pink)">Error loading feed: ${data.message}</div>`;
    }
  } catch (err) {
    dom.postsContainer.innerHTML = `<div class="empty-text" style="color:var(--accent-pink)">Could not connect to server.</div>`;
  }
}

// Load Users Directory List (Explore)
async function loadExplore() {
  dom.usersDirectoryContainer.innerHTML = '<div class="loader-container"><div class="spinner"></div><p>Discovering people...</p></div>';
  try {
    const data = await Users.getAll();
    if (data.success) {
      state.allUsers = data.users;
      renderUsers({
        users: data.users,
        container: dom.usersDirectoryContainer,
        currentUser: state.currentUser,
        onFollow: handleFollowUser,
        navigateToProfile: (username) => navigateTo('profile', username)
      });
    } else {
      dom.usersDirectoryContainer.innerHTML = `<div class="empty-text" style="color:var(--accent-pink)">Error loading explore directory.</div>`;
    }
  } catch (err) {
    dom.usersDirectoryContainer.innerHTML = `<div class="empty-text" style="color:var(--accent-pink)">Could not fetch users directory.</div>`;
  }
}

// Load Profile Info & User Posts Timeline
async function loadProfile(username) {
  // Clear profile container content temporarily
  dom.userPostsContainer.innerHTML = '<div class="loader-container"><div class="spinner"></div><p>Loading timeline...</p></div>';
  
  try {
    // 1. Fetch Profile Data
    const profileData = await Users.getProfile(username);
    if (!profileData.success) {
      showToast('User profile not found', 'error');
      navigateTo('feed');
      return;
    }

    const user = profileData.user;
    const isSelf = state.currentUser && state.currentUser._id === user._id;

    // Fill profile fields
    dom.profileAvatar.textContent = getInitials(user.username);
    dom.profileName.textContent = user.username;
    dom.profileHandle.textContent = `@${user.username.toLowerCase()}`;
    dom.profileBioText.textContent = user.bio || 'This user is mysterious and hasn\'t written a bio yet.';
    
    dom.profileFollowersNum.textContent = user.followers ? user.followers.length : 0;
    dom.profileFollowingNum.textContent = user.following ? user.following.length : 0;
    
    dom.profileFeedTitle.textContent = isSelf ? 'My Timeline' : `${user.username}'s Timeline`;

    // Render action buttons (Edit bio vs Follow/Unfollow)
    dom.profileActionsContainer.innerHTML = '';
    if (isSelf) {
      dom.profileActionsContainer.innerHTML = `
        <button class="btn btn-outline btn-sm" id="edit-bio-btn"><i class="fa-solid fa-pen-to-square"></i> Edit Bio</button>
      `;
      document.getElementById('edit-bio-btn').addEventListener('click', toggleEditBio);
    } else if (state.currentUser) {
      const isFollowing = state.currentUser.following.includes(user._id);
      dom.profileActionsContainer.innerHTML = `
        <button class="btn btn-sm follow-profile-btn ${isFollowing ? 'btn-outline' : 'btn-primary'}" data-id="${user._id}">
          ${isFollowing ? '<i class="fa-solid fa-user-minus"></i> Unfollow' : '<i class="fa-solid fa-user-plus"></i> Follow'}
        </button>
      `;
      dom.profileActionsContainer.querySelector('.follow-profile-btn').addEventListener('click', (e) => {
        handleFollowUser(user._id, e.currentTarget, true);
      });
    } else {
      dom.profileActionsContainer.innerHTML = `
        <button class="btn btn-outline btn-sm disabled-follow-profile-btn"><i class="fa-solid fa-user-plus"></i> Follow</button>
      `;
      dom.profileActionsContainer.querySelector('.disabled-follow-profile-btn').addEventListener('click', () => {
        showToast('Please log in to follow users', 'error');
      });
    }

    // 2. Fetch User Timeline Posts
    const postsData = await Posts.getUserPosts(username);
    if (postsData.success) {
      dom.profilePostsNum.textContent = postsData.posts.length;
      renderPosts({
        posts: postsData.posts,
        container: dom.userPostsContainer,
        currentUser: state.currentUser,
        onLike: handleLikePost,
        onCommentSubmit: handleCommentPost,
        onDeletePost: handleDeletePost,
        navigateToProfile: (username) => navigateTo('profile', username)
      });
    } else {
      dom.userPostsContainer.innerHTML = `<p class="empty-text">Error loading timeline posts.</p>`;
    }
  } catch (err) {
    console.error('Error loading profile page:', err);
    dom.userPostsContainer.innerHTML = `<p class="empty-text" style="color:var(--accent-pink)">Could not fetch profile details.</p>`;
  }
}

// Load side suggestions panel
async function loadSidebarSuggestions() {
  try {
    const data = await Users.getAll();
    if (data.success) {
      renderSuggestions({
        users: data.users,
        container: dom.suggestionsContainer,
        currentUser: state.currentUser,
        onFollow: handleFollowUser,
        navigateToProfile: (username) => navigateTo('profile', username)
      });
    }
  } catch (err) {
    dom.suggestionsContainer.innerHTML = '<p class="empty-text">Could not load suggestions.</p>';
  }
}

// Setup Header Navigation Links
function setupNavigation() {
  dom.logoBtn.addEventListener('click', () => navigateTo('feed'));
  dom.feedNavBtn.addEventListener('click', () => navigateTo('feed'));
  dom.exploreNavBtn.addEventListener('click', () => navigateTo('explore'));
  dom.profileNavBtn.addEventListener('click', () => {
    if (state.currentUser) {
      navigateTo('profile', state.currentUser.username);
    }
  });
  dom.refreshFeedBtn.addEventListener('click', () => {
    loadFeed();
    showToast('Feed refreshed', 'success');
  });
}

// Setup Compose Post Widget
function setupPostComposer() {
  // Update character count on typing
  dom.postContent.addEventListener('input', () => {
    dom.charCount.textContent = dom.postContent.value.length;
  });

  dom.createPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = dom.postContent.value.trim();
    if (!content) return;

    try {
      const data = await Posts.create(content);
      if (data.success) {
        dom.postContent.value = '';
        dom.charCount.textContent = '0';
        showToast('Vibe shared successfully!', 'success');
        
        // Refresh feed or insert dynamically
        if (state.currentPage === 'feed') {
          loadFeed();
        } else if (state.currentPage === 'profile' && state.viewingProfileUsername === state.currentUser.username) {
          loadProfile(state.currentUser.username);
        }
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Failed to post. Check connection.', 'error');
    }
  });
}

// Setup Profile Bio Editor Actions
function setupProfileBioEditor() {
  dom.bioCancelBtn.addEventListener('click', () => {
    dom.bioEditFormContainer.style.display = 'none';
    dom.profileBioText.style.display = 'block';
  });

  dom.bioSaveBtn.addEventListener('click', async () => {
    const newBio = dom.bioEditInput.value.trim();
    try {
      const data = await Users.updateBio(newBio);
      if (data.success) {
        state.currentUser.bio = newBio;
        dom.profileBioText.textContent = newBio || 'This user hasn\'t written a bio yet.';
        dom.sidebarBio.textContent = newBio || 'Sharing positive vibes only.';
        
        // Toggle view
        dom.bioEditFormContainer.style.display = 'none';
        dom.profileBioText.style.display = 'block';
        
        showToast('Bio updated!', 'success');
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Failed to save bio.', 'error');
    }
  });
}

function toggleEditBio() {
  const currentBio = dom.profileBioText.textContent === 'This user hasn\'t written a bio yet.' 
    ? '' 
    : dom.profileBioText.textContent;
  
  dom.bioEditInput.value = currentBio;
  dom.profileBioText.style.display = 'none';
  dom.bioEditFormContainer.style.display = 'block';
  dom.bioEditInput.focus();
}

// Actions handlers
async function handleLikePost(postId, btnEl) {
  try {
    const data = await Posts.likePost(postId);
    if (data.success) {
      const countEl = btnEl.querySelector('.likes-count');
      const iconEl = btnEl.querySelector('i');
      
      countEl.textContent = data.likes.length;
      
      if (data.liked) {
        btnEl.classList.add('liked');
        iconEl.className = 'fa-solid fa-heart';
        showToast('Post liked!', 'success');
      } else {
        btnEl.classList.remove('liked');
        iconEl.className = 'fa-regular fa-heart';
      }
    }
  } catch (err) {
    showToast('Failed to update like.', 'error');
  }
}

async function handleCommentPost(postId, content, clearFormCallback) {
  try {
    const data = await Comments.createComment(postId, content);
    if (data.success) {
      showToast('Comment added!', 'success');
      clearFormCallback();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to post comment.', 'error');
  }
}

async function handleDeletePost(postId) {
  try {
    const data = await Posts.deletePost(postId);
    if (data.success) {
      showToast('Post deleted successfully', 'success');
      // Refresh views
      if (state.currentPage === 'feed') {
        loadFeed();
      } else if (state.currentPage === 'profile') {
        loadProfile(state.viewingProfileUsername);
      }
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to delete post.', 'error');
  }
}

async function handleFollowUser(userId, btnEl, isProfilePage = false) {
  if (!state.currentUser) {
    showToast('Please log in to follow users', 'error');
    return;
  }
  
  try {
    const data = await Users.followUser(userId);
    if (data.success) {
      // Update local state follows
      state.currentUser.following = data.following;
      
      // Update sidebar following count
      dom.sidebarFollowingCount.textContent = data.following.length;

      // Update follow button element class and text
      if (data.isFollowing) {
        btnEl.className = 'btn btn-sm btn-outline follow-btn';
        btnEl.innerHTML = '<i class="fa-solid fa-user-minus"></i> Unfollow';
        showToast('User followed!', 'success');
      } else {
        btnEl.className = 'btn btn-sm btn-primary follow-btn';
        btnEl.innerHTML = '<i class="fa-solid fa-user-plus"></i> Follow';
        showToast('User unfollowed.', 'success');
      }

      // If we are currently viewing the profile of the user followed, reload the stats & buttons
      if (state.currentPage === 'profile') {
        loadProfile(state.viewingProfileUsername);
      }

      // Reload sidebar suggestions and search list so lists stay updated
      loadSidebarSuggestions();
      if (state.currentPage === 'explore') {
        // Just refresh the directory render inline without visual flicker
        const exploreData = await Users.getAll();
        if (exploreData.success) {
          state.allUsers = exploreData.users;
          renderUsers({
            users: exploreData.users,
            container: dom.usersDirectoryContainer,
            currentUser: state.currentUser,
            onFollow: handleFollowUser,
            navigateToProfile: (username) => navigateTo('profile', username)
          });
        }
      }
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to complete follow action.', 'error');
  }
}

// Authentication Forms & Modals Setup
function setupAuthModal() {
  dom.authModalCloseBtn.addEventListener('click', hideAuthModal);
  
  // Tab buttons toggling login/signup forms
  dom.tabLoginBtn.addEventListener('click', () => showAuthModal('login'));
  dom.tabSignupBtn.addEventListener('click', () => showAuthModal('signup'));
  
  // Background overlay click closes modal
  dom.authModal.addEventListener('click', (e) => {
    if (e.target === dom.authModal) hideAuthModal();
  });

  // Login form submission
  dom.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = dom.loginEmail.value.trim();
    const password = dom.loginPassword.value;

    try {
      const data = await Auth.login(email, password);
      if (data.success) {
        state.currentUser = data.user;
        updateAuthUI(true);
        hideAuthModal();
        showToast(`Welcome back, ${data.user.username}!`, 'success');
        
        // Refresh feed & explore list so they display interactive actions
        if (state.currentPage === 'feed') loadFeed();
        if (state.currentPage === 'explore') loadExplore();
        if (state.currentPage === 'profile') loadProfile(state.viewingProfileUsername);
        
        loadSidebarSuggestions();
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Invalid credentials or connection error.', 'error');
    }
  });

  // Sign up form submission
  dom.signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = dom.signupUsername.value.trim();
    const email = dom.signupEmail.value.trim();
    const password = dom.signupPassword.value;
    const bio = dom.signupBio.value.trim();

    try {
      const data = await Auth.register(username, email, password, bio);
      if (data.success) {
        state.currentUser = data.user;
        updateAuthUI(true);
        hideAuthModal();
        showToast(`Account created! Welcome, ${data.user.username}!`, 'success');
        
        // Refresh feeds
        if (state.currentPage === 'feed') loadFeed();
        if (state.currentPage === 'explore') loadExplore();
        
        loadSidebarSuggestions();
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Registration failed. Username or email may exist.', 'error');
    }
  });
}

function showAuthModal(tab = 'login') {
  dom.authModal.classList.add('active');
  
  if (tab === 'login') {
    dom.tabLoginBtn.classList.add('active');
    dom.tabSignupBtn.classList.remove('active');
    dom.formLoginContainer.classList.add('active');
    dom.formSignupContainer.classList.remove('active');
    dom.loginEmail.focus();
  } else {
    dom.tabLoginBtn.classList.remove('active');
    dom.tabSignupBtn.classList.add('active');
    dom.formLoginContainer.classList.remove('active');
    dom.formSignupContainer.classList.add('active');
    dom.signupUsername.focus();
  }
}

function hideAuthModal() {
  dom.authModal.classList.remove('active');
  dom.loginForm.reset();
  dom.signupForm.reset();
}

async function handleLogout() {
  try {
    const data = await Auth.logout();
    if (data.success) {
      state.currentUser = null;
      updateAuthUI(false);
      showToast('Logged out successfully', 'success');
      
      // Route back to feed
      navigateTo('feed');
      loadSidebarSuggestions();
    }
  } catch (err) {
    showToast('Failed to log out.', 'error');
  }
}

// Setup Theme Toggle Event Listener & Icon Animations
function setupTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (!themeToggleBtn) return;
  
  // Set icon according to initial theme applied in index.html script
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateThemeIcon(currentTheme);
  
  themeToggleBtn.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    const targetTheme = activeTheme === 'dark' ? 'light' : 'dark';
    
    // Scale & rotate micro-animation for theme switch icon
    const icon = themeToggleBtn.querySelector('i');
    if (icon) {
      icon.style.transform = 'scale(0) rotate(180deg)';
      setTimeout(() => {
        document.documentElement.setAttribute('data-theme', targetTheme);
        localStorage.setItem('theme', targetTheme);
        updateThemeIcon(targetTheme);
        icon.style.transform = 'scale(1) rotate(0deg)';
      }, 150);
    } else {
      document.documentElement.setAttribute('data-theme', targetTheme);
      localStorage.setItem('theme', targetTheme);
      updateThemeIcon(targetTheme);
    }
    
    showToast(`Switched to ${targetTheme} mode!`, 'success');
  });
}

function updateThemeIcon(theme) {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (!themeToggleBtn) return;
  const icon = themeToggleBtn.querySelector('i');
  if (!icon) return;
  
  if (theme === 'dark') {
    icon.className = 'fa-solid fa-sun';
    themeToggleBtn.title = 'Switch to Light Mode';
  } else {
    icon.className = 'fa-solid fa-moon';
    themeToggleBtn.title = 'Switch to Dark Mode';
  }
}
