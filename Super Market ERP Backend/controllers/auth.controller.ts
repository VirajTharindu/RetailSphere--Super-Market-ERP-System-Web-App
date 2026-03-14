import {
  loginUser,
  getSelfProfile,
  updateSelfProfile,
  deleteSelfProfile,
  createUser,
  listAllUsers,
  getUserByIdService,
  deleteUserByIdService,
} from "../services/auth.service.js";

/**
 * ==========================================
 * AUTH CONTROLLER METHODS
 * ==========================================
 */

export const healthCheck = (req: any, res: any) => {
  res.json({ status: "ok", message: "Auth service live 🚀" });
};

export const loginController = async (req: any, res: any) => {
  const result = await loginUser(req.body);
  if (!result) {
    return res.status(401).json({
      success: false,
      message: "Invalid username or password",
    });
  }

  res.status(200).json({
    success: true,
    token: result?.token,
    user: {
      id: result?.user?.UserID,
      username: result?.user?.Username,
      role: result?.user?.UserRole,
    },
  });
};

export const getProfileController = async (req: any, res: any) => {
  const user = await getSelfProfile(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.status(200).json({ success: true, user });
};

export const updateSelfProfileController = async (req: any, res: any) => {
  try {
    const result = await updateSelfProfile(req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: `Profile updated successfully for user ${result?.user?.UserID}.`,
      updatedPart: result?.updatedPart,
      user: {
        id: result?.user?.UserID,
        username: (result as any).user?.Username,
        fullName: (result as any).user?.FullName,
        password: (result as any).user?.PasswordHash ? "UPDATED" : "UNCHANGED",
        role: result?.user?.UserRole,
        updatedAt: new Date(),
      },
    });
  } catch (err: any) {
    if (err.message === "NO_CHANGES") {
      return res.status(400).json({
        success: false,
        message: "No actual changes detected. System idle. 😴",
      });
    }
    if (err.message === "PASSWORD_SAME") {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
    }
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Username already exists. Identity collision! 💥",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
};

export const removeProfileController = async (req: any, res: any) => {
  if (req.user.isMasterAdmin) {
    return res.status(403).json({
      success: false,
      message: "Master Admin account cannot be deleted",
    });
  }

  const user = await deleteSelfProfile(req.user.id);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });

  res.status(200).json({
    success: true,
    message: `Profile deleted successfully for user ${(user as any)["Username"]}`,
    user: {
      id: user.UserID,
      username: (user as any)["Username"],
      fullName: (user as any)["FullName"],
      role: user.UserRole,
    },
  });
};

export const logoutController = (req: any, res: any) => {
  res.status(200).json({
    success: true,
    message: `Logout successful. Please remove token on client side for ${req.user.username}.`,
    note: "Token remains valid until expiry unless blacklisted.",
  });
};

export const registerUserController = async (req: any, res: any) => {
  if (req.body.userRole === "Admin" && req.user.role !== "Admin") {
    return res
      .status(403)
      .json({ success: false, message: "Admins only can create Admins" });
  }

  try {
    const user = await createUser(req.body);
    res.status(201).json({
      success: true,
      message: `User ${user.UserID} created successfully.`,
      user,
    });
  } catch (err: any) {
    const isDup = err.name === "SequelizeUniqueConstraintError";
    res.status(isDup ? 400 : 500).json({
      success: false,
      message: isDup ? "Username exists" : "Registration failed",
    });
  }
};

export const listUsersController = async (req: any, res: any) => {
  const users = await listAllUsers();
  res.status(200).json({
    success: true,
    message: `Retrieved ${users.length} users`,
    users,
  });
};

export const getUserByIdController = async (req: any, res: any) => {
  const user = await getUserByIdService(req.params.id);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });
  res.status(200).json({ success: true, user });
};

export const deleteUserController = async (req: any, res: any) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({
      success: false,
      message: "Use / profile-remove for self-deletion",
    });
  }

  const target = await deleteUserByIdService(targetId);
  if (!target)
    return res.status(404).json({ success: false, message: "User not found" });

  res.status(200).json({
    success: true,
    message: `User ${targetId} deleted successfully`,
  });
};
