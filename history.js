import {
  auth,
  db
}
from "./firebase.js";

import {

  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {

  onAuthStateChanged

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const historyList =
document.getElementById(
  "historyList"
);

window.goHome = function(){

  window.location.href =
  "index.html";

}

onAuthStateChanged(auth,
async(user)=>{

  if(!user){

    window.location.href =
    "auth.html";

    return;

  }

  try{

    const q = query(

      collection(db,"history"),

      where(
        "userId",
        "==",
        user.uid
      ),

      orderBy(
        "createdAt",
        "desc"
      )

    );

    const snapshot =
    await getDocs(q);

    if(snapshot.empty){

      historyList.innerHTML = `

        <div class="empty-history">

          No saved history yet.

        </div>

      `;

      return;

    }

    historyList.innerHTML = "";

    snapshot.forEach((doc)=>{

      const data = doc.data();

      historyList.innerHTML += `

        <div class="history-card">

          <div class="history-type">

            ${data.type}

          </div>

          <div class="history-message">

            ${data.message}

          </div>

          <div class="history-result">

            ${data.result}

          </div>

        </div>

      `;

    });

  }catch(error){

    historyList.innerHTML = `

      <div class="empty-history">

        Failed to load history.

      </div>

    `;

  }

});