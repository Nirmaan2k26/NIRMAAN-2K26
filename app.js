const PLAYER_KEY="aa_players_fixed_excel_v2",STATE_KEY="aa_state_fixed_excel_v2";
let players=JSON.parse(localStorage.getItem(PLAYER_KEY)||"[]");
let state=JSON.parse(localStorage.getItem(STATE_KEY)||'{"teams":[],"sold":[],"auctionComplete":false,"resultVisibleToTeams":false}');
state.auctionComplete=Boolean(state.auctionComplete); state.resultVisibleToTeams=Boolean(state.resultVisibleToTeams);
const $=id=>document.getElementById(id), money=n=>"₹"+Number(n||0).toLocaleString("en-IN");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const cats=["Batsman","Bowler","All Rounder","WK"];

function save(){
 localStorage.setItem(PLAYER_KEY,JSON.stringify(players));
 localStorage.setItem(STATE_KEY,JSON.stringify(state));

 try{
   if(window.NIRMAANAuctionChannel){
     window.NIRMAANAuctionChannel.postMessage({
       type:"state-updated"
     });
   }
 }catch(_){}
}

const NIRMAAN_AUCTION_CHANNEL="nirmaan-2k26-auction";

try{
 window.NIRMAANAuctionChannel=new BroadcastChannel(NIRMAAN_AUCTION_CHANNEL);

 window.NIRMAANAuctionChannel.onmessage=event=>{
   if(event?.data?.type==="state-updated"){

     players=JSON.parse(
       localStorage.getItem(PLAYER_KEY)||"[]"
     );

     state=JSON.parse(
       localStorage.getItem(STATE_KEY)||
       '{"teams":[],"sold":[],"auctionComplete":false,"resultVisibleToTeams":false}'
     );

     state.auctionComplete=
       Boolean(state.auctionComplete);

     state.resultVisibleToTeams=
       Boolean(state.resultVisibleToTeams);

     render();
   }
 };

}catch(_){}

function setMsg(id,text,cls){
 const e=$(id);
 e.className="msg "+(cls||"");
 e.innerHTML=text
}

function render(){

 const playerDatalist=
   document.getElementById("playerList")||
   document.getElementById("playerOptions")||
   document.getElementById("playerNameList");

 if(playerDatalist){

   const availablePlayers=
     players.filter(
       p=>!state.sold.some(
         s=>String(s.playerId)===String(p.id)
       )
     );

   playerDatalist.innerHTML=
     availablePlayers
       .map(
         p=>`<option value="${esc(p.name)}"></option>`
       )
       .join("");
 }


 /*
    All teams remain visible in Auction Entry.

    Full teams are shown as:
    TEAM NAME (4/4)

    The SOLD validation below still prevents
    bidding on completed teams.
 */

 const activeTeams=
   state.teams.filter(
     t=>Number(t.budget)>0
   );

 const auctionTeams=state.teams;

const auctionTeamOptions =
  auctionTeams.map(
    (t,index)=>{

      const srNo =
        t.srNo ||
        index + 1;

      return `
        <option value="${esc(t.name)}">
          ${esc(srNo)} — ${esc(t.name)}
          (${t.players.length}/4)
        </option>
      `;
    }
  ).join("");

$("auctionTeam").innerHTML =
  auctionTeamOptions ||
  '<option value="">No teams</option>';
 

 /*
    Keep searchable dropdown display synchronized
    after render() rebuilds the original select.
 */

 if($("auctionTeam")){
   $("auctionTeam").dispatchEvent(
     new Event("change",{bubbles:true})
   );
 }


 $("teamTable").querySelector("tbody").innerHTML=
   state.teams.length

     ? state.teams
         .map((t,i)=>{

           const complete=
             t.players.length>=4 ||
             Number(t.budget)<=0;

           return `<tr>

             <td>${esc(t.name)}</td>

             <td>${money(t.startBudget)}</td>

             <td>${money(t.budget)}</td>

             <td>${t.players.length}</td>

             <td>${money(t.spent)}</td>

             <td>
               ${Number(t.points)
                 .toLocaleString("en-IN")}
             </td>

             <td>
               ${
                 complete
                   ? "<b class='ok'>Complete</b>"
                   : "<span class='muted'>Active</span>"
               }
             </td>

             <td>

               <button
                 type="button"
                 class="editBtn teamAction"
                 onclick="window.openTeamEditor(${i}); return false;"
               >
                 ✏️ Edit
               </button>

               <button
                 type="button"
                 class="deleteBtn teamAction"
                 onclick="window.deleteTeam(${i}); return false;"
               >
                 🗑️ Delete
               </button>

             </td>

           </tr>`;

         })
         .join("")

     : '<tr><td colspan="8">No teams added.</td></tr>';


 $("soldTable").querySelector("tbody").innerHTML=
   state.sold.length

     ? state.sold
         .map(
           (s,i)=>
             `<tr>

               <td>${i+1}</td>

               <td>${esc(s.name)}</td>

               <td>${esc(s.team)}</td>

               <td>${money(s.bid)}</td>

               <td>${s.points}</td>

               <td>${esc(s.category)}</td>

               <td>

                 <button
                   type="button"
                   class="editBtn"
                   data-edit-sold="${i}"
                 >
                   ✏️ Edit
                 </button>

                 <button
                   type="button"
                   class="deleteBtn"
                   data-delete-sold="${i}"
                 >
                   🗑️ Delete
                 </button>

               </td>

             </tr>`
         )
         .join("")

     : '<tr><td colspan="7">No sold players.</td></tr>';


 const resultBtn=$("toggleTeamResult");

 if(resultBtn){

   resultBtn.textContent=
     state.resultVisibleToTeams
       ? "🙈 Hide Result from Teams"
       : "👁️ Show Result to Teams";

   resultBtn.disabled=
     !state.auctionComplete;
 }


 const statusBox=$("auctionStatus");

 if(statusBox){

   statusBox.innerHTML=
     state.auctionComplete

       ? "🏁 <b>Auction Complete.</b> Final ranking is published below."

       : activeTeams.length

         ? "🟢 <b>Auction is active.</b> Teams remain visible in Auction Entry; completed teams cannot be selected for bidding."

         : "⏳ <b>No active teams.</b> All teams are complete or have no budget remaining.";
 }
}


function refreshPlayerDropdown(query=""){

 const box=
   document.getElementById("playerDropdown");

 if(!box)return;

 const q=
   String(query||"")
     .trim()
     .toLowerCase();

 const availablePlayers=
   players.filter(
     p=>!state.sold.some(
       s=>String(s.playerId)===String(p.id)
     )
   );

 const matches=
   q

     ? availablePlayers
         .filter(
           p=>
             String(p.name||"")
               .toLowerCase()
               .includes(q)
         )
         .slice(0,50)

     : availablePlayers.slice(0,50);


 if(!matches.length){

   box.innerHTML="";

   box.classList.remove("show");

   return;
 }


 box.innerHTML=
   matches
     .map(
       p=>
         `<button
            type="button"
            class="playerDropItem"
            data-player-id="${p.id}"
          >
            <span class="playerDropSr">
              ${esc(p.srNo||"")}
            </span>
            ${esc(p.name)}
          </button>`
     )
     .join("");


 box.classList.add("show");
}


function choosePlayer(id){

 const p=
   players.find(
     x=>
       String(x.id)===String(id) &&
       !state.sold.some(
         s=>String(s.playerId)===String(x.id)
       )
   );

 if(!p)return;


 const input=
   document.getElementById("playerName");

 input.value=p.name;


 const box=
   document.getElementById("playerDropdown");

 if(box){

   box.innerHTML="";

   box.classList.remove("show");

 }


 input.dispatchEvent(
   new Event("input",{bubbles:true})
 );
}


const getPlayer=n=>{

 const q=
   String(n??"")
     .trim()
     .toLowerCase();

 return q

   ? players.find(
       p=>
         p.name.toLowerCase()===q &&
         !state.sold.some(
           s=>String(s.playerId)===String(p.id)
         )
     )

   : null;
};


