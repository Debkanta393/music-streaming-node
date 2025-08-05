import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../module/auth-module.js"
import cookieParser from "cookie-parser"
import crypto from "crypto"
import nodemailer from "nodemailer"
import dotenv from 'dotenv';
dotenv.config();

const getFilename = (filePath) => {
    return filePath?.split('\\').pop() || '';
};


const register = async (req, res) => {
    try {
        const { name, email, password } = req.body
        console.log(email, password, "In backend")
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        // Check if the user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: "User already exists." })
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const user = await User.create({ name, email, password: hashedPassword })
        // Generate a JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" })

        // Set cookies
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",  // ✅ Add this
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            message: "User registered successfully",
            data: user,
            token: token
        })

    } catch (error) {

    }
}


const login = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        // Check if the user already exists
        const user = await User.findOne({ email }).select("+password")
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" })
        }

        // Compare the password
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" })
        }

        // Generate a JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" })

        // Set cookies
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",  // ✅ Add this
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: "User logged in successfully",
            data: user,
            token: token
        })

    } catch (error) {

    }
}

const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: 0
        })
        res.status(200).json({ message: "User logged out successfully" })
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}

// Configure nodemailer
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for port 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // use an App Password if Gmail has 2FA
    },
    tls: {
        rejectUnauthorized: false
    }
});

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        // Send reset email
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset Request",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>Hello ${user.name},</p>
                    <p>You requested a password reset for your Music Stream account.</p>
                    <p>Click the button below to reset your password:</p>
                    <a href="${resetUrl}" style="display: inline-block; background-color: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
                    <p>This link will expire in 10 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <p>Best regards,<br>Music Stream Team</p>
                </div>
            `
        }

        // Send email (await, not callback)
        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: "Password reset email sent successfully",
            success: true
        });

    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({
            message: "Error sending reset email",
            success: false
        });
    }
}

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                message: "Token and password are required",
                success: false
            })
        }

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() }
        })

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset token",
                success: false
            })
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Update user password and clear reset token
        user.password = hashedPassword
        user.resetPasswordToken = null
        user.resetPasswordExpire = null
        await user.save()

        res.status(200).json({
            message: "Password reset successfully",
            success: true
        })
    } catch (error) {
        console.error("Reset password error:", error)
        res.status(500).json({
            message: "Error resetting password",
            success: false
        })
    }
}

const getUser = async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) return res.status(401).json({ message: 'Not logged in or token is expired' });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('name email bio image');
            if (!user) return res.status(404).json({ message: 'User not found' });
            return res.json(user);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

const updateUser = async (req, res) => {
    try {
        console.log("Update user clicked", req.body)
        const { name, email, bio } = req.body
        const image = req.files?.image?.[0]
        console.log(image)
        const userId = req.user._id

        // ✅ Extract filenames from path
        const imageFilename = getFilename(image.path);

        const user = await User.findById(userId)
        console.log("Update user", user)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        user.name = name
        user.email = email
        user.bio = bio
        user.image = imageFilename
        await user.save()
        res.status(200).json({ message: "User updated successfully", data: user })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error", error: error })
    }
}

export { register, login, logout, forgotPassword, resetPassword, getUser, updateUser }