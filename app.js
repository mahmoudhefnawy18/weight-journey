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

const summaryCurrentFast =
  document.getElementById(
    "summaryCurrentFast"
  );


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

  const duration =
    formatFastDuration(
      activeFast.started_at
    );

  fastTimer.textContent =
    duration;

  summaryCurrentFast.textContent =
    duration;

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
  await loadFastingSummary();

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

    summaryCurrentFast.textContent =
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

        "<div class='history-right'>" +

        "<strong>" +
          formatMinutes(
            session.durationMinutes
          ) +
        "</strong>" +

        "<button " +
          "class='delete-entry-btn' " +
          "onclick='deleteFast(" +
          session.id +
          ")'>" +
          "Delete" +
        "</button>" +

      "</div>";


    historyArea.appendChild(
      card
    );

  });

}

async function deleteFast(id) {

  const confirmed =
    confirm(
      "Delete this fasting session?"
    );

  if (!confirmed) {
    return;
  }

  const { error } =
    await db
      .from("fasting_sessions")
      .delete()
      .eq(
        "id",
        id
      );

  if (error) {

    console.error(error);

    alert(
      "Unable to delete fasting session."
    );

    return;
  }

  await loadFastingHistory();
  await loadFastingSummary();

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
  await loadEnergySummary();
  await updateTodayDeficit();

}


// ----------------------------------------
// LOAD WEIGHTS
// ----------------------------------------

let weightChartInstance = null;
let deficitChartInstance = null;
let calorieChartInstance = null;
let activityChartInstance = null;


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
await loadEnergySummary();
await updateTodayDeficit();

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

const summaryCaloriesToday =
  document.getElementById(
    "summaryCaloriesToday"
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

const calories7DayAverage =
  document.getElementById(
    "calories7DayAverage"
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
await updateTodayDeficit();


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

  summaryCaloriesToday.textContent =
  Math.round(todayTotal) +
  " kcal";


  calories24h.textContent =
    Math.round(total24h) +
    " kcal";


  calories7Days.textContent =
    Math.round(total7Days) +
    " kcal";

  calories7DayAverage.textContent =
  Math.round(
    total7Days / 7
  ) +
  " kcal";
  

  const trackedCalorieDays =
  new Set(
    entries
      .filter(
        entry =>
          new Date(
            entry.eaten_at
          ) >= sevenDaysAgo
      )
      .map(
        entry =>
          new Date(
            entry.eaten_at
          ).toLocaleDateString(
            "en-CA"
          )
      )
  ).size;


 caloriesDailyAverage.textContent =
  trackedCalorieDays > 0
    ? Math.round(
        total7Days /
        trackedCalorieDays
      ) +
      " kcal"
    : "0 kcal";

  // ----------------------------------------
// DAILY CALORIE CHART
// ----------------------------------------

const calorieChartLabels =
  [];

const calorieChartValues =
  [];

  const calorieChartStart =
  new Date();

calorieChartStart.setDate(
  calorieChartStart.getDate() - 6
);

calorieChartStart.setHours(
  0, 0, 0, 0
);


for (
  let i = 0;
  i < 7;
  i++
) {

  const dayStart =
    new Date(
      calorieChartStart
    );

  dayStart.setDate(
    dayStart.getDate() + i
  );


  const dayEnd =
    new Date(dayStart);

  dayEnd.setDate(
    dayEnd.getDate() + 1
  );

  const caloriesForDay =
  (data || [])
    .filter(
      entry => {

        const entryDate =
          new Date(
            entry.eaten_at
          );

        return (
          entryDate >= dayStart &&
          entryDate < dayEnd
        );

      }
    )
    .reduce(
      (total, entry) =>
        total +
        Number(entry.calories),
      0
    );


calorieChartLabels.push(
  dayStart.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short"
    }
  )
);


calorieChartValues.push(
  Math.round(
    caloriesForDay
  )
);

}

const currentWeight =
  await getLatestWeight();

const currentBMR =
  calculateBMR(
    currentWeight
  );

const currentActivityMultiplier =
  Number(
    activityLevel.value
  );