$("playerName").oninput=()=>{

 const value=
   $("playerName").value.trim();

 const p=
   getPlayer(value);

 const b=
   $("playerInfo");


 refreshPlayerDropdown(value);


 if(!p){

   if(value){

     b.classList.remove("hidden");

     b.innerHTML=
       `<span style="color:#b91c1c">
         <b>⚠️ Player not selected.</b>
         Select a player from the dropdown.
       </span>`;

   }else{

     b.classList.add("hidden");

   }

   return;
 }


 b.classList.remove("hidden");

 b.innerHTML=
   `<b>${esc(p.name)}</b>
    · Base ${money(p.basePrice)}
    · ${esc(p.category)}
    · ${p.points} Points
    · ${esc(p.iplTeam||"")}`;
};


$("addTeam").onclick=()=>{

 const name=
   $("teamName").value.trim();

 const budget=
   Number($("teamBudget").value);

 const pin=
   $("teamPin").value.trim();


 if(!name)
   return setMsg(
     "teamMsg",
     "Team Name is required.",
     "err"
   );


 if(!budget||budget<=0)
   return setMsg(
     "teamMsg",
     "Starting Budget must be a positive number.",
     "err"
   );


 if(!pin)
   return setMsg(
     "teamMsg",
     "Team PIN is required.",
     "err"
   );


 if(
   state.teams.some(
     t=>
       t.name.toLowerCase()===
       name.toLowerCase()
   )
 )
   return setMsg(
     "teamMsg",
     "This team already exists.",
     "err"
   );


 state.teams.push({
   name,
   startBudget:budget,
   budget,
   spent:0,
   points:0,
   players:[],
   pin
 });


 save();

 render();


 $("teamName").value="";
 $("teamBudget").value="";
 $("teamPin").value="";


 setMsg(
   "teamMsg",
   "Team added successfully.",
   "ok"
 );
};
/* =========================================================
   TEAM EXCEL TEMPLATE + IMPORT
   ========================================================= */

$("downloadTeamTemplate").onclick=()=>{

  const ws=
    XLSX.utils.aoa_to_sheet([
     [
  "SR NO",
  "Team Name",
  "Starting Budget",
  "Team PIN"
],
[
  1,
  "Example Team",
  10000000,
  "TEAM@01"
]
    ]);

  const wb=
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    "Teams"
  );

  XLSX.writeFile(
    wb,
    "Auction_Arena_Team_Template.xlsx"
  );
};


$("teamExcelFile").onchange=async e=>{

  const file=
    e.target.files[0];

  if(!file)
    return;

  try{

    const wb=
      XLSX.read(
        await file.arrayBuffer(),
        {type:"array"}
      );

    const sheetName=
      wb.SheetNames[0];

    if(!sheetName){

      return setMsg(
        "teamMsg",
        "❌ No worksheet found in Team Excel.",
        "err"
      );

    }

    const ws=
      wb.Sheets[sheetName];

    const rows=
      XLSX.utils.sheet_to_json(
        ws,
        {
          header:1,
          defval:""
        }
      );

    if(rows.length<2){

      return setMsg(
        "teamMsg",
        "❌ Team Excel has no team data.",
        "err"
      );

    }


    const norm=v=>
      String(v??"")
        .replace(/\u00a0/g," ")
        .replace(/\s+/g," ")
        .trim()
        .toLowerCase();


    const headers=
      rows[0].map(norm);

const srNoIndex =
  headers.indexOf("sr no");
   
    const teamNameIndex=
      headers.indexOf("team name");

    const budgetIndex=
      headers.indexOf("starting budget");

    const pinIndex=
      headers.indexOf("team pin");


    if(
      teamNameIndex<0 ||
      budgetIndex<0 ||
      pinIndex<0
    ){

      return setMsg(
        "teamMsg",
        "❌ Invalid Team Excel format. Required columns: Team Name, Starting Budget, Team PIN.",
        "err"
      );

    }


    const errors=[];
    const clean=[];
    const seen=new Map();


    rows
      .slice(1)
      .forEach((row,i)=>{

        const line=i+2;


        const name=
          String(
            row[teamNameIndex]??""
          )
          .replace(/\s+/g," ")
          .trim();


        const budgetRaw=
          String(
            row[budgetIndex]??""
          )
          .replace(/₹/g,"")
          .replace(/,/g,"")
          .trim();


        const pin=
          String(
            row[pinIndex]??""
          ).trim();


        /* Ignore completely blank rows */

        if(
          !name &&
          !budgetRaw &&
          !pin
        )
          return;


        /* Duplicate team inside Excel */

        const key=
          name.toLowerCase();


        if(!name){

          errors.push(
            `Row ${line}: Team Name is missing.`
          );

        }else if(
          seen.has(key)
        ){

          errors.push(
            `Row ${line}: Duplicate Team Name "${name}" in Excel.`
          );

        }else{

          seen.set(
            key,
            line
          );

        }


        /* Budget validation */

        const budget=
          Number(budgetRaw);


        if(!budgetRaw){

          errors.push(
            `Row ${line}: Starting Budget is missing.`
          );

        }else if(
          !Number.isFinite(budget) ||
          budget<=0
        ){

          errors.push(
            `Row ${line}: Starting Budget "${budgetRaw}" is invalid.`
          );

        }


        /* PIN validation */

        if(!pin){

          errors.push(
            `Row ${line}: Team PIN is missing.`
          );

        }


        clean.push({
  srNo:
    srNoIndex >= 0
      ? String(row[srNoIndex] ?? "").trim()
      : String(i + 1),

  name,
  budget,
  pin
});

       });
    /* Check duplicate with existing teams */

    clean.forEach(team=>{

      if(
        state.teams.some(
          t=>
            String(t.name)
              .trim()
              .toLowerCase()===
            team.name
              .trim()
              .toLowerCase()
        )
      ){

        errors.push(
          `Team "${team.name}" already exists.`
        );

      }

    });


    /* Do not change anything if errors exist */

    if(errors.length){

      return setMsg(
        "teamMsg",
        `<b>❌ Team Import stopped — ${errors.length} error${errors.length===1?"":"s"} found.</b>
        <div style="margin-top:8px">
          ${errors
            .map(
              e=>
                `<div style="margin:5px 0">
                  • ${esc(e)}
                </div>`
            )
            .join("")}
        </div>
        <div style="margin-top:10px">
          <b>No team data was changed.</b>
        </div>`,
        "err"
      );

    }


    /* Add validated teams */

    clean.forEach(team=>{

      state.teams.push({
srNo:
  team.srNo,
        name:
          team.name,

        startBudget:
          team.budget,

        budget:
          team.budget,

        spent:0,

        points:0,

        players:[],

        pin:
          team.pin

      });

    });


    save();

    render();


    $("teamExcelFile").value="";


    setMsg(
      "teamMsg",
      `✅ ${clean.length} team${clean.length===1?"":"s"} imported successfully from "${esc(sheetName)}".`,
      "ok"
    );


  }catch(err){

    setMsg(
      "teamMsg",
      `❌ Team Excel Read Error: ${esc(err.message||"Could not read file.")}`,
      "err"
    );

  }

};
/* =========================================================
   TEAM EXCEL - REMOVE & REPLACE
   ========================================================= */

$("replaceTeamExcel").onclick = () => {

  const teamFileInput =
    $("teamExcelFile");

  if(!teamFileInput){
    return setMsg(
      "teamMsg",
      "❌ Team Excel input not found.",
      "err"
    );
  }

  if(!state.teams.length){
    return setMsg(
      "teamMsg",
      "❌ No current teams found to replace.",
      "err"
    );
  }

  const ok =
    confirm(
      "⚠️ Replace Current Team Excel?\n\n" +
      "All current teams will be removed.\n\n" +
      "Player Excel and sold history will remain safe.\n\n" +
      "Continue?"
    );

  if(!ok)
    return;

  /* Remove old teams */

  state.teams = [];

  save();
  render();

  /* Clear file input */

  teamFileInput.value = "";

  setMsg(
    "teamMsg",
    "🗑️ Current teams removed. Select your new Team Excel file.",
    "ok"
  );

  /* Open Excel picker */

  setTimeout(() => {

    teamFileInput.click();

  }, 100);

};
/* =========================================================
   TEAM EXCEL - DOWNLOAD TEMPLATE
   ========================================================= */

