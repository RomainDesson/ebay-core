require('dotenv').config();

const ebayConfig = {
  accounts: {
    account1: {
      appId: process.env.EBAY_APP_ID_1,
      certId: process.env.EBAY_CERT_ID_1,
      devId: process.env.EBAY_DEV_ID_1,
      sandbox: process.env.EBAY_SANDBOX === 'true',
      marketplaceId: 'EBAY_FR',
      ruName: process.env.EBAY_RUNAME_1
    }
  }
};

module.exports = ebayConfig; 