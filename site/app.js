(() => {
  const ranges = {
    temperature: { min: 10, max: 18, label: 'Temperatura' },
    humidity: { min: 50, max: 75, label: 'Umidade' },
    light: { min: 0, max: 35, label: 'Luminosidade' },
  };
  const controls = {
    temperature: document.getElementById('temp-slider'),
    humidity: document.getElementById('humidity-slider'),
    light: document.getElementById('light-slider'),
  };
  const outputs = {
    temperature: document.getElementById('temp-output'),
    humidity: document.getElementById('humidity-output'),
    light: document.getElementById('light-output'),
  };
  const status = document.getElementById('demo-status');
  const symbol = document.getElementById('status-symbol');
  const title = document.getElementById('status-title');
  const copy = document.getElementById('status-copy');
  const led = document.getElementById('led-indicator');
  const reset = document.getElementById('reset-demo');

  function render() {
    const values = Object.fromEntries(Object.entries(controls).map(([key, el]) => [key, Number(el.value)]));
    Object.entries(outputs).forEach(([key, el]) => { el.value = values[key]; });
    const anomalies = Object.entries(ranges).filter(([key, range]) => values[key] < range.min || values[key] > range.max).map(([key, range]) => range.label);
    const hasAlert = anomalies.length > 0;
    status.classList.toggle('alert', hasAlert);
    status.classList.toggle('normal', !hasAlert);
    symbol.textContent = hasAlert ? '!' : '✓';
    title.textContent = hasAlert ? 'Anomalia detectada (simulação)' : 'Ambiente dentro da faixa';
    copy.textContent = hasAlert ? `Fora do limite: ${anomalies.join(', ')}. O alerta continua enquanto houver qualquer anomalia.` : 'Todos os parâmetros estão dentro dos limites de exemplo.';
    led.classList.toggle('active', hasAlert);
  }
  Object.values(controls).forEach((el) => el.addEventListener('input', render));
  reset.addEventListener('click', () => {
    controls.temperature.value = 14;
    controls.humidity.value = 67;
    controls.light.value = 22;
    render();
  });
  render();
})();
