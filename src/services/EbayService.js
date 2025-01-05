const axios = require('axios');
const tokenStorage = require('./TokenStorage');

class EbayService {
  constructor(accountConfig) {
    this.config = accountConfig;
    this.baseUrl = this.config.sandbox 
      ? 'https://api.sandbox.ebay.com'
      : 'https://api.ebay.com';

    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiration = null;

    this.loadTokens();
  }

  // Gestion des tokens
  async loadTokens() {
    const savedTokens = await tokenStorage.getTokens(this.config.appId);
    if (savedTokens) {
      this.accessToken = savedTokens.accessToken;
      this.refreshToken = savedTokens.refreshToken;
      this.tokenExpiration = savedTokens.tokenExpiration;
    }
  }

  async refreshAccessToken() {
    try {
      const credentials = Buffer.from(`${this.config.appId}:${this.config.certId}`).toString('base64');
      
      const response = await axios.post(
        `${this.baseUrl}/identity/v1/oauth2/token`,
        `grant_type=refresh_token&refresh_token=${this.refreshToken}&scope=${this.getRequiredScopes()}`,
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiration = Date.now() + (response.data.expires_in * 1000) - 300000;

      await tokenStorage.saveTokens(this.config.appId, {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        tokenExpiration: this.tokenExpiration
      });
    } catch (error) {
      console.error('Erreur refresh token:', error.response?.data);
      throw new Error('Impossible de rafraîchir le token');
    }
  }

  getRequiredScopes() {
    return [
      'https://api.ebay.com/oauth/api_scope',
      'https://api.ebay.com/oauth/api_scope/sell.inventory',
      'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly'
    ].join(' ');
  }

  async ensureValidToken() {
    if (!this.accessToken || !this.refreshToken) {
      throw new Error('Tokens non initialisés. Authentification requise.');
    }

    if (this.tokenExpiration && Date.now() >= this.tokenExpiration) {
      await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  // Récupération des annonces
  async getActiveListings() {
    try {
      const token = await this.ensureValidToken();
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': this.config.marketplaceId
      };

      const response = await axios.get(`${this.baseUrl}/sell/inventory/v1/inventory_item`, {
        headers,
        params: {
          offset: 0
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur Listings:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      throw new Error(`Erreur lors de la récupération des annonces: ${error.message}`);
    }
  }

  async getInitialTokens(authorizationCode) {
    try {
      const credentials = Buffer.from(`${this.config.appId}:${this.config.certId}`).toString('base64');
      
      const response = await axios.post(
        `${this.baseUrl}/identity/v1/oauth2/token`,
        `grant_type=authorization_code&code=${authorizationCode}&redirect_uri=${this.config.ruName}`,
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiration = Date.now() + (response.data.expires_in * 1000) - 300000;

      await tokenStorage.saveTokens(this.config.appId, {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        tokenExpiration: this.tokenExpiration
      });

      return {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error('Erreur obtention tokens:', error.response?.data);
      throw new Error('Impossible d\'obtenir les tokens initiaux');
    }
  }
}

module.exports = EbayService; 