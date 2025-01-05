const router = express.Router();

// Middleware pour vérifier le token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  req.ebayService = new EbayService(token);
  next();
};

router.use(authMiddleware);

router.get('/inventory', async (req, res) => {
  try {
    const inventory = await req.ebayService.getInventory();
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Autres routes... 