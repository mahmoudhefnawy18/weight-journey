const SUPABASE_URL = "https://epdinlgqlxfezrjjyhmk.supabase.co";
const SUPABASE_KEY = "sb_publishable_xtEL7D8kZQiPiPMuXj-5ww_ibXNJhbr";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const STARTING_WEIGHT = 167;
const HEIGHT_CM = 180;
const GOAL_WEIGHT = 80;
const AGE = 38;
const ACTIVITY_MULTIPLIER = 1.3;
const KCAL_PER_KG = 7700;

const $ = id =>
  document.getElementById(id);

const tabs =
  [...document.querySelectorAll(".tab")];

const tabContents =
  [...document.querySelectorAll(".tab-content")];

let activeFast = null;
let timerInterval = null;

let weightChartInstance = null;
let calorieChartInstance = null;
let activityChartInstance = null;
let deficitChartInstance = null;

let selectedFood = null;
let selectedActivity = null;

let foodMode = "search";


// ========================================
// DATE / TIME
// ========================================

function localDateTimeValue(
  date = new Date()
) {

  const local =
    new Date(
      date.getTime() -
      date.getTimezoneOffset() * 60000
    );

  return local
    .toISOString()
    .slice(0, 16);
}


function setDefaultDates() {

  if ($("weightDate")) {
    $("weightDate").value =
      localDateTimeValue();
  }

  if ($("foodDate")) {
    $("foodDate").value =
      localDateTimeValue();
  }

  if ($("activityDate")) {
    $("activityDate").value =
      localDateTimeValue();
  }

}


// ========================================
// TABS
// ========================================

function activateTab(name) {

  tabs.forEach(tab => {

    tab.classList.toggle(
      "active",
      tab.dataset.tab === name
    );

  });


  tabContents.forEach(section => {

    section.classList.toggle(
      "active",
      section.id === name
    );

  });


  const selectedTab =
    tabs.find(
      tab =>
        tab.dataset.tab === name
    );


  if (selectedTab) {

    selectedTab.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center"
    });

  }

}


tabs.forEach(tab => {

  tab.addEventListener(
    "click",
    () => {

      activateTab(
        tab.dataset.tab
      );

    }
  );

});


// ========================================
// SWIPE BETWEEN TABS
// ========================================

let touchStartX = 0;
let touchStartY = 0;
let touchTarget = null;


document.addEventListener(
  "touchstart",
  event => {

    if (!event.touches.length) {
      return;
    }

    touchStartX =
      event.touches[0].clientX;

    touchStartY =
      event.touches[0].clientY;

    touchTarget =
      event.target;

  },
  {
    passive: true
  }
);


document.addEventListener(
  "touchend",
  event => {

    if (
      !event.changedTouches.length ||
      !touchTarget
    ) {
      return;
    }


    if (
      touchTarget.closest(
        "input, select, textarea, button, .suggestions, canvas"
      )
    ) {
      return;
    }


    const endX =
      event.changedTouches[0].clientX;

    const endY =
      event.changedTouches[0].clientY;


    const dx =
      endX - touchStartX;

    const dy =
      endY - touchStartY;


    if (
      Math.abs(dx) < 60 ||
      Math.abs(dx) <=
        Math.abs(dy) * 1.2
    ) {
      return;
    }


    const currentIndex =
      tabs.findIndex(
        tab =>
          tab.classList.contains(
            "active"
          )
      );


    const nextIndex =
      dx < 0
        ? currentIndex + 1
        : currentIndex - 1;


    if (
      nextIndex >= 0 &&
      nextIndex < tabs.length
    ) {

      activateTab(
        tabs[nextIndex].dataset.tab
      );

    }

  },
  {
    passive: true
  }
);


// ========================================
// FASTING
// ========================================

function formatFastDuration(
  startTime
) {

  const seconds =
    Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          new Date(
            startTime
          ).getTime()
        ) / 1000
      )
    );


  const hours =
    Math.floor(
      seconds / 3600
    );


  const minutes =
    Math.floor(
      (
        seconds % 3600
      ) / 60
    );


  const remainingSeconds =
    seconds % 60;


  return (
    String(hours).padStart(
      2,
      "0"
    ) +
    ":" +
    String(minutes).padStart(
      2,
      "0"
    ) +
    ":" +
    String(
      remainingSeconds
    ).padStart(
      2,
      "0"
    )
  );

}


function formatMinutes(
  minutes
) {

  const totalMinutes =
    Math.max(
      0,
      Math.round(minutes)
    );


  const hours =
    Math.floor(
      totalMinutes / 60
    );


  const mins =
    totalMinutes % 60;


  return (
    hours +
    "h " +
    mins +
    "m"
  );

}


// ----------------------------------------
// LIVE FAST TIMER
// ----------------------------------------

function updateFastTimer() {

  if (!activeFast) {
    return;
  }


  const duration =
    formatFastDuration(
      activeFast.started_at
    );


  $("fastTimer").textContent =
    duration;


  $("summaryCurrentFast").textContent =
    duration;

}


// ----------------------------------------
// SHOW ACTIVE FAST
// ----------------------------------------

function showActiveFast() {

  $("fastStatus").textContent =
    "Fasting";


  $("startFastBtn").hidden =
    true;


  $("stopFastBtn").hidden =
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

  const button =
    $("startFastBtn");


  button.disabled =
    true;


  button.textContent =
    "Starting...";


  const {
    data,
    error
  } =
    await db
      .from(
        "fasting_sessions"
      )
      .insert({
        started_at:
          new Date()
            .toISOString()
      })
      .select()
      .single();


  button.disabled =
    false;


  button.textContent =
    "▶ Start Fast";


  if (error) {

    console.error(error);

    alert(
      "Unable to start fast."
    );

    return;

  }


  activeFast =
    data;


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


  const button =
    $("stopFastBtn");


  button.disabled =
    true;


  button.textContent =
    "Stopping...";


  const {
    error
  } =
    await db
      .from(
        "fasting_sessions"
      )
      .update({
        ended_at:
          new Date()
            .toISOString()
      })
      .eq(
        "id",
        activeFast.id
      );


  button.disabled =
    false;


  button.textContent =
    "■ Stop Fast";


  if (error) {

    console.error(error);

    alert(
      "Unable to stop fast."
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


  $("fastTimer").textContent =
    "00:00:00";


  $("fastStatus").textContent =
    "Not fasting";


  $("summaryCurrentFast").textContent =
    "Not fasting";


  button.hidden =
    true;


  $("startFastBtn").hidden =
    false;


  await loadFastingHistory();

}


// ----------------------------------------
// LOAD CURRENT FAST
// ----------------------------------------

async function loadActiveFast() {

  const {
    data,
    error
  } =
    await db
      .from(
        "fasting_sessions"
      )
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


  activeFast =
    data || null;


  if (activeFast) {

    showActiveFast();

  } else {

    $("fastTimer").textContent =
      "00:00:00";


    $("fastStatus").textContent =
      "Not fasting";


    $("summaryCurrentFast").textContent =
      "Not fasting";


    $("startFastBtn").hidden =
      false;


    $("stopFastBtn").hidden =
      true;

  }

}


// ----------------------------------------
// FASTING HISTORY + SUMMARY
// ----------------------------------------

async function loadFastingHistory() {

  const {
    data,
    error
  } =
    await db
      .from(
        "fasting_sessions"
      )
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

    return;

  }


  const sessions =
    (data || [])
      .map(
        session => {

          const start =
            new Date(
              session.started_at
            );


          const end =
            new Date(
              session.ended_at
            );


          return {
            ...session,
            start,
            end,
            minutes:
              Math.round(
                (
                  end -
                  start
                ) /
                60000
              )
          };

        }
      );


  $("lastFast").textContent =
    sessions.length
      ? formatMinutes(
          sessions[0].minutes
        )
      : "—";


  $("averageFast").textContent =
    sessions.length
      ? formatMinutes(
          sessions.reduce(
            (
              total,
              session
            ) =>
              total +
              session.minutes,
            0
          ) /
          sessions.length
        )
      : "—";


  $("longestFast").textContent =
    sessions.length
      ? formatMinutes(
          Math.max(
            ...sessions.map(
              session =>
                session.minutes
            )
          )
        )
      : "—";


  const area =
    $("fastingHistory");


  area.innerHTML =
    sessions.length
      ? ""
      : "<p>No completed fasts yet.</p>";


  sessions.forEach(
    session => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "history-card";


      card.innerHTML =
        `
        <div>
          <strong>
            ${session.start.toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "short",
                year: "numeric"
              }
            )}
          </strong>

          <div class="history-time">
            ${session.start.toLocaleTimeString(
              "en-GB",
              {
                hour: "2-digit",
                minute: "2-digit"
              }
            )}
            →
            ${session.end.toLocaleTimeString(
              "en-GB",
              {
                hour: "2-digit",
                minute: "2-digit"
              }
            )}
          </div>
        </div>

        <div class="history-right">
          <strong>
            ${formatMinutes(
              session.minutes
            )}
          </strong>

          <button
            type="button"
            class="delete-entry-btn"
            data-delete-fast="${session.id}"
          >
            Delete
          </button>
        </div>
        `;


      area.appendChild(
        card
      );

    }
  );

}


