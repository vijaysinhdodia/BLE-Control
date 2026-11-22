import { BleClient } from "@capacitor-community/bluetooth-le";

// Rename these labels to whatever your relays do. Packet bit stays the same.
const CH = [
  { n: "Relay 1", d: "Forward output",  bit: 0x01 },
  { n: "Relay 2", d: "Backward output", bit: 0x02 },
  { n: "Relay 3", d: "Left output",     bit: 0x04 },
  { n: "Relay 4", d: "Right output",    bit: 0x08 }
];
const SVC = "0000fff0-0000-1000-8000-00805f9b34fb";
const WR  = "0000fff2-0000-1000-8000-00805f9b34fb";
const NT  = "0000fff1-0000-1000-8000-00805f9b34fb";
const IDLE = 0x40, MODE = 0x02, TICK = 140;

const $ = (i) => document.getElementById(i);
let st = 0, deviceId = null, timer = null, busy = false, lines = [], inited = false;

function log(t, c) {
  const d = new Date();
  const ts = ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2);
  lines.push('<span class="' + (c || "") + '">' + ts + " " + t + "</span>");
  if (lines.length > 4) lines.shift();
  $("log").innerHTML = lines.join("\n");
}

const list = $("list");
CH.forEach((c) => {
  const r = document.createElement("div"); r.className = "row";
  r.innerHTML = "<div><b></b><small></small></div>";
  r.querySelector("b").textContent = c.n;
  r.querySelector("small").textContent = c.d;
  const s = document.createElement("button"); s.className = "sw"; s.disabled = true;
  s.setAttribute("role", "switch"); s.setAttribute("aria-pressed", "false"); s.setAttribute("aria-label", c.n);
  s.onclick = () => { st ^= c.bit; paint(); send(); };
  r.appendChild(s); list.appendChild(r);
});
function paint() {
  document.querySelectorAll(".sw").forEach((s, i) =>
    s.setAttribute("aria-pressed", (st & CH[i].bit) ? "true" : "false"));
}
function lock(on) {
  document.querySelectorAll(".sw").forEach((s) => (s.disabled = !on));
  $("alloff").disabled = !on;
}

// Packet: AA 00 02 00 00 00 00 | byte8 = idle flag + relay bits | byte9 = 00 | board mode 02
async function send() {
  if (!deviceId || busy) return;
  busy = true;
  try {
    const p = new Uint8Array([0xAA, 0, 2, 0, 0, 0, 0, IDLE | st, 0x00, MODE]);
    await BleClient.write(deviceId, SVC, WR, new DataView(p.buffer)); // acknowledged write, as the original app
  } catch (e) {
    if (!/in progress/i.test(String(e.message || e))) log("write failed: " + (e.message || e), "e");
  }
  setTimeout(() => (busy = false), 30);
}

async function connect() {
  try {
    if (!inited) { await BleClient.initialize({ androidNeverForLocation: true }); inited = true; }
    log("choose device…");
    const dev = await BleClient.requestDevice({ name: "YC_CAR_DEMO", optionalServices: [SVC] });
    log("connecting…");
    await BleClient.connect(dev.deviceId, () => drop());
    deviceId = dev.deviceId;
    await new Promise((r) => setTimeout(r, 1000));
    try { await BleClient.startNotifications(deviceId, SVC, NT, () => {}); } catch (e) {}
    await new Promise((r) => setTimeout(r, 500));
    st = 0; paint(); lock(true);
    $("conn").textContent = "Connected. Tap to disconnect";
    $("conn").classList.add("live");
    log("connected", "g");
    send(); timer = setInterval(send, TICK);
  } catch (e) {
    log("connect failed: " + (e.message || e), "e");
  }
}
function drop() {
  clearInterval(timer); deviceId = null; st = 0; paint(); lock(false);
  $("conn").textContent = "Connect to YC_CAR_DEMO";
  $("conn").classList.remove("live");
  log("disconnected", "e");
}
$("conn").onclick = async () => {
  if (deviceId) {
    const id = deviceId; st = 0; await send();
    setTimeout(() => BleClient.disconnect(id).catch(() => {}), 250);
  } else connect();
};
$("alloff").onclick = () => { st = 0; paint(); send(); };
