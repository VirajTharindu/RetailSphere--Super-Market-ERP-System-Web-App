import db from "../models/index.js";
const { User } = db as any;
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";

/**
 * ==========================================
 * AUTH SERVICE METHODS
 * ==========================================
 */

export const loginUser = async ({ username, password }: any) => {
  const user = await User.findOne({ where: { Username: username } });

  if (!user || !(await bcrypt.compare(password, (user as any).PasswordHash))) {
    return null;
  }

  const token = jwt.sign(
    {
      id: user.UserID,
      username: (user as any).Username,
      role: user.UserRole,
      isMasterAdmin: user.IsMasterAdmin,
    },
    jwtConfig,
    { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any },
  );

  return {
    token,
    user,
  };
};

export const createUser = async (data: any) => {
  if (data.password) {
    data.PasswordHash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }
  return User.create(data);
};

export const listAllUsers = async () => {
  return User.findAll({
    attributes: { exclude: ["PasswordHash"] },
  });
};

export const getUserByIdService = async (id: any) => {
  return User.findByPk(id, {
    attributes: { exclude: ["PasswordHash"] },
  });
};

export const getSelfProfile = async (userId: any) => {
  return User.findByPk(userId, {
    attributes: ["UserID", "Username", "FullName", "UserRole"],
  });
};

export const updateSelfProfile = async (userId: any, data: any) => {
  const user = await User.findByPk(userId);
  if (!user) return null;

  const updatedPart: any = {};

  if (data.username !== undefined && data.username !== (user as any).Username) {
    (user as any).Username = data.username;
    updatedPart.username = data.username;
  }

  if (data.fullName !== undefined && data.fullName !== (user as any).FullName) {
    (user as any).FullName = data.fullName;
    updatedPart.fullName = data.fullName;
  }

  if (data.password !== undefined && data.password.trim() !== "") {
    const isSamePassword = await bcrypt.compare(
      data.password,
      (user as any).PasswordHash,
    );
    if (isSamePassword) {
      throw new Error("PASSWORD_SAME");
    }
    (user as any).PasswordHash = await bcrypt.hash(data.password, 10);
    updatedPart.password = "UPDATED";
  }

  if (Object.keys(updatedPart).length === 0) {
    throw new Error("NO_CHANGES");
  }

  await user.save();
  return { user, updatedPart };
};

export const deleteUserByIdService = async (id: any) => {
  const user = await User.findByPk(id);
  if (!user) return null;
  await user.destroy();
  return user;
};

export const deleteSelfProfile = async (userId: any) => {
  const user = await User.findByPk(userId);
  if (!user) return null;

  if (user.IsMasterAdmin) {
    throw new Error("MASTER_ADMIN_DELETE_PROHIBITED");
  }

  await user.destroy();
  return user;
};

export default {
  loginUser,
  createUser,
  listAllUsers,
  getUserByIdService,
  getSelfProfile,
  updateSelfProfile,
  deleteUserByIdService,
  deleteSelfProfile,
};