const calorieChartExpenditure =
  Math.round(
    currentBMR *
    currentActivityMultiplier
  );
  
 drawCalorieChart(
  calorieChartLabels,
  calorieChartValues,
  calorieChartExpenditure
);
  

    // --------------------------------------
  // FOOD HISTORY
  // --------------------------------------

  calorieHistory.innerHTML =
    "";


  if (entries.length === 0) {

    calorieHistory.innerHTML =
      "<p>No calorie entries yet.</p>";

    return;
  }


  entries.forEach(entry => {

    const card =
      document.createElement(
        "div"
      );

    card.className =
      "history-card";


    const date =
      new Date(
        entry.eaten_at
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


    const description =
      entry.description ||
      "Food / Drink";


    card.innerHTML =
      "<div>" +

        "<strong>" +
          description +
        "</strong>" +

        "<div class='history-time'>" +
          dateText +
          " · " +
          timeText +
        "</div>" +

      "</div>" +

          "<div class='history-right'>" +

        "<strong>" +
          Math.round(
            Number(entry.calories)
          ) +
          " kcal" +
        "</strong>" +

        "<button " +
          "class='delete-entry-btn' " +
          "onclick='deleteCalories(" +
          entry.id +
          ")'>" +
          "Delete" +
        "</button>" +

      "</div>";

    calorieHistory.appendChild(
      card
    );

  });
}

// ----------------------------------------
// DELETE CALORIE ENTRY
// ----------------------------------------

async function deleteCalories(id) {

  const confirmed =
    confirm(
      "Delete this calorie entry?"
    );

  if (!confirmed) {
    return;
  }


  const { error } =
    await db
      .from("calorie_entries")
      .delete()
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(error);

    alert(
      "Unable to delete calorie entry."
    );

    return;
  }


  await loadCalories();
  await updateTodayDeficit();

}

loadCalories();

// ========================================
// ACTIVITY TRACKING
// ========================================

const activityType =
  document.getElementById(
    "activityType"
  );

const activityDuration =
  document.getElementById(
    "activityDuration"
  );

const activityDate =
  document.getElementById(
    "activityDate"
  );

const saveActivityBtn =
  document.getElementById(
    "saveActivityBtn"
  );

const activityMessage =
  document.getElementById(
    "activityMessage"
  );

const activityHistory =
  document.getElementById(
    "activityHistory"
  );

const activityToday =
  document.getElementById(
    "activityToday"
  );

const summaryActivityToday =
  document.getElementById(
    "summaryActivityToday"
  );

const activity7Days =
  document.getElementById(
    "activity7Days"
  );


// ----------------------------------------
// DEFAULT ACTIVITY DATE
// ----------------------------------------

function setDefaultActivityDate() {

  const now =
    new Date();

  const offset =
    now.getTimezoneOffset();

  const localTime =
    new Date(
      now.getTime() -
      offset * 60000
    );

  activityDate.value =
    localTime
      .toISOString()
      .slice(0, 16);

}

setDefaultActivityDate();

// ----------------------------------------
// ACTIVITY CALORIE ESTIMATE
// ----------------------------------------

const activityMETs = {
  walking: 3.5,
  brisk_walking: 4.8,
  cycling: 6.8,
  swimming: 6.0,
  gym: 5.0
};


async function getLatestWeight() {

  const { data, error } =
    await db
      .from("weight_entries")
      .select("weight_kg")
      .order(
        "recorded_at",
        {
          ascending: false
        }
      )
      .limit(1)
      .maybeSingle();


  if (error) {

    console.error(
      "Unable to get latest weight:",
      error
    );

    return STARTING_WEIGHT;
  }


  if (!data) {
    return STARTING_WEIGHT;
  }


  return Number(
    data.weight_kg
  );

}


function calculateActivityCalories(
  met,
  weightKg,
  minutes
) {

  const calories =
    (
      met *
      3.5 *
      weightKg /
      200
    ) *
    minutes;


  return Math.round(
    calories
  );

}