$("downloadTeamTemplate").onclick=()=>{

  const ws =
    XLSX.utils.aoa_to_sheet([
      [
        "Team Name",
        "Starting Budget",
        "Team PIN"
      ],
      [
        "Example Team",
        10000000,
        "TEAM@01"
      ]
    ]);

  const wb =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    "Teams"
  );

  XLSX.writeFile(
    wb,
    "Auction_Arena_Team_Template.xlsx"
  );

};

/* =========================================================
   TEAM SEARCH
   Search by SR NO or Team Name
   ========================================================= */

const teamSearch =
  $("auctionTeamSearch");

const teamDropdown =
  $("auctionTeamDropdown");


function refreshTeamSearch(query=""){

  if(!teamSearch || !teamDropdown)
    return;

  const q =
    String(query || "")
      .trim()
      .toLowerCase();

  const teams =
    state.teams.filter(
      (t,index)=>{

        const srNo =
          String(t.srNo || index+1);

        const name =
          String(t.name || "");

        return !q ||
          srNo.includes(q) ||
          name.toLowerCase().includes(q);

      }
    );

  if(!teams.length){

    teamDropdown.innerHTML =
      `<div class="teamSearchEmpty">
        No team found
      </div>`;

    teamDropdown.classList.add("show");

    return;
  }


  teamDropdown.innerHTML =
    teams.map(
      (t,index)=>{

        const realIndex =
          state.teams.indexOf(t);

        const srNo =
          t.srNo || realIndex+1;

        return `
          <div
            class="teamSearchOption"
            data-team-index="${realIndex}"
          >
            <b>${esc(srNo)} — ${esc(t.name)}</b>
            <span>${t.players.length}/4</span>
          </div>
        `;

      }
    ).join("");


  teamDropdown.classList.add("show");

}


/* Search while typing */

teamSearch?.addEventListener(
  "input",
  function(){

    refreshTeamSearch(
      this.value
    );

  }
);


/* Select team */

teamDropdown?.addEventListener(
  "click",
  function(e){

    const option =
      e.target.closest(
        ".teamSearchOption"
      );

    if(!option)
      return;

    const index =
      Number(
        option.dataset.teamIndex
      );

    const team =
      state.teams[index];

    if(!team)
      return;

    teamSearch.value =
      `${team.srNo || index+1} — ${team.name}`;

    $("auctionTeam").value =
      team.name;

    teamDropdown.classList.remove(
      "show"
    );

  }
);


/* Open dropdown */

teamSearch?.addEventListener(
  "focus",
  function(){

    refreshTeamSearch(
      this.value
    );

  }
);


/* Close dropdown */

document.addEventListener(
  "click",
  function(e){

    if(
      teamSearch &&
      teamDropdown &&
      !teamSearch.contains(e.target) &&
      !teamDropdown.contains(e.target)
    ){

      teamDropdown.classList.remove(
        "show"
      );

    }

  }
);
$("sellPlayer").onclick=()=>{

 if(state.auctionComplete)
   return setMsg(
     "auctionMsg",
     "🏁 Auction is already complete.",
     "err"
   );


 const p=
   getPlayer(
     $("playerName").value
   );


 const selectedTeam=
   $("auctionTeam").value;


 /*
    The searchable dropdown now stores only
    the real team name in option.value.
 */

 const t=
   state.teams.find(
     x=>x.name===selectedTeam
   );


 const bid=
   Number($("bidPrice").value);


 if(!p)
   return setMsg(
     "auctionMsg",
     "Select a valid player.",
     "err"
   );


 if(!t)
   return setMsg(
     "auctionMsg",
     "No team is available. Add a team first.",
     "err"
   );


 /*
    IMPORTANT:
    Full team remains visible but cannot be used
    for another purchase.
 */

 if(
   t.players.length>=4 ||
   Number(t.budget)<=0
 )
   return setMsg(
     "auctionMsg",
     `❌ ${esc(t.name)} is complete and is no longer available for bidding.`,
     "err"
   );
const teamSoldPlayers = state.sold.filter(
  s => s.team === t.name
);

const categoryAlreadyTaken = teamSoldPlayers.some(
  s => String(s.category || "").trim() === String(p.category || "").trim()
);

if(categoryAlreadyTaken)
  return setMsg(
    "auctionMsg",
    `❌ ${esc(t.name)} already has a ${esc(p.category)}. Only one player from each category is allowed.`,
    "err"
  );

 if(
   state.sold.some(
     s=>String(s.playerId)===String(p.id)
   )
 )
   return setMsg(
     "auctionMsg",
     "Player already sold.",
     "err"
   );


 if(!bid||bid<p.basePrice)
   return setMsg(
     "auctionMsg",
     "Bid must be at least Base Price.",
     "err"
   );


 if(bid>t.budget)
   return setMsg(
     "auctionMsg",
     "Insufficient team budget.",
     "err"
   );


 t.budget-=bid;

 t.spent+=bid;

 t.points+=p.points;

 t.players.push(p.id);


 state.sold.push({
   playerId:p.id,
   name:p.name,
   team:t.name,
   bid,
   points:p.points,
   category:p.category
 });


 /*
    Save first so every connected tab can
    immediately read the new state.
 */

 save();

 render();


 $("playerName").value="";
 $("bidPrice").value="";

 $("playerInfo")
   .classList.add("hidden");


 const completedNow=
   t.players.length>=4 ||
   Number(t.budget)<=0;


 setMsg(
   "auctionMsg",

   completedNow

     ? `${esc(p.name)} SOLD to ${esc(t.name)} for ${money(bid)}. <b>${esc(t.name)} is now complete. It remains visible in the team list but cannot receive another player.</b>`

     : `${esc(p.name)} SOLD to ${esc(t.name)} for ${money(bid)}.`,

   "ok"
 );
};


