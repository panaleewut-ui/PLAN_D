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

  if (!gender || !tdeeBase || !tdeeFinal) {
    foodTableBody.innerHTML = "<p>ไม่พบข้อมูลการคำนวณ โปรดย้อนกลับไปกรอกใหม่</p>";
    return;
  }

  personalInfo.innerHTML = `
    อายุ ${age} ปี<br>
    น้ำหนัก ${weight} กก.<br>
    ส่วนสูง ${height} ซม.
  `;

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
    foodTableBody.innerHTML = `<p style="text-align:center;color:#666;padding:1rem;">
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

  const foodOrder = [
    { type: "ข้าว-แป้ง", color: "#fff9cc" },
    { type: "เนื้อสัตว์", isHeader: true, color: "#ffffff" },
    { type: "เนื้อสัตว์ไขมันต่ำมาก", indent: true, color: "#ffe1e6" },
    { type: "เนื้อสัตว์ไขมันต่ำ", indent: true, color: "#ffc4cc" },
    { type: "เนื้อสัตว์ไขมันปานกลาง", indent: true, color: "#ffa3af" },
    { type: "เนื้อสัตว์ไขมันสูง", indent: true, color: "#ff8899" },
    { type: "ไขมัน", color: "#eeeeee" },
    { type: "ผัก", isHeader: true, color: "#ffffff" },
    { type: "ผัก ก", indent: true, color: "#e8fbe8" },
    { type: "ผัก ข", indent: true, color: "#d4f5d4" },
    { type: "ผลไม้", color: "#ffe6f0" },
    { type: "นม", isHeader: true, color: "#ffffff" },
    { type: "นมไขมันเต็มส่วน", indent: true, color: "#d9ecff" },
    { type: "นมพร่องมันเนย", indent: true, color: "#c2e0ff" },
    { type: "นมขาดมันเนย", indent: true, color: "#add4ff" },
    { type: "น้ำตาลเพิ่มสำหรับประกอบอาหาร", color: "#f0f0f0" }
  ];

  function sortByFoodOrder(portions) {
    return foodOrder
      .map((fo) => portions.find((p) => p.type === fo.type) || fo)
      .filter((item) => item);
  }

  normalPortions = sortByFoodOrder(normalPortions);

  // ✅ computeMeals() แก้ตามเงื่อนไข Atom ทั้งหมด
  function computeMeals(portions) {
    function splitNormal(n) {
      if (n === 0) return ["-", "-", "-"];
      if (n <= 1) return ["-", n, "-"];
      const units = Math.round(n * 2);
      const base = Math.floor(units / 3);
      let rem = units - base * 3;
      let parts = [base, base, base];
      if (rem === 1) parts[1] += 1;
      if (rem === 2) { parts[0] += 1; parts[1] += 1; }
      return parts.map((u) => u / 2);
    }

    function splitMeat(p) {
      const { total, type } = p;
      if (total === 0) return ["-", "-", "-"];
      let [b, l, d] = [0, 0, 0];
      switch (type) {
        case "เนื้อสัตว์ไขมันต่ำมาก": d = total; break;
        case "เนื้อสัตว์ไขมันต่ำ": b = total; break;
        case "เนื้อสัตว์ไขมันปานกลาง": l = total; break;
        case "เนื้อสัตว์ไขมันสูง":
          if (total >= 2) { b = 1; l = total - 1; } else { l = total; }
          break;
      }
      return [b, l, d];
    }

    const grayTypes = ["ผลไม้", "นมไขมันเต็มส่วน", "นมพร่องมันเนย", "นมขาดมันเนย", "น้ำตาลเพิ่มสำหรับประกอบอาหาร"];

    return portions.map((p) => {
      if (p.isHeader) return { ...p, breakfast: "-", lunch: "-", dinner: "-", gray: false };
      if (grayTypes.includes(p.type)) return { ...p, breakfast: "-", lunch: "-", dinner: "-", gray: true };
      if (["เนื้อสัตว์ไขมันต่ำมาก", "เนื้อสัตว์ไขมันต่ำ", "เนื้อสัตว์ไขมันปานกลาง", "เนื้อสัตว์ไขมันสูง"].includes(p.type)) {
        const [b, l, d] = splitMeat(p);
        return { ...p, breakfast: b, lunch: l, dinner: d, gray: false };
      }
      const [b, l, d] = splitNormal(p.total);
      return { ...p, breakfast: b, lunch: l, dinner: d, gray: false };
    });
  }

  function renderTable(portions) {
    foodTableBody.innerHTML = "";
    const withMeals = computeMeals(portions);

    withMeals.forEach((row, idx) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-type", row.type);
      tr.style.backgroundColor = row.color || "white";

      const indentStyle = row.indent ? "padding-left: 20px;" : "";
      const boldStyle = row.isHeader ? "font-weight: 600;" : "";

      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td style="text-align:left; ${indentStyle} ${boldStyle}">${row.type}</td>
        <td>${row.total || "-"}</td>
        <td class="${row.gray ? 'gray-meal' : ''}">${formatCell(row.breakfast)}</td>
        <td class="${row.gray ? 'gray-meal' : ''}">${formatCell(row.lunch)}</td>
        <td class="${row.gray ? 'gray-meal' : ''}">${formatCell(row.dinner)}</td>
      `;
      foodTableBody.appendChild(tr);
    });
  }

  function formatCell(val) {
    return typeof val === "number"
      ? val % 1 === 0
        ? val.toFixed(0)
        : val.toFixed(1)
      : val;
  }

  renderTable(normalPortions);
});