async function getWeightAtDate(
  targetDate
) {

  const { data, error } =
    await db
      .from("weight_entries")
      .select(
        "weight_kg, recorded_at"
      )
      .lte(
        "recorded_at",
        targetDate.toISOString()
      )
      .order(
        "recorded_at",
        {
          ascending: false
        }
      )
      .limit(1)
      .maybeSingle();


  if (error) {

    console.error(
      "Unable to get historical weight:",
      error
    );

    return STARTING_WEIGHT;
  }


  if (!data) {
    return STARTING_WEIGHT;
  }


  return Number(
    data.weight_kg
  );

}
// ----------------------------------------
// SAVE ACTIVITY
// ----------------------------------------

async function saveActivity() {

  const type =
    activityType.value;

  const minutes =
    Number(
      activityDuration.value
    );


  if (!type) {

    activityMessage.textContent =
      "Please select an activity.";

    return;
  }


  if (
    !minutes ||
    minutes <= 0
  ) {

    activityMessage.textContent =
      "Please enter a valid duration.";

    return;
  }


  saveActivityBtn.disabled =
    true;

  saveActivityBtn.textContent =
    "Saving...";

  activityMessage.textContent =
    "";


  const weight =
    await getLatestWeight();


  const met =
    activityMETs[type];


  const caloriesBurned =
    calculateActivityCalories(
      met,
      weight,
      minutes
    );


  const { error } =
    await db
      .from("activity_entries")
      .insert({
        activity_type: type,
        duration_minutes: minutes,
        calories_burned: caloriesBurned,
        performed_at:
          activityDate.value
            ? new Date(
                activityDate.value
              ).toISOString()
            : new Date().toISOString()
      });


  if (error) {

    console.error(error);

    activityMessage.textContent =
      "Unable to save activity.";

    saveActivityBtn.disabled =
      false;

    saveActivityBtn.textContent =
      "Add Activity";

    return;
  }


  activityType.value =
    "";

  activityDuration.value =
    "";

  setDefaultActivityDate();


 activityMessage.textContent =
  "Activity saved — estimated " +
  caloriesBurned +
  " kcal burned";


await loadActivities();
await updateTodayDeficit();


saveActivityBtn.disabled =
  false;

  saveActivityBtn.textContent =
    "Add Activity";

}


saveActivityBtn.addEventListener(
  "click",
  saveActivity
);

// ----------------------------------------
// LOAD ACTIVITIES
// ----------------------------------------

async function loadActivities() {

  const { data, error } =
    await db
      .from("activity_entries")
      .select("*")
      .order(
        "performed_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Unable to load activities:",
      error
    );

    return;
  }


  const entries =
    data || [];

  const activityChartLabels = [];
const activityChartValues = [];

const activityChartStart =
  new Date();

activityChartStart.setDate(
  activityChartStart.getDate() - 6
);

activityChartStart.setHours(
  0, 0, 0, 0
);

for (let i = 0; i < 7; i++) {

  const dayStart =
    new Date(
      activityChartStart
    );

  dayStart.setDate(
    dayStart.getDate() + i
  );

  const dayEnd =
    new Date(
      dayStart
    );

  dayEnd.setDate(
    dayEnd.getDate() + 1
  );

  const caloriesForDay =
    entries
      .filter(entry => {

        const entryDate =
          new Date(
            entry.performed_at
          );

        return (
          entryDate >= dayStart &&
          entryDate < dayEnd
        );

      })
      .reduce(
        (total, entry) =>
          total +
          Number(
            entry.calories_burned
          ),
        0
      );

  activityChartLabels.push(
    dayStart.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short"
      }
    )
  );

  activityChartValues.push(
    Math.round(
      caloriesForDay
    )
  );

}

  drawActivityChart(
  activityChartLabels,
  activityChartValues
);


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


 const sevenDaysAgo =
  new Date();

sevenDaysAgo.setDate(
  sevenDaysAgo.getDate() - 6
);