$("completeAuction").onclick=()=>{

  if(!state.teams.length)
    return setMsg(
      "auctionMsg",
      "Add teams first.",
      "err"
    );


  /*
    FINAL WINNER RULES

    1. Exactly 4 players
    2. 1 Batsman
    3. 1 Bowler
    4. 1 WK
    5. 1 All Rounder
    6. Highest Total Points
    7. Same Points -> Higher Remaining Budget
    8. Same Budget -> Lower Total Spent
    9. Everything same -> Tie
  */


  const getTeamWinnerData = (team) => {

    const sold =
      state.sold.filter(
        s => s.team === team.name
      );


    const normalize = value =>
      String(value || "")
        .toLowerCase()
        .replace(/[\s_-]+/g,"")
        .trim();


    const hasCategory = (category, type) => {

      const c = normalize(category);


      if(type === "batsman")
        return (
          c.includes("batsman") ||
          c.includes("batter")
        );


      if(type === "bowler")
        return (
          c.includes("bowler") ||
          c.includes("bowling")
        );


      if(type === "wicketkeeper")
        return (
          c.includes("wicketkeeper") ||
          c.includes("keeper") ||
          c === "wk"
        );


      if(type === "allrounder")
        return (
          c.includes("allrounder") ||
          c.includes("allround")
        );


      return false;
    };


    const batsman =
      sold.some(
        s => hasCategory(s.category,"batsman")
      );


    const bowler =
      sold.some(
        s => hasCategory(s.category,"bowler")
      );


    const wicketkeeper =
      sold.some(
        s => hasCategory(s.category,"wicketkeeper")
      );


    const allRounder =
      sold.some(
        s => hasCategory(s.category,"allrounder")
      );


    const eligible =
      team.players.length === 4 &&
      batsman &&
      bowler &&
      wicketkeeper &&
      allRounder;


    return {

      eligible,

      totalPoints:
        Number(team.points || 0),

      remainingBudget:
        Number(team.budget || 0),

      totalSpent:
        Number(team.spent || 0)

    };

  };


  /*
    Calculate winner data
  */

  const winnerData = new Map();


  state.teams.forEach(team => {

    winnerData.set(
      team.name,
      getTeamWinnerData(team)
    );

  });


  /*
    FINAL RANKING
  */

  const ranking =
    [...state.teams].sort((a,b) => {

      const A =
        winnerData.get(a.name);

      const B =
        winnerData.get(b.name);


      /* 1. COMPLETE TEAM FIRST */

      if(A.eligible !== B.eligible){

        return A.eligible
          ? -1
          : 1;

      }


      /* 2. TOTAL POINTS */

      if(
        A.totalPoints !==
        B.totalPoints
      ){

        return (
          B.totalPoints -
          A.totalPoints
        );

      }


      /* 3. REMAINING BUDGET */

      if(
        A.remainingBudget !==
        B.remainingBudget
      ){

        return (
          B.remainingBudget -
          A.remainingBudget
        );

      }


      /* 4. LOWER TOTAL SPENT */

      if(
        A.totalSpent !==
        B.totalSpent
      ){

        return (
          A.totalSpent -
          B.totalSpent
        );

      }


      /* 5. EXACT TIE */

      return 0;

    });


  /*
    Mark auction complete
  */

  state.auctionComplete = true;

  state.resultVisibleToTeams = false;


  save();

  render();


  /*
    Find actual winner
  */

  const eligibleTeams =
    ranking.filter(
      team =>
        winnerData.get(team.name)?.eligible
    );


  let winnerText = "";


  if(!eligibleTeams.length){

    winnerText = `
      <div style="
        padding:14px;
        margin-bottom:14px;
        border-radius:10px;
        background:#fff7ed;
        border:1px solid #fdba74;
      ">
        ⚠️ <b>No eligible winner yet.</b><br>
        No team has completed all 4 required categories.
      </div>
    `;

  }else{

    const winner =
      eligibleTeams[0];

    const winnerInfo =
      winnerData.get(winner.name);


    winnerText = `
      <div style="
        padding:16px;
        margin-bottom:16px;
        border-radius:12px;
        background:#ecfdf5;
        border:2px solid #10b981;
      ">

        <div style="
          font-size:14px;
          font-weight:700;
          margin-bottom:5px;
        ">
          🏆 WINNER
        </div>

        <div style="
          font-size:24px;
          font-weight:900;
        ">
          ${esc(winner.name)}
        </div>

        <div style="
          margin-top:8px;
        ">
          ${winnerInfo.totalPoints.toLocaleString("en-IN")}
          Points
        </div>

      </div>
    `;

  }


  /*
    Final ranking display
  */

  $("winnerBox")
    .classList.remove("hidden");


  $("winnerBox").innerHTML =
    winnerText +

    "<h3>🏆 Final Ranking</h3>" +

    ranking
      .map((team,i) => {

        const info =
          winnerData.get(team.name);


        const status =
          info.eligible
            ? "✅ Eligible"
            : "❌ Incomplete";


        return `
          <div class="rank">

            <b>
              ${
                i < 3
                  ? ["🥇","🥈","🥉"][i]
                  : i + 1
              }
            </b>

            <b>
              ${esc(team.name)}
            </b>

            <span>
              ${Number(team.points || 0)
                .toLocaleString("en-IN")}
              Points
            </span>

            <span>
              ${status}
            </span>

          </div>
        `;

      })
      .join("");

};
$("toggleTeamResult").onclick=()=>{

 if(!state.auctionComplete)
   return setMsg(
     "auctionMsg",
     "Complete the auction first.",
     "err"
   );


 state.resultVisibleToTeams=
   !state.resultVisibleToTeams;


 save();

 render();


 setMsg(
   "auctionMsg",

   state.resultVisibleToTeams

     ? "👁️ Result is now visible to teams."

     : "🙈 Result is hidden from teams.",

   "ok"
 );
};


$("resumeAuction").onclick=()=>{

 state.auctionComplete=false;

 save();

 render();


 $("winnerBox")
   .classList.add("hidden");


 setMsg(
   "auctionMsg",
   "▶ Auction resumed.",
   "ok"
 );
};


$("resetAuction").onclick=()=>{

 if(
   confirm(
     "Reset teams and sold history? Player master Excel remains safe."
   )
 ){

   state={
     teams:[],
     sold:[],
     auctionComplete:false,
     resultVisibleToTeams:false
   };

   save();

   render();

   $("winnerBox")
     .classList.add("hidden");
 }
};


$("downloadTemplate").onclick=()=>{

 const ws=
   XLSX.utils.aoa_to_sheet([
     [
       "Player Name",
       "Base Price",
       "Category",
       "IPL Team",
       "Total Points"
     ],
     [
       "Example Player",
       "10K",
       "Batsman",
       "Example Team",
       500
     ]
   ]);


 const wb=
   XLSX.utils.book_new();


 XLSX.utils.book_append_sheet(
   wb,
   ws,
   "Players"
 );


 XLSX.writeFile(
   wb,
   "Auction_Arena_Player_Template.xlsx"
 );
};


function parseBasePrice(value){

 const s=
   String(value??"")
     .trim()
     .toUpperCase()
     .replace(/₹/g,"")
     .replace(/,/g,"");


 if(!s)
   return NaN;


 const m=
   s.match(
     /^(\d+(?:\.\d+)?)\s*([KL])$/
   );


 if(m){

   const n=
     Number(m[1]);

   return m[2]==="K"
     ? n*1000
     : n*100000;
 }


 const n=
   Number(s);


 return Number.isFinite(n)
   ? n
   : NaN;
}


function formatPriceInput(value){

 const n=
   parseBasePrice(value);

 return Number.isFinite(n)
   ? n
   : NaN;
}


function showImportErrors(errors){

 setMsg(
   "importMsg",

   `<b>
      ❌ Import stopped —
      ${errors.length}
      error${errors.length===1?"":"s"}
      found.
    </b>

    <div style="margin-top:8px">

      ${errors
        .map(
          e=>
            `<div style="margin:5px 0">
              • ${esc(e)}
            </div>`
        )
        .join("")}

    </div>

    <div style="margin-top:10px">
      <b>
        No data was changed.
      </b>
      Fix these errors and upload again.
    </div>`,

   "err"
 );
}


$("replaceExcel").onclick=()=>{

 if(!players.length){

   return setMsg(
     "importMsg",
     "No current player Excel data is loaded.",
     "err"
   );
 }


 const ok=
   confirm(
     "⚠️ Replace Current Player Excel?\n\n"+
     "The current player list will be removed and the next Excel you upload will become the new player list.\n\n"+
     "Teams, budgets and auction history will NOT be deleted.\n\n"+
     "Continue?"
   );


 if(!ok)
   return;


 players=[];

 localStorage.removeItem(
   PLAYER_KEY
 );


 render();


 $("playerName").value="";
 $("bidPrice").value="";

 $("playerInfo")
   .classList.add("hidden");


 $("excelFile").value="";


 setMsg(
   "importMsg",

   "🗑️ Current player data removed. Upload your new Excel now. Teams and auction history are still safe.",

   "ok"
 );
};


