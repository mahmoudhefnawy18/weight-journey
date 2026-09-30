const SUPABASE_URL =
  "https://epdinlgqlxfezrjjyhmk.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_xtEL7D8kZQiPiPMuXj-5ww_ibXNJhbr";


const db =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

const tabs =
  document.querySelectorAll(".tab");

const tabContents =
  document.querySelectorAll(".tab-content");


tabs.forEach(tab => {

  tab.addEventListener("click", () => {

    const selectedTab =
      tab.dataset.tab;


    // Remove active state from all tabs

    tabs.forEach(item => {
      item.classList.remove("active");
    });


    // Hide all sections

    tabContents.forEach(section => {
      section.classList.remove("active");
    });


    // Activate selected tab

    tab.classList.add("active");

    document
      .getElementById(selectedTab)
      .classList.add("active");

  });

});

// ========================================
// FASTING
// ========================================

const fastTimer =
  document.getElementById("fastTimer");

const fastStatus =
  document.getElementById("fastStatus");

const startFastBtn =
  document.getElementById("startFastBtn");

const stopFastBtn =
  document.getElementById("stopFastBtn");


let activeFast = null;

let timerInterval = null;


// ----------------------------------------
// FORMAT FASTING TIME
// ----------------------------------------

function formatFastDuration(startTime) {

  const start =
    new Date(startTime);

  const now =
    new Date();

  const totalSeconds =
    Math.floor(
      (now - start) / 1000
    );


  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );

  const seconds =
    totalSeconds % 60;


  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
  );

}


// ----------------------------------------
// UPDATE TIMER
// ----------------------------------------

function updateFastTimer() {

  if (!activeFast) {
    return;
  }

  fastTimer.textContent =
    formatFastDuration(
      activeFast.started_at
    );

}


// ----------------------------------------
// SHOW ACTIVE FAST
// ----------------------------------------

function showActiveFast() {

  fastStatus.textContent =
    "Fasting";

  startFastBtn.hidden =
    true;

  stopFastBtn.hidden =
    false;


  updateFastTimer();


  if (timerInterval) {
    clearInterval(timerInterval);
  }


  timerInterval =
    setInterval(
      updateFastTimer,
      1000
    );

}


// ----------------------------------------
// START FAST
// ----------------------------------------

async function startFast() {

  startFastBtn.disabled =
    true;

  startFastBtn.textContent =
    "Starting...";


  const now =
    new Date().toISOString();


  const { data, error } =
    await db
      .from("fasting_sessions")
      .insert({
        started_at: now
      })
      .select()
      .single();


  if (error) {

    console.error(error);

    alert(
      "Unable to start fast."
    );

    startFastBtn.disabled =
      false;

    startFastBtn.textContent =
      "Start Fast";

    return;
  }


  activeFast =
    data;


  startFastBtn.disabled =
    false;

  startFastBtn.textContent =
    "Start Fast";


  showActiveFast();

}
// ----------------------------------------
// STOP FAST
// ----------------------------------------

async function stopFast() {

  if (!activeFast) {
    return;
  }


  const confirmed =
    confirm(
      "Are you sure you want to stop your fast?"
    );

  if (!confirmed) {
    return;
  }


  stopFastBtn.disabled =
    true;

  stopFastBtn.textContent =
    "Stopping...";


  const endTime =
    new Date().toISOString();


  const { error } =
    await db
      .from("fasting_sessions")
      .update({
        ended_at: endTime
      })
      .eq(
        "id",
        activeFast.id
      );


  if (error) {

    console.error(error);

    alert(
      "Unable to stop fast."
    );

    stopFastBtn.disabled =
      false;

    stopFastBtn.textContent =
      "Stop Fast";

    return;
  }


  if (timerInterval) {

    clearInterval(
      timerInterval
    );

    timerInterval =
      null;
  }


  activeFast =
    null;


  fastTimer.textContent =
    "00:00:00";

  fastStatus.textContent =
    "Not fasting";


  stopFastBtn.hidden =
    true;

  stopFastBtn.disabled =
    false;

  stopFastBtn.textContent =
    "Stop Fast";


  startFastBtn.hidden =
    false;

}

