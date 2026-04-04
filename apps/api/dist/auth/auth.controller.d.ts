import { Response, Request } from 'express';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: {
        email: string;
        password: string;
        name: string;
    }, res: Response): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            createdAt: Date;
        };
    }>;
    login(body: {
        email: string;
        password: string;
    }, res: Response): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            createdAt: Date;
        };
    }>;
    refresh(req: Request, res: Response): Promise<{
        ok: boolean;
    }>;
    me(req: any): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            createdAt: Date;
        } | null;
    }>;
    logout(req: Request, res: Response): Promise<{
        ok: boolean;
    }>;
}
