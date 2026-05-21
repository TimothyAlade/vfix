import admin from "firebase-admin";

if(!admin.apps.length){

  admin.initializeApp({

    credential:
    admin.credential.cert(
      JSON.parse(
        process.env.FIREBASE_ADMIN_CONFIG
      )
    )

  });

}

const db =
admin.firestore();

export async function handler(event){

  try{

    const reference =
    event.queryStringParameters.reference;

    const response =
    await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers:{
          Authorization:
          `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const data =
    await response.json();

    if(
      data.data.status ===
      "success"
    ){

      const uid =
      data.data.metadata.uid;

      await db
      .collection("users")
      .doc(uid)
      .update({

        premium:true,

        premiumSince:
        Date.now()

      });

      return{

        statusCode:302,

        headers:{
          Location:"/premium-success.html"
        }

      };

    }

    return{

      statusCode:400,

      body:"Payment failed"

    };

  }catch(error){

    return{

      statusCode:500,

      body:error.message

    };

  }

}