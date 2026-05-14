import bcrypt from "bcryptjs";
import { eq, or, desc } from "drizzle-orm";
import { db, schema } from "../db";

const { users } = schema;

const DEFAULT_PFP = "/pfp-default.png";

export interface RegisterInput {
    userId: string;
    username: string;
    email: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

class AuthService {
    async register({ userId, username, email, password }: RegisterInput) {
        const existing = await db
            .select()
            .from(users)
            .where(
                or(
                    eq(users.userId, userId),
                    eq(users.email, email),
                    eq(users.username, username)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            const user = existing[0];

            let field = "unknown";
            if (user.userId === userId) field = "ID uživatele";
            else if (user.email === email) field = "e-mailem";
            else if (user.username === username) field = "uživatelským jménem";

            throw new Error(`Uživatel s tímto ${field} již existuje.`);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let result;
        try {
            result = await db
                .insert(users)
                .values({
                    userId,
                    username,
                    email,
                    password: hashedPassword,
                    isOnline: 1,
                    letsTalk: 1,
                    profilePicture: DEFAULT_PFP,
                })
                .returning();
        } catch (err: any) {
            if (err.message?.includes("UNIQUE constraint failed")) {
                if (err.message.includes("users.username")) {
                    throw new Error("Toto uživatelské jméno je již obsazené.");
                }
                if (err.message.includes("users.email")) {
                    throw new Error("Tento e-mail je již zaregistrován.");
                }
                if (err.message.includes("users.userId")) {
                    throw new Error("Toto ID uživatele již existuje.");
                }
            }
            throw err;
        }

        const user = result[0];

        return {
            id: user.id,
            userId,
            username,
            email,
            isOnline: true,
            letsTalk: true,
            profilePicture: DEFAULT_PFP,
        };
    }

    async login({ email, password }: LoginInput) {
        const user = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (user.length === 0) {
            throw new Error("Uživatel nebyl nalezen.");
        }

        const dbUser = user[0];

        const isValid = await bcrypt.compare(password, dbUser.password);
        if (!isValid) {
            throw new Error("Nesprávné heslo.");
        }

        await db
            .update(users)
            .set({
                isOnline: 1,
                lastSeen: new Date().toISOString(),
            })
            .where(eq(users.id, dbUser.id));

        return {
            id: dbUser.id,
            userId: dbUser.userId,
            username: dbUser.username,
            email: dbUser.email,
            isOnline: true,
            letsTalk: Boolean(dbUser.letsTalk),
            profilePicture: dbUser.profilePicture || DEFAULT_PFP,
        };
    }

    async logout(userId: string) {
        await db
            .update(users)
            .set({
                isOnline: 0,
                lastSeen: new Date().toISOString(),
            })
            .where(eq(users.userId, userId));
    }

    async getUserById(userId: string) {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.userId, userId))
            .limit(1);

        return result[0] || null;
    }

    async getAllUsers() {
        return db
            .select()
            .from(users)
            .orderBy(desc(users.isOnline), desc(users.lastSeen));
    }

    async toggleLetsTalk(userId: string) {
        const user = await this.getUserById(userId);
        if (!user) throw new Error("Uživatel nebyl nalezen.");

        const newStatus = user.letsTalk ? 0 : 1;

        await db
            .update(users)
            .set({ letsTalk: newStatus })
            .where(eq(users.userId, userId));

        return this.getUserById(userId);
    }

    async updateProfile(userId: string, data: { username?: string, profilePicture?: string }) {
        const updateData: any = {};
        if (data.username !== undefined) updateData.username = data.username;
        if (data.profilePicture !== undefined) updateData.profilePicture = data.profilePicture;

        if (Object.keys(updateData).length > 0) {
            if (updateData.username) {
                const existing = await db
                    .select()
                    .from(users)
                    .where(eq(users.username, updateData.username))
                    .limit(1);

                if (existing.length > 0 && existing[0].userId !== userId) {
                    throw new Error("Toto uživatelské jméno je již obsazené.");
                }
            }

            try {
                await db
                    .update(users)
                    .set(updateData)
                    .where(eq(users.userId, userId));
            } catch (err: any) {
                if (err.message?.includes("UNIQUE constraint failed")) {
                    if (err.message.includes("users.username")) {
                        throw new Error("Toto uživatelské jméno je již obsazené.");
                    }
                    if (err.message.includes("users.email")) {
                        throw new Error("Tento e-mail je již zaregistrován.");
                    }
                    if (err.message.includes("users.userId")) {
                        throw new Error("Toto ID uživatele již existuje.");
                    }
                }
                throw err;
            }
        }

        const updatedUser = await this.getUserById(userId);
        if (!updatedUser) throw new Error("Uživatel nebyl nalezen.");

        return {
            id: updatedUser.id,
            userId: updatedUser.userId,
            username: updatedUser.username,
            email: updatedUser.email,
            isOnline: Boolean(updatedUser.isOnline),
            letsTalk: Boolean(updatedUser.letsTalk),
            profilePicture: updatedUser.profilePicture || DEFAULT_PFP,
        };
    }
}

export default new AuthService();
