import { auth } from "./firebase.js";
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    PhoneAuthProvider,
    linkWithCredential
} from "firebase/auth";
import { submitForm } from "../api/api.js";

const provider = new GoogleAuthProvider();

export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Google Login Error:", error);
        throw error;
    }
}

export async function logout() {
    await signOut(auth);
}

export function listenForAuth(callback) {
    return onAuthStateChanged(auth, callback);
}

export async function checkUserExists(uid) {
    try {
        const result = await submitForm('getUser', { uid });
        return result.exists;
    } catch (error) {
        console.error("Failed to check if user exists:", error);
        return false;
    }
}

export async function sendOtp(phoneNumber, containerIdOrElement) {
    try {
        const recaptchaVerifier = new RecaptchaVerifier(auth, containerIdOrElement, {
            size: 'invisible'
        });
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
        return confirmationResult;
    } catch (error) {
        console.error("Failed to send OTP:", error);
        throw error;
    }
}

export async function verifyOtpAndLink(confirmationResult, otpCode) {
    try {
        const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otpCode);
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No Google user logged in.");
        }
        await linkWithCredential(user, credential);
        return user;
    } catch (error) {
        console.error("Failed to verify OTP or link account:", error);
        throw error;
    }
}