// Login page script
document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  if (BridgeAPI.auth.isLoggedIn()) {
    window.location.href = '../index.html';
    return;
  }

  const loginForm = document.querySelector('#login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.querySelector('#email').value.trim();
      const password = document.querySelector('#password').value;
      
      // Show loading state
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.textContent = 'Logging in...';
      submitBtn.disabled = true;
      
      try {
        const response = await BridgeAPI.auth.login(email, password);
        
        if (response.error) {
          showError(response.message || response.error);
          submitBtn.textContent = originalBtnText;
          submitBtn.disabled = false;
          return;
        }
        
        // Success!
        showSuccess('Login successful! Redirecting...');
        
        // Redirect to homepage
        setTimeout(() => {
          window.location.href = '../index.html';
        }, 1000);
        
      } catch (error) {
        console.error('Login error:', error);
        showError('Login failed. Please check your credentials and try again.');
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
      }
    });
  }
});

// Show error message
function showError(message) {
  removeMessages();
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.cssText = `
    background-color: #ff4444;
    color: white;
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 5px;
    text-align: center;
  `;
  errorDiv.textContent = message;
  
  const formContainer = document.querySelector('.form-container');
  if (formContainer) {
    formContainer.insertBefore(errorDiv, formContainer.firstChild);
  }
  
  // Auto-remove after 5 seconds
  setTimeout(() => errorDiv.remove(), 5000);
}

// Show success message
function showSuccess(message) {
  removeMessages();
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.style.cssText = `
    background-color: #44ff44;
    color: black;
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 5px;
    text-align: center;
  `;
  successDiv.textContent = message;
  
  const formContainer = document.querySelector('.form-container');
  if (formContainer) {
    formContainer.insertBefore(successDiv, formContainer.firstChild);
  }
}

// Remove existing messages
function removeMessages() {
  const existingMessages = document.querySelectorAll('.error-message, .success-message');
  existingMessages.forEach(msg => msg.remove());
}