// ==========================================================================
// SOUND METER PRO - 4U.IA
// Decibelímetro Digital, Analisador RTA & Emissor de Laudo Acústico
// Normas: IEC 61672-1, ABNT NBR 10151 e NR-15 (MTE)
// ==========================================================================

// --- ESTADO GERAL DO APLICATIVO ---
let audioContext = null;
let analyser = null;
let microphoneSource = null;
let isCapturing = false;
let animationFrameId = null;

// Configurações de Calibração & Admin
let baseOffset = 87.0; // Deslocamento base para calibrar RMS/FFT para dBA real
let userCalibrationOffset = 0.0; // Offset dinâmico do usuário (-20 a +20 dB)
let sampleInterval = 50; // Taxa de amostragem em ms

// Modos de Ponderação e Tempo de Resposta (IEC 61672)
let activeWeighting = "A"; // "A" (dBA), "C" (dBC) ou "Z" (dBZ linear)
let activeSpeed = "fast";   // "fast" (125ms) ou "slow" (1000ms)
let currentChartMode = "history"; // "history" (gráfico no tempo) ou "rta" (espectro de frequência)

// Tabelas de Ponderação Frequencial Pré-computadas
let aWeightingTable = null;
let cWeightingTable = null;

// Histórico de Dados
let dbHistory = []; // { time: Date, db: number }
const maxHistorySize = 100;

// Métricas Estatísticas
let minDb = Infinity;
let maxDb = -Infinity;
let peakDb = -Infinity;
let sumOfPressures = 0; // Para Leq (Média Logarítmica)
let sampleCount = 0;
let smoothedDb = 0;

// Dosímetro e Tempo de Medição
let measurementStartTime = null;
let measurementElapsedSeconds = 0;
let durationInterval = null;

// Screen Wake Lock API
let wakeLockSentinel = null;

// Alarme e Vibração
let alarmThreshold = 85.0;
let alarmEnabled = true;
let lastAlarmVibrateTime = 0;

// --- ELEMENTOS DO DOM ---
const permissionPrompt = document.getElementById("permission-prompt");
const btnRequestPermission = document.getElementById("btn-request-permission");
const dbDisplay = document.getElementById("db-display");
const dbUnitLabel = document.getElementById("db-unit-label");
const noiseClass = document.getElementById("noise-class");
const gaugeFill = document.getElementById("gauge-fill");

const statMin = document.getElementById("stat-min");
const statAvg = document.getElementById("stat-avg");
const statMax = document.getElementById("stat-max");
const statPeak = document.getElementById("stat-peak");

const unitStatMin = document.getElementById("unit-stat-min");
const unitStatAvg = document.getElementById("unit-stat-avg");
const unitStatMax = document.getElementById("unit-stat-max");
const unitStatPeak = document.getElementById("unit-stat-peak");

const btnToggleCapture = document.getElementById("btn-toggle-capture");
const btnReset = document.getElementById("btn-reset");
const btnOpenReport = document.getElementById("btn-open-report");
const btnHeaderReport = document.getElementById("btn-header-report");

const calibrationSlider = document.getElementById("calibration-slider");
const calibrationValue = document.getElementById("calibration-value");

const alarmToggle = document.getElementById("alarm-toggle");
const alarmThresholdInput = document.getElementById("alarm-threshold");
const mainMeterCard = document.querySelector(".main-meter-card");
const wakelockIndicator = document.getElementById("wakelock-indicator");

// Abas de Legislação
const tabNr15 = document.getElementById("tab-nr15");
const tabNbr10151 = document.getElementById("tab-nbr10151");
const contentNr15 = document.getElementById("content-nr15");
const contentNbr10151 = document.getElementById("content-nbr10151");

// Diagnósticos & Filtros
const zoneSelect = document.getElementById("zone-select");
const periodSelect = document.getElementById("period-select");
const nr15Diagnostic = document.getElementById("nr15-diagnostic");
const nbrDiagnostic = document.getElementById("nbr-diagnostic");

// Dosímetro NR-15
const doseBadge = document.getElementById("dose-badge");
const doseBarFill = document.getElementById("dose-bar-fill");
const doseElapsedTime = document.getElementById("dose-elapsed-time");
const doseProjected = document.getElementById("dose-projected");
const doseMaxTime = document.getElementById("dose-max-time");

// Gráficos (Histórico e RTA)
const canvas = document.getElementById("noise-chart");
const ctx = canvas.getContext("2d");
const rtaCanvas = document.getElementById("rta-chart");
const rtaCtx = rtaCanvas.getContext("2d");
const tabChartHistory = document.getElementById("tab-chart-history");
const tabChartRta = document.getElementById("tab-chart-rta");

// Modal de Laudo Técnico
const reportModal = document.getElementById("report-modal");
const btnCloseReport = document.getElementById("btn-close-report");
const btnCloseReportFooter = document.getElementById("btn-close-report-footer");
const btnPrintReport = document.getElementById("btn-print-report");
const btnExportCsvReport = document.getElementById("btn-export-csv-report");

// Modal Admin Oculto
const logoLink = document.getElementById("logo-link");
const adminLoginModal = document.getElementById("admin-login-modal");
const adminPanelModal = document.getElementById("admin-panel-modal");
const btnCloseLogin = document.getElementById("btn-close-login");
const btnCloseAdminPanel = document.getElementById("btn-close-admin-panel");
const adminLoginForm = document.getElementById("admin-login-form");
const adminUsernameInput = document.getElementById("admin-username");
const adminPasswordInput = document.getElementById("admin-password");
const loginErrorMsg = document.getElementById("login-error-msg");

const adminBaseOffset = document.getElementById("admin-base-offset");
const adminUpdateInterval = document.getElementById("admin-update-interval");
const btnSaveAdminSettings = document.getElementById("btn-save-admin-settings");
const btnExportJson = document.getElementById("btn-export-json");
const btnExportCsv = document.getElementById("btn-export-csv");

