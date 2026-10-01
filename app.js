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

    clearInterval(
      timerInterval
    );

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


// Refresh fasting statistics and history

await loadFastingHistory();

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
async function loadActiveFast() {

  const { data, error } =
    await db
      .from("fasting_sessions")
      .select("*")
      .is(
        "ended_at",
        null
      )
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


  if (!data) {

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

    return;
  }


  activeFast =
    data;


  showActiveFast();

}
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

// ----------------------------------------
// LOAD APP
// ----------------------------------------

loadActiveFast();
loadFastingHistory();

// ========================================
// WEIGHT TRACKING
// ========================================

const STARTING_WEIGHT = 167;
const HEIGHT_CM = 180;

const weightInput =
  document.getElementById("weightInput");

const weightDate =
  document.getElementById("weightDate");

const saveWeightBtn =
  document.getElementById("saveWeightBtn");

const weightMessage =
  document.getElementById("weightMessage");

const currentWeight =
  document.getElementById("currentWeight");

const weightLost =
  document.getElementById("weightLost");

const weightLossPercent =
  document.getElementById("weightLossPercent");

const currentBMI =
  document.getElementById("currentBMI");

const weightChange =
  document.getElementById("weightChange");

const weightHistory =
  document.getElementById("weightHistory");

function setDefaultWeightDate() {

  const now =
    new Date();

  const offset =
    now.getTimezoneOffset();

  const localTime =
    new Date(
      now.getTime() -
      offset * 60000
    );

  weightDate.value =
    localTime
      .toISOString()
      .slice(0, 16);

}

setDefaultWeightDate();


// ----------------------------------------
// SAVE WEIGHT
// ----------------------------------------

async function saveWeight() {

  const weight =
    Number(weightInput.value);


  if (
    !weight ||
    weight <= 0
  ) {

    weightMessage.textContent =
      "Please enter a valid weight.";

    return;
  }


  saveWeightBtn.disabled =
    true;

  saveWeightBtn.textContent =
    "Saving...";

  weightMessage.textContent =
    "";


  const { error } =
    await db
      .from("weight_entries")
      .insert({
        weight_kg: weight,
        recorded_at:
  weightDate.value
    ? new Date(
        weightDate.value
      ).toISOString()
    : new Date().toISOString()
      });


  if (error) {

    console.error(error);

    weightMessage.textContent =
      "Unable to save weight.";

    saveWeightBtn.disabled =
      false;

    saveWeightBtn.textContent =
      "Save Weight";

    return;
  }


  weightInput.value =
    "";

  setDefaultWeightDate();

  weightMessage.textContent =
    "Weight saved";


  saveWeightBtn.disabled =
    false;

  saveWeightBtn.textContent =
    "Save Weight";


  await loadWeights();

}


// ----------------------------------------
// LOAD WEIGHTS
// ----------------------------------------

let weightChartInstance = null;


function drawWeightChart(entries) {

  const canvas =
    document.getElementById(
      "weightChart"
    );


  if (!canvas) {
    return;
  }


  // Oldest → newest for the graph

  const chartData =
    [...entries].reverse();


  const labels =
    chartData.map(entry => {

      const date =
        new Date(
          entry.recorded_at
        );

      return date.toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short"
        }
      );

    });


  const weights =
    chartData.map(
      entry =>
        Number(
          entry.weight_kg
        )
    );


  if (weightChartInstance) {

    weightChartInstance.destroy();

  }


  weightChartInstance =
    new Chart(
      canvas,
      {
        type: "line",

        data: {
          labels: labels,

          datasets: [
            {
              label: "Weight (kg)",
              data: weights,
              tension: 0.25,
              pointRadius: 4,
              pointHoverRadius: 6
            }
          ]
        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          interaction: {
            intersect: false,
            mode: "index"
          },

          plugins: {

            legend: {
              display: false
            },

            tooltip: {
              callbacks: {

                label: function(context) {

                  return (
                    context.parsed.y
                      .toFixed(1) +
                    " kg"
                  );

                }

              }
            }

          },

          scales: {

            y: {

              title: {
                display: true,
                text: "Weight (kg)"
              }

            }

          }

        }

      }
    );

}