$("excelFile").onchange=async e=>{

 const file=
   e.target.files[0];

 if(!file)
   return;


 try{

   const wb=
     XLSX.read(
       await file.arrayBuffer(),
       {type:"array"}
     );


   const errors=[];


   const norm=
     v=>
       String(v??"")
         .replace(/\u00a0/g," ")
         .replace(/\s+/g," ")
         .trim()
         .toLowerCase();


   let rows=null,
       selectedName="",
       map=null,
       formatLabel="";


   for(
     const sheetName of wb.SheetNames
   ){

     const candidate=
       XLSX.utils.sheet_to_json(
         wb.Sheets[sheetName],
         {
           header:1,
           defval:""
         }
       );


     if(!candidate.length)
       continue;


     const h=
       candidate[0].map(norm);


     const idx={

       sr:
         h.findIndex(
           x=>
             [
               "sr no",
               "sr. no",
               "sr.no",
               "serial no",
               "serial number",
               "sr number"
             ].includes(x)
         ),

       player:
         h.indexOf("player name"),

       base:
         h.indexOf("base price"),

       category:
         h.indexOf("category"),

       ipl:
         h.indexOf("ipl team"),

       points:
         h.indexOf("total points"),

       pdfPoints:
         h.indexOf("pdf total points")
     };


     if(
       idx.player>=0 &&
       idx.base>=0 &&
       idx.category>=0 &&
       idx.points>=0
     ){

       rows=candidate;

       selectedName=
         sheetName;

       map=idx;

       formatLabel=
         "Fixed Player Template";

       break;
     }


     if(
       idx.player>=0 &&
       idx.base>=0 &&
       idx.category>=0 &&
       idx.pdfPoints>=0
     ){

       rows=candidate;

       selectedName=
         sheetName;

       map={
         ...idx,
         points:idx.pdfPoints
       };

       formatLabel=
         "Existing Player Database";

       break;
     }
   }


   if(!rows){

     return showImportErrors([

       `Player sheet not found. Available sheets: ${wb.SheetNames.join(", ")}.`,

       "Required fields: Player Name, Base Price, Category and Total Points (or PDF Total Points).",

       "Use the Download Excel Template for the new fixed format."

     ]);
   }


   const clean=[];

   const seen=new Map();


   rows
     .slice(1)
     .forEach((r,i)=>{

       const line=i+2;


       const name=
         String(
           r[map.player]??""
         )
         .replace(/\s+/g," ")
         .trim();


       const baseRaw=
         String(
           r[map.base]??""
         )
         .replace(/\s+/g," ")
         .trim();


       let category=
         String(
           r[map.category]??""
         )
         .replace(/\s+/g," ")
         .trim();


       const ipl=
         map.ipl>=0

           ? String(
               r[map.ipl]??""
             )
             .replace(/\s+/g," ")
             .trim()

           : "";


       const ptsRaw=
         String(
           r[map.points]??""
         )
         .replace(/\s+/g," ")
         .trim();


       if(
         !name &&
         !baseRaw &&
         !category &&
         !ipl &&
         !ptsRaw
       )
         return;


       const base=
         parseBasePrice(
           r[map.base]
         );


       const pts=
         Number(
           r[map.points]
         );


       const aliases={

         "all-rounder":
           "All Rounder",

         "all rounder":
           "All Rounder",

         "wicket-keeper":
           "WK",

         "wicket keeper":
           "WK",

         "wicketkeeper":
           "WK",

         "batsman":
           "Batsman",

         "bowler":
           "Bowler",

         "wk":
           "WK"
       };


       if(
         aliases[
           category.toLowerCase()
         ]
       )
         category=
           aliases[
             category.toLowerCase()
           ];


       const key=
         name.toLowerCase();


       if(
         name &&
         seen.has(key)
       ){

         errors.push(
           `Row ${line}: Duplicate Player Name "${name}" (already in row ${seen.get(key)}).`
         );

       }else if(name){

         seen.set(
           key,
           line
         );
       }


       if(!name)
         errors.push(
           `Row ${line}: Player Name is missing.`
         );


       if(!baseRaw){

         errors.push(
           `Row ${line}: Base Price is missing.`
         );

       }else if(
         !Number.isFinite(base) ||
         base<=0
       ){

         errors.push(
           `Row ${line}: Base Price "${baseRaw}" is invalid. Use 10K, 50K, 1L, 1.5L, etc.`
         );
       }


       if(!category){

         errors.push(
           `Row ${line}: Category is missing.`
         );

       }else if(
         !cats.includes(category)
       ){

         errors.push(
           `Row ${line}: Category "${category}" is invalid. Use Batsman, Bowler, All Rounder or WK.`
         );
       }


       if(!ptsRaw){

         errors.push(
           `Row ${line}: Total Points is missing.`
         );

       }else if(
         !Number.isFinite(pts) ||
         pts<0
       ){

         errors.push(
           `Row ${line}: Total Points "${ptsRaw}" is invalid. Enter 0 or more.`
         );
       }


       const excelSr=
         map.sr>=0
           ? String(
               r[map.sr]??""
             ).trim()
           : "";


       const srNo=
         excelSr ||
         String(clean.length+1);


       clean.push({
         srNo,
         name,
         basePrice:base,
         category,
         iplTeam:ipl,
         points:pts
       });

     });


   if(errors.length)
     return showImportErrors(errors);


   /*
      Replace the entire player master only
      after ALL validation passes.
   */

   const oldCount=
     players.length;


   players=
     clean.map(
       (p,i)=>({
         ...p,
         id:i+1,
         srNo:p.srNo||String(i+1)
       })
     );


   save();

   render();


   setMsg(
     "importMsg",

     `<b>✅ Import successful.</b><br>
      Replaced ${oldCount} old players with ${players.length} players from "${esc(selectedName)}" (${esc(formatLabel)}).<br>
      Player search refreshed: ${players.length} players available.`,

     "ok"
   );


 }catch(err){

   showImportErrors([

     `Excel Read Error: ${err.message||"Could not read file."}`,

     "Use the .xlsx template downloaded from this website."

   ]);

 }

};


render();


document.addEventListener(
  "focusin",
  e=>{

    if(
      e.target &&
      e.target.id==="playerName"
    )
      refreshPlayerDropdown(
        e.target.value
      );

  }
);


document.addEventListener(
  "click",
  e=>{

    const item=
      e.target.closest &&
      e.target.closest(
        ".playerDropItem"
      );


    if(item){

      e.preventDefault();

      choosePlayer(
        item.dataset.playerId
      );

      return;
    }


    if(
      !e.target.closest?.("#playerName") &&
      !e.target.closest?.("#playerDropdown")
    ){

      const box=
        document.getElementById(
          "playerDropdown"
        );

      if(box){

        box.classList.remove(
          "show"
        );

        box.innerHTML="";
      }
    }

  }
);


/* =========================================================
   SOLD PLAYER EDIT
   ========================================================= */

function openSoldEdit(index){

 const s=
   state.sold[index];

 if(!s)
   return;


 const modal=
   document.getElementById(
     "editSoldModal"
   );


 document.getElementById(
   "editSoldId"
 ).value=index;


 const playerSel=
   document.getElementById(
     "editSoldPlayer"
   );


 playerSel.innerHTML=
   players
     .map(
       p=>
         `<option value="${esc(p.name)}">
           ${esc(p.srNo||"")}.
           ${esc(p.name)}
         </option>`
     )
     .join("");


 playerSel.value=
   s.name||"";


 const teamSel=
   document.getElementById(
     "editSoldTeam"
   );


 teamSel.innerHTML=
   state.teams
     .map(
       t=>
         `<option value="${esc(t.name)}">
           ${esc(t.name)}
         </option>`
     )
     .join("");


 teamSel.value=
   s.team||"";


 document.getElementById(
   "editSoldBid"
 ).value=
   Number(s.bid||0);


 document.getElementById(
   "editSoldMsg"
 ).textContent="";


 modal.classList.remove(
   "hidden"
 );
}


function closeSoldEdit(){

 document.getElementById(
   "editSoldModal"
 )?.classList.add(
   "hidden"
 );

}


function syncAuctionFromSoldHistory(){

 state.teams.forEach(
   t=>{

     t.pin=t.pin||"";

     t.players=[];

     t.spent=0;

     t.budget=
       Number(
         t.startBudget||0
       );

     t.points=0;

   }
 );


 state.sold.forEach(
   s=>{

     const t=
       state.teams.find(
         x=>x.name===s.team
       );

     if(!t)
       return;


     const bid=
       Number(s.bid||0);


     t.players.push(
       s.name
     );


     t.spent+=bid;


     t.budget=
       Number(t.startBudget||0)-
       t.spent;


     t.points+=
       Number(s.points||0);

   }
 );


 players.forEach(
   p=>{

     const sold=
       state.sold.find(
         s=>s.name===p.name
       );


     p.status=
       sold
         ? "Sold"
         : "Available";


     p.soldTeam=
       sold
         ? sold.team
         : "";


     p.soldPrice=
       sold
         ? Number(sold.bid||0)
         : 0;

   }
 );


 save();

 render();
}


function recalcAfterSoldEdit(){

 syncAuctionFromSoldHistory();

}


document.addEventListener(
  "click",
  e=>{

    const b=
      e.target.closest &&
      e.target.closest(
        "[data-edit-sold]"
      );


    if(b){

      e.preventDefault();

      openSoldEdit(
        Number(
          b.dataset.editSold
        )
      );
    }

  }
);


document.getElementById(
  "cancelSoldEdit"
).addEventListener(
  "click",
  closeSoldEdit
);


