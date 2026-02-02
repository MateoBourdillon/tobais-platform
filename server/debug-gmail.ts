import express from 'express';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Function to test Gmail API credentials via their API directly
export async function testGmailCredentials() {
  try {
    // Check if all required environment variables are present
    const envInfo = {
      GMAIL_CLIENT_ID_present: !!process.env.GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET_present: !!process.env.GMAIL_CLIENT_SECRET,
      GMAIL_REFRESH_TOKEN_present: !!process.env.GMAIL_REFRESH_TOKEN,
      GMAIL_EMAIL_present: !!process.env.GMAIL_EMAIL,
      GMAIL_CLIENT_ID_length: process.env.GMAIL_CLIENT_ID ? process.env.GMAIL_CLIENT_ID.length : 0,
      GMAIL_CLIENT_SECRET_length: process.env.GMAIL_CLIENT_SECRET ? process.env.GMAIL_CLIENT_SECRET.length : 0,
      GMAIL_REFRESH_TOKEN_length: process.env.GMAIL_REFRESH_TOKEN ? process.env.GMAIL_REFRESH_TOKEN.length : 0,
      GMAIL_EMAIL: process.env.GMAIL_EMAIL || 'not_set'
    };
    
    console.log('Gmail API Debug - Environment variables:', envInfo);
    
    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
      return {
        success: false,
        message: 'Missing required Gmail API credentials',
        envInfo
      };
    }
    
    // Create a new OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET
    );
    
    // Set the refresh token
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });
    
    try {
      console.log('Attempting to refresh the token for debugging...');
      
      // Try to refresh the token to get an access token
      const tokenResponse = await oauth2Client.refreshAccessToken();
      console.log('Access token refreshed successfully');
      
      // Now use the access token to get token info
      if (tokenResponse.credentials.access_token) {
        console.log('Getting token info with the new access token');
        const tokenInfo = await oauth2Client.getTokenInfo(tokenResponse.credentials.access_token);
        
        console.log('Token info retrieved successfully:', {
          aud: tokenInfo.aud,
          scope: tokenInfo.scopes,
          email: tokenInfo.email
        });
        
        return {
          success: true,
          message: 'Gmail API credentials validated successfully',
          envInfo,
          tokenInfo: {
            aud: tokenInfo.aud,
            scope: tokenInfo.scopes,
            email: tokenInfo.email
          },
          accessToken: {
            expiryDate: tokenResponse.credentials.expiry_date
              ? new Date(tokenResponse.credentials.expiry_date).toISOString()
              : 'Unknown',
            tokenType: tokenResponse.credentials.token_type || 'Unknown',
            idToken: !!tokenResponse.credentials.id_token,
            accessToken: !!tokenResponse.credentials.access_token,
          }
        };
      } else {
        throw new Error('Access token not returned from refresh operation');
      }
    } catch (tokenErr) {
      // Format the error for better debugging
      const tokenError = tokenErr as any;
      const errorDetails = {
        message: tokenError?.message || 'Unknown error',
        name: tokenError?.name || 'Error',
        stack: tokenError?.stack || '',
        response: tokenError?.response ? {
          status: tokenError.response.status,
          statusText: tokenError.response.statusText,
          data: tokenError.response.data
        } : null
      };
      
      console.error('Error validating Gmail API credentials:', errorDetails);
      
      return {
        success: false,
        message: `Failed to validate Gmail API credentials: ${tokenError.message}`,
        envInfo,
        error: errorDetails
      };
    }
  } catch (err) {
    const error = err as any;
    console.error('Unexpected error testing Gmail credentials:', error);
    
    return {
      success: false,
      message: `Unexpected error: ${error?.message || 'Unknown error'}`,
      error: {
        message: error?.message || 'Unknown error',
        name: error?.name || 'Error',
        stack: error?.stack || ''
      }
    };
  }
}

