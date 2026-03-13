import { Request, Response, NextFunction } from "express";
export type JwtPayload = {
    sub: string;
    email: string;
    role: string;
};
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=jwt.d.ts.map