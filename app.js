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

    tabs.forEach(item => {
      item.classList.remove("active");
    });

    tabContents.forEach(section => {
      section.classList.remove("active");
    });

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

  await loadFastingHistory();
  await loadFastingSummary();

}


// ----------------------------------------
// FASTING BUTTONS
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
      .not(
        "ended_at",
        "is",
        null
      )
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

    lastFast.textContent =
      "—";

    averageFast.textContent =
      "—";

    longestFast.textContent =
      "—";

    return;
  }

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


// ========================================
// WEIGHT TRACKING
// ========================================

const STARTING_WEIGHT = 167;
const HEIGHT_CM = 180;
const GOAL_WEIGHT = 80;

const weightInput =
  document.getElementById(
    "weightInput"
  );

const weightDate =
  document.getElementById(
    "weightDate"
  );

const saveWeightBtn =
  document.getElementById(
    "saveWeightBtn"
  );

const weightMessage =
  document.getElementById(
    "weightMessage"
  );

const currentWeight =
  document.getElementById(
    "currentWeight"
  );

const weightLost =
  document.getElementById(
    "weightLost"
  );

const weightToGoal =
  document.getElementById(
    "weightToGoal"
  );

const goalProgressText =
  document.getElementById(
    "goalProgressText"
  );

const goalProgressBar =
  document.getElementById(
    "goalProgressBar"
  );

const weightLossPercent =
  document.getElementById(
    "weightLossPercent"
  );

const currentBMI =
  document.getElementById(
    "currentBMI"
  );

const weightChange =
  document.getElementById(
    "weightChange"
  );

const weightHistory =
  document.getElementById(
    "weightHistory"
  );


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
    Number(
      weightInput.value
    );

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
  await updateTodayDeficit();

}


// ----------------------------------------
// CHART INSTANCES
// ----------------------------------------

let weightChartInstance = null;
let deficitChartInstance = null;
let calorieChartInstance = null;
let activityChartInstance = null;


// ----------------------------------------
// WEIGHT CHART
// ----------------------------------------

function drawWeightChart(entries) {

  const canvas =
    document.getElementById(
      "weightChart"
    );

  if (!canvas) {
    return;
  }

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


// ----------------------------------------
// LOAD WEIGHTS
// ----------------------------------------

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

    weightToGoal.textContent =
      "—";

    weightLossPercent.textContent =
      "—";

    currentBMI.textContent =
      "—";

    weightChange.textContent =
      "No weight recorded yet";

    goalProgressBar.value =
      0;

    goalProgressText.textContent =
      "No weight recorded yet";

    weightHistory.innerHTML =
      "<p>No weight entries yet.</p>";

    drawWeightChart([]);

    return;
  }


  const latestWeight =
    Number(
      data[0].weight_kg
    );


  currentWeight.textContent =
    latestWeight.toFixed(1);


  const lost =
    STARTING_WEIGHT -
    latestWeight;

  weightLost.textContent =
    lost.toFixed(1) +
    " kg";


  const toGoal =
    latestWeight -
    GOAL_WEIGHT;

  const totalGoalLoss =
    STARTING_WEIGHT -
    GOAL_WEIGHT;

  const progressMade =
    STARTING_WEIGHT -
    latestWeight;

  const goalProgress =
    totalGoalLoss > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (
              progressMade /
              totalGoalLoss
            ) * 100
          )
        )
      : 0;


  goalProgressBar.value =
    goalProgress;

  goalProgressText.textContent =
    goalProgress.toFixed(1) +
    "% complete";


  if (toGoal > 0) {

    weightToGoal.textContent =
      toGoal.toFixed(1) +
      " kg";

  } else {

    weightToGoal.textContent =
      "Goal reached";

  }


  const percentageLost =
    (
      lost /
      STARTING_WEIGHT
    ) * 100;

  weightLossPercent.textContent =
    percentageLost.toFixed(1) +
    "%";


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


  drawWeightChart(data);


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
  await updateTodayDeficit();

}