sevenDaysAgo.setHours(
  0, 0, 0, 0
);

  let burnedToday = 0;
  let burned7Days = 0;


  entries.forEach(entry => {

    const activityTime =
      new Date(
        entry.performed_at
      );

    const calories =
      Number(
        entry.calories_burned
      ) || 0;


    if (
      activityTime >= startToday &&
      activityTime <= now
    ) {

      burnedToday +=
        calories;

    }


    if (
      activityTime >= sevenDaysAgo &&
      activityTime <= now
    ) {

      burned7Days +=
        calories;

    }

  });


  activityToday.textContent =
    Math.round(burnedToday) +
    " kcal";

  summaryActivityToday.textContent =
  Math.round(burnedToday) +
  " kcal";


  activity7Days.textContent =
    Math.round(burned7Days) +
    " kcal";

    // --------------------------------------
  // ACTIVITY HISTORY
  // --------------------------------------

  activityHistory.innerHTML =
    "";


  if (entries.length === 0) {

    activityHistory.innerHTML =
      "<p>No activities yet.</p>";

    return;
  }


  const activityNames = {
    walking: "Walking",
    brisk_walking: "Brisk Walking",
    cycling: "Cycling",
    swimming: "Swimming",
    gym: "Gym / General Exercise"
  };


  entries.forEach(entry => {

    const card =
      document.createElement(
        "div"
      );

    card.className =
      "history-card";


    const date =
      new Date(
        entry.performed_at
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


    const name =
      activityNames[
        entry.activity_type
      ] ||
      entry.activity_type;


    card.innerHTML =
      "<div>" +

        "<strong>" +
          name +
        "</strong>" +

        "<div class='history-time'>" +
          Math.round(
            Number(
              entry.duration_minutes
            )
          ) +
          " min · " +
          dateText +
          " · " +
          timeText +
        "</div>" +

      "</div>" +

            "<div class='history-right'>" +

        "<strong>" +
          Math.round(
            Number(
              entry.calories_burned
            )
          ) +
          " kcal" +
        "</strong>" +

        "<button " +
          "class='delete-entry-btn' " +
          "onclick='deleteActivity(" +
          entry.id +
          ")'>" +
          "Delete" +
        "</button>" +

      "</div>";

    activityHistory.appendChild(
      card
    );

  });
  
}

// ----------------------------------------
// DELETE ACTIVITY
// ----------------------------------------

async function deleteActivity(id) {

  const confirmed =
    confirm(
      "Delete this activity?"
    );

  if (!confirmed) {
    return;
  }


  const { error } =
    await db
      .from("activity_entries")
      .delete()
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(error);

    alert(
      "Unable to delete activity."
    );

    return;
  }


  await loadActivities();
  await updateTodayDeficit();

}

loadActivities();

// ========================================
// ENERGY SUMMARY
// ========================================

const AGE = 38;
const SEX = "male";

const summaryWeight =
  document.getElementById(
    "summaryWeight"
  );

const summaryBMR =
  document.getElementById(
    "summaryBMR"
  );

const summaryLastFast =
  document.getElementById(
    "summaryLastFast"
  );

const summaryAverageFast =
  document.getElementById(
    "summaryAverageFast"
  );

const summaryLongestFast =
  document.getElementById(
    "summaryLongestFast"
  );

async function loadFastingSummary() {

  const { data, error } =
    await db
      .from("fasting_sessions")
      .select(
        "started_at, ended_at"
      )
      .not(
        "ended_at",
        "is",
        null
      )
      .order(
        "ended_at",
        {
          ascending: false
        }
      );

  if (error) {
    console.error(error);
    return;
  }

  const sessions =
    data || [];

  if (
    sessions.length === 0
  ) {

    summaryLastFast.textContent =
      "—";

    summaryAverageFast.textContent =
      "—";

    summaryLongestFast.textContent =
      "—";

    return;
  }

    const durations =
    sessions.map(
      session => {

        const start =
          new Date(
            session.started_at
          );

        const end =
          new Date(
            session.ended_at
          );

        return (
          end - start
        );

      }
    );
    const lastFast =
    durations[0];

  const averageFast =
    durations.reduce(
      (total, duration) =>
        total + duration,
      0
    ) /
    durations.length;

  const longestFast =
    Math.max(
      ...durations
    );
    function formatSummaryDuration(
    milliseconds
  ) {

    const totalMinutes =
      Math.round(
        milliseconds /
        (1000 * 60)
      );

    const hours =
      Math.floor(
        totalMinutes / 60
      );

    const minutes =
      totalMinutes % 60;

    return (
      hours +
      "h " +
      minutes +
      "m"
    );
  }
    summaryLastFast.textContent =
    formatSummaryDuration(
      lastFast
    );

  summaryAverageFast.textContent =
    formatSummaryDuration(
      averageFast
    );

  summaryLongestFast.textContent =
    formatSummaryDuration(
      longestFast
    );
}