// ----------------------------------------
// DELETE FAST
// ----------------------------------------

async function deleteFast(id) {

  const confirmed =
    confirm(
      "Delete this fasting session?"
    );


  if (!confirmed) {
    return;
  }


  const {
    error
  } =
    await db
      .from(
        "fasting_sessions"
      )
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

}


// ========================================
// WEIGHT
// ========================================

function calculateBMR(
  weightKg
) {

  return Math.round(
    (
      10 * weightKg
    ) +
    (
      6.25 * HEIGHT_CM
    ) -
    (
      5 * AGE
    ) +
    5
  );

}


async function getLatestWeight() {

  const {
    data
  } =
    await db
      .from(
        "weight_entries"
      )
      .select(
        "weight_kg"
      )
      .order(
        "recorded_at",
        {
          ascending: false
        }
      )
      .limit(1)
      .maybeSingle();


  return data
    ? Number(
        data.weight_kg
      )
    : STARTING_WEIGHT;

}
// ----------------------------------------
// SAVE WEIGHT
// ----------------------------------------

async function saveWeight() {

  const weight =
    Number(
      $("weightInput").value
    );


  if (
    !weight ||
    weight <= 0
  ) {

    $("weightMessage").textContent =
      "Please enter a valid weight.";

    return;

  }


  const button =
    $("saveWeightBtn");


  button.disabled =
    true;


  button.textContent =
    "Saving...";


  const {
    error
  } =
    await db
      .from(
        "weight_entries"
      )
      .insert({
        weight_kg:
          weight,

        recorded_at:
          $("weightDate").value
            ? new Date(
                $("weightDate").value
              ).toISOString()
            : new Date()
                .toISOString()
      });


  button.disabled =
    false;


  button.textContent =
    "Save Weight";


  if (error) {

    console.error(error);

    $("weightMessage").textContent =
      "Unable to save weight.";

    return;

  }


  $("weightInput").value =
    "";


  $("weightDate").value =
    localDateTimeValue();


  $("weightMessage").textContent =
    "Weight saved";


  await loadWeights();

  await updateTodayDeficit();

}


// ----------------------------------------
// WEIGHT CHART
// ----------------------------------------

