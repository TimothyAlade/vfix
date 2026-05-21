export async function handler(event){

  try{

    const body =
    JSON.parse(event.body);

    const audio =
    body.audio;

    const response =
    await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {

        method:"POST",

        headers:{

          Authorization:
          `Bearer ${process.env.OPENAI_API_KEY}`

        },

        body:createFormData(audio)

      }
    );

    const data =
    await response.json();

    return{

      statusCode:200,

      body:JSON.stringify({

        text:data.text || ""

      })

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

function createFormData(base64Audio){

  const formData =
  new FormData();

  const byteCharacters =
  atob(base64Audio);

  const byteNumbers =
  new Array(byteCharacters.length);

  for(let i = 0; i < byteCharacters.length; i++){

    byteNumbers[i] =
    byteCharacters.charCodeAt(i);

  }

  const byteArray =
  new Uint8Array(byteNumbers);

  const blob =
  new Blob(
    [byteArray],
    { type:"audio/mp3" }
  );

  formData.append(
    "file",
    blob,
    "voice.mp3"
  );

  formData.append(
    "model",
    "whisper-1"
  );

  return formData;

}