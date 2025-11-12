// form.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("userForm");
  form.addEventListener("submit", function(e){
    e.preventDefault();

    const gender = document.getElementById("gender").value;
    const age = parseFloat(document.getElementById("age").value);
    const weight = parseFloat(document.getElementById("weight").value);
    const height = parseFloat(document.getElementById("height").value);
    const activity = parseFloat(document.getElementById("activity").value);
    const goal = document.getElementById("goal").value;

    if (!gender || !age || !weight || !height || !activity || !goal) {
      alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    // สูตร BMR ตามที่ให้ไว้
    let bmr;
    if (gender === "male") {
      bmr = 66.5 + (13.8 * weight) + (5 * height) - (6.8 * age);
    } else {
      bmr = 655.1 + (9.6 * weight) + (1.9 * height) - (4.7 * age);
    }

    const tdeeBase = Math.round(bmr * activity);

    // ปรับตามเป้าหมาย (+/-500)
    let tdeeFinal = tdeeBase;
    if (goal === "lose") tdeeFinal = tdeeBase - 500;
    else if (goal === "gain") tdeeFinal = tdeeBase + 500;

    // โปรตีน: ถ้า maintain => 1.0g/kg, ถ้า lose/gain => 1.2g/kg
    const proteinMultiplier = (goal === "maintain") ? 1.0 : 1.2;
    const proteinNeed = Math.round(weight * proteinMultiplier);

    // เก็บลง localStorage
    localStorage.setItem("gender", gender);
    localStorage.setItem("age", age);
    localStorage.setItem("weight", weight);
    localStorage.setItem("height", height);
    localStorage.setItem("activity", activity);
    localStorage.setItem("goal", goal);
    localStorage.setItem("bmr", bmr);
    localStorage.setItem("tdeeBase", tdeeBase);
    localStorage.setItem("tdeeFinal", tdeeFinal);
    localStorage.setItem("proteinNeed", proteinNeed);

    // ไปหน้าแสดงผล
    window.location.href = "result.html";
  });
});