saveWeightBtn.addEventListener(
  "click",
  saveWeight
);


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
        description:
          description || null,
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
    new Date();

  sevenDaysAgo.setDate(
    sevenDaysAgo.getDate() - 6
  );

  sevenDaysAgo.setHours(
    0,
    0,
    0,
    0
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
          entry => {

            const date =
              new Date(
                entry.eaten_at
              );

            return (
              date >= sevenDaysAgo &&
              date <= now
            );

          }
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


  const calorieChartLabels =
    [];

  const calorieChartValues =
    [];


  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const dayStart =
      new Date(
        sevenDaysAgo
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
            Number(
              entry.calories
            ),
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


  const latestWeight =
    await getLatestWeight();

  const currentBMR =
    calculateBMR(
      latestWeight
    );

  const calorieChartExpenditure =
    Math.round(
      currentBMR *
      ACTIVITY_MULTIPLIER
    );


  drawCalorieChart(
    calorieChartLabels,
    calorieChartValues,
    calorieChartExpenditure
  );


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
            Number(
              entry.calories
            )
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


  const activityChartLabels =
    [];

  const activityChartValues =
    [];


  const activityChartStart =
    new Date();

  activityChartStart.setDate(
    activityChartStart.getDate() - 6
  );

  activityChartStart.setHours(
    0,
    0,
    0,
    0
  );


  for (
    let i = 0;
    i < 7;
    i++
  ) {

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
    0,
    0,
    0,
    0
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
    Math.round(
      burnedToday
    ) +
    " kcal";


  summaryActivityToday.textContent =
    Math.round(
      burnedToday
    ) +
    " kcal";


  activity7Days.textContent =
    Math.round(
      burned7Days
    ) +
    " kcal";


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


// ========================================
// SUMMARY
// ========================================

const AGE = 38;

const ACTIVITY_MULTIPLIER = 1.3;


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


// ----------------------------------------
// FASTING SUMMARY
// ----------------------------------------

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

    console.error(
      "Unable to load fasting summary:",
      error
    );

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
    sessions.map(session => {

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

    });


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


// ----------------------------------------
// BMR CALCULATION
// Internal calculation only
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
// CALORIE DEFICIT SUMMARY
// ----------------------------------------

async function updateTodayDeficit() {

  const { data: weightHistory, error: weightError } =
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


  if (weightError) {

    console.error(
      "Unable to load weight history:",
      weightError
    );

    return;

  }


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
    calculateBMR(
      weight
    );


  const dailyExpenditure =
    bmr *
    ACTIVITY_MULTIPLIER;


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
    new Date(
      now.getTime() -
      (
        7 *
        24 *
        60 *
        60 *
        1000
      )
    );


  const thirtyDaysAgo =
    new Date(
      now.getTime() -
      (
        30 *
        24 *
        60 *
        60 *
        1000
      )
    );


  const dayFraction =
    (
      now -
      startToday
    ) /
    (
      24 *
      60 *
      60 *
      1000
    );


  const baselineBurnSoFar =
    dailyExpenditure *
    dayFraction;


  // --------------------------------------
  // FOOD DATA
  // --------------------------------------

  const {
    data: foodData,
    error: foodError
  } =
    await db
      .from("calorie_entries")
      .select(
        "calories, eaten_at"
      )
      .gte(
        "eaten_at",
        thirtyDaysAgo.toISOString()
      )
      .lte(
        "eaten_at",
        now.toISOString()
      );


  if (foodError) {

    console.error(
      "Unable to load calorie data:",
      foodError
    );

    return;

  }


  // --------------------------------------
  // ACTIVITY DATA
  // --------------------------------------

  const {
    data: activityData,
    error: activityError
  } =
    await db
      .from("activity_entries")
      .select(
        "calories_burned, duration_minutes, performed_at"
      )
      .gte(
        "performed_at",
        thirtyDaysAgo.toISOString()
      )
      .lte(
        "performed_at",
        now.toISOString()
      );


  if (activityError) {

    console.error(
      "Unable to load activity data:",
      activityError
    );

    return;

  }


  // --------------------------------------
  // TODAY
  // --------------------------------------

  const caloriesEatenToday =
    (foodData || [])
      .filter(entry =>

        new Date(
          entry.eaten_at
        ) >= startToday

      )
      .reduce(
        (total, entry) =>
          total +
          Number(
            entry.calories
          ),
        0
      );


  let extraActivityToday =
    0;


  (activityData || [])
    .filter(entry =>

      new Date(
        entry.performed_at
      ) >= startToday

    )
    .forEach(entry => {

      const grossBurn =
        Number(
          entry.calories_burned
        ) || 0;


      const minutes =
        Number(
          entry.duration_minutes
        ) || 0;


      const baselineForActivity =
        (
          dailyExpenditure /
          1440
        ) *
        minutes;


      const extraBurn =
        Math.max(
          0,
          grossBurn -
          baselineForActivity
        );


      extraActivityToday +=
        extraBurn;

    });


  const todayDeficit =
    baselineBurnSoFar +
    extraActivityToday -
    caloriesEatenToday;


  summaryDeficitToday.textContent =
    Math.round(
      todayDeficit
    ) +
    " kcal";


  // --------------------------------------
  // TRACKING START
  // --------------------------------------

  const foodDates =
    (foodData || [])
      .map(entry =>
        new Date(
          entry.eaten_at
        )
      );


  const firstFoodDate =
    foodDates.length
      ? new Date(
          Math.min(
            ...foodDates.map(
              date =>
                date.getTime()
            )
          )
        )
      : null;


  if (!firstFoodDate) {

    summaryDeficit7Days.textContent =
      "—";

    summaryDeficit30Days.textContent =
      "—";

    estimatedWeightEquivalent.textContent =
      "—";

    summary7DaysLabel.textContent =
      "Deficit — Last 7 Days";

    summary30DaysLabel.textContent =
      "Deficit — Last 30 Days";

    weightEquivalentLabel.textContent =
      "Weight Equivalent";

    drawDeficitChart(
      [],
      []
    );

    return;

  }


  const trackingStart =
    firstFoodDate >
    thirtyDaysAgo
      ? firstFoodDate
      : thirtyDaysAgo;


  // --------------------------------------
  // DAILY DEFICIT CALCULATION
  // --------------------------------------

  function calculateDayDeficit(
    dayStart,
    dayEnd,
    isToday = false
  ) {

    const weightForDay =
      getHistoricalWeight(
        dayEnd
      );


    const dayBMR =
      calculateBMR(
        weightForDay
      );


    const dayExpenditure =
      dayBMR *
      ACTIVITY_MULTIPLIER;


    let baselineBurn =
      dayExpenditure;


    if (isToday) {

      baselineBurn =
        dayExpenditure *
        (
          (
            now -
            dayStart
          ) /
          (
            24 *
            60 *
            60 *
            1000
          )
        );

    }


    const foodForDay =
      (foodData || [])
        .filter(entry => {

          const date =
            new Date(
              entry.eaten_at
            );


          return (
            date >= dayStart &&
            date < dayEnd
          );

        })
        .reduce(
          (total, entry) =>
            total +
            Number(
              entry.calories
            ),
          0
        );


    let extraActivity =
      0;


    (activityData || [])
      .filter(entry => {

        const date =
          new Date(
            entry.performed_at
          );


        return (
          date >= dayStart &&
          date < dayEnd
        );

      })
      .forEach(entry => {

        const grossBurn =
          Number(
            entry.calories_burned
          ) || 0;


        const minutes =
          Number(
            entry.duration_minutes
          ) || 0;


        const baselineForActivity =
          (
            dayExpenditure /
            1440
          ) *
          minutes;


        extraActivity +=
          Math.max(
            0,
            grossBurn -
            baselineForActivity
          );

      });


    return (
      baselineBurn +
      extraActivity -
      foodForDay
    );

  }


  // --------------------------------------
  // BUILD DAILY DEFICIT DATA
  // --------------------------------------

  const dailyDeficits =
    [];


  let cursor =
    new Date(
      trackingStart
    );


  cursor.setHours(
    0,
    0,
    0,
    0
  );


  while (
    cursor <= now
  ) {

    const dayStart =
      new Date(
        cursor
      );


    const nextDay =
      new Date(
        dayStart
      );

    nextDay.setDate(
      nextDay.getDate() + 1
    );


    const isToday =
      dayStart.toDateString() ===
      now.toDateString();


    const dayEnd =
      isToday
        ? now
        : nextDay;


    const deficit =
      calculateDayDeficit(
        dayStart,
        dayEnd,
        isToday
      );


    dailyDeficits.push({
      date: dayStart,
      deficit: deficit
    });


    cursor =
      nextDay;

  }


  // --------------------------------------
  // LAST 7 DAYS
  // --------------------------------------

  const last7 =
    dailyDeficits.slice(
      -7
    );


  const deficit7Days =
    last7.reduce(
      (total, day) =>
        total +
        day.deficit,
      0
    );


  // --------------------------------------
  // LAST 30 DAYS
  // --------------------------------------

  const last30 =
    dailyDeficits.slice(
      -30
    );


  const deficit30Days =
    last30.reduce(
      (total, day) =>
        total +
        day.deficit,
      0
    );


  summaryDeficit7Days.textContent =
    Math.round(
      deficit7Days
    ) +
    " kcal";


  summaryDeficit30Days.textContent =
    Math.round(
      deficit30Days
    ) +
    " kcal";


  // --------------------------------------
  // WEIGHT EQUIVALENT
  // --------------------------------------

  const weightEquivalent =
    deficit30Days /
    7700;


  estimatedWeightEquivalent.textContent =
    weightEquivalent.toFixed(2) +
    " kg";


  // --------------------------------------
  // DAYS TRACKED LABELS
  // --------------------------------------

  const trackedDays7 =
    last7.length;


  const trackedDays30 =
    last30.length;


  const displayDays7 =
    Math.min(
      7,
      trackedDays7
    );


  const displayDays30 =
    Math.min(
      30,
      trackedDays30
    );


  weightEquivalentLabel.textContent =
    "Weight Equivalent — " +
    displayDays30 +
    " days tracked";


  summary7DaysLabel.textContent =
    displayDays7 < 7
      ? "Deficit — " +
        displayDays7 +
        " days tracked"
      : "Deficit — Last 7 Days";


  summary30DaysLabel.textContent =
    displayDays30 < 30
      ? "Deficit — " +
        displayDays30 +
        " days tracked"
      : "Deficit — Last 30 Days";


  // --------------------------------------
  // DEFICIT CHART
  // --------------------------------------

  const chartDays =
    last30;


  const chartLabels =
    chartDays.map(day =>

      day.date.toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short"
        }
      )

    );


  const chartValues =
    chartDays.map(day =>

      Math.round(
        day.deficit
      )

    );


  drawDeficitChart(
    chartLabels,
    chartValues
  );

}


// ========================================
// DEFICIT CHART
// ========================================

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

              data:
                values,

              tension:
                0.3
            }
          ]

        },

        options: {

          responsive:
            true,

          scales: {

            y: {
              beginAtZero:
                false
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

          labels:
            labels,

          datasets: [

            {
              label:
                "Calories Eaten",

              data:
                values
            },

            {
              label:
                "Daily Expenditure",

              data:
                labels.map(
                  () =>
                    dailyExpenditure
                ),

              type:
                "line",

              tension:
                0,

              pointRadius:
                0
            }

          ]

        },

        options: {

          responsive:
            true,

          scales: {

            y: {
              beginAtZero:
                true
            }

          }

        }

      }
    );

}