document.getElementById(
  "saveSoldEdit"
).addEventListener(
  "click",
  function(){

    const msg=
      document.getElementById(
        "editSoldMsg"
      );


    const index=
      Number(
        document.getElementById(
          "editSoldId"
        ).value
      );


    const old=
      state.sold[index];


    if(!old){

      msg.textContent=
        "Sold entry not found.";

      return;
    }


    const playerName=
      document.getElementById(
        "editSoldPlayer"
      ).value;


    const team=
      document.getElementById(
        "editSoldTeam"
      ).value;


    const bid=
      Number(
        document.getElementById(
          "editSoldBid"
        ).value
      );


    const selectedPlayer=
      players.find(
        p=>p.name===playerName
      );


    if(!selectedPlayer){

      msg.textContent=
        "Select a valid player.";

      return;
    }


    if(!team){

      msg.textContent=
        "Select a team.";

      return;
    }


    if(
      !Number.isFinite(bid) ||
      bid<=0
    ){

      msg.textContent=
        "Enter a valid bid price.";

      return;
    }


    if(
      state.sold.some(
        (x,i)=>
          i!==index &&
          String(x.playerId)===
          String(selectedPlayer.id)
      )
    ){

      msg.textContent=
        "This player is already sold.";

      return;
    }


    if(
      state.sold.filter(
        (x,i)=>
          i!==index &&
          x.team===team
      ).length>=4
    ){

      msg.textContent=
        "This team already has 4 players.";

      return;
    }

const categoryAlreadyTaken =
  state.sold.some(
    (x,i)=>
      i!==index &&
      x.team===team &&
      String(x.category || "").trim() ===
      String(selectedPlayer.category || "").trim()
  );

if(categoryAlreadyTaken){

  msg.textContent =
    `❌ ${team} already has a ${selectedPlayer.category}. ` +
    `Only one player from each category is allowed.`;

  return;
}
    /*
       Update the sold record completely,
       including player identity.
    */

    old.playerId=
      selectedPlayer.id;

    old.name=
      selectedPlayer.name;

    old.team=
      team;

    old.bid=
      bid;

    old.points=
      Number(
        selectedPlayer.points||0
      );

    old.category=
      selectedPlayer.category||"";


    /*
       Rebuild every team's totals
       from the edited sold history.
    */

    state.teams.forEach(
      t=>{

        t.players=[];

        t.spent=0;

        t.budget=
          Number(
            t.startBudget||0
          );

        t.points=0;

      }
    );


    state.sold.forEach(
      s=>{

        const t=
          state.teams.find(
            x=>x.name===s.team
          );


        if(!t)
          return;


        t.players.push(
          s.playerId ||
          s.name
        );


        t.spent+=
          Number(
            s.bid||0
          );


        t.budget=
          Number(
            t.startBudget||0
          )-
          t.spent;


        t.points+=
          Number(
            s.points||0
          );

      }
    );


    /*
       Rebuild player sold status from
       player ID, so the edit persists correctly.
    */

    players.forEach(
      p=>{

        const sold=
          state.sold.find(
            s=>
              String(s.playerId)===
              String(p.id)
          );


        p.status=
          sold
            ? "Sold"
            : "Available";


        p.soldTeam=
          sold
            ? sold.team
            : "";


        p.soldPrice=
          sold
            ? Number(sold.bid||0)
            : 0;

      }
    );


    save();

    render();


    msg.textContent=
      "✅ Changes saved successfully.";


    setTimeout(
      function(){
        closeSoldEdit();
      },
      500
    );

  }
);


function deleteSoldPlayer(index){

 const s=
   state.sold[index];

 if(!s)
   return;


 const ok=
   window.confirm(
     `Delete sold entry for "${s.name}"? This will also remove the player from that team's summary, budget, points and player count.`
   );


 if(!ok)
   return;


 state.sold.splice(
   index,
   1
 );


 syncAuctionFromSoldHistory();
}


document.addEventListener(
  "click",
  e=>{

    const b=
      e.target.closest &&
      e.target.closest(
        "[data-delete-sold]"
      );


    if(b){

      e.preventDefault();

      deleteSoldPlayer(
        Number(
          b.dataset.deleteSold
        )
      );

    }

  }
);


document.getElementById(
  "closeEditX"
).addEventListener(
  "click",
  function(){

    closeSoldEdit();

  }
);


/* =========================================================
   TEAM EDIT / DELETE
   ========================================================= */

window.openTeamEditor=function(index){

 const t=
   state.teams[
     Number(index)
   ];


 const editor=
   document.getElementById(
     "teamEditor"
   );


 if(!t||!editor)
   return;


 const select=
   document.getElementById(
     "editTeamSelect"
   );


 select.innerHTML=
   state.teams
     .map(
       (team,i)=>
         `<option value="${i}">
           ${esc(team.name)}
         </option>`
     )
     .join("");


 select.value=
   String(index);


 document.getElementById(
   "editTeamName"
 ).value=
   t.name||"";


 document.getElementById(
   "editTeamBudget"
 ).value=
   Number(
     t.startBudget||0
   );


 document.getElementById(
   "editTeamPin"
 ).value=
   t.pin||"";


 document.getElementById(
   "editTeamPin"
 ).type=
   "password";


 document.getElementById(
   "editPinShow"
 ).textContent=
   "👁️ Show";


 document.getElementById(
   "editTeamMsg"
 ).textContent="";


 editor.style.display=
   "flex";


 editor.style.zIndex=
   "99999";
};


window.changeTeamEditor=function(index){

 const t=
   state.teams[
     Number(index)
   ];


 if(!t)
   return;


 document.getElementById(
   "editTeamName"
 ).value=
   t.name||"";


 document.getElementById(
   "editTeamBudget"
 ).value=
   Number(
     t.startBudget||0
   );


 document.getElementById(
   "editTeamPin"
 ).value=
   t.pin||"";


 document.getElementById(
   "editTeamPin"
 ).type=
   "password";


 document.getElementById(
   "editPinShow"
 ).textContent=
   "👁️ Show";


 document.getElementById(
   "editTeamMsg"
 ).textContent="";
};


window.toggleTeamPin=function(){

 const pin=
   document.getElementById(
     "editTeamPin"
   );


 const btn=
   document.getElementById(
     "editPinShow"
   );


 pin.type=
   pin.type==="password"
     ? "text"
     : "password";


 btn.textContent=
   pin.type==="password"
     ? "👁️ Show"
     : "🙈 Hide";
};


window.closeTeamEditor=function(){

 const editor=
   document.getElementById(
     "teamEditor"
   );


 if(editor)
   editor.style.display=
     "none";

};


window.saveTeamEditor=function(){

 const select=
   document.getElementById(
     "editTeamSelect"
   );


 const msg=
   document.getElementById(
     "editTeamMsg"
   );


 const index=
   Number(
     select.value
   );


 const t=
   state.teams[index];


 if(!t){

   msg.textContent=
     "Team not found.";

   return;
 }


 const oldName=
   t.name;


 const newName=
   document.getElementById(
     "editTeamName"
   ).value.trim();


 const newBudget=
   Number(
     String(
       document.getElementById(
         "editTeamBudget"
       ).value
     )
     .replace(/,/g,"")
   );


 const newPin=
   document.getElementById(
     "editTeamPin"
   ).value.trim();


 if(!newName){

   msg.textContent=
     "Team Name is required.";

   return;
 }


 if(
   !Number.isFinite(newBudget) ||
   newBudget<=0
 ){

   msg.textContent=
     "Starting Budget must be a positive number.";

   return;
 }


 if(!newPin){

   msg.textContent=
     "Team PIN is required.";

   return;
 }


 if(
   state.teams.some(
     (x,i)=>
       i!==index &&
       String(x.name)
         .trim()
         .toLowerCase()===
       newName.toLowerCase()
   )
 ){

   msg.textContent=
     "This team already exists.";

   return;
 }


 const spent=
   Number(
     t.spent||0
   );


 t.name=
   newName;


 t.startBudget=
   newBudget;


 t.budget=
   Math.max(
     0,
     newBudget-spent
   );


 t.pin=
   newPin;


 state.sold.forEach(
   s=>{
     if(s.team===oldName)
       s.team=newName;
   }
 );


 save();

 render();


 window.closeTeamEditor();


 setMsg(
   "teamMsg",
   `✅ ${esc(newName)} updated successfully.`,
   "ok"
 );
};