// ----------------------------------------
// BUTTON
// ----------------------------------------

startFastBtn.addEventListener(
  "click",
  startFast
);

stopFastBtn.addEventListener(
  "click",
  stopFast
);

// ----------------------------------------
// LOAD ACTIVE FAST
// ----------------------------------------

// ========================================
// FASTING HISTORY
// ========================================

async function loadFastingHistory() {

  const historyArea =
    document.getElementById(
      "fastingHistory"
    );

  const lastFast =
    document.getElementById(
      "lastFast"
    );

  const averageFast =
    document.getElementById(
      "averageFast"
    );

  const longestFast =
    document.getElementById(
      "longestFast"
    );


  const { data, error } =
    await db
      .from("fasting_sessions")
      .select("*")
      .not("ended_at", "is", null)
      .order(
        "started_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Unable to load fasting history:",
      error
    );

    historyArea.innerHTML =
      "<p>Unable to load fasting history.</p>";

    return;
  }


  if (
    !data ||
    data.length === 0
  ) {

    historyArea.innerHTML =
      "<p>No completed fasts yet.</p>";

    lastFast.textContent = "—";
    averageFast.textContent = "—";
    longestFast.textContent = "—";

    return;
  }


  // --------------------------------------
  // CALCULATE DURATIONS
  // --------------------------------------

  const sessions =
    data.map(session => {

      const start =
        new Date(
          session.started_at
        );

      const end =
        new Date(
          session.ended_at
        );

      const durationMinutes =
        Math.round(
          (end - start) /
          60000
        );


      return {
        ...session,
        start,
        end,
        durationMinutes
      };

    });


  function formatMinutes(minutes) {

    const hours =
      Math.floor(
        minutes / 60
      );

    const mins =
      minutes % 60;


    return (
      hours +
      "h " +
      mins +
      "m"
    );

  }


  // --------------------------------------
  // STATISTICS
  // --------------------------------------

  lastFast.textContent =
    formatMinutes(
      sessions[0]
        .durationMinutes
    );


  const totalMinutes =
    sessions.reduce(
      (total, session) =>
        total +
        session.durationMinutes,
      0
    );


  const averageMinutes =
    Math.round(
      totalMinutes /
      sessions.length
    );


  averageFast.textContent =
    formatMinutes(
      averageMinutes
    );


  const longestMinutes =
    Math.max(
      ...sessions.map(
        session =>
          session.durationMinutes
      )
    );


  longestFast.textContent =
    formatMinutes(
      longestMinutes
    );


  // --------------------------------------
  // HISTORY
  // --------------------------------------

  historyArea.innerHTML =
    "";


  sessions.forEach(session => {

    const card =
      document.createElement(
        "div"
      );


    card.className =
      "history-card";


    const date =
      session.start
        .toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }
        );


    const startTime =
      session.start
        .toLocaleTimeString(
          "en-GB",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );


    const endTime =
      session.end
        .toLocaleTimeString(
          "en-GB",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );


    card.innerHTML =
      "<div>" +
        "<strong>" +
          date +
        "</strong>" +
        "<div class='history-time'>" +
          startTime +
          " → " +
          endTime +
        "</div>" +
      "</div>" +

      "<strong>" +
        formatMinutes(
          session.durationMinutes
        ) +
      "</strong>";


    historyArea.appendChild(
      card
    );

  });

}

async function loadActiveFast() {

  const { data, error } =
    await db
      .from("fasting_sessions")
      .select("*")
      .is("ended_at", null)
      .order(
        "started_at",
        {
          ascending: false
        }
      )
      .limit(1)
      .maybeSingle();


  if (error) {

    console.error(
      "Unable to load active fast:",
      error
    );

    return;
  }


  if (data) {

    activeFast =
      data;

    showActiveFast();

  } else {

    activeFast =
      null;

    fastTimer.textContent =
      "00:00:00";

    fastStatus.textContent =
      "Not fasting";

    startFastBtn.hidden =
      false;

    stopFastBtn.hidden =
      true;

  }

}


// ----------------------------------------
// LOAD APP
// ----------------------------------------

loadActiveFast();
loadFastingHistory();