async function loadWeights() {

  const { data, error } =
    await db
      .from("weight_entries")
      .select("*")
      .order(
        "recorded_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Unable to load weights:",
      error
    );

    return;
  }


  if (
    !data ||
    data.length === 0
  ) {

    currentWeight.textContent =
      "—";

    weightLost.textContent =
      "—";

    weightLossPercent.textContent =
      "—";

    currentBMI.textContent =
      "—";

    weightChange.textContent =
      "No weight recorded yet";

    weightHistory.innerHTML =
      "<p>No weight entries yet.</p>";

    return;
  }

  // --------------------------------------
  // CURRENT WEIGHT
  // --------------------------------------

  const latestWeight =
    Number(
      data[0].weight_kg
    );


  currentWeight.textContent =
    latestWeight.toFixed(1);


  // --------------------------------------
  // TOTAL WEIGHT LOST
  // --------------------------------------

  const lost =
    STARTING_WEIGHT -
    latestWeight;


  weightLost.textContent =
    lost.toFixed(1) +
    " kg";


  // --------------------------------------
  // PERCENTAGE WEIGHT LOSS
  // --------------------------------------

  const percentageLost =
    (
      lost /
      STARTING_WEIGHT
    ) * 100;


  weightLossPercent.textContent =
    percentageLost.toFixed(1) +
    "%";


  // --------------------------------------
  // BMI
  // --------------------------------------

  const heightMetres =
    HEIGHT_CM / 100;


  const bmi =
    latestWeight /
    (
      heightMetres *
      heightMetres
    );


  currentBMI.textContent =
    bmi.toFixed(1);


  // --------------------------------------
  // CHANGE FROM PREVIOUS ENTRY
  // --------------------------------------

  if (data.length > 1) {

    const previousWeight =
      Number(
        data[1].weight_kg
      );


    const change =
      latestWeight -
      previousWeight;


    if (change < 0) {

      weightChange.textContent =
        Math.abs(change).toFixed(1) +
        " kg down since last entry";

    } else if (change > 0) {

      weightChange.textContent =
        change.toFixed(1) +
        " kg up since last entry";

    } else {

      weightChange.textContent =
        "No change since last entry";

    }

  } else {

    weightChange.textContent =
      "First weight entry";

  }

// --------------------------------------
// WEIGHT GRAPH
// --------------------------------------

drawWeightChart(data);

// --------------------------------------
// WEIGHT HISTORY
// --------------------------------------

weightHistory.innerHTML =
  "";


data.forEach(entry => {

  const card =
    document.createElement(
      "div"
    );

  card.className =
    "history-card";


  const date =
    new Date(
      entry.recorded_at
    );


  const dateText =
    date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );


  const timeText =
    date.toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );


  card.innerHTML =
    "<div>" +

      "<strong>" +
        dateText +
      "</strong>" +

      "<div class='history-time'>" +
        timeText +
      "</div>" +

    "</div>" +

    "<div class='history-right'>" +

      "<strong>" +
        Number(
          entry.weight_kg
        ).toFixed(1) +
        " kg" +
      "</strong>" +

      "<button " +
        "class='delete-entry-btn' " +
        "onclick='deleteWeight(" +
        entry.id +
        ")'>" +
        "Delete" +
      "</button>" +

    "</div>";


  weightHistory.appendChild(
    card
  );

});


}

// ----------------------------------------
// DELETE WEIGHT
// ----------------------------------------

async function deleteWeight(id) {

  const confirmed =
    confirm(
      "Delete this weight entry?"
    );

  if (!confirmed) {
    return;
  }


  const { error } =
    await db
      .from("weight_entries")
      .delete()
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(error);

    alert(
      "Unable to delete weight."
    );

    return;
  }


  await loadWeights();

}

// ----------------------------------------
// WEIGHT BUTTON
// ----------------------------------------

saveWeightBtn.addEventListener(
  "click",
  saveWeight
);


// ----------------------------------------
// LOAD WEIGHT DATA
// ----------------------------------------

loadWeights();

// ========================================
// CALORIE TRACKING
// ========================================

const foodDescription =
  document.getElementById(
    "foodDescription"
  );

