const express = require('express');
const { helmet, limiter } = require('./middleware/security');
const ebayConfig = require('./config/ebayConfig');
const EbayService = require('./services/EbayService');

const app = express();
const port = process.env.PORT || 3000;

const ebayService = new EbayService(ebayConfig.accounts.account1);

app.use(helmet());
app.use(limiter);
app.use(express.json());

// Route pour obtenir les annonces actives
app.get('/api/listings', async (req, res) => {
  try {
    const listings = await ebayService.getActiveListings();
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route de callback pour l'authentification
app.get('/auth/ebay/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      throw new Error('Code d\'autorisation manquant');
    }

    const tokens = await ebayService.getInitialTokens(code);
    res.json({ message: 'Authentification réussie' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour générer l'URL d'authentification
app.get('/auth/ebay/url', (req, res) => {
  // L'URL de base doit être signin.ebay.com
  const baseSignInUrl = `https://${ebayService.config.sandbox ? 'signin.sandbox' : 'signin'}.ebay.com/SignIn`;
  
  // Construire l'URL OAuth qui sera encodée
  const oauthUrl = `https://${ebayService.config.sandbox ? 'auth.sandbox' : 'auth'}.ebay.com/oauth2/authorize`;
  const oauthParams = new URLSearchParams({
    client_id: ebayService.config.appId,
    response_type: 'code',
    redirect_uri: ebayService.config.ruName,
    scope: ebayService.getRequiredScopes(),
    prompt: 'login'
  });

  // Construire l'URL finale
  const params = new URLSearchParams({
    ana: 1,
    ru: `${oauthUrl}?${oauthParams.toString()}`
  });

  const finalUrl = `${baseSignInUrl}?${params.toString()}`;

  console.log('Generated Auth URL:', {
    baseSignInUrl,
    oauthUrl,
    redirectUri: ebayService.config.ruName,
    scopes: ebayService.getRequiredScopes(),
    finalUrl
  });

  res.json({ authUrl: finalUrl });
});

// Ajoutez cet endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.EBAY_SANDBOX === 'true' ? 'sandbox' : 'production',
    hasToken: !!ebayService.accessToken,
    tokenExpiration: ebayService.tokenExpiration
  });
});

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
  console.log(`Endpoint disponible: GET http://localhost:${port}/api/listings`);
}); 