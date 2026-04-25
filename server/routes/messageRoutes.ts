import express, { Request, Response } from "express";
import messageService from "../services/messageService";

const router = express.Router();

router.get("/history/:user1/:user2", async (req: Request, res: Response) => {
    try {
        const { user1, user2 } = req.params;
        const history = await messageService.getChatHistory(user1 as string, user2 as string);
        
        res.json({ 
            success: true, 
            messages: history 
        });
    } catch (err: any) {
        console.error("Fetch history error:", err);
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
});

export default router;

router.get("/conversations/:userId", async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const convos = await messageService.getConversations(userId as string);
        
        res.json({ 
            success: true, 
            conversations: convos 
        });
    } catch (err: any) {
        console.error("Fetch convos error:", err);
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
});
