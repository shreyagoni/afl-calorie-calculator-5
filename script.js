const form = document.querySelector('#calorie-form');
const unitButtons = document.querySelectorAll('.unit-button');
const heightInput = document.querySelector('#height');
const weightInput = document.querySelector('#weight');
const heightUnit = document.querySelector('#height-unit');
const weightUnit = document.querySelector('#weight-unit');

let unitSystem = 'metric';

const formatCalories = (value) => Math.round(value / 10) * 10;
const formatNumber = (value) => formatCalories(value).toLocaleString('en-US');

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

unitButtons.forEach((button) => button.addEventListener('click', () => setUnitSystem(button.dataset.unit)));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const age = Number(document.querySelector('#age').value);
  const gender = document.querySelector('#gender').value;
  const heightValue = Number(heightInput.value);
  const weightValue = Number(weightInput.value);
  const activity = Number(document.querySelector('#activity').value);

  if (!age || !heightValue || !weightValue || age < 15 || age > 100) {
    form.reportValidity();
    return;
  }

  const heightCm = unitSystem === 'metric' ? heightValue : heightValue * 2.54;
  const weightKg = unitSystem === 'metric' ? weightValue : weightValue * 0.453592;
  const genderAdjustment = gender === 'male' ? 5 : -161;
  const bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + genderAdjustment;
  const maintenance = formatCalories(bmr * activity);

  document.querySelector('#maintain-calories').textContent = maintenance.toLocaleString('en-US');
  document.querySelector('#loss-calories').textContent = formatNumber(Math.max(1200, maintenance - 500));
  document.querySelector('#gain-calories').textContent = formatNumber(maintenance + 300);
  document.querySelector('#results').classList.add('results-updated');
  document.querySelector('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
