import { NotFoundException } from "../../common/utils/catch-errors";
import SessionModel from "../../database/models/session.model";

export class UserService {
  public async getSessionById(sessionId: string) {
    const session = await SessionModel.findById(sessionId)

    if (!session) {
      throw new NotFoundException("Session not found");
    }
    const { userId, role } = session;
    return {
      userId,
      role     
    };
  }
 
}