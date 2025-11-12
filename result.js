// result.js (module)
import { foodPlans } from "./data.js";
import { nutritionData } from "./dataExtra.js";

document.addEventListener("DOMContentLoaded", () => {
  const gender = localStorage.getItem("gender");
  const age = localStorage.getItem("age");
  const weight = parseFloat(localStorage.getItem("weight") || 0);
  const height = localStorage.getItem("height");
  const goal = localStorage.getItem("goal");
  const tdeeBase = parseFloat(localStorage.getItem("tdeeBase") || 0);
  const tdeeFinal = parseFloat(localStorage.getItem("tdeeFinal") || 0);
  const proteinNeed = parseFloat(localStorage.getItem("proteinNeed") || 0);

  const personalInfo = document.getElementById("personalInfo");
  const goalResult = document.getElementById("goalResult");
  const tdeeOriginal = document.getElementById("tdeeOriginal");
  const tdeeResult = document.getElementById("tdeeResult");
  const proteinResult = document.getElementById("proteinResult");
  const distBoxes = document.getElementById("distBoxes");
  const exampleText = document.getElementById("exampleText");
  const foodTableBody = document.getElementById("foodTableBody");
  const foodTableContainer = document.getElementById("foodTableContainer");
  const combineToggle = document.getElementById("combineToggle");

  if (!gender || !tdeeBase || !tdeeFinal) {
    foodTableContainer.innerHTML = "<p>ไม่พบข้อมูลการคำนวณ โปรดย้อนกลับไปกรอกใหม่</p>";
    return;
  }

  personalInfo.textContent = `อายุ ${age} ปี • น้ำหนัก ${weight} กก. • ส่วนสูง ${height} ซม.`;
  goalResult.textContent = `เป้าหมายของคุณ: ${
    goal === "maintain" ? "คงน้ำหนัก" : goal === "lose" ? "ลดน้ำหนัก" : "เพิ่มน้ำหนัก"
  }`;
  tdeeOriginal.textContent = `TDEE (ก่อนปรับเป้าหมาย): ${Math.round(tdeeBase)} kcal`;
  tdeeResult.textContent = `พลังงานตามเป้าหมาย: ${Math.round(tdeeFinal)} kcal`;
  proteinResult.textContent = `ปริมาณโปรตีนที่แนะนำ: ${proteinNeed} กรัม / วัน`;

  const matchPlan = foodPlans.find(
    (p) =>
      tdeeFinal >= p.energyRange[0] &&
      tdeeFinal <= p.energyRange[1] &&
      proteinNeed >= p.proteinRange[0] &&
      proteinNeed <= p.proteinRange[1]
  );

  const matchNutrition = nutritionData.find(
    (n) =>
      tdeeFinal >= n.energyMin &&
      tdeeFinal <= n.energyMax &&
      proteinNeed >= n.proteinMin &&
      proteinNeed <= n.proteinMax
  );

  if (matchNutrition) {
    matchPlan.kcalActual = matchNutrition.kcalActual;
    matchPlan.proteinActual = matchNutrition.proteinActual;
    matchPlan.carbPercent = matchNutrition.carbPercent;
    matchPlan.proteinPercent = matchNutrition.proteinPercent;
    matchPlan.fatPercent = matchNutrition.fatPercent;
  }

  if (!matchPlan) {
    foodTableContainer.innerHTML = `<p style="text-align:center;color:#666;padding:1rem;">
        ❗ ระบบยังไม่มีฐานข้อมูลนี้ โปรดติดตามในอนาคต
      </p>`;
    return;
  }

  distBoxes.innerHTML = `
    <div class="dist-box">คาร์โบไฮเดรต<br><strong>${matchPlan.carbPercent}%</strong></div>
    <div class="dist-box">โปรตีน<br><strong>${matchPlan.proteinPercent}%</strong></div>
    <div class="dist-box">ไขมัน<br><strong>${matchPlan.fatPercent}%</strong></div>
  `;

  exampleText.textContent = `ตัวอย่างสัดส่วนอาหารที่ให้พลังงาน ${matchPlan.kcalActual} kcal และโปรตีน ${matchPlan.proteinActual} g`;

  function normalizePortions(portions) {
    return portions.filter((it) => it.total !== undefined).map((it) => ({ ...it, total: Number(it.total) || 0 }));
  }

  let normalPortions = normalizePortions(matchPlan.portions);

  // ✅ ลำดับหมวดตามภาพที่ Atom ส่ง
  const foodOrder = [
    { type: "ข้าว-แป้ง", color: "#fff9cc" },
    { type: "เนื้อสัตว์", isHeader: true, color: "#ffffff" },
    { type: "เนื้อสัตว์ไขมันต่ำมาก", indent: true, color: "#d7f9d7" },
    { type: "เนื้อสัตว์ไขมันต่ำ", indent: true, color: "#c0f0c0" },
    { type: "เนื้อสัตว์ไขมันปานกลาง", indent: true, color: "#a9e6a9" },
    { type: "เนื้อสัตว์ไขมันสูง", indent: true, color: "#92dd92" },
    { type: "ไขมัน", color: "#ffe6b3" },
    { type: "ผัก", isHeader: true, color: "#ffffff" },
    { type: "ผัก ก", indent: true, color: "#e8fbe8" },
    { type: "ผัก ข", indent: true, color: "#d4f5d4" },
    { type: "ผลไม้", color: "#ffe6f0" },
    { type: "นม", isHeader: true, color: "#ffffff" },
    { type: "นมไขมันเต็มส่วน", indent: true, color: "#fff3d9" },
    { type: "นมพร่องมันเนย", indent: true, color: "#ffecc2" },
    { type: "นมขาดมันเนย", indent: true, color: "#ffe5ad" },
    { type: "น้ำตาลเพิ่มสำหรับประกอบอาหาร", color: "#f0f0f0" }
  ];

  function sortByFoodOrder(portions) {
    return foodOrder
      .map((fo) => portions.find((p) => p.type === fo.type) || fo)
      .filter((item) => item);
  }

  normalPortions = sortByFoodOrder(normalPortions);

  function computeMeals(portions) {
    function splitIntoThree(n) {
      if (n === 0) return ["-", "-", "-"];
      const units = Math.round(n * 2);
      const base = Math.floor(units / 3);
      let rem = units - base * 3;
      let parts = [base, base, base];
      if (rem === 1) parts[1] += 1;
      if (rem === 2) {
        parts[0] += 1;
        parts[1] += 1;
      }
      return parts.map((u) => u / 2);
    }

    return portions.map((p) => {
      if (p.isHeader) return { ...p, breakfast: "-", lunch: "-", dinner: "-" };
      const [b, l, d] = splitIntoThree(p.total);
      return { ...p, breakfast: b, lunch: l, dinner: d };
    });
  }

  function renderTable(portions) {
    foodTableBody.innerHTML = "";
    const withMeals = computeMeals(portions);

    withMeals.forEach((row, idx) => {
      const tr = document.createElement("tr");
      tr.style.backgroundColor = row.color || "white";

      const indentStyle = row.indent ? "padding-left: 20px;" : "";
      const boldStyle = row.isHeader ? "font-weight: 600;" : "";

      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td style="text-align:left; ${indentStyle} ${boldStyle}">${row.type}</td>
        <td>${row.total || "-"}</td>
        <td>${typeof row.breakfast === "number" ? (row.breakfast % 1 === 0 ? row.breakfast.toFixed(0) : row.breakfast.toFixed(1)) : row.breakfast}</td>
        <td>${typeof row.lunch === "number" ? (row.lunch % 1 === 0 ? row.lunch.toFixed(0) : row.lunch.toFixed(1)) : row.lunch}</td>
        <td>${typeof row.dinner === "number" ? (row.dinner % 1 === 0 ? row.dinner.toFixed(0) : row.dinner.toFixed(1)) : row.dinner}</td>
      `;
      foodTableBody.appendChild(tr);
    });
  }

  renderTable(normalPortions);
});
