"use strict";

const form = document.getElementById("height-form");
const heightInput = document.getElementById("initial-height");
const levelInput = document.getElementById("level");
const levelSlider = document.getElementById("level-slider");
const levelDisplay = document.getElementById("level-display");
const resultValue = document.getElementById("result-value");
const resultDetail = document.getElementById("result-detail");
const resetButton = document.getElementById("reset-data");
const storageStatus = document.getElementById("storage-status");
const STORAGE_KEY = "codextest.petHeightCalculator.v1";

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      initialHeight: heightInput.value,
      level: levelInput.value,
    }));
    storageStatus.textContent = "已自動儲存於此瀏覽器本機。";
  } catch {
    storageStatus.textContent = "瀏覽器無法儲存資料；目前仍可計算，但重新整理後可能無法恢復。";
  }
}

function restoreData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return;
    const data = JSON.parse(raw);
    if (!data || typeof data.initialHeight !== "string" || typeof data.level !== "string") {
      throw new Error("Invalid saved data");
    }
    const level = Number(data.level);
    // 有效數值才恢復；損壞或未完成的輸入回到預設值。
    if (data.initialHeight === "" || (Number.isFinite(Number(data.initialHeight)) && Number(data.initialHeight) > 0)) {
      heightInput.value = data.initialHeight;
    }
    if (data.level !== "" && Number.isInteger(level) && level >= 1 && level <= 100) {
      levelInput.value = String(level);
    }
    storageStatus.textContent = "已恢復上次儲存在此瀏覽器的資料。";
  } catch {
    storageStatus.textContent = "無法讀取上次資料，已使用預設值；仍可正常計算。";
  }
}

function calculateHeight(reportErrors = false) {
  heightInput.setCustomValidity("");
  levelInput.setCustomValidity("");
  const initialHeight = Number(heightInput.value);
  const level = Number(levelInput.value);

  if (!Number.isFinite(initialHeight) || initialHeight <= 0) {
    heightInput.setCustomValidity("請輸入大於 0 的初始身高。");
    resultValue.textContent = "等待輸入";
    resultDetail.textContent = "請輸入大於 0 的初始身高（公尺（m））。";
    if (reportErrors) heightInput.reportValidity();
    return;
  }
  if (!Number.isInteger(level) || level < 1 || level > 100) {
    levelInput.setCustomValidity("請輸入 1～100 的整數等級。");
    resultValue.textContent = "等待有效等級";
    resultDetail.textContent = "請輸入 1～100 的整數等級，或拖動滑桿。";
    if (reportErrors) levelInput.reportValidity();
    return;
  }

  const currentHeight = initialHeight * (1 + 0.1 * (level - 1));
  if (!Number.isFinite(currentHeight)) {
    resultValue.textContent = "數值過大";
    resultDetail.textContent = "請調小初始身高或等級後再試一次。";
    return;
  }
  resultValue.textContent = `${currentHeight.toLocaleString("zh-TW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} 公尺（m）`;
  resultDetail.textContent = `${initialHeight} × (1 + 0.1 × (${level} − 1))，計算結果四捨五入至小數點後 2 位。`;
}

function syncLevel(value) {
  levelSlider.value = String(value);
  levelDisplay.textContent = `Lv.${value}`;
  levelSlider.setAttribute("aria-valuetext", `Lv.${value}`);
}

heightInput.addEventListener("input", () => {
  calculateHeight();
  saveData();
});
levelSlider.addEventListener("input", () => {
  levelInput.value = levelSlider.value;
  syncLevel(Number(levelSlider.value));
  calculateHeight();
  saveData();
});
levelInput.addEventListener("input", () => {
  const level = Number(levelInput.value);
  if (levelInput.value !== "" && Number.isInteger(level) && level >= 1 && level <= 100) {
    syncLevel(level);
  }
  calculateHeight();
  saveData();
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculateHeight(true);
});

resetButton.addEventListener("click", () => {
  if (!window.confirm("確定要清除已儲存的資料嗎？初始身高將清空，等級將恢復為 Lv.1。")) return;
  try {
    // 只刪除此計算器的資料，不影響同來源的其他資料。
    localStorage.removeItem(STORAGE_KEY);
    storageStatus.textContent = "已清除儲存資料，並恢復預設值。";
  } catch {
    storageStatus.textContent = "畫面已重設，但瀏覽器無法清除儲存資料。";
  }
  form.reset();
  syncLevel(1);
  calculateHeight();
});

restoreData();
syncLevel(Number(levelInput.value));
calculateHeight();
