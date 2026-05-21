import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUser = null;
let currentPersona = "Neutral";
let currentLanguage = "auto";

const welcomeUser = document.getElementById("welcomeUser");
const result = document.getElementById("result");
const loading = document.getElementById("loading");
const inputText = document.getElementById("inputText");

onAuthStateChanged(auth,(user)=>{
  if(user){
    currentUser = user;
    const firstName = user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "User";
    welcomeUser.innerHTML = `Hi, ${firstName}`;
    const signBtn = document.getElementById("signInBtn");
    if(signBtn) signBtn.style.display = "none";
  } else {
    welcomeUser.innerHTML = "Hi, Guest";
  }
});

// Personality and language update
window.updatePersona = function(){ currentPersona = document.getElementById("personaSelect").value; }
window.updateLanguage = function(){ currentLanguage = document.getElementById("languageSelect").value; }

// Navigation
window.openAuth = () => window.location.href = "auth.html";
window.openPricing = () => window.location.href = "pricing.html";
window.openHistory = () => window.location.href = "history.html";
window.openSettings = () => alert("Settings panel coming soon");
window.logoutUser = async () => { await signOut(auth); window.location.reload(); }
window.toggleMenu = () => {
  const panel = document.getElementById("menuPanel");
  panel.style.display = (panel.style.display==="block")?"none":"block";
}

// Save AI history
async function saveHistory(type,message,aiResult){
  if(!currentUser) return;
  try{
    await addDoc(collection(db,"history"),{
      userId:currentUser.uid,
      type,
      message,
      result:aiResult,
      createdAt:serverTimestamp()
    });
  }catch(e){console.log("History save failed", e);}
}

// Show results
function showLoading(){ loading.style.display = "block"; result.innerHTML=""; document.getElementById("shareWrapper").style.display="none"; }
function hideLoading(){ loading.style.display = "none"; }
function showResult(title,text,buttonText="Copy Result"){
  result.innerHTML = `<div class="result-card" id="resultCard">
      <div class="result-label">${title}</div>
      <div class="result-text">${text}</div>
      <button class="copy-btn" onclick="copyResult()">${buttonText}</button>
    </div>`;
  document.getElementById("shareWrapper").style.display="block";
}
window.copyResult = () => { navigator.clipboard.writeText(window.latestResult||""); alert("Copied successfully"); }

// AI Request Wrapper
async function aiRequest(instruction,historyType,title,buttonText){
  if(!inputText.value.trim()){ alert("Enter your message first"); return; }
  if(currentLanguage !== "en" && !checkPremiumFeature()) return;
  showLoading();
  try{
    const response = await fetch("/.netlify/functions/fix",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        text:inputText.value.trim(),
        instruction:`${instruction}\nPersonality: ${currentPersona}\nLanguage: ${currentLanguage}`
      })
    });
    const data = await response.json();
    hideLoading();
    showResult(title,data.result,buttonText);
    window.latestResult = data.result;
    await saveHistory(historyType,inputText.value.trim(),data.result);
  }catch(e){
    hideLoading();
    showResult("ERROR","AI request failed.");
  }
}

// Premium check
function checkPremiumFeature(){
  if(currentUser && !currentUser.isPremium){
    alert("This feature is premium. Upgrade to access multilingual output.");
    return false;
  }
  return true;
}

