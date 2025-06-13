import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import { UserDocument } from "../database/models/user.model";
import { SessionDocument } from "../database/models/session.model";
import { config } from "../config/app.config";
import type { StringValue } from "ms";
import { RoleType } from "../common/enums/role.enum";
// import { SessionDocument } from "../../database/models/session.model";
// import { UserDocument } from "../../database/models/user.model";
// import { config } from "../../config/app.config";

export type AccessTPayload = {
  userId: UserDocument["_id"];
  sessionId: SessionDocument["_id"];
  // role: RoleType;
};

export type RefreshTPayload = {
  sessionId: SessionDocument["_id"];
  role: RoleType;
};

type SignOptsAndSecret = SignOptions & {
  secret: string;
};

const defaults: SignOptions = {
  audience: ["user"],
};

type ExpiresIn = number | undefined | StringValue;

export const accessTokenSignOptions: SignOptsAndSecret = {
  expiresIn: config.JWT.EXPIRES_IN as ExpiresIn,
  secret: config.JWT.SECRET,
};

export const refreshTokenSignOptions: SignOptsAndSecret = {
  expiresIn: config.JWT.REFRESH_EXPIRES_IN as ExpiresIn,
  secret: config.JWT.REFRESH_SECRET,
};

export const signJwtToken = (
  payload: AccessTPayload | RefreshTPayload,
  options?: SignOptsAndSecret
) => {
  const { secret, ...opts } = options || accessTokenSignOptions;
  return jwt.sign(payload, secret, {
    ...defaults,
    ...opts,
  });
};

export const verifyJwtToken = <TPayload extends object = AccessTPayload>(
  token: string,
  options?: VerifyOptions & { secret: string }
) => {
  try {
    const { secret = config.JWT.SECRET, ...opts } = options || {};
    const payload = jwt.verify(token, secret, {
      ...defaults,
      ...opts,
    }) as TPayload;
    return { payload };
  } catch (err: any) {
    return {
      error: err.message,
    };
  }
};