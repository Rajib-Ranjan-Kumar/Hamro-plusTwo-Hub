export const getFirebaseErrorMessage = (error: any): string => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  if (errorCode === 'auth/invalid-credential' || errorMessage.includes('auth/invalid-credential') || errorCode === 'auth/wrong-password' || errorMessage.includes('auth/wrong-password') || errorCode === 'auth/user-not-found' || errorMessage.includes('auth/user-not-found')) {
    return 'Invalid email or password. Please try again.';
  }
  if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists.';
  }
  if (errorCode === 'auth/weak-password' || errorMessage.includes('auth/weak-password')) {
    return 'Password should be at least 6 characters long.';
  }
  if (errorCode === 'auth/invalid-email' || errorMessage.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (errorCode === 'auth/network-request-failed' || errorMessage.includes('auth/network-request-failed')) {
    return 'Network error. Please check your internet connection.';
  }
  if (errorCode === 'auth/too-many-requests' || errorMessage.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please try again later or reset your password.';
  }
  if (errorCode === 'auth/popup-closed-by-user' || errorMessage.includes('auth/popup-closed-by-user')) {
    return 'Sign-in popup was closed before completing.';
  }
  if (errorCode === 'auth/unauthorized-domain' || errorMessage.includes('auth/unauthorized-domain')) {
    return 'Domain unauthorized: Please add this Vercel domain to Authorized Domains in Firebase Console (Authentication > Settings > Authorized Domains).';
  }
  if (errorCode === 'auth/operation-not-allowed' || errorMessage.includes('auth/operation-not-allowed')) {
    return 'Sign-in method disabled: Please enable Google Sign-in in Firebase Console (Authentication > Sign-in method).';
  }
  
  return error?.code ? `An error occurred (${error.code}). Please try again.` : 'An unexpected error occurred. Please try again.';
};