const calorieInput =
  document.getElementById(
    "calorieInput"
  );

const foodDate =
  document.getElementById(
    "foodDate"
  );

const saveCaloriesBtn =
  document.getElementById(
    "saveCaloriesBtn"
  );

const calorieMessage =
  document.getElementById(
    "calorieMessage"
  );

const calorieHistory =
  document.getElementById(
    "calorieHistory"
  );

const caloriesToday =
  document.getElementById(
    "caloriesToday"
  );

const calories24h =
  document.getElementById(
    "calories24h"
  );

const calories7Days =
  document.getElementById(
    "calories7Days"
  );

const caloriesDailyAverage =
  document.getElementById(
    "caloriesDailyAverage"
  );


// ----------------------------------------
// DEFAULT FOOD DATE
// ----------------------------------------

function setDefaultFoodDate() {

  const now =
    new Date();

  const offset =
    now.getTimezoneOffset();

  const localTime =
    new Date(
      now.getTime() -
      offset * 60000
    );

  foodDate.value =
    localTime
      .toISOString()
      .slice(0, 16);

}

setDefaultFoodDate();

// ----------------------------------------
// SAVE CALORIES
// ----------------------------------------

async function saveCalories() {

  const calories =
    Number(
      calorieInput.value
    );

  const description =
    foodDescription.value.trim();


  if (
    !calories ||
    calories <= 0
  ) {

    calorieMessage.textContent =
      "Please enter valid calories.";

    return;
  }


  saveCaloriesBtn.disabled =
    true;

  saveCaloriesBtn.textContent =
    "Saving...";

  calorieMessage.textContent =
    "";


  const { error } =
    await db
      .from("calorie_entries")
      .insert({
        calories: calories,
        description: description || null,
        eaten_at:
          foodDate.value
            ? new Date(
                foodDate.value
              ).toISOString()
            : new Date().toISOString()
      });


  if (error) {

    console.error(error);

    calorieMessage.textContent =
      "Unable to save calories.";

    saveCaloriesBtn.disabled =
      false;

    saveCaloriesBtn.textContent =
      "Add Calories";

    return;
  }


  calorieInput.value =
    "";

  foodDescription.value =
    "";

  setDefaultFoodDate();


  calorieMessage.textContent =
  "Calories saved";


await loadCalories();


saveCaloriesBtn.disabled =
  false;

  saveCaloriesBtn.textContent =
    "Add Calories";

}

saveCaloriesBtn.addEventListener(
  "click",
  saveCalories
);

// ----------------------------------------
// LOAD CALORIES
// ----------------------------------------

async function loadCalories() {

  const { data, error } =
    await db
      .from("calorie_entries")
      .select("*")
      .order(
        "eaten_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Unable to load calories:",
      error
    );

    return;
  }


  const entries =
    data || [];


  const now =
    new Date();

  const startToday =
    new Date();

  startToday.setHours(
    0,
    0,
    0,
    0
  );


  const twentyFourHoursAgo =
    new Date(
      now.getTime() -
      24 * 60 * 60 * 1000
    );


  const sevenDaysAgo =
    new Date(
      now.getTime() -
      7 * 24 * 60 * 60 * 1000
    );


  let todayTotal = 0;
  let total24h = 0;
  let total7Days = 0;


  entries.forEach(entry => {

    const eatenAt =
      new Date(
        entry.eaten_at
      );

    const calories =
      Number(
        entry.calories
      );


    if (
      eatenAt >= startToday &&
      eatenAt <= now
    ) {

      todayTotal +=
        calories;

    }


    if (
      eatenAt >= twentyFourHoursAgo &&
      eatenAt <= now
    ) {

      total24h +=
        calories;

    }


    if (
      eatenAt >= sevenDaysAgo &&
      eatenAt <= now
    ) {

      total7Days +=
        calories;

    }

  });


  caloriesToday.textContent =
    Math.round(todayTotal) +
    " kcal";


  calories24h.textContent =
    Math.round(total24h) +
    " kcal";


  calories7Days.textContent =
    Math.round(total7Days) +
    " kcal";


  caloriesDailyAverage.textContent =
    Math.round(
      total7Days / 7
    ) +
    " kcal";

}

loadCalories();