const diagSampleRate = document.getElementById("diag-sample-rate");
const diagFftSize = document.getElementById("diag-fft-size");
const diagAudioState = document.getElementById("diag-audio-state");

// --- RESPONSIVIDADE DOS CANVASES ---
function resizeCanvases() {
    const container = canvas.parentElement;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    
    canvas.width = w;
    canvas.height = h;
    rtaCanvas.width = w;
    rtaCanvas.height = h;
    
    if (currentChartMode === "history") {
        drawChart();
    }
}
window.addEventListener("resize", resizeCanvases);
setTimeout(resizeCanvases, 100);

// --- TAB SWITCHING (LEGISLAÇÃO) ---
tabNr15.addEventListener("click", () => {
    tabNr15.classList.add("active");
    tabNbr10151.classList.remove("active");
    contentNr15.classList.add("active");
    contentNbr10151.classList.remove("active");
});

tabNbr10151.addEventListener("click", () => {
    tabNbr10151.classList.add("active");
    tabNr15.classList.remove("active");
    contentNbr10151.classList.add("active");
    contentNr15.classList.remove("active");
});

// --- TAB SWITCHING (GRÁFICOS: HISTÓRICO VS RTA) ---
if (tabChartHistory && tabChartRta) {
    tabChartHistory.addEventListener("click", () => {
        currentChartMode = "history";
        tabChartHistory.classList.add("active");
        tabChartRta.classList.remove("active");
        canvas.classList.remove("hidden");
        rtaCanvas.classList.add("hidden");
        drawChart();
    });

    tabChartRta.addEventListener("click", () => {
        currentChartMode = "rta";
        tabChartRta.classList.add("active");
        tabChartHistory.classList.remove("active");
        rtaCanvas.classList.remove("hidden");
        canvas.classList.add("hidden");
    });
}

// --- CONTROLES DE PONDERAÇÃO E VELOCIDADE ---
document.querySelectorAll("#weighting-pills .pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#weighting-pills .pill-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeWeighting = btn.getAttribute("data-weighting");
        
        const unitText = `dB${activeWeighting}`;
        if (dbUnitLabel) dbUnitLabel.textContent = unitText;
        if (unitStatMin) unitStatMin.textContent = unitText;
        if (unitStatAvg) unitStatAvg.textContent = unitText;
        if (unitStatMax) unitStatMax.textContent = unitText;
        if (unitStatPeak) unitStatPeak.textContent = unitText;
    });
});

document.querySelectorAll("#speed-pills .pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#speed-pills .pill-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeSpeed = btn.getAttribute("data-speed");
    });
});

// --- ALARME & VIBRAÇÃO CONFIGS ---
if (alarmToggle) {
    alarmToggle.addEventListener("change", (e) => {
        alarmEnabled = e.target.checked;
        if (!alarmEnabled && mainMeterCard) {
            mainMeterCard.classList.remove("alarm-flash");
        }
    });
}

if (alarmThresholdInput) {
    alarmThresholdInput.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        alarmThreshold = isNaN(val) ? 85.0 : val;
    });
}

// --- SCREEN WAKE LOCK (TELA SEMPRE ACESA) ---
async function requestWakeLock() {
    if ("wakeLock" in navigator) {
        try {
            wakeLockSentinel = await navigator.wakeLock.request("screen");
            if (wakelockIndicator) wakelockIndicator.classList.remove("hidden");
            
            wakeLockSentinel.addEventListener("release", () => {
                if (wakelockIndicator) wakelockIndicator.classList.add("hidden");
            });
        } catch (err) {
            console.log("WakeLock não suportado ou negado:", err);
        }
    }
}

function releaseWakeLock() {
    if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
        wakeLockSentinel = null;
    }
    if (wakelockIndicator) wakelockIndicator.classList.add("hidden");
}

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && isCapturing) {
        requestWakeLock();
    }
});

// --- PRÉ-COMPUTAÇÃO DAS CURVAS DE PONDERAÇÃO (IEC 61672-1) ---
function computeWeightingTables(sampleRate, fftSize) {
    const binCount = fftSize / 2;
    aWeightingTable = new Float32Array(binCount);
    cWeightingTable = new Float32Array(binCount);
    
    const binFreqStep = sampleRate / fftSize;
    const c1 = 12194.217 * 12194.217;
    const c2 = 20.598997 * 20.598997;
    const c3 = 107.65265 * 107.65265;
    const c4 = 737.86223 * 737.86223;
    
    for (let i = 0; i < binCount; i++) {
        const f = Math.max(i * binFreqStep, 10);
        const f2 = f * f;
        const f4 = f2 * f2;
        
        // Ponderação A: 20*log10(Ra(f)) + 2.00
        const numA = c1 * f4;
        const denA = (f2 + c2) * Math.sqrt((f2 + c3) * (f2 + c4)) * (f2 + c1);
        const ra = numA / denA;
        aWeightingTable[i] = 20 * Math.log10(ra) + 2.0;
        
        // Ponderação C: 20*log10(Rc(f)) + 0.06
        const numC = c1 * f2;
        const denC = (f2 + c2) * (f2 + c1);
        const rc = numC / denC;
        cWeightingTable[i] = 20 * Math.log10(rc) + 0.06;
    }
}

