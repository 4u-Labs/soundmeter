<div align="center">

# 🔊 Sound Meter Pro
### **Decibelímetro Digital em Tempo Real, Analisador RTA & Emissão de Laudos Técnicos ABNT NBR 10151 / NR-15**

<p align="center">
  <a href="https://4u.ia.br/app/soundmeter/"><img src="https://img.shields.io/badge/🌐_Acessar_App_Online-4U.IA.BR-00e5ff?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Acessar App Online" /></a>
  <a href="https://orcid.org/0009-0004-5936-5060"><img src="https://img.shields.io/badge/ORCID-0009--0004--5936--5060-A6CE39?style=for-the-badge&logo=orcid&logoColor=white" alt="ORCID iD" /></a>
  <img src="https://img.shields.io/badge/Audio-Web_Audio_API-ff007f?style=for-the-badge&logo=audio-technica&logoColor=white" alt="Web Audio API" />
  <img src="https://img.shields.io/badge/Standard-IEC_61672--1-00d2ff?style=for-the-badge" alt="IEC 61672-1" />
  <img src="https://img.shields.io/badge/PWA-Ready-10b981?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA Ready" />
  <img src="https://img.shields.io/badge/Privacy-Zero--Knowledge-6d4aff?style=for-the-badge" alt="Zero-Knowledge" />
</p>

<!-- Typing SVG Animation -->
<p align="center">
  <a href="https://4u.ia.br/app/soundmeter/">
    <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&duration=2800&pause=900&color=00F2FE&center=true&vCenter=true&width=780&lines=Medição+acústica+em+tempo+real+com+ponderação+dBA%2C+dBC+e+dBZ...;Analisador+de+Espectro+RTA+de+8+Bandas+(63Hz+a+8kHz)...;Laudos+Técnicos+Instantâneos+em+PDF+A4+com+gráficos...;Conformidade+Automática+com+Normas+ABNT+NBR+10151+e+NR-15." alt="Typing SVG" />
  </a>
</p>

</div>

---

## 🌟 Principais Recursos

### 🎙️ 1. Captura com Pure Audio (Sem AGC ou Supressão)
- Utiliza a **Web Audio API** com cancelamento de ruído, controle automático de ganho (AGC) e cancelamento de eco rigorosamente **desativados**.
- Sinal acústico bruto para representação fiel dos níveis reais de pressão sonora (SPL).

### ⚖️ 2. Curvas de Ponderação Frequencial & Temporal (IEC 61672-1)
- **dBA**: Curva ponderada para a sensibilidade do ouvido humano (padrão em perícias, NBR 10151 e NR-15).
- **dBC**: Curva de resposta plana para baixas frequências (motores, subgraves, compressores e ruído industrial).
- **dBZ (Linear)**: Resposta pura de 20 Hz a 20 kHz sem atenuação espectral.
- **Fast (125 ms)**: Resposta rápida para eventos pontuais e picos impulsivos.
- **Slow (1 s)**: Média temporal lenta para medições contínuas e estáveis.

### 📊 3. Analisador de Espectro RTA de 8 Bandas (Real-Time Analyzer)
- Decomposição FFT em bandas de oitava: **63 Hz, 125 Hz, 250 Hz, 500 Hz, 1 kHz, 2 kHz, 4 kHz e 8 kHz**.
- Indicadores visuais de pico retido (**Peak Hold**) para identificação de frequências predominantes e ressonâncias mecânicas.

### 📋 4. Diagnóstico Normativo Dinâmico (NBR 10151 & NR-15)
- **ABNT NBR 10151 (Convivência Urbana e Vizinhança)**: Comparativo automático com limites diurnos e noturnos para Áreas Residenciais, Mistas, Lazer e Industriais.
- **NR-15 (Segurança Ocupacional)**: Dosímetro acústico digital que calcula a dose acumulada percentual e o tempo máximo permitido de exposição contínua.

### 📑 5. Emissão de Laudo Técnico Pericial em PDF A4
- Geração com 1 clique de relatório pericial completo para impressão ou arquivo digital.
- Inclusão instantânea do gráfico de ruído da sessão em alta resolução gerado via HTML5 Canvas.
- Campos para local da medição, identificação de fontes de ruído, notas periciais e assinaturas formais.

### 📳 6. Alarme Vibratório & Screen Wake Lock
- **Vibração Háptica (`navigator.vibrate`)**: Alerta tátil imediato no celular ao ultrapassar o limiar de dB configurado.
- **Screen Wake Lock**: Mantém a tela ligada durante toda a sessão de medição para monitoramento ininterrupto.

### 🔒 7. Privacidade Absoluta (Retenção Zero)
- Processamento **100% Client-Side** na memória RAM do navegador.
- Nenhuma gravação de áudio ou dados de identificação é gravada em servidor externo ou transmitida para terceiros.

---

## 🚀 Como Executar Localmente

Como o projeto é construído em padrões nativos Web Audio API, HTML5 e PHP:

1. Clone o repositório:
```bash
git clone https://github.com/4u-Labs/soundmeter.git
cd soundmeter
```

2. Sirva através de qualquer servidor PHP/Apache ou com o servidor embutido do PHP:
```bash
php -S localhost:8080
```

3. Acesse `http://localhost:8080` no seu navegador (conceda acesso ao microfone quando solicitado).

---

## 🛠️ Stack Tecnológica

- **Core:** JavaScript ES6+ (Web Audio API, AudioContext, AnalyserNode, BiquadFilterNode)
- **Frontend:** HTML5, CSS3 Glassmorphism, FontAwesome 6, Google Fonts (Outfit & Inter)
- **Backend / Cache Buster:** PHP 8+ com cabeçalhos anti-cache dinâmicos
- **PWA:** Service Worker com cache offline e Web App Manifest
- **Relatórios:** Motor de renderização print-ready em folhas A4 / PDF com captura de Canvas

---

<div align="center">

### 📬 Fale Conosco — 4U.IA.BR

<p align="center">
  <a href="https://4u.ia.br/#contact"><img src="https://img.shields.io/badge/✉️_ENVIAR_MENSAGEM-FORMULÁRIO_DE_CONTATO-6d4aff?style=for-the-badge&logo=telegram&logoColor=white" /></a>
  <a href="https://4u.ia.br"><img src="https://img.shields.io/badge/🌐_PORTAL_OFICIAL-4U.IA.BR-0ea5e9?style=for-the-badge&logo=firefox-browser&logoColor=white" /></a>
  <a href="mailto:contato@4u.ia.br"><img src="https://img.shields.io/badge/📧_E--MAIL-CONTATO%404U.IA.BR-ea4335?style=for-the-badge&logo=gmail&logoColor=white" /></a>
</p>

<br>

<sub>© 2026 <b>Sound Meter Pro</b> — Criado por Fabiano Braga (ORCID: 0009-0004-5936-5060) para o ecossistema 4U.IA.BR.</sub>

</div>
