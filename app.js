const SUPABASE_URL =
  "https://epdinlgqlxfezrjjyhmk.supabase.co/rest/v1/";

const SUPABASE_KEY =
  "https://epdinlgqlxfezrjjyhmk.supabase.co/rest/v1/";


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
// BUTTON
// ----------------------------------------

startFastBtn.addEventListener(
  "click",
  startFast
);
