const supabaseUrl = "https://bfxmfaakufrmzcxhtgfw.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmeG1mYWFrdWZybXpjeGh0Z2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTQzMTIsImV4cCI6MjA3NTM5MDMxMn0.qtNn0qXNhn8ol8fTSb2Hp9nQkYfFA2Y_Zec4LuISPZQ";

let supabaseClient = null;

function initSupabase() {
  if (typeof supabase === "undefined") {
    console.warn("supabase global not ready yet, waiting...");
    setTimeout(initSupabase, 100);
    return;
  }

  const { createClient } = supabase;
  supabaseClient = createClient(supabaseUrl, supabaseKey);
  console.log("Supabase client initialized!", supabaseClient);
}

initSupabase();

const form = document.getElementById("contact-form");
const submitBtn = document.getElementById("submit-btn");
const btnText = document.getElementById("btn-text");
const messageDiv = document.getElementById("form-message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  submitBtn.disabled = true;
  btnText.textContent = "Sending...";
  messageDiv.classList.add("hidden");

  const formData = new FormData(form);
  const helps = formData.getAll("helps");
  console.log("Selected helps:", helps);
  // ── Collect regular fields ──
  const data = {
    full_name: formData.get("full_name")?.trim() || null,
    email: formData.get("email")?.trim() || null,
    phone: formData.get("phone")?.trim() || null,
    subject: formData.get("subject")?.trim() || null,
    message: formData.get("message")?.trim() || null,
    // ── NEW: Collect all checked goals as array ──
    helps: helps.length > 0 ? helps : null, // returns string[] or empty array
  };

  // Optional: basic frontend validation
  if (!data.full_name || !data.email || !data.subject || !data.message) {
    showError("Please fill in all required fields.");
    resetButton();
    return;
  }

  try {
    const { error } = await supabaseClient.from("contact").insert([data]);

    if (error) throw error;

    // Success
    messageDiv.textContent =
      "Thank you! Your message has been sent successfully.";
    messageDiv.classList.remove("hidden", "text-red-400");
    messageDiv.classList.add("text-[#53BA83]");
    form.reset();
  } catch (err) {
    console.error("Submission error:", err);
    showError("Sorry, something went wrong. Please try again later.");
  } finally {
    resetButton();
  }

  function showError(msg) {
    messageDiv.textContent = msg;
    messageDiv.classList.remove("hidden", "text-[#53BA83]");
    messageDiv.classList.add("text-red-400");
  }

  function resetButton() {
    submitBtn.disabled = false;
    btnText.textContent = "Send Message";
  }
});
