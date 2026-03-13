import db from "../models/index.js";
const { User } = db;
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";

/**
 * ==========================================
 * AUTH SERVICE METHODS
 * ==========================================
 */

export const loginUser = async ({ username, password }) => {
  const user = await User.findOne({ where: { Username: username } });

  if (!user || !(await bcrypt.compare(password, user.PasswordHash))) {
    return null;
  }

  const token = jwt.sign(
    {
      id: user.UserID,
      username: user.Username,
      role: user.UserRole,
      isMasterAdmin: user.IsMasterAdmin,
    },
    jwtConfig,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );

  return {
    token,
    user,
  };
};

export const getSelfProfile = async (userId) => {
  return User.findByPk(userId, {
    attributes: ["UserID", "Username", "FullName", "UserRole"],
  });
};

export const updateSelfProfile = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) return null;

  const updatePayload = {};
  const updatedPart = {};

  if (data.username !== undefined && data.username !== user.Username) {
    updatePayload.Username = data.username;
    updatedPart.username = data.username;
  }

  if (data.fullName !== undefined && data.fullName !== user.FullName) {
    updatePayload.FullName = data.fullName;
    updatedPart.fullName = data.fullName;
  }

  if (data.password !== undefined && data.password.trim() !== "") {
    const isSamePassword = await bcrypt.compare(
      data.password,
      user.PasswordHash,
    );
    if (isSamePassword) {
      throw new Error("PASSWORD_SAME");
    }
    updatePayload.PasswordHash = await bcrypt.hash(data.password, 10);
    updatedPart.password = "UPDATED";
  }

  if (Object.keys(updatePayload).length === 0) {
    throw new Error("NO_CHANGES");
  }

  await User.update(updatePayload, { where: { UserID: userId } });

  return { user, updatePayload, updatedPart };
};

export const deleteSelfProfile = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return null;
  await user.destroy();
  return user;
};

export const createUser = async (data) => {
  const hash = await bcrypt.hash(data.password, 10);
  return User.create({
    Username: data.username,
    PasswordHash: hash,
    FullName: data.fullName || null,
    UserRole: data.userRole || "Staff",
  });
};

export const listAllUsers = async () => {
  return User.findAll({
    attributes: ["UserID", "Username", "FullName", "UserRole"],
  });
};

export const getUserByIdService = async (id) => {
  return User.findByPk(id, {
    attributes: ["UserID", "Username", "FullName", "UserRole"],
  });
};

export const deleteUserByIdService = async (id) => {
  const user = await User.findByPk(id);
  if (!user) return null;
  await user.destroy();
  return user;
};
