export async function handler(event){

  try{

    const body =
    JSON.parse(event.body);

    const text =
    body.text;

    const prompt = `

Analyze this conversation.

Return STRICT JSON ONLY:

{
  "mood":"",
  "situation":"",
  "strategy":"",
  "reply":""
}

Conversation:
${text}

`;

    const response =
    await fetch(

      "https://api.openai.com/v1/chat/completions",

      {

        method:"POST",

        headers:{

          "Content-Type":"application/json",

          Authorization:
          `Bearer ${process.env.OPENAI_API_KEY}`

        },

        body:JSON.stringify({

          model:"gpt-4o-mini",

          response_format:{
            type:"json_object"
          },

          messages:[

            {
              role:"system",
              content:prompt
            }

          ]

        })

      }

    );

    const data =
    await response.json();

    const content =
    data.choices?.[0]?.message?.content;

    const parsed =
    JSON.parse(content);

    return{

      statusCode:200,

      body:JSON.stringify(parsed)

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