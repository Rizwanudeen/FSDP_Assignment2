import { supabase } from '../lib/supabase';

/**
 * Check if token is expired or expiring soon
 * Returns true if token needs refresh (less than 5 minutes remaining)
 */
export function isTokenExpiringSoon(): boolean {
  const expiresAt = localStorage.getItem('tokenExpiresAt');
  if (!expiresAt) return true;
  
  const expiryTime = parseInt(expiresAt, 10);
  const now = Date.now();
  const timeRemaining = expiryTime - now;
  
  // Consider expired if less than 5 minutes remaining
  return timeRemaining < 5 * 60 * 1000;
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.warn('⚠️ No refresh token available');
      return null;
    }

    console.log('🔄 Refreshing access token...');
    
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      console.error('❌ Token refresh failed:', error?.message);
      // Clear invalid tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiresAt');
      return null;
    }

    // Update stored tokens
    const newAccessToken = data.session.access_token;
    const newRefreshToken = data.session.refresh_token;
    
    localStorage.setItem('token', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken || '');
    localStorage.setItem('tokenExpiresAt', (Date.now() + (data.session.expires_in || 3600) * 1000).toString());
    
    console.log('✅ Token refreshed successfully');
    return newAccessToken;
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    return null;
  }
}

/**
 * Ensure valid token - refresh if needed
 */
export async function ensureValidToken(): Promise<string | null> {
  const currentToken = localStorage.getItem('token');
  
  if (!currentToken) {
    console.warn('⚠️ No token available');
    return null;
  }

  if (isTokenExpiringSoon()) {
    const newToken = await refreshAccessToken();
    return newToken || null;
  }

  return currentToken;
}
