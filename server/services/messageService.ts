import { and, or, eq, asc } from "drizzle-orm";
import { db, schema } from "../db";

const { messages } = schema;

class MessageService {
    async getChatHistory(user1: string, user2: string) {
        await db.update(messages)
            .set({ isRead: 1 })
            .where(
                and(
                    eq(messages.receiverId, user1),
                    eq(messages.senderId, user2)
                )
            );

        return db
            .select()
            .from(messages)
            .where(
                or(
                    and(eq(messages.senderId, user1), eq(messages.receiverId, user2)),
                    and(eq(messages.senderId, user2), eq(messages.receiverId, user1))
                )
            )
            .orderBy(asc(messages.timestamp));
    }

    async getConversations(userId: string) {
        const allUserMsgs = await db
            .select()
            .from(messages)
            .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
            .orderBy(asc(messages.timestamp));

        const convos = new Map<string, any>();

        for (const msg of allUserMsgs) {
            const otherUser = msg.senderId === userId ? msg.receiverId : msg.senderId;
            const isUnread = msg.receiverId === userId && msg.isRead === 0;

            if (!convos.has(otherUser)) {
                convos.set(otherUser, {
                    userId: otherUser,
                    lastMessage: msg.content,
                    lastMessageTime: msg.timestamp,
                    unreadCount: isUnread ? 1 : 0
                });
            } else {
                const c = convos.get(otherUser);
                c.lastMessage = msg.content;
                c.lastMessageTime = msg.timestamp;
                if (isUnread) c.unreadCount += 1;
            }
        }
        return Array.from(convos.values()).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    }

    async saveMessage(senderId: string, receiverId: string, content: string) {
        const result = await db.insert(messages).values({
            senderId,
            receiverId,
            content,
            timestamp: new Date().toISOString(),
            isRead: 0,
        }).returning();
        return result[0];
    }
}

export default new MessageService();
