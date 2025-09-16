import AdModel from '../../database/models/ad.model';
import { BadRequestException, NotFoundException } from '../../common/utils/catch-errors';
import { Types } from 'mongoose';

export class AdsService {
  async createAd(data: any) {
    return await AdModel.create(data);
  }

  async getAds(filter: any = {}) {
    return await AdModel.find(filter).sort({ order: 1, createdAt: -1 });
  }

  async getAdById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ad ID');
    const ad = await AdModel.findById(id);
    if (!ad) throw new NotFoundException('Ad not found');
    return ad;
  }

  async updateAd(id: string, data: any) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ad ID');
    const ad = await AdModel.findByIdAndUpdate(id, data, { new: true });
    if (!ad) throw new NotFoundException('Ad not found');
    return ad;
  }

  async deleteAd(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ad ID');
    const ad = await AdModel.findByIdAndDelete(id);
    if (!ad) throw new NotFoundException('Ad not found');
    return ad;
  }
} 