// AI functions
window.fixMessage = ()=>aiRequest(
  "Rewrite this message professionally, naturally, confidently, and clearly.",
  "Polished Message","AI POLISHED MESSAGE","Copy Message"
);
window.generateReply = (mode)=>aiRequest(
  `Generate a ${mode} reply. Make it emotionally intelligent.`,
  `${mode} Reply`,`${mode.toUpperCase()} REPLY`,"Copy Reply"
);
window.analyzeConversation = ()=>aiRequest(
  "Analyze this conversation deeply. Detect emotional tone, confidence, communication mistakes, and best response strategy.",
  "Conversation Analysis","CONVERSATION ANALYSIS","Copy Analysis"
);
window.shouldISendThis = ()=>aiRequest(
  "Analyze this message deeply. Tell me: 1. Should I send it? 2. Emotional tone 3. Confidence level 4. Weaknesses 5. Better alternative.",
  "Should I Send This","SHOULD I SEND THIS?","Copy Analysis"
);
window.detectToxicity = ()=>aiRequest(
  "Analyze this message deeply. Detect toxicity, manipulation, desperation, aggression, emotional weakness, scam behavior, and red flags. Then improve it.",
  "Toxicity Detector","TOXICITY DETECTOR","Copy Analysis"
);
window.analyzeTone = async function(){
  const text=inputText.value.trim();
  if(!text){ alert("Enter your message first"); return; }
  showLoading();
  try{
    const response = await fetch("/.netlify/functions/fix",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,text,text,text,text,text,text,text,text})});
    const data=await response.json(); hideLoading();
    // Mock scores
    const confidence=Math.floor(Math.random()*20)+75;
    const professionalism=Math.floor(Math.random()*15)+80;
    const aggression=Math.floor(Math.random()*30)+10;
    const flirting=Math.floor(Math.random()*70)+20;
    const trust=Math.floor(Math.random()*15)+82;
    const desperation=Math.floor(Math.random()*25)+8;
    result.innerHTML=`
      <div class="result-card" id="resultCard">
        <div class="result-label">AI TONE ANALYSIS</div>
        <div class="result-text">${data.result}</div>
        <div class="score-grid">
          ${createScoreCard("Confidence",confidence)}
          ${createScoreCard("Professionalism",professionalism)}
          ${createScoreCard("Aggression",aggression)}
          ${createScoreCard("Flirting",flirting)}
          ${createScoreCard("Trust",trust)}
          ${createScoreCard("Desperation",desperation)}
        </div>
        <button class="copy-btn" onclick="copyResult()">Copy Analysis</button>
      </div>`;
    window.latestResult=data.result;
    await saveHistory("AI Tone Meter",text,data.result);
  }catch(e){ hideLoading(); showResult("ERROR","Tone analysis failed."); }
};

// Tone meter helper
function createScoreCard(title,score){
  return `<div class="score-card">
      <div class="score-title">${title}</div>
      <div class="score-number">${score}%</div>
      <div class="score-bar"><div class="score-fill" style="width:${score}%"></div></div>
    </div>`;
}

// Shareable result card
window.shareResult=function(){
  const resultCard=document.getElementById("resultCard");
  if(!resultCard){ alert("No result to share!"); return; }
  const canvas=document.createElement("canvas");
  const ctx=canvas.getContext("2d");
  const width=900, height=resultCard.offsetHeight+250;
  canvas.width=width; canvas.height=height;
  ctx.fillStyle="#111827"; ctx.fillRect(0,0,width,height);
  ctx.fillStyle="#22c55e"; ctx.font="bold 32px Inter"; ctx.fillText("VoxFix AI Result",30,50);
  ctx.fillStyle="#ffffff"; ctx.font="18px Inter";
  const text=resultCard.querySelector(".result-text").innerText;
  wrapText(ctx,text,30,90,width-60,26);
  const scoreCards=resultCard.querySelectorAll(".score-card");
  if(scoreCards.length>0){
    let startY=120 + (text.split(' ').length*20);
    startY=Math.max(startY,180);
    scoreCards.forEach(card=>{
      const title=card.querySelector(".score-title").innerText;
      const score=parseInt(card.querySelector(".score-number").innerText.replace('%',''));
      const barWidth=400;
      ctx.fillStyle="#94a3b8"; ctx.font="16px Inter"; ctx.fillText(title,40,startY);
      ctx.fillStyle="#ffffff"; ctx.font="bold 22px Inter"; ctx.fillText(score+"%",500,startY);
      ctx.fillStyle="rgba(255,255,255,0.1)"; ctx.fillRect(40,startY+10,barWidth,12);
      ctx.fillStyle="#22c55e"; ctx.fillRect(40,startY+10,(barWidth*score/100),12);
      startY+=40;
    });
  }
  ctx.fillStyle="#94a3b8"; ctx.font="14px Inter"; ctx.fillText("Powered by VoxFix AI",30,height-20);
  const link=document.createElement("a"); link.download="VoxFix_Result.png"; link.href=canvas.toDataURL("image/png"); link.click();
}

// Helper text wrap
function wrapText(ctx,text,x,y,maxWidth,lineHeight){
  const words=text.split(' '); let line='';
  for(let n=0;n<words.length;n++){
    const testLine=line+words[n]+' ';
    const metrics=ctx.measureText(testLine);
    if(metrics.width>maxWidth&&n>0){ ctx.fillText(line,x,y); line=words[n]+' '; y+=lineHeight; } else { line=testLine; }
  }
  ctx.fillText(line,x,y);
}