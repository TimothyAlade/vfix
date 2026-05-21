export async function handler(event){

  try{

    const body =
    JSON.parse(event.body);

    const response =
    await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method:"POST",

        headers:{

          Authorization:
          `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

          "Content-Type":
          "application/json"

        },

        body:JSON.stringify({

          email:body.email,

          amount:
          body.amount * 100,

          currency:"USD",

          callback_url:
          `${body.callback_url}?uid=${body.uid}`,

          metadata:{
            uid:body.uid
          }

        })

      }
    );

    const data =
    await response.json();

    return{

      statusCode:200,

      body:JSON.stringify(data)

    };

  }catch(error){

    return{

      statusCode:500,

      body:JSON.stringify({

        error:error.message

      })

    };

  }

}