function drawWeightChart(
  entries
) {

  const canvas =
    $("weightChart");


  if (!canvas) {
    return;
  }


  if (
    weightChartInstance
  ) {

    weightChartInstance.destroy();

  }


  const rows =
    [...entries]
      .reverse();


  weightChartInstance =
    new Chart(
      canvas,
      {
        type:
          "line",

        data: {

          labels:
            rows.map(
              entry =>
                new Date(
                  entry.recorded_at
                )
                  .toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short"
                    }
                  )
            ),

          datasets: [
            {
              label:
                "Weight (kg)",

              data:
                rows.map(
                  entry =>
                    Number(
                      entry.weight_kg
                    )
                ),

              tension:
                0.25,

              pointRadius:
                4
            }
          ]

        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          plugins: {

            legend: {
              display:
                false
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

  const {
    data,
    error
  } =
    await db
      .from(
        "weight_entries"
      )
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


  const rows =
    data || [];


  if (
    rows.length === 0
  ) {

    $("currentWeight").textContent =
      "—";

    $("weightLost").textContent =
      "—";

    $("weightToGoal").textContent =
      "—";

    $("weightLossPercent").textContent =
      "—";

    $("currentBMI").textContent =
      "—";

    $("weightChange").textContent =
      "No weight recorded yet";

    $("goalProgressBar").value =
      0;

    $("goalProgressText").textContent =
      "No weight recorded yet";

    $("weightHistory").innerHTML =
      "<p>No weight entries yet.</p>";

    drawWeightChart([]);

    return;

  }


  const latestWeight =
    Number(
      rows[0].weight_kg
    );


  const lost =
    STARTING_WEIGHT -
    latestWeight;


  const toGoal =
    latestWeight -
    GOAL_WEIGHT;


  const totalGoalLoss =
    STARTING_WEIGHT -
    GOAL_WEIGHT;


  const progress =
    Math.min(
      100,
      Math.max(
        0,
        (
          lost /
          totalGoalLoss
        ) *
        100
      )
    );


  $("currentWeight").textContent =
    latestWeight.toFixed(1);


  $("weightLost").textContent =
    lost.toFixed(1) +
    " kg";


  $("weightToGoal").textContent =
    toGoal > 0
      ? toGoal.toFixed(1) +
        " kg"
      : "Goal reached";


  $("weightLossPercent").textContent =
    (
      (
        lost /
        STARTING_WEIGHT
      ) *
      100
    ).toFixed(1) +
    "%";


  const heightMetres =
    HEIGHT_CM / 100;


  $("currentBMI").textContent =
    (
      latestWeight /
      (
        heightMetres *
        heightMetres
      )
    ).toFixed(1);


  $("goalProgressBar").value =
    progress;


  $("goalProgressText").textContent =
    progress.toFixed(1) +
    "% complete";


  if (
    rows.length > 1
  ) {

    const previousWeight =
      Number(
        rows[1].weight_kg
      );


    const change =
      latestWeight -
      previousWeight;


    if (
      change < 0
    ) {

      $("weightChange").textContent =
        Math.abs(
          change
        ).toFixed(1) +
        " kg down since last entry";

    } else if (
      change > 0
    ) {

      $("weightChange").textContent =
        change.toFixed(1) +
        " kg up since last entry";

    } else {

      $("weightChange").textContent =
        "No change since last entry";

    }

  } else {

    $("weightChange").textContent =
      "First weight entry";

  }


  drawWeightChart(
    rows
  );


  const area =
    $("weightHistory");


  area.innerHTML =
    "";


  rows.forEach(
    entry => {

      const date =
        new Date(
          entry.recorded_at
        );


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "history-card";


      card.innerHTML =
        `
        <div>

          <strong>
            ${date.toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "short",
                year: "numeric"
              }
            )}
          </strong>

          <div class="history-time">
            ${date.toLocaleTimeString(
              "en-GB",
              {
                hour: "2-digit",
                minute: "2-digit"
              }
            )}
          </div>

        </div>

        <div class="history-right">

          <strong>
            ${Number(
              entry.weight_kg
            ).toFixed(1)}
            kg
          </strong>

          <button
            type="button"
            class="delete-entry-btn"
            data-delete-weight="${entry.id}"
          >
            Delete
          </button>

        </div>
        `;


      area.appendChild(
        card
      );

    }
  );

}


// ----------------------------------------
// DELETE WEIGHT
// ----------------------------------------

async function deleteWeight(
  id
) {

  const confirmed =
    confirm(
      "Delete this weight entry?"
    );


  if (!confirmed) {
    return;
  }


  const {
    error
  } =
    await db
      .from(
        "weight_entries"
      )
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


// ========================================
// FOOD DATABASE
// ========================================
//
// kcal values are approximate calories
// per 100 grams for generic foods.
//

const FOODS = [

  {
    name:
      "Chicken breast, cooked",
    kcalPer100g:
      165,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Chicken thigh, cooked",
    kcalPer100g:
      209,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Chicken, roasted",
    kcalPer100g:
      190,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Turkey breast, cooked",
    kcalPer100g:
      135,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Beef, lean cooked",
    kcalPer100g:
      217,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Beef mince 5% fat, cooked",
    kcalPer100g:
      172,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Beef mince 10% fat, cooked",
    kcalPer100g:
      217,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Lamb, cooked",
    kcalPer100g:
      258,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Pork loin, cooked",
    kcalPer100g:
      242,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Salmon, cooked",
    kcalPer100g:
      206,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Tuna in water, drained",
    kcalPer100g:
      116,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Cod, cooked",
    kcalPer100g:
      105,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Prawns, cooked",
    kcalPer100g:
      99,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Egg, whole",
    kcalPer100g:
      143,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Egg white",
    kcalPer100g:
      52,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Rice, white cooked",
    kcalPer100g:
      130,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Rice, brown cooked",
    kcalPer100g:
      123,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Pasta, cooked",
    kcalPer100g:
      131,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Couscous, cooked",
    kcalPer100g:
      112,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Quinoa, cooked",
    kcalPer100g:
      120,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Oats, dry",
    kcalPer100g:
      379,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Bread, white",
    kcalPer100g:
      266,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Bread, wholemeal",
    kcalPer100g:
      247,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Pitta bread",
    kcalPer100g:
      275,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Flour tortilla / wrap",
    kcalPer100g:
      312,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Potato, boiled",
    kcalPer100g:
      87,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Potato, baked",
    kcalPer100g:
      93,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Sweet potato, cooked",
    kcalPer100g:
      90,
    source:
      "Generic food estimate"
  },

  {
    name:
      "French fries",
    kcalPer100g:
      312,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Broccoli",
    kcalPer100g:
      35,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Cauliflower",
    kcalPer100g:
      25,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Carrot",
    kcalPer100g:
      41,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Peas",
    kcalPer100g:
      81,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Sweetcorn",
    kcalPer100g:
      86,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Spinach",
    kcalPer100g:
      23,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Tomato",
    kcalPer100g:
      18,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Cucumber",
    kcalPer100g:
      15,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Lettuce",
    kcalPer100g:
      15,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Onion",
    kcalPer100g:
      40,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Mushrooms",
    kcalPer100g:
      22,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Sweet pepper",
    kcalPer100g:
      31,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Avocado",
    kcalPer100g:
      160,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Apple",
    kcalPer100g:
      52,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Banana",
    kcalPer100g:
      89,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Orange",
    kcalPer100g:
      47,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Grapes",
    kcalPer100g:
      69,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Strawberries",
    kcalPer100g:
      32,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Blueberries",
    kcalPer100g:
      57,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Mango",
    kcalPer100g:
      60,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Watermelon",
    kcalPer100g:
      30,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Dates",
    kcalPer100g:
      282,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Whole milk",
    kcalPer100g:
      61,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Semi-skimmed milk",
    kcalPer100g:
      50,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Skimmed milk",
    kcalPer100g:
      35,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Greek yogurt 0%",
    kcalPer100g:
      59,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Greek yogurt, full fat",
    kcalPer100g:
      97,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Cheddar cheese",
    kcalPer100g:
      403,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Cottage cheese",
    kcalPer100g:
      98,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Butter",
    kcalPer100g:
      717,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Olive oil",
    kcalPer100g:
      884,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Mayonnaise",
    kcalPer100g:
      680,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Peanut butter",
    kcalPer100g:
      588,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Almonds",
    kcalPer100g:
      579,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Walnuts",
    kcalPer100g:
      654,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Cashews",
    kcalPer100g:
      553,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Hummus",
    kcalPer100g:
      166,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Lentils, cooked",
    kcalPer100g:
      116,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Chickpeas, cooked",
    kcalPer100g:
      164,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Kidney beans, cooked",
    kcalPer100g:
      127,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Milk chocolate",
    kcalPer100g:
      535,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Dark chocolate",
    kcalPer100g:
      598,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Vanilla ice cream",
    kcalPer100g:
      207,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Cheese pizza",
    kcalPer100g:
      266,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Beef burger patty, cooked",
    kcalPer100g:
      250,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Pork sausage, cooked",
    kcalPer100g:
      301,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Falafel",
    kcalPer100g:
      333,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Doner kebab meat",
    kcalPer100g:
      250,
    source:
      "Generic food estimate"
  },

  {
    name:
      "Chicken shawarma",
    kcalPer100g:
      200,
    source:
      "Generic food estimate"
  }

];


// ========================================
// FOOD SEARCH
// ========================================

function showFoodSuggestions(
  foods,
  note = ""
) {

  const box =
    $("foodSearchResults");


  box.innerHTML =
    "";


  if (
    foods.length === 0
  ) {

    box.innerHTML =
      `
      <div class="suggestion-item">

        <div class="suggestion-main">

          <strong>
            No local match
          </strong>

          <small>
            ${
              note ||
              "Press Enter to search Open Food Facts"
            }
          </small>

        </div>

      </div>
      `;


    box.hidden =
      false;


    return;

  }


  foods
    .slice(
      0,
      12
    )
    .forEach(
      food => {

        const button =
          document.createElement(
            "button"
          );


        button.type =
          "button";


        button.className =
          "suggestion-item";


        button._food =
          food;


        button.innerHTML =
          `
          <span class="suggestion-main">

            <strong>
              ${food.name}
            </strong>

            <small>
              ${
                food.source ||
                "Food data"
              }
            </small>

          </span>

          <span class="suggestion-value">
            ${Math.round(
              food.kcalPer100g
            )}
            kcal/100g
          </span>
          `;


        box.appendChild(
          button
        );

      }
    );


  box.hidden =
    false;

}


// ----------------------------------------
// LOCAL FOOD SEARCH
// ----------------------------------------

function searchLocalFoods() {

  const query =
    $("foodSearchInput")
      .value
      .trim()
      .toLowerCase();


  selectedFood =
    null;


  $("selectedFoodCard").hidden =
    true;


  $("calculatedCalories").textContent =
    "— kcal";


  if (
    query.length < 2
  ) {

    $("foodSearchResults").hidden =
      true;

    return;

  }


  const words =
    query.split(
      /\s+/
    );


  const matches =
    FOODS.filter(
      food =>
        words.every(
          word =>
            food.name
              .toLowerCase()
              .includes(
                word
              )
        )
    );


  showFoodSuggestions(
    matches
  );

}


// ----------------------------------------
// ONLINE OPEN FOOD FACTS SEARCH
// Press Enter after typing to use this.
// ----------------------------------------

async function searchOpenFoodFacts(
  query
) {

  const box =
    $("foodSearchResults");


  box.hidden =
    false;


  box.innerHTML =
    `
    <div class="suggestion-item">

      <div class="suggestion-main">

        <strong>
          Searching Open Food Facts…
        </strong>

      </div>

    </div>
    `;


  try {

    const url =
      "https://world.openfoodfacts.org/cgi/search.pl" +
      "?search_terms=" +
      encodeURIComponent(
        query
      ) +
      "&search_simple=1" +
      "&action=process" +
      "&json=1" +
      "&page_size=12";


    const response =
      await fetch(
        url
      );


    if (
      !response.ok
    ) {

      throw new Error(
        "Search failed"
      );

    }


    const json =
      await response.json();


    const foods =
      (
        json.products ||
        []
      )
        .map(
          product => {

            const calories =
              Number(
                product
                  .nutriments
                  ?.[
                    "energy-kcal_100g"
                  ]
              );


            return {

              name:
                product.product_name ||
                product.generic_name ||
                "Unnamed product",

              kcalPer100g:
                calories,

              source:
                product.brands
                  ? "Open Food Facts · " +
                    product.brands
                  : "Open Food Facts"

            };

          }
        )
        .filter(
          food =>
            food.name &&
            Number.isFinite(
              food.kcalPer100g
            ) &&
            food.kcalPer100g >
              0
        );


    showFoodSuggestions(
      foods,
      "No usable calorie result found."
    );

  } catch (
    error
  ) {

    console.error(
      error
    );


    showFoodSuggestions(
      [],
      "Online search unavailable. Use manual entry instead."
    );

  }

}


// ----------------------------------------
// SELECT FOOD
// ----------------------------------------

function selectFood(
  food
) {

  selectedFood =
    food;


  $("foodSearchInput").value =
    food.name;


  $("foodSearchResults").hidden =
    true;


  $("selectedFoodName").textContent =
    food.name;


  $("selectedFoodNutrition").textContent =
    Math.round(
      food.kcalPer100g
    ) +
    " kcal per 100 g · " +
    food.source;


  $("selectedFoodCard").hidden =
    false;


  calculateSelectedFoodCalories();

}


// ----------------------------------------
// CALCULATE FOOD CALORIES
// ----------------------------------------

function calculateSelectedFoodCalories() {

  const grams =
    Number(
      $("foodAmount").value
    );


  if (
    !selectedFood ||
    !grams ||
    grams <= 0
  ) {

    $("calculatedCalories").textContent =
      "— kcal";

    return null;

  }


  const calories =
    (
      selectedFood
        .kcalPer100g *
      grams
    ) /
    100;


  $("calculatedCalories").textContent =
    Math.round(
      calories
    ) +
    " kcal";


  return calories;

}


// ----------------------------------------
// FOOD ENTRY MODE
// ----------------------------------------

function setFoodMode(
  mode
) {

  foodMode =
    mode;


  const searchMode =
    mode === "search";


  $("foodSearchMode").hidden =
    !searchMode;


  $("manualCaloriesMode").hidden =
    searchMode;


  $("foodSearchModeBtn")
    .classList
    .toggle(
      "active",
      searchMode
    );


  $("manualCaloriesModeBtn")
    .classList
    .toggle(
      "active",
      !searchMode
    );

}
// ========================================
// SAVE CALORIES
// ========================================

async function saveCalories() {

  let calories;
  let description;


  if (
    foodMode === "search"
  ) {

    calories =
      calculateSelectedFoodCalories();


    if (
      !selectedFood ||
      !calories
    ) {

      $("calorieMessage").textContent =
        "Select a food and enter the amount in grams.";

      return;

    }


    description =
      selectedFood.name +
      " · " +
      Number(
        $("foodAmount").value
      ) +
      " g";

  } else {

    calories =
      Number(
        $("manualCalorieInput").value
      );


    description =
      $("manualFoodDescription")
        .value
        .trim();


    if (
      !calories ||
      calories <= 0
    ) {

      $("calorieMessage").textContent =
        "Please enter valid calories.";

      return;

    }

  }


  const button =
    $("saveCaloriesBtn");


  button.disabled =
    true;


  button.textContent =
    "Saving...";


  const {
    error
  } =
    await db
      .from(
        "calorie_entries"
      )
      .insert({

        calories:
          calories,

        description:
          description ||
          null,

        eaten_at:
          $("foodDate").value
            ? new Date(
                $("foodDate").value
              ).toISOString()
            : new Date()
                .toISOString()

      });


  button.disabled =
    false;


  button.textContent =
    "Add Calories";


  if (error) {

    console.error(
      error
    );


    $("calorieMessage").textContent =
      "Unable to save calories.";

    return;

  }


  selectedFood =
    null;


  $("foodSearchInput").value =
    "";


  $("foodAmount").value =
    "";


  $("selectedFoodCard").hidden =
    true;


  $("calculatedCalories").textContent =
    "— kcal";


  $("manualFoodDescription").value =
    "";


  $("manualCalorieInput").value =
    "";


  $("foodDate").value =
    localDateTimeValue();


  $("calorieMessage").textContent =
    "Calories saved";


  await loadCalories();

  await updateTodayDeficit();

}


// ========================================
// CALORIE CHART
// ========================================

function drawCalorieChart(
  labels,
  values,
  expenditure
) {

  const canvas =
    $("calorieChart");


  if (!canvas) {
    return;
  }


  if (
    calorieChartInstance
  ) {

    calorieChartInstance.destroy();

  }


  calorieChartInstance =
    new Chart(
      canvas,
      {

        type:
          "bar",

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
                    expenditure
                ),

              type:
                "line",

              pointRadius:
                0,

              tension:
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
// LOAD CALORIES
// ========================================

async function loadCalories() {

  const {
    data,
    error
  } =
    await db
      .from(
        "calorie_entries"
      )
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


  const rows =
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


  const last24Hours =
    new Date(
      now.getTime() -
      86400000
    );


  const sevenDaysAgo =
    new Date();


  sevenDaysAgo.setDate(
    sevenDaysAgo.getDate() -
    6
  );


  sevenDaysAgo.setHours(
    0,
    0,
    0,
    0
  );


  function totalCalories(
    predicate
  ) {

    return rows
      .filter(
        predicate
      )
      .reduce(
        (
          total,
          entry
        ) =>
          total +
          Number(
            entry.calories
          ),
        0
      );

  }


  const todayCalories =
    totalCalories(
      entry => {

        const date =
          new Date(
            entry.eaten_at
          );


        return (
          date >=
            startToday &&
          date <=
            now
        );

      }
    );


  const calories24Hours =
    totalCalories(
      entry => {

        const date =
          new Date(
            entry.eaten_at
          );


        return (
          date >=
            last24Hours &&
          date <=
            now
        );

      }
    );


  const calories7Days =
    totalCalories(
      entry => {

        const date =
          new Date(
            entry.eaten_at
          );


        return (
          date >=
            sevenDaysAgo &&
          date <=
            now
        );

      }
    );


  $("caloriesToday").textContent =
    Math.round(
      todayCalories
    ) +
    " kcal";


  $("summaryCaloriesToday").textContent =
    Math.round(
      todayCalories
    ) +
    " kcal";


  $("calories24h").textContent =
    Math.round(
      calories24Hours
    ) +
    " kcal";


  $("calories7Days").textContent =
    Math.round(
      calories7Days
    ) +
    " kcal";


  $("calories7DayAverage").textContent =
    Math.round(
      calories7Days /
      7
    ) +
    " kcal";


  const loggedDays =
    new Set(

      rows
        .filter(
          entry => {

            const date =
              new Date(
                entry.eaten_at
              );


            return (
              date >=
                sevenDaysAgo &&
              date <=
                now
            );

          }
        )
        .map(
          entry =>
            new Date(
              entry.eaten_at
            )
              .toLocaleDateString(
                "en-CA"
              )
        )

    ).size;


  $("caloriesDailyAverage").textContent =
    loggedDays
      ? Math.round(
          calories7Days /
          loggedDays
        ) +
        " kcal"
      : "0 kcal";


  const labels =
    [];


  const values =
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
      dayStart.getDate() +
      i
    );


    const dayEnd =
      new Date(
        dayStart
      );


    dayEnd.setDate(
      dayEnd.getDate() +
      1
    );


    labels.push(
      dayStart
        .toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short"
          }
        )
    );


    values.push(
      Math.round(

        totalCalories(
          entry => {

            const date =
              new Date(
                entry.eaten_at
              );


            return (
              date >=
                dayStart &&
              date <
                dayEnd
            );

          }
        )

      )
    );

  }


  const weight =
    await getLatestWeight();


  const expenditure =
    Math.round(
      calculateBMR(
        weight
      ) *
      ACTIVITY_MULTIPLIER
    );


  drawCalorieChart(
    labels,
    values,
    expenditure
  );


  const area =
    $("calorieHistory");


  area.innerHTML =
    rows.length
      ? ""
      : "<p>No calorie entries yet.</p>";


  rows.forEach(
    entry => {

      const date =
        new Date(
          entry.eaten_at
        );


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "history-card";


      card.innerHTML =
        `
        <div>

          <strong>
            ${
              entry.description ||
              "Food / drink"
            }
          </strong>

          <div class="history-time">

            ${date.toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "short",
                year: "numeric"
              }
            )}

            ·

            ${date.toLocaleTimeString(
              "en-GB",
              {
                hour: "2-digit",
                minute: "2-digit"
              }
            )}

          </div>

        </div>

        <div class="history-right">

          <strong>
            ${Math.round(
              Number(
                entry.calories
              )
            )}
            kcal
          </strong>

          <button
            type="button"
            class="delete-entry-btn"
            data-delete-calorie="${entry.id}"
          >
            Delete
          </button>

        </div>
        `;


      area.appendChild(
        card
      );

    }
  );

}


// ========================================
// DELETE CALORIE ENTRY
// ========================================

async function deleteCalories(
  id
) {

  const confirmed =
    confirm(
      "Delete this calorie entry?"
    );


  if (!confirmed) {
    return;
  }


  const {
    error
  } =
    await db
      .from(
        "calorie_entries"
      )
      .delete()
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(
      error
    );


    alert(
      "Unable to delete calorie entry."
    );


    return;

  }


  await loadCalories();

  await updateTodayDeficit();

}


// ========================================
// ACTIVITY DATABASE
// ========================================
//
// MET values are used to estimate gross
// activity energy expenditure.
//

const ACTIVITIES = [

  {
    name:
      "Walking, easy",
    met:
      2.8,
    keywords:
      [
        "walk",
        "walking"
      ]
  },

  {
    name:
      "Walking, moderate",
    met:
      3.5,
    keywords:
      [
        "walk",
        "walking"
      ]
  },

  {
    name:
      "Walking, brisk",
    met:
      4.8,
    keywords:
      [
        "walk",
        "walking",
        "brisk"
      ]
  },

  {
    name:
      "Walking uphill",
    met:
      6.0,
    keywords:
      [
        "walk",
        "walking",
        "hill"
      ]
  },

  {
    name:
      "Running, light jog",
    met:
      7.0,
    keywords:
      [
        "run",
        "running",
        "jog",
        "cardio"
      ]
  },

  {
    name:
      "Running, 8 km/h",
    met:
      8.3,
    keywords:
      [
        "run",
        "running",
        "cardio"
      ]
  },

  {
    name:
      "Running, 10 km/h",
    met:
      9.8,
    keywords:
      [
        "run",
        "running",
        "cardio"
      ]
  },

  {
    name:
      "Running, 12 km/h",
    met:
      11.5,
    keywords:
      [
        "run",
        "running",
        "cardio"
      ]
  },

  {
    name:
      "Cycling, easy",
    met:
      4.0,
    keywords:
      [
        "cycle",
        "cycling",
        "bike"
      ]
  },

  {
    name:
      "Cycling, moderate",
    met:
      6.8,
    keywords:
      [
        "cycle",
        "cycling",
        "bike"
      ]
  },

  {
    name:
      "Cycling, vigorous",
    met:
      10.0,
    keywords:
      [
        "cycle",
        "cycling",
        "bike"
      ]
  },

  {
    name:
      "Stationary bike, moderate",
    met:
      6.8,
    keywords:
      [
        "bike",
        "cycling",
        "gym",
        "cardio"
      ]
  },

  {
    name:
      "Stationary bike, vigorous",
    met:
      10.5,
    keywords:
      [
        "bike",
        "cycling",
        "gym",
        "cardio"
      ]
  },

  {
    name:
      "Swimming, easy",
    met:
      4.8,
    keywords:
      [
        "swim",
        "swimming"
      ]
  },

  {
    name:
      "Swimming, moderate",
    met:
      6.0,
    keywords:
      [
        "swim",
        "swimming"
      ]
  },

  {
    name:
      "Swimming, vigorous",
    met:
      9.8,
    keywords:
      [
        "swim",
        "swimming"
      ]
  },

  {
    name:
      "Elliptical trainer",
    met:
      5.0,
    keywords:
      [
        "elliptical",
        "gym",
        "cardio"
      ]
  },

  {
    name:
      "Rowing machine, moderate",
    met:
      7.0,
    keywords:
      [
        "row",
        "rowing",
        "gym",
        "cardio"
      ]
  },

  {
    name:
      "Rowing machine, vigorous",
    met:
      8.5,
    keywords:
      [
        "row",
        "rowing",
        "gym",
        "cardio"
      ]
  },

  {
    name:
      "Stair machine",
    met:
      9.0,
    keywords:
      [
        "stairs",
        "stair",
        "gym",
        "cardio"
      ]
  },

  {
    name:
      "Aerobics, low impact",
    met:
      5.0,
    keywords:
      [
        "aerobics",
        "cardio"
      ]
  },

  {
    name:
      "Aerobics, high impact",
    met:
      7.3,
    keywords:
      [
        "aerobics",
        "cardio"
      ]
  },

  {
    name:
      "HIIT",
    met:
      8.0,
    keywords:
      [
        "hiit",
        "cardio",
        "interval"
      ]
  },

  {
    name:
      "Circuit training",
    met:
      8.0,
    keywords:
      [
        "circuit",
        "gym",
        "cardio"
      ]
  },

  {
    name:
      "Strength training, general",
    met:
      3.5,
    keywords:
      [
        "weights",
        "weight",
        "strength",
        "gym"
      ]
  },

  {
    name:
      "Strength training, vigorous",
    met:
      6.0,
    keywords:
      [
        "weights",
        "weight",
        "strength",
        "gym"
      ]
  },

  {
    name:
      "Yoga",
    met:
      2.5,
    keywords:
      [
        "yoga"
      ]
  },

  {
    name:
      "Pilates",
    met:
      3.0,
    keywords:
      [
        "pilates"
      ]
  },

  {
    name:
      "Dancing, moderate",
    met:
      4.5,
    keywords:
      [
        "dance",
        "dancing"
      ]
  },

  {
    name:
      "Football",
    met:
      7.0,
    keywords:
      [
        "football",
        "soccer"
      ]
  },

  {
    name:
      "Basketball",
    met:
      6.5,
    keywords:
      [
        "basketball"
      ]
  },

  {
    name:
      "Tennis",
    met:
      7.3,
    keywords:
      [
        "tennis"
      ]
  },

  {
    name:
      "Badminton",
    met:
      5.5,
    keywords:
      [
        "badminton"
      ]
  },

  {
    name:
      "Golf, walking",
    met:
      4.8,
    keywords:
      [
        "golf"
      ]
  },

  {
    name:
      "Gardening",
    met:
      3.8,
    keywords:
      [
        "garden",
        "gardening"
      ]
  },

  {
    name:
      "Housework, moderate",
    met:
      3.5,
    keywords:
      [
        "housework",
        "cleaning"
      ]
  },

  {
    name:
      "Vacuuming",
    met:
      3.3,
    keywords:
      [
        "vacuum",
        "vacuuming",
        "cleaning"
      ]
  },

  {
    name:
      "Stairs, general",
    met:
      4.0,
    keywords:
      [
        "stairs",
        "stair"
      ]
  }

];


// ========================================
// ACTIVITY CALORIE CALCULATION
// ========================================

function activityCalories(
  met,
  weight,
  minutes
) {

  return Math.round(
    (
      met *
      3.5 *
      weight /
      200
    ) *
    minutes
  );

}


// ========================================
// ACTIVITY SEARCH
// ========================================

function showActivitySuggestions() {

  const query =
    $("activitySearchInput")
      .value
      .trim()
      .toLowerCase();


  selectedActivity =
    null;


  $("selectedActivityCard").hidden =
    true;


  $("estimatedActivityCalories").textContent =
    "— kcal";


  const box =
    $("activitySearchResults");


  if (
    query.length < 1
  ) {

    box.hidden =
      true;

    return;

  }


  const matches =
    ACTIVITIES
      .filter(
        activity => {

          const nameMatch =
            activity.name
              .toLowerCase()
              .includes(
                query
              );


          const keywordMatch =
            activity.keywords
              .some(
                keyword =>
                  keyword.includes(
                    query
                  )
              );


          return (
            nameMatch ||
            keywordMatch
          );

        }
      )
      .slice(
        0,
        12
      );


  box.innerHTML =
    "";


  matches.forEach(
    activity => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "suggestion-item";


      button._activity =
        activity;


      button.innerHTML =
        `
        <span class="suggestion-main">

          <strong>
            ${activity.name}
          </strong>

          <small>
            MET ${activity.met}
          </small>

        </span>

        <span class="suggestion-value">
          Select
        </span>
        `;


      box.appendChild(
        button
      );

    }
  );


  box.hidden =
    matches.length === 0;

}


