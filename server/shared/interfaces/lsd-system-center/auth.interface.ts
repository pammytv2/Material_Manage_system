//  ➕ Interfaces : jwt payload for generate jwt
export interface JwtPayloadData {
  UserID: string;
  SECCD: string;
  iat?: number;
  exp?: number;
}

export interface BooleanStatus {
  status: boolean;
}