// ========================================
// ACTIVITY CHART
// ========================================

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

          labels:
            labels,

          datasets: [
            {
              label:
                "Activity Calories",

              data:
                values
            }
          ]

        },

        options: {

          responsive:
            true,

          scales: {

            y: {
              beginAtZero:
                true
            }

          }

        }

      }
    );

}

// ========================================
// LOGIN / LOGOUT
// ========================================

const mainApp =
  document.querySelector(".app");

const loginScreen =
  document.getElementById(
    "loginScreen"
  );

const loginEmail =
  document.getElementById(
    "loginEmail"
  );

const loginPassword =
  document.getElementById(
    "loginPassword"
  );

const loginBtn =
  document.getElementById(
    "loginBtn"
  );

const loginMessage =
  document.getElementById(
    "loginMessage"
  );

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );


// ----------------------------------------
// LOAD APP AFTER LOGIN
// ----------------------------------------

async function loadAuthenticatedApp() {

  loginScreen.style.display =
    "none";

  mainApp.style.display =
    "";


  await loadActiveFast();

  await loadFastingHistory();

  await loadWeights();

  await loadCalories();

  await loadActivities();

  await loadFastingSummary();

  await updateTodayDeficit();

}


// ----------------------------------------
// CHECK EXISTING LOGIN
// ----------------------------------------

