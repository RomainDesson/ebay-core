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

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
  console.log(`Endpoint disponible: GET http://localhost:${port}/api/listings`);
}); 