loadFastingSummary();

const bmrDisplay =
  document.getElementById(
    "bmrDisplay"
  );

const summaryTDEE =
  document.getElementById(
    "summaryTDEE"
  );

const summaryDeficitToday =
  document.getElementById(
    "summaryDeficitToday"
  );

const summaryDeficit7Days =
  document.getElementById(
    "summaryDeficit7Days"
  );

const summaryDeficit30Days =
  document.getElementById(
    "summaryDeficit30Days"
  );

const estimatedWeightEquivalent =
  document.getElementById(
    "estimatedWeightEquivalent"
  );

const weightEquivalentLabel =
  document.getElementById(
    "weightEquivalentLabel"
  );

const summary7DaysLabel =
  document.getElementById(
    "summary7DaysLabel"
  );

const summary30DaysLabel =
  document.getElementById(
    "summary30DaysLabel"
  );

const activityLevel =
  document.getElementById(
    "activityLevel"
  );

const goalWeight =
  document.getElementById(
    "goalWeight"
  );

const saveGoalWeightBtn =
  document.getElementById(
    "saveGoalWeightBtn"
  );

const goalWeightMessage =
  document.getElementById(
    "goalWeightMessage"
  );


// ----------------------------------------
// CALCULATE BMR
// ----------------------------------------

function calculateBMR(
  weightKg
) {

  const bmr =
    (
      10 * weightKg
    ) +
    (
      6.25 * HEIGHT_CM
    ) -
    (
      5 * AGE
    ) +
    5;


  return Math.round(
    bmr
  );

}


// ----------------------------------------
// LOAD ENERGY SUMMARY
// ----------------------------------------

async function loadEnergySummary() {

  const weight =
    await getLatestWeight();

  const bmr =
    calculateBMR(
      weight
    );


  summaryWeight.textContent =
    weight.toFixed(1) +
    " kg";


  summaryBMR.textContent =
    bmr +
    " kcal";


  bmrDisplay.textContent =
    bmr;
  const activityMultiplier =
  Number(
    activityLevel.value
  );


const tdee =
  Math.round(
    bmr *
    activityMultiplier
  );


summaryTDEE.textContent =
  tdee +
  " kcal";

}

const savedGoalWeight =
  localStorage.getItem(
    "weightJourneyGoalWeight"
  );

if (savedGoalWeight) {

  goalWeight.value =
    savedGoalWeight;

}

saveGoalWeightBtn.addEventListener(
  "click",
  () => {

    const value =
      Number(
        goalWeight.value
      );

    if (
      !value ||
      value <= 0
    ) {

      goalWeightMessage.textContent =
        "Please enter a valid goal weight.";

      return;
    }

    localStorage.setItem(
      "weightJourneyGoalWeight",
      value
    );

    goalWeightMessage.textContent =
      "Goal weight saved.";

  }
);

const savedActivityLevel =
  localStorage.getItem(
    "weightJourneyActivityLevel"
  );


if (savedActivityLevel) {

  activityLevel.value =
    savedActivityLevel;

}


activityLevel.addEventListener(
  "change",
  () => {

    localStorage.setItem(
      "weightJourneyActivityLevel",
      activityLevel.value
    );

    loadEnergySummary();
    updateTodayDeficit();
    loadCalories();

  }
);


loadEnergySummary();

