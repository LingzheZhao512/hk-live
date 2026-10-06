// Pure formatting functions: no fetch, document or browser dependencies.
export function formatTemp(data, name = "Hong Kong Observatory") {
  const stations = data && data.temperature && data.temperature.data;
  if (!Array.isArray(stations)) return "--";
  const station = stations.find(item => item && item.place === name);
  if (!station) return "--";
  if (typeof station.value !== "number" || !Number.isFinite(station.value) ||
      station.unit !== "C" || typeof data.updateTime !== "string" ||
      !Number.isFinite(Date.parse(data.updateTime))) return "--";
  return `${station.place}\n${station.value} °C\n${data.updateTime}`;
}

export function formatAqhi(stations, name = "Central/Western") {
  if (!Array.isArray(stations)) return "--";
  const station = stations.find(item => item && item.station === name);
  if (!station || !/^(?:[1-9]|10|10\+)$/.test(String(station.aqhi)) ||
      typeof station.health_risk !== "string" || !station.health_risk.trim()) return "--";
  return `${station.station}\nAQHI ${station.aqhi}\n${station.health_risk}${station.publish_date ? " · " + station.publish_date : ""}`;
}

export function nextTrain(json, line = "ISL", sta = "HKU") {
  if (!json || json.status !== 1) throw new Error(json && json.message || "No schedule");
  const schedule = json.data && json.data[`${line}-${sta}`];
  const trains = schedule && schedule.UP;
  const label = `${sta} · ${line === "ISL" ? "Island line" : line}`;
  if (Array.isArray(trains) && trains.length === 0) {
    return `${label}: No upcoming trains in this direction.`;
  }
  if (!Array.isArray(trains) || !trains[0]) throw new Error("Invalid schedule");
  const train = trains[0];
  if (!/^\d+$/.test(String(train.ttnt))) throw new Error("Invalid minutes");
  const minutes = Number(train.ttnt);
  if (!Number.isSafeInteger(minutes) || typeof train.dest !== "string" || !train.dest.trim()) {
    throw new Error("Invalid train");
  }
  const destinations = { CHW: "Chai Wan", KET: "Kennedy Town" };
  const destination = destinations[train.dest] || "Station code: " + train.dest;
  return `${label}\n${minutes} min\nDestination: ${destination}`;
}
