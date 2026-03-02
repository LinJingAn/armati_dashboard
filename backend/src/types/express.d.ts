declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      role: string;
      companyId?: string | null;
      /** Set only by Google OAuth callback for redirect */
      jwtToken?: string;
    }
  }
}

export {};
