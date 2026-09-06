const form = document.querySelector('#calorie-form');

if (form) {
  const unitButtons = document.querySelectorAll('.unit-button');
  const heightInput = document.querySelector('#height');
  const weightInput = document.querySelector('#weight');
  const heightUnit = document.querySelector('#height-unit');
  const weightUnit = document.querySelector('#weight-unit');
  const historyKey = 'calory-saved-results';
  const profileKey = 'calory-last-profile';

  let unitSystem = 'metric';
  let latestResults = null;

  const formatCalories = (value) => Math.round(value / 10) * 10;
  const formatNumber = (value) => Math.round(value).toLocaleString('en-US');
  const formatWeight = (value) => `${value.toFixed(1)} ${unitSystem === 'metric' ? 'kg' : 'lb'}`;

  function setUnitSystem(nextUnit) {
    if (nextUnit === unitSystem) return;
    const currentHeight = Number(heightInput.value);
    const currentWeight = Number(weightInput.value);
    const switchingToImperial = nextUnit === 'imperial';
    if (currentHeight) heightInput.value = (switchingToImperial ? currentHeight / 2.54 : currentHeight * 2.54).toFixed(1);
    if (currentWeight) weightInput.value = (switchingToImperial ? currentWeight / 0.453592 : currentWeight * 0.453592).toFixed(1);
    unitSystem = nextUnit;
    unitButtons.forEach((button) => button.classList.toggle('active', button.dataset.unit === nextUnit));
    const imperial = nextUnit === 'imperial';
    heightUnit.textContent = imperial ? 'in' : 'cm';
    weightUnit.textContent = imperial ? 'lb' : 'kg';
    heightInput.placeholder = imperial ? '68' : '172';
    weightInput.placeholder = imperial ? '150' : '68';
    heightInput.min = imperial ? '48' : '120';
    heightInput.max = imperial ? '90' : '230';
    weightInput.min = imperial ? '75' : '35';
    weightInput.max = imperial ? '660' : '300';
    heightInput.step = imperial ? '0.1' : '1';
    weightInput.step = imperial ? '0.1' : '1';
  }

  function setText(id, value) {
    const element = document.querySelector(`#${id}`);
    if (element) element.textContent = value;
  }

  function showStatus(message) {
    const status = document.querySelector('#tool-status');
    if (!status) return;
    status.textContent = message;
    window.setTimeout(() => { status.textContent = ''; }, 2600);
  }

  function bmiCategory(bmi) {
    if (bmi < 18.5) return 'under range';
    if (bmi < 25) return 'healthy range';
    if (bmi < 30) return 'above range';
    return 'higher range';
  }

  function updateInsights({ bmr, bmi, healthyMin, healthyMax, waterLitres, protein, carbs, fat }) {
    setText('bmr-value', formatNumber(bmr));
    setText('bmi-value', bmi.toFixed(1));
    setText('bmi-label', bmiCategory(bmi));
    setText('healthy-range', `${formatWeight(healthyMin)} – ${formatWeight(healthyMax)}`);
    setText('water-value', `${waterLitres.toFixed(1)} L`);
    setText('protein-value', formatNumber(protein));
    setText('carbs-value', formatNumber(carbs));
    setText('fat-value', formatNumber(fat));
    const macroCalories = [['protein-bar', protein * 4], ['carbs-bar', carbs * 4], ['fat-bar', fat * 9]];
    const totalMacroCalories = macroCalories.reduce((total, [, calories]) => total + calories, 0);
    macroCalories.forEach(([id, calories]) => {
      const bar = document.querySelector(`#${id}`);
      if (bar) bar.style.width = `${Math.max(5, (calories / totalMacroCalories) * 100)}%`;
    });
  }

  function readHistory() {
    try { return JSON.parse(localStorage.getItem(historyKey) || '[]'); } catch { return []; }
  }

  function renderHistory() {
    const wrapper = document.querySelector('#saved-results');
    const list = document.querySelector('#saved-list');
    const history = readHistory();
    if (!wrapper || !list) return;
    wrapper.hidden = history.length === 0;
    list.innerHTML = history.map((entry, index) => `
      <button class="saved-item" type="button" data-history-index="${index}">
        <span><strong>${entry.maintenance.toLocaleString('en-US')} kcal</strong><small>${entry.date} · ${entry.activity}</small></span>
        <span class="saved-item-arrow">↗</span>
      </button>`).join('');
    list.querySelectorAll('.saved-item').forEach((item) => item.addEventListener('click', () => loadHistory(Number(item.dataset.historyIndex))));
  }

  function loadHistory(index) {
    const entry = readHistory()[index];
    if (!entry) return;
    document.querySelector('#age').value = entry.age;
    document.querySelector('#gender').value = entry.gender;
    document.querySelector('#activity').value = entry.activityValue;
    if (entry.unit !== unitSystem) setUnitSystem(entry.unit);
    heightInput.value = entry.height;
    weightInput.value = entry.weight;
    form.requestSubmit();
    showStatus('Saved check-in loaded');
  }

  unitButtons.forEach((button) => button.addEventListener('click', () => setUnitSystem(button.dataset.unit)));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const age = Number(document.querySelector('#age').value);
    const gender = document.querySelector('#gender').value;
    const heightValue = Number(heightInput.value);
    const weightValue = Number(weightInput.value);
    const activitySelect = document.querySelector('#activity');
    const activity = Number(activitySelect.value);

    if (!age || !heightValue || !weightValue || age < 15 || age > 100) {
      form.reportValidity();
      return;
    }

    const heightCm = unitSystem === 'metric' ? heightValue : heightValue * 2.54;
    const weightKg = unitSystem === 'metric' ? weightValue : weightValue * 0.453592;
    const heightMetres = heightCm / 100;
    const genderAdjustment = gender === 'male' ? 5 : -161;
    const bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + genderAdjustment;
    const maintenance = formatCalories(bmr * activity);
    const bmi = weightKg / (heightMetres * heightMetres);
    const healthyMinKg = 18.5 * heightMetres * heightMetres;
    const healthyMaxKg = 24.9 * heightMetres * heightMetres;
    const healthyMin = unitSystem === 'metric' ? healthyMinKg : healthyMinKg / 0.453592;
    const healthyMax = unitSystem === 'metric' ? healthyMaxKg : healthyMaxKg / 0.453592;
    const protein = weightKg * 1.6;
    const fat = weightKg * 0.8;
    const carbs = Math.max(0, (maintenance - (protein * 4) - (fat * 9)) / 4);

    latestResults = { age, gender, height: heightValue, weight: weightValue, unit: unitSystem, activityValue: activitySelect.value, activity: activitySelect.options[activitySelect.selectedIndex].textContent.split(' — ')[0], maintenance, loss: formatCalories(Math.max(1200, maintenance - 500)), gain: formatCalories(maintenance + 300), bmr, bmi, healthyMin, healthyMax, waterLitres: weightKg * 0.035, protein, carbs, fat };
    localStorage.setItem(profileKey, JSON.stringify({ age, gender, height: heightValue, weight: weightValue, unit: unitSystem, activity: activitySelect.value }));

    setText('maintain-calories', maintenance.toLocaleString('en-US'));
    setText('loss-calories', latestResults.loss.toLocaleString('en-US'));
    setText('gain-calories', latestResults.gain.toLocaleString('en-US'));
    updateInsights(latestResults);
    document.querySelector('#results').classList.add('results-updated');
    document.querySelector('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.querySelector('#save-result')?.addEventListener('click', () => {
    if (!latestResults) { showStatus('Calculate your needs first'); return; }
    latestResults.date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const history = [latestResults, ...readHistory().filter((entry) => entry.maintenance !== latestResults.maintenance || entry.date !== latestResults.date)].slice(0, 4);
    localStorage.setItem(historyKey, JSON.stringify(history));
    renderHistory();
    showStatus('Result saved on this device');
  });

  document.querySelector('#copy-result')?.addEventListener('click', async () => {
    if (!latestResults) { showStatus('Calculate your needs first'); return; }
    const summary = `My Calory estimate: ${latestResults.maintenance} kcal/day to maintain, ${latestResults.loss} kcal/day to lose, ${latestResults.gain} kcal/day to gain. BMI ${latestResults.bmi.toFixed(1)} (${bmiCategory(latestResults.bmi)}). Macros: ${Math.round(latestResults.protein)}g protein, ${Math.round(latestResults.carbs)}g carbs, ${Math.round(latestResults.fat)}g fat.`;
    try { await navigator.clipboard.writeText(summary); showStatus('Summary copied'); } catch { showStatus('Copy is not available here'); }
  });

  document.querySelector('#print-result')?.addEventListener('click', () => {
    if (!latestResults) { showStatus('Calculate your needs first'); return; }
    window.print();
  });

  document.querySelector('#clear-saves')?.addEventListener('click', () => {
    localStorage.removeItem(historyKey);
    renderHistory();
    showStatus('Saved check-ins cleared');
  });

  try {
    const profile = JSON.parse(localStorage.getItem(profileKey) || 'null');
    if (profile) {
      document.querySelector('#age').value = profile.age;
      document.querySelector('#gender').value = profile.gender;
      document.querySelector('#activity').value = profile.activity;
      if (profile.unit && profile.unit !== unitSystem) setUnitSystem(profile.unit);
      heightInput.value = profile.height;
      weightInput.value = profile.weight;
    }
  } catch { /* Ignore unavailable or malformed local storage. */ }

  renderHistory();
}