window.deleteTeam=function(index){

 index=
   Number(index);


 const t=
   state.teams[index];


 if(!t)
   return;


 const soldCount=
   state.sold.filter(
     s=>s.team===t.name
   ).length;


 const warning=
   soldCount

     ? `\n\n${t.name} has ${soldCount} sold player(s). Those records will also be removed.`

     : "";


 if(
   !window.confirm(
     `Delete team "${t.name}"?${warning}`
   )
 )
   return;


 state.sold=
   state.sold.filter(
     s=>s.team!==t.name
   );


 state.teams.splice(
   index,
   1
 );


 save();

 render();


 setMsg(
   "teamMsg",
   `🗑️ ${esc(t.name)} deleted successfully.`,
   "ok"
 );
};


window.toggleTeamManagementPin=function(){

 const pin=
   document.getElementById(
     "teamPin"
   );


 const btn=
   document.getElementById(
     "showTeamPin"
   );


 if(!pin||!btn)
   return;


 if(pin.type==="password"){

   pin.type="text";

   btn.textContent=
     "🙈 Hide";

 }else{

   pin.type="password";

   btn.textContent=
     "👁️ Show";

 }
};


/* =========================================================
   SEARCHABLE DROPDOWNS
   + PURCHASED PLAYER FILTER
   ========================================================= */

(function(){

 "use strict";


 const PLAYER_KEY=
   "aa_players_fixed_excel_v2";


 const STATE_KEY=
   "aa_state_fixed_excel_v2";


 function getPlayers(){

   try{

     return JSON.parse(
       localStorage.getItem(
         PLAYER_KEY
       )||"[]"
     );

   }catch(_){

     return [];

   }
 }


 function getState(){

   try{

     return JSON.parse(
       localStorage.getItem(
         STATE_KEY
       )||
       '{"teams":[],"sold":[],"auctionComplete":false,"resultVisibleToTeams":false}'
     );

   }catch(_){

     return {

       teams:[],

       sold:[],

       auctionComplete:false,

       resultVisibleToTeams:false

     };

   }
 }


 function isSold(
   playerId,
   exceptSoldIndex=-1
 ){

   const state=
     getState();


   return state.sold.some(
     (s,i)=>
       i!==exceptSoldIndex &&
       String(s.playerId)===
       String(playerId)
   );

 }


 /* ---------------------------------------------------------
    SEARCHABLE SELECT
    --------------------------------------------------------- */

 function makeSearchable(select){

   if(
     !select ||
     select.dataset.searchableReady==="1"
   )
     return;


   select.dataset.searchableReady="1";


   const wrapper=
     document.createElement(
       "div"
     );


   wrapper.className=
     "searchable-select-wrapper";


   wrapper.style.position=
     "relative";


   wrapper.style.width=
     "100%";


   const input=
     document.createElement(
       "input"
     );


   input.type=
     "text";


   input.className=
     "searchable-select-input";


   input.placeholder=
     "Search...";


   input.autocomplete=
     "off";


   input.style.width=
     "100%";


   input.style.boxSizing=
     "border-box";


   const list=
     document.createElement(
       "div"
     );


   list.className=
     "searchable-select-list";


   list.style.position=
     "absolute";


   list.style.left=
     "0";


   list.style.right=
     "0";


   list.style.top=
     "100%";


   list.style.zIndex=
     "100000";


   list.style.background=
     "#fff";


   list.style.border=
     "1px solid #ccc";


   list.style.borderRadius=
     "6px";


   list.style.maxHeight=
     "220px";


   list.style.overflowY=
     "auto";


   list.style.display=
     "none";


   list.style.boxShadow=
     "0 5px 15px rgba(0,0,0,.15)";


   select.parentNode.insertBefore(
     wrapper,
     select
   );


   wrapper.appendChild(
     input
   );


   wrapper.appendChild(
     list
   );


   select.style.display=
     "none";


   wrapper.appendChild(
     select
   );


   function getOptions(){

     return Array.from(
       select.options
     )
     .filter(
       o=>
         o.value &&
         o.value!=="No active teams"
     )
     .map(
       o=>({

         value:o.value,

         text:
           o.textContent.trim()

       })
     );

   }


   function syncInput(){

     const option=
       select.options[
         select.selectedIndex
       ];


     if(option){

       input.value=
         option.textContent.trim();

     }else{

       input.value="";

     }

   }


   function showOptions(query){

     const q=
       String(
         query||""
       )
       .trim()
       .toLowerCase();


     const options=
       getOptions();


     const matches=
       options
         .filter(
           o=>
             !q ||
             o.text
               .toLowerCase()
               .includes(q)
         )
         .slice(0,50);


     list.innerHTML="";


     if(!matches.length){

       list.style.display=
         "none";

       return;
     }


     matches.forEach(
       item=>{

         const button=
           document.createElement(
             "button"
           );


         button.type=
           "button";


         button.textContent=
           item.text;


         button.style.display=
           "block";


         button.style.width=
           "100%";


         button.style.textAlign=
           "left";


         button.style.padding=
           "9px 10px";


         button.style.border=
           "0";


         button.style.background=
           "#fff";


         button.style.cursor=
           "pointer";


         button.addEventListener(
           "mouseenter",
           ()=>{
             button.style.background=
               "#f1f5f9";
           }
         );


         button.addEventListener(
           "mouseleave",
           ()=>{
             button.style.background=
               "#fff";
           }
         );


         button.addEventListener(
           "mousedown",
           e=>{

             e.preventDefault();


             select.value=
               item.value;


             select.dispatchEvent(
               new Event(
                 "change",
                 {
                   bubbles:true
                 }
               )
             );


             input.value=
               item.text;


             /*
                After selecting a team,
                the field becomes display-only.
                This removes the unwanted cursor.
             */

             input.readOnly=
               true;


             list.style.display=
               "none";


             input.blur();

           }
         );


         list.appendChild(
           button
         );

       }
     );


     list.style.display=
       "block";
   }


   /*
      Clicking a selected value unlocks the
      search field again.

      This allows a new team to be searched,
      while the normal selected state has
      no cursor/editing.
   */

   input.addEventListener(
     "click",
     ()=>{

       if(input.readOnly){

         input.readOnly=
           false;


         input.select();


         showOptions("");

       }else{

         showOptions(
           input.value
         );

       }

     }
   );


   input.addEventListener(
     "focus",
     ()=>{

       if(!input.readOnly)
         showOptions(
           input.value
         );

     }
   );


   /*
      ENTER = select first matching result.
   */

   input.addEventListener(
     "keydown",
     e=>{

       if(e.key!=="Enter")
         return;


       const first=
         list.querySelector(
           "button"
         );


       if(!first)
         return;


       e.preventDefault();


       first.dispatchEvent(
         new MouseEvent(
           "mousedown",
           {
             bubbles:true,
             cancelable:true
           }
         )
       );

     }
   );


   input.addEventListener(
     "input",
     ()=>{

       showOptions(
         input.value
       );


       const exact=
         getOptions().find(
           o=>
             o.text.toLowerCase()===
             input.value
               .trim()
               .toLowerCase()
         );


       if(exact){

         select.value=
           exact.value;


         select.dispatchEvent(
           new Event(
             "change",
             {
               bubbles:true
             }
           )
         );


         input.readOnly=
           true;


         list.style.display=
           "none";
       }

     }
   );


   select.addEventListener(
     "change",
     ()=>{

       syncInput();


       if(select.value){

         input.readOnly=
           true;


         list.style.display=
           "none";

       }

     }
   );


   document.addEventListener(
     "click",
     e=>{

       if(
         !wrapper.contains(
           e.target
         )
       ){

         list.style.display=
           "none";

       }

     }
   );


   syncInput();


   input.readOnly=
     Boolean(
       select.value
     );

 }


 /* ---------------------------------------------------------
    PLAYER FILTER FOR SOLD EDIT

    Already sold players must not appear.

    Current player being edited remains available.
    --------------------------------------------------------- */

 function refreshSoldPlayerOptions(){

   const select=
     document.getElementById(
       "editSoldPlayer"
     );


   if(!select)
     return;


   const idInput=
     document.getElementById(
       "editSoldId"
     );


   const currentIndex=
     idInput
       ? Number(
           idInput.value
         )
       : -1;


   const players=
     getPlayers();


   const state=
     getState();


   const currentSold=
     currentIndex>=0
       ? state.sold[
           currentIndex
         ]
       : null;


   const currentPlayerId=
     currentSold
       ? String(
           currentSold.playerId
         )
       : "";


   const available=
     players.filter(
       p=>{

         const soldByOther=
           state.sold.some(
             (s,i)=>{

               if(
                 i===currentIndex
               )
                 return false;


               return String(
                 s.playerId
               )===String(
                 p.id
               );

             }
           );


         return(
           !soldByOther ||
           String(p.id)===
           currentPlayerId
         );

       }
     );


   const oldValue=
     select.value;


   select.innerHTML=
     available
       .map(
         p=>
           `<option value="${escSearch(p.name)}">
             ${escSearch(p.srNo||"")}.
             ${escSearch(p.name)}
           </option>`
       )
       .join("");


   if(
     available.some(
       p=>
         String(p.name)===
         String(oldValue)
     )
   ){

     select.value=
       oldValue;

   }else if(currentSold){

     select.value=
       currentSold.name||"";

   }


   select.dispatchEvent(
     new Event(
       "change",
       {
         bubbles:true
       }
     )
   );

 }


 function escSearch(value){

   return String(
     value??""
   )
   .replace(
     /&/g,
     "&amp;"
   )
   .replace(
     /</g,
     "&lt;"
   )
   .replace(
     />/g,
     "&gt;"
   )
   .replace(
     /"/g,
     "&quot;"
   )
   .replace(
     /'/g,
     "&#039;"
   );

 }


 /* ---------------------------------------------------------
    ADD SEARCH TO CURRENT ADMIN DROPDOWNS
    --------------------------------------------------------- */

 function initSearchableDropdowns(){

   [
    
     "editSoldPlayer",
     "editSoldTeam",
     "editTeamSelect"
   ]
   .forEach(
     id=>{

       makeSearchable(
         document.getElementById(
           id
         )
       );

     }
   );

 }


 /* ---------------------------------------------------------
    RE-CHECK AFTER EXISTING RENDER / MODALS
    --------------------------------------------------------- */

 const originalOpenSoldEdit=
   window.openSoldEdit;


 if(
   typeof originalOpenSoldEdit===
   "function"
 ){

   window.openSoldEdit=
     function(index){

       originalOpenSoldEdit(
         index
       );


       refreshSoldPlayerOptions();


       setTimeout(
         ()=>{
           initSearchableDropdowns();
         },
         0
       );

     };

 }


 /* ---------------------------------------------------------
    OBSERVE DOM CHANGES
    Existing render() rebuilds dropdown options.
    --------------------------------------------------------- */

 const observer=
   new MutationObserver(
     ()=>{
       initSearchableDropdowns();
     }
   );


 observer.observe(
   document.body,
   {
     childList:true,
     subtree:true
   }
 );


 /* ---------------------------------------------------------
    INITIAL START
    --------------------------------------------------------- */

 document.addEventListener(
   "DOMContentLoaded",
   ()=>{
     setTimeout(
       ()=>{
         initSearchableDropdowns();
       },
       100
     );
   }
 );


 setTimeout(
   ()=>{
     initSearchableDropdowns();
   },
   500
 );

})();
/* =========================================================
   NIRMAAN ADMIN CROSS-BROWSER REALTIME UPDATE
   ========================================================= */