async function updateTodayDeficit() {

  const { data: weightHistory } =
  await db
    .from("weight_entries")
    .select(
      "weight_kg, recorded_at"
    )
    .order(
      "recorded_at",
      {
        ascending: true
      }
    );

    function getHistoricalWeight(
    targetDate
  ) {

    let historicalWeight =
      STARTING_WEIGHT;

    (weightHistory || [])
      .forEach(entry => {

        const entryDate =
          new Date(
            entry.recorded_at
          );

        if (
          entryDate <= targetDate
        ) {

          historicalWeight =
            Number(
              entry.weight_kg
            );

        }

      });

    return historicalWeight;

  }
  
  const weight =
    await getLatestWeight();

  const bmr =
    calculateBMR(weight);

  const multiplier =
    Number(
      activityLevel.value
    );

  const dailyExpenditure =
    bmr * multiplier;


  // Burn accumulated so far today
  const now =
    new Date();

  const startToday =
    new Date();

  startToday.setHours(
    0, 0, 0, 0
  );

  const sevenDaysAgo =
  new Date(
    now.getTime() -
    (7 * 24 * 60 * 60 * 1000)
  );


const thirtyDaysAgo =
  new Date(
    now.getTime() -
    (30 * 24 * 60 * 60 * 1000)
  );

  const dayFraction =
    (now - startToday) /
    (24 * 60 * 60 * 1000);

  const baselineBurnSoFar =
    dailyExpenditure *
    dayFraction;

  // Calories eaten today

const { data: foodData } =
  await db
   .from("calorie_entries")
.select("calories,eaten_at")
.gte(
  "eaten_at",
  thirtyDaysAgo.toISOString()
)
.lte(
  "eaten_at",
  now.toISOString()
);

const caloriesEatenToday =
  (foodData || [])
    .filter(
      entry =>
        new Date(
          entry.eaten_at
        ) >= startToday
    )
    .reduce(
      (total, entry) =>
        total +
        Number(entry.calories),
      0
    );
  const caloriesEaten7Days =
  (foodData || [])
    .filter(
      entry =>
        new Date(
          entry.eaten_at
        ) >= sevenDaysAgo
    )
    .reduce(
      (total, entry) =>
        total +
        Number(entry.calories),
      0
    );


const caloriesEaten30Days =
  (foodData || [])
    .reduce(
      (total, entry) =>
        total +
        Number(entry.calories),
      0
    );

  const foodDates =
  (foodData || [])
    .map(
      entry =>
        new Date(entry.eaten_at)
    );


const firstFoodDate =
  foodDates.length
    ? new Date(
        Math.min(
          ...foodDates.map(
            date => date.getTime()
          )
        )
      )
    : null;

  const trackingStart7Days =
  firstFoodDate &&
  firstFoodDate > sevenDaysAgo
    ? firstFoodDate
    : sevenDaysAgo;


const trackingStart30Days =
  firstFoodDate &&
  firstFoodDate > thirtyDaysAgo
    ? firstFoodDate
    : thirtyDaysAgo;


const trackedDays7 =
  firstFoodDate
    ? (
        now -
        trackingStart7Days
      ) /
      (
        24 *
        60 *
        60 *
        1000
      )
    : 0;


const trackedDays30 =
  firstFoodDate
    ? (
        now -
        trackingStart30Days
      ) /
      (
        24 *
        60 *
        60 *
        1000
      )
    : 0;
  
  // Logged activity today

const { data: activityData } =
  await db
 .from("activity_entries")
.select(
  "calories_burned,duration_minutes,performed_at"
)
.gte(
  "performed_at",
  thirtyDaysAgo.toISOString()
)
.lte(
  "performed_at",
  now.toISOString()
);


let extraActivityToday =
  0;

let extraActivity7Days =
  0;

let extraActivity30Days =
  0;


(activityData || []).forEach(
  activity => {

    const grossBurn =
      Number(
        activity.calories_burned
      );

    const minutes =
      Number(
        activity.duration_minutes
      );


    // Normal expenditure already included
    // during these minutes

    const normalBurnDuringActivity =
      (
        dailyExpenditure /
        1440
      ) *
      minutes;


    const extraBurn =
      Math.max(
        0,
        grossBurn -
        normalBurnDuringActivity
      );


const activityTime =
  new Date(
    activity.performed_at
  );


if (
  activityTime >= startToday
) {

  extraActivityToday +=
    extraBurn;

}


if (
  firstFoodDate &&
  activityTime >= trackingStart7Days
) {

  extraActivity7Days +=
    extraBurn;

}


if (
  firstFoodDate &&
  activityTime >= trackingStart30Days
) {

  extraActivity30Days +=
    extraBurn;

}

  }
);
// Total estimated burn so far today

const totalBurnSoFar =
  baselineBurnSoFar +
  extraActivityToday;


// Estimated deficit so far today

const deficitToday =
  totalBurnSoFar -
  caloriesEatenToday;

  // Estimated deficit for last 7 days

let historicalBaseline7Days = 0;
let historicalBaseline30Days = 0;

if (firstFoodDate) {

  const baselineStart =
    new Date(
      trackingStart30Days
    );

  const baselineEnd =
    new Date();

  baselineStart.setHours(
    0, 0, 0, 0
  );

  baselineEnd.setHours(
    0, 0, 0, 0
  );

for (
  let day =
    new Date(baselineStart);

  day <= baselineEnd;

  day.setDate(
    day.getDate() + 1
  )
) {

  const dayStart =
    new Date(day);

  const weightForDay =
    getHistoricalWeight(
      dayStart
    );

  const bmrForDay =
    calculateBMR(
      weightForDay
    );

  const expenditureForDay =
    bmrForDay *
    multiplier;

  const dayEnd =
  new Date(
    dayStart
  );

dayEnd.setDate(
  dayEnd.getDate() + 1
);

const effectiveStart =
  dayStart <
  trackingStart30Days
    ? trackingStart30Days
    : dayStart;

const effectiveEnd =
  dayEnd > now
    ? now
    : dayEnd;

const fractionOfDay =
  Math.max(
    0,
    (
      effectiveEnd -
      effectiveStart
    ) /
    (
      24 *
      60 *
      60 *
      1000
    )
  );

historicalBaseline30Days +=
  expenditureForDay *
  fractionOfDay;

const sevenDayEffectiveStart =
  dayStart <
  trackingStart7Days
    ? trackingStart7Days
    : dayStart;

const sevenDayEffectiveEnd =
  dayEnd > now
    ? now
    : dayEnd;

const sevenDayFraction =
  Math.max(
    0,
    (
      sevenDayEffectiveEnd -
      sevenDayEffectiveStart
    ) /
    (
      24 *
      60 *
      60 *
      1000
    )
  );

if (
  dayEnd >
  trackingStart7Days
) {

  historicalBaseline7Days +=
    expenditureForDay *
    sevenDayFraction;

}
  
}

}
  
const totalBurn7Days =
  historicalBaseline7Days +
  extraActivity7Days;


const deficit7Days =
  totalBurn7Days -
  caloriesEaten7Days;

  // Estimated deficit for last 30 days

const totalBurn30Days =
  historicalBaseline30Days +
  extraActivity30Days;

const deficit30Days =
  totalBurn30Days -
  caloriesEaten30Days;

const weightEquivalentKg =
  deficit30Days /
  7700;

// Daily deficit chart data

const deficitLabels =
  [];

const deficitValues =
  [];

if (firstFoodDate) {

  const chartStartDate =
    new Date(
      trackingStart30Days
    );

  chartStartDate.setHours(
    0, 0, 0, 0
  );


  const chartEndDate =
    new Date();

  chartEndDate.setHours(
    0, 0, 0, 0
  );

  for (
  let day =
    new Date(chartStartDate);

  day <= chartEndDate;

  day.setDate(
    day.getDate() + 1
  )
) {

  const dayStart =
    new Date(day);

  const dayEnd =
    new Date(day);

      const weightForDay =
    getHistoricalWeight(
      dayStart
    );

  const bmrForDay =
    calculateBMR(
      weightForDay
    );

  const expenditureForDay =
    bmrForDay *
    multiplier;
    
  dayEnd.setDate(
    dayEnd.getDate() + 1
  );

    const foodForDay =
  (foodData || [])
    .filter(
      entry => {

        const entryDate =
          new Date(
            entry.eaten_at
          );

        return (
          entryDate >= dayStart &&
          entryDate < dayEnd
        );

      }
    )
    .reduce(
      (total, entry) =>
        total +
        Number(entry.calories),
      0
    );

  let extraActivityForDay =
  0;


(activityData || [])
  .filter(
    activity => {

      const activityTime =
        new Date(
          activity.performed_at
        );

      return (
        activityTime >= dayStart &&
        activityTime < dayEnd
      );

    }
  )
  .forEach(
    activity => {

      const grossBurn =
        Number(
          activity.calories_burned
        );

      const minutes =
        Number(
          activity.duration_minutes
        );


      const normalBurn =
        (
          dailyExpenditure /
          1440
        ) *
        minutes;


      extraActivityForDay +=
        Math.max(
          0,
          grossBurn -
          normalBurn
        );

    }
  );

    let baselineForDay =
  dailyExpenditure;


// Today is only a partial day,
// so count expenditure up to the current time

if (
  dayStart.getTime() ===
  chartEndDate.getTime()
) {

  baselineForDay =
    expenditureForDay *
    dayFraction;

}

const deficitForDay =
  baselineForDay +
  extraActivityForDay -
  foodForDay;


deficitValues.push(
  Math.round(
    deficitForDay
  )
);

  deficitLabels.push(
    dayStart.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short"
      }
    )
    );

}