async function checkLogin() {

  const {
    data: { session },
    error
  } =
    await db.auth.getSession();


  if (error) {

    console.error(
      "Unable to check login:",
      error
    );

  }


  if (session) {

    await loadAuthenticatedApp();

  } else {

    loginScreen.style.display =
      "block";

    mainApp.style.display =
      "none";

  }

}


// ----------------------------------------
// LOGIN
// ----------------------------------------

loginBtn.addEventListener(
  "click",
  async () => {

    const email =
      loginEmail.value.trim();

    const password =
      loginPassword.value;


    if (
      !email ||
      !password
    ) {

      loginMessage.textContent =
        "Please enter your email and password.";

      return;

    }


    loginBtn.disabled =
      true;

    loginMessage.textContent =
      "Logging in...";


    const {
      data,
      error
    } =
      await db.auth
        .signInWithPassword({
          email: email,
          password: password
        });


    if (error) {

      console.error(
        "Login error:",
        error
      );

      loginMessage.textContent =
        "Unable to log in. Check your email and password.";

      loginBtn.disabled =
        false;

      return;

    }


    if (!data.session) {

      loginMessage.textContent =
        "Unable to log in.";

      loginBtn.disabled =
        false;

      return;

    }


    loginMessage.textContent =
      "";

    loginBtn.disabled =
      false;


    await loadAuthenticatedApp();

  }
);


// ----------------------------------------
// PRESS ENTER TO LOGIN
// ----------------------------------------

loginPassword.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      loginBtn.click();

    }

  }
);


// ----------------------------------------
// LOGOUT
// ----------------------------------------

logoutBtn.addEventListener(
  "click",
  async () => {

    const { error } =
      await db.auth.signOut();


    if (error) {

      console.error(
        "Logout error:",
        error
      );

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


    loginEmail.value =
      "";

    loginPassword.value =
      "";

    loginMessage.textContent =
      "";


    loginScreen.style.display =
      "block";

    mainApp.style.display =
      "none";

  }
);


// ========================================
// START APP
// ========================================

checkLogin();
