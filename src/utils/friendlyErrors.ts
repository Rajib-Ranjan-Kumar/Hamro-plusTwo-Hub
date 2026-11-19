/**
 * Translates any raw error, Firebase error, network error, or exception
 * into a calm, simple, and user-friendly explanation without raw error codes or stack traces.
 */
export const getFriendlyErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again or refresh.'): string => {
  if (!error) return fallback;

  let msg = '';
  let code = '';

  if (typeof error === 'string') {
    msg = error;
  } else if (typeof error === 'object' && error !== null) {
    const errObj = error as any;
    code = errObj.code || '';
    msg = errObj.message || errObj.error || '';

    // Check if message is a JSON string from handleFirestoreError
    if (typeof msg === 'string' && msg.trim().startsWith('{') && msg.includes('operationType')) {
      try {
        const parsed = JSON.parse(msg);
        msg = parsed.error || '';
      } catch {
        // keep as is
      }
    }
  }

  const combined = `${code} ${msg}`.toLowerCase();

  // Authentication & Passwords
  if (combined.includes('invalid-credential') || combined.includes('wrong-password') || combined.includes('user-not-found')) {
    return 'Invalid email or password. Please double-check and try again.';
  }
  if (combined.includes('email-already-in-use')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (combined.includes('weak-password')) {
    return 'Password is too short. Please use at least 6 characters.';
  }
  if (combined.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (combined.includes('popup-closed-by-user')) {
    return 'Sign-in window was closed before completion. Please try again.';
  }
  if (combined.includes('too-many-requests')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }

  // Network & Connectivity
  if (combined.includes('network') || combined.includes('offline') || combined.includes('failed to fetch') || combined.includes('internet') || combined.includes('the client is offline')) {
    return 'Connection issue. Please check your internet connection and try again.';
  }

  // Permissions & Access
  if (combined.includes('permission-denied') || combined.includes('insufficient permissions') || combined.includes('unauthorized')) {
    return 'You do not have permission for this action or your session expired. Please sign in again.';
  }

  // File Uploads & Storage
  if (combined.includes('storage') || combined.includes('upload') || combined.includes('file too large')) {
    return 'Could not process the file. Please ensure it is a valid PDF or image file under the allowed size limit.';
  }

  // Not Found
  if (combined.includes('not-found') || combined.includes('404')) {
    return 'The requested resource or document was not found.';
  }

  return fallback;
};