// ========================================
// SELECT ACTIVITY
// ========================================

async function selectActivity(
  activity
) {

  selectedActivity =
    activity;


  $("activitySearchInput").value =
    activity.name;


  $("activityType").value =
    activity.name;


  $("activitySearchResults").hidden =
    true;


  $("selectedActivityName").textContent =
    activity.name;


  $("selectedActivityMET").textContent =
    "MET " +
    activity.met;


  $("selectedActivityCard").hidden =
    false;


  await updateActivityEstimate();

}


// ========================================
// UPDATE ACTIVITY ESTIMATE
// ========================================

async function updateActivityEstimate() {

  const minutes =
    Number(
      $("activityDuration").value
    );


  if (
    !selectedActivity ||
    !minutes ||
    minutes <= 0
  ) {

    $("estimatedActivityCalories").textContent =
      "— kcal";

    return null;

  }


  const weight =
    await getLatestWeight();


  const calories =
    activityCalories(
      selectedActivity.met,
      weight,
      minutes
    );


  $("estimatedActivityCalories").textContent =
    calories +
    " kcal";


  return calories;

}
// ========================================
// SAVE ACTIVITY
// ========================================

async function saveActivity() {

  const minutes =
    Number(
      $("activityDuration").value
    );


  const manualCalories =
    Number(
      $("manualActivityCalories").value
    );


  if (
    !minutes ||
    minutes <= 0
  ) {

    $("activityMessage").textContent =
      "Please enter the activity duration.";

    return;

  }


  if (
    !selectedActivity &&
    !manualCalories
  ) {

    $("activityMessage").textContent =
      "Select an activity or enter calories from your device.";

    return;

  }


  let estimatedCalories =
    null;


  if (
    selectedActivity
  ) {

    estimatedCalories =
      await updateActivityEstimate();

  }


  const finalCalories =
    manualCalories > 0
      ? manualCalories
      : estimatedCalories;


  const activityName =
    selectedActivity
      ? selectedActivity.name
      : (
          $("activitySearchInput")
            .value
            .trim() ||
          "Activity"
        );


  if (
    !finalCalories ||
    finalCalories <= 0
  ) {

    $("activityMessage").textContent =
      "Unable to calculate calories.";

    return;

  }


  const button =
    $("saveActivityBtn");


  button.disabled =
    true;


  button.textContent =
    "Saving...";


  const {
    error
  } =
    await db
      .from(
        "activity_entries"
      )
      .insert({

        activity_type:
          activityName,

        duration_minutes:
          minutes,

        calories_burned:
          finalCalories,

        performed_at:
          $("activityDate").value
            ? new Date(
                $("activityDate").value
              ).toISOString()
            : new Date()
                .toISOString()

      });


  button.disabled =
    false;


  button.textContent =
    "Add Activity";


  if (error) {

    console.error(
      error
    );


    $("activityMessage").textContent =
      "Unable to save activity.";

    return;

  }


  selectedActivity =
    null;


  $("activitySearchInput").value =
    "";


  $("activityType").value =
    "";


  $("activityDuration").value =
    "";


  $("manualActivityCalories").value =
    "";


  $("selectedActivityCard").hidden =
    true;


  $("estimatedActivityCalories").textContent =
    "— kcal";


  $("activityDate").value =
    localDateTimeValue();


  $("activityMessage").textContent =
    "Activity saved";


  await loadActivities();

  await updateTodayDeficit();

}


