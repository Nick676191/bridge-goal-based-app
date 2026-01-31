// Sign-up page script
document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.querySelector('#sign-up');
  
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const username = document.querySelector('#user').value.trim();
    const email = document.querySelector('#email').value.trim();
    const phone = document.querySelector('#tele').value.trim();
    const password = document.querySelector('#first-pass').value;
    const confirmPassword = document.querySelector('#second-pass').value;
    
    // Client-side validation
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    
    if (password.length < 5 || password.length > 30) {
      showError('Password must be between 5 and 30 characters');
      return;
    }
    
    // Validate phone format
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      showError('Phone number must be in format: xxx-xxx-xxxx');
      return;
    }
    
    // Show loading state
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;
    
    try {
      const response = await BridgeAPI.auth.register({
        username,
        email,
        phone,
        password,
        confirmPassword,
      });
      
      if (response.error) {
        showError(response.message || response.error);
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
        return;
      }
      
      // Success!
      showSuccess(response.message || 'Account created successfully! Please check your email to verify your account.');
      
      // Clear form
      signupForm.reset();
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = './login.html';
      }, 3000);
      
    } catch (error) {
      console.error('Registration error:', error);
      showError('Registration failed. Please try again.');
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    }
  });
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
  formContainer.insertBefore(errorDiv, formContainer.firstChild);
  
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
  formContainer.insertBefore(successDiv, formContainer.firstChild);
}

// Remove existing messages
function removeMessages() {
  const existingMessages = document.querySelectorAll('.error-message, .success-message');
  existingMessages.forEach(msg => msg.remove());
}

// Format phone number as user types
const phoneInput = document.querySelector('#tele');
if (phoneInput) {
  phoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length > 3 && value.length <= 6) {
      value = value.slice(0, 3) + '-' + value.slice(3);
    } else if (value.length > 6) {
      value = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6, 10);
    }
    
    e.target.value = value;
  });
}