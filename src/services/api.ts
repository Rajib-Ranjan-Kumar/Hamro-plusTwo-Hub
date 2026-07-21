import { auth } from '../firebase';

// Placeholder for secure API calls to a backend (if implemented later)
// This demonstrates adding the Firebase ID token to the Authorization header
// to protect against CSRF and ensure the user is authenticated.

export const secureFetch = async (url: string, options: RequestInit = {}) => {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const token = await user.getIdToken();
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      // CSRF protection header (if using a backend that requires it)
      // 'X-CSRF-Token': getCsrfToken(), 
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle HTTP errors
      throw new Error(`API error: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('Secure fetch error:', error);
    throw error;
  }
};