// ========================================
// ACTIVITY CHART
// ========================================

function drawActivityChart(
  labels,
  values
) {

  const canvas =
    $("activityChart");


  if (!canvas) {
    return;
  }


  if (
    activityChartInstance
  ) {

    activityChartInstance.destroy();

  }


  activityChartInstance =
    new Chart(
      canvas,
      {

        type:
          "bar",

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
// LOAD ACTIVITIES
// ========================================

async function loadActivities() {

  const {
    data,
    error
  } =
    await db
      .from(
        "activity_entries"
      )
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


  const rows =
    data || [];


  const now =
    new Date();


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  const sevenDaysAgo =
    new Date();


  sevenDaysAgo.setDate(
    sevenDaysAgo.getDate() -
    6
  );


  sevenDaysAgo.setHours(
    0,
    0,
    0,
    0
  );


  function totalActivityCalories(
    predicate
  ) {

    return rows
      .filter(
        predicate
      )
      .reduce(
        (
          total,
          entry
        ) =>
          total +
          Number(
            entry.calories_burned ||
            0
          ),
        0
      );

  }


  const todayTotal =
    totalActivityCalories(
      entry => {

        const date =
          new Date(
            entry.performed_at
          );


        return (
          date >=
            today &&
          date <=
            now
        );

      }
    );


  const weekTotal =
    totalActivityCalories(
      entry => {

        const date =
          new Date(
            entry.performed_at
          );


        return (
          date >=
            sevenDaysAgo &&
          date <=
            now
        );

      }
    );


  $("activityToday").textContent =
    Math.round(
      todayTotal
    ) +
    " kcal";


  $("activity7Days").textContent =
    Math.round(
      weekTotal
    ) +
    " kcal";


  $("summaryActivityToday").textContent =
    Math.round(
      todayTotal
    ) +
    " kcal";


  const labels =
    [];


  const values =
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
      dayStart.getDate() +
      i
    );


    const dayEnd =
      new Date(
        dayStart
      );


    dayEnd.setDate(
      dayEnd.getDate() +
      1
    );


    labels.push(
      dayStart
        .toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short"
          }
        )
    );


    values.push(
      Math.round(

        totalActivityCalories(
          entry => {

            const date =
              new Date(
                entry.performed_at
              );


            return (
              date >=
                dayStart &&
              date <
                dayEnd
            );

          }
        )

      )
    );

  }


  drawActivityChart(
    labels,
    values
  );


  const area =
    $("activityHistory");


  area.innerHTML =
    rows.length
      ? ""
      : "<p>No activities yet.</p>";


  rows.forEach(
    entry => {

      const date =
        new Date(
          entry.performed_at
        );


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "history-card";


      card.innerHTML =
        `
        <div>

          <strong>
            ${entry.activity_type}
          </strong>

          <div class="history-time">

            ${Math.round(
              Number(
                entry.duration_minutes
              )
            )}
            min

            ·

            ${date.toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "short",
                year: "numeric"
              }
            )}

            ·

            ${date.toLocaleTimeString(
              "en-GB",
              {
                hour: "2-digit",
                minute: "2-digit"
              }
            )}

          </div>

        </div>

        <div class="history-right">

          <strong>
            ${Math.round(
              Number(
                entry.calories_burned
              )
            )}
            kcal
          </strong>

          <button
            type="button"
            class="delete-entry-btn"
            data-delete-activity="${entry.id}"
          >
            Delete
          </button>

        </div>
        `;


      area.appendChild(
        card
      );

    }
  );

}


