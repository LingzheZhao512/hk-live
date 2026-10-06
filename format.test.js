import { test } from "node:test";
import assert from "node:assert/strict";
import { formatTemp, formatAqhi, nextTrain } from "./format.js";

test("formatTemp returns -- for an empty station list", () => {
  assert.equal(formatTemp({ temperature: { data: [] } }), "--");
});

const time = "2026-09-29T09:00:00+08:00";
const weather = data => ({ temperature: { data }, updateTime: time });
const hko = value => ({ place: "Hong Kong Observatory", value, unit: "C" });
const train = (ttnt = "3", dest = "CHW") => ({ status: 1, data: { "ISL-HKU": { UP: [{ ttnt, dest }] } } });

test("temperature finds the named station after another station", () => {
  assert.equal(formatTemp(weather([{ place: "Kwun Tong", value: 31, unit: "C" }, hko(29)])),
    `Hong Kong Observatory\n29 °C\n${time}`);
});
test("temperature handles a missing named station", () => {
  assert.equal(formatTemp(weather([{ place: "Kwun Tong", value: 31, unit: "C" }])), "--");
});
test("temperature preserves a valid zero", () => {
  assert.equal(formatTemp(weather([hko(0)])), `Hong Kong Observatory\n0 °C\n${time}`);
});
test("temperature rejects malformed data, missing values, wrong units and invalid times", () => {
  for (const data of [null, {}, weather([hko(undefined)]), weather([hko(NaN)]),
    weather([{ ...hko(29), unit: "F" }]), { ...weather([hko(29)]), updateTime: "invalid" }]) {
    assert.equal(formatTemp(data), "--");
  }
});
test("air quality displays the reading, risk and optional publication date", () => {
  assert.equal(formatAqhi([{ station: "Central/Western", aqhi: 4, health_risk: "Moderate", publish_date: "2026-09-29 09:00" }]),
    "Central/Western\nAQHI 4\nModerate · 2026-09-29 09:00");
});
test("air quality uses exact matching when Central/Western comes first", () => {
  const stations = [{ station: "Central/Western", aqhi: 3, health_risk: "Low" },
    { station: "Central", aqhi: 4, health_risk: "Moderate" }];
  assert.equal(formatAqhi(stations, "Central"), "Central\nAQHI 4\nModerate");
});
test("air quality supports 10+", () => {
  assert.equal(formatAqhi([{ station: "Central/Western", aqhi: "10+", health_risk: "Serious" }]),
    "Central/Western\nAQHI 10+\nSerious");
});
test("air quality handles absent stations and missing readings", () => {
  for (const data of [null, [], [{ station: "Central", aqhi: 3, health_risk: "Low" }],
    [{ station: "Central/Western", health_risk: "Low" }]]) assert.equal(formatAqhi(data), "--");
});
test("train converts string minutes without adding one", () => {
  assert.equal(nextTrain(train("03")), "HKU · Island line\n3 min\nDestination: Chai Wan");
});
test("train preserves zero minutes", () => {
  assert.equal(nextTrain(train("0")), "HKU · Island line\n0 min\nDestination: Chai Wan");
});
test("train rejects status 0 even when the HTTP request succeeded", () => {
  assert.throws(() => nextTrain({ status: 0, message: "The contents are empty!" }), /contents are empty/);
});
test("train rejects a string status and malformed schedule", () => {
  for (const data of [{ ...train(), status: "1" }, { status: 1 }, { status: 1, data: {} }, train("bad")]) {
    assert.throws(() => nextTrain(data));
  }
});
test("train handles an empty direction", () => {
  assert.equal(nextTrain({ status: 1, data: { "ISL-HKU": { UP: [] } } }),
    "HKU · Island line: No upcoming trains in this direction.");
});
test("train rejects a missing or null direction instead of claiming no trains", () => {
  for (const schedule of [{}, { UP: null }]) {
    assert.throws(() => nextTrain({ status: 1, data: { "ISL-HKU": schedule } }));
  }
});
test("unknown destination remains explicitly labelled as a station code", () => {
  assert.equal(nextTrain(train("3", "ABC")), "HKU · Island line\n3 min\nDestination: Station code: ABC");
});