// --- CAPTURA DE ÁUDIO REAL (SEM AGC/COMPRESSÃO) ---
async function initAudio() {
    try {
        // Desativação estrita de AGC, cancelamento de eco e supressão de ruído
        const constraints = {
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            },
            video: false
        };
        
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
            console.warn("Constraints estritas rejeitadas, tentando fallback com áudio básico:", e);
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        }
        
        permissionPrompt.classList.add("hidden");
        
        // Setup do Contexto Web Audio
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.2; // Suavização interna da FFT
        
        microphoneSource = audioContext.createMediaStreamSource(stream);
        microphoneSource.connect(analyser);
        
        // Pré-computa curvas de ponderação
        computeWeightingTables(audioContext.sampleRate, analyser.fftSize);
        
        // Habilita Controles
        btnToggleCapture.removeAttribute("disabled");
        btnReset.removeAttribute("disabled");
        btnOpenReport.removeAttribute("disabled");
        
        document.getElementById("mic-status-dot").className = "status-dot online";
        document.getElementById("mic-status-text").textContent = "Conectado";
        
        startCapture();
    } catch (err) {
        console.error("Erro ao obter acesso ao microfone:", err);
        alert("Não foi possível acessar o microfone. Certifique-se de conceder a permissão nas configurações do navegador.");
    }
}

btnRequestPermission.addEventListener("click", initAudio);

// --- TIMER DE MEDIÇÃO & DOSÍMETRO ---
function updateMeasurementTimer() {
    if (!isCapturing) return;
    measurementElapsedSeconds++;
    
    const hrs = Math.floor(measurementElapsedSeconds / 3600);
    const mins = Math.floor((measurementElapsedSeconds % 3600) / 60);
    const secs = measurementElapsedSeconds % 60;
    const durStr = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    
    if (doseElapsedTime) doseElapsedTime.textContent = durStr;
}

function calculateDose(averageDb) {
    if (isNaN(averageDb) || averageDb < 80) {
        return { currentDose: 0, projectedDose: 0, maxAllowedTimeStr: "8 horas" };
    }
    
    // Critério NR-15: Nível Critério = 85 dB, Taxa de Duplicação q = 5 dB
    // Tempo máximo permitido (horas) = 8 / (2 ^ ((Leq - 85) / 5))
    const allowedHours = 8 / Math.pow(2, (averageDb - 85) / 5);
    const elapsedHours = measurementElapsedSeconds / 3600;
    
    const currentDose = (elapsedHours / allowedHours) * 100;
    const projectedDose = (8 / allowedHours) * 100;
    
    let maxAllowedTimeStr = "8 horas";
    if (allowedHours < 1) {
        const mins = Math.round(allowedHours * 60);
        maxAllowedTimeStr = `${Math.max(mins, 1)} minutos`;
    } else {
        maxAllowedTimeStr = `${allowedHours.toFixed(1)} horas`;
    }
    
    return { currentDose, projectedDose, maxAllowedTimeStr };
}

function updateDosimeterUI(averageDb) {
    const { currentDose, projectedDose, maxAllowedTimeStr } = calculateDose(averageDb);
    
    if (doseBadge) {
        doseBadge.textContent = `${currentDose.toFixed(1)}%`;
        if (currentDose >= 100) {
            doseBadge.className = "dose-badge badge-danger";
        } else if (currentDose >= 50) {
            doseBadge.className = "dose-badge badge-warning";
        } else {
            doseBadge.className = "dose-badge badge-safe";
        }
    }
    
    if (doseBarFill) {
        doseBarFill.style.width = `${Math.min(currentDose, 100)}%`;
    }
    
    if (doseProjected) {
        doseProjected.textContent = `${projectedDose.toFixed(1)}%`;
    }
    
    if (doseMaxTime) {
        doseMaxTime.textContent = maxAllowedTimeStr;
    }
}

// --- CONTROLE DE CAPTURA (PLAY / PAUSE / RESET) ---
function startCapture() {
    if (isCapturing) return;
    isCapturing = true;
    btnToggleCapture.innerHTML = '<i class="fa-solid fa-pause"></i> Pausar';
    btnToggleCapture.classList.add("btn-secondary");
    
    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
    }
    
    if (!durationInterval) {
        durationInterval = setInterval(updateMeasurementTimer, 1000);
    }
    
    requestWakeLock();
    processAudio();
}

function pauseCapture() {
    if (!isCapturing) return;
    isCapturing = false;
    btnToggleCapture.innerHTML = '<i class="fa-solid fa-play"></i> Iniciar';
    btnToggleCapture.classList.remove("btn-secondary");
    
    if (audioContext && audioContext.state === "running") {
        audioContext.suspend();
    }
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    if (durationInterval) {
        clearInterval(durationInterval);
        durationInterval = null;
    }
    
    releaseWakeLock();
    if (mainMeterCard) mainMeterCard.classList.remove("alarm-flash");
}

btnToggleCapture.addEventListener("click", () => {
    if (isCapturing) {
        pauseCapture();
    } else {
        startCapture();
    }
});

btnReset.addEventListener("click", () => {
    minDb = Infinity;
    maxDb = -Infinity;
    peakDb = -Infinity;
    sumOfPressures = 0;
    sampleCount = 0;
    smoothedDb = 0;
    dbHistory = [];
    measurementElapsedSeconds = 0;
    
    statMin.textContent = "--";
    statMax.textContent = "--";
    statAvg.textContent = "--";
    statPeak.textContent = "--";
    dbDisplay.textContent = "00.0";
    
    gaugeFill.style.strokeDashoffset = 534;
    
    if (doseElapsedTime) doseElapsedTime.textContent = "00:00:00";
    if (doseBadge) {
        doseBadge.textContent = "0.0%";
        doseBadge.className = "dose-badge badge-safe";
    }
    if (doseBarFill) doseBarFill.style.width = "0%";
    if (doseProjected) doseProjected.textContent = "0.0%";
    if (mainMeterCard) mainMeterCard.classList.remove("alarm-flash");
    
    document.querySelectorAll(".ref-table tr").forEach(row => row.classList.remove("active-limit"));
    
    drawChart();
    if (rtaCtx) rtaCtx.clearRect(0, 0, rtaCanvas.width, rtaCanvas.height);
});

// --- MOTOR DE CÁLCULO DE DECIBÉIS & RTA ---
let lastSampleTime = 0;

