import { formatTemp, formatAqhi, nextTrain } from "./format.js";

const WEATHER_API = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en";
const AIR_API = "https://dashboard.data.gov.hk/api/aqhi-individual?format=json";
const MTR_LINE = "ISL";
const MTR_STA = "HKU";
const TRAIN_API = `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${MTR_LINE}&sta=${MTR_STA}`;
const STATION_NAME = "Hong Kong Observatory";
const AIR_STATION = "Central/Western";

// Each formatter returns display text. Newlines preserve the original three-line card layout.
function renderCard(id, text) {
  const content = document.getElementById(id);
  const lines = text.split("\n");
  if (lines.length === 1) {
    content.textContent = text;
    return;
  }
  content.replaceChildren();
  lines.forEach((line, index) => {
    const element = document.createElement("p");
    element.textContent = line;
    if (index === 1) element.className = "weather-temp";
    content.append(element);
  });
}

async function loadCard(id, url, formatter, unavailable) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error("HTTP error");
    const text = formatter(await response.json());
    renderCard(id, text === "--" ? unavailable : text);
  } catch (error) {
    renderCard(id, unavailable);
  } finally {
    clearTimeout(timer);
  }
}

loadCard("weather-content", WEATHER_API, data => formatTemp(data, STATION_NAME),
  "Weather data is currently unavailable. Please try again later.");
loadCard("air-content", AIR_API, data => formatAqhi(data, AIR_STATION),
  "Air quality data is currently unavailable. Please try again later.");
loadCard("transport-content", TRAIN_API, data => nextTrain(data, MTR_LINE, MTR_STA),
  "Train data is currently unavailable. Please try again later.");
