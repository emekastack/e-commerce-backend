import { Router } from 'express';
import { adsController } from './ads.module';
import { adminRoute } from '../../middlewares/adminRoute';

const adsRoutes = Router();

// Public: Get ads (optionally by type)
adsRoutes.get('/', adsController.getAds);
adsRoutes.get('/:id', adsController.getAdById);

// Admin: Create, update, delete
adsRoutes.post('/', adminRoute, adsController.createAd);
adsRoutes.put('/:id', adminRoute, adsController.updateAd);
adsRoutes.delete('/:id', adminRoute, adsController.deleteAd);

export default adsRoutes; 