function processAudio() {
    if (!isCapturing) return;
    animationFrameId = requestAnimationFrame(processAudio);
    
    const now = Date.now();
    if (now - lastSampleTime < sampleInterval) return;
    lastSampleTime = now;
    
    const binCount = analyser.frequencyBinCount;
    const freqData = new Float32Array(binCount);
    analyser.getFloatFrequencyData(freqData);
    
    // Seleção da Curva de Ponderação
    let curve = null;
    if (activeWeighting === "A") curve = aWeightingTable;
    else if (activeWeighting === "C") curve = cWeightingTable;
    
    // Integração da Potência Acústica no Espectro
    let sumPower = 0;
    for (let i = 1; i < binCount; i++) {
        let binDb = freqData[i];
        if (binDb > -120) {
            if (curve) binDb += curve[i];
            sumPower += Math.pow(10, binDb / 10);
        }
    }
    
    let rawDb = 10 * Math.log10(sumPower);
    if (rawDb === -Infinity || isNaN(rawDb)) rawDb = -120;
    
    // Aplicação da calibração base e do usuário
    let instantDb = rawDb + baseOffset + parseFloat(userCalibrationOffset);
    
    // Resposta Temporal (Fast: 125ms -> alfa ~0.35 | Slow: 1000ms -> alfa ~0.08)
    const alpha = activeSpeed === "fast" ? 0.35 : 0.08;
    smoothedDb = smoothedDb === 0 ? instantDb : smoothedDb * (1 - alpha) + instantDb * alpha;
    
    // Limites de proteção de interface
    if (smoothedDb < 30) smoothedDb = 30 + Math.random() * 1.5;
    if (smoothedDb > 125) smoothedDb = 125;
    
    // Atualiza Pico Instantâneo (Peak Hold)
    if (instantDb > peakDb) {
        peakDb = Math.min(Math.max(instantDb, 30), 130);
    }
    
    updateUI(smoothedDb, instantDb);
    
    // Desenha o gráfico correspondente à aba ativa
    if (currentChartMode === "history") {
        drawChart();
    } else {
        drawRTA(freqData);
    }
}

// --- ATUALIZAÇÃO DA INTERFACE & ESTATÍSTICAS ---
function updateUI(db, instantDb) {
    const formattedDb = db.toFixed(1);
    dbDisplay.textContent = formattedDb;
    
    // Gauge Circular (30 a 120 dB)
    const minRange = 30;
    const maxRange = 120;
    const percent = Math.min(Math.max((db - minRange) / (maxRange - minRange), 0), 1);
    const strokeArray = 534;
    const offset = strokeArray - (percent * strokeArray);
    gaugeFill.style.strokeDashoffset = offset;
    
    // Categorias de Ruído
    let levelClass = "level-safe";
    let badgeClass = "badge-safe";
    let category = "Silencioso";
    
    if (db >= 85) {
        levelClass = "level-danger";
        badgeClass = "badge-danger";
        category = "Nocivo / Perigoso";
    } else if (db >= 70) {
        levelClass = "level-warning";
        badgeClass = "badge-warning";
        category = "Barulhento";
    } else if (db >= 50) {
        levelClass = "level-warning";
        badgeClass = "badge-warning";
        category = "Moderado";
    }
    
    gaugeFill.className.baseVal = `gauge-fill ${levelClass}`;
    noiseClass.className = `badge ${badgeClass}`;
    noiseClass.textContent = category;
    
    // Atualização de Estatísticas (Min, Max, Leq, Peak)
    if (db < minDb && db > 30.5) minDb = db;
    if (db > maxDb) maxDb = db;
    
    // Leq (Média Logarítmica de Pressão Sonora)
    sumOfPressures += Math.pow(10, db / 10);
    sampleCount++;
    const averageDb = 10 * Math.log10(sumOfPressures / sampleCount);
    
    statMin.textContent = minDb === Infinity ? "--" : minDb.toFixed(1);
    statMax.textContent = maxDb === -Infinity ? "--" : maxDb.toFixed(1);
    statAvg.textContent = isNaN(averageDb) ? "--" : averageDb.toFixed(1);
    statPeak.textContent = peakDb === -Infinity ? "--" : peakDb.toFixed(1);
    
    // Histórico de Dados
    dbHistory.push({ time: new Date(), db: db });
    if (dbHistory.length > maxHistorySize) {
        dbHistory.shift();
    }
    
    // Verificação de Alarme & Vibração
    checkAlarm(instantDb);
    
    // Atualização do Dosímetro NR-15
    updateDosimeterUI(averageDb);
    
    // Atualização de Leis e Diagnóstico
    updateLegislation(db, averageDb);
}

// --- VERIFICAÇÃO DE ALARME & VIBRAÇÃO NO SMARTPHONE ---
function checkAlarm(currentDb) {
    if (!alarmEnabled || !isCapturing) {
        if (mainMeterCard) mainMeterCard.classList.remove("alarm-flash");
        return;
    }
    
    if (currentDb >= alarmThreshold) {
        if (mainMeterCard) mainMeterCard.classList.add("alarm-flash");
        
        const now = Date.now();
        if ("vibrate" in navigator && now - lastAlarmVibrateTime > 1600) {
            navigator.vibrate([180, 80, 180]);
            lastAlarmVibrateTime = now;
        }
    } else {
        if (mainMeterCard) mainMeterCard.classList.remove("alarm-flash");
    }
}

