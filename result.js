// result.js (module)
import { foodPlans } from "./data.js";
import { nutritionData } from "./dataExtra.js";

document.addEventListener("DOMContentLoaded", () => {
  const gender = localStorage.getItem("gender");
  const age = localStorage.getItem("age");
  const weight = parseFloat(localStorage.getItem("weight") || 0);
  const height = localStorage.getItem("height");
  const goal = localStorage.getItem("goal");
  const bmr = parseFloat(localStorage.getItem("bmr") || 0);
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
  goalResult.textContent = `เป้าหมายของคุณ: ${goal === 'maintain' ? 'คงน้ำหนัก' : (goal === 'lose' ? 'ลดน้ำหนัก' : 'เพิ่มน้ำหนัก')}`;
  tdeeOriginal.textContent = `TDEE (ก่อนปรับเป้าหมาย): ${Math.round(tdeeBase)} kcal`;
  tdeeResult.textContent = `พลังงานตามเป้าหมาย: ${Math.round(tdeeFinal)} kcal`;
  proteinResult.textContent = `ปริมาณโปรตีนที่แนะนำ: ${proteinNeed} กรัม / วัน`;

  // หาแผนอาหารที่ตรงกับ tdeeFinal และ proteinNeed
  const matchPlan = foodPlans.find(p =>
    tdeeFinal >= p.energyRange[0] &&
    tdeeFinal <= p.energyRange[1] &&
    proteinNeed >= p.proteinRange[0] &&
    proteinNeed <= p.proteinRange[1]
  );

  // 🧮 หา nutrition data จากไฟล์ใหม่
  const matchNutrition = nutritionData.find(n =>
    tdeeFinal >= n.energyMin &&
    tdeeFinal <= n.energyMax &&
    proteinNeed >= n.proteinMin &&
    proteinNeed <= n.proteinMax
  );

  // ถ้ามีข้อมูล nutritionData ให้ใช้แทนข้อมูลใน matchPlan
  if (matchNutrition) {
    matchPlan.kcalActual = matchNutrition.kcalActual;
    matchPlan.proteinActual = matchNutrition.proteinActual;
    matchPlan.carbPercent = matchNutrition.carbPercent;
    matchPlan.proteinPercent = matchNutrition.proteinPercent;
    matchPlan.fatPercent = matchNutrition.fatPercent;
  }

  if (!matchPlan) {
    foodTableContainer.innerHTML = `
      <p style="text-align:center;color:#666;padding:1rem;">
        ❗ ระบบยังไม่มีฐานข้อมูลนี้ โปรดติดตามในอนาคต
      </p>
    `;
    return;
  }

  // แสดง caloric distribution
  distBoxes.innerHTML = `
    <div class="dist-box">คาร์โบไฮเดรต<br><strong>${matchPlan.carbPercent}%</strong></div>
    <div class="dist-box">โปรตีน<br><strong>${matchPlan.proteinPercent}%</strong></div>
    <div class="dist-box">ไขมัน<br><strong>${matchPlan.fatPercent}%</strong></div>
  `;

  // ข้อความตัวอย่างสัดส่วน
  exampleText.textContent = `ตัวอย่างสัดส่วนอาหารที่ให้พลังงาน ${matchPlan.kcalActual} kcal และโปรตีน ${matchPlan.proteinActual} g`;

  // ฟังก์ชันช่วย
  function normalizePortions(portions) {
    return portions.filter(it => it.total && Number(it.total) !== 0)
                   .map(it => ({ ...it, total: Number(it.total) }));
  }

  let normalPortions = normalizePortions(matchPlan.portions);

  // ✅ ฟังก์ชันเรียงหมวดอาหารอัตโนมัติ
  function sortByFoodOrder(portions) {
    const order = [
      "ข้าว-แป้ง",
      "เนื้อสัตว์ไขมันต่ำมาก",
      "เนื้อสัตว์ไขมันต่ำ",
      "เนื้อสัตว์ไขมันปานกลาง",
      "เนื้อสัตว์ไขมันสูง",
      "ไขมัน",
      "ผัก ก",
      "ผัก ข",
      "ผลไม้",
      "นมไขมันเต็มส่วน",
      "นมพร่องมันเนย",
      "นมขาดมันเนย",
      "น้ำตาลเพิ่มสำหรับประกอบอาหาร"
    ];
    return portions.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  }

  normalPortions = sortByFoodOrder(normalPortions);

  // 🧮 แบ่งส่วนมื้ออาหาร
  function computeMeals(portions) {
    function splitIntoThree(n) {
      const units = Math.round(n * 2);
      const base = Math.floor(units / 3);
      let rem = units - base * 3;
      let parts = [base, base, base];
      if (rem === 1) parts[1] += 1;
      if (rem === 2) { parts[0] += 1; parts[1] += 1; }
      return parts.map(u => u / 2);
    }

    return portions.map(p => {
      const [b, l, d] = splitIntoThree(p.total);
      return { ...p, breakfast: b, lunch: l, dinner: d };
    });
  }

  let renderedCombined = false;

  function renderTable(portions, combineMeat = false) {
    foodTableBody.innerHTML = "";

    let working = JSON.parse(JSON.stringify(portions));
    if (combineMeat) {
      const meatKeys = ["เนื้อสัตว์", "ถั่ว"];
      const meat = working.filter(r => meatKeys.some(k => r.type.includes(k)));
      const others = working.filter(r => !meatKeys.some(k => r.type.includes(k)));
      if (meat.length > 0) {
        const totalMeat = meat.reduce((s, x) => s + Number(x.total), 0);
        others.unshift({
          type: "เนื้อสัตว์ (รวม)",
          total: totalMeat
        });
      }
      working = others;
    }

    const withMeals = computeMeals(working);

    withMeals.forEach((row, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td style="text-align:left">${row.type}</td>
        <td>${row.total}</td>
        <td>${row.breakfast % 1 === 0 ? row.breakfast.toFixed(0) : row.breakfast.toFixed(1)}</td>
        <td>${row.lunch % 1 === 0 ? row.lunch.toFixed(0) : row.lunch.toFixed(1)}</td>
        <td>${row.dinner % 1 === 0 ? row.dinner.toFixed(0) : row.dinner.toFixed(1)}</td>
      `;
      foodTableBody.appendChild(tr);
    });
  }

  // 🔹 Render เริ่มต้น
  renderTable(normalPortions, false);

  // 🔹 Toggle รวม/แยกเนื้อสัตว์
  combineToggle.addEventListener("click", () => {
    renderedCombined = !renderedCombined;
    combineToggle.textContent = renderedCombined ? "แยกเนื้อสัตว์" : "รวมเนื้อสัตว์";
    renderTable(normalPortions, renderedCombined);
  });
});