// Register the debug route
export function registerGmailDebugRoute(app: express.Express) {
  // Add a debug endpoint for Gmail API credentials
  app.get('/api/debug/gmail', async (req, res) => {
    // Only allow admin users in prod
    if (process.env.NODE_ENV === 'production') {
      if (!req.isAuthenticated() || !req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }
    
    try {
      const result = await testGmailCredentials();
      
      // Añadir información actualizada sobre los destinatarios de correo
      res.json({
        ...result,
        emailConfig: {
          fromAddress: process.env.GMAIL_EMAIL || 'unknown',
          recipients: ['sales@tobais.com'],
          note: 'Utilizando únicamente el correo sales@tobais.com para todas las comunicaciones'
        }
      });
    } catch (err) {
      const error = err as any;
      console.error('Error in Gmail debug endpoint:', error);
      res.status(500).json({
        error: 'Failed to test Gmail credentials',
        message: error?.message || 'Unknown error'
      });
    }
  });
  
  // Add a route to generate a new auth URL for getting a refresh token
  app.get('/api/debug/gmail/auth-url', async (req, res) => {
    // Only allow admin users in prod
    if (process.env.NODE_ENV === 'production') {
      if (!req.isAuthenticated() || !req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }
    
    try {
      if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
        return res.status(400).json({ 
          error: 'Missing required credentials',
          missingKeys: [
            !process.env.GMAIL_CLIENT_ID ? 'GMAIL_CLIENT_ID' : null,
            !process.env.GMAIL_CLIENT_SECRET ? 'GMAIL_CLIENT_SECRET' : null
          ].filter(Boolean)
        });
      }
      
      // Create a new OAuth client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        // Redirect to a URL your admin would have access to
        `${req.protocol}://${req.get('host')}/api/auth/google/callback`
      );
      
      // Generate the URL to get a new refresh token
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // Force to show the consent screen to get a refresh token
        scope: [
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.readonly'
        ]
      });
      
      res.json({ 
        message: 'Authorization URL generated successfully',
        authUrl,
        instructions: 'Open this URL in your browser, grant access, then use the generated code to get a refresh token'
      });
    } catch (err) {
      const error = err as any;
      console.error('Error generating auth URL:', error);
      res.status(500).json({
        error: 'Failed to generate authorization URL',
        message: error?.message || 'Unknown error'
      });
    }
  });
  
  // Add a route to exchange the authorization code for a refresh token
  app.get('/api/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send(
        '<html><body>' +
        '<h1>Error</h1>' +
        '<p>No authorization code was received.</p>' +
        '</body></html>'
      );
    }
    
    try {
      if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
        return res.status(400).send(
          '<html><body>' +
          '<h1>Error</h1>' +
          '<p>Missing required OAuth credentials.</p>' +
          '</body></html>'
        );
      }
      
      // Create a new OAuth client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        `${req.protocol}://${req.get('host')}/api/auth/google/callback`
      );
      
      // Exchange the authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code as string);
      
      const refreshToken = tokens.refresh_token;
      
      if (!refreshToken) {
        return res.status(400).send(
          '<html><body>' +
          '<h1>Warning</h1>' +
          '<p>No refresh token was received. This usually happens if you have previously authorized the application. ' +
          'Try revoking access first at <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Permissions</a>.</p>' +
          '</body></html>'
        );
      }
      
      // Return the result as an HTML page
      res.send(
        '<html><body>' +
        '<h1>Authorization Successful</h1>' +
        '<p>Your new refresh token is:</p>' +
        `<pre style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; word-break: break-all;">${refreshToken}</pre>` +
        '<p><strong>Important:</strong> Store this refresh token securely in your environment variables (GMAIL_REFRESH_TOKEN).</p>' +
        '<p>This token will not be shown again.</p>' +
        '</body></html>'
      );
    } catch (err) {
      const error = err as any;
      console.error('Error exchanging code for token:', error);
      
      res.status(500).send(
        '<html><body>' +
        '<h1>Error</h1>' +
        `<p>Failed to exchange authorization code for tokens: ${error?.message || 'Unknown error'}</p>` +
        '<p>Check the server logs for more details.</p>' +
        '</body></html>'
      );
    }
  });
}