// --- GRÁFICO HISTÓRICO NO TEMPO (CANVAS) ---
function drawChart() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (dbHistory.length === 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.font = "14px Inter";
        ctx.textAlign = "center";
        ctx.fillText("Aguardando captura de áudio...", canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const margin = { top: 12, right: 12, bottom: 20, left: 38 };
    const width = canvas.width - margin.left - margin.right;
    const height = canvas.height - margin.top - margin.bottom;
    
    // Linhas de Grade Horizontais
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
        const y = margin.top + (height / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(canvas.width - margin.right, y);
        ctx.stroke();
        
        const dbVal = Math.round(120 - ((120 - 30) / gridLines) * i);
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.font = "10px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`${dbVal}`, margin.left - 8, y + 3);
    }
    
    // Linha de Limite de Alarme (se configurado)
    if (alarmThreshold >= 30 && alarmThreshold <= 120) {
        const alarmY = margin.top + height * (1 - (alarmThreshold - 30) / (120 - 30));
        ctx.strokeStyle = "rgba(239, 68, 68, 0.45)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(margin.left, alarmY);
        ctx.lineTo(canvas.width - margin.right, alarmY);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Curva Temporal
    ctx.beginPath();
    const pointsCount = dbHistory.length;
    
    dbHistory.forEach((pt, index) => {
        const x = margin.left + (width / (maxHistorySize - 1)) * (maxHistorySize - pointsCount + index);
        const y = margin.top + height * (1 - (pt.db - 30) / (120 - 30));
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.strokeStyle = "#4facfe";
    ctx.shadowColor = "rgba(79, 172, 254, 0.6)";
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Preenchimento com Gradiente
    if (pointsCount > 0) {
        const firstX = margin.left + (width / (maxHistorySize - 1)) * (maxHistorySize - pointsCount);
        const lastX = margin.left + width;
        ctx.lineTo(lastX, margin.top + height);
        ctx.lineTo(firstX, margin.top + height);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, margin.top, 0, margin.top + height);
        gradient.addColorStop(0, "rgba(79, 172, 254, 0.35)");
        gradient.addColorStop(1, "rgba(0, 242, 254, 0)");
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}

// --- ANALISADOR DE ESPECTRO RTA EM TEMPO REAL (CANVAS) ---
const rtaBands = [
    { label: "63Hz", minF: 30, maxF: 88 },
    { label: "125Hz", minF: 88, maxF: 176 },
    { label: "250Hz", minF: 176, maxF: 353 },
    { label: "500Hz", minF: 353, maxF: 707 },
    { label: "1kHz", minF: 707, maxF: 1414 },
    { label: "2kHz", minF: 1414, maxF: 2828 },
    { label: "4kHz", minF: 2828, maxF: 5656 },
    { label: "8kHz", minF: 5656, maxF: 11300 }
];
let bandPeaks = new Float32Array(8);

function drawRTA(freqData) {
    if (!rtaCtx || currentChartMode !== "rta") return;
    
    rtaCtx.clearRect(0, 0, rtaCanvas.width, rtaCanvas.height);
    
    const w = rtaCanvas.width;
    const h = rtaCanvas.height;
    const margin = { top: 24, bottom: 26, left: 12, right: 12 };
    const chartW = w - margin.left - margin.right;
    const chartH = h - margin.top - margin.bottom;
    
    const barWidth = Math.max(chartW / 8 - 8, 12);
    const stepFreq = audioContext.sampleRate / analyser.fftSize;
    
    for (let b = 0; b < 8; b++) {
        const band = rtaBands[b];
        const startBin = Math.max(1, Math.floor(band.minF / stepFreq));
        const endBin = Math.min(analyser.frequencyBinCount - 1, Math.floor(band.maxF / stepFreq));
        
        let sumPower = 0;
        let count = 0;
        for (let i = startBin; i <= endBin; i++) {
            const binDb = freqData[i];
            if (binDb > -120) {
                sumPower += Math.pow(10, binDb / 10);
                count++;
            }
        }
        
        let bandDb = count > 0 ? 10 * Math.log10(sumPower / count) : -120;
        let bandVal = bandDb + baseOffset + parseFloat(userCalibrationOffset);
        bandVal = Math.max(30, Math.min(120, bandVal));
        
        // Decaimento suave dos marcadores de pico
        if (bandVal > bandPeaks[b]) {
            bandPeaks[b] = bandVal;
        } else {
            bandPeaks[b] = Math.max(30, bandPeaks[b] - 0.45);
        }
        
        const x = margin.left + b * ((chartW) / 8) + (chartW / 8 - barWidth) / 2;
        const normHeight = (bandVal - 30) / (120 - 30);
        const barHeight = chartH * normHeight;
        const y = margin.top + chartH - barHeight;
        
        // Gradiente Neon Dinâmico
        const grad = rtaCtx.createLinearGradient(0, y, 0, margin.top + chartH);
        if (bandVal >= 85) {
            grad.addColorStop(0, "#ef4444");
            grad.addColorStop(0.5, "#f59e0b");
            grad.addColorStop(1, "#10b981");
        } else if (bandVal >= 70) {
            grad.addColorStop(0, "#f59e0b");
            grad.addColorStop(1, "#10b981");
        } else {
            grad.addColorStop(0, "#00f2fe");
            grad.addColorStop(1, "#4facfe");
        }
        
        rtaCtx.fillStyle = grad;
        rtaCtx.beginPath();
        if (typeof rtaCtx.roundRect === "function") {
            rtaCtx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        } else {
            rtaCtx.rect(x, y, barWidth, barHeight);
        }
        rtaCtx.fill();
        
        // Marcador de Pico Superior (Peak Line)
        const peakY = margin.top + chartH - (chartH * ((bandPeaks[b] - 30) / (120 - 30)));
        rtaCtx.fillStyle = "#ffffff";
        rtaCtx.fillRect(x, peakY - 2, barWidth, 2);
        
        // Rótulo de dB acima da barra
        rtaCtx.fillStyle = "rgba(255, 255, 255, 0.7)";
        rtaCtx.font = "9px monospace";
        rtaCtx.textAlign = "center";
        rtaCtx.fillText(`${Math.round(bandVal)}`, x + barWidth / 2, y - 5);
        
        // Rótulo da Banda de Frequência abaixo da barra
        rtaCtx.fillStyle = "rgba(255, 255, 255, 0.45)";
        rtaCtx.font = "10px Inter";
        rtaCtx.fillText(band.label, x + barWidth / 2, h - 8);
    }
}

// --- CALIBRATION SLIDER ---
calibrationSlider.addEventListener("input", (e) => {
    userCalibrationOffset = e.target.value;
    const sign = userCalibrationOffset > 0 ? "+" : "";
    calibrationValue.textContent = `${sign}${userCalibrationOffset} dB`;
});

// --- LEGISLAÇÃO & DIAGNÓSTICO (NR-15 E NBR 10151) ---
function updateLegislation(db, averageDb) {
    // 1. NR-15 (Trabalhista)
    const nrStatusTitle = document.getElementById("nr15-status-title");
    const nrStatusDesc = document.getElementById("nr15-status-desc");
    const nrLimitValue = document.getElementById("nr15-limit-value");
    
    let activeLimitRow = null;
    let maxAllowedTime = "Sem Limite";
    
    if (db >= 115) {
        maxAllowedTime = "7 minutos";
        nr15Diagnostic.className = "legislation-diagnostic diag-danger";
        nrStatusTitle.textContent = "Nível Crítico / Proibitivo";
        nrStatusDesc.textContent = "Limite extremo ultrapassado! Exposição sem proteção auricular imediata é ilegal.";
        activeLimitRow = "115";
    } else if (db >= 110) {
        maxAllowedTime = "15 minutos";
        nr15Diagnostic.className = "legislation-diagnostic diag-danger";
        nrStatusTitle.textContent = "Perigo Imediato";
        nrStatusDesc.textContent = "Nível de ruído muito alto. Exposição máxima de 15 minutos diários.";
        activeLimitRow = "110";
    } else if (db >= 105) {
        maxAllowedTime = "30 minutos";
        nr15Diagnostic.className = "legislation-diagnostic diag-danger";
        nrStatusTitle.textContent = "Risco Elevado";
        nrStatusDesc.textContent = "Ruído excessivo. Limite máximo diário de 30 minutos.";
        activeLimitRow = "105";
    } else if (db >= 100) {
        maxAllowedTime = "1 hora";
        nr15Diagnostic.className = "legislation-diagnostic diag-danger";
        nrStatusTitle.textContent = "Risco Elevado";
        nrStatusDesc.textContent = "Ruído acima do limite seguro. Exposição máxima permitida de 1 hora.";
        activeLimitRow = "100";
    } else if (db >= 95) {
        maxAllowedTime = "2 horas";
        nr15Diagnostic.className = "legislation-diagnostic diag-warning";
        nrStatusTitle.textContent = "Ruído Insalubre";
        nrStatusDesc.textContent = "Insalubridade média. Exposição máxima recomendada de 2 horas.";
        activeLimitRow = "95";
    } else if (db >= 90) {
        maxAllowedTime = "4 horas";
        nr15Diagnostic.className = "legislation-diagnostic diag-warning";
        nrStatusTitle.textContent = "Ruído Insalubre";
        nrStatusDesc.textContent = "Ambiente insalubre. Exposição máxima permitida de 4 horas diárias.";
        activeLimitRow = "90";
    } else if (db >= 88) {
        maxAllowedTime = "5 horas";
        nr15Diagnostic.className = "legislation-diagnostic diag-warning";
        nrStatusTitle.textContent = "Limite de Tolerância";
        nrStatusDesc.textContent = "Ruído moderadamente alto. Limite diário de 5 horas.";
        activeLimitRow = "88";
    } else if (db >= 87) {
        maxAllowedTime = "6 horas";
        nr15Diagnostic.className = "legislation-diagnostic diag-warning";
        nrStatusTitle.textContent = "Limite de Tolerância";
        nrStatusDesc.textContent = "Ruído atingindo patamar de tolerância. Limite de 6 horas.";
        activeLimitRow = "87";
    } else if (db >= 86) {
        maxAllowedTime = "7 horas";
        nr15Diagnostic.className = "legislation-diagnostic diag-warning";
        nrStatusTitle.textContent = "Limite de Tolerância";
        nrStatusDesc.textContent = "Ruído limítrofe. Exposição permitida de até 7 horas.";
        activeLimitRow = "86";
    } else if (db >= 85) {
        maxAllowedTime = "8 horas";
        nr15Diagnostic.className = "legislation-diagnostic diag-warning";
        nrStatusTitle.textContent = "Limite Máximo Seguro";
        nrStatusDesc.textContent = "Limite legal de insalubridade sem equipamento de proteção (EPI). Máximo 8 horas.";
        activeLimitRow = "85";
    } else {
        maxAllowedTime = "Sem Limite";
        nr15Diagnostic.className = "legislation-diagnostic diag-safe";
        nrStatusTitle.textContent = "Zona Segura";
        nrStatusDesc.textContent = "Nível acústico adequado para jornada completa sem necessidade de EPIs.";
    }
    
    nrLimitValue.textContent = maxAllowedTime;
    
    document.querySelectorAll("#content-nr15 tbody tr").forEach(row => {
        row.classList.remove("active-limit");
        if (row.getAttribute("data-limit") === activeLimitRow) {
            row.classList.add("active-limit");
        }
    });

    // 2. NBR 10151 (Convivência / Vizinhança)
    const zone = zoneSelect.value;
    const period = periodSelect.value;
    
    const nbrStatusTitle = document.getElementById("nbr-status-title");
    const nbrStatusDesc = document.getElementById("nbr-status-desc");
    const nbrLimitValue = document.getElementById("nbr-limit-value");
    
    const nbrLimits = {
        residential: { day: 50, night: 45 },
        mixed: { day: 55, night: 50 },
        leisure: { day: 65, night: 55 },
        industrial: { day: 70, night: 60 }
    };
    
    const currentLimit = nbrLimits[zone][period];
    nbrLimitValue.textContent = `${currentLimit} dBA`;
    
    document.querySelectorAll("#content-nbr10151 tbody tr").forEach(row => {
        row.classList.remove("active-limit");
        if (row.getAttribute("data-zone") === zone) {
            row.classList.add("active-limit");
        }
    });
    
    const compareDb = isNaN(averageDb) ? db : averageDb;
    
    if (compareDb > currentLimit + 5) {
        nbrDiagnostic.className = "legislation-diagnostic diag-danger";
        nbrStatusTitle.textContent = "Limite Excedido (Perturbação)";
        nbrStatusDesc.textContent = `A média de ruído (${compareDb.toFixed(1)} dB) está muito acima da lei municipal para este horário. Risco de denúncia!`;
    } else if (compareDb > currentLimit) {
        nbrDiagnostic.className = "legislation-diagnostic diag-warning";
        nbrStatusTitle.textContent = "Limite de Tolerância Atingido";
        nbrStatusDesc.textContent = `O nível está ligeiramente acima da recomendação (${compareDb.toFixed(1)} dB). Reduza emissões sonoras.`;
    } else {
        nbrDiagnostic.className = "legislation-diagnostic diag-safe";
        nbrStatusTitle.textContent = "Em Conformidade com a Lei";
        nbrStatusDesc.textContent = `A média de ruído (${compareDb.toFixed(1)} dB) respeita o zoneamento e horário local. Vizinhança pacífica.`;
    }
}

zoneSelect.addEventListener("change", () => {
    if (dbHistory.length > 0) {
        const avg = parseFloat(statAvg.textContent);
        updateLegislation(dbHistory[dbHistory.length - 1].db, avg);
    }
});

periodSelect.addEventListener("change", () => {
    if (dbHistory.length > 0) {
        const avg = parseFloat(statAvg.textContent);
        updateLegislation(dbHistory[dbHistory.length - 1].db, avg);
    }
});

// --- GERADOR DE LAUDO TÉCNICO (IMPRESSÃO EM PDF) ---
function openReportModal() {
    if (dbHistory.length === 0) {
        alert("Inicie uma medição de ruído antes de gerar o laudo técnico.");
        return;
    }
    
    const now = new Date();
    const dateFormatted = now.toLocaleDateString("pt-BR") + " às " + now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    document.getElementById("report-date-now").textContent = dateFormatted;
    document.getElementById("report-doc-id").textContent = `LAU-${now.getFullYear()}-${String(Math.floor(Math.random() * 9000 + 1000))}`;
    
    // Captura imagem estática do gráfico histórico
    drawChart();
    const dataUrl = canvas.toDataURL("image/png");
    const reportChartImg = document.getElementById("report-chart-img");
    if (reportChartImg) reportChartImg.src = dataUrl;
    
    // Duração da sessão
    const hrs = Math.floor(measurementElapsedSeconds / 3600);
    const mins = Math.floor((measurementElapsedSeconds % 3600) / 60);
    const secs = measurementElapsedSeconds % 60;
    const durStr = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    document.getElementById("rep-duration").textContent = durStr;
    
    // Valores estatísticos
    const avgDbVal = 10 * Math.log10(sumOfPressures / sampleCount);
    document.getElementById("rep-min").textContent = (minDb === Infinity ? "--" : minDb.toFixed(1)) + " dB";
    document.getElementById("rep-avg").textContent = (isNaN(avgDbVal) ? "--" : avgDbVal.toFixed(1)) + " dB";
    document.getElementById("rep-max").textContent = (maxDb === -Infinity ? "--" : maxDb.toFixed(1)) + " dB";
    document.getElementById("rep-peak").textContent = (peakDb === -Infinity ? "--" : peakDb.toFixed(1)) + " dB";
    
    const doseData = calculateDose(avgDbVal);
    document.getElementById("rep-dose").textContent = `${doseData.currentDose.toFixed(1)}%`;
    
    document.getElementById("rep-weighting").textContent = `dB${activeWeighting}`;
    document.getElementById("rep-speed").textContent = activeSpeed === "fast" ? "Fast (125ms)" : "Slow (1s)";
    document.getElementById("rep-samples").textContent = sampleCount.toLocaleString("pt-BR");
    
    // Assinatura dinâmica do autor
    const repAuthorInput = document.getElementById("rep-author");
    const repSigAuthor = document.getElementById("rep-sig-author");
    repAuthorInput.addEventListener("input", () => {
        repSigAuthor.textContent = repAuthorInput.value.trim() || "Responsável Técnico / Avaliador";
    });
    
    // Parecer Técnico ABNT NBR 10151
    const zone = zoneSelect.value;
    const period = periodSelect.value;
    const nbrLimits = {
        residential: { day: 50, night: 45 },
        mixed: { day: 55, night: 50 },
        leisure: { day: 65, night: 55 },
        industrial: { day: 70, night: 60 }
    };
    const currentLimit = nbrLimits[zone][period];
    const zoneLabel = zoneSelect.options[zoneSelect.selectedIndex].text;
    const periodLabel = periodSelect.options[periodSelect.selectedIndex].text;
    const compareDb = isNaN(avgDbVal) ? (maxDb === -Infinity ? 0 : maxDb) : avgDbVal;
    
    const repNbrBox = document.getElementById("rep-nbr-box");
    const repNbrText = document.getElementById("rep-nbr-text");
    if (compareDb > currentLimit) {
        const diff = (compareDb - currentLimit).toFixed(1);
        repNbrBox.style.borderColor = "#ef4444";
        repNbrText.innerHTML = `<strong style="color:#b91c1c;">NÃO CONFORME (INFRAÇÃO ACÚSTICA):</strong> O nível sonoro equivalente medido (<strong>${compareDb.toFixed(1)} dBA</strong>) ultrapassa em <strong>${diff} dBA</strong> o limite normativo fixado para zona <em>${zoneLabel}</em> no período <em>${periodLabel}</em> (limite máximo: ${currentLimit} dBA). Configura perturbação do sossego com base na NBR 10151.`;
    } else {
        repNbrBox.style.borderColor = "#10b981";
        repNbrText.innerHTML = `<strong style="color:#047857;">CONFORME COM A LEGISLAÇÃO:</strong> O nível sonoro equivalente medido (<strong>${compareDb.toFixed(1)} dBA</strong>) respeita integralmente o teto legal de <strong>${currentLimit} dBA</strong> estipulado para a zona <em>${zoneLabel}</em> no período <em>${periodLabel}</em>.`;
    }
    
    // Parecer Técnico NR-15 (Trabalhista)
    const repNr15Box = document.getElementById("rep-nr15-box");
    const repNr15Text = document.getElementById("rep-nr15-text");
    if (compareDb >= 85) {
        repNr15Box.style.borderColor = "#ef4444";
        repNr15Text.innerHTML = `<strong style="color:#b91c1c;">AMBIENTE INSALUBRE (NR-15):</strong> A média de pressão acústica de <strong>${compareDb.toFixed(1)} dB</strong> excedeu o limiar seguro de 85 dB. Torna-se obrigatório o uso de EPI auditivo com C.A. válido e restrição da jornada máxima para até ${doseData.maxAllowedTimeStr}.`;
    } else {
        repNr15Box.style.borderColor = "#10b981";
        repNr15Text.innerHTML = `<strong style="color:#047857;">NÍVEL SEGURO OCUPACIONAL:</strong> O ruído equivalente registrado de <strong>${compareDb.toFixed(1)} dB</strong> permaneceu dentro da margem de segurança para jornada laboral integral de 8 horas sem enquadramento de insalubridade.`;
    }
    
    reportModal.classList.remove("hidden");
}

if (btnOpenReport) btnOpenReport.addEventListener("click", openReportModal);
if (btnHeaderReport) btnHeaderReport.addEventListener("click", openReportModal);
if (btnCloseReport) btnCloseReport.addEventListener("click", () => reportModal.classList.add("hidden"));
if (btnCloseReportFooter) btnCloseReportFooter.addEventListener("click", () => reportModal.classList.add("hidden"));
if (btnPrintReport) btnPrintReport.addEventListener("click", () => window.print());
if (btnExportCsvReport) btnExportCsvReport.addEventListener("click", () => btnExportCsv.click());

// --- EASTER EGG LOGO LINK (5 CLIQUES PARA CONFIG ADMINS OCULTAS) ---
if (logoLink) {
    logoLink.addEventListener("click", function(e) {
        const now = Date.now();
        let clicks = parseInt(localStorage.getItem("logo_clicks") || "0");
        let lastClick = parseInt(localStorage.getItem("logo_last_click") || "0");

        if (now - lastClick < 2000) {
            clicks++;
        } else {
            clicks = 1;
        }

        localStorage.setItem("logo_clicks", clicks);
        localStorage.setItem("logo_last_click", now);

        if (clicks >= 5) {
            e.preventDefault();
            localStorage.removeItem("logo_clicks");
            localStorage.removeItem("logo_last_click");
            openAdminLoginModal();
            return;
        }

        const targetUrl = this.href;
        const currentUrl = window.location.href;
        if (targetUrl.replace(/\/$/, "") === currentUrl.replace(/\/$/, "")) {
            e.preventDefault();
        }
    });
}

function openAdminLoginModal() {
    adminLoginModal.classList.remove("hidden");
    adminUsernameInput.value = "";
    adminPasswordInput.value = "";
    loginErrorMsg.classList.add("hidden");
}

btnCloseLogin.addEventListener("click", () => {
    adminLoginModal.classList.add("hidden");
});

btnCloseAdminPanel.addEventListener("click", () => {
    adminPanelModal.classList.add("hidden");
});

// Autenticação administrativa (Fbraga / F.braga1)
adminLoginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = adminUsernameInput.value.trim();
    const pass = adminPasswordInput.value;
    
    if (user === "Fbraga" && pass === "F.braga1") {
        adminLoginModal.classList.add("hidden");
        openAdminPanel();
    } else {
        loginErrorMsg.classList.remove("hidden");
    }
});

function openAdminPanel() {
    adminPanelModal.classList.remove("hidden");
    adminBaseOffset.value = baseOffset;
    adminUpdateInterval.value = sampleInterval;
    
    if (audioContext) {
        diagSampleRate.textContent = `${audioContext.sampleRate} Hz`;
        diagFftSize.textContent = analyser.fftSize;
        diagAudioState.textContent = audioContext.state.toUpperCase();
    }
}

btnSaveAdminSettings.addEventListener("click", () => {
    baseOffset = parseFloat(adminBaseOffset.value);
    sampleInterval = parseInt(adminUpdateInterval.value);
    adminPanelModal.classList.add("hidden");
    btnReset.click();
    alert("Configurações aplicadas com sucesso! Histórico recalculado.");
});

// --- EXPORTAÇÕES DE DADOS (JSON E CSV) ---
btnExportJson.addEventListener("click", () => {
    if (dbHistory.length === 0) {
        alert("Sem medições registradas para exportar.");
        return;
    }
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbHistory, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sound_meter_historico_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

btnExportCsv.addEventListener("click", () => {
    if (dbHistory.length === 0) {
        alert("Sem medições registradas para exportar.");
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,Timestamp,Nivel_Ruido_dB,Ponderacao,Modo\n";
    dbHistory.forEach(pt => {
        csvContent += `${pt.time.toISOString()},${pt.db.toFixed(2)},${activeWeighting},${activeSpeed}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `sound_meter_historico_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});
