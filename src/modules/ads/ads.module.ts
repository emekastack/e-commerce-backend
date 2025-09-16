import { AdsService } from './ads.service';
import { AdsController } from './ads.controller';

const adsService = new AdsService();
const adsController = new AdsController(adsService);
export { adsService, adsController }; 