// Draw the deficit graph

drawDeficitChart(
  deficitLabels,
  deficitValues
);

}

summaryDeficitToday.textContent =
  Math.round(deficitToday) +
  " kcal";

  summaryDeficit7Days.textContent =
  Math.round(deficit7Days) +
  " kcal";

  summaryDeficit30Days.textContent =
  Math.round(deficit30Days) +
  " kcal";

 if (weightEquivalentKg >= 0) {

  estimatedWeightEquivalent.textContent =
    weightEquivalentKg.toFixed(2) +
    " kg loss";

} else {

  estimatedWeightEquivalent.textContent =
    Math.abs(
      weightEquivalentKg
    ).toFixed(2) +
    " kg gain";

}
  
const displayDays7 =
  Math.min(
    7,
    trackedDays7
  );

const displayDays30 =
  Math.min(30, trackedDays30);

weightEquivalentLabel.textContent =
  "Weight Equivalent — " +
  displayDays30.toFixed(1) +
  " days tracked";


summary7DaysLabel.textContent =
  displayDays7 < 7
    ? "Deficit — " +
      displayDays7.toFixed(1) +
      " days tracked"
    : "Deficit — Last 7 Days";


summary30DaysLabel.textContent =
  displayDays30 < 30
    ? "Deficit — " +
      displayDays30.toFixed(1) +
      " days tracked"
    : "Deficit — Last 30 Days";
}

