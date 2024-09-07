import {db} from "../Db/prisma";

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findUnique({
      where: {
        email,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: {
        id,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
};

export const getSafeUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        isTwoFactorEnabled: true,
        Conversation: true,
        Message: true,
        accounts: true,
        // Password is excluded here
      },
    });

    return user;
  } catch (error) {
    return null;
  }
};

export const getUserJwtTokenById = async (id: string) => {
  try {
    const user = await db.userJwtRefreshToken.findUnique({
      where: {
        userId: id,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
};