// ========================================
// DELETE ACTIVITY
// ========================================

async function deleteActivity(
  id
) {

  const confirmed =
    confirm(
      "Delete this activity?"
    );


  if (!confirmed) {
    return;
  }


  const {
    error
  } =
    await db
      .from(
        "activity_entries"
      )
      .delete()
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(
      error
    );


    alert(
      "Unable to delete activity."
    );


    return;

  }


  await loadActivities();

  await updateTodayDeficit();

}


// ========================================
// DEFICIT + ESTIMATED WEIGHT LOSS
// ========================================

function setEstimatedLoss(
  id,
  deficit
) {

  const element =
    $(id);


  if (!element) {
    return;
  }


  if (
    deficit > 0
  ) {

    element.textContent =
      "~" +
      (
        deficit /
        KCAL_PER_KG
      ).toFixed(2) +
      " kg";

  } else {

    element.textContent =
      "0.00 kg";

  }

}


// ========================================
// DEFICIT CHART
// ========================================

function drawDeficitChart(
  labels,
  values
) {

  const canvas =
    $("deficitChart");


  if (!canvas) {
    return;
  }


  if (
    deficitChartInstance
  ) {

    deficitChartInstance.destroy();

  }


  deficitChartInstance =
    new Chart(
      canvas,
      {

        type:
          "line",

        data: {

          labels:
            labels,

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
// CALCULATE DEFICIT
// ========================================

async function updateTodayDeficit() {

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


  const thirtyDaysAgo =
    new Date(
      now.getTime() -
      (
        30 *
        86400000
      )
    );


  const [
    weightsResult,
    foodResult,
    activityResult
  ] =
    await Promise.all([

      db
        .from(
          "weight_entries"
        )
        .select(
          "weight_kg,recorded_at"
        )
        .order(
          "recorded_at",
          {
            ascending:
              true
          }
        ),

      db
        .from(
          "calorie_entries"
        )
        .select(
          "calories,eaten_at"
        )
        .gte(
          "eaten_at",
          thirtyDaysAgo.toISOString()
        )
        .lte(
          "eaten_at",
          now.toISOString()
        ),

      db
        .from(
          "activity_entries"
        )
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
        )

    ]);


  if (
    weightsResult.error ||
    foodResult.error ||
    activityResult.error
  ) {

    console.error(
      "Unable to calculate deficit",
      weightsResult.error,
      foodResult.error,
      activityResult.error
    );

    return;

  }


  const weights =
    weightsResult.data ||
    [];


  const foods =
    foodResult.data ||
    [];


  const activities =
    activityResult.data ||
    [];


  function historicalWeight(
    date
  ) {

    let weight =
      STARTING_WEIGHT;


    weights.forEach(
      entry => {

        if (
          new Date(
            entry.recorded_at
          ) <= date
        ) {

          weight =
            Number(
              entry.weight_kg
            );

        }

      }
    );


    return weight;

  }


  function calculateDayDeficit(
    dayStart,
    dayEnd,
    isToday = false
  ) {

    const weight =
      historicalWeight(
        dayEnd
      );


    const dailyExpenditure =
      calculateBMR(
        weight
      ) *
      ACTIVITY_MULTIPLIER;


    const fractionOfDay =
      isToday
        ? Math.max(
            0,
            Math.min(
              1,
              (
                now -
                dayStart
              ) /
              86400000
            )
          )
        : 1;


    const baseline =
      dailyExpenditure *
      fractionOfDay;


    const foodCalories =
      foods
        .filter(
          entry => {

            const date =
              new Date(
                entry.eaten_at
              );


            return (
              date >=
                dayStart &&
              date <
                dayEnd
            );

          }
        )
        .reduce(
          (
            total,
            entry
          ) =>
            total +
            Number(
              entry.calories
            ),
          0
        );


    let extraActivity =
      0;


    activities
      .filter(
        entry => {

          const date =
            new Date(
              entry.performed_at
            );


          return (
            date >=
              dayStart &&
            date <
              dayEnd
          );

        }
      )
      .forEach(
        entry => {

          const grossCalories =
            Number(
              entry.calories_burned
            ) ||
            0;


          const duration =
            Number(
              entry.duration_minutes
            ) ||
            0;


          const baselineDuringActivity =
            (
              dailyExpenditure /
              1440
            ) *
            duration;


          extraActivity +=
            Math.max(
              0,
              grossCalories -
              baselineDuringActivity
            );

        }
      );


    return (
      baseline +
      extraActivity -
      foodCalories
    );

  }


  // --------------------------------------
  // TODAY
  // --------------------------------------

  const todayDeficit =
    calculateDayDeficit(
      startToday,
      now,
      true
    );


  $("summaryDeficitToday").textContent =
    Math.round(
      todayDeficit
    ) +
    " kcal";


  setEstimatedLoss(
    "estimatedWeightLossToday",
    todayDeficit
  );


  // --------------------------------------
  // START DEFICIT HISTORY FROM FIRST
  // RECORDED FOOD ENTRY
  // --------------------------------------

  const foodDates =
    foods.map(
      entry =>
        new Date(
          entry.eaten_at
        )
    );


  if (
    foodDates.length === 0
  ) {

    $("summaryDeficit7Days").textContent =
      "—";


    $("summaryDeficit30Days").textContent =
      "—";


    $("estimatedWeightLoss7Days").textContent =
      "—";


    $("estimatedWeightLoss30Days").textContent =
      "—";


    if (
      $("estimatedWeightEquivalent")
    ) {

      $("estimatedWeightEquivalent").textContent =
        "—";

    }


    drawDeficitChart(
      [],
      []
    );


    return;

  }


  const firstFood =
    new Date(
      Math.min(
        ...foodDates.map(
          date =>
            date.getTime()
        )
      )
    );


  const trackingStart =
    firstFood >
      thirtyDaysAgo
      ? firstFood
      : thirtyDaysAgo;


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


  const days =
    [];


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
      nextDay.getDate() +
      1
    );


    const isToday =
      dayStart.toDateString() ===
      now.toDateString();


    const deficit =
      calculateDayDeficit(
        dayStart,
        isToday
          ? now
          : nextDay,
        isToday
      );


    days.push({

      date:
        dayStart,

      deficit:
        deficit

    });


    cursor =
      nextDay;

  }


  const last7Days =
    days.slice(
      -7
    );


  const last30Days =
    days.slice(
      -30
    );


  const deficit7Days =
    last7Days.reduce(
      (
        total,
        day
      ) =>
        total +
        day.deficit,
      0
    );


  const deficit30Days =
    last30Days.reduce(
      (
        total,
        day
      ) =>
        total +
        day.deficit,
      0
    );


  $("summaryDeficit7Days").textContent =
    Math.round(
      deficit7Days
    ) +
    " kcal";


  $("summaryDeficit30Days").textContent =
    Math.round(
      deficit30Days
    ) +
    " kcal";


  $("summary7DaysLabel").textContent =
    last7Days.length < 7
      ? "Deficit — " +
        last7Days.length +
        " days tracked"
      : "Last 7 Days";


  $("summary30DaysLabel").textContent =
    last30Days.length < 30
      ? "Deficit — " +
        last30Days.length +
        " days tracked"
      : "Last 30 Days";


  setEstimatedLoss(
    "estimatedWeightLoss7Days",
    deficit7Days
  );


  setEstimatedLoss(
    "estimatedWeightLoss30Days",
    deficit30Days
  );


  if (
    $("estimatedWeightEquivalent")
  ) {

    $("estimatedWeightEquivalent").textContent =
      deficit30Days > 0
        ? (
            deficit30Days /
            KCAL_PER_KG
          ).toFixed(2) +
          " kg"
        : "0.00 kg";

  }


  drawDeficitChart(

    last30Days.map(
      day =>
        day.date
          .toLocaleDateString(
            "en-GB",
            {
              day:
                "2-digit",

              month:
                "short"
            }
          )
    ),

    last30Days.map(
      day =>
        Math.round(
          day.deficit
        )
    )

  );

}


// ========================================
// MAIN EVENT HANDLERS
// ========================================

$("startFastBtn")
  .addEventListener(
    "click",
    startFast
  );


$("stopFastBtn")
  .addEventListener(
    "click",
    stopFast
  );


$("saveWeightBtn")
  .addEventListener(
    "click",
    saveWeight
  );


$("saveCaloriesBtn")
  .addEventListener(
    "click",
    saveCalories
  );


$("saveActivityBtn")
  .addEventListener(
    "click",
    saveActivity
  );


// ========================================
// FOOD MODE BUTTONS
// ========================================

$("foodSearchModeBtn")
  .addEventListener(
    "click",
    () => {

      setFoodMode(
        "search"
      );

    }
  );


$("manualCaloriesModeBtn")
  .addEventListener(
    "click",
    () => {

      setFoodMode(
        "manual"
      );

    }
  );


// ========================================
// FOOD SEARCH EVENTS
// ========================================

$("foodSearchInput")
  .addEventListener(
    "input",
    searchLocalFoods
  );


$("foodSearchInput")
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();


        const query =
          event.currentTarget
            .value
            .trim();


        if (
          query.length >= 2
        ) {

          searchOpenFoodFacts(
            query
          );

        }

      }

    }
  );


