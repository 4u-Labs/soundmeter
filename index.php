<?php
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
$v = time();
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Sound Meter - 4U.IA</title>
    <!-- PWA Meta Tags -->
    <link rel="manifest" href="manifest.json?v=<?php echo $v; ?>">
    <meta name="theme-color" content="#0b0f19">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="apple-touch-icon" href="apple-touch-icon.png?v=<?php echo $v; ?>">
    <link rel="icon" type="image/png" href="icon-192.png?v=<?php echo $v; ?>">
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <!-- FontAwesome for Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Stylesheet -->
    <link rel="stylesheet" href="style.css?v=<?php echo $v; ?>">
</head>
<body>
    <div class="app-container">
        <!-- Header -->
        <header class="app-header">
            <a href="https://4u.ia.br" id="logo-link" class="logo">
                <span class="logo-icon"><i class="fa-solid fa-wave-square"></i></span>
                <span class="logo-text">4U.IA</span>
            </a>
            <h1 class="header-title">Sound Meter</h1>
            <div class="header-right-group">
                <button id="btn-header-report" class="btn btn-header-report" title="Gerar Laudo Técnico em PDF">
                    <i class="fa-solid fa-file-contract"></i> Gerar Laudo
                </button>
                <div class="header-status">
                    <span id="wakelock-indicator" class="wakelock-badge hidden" title="A tela do celular permanecerá acesa enquanto estiver medindo"><i class="fa-solid fa-sun"></i> Tela Ativa</span>
                    <span id="mic-status-dot" class="status-dot offline"></span>
                    <span id="mic-status-text">Desconectado</span>
                </div>
            </div>
        </header>

        <!-- Main Content Layout -->
        <main class="app-main">
            <!-- Left Panel: Meter and Controls -->
            <section class="panel meter-panel">
                <div class="card glass-card main-meter-card">
                    <!-- Audio permission state -->
                    <div id="permission-prompt" class="permission-overlay">
                        <i class="fa-solid fa-microphone-lines mic-icon-pulse"></i>
                        <h2>Acesso ao Microfone</h2>
                        <p>Precisamos de acesso ao microfone do seu dispositivo para medir o nível de ruído em tempo real.</p>
                        <button id="btn-request-permission" class="btn btn-glow">Permitir Acesso</button>
                    </div>

                    <!-- Audio Mode & Weighting Config Bar -->
                    <div class="audio-config-bar">
                        <div class="pill-group" id="weighting-pills" title="Curva de Ponderação de Frequência">
                            <button class="pill-btn active" data-weighting="A">dBA</button>
                            <button class="pill-btn" data-weighting="C">dBC</button>
                            <button class="pill-btn" data-weighting="Z">dBZ</button>
                        </div>
                        <div class="pill-group" id="speed-pills" title="Tempo de Resposta Temporal (IEC 61672)">
                            <button class="pill-btn active" data-speed="fast">Fast (125ms)</button>
                            <button class="pill-btn" data-speed="slow">Slow (1s)</button>
                        </div>
                    </div>

                    <!-- Gauge Section -->
                    <div class="gauge-container">
                        <svg class="gauge-svg" viewBox="0 0 200 200">
                            <!-- Background track -->
                            <circle class="gauge-track" cx="100" cy="100" r="85"></circle>
                            <!-- Colored fill -->
                            <circle id="gauge-fill" class="gauge-fill level-safe" cx="100" cy="100" r="85"></circle>
                        </svg>
                        <div class="gauge-content">
                            <span id="db-display" class="db-number">00.0</span>
                            <span id="db-unit-label" class="db-unit">dBA</span>
                            <div id="noise-class" class="badge badge-safe">Silencioso</div>
                        </div>
                    </div>

                    <!-- Stats Row -->
                    <div class="stats-row stats-grid-4">
                        <div class="stat-box">
                            <span class="stat-label">MÍNIMO</span>
                            <span id="stat-min" class="stat-value">--</span>
                            <span class="stat-unit" id="unit-stat-min">dBA</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">MÉDIA (Leq)</span>
                            <span id="stat-avg" class="stat-value">--</span>
                            <span class="stat-unit" id="unit-stat-avg">dBA</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">MÁXIMO</span>
                            <span id="stat-max" class="stat-value">--</span>
                            <span class="stat-unit" id="unit-stat-max">dBA</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">PICO</span>
                            <span id="stat-peak" class="stat-value">--</span>
                            <span class="stat-unit" id="unit-stat-peak">dBA</span>
                        </div>
                    </div>

                    <!-- Control Buttons -->
                    <div class="controls-row">
                        <button id="btn-toggle-capture" class="btn btn-control" disabled>
                            <i class="fa-solid fa-play"></i> Iniciar
                        </button>
                        <button id="btn-reset" class="btn btn-control btn-secondary" disabled>
                            <i class="fa-solid fa-rotate-left"></i> Resetar
                        </button>
                    </div>

                    <!-- Botão de Destaque para Laudo Técnico -->
                    <button id="btn-open-report" class="btn btn-report-prominent" title="Gerar Laudo Técnico em PDF">
                        <i class="fa-solid fa-file-contract"></i> Gerar Laudo Técnico (PDF)
                    </button>

                    <!-- Alarm & Vibration Alert Section -->
                    <div class="alarm-section">
                        <div class="alarm-header">
                            <label class="section-sub-title"><i class="fa-solid fa-bell"></i> Alerta & Vibração</label>
                            <div class="alarm-controls">
                                <span class="alarm-sym">&gt;</span>
                                <input type="number" id="alarm-threshold" value="85" min="40" max="130" step="1" class="alarm-input" title="Limite em dB para alarme">
                                <span class="alarm-unit">dB</span>
                                <label class="switch-toggle" title="Ativar vibração e alerta visual no celular">
                                    <input type="checkbox" id="alarm-toggle" checked>
                                    <span class="switch-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Calibration Slider -->
                    <div class="calibration-section">
                        <div class="calibration-header">
                            <label for="calibration-slider" class="section-sub-title"><i class="fa-solid fa-sliders"></i> Ajuste de Calibração</label>
                            <span id="calibration-value" class="calibration-badge">0 dB</span>
                        </div>
                        <div class="slider-container">
                            <span class="slider-label">-20</span>
                            <input type="range" id="calibration-slider" min="-20" max="20" value="0" class="range-slider">
                            <span class="slider-label">+20</span>
                        </div>
                        <p class="section-desc">Ajuste o offset se tiver um decibelímetro físico de referência por perto para calibrar o microfone.</p>
                    </div>
                </div>
            </section>

            <!-- Right Panel: Chart and Legislation -->
            <section class="panel details-panel">
                <!-- Chart Card -->
                <div class="card glass-card chart-card">
                    <div class="chart-header-row">
                        <h2 class="card-title no-border-padding"><i class="fa-solid fa-chart-line"></i> Visualização</h2>
                        <div class="chart-mode-tabs">
                            <button id="tab-chart-history" class="chart-mode-btn active" title="Gráfico de Ruído no Tempo">
                                <i class="fa-solid fa-wave-square"></i> Histórico
                            </button>
                            <button id="tab-chart-rta" class="chart-mode-btn" title="Analisador de Frequências em Tempo Real">
                                <i class="fa-solid fa-chart-simple"></i> Espectro RTA
                            </button>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="noise-chart"></canvas>
                        <canvas id="rta-chart" class="hidden"></canvas>
                    </div>
                </div>

                <!-- Legislation Comparator Card -->
                <div class="card glass-card legislation-card">
                    <h2 class="card-title"><i class="fa-solid fa-scale-balanced"></i> Diagnóstico de Ruído e Leis</h2>
                    
                    <!-- Tabs -->
                    <div class="tabs-header">
                        <button id="tab-nr15" class="tab-btn active">Trabalho (NR-15)</button>
                        <button id="tab-nbr10151" class="tab-btn">Convivência (NBR 10151)</button>
                    </div>

                    <!-- Tab Contents -->
                    <div class="tabs-content">
                        <!-- Tab: NR15 -->
                        <div id="content-nr15" class="tab-pane active">
                            <!-- Dosimeter Widget -->
                            <div class="dosimeter-widget">
                                <div class="dosimeter-top">
                                    <div class="dosimeter-title"><i class="fa-solid fa-stopwatch"></i> Dosímetro NR-15 (Jornada 8h)</div>
                                    <div id="dose-badge" class="dose-badge badge-safe">0.0%</div>
                                </div>
                                <div class="dose-bar-track">
                                    <div id="dose-bar-fill" class="dose-bar-fill" style="width: 0%;"></div>
                                </div>
                                <div class="dose-details">
                                    <span>Tempo: <strong id="dose-elapsed-time">00:00:00</strong></span>
                                    <span>Dose Estimada (8h): <strong id="dose-projected">0.0%</strong></span>
                                    <span>Tolerância: <strong id="dose-max-time">8 horas</strong></span>
                                </div>
                            </div>

                            <div class="legislation-diagnostic" id="nr15-diagnostic">
                                <div class="diagnostic-header">
                                    <div class="status-icon"><i class="fa-solid fa-circle-check"></i></div>
                                    <div>
                                        <h3 id="nr15-status-title" class="diagnostic-title">Nível Seguro</h3>
                                        <p id="nr15-status-desc" class="diagnostic-desc">O nível atual está abaixo do limite de insalubridade trabalhista.</p>
                                    </div>
                                </div>
                                <div class="limit-bar-container">
                                    <div class="limit-bar-label">Limite Permitido Diário:</div>
                                    <div id="nr15-limit-value" class="limit-bar-badge">Sem Limite</div>
                                </div>
                            </div>

                            <!-- Reference Table -->
                            <div class="reference-panel">
                                <h4>Tabela de Limites de Tolerância (NR-15)</h4>
                                <div class="table-responsive">
                                    <table class="ref-table">
                                        <thead>
                                            <tr>
                                                <th>Nível de Ruído (dB)</th>
                                                <th>Exposição Máxima Diária</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr data-limit="85"><td>85 dB</td><td>8 horas</td></tr>
                                            <tr data-limit="86"><td>86 dB</td><td>7 horas</td></tr>
                                            <tr data-limit="87"><td>87 dB</td><td>6 horas</td></tr>
                                            <tr data-limit="88"><td>88 dB</td><td>5 horas</td></tr>
                                            <tr data-limit="90"><td>90 dB</td><td>4 horas</td></tr>
                                            <tr data-limit="95"><td>95 dB</td><td>2 horas</td></tr>
                                            <tr data-limit="100"><td>100 dB</td><td>1 hora</td></tr>
                                            <tr data-limit="105"><td>105 dB</td><td>30 minutos</td></tr>
                                            <tr data-limit="110"><td>110 dB</td><td>15 minutos</td></tr>
                                            <tr data-limit="115"><td>115 dB</td><td>7 minutos</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- Tab: NBR 10151 -->
                        <div id="content-nbr10151" class="tab-pane">
                            <!-- Filters for NBR 10151 -->
                            <div class="filters-grid">
                                <div class="filter-group">
                                    <label for="zone-select">Tipo de Zoneamento</label>
                                    <select id="zone-select" class="custom-select">
                                        <option value="residential">Residencial Exclusivo</option>
                                        <option value="mixed" selected>Misto / Comercial</option>
                                        <option value="leisure">Lazer / Recreação</option>
                                        <option value="industrial">Industrial</option>
                                    </select>
                                </div>
                                <div class="filter-group">
                                    <label for="period-select">Período Horário</label>
                                    <select id="period-select" class="custom-select">
                                        <option value="day" selected>Diurno (07:00h às 22:00h)</option>
                                        <option value="night">Noturno (22:00h às 07:00h)</option>
                                    </select>
                                </div>
                            </div>

                            <div class="legislation-diagnostic" id="nbr-diagnostic">
                                <div class="diagnostic-header">
                                    <div class="status-icon"><i class="fa-solid fa-circle-check"></i></div>
                                    <div>
                                        <h3 id="nbr-status-title" class="diagnostic-title">Dentro dos Limites</h3>
                                        <p id="nbr-status-desc" class="diagnostic-desc">O nível de ruído é aceitável para esta zona neste período.</p>
                                    </div>
                                </div>
                                <div class="limit-bar-container">
                                    <div class="limit-bar-label">Limite da Zona para o Período:</div>
                                    <div id="nbr-limit-value" class="limit-bar-badge">55 dBA</div>
                                </div>
                            </div>

                            <!-- Reference NBR Table -->
                            <div class="reference-panel">
                                <h4>Limites Recomendados (NBR 10151)</h4>
                                <div class="table-responsive">
                                    <table class="ref-table">
                                        <thead>
                                            <tr>
                                                <th>Tipo de Área</th>
                                                <th>Dia (dB)</th>
                                                <th>Noite (dB)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr data-zone="residential"><td>Residencial Exclusivo</td><td>50 dB</td><td>45 dB</td></tr>
                                            <tr data-zone="mixed"><td>Misto / Comercial</td><td>55 dB</td><td>50 dB</td></tr>
                                            <tr data-zone="leisure"><td>Lazer / Recreação</td><td>65 dB</td><td>55 dB</td></tr>
                                            <tr data-zone="industrial"><td>Industrial</td><td>70 dB</td><td>60 dB</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <!-- Footer -->
        <footer class="app-footer">
            <div class="footer-links-row">
                <a href="privacy.html" class="footer-nav-link">Privacidade</a>
                <span class="footer-sep">&bull;</span>
                <a href="terms.html" class="footer-nav-link">Termos de Uso</a>
                <span class="footer-sep">&bull;</span>
                <a href="support.html" class="footer-nav-link">Suporte & FAQ</a>
                <span class="footer-sep">&bull;</span>
                <a href="https://github.com/4u-Labs/soundmeter" target="_blank" rel="noopener noreferrer" class="footer-nav-link"><i class="fa-brands fa-github"></i> GitHub</a>
            </div>
            <p class="footer-copyright">
                &copy; <?php echo date("Y"); ?> Sound Meter &bull; Todos os direitos reservados. Feito com amor por 
                <a href="https://4u.ia.br" target="_blank" class="footer-link">4u.ia.br</a>.
            </p>
            <p class="footer-support">
                Para suporte técnico ou dúvidas, contate-nos em 
                <a href="support.html" class="footer-link">Central de Ajuda</a> ou no 
                <a href="https://4u.ia.br/#contact" target="_blank" class="footer-link">Formulário de Contato</a>.
            </p>
        </footer>
    </div>

    <!-- Technical Report Modal Overlay -->
    <div id="report-modal" class="modal-overlay hidden">
        <div class="modal-card glass-card report-modal-card">
            <div class="modal-header no-print">
                <h2><i class="fa-solid fa-file-contract"></i> Laudo Técnico de Ruído</h2>
                <button id="btn-close-report" class="btn-close">&times;</button>
            </div>

            <div class="report-scroll-container">
                <!-- Printable Area -->
                <div id="report-printable-area" class="report-document">
                    <div class="report-header">
                        <div class="report-logo">
                            <span class="logo-icon"><i class="fa-solid fa-wave-square"></i></span>
                            <div>
                                <div class="report-brand">4U.IA &bull; SOUND METER</div>
                                <div class="report-subbrand">Laudo Pericial & Avaliação de Pressão Sonora</div>
                            </div>
                        </div>
                        <div class="report-doc-id">
                            <div><strong>DOC Nº:</strong> <span id="report-doc-id">LAU-2026-001</span></div>
                            <div><strong>Data:</strong> <span id="report-date-now">--/--/----</span></div>
                        </div>
                    </div>

                    <div class="report-section">
                        <h3 class="report-sec-title">1. Identificação da Aferição</h3>
                        <div class="report-form-grid">
                            <div class="report-field">
                                <label>Local / Endereço:</label>
                                <input type="text" id="rep-location" class="report-input" placeholder="Ex: Rua das Palmeiras, 150 - Apto 302">
                            </div>
                            <div class="report-field">
                                <label>Responsável Técnico / Avaliador:</label>
                                <input type="text" id="rep-author" class="report-input" placeholder="Ex: Fabiano Braga / Perito">
                            </div>
                            <div class="report-field">
                                <label>Solicitante / Reclamante:</label>
                                <input type="text" id="rep-client" class="report-input" placeholder="Ex: Condomínio Edifício Solar">
                            </div>
                            <div class="report-field">
                                <label>Instrumento & Norma:</label>
                                <input type="text" id="rep-equipment" class="report-input" value="Sound Meter 4U (IEC 61672-1 / ABNT NBR 10151)">
                            </div>
                        </div>
                    </div>

                    <div class="report-section">
                        <h3 class="report-sec-title">2. Resultados Estatísticos & Acústicos</h3>
                        <div class="report-metrics-grid">
                            <div class="report-metric-box">
                                <span class="rep-lbl">DURAÇÃO</span>
                                <span id="rep-duration" class="rep-val">--</span>
                            </div>
                            <div class="report-metric-box">
                                <span class="rep-lbl">MÍNIMO (Lmin)</span>
                                <span id="rep-min" class="rep-val">-- dB</span>
                            </div>
                            <div class="report-metric-box highlight">
                                <span class="rep-lbl">MÉDIA EQUIV. (Leq)</span>
                                <span id="rep-avg" class="rep-val">-- dB</span>
                            </div>
                            <div class="report-metric-box">
                                <span class="rep-lbl">MÁXIMO (Lmax)</span>
                                <span id="rep-max" class="rep-val">-- dB</span>
                            </div>
                            <div class="report-metric-box">
                                <span class="rep-lbl">PICO (Lpeak)</span>
                                <span id="rep-peak" class="rep-val">-- dB</span>
                            </div>
                            <div class="report-metric-box">
                                <span class="rep-lbl">DOSE NR-15</span>
                                <span id="rep-dose" class="rep-val">--%</span>
                            </div>
                        </div>
                        <div class="report-sub-details">
                            <span><strong>Ponderação:</strong> <span id="rep-weighting">dBA</span></span>
                            <span><strong>Tempo de Resposta:</strong> <span id="rep-speed">Fast (125ms)</span></span>
                            <span><strong>Total de Amostras:</strong> <span id="rep-samples">0</span></span>
                        </div>
                    </div>

                    <div class="report-section">
                        <h3 class="report-sec-title">3. Registro Gráfico da Sessão</h3>
                        <div class="report-chart-box">
                            <img id="report-chart-img" alt="Gráfico de Ruído da Medição" class="report-chart-img">
                        </div>
                    </div>

                    <div class="report-section">
                        <h3 class="report-sec-title">4. Enquadramento Legal & Parecer Técnico</h3>
                        <div class="report-compliance-box">
                            <div class="rep-comp-item" id="rep-nbr-box">
                                <h4>Convivência e Vizinhança Urbana (NBR 10151)</h4>
                                <p id="rep-nbr-text">Aguardando dados...</p>
                            </div>
                            <div class="rep-comp-item" id="rep-nr15-box">
                                <h4>Segurança e Saúde no Trabalho (NR-15)</h4>
                                <p id="rep-nr15-text">Aguardando dados...</p>
                            </div>
                        </div>
                    </div>

                    <div class="report-section">
                        <h3 class="report-sec-title">5. Observações & Circunstâncias da Medição</h3>
                        <textarea id="rep-notes" class="report-textarea" rows="2" placeholder="Observações do ambiente, condições das janelas/portas, fontes identificadas de ruído (tráfego, som alto, maquinário, latidos, etc.)..."></textarea>
                    </div>

                    <div class="report-signatures">
                        <div class="sig-line">
                            <div class="sig-border"></div>
                            <span id="rep-sig-author">Responsável Técnico / Avaliador</span>
                        </div>
                        <div class="sig-line">
                            <div class="sig-border"></div>
                            <span>Solicitante / Parte Interessada</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Action Buttons (hidden during printing) -->
            <div class="modal-footer report-footer no-print">
                <button id="btn-print-report" class="btn btn-glow"><i class="fa-solid fa-print"></i> Imprimir / Salvar PDF</button>
                <button id="btn-export-csv-report" class="btn btn-secondary"><i class="fa-solid fa-file-csv"></i> Baixar CSV</button>
                <button id="btn-close-report-footer" class="btn btn-secondary">Fechar</button>
            </div>
        </div>
    </div>

    <!-- Easter Egg Admin Modal Overlay -->
    <div id="admin-login-modal" class="modal-overlay hidden">
        <div class="modal-card glass-card">
            <div class="modal-header">
                <h2><i class="fa-solid fa-lock"></i> Acesso Administrativo Oculto</h2>
                <button id="btn-close-login" class="btn-close">&times;</button>
            </div>
            <form id="admin-login-form">
                <div class="form-group">
                    <label for="admin-username">Usuário</label>
                    <input type="text" id="admin-username" required class="form-input" autocomplete="username">
                </div>
                <div class="form-group">
                    <label for="admin-password">Senha</label>
                    <input type="password" id="admin-password" required class="form-input" autocomplete="current-password">
                </div>
                <div id="login-error-msg" class="error-message hidden">Usuário ou senha incorretos!</div>
                <button type="submit" class="btn btn-glow w-full">Autenticar</button>
            </form>
        </div>
    </div>

    <!-- Admin Panel Modal Overlay -->
    <div id="admin-panel-modal" class="modal-overlay hidden">
        <div class="modal-card glass-card admin-panel-card">
            <div class="modal-header">
                <h2><i class="fa-solid fa-user-shield"></i> Painel de Administração</h2>
                <button id="btn-close-admin-panel" class="btn-close">&times;</button>
            </div>
            <div class="admin-panel-content">
                <div class="admin-tab-section">
                    <h3>Configurações do Sound Meter</h3>
                    <div class="form-group inline-group">
                        <label for="admin-base-offset">Deslocamento Base de Calibração (dB):</label>
                        <input type="number" id="admin-base-offset" value="85" step="0.5" class="form-input w-24">
                    </div>
                    <div class="form-group inline-group">
                        <label for="admin-update-interval">Intervalo de Amostragem (ms):</label>
                        <input type="number" id="admin-update-interval" value="50" step="10" class="form-input w-24">
                    </div>
                </div>

                <div class="admin-tab-section">
                    <h3>Exportar Histórico de Medições</h3>
                    <p class="section-desc">Baixe todas as medições capturadas desde a abertura do aplicativo em formato estruturado.</p>
                    <div class="admin-btn-row">
                        <button id="btn-export-json" class="btn btn-secondary"><i class="fa-solid fa-file-code"></i> Exportar JSON</button>
                        <button id="btn-export-csv" class="btn btn-secondary"><i class="fa-solid fa-file-csv"></i> Exportar CSV</button>
                    </div>
                </div>

                <div class="admin-tab-section">
                    <h3>Diagnóstico de Hardware</h3>
                    <table class="diagnostics-table">
                        <tr>
                            <td>Taxa de Amostragem (Sample Rate):</td>
                            <td id="diag-sample-rate">-- Hz</td>
                        </tr>
                        <tr>
                            <td>Tamanho do Buffer (FFT Size):</td>
                            <td id="diag-fft-size">--</td>
                        </tr>
                        <tr>
                            <td>Estado do Contexto de Áudio:</td>
                            <td id="diag-audio-state">--</td>
                        </tr>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button id="btn-save-admin-settings" class="btn btn-glow">Salvar Configurações</button>
            </div>
        </div>
    </div>

    <!-- Audio Script -->
    <script src="app.js?v=<?php echo $v; ?>"></script>
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('service-worker.js')
                    .then((reg) => console.log('Service Worker registrado!', reg))
                    .catch((err) => console.error('Erro ao registrar Service Worker:', err));
            });
        }
    </script>
</body>
</html>
