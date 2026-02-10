const supabaseUrl = "https://bfxmfaakufrmzcxhtgfw.supabase.co"; // ← YOUR URL
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmeG1mYWFrdWZybXpjeGh0Z2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTQzMTIsImV4cCI6MjA3NTM5MDMxMn0.qtNn0qXNhn8ol8fTSb2Hp9nQkYfFA2Y_Zec4LuISPZQ"; // ← YOUR ANON KEY
window.supabase =
  window.supabase || Supabase.createClient(supabaseUrl, supabaseKey);

console.log("Supabase client ready");

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
