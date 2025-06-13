import { ErrorCode } from "../../common/enums/error-code.enum";
import { NotFoundException } from "../../common/utils/catch-errors";
import SessionModel from "../../database/models/session.model";
import { getQiz } from "../../utils/get-quiz-questions";

export class UserService {
  public async getSessionById(sessionId: string) {
    const session = await SessionModel.findById(sessionId)

    if (!session) {
      throw new NotFoundException("Session not found");
    }
    const { userId, role, name, email } = session;
    return {
      userId,
      role,
      name,
      email
    };
  }
 
}