updateTodayDeficit();

function drawDeficitChart(
  labels,
  values
) {

  const canvas =
    document.getElementById(
      "deficitChart"
    );


  if (!canvas) {
    return;
  }


  if (deficitChartInstance) {

    deficitChartInstance.destroy();

  }


  deficitChartInstance =
    new Chart(
      canvas,
      {
        type: "line",

        data: {
          labels: labels,

          datasets: [
            {
              label:
                "Daily Deficit (kcal)",

              data: values,

              tension: 0.3
            }
          ]
        },

        options: {
          responsive: true,

          scales: {
            y: {
              beginAtZero: false
              }
            }
          }
        }
      );
  
  }

// ========================================
// CALORIE INTAKE CHART
// ========================================


function drawCalorieChart(
  labels,
  values,
  dailyExpenditure
) {

  const canvas =
    document.getElementById(
      "calorieChart"
    );


  if (!canvas) {
    return;
  }


  if (calorieChartInstance) {

    calorieChartInstance.destroy();

  }


  calorieChartInstance =
    new Chart(
      canvas,
      {
        type: "bar",

        data: {
          labels: labels,

          datasets: [
  {
    label:
      "Calories Eaten",

    data: values
  },

  {
    label:
      "Daily Expenditure",

    data:
      labels.map(
        () =>
          dailyExpenditure
      ),

    type: "line",

    tension: 0,

    pointRadius: 0
  }
]
        },

        options: {
          responsive: true,

          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      }
    );

}

function drawActivityChart(
  labels,
  values
) {

  const canvas =
    document.getElementById(
      "activityChart"
    );

  if (!canvas) {
    return;
  }

  if (activityChartInstance) {
    activityChartInstance.destroy();
  }

  activityChartInstance =
    new Chart(
      canvas,
      {
        type: "bar",

        data: {
          labels: labels,

          datasets: [
            {
              label:
                "Activity Calories",

              data: values
            }
          ]
        },

        options: {
          responsive: true,

          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      }
    );

}
