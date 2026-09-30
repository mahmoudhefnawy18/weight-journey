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
