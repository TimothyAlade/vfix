import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  sendEmailVerification,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firstNameInput = document.getElementById("firstName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const verificationInput = document.getElementById("verificationCode");

// Google provider
const provider = new GoogleAuthProvider();

// SIGN UP
window.signUp = async function() {
  const firstName = firstNameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!firstName || !email || !password) {
    alert("Please fill in all required fields");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update displayName with first name
    await updateProfile(user, { displayName: firstName });

    // Send email verification
    await sendEmailVerification(user);

    alert("Account created! Please check your email for verification code.");

    // Redirect to home
    setTimeout(() => { window.location.href = "index.html"; }, 1000);
  } catch (error) {
    alert("Sign Up Error: " + error.message);
  }
};

// LOGIN
window.login = async function() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      alert("Please verify your email first");
      return;
    }

    alert("Login successful! Redirecting...");

    setTimeout(() => { window.location.href = "index.html"; }, 500);
  } catch (error) {
    alert("Login Error: " + error.message);
  }
};

// GOOGLE SIGN-IN
window.googleSignIn = async function() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    alert(`Welcome ${user.displayName || "User"}!`);
    window.location.href = "index.html";
  } catch (error) {
    alert("Google Sign-In Error: " + error.message);
  }
};

// ANONYMOUS LOGIN
window.anonymousSignIn = async function() {
  try {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    alert("Logged in as guest");
    window.location.href = "index.html";
  } catch (error) {
    alert("Anonymous Sign-In Error: " + error.message);
  }
};