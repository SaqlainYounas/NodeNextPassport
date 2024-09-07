import {db} from "../Db/prisma";

export const getPassowordResetTokenByToken = async (token: string) => {
  try {
    const resetToken = await db.passwordResetToken.findUnique({
      where: {
        token,
      },
    });

    return resetToken;
  } catch (error) {
    return null;
  }
};

export const getPassowordResetTokenByEmail = async (email: string) => {
  try {
    const resetToken = await db.passwordResetToken.findFirst({
      where: {
        email,
      },
    });

    return resetToken;
  } catch (error) {
    return null;
  }
};
