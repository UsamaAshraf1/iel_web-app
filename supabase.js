const supabaseUrl = "https://bfxmfaakufrmzcxhtgfw.supabase.co"; // ← YOUR URL
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmeG1mYWFrdWZybXpjeGh0Z2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTQzMTIsImV4cCI6MjA3NTM5MDMxMn0.qtNn0qXNhn8ol8fTSb2Hp9nQkYfFA2Y_Zec4LuISPZQ"; // ← YOUR ANON KEY
// window.supabase =
//   window.supabase || Supabase.createClient(supabaseUrl, supabaseKey);
const supabaseClient = Supabase.createClient(supabaseUrl, supabaseKey);

console.log("Supabase client ready", !!supabaseClient);

console.log("Has .from?", typeof supabaseClient?.from === "function");

const form = document.getElementById("contact-form");
const submitBtn = document.getElementById("submit-btn");
const btnText = document.getElementById("btn-text");
const messageDiv = document.getElementById("form-message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Disable button & show loading
  submitBtn.disabled = true;
  btnText.textContent = "Sending...";
  messageDiv.classList.add("hidden");

  // Collect form data
  const formData = new FormData(form);
  const data = {
    full_name: formData.get("full_name").trim(),
    email: formData.get("email").trim(),
    phone: formData.get("phone")?.trim() || null,
    subject: formData.get("subject").trim(),
    message: formData.get("message").trim(),
  };

  try {
    const { data: response, error } = await window.supabase
      .from("todos")
      .insert([data])
      .select();

    if (error) throw error;

    // Success
    messageDiv.textContent =
      "Thank you! Your message has been sent successfully.";
    messageDiv.classList.remove("hidden", "text-red-400");
    messageDiv.classList.add("text-[#53BA83]");
    form.reset();
  } catch (err) {
    console.error("Submission error:", err);
    messageDiv.textContent =
      "Sorry, something went wrong. Please try again later.";
    messageDiv.classList.remove("hidden", "text-[#53BA83]");
    messageDiv.classList.add("text-red-400");
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = "Send Message";
  }
});

async function getAllMessages() {
  try {
    const { data, error } = await window.supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false }); // newest first

    if (error) {
      console.error("Error fetching messages:", error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: err.message, data: null };
  }
}

async function loadMessages() {
  const result = await getAllMessages();

  if (result.success) {
    console.log("Messages:", result.data);

    // Example: show in console or render in UI
    result.data.forEach((msg) => {
      console.log(`${msg.full_name} (${msg.email}) — ${msg.subject}`);
    });
  } else {
    console.error("Failed to load messages:", result.error);
  }
}

// Call it somewhere (e.g. on page load or button click)
loadMessages();
