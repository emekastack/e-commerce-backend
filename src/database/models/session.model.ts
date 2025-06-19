import mongoose, { Document, Schema } from "mongoose";
import { thirtyDaysFromNow } from "../../common/utils/date-time";
import { Roles, RoleType } from "../../common/enums/role.enum";

export interface SessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  userAgent?: string;
  name: string;
  email: string;
  expiredAt: Date;
  role: RoleType;  
  createdAt: Date;
}

const sessionSchema = new Schema<SessionDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true,
  },
  userAgent: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    enum: Object.values(Roles),
    required: true,    
  }, 
  name: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
    lowercase: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiredAt: {
    type: Date,
    required: true,
    default: thirtyDaysFromNow,
  },
});

const SessionModel = mongoose.model<SessionDocument>("Session", sessionSchema);

export default SessionModel;