window.addEventListener(
  "nirmaan-realtime-update",
  function () {

    try {

      players = JSON.parse(
        localStorage.getItem(PLAYER_KEY) || "[]"
      );

      state = JSON.parse(
        localStorage.getItem(STATE_KEY) ||
        '{"teams":[],"sold":[],"auctionComplete":false,"resultVisibleToTeams":false}'
      );

      state.auctionComplete =
        Boolean(state.auctionComplete);

      state.resultVisibleToTeams =
        Boolean(state.resultVisibleToTeams);

      /*
        Rebuild the complete Admin screen
        immediately when another browser
        changes the auction.
      */

      render();

    } catch (error) {

      console.error(
        "[NIRMAAN] Admin realtime refresh error:",
        error
      );

    }

  }
 /* =========================================================
   WINNER POSTER — STEP 7
   Uses the exact existing Final Ranking rules
   ========================================================= */

$("generateWinnerPoster")?.addEventListener(
  "click",
  function(){

    const msg = $("winnerPosterMsg");

    if(!state.auctionComplete){

      if(msg){
        msg.style.color = "#dc2626";
        msg.textContent =
          "❌ Complete the auction first.";
      }

      return;
    }


    /* -----------------------------------------------
       Build winner data exactly like Final Ranking
       ----------------------------------------------- */

    const getPosterWinnerData = (team) => {

      const sold =
        state.sold.filter(
          s => s.team === team.name
        );


      const normalize = value =>
        String(value || "")
          .toLowerCase()
          .replace(/[\s_-]+/g,"")
          .trim();


      const hasCategory = (category,type) => {

        const c = normalize(category);


        if(type === "batsman")
          return (
            c.includes("batsman") ||
            c.includes("batter")
          );


        if(type === "bowler")
          return (
            c.includes("bowler") ||
            c.includes("bowling")
          );


        if(type === "wicketkeeper")
          return (
            c.includes("wicketkeeper") ||
            c.includes("keeper") ||
            c === "wk"
          );


        if(type === "allrounder")
          return (
            c.includes("allrounder") ||
            c.includes("allround")
          );


        return false;
      };


      const eligible =
        team.players.length === 4 &&

        sold.some(
          s => hasCategory(
            s.category,
            "batsman"
          )
        ) &&

        sold.some(
          s => hasCategory(
            s.category,
            "bowler"
          )
        ) &&

        sold.some(
          s => hasCategory(
            s.category,
            "wicketkeeper"
          )
        ) &&

        sold.some(
          s => hasCategory(
            s.category,
            "allrounder"
          )
        );


      return {

        eligible,

        totalPoints:
          Number(team.points || 0),

        remainingBudget:
          Number(team.budget || 0),

        totalSpent:
          Number(team.spent || 0)

      };

    };


    const winnerData =
      new Map();


    state.teams.forEach(
      team => {

        winnerData.set(
          team.name,
          getPosterWinnerData(team)
        );

      }
    );


    /* -----------------------------------------------
       EXACT SAME ranking order
       ----------------------------------------------- */

    const ranking =
      [...state.teams].sort(
        (a,b) => {

          const A =
            winnerData.get(a.name);

          const B =
            winnerData.get(b.name);


          if(A.eligible !== B.eligible){

            return A.eligible
              ? -1
              : 1;

          }


          if(
            A.totalPoints !==
            B.totalPoints
          ){

            return (
              B.totalPoints -
              A.totalPoints
            );

          }


          if(
            A.remainingBudget !==
            B.remainingBudget
          ){

            return (
              B.remainingBudget -
              A.remainingBudget
            );

          }


          if(
            A.totalSpent !==
            B.totalSpent
          ){

            return (
              A.totalSpent -
              B.totalSpent
            );

          }


          return 0;

        }
      );


    /* -----------------------------------------------
       ONLY eligible teams can become poster winners
       ----------------------------------------------- */

    const topThree =
      ranking
        .filter(
          team =>
            winnerData
              .get(team.name)
              ?.eligible
        )
        .slice(0,3);


    if(topThree.length < 3){

      if(msg){

        msg.style.color =
          "#dc2626";

        msg.textContent =
          `❌ Only ${topThree.length} eligible team(s) found. Three eligible teams are required.`;

      }

      return;
    }


    /* -----------------------------------------------
       Verification
       ----------------------------------------------- */

    if(msg){

      msg.style.color =
        "#166534";

      msg.innerHTML = `

        ✅ Winner Poster data ready.

        <div style="
          margin-top:10px;
          line-height:1.9;
        ">

          🥇 <b>Rank 1:</b>
          ${esc(topThree[0].name)}

          <br>

          🥈 <b>Rank 2:</b>
          ${esc(topThree[1].name)}

          <br>

          🥉 <b>Rank 3:</b>
          ${esc(topThree[2].name)}

        </div>

      `;

    }

  }
);
);
