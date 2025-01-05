const fs = require('fs').promises;
const path = require('path');

class TokenStorage {
  constructor() {
    this.filePath = process.env.STORAGE_PATH 
      ? path.join(process.env.STORAGE_PATH, 'tokens.json')
      : path.join(__dirname, '../../tokens.json');
  }

  async saveTokens(accountId, tokens) {
    try {
      let allTokens = {};
      try {
        const data = await fs.readFile(this.filePath, 'utf8');
        allTokens = JSON.parse(data);
      } catch (err) {
        // Le fichier n'existe pas encore
      }

      allTokens[accountId] = {
        ...tokens,
        savedAt: Date.now()
      };

      await fs.writeFile(this.filePath, JSON.stringify(allTokens, null, 2));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des tokens:', error);
    }
  }

  async getTokens(accountId) {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      const allTokens = JSON.parse(data);
      return allTokens[accountId];
    } catch (error) {
      return null;
    }
  }
}

module.exports = new TokenStorage(); 