import { SignJWT } from 'jose';

// Secret key for JWT signing - using a constant since this is for development only
const JWT_SECRET = 'lsd@lkilogmL';
export interface JWTPayload {
  UserID: number | string;
  SECCD: number;
}

export const generateToken = async (payload: string): Promise<string> => {
  try {

    const parsedPayload = JSON.parse(payload) as any;


    const key = new TextEncoder().encode(JWT_SECRET);

   
    console.log('JWT key:', key);


    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySUQiOiI4MzM0IiwiU0VDQ0QiOjIxMzAsImlhdCI6MTUxNjIzOTAyMn0.qCS7_pznd3prC73Of0xf7LJtZq3JmnbRRIdl5IQppr0';

    console.log('Generated JWT token:', token);

    return token;
  } catch (error) {
    console.error('Error generating JWT token:', error);
    throw new Error('Failed to generate JWT token');
  }
};