import { auth } from "./firebase.js";

// Flutterwave public key
const FLW_PUBLIC_KEY = import.meta.env.VITE_FLW_PUBLIC_KEY || "FLWPUBK_TEST-244e80dcb198108381cc5d9320da4fc9-X";

// Amounts in USD cents
const PLAN_AMOUNT = {
  weekly: 4.99,
  monthly: 14.99,
  lifetime: 79
};

// User must be logged in
async function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      if (user) resolve(user);
      else reject("User not logged in");
    });
  });
}

window.payPlan = async function(plan) {
  let user;
  try {
    user = await getCurrentUser();
  } catch (err) {
    alert("Please log in first to upgrade.");
    return;
  }

  const amount = PLAN_AMOUNT[plan];

  const x = FlutterwaveCheckout({
    public_key: FLW_PUBLIC_KEY,
    tx_ref: `VoxFixAI_${plan}_${Date.now()}`,
    amount: amount,
    currency: "USD",
    payment_options: "card, mobilemoney, ussd",
    customer: {
      email: user.email,
      name: user.displayName || "VoxFix User"
    },
    callback: async function(data) {
      alert("Payment successful! Updating account...");
      // Update Firestore user document to mark premium
      const uid = user.uid;
      const db = firebase.firestore();
      const userRef = db.collection("users").doc(uid);
      await userRef.set({ isPremium: true, plan }, { merge: true });
      window.location.reload();
    },
    onclose: function() {
      console.log("Payment closed");
    },
    customizations: {
      title: "VoxFix AI Premium",
      description: `${plan} subscription`,
      logo: "https://your-logo-link.com/logo.png"
    }
  });
};