$("foodAmount")
  .addEventListener(
    "input",
    calculateSelectedFoodCalories
  );


$("foodSearchResults")
  .addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "button.suggestion-item"
        );


      if (
        button &&
        button._food
      ) {

        selectFood(
          button._food
        );

      }

    }
  );


// ========================================
// ACTIVITY SEARCH EVENTS
// ========================================

$("activitySearchInput")
  .addEventListener(
    "input",
    showActivitySuggestions
  );


$("activitySearchResults")
  .addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "button.suggestion-item"
        );


      if (
        button &&
        button._activity
      ) {

        selectActivity(
          button._activity
        );

      }

    }
  );


$("activityDuration")
  .addEventListener(
    "input",
    updateActivityEstimate
  );


// ========================================
// DELETE BUTTONS
// ========================================

document.addEventListener(
  "click",
  event => {

    const fastButton =
      event.target.closest(
        "[data-delete-fast]"
      );


    const weightButton =
      event.target.closest(
        "[data-delete-weight]"
      );


    const calorieButton =
      event.target.closest(
        "[data-delete-calorie]"
      );


    const activityButton =
      event.target.closest(
        "[data-delete-activity]"
      );


    if (
      fastButton
    ) {

      deleteFast(
        fastButton.dataset.deleteFast
      );

    }


    if (
      weightButton
    ) {

      deleteWeight(
        weightButton.dataset.deleteWeight
      );

    }


    if (
      calorieButton
    ) {

      deleteCalories(
        calorieButton.dataset.deleteCalorie
      );

    }


    if (
      activityButton
    ) {

      deleteActivity(
        activityButton.dataset.deleteActivity
      );

    }


    if (
      !event.target.closest(
        ".search-wrap"
      )
    ) {

      $("foodSearchResults").hidden =
        true;


      $("activitySearchResults").hidden =
        true;

    }

  }
);


