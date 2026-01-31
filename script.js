// Homepage script - displays trending posts
// Load this script with defer attribute in index.html

document.addEventListener('DOMContentLoaded', async () => {
  updateAuthButtons();
  await loadTrendingPosts();
});

// Update header buttons based on auth status
function updateAuthButtons() {
  const isLoggedIn = BridgeAPI.auth.isLoggedIn();
  const passBtns = document.querySelector('.pass-btns');

  if (isLoggedIn) {
    const user = BridgeAPI.auth.getCurrentUser();
    passBtns.innerHTML = `
      <span style="margin-right: 1rem;">Hello, ${user.username}!</span>
      <button onclick="handleCreatePost()">
        <a href="#" onclick="event.preventDefault();">Create Post</a>
      </button>
      <button onclick="handleLogout()">
        <a href="#" onclick="event.preventDefault();">Logout</a>
      </button>
    `;
  }
}

// Load and display trending posts
async function loadTrendingPosts() {
  const contentDiv = document.querySelector('.content');
  contentDiv.innerHTML = '<div class="loading">Loading trending posts...</div>';

  try {
    const response = await BridgeAPI.posts.getTrending(20, 0);
    
    if (response.posts && response.posts.length > 0) {
      contentDiv.innerHTML = '';
      response.posts.forEach(post => {
        contentDiv.appendChild(createPostElement(post));
      });
    } else {
      contentDiv.innerHTML = `
        <div class="no-posts">
          <h2>No posts yet!</h2>
          <p>Be the first to share your goals with the Bridge community.</p>
          ${BridgeAPI.auth.isLoggedIn() ? '<button onclick="handleCreatePost()">Create a Post</button>' : ''}
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading posts:', error);
    contentDiv.innerHTML = `
      <div class="error">
        <h2>Unable to load posts</h2>
        <p>Please make sure the backend server is running.</p>
        <button onclick="loadTrendingPosts()">Retry</button>
      </div>
    `;
  }
}

// Create post element HTML
function createPostElement(post) {
  const article = document.createElement('article');
  article.className = 'post';
  article.dataset.postId = post.id;

  const deadlineText = post.deadline 
    ? `<p class="deadline"><strong>Deadline:</strong> ${new Date(post.deadline).toLocaleDateString()}</p>`
    : '';

  const categoryText = post.category 
    ? `<span class="category">${post.category}</span>`
    : '';

  article.innerHTML = `
    <div class="post-header">
      <div class="post-author">
        <img src="${post.profile_image_url || '/images/default-avatar.png'}" alt="${post.username}" class="avatar">
        <div>
          <strong>${post.username}</strong>
          <span class="post-time">${formatTimeAgo(post.created_at)}</span>
        </div>
      </div>
      ${categoryText}
    </div>
    
    <h3 class="post-title">${escapeHtml(post.title)}</h3>
    <p class="post-description">${escapeHtml(post.description)}</p>
    
    <details class="post-plan">
      <summary>View Action Plan</summary>
      <div class="plan-content">${escapeHtml(post.plan)}</div>
    </details>
    
    ${deadlineText}
    
    <div class="post-footer">
      <button class="like-btn" onclick="handleLike(${post.id})">
        ❤️ ${post.likes_count || 0}
      </button>
      <button class="comment-btn" onclick="viewPost(${post.id})">
        💬 ${post.comments_count || 0}
      </button>
      <button class="view-btn" onclick="viewPost(${post.id})">
        View Full Post
      </button>
    </div>
  `;

  return article;
}

// Format time ago
function formatTimeAgo(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle like button
async function handleLike(postId) {
  if (!BridgeAPI.auth.isLoggedIn()) {
    alert('Please log in to like posts');
    window.location.href = '/pages/login.html';
    return;
  }

  try {
    const response = await BridgeAPI.posts.likePost(postId);
    // Reload posts to update like count
    await loadTrendingPosts();
  } catch (error) {
    console.error('Error liking post:', error);
    alert('Failed to like post');
  }
}

// View full post (will create this page later)
function viewPost(postId) {
  window.location.href = `/pages/post.html?id=${postId}`;
}

// Handle create post
function handleCreatePost() {
  window.location.href = '/pages/create-post.html';
}

// Handle logout
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    BridgeAPI.auth.logout();
  }
}

// Search functionality
const searchForm = document.querySelector('.search-container form');
if (searchForm) {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchInput = document.querySelector('#search');
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `/pages/explore.html?search=${encodeURIComponent(query)}`;
    }
  });
}