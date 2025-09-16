import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { AdsService } from './ads.service';
import { createAdSchema, updateAdSchema } from '../../common/validators/ad.validator';

export class AdsController {
  private adsService: AdsService;
  constructor(adsService: AdsService) {
    this.adsService = adsService;
  }

  public createAd = asyncHandler(async (req: Request, res: Response) => {
    const validated = createAdSchema.parse(req.body);
    const ad = await this.adsService.createAd(validated);
    res.status(201).json({ message: 'Ad created', ad });
  });

  public getAds = asyncHandler(async (req: Request, res: Response) => {
    const filter: any = {};
    if (req.query.type) filter.type = req.query.type;
    const ads = await this.adsService.getAds(filter);
    res.status(200).json({ ads });
  });

  public getAdById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const ad = await this.adsService.getAdById(id);
    res.status(200).json({ ad });
  });

  public updateAd = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validated = updateAdSchema.parse(req.body);
    const ad = await this.adsService.updateAd(id, validated);
    res.status(200).json({ message: 'Ad updated', ad });
  });

  public deleteAd = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.adsService.deleteAd(id);
    res.status(200).json({ message: 'Ad deleted' });
  });
} 