// ========================================
// AUTHENTICATION
// ========================================

const mainApp =
  document.querySelector(
    ".app"
  );


const loginScreen =
  $("loginScreen");


const loginEmail =
  $("loginEmail");


const loginPassword =
  $("loginPassword");


const loginBtn =
  $("loginBtn");


const loginMessage =
  $("loginMessage");


const logoutBtn =
  $("logoutBtn");


// ----------------------------------------
// LOAD APP AFTER LOGIN
// ----------------------------------------

async function loadAuthenticatedApp() {

  loginScreen.style.display =
    "none";


  mainApp.style.display =
    "";


  setDefaultDates();


  setFoodMode(
    "search"
  );


  await Promise.all([

    loadActiveFast(),

    loadFastingHistory(),

    loadWeights(),

    loadCalories(),

    loadActivities()

  ]);


  await updateTodayDeficit();

}


// ----------------------------------------
// CHECK EXISTING LOGIN
// ----------------------------------------

async function checkLogin() {

  const {
    data: {
      session
    },
    error
  } =
    await db.auth
      .getSession();


  if (error) {

    console.error(
      "Unable to check login:",
      error
    );

  }


  if (
    session
  ) {

    await loadAuthenticatedApp();

  } else {

    loginScreen.style.display =
      "flex";


    mainApp.style.display =
      "none";

  }

}


// ----------------------------------------
// LOGIN
// ----------------------------------------

async function login() {

  const email =
    loginEmail
      .value
      .trim();


  const password =
    loginPassword
      .value;


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

        email:
          email,

        password:
          password

      });


  loginBtn.disabled =
    false;


  if (
    error ||
    !data.session
  ) {

    console.error(
      "Login error:",
      error
    );


    loginMessage.textContent =
      "Unable to log in. Check your email and password.";

    return;

  }


  loginMessage.textContent =
    "";


  await loadAuthenticatedApp();

}


// ----------------------------------------
// LOGIN BUTTON
// ----------------------------------------

loginBtn.addEventListener(
  "click",
  login
);


// ----------------------------------------
// ENTER KEY LOGIN
// ----------------------------------------

loginPassword.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Enter"
    ) {

      login();

    }

  }
);


// ----------------------------------------
// LOGOUT
// ----------------------------------------

logoutBtn.addEventListener(
  "click",
  async () => {

    const {
      error
    } =
      await db.auth
        .signOut();


    if (error) {

      console.error(
        "Logout error:",
        error
      );

      return;

    }


    if (
      timerInterval
    ) {

      clearInterval(
        timerInterval
      );

    }


    timerInterval =
      null;


    activeFast =
      null;


    loginEmail.value =
      "";


    loginPassword.value =
      "";


    loginMessage.textContent =
      "";


    loginScreen.style.display =
      "flex";


    mainApp.style.display =
      "none";

  }
);


// ========================================
// START APP
// ========================================

setDefaultDates();

checkLogin();
