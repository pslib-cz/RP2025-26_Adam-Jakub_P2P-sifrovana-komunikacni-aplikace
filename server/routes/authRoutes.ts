import express, { Request, Response, NextFunction } from "express";
import authService from "../services/authService";

const router = express.Router();

const asyncHandler =
    (fn: any) => (req: Request, res: Response, next: NextFunction) =>
        Promise.resolve(fn(req, res, next)).catch(next);

function requireBody(fields: string[], body: any): string | null {
    for (const f of fields) {
        if (!body[f]) return f;
    }
    return null;
}

router.post(
    "/register",
    asyncHandler(async (req: Request, res: Response) => {
        const missing = requireBody(
            ["userId", "username", "email", "password"],
            req.body
        );

        if (missing) {
            const fieldNames: Record<string, string> = {
                userId: "ID uživatele",
                username: "Uživatelské jméno",
                email: "Email",
                password: "Heslo"
            };
            return res.status(400).json({
                success: false,
                message: `${fieldNames[missing] || missing} je povinný údaj`,
            });
        }

        const user = await authService.register(req.body);

        res.status(201).json({
            success: true,
            user,
        });
    })
);

router.post(
    "/login",
    asyncHandler(async (req: Request, res: Response) => {
        const missing = requireBody(["email", "password"], req.body);

        if (missing) {
            const fieldNames: Record<string, string> = {
                email: "Email",
                password: "Heslo"
            };
            return res.status(400).json({
                success: false,
                message: `${fieldNames[missing] || missing} je povinný údaj`,
            });
        }

        const user = await authService.login(req.body);

        res.json({
            success: true,
            user,
        });
    })
);

router.post(
    "/logout",
    asyncHandler(async (req: Request, res: Response) => {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "ID uživatele je povinné",
            });
        }

        await authService.logout(userId);

        res.json({ success: true });
    })
);

router.get(
    "/users",
    asyncHandler(async (_req: Request, res: Response) => {
        const users = await authService.getAllUsers();

        res.json({
            success: true,
            users,
        });
    })
);

router.get(
    "/user/:userId",
    asyncHandler(async (req: Request, res: Response) => {
        const user = await authService.getUserById(req.params.userId as string);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Uživatel nebyl nalezen",
            });
        }

        res.json({
            success: true,
            user,
        });
    })
);

router.post(
    "/toggle-letstalk",
    asyncHandler(async (req: Request, res: Response) => {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "ID uživatele je povinné",
            });
        }

        const user = await authService.toggleLetsTalk(userId);

        res.json({
            success: true,
            user,
        });
    })
);

router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);

    res.status(500).json({
        success: false,
        message: err.message,
    });
});

router.put("/profile", async (req: Request, res: Response) => {
    try {
        const { userId, username, profilePicture } = req.body;
    
        if (!userId) {
            return res.status(400).json({ success: false, message: "Chybí ID uživatele" });
        }

        if (profilePicture) {

            const isDefault = profilePicture === "/pfp-default.png";
            const isBase64Image = profilePicture.startsWith("data:image/");
            
            if (!isDefault && !isBase64Image) {
                return res.status(400).json({ success: false, message: "Neplatný formát obrázku!" });
            }
            
            if (isBase64Image && profilePicture.length > 3 * 1024 * 1024) {
                return res.status(400).json({ success: false, message: "Obrázek je příliš velký!" });
            }
        }

        const updatedUser = await authService.updateProfile(userId, { username, profilePicture });

        import("../ws/handlers").then(h => h.broadcastUsers()).catch(console.error);

        res.json({
            success: true,
            user: updatedUser,
        });
    } catch (err: any) {
        console.error("Profile update error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
