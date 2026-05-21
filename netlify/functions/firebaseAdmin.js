import admin from "firebase-admin";
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("./voxfixai-firebase-adminsdk.json", "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://voxfixai.firebaseio.com"
  });
}

export const dbAdmin = admin.firestore();
export const authAdmin = admin.auth();