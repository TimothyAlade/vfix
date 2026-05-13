const axios = require("axios");

const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/naija-marketplace-pro-d154f/databases/(default)/documents";

async function updateDoc(path, fields) {
    await fetch(`${FIRESTORE_URL}/${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
    });
}

async function queryProducts(uid) {
    const res = await fetch(`${FIRESTORE_URL}:runQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: 'products' }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: 'userId' },
                        op: { op: 'EQUAL' },
                        value: { stringValue: uid }
                    }
                }
            }
        })
    });
    return res.json();
}

module.exports = async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method === "GET") return res.status(200).send("Webhook ready. POST only.");

    if (req.method === "POST") {
        try {
            const event = req.body;

            if (event.event === "charge.success" && event.data?.status === "success") {
                const reference = event.data.reference;
                const amount = event.data.amount;
                const uid = event.data.metadata?.uid;

                if (!uid) return res.status(400).json({ error: "No UID" });
                if (amount !== 200000) return res.status(400).json({ error: "Invalid amount" });

                // Verify with Paystack
                const verifyRes = await axios.get(
                    `https://api.paystack.co/transaction/verify/${reference}`,
                    {
                        headers: {
                            Authorization: `Bearer sk_live_c72257e703ee63aec11cb51076bc0866410de647`
                        }
                    }
                );

                if (verifyRes.data.data.status !== "success") {
                    return res.status(400).json({ error: "Payment not verified" });
                }

                // Update user as verified
                await updateDoc(`publicProfiles/${uid}`, {
                    verified: { booleanValue: true },
                    verifiedAt: { timestampValue: new Date().toISOString() },
                    paymentReference: { stringValue: reference }
                });

                // Update all products
                const productsResult = await queryProducts(uid);
                if (productsResult && productsResult.length > 0) {
                    for (const doc of productsResult) {
                        if (doc.document) {
                            const path = doc.document.name.split('/documents/')[1];
                            await updateDoc(path, {
                                sellerVerified: { booleanValue: true }
                            });
                        }
                    }
                }

                console.log('✅ User verified:', uid);
                return res.status(200).json({ success: true });
            }

            return res.status(200).json({ received: true });
        } catch (err) {
            console.error("Error:", err.message);
            return res.status(500).json({ error: "Internal error" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
